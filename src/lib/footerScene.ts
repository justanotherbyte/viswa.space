// Procedural geometry for the footer artwork, computed at build time from one seed so every build draws the same world.
export const W = 1920, H = 660;
export const G = 496; // plateau top, where the launch site stands
export const BOARD = 528; // top edge of the circuit board
export const SUN = { x: 1468, y: 414, r: 126 };
export const TOWER = 546; // lattice tower centre line
export const ROCKET = { x: TOWER + 13, y: G - 8 }; // nozzle position on the rail

let seed = 0x2f6b1d;
const rnd = () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const n = (v: number) => Math.round(v * 10) / 10;
const LAT = Array.from({ length: 1024 }, rnd);
const vnoise = (x: number) => {
	const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f);
	return LAT[i & 1023] * (1 - k) + LAT[(i + 1) & 1023] * k;
};
const octaves = (x: number, scale: number, o: number, f: (v: number) => number) => {
	let a = 0, sum = 0;
	for (let i = 0; i < 5; i++) {
		const w = 1 / 2 ** i;
		a += f(vnoise(x / (scale / 2 ** i) + o + i * 53)) * w;
		sum += w;
	}
	return a / sum;
};
const fbm = (x: number, scale: number, o = 0) => octaves(x, scale, o, (v) => v);
// ridged noise folds the noise at its midpoint, which is what gives peaks their sharp crests
const ridged = (x: number, scale: number, o = 0) => octaves(x, scale, o, (v) => (1 - Math.abs(2 * v - 1)) ** 2);
const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
const pick = (s: string) => s[Math.floor(rnd() * s.length)];

