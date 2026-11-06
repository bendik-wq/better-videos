// NOTRE-DAME (episode 10) chapter 5 "WHAT HELD": the `held` set, Paper & Spring look (STYLE-BIBLE.md). Registered in
// nd-sets.js SETS (additive). Uses the nd-sets KIT lazily (inside the factory only), so the circular import is safe.
// Every view is a separate tabletop toy or card on the drafting table (never a section of the real building).
//
// view 'vault'   the demonstration shell (VISUALS L97–98): a lone curved card vault on two piers, label
//                `STONE VAULT · DEMONSTRATION`, a brass tweezer arm above it. band 0..1 (+bandAt/bandDur): a brass flame band
//                sits on top of the shell, the space under it stays clean paper. arm 0..1 (+armAt/armDur): the arm swings
//                from parked to over the shell. rain 0..1 (+rainAt/rainDur): the full rain of burning sticks drops, most stop on
//                the shell's back; one breaks through (red 'stick'). label {text, sub, red, at} a pinned card with a red
//                notched underline under `red` (red 'label').
// view 'plan'    the cathedral plan on a survey sheet (L99): plain labels, holes [{ at, label }] at 'crossing' | 'nave' |
//                'north'; the red ring ticks hole to hole (red 'ring'), leaving ink dashed rings behind.
// view 'gable'   night plate (L107): the north-arm gable card tips toward the street and settles back. tipAt (+tipDur),
//                tip (max tilt, deg), cracksAt (ink crack lines draw on). red 'arc' (the tilt arc).
// view 'arches'  day, the 2019 works (L109). mode 'close' (one flying buttress: arrows pressing on the wall, the empty
//                counter-arrow slot, arch slides in at archAt) | 'row' (both rows of flyers, archesAt/archesDur: 28 arches slide in,
//                counter pill). arrowsAt, weightAt (tag). red 'slot' | 'arch' (+ redSeq).
// view 'rooster' the dented copper rooster on a card plinth among rubble (L110). dentAt (tag), hatchAt (a small hatch opens:
//                the relic box, tag). red 'dent'.
// view 'frame'   the bell-frame toy alone on the table (L102–103, L112). char (lower beams), corner 0..1 (the charred south-east
//                corner), stair 0..1 (the stair card to the upper bells, charred), strip true (the stair-strip toy folded flat
//                with a coiled teal hose), loupe {x, y, r, z} (+ loupeTo {…, at, dur}), scars [i, j] (+scarsAt), ghostFlameAt,
//                ghostWaterAt, litAt (the frame lit full and steady), swingBell i (+swingAt: the bell swings once and stops),
//                redBell i (dashed red outline round that bell; red 'bell'), red 'corner' (marker loop) | 'bell' | 'none'.
// view 'type'    TYPE card (L104): text (Instrument Serif), plates [{text, sub, at}], ap {text, sub, at} (small plain plate),
//                red 'q' (dashed ring on the question mark) | 'under' (notched underline under `underline`). headline mode:
//                headline true, kicker, by.
// view 'table'   the night briefing table (L105, L105a, callback): dial-head figures seated, plates, the president figure;
//                card 'donothing' (DO NOTHING · 05:00, both towers fading: red 'tower') | 'send' (SEND THEM IN face up: red 'card').
// view 'margin'  the roofless card model at night between the two wheels (L105, L105a): bracket `¼ h – ½ h · MARGIN (estimate)`
//                drops over the model (bracketAt), touching neither wheel; empty true (the bracket's inside stays empty, an index
//                stops short of it). red 'bracket'.
// every view: sky 'day'|'night', cam {x,y,z}, zoomTo (keyframes ok), chips [{text, sub, at}], strip [line, line2] (+stripAt,
//   stripUntil), tags [{at:[x,y], to:[x,y], text, sub, inAt}], flap 'TEXT' (+flapSub, flapAt), source, kicker
import * as M from '/engine/motion.js';
import { KIT } from './nd-sets.js';

const clamp = M.clamp, lerp = (a, b, u) => a + (b - a) * u, range = (t, a, b) => clamp((t - a) / (b - a));
const fract = (x) => x - Math.floor(x), hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const TAU = Math.PI * 2, D = Math.PI / 180;
function an(p, key, t, def = 0, fb = 0.5, ease = M.E.inOutSine) {
  const v = p[key] ?? def; if (typeof v !== 'number') return v; const at = p[key + 'At']; if (at == null) return v;
  return v * ease(range(t, num(at, fb), num(at, fb) + num(p[key + 'Dur'], 1.6)));
}
function redAt(p, t, def) { let r = p.red ?? def; if (p.redSeq) for (const q of p.redSeq) if (t >= num(q.at, 0)) r = q.red; return r; }
const on = (t, at, d = 0.4) => (at == null ? 1 : M.E.outCubic(range(t, num(at, 0), num(at, 0) + d)));

