// NOTRE-DAME (episode 10) chapter 6 "THE BELLS COME HOME": the `coda` set, Paper & Spring look (STYLE-BIBLE.md).
// Registered additively in nd-sets.js SETS. Uses the nd-sets KIT lazily (inside the factory only), so the circular import
// is safe. Every view is a separate tabletop toy on the day drafting table (never a section of the real building).
//
// Fact locks honoured by construction (VISUALS rev 9, Ch.6): the bells only move in the 2023–24 works (lifted out on a
// crane, set back on their pins); none slips off a pin; no worker, butt, cabinet or location is drawn as a cause (the
// remnant carries words only); no guard token on the sorting board (the system's routing glows, not a person); exactly
// one red thing, chosen by `red` (+ redSeq [{red, at}]).
//
// view 'tower'    the north tower card model (opened belfry door, brass hinge knuckles) with the restored oak frame and the
//                 eight bells; a brass crane on the tower top; a kraft pallet on the table at right.
//                 mode 'out' | 'in', lift 0..1 (+liftAt/liftDur): bells leave the frame one by one on the crane hook and land
//                 on the pallet ('out'), or go back onto their pins ('in'); order puts the red bell last. crane (default true).
//                 open 0..1 (+openAt/openDur), shut 0..1 (+shutAt/shutDur: the door closes again), char (lower beams, the
//                 2019 marks), fresh true (the re-cut corner in pale new oak), swing deg (+swingAt: all eight swing together),
//                 ring 0..1 (+ringAt: sound lines out of the belfry / louvres), ribbons true (blessing ribbons on the bells on
//                 the pallet), redBell (index, 2), red 'bell' | 'flap' | 'none'
// view 'workshop' the card workshop (L113–114): the bare frame toy on a bench behind (its charred corner re-cut: recut 0..1
//                 +recutAt/recutDur, a brass saw), the eight bells on oak trestles in front with ink-40 halftone lead dust,
//                 a teal cloth on a gloved forearm wiping one (clean 0..1 +cleanAt/cleanDur, wipe index), a second forearm
//                 tapping one with a brass mallet (tap index, tapAt), a dial-head figure cropped at the top (figure true),
//                 rock index (+rockAmp): that bell rocks on its trestle. red 'bell' (redBell) | 'strip' | 'none'
// view 'remnant'  an ink-hatched remnant of the matchstick roof frame on its own card base, label `ROOF FRAME · 2019`, no
//                 pin/spot/arrow; tags [{text, at, side}] hang from it on string; stamp 'NEVER PROVED' (+stampAt) lands between.
//                 red 'stamp' (a notched red underline on the stamp) | 'strip' | 'none'
// view 'board'    the system as a machine: the H3 sorting board (the punched ticket with the four panel strings, a pen line
//                 that forks to two attic slots), a ledger card (items [..] printed on cues: printAt [..], each lifts off as a
//                 brass gear: gearAt [..]), the three gears in mesh (turn +turnAt), the left wheel (CLOCK ONE · DELAY) driven by
//                 a belt (wheel 0..1 +wheelAt/wheelDur: 18:18 -> 18:48, flap '≈ 30' on wheelFlapAt), route (+routeAt: the fork
//                 glows into SACRISTY), jumpAt (the glow jumps to NAVE), the RESPONSE PLAN hourglass (glassAt: it turns,
//                 the sand runs; fastAt: the sand outruns the printed scale), remnant true (the small roof-frame remnant at the
//                 far left), cornerBell true (the rocking workshop bell, top-left). red 'index' (the notched ledger index; it
//                 ends on the third gear) | 'notch' (third gear) | 'slot' (the sacristy slot's tick) | 'glass' | 'none'
// view 'oak'      the new frame kit (L118): pale-oak trusses stand up one by one in a receding row (build +buildAt/buildDur),
//                 a teal misting pipe under the ridge with nozzles; mist 0..1 (+mistAt/mistDur) blooms teal halftone mist.
//                 plate {text, sub, at}: a name tag strung from the front truss. red 'nozzle' | 'strip' | 'none'
// view 'facade'   morning façade (L125): the west front with the spire back, brass hinge knuckles on the belfry doors,
//                 ring 0..1 (+ringAt): sound lines only from the north tower, red 'louvre' (a red notch on its louvre)
// every view: cam {x,y,z}, zoomTo (keyframes ok), chips [{text, sub, at, until}], strip {lines:[big, small..], at, until, red,
//   redAt, redUntil} (lower third; red = substring of the first line), flap 'TEXT' (+flapSub, flapAt, flapFrom, flapSubFrom),
//   pill 'TEXT' (+pillAt), ribbon {text, sub, at} (a small ribbon tag bottom-right of the flap), source
import * as M from '/engine/motion.js';
import { KIT } from './nd-sets.js';

const clamp = M.clamp, lerp = (a, b, u) => a + (b - a) * u, range = (t, a, b) => clamp((t - a) / (b - a));
const fract = (x) => x - Math.floor(x), hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const TAU = Math.PI * 2, D = Math.PI / 180;
const ease = (u) => M.E.inOutSine(clamp(u));
function an(p, key, t, def = 0, dur = 1.6) {
  const v = p[key] ?? def; if (typeof v !== 'number') return v; const at = p[key + 'At']; if (at == null) return v;
  return v * ease(range(t, num(at, 0), num(at, 0) + num(p[key + 'Dur'], dur)));
}
function redAt(p, t, def) { let r = p.red ?? def; if (p.redSeq) for (const q of p.redSeq) if (t >= num(q.at, 0)) r = q.red; return r; }
const on = (t, at, d = 0.4) => (at == null ? 1 : M.E.outCubic(range(t, num(at, 0), num(at, 0) + d)));
const twos = (t) => Math.floor(t * 15) / 15;

