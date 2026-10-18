// Mortgage bright maps: paper-cut 2.5D maps on pale teal water, real coastlines (Natural Earth 1:50m, public domain).
//   holders  who holds US Treasuries abroad (TIC, end-Aug 2026): paper columns rise from Tokyo, London and Beijing;
//            Japan $1,068B (a dashed ghost of its Feb level, −$171B, "holdings fell; partly price"), UK $1,010B,
//            China $591B; card: all foreign $9.33T ≈ 29% of debt held by the public; caveat: custodian location.
//            params: at (columns), japanAt (the −$171B ghost), totalAt (card), others (true: Belgium, Luxembourg), title
//   map      params.mode (or view): 'uk' (London pin, the 2022 gilt crisis card) | 'us' (Orange County pin, 1994 card)
//            params: pins [{ name, lon, lat, word }], at (the card), title, source
// Geography: projects/mortgage/assets/geo/mortgage.json, built by assets/geo/build.py.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;
let GEO = null;
const geo = () => GEO ??= fetch('/projects/mortgage/assets/geo/mortgage.json').then(r => r.json());

export default function makeMaps(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- projection and paper
  function proj(box, rect = [0, 0, 1920, 1080], pad = 1) {
    const [w, s, e, n] = box, kx = Math.cos(((s + n) / 2) * Math.PI / 180);
    const sc = Math.min(rect[2] / ((e - w) * kx), rect[3] / (n - s)) * pad;
    const cx = (w + e) / 2, cy = (s + n) / 2;
    return { X: (lon) => rect[0] + rect[2] / 2 + (lon - cx) * kx * sc, Y: (lat) => rect[1] + rect[3] / 2 - (lat - cy) * sc, sc, kx };
  }
  function landPath(rings, pr, box = null) {
    const path = new Path2D();
    for (const r of rings) {
      if (box) { let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9; for (let i = 0; i < r.length; i += 2) { if (r[i] < lo0) lo0 = r[i]; if (r[i] > lo1) lo1 = r[i]; if (r[i + 1] < la0) la0 = r[i + 1]; if (r[i + 1] > la1) la1 = r[i + 1]; }
        const mx = (box[2] - box[0]) * 0.3, my = (box[3] - box[1]) * 0.3; if (lo1 < box[0] - mx || lo0 > box[2] + mx || la1 < box[1] - my || la0 > box[3] + my) continue; }
      path.moveTo(pr.X(r[0]), pr.Y(r[1])); for (let i = 2; i < r.length; i += 2) path.lineTo(pr.X(r[i]), pr.Y(r[i + 1])); path.closePath();
    }
    return path;
  }
  function paperLand(g, path, { ext = 5, lift = 1, top = P.land, side = P.landSide, shelf = true, shelfW = 14, edge = P.landEdge, grainA = 0.35 } = {}) {
    if (shelf) { g.save(); g.lineJoin = 'round'; g.strokeStyle = P.shelf; g.lineWidth = shelfW; g.stroke(path); g.restore(); }
    g.save(); G.shadow(g, lift); g.translate(0, ext); g.fillStyle = side; g.fill(path); G.noShadow(g); g.restore();
    g.save(); g.fillStyle = top; g.fill(path); g.clip(path); G.grain(g, 2400, 1500, grainA, -240, -210);
    const gr = g.createLinearGradient(0, 0, 1920, 1080); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(40,60,90,0.05)'); g.fillStyle = gr; g.fillRect(-240, -210, 2400, 1500);
    g.restore();
    g.save(); g.strokeStyle = edge; g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke(path); g.restore();
  }
  function sea(g, t) {
    const gr = g.createLinearGradient(0, -200, 0, 1300); gr.addColorStop(0, '#d9ecea'); gr.addColorStop(1, P.seaDeep); g.fillStyle = gr; g.fillRect(-240, -210, 2400, 1500);
    // faint graticule: the ledger, at sea
    g.save(); g.strokeStyle = 'rgba(29,106,102,0.10)'; g.lineWidth = 1.5; for (let x = -240; x < 2200; x += 80) { g.beginPath(); g.moveTo(x, -210); g.lineTo(x, 1300); g.stroke(); } for (let y = -210; y < 1300; y += 80) { g.beginPath(); g.moveTo(-240, y); g.lineTo(2200, y); g.stroke(); } g.restore();
    G.grain(g, 2400, 1500, 0.22, -240, -210);
  }
  // the static paper drawn once into a cache (with margin for the camera drift)
  function cachedBase(k, draw) {
    const M0 = 120, CS = k.S * 1.1, c = G.mk((1920 + 2 * M0) * CS, (1080 + 2 * M0) * CS), x = c.getContext('2d');
    x.setTransform(CS, 0, 0, CS, M0 * CS, M0 * CS); G.setS(CS); draw(x); G.setS(k.S);
    return (g) => g.drawImage(c, -M0, -M0, 1920 + 2 * M0, 1080 + 2 * M0);
  }
  // a 2.5D paper column standing on (x, y): front, side, top
  function column(g, x, y, h, { w = 64, d = 22, front = P.ink, side = P.navySoft, top = '#4a5f86', alpha = 1 } = {}) {
    if (h <= 0) return;
    g.save(); g.globalAlpha *= alpha; G.shadow(g, 1.1);
    g.fillStyle = front; g.fillRect(x - w / 2, y - h, w, h); G.noShadow(g);
    g.fillStyle = side; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2 + d, y - d * 0.6); g.lineTo(x + w / 2 + d, y - h - d * 0.6); g.lineTo(x + w / 2, y - h); g.closePath(); g.fill();
    g.fillStyle = top; g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x - w / 2 + d, y - h - d * 0.6); g.lineTo(x + w / 2 + d, y - h - d * 0.6); g.lineTo(x + w / 2, y - h); g.closePath(); g.fill();
    g.restore();
  }

  // ================================================================ holders
  const HOLD = [
    { key: 'JPN', name: 'JAPAN', lon: 139.7, lat: 35.7, v: 1068.3, ghost: 1239.3, word: 'Japan' },
    { key: 'GBR', name: 'UK', lon: -0.13, lat: 51.5, v: 1009.5, word: 'Britain' },
    { key: 'CHN', name: 'CHINA', lon: 116.4, lat: 39.9, v: 590.7, word: 'China' },
  ];
  const OTHERS = [{ key: 'BEL', name: 'BELGIUM', lon: 4.35, lat: 50.85, v: 490.5 }, { key: 'LUX', name: 'LUXEMBOURG', lon: 6.13, lat: 49.6, v: 448.2 }];
  async function holders(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10, gj = await geo();
    const box = [-24, 4, 156, 68], rect = [0, 250, 1920, 830], pr = proj(box, rect, 1.04);
    const rings = Object.values(gj.world).flat(), hlKeys = HOLD.map(h => h.key);
    const list = [...HOLD, ...(Pm.others ? OTHERS : [])];
    const T = G.cues(shot, list, { from: 0.6, span: Math.max(1.6, D * 0.3) });
    const tJ = G.cue(shot, Pm.japanAt, T[0] + 1.6), tC = G.cue(shot, Pm.totalAt, Math.min(D - 3, Math.max(...T) + 1.6)), tV = tC + 0.8;
    const HS = 250 / 1100; // px per $B
    let base = null;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.6); sea(g, t);
      k.view(1);
      if (!base) base = cachedBase(k, (c) => {
        const land = landPath(rings, pr, box); paperLand(c, land, { ext: 4, lift: 0.6, shelfW: 9 });
        c.save(); c.strokeStyle = 'rgba(20,35,61,0.12)'; c.lineWidth = 1; c.stroke(land); c.restore();
        hlKeys.forEach((kk) => { const hp = landPath(gj.world[kk] ?? [], pr, box); c.save(); c.translate(0, -3); paperLand(c, hp, { ext: 6, lift: 0.8, top: P.sagePale, side: P.sage, shelf: false, edge: P.sageDeep }); c.restore(); });
      });
      base(g);
      // columns rise from the financial centres
      k.view(1.12);
      list.forEach((h, i) => {
        const kk = E.outCubic(range(t, T[i], T[i] + 1.2)), x = pr.X(h.lon), y = pr.Y(h.lat), small = !HOLD.includes(h);
        G.pin(g, x, y, t, range(t, T[i] - 0.3, T[i] + 0.2), { color: P.ink, r: 7, pulse: false });
        if (h.ghost) { const kg = range(t, tJ, tJ + 0.7); if (kg > 0) { const hg = h.ghost * HS; g.save(); g.globalAlpha = clamp(kg * 2); g.setLineDash([8, 7]); g.strokeStyle = P.red; g.lineWidth = 3; g.strokeRect(x - 32, y - hg, 64, hg - h.v * HS * kk); g.restore(); } }
        column(g, x, y, h.v * HS * kk, { w: small ? 40 : 64, d: small ? 14 : 22, front: small ? P.steel : P.ink, side: small ? '#7386a0' : P.navySoft, top: small ? '#b4c2d4' : '#4a5f86' });
        const top = y - h.v * HS * kk - 12, kp = range(t, T[i] + 0.6, T[i] + 1.1);
        if (h.key === 'JPN') G.pill(g, `${h.name} $${G.fmt(h.v)}B`, x + 40, y - h.ghost * HS - 104, { size: 30, k: kp, align: 'right', fam: F.mono, weight: 500, dot: P.ink });
        else if (h.key === 'CHN') G.pill(g, `${h.name} $${G.fmt(h.v)}B`, x - 44, top + 52, { size: 30, k: kp, align: 'right', fam: F.mono, weight: 500, dot: P.ink });
        else if (!small) G.pill(g, `${h.name} $${G.fmt(h.v)}B`, x + 60, top + 24, { size: 30, k: kp, fam: F.mono, weight: 500, dot: P.ink });
        else G.pill(g, `${h.name} $${G.fmt(h.v)}B`, x + 40, top + 70 + i * 0, { size: 20, k: kp, fam: F.mono, weight: 500 });
      });
      // Japan's fall
      const kj = range(t, tJ + 0.3, tJ + 0.9);
      if (kj > 0) {
        const h = HOLD[0], x = pr.X(h.lon), y = pr.Y(h.lat), yg = y - h.ghost * HS;
        G.pill(g, '−$171B SINCE FEB', x + 40, yg - 48, { size: 26, k: kj, fill: P.red, color: P.white, fam: F.mono, weight: 500, align: 'right' });
        G.text(g, 'HOLDINGS FELL; PARTLY PRICE', x - 46, yg + 24, { size: 20, weight: 500, fam: F.mono, color: P.ink, track: 0.06, align: 'right', alpha: range(t, tJ + 0.6, tJ + 1.2) });
      }
      // the total card, and the caveat
      k.view(1);
      const kc = range(t, tC, tC + 0.6);
      if (kc > 0) {
        g.save(); g.globalAlpha = clamp(kc * 2); g.translate(0, (1 - E.outCubic(kc)) * 20);
        G.card(g, 80, 700, 700, 260, { r: 22, lift: 1.3 });
        G.fig(g, 'ALL FOREIGN HOLDERS', 116, 752, { size: 20, color: P.inkSoft, track: 0.1 });
        G.fig(g, '$9.33T', 112, 852, { size: 92, color: P.ink });
        G.text(g, '≈ 29% of US debt', 470, 810, { size: 36, weight: 900, color: P.ink });
        G.text(g, 'held by the public', 470, 852, { size: 30, weight: 700, color: P.inkSoft });
        G.fig(g, 'OF $32.41T · 31 AUG 2026 · OUR MATH', 116, 920, { size: 18, color: P.tealDeep, track: 0.06 });
        g.restore();
      }
      const kv = range(t, tV, tV + 0.6);
      G.pill(g, 'COUNTRY = WHERE THE CUSTODIAN SITS, NOT NECESSARILY THE OWNER', 80, 1000, { size: 20, k: kv, fam: F.mono, weight: 500, fill: P.white, dot: P.inkFaint });
      k.flat();
      G.kicker(g, Pm.kicker ?? 'FOREIGN HOLDINGS OF US TREASURIES · BY COUNTRY', 80, 92, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'The biggest overseas customers', 80, 160, range(t, 0.12, 0.9), { size: 58, weight: 800 });
      G.asOf(g, 'AS OF END-AUG 2026', 1840, 80, range(t, 0.4, 0.9), { align: 'right' });
      G.source(g, Pm.source ?? 'SOURCE: US TREASURY TIC, TABLE 5 (MARKET VALUE) · MAP: NATURAL EARTH', range(t, 0.6, 1.4), { y: 1046 });
    }, { push: 0.03, dx: 24, dy: 8, fx: 1100, fy: 560 });
  }

  // ================================================================ map: 'uk' | 'us'
  const MAPS = {
    uk: { data: 'europe', box: [-11.5, 49.4, 4.5, 59.6], rect: [900, 110, 960, 900], hl: ['GBR'], pin: { name: 'London', lon: -0.13, lat: 51.5 },
      kicker: 'UNITED KINGDOM · SEPTEMBER – OCTOBER 2022', title: 'The gilt crisis', src: 'SOURCES: BANK OF ENGLAND (28 SEP 2022 NOTICE; QUARTERLY BULLETIN 2023); GOV.UK · MAP: NATURAL EARTH',
      card: [['23 SEP 2022', 'THE “MINI-BUDGET”: BIG TAX CUTS'], ['+1.30 PTS', '30-YEAR GILT YIELD, IN 3 DAYS', true], ['£19.3BN', 'GILTS BOUGHT BY THE BANK OF ENGLAND'], ['20 OCT', 'THE PRIME MINISTER SAYS SHE WILL RESIGN']],
      quote: '“on whatever scale is necessary”' },
    us: { data: 'usw', box: [-125, 31.6, -113.2, 42.6], rect: [900, 110, 960, 900], hl: ['US-CA'], pin: { name: 'Orange County', lon: -117.83, lat: 33.72 },
      kicker: 'CALIFORNIA · 1994', title: 'Orange County bets on low rates', src: 'SOURCES: THE BOND BUYER (1999); SEN. LOCKYER MEMO (13 DEC 1994) · MAP: NATURAL EARTH',
      card: [['1994', 'THE COUNTY FUND BETS RATES STAY LOW'], ['$1.64BN', 'LOST', true], ['6 DEC 1994', 'FILES FOR BANKRUPTCY'], ['THE LARGEST', 'US MUNICIPAL BANKRUPTCY, AT THE TIME']] },
  };
  async function map(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? Pm.view ?? 'uk'), V = MAPS[mode] ?? MAPS.uk, D = shot.duration ?? 8, gj = await geo();
    const set0 = gj[V.data], pr = proj(V.box, V.rect, 1.0);
    const rings = Object.values(set0).flat(), hl = V.hl.flatMap(k => set0[k] ?? []);
    const pins = Pm.pins ?? [V.pin], PT = G.cues(shot, pins, { from: 0.5, span: 1 });
    const tC = G.cue(shot, Pm.at, 1.0), rows = V.card;
    let base = null;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.6); sea(g, t);
      k.view(1);
      if (!base) base = cachedBase(k, (c) => {
        const land = landPath(rings, pr, V.box); paperLand(c, land, { ext: 6, lift: 0.8 });
        c.save(); c.strokeStyle = 'rgba(20,35,61,0.16)'; c.lineWidth = 1.2; c.stroke(land); c.restore();
      });
      base(g);
      const kh = E.outBack(range(t, 0.3, 1.1)), hp = landPath(hl, pr, V.box);
      g.save(); g.translate(0, -10 * kh); paperLand(g, hp, { ext: 6 + 10 * kh, lift: 0.4 + 1.1 * kh, top: P.sagePale, side: P.sage, shelf: false, edge: P.sageDeep, grainA: 0.3 }); g.restore();
      k.view(1.12);
      pins.forEach((pn, i) => {
        const x = pr.X(pn.lon), y = pr.Y(pn.lat) - 10 * kh, kk = range(t, PT[i], PT[i] + 0.5);
        G.pin(g, x, y, t, kk, { color: P.red });
        G.pill(g, pn.name, x + 28, y, { size: 30, k: kk, weight: 800 });
      });
      k.view(1);
      // the card
      const cx0 = 90, cy0 = 270, cw = 760;
      G.card(g, cx0, cy0, cw, 120 + rows.length * 128 + (V.quote ? 70 : 0), { r: 26, lift: 1.3, alpha: clamp(range(t, tC - 0.6, tC) * 2) });
      rows.forEach(([a, b, red], i) => {
        const kk = range(t, tC + i * 0.45, tC + i * 0.45 + 0.6), y = cy0 + 104 + i * 128;
        if (kk <= 0) return;
        g.save(); g.globalAlpha = clamp(kk * 2); g.translate((1 - E.outCubic(kk)) * 20, 0);
        G.fig(g, a, cx0 + 44, y, { size: 56, color: red ? P.red : P.ink });
        G.fig(g, b, cx0 + 46, y + 40, { size: 20, color: P.inkSoft, track: 0.08 });
        if (i < rows.length - 1) { g.fillStyle = P.rule; g.fillRect(cx0 + 44, y + 70, cw - 88, 2); }
        g.restore();
      });
      if (V.quote) G.text(g, V.quote, cx0 + 44, cy0 + 120 + rows.length * 128 + 10, { size: 40, weight: 400, fam: F.serif, style: 'italic', color: P.tealDeep, alpha: range(t, tC + rows.length * 0.45, tC + rows.length * 0.45 + 0.6) });
      k.flat();
      G.kicker(g, Pm.kicker ?? V.kicker, 90, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? V.title, 90, 200, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      G.source(g, Pm.source ?? V.src, range(t, 0.6, 1.4), { y: 1046 });
    }, { push: 0.04, dx: 24, dy: 8, fx: 1300, fy: 560 });
  }

  return { holders, map };
}