// ---------------------------------------------------------------- screen-space paper pieces
function chipStack(K, g, chips, t) {
  const { P, pen, rrect, mono } = K; let y = 70;
  for (const c of chips) { const u = range(t, num(c.at, 0), num(c.at, 0) + 0.35); if (u <= 0) continue;
    if (c.until != null && t > num(c.until, 1e9) + 0.4) continue;
    const uo = c.until == null ? 1 : 1 - range(t, num(c.until, 1e9), num(c.until, 1e9) + 0.4);
    g.save(); g.font = '600 30px "Archivo Narrow"'; const w1 = g.measureText(c.text).width; g.font = '500 19px "Plex Mono"'; g.letterSpacing = '3px';
    const subs = [].concat(c.sub ?? []); const w2 = Math.max(0, ...subs.map(s => g.measureText(String(s).toUpperCase()).width)); g.restore();
    const W = Math.max(w1, w2) + 56, H = 62 + subs.length * 30, x = (c.x ?? 1920 - 80 - W) + (1 - M.E.outCubic(u) * uo) * 600;
    pen(g, rrect(x, y, W, H, 6), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, rrect(x + 12, y - 8, 30, 18, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
    g.save(); g.font = '600 30px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(c.text, x + 28, y + 44); g.restore();
    subs.forEach((s, i) => mono(g, s, x + 28, y + 76 + i * 30, 19, P.ink70));
    y += H + 22; }
}
function lowerStrip(K, g, lines, t, at = 0, until = null, big = 1, top = false) {
  const { P, pen, rect, mono } = K; const ls = [].concat(lines);
  const u = M.E.outCubic(range(t, at, at + 0.45)) * (until == null ? 1 : 1 - M.E.inCubic(range(t, until, until + 0.4))); if (u <= 0) return;
  const sm = (i) => i >= big;
  let w = 0; g.save(); ls.forEach((l, i) => { g.font = sm(i) ? '500 21px "Plex Mono"' : '600 32px "Archivo Narrow"'; g.letterSpacing = sm(i) ? '3px' : '0px'; w = Math.max(w, g.measureText(sm(i) ? String(l).toUpperCase() : l).width); }); g.restore();
  const W = Math.min(1760, w + 80), H = 34 + ls.length * 40, x0 = 960 - W / 2, y0 = top ? 80 : 1080 - 110 - H;
  g.save(); g.translate((1 - u) * -1900, 0);
  pen(g, rect(x0, y0, W, H), { fill: P.kraft, lw: 2, shadow: true, breaks: false, highlight: false });
  ls.forEach((l, i) => { if (sm(i)) mono(g, l, x0 + 40, y0 + 52 + i * 40, 21, P.ink70); else { g.font = '600 32px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(l, x0 + 40, y0 + 52 + i * 40); } });
  g.restore();
}
function flapCard(K, g, t, p) {
  const { P, pen, rrect, mono } = K, x = p.flapX ?? 96, y = p.flapY ?? 64, at = num(p.flapAt, 0.15), to = String(p.flap), from = p.flapFrom ?? null, sw = from ? range(t, at, at + 0.5) : 1;
  const u = M.E.outCubic(range(t, at - 0.3, at + 0.1)); if (u <= 0) return;
  const txt0 = sw < 0.5 ? String(from) : to, sq = from ? Math.abs(Math.cos(sw * Math.PI)) : 1;
  g.save(); g.font = '700 60px "Archivo Narrow"'; g.letterSpacing = '4px'; const w = Math.max(g.measureText(to).width, from ? g.measureText(String(from)).width : 0) + 64; g.restore();
  const H = p.flapSub ? 136 : 102;
  g.save(); g.translate(0, (1 - u) * -220);
  pen(g, rrect(x, y, w, H, 8), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.12, shadeColor: P.kraftD, box: [x, y, x + w, y + H] });
  pen(g, rrect(x + 22, y - 10, 34, 20, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
  g.save(); g.translate(x + w / 2, y + 52); g.scale(1, Math.max(0.06, sq)); g.font = '700 60px "Archivo Narrow"'; g.letterSpacing = '4px'; g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt0, 0, 2); g.restore();
  g.fillStyle = 'rgba(20,35,61,0.28)'; g.fillRect(x + 8, y + 51, w - 16, 3);
  if (p.flapSub) mono(g, p.flapSub, x + 32, y + 118, 20, P.ink70);
  g.restore();
}
// a pinned label card (brass pin) with an optional red notched underline under one word (drawn on at `at`)
function labelCard(K, g, x, y, text, { sub = null, red = null, at = 0, t = 0, size = 46, night = false, redOn = true } = {}) {
  const { P, pen, rect, circle, mono } = K; const u = on(t, at, 0.35); if (u <= 0) return;
  g.save(); g.font = `700 ${size}px "Archivo Narrow"`; g.letterSpacing = '3px'; const w = g.measureText(text).width; g.restore();
  g.save(); g.font = '500 19px "Plex Mono"'; g.letterSpacing = '3px'; const ws = sub ? g.measureText(String(sub).toUpperCase()).width : 0; g.restore();
  const W = Math.max(w, ws) + 70, H = size + 50 + (sub ? 34 : 0);
  g.save(); g.globalAlpha *= u; g.translate(0, (1 - u) * -30);
  pen(g, rect(x, y, W, H), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.12, shadeColor: P.kraftD, box: [x, y, x + W, y + H] });
  pen(g, circle(x + W / 2, y + 12, 8), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  g.font = `700 ${size}px "Archivo Narrow"`; g.letterSpacing = '3px'; g.fillStyle = P.ink; g.textBaseline = 'alphabetic'; g.fillText(text, x + 35, y + 22 + size);
  if (red && redOn) { const i0 = text.indexOf(red); if (i0 >= 0) { const x0 = x + 35 + g.measureText(text.slice(0, i0)).width, ww = g.measureText(red).width - 3, v = M.E.outCubic(range(t, num(at, 0) + 0.3, num(at, 0) + 0.8));
    g.fillStyle = P.red; const yy = y + 34 + size; g.fillRect(x0, yy, ww * v, 7); g.beginPath(); g.moveTo(x0 + ww * v, yy - 4); g.lineTo(x0 + ww * v + 12, yy + 3.5); g.lineTo(x0 + ww * v, yy + 11); g.fill(); } }
  g.letterSpacing = '0px';
  if (sub) mono(g, sub, x + 35, y + size + 72, 19, P.ink70);
  g.restore();
  return [x + W / 2, y + H];
}
// paper night: kraft under a navy halftone (never a glowing ember on deep navy)
function nightPlate(K, g, t) {
  const { P, halftone, mix } = K; g.fillStyle = mix(P.kraft, P.night, 0.62); g.fillRect(-200, -200, 2320, 1480);
  halftone(g, [-200, -200, 2120, 1300], (x, y) => clamp(0.42 + 0.3 * (1 - y / 1100)), P.night, { pitch: 10, max: 0.9 });
  const r = M.rng(5); g.fillStyle = rgba(P.paper, 0.5); for (let i = 0; i < 40; i++) g.fillRect(r() * 1920, r() * 360, 2, 2);
}
function table(K, g, t, night) { const { P, lampPool } = K; if (night) nightPlate(K, g, t); else lampPool(g, 620, 360, 900, P.paper, P.card); }
// a pointed arch curve (outer edge) from (cx-half, yB) through the apex (cx, yB-rise) to (cx+half, yB), sampled
function archCurve(cx, yB, half, rise, n = 28) {
  const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };
  const L = [], R = [];
  for (let i = 0; i <= n; i++) { const u = i / n; L.push([bez(cx - half, cx - half, cx - half * 0.42, cx, u), bez(yB, yB - rise * 0.72, yB - rise * 0.96, yB - rise, u)]); }
  for (let i = 1; i <= n; i++) { const u = i / n; R.push([bez(cx, cx + half * 0.42, cx + half, cx + half, u), bez(yB - rise, yB - rise * 0.96, yB - rise * 0.72, yB, u)]); }
  return L.concat(R);
}
const yOn = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if ((x - x0) * (x - x1) <= 0 && x1 !== x0) return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts.at(-1)[1]; };
const slopeOn = (pts, x) => Math.atan2(yOn(pts, x + 3) - yOn(pts, x - 3), 6);

// ================================================================= view: vault (the demonstration shell)
function vaultView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, flame, halftone, lampShade, tag, redRing, beam, OAK, mix, puff } = K;
  const cx = 900, yB = 600, half = 360, rise = 240, th = 34;
  const outer = archCurve(cx, yB, half, rise), inner = archCurve(cx, yB, half - th, rise - th);
  // the floor card: "the church" below, clean paper
  pen(g, rect(cx - half - 230, 800, 2 * half + 460, 30), { fill: P.kraft, lw: 2.5, shadow: true, breaks: false, highlight: false });
  mono(g, 'THE CHURCH BELOW', cx, 760, 22, P.ink40, 'center');
  // piers
  for (const x0 of [cx - half - 40, cx + half - 30]) pen(g, rect(x0, yB - 6, 70, 806 - yB), { fill: P.card, lw: 3, shadow: true, shade: lampShade([x0, yB, x0 + 70, 800], 0.05, 0.4, 0.3), shadeColor: P.kraftD, box: [x0, yB, x0 + 70, 800] });
  // the shell (stone card), voussoir joints, halftone underside
  const brk = an(p, 'rain', t, 0) > 0.55 ? 1 : 0, bx = cx + 130;
  const shell = (gg) => { gg.beginPath(); outer.forEach(([x, y], i) => (i ? gg.lineTo(x, y) : gg.moveTo(x, y))); for (let i = inner.length - 1; i >= 0; i--) gg.lineTo(...inner[i]); gg.closePath(); };
  pen(g, shell, { fill: P.card, lw: 3, shadow: true, shadowOff: [12, 16], shade: (x, y) => clamp((y - (yB - rise)) / rise * 0.35), shadeColor: P.kraftD, box: [cx - half, yB - rise, cx + half, yB] });
  g.save(); g.strokeStyle = P.ink40; g.lineWidth = 1.4; g.beginPath(); for (let i = 2; i < outer.length - 1; i += 3) { g.moveTo(...outer[i]); g.lineTo(...inner[i]); } g.stroke(); g.restore();
  if (brk) { const yo = yOn(outer, bx), yi = yOn(inner, bx); pen(g, poly([[bx - 16, yo - 2], [bx + 4, yo + 3], [bx + 18, yo], [bx + 12, yi + 4], [bx - 6, yi], [bx - 20, yi + 3]]), { fill: P.ink70, lw: 2, breaks: false, highlight: false }); }
  // the brass tweezer arm on its stand
  const arm = an(p, 'arm', t, 0), tipX = lerp(1330, cx + 20, M.E.inOutCubic(arm)), tipY = 170;
  pen(g, rect(1560, 120, 26, 690), { fill: P.brassL, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brass, box: [1560, 120, 1586, 810] });
  pen(g, rrect(1500, 800, 150, 34, 6), { fill: P.brass, lw: 2.5, shadow: true, breaks: false, highlight: false });
  pen(g, rect(tipX - 10, 112, 1586 - tipX + 10, 22), { fill: P.brassL, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.25, shadeColor: P.brass, box: [tipX, 112, 1586, 134] });
  pen(g, circle(1573, 123, 16), { fill: P.brass, lw: 2.5, breaks: false, highlight: false });
  const rain = an(p, 'rain', t, 0), open = rain > 0 ? 1 : 0;
  for (const s of [-1, 1]) pen(g, poly([[tipX - 6, 130], [tipX + 6, 130], [tipX + s * (6 + 14 * open), tipY + 30], [tipX + s * (2 + 14 * open), tipY + 30]]), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  // the flame band on the shell's back (L97): burning timbers lie on top; flames above; nothing below
  const band = an(p, 'band', t, 0);
  if (band > 0) { const xs = [-0.78, -0.6, -0.42, -0.24, -0.06, 0.12, 0.3, 0.48, 0.66, 0.8];
    xs.forEach((v, i) => { const x = cx + v * half, y = yOn(outer, x), a = slopeOn(outer, x); g.save(); g.translate(x, y - 6); g.rotate(a); beam(g, [-34, 0], [34, 0], 9, { col: OAK.M, char: 0.7, lw: 1.4 }); g.restore(); });
    xs.forEach((v, i) => { if (range(band, i / xs.length * 0.7, i / xs.length * 0.7 + 0.3) <= 0) return; const x = cx + v * half + 8, y = yOn(outer, x);
      flame(g, x, y - 8, (46 + 34 * hash(i)) * range(band, i / xs.length * 0.7, i / xs.length * 0.7 + 0.3), 44, t, 20 + i, { lean: 0.15 }); });
  }
  // the rain (L98): sticks drop from the tweezers, land on the shell's back and stay; one breaks through
  if (rain > 0) { const n = 30, T = p.rainDur != null ? num(p.rainDur, 2.4) : 2.4, t0 = num(p.rainAt, 0.5);
    for (let i = 0; i < n; i++) { const bk = i === 13, ti = t0 + (i / n) * T * 0.75, u = clamp((t - ti) / 0.6); if (t < ti) continue;
      const lx = bk ? bx : cx + (hash(i * 3.1) - 0.5) * 1.7 * half * 0.92, ly = yOn(outer, lx) - 6, sx = tipX + (hash(i) - 0.5) * 30, sy = tipY + 30;
      let x, y, a;
      if (!bk || u < 1) { x = lerp(sx, lx, u); y = lerp(sy, ly, u * u); a = lerp(hash(i + 5) * 3, slopeOn(outer, lx) + (hash(i + 9) - 0.5) * 0.5, u); }
      if (bk && u >= 1) { const v = clamp((t - ti - 0.6) / 0.35); x = bx; y = lerp(ly, 790, v * v); a = lerp(slopeOn(outer, lx), 0.08, v); }
      g.save(); g.translate(x, y); g.rotate(a); beam(g, [-28, 0], [28, 0], 8, { col: OAK.M, char: 0.6, lw: 1.3 }); g.restore();
      if (i % 3 === 0 && !bk) flame(g, x, y - 4, 22 + 10 * hash(i), 22, t, 40 + i, { lean: 0.1 });
      if (u >= 1 && !bk) { const d = clamp((t - ti - 0.6) / 0.7); if (d < 1) puff(g, x, y - 10 - d * 30, 10 + 14 * d, 500 + i, { fill: mix(P.ink40, P.card, 0.5), shadeCol: P.ink70, line: P.ink40, lw: 1, shade: 0.4 }); }
      if (bk && u >= 1 && red === 'stick') { const v = clamp((t - ti - 0.95) / 0.3); if (v > 0) redRing(g, bx, 786, 50, P.red, 3.5); }
    }
  }
  if (p.label) { const L = p.label; labelCard(K, g, L.x ?? 150, L.y ?? 170, L.text, { sub: L.sub, red: L.red, at: L.at ?? 0.2, t, size: L.size ?? 44, redOn: red === 'label' }); }
  tag(g, cx - half * 0.55, yOn(outer, cx - half * 0.55) + 20, cx - half - 160, 660, p.shellLabel ?? 'Stone vault', { size: 28, swing: -2, sub: 'DEMONSTRATION · NOT THE BUILDING' });
}

// ================================================================= view: plan (the three holes)
const HOLE = { crossing: [1010, 560], nave: [700, 560], north: [1010, 352] };
function planView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, halftone, lampShade, tag, redRing, mix, hatch } = K;
  // the survey sheet
  pen(g, rect(150, 110, 1620, 870), { fill: P.paper, lw: 2.5, shadow: true, shadowOff: [14, 16], breaks: false, highlight: false });
  g.save(); g.strokeStyle = rgba(P.teal, 0.18); g.lineWidth = 1; g.beginPath(); for (let x = 190; x < 1760; x += 40) { g.moveTo(x, 120); g.lineTo(x, 970); } for (let y = 130; y < 970; y += 40) { g.moveTo(160, y); g.lineTo(1760, y); } g.stroke(); g.restore();
  mono(g, 'PLAN · NOTRE-DAME DE PARIS · THE VAULTS', 190, 160, 22, P.ink);
  // north arrow
  g.save(); g.translate(1660, 220); pen(g, poly([[0, -44], [16, 18], [0, 8], [-16, 18]]), { fill: P.ink, lw: 2, breaks: false, highlight: false }); g.restore(); mono(g, 'N', 1660, 270, 22, P.ink, 'center', 600);
  // the cross: nave (west, left), transept (north up), choir + apse (east)
  const cross = [[300, 450], [930, 450], [930, 300], [1090, 300], [1090, 450], [1400, 450], [1400, 670], [1090, 670], [1090, 820], [930, 820], [930, 670], [300, 670]];
  pen(g, poly(cross), { fill: P.card, lw: 3, shadow: true, shade: lampShade([300, 300, 1530, 820], 0.02, 0.22, 0.5), shadeColor: P.kraftD, box: [300, 300, 1530, 820] });
  pen(g, (gg) => { gg.beginPath(); gg.moveTo(1400, 450); gg.arc(1400, 560, 110, -Math.PI / 2, Math.PI / 2); gg.closePath(); }, { fill: P.card, lw: 3, shadow: true, breaks: false, highlight: false });
  for (const [x, y] of [[230, 430], [230, 580]]) pen(g, rect(x, y, 90, 110), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false, hatched: true, hatchColor: P.ink40, box: [x, y, x + 90, y + 110] });
  mono(g, 'TOWERS', 275, 418, 16, P.ink70, 'center');
  // vault bays: ribs (X) in the central vessel, aisle lines
  const bay = (x0, y0, x1, y1) => { g.moveTo(x0, y0); g.lineTo(x1, y1); g.moveTo(x1, y0); g.lineTo(x0, y1); g.rect(x0, y0, x1 - x0, y1 - y0); };
  g.save(); g.strokeStyle = P.ink70; g.lineWidth = 1.4; g.beginPath();
  for (let i = 0; i < 9; i++) bay(320 + i * 67.7, 500, 320 + (i + 1) * 67.7, 620);
  bay(950, 500, 1070, 620); bay(950, 320, 1070, 410); bay(950, 410, 1070, 500); bay(950, 620, 1070, 710); bay(950, 710, 1070, 800);
  for (let i = 0; i < 5; i++) bay(1090 + i * 62, 500, 1090 + (i + 1) * 62, 620);
  g.stroke(); g.strokeStyle = P.ink40; g.lineWidth = 1.2; g.beginPath(); for (const y of [475, 645]) { g.moveTo(300, y); g.lineTo(930, y); g.moveTo(1090, y); g.lineTo(1400, y); } g.stroke(); g.restore();
  // holes: an ink break inside the bay, an ink dashed ring around it once the red ring has moved on
  const holes = p.holes ?? [];
  const ats = holes.map((h, i) => num(h.at, 1 + i * 2.5));
  holes.forEach((h, i) => { const [x, y] = HOLE[h.where] ?? HOLE.crossing, u = range(t, ats[i], ats[i] + 0.25); if (u <= 0) return;
    const r = M.rng(30 + i), pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, rr = (16 + r() * 16) * u; pts.push([x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr]); }
    pen(g, poly(pts), { fill: P.ink70, lw: 2, breaks: false, highlight: false, hatched: true, hatchColor: P.ink, box: [x - 50, y - 40, x + 50, y + 40] });
    const later = i < holes.length - 1 && t >= ats[i + 1]; if (later || red !== 'ring') redRing(g, x, y, 58, P.ink, 2.5);
    if (h.label) { const tx = h.to?.[0] ?? x + 120, ty = h.to?.[1] ?? y + 140; tag(g, x + 30, y + 30, tx, ty, h.label, { size: 30, swing: (i % 2 ? 2 : -2), sub: h.sub }); } });
  // the one red ring: ticks from hole to hole on its cue
  if (red === 'ring' && holes.length) { let k = 0; for (let i = 0; i < holes.length; i++) if (t >= ats[i] - 0.3) k = i;
    const from = HOLE[holes[Math.max(0, k - 1)].where], to = HOLE[holes[k].where], u = k === 0 ? 1 : M.E.inOutCubic(range(t, ats[k] - 0.3, ats[k]));
    const x = lerp(from[0], to[0], u), y = lerp(from[1], to[1], u); g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.setLineDash([12, 8]); g.beginPath(); g.arc(x, y, 64, 0, TAU); g.stroke(); g.restore();
    g.fillStyle = P.red; g.beginPath(); g.moveTo(x + 64, y - 12); g.lineTo(x + 82, y); g.lineTo(x + 64, y + 12); g.fill(); }
  if (p.count) PILL = `VAULT HOLES · ${holes.filter((h, i) => t >= ats[i]).length} / 3`;
}

