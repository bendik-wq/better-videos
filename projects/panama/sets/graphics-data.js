// Panama hero data graphic: the Gatun Lake gauge, drawn from the ACP's own daily history file.
//   gauge   params.mode:
//     'history'   1965–2026 daily level draws on; the three record lows are marked as the line reaches them
//     '2023'      the 2023 line against the range of every other year for each date (1965–2026)
//     'now'       a staff gauge: the lake on 17 Oct 2023 (79.69 ft) rises to 17 Oct 2026 (85.7 ft)
//     'scenario'  today -> the ACP projection (85.5 ft on 17 Dec 2026) -> "if 2027 drains like 1998 / 2016":
//                 the actual 1997–98 and 2015–16 drawdowns from 17 Dec, added to 85.5 ft. SCENARIO, NOT A FORECAST.
//   other params: title, kicker, source, at (word: start of the draw-on / the rise), marks (history: override the tags)
// Data: projects/panama/assets/data/gatun.csv (ACP, Download_Gatun_Lake_Water_Level_History.csv, 1 Jan 1965 –
// 16 Oct 2026, feet above mean sea level) and gatun-projection.csv (ACP projection uploaded 13 Oct 2026).
// Values quoted on screen are checked against RESEARCH.md §1b, §3 and C14.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU } = G;
const DAY = 864e5, T0 = Date.UTC(1965, 0, 1);
const di = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - T0) / DAY);
let DATA = null;
function load() {
  return DATA ??= (async () => {
    const txt = await (await fetch('/projects/panama/assets/data/gatun.csv')).text();
    const rows = txt.trim().split(/\r?\n/).slice(1).map(l => l.split(','));
    const n = rows.length, day = new Int32Array(n), lv = new Float32Array(n);
    rows.forEach(([d, v], i) => { const [y, m, dd] = d.split('-').map(Number); day[i] = di(y, m, dd); lv[i] = +v; });
    const at = (y, m, d) => { const k = di(y, m, d) - day[0]; return lv[k]; }; // the file has no gaps (22,569 days)
    let proj = [];
    try {
      const pt = await (await fetch('/projects/panama/assets/data/gatun-projection.csv')).text();
      proj = pt.split(/\r?\n/).filter(l => /^\d+\/\d+\/\d{4},/.test(l)).map(l => { const [d, v] = l.split(','); const [m, dd, y] = d.split('/').map(Number); return [di(y, m, dd), +v]; }).sort((a, b) => a[0] - b[0]);
    } catch { /* optional */ }
    return { day, lv, at, proj, last: day[n - 1] };
  })();
}

