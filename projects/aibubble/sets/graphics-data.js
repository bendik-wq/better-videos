// Silver data graphics (episode 7): charts of the sparse key prices in RESEARCH.md. Never a daily series: dots are the
// key closes, straight segments join them (said on screen in the source line), and the x-axis is piecewise linear
// where marked with a ⫽ break.
//   silver-chart  params.mode:
//     'runup'  31 Jul 1979 ~$9 -> 31 Dec 1979 $34.45 -> 17 Jan 1980 $48.70 (record settle), intraday tick to $50.36 (~$50, red)
//     'crash'  ~$50 peak -> 22 Jan $34.00 -> 10 Mar $29.75 -> 25 Mar $20.20 -> 26 Mar $15.80 -> 27 Mar $10.80 (red);
//              tags "−31.6% IN ONE DAY" (dayAt) and "−78.6% FROM THE PEAK" (peakAt), OUR MATH
//     'long'   1973 avg $2.55 · Jan 1980 ~$50 · 27 Mar 1980 $10.80 · Apr 2011 $49.85 · Oct 2025 above $50 ·
//              29 Jan 2026 $121.64 (red) · 30 Jan 2026 −27% · 19 Oct 2026 $56.89 (AS OF)
//     'real'   two bars: the 1980 peak $49.45 (London fix) = $214.16 in Sep-2026 dollars vs the $121.64 record (BLS CPI-U)
//   other params: at (draw start), dayAt, peakAt (crash), adjustAt (real), title, kicker, source, drawDur
// Every value on screen is checked against RESEARCH.md (§0, §3, §6, §11, §12). OUR MATH and AS OF are labelled.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU } = G;
const ms = G.ms;

