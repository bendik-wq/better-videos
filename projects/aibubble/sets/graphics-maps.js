// AI-bubble bright maps and the deal map (episode 8). Maps keep the "Reconstructed" look: white / pale-grey relief land
// on a pale blue-grey sea, the highlighted region extruded in red, red teardrop pins with a white dot, red dashed route
// arcs that draw on. Real coastlines and borders: Natural Earth 1:50m (public domain).
//   map      params.mode: 'us' (default pins Pike County OH, Abilene TX, Louisiana; Ohio raised) | 'world' (New York,
//            Seoul, Tokyo, Hsinchu; South Korea raised; route New York -> Seoul)
//            params: pins [{ name, lon, lat, sub, word, side: 'l'|'r', dy }] (a name matching a known pin inherits its
//            fields), routes [[fromName, toName, word?]], hl (ISO3 codes, or 'US-OH' style state codes in 'us'), hlAt,
//            title, kicker, source, at (first pin), cam
//   dealmap  a flat network diagram of the circle: company nodes on a ring, arrows drawing on one by one with amount
//            labels (RESEARCH §2a), cued by steps [{ from, to, label, sub, kind, word }] or edge ids ('C3'); ends with the
//            loop traced in red. params: steps, nodes, loopAt, loop (false: no loop), title, kicker, source
// Geography: projects/aibubble/assets/geo/world.json (copy of the silver build; assets/geo/build.py rebuilds it).
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;
let GEO = null;
const geo = () => GEO ??= fetch('/projects/aibubble/assets/geo/world.json').then(r => r.json());

// the "Reconstructed" map palette (pale relief land, blue-grey sea, red for the subject)
const MP = {
  seaTop: '#e9eef2', seaBot: '#d2dbe3', grat: 'rgba(70,95,120,0.07)',
  land: '#fdfdfc', land2: '#eef0f2', side: '#c3cbd3', edge: 'rgba(70,88,108,0.55)', border: 'rgba(90,106,124,0.32)',
  far: '#f1f3f4', far2: '#e4e8eb', lake: '#dbe3ea',
  red: P.red, redTop: '#ec3b30', redSide: '#9c150d', redEdge: 'rgba(255,255,255,0.7)',
};

// every pin a map can name (a pin given by name only inherits these fields); the modes list which ones show by default
const KNOWN = [
  { name: 'Pike County, Ohio', lon: -83.0, lat: 39.0, sub: 'OPENAI’S LEASES · NVIDIA GUARANTEE · 4.25 GW', side: 'r', dy: -20 },
  { name: 'Abilene, Texas', lon: -99.73, lat: 32.45, sub: 'ORACLE · OPENAI DATA CENTRE', side: 'l' },
  { name: 'Louisiana', lon: -91.5, lat: 32.5, sub: 'META “HYPERION” · ~$27B · OFF BALANCE SHEET', side: 'r', dy: 30 },
  { name: 'El Paso', lon: -106.49, lat: 31.76, sub: 'META’S SECOND JV · JUL 2026', side: 'l' },
  { name: 'New York', lon: -74.0, lat: 40.71, sub: 'NASDAQ −4.5% IN A WEEK · 16 OCT', side: 'r' },
  { name: 'Seoul', lon: 126.98, lat: 37.57, sub: 'KOSPI −7.6% · CIRCUIT BREAKER', side: 'l', dy: -46 },
  { name: 'Tokyo', lon: 139.69, lat: 35.69, sub: 'NIKKEI −4.9%', side: 'l', dy: 34 },
  { name: 'Taiwan', lon: 120.97, lat: 24.8, sub: 'TSMC: A CAUTIOUS 2027 OUTLOOK', side: 'l', dy: 30 },
];
const pinOf = (n) => KNOWN.find(p => p.name === n);
const MAPS = {
  us: {
    data: 'us', box: [-124.6, 24.3, -66.8, 49.4], rect: [40, 220, 1840, 820], hl: ['US-OH'],
    pins: ['Pike County, Ohio', 'Abilene, Texas', 'Louisiana'].map(pinOf),
    routes: [],
    kicker: 'UNITED STATES · DATA-CENTRE SITES IN THIS STORY', title: 'Where the money is being poured',
    src: 'SOURCES: NVIDIA 8-K (17 AUG 2026); META 10-Q (2026); BLOOMBERG VIA REPORTS (MAR 2026) · MAP: NATURAL EARTH',
  },
  world: {
    data: 'world', box: [-128, -4, 148, 64], rect: [40, 240, 1840, 790], hl: ['KOR'],
    pins: ['New York', 'Seoul', 'Tokyo', 'Taiwan'].map(pinOf),
    routes: [['New York', 'Seoul']],
    kicker: '14 – 16 OCT 2026 · THE SELLOFF GOES GLOBAL', title: 'From New York to Seoul',
    src: 'SOURCES: AP (16 OCT 2026); CNN (15 OCT 2026); REUTERS (14–15 OCT 2026) · MAP: NATURAL EARTH',
  },
};

