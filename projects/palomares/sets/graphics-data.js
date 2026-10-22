// Palomares data graphics (episode 9): the vertical depth chart of bomb 4.
//   depth   sea surface at the top, a schematic seabed section (coast -> shelf -> canyon wall -> plain), a depth axis in feet.
//           Five cued steps, each a pure function of t:
//             drop    17 Jan: bomb 4 sinks under its chute and touches down on a ridge rim at 355 fathoms (2,130 ft)
//             find    15 Mar: it has slid down a ~400-ft furrow to 2,550 ft on a "70 degree slope"; Alvin finds it
//             lost    24 Mar, ~9 pm: a line from the ship, a short lift (height unknown), the line parts; it falls and
//                     slides away (drawn as a dashed ghost: nine days of not knowing)
//             refind  2 Apr: found again at 2,800 ft, 120 yd downslope: a red bracket "+250 FT DEEPER" on the axis
//             lift    7 Apr: dragged to ~2,850 ft, lifted to the ship ("Weapon on deck" 08:46)
//           params: steps (subset/order of the names above), dropAt, findAt, lostAt, refindAt, liftAt (seconds or spoken
//           words), compare (true: depth marks for divers / Cubmarine / Deep Jeep; false hides), title, kicker, source,
//           cards ({ step: { date, head, sub, chip } } overrides a step's caption card / axis chip)
// Depths: DNA Palomares Summary Report (S01 p.94, ✓); lift depth and times via Moran (S40, ⚑). Never "300 ft deeper" (§13).
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, TAU } = G;

// the steps' captions (RESEARCH §5c, §6, §7; times ⚑ via Moran are marked so on screen)
const STEP = {
  drop: { date: '17 JAN 1966', head: 'It hits the water', sub: ['TOUCHES DOWN ON A RIDGE RIM AT 355 FATHOMS', '(2,130 FT), THEN SLIDES OVER THE EDGE'], chip: ['2,130 FT', 'touch'] },
  find: { date: '15 MAR 1966', head: 'Found: 2,550 ft down', sub: ['BY ALVIN · ON A “70 DEGREE SLOPE”', 'AT THE END OF A ~400-FT FURROW'], chip: ['2,550 FT', 'find'] },
  lost: { date: '24 MAR 1966 · ABOUT 9 PM', head: 'The line parts', sub: ['LIFTED ON ONE LINE · NO SOURCE SAYS HOW HIGH', 'TIME PER BARBARA MORAN'], red: true },
  refind: { date: '2 APR 1966', head: 'Found again: 2,800 ft', sub: ['120 YARDS DOWNSLOPE, ON A GENTLER PLAIN', 'NINE DAYS AFTER THE LINE PARTED'], chip: ['2,800 FT', 'refind'] },
  // lines (4–5 Apr): CURV sets line one, then line two; each drags it a little deeper, to ~2,850 ft (RESEARCH §7)
  lines: { date: '4–5 APR 1966', head: 'Dragged to ~2,850 ft', sub: ['LINE ONE, THEN LINE TWO', 'EACH ONE DRAGGED IT DEEPER'], chip: ['~2,850 FT', 'lift'] },
  lift: { date: '7 APR 1966', head: 'Lifted from ~2,850 ft', sub: ['“WEAPON ON DECK” 08:46 (PETREL LOG, VIA MORAN)', '80 DAYS AFTER THE CRASH'], chip: ['~2,850 FT', 'lift'] },
};
const ORDER = ['drop', 'find', 'lost', 'refind', 'lift'];
// depth marks for scale (RESEARCH §5e 5.10, 5.12; ⚑): diving limits and the small submersibles that could not reach it
const COMPARE = [[120, 'DIVERS ON AIR · 120 FT'], [350, 'HARD-HAT DIVERS · 350 FT'], [600, 'CUBMARINE’S LIMIT · 600 FT'], [2000, 'DEEP JEEP’S RATING · 2,000 FT']];

