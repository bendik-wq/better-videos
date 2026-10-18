// Mortgage data graphics: charts drawn from the FRED CSVs in projects/mortgage/assets/data and the RESEARCH tables.
//   rates    params.mode:
//     'paradox'   Fed funds upper target (red step line) vs the 30-yr mortgage (PMMS), Aug 2024 -> Jan 2025:
//                 −1.00 vs +0.95 (18 Sep 2024 -> 16 Jan 2025); then (extend, extendAt) to Dec 2025: −1.75 vs 6.09 -> 6.22
//     'today'     the same two lines to Oct 2026: last cut 10 Dec 2025, the 16 Sep 2026 hike (+0.25), 7.40% (AS OF)
//     'tenyear'   10-yr (7-day avg) vs mortgage since Apr 1971, the spread shaded: avg 1.76 (OUR MATH), now 2.30
//     'history'   10-yr since 1962: 1981 peak 15.84%, the 1994 rout 5.19% -> 8.05%, 5.31% on 5 Oct 2026; focus '1994' zooms
//     'auctions'  10-yr auction high yields 2026 (lollipops on a date axis), the Nov 2000 marker; series: 30 for the bond
//   bidders  params.mode: 'auction' (7 Oct shares, bid-to-cover) | 'demand' ($108B of bids for $39B) | 'investor-class'
//   payment  params.variant: 'base' ($400k, 6.27% -> 7.40%) | 'median' ($417,500 home, 20% down) | '3pct' (3.00% -> 7.40%)
//   debt     params.mode: 'counter' | 'interest' | 'wall' | 'rates'
// Every value on screen is checked against RESEARCH.md (§2, §4, §5, §7, §11). OUR MATH and AS OF are labelled.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU } = G;
const DAY = 864e5, ms = G.ms;
// the time at which an inOutSine draw-on of [a, b] over [t0, t0 + dur] reaches `date`
const reach = (date, a, b, t0, dur) => t0 + dur * Math.acos(1 - 2 * clamp((date - a) / (b - a))) / Math.PI;

