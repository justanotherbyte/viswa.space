// The footer scene: London and Imperial on the left, South India in the middle with Mysore Palace and a temple gopuram, the
// Mojave launch site with VEGA on the right, and a RISC-V datapath under the ground. It draws on a low-res canvas that
// CSS scales up with crisp pixels. Light mode is afternoon, dark mode is night. An astronaut can be played through all of it,
// and can board the rocket to fly it over the rest of the page.

import { CATCH, climb, CUTOFF, drop, FLIP, fly, IGNITION, newDrop, RELEASE, returnPath, type Drop, type Ship } from './flight';
import { carry, newBody, step, type Input, type Platform, type Wall } from './parkour';

export const W = 480; // world width the landmarks are laid out in; wider screens get more city and desert at the edges
export const H = 112;
const GROUND = 88;
const CITY_END = 142;
const GREEN_END = 274;
const ROCKET_X = 388; // left column of the rocket body

const NIGHT = {
	sky: ['#18181b', '#191a2c', '#1c1e3b', '#252549', '#33294f'],
	star: '#eef0ff', starDim: '#6f75a0',
	orb: '#f1ead0', orbRim: '#d8cfa8', orbDark: '#bfb58f', glow: '#22233f' as string | null,
	far: '#252848', farRim: '#30335a',
	mesa: '#352a45', mesaRim: '#45365a', mesaDark: '#2c233a',
	hill: '#1a2e30', hillDark: '#132325', hillLit: '#223b3b',
	bldg: '#20213a', bldgEdge: '#272844', win: '#2a2b46', winLit: '#e9b955', litChance: 0.3,
	brick: '#5e2a28', brickLit: '#743330', brickDark: '#46201f', frieze: '#8a5a3e', cornice: '#77707a', hallWin: '#f2b950',
	dome: '#363d58', domeLit: '#454e6e', domeDark: '#2a3046',
	stone: '#5b5870', stoneLit: '#6d6a84', stoneDark: '#47445a', copper: '#2f5a52', copperLit: '#3d7166', copperDark: '#244540',
	letters: '#e4e6f0',
	curb: '#3a3a46', road: '#24242c', curbDark: '#1c1c22',
	grass: '#1f3a2b', grassDark: '#183024', grassLit: '#28473a',
	wood: '#4a342c', palace: '#8c6b5c', palaceLit: '#b08a6a', palaceDark: '#5e4747', niche: '#d08a3c', maroon: '#7c2c40', maroonLit: '#a04456', bulb: '#ffe29a' as string | null, gold: '#f2b950',
	granite: '#7d5f55', graniteLit: '#96756a', graniteDark: '#573f3d', door: '#ffc861', paint: ['#a8443a', '#2b7f80', '#c08a34', '#3b58a0', '#994575'],
	earth: '#4f342e', earthDark: '#402a27', palm: '#1d4434', palmDark: '#14322a', diya: '#ff8a3c', diyaHi: '#ffe08a', autoTop: '#e0aa32', autoBody: '#1f6b45',
	sand: '#45363c', sandLit: '#54434a', sandDark: '#392c33', joshua: '#1d1826',
	canopy: '#1e40af', canopyDark: '#1e3a8a', metal: '#4b4f5c', metalDark: '#33363f', screen: '#0b1020', screenInk: '#60a5fa',
	cab: '#2a1d3d', cabLit: '#3a2a55', marquee: ['#f472b6', '#fb923c'],
	trailer: '#3d404d', trailerShade: '#2e303b', tank: '#5a5d6c', tankShade: '#474a57',
	concrete: '#3b3b44', concreteDark: '#2c2c33', tower: '#4b4f5c', towerDark: '#33363f',
	rocket: ['#f2f3f8', '#d9dbe6', '#c4c7d6', '#8d91a8', '#666a82'], band: '#0b0b10', accent: '#60a5fa',
	soil: '#26211f', soilGrain: '#302a27', under: '#141316', underGrain: '#1c1b1f',
	trace: '#9a6a3c', traceDim: '#4a3524', chip: '#08080a', chipPin: '#71717a', label: '#a1a1aa', bit: '#60a5fa', bitDim: '#244a7a',
	tunnel: '#0d0c0e', tunnelRing: '#221f22', rail: '#52525b', train: '#c9ccd8', trainDoor: '#b0282a', trainSkirt: '#1e3a8a', trainWin: '#ffd479',
	cloud: ['#2a2c4e', '#363a63', '#222341'], cfCloud: ['#7a4224', '#9c5730', '#5c3220'],
	plane: '#c9ccd8', planeShade: '#8d91a5', planeStripe: '#3b5bb0', tiles: '#0b0b10',
	bus: '#b0282a', busDark: '#7d1c1e', busGlass: '#ffd479',
	smoke: ['#d3d5e2', '#9a9cb4', '#5e607a'], flame: ['#fff6c8', '#ffb347', '#ff6a2b'],
	light: '#ffe9b0' as string | null,
};
type Pal = typeof NIGHT;

const DAY: Pal = {
	sky: ['#ffffff', '#eef5fc', '#dcebf8', '#cae1f4', '#d9e9f5'],
	star: '#ffffff', starDim: '#ffffff',
	orb: '#fff4c2', orbRim: '#ffd66b', orbDark: '#ffd66b', glow: null,
	far: '#c3d3e3', farRim: '#d6e2ee',
	mesa: '#e2b48a', mesaRim: '#efc9a2', mesaDark: '#cf9c74',
	hill: '#5e9a55', hillDark: '#457d43', hillLit: '#7bb466',
	bldg: '#b9c4d0', bldgEdge: '#c9d2dc', win: '#a3afbd', winLit: '#a3afbd', litChance: 0,
	brick: '#b8573d', brickLit: '#cf6e4f', brickDark: '#94432f', frieze: '#e0b07a', cornice: '#ead9c0', hallWin: '#4a2a22',
	dome: '#8d9aab', domeLit: '#aebccb', domeDark: '#6f7c8e',
	stone: '#e6dccb', stoneLit: '#f4ede0', stoneDark: '#c7baa4', copper: '#6fb39a', copperLit: '#8fcbb3', copperDark: '#4f927b',
	letters: '#1e3a8a',
	curb: '#c9c9cf', road: '#6c6c74', curbDark: '#55555c',
	grass: '#6aa84f', grassDark: '#548f3f', grassLit: '#86c062',
	wood: '#7a5240', palace: '#dcd0bf', palaceLit: '#f3eadb', palaceDark: '#b5a48d', niche: '#75645a', maroon: '#a83a4a', maroonLit: '#cc6670', bulb: null, gold: '#d99a1c',
	granite: '#c79a78', graniteLit: '#dfb893', graniteDark: '#9b7053', door: '#4a2f24', paint: ['#e0553d', '#2fa39c', '#f2b632', '#4472cf', '#d65a9b'],
	earth: '#b9714c', earthDark: '#a05e3d', palm: '#4c9a4a', palmDark: '#35783a', diya: '#f2842c', diyaHi: '#ffd23f', autoTop: '#f7c531', autoBody: '#2e8f5a',
	sand: '#e7c79a', sandLit: '#f1d8b1', sandDark: '#d4ae7c', joshua: '#6f7d4a',
	canopy: '#3b82f6', canopyDark: '#2563eb', metal: '#8a8f99', metalDark: '#5d626b', screen: '#0f172a', screenInk: '#60a5fa',
	cab: '#3b2a5a', cabLit: '#56407f', marquee: ['#f472b6', '#fb923c'],
	trailer: '#eef0f3', trailerShade: '#c7ccd4', tank: '#f3f4f6', tankShade: '#d1d5db',
	concrete: '#c4c4c8', concreteDark: '#9a9aa1', tower: '#8a8f99', towerDark: '#5d626b',
	rocket: ['#ffffff', '#f4f5f8', '#eceef2', '#c9cdd6', '#a3a8b3'], band: '#1f2937', accent: '#3b82f6',
	soil: '#5a4636', soilGrain: '#6e5644', under: '#262220', underGrain: '#302b28',
	trace: '#c98a4b', traceDim: '#5f4630', chip: '#111113', chipPin: '#a1a1aa', label: '#d4d4d8', bit: '#7cb8ff', bitDim: '#2f5d9a',
	tunnel: '#171513', tunnelRing: '#332e29', rail: '#71717a', train: '#e5e7eb', trainDoor: '#d7312b', trainSkirt: '#1e40af', trainWin: '#93c5fd',
	cloud: ['#ffffff', '#ffffff', '#dde8f2'], cfCloud: ['#f6821f', '#fbad41', '#d9650f'],
	plane: '#b4bfcc', planeShade: '#8593a3', planeStripe: '#2b4ea2', tiles: '#1f2937',
	bus: '#d7312b', busDark: '#a3211f', busGlass: '#a9cfe6',
	smoke: ['#ffffff', '#e5e8ec', '#c4c9d0'], flame: ['#fff6c8', '#ffb347', '#ff6a2b'],
	light: null,
};

// ---- pixel helpers ----

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
const hash2 = (x: number, y: number) => hash(x * 57.31 + y * 911.17);
const noise = (x: number) => {
	const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
	return hash(i) * (1 - u) + hash(i + 1) * u;
};
const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