// ---------------------------------------------------------------- the modes (all values from RESEARCH.md)
// pts: { d, v, big, line, red, tag: [dx, dy, align] }; join: index pairs drawn as straight segments
// axis: piecewise segments [fromDate, toDate, share of width, break-before?]
const MODES = {
  runup: {
    kicker: 'SPOT SILVER · $ PER OUNCE · 1979 – 80', title: 'The run-up: from about $9 to about $50',
    src: 'KEY CLOSES · SEC STAFF REPORT (1982) PP. 4, 32, 37, 65 · LINE JOINS POINTS',
    axis: [['1979-07-01', '1980-02-15', 1]], yr: [0, 60], yStep: 10,
    ticks: [['1979-08-01', 'AUG 1979'], ['1979-10-01', 'OCT'], ['1979-12-01', 'DEC'], ['1980-02-01', 'FEB 1980']],
    pts: [
      { d: '1979-07-31', v: 9.0, big: '~$9', line: '31 JUL 1979 · GROUP ~123M OZ', tag: [26, -70, 'left'] },
      { d: '1979-12-31', v: 34.45, big: '$34.45', line: '31 DEC 1979 · ~195M OZ', tag: [-30, -10, 'right'] },
      { d: '1980-01-17', v: 48.70, big: '$48.70', line: 'RECORD SETTLE · 17 JAN', tag: [28, 76, 'left'] },
    ],
    join: [[0, 1], [1, 2]],
  },
  crash: {
    kicker: 'SPOT SILVER · $ PER OUNCE · JAN – MAR 1980', title: 'Ten weeks down',
    src: 'KEY CLOSES · SEC STAFF REPORT (1982) PP. 7, 35, 65, 79, 93 · PEAK = COMEX INTRADAY HIGH · LINE JOINS POINTS',
    axis: [['1980-01-12', '1980-03-23', 0.55], ['1980-03-23', '1980-03-29', 0.45, true]], yr: [0, 60], yStep: 10,
    ticks: [['1980-02-01', '1 FEB'], ['1980-03-01', '1 MAR'], ['1980-03-25', 'TUE 25'], ['1980-03-26', 'WED 26'], ['1980-03-27', 'THU 27']],
    note: [1, 'LAST 3 DAYS, ZOOMED'],
    pts: [
      { d: '1980-01-18', v: 50.36, big: '~$50', line: '17–18 JAN · INTRADAY $50.36', tag: [30, 62, 'left'] },
      { d: '1980-01-22', v: 34.00, big: '$34.00', line: '22 JAN · AFTER LIQUIDATION ONLY', tag: [40, 92, 'left'] },
      { d: '1980-03-10', v: 29.75, big: '$29.75', line: '10 MAR', tag: [0, -84, 'center'] },
      { d: '1980-03-25', v: 20.20, big: '$20.20', tag: [-24, -56, 'right'] },
      { d: '1980-03-26', v: 15.80, big: '$15.80', tag: [-24, 66, 'right'] },
      { d: '1980-03-27', v: 10.80, big: '$10.80', red: true, tag: [26, 0, 'left'] },
    ],
    join: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  long: {
    kicker: 'SILVER · $ PER OUNCE · KEY PRICES 1973 – 2026', title: 'Fifty dollars, three times',
    src: 'KEY PRICES ONLY · SEC (1982); HEARINGS (1980); INVESTMENTNEWS; CNN; REUTERS; TRADING ECONOMICS · LINES JOIN POINTS WITHIN EACH EPISODE',
    axis: [['1972-01-01', '1981-07-01', 0.26], ['1981-07-01', '2010-01-01', 0.1, true], ['2010-01-01', '2025-07-01', 0.24, true], ['2025-07-01', '2027-01-01', 0.4, true]],
    yr: [0, 130], yStep: 20,
    ticks: [['1975-01-01', '1975'], ['1980-01-01', '1980'], ['1995-01-01', '1995'], ['2015-01-01', '2015'], ['2020-01-01', '2020'], ['2025-10-01', 'OCT 2025'], ['2026-04-01', 'APR 2026'], ['2026-10-01', 'OCT 2026']],
    pts: [
      { d: '1973-07-01', v: 2.55, big: '$2.55', line: '1973 AVERAGE', tag: [22, -66, 'left'] },
      { d: '1980-01-18', v: 50, big: '~$50', line: 'JAN 1980', tag: [-26, -40, 'right'] },
      { d: '1980-03-27', v: 10.80, big: '$10.80', line: '27 MAR 1980', tag: [26, -24, 'left'] },
      { d: '2011-04-25', v: 49.85, big: '$49.85', line: '25 APR 2011', tag: [0, -70, 'center'] },
      { d: '2025-10-09', v: 50, big: 'ABOVE $50', line: 'OCT 2025 · FIRST TIME', tag: [-26, 40, 'right'] },
      { d: '2026-01-29', v: 121.64, big: '$121.64', line: 'RECORD · 29 JAN 2026', red: true, tag: [-30, 0, 'right'] },
      { d: '2026-01-30', v: 88.80, big: '−27%', line: '30 JAN 2026 · ONE DAY', tag: [30, 0, 'left'] },
      { d: '2026-10-19', v: 56.89, big: '$56.89', line: '19 OCT 2026', tag: [0, 78, 'center'], asof: true },
    ],
    join: [[1, 2], [4, 5], [5, 6], [6, 7]],
    foot: '30 JAN 2026 PLOTTED AT −27% FROM THE RECORD (OUR MATH)',
  },
};

export default function makeData(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- chart helpers
  // piecewise-linear date axis: segs [[a, b, share, break]] -> X(ms), plus the x of every break
  function xAxis(segs, x0, x1) {
    const tot = segs.reduce((a, s) => a + s[2], 0), out = []; let x = x0;
    for (const [a, b, sh, br] of segs) { const w = (x1 - x0) * sh / tot; out.push({ a: ms(a), b: ms(b), x, w, br: !!br }); x += w; }
    const X = (t) => { let s = out.find(o => t <= o.b) ?? out.at(-1); if (t < out[0].a) s = out[0]; return s.x + (t - s.a) / (s.b - s.a) * s.w; };
    return { X, segs: out };
  }
  function frame(g, box, X, Y, yr, { yStep = 10, yFmt = (v) => `$${v}`, ticks = [], segs = [], alpha = 1, note = null } = {}) {
    const [x0, y0, x1, y1] = box;
    g.save(); g.globalAlpha *= alpha;
    for (let v = Math.ceil(yr[0] / yStep) * yStep; v <= yr[1] + 1e-9; v += yStep) {
      const yy = Y(v); if (yy < y0 - 2 || yy > y1 + 2) continue;
      g.fillStyle = v === 0 ? P.ink : P.rule; g.fillRect(x0, yy - 1, x1 - x0, v === 0 ? 3 : 2);
      G.fig(g, yFmt(+v.toFixed(2)), x0 - 18, yy + 8, { size: 22, align: 'right', color: P.inkSoft });
    }
    for (const [d, s] of ticks) { const xx = X(ms(d)); if (xx < x0 - 1 || xx > x1 + 1) continue; g.fillStyle = P.rule; g.fillRect(xx - 1, y1, 2, 12); G.fig(g, s, xx, y1 + 42, { size: 21, align: 'center', color: P.inkSoft }); }
    // breaks: a ⫽ on the axis and a faint band where the scale changes
    segs.forEach((s, i) => {
      if (!s.br) return; const bx = s.x;
      g.fillStyle = 'rgba(42,140,134,0.06)'; g.fillRect(bx - 1, y0, 2, y1 - y0);
      g.save(); g.strokeStyle = P.white; g.lineWidth = 12; g.beginPath(); g.moveTo(bx - 10, y1 + 16); g.lineTo(bx + 2, y1 - 16); g.moveTo(bx + 4, y1 + 16); g.lineTo(bx + 16, y1 - 16); g.stroke();
      g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 12, y1 + 16); g.lineTo(bx, y1 - 16); g.moveTo(bx + 6, y1 + 16); g.lineTo(bx + 18, y1 - 16); g.stroke(); g.restore();
    });
    if (note) { const s = segs[note[0]]; g.fillStyle = 'rgba(42,140,134,0.06)'; g.fillRect(s.x, y0, s.w, y1 - y0); G.fig(g, note[1], s.x + s.w / 2, y0 + 4, { size: 17, align: 'center', color: P.tealDeep, track: 0.12 }); }
    g.restore();
  }
  const dot = (g, x, y, col, r = 9, k = 1) => { if (k <= 0) return; const s = E.outBack(clamp(k)); g.save(); G.shadow(g, 0.3); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, (r + 4) * s, 0, TAU); g.fill(); G.noShadow(g); g.fillStyle = col; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.fill(); g.restore(); };
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
  const chrome = (g, t, Pm, kick, ttl, src) => {
    G.card(g, 50, 34, 1820, 1000, { r: 32, lift: 1.1 });
    G.kicker(g, Pm.kicker ?? kick, 120, 118, range(t, 0.05, 0.6));
    G.riseText(g, Pm.title ?? ttl, 120, 192, range(t, 0.12, 0.9), { size: 58, weight: 800, maxW: 1640 });
    G.source(g, Pm.source ?? src, range(t, 0.6, 1.4), { y: 1004, back: false, x: 1810, size: 16 });
  };

  // ================================================================ silver-chart
  async function silverChart(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'runup');
    if (mode === 'real') return real(ctx, shot);
    const V = MODES[mode] ?? MODES.runup, D = shot.duration ?? 9;
    const box = [220, 300, 1720, 880], [x0, y0, x1, y1] = box;
    const ax = xAxis(V.axis, x0, x1), X = ax.X, Y = (v) => y1 - (v - V.yr[0]) / (V.yr[1] - V.yr[0]) * (y1 - y0);
    const xy = V.pts.map(p => [X(ms(p.d)), Y(p.v)]);
    const t0 = G.cue(shot, Pm.at, 0.6);
    const dur = Pm.drawDur ?? clamp(D * 0.45, 2.4, mode === 'runup' ? 3.4 : 4.4);
    // the sweep: an x that moves left to right; segments are clipped to it, dots pop as it passes
    const sweepX = (t) => lerp(x0 - 4, x1 + 4, E.inOutSine(range(t, t0, t0 + dur)));
    const passT = xy.map(([x]) => t0 + dur * Math.acos(1 - 2 * clamp((x - x0 + 4) / (x1 - x0 + 8))) / Math.PI);
    const tDay = G.cue(shot, Pm.dayAt, t0 + dur + 0.5), tPeak = G.cue(shot, Pm.peakAt, Math.min(D - 2.2, tDay + 1.8));
    const tPeakTick = passT[2] + 0.5; // runup: the intraday tick above the record settle
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, V.kicker, V.title, V.src);
      frame(g, box, X, Y, V.yr, { yStep: V.yStep, ticks: V.ticks, segs: ax.segs, alpha: E.outCubic(range(t, 0.15, 0.7)), note: V.note });
      const sx = sweepX(t);
      // area under joined segments, then the line
      g.save(); g.beginPath(); g.rect(x0 - 20, y0 - 60, sx - x0 + 20, y1 - y0 + 80); g.clip();
      for (const [a, b] of V.join) { g.save(); g.beginPath(); g.moveTo(xy[a][0], y1); g.lineTo(...xy[a]); g.lineTo(...xy[b]); g.lineTo(xy[b][0], y1); g.closePath(); g.fillStyle = 'rgba(210,233,228,0.6)'; g.fill(); g.restore(); }
      for (const [a, b] of V.join) { g.save(); g.beginPath(); g.moveTo(...xy[a]); g.lineTo(...xy[b]); g.strokeStyle = V.pts[b].red ? P.ink : P.ink; g.lineWidth = 6; g.lineCap = 'round'; g.stroke(); g.restore(); }
      g.restore();
      // stems (lollipops) for every key price, dots, tags with a leader line
      V.pts.forEach((pt, i) => {
        const [x, y] = xy[i], kk = range(t, passT[i] - 0.05, passT[i] + 0.4); if (kk <= 0) return;
        g.save(); g.globalAlpha = clamp(kk * 2); g.setLineDash([3, 6]); g.strokeStyle = P.inkFaint; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, lerp(y1, y, E.outCubic(kk))); g.stroke(); g.restore();
        dot(g, x, y, pt.red ? P.red : P.ink, pt.red ? 12 : 9, kk);
        if (pt.red && kk >= 1) { const ph = (t * 0.7) % 1; g.save(); g.strokeStyle = P.red; g.globalAlpha = (1 - ph) * 0.5; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 14 + ph * 30, 0, TAU); g.stroke(); g.restore(); }
        const [dx, dy, al] = pt.tag ?? [24, -40, 'left'], kt = range(t, passT[i] + 0.15, passT[i] + 0.7);
        if (kt > 0 && (dx || dy)) { g.save(); g.globalAlpha = clamp(kt * 2) * 0.6; g.strokeStyle = P.inkSoft; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * 0.8, y + dy * 0.8); g.stroke(); g.restore(); }
        tag(g, x + dx, y + dy, kt, { big: pt.big, line: pt.line, color: pt.red ? P.red : P.ink, align: al });
        if (pt.asof) G.asOf(g, 'AS OF 19 OCT 2026', x + dx, y + dy + (dy > 0 ? 76 : -80), range(t, passT[i] + 0.5, passT[i] + 1.0), { align: 'center', size: 18 });
      });
      // the sweep head
      if (t > t0 && t < t0 + dur) { g.save(); g.fillStyle = 'rgba(42,140,134,0.18)'; g.fillRect(sx - 1.5, y0 - 20, 3, y1 - y0 + 20); g.restore(); }
      // mode overlays
      if (mode === 'runup') {
        // the intraday high above the record settle: ~$50, the one red label
        const [x, y] = xy[2], kp = range(t, tPeakTick, tPeakTick + 0.6), yp = Y(50.36);
        if (kp > 0) {
          g.save(); g.globalAlpha = clamp(kp * 2); g.setLineDash([5, 6]); g.strokeStyle = P.red; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, lerp(y, yp, E.outCubic(kp))); g.stroke(); g.setLineDash([]);
          g.fillStyle = P.red; g.beginPath(); g.arc(x, lerp(y, yp, E.outCubic(kp)), 8, 0, TAU); g.fill(); g.restore();
          tag(g, x - 34, yp - 24, range(t, tPeakTick + 0.2, tPeakTick + 0.8), { big: '~$50', line: 'INTRADAY HIGH $50.36 · 17–18 JAN 1980', color: P.red, align: 'right', sizeB: 48 });
        }
      }
      if (mode === 'crash') {
        // −31.6% in one day (26 -> 27 Mar), red
        const kd = range(t, tDay, tDay + 0.6);
        if (kd > 0) {
          const [xa, ya] = xy[4], [xb, yb] = xy[5], bx = xb + 4;
          g.save(); g.globalAlpha = clamp(kd * 2); g.strokeStyle = P.red; g.lineWidth = 3; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(xa, ya); g.lineTo(lerp(xa, bx + 60, E.outCubic(kd)), ya); g.stroke(); g.restore();
          G.slab(g, '−31.6% IN ONE DAY', 1490, 625, { size: 30, fill: P.red, align: 'center', k: range(t, tDay + 0.2, tDay + 0.8) });
          G.ourMath(g, '$15.80 → $10.80', 1490, 683, range(t, tDay + 0.5, tDay + 1.0), { align: 'center', size: 17 });
        }
        // −78.6% from the peak, navy
        const kq = range(t, tPeak, tPeak + 0.8);
        if (kq > 0) {
          const [xp, yp] = xy[0], yb = xy[5][1], bx = 1806;
          g.save(); g.globalAlpha = clamp(kq * 2); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.setLineDash([7, 7]); g.beginPath(); g.moveTo(xp + 14, yp); g.lineTo(lerp(xp + 14, bx, E.outCubic(kq)), yp); g.stroke(); g.setLineDash([]);
          const ky = E.outCubic(range(t, tPeak + 0.4, tPeak + 1.0)), ye = lerp(yp, yb, ky);
          if (ky > 0) { g.lineWidth = 4; g.beginPath(); g.moveTo(bx, yp); g.lineTo(bx, ye); g.stroke(); g.beginPath(); g.moveTo(bx - 10, ye - 14); g.lineTo(bx, ye); g.lineTo(bx + 10, ye - 14); g.stroke(); }
          g.restore();
          G.slab(g, '−78.6% FROM THE PEAK', bx - 24, 452, { size: 30, align: 'right', k: range(t, tPeak + 0.6, tPeak + 1.2) });
          G.ourMath(g, '($50.36 − $10.80) ÷ $50.36', bx - 24, 510, range(t, tPeak + 0.9, tPeak + 1.4), { align: 'right', size: 17 });
        }
      }
      if (V.foot) G.fig(g, V.foot, x0, 962, { size: 16, color: P.tealDeep, track: 0.08, alpha: E.outCubic(range(t, t0 + dur, t0 + dur + 0.6)) });
      G.fig(g, 'DOTS = KEY PRICES · NOT A DAILY SERIES' + (ax.segs.some(s => s.br) ? ' · ⫽ = SCALE CHANGE' : ''), x1, 270, { size: 16, align: 'right', color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, 0.6, 1.2)) });
    }, { push: 0.03, dx: 24, dy: 6, fx: 1100 });
  }

  // ------------------------------------------------ real: the 1980 peak in today's dollars vs the 2026 record
  async function real(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const tA = G.cue(shot, Pm.at, 0.5), tAdj = G.cue(shot, Pm.adjustAt, Math.max(tA + 1.8, Math.min(D * 0.38, 3.2))), tRec = G.cue(shot, Pm.recordAt, tA + 0.5);
    const box = [380, 300, 1540, 860], [x0, y0, x1, y1] = box, yr = [0, 240], Y = (v) => y1 - v / yr[1] * (y1 - y0);
    const NOM = 49.45, REAL = 214.16, REC = 121.64, BW = 300, XA = 700, XB = 1220;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(1);
      chrome(g, t, Pm, 'SILVER · ADJUSTED FOR INFLATION', 'The 1980 peak was higher', 'SOURCES: LONDON FIX 18 JAN 1980; REUTERS (29 JAN 2026); BLS CPI-U JAN 1980 = 77.8, SEP 2026 = 336.940');
      frame(g, box, (x) => x, Y, yr, { yStep: 40, alpha: E.outCubic(range(t, 0.15, 0.7)) });
      // bar A: nominal, then the inflation adjustment stacked on top
      const ua = E.outCubic(range(t, tA, tA + 1.0)), uadj = E.spring(range(t, tAdj, tAdj + 1.4));
      const hNom = (y1 - Y(NOM)) * ua, hAdj = (Y(NOM) - Y(REAL)) * clamp(uadj, 0, 1.08);
      G.card(g, XA - BW / 2, y1 - hNom, BW, hNom, { r: 4, fill: P.steel, lift: 0.6, grainA: 0.2 });
      if (hAdj > 0) { G.card(g, XA - BW / 2, y1 - hNom - hAdj, BW, hAdj, { r: 4, fill: P.ink, lift: 1, grainA: 0.15 }); }
      if (ua > 0.3) G.fig(g, `$${NOM.toFixed(2)}`, XA, y1 - hNom / 2 + 10, { size: 30, align: 'center', color: P.white, alpha: E.outCubic(range(t, tA + 0.4, tA + 0.9)) });
      if (ua > 0.3) G.fig(g, 'IN 1980 DOLLARS', XA, y1 - hNom / 2 + 36, { size: 15, align: 'center', color: 'rgba(255,255,255,0.85)', track: 0.08, alpha: E.outCubic(range(t, tA + 0.5, tA + 1.0)) });
      // value over A: count from $49.45 to $214
      const shownA = lerp(NOM, REAL, clamp(uadj)), topA = y1 - hNom - hAdj;
      G.fig(g, uadj > 0.02 ? `$${shownA.toFixed(0)}` : `$${NOM.toFixed(2)}`, XA, topA - 24, { size: 64, align: 'center', color: uadj > 0.02 ? P.red : P.ink, alpha: E.outCubic(range(t, tA + 0.5, tA + 1.0)) });
      if (uadj > 0.02) G.fig(g, `≈ $${REAL.toFixed(2)} IN SEP-2026 DOLLARS`, XA, topA - 96, { size: 18, align: 'center', color: P.red, track: 0.08, alpha: E.outCubic(range(t, tAdj + 0.8, tAdj + 1.3)) });
      // bar B: the 2026 record
      const ub = E.outCubic(range(t, tRec, tRec + 1.1)), hB = (y1 - Y(REC)) * ub;
      G.card(g, XB - BW / 2, y1 - hB, BW, hB, { r: 4, fill: P.teal, lift: 0.9, grainA: 0.2 });
      G.fig(g, `$${REC.toFixed(2)}`, XB, y1 - hB - 24, { size: 64, align: 'center', color: P.ink, alpha: E.outCubic(range(t, tRec + 0.6, tRec + 1.1)) });
      // the record's level carried across to the 1980 bar
      const kl = range(t, tAdj + 1.0, tAdj + 1.7);
      if (kl > 0) { g.save(); g.globalAlpha = clamp(kl * 2); g.setLineDash([8, 8]); g.strokeStyle = P.tealDeep; g.lineWidth = 2.5; g.beginPath(); g.moveTo(XB - BW / 2, Y(REC)); g.lineTo(lerp(XB - BW / 2, XA - BW / 2 - 30, E.outCubic(kl)), Y(REC)); g.stroke(); g.restore(); }
      // labels under the bars
      [[XA, '1980 PEAK', '18 JAN 1980 · LONDON FIX'], [XB, '2026 RECORD', '29 JAN 2026 · SPOT']].forEach(([x, a, b], i) => {
        const kk = range(t, (i ? tRec : tA) + 0.2, (i ? tRec : tA) + 0.8);
        G.text(g, a, x, y1 + 50, { size: 30, weight: 800, align: 'center', color: P.ink, alpha: E.outCubic(kk) });
        G.fig(g, b, x, y1 + 80, { size: 17, align: 'center', color: P.inkSoft, track: 0.08, alpha: E.outCubic(kk) });
      });
      G.ourMath(g, 'BLS CPI-U · $49.45 × 336.940 ÷ 77.8 = $214.16', 1800, 270, range(t, tAdj + 0.6, tAdj + 1.1), { align: 'right', size: 18 });
    }, { push: 0.035, dx: 20, dy: 6 });
  }

  return { 'silver-chart': silverChart };
}