// ================================================================= screen-space paper pieces
function chipStack(K, g, chips, t) {
  const { P, pen, rrect, mono } = K; let y = 70;
  for (const c of chips) { const u = range(t, num(c.at, 0), num(c.at, 0) + 0.35); if (u <= 0) continue;
    const un = c.outAt ?? c.until, uo = un == null ? 1 : 1 - range(t, num(un, 1e9), num(un, 1e9) + 0.4); if (uo <= 0) continue;
    const texts = [].concat(c.text), subs = [].concat(c.sub ?? []);
    g.save(); g.font = '600 30px "Archivo Narrow"'; const w1 = Math.max(...texts.map(s => g.measureText(s).width)); g.font = '500 19px "Plex Mono"'; g.letterSpacing = '3px';
    const w2 = Math.max(0, ...subs.map(s => g.measureText(String(s).toUpperCase()).width)); g.restore();
    const W = Math.max(w1, w2) + 56, H = 26 + texts.length * 38 + subs.length * 30, x = 1920 - 80 - W + (1 - M.E.outCubic(u) * uo) * 700;
    pen(g, rrect(x, y, W, H, 6), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, rrect(x + 12, y - 8, 30, 18, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
    g.save(); g.font = '600 30px "Archivo Narrow"'; g.fillStyle = P.ink; texts.forEach((s, i) => g.fillText(s, x + 28, y + 50 + i * 38)); g.restore();
    subs.forEach((s, i) => mono(g, s, x + 28, y + 44 + texts.length * 38 + i * 30, 19, P.ink70));
    y += H + 22; }
}
// lower-third strip: lines [big, small...]; a red notched underline under `red` (a substring of the first line) from redAt
function lowerStrip(K, g, s, t, redOn) {
  const { P, pen, rect, mono } = K; const ls = [].concat(s.lines), at = num(s.at, 0);
  const u = M.E.outCubic(range(t, at, at + 0.45)) * ((s.outAt ?? s.until) == null ? 1 : 1 - M.E.inCubic(range(t, num(s.outAt ?? s.until, 1e9), num(s.outAt ?? s.until, 1e9) + 0.4))); if (u <= 0) return;
  const big = s.big ?? 1, sm = (i) => i >= big, bigF = `600 ${s.size ?? 34}px "Archivo Narrow"`;
  let w = 0; g.save(); ls.forEach((l, i) => { g.font = sm(i) ? '500 21px "Plex Mono"' : bigF; g.letterSpacing = sm(i) ? '3px' : '0px'; w = Math.max(w, g.measureText(sm(i) ? String(l).toUpperCase() : l).width); }); g.restore();
  const lh = (i) => (sm(i) ? 34 : 46), Htot = 30 + ls.reduce((a, _, i) => a + lh(i), 0);
  const W = Math.min(1780, w + 80), x0 = 960 - W / 2, y0 = 1080 - 104 - Htot;
  g.save(); g.translate((1 - u) * -1900, 0);
  pen(g, rect(x0, y0, W, Htot), { fill: P.kraft, lw: 2, shadow: true, breaks: false, highlight: false });
  pen(g, rect(x0 + 18, y0 - 9, 34, 18), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
  let y = y0 + 14;
  ls.forEach((l, i) => { y += lh(i);
    if (sm(i)) mono(g, l, x0 + 40, y - 8, 21, P.ink70);
    else { g.font = bigF; g.fillStyle = P.ink; g.textBaseline = 'alphabetic'; g.fillText(l, x0 + 40, y - 8);
      if (i === 0 && s.red && redOn) { const i0 = l.indexOf(s.red); if (i0 >= 0) { const xa = x0 + 40 + g.measureText(l.slice(0, i0)).width, ww = g.measureText(s.red).width, v = M.E.outCubic(range(t, num(s.redAt, at) , num(s.redAt, at) + 0.45));
        if (v > 0) { g.fillStyle = P.red; const yy = y + 2; g.fillRect(xa, yy, ww * v, 6); g.beginPath(); g.moveTo(xa + ww * v, yy - 4); g.lineTo(xa + ww * v + 12, yy + 3); g.lineTo(xa + ww * v, yy + 10); g.fill(); } } } } });
  g.restore();
}
function flapCard(K, g, t, p, red) {
  const { P, pen, rrect, mono } = K, x = p.flapX ?? 96, y = p.flapY ?? 64, at = num(p.flapAt, 0.15), to = String(p.flap), from = p.flapFrom ?? null, sw = from ? range(t, at, at + 0.5) : 1;
  const inAt = p.flapInAt == null ? (from ? -1 : at) : num(p.flapInAt, 0), u = M.E.outCubic(range(t, inAt - 0.3, inAt + 0.1)); if (u <= 0) return;
  const txt0 = sw < 0.5 ? String(from) : to, sq = from ? Math.abs(Math.cos(sw * Math.PI)) : 1;
  const sub = from && sw < 0.5 ? (p.flapSubFrom ?? p.flapSub) : p.flapSub;
  g.save(); g.font = '700 60px "Archivo Narrow"'; g.letterSpacing = '4px'; let w = Math.max(g.measureText(to).width, from ? g.measureText(String(from)).width : 0) + 64; g.restore();
  g.save(); g.font = '500 20px "Plex Mono"'; g.letterSpacing = '3px'; for (const s of [p.flapSub, p.flapSubFrom]) if (s) w = Math.max(w, g.measureText(String(s).toUpperCase()).width + 64); g.restore();
  const H = (p.flapSub || p.flapSubFrom) ? 136 : 102;
  g.save(); g.translate(0, (1 - u) * -220);
  pen(g, rrect(x, y, w, H, 8), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.12, shadeColor: P.kraftD, box: [x, y, x + w, y + H] });
  pen(g, rrect(x + 22, y - 10, 34, 20, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
  g.save(); g.translate(x + w / 2, y + 52); g.scale(1, Math.max(0.06, sq)); g.font = '700 60px "Archivo Narrow"'; g.letterSpacing = '4px'; g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt0, 0, 2); g.restore();
  g.fillStyle = 'rgba(20,35,61,0.28)'; g.fillRect(x + 8, y + 51, w - 16, 3);
  if (sub) mono(g, sub, x + 32, y + 118, 20, P.ink70);
  if (red) { const v = M.E.outCubic(range(t, num(p.flapRedAt, at), num(p.flapRedAt, at) + 0.4)); g.fillStyle = P.red; g.fillRect(x + 22, y + H + 10, (w - 44) * v, 6); g.beginPath(); g.moveTo(x + 22 + (w - 44) * v, y + H + 6); g.lineTo(x + 34 + (w - 44) * v, y + H + 13); g.lineTo(x + 22 + (w - 44) * v, y + H + 20); g.fill(); }
  g.restore();
  return [x, y, w, H];
}
function ribbonTag(K, g, t, r, x, y) {
  const { P, pen, poly, mono } = K; const u = on(t, r.at, 0.45); if (u <= 0) return;
  g.save(); g.font = '600 30px "Archivo Narrow"'; const w1 = g.measureText(r.text).width; g.font = '500 18px "Plex Mono"'; g.letterSpacing = '3px'; const w2 = r.sub ? g.measureText(String(r.sub).toUpperCase()).width : 0; g.restore();
  const W = Math.max(w1, w2) + 70, H = r.sub ? 88 : 60;
  g.save(); g.translate(x, y + (1 - u) * 40); g.globalAlpha *= u; g.rotate(-1.5 * D);
  pen(g, poly([[0, 0], [W, 0], [W - 22, H / 2], [W, H], [0, H], [18, H / 2]]), { fill: P.sageL, lw: 2.5, shadow: true, breaks: false, highlight: false });
  g.font = '600 30px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(r.text, 34, 40); if (r.sub) mono(g, r.sub, 34, 72, 18, P.ink70);
  g.restore();
}
function pillTop(K, g, text, t, at, x = 96, y = 64) {
  const { P, pen, rrect, mono } = K; const u = on(t, at, 0.35); if (u <= 0) return;
  g.save(); g.font = '500 22px "Plex Mono"'; g.letterSpacing = '3.5px'; const w = g.measureText(String(text).toUpperCase()).width + 60; g.restore();
  g.save(); g.globalAlpha *= u; pen(g, rrect(x, y, w, 56, 28), { fill: P.ink, lw: 2, breaks: false, highlight: false, shadow: true }); mono(g, text, x + w / 2, y + 37, 22, P.paper, 'center'); g.restore();
}
function table(K, g) { const { P, lampPool } = K; g.fillStyle = P.card; g.fillRect(-3000, -3000, 8000, 7000); lampPool(g, 620, 360, 900, P.paper, P.card); }
// dashed red ring (bible §1.5) drawn on with a sweep
function ringOn(K, g, x, y, rx, ry, v, lw = 4) { const { P } = K; if (v <= 0) return; g.save(); g.strokeStyle = P.red; g.lineWidth = lw; g.setLineDash([11, 8]); g.beginPath(); g.ellipse(x, y, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v)); g.stroke(); g.restore(); }
// sound lines: nested arcs moving outward on twos (bible: motion on twos), facing `dir` (radians), spread `spread`
function soundLines(K, g, x, y, t, amt, { dir = 0, spread = 0.9, r0 = 40, r1 = 220, n = 4, col = null, lw = 4 } = {}) {
  const { P } = K; if (amt <= 0) return; const tt = twos(t);
  g.save(); g.strokeStyle = col ?? P.ink; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const f = fract(tt * 0.9 + i / n), r = lerp(r0, r1, f), a = amt * (1 - f) * Math.min(1, f * 5);
    if (a <= 0.02) continue; g.globalAlpha = a; g.lineWidth = lw * (1 - f * 0.4);
    g.beginPath(); g.arc(x, y, r, dir - spread / 2, dir + spread / 2); g.stroke(); }
  g.restore();
}

// ================================================================= bells: geometry shared by the views
const RB = 2; // the episode's red bell (Denis), as in the cold open and Ch.5
function bellD(K, i, px) { return 1.85 * Math.cbrt(K.BELLS[i][1] / 4162) * px * 1.3; }
// the frame inside a belfry box (x0..x1, y0..y1): posts, tiers, braces, headstocks with brass pins; returns bell seats
function frameGeom(x0, y0, x1, y1) {
  const W = x1 - x0, H = y1 - y0, px = W / 13.5, posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(v => x0 + W * v);
  const tiers = [y0 + H * 0.52, y0 + H * 0.06], sill = y1 - H * 0.07;
  const seats = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const j = i % 4, hy = i < 4 ? tiers[0] : tiers[1]; return { cx: (posts[j] + posts[j + 1]) / 2, hy, ty: hy + 0.55 * px }; });
  return { W, H, px, posts, tiers, sill, seats };
}
function drawFrame(K, g, G, { char = 0, fresh = false, x0, y0, x1 } = {}) {
  const { beam, OAK, P, pen, circle } = K; const { W, H, px, posts, tiers, sill } = G;
  const newOak = '#e6d2ae';
  for (const xx of posts) beam(g, [xx, y0 + 4], [xx, sill], 0.35 * px, { col: fresh && xx > x0 + W * 0.9 ? newOak : OAK.M, lw: 1.6 });
  for (const hy of tiers) beam(g, [x0, hy], [x1, hy], 0.32 * px, { col: OAK.M, lw: 1.6 });
  beam(g, [x0, y0 + H * 0.47], [x1, y0 + H * 0.47], 0.3 * px, { col: OAK.M, lw: 1.6 });
  for (let i = 0; i < 4; i++) { const a = posts[i], b = posts[i + 1], nw = fresh && i === 3;
    beam(g, [a, y0 + H * 0.47], [b, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 }); beam(g, [b, y0 + H * 0.47], [a, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 });
    beam(g, [a, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: nw ? newOak : OAK.L, lw: 1.2, char: nw ? 0 : char * 0.5 }); beam(g, [b, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: nw ? newOak : OAK.L, lw: 1.2, char: nw ? 0 : char * 0.5 }); }
  beam(g, [x0 - 10, sill], [x1 + 10, sill], 0.55 * px, { col: OAK.M, char: char * 0.7, lw: 2 });
  if (fresh) { g.save(); g.strokeStyle = rgba(P.ink, 0.7); g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(x0 + W * 0.74, sill - 4); g.lineTo(x0 + W * 0.74, y0 + H * 0.58); g.stroke(); g.restore(); }
}
function headstock(K, g, s, d, px, { glint = 0 } = {}) {
  const { beam, OAK, P, pen, circle } = K;
  beam(g, [s.cx - d * 0.7, s.hy + 0.35 * px], [s.cx + d * 0.7, s.hy + 0.35 * px], 0.4 * px, { col: OAK.D, lw: 1.5 });
  for (const sx of [-1, 1]) { pen(g, circle(s.cx + sx * d * 0.62, s.hy + 0.35 * px, Math.max(4, 0.13 * px)), { fill: P.brassL, lw: 1.5, breaks: false, highlight: false });
    if (glint > 0) { g.save(); g.globalAlpha *= glint; g.strokeStyle = P.paper; g.lineWidth = 2.5; g.beginPath(); g.arc(s.cx + sx * d * 0.62, s.hy + 0.35 * px, Math.max(7, 0.22 * px), -2.3, -0.8); g.stroke(); g.restore(); } }
}
function drawBell(K, g, cx, ty, d, { tilt = 0, red = false, dust = 0, ribbon = false, t = 0, seed = 0 } = {}) {
  const { bell, bellPath, halftone, P, pen, poly } = K;
  bell(g, cx, ty, d, { tilt, red, lw: 2.5 });
  if (dust > 0.02 && !red) { g.save(); g.translate(cx, ty); g.rotate(tilt * D); g.translate(-cx, -ty); bellPath(cx, ty, d)(g); g.clip();
    halftone(g, [cx - d, ty, cx + d, ty + d], (x, y) => clamp(dust * (0.55 + 0.35 * Math.sin(x * 0.05 + seed) * Math.cos(y * 0.07 + seed))), P.ink40, { pitch: 7, max: 0.6 }); g.restore(); }
  if (ribbon) { g.save(); g.translate(cx, ty); g.rotate(tilt * D); pen(g, poly([[-d * 0.36, d * 0.12], [d * 0.36, d * 0.12], [d * 0.38, d * 0.22], [-d * 0.38, d * 0.22]]), { fill: P.paper, lw: 1.8, breaks: false, highlight: false });
    pen(g, poly([[d * 0.1, d * 0.2], [d * 0.22, d * 0.5], [d * 0.14, d * 0.46], [d * 0.08, d * 0.54], [d * 0.02, d * 0.22]]), { fill: P.paper, lw: 1.5, breaks: false, highlight: false }); g.restore(); }
}

