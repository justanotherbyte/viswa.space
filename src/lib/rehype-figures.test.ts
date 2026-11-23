// Run with: node --test src/lib/rehype-figures.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rehypeFigures } from './rehype-figures.ts';

const img = (alt: string) => ({ type: 'element', tagName: 'img', properties: { src: 'a.png', alt }, children: [] });
const para = (...children: any[]) => ({ type: 'root', children: [{ type: 'element', tagName: 'p', properties: {}, children }] });

test('wraps a lone caption= image in a figure and strips the prefix', () => {
	const tree: any = para({ type: 'text', value: '\n' }, img('caption=VEGA at sunset'));
	rehypeFigures()(tree);
	const fig = tree.children[0];
	assert.equal(fig.tagName, 'figure');
	assert.equal(fig.children[0].tagName, 'img');
	assert.equal(fig.children[1].tagName, 'figcaption');
	assert.equal(fig.children[1].children[0].value, 'VEGA at sunset');
	assert.equal(fig.children[0].properties.alt, 'VEGA at sunset');
});

test('leaves images without the caption= prefix alone', () => {
	const tree: any = para(img('VEGA at sunset'));
	rehypeFigures()(tree);
	assert.equal(tree.children[0].tagName, 'p');
});

test('leaves images inside text alone', () => {
	const tree: any = para({ type: 'text', value: 'see ' }, img('caption=icon'));
	rehypeFigures()(tree);
	assert.equal(tree.children[0].tagName, 'p');
});

test('skips images with empty alt', () => {
	const tree: any = para(img(''));
	rehypeFigures()(tree);
	assert.equal(tree.children[0].tagName, 'p');
});
