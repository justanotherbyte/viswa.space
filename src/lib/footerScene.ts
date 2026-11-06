// Procedural geometry for the footer artwork, computed at build time from fixed seeds so every build draws the same world.
// The land is a heightfield seen through a pinhole camera and drawn as survey contours with hidden lines removed by a
// floating horizon. Rock is routed like copper: contours become 45° traces that end in vias. The rocket hardware buried
// in the geology (a nose cone, an engine, two fins) keeps the smooth curves of machined parts.
import { STEP as RIDE_STEP } from './footerRide';

export const W = 1920, H = 660;
const HORIZON = 350; // eye level on screen
const F = 1000, CAM = 120; // focal length and camera height, in world units
const ZN = (F * CAM) / (H - HORIZON + 4), ZF = 9000; // nearest and farthest terrain rows

export const rng = (s: number) => () => {
	s = (s + 0x6d2b79f5) | 0;
	let t = Math.imul(s ^ (s >>> 15), 1 | s);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = rng(0x2f6b1d);
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
export const n = (v: number) => Math.round(v * 10) / 10;
const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};
// Path data is most of the page's weight, so it is written compactly: relative steps after the first point (small
// numbers), no leading zeros, and no separator before a minus sign. Steps are taken between rounded points, so the
// rounding never accumulates.
const num = (v: number) => String(Math.round(v * 10) / 10).replace(/^(-?)0\./, '$1.');
const pair = (x: number, y: number) => {
	const b = num(y);
	return num(x) + (b[0] === '-' ? '' : ' ') + b;
};
const steps = (pts: number[][]) => {
	let px = n(pts[0][0]), py = n(pts[0][1]), d = '';
	for (let i = 1; i < pts.length; i++) {
		const x = n(pts[i][0]), y = n(pts[i][1]), s = pair(x - px, y - py);
		d += (d && s[0] !== '-' ? ' ' : '') + s;
		(px = x), (py = y);
	}
	return d;
};
export const line = (pts: number[][]) => `M${pair(n(pts[0][0]), n(pts[0][1]))}` + (pts.length > 1 ? 'l' + steps(pts) : '');
// one-unit dots: after each closed square the pen is back at its corner, so the next is a relative move from there
export const pixels = (pts: number[][], s = 1) =>
	pts.map(([x, y], i) => (i ? `m${pair(n(x) - n(pts[i - 1][0]), n(y) - n(pts[i - 1][1]))}` : `M${pair(n(x), n(y))}`) + `h${s}v${s}h-${s}z`).join('');
