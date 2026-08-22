// @ts-check

import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	site: 'https://viswa.space',
	integrations: [mdx(), sitemap()],
	markdown: {
		// MDX inherits this processor too (extendMarkdownConfig defaults to true).
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		// Matches the original Next.js site: plain <pre><code class="language-x">
		// output, highlighted client-side by highlight.js (see the article layouts)
		// instead of Astro's built-in Shiki.
		syntaxHighlight: false,
	},
	vite: {
		plugins: [tailwindcss()]
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-jetbrains",
			weights: [400, 500, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['monospace'],
		}
	],
});