// ================================================================= view: tower (lift out / set back / peal)
const TW = { x: 300, y: 170, w: 560, h: 1000 };
const PALLET = { y: 930, x0: 1080, x1: 1860 };
function palletSlots(K, px) {
  const ds = K.BELLS.map((_, i) => bellD(K, i, px)), gap = 34, tot = ds.reduce((a, b) => a + b, 0) + gap * 7;
  let x = (PALLET.x0 + PALLET.x1) / 2 - tot / 2; return ds.map(d => { const cx = x + d / 2; x += d + gap; return cx; });
}
function towerView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, cardTower, mono, gearPath, mix } = K;
  const mode = p.mode ?? 'out', crane = p.crane !== false, open = clamp(an(p, 'open', t, 1, 1.0) * (1 - an(p, 'shut', t, 0, 1.1)));
  const lift = an(p, 'lift', t, mode === 'out' ? 0 : 0, 5), redBell = p.redBell ?? RB;
  const order = mode === 'out' ? [7, 6, 5, 4, 3, 1, 0, redBell].filter((v, i, a) => a.indexOf(v) === i) : [0, 1, 3, 4, 5, 6, 7, redBell].filter((v, i, a) => a.indexOf(v) === i);
  const ord = order.filter(i => i !== redBell).concat([redBell]);
  // the belfry box (cardTower geometry)
  const { x, y, w, h } = TW, by0 = y + 26, by1 = y + h * 0.52, bx0 = x + 22, bx1 = x + w - 22;
  const G = frameGeom(bx0, by0, bx1, by1), px = G.px, slots = palletSlots(K, px);
  // per-bell state: where is it? u = transit progress 0 (in frame) .. 1 (on pallet)
  const segs = ord.map((bi, k) => { const a = k / 8, b = (k + 1) / 8; const v = clamp((lift - a) / (b - a)); return { bi, v: mode === 'out' ? v : 1 - v, k, raw: v }; });
  const state = {}; for (const s of segs) state[s.bi] = s;
  if (p.lift == null && mode === 'out') for (const s of segs) s.v = 0;
  const swing = an(p, 'swing', t, 0, 1.2), swAt = num(p.swingAt, 0);
  const tiltOf = (i) => (swing > 0 ? swing * Math.sin((t - swAt) * TAU / (1.35 + 0.18 * i) ) : 0);
  // the pallet (kraft board on two oak blocks) + its shadow
  if (p.pallet !== false) { pen(g, rect(PALLET.x0 - 30, PALLET.y, PALLET.x1 - PALLET.x0 + 60, 26), { fill: P.kraft, lw: 2.5, shadow: true, shadowOff: [14, 12], breaks: false, highlight: false });
  mono(g, p.palletLabel ?? 'PALLET · 8 BELLS', PALLET.x1 + 20, PALLET.y + 62, 17, P.ink70, 'right'); }
  // the tower (with the frame and the seated bells inside)
  const inside = (gg, x0, y0, x1, y1) => {
    const GG = frameGeom(x0, y0, x1, y1); drawFrame(K, gg, GG, { char: p.char ?? 0.2, fresh: !!p.fresh, x0, y0, x1 });
    K.BELLS.forEach((_, i) => { const s = GG.seats[i], d = bellD(K, i, GG.px), st = state[i];
      headstock(K, gg, s, d, GG.px, { glint: p.glint ? 0.5 + 0.5 * Math.sin(t * 3 + i) : 0 });
      if (!st || st.v <= 0) drawBell(K, gg, s.cx, s.ty, d, { tilt: tiltOf(i), red: red === 'bell' && i === redBell, dust: p.dust ?? 0 }); });
  };
  cardTower(g, x, y, w, h, { open, inside, t, louvers: true });
  // the brass crane on the tower top: mast, jib, counter-jib, trolley, hook
  let hook = null;
  if (crane) {
    const mx = x + w * 0.62, jy = 70, j0 = x - 80, j1 = PALLET.x1 + 10;
    pen(g, rect(mx - 12, jy, 24, y - 26 - jy), { fill: P.brass, lw: 2.5, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brassD, box: [mx - 12, jy, mx + 12, y] });
    g.save(); g.strokeStyle = P.brassD; g.lineWidth = 2; g.beginPath(); for (let yy = jy; yy < y - 30; yy += 22) { g.moveTo(mx - 12, yy); g.lineTo(mx + 12, yy + 22); } g.stroke(); g.restore();
    pen(g, rect(j0, jy - 14, j1 - j0, 28), { fill: P.brassL, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.25, shadeColor: P.brass, box: [j0, jy - 14, j1, jy + 14] });
    g.save(); g.strokeStyle = P.brassD; g.lineWidth = 2; g.beginPath(); for (let xx = j0; xx < j1 - 20; xx += 28) { g.moveTo(xx, jy + 14); g.lineTo(xx + 14, jy - 14); g.lineTo(xx + 28, jy + 14); } g.stroke(); g.restore();
    pen(g, rect(j0 + 6, jy + 14, 70, 56), { fill: P.ink70, lw: 2, breaks: false, highlight: false }); // counterweight
    pen(g, gearPath(mx, jy, 22, 10, t * 1.2), { fill: P.brass, lw: 2, breaks: false, highlight: false });
    // which bell is on the hook now
    const cur = segs.find(s => s.raw > 0 && s.raw < 1);
    const posOf = (bi, v) => { const s = G.seats[bi], d = bellD(K, bi, px), sx = slots[bi], sy = PALLET.y - d * 0.84, carry = Math.min(s.ty - 60, by0 + 10);
      const a = clamp(v / 0.25), b = clamp((v - 0.25) / 0.45), c = clamp((v - 0.7) / 0.3);
      let X = s.cx, Y = lerp(s.ty, carry, ease(a)); if (v > 0.25) { X = lerp(s.cx, sx, ease(b)); Y = carry; } if (v > 0.7) { X = sx; Y = lerp(carry, sy, ease(c)); } return [X, Y, d]; };
    let trolleyX = slots[ord[0]];
    if (cur) { const [X, Y] = posOf(cur.bi, cur.v); trolleyX = X; hook = [X, Y]; }
    else { const last = [...segs].reverse().find(s => s.raw >= 1); trolleyX = last ? (mode === 'out' ? slots[last.bi] : G.seats[last.bi].cx) : (mode === 'out' ? G.seats[ord[0]].cx : slots[ord[0]]); }
    pen(g, rect(trolleyX - 26, jy + 12, 52, 20), { fill: P.brass, lw: 2, breaks: false, highlight: false });
    const hy = hook ? hook[1] - 18 : jy + 120;
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(trolleyX - 6, jy + 32); g.lineTo(trolleyX - 3, hy); g.moveTo(trolleyX + 6, jy + 32); g.lineTo(trolleyX + 3, hy); g.stroke(); g.restore();
    pen(g, (gg) => { gg.beginPath(); gg.arc(trolleyX, hy + 8, 10, Math.PI * 1.1, Math.PI * 2.4); }, { line: P.ink, lw: 4, breaks: false, highlight: false });
    if (p.craneLabel !== false) mono(g, p.craneLabel ?? 'CRANE', j0 + 90, jy - 26, 16, P.ink70);
    // bells in transit / on the pallet
    for (const s of segs) { if (s.v <= 0) continue; const [X, Y, d] = posOf(s.bi, s.v);
      drawBell(K, g, X, Y, d, { red: red === 'bell' && s.bi === redBell, dust: p.dust ?? 0, ribbon: !!p.ribbons && s.v >= 1, tilt: s.v < 1 && s.v > 0 ? 3 * Math.sin(t * 6) : 0 }); }
  } else {
    for (const s of segs) { if (s.v <= 0) continue; const d = bellD(K, s.bi, px), sx = slots[s.bi]; drawBell(K, g, sx, PALLET.y - d * 0.84, d, { red: red === 'bell' && s.bi === redBell, dust: p.dust ?? 0, ribbon: !!p.ribbons }); }
  }
  // red ring on the red bell, wherever it is
  if (red === 'bell') { const st = state[redBell], d = bellD(K, redBell, px); let X, Y;
    if (!st || st.v <= 0) { const s = G.seats[redBell]; X = s.cx; Y = s.ty; }
    else if (hook && segs.find(q => q.raw > 0 && q.raw < 1)?.bi === redBell) { [X, Y] = hook; }
    else { X = slots[redBell]; Y = PALLET.y - d * 0.84; }
    if (open > 0.4 || (st && st.v > 0)) K.redRing(g, X, Y + d * 0.42, d * 0.75, P.red, 3.5); }
  if (red === 'seat') { const sd = G.seats[redBell], d = bellD(K, redBell, px); ringOn(K, g, sd.cx, sd.hy + 0.35 * px, d * 0.85, d * 0.32, on(t, p.seatAt ?? 0.2, 0.5), 3.5); }
  // sound lines: out of the opened belfry, or out of the louvres when the door is shut
  const ring = an(p, 'ring', t, 0, 0.8);
  if (ring > 0) { const cy = (by0 + by1) / 2; soundLines(K, g, x - 20, cy, t, ring, { dir: Math.PI, spread: 1.0, r0: 30, r1: 260 }); soundLines(K, g, x + w + 150, cy - 40, t + 0.3, ring, { dir: 0, spread: 1.0, r0: 30, r1: 300 }); }
  if (p.labels) for (const L of p.labels) if (L.inAt == null || t >= num(L.inAt, 0)) K.tag(g, ...L.at, ...L.to, L.text, { size: L.size ?? 30, swing: L.swing ?? 0, sub: L.sub });
}