// ================================================================= view: gable (night plate, the north-arm gable tips and settles)
// three-quarter view: the gable face looks down-left toward the street (foreground left); the arm's side wall recedes up-right.
// Tipping toward the street = the face rotates about its base line, outward (toward the viewer / the street), then settles back.
function gableView(K, g, t, p, red) {
  const { P, pen, rect, poly, mono, tag, mix, halftone } = K;
  const t0 = num(p.tipAt, 1.5), dur = num(p.tipDur, 2.4), u = range(t, t0, t0 + dur), mx = (p.tip ?? 9) * D;
  const tipU = (v) => (v <= 0 ? 0 : v < 0.42 ? M.E.inOutSine(v / 0.42) : Math.max(0, 1 - M.E.outCubic((v - 0.42) / 0.58)) + Math.sin(clamp((v - 0.42) / 0.58) * Math.PI * 3) * 0.07 * (1 - clamp((v - 0.42) / 0.58)));
  const ang = mx * tipU(u);
  const O = [430, 760], fa = [0.62, 0.21], sa = [0.88, -0.15], W = 560, Hw = 330, Hg = 270, k = 1;
  const G = (uu, h, a = ang) => [O[0] + uu * fa[0] - h * Math.sin(a) * sa[0], O[1] + uu * fa[1] - h * Math.sin(a) * sa[1] - h * Math.cos(a)];
  const S2 = (v, h) => { const b = [O[0] + W * fa[0], O[1] + W * fa[1]]; return [b[0] + v * sa[0], b[1] + v * sa[1] - h]; };
  const L = { stone: '#d9cdb7', stoneD: '#a99e8b', stoneDD: '#7f7869', glass: '#2c2a30' };
  const SW = 820;
  { const e = S2(SW + 600, 0); pen(g, poly([[-200, 1300], [-200, O[1] - 60], O, S2(0, 0), e, [2120, e[1] - 40], [2120, 1300]]), { fill: '#5b5560', lw: 2.5, breaks: false, highlight: false }); }
  // the street (foreground): pavement band parallel to the face, kerb, lamp posts
  const st = (uu, d) => [O[0] + uu * fa[0] - d * sa[0], O[1] + uu * fa[1] - d * sa[1]];
  pen(g, poly([st(-900, 0), st(W + 500, 0), st(W + 500, 900), st(-900, 900)]), { fill: '#4b4f5e', lw: 2.5, breaks: false, highlight: false, hatched: true, hatchColor: '#2c3142', box: [-200, 500, 2100, 1300] });
  pen(g, poly([st(-900, 0), st(W + 500, 0), st(W + 500, 60), st(-900, 60)]), { fill: '#6d6156', lw: 2.5, breaks: false, highlight: false });
  { const [lx, ly] = st(W * 0.5, 420); g.save(); g.translate(lx, ly); g.rotate(Math.atan2(fa[1], fa[0])); mono(g, 'THE STREET', 0, 0, 24, rgba(P.paper, 0.85), 'center'); g.restore(); }
  // the arm's side wall (fixed), receding; buttress strips + lancets
  pen(g, poly([S2(0, 0), S2(SW, 0), S2(SW, Hw), S2(0, Hw)]), { fill: L.stoneD, lw: 2.5, shade: 0.35, shadeColor: L.stoneDD, box: [800, 300, 1700, 900] });
  for (let i = 1; i < 6; i++) { const v = i * SW / 6; pen(g, poly([S2(v - 14, 0), S2(v + 14, 0), S2(v + 14, Hw + 20), S2(v - 14, Hw + 20)]), { fill: L.stone, lw: 2, breaks: false, highlight: false }); }
  for (let i = 0; i < 6; i++) { const v = i * SW / 6 + SW / 12, a = S2(v - 26, 120), b = S2(v + 26, 120), c = S2(v + 26, 250), d = S2(v, 285), e = S2(v - 26, 250); pen(g, poly([a, b, c, d, e]), { fill: L.glass, lw: 2, breaks: false, highlight: false }); }
  // the gable's ghost outline (where it stands) while it tips
  if (ang > 0.002) { g.save(); g.strokeStyle = rgba(P.paper, 0.55); g.lineWidth = 2; g.setLineDash([8, 7]); poly([G(0, 0, 0), G(0, Hw, 0), G(W / 2, Hw + Hg, 0), G(W, Hw, 0), G(W, 0, 0)])(g); g.stroke(); g.restore(); }
  // the gable face (moves): outline, courses, rose, portal, corner turrets
  const out = [G(0, 0), G(0, Hw), G(-14, Hw + 6), G(W / 2, Hw + Hg), G(W + 14, Hw + 6), G(W, Hw), G(W, 0)];
  pen(g, poly(out), { fill: L.stone, lw: 3, shadow: true, shadowOff: [14, 10], shadowA: 0.3, shade: 0.22, shadeColor: L.stoneD, box: [300, 100, 900, 900] });
  g.save(); poly(out)(g); g.clip(); g.strokeStyle = rgba('#5d554b', 0.45); g.lineWidth = 1; g.beginPath(); for (let h = 24; h < Hw + Hg; h += 24) { g.moveTo(...G(-30, h)); g.lineTo(...G(W + 30, h)); } g.stroke(); g.restore();
  const ring = (cu, ch, r, n = 44) => (gg) => { gg.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU, [x, y] = G(cu + Math.cos(a) * r, ch + Math.sin(a) * r); i ? gg.lineTo(x, y) : gg.moveTo(x, y); } gg.closePath(); };
  const RC = [W / 2, Hw + 20], R = 150;
  pen(g, ring(...RC, R + 14), { fill: L.stoneD, lw: 2.5, breaks: false, highlight: false });
  pen(g, ring(...RC, R), { fill: L.glass, lw: 2.5, breaks: false, highlight: false });
  g.save(); ring(...RC, R)(g); g.clip(); g.strokeStyle = mix(L.stone, L.glass, 0.25); g.lineWidth = 3; g.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.moveTo(...G(RC[0] + Math.cos(a) * 34, RC[1] + Math.sin(a) * 34)); g.lineTo(...G(RC[0] + Math.cos(a) * R, RC[1] + Math.sin(a) * R)); } g.stroke();
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU; ring(RC[0] + Math.cos(a) * 110, RC[1] + Math.sin(a) * 110, 16, 16)(g); g.stroke(); }
  ring(RC[0], RC[1], 34, 24)(g); g.stroke(); ring(RC[0], RC[1], 78, 36)(g); g.stroke(); g.restore();
  const portal = []; for (let i = 0; i <= 16; i++) { const a = Math.PI - i / 16 * Math.PI, side = a > Math.PI / 2 ? -1 : 1; portal.push([W / 2 + Math.cos(a) * 70, 120 + Math.sin(a) * 70 + (Math.abs(Math.cos(a)) < 0.2 ? 6 : 0)]); }
  pen(g, poly([G(W / 2 - 70, 0), ...portal.map(([a, b]) => G(a, b)), G(W / 2 + 70, 0)]), { fill: L.glass, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); for (const h of [212, 228]) { g.moveTo(...G(0, h)); g.lineTo(...G(W, h)); } g.stroke(); g.restore();
  for (const uu of [-4, W + 4]) pen(g, poly([G(uu - 18, 0), G(uu - 18, Hw + 70), G(uu, Hw + 150), G(uu + 18, Hw + 70), G(uu + 18, 0)]), { fill: L.stoneD, lw: 2.5, breaks: false, highlight: false });
  // cracks (ink lines draw on): horizontal and vertical
  const ck = an(p, 'cracks', t, 0, 6, M.E.outCubic);
  if (p.cracksAt != null && ck > 0) { const r = M.rng(77); g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.8; g.lineCap = 'round';
    [[[0, 250], 1, 0], [[W * 0.62, 30], 0, 1], [[W * 0.24, 300], 0, 1], [[W, 200], -1, 0]].forEach(([[x, h], dx, dh], j) => { const v = clamp(ck * 1.6 - j * 0.2); if (v <= 0) return; g.beginPath(); let px = x, ph = h; g.moveTo(...G(px, ph));
      for (let q = 0; q < Math.ceil(9 * v); q++) { px += dx * 24 + (r() - 0.5) * 12 * (1 - Math.abs(dx)); ph += dh * 22 + (r() - 0.5) * 10 * (1 - Math.abs(dh)); g.lineTo(...G(px, ph)); } g.stroke(); });
    g.restore(); }
  // lamp posts on the pavement (layer 0)
  for (const [uu, d] of [[-300, 260], [W * 0.5 + 120, 330]]) { const [lx, ly] = st(uu, d); pen(g, rect(lx - 5, ly - 250, 10, 250), { fill: P.ink, lw: 1.5, breaks: false, highlight: false }); pen(g, poly([[lx - 20, ly - 250], [lx + 20, ly - 250], [lx + 11, ly - 284], [lx - 11, ly - 284]]), { fill: P.emberL, lw: 2, breaks: false, highlight: false }); }
  // the one red thing: the tilt arc traced by the peak, out toward the street, with an arrowhead
  if (red === 'arc') { const v = on(t, t0 - 0.6, 0.6); if (v > 0) { const pts = []; for (let i = 0; i <= 20; i++) pts.push(G(W / 2, Hw + Hg + 34, mx * 1.5 * (i / 20) * v));
    g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.setLineDash([12, 8]); g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q))); g.stroke(); g.setLineDash([]);
    const [ex, ey] = pts.at(-1), [px2, py2] = pts.at(-2), a = Math.atan2(ey - py2, ex - px2); g.fillStyle = P.red; g.beginPath(); g.moveTo(ex + Math.cos(a) * 16, ey + Math.sin(a) * 16); g.lineTo(ex + Math.cos(a + 2.4) * 16, ey + Math.sin(a + 2.4) * 16); g.lineTo(ex + Math.cos(a - 2.4) * 16, ey + Math.sin(a - 2.4) * 16); g.fill(); g.restore(); } }
  if (p.labelOn !== false) { const [ax, ay] = S2(SW * 0.55, Hw * 0.6); tag(g, ax, ay, ax + 130, ay - 210, 'North arm', { size: 30, swing: 2, night: true, sub: 'THE GABLE AT ITS END' }); }
}

