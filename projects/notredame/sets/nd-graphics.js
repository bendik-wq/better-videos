// NOTRE-DAME (episode 10) GRAPHICS SETS in the "Paper & Spring" look (docs/library/animation-study/STYLE-BIBLE.md): every card
// is printed card on a drafting table (or the teal-shade plate for chapters), cut with a deckle, given card thickness and a
// hard key-light shadow (lamp at 10 o'clock), shaded with halftone, pinned with brass, and it moves in ticks. Exactly one red
// thing per frame (always shape-coded: notch, dashed ring or marker loop), a source slip bottom-left, nothing meaningful in
// the bottom-right 260 x 80 keep-out. Reuses the hero-set KIT (projects/notredame/sets/nd-sets.js).
//
// Convention (same as nd-sets.js / palomares): default export (H) -> { setName: factory }; a factory is async
// (ctx, shot) -> { scene, camera, layer, canvas, update(t, p) }; every frame is a pure function of (t, shot.params, seeds).
// Named exports: GSETS (the factories), GKIT (the graphics helpers), cue / cues (word cues).
//
// CUES (palomares habits): any param named `at`, `…At` or `word` takes seconds into the shot or a spoken word: 'Nuñez',
// 'minutes@1' (2nd time said), 'fell+0.3'. Words the narration lacks fall back to a default schedule, so every set plays a
// full animation without VO. Quote words are matched against the narration with M.wordTimes (never lag the VO).
// CAMERA: each set leans in slowly with layer parallax; params.cam = { push, dx, dy } (push 0 = locked).
// SOURCES: every set prints a source slip; params.source replaces it (null hides it only where a set has no claim).
//
// Sets and params (all optional):
//   title     lines (['NOTRE-DAME WAS','30 MINUTES','FROM COLLAPSE']), red (substring in red, '30 MINUTES'; null none),
//             sub ('15 APRIL 2019 · PARIS'), end (true = end card: day plate, restored cathedral in the middle third, lines
//             default ['THE BELLS','CAME HOME'], the coil's red arbor is the red thing), at (card drops), wordsAt (first word
//             stamps), redAt, subAt, fire (0.75), sizes ([..] px per line), source
//   chapter   num, title, sub, delay ('+30'), deadline ('0:30'), lit ('delay'|'deadline'|'none'), date (split-flap line, e.g.
//             '15 APR 2019 · 19:50'), red ('clock'|'num'|'none'), labelL/subL/labelR/subR (the wheels' tags), at (numeral
//             roll), titleAt, subAt, dateAt, source
//   quote     text (English), fr (French original, shown above), by, role, date, highlight (word prefixes, matched in both
//             lines; the one red), strip (a thinner plain-type strip under the card, no quote marks), cameo ('mic'|'none'),
//             at, frAt, hlAt, stripAt, size, source
//   doc       kind ('ticket'|'report'|'statement'|'post'), inAt (sheet slides in), head, meta ([small mono lines]), lines ([string | { t, style:
//             'big'|'mono'|'serif'|'small'|'tech', box }]), highlight (substring or [substrings]), at (cue or [cues] per
//             highlight), stamp ('TEXT' | { text, at, rot }), label ('RECREATED TEXT · NOT THE ORIGINAL'), by, date, typeAt,
//             source. Always a typographic recreation, never an image of an original.
//   bignumber value, decimals, from (0), prefix, suffix, unit, label, kicker, note, red ('underline' | 'digits' | 'none'), at,
//             roll (1.6 s), source
//   counter   steps ([{ text, label, sub, word, red (true | substring) }]), kicker, title, settled, source
//   timeline  events ([{ time 'HH:MM' | date, label, sub, word }]), title, pxPerMin (9), spacing (330, for date events),
//             focus (index or time: start parked there), source. The red thing is the pointer under the roller.
//   compare   mode ('height'|'weight'), a / b ({ kind: 'spire'|'towers'|'person'|'bell'|'car'|'block', label, value, unit,
//             sub, count }), unit ('M'|'T'), kicker, title, at, bAt, ratio (true: weight mode prints a.value/b.value in red),
//             red ('diff'|'ratio'|'none'), source
//   winder    pose ('idle'|'point'|'lookup'|'rundown'|'panic'|'think'|'shrug'|'proud'|'deadpan'), pose2 + poseAt (switch),
//             key ('still'|'think'|'panic'|'rundown'; default from the pose), prop ('bell'|'tower'|'clock'|'cards'|'none'),
//             cards (['SEND THEM IN','HOLD BACK']), label, sub, side ('left'|'right': where the Winder stands), size (px),
//             red ('prop'|'card:0'|'card:1'|'none'), at, source
import * as THREE from 'three';
import * as M from '/engine/motion.js';
import { KIT } from './nd-sets.js';

const { P, MIS, TAU, D, mix, pen, halftone, hatch, deckle, lampShade, poly, rect, rrect, circle, pill, gearPath, archPts, mono, tag, coil, redRing,
  flame, puff, plume, embers, fibre, counterBadge, glowRings, lampPool, facadeCard, sideCard, sideFire, fireSections, canvasLayer, camBreath, smokeFor,
  loadInter, bell, bellPath, beam, OAK, sourceSlip, litPatch, tick, backdrop, quay, cardTower, bellFrameInside, spire, looks, twos, BELLS } = KIT;
const E = M.E, clamp = M.clamp, lerp = M.lerp, range = M.range;
const fract = (x) => x - Math.floor(x), hsh = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const PLATE = '#1d6662', PLATE_D = '#174f4c', PLATE_L = '#2b7a74';

// ================================================================= cues
const norm = (w) => String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
export function cue(shot, spec, fallback = 0) {
  if (spec === undefined || spec === null || spec === '') return fallback;
  if (typeof spec === 'number') return spec;
  const m = String(spec).match(/^(.+?)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) return fallback;
  const [, word, nth, off] = m, hits = (shot.words ?? []).filter(x => norm(x.w).startsWith(norm(word)));
  if (!hits.length) return fallback;
  return (hits[Number(nth ?? 0)] ?? hits.at(-1)).s + Number(off ?? 0);
}
export function cues(shot, items, { from = 0.5, span = null, key = 'word', min = 0.9 } = {}) {
  const Dd = shot.duration ?? 8, n = items.length, sp = span ?? Math.max(min * (n - 1), (Dd - from - 1.6));
  return items.map((it, i) => cue(shot, it?.[key], from + (n > 1 ? sp * i / (n - 1) : 0)));
}

