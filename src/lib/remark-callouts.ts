// Turns GitHub-style alerts (`> [!NOTE]` as a blockquote's first line) into
// <aside class="callout"> with a label span and a body div. Styled in global.css.
const KINDS = new Set(['note', 'tip', 'important', 'warning', 'caution']);

type Node = { type: string; value?: string; children?: Node[]; data?: Record<string, unknown> };

export function remarkCallouts() {
	return (tree: Node) => walk(tree);
}

function walk(node: Node) {
	for (const child of node.children ?? []) {
		if (child.type === 'blockquote') convert(child);
		walk(child);
	}
}

function convert(quote: Node) {
	const first = quote.children?.[0];
	const text = first?.type === 'paragraph' ? first.children?.[0] : undefined;
	const match = text?.type === 'text' ? text.value!.match(/^\[!(\w+)\]\s*/) : null;
	const kind = match?.[1].toLowerCase();
	if (!match || !kind || !KINDS.has(kind)) return;

	text!.value = text!.value!.slice(match[0].length);
	if (!text!.value) first!.children!.shift();
	const body = first!.children!.length ? quote.children! : quote.children!.slice(1);

	quote.data = { hName: 'aside', hProperties: { className: ['callout'], dataKind: kind } };
	quote.children = [
		{ type: 'calloutLabel', data: { hName: 'span', hProperties: { className: ['callout-label'] } }, children: [{ type: 'text', value: kind }] },
		{ type: 'calloutBody', data: { hName: 'div', hProperties: { className: ['callout-body'] } }, children: body },
	];
}
