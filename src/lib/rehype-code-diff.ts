// A fenced block whose meta has `diff` (```verilog diff) marks changed lines with a
// leading "+" (added) or "-" (removed). The marker is stripped so highlight.js sees
// plain code, and <pre data-diff> keeps one char per line: "+", "-" or ".".
// CodeDiff.astro reads it after highlighting to dim and fold the unchanged lines.
type El = { type: string; tagName?: string; value?: string; data?: { meta?: string }; properties?: Record<string, unknown>; children?: El[] };

export function rehypeCodeDiff() {
	return (tree: El) => walk(tree);
}

function walk(node: El) {
	for (const child of node.children ?? []) {
		const code = child.tagName === 'pre' ? child.children?.[0] : undefined;
		if (code?.tagName === 'code' && /(^|\s)diff(\s|$)/.test(meta(code))) mark(child, code);
		else walk(child);
	}
}

// MDX exposes the fence meta as a `metastring` property, plain markdown as data.meta.
const meta = (code: El) => String(code.properties?.metastring ?? code.data?.meta ?? '');

function mark(pre: El, code: El) {
	const text = code.children?.[0];
	if (code.children?.length !== 1 || text?.type !== 'text') return;
	const lines = text.value!.replace(/\n$/, '').split('\n');
	let kinds = '';
	text.value = lines
		.map((line) => {
			const k = line[0] === '+' || line[0] === '-' ? line[0] : '.';
			kinds += k;
			return k === '.' ? line : line.slice(1);
		})
		.join('\n');
	pre.properties = { ...pre.properties, dataDiff: kinds };
}