export const line = (pts: number[][]) => 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
export const pixels = (pts: number[][], s = 1) => pts.map(([x, y]) => `M${n(x)} ${n(y)}h${s}v${s}h-${s}z`).join('');
export const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
export const ring = (x: number, y: number, r: number) => `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const xs = (step: number, from = 0, to = W) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

export type Row = { x: number; y: number; len: number; text: string; cls: string };

// ---------- sky ----------

const clear = (x: number, y: number) => Math.hypot(x - SUN.x, y - SUN.y) > SUN.r + 70;
const farY = (x: number) =>
	420 -
	(24 + 130 * ridged(x, 380, 1)) * (1 - 0.82 * bump(x, SUN.x, 220)) * (0.6 + 0.3 * bump(x, 300, 300) + 0.3 * bump(x, 1880, 200)) -
	190 * bump(x, 820, 120) * (0.55 + 0.6 * ridged(x, 70, 5));

const stars: number[][][] = [[], [], []];
for (let i = 0; i < 520; i++) {
	const x = rnd() * W, y = rnd() ** 1.35 * 400;
	if (!clear(x, y) || y > farY(x) - 8) continue;
	const r = rnd();
	stars[r < 0.62 ? 0 : r < 0.9 ? 1 : 2].push([x, y]);
}
// the brightest few get diffraction spikes, the next few twinkle
const sparkles = stars[2].splice(0, 9).map(([x, y], i) => ({ x: n(x), y: n(y), s: i < 3 ? 4 : 2.6 }));
const twinkles = stars[2].splice(0, 14).map(([x, y], i) => ({ x: n(x), y: n(y), d: n((i * 1.91) % 7) }));

// a faint galactic band with a broken dust lane through it
const milky: number[][][] = [[], []];
for (let i = 0; i < 1400; i++) {
	const t = rnd(), off = gauss() * 34 * (0.6 + t);
	const x = -60 + t * 1500 + off * 0.42, y = 10 + t * 330 + off * 0.9;
	if (Math.abs(off) < 7 && fbm(t * 900, 60, 3) > 0.45) continue;
	if (x < 0 || x > W || !clear(x, y) || y > farY(x) - 6) continue;
	milky[Math.abs(off) < 20 && rnd() < 0.35 ? 1 : 0].push([x, y]);
}

export const sky = {
	stars: stars.map((s, i) => pixels(s, i === 2 ? 1.6 : i === 1 ? 1.2 : 1)),
	sparkles,
	twinkles,
	milky: milky.map((m) => pixels(m, 1)),
	orbits: ['M-40 360C420 40 1240 -10 1960 230', 'M260 -20C700 150 1300 200 1960 120'],
};

// ---------- sun ----------

const sunRows: Row[] = [];
for (let k = 0, y = SUN.y - SUN.r + 4; y < 432; k++) {
	const half = Math.sqrt(Math.max(0, SUN.r ** 2 - (y - SUN.y) ** 2));
	const cols = Math.max(1, Math.round((2 * half) / 4.8));
	sunRows.push({ x: n(SUN.x - half), y: n(y), len: n(2 * half), text: (k < 8 ? '=' : '-').repeat(cols), cls: `s${Math.min(4, Math.floor(k / 4.4))}` });
	y += 5.2 + k * 0.42; // the slices widen towards the horizon
}
const glow: number[][][] = [[], [], []];
for (let y = SUN.y - SUN.r - 96; y < 430; y += 4)
	for (let x = SUN.x - SUN.r - 120; x < SUN.x + SUN.r + 120; x += 4) {
		const d = Math.hypot(x - SUN.x, y - SUN.y) - SUN.r;
		if (d < 3 || d > 120 || rnd() > 0.62 * Math.exp(-d / 26)) continue;
		glow[d < 22 ? 0 : d < 55 ? 1 : 2].push([x + rnd() * 3, y + rnd() * 3]);
	}
export const sun = {
	rows: sunRows,
	glow: glow.map((g) => pixels(g, 1)),
	// two atmospheric layers cut across the disc and run out along the horizon
	bands: [SUN.y - 40, SUN.y - 22].map((y) => ({
		cut: `M${SUN.x - SUN.r} ${y}H${SUN.x + SUN.r}`,
		streak: `M${SUN.x - 420} ${y}H${SUN.x - SUN.r - 6}M${SUN.x + SUN.r + 6} ${y}H${SUN.x + 380}`,
	})),
};

// clouds: thin bands of broken strokes and dots, lit lavender (amber near the sun) on the sun-facing side and underside
const cloud = (cx: number, cy: number, w: number, rows: number) => {
	const d = ['', '', ''], masks: string[] = [];
	const side = Math.sign(SUN.x - cx), near = Math.abs(SUN.x - cx) < 380;
	for (let r = 0; r < rows; r++) {
		const t = rows === 1 ? 0 : (r / (rows - 1)) * 2 - 1;
		const half = (w / 2) * Math.sqrt(1 - 0.75 * t * t) * (0.65 + 0.35 * rnd());
		const x0 = cx - half + (rnd() - 0.5) * w * 0.14 + r * w * 0.04, x1 = x0 + 2 * half, y = cy + r * 3.4;
		for (let x = x0; x < x1; ) {
			const u = (x - x0) / (x1 - x0), edge = Math.min(u, 1 - u);
			const len = edge < 0.12 ? rnd() * 2 : 2 + rnd() * 10;
			const lit = side * (u - 0.5) > 0.18 || (r === rows - 1 && rnd() < 0.7);
			const k = lit ? (near && (r === rows - 1 || rnd() < 0.3) ? 2 : 1) : 0;
			d[k] += len < 1 ? `M${n(x)} ${n(y - 0.5)}h1v1h-1z` : `M${n(x)} ${n(y)}h${n(len)}`;
			x += len + 1.5 + rnd() * (edge < 0.15 ? 9 : 3.5);
		}
		masks.push(rect(x0 - 3, y - 1.7, x1 - x0 + 6, 3.4));
	}
	return { d, mask: masks.join('') };
};
export const clouds = [
	cloud(1440, 330, 300, 4),
	cloud(1700, 282, 190, 5),
	cloud(1180, 236, 320, 6),
	cloud(1760, 150, 170, 4),
	cloud(880, 258, 240, 4),
	cloud(360, 150, 340, 6),
	cloud(560, 70, 200, 3),
];

// ---------- mountains ----------

const midY = (x: number) =>
	448 - (18 + 98 * ridged(x, 240, 7)) * (1 - 0.85 * bump(x, SUN.x, 200)) * (0.65 + 0.5 * bump(x, 300, 420) + 0.35 * bump(x, 1820, 260));
const nearY = (x: number) =>
	468 - (8 + 70 * ridged(x, 150, 13)) * (0.22 + 0.95 * bump(x, 120, 440) + 0.75 * bump(x, 1860, 280) + 0.25 * bump(x, 920, 160));

// hachures: strokes down the fall line on shadowed flanks, sparse pixels on the flanks that face the sun
const texture = (f: (x: number) => number, depth: number, step: number, p: number, decay: number) => {
	let hatch = '', dots = '';
	for (let x = 0; x <= W; x += step) {
		const slope = (f(x + 3) - f(x - 3)) / 6;
		for (let j = 0; j * 4.5 < depth; j++) {
			if (rnd() > p * Math.exp(-j / decay)) continue;
			const xx = x + rnd() * step, y = f(xx) + 3 + j * 4.5 + rnd() * 2;
			const shade = slope < -0.1, len = 2.5 + rnd() * 5;
			if (shade || rnd() < 0.3) {
				const k = (f(xx + len) - f(xx)) / len;
				hatch += `M${n(xx)} ${n(y)}l${n(len)} ${n(k * len)}`;
			} else if (rnd() < 0.5) dots += `M${n(xx)} ${n(y)}h1v1h-1z`;
		}
	}
	return { hatch, dots };
};
const ridge = (f: (x: number) => number, rim: number) => {
	const pts = xs(3).map((x) => [x, f(x)]);
	let lit = '', pen = false;
	for (const [x, y] of pts) {
		const on = Math.abs(x - SUN.x) < rim;
		if (on) lit += `${pen ? 'L' : 'M'}${n(x)} ${n(y)}`;
		pen = on;
	}
	return { fill: line([[0, H], ...pts, [W, H]]) + 'Z', edge: line(pts), lit };
};
export const mountains = {
	far: { ...ridge(farY, 300), ...texture(farY, 70, 4, 0.55, 4) },
	mid: { ...ridge(midY, 230), ...texture(midY, 60, 3, 0.6, 4) },
	near: { ...ridge(nearY, 130), ...texture(nearY, 64, 3, 0.7, 5) },
	// lit snow on the massif's summit
	snow: pixels(xs(2, 700, 940).flatMap((x) => Array.from({ length: 6 }, (_, j) => [x + rnd() * 2, farY(x) + 2 + j * 3 + rnd() * 2]).filter((_, j) => rnd() < 0.6 * Math.exp(-j / 2.2) * bump(x, 820, 80))), 1),
	// valley mist between the ranges
	haze: [432, 441, 452, 460].map((y) => {
		let d = '';
		for (let x = rnd() * 80; x < W; ) {
			const len = 60 + rnd() * 260;
			d += `M${n(x)} ${y}h${n(len)}`;
			x += len + 30 + rnd() * 120;
		}
		return d;
	}),
};

// ---------- valley floor and river ----------

const river = (t: number) => ({ x: 1500 - 560 * t * t * (3 - 2 * t) + 110 * Math.sin(9 * t) * t * (1 - t), y: 474 + 54 * t ** 1.6 });
const riverW = (t: number) => 2 + 40 * t ** 1.8;
const ts = Array.from({ length: 81 }, (_, i) => i / 80);
const offset = (k: number) =>
	ts.map((t) => {
		const a = river(Math.max(0, t - 0.01)), b = river(Math.min(1, t + 0.01)), p = river(t);
		const len = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
		return [p.x + nx * riverW(t) * k, p.y + ny * riverW(t) * k * 0.35];
	});
const banks = [offset(-0.5), offset(0.5)];
const mouth = [-0.5, -0.17, 0.17, 0.5].map((k) => offset(k).at(-1)!).sort((a, b) => a[0] - b[0]);
const rows: string[] = [];
for (let k = 0; k < 11; k++) {
	const y = 474 + 52 * (k / 10) ** 1.5;
	let d = '';
	for (let x = rnd() * 40; x < W; ) {
		const len = 30 + rnd() * 200;
		d += `M${n(x)} ${n(y)}h${n(len)}`;
		x += len + 6 + rnd() * 40;
	}
	rows.push(d);
}
export const valley = {
	rows,
	river: line([...banks[0], ...banks[1].toReversed()]) + 'Z',
	banks: banks.map(line),
	flow: [-0.17, 0.17].map((k) => line(offset(k))),
	// sun glints on the water directly below the disc
	glints: pixels(
		ts.flatMap((t) => {
			const p = river(t);
			return Math.abs(p.x - SUN.x) < 34 && rnd() < 0.9 ? [[p.x + (rnd() - 0.5) * riverW(t), p.y - 0.5]] : [];
		}),
		1.2,
	),
	mouth,
	far: 'M1638 482l1.2-16M1634 482h8M1636 482l2.2-5 2.2 5',
};

// ---------- plateau, cliff, ignition glow ----------

const tufts = xs(9, 4, 860).flatMap((x) => {
	const r = rnd();
	return r < 0.06 ? [`M${n(x)} ${G}l1-2.4 1 2.4`] : r < 0.3 ? [`M${n(x)} ${G - 1.4}h${n(1 + rnd() * 2)}v1.4`] : [];
});
const strata = [G + 7, G + 13, G + 20, G + 26].map((y, i) => {
	let d = '';
	for (let x = rnd() * 30; x < 860 + i * 10; ) {
		const len = 20 + rnd() * 110;
		d += `M${n(x)} ${n(y + (rnd() - 0.5) * 1.5)}h${n(len)}`;
		x += len + 4 + rnd() * 24;
	}
	return d;
});
const pebbles = pixels(
	Array.from({ length: 220 }, () => [rnd() * 880, G + 3 + rnd() * 28]).filter(([x, y]) => y < BOARD - 2 && x < 860 + (y - G) * 1.4),
	1,
);
const cracks = Array.from({ length: 26 }, () => `M${n(rnd() * 860)} ${n(G + 2 + rnd() * 10)}l${n((rnd() - 0.5) * 3)} ${n(4 + rnd() * 10)}`).join('');
export const plateau = {
	fill: `M0 ${G}H860L874 ${G + 8}L886 ${G + 13}L904 ${BOARD}V${H}H0Z`,
	edge: `M0 ${G}H860L874 ${G + 8}L886 ${G + 13}L904 ${BOARD}`,
	tufts: tufts.join(''),
	strata,
	pebbles,
	cracks,
	// the patch of ground and dust the motor lights up
	glow: pixels(
		Array.from({ length: 260 }, () => [ROCKET.x + gauss() * 46, G - 1 + Math.abs(gauss()) * 8 - (rnd() < 0.25 ? rnd() * 10 : 0)]).filter(([x]) => x > 420 && x < 720),
		1.2,
	),
};

// ---------- launch tower ----------

const tower: string[] = [];
const TL = TOWER - 6, TR = TOWER + 6, TOP = G - 160;
tower.push(`M${TL} ${G - 2}V${TOP}M${TR} ${G - 2}V${TOP}`);
for (let y = G - 10, i = 0; y >= TOP; y -= 10, i++) {
	tower.push(`M${TL} ${y}H${TR}`);
	tower.push(i % 2 ? `M${TL} ${y}L${TR} ${y + 10}` : `M${TR} ${y}L${TL} ${y + 10}`);
	if (i % 3 === 0) tower.push(`M${TR} ${y}h3`);
}
tower.push(`M${TOWER - 10} ${TOP}h20M${TOWER - 10} ${TOP - 4}h20M${TOWER - 10} ${TOP}v-4M${TOWER + 10} ${TOP}v-4M${TOWER - 3} ${TOP}v-4M${TOWER + 3} ${TOP}v-4`);
export const launch = {
	tower: tower.join(''),
	rail: `M${TOWER + 9} ${G - 6}V${TOP + 8}`,
	guys: `M${TOWER} ${TOP + 10}L${TOWER - 74} ${G}M${TOWER} ${TOP + 10}L${TOWER + 92} ${G}M${TOWER} ${G - 80}L${TOWER - 52} ${G}`,
	top: TOP,
};

// ---------- circuit board ----------

const B = { trace: [] as string[], power: [] as string[], pad: [] as string[], body: [] as string[], silk: [] as string[], via: [] as string[], dot: [] as string[], text: [] as { x: number; y: number; t: string; s: number }[] };
const via = (x: number, y: number, r = 1.7) => B.via.push(ring(x, y, r));
const silk = (x: number, y: number, t: string, s = 4.5) => B.text.push({ x, y, t, s });
const trace = (pts: number[][], end = true) => {
	B.trace.push(line(pts));
	if (end) via(...(pts[0] as [number, number]));
	return line(pts);
};
const meander = (x0: number, x1: number, y: number, amp: number, pitch = 6) => {
	const pts: number[][] = [[x0, y]];
	for (let x = x0; x + pitch <= x1; x += pitch) pts.push([x, y - amp], [x + pitch / 2, y - amp], [x + pitch / 2, y], [x + pitch, y]);
	return pts;
};
const qfp = (x: number, y: number, s: number, per: number) => {
	const p = (s - 8) / (per - 1), at = (i: number) => 4 + i * p;
	B.body.push(rect(x, y, s, s));
	for (let i = 0; i < per; i++) {
		B.pad.push(rect(x - 6, y + at(i) - 0.8, 5, 1.6), rect(x + s + 1, y + at(i) - 0.8, 5, 1.6), rect(x + at(i) - 0.8, y - 6, 1.6, 5), rect(x + at(i) - 0.8, y + s + 1, 1.6, 5));
	}
	B.dot.push(ring(x + 5, y + 5, 1.4));
	B.silk.push(`M${x - 9} ${y + 6}V${y - 9}H${x + 6}`);
	return { L: (i: number) => [x - 6, y + at(i)], R: (i: number) => [x + s + 6, y + at(i)], T: (i: number) => [x + at(i), y - 6], B: (i: number) => [x + at(i), y + s + 6] };
};
const chip = (x: number, y: number, w: number, h: number, per: number, label: string) => {
	B.body.push(rect(x, y, w, h));
	const p = (h - 4) / Math.max(1, per - 1);
	for (let i = 0; i < per; i++) B.pad.push(rect(x - 4, y + 2 + i * p - 0.8, 3.4, 1.6), rect(x + w + 0.6, y + 2 + i * p - 0.8, 3.4, 1.6));
	B.dot.push(ring(x + 3, y + 3, 1));
	silk(x, y - 2.5, label);
	return { L: (i: number) => [x - 4, y + 2 + i * p], R: (i: number) => [x + w + 4, y + 2 + i * p] };
};
const passive = (x: number, y: number, vertical = false) =>
	vertical ? B.pad.push(rect(x, y, 3, 2.2), rect(x, y + 4.2, 3, 2.2)) : B.pad.push(rect(x, y, 2.2, 3), rect(x + 4.2, y, 2.2, 3));

// J1: 2x8 header that the bunker's field cable plugs into
for (let i = 0; i < 8; i++)
	for (const y of [546, 556]) {
		if (i === 0 && y === 546) B.pad.push(rect(64, 543, 6, 6));
		else B.via.push(ring(67 + i * 10, y, 2.6));
	}
B.silk.push(rect(58, 538, 92, 24));
silk(58, 570, 'J1');
B.body.push(rect(96, 540, 46, 10));

// U3: the flight-computer MCU
const mcu = qfp(222, 560, 56, 12);
silk(236, 592, 'U3', 5);
// crystal and its load caps
B.body.push(`M238 537h18a3 3 0 0 1 0 7h-18a3 3 0 0 1 0-7z`);
silk(238, 534, 'Y1');
passive(226, 538, true);
passive(262, 538, true);
trace([mcu.T(3), [mcu.T(3)[0], 544]], false);
trace([mcu.T(5), [mcu.T(5)[0], 544]], false);
// J1 bottom row into the MCU's left side, nested so nothing crosses
[4, 5, 6, 7].forEach((i, j) => {
	const x = 67 + i * 10, [px, py] = mcu.L(5 - j);
	B.trace.push(line([[x, 558.6], [x, py - 10], [x + 10, py], [px, py]]));
});
// U4: radio in a perforated shield can, castellated along both sides
B.body.push(rect(332, 546, 74, 52));
B.silk.push(rect(335, 549, 68, 46));
B.dot.push(pixels(xs(6, 340, 398).flatMap((x) => xs(6, 553, 590).map((y) => [x, y])), 0.9));
for (let i = 0; i < 7; i++) B.pad.push(rect(329, 552 + i * 6.6, 3, 2), rect(405, 552 + i * 6.6, 3, 2));
silk(332, 604, 'U4  433M');
// U.FL connector, the coax from the yagi lands here
B.body.push(rect(421, 534, 8, 8));
B.via.push(ring(425, 538, 2));
const rf = [[425, 542], [425, 562], [408, 562]];
B.power.push(line(rf));
for (let y = 547; y <= 558; y += 5) via(419, y, 1.2), via(431, y, 1.2);
for (let x = 412; x <= 424; x += 5) via(x, 556.5, 1.2), via(x, 567.5, 1.2);
// SPI from the radio to the MCU
const spi = [0, 1, 2, 3].map((j) => {
	const y0 = 559 + 6.6 * j, [px, py] = mcu.R(2 + j), dy = py - y0;
	return line([[329, y0], [300 + Math.abs(dy), y0], [300, py], [px, py]]);
});
B.trace.push(...spi);
// the bus from the MCU to the FPGA dips below the radio, then runs the length of the board with matched meanders
const bus = [0, 1, 2, 3].map((j) => {
	const [px, py] = mcu.R(8 + j), y = 616 + 8 * j, dy = y - py;
	const pts = [[px, py], [300, py], [300 + dy, y]];
	if (j % 2 === 0) pts.push(...meander(560, 650, y, 3.4));
	else pts.push(...meander(700, 772, y, 3.4));
	pts.push([1056, y], [1064, y]);
	return line(pts);
});
B.trace.push(...bus);
// power: J1 into the buck stage, then the rail across to the FPGA
B.power.push(line([[67, 543], [67, 533], [468, 533], [468, 548]]));
B.body.push(rect(462, 548, 28, 28));
B.silk.push('M466 568a3 3 0 0 1 6 0a3 3 0 0 1 6 0a3 3 0 0 1 6 0');
silk(462, 584, 'L1');
B.body.push(rect(502, 556, 11, 7));
B.pad.push(rect(503, 563.6, 2, 3), rect(506.5, 563.6, 2, 3), rect(510, 563.6, 2, 3), rect(503, 552.4, 2, 3), rect(510, 552.4, 2, 3));
silk(500, 550, 'U5');
B.body.push(`M528 548h22l4 4v22h-26z`);
B.silk.push(ring(541, 561, 10), 'M531 553h4M533 551v4');
silk(528, 584, 'C1');
B.power.push(line([[490, 562], [502, 562]]), line([[514, 562], [528, 562]]), line([[554, 561], [640, 561], [668, 589], [1000, 589], [1018, 607], [1064, 607]]));
xs(9, 572, 626).forEach((x) => passive(x, 568));
xs(9, 572, 626).forEach((x) => {
	B.trace.push(`M${x + 1.1} 571V578`);
	via(x + 1.1, 580, 1.2);
});
// U6: SPI flash holding the bitstream, straight into the FPGA's config pins
const flash = chip(770, 546, 24, 16, 4, 'U6');
[0, 1, 2, 3].forEach((i) => {
	const [x, y] = flash.R(i), ty = 566 + 5 * i;
	B.trace.push(line([[x, y], [820 - i * 2, y], [820 - i * 2 + (ty - y), ty], [1064, ty]]));
});
[0, 1, 2, 3].forEach((i) => {
	const [x, y] = flash.L(i);
	B.trace.push(line([[x, y], [750, y]]));
	via(750, y, 1.2);
});
// test points along the rail
([[700, 556], [730, 556], [900, 603]] as const).forEach(([x, y], i) => {
	B.via.push(ring(x, y, 2.6));
	B.silk.push(ring(x, y, 4.2));
	silk(x + 7, y + 2, `TP${i + 1}`);
});
// U1: the FPGA, a BGA whose lid shows the ball grid as a faint dot field
const FX = 1070, FY = 556, FS = 132;
B.body.push(rect(FX, FY, FS, FS), `M${FX + 12} ${FY + 12}h${FS - 24}v${FS - 24}h${24 - FS}z`, `M${FX} ${FY + 8}l8-8`);
B.dot.push(pixels(xs(6, FX + 18, FX + FS - 18).flatMap((x) => xs(6, FY + 18, 662).map((y) => [x, y])), 0.8));
B.silk.push(rect(FX - 4, FY - 4, FS + 8, FS + 8));
silk(FX + 16, FY + 26, 'U1', 6);
// the river's four channels become traces that enter the FPGA from above
const riverTraces = mouth.map(([x], j) => {
	const ex = FX + 16 + 8 * j, y = 546 - 4 * j;
	return line([[x, BOARD], [x, y], [ex - (552 - y), y], [ex, 552]]);
});
B.trace.push(...riverTraces);
riverTraces.forEach((_, j) => via(FX + 16 + 8 * j, 552, 1.4));
// status LEDs, each with its series resistor
const leds = [0, 1, 2, 3].map((i) => ({ x: 1152 + i * 13, y: 536 }));
leds.forEach(({ x, y }, i) => {
	B.pad.push(rect(x - 1, y - 0.5, 1.6, 4.4), rect(x + 6.4, y - 0.5, 1.6, 4.4));
	passive(x + 1.4, y + 8, false);
	B.trace.push(`M${x + 3.5} ${y + 11}V552`);
	via(x + 3.5, 552, 1.2);
	silk(x, y - 3, `D${i + 1}`, 4);
});
// U2: DDR, fed through length-matched serpentines
B.body.push(rect(1262, 566, 58, 76));
B.dot.push(ring(1266, 570, 1));
silk(1262, 562, 'U2  DDR3');
for (let j = 0; j < 8; j++) {
	const y = 574 + 8 * j;
	B.trace.push(line(j % 3 === 1 ? [[FX + FS + 4, y], [1210, y]] : [[FX + FS + 4, y], ...meander(1210, 1246, y, 3.2, 6), [1258, y]]));
	B.pad.push(rect(1257, y - 0.8, 4, 1.6));
}
// FPGA to the telemetry console's header
const disp = [0, 1, 2, 3].map((j) => {
	const y = 646 + 4 * j, ty = 600 + 8 * j, bx = 1340 + 6 * j;
	return line([[FX + FS + 4, y], [bx, y], [bx + (y - ty), ty], [1412, ty]]);
});
B.trace.push(...disp);
for (let j = 0; j < 4; j++) B.via.push(ring(1416, 600 + 8 * j, 2.2));
// USB-C on the board edge with its ESD part, and the board's corner hardware
B.body.push(`M1732 525h40a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-40a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z`);
B.dot.push(pixels(xs(3, 1737, 1767).map((x) => [x, 533]), 1));
const esd = chip(1744, 560, 16, 12, 3, 'U7');
B.trace.push(line([[1740, 539], esd.L(0)]), line([[1748, 539], [1748, 556]]), line([[1756, 539], [1756, 552], [1764, 560], esd.R(0)]));
via(1748, 556, 1.2);
[0, 1, 2].forEach((i) => { const [x, y] = esd.R(i), xv = 1846 - 6 * i; B.trace.push(line([[x, y], [xv - 20, y], [xv, y + 20], [xv, H]])); });
B.via.push(ring(1872, 600, 8));
xs(1, 0, 7).forEach((i) => via(1872 + 12 * Math.cos((i * Math.PI) / 4), 600 + 12 * Math.sin((i * Math.PI) / 4), 1.1));
B.silk.push(ring(1872, 600, 15), ring(1800, 646, 3), ring(24, 646, 3));
B.pad.push(rect(1799, 645, 2, 2), rect(23, 645, 2, 2));
silk(1664, 640, 'GS-01  REV B', 5.5);
silk(1664, 650, 'viswa.space', 4.5);
B.silk.push('M1654 650l2-11 2 11zM1654 650l-2 1.5M1658 650l2 1.5');
// a few loose ends run off the board, as if it continues beyond the frame
B.trace.push(line([mcu.B(3), [mcu.B(3)[0], H]]), line([mcu.B(7), [mcu.B(7)[0], 640], [mcu.B(7)[0] + 20, H]]), line([[67, 558.6], [67, 590], [40, 617]]));
via(40, 617, 1.4);
[mcu.L(9), mcu.L(11)].forEach(([x, y], i) => B.trace.push(line([[x, y], [190 - i * 8, y], [190 - i * 8 - 30, y + 30], [0, y + 30]])));
export const board = {
	trace: B.trace.join(''),
	power: B.power.join(''),
	pad: B.pad.join(''),
	body: B.body.join(''),
	silk: B.silk.join(''),
	via: B.via.join(''),
	dot: B.dot.join(''),
	text: B.text,
	leds,
	pours: [rect(0, 622, 214, 44), rect(1650, 606, 270, 60), rect(836, 612, 222, 54), rect(1784, 546, 136, 40)],
	// pulse routes, each drawn source to destination
	spi: spi.map((d) => d), // radio side first
	bus,
	disp,
	riverTraces,
	flash: 'M794 552H820L838 570H1064',
	cableTop: 'M158 496C156 510 132 518 118 538',
};

// signal routes that start on the plateau and come down the cliff
export const cables = {
	// field cable on stakes from the bunker to the pad controller
	field: (() => {
		const stakes = [224, 300, 350, 430, 500, 594];
		let d = `M${stakes[0]} ${G - 7}`;
		for (let i = 1; i < stakes.length; i++) d += `Q${(stakes[i - 1] + stakes[i]) / 2} ${G - 2} ${stakes[i]} ${G - 7}`;
		return { d, stakes };
	})(),
	coax: `M382 ${G - 32}V${G - 14}C382 ${G - 4} 400 ${G - 2} 408 ${G}C414 ${G + 10} 426 ${G + 22} 425 534`,
	shelter: `M158 ${G}C156 ${G + 14} 132 ${G + 22} 118 540`,
};