// ================================================================= view: arches (flying buttresses, larch centring)
function flyer(K, g, x0, yB, sc, { arch = 0, arrows = 0, slot = false, redSlot = false, redArch = false, num: nlab = null, tone = 0, t = 0, buckle = true, label = false } = {}) {
  const { P, pen, rect, rrect, poly, circle, mono, mix, redRing, OAK } = K;
  const c = (col) => mix(col, P.paper, tone);
  // pier (left), wall (right), flyer arch between: pier top ~ 260 sc above, wall head 420 sc
  const px = x0, wx = x0 + 300 * sc, Y = (h) => yB - h * sc;
  pen(g, rect(px - 30 * sc, Y(300), 60 * sc, 300 * sc), { fill: c(P.card), lw: 2.5 * sc + 0.5, breaks: false, highlight: false, shade: 0.3, shadeColor: c(P.kraftD), box: [px - 30 * sc, Y(300), px + 30 * sc, yB] });
  pen(g, poly([[px - 30 * sc, Y(300)], [px, Y(360)], [px + 30 * sc, Y(300)]]), { fill: c(P.kraft), lw: 2 * sc + 0.5, breaks: false, highlight: false });
  pen(g, rect(wx, Y(470), 70 * sc, 470 * sc), { fill: c(P.card), lw: 2.5 * sc + 0.5, breaks: false, highlight: false, shade: 0.22, shadeColor: c(P.kraftD), box: [wx, Y(470), wx + 70 * sc, yB] });
  // flyer: a thin arched strut from the pier top to the wall at 400
  const fl = (gg) => { gg.beginPath(); gg.moveTo(px + 20 * sc, Y(290)); gg.quadraticCurveTo(px + 150 * sc, Y(420), wx, Y(410)); gg.lineTo(wx, Y(380)); gg.quadraticCurveTo(px + 150 * sc, Y(370), px + 26 * sc, Y(255)); gg.closePath(); };
  pen(g, fl, { fill: c(P.card), lw: 2.5 * sc + 0.5, breaks: false, highlight: false, shade: 0.3, shadeColor: c(P.kraftD), box: [px, Y(420), wx, Y(255)] });
  // the larch centring arch slides up into the space under the flyer
  if (arch > 0) { const dy = (1 - M.E.outCubic(arch)) * 360 * sc;
    g.save(); g.translate(0, dy); g.globalAlpha *= clamp(arch * 3);
    const ar = (gg) => { gg.beginPath(); gg.moveTo(px + 30 * sc, Y(250)); gg.quadraticCurveTo(px + 150 * sc, Y(362), wx, Y(372)); gg.lineTo(wx, Y(300)); gg.lineTo(px + 30 * sc, Y(200)); gg.closePath(); };
    pen(g, ar, { fill: c('#e9d6ae'), line: P.ink, lw: 2.2 * sc + 0.4, breaks: false, highlight: false, shadow: tone < 0.3 });
    g.save(); ar(g); g.clip(); g.strokeStyle = c(OAK.M); g.lineWidth = 2.5 * sc; g.beginPath(); for (let i = 0; i < 9; i++) { const x = px + (40 + i * 30) * sc; g.moveTo(x, Y(190)); g.lineTo(x + 14 * sc, Y(380)); } g.stroke(); g.restore();
    if (buckle) { pen(g, rrect(px + 150 * sc, Y(262), 34 * sc, 14 * sc, 4 * sc), { fill: c(P.brass), lw: 1.6 * sc + 0.3, breaks: false, highlight: false }); pen(g, circle(px + 167 * sc, Y(255), 4 * sc), { fill: c(P.brassD), lw: 1, breaks: false, highlight: false }); }
    if (redArch) { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 7]); g.beginPath(); g.ellipse(px + 165 * sc, Y(295), 165 * sc + 14, 70 * sc + 16, -0.22, 0, TAU); g.stroke(); g.restore(); }
    g.restore(); }
  // force arrows: the flyer presses on the wall (ink); the counter-arrow slot inside the wall is dashed and empty
  if (arrows > 0) { g.save(); g.globalAlpha *= clamp(arrows * 2); g.strokeStyle = P.ink; g.fillStyle = P.ink; g.lineWidth = 6 * sc + 1;
    const ax0 = px + 120 * sc, ax1 = wx - 8 * sc, ay = Y(410) + 6 * sc, push = Math.sin(t * 3) * 6 * sc;
    g.beginPath(); g.moveTo(ax0, ay - 46 * sc); g.lineTo(ax1 + push, ay - 6 * sc); g.stroke(); g.beginPath(); g.moveTo(ax1 + push + 6 * sc, ay - 5 * sc); g.lineTo(ax1 + push - 20 * sc, ay - 22 * sc); g.lineTo(ax1 + push - 14 * sc, ay + 8 * sc); g.closePath(); g.fill(); g.restore(); }
  if (slot) { const sx0 = wx + 90 * sc, sy = Y(395), w = 170 * sc, h = 40 * sc; g.save(); g.strokeStyle = redSlot ? P.red : P.ink70; g.lineWidth = redSlot ? 4 : 2.5; g.setLineDash([10, 7]);
    g.beginPath(); g.moveTo(sx0 + w, sy - h / 2); g.lineTo(sx0 + 30 * sc, sy - h / 2); g.lineTo(sx0 + 30 * sc, sy - h); g.lineTo(sx0, sy); g.lineTo(sx0 + 30 * sc, sy + h); g.lineTo(sx0 + 30 * sc, sy + h / 2); g.lineTo(sx0 + w, sy + h / 2); g.closePath(); g.stroke(); g.restore();
    if (label) mono(g, 'THE ROOF PUSHED BACK HERE · NOW EMPTY', sx0 - 10 * sc, sy + h + 46, 20, P.ink70); }
  if (nlab != null && arch > 0.6) { g.save(); g.font = `600 ${Math.round(22 * Math.max(0.8, sc))}px "Plex Mono"`; g.fillStyle = mix(P.ink70, P.paper, tone); g.textAlign = 'center'; g.fillText(String(nlab), px + 150 * sc, Y(180) + 8); g.restore(); }
}
function archesView(K, g, t, p, red) {
  const { P, pen, rect, rrect, mono, tag, mix } = K; const mode = p.mode ?? 'close';
  pen(g, rect(-40, 900, 2000, 200), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false });
  if (mode === 'close') {
    const arrows = an(p, 'arrows', t, 1), arch = an(p, 'arch', t, 0, 3, M.E.linear ?? ((x) => x));
    flyer(K, g, 470, 900, 1.6, { arch, arrows: arch > 0.5 ? 1 - clamp((arch - 0.5) * 2) * 0.6 : arrows, slot: true, redSlot: red === 'slot', redArch: red === 'arch', t, label: true });
    { const wx = 470 + 300 * 1.6, top = 900 - 470 * 1.6; g.save(); g.strokeStyle = P.ink40; g.lineWidth = 3; g.setLineDash([12, 9]); g.beginPath(); g.moveTo(wx - 30, top + 10); g.lineTo(wx + 330, top - 150); g.lineTo(wx + 690, top + 10); g.stroke(); g.restore();
      mono(g, 'THE ROOF · GONE', wx + 330, top - 40, 22, P.ink40, 'center'); }
    tag(g, 470, 900 - 300 * 1.6, 120, 210, 'Flying buttress', { size: 30, swing: -2, sub: 'PRESSING ON THE WALL' });
    tag(g, 470 + 300 * 1.6 + 30, 900 - 470 * 1.6 + 200, 1250, 640, 'Wall', { size: 30, swing: 2, sub: 'IT DOES NOT MOVE' });
  } else {
    // two rows: the far side (paler, smaller, higher) and the near side; arches slide in one by one across both rows
    const u = an(p, 'arches', t, 0, 3, (x) => x), per = (i) => clamp(u * 28 - i), fs = 0.31, ns = 0.385, fx = (i) => 170 + i * 118, nx = (i) => 90 + i * 122;
    for (let i = 0; i < 14; i++) flyer(K, g, fx(i), 690, fs, { arch: per(i), tone: 0.42, buckle: false });
    for (let i = 0; i < 14; i++) flyer(K, g, nx(i), 900, ns, { arch: per(14 + i), tone: 0, buckle: true });
    if (red === 'arch') { const k = Math.max(0, Math.min(27, Math.ceil(u * 28) - 1)); const far = k < 14, i = k % 14, sc = far ? fs : ns, x0 = far ? fx(i) : nx(i), yB = far ? 690 : 900;
      g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 7]); g.beginPath(); g.ellipse(x0 + 165 * sc, yB - 295 * sc, 165 * sc + 14, 70 * sc + 16, -0.22, 0, TAU); g.stroke(); g.restore(); }
    PILL = `LARCH ARCHES · ${String(Math.min(28, Math.floor(u * 28 + 0.0001))).padStart(2, '0')} / 28`;
  }
  if (p.weightAt != null && t >= num(p.weightAt, 0)) tag(g, mode === 'close' ? 470 + 165 * 1.6 : 90 + 13 * 122 + 165 * 0.385, mode === 'close' ? 900 - 220 * 1.6 : 900 - 260 * 0.385, mode === 'close' ? 1150 : 1180, mode === 'close' ? 600 : 420, p.weightText ?? '> 8 t each', { size: 38, swing: -2, sub: p.weightSub ?? 'LARCH · 28 ARCHES · 2019–2020 · REBÂTIR' });
}

