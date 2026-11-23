// Turns a paragraph holding only a markdown image whose alt starts with "caption=" into
// <figure> with the rest of the alt as <figcaption>. Other images are left alone.
// .img-figure (global.css) shrinks the figure to its image so the caption wraps at the image's edges.
type El = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: El[] };

export const CAPTION_CLASS = 'mt-2.5 max-w-[72ch] text-xs leading-relaxed text-pretty text-zinc-500 dark:text-zinc-400';

// Splits an alt like "caption=VEGA at sunset" into the alt to use and the caption to show.
export function splitCaption(alt: string): { alt: string; caption?: string } {
	if (!alt.startsWith('caption=')) return { alt };
	const caption = alt.slice('caption='.length).trim();
	return { alt: caption, caption };
}

export function rehypeFigures() {
	return (tree: El) => walk(tree);
}

function walk(node: El) {
	for (const child of node.children ?? []) {
		if (child.tagName === 'p') figure(child);
		else walk(child);
	}
}

function figure(p: El) {
	const kids = (p.children ?? []).filter((c) => !(c.type === 'text' && !c.value?.trim()));
	const img = kids[0];
	if (kids.length !== 1 || img.tagName !== 'img') return;
	const { alt, caption } = splitCaption(String(img.properties?.alt ?? ''));
	if (!caption) return;
	img.properties = { ...img.properties, alt };
	p.tagName = 'figure';
	p.properties = { className: ['img-figure'] };
	p.children = [
		img,
		{ type: 'element', tagName: 'figcaption', properties: { className: CAPTION_CLASS.split(' ') }, children: [{ type: 'text', value: caption }] },
	];
}
