import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			category: z.enum(['Projects', 'Industry', 'Non-technical']).optional(),
			// Unpublished posts stay reachable by direct link (with a WIP notice)
			// but are excluded from listings and the RSS feed.
			published: z.boolean().default(true),
		}),
});

const projects = defineCollection({
	// Load Markdown and MDX files in the `src/content/projects/` directory.
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			// Either a remote URL or a local file imported via the `image()`
			// helper — the latter gets run through Astro's optimization pipeline.
			image: z.union([z.string().url(), image()]),
			// object-position for the hero/card crop, when the focal point isn't centered.
			imagePosition: z.enum(['top', 'center', 'bottom']).default('center'),
			// In-progress projects stay reachable by direct link (with a WIP notice)
			// but are excluded from listings.
			inProgress: z.boolean().default(false),
		}),
});

const experience = defineCollection({
	// Load a single YAML file containing an array of experience entries.
	loader: file('./src/content/experience.yaml'),
	schema: z.object({
		id: z.string(),
		// Display order, ascending (1 = shown first). getCollection() doesn't
		// preserve YAML file order, so this makes it explicit.
		order: z.number(),
		position: z.string(),
		companyName: z.string(),
		companyLink: z.string().url(),
		companyIcon: z.string(),
		startedAt: z.string(),
		endedAt: z.string(),
		description: z.string(),
	}),
});

export const collections = { blog, projects, experience };