// ================================================================= view: workshop (L113 second half, L114 first half)
function workshopView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, beam, OAK, hatch, sleeveHand, mix } = K;
  // back wall: a kraft pin board band + the workbench with the bare frame toy (smaller, behind)
  pen(g, rect(-200, -200, 2320, 500), { fill: mix(P.card, P.kraft, 0.35), line: null });
  g.save(); g.strokeStyle = rgba(P.ink40, 0.35); g.lineWidth = 1.2; g.beginPath(); for (let x = -200; x < 2120; x += 64) { g.moveTo(x, -200); g.lineTo(x, 300); } g.stroke(); g.restore();
  pen(g, rect(-200, 292, 2320, 12), { fill: P.kraftD, lw: 2, breaks: false, highlight: false });
  // the bench (kraft top + oak legs)
  const bx0 = 120, bx1 = 900, by = 470;
  pen(g, rect(bx0, by, bx1 - bx0, 30), { fill: OAK.L, lw: 2.5, shadow: true, breaks: false, highlight: false });
  for (const lx of [bx0 + 30, bx1 - 50]) pen(g, rect(lx, by + 30, 22, 120), { fill: OAK.M, lw: 2, breaks: false, highlight: false });
  // the frame toy (no bells), its charred SE corner re-cut
  const fx0 = 200, fx1 = 820, fy0 = 170, fy1 = 466, G = frameGeom(fx0, fy0, fx1, fy1);
  pen(g, rect(fx0 - 30, fy1 - 6, fx1 - fx0 + 60, 10), { fill: P.kraft, lw: 2, breaks: false, highlight: false });
  const recut = an(p, 'recut', t, 0, 3);
  drawFrame(K, g, G, { char: 0.35, fresh: recut > 0.6, x0: fx0, y0: fy0, x1: fx1 });
  for (let i = 0; i < 8; i++) headstock(K, g, G.seats[i], bellD(K, i, G.px), G.px);
  // charred corner hatch fading as the new piece goes in
  { const W = fx1 - fx0, H = fy1 - fy0, cx0 = fx0 + W * 0.74; g.save(); g.globalAlpha *= 1 - clamp((recut - 0.4) / 0.5); g.beginPath(); g.rect(cx0, fy0 + H * 0.5, W * 0.28, H * 0.52); g.clip(); hatch(g, [cx0, fy0 + H * 0.5, fx1 + 20, fy1 + 10], { gap: 6, lw: 1.6, color: rgba(OAK.char, 0.8), angle: -45 }); g.restore();
    if (recut > 0 && recut < 1) { const sx = cx0 + W * 0.13 + Math.sin(t * 14) * 26, sy = fy0 + H * 0.78; // the brass saw at work
      g.save(); g.translate(sx, sy); g.rotate(-0.5); pen(g, poly([[-90, -10], [60, -16], [60, 16], [-90, 10]]), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
      g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let k = -88; k < 58; k += 9) { g.moveTo(k, 10); g.lineTo(k + 4.5, 16); g.lineTo(k + 9, 10); } g.stroke();
      pen(g, rrect(60, -22, 52, 44, 10), { fill: OAK.D, lw: 2, breaks: false, highlight: false }); g.restore();
      g.save(); g.fillStyle = OAK.L; const r = M.rng(Math.floor(t * 15)); for (let k = 0; k < 10; k++) g.fillRect(sx - 30 + r() * 60, sy + 10 + r() * 50, 4, 3); g.restore(); }
    if (p.frameTag !== false) K.tag(g, fx0 + 40, fy0 + 10, ...(p.frameTag?.to ?? [40, 96]), p.frameTag?.text ?? 'Bell frame', { size: 30, swing: -2, sub: p.frameTag?.sub ?? 'FIRE-DAMAGED CORNER · RESTORED' }); }
  // the floor line (table) + eight bells on trestles in front, largest left
  pen(g, rect(-200, 640, 2320, 700), { fill: mix(P.card, P.paper, 0.4), line: null });
  const px = 64, ds = K.BELLS.map((_, i) => bellD(K, i, px)), gap = 70, tot = ds.reduce((a, b) => a + b, 0) + gap * 7;
  let x = 1010 - tot / 2; const cxs = ds.map(d => { const c = x + d / 2; x += d + gap; return c; });
  const clean = an(p, 'clean', t, 0, 3), wipe = p.wipe ?? 1, rock = p.rock, rockA = p.rockAmp ?? 4.5, tapI = p.tap ?? 4;
  const topY = 800; const tops = [];
  const FX = p.figureX ?? (cxs[wipe] + cxs[tapI]) / 2;
  if (p.figure !== false) { // the dial-head figure stands behind the trestles (faceless: a card dial with a brass gaze hand)
    const fx = FX;
    pen(g, (gg) => { gg.beginPath(); gg.moveTo(fx - 70, 590); gg.quadraticCurveTo(fx - 78, 560, fx - 40, 552); gg.lineTo(fx + 40, 552); gg.quadraticCurveTo(fx + 78, 560, fx + 70, 590); gg.lineTo(fx + 60, 800); gg.lineTo(fx - 60, 800); gg.closePath(); }, { fill: P.sageD, lw: 3, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: mix(P.sageD, P.ink, 0.4), box: [fx - 78, 552, fx + 78, 800] });
    pen(g, rect(fx - 12, 528, 24, 26), { fill: P.ink70, lw: 2, breaks: false, highlight: false });
    pen(g, circle(fx, 488, 44), { fill: P.card, lw: 3, breaks: false, highlight: false, shadow: true });
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 3; g.beginPath(); for (const a of [0, 90, 180, 270]) { const c = Math.cos(a * D), s2 = Math.sin(a * D); g.moveTo(fx + c * 34, 488 + s2 * 34); g.lineTo(fx + c * 40, 488 + s2 * 40); } g.stroke();
    g.strokeStyle = P.brass; g.lineWidth = 4; g.lineCap = 'round'; const ga = (p.gaze ?? 115) * D; g.beginPath(); g.moveTo(fx, 488); g.lineTo(fx + Math.cos(ga) * 30, 488 + Math.sin(ga) * 30); g.stroke(); g.fillStyle = P.brassD; g.beginPath(); g.arc(fx, 488, 5, 0, TAU); g.fill(); g.restore();
  }
  K.BELLS.forEach((_, i) => {
    const d = ds[i], cx = cxs[i];
    // trestle: two A legs + top bar
    for (const s of [-1, 1]) { beam(g, [cx + s * d * 0.45, topY + 6], [cx + s * d * 0.62, topY + 130], 12, { col: OAK.M, lw: 1.6 }); }
    beam(g, [cx - d * 0.75, topY + 4], [cx + d * 0.75, topY + 4], 18, { col: OAK.L, lw: 1.8 });
    const tilt = i === rock ? rockA * Math.sin(t * TAU / 1.7) : 0, ty = topY - 6 - d * 0.84;
    const dust = i === wipe ? 0.75 * (1 - clean) : (p.dustAll ?? 0.45);
    g.save(); g.translate(cx, topY - 6); g.rotate(tilt * D); g.translate(-cx, -(topY - 6));
    drawBell(K, g, cx, ty, d, { red: red === 'bell' && i === (p.redBell ?? RB), dust, seed: i * 3, tilt: 0 });
    g.restore();
    tops.push([cx, ty, d]);
    if (p.weights) mono(g, `${(K.BELLS[i][1] / 1000).toFixed(1)} T`, cx, topY + 160, 16, P.ink70, 'center');
  });
  if (red === 'bell') { const [cx, ty, d] = tops[p.redBell ?? RB]; K.redRing(g, cx, ty + d * 0.45, d * 0.72, P.red, 3.5); }
  // the dial-head figure's two forearms: the teal cloth on one bell, the brass mallet on another
  if (p.figure !== false) {
    const fxc = FX, shY = 585;
    const [wcx, wty, wd] = tops[wipe]; const wx = wcx + Math.sin(t * 5.2) * wd * 0.2, wy = wty + wd * 0.45 + Math.cos(t * 5.2) * 6;
    sleeveHand(g, fxc - 58, shY, wx + 18, wy - 8, 30, { t, col: P.sageD, face: 1 });
    g.save(); g.translate(wx, wy); g.rotate(0.2); pen(g, poly([[-34, -18], [30, -25], [38, 15], [5, 28], [-36, 16]]), { fill: P.teal, lw: 2.5, breaks: false, highlight: false, shade: 0.3, shadeColor: P.tealD, box: [-38, -25, 38, 28] }); g.restore();
    const [tcx, tty, td] = tops[tapI]; const tapPh = p.tapAt == null ? 0 : Math.max(0, Math.sin((t - num(p.tapAt, 0)) * TAU / 1.1)), ang = -0.3 - 0.35 * twos(tapPh);
    const hx = tcx - td * 0.05, hy = tty - 40;
    sleeveHand(g, fxc + 58, shY, hx, hy, 30, { t, col: P.sageD, face: -1 });
    g.save(); g.translate(hx + 8, hy); g.rotate(ang + 1.2); pen(g, rect(-4, 0, 8, 70), { fill: OAK.M, lw: 2, breaks: false, highlight: false }); pen(g, rrect(-17, 66, 34, 20, 5), { fill: P.brass, lw: 2, breaks: false, highlight: false }); g.restore();
    if (p.tapAt != null && tapPh > 0.85) soundLines(K, g, tcx + td * 0.5, tty + td * 0.4, t, 0.8, { dir: 0, spread: 0.8, r0: td * 0.4, r1: td * 1.1, n: 3, lw: 3 });
  }
}

