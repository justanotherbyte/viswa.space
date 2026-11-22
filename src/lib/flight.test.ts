// Run with: node --test src/lib/flight.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATCH, climb, CUTOFF, DRIFT, drop, fly, newDrop, REENTRY, RELEASE, returnPath, type Ship } from './flight.ts';

const none = { left: false, right: false, jump: false, down: false };
const box = { x0: 0, y0: 0, x1: 480, y1: 1000 };
const run = (s: Ship, input: Partial<typeof none>, secs: number) => {
	for (let i = 0; i < secs * 60; i++) fly(s, { ...none, ...input }, 1 / 60, box);
	return s;
};
const ship = (): Ship => ({ x: 240, y: 900, vx: 0, vy: 0, a: 0 });

test('burning follows the nose', () => {
	const up = run(ship(), { jump: true }, 0.5);
	assert.ok(up.y < 900 && Math.abs(up.x - 240) < 1e-6);
	const s = run(ship(), { right: true }, Math.PI / 2 / 3.6);
	const right = run(s, { jump: true }, 0.5);
	assert.ok(right.x > 260 && Math.abs(right.y - 900) < 5);
});

test('it hovers when left alone and brakes faster than it coasts', () => {
	assert.equal(run(ship(), {}, 2).y, 900);
	const coast = run({ ...ship(), vx: 100 }, {}, 0.5), brake = run({ ...ship(), vx: 100 }, { down: true }, 0.5);
	assert.ok(brake.vx < coast.vx / 2);
});

test('it stays on the page', () => {
	const s = run(ship(), { jump: true }, 10);
	assert.ok(s.y >= 0 && s.y <= 1000);
});

test('the launch holds on the pad, climbs straight up and coasts to a hover', () => {
	const s = ship();
	let t = 0;
	for (; t < RELEASE; t += 1 / 60) climb(s, t, 1 / 60);
	assert.equal(s.y, 900);
	for (; t < CUTOFF; t += 1 / 60) climb(s, t, 1 / 60);
	assert.ok(s.y < 880);
	run(s, {}, 6);
	assert.ok(s.x === 240 && s.y > 785 && s.y < 810 && Math.abs(s.vy) < 1);
});

test('the parachute opens in time from any height', () => {
	for (let h0 = 5; h0 < 6000; h0 = h0 * 1.4 + 3) {
		const d = newDrop(h0);
		let h = h0, t = 0;
		for (; h > 0; t += 1 / 120) {
			drop(d, h, 1 / 120);
			h -= d.vy / 120;
		}
		assert.ok(d.open && d.vy < DRIFT + 10 && t < 8, `${h0}: ${d.vy} after ${t}s`);
	}
});

test('the rocket comes back upright to the arms without a jump', () => {
	for (const from of [{ x: 100, y: -1700, vx: 80, vy: -200, a: 9 }, { x: 390, y: -40, vx: 0, vy: -30, a: 0 }, { x: 20, y: 60, vx: -90, vy: 90, a: -3 }])
		for (const ceiling of [-5000, -90]) {
			const to = { x: 390, y: 50 }, at = (t: number) => returnPath(from, to, ceiling, t);
			const a = at(REENTRY - 1e-6), b = at(REENTRY), end = at(CATCH);
			assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.a - b.a) < 0.01);
			assert.ok(Math.hypot(end.x - to.x, end.y - to.y, end.a) < 0.01);
			for (let t = REENTRY; t < CATCH; t += 0.05) assert.ok(at(t).y >= ceiling && at(t).y <= to.y + 0.01);
		}
});