// ================================================================= type
const FONT = { inter: 'Inter, "Archivo Narrow", sans-serif', serif: '"Instrument Serif", serif', mono: '"Plex Mono", monospace', narrow: '"Archivo Narrow", sans-serif' };
function font(g, { size = 40, f = 'narrow', weight = 600, italic = false, track = 0 } = {}) { g.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT[f]}`; g.letterSpacing = `${(track * size).toFixed(2)}px`; }
export function measure(g, s, o = {}) { g.save(); font(g, o); const w = g.measureText(String(s)).width; g.restore(); return w; }
// text with an optional horizontal squeeze to maxW (never wraps); returns the drawn width
export function txt(g, s, x, y, o = {}) {
  const { color = P.ink, align = 'left', base = 'alphabetic', alpha = 1, maxW = null, upper = false } = o; let str = String(s ?? ''); if (upper) str = str.toUpperCase();
  if (!str || alpha <= 0) return 0;
  g.save(); g.globalAlpha *= alpha; font(g, o); g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  let w = g.measureText(str).width;
  if (maxW && w > maxW) { g.translate(x, 0); g.scale(maxW / w, 1); g.fillText(str, 0, y); w = maxW; } else g.fillText(str, x, y);
  g.restore(); return w;
}
export function wrap(g, s, maxW, o = {}) {
  const ws = String(s ?? '').split(/\s+/).filter(Boolean), out = []; let cur = '';
  g.save(); font(g, o); for (const w of ws) { const c = cur ? cur + ' ' + w : w; if (g.measureText(c).width > maxW && cur) { out.push(cur); cur = w; } else cur = c; } g.restore();
  if (cur) out.push(cur); return out;
}
// type-on (bible §7: 2 characters per frame) and write-on (1 letter per frame)
const typed = (s, t, t0, cps = 60) => String(s ?? '').slice(0, Math.max(0, Math.floor((t - t0) * cps)));
// a red underline with a notch (the shape code for red, bible §1.5) drawn on left -> right (marker swipe)
export function redUnder(g, x, y, w, k, { th = 7, col = P.red } = {}) {
  if (k <= 0) return; const ww = w * E.emphasized(clamp(k));
  g.save(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ww, y); if (ww > 24) { g.lineTo(x + ww - 10, y + th / 2); g.lineTo(x + ww, y + th); } else g.lineTo(x + ww, y + th); g.lineTo(x, y + th); g.closePath(); g.fill(); g.restore();
}
// a hand-drawn red marker loop around a box (seeded wobble, drawn on)
export function markerLoop(g, x, y, w, h, k, { seed = 3, lw = 4.5, col = P.red, pad = 10 } = {}) {
  if (k <= 0) return; const r = M.rng(seed), cx = x + w / 2, cy = y + h / 2, rx = w / 2 + pad, ry = h / 2 + pad * 0.8, n = 64, end = Math.floor(n * 1.08 * E.outCubic(clamp(k)));
  const jit = Array.from({ length: n + 8 }, () => (r() - 0.5) * 0.06);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= end; i++) { const a = -2.4 + i / n * TAU, s = 1 + jit[i] + (i / n) * 0.05; const px = cx + Math.cos(a) * rx * s, py = cy + Math.sin(a) * ry * s; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke(); g.restore();
}

// ================================================================= paper pieces
// a printed card: kraft thickness (away from the lamp), hard shadow, deckle (optional), off-register fill, lamp halftone
export function card(g, x, y, w, h, o = {}) {
  const { fill = P.card, line = P.ink, lw = 2.5, rot = 0, seed = 7, torn = true, thick = 6, shadow = true, shade = 0.16, shadeCol = P.kraftD, r = 6, hatchFace = false, alpha = 1 } = o;
  g.save(); g.globalAlpha *= alpha; g.translate(x + w / 2, y + h / 2); g.rotate(rot * D); g.translate(-w / 2, -h / 2);
  const pts = torn ? deckle([[0, 0], [w, 0], [w, h], [0, h]], seed, 1.8, 12) : null, shape = torn ? poly(pts) : rrect(0, 0, w, h, r);
  if (thick) { g.save(); g.translate(thick, thick); shape(g); g.fillStyle = P.kraftD; g.fill(); g.strokeStyle = line; g.lineWidth = 1.5; g.stroke(); g.restore(); }
  pen(g, shape, { fill, line, lw, shadow, shadowOff: [12 + thick, 14 + thick], shadowA: 0.14, shade: shade ? lampShade([0, 0, w, h], 0, shade, 0.55) : 0, shadeColor: shadeCol, box: [0, 0, w, h], hatched: hatchFace, breaks: true });
  g.restore();
}
// a brass binder clip (+C, the brass tell): pinches the top edge of a card at (x, y)
export function brassClip(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot * D); g.scale(s, s);
  g.strokeStyle = P.ink; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-22, -28); g.quadraticCurveTo(-30, -70, 0, -74); g.quadraticCurveTo(30, -70, 22, -28); g.stroke();
  g.strokeStyle = P.brassL; g.lineWidth = 3.5; g.stroke();
  pen(g, poly([[-40, -30], [40, -30], [32, 26], [-32, 26]]), { fill: P.brass, lw: 2.5, shadow: true, shadowOff: [9, 11], shade: lampShade([-40, -30, 40, 26], 0.05, 0.55, 0.3), shadeColor: P.brassD, box: [-40, -30, 40, 26], breaks: false });
  g.fillStyle = P.brassD; g.fillRect(-30, 10, 60, 5); g.restore();
}
// a character drum (odometer wheel) showing glyphs[pos] (pos float rolls); non-cyclic glyph lists clamp
export function charDrum(g, x, y, w, h, glyphs, pos, { stripes = 0, color = P.ink, sizeK = 0.74, face = P.card, f = 'narrow', weight = 700 } = {}) {
  pen(g, rrect(x, y, w, h, 6), { fill: face, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 6); g.clip();
  const i0 = Math.floor(pos), fr = pos - i0, n = glyphs.length;
  font(g, { size: h * sizeK, f, weight }); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const k of [-1, 0, 1]) { const i = ((i0 + k) % n + n) % n, yy = y + h / 2 + (k - fr) * h; g.fillText(glyphs[i], x + w / 2 + 2, yy + h * 0.03); }
  if (stripes > 0.02) { g.strokeStyle = rgba(P.ink, 0.35 * stripes); g.lineWidth = 2; for (let yy = y + 6; yy < y + h; yy += 9) { g.beginPath(); g.moveTo(x + 8, yy); g.lineTo(x + w - 8, yy); g.stroke(); } }
  halftone(g, [x, y, x + w, y + h], (xx, yy) => { const u = Math.abs((yy - y) / h - 0.5) * 2; return clamp((u - 0.55) * 1.4); }, P.kraftD, { pitch: 9 });
  g.restore();
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x, y, w, h, 6); g.stroke(); g.restore();
}
// a brass housing (rounded plate, inner well, four screws), shaded under the lamp
export function housing(g, x, y, w, h, { lit = 1, t = 0, gears = true, base = P.brass } = {}) {
  const fill = mix(PLATE, base, lit), dark = mix(PLATE_D, P.brassD, lit);
  if (gears) for (const [gx, gy, r, n, sp] of [[x + w - 26, y + h - 8, Math.min(70, h * 0.32), 16, 0.5], [x + 30, y + h + 14, Math.min(44, h * 0.2), 12, -0.8]])
    pen(g, gearPath(gx, gy, r, n, t * sp), { fill: mix(PLATE, P.brass, lit), lw: 2.5, shade: 0.45, shadeColor: dark, box: [gx - r, gy - r, gx + r, gy + r], breaks: false });
  pen(g, rrect(x, y, w, h, 16), { fill, lw: 3, shadow: true, shadowOff: [14, 16], shadowA: 0.16, shade: lampShade([x, y, x + w, y + h], 0.05, 0.5, 0.35), shadeColor: dark, box: [x, y, x + w, y + h] });
  pen(g, rrect(x + 16, y + 16, w - 32, h - 32, 10), { fill: dark, lw: 2, breaks: false, highlight: false });
  for (const [sx, sy] of [[x + 30, y + 30], [x + w - 30, y + 30], [x + 30, y + h - 30], [x + w - 30, y + h - 30]]) { pen(g, circle(sx, sy, 6.5), { fill: mix(PLATE_L, P.brassL, lit), lw: 1.5, breaks: false, highlight: false }); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.stroke(); }
}

// ================================================================= grounds
// the drafting table: posterised lamp pool on card, a faint survey grid, pale brass gears (layer 3: no line, paper haze),
// a foreground ruler on the table edge (layer 0) unless ruler:false
function deskGround(g, t, k, { seed = 1, ruler = true, grid = true, gears = true, tone = mix(P.card, P.kraft, 0.85), mat = true, matBox = [150, 120, 1660, 860], matRot = -1.2 } = {}) {
  k.view(0.25);
  lampPool(g, 560, 300, 760, P.paper, tone);
  if (grid) { g.save(); g.strokeStyle = rgba(P.ink40, 0.22); g.lineWidth = 1.25; g.beginPath(); for (let x = -160; x < 2100; x += 64) { g.moveTo(x, -200); g.lineTo(x, 1300); } for (let y = -136; y < 1300; y += 64) { g.moveTo(-200, y); g.lineTo(2100, y); } g.stroke(); g.restore(); }
  if (gears) { const r0 = M.rng(seed * 17 + 3);
    for (let i = 0; i < 5; i++) { const gx = [140, 1780, 1650, 300, 1010][i] + (r0() - 0.5) * 120, gy = [170, 150, 930, 960, 1060][i] + (r0() - 0.5) * 80, r = 110 + r0() * 130, n = Math.round(r / 9), sp = (r0() - 0.5) * 0.2;
      pen(g, gearPath(gx, gy, r, n, t * sp + r0() * 3), { fill: mix(P.brassL, P.paper, 0.62), line: null, shade: lampShade([gx - r, gy - r, gx + r, gy + r], 0.03, 0.3, 0.4), shadeColor: mix(P.brass, P.paper, 0.45), box: [gx - r, gy - r, gx + r, gy + r] }); } }
  if (mat) { k.view(0.6); cuttingMat(g, ...matBox, matRot, seed); }
  k.view(1);
}
// the sage cutting mat on the drafting table (layer 2): rounded card, grid every 32 px (heavier every 160), edge numbers,
// halftone shade on the lamp-away side, a hard shadow
function cuttingMat(g, x, y, w, h, rot = -1.2, seed = 1) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot * D); g.translate(-w / 2, -h / 2);
  pen(g, rrect(0, 0, w, h, 22), { fill: P.sageL, line: P.sageD, lw: 2.5, shadow: true, shadowOff: [14, 16], shadowA: 0.12, shade: lampShade([0, 0, w, h], 0, 0.38, 0.45), shadeColor: P.sage, box: [0, 0, w, h], breaks: false });
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 22); g.clip();
  g.strokeStyle = rgba(P.sageD, 0.45); g.lineWidth = 1.25; g.beginPath(); for (let xx = 32; xx < w; xx += 32) { g.moveTo(xx, 0); g.lineTo(xx, h); } for (let yy = 32; yy < h; yy += 32) { g.moveTo(0, yy); g.lineTo(w, yy); } g.stroke();
  g.strokeStyle = P.sageD; g.lineWidth = 2; g.beginPath(); for (let xx = 160; xx < w; xx += 160) { g.moveTo(xx, 0); g.lineTo(xx, h); } for (let yy = 160; yy < h; yy += 160) { g.moveTo(0, yy); g.lineTo(w, yy); } g.stroke();
  g.strokeStyle = rgba(P.sageD, 0.6); g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, h - 40); g.lineTo(Math.min(w, h) * 0.9, h - 40 - Math.min(w, h) * 0.9 + 40); g.stroke(); // the 45 deg guide
  g.restore();
  for (let i = 1; i < w / 160; i++) txt(g, String(i * 5), i * 160, 22, { size: 14, f: 'mono', weight: 500, color: P.sageD, align: 'center' });
  g.restore();
}
// desk props (layer 0/1, decoration only): a sage pencil, a roll of teal masking tape, a brass divider; each [x, y, rot] or false
function deskProps(g, k, { pencil = [1420, 975, -6], tape = [1800, 150, 0], divider = false } = {}) {
  k.view(1.15);
  if (pencil) { const [x, y, r] = pencil; g.save(); g.translate(x, y); g.rotate(r * D);
    pen(g, poly([[0, -13], [380, -13], [430, 0], [380, 13], [0, 13]]), { fill: P.sage, lw: 2.5, shadow: true, shade: 0.3, shadeColor: P.sageD, box: [0, -13, 380, 13], breaks: false });
    pen(g, poly([[380, -13], [430, 0], [380, 13]]), { fill: P.kraft, lw: 2, breaks: false, highlight: false }); pen(g, poly([[414, -5], [430, 0], [414, 5]]), { fill: P.ink, line: null });
    pen(g, rect(-34, -13, 34, 26), { fill: P.brassL, lw: 2, breaks: false, highlight: false }); g.fillStyle = P.sageD; g.fillRect(40, -2, 320, 4); g.restore(); }
  if (tape) { const [x, y] = tape; pen(g, circle(x, y, 92), { fill: P.tealL, lw: 2.5, shadow: true, shade: lampShade([x - 92, y - 92, x + 92, y + 92], 0, 0.45, 0.4), shadeColor: P.teal, box: [x - 92, y - 92, x + 92, y + 92] });
    pen(g, circle(x, y, 52), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false }); g.save(); g.strokeStyle = rgba(P.teal, 0.6); g.lineWidth = 1.25; for (let r = 60; r < 90; r += 7) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); } g.restore(); }
  if (divider) { const [x, y, r] = divider; g.save(); g.translate(x, y); g.rotate(r * D);
    for (const a of [-0.3, 0.3]) { g.save(); g.rotate(a); pen(g, poly([[-7, 0], [7, 0], [2, 220], [-2, 220]]), { fill: P.brassL, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [-7, 0, 7, 220] }); g.restore(); }
    pen(g, circle(0, 0, 18), { fill: P.brass, lw: 2.5, breaks: false, highlight: false }); g.restore(); }
  k.view(1);
}
function deskRuler(g, k, { y = 1028, x = 1200, w = 600 } = {}) {
  k.view(1.25); // layer 0: the brass ruler on the table edge, bottom right (clear of the keep-out: it is decoration, no meaning)
  pen(g, rect(x, y, w, 46), { fill: P.brassL, lw: 2.5, shadow: true, shade: 0.25, shadeColor: P.brass, box: [x, y, x + w, y + 46], breaks: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= w / 12; i++) { const xx = x + 10 + i * 12; if (xx > x + w - 10) break; g.moveTo(xx, y); g.lineTo(xx, y + (i % 10 === 0 ? 20 : i % 5 === 0 ? 14 : 8)); } g.stroke(); g.restore();
  k.view(1);
}
// the coloured plate (bible §1.4: teal-shade ground, light fills, paper pen line): two posterised steps + halftone + pale gears
function plateGround(g, t, k, { seed = 2 } = {}) {
  k.view(0.25);
  g.fillStyle = PLATE; g.fillRect(-200, -200, 2320, 1480);
  poly(deckle([[-200, 640], [2120, 520], [2120, 1300], [-200, 1300]], seed + 40, 4, 16))(g); g.fillStyle = PLATE_D; g.fill();
  halftone(g, [-200, -200, 2120, 1300], lampShade([-200, -200, 2120, 1300], 0, 0.3, 0.4), PLATE_D, { pitch: 12 });
  const r0 = M.rng(seed * 13 + 1);
  for (let i = 0; i < 4; i++) { const gx = [1700, 980, 120, 1880][i], gy = [120, 1040, 980, 760][i], r = 120 + r0() * 120, n = Math.round(r / 9);
    pen(g, gearPath(gx, gy, r, n, t * (i % 2 ? -0.06 : 0.07) + i), { fill: mix(PLATE, P.tealL, 0.32), line: null, shade: 0.3, shadeColor: mix(PLATE, P.tealD, 0.5), box: [gx - r, gy - r, gx + r, gy + r] }); }
  k.view(1);
}

// ================================================================= the set frame
let FONTS = null;
async function fontsReady() {
  return FONTS ??= (async () => { await document.fonts.ready; await loadInter();
    for (const f of ['600 34px "Archivo Narrow"', '700 250px "Archivo Narrow"', '500 22px "Plex Mono"', '400 84px "Instrument Serif"', 'italic 40px "Instrument Serif"', '900 100px Inter', '800 100px Inter']) { try { await document.fonts.load(f); } catch { /* optional */ } } })();
}
async function gset(ctx, shot, paint, cam = {}) {
  await fontsReady();
  const L0 = canvasLayer(ctx), { g, s } = L0, p = shot.params ?? {}, Dur = Math.max(0.5, shot.duration ?? 6);
  const camO = { push: 0.035, dx: 16, dy: 6, ...cam, ...(p.cam ?? {}) };
  const k = { D: Dur, shot, p, t: 0 };
  // view(depth): slow lean-in + drift for a layer at that depth (0 locked, 1 the main plane, > 1 nearer), plus the 2D breath
  k.view = (depth = 1) => { const u = E.inOutSine(clamp(k.t / Dur)), z = (1 + camO.push * u * depth) * (1 + (camBreath(k.t) - 1) * depth), ox = (u - 0.5) * camO.dx * depth, oy = (u - 0.5) * camO.dy * depth;
    g.setTransform(s * z, 0, 0, s * z, s * (960 - 960 * z - ox), s * (540 - 540 * z - oy)); };
  k.flat = () => g.setTransform(s, 0, 0, s, 0, 0);
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, k, update(t) {
    k.t = t; smokeFor(p, shot);
    g.setTransform(s, 0, 0, s, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.letterSpacing = '0px';
    g.fillStyle = P.paper; g.fillRect(0, 0, 1920, 1080);
    paint(g, t, p, k);
    k.flat(); fibre(g, k.night ? 0.06 : 0.08);
    if (k.source !== null) sourceSlip(g, k.source);
  } };
}

// ================================================================= SET: title (also the end card)
async function title(ctx, shot) {
  const p = shot.params ?? {}, end = p.end ?? p.mode === 'end';
  const lines = p.lines ?? (end ? ['THE BELLS', 'CAME HOME'] : ['NOTRE-DAME WAS', '30 MINUTES', 'FROM COLLAPSE']);
  const redS = p.red === undefined ? (end ? null : '30 MINUTES') : p.red;
  const words = lines.flatMap((l, li) => l.split(/\s+/).map(w => ({ w, li })));
  const t0 = cue(shot, p.at, 0.12), tw0 = cue(shot, p.wordsAt, t0 + 0.55);
  const said = (shot.words ?? []).length ? M.wordTimes(shot, words.map(x => x.w).join(' '), { fallback: tw0, gap: 0.14 }) : null;
  const tW = words.map((_, i) => Math.min(said ? said[i] : Infinity, tw0 + i * 0.16));
  const tRed = cue(shot, p.redAt, tW.at(-1) + 0.35), tSub = cue(shot, p.subAt, tRed + 0.25);
  const sizes = p.sizes ?? lines.map(l => (redS && l.includes(redS) ? (end ? 120 : 172) : (end ? 104 : 100)));
  const sub = p.sub === undefined ? (end ? 'MAINSPRING · THE HIDDEN MACHINERY' : '15 APRIL 2019 · PARIS') : p.sub;
  return gset(ctx, shot, (g, t, _p, k) => {
    k.night = !end; k.source = p.source === undefined ? 'ILLUSTRATION · PAPER MODEL' : p.source;
    const CW = end ? 700 : 1300, CX = 960 - CW / 2;
    // ---- the world behind the card
    if (!end) {
      k.view(0.3); backdrop(g, t, { sky: 'dusk', yH: 1012, glow: 0.85, seed: 61 });
      k.view(0.7);
      const kk = 6.6, ox = 960 - 64 * kk, oy = 1012, X = (m) => ox + m * kk, Y = (m) => oy - m * kk;
      const fire = (p.fire ?? 0.75) * (0.55 + 0.45 * E.inOutSine(range(t, 0, 3)));
      const st = { sky: 'dusk', fireS: fireSections(fire), roofGone: 0.35, spire: 'gone', glow: 0.9, wind: 0.45, smoke: 0.8, glowWin: true };
      sideFire(g, X, Y, kk, st, t, true); sideCard(g, ox, oy, kk, st, t); sideFire(g, X, Y, kk, st, t, false);
      k.view(1.1); quay(g, oy, 80, { col: '#4b4f5e', line: P.ink, shadeCol: '#2c3142' });
    } else {
      k.view(0.3); backdrop(g, t, { sky: 'day', yH: 1000, glow: 0, seed: 62 });
      k.view(0.7);
      const kk = 4.9, ox = 960 - 64 * kk, oy = 1000, X = (m) => ox + m * kk, Y = (m) => oy - m * kk;
      const st = { sky: 'day', fireS: fireSections(0), roofGone: 0, spire: 'standing', glow: 0 };
      sideCard(g, ox, oy, kk, st, t); spire(g, X(66), Y(43), kk, looks('day'), st, t);
      KIT.trees(g, oy + 4, 40, ox - 40, { col: P.sage, shadeCol: P.sageD, seed: 5, t, size: 40, line: P.ink }); KIT.trees(g, oy + 4, ox + 128 * kk + 40, 1890, { col: P.sage, shadeCol: P.sageD, seed: 6, t, size: 40, line: P.ink });
      k.view(1.1); quay(g, oy, 80, { col: P.card, line: P.ink, shadeCol: P.kraftD });
    }
    // ---- the title card hangs from a string on two brass clips (it drops in, settles, sways a little on twos)
    k.view(1);
    const drop = E.decel(range(t, t0, t0 + 0.55)), settle = Math.sin(clamp((t - t0 - 0.55) / 0.5) * Math.PI) * (1 - range(t, t0 + 0.55, t0 + 1.05)) * 6;
    const lh = sizes.map(sz => sz * 1.0), CH = lh.reduce((a, b) => a + b, 0) + (sub ? 70 : 0) + 96 + (redS ? 30 : 0) + (end ? 70 : 0), CY = end ? 70 : 52;
    const dy = (1 - drop) * -(CH + 200) + settle, sway = Math.sin(twos(t) * 1.4) * 0.35 - 0.6;
    g.save(); g.strokeStyle = end ? P.ink70 : rgba(P.paper, 0.75); g.lineWidth = 2; g.beginPath(); g.moveTo(-40, CY - 30); g.quadraticCurveTo(960, CY + 6, 1960, CY - 30); g.stroke(); g.restore();
    g.save(); g.translate(0, dy); g.translate(960, CY); g.rotate(sway * D); g.translate(-960, -CY);
    card(g, CX, CY, CW, CH, { seed: 31, thick: 7, shade: 0.14 });
    halftone(g, [CX + CW - 220, CY + CH - 120, CX + CW - 10, CY + CH - 10], 0.12, P.kraftD, { pitch: 11 });
    let y = CY + 54, wi = 0;
    lines.forEach((l, li) => {
      const sz = sizes[li]; y += lh[li] * 0.86 + (li && redS && lines[li - 1].includes(redS) ? 30 : 0);
      const lw = measure(g, l, { size: sz, f: 'inter', weight: 900, track: -0.02 }), scl = Math.min(1, (CW - 110) / lw), x0 = 960 - lw * scl / 2;
      const ws = l.split(/\s+/); let x = x0;
      const red0 = redS && l.includes(redS) ? l.indexOf(redS) : -1;
      ws.forEach((w, j) => { const tw = tW[wi++], u = range(t, tw, tw + 0.2), sc = 1 + 0.35 * (1 - E.inQuad(u));
        const pre = ws.slice(0, j).join(' ') + (j ? ' ' : ''), inRed = red0 >= 0 && pre.length >= red0 && pre.length < red0 + redS.length;
        const ww = measure(g, w, { size: sz, f: 'inter', weight: 900, track: -0.02 }) * scl, sp = measure(g, ' ', { size: sz, f: 'inter', weight: 900 }) * scl;
        if (u > 0) { g.save(); g.translate(x + ww / 2, y - sz * 0.35); g.scale(sc * scl, sc); g.globalAlpha *= clamp(u * 3);
          txt(g, w, 0, sz * 0.35, { size: sz, f: 'inter', weight: 900, track: -0.02, align: 'center', color: inRed ? P.red : P.ink }); g.restore(); }
        x += ww + sp; });
      if (red0 >= 0) { const pw = measure(g, l.slice(0, red0), { size: sz, f: 'inter', weight: 900, track: -0.02 }) * scl, rw = measure(g, redS, { size: sz, f: 'inter', weight: 900, track: -0.02 }) * scl;
        redUnder(g, x0 + pw, y + 14, rw, range(t, tRed, tRed + 0.4), { th: 9 }); }
    });
    if (sub) txt(g, typed(sub, t, tSub), 960, y + 62, { size: 26, f: 'mono', weight: 500, color: P.ink70, align: 'center', track: 0.16, maxW: CW - 80 });
    // the brand coil, bottom-right of the card, winding in ticks (8 steps per 24 f); its arbor is the red thing on the end card
    const cxl = end ? 960 : CX + CW - 64, cyl = CY + CH - 58; g.save(); g.translate(cxl, cyl); g.rotate((Math.floor(t / 0.8) + tick(fract(t / 0.8), 8)) * TAU); coil(g, 0, 0, 30, P.brassD, end && redS === null ? P.red : null, 4); g.restore();
    if (end && redS === null) redRing(g, cxl, cyl, 44);
    g.restore();
    for (const cx of [CX + 120, CX + CW - 120]) brassClip(g, cx, CY + dy + 8, 0.8, sway);
    if (!end) { k.view(1.3); embers(g, 0, 1080, 1920, 600, t, { n: 26, seed: 71, size: 6 }); }
    else { // three small bells hang under the card, swinging home (secondary motion)
      for (let i = 0; i < 3; i++) { const bx = CX + 170 + i * 180, by0 = CY + dy + CH + 8, L = 70 + i * 26, a = Math.sin(t * 1.8 + i * 1.3) * 7 * D, bx2 = bx + Math.sin(a) * L, by2 = by0 + Math.cos(a) * L;
        g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by0); g.lineTo(bx2, by2); g.stroke(); g.restore(); bell(g, bx2, by2, 56 - i * 6, { tilt: a / D, lw: 2 }); } }
  }, { push: 0.03, dx: 0, dy: 4 });
}

// ================================================================= SET: chapter (teal-shade plate, the numeral wheel, the two clocks)
const DELAY = { label: 'DELAY', sub: 'the lost half hour' }, DEADLINE = { label: 'DEADLINE', sub: "Gallet's half hour" };
function miniWheel(g, x, y, text, { lit = 1, t = 0, roll = 1, red = false, label = '', sub = '' } = {}) {
  const chars = String(text).split(''), dw = 70, gap = 10, W = chars.length * (dw + gap) + 70, H = 150;
  housing(g, x, y, W, H, { lit: 0.35 + 0.65 * lit, t: t * lit });
  chars.forEach((c, i) => { const isD = /\d/.test(c), glyphs = isD ? '0123456789'.split('') : [c];
    const pos = isD ? (+c) * E.inOutCubic(clamp(roll * 1.15 - i * 0.08)) : 0, dx = x + 35 + i * (dw + gap);
    charDrum(g, dx, y + 24, dw, H - 48, glyphs, pos, { stripes: isD && roll < 1 ? Math.sin(Math.PI * roll) : 0, color: lit > 0.5 ? P.ink : P.ink40, face: lit > 0.5 ? P.card : mix(P.card, PLATE, 0.35), sizeK: 0.7 }); });
  // the label: a paper tag on a string; the lit wheel's open-loop flag is the red thing (a notched tab + dashed ring)
  tag(g, x + 30, y + H, x + 40, y + H + 26, label, { size: 30, swing: Math.sin(t * 2.1 + x) * 2, sub, night: true });
  if (red) { const fx = x + W + 6, fy = y + 24;
    pen(g, poly([[fx, fy], [fx + 70, fy], [fx + 54, fy + 24], [fx + 70, fy + 48], [fx, fy + 48]]), { fill: P.red, line: P.ink, lw: 2.5, shadow: true, breaks: false, highlight: false });
    redRing(g, fx + 30, fy + 24, 52, P.red, 2.5); }
  return W;
}
async function chapter(ctx, shot) {
  const p = shot.params ?? {}, num = Math.max(0, Math.round(p.num ?? 1)), ttl = String(p.title ?? 'Two Attics, One Message'), sub = p.sub ?? '';
  const lit = p.lit ?? 'delay', red = p.red ?? (lit !== 'none' ? 'clock' : 'num');
  const tNum = cue(shot, p.at, 0.4), tTitle = cue(shot, p.titleAt, tNum + 1.0), tSub = cue(shot, p.subAt, tTitle + ttl.length / 30 + 0.2), tDate = cue(shot, p.dateAt, 0.9);
  const delay = p.delay === undefined ? '+30' : p.delay, deadline = p.deadline === undefined ? '0:30' : p.deadline;
  return gset(ctx, shot, (g, t, _p, k) => {
    k.night = true; k.source = p.source === undefined ? 'TIMES: NYT, 16 JUL 2019 · ÉLYSÉE RECORD · CULTURE MINISTRY' : p.source;
    plateGround(g, t, k, { seed: num + 2 });
    // the hinge line of the lid (this plate is the inside of a case that will open): dashed paper line + brass knuckles
    k.view(0.8); g.save(); g.strokeStyle = rgba(P.paper, 0.4); g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(70, 40); g.lineTo(70, 1040); g.stroke(); g.restore();
    for (const v of [0.18, 0.5, 0.82]) pen(g, rrect(63, 40 + 1000 * v - 14, 14, 28, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false });
    // the numeral wheel: two drums in a brass housing; the units drum ticks up to the number (8 % overshoot per step)
    k.view(1);
    const hx = 150, hy = 170, dwid = 170, dh = 250, kin = E.back(1.6)(range(t, 0.05, 0.4));
    g.save(); g.translate(hx + 200, hy + 160); g.scale(kin, kin); g.translate(-(hx + 200), -(hy + 160));
    housing(g, hx, hy, 2 * dwid + 70, dh + 60, { t });
    const u = range(t, tNum, tNum + Math.max(0.5, 0.12 * Math.max(1, num % 10))), uT = tick(u, Math.max(1, num % 10), 0.45) * (num % 10), tens = Math.floor(num / 10);
    charDrum(g, hx + 30, hy + 30, dwid, dh, '0123456789'.split(''), tens * E.inOutCubic(u), { sizeK: 0.78 });
    charDrum(g, hx + 40 + dwid, hy + 30, dwid, dh, '0123456789'.split(''), num < 10 ? uT : (num % 10) * E.inOutCubic(u), { stripes: u > 0 && u < 1 ? 0.8 : 0, sizeK: 0.78 });
    g.restore();
    txt(g, 'CHAPTER', hx, hy - 30, { size: 26, f: 'mono', weight: 500, color: rgba(P.paper, 0.85), track: 0.3 });
    if (red === 'num') redUnder(g, hx + 40, hy + dh + 86, 2 * dwid + 10, range(t, tNum + 0.8, tNum + 1.2), { th: 9 });
    // the title writes on, 1 letter per frame (Instrument Serif, paper); the sub types on (Plex Mono, paper 85 %)
    const size = ttl.length > 26 ? 92 : 112, tl = wrap(g, ttl, 1000, { size, f: 'serif', weight: 400 });
    let shown = Math.max(0, Math.floor((t - tTitle) * 30)), y = 680;
    tl.forEach((l, i) => { const s2 = l.slice(0, Math.max(0, shown)); shown -= l.length + 1; txt(g, s2, hx, y + i * size * 1.02, { size, f: 'serif', weight: 400, color: P.paper }); });
    y += (tl.length - 1) * size * 1.02;
    g.fillStyle = P.brassL; g.fillRect(hx, y + 34, 120 * E.emphasized(range(t, tTitle + 0.3, tTitle + 0.9)), 5);
    if (sub) txt(g, typed(sub, t, tSub), hx, y + 92, { size: 28, f: 'mono', weight: 500, color: rgba(P.paper, 0.85), track: 0.14, upper: true, maxW: 1000 });
    // the two clocks, small (right column): only one is lit; the lit one carries the open-loop red flag
    k.view(1.05);
    const kw = E.decel(range(t, 0.25, 0.9));
    g.save(); g.translate((1 - kw) * 300, 0); g.globalAlpha *= clamp(kw * 2);
    if (delay != null) miniWheel(g, 1210, 230, delay, { lit: lit === 'delay' ? 1 : 0, t, roll: range(t, 0.6, 1.8), red: red === 'clock' && lit === 'delay', label: p.labelL ?? DELAY.label, sub: p.subL ?? DELAY.sub });
    if (deadline != null) miniWheel(g, 1210, 520, deadline, { lit: lit === 'deadline' ? 1 : 0, t, roll: range(t, 0.8, 2.0), red: red === 'clock' && lit === 'deadline', label: p.labelR ?? DEADLINE.label, sub: p.subR ?? DEADLINE.sub });
    g.restore();
    // the date flap (split-flap card tiles flipping through letters before they land)
    if (p.date) { const ch = String(p.date).split(''), TWd = Math.min(34, 640 / ch.length - 3), x0 = 1180;
      ch.forEach((c, i) => { const ti = tDate + i * 0.035, uu = range(t, ti, ti + 0.3), x = x0 + i * (TWd + 3); if (c === ' ') return;
        const flips = 5, idx = Math.min(flips, Math.floor(uu * flips)), r = M.rng(i * 31 + 7), seq = Array.from({ length: flips }, () => 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789'[Math.floor(r() * 35)]);
        const cc = uu >= 1 ? c : seq[idx], sq = uu >= 1 ? 1 : Math.abs(Math.cos(((uu * flips) % 1) * Math.PI));
        pen(g, rrect(x, 840, TWd, 52, 4), { fill: P.card, lw: 1.8, breaks: false, highlight: false });
        if (uu > 0) { g.save(); g.translate(x + TWd / 2, 866); g.scale(1, Math.max(0.08, sq)); txt(g, cc, 0, 12, { size: Math.min(34, TWd * 1.05), f: 'narrow', weight: 700, align: 'center', color: P.ink }); g.restore(); }
        g.fillStyle = rgba(P.ink, 0.25); g.fillRect(x, 865, TWd, 2); });
      txt(g, 'DATE · TIME', x0, 822, { size: 18, f: 'mono', weight: 500, color: rgba(P.paper, 0.75), track: 0.2 }); }
    // the coil mark (paper 85 %), bottom right above the keep-out, 4 ticks over the hold
    k.flat(); g.save(); g.translate(1790, 930); g.rotate(tick(range(t, 1.5, Math.max(2, k.D - 0.5)), 4) * TAU * 0.5); coil(g, 0, 0, 34, rgba(P.paper, 0.85), null, 3.5); g.restore();
  }, { push: 0.025, dx: 12 });
}

// ================================================================= SET: quote
function cameoMic(g, x, y, t) {
  // brass-rimmed oval frame on a card stand; inside, a press-microphone cluster on sage card (no person is drawn)
  g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.9) * 1.2 * D);
  pen(g, poly([[-16, 150], [16, 150], [40, 210], [-40, 210]]), { fill: P.kraft, lw: 2.5, shadow: true, breaks: false, highlight: false });
  pen(g, (gg) => { gg.beginPath(); gg.ellipse(0, 0, 118, 156, 0, 0, TAU); }, { fill: P.brass, lw: 3, shadow: true, shade: lampShade([-118, -156, 118, 156], 0.05, 0.55, 0.3), shadeColor: P.brassD, box: [-118, -156, 118, 156] });
  pen(g, (gg) => { gg.beginPath(); gg.ellipse(0, 0, 96, 134, 0, 0, TAU); }, { fill: P.sageL, lw: 2, breaks: false, highlight: false, shade: lampShade([-96, -134, 96, 134], 0, 0.4, 0.4), shadeColor: P.sage, box: [-96, -134, 96, 134] });
  g.save(); g.beginPath(); g.ellipse(0, 0, 96, 134, 0, 0, TAU); g.clip();
  pen(g, rrect(-70, 60, 140, 90, 6), { fill: P.ink70, lw: 2, breaks: false, highlight: false }); // the lectern
  for (const [mx, my, a, c] of [[-40, -10, -0.5, P.ink], [0, -30, 0, P.ink70], [38, -6, 0.45, P.ink], [-12, 4, -0.2, P.teal], [18, 10, 0.25, P.brassD]]) {
    g.save(); g.translate(mx, my); g.rotate(a); g.fillStyle = P.ink; g.fillRect(-3, 10, 6, 70); pen(g, pill(0, 0, 30, 46), { fill: c, lw: 2, breaks: false, highlight: false, mis: [2, 1.5] });
    g.strokeStyle = rgba(P.paper, 0.6); g.lineWidth = 1.5; g.beginPath(); for (let yy = -14; yy < 14; yy += 6) { g.moveTo(-10, yy); g.lineTo(10, yy); } g.stroke(); g.restore(); }
  g.restore(); g.restore();
}
async function quote(ctx, shot) {
  const p = shot.params ?? {};
  const en = String(p.text ?? 'Nothing points to a deliberate act.'), fr = p.fr === undefined ? '« Rien ne va dans le sens d’un acte volontaire »' : p.fr;
  const by = p.by ?? 'Rémy Heitz', role = p.role ?? 'Paris prosecutor', date = p.date ?? '2019';
  const hl = [].concat(p.highlight ?? (p.text ? [] : ['volontaire'])).map(norm).filter(Boolean);
  const isHL = (w) => hl.some(h => norm(w).startsWith(h));
  const t0 = cue(shot, p.at, 0.1), tFr = cue(shot, p.frAt, t0 + 0.45);
  const enW = en.split(/\s+/), frW = fr ? fr.split(/\s+/) : [];
  const Dd = shot.duration ?? 6, said0 = (shot.words ?? []).length ? M.wordTimes(shot, en, { fallback: tFr + 0.5, gap: 0.16 }) : enW.map((_, i) => tFr + 0.4 + i * 0.12);
  const said = said0.map((s, i) => Math.min(s, 0.6 + (i / Math.max(1, enW.length - 1)) * Math.max(0.4, Dd * 0.58 - 0.6)));
  const frT = frW.map((_, i) => tFr + i * 0.05);
  // the highlight lands when its word is said (or at hlAt)
  const hlIdx = enW.findIndex(isHL), hlFr = frW.findIndex(isHL), tHL = cue(shot, p.hlAt, hlIdx >= 0 ? said[hlIdx] + 0.15 : (hlFr >= 0 ? frT[hlFr] + 0.9 : 99));
  const tStrip = cue(shot, p.stripAt, Math.min(Dd * 0.6, said.at(-1) + 0.6));
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? 'SOURCE: PARIS PROSECUTOR, 2019 · AS REPORTED' : p.source;
    deskGround(g, t, k, { seed: 5 });
    const ki = E.decel(range(t, t0, t0 + 0.6)), oy = (1 - ki) * 900;
    const CX = 140, CW = 1640, tx = p.cameo === 'none' ? CX + 110 : CX + 450, maxW = CX + CW - 90 - tx;
    const size = p.size ?? (en.length > 140 ? 56 : en.length > 80 ? 68 : 88);
    // the French original (smaller, ink-70) then the translation (big); words ink on; highlighted words turn red
    const drawWords = (ws, times, sz, col, yy, dry = false) => {
      const sp = measure(g, ' ', { size: sz, f: 'serif', italic: true }); let x = tx, line = 0; const rects = [];
      ws.forEach((w, i) => { const ww = measure(g, w, { size: sz, f: 'serif', italic: true }); if (x + ww > tx + maxW && x > tx) { x = tx; line++; }
        const kk = range(t, times[i] - 0.05, times[i] + 0.25), yl = yy + line * sz * 1.12, red = isHL(w) && t >= tHL;
        if (!dry) txt(g, w, x, yl + (1 - E.outCubic(kk)) * 10, { size: sz, f: 'serif', weight: 400, italic: true, color: red ? P.red : col, alpha: kk });
        if (isHL(w)) rects.push([x, yl, ww]); x += ww + sp; });
      return { h: (line + 1) * sz * 1.12, rects };
    };
    const enQ = enW.map((w, i) => (i === 0 ? '“' : '') + w + (i === enW.length - 1 ? '”' : ''));
    const hFr = fr ? drawWords(frW, frT, 40, P.ink70, 0, true).h + 24 : 0, hEn = drawWords(enQ, said, size, P.ink, 0, true).h;
    const CH = Math.max(p.cameo === 'none' ? 360 : 480, 100 + hFr + size * 0.6 + hEn + 150), CY = Math.max(110, 470 - CH / 2);
    // an under-sheet (kraft), then the main card (teal spine: the system speaking), clipped at the top-left
    k.view(0.85); g.save(); g.translate(0, oy * 1.05); card(g, CX + 50, CY + 30, CW - 80, CH - 20, { fill: P.kraft, rot: 1.6, seed: 12, thick: 4, shade: 0.2 }); g.restore();
    k.view(1); g.save(); g.translate(0, oy);
    card(g, CX, CY, CW, CH, { seed: 21, rot: -0.6, thick: 6 });
    g.save(); g.translate(CX + CW / 2, CY + CH / 2); g.rotate(-0.6 * D); g.translate(-(CX + CW / 2), -(CY + CH / 2)); pen(g, rect(CX + 22, CY + 36, 18, CH - 72), { fill: P.teal, lw: 1.5, breaks: false, highlight: false }); g.restore();
    if (p.cameo !== 'none') cameoMic(g, CX + 230, CY + Math.min(270, CH / 2 - 10), t);
    let y = CY + 100, rects = [];
    if (fr) { const r = drawWords(frW, frT, 40, P.ink70, y); rects = rects.concat(r.rects); y += r.h + 24; }
    const r2 = drawWords(enQ, said, size, P.ink, y + size * 0.6);
    rects = rects.concat(r2.rects); y += size * 0.6 + r2.h;
    // the one red thing: a marker underline with a notch under the highlighted word(s)
    rects.forEach(([x, yl, ww], i) => redUnder(g, x, yl + 12, ww, range(t, tHL + i * 0.12, tHL + 0.45 + i * 0.12), { th: 6 }));
    // byline (up from the start: a paused frame always says who is speaking)
    const yb = Math.max(y + 60, CY + CH - 110);
    g.fillStyle = P.brass; g.fillRect(tx, yb - 34, 64 * E.emphasized(range(t, t0 + 0.3, t0 + 0.8)), 5);
    txt(g, `— ${by}`, tx, yb + 10, { size: 40, f: 'narrow', weight: 700, color: P.ink, alpha: E.outCubic(range(t, t0 + 0.25, t0 + 0.7)) });
    txt(g, [role, date].filter(Boolean).join(' · '), tx, yb + 52, { size: 22, f: 'mono', weight: 500, color: P.ink70, track: 0.12, upper: true, alpha: E.outCubic(range(t, t0 + 0.35, t0 + 0.8)) });
    g.restore();
    brassClip(g, CX + 140, CY + oy + 6, 1.15, -4);
    deskProps(g, k, { pencil: [1360, 1000, -4], tape: [1820, 120, 0], divider: [60, 560, -16] });
    // the strip: a thinner kraft strip under the card, plain type, no quote marks, types on
    if (p.strip) { const ks = E.decel(range(t, tStrip, tStrip + 0.4)), sw = Math.min(1500, measure(g, p.strip, { size: 30, f: 'narrow', weight: 600 }) + 80), sy = Math.min(900, CY + CH + 50);
      g.save(); g.translate((1 - ks) * -1600, 0); card(g, 210, sy, sw, 70, { fill: P.kraft, seed: 44, thick: 4, shade: 0.1, torn: true }); txt(g, typed(p.strip, t, tStrip + 0.3, 70), 250, sy + 46, { size: 30, f: 'narrow', weight: 600, color: P.ink }); g.restore(); }
  }, { push: 0.03 });
}

// ================================================================= SET: doc (recreated documents)
const DOC_DEFAULTS = {
  ticket: { head: 'FIRE PANEL · PRINTOUT', meta: ['15 APR 2019', '18:18'], lines: [{ t: 'FEU', style: 'big' }, 'ATTIC NAVE SACRISTY', { t: 'ZDA-110-3-15-1', style: 'tech' }, { t: 'ASPIRATING FRAMEWORK', style: 'tech' }],
    highlight: 'ATTIC NAVE SACRISTY', label: 'RECREATED TEXT · PANEL STRINGS AS REPORTED', source: 'SOURCE: NYT, 16 JUL 2019 · RECREATED, NOT THE ORIGINAL' },
  report: { head: 'BILAN À SIX MOIS', meta: ['14 OCT 2019'], lines: ['« tous les effondrements de voûte ont été causés par un choc consécutif à la chute d’éléments de charpente, et non par les effets du feu »'],
    highlight: 'et non par les effets du feu', label: 'RECREATED TEXT · EXCERPT', source: 'SOURCE: BILAN À SIX MOIS, 14 OCT 2019 · RECREATED' },
  statement: { head: 'STATEMENT', meta: ['PARIS PROSECUTOR · DEC 2024 (AS REPORTED)'], lines: ['Cause: still undetermined.', 'No one charged.', 'Hypotheses: a cigarette not put out, an electrical fault. Never proved.'],
    highlight: 'undetermined', label: 'RECREATED SUMMARY · NOT A QUOTE', source: 'SOURCES: PARQUET DE PARIS VIA LES SURLIGNEURS (DEC 2024) · CHECKED 6 NOV 2026' },
  post: { head: '@realDonaldTrump', meta: ['15 APR 2019'], lines: ['…perhaps flying water tankers could be used to put it out. Must act quickly!'],
    highlight: 'flying water tankers', label: 'RECREATED POST · TEXT ONLY', source: 'SOURCE: POST OF 15 APR 2019 · RECREATED, TEXT ONLY' },
};
const DOC_STYLE = { big: { size: 190, f: 'narrow', weight: 700, track: 0.06 }, mono: { size: 54, f: 'mono', weight: 500, track: 0.04 }, tech: { size: 36, f: 'mono', weight: 400, track: 0.08 },
  serif: { size: 64, f: 'serif', weight: 400 }, small: { size: 26, f: 'mono', weight: 500, track: 0.1 }, post: { size: 72, f: 'narrow', weight: 600 } };
async function doc(ctx, shot) {
  const p = shot.params ?? {}, kind = DOC_DEFAULTS[p.kind] ? p.kind : 'ticket', dd = DOC_DEFAULTS[kind];
  const head = p.head ?? dd.head, meta = p.meta ?? dd.meta, lines = (p.lines ?? dd.lines).map(l => (typeof l === 'string' ? { t: l } : l)).map(l => ({ ...l, t: String(l.t).replace(/\s+/g, ' ') }));
  const hls = [].concat(p.highlight ?? (p.lines ? [] : dd.highlight)).filter(Boolean), Dd = shot.duration ?? 6;
  const t0 = cue(shot, p.inAt, 0.1), tType = cue(shot, p.typeAt, t0 + 0.5), ats = [].concat(p.at ?? []);
  const stamp = typeof p.stamp === 'string' ? { text: p.stamp } : p.stamp ?? (kind === 'statement' ? { text: 'AS OF 6 NOV 2026' } : null);
  const W = { ticket: 1180, report: 1240, statement: 1340, post: 1360 }[kind], X0 = 960 - W / 2 + (kind === 'ticket' ? 0 : 20);
  const tx = X0 + (kind === 'ticket' ? 110 : 90), maxW = W - (kind === 'ticket' ? 170 : 180);
  let LAY = null;
  // layout pass (once fonts are in): wrapped lines with their y offsets, typing times, and the highlight rectangles (a phrase
  // may wrap: each wrapped piece gets its own rectangle)
  const layout = (g) => {
    const out = [], hl = []; let y = kind === 'post' ? 110 : 160, tc = tType;
    lines.forEach((ln) => {
      const st = ln.style ?? (kind === 'post' ? 'post' : kind === 'statement' || kind === 'report' ? 'serif' : 'mono'), o = DOC_STYLE[st];
      const wl = wrap(g, ln.t, maxW, o), lh = o.size * (st === 'big' ? 0.95 : 1.22); let off = 0; const y0 = y;
      wl.forEach((l) => { y += lh * (st === 'big' ? 1 : 0.86); out.push({ l, y, o, t0: tc }); tc += l.length / 60 + 0.08;
        for (const [hi, h] of hls.entries()) { const i0 = ln.t.indexOf(h); if (i0 < 0) continue; const a = Math.max(i0, off), b = Math.min(i0 + h.length, off + l.length);
          if (b > a) hl.push({ hi, x: tx + measure(g, l.slice(0, a - off), o), y: y - o.size * 0.78, w: measure(g, l.slice(a - off, b - off).trim(), o), hh: o.size * 0.95, long: h.length > 22 }); }
        off += l.length + 1; y += lh * (st === 'big' ? 0 : 0.14); });
      if (ln.box) out.push({ box: [tx - 14, y0 + 6, maxW + 20, y - y0 + 12] });
      y += st === 'big' ? 20 : 12; });
    const H = Math.max(kind === 'post' ? 360 : 460, y + (kind === 'post' ? 110 : 90));
    return { out, hl, H, tEnd: tc, Y0: Math.max(150, Math.min(560 - H / 2, 990 - H - 40)) };
  };
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? dd.source : p.source;
    LAY ??= layout(g);
    const { out, hl, H, tEnd, Y0 } = LAY;
    deskGround(g, t, k, { seed: 9 + kind.length, matBox: [X0 - 90, Y0 - 40, W + 240, H + 120], matRot: 1.4 });
    const ki = E.decel(range(t, t0, t0 + 0.6)), ox = (1 - ki) * 1400, rot = kind === 'ticket' ? -1.2 : kind === 'report' ? 0.8 : -0.5;
    k.view(1); g.save(); g.translate(ox, 0);
    g.translate(X0 + W / 2, Y0 + H / 2); g.rotate(rot * D); g.translate(-(X0 + W / 2), -(Y0 + H / 2));
    if (kind === 'ticket') { // a punched card ticket in a brass panel frame: perforations, punched column, corner cut, ledger rules
      housing(g, X0 - 50, Y0 - 50, W + 100, H + 100, { t, gears: true });
      pen(g, poly([[X0 + 40, Y0], [X0 + W, Y0], [X0 + W, Y0 + H], [X0, Y0 + H], [X0, Y0 + 40]]), { fill: P.card, lw: 3, shadow: true, shadowOff: [12, 14], shade: lampShade([X0, Y0, X0 + W, Y0 + H], 0, 0.14, 0.5), shadeColor: P.kraftD, box: [X0, Y0, X0 + W, Y0 + H] });
      g.fillStyle = P.kraftD; for (let yy = Y0 + 70; yy < Y0 + H - 20; yy += 36) { g.beginPath(); g.arc(X0 + 34, yy, 9, 0, TAU); g.fill(); g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.stroke(); }
      g.strokeStyle = P.ink40; g.lineWidth = 1.5; g.setLineDash([3, 7]); g.beginPath(); g.moveTo(X0 + 64, Y0 + 10); g.lineTo(X0 + 64, Y0 + H - 10); g.stroke(); g.setLineDash([]);
      g.strokeStyle = rgba(P.teal, 0.25); g.lineWidth = 1.5; g.beginPath(); for (let yy = Y0 + 170; yy < Y0 + H; yy += 60) { g.moveTo(X0 + 80, yy); g.lineTo(X0 + W - 20, yy); } g.stroke();
      // the panel lamp (brass bezel, a teal glass): lit while the strings print
      pen(g, circle(X0 + W - 70, Y0 + 70, 30), { fill: P.brass, lw: 2.5, breaks: false, highlight: false }); pen(g, circle(X0 + W - 70, Y0 + 70, 18), { fill: Math.floor(t * 4) % 2 && t < tEnd + 0.5 ? P.tealL : P.teal, lw: 2, breaks: false, highlight: false });
    } else if (kind === 'post') {
      card(g, X0, Y0, W, H, { torn: false, r: 26, seed: 3, thick: 6, shade: 0.12 });
      pen(g, circle(X0 + 60, Y0 + 66, 22), { fill: P.kraft, line: P.ink40, lw: 2, breaks: false, highlight: false }); // a blank placeholder disc (no avatar)
    } else {
      card(g, X0 + 26, Y0 + 20, W, H, { fill: P.kraft, torn: true, seed: 8, thick: 3, rot: 1.2, shade: 0.2 });
      card(g, X0, Y0, W, H, { torn: false, r: 3, seed: 5, thick: 4, shade: 0.12 });
      g.strokeStyle = rgba(P.teal, 0.2); g.lineWidth = 1.5; g.beginPath(); for (let yy = Y0 + 200; yy < Y0 + H - 30; yy += 68) { g.moveTo(X0 + 70, yy); g.lineTo(X0 + W - 40, yy); } g.stroke();
      if (kind === 'report') { for (const yy of [Y0 + 120, Y0 + H - 120]) { g.fillStyle = P.kraftD; g.beginPath(); g.arc(X0 + 40, yy, 14, 0, TAU); g.fill(); g.strokeStyle = P.ink40; g.lineWidth = 1.5; g.stroke(); } }
    }
    // the masthead (types on), meta, rule
    const hdStyle = kind === 'post' ? { size: 40, f: 'narrow', weight: 700 } : kind === 'statement' ? { size: 38, f: 'serif', weight: 400, track: 0.12 } : { size: 28, f: 'mono', weight: 500, track: 0.16 };
    const hx = kind === 'post' ? tx + 20 : tx, hy = Y0 + (kind === 'post' ? 80 : 84);
    txt(g, typed(head, t, tType - 0.3, 90), hx, hy, { ...hdStyle, color: P.ink, upper: kind !== 'post' });
    if (meta?.length) txt(g, meta.join(' · '), kind === 'post' ? hx + measure(g, head, hdStyle) + 24 : tx, kind === 'post' ? hy : hy + 40, { size: 22, f: 'mono', weight: 500, color: P.ink70, track: 0.14, upper: true, alpha: E.outCubic(range(t, tType - 0.2, tType + 0.3)) });
    if (kind !== 'post') { g.fillStyle = P.ink; g.fillRect(tx, Y0 + 138, maxW, 3); }
    // the text, typed on line by line (2 characters per frame, a cursor block while typing)
    for (const it of out) { if (it.box) { g.strokeStyle = P.ink; g.lineWidth = 2.5; g.strokeRect(it.box[0], Y0 + it.box[1], it.box[2], it.box[3]); continue; }
      const s2 = typed(it.l, t, it.t0, 60); txt(g, s2, tx, Y0 + it.y, { ...it.o, color: P.ink });
      if (s2.length < it.l.length && s2.length > 0) { g.fillStyle = P.ink70; g.fillRect(tx + measure(g, s2, it.o) + 4, Y0 + it.y - it.o.size * 0.7, it.o.size * 0.45, it.o.size * 0.8); } }
    if (kind === 'post') { g.fillStyle = P.ink40; g.fillRect(tx, Y0 + H - 74, maxW, 1.5); txt(g, 'RECREATED · TEXT ONLY · NO LOGO, NO AVATAR', tx, Y0 + H - 38, { size: 20, f: 'mono', weight: 500, color: P.ink70, track: 0.14 }); }
    // highlights: a marker loop round a short phrase, a notched underline under a long or wrapped one (each at its cue)
    const T0 = Math.max(tEnd + 0.2, Math.min(Dd * 0.45, tEnd + 0.6)), multi = new Set(hl.map(h => h.hi).filter((v, i, a) => a.indexOf(v) !== i));
    hl.forEach((f, i) => { const th = cue(shot, ats[f.hi], T0 + f.hi * 0.9) + (i * 0.2), kk = range(t, th, th + 0.55);
      if (!f.long && !multi.has(f.hi)) markerLoop(g, f.x, Y0 + f.y, f.w, f.hh, kk, { seed: 7 + i, pad: 9 }); else redUnder(g, f.x, Y0 + f.y + f.hh + 6, f.w, kk, { th: 7 }); });
    g.restore();
    if (kind !== 'ticket') brassClip(g, X0 + 120 + ox, Y0 + 6, 0.85, rot - 3);
    deskProps(g, k, { pencil: [1380, 1000, -5], tape: [1800, 130, 0] });
    // the stamp: an ink rubber stamp drops (6 f in-quad + 2 f hold) and stays (institutions never bounce)
    if (stamp) { const ts = cue(shot, stamp.at, Math.min(Dd - 1, T0 + 1.0)), u = range(t, ts, ts + 0.2); if (u > 0) {
      const sx = X0 + W - 260 + ox, sy = Y0 + H - 110, sc = 1 + 0.6 * (1 - E.inQuad(u)), sw = measure(g, stamp.text, { size: 34, f: 'mono', weight: 500, track: 0.12 }) + 50;
      g.save(); g.translate(sx, sy); g.rotate((stamp.rot ?? -8) * D); g.scale(sc, sc); g.globalAlpha *= clamp(u * 2);
      g.strokeStyle = P.ink; g.lineWidth = 5; g.strokeRect(-sw / 2, -36, sw, 72); g.lineWidth = 2; g.strokeRect(-sw / 2 + 8, -28, sw - 16, 56);
      txt(g, stamp.text, 0, 12, { size: 34, f: 'mono', weight: 500, track: 0.12, align: 'center', color: P.ink });
      halftone(g, [-sw / 2, -36, sw / 2, 36], (xx, yy) => (hsh(Math.floor(xx / 7) * 13 + Math.floor(yy / 7)) > 0.82 ? 0.35 : 0), P.card, { pitch: 7 }); g.restore(); } }
    // the label pill (top-left): what this is
    k.flat(); const lab = p.label ?? dd.label, lw2 = measure(g, lab, { size: 20, f: 'mono', weight: 500, track: 0.14 }) + 48;
    pen(g, rrect(96, 60, lw2, 44, 22), { fill: P.ink, lw: 2, breaks: false, highlight: false, shadow: true });
    pen(g, circle(118, 82, 6), { fill: P.brassL, line: null }); txt(g, lab, 132, 89, { size: 20, f: 'mono', weight: 500, color: P.paper, track: 0.14 });
  }, { push: 0.035, dx: 18 });
}

// ================================================================= SET: bignumber (the brass odometer)
async function bignumber(ctx, shot) {
  const p = shot.params ?? {}, v = p.value ?? 460, dec = p.decimals ?? (Number.isInteger(v) ? 0 : 1), from = p.from ?? 0;
  const t0 = cue(shot, p.at ?? p.word, 0.5), dur = p.roll ?? 1.6;
  const fmt = (x) => x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const final = fmt(v), slots = final.split('');
  const prefix = p.prefix ?? '', suffix = p.suffix ?? (p.value == null ? 'T' : ''), red = p.red ?? 'underline', icon = p.icon ?? (p.value == null ? 'lead' : 'none');
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? 'SOURCE: CULTURE MINISTRY (210 T ROOF + 250 T SPIRE)' : p.source;
    deskGround(g, t, k, { seed: 4, matBox: [300, 230, 1500, 660], matRot: -0.8 });
    k.view(1);
    txt(g, typed(p.kicker ?? (p.value == null ? 'LEAD ON THE ROOF AND THE SPIRE' : ''), t, 0.15), 150, 180, { size: 28, f: 'mono', weight: 500, color: P.ink70, track: 0.16, upper: true });
    // odometer geometry
    const dw = slots.length > 6 ? 130 : 170, dh = dw * 1.45, sepW = dw * 0.42, gap = 14;
    const wOf = (c) => (/\d/.test(c) ? dw : sepW);
    const plate = (s2) => (s2 ? measure(g, s2, { size: dh * 0.62, f: 'narrow', weight: 700 }) + 40 : 0);
    const pw = plate(prefix), sw = plate(suffix), inner = slots.reduce((a, c) => a + wOf(c) + gap, -gap), W = inner + pw + sw + 80 + (pw ? gap : 0) + (sw ? gap : 0), H = dh + 70;
    const X = 960 - W / 2, Y = 300, kin = E.back(1.6)(range(t, 0.05, 0.4));
    g.save(); g.translate(960, Y + H / 2); g.scale(kin, kin); g.translate(-960, -(Y + H / 2));
    housing(g, X, Y, W, H, { t: t * (1 + 6 * Math.sin(Math.PI * range(t, t0, t0 + dur))) });
    const u = range(t, t0, t0 + dur), val = from + (v - from) * E.outCubic(u), scaled = Math.round(val * 10 ** dec * 1000) / 1000 / 10 ** dec;
    let x = X + 40;
    if (pw) { pen(g, rrect(x, Y + 35, pw, dh, 6), { fill: P.card, lw: 2.5, breaks: false, highlight: false }); txt(g, prefix, x + pw / 2, Y + 35 + dh * 0.72, { size: dh * 0.62, f: 'narrow', weight: 700, align: 'center', color: P.ink }); x += pw + gap; }
    // drums: place value of each digit slot (from the right, skipping separators); lower digits roll with stripes, the leading digit ticks
    const digitIdx = []; slots.forEach((c, i) => { if (/\d/.test(c)) digitIdx.push(i); });
    const nD = digitIdx.length;
    slots.forEach((c, i) => {
      if (!/\d/.test(c)) { txt(g, c, x + sepW / 2, Y + 35 + dh * 0.78, { size: dh * 0.62, f: 'narrow', weight: 700, align: 'center', color: P.paper }); x += sepW + gap; return; }
      const place = nD - 1 - digitIdx.indexOf(i) - dec, unit = 10 ** place, cont = Math.max(0, scaled) / unit;
      const lead = digitIdx.indexOf(i) === 0, settledPos = Math.floor(cont + 1e-6) % 10;
      let pos = lead ? settledPos : cont % 10;
      if (lead) { const lu = range(t, t0 + dur * 0.55, t0 + dur); pos = (+c) * tick(lu, Math.max(1, +c), 0.5); }
      if (u >= 1) pos = +c;
      charDrum(g, x, Y + 35, dw, dh, '0123456789'.split(''), pos, { stripes: !lead && u > 0 && u < 0.9 ? 1 - u : 0, color: red === 'digits' && u >= 1 ? P.red : P.ink });
      void settledPos; x += dw + gap;
    });
    if (sw) { x += 0; pen(g, rrect(x, Y + 35, sw, dh, 6), { fill: P.card, lw: 2.5, breaks: false, highlight: false }); txt(g, suffix, x + sw / 2, Y + 35 + dh * 0.72, { size: dh * 0.62, f: 'narrow', weight: 700, align: 'center', color: P.ink }); }
    g.restore();
    if (red === 'underline') redUnder(g, X + 40, Y + H + 40, W - 80, range(t, t0 + dur + 0.1, t0 + dur + 0.5), { th: 10 });
    if (icon !== 'none') { const ix = X + W + 230, iy = Y + H + 10, ku = E.back(1.6)(range(t, 0.3, 0.6)); g.save(); g.translate(ix, iy); g.scale(ku, ku); propIcon(g, icon, t); g.restore(); }
    // the label on a card strip, then the unit / note line
    const label = p.label ?? (p.value == null ? 'tonnes of lead on the roof and the spire' : '');
    if (label) { const ks = E.decel(range(t, t0 + 0.4, t0 + 0.9)), lw2 = Math.min(1500, measure(g, label, { size: 54, f: 'narrow', weight: 600 }) + 100);
      g.save(); g.translate(0, (1 - ks) * 80); g.globalAlpha *= clamp(ks * 2); card(g, 960 - lw2 / 2, Y + H + 90, lw2, 96, { seed: 18, thick: 5, shade: 0.12 }); txt(g, label, 960, Y + H + 154, { size: 54, f: 'narrow', weight: 600, align: 'center', color: P.ink, maxW: lw2 - 60 }); g.restore(); }
    const note = p.note ?? p.unit ?? (p.value == null ? '210 T ROOF + 250 T SPIRE' : '');
    if (note) txt(g, typed(note, t, t0 + dur + 0.3), 960, Y + H + 250, { size: 24, f: 'mono', weight: 500, color: P.ink70, track: 0.16, align: 'center', upper: true });
    deskRuler(g, k);
  }, { push: 0.035 });
}

// a small paper prop beside a number (bottom-centred at 0, 0): 'lead' (stacked lead roof sheets + a melt drip), 'oak' (a stack
// of logs, end grain out), 'bell' (one brass bell on a stand)
function propIcon(g, kind, t) {
  if (kind === 'lead') { for (let i = 0; i < 6; i++) { const y = -i * 30, dx = (i % 2 ? 10 : -6) + Math.sin(i * 2.3) * 6;
      pen(g, poly([[-170 + dx, y], [150 + dx, y], [170 + dx, y - 22], [-150 + dx, y - 22]]), { fill: i % 2 ? '#9aa3b3' : '#8a93a3', lw: 2.5, shadow: i === 0, shade: 0.35, shadeColor: P.ink70, box: [-170, y - 22, 170, y], breaks: false, highlight: false });
      g.strokeStyle = rgba(P.ink, 0.35); g.lineWidth = 1.25; g.beginPath(); for (let x = -140; x < 150; x += 26) { g.moveTo(x + dx, y - 2); g.lineTo(x + dx + 10, y - 20); } g.stroke(); }
    pen(g, (gg) => { gg.beginPath(); gg.moveTo(120, -10); gg.quadraticCurveTo(140, 40, 128, 70); gg.arc(128, 78, 12, -Math.PI / 2, Math.PI * 1.5); gg.quadraticCurveTo(116, 40, 100, -10); gg.closePath(); }, { fill: '#9aa3b3', lw: 2, breaks: false, highlight: false });
    txt(g, 'LEAD', 0, 40, { size: 20, f: 'mono', weight: 500, color: P.ink70, align: 'center', track: 0.2 }); }
  else if (kind === 'oak') { for (const [x, y, r] of [[-90, -60, 60], [30, -60, 60], [-30, -160, 60], [150, -60, 50]]) { pen(g, circle(x, y, r), { fill: OAK.L, lw: 2.5, shadow: true, breaks: false, highlight: false });
      g.strokeStyle = OAK.D; g.lineWidth = 1.5; for (let rr = r * 0.2; rr < r; rr += r * 0.2) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); } } }
  else if (kind === 'bell') { pen(g, rect(-120, -260, 20, 260), { fill: OAK.M, lw: 2.5, breaks: false, highlight: false }); pen(g, rect(100, -260, 20, 260), { fill: OAK.M, lw: 2.5, breaks: false, highlight: false }); beam(g, [-140, -260], [140, -260], 22, { col: OAK.M });
    bell(g, 0, -246, 180, { tilt: Math.sin(t * 1.5) * 3 }); }
}

// ================================================================= SET: counter (split-flap card board, steps)
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COUNTER_STEPS = [
  { text: '18:18', label: 'First alarm: FEU', sub: 'SOURCES GIVE 18:18 OR 18:20' },
  { text: '18:43', label: 'Second alarm', sub: 'THE GUARD FINDS THE FIRE' },
  { text: '18:51', label: 'Brigade alert received', sub: 'ÉLYSÉE RECORD · NYT: CALL AT 18:48', red: true },
];
async function counterSet(ctx, shot) {
  const p = shot.params ?? {}, steps = (p.steps ?? COUNTER_STEPS).map(s => (typeof s === 'string' ? { text: s } : s)), Dd = shot.duration ?? 8;
  const T = cues(shot, steps, { from: 0.35, span: Math.max(1.6 * (steps.length - 1), Dd * 0.55) });
  const settled = p.settled ?? Dd < 2.2; if (settled) T[0] = Math.min(T[0], 0);
  const L = Math.max(...steps.map(s => s.text.length)), narrow = (c) => /[:.,·]/.test(c);
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? 'SOURCES: NYT, 16 JUL 2019 · ÉLYSÉE RECORD' : p.source;
    deskGround(g, t, k, { seed: 6, matBox: [230, 300, 1460, 650], matRot: 0.9 });
    k.view(0.8);
    txt(g, typed(p.kicker ?? '15 APRIL 2019 · THE FIRST HALF HOUR', t, 0.1), 150, 160, { size: 26, f: 'mono', weight: 500, color: P.ink70, track: 0.16, upper: true });
    txt(g, p.title ?? 'The clock nobody saw', 150, 238, { size: 72, f: 'serif', weight: 400, color: P.ink, alpha: E.outCubic(range(t, 0.15, 0.7)) });
    k.view(1);
    let si = 0; for (let i = 0; i < steps.length; i++) if (t >= T[i]) si = i;
    const cur = steps[si], prev = steps[Math.max(0, si - 1)], tc = T[si];
    const TW = Math.min(170, 1300 / L), TH = TW * 1.4, NW = TW * 0.42, gap = TW * 0.08;
    const widthOf = (s) => s.text.split('').reduce((a, c) => a + (c === ' ' ? TW * 0.3 : narrow(c) ? NW : TW) + gap, -gap);
    const bw = Math.max(...steps.map(widthOf)), x0b = 960 - bw / 2, y0 = 420;
    housing(g, x0b - 60, y0 - 50, bw + 120, TH + 100, { t });
    const fd = settled && si === 0 ? 0 : 0.6, redNow = cur.red && t > tc + fd + 0.1;
    const redS = typeof cur.red === 'string' ? cur.red : cur.text, redFrom = cur.text.indexOf(redS);
    let x = 960 - widthOf(cur) / 2; const to = cur.text.split(''), from = to.map((_, i) => (si && prev.text.length === to.length ? prev.text[i] : ' '));
    to.forEach((c, i) => {
      const w = c === ' ' ? TW * 0.3 : narrow(c) ? NW : TW; if (c === ' ') { x += w + gap; return; }
      const stopAt = tc + fd * (0.3 + 0.7 * i / Math.max(1, L - 1)), red = redNow && i >= redFrom && i < redFrom + redS.length;
      if (narrow(c)) { txt(g, c, x + w / 2, y0 + TH * 0.74, { size: TW * 0.9, f: 'narrow', weight: 700, align: 'center', color: P.paper }); x += w + gap; return; }
      const a = from[i], moving = t >= tc && t < stopAt && a !== c, isD = /\d/.test(c) && /\d/.test(a);
      if (moving && isD) { const dist = ((+c - +a) % 10 + 10) % 10 + 10, uu = E.outCubic(range(t, tc, stopAt)); charDrum(g, x, y0, w, TH, '0123456789'.split(''), +a + dist * uu, { stripes: 1 - uu, sizeK: 0.8 }); }
      else if (moving || (t < tc && si === 0)) { const n = 6, uu = range(t, tc, stopAt), idx = Math.min(n, Math.floor(uu * n)), r = M.rng(i * 17 + si * 101), seq = Array.from({ length: n }, () => FLAP[Math.floor(r() * 26)]);
        pen(g, rrect(x, y0, w, TH, 6), { fill: P.card, lw: 2.5, breaks: false, highlight: false });
        if (t >= tc) { const cc = idx >= n ? c : seq[idx], sq = Math.abs(Math.cos(((uu * n) % 1) * Math.PI)); g.save(); g.translate(x + w / 2, y0 + TH / 2); g.scale(1, Math.max(0.08, sq)); txt(g, cc, 0, TH * 0.28, { size: TW * 0.86, f: 'narrow', weight: 700, align: 'center', color: P.ink }); g.restore(); } }
      else charDrum(g, x, y0, w, TH, [c], 0, { sizeK: 0.8, color: red ? P.red : P.ink });
      g.fillStyle = rgba(P.ink, 0.28); g.fillRect(x, y0 + TH / 2 - 1.5, w, 3);
      pen(g, rrect(x - 3, y0 + TH / 2 - 7, 6, 14, 2), { fill: P.brassL, lw: 1.2, breaks: false, highlight: false }); pen(g, rrect(x + w - 3, y0 + TH / 2 - 7, 6, 14, 2), { fill: P.brassL, lw: 1.2, breaks: false, highlight: false });
      x += w + gap;
    });
    if (redNow) { const rx0 = 960 - widthOf(cur) / 2 + widthOf({ text: cur.text.slice(0, redFrom) }) + (redFrom ? gap : 0); redUnder(g, rx0, y0 + TH + 64, widthOf({ text: redS }), range(t, tc + fd + 0.15, tc + fd + 0.55), { th: 9 }); }
    // the label (a card strip that drops) and the sub (types on)
    const kl = E.decel(range(t, tc + 0.15, tc + fd + 0.4)), lw2 = Math.min(1500, measure(g, cur.label ?? '', { size: 58, f: 'narrow', weight: 700 }) + 110);
    if (cur.label) { g.save(); g.translate(0, (1 - kl) * -40); g.globalAlpha *= clamp(kl * 2); card(g, 960 - lw2 / 2, y0 + TH + 100, lw2, 100, { seed: 30 + si, thick: 5, shade: 0.12 }); txt(g, cur.label, 960, y0 + TH + 168, { size: 58, f: 'narrow', weight: 700, align: 'center', color: P.ink, maxW: lw2 - 60 }); g.restore(); }
    if (cur.sub) txt(g, typed(cur.sub, t, tc + 0.4), 960, y0 + TH + 250, { size: 24, f: 'mono', weight: 500, color: P.ink70, track: 0.14, align: 'center', upper: true });
    // step pips: brass rivets that fill as each step lands
    if (steps.length > 1) steps.forEach((s, i) => { const on = t >= T[i], kk = E.back(1.6)(range(t, T[i], T[i] + 0.27)), px = 960 + (i - (steps.length - 1) / 2) * 56, py = y0 - 92;
      pen(g, circle(px, py, 13), { fill: P.kraft, lw: 2, breaks: false, highlight: false }); if (on) pen(g, circle(px, py, 13 * kk), { fill: i === si ? P.brass : P.brassD, lw: 2, breaks: false, highlight: false }); });
    deskRuler(g, k);
  }, { push: 0.03 });
}

// ================================================================= SET: timeline (ticker tape through a brass roller)
const TL_EVENTS = [
  { time: '18:18', label: 'First alarm: FEU', sub: 'SOURCES: 18:18 OR 18:20' },
  { time: '18:43', label: 'Second alarm', sub: 'THE GUARD FINDS THE FIRE' },
  { time: '18:51', label: 'Brigade alerted', sub: 'ÉLYSÉE · NYT: 18:48' },
  { time: '19:00', label: 'First crews', sub: 'JUST BEFORE 19:00' },
  { time: '19:50', label: 'The spire falls', sub: '≈19:45 DRAC · ≈19:50 MINISTRY' },
  { time: '21:30', label: 'Tower plan approved', sub: 'CULTURE MINISTRY' },
  { time: '21:45', label: '“She is saved”', sub: '≈21:45 NYT · 22:00 MINISTRY' },
];
const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
async function timeline(ctx, shot) {
  const p = shot.params ?? {}, ev = (p.events ?? TL_EVENTS).map(e => (typeof e === 'string' ? { time: e } : e)), Dd = shot.duration ?? 12;
  const timed = ev.every(e => e.time), ppm = p.pxPerMin ?? 24, sp = p.spacing ?? 330;
  const X = ev.map((e, i) => (timed ? (hm(e.time) - hm(ev[0].time)) * ppm : i * sp));
  const T = cues(shot, ev, { from: 0.6, span: Math.min(Dd * 0.8, Math.max(1.1 * (ev.length - 1), Dd - 2.2)) });
  const fIdx = p.focus == null ? null : (typeof p.focus === 'number' ? p.focus : ev.findIndex(e => e.time === p.focus || e.date === p.focus));
  // the tape position (the coordinate under the roller): ticks from event to event (ease-in-out 0.7 s), a tiny overshoot
  const posAt = (t) => { if (fIdx != null && fIdx >= 0) return X[fIdx]; let x = X[0] - 220 * (1 - E.outCubic(range(t, 0, 0.6)));
    for (let i = 1; i < ev.length; i++) x += (X[i] - X[i - 1]) * M.E.back(1.2)(range(t, T[i] - 0.75, T[i] - 0.05)); return x; };
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? 'SOURCES: NYT 16 JUL 2019 · ÉLYSÉE · CULTURE MINISTRY · DRAC' : p.source;
    deskGround(g, t, k, { seed: 8, gears: true, matBox: [1120, 640, 900, 520], matRot: -2 });
    k.view(0.8); txt(g, typed(p.title ?? '15 APRIL 2019 · THE EVENING', t, 0.1), 150, 160, { size: 26, f: 'mono', weight: 500, color: P.ink70, track: 0.16, upper: true });
    k.view(1);
    const pos = posAt(t), RX = 960, TY = 470, TH = 130, SX = (x) => RX + x - pos;
    // spools at the two edges (layer 0/1), turning with the feed
    for (const [sx, sgn] of [[60, 1], [1860, -1]]) { const r = 150, a = pos / r * sgn; pen(g, circle(sx, TY + TH / 2, r), { fill: P.kraft, lw: 3, shadow: true, shade: 0.3, shadeColor: P.kraftD, box: [sx - r, TY + TH / 2 - r, sx + r, TY + TH / 2 + r] });
      g.save(); g.strokeStyle = P.ink40; g.lineWidth = 1.25; for (let rr = 40; rr < r; rr += 9) { g.beginPath(); g.arc(sx, TY + TH / 2, rr, 0, TAU); g.stroke(); } g.restore();
      pen(g, gearPath(sx, TY + TH / 2, 46, 10, a), { fill: P.brass, lw: 2.5, breaks: false, shade: 0.4, shadeColor: P.brassD, box: [sx - 46, TY + TH / 2 - 46, sx + 46, TY + TH / 2 + 46] }); }
    // the tape: card strip with sprocket holes, a printed minute ruler, hour labels
    g.save(); g.fillStyle = 'rgba(11,20,38,0.14)'; g.fillRect(0, TY + 14, 1920, TH); g.restore();
    pen(g, rect(-20, TY, 1960, TH), { fill: P.card, lw: 2.5, breaks: false, highlight: false, shade: (xx, yy) => clamp((yy - TY) / TH * 0.25), shadeColor: P.kraftD, box: [-20, TY, 1940, TY + TH] });
    g.save(); g.beginPath(); g.rect(-20, TY, 1960, TH); g.clip();
    const step = timed ? ppm * 5 : sp / 4, first = Math.floor((pos - 1100) / step);
    g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath();
    for (let j = first; j < first + 2400 / step; j++) { const xx = SX(j * step), big = timed ? (j % 6 === 0) : j % 4 === 0; g.moveTo(xx, TY + TH); g.lineTo(xx, TY + TH - (big ? 26 : 12)); g.moveTo(xx + step / 2, TY + 8); g.lineTo(xx + step / 2, TY + 18); } g.stroke();
    g.fillStyle = P.kraftD; for (let j = first * 2; j < (first + 2400 / step) * 2; j++) { const xx = SX(j * step / 2); g.beginPath(); g.roundRect(xx - 5, TY + 26, 10, 7, 2); g.fill(); }
    if (timed) for (let m = Math.floor((hm(ev[0].time) + (pos - 1100) / ppm) / 30) * 30 + 15; m < hm(ev[0].time) + (pos + 1100) / ppm; m += 30) { const xx = SX((m - hm(ev[0].time)) * ppm); txt(g, `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, xx + 6, TY + TH - 34, { size: 18, f: 'mono', weight: 500, color: P.ink70, track: 0.1 }); }
    g.restore();
    // events: punched holes + printed time; tags hang from the current event and its neighbours (<= 3 tags in frame)
    let cur = 0; ev.forEach((e, i) => { if (Math.abs(SX(X[i]) - RX) < Math.abs(SX(X[cur]) - RX)) cur = i; });
    ev.forEach((e, i) => { const xx = SX(X[i]); if (xx < -300 || xx > 2220) return; const punched = t >= T[i] - 0.8 || (fIdx != null && i <= fIdx);
      if (punched) { pen(g, circle(xx, TY + TH * 0.66, 15), { fill: '#3d3a3a', lw: 2.5, breaks: false, highlight: false }); g.fillStyle = P.kraftD; g.beginPath(); g.arc(xx + 4, TY + TH * 0.66 + 4, 9, 0, TAU); g.fill(); }
      txt(g, e.time ?? e.date ?? '', xx, TY + 58, { size: 30, f: 'mono', weight: 500, align: 'center', color: punched ? P.ink : P.ink40, track: 0.04 });
      if (punched && Math.abs(i - cur) <= 1) { const hi = i % 2 === 0, ty = hi ? TY - 250 : TY - 150, sw = Math.sin(t * 2.2 + i) * 3 * (1 - range(t, T[i], T[i] + 1.2)) - 1.5;
        tag(g, xx, TY + 4, xx - 40, ty, e.label ?? '', { size: i === cur ? 36 : 30, swing: sw, sub: e.sub }); } });
    // the building at the tape's time (mid layer, lower right): fire grows from the first alarm, the spire goes at 19:50,
    // the fire is down by "she is saved" (a state card, not a clock)
    if (timed && p.building !== false) { const m = hm(ev[0].time) + pos / ppm, kk = 3.6, bx0 = 1220, by0 = 985, X = (q) => bx0 + q * kk, Y = (q) => by0 - q * kk;
      const fire = clamp((m - hm('18:30')) / 60) * (1 - clamp((m - hm('21:30')) / 30) * 0.8), gone = m >= hm('19:50');
      const st = { sky: 'dusk', fireS: fireSections(fire), roofGone: clamp((m - hm('19:00')) / 60) * 0.7, spire: gone ? 'gone' : 'standing', glow: fire, wind: 0.4, smoke: 0.8, glowWin: fire > 0.1 };
      k.view(0.9); pen(g, rect(bx0 - 70, by0, 128 * kk + 140, 14), { fill: P.kraft, lw: 2, breaks: false, highlight: false });
      sideFire(g, X, Y, kk, st, t, true); sideCard(g, bx0, by0, kk, st, t); sideFire(g, X, Y, kk, st, t, false); k.view(1); }
    // the brass roller housing at the centre + the red pointer under it (the one red thing: notched, dashed ring)
    k.view(1.05);
    pen(g, rrect(RX - 70, TY - 70, 140, 64, 12), { fill: P.brass, lw: 3, shadow: true, shade: 0.35, shadeColor: P.brassD, box: [RX - 70, TY - 70, RX + 70, TY - 6] });
    pen(g, rrect(RX - 70, TY + TH + 6, 140, 64, 12), { fill: P.brass, lw: 3, shadow: true, shade: 0.35, shadeColor: P.brassD, box: [RX - 70, TY + TH + 6, RX + 70, TY + TH + 70] });
    for (const yy of [TY - 6, TY + TH + 6]) { pen(g, gearPath(RX, yy, 34, 12, pos / 34 * (yy < TY ? 1 : -1)), { fill: P.brassL, lw: 2.5, breaks: false, shade: 0.35, shadeColor: P.brass, box: [RX - 34, yy - 34, RX + 34, yy + 34] }); pen(g, circle(RX, yy, 9), { fill: P.brassD, lw: 2, breaks: false, highlight: false }); }
    const py = TY + TH + 92; pen(g, poly([[RX, TY + TH + 24], [RX + 26, py], [RX + 10, py], [RX, py - 12], [RX - 10, py], [RX - 26, py]]), { fill: P.red, lw: 2.5, breaks: false, highlight: false, shadow: true });
    redRing(g, RX, TY + TH + 64, 46);
    txt(g, 'NOW', RX, py + 40, { size: 20, f: 'mono', weight: 500, color: P.ink70, align: 'center', track: 0.2 });
  }, { push: 0.02, dx: 0 });
}