// ================================================================= view: remnant (the roof frame, 2019; words only)
function remnantDraw(K, g, t, ox, oy, sc, { label = true } = {}) {
  const { P, pen, rect, poly, mono, beam, OAK, hatch } = K;
  g.save(); g.translate(ox, oy); g.scale(sc, sc);
  // card base
  pen(g, poly([[-520, 0], [520, 0], [560, 40], [-480, 40]]), { fill: P.kraft, lw: 2.5, shadow: true, shadowOff: [16, 14], breaks: false, highlight: false });
  // three broken trusses in a receding row: ink-hatched (burnt), ends snapped
  const ink = '#4a4440';
  for (let k = 2; k >= 0; k--) { const dx = k * 120, dy = -k * 34, s = 1 - k * 0.08, cx = -170 + dx, by = -4 + dy;
    const L = [cx - 300 * s, by], R = [cx + 300 * s, by], A = [cx, by - 400 * s];
    const brk = [0.62, 0.48, 0.7][k];
    beam(g, L, [lerp(L[0], R[0], 0.86), by], 26 * s, { col: OAK.D, char: 0.85, lw: 2 });
    beam(g, L, [lerp(L[0], A[0], brk), lerp(L[1], A[1], brk)], 24 * s, { col: OAK.D, char: 0.9, lw: 2 });
    beam(g, R, [lerp(R[0], A[0], brk * 0.7), lerp(R[1], A[1], brk * 0.7)], 24 * s, { col: OAK.D, char: 0.9, lw: 2 });
    beam(g, [cx, by], [cx, by - 400 * s * (0.55 + 0.1 * k)], 18 * s, { col: OAK.D, char: 0.9, lw: 2 });
    g.save(); g.strokeStyle = ink; g.lineWidth = 1.5; for (const [a, b] of [[L, [lerp(L[0], A[0], brk), lerp(L[1], A[1], brk)]], [R, [lerp(R[0], A[0], brk * 0.7), lerp(R[1], A[1], brk * 0.7)]]]) { // jagged snapped ends
      const [ex, ey] = b; g.beginPath(); g.moveTo(ex - 12 * s, ey + 6); g.lineTo(ex - 4, ey - 10 * s); g.lineTo(ex + 4, ey + 2); g.lineTo(ex + 12 * s, ey - 8); g.stroke(); } g.restore();
  }
  // the long sill timbers on the base
  beam(g, [-500, -10], [460, -10], 22, { col: OAK.D, char: 0.85, lw: 2 });
  if (label) { const lx = -210, ly = 58; pen(g, rect(lx, ly - 4, 420, 56), { fill: P.card, lw: 2.2, shadow: true, breaks: false, highlight: false }); mono(g, 'ROOF FRAME · 2019', lx + 210, ly + 34, 24, P.ink, 'center', 600); }
  g.restore();
}
function remnantView(K, g, t, p, red) {
  const { P, pen, rect, rrect, mono, tag } = K;
  const ox = 960, oy = 640;
  remnantDraw(K, g, t, ox, oy, 1);
  // the two word tags on string (words only, no location)
  const tags = p.tags ?? [];
  tags.forEach((tg, i) => { const u = on(t, tg.at, 0.5); if (u <= 0) return; const left = (tg.side ?? (i === 0 ? 'l' : 'r')) === 'l';
    const ax = left ? 637 : 1220, ay = left ? 440 : 485, sw = (1 - u) * (left ? -14 : 14) + Math.sin(t * 1.4 + i) * 1.5;
    tag(g, ax, ay, left ? 280 : 1240, 110 + (1 - u) * -120 + i * 16, tg.text, { size: 46, swing: sw, sub: tg.sub }); });
  // the NEVER PROVED stamp lands between them
  if (p.stamp) { const at = num(p.stampAt, 0), u = range(t, at, at + 0.22); if (u > 0) {
    const sc = lerp(1.7, 1, M.E.outBack(u)), a = Math.min(1, u * 3); g.save(); g.translate(960, 330); g.rotate(-6 * D); g.scale(sc, sc); g.globalAlpha *= a;
    g.font = '700 64px "Archivo Narrow"'; g.letterSpacing = '6px'; const w = g.measureText(p.stamp).width + 80, h = 120;
    g.strokeStyle = P.ink; g.lineWidth = 6; g.strokeRect(-w / 2, -h / 2, w, h); g.lineWidth = 2; g.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
    g.fillStyle = rgba(P.paper, 0.72); g.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.stamp, 4, 4);
    // ink speckle (worn rubber)
    const r = M.rng(77); g.fillStyle = rgba(P.paper, 0.8); for (let k = 0; k < 60; k++) g.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 3, 2);
    if (red === 'stamp') { const v = M.E.outCubic(range(t, at + 0.25, at + 0.7)); g.fillStyle = P.red; const yy = h / 2 + 16; g.fillRect(-w / 2 + 20, yy, (w - 40) * v, 7); g.beginPath(); g.moveTo(-w / 2 + 20 + (w - 40) * v, yy - 4); g.lineTo(-w / 2 + 32 + (w - 40) * v, yy + 3.5); g.lineTo(-w / 2 + 20 + (w - 40) * v, yy + 11); g.fill(); }
    g.restore(); } }
}

