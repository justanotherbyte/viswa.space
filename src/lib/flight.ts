// Flying VEGA around the page: turn, burn, coast. There is no gravity, so letting go leaves it hovering. Art pixels, seconds.
import type { Input } from './parkour';

export interface Ship {
	x: number; // centre of the rocket, in document space
	y: number;
	vx: number;
	vy: number;
	a: number; // radians clockwise from nose-up
}
export interface Box {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

const TURN = 3.6, THRUST = 320, DRAG = 0.9, BRAKE = 5, BOUNCE = -0.3;

// the automatic launch, in seconds since boarding: the engine lights, the pad lets go, the engine cuts and the player takes over
export const IGNITION = 0.25, RELEASE = 0.9, CUTOFF = 2.2;
const CUTOFF_SPEED = 67; // it coasts from here to a hover about 100px up, clear of the scene but short of scrolling most windows

export function climb(s: Ship, t: number, dt: number) {
	const u = Math.max(0, (t - RELEASE) / (CUTOFF - RELEASE));
	s.vy = -CUTOFF_SPEED * u * u;
	s.y += s.vy * dt;
}

export function fly(s: Ship, input: Input, dt: number, box: Box) {
	s.a += ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * TURN * dt;
	if (input.jump) {
		s.vx += Math.sin(s.a) * THRUST * dt;
		s.vy -= Math.cos(s.a) * THRUST * dt;
	}
	const keep = Math.exp(-(input.down ? BRAKE : DRAG) * dt);
	s.vx *= keep;
	s.vy *= keep;
	const x = s.x + s.vx * dt, y = s.y + s.vy * dt;
	s.x = Math.max(box.x0, Math.min(box.x1, x));
	s.y = Math.max(box.y0, Math.min(box.y1, y));
	if (s.x !== x) s.vx *= BOUNCE;
	if (s.y !== y) s.vy *= BOUNCE;
}

// Bailing out: the astronaut pops up, falls, and opens the parachute in time to drift the last stretch. The fall speed
// grows with the height, so it takes about as long from the top of a long page as from a short one.
export interface Drop {
	vy: number;
	top: number; // terminal speed before the parachute opens
	open: boolean;
}
export const DRIFT = 36;
const SLOW = 4, GLIDE = 90;

export const newDrop = (height: number): Drop => ({ vy: -60, top: Math.max(300, height / 1.6), open: false });

export function drop(d: Drop, height: number, dt: number) {
	if (d.open) d.vy += (DRIFT - d.vy) * (1 - Math.exp(-SLOW * dt));
	else {
		d.vy = Math.min(d.top, d.vy + d.top * 1.6 * dt);
		d.open = d.vy >= 0 && height < GLIDE + d.vy / SLOW;
	}
}

// The empty rocket's way back: it falls to a point up and left of the tower, then burns, slides across and slows into
// the arms. Seconds since bailing out.
export const REENTRY = 2.2, CATCH = 5.6;
const AWAY = 30, ABOVE = 205, ENTRY_SPEED = 110, CATCH_SPEED = 6;

const smooth = (u: number) => {
	const c = Math.max(0, Math.min(1, u));
	return c * c * (3 - 2 * c);
};
// a cubic from a to b with those end speeds, over T seconds: position and acceleration
function cubic(a: number, va: number, b: number, vb: number, T: number, t: number) {
	const u = t / T, d = b - a, m = va * T, n = vb * T, k2 = 3 * d - 2 * m - n, k3 = m + n - 2 * d;
	return [a + m * u + k2 * u * u + k3 * u ** 3, (2 * k2 + 6 * k3 * u) / T ** 2];
}

/** `ceiling` is the highest the rocket may be when it starts its landing burn, for short pages. */
export function returnPath(from: Ship, to: { x: number; y: number }, ceiling: number, t: number) {
	const x = to.x - AWAY, y = Math.max(ceiling, to.y - ABOVE);
	if (t < REENTRY) {
		const turn = Math.atan2(Math.sin(from.a), Math.cos(from.a)); // the short way back to upright
		const [py, ay] = cubic(from.y, from.vy, y, ENTRY_SPEED, REENTRY, t);
		return { x: cubic(from.x, from.vx, x, 0, REENTRY, t)[0], y: Math.max(ceiling, py), a: turn * (1 - smooth(t / REENTRY)), burn: ay < -30 };
	}
	const T = CATCH - REENTRY, u = Math.min(1, (t - REENTRY) / T), slide = (u - 0.35) / 0.6;
	const lean = slide > 0 && slide < 1 ? 0.3 * Math.sin(slide * Math.PI * 2) : 0;
	return { x: x + AWAY * smooth(slide), y: cubic(y, ENTRY_SPEED, to.y, CATCH_SPEED, T, u * T)[0], a: lean, burn: u < 1 };
}
