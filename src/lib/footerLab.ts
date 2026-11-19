// The foreground hardware: separate assemblies standing on the ground below the plateau, drawn in a shallow oblique projection.
// Each assembly has its own origin; plane coordinates (a, b) run right and towards the viewer, z is height above the board.
import { n, line, ring, rect, W, H, G, BOARD, valley } from './footerScene';

const SK = 0.45, SV = 0.4;
export type Kid = { t: 'path'; d: string; c: string; id?: string } | { t: 'text'; x: number; y: number; s: number; v: string; c?: string };
export type Item = { t: 'path'; d: string; c: string; id?: string } | { t: 'plane'; m: string; kids: Kid[]; c?: string };

// chamfer every corner of an orthogonal route at 45°, the way copper is usually drawn
const chamfer = (pts: number[][], r = 4) => {
	const out = [pts[0]];
	for (let i = 1; i < pts.length - 1; i++) {
		const [px, py] = pts[i - 1], [x, y] = pts[i], [nx, ny] = pts[i + 1];
		const d1 = Math.hypot(x - px, y - py), d2 = Math.hypot(nx - x, ny - y), k = Math.min(r, d1 / 2, d2 / 2);
		out.push([x - ((x - px) / d1) * k, y - ((y - py) / d1) * k], [x + ((nx - x) / d2) * k, y + ((ny - y) / d2) * k]);
	}
	out.push(pts.at(-1)!);
	return out;
};
const meander = (a0: number, a1: number, b: number, amp: number, pitch = 4) => {
	const pts: number[][] = [];
	for (let a = a0; a + pitch <= a1; a += pitch) pts.push([a, b], [a, b - amp], [a + pitch / 2, b - amp], [a + pitch / 2, b]);
	return [...pts, [a1, b]];
};

const assembly = (fx: number, fy: number, A: number, B: number) => {
	// fx, fy: screen position of the board's front-left corner
	const ox = fx + B * SK, oy = fy - B * SV;
	const P = (a: number, b: number, z = 0) => [ox + a - SK * b, oy + SV * b - z];
	const L = (pts: number[][], z = 0) => line(pts.map(([a, b]) => P(a, b, z)));
	const quad = (a0: number, b0: number, a1: number, b1: number, z = 0) => L([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], z) + 'Z';
	const m = (z = 0) => `matrix(1 0 ${-SK} ${SV} ${n(ox)} ${n(oy - z)})`;
	const items: Item[] = [];
	const path = (d: string, c: string, id?: string) => items.push({ t: 'path', d, c, id });
	const plane = (z: number, kids: Kid[], c?: string) => items.push({ t: 'plane', m: m(z), kids, c });
	// boxes are queued and painted bottom layer first, then back to front; deco runs right after its box so labels stay on top of it
	const boxes: { a0: number; b0: number; a1: number; b1: number; z0: number; z1: number; c: string; id?: string; deco?: () => void }[] = [];
	const box = (a0: number, b0: number, a1: number, b1: number, z1: number, c = 'part', o: { z0?: number; id?: string; deco?: () => void } = {}) =>
		boxes.push({ a0, b0, a1, b1, z0: o.z0 ?? 0, z1, c, id: o.id, deco: o.deco });
	const paintBox = ({ a0, b0, a1, b1, z0, z1, c, id }: (typeof boxes)[number]) => {
		const side = line([P(a0, b0, z0), P(a0, b1, z0), P(a0, b1, z1), P(a0, b0, z1)]) + 'Z' + line([P(a0, b1, z0), P(a1, b1, z0), P(a1, b1, z1), P(a0, b1, z1)]) + 'Z';
		path(side, `${c} side`);
		path(quad(a0, b0, a1, b1, z1), `${c} top`, id);
	};
	const flush = () => {
		boxes.sort((p, q) => p.z0 - q.z0 || p.b1 - q.b1 || q.a0 - p.a0 || p.z1 - q.z1).forEach((b) => (paintBox(b), b.deco?.()));
		boxes.length = 0;
	};
	// a pin-header top: square holes in a grid
	const holes = (a0: number, b0: number, cols: number, rows: number, pitch: number, z: number) =>
		plane(z, [{ t: 'path', d: Array.from({ length: cols * rows }, (_, i) => rect(a0 + (i % cols) * pitch, b0 + Math.floor(i / cols) * pitch, 2.4, 2.4)).join(''), c: 'hole' }]);
	return { P, L, quad, m, items, path, plane, box, flush, holes, ox, oy };
};