// ================================================================= view: board (the system as a machine; L117–117b)
const BD = { x0: 360, y0: 150, x1: 1000, y1: 900 };
const GEARS = [{ x: 1180, y: 400, r: 100, n: 16 }, { x: 1342, y: 400, r: 76, n: 12 }, { x: 1520, y: 400, r: 116, n: 18 }];
const LEDGER = { x0: 1040, y0: 590, x1: 1470, y1: 930 };
const GLASS = { x: 1760, y: 430, h: 420, w: 190 };
function boardView(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, circle, mono, gearPath, mix, odoCounter, tag, halftone, hatch } = K;
  if (p.remnant) remnantDraw(K, g, t, 160, 760, 0.3, { label: true });
  // ---- the sorting board: a kraft board with brass corner pins
  const { x0, y0, x1, y1 } = BD;
  pen(g, rect(x0, y0, x1 - x0, y1 - y0), { fill: P.kraft, lw: 3, shadow: true, shadowOff: [16, 16], shade: 0.18, shadeColor: P.kraftD, box: [x0, y0, x1, y1] });
  for (const [cx, cy] of [[x0 + 22, y0 + 22], [x1 - 22, y0 + 22], [x0 + 22, y1 - 22], [x1 - 22, y1 - 22]]) pen(g, circle(cx, cy, 9), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  mono(g, 'SORTING BOARD', x0 + 50, y0 + 58, 20, P.ink70);
  // the punched ticket: the four panel strings, exactly and in order
  const tx0 = x0 + 50, ty0 = y0 + 84, tw = x1 - x0 - 100, th = 230;
  pen(g, poly([[tx0, ty0], [tx0 + tw - 26, ty0], [tx0 + tw, ty0 + 26], [tx0 + tw, ty0 + th], [tx0, ty0 + th]]), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
  g.save(); g.fillStyle = P.ink20; for (let k = 0; k < 18; k++) g.fillRect(tx0 + 14, ty0 + 14 + k * 11.5, 6, 6); g.restore();
  g.save(); g.font = '700 54px "Archivo Narrow"'; g.fillStyle = P.ink; g.letterSpacing = '6px'; g.fillText('FEU', tx0 + 40, ty0 + 66); g.restore();
  mono(g, 'ATTIC NAVE SACRISTY', tx0 + 40, ty0 + 112, 24, P.ink, 'left', 600);
  mono(g, 'ZDA-110-3-15-1', tx0 + 40, ty0 + 152, 20, P.ink70);
  mono(g, 'ASPIRATING FRAMEWORK', tx0 + 40, ty0 + 190, 20, P.ink70);
  // the pen line: zone string -> fork -> two slots
  const sx = tx0 + 210, sy = ty0 + th, fy = 560, slN = { x: x0 + 70, w: 230 }, slS = { x: x1 - 300, w: 230 }, slY = 650, slH = 190;
  const nC = [slN.x + slN.w / 2, slY], sC = [slS.x + slS.w / 2, slY];
  const penPath = (gg, which) => { gg.beginPath(); gg.moveTo(sx, sy); gg.lineTo(sx, fy); if (which !== 'S') { gg.moveTo(sx, fy); gg.quadraticCurveTo(nC[0], fy, nC[0], slY); } if (which !== 'N') { gg.moveTo(sx, fy); gg.quadraticCurveTo(sC[0], fy, sC[0], slY); } };
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.setLineDash([10, 7]); penPath(g, 'both'); g.stroke(); g.restore();
  // slots (card pockets)
  for (const [sl, lab, sub] of [[slN, 'NAVE', 'ATTIC ONE · THE ROOF'], [slS, 'SACRISTY', 'ATTIC TWO']]) {
    pen(g, rect(sl.x, slY, sl.w, slH), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.18, shadeColor: P.kraftD, box: [sl.x, slY, sl.x + sl.w, slY + slH] });
    pen(g, rect(sl.x, slY + slH * 0.45, sl.w, slH * 0.55), { fill: P.kraftD, lw: 2, breaks: false, highlight: false });
    g.save(); g.font = '700 40px "Archivo Narrow"'; g.letterSpacing = '3px'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(lab, sl.x + sl.w / 2, slY + 62); g.restore();
    mono(g, sub, sl.x + sl.w / 2, slY + slH - 30, 15, P.ink70, 'center'); }
  // routing glow: teal along the fork into SACRISTY, then a jump to NAVE; the sacristy slot's tick (red)
  const ru = p.routeAt == null ? 0 : M.E.outCubic(range(t, num(p.routeAt, 0), num(p.routeAt, 0) + 0.9)), ju = p.jumpAt == null ? 0 : M.E.outCubic(range(t, num(p.jumpAt, 0), num(p.jumpAt, 0) + 0.7));
  if (ru > 0) { g.save(); g.strokeStyle = rgba(P.teal, 0.9 * (1 - ju * 0.55)); g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([1400 * ru, 4000]); penPath(g, 'S'); g.stroke(); g.restore();
    pen(g, rect(slS.x + 6, slY + 6, slS.w - 12, slH * 0.45 - 6), { fill: rgba(P.tealL, 0.55 * ru), line: null }); }
  if (ju > 0) { g.save(); g.strokeStyle = rgba(P.teal, 0.9); g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([1400 * ju, 4000]); penPath(g, 'N'); g.stroke(); g.restore();
    pen(g, rect(slN.x + 6, slY + 6, slN.w - 12, slH * 0.45 - 6), { fill: rgba(P.tealL, 0.55 * ju), line: null }); }
  const tickOn = p.tickAt == null ? (ru >= 1 ? 1 : 0) : on(t, p.tickAt, 0.3);
  if (tickOn > 0) { const tx = slS.x + slS.w - 10, ty = slY - 44, col = red === 'slot' ? P.red : P.ink70;
    g.save(); g.globalAlpha *= tickOn; g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx - 16, ty + 14); g.lineTo(tx - 4, ty + 28); g.lineTo(tx + 18, ty - 4); g.stroke(); g.restore();
    if (red === 'slot') ringOn(K, g, tx, ty + 12, 38, 38, tickOn, 3.5);
    if (p.searchLabel !== false && ru > 0) mono(g, p.searchLabel ?? 'SEARCH BEGAN HERE', slS.x + slS.w / 2, slY + slH + 34, 16, P.ink70, 'center'); }
  // ---- the ledger card + the gears that lift off it
  const items = p.items ?? ['TWO ATTICS', 'CHECK FIRST', 'NO SPRINKLERS'], printAt = p.printAt ?? [0.5, 1.5, 2.5], gearAt = p.gearAt ?? printAt.map(a => num(a, 0) + 0.9);
  const done = !!p.built; // everything already in place (L117b)
  const showLedger = p.ledger !== false;
  if (showLedger) pen(g, rect(LEDGER.x0, LEDGER.y0, LEDGER.x1 - LEDGER.x0, LEDGER.y1 - LEDGER.y0), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
  if (showLedger) { g.save(); g.strokeStyle = rgba(P.teal, 0.45); g.lineWidth = 1.2; g.beginPath(); for (let yy = LEDGER.y0 + 80; yy < LEDGER.y1 - 10; yy += 34) { g.moveTo(LEDGER.x0 + 20, yy); g.lineTo(LEDGER.x1 - 20, yy); } g.stroke();
  g.restore();
  mono(g, p.ledgerHead ?? 'WHAT THE RECORD SHOWS', LEDGER.x0 + 30, LEDGER.y0 + 48, 18, P.ink70); }
  let idx = -1;
  items.forEach((it, i) => { const pu = done ? 1 : range(t, num(printAt[i], 0), num(printAt[i], 0) + 0.5); if (pu <= 0 || !showLedger) return; idx = i;
    const ly = LEDGER.y0 + 112 + i * 76, gu = done ? 1 : range(t, num(gearAt[i], 0), num(gearAt[i], 0) + 0.9);
    g.save(); g.font = '700 40px "Archivo Narrow"'; g.letterSpacing = '2px'; const n = Math.ceil(it.length * pu); g.fillStyle = gu > 0 ? mix(P.ink, P.ink40, clamp(gu * 1.5)) : P.ink; g.fillText(it.slice(0, n), LEDGER.x0 + 64, ly); g.restore();
    mono(g, `${i + 1}`, LEDGER.x0 + 32, ly - 4, 20, P.ink40); });
  // gears: lift from their ledger line, fly to the train, then turn in mesh
  const turn = p.turnAt == null ? 0 : Math.max(0, t - num(p.turnAt, 0)), spd = p.turnSpeed ?? 0.9;
  let g3 = null;
  GEARS.forEach((G, i) => { const gu = done ? 1 : range(t, num(gearAt[i], 0), num(gearAt[i], 0) + 0.9); if (gu <= 0) return;
    const ly = LEDGER.y0 + 112 + i * 76 - 14, sx0 = LEDGER.x0 + 180, e = M.E.inOutCubic(gu), X = lerp(sx0, G.x, e), Y = lerp(ly, G.y, e) - Math.sin(e * Math.PI) * 80, r = lerp(22, G.r, M.E.outBack(gu));
    const dir = i % 2 ? -1 : 1, ang = dir * turn * spd * (100 / G.r) + (i === 1 ? Math.PI / G.n : 0) + (1 - e) * 2;
    pen(g, gearPath(X, Y, r, G.n, ang), { fill: P.brass, lw: 2.5, shadow: true, shadowOff: [10, 12], shade: 0.4, shadeColor: P.brassD, box: [X - r, Y - r, X + r, Y + r] });
    pen(g, circle(X, Y, r * 0.18), { fill: P.brassD, lw: 2, breaks: false, highlight: false });
    if (gu > 0.85) { const ly2 = Y + r + (i === 1 ? 36 : 28); mono(g, items[i], X, ly2, 18, P.ink, 'center', 700); }
    if (i === 2) g3 = { X, Y, r, ang, gu };
  });
  // the index: a red notched marker pointing at the current ledger line; it ends on the third gear's rim notch
  if (red === 'index' && idx >= 0 && !(g3 && g3.gu >= 1)) { const ly = LEDGER.y0 + 112 + idx * 76 - 14, ix = LEDGER.x0 + 14; g.fillStyle = P.red; g.beginPath(); g.moveTo(ix - 30, ly - 14); g.lineTo(ix, ly); g.lineTo(ix - 30, ly + 14); g.closePath(); g.fill(); ringOn(K, g, ix - 14, ly, 30, 30, 1, 3); }
  if ((red === 'notch' || (red === 'index' && g3 && g3.gu >= 1)) && g3) { const a = g3.ang - Math.PI / 2, nx = g3.X + Math.cos(a) * (g3.r - 12), ny = g3.Y + Math.sin(a) * (g3.r - 12);
    g.save(); g.translate(nx, ny); g.rotate(a + Math.PI / 2); g.fillStyle = P.red; g.beginPath(); g.moveTo(-12, -6); g.lineTo(12, -6); g.lineTo(0, 16); g.closePath(); g.fill(); g.restore(); ringOn(K, g, nx, ny, 30, 30, 1, 3); }
  // ---- the left wheel (CLOCK ONE · DELAY) on a belt from gear one
  if (p.wheel != null) {
    const wx = 1040, wy = 40, sc = 0.55, wv = an(p, 'wheel', t, 1, 2.2), v = 18 * 60 + 18 + 30 * wv, rolling = wv > 0 && wv < 1 ? 0.8 : 0;
    const flapOn = p.wheelFlapAt == null ? wv >= 1 : t >= num(p.wheelFlapAt, 0);
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(GEARS[0].x - 12, GEARS[0].y); g.lineTo(wx + 40 * sc - 12, wy + 270 * sc); g.moveTo(GEARS[0].x + 12, GEARS[0].y); g.lineTo(wx + 40 * sc + 12, wy + 270 * sc); g.stroke(); g.restore();
    odoCounter(g, wx, wy, sc, v, { rolling, t: t * (wv > 0 && wv < 1 ? 4 : 0.3), flap: flapOn ? (p.wheelFlap ?? '≈ 30') : null, flapRed: false });
    mono(g, 'CLOCK ONE · DELAY', wx + 330, wy + 30, 17, P.ink70);
    mono(g, 'THE LOST HALF HOUR', wx + 330, wy + 56, 15, P.ink40);
  }
  // ---- the RESPONSE PLAN hourglass on a belt from gear three; its sand outruns the scale printed on the glass
  if (p.glass) { const G3 = GEARS[2], { x: gx, y: gy, h: gh, w: gw } = GLASS;
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(G3.x, G3.y - 12); g.lineTo(gx - gw / 2 - 30, gy - 12); g.moveTo(G3.x, G3.y + 12); g.lineTo(gx - gw / 2 - 30, gy + 12); g.stroke(); g.restore();
    const ga = num(p.glassAt, 0), turnU = M.E.inOutBack(range(t, ga, ga + 0.8)), rot = (1 - turnU) * Math.PI; // it turns over once
    const run = Math.max(0, t - ga - 0.8), fast = p.fastAt == null ? 1e9 : num(p.fastAt, 0);
    const planned = clamp(run / 12), actual = clamp(run / 12 + Math.max(0, t - fast) / 3.2);
    // frame
    g.save(); g.translate(gx, gy);
    pen(g, rect(-gw / 2 - 30, -10, 30, 20), { fill: P.brass, lw: 2, breaks: false, highlight: false });
    g.rotate(rot);
    for (const s of [-1, 1]) pen(g, rect(-gw / 2 - 6, s * gh / 2 - (s > 0 ? 0 : 22), gw + 12, 22), { fill: P.brass, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brassD, box: [-gw / 2, -gh / 2 - 22, gw / 2, gh / 2 + 22] });
    for (const s of [-1, 1]) pen(g, rect(s * (gw / 2 - 4) - 6, -gh / 2, 12, gh), { fill: K.OAK.M, lw: 2, breaks: false, highlight: false });
    const bulb = (gg) => { gg.beginPath(); gg.moveTo(-gw / 2 + 18, -gh / 2); gg.bezierCurveTo(-gw / 2 + 10, -gh * 0.12, -12, -14, -10, 0); gg.bezierCurveTo(-12, 14, -gw / 2 + 10, gh * 0.12, -gw / 2 + 18, gh / 2); gg.lineTo(gw / 2 - 18, gh / 2); gg.bezierCurveTo(gw / 2 - 10, gh * 0.12, 12, 14, 10, 0); gg.bezierCurveTo(12, -14, gw / 2 - 10, -gh * 0.12, gw / 2 - 18, -gh / 2); gg.closePath(); };
    pen(g, bulb, { fill: rgba(P.tealL, 0.25), lw: 2.5, breaks: false, highlight: false });
    g.restore();
    // sand (drawn upright after the turn: top bulb empties, bottom fills)
    if (turnU >= 1) { g.save(); g.translate(gx, gy); const bulbU = (gg) => { gg.beginPath(); gg.moveTo(-gw / 2 + 18, -gh / 2); gg.bezierCurveTo(-gw / 2 + 10, -gh * 0.12, -12, -14, -10, 0); gg.bezierCurveTo(-12, 14, -gw / 2 + 10, gh * 0.12, -gw / 2 + 18, gh / 2); gg.lineTo(gw / 2 - 18, gh / 2); gg.bezierCurveTo(gw / 2 - 10, gh * 0.12, 12, 14, 10, 0); gg.bezierCurveTo(12, -14, gw / 2 - 10, -gh * 0.12, gw / 2 - 18, -gh / 2); gg.closePath(); };
      bulbU(g); g.clip(); const sand = P.brassL, topLvl = lerp(-gh * 0.42, -6, actual), botLvl = lerp(gh / 2, gh * 0.08, actual);
      g.fillStyle = sand; g.fillRect(-gw, topLvl, gw * 2, -topLvl); g.fillRect(-gw, botLvl, gw * 2, gh); halftone(g, [-gw, -gh / 2, gw, gh / 2], (x, y) => (y > botLvl || (y > topLvl && y < 0) ? 0.35 : 0), P.brass, { pitch: 7 });
      if (actual < 1) { g.strokeStyle = sand; g.lineWidth = 4 + 3 * (t >= fast ? 1 : 0); g.beginPath(); g.moveTo(0, -4); g.lineTo(0, botLvl); g.stroke(); }
      g.restore();
      // the scale printed on the glass (lower bulb): where the sand "should" be by plan
      const sy = (u) => gy + lerp(gh / 2, gh * 0.08, u);
      g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; for (let k = 0; k <= 6; k++) { const yy = sy(k / 6); g.beginPath(); g.moveTo(gx + gw / 2 - 8, yy); g.lineTo(gx + gw / 2 + 14, yy); g.stroke(); } g.restore();
      mono(g, 'PLAN', gx + gw / 2 + 22, sy(1) + 6, 15, P.ink70);
      const py = sy(planned); g.fillStyle = P.ink; g.beginPath(); g.moveTo(gx + gw / 2 + 16, py); g.lineTo(gx + gw / 2 + 36, py - 9); g.lineTo(gx + gw / 2 + 36, py + 9); g.closePath(); g.fill();
      if (red === 'glass' && actual - planned > 0.05) { const ay = sy(actual); ringOn(K, g, gx, ay, gw * 0.42, 26, 1, 3.5); g.fillStyle = P.red; g.fillRect(gx - gw / 2 - 40, ay - 3, 26, 6); }
    }
    pen(g, rect(gx - 130, gy + gh / 2 + 44, 260, 56), { fill: P.card, lw: 2.2, shadow: true, breaks: false, highlight: false });
    mono(g, 'RESPONSE PLAN', gx, gy + gh / 2 + 82, 22, P.ink, 'center', 600);
  }
  // the rocking workshop bell, top-left corner of the table (world)
  if (p.cornerBell) { const cx = p.cornerBell.x ?? 250, cy = p.cornerBell.y ?? 170, d = 70;
    K.beam(g, [cx - 70, cy - 30], [cx + 70, cy - 30], 14, { col: K.OAK.L, lw: 1.6 }); drawBell(K, g, cx, cy - 24, d, { tilt: 7 * Math.sin(t * TAU / 1.7), dust: 0.3 });
    mono(g, 'WORKSHOP · 2023', cx, cy + 74, 14, P.ink40, 'center'); }
}

