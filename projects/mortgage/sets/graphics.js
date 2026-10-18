// Mortgage bright graphics (episode 6, "The Auction That Sets Your Mortgage Rate"): cards painted on a 2D canvas.
//   title      the episode title card (rising yield line, 2026 auction ticker)       graphics.js
//   chapter    chapter card on ledger paper with the real 10-year yield rising        graphics.js
//   quote      verbatim quote card, words appear as they are spoken                   graphics.js
//   bignumber  a generic count-up card                                                graphics.js
//   counter    flip-board for clocks and rates (12:59 -> 1:00, 6.09% -> 7.04%)       graphics.js
//   timeline   horizontal ledger timeline (1929 … 2024–26)                            graphics.js
//   calendar   the countdown to 10 Nov 2026 (mode 'month') and the pipe (mode 'travel') graphics.js
// Params for every set: projects/mortgage/SETS-graphics.md. Every number on screen comes from RESEARCH.md.
// Format: makeGraphics(H) -> { name: async (ctx, shot) => ({ scene, camera, layer, canvas, update(t, p) }) }.
import * as G from './graphics-kit.js';
import * as M from '/engine/motion.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

// RESEARCH §2b: the 2026 climb in 10-year auction high yields (S05)
export const AUCTIONS10 = [['12 JAN', 4.173], ['12 MAY', 4.468], ['12 AUG', 4.683], ['9 SEP', 4.834], ['7 OCT', 5.300]];

