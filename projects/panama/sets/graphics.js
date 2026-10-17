// Panama bright graphics (episode 5, "The Canal That Runs on Rain"): cards and data sets painted on a 2D canvas.
//   counter    the slot-auction flip board                     graphics.js
//   bignumber  a generic big-number card                       graphics.js
//   slots      the daily slot board (36 ship icons)            graphics.js
//   timeline   horizontal bright timeline                      graphics.js
//   budget     the daily water budget / "each foot" card       graphics.js
//   countdown  calendar Oct 2026 -> Apr 2027, dry season       graphics.js
//   quote      bright quote card                               graphics.js
//   chapter    chapter card with the water-level wipe          graphics.js
//   title      the episode title card (rain on the lake)       graphics.js
//   money      revenue / treasury, US share, transits          graphics.js
// Params for every set: projects/panama/SETS-graphics.md. Every number on screen comes from RESEARCH.md.
// Format: makeGraphics(H) -> { name: async (ctx, shot) => ({ scene, camera, layer, canvas, update(t, p) }) }.
import * as G from './graphics-kit.js';
import * as M from '/engine/motion.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

export default function makeGraphics(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ================================================================ counter: the auction flip board
  const AUCTION = [
    { value: 55000, label: 'A NORMAL WINNING BID', sub: 'MEDIAN, OCT 2025 – FEB 2026 · BLOOMBERG', word: null },
    { value: 3975000, label: 'NOV 2023 · THE DROUGHT RECORD', sub: 'ENEOS · LPG CARRIER SUNNY BRIGHT', word: null },
    { value: 4600000, label: 'AUG 2026', sub: 'SK SHIPPING · G. ARETE · VIA BLOOMBERG', word: null },
    { value: 5300000, label: 'AUG 2026 · NEW RECORD', sub: 'VIA BLOOMBERG; CONFIRMED BY THE ACP ADMINISTRATOR', word: null, record: true },
  ];
  async function counter(ctx, shot) {
    const Pm = shot.params ?? {}, steps = Pm.steps ?? AUCTION, D = shot.duration ?? 10;
    const T = G.cues(shot, steps, { from: 0.35, span: Math.max(1.2 * (steps.length - 1), D * 0.62) });
    const N = 7; // digit reels: up to 9,999,999
    const digitsOf = (v) => String(Math.round(v)).padStart(N, ' ').split('');
    const multAt = Pm.multiple === false ? Infinity : G.cue(shot, Pm.multipleAt, T.at(-1) + 1.4);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.7);
      G.kicker(g, Pm.kicker ?? 'PANAMA CANAL · TRANSIT SLOT AUCTION', 150, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'The price of one place in line', 150, 238, range(t, 0.15, 1.0), { size: 76, weight: 800 });
      k.view(1);
      // which step is showing
      let si = 0; for (let i = 0; i < steps.length; i++) if (t >= T[i]) si = i;
      const cur = steps[si], prev = steps[Math.max(0, si - 1)], tc = T[si];
      const from = si === 0 ? digitsOf(0).map(() => ' ') : digitsOf(prev.value), to = digitsOf(cur.value);
      // board
      const tw = 150, th = 214, gap = 14, cw = 56, x0 = 960 - (tw * (N + 1) + gap * N + cw * 2) / 2, y0 = 360;
      G.card(g, x0 - 46, y0 - 46, (tw * (N + 1) + gap * N + cw * 2) + 92, th + 92, { r: 34, fill: P.ink, lift: 1.4, grainA: 0 });
      let x = x0;
      const tile = (ch, i, stopAt, roll) => {
        G.rr(g, x, y0, tw, th, 16); const gr = g.createLinearGradient(0, y0, 0, y0 + th); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#efe9de');
        g.fillStyle = gr; g.fill();
        g.save(); G.rr(g, x, y0, tw, th, 16); g.clip();
        if (ch === '$') G.text(g, '$', x + tw / 2, y0 + th * 0.74, { size: 150, weight: 800, align: 'center', color: cur.record && t > tc + 1.6 ? P.red : P.ink });
        else if (roll) {
          const { pos, blur } = roll;
          for (let j = -1; j <= 1; j++) {
            const d = ((Math.floor(pos) + j) % 11 + 11) % 11, off = (pos - Math.floor(pos) - j) * th;
            const s = d === 10 ? '' : String(d);
            G.text(g, s, x + tw / 2, y0 + th * 0.76 - off, { size: 158, weight: 800, align: 'center', color: P.ink, alpha: blur ? 0.55 : 1 });
          }
        } else if (ch !== ' ') G.text(g, ch, x + tw / 2, y0 + th * 0.76, { size: 158, weight: 800, align: 'center', color: cur.record && t > stopAt + 0.3 ? P.red : P.ink });
        g.restore();
        // split line and hinge pins (flip-board)
        g.fillStyle = 'rgba(27,36,48,0.22)'; g.fillRect(x, y0 + th / 2 - 1.5, tw, 3);
        g.fillStyle = P.ink; g.fillRect(x - 3, y0 + th / 2 - 9, 6, 18); g.fillRect(x + tw - 3, y0 + th / 2 - 9, 6, 18);
        x += tw + gap;
      };
      tile('$', -1);
      for (let i = 0; i < N; i++) {
        const stopAt = tc + 0.55 + i * 0.13, spinning = t >= tc && t < stopAt && from[i] !== to[i];
        let roll = null;
        if (spinning) { // reel: from digit a, spin 2 turns, land on b (blank = 10)
          const a = from[i] === ' ' ? 10 : +from[i], b = to[i] === ' ' ? 10 : +to[i];
          const dist = 22 + ((b - a) % 11 + 11) % 11, u = E.outCubic(range(t, tc, stopAt));
          roll = { pos: a + dist * u, blur: u < 0.8 };
        }
        tile(t < tc ? (si === 0 ? ' ' : to[i]) : (spinning ? null : to[i]), i, stopAt, roll);
        if (i === 0 || i === 3) { // comma slots
          const show = to[i] !== ' ' && t >= tc + 0.55 + i * 0.13;
          G.text(g, ',', x - gap + cw / 2, y0 + th * 0.86, { size: 120, weight: 800, align: 'center', color: P.white, alpha: show ? 1 : 0.18 });
          x += cw;
        }
      }
      // the label under the board
      const kl = range(t, tc + 0.35, tc + 1.2);
      G.riseText(g, cur.label, 960, 760, kl, { size: 58, weight: 800, align: 'center', color: cur.record ? P.red : P.ink, track: 0.01 });
      if (cur.sub) G.text(g, cur.sub, 960, 812, { size: 26, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.12, alpha: E.outCubic(range(t, tc + 0.7, tc + 1.4)) });
      // the ladder of earlier prices (chips), left to right
      const lx = 960 - (steps.length * 300) / 2;
      steps.forEach((st, i) => {
        if (t < T[i] + 0.6) return; const kk = range(t, T[i] + 0.6, T[i] + 1.1);
        G.pill(g, `$${G.fmt(st.value)}`, lx + i * 300 + 150, 900, { size: 30, align: 'center', k: kk, dot: i === si ? P.red : P.inkFaint, fill: i === si ? P.sunSoft : P.white });
      });
      if (cur.record && t > tc + 1.4) { // red RECORD stamp
        const ks = E.outBack(range(t, tc + 1.4, tc + 1.8));
        g.save(); g.translate(1580, 330); g.rotate(-0.12); g.scale(ks, ks); G.slab(g, 'RECORD', 0, 0, { size: 40, fill: P.red, align: 'center' }); g.restore();
      }
      if (t > multAt && steps.at(-1).value === 5300000) {
        G.pill(g, '≈ 96 × THE USUAL PRICE · OUR MATH', 960, 990, { size: 30, align: 'center', k: range(t, multAt, multAt + 0.5), fill: P.ink, color: P.white, dot: P.sun });
      }
      k.flat(); G.source(g, Pm.source ?? 'SOURCES: BLOOMBERG (VIA MARITIME EXECUTIVE, FORTUNE); EFE', range(t, 0.8, 1.6), { y: 1050, size: 18 });
    }, { push: 0.035 });
  }

  // ================================================================ bignumber: a generic big-number card
  async function bignumber(ctx, shot) {
    const Pm = shot.params ?? {}, v = Pm.value ?? 0, dec = Pm.decimals ?? (Number.isInteger(v) ? 0 : 1);
    const t0 = G.cue(shot, Pm.at ?? Pm.word, 0.35), dur = Pm.roll ?? 1.6, from = Pm.from ?? 0;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.6); G.water(g, -100, 2020, 900, 1200, t, { amp: 8, glints: 8 });
      k.view(1);
      G.card(g, 140, 170, 1640, 640, { r: 36, lift: 1.3 });
      G.kicker(g, Pm.kicker ?? '', 220, 270, range(t, 0.05, 0.6));
      const u = E.outExpo(range(t, t0, t0 + dur)), val = lerp(from, v, u);
      const s = (Pm.prefix ?? '') + G.fmt(val, dec) + (Pm.suffix ?? '');
      const size = Pm.size ?? (s.length > 9 ? 230 : 290);
      G.text(g, s, 210, 560, { size, weight: 900, color: Pm.red ? P.red : P.ink, track: -0.02, alpha: sstep(t0 - 0.05, t0 + 0.15, t), maxW: 1500 });
      if (Pm.unit) G.text(g, Pm.unit, 220, 640, { size: 44, weight: 700, color: P.inkSoft, alpha: E.outCubic(range(t, t0 + 0.4, t0 + 1)) });
      const lines = G.wrap(g, Pm.label ?? '', 1450, 50, 700);
      lines.forEach((l, i) => G.riseText(g, l, 220, (Pm.unit ? 712 : 680) + i * 62, range(t, t0 + 0.5 + i * 0.12, t0 + 1.3 + i * 0.12), { size: 50, weight: 700 }));
      if (Pm.note) G.pill(g, Pm.note, 1700, 230, { size: 26, align: 'right', k: range(t, t0 + 1, t0 + 1.5), fill: P.sunSoft, dot: P.red });
      k.flat(); G.source(g, Pm.source, range(t, 0.6, 1.4));
    });
  }

  // ================================================================ slots: the daily slot board
  const SLOTS = {
    2023: [{ n: 36, date: 'NORMAL', note: 'TYPICAL DAILY LIMIT' }, { n: 32, date: '30 JUL 2023' }, { n: 24, date: '8 NOV 2023' }, { n: 22, date: 'DEC 2023', note: 'THE LOWEST ACTUALLY REACHED' }],
    2026: [{ n: 36, date: 'NORMAL', note: '10 NEOPANAMAX + 26 PANAMAX' }, { n: 34, date: '4 SEP 2026' }, { n: 32, date: '15 SEP 2026' }, { n: 33, date: '15 OCT 2026', note: 'ONE SLOT RESTORED' }],
  };
  async function slots(ctx, shot) {
    const Pm = shot.params ?? {}, yr = Pm.year ?? 2023, steps = Pm.steps ?? SLOTS[yr] ?? SLOTS[2023], D = shot.duration ?? 10;
    const T = G.cues(shot, steps, { from: 0.4, span: Math.max(1.4 * (steps.length - 1), D * 0.66) });
    const total = 36, cols = 12, cw = 128, ch = 112, gx = 960 - (cols * cw) / 2 + cw / 2, gy = 400;
    // the time each slot index is removed / restored: slot i exists when i < n(t)
    const nAt = (t) => { let n = steps[0].n; for (let i = 0; i < steps.length; i++) if (t >= T[i]) n = steps[i].n; return n; };
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? (yr === 2026 ? 'PANAMA CANAL · 2026' : 'PANAMA CANAL · THE 2023 DROUGHT'), 150, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Ships allowed through, per day', 150, 224, range(t, 0.15, 1), { size: 70, weight: 800 });
      G.card(g, 110, 290, 1700, 480, { r: 30, lift: 1 });
      // grid
      for (let i = 0; i < total; i++) {
        const c = i % cols, r = Math.floor(i / cols), x = gx + c * cw, y = gy + r * ch + 40;
        // dashed empty berth
        g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(27,36,48,0.22)'; g.lineWidth = 2.5; G.rr(g, x - 52, y - 40, 104, 70, 12); g.stroke(); g.restore();
        // when did this slot last change?
        let present = i < steps[0].n, tChange = -9, removed = false;
        for (let s = 1; s < steps.length; s++) { if (t < T[s]) break; const was = i < steps[s - 1].n, is = i < steps[s].n; if (was !== is) { tChange = T[s] + (was ? (steps[s - 1].n - 1 - i) : (i - steps[s - 1].n)) * 0.09; removed = was; } present = is; }
        const u = range(t, tChange, tChange + 0.75);
        if (present && (!removed || u >= 1)) {
          const pop = tChange > 0 && !removed ? E.outBack(u) : 1, intro = E.outBack(range(t, 0.3 + i * 0.025, 0.75 + i * 0.025));
          const sc = pop * intro; if (sc <= 0) continue;
          g.save(); g.translate(x, y); g.scale(sc, sc);
          if (tChange > 0 && !removed && u < 1) { g.fillStyle = `rgba(255,210,63,${0.6 * (1 - u)})`; g.beginPath(); g.arc(0, -8, 64, 0, TAU); g.fill(); }
          G.ship(g, 0, 10, 96, { seed: i * 7 + 3 }); g.restore();
        } else if (removed && u < 1) { // drops out: lifts, tips, falls and fades, with a red flash
          const fall = E.inCubic(u);
          g.save(); g.translate(x + fall * 30, y + fall * 160 - Math.sin(u * Math.PI) * 20); g.rotate(fall * 0.7); g.globalAlpha = 1 - fall;
          g.fillStyle = `rgba(224,36,27,${0.3 * (1 - u)})`; g.beginPath(); g.arc(0, -8, 60, 0, TAU); g.fill();
          G.ship(g, 0, 10, 96, { seed: i * 7 + 3 }); g.restore();
        }
      }
      // the counter
      const n = nAt(t), si = steps.reduce((a, s, i) => (t >= T[i] ? i : a), 0), tc = T[si];
      const bump = si > 0 ? 1 + 0.1 * Math.sin(Math.PI * range(t, tc, tc + 0.4)) : 1;
      g.save(); g.translate(250, 920); g.scale(bump, bump);
      G.text(g, String(n), 0, 40, { size: 200, weight: 900, color: si > 0 && steps[si].n < steps[si - 1].n ? P.red : P.ink, align: 'center' }); g.restore();
      G.text(g, 'SLOTS / DAY', 250, 1010, { size: 26, weight: 700, color: P.inkSoft, align: 'center', track: 0.1 });
      // step chips
      steps.forEach((st, i) => {
        const x = 520 + i * 330, act = i === si, kk = range(t, T[i], T[i] + 0.4);
        if (kk <= 0) return;
        G.pill(g, `${st.n} · ${st.date}`, x, 890, { size: 30, k: kk, fill: act ? P.ink : P.white, color: act ? P.white : P.ink, dot: act ? (i && st.n < steps[i - 1].n ? P.red : P.sun) : P.inkFaint });
        if (act && st.note) G.text(g, st.note, x + 6, 958, { size: 22, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, T[i] + 0.3, T[i] + 0.9)) });
      });
      k.flat(); G.source(g, Pm.source ?? (yr === 2026 ? 'SOURCE: ACP ADVISORIES A-29-2026, A-36-2026 · BOOKING SLOTS' : 'SOURCES: ACP; EIA; NASA EARTH OBSERVATORY'), range(t, 0.6, 1.4), { y: 1052, size: 18 });
    }, { push: 0.03 });
  }

  // ================================================================ timeline
  const EVENTS = [
    { year: 1881, label: 'French dig begins' }, { year: 1889, label: 'French company bankrupt' },
    { year: 1904, label: 'United States takes over' }, { year: 1906, label: 'Senate picks locks, 36–31' },
    { year: 1913, label: 'Gamboa dike blown' }, { year: 1914, label: 'SS Ancon: first official transit' },
    { year: 1977, label: 'Torrijos–Carter Treaties' }, { year: 1999, label: 'Canal handed to Panama' },
    { year: 2016, label: 'Bigger locks open · record-low lake' }, { year: 2023, label: 'Drought: 36 → 22 ships a day' },
    { year: 2026, label: '$5.3M for one slot' }, { year: 2028, label: 'Río Indio works due to start' },
  ];
  async function timeline(ctx, shot) {
    const Pm = shot.params ?? {}, ev = (Pm.events ?? EVENTS).map(e => (typeof e === 'number' ? EVENTS.find(x => x.year === e) ?? { year: e, label: '' } : e));
    const D = shot.duration ?? 8, n = ev.length, sp = 330, X = (i) => 260 + i * sp, total = X(n - 1) + 260;
    const fi = (f) => { if (f == null) return null; const i = ev.findIndex(e => e.year === f || e.label === f); return i < 0 ? null : i; };
    const focus = Array.isArray(Pm.focus) ? Pm.focus.map(fi) : [fi(Pm.focus), fi(Pm.focus)];
    const T = G.cues(shot, ev, { from: 0.3, span: D * 0.7 });
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      // pan: keep the focus centred (or travel the whole line)
      const f0 = focus[0] ?? 0, f1 = focus[1] ?? (focus[0] == null ? n - 1 : focus[0]);
      const centre = lerp(X(f0), X(f1), E.inOutSine(range(t, 0.2, D - 0.6)));
      const off = clamp(960 - centre, 1920 - total - 60, 60);
      const u = E.inOutSine(range(t, 0, D)); k.view(1);
      g.save(); g.translate(off - u * 30, 0);
      // the axis: a turquoise water line with a gauge edge
      const y = 600;
      const reach = Math.max(...ev.map((e, i) => (t >= T[i] - 0.4 ? X(i) : 0)), X(f0) + 400) + 200;
      g.save(); g.beginPath(); g.rect(-400, 0, reach + 400, 1080); g.clip();
      G.shadow(g, 0.6); G.rr(g, -400, y - 14, total + 800, 28, 14); g.fillStyle = P.water; g.fill(); G.noShadow(g);
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-400, y - 8, total + 800, 5);
      g.restore();
      ev.forEach((e, i) => {
        const kk = range(t, T[i] - 0.4, T[i] + 0.4); if (kk <= 0) return;
        const x = X(i), up = i % 2 === 0, act = focus[0] != null ? (i >= Math.min(focus[0], focus[1] ?? focus[0]) && i <= Math.max(focus[0], focus[1] ?? focus[0])) : true;
        const col = act && (focus[0] != null) ? P.red : P.ink, alpha = act ? 1 : 0.45;
        // gap marker (break in time) when years jump
        if (i > 0 && e.year - ev[i - 1].year > 40) { g.save(); g.strokeStyle = P.paper; g.lineWidth = 9; g.beginPath(); g.moveTo(x - sp / 2 - 10, y + 24); g.lineTo(x - sp / 2 + 4, y - 24); g.moveTo(x - sp / 2 + 6, y + 24); g.lineTo(x - sp / 2 + 20, y - 24); g.stroke(); g.restore(); }
        g.save(); g.globalAlpha = alpha;
        const stem = 120 * E.outCubic(kk); g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, up ? y - stem : y + stem); g.stroke();
        G.pin(g, x, y, t, kk, { color: col, r: 12, pulse: act && focus[0] != null });
        const ty = up ? y - 150 : y + 230;
        G.riseText(g, String(e.year), x, ty, kk, { size: 96, weight: 900, align: 'center', color: col });
        const lines = G.wrap(g, e.label, 300, 32, 700);
        lines.forEach((l, j) => G.text(g, l, x, ty + (up ? -112 - (lines.length - 1 - j) * 40 : 52 + j * 40), { size: 32, weight: 700, align: 'center', color: P.ink, alpha: E.outCubic(range(t, T[i], T[i] + 0.6)) }));
        g.restore();
      });
      g.restore();
      k.flat(); G.kicker(g, Pm.title ?? 'THE PANAMA CANAL, 1881 – 2028', 120, 110, range(t, 0, 0.6));
      G.source(g, Pm.source ?? 'SOURCES: ACP; US STATE DEPARTMENT; RPI; BLOOMBERG', range(t, 0.6, 1.4), { size: 18, y: 1052 });
    }, { push: 0.03, dx: 0 });
  }

  // ================================================================ budget: the daily water budget, and "each foot" card
  async function budget(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    if (Pm.mode === 'foot') return foot(ctx, shot);
    const tIn = G.cue(shot, Pm.inAt, 0.5), tOct = G.cue(shot, Pm.octAt, 1.5), tOut = G.cue(shot, Pm.outAt, 2.6), tDef = G.cue(shot, Pm.deficitAt, Math.min(D - 2.5, 3.8));
    const S = 26, base = 880, bw = 260; // px per million m3
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'GATUN LAKE · DAILY WATER BUDGET · OCT 2023', 150, 140, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Water in vs water out, per day', 150, 222, range(t, 0.15, 1), { size: 68, weight: 800 });
      G.text(g, 'MILLION m³ PER DAY', 150, 280, { size: 24, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12, alpha: E.outCubic(range(t, 0.4, 1)) });
      // axis
      g.fillStyle = P.ink; g.fillRect(150, base, 1620, 4);
      for (let v = 0; v <= 15; v += 5) { const yy = base - v * S; g.fillStyle = P.rule; g.fillRect(150, yy, 1620, 2); G.text(g, String(v), 132, yy + 10, { size: 26, weight: 600, align: 'right', color: P.inkSoft }); }
      const bar = (x, v, k2, { ghost = false, color = P.water, deep = P.waterDeep, label, sub, valLabel, red = false } = {}) => {
        if (k2 <= 0) return; const h = v * S * E.outCubic(k2), top = base - h;
        if (ghost) { g.save(); g.setLineDash([12, 9]); g.strokeStyle = P.inkSoft; g.lineWidth = 3.5; G.rr(g, x, top, bw, h, 14); g.stroke(); g.restore(); }
        else { g.save(); G.rr(g, x, top, bw, h + 2, 14); g.clip(); G.water(g, x - 20, x + bw + 20, top + 6, base + 10, t, { amp: 5, len: 120, color, deep, back: color, lift: 0, glints: 3, seed: x }); g.restore(); }
        G.text(g, valLabel ?? G.fmt(v * E.outCubic(k2), 0), x + bw / 2, top - 22, { size: 64, weight: 900, align: 'center', color: red ? P.red : P.ink, alpha: clamp(k2 * 2) });
        if (label) G.text(g, label, x + bw / 2, base + 52, { size: 30, weight: 800, align: 'center', alpha: clamp(k2 * 2) });
        if (sub) G.text(g, sub, x + bw / 2, base + 88, { size: 22, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.08, alpha: clamp(k2 * 2) });
      };
      // IN
      G.text(g, 'WATER IN', 625, 350, { size: 40, weight: 900, color: P.waterDark, alpha: range(t, tIn, tIn + 0.4), align: 'center' });
      bar(330, 15, range(t, tIn, tIn + 1.2), { ghost: true, label: 'NORMAL YEAR', sub: 'TYPICAL INFLOW' });
      bar(330 + bw + 30, 7, range(t, tOct, tOct + 1.2), { label: 'OCT 2023', sub: 'ACTUAL INFLOW', red: false });
      // OUT
      G.text(g, 'WATER OUT', 1395, 350, { size: 40, weight: 900, color: P.inkSoft, alpha: range(t, tOut, tOut + 0.4), align: 'center' });
      bar(1265, 10, range(t, tOut, tOut + 1.2), { color: '#b4c6cf', deep: '#8fa6b2', label: 'OCT 2023', sub: 'LOCKS, TAPS, EVAPORATION…' });
      // deficit bracket between 7 and 10
      const kd = range(t, tDef, tDef + 0.8);
      if (kd > 0) {
        const y7 = base - 7 * S, y10 = base - 10 * S, x = 1180;
        g.save(); g.globalAlpha = clamp(kd * 2); g.strokeStyle = P.red; g.lineWidth = 5; g.setLineDash([10, 8]);
        g.beginPath(); g.moveTo(330 + bw * 2 + 30, y7); g.lineTo(1265, y7); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.moveTo(x, y7); g.lineTo(x, lerp(y7, y10, E.outCubic(kd))); g.stroke();
        g.fillStyle = P.red; g.globalAlpha = 0.16 * kd; g.fillRect(1265, y10, bw, y7 - y10); g.restore();
        G.pill(g, '−3 MILLION m³ EVERY DAY', 1265 + bw / 2, y10 - 140, { size: 34, align: 'center', k: range(t, tDef + 0.3, tDef + 0.9), fill: P.red, color: P.white, weight: 900 });
      }
      k.flat(); G.source(g, Pm.source ?? 'SOURCE: PANAMA CANAL AUTHORITY, 3 OCT 2023', range(t, 0.6, 1.4));
    }, { push: 0.03 });
  }
  // "each foot of lake ≈ 650 crossings" (OUR MATH, RESEARCH C4)
  async function foot(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 8, t0 = G.cue(shot, Pm.at, 0.4), dur = Math.min(3.2, D * 0.45);
    const cols = 50, rows = 13, n = 650;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g); k.view(1);
      G.kicker(g, 'GATUN LAKE · OUR MATH', 150, 140, range(t, 0.05, 0.6));
      G.riseText(g, 'One foot of lake ≈', 150, 236, range(t, 0.1, 0.9), { size: 84, weight: 800 });
      const u = E.inOutSine(range(t, t0, t0 + dur)), cnt = Math.round(n * u);
      const fx = 170 + G.measure(g, 'One foot of lake ≈', 84, 800);
      G.text(g, G.fmt(cnt), fx, 236, { size: 110, weight: 900, color: P.red, alpha: range(t, t0 - 0.1, t0 + 0.2) });
      G.text(g, 'ship crossings', fx + G.measure(g, G.fmt(Math.max(cnt, 650)), 110, 900) + 26, 236, { size: 56, weight: 800, alpha: range(t, t0 + 0.2, t0 + 0.8) });
      // a one-foot slab of lake (cross-section) filled by ship dots
      const x0 = 150, y0 = 340, w = 1620, h = 520;
      G.card(g, x0, y0, w, h, { r: 26, fill: P.white, lift: 1 });
      g.save(); G.rr(g, x0, y0, w, h, 26); g.clip(); G.water(g, x0 - 20, x0 + w + 20, y0 + 40, y0 + h + 10, t, { amp: 6, lift: 0, glints: 12 }); g.restore();
      const cw = (w - 120) / cols, chh = (h - 120) / rows;
      for (let i = 0; i < cnt; i++) {
        const c = i % cols, r = Math.floor(i / cols), x = x0 + 60 + c * cw + cw / 2, y = y0 + 84 + r * chh + chh / 2;
        G.shipTop(g, x, y, cw * 0.82, 0, { color: P.white, edge: P.waterDark });
      }
      // the 1 ft dimension
      g.fillStyle = P.ink; g.fillRect(x0 + w + 26, y0 + 40, 4, h - 40); g.fillRect(x0 + w + 16, y0 + 40, 24, 4); g.fillRect(x0 + w + 16, y0 + h - 4, 24, 4);
      G.text(g, '1 FT', x0 + w + 46, y0 + h / 2 + 14, { size: 34, weight: 900 });
      G.text(g, Pm.note ?? '425 km² × 1 ft ≈ 129.5 million m³  ÷  ~197,000 m³ per Panamax crossing (52M gal)  ≈ 658', 150, 930, { size: 28, weight: 600, color: P.inkSoft, alpha: E.outCubic(range(t, t0 + dur * 0.6, t0 + dur)) });
      G.pill(g, 'OUR MATH · IGNORES RAIN, DRINKING WATER, EVAPORATION', 150, 990, { size: 24, k: range(t, t0 + dur * 0.8, t0 + dur + 0.4), fill: P.sunSoft, dot: P.red });
      k.flat(); G.source(g, 'INPUTS: ACP; LINDA HALL LIBRARY; UNIV. OF FLORIDA', range(t, 0.6, 1.4), { y: 1052, size: 18 });
    }, { push: 0.03 });
  }

  // ================================================================ countdown: Oct 2026 -> Apr 2027
  async function countdown(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const today = new Date(Pm.today ?? '2026-10-17T12:00:00Z'), dry0 = new Date(Pm.dryStart ?? '2027-01-01T12:00:00Z');
    const months = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.UTC(2026, 9 + i, 1, 12)); months.push(d); }
    const days = Math.round((dry0 - today) / 864e5);
    const tick0 = G.cue(shot, Pm.at, 0.8), tickDur = Math.min(Pm.tick ?? 4.2, D - tick0 - 1);
    const pins = Pm.pins ?? [{ date: '2026-12-17', label: '85.5 FT · ACP PROJECTION' }];
    const MN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g); k.view(1);
      G.kicker(g, Pm.kicker ?? 'THE COUNTDOWN · AS OF 17 OCT 2026', 120, 130, range(t, 0.05, 0.6));
      const u = E.inOutSine(range(t, tick0, tick0 + tickDur));
      const shown = Math.round(days * u);
      G.text(g, String(shown), 120, 300, { size: 170, weight: 900, color: P.red });
      G.text(g, 'DAYS UNTIL THE DRY SEASON', 140 + G.measure(g, String(Math.max(shown, 10)), 170, 900), 290, { size: 46, weight: 800, alpha: E.outCubic(range(t, 0.3, 1)) });
      // month cards
      const mw = 236, gap = 14, x0 = 960 - (7 * mw + 6 * gap) / 2, y0 = 380, cell = 30;
      const sweep = new Date(today.getTime() + u * (dry0 - today));
      months.forEach((m, i) => {
        const x = x0 + i * (mw + gap), mon = m.getUTCMonth(), yr = m.getUTCFullYear(), dry = yr === 2027 && mon <= 3;
        const kk = range(t, 0.15 + i * 0.07, 0.6 + i * 0.07); if (kk <= 0) return;
        g.save(); g.globalAlpha = clamp(kk * 2); g.translate(0, (1 - E.outCubic(kk)) * 40);
        G.card(g, x, y0, mw, 380, { r: 18, fill: dry ? P.sand : P.card, lift: dry ? 1.2 : 0.8 });
        G.text(g, MN[mon], x + 20, y0 + 52, { size: 40, weight: 900, color: dry ? '#8a5a12' : P.ink });
        G.text(g, String(yr), x + mw - 18, y0 + 50, { size: 22, weight: 600, align: 'right', color: P.inkSoft });
        const first = (new Date(Date.UTC(yr, mon, 1)).getUTCDay() + 6) % 7, nd = new Date(Date.UTC(yr, mon + 1, 0)).getUTCDate();
        for (let d = 1; d <= nd; d++) {
          const j = first + d - 1, cx = x + 20 + (j % 7) * cell + cell / 2, cy = y0 + 92 + Math.floor(j / 7) * 44 + 20;
          const date = new Date(Date.UTC(yr, mon, d, 12)), isToday = +date === +today;
          const passed = date > today && date <= sweep, before = date < today;
          if (passed) { g.fillStyle = P.red; g.globalAlpha = 0.9; g.beginPath(); g.arc(cx, cy - 8, 12, 0, TAU); g.fill(); g.globalAlpha = 1; }
          if (isToday) { g.strokeStyle = P.red; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy - 8, 16, 0, TAU); g.stroke(); }
          G.text(g, String(d), cx, cy, { size: 19, weight: 700, align: 'center', color: passed ? P.white : before ? P.inkFaint : dry ? '#7b5410' : P.ink });
        }
        if (dry) { // sun mark
          const sx = x + mw - 40, sy = y0 + 345, rs = 14 + Math.sin(t * 2 + i) * 1.5;
          g.fillStyle = P.sun; g.beginPath(); g.arc(sx, sy, rs, 0, TAU); g.fill();
          g.strokeStyle = P.sun; g.lineWidth = 3; for (let a = 0; a < 8; a++) { const an = a / 8 * TAU + t * 0.3; g.beginPath(); g.moveTo(sx + Math.cos(an) * (rs + 5), sy + Math.sin(an) * (rs + 5)); g.lineTo(sx + Math.cos(an) * (rs + 13), sy + Math.sin(an) * (rs + 13)); g.stroke(); }
        }
        g.restore();
      });
      // dry season band label
      const kd = range(t, tick0 + tickDur * 0.9, tick0 + tickDur + 0.6);
      const dx0 = x0 + 3 * (mw + gap), dx1 = x0 + 7 * (mw + gap) - gap;
      if (kd > 0) {
        g.fillStyle = P.sandDeep; g.fillRect(dx0, y0 + 400, (dx1 - dx0) * E.outCubic(kd), 10);
        G.pill(g, 'DRY SEASON · JAN – APR 2027', (dx0 + dx1) / 2, y0 + 460, { size: 34, align: 'center', k: kd, fill: P.sun, dot: P.red, weight: 900 });
      }
      G.asOf(g, 'TODAY · 17 OCT 2026', x0, y0 - 36, range(t, 0.5, 1), { size: 24 });
      pins.forEach((pn, i) => {
        const d = new Date(pn.date + 'T12:00:00Z'), kk = range(t, G.cue(shot, pn.word, tick0 + tickDur * 0.55 + i * 0.3), G.cue(shot, pn.word, tick0 + tickDur * 0.55 + i * 0.3) + 0.5);
        const mi = (d.getUTCFullYear() - 2026) * 12 + d.getUTCMonth() - 9; if (mi < 0 || mi > 6) return;
        const x = x0 + mi * (mw + gap) + mw / 2;
        G.pill(g, pn.label, x, y0 + 460 + (kd > 0 && mi >= 3 ? 70 : 0), { size: 24, align: 'center', k: kk, fill: P.white, dot: P.waterDeep });
      });
      k.flat(); G.source(g, Pm.source ?? 'DRY SEASON: ACP ADVISORY A-29-2026 · PROJECTION: ACP, UPLOADED 13 OCT 2026', range(t, 0.6, 1.4), { size: 18, y: 1052 });
    }, { push: 0.035, dx: 40 });
  }

  // ================================================================ quote
  async function quote(ctx, shot) {
    const Pm = shot.params ?? {}, txt = String(Pm.text ?? ''), D = shot.duration ?? 7;
    const words = txt.split(/\s+/).filter(Boolean);
    const said = (shot.words ?? []).length ? M.wordTimes(shot, txt, { fallback: 0.5, gap: 0.16 }) : words.map((_, i) => 0.5 + i * Math.min(0.16, (D * 0.55) / words.length));
    const hl = (Pm.highlight ?? []).map(s => String(s).toLowerCase());
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.6); G.water(g, -100, 2020, 930 - 30 * E.inOutSine(clamp(t / D)), 1200, t, { amp: 7, glints: 6 });
      k.view(1);
      const size = Pm.size ?? (txt.length > 90 ? 70 : txt.length > 40 ? 88 : 124), maxW = 1320;
      const lines = []; let cur = [], cw = 0; const sp = G.measure(g, ' ', size, 400, F.serif);
      words.forEach((w, i) => { const ww = G.measure(g, w, size, 400, F.serif); if (cw + ww > maxW && cur.length) { lines.push(cur); cur = []; cw = 0; } cur.push({ w, i, ww }); cw += ww + sp; });
      if (cur.length) lines.push(cur);
      const lh = size * 1.12, h = lines.length * lh, top = 520 - h / 2 + size * 0.2;
      G.card(g, 170, top - size - 110, 1580, h + size * 0.75 + 300 + (Pm.role ? 40 : 0), { r: 34, lift: 1.3 });
      G.text(g, '“', 230, top - size * 0.15 + 70, { size: 260, weight: 400, fam: F.serif, color: P.red, alpha: E.outCubic(range(t, 0.05, 0.5)) });
      lines.forEach((ln, li) => {
        let x = 330; const y = top + li * lh + 40;
        ln.forEach(({ w, i, ww }) => {
          const tw = said[i] ?? 0.5, kk = range(t, tw - 0.05, tw + 0.35);
          if (hl.some(h => w.toLowerCase().replace(/[^a-z0-9.,$%]/g, '').startsWith(h))) { const kh = E.emphasized(range(t, tw + 0.1, tw + 0.6)); g.fillStyle = 'rgba(255,210,63,0.75)'; g.fillRect(x - 6, y - size * 0.62, (ww + 12) * kh, size * 0.72); }
          G.text(g, w, x, y + (1 - E.outCubic(kk)) * 16, { size, weight: 400, fam: F.serif, color: P.ink, alpha: kk });
          x += ww + sp;
        });
      });
      const tb = (said.at(-1) ?? 1) + 0.4, yb = top + h + 90;
      if (Pm.by) { g.fillStyle = P.red; g.fillRect(330, yb - 40, 56 * E.emphasized(range(t, tb, tb + 0.5)), 5); G.text(g, `— ${Pm.by}`, 330, yb + 6, { size: 38, weight: 800, alpha: E.outCubic(range(t, tb, tb + 0.6)) }); }
      if (Pm.role) G.text(g, Pm.role, 330, yb + 52, { size: 24, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, upper: true, alpha: E.outCubic(range(t, tb + 0.2, tb + 0.8)) });
      k.flat(); G.source(g, Pm.source, range(t, 0.6, 1.4));
    }, { push: 0.04 });
  }

  // ================================================================ chapter: the water-level wipe
  async function chapter(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 4, num = String(Pm.num ?? 1).padStart(2, '0');
    const title = String(Pm.title ?? 'Chapter'), sub = Pm.sub ?? '';
    const rise0 = 0.2, rise1 = Math.min(2.0, D * 0.5);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      // tide-gauge ticks on the right edge
      k.view(0.6);
      for (let i = 0; i <= 24; i++) { const y = 100 + i * 37; g.fillStyle = i % 4 === 0 ? P.ink : P.inkFaint; g.fillRect(1790, y, i % 4 === 0 ? 60 : 30, i % 4 === 0 ? 5 : 3); if (i % 4 === 0) G.text(g, String(90 - i / 2), 1780, y + 10, { size: 26, weight: 700, align: 'right', color: P.inkSoft }); }
      k.view(1);
      const level = lerp(1180, 600, E.emphasized(range(t, rise0, rise1)));
      const drawType = (col, numCol) => {
        G.text(g, 'CHAPTER', 160, 330, { size: 34, weight: 800, color: col, track: 0.24, alpha: E.outCubic(range(t, 0.1, 0.6)) });
        G.text(g, num, 140, 560, { size: 260, weight: 900, color: numCol, track: -0.03, alpha: E.outCubic(range(t, 0.1, 0.5)) });
        const lines = G.wrap(g, title, 1500, title.length > 22 ? 112 : 150, 900);
        lines.forEach((l, i) => G.riseText(g, l, 160, 720 + i * (title.length > 22 ? 118 : 150), range(t, 0.35 + i * 0.12, 1.2 + i * 0.12), { size: title.length > 22 ? 112 : 150, weight: 900, color: col, track: -0.01 }));
        if (sub) G.text(g, sub, 166, 720 + lines.length * (title.length > 22 ? 118 : 150) + 10, { size: 40, weight: 600, color: col, alpha: E.outCubic(range(t, 1.0, 1.7)) });
      };
      drawType(P.ink, P.red);
      g.save(); G.water(g, -100, 2020, level, 1300, t, { amp: 10, glints: 10 }); g.restore();
      // submerged type turns white
      g.save(); G.waterPath(g, -100, 2020, level, 1300, t, { amp: 10 }); g.clip(); drawType(P.white, P.white); g.restore();
    }, { push: 0.04 });
  }

  // ================================================================ title: rain on the lake
  async function title(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 6, lines = Pm.lines ?? ['THE CANAL', 'THAT RUNS', 'ON RAIN'];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.2);
      const sky = g.createLinearGradient(0, 0, 0, 760); sky.addColorStop(0, '#e9f1f2'); sky.addColorStop(1, P.paper); g.fillStyle = sky; g.fillRect(-200, -200, 2320, 1480);
      G.grain(g, 2320, 1480, 0.45, -200, -200);
      // paper clouds
      k.view(0.35);
      [[260, 170, 1.0], [900, 120, 1.25], [1560, 190, 0.9]].forEach(([x, y, s], i) => {
        const dx = (t * 6 * (i + 1)) % 60; g.save(); G.shadow(g, 0.6); g.fillStyle = '#ffffff';
        g.beginPath(); for (const [ox, oy, r] of [[-110, 20, 70], [-30, -20, 95], [70, 0, 80], [140, 30, 55], [0, 40, 75]]) { g.moveTo(x + dx + ox * s + r * s, y + oy * s); g.arc(x + dx + ox * s, y + oy * s, r * s, 0, TAU); } g.fill(); G.noShadow(g); g.restore();
      });
      // rain falling into the lake
      k.view(0.5); g.save(); g.beginPath(); g.rect(-200, 220, 2320, 600); g.clip(); rain(g, -200, 160, 2320, 640, t, { n: 220, color: 'rgba(79,169,171,0.45)', width: 2.2 }); g.restore();
      // type
      k.view(1);
      const size = 172, y0 = 360;
      lines.forEach((l, i) => {
        const red = i === lines.length - 1;
        G.riseText(g, l, 960, y0 + i * size * 0.98, range(t, 0.3 + i * 0.22, 1.3 + i * 0.22), { size, weight: 900, align: 'center', color: red ? P.red : P.ink, track: -0.015 });
      });
      // the lake, with ripples where drops land, and a ship crossing
      k.view(0.75);
      const lv = 860 - 18 * E.inOutSine(clamp(t / D));
      G.water(g, -200, 2120, lv, 1300, t, { amp: 6, glints: 14 });
      const r = rng(31);
      for (let i = 0; i < 26; i++) { const x = r() * 1920, ph = ((t * 0.55) + r()) % 1, y = lv + 40 + r() * 160;
        g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 8 + ph * 60, 3 + ph * 14, 0, 0, TAU); g.stroke(); }
      G.ship(g, -160 + ((t / Math.max(D, 4)) * 2200), lv + 4, 230, { seed: 5 });
      k.flat(); if (Pm.sub) G.text(g, Pm.sub, 960, 1040, { size: 26, weight: 500, fam: F.mono, align: 'center', color: P.white, track: 0.16, alpha: E.outCubic(range(t, 2, 2.6)) });
    }, { push: 0.05, dx: 0 });
  }
  const rain = G.rain;

  // ================================================================ money
  async function money(ctx, shot) {
    const Pm = shot.params ?? {}, mode = Pm.mode ?? 'revenue', D = shot.duration ?? 8;
    const t0 = G.cue(shot, Pm.at, 0.4), t1 = G.cue(shot, Pm.at2, Math.min(D - 3, t0 + 2.2));
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g); k.view(1);
      if (mode === 'revenue') {
        G.kicker(g, 'PANAMA CANAL · FISCAL YEAR 2025', 150, 150, range(t, 0.05, 0.6));
        G.riseText(g, 'Where the money goes', 150, 236, range(t, 0.15, 1), { size: 76, weight: 800 });
        const x = 150, y = 420, w = 1620, h = 190;
        const k1 = E.inOutCubic(range(t, t0, t0 + 1.4)), rev = 5.7 * E.outExpo(range(t, t0, t0 + 1.6));
        G.card(g, x, y, w * k1, h, { r: 22, fill: P.white, lift: 1, grainA: 0 });
        g.save(); G.rr(g, x, y, w * k1, h, 22); g.clip(); g.fillStyle = P.waterDeep; g.fillRect(x, y, w, h);
        const k2 = E.inOutCubic(range(t, t1, t1 + 1.4)); g.fillStyle = P.red; g.fillRect(x, y, w * 0.52 * k2, h);
        g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 40; i++) g.fillRect(x + i * 46 - (t * 30) % 46, y, 2, h); g.restore();
        G.text(g, `$${rev.toFixed(1)}B`, x + w - 30, y + 128, { size: 100, weight: 900, color: P.white, align: 'right', alpha: clamp(k1 * 3) });
        G.text(g, 'REVENUE (PRELIMINARY)', x + w - 30, y + h + 50, { size: 28, weight: 800, align: 'right', color: P.inkSoft, alpha: clamp(k1 * 3) });
        if (k2 > 0) {
          G.text(g, `$${(2.965 * E.outExpo(range(t, t1, t1 + 1.6))).toFixed(3)}B`, x + 30, y + 128, { size: 100, weight: 900, color: P.white, alpha: clamp(k2 * 3) });
          G.text(g, 'TO PANAMA’S NATIONAL TREASURY', x, y + h + 50, { size: 28, weight: 800, color: P.red, alpha: clamp(k2 * 3) });
          G.text(g, '52%', x + w * 0.52 * k2 - 20, y - 30, { size: 90, weight: 900, color: P.red, align: 'right', alpha: range(t, t1 + 0.8, t1 + 1.3) });
          G.pill(g, 'MORE THAN HALF OF EVERY DOLLAR · OUR MATH: 2.965 ÷ 5.7', x, 800, { size: 30, k: range(t, t1 + 1.2, t1 + 1.8), fill: P.sunSoft, dot: P.red });
        }
        k.flat(); G.source(g, Pm.source ?? 'SOURCE: ACP, FY2025 RESULTS (PRELIMINARY, UNAUDITED)', range(t, 0.6, 1.4));
      } else if (mode === 'share') {
        G.kicker(g, 'CARGO THROUGH THE CANAL · FY2018', 150, 150, range(t, 0.05, 0.6));
        G.riseText(g, 'Going to or from the US', 150, 236, range(t, 0.15, 1), { size: 76, weight: 800 });
        const cx = 620, cy = 610, R = 290, v = 62.8, kk = E.inOutCubic(range(t, t0, t0 + 1.8));
        g.save(); G.shadow(g, 1.2); g.fillStyle = P.white; g.beginPath(); g.arc(cx, cy, R + 24, 0, TAU); g.fill(); G.noShadow(g);
        g.lineWidth = 120; g.strokeStyle = P.shelf; g.beginPath(); g.arc(cx, cy, R - 60, 0, TAU); g.stroke();
        g.strokeStyle = P.red; g.lineCap = 'butt'; g.beginPath(); g.arc(cx, cy, R - 60, -Math.PI / 2, -Math.PI / 2 + TAU * v / 100 * kk); g.stroke(); g.restore();
        G.text(g, `${(v * kk).toFixed(1)}%`, cx, cy + 30, { size: 84, weight: 900, align: 'center', color: P.red });
        const lbl = ['of all cargo had a US', 'origin or destination'];
        lbl.forEach((l, i) => G.riseText(g, l, 1030, 520 + i * 74, range(t, t0 + 1, t0 + 1.8 + i * 0.1), { size: 62, weight: 800 }));
        G.text(g, 'NEXT: CHINA, MEXICO, CHILE, JAPAN', 1032, 700, { size: 28, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, alpha: range(t, t0 + 1.8, t0 + 2.4) });
        k.flat(); G.source(g, Pm.source ?? 'SOURCE: PANAMA CANAL AUTHORITY, FY2018 TRAFFIC BY COUNTRY', range(t, 0.6, 1.4));
      } else { // transits
        G.kicker(g, 'PANAMA CANAL · FISCAL YEAR 2025', 150, 150, range(t, 0.05, 0.6));
        const n = Math.round(13404 * E.outExpo(range(t, t0, t0 + 2.2)));
        G.text(g, G.fmt(n), 140, 440, { size: 300, weight: 900, color: P.ink, track: -0.02 });
        G.riseText(g, 'ships crossed in one year', 156, 560, range(t, t0 + 0.6, t0 + 1.4), { size: 64, weight: 800 });
        G.water(g, -100, 2020, 780, 1200, t, { amp: 6, glints: 10 });
        for (let i = 0; i < 9; i++) { const x = ((i * 260 + t * 120) % 2340) - 210; G.ship(g, x, 790, 170, { seed: i * 3 + 1 }); }
        G.text(g, '+19.3% ON FY2024', 156, 630, { size: 28, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, alpha: range(t, t0 + 1.2, t0 + 1.8) });
        k.flat(); G.source(g, Pm.source ?? 'SOURCE: ACP, FY2025 RESULTS (PRELIMINARY)', range(t, 0.6, 1.4), { color: P.white });
      }
    }, { push: 0.035 });
  }

  return { counter, bignumber, slots, timeline, budget, countdown, quote, chapter, title, money };
}
