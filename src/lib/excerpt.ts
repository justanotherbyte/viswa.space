// Block starts that aren't prose: imports, JSX, headings, quotes/callouts, tables, images, MDX expressions, lists, math.
const NOT_PROSE = /^(import\s|export\s|[<#>|{]|!\[|[-*+]\s|\d+\.\s|\$\$|---)/;

// The first prose paragraph of an article as plain text, cut at a word boundary
// with trailing punctuation removed so a "…" can follow it.
// shortcut: regexes cover the inline Markdown used here, parse with remark if an excerpt comes out wrong.
export function excerpt(body: string, max = 125): string {
	const text = (
		body
			.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1.*$/gm, '')
			.split(/\n\s*\n/)
			.map((block) => block.trim())
			.find((block) => block && !NOT_PROSE.test(block)) ?? ''
	)
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/(\*{1,3})(?=\S)(.+?)(?<=\S)\1/g, '$2')
		.replace(/`/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	const cut = text.length > max ? text.slice(0, max + 1).replace(/\s+\S*$/, '') : text;
	return cut.replace(/[\s.,:;(-]+$/, '');
}
