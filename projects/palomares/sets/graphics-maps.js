// Palomares bright maps (episode 9). The "Reconstructed" look: white / pale-grey relief land on a pale blue-grey sea, red
// teardrop pins with a white dot, red dashed route arcs that draw on, white label cards.
//   map   params.mode:
//     'spain'  Iberia (Natural Earth 1:50m): Torrejón (16th Air Force), Morón (the tankers), Palomares (red); the tankers'
//              route Morón -> the refuelling area; Almería, Mediterranean and Atlantic lettering
//     'coast'  the Palomares coast, zoomed: Natural Earth 1:10m coastline, land relief and isobaths in feet (500-ft steps,
//              EMODnet Bathymetry), the dry Almanzora (approximate course), the village, Villaricos, Garrucha, Camp Wilson
//              beach, bombs 1-3 as numbered discs with a legend, Guest's 51-sq-mi search wedge (shape illustrative) and bomb
//              4's find area (reconstruction, red); Águilas, off the top edge, as an arrow
//     'world'  the Chrome Dome airborne-alert route, illustrative: Seymour Johnson AFB (NC) -> across the Atlantic -> the
//              refuelling over Spain -> into the Mediterranean "toward the Soviet frontier" -> and home
//          params: pins [{ name, lon, lat, sub, word, side 'l'|'r', dy, color }] (a known name inherits its fields; in
//          'coast' a pin is a red teardrop + card), routes [[fromName, toName, word?]], at (first pin), title, kicker,
//          source, cam; coast only: wedge (false hides), find (false hides), legend (false hides), wedgeAt, findAt
// Geography: projects/palomares/assets/geo/world.json (Natural Earth 1:50m, build.py) and almeria.json + almeria-relief.png
// (build_coast.py: Natural Earth 1:10m + EMODnet Bathymetry, CC BY 4.0, credited on screen).
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;
let GEO = null, COAST = null;
const geo = () => GEO ??= fetch('/projects/palomares/assets/geo/world.json').then(r => r.json());
const coast = () => COAST ??= fetch('/projects/palomares/assets/geo/almeria.json').then(r => r.json());

// the "Reconstructed" map palette (pale relief land, blue-grey sea, red for the subject)
const MP = {
  seaTop: '#e9eef2', seaBot: '#d2dbe3', grat: 'rgba(70,95,120,0.07)',
  land: '#fdfdfc', land2: '#eef0f2', side: '#c3cbd3', edge: 'rgba(70,88,108,0.55)', border: 'rgba(90,106,124,0.32)',
  far: '#f1f3f4', far2: '#e4e8eb', lake: '#dbe3ea', iso: 'rgba(42,140,134,0.55)',
  red: P.red, redTop: '#ec3b30', redSide: '#9c150d', redEdge: 'rgba(255,255,255,0.7)',
};

