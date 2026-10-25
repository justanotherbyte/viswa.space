// Software teardowns of the VEGA ground station, one per design. Each program
// is a coloured plate with a small etched or raised detail that hints at what it
// does; hardware is a grey base plate. Exploded, the layers lift straight up.
self.DrawingModels ??= {};
(() => {
  const G = () => TechnicalGeometry;
  const T = 4; // plate thickness
  let LIFT = 42; // rise between exploded layers, set per drawing

  function plate(parts, id, name, [x0, y0, x1, y1], level, z0 = level * (T + .5)) {
    const p = G().part(id, name);
    G().box(p, [x0, y0, z0], [x1, y1, z0 + T], {radius: 3});
    p.top = z0 + T;
    p.explosion = [0, 0, level * LIFT];
    parts.push(p);
    return p;
  }
  // Details on a plate's top face, in plate-local x/y from the given corner.
  const etch = (p, [x0, y0], points, closed = false) =>
    G().polyline(p, points.map(([x, y]) => [x0 + x, y0 + y, p.top + .1]), {closed, role: 'detail'});
  const raise = (p, [x0, y0], [a, b, c, d], h = 3) => G().box(p, [x0 + a, y0 + b, p.top], [x0 + c, y0 + d, p.top + h]);
  const puck = (p, [x0, y0], [x, y], r, h, z = 0) =>
    G().lathe(p, [[0, 0], [0, r], [h, r], [h, 0]], {axis: 'z', at: [x0 + x, y0 + y, p.top + z], segments: 32});
  const arc = (cx, cy, r, a0, a1, n = 12) => Array.from({length: n + 1}, (_, i) => {
    const a = a0 + (a1 - a0) * i / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  // Port outlines on the face toward the viewer (y = y0).
  const ports = (p, x0, y0, z0, xs) => {
    for (const x of xs) G().polyline(p, [[x0 + x, y0 - .1, z0 + 1.2], [x0 + x + 7, y0 - .1, z0 + 1.2], [x0 + x + 7, y0 - .1, z0 + 2.8], [x0 + x, y0 - .1, z0 + 2.8]], {closed: true, role: 'detail'});
  };
  // The renderer gets plain parts, without the `top` bookkeeping.
  const clean = parts => parts.map(({top, ...p}) => p);

  // ---------------- Original: everything on the RevPi ----------------
  function original() {
    const parts = [];
    const host = plate(parts, 'host', 'RevPi running Ubuntu', [0, 0, 200, 140], 0);
    ports(host, 0, 0, 0, [10, 22, 34]);

    const docker = plate(parts, 'docker', 'Docker', [0, 0, 120, 140], 1);
    // Container ribs along its front edge.
    for (let x = 6; x < 120; x += 6) G().line(docker, [x, -.1, docker.top - T + .6], [x, -.1, docker.top - .6], 'detail');

    const nodeRed = plate(parts, 'node-red', 'Node-RED', [126, 0, 200, 140], 1);
    // Three wired nodes, the shape of a flow.
    for (const [x, y] of [[8, 98], [8, 58], [40, 78]]) G().box(nodeRed, [126 + x, y, nodeRed.top], [126 + x + 24, y + 12, nodeRed.top + 3], {radius: 4});
    etch(nodeRed, [126, 0], [[32, 104], [36, 104], [36, 84], [40, 84]]);
    etch(nodeRed, [126, 0], [[32, 64], [36, 64], [36, 84], [40, 84]]);

    const influx = plate(parts, 'influxdb', 'InfluxDB', [0, 0, 57, 140], 2);
    for (let i = 0; i < 3; i++) puck(influx, [0, 0], [28.5, 75], 15, 5, i * 6);

    const grafana = plate(parts, 'grafana', 'Grafana', [63, 0, 120, 140], 2);
    etch(grafana, [63, 0], [[6, 92], [6, 128], [51, 128], [51, 92]], true);
    etch(grafana, [63, 0], [[10, 98], [18, 112], [25, 104], [33, 120], [40, 110], [47, 122]]);
    for (const y of [30, 50, 70]) raise(grafana, [63, 0], [12, y, 45, y + 10], 2.5);
    return clean(parts);
  }

  // ---------------- Current: Python on the laptop and on the RevPi ----------------
  function current() {
    const parts = [];
    const laptop = plate(parts, 'laptop', 'Operator laptop', [0, 0, 220, 140], 0);
    for (const y of [40, 62, 84, 106]) G().line(laptop, [14, y, laptop.top + .1], [206, y, laptop.top + .1], 'texture');

    // Threads, with telemetry flowing right to left: DAQ, buffer, main, queue, DTM.
    const thread = (id, name, x0) => {
      const p = plate(parts, id, name, [x0, 10, x0 + 56, 130], 1);
      etch(p, [x0, 10], Array.from({length: 21}, (_, i) => [8 + i * 2, 16 + 7 * Math.sin(i * .9)]));
      return p;
    };
    thread('thread-dtm', 'DTM thread', 0);
    thread('thread-main', 'Main thread', 82);
    thread('thread-daq', 'DAQ thread', 164);
    const buffer = plate(parts, 'buffer', 'Last-value buffer', [139, 52, 161, 88], 1);
    puck(buffer, [139, 52], [11, 18], 6, 3);
    const queue = plate(parts, 'queue', 'Queue', [57, 46, 81, 94], 1);
    for (const y of [5, 15, 25, 35]) raise(queue, [57, 46], [6, y, 18, y + 7], 2.5);

    const dash = plate(parts, 'dash', 'Dash UI', [82, 44, 138, 130], 2);
    etch(dash, [82, 44], [[6, 46], [6, 80], [50, 80], [50, 46]], true);
    etch(dash, [82, 44], [[10, 52], [18, 66], [26, 58], [34, 74], [42, 64], [47, 76]]);
    for (const [x, y] of [[8, 8], [29, 8], [8, 26], [29, 26]]) raise(dash, [82, 44], [x, y, x + 19, y + 14], 2.5);

    // The link between the machines: CAT6 at the base, ZeroMQ channels at the thread layer.
    plate(parts, 'cat6', 'CAT6 cable', [220, 62, 320, 78], 0, 1);
    const channel = (id, name, y0, toRight) => {
      const p = plate(parts, id, name, [226, y0, 314, y0 + 16], 1);
      const [a, b] = toRight ? [12, 76] : [76, 12], tip = toRight ? -8 : 8;
      etch(p, [226, y0], [[a, 8], [b, 8]]);
      etch(p, [226, y0], [[b + tip, 3], [b, 8], [b + tip, 13]]);
    };
    channel('zmq-telemetry', 'ZeroMQ telemetry', 94, false);
    channel('zmq-commands', 'ZeroMQ commands', 30, true);

    const revpi = plate(parts, 'revpi', 'RevPi', [320, 0, 480, 140], 0);
    ports(revpi, 320, 0, 0, [12, 24, 36, 48]);
    const loop = plate(parts, 'loop', 'Control loop', [320, 0, 480, 140], 1);
    const gear = Array.from({length: 48}, (_, i) => {
      const a = i * Math.PI / 24, r = i % 4 < 2 ? 22 : 17;
      return [80 + r * Math.cos(a), 26 + r * Math.sin(a)];
    });
    etch(loop, [320, 0], gear, true);
    etch(loop, [320, 0], arc(80, 26, 7, 0, 2 * Math.PI, 16));

    const job = (id, name, x0, draw) => draw(plate(parts, id, name, [x0, 56, x0 + 50, 136], 2), [x0, 56]);
    job('polling', 'Sensor polling', 320, (p, o) => {
      etch(p, o, arc(25, 34, 16, Math.PI, 2 * Math.PI));
      etch(p, o, [[25, 34], [35, 22]]);
    });
    job('valve-io', 'Valve I/O', 375, (p, o) => etch(p, o, [[10, 25], [10, 55], [40, 25], [40, 55]], true));
    job('relay', 'Command relay', 430, (p, o) => {
      etch(p, o, [[25, 20], [25, 52]]);
      for (const r of [8, 14]) {
        etch(p, o, arc(25, 52, r, -Math.PI / 4, Math.PI / 4, 8));
        etch(p, o, arc(25, 52, r, 3 * Math.PI / 4, 5 * Math.PI / 4, 8));
      }
    });
    return clean(parts);
  }

  // The original is one stack; the current design is two machines side by side, so its camera turns nearer side-on.
  for (const [id, build, lift, camera] of [
    ['gse-original', original, 42, {azimuth: -55, elevation: 30, roll: 0}],
    ['gse-current', current, 72, {azimuth: -72, elevation: 34, roll: 0}],
  ]) {
    self.DrawingModels[id] = (parameters, options) => {
      LIFT = lift;
      return TechnicalProjection.render(build(), {...options, camera});
    };
  }
})();
