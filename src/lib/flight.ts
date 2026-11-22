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

// The empty rocket's way back: it tips onto its side up and left of the tower, belly-flops down, flips upright on its
// engine, then slides across and slows into the arms. Seconds since bailing out.
export const REENTRY = 2, FLIP = 4.4, CATCH = 7.2;
const HIGH = { away: 70, above: 255 }, LOW = { away: 32, above: 105 }, CATCH_SPEED = 6; // where the flop starts and ends
const FLAT = -Math.PI / 2; // nose to the left, so the flip swings it up toward the tower

const smooth = (u: number) => {
	const c = Math.max(0, Math.min(1, u));
	return c * c * (3 - 2 * c);
};
// a cubic from a to b with those end speeds, over T seconds: position, speed and acceleration
function cubic(a: number, va: number, b: number, vb: number, T: number, t: number) {
	const u = t / T, d = b - a, m = va * T, n = vb * T, k2 = 3 * d - 2 * m - n, k3 = m + n - 2 * d;
	return [a + m * u + k2 * u * u + k3 * u ** 3, (m + 2 * k2 * u + 3 * k3 * u * u) / T, (2 * k2 + 6 * k3 * u) / T ** 2];
}

/** `ceiling` is the highest the rocket may fly, for short pages. `flop` is how hard the air hits its belly, 0 to 1. */
export function returnPath(from: Ship, to: { x: number; y: number }, ceiling: number, t: number) {
	const T = FLIP - REENTRY, x0 = to.x - HIGH.away, x1 = to.x - LOW.away;
	const y0 = Math.max(ceiling, to.y - HIGH.above), y1 = Math.max(ceiling, to.y - LOW.above);
	const vx = (x1 - x0) / T, vy = (y1 - y0) / T;
	if (t < REENTRY) {
		const turn = Math.atan2(Math.sin(from.a - FLAT), Math.cos(from.a - FLAT)); // the short way round
		const over = smooth((t / REENTRY - 0.25) / 0.65);
		const [y, v, ay] = cubic(from.y, from.vy, y0, vy, REENTRY, t);
		return { x: cubic(from.x, from.vx, x0, vx, REENTRY, t)[0], y: Math.max(ceiling, y), a: FLAT + turn * (1 - over), burn: v <= 0 && ay < 0, flop: v > 0 ? over : 0 };
	}
	if (t < FLIP) {
		const u = (t - REENTRY) / T; // it rocks on the air as it falls
		return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, a: FLAT + 0.22 * Math.sin(u * Math.PI * 6), burn: false, flop: 1 };
	}
	const R = CATCH - FLIP, u = Math.min(1, (t - FLIP) / R), slide = (u - 0.35) / 0.6;
	const lean = slide > 0 && slide < 1 ? 0.3 * Math.sin(slide * Math.PI * 2) : 0, up = smooth(u / 0.35);
	// what is left of the sideways drift dies out during the flip
	const coast = vx * R * u * (1 - u) ** 3;
	return { x: x1 + coast + LOW.away * smooth(slide), y: cubic(y1, vy, to.y, CATCH_SPEED, R, u * R)[0], a: FLAT * (1 - up) + lean, burn: u < 1, flop: 1 - smooth(u / 0.2) };
}
