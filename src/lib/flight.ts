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
