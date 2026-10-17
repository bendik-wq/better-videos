// Panama bright maps: a 2.5D paper-cut map system and the El Niño card. 2D canvas, real coastlines.
//   map     views: world | americas | isthmus | watershed | telegraph
//           params: view, from (a view to zoom from), pins [{ name, lon, lat, word, sub, color }], labels (keys or
//           objects { name, lon, lat, kind: 'pill'|'sea'|'lake'|'place', word }), routes (true | ['panama','suez','cape']),
//           highlight ('PAN' | ['PAN','USA']), canal (bool), title, source, cam
//   elnino  params: mode 'full' | 'map' | 'odds', odds (83), odds2 (70), at (word for the needle), source
// Geography: projects/panama/assets/geo/panama.json (Natural Earth, public domain; lakes © OpenStreetMap contributors,
// ODbL), built by assets/geo/build.py. Paper-cut look: land in paper #ece3d1 lifted on a soft shadow with a #cbbd9f
// cut edge, a pale shelf halo on turquoise water; labels in white pills; one red accent.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;
let GEO = null;
const geo = () => GEO ??= fetch('/projects/panama/assets/geo/panama.json').then(r => r.json());

// view boxes [lonW, latS, lonE, latN]
const VIEWS = {
  world: { box: [-240, -48, 162, 66], data: 'world', shift: -360 },
  americas: { box: [-128, -42, -30, 52], data: 'americas' },
  isthmus: { box: [-80.32, 8.8, -79.38, 9.44], data: 'isthmus' },
  watershed: { box: [-80.42, 8.78, -79.12, 9.5], data: 'isthmus' },
  telegraph: { box: [-106, 4, -62, 48], data: 'americas' },
  caribbean: { box: [-100, 2, -58, 32], data: 'americas' },
};
const PLACES = {
  colon: { name: 'Colón', lon: -79.9, lat: 9.36, kind: 'place' },
  'panama-city': { name: 'Panama City', lon: -79.52, lat: 8.98, kind: 'place' },
  gatun: { name: 'Gatun Lake', lon: -79.86, lat: 9.15, kind: 'lake' },
  alhajuela: { name: 'Lake Alhajuela', lon: -79.6, lat: 9.24, kind: 'lake' },
  'rio-indio': { name: 'Río Indio (planned reservoir)', lon: -80.13, lat: 9.0, kind: 'pin', sub: 'SITE APPROX.' },
  'gatun-locks': { name: 'Gatun Locks', lon: -79.92, lat: 9.27, kind: 'place' },
  miraflores: { name: 'Miraflores Locks', lon: -79.59, lat: 9.015, kind: 'place' },
  gamboa: { name: 'Gamboa', lon: -79.69, lat: 9.115, kind: 'place' },
  caribbean: { name: 'Caribbean Sea', lon: -79.75, lat: 9.38, kind: 'sea' },
  pacific: { name: 'Pacific Ocean', lon: -79.75, lat: 8.84, kind: 'sea' },
  'pacific-w': { name: 'Pacific Ocean', lon: -150, lat: 12, kind: 'sea' },
  atlantic: { name: 'Atlantic Ocean', lon: -40, lat: 28, kind: 'sea' },
  panama: { name: 'PANAMA', lon: -79.6, lat: 8.6, kind: 'place' },
};
const DEFAULT_LABELS = {
  world: ['pacific-w', 'atlantic'], americas: ['panama'], telegraph: [],
  isthmus: ['caribbean', 'pacific', 'colon', 'panama-city', 'gatun', 'alhajuela', 'rio-indio'],
  watershed: ['caribbean', 'pacific', 'gatun', 'alhajuela'],
};
// the canal watershed, a hand-drawn approximation (labelled APPROX. on screen)
const WATERSHED = [[-80.13, 9.1], [-80.06, 9.22], [-79.95, 9.27], [-79.83, 9.3], [-79.7, 9.33], [-79.55, 9.37], [-79.42, 9.42], [-79.28, 9.4], [-79.2, 9.31], [-79.27, 9.21], [-79.4, 9.13], [-79.53, 9.06], [-79.62, 8.99], [-79.74, 8.93], [-79.88, 8.9], [-80.02, 8.93], [-80.11, 8.99]];
// EIA (2016): LNG, US Gulf Coast -> Japan at 19.5 kn: Panama 20 d, Suez 31 d, Cape of Good Hope 34 d
const HOUSTON = [-94.9, 29.3];
const ROUTES = {
  panama: { days: 20, label: 'VIA PANAMA', color: P.red, pts: [HOUSTON, [-90, 25.5], [-86, 21.6], [-82, 14], [-79.9, 9.6], [-79.6, 8.7], [-86, 9], [-110, 15], [-135, 26], [-160, 33], [-185, 37], [-205, 36.5], [-219.9, 35.4]] },
  suez: { days: 31, label: 'VIA SUEZ', color: P.ink, pts: [HOUSTON, [-88, 25.4], [-81, 24.1], [-72, 30], [-45, 36], [-12, 36.2], [-5.6, 35.95], [8, 37.6], [20, 34], [32.3, 31.4], [32.6, 29.6], [36, 24], [41, 15.5], [43.4, 12.5], [52, 12.8], [70, 9], [80, 5.6], [92, 6], [98.5, 4], [103.6, 1.3], [109, 7], [116, 15], [124, 24], [131, 30], [140.1, 35.4]] },
  cape: { days: 34, label: 'VIA THE CAPE', color: P.inkSoft, pts: [HOUSTON, [-88, 25.4], [-81, 24.1], [-66, 24], [-40, 12], [-20, -6], [-2, -24], [14, -34], [20, -36.5], [36, -34], [60, -25], [85, -12], [104, -8], [115.8, -8.6], [119, -2], [124, 9], [128, 20], [134, 29], [140.1, 35.4]] },
};