export default function makeMaps(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- projection and paths
  function proj(box, rect) {
    const [w, s, e, n] = box, kx = Math.cos(((s + n) / 2) * Math.PI / 180);
    const sc = Math.min(rect[2] / ((e - w) * kx), rect[3] / (n - s));
    const cx = (w + e) / 2, cy = (s + n) / 2;
    return { X: (lon) => rect[0] + rect[2] / 2 + (lon - cx) * kx * sc, Y: (lat) => rect[1] + rect[3] / 2 - (lat - cy) * sc, sc, kx };
  }
  function pathOf(rings, pr, box) {
    const path = new Path2D(), mx = (box[2] - box[0]) * 0.35, my = (box[3] - box[1]) * 0.35;
    for (const r of rings) {
      let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9; for (let i = 0; i < r.length; i += 2) { if (r[i] < lo0) lo0 = r[i]; if (r[i] > lo1) lo1 = r[i]; if (r[i + 1] < la0) la0 = r[i + 1]; if (r[i + 1] > la1) la1 = r[i + 1]; }
      if (lo1 < box[0] - mx || lo0 > box[2] + mx || la1 < box[1] - my || la0 > box[3] + my) continue;
      path.moveTo(pr.X(r[0]), pr.Y(r[1])); for (let i = 2; i < r.length; i += 2) path.lineTo(pr.X(r[i]), pr.Y(r[i + 1])); path.closePath();
    }
    return path;
  }
  // relief land: a thin extruded side, a pale top, an inner shade along every coast, faint seeded "terrain" blotches
  function reliefLand(c, path, { top = MP.land, top2 = MP.land2, side = MP.side, ext = 5, seed = 7, relief = 1 } = {}) {
    c.save(); G.shadow(c, 0.7, 0.8); c.translate(0, ext); c.fillStyle = side; c.fill(path); G.noShadow(c); c.restore();
    for (let i = ext - 1; i > 0; i--) { c.save(); c.translate(0, i); c.fillStyle = side; c.fill(path); c.restore(); }
    c.save(); const gr = c.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, top); gr.addColorStop(1, top2); c.fillStyle = gr; c.fill(path); c.clip(path);
    // terrain: soft seeded blotches (pure function of the seed)
    const r = rng(seed); for (let i = 0; i < 70 * relief; i++) { const x = r() * 1920, y = r() * 1080, rad = 30 + r() * 140, a = 0.025 + r() * 0.045; const bg = c.createRadialGradient(x, y, 0, x, y, rad); bg.addColorStop(0, `rgba(120,135,150,${a})`); bg.addColorStop(1, 'rgba(120,135,150,0)'); c.fillStyle = bg; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    // inner shade along the coast (inset shadow): a big rect with the land as a hole, its shadow falls inside
    c.shadowColor = 'rgba(55,75,98,0.28)'; c.shadowBlur = 16 * G_S; c.shadowOffsetX = 3 * G_S; c.shadowOffsetY = 5 * G_S;
    const hole = new Path2D(); hole.rect(-400, -400, 2720, 1880); hole.addPath(path); c.fillStyle = '#000'; c.fill(hole, 'evenodd');
    c.restore();
  }
  let G_S = 1;
  function sea(c, pr) {
    const gr = c.createLinearGradient(0, -200, 0, 1300); gr.addColorStop(0, MP.seaTop); gr.addColorStop(1, MP.seaBot); c.fillStyle = gr; c.fillRect(-240, -240, 2400, 1560);
    const vg = c.createRadialGradient(960, 540, 300, 960, 540, 1300); vg.addColorStop(0, 'rgba(255,255,255,0.35)'); vg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = vg; c.fillRect(-240, -240, 2400, 1560);
    // graticule every 10 degrees
    c.save(); c.strokeStyle = MP.grat; c.lineWidth = 1.2;
    for (let lon = -180; lon <= 180; lon += 10) { const x = pr.X(lon); if (x < -240 || x > 2160) continue; c.beginPath(); c.moveTo(x, -240); c.lineTo(x, 1320); c.stroke(); }
    for (let lat = -80; lat <= 80; lat += 10) { const y = pr.Y(lat); if (y < -240 || y > 1320) continue; c.beginPath(); c.moveTo(-240, y); c.lineTo(2160, y); c.stroke(); }
    c.restore();
    G.grain(c, 2400, 1560, 0.18, -240, -240);
  }
  // the static map drawn once into a cache (with margin for the camera drift)
  function cachedBase(k, draw) {
    const M0 = 120, CS = k.S * 1.12, cv = G.mk((1920 + 2 * M0) * CS, (1080 + 2 * M0) * CS), x = cv.getContext('2d');
    x.setTransform(CS, 0, 0, CS, M0 * CS, M0 * CS); G.setS(CS); G_S = CS; draw(x); G.setS(k.S); G_S = k.S;
    return (g) => g.drawImage(cv, -M0, -M0, 1920 + 2 * M0, 1080 + 2 * M0);
  }

  // ---------------------------------------------------------------- marks
  // red teardrop pin (tip at x, y) with a white dot; drops in on a spring, a ground shadow grows under it
  function teardrop(g, x, y, t, k, { R = 22, color = MP.red } = {}) {
    if (k <= 0) return;
    const drop = E.spring(clamp(k)), fall = (1 - drop) * -70, sc = 0.6 + 0.4 * E.outBack(clamp(k * 1.4));
    // ground shadow + pulse ring
    g.save(); g.globalAlpha = clamp(k * 2) * 0.35; g.fillStyle = 'rgba(30,40,55,1)'; g.beginPath(); g.ellipse(x, y, R * 0.55 * drop, R * 0.2 * drop, 0, 0, TAU); g.fill(); g.restore();
    if (k >= 1) { const ph = (t * 0.6) % 1; g.save(); g.strokeStyle = color; g.globalAlpha = (1 - ph) * 0.5; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, R * (0.5 + ph * 1.6), R * (0.18 + ph * 0.6), 0, 0, TAU); g.stroke(); g.restore(); }
    g.save(); g.translate(x, y + fall); g.scale(sc, sc);
    const cy = -R * 1.75;
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(-R * 0.35, -R * 0.55, -R, cy + R * 0.55, -R, cy);
    g.arc(0, cy, R, Math.PI, 0);
    g.bezierCurveTo(R, cy + R * 0.55, R * 0.35, -R * 0.55, 0, 0); g.closePath();
    G.shadow(g, 0.8); g.fillStyle = color; g.fill(); G.noShadow(g);
    const hl = g.createLinearGradient(-R, cy - R, R, cy + R); hl.addColorStop(0, 'rgba(255,255,255,0.28)'); hl.addColorStop(0.6, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fill();
    g.fillStyle = P.white; g.beginPath(); g.arc(0, cy, R * 0.42, 0, TAU); g.fill();
    g.restore();
  }
  // a label card: name (Inter 800) over a mono sub line, beside the pin head
  function label(g, x, y, k, name, sub, side = 'r', dy = 0) {
    if (k <= 0) return;
    const wn = G.measure(g, name, 30, 800), ws = sub ? G.measure(g, sub, 16, 500, F.mono, 0.08) : 0, W = Math.max(wn, ws) + 36, Hh = sub ? 74 : 50;
    const ax = side === 'l' ? x - 34 - W : x + 34, ay = y + dy - Hh / 2;
    g.save(); g.globalAlpha *= clamp(k * 2); const s = E.outBack(clamp(k)); g.translate(side === 'l' ? ax + W : ax, y + dy); g.scale(s, s); g.translate(-(side === 'l' ? ax + W : ax), -(y + dy));
    G.card(g, ax, ay, W, Hh, { r: 10, lift: 0.7, grainA: 0 });
    G.text(g, name, ax + 18, ay + 35, { size: 30, weight: 800, color: P.ink });
    if (sub) G.fig(g, sub, ax + 19, ay + 60, { size: 16, color: P.inkSoft, track: 0.08 });
    g.restore();
  }
  // a red dashed arc from a to b (bowing up), drawn on to k, the dashes marching slowly
  function route(g, a, b, t, k) {
    if (k <= 0) return;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, s = ny > 0 ? -1 : 1, c = [mx + nx * d * 0.28 * s, my + ny * d * 0.28 * s];
    const N = 80, pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]); }
    const n = Math.max(1, Math.round(N * E.inOutCubic(clamp(k))));
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); pts.slice(0, n + 1).forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
    g.strokeStyle = MP.red; g.lineWidth = 4.5; g.setLineDash([14, 10]); g.lineDashOffset = -t * 18; g.stroke(); g.restore();
    const h = pts[n], pv = pts[Math.max(0, n - 2)], ang = Math.atan2(h[1] - pv[1], h[0] - pv[0]);
    g.save(); g.translate(...h); g.rotate(ang); g.fillStyle = MP.red; g.beginPath(); g.moveTo(10, 0); g.lineTo(-8, -8); g.lineTo(-8, 8); g.closePath(); g.fill(); g.restore();
  }

  // ================================================================ map
  async function map(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? Pm.view ?? 'us'), V = MAPS[mode] ?? MAPS.us, D = shot.duration ?? 8, gj = await geo();
    const layer = gj[V.data], pr = proj(V.box, V.rect);
    const keys = Object.keys(layer), usKeys = keys.filter(k => k.startsWith('US-'));
    const hlKeys = [].concat(Pm.hl ?? V.hl);
    const pins = (Pm.pins ?? V.pins).map(p => (typeof p === 'string' ? { name: p } : p)).map(p => ({ ...(pinOf(p.name) ?? {}), ...p })).filter(p => p.lon != null);
    const t1 = G.cue(shot, Pm.at, 0.6);
    const PT = pins.map((pn, i) => G.cue(shot, pn.word, t1 + i * Math.min(0.5, Math.max(0.25, (D * 0.45) / Math.max(1, pins.length)))));
    const routes = (Pm.routes ?? V.routes).map(([a, b, w]) => {
      const ia = pins.findIndex(p => p.name === a), ib = pins.findIndex(p => p.name === b);
      return ia < 0 || ib < 0 ? null : { ia, ib, t: G.cue(shot, w, Math.max(PT[ia], PT[ib]) + 0.5) };
    }).filter(Boolean);
    const tH = hlKeys.length ? G.cue(shot, Pm.hlAt, 0.3) : 0;
    let base = null, hlPath = null;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(1);
      if (!base) {
        base = cachedBase(k, (c) => {
          sea(c, pr);
          if (mode === 'us') {
            const far = pathOf(keys.filter(k => !k.startsWith('US-')).flatMap(k => layer[k]), pr, V.box);
            reliefLand(c, far, { top: MP.far, top2: MP.far2, ext: 3, seed: 3, relief: 0.6 });
            const us = pathOf(usKeys.flatMap(k => layer[k]), pr, V.box);
            reliefLand(c, us, { ext: 6, seed: 11 });
            c.save(); c.strokeStyle = MP.border; c.lineWidth = 1.1; c.lineJoin = 'round'; c.stroke(us); c.restore();
            c.save(); c.fillStyle = MP.lake; c.fill(pathOf(Object.values(gj.lakes).flat(), pr, V.box)); c.strokeStyle = MP.edge; c.lineWidth = 0.8; c.stroke(pathOf(Object.values(gj.lakes).flat(), pr, V.box)); c.restore();
            c.save(); c.strokeStyle = MP.edge; c.lineWidth = 1.2; c.stroke(far); c.restore();
          } else {
            const land = pathOf(keys.flatMap(k => layer[k]), pr, V.box);
            reliefLand(c, land, { ext: 5, seed: 19 });
            c.save(); c.strokeStyle = MP.border; c.lineWidth = 1; c.lineJoin = 'round'; c.stroke(land); c.restore();
          }
        });
        hlPath = hlKeys.length ? pathOf(hlKeys.flatMap(k => layer[k] ?? []), pr, V.box) : null;
      }
      base(g);
      // the highlighted region rises in red
      if (hlPath) {
        const kh = E.spring(range(t, tH, tH + 1.3)), lift = 16 * clamp(kh, 0, 1.2);
        if (kh > 0) {
          g.save(); g.globalAlpha = clamp(range(t, tH, tH + 0.25));
          g.save(); G.shadow(g, 0.6 + kh); g.fillStyle = MP.redSide; g.fill(hlPath); G.noShadow(g); g.restore();
          for (let i = 0; i < lift; i += 1.5) { g.save(); g.translate(0, -i); g.fillStyle = MP.redSide; g.fill(hlPath); g.restore(); }
          g.save(); g.translate(0, -lift); const gr = g.createLinearGradient(0, 200, 0, 900); gr.addColorStop(0, MP.redTop); gr.addColorStop(1, MP.red); g.fillStyle = gr; g.fill(hlPath);
          g.strokeStyle = MP.redEdge; g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke(hlPath); g.restore();
          g.restore();
        }
      }
      // routes under the pins
      k.view(1.02);
      const at = (i) => [pr.X(pins[i].lon), pr.Y(pins[i].lat)];
      routes.forEach(r => route(g, at(r.ia), at(r.ib), t, range(t, r.t, r.t + 1.2)));
      // pins and labels
      pins.forEach((pn, i) => {
        const [x, y] = at(i), kk = range(t, PT[i], PT[i] + 0.7);
        teardrop(g, x, y, t, kk, { R: 20 });
        label(g, x, y - 36, range(t, PT[i] + 0.25, PT[i] + 0.75), pn.name, pn.sub, pn.side ?? (x > 1500 ? 'l' : 'r'), pn.dy ?? 0);
      });
      k.flat();
      // header on a soft paper fade so it reads over the map
      const hg = g.createLinearGradient(0, 0, 0, 260); hg.addColorStop(0, 'rgba(247,246,241,0.92)'); hg.addColorStop(0.7, 'rgba(247,246,241,0.55)'); hg.addColorStop(1, 'rgba(247,246,241,0)'); g.fillStyle = hg; g.fillRect(0, 0, 1920, 260);
      G.kicker(g, Pm.kicker ?? V.kicker, 90, 110, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? V.title, 90, 186, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      G.source(g, Pm.source ?? V.src, range(t, 0.6, 1.4), { y: 1046 });
    }, { push: 0.045, dx: 20, dy: 8, fx: 960, fy: 560 });
  }

  // ================================================================ dealmap: the circle as a flat network diagram
  // Edge library: RESEARCH §2a rows (C-numbers). kind: INVESTS (teal) · BUYS (navy) · GUARANTEES (navy, dashed) ·
  // WARRANT (teal, dashed) · BOOKS (a badge on one node, no arrow). Amounts are as RESEARCH words them.
  const EDGES = {
    C1: { from: 'NVIDIA', to: 'OPENAI', kind: 'INVESTS', label: 'UP TO $100B', sub: 'LETTER OF INTENT · SEP 2025 · NEVER BINDING' },
    C2: { from: 'NVIDIA', to: 'OPENAI', kind: 'INVESTS', label: '$30B STAKE', sub: 'REPLACED A $100B LETTER OF INTENT', word: 'hundred' },
    C3: { from: 'NVIDIA', to: 'OPENAI', kind: 'GUARANTEES', label: 'UP TO $105B', sub: 'OF OPENAI’S OHIO DATA-CENTRE LEASES', word: 'guarantee' },
    C4: { from: 'OPENAI', to: 'ORACLE', kind: 'BUYS', label: '>$300B', sub: 'CLOUD CONTRACTS · REPORTED', word: 'Oracle' },
    C5: { from: 'ORACLE', to: 'NVIDIA', kind: 'BUYS', label: 'SERVERS', sub: 'CAPEX $28.5B IN ONE QUARTER', word: 'servers' },
    C6: { from: 'OPENAI', to: 'AMD', kind: 'BUYS', label: '6 GW', sub: 'OF AMD CHIPS · FIRST 1 GW BINDING', word: 'AMD' },
    C6w: { from: 'AMD', to: 'OPENAI', kind: 'WARRANT', label: '160M SHARES', sub: 'AT $0.01 EACH', word: 'cent' },
    C6m: { from: 'AMD', to: 'META', kind: 'WARRANT', label: '160M SHARES', sub: 'AN IDENTICAL WARRANT · FEB 2026' },
    C7: { from: 'OPENAI', to: 'COREWEAVE', kind: 'BUYS', label: '$6.5B ORDER', sub: 'CLOUD CAPACITY · SEP 2025' },
    C8: { from: 'NVIDIA', to: 'COREWEAVE', kind: 'GUARANTEES', label: '$6.3B', sub: 'BUYS ANY UNSOLD CAPACITY TO 2032', word: 'promised' },
    C9: { from: 'NVIDIA', to: 'COREWEAVE', kind: 'INVESTS', label: '$2B STAKE', sub: 'NEW SHARES · JAN 2026', word: 'CoreWeave' },
    C9b: { from: 'COREWEAVE', to: 'NVIDIA', kind: 'BUYS', label: 'ALL ITS GPUs', sub: 'NVIDIA SUPPLIES EVERY ONE' },
    C10: { from: 'MICROSOFT', to: 'OPENAI', kind: 'INVESTS', label: '$11.9B', sub: 'FUNDED, OF $13.0B COMMITTED', word: 'Microsoft' },
    C11: { from: 'OPENAI', to: 'MICROSOFT', kind: 'BUYS', label: '$24.1B', sub: 'MICROSOFT’S REVENUE FROM OPENAI · FY2026', word: 'booked' },
    C12: { from: 'AMAZON', to: 'OPENAI', kind: 'INVESTS', label: '$50B', sub: '$15B PAID · $35B ON MILESTONES', word: 'Amazon' },
    C13: { from: 'OPENAI', to: 'AMAZON', kind: 'BUYS', label: '+$100B', sub: 'MORE AWS CLOUD, OVER 8 YEARS', word: 'expanded' },
    C17a: { from: 'NVIDIA', to: 'ANTHROPIC', kind: 'INVESTS', label: 'UP TO $10B', sub: 'NOV 2025' },
    C17b: { from: 'MICROSOFT', to: 'ANTHROPIC', kind: 'INVESTS', label: 'UP TO $5B', sub: 'NOV 2025' },
    C17c: { from: 'ANTHROPIC', to: 'MICROSOFT', kind: 'BUYS', label: '$30B', sub: 'AZURE CLOUD · NOV 2025' },
    C20: { from: 'ALPHABET', kind: 'BOOKS', label: '$99B', sub: 'PAPER GAINS ON STAKES · Q2 2026', word: 'Alphabet' },
    C24: { from: 'META', to: 'COREWEAVE', kind: 'BUYS', label: 'UP TO $21B', sub: 'GPU CLOUD · MAR 2026' },
  };
  // SCRIPT chapter 2 (lines 21–31), in order; META and ANTHROPIC get their own rows so every node is in the circle
  const DEAL_STEPS = ['C2', 'C3', 'C4', 'C5', 'C6', 'C6w', 'C12', 'C13', 'C10', 'C11', 'C9', 'C8', 'C24', 'C17a', 'C20'];
  const RING = ['NVIDIA', 'COREWEAVE', 'META', 'ALPHABET', 'ANTHROPIC', 'OPENAI', 'AMAZON', 'MICROSOFT', 'AMD', 'ORACLE'];
  const KIND = {
    INVESTS: { col: P.teal, dash: null }, BUYS: { col: P.ink, dash: null }, GUARANTEES: { col: P.ink, dash: [16, 10] },
    WARRANT: { col: P.tealDeep, dash: [4, 9] }, BOOKS: { col: P.sageDeep, dash: null },
  };
  const DEAL_SRC = 'SOURCES: SEC FILINGS (NVIDIA, AMD, AMAZON, MICROSOFT, COREWEAVE, ALPHABET, META); COMPANY RELEASES; FT AND WSJ AS REPORTED · RESEARCH §2';

  async function dealmap(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 20;
    const norm = (st) => { const e = typeof st === 'string' ? { id: st, ...(EDGES[st] ?? { from: st, kind: 'BOOKS', label: st }) } : { ...(st.id ? EDGES[st.id] : {}), ...st };
      e.from = String(e.from ?? '').toUpperCase(); e.to = e.to ? String(e.to).toUpperCase() : null; if (e.to === e.from) e.to = null; e.kind = String(e.kind ?? (e.to ? 'BUYS' : 'BOOKS')).toUpperCase(); return e; };
    const pre = [].concat(Pm.pre ?? []).map(norm), steps = [].concat(Pm.steps ?? DEAL_STEPS).map(norm), all = [...pre, ...steps];
    const names = (Pm.nodes ?? RING).map(n => String(n).toUpperCase());
    for (const e of all) for (const n of [e.from, e.to]) if (n && !names.includes(n)) names.push(n);
    const loopOn = Pm.loop !== false;
    const T = G.cues(shot, steps, { from: 0.9, span: Math.max(0.9 * (steps.length - 1), D - (loopOn ? 4.0 : 2.4) - 0.9) });
    const tLoop = G.cue(shot, Pm.loopAt, (T.at(-1) ?? 0.9) + 1.4);
    const CX = 960, CY = 606, RX = 700, RY = 330;
    const mg = G.mk(4, 4).getContext('2d');
    const nodes = names.map((n, i) => {
      const a = -Math.PI / 2 + i / names.length * TAU, hub = n === 'OPENAI', size = hub ? 34 : 29;
      const w = G.measure(mg, n, size, 800, F.sans, 0.02) + (hub ? 60 : 48), h = hub ? 72 : 62;
      return { n, i, a, x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY, w, h, size, hub };
    });
    const node = (n) => nodes.find(q => q.n === n);
    // edge geometry: pairs with several edges fan out; a lone edge bows slightly
    const pairs = {}; all.forEach((e, i) => { if (!e.to) return; const k = [e.from, e.to].sort().join('|'); (pairs[k] ??= []).push(i); });
    const inside = (p, nd, pad) => Math.abs(p[0] - nd.x) < nd.w / 2 + pad && Math.abs(p[1] - nd.y) < nd.h / 2 + pad;
    const geom = all.map((e, i) => {
      if (!e.to) return null;
      const A = node(e.from), B = node(e.to), k = [e.from, e.to].sort(), list = pairs[k.join('|')], j = list.indexOf(i), n = list.length;
      const P0 = node(k[0]), P1 = node(k[1]), dx = P1.x - P0.x, dy = P1.y - P0.y, dist = Math.hypot(dx, dy), nx = -dy / dist, ny = dx / dist;
      const o = n === 1 ? 0.1 : (j - (n - 1) / 2) * 0.3;
      const c = [(A.x + B.x) / 2 + nx * o * dist, (A.y + B.y) / 2 + ny * o * dist];
      const N = 160, pts = []; for (let q = 0; q <= N; q++) { const u = q / N; pts.push([(1 - u) ** 2 * A.x + 2 * (1 - u) * u * c[0] + u * u * B.x, (1 - u) ** 2 * A.y + 2 * (1 - u) * u * c[1] + u * u * B.y]); }
      let s0 = 0; while (s0 < N && inside(pts[s0], A, 10)) s0++;
      let s1 = N; while (s1 > 0 && inside(pts[s1], B, 16)) s1--;
      const seg = pts.slice(s0, s1 + 1), cum = G.polyLen(seg);
      return { seg, cum, mid: G.polyAt(seg, cum, 0.5) };
    });
    const stepAt = (i) => (i < pre.length ? -10 : T[i - pre.length]);
    // a white card label; big = the current step, small = a compact amount pill once it is old news
    function edgeLabel(g, e, x, y, k, big) {
      if (k <= 0) return;
      const K = KIND[e.kind] ?? KIND.BUYS;
      if (!big) { G.pill(g, e.label, x, y, { size: 17, align: 'center', k, fam: F.mono, weight: 500, color: K.col === P.ink ? P.ink : P.tealDeep, lift: 0.4, pad: 0.45 }); return; }
      const w1 = G.measure(g, e.kind, 15, 500, F.mono, 0.14), w2 = G.measure(g, e.label, 34, 800), w3 = e.sub ? G.measure(g, e.sub, 14, 500, F.mono, 0.08) : 0;
      const W = Math.max(w1, w2, w3) + 44, Hh = e.sub ? 118 : 92, x0 = clamp(x - W / 2, 90, 1830 - W), y0 = y - Hh / 2;
      g.save(); g.globalAlpha *= clamp(k * 2); const s = 0.9 + 0.1 * E.outBack(clamp(k)); g.translate(x0 + W / 2, y); g.scale(s, s); g.translate(-(x0 + W / 2), -y);
      G.card(g, x0, y0, W, Hh, { r: 14, lift: 1.0, grainA: 0 });
      g.fillStyle = K.col; g.fillRect(x0, y0 + 14, 6, Hh - 28);
      G.text(g, e.kind, x0 + 24, y0 + 32, { size: 15, weight: 500, fam: F.mono, color: K.col === P.ink ? P.inkSoft : P.tealDeep, track: 0.14 });
      G.text(g, e.label, x0 + 22, y0 + 72, { size: 34, weight: 800, color: P.ink });
      if (e.sub) G.text(g, e.sub, x0 + 24, y0 + 100, { size: 14, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.08 });
      g.restore();
    }
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: true, step: 54 });
      k.view(1);
      // the current step (latest one already cued)
      let cur = -1; all.forEach((e, i) => { if (t >= stepAt(i)) cur = i; });
      const loopK = loopOn ? range(t, tLoop, tLoop + 1.6) : 0;
      // the ring guide (faint) and, at the end, the loop in red, drawn clockwise from the top
      g.save(); g.strokeStyle = 'rgba(20,35,61,0.10)'; g.lineWidth = 2; g.setLineDash([3, 9]); g.globalAlpha = E.outCubic(range(t, 0.1, 0.8));
      g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, TAU); g.stroke(); g.restore();
      if (loopK > 0) {
        const a0 = -Math.PI / 2, a1 = a0 + TAU * E.inOutCubic(loopK);
        g.save(); g.strokeStyle = P.red; g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, a0, a1); g.stroke();
        // arrowheads riding the loop
        for (let q = 0; q < 10; q++) { const a = a0 + (q + 0.5) / 10 * TAU; if (a > a1) break; const px = CX + Math.cos(a) * RX, py = CY + Math.sin(a) * RY, tx = -Math.sin(a) * RX, ty = Math.cos(a) * RY, ang = Math.atan2(ty, tx);
          g.save(); g.translate(px, py); g.rotate(ang); g.fillStyle = P.red; g.beginPath(); g.moveTo(13, 0); g.lineTo(-9, -10); g.lineTo(-9, 10); g.closePath(); g.fill(); g.restore(); }
        g.restore();
      }
      // edges
      all.forEach((e, i) => {
        const gm = geom[i]; if (!gm) return;
        const ts = stepAt(i), kd = E.inOutCubic(range(t, ts, ts + 0.8)); if (kd <= 0) return;
        const K = KIND[e.kind] ?? KIND.BUYS, isCur = i === cur, old = !isCur && loopK <= 0;
        g.save(); g.globalAlpha = old ? 0.55 : 1; g.strokeStyle = K.col; g.lineWidth = isCur ? 6 : 4; g.lineCap = 'round'; g.lineJoin = 'round';
        if (K.dash) g.setLineDash(K.dash.map(d => d * (isCur ? 1 : 0.8)));
        const hd = G.drawPoly(g, gm.seg, gm.cum, kd); g.setLineDash([]);
        if (hd) { g.translate(hd.x, hd.y); g.rotate(hd.ang); g.fillStyle = K.col; const s = isCur ? 1.15 : 0.95; g.beginPath(); g.moveTo(14 * s, 0); g.lineTo(-10 * s, -11 * s); g.lineTo(-10 * s, 11 * s); g.closePath(); g.fill(); }
        g.restore();
        // money pulses running along a finished edge
        if (kd >= 1) for (let q = 0; q < 3; q++) { const u = ((t - ts) * 0.32 + q / 3) % 1, pp = G.polyAt(gm.seg, gm.cum, u); g.save(); g.globalAlpha = (old ? 0.45 : 0.85) * Math.sin(u * Math.PI); g.fillStyle = K.col; g.beginPath(); g.arc(pp.x, pp.y, isCur ? 6 : 4.5, 0, TAU); g.fill(); g.restore(); }
      });
      // nodes
      nodes.forEach((nd) => {
        const kn = E.outBack(range(t, 0.15 + nd.i * 0.06, 0.65 + nd.i * 0.06)); if (kn <= 0) return;
        const ce = all[cur], act = ce && (ce.from === nd.n || ce.to === nd.n) && loopK <= 0;
        g.save(); g.translate(nd.x, nd.y); g.scale(kn, kn);
        G.card(g, -nd.w / 2, -nd.h / 2, nd.w, nd.h, { r: nd.h / 2, fill: nd.hub ? P.ink : P.white, lift: act ? 1.3 : 0.8, grainA: 0 });
        if (act) { g.strokeStyle = P.teal; g.lineWidth = 4; G.rr(g, -nd.w / 2 - 6, -nd.h / 2 - 6, nd.w + 12, nd.h + 12, nd.h / 2 + 6); g.stroke(); }
        G.text(g, nd.n, 0, nd.size * 0.36, { size: nd.size, weight: 800, align: 'center', color: nd.hub ? P.white : P.ink, track: 0.02 });
        g.restore();
      });
      // badges (BOOKS steps): a card beside the node, outward from the ring
      all.forEach((e, i) => {
        if (e.to) return; const nd = node(e.from), kb = range(t, stepAt(i) + 0.1, stepAt(i) + 0.7); if (kb <= 0 || !nd) return;
        const ox = Math.cos(nd.a), oy = Math.sin(nd.a), bx = nd.x + ox * (nd.w / 2 + 20) * (Math.abs(ox) > 0.3 ? 1 : 0), by = nd.y + (Math.abs(ox) > 0.3 ? 70 : oy * (nd.h / 2 + 64));
        if (i === cur && loopK <= 0) edgeLabel(g, e, bx, by + 20, kb, true); else G.pill(g, `${e.label} ${e.sub ? '· ' + e.sub.split(' · ')[0] : ''}`.trim(), bx, by, { size: 16, align: 'center', k: kb, fam: F.mono, weight: 500, fill: P.mint, color: P.tealDeep, lift: 0.4 });
      });
      // labels: compact pills for old edges, then the current card on top
      all.forEach((e, i) => { const gm = geom[i]; if (!gm || i === cur) return; const kl = range(t, stepAt(i) + 0.4, stepAt(i) + 0.9); edgeLabel(g, e, gm.mid.x, gm.mid.y, kl, false); });
      if (cur >= 0 && geom[cur] && loopK <= 0) { const gm = geom[cur], ts = stepAt(cur); edgeLabel(g, all[cur], gm.mid.x, gm.mid.y, range(t, ts + 0.45, ts + 0.95), true); }
      if (cur >= 0 && geom[cur] && loopK > 0) edgeLabel(g, all[cur], geom[cur].mid.x, geom[cur].mid.y, 1, false);
      // header, legend, the loop slab
      k.flat();
      G.kicker(g, Pm.kicker ?? 'WHO PAYS WHOM · ARROWS = MONEY OR PROMISES', 90, 104, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Follow the money', 90, 176, range(t, 0.12, 0.9), { size: 58, weight: 800 });
      const lg = [['INVESTS', 'INVESTS'], ['BUYS', 'BUYS'], ['GUARANTEES', 'GUARANTEES'], ['WARRANT', 'GIVES A WARRANT']];
      lg.forEach(([kd, txt], q) => { const K = KIND[kd], x = 92 + q * 210, y = 1036, kk = E.outCubic(range(t, 0.6 + q * 0.1, 1.1 + q * 0.1));
        g.save(); g.globalAlpha = kk; g.strokeStyle = K.col; g.lineWidth = 4; if (K.dash) g.setLineDash(K.dash.map(d => d * 0.6)); g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 40, y - 6); g.stroke(); g.restore();
        G.text(g, txt, x + 52, y, { size: 15, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.08, alpha: kk }); });
      if (loopK > 0) G.slab(g, Pm.loopLabel ?? 'IT’S A CIRCLE', 1830, 130, { size: 40, fill: P.red, align: 'right', k: range(t, tLoop + 0.8, tLoop + 1.4) });
      G.source(g, Pm.source ?? DEAL_SRC, range(t, 0.6, 1.4), { y: 1046, size: 13, x: 1840 });
    }, { push: 0.022, dx: 14, dy: 6 });
  }

  return { map, dealmap };
}