// ---------- FPGA development board ----------

const fb = assembly(968, 650, 400, 300);
{
	const { P, L, quad, path, plane, box, flush, holes } = fb;
	const traces: string[] = [], pairs: string[] = [], power: string[] = [], vias: string[] = [], silk: Kid[] = [], pads: string[] = [];
	const t = (pts: number[][], r = 4) => (traces.push(L(chamfer(pts, r))), L(chamfer(pts, r)));
	const v = (a: number, b: number, r = 1.6) => vias.push(ring(a, b, r));
	const s = (a: number, b: number, v: string, size = 5) => silk.push({ t: 'text', x: a, y: b, s: size, v });

	// the PCB itself, with thickness, mounting holes and a silkscreen keep-out line
	box(0, 0, 400, 300, 0, 'pcb', { z0: -3.5 });
	flush();
	plane(0, [
		{ t: 'path', d: [[8, 8], [392, 8], [8, 292], [392, 292]].map(([a, b]) => ring(a, b, 4.2) + ring(a, b, 2)).join(''), c: 'mhole' },
		{ t: 'path', d: rect(4, 4, 392, 292), c: 'keepout' },
	]);

	// BGA footprint: the pad grid the FPGA sits on, exposed because the package is lifted off it
	const grid = Array.from({ length: 144 }, (_, i) => ring(177 + (i % 12) * 6, 117 + Math.floor(i / 12) * 6, 1.3)).join('');
	plane(0, [
		{ t: 'path', d: rect(170, 110, 80, 80), c: 'silk' },
		{ t: 'path', d: grid, c: 'bga' },
		{ t: 'path', d: `M170 116l6-6`, c: 'silk' },
	]);

	// DDR3L, fed through short length-matched serpentines
	for (let j = 0; j < 6; j++) {
		const b = 124 + 6 * j;
		traces.push(L(j % 2 ? [[250, b], [270, b]] : [[250, b], ...meander(253, 267, b, 2.4), [270, b]]));
	}
	// QSPI flash behind the FPGA, nested so no route crosses another
	for (let i = 0; i < 4; i++) {
		t([[174 + 3 * i, 110], [174 + 3 * i, 82 - 3 * i], [159, 82 - 3 * i]], 3);
		v(174 + 3 * i, 108);
	}
	// 100 MHz oscillator into a clock-capable pin
	t([[148, 123], [162, 123], [162, 128], [170, 128]], 3);
	// USB: a differential pair into the UART bridge, then two lines into the FPGA
	pairs.push(L([[12, 104], [30, 104]]), L([[12, 106.4], [30, 106.4]]));
	for (let i = 0; i < 2; i++) t([[50, 104 + 4 * i], [100, 104 + 4 * i], [146, 150 + 4 * i], [170, 150 + 4 * i]], 0);
	// Ethernet: four pairs from the jack to the PHY, then the RGMII lines into the FPGA's top edge
	for (let p = 0; p < 4; p++) pairs.push(L([[44, 30 + 6 * p], [56, 30 + 6 * p]]), L([[44, 31.8 + 6 * p], [56, 31.8 + 6 * p]]));
	[196, 202, 208].forEach((a, i) => (t([[80, 36 + 4 * i], [a, 36 + 4 * i], [a, 110]], 4), v(a, 108)));
	// PMOD JA (the 7-segment module) and JB from the top edge, JC under the DDR, JD from the bottom edge
	const ja = [220, 226, 232].map((a, i) => t([[a, 110], [a, 48 + 6 * i], [380, 48 + 6 * i]]));
	[238, 244].forEach((a, i) => t([[a, 110], [a, 96 + 6 * i], [380, 96 + 6 * i]]));
	[170, 176, 182].forEach((b, i) => t([[250, b], [320 + 8 * i, b], [332 + 8 * i, b + 10 - 4 * i], [380, b + 10 - 4 * i]]));
	const jd = [248, 242, 236].map((a, i) => t([[a, 190], [a, 204 + 6 * i], [380, 204 + 6 * i]]));
	// front IO: LEDs from the bottom edge, switches and buttons from the left edge
	const leds = [0, 1, 2, 3].map((i) => t([[204 + 4 * i, 190], [204 + 4 * i, 236 + 4 * i], [182.5 + 12 * i, 236 + 4 * i], [182.5 + 12 * i, 268]], 3));
	[36, 52, 68, 84, 116, 132, 148, 164].forEach((a, k) => t([[170, 160 + 3 * k], [a, 160 + 3 * k], [a, 262]], 2.5));
	// power: barrel jack to the buck regulators, short and wide
	power.push(L([[28, 81], [40, 81]]), L([[54, 73], [62, 73]]), L([[54, 89], [62, 89]]), L([[74, 75], [90, 75], [100, 85], [120, 85]]));
	[[100, 92], [110, 92], [120, 92], [128, 60], [136, 60]].forEach(([a, b]) => v(a, b, 1.3));
	// test points and loose vias scattered where real boards have them
	[[300, 70], [312, 70], [330, 260], [150, 236], [90, 140]].forEach(([a, b]) => v(a, b, 2));

	path(power.join(''), 'power');
	path(traces.join(''), 'trace');
	path(pairs.join(''), 'pair');
	plane(0, [{ t: 'path', d: vias.join(''), c: 'via' }]);

	// parts
	box(-6, 16, 40, 60, 13, 'part tall', {
		deco: () => {
			// the jack's opening and its two LEDs face left
			path(L([[-6, 24], [-6, 52]], 2) + L([[-6, 52], [-6, 24]], 9).replace('M', 'L') + 'Z', 'opening');
			path(line([P(-6, 19, 10), P(-6, 22, 10), P(-6, 22, 12), P(-6, 19, 12)]) + 'Z', 'lamp blue');
			path(line([P(-6, 54, 10), P(-6, 57, 10), P(-6, 57, 12), P(-6, 54, 12)]) + 'Z', 'lamp amber blink');
		},
	});
	box(56, 28, 80, 52, 1.6, 'part', { deco: () => plane(1.6, [{ t: 'text', x: 59, y: 43, s: 5, v: 'PHY' }], 'mark') });
	box(-4, 70, 28, 92, 12, 'part tall', { deco: () => path(L([[-4, 76], [-4, 86], [-4, 86], [-4, 76]], 3) + L([[-4, 86], [-4, 76]], 9).replace('M', 'L') + 'Z', 'opening') });
	box(40, 66, 54, 80, 5, 'part');
	box(40, 84, 54, 98, 5, 'part');
	box(62, 70, 74, 80, 2, 'part');
	box(62, 84, 74, 94, 2, 'part');
	box(-3, 98, 12, 112, 4, 'part', { deco: () => path(L([[-3, 101], [-3, 109]], 1.4) + L([[-3, 109], [-3, 101]], 2.8).replace('M', 'L') + 'Z', 'opening') });
	box(30, 98, 50, 118, 1.6, 'part');
	box(140, 71, 158, 84, 2, 'part', { deco: () => plane(2, [{ t: 'text', x: 142, y: 79, s: 4, v: 'QSPI' }], 'mark') });
	box(136, 118, 148, 128, 2.4, 'part metal', { deco: () => plane(2.4, [{ t: 'text', x: 137.4, y: 124.6, s: 3.2, v: '100M' }], 'mark') });
	box(270, 118, 310, 162, 2, 'part', { deco: () => plane(2, [{ t: 'text', x: 276, y: 142, s: 6, v: 'DDR3L' }], 'mark') });
	// shield headers along the back edge, PMODs along the right
	box(96, 5, 176, 12, 8, 'part header', { deco: () => holes(98, 7.3, 14, 1, 5.6, 8) });
	box(196, 5, 300, 12, 8, 'part header', { deco: () => holes(198, 7.3, 18, 1, 5.6, 8) });
	const pmods = [26, 84, 142, 200];
	pmods.forEach((b0) => box(382, b0, 402, b0 + 48, 8, 'part header', { deco: () => holes(385, b0 + 4, 2, 6, 7.4, 8) }));
	// front IO: slide switches, push buttons, user LEDs, RGB LEDs, PROG, DONE, RESET
	[0, 1, 2, 3].forEach((i) =>
		box(30 + 16 * i, 262, 42 + 16 * i, 280, 4, 'part', {
			deco: () => path(L([[33 + 16 * i, 272], [39 + 16 * i, 272], [39 + 16 * i, 278], [33 + 16 * i, 278]], 4) + 'Z', 'knob', `sw${i}`),
		}),
	);
	[0, 1, 2, 3].forEach((i) =>
		box(110 + 16 * i, 262, 122 + 16 * i, 276, 3, 'part', { deco: () => plane(3.6, [{ t: 'path', d: ring(116 + 16 * i, 269, 3.4), c: 'cap' }]) }),
	);
	[0, 1, 2, 3].forEach((i) => box(180 + 12 * i, 268, 185 + 12 * i, 272, 1, 'led', { id: `ld${4 + i}` }));
	[0, 1, 2, 3].forEach((i) => box(232 + 12 * i, 266, 238 + 12 * i, 272, 1.4, 'led rgb', { id: `rgb${i}` }));
	box(300, 214, 310, 222, 3, 'part', { deco: () => plane(3.4, [{ t: 'path', d: ring(305, 218, 2.6), c: 'cap' }]) });
	box(316, 216, 321, 220, 1, 'led done');
	box(6, 236, 16, 246, 3, 'part', { deco: () => plane(3.4, [{ t: 'path', d: ring(11, 241, 2.6), c: 'cap' }]) });
	// passives in short rows, the way decoupling clusters around a BGA look
	for (let i = 0; i < 6; i++) box(256 + 5 * i, 104, 259 + 5 * i, 108, 1, 'part small'), box(160, 168 - 6 * i, 164, 171 - 6 * i, 1, 'part small');
	for (let i = 0; i < 4; i++) box(178 + 6 * i, 194, 181 + 6 * i, 198, 1, 'part small');

	// 7-segment PMOD: a small board plugged into JA, sticking out past the right edge
	box(400, 22, 470, 78, 1.4, 'pcb module', { z0: 2.6 });
	box(408, 30, 462, 70, 6.4, 'part display', {
		z0: 4,
		deco: () => {
			// four italic digits drawn in the module's plane; the script lights their segments
			const segs = (x: number, y: number) => {
				const w = 9, h = 13, sl = 1.6, k = 1.2;
				const S = (pts: number[][]) => pts.map(([a, b]) => [a - sl * ((b - y) / h - 1), b]);
				return [
					S([[x + k, y], [x + w - k, y]]),
					S([[x + w, y + k], [x + w, y + h / 2 - k]]),
					S([[x + w, y + h / 2 + k], [x + w, y + h - k]]),
					S([[x + k, y + h], [x + w - k, y + h]]),
					S([[x, y + h / 2 + k], [x, y + h - k]]),
					S([[x, y + k], [x, y + h / 2 - k]]),
					S([[x + k, y + h / 2], [x + w - k, y + h / 2]]),
				].map((pts) => 'M' + pts.map(([a, b]) => `${n(a)} ${n(b)}`).join('L'));
			};
			const kids: Kid[] = [];
			[0, 1, 2, 3].forEach((d) => segs(414 + d * 12.5, 43).forEach((dd, sI) => kids.push({ t: 'path', d: dd, c: 'seg', id: `seg${d}${sI}` })));
			plane(6.4, kids);
		},
	});
	flush();

	// silkscreen on the bare board, after the parts so it never hides under one
	s(232, 240, 'ARTIX-7 FPGA DEV BOARD', 7.4);
	s(232, 250, 'REV C  ·  viswa.space', 4.6);
	s(252, 196, 'U1 FPGA', 4.6);
	s(272, 114, 'DDR', 4.6);
	s(130, 115, 'CLK', 4.6);
	s(140, 68, 'FLASH', 4);
	s(96, 22, 'IO 0-13', 4.6);
	s(196, 22, 'IO 26-41', 4.6);
	['JA', 'JB', 'JC', 'JD'].forEach((l, i) => s(366, pmods[i] + 8, l, 5));
	[0, 1, 2, 3].forEach((i) => (s(29 + 16 * i, 288, `SW${i}`, 3.6), s(109 + 16 * i, 284, `BTN${i}`, 3.6), s(178 + 12 * i, 280, `LD${4 + i}`, 3.4), s(230 + 12 * i, 280, `LD${i}`, 3.4)));
	s(298, 230, 'PROG', 3.6);
	s(314, 228, 'DONE', 3.6);
	s(4, 254, 'RESET', 3.6);
	s(2, 76 - 12, 'ETH', 4);
	s(14, 124, 'UART/JTAG', 3.6);
	s(32, 104 - 9, 'PWR', 3.6);
	s(40, 64, 'VCC 3V3', 3.6);
	plane(0, silk, 'silk');

	// the FPGA package, lifted off its footprint like an exploded drawing, with leader lines down to the pads
	const lead = [[172, 112], [248, 112], [172, 188], [248, 188]].map(([a, b]) => line([P(a, b, 0.5), P(a, b, 17.5)])).join('');
	path(lead, 'leader');
	box(172, 112, 248, 188, 20.5, 'part fpga', { z0: 18 });
	box(182, 122, 238, 178, 23, 'part lid', {
		z0: 20.5,
		deco: () =>
			plane(23, [
				{ t: 'path', d: ring(188, 128, 1.6), c: 'dotmark' },
				{ t: 'text', x: 188, y: 146, s: 9.5, v: 'ARTIX-7' },
				{ t: 'text', x: 188, y: 156, s: 5.4, v: 'XC7A35T' },
				{ t: 'text', x: 188, y: 164, s: 4, v: 'CSG324  1C' },
			], 'mark lid-mark'),
	});
	flush();

	// pulse routes in screen space, source first
	Object.assign(fb, {
		routes: {
			usb: L(chamfer([[12, 105.2], [30, 105.2], [50, 104], [100, 104], [146, 150], [170, 150]], 0)),
			ja: ja[0],
			led: leds,
			jd: jd[0],
			porch: [P(-3, 105, 2), P(404, 222, 6), P(-6, 38, 5)],
		},
	});
}