// ================================================================= SET: compare (scale on the table: a ruler, or a balance)
function winderFig(g, x, y, H, o = {}) { return WINDER.draw(g, x, y, H, o); }
function carCut(g, x, y, w, t = 0) { // a family car as a paper cut-out standing on its wheels (x = centre, y = ground)
  const h = w * 0.36;
  pen(g, poly([[x - w / 2, y - h * 0.3], [x - w / 2 + 10, y - h * 0.62], [x - w * 0.22, y - h * 0.66], [x - w * 0.1, y - h], [x + w * 0.22, y - h], [x + w * 0.36, y - h * 0.64], [x + w / 2 - 6, y - h * 0.56], [x + w / 2, y - h * 0.3], [x + w / 2, y - h * 0.16], [x - w / 2, y - h * 0.16]]),
    { fill: P.teal, lw: 3, shadow: true, shade: lampShade([x - w / 2, y - h, x + w / 2, y], 0.05, 0.45, 0.35), shadeColor: P.tealD, box: [x - w / 2, y - h, x + w / 2, y] });
  pen(g, poly([[x - w * 0.18, y - h * 0.66], [x - w * 0.07, y - h * 0.92], [x + w * 0.08, y - h * 0.92], [x + w * 0.08, y - h * 0.66]]), { fill: P.tealL, lw: 2, breaks: false, highlight: false });
  pen(g, poly([[x + w * 0.12, y - h * 0.66], [x + w * 0.12, y - h * 0.92], [x + w * 0.2, y - h * 0.92], [x + w * 0.31, y - h * 0.66]]), { fill: P.tealL, lw: 2, breaks: false, highlight: false });
  for (const wx of [x - w * 0.3, x + w * 0.3]) { pen(g, circle(wx, y - h * 0.16, h * 0.2), { fill: P.ink70, lw: 3, breaks: false, highlight: false }); pen(g, circle(wx, y - h * 0.16, h * 0.08), { fill: P.brassL, lw: 1.5, breaks: false, highlight: false }); }
}
function standUp(g, x, y, u, draw) { if (u <= 0) return; g.save(); g.translate(x, y); g.scale(1, E.back(1.6)(clamp(u))); g.translate(-x, -y); draw(); g.restore(); }
async function compare(ctx, shot) {
  const p = shot.params ?? {}, mode = p.mode ?? 'height';
  const A = { ...(mode === 'height' ? { kind: 'spire', label: 'Spire', value: 96, sub: 'to the tip of the rooster' } : { kind: 'bell', label: 'Gabriel', value: 4.162, sub: 'largest bell, north tower' }), ...(p.a ?? {}) };
  const B = { ...(mode === 'height' ? { kind: 'towers', label: 'Towers', value: 69, sub: 'the west front' } : { kind: 'car', label: 'A family car', value: 1.5, sub: 'typical · illustrative' }), ...(p.b ?? {}) };
  const unit = p.unit ?? (mode === 'height' ? 'M' : 'T'), tA = cue(shot, p.at, 0.4), tB = cue(shot, p.bAt, tA + 0.9), tR = tB + 0.9;
  const red = p.red ?? (mode === 'height' ? 'diff' : 'ratio');
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? (mode === 'height' ? 'SOURCES: VILLE DE PARIS (93 M SPIRE, 96 M WITH ROOSTER) · TOWERS 69 M' : 'BELL: NOTRE-DAME DE PARIS (2013 BELLS) · CAR MASS TYPICAL, ILLUSTRATIVE') : p.source;
    deskGround(g, t, k, { seed: 11, matBox: [120, 290, 1680, 700], matRot: -0.6 });
    k.view(0.8);
    txt(g, typed(p.kicker ?? (mode === 'height' ? 'TO SCALE · ONE RULER' : 'ON ONE BALANCE'), t, 0.1), 150, 150, { size: 26, f: 'mono', weight: 500, color: P.ink70, track: 0.16, upper: true });
    txt(g, p.title ?? (mode === 'height' ? 'How tall was the spire?' : 'How heavy is one bell?'), 150, 226, { size: 68, f: 'serif', weight: 400, color: P.ink, alpha: E.outCubic(range(t, 0.15, 0.7)) });
    k.view(1);
    // the table top: card with a front edge in kraft (thickness) and a contact line
    const TY = 900; pen(g, rect(-40, TY, 2000, 220), { fill: P.card, lw: 3, breaks: false, highlight: false, shade: (xx, yy) => clamp((yy - TY) / 200 * 0.3), shadeColor: P.kraftD, box: [-40, TY, 1960, TY + 200] });
    pen(g, rect(-40, TY + 150, 2000, 40), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false });
    if (mode === 'height') {
      const maxV = Math.max(A.value, B.value) * 1.08, S = (TY - 300) / maxV, Y = (m) => TY - m * S;
      // the brass ruler (pulls up from the table), ticks every 5, labels every 10 (bible §9.3)
      const ur = E.decel(range(t, 0.2, 0.9)), rx = 1660, top = lerp(TY, Y(maxV), ur);
      pen(g, rect(rx, top, 54, TY - top), { fill: P.brassL, lw: 2.5, shadow: true, shade: 0.3, shadeColor: P.brass, box: [rx, top, rx + 54, TY], breaks: false });
      g.save(); g.beginPath(); g.rect(rx - 60, top, 200, TY - top); g.clip(); g.strokeStyle = P.ink; g.lineWidth = 2;
      for (let m = 0; m <= maxV; m += 5) { const yy = Y(m); g.beginPath(); g.moveTo(rx, yy); g.lineTo(rx + (m % 10 === 0 ? 26 : 14), yy); g.stroke(); if (m % 20 === 0) txt(g, String(m), rx + 64, yy + 8, { size: 22, f: 'mono', weight: 500, color: P.ink70 }); } g.restore();
      txt(g, unit === 'M' ? 'METRES' : unit, rx + 27, TY + 40, { size: 18, f: 'mono', weight: 500, color: P.ink70, align: 'center', track: 0.16 });
      const draw = (O, cx, uu) => standUp(g, cx, TY, uu, () => {
        if (O.kind === 'spire') { const kk = S, ox = cx - 66 * kk; sideCard(g, ox, TY, kk, { sky: 'day', fireS: fireSections(0), roofGone: 0, spire: 'standing', glow: 0 }, t); spire(g, ox + 66 * kk, TY - 43 * kk, kk, looks('day'), { spire: 'standing' }, t); return ox + 66 * kk; }
        if (O.kind === 'towers') { const kk = S; facadeCard(g, cx - 20.5 * kk, TY, kk, { sky: 'day', fireS: fireSections(0), spire: 'gone', glow: 0 }, t); return cx; }
        if (O.kind === 'person') { winderFig(g, cx, TY, Math.max(30, O.value * S), { pose: 'lookup', t }); return cx; }
        const h = O.value * S, w = Math.max(60, h * 0.4); pen(g, rect(cx - w / 2, TY - h, w, h), { fill: P.sage, lw: 3, shadow: true, shade: lampShade([cx - w / 2, TY - h, cx + w / 2, TY], 0, 0.45, 0.4), shadeColor: P.sageD, box: [cx - w / 2, TY - h, cx + w / 2, TY] }); return cx; });
      const ua = range(t, tA, tA + 0.35), ub = range(t, tB, tB + 0.35);
      const ax = A.kind === 'spire' ? 560 : 520, bx = A.kind === 'spire' ? 1230 : 1250;
      draw(A, ax, ua); draw(B, bx, ub);
      // level lines to the ruler + value tags
      const level = (O, x, uu, col, below = false) => { if (uu < 0.6) return; const yy = Y(O.value), kk = E.emphasized(range(uu, 0.6, 1));
        g.save(); g.strokeStyle = col; g.lineWidth = 2.5; g.setLineDash([10, 7]); g.beginPath(); g.moveTo(x, yy); g.lineTo(lerp(x, rx, kk), yy); g.stroke(); g.restore();
        const ax2 = lerp(x, rx, below ? 0.3 : 0.45); tag(g, ax2, yy, ax2 - 40, below ? yy + 40 : yy - 118, `${O.label} · ${O.value} ${unit}`, { size: 28, swing: Math.sin(t * 2 + x) * 2, sub: O.sub }); };
      const sTip = A.kind === 'spire' ? ax - 66 * S + 66 * S : ax;
      level(A, sTip + 10, range(t, tA + 0.3, tA + 1.1), P.ink70, A.value < B.value); level(B, bx + 20.5 * S + 10, range(t, tB + 0.3, tB + 1.1), P.ink70, B.value <= A.value);
      // the difference bracket on the ruler: the one red thing
      if (red === 'diff') { const kd = E.decel(range(t, tR, tR + 0.5)), y1 = Y(Math.max(A.value, B.value)), y2 = Y(Math.min(A.value, B.value)), bxR = rx - 26;
        if (kd > 0) { g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.beginPath(); g.moveTo(bxR + 14, y1); g.lineTo(bxR, y1); g.lineTo(bxR, lerp(y1, y2, kd)); g.lineTo(bxR + 14, lerp(y1, y2, kd)); g.stroke(); g.restore();
          const dv = Math.abs(A.value - B.value), lab = `+${Number.isInteger(dv) ? dv : dv.toFixed(1)} ${unit}`; pen(g, poly([[bxR - 150, (y1 + y2) / 2 - 30], [bxR - 18, (y1 + y2) / 2 - 30], [bxR - 4, (y1 + y2) / 2], [bxR - 18, (y1 + y2) / 2 + 30], [bxR - 150, (y1 + y2) / 2 + 30]]), { fill: P.red, lw: 2.5, breaks: false, highlight: false, shadow: true, alpha: clamp(kd * 2) });
          txt(g, lab, bxR - 84, (y1 + y2) / 2 + 13, { size: 38, f: 'narrow', weight: 700, color: P.paper, align: 'center', alpha: clamp(kd * 2) }); } }
    } else {
      // the balance (bible §9.3): a brass beam on a fulcrum; it tips on a spring (the only object allowed to wobble twice)
      const cx = 960, fy = 470, L = 520, ratio = A.value / B.value, tipT = range(t, tB + 0.2, tB + 1.1), tip = (ratio > 1 ? -1 : 1) * Math.min(9, 3 + Math.log2(Math.max(ratio, 1 / ratio)) * 3) * E.spring(tipT) * D;
      pen(g, poly([[cx - 26, fy], [cx + 26, fy], [cx + 80, TY], [cx - 80, TY]]), { fill: P.brass, lw: 3, shadow: true, shade: lampShade([cx - 80, fy, cx + 80, TY], 0.05, 0.5, 0.3), shadeColor: P.brassD, box: [cx - 80, fy, cx + 80, TY] });
      pen(g, gearPath(cx, fy, 40, 12, t * 0.3), { fill: P.brassL, lw: 2.5, breaks: false, shade: 0.35, shadeColor: P.brass, box: [cx - 40, fy - 40, cx + 40, fy + 40] });
      g.save(); g.translate(cx, fy); g.rotate(tip); pen(g, rrect(-L - 30, -14, 2 * L + 60, 28, 10), { fill: P.brassL, lw: 3, shadow: true, shade: 0.3, shadeColor: P.brass, box: [-L - 30, -14, L + 30, 14] }); g.restore();
      const pan = (sx) => { const px = cx + Math.cos(tip) * sx * L, py = fy + Math.sin(tip) * sx * L, ply = py + 230;
        g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 150, ply); g.moveTo(px, py); g.lineTo(px + 150, ply); g.stroke(); g.restore();
        pen(g, (gg) => { gg.beginPath(); gg.moveTo(px - 180, ply); gg.quadraticCurveTo(px, ply + 70, px + 180, ply); gg.closePath(); }, { fill: P.brass, lw: 3, shadow: true, shade: 0.35, shadeColor: P.brassD, box: [px - 180, ply, px + 180, ply + 40] });
        return [px, ply]; };
      const [ax, ay] = pan(-1), [bx2, by2] = pan(1);
      standUp(g, ax, ay, range(t, tA, tA + 0.35), () => { if (A.kind === 'bell') bell(g, ax, ay - 230, 270, { lw: 3, red: !!A.red }); else carCut(g, ax, ay, 300, t); });
      const nB = Math.max(1, Math.round(B.count ?? 1));
      standUp(g, bx2, by2, range(t, tB, tB + 0.35), () => { for (let i = 0; i < nB; i++) { const ox2 = bx2 + (i - (nB - 1) / 2) * 120; if (B.kind === 'car') carCut(g, ox2, by2 - i * 0, nB > 1 ? 200 : 300, t); else bell(g, ox2, by2 - 200, 230, { lw: 3 }); } });
      for (const [O, x, y, tt, sg] of [[A, ax, ay, tA, -1], [B, bx2, by2, tB, 1]]) if (t > tt + 0.4) tag(g, x, y + 30, x + sg * 40 - 120, y + 110, `${O.label} · ${O.value >= 1 ? +O.value.toFixed(1) : O.value} ${unit}`, { size: 30, swing: Math.sin(t * 2 + x) * 2, sub: O.sub });
      if (red === 'ratio') { const kd = E.decel(range(t, tR, tR + 0.5)), lab = `≈ ${ratio >= 1 ? ratio.toFixed(1) : (1 / ratio).toFixed(1)}×`;
        if (kd > 0) { g.save(); g.translate(cx, 300); g.scale(kd, kd); pen(g, poly([[-110, -44], [110, -44], [110, 26], [14, 26], [0, 44], [-14, 26], [-110, 26]]), { fill: P.red, lw: 2.5, breaks: false, highlight: false, shadow: true });
          txt(g, lab, 0, 4, { size: 48, f: 'narrow', weight: 700, color: P.paper, align: 'center' }); g.restore(); } }
    }
    deskRuler(g, k, { y: 1030, x: 140, w: 520 });
  }, { push: 0.03 });
}