// 3x5 letters for the IMPERIAL sign and the datapath labels
const FONT: Record<string, string> = Object.fromEntries(
	Object.entries({
		A: ['.#.', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
		E: ['###', '#..', '##.', '#..', '###'], G: ['.##', '#..', '#.#', '#.#', '.##'], I: ['###', '.#.', '.#.', '.#.', '###'],
		L: ['#..', '#..', '#..', '#..', '###'], M: ['#.#', '###', '###', '#.#', '#.#'], P: ['##.', '#.#', '##.', '#..', '#..'],
		R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
	}).map(([k, rows]) => [k, rows.join('')]),
);

class Pen {
	constructor(public g: CanvasRenderingContext2D, public cam: number) {}
	px(x: number, y: number, c: string) {
		this.g.fillStyle = c;
		this.g.fillRect(x - this.cam, y, 1, 1);
	}
	rect(x: number, y: number, w: number, h: number, c: string) {
		this.g.fillStyle = c;
		this.g.fillRect(x - this.cam, y, w, h);
	}
	text(s: string, x: number, y: number, c: string) {
		for (const ch of s) {
			const g = FONT[ch];
			for (let i = 0; i < 15; i++) if (g[i] === '#') this.px(x + (i % 3), y + Math.floor(i / 3), c);
			x += 4;
		}
	}
	disc(cx: number, cy: number, r: number, c: (dx: number, dy: number) => string | null) {
		const R = Math.ceil(r);
		for (let dy = -R; dy <= R; dy++)
			for (let dx = -R; dx <= R; dx++)
				if (dx * dx + dy * dy <= r * r) {
					const col = c(dx, dy);
					if (col) this.px(cx + dx, cy + dy, col);
				}
	}
}

// ---- fixed geometry shared by the static layer and the animation ----

const HALL_X = 70; // Royal Albert Hall
const TOWER_X = 121; // Queen's Tower
const PALACE_X = 186;
const GOPURAM_X = 245;
// diyas along the lawn, kept clear of the palace path and the temple door
const DIYAS = Array.from({ length: 14 }, (_, i) => ({ x: 154 + i * 8, ph: hash(i * 3.3) * 6.28 })).filter(
	({ x }) => Math.abs(x - PALACE_X) > 6 && Math.abs(x - GOPURAM_X) > 4,
);

// the single-cycle datapath from Zero to RISC-V, as chips on a copper bus
const CHIPS = [
	{ name: 'PC', x: 150, w: 11 },
	{ name: 'IMEM', x: 174, w: 19 },
	{ name: 'REGS', x: 208, w: 19 },
	{ name: 'ALU', x: 244, w: 15 },
	{ name: 'DMEM', x: 274, w: 19 },
];
const CHIP_Y = 97, CHIP_H = 9;
const inChip = (x: number, y: number) => y >= CHIP_Y && y < CHIP_Y + CHIP_H && CHIPS.some((c) => x >= c.x && x < c.x + c.w);
const trace = (pts: number[][]) => {
	const out: [number, number][] = [];
	for (let i = 1; i < pts.length; i++) {
		let [x, y] = pts[i - 1];
		const [tx, ty] = pts[i];
		while (x !== tx || y !== ty) {
			out.push([x, y]);
			x += Math.sign(tx - x);
			y += Math.sign(ty - y);
		}
	}
	return out;
};
const PATHS = [
	{ p: trace([[149, 101], [164, 101], [164, 95], [146, 95], [146, 101], [149, 101]]), n: 2, v: 11 }, // PC + 4
	{ p: trace([[161, 101], [296, 101], [296, 108], [204, 108], [204, 101], [208, 101]]), n: 5, v: 22 }, // fetch to writeback
	{ p: trace([[227, 99], [244, 99]]), n: 1, v: 9 }, // rs1
	{ p: trace([[227, 103], [244, 103]]), n: 1, v: 7 }, // rs2
];

// the rocket: rows of [y, left, width] for nose, body, engine and nozzle, plus fin pixels
const ROCKET: [number, number, number][] = [];
[[44, 2, 1], [45, 2, 1], [46, 1, 3], [47, 1, 3], [48, 1, 3]].forEach(([y, l, w]) => ROCKET.push([y, l, w]));
for (let y = 49; y <= 84; y++) ROCKET.push([y, 0, 5]);
ROCKET.push([85, 1, 3]);
const FINS: [number, number][] = [];
for (let y = 78; y <= 85; y++) {
	FINS.push([-1, y], [5, y]);
	if (y >= 81) FINS.push([-2, y], [6, y]);
}
const ROCKET_TOP = 44, NOZZLE = 85, ROCKET_MID = 65;
function rocketPixels(P: Pal) {
	const out: [number, number, string][] = [];
	for (const [y, l, w] of ROCKET)
		for (let i = l; i < l + w; i++) {
			let c = P.rocket[i];
			if (y === 60 || y === 61 || y === 76) c = P.band;
			if (y === 67 || y <= 45) c = P.accent;
			if (y >= 82) c = P.rocket[4];
			out.push([ROCKET_X + i, y, c]);
		}
	for (const [x, y] of FINS) out.push([ROCKET_X + x, y, P.band]);
	return out;
}
// the rocket turned to one of 32 headings by nearest-pixel sampling, with a dark outline so it reads over any page
const HEADINGS = 32, SPRITE = 25;
function rocketSprite(px: [number, number, string][], heading: number) {
	const grid = new Map(px.map(([x, y, c]) => [`${x - ROCKET_X - 2},${y - ROCKET_MID}`, c]));
	const a = (heading / HEADINGS) * Math.PI * 2, cos = Math.cos(a), sin = Math.sin(a);
	const at = (dx: number, dy: number) => grid.get(`${Math.round(dx * cos + dy * sin)},${Math.round(dy * cos - dx * sin)}`);
	const c = document.createElement('canvas');
	c.width = c.height = SPRITE * 2 + 1;
	const pen = new Pen(c.getContext('2d')!, -SPRITE);
	for (let y = -SPRITE; y <= SPRITE; y++)
		for (let x = -SPRITE; x <= SPRITE; x++) {
			const edge = at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1);
			const col = at(x, y) ?? (edge && '#0b0b10');
			if (col) pen.px(x, y + SPRITE, col);
		}
	return c;
}

// clouds as pixel masks: 1 body, 2 lit edge, 3 shadow
function cloudMask(w: number, seed: number) {
	const h = Math.round(w * 0.42);
	const puffs = [
		{ x: w * 0.5, y: h * 0.55, r: h * 0.5 },
		{ x: w * 0.28, y: h * 0.72, r: h * 0.36 },
		{ x: w * 0.72, y: h * 0.7, r: h * 0.38 },
		{ x: w * (0.35 + hash(seed) * 0.2), y: h * 0.4, r: h * 0.34 },
	];
	const inside = (x: number, y: number) => y < h && puffs.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 <= p.r * p.r);
	const m: number[][] = [];
	for (let y = 0; y < h; y++) {
		m.push([]);
		for (let x = 0; x < w; x++) {
			if (!inside(x + 0.5, y + 0.5)) m[y].push(0);
			else if (!inside(x - 0.5, y - 0.5) || !inside(x + 0.5, y - 0.5)) m[y].push(2);
			else if (y >= h - 2 || !inside(x + 0.5, y + 1.5)) m[y].push(3);
			else m[y].push(1);
		}
	}
	return m;
}
const CLOUDS = [
	{ x: 30, y: 12, m: cloudMask(30, 1), v: 1.6, cf: true },
	{ x: 180, y: 23, m: cloudMask(22, 2), v: 2.2, cf: false },
	{ x: 300, y: 18, m: cloudMask(34, 3), v: 1.2, cf: false },
	{ x: 520, y: 24, m: cloudMask(18, 4), v: 2.6, cf: false },
	{ x: -160, y: 20, m: cloudMask(26, 5), v: 1.9, cf: false },
];

const cityBlock = (i: number) => {
	const bx = i * 9 + (hash(i * 1.7) < 0.3 ? 1 : 0);
	return { bx, bw: 9 - (bx - i * 9) - (hash(i * 2.9) < 0.4 ? 1 : 0), top: GROUND - 8 - Math.floor(hash(i * 3.3) * 20) };
};
const joshuas = (x1: number) => {
	const xs = [282, 293, 452, 474];
	for (let k = Math.ceil(500 / 37); k * 37 < x1 + 10; k++) xs.push(k * 37 + Math.floor(hash(k) * 20));
	return xs;
};

// ---- what the astronaut can stand on and cling to; keep in step with the drawing code below ----

function buildLevel(x0: number, x1: number) {
	const plats: Platform[] = [{ x: x0 - 100, y: GROUND, w: x1 - x0 + 200, ground: true }];
	const walls: Wall[] = [];
	const on = (cx: number, hw: number, y: number) => plats.push({ x: cx - hw, y, w: hw * 2 + 1 });
	const span = (a: number, b: number, y: number) => plats.push({ x: a, y, w: b - a });
	const dome = (cx: number, y: number, hws: number[]) => hws.forEach((hw, i) => hw > (hws[i - 1] ?? -1) && on(cx, hw, y + i));
	const faces = (a: number, b: number, y0: number, y1: number) => walls.push({ x: a, y0, y1, side: 1 }, { x: b, y0, y1, side: -1 });

	for (let i = Math.floor(x0 / 9) - 1; i * 9 < 140; i++) {
		const { bx, bw, top } = cityBlock(i);
		if (bx + bw < HALL_X - 28 || bx > HALL_X + 28) span(bx, Math.min(bx + bw, 140), top);
	}
	for (let x = HALL_X - 27; x <= HALL_X + 27; x++) on(x, 0, 70 - Math.round(10 * Math.sqrt(Math.max(0, 1 - ((x - HALL_X) / 27.5) ** 2))));
	on(HALL_X, 1, 57);
	[2, 4, 6, 8].forEach((hw, i) => on(HALL_X, hw, 74 + i));
	faces(HALL_X - 26, HALL_X + 27, 72, GROUND);

	on(TOWER_X, 4, 51);
	on(TOWER_X, 5, 43);
	dome(TOWER_X, 37, [0, 1, 2, 3, 4]);
	on(TOWER_X, 0, 34);
	faces(TOWER_X - 3, TOWER_X + 4, 52, GROUND);
	span(103, 134, 82); // the IMPERIAL letters

	for (const x of [PALACE_X - 23, PALACE_X + 23]) {
		on(x, 4, 60);
		dome(x, 53, [0, 1, 2, 3]);
		faces(x - 3, x + 4, 60, 78);
	}
	for (const x of [PALACE_X - 12, PALACE_X + 12]) {
		on(x, 3, 63);
		dome(x, 58, [0, 1, 2]);
	}
	for (const y of [48, 55]) on(PALACE_X, 5, y);
	dome(PALACE_X, 40, [0, 1, 2, 3, 4]);
	faces(PALACE_X - 4, PALACE_X + 5, 48, 62);
	for (const y of [62, 70]) on(PALACE_X, 10, y);
	for (const [hw, y] of [[27, 69], [29, 78]]) {
		span(PALACE_X - hw, PALACE_X - 9, y);
		span(PALACE_X + 10, PALACE_X + hw + 1, y);
	}

	[15, 13, 11, 10, 8, 7, 5].forEach((hw, i) => on(GOPURAM_X, hw, 73 - i * 4));
	on(GOPURAM_X, 3, 46);
	faces(GOPURAM_X - 14, GOPURAM_X + 15, 73, GROUND);

	for (const x of [154, 222]) on(x, 4, 61);
	for (const [x, hw, y] of [[143, 4, 66], [143, 6, 69], [273, 4, 61], [273, 6, 64], [267, 3, 67], [279, 3, 67]]) on(x, hw, y);
	span(137, 151, 81);

	for (const x of joshuas(x1)) on(x, 2, 78);
	span(298, 325, 73);
	span(301, 311, 82);
	span(331, 335, 85);
	span(335, 365, 74);
	span(360, 364, 68);
	faces(335, 365, 74, GROUND);
	for (const x of [368, 373]) span(x, x + 4, 78);
	span(380, 413, 86);
	for (let y = 42; y < 86; y += 8) span(397, 402, y);
	span(395, 403, 34);
	faces(397, 402, 34, 86);
	span(424, 430, 50);
	return { plats, walls };
}