// ---------- field case: wireless launch controller and telemetry receiver ----------

// a rugged case seen front-on with its lid open; depth runs to the upper right like the scope's
const CASE = { x: 470, y: 602, w: 168, h: 46, d: 34 };
const ctrl = (() => {
	const { x, y, w, h, d } = CASE, dx = d * SK, dy = d * SV, hx = x + dx, hy = y - dy;
	const lid = { x0: hx + 7, y0: hy - 62 }; // the lid leans back a little past vertical
	return {
		left: line([[x, y], [hx, hy], [hx, hy + h], [x, y + h]]) + 'Z',
		top: line([[x, y], [hx, hy], [hx + w, hy], [x + w, y]]) + 'Z',
		front: rect(x, y, w, h),
		// lid: outer shell, inner face, hinge line, and the screen set into it
		lid: line([[hx, hy], [lid.x0, lid.y0], [lid.x0 + w, lid.y0], [hx + w, hy]]) + 'Z',
		lidInner: line([[hx + 6, hy - 3], [lid.x0 + 6, lid.y0 + 5], [lid.x0 + w - 6, lid.y0 + 5], [hx + w - 6, hy - 3]]) + 'Z',
		screen: { x: lid.x0 + 18, y: lid.y0 + 11, w: w - 44, h: 36 },
		hinge: `M${n(hx + 10)} ${n(hy)}h18M${n(hx + w - 28)} ${n(hy)}h18`,
		// ribs and latches on the front, a carry handle, rubber feet
		ribs: `M${x + 6} ${y + 6}h${w - 12}M${x + 6} ${y + h - 6}h${w - 12}`,
		latches: `${rect(x + 22, y + 2, 14, 10)}${rect(x + w - 36, y + 2, 14, 10)}`,
		latchPins: `M${x + 29} ${y + 4}v6M${x + w - 29} ${y + 4}v6`,
		handle: `M${x + w / 2 - 22} ${y + 8}v-2h44v2M${x + w / 2 - 18} ${y + 6}v-3h36v3`,
		plate: rect(x + w / 2 - 30, y + 18, 60, 14),
		feet: `${rect(x + 10, y + h, 16, 3)}${rect(x + w - 26, y + h, 16, 3)}`,
		usb: rect(x + w - 16, y + 30, 8, 5),
		// rubber-duck antenna on a side-mounted SMA, clear of the open lid
		antenna: `M${x - 4} ${y + 10}l-7 -50`,
		antennaBase: `${rect(x - 6, y + 8, 6, 6)}M${x - 4} ${y + 10}l-1 -6`,
		tip: [x - 11, y - 40],
		// the control deck, mapped onto the case's top face
		deck: `matrix(1 0 ${-SK} ${SV} ${n(hx)} ${n(hy)})`,
		label: { x: x + w / 2, y: y + 27.6 },
		usbPort: [x + w - 12, y + 33],
	};
})();

