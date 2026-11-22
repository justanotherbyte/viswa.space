// Run with: node --test src/lib/flight.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fly, type Ship } from './flight.ts';

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