export default function makeGraphics(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // the real 10-year yield from `from` to the last close, as [ms, value] weekly samples
  async function tenYear(from = '2020-01-01') {
    const s = await G.series('DGS10'), t0 = G.ms(from), out = [];
    let last = -Infinity; for (let i = 0; i < s.t.length; i++) { if (s.t[i] < t0) continue; if (s.t[i] - last >= 5 * 864e5) { out.push([s.t[i], s.v[i]]); last = s.t[i]; } }
    out.push([s.t.at(-1), s.v.at(-1)]); return out;
  }
  // draw a data line into a rect (x0, y0, x1, y1) with a value range, drawn on to fraction u; returns the head point
  function yieldLine(g, pts, rect, yr, u, { color = P.teal, width = 6, fill = P.tealPale, fillA = 0.9 } = {}) {
    const [x0, y0, x1, y1] = rect, tA = pts[0][0], tB = pts.at(-1)[0];
    const X = (t) => x0 + (t - tA) / (tB - tA) * (x1 - x0), Y = (v) => y1 - (v - yr[0]) / (yr[1] - yr[0]) * (y1 - y0);
    const n = Math.max(2, Math.round(pts.length * clamp(u))), xy = pts.slice(0, n).map(([t, v]) => [X(t), Y(v)]);
    if (fill) { g.save(); g.globalAlpha *= fillA; g.beginPath(); g.moveTo(xy[0][0], y1); xy.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(xy.at(-1)[0], y1); g.closePath(); g.fillStyle = fill; g.fill(); g.restore(); }
    g.save(); g.beginPath(); xy.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); g.restore();
    return xy.at(-1);
  }

  // ================================================================ title
  async function title(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 6, lines = Pm.lines ?? ['THE AUCTION', 'THAT SETS YOUR', 'MORTGAGE RATE'];
    const pts = await tenYear('2020-01-01');
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.2); G.paper(g, { step: 60 });
      // the real 10-year yield, 2020 -> Oct 2026, rising behind the type
      k.view(0.45);
      const head = yieldLine(g, pts, [-40, 520, 1960, 880], [0, 6], E.inOutSine(range(t, 0.1, Math.min(D * 0.75, 4.5))), { color: 'rgba(42,140,134,0.6)', width: 7, fill: 'rgba(210,233,228,0.75)' });
      if (head) G.pin(g, head[0], head[1], t, range(t, 0.2, 0.6), { color: P.teal, r: 9 });
      // a soft paper halo so the type never sits on the line
      const halo = g.createRadialGradient(960, 450, 120, 960, 450, 900); halo.addColorStop(0, 'rgba(247,246,241,0.92)'); halo.addColorStop(0.55, 'rgba(247,246,241,0.6)'); halo.addColorStop(1, 'rgba(247,246,241,0)');
      g.save(); g.scale(1, 0.55); g.fillStyle = halo; g.fillRect(-200, 0, 2320, 1700); g.restore();
      // type
      k.view(1);
      const size = Pm.size ?? 150, y0 = Pm.y ?? 290;
      lines.forEach((l, i) => {
        const red = i === lines.length - 1;
        G.riseText(g, l, 960, y0 + i * size * 1.0, range(t, 0.25 + i * 0.2, 1.25 + i * 0.2), { size, weight: 900, align: 'center', color: red ? P.red : P.ink, track: -0.02, maxW: 1700 });
      });
      // the tape: 2026 ten-year auction high yields (S05), revealed one by one, 5.300% in red
      k.view(0.8);
      const ty = 930, kt = range(t, 0.6, 1.1);
      if (kt > 0) {
        g.save(); g.globalAlpha = clamp(kt * 2); G.shadow(g, 0.8); g.fillStyle = P.ink; g.fillRect(-200, ty - 46, 2320, 92); G.noShadow(g);
        const lab = '10-YR AUCTIONS 2026', items = AUCTIONS10.map(([d, v]) => [d, `${v.toFixed(3)}%`, v >= 5.3]);
        const wl = G.measure(g, lab, 22, 500, F.mono, 0.12), wi = items.map(([d, v]) => G.measure(g, d, 22, 500, F.mono, 0.1) + 14 + G.measure(g, v, 32, 500, F.mono) + 56);
        let x = 960 - (wl + 50 + wi.reduce((a, b) => a + b, 0) - 56) / 2;
        G.text(g, lab, x, ty + 8, { size: 22, weight: 500, fam: F.mono, color: 'rgba(255,255,255,0.7)', track: 0.12 }); x += wl + 50;
        items.forEach(([d, v, red], i) => {
          const ki = range(t, 0.9 + i * 0.28, 1.3 + i * 0.28); if (ki <= 0) return;
          g.save(); g.globalAlpha *= ki;
          G.text(g, d, x, ty + 8, { size: 22, weight: 500, fam: F.mono, color: 'rgba(255,255,255,0.7)', track: 0.1 });
          const vx = x + G.measure(g, d, 22, 500, F.mono, 0.1) + 14, vw = G.measure(g, v, 32, 500, F.mono);
          if (red) { G.rr(g, vx - 10, ty - 25, vw + 20, 48, 8); g.fillStyle = P.red; g.fill(); }
          G.text(g, v, vx, ty + 11, { size: 32, weight: 500, fam: F.mono, color: P.white });
          g.restore(); x += wi[i];
        });
        g.restore();
      }
      k.flat(); if (Pm.sub) G.text(g, Pm.sub, 960, 1036, { size: 24, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.16, upper: true, alpha: E.outCubic(range(t, 1.6, 2.2)) });
    }, { push: 0.05, dx: 0 });
  }

  // ================================================================ chapter: ledger paper, the 10-year rising on the right
  async function chapter(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 4, num = String(Pm.num ?? 1).padStart(2, '0');
    const ttl = String(Pm.title ?? 'Chapter'), sub = Pm.sub ?? '';
    const pts = await tenYear(Pm.from ?? '2020-01-01');
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { step: 54, margin: 96, cols: [1040, 1240, 1440, 1640] });
      // right: the line, on its own ledger columns
      k.view(0.7);
      const u = E.inOutSine(range(t, 0.15, Math.min(D * 0.8, 3.2)));
      const head = yieldLine(g, pts, [1040, 330, 1820, 940], [0, 6], u, { color: P.teal, width: 7, fill: 'rgba(210,233,228,0.85)' });
      if (head) G.pin(g, head[0], head[1], t, range(t, 0.3, 0.8), { color: u >= 1 ? P.red : P.teal, r: 10, pulse: u >= 1 });
      G.text(g, '10-YEAR TREASURY YIELD · 2020 – 2026', 1820, 990, { size: 18, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, align: 'right', alpha: range(t, 0.8, 1.4) });
      // left: the type
      k.view(1);
      G.text(g, 'CHAPTER', 160, 300, { size: 30, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.3, alpha: E.outCubic(range(t, 0.1, 0.6)) });
      g.fillStyle = P.teal; g.fillRect(160, 330, 90 * E.emphasized(range(t, 0.1, 0.7)), 6);
      G.text(g, num, 148, 540, { size: 220, weight: 500, fam: F.mono, color: P.ink, track: -0.04, alpha: E.outCubic(range(t, 0.1, 0.5)) });
      const big = ttl.length > 16 ? 96 : 128, lines = G.wrap(g, ttl, 840, big, 900);
      lines.forEach((l, i) => G.riseText(g, l, 156, 690 + i * big * 1.02, range(t, 0.35 + i * 0.12, 1.2 + i * 0.12), { size: big, weight: 900, color: P.ink, track: -0.015 }));
      if (sub) G.text(g, sub, 160, 690 + (lines.length - 1) * big * 1.02 + 76, { size: 36, weight: 600, color: P.inkSoft, alpha: E.outCubic(range(t, 1.0, 1.7)) });
    }, { push: 0.04, dx: 20 });
  }

  // ================================================================ quote
  async function quote(ctx, shot) {
    const Pm = shot.params ?? {}, txt = String(Pm.text ?? ''), D = shot.duration ?? 7;
    const words = txt.split(/\s+/).filter(Boolean);
    const said = (shot.words ?? []).length ? M.wordTimes(shot, txt, { fallback: 0.5, gap: 0.16 }) : words.map((_, i) => 0.4 + i * Math.min(0.16, (D * 0.55) / words.length));
    const hl = (Pm.highlight ?? []).map(s => String(s).toLowerCase().replace(/[^a-z0-9.,$%]/g, ''));
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(1);
      const size = Pm.size ?? (txt.length > 160 ? 64 : txt.length > 90 ? 72 : txt.length > 40 ? 88 : 128), maxW = 1340;
      const lines = []; let cur = [], cw = 0; const sp = G.measure(g, ' ', size, 400, F.serif);
      words.forEach((w, i) => { const ww = G.measure(g, w, size, 400, F.serif); if (cw + ww > maxW && cur.length) { lines.push(cur); cur = []; cw = 0; } cur.push({ w, i, ww }); cw += ww + sp; });
      if (cur.length) lines.push(cur);
      const lh = size * 1.14, h = lines.length * lh, extra = (Pm.by ? 70 : 0) + (Pm.role ? 44 : 0);
      const cardH = h + 120 + extra + 60, cardY = Math.max(60, 520 - cardH / 2), top = cardY + 70 + size * 0.85;
      G.card(g, 170, cardY, 1580, cardH, { r: 30, lift: 1.3 });
      g.fillStyle = P.teal; g.fillRect(170, cardY + 40, 8, cardH - 80);
      G.text(g, '“', 228, cardY + 150, { size: 200, weight: 400, fam: F.serif, color: P.teal, alpha: E.outCubic(range(t, 0.05, 0.5)) });
      lines.forEach((ln, li) => {
        let x = 330; const y = top + li * lh;
        ln.forEach(({ w, i, ww }) => {
          const tw = said[i] ?? 0.5, kk = range(t, tw - 0.05, tw + 0.35);
          const key = w.toLowerCase().replace(/[^a-z0-9.,$%]/g, '');
          if (hl.some(h => h && key.startsWith(h))) { const kh = E.emphasized(range(t, tw + 0.1, tw + 0.6)); g.fillStyle = 'rgba(169,197,174,0.65)'; g.fillRect(x - 6, y - size * 0.6, (ww + 12) * kh, size * 0.74); }
          G.text(g, w, x, y + (1 - E.outCubic(kk)) * 16, { size, weight: 400, fam: F.serif, color: P.ink, alpha: kk });
          x += ww + sp;
        });
      });
      const tb = Math.min((said.at(-1) ?? 1) + 0.4, D - 1.2), yb = top + h + 36;
      if (Pm.by) { g.fillStyle = P.teal; g.fillRect(330, yb - 36, 56 * E.emphasized(range(t, tb, tb + 0.5)), 5); G.text(g, `— ${Pm.by}`, 330, yb + 12, { size: 38, weight: 800, alpha: E.outCubic(range(t, tb, tb + 0.6)) }); }
      if (Pm.role) G.text(g, Pm.role, 330, yb + 58, { size: 22, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, upper: true, alpha: E.outCubic(range(t, tb + 0.2, tb + 0.8)), maxW: 1380 });
      k.flat(); G.source(g, Pm.source, range(t, 0.6, 1.4));
    }, { push: 0.04 });
  }

  // ================================================================ bignumber: a generic count-up card
  async function bignumber(ctx, shot) {
    const Pm = shot.params ?? {}, v = Pm.value ?? 0, dec = Pm.decimals ?? (Number.isInteger(v) ? 0 : 1);
    const t0 = G.cue(shot, Pm.at ?? Pm.word, 0.35), dur = Pm.roll ?? 1.6, from = Pm.from ?? 0;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(1);
      G.card(g, 140, 170, 1640, 680, { r: 34, lift: 1.3 });
      G.ledgerLines(g, 140, 170, 1640, 680, { step: 68, alpha: 0.7 });
      G.kicker(g, Pm.kicker ?? '', 220, 270, range(t, 0.05, 0.6));
      const u = E.outExpo(range(t, t0, t0 + dur)), val = lerp(from, v, u);
      const s = (Pm.prefix ?? '') + G.fmt(val, dec) + (Pm.suffix ?? '');
      const size = Pm.size ?? (s.length > 10 ? 210 : s.length > 7 ? 250 : 290);
      G.text(g, s, 206, 540, { size, weight: 900, color: Pm.red ? P.red : P.ink, track: -0.02, alpha: sstep(t0 - 0.05, t0 + 0.15, t), maxW: 1500 });
      if (Pm.unit) G.text(g, Pm.unit, 220, 620, { size: 44, weight: 700, color: P.inkSoft, alpha: E.outCubic(range(t, t0 + 0.4, t0 + 1)) });
      const lines = G.wrap(g, Pm.label ?? '', 1450, 50, 700);
      lines.forEach((l, i) => G.riseText(g, l, 220, (Pm.unit ? 700 : 660) + i * 62, range(t, t0 + 0.5 + i * 0.12, t0 + 1.3 + i * 0.12), { size: 50, weight: 700 }));
      if (Pm.note) G.pill(g, Pm.note, 1700, 248, { size: 24, align: 'right', k: range(t, t0 + 1, t0 + 1.5), fill: P.mint, dot: P.teal });
      if (Pm.asof) G.asOf(g, Pm.asof, 220, 900, range(t, t0 + 1.1, t0 + 1.6));
      if (Pm.math) G.ourMath(g, Pm.math === true ? '' : Pm.math, Pm.asof ? 1700 : 220, 900, range(t, t0 + 1.2, t0 + 1.7), { align: Pm.asof ? 'right' : 'left' });
      k.flat(); G.source(g, Pm.source, range(t, 0.6, 1.4));
    });
  }

  // ================================================================ counter: the flip board (clocks and rates)
  const PRESETS = {
    clock: { kicker: 'WED 7 OCT 2026 · 10-YEAR NOTE AUCTION', title: 'Competitive bids close at 1:00 p.m.', source: 'SOURCE: TREASURY OFFERING ANNOUNCEMENT, 1 OCT 2026',
      steps: [{ text: '12:59', label: 'ONE MINUTE TO GO', sub: 'P.M. EASTERN TIME' }, { text: '1:00', label: 'THE BIDS LOCK', sub: 'COMPETITIVE CLOSING TIME 1:00 P.M. ET', red: true }] },
    nov10: { kicker: 'TUE 10 NOV 2026 · THE NEXT 10-YEAR AUCTION', title: 'Sealed bids. One deadline.', source: 'SOURCE: TREASURY TENTATIVE AUCTION SCHEDULE',
      steps: [{ text: '12:59', label: 'TUESDAY 10 NOVEMBER', sub: 'P.M. EASTERN TIME' }, { text: '1:00', label: 'AND ONE NUMBER', sub: 'NOBODY KNOWS IT YET', red: true }] },
    paradox: { kicker: '30-YEAR FIXED MORTGAGE · FREDDIE MAC WEEKLY SURVEY', title: 'The Fed cut. Mortgages rose.', source: 'SOURCE: FREDDIE MAC PMMS VIA FRED; FOMC',
      steps: [{ text: '6.09%', label: '19 SEP 2024', sub: 'THE WEEK THE FED STARTED CUTTING' }, { text: '7.04%', label: '16 JAN 2025', sub: 'FOUR MONTHS AND A FULL POINT OF CUTS LATER', red: true }] },
    today: { kicker: '30-YEAR FIXED MORTGAGE · FREDDIE MAC WEEKLY SURVEY', title: 'The rate on the same loan', source: 'SOURCE: FREDDIE MAC PMMS, 15 OCT 2026', asof: 'AS OF 15 OCT 2026',
      steps: [{ text: '6.27%', label: '16 OCT 2025', sub: 'A YEAR AGO' }, { text: '7.40%', label: '15 OCT 2026', sub: 'HIGHEST SINCE NOVEMBER 2023', red: true }] },
    yield: { kicker: '10-YEAR NOTE AUCTION · 7 OCT 2026', title: 'The number that came out', source: 'SOURCE: TREASURY AUCTION RESULTS, 7 OCT 2026',
      steps: [{ text: '5.300%', label: 'HIGH YIELD', sub: 'HIGHEST 10-YEAR AUCTION SINCE NOVEMBER 2000', red: true }] },
  };
  async function counter(ctx, shot) {
    const Pm = shot.params ?? {}, pre = PRESETS[Pm.preset ?? (Pm.steps ? '' : 'clock')] ?? {}, steps = (Pm.steps ?? pre.steps).map(s => (typeof s === 'string' ? { text: s } : s));
    const D = shot.duration ?? 8;
    const T = G.cues(shot, steps, { from: 0.35, span: Math.max(1.4 * (steps.length - 1), D * 0.5) });
    const L = Math.max(...steps.map(s => s.text.length));
    const pad = (s) => s.padStart(L, ' ').split('');
    const narrow = (c) => /[:.,]/.test(c);
    // fixed slot widths: a slot is narrow when every step has punctuation (or blank) there
    const slots = Array.from({ length: L }, (_, i) => steps.every(s => { const c = pad(s.text)[i]; return narrow(c) || c === ' ' && steps.some(o => narrow(pad(o.text)[i])); }) ? 'n' : 'w');
    const TW = Pm.tile ?? Math.min(250, 1500 / (L + 0.4)), TH = TW * 1.36, NW = TW * 0.42, gap = 14;
    const boardW = slots.reduce((a, s) => a + (s === 'n' ? NW : TW) + gap, -gap);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.7);
      G.kicker(g, Pm.kicker ?? pre.kicker, 150, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? pre.title, 150, 236, range(t, 0.15, 1.0), { size: 72, weight: 800, maxW: 1620 });
      k.view(1);
      let si = 0; for (let i = 0; i < steps.length; i++) if (t >= T[i]) si = i;
      const cur = steps[si], prev = steps[Math.max(0, si - 1)], tc = T[si];
      const from = si === 0 ? pad('').map(() => ' ') : pad(prev.text), to = pad(cur.text);
      const x0 = 960 - boardW / 2, y0 = 330;
      G.card(g, x0 - 44, y0 - 44, boardW + 88, TH + 88, { r: 30, fill: P.ink, lift: 1.4, grainA: 0 });
      const redNow = cur.red && t > tc + 0.4 + L * 0.12;
      let x = x0;
      for (let i = 0; i < L; i++) {
        const w = slots[i] === 'n' ? NW : TW, a = from[i], b = to[i], stopAt = tc + 0.5 + i * 0.12;
        const shown = t < tc ? (si === 0 ? ' ' : b) : b;
        if (slots[i] === 'n') {
          const c = t < tc && si === 0 ? ' ' : (t < stopAt - 0.25 ? a : b);
          if (c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.78, { size: TW * 0.95, weight: 800, align: 'center', color: redNow ? '#ff6a5c' : P.white });
          x += w + gap; continue;
        }
        G.rr(g, x, y0, w, TH, 14); const gr = g.createLinearGradient(0, y0, 0, y0 + TH); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#eef1ee'); g.fillStyle = gr; g.fill();
        g.save(); G.rr(g, x, y0, w, TH, 14); g.clip();
        const digit = (c) => (c === ' ' ? 10 : /\d/.test(c) ? +c : null);
        const da = digit(a), db = digit(b), spinning = t >= tc && t < stopAt && a !== b && da != null && db != null;
        const col = redNow ? P.red : P.ink;
        if (spinning) {
          const dist = 22 + ((db - da) % 11 + 11) % 11, u = E.outCubic(range(t, tc, stopAt)), pos = da + dist * u;
          for (let j = -1; j <= 1; j++) { const d = ((Math.floor(pos) + j) % 11 + 11) % 11, off = (pos - Math.floor(pos) - j) * TH; if (d !== 10) G.text(g, String(d), x + w / 2, y0 + TH * 0.76 - off, { size: TW * 1.02, weight: 800, align: 'center', color: P.ink, alpha: u < 0.8 ? 0.55 : 1 }); }
        } else {
          const c = t >= tc && t < stopAt ? (t < stopAt - 0.2 ? a : b) : shown;
          if (c && c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.76, { size: c === '%' || c === '$' ? TW * 0.8 : TW * 1.02, weight: 800, align: 'center', color: col });
        }
        g.restore();
        g.fillStyle = 'rgba(20,35,61,0.2)'; g.fillRect(x, y0 + TH / 2 - 1.5, w, 3);
        g.fillStyle = P.ink; g.fillRect(x - 3, y0 + TH / 2 - 9, 6, 18); g.fillRect(x + w - 3, y0 + TH / 2 - 9, 6, 18);
        x += w + gap;
      }
      const yl = y0 + TH + 140, kl = range(t, tc + 0.3, tc + 1.1);
      G.riseText(g, cur.label, 960, yl, kl, { size: 60, weight: 800, align: 'center', color: cur.red ? P.red : P.ink, track: 0.01 });
      if (cur.sub) G.text(g, cur.sub, 960, yl + 54, { size: 26, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.12, alpha: E.outCubic(range(t, tc + 0.6, tc + 1.3)) });
      // earlier steps as chips (only when there are several)
      if (steps.length > 1) {
        const chips = steps.map(st => `${st.text.trim()} · ${st.label}`), ws = chips.map(c => G.measure(g, c, 22, 500, F.mono) + 22 * 1.1 + 22 * 0.75), gap = 28;
        let cx = 960 - (ws.reduce((a, b) => a + b, 0) + gap * (steps.length - 1)) / 2;
        steps.forEach((st, i) => { if (t >= T[i] + 0.6) G.pill(g, chips[i], cx, yl + 130, { size: 22, k: range(t, T[i] + 0.6, T[i] + 1.1), dot: i === si && st.red ? P.red : P.inkFaint, fill: i === si ? P.mint : P.white, fam: F.mono, weight: 500 }); cx += ws[i] + gap; });
      }
      const asof = cur.asof ?? Pm.asof ?? pre.asof;
      if (asof) G.asOf(g, asof, 1770, 150, range(t, 0.6, 1.1), { align: 'right' });
      k.flat(); G.source(g, Pm.source ?? pre.source, range(t, 0.8, 1.6));
    }, { push: 0.035 });
  }

  // ================================================================ timeline
  const EVENTS = [
    { year: '1929', label: 'First Treasury bill auction · 13 Dec' },
    { year: '1983', label: 'Yardeni coins “Bond Vigilantes”' },
    { year: '1993', label: 'Carville: “come back as the bond market”' },
    { year: '1994', label: 'Bond rout: 10-yr 5.19% → 8.05%' },
    { year: '2022', label: 'UK gilt crisis: BoE buys £19.3bn' },
    { year: '2024–26', label: 'Fed cuts 1.75 pts; 10-yr auction at 5.300%' },
  ];
  const yearNum = (y) => parseInt(String(y), 10);
  async function timeline(ctx, shot) {
    const Pm = shot.params ?? {}, ev = (Pm.events ?? EVENTS).map(e => (typeof e === 'object' ? e : EVENTS.find(x => String(x.year) === String(e)) ?? { year: String(e), label: '' }));
    const D = shot.duration ?? 8, n = ev.length, sp = Pm.spacing ?? (n > 1 ? Math.min(330, 1440 / (n - 1)) : 0), X = (i) => 960 - sp * (n - 1) / 2 + i * sp, total = X(n - 1) + 260;
    const fi = (f) => { if (f == null) return null; const i = ev.findIndex(e => String(e.year) === String(f) || e.label === f); return i < 0 ? null : i; };
    const focus = Array.isArray(Pm.focus) ? Pm.focus.map(fi) : [fi(Pm.focus), fi(Pm.focus)];
    const T = Pm.focus != null && !ev.some(e => e.word) ? ev.map((_, i) => 0.15 + i * 0.08) : G.cues(shot, ev, { from: 0.3, span: D * 0.6 });
    const lw = Math.min(300, sp - 20);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      k.view(1);
      const y = 590;
      // the axis: a navy ledger rule with fine ticks
      const reach = Math.max(...ev.map((e, i) => (t >= T[i] - 0.4 ? X(i) : 0)), X(0)) + sp * 0.6;
      g.save(); g.beginPath(); g.rect(-200, 0, reach + 200, 1080); g.clip();
      g.fillStyle = P.ink; g.fillRect(-200, y - 3, 2320, 6);
      for (let x = -200; x < 2120; x += 24) { g.fillStyle = P.rule; g.fillRect(x, y + 10, 2, 10); }
      g.restore();
      ev.forEach((e, i) => {
        const kk = range(t, T[i] - 0.4, T[i] + 0.4); if (kk <= 0) return;
        const x = X(i), up = i % 2 === 0, lo = Math.min(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1), hi = Math.max(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1);
        const hasF = focus[0] != null, act = !hasF || (i >= lo && i <= hi), col = hasF && act ? P.red : P.ink;
        if (i > 0 && yearNum(e.year) - yearNum(ev[i - 1].year) > 30) { const bx = x - sp / 2; g.save(); g.strokeStyle = P.paper; g.lineWidth = 10; g.beginPath(); g.moveTo(bx - 12, y + 22); g.lineTo(bx + 2, y - 22); g.moveTo(bx + 6, y + 22); g.lineTo(bx + 20, y - 22); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 14, y + 22); g.lineTo(bx, y - 22); g.moveTo(bx + 8, y + 22); g.lineTo(bx + 22, y - 22); g.stroke(); g.restore(); }
        g.save(); g.globalAlpha = act ? 1 : 0.4;
        const stem = 110 * E.outCubic(kk); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, up ? y - stem : y + stem); g.stroke();
        G.pin(g, x, y, t, kk, { color: col === P.red ? P.red : P.teal, r: 11, pulse: hasF && act });
        const ys = String(e.year), ysz = ys.length > 4 ? 72 : 92, ty = up ? y - 140 : y + 222;
        G.riseText(g, ys, x, ty, kk, { size: ysz, weight: 500, fam: F.mono, align: 'center', color: col, track: -0.04 });
        const lines = G.wrap(g, e.label, lw, 30, 700);
        lines.forEach((l, j) => G.text(g, l, x, ty + (up ? -ysz - 26 - (lines.length - 1 - j) * 38 : 50 + j * 38), { size: 30, weight: 700, align: 'center', color: P.ink, alpha: E.outCubic(range(t, T[i], T[i] + 0.6)) }));
        g.restore();
      });
      k.flat(); G.kicker(g, Pm.title ?? 'WHEN THE BOND MARKET SAYS NO', 120, 110, range(t, 0, 0.6));
      G.source(g, Pm.source ?? 'SOURCES: NY FED CIRCULAR 949; YARDENI; FRBSF; FRED DGS10; BANK OF ENGLAND; FOMC; TREASURY', range(t, 0.6, 1.4));
    }, { push: 0.03, dx: 30 });
  }

  // ================================================================ calendar: the countdown to Tue 10 Nov 2026
  const DAY = 864e5;
  async function calendar(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    if ((Pm.mode ?? 'month') === 'travel') return travel(ctx, shot);
    const today = G.ms(Pm.today ?? '2026-10-18'), target = G.ms('2026-11-10'), gridStart = G.ms('2026-10-12');
    const tick0 = G.cue(shot, Pm.at, 0.9), tickDur = Math.min(Pm.tick ?? 3.2, Math.max(1.5, D - tick0 - 2.5));
    const days = Math.round((target - today) / DAY);
    const PINS = Pm.pins ?? [
      { date: '2026-11-04', short: 'REFUNDING', label: 'WED 4 NOV · HOW MUCH TREASURY WILL SELL', word: 'Wednesday' },
      { date: '2026-11-10', short: '10-YR', label: 'TUE 10 NOV · 10-YEAR AUCTION · 1:00 P.M. ET', word: 'Tuesday', red: true },
      { date: '2026-11-12', short: '30-YR', label: 'THU 12 NOV · 30-YEAR AUCTION', word: 'thirty' },
    ];
    const PT = PINS.map((pn, i) => G.cue(shot, pn.word, tick0 + tickDur * (0.25 + i * 0.3)));
    const tClock = G.cue(shot, Pm.clockAt, Math.max(tick0 + tickDur, D - 2.6));
    const cw = 146, ch = 112, gx = 110, gy = 300, DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'THE COUNTDOWN', 110, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'The next price is coming', 110, 200, range(t, 0.12, 0.9), { size: 64, weight: 800 });
      G.asOf(g, 'TODAY · SUN 18 OCT 2026', 1810, 104, range(t, 0.3, 0.8), { align: 'right' });
      // grid
      G.card(g, gx - 24, gy - 64, cw * 7 + 48, ch * 5 + 92, { r: 24, lift: 1 });
      DOW.forEach((d, i) => G.text(g, d, gx + i * cw + cw / 2, gy - 22, { size: 20, weight: 500, fam: F.mono, color: P.inkSoft, align: 'center', track: 0.12, alpha: range(t, 0.2, 0.6) }));
      const sweep = today + E.inOutSine(range(t, tick0, tick0 + tickDur)) * (target - today);
      for (let d = 0; d < 35; d++) {
        const date = gridStart + d * DAY, dt = new Date(date), c = d % 7, r = Math.floor(d / 7), x = gx + c * cw, y = gy + r * ch;
        const kk = range(t, 0.15 + d * 0.012, 0.5 + d * 0.012); if (kk <= 0) continue;
        const nov = dt.getUTCMonth() === 10, past = date < today, isT = date === today, closed = date === G.ms('2026-11-11');
        g.save(); g.globalAlpha = clamp(kk * 2);
        G.rr(g, x + 5, y + 5, cw - 10, ch - 10, 10); g.fillStyle = nov ? P.white : P.paperDeep; g.fill();
        if (closed) { g.save(); G.rr(g, x + 5, y + 5, cw - 10, ch - 10, 10); g.clip(); g.strokeStyle = P.rule; g.lineWidth = 2; for (let s = -ch; s < cw; s += 14) { g.beginPath(); g.moveTo(x + s, y + ch); g.lineTo(x + s + ch, y); g.stroke(); } g.restore(); }
        const passed = date > today && date <= sweep;
        if (passed) { g.fillStyle = date === target ? P.red : 'rgba(42,140,134,0.22)'; G.rr(g, x + 5, y + 5, cw - 10, ch - 10, 10); g.fill(); }
        const dn = dt.getUTCDate();
        G.fig(g, String(dn), x + 18, y + 44, { size: 30, color: past ? P.inkFaint : passed && date === target ? P.white : P.ink });
        if (dn === 1 || d === 0) G.text(g, G.MON[dt.getUTCMonth()], x + cw - 16, y + 40, { size: 18, weight: 800, align: 'right', color: P.teal, track: 0.08 });
        if (closed) G.text(g, 'CLOSED', x + cw / 2, y + ch - 22, { size: 16, weight: 500, fam: F.mono, color: P.inkSoft, align: 'center', track: 0.1 });
        if (isT) { g.strokeStyle = P.ink; g.lineWidth = 4; G.rr(g, x + 5, y + 5, cw - 10, ch - 10, 10); g.stroke(); G.text(g, 'TODAY', x + cw / 2, y + ch - 20, { size: 18, weight: 800, align: 'center', color: P.ink, track: 0.08 }); }
        g.restore();
      }
      // pins on the grid, and their labels in the right column
      PINS.forEach((pn, i) => {
        const date = G.ms(pn.date), d = Math.round((date - gridStart) / DAY), x = gx + (d % 7) * cw, y = gy + Math.floor(d / 7) * ch, kk = range(t, PT[i], PT[i] + 0.5);
        if (kk <= 0) return;
        const col = pn.red ? P.red : P.teal;
        g.save(); g.globalAlpha = clamp(kk * 2); g.strokeStyle = col; g.lineWidth = 5; G.rr(g, x + 5, y + 5, cw - 10, ch - 10, 10); g.stroke(); g.restore();
        G.pill(g, pn.short, x + cw / 2, y + ch - 26, { size: 18, align: 'center', k: kk, fill: col, color: P.white, weight: 800 });
        const ly = 560 + i * 74;
        G.pill(g, pn.label, 1210, ly, { size: 23, k: kk, fill: pn.red ? P.red : P.white, color: pn.red ? P.white : P.ink, dot: pn.red ? P.white : col, weight: 700 });
      });
      // the clock to 1:00 and the day count
      const kc = range(t, 0.4, 1.0), uc = E.inOutCubic(range(t, tClock, tClock + 1.8)), secs = lerp(-90, 0, uc) + (uc <= 0 ? lerp(-130, -90, clamp(t / Math.max(0.1, tClock))) : 0);
      const tt = 13 * 3600 + secs, hh = Math.floor(tt / 3600), mm = Math.floor((tt % 3600) / 60), ss = tt % 60;
      G.clock(g, 1390, 360, 150, hh, mm, ss, { red: uc >= 1, k: kc });
      const shown = Math.round(days * E.inOutSine(range(t, tick0, tick0 + tickDur)));
      G.fig(g, String(days - shown).padStart(2, '0'), 1600, 350, { size: 120, color: shown >= days ? P.red : P.ink, alpha: kc });
      G.text(g, shown >= days ? 'AUCTION DAY' : 'DAYS TO GO', 1604, 400, { size: 26, weight: 800, color: P.ink, alpha: kc, track: 0.04 });
      G.text(g, uc >= 1 ? 'BIDS LOCK · 1:00 P.M.' : 'TUE 10 NOV · 1:00 P.M.', 1604, 446, { size: 20, weight: 500, fam: F.mono, color: uc >= 1 ? P.red : P.inkSoft, alpha: kc, track: 0.08 });
      k.flat(); G.source(g, Pm.source ?? 'SOURCES: TREASURY TENTATIVE AUCTION SCHEDULE; QUARTERLY REFUNDING STATEMENT, 5 AUG 2026', range(t, 0.6, 1.4));
    }, { push: 0.035, dx: 30 });
  }

  // ---------------------------------------------------------------- travel: bids -> result -> bonds -> MBS -> rate sheets -> survey
  function icon(g, kind, x, y, s, t, hot) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = P.ink; g.fillStyle = P.white;
    if (kind === 'clock') { G.clock(g, 0, 0, 52, 13, 0, 0, { red: hot }); }
    else if (kind === 'doc') { G.shadow(g, 0.5); g.fillRect(-38, -50, 76, 100); G.noShadow(g); g.strokeRect(-38, -50, 76, 100); for (let i = 0; i < 5; i++) { g.fillStyle = i === 2 ? P.red : P.inkFaint; g.fillRect(-26, -32 + i * 16, i === 2 ? 52 : 40, 6); } }
    else if (kind === 'seesaw') { const a = -0.28; g.fillStyle = P.ink; g.beginPath(); g.moveTo(0, 18); g.lineTo(-16, 46); g.lineTo(16, 46); g.closePath(); g.fill(); g.save(); g.translate(0, 14); g.rotate(a); g.fillStyle = P.teal; g.fillRect(-60, -6, 120, 10); g.restore();
      G.text(g, 'PRICE', -58, 60, { size: 16, weight: 800, color: P.inkSoft }); G.text(g, 'YIELD', 58, -34, { size: 16, weight: 800, color: P.red, align: 'right' }); }
    else if (kind === 'houses') { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const hx = -44 + i * 30, hy = -10 + j * 34; g.fillStyle = j ? P.sagePale : P.white; g.beginPath(); g.moveTo(hx - 13, hy); g.lineTo(hx, hy - 14); g.lineTo(hx + 13, hy); g.lineTo(hx + 13, hy + 16); g.lineTo(hx - 13, hy + 16); g.closePath(); g.fill(); g.lineWidth = 3; g.stroke(); } g.strokeStyle = P.teal; g.lineWidth = 4; G.rr(g, -64, -32, 128, 74, 12); g.stroke(); }
    else if (kind === 'sheet') { G.shadow(g, 0.5); g.fillRect(-46, -46, 92, 92); G.noShadow(g); g.lineWidth = 3; g.strokeRect(-46, -46, 92, 92); g.fillStyle = P.ink; g.fillRect(-46, -46, 92, 18); for (let i = 0; i < 4; i++) { g.fillStyle = P.inkFaint; g.fillRect(-36, -16 + i * 15, 34, 5); g.fillStyle = i === 1 ? P.red : P.inkFaint; g.fillRect(8, -16 + i * 15, 28, 5); } }
    else if (kind === 'chart') { G.shadow(g, 0.5); g.fillRect(-56, -44, 112, 88); G.noShadow(g); g.lineWidth = 3; g.strokeRect(-56, -44, 112, 88); g.strokeStyle = P.teal; g.lineWidth = 5; g.beginPath(); g.moveTo(-44, 26); g.lineTo(-20, 16); g.lineTo(0, 20); g.lineTo(22, -2); g.lineTo(42, -22); g.stroke(); g.fillStyle = P.red; g.beginPath(); g.arc(42, -22, 7, 0, TAU); g.fill(); }
    g.restore();
  }
  async function travel(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 10;
    const NODES = Pm.steps ?? [
      { icon: 'clock', when: 'TUE 10 NOV · 1:00 P.M. ET', title: 'Bids lock', word: 'lock' },
      { icon: 'doc', when: 'THAT AFTERNOON', title: 'Result posted', word: 'result' },
      { icon: 'seesaw', when: '', title: 'Bond prices move', word: 'prices' },
      { icon: 'houses', when: '', title: 'Mortgage-bond investors reprice', word: 'reprice' },
      { icon: 'sheet', when: '', title: 'Lenders update rate sheets', word: 'lenders' },
      { icon: 'chart', when: 'BY THURSDAY', title: 'Freddie Mac’s weekly survey', word: 'Freddie' },
    ];
    const n = NODES.length, T = G.cues(shot, NODES, { from: 0.4, span: Math.max(1.0 * (n - 1), D * 0.62) });
    const cw = 262, gap = (1720 - n * cw) / Math.max(1, n - 1), X = (i) => 100 + i * (cw + gap), y0 = 330, chh = 400;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'HOW FAST IT TRAVELS', 100, 120, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'From the auction to your quote', 100, 204, range(t, 0.12, 0.9), { size: 66, weight: 800 });
      // the wire behind the cards
      const yw = y0 + 150, kw = range(t, T[0], T.at(-1) + 0.4);
      g.fillStyle = P.rule; g.fillRect(X(0) + cw / 2, yw - 3, X(n - 1) - X(0), 6);
      const hx = lerp(X(0) + cw / 2, X(n - 1) + cw / 2, kw);
      // a pulse that hops node to node on the cues
      let si = -1; for (let i = 0; i < n; i++) if (t >= T[i]) si = i;
      const hop = si < 0 ? 0 : si + (si < n - 1 ? E.inOutCubic(range(t, T[si] + 0.1, Math.min(T[si + 1], T[si] + 0.9))) : 0);
      const px = X(0) + cw / 2 + hop * (cw + gap);
      g.fillStyle = P.teal; g.fillRect(X(0) + cw / 2, yw - 3, px - X(0) - cw / 2, 6);
      NODES.forEach((nd, i) => {
        const kk = range(t, T[i] - 0.3, T[i] + 0.4), x = X(i), hot = si === i;
        g.save(); g.globalAlpha = 0.35 + 0.65 * clamp(kk * 1.5); g.translate(0, (1 - E.outCubic(clamp(kk))) * 26);
        G.card(g, x, y0, cw, chh, { r: 22, lift: hot ? 1.4 : 0.7, stroke: hot ? (i === n - 1 ? P.red : P.teal) : null });
        icon(g, nd.icon, x + cw / 2, y0 + 150, 1.15, t, hot && i === 0);
        if (nd.when) G.text(g, nd.when, x + cw / 2, y0 + 50, { size: 17, weight: 500, fam: F.mono, color: i === 0 ? P.red : P.teal, align: 'center', track: 0.06, maxW: cw - 24 });
        const lines = G.wrap(g, nd.title, cw - 36, 32, 800);
        lines.forEach((l, j) => G.text(g, l, x + cw / 2, y0 + 268 + j * 38, { size: 32, weight: 800, align: 'center', color: P.ink }));
        G.fig(g, String(i + 1).padStart(2, '0'), x + 20, y0 + chh - 20, { size: 20, color: P.inkFaint });
        g.restore();
      });
      if (si >= 0) { const gr = g.createRadialGradient(px, yw, 0, px, yw, 40); gr.addColorStop(0, 'rgba(224,36,27,0.45)'); gr.addColorStop(1, 'rgba(224,36,27,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, yw, 40, 0, TAU); g.fill(); }
      // "within days" bracket under the last four nodes
      const kb = range(t, T[Math.min(2, n - 1)] + 0.3, T[Math.min(2, n - 1)] + 1.0);
      if (kb > 0 && n >= 4) {
        const bx0 = X(2), bx1 = X(n - 1) + cw, by = y0 + chh + 50;
        g.save(); g.globalAlpha = clamp(kb * 2); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(bx0, by - 16); g.lineTo(bx0, by); g.lineTo(lerp(bx0, bx1, E.outCubic(kb)), by); g.stroke(); if (kb >= 1) { g.beginPath(); g.moveTo(bx1, by); g.lineTo(bx1, by - 16); g.stroke(); } g.restore();
        G.pill(g, 'WITHIN DAYS', (bx0 + bx1) / 2, by + 44, { size: 26, align: 'center', k: range(t, T[2] + 0.6, T[2] + 1.1), fill: P.ink, color: P.white, weight: 800 });
      }
      k.flat(); G.source(g, Pm.source ?? 'SOURCES: TREASURYDIRECT; ST. LOUIS FED, PAGE ONE ECONOMICS (1 OCT 2026); FREDDIE MAC PMMS (WEEKLY, THURSDAYS)', range(t, 0.6, 1.4));
    }, { push: 0.03, dx: 24 });
  }

  return { title, chapter, quote, bignumber, counter, timeline, calendar };
}