// ---------- bench oscilloscope, probing PMOD JD ----------

const SCOPE = { x: 1588, y: 562, w: 206, h: 84, d: 40 };
const scope = (() => {
	const { x, y, w, h, d } = SCOPE, dx = d * SK, dy = d * SV;
	return {
		left: line([[x, y], [x + dx, y - dy], [x + dx, y + h - dy], [x, y + h]]) + 'Z',
		top: line([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]]) + 'Z',
		front: rect(x, y, w, h),
		handle: `M${x + 40} ${y - 6}q${w / 2 - 20} -22 ${w - 60} 0`,
		bezel: rect(x + 6, y + 6, 136, 74),
		screen: { x: x + 10, y: y + 9 },
		knobs: [ring(x + 162, y + 20, 7) + ring(x + 162, y + 20, 3.6), ring(x + 186, y + 20, 5) + ring(x + 186, y + 20, 2.4), ring(x + 162, y + 44, 5), ring(x + 186, y + 44, 5)].join(''),
		marks: `M${x + 162} ${y + 13}v3M${x + 186} ${y + 15}v2.4M${x + 162} ${y + 39}v2.4M${x + 186} ${y + 39}v2.4`,
		buttons: [0, 1, 2, 3, 4, 5].map((i) => rect(x + 152 + (i % 3) * 14, y + 56 + Math.floor(i / 3) * 6, 9, 3.6)).join(''),
		bnc: [ring(x + 160, y + 76, 4), ring(x + 178, y + 76, 4), ring(x + 196, y + 76, 4)].join(''),
		bncCore: [ring(x + 160, y + 76, 1.4), ring(x + 178, y + 76, 1.4), ring(x + 196, y + 76, 1.4)].join(''),
		feet: `${rect(x + 8, y + h, 14, 3)}${rect(x + w - 22, y + h, 14, 3)}`,
		labels: [
			{ x: x + 154, y: y + 84, v: 'CH1' },
			{ x: x + 172, y: y + 84, v: 'CH2' },
			{ x: x + 189, y: y + 84, v: 'TRIG' },
			{ x: x + 152, y: y + 9, v: 'DSO-2C  100MHz' },
		],
		ch1: [x + 160, y + 76],
	};
})();

