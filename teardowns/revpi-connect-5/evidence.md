# RevPi Connect 5 teardown: evidence

Intended use: two animated inline figures in `src/content/projects/vega-ksp.mdx` (720 to 945 px wide, 640 px minimum with horizontal scroll) rendered by `src/components/Teardown.astro`, plus the interactive page at `public/teardowns/revpi-connect-5.html`.

Sources: the RevPi Connect 5 datasheet V1.3 (KUNBUS, https://revolutionpi.com/shop/en/mwdownloads/download/link/id/81) with its front and side product render, and the article's own GSE diagrams (`original-gse.svg`, `new-vega-gse.svg`).

| Feature group | Evidence | Notes |
| --- | --- | --- |
| Housing envelope, 96 × 45 × 115 mm | Supplied dimensions | Datasheet. Drawn lying on its left side. |
| Back DIN-housing notches | Estimated from photograph | Simplified to two 5 × 6 mm steps. |
| Two-shell split and orange front bezel | Estimated from photograph | Split at mid-width is assumed. |
| Front-panel connector positions (RJ45 ×2, USB-A ×2, USB-C, micro-HDMI, RP-SMA, X2/X3/X4 terminals, LED pipes) | Estimated from photograph | Scaled from the front render at about 7.2 px/mm. |
| Two CAN terminals X2 and X3 | Supplied | Variant 100420 (2 × CAN, no RS485), matching the article. |
| Base board, connector mounting, board-to-board receptacles | Hidden construction, illustrative | Real PCB layout unknown. |
| Compute Module 5 (55 × 40 mm, SoC, RAM, eMMC, wireless) | Illustrative | CM5 size is public; chip placement is invented. |
| Heat sink | Illustrative | Datasheet only states passive cooling with a heat sink. |
| Software plates | Concept | One plate per layer, stacked by dependency. Original stack from `original-gse.svg`; current stack from `new-vega-gse.svg` and the author (custom Python on the RevPi). |

## Rebuild and proof

Run from `teardowns/` (the shared tools live there) with Node 22+ and Chrome:

```sh
npm install
node tools/teardown/scripts/proof.cjs revpi-connect-5/drawing.json proof/revpi --quick
node tools/teardown/scripts/build-viewer.cjs revpi-connect-5/drawing.json dist/revpi.html
node tools/teardown/scripts/check-viewer.cjs dist/revpi.html check/
node frames.cjs revpi-connect-5/drawing.json ../src/data/teardowns ../public/teardowns
cp dist/revpi.html ../public/teardowns/revpi-connect-5.html
```
