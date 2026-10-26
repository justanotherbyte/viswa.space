# VEGA avionics bay teardown: evidence

Intended use: the animated inline figure at the top of `src/content/projects/vega-ksp.mdx`, rendered by `src/components/Teardown.astro` at the article column width (about 945 px). Below 640 px it switches to numbered balloons and a key. The animation starts from the closed bay, unwraps the skin from the camera side round to the back until it disappears, and slides both bulkhead rings out along the axis. Nothing moves off the bay, so the figure is only as tall as the bay plus its labels.

Sources: the author's description of the bay (this session), the article text, the MRS CAN I/O module photo linked from the article, and the CSS Electronics CANmod.temp photo linked from the article.

| Feature group | Evidence | Notes |
| --- | --- | --- |
| Cylindrical bay, 198 mm diameter, 550 mm long | Supplied (cylindrical), sizes from the earlier rocket teardown | The diameter was scaled from `full-rocket.jpg`. The length is illustrative. |
| Skin, two bulkhead rings | Hidden construction, illustrative | The rocket's four stringers are left out so they don't cover the boards. |
| Mounting plate across the back of the bay | Illustrative | Gives every module one face toward the viewer. |
| DIN rail carrying the RevPi and the relay | Supplied | TS35 profile. Its length and height are illustrative. |
| RevPi Connect 5 | Supplied | 45 × 96 × 110.5 mm housing from the datasheet. The port layout is simplified. |
| Relay switching ground power and battery power | Supplied | Drawn as a DIN-rail changeover relay. Its size and terminals are illustrative. |
| Battery | Supplied in the earlier rocket teardown | Placement in this bay and size are illustrative. |
| USB hub, GPS and IMU, with USB from GPS and IMU into the hub and from the hub to the RevPi | Supplied | Sizes and cable routes are illustrative. |
| One CAN IO PLC (MRS 1.033) | Supplied, shape estimated from photograph | Mounting ears and side connector follow the photo. Size is estimated. |
| Shunt resistor board wired to the CAN IO PLC and to every PT | Supplied | 120 Ω shunts from the article. The count of four matches the PTs in the earlier rocket teardown and is illustrative. |
| One CANmod.temp for the thermocouples | Supplied, shape estimated from photograph | Flange plate and four thermocouple sockets follow the photo. Size is estimated. |
| Power leads: ground power and battery into the relay, relay out to the RevPi | Supplied (routing illustrative) | The ground lead leaves through the forward ring toward the umbilical. |
| PT and TC leads leaving through the aft ring | Supplied (routing illustrative) | |
| CAN wiring between the RevPi, CAN IO PLC and CANmod.temp | Omitted | Not described. Drawing it would cross every board. |
| REDS Arduino | Omitted | Not listed for this bay. |

## Rebuild and proof

Run from `teardowns/` with Node 22+ and Chrome:

```sh
npm install
node tools/teardown/scripts/proof.cjs avionics-bay/drawing.json proof/avionics --quick
node tools/teardown/scripts/proof.cjs avionics-bay/drawing.json proof/avionics
node frames.cjs avionics-bay/drawing.json ../src/data/teardowns ../public/teardowns
```

The full proof warns that the DIN rail shows 22% of its own linework. That's expected, because the RevPi and the relay clip over most of it. The bare stretch between the relay and the battery stays visible and carries the label.

The model draws its own labels in tiers below the plate (`annotate()` in `model.js`) rather than using the renderer's side columns. Those columns ran leaders across the whole row of boards.
