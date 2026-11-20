// Turns external markdown links (http/https) into <a class="link-chip"> with the
// site's favicon in front. Styled in global.css. In-page and relative links are left alone.
type El = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: El[] };

export function rehypeLinkChips() {
	return (tree: El) => walk(tree);
}

function walk(node: El) {
	for (const child of node.children ?? []) {
		if (child.tagName === 'a') chip(child);
		else walk(child);
	}
}

function chip(a: El) {
	const href = String(a.properties?.href ?? '');
	if (!/^https?:\/\//.test(href)) return;
	const { hostname } = new URL(href);
	a.properties = { ...a.properties, className: ['link-chip'], target: '_blank', rel: 'noopener' };
	a.children = [
		{
			type: 'element',
			tagName: 'img',
			// shortcut: Google's favicon service is fetched on page view; download at build time if it ever breaks.
			properties: { src: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`, alt: '', width: 16, height: 16, loading: 'lazy', className: ['link-chip-icon'] },
			children: [],
		},
		...(a.children ?? []),
	];
}