// every pin a map can name (a pin given by name only inherits these fields); RESEARCH §11.7 (OSM/Photon, S112) unless noted
const KNOWN = [
  { name: 'Palomares', lon: -1.7973, lat: 37.2474, sub: '17 JAN 1966 · FOUR H-BOMBS FALL', side: 'r' },
  { name: 'Torrejón', lon: -3.4458, lat: 40.4967, sub: '16TH AIR FORCE HQ, NEAR MADRID', side: 'r' },        // RESEARCH §1 (10:27 call)
  { name: 'Morón', lon: -5.616, lat: 37.175, sub: 'THE KC-135 TANKERS FLEW FROM HERE', side: 'l', dy: 46 },   // RESEARCH 2.4
  { name: 'Seymour Johnson AFB', lon: -77.96, lat: 35.34, sub: 'NORTH CAROLINA · TEA 16’S HOME BASE', side: 'r', dy: 40 }, // RESEARCH 2.3
  { name: 'Villaricos', lon: -1.7714, lat: 37.2486 },
  { name: 'Garrucha', lon: -1.82, lat: 37.185 },
  { name: 'Cuevas del Almanzora', lon: -1.881, lat: 37.296 },
  { name: 'Camp Wilson beach', lon: -1.7954, lat: 37.2325, sub: 'QUITAPELLEJOS · THE 8 MAR AFTERNOON SWIM' },
  { name: 'Mojácar parador', lon: -1.831, lat: 37.132, sub: 'THE 8 MAR MORNING SWIM' },
  { name: 'Águilas', lon: -1.58, lat: 37.41, sub: 'SIMÓ’S HOME PORT' },
  // bomb 4: the canyon where 2,550-2,850 ft is first reached (RESEARCH §11.3, S38: a reconstruction)
  { name: 'Bomb 4', lon: -1.725, lat: 37.175, sub: 'FOUND 15 MAR · 2,550 FT · ABOUT 5 MI OUT', side: 'r' },
];
const pinOf = (n) => KNOWN.find(p => p.name === n);
// bombs 1-3 on land (RESEARCH §3c, §11.7): CSN zone centroids for 2 and 3; bomb 1 inferred (riverbed, ~300 m from the coast)
const LAND_BOMBS = [
  { n: 1, lon: -1.777, lat: 37.244, text: 'DRY RIVERBED · INTACT · 17 JAN' },
  { n: 2, lon: -1.8128, lat: 37.2439, text: 'WEST OF THE VILLAGE · EXPLOSIVE WENT OFF · 18 JAN' },
  { n: 3, lon: -1.7928, lat: 37.2476, text: 'EAST EDGE · EXPLOSIVE PARTLY WENT OFF · 18 JAN' },
];
// the dry Almanzora's lower course, approximate (north and east of the village, to the mouth at 37.242 N, 1.775 W; §11.7)
const ALMANZORA = [[-1.905, 37.302], [-1.884, 37.293], [-1.862, 37.283], [-1.84, 37.273], [-1.822, 37.266], [-1.806, 37.261], [-1.792, 37.256], [-1.782, 37.249], [-1.775, 37.242]];