// ---------- cables lying on the ground, and the ground itself ----------

const pt = (p: number[]) => `${n(p[0])} ${n(p[1])}`;
const r = (fb as any).routes;
// the USB lead runs from the case along the ground to the dev board's UART port
const usbCable = `M${pt(ctrl.usbPort)}C${n(ctrl.usbPort[0] + 120)} ${n(ctrl.usbPort[1] + 26)} ${n(r.porch[0][0] - 180)} ${n(r.porch[0][1] + 70)} ${pt(r.porch[0])}`;
const probe = `M${pt(r.porch[1])}C${n(r.porch[1][0] + 60)} ${n(r.porch[1][1] + 50)} ${n(scope.ch1[0] - 60)} ${n(scope.ch1[1] + 20)} ${pt(scope.ch1)}`;
// the yagi's coax runs down the mast and joins the field cable at the nearest stake
const coax = `M382 ${G - 32}V${G - 14}C382 ${G - 5} 366 ${G - 7} 350 ${G - 7}`;

let gseed = 77;
const grnd = () => ((gseed = (gseed * 16807) % 2147483647) / 2147483647);
const groundRows = Array.from({ length: 9 }, (_, k) => {
	const y = BOARD + 6 + 128 * (k / 8) ** 1.25;
	let d = '';
	for (let x = grnd() * 60; x < W; ) {
		const len = 20 + grnd() * 140;
		d += `M${n(x)} ${n(y)}h${n(len)}`;
		x += len + 16 + grnd() * 90;
	}
	return { d, gap: n(4 + k * 0.9) };
});
const pebbles = Array.from({ length: 160 }, () => [grnd() * W, BOARD + 4 + grnd() ** 0.8 * (H - BOARD - 6)])
	.map(([x, y]) => `M${n(x)} ${n(y)}h${n(1 + grnd() * 1.6)}v1h-${n(1 + grnd() * 1.6)}z`)
	.join('');