// ================================================================= view: rooster (dented copper, card plinth, rubble)
function roosterView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, tag, redRing, mix, beam, OAK, halftone, puff } = K;
  const CU = '#c17f4a', CUD = '#8a5230', VG = '#7fb5a3';
  // rubble on the table: charred sticks + stone chips
  const r = M.rng(9); for (let i = 0; i < 16; i++) { const x = 200 + r() * 1520, y = 880 + r() * 130, a = (r() - 0.5) * 1.2; if (x > 700 && x < 1260 && y < 960) continue; g.save(); g.translate(x, y); g.rotate(a); beam(g, [-40, 0], [40, 0], 10, { col: OAK.D, char: 0.8, lw: 1.4 }); g.restore(); }
  for (let i = 0; i < 14; i++) { const x = 180 + r() * 1560, y = 900 + r() * 120; if (x > 700 && x < 1260 && y < 980) continue; pen(g, poly([[x, y], [x + 22 + r() * 18, y - 6], [x + 30, y + 16], [x + 6, y + 20]]), { fill: P.card, lw: 2, breaks: false, highlight: false, shade: 0.3, shadeColor: P.kraftD, box: [x, y - 6, x + 40, y + 20] }); }
  // plinth
  pen(g, rect(760, 760, 400, 200), { fill: P.card, lw: 3, shadow: true, shadowOff: [16, 18], shade: 0.25, shadeColor: P.kraftD, box: [760, 760, 1160, 960] });
  pen(g, rect(740, 740, 440, 30), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false });
  mono(g, 'FOUND IN THE RUBBLE · 16 APR 2019', 960, 900, 20, P.ink70, 'center');
  // the rooster: card silhouette in copper, bent tail feathers, a crease (the dent), the vertical rod stub
  g.save(); g.translate(960, 740); const s = 1.25; g.scale(s, s); g.rotate(-4 * D);
  pen(g, rect(-6, -116, 12, 116), { fill: P.ink70, lw: 2, breaks: false, highlight: false });
  for (let i = 0; i < 3; i++) { g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(-170, -215 + i * 12); g.quadraticCurveTo(-300 + i * 18, -400 + i * 40, -330 + i * 30, -205 + i * 25); g.strokeStyle = P.ink; g.lineWidth = 17; g.stroke(); g.strokeStyle = i === 1 ? CU : CUD; g.lineWidth = 11; g.stroke(); g.restore(); }
  const body = poly([[-150, -210], [-110, -260], [-60, -250], [-20, -300], [10, -360], [40, -380], [70, -372], [64, -346], [96, -334], [70, -320], [64, -296], [60, -250], [90, -200], [70, -150], [20, -110], [-30, -100], [-60, -60], [-40, -60], [-90, -110], [-140, -150], [-190, -150], [-210, -200], [-260, -250], [-240, -300], [-200, -310]]);
  pen(g, body, { fill: CU, lw: 3, shadow: true, shadowOff: [10, 12], shade: 0.42, shadeColor: CUD, box: [-260, -380, 96, -60] });
  g.save(); body(g); g.clip(); halftone(g, [-260, -380, 96, -60], (x, y) => (hash(Math.floor(x / 30) * 7 + Math.floor(y / 30)) > 0.88 ? 0.45 : 0), VG, { pitch: 9 }); g.restore();
  pen(g, poly([[40, -380], [52, -404], [62, -384], [74, -400], [80, -374]]), { fill: CUD, lw: 2, breaks: false, highlight: false });
  pen(g, circle(46, -352, 6), { fill: P.ink, line: null });
  // feathers (ink lines) + tail
  g.save(); g.strokeStyle = CUD; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(-200 + i * 14, -300 + i * 6); g.quadraticCurveTo(-170 + i * 14, -230, -150 + i * 12, -170 + i * 4); } g.stroke(); g.restore();
  // the dent: a crease with a hatched dip
  const dx = -40, dy = -200;
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(dx - 40, dy - 20); g.quadraticCurveTo(dx, dy + 18, dx + 46, dy - 10); g.stroke(); g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(dx - 30 + i * 12, dy - 8 + Math.abs(i - 2.5) * 2); g.lineTo(dx - 22 + i * 12, dy + 4); } g.stroke(); g.restore();
  // the small hatch on the breast opens: the relic box inside
  const hu = p.hatchAt == null ? 0 : M.E.outCubic(range(t, num(p.hatchAt, 0), num(p.hatchAt, 0) + 0.6));
  const hx = 30, hy = -240;
  pen(g, rect(hx - 22, hy - 22, 44, 44), { fill: P.ink70, lw: 2, breaks: false, highlight: false });
  if (hu > 0) { pen(g, rrect(hx - 14, hy - 12, 28, 24, 3), { fill: '#9aa3b3', lw: 1.8, breaks: false, highlight: false }); g.strokeStyle = P.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx, hy - 12); g.lineTo(hx, hy + 12); g.moveTo(hx - 14, hy); g.lineTo(hx + 14, hy); g.stroke(); }
  g.save(); g.translate(hx + 22, hy - 22); g.scale(Math.cos(hu * 150 * D) * 1, 1); pen(g, rect(-44, 0, 44, 44), { fill: hu > 0.55 ? CUD : CU, lw: 2, breaks: false, highlight: false }); g.restore();
  g.restore();
  const DX = 960 + (dx * Math.cos(-4 * D) - dy * Math.sin(-4 * D)) * s, DY = 740 + (dx * Math.sin(-4 * D) + dy * Math.cos(-4 * D)) * s;
  if (red === 'dent') { g.save(); g.strokeStyle = P.red; g.lineWidth = 4; g.setLineDash([11, 8]); g.beginPath(); g.ellipse(DX, DY, 92, 58, -0.1, 0, TAU); g.stroke(); g.restore(); }
  if (p.dentAt != null && t >= num(p.dentAt, 0)) tag(g, DX - 60, DY + 40, 300, 640, 'The spire\'s copper rooster', { size: 32, swing: -2, sub: '« CABOSSÉ MAIS VRAISEMBLABLEMENT RESTAURABLE »' });
  if (p.hatchAt != null && hu > 0.6) { const HX = 960 + (hx * Math.cos(-4 * D) - hy * Math.sin(-4 * D)) * s, HY = 740 + (hx * Math.sin(-4 * D) + hy * Math.cos(-4 * D)) * s; tag(g, HX + 20, HY, 1250, 300, 'Relics inside: intact', { size: 32, swing: 2, sub: 'LATER CONFIRMED · DIOCESE OF PARIS' }); }
}

