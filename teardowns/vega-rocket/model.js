// VEGA lying nose-left: x runs aft from the nose tip, z is up, the camera sits
// at -y. Exploded, the skins lift off, then the aft half (LOX tank to engine)
// drops and slides under the forward half, so the 7.75 m vehicle fits two rows.
self.DrawingModels ??= {};
(() => {
  const camera = {azimuth: -84, elevation: 20, roll: 0};
  const G = () => TechnicalGeometry;
  const SEG = 40, R = 99, RING = [86, 97], SKIN = [97.5, 99], TANK = 78, STRINGER = 89;
  const GAP = 150, ROW = -2550, TRAY = -300, LIFT = 550, LIFT_AFT = 820, FIN_OUT = 70;
  const DIAGONALS = [45, 135, 225, 315];
  const polar = (deg, r) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
  const clamp = x => Math.min(1, Math.max(0, x));
  const stage = (a, b) => t => {
    const x = clamp((t - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  const LIFT_STAGE = stage(0, .4), DROP = stage(.3, .65), SLIDE = stage(.5, 1);

  // Sections: [assembled x0, x1, slide shift along x, aft row?]
  const SECTIONS = {
    avrec: [1200, 1550, -GAP], avionics: [1550, 2100, 0], n2: [2100, 3100, GAP], chunkA: [3100, 3350, 2 * GAP],
    lox: [3350, 4950, -4350, true], chunkB: [4950, 5200, -4350 + GAP, true], ipa: [5200, 6800, -4350 + 2 * GAP, true],
    ebay: [6800, 7600, -4350 + 3 * GAP, true],
  };
  const SHIFTS = {tip: -1000, nose: -850, chute: -200, engine: -4350 + 3 * GAP + 500, ...Object.fromEntries(Object.entries(SECTIONS).map(([k, s]) => [k, s[2]]))};
  const AFT = new Set(['lox', 'chunkB', 'ipa', 'ebay', 'engine']);

  // Each part moves through staged components; `final` is where the explosion ends.
  const motion = (section, extra = []) => [
    {v: [SHIFTS[section], 0, 0], s: SLIDE},
    ...(AFT.has(section) ? [{v: [0, 0, ROW], s: DROP}] : []),
    ...extra,
  ];

  const parts = [], MOTION = new Map();
  function make(id, name, section, extra) {
    const p = G().part(id, name);
    MOTION.set(id, motion(section, extra));
    parts.push(p);
    return p;
  }
  const tube = (p, x0, x1, [r0, r1], at = [0, 0, 0]) =>
    G().lathe(p, [[0, r0], [x1 - x0, r0], [x1 - x0, r1], [0, r1]], {segments: SEG, at: [x0 + at[0], at[1], at[2]]});
  const capsule = (p, x0, x1, r, at = [0, 0, 0], axis = 'x') => {
    const dome = r / 2, n = 8, prof = [];
    for (let i = 0; i <= n; i++) prof.push([dome * (1 - Math.cos(i / n * Math.PI / 2)), r * Math.sin(i / n * Math.PI / 2)]);
    const len = x1 - x0, outline = [[0, 0], ...prof.slice(1), ...prof.slice(0, -1).reverse().map(([x, y]) => [len - x, y]), [len, 0]];
    G().lathe(p, outline, {segments: SEG, creaseAngle: 20, axis, at: axis === 'x' ? [x0 + at[0], at[1], at[2]] : at});
  };
  const rod = (p, from, axis, length, r) => G().lathe(p, [[0, r], [length, r], [length, 0], [0, 0]], {segments: 24, axis, at: from});

  function frame(section, name) {
    const [x0, x1] = SECTIONS[section], g = G(), p = make(section, name, section);
    tube(p, x0, x0 + 8, RING);
    tube(p, x1 - 8, x1, RING);
    for (const deg of DIAGONALS) {
      const [y, z] = polar(deg, STRINGER);
      g.box(p, [x0, y - 5, z - 5], [x1, y + 5, z + 5]);
    }
    return p;
  }
  function skin(section) {
    const [x0, x1] = SECTIONS[section], p = make(`${section}-skin`, 'Skin panels', section, [{v: [0, 0, AFT.has(section) ? LIFT_AFT : LIFT], s: LIFT_STAGE}]);
    tube(p, x0, x1, SKIN);
    for (const deg of DIAGONALS) {
      const [y, z] = polar(deg, SKIN[1] + .1);
      G().line(p, [x0, y, z], [x1, y, z], 'detail');
    }
  }
  const wires = (id, name, section, paths) => {
    const p = make(id, name, section);
    for (const path of paths) G().polyline(p, path);
    return p;
  };
  // CAN + power trunk along the front-top of every bay, two conductors.
  const TRUNK = [[-70, 40], [-70, 47]], REDS = [-70, -40];
  const trunk = (x0, x1) => TRUNK.map(([y, z]) => [[x0, y, z], [x1, y, z]]);

  // Nose: tangent ogive from the tip (x 0) to the 99 mm base at x 1200.
  const rho = (R * R + 1200 * 1200) / (2 * R), ogive = x => Math.sqrt(rho * rho - (1200 - x) ** 2) + R - rho;
  {
    const tip = make('tip', 'Nose cone tip', 'tip'), samples = [];
    for (let i = 0; i <= 10; i++) samples.push([15 * i, Math.max(0, ogive(15 * i))]);
    G().lathe(tip, [...samples, [150, 0]], {segments: SEG, creaseAngle: 20});
    const nose = make('nose', 'Nose cone', 'nose'), outer = [], inner = [];
    for (let i = 0; i <= 30; i++) {
      const x = 150 + 35 * i;
      outer.push([x, ogive(x)]);
      inner.unshift([x, ogive(x) - 3]);
    }
    G().lathe(nose, [...outer, ...inner], {segments: SEG, creaseAngle: 20});
    const chute = make('chute', 'Parachute', 'chute');
    capsule(chute, 700, 1100, 65);
  }

  // Av-Rec bay: forward bulkhead, MDRM latches, N2 ejection bottle and solenoid.
  {
    const f = frame('avrec', 'Av-Rec bay');
    tube(f, 1200, 1206, [0, RING[0]]);
    skin('avrec');
    const mdrm = make('mdrm', 'MDRMs', 'avrec');
    for (const deg of [0, 90, 180, 270]) {
      const [y, z] = polar(deg, 72);
      const half = deg % 180 ? [11, 12] : [12, 11];
      G().box(mdrm, [1206, y - half[0], z - half[1]], [1246, y + half[0], z + half[1]]);
    }
    const bottle = make('n2-bottle', 'N2 ejection bottle', 'avrec');
    capsule(bottle, 1330, 1490, 30, [0, 0, -25]);
    rod(bottle, [1206, 0, -25], 'x', 64, 4);
    rod(bottle, [1310, 0, -25], 'x', 20, 4);
    const sol = make('avrec-sol', 'Ejection solenoid', 'avrec');
    G().box(sol, [1270, -18, -45], [1310, 18, -5]);
    rod(sol, [1290, 0, -5], 'z', 28, 11);
    wires('avrec-harness', 'Solenoid signal', 'avrec', [[[1550, -70, 40], [1290, -70, 40], [1290, -8, 23]]]);
  }

  // Avionics bay: sled carrying the RevPi, power switching and sensors.
  {
    const f = frame('avionics', 'Avionics bay');
    G().box(f, [1570, -78, -34], [2080, 78, -30]);
    skin('avionics');
    // Exploded, the boards drop out under the bay and spread along x to trayX,
    // so the cluster can carry a label each. In-bay cables are left out because
    // they cannot stretch to follow.
    const box = (id, name, min, max, trayX) => {
      const center = [0, 1, 2].map(i => (min[i] + max[i]) / 2);
      const p = make(id, name, 'avionics', [{v: [trayX - center[0], -center[1], TRAY], s: SLIDE}]);
      G().box(p, min, max);
      return p;
    };
    const revpi = box('revpi', 'RevPi Connect 5', [1590, -22, -30], [1705, 23, 66], 1650);
    G().polyline(revpi, [[1695, -22.1, -30], [1695, -22.1, 66]], {role: 'detail'});
    box('usb-hub', 'USB hub', [1730, -66, -30], [1790, -34, -16], 1900);
    box('relay', 'Power relay', [1730, 25, -30], [1780, 65, -2], 2150);
    box('imu', 'IMU', [1955, 20, -30], [1985, 50, -10], 2400);
    const gps = box('gps', 'GPS', [1995, 18, -30], [2045, 62, -18], 2650);
    G().box(gps, [2005, 25, -18], [2035, 55, -14]);
    const bat = box('battery', 'Batteries', [1810, -72, -30], [1950, -12, 18], 2920);
    G().line(bat, [1880, -72.1, -30], [1880, -72.1, 18], 'detail');
    box('reds-arduino', 'REDS Arduino', [1975, -62, -30], [2045, -8, -18], 3220);
    const link = make('ground-link', 'Ground power link', 'avionics');
    G().lathe(link, [[0, 0], [0, 16], [4, 16], [4, 12], [43, 12], [43, 0]], {segments: 32, axis: 'y', at: [2040, -103, 0]});
    wires('av-harness', 'CAN + power harness', 'avionics', [
      ...TRUNK.map(([y, z]) => [[1705, -22, z], [1720, y, z], [2100, y, z]]),
      [[2010, -35, -18], [2060, REDS[0], REDS[1]], [2100, ...REDS]],
    ]);
  }

  // A feed section between tanks: motorized valve, vent solenoid, PT and REDS servo.
  function feed(section, name, x, pipe) {
    const f = frame(section, name);
    skin(section);
    pipe(f);
    const mv = make(`${section}-mv`, 'Motorized valve', section);
    G().box(mv, [x, -20, -20], [x + 40, 20, 20]);
    G().box(mv, [x - 10, -22, 20], [x + 50, 22, 55]);
    const sv = make(`${section}-sv`, 'Solenoid valve', section);
    G().box(sv, [x + 75, -50, -15], [x + 105, -20, 15]);
    rod(sv, [x + 90, -70, 0], 'y', 20, 11);
    rod(sv, [x + 90, -20, 0], 'y', 12, 5);
    const pt = make(`${section}-pt`, 'Pressure transducer', section);
    rod(pt, [x + 130, 0, 9], 'z', 50, 8);
    const servo = make(`${section}-servo`, 'REDS servo', section);
    G().box(servo, [x + 60, -60, -55], [x + 100, -40, -20]);
    G().line(servo, [x + 80, -60.1, -25], [x + 100, -60.1, -10], 'detail');
    wires(`${section}-harness`, 'CAN + power harness', section, [
      ...trunk(...SECTIONS[section].slice(0, 2)),
      ...TRUNK.map(([y, z]) => [[x + 20, y, z], [x + 20, -22, z + 8]]),
      [[x + 90, -70, 40], [x + 90, -70, 11]],
      [[x + 130, -70, 47], [x + 130, -8, 59]],
      [[SECTIONS[section][0], ...REDS], [SECTIONS[section][1], ...REDS]],
      [[x + 80, -70, -40], [x + 80, -60, -30]],
    ]);
  }
  const passBay = (section, name, tankId, tankName, tankX) => {
    frame(section, name);
    skin(section);
    capsule(make(tankId, tankName, section), tankX[0], tankX[1], TANK);
    wires(`${section}-harness`, 'CAN + power harness', section, [...trunk(...SECTIONS[section].slice(0, 2)), [[SECTIONS[section][0], ...REDS], [SECTIONS[section][1], ...REDS]]]);
  };

  passBay('n2', 'N2 tank bay', 'n2-tank', 'N2 tank', [2120, 3080]);
  feed('chunkA', 'Feed section', 3150, f => rod(f, [3080, 0, 0], 'x', 290, 9));
  passBay('lox', 'LOX tank bay', 'lox-tank', 'LOX tank', [3370, 4930]);
  // LOX leaves the tank on the axis, then steps out to run past the IPA tank.
  feed('chunkB', 'Feed section', 4980, f => {
    rod(f, [4930, 0, 0], 'x', 210, 8);
    G().sweep(f, [[5130, 0, 0], [5150, -10, 0], [5170, -60, 0], [5190, -84, 0], [5200, -88, 0]], Array.from({length: 12}, (_, i) => polar(i * 30, 8)));
  });
  passBay('ipa', 'IPA tank bay', 'ipa-tank', 'IPA tank', [5220, 6780]);
  rod(make('lox-run', 'LOX run line', 'ipa'), [5200, -88, 0], 'x', 1600, 8);

  // Engine bay: both main valves, PTs, a purge solenoid and the fins.
  {
    const f = frame('ebay', 'Engine bay');
    skin('ebay');
    rod(f, [6780, 0, 0], 'x', 520, 9);
    G().sweep(f, [[6800, -88, 0], [6880, -88, 0], [6920, -70, 0], [6950, -50, 0], [7300, -50, 0]], Array.from({length: 12}, (_, i) => polar(i * 30, 8)));
    const mv = make('ebay-mv', 'Main valves', 'ebay');
    G().box(mv, [6930, -20, -20], [6970, 20, 20]);
    G().box(mv, [6920, -22, 20], [6980, 22, 55]);
    G().box(mv, [7030, -70, -20], [7070, -30, 20]);
    G().box(mv, [7020, -72, 20], [7080, -28, 52]);
    const pt = make('ebay-pt', 'Pressure transducers', 'ebay');
    rod(pt, [7150, 0, 9], 'z', 50, 8);
    rod(pt, [7200, -50, 8], 'z', 45, 8);
    const sv = make('ebay-sv', 'Purge solenoid', 'ebay');
    G().box(sv, [7100, -45, -50], [7130, -15, -20]);
    rod(sv, [7115, -30, -20], 'z', 12, 9);
    const servo = make('ebay-servo', 'REDS servo', 'ebay');
    G().box(servo, [6850, -60, -55], [6890, -40, -20]);
    wires('ebay-harness', 'CAN + power harness', 'ebay', [
      ...trunk(6800, 7250),
      ...TRUNK.map(([y, z]) => [[6950, y, z], [6950, -22, z + 8]]),
      ...TRUNK.map(([y, z]) => [[7050, y, z], [7050, -60, 52]]),
      [[7150, -70, 47], [7150, -8, 59]], [[7200, -70, 47], [7200, -58, 53]],
      [[6800, ...REDS], [6870, ...REDS], [6870, -60, -30]],
    ]);
    DIAGONALS.forEach((deg, i) => {
      const [cy, cz] = polar(deg, 1), fin = make(`fin-${i + 1}`, 'Fins', 'ebay', [{v: [0, cy * FIN_OUT, cz * FIN_OUT], s: LIFT_STAGE}]);
      const at = (x, s) => [x, cy * (R + s), cz * (R + s)];
      fin.vertices.push(at(6860, 0), at(7590, 0), at(7590, 330), at(7300, 330));
      fin.triangles.push([0, 1, 2], [0, 2, 3]);
    });
  }

  // Cactus: injector, flange, chamber and bell. Flange bolts are below reproduction size.
  {
    const e = make('engine', 'Cactus engine', 'engine'), wall = [[7335, 55], [7520, 55]];
    for (let i = 1; i <= 6; i++) wall.push([7520 + 80 * i / 6, 24 + 31 * (1 + Math.cos(i / 6 * Math.PI)) / 2]);
    for (let i = 1; i <= 8; i++) wall.push([7600 + 150 * i / 8, 24 + 38 * Math.sqrt(i / 8)]);
    const prof = [[7300, 0], [7300, 78], [7320, 78], [7320, 72], [7335, 72], ...wall, ...wall.slice().reverse().map(([x, r]) => [x, r - 2.5]), [7335, 0]];
    G().lathe(e, prof.map(([x, r]) => [x - 7300, r]), {segments: SEG, creaseAngle: 25, at: [7300, 0, 0]});
  }

  // Labels: [text, part id, assembled anchor, lane]. Lanes: 'above' the forward
  // row, 'mid' below it, 'below' the aft row.
  const LABELS = [
    ['SKIN PANELS', 'avionics-skin', [1800, 0, 99], 'above'],
    ['NOSE CONE TIP', 'tip', [90, -10, -10], 'mid'],
    ['NOSE CONE', 'nose', [650, -55, -55], 'mid'],
    ['PARACHUTE', 'chute', [900, -46, -46], 'mid'],
    ['MDRMS', 'mdrm', [1226, -84, 0], 'mid'],
    ['EJECTION SOLENOID', 'avrec-sol', [1290, -18, -30], 'mid'],
    ['N2 BOTTLE', 'n2-bottle', [1420, -21, -46], 'mid'],
    ['REVPI', 'revpi', [1650, -22, 10], 'mid'],
    ['USB HUB', 'usb-hub', [1760, -66, -23], 'mid'],
    ['RELAY', 'relay', [1755, 25, -16], 'mid'],
    ['IMU', 'imu', [1970, 20, -20], 'mid'],
    ['BATTERIES', 'battery', [1900, -72, -6], 'mid'],
    ['GPS', 'gps', [2020, 18, -24], 'mid'],
    ['REDS ARDUINO', 'reds-arduino', [2010, -62, -24], 'mid'],
    ['GROUND POWER LINK', 'ground-link', [2040, -103, 0], 'mid'],
    ['N2 TANK', 'n2-tank', [2650, -55, -55], 'mid'],
    ['FEED SECTION', 'chunkA', [3250, -7, -7], 'mid'],
    ['CAN + POWER HARNESS', 'lox-harness', [3700, -70, 47], 'below'],
    ['LOX TANK', 'lox-tank', [4150, -55, -55], 'below'],
    ['STRINGERS', 'lox', [4600, -62.9, -67.9], 'below'],
    ['MOTORIZED VALVE', 'chunkB-mv', [5000, -22, 40], 'below'],
    ['PRESSURE TRANSDUCER', 'chunkB-pt', [5110, -8, 45], 'below'],
    ['IPA TANK', 'ipa-tank', [5800, -55, -55], 'below'],
    ['LOX RUN LINE', 'lox-run', [6400, -88, -8], 'below'],
    ['REDS SERVO', 'ebay-servo', [6870, -60, -40], 'below'],
    ['MAIN VALVES', 'ebay-mv', [7050, -70, 0], 'below'],
    ['SOLENOID VALVE', 'ebay-sv', [7115, -45, -35], 'below'],
    ['FINS ×4', 'fin-3', [7400, ...polar(225, 280)], 'below'],
    ['CACTUS ENGINE', 'engine', [7700, -40, -40], 'below'],
  ];
  const SIZE = 3.4, CHAR = .6 * SIZE, TIER = 6, TIERS = 8, GAP_X = 3;

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
      for (const x0 of modes(item).map(m => ({center: ax - w / 2, right: ax - 1, left: ax + 1 - w})[m])) {
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

  function annotate(result, final, view) {
    const paper = p => {
      const [x, y] = view.project(p);
      return [result.offset[0] + x * result.scale, result.offset[1] + y * result.scale];
    };
    // Paper y of a row's lowest silhouette, and of its skins' highest.
    const extent = (x0, x1, z, r, pick) => {
      let v = pick === 'max' ? -Infinity : Infinity;
      for (const x of [x0, x1]) for (let a = 0; a < 360; a += 15) {
        const [y, zz] = polar(a, r), py = paper([x, y, z + zz])[1];
        v = pick === 'max' ? Math.max(v, py) : Math.min(v, py);
      }
      return v;
    };
    const lanes = {
      above: {y: extent(-1000, 3650, LIFT, R, 'min') - 6, dir: -1},
      mid: {y: Math.max(extent(-1000, 3650, 0, R, 'max'), ...[1550, 3300].map(x => paper([x, -80, TRAY - 35])[1])) + 8, dir: 1},
      below: {y: extent(-1000, 4350, ROW, R + 330 * Math.SQRT1_2 + FIN_OUT, 'max') + 8, dir: 1},
    };
    let out = '';
    for (const [name, lane] of Object.entries(lanes)) {
      const items = LABELS.filter(l => l[3] === name).map(([text, id, anchor]) => {
        const at = paper(anchor.map((n, i) => n + final(id)[i]));
        return {text, at, w: text.length * CHAR};
      }).sort((a, b) => a.at[0] - b.at[0]);
      for (const {text, at: [ax, ay], t, cx} of layout(items)) {
        // ty is the text edge facing the drawing; base is the baseline.
        const ty = lane.y + lane.dir * t * TIER, base = lane.dir > 0 ? ty + SIZE * .8 : ty;
        const reach = lane.dir > 0 ? ty - 1.2 : ty + 1.2, f = n => n.toFixed(2);
        out += `<path data-line-role="detail" d="M${f(ax)} ${f(ay)}L${f(ax)} ${f(reach)}"/>`
          + `<circle data-ink-fill="" cx="${f(ax)}" cy="${f(ay)}" r=".55"/>`
          + `<text data-ink-fill="" data-annotation="" x="${f(cx)}" y="${f(base)}" font-size="${SIZE}" text-anchor="middle">${text}</text>`;
      }
    }
    return `<g data-annotations="">${out}</g>`;
  }

  self.DrawingModels['vega-rocket'] = (parameters, options) => {
    const t = Math.min(1, options.explosion);
    const built = parts.map(p => structuredClone(p));
    const finals = new Map();
    for (const p of built) {
      const moves = MOTION.get(p.id);
      const now = [0, 1, 2].map(i => moves.reduce((sum, m) => sum + m.v[i] * m.s(t), 0));
      const end = [0, 1, 2].map(i => moves.reduce((sum, m) => sum + m.v[i], 0));
      finals.set(p.id, end);
      G().transform(p, {origin: now});
      // Render places parts at `now`; the fit scene adds the rest of the way to `end`.
      p.explosion = end.map((n, i) => n - now[i]);
    }
    const isolated = options.isolated, shown = isolated ? built.filter(p => p.id === isolated) : built;
    // An unseen box around every pose fixes the page scale, so a part that only
    // translates inks the same relative path in every frame; the page zooms instead.
    const ghost = G().part('ghost', 'ghost');
    const [xs, ys, zs] = [[-1100, 7800], [-460, 460], [ROW - 480, LIFT + 120]];
    for (const x of xs) for (const y of ys) G().polyline(ghost, zs.map(z => [x, y, z]));
    if (!isolated) shown.push(ghost);
    const result = TechnicalProjection.render(shown, {explosion: 0, fitExplosion: 1, fill: options.fill, camera});
    result.markup = result.markup.replace(/<g id="[^"]*" data-item="ghost"[\s\S]*?<\/g>/, '');
    if (options.annotate && options.labels !== false && t === 1 && !isolated) {
      result.markup += annotate(result, id => finals.get(id), TechnicalProjection.createCamera(camera));
    }
    return result;
  };
})();
