// Run with: node --test src/lib/remark-callouts.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remarkCallouts } from './remark-callouts.ts';

const quote = (value: string) => ({
	type: 'root',
	children: [{ type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value }] }] }],
});

test('converts a marked blockquote and strips the marker', () => {
	const tree: any = quote('[!NOTE]\nThe keen-eyed reader');
	remarkCallouts()(tree);
	const aside = tree.children[0];
	assert.equal(aside.data.hName, 'aside');
	assert.equal(aside.children[0].children[0].value, 'note');
	assert.equal(aside.children[1].children[0].children[0].value, 'The keen-eyed reader');
});

test('drops the paragraph when the marker stands alone', () => {
	const tree: any = quote('[!warning]');
	tree.children[0].children.push({ type: 'paragraph', children: [{ type: 'text', value: 'Body' }] });
	remarkCallouts()(tree);
	assert.deepEqual(tree.children[0].children[1].children.map((p: any) => p.children[0].value), ['Body']);
});

test('leaves plain and unknown-kind blockquotes alone', () => {
	for (const value of ['Just a quote', '[!SHOUT] nope']) {
		const tree: any = quote(value);
		remarkCallouts()(tree);
		assert.equal(tree.children[0].data, undefined);
	}
});