// ================================================================= view: frame (the bell-frame toy alone on the table)
const FRAME = { x0: 560, y0: 210, x1: 1360, y1: 820 };
function frameToy(K, g, t, p, red, o = {}) {
  const { P, pen, rect, rrect, poly, circle, mono, beam, bell, OAK, BELLS, mix, redRing, flame, halftone, hatch } = K;
  const { x0, y0, x1, y1 } = FRAME, W = x1 - x0, H = y1 - y0, px = W / 13.5;
  const char = p.char ?? 0.25, corner = an(p, 'corner', t, 0), stair = an(p, 'stair', t, 0), lit = p.litAt == null ? 0 : M.E.outCubic(range(t, num(p.litAt, 0), num(p.litAt, 0) + 0.8));
  // card base + shadow
  pen(g, rect(x0 - 70, y1 + 4, W + 140, 36), { fill: P.kraft, lw: 2.5, shadow: true, shadowOff: [18, 16], breaks: false, highlight: false });
  if (lit > 0) { g.save(); g.globalAlpha *= lit * 0.55; g.fillStyle = P.paper; g.beginPath(); g.ellipse((x0 + x1) / 2, (y0 + y1) / 2, W * 0.8, H * 0.75, 0, 0, TAU); g.fill(); g.restore(); }
  const tiers = [[0, 4, y0 + H * 0.52], [4, 8, y0 + H * 0.06]], sill = y1 - H * 0.07, posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(v => x0 + W * v);
  const cc = (x, y) => (x > x0 + W * 0.7 && y > y0 + H * 0.5 ? corner : 0); // the south-east corner chars
  for (const xx of posts) beam(g, [xx, y0 + 4], [xx, sill], 0.35 * px, { col: OAK.M, lw: 1.6, char: xx > x0 + W * 0.9 ? corner * 0.85 : 0 });
  for (const [, , hy] of tiers) beam(g, [x0, hy], [x1, hy], 0.32 * px, { col: OAK.M, lw: 1.6 });
  beam(g, [x0, y0 + H * 0.47], [x1, y0 + H * 0.47], 0.3 * px, { col: OAK.M, lw: 1.6 });
  for (let i = 0; i < 4; i++) { const a = posts[i], b = posts[i + 1], ch = i === 3 ? corner * 0.9 : 0;
    beam(g, [a, y0 + H * 0.47], [b, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 }); beam(g, [b, y0 + H * 0.47], [a, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 });
    beam(g, [a, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: OAK.L, lw: 1.2, char: Math.max(char * 0.5, ch) }); beam(g, [b, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: OAK.L, lw: 1.2, char: Math.max(char * 0.5, ch) }); }
  beam(g, [x0 - 10, sill], [x1 + 10, sill], 0.55 * px, { col: OAK.M, char: char * 0.7, lw: 2 });
  if (corner > 0) { g.save(); g.globalAlpha *= corner; g.beginPath(); g.rect(x0 + W * 0.73, y0 + H * 0.5, W * 0.29, H * 0.52); g.clip(); hatch(g, [x0 + W * 0.73, y0 + H * 0.5, x1 + 20, y1 + 10], { gap: 6, lw: 1.6, color: rgba(OAK.char, 0.75), angle: -45 }); g.restore(); }
  // the stair card to the upper bell level (right side), charred
  { const sx = x1 + 30, sy0 = sill, sy1 = y0 + H * 0.4, n = 8; const pts = [[sx, sy0]]; for (let i = 0; i < n; i++) { const y = lerp(sy0, sy1, (i + 1) / n), x = sx + (i + 1) * 12; pts.push([x - 12, y]); pts.push([x, y]); } pts.push([sx + n * 12 + 40, sy1]); pts.push([sx + n * 12 + 40, sy0]);
    pen(g, poly(pts), { fill: mix(OAK.L, OAK.char, stair * 0.8), lw: 2, breaks: false, highlight: false, hatched: stair > 0.3, hatchColor: rgba(OAK.char, 0.8), box: [sx, sy1, sx + n * 12 + 40, sy0] });
    if (o.stairLabel) mono(g, 'STAIR · UPPER BELLS', sx + 70, sy0 + 36, 16, P.ink70, 'center'); }
  // the bells (brass); scars = ink-40 halftone heat patches; one bell may swing once (never slips off its pin)
  const scars = p.scars ?? [], su = p.scarsAt == null ? 1 : on(t, p.scarsAt, 0.5), centres = [];
  const swingU = p.swingAt == null ? -1 : t - num(p.swingAt, 0);
  BELLS.forEach(([name, kg], i) => {
    const tier = i < 4 ? tiers[0] : tiers[1], j = i % 4, cx = (posts[j] + posts[j + 1]) / 2, d = 1.85 * Math.cbrt(kg / 4162) * px * 1.3, hy = tier[2];
    const sw = p.swingBell === i && swingU > 0 ? 16 * Math.sin(swingU * 3.2) * Math.exp(-swingU * 0.9) * (swingU < 3.5 ? 1 : 0) : 0;
    beam(g, [cx - d * 0.7, hy + 0.35 * px], [cx + d * 0.7, hy + 0.35 * px], 0.4 * px, { col: OAK.D, lw: 1.5 });
    for (const sx of [-1, 1]) pen(g, circle(cx + sx * d * 0.62, hy + 0.35 * px, Math.max(3, 0.12 * px)), { fill: lit > 0.5 ? P.brassL : P.brassL, lw: 1.5, breaks: false, highlight: false });
    bell(g, cx, hy + 0.55 * px, d, { tilt: sw, lw: 2.5 });
    if (scars.includes(i) && su > 0) { g.save(); g.globalAlpha *= su; g.beginPath(); g.ellipse(cx + d * 0.12, hy + 0.55 * px + d * 0.55, d * 0.22, d * 0.14, 0.3, 0, TAU); g.clip(); halftone(g, [cx - d, hy, cx + d, hy + d * 1.2], 0.7, P.ink70, { pitch: 6 }); g.restore(); }
    centres.push([cx, hy + 0.55 * px + d * 0.42, d]);
    if (lit > 0.3) { g.save(); g.globalAlpha *= (lit - 0.3) / 0.7; g.strokeStyle = P.paper; g.lineWidth = 2.5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * d * 0.62, hy + 0.35 * px, Math.max(5, 0.18 * px), -2.2, -0.9); g.stroke(); } g.restore(); }
  });
  // ghosts: the L85 flame band (brass, faint) and the L86a teal ribbons
  if (p.ghostFlameAt != null) { const v = on(t, p.ghostFlameAt, 0.5) * (p.litAt == null ? 1 : 1 - range(t, num(p.litAt, 0) - 0.2, num(p.litAt, 0) + 0.4)); if (v > 0) { g.save(); g.globalAlpha *= 0.42 * v; for (let i = 0; i < 6; i++) flame(g, x0 + W * (i + 0.5) / 6, sill + 8, (60 + 30 * hash(i)), 70, t, 60 + i, { lean: 0.1 }); g.restore(); } }
  if (p.ghostWaterAt != null) { const v = on(t, p.ghostWaterAt, 0.6) * (p.litAt == null ? 1 : 1 - range(t, num(p.litAt, 0) - 0.2, num(p.litAt, 0) + 0.4)); if (v > 0) { g.save(); g.globalAlpha *= 0.5 * v; g.strokeStyle = P.teal; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) { g.lineWidth = 14; g.beginPath(); const xa = x0 - 120 + i * 40, ya = y0 - 60 + i * 12; g.moveTo(xa, ya); g.quadraticCurveTo(x0 + W * 0.5, y0 - 220 + i * 30, x0 + W * (0.55 + i * 0.09), sill - 40 - i * 20); g.stroke(); g.strokeStyle = P.tealL; g.lineWidth = 6; g.stroke(); g.strokeStyle = P.teal; } g.restore(); } }
  if (red === 'corner') { const v = on(t, p.loopAt ?? 0, 0.5); g.save(); g.strokeStyle = P.red; g.lineWidth = 4; g.setLineDash([11, 8]); g.beginPath(); g.ellipse(x0 + W * 0.86, y0 + H * 0.76, W * 0.2, H * 0.3, 0, 0, TAU * v); g.stroke(); g.restore(); }
  if (red === 'bell' && p.redBell != null) { const [cx, cy, d] = centres[p.redBell]; redRing(g, cx, cy, d * 0.72, P.red, 3.5); }
  return { centres };
}
function frameView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, tag, mix, OAK, beam } = K;
  // the stair-strip toy folded flat beside it, one teal hose coiled at its foot
  if (p.stripToy) { const sx = 150, sy = 880; pen(g, rect(sx, sy - 40, 330, 54), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false }); pen(g, rect(sx + 330, sy - 30, 60, 34), { fill: P.kraft, lw: 2, breaks: false, highlight: false }); pen(g, rect(sx + 390, sy - 40, 120, 54), { fill: P.card, lw: 2.5, breaks: false, highlight: false });
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 1.5; g.beginPath(); for (let x = sx + 14; x < sx + 320; x += 22) { g.moveTo(x, sy - 36); g.lineTo(x, sy + 10); } g.stroke(); g.restore(); mono(g, 'STAIR STRIP · FOLDED', sx + 20, sy + 46, 16, P.ink70);
    g.save(); g.strokeStyle = P.tealD; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); for (let a = 0; a < 3.2 * TAU; a += 0.1) { const r = 22 + a * 5.5; const x = 300 + Math.cos(a) * r * 1.4, y = 960 + Math.sin(a) * r * 0.45; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.strokeStyle = P.tealL; g.lineWidth = 6; g.stroke(); g.restore(); }
  frameToy(K, g, t, p, red, { stairLabel: !!p.stairLabel });
  if (p.labels) for (const L of p.labels) if (L.inAt == null || t >= num(L.inAt, 0)) tag(g, ...L.at, ...L.to, L.text, { size: L.size ?? 30, swing: L.swing ?? 0, sub: L.sub });
}
// the brass loupe: a ring with a magnified copy (drawn by `draw`) inside, screen space
function loupe(K, g, t, s, L, draw) {
  const { P, pen, circle, rect } = K; if (!L) return;
  const { x, y, r, z, fx, fy } = L; g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.fillStyle = P.paper; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.translate(x, y); g.scale(z, z); g.translate(-fx, -fy); draw(); g.restore();
  g.save(); g.strokeStyle = 'rgba(247,246,241,0.55)'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, r - 14, -2.4, -1.6); g.stroke(); g.restore();
  pen(g, (gg) => { gg.beginPath(); gg.arc(x, y, r + 16, 0, TAU); gg.arc(x, y, r, 0, TAU, true); }, { fill: P.brass, lw: 3, shadow: true, breaks: false, highlight: false, shade: 0.35, shadeColor: P.brassD, box: [x - r - 16, y - r - 16, x + r + 16, y + r + 16] });
  const a = 0.78; pen(g, (gg) => { gg.save(); gg.translate(x + Math.cos(a) * (r + 10), y + Math.sin(a) * (r + 10)); gg.rotate(a); gg.beginPath(); gg.roundRect(0, -16, 210, 32, 10); gg.restore(); }, { fill: OAKH, lw: 2.5, shadow: true, breaks: false, highlight: false });
}
const OAKH = '#73553a';
let PILL = null; // a counter pill set by a view, drawn in screen space (top-left)

