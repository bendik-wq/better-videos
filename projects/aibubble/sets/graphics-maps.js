// Silver bright maps (episode 7), restyled toward the "Reconstructed" look: white / pale-grey relief land on a pale
// blue-grey sea, the highlighted region extruded in red, red teardrop map pins with a white dot, red dashed route arcs
// that draw on. Real coastlines and borders: Natural Earth 1:50m (public domain).
//   map   params.mode: 'world' (default pins Dallas, Libya (Sarir), Bermuda, Saudi Arabia, Zurich, Lima; routes
//         Dallas -> Bermuda, Saudi Arabia -> Bermuda) | 'us' (Dallas, New York, Chicago, Washington, Boca Raton;
//         Texas raised; routes Dallas -> New York, Dallas -> Chicago)
//         params: pins [{ name, lon, lat, sub, word, side: 'l'|'r', dy }], routes [[fromName, toName, word?]],
//         hl (ISO3 codes, or 'US-TX' style state codes in 'us'), title, kicker, source, at (first pin), cam
// Geography: projects/silver/assets/geo/silver.json, built by assets/geo/build.py from the Natural Earth GeoJSON.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;
let GEO = null;
const geo = () => GEO ??= fetch('/projects/silver/assets/geo/silver.json').then(r => r.json());

// the "Reconstructed" map palette (pale relief land, blue-grey sea, red for the subject)
const MP = {
  seaTop: '#e9eef2', seaBot: '#d2dbe3', grat: 'rgba(70,95,120,0.07)',
  land: '#fdfdfc', land2: '#eef0f2', side: '#c3cbd3', edge: 'rgba(70,88,108,0.55)', border: 'rgba(90,106,124,0.32)',
  far: '#f1f3f4', far2: '#e4e8eb', lake: '#dbe3ea',
  red: P.red, redTop: '#ec3b30', redSide: '#9c150d', redEdge: 'rgba(255,255,255,0.7)',
};

const MAPS = {
  world: {
    data: 'world', box: [-124, -30, 66, 62], rect: [40, 230, 1840, 800], hl: [],
    pins: [
      { name: 'Dallas', lon: -96.8, lat: 32.78, sub: 'THE HUNTS', side: 'l' },
      { name: 'Libya', lon: 22.4, lat: 27.6, sub: 'SARIR OIL FIELD', side: 'l', dy: -62 },
      { name: 'Bermuda', lon: -64.78, lat: 32.3, sub: 'IMIC · JUL 1979', side: 'r' },
      { name: 'Saudi Arabia', lon: 46.68, lat: 24.71, sub: 'SAUDI PARTNERS', side: 'r', dy: 20 },
      { name: 'Zurich', lon: 8.54, lat: 47.37, sub: 'LENDER: SWISS BANK CORP.', side: 'r', dy: -18 },
      { name: 'Lima', lon: -77.04, lat: -12.05, sub: 'MINPECO · PERU', side: 'r' },
    ],
    routes: [['Dallas', 'Bermuda'], ['Saudi Arabia', 'Bermuda']],
    kicker: 'THE HUNT SILVER PLAY · 1961 – 1988', title: 'From Dallas to the world',
    src: 'SOURCES: TIME (7 APR 1980); SEC STAFF REPORT (1982); LA TIMES (1988) · MAP: NATURAL EARTH',
  },
  us: {
    data: 'us', box: [-124.6, 24.3, -66.8, 49.4], rect: [40, 220, 1840, 820], hl: ['US-TX'],
    pins: [
      { name: 'Dallas', lon: -96.8, lat: 32.78, sub: 'THE HUNTS', side: 'l' },
      { name: 'Chicago', lon: -87.63, lat: 41.88, sub: 'CHICAGO BOARD OF TRADE', side: 'l', dy: -10 },
      { name: 'New York', lon: -74.0, lat: 40.71, sub: 'COMEX · BACHE', side: 'r', dy: -34 },
      { name: 'Washington', lon: -77.04, lat: 38.9, sub: 'FED · CFTC · CONGRESS', side: 'r', dy: 34 },
      { name: 'Boca Raton', lon: -80.1, lat: 26.37, sub: 'BANKERS · 30 MAR 1980', side: 'r' },
    ],
    routes: [['Dallas', 'New York'], ['Dallas', 'Chicago']],
    kicker: 'UNITED STATES · 1979 – 1980', title: 'Where the crisis played out',
    src: 'SOURCES: SEC STAFF REPORT (1982); HOUSE HEARINGS (1980) · MAP: NATURAL EARTH',
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
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? Pm.view ?? 'world'), V = MAPS[mode] ?? MAPS.world, D = shot.duration ?? 8, gj = await geo();
    const layer = gj[V.data], pr = proj(V.box, V.rect);
    const keys = Object.keys(layer), usKeys = keys.filter(k => k.startsWith('US-'));
    const hlKeys = [].concat(Pm.hl ?? V.hl);
    const pins = (Pm.pins ?? V.pins).map(p => ({ ...(V.pins.find(q => q.name === p.name) ?? {}), ...p }));
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

  return { map };
}
