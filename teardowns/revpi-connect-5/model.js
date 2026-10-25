// RevPi Connect 5 lying on its left side: x is depth (front bezel at +x),
// y is the 96 mm front-panel height, z is the 45 mm width pointing up.
self.DrawingModels ??= {};
(() => {
  const camera = {azimuth: -35, elevation: 30, roll: 0};
  const G = () => TechnicalGeometry;
  const rect = (y0, z0, y1, z1) => [[y0, z0], [y1, z0], [y1, z1], [y0, z1]];

  // Rectangle outline drawn on a front-facing (+x) face, in y/z.
  const mouth = (p, x, y0, z0, y1, z1) =>
    G().polyline(p, rect(y0, z0, y1, z1).map(([y, z]) => [x, y, z]), {closed: true, role: 'detail'});

  // U-shaped wall, open toward the bezel, with the DIN-housing notches at the back.
  const WALL = [[5, 0], [111.9, 0], [111.9, 2], [7, 2], [7, 8], [2, 8], [2, 88], [7, 88], [7, 94], [111.9, 94],
    [111.9, 96], [5, 96], [5, 90], [0, 90], [0, 6], [5, 6]];
  const FLOOR = [[6.95, 1.95], [111.9, 1.95], [111.9, 94.05], [6.95, 94.05], [6.95, 88.05], [1.95, 88.05], [1.95, 7.95], [6.95, 7.95]];

  function shell(id, name, z0, z1, floorAtTop) {
    const g = G(), p = g.part(id, name);
    const walls = g.piece();
    g.extrude(walls, WALL, {depth: z1 - z0});
    g.transform(walls, {origin: [0, 0, z0]});
    g.merge(p, walls);
    const floor = g.piece();
    g.extrude(floor, FLOOR, {depth: 2});
    g.transform(floor, {origin: [0, 0, floorAtTop ? z1 - 2 : z0]});
    g.merge(p, floor);
    return p;
  }

  // Terminal-block footprints on the front panel: [y0, z0, y1, z1].
  const X2 = [84, 24, 93.5, 42.5], X3 = [2.5, 2.5, 11, 22.5], X4 = [2.5, 24, 11, 42.5];

  function board() {
    const g = G(), p = g.part('board', 'Base board');
    g.extrude(p, [[8, 3], [111.5, 3], [111.5, 93], [8, 93], [8, 89], [3, 89], [3, 7], [8, 7]], {depth: 1.6});
    g.transform(p, {origin: [0, 0, 22.5]});
    const add = (min, max) => g.box(p, min, max);
    add([93, 50.5, 5], [114.5, 68, 33]); // dual RJ45, mid-mounted through the board
    mouth(p, 114.5, 52, 6.5, 64.5, 17.5);
    mouth(p, 114.5, 52, 20.5, 64.5, 31.5);
    add([97, 29, 5.5], [114.5, 43, 22.6]); // dual USB-A under the board
    mouth(p, 114.5, 30.5, 6.5, 41.5, 12.5);
    mouth(p, 114.5, 30.5, 15, 41.5, 21);
    add([103, 85.5, 7], [114.5, 91, 22.6]); // micro-HDMI
    mouth(p, 114.5, 86.5, 8.5, 90, 14.5);
    add([106, 16, 4.5], [114.5, 25, 8.5]); // USB-C on a riser
    add([106, 18, 8.5], [110, 23, 22.6]);
    mouth(p, 114.5, 17, 5.3, 24, 7.7);
    for (const [y0, z0, y1, z1] of [X2, X3, X4]) {
      add([100, y0, z0 < 22.5 ? z0 : 24], [112, y1, z0 < 22.5 ? 22.6 : z1]);
    }
    // Compute-module receptacles
    add([32, 29, 24.1], [72, 34, 26.5]);
    add([32, 62, 24.1], [72, 67, 26.5]);
    return p;
  }

  function computeModule() {
    const g = G(), p = g.part('cm5', 'Compute Module 5');
    const hole = (x, y) => Array.from({length: 24}, (_, i) => [x + 1.35 * Math.cos(i * Math.PI / 12), y + 1.35 * Math.sin(i * Math.PI / 12)]);
    g.extrude(p, g.roundedRectangle(55, 40, 1.5, {center: [54.5, 48]}), {
      depth: 1.2, holes: [hole(30.5, 31.5), hole(78.5, 31.5), hole(30.5, 64.5), hole(78.5, 64.5)],
    });
    g.transform(p, {origin: [0, 0, 26.5]});
    g.box(p, [42, 40, 27.6], [58, 56, 29.2]); // BCM2712 SoC
    g.box(p, [62, 42, 27.6], [74, 54, 28.7]); // LPDDR4
    g.box(p, [33, 44, 27.6], [40, 56, 28.6]); // eMMC
    g.box(p, [67, 57, 27.6], [78, 65, 28.8]); // wireless module can
    return p;
  }

  function heatSink() {
    const g = G(), p = g.part('heatsink', 'Heat sink');
    g.box(p, [39, 36, 29.2], [61, 60, 31.2]);
    for (let i = 0; i < 7; i++) g.box(p, [39, 36.4 + i * 3.7, 31.1], [61, 37.6 + i * 3.7, 41.5]);
    return p;
  }

  function bezel() {
    const g = G(), p = g.part('bezel', 'Front bezel');
    const grow = ([y0, z0, y1, z1], d = .4) => rect(y0 - d, z0 - d, y1 + d, z1 + d);
    g.extrude(p, rect(0, 0, 96, 45), {
      depth: 3,
      holes: [grow([50.5, 5, 68, 33]), grow([29, 5.5, 43, 22]), grow([85.5, 7, 91, 14.5]), grow([16, 4.5, 25, 8.5]),
        grow(X2), grow(X3), grow(X4)],
    });
    g.transform(p, {origin: [112, 0, 0], ...g.plane('yz')});
    // Status LED light pipes
    for (const z of [2, 43]) mouth(p, 115, 70, z - .7, 82, z + .7);
    const sma = g.piece();
    g.lathe(sma, [[0, 0], [0, 3.2], [2.5, 3.2], [2.5, 2.4], [8, 2.4], [8, 0]], {segments: 48});
    g.transform(sma, {origin: [115, 36, 33]});
    g.merge(p, sma);
    return p;
  }

  function plugs(id, name, blocks) {
    const g = G(), p = g.part(id, name);
    for (const [y0, z0, y1, z1] of blocks) {
      g.box(p, [112, y0 + .2, z0 + .2], [124, y1 - .2, z1 - .2]);
      const pitch = (z1 - z0) / 4;
      for (let i = 0; i < 4; i++) {
        g.circle(p, [124, (y0 + y1) / 2, z0 + pitch * (i + .5)], Math.min(1.7, pitch * .38), [1, 0, 0], {segments: 32, role: 'detail'});
      }
    }
    return p;
  }

  // Software plates. Assembled, they sit inside the closed housing above the
  // compute module; exploded, they rise out of it in their dependency order.
  const LEVEL_Z = [244, 274, 304];
  function plate(id, name, level, [x0, y0, x1, y1]) {
    const g = G(), p = g.part(id, name), z = 31 + level * 3;
    g.box(p, [x0, y0, z], [x1, y1, z + 2.5], {radius: 3});
    p.explosion = [0, 0, LEVEL_Z[level] - z];
    return p;
  }
  const FULL = [8, 10, 104, 86];

  const STACKS = {
    'revpi-original': () => [
      plate('os', 'Ubuntu Linux', 0, FULL),
      plate('docker', 'Docker engine', 1, [8, 10, 104, 52]),
      plate('nodered', 'Node-RED', 1, [8, 56, 104, 86]),
      plate('influxdb', 'InfluxDB', 2, [8, 10, 54, 52]),
      plate('grafana', 'Grafana', 2, [58, 10, 104, 52]),
    ],
    'revpi-current': () => [
      plate('os', 'Ubuntu Linux', 0, FULL),
      plate('gse', 'Python GSE service', 1, FULL),
      plate('zmq-telemetry', 'ZeroMQ telemetry out', 2, [8, 10, 104, 46]),
      plate('zmq-commands', 'ZeroMQ commands in', 2, [8, 50, 104, 86]),
    ],
  };

  function hardware() {
    const parts = [
      shell('shell-left', 'Housing, left half', 0, 22.5, false),
      board(),
      computeModule(),
      heatSink(),
      shell('shell-right', 'Housing, right half', 24.1, 45, true),
      bezel(),
      plugs('can-plugs', 'CAN plugs X2 X3', [X2, X3]),
      plugs('power-plug', 'Power plug X4', [X4]),
    ];
    const lift = {board: [0, 0, 38], cm5: [0, 0, 66], heatsink: [0, 0, 92], 'shell-right': [0, 0, 172],
      bezel: [80, 0, 0], 'can-plugs': [55, 0, 38], 'power-plug': [55, 0, 38]};
    for (const p of parts) p.explosion = lift[p.id] ?? [0, 0, 0];
    return parts;
  }

  for (const [id, software] of Object.entries(STACKS)) {
    self.DrawingModels[id] = (parameters, options) =>
      TechnicalProjection.render([...hardware(), ...software()], {...options, camera});
  }
})();