// ================================================================= view: oak (the new frames + misting, L118)
function oakView(K, g, t, p, red) {
  const { P, pen, rect, poly, circle, mono, beam, OAK, halftone, puff, mix, tag } = K;
  const n = 8, dx = 116, dy = -36, span = 520, pitch = 55 * D, rise = (span / 2) * Math.tan(pitch), bx = 360, by = 860;
  const build = an(p, 'build', t, 1, 3.4), mist = an(p, 'mist', t, 0, 1.6), fresh = '#ead7b2', freshD = '#cfb184';
  // the card base (wall tops) as a long parallelogram
  pen(g, poly([[bx - span / 2 - 40, by], [bx + span / 2 + 40, by], [bx + span / 2 + 40 + dx * (n - 1), by + dy * (n - 1)], [bx - span / 2 - 40 + dx * (n - 1), by + dy * (n - 1)]]), { fill: P.kraft, lw: 2.5, shadow: true, shadowOff: [16, 14], breaks: false, highlight: false });
  pen(g, poly([[bx - span / 2 - 40, by], [bx + span / 2 + 40, by], [bx + span / 2 + 40, by + 34], [bx - span / 2 - 40, by + 34]]), { fill: P.card, lw: 2.5, breaks: false, highlight: false, shade: 0.2, shadeColor: P.kraftD, box: [bx - span / 2 - 40, by, bx + span / 2 + 40, by + 34] });
  mono(g, p.baseLabel ?? 'NEW OAK FRAME · KIT', bx - span / 2 - 10, by + 25, 16, P.ink70);
  const apex = [];
  for (let i = n - 1; i >= 0; i--) {
    const u = clamp(build * (n + 2) / n * 1 - (n - 1 - i) / n * 0.0 - i / (n + 2)), e = M.E.outBack(clamp(u));
    const cx = bx + i * dx, cy = by + i * dy, s = 1 - i * 0.02;
    if (u <= 0) { apex[i] = null; continue; }
    const L = [cx - span / 2 * s, cy], R = [cx + span / 2 * s, cy], A = [cx, cy - rise * s * e];
    const w = 15 * s;
    beam(g, L, R, w, { col: fresh, lw: 1.8 });
    beam(g, L, A, w, { col: fresh, lw: 1.8 }); beam(g, R, A, w, { col: fresh, lw: 1.8 });
    beam(g, [cx, cy], A, w * 0.8, { col: freshD, lw: 1.6 });
    beam(g, [cx, cy - rise * s * e * 0.35], [lerp(L[0], A[0], 0.6), lerp(L[1], A[1], 0.6)], w * 0.6, { col: fresh, lw: 1.4 });
    beam(g, [cx, cy - rise * s * e * 0.35], [lerp(R[0], A[0], 0.6), lerp(R[1], A[1], 0.6)], w * 0.6, { col: fresh, lw: 1.4 });
    apex[i] = A;
  }
  // ridge + purlins once all stand
  const allUp = apex.every(a => a) && build >= 0.98;
  if (allUp) { const a0 = apex[0], a1 = apex[n - 1]; beam(g, a0, a1, 12, { col: freshD, lw: 1.6 });
    for (const f of [0.45, 0.8]) { const L0 = [lerp(bx - span / 2, a0[0], f), lerp(by, a0[1], f)], L1 = [L0[0] + dx * (n - 1), L0[1] + dy * (n - 1)]; beam(g, L0, L1, 9, { col: fresh, lw: 1.4 }); } }
  // the misting pipe under the ridge + nozzles (teal), mist blooming
  if (allUp && p.pipe !== false) { const a0 = apex[0], a1 = apex[n - 1], off = 34;
    g.save(); g.strokeStyle = P.tealD; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(a0[0], a0[1] + off); g.lineTo(a1[0], a1[1] + off); g.stroke(); g.strokeStyle = P.tealL; g.lineWidth = 3; g.stroke(); g.restore();
    for (let i = 0; i < n; i++) { const a = apex[i], nx = a[0], ny = a[1] + off + 12;
      pen(g, rect(nx - 7, ny - 10, 14, 18), { fill: P.teal, lw: 2, breaks: false, highlight: false });
      if (mist > 0) { const m = mist * (0.7 + 0.3 * Math.sin(t * 2 + i)); g.save(); g.globalAlpha *= 0.85; for (let k = 0; k < 3; k++) { const yy = ny + 26 + k * 34 * m, r = (18 + k * 16) * m;
        if (r < 2) continue; g.save(); g.translate(nx + Math.sin(t * 1.6 + i + k) * 6, yy); g.scale(1.25, 0.8); puff(g, 0, 0, r, 400 + i * 7 + k, { fill: mix(P.tealL, P.paper, 0.35), shadeCol: P.teal, line: P.tealD, lw: 1.4, shade: 0.3 }); g.restore(); } g.restore(); }
      if (red === 'nozzle' && i === (p.redNozzle ?? 2)) ringOn(K, g, nx, ny, 28, 28, 1, 3.5); }
    if (p.pipeLabel !== false && mist > 0.2) tag(g, apex[n - 1][0] - 20, apex[n - 1][1] + off, 1490, 120, p.pipeLabel ?? 'Misting system', { size: 32, swing: 1, sub: p.pipeSub ?? 'IN EVERY WOODEN FRAME' }); }
  if (p.plate) { const u = on(t, p.plate.at, 0.4); if (u > 0) { const L = [bx - span / 2 + 60, by - 60]; g.save(); g.globalAlpha *= u; tag(g, L[0], L[1], 90, 600 + (1 - u) * 40, p.plate.text, { size: 38, swing: -2, sub: p.plate.sub }); g.restore(); } }
}

