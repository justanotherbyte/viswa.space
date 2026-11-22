// Run with: node --test src/lib/excerpt.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { excerpt } from './excerpt.ts';

test('takes the first prose paragraph as plain text', () => {
	const body = [
		"import A from './A.astro';\nimport B from './B.astro';",
		'# Heading',
		'<A>',
		'```verilog\nmodule m;\n\n  logic x;\n\nendmodule\n```',
		'</A>',
		'> [!NOTE]\n> Callout.',
		'`lw` reads *one* **word**\nfrom [memory](https://x.y), not 4 * 8 words of `funct_3`.',
		'Second paragraph.',
	].join('\n\n');
	assert.equal(excerpt(body), 'lw reads one word from memory, not 4 * 8 words of funct_3');
	assert.equal(excerpt('One two, three four.', 10), 'One two');
	assert.equal(excerpt('One two three', 7), 'One two');
	assert.equal(excerpt('# Only a heading'), '');
});
