// AI-bubble bright graphics (episode 8, "How the AI Bubble Pops"): cards painted on a 2D canvas.
//   title      the episode title card (the Nasdaq key-close line 2000 -> 2026 draws behind the type, key-close tape)
//   chapter    chapter card on ledger paper, the Nasdaq key-close line drawing on to the right, a red pulse at the 2026 record
//   quote      verbatim quote card, words appear as they are spoken
//   bignumber  a generic count-up card
//   counter    split-flap board (presets oct14 · oct15, or any steps)
//   timeline   horizontal ledger timeline (10 Mar 2000 Nasdaq peak … 14–16 Oct 2026 selloff)
// Params for every set: projects/aibubble/SETS-graphics.md. Every number on screen comes from RESEARCH.md.
// Format: makeGraphics(H) -> { name: async (ctx, shot) => ({ scene, camera, layer, canvas, update(t, p) }) }.
import * as G from './graphics-kit.js';
import * as M from '/engine/motion.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

export default function makeGraphics(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // the key closes drawn on to fraction u (by length) in rect [x0, y0, x1, y1], value range yr.
  // Straight segments between the sparse points (never smoothed: they are not a daily series). Returns the head.
  function keyLine(g, pts, rect, yr, u, { color = P.teal, width = 6, fill = P.tealPale, fillA = 0.9, dots = true, t = 0, redEnd = true } = {}) {
    const [x0, y0, x1, y1] = rect, tA = pts[0][0], tB = pts.at(-1)[0];
    const X = (tt) => x0 + (tt - tA) / (tB - tA) * (x1 - x0), Y = (v) => y1 - (v - yr[0]) / (yr[1] - yr[0]) * (y1 - y0);
    const xy = pts.map(([tt, v]) => [X(tt), Y(v)]), cum = G.polyLen(xy);
    if (u <= 0) return null;
    const head = G.polyAt(xy, cum, u);
    const done = xy.filter((_, i) => cum[i] <= cum.at(-1) * u + 1e-6);
    if (fill) { g.save(); g.globalAlpha *= fillA; g.beginPath(); g.moveTo(xy[0][0], y1); done.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(head.x, head.y); g.lineTo(head.x, y1); g.closePath(); g.fillStyle = fill; g.fill(); g.restore(); }
    g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round'; G.drawPoly(g, xy, cum, u); g.restore();
    if (dots) done.forEach(([x, y], i) => { if (i === xy.length - 1 && redEnd) return; g.save(); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, width * 1.25, 0, TAU); g.fill(); g.strokeStyle = color; g.lineWidth = width * 0.6; g.stroke(); g.restore(); });
    return { x: head.x, y: head.y, done: u >= 1, xy, X, Y };
  }
  const KP = G.keyPts();

  // ================================================================ title
  async function title(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 6, lines = Pm.lines ?? ['HOW THE', 'AI BUBBLE', 'POPS'];
    const drawEnd = Math.min(D * 0.75, 4.6);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.2); G.paper(g, { step: 60 });
      // the Nasdaq key closes, 10 Mar 2000 -> 6 Oct 2026, drawing on behind the type (navy end: the title's red is its last line)
      k.view(0.45);
      const u = E.inOutSine(range(t, 0.1, drawEnd));
      const hd = keyLine(g, KP, [80, 560, 1780, 880], [0, 30000], u, { color: 'rgba(42,140,134,0.55)', width: 7, fill: 'rgba(210,233,228,0.7)' });
      if (hd) G.pin(g, hd.x, hd.y, t, range(t, 0.2, 0.6), { color: hd.done ? P.ink : P.teal, r: 10, pulse: hd.done });
      // a soft paper halo so the type never sits on the line
      const halo = g.createRadialGradient(960, 430, 120, 960, 430, 900); halo.addColorStop(0, 'rgba(247,246,241,0.94)'); halo.addColorStop(0.55, 'rgba(247,246,241,0.62)'); halo.addColorStop(1, 'rgba(247,246,241,0)');
      g.save(); g.scale(1, 0.55); g.fillStyle = halo; g.fillRect(-200, 0, 2320, 1700); g.restore();
      // type
      k.view(1);
      const size = Pm.size ?? 146, y0 = Pm.y ?? 300;
      lines.forEach((l, i) => {
        const red = i === lines.length - 1;
        G.riseText(g, l, 960, y0 + i * size * 1.0, range(t, 0.25 + i * 0.2, 1.25 + i * 0.2), { size, weight: 900, align: 'center', color: red ? P.red : P.ink, track: -0.02, maxW: 1700 });
      });
      // the tape: Nasdaq key closes (S52, S05), revealed one by one; the 2026 record on a teal chip
      k.view(0.8);
      const ty = 950, kt = range(t, 0.6, 1.1);
      if (kt > 0) {
        g.save(); g.globalAlpha = clamp(kt * 2); G.shadow(g, 0.8); g.fillStyle = P.ink; g.fillRect(-200, ty - 44, 2320, 88); G.noShadow(g);
        const lab = 'NASDAQ COMPOSITE', items = [['10 MAR 2000', '5,048.62'], ['9 OCT 2002', '1,114.11'], ['23 APR 2015', 'BACK ABOVE'], ['6 OCT 2026', '27,599.79', true]];
        const wl = G.measure(g, lab, 21, 500, F.mono, 0.12), wi = items.map(([d, v]) => G.measure(g, d, 21, 500, F.mono, 0.1) + 14 + G.measure(g, v, 32, 500, F.mono) + 60);
        const TW = wl + 50 + wi.reduce((a, b) => a + b, 0) - 60, ts = Math.min(1, 1700 / TW);
        g.translate(960, ty); g.scale(ts, ts); g.translate(-960, -ty);
        let x = 960 - TW / 2;
        G.text(g, lab, x, ty + 8, { size: 21, weight: 500, fam: F.mono, color: 'rgba(255,255,255,0.7)', track: 0.12 }); x += wl + 50;
        items.forEach(([d, v, hi], i) => {
          const ki = range(t, 0.9 + i * 0.32, 1.3 + i * 0.32); if (ki <= 0) { x += wi[i]; return; }
          g.save(); g.globalAlpha *= ki; g.translate(0, (1 - E.outCubic(ki)) * 10);
          G.text(g, d, x, ty + 8, { size: 21, weight: 500, fam: F.mono, color: 'rgba(255,255,255,0.7)', track: 0.1 });
          const vx = x + G.measure(g, d, 21, 500, F.mono, 0.1) + 14, vw = G.measure(g, v, 32, 500, F.mono);
          if (hi) { G.rr(g, vx - 10, ty - 25, vw + 20, 48, 8); g.fillStyle = P.teal; g.fill(); }
          G.text(g, v, vx, ty + 11, { size: 32, weight: 500, fam: F.mono, color: P.white });
          g.restore(); x += wi[i];
        });
        g.restore();
      }
      k.flat();
      if (Pm.sub) G.text(g, Pm.sub, 960, 1046, { size: 22, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.16, upper: true, alpha: E.outCubic(range(t, 1.6, 2.2)) });
      else G.text(g, Pm.source ?? 'NASDAQ COMPOSITE · KEY CLOSES ONLY · YAHOO FINANCE PRICE HISTORY · LINE JOINS POINTS', 960, 1046, { size: 17, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.12, alpha: E.outCubic(range(t, 1.8, 2.4)) });
    }, { push: 0.05, dx: 0 });
  }

  // ================================================================ chapter: ledger paper, the Nasdaq key line on the right
  async function chapter(ctx, shot) {
    const Pm = shot.params ?? {}, D = Math.max(3.5, shot.duration ?? 4), num = String(Pm.num ?? 1).padStart(2, '0');
    const ttl = String(Pm.title ?? 'Chapter'), sub = Pm.sub ?? '';
    const dEnd = Math.min(D * 0.8, 3.1);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { step: 54, margin: 96, cols: [1040, 1240, 1440, 1640] });
      // right: the line, on its own ledger columns
      k.view(0.7);
      const u = E.inOutSine(range(t, 0.15, dEnd));
      const hd = keyLine(g, KP, [1060, 330, 1800, 900], [0, 30000], u, { color: P.teal, width: 7, fill: 'rgba(210,233,228,0.85)' });
      if (hd) {
        G.pin(g, hd.x, hd.y, t, range(t, 0.3, 0.8), { color: hd.done ? P.red : P.teal, r: 11, pulse: hd.done });
        const pk = hd.xy[0], kp = range(t, 0.3, 0.9);
        G.fig(g, '5,048.62', pk[0] + 6, pk[1] - 26, { size: 22, align: 'left', color: P.ink, alpha: E.outCubic(kp) });
        G.fig(g, '2000', pk[0], 938, { size: 18, align: 'left', color: P.inkSoft, alpha: E.outCubic(kp) });
        const ke = range(t, dEnd, dEnd + 0.45);
        if (hd.done) {
          G.fig(g, '27,599.79', hd.x - 56, hd.y + 8, { size: 34, align: 'right', color: P.red, alpha: E.outCubic(ke) });
          G.fig(g, 'RECORD · 6 OCT 2026', hd.x - 56, hd.y + 38, { size: 16, align: 'right', color: P.inkSoft, track: 0.08, alpha: E.outCubic(ke) });
          G.asOf(g, 'AS OF 20 OCT 2026', hd.x - 56, hd.y - 50, range(t, dEnd + 0.2, dEnd + 0.7), { align: 'right', size: 16 });
          G.fig(g, '2026', hd.x, 938, { size: 18, align: 'right', color: P.inkSoft, alpha: E.outCubic(ke) });
        }
      }
      G.text(g, 'NASDAQ COMPOSITE · KEY CLOSES · 2000 – 2026', 1800, 960, { size: 17, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, align: 'right', alpha: range(t, 0.8, 1.4) });
      G.text(g, 'YAHOO FINANCE PRICE HISTORY · LINE JOINS POINTS', 1800, 990, { size: 15, weight: 500, fam: F.mono, color: P.inkFaint, track: 0.1, align: 'right', alpha: range(t, 1.0, 1.6) });
      // left: the type
      k.view(1);
      G.text(g, 'CHAPTER', 160, 300, { size: 30, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.3, alpha: E.outCubic(range(t, 0.1, 0.6)) });
      g.fillStyle = P.teal; g.fillRect(160, 330, 90 * E.emphasized(range(t, 0.1, 0.7)), 6);
      G.text(g, num, 148, 540, { size: 220, weight: 500, fam: F.mono, color: P.ink, track: -0.04, alpha: E.outCubic(range(t, 0.1, 0.5)) });
      const big = ttl.length > 22 ? 84 : ttl.length > 16 ? 96 : 128, lines = G.wrap(g, ttl, 840, big, 900);
      lines.forEach((l, i) => G.riseText(g, l, 156, 690 + i * big * 1.02, range(t, 0.35 + i * 0.12, 1.2 + i * 0.12), { size: big, weight: 900, color: P.ink, track: -0.015 }));
      if (sub) G.wrap(g, sub, 820, 36, 600).forEach((l, i) => G.text(g, l, 160, 690 + (lines.length - 1) * big * 1.02 + 76 + i * 46, { size: 36, weight: 600, color: P.inkSoft, alpha: E.outCubic(range(t, 1.0 + i * 0.1, 1.7 + i * 0.1)) }));
    }, { push: 0.04, dx: 20 });
  }

  // ================================================================ quote
  async function quote(ctx, shot) {
    const Pm = shot.params ?? {}, txt = String(Pm.text ?? ''), D = shot.duration ?? 7;
    const words = txt.split(/\s+/).filter(Boolean);
    const said = (shot.words ?? []).length ? M.wordTimes(shot, txt, { fallback: 0.5, gap: 0.16 }) : words.map((_, i) => 0.4 + i * Math.min(0.16, (D * 0.55) / Math.max(1, words.length)));
    const hl = [].concat(Pm.highlight ?? []).map(s => String(s).toLowerCase().replace(/[^a-z0-9.,$%]/g, ''));
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(1);
      const size = Pm.size ?? (txt.length > 220 ? 56 : txt.length > 160 ? 62 : txt.length > 90 ? 72 : txt.length > 40 ? 88 : 120), maxW = 1300;
      const lines = []; let cur = [], cw = 0; const sp = G.measure(g, ' ', size, 400, F.serif);
      words.forEach((w, i) => { const ww = G.measure(g, w, size, 400, F.serif); if (cw + ww > maxW && cur.length) { lines.push(cur); cur = []; cw = 0; } cur.push({ w, i, ww }); cw += ww + sp; });
      if (cur.length) lines.push(cur);
      const lh = size * 1.14, h = lines.length * lh, extra = (Pm.by ? 70 : 0) + (Pm.role ? 44 : 0);
      const cardH = Math.min(940, h + 120 + extra + 60), cardY = Math.max(50, 520 - cardH / 2), top = cardY + 70 + size * 0.85;
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
      if (Pm.by) { g.fillStyle = P.teal; g.fillRect(330, yb - 36, 56 * E.emphasized(range(t, tb, tb + 0.5)), 5); G.text(g, `— ${Pm.by}`, 330, yb + 12, { size: 38, weight: 800, alpha: E.outCubic(range(t, tb, tb + 0.6)), maxW: 1380 }); }
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

  // ================================================================ counter: the split-flap board (prices and clocks)
  // 14 Oct 2026 was a Wednesday (RESEARCH 1.8 "Wed 14 Oct"); 15 Oct a Thursday.
  const PRESETS = {
    oct14: { kicker: 'WED 14 OCT 2026 · THE TRIGGER DAY', title: 'One hot number, then the selloff', source: 'SOURCES: BLS CPI RELEASE (14 OCT 2026); REUTERS (14 OCT 2026)',
      steps: [{ text: 'WED 14 OCT 2026', label: 'THE DAY IT CRACKED', sub: 'NASDAQ −1.88% · ITS BIGGEST DROP SINCE 23 JUL' },
        { text: 'CPI 3.7%', label: 'US INFLATION, SEPTEMBER, YEAR ON YEAR', sub: 'UP FROM 3.4% IN AUGUST · RELEASED THAT MORNING' },
        { text: 'ORACLE −8.8%', label: 'ORACLE, IN ONE DAY', sub: 'CLOSE $130.55 · VOLUME 61% ABOVE AVERAGE', red: '−8.8%' },
        { text: 'COREWEAVE −15%', label: 'COREWEAVE, IN ONE DAY', sub: 'TO $65.78, AFTER A SELL-OFF IN ITS BONDS', red: '−15%' }] },
    oct15: { kicker: 'THU 15 OCT 2026 · SEOUL', title: 'South Korea trips the switch', source: 'SOURCE: CNN (15 OCT 2026)',
      steps: [{ text: 'KOSPI −7.6%', label: 'SOUTH KOREA’S MARKET, IN ONE DAY', sub: 'SK HYNIX −11% · SAMSUNG −9.5% · NIKKEI −4.9%', red: '−7.6%' },
        { text: 'CIRCUIT BREAKER', label: 'TRIGGERED', sub: 'HOME OF THE WORLD’S MEMORY-CHIP GIANTS', red: true }] },
  };
  const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  async function counter(ctx, shot) {
    const Pm = shot.params ?? {}, pre = PRESETS[Pm.preset ?? (Pm.steps ? '' : 'oct14')] ?? {};
    const steps = (Pm.steps ?? pre.steps ?? [{ text: '—' }]).map(s => (typeof s === 'string' ? { text: s } : s));
    const D = shot.duration ?? 8, clk = Pm.clock ?? pre.clock;
    const T = G.cues(shot, steps, { from: 0.35, span: Math.max(1.6 * (steps.length - 1), D * 0.5) });
    const L = Math.max(...steps.map(s => s.text.length));
    const pad = (s) => s.padStart(L, ' ').split('');
    const narrow = (c) => /[:.,·]/.test(c);
    // fixed slot widths: punctuation slots are narrow, spaces common to every step are gaps
    const slots = Array.from({ length: L }, (_, i) => {
      const cs = steps.map(s => pad(s.text)[i]);
      if (cs.every(c => c === ' ')) return 'g';
      return cs.every(c => narrow(c) || c === ' ') ? 'n' : 'w';
    });
    const unit = slots.reduce((a, s) => a + (s === 'n' ? 0.42 : s === 'g' ? 0.3 : 1), 0) + 0.06 * (L - 1);
    const TW = Pm.tile ?? Math.min(196, 1600 / unit), TH = TW * 1.36, NW = TW * 0.42, GW = TW * 0.3, gap = TW * 0.06;
    const boardW = slots.reduce((a, s) => a + (s === 'n' ? NW : s === 'g' ? GW : TW) + gap, -gap);
    const tFlap = (i) => 0.42 + i * Math.min(0.09, 1.1 / L); // settle delay per slot
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.7);
      G.kicker(g, Pm.kicker ?? pre.kicker, 150, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? pre.title ?? '', 150, 236, range(t, 0.15, 1.0), { size: 72, weight: 800, maxW: clk ? 1380 : 1620 });
      k.view(1);
      let si = 0; for (let i = 0; i < steps.length; i++) if (t >= T[i]) si = i;
      const cur = steps[si], prev = steps[Math.max(0, si - 1)], tc = T[si];
      const from = si === 0 ? pad('').map(() => ' ') : pad(prev.text), to = pad(cur.text);
      const x0 = 960 - boardW / 2, y0 = 380 + Math.max(0, (180 - TH) * 0.5);
      G.card(g, x0 - TW * 0.22, y0 - TW * 0.22, boardW + TW * 0.44, TH + TW * 0.44, { r: 26, fill: P.ink, lift: 1.4, grainA: 0 });
      const redNow = cur.red && t > tc + tFlap(L) + 0.3;
      // on a red step only the figure turns red: the part after the last '·' (or everything when there is none)
      // (or, when red is a string, from where that string starts: red: '−15%')
      const redFrom = typeof cur.red === 'string' && cur.text.includes(cur.red) ? L - cur.text.length + cur.text.lastIndexOf(cur.red)
        : cur.text.includes('·') ? L - cur.text.length + cur.text.lastIndexOf('·') + 1 : 0;
      let x = x0;
      for (let i = 0; i < L; i++) {
        const sl = slots[i], w = sl === 'n' ? NW : sl === 'g' ? GW : TW, a = from[i], b = to[i], stopAt = tc + tFlap(i);
        if (sl === 'g') { x += w + gap; continue; }
        const col = redNow && i >= redFrom ? P.red : P.ink;
        if (sl === 'n') {
          const c = t < tc && si === 0 ? ' ' : (t < stopAt - 0.2 ? a : b);
          if (c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.74, { size: TW * 0.95, weight: 800, align: 'center', color: redNow && i > redFrom ? '#ff6a5c' : P.white });
          x += w + gap; continue;
        }
        G.rr(g, x, y0, w, TH, TW * 0.06); const gr = g.createLinearGradient(0, y0, 0, y0 + TH); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#eef1ee'); g.fillStyle = gr; g.fill();
        g.save(); G.rr(g, x, y0, w, TH, TW * 0.06); g.clip();
        const digit = (c) => (c === ' ' ? 10 : /\d/.test(c) ? +c : null);
        const da = digit(a), db = digit(b), moving = t >= tc && t < stopAt && a !== b;
        const fs = (c) => (c === '%' || c === '$' || c === '−' ? TW * 0.8 : /[A-Z]/.test(c) ? TW * (/[MW]/.test(c) ? 0.78 : 0.9) : TW * 1.0);
        if (moving && da != null && db != null) {
          // digit reel
          const dist = 22 + ((db - da) % 11 + 11) % 11, uu = E.outCubic(range(t, tc, stopAt)), pos = da + dist * uu;
          for (let j = -1; j <= 1; j++) { const d = ((Math.floor(pos) + j) % 11 + 11) % 11, off = (pos - Math.floor(pos) - j) * TH; if (d !== 10) G.text(g, String(d), x + w / 2, y0 + TH * 0.75 - off, { size: TW * 1.0, weight: 800, align: 'center', color: P.ink, alpha: uu < 0.8 ? 0.55 : 1 }); }
        } else if (moving) {
          // split flap: cycle seeded letters, each flip squashes the tile's glyph
          const n = 6, uu = range(t, tc, stopAt), idx = Math.min(n, Math.floor(uu * n)), r = rng(G.hash(i, si));
          const seq = Array.from({ length: n }, () => FLAP[Math.floor(r() * FLAP.length)]); seq.push(b);
          const c = idx >= n ? b : seq[idx], ph = (uu * n) % 1, sq = idx >= n ? 1 : Math.abs(Math.cos(ph * Math.PI));
          g.save(); g.translate(x + w / 2, y0 + TH / 2); g.scale(1, Math.max(0.08, sq)); g.translate(-(x + w / 2), -(y0 + TH / 2));
          if (c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.75, { size: fs(c), weight: 800, align: 'center', color: P.ink, alpha: 0.85 });
          g.restore();
        } else {
          const c = t < tc ? (si === 0 ? ' ' : b) : b;
          if (c && c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.75, { size: fs(c), weight: 800, align: 'center', color: col });
        }
        g.restore();
        g.fillStyle = 'rgba(20,35,61,0.2)'; g.fillRect(x, y0 + TH / 2 - 1.5, w, 3);
        g.fillStyle = P.ink; g.fillRect(x - 2, y0 + TH / 2 - TW * 0.04, 4, TW * 0.08); g.fillRect(x + w - 2, y0 + TH / 2 - TW * 0.04, 4, TW * 0.08);
        x += w + gap;
      }
      const yl = y0 + TH + 150, kl = range(t, tc + 0.3, tc + 1.1);
      G.riseText(g, cur.label ?? '', 960, yl, kl, { size: 60, weight: 800, align: 'center', color: P.ink, track: 0.01, maxW: 1600 });
      if (cur.sub) G.text(g, cur.sub, 960, yl + 56, { size: 26, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, tc + 0.6, tc + 1.3)), maxW: 1600 });
      // a step tracker (several steps): one dot per step, the current one filled
      if (steps.length > 1) {
        const n = steps.length, gx = 960 - (n - 1) * 30;
        steps.forEach((st, i) => { const on = t >= T[i], kk = E.outBack(range(t, T[i], T[i] + 0.4)); g.save(); g.fillStyle = P.rule; g.beginPath(); g.arc(gx + i * 60, yl + 120, 9, 0, TAU); g.fill(); if (on) { g.fillStyle = i === si ? (st.red ? P.red : P.teal) : P.inkFaint; g.beginPath(); g.arc(gx + i * 60, yl + 120, 9 * kk, 0, TAU); g.fill(); } g.restore(); });
      }
      // an analog clock for clock presets: the second hand sweeps, the minute hand creeps
      if (clk) { const ss = (t * 6) % 60; G.clock(g, 1700, 200, 96, clk[0], clk[1] + ss / 60 - 0.5, ss, { red: true, k: E.outBack(range(t, 0.2, 0.8)) }); }
      const asof = cur.asof ?? Pm.asof ?? pre.asof;
      if (asof) G.asOf(g, asof, 1770, 150, range(t, 0.6, 1.1), { align: 'right' });
      k.flat(); G.source(g, Pm.source ?? pre.source, range(t, 0.8, 1.6));
    }, { push: 0.035 });
  }

  // ================================================================ timeline
  // { year, date (small line above the year), label, word, red }
  // only events with a RESEARCH row (§0, §7, §2a, §1); Lucent's 1996 spin-off has no row, so it is not here
  const EVENTS = [
    { year: '2000', date: '10 MAR', label: 'Nasdaq record close: 5,048.62' },
    { year: '2000', date: '30 SEP', label: 'Lucent: $8.1B of financing for its own customers' },
    { year: '2002', date: '9 OCT', label: 'Nasdaq bottoms, −77.9% from the peak' },
    { year: '2009', date: '14 JAN', label: 'Nortel files for creditor protection' },
    { year: '2015', date: '23 APR', label: 'Nasdaq finally closes above its 2000 peak' },
    { year: '2025', date: '22 SEP', label: 'Nvidia–OpenAI letter of intent: “up to $100B”' },
    { year: '2026', date: '17 AUG', label: 'Nvidia guarantees up to $105B of OpenAI’s leases' },
    { year: '2026', date: '6 OCT', label: 'Nasdaq record close: 27,599.79' },
    { year: '2026', date: '14–16 OCT', label: 'AI selloff: Nasdaq −4.5% in a week', red: true },
  ];
  const yearNum = (y) => parseInt(String(y), 10);
  async function timeline(ctx, shot) {
    const Pm = shot.params ?? {};
    const ev = (Pm.events ?? EVENTS).map(e => (typeof e === 'object' ? e : EVENTS.find(x => String(x.year) === String(e) || `${x.date} ${x.year}` === String(e)) ?? { year: String(e), label: '' }));
    const D = shot.duration ?? 8, n = ev.length, sp = Pm.spacing ?? (n > 1 ? Math.min(330, 1450 / (n - 1)) : 0), X = (i) => 960 - sp * (n - 1) / 2 + i * sp;
    const fi = (f) => { if (f == null) return null; const s = String(f); const i = ev.findIndex(e => `${e.date ?? ''} ${e.year}`.trim() === s || e.label === s); return i >= 0 ? i : (j => (j < 0 ? null : j))(ev.findIndex(e => String(e.year) === s)); };
    const hasF = Pm.focus != null, focus = hasF ? (Array.isArray(Pm.focus) ? Pm.focus.map(fi) : [fi(Pm.focus), fi(Pm.focus)]) : [null, null];
    const T = hasF && !ev.some(e => e.word) ? ev.map((_, i) => 0.15 + i * 0.08) : G.cues(shot, ev, { from: 0.3, span: Math.min(D * 0.62, Math.max(0.6 * (n - 1), D - 2.4)) });
    const lw = Math.min(320, sp * 1.8);
    const lo = Math.min(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1), hi = Math.max(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      k.view(1);
      const y = 590;
      // the axis: a navy ledger rule with fine ticks, drawn on as the events arrive
      const reach = Math.max(...ev.map((e, i) => (t >= T[i] - 0.4 ? X(i) + sp * 0.6 * E.outCubic(range(t, T[i] - 0.4, T[i] + 0.2)) : 0)), X(0));
      g.save(); g.beginPath(); g.rect(-200, 0, reach + 200, 1080); g.clip();
      g.fillStyle = P.ink; g.fillRect(-200, y - 3, 2320, 6);
      for (let x = -200; x < 2120; x += 24) { g.fillStyle = P.rule; g.fillRect(x, y + 10, 2, 10); }
      g.restore();
      ev.forEach((e, i) => {
        const kk = range(t, T[i] - 0.4, T[i] + 0.4); if (kk <= 0) return;
        const x = X(i), up = i % 2 === 0;
        const act = !hasF || (i >= lo && i <= hi), red = hasF ? act : !!e.red, col = red ? P.red : P.ink;
        // a gap marker on the axis where years are skipped
        if (i > 0 && yearNum(e.year) - yearNum(ev[i - 1].year) > (Pm.gapYears ?? 4)) { const bx = x - sp / 2; g.save(); g.strokeStyle = P.paper; g.lineWidth = 10; g.beginPath(); g.moveTo(bx - 12, y + 22); g.lineTo(bx + 2, y - 22); g.moveTo(bx + 6, y + 22); g.lineTo(bx + 20, y - 22); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 14, y + 22); g.lineTo(bx, y - 22); g.moveTo(bx + 8, y + 22); g.lineTo(bx + 22, y - 22); g.stroke(); g.restore(); }
        g.save(); g.globalAlpha = act ? 1 : 0.38;
        const stem = 96 * E.outCubic(kk); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, up ? y - stem : y + stem); g.stroke();
        G.pin(g, x, y, t, kk, { color: red ? P.red : P.teal, r: 11, pulse: red });
        const ys = String(e.year), ysz = Math.min(80, sp * 0.5), ty = up ? y - 126 : y + 128 + ysz * 0.72;
        if (e.date) G.text(g, e.date, x, ty - ysz * 0.86, { size: 20, weight: 500, fam: F.mono, align: 'center', color: red ? P.red : P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, T[i] - 0.1, T[i] + 0.4)) });
        G.riseText(g, ys, x, ty, kk, { size: ysz, weight: 500, fam: F.mono, align: 'center', color: col, track: -0.04 });
        const lines = G.wrap(g, e.label, lw, 26, 700);
        const top = up ? ty - ysz * 0.86 - (e.date ? 34 : 4) - 14 - (lines.length - 1) * 32 : ty + 44;
        lines.forEach((l, j) => G.text(g, l, x, top + j * 32, { size: 26, weight: 700, align: 'center', color: P.ink, alpha: E.outCubic(range(t, T[i], T[i] + 0.6)) }));
        g.restore();
      });
      k.flat(); G.kicker(g, Pm.title ?? 'TWO BOOMS · 2000 – 2026', 120, 110, range(t, 0, 0.6));
      G.source(g, Pm.source ?? 'SOURCES: YAHOO FINANCE PRICE HISTORY; LUCENT 10-K (2001); NORTEL (2009); NVIDIA PR & 8-K; AP (16 OCT 2026)', range(t, 0.6, 1.4));
    }, { push: 0.03, dx: 30 });
  }

  return { title, chapter, quote, bignumber, counter, timeline };
}
