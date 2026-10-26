// VEGA's avionics bay lying on its side: x runs aft, z is up, the camera sits at
// -y and a little aft. Everything mounts on a plate across the back of the bay,
// facing the camera, so exploded the skin unwraps away from the camera, the end
// rings slide out and the boards stay put.
self.DrawingModels ??= {};
(() => {
  const camera = {azimuth: -72, elevation: 22, roll: 0};
  const G = () => TechnicalGeometry;
  const LENGTH = 550, SKIN = [97.5, 99], RING = [70, 97], PLATE = 60;

  // Smooth a cable through its control points (Catmull-Rom), then sweep a round section.
  const ROUND = Array.from({length: 12}, (_, i) => [Math.cos(i * Math.PI / 6), Math.sin(i * Math.PI / 6)]);
  function cable(p, points, r = 2) {
    const path = [], at = i => points[Math.max(0, Math.min(points.length - 1, i))];
    for (let i = 0; i < points.length - 1; i++) {
      const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      for (let s = 0; s < 8; s++) {
        const t = s / 8, t2 = t * t, t3 = t2 * t;
        path.push([0, 1, 2].map(k => .5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)));
      }
    }
    path.push(points.at(-1));
    G().sweep(p, path, ROUND.map(([u, v]) => [u * r, v * r]));
  }
  // A rounded port or plug outline on a face toward -y.
  const port = (p, [x0, z0, x1, z1], y) =>
    G().polyline(p, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], {closed: true, role: 'detail'});
  const disc = (p, center, r, normal) => G().circle(p, center, r, normal, {role: 'detail', segments: 24});

  function build(explosion, isolated) {
    const parts = [];
    const make = (id, name) => {
      const p = G().part(id, name);
      parts.push(p);
      return p;
    };

    // Skin: one tube over the whole bay. It splits along the side facing the camera
    // (angle π, toward -y) and unwraps both ways round to the back, where its last
    // strip vanishes behind the plate, so it never takes room on the page.
    const open = isolated === 'skin' ? 0 : Math.min(1, explosion / .7) * 2 * Math.PI;
    if (open < 2 * Math.PI - .05) {
      const skin = make('skin', 'Skin');
      G().lathe(skin, [[0, SKIN[0]], [LENGTH, SKIN[0]], [LENGTH, SKIN[1]], [0, SKIN[1]]], {segments: 72, start: Math.PI + open / 2, end: 3 * Math.PI - open / 2});
    }

    // A bulkhead ring at each end slides out along the axis; the mounting plate between them stays.
    for (const [id, x, out] of [['fwd-ring', 0, -70], ['aft-ring', LENGTH - 8, 70]]) {
      const ring = make(id, 'Bulkhead ring');
      G().lathe(ring, [[x, RING[0]], [x + 8, RING[0]], [x + 8, RING[1]], [x, RING[1]]], {segments: 72});
      ring.explosion = [out, 0, 0];
    }
    G().box(make('plate', 'Mounting plate'), [8, PLATE, -56], [LENGTH - 8, PLATE + 3, 56]);

    // DIN rail (TS35, 7.5 mm deep) along the plate, carrying the RevPi and the relay.
    const rail = make('din-rail', 'DIN rail');
    const hat = [[0, 12.5], [0, -12.5], [-6.5, -12.5], [-6.5, -17.5], [-7.5, -17.5], [-7.5, -11.5], [-1, -11.5], [-1, 11.5], [-7.5, 11.5], [-7.5, 17.5], [-6.5, 17.5], [-6.5, 12.5]];
    G().extrude(rail, hat.map(([y, z]) => [PLATE + y, z]), {depth: 125});
    G().transform(rail, {origin: [15, 0, 0], xAxis: [0, 1, 0], yAxis: [0, 0, 1], zAxis: [1, 0, 0]});
    const RAIL = PLATE - 7.5;

    // RevPi Connect 5: 45 wide, 96 tall, 110.5 deep from the rail.
    const revpi = make('revpi', 'RevPi Connect 5');
    const front = RAIL - 110.5;
    G().box(revpi, [25, front, -48], [70, RAIL, 48], {radius: 1.5});
    port(revpi, [31, 36, 64, 44], front - .1); // power and CAN terminals
    port(revpi, [31, 14, 45, 26], front - .1); // Ethernet
    port(revpi, [50, 14, 64, 26], front - .1);
    port(revpi, [31, -10, 39, 4], front - .1); // USB
    port(revpi, [42, -10, 50, 4], front - .1);
    G().line(revpi, [25, front - .1, -38], [70, front - .1, -38], 'detail');

    // Changeover relay on the rail: ground power or battery to the RevPi.
    const relay = make('relay', 'Power relay');
    const rFront = RAIL - 62;
    G().box(relay, [85, rFront, -40], [115, RAIL, 40], {radius: 1.5});
    for (const z of [-32, 32]) for (const x of [92, 100, 108]) disc(relay, [x, rFront - .1, z], 2.6, [0, -1, 0]);
    G().box(relay, [90, rFront - 4, -18], [110, rFront, 18]);

    // Battery pack across the upper half of the plate.
    const battery = make('battery', 'Battery');
    G().box(battery, [150, PLATE - 38, 12], [300, PLATE, 52], {radius: 3});
    G().line(battery, [150, PLATE - 38.1, 26], [300, PLATE - 38.1, 26], 'detail');

    // USB hub, IMU and GPS along the lower half.
    const hub = make('usb-hub', 'USB hub');
    G().box(hub, [150, PLATE - 18, -40], [200, PLATE, -22], {radius: 2});
    for (const x of [160, 172, 184]) port(hub, [x, -34, x + 8, -29], PLATE - 18.1);
    const imu = make('imu', 'IMU');
    G().box(imu, [215, PLATE - 12, -46], [243, PLATE, -16], {radius: 1});
    G().box(imu, [222, PLATE - 15, -38], [236, PLATE - 12, -24]);
    const gps = make('gps', 'GPS');
    G().box(gps, [258, PLATE - 8, -50], [298, PLATE, -12], {radius: 1});
    G().box(gps, [266, PLATE - 14, -43], [290, PLATE - 8, -19], {radius: 2}); // ceramic patch antenna

    // CAN IO PLC (MRS 1.033): potted box with mounting ears and a side connector.
    const canio = make('can-io', 'CAN IO PLC');
    G().box(canio, [315, PLATE - 32, -30], [370, PLATE, 30], {radius: 2});
    for (const [z0, z1, x] of [[30, 42, 325], [-42, -30, 360]]) {
      G().box(canio, [x - 8, PLATE - 3, z0], [x + 8, PLATE, z1]);
      disc(canio, [x, PLATE - 3.1, (z0 + z1) / 2], 2.5, [0, -1, 0]);
    }
    G().box(canio, [370, PLATE - 28, -20], [377, PLATE - 6, 20]);

    // Shunt board: one 120 Ω resistor per PT on standoffs, wired to the CAN IO connector.
    const shunt = make('shunt-board', 'Shunt resistor board');
    G().box(shunt, [393, PLATE - 12, -40], [451, PLATE - 10.4, 40]);
    for (const [x, z] of [[397, -36], [447, -36], [397, 36], [447, 36]]) {
      G().lathe(shunt, [[0, 0], [0, 2.5], [10.4, 2.5], [10.4, 0]], {axis: 'y', at: [x, PLATE - 10.4, z], segments: 24});
    }
    G().box(shunt, [395, PLATE - 22, -30], [405, PLATE - 12, 30]); // terminal block
    for (const z of [-21, -7, 7, 21]) {
      const y = PLATE - 14.5;
      G().lathe(shunt, [[0, 0], [0, 2.4], [14, 2.4], [14, 0]], {at: [419, y, z], segments: 24});
      G().line(shunt, [405, y, z], [419, y, z], 'detail');
      G().line(shunt, [433, y, z], [440, y, z], 'detail');
      for (const k of [3, 7, 11]) G().circle(shunt, [419 + k, y, z], 2.45, [1, 0, 0], {role: 'texture', segments: 24});
    }
    for (const z of [-15, -5, 5, 15]) G().polyline(shunt, [[395, PLATE - 17, z], [386, PLATE - 17, z * .8], [377, PLATE - 17, z * .8]]);

    // CANmod.temp: extruded case on a flange plate, thermocouple sockets facing aft.
    const canmod = make('canmod', 'CANmod.temp');
    G().box(canmod, [466, PLATE - 2, -38], [534, PLATE, 38]);
    G().box(canmod, [469, PLATE - 26, -30], [531, PLATE - 2, 30], {radius: 2});
    for (const z of [-21, -7, 7, 21]) G().box(canmod, [531, PLATE - 20, z - 4.5], [536, PLATE - 8, z + 4.5]);

    // Wiring the user described: USB from GPS and IMU into the hub and on to the
    // RevPi, and the relay switching ground power or the battery to the RevPi.
    const usb = make('usb-cables', 'USB cables');
    cable(usb, [[46, front, -3], [46, front - 8, -8], [48, front - 8, -54], [82, -40, -55], [130, 10, -48], [150, PLATE - 9, -31]]);
    cable(usb, [[200, PLATE - 9, -27], [208, PLATE - 14, -27], [215, PLATE - 6, -27]]);
    cable(usb, [[200, PLATE - 9, -36], [210, PLATE - 16, -50], [250, PLATE - 16, -53], [252, PLATE - 8, -40], [258, PLATE - 4, -40]]);
    const power = make('power-leads', 'Power leads');
    cable(power, [[92, rFront, 32], [92, rFront - 8, 38], [76, -50, 52], [60, front - 6, 42], [60, front, 40]], 2.5);
    cable(power, [[100, rFront, 32], [100, rFront - 8, 40], [85, -25, 60], [30, -25, 62], [-30, -25, 62]], 2.5); // ground power, out the forward end
    cable(power, [[108, rFront, 32], [112, rFront - 6, 38], [135, 15, 38], [150, PLATE - 20, 32]], 2.5);
    const sensors = make('sensor-leads', 'PT + TC leads');
    for (const z of [-21, -7, 7, 21]) cable(sensors, [[536, PLATE - 14, z], [552, PLATE - 14, z * 1.2], [580, PLATE - 14, z * 1.6]], 1.4);
    cable(sensors, [[400, PLATE - 22, -26], [404, 36, -48], [440, 30, -58], [540, 30, -58], [580, 30, -58]], 3);
    return parts;
  }

  // Labels: [text, part id, assembled anchor, optional hang]. They hang in tiers
  // below the plate, each leader dropping straight from its anchor.
  // The aft ring reaches down into those tiers, so the label beside it hangs inward.
  const LABELS = [
    ['GROUND + BATTERY POWER', 'power-leads', [-20, -25, 62]],
    ['REVPI CONNECT 5', 'revpi', [47, -58, -48]],
    ['POWER RELAY', 'relay', [100, -9.5, -40]],
    ['DIN RAIL', 'din-rail', [132, 52.5, -17.5]],
    ['USB CABLES', 'usb-cables', [110, -6, -50]],
    ['USB HUB', 'usb-hub', [175, 42, -40]],
    ['BATTERY', 'battery', [207, 22, 12]],
    ['IMU', 'imu', [229, 48, -46]],
    ['GPS', 'gps', [278, 52, -50]],
    ['CAN IO PLC', 'can-io', [342, 28, -30]],
    ['SHUNT BOARD', 'shunt-board', [422, 48, -40]],
    ['CANMOD.TEMP', 'canmod', [500, 34, -30]],
    ['PT + TC LEADS', 'sensor-leads', [560, 30, -58], ['left']],
    ['MOUNTING PLATE', 'plate', [300, 60, -56]],
  ];
  const SIZE = 3.8, CHAR = .6 * SIZE, TIER = 6.5, TIERS = 8, GAP_X = 3;

  // Each label sits centered under its anchor or hangs left or right from it, so
  // its leader always drops straight into its own text. A label goes one tier
  // deeper whenever it would overlap a label in that tier, its leader would cross
  // a shallower label, or it would cover a deeper label's leader. The result
  // depends on placement order, so several orders run and the shallowest wins.
  function place(order, modes) {
    const placed = [];
    const clash = (t, x0, x1, ax) => placed.some(p =>
      (p.t === t && x1 + GAP_X > p.x0 && x0 - GAP_X < p.x1)
      || (p.t < t && ax > p.x0 - 1 && ax < p.x1 + 1)
      || (p.t > t && p.at[0] > x0 - 1.5 && p.at[0] < x1 + 1.5));
    for (const item of order) {
      const ax = item.at[0], w = item.w;
      let best = null;
      for (const x0 of (item.modes ?? modes(item)).map(m => ({center: ax - w / 2, right: ax - 1, left: ax + 1 - w})[m])) {
        let t = 0;
        while (t < TIERS - 1 && clash(t, x0, x0 + w, ax)) t++;
        if (!best || t < best.t) best = {t, x0};
      }
      placed.push({...item, t: best.t, x0: best.x0, x1: best.x0 + w, cx: best.x0 + w / 2});
    }
    return placed;
  }
  function layout(items) {
    const half = Math.ceil(items.length / 2), reversed = [...items].reverse(), all = () => ['center', 'right', 'left'];
    const tries = [
      place(items, all), place(reversed, all),
      place(reversed, () => ['right']), place(items, () => ['left']),
      place([...items.slice(0, half), ...reversed.slice(0, items.length - half)], i => items.indexOf(i) < half ? ['left'] : ['right']),
    ];
    const score = p => Math.max(...p.map(l => l.t)) * 1000 + p.reduce((sum, l) => sum + l.t, 0);
    return tries.reduce((a, b) => (score(b) < score(a) ? b : a));
  }

  function annotate(result, shift) {
    const view = TechnicalProjection.createCamera(camera), f = n => n.toFixed(2);
    const paper = (id, p) => {
      const [x, y] = view.project(p.map((n, i) => n + shift(id)[i]));
      return [result.offset[0] + x * result.scale, result.offset[1] + y * result.scale];
    };
    // Paper y of the lowest point of the boards and leads, along the plate's bottom edge.
    let floor = -Infinity;
    for (let x = -30; x <= 580; x += 10) floor = Math.max(floor, paper('plate', [x, 25, -61])[1]);
    const label = ([ax, ay], reach, base, cx, text) => `<path data-line-role="detail" d="M${f(ax)} ${f(ay)}L${f(ax)} ${f(reach)}"/>`
      + `<circle data-ink-fill="" cx="${f(ax)}" cy="${f(ay)}" r=".55"/>`
      + `<text data-ink-fill="" data-annotation="" x="${f(cx)}" y="${f(base)}" font-size="${SIZE}" text-anchor="middle">${text}</text>`;
    const items = LABELS.map(([text, id, anchor, modes]) => ({text, modes, at: paper(id, anchor), w: text.length * CHAR})).sort((a, b) => a.at[0] - b.at[0]);
    let out = '';
    for (const {text, at, t, cx} of layout(items)) {
      const ty = floor + 8 + t * TIER;
      out += label(at, ty - 1.2, ty + SIZE * .8, cx, text);
    }
    return `<g data-annotations="">${out}</g>`;
  }

  self.DrawingModels['avionics-bay'] = (parameters, options) => {
    const parts = build(options.explosion, options.isolated), byId = new Map(parts.map(p => [p.id, p]));
    const result = TechnicalProjection.render(parts, {...options, annotate: false, camera});
    if (options.annotate && options.labels !== false && !options.isolated) {
      result.markup += annotate(result, id => (byId.get(id).explosion ?? [0, 0, 0]).map(n => n * options.explosion));
    }
    return result;
  };
})();
