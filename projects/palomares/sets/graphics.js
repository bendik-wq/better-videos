// Palomares bright graphics (episode 9, "America Lost the Same H-Bomb Twice"): cards painted on a 2D canvas.
//   title      the episode title card; behind the type a seabed section where bomb 4 drops, is lifted, drops again and is
//              lifted out (the "twice" motif), with a navy tape of the five states
//   chapter    chapter card on ledger paper; the same section on the right, a red pulse at the chapter's state
//              (params.state: 'lost' | 'found' | 'lost-again' | 'lifted' | 'today')
//   quote      verbatim quote card, words appear as they are spoken
//   bignumber  a generic count-up card
//   counter    split-flap board (presets day · alt · clock, or any steps; the clock preset adds a big analog clock)
//   timeline   horizontal ledger timeline that pans (17 Jan 1966 … the 2026 status)
// Params for every set: projects/palomares/SETS-graphics.md. Every number on screen comes from RESEARCH.md.
// Format: makeGraphics(H) -> { name: async (ctx, shot) => ({ scene, camera, layer, canvas, update(t, p) }) }.
import * as G from './graphics-kit.js';
import * as M from '/engine/motion.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

export default function makeGraphics(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // a lift line from a ship at the surface down to (x, y); cut 0..1 parts it (the lower stub stays, the upper end whips up)
  function liftLine(g, x, ys, y, k, { cut = 0, color = P.ink, w = 3 } = {}) {
    if (k <= 0) return;
    const yEnd = lerp(ys, y, E.outCubic(clamp(k)));
    g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round';
    if (cut <= 0) { g.beginPath(); g.moveTo(x, ys); g.lineTo(x, yEnd); g.stroke(); g.restore(); return; }
    const gapY = lerp(ys, y, 0.72), up = E.outCubic(clamp(cut)) * (gapY - ys) * 0.55;
    g.beginPath(); g.moveTo(x, ys); g.lineTo(x + Math.sin(cut * 9) * 6 * (1 - cut), gapY - up); g.stroke();
    g.globalAlpha *= 1 - clamp(cut * 1.4); g.beginPath(); g.moveTo(x, gapY + 8); g.lineTo(x, y); g.stroke();
    g.restore();
  }

  // ================================================================ title
  // The motif, in story order: 17 Jan the bomb sinks (chute) to the ridge rim and slides down the furrow to 2,550 ft (found
  // 15 Mar); 24 Mar a line comes down, lifts it a little, parts; it falls and slides to 2,800 ft (re-found 2 Apr); 7 Apr it
  // is lifted to the ship. Depths: S01 p.94. The tape names the five states.
  async function title(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, lines = Pm.lines ?? ['AMERICA LOST', 'THE SAME', 'H-BOMB TWICE'];
    const sp = clamp((D - 0.8) / 6.2, 0.55, 1.4);
    const T = { drop: 0.45, rim: 0.45 + 0.9 * sp, found: 0.45 + 1.35 * sp, lift: 0.45 + 2.0 * sp, snap: 0.45 + 2.75 * sp, settle: 0.45 + 3.45 * sp, refound: 0.45 + 3.95 * sp, raise: 0.45 + 4.45 * sp, out: 0.45 + 5.5 * sp };
    const U = G.UPOS;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.2); G.paper(g, { step: 60 });
      // the section across the lower frame
      k.view(0.45);
      const S = G.section([-60, 660, 2040, 280]);
      G.drawSection(g, S, { t, alpha: E.outCubic(range(t, 0, 0.7)), dark: 0.35 });
      // bomb 4's path, a pure function of t
      const L = 86, sx = S.X(U.touch);
      let x, y, a, chute = 0, ghost = false, alpha = 1, shipA = 0, line = 0, cut = 0, shipX = S.X(U.find) - 10;
      if (t < T.rim) { const u = E.inOutSine(range(t, T.drop, T.rim)); x = sx; y = lerp(S.ys - 10, S.at(U.touch, 6)[1], u); a = Math.PI / 2 - 0.25; chute = 1; alpha = range(t, T.drop, T.drop + 0.2); }
      else if (t < T.lift) { const u = E.inOutCubic(range(t, T.rim + 0.05, T.found)); const uu = lerp(U.touch, U.find, u); [x, y] = S.at(uu, 6); a = S.ang(uu) + 0.05; chute = 1 - u * 0.4; }
      else if (t < T.snap) { [x, y] = S.at(U.find, 6); a = S.ang(U.find); chute = 0.6; shipA = range(t, T.lift - 0.3, T.lift + 0.2); shipX = x; line = range(t, T.lift, T.lift + 0.45); y -= 16 * E.inOutSine(range(t, T.lift + 0.45, T.snap)); }
      else if (t < T.raise) {
        const u = E.inOutCubic(range(t, T.snap + 0.12, T.settle)), uu = lerp(U.find, U.refind, u);
        [x, y] = S.at(uu, 6); a = S.ang(uu) * (1 - u) + 0.2 * u + Math.sin(u * Math.PI) * 0.6; chute = 0.6;
        const f = S.at(U.find, 6); if (t < T.snap + 0.12) { y = f[1] - 16 + 16 * E.inCubic(range(t, T.snap, T.snap + 0.12)); }
        shipA = 1 - range(t, T.settle, T.settle + 0.4); shipX = f[0]; line = 1; cut = range(t, T.snap, T.snap + 0.5);
        ghost = t > T.settle && t < T.refound; // nine days of not knowing
      } else {
        const sx2 = S.X(U.refind), [bx, by] = S.at(U.refind, 6), u = E.inOutCubic(range(t, T.raise + 0.35, T.out));
        shipA = range(t, T.raise - 0.2, T.raise + 0.2); shipX = bx; line = range(t, T.raise, T.raise + 0.35);
        x = sx2; y = lerp(by, S.ys - 16, u); a = lerp(0.2, 0, u); chute = 0.6 * (1 - u);
      }
      if (shipA > 0) {
        G.ship(g, shipX + 30, S.ys, 0.85, { alpha: shipA });
        if (line > 0) liftLine(g, shipX, S.ys + 8, t < T.raise ? S.at(U.find, 6)[1] - (cut > 0 ? 0 : 16 * E.inOutSine(range(t, T.lift + 0.45, T.snap))) : y, line, { cut });
      }
      G.bomb(g, x, y, a, L, { chute, ghost, t, alpha });
      if (ghost) G.text(g, '?', x + 56, y - 26, { size: 44, weight: 800, color: P.ink, alpha: 0.85 });
      // type, on a soft paper halo
      k.view(1);
      const halo = g.createRadialGradient(960, 360, 100, 960, 360, 860); halo.addColorStop(0, 'rgba(247,246,241,0.9)'); halo.addColorStop(0.6, 'rgba(247,246,241,0.5)'); halo.addColorStop(1, 'rgba(247,246,241,0)');
      g.save(); g.scale(1, 0.6); g.fillStyle = halo; g.fillRect(-200, 0, 2320, 1100); g.restore();
      const size = Pm.size ?? 142, y0 = Pm.y ?? 222;
      lines.forEach((l, i) => {
        const red = i === lines.length - 1;
        G.riseText(g, l, 960, y0 + i * size * 1.0, range(t, 0.2 + i * 0.18, 1.2 + i * 0.18), { size, weight: 900, align: 'center', color: red ? P.red : P.ink, track: -0.02, maxW: 1700 });
      });
      if (Pm.sub) G.text(g, Pm.sub, 960, y0 + (lines.length - 1) * size + 76, { size: 24, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.16, upper: true, alpha: E.outCubic(range(t, 1.4, 2.0)) });
      // the tape: the five states of bomb 4, each lighting as the motif reaches it
      k.view(0.8);
      const ty = 1000, kt = range(t, 0.3, 0.8);
      if (kt > 0) {
        g.save(); g.globalAlpha = clamp(kt * 2); G.shadow(g, 0.8); g.fillStyle = P.ink; g.fillRect(-200, ty - 40, 2320, 80); G.noShadow(g);
        const items = [['17 JAN 1966', 'LOST', T.drop], ['15 MAR', 'FOUND · 2,550 FT', T.found], ['24 MAR', 'LOST AGAIN', T.snap], ['2 APR', 'FOUND · 2,800 FT', T.refound], ['7 APR', 'LIFTED', T.out - 0.3]];
        const wi = items.map(([d, v]) => G.measure(g, d, 19, 500, F.mono, 0.1) + 12 + G.measure(g, v, 26, 500, F.mono, 0.04) + 64);
        const TW = wi.reduce((a, b) => a + b, 0) - 64, ts = Math.min(1, 1760 / TW);
        g.translate(960, ty); g.scale(ts, ts); g.translate(-960, -ty);
        let xx = 960 - TW / 2, cur = 0; items.forEach((it, i) => { if (t >= it[2]) cur = i; });
        items.forEach(([d, v, at], i) => {
          const ki = range(t, at, at + 0.4), on = i === cur && t >= at;
          g.save(); g.globalAlpha *= ki > 0 ? 0.45 + 0.55 * ki : 0.22;
          G.text(g, d, xx, ty + 8, { size: 19, weight: 500, fam: F.mono, color: 'rgba(255,255,255,0.72)', track: 0.1 });
          const vx = xx + G.measure(g, d, 19, 500, F.mono, 0.1) + 12, vw = G.measure(g, v, 26, 500, F.mono, 0.04);
          if (on) { G.rr(g, vx - 10, ty - 22, vw + 20, 42, 8); g.fillStyle = P.teal; g.fill(); }
          G.text(g, v, vx, ty + 9, { size: 26, weight: 500, fam: F.mono, color: P.white, track: 0.04 });
          g.restore(); xx += wi[i];
        });
        g.restore();
      }
      k.flat();
      G.text(g, Pm.source ?? 'DEPTHS: DNA PALOMARES SUMMARY REPORT (1975) · SECTION SCHEMATIC, NOT TO SCALE', 1880, 1068, { size: 13, weight: 500, fam: F.mono, align: 'right', color: P.inkSoft, track: 0.1, alpha: 0.8 * E.outCubic(range(t, 1.6, 2.2)) });
    }, { push: 0.05, dx: 0 });
  }

  // ================================================================ chapter: ledger paper, the section card on the right
  // state labels: RESEARCH §1, §5c, §6, §7, §10 (the fence: G4, ⏱)
  const STATES = {
    lost: { label: '17 JAN 1966 · BOMB 4 IS MISSING', sub: 'A FISHERMAN SAW A PARACHUTE GO INTO THE SEA' },
    found: { label: '15 MAR 1966 · FOUND AT 2,550 FT', sub: 'ALVIN, ON A 70° SLOPE' },
    'lost-again': { label: '24 MAR 1966 · THE LINE PARTS', sub: 'LOST AGAIN, FOR NINE DAYS' },
    lifted: { label: '7 APR 1966 · LIFTED', sub: '80 DAYS AFTER THE CRASH' },
    today: { label: 'THE FENCE IS STILL UP', sub: 'PALOMARES, 2026', asof: 'AS OF 21 OCT 2026' },
  };
  async function chapter(ctx, shot) {
    const Pm = shot.params ?? {}, D = Math.max(3.5, shot.duration ?? 4), num = String(Pm.num ?? 1).padStart(2, '0');
    const ttl = String(Pm.title ?? 'Chapter'), sub = Pm.sub ?? '';
    const state = STATES[Pm.state] ? Pm.state : 'found', ST = { ...STATES[state], ...(Pm.label ? { label: Pm.label } : {}), ...(Pm.stateSub ? { sub: Pm.stateSub } : {}) };
    const tIn = 0.25, tB = Math.min(1.0, D * 0.3), tP = Math.min(1.9, D * 0.5);
    const U = G.UPOS;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { step: 54, margin: 96 });
      // right: the section card
      k.view(0.7);
      const cx0 = 1030, cy0 = 214, cw = 800, ch = 620, kc = E.outCubic(range(t, 0.05, 0.7));
      g.save(); g.translate(0, (1 - kc) * 30); g.globalAlpha = kc;
      G.card(g, cx0, cy0, cw, ch, { r: 24, lift: 1.1 });
      g.save(); G.rr(g, cx0, cy0, cw, ch, 24); g.clip();
      const FOCUS = { lost: [U.simo, 420], found: [U.find, 470], 'lost-again': [U.find, 470], lifted: [U.lift, 520], today: [0.03, 190] }[state];
      const SW = 1000, S = G.section([cx0 + FOCUS[1] - FOCUS[0] * SW, cy0 + 170, SW, 400], { landK: 0.8 });
      G.drawSection(g, S, { t, dark: state === 'lost-again' ? 0.8 : 0.3, x1: cx0 + cw + 20 });
      const kb = range(t, tB, tB + 0.9), kp = range(t, tP, tP + 0.5);
      let px = 0, py = 0;
      if (state === 'lost') {
        // nothing to point at but water: rings on the surface where the chute went in, a dashed "?" below
        px = S.X(U.simo); py = S.ys;
        for (let q = 0; q < 3; q++) { const ph = (t * 0.5 + q / 3) % 1; g.save(); g.strokeStyle = P.ink; g.globalAlpha = (1 - ph) * 0.5 * kb; g.lineWidth = 2; g.beginPath(); g.ellipse(px, py, 16 + ph * 70, 5 + ph * 18, 0, 0, TAU); g.stroke(); g.restore(); }
        G.bomb(g, px, lerp(py + 20, py + 120, E.inOutSine(kb)), Math.PI / 2 - 0.2, 46, { ghost: true, alpha: kb * (1 - 0.6 * range(t, tP + 0.4, tP + 1.6)) });
        G.text(g, '?', px + 30, py + 150, { size: 64, weight: 800, color: P.ink, alpha: E.outCubic(range(t, tP, tP + 0.6)) });
      } else if (state === 'found' || state === 'lost-again') {
        const [bx, by] = S.at(U.find, 5);
        const a = S.ang(U.find);
        if (state === 'found') { const [fx, fy] = S.at(U.find, 7); G.bomb(g, fx, lerp(fy - 160, fy, E.outCubic(kb)), lerp(Math.PI / 2, a, E.inOutCubic(kb)), 70, { chute: 0.7, t, alpha: clamp(kb * 3) }); px = fx; py = fy; }
        else {
          G.ship(g, bx + 26, S.ys, 0.75, { alpha: clamp(kb * 3) });
          liftLine(g, bx, S.ys + 8, by - 10, 1, { cut: range(t, tB + 0.3, tB + 0.9) });
          G.bomb(g, bx, by, a, 52, { ghost: true, alpha: clamp(kb * 3) });
          // where did it go? a dashed arrow downslope into the dark
          const [rx, ry] = S.at(U.refind, 26), ka = E.inOutCubic(range(t, tB + 0.7, tB + 1.6));
          g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.setLineDash([8, 7]); g.globalAlpha = 0.8; g.beginPath(); g.moveTo(bx + 18, by + 4); g.quadraticCurveTo(bx + 70, ry - 6, lerp(bx + 18, rx, ka), lerp(by + 4, ry, ka)); g.stroke(); g.restore();
          G.text(g, '?', rx + 10, ry - 10, { size: 54, weight: 800, color: P.ink, alpha: E.outCubic(range(t, tB + 1.4, tB + 2.0)) });
          px = bx; py = lerp(S.ys, by, 0.72);
        }
      } else if (state === 'lifted') {
        const [lx, ly] = S.at(U.lift, 7), u = E.inOutCubic(kb), by = lerp(ly, S.ys + 34, u);
        G.bomb(g, lx, ly, S.ang(U.lift), 66, { ghost: true, alpha: 0.7 });
        g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.setLineDash([3, 8]); g.globalAlpha = 0.6; g.beginPath(); g.moveTo(lx + 40, ly - 10); g.lineTo(lx + 40, by + 10); g.stroke(); g.restore();
        G.ship(g, lx + 30, S.ys, 0.8);
        liftLine(g, lx, S.ys + 8, by - 8, 1);
        G.bomb(g, lx, by, Math.PI / 2 * 0.9, 66, { chute: 0.45, t });
        px = lx; py = by;
      } else if (state === 'today') {
        // the sea is empty; on the land, a fenced plot
        const f0 = S.X(-0.13), f1 = S.X(0.0), fy = S.Y(G.bedFt(-0.1)) + 2;
        G.fence(g, f0, lerp(f0, f1, E.outCubic(kb)), fy, 44);
        px = (f0 + f1) / 2; py = fy - 22;
      }
      g.restore();
      G.pulse(g, px, py, t, kp, { r: state === 'found' || state === 'lifted' ? 30 : state === 'today' ? 22 : 11, dot: state === 'lost' || state === 'lost-again' });
      // the card's small caption
      G.text(g, 'BOMB 4 · SCHEMATIC SECTION · NOT TO SCALE', cx0 + 28, cy0 + 44, { size: 15, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12 });
      g.restore();
      // the state, under the card
      const ks = range(t, tP + 0.1, tP + 0.7);
      G.slab(g, ST.label, cx0, cy0 + ch + 56, { size: 30, k: ks });
      G.text(g, ST.sub, cx0 + 4, cy0 + ch + 116, { size: 20, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.12, alpha: E.outCubic(range(t, tP + 0.4, tP + 1.0)) });
      if (ST.asof) G.asOf(g, ST.asof, cx0 + cw, cy0 + ch + 56, range(t, tP + 0.5, tP + 1.0), { align: 'right', size: 17 });
      // left: the type
      k.view(1);
      G.text(g, 'CHAPTER', 160, 300, { size: 30, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.3, alpha: E.outCubic(range(t, 0.1, 0.6)) });
      g.fillStyle = P.teal; g.fillRect(160, 330, 90 * E.emphasized(range(t, 0.1, 0.7)), 6);
      G.text(g, num, 148, 540, { size: 220, weight: 500, fam: F.mono, color: P.ink, track: -0.04, alpha: E.outCubic(range(t, 0.1, 0.5)) });
      const big = ttl.length > 22 ? 78 : ttl.length > 16 ? 92 : 118, lines = G.wrap(g, ttl, 800, big, 900);
      lines.forEach((l, i) => G.riseText(g, l, 156, 690 + i * big * 1.02, range(t, tIn + 0.1 + i * 0.12, tIn + 0.95 + i * 0.12), { size: big, weight: 900, color: P.ink, track: -0.015 }));
      if (sub) G.wrap(g, sub, 780, 36, 600).forEach((l, i) => G.text(g, l, 160, 690 + (lines.length - 1) * big * 1.02 + 76 + i * 46, { size: 36, weight: 600, color: P.inkSoft, alpha: E.outCubic(range(t, 1.0 + i * 0.1, 1.7 + i * 0.1)) }));
    }, { push: 0.04, dx: 20 });
  }

  // ================================================================ quote
  async function quote(ctx, shot) {
    const Pm = shot.params ?? {}, txt = String(Pm.text ?? ''), D = shot.duration ?? 7;
    const words = txt.split(/\s+/).filter(Boolean);
    const said0 = (shot.words ?? []).length ? M.wordTimes(shot, txt, { fallback: 0.5, gap: 0.16 }) : words.map((_, i) => 0.4 + i * Math.min(0.16, (D * 0.55) / Math.max(1, words.length)));
    // never lag the VO: every word is in by ~58% of the clip (a paused frame late in the shot shows the whole quote)
    const said = said0.map((s, i) => Math.min(s, 0.25 + (i / Math.max(1, words.length - 1)) * Math.max(0.4, D * 0.58 - 0.25)));
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
      const tb = 0.3, yb = top + h + 36; // the byline is up from the start: a paused frame always says who is speaking
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

  // ================================================================ counter: the split-flap board (days, altitudes, clocks)
  // DAY n = n days after the crash (17 Jan 1966): RESEARCH counts "80 days after the crash" for 7 Apr (READ FIRST 7, D34),
  // so 2 Mar = day 44 (the DoD statement's "44 days since the accident"), 15 Mar = 57, 24 Mar = 66, 2 Apr = 75, 7 Apr = 80.
  const DAYS = [
    { day: 1, label: 'BOMB 4 IS MISSING', sub: '18 JAN 1966 · BOMBS 2 AND 3 FOUND ON LAND' },
    { day: 44, label: 'THE US ADMITS IT', sub: '2 MAR 1966 · A WEAPON “HAS NOT YET BEEN RECOVERED”' },
    { day: 57, label: 'FOUND', sub: '15 MAR 1966 · BY ALVIN, 2,550 FT DOWN' },
    { day: 66, label: 'LOST AGAIN', sub: '24 MAR 1966 · THE LIFT LINE PARTS', red: true },
    { day: 75, label: 'FOUND AGAIN', sub: '2 APR 1966 · 2,800 FT · 250 FT DEEPER' },
    { day: 80, label: 'LIFTED', sub: '7 APR 1966 · ON THE DECK OF USS PETREL' },
  ];
  // the number is right-aligned in two tiles ('DAY  1', 'DAY 44'), as a real split-flap board would show it
  const dayStep = (d) => { const o = typeof d === 'number' ? (DAYS.find(x => x.day === d) ?? { day: d }) : d; return { ...o, text: o.text ?? `DAY ${String(o.day).padStart(2, ' ')}` }; };
  const PRESETS = {
    day: { align: 'left', kicker: 'DAYS AFTER THE CRASH · 17 JAN 1966', title: 'The hunt for bomb 4',
      source: 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); STATE DEPT HISTORY (1985); B. MORAN (2009)', steps: DAYS },
    alt: { align: 'center', kicker: '17 JAN 1966 · ABOUT 10:22 AM LOCAL', title: 'Over Palomares',
      source: 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); B. MORAN (2009)',
      steps: [{ text: '31,000 FT', label: 'THE REFUELLING ALTITUDE', sub: 'B-52G “TEA 16” ABOUT 150 FT BELOW KC-135A “TROUBADOUR 14”' }] },
    // the analog clock layout (face: true): each step's time = [h, m] (24 h); hands sweep forward between steps
    clock: { align: 'right', face: true, kicker: 'THREE TIMES THAT MATTER', title: 'The clock',
      source: 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); B. MORAN (2009) AND HER 2004 ARTICLE; USS PETREL DECK LOG VIA MORAN',
      steps: [{ time: [10, 22], text: '10:22 AM', label: 'THE COLLISION', sub: '17 JAN 1966 · ABOUT 10:22 LOCAL (0922Z)' },
        { time: [21, 0], text: '~9 PM', label: 'THE LINE PARTS', sub: '24 MAR 1966 · ABOUT 9 PM · PER MORAN', red: true },
        { time: [8, 46], text: '8:46 AM', label: 'WEAPON ON DECK', sub: '7 APR 1966 · USS PETREL’S DECK LOG, VIA MORAN' }] },
  };
  const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  async function counter(ctx, shot) {
    const Pm = shot.params ?? {}, pre = PRESETS[Pm.preset ?? (Pm.steps || Pm.days ? '' : 'day')] ?? {};
    let steps = Pm.days ? [].concat(Pm.days).map(dayStep) : (Pm.steps ?? pre.steps ?? [{ text: '—' }]);
    steps = steps.map(s => (typeof s === 'string' ? { text: s } : s.text ? s : dayStep(s)));
    const D = shot.duration ?? 8, clk = Pm.clock ?? pre.clock;
    const face = Pm.face ?? pre.face ?? steps.some(s => s.time);
    const T = G.cues(shot, steps, { from: 0.35, span: Math.max(1.6 * (steps.length - 1), D * 0.55) });
    const L = Math.max(...steps.map(s => s.text.length));
    const align = Pm.align ?? pre.align ?? 'right';
    const pad = (s) => (align === 'center' ? s.padStart(Math.floor((L + s.length) / 2), ' ').padEnd(L, ' ') : s.padStart(L, ' ')).split('');
    const narrow = (c) => /[:.,·]/.test(c);
    const slots = Array.from({ length: L }, (_, i) => {
      const cs = steps.map(s => pad(s.text)[i]);
      if (cs.every(c => c === ' ')) return 'g';
      return cs.every(c => narrow(c) || c === ' ') ? 'n' : 'w';
    });
    const unit = slots.reduce((a, s) => a + (s === 'n' ? 0.42 : s === 'g' ? 0.3 : 1), 0) + 0.06 * (L - 1);
    const BX = face ? 1330 : 960, BW = face ? 860 : 1600;
    const TW = Pm.tile ?? Math.min(face ? 150 : 196, BW / unit), TH = TW * 1.36, NW = TW * 0.42, GW = TW * 0.3, gap = TW * 0.06;
    const boardW = slots.reduce((a, s) => a + (s === 'n' ? NW : s === 'g' ? GW : TW) + gap, -gap);
    // flap timing fits the step's window: tiles land within ~0.35–0.85 s, leaving >= ~1.3 s settled before the next step / the cut.
    // Short clips (< 2.2 s, or settled: true) open already settled on their single step.
    const settled = Pm.settled ?? D < 2.2; if (settled) T[0] = Math.min(T[0], 0);
    const win = (si) => (si + 1 < steps.length ? T[si + 1] : D) - T[si];
    const fd = (si) => (settled && si === 0 ? 0 : clamp(Math.min(0.85, win(si) - 1.3), 0.35, 0.85));
    const tFlapS = (i, si) => fd(si) * (L > 1 ? 0.35 + 0.65 * i / (L - 1) : 1);
    const mins = (s) => (s?.time ? s.time[0] * 60 + s.time[1] : null);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.7);
      G.kicker(g, Pm.kicker ?? pre.kicker, 150, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? pre.title ?? '', 150, 236, range(t, 0.15, 1.0), { size: 72, weight: 800, maxW: clk ? 1380 : 1620 });
      k.view(1);
      let si = 0; for (let i = 0; i < steps.length; i++) if (t >= T[i]) si = i;
      const cur = steps[si], prev = steps[Math.max(0, si - 1)], tc = T[si];
      const from = si === 0 ? pad('').map(() => ' ') : pad(prev.text), to = pad(cur.text);
      const x0 = BX - boardW / 2, y0 = (face ? 400 : 380) + Math.max(0, (180 - TH) * 0.5);
      G.card(g, x0 - TW * 0.22, y0 - TW * 0.22, boardW + TW * 0.44, TH + TW * 0.44, { r: 26, fill: P.ink, lift: 1.4, grainA: 0 });
      const fdc = fd(si), tFlap = (i) => tFlapS(Math.min(i, L - 1), si);
      const redNow = cur.red && t > tc + fdc + 0.15;
      const off = align === 'center' ? Math.floor((L + cur.text.length) / 2) - cur.text.length : L - cur.text.length;
      const redFrom = typeof cur.red === 'string' && cur.text.includes(cur.red) ? off + cur.text.lastIndexOf(cur.red)
        : cur.text.includes('·') ? off + cur.text.lastIndexOf('·') + 1 : 0;
      let x = x0;
      for (let i = 0; i < L; i++) {
        const sl = slots[i], w = sl === 'n' ? NW : sl === 'g' ? GW : TW, a = from[i], b = to[i], stopAt = tc + tFlap(i);
        if (sl === 'g') { x += w + gap; continue; }
        const col = redNow && i >= redFrom ? P.red : P.ink;
        if (sl === 'n') {
          const c = t < tc && si === 0 ? ' ' : (t < stopAt - 0.1 ? a : b);
          if (c.trim()) G.text(g, c, x + w / 2, y0 + TH * 0.74, { size: TW * 0.95, weight: 800, align: 'center', color: redNow && i > redFrom ? '#ff6a5c' : P.white });
          x += w + gap; continue;
        }
        G.rr(g, x, y0, w, TH, TW * 0.06); const gr = g.createLinearGradient(0, y0, 0, y0 + TH); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#eef1ee'); g.fillStyle = gr; g.fill();
        g.save(); G.rr(g, x, y0, w, TH, TW * 0.06); g.clip();
        const digit = (c) => (c === ' ' ? 10 : /\d/.test(c) ? +c : null);
        const da = digit(a), db = digit(b), moving = t >= tc && t < stopAt && a !== b;
        const fs = (c) => (c === '%' || c === '$' || c === '−' ? TW * 0.8 : /[A-Z]/.test(c) ? TW * (/[MW]/.test(c) ? 0.78 : 0.9) : TW * 1.0);
        if (moving && da != null && db != null) {
          const dist = 22 + ((db - da) % 11 + 11) % 11, uu = E.outCubic(range(t, tc, stopAt)), pos = da + dist * uu;
          for (let j = -1; j <= 1; j++) { const d = ((Math.floor(pos) + j) % 11 + 11) % 11, o = (pos - Math.floor(pos) - j) * TH; if (d !== 10) G.text(g, String(d), x + w / 2, y0 + TH * 0.75 - o, { size: TW * 1.0, weight: 800, align: 'center', color: P.ink, alpha: uu < 0.8 ? 0.55 : 1 }); }
        } else if (moving) {
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
      const yl = y0 + TH + (face ? 130 : 150), kl = range(t, tc + 0.1, tc + fdc + 0.3);
      G.riseText(g, cur.label ?? '', BX, yl, kl, { size: face ? 54 : 60, weight: 800, align: 'center', color: P.ink, track: 0.01, maxW: BW });
      if (cur.sub) G.text(g, cur.sub, BX, yl + 52, { size: face ? 22 : 26, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.1, alpha: E.outCubic(range(t, tc + 0.2, tc + fdc + 0.45)), maxW: BW });
      if (steps.length > 1) {
        const n = steps.length, gx = BX - (n - 1) * 30;
        steps.forEach((st, i) => { const on = t >= T[i], kk = E.outBack(range(t, T[i], T[i] + 0.4)); g.save(); g.fillStyle = P.rule; g.beginPath(); g.arc(gx + i * 60, yl + 120, 9, 0, TAU); g.fill(); if (on) { g.fillStyle = i === si ? (st.red ? P.red : P.teal) : P.inkFaint; g.beginPath(); g.arc(gx + i * 60, yl + 120, 9 * kk, 0, TAU); g.fill(); } g.restore(); });
      }
      // the big analog clock (face): the hands sweep forward from the previous step's time to this one
      if (face) {
        let m = mins(steps[0]) ?? 0;
        for (let i = 1; i <= si; i++) { const a0 = mins(steps[i - 1]), a1 = mins(steps[i]); if (a0 == null || a1 == null) continue; const fwd = ((a1 - a0) % 1440 + 1440) % 1440; m += fwd * E.inOutCubic(range(t, T[i], T[i] + 1.3)); }
        const hh = Math.floor(m / 60), mm = m % 60, ss = (t * 6) % 60;
        G.clock(g, 470, 600, 240, hh, mm, ss, { red: !!(cur.red && redNow), k: E.outBack(range(t, 0.15, 0.8)) });
      }
      if (clk && !face) { const ss = (t * 6) % 60; G.clock(g, 1700, 200, 96, clk[0], clk[1] + ss / 60 - 0.5, ss, { red: true, k: E.outBack(range(t, 0.2, 0.8)) }); }
      const asof = cur.asof ?? Pm.asof ?? pre.asof;
      if (asof) G.asOf(g, asof, 1770, 150, range(t, 0.6, 1.1), { align: 'right' });
      k.flat(); G.source(g, Pm.source ?? pre.source, range(t, 0.8, 1.6));
    }, { push: 0.035 });
  }

  // ================================================================ timeline (pans when the events don't fit)
  // { date ('17 JAN'), year, label, word, red, asof } — every row is in RESEARCH §1 (dates ✓ unless noted in SETS-graphics.md)
  const EVENTS = [
    { date: '17 JAN', year: '1966', label: 'B-52 and tanker collide at 31,000 ft. Four H-bombs fall' },
    { date: '18 JAN', year: '1966', label: 'Bombs 2 and 3 found on land. Bomb 4 is missing' },
    { date: '22 JAN', year: '1966', label: 'Fisherman Simó guides USS Pinnacle to where he saw a chute' },
    { date: '9 FEB', year: '1966', label: 'Alvin arrives off Palomares' },
    { date: '1 MAR', year: '1966', label: 'Alvin photographs a furrow on the slope' },
    { date: '8 MAR', year: '1966', label: 'The ambassador swims to prove the sea is safe' },
    { date: '15 MAR', year: '1966', label: 'Found: 2,550 ft down, on a 70° slope' },
    { date: '24 MAR', year: '1966', label: 'The lift line parts. Lost again', red: true },
    { date: '2 APR', year: '1966', label: 'Found again, at 2,800 ft' },
    { date: '7 APR', year: '1966', label: 'Lifted, 80 days after the crash' },
    { date: '21 JAN', year: '1968', label: 'Thule: another B-52 crash. Nuclear airborne alert ends' },
    { date: '2006–09', year: '2006', label: 'CIEMAT survey maps the plutonium left in the soil', yearless: true },
    { date: '19 OCT', year: '2015', label: 'US–Spain statement of intent. Not binding' },
    { date: 'OCT', year: '2026', label: 'Fence still up. Lawsuit still awaiting a ruling', asof: 'AS OF 21 OCT 2026' },
  ];
  const yearNum = (y) => parseInt(String(y), 10);
  async function timeline(ctx, shot) {
    const Pm = shot.params ?? {};
    const ev = (Pm.events ?? EVENTS).map(e => (typeof e === 'object' ? e : EVENTS.find(x => String(x.year) === String(e) || `${x.date} ${x.year}` === String(e)) ?? { year: String(e), label: '' }));
    const D = shot.duration ?? 14, n = ev.length, sp = Pm.spacing ?? 270, X = (i) => i * sp;
    const fi = (f) => { if (f == null) return null; const s = String(f); const i = ev.findIndex(e => `${e.date ?? ''} ${e.year}`.trim() === s || e.label === s || e.date === s); return i >= 0 ? i : (j => (j < 0 ? null : j))(ev.findIndex(e => String(e.year) === s)); };
    const hasF = Pm.focus != null, focus = hasF ? (Array.isArray(Pm.focus) ? Pm.focus.map(fi) : [fi(Pm.focus), fi(Pm.focus)]) : [null, null];
    const T = hasF && !ev.some(e => e.word) ? ev.map((_, i) => 0.15 + i * 0.05) : G.cues(shot, ev, { from: 0.4, span: Math.min(D * 0.78, Math.max(0.7 * (n - 1), D - 2.4)) });
    const lw = Math.min(380, sp * 1.55);
    const lo = Math.min(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1), hi = Math.max(focus[0] ?? -1, focus[1] ?? focus[0] ?? -1);
    // the camera along the axis: the first event sits at x 230, the last at 1690; centred if everything fits
    const span = X(n - 1), fits = span <= 1320, cMin = X(0) + 600, cMax = X(n - 1) - 600;
    const cAt = (i) => clamp(X(i) - 390, cMin, cMax); // the newest event sits right of centre, the older ones fill the left
    const camX = (t) => {
      if (fits) return span / 2;
      if (hasF) return clamp((X(lo) + X(hi)) / 2, cMin, cMax);
      let c = cMin; for (let i = 0; i < n; i++) { const prev = i ? cAt(i - 1) : cMin; c += (cAt(i) - prev) * E.inOutSine(range(t, T[i] - 0.6, T[i] + 0.5)); } return c;
    };
    const showYear = (i) => i === 0 || String(ev[i].year) !== String(ev[i - 1].year);
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      k.view(1);
      const y = 590, cx = camX(t), SX = (i) => 960 + X(i) - cx;
      // the axis, drawn on as events arrive
      const reach = Math.max(...ev.map((e, i) => (t >= T[i] - 0.4 ? SX(i) + sp * 0.6 * E.outCubic(range(t, T[i] - 0.4, T[i] + 0.2)) : -400)), SX(0));
      g.save(); g.beginPath(); g.rect(-200, 0, reach + 200, 1080); g.clip();
      g.fillStyle = P.ink; g.fillRect(-200, y - 3, 2320, 6);
      for (let x = (SX(0) % 24) - 240; x < 2120; x += 24) { g.fillStyle = P.rule; g.fillRect(x, y + 10, 2, 10); }
      g.restore();
      ev.forEach((e, i) => {
        const x = SX(i); if (x < -420 || x > 2340) return;
        const kk = range(t, T[i] - 0.4, T[i] + 0.4); if (kk <= 0) return;
        const up = i % 2 === 0;
        const act = !hasF || (i >= lo && i <= hi), red = hasF ? act : !!e.red, col = red ? P.red : P.ink;
        if (i > 0 && yearNum(e.year) - yearNum(ev[i - 1].year) > (Pm.gapYears ?? 1)) { const bx = x - sp / 2; g.save(); g.strokeStyle = P.paper; g.lineWidth = 10; g.beginPath(); g.moveTo(bx - 12, y + 22); g.lineTo(bx + 2, y - 22); g.moveTo(bx + 6, y + 22); g.lineTo(bx + 20, y - 22); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 14, y + 22); g.lineTo(bx, y - 22); g.moveTo(bx + 8, y + 22); g.lineTo(bx + 22, y - 22); g.stroke(); g.restore(); }
        g.save(); g.globalAlpha = act ? 1 : 0.36;
        const stem = 78 * E.outCubic(kk); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, up ? y - stem : y + stem); g.stroke();
        G.pin(g, x, y, t, kk, { color: red ? P.red : P.teal, r: 11, pulse: red });
        const ka = E.outCubic(range(t, T[i] - 0.1, T[i] + 0.5));
        // date (big mono), year (teal, only when it changes), label (Inter)
        const dY = up ? y - 104 : y + 136, yrY = up ? dY - 44 : dY + 40;
        G.riseText(g, e.date ?? '', x, dY, kk, { size: 40, weight: 500, fam: F.mono, align: 'center', color: col, track: -0.02 });
        const yr = showYear(i) && !e.yearless;
        if (yr) G.text(g, String(e.year), x, yrY, { size: 24, weight: 500, fam: F.mono, align: 'center', color: red ? P.red : P.tealDeep, track: 0.12, alpha: ka });
        const ls = G.wrap(g, e.label ?? '', lw, 27, 700);
        const top = up ? (yr ? yrY - 40 : dY - 58) - (ls.length - 1) * 34 : (yr ? yrY + 50 : dY + 54);
        ls.forEach((l, j) => G.text(g, l, x, top + j * 34, { size: 27, weight: 700, align: 'center', color: P.ink, alpha: E.outCubic(range(t, T[i], T[i] + 0.6)) }));
        if (e.asof) G.asOf(g, e.asof, x, up ? top - 52 : top + ls.length * 34 + 22, range(t, T[i] + 0.3, T[i] + 0.8), { align: 'center', size: 16 });
        g.restore();
      });
      // edge fades so panned events slide under paper, not off a cliff
      if (!fits) { k.flat(); const L0 = g.createLinearGradient(0, 0, 150, 0); L0.addColorStop(0, 'rgba(247,246,241,1)'); L0.addColorStop(1, 'rgba(247,246,241,0)'); g.fillStyle = L0; g.fillRect(0, 0, 150, 1080);
        const R0 = g.createLinearGradient(1770, 0, 1920, 0); R0.addColorStop(0, 'rgba(247,246,241,0)'); R0.addColorStop(1, 'rgba(247,246,241,1)'); g.fillStyle = R0; g.fillRect(1770, 0, 150, 1080); }
      // the running year, top right: the year of the latest event on screen
      { let iy = 0; ev.forEach((e, i) => { if (t >= T[i] && (hasF ? i <= hi : true)) iy = i; }); if (hasF) iy = hi;
        let ic = iy; while (ic > 0 && String(ev[ic - 1].year) === String(ev[iy].year)) ic--;
        k.flat(); G.riseText(g, String(ev[iy].year), 1800, 128, range(t, T[ic] - 0.1, T[ic] + 0.5), { size: 72, weight: 500, fam: F.mono, align: 'right', color: P.tealDeep, track: -0.02 }); k.view(1); }
      k.flat(); G.kicker(g, Pm.title ?? 'BOMB 4 · 1966 – 2026', 120, 110, range(t, 0, 0.6));
      G.source(g, Pm.source ?? 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); STATE DEPT HISTORY (1985); B. MORAN (2009); CSN; KERRY (2015); ACTUALIDAD ALMANZORA (OCT 2026)', range(t, 0.6, 1.4), { size: 15 });
    }, { push: 0.025, dx: 10 });
  }

  // ================================================================ implosion: why bombs 2 and 3 did not go nuclear (simplified, RESEARCH §3)
  // Two panels. Left (at `everyAt`): a core ringed by 12 charges; all fire at once, arrows inward, the core is squeezed evenly.
  // Right (at `sideAt`): only the left-hand charges fire (red); the core is blown apart to the right. No yields, no internals.
  // params: everyAt ('every'), sideAt ('one'), kicker, title, source, labels [left, right], subs [left, right]
  async function implosion(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 9;
    const tA = G.cue(shot, Pm.everyAt ?? 'every', 0.8), tB = G.cue(shot, Pm.sideAt ?? 'one', D * 0.5);
    const labels = Pm.labels ?? ['A NUCLEAR BLAST', 'A CRASH'], subs = Pm.subs ?? ['EVERY CHARGE FIRES AT ONCE · THE CORE IS SQUEEZED', 'ONE SIDE FIRES · THE CORE IS BLOWN APART'];
    const N = 12, r0 = 112, r1 = 200, rc = 66;
    const shards = Array.from({ length: 11 }, (_, i) => { const r = rng(G.hash(i, 7)); return { a: (r() - 0.5) * 1.3, sp: 0.55 + r() * 0.6, s: 9 + r() * 12, rot: r() * 6 }; });
    const panel = (g, cx, cy, t, side, kIn) => {
      if (kIn <= 0) return; g.save(); g.globalAlpha *= kIn;
      const t0 = side ? tB : tA, fire = (i) => !side || Math.cos(((i + 0.5) / N) * TAU) < -0.45; // left-hand charges only on the crash side
      const flash = range(t, t0, t0 + 0.25) * (1 - range(t, t0 + 0.35, t0 + 1.1));
      // charges (wedges)
      for (let i = 0; i < N; i++) { const a0 = (i / N) * TAU + 0.04, a1 = ((i + 1) / N) * TAU - 0.04, on = fire(i);
        g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath();
        const hot = on ? flash : 0; g.fillStyle = hot > 0.02 ? (side ? `rgba(224,36,27,${0.35 + 0.65 * hot})` : `rgba(255,214,120,${0.4 + 0.6 * hot})`) : (on && t > t0 ? (side ? 'rgba(224,36,27,0.28)' : 'rgba(42,140,134,0.30)') : '#dfe6e1');
        g.fill(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.stroke(); }
      // arrows inward from the firing charges
      for (let i = 0; i < N; i++) { if (!fire(i)) continue; const ka = E.outCubic(range(t, t0 + 0.05, t0 + 0.6)); if (ka <= 0) continue; const a = ((i + 0.5) / N) * TAU;
        const x0 = cx + Math.cos(a) * (r0 - 6), y0 = cy + Math.sin(a) * (r0 - 6), L = (r0 - rc - 14) * ka, x1 = x0 - Math.cos(a) * L, y1 = y0 - Math.sin(a) * L;
        g.strokeStyle = side ? P.red : P.tealDeep; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.fillStyle = g.strokeStyle; g.beginPath(); g.moveTo(x1 - Math.cos(a) * 14, y1 - Math.sin(a) * 14); g.lineTo(x1 + Math.sin(a) * 9, y1 - Math.cos(a) * 9); g.lineTo(x1 - Math.sin(a) * 9, y1 + Math.cos(a) * 9); g.closePath(); g.fill(); }
      // the core
      if (!side) { const sq = 1 - 0.42 * E.inOutCubic(range(t, t0 + 0.3, t0 + 1.0)); const glow = range(t, t0 + 0.8, t0 + 1.3);
        if (glow > 0) { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rc * 1.6); gr.addColorStop(0, `rgba(255,236,170,${0.9 * glow})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rc * 1.6, 0, TAU); g.fill(); }
        g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(cx, cy, rc * sq, 0, TAU); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); }
      else { const ks = E.outCubic(range(t, t0 + 0.35, t0 + 1.8));
        if (ks <= 0) { g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(cx, cy, rc, 0, TAU); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); }
        else { g.save(); g.setLineDash([8, 8]); g.strokeStyle = 'rgba(20,35,61,0.45)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, rc, 0, TAU); g.stroke(); g.restore();
          shards.forEach((sh) => { const d = ks * 330 * sh.sp, x = cx + Math.cos(sh.a) * d, y = cy + Math.sin(sh.a) * d * 0.9; g.save(); g.translate(x, y); g.rotate(sh.rot + ks * 3); g.fillStyle = P.red; g.beginPath(); g.moveTo(-sh.s, -sh.s * 0.6); g.lineTo(sh.s, -sh.s * 0.3); g.lineTo(sh.s * 0.4, sh.s * 0.7); g.lineTo(-sh.s * 0.7, sh.s * 0.5); g.closePath(); g.fill(); g.restore(); }); } }
      g.restore();
      const kl = range(t, t0 - 0.2, t0 + 0.5);
      G.riseText(g, labels[side], cx, cy - r1 - 46, kl, { size: 46, weight: 800, align: 'center', color: side ? P.red : P.ink });
      G.text(g, subs[side], cx, cy + r1 + 70, { size: 21, weight: 500, fam: F.mono, align: 'center', color: P.inkSoft, track: 0.08, alpha: E.outCubic(range(t, t0 + 0.4, t0 + 1.0)), maxW: 760 });
      if (!side) G.text(g, 'CORE', cx, cy + 8, { size: 20, weight: 700, fam: F.mono, align: 'center', color: P.white, alpha: kIn * (1 - range(t, tA + 0.3, tA + 0.6)) });
    };
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.4); G.paper(g);
      k.view(0.7);
      G.kicker(g, Pm.kicker ?? 'WHY THERE WAS NO NUCLEAR BLAST', 150, 150, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'Every charge at once, or one side', 150, 236, range(t, 0.15, 1.0), { size: 68, weight: 800, maxW: 1620 });
      k.view(1);
      panel(g, 560, 610, t, 0, E.outCubic(range(t, 0.2, 0.8)));
      panel(g, 1360, 610, t, 1, E.outCubic(range(t, tB - 0.6, tB)));
      k.flat(); G.source(g, Pm.source ?? 'SIMPLIFIED · SOURCES: DNA PALOMARES SUMMARY REPORT (1975); B. MORAN (2009)', range(t, 0.8, 1.6));
    }, { push: 0.03 });
  }

  return { title, chapter, quote, bignumber, counter, timeline, implosion };
}