export default function makeData(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // a chart frame: x/y maps, grid and labels
  function frame(g, box, xr, yr, { yStep = 2, yLabel = (v) => `${v} FT`, xTicks = [], alpha = 1, yTop = 90 } = {}) {
    const [x0, y0, x1, y1] = box;
    const X = (v) => x0 + (v - xr[0]) / (xr[1] - xr[0]) * (x1 - x0), Y = (v) => y1 - (v - yr[0]) / (yr[1] - yr[0]) * (y1 - y0);
    g.save(); g.globalAlpha = alpha;
    for (let v = Math.ceil(yr[0] / yStep) * yStep; v <= Math.min(yr[1], yTop); v += yStep) {
      g.fillStyle = P.rule; g.fillRect(x0, Y(v) - 1, x1 - x0, 2);
      G.text(g, yLabel(v), x0 - 16, Y(v) + 9, { size: 26, weight: 700, align: 'right', color: P.inkSoft });
    }
    for (const [v, s] of xTicks) { g.fillStyle = P.rule; g.fillRect(X(v) - 1, y1, 2, 14); G.text(g, s, X(v), y1 + 46, { size: 26, weight: 700, align: 'center', color: P.inkSoft }); }
    g.fillStyle = P.ink; g.fillRect(x0, y1, x1 - x0, 3);
    g.restore();
    return { X, Y };
  }
  // the lake as an area: a line with a turquoise body under it
  function lake(g, pts, yBottom, { line = P.waterDark, width = 3, fill = true, alpha = 1 } = {}) {
    if (pts.length < 2) return;
    g.save(); g.globalAlpha = alpha;
    if (fill) {
      g.beginPath(); g.moveTo(pts[0][0], yBottom); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(pts.at(-1)[0], yBottom); g.closePath();
      const gr = g.createLinearGradient(0, Math.min(...pts.map(p => p[1])), 0, yBottom); gr.addColorStop(0, 'rgba(124,198,193,0.95)'); gr.addColorStop(1, 'rgba(79,169,171,0.85)'); g.fillStyle = gr; g.fill();
    }
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = line; g.lineWidth = width; g.lineJoin = 'round'; g.stroke();
    g.restore();
  }
  function callout(g, x, y, bx, by, k, { title, line2, tag, red = true, align = 'center', w = 360 }) {
    if (k <= 0) return;
    const kk = E.outCubic(k);
    g.save(); g.strokeStyle = red ? P.red : P.ink; g.lineWidth = 3; g.globalAlpha = clamp(k * 2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, bx, kk), lerp(y, by, kk)); g.stroke(); g.restore();
    g.save(); g.globalAlpha = clamp(k * 2); g.strokeStyle = red ? P.red : P.ink; g.lineWidth = 4; g.fillStyle = P.white;
    g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill(); g.stroke(); g.restore();
    const bx0 = align === 'center' ? bx - w / 2 : align === 'right' ? bx - w : bx, h = tag ? 156 : 108;
    G.card(g, bx0, by - h, w, h, { r: 18, lift: 1, alpha: clamp(k * 2), grainA: 0 });
    if (k > 0.3) {
      G.text(g, title, bx0 + 22, by - h + 50, { size: 38, weight: 900, color: red ? P.red : P.ink, alpha: range(k, 0.3, 0.8) });
      G.text(g, line2, bx0 + 22, by - h + 88, { size: 24, weight: 700, color: P.ink, alpha: range(k, 0.4, 0.9) });
      if (tag) G.pill(g, tag, bx0 + 20, by - 34, { size: 21, k: range(k, 0.5, 1), fill: P.sun, weight: 800 });
    }
  }

  async function gauge(ctx, shot) {
    const Pm = shot.params ?? {}, mode = String(Pm.mode ?? 'history'), D = shot.duration ?? 10, data = await load();
    if (mode === 'now') return now(ctx, shot, data);
    if (mode === '2023') return y2023(ctx, shot, data);
    if (mode === 'scenario') return scenario(ctx, shot, data);
    // ------------------------------------------------ history
    const box = [190, 280, 1770, 900], xr = [0, di(2027, 1, 1)], yr = [77, 95];
    const t0 = G.cue(shot, Pm.at, 0.4), drawDur = Pm.drawDur ?? Math.max(3, Math.min(D * 0.62, D - t0 - 2.2));
    const MARKS0 = [
      { y: 1998, m: 4, d: 22, rank: '#2', tag: 'YEAR AFTER EL NIÑO', bx: 800 },
      { y: 2016, m: 5, d: 18, rank: 'LOWEST', tag: 'YEAR AFTER EL NIÑO', bx: 1205 },
      { y: 2023, m: 7, d: 25, rank: '#3', tag: 'EL NIÑO YEAR', bx: 1770, align: 'right' },
    ];
    // marks: false = none; ['1998', '2016'] = only those years; or a full list of mark objects
    const marks = Pm.marks === false ? [] : Array.isArray(Pm.marks)
      ? Pm.marks.flatMap(m => (typeof m === 'object' ? [m] : MARKS0.filter(d => String(d.y) === String(m)))) : MARKS0;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.card(g, 60, 40, 1800, 1000, { r: 34, lift: 1.2 });
      G.kicker(g, Pm.kicker ?? 'GATUN LAKE · DAILY LEVEL · FEET ABOVE SEA LEVEL', 120, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'The lake that runs the canal, 1965 – 2026', 120, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      const { X, Y } = frame(g, box, xr, yr, { xTicks: [1970, 1980, 1990, 2000, 2010, 2020].map(y => [di(y, 1, 1), String(y)]) });
      const u = E.inOutSine(range(t, t0, t0 + drawDur)), lastX = lerp(xr[0], data.last, u);
      const pts = []; for (let i = 0; i < data.day.length; i += 2) { if (data.day[i] > lastX) break; pts.push([X(data.day[i]), Y(data.lv[i])]); }
      g.save(); g.beginPath(); g.rect(box[0], box[1] - 60, box[2] - box[0], box[3] - box[1] + 60); g.clip(); lake(g, pts, box[3]); g.restore();
      if (pts.length && u < 1) { const [hx, hy] = pts.at(-1); g.fillStyle = P.waterDark; g.beginPath(); g.arc(hx, hy, 8, 0, TAU); g.fill(); }
      marks.forEach((m) => {
        const d = di(m.y, m.m, m.d), v = data.at(m.y, m.m, m.d); if (lastX < d) return;
        const tm = t0 + drawDur * (d / data.last), kk = range(t, tm, tm + 0.8);
        callout(g, X(d), Y(v), m.bx, m.by ?? Y(90.4), kk, { title: `${m.rank} · ${m.y}`, line2: `${v.toFixed(2)} FT · ${m.d} ${['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][m.m]}`, tag: m.tag, align: m.align ?? 'center', w: 340 });
      });
      if (u >= 1) { const v = data.lv.at(-1); G.pill(g, `NOW ${v.toFixed(1)} FT`, X(data.last) - 16, Y(v) - 44, { size: 24, k: range(t, t0 + drawDur, t0 + drawDur + 0.5), align: 'right', dot: P.waterDeep, weight: 800 }); }
      k.flat(); G.source(g, Pm.source ?? 'DATA: PANAMA CANAL AUTHORITY, DAILY GATUN LAKE LEVEL, 1 JAN 1965 – 16 OCT 2026 · TAGS: OUR ANALYSIS', range(t, 0.6, 1.4), { size: 17, y: 1068 });
    }, { push: 0.04, fx: 1300, fy: 600 });
  }

  // ------------------------------------------------ 2023 vs every other year, by date
  async function y2023(ctx, shot, data) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const lo = new Float32Array(366).fill(99), hi = new Float32Array(366).fill(0), med = new Float32Array(366), y23 = [];
    const per = Array.from({ length: 366 }, () => []);
    for (let i = 0; i < data.day.length; i++) {
      const dt = new Date(T0 + data.day[i] * DAY), y = dt.getUTCFullYear(), doy = Math.round((Date.UTC(y, dt.getUTCMonth(), dt.getUTCDate()) - Date.UTC(y, 0, 1)) / DAY);
      if (y === 2023) { y23.push([doy, data.lv[i]]); continue; }
      per[doy].push(data.lv[i]);
    }
    per.forEach((a, d) => { if (!a.length) { lo[d] = lo[d - 1]; hi[d] = hi[d - 1]; med[d] = med[d - 1]; return; } a.sort((x, y) => x - y); lo[d] = a[0]; hi[d] = a.at(-1); med[d] = a[a.length >> 1]; });
    const box = [190, 300, 1770, 900], xr = [0, 365], yr = [76, 90];
    const t0 = G.cue(shot, Pm.at, 0.6), drawDur = Pm.drawDur ?? Math.max(3, Math.min(D * 0.6, D - t0 - 2.2));
    const AUG1 = 212; // day-of-year of 1 Aug 2023
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.card(g, 60, 40, 1800, 1000, { r: 34, lift: 1.2 });
      G.kicker(g, Pm.kicker ?? 'GATUN LAKE · LEVEL BY DATE · FEET', 120, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? '2023 against every other year', 120, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      const { X, Y } = frame(g, box, xr, yr, { xTicks: MON.map((m, i) => [Math.round((Date.UTC(2023, i, 15) - Date.UTC(2023, 0, 1)) / DAY), m]) });
      // the band of all other years
      const kb = E.inOutSine(range(t, 0.2, 1.2));
      g.save(); g.globalAlpha = kb; g.beginPath(); for (let d = 0; d < 366; d++) g.lineTo(X(d), Y(hi[d])); for (let d = 365; d >= 0; d--) g.lineTo(X(d), Y(lo[d])); g.closePath();
      g.fillStyle = 'rgba(124,198,193,0.42)'; g.fill(); g.strokeStyle = 'rgba(47,127,132,0.5)'; g.lineWidth = 2; g.stroke();
      g.setLineDash([10, 8]); g.beginPath(); for (let d = 0; d < 366; d++) g.lineTo(X(d), Y(med[d])); g.strokeStyle = P.waterDark; g.lineWidth = 3; g.stroke(); g.restore();
      G.pill(g, 'RANGE OF ALL OTHER YEARS, 1965–2026', X(20), Y(89.2), { size: 22, k: range(t, 0.8, 1.3), dot: P.water });
      G.pill(g, 'MIDDLE YEAR', X(60), Y(med[60]) + 34, { size: 20, k: range(t, 1.0, 1.5), dot: P.waterDark });
      // 2023, in red
      const u = E.inOutSine(range(t, t0, t0 + drawDur)), last = 365 * u;
      const pts = y23.filter(([d]) => d <= last).map(([d, v]) => [X(d), Y(v)]);
      // the record zone: where 2023 sits under the band
      g.save(); g.beginPath(); let open = false;
      for (const [d, v] of y23) { if (d > last) break; if (d >= AUG1 && v < lo[d]) { if (!open) { g.moveTo(X(d), Y(lo[d])); open = true; } g.lineTo(X(d), Y(v)); } }
      if (open) { for (let i = y23.length - 1; i >= 0; i--) { const [d, v] = y23[i]; if (d > last || d < AUG1 || !(v < lo[d])) continue; g.lineTo(X(d), Y(lo[d])); } g.closePath(); g.fillStyle = 'rgba(224,36,27,0.22)'; g.fill(); }
      g.restore();
      g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = P.red; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke(); g.restore();
      if (pts.length) { const [hx, hy] = pts.at(-1); g.fillStyle = P.red; g.beginPath(); g.arc(hx, hy, 10, 0, TAU); g.fill(); G.pill(g, '2023', hx + 18, hy + 36, { size: 26, fill: P.red, color: P.white, weight: 900 }); }
      const tr = t0 + drawDur * (AUG1 / 365) + 0.4, kr = range(t, tr, tr + 0.7);
      if (kr > 0) {
        const cx0 = X(4), cy0 = Y(79.6);
        G.card(g, cx0, cy0, 720, 140, { r: 18, lift: 1, alpha: clamp(kr * 2), grainA: 0 });
        G.text(g, 'LOWEST EVER FOR THE DATE', cx0 + 28, cy0 + 58, { size: 40, weight: 900, color: P.red, alpha: kr });
        G.text(g, 'EVERY DAY FROM 1 AUG TO 31 DEC 2023 · 153 OF 153', cx0 + 30, cy0 + 102, { size: 24, weight: 700, alpha: range(t, tr + 0.3, tr + 0.9) });
      }
      k.flat(); G.source(g, Pm.source ?? 'DATA: PANAMA CANAL AUTHORITY, DAILY GATUN LAKE LEVEL 1965–2026 · OUR ANALYSIS', range(t, 0.6, 1.4), { size: 17, y: 1068 });
    }, { push: 0.04, fx: 1400, fy: 640 });
  }

  // ------------------------------------------------ now: the staff gauge
  async function now(ctx, shot, data) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const v23 = data.at(2023, 10, 17), vNow = Pm.level ?? 85.7, rec = 78.31;
    const tA = G.cue(shot, Pm.at, 0.9), tB = tA + Math.min(2.4, D * 0.3);
    const yr = [76, 90], gy0 = 120, gy1 = 960, Y = (v) => gy1 - (v - yr[0]) / (yr[1] - yr[0]) * (gy1 - gy0), bx = 470, bw = 210;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      k.view(1);
      const level = lerp(v23, vNow, E.inOutCubic(range(t, tA + 0.6, tB))) * sstep(0, 0.6, t) + (1 - sstep(0, 0.6, t)) * 76.5;
      // concrete lock wall behind the staff
      g.save(); G.shadow(g, 1.2); g.fillStyle = '#e8e1d2'; G.rr(g, bx - 90, 60, bw + 180, 1100, 18); g.fill(); G.noShadow(g); G.grain(g, bw + 180, 1100, 0.6, bx - 90, 60); g.restore();
      // the staff: white board, E-marks every 0.1 ft, numbers each foot, red/ink alternating
      g.save(); G.shadow(g, 0.6); g.fillStyle = P.white; g.fillRect(bx, gy0 - 30, bw, gy1 - gy0 + 200); G.noShadow(g);
      for (let v = yr[0]; v <= yr[1]; v++) {
        const col = v % 2 ? P.red : P.ink;
        for (let j = 0; j < 10; j += 2) { const y = Y(v + j / 10 + 0.1); g.fillStyle = col; g.fillRect(bx + 14, y, j === 0 || j === 4 ? 80 : 44, (gy1 - gy0) / (yr[1] - yr[0]) / 20); }
        g.fillStyle = col; g.fillRect(bx + 14, Y(v + 1) , 10, Y(v) - Y(v + 1));
        G.text(g, String(v), bx + bw - 14, Y(v) - 6, { size: 44, weight: 900, color: col, align: 'right' });
      }
      g.restore();
      // reference lines
      const ref = (v, label, col, k2, dash = [12, 9]) => { if (k2 <= 0) return; g.save(); g.globalAlpha = clamp(k2 * 2); g.setLineDash(dash); g.strokeStyle = col; g.lineWidth = 3.5; g.beginPath(); g.moveTo(bx - 140, Y(v)); g.lineTo(lerp(bx - 140, 1820, E.outCubic(k2)), Y(v)); g.stroke(); g.restore(); };
      // water in front of the staff (translucent), waves
      g.save(); g.globalAlpha = 0.58; G.water(g, -100, 1000, Y(level), 1300, t, { amp: 6, len: 200, glints: 8, lift: 0.5 }); g.restore();
      ref(rec, '', P.inkSoft, range(t, 0.4, 1.2), [4, 8]);
      G.text(g, `RECORD LOW ${rec} FT · 18 MAY 2016`, bx + bw + 40, Y(rec) + 30, { size: 22, weight: 600, fam: F.mono, color: P.inkSoft, track: 0.06, alpha: range(t, 0.9, 1.4) });
      ref(v23, '', P.red, range(t, tA, tA + 0.8));
      G.pill(g, `17 OCT 2023 · ${v23.toFixed(2)} FT`, bx + bw + 40, Y(v23) - 34, { size: 28, k: range(t, tA + 0.2, tA + 0.7), fill: P.red, color: P.white, weight: 800 });
      // readout
      const kb = range(t, tB - 0.2, tB + 0.5);
      G.text(g, `${level.toFixed(1)}`, 1040, 380, { size: 230, weight: 900, color: P.ink, alpha: sstep(0.2, 0.7, t) });
      G.text(g, 'FT', 1060 + G.measure(g, level.toFixed(1), 230, 900), 380, { size: 70, weight: 900, color: P.inkSoft, alpha: sstep(0.2, 0.7, t) });
      G.text(g, 'GATUN LAKE, ABOVE SEA LEVEL', 1046, 440, { size: 30, weight: 800, alpha: range(t, 0.3, 0.9) });
      G.asOf(g, t < tA + 0.6 ? 'SAME DAY, 2023' : 'AS OF 17 OCT 2026', 1046, 150, range(t, 0.2, 0.7), { size: 26 });
      if (kb > 0) {
        // the +6 ft bracket on the staff
        const x = bx - 60; g.save(); g.strokeStyle = P.ink; g.lineWidth = 5; g.globalAlpha = clamp(kb * 2);
        g.beginPath(); g.moveTo(x + 20, Y(v23)); g.lineTo(x, Y(v23)); g.lineTo(x, lerp(Y(v23), Y(vNow), E.outCubic(kb))); g.lineTo(x + 20, lerp(Y(v23), Y(vNow), E.outCubic(kb))); g.stroke(); g.restore();
        G.slab(g, `+${(vNow - v23).toFixed(1)} FT VS 2023`, 1046, 530, { size: 44, fill: P.ink, k: kb });
        G.text(g, 'ABOUT AVERAGE FOR MID-OCTOBER (1965–2026 MEAN: 85.9 FT)', 1048, 610, { size: 22, weight: 600, fam: F.mono, color: P.inkSoft, track: 0.04, alpha: range(t, tB + 0.4, tB + 1) });
        G.pill(g, 'ACP PROJECTION · 17 DEC 2026: 85.5 FT', 1046, 680, { size: 26, k: range(t, tB + 0.8, tB + 1.3), dot: P.waterDeep, weight: 800 });
      }
      k.flat(); G.source(g, Pm.source ?? 'DATA: ACP DAILY LEVEL FILE AND GATUN WATER INDICATORS (17 OCT 2026); ACP PROJECTION OF 13 OCT 2026', range(t, 0.6, 1.4), { size: 17, y: 1052 });
    }, { push: 0.035, fx: 600, fy: 560 });
  }

  // ------------------------------------------------ scenario (our what-if, never a forecast)
  async function scenario(ctx, shot, data) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 12;
    const start = 85.5, d17 = di(2026, 12, 17), x0d = di(2026, 10, 1), x1d = di(2027, 6, 1);
    const analog = (y) => { const base = data.at(y, 12, 17), out = []; for (let d = 0; d <= x1d - d17; d++) { const k = di(y, 12, 17) + d - data.day[0]; if (k >= data.lv.length) break; out.push([d17 + d, start + (data.lv[k] - base)]); } return out; };
    const A98 = analog(1997), A16 = analog(2015);
    const end98 = Math.min(...A98.map(p => p[1])), end16 = Math.min(...A16.map(p => p[1]));
    const actual = []; for (let i = 0; i < data.day.length; i++) if (data.day[i] >= x0d) actual.push([data.day[i], data.lv[i]]);
    const proj = data.proj.length ? data.proj : [[di(2026, 12, 17), 85.5]];
    const box = [190, 300, 1440, 870], xr = [x0d, x1d], yr = [77, 90];
    const tP = G.cue(shot, Pm.projAt, 0.8), tS = G.cue(shot, Pm.at, Math.min(D * 0.35, 3.4)), sDur = Pm.drawDur ?? Math.max(2.6, Math.min(D * 0.4, D - tS - 2));
    const MON = [['OCT', 2026, 9], ['NOV', 2026, 10], ['DEC', 2026, 11], ['JAN', 2027, 0], ['FEB', 2027, 1], ['MAR', 2027, 2], ['APR', 2027, 3], ['MAY', 2027, 4]];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.card(g, 60, 40, 1800, 1000, { r: 34, lift: 1.2 });
      G.kicker(g, Pm.kicker ?? 'GATUN LAKE · THE 2027 DRY SEASON', 120, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'If 2027 drains like 1998 or 2016', 120, 196, range(t, 0.12, 0.9), { size: 62, weight: 800 });
      const { X, Y } = frame(g, box, xr, yr, { xTicks: MON.map(([m, y, mo]) => [Math.round((Date.UTC(y, mo, 15) - T0) / DAY), m]) });
      // dry season band
      g.save(); g.fillStyle = 'rgba(243,223,174,0.55)'; g.fillRect(X(di(2027, 1, 1)), box[1], X(di(2027, 5, 1)) - X(di(2027, 1, 1)), box[3] - box[1]); g.restore();
      G.text(g, 'DRY SEASON', (X(di(2027, 1, 1)) + X(di(2027, 5, 1))) / 2, box[1] + 36, { size: 24, weight: 800, align: 'center', color: '#8a5a12', track: 0.12 });
      // the 2023–24 crisis lows band
      const kc = range(t, 0.5, 1.2);
      g.save(); g.globalAlpha = kc; g.fillStyle = 'rgba(224,36,27,0.13)'; g.fillRect(box[0], Y(80.17), box[2] - box[0], Y(79.24) - Y(80.17));
      g.strokeStyle = 'rgba(224,36,27,0.5)'; g.lineWidth = 2; g.strokeRect(box[0], Y(80.17), box[2] - box[0], Y(79.24) - Y(80.17)); g.restore();
      G.text(g, '2023–24 CRISIS LOWS (79.2–80.2 FT)', X(di(2026, 11, 1)), Y(79.24) + 34, { size: 22, weight: 800, color: P.red, alpha: kc });
      // draft-line markers: lake levels at which the ACP's Neopanamax draft limit was set (RESEARCH §1e)
      const kd = range(t, 1.0, 1.6);
      [[85.7, '49 FT DRAFT · OCT 2026'], [79.5, '44 FT DRAFT · AUG 2023']].forEach(([v, s], i) => {
        g.save(); g.globalAlpha = kd; g.setLineDash([3, 7]); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(box[2] - 10, Y(v)); g.lineTo(box[2] + 40, Y(v)); g.stroke(); g.restore();
        G.ship(g, box[2] + 90, Y(v) + 2, 80, { seed: 9 + i, alpha: kd });
        G.text(g, s, box[2] + 140, Y(v) + 9, { size: 20, weight: 800, color: i ? P.red : P.ink, alpha: kd });
      });
      ['LAKE LEVEL →', 'MAX NEOPANAMAX DRAFT'].forEach((l, i) => G.text(g, l, box[2] + 30, Y(89.2) + i * 26, { size: 18, weight: 600, fam: F.mono, color: P.inkSoft, track: 0.08, alpha: kd }));
      // actual so far
      lake(g, actual.map(([d, v]) => [X(d), Y(v)]), box[3], { line: P.ink, width: 5 });
      const lastA = actual.at(-1); G.pin(g, X(lastA[0]), Y(lastA[1]), t, range(t, 0.3, 0.8), { color: P.ink, pulse: true });
      G.pill(g, `TODAY ${Pm.level ?? 85.7} FT`, X(lastA[0]) + 22, Y(lastA[1]) - 46, { size: 24, k: range(t, 0.4, 0.9), weight: 800 });
      // ACP projection (dashed)
      const kp = E.inOutSine(range(t, tP, tP + 1.4));
      const pp = [[lastA[0], lastA[1]], ...proj].map(([d, v]) => [X(d), Y(v)]), pc = G.polyLen(pp);
      g.save(); g.setLineDash([12, 8]); g.strokeStyle = P.ink; g.lineWidth = 4; G.drawPoly(g, pp, pc, kp); g.restore();
      if (kp >= 1) G.pill(g, 'ACP PROJECTION · 85.5 FT · 17 DEC', X(d17) - 20, Y(85.5) - 60, { size: 22, k: range(t, tP + 1.4, tP + 1.9), align: 'right', dot: P.ink, weight: 800 });
      // the scenario: two analogue drawdowns and the band between them
      const us = E.inOutSine(range(t, tS, tS + sDur)), lastS = lerp(d17, x1d, us);
      const p98 = A98.filter(([d]) => d <= lastS).map(([d, v]) => [X(d), Y(v)]), p16 = A16.filter(([d]) => d <= lastS).map(([d, v]) => [X(d), Y(v)]);
      if (p98.length > 1) {
        g.save(); g.beginPath(); p98.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); for (let i = p16.length - 1; i >= 0; i--) g.lineTo(p16[i][0], p16[i][1]); g.closePath(); g.fillStyle = 'rgba(224,36,27,0.16)'; g.fill();
        for (const [pts, w] of [[p98, 4], [p16, 4]]) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = P.red; g.lineWidth = w; g.setLineDash([2, 0]); g.stroke(); }
        g.restore();
        const h98 = p98.at(-1), h16 = p16.at(-1); [h98, h16].forEach(([x, y]) => { g.fillStyle = P.red; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); });
      }
      const ke = range(t, tS + sDur, tS + sDur + 0.6);
      if (ke > 0) {
        G.pill(g, `LIKE 1998 → ${end98.toFixed(1)} FT`, X(di(2027, 4, 10)), Y(end98) - 110, { size: 24, k: ke, fill: P.white, dot: P.red, weight: 800, align: 'right' });
        G.pill(g, `LIKE 2016 → ${end16.toFixed(1)} FT`, X(di(2027, 4, 20)), Y(end16) + 62, { size: 24, k: range(t, tS + sDur + 0.2, tS + sDur + 0.8), fill: P.white, dot: P.red, weight: 800, align: 'right' });
      }
      // the label that must never be missed
      g.save(); g.translate(1840, 110); G.slab(g, 'SCENARIO, NOT A FORECAST', 0, 0, { size: 36, fill: P.red, align: 'right', k: range(t, 0.2, 0.8) }); g.restore();
      const note = ['OUR SCENARIO: THE ACP PROJECTION FOR 17 DEC 2026 (85.5 FT), THEN THE ACTUAL', 'DROP FROM 17 DEC IN 1997–98 (−5.0 FT) AND 2015–16 (−5.6 FT). THE ACP HAS NOT PUBLISHED A 2027 FORECAST.'];
      note.forEach((l, i) => G.text(g, l, 120, 975 + i * 30, { size: 19, weight: 600, fam: F.mono, color: P.ink, track: 0.02, alpha: range(t, 0.8, 1.5) }));
      k.flat(); G.source(g, Pm.source ?? 'DATA: ACP DAILY LEVEL 1965–2026; ACP PROJECTION OF 13 OCT 2026; DRAFTS: ACP ADVISORIES, NASA EO', range(t, 0.6, 1.4), { size: 16, y: 1068 });
    }, { push: 0.04, fx: 1200, fy: 700 });
  }

  return { gauge };
}
