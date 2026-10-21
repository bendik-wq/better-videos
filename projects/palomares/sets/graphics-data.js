// AI-bubble data graphics (episode 8): charts of the sparse key numbers in RESEARCH.md. Never a daily series: dots are
// key closes, straight segments join them (said on screen), and every computed figure carries an OUR MATH pill, every
// moving (⏱) figure an AS OF pill.
//   ai-chart  params.mode:
//     'capex'          Big-4 capex bars: 2024 $228B · 2025 $376B · H1 2026 $295B (red, FIRST HALF ONLY); dashed Apollo ≈ $335B
//     'gap'            OpenAI: $1.4T commitments vs $13.1B 2025 revenue (≈107×), then at stepAt ~$600B plan vs ~$50B run-rate (≈12×, red)
//     'gartner'        ~$8.5T revenue needed to 2030 vs ≤ $3.6T forecast; the gap outlined red (Gartner, 14 Oct 2026, as reported)
//     'nasdaq2000'     Nasdaq 10 Mar 2000 5,048.62 → 9 Oct 2002 1,114.11 (−77.9%, red) → 23 Apr 2015 back above; "15 YEARS"
//     'lucent'         two panels: Lucent ~$84 (Dec 1999) → $0.58 (Oct 2002) ≈ −99% (red) · Cisco $80.06 → $8.60 −89%
//     'october'        three panels, % from each starting close, 6–16 Oct 2026: Nasdaq −5% from record · Nvidia ≈ −$605B (red) · Oracle −8.8% on 14 Oct
//     'oracle'         Oracle $328.33 (10 Sep 2025) → $128.23 (16 Oct 2026) ≈ −61% (red), 2026 low, S&P BBB− marker
//     'concentration'  100-square grid of S&P 500 weight: Nvidia 7.93% → Magnificent 7 34.7% (red) → top 10 40.2% (SPY, 19 Oct 2026)
//   common params: at (first draw), title, kicker, source; mode cues listed in projects/aibubble/SETS-graphics.md
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU } = G;
const ms = G.ms;
const KEYNOTE = 'DOTS = KEY CLOSES · NOT A DAILY SERIES · STRAIGHT LINES JOIN THE DOTS';

// ---------------------------------------------------------------- line-chart modes (all values from RESEARCH.md)
// pts: { d, v, big, line, red, hollow (implied point), tag: [dx, dy, align], asof }; join: index pairs (straight segments)
const LINES = {
  nasdaq2000: {
    kicker: 'NASDAQ COMPOSITE · KEY CLOSES · 2000 – 2015', title: 'Down 78%. Fifteen years to get back',
    src: 'SOURCE: YAHOO FINANCE PRICE HISTORY (^IXIC) · 2015 PLOTTED AT THE 2000 PEAK LEVEL (FIRST CLOSE ABOVE IT)',
    axis: [['1999-07-01', '2016-03-01', 1]], yr: [0, 6000], yStep: 1000, yFmt: (v) => G.fmt(v),
    ticks: [['2000-01-01', '2000'], ['2002-01-01', '2002'], ['2005-01-01', '2005'], ['2010-01-01', '2010'], ['2015-01-01', '2015']],
    pts: [
      { d: '2000-03-10', v: 5048.62, big: '5,048.62', line: 'RECORD CLOSE · 10 MAR 2000', tag: [96, 92, 'left'] },
      { d: '2002-10-09', v: 1114.11, big: '1,114.11', line: '9 OCT 2002 · −77.9% FROM THE PEAK', red: true, tag: [34, -30, 'left'] },
      { d: '2015-04-23', v: 5048.62, big: 'BACK ABOVE', line: '23 APR 2015 · FIRST CLOSE ABOVE 5,048.62', tag: [-20, 250, 'right'] },
    ],
    join: [[0, 1], [1, 2]],
  },
  oracle: {
    kicker: 'ORACLE · SHARE PRICE · KEY CLOSES', title: 'Oracle: from the peak, about −61%',
    src: 'SOURCES: YAHOO FINANCE PRICE HISTORY (ORCL); REUTERS (10 SEP 2025); S&P VIA BLOOMBERG/BRIEFS (JUL 2026)',
    axis: [['2025-07-15', '2026-11-20', 1]], yr: [0, 350], yStep: 50, yFmt: (v) => `$${v}`,
    ticks: [['2025-09-01', 'SEP 2025'], ['2026-01-01', 'JAN 2026'], ['2026-04-01', 'APR'], ['2026-07-01', 'JUL'], ['2026-10-01', 'OCT 2026']],
    pts: [
      { d: '2025-09-09', v: 241.42, big: '≈ $241', line: '9 SEP · IMPLIED BY +36% (OUR MATH)', hollow: true, tag: [26, 84, 'left'] },
      { d: '2025-09-10', v: 328.33, big: '$328.33', line: '10 SEP 2025 · +36% IN A DAY', tag: [34, 0, 'left'] },
      { d: '2026-07-24', v: 114.99, big: '$114.99', line: '2026 LOW · 24 JUL', tag: [-20, 96, 'right'] },
      { d: '2026-10-16', v: 128.23, big: '$128.23', line: '16 OCT 2026 CLOSE', tag: [0, 106, 'center'], asof: 'AS OF 16 OCT 2026' },
    ],
    join: [[0, 1], [1, 2], [2, 3]],
  },
};
// small multiples: panels share an x range; each has its own points
const PANELS = {
  lucent: {
    kicker: 'THE LAST TIME · TWO EQUIPMENT GIANTS · $ PER SHARE', title: 'The suppliers fell hardest',
    src: 'SOURCES: LUCENT ~$84 AND 58¢: INSTITUTIONAL INVESTOR; WIKIPEDIA (APPROX.) · CISCO: YAHOO FINANCE (SPLIT-ADJ.)',
    axis: [['1999-07-01', '2003-02-01', 1]], yr: [0, 90], yStep: 15, yFmt: (v) => `$${v}`,
    ticks: [['2000-01-01', '2000'], ['2001-01-01', '2001'], ['2002-01-01', '2002'], ['2003-01-01', '2003']],
    panels: [
      { name: 'LUCENT', sub: 'LENT TO ITS OWN CUSTOMERS', box: [230, 380, 880, 830],
        pts: [{ d: '1999-12-15', v: 84, big: '~$84', line: 'DEC 1999 · PEAK', tag: [30, -30, 'left'] },
          { d: '2002-10-15', v: 0.58, big: '$0.58', line: 'OCT 2002', red: true, tag: [-30, -230, 'right'] }],
        slab: ['≈ −99%', true] },
      { name: 'CISCO', sub: 'BRIEFLY THE WORLD’S MOST VALUABLE COMPANY', box: [1100, 380, 1750, 830],
        pts: [{ d: '2000-03-27', v: 80.06, big: '$80.06', line: '27 MAR 2000 · PEAK', tag: [30, -30, 'left'] },
          { d: '2002-10-08', v: 8.60, big: '$8.60', line: '8 OCT 2002', tag: [-30, -230, 'right'] }],
        slab: ['−89%', false] },
    ],
  },
  october: {
    kicker: 'KEY CLOSES · 6 – 16 OCT 2026 · % FROM EACH STARTING CLOSE', title: 'Two weeks in October',
    src: 'SOURCES: YAHOO FINANCE PRICE HISTORY; AP (16 OCT 2026); REUTERS (14 OCT 2026) · NVIDIA VALUE: 24.1B SHARES (10-Q) · STRAIGHT LINES JOIN THE DOTS',
    axis: [['2026-10-04', '2026-10-18', 1]], yr: [-12, 1], yStep: 4, yFmt: (v) => (v ? `${v > 0 ? '+' : '−'}${Math.abs(v)}%` : '0%'),
    ticks: [['2026-10-06', '6 OCT'], ['2026-10-09', '9'], ['2026-10-14', '14'], ['2026-10-16', '16']],
    panels: [
      { name: 'NASDAQ', sub: 'COMPOSITE INDEX', box: [200, 400, 630, 800],
        pts: [{ d: '2026-10-06', v: 0, big: '27,599.79', line: 'RECORD' }, { d: '2026-10-14', v: -3.29, big: '26,692.87' }, { d: '2026-10-16', v: -5.29, big: '26,140.03' }],
        slab: ['−5% FROM RECORD', false], math: '−5.3% · STILL +12.5% IN 2026' },
      { name: 'NVIDIA', sub: 'SHARE PRICE', box: [785, 400, 1215, 800],
        pts: [{ d: '2026-10-06', v: 0, big: '$239.24', line: 'RECORD' }, { d: '2026-10-09', v: -4.16, big: '$229.28' }, { d: '2026-10-16', v: -10.50, big: '$214.13', red: true }],
        slab: ['≈ −$605B', true], math: '−10.5% × 24.1B SHARES' },
      { name: 'ORACLE', sub: 'SHARE PRICE', box: [1370, 400, 1800, 800],
        pts: [{ d: '2026-10-13', v: 0, big: '≈ $143', line: 'IMPLIED', hollow: true }, { d: '2026-10-14', v: -8.80, big: '$130.55' }, { d: '2026-10-16', v: -10.42, big: '$128.23' }],
        slab: ['−8.8% ON 14 OCT', false], math: '13 OCT IMPLIED BY −8.8%' },
    ],
  },
};

