# GSE software teardowns: evidence

Intended use: two animated inline figures in `src/content/projects/vega-ksp.mdx`, replacing the original diagrams `original-gse.svg` and `new-vega-gse.svg`. They render through `src/components/Teardown.astro` at the article column width (about 945 px, 640 px minimum with horizontal scroll).

These are concept drawings of software as stacked layers. Hardware is a grey base plate; each program is a coloured plate with a small detail that hints at what it does. None of the geometry is real.

Sources: the two original diagrams, the article text and the author's notes in this session.

| Feature group | Evidence | Notes |
| --- | --- | --- |
| Original: Ubuntu on the RevPi, Node-RED beside Docker, InfluxDB and Grafana inside Docker | Supplied (`original-gse.svg`) | Details: container ribs, wired node pills, a platter stack, and a chart with toggles. |
| Current: DAQ, main and DTM threads, last-value buffer, queue, Dash UI on the laptop | Supplied (article, `new-vega-gse.svg`) | Details: a thread wave, a single puck for the buffer, a row of items for the queue, and a chart with buttons. |
| Current: ZeroMQ telemetry and commands over CAT6 | Supplied | Arrows show direction. Socket patterns are not drawn. |
| Current: Python control loop with sensor polling, valve I/O and command relay | Supplied (`new-vega-gse.svg`); the author confirmed it is custom Python | Details: a gear, a gauge, a valve symbol and an antenna. |
| Plate sizes, layout and detail shapes | Illustrative | |

## Rebuild and proof

Run from `teardowns/` with Node 22+ and Chrome:

```sh
npm install
node tools/teardown/scripts/proof.cjs gse-software/drawing.json proof/gse --quick
node tools/teardown/scripts/proof.cjs gse-software/drawing.json proof/gse --no-png
node frames.cjs gse-software/drawing.json ../src/data/teardowns ../public/teardowns
```

`drawing.json` lists the parts the model renders, with their colours. Regenerate it whenever parts are added or renamed.