const MAPS = {
  spain: {
    data: 'iberia', box: [-10.0, 35.5, 4.4, 44.0], rect: [40, 210, 1840, 850], main: ['ESP'],
    pins: ['Torrejón', 'Morón', 'Palomares'].map(pinOf), red: ['Palomares'],
    routes: [['Morón', 'Palomares']],
    words: [['Mediterranean Sea', 2.2, 38.6], ['Atlantic Ocean', -9.0, 36.2], ['ALMERÍA', -2.75, 36.98, true], ['SPAIN', -4.2, 39.2, true]],
    kicker: '17 JAN 1966 · SOUTHERN SPAIN', title: 'The refuelling over Palomares',
    src: 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); B. MORAN (2009) · MAP: NATURAL EARTH',
  },
  coast: {
    data: 'coast', box: [-1.96, 37.135, -1.55, 37.302], rect: [0, 0, 1920, 1080],
    pins: ['Bomb 4'].map(pinOf), red: ['Bomb 4'], routes: [],
    kicker: 'PALOMARES · 1966', title: 'Three on land, one in the sea',
    src: 'COAST: NATURAL EARTH · DEPTHS: EMODNET BATHYMETRY · BOMB 4 SITE AND SEARCH WEDGE: RECONSTRUCTION · RESEARCH: CSN; DNA (1975); MORAN (2009)',
  },
  world: {
    data: 'world', box: [-84, 24, 34, 54], rect: [40, 240, 1840, 780], main: [],
    pins: [pinOf('Seymour Johnson AFB'), { ...pinOf('Palomares'), sub: 'REFUELLING OVER SPAIN · 17 JAN 1966', dy: -56 }], red: ['Palomares'], routes: [],
    words: [['Atlantic Ocean', -47, 27.0]],
    kicker: 'OPERATION CHROME DOME · AIRBORNE ALERT', title: 'A 24-hour patrol, refuelled over Spain',
    src: 'ROUTE ILLUSTRATIVE · SOURCES: B. MORAN (2009); DNA PALOMARES SUMMARY REPORT (1975) · MAP: NATURAL EARTH',
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
  function pathOf(rings, pr, box, { smooth = 0, close = true } = {}) {
    const path = new Path2D(), mx = (box[2] - box[0]) * 0.35, my = (box[3] - box[1]) * 0.35;
    for (const r of rings) {
      let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9; for (let i = 0; i < r.length; i += 2) { if (r[i] < lo0) lo0 = r[i]; if (r[i] > lo1) lo1 = r[i]; if (r[i + 1] < la0) la0 = r[i + 1]; if (r[i + 1] > la1) la1 = r[i + 1]; }
      if (lo1 < box[0] - mx || lo0 > box[2] + mx || la1 < box[1] - my || la0 > box[3] + my) continue;
      let pts = []; for (let i = 0; i < r.length; i += 2) pts.push([pr.X(r[i]), pr.Y(r[i + 1])]);
      if (smooth) pts = G.smooth(pts, smooth);
      path.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]); if (close) path.closePath();
    }
    return path;
  }
  // relief land: a thin extruded side, a pale top, an inner shade along every coast, faint seeded "terrain" blotches
  function reliefLand(c, path, { top = MP.land, top2 = MP.land2, side = MP.side, ext = 5, seed = 7, relief = 1 } = {}) {
    c.save(); G.shadow(c, 0.7, 0.8); c.translate(0, ext); c.fillStyle = side; c.fill(path); G.noShadow(c); c.restore();
    for (let i = ext - 1; i > 0; i--) { c.save(); c.translate(0, i); c.fillStyle = side; c.fill(path); c.restore(); }
    c.save(); const gr = c.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, top); gr.addColorStop(1, top2); c.fillStyle = gr; c.fill(path); c.clip(path);
    const r = rng(seed); for (let i = 0; i < 70 * relief; i++) { const x = r() * 1920, y = r() * 1080, rad = 30 + r() * 140, a = 0.025 + r() * 0.045; const bg = c.createRadialGradient(x, y, 0, x, y, rad); bg.addColorStop(0, `rgba(120,135,150,${a})`); bg.addColorStop(1, 'rgba(120,135,150,0)'); c.fillStyle = bg; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    c.shadowColor = 'rgba(55,75,98,0.28)'; c.shadowBlur = 16 * G_S; c.shadowOffsetX = 3 * G_S; c.shadowOffsetY = 5 * G_S;
    const hole = new Path2D(); hole.rect(-400, -400, 2720, 1880); hole.addPath(path); c.fillStyle = '#000'; c.fill(hole, 'evenodd');
    c.restore();
  }
  let G_S = 1;
  function sea(c, pr, { grat = 10 } = {}) {
    const gr = c.createLinearGradient(0, -200, 0, 1300); gr.addColorStop(0, MP.seaTop); gr.addColorStop(1, MP.seaBot); c.fillStyle = gr; c.fillRect(-240, -240, 2400, 1560);
    const vg = c.createRadialGradient(960, 540, 300, 960, 540, 1300); vg.addColorStop(0, 'rgba(255,255,255,0.35)'); vg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = vg; c.fillRect(-240, -240, 2400, 1560);
    if (grat) {
      c.save(); c.strokeStyle = MP.grat; c.lineWidth = 1.2;
      for (let lon = -180; lon <= 180; lon += grat) { const x = pr.X(lon); if (x < -240 || x > 2160) continue; c.beginPath(); c.moveTo(x, -240); c.lineTo(x, 1320); c.stroke(); }
      for (let lat = -80; lat <= 80; lat += grat) { const y = pr.Y(lat); if (y < -240 || y > 1320) continue; c.beginPath(); c.moveTo(-240, y); c.lineTo(2160, y); c.stroke(); }
      c.restore();
    }
    G.grain(c, 2400, 1560, 0.18, -240, -240);
  }
  function cachedBase(k, draw) {
    const M0 = 120, CS = k.S * 1.12, cv = G.mk((1920 + 2 * M0) * CS, (1080 + 2 * M0) * CS), x = cv.getContext('2d');
    x.setTransform(CS, 0, 0, CS, M0 * CS, M0 * CS); G.setS(CS); G_S = CS; draw(x); G.setS(k.S); G_S = k.S;
    return (g) => g.drawImage(cv, -M0, -M0, 1920 + 2 * M0, 1080 + 2 * M0);
  }
  // sea/land lettering: italic serif for water, spaced caps for land
  function word(c, s, x, y, caps = false, a = 1) {
    if (caps) G.text(c, s, x, y, { size: 24, weight: 600, fam: F.narrow, align: 'center', color: 'rgba(70,88,108,0.75)', track: 0.32, alpha: a });
    else G.text(c, s, x, y, { size: 34, weight: 400, fam: F.serif, style: 'italic', align: 'center', color: 'rgba(55,90,115,0.7)', alpha: a });
  }

  // ---------------------------------------------------------------- marks
  function teardrop(g, x, y, t, k, { R = 22, color = MP.red } = {}) {
    if (k <= 0) return;
    const drop = E.spring(clamp(k)), fall = (1 - drop) * -70, sc = 0.6 + 0.4 * E.outBack(clamp(k * 1.4));
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
  // a town on the coast map: a small navy dot and a name on a paper halo
  function town(g, x, y, k, name, { side = 'r', dy = 0, size = 26, sub = null, dot = true } = {}) {
    if (k <= 0) return;
    g.save(); g.globalAlpha *= clamp(k * 2);
    if (dot) { g.fillStyle = P.white; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); g.fillStyle = P.ink; g.beginPath(); g.arc(x, y, 5.5, 0, TAU); g.fill(); }
    const tx = side === 'l' ? x - 16 : x + 16, al = side === 'l' ? 'right' : 'left';
    g.save(); g.shadowColor = 'rgba(253,253,252,0.95)'; g.shadowBlur = 10 * G_S; G.text(g, name, tx, y + dy + size * 0.36, { size, weight: 800, align: al, color: P.ink }); if (sub) G.text(g, sub, tx, y + dy + size * 0.36 + 24, { size: 15, weight: 500, fam: F.mono, align: al, color: P.inkSoft, track: 0.08 }); g.restore();
    g.restore();
  }
  // a red dashed arc from a to b, drawn on to k (bow: the arc's bulge as a fraction of the distance; sign flips the side)
  function route(g, a, b, t, k, { bow = 0.28, color = MP.red, dash = [14, 10], width = 4.5, head = true } = {}) {
    if (k <= 0) return;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, s = ny > 0 ? -1 : 1, c = [mx + nx * d * bow * s, my + ny * d * bow * s];
    const N = 80, pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]); }
    const n = Math.max(1, Math.round(N * E.inOutCubic(clamp(k))));
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = width + 3.5; g.lineCap = 'round'; g.beginPath(); pts.slice(0, n + 1).forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash); g.lineDashOffset = -t * 18; g.stroke(); g.restore();
    if (head) { const h = pts[n], pv = pts[Math.max(0, n - 2)], ang = Math.atan2(h[1] - pv[1], h[0] - pv[0]);
      g.save(); g.translate(...h); g.rotate(ang); g.fillStyle = color; g.beginPath(); g.moveTo(10, 0); g.lineTo(-8, -8); g.lineTo(-8, 8); g.closePath(); g.fill(); g.restore(); }
    return pts[n];
  }

  // ================================================================ map
  async function map(ctx, shot) {
    const Pm = shot.params ?? {}, mode = MAPS[Pm.mode] ? String(Pm.mode) : 'spain', V = MAPS[mode], D = shot.duration ?? 8;
    const gj = mode === 'coast' ? null : await geo(), cj = mode === 'coast' ? await coast() : null;
    const relief = mode === 'coast' ? await G.image('/projects/palomares/assets/geo/' + cj.relief.file).catch(() => null) : null;
    // Pm.box [w, s, e, n] reframes the map (e.g. the US East Coast); Pm.hide: base labels to leave out
    // ('Palomares' | 'Villaricos' | 'Garrucha' | 'Camp Wilson beach' | 'Águilas' | 'river'); a pinned town's base label is left out too
    const BOX = Pm.box ?? V.box, pr = proj(BOX, V.rect);
    const pins = (Pm.pins ?? V.pins).map(p => (typeof p === 'string' ? { name: p } : p)).map(p => ({ ...(pinOf(p.name) ?? {}), ...p })).filter(p => p.lon != null);
    const t1 = G.cue(shot, Pm.at, mode === 'coast' ? 2.2 : 0.6);
    const PT = pins.map((pn, i) => G.cue(shot, pn.word, t1 + i * Math.min(0.6, Math.max(0.3, (D * 0.45) / Math.max(1, pins.length)))));
    const routes = (Pm.routes ?? V.routes).map(([a, b, w]) => {
      const ia = pins.findIndex(p => p.name === a), ib = pins.findIndex(p => p.name === b);
      return ia < 0 || ib < 0 ? null : { ia, ib, t: G.cue(shot, w, Math.max(PT[ia], PT[ib]) + 0.5) };
    }).filter(Boolean);
    const hide = new Set([...(Pm.hide ?? []), ...pins.map(p => p.name)]); const hidden = (n) => hide.has(n);
    const isRed = (pn) => pn.color === MP.red || (pn.color == null && (V.red ?? []).includes(pn.name));
    // coast cues
    const tW = G.cue(shot, Pm.wedgeAt, Math.min(D * 0.55, 4.4)), tF = G.cue(shot, Pm.findAt, t1);
    let base = null;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(1);
      if (!base) {
        base = cachedBase(k, (c) => {
          if (mode === 'coast') {
            sea(c, pr, { grat: 0 });
            // isobaths (feet), offshore only, with labels on a paper halo
            const land = pathOf(cj.land, pr, cj.box, { smooth: 1 });
            Object.entries(cj.depth).forEach(([ft, lines]) => {
              const path = pathOf(lines, pr, cj.box, { smooth: 1, close: false });
              c.save(); c.strokeStyle = MP.iso; c.lineWidth = ft === '2500' ? 2.6 : 1.6; c.setLineDash(ft === '2500' ? [] : [10, 6]); c.stroke(path); c.restore();
            });
            // deeper water a touch darker: fill the sea beyond the 1,500-ft line softly (pure decoration, no claim)
            reliefLand(c, land, { ext: 6, seed: 29, relief: 0.4 });
            if (relief) { c.save(); c.clip(land); c.globalAlpha = 0.3; c.globalCompositeOperation = 'multiply'; c.filter = `blur(${1.5 * G_S}px)`; const [w, s, e, n] = cj.relief.box; c.drawImage(relief, pr.X(w), pr.Y(n), pr.X(e) - pr.X(w), pr.Y(s) - pr.Y(n)); c.restore(); }
            c.save(); c.strokeStyle = MP.edge; c.lineWidth = 1.6; c.stroke(land); c.restore();
            // the dry Almanzora (approximate course)
            const rv = G.smooth(ALMANZORA.map(([lo, la]) => [pr.X(lo), pr.Y(la)]), 2);
            c.save(); c.strokeStyle = 'rgba(120,150,170,0.55)'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([2, 10]); c.beginPath(); rv.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore();
            const ri = rv[Math.floor(rv.length * 0.6)], rj = rv[Math.floor(rv.length * 0.6) + 3];
            if (!hidden('river')) { c.save(); c.translate(ri[0], ri[1] - 16); c.rotate(Math.atan2(rj[1] - ri[1], rj[0] - ri[0])); G.text(c, 'Río Almanzora (dry bed, approx.)', 0, 0, { size: 22, weight: 400, fam: F.serif, style: 'italic', align: 'center', color: 'rgba(55,90,115,0.85)' }); c.restore(); }
            // isobath labels: the vertex of each line nearest a reference point out at sea
            Object.entries(cj.depth).forEach(([ft, lines]) => {
              let best = null; lines.forEach(r => { for (let i = 2; i < r.length - 2; i += 2) { const x = pr.X(r[i]), y = pr.Y(r[i + 1]), d = Math.hypot(x - 1500, y - 1010); if (x > 60 && x < 1860 && y > 300 && y < 1040 && (!best || d < best.d)) best = { d, x, y, a: Math.atan2(pr.Y(r[i + 3]) - pr.Y(r[i - 1]), pr.X(r[i + 2]) - pr.X(r[i - 2])) }; } });
              if (!best) return; let a = best.a; if (a > Math.PI / 2) a -= Math.PI; if (a < -Math.PI / 2) a += Math.PI;
              c.save(); c.translate(best.x, best.y); c.rotate(a); const s = `${G.fmt(+ft)} FT`, w = G.measure(c, s, 17, 500, F.mono, 0.08);
              G.rr(c, -w / 2 - 8, -13, w + 16, 26, 6); c.fillStyle = 'rgba(233,238,242,0.92)'; c.fill(); G.text(c, s, 0, 6, { size: 17, weight: 500, fam: F.mono, align: 'center', color: P.tealDeep, track: 0.08 }); c.restore();
            });
            word(c, 'Mediterranean Sea', pr.X(-1.6), pr.Y(37.165), false, 0.9);
            word(c, 'ALMERÍA · SPAIN', pr.X(-1.9), pr.Y(37.18), true);
          } else {
            sea(c, pr);
            const layer = gj[V.data], keys = Object.keys(layer), main = V.main ?? [];
            const far = pathOf(keys.filter(k => !main.includes(k)).flatMap(k => layer[k]), pr, BOX);
            if (main.length) {
              if (V.data !== 'world') { const wk = Object.keys(gj.world).filter(k => !keys.includes(k) && k !== 'GIB'); reliefLand(c, pathOf(wk.flatMap(k => gj.world[k]), pr, BOX), { top: MP.far, top2: MP.far2, ext: 3, seed: 5, relief: 0.4 }); }
              reliefLand(c, far, { top: MP.far, top2: MP.far2, ext: 3, seed: 3, relief: 0.6 });
              const ml = pathOf(main.flatMap(k => layer[k]), pr, BOX);
              reliefLand(c, ml, { ext: 6, seed: 11 });
              c.save(); c.strokeStyle = MP.edge; c.lineWidth = 1.2; c.stroke(far); c.stroke(ml); c.restore();
            } else {
              reliefLand(c, far, { ext: 5, seed: 19 });
              c.save(); c.strokeStyle = MP.border; c.lineWidth = 1; c.lineJoin = 'round'; c.stroke(far); c.restore();
            }
            (Pm.words ?? V.words ?? []).forEach(([s, lo, la, caps]) => word(c, s, pr.X(lo), pr.Y(la), !!caps));
          }
        });
      }
      base(g);
      k.view(1.02);
      const at = (pn) => [pr.X(pn.lon), pr.Y(pn.lat)];
      if (mode === 'coast') {
        // Guest's first search area: a 51-sq-mi wedge from the Almanzora mouth (area per Moran; the shape is illustrative)
        if (Pm.wedge !== false) {
          const kw = E.inOutCubic(range(t, tW, tW + 1.2));
          if (kw > 0) {
            const [ox, oy] = [pr.X(-1.775), pr.Y(37.242)], R = 12.97 / 111.2 * pr.sc, a0 = (95 - 90) * Math.PI / 180, a1 = a0 + (90 * Math.PI / 180) * kw;
            g.save(); g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, R, a0, a1); g.closePath(); g.fillStyle = 'rgba(42,140,134,0.10)'; g.fill(); g.strokeStyle = 'rgba(29,106,102,0.7)'; g.lineWidth = 2.4; g.setLineDash([12, 8]); g.stroke(); g.restore();
            const ka = range(t, tW + 0.8, tW + 1.4), lx = ox + Math.cos(a0 + 0.25) * R - 30, ly = oy + Math.sin(a0 + 0.25) * R;
            G.pill(g, 'FIRST SEA SEARCH AREA · 24 JAN · 51 SQ MI', lx, ly, { size: 17, k: ka, fam: F.mono, weight: 500, fill: P.white, color: P.tealDeep, dot: P.teal, lift: 0.5, align: 'right' });
            G.text(g, 'AREA PER MORAN · SHAPE ILLUSTRATIVE', lx - 12, ly + 38, { size: 13, weight: 500, fam: F.mono, color: P.tealDeep, track: 0.08, align: 'right', alpha: E.outCubic(ka) });
          }
        }
        // bomb 4's find area: the canyon where 2,550-2,850 ft is first reached (37.165-37.185 N, 1.71-1.74 W; reconstruction)
        if (Pm.find !== false) {
          const kf = range(t, tF - 0.3, tF + 0.6);
          if (kf > 0) { const cx = pr.X(-1.725), cy = pr.Y(37.175), rx = 0.015 * pr.kx * pr.sc, ry = 0.01 * pr.sc;
            g.save(); g.globalAlpha = clamp(kf * 2); g.fillStyle = 'rgba(224,36,27,0.08)'; g.beginPath(); g.ellipse(cx, cy, rx * E.outBack(clamp(kf)), ry * E.outBack(clamp(kf)), -0.35, 0, TAU); g.fill(); g.strokeStyle = MP.red; g.lineWidth = 3; g.setLineDash([9, 7]); g.lineDashOffset = -t * 10; g.stroke(); g.restore(); }
        }
        // towns and the beach
        const kt = (i) => range(t, 0.5 + i * 0.18, 1.0 + i * 0.18);
        if (!hidden('Palomares')) town(g, ...at(pinOf('Palomares')), kt(0), 'Palomares', { side: 'l', dy: -46, size: 34, sub: Pm.townSub === undefined ? 'POP. ABOUT 2,000 IN 1966' : Pm.townSub, dot: false });
        if (!hidden('Villaricos')) town(g, ...at(pinOf('Villaricos')), kt(1), 'Villaricos', { side: 'r', dy: -22 });
        if (!hidden('Garrucha')) town(g, ...at(pinOf('Garrucha')), kt(2), 'Garrucha', { side: 'l', sub: 'PRESS BOATS' });
        if (!hidden('Camp Wilson beach')) town(g, ...at(pinOf('Camp Wilson beach')), kt(4), 'Camp Wilson beach', { side: 'r', dy: 20, size: 22, sub: 'THE 8 MAR SWIM (AFTERNOON)' });
        // Águilas, off the top edge: an arrow
        { const ka = hidden('Águilas') ? 0 : kt(5); if (ka > 0) { const x = 1860, y = 300; g.save(); g.globalAlpha = clamp(ka * 2); g.strokeStyle = P.ink; g.fillStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 30, y + 30); g.lineTo(x, y); g.stroke(); g.beginPath(); g.moveTo(x + 4, y - 4); g.lineTo(x - 14, y - 2); g.lineTo(x - 2, y + 10); g.closePath(); g.fill(); g.restore();
          G.text(g, 'Águilas', x - 44, y + 44, { size: 26, weight: 800, align: 'right', color: P.ink, alpha: ka }); G.text(g, 'SIMÓ’S HOME PORT', x - 44, y + 68, { size: 15, weight: 500, fam: F.mono, align: 'right', color: P.inkSoft, track: 0.08, alpha: ka }); } }
        // bombs 1-3: numbered discs
        LAND_BOMBS.forEach((b, i) => {
          const kb = E.outBack(range(t, 1.1 + i * 0.3, 1.6 + i * 0.3)); if (kb <= 0) return; const x = pr.X(b.lon), y = pr.Y(b.lat);
          g.save(); g.translate(x, y); g.scale(kb, kb); G.shadow(g, 0.6); g.fillStyle = P.ink; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill(); G.noShadow(g);
          g.strokeStyle = P.white; g.lineWidth = 3; g.stroke(); G.text(g, String(b.n), 0, 8, { size: 22, weight: 800, align: 'center', color: P.white }); g.restore();
        });
        // legend card for 1-3 (bottom left)
        if (Pm.legend !== false) {
          const kl = range(t, 1.6, 2.3); if (kl > 0) {
            const x0 = 70, y0 = 790, w = 610, h = 210;
            g.save(); g.globalAlpha = E.outCubic(kl); g.translate(0, (1 - E.outCubic(kl)) * 20); G.card(g, x0, y0, w, h, { r: 16, lift: 0.9, grainA: 0 });
            G.text(g, 'THE THREE BOMBS ON LAND', x0 + 28, y0 + 42, { size: 16, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12 });
            LAND_BOMBS.forEach((b, i) => { const yy = y0 + 86 + i * 44; g.fillStyle = P.ink; g.beginPath(); g.arc(x0 + 44, yy - 8, 15, 0, TAU); g.fill(); G.text(g, String(b.n), x0 + 44, yy - 1, { size: 19, weight: 800, align: 'center', color: P.white }); G.text(g, b.text, x0 + 74, yy - 1, { size: 17, weight: 500, fam: F.mono, color: P.ink, track: 0.04 }); });
            g.restore();
          }
        }
      }
      // routes (spain: tankers from Morón; world: the Chrome Dome loop)
      routes.forEach(r => route(g, at(pins[r.ia]), at(pins[r.ib]), t, range(t, r.t, r.t + 1.2), { bow: mode === 'spain' ? 0.12 : 0.28 }));
      if (mode === 'world' && !Pm.routes) {
        const a = at(pinOf('Seymour Johnson AFB')), b = at(pinOf('Palomares')), east = [pr.X(21), pr.Y(35.4)], tr = PT[1] + 0.4;
        route(g, a, b, t, range(t, tr, tr + 1.6), { bow: 0.16 });
        const e1 = route(g, b, east, t, range(t, tr + 1.6, tr + 2.6), { bow: 0.12, head: false, dash: [6, 10] });
        const ke = range(t, tr + 2.4, tr + 3.0); if (ke > 0) { G.text(g, 'TOWARD THE SOVIET FRONTIER …', 1860, east[1] + 90, { size: 18, weight: 500, fam: F.mono, align: 'right', color: P.inkSoft, track: 0.1, alpha: E.outCubic(ke) }); }
        route(g, east, a, t, range(t, tr + 3.0, tr + 4.4), { bow: -0.1, color: P.tealDeep, dash: [4, 12], width: 3 });
        const kh = range(t, tr + 4.0, tr + 4.6); if (kh > 0) G.text(g, '… AND HOME, 24 HOURS LATER', pr.X(-30), pr.Y(29.2), { size: 18, weight: 500, fam: F.mono, align: 'center', color: P.tealDeep, track: 0.1, alpha: E.outCubic(kh) });
      }
      // pins and labels
      pins.forEach((pn, i) => {
        const [x, y] = at(pn), kk = range(t, PT[i], PT[i] + 0.7);
        teardrop(g, x, y, t, kk, { R: 20, color: pn.color ?? (isRed(pn) ? MP.red : P.ink) });
        label(g, x, y - 36, range(t, PT[i] + 0.25, PT[i] + 0.75), pn.name, pn.sub, pn.side ?? (x > 1500 ? 'l' : 'r'), pn.dy ?? 0);
      });
      k.flat();
      const hg = g.createLinearGradient(0, 0, 0, 260); hg.addColorStop(0, 'rgba(247,246,241,0.94)'); hg.addColorStop(0.7, 'rgba(247,246,241,0.6)'); hg.addColorStop(1, 'rgba(247,246,241,0)'); g.fillStyle = hg; g.fillRect(0, 0, 1920, 260);
      G.kicker(g, Pm.kicker ?? V.kicker, 90, 110, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? V.title, 90, 186, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      G.source(g, Pm.source ?? V.src, range(t, 0.6, 1.4), { y: 1046, size: mode === 'coast' ? 13 : 16 });
    }, { push: 0.045, dx: 20, dy: 8, fx: 960, fy: 560 });
  }

  return { map };
}
