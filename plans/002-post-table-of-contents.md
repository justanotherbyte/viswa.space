# 002 — Sidebar table of contents for blog and project posts

- **Status**: IMPLEMENTED (browser feel-check pending)
- **Severity**: MEDIUM
- **Category**: Navigation / Long-form readability
- **Implementation note**: the heading filter lives in `src/lib/toc.ts` (`tocHeadings()`) rather than inside the component, so pages can skip the sidebar column entirely when there's no TOC. The active-section highlight uses a rAF-throttled scroll check instead of `IntersectionObserver`, so it stays correct when scrolling back up.
- **Correction**: the plan originally missed `src/pages/publications/[slug].astro`, which is the route the site actually links blog posts to (`BlogCard` → `/publications/<slug>`). `/blog/<slug>` is the leftover starter route. The TOC was first added to the `/blog/` route and `BlogPost.astro` by mistake. That change was reverted, and the TOC now lives only on `/publications/` and `/projects/` pages. Steps 3–4 below describe the reverted change.
- **Estimated scope**: 1 new file + 3 edited files, ~120 lines (`src/components/TableOfContents.astro` (new), `src/pages/blog/[...slug].astro`, `src/layouts/BlogPost.astro`, `src/pages/projects/[slug].astro`)

## Problem

Long posts (`glms.md`, `vega-ksp.mdx`, `autumn-internship.md`) have no in-page navigation. Readers can't see how a post is structured or jump to a section.

## Key facts from the codebase

- **No new dependency or remark plugin is needed.** Astro's `render(entry)` already returns `headings: { depth, slug, text }[]` for `.md` and `.mdx` entries, and its markdown pipeline already adds `id`s to every heading (`rehype-collect-headings` in `@astrojs/markdown-remark`, which the custom `unified()` processor in `astro.config.mjs` still goes through). Headings inside code fences (e.g. `# .cargo/config.toml` in `building-rogue.md`) are not included.
- **Blog posts are `.md` and projects are `.mdx`**, and both work the same way through `render()`.
- **Top-level heading depth varies between posts.** Some start at `#` (`autumn-internship`, `first-term-imperial`, `vega-ksp`) and others at `##` (`glms`, `building-rogue`). The TOC should work out levels relative to each post's shallowest heading, not hard-code h2 or h3.
- **Some posts have too few headings for a TOC to help.** `stratus-sensor-board.md` has 0 and `fpga-itch-parser.mdx` has 1.
- **The two post types use different layouts:**
  - Projects: `src/pages/projects/[slug].astro` → `SiteLayout` (Tailwind, sticky `Navbar` at `top-0 z-40`, `max-w-screen-xl` container). The content column is currently full container width.
  - Blog: `src/pages/blog/[...slug].astro` → `src/layouts/BlogPost.astro` (the leftover Astro starter layout: its own `<html>`, non-sticky `Header`, and a scoped `.prose` column at `width: 720px`).
  - `src/pages/about.astro` also uses `BlogPost.astro`, so the TOC must be an **optional** prop there. About should render exactly as it does now.

## Target

A `TableOfContents.astro` component that:

1. Takes `headings: MarkdownHeading[]` (type from `astro`).
2. Sets `minDepth = Math.min(...depths)` and keeps headings with `depth <= minDepth + 1` (two levels: sections and sub-sections).
3. Renders nothing if the post has no headings. (Originally fewer than 2; lowered to 1 so posts with a single section like `fpga-itch-parser` still get a TOC.)
4. Outputs a `<nav aria-label="Table of contents">` with an `<ol>`. Each `<a href="#slug">` is indented by `depth - minDepth`.
5. **Desktop (`lg:` and up):** renders as a sticky right-hand sidebar (`sticky top-20`, `max-h-[calc(100vh-6rem)] overflow-y-auto`) beside the content column.
6. **Below `lg`:** renders as a collapsed `<details><summary>Contents</summary>…</details>` above the article body, so mobile users still get it without it taking over the screen. Use one component with two responsive wrappers, or render it twice with `hidden lg:block` / `lg:hidden`. Twice is simpler and fine at this size.
7. **Active-section highlight (progressive enhancement):** a small `<script>` in the component uses `IntersectionObserver` on the heading ids and toggles `aria-current="true"` plus a highlight class on the matching link. Without JS, the TOC is still a working list of anchor links.

Page layout on `lg+`: a two-column grid, `grid lg:grid-cols-[minmax(0,1fr)_14rem] gap-8`, with the article on the left and the TOC `<aside>` on the right. Keep the article's current max width so line lengths don't change.