// the widest row of each cloud's upper half is what you stand on
const CLOUD_TOPS = CLOUDS.map((c) => {
	const y = c.m.findIndex((row) => row.filter(Boolean).length >= row.length * 0.5);
	const a = c.m[y].findIndex(Boolean);
	return { y: c.y + y, a, w: c.m[y].findLastIndex(Boolean) - a + 1 };
});

// ---- static layers ----

function drawBack(p: Pen, P: Pal, night: boolean, x0: number, x1: number, twinklers: { x: number; y: number; f: number; ph: number }[]) {
	// sky bands with a short ordered-dither seam between each
	const stops = [0, 18, 36, 54, 72, H];
	for (let y = 0; y < GROUND; y++) {
		let k = 0;
		while (y >= stops[k + 1]) k++;
		const seam = stops[k + 1] - y;
		if (seam > 5 || k === P.sky.length - 1) p.rect(x0, y, x1 - x0, 1, P.sky[k]);
		else for (let x = x0; x < x1; x++) p.px(x, y, bayer(x, y) < (6 - seam) / 6 ? P.sky[k + 1] : P.sky[k]);
	}

	const OX = 446, OY = 15;
	if (night) {
		for (let x = x0; x < x1; x++) {
			if (hash(x * 3.17) > 0.075) continue;
			const y = Math.floor(hash(x * 7.71) ** 1.7 * 46);
			if ((x - OX) ** 2 + (y - OY) ** 2 < 120) continue;
			if (hash(x * 5.3) > 0.78) twinklers.push({ x, y, f: 1.5 + hash(x) * 3, ph: hash(x * 9.1) * 6.28 });
			else {
				const b = hash(x * 1.37);
				p.px(x, y, b > 0.72 ? P.star : P.starDim);
				if (b > 0.97) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx, y + dy, P.starDim);
			}
		}
		p.disc(OX, OY, 8.5, (dx, dy) => (dx * dx + dy * dy > 30 && bayer(OX + dx, OY + dy) < 0.5 ? P.glow : null));
		const craters = ['-2,-1', '1,1', '2,-2', '-1,2', '-3,1'];
		p.disc(OX, OY, 5.3, (dx, dy) => (craters.includes(`${dx},${dy}`) ? P.orbDark : dx * dx + dy * dy > 19 || dx + dy > 4 ? P.orbRim : P.orb));
	} else {
		p.disc(OX, OY, 6.3, (dx, dy) => (dx * dx + dy * dy > 27 ? P.orbRim : P.orb));
	}

	// far range: low behind the city, highest over the Mojave
	for (let x = x0; x < x1; x++) {
		const top = Math.round(56 + 9 * noise(x / 31) + 4 * noise(x / 9 + 40) + 14 * (1 - ramp(x, 100, 175)) - 4 * ramp(x, 250, 320));
		p.rect(x, top, 1, GROUND - top, P.far);
		p.px(x, top, P.farRim);
	}

	// mesas: flat tops in three steps, lit on west faces, striped with strata
	// three flat-topped steps; each cliff drops 3px and then spreads into a talus slope
	const step = (x: number) => {
		const q = noise(x / 23 + 7);
		return q > 0.62 ? 69 : q > 0.38 ? 75 : 80;
	};
	const mesaTop = (x: number) => {
		let top = step(x);
		for (let k = 1; k <= 6; k++) top = Math.min(top, step(x - k) + 2 + k, step(x + k) + 2 + k);
		return top;
	};
	for (let x = Math.max(x0, 268); x < x1; x++) {
		const top = mesaTop(x), west = mesaTop(x - 1) > top, east = mesaTop(x + 1) > top;
		for (let y = top; y < GROUND; y++) {
			let c = P.mesa;
			if ((y - top) % 4 === 2 && bayer(x, y) < 0.5) c = P.mesaDark;
			if (east) c = P.mesaDark;
			if (west || y === top) c = P.mesaRim;
			p.px(x, y, c);
		}
	}

	// city blocks behind the landmarks, with lit windows at night
	for (let i = Math.floor(x0 / 9) - 1; i * 9 < Math.min(x1, 140); i++) {
		const { bx, bw, top } = cityBlock(i);
		for (let x = bx; x < bx + bw && x < 140; x++) p.rect(x, top, 1, GROUND - top, x === bx ? P.bldgEdge : P.bldg);
		for (let wx = bx + 2; wx < bx + bw - 1 && wx < 139; wx += 2)
			for (let wy = top + 2; wy < GROUND - 2; wy += 3) p.px(wx, wy, hash2(wx, wy) < P.litChance ? P.winLit : P.win);
		if (hash(i * 4.1) > 0.7) p.rect(bx + 2, top - 2, 1, 2, P.bldg);
		if (hash(i * 4.1) > 0.93) p.rect(bx + 5, top - 5, 1, 5, P.bldgEdge);
	}

	drawHall(p, P);
	drawQueensTower(p, P);

	// IMPERIAL, as on the plaza
	p.text('IMPERIAL', 103, 82, P.letters);
	p.rect(101, 87, 34, 1, P.curbDark);

	// a low line of mango trees, then the palace lawn with a path to its arch
	for (let x = Math.max(x0, 146); x < Math.min(x1, 280); x++) {
		const top = Math.round(GROUND - 7 - 7 * noise(x / 6 + 3));
		for (let y = top; y < GROUND; y++) p.px(x, y, hash2(x, y) < 0.22 ? P.hillDark : y === top ? P.hillLit : P.hill);
	}
	drawPalace(p, P);
	drawGopuram(p, P);
	for (let y = 84; y < GROUND; y++) for (let x = 146; x < 232; x++) p.px(x, y, y === 84 ? P.grassLit : bayer(x, y) < 0.25 ? P.grassDark : P.grass);
	p.rect(PALACE_X - 3, 84, 7, 4, P.earth);
	for (const x of [154, 222]) drawPalm(p, P, x);

	// ground strip: pavement and road, laterite road, sand
	for (let x = x0; x < x1; x++) {
		if (x < CITY_END) {
			p.px(x, 88, P.curb);
			p.rect(x, 89, 1, 2, P.road);
			p.px(x, 91, P.curbDark);
		} else if (x < GREEN_END) {
			for (let y = 88; y < 92; y++) p.px(x, y, y === 88 ? P.grassDark : hash2(x, y) < 0.2 ? P.earthDark : P.earth);
		} else {
			for (let y = 88; y < 92; y++) p.px(x, y, y === 88 ? P.sandLit : hash2(x, y) < 0.14 ? P.sandDark : P.sand);
		}
	}

	drawLaunchSite(p, P, night, x0, x1);
	drawUnderground(p, P, x0, x1);
}

function drawHall(p: Pen, P: Pal) {
	const cx = HALL_X;
	for (let x = cx - 27; x <= cx + 27; x++) {
		const d = (x - cx) / 27.5, h = Math.round(10 * Math.sqrt(Math.max(0, 1 - d * d)));
		for (let y = 70 - h; y < 70; y++) {
			let c = P.dome;
			if (d < -0.4 && bayer(x, y) < 0.7) c = P.domeLit;
			if (d > 0.35 && bayer(x, y) < (d - 0.35) / 0.4) c = P.domeDark;
			if ((x - cx) % 5 === 0) c = P.domeDark;
			if (y === 70 - h) c = P.domeLit;
			p.px(x, y, c);
		}
	}
	p.rect(cx - 1, 57, 3, 3, P.cornice);
	p.px(cx, 56, P.domeDark);
	for (let x = cx - 26; x <= cx + 26; x++) {
		const f = (x - cx) / 26;
		for (let y = 70; y < GROUND; y++) {
			let c = P.brick;
			if (f < -0.5 && bayer(x, y) < (-f - 0.5) / 0.35 + 0.2) c = P.brickLit;
			if (f > 0.45 && bayer(x, y) < (f - 0.45) / 0.4) c = P.brickDark;
			if (y <= 71) c = P.cornice;
			else if (y <= 73) c = y === 73 && x % 2 ? P.brickDark : P.frieze;
			const m = (((x - cx - 26) % 6) + 6) % 6;
			if ((y >= 77 && y <= 80 && m >= 1 && m <= 3) || (y === 76 && m === 2)) c = P.hallWin;
			const n = (((x - cx - 26) % 8) + 8) % 8;
			if (y >= 84 && n >= 3 && n <= 5) c = P.brickDark;
			p.px(x, y, c);
		}
	}
	// the south porch
	p.rect(cx - 7, 78, 15, 10, P.stoneDark);
	for (let x = cx - 7; x <= cx + 7; x += 2) p.rect(x, 78, 1, 10, P.stone);
	p.rect(cx - 8, 77, 17, 1, P.stoneLit);
	[[76, 6], [75, 4], [74, 2]].forEach(([y, hw]) => p.rect(cx - hw, y, hw * 2 + 1, 1, y === 74 ? P.stoneLit : P.stone));
}

function drawQueensTower(p: Pen, P: Pal) {
	const cx = TOWER_X;
	for (let y = 52; y < GROUND; y++) {
		p.px(cx - 3, y, P.stoneLit);
		p.rect(cx - 2, y, 4, 1, P.stone);
		p.rect(cx + 2, y, 2, 1, P.stoneDark);
	}
	for (const y of [58, 66, 74]) p.rect(cx, y, 1, 2, P.stoneDark);
	p.rect(cx - 4, 51, 9, 1, P.stoneLit);
	for (let y = 44; y <= 50; y++) {
		p.px(cx - 4, y, P.stoneLit);
		p.rect(cx - 3, y, 6, 1, P.stone);
		p.px(cx + 3, y, P.stoneDark);
		p.px(cx + 4, y, P.stoneDark);
	}
	for (const x of [cx - 2, cx, cx + 2]) p.rect(x, 46, 1, 4, P.stoneDark);
	p.rect(cx - 5, 43, 11, 1, P.stoneLit);
	[4, 4, 3, 2, 1, 0].forEach((hw, i) => {
		const y = 42 - i;
		p.rect(cx - hw, y, hw * 2 + 1, 1, P.copper);
		p.px(cx - hw, y, P.copperLit);
		if (hw) p.px(cx + hw, y, P.copperDark);
	});
	p.rect(cx, 34, 1, 3, P.stoneLit);
	for (const x of [cx - 5, cx + 5]) p.rect(x, 41, 1, 2, P.copper);
}