// ================================================================= view: type (TYPE card, headline card)
function typeView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, mix } = K;
  if (p.headline) {
    pen(g, rect(200, 230, 1520, 560), { fill: P.card, lw: 2.5, shadow: true, shadowOff: [16, 18], breaks: false, highlight: false, shade: 0.1, shadeColor: P.kraftD, box: [200, 230, 1720, 790] });
    pen(g, circle(960, 246, 10), { fill: P.brass, lw: 2, breaks: false, highlight: false });
    if (p.kicker) mono(g, p.kicker, 280, 320, 22, P.ink70);
    const ls = [].concat(p.text ?? []), a0 = num(p.textAt, 0.2);
    g.save(); g.font = '700 92px "Archivo Narrow"'; g.fillStyle = P.ink; g.textBaseline = 'alphabetic';
    ls.forEach((l, i) => { const u = on(t, a0 + i * 0.25, 0.3); g.globalAlpha = u; g.fillText(l, 280, 440 + i * 110); });
    g.globalAlpha = 1;
    if (red === 'under' && p.underline) { const li = ls.findIndex(l => l.includes(p.underline)), l = ls[li]; if (li >= 0) { const x0 = 280 + g.measureText(l.slice(0, l.indexOf(p.underline))).width, w = g.measureText(p.underline).width, v = M.E.outCubic(range(t, num(p.underAt, a0 + 0.9), num(p.underAt, a0 + 0.9) + 0.5)), yy = 440 + li * 110 + 18;
      if (v > 0) { g.fillStyle = P.red; g.fillRect(x0, yy, w * v, 9); g.beginPath(); g.moveTo(x0 + w * v, yy - 5); g.lineTo(x0 + w * v + 14, yy + 4.5); g.lineTo(x0 + w * v, yy + 14); g.fill(); } } }
    g.restore();
    if (p.by) mono(g, p.by, 280, 740, 24, P.ink70);
    return;
  }
  // the question, Instrument Serif, set large on a card pinned by a brass hinge clip
  pen(g, rect(180, 130, 1560, 380), { fill: P.card, lw: 2.5, shadow: true, shadowOff: [14, 16], breaks: false, highlight: false, shade: 0.1, shadeColor: P.kraftD, box: [180, 130, 1740, 510] });
  pen(g, rrect(910, 112, 100, 36, 6), { fill: P.brass, lw: 2, breaks: false, highlight: false }); pen(g, circle(960, 130, 7), { fill: P.brassD, lw: 1.5, breaks: false, highlight: false });
  const text = p.text ?? 'Thirty minutes from collapse?', u = on(t, p.textAt ?? 0.15, 0.5);
  g.save(); g.font = '400 128px "Instrument Serif"'; g.textBaseline = 'alphabetic'; g.fillStyle = P.ink; g.globalAlpha = u; const tw = g.measureText(text).width, tx = 960 - tw / 2; g.fillText(text, tx, 370);
  if (red === 'q') { const qi = text.lastIndexOf('?'), qx = tx + g.measureText(text.slice(0, qi)).width + g.measureText('?').width / 2, v = range(t, num(p.textAt, 0.15) + 0.4, num(p.textAt, 0.15) + 0.9);
    g.globalAlpha = 1; g.strokeStyle = P.red; g.lineWidth = 4.5; g.setLineDash([10, 8]); g.beginPath(); g.arc(qx - 8, 328, 74, -Math.PI / 2, -Math.PI / 2 + v * TAU); g.stroke(); }
  g.restore();
  // the plates slide up under the question, one per cue
  const plates = p.plates ?? [], pw = 440, gap = 40, X0 = 960 - (plates.length * pw + (plates.length - 1) * gap) / 2;
  plates.forEach((pl, i) => { const v = on(t, pl.at ?? 1 + i * 0.4, 0.4); if (v <= 0) return; const x = X0 + i * (pw + gap), y = 570 + (1 - v) * 80;
    g.save(); g.globalAlpha *= v; pen(g, rect(x, y, pw, 150), { fill: P.paper, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, circle(x + 30, y + 30, 8), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); pen(g, circle(x + pw - 30, y + 30, 8), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
    g.font = '700 56px "Archivo Narrow"'; g.letterSpacing = '6px'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(pl.text, x + pw / 2, y + 86); g.letterSpacing = '0px';
    if (pl.sub) mono(g, pl.sub, x + pw / 2, y + 128, 18, P.ink70, 'center'); g.restore(); });
  if (p.ap) { const v = on(t, p.ap.at ?? 3, 0.4); if (v > 0) { g.save(); g.globalAlpha *= v; g.font = '500 30px "Archivo Narrow"'; const w = Math.max(g.measureText(p.ap.text).width, 300) + 80;
    pen(g, rect(960 - w / 2, 772 + (1 - v) * 40, w, p.ap.sub ? 106 : 74), { fill: P.kraft, lw: 2, shadow: true, breaks: false, highlight: false });
    g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(p.ap.text, 960, 820 + (1 - v) * 40); if (p.ap.sub) mono(g, p.ap.sub, 960, 856 + (1 - v) * 40, 18, P.ink70, 'center'); g.restore(); } }
}

// ================================================================= view: table (the night briefing table, callbacks)
function seated(K, g, x, y, sc, { plate = null, plateLit = true, gaze = 0, t = 0 } = {}) {
  const { P, pen, rect, rrect, circle, pill, mono, mix, poly } = K;
  g.save(); g.translate(x, y); g.scale(sc, sc);
  pen(g, poly([[-60, 10], [-56, -118], [-34, -150], [34, -150], [56, -118], [60, 10]]), { fill: '#4b4f5e', lw: 2.5, breaks: false, highlight: false, mis: [2, 1.5] });
  g.fillStyle = P.card; g.beginPath(); g.moveTo(-12, -150); g.lineTo(0, -122); g.lineTo(12, -150); g.fill();
  // dial head: card disc, ink-40 ticks, one gaze hand
  pen(g, circle(0, -192, 40), { fill: P.card, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 30, -192 + Math.sin(a) * 30); g.lineTo(Math.cos(a) * 36, -192 + Math.sin(a) * 36); g.stroke(); }
  g.strokeStyle = P.ink; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -192); g.lineTo(Math.cos(gaze) * 26, -192 + Math.sin(gaze) * 26); g.stroke(); g.restore();
  g.restore();
  if (plate) { g.save(); g.font = '600 20px "Plex Mono"'; g.letterSpacing = '3px'; const w = g.measureText(plate.toUpperCase()).width + 36; g.restore();
    pen(g, rect(x - w / 2, y + 18 * sc, w, 40), { fill: plateLit ? P.paper : '#a99e8b', lw: 2, shadow: true, breaks: false, highlight: false }); mono(g, plate, x, y + 18 * sc + 28, 20, P.ink, 'center', 600); }
}
function tableView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, tag, mix, redRing, OAK, halftone } = K;
  // a window card (night beyond), the table top (oak card, seen from above at an angle), figures behind it
  pen(g, rect(1500, 230, 300, 230), { fill: P.nightD, lw: 3, breaks: false, highlight: false }); g.save(); g.strokeStyle = P.ink; g.lineWidth = 5; g.beginPath(); g.moveTo(1650, 230); g.lineTo(1650, 460); g.moveTo(1500, 345); g.lineTo(1800, 345); g.stroke(); g.restore();
  mono(g, 'POLICE HEADQUARTERS · NIGHT OF 15 APR 2019', 96, 140, 22, rgba(P.paper, 0.85));
  const figs = p.figures ?? [{ x: 520, plate: 'GEN. GALLET · Paris fire brigade', gaze: 0.6 }, { x: 960, plate: 'PRESIDENT MACRON', gaze: 1.6 }, { x: 1380, plate: null, gaze: 2.4 }];
  for (const f of figs) seated(K, g, f.x, 520, 1.15, { plate: f.plate, t, gaze: f.gaze ?? 1.57 });
  const top = [[160, 600], [1760, 600], [1900, 1000], [20, 1000]];
  pen(g, poly(top), { fill: OAK.M, lw: 3, shadow: true, shade: 0.3, shadeColor: OAK.D, box: [20, 600, 1900, 1000] });
  g.save(); g.fillStyle = 'rgba(247,246,241,0.18)'; g.beginPath(); g.ellipse(960, 800, 640, 160, 0, 0, TAU); g.fill(); g.restore(); // the lamp pool on the table
  for (const f of figs) for (const sx of [-1, 1]) pen(g, (gg) => { gg.beginPath(); gg.ellipse(f.x + sx * 62, 628, 22, 13, sx * 0.3, 0, TAU); }, { fill: '#5a5f70', lw: 2, breaks: false, highlight: false }); // forearms resting on the table edge
  // the card(s) on the table
  const card = p.card ?? 'donothing', cu = on(t, p.cardAt ?? 0.2, 0.5), cx = 960, cy = 790 + (1 - cu) * 60;
  const cardBox = (w, h, rot) => (gg) => { gg.save(); gg.translate(cx, cy); gg.rotate(rot * D); gg.beginPath(); gg.rect(-w / 2, -h / 2, w, h); gg.restore(); };
  if (card === 'donothing') {
    pen(g, cardBox(560, 250, -2), { fill: P.card, lw: 3, shadow: true, shadowOff: [12, 14], breaks: false, highlight: false });
    g.save(); g.translate(cx, cy); g.rotate(-2 * D);
    g.font = '700 54px "Archivo Narrow"'; g.letterSpacing = '5px'; g.fillStyle = P.ink; g.textAlign = 'left'; g.fillText('DO NOTHING', -250, -40); g.letterSpacing = '0px';
    g.font = '700 64px "Archivo Narrow"'; g.fillText('05:00', -250, 50); mono(g, 'BOTH TOWERS GONE BY MORNING', -250, 96, 16, P.ink70);
    const fade = 1 - 0.75 * on(t, p.fadeAt ?? 1, 2.0);
    for (const [i, x] of [[0, 120], [1, 205]]) { g.save(); g.globalAlpha *= fade; pen(g, rect(x, -90, 60, 170), { fill: '#d9cdb7', lw: 2.5, breaks: false, highlight: false }); g.restore();
      g.save(); g.strokeStyle = i === 0 && red === 'tower' ? P.red : P.ink70; g.lineWidth = i === 0 && red === 'tower' ? 3.5 : 2; g.setLineDash([8, 6]); g.strokeRect(x - 6, -96, 72, 182); g.restore(); }
    mono(g, 'N', 150, 110, 16, P.ink70, 'center'); mono(g, 'S', 235, 110, 16, P.ink70, 'center');
    g.restore();
  } else {
    pen(g, cardBox(520, 230, 1.5), { fill: P.card, lw: 3, shadow: true, shadowOff: [12, 14], breaks: false, highlight: false });
    g.save(); g.translate(cx, cy); g.rotate(1.5 * D);
    g.font = '700 64px "Archivo Narrow"'; g.letterSpacing = '6px'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText('SEND THEM IN', 0, 12); g.letterSpacing = '0px';
    for (let i = 0; i < 5; i++) { g.save(); g.translate(-90 + i * 45, 72); pen(g, (gg) => { gg.beginPath(); gg.roundRect(-7, -26, 14, 26, 7); }, { fill: P.teal, lw: 1.6, breaks: false, highlight: false }); g.restore(); }
    if (red === 'card') { g.strokeStyle = P.red; g.lineWidth = 7; g.beginPath(); g.moveTo(-260, 115); g.lineTo(260, 115); g.stroke(); g.lineWidth = 3; g.setLineDash([9, 7]); g.strokeRect(-276, -131, 552, 262); }
    g.restore();
    // the other card, face down to the side
    pen(g, (gg) => { gg.save(); gg.translate(420, 860); gg.rotate(8 * D); gg.beginPath(); gg.rect(-170, -80, 340, 160); gg.restore(); }, { fill: P.kraftD, lw: 2.5, shadow: true, breaks: false, highlight: false, hatched: true, hatchColor: P.ink40, box: [230, 760, 610, 960] });
  }
}

