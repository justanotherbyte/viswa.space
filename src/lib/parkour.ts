// Movement for the footer astronaut, in world pixels and seconds. Platforms are one-way: you land on their tops and pass
// through from below. Walls only catch you in the air, so you can always walk along the street in front of a building.

export interface Platform {
	x: number;
	y: number;
	w: number;
	key?: string; // set on things that move, so a rider is carried along
	ground?: boolean; // cannot be dropped through
}
export interface Wall {
	x: number;
	y0: number;
	y1: number;
	side: 1 | -1; // 1 blocks movement to the right, -1 to the left
}
export interface Input {
	left: boolean;
	right: boolean;
	jump: boolean;
	down: boolean;
}

export const newBody = (x: number, y: number) => ({
	x, y, // centre of the feet
	vx: 0, vy: 0,
	face: 1,
	ground: false,
	wall: 0, // side of the wall being held, 0 for none
	fuel: true, // one jetpack burst per flight
	boosted: false, // true on the step the jetpack fires
	coyote: 0, buffer: 0, lock: 0, drop: 0, dropY: 0,
	held: false,
	on: undefined as string | undefined, onX: 0, onY: 0,
});
export type Body = ReturnType<typeof newBody>;

const RUN = 72, GRAVITY = 260, JUMP = 102, BOOST = 88, KICK = 66, FALL = 130, SLIDE = 16;
const HALF = 3, TALL = 10, FOOT = 2, STEP = 3;

/** Moves a rider with the platform it stands on. A jump bigger than a frame's motion means the platform wrapped around. */
export function carry(b: Body, plats: Platform[]) {
	const p = b.on && plats.find((q) => q.key === b.on);
	if (!p) return;
	const dx = p.x - b.onX, dy = p.y - b.onY;
	if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
		b.x += dx;
		b.y += dy;
	}
	b.onX = p.x;
	b.onY = p.y;
}

export function step(b: Body, input: Input, dt: number, plats: Platform[], walls: Wall[]) {
	const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
	for (const k of ['coyote', 'buffer', 'lock', 'drop'] as const) b[k] = Math.max(0, b[k] - dt);
	if (input.jump && !b.held) b.buffer = 0.1;
	b.held = input.jump;
	b.boosted = false;

	// after a wall kick the stick is ignored briefly, or holding toward the wall would cancel the kick
	if (!b.lock) {
		const want = dir * RUN, a = (b.ground ? 620 : 420) * dt;
		b.vx += Math.max(-a, Math.min(a, want - b.vx));
		if (dir) b.face = dir;
	}

	if (b.ground && input.down && !plats.some((p) => p.ground && Math.abs(p.y - b.y) < 0.5)) {
		b.drop = 0.2;
		b.dropY = b.y;
		b.ground = false;
	} else if (b.buffer) {
		const hop = (vy: number) => {
			b.vy = vy;
			b.buffer = b.coyote = 0;
			b.ground = false;
		};
		if (b.ground || b.coyote) hop(-JUMP);
		else if (b.wall) {
			b.vx = -b.wall * KICK;
			b.face = -b.wall;
			b.lock = 0.13;
			b.fuel = true;
			hop(-JUMP);
		} else if (b.fuel) {
			b.fuel = false;
			b.boosted = true;
			hop(-BOOST);
		}
	}
	if (!input.jump && b.vy < -45) b.vy = -45; // letting go early makes a short hop

	// sideways, stopping at walls while airborne
	const nx = b.x + b.vx * dt;
	let x = nx;
	b.wall = 0;
	if (!b.ground)
		for (const w of walls) {
			if (dir !== w.side || b.y <= w.y0 || b.y - TALL >= w.y1) continue;
			const was = w.side * (w.x - b.x) - HALF, now = w.side * (w.x - nx) - HALF;
			if (was >= -0.01 && now <= 0) {
				x = w.x - w.side * HALF;
				b.wall = w.side;
				b.vx = 0;
			}
		}
	b.x = x;

	const under = (from: number, to: number) => {
		let best: Platform | undefined;
		for (const p of plats) {
			if (p.y < from || p.y > to || b.x + FOOT <= p.x || b.x - FOOT >= p.x + p.w) continue;
			if (b.drop && !p.ground && Math.abs(p.y - b.dropY) <= STEP) continue;
			if (!best || p.y < best.y) best = p;
		}
		return best;
	};
	const stand = (p: Platform) => {
		b.y = p.y;
		b.vy = 0;
		b.ground = b.fuel = true;
		b.on = p.key;
		b.onX = p.x;
		b.onY = p.y;
	};

	if (b.ground) {
		// follow small steps up and down, so domes and kerbs are walkable
		const p = under(b.y - STEP, b.y + STEP);
		if (p) return stand(p);
		b.ground = false;
		b.coyote = 0.1;
	}
	b.on = undefined;
	b.vy = Math.min(b.wall && b.vy > 0 ? SLIDE : FALL, b.vy + GRAVITY * dt);
	const ny = b.y + b.vy * dt;
	const p = b.vy >= 0 ? under(b.y - 0.01, ny) : undefined;
	if (p) stand(p);
	else b.y = ny;
}
