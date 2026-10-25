// Run with: node --test src/lib/gallery.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rowEnds } from './gallery.ts';

test('fills each row until the next photo would overshoot its target', () => {
	// 0.75 + 0.75 = 1.5 is nearest 1.4; a lone 1.33 is nearest 0.9
	assert.deepEqual(rowEnds([0.75, 0.75, 1.33, 0.75, 0.75], [1.4, 0.9, 1.6]), [1, 2]);
});

test('folds a short last row into the row above', () => {
	assert.deepEqual(rowEnds([1.33, 1.33, 1.33, 0.75], [2.6]), [1]);
	assert.deepEqual(rowEnds([0.75], [2]), []);
	assert.deepEqual(rowEnds([], [2]), []);
});
