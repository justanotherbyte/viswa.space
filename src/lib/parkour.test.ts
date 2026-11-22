// Run with: node --test src/lib/parkour.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { carry, newBody, step, type Input, type Platform, type Wall } from './parkour.ts';

const ground: Platform = { x: -1000, y: 88, w: 2000, ground: true };
const none: Input = { left: false, right: false, jump: false, down: false };
const run = (b: ReturnType<typeof newBody>, input: Partial<Input>, s: number, plats = [ground], walls: Wall[] = []) => {
	let top = b.y;
	for (let i = 0; i < s * 120; i++) {
		step(b, { ...none, ...input }, 1 / 120, plats, walls);
		top = Math.min(top, b.y);
	}
	return top;
};
const standing = (x = 0, plats = [ground]) => {
	const b = newBody(x, plats[0].y);
	run(b, {}, 0.1, plats);
	assert.ok(b.ground);
	return b;
};

test('a held jump rises about 19px, a tap less, and both land', () => {
	const high = 88 - run(standing(), { jump: true }, 1);
	const b = standing();
	run(b, { jump: true }, 0.02);
	const low = 88 - run(b, {}, 1);
	assert.ok(high > 17 && high < 22, `${high}`);
	assert.ok(low < high / 2, `${low}`);
	assert.ok(b.ground && b.y === 88);
});

test('the jetpack fires once per flight', () => {
	const b = standing();
	run(b, { jump: true }, 0.35);
	run(b, {}, 0.02);
	run(b, { jump: true }, 0.02);
	assert.equal(b.fuel, false);
	run(b, {}, 0.02);
	const vy = b.vy;
	run(b, { jump: true }, 0.02);
	assert.ok(b.vy > vy, 'a third press does nothing');
	run(b, {}, 2);
	assert.ok(b.ground && b.fuel);
});

test('platforms are one-way and can be dropped through, the ground cannot', () => {
	const roof: Platform = { x: -10, y: 74, w: 20 };
	const b = standing(0, [ground, roof]);
	run(b, { jump: true }, 1, [ground, roof]);
	assert.equal(b.y, 74);
	run(b, { down: true }, 0.05, [ground, roof]);
	run(b, {}, 1, [ground, roof]);
	assert.equal(b.y, 88);
	run(b, { down: true }, 0.5, [ground, roof]);
	assert.equal(b.y, 88);
});

test('small steps are walked up', () => {
	const b = standing();
	run(b, { right: true }, 0.3, [ground, { x: 5, y: 86, w: 100 }]);
	assert.equal(b.y, 86);
});

test('walls block only in the air, and kicks climb them', () => {
	const walls: Wall[] = [{ x: 20, y0: 20, y1: 88, side: 1 }];
	const walker = standing();
	run(walker, { right: true }, 1, [ground], walls);
	assert.ok(walker.x > 30, 'walks past');
	const b = standing(14);
	run(b, { right: true, jump: true }, 0.4, [ground], walls);
	assert.equal(b.wall, 1);
	assert.equal(b.x, 17);
	let top = b.y;
	for (let i = 0; i < 6; i++) {
		run(b, { right: true }, 0.05, [ground], walls);
		top = Math.min(top, run(b, { right: true, jump: true }, 0.45, [ground], walls));
	}
	assert.ok(top < 40, `climbed to ${top}`);
});

test('a rider is carried, but not across a wrap', () => {
	const bus: Platform = { x: 0, y: 82, w: 15, key: 'bus' };
	const b = newBody(5, 82);
	run(b, {}, 0.1, [bus]);
	bus.x = -2;
	carry(b, [bus]);
	assert.equal(b.x, 3);
	bus.x = 146;
	carry(b, [bus]);
	assert.equal(b.x, 3);
});