export default function makeData(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- chart helpers
  // piecewise-linear date axis: segs [[a, b, share, break]] -> X(ms)
  function xAxis(segs, x0, x1) {
    const tot = segs.reduce((a, s) => a + s[2], 0), out = []; let x = x0;
    for (const [a, b, sh, br] of segs) { const w = (x1 - x0) * sh / tot; out.push({ a: ms(a), b: ms(b), x, w, br: !!br }); x += w; }
    const X = (t) => { let s = out.find(o => t <= o.b) ?? out.at(-1); if (t < out[0].a) s = out[0]; return s.x + (t - s.a) / (s.b - s.a) * s.w; };
    return { X, segs: out };
  }
  function frame(g, box, X, Y, yr, { yStep = 10, yFmt = (v) => `$${v}`, ticks = [], alpha = 1, ySize = 22, tSize = 21, zero = 0 } = {}) {
    const [x0, y0, x1, y1] = box;
    g.save(); g.globalAlpha *= alpha;
    for (let v = Math.ceil(yr[0] / yStep) * yStep; v <= yr[1] + 1e-9; v += yStep) {
      const yy = Y(v); if (yy < y0 - 2 || yy > y1 + 2) continue;
      const isZ = Math.abs(v - zero) < 1e-9;
      g.fillStyle = isZ ? P.ink : P.rule; g.fillRect(x0, yy - 1, x1 - x0, isZ ? 3 : 2);
      G.fig(g, yFmt(+v.toFixed(2)), x0 - 16, yy + 8, { size: ySize, align: 'right', color: P.inkSoft });
    }
    for (const [d, s] of ticks) { const xx = X(ms(d)); if (xx < x0 - 1 || xx > x1 + 1) continue; g.fillStyle = P.rule; g.fillRect(xx - 1, y1, 2, 12); G.fig(g, s, xx, y1 + 40, { size: tSize, align: 'center', color: P.inkSoft }); }
    g.restore();
  }
  const dot = (g, x, y, col, r = 9, k = 1, hollow = false) => {
    if (k <= 0) return; const s = E.outBack(clamp(k));
    g.save(); G.shadow(g, 0.3); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, (r + 4) * s, 0, TAU); g.fill(); G.noShadow(g);
    if (hollow) { g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([4, 4]); g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.stroke(); }
    else { g.fillStyle = col; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.fill(); }
    g.restore();
  };
  const pulse = (g, x, y, t, col = P.red) => { const ph = (t * 0.7) % 1; g.save(); g.strokeStyle = col; g.globalAlpha = (1 - ph) * 0.5; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 14 + ph * 30, 0, TAU); g.stroke(); g.restore(); };
  // a value tag: a small card with a big figure and a mono line, anchored by its left/right edge or centre
  function tag(g, x, y, k, { big, line, color = P.ink, align = 'left', sizeB = 40 }) {
    if (k <= 0) return null;
    const wb = G.measure(g, big, sizeB, 500, F.mono), wl = line ? G.measure(g, line, 17, 500, F.mono, 0.08) : 0, W = Math.max(wb, wl) + 40, Hh = line ? 90 : 64;
    const x0 = align === 'right' ? x - W : align === 'center' ? x - W / 2 : x;
    g.save(); g.globalAlpha *= clamp(k * 2); g.translate(0, (1 - E.outCubic(k)) * 14);
    G.card(g, x0, y - Hh / 2, W, Hh, { r: 14, lift: 0.8, grainA: 0 });
    g.fillStyle = color; g.fillRect(x0, y - Hh / 2 + 12, 5, Hh - 24);
    G.fig(g, big, x0 + 20, y + (line ? -3 : 14), { size: sizeB, color });
    if (line) G.fig(g, line, x0 + 21, y + 29, { size: 17, color: P.inkSoft, track: 0.08 });
    g.restore(); return { x: x0, w: W, h: Hh };
  }
  const chrome = (g, t, Pm, kick, ttl, src, { note = null } = {}) => {
    G.card(g, 60, 40, 1800, 990, { r: 32, lift: 1.1 });
    G.kicker(g, Pm.kicker ?? kick, 120, 118, range(t, 0.05, 0.6));
    G.riseText(g, Pm.title ?? ttl, 120, 192, range(t, 0.12, 0.9), { size: 58, weight: 800, maxW: 1640 });
    const s = Pm.source ?? src, size = G.measure(g, String(s).toUpperCase(), 16, 500, F.mono, 0.1) > 1680 ? 14 : 16;
    G.source(g, s, range(t, 0.6, 1.4), { y: 1004, back: false, x: 1810, size });
    if (note) G.fig(g, note, 1800, 262, { size: 16, align: 'right', color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, 0.6, 1.2)) });
  };
  // a swept series: segments clipped to a moving x, dots pop and tags rise as it passes
  function prep(S, box, t0, dur, pts = S.pts) {
    const [x0, y0, x1, y1] = box, ax = xAxis(S.axis, x0, x1), X = ax.X, Y = (v) => y1 - (v - S.yr[0]) / (S.yr[1] - S.yr[0]) * (y1 - y0);
    const xy = pts.map(p => [X(ms(p.d)), Y(p.v)]);
    const passT = xy.map(([x]) => t0 + dur * Math.acos(1 - 2 * clamp((x - x0 + 4) / (x1 - x0 + 8))) / Math.PI);
    return { box, X, Y, xy, passT, pts, t0, dur, join: S.join ?? pts.slice(1).map((_, i) => [i, i + 1]) };
  }
  function paintSeries(g, t, R, { mini = false, lineW = 6, fill = 'rgba(210,233,228,0.6)', zeroY = null } = {}) {
    const [x0, y0, x1, y1] = R.box, sx = lerp(x0 - 4, x1 + 4, E.inOutSine(range(t, R.t0, R.t0 + R.dur))), base = zeroY ?? y1;
    g.save(); g.beginPath(); g.rect(x0 - 20, y0 - 80, sx - x0 + 20, y1 - y0 + 120); g.clip();
    for (const [a, b] of R.join) { g.save(); g.beginPath(); g.moveTo(R.xy[a][0], base); g.lineTo(...R.xy[a]); g.lineTo(...R.xy[b]); g.lineTo(R.xy[b][0], base); g.closePath(); g.fillStyle = fill; g.fill(); g.restore(); }
    for (const [a, b] of R.join) { g.save(); g.beginPath(); g.moveTo(...R.xy[a]); g.lineTo(...R.xy[b]); g.strokeStyle = P.ink; g.lineWidth = lineW; g.lineCap = 'round'; if (R.pts[a].hollow) g.setLineDash([2, 12]); g.stroke(); g.restore(); }
    g.restore();
    R.pts.forEach((pt, i) => {
      const [x, y] = R.xy[i], kk = range(t, R.passT[i] - 0.05, R.passT[i] + 0.4); if (kk <= 0) return;
      if (!mini) { g.save(); g.globalAlpha = clamp(kk * 2); g.setLineDash([3, 6]); g.strokeStyle = P.inkFaint; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, lerp(y1, y, E.outCubic(kk))); g.stroke(); g.restore(); }
      dot(g, x, y, pt.red ? P.red : P.ink, pt.red ? 12 : mini ? 8 : 9, kk, pt.hollow);
      if (pt.red && kk >= 1) pulse(g, x, y, t);
      const kt = range(t, R.passT[i] + 0.15, R.passT[i] + 0.7);
      if (mini) {
        // compact labels: figure above the dot (below for the low points), mono line under it
        // first: above; middle: above-right (the line runs down-right, so up-right is clear); last: left of the dot
        const last = i === R.pts.length - 1, first = i === 0;
        const al = last ? 'right' : 'left', lx = first ? x - 6 : last ? x - 24 : x + 16, ly = first ? y - 24 : last ? y + 9 : y - 20;
        G.fig(g, pt.big, lx, ly, { size: 24, align: al, color: pt.red ? P.red : P.ink, alpha: E.outCubic(kt) });
        if (pt.line) G.fig(g, pt.line, lx, ly - 30, { size: 15, align: al, color: P.inkSoft, track: 0.08, alpha: E.outCubic(kt) });
        return;
      }
      const [dx, dy, al] = pt.tag ?? [24, -40, 'left'];
      if (kt > 0 && (dx || dy)) { g.save(); g.globalAlpha = clamp(kt * 2) * 0.6; g.strokeStyle = P.inkSoft; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * 0.8, y + dy * 0.8); g.stroke(); g.restore(); }
      tag(g, x + dx, y + dy, kt, { big: pt.big, line: pt.line, color: pt.red ? P.red : P.ink, align: al });
      if (pt.asof) G.asOf(g, pt.asof, x + dx, y + dy - (dy > 0 ? -76 : 76), range(t, R.passT[i] + 0.5, R.passT[i] + 1.0), { align: al, size: 17 });
    });
    if (t > R.t0 && t < R.t0 + R.dur) { g.save(); g.fillStyle = 'rgba(42,140,134,0.18)'; g.fillRect(sx - 1.5, y0 - 20, 3, y1 - y0 + 20); g.restore(); }
  }
  // a dashed level with an arrow down to a lower point (the drop), plus a slab and an OUR MATH pill
  function dropArrow(g, t, tA, xa, ya, xb, yb, bx, { slab, math, red = true, slabX, slabY, align = 'right', fromX = null }) {
    const kq = range(t, tA, tA + 0.8); if (kq <= 0) return;
    g.save(); g.globalAlpha = clamp(kq * 2); g.strokeStyle = red ? P.red : P.ink; g.lineWidth = 2.5; g.setLineDash([7, 7]);
    const xs = fromX ?? xa + 16; g.beginPath(); g.moveTo(xs, ya); g.lineTo(lerp(xs, bx, E.outCubic(kq)), ya); g.stroke(); g.setLineDash([]);
    const ky = E.outCubic(range(t, tA + 0.4, tA + 1.0)), ye = lerp(ya, yb, ky);
    if (ky > 0) { g.lineWidth = 4; g.beginPath(); g.moveTo(bx, ya); g.lineTo(bx, ye); g.stroke(); g.beginPath(); g.moveTo(bx - 10, ye - 14); g.lineTo(bx, ye); g.lineTo(bx + 10, ye - 14); g.stroke(); }
    g.restore();
    G.slab(g, slab, slabX ?? bx - 24, slabY ?? (ya + yb) / 2 - 30, { size: 34, fill: red ? P.red : P.ink, align, k: range(t, tA + 0.6, tA + 1.2) });
    if (math) G.ourMath(g, math, slabX ?? bx - 24, (slabY ?? (ya + yb) / 2 - 30) + 60, range(t, tA + 0.9, tA + 1.4), { align, size: 17 });
  }

  // ================================================================ ai-chart
  async function aiChart(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'capex');
    const f = { capex, gap, gartner, nasdaq2000: line, oracle: line, lucent: panels, october: panels, concentration }[mode] ?? capex;
    return f(ctx, shot, mode);
  }

  // ------------------------------------------------ line modes: nasdaq2000, oracle
  async function line(ctx, shot, mode) {
    const Pm = shot.params ?? {}, V = LINES[mode], D = shot.duration ?? 9;
    const box = [240, 310, 1740, 880];
    const t0 = G.cue(shot, Pm.at, 0.6), dur = Pm.drawDur ?? clamp(D * 0.42, 2.4, 4.0);
    const R = prep(V, box, t0, dur);
    const tTag = G.cue(shot, Pm.dropAt ?? Pm.recoverAt, t0 + dur + 0.3), tRate = G.cue(shot, Pm.ratingAt, R.passT[2] + 0.6);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, V.kicker, V.title, V.src, { note: KEYNOTE });
      frame(g, box, R.X, R.Y, V.yr, { yStep: V.yStep, yFmt: V.yFmt, ticks: V.ticks, alpha: E.outCubic(range(t, 0.15, 0.7)) });
      if (mode === 'oracle' && Pm.rating !== false) {
        // 9 Jul 2026: S&P cuts Oracle to BBB−, one notch above junk (a marker, never the word "junk" alone)
        const xr = R.X(ms('2026-07-09')), kr = range(t, tRate, tRate + 0.6);
        if (kr > 0) {
          g.save(); g.globalAlpha = clamp(kr * 2); g.setLineDash([4, 6]); g.strokeStyle = P.inkSoft; g.lineWidth = 2; g.beginPath(); g.moveTo(xr, box[3]); g.lineTo(xr, lerp(box[3], 590, E.outCubic(kr))); g.stroke(); g.restore();
          G.pill(g, '9 JUL 2026 · S&P: BBB−, ONE NOTCH ABOVE JUNK', xr, 566, { size: 18, align: 'center', k: range(t, tRate + 0.2, tRate + 0.8), fam: F.mono, weight: 500, fill: P.ink, color: P.white, dot: P.teal });
        }
      }
      paintSeries(g, t, R);
      if (mode === 'nasdaq2000') {
        // the peak level carried to 2015: "15 YEARS"
        const [xa, ya] = R.xy[0], [xb] = R.xy[2], kl = range(t, tTag, tTag + 1.0);
        if (kl > 0) {
          g.save(); g.globalAlpha = clamp(kl * 2); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(xa + 16, ya); g.lineTo(lerp(xa + 16, xb - 16, E.inOutCubic(kl)), ya); g.stroke(); g.restore();
          const kb = range(t, tTag + 0.7, tTag + 1.3);
          if (kb > 0) { g.save(); g.globalAlpha = E.outCubic(kb); g.strokeStyle = P.ink; g.lineWidth = 3; const yb = ya - 46; g.beginPath(); g.moveTo(xa + 16, yb + 12); g.lineTo(xa + 16, yb); g.lineTo(xb - 16, yb); g.lineTo(xb - 16, yb + 12); g.stroke(); g.restore(); }
          G.slab(g, '15 YEARS TO RECOVER', (xa + xb) / 2, ya - 46, { size: 32, align: 'center', k: range(t, tTag + 0.9, tTag + 1.5) });
        }
      }
      if (mode === 'oracle') {
        const [xa, ya] = R.xy[1], [xb, yb] = R.xy[3];
        dropArrow(g, t, tTag, xa, ya, xb, yb, 1700, { slab: '≈ −61% FROM THE PEAK', math: '$328.33 → $128.23 = −60.9%', slabX: 1660, slabY: 420, fromX: 830 });
      }
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  // ------------------------------------------------ panel modes: lucent, october
  async function panels(ctx, shot, mode) {
    const Pm = shot.params ?? {}, V = PANELS[mode], D = shot.duration ?? 9, n = V.panels.length;
    const t0 = G.cue(shot, Pm.at, 0.6), dur = Pm.drawDur ?? clamp(D * 0.28, 1.6, 2.6), stag = Pm.stagger ?? clamp(D * 0.12, 0.6, 1.4);
    const T = V.panels.map((pn, i) => G.cue(shot, [].concat(Pm.panelAt ?? [])[i], t0 + i * stag));
    const Rs = V.panels.map((pn, i) => prep(V, pn.box, T[i], dur, pn.pts));
    const tSlab = V.panels.map((pn, i) => G.cue(shot, [].concat(Pm.tagAt ?? [])[i], T[i] + dur + 0.2));
    const mini = mode === 'october';
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, V.kicker, V.title, V.src);
      if (mini) G.asOf(g, 'AS OF 16 OCT 2026 CLOSE', 1800, 108, range(t, 0.8, 1.3), { align: 'right', size: 17 });
      else G.fig(g, KEYNOTE, 1800, 960, { size: 16, align: 'right', color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, 0.6, 1.2)) });
      V.panels.forEach((pn, i) => {
        const R = Rs[i], [x0, y0, x1, y1] = pn.box, kp = range(t, T[i] - 0.5, T[i] + 0.2);
        if (kp <= 0) return;
        g.save(); g.globalAlpha = E.outCubic(kp);
        G.text(g, pn.name, x0, y0 - (mini ? 104 : 92), { size: 44, weight: 900, color: P.ink, track: -0.01 });
        G.fig(g, pn.sub, x0 + 2, y0 - (mini ? 74 : 62), { size: 16, color: P.inkSoft, track: 0.1 });
        frame(g, pn.box, R.X, R.Y, V.yr, { yStep: V.yStep, yFmt: V.yFmt, ticks: V.ticks, ySize: mini ? 18 : 20, tSize: mini ? 18 : 20 });
        g.restore();
        paintSeries(g, t, R, { mini, lineW: mini ? 5 : 6, zeroY: mini ? R.Y(0) : null, fill: mini ? 'rgba(210,233,228,0.45)' : 'rgba(210,233,228,0.6)' });
        const [label, red] = pn.slab, ks = range(t, tSlab[i], tSlab[i] + 0.6);
        if (mini) {
          G.slab(g, label, (x0 + x1) / 2, y1 + 104, { size: 30, align: 'center', fill: red ? P.red : P.ink, k: ks });
          if (pn.math) G.ourMath(g, pn.math, (x0 + x1) / 2, y1 + 160, range(t, tSlab[i] + 0.3, tSlab[i] + 0.8), { align: 'center', size: 15 });
        } else {
          // the drop: a dashed level from the peak and an arrow down at the right edge; the slab sits low-left on the fill
          const [xa, ya] = R.xy[0], [xb, yb] = R.xy[1];
          dropArrow(g, t, tSlab[i], xa, ya, xb, yb, x1 - 10, { slab: label, red, slabX: x0 + 30, slabY: y1 - 56, align: 'left', math: null, fromX: lerp(x0, x1, 0.62) });
        }
      });
      if (!mini) G.fig(g, 'LUCENT FIGURES ARE APPROXIMATE (PRESS REPORTS)', 140, 960, { size: 16, color: P.tealDeep, track: 0.08, alpha: E.outCubic(range(t, T[0] + dur, T[0] + dur + 0.6)) });
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  // ------------------------------------------------ capex: Big-4 bars and the Apollo line
  async function capex(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const box = [300, 330, 1290, 850], [x0, y0, x1, y1] = box, yr = [0, 400], Y = (v) => y1 - v / yr[1] * (y1 - y0);
    const bars = [
      { v: 228.3, big: '$228B', lab: '2024', col: P.steel },
      { v: 376.1, big: '$376B', lab: '2025', col: P.ink },
      { v: 294.8, big: '$295B', lab: 'H1 2026', col: P.red, half: true },
    ];
    const BW = 220, XS = [480, 795, 1110];
    const t0 = G.cue(shot, Pm.at, 0.6), st = Pm.barStep ?? clamp(D * 0.13, 0.7, 1.5);
    const T = bars.map((b, i) => G.cue(shot, [].concat(Pm.barAt ?? [])[i], t0 + i * st));
    const tAp = G.cue(shot, Pm.apolloAt, T[2] + 1.3);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, 'MICROSOFT · ALPHABET · AMAZON · META · CAPITAL SPENDING', 'The biggest build in history',
        'SOURCES: COMPANY SEC FILINGS (XBRL), CASH CAPEX, CALENDAR YEARS · APOLLO: THE PLANETARY SOCIETY ($257B IN 2020 $) × BLS CPI-U');
      frame(g, box, (x) => x, Y, yr, { yStep: 100, yFmt: (v) => `$${v}B`, alpha: E.outCubic(range(t, 0.15, 0.7)) });
      // Apollo, all of it, in 2026 dollars: a dashed level BEHIND the bars (the 2025 bar overtops it, H1 2026 nearly reaches it)
      const ka = range(t, tAp, tAp + 1.0), ya = Y(335);
      if (ka > 0) {
        g.save(); g.globalAlpha = clamp(ka * 2); g.strokeStyle = P.teal; g.lineWidth = 4; g.setLineDash([16, 10]); g.lineDashOffset = -t * 10;
        g.beginPath(); g.moveTo(x0, ya); g.lineTo(lerp(x0, 1330, E.inOutCubic(ka)), ya); g.stroke(); g.restore();
        const kl = range(t, tAp + 0.6, tAp + 1.2), lx = 1360;
        G.text(g, 'THE APOLLO PROGRAM,', lx, ya - 14, { size: 34, weight: 900, color: P.tealDeep, alpha: E.outCubic(kl) });
        G.text(g, 'ALL OF IT', lx, ya + 26, { size: 34, weight: 900, color: P.tealDeep, alpha: E.outCubic(kl) });
        G.fig(g, '≈ $335B', lx, ya + 86, { size: 52, color: P.tealDeep, alpha: E.outCubic(range(t, tAp + 0.8, tAp + 1.4)) });
        G.ourMath(g, 'IN 2026 DOLLARS', lx, ya + 136, range(t, tAp + 1.0, tAp + 1.5), { size: 16 });
        G.fig(g, 'APPROXIMATE · SPENT 1960–73', lx + 2, ya + 182, { size: 15, color: P.inkSoft, track: 0.08, alpha: E.outCubic(range(t, tAp + 1.1, tAp + 1.6)) });
      }
      bars.forEach((b, i) => {
        const u = E.outCubic(range(t, T[i], T[i] + 0.9)), h = (y1 - Y(b.v)) * u, x = XS[i];
        if (u > 0) {
          G.card(g, x - BW / 2, y1 - h, BW, h, { r: 4, fill: b.col, lift: 0.8, grainA: 0.15 });
          if (b.half) { g.save(); g.beginPath(); g.rect(x - BW / 2, y1 - h, BW, h); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 10; for (let d = -BW; d < h + BW; d += 30) { g.beginPath(); g.moveTo(x - BW / 2, y1 - d); g.lineTo(x + BW / 2, y1 - d - BW); g.stroke(); } g.restore(); }
        }
        // the value inside the top of its bar, white
        const kv = range(t, T[i] + 0.5, T[i] + 1.0);
        G.fig(g, b.big, x, y1 - h + 66, { size: 50, align: 'center', color: P.white, alpha: E.outCubic(kv) });
        G.text(g, b.lab, x, y1 + 52, { size: 36, weight: 800, align: 'center', color: b.half ? P.red : P.ink, alpha: E.outCubic(range(t, T[i], T[i] + 0.5)) });
        if (b.half) G.pill(g, 'FIRST HALF ONLY', x, y1 + 100, { size: 19, align: 'center', k: range(t, T[i] + 0.7, T[i] + 1.2), fam: F.mono, weight: 500, fill: P.redPale, color: P.red });
      });
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  // ------------------------------------------------ gap: OpenAI commitments vs revenue, two states
  async function gap(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const box = [300, 340, 1120, 850], [x0, y0, x1, y1] = box, yr = [0, 1500], Y = (v) => y1 - v / yr[1] * (y1 - y0);
    const t0 = G.cue(shot, Pm.at, 0.6), tS = G.cue(shot, Pm.stepAt, Math.max(t0 + 3.4, D * 0.5));
    const A = { c: 1400, r: 13.1, cBig: '$1.4T', rBig: '$13.1B', cLab: 'COMPUTE COMMITMENTS', cSub: 'ALTMAN, 6 NOV 2025 · OVER 8 YEARS', rLab: 'REVENUE, 2025', rSub: 'REPORTED', mult: '≈ 107×', math: '$1.4T ÷ $13.1B', red: false };
    const B = { c: 600, r: 50, cBig: '~$600B', rBig: '~$50B', cLab: 'COMPUTE SPENDING PLAN', cSub: 'BY 2030 · RESET, 20 FEB 2026', rLab: 'REVENUE RUN-RATE', rSub: 'END-SEP 2026 · BY OPENAI’S OWN COUNTING', mult: '≈ 12×', math: '$600B ÷ $50B', red: true };
    const XC = 520, XR = 900, BW = 250;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, 'OPENAI · WHAT IT PLANS TO SPEND vs WHAT COMES IN', 'Planned spending vs money coming in',
        'SOURCES: TECHCRUNCH (6 NOV 2025); CNBC (20 FEB 2026); FT VIA TECHCRUNCH (8 OCT 2026) · REVENUE FIGURES ARE REPORTED, NOT AUDITED');
      frame(g, box, (x) => x, Y, yr, { yStep: 250, yFmt: (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 2 : 0)}T` : `$${v}B`), alpha: E.outCubic(range(t, 0.15, 0.7)) });
      const ug = E.outCubic(range(t, t0, t0 + 1.1)), um = E.inOutCubic(range(t, tS, tS + 1.1)), S = um < 0.5 ? A : B;
      const cv = lerp(A.c, B.c, um) * ug, rv = lerp(A.r, B.r, um) * E.outCubic(range(t, t0 + 0.6, t0 + 1.4));
      const hc = y1 - Y(cv), hr = Math.max(y1 - Y(rv), rv > 0 ? 3 : 0);
      if (um > 0 && um < 1) { g.save(); g.globalAlpha = 0.35 * (1 - um); g.setLineDash([6, 6]); g.strokeStyle = P.inkSoft; g.lineWidth = 2; g.strokeRect(XC - BW / 2, Y(A.c), BW, y1 - Y(A.c)); g.restore(); }
      if (ug > 0) G.card(g, XC - BW / 2, y1 - hc, BW, hc, { r: 4, fill: P.ink, lift: 0.8, grainA: 0.15 });
      if (rv > 0) G.card(g, XR - BW / 2, y1 - hr, BW, hr, { r: 2, fill: S.red ? P.teal : P.teal, lift: 0.5, grainA: 0 });
      // labels swap with a quick fade at the state change
      const sw = um > 0 && um < 1 ? Math.abs(um - 0.5) * 2 : 1;
      g.save(); g.globalAlpha = sw;
      G.fig(g, S.cBig, XC, y1 - hc - 26, { size: 56, align: 'center', color: P.ink, alpha: E.outCubic(range(t, t0 + 0.6, t0 + 1.1)) });
      G.fig(g, S.rBig, XR, y1 - hr - 26, { size: 56, align: 'center', color: P.ink, alpha: E.outCubic(range(t, t0 + 1.0, t0 + 1.5)) });
      [[XC, S.cLab, S.cSub, t0 + 0.3], [XR, S.rLab, S.rSub, t0 + 0.8]].forEach(([x, a, b, ta]) => {
        G.text(g, a, x, y1 + 50, { size: 27, weight: 800, align: 'center', color: P.ink, alpha: E.outCubic(range(t, ta, ta + 0.5)), maxW: 370 });
        G.fig(g, b, x, y1 + 82, { size: 15, align: 'center', color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, ta + 0.2, ta + 0.7)), maxW: 370 });
      });
      g.restore();
      // the multiplier panel
      const km = range(t, t0 + 1.6, t0 + 2.2);
      if (km > 0) {
        G.card(g, 1230, 380, 560, 430, { r: 24, lift: 0.9, fill: P.paper, grainA: 0.2, alpha: E.outCubic(km) });
        G.fig(g, 'PLANNED SPENDING ÷ MONEY IN', 1510, 450, { size: 17, align: 'center', color: P.inkSoft, track: 0.1, alpha: E.outCubic(km) });
        g.save(); g.globalAlpha = sw;
        G.text(g, S.mult, 1510, 640, { size: 170, weight: 900, align: 'center', color: S.red ? P.red : P.ink, track: -0.03, alpha: E.outCubic(range(t, t0 + 1.8, t0 + 2.4)), maxW: 520 });
        g.restore();
        G.ourMath(g, um < 0.5 ? A.math : B.math, 1510, 740, range(t, t0 + 2.1, t0 + 2.6) * sw, { align: 'center', size: 18 });
      }
      if (um > 0.5) G.fig(g, 'DIFFERENT DEFINITIONS: A MULTI-YEAR PLAN vs AN ANNUAL RATE', 1510, 860, { size: 14, align: 'center', color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, tS + 1.0, tS + 1.6)) });
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  // ------------------------------------------------ gartner: revenue needed vs forecast to 2030
  async function gartner(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const box = [300, 340, 1180, 850], [x0, y0, x1, y1] = box, yr = [0, 10], Y = (v) => y1 - v / yr[1] * (y1 - y0);
    const XA = 540, XB = 950, BW = 270;
    const t0 = G.cue(shot, Pm.at, 0.6), tB = G.cue(shot, Pm.forecastAt, t0 + 1.3), tG = G.cue(shot, Pm.gapAt, tB + 1.5);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, 'GARTNER · AI DATA CENTRES · CUMULATIVE TO 2030', 'The revenue gap',
        'SOURCE: GARTNER (14 OCT 2026), AS REPORTED BY SECONDARY OUTLETS (STOCKTWITS VIA YAHOO; OTHERS)');
      frame(g, box, (x) => x, Y, yr, { yStep: 2, yFmt: (v) => `$${v}T`, alpha: E.outCubic(range(t, 0.15, 0.7)) });
      const ua = E.outCubic(range(t, t0, t0 + 1.1)), hA = (y1 - Y(8.5)) * ua, ub = E.outCubic(range(t, tB, tB + 1.0)), hB = (y1 - Y(3.6)) * ub;
      if (ua > 0) G.card(g, XA - BW / 2, y1 - hA, BW, hA, { r: 4, fill: P.ink, lift: 0.8, grainA: 0.15 });
      if (ub > 0) G.card(g, XB - BW / 2, y1 - hB, BW, hB, { r: 4, fill: P.teal, lift: 0.8, grainA: 0.15 });
      G.fig(g, '~$8.5T', XA, y1 - hA - 26, { size: 58, align: 'center', color: P.ink, alpha: E.outCubic(range(t, t0 + 0.6, t0 + 1.1)) });
      G.fig(g, '≤ $3.6T', XB, y1 - hB - 26, { size: 58, align: 'center', color: P.ink, alpha: E.outCubic(range(t, tB + 0.6, tB + 1.1)) });
      [[XA, 'REVENUE NEEDED', 'TO COVER CAPEX, FINANCING', 'AND A 12% RETURN', t0], [XB, 'GARTNER’S FORECAST', 'AI REVENUE, AT MOST', '', tB]].forEach(([x, a, b, c, ta]) => {
        G.text(g, a, x, y1 + 50, { size: 28, weight: 800, align: 'center', alpha: E.outCubic(range(t, ta, ta + 0.5)), maxW: 390 });
        G.fig(g, b, x, y1 + 82, { size: 15, align: 'center', color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, ta + 0.2, ta + 0.7)) });
        if (c) G.fig(g, c, x, y1 + 104, { size: 15, align: 'center', color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, ta + 0.2, ta + 0.7)) });
      });
      // the gap: the forecast level carried across, the rest of the needed bar outlined in red
      const kg = range(t, tG, tG + 1.0);
      if (kg > 0) {
        const yF = Y(3.6), yN = Y(8.5);
        g.save(); g.globalAlpha = clamp(kg * 2); g.setLineDash([8, 8]); g.strokeStyle = P.tealDeep; g.lineWidth = 2.5; g.beginPath(); g.moveTo(XB - BW / 2, yF); g.lineTo(lerp(XB - BW / 2, XA - BW / 2 - 20, E.outCubic(kg)), yF); g.stroke(); g.restore();
        const kr = E.inOutCubic(range(t, tG + 0.5, tG + 1.3)), per = 2 * (BW + 12 + yF - yN + 12);
        g.save(); g.strokeStyle = P.red; g.lineWidth = 6; g.lineJoin = 'round'; g.setLineDash([per * kr, per]); G.rr(g, XA - BW / 2 - 6, yN - 6, BW + 12, yF - yN + 12, 8); g.stroke(); g.restore();
        G.slab(g, 'THE GAP', XA + BW / 2 + 40, (yN + yF) / 2, { size: 34, fill: P.red, k: range(t, tG + 1.0, tG + 1.6) });
      }
      // the headline as quoted
      const kq = range(t, tG + 1.4, tG + 2.1);
      if (kq > 0) {
        g.save(); g.globalAlpha = E.outCubic(kq);
        g.fillStyle = P.teal; g.fillRect(1290, 400, 6, 320);
        G.fig(g, 'GARTNER’S HEADLINE, 14 OCT 2026', 1320, 420, { size: 16, color: P.inkSoft, track: 0.1 });
        G.wrap(g, '“Over $3.5 Trillion of AI Infrastructure Spending Could Be Exposed to Impairment by the End of 2030”', 470, 40, 400, F.serif)
          .forEach((l, i) => G.text(g, l, 1320, 480 + i * 46, { size: 40, weight: 400, fam: F.serif, color: P.ink }));
        g.restore();
        G.pill(g, 'AS REPORTED · PRESS RELEASE NOT SEEN', 1320, 800, { size: 16, k: range(t, tG + 1.8, tG + 2.3), fam: F.mono, weight: 500, fill: P.steelPale, color: P.ink });
      }
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  // ------------------------------------------------ concentration: 100 squares of the S&P 500
  async function concentration(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const t0 = G.cue(shot, Pm.at, 0.5), tN = G.cue(shot, Pm.nvdaAt, t0 + 1.0), tM = G.cue(shot, Pm.mag7At, tN + clamp(D * 0.2, 1.4, 2.4)), tT = G.cue(shot, Pm.top10At, tM + clamp(D * 0.2, 1.4, 2.4));
    const NV = 7.93, M7 = 34.7, T10 = 40.2, C = 56, GP = 7, GX = 210, GY = 330;
    const rows = [
      { y: 420, v: '7.93%', name: 'NVIDIA', sub: 'THE LARGEST SINGLE HOLDING', t: tN, col: P.ink, sw: 'nv' },
      { y: 610, v: '34.7%', name: 'THE MAGNIFICENT 7', sub: 'NVDA 7.93 · AAPL 7.55 · MSFT 5.98 · GOOGL+GOOG 5.49', sub2: 'AMZN 3.89 · META 2.35 · TSLA 1.57', t: tM, col: P.red, sw: 'm7' },
      { y: 820, v: '40.2%', name: 'THE TOP 10 COMPANIES', sub: '+ BROADCOM 2.40 · MICRON 1.54 · ELI LILLY 1.50', t: tT, col: P.teal, sw: 't10' },
    ];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, 'THE S&P 500 · 100 SQUARES = THE WHOLE INDEX', 'Where an index fund’s money sits',
        'SOURCE: STATE STREET, SPY DAILY HOLDINGS, 19 OCT 2026 · GROUP WEIGHTS ARE SUMS (OUR MATH)');
      G.asOf(g, 'AS OF 19 OCT 2026', 1800, 250, range(t, 0.8, 1.3), { align: 'right', size: 17 });
      // the grid
      for (let i = 0; i < 100; i++) {
        const cx = GX + (i % 10) * (C + GP), cy = GY + Math.floor(i / 10) * (C + GP), ki = E.outBack(range(t, t0 + i * 0.008, t0 + 0.3 + i * 0.008));
        if (ki <= 0) continue;
        const s = C * ki, ox = cx + (C - s) / 2, oy = cy + (C - s) / 2;
        G.rr(g, ox, oy, s, s, 6); g.fillStyle = P.white; g.fill(); g.strokeStyle = 'rgba(20,35,61,0.14)'; g.lineWidth = 2; g.stroke();
        // fills: fraction of this square covered by each group (row-major, partial squares fill left to right)
        const cover = (v, tt, dly = 0.012) => clamp(v - i) * E.outCubic(range(t, tt + i * dly, tt + 0.35 + i * dly));
        const ft = cover(T10, tT), fm = cover(M7, tM), fn = cover(NV, tN, 0.05);
        const paint = (fr, col) => { if (fr <= 0) return; g.save(); G.rr(g, cx, cy, C, C, 6); g.clip(); g.fillStyle = col; g.fillRect(cx, cy, C * fr, C); g.restore(); };
        paint(ft, P.teal); paint(fm > 0 ? fm : 0, P.red);
        if (fm < clamp(NV - i)) paint(fn, P.ink);
        // Nvidia's squares keep a white mark inside the red block
        if (i < Math.ceil(NV) && fm > 0) { g.save(); g.globalAlpha = clamp(fm * 2); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; G.rr(g, cx + 9, cy + 9, (C - 18) * clamp(NV - i), C - 18, 3); g.stroke(); g.restore(); }
      }
      G.fig(g, 'EACH SQUARE = 1% OF THE INDEX', GX, GY + 10 * (C + GP) + 26, { size: 16, color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, t0 + 0.6, t0 + 1.2)) });
      // the legend
      rows.forEach((r) => {
        const kk = range(t, r.t, r.t + 0.7); if (kk <= 0) return;
        const x = 960;
        g.save(); g.globalAlpha = E.outCubic(kk);
        const nvRed = r.sw === 'nv' && t >= tM;
        G.rr(g, x, r.y - 52, 44, 44, 6); g.fillStyle = nvRed ? P.red : r.col; g.fill();
        if (nvRed) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; G.rr(g, x + 8, r.y - 44, 28, 28, 3); g.stroke(); }
        g.restore();
        G.fig(g, r.v, x + 72, r.y - 6, { size: 76, color: r.col === P.teal ? P.tealDeep : r.col, alpha: E.outCubic(kk) });
        const vw = G.measure(g, r.v, 76, 500, F.mono);
        G.text(g, r.name, x + 72 + vw + 28, r.y - 30, { size: 34, weight: 800, color: P.ink, alpha: E.outCubic(range(t, r.t + 0.2, r.t + 0.8)), maxW: 1800 - (x + 72 + vw + 28) });
        G.fig(g, r.sub, x + 74, r.y + 36, { size: 17, color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, r.t + 0.3, r.t + 0.9)), maxW: 830 });
        if (r.sub2) G.fig(g, r.sub2, x + 74, r.y + 62, { size: 17, color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, r.t + 0.3, r.t + 0.9)), maxW: 830 });
      });
    }, { push: 0.018, dx: 10, dy: 4 });
  }

  return { 'ai-chart': aiChart };
}
