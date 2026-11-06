// The night sky as one enormous imaginary circuit. Seen from a distance it is a plain starfield and a faint galactic
// band. Up close a few constellations turn out to be stars wired together by hairline traces: vias and pads at the
// stars, and the odd schematic symbol (resistor, capacitor, diode, ground) along the way.
import { W, n, rng, gauss, fbm, pixels, ring, rect, farY } from './footerScene';

const rnd = rng(0x5ca1ab);

const stars: number[][][] = [[], [], []];
for (let i = 0; i < 520; i++) {
	const x = rnd() * W, y = rnd() ** 1.3 * 380;
	if (y > farY(x) - 6) continue;
	const r = rnd();
	stars[r < 0.66 ? 0 : r < 0.92 ? 1 : 2].push([x, y]);
}
// the brightest few get diffraction spikes, the next few twinkle like status LEDs
const sparkles = stars[2].splice(0, 6).map(([x, y], i) => ({ x: n(x), y: n(y), s: i < 2 ? 3.4 : 2.2 }));
const leds = stars[2].splice(0, 14).map(([x, y], i) => ({ x: n(x), y: n(y), d: n((i * 2.37) % 11), amber: i % 5 === 2 }));
// and a scatter of ordinary stars breathe slowly, each on its own period so they never pulse together
const twinkles = stars[1].splice(0, 44).map(([x, y], i) => ({ x: n(x), y: n(y), d: n((i * 1.73) % 9), t: n(4.5 + ((i * 2.9) % 5)) }));

// a faint galactic band with a broken dust lane
const milky: number[][][] = [[], []];
for (let i = 0; i < 1400; i++) {
	const t = rnd(), off = gauss(rnd) * 30 * (0.6 + t);
	const x = 1900 - t * 1500 + off * 0.42, y = 6 + t * 300 - off * 0.9;
	if (Math.abs(off) < 6 && fbm(t * 900, 60, 3) > 0.45) continue;
	if (x < 0 || x > W || y > farY(x) - 6) continue;
	milky[Math.abs(off) < 18 && rnd() < 0.35 ? 1 : 0].push([x, y]);
}

// ---------- constellations ----------

// symbols drawn along +x, centred on the origin, 10 units long
const SYM: Record<string, string> = {
	res: 'M-5 0h1.6l.6-1.4 1.2 2.8 1.2-2.8 1.2 2.8 1.2-2.8 1.2 2.8.6-1.4h1.6',
	cap: 'M-5 0h4.2M-.8-2.4v4.8M.8-2.4v4.8M.8 0h4.2',
	dio: 'M-5 0h3M-2-2.2v4.4L1.8 0Z M1.8-2.2v4.4M1.8 0h3.2',
};
type Node = { x: number; y: number; k?: 'via' | 'pad' | 'gnd' };
type Edge = [number, number, string?, boolean?]; // from, to, a symbol on the way, diagonal first
// each one sits in open sky, clear of the peaks
const CONST: { nodes: Node[]; edges: Edge[] }[] = [
	{
		nodes: [{ x: 548, y: 70, k: 'via' }, { x: 612, y: 44 }, { x: 678, y: 76, k: 'pad' }, { x: 734, y: 58, k: 'via' }, { x: 712, y: 124 }, { x: 800, y: 102, k: 'via' }],
		edges: [[0, 1], [1, 2, 'res'], [2, 3], [2, 4, undefined, true], [3, 5]],
	},
	{
		nodes: [{ x: 962, y: 112, k: 'via' }, { x: 1026, y: 150 }, { x: 1092, y: 128, k: 'pad' }, { x: 1066, y: 208, k: 'via' }, { x: 1130, y: 236, k: 'gnd' }],
		edges: [[0, 1], [1, 2, 'cap'], [1, 3, undefined, true], [3, 4]],
	},
	{
		nodes: [{ x: 1508, y: 54, k: 'via' }, { x: 1572, y: 30 }, { x: 1648, y: 58, k: 'pad' }, { x: 1700, y: 112, k: 'via' }, { x: 1782, y: 92 }, { x: 1626, y: 132 }],
		edges: [[0, 1], [1, 2], [2, 3, 'dio'], [3, 4], [3, 5, undefined, true]],
	},
	{
		nodes: [{ x: 52, y: 58, k: 'via' }, { x: 112, y: 96 }, { x: 170, y: 74, k: 'pad' }, { x: 206, y: 150, k: 'via' }],
		edges: [[0, 1], [1, 2, 'res'], [1, 3, undefined, true]],
	},
];