function drawPalace(p: Pen, P: Pal) {
	const cx = PALACE_X;
	const block = (x: number, hw: number, y0: number, y1: number) => {
		p.rect(x - hw, y0, hw * 2 + 1, y1 - y0, P.palace);
		p.rect(x - hw, y0, 1, y1 - y0, P.palaceLit);
		p.rect(x + hw - (hw >> 2), y0, (hw >> 2) + 1, y1 - y0, P.palaceDark);
	};
	// a cornice; at night it is strung with bulbs
	const cornice = (x: number, hw: number, y: number) => {
		p.rect(x - hw, y, hw * 2 + 1, 1, P.palaceLit);
		if (P.bulb) for (let dx = -hw; dx <= hw; dx += 2) p.px(x + dx, y, P.bulb);
	};
	// an onion dome given as half-widths from the tip down, with bulbs down its outline at night
	const dome = (x: number, y: number, hws: number[], c: string, lit: string, dark: string) =>
		hws.forEach((hw, i) => {
			p.rect(x - hw, y + i, hw * 2 + 1, 1, c);
			if (hw) p.rect(x - hw, y + i, Math.max(1, hw >> 1), 1, lit);
			if (hw > 1) p.rect(x + hw - 1, y + i, 2, 1, dark);
			if (P.bulb && i % 2 === 0) for (const e of [x - hw, x + hw]) p.px(e, y + i, P.bulb);
		});
	const arch = (x: number, y: number, hw: number, h: number) => {
		p.rect(x - hw + 1, y, hw * 2 - 1, 1, P.niche);
		p.rect(x - hw, y + 1, hw * 2 + 1, h - 1, P.niche);
	};

	// corner and inner towers, under maroon domes
	for (const x of [cx - 23, cx + 23]) {
		block(x, 3, 60, 70);
		cornice(x, 4, 60);
		arch(x, 63, 1, 4);
		dome(x, 53, [0, 1, 2, 3, 3, 3, 2], P.maroon, P.maroonLit, P.palaceDark);
		p.rect(x, 51, 1, 2, P.gold);
	}
	for (const x of [cx - 12, cx + 12]) {
		block(x, 2, 63, 70);
		cornice(x, 3, 63);
		dome(x, 58, [0, 1, 2, 2, 1], P.maroon, P.maroonLit, P.palaceDark);
		p.rect(x, 57, 1, 1, P.gold);
	}
	// the gilded central tower
	block(cx, 4, 48, 62);
	cornice(cx, 5, 48);
	cornice(cx, 5, 55);
	arch(cx, 50, 1, 4);
	arch(cx, 57, 1, 4);
	dome(cx, 40, [0, 1, 2, 3, 4, 4, 4, 3], P.gold, P.diyaHi, P.frieze);
	p.rect(cx, 36, 1, 4, P.gold);
	// two arcaded storeys and the stepped porch in front
	block(cx, 26, 70, 78);
	block(cx, 28, 78, 88);
	cornice(cx, 27, 69);
	cornice(cx, 29, 78);
	for (const dx of [-24, -19, -14, 14, 19, 24]) {
		arch(cx + dx, 72, 1, 5);
		arch(cx + dx, 81, 1, 7);
	}
	block(cx, 9, 62, 88);
	cornice(cx, 10, 62);
	cornice(cx, 10, 70);
	for (const dx of [-6, 0, 6]) arch(cx + dx, 64, 1, 5);
	arch(cx, 73, 4, 15);
	for (const dx of [-7, 7]) arch(cx + dx, 74, 1, 5);
}

function drawGopuram(p: Pen, P: Pal) {
	const cx = GOPURAM_X;
	p.rect(cx - 14, 73, 29, 15, P.granite);
	p.rect(cx - 14, 73, 2, 15, P.graniteLit);
	p.rect(cx + 9, 73, 6, 15, P.graniteDark);
	for (const x of [cx - 9, cx - 6, cx + 6]) p.rect(x, 76, 1, 12, P.graniteDark);
	p.rect(cx - 15, 73, 31, 1, P.graniteLit);
	p.rect(cx - 3, 77, 7, 11, P.graniteLit);
	p.rect(cx - 2, 78, 5, 10, P.door);
	for (let x = cx - 3; x <= cx + 3; x++) p.px(x, 77 + (x & 1), x & 1 ? P.diya : P.diyaHi); // marigold garland
	// six painted tiers, each narrower than the one below
	[13, 11, 10, 8, 7, 5].forEach((hw, i) => {
		const y = 69 - i * 4;
		for (let x = cx - hw; x <= cx + hw; x++) {
			const c = P.paint[(Math.abs(x - cx) + i * 2) % P.paint.length];
			p.px(x, y, P.graniteLit);
			p.px(x, y + 1, c);
			p.px(x, y + 2, (x - cx) & 1 ? P.graniteDark : c);
			p.px(x, y + 3, x > cx + hw - 3 ? P.graniteDark : P.granite);
		}
		p.rect(cx - 1, y + 1, 3, 2, P.door);
	});
	// barrel roof and its brass kalashams
	[3, 5, 5].forEach((hw, i) => p.rect(cx - hw, 46 + i, hw * 2 + 1, 1, P.paint[i === 1 ? 1 : 2]));
	for (const dx of [-3, -1, 1, 3]) p.rect(cx + dx, 44, 1, 2, P.gold);
}

function drawPalm(p: Pen, P: Pal, x: number) {
	for (let y = 62; y < GROUND; y++) p.px(x + Math.round((y - 62) / 14), y, P.wood);
	const fronds = [[-1, -1], [-2, -2], [-3, -2], [-4, -1], [-5, 0], [1, -1], [2, -2], [3, -2], [4, -1], [5, 0], [0, -1], [0, -2], [-1, -3], [1, -3]];
	for (const [dx, dy] of fronds) p.px(x + dx, 62 + dy, P.palm);
	for (const [dx, dy] of [[-1, 0], [-2, 0], [-3, 1], [-4, 2], [1, 0], [2, 0], [3, 1], [4, 2], [0, 0]]) p.px(x + dx, 62 + dy, P.palmDark);
	p.px(x - 1, 63, P.earth);
	p.px(x + 1, 63, P.earth);
}

function joshua(p: Pen, x: number, c: string, s: number) {
	const y = GROUND - 1;
	p.rect(x, y - 7, 1, 8, c);
	p.rect(x - 2, y - 6, 2, 1, c);
	p.rect(x - 2, y - 9, 1, 3, c);
	p.rect(x + 1, y - 4, 2, 1, c);
	p.rect(x + 2, y - 8 + (s > 0.5 ? 1 : 0), 1, 4, c);
	for (const [dx, dy] of [[-3, -9], [-1, -10], [-2, -10], [1, -9], [3, -8], [2, -9], [-1, -8], [0, -8]]) p.px(x + dx, y + dy, c);
}

function drawLaunchSite(p: Pen, P: Pal, night: boolean, x0: number, x1: number) {
	for (const x of joshuas(x1)) joshua(p, x, P.joshua, hash(x));

	// crew canopy with a laptop on the table and the Rogue arcade cabinet under its edge
	p.rect(298, 73, 27, 2, P.canopy);
	for (let x = 298; x < 325; x += 2) p.px(x, 75, P.canopyDark);
	for (const x of [299, 323]) p.rect(x, 75, 1, 13, P.metalDark);
	p.rect(301, 82, 10, 1, P.metal);
	for (const x of [302, 309]) p.rect(x, 83, 1, 5, P.metalDark);
	p.rect(304, 81, 4, 1, P.metalDark);
	p.rect(305, 79, 3, 2, P.screen);
	p.rect(313, 75, 7, 13, P.cab);
	p.rect(313, 75, 1, 13, P.cabLit);
	p.rect(314, 81, 6, 2, P.cabLit);
	p.px(316, 81, P.metalDark);
	p.px(318, 81, P.diya);

	// mission control trailer
	p.rect(331, 85, 4, 1, P.metalDark);
	p.rect(335, 74, 30, 12, P.trailer);
	p.rect(335, 74, 30, 1, P.trailerShade);
	p.rect(335, 84, 30, 1, P.canopy);
	p.rect(340, 77, 16, 5, P.screen);
	p.rect(359, 77, 3, 8, P.trailerShade);
	for (const x of [343, 353]) {
		p.rect(x, 86, 3, 2, P.band);
		p.px(x + 1, 86, P.metal);
	}
	p.rect(362, 69, 1, 5, P.metal);
	p.rect(360, 68, 4, 1, P.metal);

	// LOX dewars, cable to the pad, the pad itself
	for (const x of [368, 373]) {
		p.rect(x, 78, 4, 10, P.tank);
		p.rect(x + 3, 78, 1, 10, P.tankShade);
		p.rect(x + 1, 77, 2, 1, P.tankShade);
	}
	p.rect(365, 88, 18, 1, P.band);
	p.rect(380, 86, 33, 2, P.concrete);
	p.rect(380, 87, 33, 1, P.concreteDark);
	p.rect(385, 87, 9, 1, P.band);

	// launch rail tower
	for (let y = 34; y < 86; y++) {
		p.px(397, y, P.tower);
		p.px(401, y, P.towerDark);
		const k = (y - 34) % 8;
		p.px(398 + Math.floor((k < 4 ? k : 7 - k) * 0.75), y, P.towerDark);
		if (k === 0) p.rect(398, y, 3, 1, P.tower);
	}
	p.rect(395, 34, 8, 1, P.tower);

	// floodlight mast, with its cone over the pad at night
	p.rect(427, 52, 1, 36, P.metalDark);
	p.rect(424, 50, 6, 2, P.metal);
	if (night && P.light) {
		p.g.globalAlpha = 0.09;
		for (let y = 52; y < GROUND; y++) {
			const f = (y - 52) / 36, l = Math.round(425 - f * 52), r = Math.round(425 - f * 16);
			for (let x = Math.max(l, x0); x < Math.min(r, x1); x++) if (bayer(x, y) < 0.75) p.px(x, y, P.light);
		}
		p.g.globalAlpha = 1;
		p.rect(424, 51, 3, 1, P.light);
	}
}

function drawUnderground(p: Pen, P: Pal, x0: number, x1: number) {
	for (let y = 92; y < H; y++) {
		for (let x = x0; x < x1; x++) {
			const soil = y < 94 || (y < 97 && bayer(x, y) < (97 - y) / 4);
			const r = hash2(x, y);
			p.px(x, y, soil ? (r < 0.25 ? P.soilGrain : P.soil) : r < 0.08 ? P.underGrain : P.under);
		}
	}
	// the tube tunnel under the city
	const te = Math.min(x1, 138);
	if (te > x0) {
		p.rect(x0, 98, te - x0, 9, P.tunnel);
		p.rect(x0, 97, te - x0, 1, P.tunnelRing);
		p.rect(x0, 107, te - x0, 1, P.tunnelRing);
		p.rect(x0, 106, te - x0, 1, P.rail);
		for (let x = x0; x < te; x++) if (((x % 7) + 7) % 7 === 0) p.rect(x, 98, 1, 8, P.tunnelRing);
		if (x1 > 138) p.rect(138, 97, 2, 11, P.tunnelRing);
	}
	// a long dim trace and its vias, under everything
	for (let x = Math.max(x0, 140); x < x1; x++) {
		p.px(x, 110, P.traceDim);
		if (hash(Math.floor(x / 19)) > 0.5 && x % 19 === 9) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) p.px(x + dx, 110 + dy, P.traceDim);
	}
	for (const path of PATHS) for (const [x, y] of path.p) if (!inChip(x, y)) p.px(x, y, P.trace);
	for (const c of CHIPS) {
		p.rect(c.x, CHIP_Y, c.w, CHIP_H, P.chip);
		for (let x = c.x + 1; x < c.x + c.w - 1; x += 2) {
			p.px(x, CHIP_Y - 1, P.chipPin);
			p.px(x, CHIP_Y + CHIP_H, P.chipPin);
		}
		p.text(c.name, c.x + Math.floor((c.w - (c.name.length * 4 - 1)) / 2), CHIP_Y + 2, P.label);
	}
}