export const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
export const ring = (x: number, y: number, r: number) => `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

// ---------- noise ----------

const LAT = Array.from({ length: 1024 }, rnd);
const vnoise = (x: number) => {
	const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f);
	return LAT[i & 1023] * (1 - k) + LAT[(i + 1) & 1023] * k;
};
export const fbm = (x: number, scale: number, o = 0) => {
	let a = 0, sum = 0;
	for (let i = 0; i < 5; i++) {
		const w = 1 / 2 ** i;
		a += vnoise(x / (scale / 2 ** i) + o + i * 53) * w;
		sum += w;
	}
	return a / sum;
};
const hash2 = (i: number, j: number) => {
	let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) ^ 0x5bd1e995;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vn2 = (x: number, y: number) => {
	const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
	const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
	const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
// each octave doubles the frequency and turns 37°, which hides the lattice
const octaves2 = (x: number, y: number, f: (v: number) => number, count = 6) => {
	let a = 0, sum = 0, w = 1;
	for (let i = 0; i < count; i++) {
		a += f(vn2(x + i * 17.3, y - i * 9.1)) * w;
		sum += w;
		[x, y] = [1.6 * x - 1.2 * y, 1.2 * x + 1.6 * y];
		w *= 0.5;
	}
	return a / sum;
};
// ridged noise folds at its midpoint, which gives the peaks sharp crests
const ridged = (v: number) => (1 - Math.abs(2 * v - 1)) ** 2;

// ---------- camera ----------

const Xof = (u: number, Z: number) => (u * Z * W) / 2 / F; // world x at screen direction u (-1 left edge, 1 right)
const project = (X: number, Z: number, h = 0) => [W / 2 + (F * X) / Z, HORIZON + (F * (CAM - h)) / Z];

// ---------- the hardware in the geology ----------

// a Rao bell: the quadratic Bezier Rao used for thrust-optimised nozzles, 30° off the throat and 8° at the lip
const RT = 52, RE = 210, LB = (0.8 * (RE - RT)) / Math.tan(Math.PI / 12);
const BELL = (() => {
	const tn = Math.tan(Math.PI / 6), te = Math.tan((8 * Math.PI) / 180);
	const cx = (RE - RT - te * LB) / (tn - te), cy = RT + tn * cx;
	return Array.from({ length: 201 }, (_, i) => {
		const t = i / 200, r = 1 - t;
		return [2 * r * t * cx + t * t * LB, r * r * RT + 2 * r * t * cy + t * t * RE];
	});
})();
// read one column of a table at a value of another, both ascending
const interp = (lut: number[][], from: number, to: number, v: number) => {
	let i = 1;
	while (i < lut.length - 1 && lut[i][from] < v) i++;
	const p = lut[i - 1], q = lut[i];
	return p[to] + ((q[to] - p[to]) * (v - p[from])) / (q[from] - p[from] || 1);
};
const bellR = (a: number) => interp(BELL, 0, 1, a), bellA = (r: number) => interp(BELL, 1, 0, r);

// a tangent ogive nose cone rising out of the right-hand range, as a profile of [radius, height] from the tip down
const NR_ = 270, NL = 700, RHO = (NR_ ** 2 + NL ** 2) / (2 * NR_);
const ogive = (r: number) => Math.sqrt(Math.max(0, RHO ** 2 - (r + RHO - NR_) ** 2));
const NOSE = { X: Xof(0.27, 3700), Z: 3700, prof: Array.from({ length: 48 }, (_, k) => NR_ * Math.sin(((k / 47) * Math.PI) / 2)).map((r) => [r, 90 + ogive(r)]) };
const noseH = (X: number, Z: number) => {
	const r = Math.hypot(X - NOSE.X, Z - NOSE.Z), p = NOSE.prof;
	if (r >= p.at(-1)![0]) return 0;
	let k = 1;
	while (p[k][0] < r) k++;
	return p[k - 1][1] + ((p[k][1] - p[k - 1][1]) * (r - p[k - 1][0])) / (p[k][0] - p[k - 1][0] || 1);
};

// The engine lies on its side in the left foothills with its chamber buried, and the lip of the bell is a cave mouth
// facing the plain. a runs along the axis from the throat towards the lip; the axis lies level, BURY under the ground.
const RC = 96, LCONV = 52, LCH = 150, SHELL = 10, BURY = 64, A0 = -(LCONV + LCH + RC * 0.6);
const engineR = (a: number) => {
	if (a >= 0) return bellR(Math.min(a, LB));
	if (a > -LCONV) return RT + (RC - RT) * smooth(0, -LCONV, a);
	const b = -a - LCONV; // into the chamber, whose head closes as a dome
	return b < LCH ? RC : RC * Math.sqrt(Math.max(0, 1 - ((b - LCH) / (RC * 0.6)) ** 2));
};
const PSI = 0.4, DX = Math.cos(PSI), DZ = -Math.sin(PSI); // the axis turns 23° off the line of sight: you see into the bell, and a burn side-on
const EXIT = [Xof(-0.25, 1480), 1480];
const ENG = { X: EXIT[0] - LB * DX, Z: EXIT[1] - LB * DZ }; // the throat
const engAt = (X: number, Z: number) => {
	const px = X - ENG.X, pz = Z - ENG.Z;
	return [px * DX + pz * DZ, pz * DX - px * DZ]; // along the axis, across it
};
const engH = (X: number, Z: number) => {
	const [a, l] = engAt(X, Z);
	if (a > LB || a < A0) return 0;
	const ro = engineR(a) + SHELL;
	return Math.abs(l) < ro ? Math.max(0, Math.sqrt(ro * ro - l * l) - BURY) : 0;
};
// a point on the engine at axial a, radius rho, and angle phi round the axis (0 on the far side, pi/2 on top)
const engPt = (a: number, rho: number, phi: number) => {
	const c = rho * Math.cos(phi);
	return [ENG.X + a * DX - c * DZ, ENG.Z + a * DZ + c * DX, rho * Math.sin(phi) - BURY];
};

// two fins standing out of the near hills as flatirons: clipped-delta planform, unswept trailing edge, double-wedge section
const FINS = [
	{ X: Xof(0.6, 930), Z: 930, cr: 200, ct: 44, s: 158, t: 58 },
	{ X: Xof(0.83, 1210), Z: 1210, cr: 236, ct: 52, s: 184, t: 66 },
];
type Fin = (typeof FINS)[number];
const finP = (f: Fin, X: number) => {
	const x = X - (f.X - f.cr / 2), sw = f.cr - f.ct;
	if (x <= 0 || x >= f.cr + 8) return 0;
	return (x < sw ? (f.s * x) / sw : f.s) * smooth(f.cr + 8, f.cr - 4, x);
};
const finH = (f: Fin, X: number, Z: number) => finP(f, X) * Math.max(0, 1 - Math.abs(Z - f.Z) / f.t);

// ---------- the land ----------

const bump2 = (dx: number, dz: number, wx: number, wz: number) => Math.exp(-((dx / wx) ** 2) - (dz / wz) ** 2);
const rock = (X: number, Z: number) => {
	const u = (F * X) / Z / (W / 2);
	// a high range behind the engine at the left, a lower one round the nose at the right, open sky between
	const env = 0.12 + 0.95 * bump(u, -0.62, 0.26) + 0.62 * bump(u, 0.4, 0.26) + 0.35 * bump(u, 0.96, 0.14);
	const spire = 1 - 0.4 * bump2(X - NOSE.X, Z - NOSE.Z, 800, 800); // the range falls back round the nose so it stands clear
	const peaks = 1500 * spire * Math.max(0, octaves2(X / 1500, Z / 1500, ridged) ** 1.7 * env * smooth(1900, 3600, Z) - 0.04);
	const foothills = 420 * Math.max(0, octaves2(X / 900 + 5, Z / 900, (v) => v, 4) * smooth(1100, 1700, Z) - 0.5);
	// the hill the engine is buried in, banked over the shell and broken off in a cliff at the mouth
	const [ea, el] = engAt(X, Z);
	const mound = (200 + 90 * octaves2(X / 200, Z / 200 + 3, ridged, 4)) * smooth(LB + 4, LB - 34, ea) * smooth(A0 - 560, A0, ea) * Math.exp(-((el / (RE + 150)) ** 4));
	// near hills framing the plain: a long shoulder off the left edge, a lower swell on the right carrying the fins
	const near = 200 * bump2(X - Xof(-0.95, 660), Z - 660, 460, 240) + 170 * bump2(X - Xof(0.74, 900), Z - 900, 560, 300);
	const hills = near * (0.5 + 1.1 * (octaves2(X / 260 + 2, Z / 260, (v) => v, 4) - 0.5));
	const roll = Z * 0.01 * (octaves2(X / 160, Z / 160 + 7, (v) => v, 3) - 0.5) * (1 - smooth(1400, 2600, Z));
	return peaks + foothills + mound + hills + roll;
};
// the hardware standing at a point, and which piece it is
const part = (X: number, Z: number) => {
	let h = 0, tag = '';
	for (const [k, v] of [['eng', engH(X, Z)], ['nose', noseH(X, Z)], ...FINS.map((f) => ['fin', finH(f, X, Z)])] as [string, number][]) if (v > h) (h = v), (tag = k);
	return { h, tag };
};
const height = (X: number, Z: number) => Math.max(rock(X, Z), part(X, Z).h);
// a point of the land belongs to hardware where the hardware stands proud of the rock; the fins weather like rock
const hardware = (X: number, Z: number) => {
	const p = part(X, Z);
	return p.h > rock(X, Z) + 1 && p.tag !== 'fin' ? p.tag : '';
};

// ---------- the heightfield ----------

const NR = 300, NC = 560, STEP = 22;
const zs = Array.from({ length: NR + 1 }, (_, j) => ZN * (ZF / ZN) ** (j / NR));
const us = Array.from({ length: NC + 1 }, (_, i) => -1.02 + (2.04 * i) / NC);
const sx = us.map((u) => W / 2 + (u * W) / 2);
const hs = zs.map((z) => us.map((u) => height(Xof(u, z), z)));
const Y = (z: number, h: number) => HORIZON + (F * (CAM - h)) / z;
const ys = hs.map((row, j) => row.map((h) => Y(zs[j], h)));

// the floating horizon: the highest screen point drawn so far in each pixel column, working from near to far.
// A copy per row lets anything drawn on the land later be hidden by the land in front of it.
const hor = new Float64Array(W + 1).fill(Infinity);
const snaps: Float32Array[] = [];
const raise = (j: number) => {
	for (let i = 0; i < NC; i++) {
		const x0 = sx[i], x1 = sx[i + 1];
		for (let px = Math.max(0, Math.ceil(x0)); px <= Math.min(W, Math.floor(x1)); px++) {
			const y = ys[j][i] + ((ys[j][i + 1] - ys[j][i]) * (px - x0)) / (x1 - x0);
			if (y < hor[px]) hor[px] = y;
		}
	}
	snaps[j + 1] = Float32Array.from(hor);
};
const seen = (x: number, y: number, h: ArrayLike<number> = hor) => {
	const i = Math.round(x);
	return i >= 0 && i <= W && y < h[i] - 0.3;
};
const rowOf = (Z: number) => Math.min(NR, Math.max(1, Math.ceil((Math.log(Z / ZN) / Math.log(ZF / ZN)) * NR)));
const visible = (X: number, Z: number, h: number) => {
	const [x, y] = project(X, Z, h);
	return Z > ZN && seen(x, y, snaps[rowOf(Z)]);
};

// ---------- contours and crests ----------

type Seg = { p: number[]; q: number[]; z: number };
const groups = new Map<string, Seg[]>();
const add = (g: string, s: Seg) => (groups.get(g) ?? groups.set(g, []).get(g)!).push(s);
// keep only the runs of a segment that lie above the horizon
const emit = (g: string, z: number, x1: number, y1: number, x2: number, y2: number) => {
	const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 1.2));
	let start = -1;
	for (let k = 0; k <= steps; k++) {
		const t = k / steps, v = seen(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
		if (v && start < 0) start = t;
		if (start >= 0 && (!v || k === steps)) {
			const end = v ? t : (k - 1) / steps;
			if (end > start) add(g, { p: [x1 + (x2 - x1) * start, y1 + (y2 - y1) * start], q: [x1 + (x2 - x1) * end, y1 + (y2 - y1) * end], z });
			start = -1;
		}
	}
};

const NEAR = 1500, FAR = 3600;
raise(0);
for (let j = 1; j <= NR; j++) {
	const za = zs[j - 1], zb = zs[j];
	for (let i = 0; i < NC; i++) {
		const c = [hs[j - 1][i], hs[j - 1][i + 1], hs[j][i + 1], hs[j][i]];
		const lo = Math.min(...c), hi = Math.max(...c), zm = (za + zb) / 2;
		if (hardware(Xof((us[i] + us[i + 1]) / 2, zm), zm)) continue; // hardware is drawn from its own geometry
		const slope = Math.hypot((c[1] - c[0]) / (Xof(us[i + 1], za) - Xof(us[i], za)), (c[3] - c[0]) / (zb - za));
		if (slope < 0.3) continue;
		// corners: 0 near-left, 1 near-right, 2 far-right, 3 far-left
		const at = (k: number, t: number, L: number) => {
			if (k === 0) return [sx[i] + (sx[i + 1] - sx[i]) * t, Y(za, L)];
			if (k === 2) return [sx[i + 1] + (sx[i] - sx[i + 1]) * t, Y(zb, L)];
			const x = k === 1 ? sx[i + 1] : sx[i], z = k === 1 ? za + (zb - za) * t : zb + (za - zb) * t;
			return [x, Y(z, L)];
		};
		for (let L = Math.ceil(lo / STEP) * STEP; L < hi; L += STEP) {
			// the far range keeps survey contours; nearer rock only its index contours, the strata of an inner layer
			if (L <= 0 || L % (STEP * (zb > FAR && slope > 0.6 ? 2 : 5)) !== 0) continue;
			const hits: number[][] = [];
			for (let k = 0; k < 4; k++) {
				const a = c[k], b = c[(k + 1) % 4];
				if (a < L !== b < L) hits.push(at(k, (L - a) / (b - a), L));
			}
			for (let k = 0; k + 1 < hits.length; k += 2) emit(`c${L}`, zm, hits[k][0], hits[k][1], hits[k + 1][0], hits[k + 1][1]);
		}
	}
	// the crest of row j: where the row behind it drops out of sight, the row itself is the visible edge of the land
	for (let i = 0; i < NC; i++) {
		const crest = (k: number) => j === NR || (ys[j + 1][k] > ys[j][k] && ys[Math.min(NR, j + 3)][k] > ys[j][k] + 1.5);
		if (!crest(i) || !crest(i + 1) || hardware(Xof((us[i] + us[i + 1]) / 2, zb), zb)) continue;
		emit('crest', zb, sx[i], ys[j][i], sx[i + 1], ys[j][i + 1]);
	}
	// survey rows: a dotted line every few rows across the open plain, the ground's perspective made visible
	if (j % 8 === 0 && zb < 3000)
		for (let i = 0; i < NC; i++) if (hs[j][i] < 24 && hs[j][i + 1] < 24) emit('survey', zb, sx[i], ys[j][i], sx[i + 1], ys[j][i + 1]);
	raise(j);
}

// join the cell segments of each contour level into polylines
type Chain = { pts: number[][]; z: number };
const chains = (list: Seg[]) => {
	const key = (p: number[]) => `${Math.round(p[0] * 20)},${Math.round(p[1] * 20)}`;
	const ends = new Map<string, number[]>();
	list.forEach((s, i) => [s.p, s.q].forEach((p) => (ends.get(key(p)) ?? ends.set(key(p), []).get(key(p))!).push(i)));
	const used = new Uint8Array(list.length), out: Chain[] = [];
	for (let i = 0; i < list.length; i++) {
		if (used[i]) continue;
		used[i] = 1;
		const head = [list[i].p], tail = [list[i].q];
		let z = list[i].z, count = 1;
		for (const side of [tail, head]) {
			for (;;) {
				const tip = side.at(-1)!, j = ends.get(key(tip))?.find((k) => !used[k]);
				if (j === undefined) break;
				used[j] = 1;
				const s = list[j];
				side.push(key(s.p) === key(tip) ? s.q : s.p);
				z += s.z;
				count++;
			}
		}
		out.push({ pts: [...head.reverse(), ...tail], z: z / count });
	}
	return out;
};

// ---------- routing: rock drawn as copper ----------

const lenOf = (pts: number[][]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
// Ramer-Douglas-Peucker
const simplify = (pts: number[][], eps: number): number[][] => {
	if (pts.length < 3) return pts;
	const [a, b] = [pts[0], pts.at(-1)!], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
	let worst = 0, at = 0;
	for (let i = 1; i < pts.length - 1; i++) {
		const d = Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dx) / l;
		if (d > worst) (worst = d), (at = i);
	}
	return worst <= eps ? [a, b] : [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)];
};
// a polyline as a PCB route: straight runs and 45° jogs that stay within tol of the original
const octi = (pts: number[][], tol: number) => {
	const s = simplify(pts, tol * 0.5), out = [s[0]];
	const route = (a: number[], b: number[], depth: number) => {
		const dx = b[0] - a[0], dy = b[1] - a[1], ax = Math.abs(dx), ay = Math.abs(dy), lo = Math.min(ax, ay), hi = Math.max(ax, ay);
		if (hi > 0 && (lo * (hi - lo)) / (2 * hi) > tol && depth < 10) {
			const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
			route(a, m, depth + 1);
			route(m, b, depth + 1);
			return;
		}
		const gx = Math.sign(dx), gy = Math.sign(dy), r = (hi - lo) / 2;
		if (ax >= ay) out.push([a[0] + gx * r, a[1]], [a[0] + gx * (r + lo), a[1] + gy * lo]);
		else out.push([a[0], a[1] + gy * r], [a[0] + gx * lo, a[1] + gy * (r + lo)]);
		out.push(b);
	};
	for (let i = 0; i + 1 < s.length; i++) route(s[i], s[i + 1], 0);
	// drop zero-length pieces and the middle of straight runs
	const m: number[][] = [out[0]];
	for (const p of out.slice(1)) {
		const q = m.at(-1)!;
		if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.15) continue;
		if (m.length > 1) {
			const o = m.at(-2)!, d1 = Math.atan2(q[1] - o[1], q[0] - o[0]), d2 = Math.atan2(p[1] - q[1], p[0] - q[0]);
			if (Math.abs(d1 - d2) < 0.02) m.pop();
		}
		m.push(p);
	}
	return m;
};

const out: Record<string, string> = {};
const draw = (cls: string, d: string) => (out[cls] = (out[cls] ?? '') + d);
const vias: Record<string, string> = { near: '', mid: '' };
const pads: string[] = [];
const prnd = rng(0x7e11a);

for (const [g, list] of groups) {
	if (g === 'survey') {
		for (const c of chains(list)) draw('g', line(c.pts));
		continue;
	}
	const index = g !== 'crest' && +g.slice(1) % (STEP * 5) === 0;
	for (const c of chains(list)) {
		const tier = c.z < NEAR ? 'near' : c.z < FAR ? 'mid' : 'far';
		if (lenOf(c.pts) < (tier === 'far' ? 1.5 : 14)) continue; // short scraps off small bumps read as noise
		if (g === 'crest') {
			if (tier === 'far') {
				draw('e-far', line(c.pts));
				continue;
			}
			const r = octi(c.pts, tier === 'near' ? 1.8 : 1.3);
			draw(`e-${tier}`, line(r));
			// a ridge is a bus: one or two traces run parallel under the crest for a stretch and drop into vias
			if (lenOf(r) < 40) continue;
			for (let k = 1; k <= (lenOf(r) > 120 ? 2 : 1); k++) {
				const i0 = Math.floor(r.length * (0.08 + 0.2 * prnd())), i1 = Math.ceil(r.length * (0.7 + 0.25 * prnd()));
				const run = r.slice(i0, i1).map(([x, y]) => [x, y + k * 2.6]);
				if (run.length < 2 || lenOf(run) < 16) continue;
				draw(`b-${tier}`, line(run));
				for (const p of [run[0], run.at(-1)!]) vias[tier] += ring(p[0], p[1], tier === 'near' ? 1.2 : 0.9);
			}
			continue;
		}
		else draw(tier === 'far' ? (index ? 'i-far' : 'r-far') : `s-${tier}`, line(tier === 'far' ? c.pts : octi(c.pts, 1)));
	}
}

// ---------- hachures: the fall lines of the rock, routed as copper ----------

// Fall lines traced downhill from the ridges and kept apart on screen (Jobard and Lefer's evenly spaced streamlines):
// a line that runs into another joins it, so they branch and merge like drainage. Steep and shadowed rock gets them
// close together, the way an engraver shades relief.
const GRID = 2, GW = Math.ceil(W / GRID) + 1, GH = Math.ceil(H / GRID) + 1;
const occ = new Int32Array(GW * GH).fill(-1), occPt = new Float32Array(GW * GH * 2);
const mark = (p: number[], id: number) => {
	const k = Math.floor(p[1] / GRID) * GW + Math.floor(p[0] / GRID);
	if (k >= 0 && k < occ.length) (occ[k] = id), (occPt[2 * k] = p[0]), (occPt[2 * k + 1] = p[1]);
};
const nearest = (x: number, y: number, r: number, id: number) => {
	let best: number[] | null = null, bd = r;
	const ci = Math.floor(x / GRID), cj = Math.floor(y / GRID), R = Math.ceil(r / GRID);
	for (let j = Math.max(0, cj - R); j <= Math.min(GH - 1, cj + R); j++)
		for (let i = Math.max(0, ci - R); i <= Math.min(GW - 1, ci + R); i++) {
			const k = j * GW + i;
			if (occ[k] < 0 || occ[k] === id) continue;
			const d = Math.hypot(occPt[2 * k] - x, occPt[2 * k + 1] - y);
			if (d < bd) (bd = d), (best = [occPt[2 * k], occPt[2 * k + 1]]);
		}
	return best;
};
const grad = (X: number, Z: number) => {
	const e = Z * 0.003;
	return [(height(X + e, Z) - height(X - e, Z)) / (2 * e), (height(X, Z + e) - height(X, Z - e)) / (2 * e)];
};
const LIGHT = [-0.78, 0.55, 0.3]; // from the upper left, a little behind the range
const spacing = (Z: number, gx: number, gz: number) => {
	const s = Math.hypot(gx, gz), nl = Math.hypot(gx, 1, gz);
	const lit = Math.max(0, (-gx * LIGHT[0] + LIGHT[1] - gz * LIGHT[2]) / nl);
	const f = Math.min(1, s / 1.1) * (0.25 + 0.75 * (1 - lit));
	return (Z < NEAR ? 3.4 : 4.6) / Math.max(0.2, f);
};

const seeds: number[][] = [];
for (let j = 1; j < NR; j++)
	for (let i = 0; i <= NC; i++) {
		const Z = zs[j], X = Xof(us[i], Z);
		if (Z > FAR || hardware(X, Z)) continue;
		seeds.push([X, Z, ys[j][i]]);
	}
seeds.sort((a, b) => a[2] - b[2]); // from the top of the screen down, so lines start on the ridges

type Hach = { pts: number[][]; z: number; foot: boolean; joined: boolean };
const hach: Hach[] = [];
for (const [sX, sZ] of seeds) {
	let X = sX, Z = sZ, joined: number[] | null = null, zsum = 0, foot = false;
	const id = hach.length, pts: number[][] = [];
	for (let k = 0; k < 500; k++) {
		const h = height(X, Z), [x, y] = project(X, Z, h);
		if (x < 0 || x > W || y > H || !visible(X, Z, h) || hardware(X, Z)) break;
		const [gx, gz] = grad(X, Z), s = Math.hypot(gx, gz);
		if (s < 0.4) {
			foot = true;
			break;
		}
		const sep = spacing(Z, gx, gz);
		if (sep > 16 && !k) break;
		const o = nearest(x, y, k ? sep * 0.5 : sep, id);
		if (o) {
			if (k) joined = o;
			break;
		}
		pts.push([x, y]);
		zsum += Z;
		const st = (2 * Z) / F / Math.max(1, s);
		X -= (gx / s) * st;
		Z -= (gz / s) * st;
	}
	if (joined) pts.push(joined);
	if (pts.length < 2 || lenOf(pts) < 7) continue;
	for (const p of pts) mark(p, id);
	hach.push({ pts, z: zsum / pts.length, foot, joined: !!joined });
}

// break a near route for a two-pad part across a long straight run: a resistor or a capacitor in the line
const parts = (pts: number[][]) => {
	const runs: number[][][] = [[pts[0]]];
	for (let i = 1; i < pts.length; i++) {
		const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l;
		if ((Math.abs(ux) < 0.01 || Math.abs(uy) < 0.01) && l > 16 && prnd() < 0.1) {
			const c = [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5], g = 1.1, p = 1.6;
			runs.at(-1)!.push([c[0] - ux * (g + p), c[1] - uy * (g + p)]);
			for (const k of [-1, 1]) {
				const x = c[0] + ux * k * (g + p / 2), y = c[1] + uy * k * (g + p / 2), hw_ = Math.abs(ux) > 0.5 ? p / 2 : 1, hh = Math.abs(ux) > 0.5 ? 1 : p / 2;
				pads.push(rect(x - hw_, y - hh, 2 * hw_, 2 * hh));
			}
			runs.push([[c[0] + ux * (g + p), c[1] + uy * (g + p)]]);
		}
		runs.at(-1)!.push(b);
	}
	return runs;
};

// the longest near routes carry the signal pulses
const routes: string[] = [], dense: number[][] = [];
let junctions = '';
for (const hl of hach) {
	const tier = hl.z < NEAR ? 'near' : 'mid', r = octi(hl.pts, tier === 'near' ? 2.2 : 1.5);
	for (const run of tier === 'near' ? parts(r) : [r]) draw(`h-${tier}`, line(run));
	if (tier === 'near') dense.push(...hl.pts);
	if (tier === 'near' && lenOf(r) > 70 && routes.length < 14 && prnd() < 0.5) routes.push(line(r));
	// every route is terminated: a via where it starts on the ridge, a pad where it runs out on the flat, a junction
	// dot where it joins another
	if (prnd() < (tier === 'near' ? 0.8 : 0.45)) vias[tier] += ring(r[0][0], r[0][1], tier === 'near' ? 1.2 : 0.85);
	const [ex, ey] = r.at(-1)!;
	if (hl.joined) junctions += ring(ex, ey, tier === 'near' ? 0.75 : 0.55);
	else if (hl.foot && prnd() < (tier === 'near' ? 0.9 : 0.4)) pads.push(rect(ex - 1, ey - 0.6, 2, 2.4));
}

// two small packages where the routes on a near slope crowd together, as if the traces had run into a chip:
// an SOIC-8 on the left, an SOT-23 on the right
let ics = '';
for (const [x0, x1, pins] of [[0, 760, 4], [1100, W, 2]]) {
	let best = [0, 0, 0];
	for (let x = x0 + 20; x < x1 - 20; x += 6)
		for (let y = HORIZON + 40; y < H - 30; y += 6) {
			const c = dense.filter((p) => Math.abs(p[0] - x) < 9 && Math.abs(p[1] - y) < 7).length;
			if (c > best[2]) best = [x, y, c];
		}
	const [x, y] = best, bw = pins * 3 + 2, bh = 8;
	ics += rect(x - bw / 2, y - bh / 2, bw, bh);
	for (let i = 0; i < pins; i++) {
		const px = x - bw / 2 + 2.2 + i * 3;
		ics += rect(px - 0.5, y - bh / 2 - 2, 1, 2) + rect(px - 0.5, y + bh / 2, 1, 2);
	}
	ics += ring(x - bw / 2 + 2, y - bh / 2 + 2, 0.6);
}

// ---------- the hardware, drawn from its own geometry ----------

export const fire = { wipe: 0, cliff: [] as number[][], mouth: [0, 0, 0], layers: [] as string[], diamonds: '', streams: [] as string[],  hit: { cx: 0, cy: 0, rx: 0, ry: 0 }, fade: { x1: 0, y1: 0, x2: 0, y2: 0 } };
export const nosecone = {
	left: {} as Record<string, string>,
	right: {} as Record<string, string>,
	hit: { cx: 0, cy: 0, rx: 0, ry: 0 },
	base: [0, 0, 0],
	body: '',
};
const hw: Record<string, string> = { tube: '', band: '', inner: '', 'inner-warm': '', hot: '', rivet: '', 'e-hw': '', lip: '' };
const ero = rng(0xe20);
const wear = Array.from({ length: 256 }, ero);
// a solid of revolution: meridians, rings and outline, hidden where its surface faces away, where the rock stands over
// it, or where the land in front of it rises higher on screen
const lathe = (L: typeof NOSE, o: { meridians: number; rings: { k: number; cls: string; rivets?: boolean }[]; worn: number }) => {
	const p = L.prof, front = snaps[rowOf(L.Z - p.at(-1)![0] - 6)];
	const at = (th: number, k: number) => [L.X + p[k][0] * Math.cos(th), L.Z + p[k][0] * Math.sin(th), p[k][1]];
	// the outward normal of the profile at sample k, as radial and vertical parts
	const nrm = (k: number) => {
		const a = p[Math.max(0, k - 1)], b = p[Math.min(p.length - 1, k + 1)];
		return [a[1] - b[1], b[0] - a[0]];
	};
	const facing = (th: number, k: number) => {
		const [X, Z, h] = at(th, k), [nr, nh] = nrm(k);
		return nr * (Math.cos(th) * X + Math.sin(th) * Z) + nh * (h - CAM);
	};
	const shown = (th: number, k: number) => {
		const [X, Z, h] = at(th, k), [x, y] = project(X, Z, h);
		return facing(th, k) < 0 && rock(X, Z) < h - 2 && seen(x, y, front);
	};
	// everything is drawn into the half of the fairing it lies on, left or right of the tip, so the halves can open
	const tipX = project(...(at(0, 0) as [number, number, number]))[0];
	const put = (cls: string, run: number[][]) => {
		const half = nosecone[run.reduce((s, q) => s + q[0], 0) / run.length < tipX ? 'left' : 'right'];
		half[cls] = (half[cls] ?? '') + line(run);
	};
	const stroke = (pts: [number, number][], cls: string) => {
		let run: number[][] = [];
		const flush = () => (run.length > 1 && put(cls, run), (run = []));
		for (const [th, k] of pts) shown(th, k) ? run.push(project(...(at(th, k) as [number, number, number]))) : flush();
		flush();
	};
	// meridians, worn away in places like weathered columns
	for (let i = 0; i < o.meridians; i++) {
		const th = (i / o.meridians) * 2 * Math.PI, pts: [number, number][] = [];
		for (let k = 0; k < p.length; k++) {
			if (wear[(i * 7 + (k >> 3) * 13) & 255] < o.worn) {
				stroke(pts.splice(0), 'tube');
				continue;
			}
			pts.push([th, k]);
		}
		stroke(pts, 'tube');
	}
	for (const r of o.rings) {
		const pts = Array.from({ length: 721 }, (_, i) => [(i / 720) * 2 * Math.PI, r.k] as [number, number]);
		stroke(pts, r.cls);
		if (r.rivets) for (let i = 0; i < 180; i++) if (shown((i / 180) * 2 * Math.PI, r.k + 1)) {
			const [x, y] = project(...(at((i / 180) * 2 * Math.PI, r.k + 1) as [number, number, number]));
			const half = nosecone[x < tipX ? 'left' : 'right'];
			half.rivet = (half.rivet ?? '') + rect(x - 0.4, y + 1.2, 0.8, 0.8);
		}
	}
	// the outline: where the surface turns edge-on to the eye, on each side
	const sides: number[][][] = [[], []];
	for (let k = 0; k < p.length; k++) {
		const cuts: number[][] = [];
		for (let i = 0; i < 720; i++) {
			const a = (i / 720) * 2 * Math.PI, b = ((i + 1) / 720) * 2 * Math.PI;
			if (Math.sign(facing(a, k)) !== Math.sign(facing(b, k))) cuts.push(project(...(at((a + b) / 2, k) as [number, number, number])).concat((a + b) / 2));
		}
		cuts.sort((m, q) => m[0] - q[0]);
		if (cuts.length >= 2) [cuts[0], cuts.at(-1)!].forEach((c, s) => sides[s].push(seen(c[0], c[1], front) && rock(...(at(c[2], k).slice(0, 2) as [number, number])) < p[k][1] - 2 ? c : []));
	}
	for (const side of sides) {
		let run: number[][] = [];
		for (const c of side) c.length ? run.push(c) : (run.length > 1 && put('e-hw', run), (run = []));
		if (run.length > 1) put('e-hw', run);
	}
	// the base of the cone as it shows above the rock: the lowest visible point of each side of its outline
	const [tx, ty] = project(...(at(0, 0) as [number, number, number]));
	const pivot = (side: number[][]) => side.filter((c) => c.length).reduce((lo, c) => (c[1] > lo[1] ? c : lo), [tx, ty]);
	const [pl, pr] = sides.map(pivot);
	const cx = (pl[0] + pr[0]) / 2, base = Math.max(pl[1], pr[1]), H = base - ty, hw0 = (pr[0] - pl[0]) / 2;
	nosecone.hit = { cx: n(cx), cy: n(ty + H * 0.55), rx: n(hw0 * 1.1), ry: n(H * 0.6) };
	// as a solid for flight: the silhouette between the two outlines, closed across the base, and the base's middle
	const left = sides[0].filter((c) => c.length), right = sides[1].filter((c) => c.length);
	nosecone.body = line([...left, ...right.reverse()]) + 'Z';
	nosecone.base = [n((pl[0] + pr[0]) / 2), n((pl[1] + pr[1]) / 2), n(hw0)];
};

// the engine: the shell's tubes and hatbands, its outline, the double lip of the mouth, and through the mouth the
// inside of the bell, rings narrowing to a throat that is still warm
{
	const front = snaps[rowOf(EXIT[1] - RE - 20)], C = [0, CAM, 0];
	const slope = (a: number) => (engineR(a + 2) - engineR(a - 2)) / 4;
	const scr = (P: number[]) => project(P[0], P[1], P[2]);
	// the outer surface faces the eye, stands clear of the ground and rock, and nothing nearer covers it
	const facing = (a: number, phi: number, sgn: number) => {
		const P = engPt(a, 1, phi), O = engPt(a, 0, phi), r = slope(a);
		const n = [P[0] - O[0] - r * DX, P[1] - O[1] - r * DZ, P[2] - O[2]]; // x, z, h
		const Q = engPt(a, engineR(a) + (sgn > 0 ? SHELL : 0), phi);
		return sgn * (n[0] * (Q[0] - C[0]) + n[1] * (Q[1] - C[2]) + n[2] * (Q[2] - C[1]));
	};
	const clear = (P: number[]) => {
		const [x, y] = scr(P);
		return P[2] > 0.5 && P[2] > rock(P[0], P[1]) + 1 && seen(x, y, front);
	};
	const outer = (a: number, phi: number) => {
		const P = engPt(a, engineR(a) + SHELL, phi);
		return facing(a, phi, 1) < 0 && clear(P) ? scr(P) : null;
	};
	// inside: seen through the mouth, past the lip, without the line of sight leaving the bore
	const E = engPt(LB, 0, 0);
	const inner = (a: number, phi: number) => {
		const P = engPt(a, engineR(a), phi);
		if (facing(a, phi, -1) >= 0 || P[2] < 0.5) return null;
		const v = [P[0] - C[0], P[1] - C[2], P[2] - C[1]], s = ((E[0] - C[0]) * DX + (E[1] - C[2]) * DZ) / (v[0] * DX + v[1] * DZ);
		const Q = [C[0] + v[0] * s, C[2] + v[1] * s, C[1] + v[2] * s];
		if (Math.hypot(Q[0] - E[0], Q[1] - E[1], Q[2] - E[2]) > RE - 1 || Q[2] < 0.5) return null;
		for (let k = 1; k < 6; k++) {
			const M = [P[0] + ((Q[0] - P[0]) * k) / 6, P[1] + ((Q[1] - P[1]) * k) / 6, P[2] + ((Q[2] - P[2]) * k) / 6], [ma, ml] = engAt(M[0], M[1]);
			if (Math.hypot(ml, M[2] + BURY) > engineR(ma) - 0.5) return null;
		}
		const [x, y] = scr(P);
		return seen(x, y, front) ? [x, y] : null;
	};
	const run = (pts: (number[] | null)[], cls: string) => {
		let r: number[][] = [];
		for (const p of [...pts, null]) p ? r.push(p) : (r.length > 1 && (hw[cls] += line(r)), (r = []));
	};
	for (let i = 0; i < 64; i++) {
		const phi = (i / 63) * Math.PI;
		run(Array.from({ length: 60 }, (_, k) => (wear[(i * 11 + (k >> 3) * 5) & 255] < 0.14 ? null : outer((LB * k) / 59, phi))), 'tube');
	}
	const ring = (a: number, f: (a: number, phi: number) => number[] | null, cls: string, k = 720) => run(Array.from({ length: k + 1 }, (_, i) => f(a, (i / k) * 2 * Math.PI)), cls);
	for (const a of [LB * 0.38, LB * 0.7, -LCONV - 20, -LCONV - LCH + 20]) ring(a, outer, 'band');
	for (let i = 0; i < 90; i++) {
		const p = outer(LB * 0.7 - 5, (i / 90) * 2 * Math.PI);
		if (p) hw.rivet += rect(p[0] - 0.4, p[1] - 0.4, 0.8, 0.8);
	}
	// the lip: inner and outer edge of the wall where it meets the air
	const lip = (rho: number) => (a: number, phi: number) => {
		const P = engPt(a, rho, phi);
		return clear(P) ? scr(P) : null;
	};
	// drawn after the plume as well, so the burn reads as coming out of the bell rather than lying over it
	ring(LB, lip(RE), 'lip');
	ring(LB, lip(RE + SHELL), 'lip');
	// the outline of the shell against what lies behind it
	const sky: (number[] | null)[] = [];
	for (let k = 0; k <= 160; k++) {
		const a = A0 + ((LB - A0) * k) / 160;
		let best: number[] | null = null;
		for (let i = 0; i < 360; i++) {
			const p0 = (i / 360) * Math.PI, p1 = ((i + 1) / 360) * Math.PI;
			if (Math.sign(facing(a, p0, 1)) === Math.sign(facing(a, p1, 1))) continue;
			const P = engPt(a, engineR(a) + SHELL, (p0 + p1) / 2), q = scr(P);
			if (clear(P) && (!best || q[1] < best[1])) best = q;
		}
		sky.push(best);
	}
	run(sky, 'e-hw');
	// inside the bell
	// the tubes warm towards the throat
	for (let i = 0; i < 40; i++)
		for (const [a0, a1, cls] of [[0, 0.3, 'inner-warm'], [0.3, 1, 'inner']] as [number, number, string][])
			run(Array.from({ length: 36 }, (_, k) => inner(LB * (a0 + ((a1 - a0) * k) / 35), (i / 40) * 2 * Math.PI)), cls);
	for (const a of [LB * 0.18, LB * 0.5]) ring(a, inner, 'inner');
	ring(0, inner, 'hot');

	// A static fire, for whoever clicks the mouth. The jet leaves the bell along its axis, lifted a little because the
	// sand blocks its lower half, and widens as it goes. Each layer of flame is the part of that widening jet that clears
	// the ground, outlined as the eye sees it: its top edge, its far end, and the line where it meets the sand.
	// The jet is built on screen from the opening itself, so it can only come out of the mouth. Each layer starts as the
	// open part of the exit (the lip above the sand), shrunk towards its middle for the hotter layers, and is swept
	// along the nozzle's axis as it appears in perspective, growing as it comes nearer and closing in a tail.
	let c0 = [0, 0];
	const mouth = Array.from({ length: 73 }, (_, i) => engPt(LB, RE, (i / 72) * Math.PI)).filter((P) => P[2] > 0).map(scr);
	// the jet runs flat across the screen from the middle of the opening, thickening slightly as it goes
	const LPX = 560;
	const along = (t: number) => ({ c: [c0[0] + t * LPX, c0[1]], s: 1 + 0.22 * t });
	// the opening's half-width and half-height on screen: seen at an angle it is a tall, narrow ellipse
	const [RX, RY] = [0, 1].map((k) => (Math.max(...mouth.map((p) => p[k])) - Math.min(...mouth.map((p) => p[k]))) / 2), R0 = RY;
	c0 = [0, 1].map((k) => (Math.max(...mouth.map((p) => p[k])) + Math.min(...mouth.map((p) => p[k]))) / 2); // the opening's middle
	fire.wipe = n(c0[0] - RX - 4); // the left edge of the opening, where the horizontal reveal starts
	// the outline of a set of points, Andrew's monotone chain
	const hull = (pts: number[][]) => {
		const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
		const half = (q: number[][]) => q.reduce((h: number[][], v) => {
			while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], v) <= 0) h.pop();
			h.push(v);
			return h;
		}, []);
		const lo = half(p), up = half(p.reverse());
		return [...lo.slice(0, -1), ...up.slice(0, -1)];
	};
	const flame = (k: number, m: number, seed: number) => {
		const pts = mouth.map((p) => [c0[0] + (p[0] - c0[0]) * k, c0[1] + (p[1] - c0[1]) * k]);
		for (let i = 1; i <= 40; i++) {
			const t = i / 40, { c, s } = along(t * m), wob = 1 + 0.04 * Math.sin(t * 17 + seed);
			const r = R0 * k * s * wob * (k > 0.9 ? Math.sqrt(1 - t ** 6) * (1 + 0.12 * t) : (1 - t) ** 0.6 * (1 + 0.25 * t));
			const rx = r * (RX / RY + (1 - RX / RY) * Math.min(1, t * 1.6)); // starts as the mouth's own ellipse, rounds out downstream
			for (let j = 0; j < 16; j++) pts.push([c[0] + rx * Math.cos((j / 16) * 2 * Math.PI), c[1] + r * Math.sin((j / 16) * 2 * Math.PI)]);
		}
		return line(hull(pts)) + 'Z';
	};
	fire.layers = [flame(1, 1, 0), flame(0.72, 0.78, 1.7), flame(0.48, 0.5, 3.1), flame(0.26, 0.3, 4.4)];
	// Mach diamonds standing on the core's axis just out of the mouth, shrinking downstream
	for (const [t, z] of [[0.05, 1], [0.11, 0.86], [0.17, 0.72], [0.23, 0.6], [0.29, 0.48]]) {
		const { c, s } = along(t), w = R0 * 0.2 * z * s, h = w * 0.42;
		fire.diamonds += `M${n(c[0] - w)} ${n(c[1])}L${n(c[0])} ${n(c[1] - h)}L${n(c[0] + w)} ${n(c[1])}L${n(c[0])} ${n(c[1] + h)}Z`;
	}
	// streams through the flame, leaving from points across the opening
	const frnd = rng(0xf17e);
	for (let k = 0; k < 22; k++) {
		const f = (frnd() * 2 - 1) * 0.8, L = 0.45 + 0.5 * frnd(), o = [0, f];
		fire.streams.push(line(Array.from({ length: 30 }, (_, i) => {
			const { c, s } = along((L * i) / 29);
			return [c[0] + o[0] * R0 * s * (1 + (0.3 * i) / 29), c[1] + o[1] * R0 * s * (1 + (0.3 * i) / 29)];
		})));
	}
	const end = along(1).c;
	fire.fade = { x1: n(c0[0]), y1: n(c0[1]), x2: n(end[0]), y2: n(end[1]) };
	// the cliff the mouth is cut into, as screen columns from its crest down to the sand, for what the burn shakes loose
	const crest = snaps[rowOf(EXIT[1] + 80)], foot = c0[1] + RY;
	for (let x = Math.round(c0[0] - RX - 170); x <= Math.round(c0[0] + RX + 120); x += 6) if (crest[x] < foot - 12) fire.cliff.push([x, n(crest[x]), n(foot)]);
	fire.mouth = [n(c0[0]), n(c0[1]), n(RY)];
	// where to click, and the screen direction the plume fades along
	const rim = Array.from({ length: 60 }, (_, i) => scr(engPt(LB, RE, (i / 59) * Math.PI))).filter((p, i) => engPt(LB, RE, (i / 59) * Math.PI)[2] > 0);
	const xs = rim.map((p) => p[0]), ysl = rim.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ysl), y1 = Math.max(...ysl);
	fire.hit = { cx: n((x0 + x1) / 2), cy: n((y0 + y1) / 2 + 6), rx: n((x1 - x0) / 2), ry: n((y1 - y0) / 2 + 6) };
}
lathe(NOSE, { meridians: 36, worn: 0.42, rings: [{ k: 30, cls: 'band', rivets: true }] });

// the fins: rivets along the root, where the slab meets the hill
for (const f of FINS) {
	const x0 = f.X - f.cr / 2;
	for (let X = x0 + 8; X < x0 + f.cr - 4; X += 7) {
		const P = finP(f, X), h = Math.max(rock(X, f.Z - f.t * 0.5) + 6, 8), Z = f.Z - f.t * (1 - h / P);
		if (h < P - 4 && visible(X, Z, h)) hw.rivet += rect(...(project(X, Z, h).map((v) => v - 0.4) as [number, number]), 0.8, 0.8);
	}
}

// ---------- a propellant line along the left hill to the engine ----------

// it holds one height across the hillside, the way a contour does, flanged every few metres, with one valve
let pipe = '';
{
	// found column by column: the nearest point on screen where the hillside reaches the line's height
	const PH = 64, pts: (number[] | null)[] = [];
	for (let x = 96; x < 588; x += 2) {
		let Z = ZN + 4;
		while (Z < 1300 && height(((x - W / 2) * Z) / F, Z) < PH) Z += 1.5;
		const X = ((x - W / 2) * Z) / F;
		pts.push(Z < 1300 && visible(X, Z, PH + 2) ? project(X, Z, PH + 1) : null);
	}
	let run: number[][] = [], k = 0;
	for (const p of [...pts, null]) {
		if (p) {
			run.push(p);
			continue;
		}
		if (run.length > 6) {
			pipe += line(run.map(([x, y]) => [x, y - 0.9])) + line(run.map(([x, y]) => [x, y + 0.9]));
			for (let i = 6; i < run.length - 3; i += 11, k++) {
				const [x, y] = run[i];
				pipe += k === 17 ? `M${n(x - 2.4)} ${n(y - 2)}L${n(x + 2.4)} ${n(y + 2)}V${n(y - 2)}L${n(x - 2.4)} ${n(y + 2)}Z` : `M${n(x - 0.7)} ${n(y - 2)}v4M${n(x + 0.7)} ${n(y - 2)}v4`;
			}
		}
		run = [];
	}
}

// ---------- riders on the sand ----------

// two dirt-bike tracks on the open sand between the hills: a long lap that a group of three rides, and a figure of
// eight for one rider by the right-hand dunes. Each is resampled at an even ground step for footerRide.
const sampleTrack = (f: (u: number) => number[]) => {
	const dense = Array.from({ length: 3001 }, (_, i) => f(i / 3000));
	const out: number[] = [];
	let carry = 0;
	for (let i = 1; i < dense.length; i++) {
		const [X0, Z0] = dense[i - 1], [X1, Z1] = dense[i], l = Math.hypot(X1 - X0, Z1 - Z0);
		for (carry += l; carry >= RIDE_STEP; carry -= RIDE_STEP) {
			const u = 1 - (carry - RIDE_STEP) / l, X = X0 + (X1 - X0) * u, Z = Z0 + (Z1 - Z0) * u, h = height(X, Z), [x, y] = project(X, Z, h);
			out.push(n(x), n(y), Math.round((F / Z) * 1000) / 1000, visible(X, Z, h + 4) ? 1 : 0);
		}
	}
	return out;
};
const TAU = 2 * Math.PI;
const LAP = [Xof(0.15, 700), 700], EIGHT = [Xof(0.33, 540), 540];
export const tracks = [
	sampleTrack((u) => [LAP[0] + 280 * Math.cos(TAU * u) + 40 * Math.sin(3 * TAU * u), LAP[1] + 190 * Math.sin(TAU * u) + 28 * Math.cos(2 * TAU * u)]),
	sampleTrack((u) => [EIGHT[0] + 120 * Math.sin(TAU * u), EIGHT[1] + 72 * Math.sin(2 * TAU * u)]),
];

export const land = {
	paths: out,
	vias,
	pads: pads.join(''),
	junctions,
	hw,
	routes,
	pipe,
	ics,
	// everything below the skyline, filled, so the stars and the far range stop at the land
	mask: line([[0, H + 60], ...Array.from({ length: W / 4 + 1 }, (_, k) => [k * 4, hor[k * 4]]), [W, H + 60]]) + 'Z',
};

// ---------- the far range, beyond the surveyed land ----------

const ridged1 = (x: number, scale: number, o: number) => {
	let a = 0, sum = 0;
	for (let i = 0; i < 5; i++) {
		const w = 1 / 2 ** i;
		a += ridged(vnoise(x / (scale / 2 ** i) + o + i * 53)) * w;
		sum += w;
	}
	return a / sum;
};
export const farY = (x: number) => HORIZON + 4 - (6 + 74 * ridged1(x, 260, 3)) * (0.35 + 0.65 * bump(x, 1560, 330) + 0.45 * bump(x, 130, 260));
const fxs = Array.from({ length: W / 3 + 1 }, (_, k) => k * 3);
let fhatch = '';
for (const x of fxs) {
	const slope = (farY(x + 3) - farY(x - 3)) / 6;
	for (let j = 0; j * 4 < 40; j++) {
		if (rnd() > 0.5 * Math.exp(-j / 3)) continue;
		const xx = x + rnd() * 3, y = farY(xx) + 3 + j * 4 + rnd() * 2, len = 2 + rnd() * 4;
		if (slope < -0.1 || rnd() < 0.25) fhatch += `M${n(xx)} ${n(y)}l${n(len)} ${n(farY(xx + len) - farY(xx))}`;
	}
}
export const far = {
	fill: line([[0, H], ...fxs.map((x) => [x, farY(x)]), [W, H]]) + 'Z',
	edge: line(fxs.map((x) => [x, farY(x)])),
	hatch: fhatch,
};