const net = { lines: [] as string[], nodes: '', pads: '', syms: [] as { d: string; t: string }[], dots: [] as { x: number; y: number; d: number }[] };
for (const [ci, c] of CONST.entries()) {
	let d = '';
	for (const [a, b, sym, vfirst] of c.edges) {
		const p = c.nodes[a], q = c.nodes[b], dx = q.x - p.x, dy = q.y - p.y, lo = Math.min(Math.abs(dx), Math.abs(dy));
		// one straight run and one 45° run, the way a trace is routed
		const gx = Math.sign(dx), gy = Math.sign(dy);
		const bend = vfirst ? [p.x + gx * lo, p.y + gy * lo] : Math.abs(dx) >= Math.abs(dy) ? [q.x - gx * lo, p.y] : [p.x, q.y - gy * lo];
		const legs = [[p.x, p.y], bend, [q.x, q.y]];
		if (!sym) {
			d += `M${legs.map((v) => `${n(v[0])} ${n(v[1])}`).join('L')}`;
			continue;
		}
		// the symbol breaks the longer leg at its middle
		const long = Math.hypot(legs[1][0] - legs[0][0], legs[1][1] - legs[0][1]) > Math.hypot(legs[2][0] - legs[1][0], legs[2][1] - legs[1][1]) ? 0 : 1;
		const [s, e] = [legs[long], legs[long + 1]], l = Math.hypot(e[0] - s[0], e[1] - s[1]), ux = (e[0] - s[0]) / l, uy = (e[1] - s[1]) / l;
		const m = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
		const cut = (k: number) => `${n(m[0] + ux * 5 * k)} ${n(m[1] + uy * 5 * k)}`;
		d += long === 0 ? `M${n(s[0])} ${n(s[1])}L${cut(-1)}M${cut(1)}L${n(e[0])} ${n(e[1])}L${n(legs[2][0])} ${n(legs[2][1])}` : `M${n(legs[0][0])} ${n(legs[0][1])}L${n(s[0])} ${n(s[1])}L${cut(-1)}M${cut(1)}L${n(e[0])} ${n(e[1])}`;
		net.syms.push({ d: SYM[sym], t: `translate(${n(m[0])} ${n(m[1])}) rotate(${n((Math.atan2(uy, ux) * 180) / Math.PI)})` });
	}
	net.lines.push(d);
	for (const p of c.nodes) {
		if (p.k === 'via') net.nodes += ring(p.x, p.y, 2);
		if (p.k === 'pad') net.pads += rect(p.x - 1.8, p.y - 1.8, 3.6, 3.6);
		if (p.k === 'gnd') net.nodes += `M${p.x} ${p.y}v3M${p.x - 4} ${p.y + 3}h8M${p.x - 2.6} ${p.y + 5}h5.2M${p.x - 1.2} ${p.y + 7}h2.4`;
		if (p.k !== 'gnd') net.dots.push({ x: p.x - 0.75, y: p.y - 0.75, d: n((ci * 3.1 + net.dots.length * 0.9) % 8) });
	}
}

export const sky = {
	stars: stars.map((s, i) => pixels(s, i === 2 ? 1.5 : i === 1 ? 1.2 : 1)),
	sparkles,
	leds,
	twinkles,
	milky: milky.map((m) => pixels(m, 1)),
	circuit: net,
};