function drawFront(p: Pen, P: Pal) {
	const leaves = (cx: number, cy: number, r: number) =>
		p.disc(cx, cy, r, (dx, dy) => {
			const h = hash2(dx + cx, dy + cy);
			if (dx * dx + dy * dy > r * r * 0.77 && h < 0.4) return null;
			return h < 0.2 || dx + dy > r * 0.7 ? P.hillDark : h > 0.85 && dx + dy < -r * 0.4 ? P.hillLit : P.hill;
		});
	// a plane tree over a hedge, and a banyan with hanging roots: the bus and the auto-rickshaw turn around behind them
	p.rect(142, 76, 2, 8, P.wood);
	leaves(143, 72, 7.4);
	for (let x = 137; x < 151; x++)
		for (let y = 81 - (hash(x) < 0.5 ? 1 : 0); y < 92; y++) {
			const h = hash2(x, y);
			p.px(x, y, h < 0.25 ? P.hillDark : h > 0.88 ? P.hillLit : P.hill);
		}
	for (let x = 267; x < 280; x++) p.rect(x, 74, 1, 18, hash(x * 5.7) < 0.45 ? P.graniteDark : P.wood);
	for (const [x, y, r] of [[267, 71, 5.4], [279, 71, 5.4], [273, 67, 7]]) leaves(x, y, r);
}

// ---- live layer ----

const HELMET = ['..www..', '.wwwww.', '.wvvvv.', '.wvvgv.', '.wwwws.', 'sswbbw.', 'sswwww.', 'ss.wws.'];
const LEGS = {
	idle: ['..ww.w.', '..kk.k.'],
	runA: ['.ww..ww', '.k....k'],
	runB: ['...ww..', '...kk..'],
	air: ['.ww.ww.', '.k...k.'],
	cling: ['...www.', '....kk.'],
};
const SUIT: Record<string, string> = { w: '#f4f6fb', s: '#aab2c3', v: '#16324f', g: '#7dd3fc', b: '#3b82f6', k: '#4b5563' };

function drawAstronaut(p: Pen, x: number, y: number, face: number, pose: keyof typeof LEGS, wave: boolean, outline: string) {
	const cells: [number, number, string][] = [];
	[...HELMET, ...LEGS[pose]].forEach((row, j) => {
		for (let i = 0; i < 7; i++) if (row[i] !== '.') cells.push([x + (i - 3) * face, y - 10 + j, SUIT[row[i]]]);
	});
	if (pose === 'cling') cells.push([x + 3 * face, y - 6, SUIT.w], [x + 3 * face, y - 5, SUIT.w]);
	if (wave) cells.push([x + 3 * face, y - 5, SUIT.w], [x + 4 * face, y - 6, SUIT.w], [x + 4 * face, y - 7, SUIT.w]);
	for (const [cx, cy] of cells) {
		p.rect(cx - 1, cy, 3, 1, outline);
		p.rect(cx, cy - 1, 1, 3, outline);
	}
	for (const [cx, cy, c] of cells) p.px(cx, cy, c);
}

type Particle = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number };

function puff(p: Pen, list: Particle[], dt: number, floor: number, smoke: string[]) {
	for (let i = list.length - 1; i >= 0; i--) {
		const s = list[i];
		s.age += dt;
		if (s.age > s.life) {
			list.splice(i, 1);
			continue;
		}
		s.x += s.vx * dt;
		s.y = Math.min(floor - s.r * 0.5, s.y + s.vy * dt);
		s.vx *= 1 - 1.6 * dt;
		s.vy -= 0.8 * dt;
		s.r = Math.min(6.5, s.r + 1.1 * dt);
		// solid while young, dissolving through the dither in its last 40%
		const fade = Math.max(0, (s.age / s.life - 0.6) / 0.4), cx = Math.round(s.x), cy = Math.round(s.y);
		p.disc(cx, cy, s.r, (dx, dy) => {
			if (bayer(cx + dx, cy + dy) < fade) return null;
			return dx + dy > s.r * 0.75 ? smoke[2] : dx + dy < -s.r * 0.5 ? smoke[0] : smoke[1];
		});
	}
}

// the exhaust: bright shock diamonds down the core, and what would go into the ground spreads along it instead
function plume(p: Pen, flame: string[], x: number, y: number, nx: number, ny: number, len: number, floor: number) {
	let blocked = 0;
	for (let i = 0; i < len; i++) {
		const w = Math.max(1, Math.round(4 - (i / len) * 3.2)), py = Math.round(y - ny * i - w / 2);
		if (py >= floor) {
			blocked++;
			continue;
		}
		p.rect(Math.round(x - nx * i - w / 2), py, w, Math.min(w, floor - py), i < 3 ? flame[0] : i < len * 0.6 ? flame[1] : flame[2]);
		if (i % 4 === 3 && i < len * 0.7) p.px(Math.round(x - nx * i - 0.5), py, flame[0]);
	}
	if (!blocked) return;
	const cx = Math.round(x - 0.5), top = Math.round(floor) - 1;
	p.rect(cx - blocked, top, blocked * 2 + 1, 1, flame[2]);
	p.rect(cx - (blocked >> 1), top, (blocked >> 1) * 2 + 1, 1, flame[0]);
}

// the belly flop: heat along the underside and air streaming up past both sides
function airRush(p: Pen, P: Pal, x: number, y: number, nx: number, ny: number, flop: number, streak: string) {
	for (let i = -20; i <= 20; i++) {
		const bx = Math.round(x + nx * i), by = Math.round(y + ny * i), h = Math.random();
		if (h < flop * 0.9) p.px(bx, by + 4, h < 0.3 ? P.flame[0] : P.flame[1]);
		if (h < flop * 0.5) p.px(bx, by + 5, P.flame[2]);
		if ((i + 20) % 8 === 4 && h < flop * 0.8) p.rect(bx, by - 8 - Math.floor(h * 14), 1, 4 + Math.floor(h * 9), streak);
	}
}

// the tower's catching arms, seen from the side: each swings in a flat circle round the tower, one in front of the rocket
// and one behind, so an open pair shows as a splay. Angle 0 points away from the rocket, half a turn is closed on it.
const ARM_REST = 0.6, ARM_OPEN = 2.5, ARM_Y = 38, CATCH_LIFT = 14;
function towerArm(p: Pen, P: Pal, y: number, angle: number, side: number) {
	const dx = Math.round(Math.cos(angle) * 15), dy = Math.round(Math.sin(angle) * 6 * side), n = Math.max(Math.abs(dx), Math.abs(dy));
	for (let i = 0; i <= n; i++) {
		const x = 399 + Math.round((dx * i) / n), ay = y + Math.round((dy * i) / n);
		p.px(x, ay, P.planeShade);
		p.px(x, ay + 1, i % 3 ? P.metalDark : P.planeShade);
	}
}
// where the arms are, in seconds since bailing out: they open, close on the rocket, set it down and swing away again
const RETURN_END = CATCH + 4;
function armPose(t: number) {
	const ease = (a: number, b: number) => {
		const u = ramp(t, a, b);
		return u * u * (3 - 2 * u);
	};
	const lowered = ease(CATCH + 0.6, CATCH + 2.2), bump = t > CATCH && t < CATCH + 0.12 ? 1 : 0;
	const angle = ARM_REST + (ARM_OPEN - ARM_REST) * ease(FLIP - 0.4, FLIP + 1) + (Math.PI - ARM_OPEN) * ease(CATCH - 0.4, CATCH) - (Math.PI - ARM_REST) * ease(CATCH + 2.4, CATCH + 3.6);
	return { angle, lift: CATCH_LIFT * (1 - lowered) - bump, y: ARM_Y + bump + Math.round(CATCH_LIFT * (lowered - ease(CATCH + 2.8, RETURN_END))) };
}

// a striped canopy over the astronaut's head; spread runs from 0 packed to 1 full, and sag drops it once they land
function drawCanopy(p: Pen, P: Pal, x: number, y: number, spread: number, sag: number, outline: string) {
	const hw = Math.max(1, Math.round(11 * spread)), h = Math.max(1, Math.round(8 * spread * (1 - sag))), top = y - 30 + Math.round(sag * 26);
	for (let dx = -hw; dx <= hw; dx++) {
		const rise = Math.round(h * Math.sqrt(1 - (dx / (hw + 0.5)) ** 2)), seam = Math.floor((dx + 22 + 2) / 5) % 2;
		p.rect(x + dx, top + 7 - rise, 1, 1, outline);
		p.rect(x + dx, top + 8 - rise, 1, rise, seam ? P.accent : '#f4f6fb');
		if (Math.abs(dx) === hw) p.rect(x + dx + Math.sign(dx), top + 8 - rise, 1, rise, outline);
		if (dx % 5 === 0) p.px(x + dx, top + 8, outline);
	}
	if (sag) return;
	// lines down to the shoulders
	for (const side of [-1, 1])
		for (let i = 0; i < 12; i++) p.px(Math.round(x + side * (hw + (2 - hw) * (i / 11))), top + 9 + i, outline);
}

// firelight on the launch site, dithered at four strengths, kept low by day; it stops short of the top of the scene, which has to meet the page
const GLOW_W = 88, GLOW_H = 60;
function glowSprites(color: string, night: boolean) {
	const rx = night ? GLOW_W : 60, ry = night ? GLOW_H : 22;
	return [1, 2, 3, 4].map((k) => {
		const c = document.createElement('canvas');
		c.width = GLOW_W * 2;
		c.height = GLOW_H + 4;
		const pen = new Pen(c.getContext('2d')!, 0);
		for (let y = 0; y < c.height; y++)
			for (let x = 0; x < c.width; x++) {
				const d = Math.hypot((x - GLOW_W) / rx, (y - GLOW_H) / ry);
				if (bayer(x, y) < (1 - d) * (0.4 + k * 0.2)) pen.px(x, y, color);
			}
		return c;
	});
}