// hatched contact shadows where each assembly meets the ground
const shadow = (x0: number, x1: number, y: number) => Array.from({ length: Math.floor((x1 - x0) / 4) }, (_, i) => `M${x0 + i * 4} ${y + 2}l-3 3`).join('');

// the river's four channels braid into one network cable that plugs into the board's Ethernet jack
const netCable = (() => {
	const jack = r.porch[2], q = [jack[0] - 26, jack[1] + 4];
	const lines = valley.mouth.map(([x, y], i) => `M${n(x)} ${n(y)}C${n(x - 6 + i * 3)} ${n(y + 16 + i * 2)} ${n(q[0] - 70)} ${n(q[1] + 8 - i * 2)} ${n(q[0])} ${n(q[1] - 1.5 + i)}`);
	return { lines, d: lines.join(''), plug: `M${n(q[0])} ${n(q[1])}L${n(jack[0] - 9)} ${n(jack[1] + 2)}M${n(jack[0] - 9)} ${n(jack[1] - 1)}h7v6h-7z` };
})();

export const lab = {
	fpga: fb.items,
	ctrl,
	scope,
	ground: { rows: groundRows, pebbles, shadows: shadow(964, 1370, 650) + shadow(470, 640, 649) + shadow(1588, 1794, 650) + `M0 ${BOARD}H904` },
	cables: { usb: usbCable, probe, coax, net: netCable.d, plug: netCable.plug },
	routes: r,
	pulses: { net: netCable.lines, usb: usbCable, probe },
};
