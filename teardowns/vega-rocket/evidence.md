# VEGA rocket teardown: evidence

Intended use: the animated inline figure at the top of `src/content/projects/vega-ksp.mdx`, rendered by `src/components/Teardown.astro` at the article column width (about 945 px, 640 px minimum with horizontal scroll). The animation plays the closed rocket, lifts the skins, then drops the aft half into a second row while the view zooms in.

Sources: the team's description of the bay order and contents (this session), the article text (about 8 m long, Cactus engine, 7.4 kN), and the photos `src/assets/articles/vega-ksp/full-rocket.jpg` and `cactus-engine.png`.

| Feature group | Evidence | Notes |
| --- | --- | --- |
| Bay order: nose tip, nose cone, parachute, Av-Rec, avionics, N2 tank, feed section, LOX tank, feed section, IPA tank, engine bay, engine | Supplied | LOX above IPA, as corrected by the author. |
| Overall length about 7.75 m | Supplied (about 8 m) | Bay lengths are estimates that sum to it. |
| Body diameter 198 mm, nose cone about 1.2 m | Estimated from photograph | Scaled from `full-rocket.jpg`. Tangent ogive is assumed. |
| Four fins, swept planform, about 330 mm span | Estimated from photograph | X configuration on the stringer lines is assumed. |
| Four stringers per bay, joining into four continuous stringers | Supplied | 10 mm square section is illustrative. |
| Skin panels over every bay | Supplied | One tube per bay with seams on the stringer lines. |
| Bay end rings, avionics sled | Hidden construction, illustrative | |
| Av-Rec: MDRMs, hand-sized N2 bottle, ejection solenoid | Supplied contents | MDRM count (4) and placement are illustrative. |
| Avionics: RevPi, relay, batteries, ground power link, USB hub, GPS, IMU | Supplied contents | RevPi size from its datasheet; the rest are illustrative sizes. In-bay cables are omitted because the parts tray cannot stretch them. |
| REDS Arduino in the avionics bay | Illustrative | Location not supplied. |
| Feed sections: motorized valve, solenoid valve, PT, REDS servo | Supplied contents | One of each per section is illustrative. |
| LOX run line past the IPA tank | Illustrative | Follows from LOX sitting above IPA. |
| Engine bay main valves, PTs, purge solenoid, REDS servo | Illustrative | |
| CAN + power harness and REDS line down the vehicle | Supplied (routing illustrative) | Two conductors along the front-top of every bay. |
| Cactus engine: injector, flange, chamber, nozzle | Estimated from photograph | Flange bolts are below reproduction size and omitted. |

## Rebuild and proof

Run from `teardowns/` with Node 22+ and Chrome:

```sh
npm install
node tools/teardown/scripts/proof.cjs vega-rocket/drawing.json proof/rocket --quick
node tools/teardown/scripts/proof.cjs vega-rocket/drawing.json proof/rocket --no-png
node frames.cjs vega-rocket/drawing.json ../src/data/teardowns ../public/teardowns
```

The bundled viewer page is not built for this drawing: its fitted scale assumes the assembled object fits inside the exploded one, which a rocket split into two rows does not.