// ================================================================= view: margin (the bracket over the model, between the wheels)
function marginView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, tag, mix, sideCard, fireSections, gearPath } = K;
  // the roofless card model (south side, night), towers intact, small, centre
  g.save(); g.translate(560, 900); const kk = 6.2;
  sideCard(g, 0, 0, kk, { sky: 'night', fireS: fireSections(0), roofGone: 1, glow: 0, glowWin: false, spire: 'gone', smoke: 0, wind: 0 }, t); g.restore();
  pen(g, rect(400, 900, 1120, 28), { fill: '#6d6156', lw: 2.5, breaks: false, highlight: false });
  // the two wheels: left (unlit, dimmed), right (stopped)
  const disc = (x, y, label, sub, dim) => { g.save(); if (dim) g.globalAlpha *= 0.5;
    pen(g, gearPath(x, y, 118, 18, 0.1), { fill: P.brass, lw: 3, shadow: true, shade: 0.4, shadeColor: P.brassD, box: [x - 118, y - 118, x + 118, y + 118], breaks: false });
    pen(g, circle(x, y, 84), { fill: P.card, lw: 2.5, breaks: false, highlight: false });
    g.strokeStyle = P.ink40; g.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * 70, y + Math.sin(a) * 70); g.lineTo(x + Math.cos(a) * 80, y + Math.sin(a) * 80); g.stroke(); }
    g.strokeStyle = P.ink; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 58, y - 22); g.stroke(); pen(g, circle(x, y, 10), { fill: P.brassD, lw: 2, breaks: false, highlight: false });
    g.restore(); tag(g, x, y + 118, x - 90, y + 160, label, { size: 28, swing: dim ? -2 : 2, night: true, sub }); };
  disc(330, 540, 'Clock one', 'DELAY · UNLIT', true); disc(1590, 540, 'Clock two', 'DEADLINE · STOPPED', false);
  // the bracket: drops over the whole model, touching neither wheel
  const u = on(t, p.bracketAt ?? 0.4, 0.55), x0 = 520, x1 = 1400, y = 300 - (1 - u) * 260;
  if (u > 0) { const col = red === 'bracket' ? P.red : P.ink;
    g.save(); g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y + 60); g.lineTo(x0, y); g.lineTo(x1, y); g.lineTo(x1, y + 60); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(960 - 16, y); g.lineTo(960, y - 22); g.lineTo(960 + 16, y); g.fill(); g.restore();
    g.save(); g.font = '600 20px "Plex Mono"'; g.letterSpacing = '3px'; const lab = p.bracketText ?? '1/4 H – 1/2 H · MARGIN (ESTIMATE)', w = g.measureText(lab).width + 50; g.restore();
    pen(g, rect(960 - w / 2, y - 92, w, 52), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false }); mono(g, lab, 960, y - 58, 20, P.ink, 'center', 600);
    if (p.empty) { g.save(); g.strokeStyle = rgba(P.paper, 0.7); g.lineWidth = 2.5; g.setLineDash([10, 9]); g.strokeRect(x0 + 24, y + 22, x1 - x0 - 48, 230); g.restore();
      mono(g, 'HOW CLOSE: NOT MEASURED', 960, y + 150, 24, rgba(P.paper, 0.9), 'center'); } }
}

// ================================================================= the set
export async function held(ctx, shot) {
  const K = KIT, { P, canvasLayer, applyCam, camAt, fibre, sourceSlip, tag, mono } = K;
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const view = p.view ?? 'vault', night = (p.sky ?? 'day') !== 'day';
  return { scene: null, camera: null, layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 1920, 1080);
    applyCam(g, s, camAt(p, t), t);
    table(K, g, t, night);
    const red = redAt(p, t, { vault: 'label', plan: 'ring', gable: 'arc', arches: 'slot', rooster: 'dent', frame: 'corner', type: 'q', table: 'tower', margin: 'bracket' }[view] ?? 'none');
    if (view === 'vault') vaultView(K, g, t, p, red);
    else if (view === 'plan') planView(K, g, t, p, red);
    else if (view === 'gable') gableView(K, g, t, p, red);
    else if (view === 'arches') archesView(K, g, t, p, red);
    else if (view === 'rooster') roosterView(K, g, t, p, red);
    else if (view === 'frame') frameView(K, g, t, p, red);
    else if (view === 'type') typeView(K, g, t, p, red);
    else if (view === 'table') tableView(K, g, t, p, red);
    else if (view === 'margin') marginView(K, g, t, p, red);
    if (p.tags) for (const tg of p.tags) if (tg.inAt == null || t >= num(tg.inAt, 0)) tag(g, ...tg.at, ...tg.to, tg.text, { size: tg.size ?? 28, swing: tg.swing ?? 0, night, sub: tg.sub });
    g.setTransform(s, 0, 0, s, 0, 0);
    if (view === 'frame' && p.loupe) { const L = { ...p.loupe }; if (p.loupeTo) { const v = M.E.inOutSine(range(t, num(p.loupeTo.at, 0), num(p.loupeTo.at, 0) + num(p.loupeTo.dur, 1.2))); for (const k of ['x', 'y', 'r', 'z', 'fx', 'fy']) if (p.loupeTo[k] != null) L[k] = lerp(L[k], p.loupeTo[k], v); }
      const c = camAt(p, t); const toScr = (x, y) => [960 + (x - c.x) * c.z, 540 + (y - c.y) * c.z];
      const [fx, fy] = toScr(L.fx, L.fy); L.fx = fx; L.fy = fy; L.z = L.z;
      if (L.r > 8) loupe(K, g, t, s, L, () => { g.save(); g.translate(960, 540); g.scale(c.z, c.z); g.translate(-c.x, -c.y); frameToy(K, g, t, { ...p }, red); g.restore(); }); }
    if (PILL) { g.save(); g.font = '500 22px "Plex Mono"'; g.letterSpacing = '3.5px'; const w = g.measureText(PILL).width + 60; g.restore(); const px = view === 'plan' ? 1920 - 96 - w : 96; K.pen(g, K.rrect(px, 60, w, 58, 29), { fill: P.ink, lw: 2, breaks: false, highlight: false, shadow: true }); mono(g, PILL, px + w / 2, 98, 22, P.paper, 'center'); PILL = null; }
    if (p.kicker && !(view === 'type' && p.headline)) mono(g, p.kicker, 96, 128, 24, night ? 'rgba(247,246,241,0.9)' : P.ink70);
    if (p.flap) flapCard(K, g, t, p);
    if (p.strip) lowerStrip(K, g, p.strip, t, num(p.stripAt, 0), p.stripUntil == null ? null : num(p.stripUntil, 1e9), p.stripBig ?? 1, p.stripTop === true);
    if (p.chips) chipStack(K, g, p.chips, t);
    fibre(g, night ? 0.06 : 0.09);
    sourceSlip(g, p.source === undefined ? 'ILLUSTRATION · PAPER MODEL' : p.source);
  } };
}
