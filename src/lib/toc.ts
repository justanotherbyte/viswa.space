import type { MarkdownHeading } from 'astro';

// Posts don't agree on a top-level heading (some start at #, some at ##), so
// depth is taken relative to each post's shallowest heading, two levels deep.
// Returns an empty list for posts with no headings.
export function tocHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
	if (headings.length === 0) return [];
	const minDepth = Math.min(...headings.map((h) => h.depth));
	return headings.filter((h) => h.depth <= minDepth + 1);
}