// ================================================================= SET: winder (the host stand-in, bible §6.1 / §6.7)
// pose library: lean (deg, + = forward), arms [front, back] as [shoulder, elbow] degrees (0 = hanging, 90 = forward), legs
// [front, back] degrees, gaze (dial hand, deg clockwise from 12; null = pin only), squash, hop (px up), key mode
const POSES = {
  idle: { lean: 0, armF: [12, 6], armB: [-12, -4], legF: 6, legB: -6, gaze: 90, key: 'still' },
  point: { lean: 5, armF: [96, -6], armB: [-18, -8], legF: 10, legB: -10, gaze: 80, key: 'still' },
  lookup: { lean: -8, armF: [40, 30], armB: [-34, -30], legF: 6, legB: -10, gaze: 0, key: 'still', stretch: 0.03 },
  rundown: { lean: 15, armF: [18, 4], armB: [8, 2], legF: 4, legB: -4, gaze: 180, key: 'rundown', drop: 0.09 },
  panic: { lean: -8, armF: [150, -40], armB: [-150, 40], legF: 26, legB: -24, gaze: 'spin', key: 'panic', hop: 0.07 },
  think: { lean: 3, armF: [60, 120], armB: [-10, -6], legF: 6, legB: -6, gaze: 165, key: 'think' },
  shrug: { lean: -2, armF: [70, -80], armB: [-70, 80], legF: 8, legB: -8, gaze: 90, key: 'still', squash: 0.03 },
  proud: { lean: -7, armF: [170, 0], armB: [-20, -10], legF: 12, legB: -12, gaze: 45, key: 'still', stretch: 0.04 },
  deadpan: { lean: 0, armF: [4, 0], armB: [-4, 0], legF: 4, legB: -4, gaze: null, key: 'still' },
};
const WINDER = {
  // the Winder: teal capsule body (1:1.7), pill arms and legs, a dial head (card disc, 4 ink-40 ticks, brass pin, one ink
  // gaze hand), a brass three-lobed wind-up key in its back. Faceless: no eyes, no mouth. Characters animate on twos.
  draw(g, x, y, H, { pose = 'idle', pose2 = null, mix: mx = 0, t = 0, face = 1, key = null } = {}) {
    const A = POSES[pose] ?? POSES.idle, B = POSES[pose2] ?? A, u = clamp(mx), L = (a, b) => (typeof a === 'number' && typeof b === 'number' ? lerp(a, b, u) : (u < 0.5 ? a : b));
    const Q = { lean: L(A.lean, B.lean), armF: [L(A.armF[0], B.armF[0]), L(A.armF[1], B.armF[1])], armB: [L(A.armB[0], B.armB[0]), L(A.armB[1], B.armB[1])], legF: L(A.legF, B.legF), legB: L(A.legB, B.legB),
      gaze: u < 0.5 ? A.gaze : B.gaze, key: key ?? (u < 0.5 ? A.key : B.key), drop: L(A.drop ?? 0, B.drop ?? 0), hop: L(A.hop ?? 0, B.hop ?? 0), stretch: L(A.stretch ?? 0, B.stretch ?? 0), squash: L(A.squash ?? 0, B.squash ?? 0) };
    const tw = twos(t), breath = Math.sin(tw * 2.2) * 0.012, hop = Q.hop ? Math.abs(Math.sin(tw * 9)) * Q.hop * H : 0;
    const bh = H * 0.4, bw = bh / 1.7, legL = H * 0.26, armL = H * 0.25, hr = H * 0.15, lw = Math.max(2, H / 120), sy = 1 + Q.stretch + breath - Q.squash;
    // contact shadow + hard cast shadow (down-right)
    g.save(); g.fillStyle = 'rgba(11,20,38,0.18)'; g.beginPath(); g.ellipse(x + H * 0.04, y + 2, bw * 1.25 * (1 - hop / H), bw * 0.24, 0, 0, TAU); g.fill(); g.restore();
    g.save(); g.translate(x, y - hop); g.scale(face, 1);
    const limb = (px, py, a1, a2, len, w, c) => { const l1 = len * 0.55, l2 = len * 0.5, ex = px + Math.sin(a1 * D) * l1, ey = py + Math.cos(a1 * D) * l1;
      for (const [sx, sy2, a, l] of [[px, py, a1, l1], [ex, ey, a1 + a2, l2]]) { g.save(); g.translate(sx, sy2); g.rotate(-a * D); pen(g, pill(0, l / 2 - w / 2 + w * 0.3, w, l + w * 0.3), { fill: c, lw, breaks: false, highlight: false, mis: [2, 1.5] }); g.restore(); }
      return [ex + Math.sin((a1 + a2) * D) * l2, ey + Math.cos((a1 + a2) * D) * l2]; };
    const hip = -legL;
    limb(-bw * 0.18, hip, Q.legB, 0, legL + lw, bw * 0.34, P.tealD);
    g.save(); g.translate(0, hip); g.rotate(Q.lean * D); g.scale(1, sy);
    // the key in the back (turns: still / think = 8 ticks per 24 f / panic = fast spin / rundown = slowing)
    const kAng = Q.key === 'panic' ? t * 14 : Q.key === 'think' ? (Math.floor(t / 0.8) + tick(fract(t / 0.8), 8)) * TAU : Q.key === 'rundown' ? (1 - Math.exp(-t * 0.8)) * 5 : 0;
    const kx = -bw * 0.62, ky = -bh * 0.55, kl = bh * 0.45;
    g.save(); g.translate(kx, ky); pen(g, rect(-kl * 0.42, -kl * 0.07, kl * 0.42, kl * 0.14), { fill: P.brassD, lw: lw * 0.8, breaks: false, highlight: false });
    g.translate(-kl * 0.42, 0); g.scale(Math.cos(kAng) * 0.85 + (Math.cos(kAng) >= 0 ? 0.15 : -0.15), 1);
    for (const a of [0, 120, 240]) { g.save(); g.rotate((a + 90) * D); pen(g, (gg) => { gg.beginPath(); gg.arc(0, -kl * 0.3, kl * 0.2, 0, TAU); gg.moveTo(kl * 0.08, -kl * 0.3); gg.arc(0, -kl * 0.3, kl * 0.08, 0, TAU, true); }, { fill: P.brass, lw: lw * 0.8, breaks: false, highlight: false, mis: [1.5, 1], shade: 0.3, shadeColor: P.brassD, box: [-kl * 0.2, -kl * 0.5, kl * 0.2, -kl * 0.1] }); g.restore(); }
    pen(g, circle(0, 0, kl * 0.1), { fill: P.brassD, lw: lw * 0.8, breaks: false, highlight: false }); g.restore();
    if (Q.key === 'panic') { g.save(); g.strokeStyle = P.ink70; g.lineWidth = lw; for (const r of [0.55, 0.7]) { g.beginPath(); g.arc(kx - kl * 0.42, ky, kl * r, -1.2, -0.3); g.stroke(); } g.restore(); }
    limb(-bw * 0.1, -bh * 0.82, Q.armB[0], Q.armB[1], armL, bw * 0.3, P.tealD);
    // the body capsule: teal, lamp-side highlight, halftone shade, a brass band (the movement plate)
    pen(g, pill(0, -bh / 2, bw, bh), { fill: P.teal, lw: lw * 1.2, shadow: true, shadowOff: [H * 0.03, H * 0.035], shade: lampShade([-bw / 2, -bh, bw / 2, 0], 0.03, 0.5, 0.35), shadeColor: P.tealD, box: [-bw / 2, -bh, bw / 2, 0] });
    g.fillStyle = P.brassL; g.fillRect(-bw / 2 + lw, -bh * 0.36, bw - 2 * lw, bh * 0.06);
    // the dial head (gaze hand ticks between positions)
    const hy = -bh - hr * 0.95 + Q.drop * H;
    pen(g, rect(-bw * 0.08, -bh - hr * 0.2 + Q.drop * H * 0.5, bw * 0.16, hr * 0.4), { fill: P.tealD, lw: lw * 0.8, breaks: false, highlight: false });
    pen(g, circle(0, hy, hr), { fill: P.card, lw: lw * 1.2, shadow: true, shadowOff: [H * 0.025, H * 0.03], shade: lampShade([-hr, hy - hr, hr, hy + hr], 0, 0.35, 0.45), shadeColor: P.kraftD, box: [-hr, hy - hr, hr, hy + hr] });
    g.strokeStyle = P.ink40; g.lineWidth = lw; g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.moveTo(Math.sin(a) * hr * 0.72, hy - Math.cos(a) * hr * 0.72); g.lineTo(Math.sin(a) * hr * 0.88, hy - Math.cos(a) * hr * 0.88); } g.stroke();
    let gz = Q.gaze; if (gz === 'spin') gz = (tw * 720) % 360; else if (Q.key === 'rundown') gz = 90 + 90 * tick(clamp(t / 1.4), 3);
    if (gz != null) { g.save(); g.translate(0, hy); g.rotate(gz * D); g.fillStyle = P.ink; g.beginPath(); g.moveTo(-hr * 0.07, 0); g.lineTo(0, -hr * 0.8); g.lineTo(hr * 0.07, 0); g.closePath(); g.fill(); g.restore(); }
    pen(g, circle(0, hy, hr * 0.12), { fill: P.brass, lw: lw * 0.8, breaks: false, highlight: false });
    limb(bw * 0.12, -bh * 0.82, Q.armF[0], Q.armF[1], armL, bw * 0.3, P.teal);
    g.restore();
    limb(bw * 0.18, hip, Q.legF, 0, legL + lw, bw * 0.34, P.teal);
    g.restore();
    return { headY: y - hop - legL - (bh + hr) * sy, hand: [x + face * (bw * 0.12 + Math.sin((Q.lean + Q.armF[0]) * D) * armL), y - legL - bh * 0.82 + Math.cos(Q.armF[0] * D) * armL] };
  },
};
async function winder(ctx, shot) {
  const p = shot.params ?? {}, pose = p.pose ?? 'point', prop = p.prop ?? 'cards', side = p.side ?? 'left', Dd = shot.duration ?? 6;
  const tIn = cue(shot, p.at, 0.2), tPose = cue(shot, p.poseAt, Dd * 0.55), cards = p.cards ?? ['SEND THEM IN', 'HOLD BACK'];
  const red = p.red ?? (prop === 'cards' ? 'card:1' : prop === 'none' ? 'none' : 'prop');
  return gset(ctx, shot, (g, t, _p, k) => {
    k.source = p.source === undefined ? (prop === 'bell' || prop === 'tower' ? 'PAPER MODEL · BELL WEIGHTS: NOTRE-DAME DE PARIS (2013)' : 'ILLUSTRATION') : p.source;
    deskGround(g, t, k, { seed: 13, mat: false });
    k.view(0.6); // back wall: a kraft pin board with a pinned survey sheet of the west front (pale: layer 3) and teal pins
    { const bx = side === 'left' ? 1080 : 120, sx = side === 'left' ? 1180 : 220; pen(g, rrect(bx, 110, 720, 640, 10), { fill: P.kraft, line: P.kraftD, lw: 3, shadow: true, shade: lampShade([bx, 110, bx + 720, 750], 0, 0.3, 0.4), shadeColor: P.kraftD, box: [bx, 110, bx + 720, 750], breaks: false });
      pen(g, rect(sx - 30, 150, 41 * 7 + 60, 560), { fill: P.paper, line: P.ink40, lw: 1.5, breaks: false, highlight: false });
      g.save(); g.globalAlpha = 0.55; facadeCard(g, sx, 660, 7, { sky: 'day', fireS: fireSections(0), spire: 'gone', glow: 0 }, t); g.restore();
      for (const [px2, py2] of [[sx - 14, 166], [sx + 41 * 7 + 14, 166], [bx + 640, 520], [bx + 600, 300]]) { pen(g, circle(px2, py2, 11), { fill: P.teal, lw: 2, breaks: false, highlight: false }); }
      pen(g, rect(bx + 520, 380, 170, 120), { fill: P.sageL, line: P.ink40, lw: 1.5, breaks: false, highlight: false }); g.save(); g.strokeStyle = P.sageD; g.lineWidth = 1.25; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(bx + 540, 410 + i * 22); g.lineTo(bx + 670 - (i % 2) * 40, 410 + i * 22); } g.stroke(); g.restore(); }
    k.view(1);
    // the table top is a sage cutting mat seen at a low angle: grid lines converge, rows close up toward the back
    const TY = 880; pen(g, rect(-40, TY, 2000, 260), { fill: P.sageL, line: P.sageD, lw: 3, breaks: false, highlight: false, shade: (xx, yy) => clamp((yy - TY) / 220 * 0.4), shadeColor: P.sage, box: [-40, TY, 1960, TY + 220] });
    g.save(); g.strokeStyle = rgba(P.sageD, 0.55); g.lineWidth = 1.25; g.beginPath(); for (let x = -1000; x < 2960; x += 64) { g.moveTo(x, TY); g.lineTo(x + (x - 960) * 0.35, TY + 220); }
    for (let y = TY + 10, d = 10; y < 1100; y += d, d *= 1.25) { g.moveTo(-40, y); g.lineTo(1960, y); } g.stroke(); g.restore();
    pen(g, rect(-40, TY - 6, 2000, 8), { fill: P.sage, line: P.sageD, lw: 2, breaks: false, highlight: false });
    const H = p.size ?? 470, wx = side === 'left' ? 560 : 1360, face = side === 'left' ? 1 : -1, px = side === 'left' ? 1200 : 680;
    // the prop (stands up 4 f after the Winder)
    const up = range(t, tIn + 0.13, tIn + 0.4);
    standUp(g, px, TY + 10, up, () => {
      if (prop === 'cards') cards.forEach((c, i) => { const cx = px - 190 + i * 380, tilt = (i ? 3 : -3) + Math.sin(t * 1.6 + i) * 0.6, isRed = red === `card:${i}`;
        g.save(); g.translate(cx, TY + 4); g.save(); g.fillStyle = 'rgba(11,20,38,0.16)'; g.beginPath(); g.ellipse(30, 2, 200, 14, 0, 0, TAU); g.fill(); g.restore();
        g.rotate(tilt * D); pen(g, poly([[70, -150], [150, 0], [110, 0]]), { fill: P.kraftD, lw: 2.5, breaks: false, highlight: false }); // the easel leg behind
        card(g, -170, -296, 340, 290, { seed: 50 + i, thick: 6, shade: 0.15 });
        const ls = wrap(g, c, 280, { size: 56, f: 'narrow', weight: 700 }); ls.forEach((l, j) => txt(g, l, 0, -170 + j * 60 - (ls.length - 1) * 30, { size: 56, f: 'narrow', weight: 700, align: 'center', color: P.ink }));
        mono(g, i ? 'OPTION B' : 'OPTION A', 0, -50, 18, P.ink70, 'center');
        if (isRed) { pen(g, poly([[110, -300], [170, -300], [170, -230], [140, -248], [110, -230]]), { fill: P.red, lw: 2.5, breaks: false, highlight: false, shadow: true }); redRing(g, 140, -268, 52); }
        g.restore(); });
      else if (prop === 'bell') { pen(g, rect(px - 170, TY - 330, 26, 330), { fill: OAK.M, lw: 2.5, shadow: true, breaks: false, highlight: false }); pen(g, rect(px + 144, TY - 330, 26, 330), { fill: OAK.M, lw: 2.5, shadow: true, breaks: false, highlight: false });
        beam(g, [px - 190, TY - 330], [px + 190, TY - 330], 28, { col: OAK.M, lw: 2 }); const sw = Math.sin(t * 1.4) * 4;
        bell(g, px, TY - 312, 240, { tilt: sw, red: red === 'prop', lw: 3 }); if (red !== 'prop') { g.save(); g.setLineDash([7, 6]); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.arc(px, TY - 205, 170, 0, TAU); g.stroke(); g.restore(); } else redRing(g, px, TY - 205, 170); }
      else if (prop === 'tower') { g.save(); g.translate(px - 190, TY - 640); g.scale(0.55, 0.55);
        cardTower(g, 0, 0, 640, 1150, { open: 1, belfryBot: 0.62, inside: (gg, a0, b0, a1, b1) => bellFrameInside(gg, a0, b0, a1, b1, { char: 0.5, flame: 0.4, redBell: red === 'prop' ? 2 : -1, slip: 0, t, weights: false }), t }); g.restore(); }
      else if (prop === 'clock') { g.save(); g.translate(px - 250, TY - 330); counterBadge(g, 0, 0, p.time ?? '18:48', { scale: 2, t, red: red === 'prop' }); g.restore(); pen(g, poly([[px - 30, TY - 140], [px + 30, TY - 140], [px + 70, TY + 10], [px - 70, TY + 10]]), { fill: P.kraft, lw: 2.5, breaks: false, highlight: false }); }
    });
    // the Winder pops up on its card stand (8 f, back-ease) and switches pose on the cue (the dial hand ticks)
    const mx = tick(range(t, tPose, tPose + 0.25), 2, 0.4);
    const wkey = p.key ?? null;
    let info = null; standUp(g, wx, TY + 8, range(t, tIn, tIn + 0.27), () => { info = WINDER.draw(g, wx, TY + 8, H, { pose, pose2: p.pose2 ?? null, mix: p.pose2 ? mx : 0, t, face, key: wkey }); });
    if (p.label !== false && info && t > tIn + 0.3) tag(g, wx + face * 20, info.headY + 30, wx + face * (side === 'left' ? -330 : 60) - (side === 'left' ? 0 : 0), info.headY - 150, p.label ?? 'You', { size: 34, swing: Math.sin(t * 2.4) * 3 * (1 - range(t, tIn + 0.3, tIn + 1.6)), sub: p.sub ?? 'the commander’s call' });
    deskRuler(g, k, { y: 1030, x: side === 'left' ? 1120 : 420, w: 560 });
    deskProps(g, k, { pencil: [side === 'left' ? 340 : 1100, 1000, 3], tape: [side === 'left' ? 900 : 1020, 985, 0], divider: [side === 'left' ? 1820 : 120, 760, side === 'left' ? 18 : -18] });
  }, { push: 0.03 });
}

// ================================================================= exports
export const GSETS = { title, chapter, quote, doc, bignumber, counter: counterSet, timeline, compare, winder };
export const GKIT = { cue, cues, txt, measure, wrap, typed, redUnder, markerLoop, card, brassClip, charDrum, housing, deskGround, deskRuler, plateGround, WINDER, POSES, carCut, PLATE };
export default function makeNotreDameGraphics() { return { ...GSETS }; }