export default function makeMaps(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- projection
  function proj(box, rect = [0, 0, 1920, 1080], pad = 1) {
    const [w, s, e, n] = box, kx = Math.cos(((s + n) / 2) * Math.PI / 180);
    const sc = Math.min(rect[2] / ((e - w) * kx), rect[3] / (n - s)) * pad;
    const cx = (w + e) / 2, cy = (s + n) / 2;
    return { X: (lon) => rect[0] + rect[2] / 2 + (lon - cx) * kx * sc, Y: (lat) => rect[1] + rect[3] / 2 - (lat - cy) * sc, sc, kx };
  }
  const lerpBox = (a, b, u) => { // zoom in log scale (centre and size)
    const ca = [(a[0] + a[2]) / 2, (a[1] + a[3]) / 2], cb = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    const wa = a[2] - a[0], wb = b[2] - b[0], ha = a[3] - a[1], hb = b[3] - b[1];
    const z = Math.exp(lerp(Math.log(wa), Math.log(wb), u)), zh = Math.exp(lerp(Math.log(ha), Math.log(hb), u));
    const k = (z - wa) / ((wb - wa) || 1); const c = [lerp(ca[0], cb[0], clamp(k)), lerp(ca[1], cb[1], clamp(k))];
    return [c[0] - z / 2, c[1] - zh / 2, c[0] + z / 2, c[1] + zh / 2];
  };
  function landPath(rings, pr, shifts = [0], box = null) {
    const path = new Path2D();
    for (const r of rings) for (const sh of shifts) {
      if (box) { let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9; for (let i = 0; i < r.length; i += 2) { const lo = r[i] + sh; if (lo < lo0) lo0 = lo; if (lo > lo1) lo1 = lo; if (r[i + 1] < la0) la0 = r[i + 1]; if (r[i + 1] > la1) la1 = r[i + 1]; }
        const mx = (box[2] - box[0]) * 0.15, my = (box[3] - box[1]) * 0.15; if (lo1 < box[0] - mx || lo0 > box[2] + mx || la1 < box[1] - my || la0 > box[3] + my) continue; }
      path.moveTo(pr.X(r[0] + sh), pr.Y(r[1])); for (let i = 2; i < r.length; i += 2) path.lineTo(pr.X(r[i] + sh), pr.Y(r[i + 1])); path.closePath();
    }
    return path;
  }
  // paper-cut land: shelf halo, shadow, cut edge, top, grain, coast line
  function paperLand(g, path, { ext = 5, lift = 1, top = P.land, side = P.landSide, shelf = true, shelfW = 16, edge = P.landEdge, grainA = 0.4, S = 1 } = {}) {
    if (shelf) { g.save(); g.lineJoin = 'round'; g.strokeStyle = P.shelf; g.lineWidth = shelfW; g.stroke(path); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = shelfW * 0.35; g.stroke(path); g.restore(); }
    g.save(); G.shadow(g, lift); g.translate(0, ext); g.fillStyle = side; g.fill(path); G.noShadow(g); g.restore();
    g.save(); g.fillStyle = top; g.fill(path); g.clip(path); G.grain(g, 2400, 1500, grainA, -240, -210);
    // a light from the upper left: soft highlight on the top face
    const gr = g.createLinearGradient(0, 0, 1920, 1080); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(120,96,60,0.06)'); g.fillStyle = gr; g.fillRect(-240, -210, 2400, 1500);
    g.restore();
    g.save(); g.strokeStyle = edge; g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke(path); g.restore();
  }
  function sea(g, t, { tone = P.water, deep = P.waterDeep } = {}) {
    const gr = g.createLinearGradient(0, -200, 0, 1300); gr.addColorStop(0, '#8fd3ce'); gr.addColorStop(1, deep); g.fillStyle = gr; g.fillRect(-240, -210, 2400, 1500);
    // faint swell lines
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 2; const r = rng(4);
    for (let i = 0; i < 46; i++) { const x = -200 + r() * 2300, y = -150 + r() * 1350, L = 40 + r() * 90, ph = (t * 0.12 + r()) % 1; g.globalAlpha = Math.sin(ph * Math.PI); g.beginPath(); g.moveTo(x + ph * 20, y); g.quadraticCurveTo(x + L / 2 + ph * 20, y - 6, x + L + ph * 20, y); g.stroke(); }
    g.restore(); G.grain(g, 2400, 1500, 0.25, -240, -210);
  }
  const resolveLabel = (l) => (typeof l === 'string' ? PLACES[l] : l);
  function drawLabel(g, l, pr, t, kk) {
    if (!l || kk <= 0) return; const x = pr.X(l.lon), y = pr.Y(l.lat);
    if (l.kind === 'sea') G.text(g, l.name, x, y, { size: l.size ?? 44, weight: 400, fam: F.serif, style: 'italic', color: P.waterDark, align: 'center', alpha: E.outCubic(kk) * 0.9 });
    else if (l.kind === 'lake') { g.save(); g.shadowColor = 'rgba(20,70,75,0.6)'; g.shadowBlur = 8; G.text(g, l.name, x, y, { size: l.size ?? 50, weight: 400, fam: F.serif, style: 'italic', color: P.white, align: 'center', alpha: E.outCubic(kk) }); g.restore(); }
    else if (l.kind === 'pin') { G.pin(g, x, y, t, kk, { color: l.color ?? P.red }); G.pill(g, l.name, x + 26, y, { size: l.size ?? 28, k: kk }); if (l.sub) G.text(g, l.sub, x + 30, y + 46, { size: 18, weight: 500, fam: F.mono, color: P.ink, track: 0.1, alpha: E.outCubic(kk) }); }
    else { g.fillStyle = P.ink; g.beginPath(); g.arc(x, y, 7 * clamp(kk * 2), 0, TAU); g.fill(); G.pill(g, l.name, x + (l.dx ?? 18), y + (l.dy ?? 0), { size: l.size ?? 28, k: kk, align: l.align ?? 'left' }); }
  }
  function canalLine(gj) {
    const [a, b, c] = gj.canal; const pts = [];
    pts.push([-79.918, 9.385]); const rev = (l) => { const o = []; for (let i = l.length - 2; i >= 0; i -= 2) o.push([l[i], l[i + 1]]); return o; };
    pts.push(...rev(b), ...rev(a).slice(1)); for (let i = 2; i < c.length; i += 2) pts.push([c[i], c[i + 1]]); pts.push([-79.535, 8.885]);
    return pts;
  }

  // ---------------------------------------------------------------- map
  async function map(ctx, shot) {
    const Pm = shot.params ?? {}, view = Pm.view ?? 'isthmus', V = VIEWS[view] ?? VIEWS.isthmus, D = shot.duration ?? 8;
    const gj = await geo();
    const from = Pm.from ? (VIEWS[Pm.from]?.box ?? Pm.from) : null, zoomDur = Pm.zoomDur ?? Math.min(3, D * 0.4);
    const boxAt = (t) => (from ? lerpBox(from, Pm.box ?? V.box, E.inOutCubic(range(t, 0.1, 0.1 + zoomDur))) : (Pm.box ?? V.box));
    const labels = (Pm.labels ?? DEFAULT_LABELS[view] ?? []).map(resolveLabel).filter(Boolean);
    const LT = G.cues(shot, labels, { from: from ? zoomDur * 0.8 : 0.5, span: Math.min(2.4, D * 0.35) });
    const pins = (Pm.pins ?? []).map(resolveLabel).filter(Boolean).map(p => ({ kind: 'pin', ...p }));
    const PT = G.cues(shot, pins, { from: 1.0, span: Math.min(2.4, D * 0.4) });
    const hl = [].concat(Pm.highlight ?? (view === 'americas' || view === 'telegraph' ? 'PAN' : [])).filter(Boolean);
    const routeKeys = Pm.routes === true || (view === 'world' && Pm.routes == null) ? ['panama', 'suez', 'cape'] : (Pm.routes ?? []);
    const routes = routeKeys.map(k => (typeof k === 'string' ? { key: k, ...ROUTES[k] } : k)).filter(r => r.pts);
    const rT0 = G.cue(shot, Pm.routesAt, 0.6), rSpan = Pm.routeSpan ?? Math.max(3, D - rT0 - 2.4);
    const showCanal = Pm.canal ?? (view === 'isthmus' || view === 'watershed');
    const canal = showCanal ? canalLine(gj) : null; const cT = G.cue(shot, Pm.canalAt, 0.6);
    const dataKey = Pm.data ?? V.data, set0 = gj[dataKey];
    const rings = Object.values(set0).flat(), hlRings = hl.flatMap(c => set0[c] ?? []);
    const shifts = V.shift ? [0, V.shift] : [0];
    const lakes = view === 'isthmus' || view === 'watershed' ? [...(gj.lakes.gatun ?? []), ...(gj.lakes.alhajuela ?? [])] : [];
    return set(ctx, shot, (g, t, p, k) => {
      const box = boxAt(t), pr = proj(box);
      // 2.5D: the sea sits deeper than the land, labels float above (parallax on the camera drift)
      k.view(0.7); sea(g, t);
      k.view(1);
      const land = landPath(rings, pr, shifts, box);
      const ext = view === 'world' ? 3 : view === 'americas' || view === 'telegraph' ? 4 : 7;
      paperLand(g, land, { ext, lift: view === 'world' ? 0.5 : 0.9, shelfW: view === 'world' ? 8 : 16 });
      // country borders, faint
      if (view !== 'isthmus' && view !== 'watershed') { g.save(); g.strokeStyle = 'rgba(27,36,48,0.13)'; g.lineWidth = 1.1; g.stroke(land); g.restore(); }
      // highlight: the country lifts off the sheet in sun yellow
      if (hlRings.length) {
        const kh = E.outBack(range(t, 0.4, 1.2)), hp = landPath(hlRings, pr, shifts, box);
        g.save(); g.translate(0, -10 * kh); paperLand(g, hp, { ext: ext + 10 * kh, lift: 0.4 + 1.2 * kh, top: kh > 0 ? '#ffe28a' : P.land, side: '#e2b84f', shelf: false, edge: '#c99a2e', grainA: 0.3 }); g.restore();
      }
      // lakes cut into the paper
      if (lakes.length) {
        const lp = landPath(lakes, pr);
        g.save(); g.fillStyle = P.water; g.fill(lp); g.clip(lp);
        g.shadowColor = 'rgba(40,60,50,0.35)'; g.shadowBlur = 10 * k.S; g.shadowOffsetY = 5 * k.S; g.strokeStyle = P.landSide; g.lineWidth = 6; g.stroke(lp); g.restore();
        g.save(); g.strokeStyle = 'rgba(47,127,132,0.6)'; g.lineWidth = 1.2; g.stroke(lp); g.restore();
      }
      // watershed: shaded catchment, clouds and rain
      if (view === 'watershed') {
        const kw = range(t, 0.3, 1.2), wp = new Path2D(); WATERSHED.forEach(([lo, la], i) => (i ? wp.lineTo(pr.X(lo), pr.Y(la)) : wp.moveTo(pr.X(lo), pr.Y(la)))); wp.closePath();
        g.save(); g.globalAlpha = 0.28 * kw; g.fillStyle = P.waterDeep; g.fill(wp); g.globalAlpha = kw; g.setLineDash([14, 10]); g.strokeStyle = P.waterDark; g.lineWidth = 4; g.stroke(wp); g.setLineDash([]);
        g.clip(wp); G.rain(g, -100, -100, 2200, 1300, t, { n: 420, color: `rgba(31,95,110,${0.55 * kw})`, len: 30, width: 2.6, speed: 700 }); g.restore();
        // paper clouds drifting over the catchment
        g.save(); const cr = rng(12);
        for (let i = 0; i < 3; i++) { const cx = pr.X(-80.35 + i * 0.42 + cr() * 0.1) + t * (14 + cr() * 10), cy = pr.Y(9.47) - 10 + cr() * 30, s = 0.45 + cr() * 0.25;
          G.shadow(g, 1.4, 0.8); g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); for (const [ox, oy, r] of [[-90, 14, 55], [-20, -14, 78], [60, 2, 62], [120, 22, 42], [10, 30, 60]]) { g.moveTo(cx + ox * s + r * s, cy + oy * s); g.arc(cx + ox * s, cy + oy * s, r * s, 0, TAU); } g.fill(); G.noShadow(g); }
        g.restore();
      }
      // the canal
      if (canal) {
        const pts = canal.map(([lo, la]) => [pr.X(lo), pr.Y(la)]), cum = G.polyLen(pts), kc = E.inOutCubic(range(t, cT, cT + Math.min(2.2, D * 0.35)));
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = P.white; g.lineWidth = 13; G.drawPoly(g, pts, cum, kc); g.strokeStyle = P.red; g.lineWidth = 6; const e = G.drawPoly(g, pts, cum, kc); g.restore();
        if (e && kc < 1) G.shipTop(g, e.x, e.y, 30, e.ang, { color: P.white });
        if (kc >= 1 && Pm.canalLabel !== false) G.slab(g, 'THE CANAL', pr.X(-79.66), pr.Y(9.06) + 46, { size: 26, k: range(t, cT + 2.3, cT + 2.8), fill: P.red });
      }
      // routes (EIA 2016)
      if (routes.length) {
        const secPerDay = rSpan / Math.max(...routes.map(r => r.days));
        const jp = [[140.1, 35.4], [-219.9, 35.4]];
        jp.forEach(([lo, la]) => G.pin(g, pr.X(lo), pr.Y(la), t, range(t, 0.3, 0.8), { color: P.ink, pulse: false }));
        G.pill(g, 'JAPAN', pr.X(140.1) - 22, pr.Y(35.4) - 40, { size: 26, k: range(t, 0.4, 0.9), align: 'right' }); G.pill(g, 'JAPAN', pr.X(-219.9) + 22, pr.Y(35.4) - 40, { size: 26, k: range(t, 0.4, 0.9) });
        G.pin(g, pr.X(HOUSTON[0]), pr.Y(HOUSTON[1]), t, range(t, 0.2, 0.7), { color: P.red });
        G.pill(g, 'US GULF COAST', pr.X(HOUSTON[0]), pr.Y(HOUSTON[1]) - 42, { size: 26, k: range(t, 0.3, 0.8), align: 'center' });
        routes.forEach((r, ri) => {
          const pts = G.smooth(r.pts.map(([lo, la]) => [pr.X(lo), pr.Y(la)]), 3), cum = G.polyLen(pts);
          const el = (t - rT0) / secPerDay, kk = clamp(el / r.days);
          if (el <= 0) return;
          g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 9; G.drawPoly(g, pts, cum, kk);
          g.strokeStyle = r.color; g.lineWidth = r.key === 'panama' ? 6 : 4.5; if (r.key === 'cape') g.setLineDash([12, 9]); const e = G.drawPoly(g, pts, cum, kk); g.restore();
          if (!e) return;
          if (kk < 1) {
            G.shipTop(g, e.x, e.y, 34, e.ang, { color: P.white, edge: r.color });
            G.pill(g, `DAY ${Math.floor(el) + 1}`, e.x, e.y - 40, { size: 24, align: 'center', fill: r.color, color: P.white, k: 1 });
          } else {
            const end = pts.at(-1), ly = end[1] + (r.key === 'panama' ? 60 : r.key === 'suez' ? 60 : 130);
            G.pill(g, `${r.days} DAYS · ${r.label}`, r.key === 'panama' ? end[0] + 6 : end[0] - 6, ly, { size: 28, k: range(t, rT0 + r.days * secPerDay, rT0 + r.days * secPerDay + 0.5), fill: r.key === 'panama' ? P.red : P.white, color: r.key === 'panama' ? P.white : P.ink, dot: r.key === 'panama' ? P.sun : r.color, weight: 800, align: r.key === 'panama' ? 'left' : 'right' });
          }
        });
      }
      // telegraph, 10 Oct 1913: Washington -> New York -> Galveston -> submarine cable -> Panama (schematic)
      if (view === 'telegraph') telegraph(g, t, pr, Pm, shot, D);
      // labels and pins float a little above the sheet
      k.view(1.15);
      labels.forEach((l, i) => drawLabel(g, l, pr, t, range(t, LT[i], LT[i] + 0.5)));
      pins.forEach((pn, i) => drawLabel(g, pn, pr, t, range(t, PT[i], PT[i] + 0.5)));
      if (view === 'watershed') {
        const kc = range(t, G.cue(shot, Pm.infoAt, 1.4), G.cue(shot, Pm.infoAt, 1.4) + 0.6);
        G.card(g, 1220, 700, 600, 290, { r: 24, lift: 1.2, alpha: clamp(kc * 2) });
        if (kc > 0) {
          G.text(g, 'RAIN ON THE WATERSHED', 1255, 752, { size: 22, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12, alpha: kc });
          G.text(g, '≈ 2.6 m', 1252, 850, { size: 92, weight: 900, color: P.waterDark, alpha: kc });
          G.text(g, 'A YEAR (≈104 IN) · 1950–2023 AVG', 1256, 900, { size: 26, weight: 800, alpha: kc });
          G.text(g, 'MOST FALLS MAY – DEC · DRY JAN – APR', 1256, 948, { size: 24, weight: 600, color: P.inkSoft, alpha: kc });
        }
        G.pill(g, 'CANAL WATERSHED (OUTLINE APPROX.)', pr.X(-79.32), pr.Y(9.44) - 34, { size: 24, k: range(t, 0.6, 1.2), fill: P.white, dot: P.waterDeep, align: 'center' });
      }
      if (view === 'isthmus' && (Pm.tunnel ?? true) && labels.some(l => l?.name?.startsWith('Río Indio'))) {
        const kt = range(t, LT[labels.findIndex(l => l?.name?.startsWith('Río Indio'))] + 0.4, LT[labels.findIndex(l => l?.name?.startsWith('Río Indio'))] + 1.4);
        if (kt > 0) { g.save(); g.setLineDash([10, 8]); g.strokeStyle = P.red; g.lineWidth = 4; g.beginPath(); g.moveTo(pr.X(-80.13), pr.Y(9.0)); g.lineTo(lerp(pr.X(-80.13), pr.X(-80.04), E.outCubic(kt)), lerp(pr.Y(9.0), pr.Y(9.05), E.outCubic(kt))); g.stroke(); g.restore();
          G.text(g, '9 KM TUNNEL', pr.X(-80.1), pr.Y(9.0) + 74, { size: 20, weight: 600, fam: F.mono, color: P.red, track: 0.1, alpha: kt }); }
      }
      k.flat();
      if (Pm.title) { G.card(g, 90, 70, Math.min(1100, G.measure(g, Pm.title, 52, 800) + 120), 120, { r: 20, lift: 1, alpha: clamp(range(t, 0.1, 0.6) * 2) }); G.riseText(g, Pm.title, 140, 148, range(t, 0.15, 0.9), { size: 52, weight: 800 }); }
      const src = Pm.source ?? (routes.length ? 'SOURCE: US EIA (2016), LNG AT 19.5 KNOTS · MAP: NATURAL EARTH' : view === 'watershed' ? 'RAIN: ACP DATA (S37) · MAP: NATURAL EARTH; LAKES © OPENSTREETMAP CONTRIBUTORS' : view === 'isthmus' ? 'MAP: NATURAL EARTH; LAKES © OPENSTREETMAP CONTRIBUTORS · RÍO INDIO: ACP' : 'MAP: NATURAL EARTH');
      g.save(); const sw = G.measure(g, src, 17, 500, F.mono, 0.1); G.rr(g, 1856 - sw - 20, 1014, sw + 36, 38, 8); g.fillStyle = 'rgba(255,253,248,0.85)'; g.fill(); g.restore();
      G.source(g, src, range(t, 0.6, 1.4), { size: 17, y: 1040 });
    }, { push: from || view === 'world' ? 0.02 : 0.06, dx: view === 'world' ? 10 : 30, dy: 10 });
  }

  function telegraph(g, t, pr, Pm, shot, D) {
    const pts = { dc: [-77.04, 38.9], ny: [-74.0, 40.71], gal: [-94.8, 29.3], pan: [-79.69, 9.12] };
    const P2 = (k) => [pr.X(pts[k][0]), pr.Y(pts[k][1])];
    const arc = (a, b, bend) => { const [x0, y0] = a, [x1, y1] = b, mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend; const o = []; for (let i = 0; i <= 40; i++) { const u = i / 40; o.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1]); } return o; };
    const legs = [{ p: arc(P2('dc'), P2('ny'), -0.25), kind: 'land' }, { p: arc(P2('ny'), P2('gal'), 0.12), kind: 'land' }, { p: arc(P2('gal'), P2('pan'), 0.18), kind: 'cable' }];
    const t0 = G.cue(shot, Pm.signalAt, 1.2), span = Pm.signalSpan ?? Math.max(3, Math.min(6, D - t0 - 2.5));
    const lens = legs.map(l => G.polyLen(l.p)), tot = lens.reduce((a, c) => a + c.at(-1), 0);
    const u = E.inOutSine(range(t, t0, t0 + span)); let acc = 0, head = null;
    legs.forEach((l, i) => {
      const L = lens[i].at(-1), kk = clamp((u * tot - acc) / L); acc += L;
      g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(27,36,48,0.18)'; g.lineWidth = 4; if (l.kind === 'cable') g.setLineDash([10, 9]); G.drawPoly(g, l.p, lens[i], 1);
      g.strokeStyle = l.kind === 'cable' ? P.waterDark : P.ink; g.lineWidth = 5; const e = G.drawPoly(g, l.p, lens[i], kk); g.restore();
      if (kk > 0 && kk < 1) head = e;
    });
    if (head) { // the pulse: a yellow spark with a halo
      const gr = g.createRadialGradient(head.x, head.y, 0, head.x, head.y, 46); gr.addColorStop(0, 'rgba(255,210,63,0.95)'); gr.addColorStop(1, 'rgba(255,210,63,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(head.x, head.y, 46, 0, TAU); g.fill(); g.fillStyle = P.white; g.beginPath(); g.arc(head.x, head.y, 9, 0, TAU); g.fill();
    }
    const nodes = [['dc', 'WASHINGTON', -1, 0.2], ['ny', 'NEW YORK', 1, 0.4], ['gal', 'GALVESTON', -1, 0.6], ['pan', 'GAMBOA, PANAMA', 1, 0.8]];
    nodes.forEach(([key, name, side, at]) => { const [x, y] = P2(key); G.pin(g, x, y, t, range(t, at, at + 0.4), { color: key === 'pan' ? P.red : P.ink, pulse: key === 'pan' }); G.pill(g, name, x + side * 26, y, { size: 28, k: range(t, at + 0.1, at + 0.5), align: side < 0 ? 'right' : 'left' }); });
    const [gx, gy] = P2('gal'), [px, py] = P2('pan');
    G.text(g, 'SUBMARINE CABLE', (gx + px) / 2 + 60, (gy + py) / 2 - 10, { size: 22, weight: 600, fam: F.mono, color: P.waterDark, track: 0.12, alpha: range(t, t0 + span * 0.5, t0 + span * 0.7) });
    const kb = range(t, t0 + span, t0 + span + 0.9);
    if (kb > 0) { // the blast at Gamboa
      for (let i = 0; i < 3; i++) { const q = clamp(kb * 1.4 - i * 0.2); g.strokeStyle = `rgba(224,36,27,${0.8 * (1 - q)})`; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 20 + q * 140, 0, TAU); g.stroke(); }
      G.slab(g, 'GAMBOA DIKE BLOWN', px + 40, py - 70, { size: 30, fill: P.red, k: range(t, t0 + span + 0.2, t0 + span + 0.8) });
    }
    G.card(g, 90, 840, 590, 150, { r: 20, lift: 1, alpha: clamp(range(t, 0.1, 0.6) * 2) });
    G.text(g, '10 OCT 1913', 130, 910, { size: 54, weight: 900, color: P.red, alpha: range(t, 0.2, 0.7) });
    G.text(g, 'JUST AFTER 2 P.M., WASHINGTON', 132, 956, { size: 26, weight: 700, alpha: range(t, 0.3, 0.8) });
    G.text(g, 'ROUTE SCHEMATIC', 1830, 990, { size: 18, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12, align: 'right' });
  }

  // ---------------------------------------------------------------- elnino
  // A stylised SST-anomaly map: a warm tongue along the equator, strongest in the east, matching the NOAA CPC weekly
  // anomalies quoted in RESEARCH (Niño-3.4 +2.1, Niño-3 +3.0, Niño-1+2 +3.9 °C). Labelled STYLISED on screen.
  const BANDS = [[0.5, '#fff3c4'], [1.0, '#ffe08f'], [1.5, '#ffc56b'], [2.0, '#ffa652'], [2.5, '#f98244'], [3.0, '#ef5d37'], [3.5, '#dc3a2b']];
  function field(lon, lat) { // degrees east, 0..360
    const e = sstep(165, 278, lon), wl = sstep(150, 185, lon) * (1 - sstep(281, 290, lon));
    const amp = 1.0 + 3.1 * e, sig = lerp(10, 6, e), c = lerp(0, -3, e);
    const cold = -0.7 * Math.exp(-(((lon - 140) / 14) ** 2) - (((Math.abs(lat) - 14) / 7) ** 2));
    return amp * wl * Math.exp(-(((lat - c) / sig) ** 2) / 2) + cold;
  }
  async function elnino(ctx, shot) {
    const Pm = shot.params ?? {}, mode = Pm.mode ?? 'full', D = shot.duration ?? 8, gj = await geo();
    const odds = Pm.odds ?? 83, odds2 = Pm.odds2 ?? 70, tN = G.cue(shot, Pm.at, 1.0);
    const rect = mode === 'map' ? [0, 0, 1920, 1080] : [70, 160, 1180, 760];
    const box = [118, -30, 292, 30];
    const world = Object.values(gj.world).flat();
    const fw = 290, fh = 100, FLD = new Float32Array(fw * fh);
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) FLD[j * fw + i] = field(box[0] + (i + 0.5) / fw * (box[2] - box[0]), box[3] - (j + 0.5) / fh * (box[3] - box[1]));
    const masks = BANDS.map(() => G.mk(fw, fh));
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      const grow = E.inOutSine(range(t, 0.2, Math.min(D * 0.6, 4.5))) * 0.85 + 0.15;
      if (mode !== 'odds') {
        k.view(1);
        g.save(); if (mode !== 'map') { G.card(g, rect[0], rect[1], rect[2], rect[3], { r: 28, lift: 1.3, grainA: 0 }); G.rr(g, rect[0], rect[1], rect[2], rect[3], 28); g.clip(); }
        const pr = proj(box, rect);
        g.fillStyle = '#cfeaee'; g.fillRect(rect[0] - 10, rect[1] - 10, rect[2] + 20, rect[3] + 20);
        // anomaly bands, paper-cut layers (each its own lifted sheet)
        BANDS.forEach(([lv, col], bi) => {
          const x = masks[bi].getContext('2d'), im = x.createImageData(fw, fh), r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
          for (let q = 0; q < fw * fh; q++) { const v = FLD[q] * grow + 0.06 * Math.sin(q * 0.37 + t * 1.3) * (FLD[q] > 0 ? 1 : 0); const a = clamp((v - lv) * 6 + 0.5); im.data[q * 4] = r; im.data[q * 4 + 1] = gg; im.data[q * 4 + 2] = b; im.data[q * 4 + 3] = a * 255; }
          x.putImageData(im, 0, 0);
          g.save(); g.imageSmoothingQuality = 'high'; g.shadowColor = 'rgba(120,40,20,0.22)'; g.shadowBlur = 10 * k.S; g.shadowOffsetY = 4 * k.S;
          g.drawImage(masks[bi], pr.X(box[0]), pr.Y(box[3]), pr.X(box[2]) - pr.X(box[0]), pr.Y(box[1]) - pr.Y(box[3])); g.restore();
        });
        // cool anomaly in the west, pale blue
        const land = landPath(world, pr, [0, 360], box);
        paperLand(g, land, { ext: 4, lift: 0.7, shelfW: 10 });
        // Niño 3.4 box
        const kb = range(t, 0.9, 1.5);
        if (kb > 0) {
          const x0 = pr.X(190), x1 = pr.X(240), y0 = pr.Y(5), y1 = pr.Y(-5);
          g.save(); g.globalAlpha = kb; g.setLineDash([10, 7]); g.strokeStyle = P.ink; g.lineWidth = 3.5; g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.restore();
          G.pill(g, 'NIÑO 3.4  +2.1 °C', (x0 + x1) / 2, y0 - 40, { size: 26, align: 'center', k: kb, dot: P.red, weight: 800 });
          G.pill(g, 'NIÑO 1+2  +3.9 °C', pr.X(272), pr.Y(-12), { size: 22, align: 'right', k: range(t, 1.3, 1.8), weight: 800 });
        }
        G.text(g, 'Pacific Ocean', pr.X(160), pr.Y(20), { size: 40, weight: 400, fam: F.serif, style: 'italic', color: P.waterDark, align: 'center' });
        G.text(g, 'EQUATOR', pr.X(122), pr.Y(0) - 8, { size: 16, weight: 600, fam: F.mono, color: P.inkSoft, track: 0.14 });
        g.strokeStyle = 'rgba(27,36,48,0.25)'; g.setLineDash([4, 8]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(pr.X(118), pr.Y(0)); g.lineTo(pr.X(292), pr.Y(0)); g.stroke(); g.setLineDash([]);
        // legend
        const lx = rect[0] + 40, ly = rect[1] + rect[3] - 70;
        BANDS.forEach(([lv, col], i) => { g.fillStyle = col; g.fillRect(lx + i * 54, ly, 54, 18); });
        G.text(g, 'SEA-SURFACE TEMPERATURE ANOMALY, °C · STYLISED', lx, ly - 14, { size: 17, weight: 600, fam: F.mono, color: P.ink, track: 0.08 });
        G.text(g, '+0.5', lx, ly + 44, { size: 18, weight: 700 }); G.text(g, '+3.5', lx + 7 * 54, ly + 44, { size: 18, weight: 700, align: 'right' });
        g.restore();
      }
      // odds dial
      if (mode !== 'map') {
        const big2 = mode === 'odds', cx = big2 ? 960 : 1555, cy = big2 ? 560 : 500, R = big2 ? 300 : 220;
        if (!big2) G.card(g, 1290, 160, 560, 760, { r: 28, lift: 1.3 });
        else G.kicker(g, 'NOAA CLIMATE PREDICTION CENTER · 8 OCT 2026', 160, 150, range(t, 0.05, 0.6));
        const kn = E.outBack(range(t, tN, tN + 1.6)), v = odds * clamp(kn, 0, 1.04);
        g.save(); g.lineCap = 'butt'; g.lineWidth = R * 0.26; g.strokeStyle = '#f1e8d6'; g.beginPath(); g.arc(cx, cy, R, Math.PI, TAU); g.stroke();
        const grd = g.createLinearGradient(cx - R, 0, cx + R, 0); grd.addColorStop(0, '#ffd98a'); grd.addColorStop(0.6, '#f98244'); grd.addColorStop(1, P.red);
        g.strokeStyle = grd; g.beginPath(); g.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * clamp(v / 100)); g.stroke();
        for (let i = 0; i <= 10; i++) { const a = Math.PI + Math.PI * i / 10; g.strokeStyle = P.ink; g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 1.17, cy + Math.sin(a) * R * 1.17); g.lineTo(cx + Math.cos(a) * R * (i % 5 ? 1.22 : 1.27), cy + Math.sin(a) * R * (i % 5 ? 1.22 : 1.27)); g.stroke(); }
        const a = Math.PI + Math.PI * clamp(v / 100, 0, 1.02);
        G.shadow(g, 0.6); g.fillStyle = P.ink; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.lineTo(cx + Math.cos(a + Math.PI / 2) * 12, cy + Math.sin(a + Math.PI / 2) * 12); g.lineTo(cx - Math.cos(a + Math.PI / 2) * 12, cy - Math.sin(a + Math.PI / 2) * 12); g.fill();
        g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.fill(); G.noShadow(g); g.restore();
        G.text(g, `${Math.round(clamp(v, 0, odds))}%`, cx, cy + R * 0.62, { size: R * 0.62, weight: 900, color: P.red, align: 'center' });
        const lines = ['CHANCE OCT–DEC IS', 'A HISTORIC EL NIÑO*'];
        lines.forEach((l, i) => G.text(g, l, cx, cy + R * 0.62 + 56 + i * 40, { size: big2 ? 40 : 30, weight: 800, align: 'center', alpha: range(t, tN + 0.5, tN + 1.1) }));
        G.pill(g, `NOV–JAN: ${odds2}%`, cx, cy + R * 0.62 + 165 + (big2 ? 20 : 0), { size: big2 ? 32 : 26, align: 'center', k: range(t, tN + 1.2, tN + 1.7), dot: P.coral });
        G.slab(g, 'EL NIÑO ADVISORY', big2 ? 160 : 1340, big2 ? 260 : 230, { size: big2 ? 34 : 28, fill: P.red, k: range(t, 0.4, 1.0) });
        if (!big2) G.text(g, '*3-MONTH RONI ≥ +2.5 °C:', 1570, 878, { size: 17, weight: 600, fam: F.mono, color: P.inkSoft, align: 'center', track: 0.04, alpha: range(t, tN + 1, tN + 1.6) });
        G.text(g, big2 ? '*3-MONTH RONI ≥ +2.5 °C: STRONGER THAN ANY EVENT SINCE 1950' : 'STRONGER THAN ANY EVENT SINCE 1950', big2 ? 960 : 1570, big2 ? 1000 : 904, { size: big2 ? 22 : 17, weight: 600, fam: F.mono, color: P.inkSoft, align: 'center', track: 0.04, alpha: range(t, tN + 1, tN + 1.6) });
      }
      k.flat();
      if (mode === 'full') G.riseText(g, Pm.title ?? 'El Niño is strengthening', 80, 118, range(t, 0.1, 0.9), { size: 62, weight: 800 });
      G.source(g, Pm.source ?? 'NOAA CPC · ENSO DIAGNOSTIC DISCUSSION · 8 OCT 2026 · MAP STYLISED', range(t, 0.6, 1.4), { size: 18, y: 1044 });
    }, { push: 0.03 });
  }

  return { map, elnino };
}