export default function makeData(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ---------------------------------------------------------------- chart helpers
  const yearTicks = (a, b, step) => { const out = []; for (let y = Math.ceil(new Date(a).getUTCFullYear() / step) * step; ; y += step) { const t = Date.UTC(y, 0, 1); if (t > b) break; if (t >= a) out.push([t, String(y)]); } return out; };
  const monthTicks = (a, b, every = 3, withYear = true) => { const out = []; const d = new Date(a); let y = d.getUTCFullYear(), m = d.getUTCMonth() + 1; for (;;) { if (m > 11) { m -= 12; y++; } const t = Date.UTC(y, m, 1); if (t > b) break; if (m % every === 0) out.push([t, m === 0 && withYear ? `${G.MON[m]} ${y}` : G.MON[m]]); m++; } return out; };
  function frame(g, box, X, Y, yr, { yStep = 1, yFmt = (v) => `${v}%`, xTicks = [], alpha = 1 } = {}) {
    const [x0, y0, x1, y1] = box;
    g.save(); g.globalAlpha *= alpha;
    for (let v = Math.ceil(yr[0] / yStep) * yStep; v <= yr[1] + 1e-9; v += yStep) {
      const yy = Y(v); if (yy < y0 - 2 || yy > y1 + 2) continue;
      g.fillStyle = P.rule; g.fillRect(x0, yy - 1, x1 - x0, 2);
      G.fig(g, yFmt(+v.toFixed(2)), x0 - 16, yy + 8, { size: 22, align: 'right', color: P.inkSoft });
    }
    for (const [v, s] of xTicks) { const xx = X(v); if (xx < x0 - 1 || xx > x1 + 1) continue; g.fillStyle = P.rule; g.fillRect(xx - 1, y1, 2, 12); G.fig(g, s, xx, y1 + 42, { size: 22, align: 'center', color: P.inkSoft }); }
    g.fillStyle = P.ink; g.fillRect(x0, y1, x1 - x0, 3);
    g.restore();
  }
  // series points [t, v] -> path up to tCut (with an interpolated head); returns the head [x, y]
  function linePath(g, pts, X, Y, tCut) {
    g.beginPath(); let head = null, prev = null;
    for (let i = 0; i < pts.length; i++) {
      const [t, v] = pts[i];
      if (t > tCut) { if (prev) { const u = (tCut - prev[0]) / (t - prev[0]); head = [X(tCut), Y(lerp(prev[1], v, u))]; g.lineTo(head[0], head[1]); } break; }
      const x = X(t), y = Y(v); prev ? g.lineTo(x, y) : g.moveTo(x, y); prev = pts[i]; head = [x, y];
    }
    return head;
  }
  function stepPath(g, pts, X, Y, tCut) {
    g.beginPath(); let head = null;
    for (let i = 0; i < pts.length; i++) {
      const [t, v] = pts[i]; if (t > tCut) break;
      if (i === 0) g.moveTo(X(t), Y(v)); else { g.lineTo(X(t), Y(pts[i - 1][1])); g.lineTo(X(t), Y(v)); }
      head = [X(t), Y(v)];
      const nt = i + 1 < pts.length ? pts[i + 1][0] : Infinity;
      if (nt > tCut) { g.lineTo(X(tCut), Y(v)); head = [X(tCut), Y(v)]; }
    }
    return head;
  }
  const stroke = (g, color, w, dash = null) => { g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; if (dash) g.setLineDash(dash); g.stroke(); g.restore(); };
  const dot = (g, x, y, col, r = 9) => { g.save(); G.shadow(g, 0.3); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, r + 4, 0, TAU); g.fill(); G.noShadow(g); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); };
  // a value tag: a small card with a big figure and a mono line, anchored by its left/right edge
  function tag(g, x, y, k, { big, line, color = P.ink, align = 'left', w = null, sizeB = 44 }) {
    if (k <= 0) return null;
    const wb = G.measure(g, big, sizeB, 500, F.mono), wl = line ? G.measure(g, line, 18, 500, F.mono, 0.08) : 0, W = w ?? Math.max(wb, wl) + 40, Hh = line ? 98 : 70;
    const x0 = align === 'right' ? x - W : align === 'center' ? x - W / 2 : x;
    g.save(); g.globalAlpha *= clamp(k * 2); g.translate(0, (1 - E.outCubic(k)) * 14);
    G.card(g, x0, y - Hh / 2, W, Hh, { r: 14, lift: 0.8, grainA: 0 });
    g.fillStyle = color; g.fillRect(x0, y - Hh / 2 + 12, 5, Hh - 24);
    G.fig(g, big, x0 + 20, y + (line ? -2 : 15), { size: sizeB, color });
    if (line) G.fig(g, line, x0 + 21, y + 32, { size: 18, color: P.inkSoft, track: 0.08 });
    g.restore(); return { x: x0, w: W };
  }
  const vline = (g, x, y0, y1, k, col = P.inkSoft) => { if (k <= 0) return; g.save(); g.globalAlpha *= clamp(k * 2); g.setLineDash([6, 7]); g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, lerp(y1, y0, E.outCubic(k))); g.stroke(); g.restore(); };
  const chrome = (g, t, Pm, kick, ttl, src) => {
    G.card(g, 50, 34, 1820, 1000, { r: 32, lift: 1.1 });
    G.kicker(g, Pm.kicker ?? kick, 120, 118, range(t, 0.05, 0.6));
    G.riseText(g, Pm.title ?? ttl, 120, 192, range(t, 0.12, 0.9), { size: 58, weight: 800, maxW: 1640 });
    G.source(g, Pm.source ?? src, range(t, 0.6, 1.4), { y: 1004, back: false, x: 1810 });
  };

  // ---------------------------------------------------------------- data prep
  async function prep() {
    const [mort, g10, fu] = await Promise.all([G.series('MORTGAGE30US'), G.series('DGS10'), G.series('DFEDTARU')]);
    const toPts = (s, a, b, stepDays = 0) => { const o = []; let last = -Infinity; for (let i = 0; i < s.t.length; i++) { const t = s.t[i]; if (t < a || t > b) continue; if (stepDays && t - last < stepDays * DAY) continue; o.push([t, s.v[i]]); last = t; } return o; };
    const steps = (s, a, b) => { const o = []; let pv = null; for (let i = 0; i < s.t.length; i++) { const t = s.t[i]; if (t > b) break; if (t < a) { pv = s.v[i]; continue; } if (!o.length && pv != null) o.push([a, pv]); if (!o.length || s.v[i] !== o.at(-1)[1]) o.push([t, s.v[i]]); } return o; };
    // 7-day average 10-year for each PMMS week (RESEARCH C8 method)
    const wk10 = (a, b) => { const o = []; let j = 0; for (let i = 0; i < mort.t.length; i++) { const t = mort.t[i]; if (t < a || t > b) continue; while (j < g10.t.length && g10.t[j] <= t - 7 * DAY) j++; let s = 0, n = 0; for (let q = j; q < g10.t.length && g10.t[q] <= t; q++) { s += g10.v[q]; n++; } if (n) o.push([t, s / n, mort.v[i]]); } return o; };
    return { mort, g10, fu, toPts, steps, wk10 };
  }

  // ================================================================ rates
  async function rates(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'paradox');
    const d = await prep();
    if (mode === 'tenyear') return tenyear(ctx, shot, d);
    if (mode === 'history') return history(ctx, shot, d);
    if (mode === 'auctions') return auctions(ctx, shot);
    if (mode === 'today') return today(ctx, shot, d);
    return paradox(ctx, shot, d);
  }

  // ------------------------------------------------ paradox: Fed −1.00 vs mortgage +0.95, then −1.75 vs +0.13
  async function paradox(ctx, shot, d) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 12;
    const A = ms('2024-08-01'), B1 = ms('2025-02-14'), B2 = ms('2026-01-20');
    const mort = d.toPts(d.mort, A, B2), fed = d.steps(d.fu, A, B2);
    const box = [200, 290, 1520, 860];
    // three beats: draw to the first cut (at), the 6.09% tag (fromAt), then the four months of cuts (riseAt)
    const t0 = G.cue(shot, Pm.at, 0.4), t6 = G.cue(shot, Pm.fromAt, t0 + 1.3), tR = Math.max(t6 + 0.3, G.cue(shot, Pm.riseAt, t6 + 0.7));
    const drawDur = Pm.drawDur ?? Math.min(3.0, Math.max(1.8, D * 0.25)), tA = tR + drawDur;
    const ext = Pm.extend !== false && D >= tA + 5.5;
    const tE = ext ? G.cue(shot, Pm.extendAt, Math.max(tA + 2.6, D - 5.2)) : Infinity, eDur = 2.2;
    const C1 = ms('2024-09-18'), C1m = ms('2024-09-19'), J16 = ms('2025-01-16'), D10 = ms('2025-12-10'), D11 = ms('2025-12-11');
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false }); k.view(1);
      chrome(g, t, Pm, 'THE FED VS YOUR MORTGAGE · SEP 2024 – ' + (t >= tE ? 'DEC 2025' : 'JAN 2025'), 'The Fed cut. Mortgages went up.', 'DATA: FREDDIE MAC PMMS (WEEKLY); FED FUNDS TARGET, UPPER LIMIT (FRED DFEDTARU); FOMC STATEMENTS');
      const ue = E.inOutCubic(range(t, tE, tE + eDur)), xr = [A, lerp(B1, B2, ue)], yr = [3, 8];
      const X = (v) => box[0] + (v - xr[0]) / (xr[1] - xr[0]) * (box[2] - box[0]), Y = (v) => box[3] - (v - yr[0]) / (yr[1] - yr[0]) * (box[3] - box[1]);
      frame(g, box, X, Y, yr, { yStep: 1, xTicks: monthTicks(xr[0], xr[1], ue > 0.5 ? 3 : 1, true) });
      // draw-on: to 16 Jan 2025 first, then on to Dec 2025
      const tCut = t < tR ? lerp(A, ms('2024-09-20'), E.inOutSine(range(t, t0, t0 + 1.1))) : t < tE ? lerp(ms('2024-09-20'), ms('2025-01-17'), E.inOutSine(range(t, tR, tA))) : lerp(ms('2025-01-17'), D11 + 2 * DAY, E.inOutSine(range(t, tE + 0.3, tE + eDur + 0.4)));
      g.save(); g.beginPath(); g.rect(box[0], box[1] - 30, box[2] - box[0] + 6, box[3] - box[1] + 40); g.clip();
      stepPath(g, fed, X, Y, tCut); stroke(g, P.red, 6);
      const mh = linePath(g, mort, X, Y, tCut); stroke(g, P.ink, 6);
      g.restore();
      // legend
      const kl = range(t, 0.4, 1.0);
      G.pill(g, 'FED FUNDS TARGET (TOP OF RANGE)', 200, 254, { size: 20, k: kl, dot: P.red, fam: F.mono, weight: 500 });
      G.pill(g, '30-YEAR MORTGAGE RATE', 650, 254, { size: 20, k: range(t, 0.55, 1.15), dot: P.ink, fam: F.mono, weight: 500 });
      // first cut
      const kc = range(t, t0 + 0.9, t0 + 1.4);
      vline(g, X(C1), box[1], box[3], kc);
      G.fig(g, 'FIRST CUT · 18 SEP 2024', X(C1) + 10, box[3] - 18, { size: 18, color: P.inkSoft, track: 0.06, alpha: kc });
      if (tCut >= C1m) { dot(g, X(C1m), Y(6.09), P.ink); dot(g, X(C1) - 2, Y(5.5), P.red, 8); }
      const k6 = range(t, t6, t6 + 0.5) * (1 - range(t, tE, tE + 0.4));
      tag(g, X(C1m) - 20, Y(6.09) - 64, k6, { big: '6.09%', line: '19 SEP 2024', align: 'right' });
      // phase A annotation
      const ka = range(t, tA, tA + 0.7) * (1 - range(t, tE, tE + 0.5));
      if (ka > 0) {
        dot(g, X(J16), Y(7.04), P.ink); dot(g, X(J16), Y(4.5), P.red, 8);
        tag(g, X(J16) + 26, Y(7.04) - 20, ka, { big: '7.04%', line: '16 JAN 2025 · +0.95' });
        tag(g, X(J16) + 26, Y(4.5) + 10, range(t, tA + 0.3, tA + 1.0) * (1 - range(t, tE, tE + 0.5)), { big: '−1.00', line: 'FED TARGET 5.50 → 4.50', color: P.red });
      }
      // phase B annotation
      const kb = range(t, tE + eDur, tE + eDur + 0.7);
      if (kb > 0) {
        dot(g, X(D11), Y(6.22), P.ink); dot(g, X(D10), Y(3.75), P.red, 8);
        tag(g, X(D11) + 26, Y(6.22) - 34, kb, { big: '6.22%', line: '11 DEC 2025 · +0.13 OVERALL' });
        tag(g, X(D10) + 26, Y(3.75) + 10, range(t, tE + eDur + 0.3, tE + eDur + 1.0), { big: '−1.75', line: 'SIX CUTS · 5.50 → 3.75', color: P.red });
        G.slab(g, 'MORTGAGES ENDED HIGHER', 700, 330, { size: 30, k: range(t, tE + eDur + 0.8, tE + eDur + 1.4) });
      }
      if (mh && tCut < J16 - DAY) { dot(g, mh[0], mh[1], P.ink, 6); }
    }, { push: 0.022, fx: 960, fy: 560 });
  }

  // ------------------------------------------------ today: to Oct 2026, the hike, 7.40%
  async function today(ctx, shot, d) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const A = ms('2024-08-01'), B = ms('2026-10-20');
    const mort = d.toPts(d.mort, A, B), fed = d.steps(d.fu, A, B);
    const box = [200, 290, 1500, 860], xr = [A, B], yr = [3, 8];
    const X = (v) => box[0] + (v - xr[0]) / (xr[1] - xr[0]) * (box[2] - box[0]), Y = (v) => box[3] - (v - yr[0]) / (yr[1] - yr[0]) * (box[3] - box[1]);
    const t0 = G.cue(shot, Pm.at, 0.5), drawDur = Pm.drawDur ?? Math.min(4.2, Math.max(2.4, D * 0.4)), tH = G.cue(shot, Pm.hikeAt, t0 + drawDur * 0.9);
    const end = ms('2026-10-15'), HK = ms('2026-09-16'), DC = ms('2025-12-10'), C1 = ms('2024-09-18');
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false }); k.view(1);
      chrome(g, t, Pm, 'THE FED VS YOUR MORTGAGE · SEP 2024 – OCT 2026', 'Then the Fed raised rates again', 'DATA: FREDDIE MAC PMMS; FRED DFEDTARU; FOMC STATEMENT, 16 SEP 2026');
      frame(g, box, X, Y, yr, { yStep: 1, xTicks: monthTicks(xr[0], xr[1], 6, true) });
      const tCut = lerp(A, B, E.inOutSine(range(t, t0, t0 + drawDur)));
      g.save(); g.beginPath(); g.rect(box[0], box[1] - 30, box[2] - box[0] + 6, box[3] - box[1] + 40); g.clip();
      stepPath(g, fed, X, Y, tCut); stroke(g, P.red, 6);
      linePath(g, mort, X, Y, tCut); stroke(g, P.ink, 6);
      g.restore();
      G.pill(g, 'FED FUNDS TARGET (TOP OF RANGE)', 200, 254, { size: 20, k: range(t, 0.4, 1.0), dot: P.red, fam: F.mono, weight: 500 });
      G.pill(g, '30-YEAR MORTGAGE RATE', 650, 254, { size: 20, k: range(t, 0.55, 1.15), dot: P.ink, fam: F.mono, weight: 500 });
      const at = (date) => reach(date, A, B, t0, drawDur);
      const kc = range(t, at(C1), at(C1) + 0.5); vline(g, X(C1), box[1], box[3], kc); G.fig(g, 'FIRST CUT', X(C1) + 10, box[3] - 18, { size: 18, color: P.inkSoft, track: 0.06, alpha: kc });
      const kd = range(t, at(DC), at(DC) + 0.5); vline(g, X(DC), box[1], box[3], kd); G.fig(g, 'LAST CUT · 10 DEC 2025', X(DC) + 10, box[3] - 18, { size: 18, color: P.inkSoft, track: 0.06, alpha: kd });
      const kh = range(t, Math.max(tH, at(HK)), Math.max(tH, at(HK)) + 0.6);
      if (kh > 0) { vline(g, X(HK), box[1], box[3], kh, P.red); G.slab(g, 'FED HIKES +0.25 · 16 SEP 2026', X(HK) - 14, Y(4.0) + 70, { size: 24, fill: P.red, align: 'right', k: kh }); }
      const ke = range(t, t0 + drawDur, t0 + drawDur + 0.7);
      if (ke > 0) {
        dot(g, X(end), Y(7.4), P.red); dot(g, X(end), Y(4.0), P.red, 7);
        tag(g, X(end) + 26, Y(7.4) - 20, ke, { big: '7.40%', line: 'HIGHEST SINCE NOV 2023', color: P.red });
        tag(g, X(end) + 26, Y(4.0) + 16, range(t, t0 + drawDur + 0.3, t0 + drawDur + 1), { big: '4.00%', line: 'FED TARGET, TOP' });
        G.asOf(g, 'AS OF 15 OCT 2026', 1800, 254, range(t, t0 + drawDur + 0.5, t0 + drawDur + 1.0), { align: 'right' });
        const kk = range(t, t0 + drawDur + 1.0, t0 + drawDur + 1.6);
        G.pill(g, 'SINCE THE FIRST CUT: FED −1.50 · MORTGAGES +1.31', 210, 340, { size: 22, k: kk, fill: P.ink, color: P.white, dot: P.red, fam: F.mono, weight: 500 });
      }
    }, { push: 0.022, fx: 960, fy: 560 });
  }

  // ------------------------------------------------ tenyear: the spread
  async function tenyear(ctx, shot, d) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const A0 = ms(Pm.from ?? '1971-04-01'), B = ms('2026-10-20');
    const wk = d.wk10(A0, B), sampled = wk.length > 900 ? wk.filter((_, i) => i % 2 === 0 || i === wk.length - 1) : wk;
    const box = [200, 290, 1500, 860];
    const t0 = G.cue(shot, Pm.at, 0.5), drawDur = Pm.drawDur ?? Math.min(4, Math.max(2.4, D * 0.38));
    const zA = Pm.zoom ? ms(Pm.zoom) : null, tz = zA ? G.cue(shot, Pm.zoomAt, t0 + drawDur + 1.8) : Infinity;
    const yMax = A0 < ms('1990-01-01') ? 19 : 9;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false }); k.view(1);
      chrome(g, t, Pm, 'THE 10-YEAR TREASURY VS THE 30-YEAR MORTGAGE · WEEKLY', 'Your rate ≈ the 10-year + the spread', 'DATA: FREDDIE MAC PMMS; 10-YEAR TREASURY (FRED DGS10), 7-DAY AVERAGE · SPREAD: OUR MATH');
      const uz = E.inOutCubic(range(t, tz, tz + 1.8)), xr = [zA ? lerp(A0, zA, uz) : A0, B], yr = [0, lerp(yMax, 9, zA ? uz : 0)];
      const X = (v) => box[0] + (v - xr[0]) / (xr[1] - xr[0]) * (box[2] - box[0]), Y = (v) => box[3] - (v - yr[0]) / (yr[1] - yr[0]) * (box[3] - box[1]);
      const span = (xr[1] - xr[0]) / (365 * DAY);
      frame(g, box, X, Y, yr, { yStep: yr[1] > 12 ? 3 : 1, xTicks: span > 20 ? yearTicks(xr[0], xr[1], 10) : span > 6 ? yearTicks(xr[0], xr[1], 2) : yearTicks(xr[0], xr[1], 1) });
      const tCut = lerp(A0, B, E.inOutSine(range(t, t0, t0 + drawDur)));
      const pts = uz > 0 ? wk : sampled;
      g.save(); g.beginPath(); g.rect(box[0], box[1] - 30, box[2] - box[0] + 6, box[3] - box[1] + 40); g.clip();
      // the spread band
      g.beginPath(); let n = 0; for (const [tt, ten, m] of pts) { if (tt > tCut) break; if (tt < xr[0] - 30 * DAY) continue; const x = X(tt); n++ ? g.lineTo(x, Y(m)) : g.moveTo(x, Y(m)); }
      for (let i = pts.length - 1; i >= 0; i--) { const [tt, ten] = pts[i]; if (tt > tCut || tt < xr[0] - 30 * DAY) continue; g.lineTo(X(tt), Y(ten)); }
      g.closePath(); g.fillStyle = 'rgba(169,197,174,0.55)'; g.fill();
      linePath(g, pts.filter(q => q[0] >= xr[0] - 30 * DAY).map(([tt, ten]) => [tt, ten]), X, Y, tCut); stroke(g, P.teal, 4.5);
      linePath(g, pts.filter(q => q[0] >= xr[0] - 30 * DAY).map(([tt, , m]) => [tt, m]), X, Y, tCut); stroke(g, P.ink, 4.5);
      g.restore();
      G.pill(g, '30-YEAR MORTGAGE', 200, 254, { size: 20, k: range(t, 0.4, 1.0), dot: P.ink, fam: F.mono, weight: 500 });
      G.pill(g, '10-YEAR TREASURY', 500, 254, { size: 20, k: range(t, 0.55, 1.15), dot: P.teal, fam: F.mono, weight: 500 });
      G.pill(g, 'THE SPREAD', 790, 254, { size: 20, k: range(t, 0.7, 1.3), dot: P.sage, fam: F.mono, weight: 500 });
      // now: bracket at the right edge, 5.10 -> 7.40
      const ke = range(t, t0 + drawDur, t0 + drawDur + 0.7);
      if (ke > 0) {
        const xe = X(ms('2026-10-15')) + 18, ya = Y(7.4), yb = Y(5.1);
        g.save(); g.globalAlpha = clamp(ke * 2); g.strokeStyle = P.red; g.lineWidth = 4; g.beginPath(); g.moveTo(xe, ya); g.lineTo(xe + 14, ya); g.lineTo(xe + 14, lerp(ya, yb, E.outCubic(ke))); g.lineTo(xe, lerp(ya, yb, E.outCubic(ke))); g.stroke(); g.restore();
        tag(g, xe + 34, (ya + yb) / 2, ke, { big: '2.30 PTS', line: '7.40 − 5.10 · NOW', color: P.red });
        G.asOf(g, 'AS OF 15 OCT 2026', 1800, 254, range(t, t0 + drawDur + 0.4, t0 + drawDur + 0.9), { align: 'right' });
        const ka = range(t, t0 + drawDur + 0.8, t0 + drawDur + 1.4);
        tag(g, xe + 34, (ya + yb) / 2 + 150, ka, { big: '1.76 PTS', line: 'AVERAGE SINCE 1971', color: P.sageDeep });
        G.ourMath(g, 'SPREAD = PMMS − 7-DAY AVG 10-YR', 210, 336, range(t, t0 + drawDur + 1.0, t0 + drawDur + 1.6));
      }
    }, { push: 0.022, fx: 960, fy: 560 });
  }

  // ------------------------------------------------ history: the 10-year since 1962
  async function history(ctx, shot, d) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 12;
    const A0 = ms(Pm.from ? (String(Pm.from).length === 4 ? `${Pm.from}-01-01` : Pm.from) : '1962-01-01'), B = ms('2026-10-20');
    const all = d.toPts(d.g10, A0, B), coarse = d.toPts(d.g10, A0, B, 6);
    const box = [200, 290, 1500, 860];
    const t0 = G.cue(shot, Pm.at, 0.5), drawDur = Pm.drawDur ?? Math.min(5, Math.max(2.6, D * 0.42));
    const focus = Pm.focus ? String(Pm.focus) : null, tz = focus ? G.cue(shot, Pm.focusAt, Math.min(t0 + drawDur + 2.2, D - 3.4)) : Infinity;
    const F94 = [ms('1993-06-01'), ms('1995-04-01')], R0 = ms('1993-10-15'), R1 = ms('1994-11-07'), PK = ms('1981-09-30'), N26 = ms('2026-10-05');
    const tAt = (date) => reach(date, A0, B, t0, drawDur);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false }); k.view(1);
      chrome(g, t, Pm, '10-YEAR TREASURY YIELD · DAILY CLOSE', focus === '1994' && t >= tz ? '1994: the bond market panics' : 'Sixty years of the price of ten-year money', 'DATA: FRED DGS10 (BOARD OF GOVERNORS, H.15) · 1994: FORTUNE, 17 OCT 1994');
      const uz = E.inOutCubic(range(t, tz, tz + 2)), xr = [lerp(A0, F94[0], uz), lerp(B, F94[1], uz)], yr = [lerp(0, 4.5, uz), lerp(17, 8.6, uz)];
      const X = (v) => box[0] + (v - xr[0]) / (xr[1] - xr[0]) * (box[2] - box[0]), Y = (v) => box[3] - (v - yr[0]) / (yr[1] - yr[0]) * (box[3] - box[1]);
      const span = (xr[1] - xr[0]) / (365 * DAY);
      frame(g, box, X, Y, yr, { yStep: span > 5 ? 2 : 1, xTicks: span > 20 ? yearTicks(xr[0], xr[1], 10) : monthTicks(xr[0], xr[1], 3, true) });
      const tCut = lerp(A0, B, E.inOutSine(range(t, t0, t0 + drawDur)));
      // the 1994 rout band
      const kr = range(t, tAt(R1), tAt(R1) + 0.6);
      if (kr > 0) { g.save(); g.globalAlpha = clamp(kr * 2); g.fillStyle = 'rgba(224,36,27,0.12)'; g.fillRect(X(R0), box[1], X(R1) - X(R0), box[3] - box[1]); g.restore(); }
      g.save(); g.beginPath(); g.rect(box[0], box[1] - 30, box[2] - box[0] + 6, box[3] - box[1] + 40); g.clip();
      const pts = uz > 0 ? all.filter(q => q[0] >= xr[0] - 40 * DAY && q[0] <= xr[1] + 40 * DAY) : coarse;
            // area
      { g.save(); const p0 = pts.filter(q => q[0] <= tCut); if (p0.length > 1) { g.beginPath(); g.moveTo(X(p0[0][0]), box[3]); p0.forEach(([tt, v]) => g.lineTo(X(tt), Y(v))); g.lineTo(X(p0.at(-1)[0]), box[3]); g.closePath(); g.fillStyle = 'rgba(210,233,228,0.75)'; g.fill(); } g.restore(); }
      linePath(g, pts, X, Y, tCut); stroke(g, P.teal, uz > 0.5 ? 5 : 3.5);
      g.restore();
      // 1981 peak
      const kp = range(t, tAt(PK), tAt(PK) + 0.6) * (1 - uz);
      if (kp > 0 && uz === 0) { dot(g, X(PK), Y(15.84), P.ink, 8); tag(g, X(PK) + 24, Y(15.84) + 34, kp, { big: '15.84%', line: '30 SEP 1981 · THE PEAK' }); }
      // 1994
      if (kr > 0) {
        dot(g, X(R0), Y(5.19), P.ink, 7); dot(g, X(R1), Y(8.05), P.red, 8);
        if (uz < 0.5) tag(g, X(R1) + 22, Y(8.05) - 70, kr * (1 - uz * 2), { big: '5.19% → 8.05%', line: 'OCT 1993 → NOV 1994', color: P.red, sizeB: 34 });
      }
      if (uz > 0.6) {
        const kz = range(t, tz + 1.4, tz + 2.2);
        tag(g, X(R0) + 24, Y(5.19) + 50, kz, { big: '5.19%', line: '15 OCT 1993' });
        tag(g, X(R1) - 24, Y(8.05) + 40, range(t, tz + 1.8, tz + 2.6), { big: '8.05%', line: '7 NOV 1994 · +2.86 PTS', color: P.red, align: 'right' });
        const kf = range(t, tz + 2.4, tz + 3.0);
        if (kf > 0) { vline(g, X(ms('1994-02-04')), box[1], box[3], kf, P.ink); G.fig(g, 'FED HIKES · 4 FEB 1994', X(ms('1994-02-04')) + 10, box[1] + 26, { size: 18, color: P.ink, track: 0.06, alpha: kf }); }
        G.pill(g, '“THE WORST BOND MARKET LOSS IN HISTORY” · FORTUNE', 200, 254, { size: 20, k: range(t, tz + 2.8, tz + 3.4), fill: P.ink, color: P.white, dot: P.red, fam: F.mono, weight: 500 });
      }
      // 2026
      const kn = range(t, t0 + drawDur, t0 + drawDur + 0.7) * (1 - uz);
      if (kn > 0 && uz === 0) { dot(g, X(N26), Y(5.31), P.red, 8); tag(g, X(N26) + 40, Y(5.31) - 120, kn, { big: '5.31%', line: '5 OCT 2026', color: P.red, sizeB: 40, align: 'right' }); G.fig(g, 'HIGHEST CLOSE SINCE MAY 2002', X(N26) + 40, Y(5.31) - 52, { size: 18, color: P.red, align: 'right', track: 0.06, alpha: kn }); }
    }, { push: 0.022, fx: 960, fy: 560 });
  }

  // ------------------------------------------------ auctions: 2026 high yields, lollipops on a date axis
  const AUC = {
    10: { pts: [['2025-10-08', 4.117, true], ['2026-01-12', 4.173], ['2026-05-12', 4.468], ['2026-08-12', 4.683], ['2026-09-09', 4.834], ['2026-10-07', 5.3]], since: ['8 NOV 2000', 5.865], name: '10-YEAR NOTE', src: 'DATA: TREASURY FISCAL DATA, AUCTIONS (S05); RESULT 7 OCT 2026 · RANKING: OUR MATH' },
    30: { pts: [['2025-10-09', 4.734, true], ['2026-01-13', 4.825], ['2026-05-13', 5.046], ['2026-08-13', 5.216], ['2026-09-10', 5.308], ['2026-10-08', 5.618]], since: ['10 AUG 2000', 5.697], name: '30-YEAR BOND', src: 'DATA: TREASURY FISCAL DATA, AUCTIONS (S05); RESULT 8 OCT 2026 · RANKING: OUR MATH' },
  };
  async function auctions(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9, S = AUC[Pm.series ?? 10] ?? AUC[10];
    const items = S.pts.map(([dd, v, ghost]) => ({ t: ms(dd), v, ghost, d: G.dstr(dd) }));
    const T = G.cues(shot, items, { from: 0.6, span: Math.max(2.4, D * 0.45) });
    const box = [220, 300, 1400, 860], yr = [3.5, 6.25];
    const X = (i) => box[0] + 90 + i * (box[2] - box[0] - 180) / (items.length - 1), Y = (v) => box[3] - (v - yr[0]) / (yr[1] - yr[0]) * (box[3] - box[1]);
    const last = items.at(-1), tM = G.cue(shot, Pm.markAt, T.at(-1) + 1.0);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false }); k.view(1);
      chrome(g, t, Pm, `${S.name} AUCTIONS · HIGH YIELD`, 'Each auction asked for more', S.src);
      frame(g, box, X, Y, yr, { yStep: 0.5, yFmt: (v) => `${v.toFixed(1)}%` });
      // reference: the last time an auction cleared higher
      const km = range(t, tM, tM + 0.7);
      if (km > 0) {
        g.save(); g.globalAlpha = clamp(km * 2); g.setLineDash([10, 8]); g.strokeStyle = P.inkSoft; g.lineWidth = 3; g.beginPath(); g.moveTo(box[0], Y(S.since[1])); g.lineTo(lerp(box[0], box[2], E.outCubic(km)), Y(S.since[1])); g.stroke(); g.restore();
        G.fig(g, `${S.since[0]} · ${S.since[1].toFixed(3)}% · LAST TIME HIGHER`, box[0] + 14, Y(S.since[1]) - 14, { size: 20, color: P.inkSoft, track: 0.06, alpha: km });
      }
      items.forEach((it, i) => {
        const kk = range(t, T[i], T[i] + 0.7); if (kk <= 0) return;
        const x = X(i), y = lerp(box[3], Y(it.v), E.outBack(kk)), red = i === items.length - 1, col = it.ghost ? P.inkFaint : red ? P.red : P.ink;
        g.save(); g.strokeStyle = col; g.lineWidth = red ? 7 : 5; if (it.ghost) g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x, box[3]); g.lineTo(x, y); g.stroke(); g.restore();
        dot(g, x, y, col, red ? 13 : 10);
        const lab = `${it.v.toFixed(3)}%`;
        G.fig(g, lab, x, y - 30, { size: red ? 40 : 28, align: 'center', color: col, alpha: range(t, T[i] + 0.3, T[i] + 0.8) });
        G.fig(g, it.d, x, box[3] + 46, { size: 22, align: 'center', color: it.ghost ? P.inkFaint : P.ink, alpha: range(t, T[i] + 0.2, T[i] + 0.7), track: 0.04 });
      });
      if (range(t, T[0], T[0] + 0.7) > 0) G.fig(g, 'A YEAR EARLIER', X(0), Y(items[0].v) - 74, { size: 16, align: 'center', color: P.inkFaint, track: 0.08, alpha: range(t, T[0] + 0.4, T[0] + 0.9) });
      // right column: the claim
      const kc = range(t, T.at(-1) + 0.6, T.at(-1) + 1.3);
      if (kc > 0) {
        G.card(g, 1460, 320, 360, 380, { r: 22, lift: 1, alpha: clamp(kc * 2), stroke: P.red });
        G.fig(g, last.d, 1490, 380, { size: 22, color: P.inkSoft, alpha: kc, track: 0.06 });
        G.fig(g, `${last.v.toFixed(3)}%`, 1488, 470, { size: 70, color: P.red, alpha: kc });
        const lines = [`HIGHEST ${S.name.split(' ')[0]}`, 'AUCTION YIELD', `SINCE ${S.since[0].split(' ').slice(1).join(' ')}`];
        lines.forEach((l, i) => G.text(g, l, 1490, 540 + i * 42, { size: 32, weight: 900, color: P.ink, alpha: range(t, T.at(-1) + 0.8 + i * 0.1, T.at(-1) + 1.4 + i * 0.1) }));
        G.ourMath(g, 'RANKED: EVERY AUCTION SINCE 1979', 1820, 736, range(t, T.at(-1) + 1.4, T.at(-1) + 2), { align: 'right', size: 16 });
      }
    }, { push: 0.022, fx: 960, fy: 560 });
  }

  // ================================================================ bidders
  async function bidders(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'auction'), D = shot.duration ?? 9;
    if (mode === 'investor-class') return investor(ctx, shot);
    if (mode === 'demand') return demand(ctx, shot);
    const SEG = [
      { key: 'indirect', v: 80.3, name: 'INDIRECT BIDDERS', sub: 'CUSTOMERS BIDDING THROUGH A DEALER', col: P.teal, amt: '$31.06B' },
      { key: 'direct', v: 17.1, name: 'DIRECT BIDDERS', sub: 'BIDDING FOR THEIR OWN ACCOUNT', col: P.sage, amt: '$6.62B' },
      { key: 'dealers', v: 2.5, name: 'PRIMARY DEALERS', sub: 'THE SAFETY NET', col: P.red, amt: '$0.98B' },
    ];
    const T = G.cues(shot, SEG, { from: 0.6, span: Math.max(2.0, D * 0.4) });
    const tL = G.cue(shot, Pm.lowAt, T[2] + 0.8), tB = G.cue(shot, Pm.coverAt, Math.min(D - 2.2, T[2] + 2.2));
    const cx = 480, cy = 610, R = 212, RW = 104;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? '10-YEAR NOTE AUCTION · 7 OCT 2026 · $39 BILLION', 120, 118, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Who won the auction', 120, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      // donut
      g.save(); G.shadow(g, 1.2); g.fillStyle = P.white; g.beginPath(); g.arc(cx, cy, R + RW / 2 + 22, 0, TAU); g.fill(); G.noShadow(g); g.restore();
      g.save(); g.lineWidth = RW; g.strokeStyle = P.paperDeep; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.restore();
      let a0 = -Math.PI / 2;
      SEG.forEach((s, i) => {
        const kk = E.inOutCubic(range(t, T[i], T[i] + 0.9)), a1 = a0 + TAU * s.v / 100;
        if (kk > 0) { g.save(); g.lineWidth = RW; g.strokeStyle = s.col; g.lineCap = 'butt'; g.beginPath(); g.arc(cx, cy, R, a0, lerp(a0, a1, kk) + (i === 2 ? 0 : 0.004)); g.stroke(); g.restore(); }
        if (i === 2 && kk > 0) { // pull the dealer sliver out a touch, with a leader
          const am = (a0 + a1) / 2, ox = cx + Math.cos(am) * (R + RW / 2), oy = cy + Math.sin(am) * (R + RW / 2), py = oy - 28;
          g.save(); g.strokeStyle = P.red; g.lineWidth = 3; g.globalAlpha = kk; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox, py); g.lineTo(ox + 150, py); g.stroke(); g.restore();
          G.fig(g, '2.5% DEALERS', ox + 160, py + 9, { size: 26, color: P.red, alpha: kk });
        }
        a0 = a1;
      });
      G.text(g, 'SHARE OF', cx, cy - 18, { size: 24, weight: 800, align: 'center', color: P.inkSoft, alpha: range(t, 0.5, 1) });
      G.text(g, 'NOTES WON', cx, cy + 16, { size: 24, weight: 800, align: 'center', color: P.inkSoft, alpha: range(t, 0.5, 1) });
      G.fig(g, '$38.67B', cx, cy + 56, { size: 22, align: 'center', color: P.inkSoft, alpha: range(t, 0.6, 1.1) });
      // legend rows
      SEG.forEach((s, i) => {
        const kk = range(t, T[i] + 0.2, T[i] + 0.8), y = 370 + i * 150; if (kk <= 0) return;
        g.save(); g.globalAlpha = clamp(kk * 2); g.translate((1 - E.outCubic(kk)) * 30, 0);
        g.fillStyle = s.col; G.rr(g, 930, y - 46, 14, 92, 7); g.fill();
        G.fig(g, `${s.v.toFixed(1)}%`, 970, y + 18, { size: 76, color: i === 2 ? P.red : P.ink });
        G.text(g, s.name, 1290, y - 4, { size: 32, weight: 900, color: P.ink });
        G.fig(g, `${s.amt} · ${s.sub}`, 1292, y + 32, { size: 18, color: P.inkSoft, track: 0.06 });
        g.restore();
      });
      G.slab(g, 'LOWEST SINCE AT LEAST 2008', 1290, 370 + 2 * 150 + 84, { size: 26, fill: P.red, k: range(t, tL, tL + 0.6) });
      // demand strip
      const kb = range(t, tB, tB + 0.9);
      if (kb > 0) {
        const y = 900, x0 = 930, W = 860, s = W / 108.07;
        g.save(); g.globalAlpha = clamp(kb * 2);
        G.fig(g, 'BIDS', x0, y - 18, { size: 18, color: P.inkSoft, track: 0.1 });
        g.fillStyle = P.steelPale; G.rr(g, x0 + 90, y - 42, 108.07 * s * E.outCubic(kb) - 90, 34, 6); g.fill();
        G.fig(g, '$108B', x0 + 104, y - 16, { size: 22, color: P.ink });
        G.fig(g, 'SOLD', x0, y + 30, { size: 18, color: P.inkSoft, track: 0.1 });
        g.fillStyle = P.ink; G.rr(g, x0 + 90, y + 6, Math.max(0, 39 * s * E.outCubic(range(t, tB + 0.3, tB + 1.1)) - 90), 34, 6); g.fill();
        G.fig(g, '$39B', x0 + 104, y + 32, { size: 22, color: P.white });
        g.restore();
        G.fig(g, '2.77×', 1790, y + 10, { size: 54, color: P.ink, align: 'right', alpha: range(t, tB + 0.8, tB + 1.3) });
        G.fig(g, 'BID-TO-COVER', 1790, y + 40, { size: 16, color: P.inkSoft, align: 'right', track: 0.1, alpha: range(t, tB + 0.9, tB + 1.4) });
      }
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: TREASURY AUCTION RESULTS, 7 OCT 2026 · SHARES OF COMPETITIVE AWARDS: OUR MATH · DEALER RANKING: OUR MATH (DATA FROM 2008)', range(t, 0.6, 1.4), { size: 16 });
    }, { push: 0.03, dx: 20 });
  }

  // ------------------------------------------------ demand: $108B of bids for $39B
  async function demand(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, t0 = G.cue(shot, Pm.at, 0.5), t1 = G.cue(shot, Pm.at2, t0 + 1.4);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? '10-YEAR NOTE AUCTION · 7 OCT 2026', 140, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Not an auction nobody wanted', 140, 226, range(t, 0.12, 0.9), { size: 70, weight: 800 });
      const x0 = 140, W = 1500, s = W / 108.07;
      const row = (y, v, lab, val, kk, fill, txt) => {
        if (kk <= 0) return; const w = v * s * E.outCubic(kk);
        g.save(); G.shadow(g, 0.8); G.rr(g, x0, y, Math.max(20, w), 150, 16); g.fillStyle = fill; g.fill(); G.noShadow(g); g.restore();
        g.save(); G.rr(g, x0, y, Math.max(20, w), 150, 16); g.clip(); G.ledgerLines(g, x0, y, w, 150, { step: 30, color: 'rgba(255,255,255,0.12)' }); g.restore();
        G.fig(g, val, x0 + 30, y + 98, { size: 72, color: txt, alpha: clamp(kk * 2) });
        G.text(g, lab, x0 + Math.max(w, 420) + 24, y + 92, { size: 34, weight: 900, color: P.ink, alpha: range(kk, 0.6, 1) });
      };
      row(340, 108.07, 'OF BIDS', '$108B', range(t, t0, t0 + 1.4), P.steelPale, P.ink);
      row(560, 39, 'OF NOTES FOR SALE', '$39B', range(t, t1, t1 + 1.2), P.ink, P.white);
      const kc = range(t, t1 + 1.1, t1 + 1.7);
      G.fig(g, '2.77×', 140, 880, { size: 130, color: P.ink, alpha: kc });
      G.text(g, 'BID-TO-COVER · HIGHEST FOR A REGULAR 10-YEAR SINCE JAN 2016', 560, 850, { size: 30, weight: 800, alpha: range(t, t1 + 1.3, t1 + 1.9), maxW: 1240 });
      G.ourMath(g, 'VS 2.51 AVERAGE OF THE PREVIOUS 12', 560, 898, range(t, t1 + 1.5, t1 + 2.1));
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: TREASURY AUCTION RESULTS, 7 OCT 2026: $108,068,999,700 / $39,000,031,700 = 2.77', range(t, 0.6, 1.4));
    }, { push: 0.035 });
  }

  // ------------------------------------------------ investor-class: indirect ≠ foreign
  async function investor(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9, t0 = G.cue(shot, Pm.at, 0.6), t1 = G.cue(shot, Pm.at2, t0 + 1.8), tC = G.cue(shot, Pm.capAt, t1 + 1.8);
    const TOP = [{ v: 79.2, name: 'INDIRECT', col: P.teal }, { v: 20.8, name: 'DIRECT + DEALERS', col: P.steelPale, dark: true }];
    const BOT = [{ v: 66.3, name: 'INVESTMENT FUNDS', col: P.tealDeep }, { v: 28.1, name: 'FOREIGN & INTERNATIONAL', col: P.red }, { v: 5.3, name: 'DEALERS', col: P.steel }, { v: 0.3, name: '', col: P.inkFaint }];
    const x0 = 140, W = 1640;
    const bar = (g, y, segs, kk, t) => {
      let x = x0;
      segs.forEach((s, i) => {
        const w = W * s.v / 100, kq = E.inOutCubic(range(kk, i * 0.18, i * 0.18 + 0.7)); if (kq <= 0) { x += w; return; }
        g.save(); G.rr(g, x + 2, y, Math.max(1, w * kq - 4), 130, 12); g.fillStyle = s.col; g.fill(); g.restore();
        if (w > 160 && kq > 0.6) { G.fig(g, `${s.v.toFixed(1)}%`, x + 24, y + 80, { size: 46, color: s.dark ? P.ink : P.white, alpha: range(kq, 0.6, 1) }); }
        if (s.name && w > 60) G.fig(g, s.name, x + (w > 300 ? 24 : 4), y + 170, { size: 20, color: s.col === P.red ? P.red : P.ink, track: 0.06, alpha: range(kq, 0.6, 1) });
        x += w;
      });
    };
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? '10-YEAR NOTE AUCTIONED 9 SEP 2026 · SHARES OF ALLOTMENT', 140, 118, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Who actually bought?', 140, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      G.text(g, 'HOW THE BIDS ARRIVED (AUCTION CATEGORY)', x0, 300, { size: 24, weight: 800, color: P.inkSoft, alpha: range(t, 0.3, 0.8), track: 0.04 });
      bar(g, 330, TOP, range(t, t0, t0 + 1.4), t);
      G.text(g, 'WHO THEY WERE (INVESTOR CLASS)', x0, 610, { size: 24, weight: 800, color: P.inkSoft, alpha: range(t, t1 - 0.3, t1 + 0.2), track: 0.04 });
      bar(g, 640, BOT, range(t, t1, t1 + 1.6), t);
      const kc = range(t, tC, tC + 0.6);
      if (kc > 0) { g.save(); g.translate(1780, 230); g.rotate(-0.03); G.slab(g, 'INDIRECT ≠ FOREIGN', 0, 0, { size: 40, fill: P.ink, align: 'right', k: kc }); g.restore(); }
      G.ourMath(g, 'SHARES OF NON-SOMA ALLOTMENT', x0, 900, range(t, tC + 0.4, tC + 1));
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: TREASURY OFFICE OF DEBT MANAGEMENT, INVESTOR CLASS ALLOTMENTS (POSTED 7 OCT 2026)', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }

  // ================================================================ payment: the calculator card (OUR MATH, RESEARCH §7a)
  const VARIANTS = {
    base: { loan: 400000, from: 6.27, to: 7.40, fromLab: 'OCT 2025', toLab: 'OCT 2026', total: true, kicker: 'A $400,000 MORTGAGE · 30-YEAR FIXED', title: 'Same house. A bigger bill.' },
    median: { home: 417500, down: 0.2, loan: 334000, from: 6.27, to: 7.40, fromLab: 'OCT 2025', toLab: 'OCT 2026', kicker: 'THE MEDIAN HOME SOLD IN SEPTEMBER 2026', title: 'The auction, in your mailbox' },
    '3pct': { loan: 400000, from: 3.00, to: 7.40, fromLab: 'AT 3%', toLab: 'OCT 2026', total: false, kicker: 'A $400,000 MORTGAGE · 30-YEAR FIXED', title: 'Versus a 3% mortgage' },
  };
  async function payment(ctx, shot) {
    const Pm = shot.params ?? {}, V = { ...(VARIANTS[Pm.variant ?? 'base'] ?? VARIANTS.base), ...(Pm.loan ? { loan: Pm.loan } : {}) }, D = shot.duration ?? 9;
    const m0 = G.payment(V.loan, V.from), m1 = G.payment(V.loan, V.to), dm = m1 - m0;
    const tot0 = m0 * 360 - V.loan, tot1 = m1 * 360 - V.loan, dTot = tot1 - tot0;
    const tR = G.cue(shot, Pm.at, Math.min(1.6, D * 0.2)), rDur = 1.6, tD = G.cue(shot, Pm.deltaAt, tR + rDur + 0.5), tT = G.cue(shot, Pm.totalAt, Math.min(D - 2.0, tD + 1.8));
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? V.kicker, 120, 118, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? V.title, 120, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      const u = E.inOutCubic(range(t, tR, tR + rDur)), rate = lerp(V.from, V.to, u), mon = G.payment(V.loan, rate);
      // the calculator card
      const cx0 = 120, cy0 = 270, cw = 900, chh = V.home ? 660 : 560;
      G.card(g, cx0, cy0, cw, chh, { r: 26, lift: 1.2 });
      G.ledgerLines(g, cx0, cy0, cw, chh, { step: 70, alpha: 0.8 });
      const rows = [];
      if (V.home) rows.push(['HOME PRICE · MEDIAN, SEP 2026', `$${G.fmt(V.home)}`], ['DOWN PAYMENT', '20%']);
      rows.push(['LOAN', `$${G.fmt(V.loan)}`], ['TERM', '30 YRS · FIXED']);
      let y = cy0 + 80;
      rows.forEach(([a, b], i) => { const kk = range(t, 0.3 + i * 0.12, 0.8 + i * 0.12); G.fig(g, a, cx0 + 44, y, { size: 22, color: P.inkSoft, track: 0.08, alpha: kk }); G.fig(g, b, cx0 + cw - 44, y + 4, { size: 40, color: P.ink, align: 'right', alpha: kk }); y += 70; });
      // rate row
      const red = u >= 1;
      G.fig(g, 'RATE', cx0 + 44, y + 6, { size: 22, color: P.inkSoft, track: 0.08, alpha: range(t, 0.6, 1.1) });
      G.fig(g, u <= 0 ? V.fromLab : u >= 1 ? V.toLab : '', cx0 + 140, y + 6, { size: 18, color: red ? P.red : P.teal, track: 0.08, alpha: range(t, 0.7, 1.2) });
      G.fig(g, `${rate.toFixed(2)}%`, cx0 + cw - 44, y + 18, { size: 64, color: red ? P.red : P.ink, align: 'right', alpha: range(t, 0.6, 1.1) });
      y += 100;
      g.fillStyle = P.ink; g.fillRect(cx0 + 44, y - 30, cw - 88, 3);
      G.fig(g, 'MONTHLY PAYMENT', cx0 + 44, y + 22, { size: 22, color: P.inkSoft, track: 0.08, alpha: range(t, 0.8, 1.3) });
      G.fig(g, 'PRINCIPAL + INTEREST', cx0 + 44, y + 50, { size: 16, color: P.inkFaint, track: 0.08, alpha: range(t, 0.8, 1.3) });
      G.fig(g, `$${G.fmt(mon, 2)}`, cx0 + cw - 44, y + 46, { size: 72, color: P.ink, align: 'right', alpha: range(t, 0.8, 1.3) });
      // the bars: before / after, the delta in red
      const bx = 1180, bw = 230, base = 860, sc = 520 / Math.max(m1, 2800);
      const kb = range(t, 0.5, 1.3);
      const bar = (x, v, lab, sub, k2) => { if (k2 <= 0) return; const h = v * sc * E.outCubic(k2); g.save(); G.shadow(g, 0.8); G.rr(g, x, base - h, bw, h, 12); g.fillStyle = P.ink; g.fill(); G.noShadow(g); g.restore();
        G.fig(g, lab, x + bw / 2, base + 44, { size: 22, align: 'center', color: P.ink, track: 0.06, alpha: k2 }); G.fig(g, sub, x + bw / 2, base + 74, { size: 18, align: 'center', color: P.inkSoft, track: 0.06, alpha: k2 }); };
      bar(bx, m0, `${V.from.toFixed(2)}%`, `$${G.fmt(m0, 2)}`, kb);
      const k2 = range(t, tR, tR + 0.6);
      if (k2 > 0) {
        const h0 = m0 * sc, h1 = mon * sc, x = bx + bw + 80;
        g.save(); G.shadow(g, 0.8); G.rr(g, x, base - h1, bw, h1, 12); g.fillStyle = P.ink; g.fill(); G.noShadow(g);
        g.beginPath(); g.rect(x, base - h1, bw, h1 - h0); g.clip(); G.rr(g, x, base - h1, bw, h1, 12); g.fillStyle = P.red; g.fill(); g.restore();
        g.save(); g.setLineDash([6, 6]); g.strokeStyle = P.inkSoft; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, base - h0); g.lineTo(x + bw, base - h0); g.stroke(); g.restore();
        G.fig(g, `${rate.toFixed(2)}%`, x + bw / 2, base + 44, { size: 22, align: 'center', color: red ? P.red : P.ink, track: 0.06 });
        G.fig(g, `$${G.fmt(mon, 2)}`, x + bw / 2, base + 74, { size: 18, align: 'center', color: P.inkSoft, track: 0.06 });
      }
      const kd = range(t, tD, tD + 0.6);
      if (kd > 0) {
        const s = `+$${G.fmt(Math.round(dm))}`, x = bx + bw + 80 + bw / 2, ytop = base - m1 * sc;
        G.fig(g, s, x, ytop - 60, { size: 64, color: P.red, align: 'center', alpha: kd });
        G.text(g, 'EVERY MONTH', x, ytop - 22, { size: 22, weight: 900, color: P.red, align: 'center', alpha: kd, track: 0.06 });
      }
      const kt = range(t, tT, tT + 0.6);
      if (V.total && kt > 0) G.slab(g, `+$${G.fmt(Math.round(dTot))} MORE INTEREST OVER 30 YEARS`, cx0, cy0 + chh + 70, { size: 30, fill: P.red, k: kt });
      G.ourMath(g, 'P&I ONLY · NO TAX, INSURANCE OR PMI', 1800, 980, range(t, 1.0, 1.6), { align: 'right', size: 18 });
      G.asOf(g, 'RATE AS OF 15 OCT 2026', 1800, 118, range(t, 0.6, 1.1), { align: 'right', size: 20 });
      k.flat(); G.source(g, Pm.source ?? (V.home ? 'RATES: FREDDIE MAC PMMS · PRICE: NAR VIA FRED · FORMULA: STANDARD AMORTIZATION' : 'RATES: FREDDIE MAC PMMS · FORMULA: STANDARD AMORTIZATION'), range(t, 0.6, 1.4), { x: 120, align: 'left' });
    }, { push: 0.03 });
  }

  // ================================================================ debt
  async function debt(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'counter'), D = shot.duration ?? 8;
    if (mode === 'interest') return interest(ctx, shot);
    if (mode === 'wall') return wall(ctx, shot);
    if (mode === 'rates') return avgRates(ctx, shot);
    const V1 = 40388317675071.91, V0 = 37943000000000, t0 = G.cue(shot, Pm.at, 0.4), dur = Pm.roll ?? 2.4;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'US GROSS FEDERAL DEBT · DEBT TO THE PENNY', 140, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'What America owes', 140, 236, range(t, 0.12, 0.9), { size: 70, weight: 800 });
      const u = E.outExpo(range(t, t0, t0 + dur)), v = lerp(V0, V1, u);
      G.card(g, 110, 320, 1700, 300, { r: 28, fill: P.ink, lift: 1.3, grainA: 0 });
      const s = '$' + G.fmt(Math.floor(v));
      G.fig(g, s, 960, 520, { size: 132, color: P.white, align: 'center', maxW: 1620 });
      G.fig(g, u < 1 ? '15 OCT 2025 → 15 OCT 2026' : 'GROSS DEBT, 15 OCT 2026', 960, 580, { size: 22, color: 'rgba(255,255,255,0.7)', align: 'center', track: 0.12 });
      G.asOf(g, 'AS OF 15 OCT 2026', 1810, 150, range(t, 0.5, 1.0), { align: 'right' });
      const kk = range(t, t0 + dur * 0.7, t0 + dur * 0.7 + 0.6);
      G.fig(g, '+$2.45T', 140, 790, { size: 110, color: P.red, alpha: kk });
      G.text(g, 'IN ONE YEAR', 640, 750, { size: 40, weight: 900, alpha: range(t, t0 + dur * 0.8, t0 + dur + 0.4) });
      G.text(g, '≈ $6.7 BILLION A DAY', 640, 800, { size: 40, weight: 900, color: P.inkSoft, alpha: range(t, t0 + dur, t0 + dur + 0.6) });
      G.ourMath(g, '$40.388T − $37.943T (15 OCT 2025)', 140, 880, range(t, t0 + dur + 0.2, t0 + dur + 0.8));
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: US TREASURY, DEBT TO THE PENNY (FISCAL DATA)', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }
  async function interest(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 8, t0 = G.cue(shot, Pm.at, 0.5), t1 = G.cue(shot, Pm.at2, t0 + 1.2), t2 = G.cue(shot, Pm.fifthAt, Math.min(D - 2.4, t1 + 2));
    const BARS = [{ v: 1051.8, name: 'NET INTEREST', col: P.red }, { v: 965.2, name: 'NATIONAL DEFENSE', col: P.ink }];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'US FEDERAL OUTLAYS · FISCAL YEAR 2026', 140, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'More on interest than on the military', 140, 222, range(t, 0.12, 0.9), { size: 66, weight: 800 });
      const x0 = 140, W = 1500, s = W / 1100;
      BARS.forEach((b, i) => {
        const kk = range(t, i ? t1 : t0, (i ? t1 : t0) + 1.2), y = 310 + i * 190; if (kk <= 0) return;
        const w = b.v * s * E.outCubic(kk);
        g.save(); G.shadow(g, 0.8); G.rr(g, x0, y, w, 130, 14); g.fillStyle = b.col; g.fill(); G.noShadow(g); g.restore();
        G.text(g, b.name, x0 + 32, y + 54, { size: 32, weight: 900, color: P.white, alpha: range(kk, 0.4, 0.9) });
        G.fig(g, `$${G.fmt(b.v * E.outCubic(kk), 1)}B`, x0 + 32, y + 110, { size: 46, color: P.white, alpha: range(kk, 0.4, 0.9) });
        if (i === 0) G.pill(g, '+$81.4B ON FY2025', x0 + w + 24, y + 65, { size: 22, k: range(t, t0 + 1.0, t0 + 1.5), fam: F.mono, weight: 500, dot: P.red });
      });
      // one dollar in five of revenue
      const kf = range(t, t2, t2 + 0.8);
      if (kf > 0) {
        G.text(g, 'ABOUT $1 IN EVERY $5 OF REVENUE', x0, 760, { size: 40, weight: 900, alpha: kf });
        for (let i = 0; i < 5; i++) {
          const kq = range(t, t2 + 0.2 + i * 0.12, t2 + 0.6 + i * 0.12), x = x0 + i * 236, y = 800;
          if (kq <= 0) continue; const red = i === 0;
          g.save(); g.globalAlpha = clamp(kq * 2); g.translate(x + 105, y + 55); g.scale(E.outBack(kq), E.outBack(kq)); G.shadow(g, 0.6);
          G.rr(g, -105, -50, 210, 100, 10); g.fillStyle = red ? P.red : P.sagePale; g.fill(); G.noShadow(g);
          g.strokeStyle = red ? 'rgba(255,255,255,0.7)' : P.sageDeep; g.lineWidth = 2.5; G.rr(g, -95, -40, 190, 80, 6); g.stroke();
          g.beginPath(); g.ellipse(0, 0, 26, 30, 0, 0, TAU); g.stroke();
          G.fig(g, '$1', 0, 12, { size: 30, color: red ? P.white : P.sageDeep, align: 'center' }); g.restore();
        }
        G.ourMath(g, '$1,051.8B ÷ $5,403.3B RECEIPTS = 19.5%', x0, 950, range(t, t2 + 0.8, t2 + 1.3), { size: 20 });
      }
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: MONTHLY TREASURY STATEMENT, SEPTEMBER 2026 (TABLE 9)', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }
  async function wall(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 8, t0 = G.cue(shot, Pm.at, 0.5), t1 = G.cue(shot, Pm.at2, t0 + 1.6);
    const PARTS = [['BILLS', 7.12], ['NOTES', 2.92], ['FRN', 0.35], ['TIPS', 0.22], ['BONDS', 0.03]];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'US MARKETABLE DEBT · 30 SEP 2026', 140, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'A third of it comes due within a year', 140, 222, range(t, 0.12, 0.9), { size: 66, weight: 800 });
      const x0 = 140, W = 1640, s = W / 31.83, y = 360, h = 190;
      const ka = range(t, t0, t0 + 1.2);
      g.save(); G.shadow(g, 1); G.rr(g, x0, y, W * E.outCubic(ka), h, 16); g.fillStyle = P.steelPale; g.fill(); G.noShadow(g); g.restore();
      G.fig(g, '$31.83T MARKETABLE DEBT', x0 + W - 24, y + h - 26, { size: 26, color: P.ink, align: 'right', alpha: range(ka, 0.6, 1) });
      const kb = E.inOutCubic(range(t, t1, t1 + 1.4));
      if (kb > 0) {
        let x = x0; g.save(); G.rr(g, x0, y, W, h, 16); g.clip();
        PARTS.forEach(([n, v], i) => { const w = v * s * kb; g.fillStyle = i === 0 ? P.red : `rgba(224,36,27,${0.82 - i * 0.12})`; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + w - 2, y, 2, h); x += w; });
        g.restore();
        G.fig(g, '$10.64T', x0 + 28, y + 96, { size: 72, color: P.white, alpha: range(kb, 0.5, 1) });
        G.fig(g, '33.4% · DUE BY 30 SEP 2027', x0 + 30, y + 146, { size: 22, color: 'rgba(255,255,255,0.86)', track: 0.08, alpha: range(kb, 0.6, 1) });
      }
      // breakdown chips
      PARTS.forEach(([n, v], i) => G.pill(g, `${n} $${v.toFixed(2)}T`, x0 + i * 330, 650, { size: 24, k: range(t, t1 + 1.2 + i * 0.12, t1 + 1.6 + i * 0.12), dot: i === 0 ? P.red : P.redSoft, fam: F.mono, weight: 500 }));
      G.text(g, 'Mostly short-term bills, rolled over and over.', x0, 780, { size: 40, weight: 700, color: P.inkSoft, alpha: range(t, t1 + 1.8, t1 + 2.4) });
      G.ourMath(g, 'MSPD TABLE 3, MATURING 1 OCT 2026 – 30 SEP 2027 · INCLUDES FED-HELD', x0, 880, range(t, t1 + 1.4, t1 + 2));
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: MONTHLY STATEMENT OF THE PUBLIC DEBT, SEPTEMBER 2026', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }
  async function avgRates(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 8, t0 = G.cue(shot, Pm.at, 0.5), t1 = G.cue(shot, Pm.at2, t0 + 1.8);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'WHAT THE OLD DEBT COSTS VS WHAT NEW DEBT COSTS', 140, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Cheap IOUs become expensive ones', 140, 222, range(t, 0.12, 0.9), { size: 66, weight: 800 });
      const base = 800, sc = 440 / 6, bw = 360;
      g.fillStyle = P.ink; g.fillRect(160, base, 1600, 4);
      for (let v = 1; v <= 6; v++) { g.fillStyle = P.rule; g.fillRect(160, base - v * sc, 1600, 2); G.fig(g, `${v}%`, 140, base - v * sc + 8, { size: 20, align: 'right', color: P.inkSoft }); }
      const col = (x, v, k2, c, lab, sub) => { if (k2 <= 0) return; const h = v * sc * E.outCubic(k2); g.save(); G.shadow(g, 0.8); G.rr(g, x, base - h, bw, h, 12); g.fillStyle = c; g.fill(); G.noShadow(g); g.restore();
        G.fig(g, `${(v * E.outCubic(k2)).toFixed(3)}%`, x + bw / 2, base - h - 24, { size: 64, color: c === P.red ? P.red : P.ink, align: 'center' });
        G.text(g, lab, x + bw / 2, base + 56, { size: 34, weight: 900, align: 'center', alpha: range(k2, 0.6, 1) });
        sub.forEach((s, i) => G.fig(g, s, x + bw / 2, base + 96 + i * 30, { size: 20, color: P.inkSoft, track: 0.06, align: 'center', alpha: range(k2, 0.7, 1) })); };
      col(380, 3.518, range(t, t0, t0 + 1.2), P.steel, 'AVERAGE RATE, ALL MARKETABLE DEBT', ['30 SEP 2026 · HIGHEST SINCE SEP 2008']);
      col(1180, 5.3, range(t, t1, t1 + 1.2), P.red, 'NEW 10-YEAR MONEY', ['AUCTION OF 7 OCT 2026']);
      G.asOf(g, 'AS OF 30 SEP 2026', 1800, 140, range(t, 0.5, 1.0), { align: 'right' });
      k.flat(); G.source(g, Pm.source ?? 'SOURCES: TREASURY AVERAGE INTEREST RATES (FISCAL DATA); AUCTION RESULTS 7 OCT 2026', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }

  return { rates, bidders, payment, debt };
}
