import { type CollectionEntry, getCollection } from 'astro:content';
import { readingTime } from './reading-time';

// A series is a folder under src/content/projects:
//   zero-to-riscv/index.mdx               -> /projects/zero-to-riscv (the landing page)
//   zero-to-riscv/single-cycle/index.mdx  -> a group (title + description, no page)
//   zero-to-riscv/single-cycle/data-memory.mdx -> a chapter
// Every folder needs an index.mdx, and siblings sort by `order`. A group's
// index.mdx only supplies its title and description; groups get no page.

type Project = CollectionEntry<'projects'>;

export interface SeriesNode {
	entry: Project;
	// "1", "1.2", "1.2.3"; empty for the series root.
	number: string;
	children: SeriesNode[];
}

const parentId = (id: string) => (id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : undefined);

export function seriesTree(all: Project[], rootId: string): SeriesNode {
	const build = (entry: Project, number: string): SeriesNode => ({
		entry,
		number,
		children: all
			.filter((e) => parentId(e.id) === entry.id)
			.sort((a, b) => a.data.order - b.data.order)
			.map((e, i) => build(e, number ? `${number}.${i + 1}` : `${i + 1}`)),
	});
	const root = all.find((e) => e.id === rootId);
	if (!root) throw new Error(`Series root "${rootId}" has no index.mdx`);
	return build(root, '');
}

// Reading order: the root, then depth-first through groups and chapters.
export const flatten = (node: SeriesNode): SeriesNode[] => [node, ...node.children.flatMap(flatten)];

export const isGroup = (node: SeriesNode) => node.number !== '' && node.children.length > 0;

export const depth = (node: SeriesNode) => (node.number ? node.number.split('.').length : 0);

// "6 parts · 25 min read" for a series, plain reading time for a single article.
export function seriesMeta(node: SeriesNode): string {
	const nodes = flatten(node);
	const time = readingTime(nodes.map((n) => n.entry.body ?? '').join(' '));
	const parts = nodes.filter((n) => n.children.length === 0).length;
	return node.children.length > 0 ? `${parts} parts · ${time}` : time;
}

// Top-level projects for the listings, newest first, with series collapsed into one card.
export async function topLevelProjects() {
	const all = await getCollection('projects');
	return all
		.filter((p) => !p.id.includes('/'))
		.map((p) => {
			const { description, date, image } = p.data;
			if (!description || !date || !image) throw new Error(`Project "${p.id}" needs a description, a date and an image`);
			return { ...p, data: { ...p.data, description, date, image }, meta: seriesMeta(seriesTree(all, p.id)) };
		})
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