function drawPlane(p: Pen, P: Pal, x: number, y: number, t: number, night: boolean) {
	p.rect(x + 1, y - 1, 4, 1, P.planeShade);
	p.rect(x + 1, y - 2, 3, 1, P.plane);
	p.rect(x, y - 3, 3, 1, P.plane);
	p.rect(x, y - 4, 2, 1, P.plane);
	p.rect(x + 3, y, 21, 1, P.plane);
	p.rect(x + 1, y + 1, 25, 1, P.plane);
	p.rect(x + 3, y + 1, 20, 1, P.planeStripe);
	p.rect(x + 2, y + 2, 23, 1, P.planeShade);
	p.rect(x + 17, y - 1, 6, 1, P.plane);
	p.px(x + 23, y, P.tiles);
	p.rect(x + 8, y + 3, 8, 1, P.planeShade);
	p.px(x + 10, y + 4, P.planeShade);
	p.px(x + 14, y + 4, P.planeShade);
	p.rect(x, y + 1, 4, 1, P.planeShade);
	// the orbiter riding on top, black tiles on its belly
	p.px(x + 11, y - 1, P.tiles);
	p.px(x + 15, y - 1, P.tiles);
	p.rect(x + 8, y - 3, 11, 1, P.plane);
	p.rect(x + 7, y - 2, 13, 1, P.tiles);
	p.px(x + 19, y - 3, P.tiles);
	p.rect(x + 7, y - 4, 3, 1, P.plane);
	p.rect(x + 7, y - 5, 2, 1, P.plane);
	p.px(x + 7, y - 6, P.plane);
	if (night && Math.floor(t * 1.5) % 2) {
		p.px(x, y - 4, '#ffffff');
		p.px(x + 15, y + 3, '#ff4a4a');
	}
}

function drawBus(p: Pen, P: Pal, x: number, night: boolean) {
	p.rect(x, 82, 15, 7, P.bus);
	p.rect(x, 88, 15, 1, P.busDark);
	p.rect(x, 85, 15, 1, P.busDark);
	for (let i = 0; i < 6; i++) {
		p.rect(x + 1 + i * 2 + (i > 2 ? 1 : 0), 83, 1, 2, P.busGlass);
		p.rect(x + 2 + i * 2 + (i > 2 ? 1 : 0), 86, 1, 2, P.busGlass);
	}
	p.rect(x, 83, 1, 5, P.busGlass);
	for (const wx of [x + 2, x + 11]) {
		p.rect(wx, 89, 2, 2, P.band);
		p.px(wx, 89, P.metal);
	}
	if (night) {
		p.px(x, 88, '#fff3c4');
		p.g.globalAlpha = 0.16;
		for (let i = 1; i < 9; i++) p.rect(x - i, 88 - (i >> 2), 1, 1 + (i >> 1), '#fff3c4');
		p.g.globalAlpha = 1;
	}
}

function drawAuto(p: Pen, P: Pal, x: number, night: boolean) {
	p.rect(x + 1, 81, 8, 1, P.autoTop);
	p.rect(x, 82, 10, 1, P.autoTop);
	p.rect(x, 83, 2, 3, P.autoTop);
	p.rect(x + 2, 83, 7, 3, P.screen);
	p.rect(x + 6, 83, 2, 3, P.wood); // the driver
	p.rect(x + 9, 83, 1, 3, P.busGlass);
	p.rect(x, 86, 11, 3, P.autoBody);
	p.rect(x + 3, 86, 2, 2, P.screen);
	p.rect(x, 86, 2, 1, P.autoTop);
	for (const wx of [x + 1, x + 9]) p.rect(wx, 89, 2, 2, P.band);
	if (night) p.px(x + 11, 87, '#fff3c4');
}

function drawTrain(p: Pen, P: Pal, x: number) {
	const end = 137; // the train vanishes into the tunnel wall
	const span = (a: number, y: number, w: number, h: number, c: string) => {
		const r = Math.min(a + w, end);
		if (r > a) p.rect(a, y, r - a, h, c);
	};
	for (let car = 0; car < 3; car++) {
		const cx = x + car * 15;
		span(cx, 99, 14, 7, P.train);
		span(cx, 105, 14, 1, P.trainSkirt);
		for (let i = 0; i < 4; i++) span(cx + 1 + i * 3, 100, 2, 2, P.trainWin);
		span(cx + 6, 100, 2, 5, P.trainDoor);
	}
	span(x + 44, 100, 1, 2, '#fff3c4');
}

