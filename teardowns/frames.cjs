#!/usr/bin/env node
// Renders each drawing as an exploding flipbook for the inline article figure.
// Writes <id>.json (view box, colors, last frame) for the server render and
// <id>-frames.json (every frame) for the browser to fetch when the figure nears view.
// Usage: node frames.cjs drawing.json <figure dir> <public dir>
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {RUNTIME, load} = require('./tools/teardown/scripts/config.cjs');

// Labels render in the page's JetBrains Mono, whose advance is 0.6 em, at the
// drawing's labelSize in sheet mm (4.2 by default).
const FRAMES = 24, LABEL_SIZE = 4.2;
// cubic-bezier(.65, 0, .35, 1), as the bundled viewer's flipbook uses
const ease = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

function bounds(markup, size) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  };
  for (const [, d] of markup.matchAll(/ d="([^"]*)"/g)) {
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) add(n[i], n[i + 1]);
  }
  for (const [, attrs, text] of markup.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const x = Number(attrs.match(/ x="([^"]*)"/)[1]), y = Number(attrs.match(/ y="([^"]*)"/)[1]);
    const width = text.length * .6 * size, anchor = attrs.match(/text-anchor="(\w+)"/)?.[1] ?? 'start';
    const left = x - width * {start: 0, middle: .5, end: 1}[anchor];
    add(left, y - size);
    add(left + width, y + 1);
  }
  return [x0, y0, x1, y1];
}

// Re-encode absolute M/L/C/Z path data as relative moves at 0.1 mm, about
// 0.3 px at article width. Every point is rounded relative to the path's first
// point, so error never accumulates and a translated shape encodes identically.
function compact(d) {
  const num = n => (n / 10).toString().replace(/^(-?)0\./, '$1.');
  const pair = (dx, dy) => num(dx) + (dy < 0 ? '' : ' ') + num(dy);
  let out = '', origin = null, started = false, x = 0, y = 0, sx = 0, sy = 0;
  for (const [, cmd, args] of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    if (cmd === 'Z') {
      out += 'z';
      [x, y] = [sx, sy];
      continue;
    }
    const n = args.trim().split(/[\s,]+/).map(Number), pts = [];
    if (!origin) {
      origin = [n[0], n[1]];
      out += 'm' + pair(Math.round(origin[0] * 10), Math.round(origin[1] * 10));
    }
    for (let i = 0; i < n.length; i += 2) pts.push([Math.round((n[i] - origin[0]) * 10), Math.round((n[i + 1] - origin[1]) * 10)]);
    const step = cmd === 'C' ? 3 : 1;
    for (let i = 0; i < pts.length; i += step) {
      const group = pts.slice(i, i + step), [ex, ey] = group.at(-1);
      if (started) out += (cmd === 'M' ? (i === 0 ? 'm' : 'l') : cmd.toLowerCase()) + group.map(([px, py]) => pair(px - x, py - y)).join(' ');
      [x, y] = [ex, ey];
      started = true; // the first point is the origin, already written above
      if (cmd === 'M' && i === 0) [sx, sy] = [x, y];
    }
  }
  return out.replace(/ -/g, '-');
}
const slim = markup => markup
  .replace(/ d="([^"]*)"/g, (_, d) => ` d="${compact(d)}"`)
  .replace(/ fill="none"| data-covers=""/g, '');

// Path data repeats across frames wherever a part only translates, since compact()
// makes everything after the first move relative. Long repeats go into a shared
// table and frames reference them as ~index; Teardown.astro expands them.
function dictionary(frames) {
  const table = [], index = new Map();
  const packed = frames.map(markup => markup.replace(/ d="(m-?[\d.]+[ -]?-?[\d.]+)([^"]{40,})"/g, (_, head, tail) => {
    if (!index.has(tail)) index.set(tail, table.push(tail) - 1);
    return ` d="${head}~${index.get(tail)}"`;
  }));
  return {frames: packed, table};
}

const union = boxes => boxes.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
const PAD = 2, toViewBox = b => [b[0] - PAD, b[1] - PAD, b[2] - b[0] + 2 * PAD, b[3] - b[1] + 2 * PAD];
// Grow a view box about its center to the given width:height aspect.
function toAspect([x, y, w, h], aspect) {
  const W = Math.max(w, h * aspect), H = W / aspect;
  return [x - (W - w) / 2, y - (H - h) / 2, W, H].map(n => +n.toFixed(2));
}

const [configPath, figureDir, publicDir] = process.argv.slice(2);
if (!configPath || !figureDir || !publicDir) throw Error('Usage: node frames.cjs drawing.json <figure dir> <public dir>');
const {config, modelScripts} = load(configPath);
const context = {console, structuredClone};
context.self = context;
vm.createContext(context);
for (const file of [...RUNTIME, ...modelScripts]) vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});

for (const d of config.drawings) {
  const model = context.DrawingModels[d.id], defaults = Object.fromEntries(d.parameters.map(p => [p.key, p.default]));
  const count = d.frames ?? FRAMES;
  const size = d.labelSize ?? LABEL_SIZE;
  const frames = Array.from({length: count}, (_, i) => model(defaults, {
    explosion: ease(i / (count - 1)), fitExplosion: 1, isolated: null, fill: true, annotate: true, labels: i === count - 1,
  }).markup.replace(/(<text[^>]*?) font-size="[^"]*"/g, `$1 font-size="${size}"`));
  const boxes = frames.map(m => bounds(m, size));
  // A zooming drawing keeps the final frame's aspect, so the figure never changes height.
  const final = toViewBox(boxes.at(-1)), aspect = final[2] / final[3];
  const viewBoxes = d.zoom ? boxes.map(b => toAspect(toViewBox(b), aspect)) : null;
  const viewBox = viewBoxes ? viewBoxes.at(-1) : toViewBox(union(boxes)).map(n => +n.toFixed(2));
  const figure = {viewBox, colors: d.colors ?? {hues: {}, fills: []}, title: d.title, description: d.description, final: slim(frames.at(-1))};
  fs.writeFileSync(path.join(figureDir, `${d.id}.json`), JSON.stringify(figure));
  const json = JSON.stringify({...dictionary(frames.map(slim)), viewBoxes});
  fs.writeFileSync(path.join(publicDir, `${d.id}-frames.json`), json);
  console.log(`${d.id}: ${count} frames, ${(json.length / 1024).toFixed(0)} KB, view box ${viewBox.join(' ')}`);
}