// ================================================================= view: facade (morning, L125)
function facadeView(K, g, t, p, red) {
  const { P, pen, rect, rrect, circle, mono, backdrop, facadeCard, spire, looks, trees, ND } = K;
  const k = p.k ?? 8.5, oy = 905, ox = 960 - 20.5 * k, X = (m) => ox + m * k, Y = (m) => oy - m * k, Lk = looks('day');
  backdrop(g, t, { sky: 'day', yH: oy, roofs: true, seed: 33 });
  const st = { sky: 'day', fireS: [], roofGone: 0, spire: 'standing', spireU: 0, glow: 0, wind: 0.2, smoke: 0, glowWin: false };
  spire(g, X(20.5), oy - 47 * k, k * 0.72, Lk, st, t);
  pen(g, rect(-40, oy - 6, 2000, 30), { fill: P.kraft, lw: 2, breaks: false, highlight: false });
  g.save(); g.strokeStyle = rgba(P.ink40, 0.6); g.lineWidth = 1.2; g.beginPath(); for (let x = -40; x < 1960; x += 26) { g.moveTo(x, oy - 6); g.lineTo(x - 18, oy + 24); } g.stroke(); g.restore();
  g.save(); g.fillStyle = 'rgba(11,20,38,0.12)'; g.beginPath(); g.moveTo(ox + 6, oy); g.lineTo(ox + 41 * k + 6, oy); g.lineTo(ox + 41 * k + 90, oy + 24); g.lineTo(ox + 90, oy + 24); g.fill(); g.restore();
  facadeCard(g, ox, oy, k, st, t);
  // brass hinge knuckles on the towers' card doors (the belfry stage opens like the toy)
  for (const tx of [0, 26]) for (const v of [52, 57.5, 63]) pen(g, rrect(X(tx + 1.2) - 6, Y(v) - 11, 12, 22, 3), { fill: P.brass, lw: 1.8, breaks: false, highlight: false });
  for (const [x0, x1] of [[60, ox - 30], [ox + 41 * k + 30, 1880]]) trees(g, oy + 2, x0, x1, { col: P.sage, shadeCol: P.sageD, seed: 8 + x0, t, size: 46, line: P.ink });
  // sound lines: only from the north tower (left as we face the west front)
  const ring = an(p, 'ring', t, 1, 0.8), cy = Y(58);
  if (ring > 0) { soundLines(K, g, X(-1), cy, t, ring, { dir: Math.PI, spread: 1.1, r0: 30, r1: 340, lw: 4.5 }); soundLines(K, g, X(7.5), Y(71), t + 0.25, ring * 0.8, { dir: -Math.PI / 2, spread: 0.9, r0: 20, r1: 200, lw: 4 }); soundLines(K, g, X(16), cy - 20, t + 0.5, ring * 0.5, { dir: -0.6, spread: 0.6, r0: 20, r1: 120, lw: 3.5 }); }
  if (red === 'louvre') { const v = on(t, p.redAt, 0.5), nx = X(10.8), ny = Y(57); g.fillStyle = P.red; g.beginPath(); g.moveTo(nx + 2.2 * k, ny - 1.0 * k); g.lineTo(nx + 3.4 * k, ny); g.lineTo(nx + 2.2 * k, ny + 1.0 * k); g.closePath(); if (v > 0.2) g.fill(); ringOn(K, g, nx, ny, 3.4 * k, 7.8 * k, v, 3); }
  if (p.labels) for (const L of p.labels) if (L.inAt == null || t >= num(L.inAt, 0)) K.tag(g, ...L.at, ...L.to, L.text, { size: L.size ?? 30, swing: L.swing ?? 0, sub: L.sub });
}

// ================================================================= the set
export async function coda(ctx, shot) {
  const K = KIT, { P, canvasLayer, applyCam, camAt, fibre, sourceSlip } = K;
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const view = p.view ?? 'tower';
  const DEF = { tower: 'bell', workshop: 'bell', remnant: 'stamp', board: 'index', oak: 'nozzle', facade: 'louvre' };
  return { scene: null, camera: null, layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 1920, 1080);
    const red = redAt(p, t, DEF[view] ?? 'none');
    applyCam(g, s, camAt(p, t), t);
    if (view !== 'facade') table(K, g);
    if (view === 'tower') towerView(K, g, t, p, red);
    else if (view === 'workshop') workshopView(K, g, t, p, red);
    else if (view === 'remnant') remnantView(K, g, t, p, red);
    else if (view === 'board') boardView(K, g, t, p, red);
    else if (view === 'oak') oakView(K, g, t, p, red);
    else if (view === 'facade') facadeView(K, g, t, p, red);
    g.setTransform(s, 0, 0, s, 0, 0);
    let fl = null;
    if (p.flap) fl = flapCard(K, g, t, p, red === 'flap');
    if (p.ribbon) ribbonTag(K, g, t, p.ribbon, p.ribbon.x ?? (fl ? fl[0] + 6 : 96), p.ribbon.y ?? (fl ? fl[1] + fl[3] + 40 : 70));
    if (p.pill) pillTop(K, g, p.pill, t, p.pillAt, p.pillX ?? 96, p.pillY ?? (p.flap ? 230 : 64));
    if (p.strip) lowerStrip(K, g, p.strip, t, red === 'strip');
    if (p.chips) chipStack(K, g, p.chips, t);
    fibre(g, 0.09);
    sourceSlip(g, p.source === undefined ? 'ILLUSTRATION · PAPER MODEL' : p.source);
  } };
}