export function mountPixelFooter(scene: HTMLElement, canvas: HTMLCanvasElement, button: HTMLButtonElement, play: HTMLButtonElement) {
	const g = canvas.getContext('2d')!;
	const back = document.createElement('canvas');
	const front = document.createElement('canvas');
	const dark = matchMedia('(prefers-color-scheme: dark)');
	const still = matchMedia('(prefers-reduced-motion: reduce)');
	let P = NIGHT, night = true, scale = 2, L = W, cam = 0;
	let twinklers: { x: number; y: number; f: number; ph: number }[] = [];
	const parts: Particle[] = [];
	// the world is at least W wide; a narrower screen looks at part of it and follows the astronaut while playing
	let left = 0, width = W, home = 0, camF = 0;
	let level = buildLevel(0, W);
	let playing = false, hoverAstro = false, near = false;
	let ship: Ship | null = null, lastFly = 0, liftoff = Infinity; // liftoff counts seconds since boarding
	const sky = document.createElement('canvas'); // the layer the rocket flies on, over the whole page
	sky.style.cssText = 'position:fixed;left:0;top:0;z-index:45;pointer-events:none;image-rendering:pixelated';
	sky.setAttribute('aria-hidden', 'true');
	const trail: Particle[] = [];
	// after bailing out: the astronaut's fall, the canopy's spread and collapse, and the empty rocket flying home, in world space
	let chute: (Drop & { t: number }) | null = null, landed = 9;
	let booster: { from: Ship; ceiling: number; t: number } | null = null;
	const dock = { x: ROCKET_X + 2.5, y: ROCKET_MID + 0.5 - CATCH_LIFT };
	const flyingHome = () => booster && booster.t < CATCH ? returnPath(booster.from, dock, booster.ceiling, booster.t) : null;
	let glows = glowSprites(P.flame[1], night), fire = 0; // how hard an engine on the pad lights it, 0 to 1
	let rocketPx = rocketPixels(P), sprites: HTMLCanvasElement[] = [];
	const body = newBody(328, GROUND);
	const input: Input = { left: false, right: false, jump: false, down: false };
	let launchAt: number | null = null; // seconds; can be negative, a restack starts 11s in
	let hover = false, visible = true, raf = 0, last = 0, lastSim = 0, nextVent = 0;
	const label = button.querySelector('[data-label]')!;
	const pads = scene.parentElement!.querySelectorAll<HTMLElement>('[data-key]');
	const hops = scene.parentElement!.querySelectorAll<HTMLElement>('[data-hop]');

	function build() {
		night = dark.matches;
		P = night ? NIGHT : DAY;
		rocketPx = rocketPixels(P);
		sprites = [];
		glows = glowSprites(P.flame[1], night);
		if (ship) leave(); // the scale may have changed under it
		scale = parseInt(getComputedStyle(scene).getPropertyValue('--s')) || 2;
		L = Math.ceil(scene.clientWidth / scale);
		// centre the world, but keep the launch tower in frame; a phone then shows the gopuram through the tower
		home = L >= W ? Math.round((W - L) / 2) : Math.min(W - L, Math.max(Math.round((W - L) / 2), ROCKET_X + 20 - L));
		left = Math.min(0, home);
		width = Math.max(L, W);
		level = buildLevel(left, left + width);
		camF = home;
		canvas.width = L;
		back.width = front.width = width;
		canvas.height = back.height = front.height = H;
		canvas.style.width = `${L * scale}px`;
		canvas.style.height = `${H * scale}px`;
		twinklers = [];
		drawBack(new Pen(back.getContext('2d')!, left), P, night, left, left + width, twinklers);
		const f = front.getContext('2d')!;
		drawFront(new Pen(f, left), P);
		frame(performance.now());
	}

	const rocketBox = (wx: number, wy: number) => !ship && !booster && wx >= ROCKET_X - 3 && wx <= ROCKET_X + 8 && wy >= ROCKET_TOP - 2 && wy <= GROUND;

	function launch() {
		if (launchAt !== null || ship || booster) return;
		launchAt = performance.now() / 1000;
		button.disabled = true;
		start();
	}

	function spawn(x: number, y: number, vx: number, vy: number, r: number, life: number) {
		if (parts.length < 220) parts.push({ x, y, vx, vy, r, age: 0, life });
	}

	// the scene's corner in document space, in art pixels
	function origin() {
		const r = canvas.getBoundingClientRect();
		return { x: (r.left + scrollX) / scale - cam, y: (r.top + scrollY) / scale };
	}

	function board() {
		const o = origin();
		ship = { x: o.x + ROCKET_X + 2.5, y: o.y + ROCKET_MID + 0.5, vx: 0, vy: 0, a: 0 };
		button.disabled = true;
		label.textContent = 'In flight';
		scene.classList.add('flying');
		document.body.append(sky);
		lastFly = 0;
		liftoff = still.matches ? Infinity : 0;
		// frost shakes off the cold tank
		for (let i = 0; i < 18; i++) {
			const side = i % 2 ? 1 : -1;
			spawn(ROCKET_X + 2 + side * 4, 50 + i * 1.7, side * (3 + Math.random() * 5), 12 + Math.random() * 14, 0.7, 0.9 + Math.random() * 0.7);
		}
		start();
	}

	function disembark() {
		ship = null;
		trail.length = 0;
		liftoff = Infinity;
		scene.classList.remove('flying');
		input.left = input.right = input.jump = input.down = false;
	}

	// stop flying at once: in the scene the astronaut drops out where the rocket is, elsewhere they are put back on the pad
	function leave() {
		if (!ship) return;
		const o = origin(), wx = ship.x - o.x, wy = ship.y - o.y, here = wy > 0 && wx > left && wx < left + width;
		Object.assign(body, newBody(here ? wx : ROCKET_X - 4, here ? wy : 86));
		disembark();
		sky.remove();
		label.textContent = 'Restacking';
		launchAt = performance.now() / 1000 - 11; // a fresh rocket is restacked on the pad
		if (playing && !here) show();
		start();
	}

	// bail out: the astronaut parachutes down and the rocket flies itself back to the tower
	function eject() {
		if (!ship) return;
		const o = origin(), wx = ship.x - o.x, wy = ship.y - o.y;
		if (Math.abs(wx - dock.x) < 2 && wy > ROCKET_MID - 1 && Math.abs(Math.sin(ship.a / 2)) < 0.1) {
			// still on the pad, so just climb down
			Object.assign(body, newBody(ROCKET_X - 4, 86));
			disembark();
			sky.remove();
			button.disabled = false;
			label.textContent = 'Launch VEGA';
			return;
		}
		booster = { from: { ...ship, x: wx, y: wy }, ceiling: 24 - o.y, t: 0 };
		Object.assign(body, newBody(wx, wy));
		chute = { ...newDrop(GROUND - wy), t: 0 };
		disembark();
		label.textContent = 'Returning';
		start();
	}

	function flyFrame(now: number) {
		const inbound = flyingHome();
		if (!ship && !chute && !inbound) return sky.remove();
		const dt = Math.min(0.05, lastFly ? (now - lastFly) / 1000 : 0);
		lastFly = now;
		const vw = document.documentElement.clientWidth, vh = innerHeight, w = Math.ceil(vw / scale), h = Math.ceil(vh / scale);
		if (sky.width !== w || sky.height !== h) {
			sky.width = w;
			sky.height = h;
			sky.style.width = `${w * scale}px`;
			sky.style.height = `${h * scale}px`;
		}
		const o = origin(), ground = o.y;
		// the launch ignores held keys, as a walking key may still be down from boarding
		const auto = liftoff < CUTOFF;
		if (ship) {
			if (auto) climb(ship, (liftoff += dt), dt);
			else fly(ship, input, dt, { x0: 6, x1: vw / scale - 6, y0: 24, y1: ground + ROCKET_MID + 0.5 });
		}

		// scroll to keep the player in the middle fifth of the window
		if (ship || (chute && playing)) {
			const y = (ship ? ship.y : o.y + body.y) * scale - scrollY, to = y < vh * 0.4 ? y - vh * 0.4 : y > vh * 0.6 ? y - vh * 0.6 : 0;
			if (to) scrollTo({ top: scrollY + to, behavior: 'instant' });
		}

		const sx = Math.round(scrollX / scale), sy = Math.round(scrollY / scale), c = sky.getContext('2d')!;
		c.setTransform(1, 0, 0, 1, 0, -sy);
		c.clearRect(0, sy, w, h);
		const p = new Pen(c, sx);
		puff(p, trail, dt, ground + GROUND, night ? P.smoke : ['#e5e8ec', '#c4c9d0', '#9aa1ab']);
		const craft = ship ?? (inbound && { ...inbound, x: o.x + inbound.x, y: o.y + inbound.y, vx: 0, vy: 0 });
		if (craft) {
			const nx = Math.sin(craft.a), ny = -Math.cos(craft.a);
			if (inbound ? inbound.burn : auto ? liftoff > IGNITION : input.jump) {
				const power = auto ? ramp(liftoff, IGNITION, RELEASE) : 1;
				plume(p, P.flame, craft.x - nx * 20, craft.y - ny * 20, nx, ny, 2 + power * (6 + Math.random() * 9), ground + 87);
				// near the pad the scene's own smoke takes over
				if (!auto && craft.y < ground + 20 && trail.length < 150)
					trail.push({
						x: craft.x - nx * 30, y: craft.y - ny * 30,
						vx: craft.vx * 0.2 - nx * 30 + (Math.random() - 0.5) * 12, vy: craft.vy * 0.2 - ny * 30 + (Math.random() - 0.5) * 12,
						r: 1.2, age: 0, life: 0.8 + Math.random() * 0.8,
					});
			}
			if (inbound && inbound.flop) airRush(p, P, craft.x, craft.y, nx, ny, inbound.flop, night ? P.starDim : '#9aa1ab');
			const k = ((Math.round((craft.a / (Math.PI * 2)) * HEADINGS) % HEADINGS) + HEADINGS) % HEADINGS;
			sprites[k] ??= rocketSprite(rocketPx, k);
			// it strains against the pad until that lets go
			const tremble = liftoff < RELEASE && liftoff > IGNITION ? Math.floor(now / 40) % 2 : 0;
			c.drawImage(sprites[k], Math.floor(craft.x) - sx - SPRITE + tremble, Math.floor(craft.y) - SPRITE);
		}

		// from here in world space: the near arm passes in front of the rocket, and the astronaut under the canopy
		c.setTransform(1, 0, 0, 1, 0, Math.round(o.y) - sy);
		const q = new Pen(c, sx - Math.round(o.x));
		if (inbound) {
			const arms = armPose(booster!.t);
			towerArm(q, P, arms.y, arms.angle, 1);
		}
		if (chute) {
			const ax = Math.round(body.x), ay = Math.round(body.y);
			if (chute.open) drawCanopy(q, P, ax + Math.round(Math.sin(chute.t * 2.2) * 1.4), ay, ramp(chute.t, 0, 0.45), 0, '#0b0b10');
			drawAstronaut(q, ax, ay, body.face, 'air', false, '#0b0b10');
		}
	}

	// one step of the fall: straight down until the canopy has slowed it, then the usual movement, so roofs can be landed on
	function glide(d: NonNullable<typeof chute>, dt: number, plats: Platform[]) {
		drop(d, GROUND - body.y, dt);
		if (d.open) d.t += dt;
		const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
		// left alone, they drift clear of the pad the rocket is coming down on
		const off = body.x - dock.x;
		if (!dir && Math.abs(off) < 40) body.x += (off > 8 ? 18 : -18) * dt;
		if (!d.open || d.vy > 120) {
			if (dir) body.face = dir;
			body.x += dir * 45 * dt;
			body.y = Math.min(GROUND - 1, body.y + d.vy * dt);
			return;
		}
		body.vy = d.vy;
		step(body, { ...input, jump: false, down: false }, dt, plats, level.walls);
		body.vx = Math.max(-45, Math.min(45, body.vx));
		if (!body.ground) return;
		body.held = input.jump; // a key held from the fall is not a jump
		chute = null;
		landed = 0;
		if (playing) show();
	}

	function frame(now: number) {
		const clock = now / 1000;
		const t = still.matches ? 6 : clock; // reduced motion holds the scenery still, even while playing or launching
		const dt = Math.min(0.1, lastSim ? clock - lastSim : 0);
		lastSim = clock;

		// everything that moves and can be ridden
		const rel = launchAt === null ? -1 : clock - launchAt;
		let lift = 0, shown = 1;
		if (rel >= 2.4) lift = 4 * (rel - 2.4) + 0.5 * 36 * (rel - 2.4) ** 2;
		if (rel >= 11) {
			lift = 0;
			shown = Math.min(1, (rel - 11) / 1.6);
		}
		if (booster && (booster.t += dt) > RETURN_END) {
			booster = null;
			button.disabled = false;
			label.textContent = 'Launch VEGA';
		}
		const inbound = flyingHome(), gone = ship || inbound, arms = armPose(booster ? booster.t : 0);
		if (booster && !inbound) lift = arms.lift;
		const heat = inbound ? (inbound.burn ? ramp(dock.y - inbound.y, 60, 0) : 0) : ship ? (liftoff < CUTOFF ? ramp(liftoff, IGNITION, RELEASE) : 0) : rel < 11 ? ramp(rel, 1.5, 2.4) * ramp(lift, 70, 0) : 0;
		fire += (heat - fire) * Math.min(1, dt * 8);
		const busX = 146 - (t % 30) * 9, autoX = 132 + (t % 19) * 11, planeX = left - 40 + (t % 46) * 13;
		const cloudX = CLOUDS.map((c) => left - 60 + ((((c.x - left + 60 + t * c.v) % (width + 120)) + width + 120) % (width + 120)));
		const plats: Platform[] = [
			...level.plats,
			{ x: busX, y: 82, w: Math.min(15, 144 - busX), key: 'bus' },
			{ x: autoX, y: 81, w: Math.min(10, 273 - autoX), key: 'auto' },
			{ x: planeX + 7, y: 21, w: 13, key: 'plane' },
			...CLOUD_TOPS.map((c, i) => ({ x: cloudX[i] + c.a, y: c.y, w: c.w, key: `cloud${i}` })),
		];
		if (lift < 160 && shown === 1 && !gone) plats.push({ x: ROCKET_X, y: 46 - lift, w: 5, key: 'rocket' });
		if (!ship) {
			carry(body, plats);
			const subs = Math.ceil(dt * 120);
			for (let i = 0; i < subs; i++) {
				if (chute) {
					glide(chute, dt / subs, plats);
					continue;
				}
				step(body, input, dt / subs, plats, level.walls);
				if (body.boosted) for (let k = 0; k < 4; k++) spawn(body.x - 2 * body.face, body.y - 2, (Math.random() - 0.5) * 16, 14 + Math.random() * 14, 0.8, 0.7);
			}
			body.x = Math.max(left + 6, Math.min(left + width - 6, body.x));
		}
		landed += dt;
		const canBoard = playing && !ship && !booster && rel < 0 && Math.abs(body.x - ROCKET_X - 2) < 14;
		if (canBoard !== near) scene.classList.toggle('near', (near = canBoard));
		const aim = ship ? camF : playing ? Math.max(left, Math.min(left + width - L, body.x - L / 2)) : home;
		camF += (aim - camF) * (still.matches ? 1 : Math.min(1, dt * 8));
		cam = Math.round(camF);

		const p = new Pen(g, cam);
		const clipTo = (a: number, b: number, draw: () => void) => {
			const l = Math.max(0, a - cam);
			g.save();
			g.beginPath();
			g.rect(l, 0, Math.max(0, b - cam - l), H);
			g.clip();
			draw();
			g.restore();
		};
		g.clearRect(0, 0, L, H);
		g.drawImage(back, left - cam, 0);

		for (const s of twinklers) p.px(s.x, s.y, Math.sin(t * s.f + s.ph) > 0.1 ? P.star : P.starDim);
		if (night) {
			const k = Math.floor(t / 9), ph = t - k * 9;
			if (ph < 0.7) {
				const sx = cam + Math.floor(hash(k) * L), sy = 4 + Math.floor(hash(k * 2.7) * 22), d = Math.floor((ph / 0.7) * 20);
				for (let i = 0; i < 5; i++) p.px(sx - d + i, sy + ((d - i) >> 1), i ? P.starDim : P.star);
			}
		}
		CLOUDS.forEach((c, i) => {
			const x = cloudX[i];
			const pal = c.cf ? P.cfCloud : P.cloud;
			c.m.forEach((row, y) => row.forEach((v, dx) => v && p.px(Math.round(x) + dx, c.y + y, v === 2 ? pal[1] : v === 3 ? pal[2] : pal[0])));
		});
		drawPlane(p, P, Math.round(planeX), 24, t, night);

		// diyas
		for (const d of DIYAS) {
			p.rect(d.x - 1, 87, 3, 1, P.wood);
			p.px(d.x, 86, P.diya);
			p.px(d.x, 85, Math.sin(t * 7 + d.ph) > -0.4 ? P.diyaHi : P.diya);
		}

		clipTo(-Infinity, 144, () => drawBus(p, P, Math.round(busX), night));
		clipTo(144, 273, () => drawAuto(p, P, Math.round(autoX), night));
		const tr = t % 21;
		drawTrain(p, P, Math.round(left - 50 + tr * 16));

		// trailer telemetry, the Rogue cabinet, the laptop, the tower beacon
		for (let i = 0; i < 15; i++) p.px(341 + i, 79 + Math.round(1.6 * Math.sin((i + t * 6) / 2.3)), P.screenInk);
		if (Math.floor(t * 2) % 2) p.px(354, 78, '#4ade80');
		p.rect(314, 76, 5, 1, P.marquee[Math.floor(t) % 2]);
		p.rect(314, 77, 5, 4, P.screen);
		for (let x = 0; x < 5; x++) for (let y = 0; y < 4; y++) if (hash2(Math.floor(x + t * 2), y) > 0.7) p.px(314 + x, 77 + y, P.cabLit);
		if (Math.floor(t * 4) % 2) p.px(316, 79, '#facc15');
		p.px(306, 79 + (Math.floor(t * 1.3) % 2), P.screenInk);
		if (Math.floor(t * 1.2) % 2) p.px(399, 33, '#ff4a4a');

		for (const path of PATHS) {
			const n = path.p.length;
			for (let i = 0; i < path.n; i++) {
				const head = Math.floor(t * path.v + (i * n) / path.n) % n;
				for (let k = 0; k < 3; k++) {
					const [x, y] = path.p[(head - k + n) % n];
					if (!inChip(x, y)) p.px(x, y, k ? P.bitDim : P.bit);
				}
			}
		}

		// the rocket: on the pad, counting down, flying, then restacked
		p.rect(396, arms.y - 2, 7, 6, P.metalDark);
		p.rect(396, arms.y - 2, 7, 1, P.planeShade);
		towerArm(p, P, arms.y, arms.angle, -1);
		const opening = ship ? liftoff : booster ? Infinity : rel > 12.8 ? 0 : rel - 1;
		const arm = Math.min(4, Math.max(1, 4 - Math.floor(opening * 12)));
		for (const y of [55, 69]) p.rect(397 - arm, y, arm, 1, P.metalDark);
		const ry = (y: number) => Math.round(y - lift);
		if (canBoard || (rel < 0 && hover && !ship)) {
			// a 1px selection outline in the site's accent, to say the rocket is clickable or can be boarded
			for (const [y, l, w] of ROCKET) {
				p.px(ROCKET_X + l - 1, y, P.accent);
				p.px(ROCKET_X + l + w, y, P.accent);
			}
			p.px(ROCKET_X + 2, ROCKET_TOP - 1, P.accent);
			for (const [fx, fy] of FINS) if (fx === -2 || fx === 6) p.px(ROCKET_X + fx + (fx < 0 ? -1 : 1), fy, P.accent);
		}
		const cut = NOZZLE - Math.round(shown * (NOZZLE - ROCKET_TOP + 1));
		if (lift < 160 && !gone) for (const [x, y, c] of rocketPx) if (y > cut) p.px(x, ry(y), c);
		if (!inbound) towerArm(p, P, arms.y, arms.angle, 1);
		if (rel >= 1.5 && rel < 11) {
			const len = rel < 2.4 ? 2 + Math.random() * 3 : 6 + Math.random() * 7;
			if (lift < 200) plume(p, P.flame, ROCKET_X + 2.5, ry(NOZZLE + 1), 0, -1, len, 87);
			if (rel >= 3.2 && lift < 140) for (let i = 0; i < 2; i++) spawn(ROCKET_X + 2 + (Math.random() - 0.5) * 2, NOZZLE + 4 - lift, (Math.random() - 0.5) * 5, 2 + Math.random() * 4, 1 + Math.random(), 3 + Math.random() * 2.5);
		}
		if (inbound ? dock.y - inbound.y < 30 : ship ? liftoff > IGNITION && liftoff < CUTOFF - 0.7 : rel >= 1.5 && rel < 3.2) {
			for (let i = 0; i < 4; i++) spawn(ROCKET_X + 2 + (Math.random() - 0.5) * 6, 86, (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 34), -Math.random() * 6, 1.5 + Math.random() * 1.5, 4 + Math.random() * 3);
		}
		if (rel < 0 && !ship && !booster && !still.matches && t > nextVent) {
			nextVent = t + 1.4 + Math.random();
			spawn(ROCKET_X + 5, 53, 4 + Math.random() * 3, -2, 0.8, 2.2);
		}

		// smoke and boil-off
		puff(p, parts, dt, 87, P.smoke);

		g.drawImage(front, left - cam, 0);

		// firelight over the smoke and the site, and a one-pixel rumble
		const beat = Math.floor(clock * 12);
		const glow = glows[Math.min(3, Math.floor(fire * 4 - (still.matches ? 0 : hash(beat))))];
		if (glow) {
			g.globalAlpha = night ? 0.3 : 0.4;
			g.drawImage(glow, ROCKET_X + 2 - GLOW_W - cam, GROUND - GLOW_H);
			g.globalAlpha = 1;
		}
		if (!still.matches && hash(beat * 1.7) < fire * 0.9) g.drawImage(canvas, hash(beat * 2.3) < 0.5 ? -1 : 1, hash(beat * 3.1) < 0.5 ? -1 : 1);

		if (near) {
			p.rect(ROCKET_X - 1, 33, 7, 9, '#0b0b10');
			p.rect(ROCKET_X, 34, 5, 7, P.accent);
			p.text('E', ROCKET_X + 1, 35, '#0b0b10');
		}

		if (landed < 0.7) drawCanopy(p, P, Math.round(body.x - 4 * body.face), Math.round(body.y), 1 - landed * 0.4, ramp(landed, 0, 0.6), '#0b0b10');
		if (!ship && !chute) {
			const ax = Math.round(body.x), ay = Math.round(body.y);
			const pose = body.wall ? 'cling' : !body.ground ? 'air' : Math.abs(body.vx) < 8 ? 'idle' : Math.floor(clock * 9) % 2 ? 'runA' : 'runB';
			const wave = !playing && !still.matches && pose === 'idle' && t % 5 < 1.2 && t % 0.4 < 0.2;
			drawAstronaut(p, ax, ay, body.face, pose, wave, hoverAstro && !playing ? P.accent : '#0b0b10');
			// off the top of the frame: point at where they are
			if (ay < 0) [0, 1, 2].forEach((i) => p.rect(ax - i, 2 + i, i * 2 + 1, 1, P.accent));
		}

		if (rel >= 0) {
			label.textContent = rel < 1.5 ? `T-${3 - Math.floor(rel * 2)}` : rel < 11 ? 'Liftoff' : 'Restacking';
			if (rel > 13 && !parts.length) {
				launchAt = null;
				button.disabled = false;
				label.textContent = 'Launch VEGA';
			}
		}
	}

	function loop(now: number) {
		raf = 0;
		const away = ship || chute || booster;
		if (!visible && !away) return;
		if (playing || now - last > 1000 / 24) {
			last = now;
			if (visible || chute || booster) frame(now);
			flyFrame(now);
		}
		if (!still.matches || playing || away || launchAt !== null || parts.length) raf = requestAnimationFrame(loop);
	}
	function start() {
		if (!raf && (visible || ship || chute || booster)) raf = requestAnimationFrame(loop);
	}

	const world = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect();
		return [Math.floor((e.clientX - r.left) / scale) + cam, Math.floor((e.clientY - r.top) / scale)];
	};
	canvas.addEventListener('pointermove', (e) => {
		const [x, y] = world(e);
		hover = launchAt === null && rocketBox(x, y);
		hoverAstro = !ship && !chute && astroBox(x, y);
		canvas.style.cursor = hover || hoverAstro ? 'pointer' : '';
		if (still.matches && launchAt === null) frame(performance.now());
	});
	canvas.addEventListener('pointerleave', () => (hover = hoverAstro = false));
	canvas.addEventListener('click', (e) => {
		const [x, y] = world(e);
		if (!ship && !chute && astroBox(x, y)) setPlaying(true);
		else if (rocketBox(x, y)) launch();
	});
	button.addEventListener('click', launch);

	// playing: the canvas holds focus and takes the keys until Esc, Stop or a click elsewhere
	const astroBox = (wx: number, wy: number) => Math.abs(wx - body.x) <= 5 && wy <= body.y + 1 && wy >= body.y - 12;
	// bring the scene into view, with the touch controls under it where there are any
	function show() {
		const last = pads[0].parentElement!;
		(last.offsetHeight ? last : scene).scrollIntoView({ block: 'nearest' });
	}
	function setPlaying(on: boolean) {
		playing = on;
		if (!on) leave();
		input.left = input.right = input.jump = input.down = false;
		scene.classList.toggle('playing', on);
		play.querySelector('[data-label]')!.textContent = on ? 'Stop' : 'Play';
		if (on) {
			canvas.focus({ preventScroll: true });
			show();
			start();
		}
	}
	const hop = () => {
		if (ship) still.matches ? leave() : eject();
		else if (near && launchAt === null) board();
	};
	for (const b of hops) b.addEventListener('click', hop);
	// a fresh press after the pad lets go ends the automatic launch early
	const takeOver = () => ship && liftoff > RELEASE && (liftoff = Infinity);
	const KEYS: Record<string, keyof Input> = {
		ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
		ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
	};
	canvas.addEventListener('keydown', (e) => {
		if (!playing || e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.code === 'Escape') {
			setPlaying(false);
			play.focus({ preventScroll: true });
		} else if (e.code === 'KeyE') {
			if (!e.repeat) hop();
		} else if (e.code === 'Enter') launch();
		else if (KEYS[e.code]) {
			if (!e.repeat) takeOver();
			input[KEYS[e.code]] = true;
			e.preventDefault(); // the page must not scroll
		}
	});
	canvas.addEventListener('keyup', (e) => KEYS[e.code] && (input[KEYS[e.code]] = false));
	canvas.addEventListener('blur', () => playing && setPlaying(false));
	play.addEventListener('click', () => setPlaying(!playing));
	for (const pad of pads) {
		const key = pad.dataset.key as keyof Input;
		pad.addEventListener('pointerdown', (e) => {
			pad.setPointerCapture(e.pointerId);
			takeOver();
			input[key] = true;
		});
		for (const end of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(end, () => (input[key] = false));
		pad.addEventListener('contextmenu', (e) => e.preventDefault());
	}
	// pressing a control must not take focus off the canvas, which would end the game
	for (const el of [button, play, ...pads, ...hops]) el.addEventListener('mousedown', (e) => playing && e.preventDefault());

	new ResizeObserver(build).observe(scene);
	dark.addEventListener('change', build);
	still.addEventListener('change', start);
	new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
		start();
	}).observe(scene);
	build();
	start();
}