export default function makeData(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  async function depth(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 13;
    const steps = [].concat(Pm.steps ?? ORDER).filter(s => STEP[s]);
    // default times spread across the shot (the dead-air rule: start early); words or seconds override
    const span = Math.max(1.6, (D - 3.6) / Math.max(1, steps.length - 1));
    const T = {}; steps.forEach((s, i) => { T[s] = G.cue(shot, Pm[`${s}At`], 0.7 + i * span); });
    const has = (s) => T[s] != null;
    const U = G.UPOS, ax = 176, cmp = Pm.compare ?? true;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(0.6);
      const S = G.section([200, 300, 1700, 700], { landK: 0.55 });
      G.drawSection(g, S, { t, dark: 0.55, x1: 2100 });
      // the axis (feet below the surface)
      const ka = E.outCubic(range(t, 0.1, 0.8));
      g.save(); g.globalAlpha = ka; g.fillStyle = P.ink; g.fillRect(ax - 2, S.ys, 4, S.h * ka);
      for (let ft = 0; ft <= 3000; ft += 250) { const y = S.Y(ft), big = ft % 500 === 0; g.fillRect(ax - (big ? 16 : 9), y - 1.5, big ? 16 : 9, 3); if (big) G.fig(g, ft ? `${G.fmt(ft)}` : 'SURFACE', ax - 24, y + 8, { size: ft ? 22 : 16, align: 'right', color: ft ? P.ink : P.inkSoft, track: ft ? 0 : 0.1 }); }
      G.fig(g, 'FEET', ax - 24, S.Y(3000) + 40, { size: 15, align: 'right', color: P.inkSoft, track: 0.14 });
      g.restore();
      // comparison marks: faint dashed lines across, labels at the right edge in the water
      if (cmp) COMPARE.forEach(([ft, lab], i) => {
        const kc = range(t, 0.5 + i * 0.15, 1.1 + i * 0.15) * (1 - 0.55 * range(t, (T[steps[1]] ?? 4) - 0.5, (T[steps[1]] ?? 4) + 0.5)); if (kc <= 0) return;
        const y = S.Y(ft); g.save(); g.globalAlpha = kc; g.strokeStyle = P.tealDeep; g.lineWidth = 1.6; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(ax + 4, y); g.lineTo(1860, y); g.stroke(); g.restore();
        G.text(g, lab, ax + 18, y - 8, { size: 16, weight: 500, fam: F.mono, color: P.tealDeep, track: 0.08, alpha: kc });
      });
      // ---- bomb 4's state at t
      const L = 84, at = (u) => S.at(u, 7);
      let st = null; steps.forEach(s => { if (t >= T[s] - (s === 'drop' ? 0.6 : 0)) st = s; });
      let bx, by, ba, chute = 0, ghost = false, show = false, shipX = null, line = 0, cut = 0, lineTo = null;
      const furrow = has('find') ? E.inOutCubic(range(t, T.find - 1.0, T.find)) : 0;
      if (st === 'drop') {
        const u = E.inOutSine(range(t, T.drop - 0.6, T.drop + 0.9)), [rx, ry] = at(U.touch);
        bx = rx; by = lerp(S.ys - 20, ry, u); ba = Math.PI / 2 - 0.2 * (1 - u); chute = 1; show = true;
      } else if (st === 'find') {
        const u = E.inOutCubic(range(t, T.find - 1.0, T.find)), uu = lerp(U.touch, U.find, u);
        [bx, by] = at(uu); ba = S.ang(uu); chute = 1 - 0.3 * u; show = true;
      } else if (st === 'lost') {
        const [fx, fy] = at(U.find), t0 = T.lost, tLift = t0 + 0.8, tCut = t0 + 1.6, tGone = t0 + 2.6;
        shipX = fx; line = range(t, t0, tLift); lineTo = fy - 10;
        const up = 18 * E.inOutSine(range(t, tLift, tCut));
        if (t < tCut) { bx = fx; by = fy - up; ba = S.ang(U.find); chute = 0.7; show = true; }
        else { const u = E.inOutCubic(range(t, tCut + 0.1, tGone)), uu = lerp(U.find, U.refind, u); [bx, by] = at(uu); ba = S.ang(uu) + Math.sin(u * Math.PI) * 0.9; chute = 0.6; show = true; ghost = t > tGone; cut = range(t, tCut, tCut + 0.5); }
        if (t >= tCut && t < tCut + 0.1) by = fy - up * (1 - range(t, tCut, tCut + 0.1));
        if (t > tCut + 0.3) ghost = true; // from the break on it is a dashed ghost: nine days of not knowing where
      } else if (st === 'lines') {
        // two buoyed lines come down on their cues; the bomb is dragged from 2,800 ft to ~2,850 ft
        const t1 = T.lines, t2 = G.cue(shot, Pm.twoAt, t1 + 1.3), t3 = G.cue(shot, Pm.deeperAt, t2 + 0.9), d = E.inOutCubic(range(t, t1 + 0.6, t1 + 1.4)) * 0.5 + E.inOutCubic(range(t, t3 - 0.2, t3 + 0.8)) * 0.5;
        const uu = lerp(U.refind, U.lift, d); [bx, by] = at(uu); ba = S.ang(uu); chute = 0.6; show = true;
        const sx0 = at(U.lift)[0]; G.ship(g, sx0 + 34, S.ys, 1.0, { alpha: range(t, 0.2, 0.6) });
        // the two lines fan apart at the surface (bow and stern of the ship) and meet the bundle at two points; line 2 in teal
        [[t1, -30, P.ink, 'LINE 1'], [t2, 34, P.tealDeep, 'LINE 2']].forEach(([tl, dx, lc, lb]) => { const kl = E.outCubic(range(t, tl, tl + 0.6)); if (kl <= 0) return; g.save(); g.strokeStyle = lc; g.lineWidth = 3.5; g.beginPath(); g.moveTo(sx0 + dx, S.ys + 10); g.lineTo(lerp(sx0 + dx, bx + dx * 0.25, kl), lerp(S.ys + 10, by - 12, kl)); g.stroke(); g.restore();
          if (kl >= 1) G.text(g, lb, sx0 + dx + (dx > 0 ? 14 : -14), S.ys + 70 + (dx > 0 ? 40 : 0), { size: 18, weight: 600, fam: F.mono, align: dx > 0 ? 'left' : 'right', color: lc, track: 0.08 }); });
      } else if (st === 'refind') {
        [bx, by] = at(U.refind); ba = S.ang(U.refind); chute = 0.6; show = true;
      } else if (st === 'lift') {
        const t0 = T.lift, d = E.inOutCubic(range(t, t0 - 0.2, t0 + 0.5)), uu = lerp(U.refind, U.lift, d), [lx, ly] = at(uu), u = E.inOutCubic(range(t, t0 + 0.9, t0 + 2.4));
        shipX = at(U.lift)[0]; line = range(t, t0 + 0.3, t0 + 0.85); bx = lx; by = lerp(ly, S.ys + 30, u); ba = lerp(S.ang(uu), Math.PI / 2 * 0.9, u); chute = 0.55; show = true; lineTo = by - 10;
      }
      // the furrow it left (a groove down the wall, rim -> 2,550 ft)
      if (furrow > 0) { g.save(); g.strokeStyle = 'rgba(20,35,61,0.55)'; g.lineWidth = 3; g.setLineDash([2, 6]); g.beginPath(); const n = 30; for (let i = 0; i <= n * furrow; i++) { const [x, y] = S.at(lerp(U.touch, U.find, i / n), 2); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore(); }
      // the old spot after the line parts: a dashed ghost stays where it was found
      if (has('lost') && t > T.lost + 1.6) { const [fx, fy] = at(U.find); G.bomb(g, fx, fy, S.ang(U.find), L, { ghost: true, alpha: 0.45 }); }
      if (shipX != null) {
        const sa = st === 'lost' ? 1 - range(t, T.lost + 2.6, T.lost + 3.2) : range(t, T.lift + 0.1, T.lift + 0.5);
        G.ship(g, shipX + 34, S.ys, 1.0, { alpha: sa });
        if (line > 0 && sa > 0) { g.save(); g.globalAlpha = sa; const x = shipX, y0 = S.ys + 10, yE = lerp(y0, lineTo, E.outCubic(line));
          if (cut <= 0) { g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, yE); g.stroke(); }
          else { const gy = lerp(y0, lineTo, 0.75), upk = E.outCubic(cut) * (gy - y0) * 0.5; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + Math.sin(cut * 10) * 8 * (1 - cut), gy - upk); g.stroke();
            // the frayed end
            // the anchor on the ship's line, and the short frayed stump hanging below it (the break was below the anchor)
            const ay = gy - upk; g.lineWidth = 3; g.beginPath(); g.moveTo(x, ay - 14); g.lineTo(x, ay); g.moveTo(x - 10, ay - 4); g.quadraticCurveTo(x, ay + 6, x + 10, ay - 4); g.moveTo(x - 6, ay - 12); g.lineTo(x + 6, ay - 12); g.stroke();
            g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, ay); g.lineTo(x + 2, ay + 22); g.stroke();
            g.lineWidth = 1.6; for (let q = -2; q <= 2; q++) { g.beginPath(); g.moveTo(x + 2, ay + 22); g.lineTo(x + 2 + q * 4, ay + 32); g.stroke(); } }
          g.restore(); }
      }
      if (show) G.bomb(g, bx, by, ba, L, { chute, ghost, t });
      if (ghost) G.text(g, '?', bx + 54, by - 20, { size: 54, weight: 800, color: P.ink, alpha: 0.9 });
      // the red pulse where the line parted (the one red, during the loss)
      if (st === 'lost') { const [fx, fy] = at(U.find), gy0 = lerp(S.ys + 10, fy - 10, 0.75), cu = range(t, T.lost + 1.6, T.lost + 2.1); G.pulse(g, fx + 2, gy0 - E.outCubic(cu) * (gy0 - S.ys - 10) * 0.5 + 28, t, range(t, T.lost + 1.6, T.lost + 2.0) * (1 - range(t, T.lost + 3.6, T.lost + 4.2)), { r: 10 }); }
      // ---- depth chips on the axis (each step's depth), dashed guides across to the spot
      k.view(0.8);
      const chips = steps.filter(s => STEP[s].chip && t >= T[s] - (s === 'drop' ? 0 : 0.2));
      chips.forEach((s) => {
        const [lab, key] = (Pm.cards?.[s]?.chip ?? STEP[s].chip), kc = range(t, T[s] + (s === 'drop' ? 0.5 : 0), T[s] + (s === 'drop' ? 1.0 : 0.5));
        if (s === 'refind' && has('lift') && t > T.lift + 0.4) return; // 2,800 and 2,850 sit 12 px apart: the lift chip replaces it
        const ft = G.DEPTH[key] ?? G.DEPTH.lift, y = S.Y(ft), cur = s === st || (st === 'lost' && s === 'find');
        const [px] = at(U[key] ?? U.lift);
        g.save(); g.globalAlpha = kc * (cur ? 0.9 : 0.4); g.strokeStyle = P.ink; g.lineWidth = 1.6; g.setLineDash([3, 6]); g.beginPath(); g.moveTo(ax + 4, y); g.lineTo(px - 8, y); g.stroke(); g.restore();
        G.pill(g, lab, ax + 14, y, { size: 19, k: kc, fam: F.mono, weight: 500, fill: cur ? P.ink : P.white, color: cur ? P.white : P.ink, alpha: cur ? 1 : 0.85, lift: 0.4 });
      });
      // +250 FT DEEPER: a red bracket on the axis from 2,550 to 2,800 (S01; never "300 ft", §13)
      if (has('refind') && has('find')) {
        const kb = range(t, T.refind + 0.3, T.refind + 1.0); if (kb > 0) {
          const y1 = S.Y(G.DEPTH.find), y2 = S.Y(G.DEPTH.refind), bxx = ax + 150, col = has('lift') && t > T.lift ? P.ink : P.red;
          g.save(); g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(bxx - 14, y1); g.lineTo(bxx, y1); g.lineTo(bxx, lerp(y1, y2, E.outCubic(kb))); if (kb >= 1) g.lineTo(bxx - 14, y2); g.stroke(); g.restore();
          G.slab(g, '+250 FT DEEPER', bxx + 22, (y1 + y2) / 2, { size: 26, fill: col, k: range(t, T.refind + 0.7, T.refind + 1.3) });
        }
      }
      // ---- the caption card for the current step (over the seabed, lower left), with a leader to the bomb
      k.view(1);
      if (st) {
        const C = { ...STEP[st], ...(Pm.cards?.[st] ?? {}) }, kc = E.outCubic(range(t, T[st] - (st === 'drop' ? 0.3 : 0.1), T[st] + 0.5)), cx = 250, cy = 540, cw = 600;
        const red = C.red && st === 'lost', ch = 196;
        g.save(); g.globalAlpha = kc; g.translate(0, (1 - kc) * 16);
        G.card(g, cx, cy, cw, ch, { r: 18, lift: 1.0 });
        g.fillStyle = red ? P.red : P.teal; g.fillRect(cx, cy + 22, 7, ch - 44);
        G.text(g, C.date, cx + 36, cy + 50, { size: 19, weight: 500, fam: F.mono, color: red ? P.red : P.inkSoft, track: 0.12 });
        G.text(g, C.head, cx + 34, cy + 104, { size: 46, weight: 800, color: P.ink, maxW: cw - 64 });
        C.sub.forEach((l, i) => G.text(g, l, cx + 36, cy + 142 + i * 26, { size: 16, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.08, maxW: cw - 64 }));
        g.restore();
        if (show && kc > 0.5) { g.save(); g.globalAlpha = (kc - 0.5) * 2 * 0.7; g.strokeStyle = P.ink; g.lineWidth = 2; g.setLineDash([2, 6]); g.beginPath(); g.moveTo(cx + cw, cy + ch / 2); g.lineTo(bx - 50, by); g.stroke(); g.restore(); }
      }
      // ---- header
      k.flat();
      G.kicker(g, Pm.kicker ?? 'BOMB 4 · FEET BELOW THE SURFACE', 110, 104, range(t, 0.05, 0.6));
      G.riseText(g, Pm.title ?? 'About half a mile down', 110, 180, range(t, 0.12, 0.9), { size: 60, weight: 800 });
      G.source(g, Pm.source ?? 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975); B. MORAN (2009) · 2,550–2,850 FT ≈ 777–870 M · SECTION SCHEMATIC, NOT TO HORIZONTAL SCALE', range(t, 0.6, 1.4), { size: 14 });
    }, { push: 0.03, dx: 14, dy: 6 });
  }

  return { depth };
}