Anchor offsets: the projects page has a sticky navbar, so jumped-to headings would hide under it. Give headings in the content wrapper a scroll margin, e.g. add `[&_:is(h1,h2,h3,h4)]:scroll-mt-20` to the existing arbitrary-variant class list. The blog layout's `Header` isn't sticky, but add the same offset there for consistency. `global.css` already sets `scroll-behavior: smooth`.

## Steps

1. **Create `src/components/TableOfContents.astro`.** Props: `{ headings: MarkdownHeading[] }`. Filter by relative depth (Target 2–3) and return early if fewer than 2 remain. Markup: Tailwind classes matching the site's zinc palette (`text-zinc-600 dark:text-zinc-400`, hover `text-zinc-900 dark:text-white`, active `text-blue-400` to match the existing link colour in project content). Font size `text-sm`. Add a "Contents" label. Include the `IntersectionObserver` script (Target 7), with `rootMargin` set so a heading counts as active once it passes just under the navbar (e.g. `"-80px 0px -70% 0px"`).
2. **Projects page (`src/pages/projects/[slug].astro`):**
   - Destructure `headings` alongside `Content`: `const { Content, headings } = await render(project);`
   - Wrap the existing hero, title and content block in the two-column grid, with the TOC `<aside class="hidden lg:block">` in the right column.
   - Put the mobile `<details>` variant just after the `<hr>`, before the content `div`.
   - Add the heading `scroll-mt` class to the content wrapper.
   - Decide whether the hero image spans both columns. Recommended: yes. Keep the hero and title full width above the grid and put only the body in the grid, so the TOC starts level with the first paragraph.
3. **Blog route (`src/pages/blog/[...slug].astro`):** `const { Content, headings } = await render(post);` and pass `headings={headings}` to `<BlogPost>`.
4. **`src/layouts/BlogPost.astro`:**
   - Widen `Props` to `CollectionEntry<"blog">["data"] & { headings?: MarkdownHeading[] }`.
   - Wrap `.prose` and a new `<aside>` in a grid container. Only add the second column when `headings` is passed, so `about.astro` is unaffected.
   - The `.prose` column stays `720px` and is centred. With the TOC, centre the whole grid (720px + gap + 14rem) instead.
   - Add the mobile `<details>` variant after the title block's `<hr>`.
   - Add `scroll-margin-top` for headings inside `.prose` in the scoped `<style>`.
5. Check that no heading text renders oddly in the TOC. For example, inline code or KaTeX in a heading would come through as raw text in `heading.text`. None of the current posts have this. If a future one does, it's acceptable for now.

## Boundaries

- Do NOT add `remark-toc`, `rehype-slug`, `rehype-autolink-headings`, or any other dependency. `render()` already provides everything.
- Do NOT change `astro.config.mjs` or the markdown processor.
- Do NOT change `about.astro`, and don't make its rendering depend on the TOC.
- Do NOT restyle the existing post typography or migrate `BlogPost.astro` to `SiteLayout`. That's worth doing separately (the two post types currently look different), but it's out of scope here.
- Do NOT edit post content to add or rename headings.

## Open questions

- **Depth:** two levels (proposed) or only top-level sections? `vega-ksp` has 3 `#` and 5 `##`, so both levels still fit comfortably.
- **Mobile:** collapsed `<details>` above the content (proposed), or hide the TOC completely below `lg`?
- **Side:** right (proposed, conventional for in-page TOCs) or left?

## Verification

- **Mechanical:** `astro dev --background`, then `astro dev status` and `astro dev logs` should show no errors. `npm run build` should succeed, since all post pages are static.
- **Per-page checks:**
  - `/projects/vega-ksp`: TOC shows 3 sections with nested sub-sections. Clicking "Pressure Transducers" scrolls there and the heading isn't hidden under the sticky navbar.
  - `/blog/glms`: top level is `##` (Exponential Family, Constructing GLMs) with `###` Bernoulli nested. This confirms relative-depth handling.
  - `/blog/stratus-sensor-board` and `/projects/fpga-itch-parser`: no TOC is rendered, and the layout is identical to before (no empty sidebar column).
  - `/about`: identical to before.
  - `/blog/building-rogue`: the TOC does **not** include `.cargo/config.toml` (a code-fence comment, not a heading).
- **Interaction:** scrolling updates the highlighted entry. Below `lg`, the `<details>` is collapsed by default and expands on tap. The sidebar scrolls on its own if the TOC is taller than the viewport.
- **Done when:** both post types show a working sticky sidebar TOC on desktop and a collapsible TOC on mobile, generated only from the post's own headings, with no new dependencies and no visual change to pages that have fewer than 2 headings.
