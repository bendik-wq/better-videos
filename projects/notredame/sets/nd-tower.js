// NOTRE-DAME (episode 10) chapter 4 "THE SECOND CLOCK": the hero sets of the tower plan, in the Paper & Spring look
// (docs/library/animation-study/STYLE-BIBLE.md). Registered additively in nd-graphics.js GSETS (so the runtime resolves
// word cues it finds and leaves unknown ones as strings: every cue here falls back to a default). Uses the nd-sets KIT and
// the nd-graphics GKIT lazily (inside the factories only), so the circular imports are safe.
//
// Fact locks honoured by construction (VISUALS rev 9): no sectioned building (the climb is a separate flat STAIR STRIP toy
// beside the closed model, never a route inside a tower); faceless dial-head figures, never a telephone or an empty chair;
// flame is brass paper, never red; the bell frame stays unlit until `band` (L85); bells dormant, never off their pins; the
// right wheel carries no minute numbers, only record tags; exactly one red thing, chosen by `red`.
//
// Shared params (every set): cam {x,y,z,rot}, zoomTo {x,y,z,at,dur} | [..] (nd-sets camera), sky 'day'|'dusk'|'night',
//   chips [{text, sub, at}] (paper chips top-right), strip {lines:[big, small..], at, big (n big lines, 1), red (substring of
//   any line: notched red underline), redAt, out} (lower third), warn {lines:[..], at} (two-line ⚠ chip, bottom-left above the
//   source), corner {label, sub, at, ang, run, runAt, freezeAt, tags:[{text, at}], red} (the small right wheel, top-left),
//   plates [{name, role, at}] (corner name plates, top-left), source, smokeSeed/smokeStyle.
//
// briefing   the briefing table at police headquarters (a separate set: never a table inside the cathedral). view 'room'
//            (back wall + window card with the bell-frame toy beyond, its tower burning beneath the unlit frame; hanging
//            lamp; table; seated dial-head figures with name plates; Gallet standing at the end) | 'pov' (seated at the table:
//            the two option cards near, the president's figure at the far end, the window behind him).
//            params: plateAt (the POLICE HEADQUARTERS plate drops), plateText/plateSub, lit {weil, gallet, president}: cue
//            each name plate lights, told (true: "told it later" tags), gaze {gallet: [[at, deg]..], weil: ..} (dial hands
//            turn on cues), cards true, part 0..1 (+partAt/partDur: the two option cards slide apart), flip 0..1 (+flipAt/
//            flipDur: HOLD BACK turns to DO NOTHING · 05:00), fade 0..1 (+fadeAt/fadeDur: its towers fade to outline),
//            red 'gap'|'window'|'tower'|'edge'|'none' (+redAt: the red appears on a cue)
// stairStrip the H9 stair-strip toy: S-tower strip, bridge tab with a card gate, N-tower strip with a wall section and a
//            floor strip, the BELL HEIGHT mark, a miniature bell-frame toy on top; the card model (towers intact) beside it and
//            a fire-engine token with a brass pump wheel at the foot. layout 'stand' (default) | 'flat' (L72: laid on the
//            table, day). lead 0..1 (+leadFrom, leadAt/leadDur: the lead tally's place on the route; 19 follow), n (20),
//            hoses true, route 0..1 (+At/Dur: teal dashed route drawn on), spring 0..1 (+At/Dur: the brass mainspring under
//            the strip tightens), gate 0..1 (+At/Dur: the gate folds flat), wallFlame / floorFlame 0..1 (+At/Dur: flame cards
//            stand up), wallOut / floorOut 0..1 (+At/Dur: they fold away), spray [{to:'wall'|'floor', at, dur}], band 0..1
//            (+At/Dur: the frame's own flame band), bandOut (+At/Dur), pale true (band set back one layer), smoke 0..1 (smoke
//            from the unlit frame), gonUp / gonDown 0..1 (+At/Dur: GEN. GONTIER up the N-strip, down the S-strip), labels,
//            red 'nozzle'|'latch'|'floor'|'mark'|'route'|'none' (+redSeq [{red, at}])
// deadlineWheel the right wheel (CLOCK TWO · DEADLINE) close: brass wheel, index with a notch, escapement pallet, mainspring
//            barrel. wind 0..1 (+windAt/windDur), runAt (the index starts ticking), stopAt (hard stop), tags [{text, sub, at}]
//            (record tags on strings, right), half true (the ½ H tag), red 'half'|'notch'|'none'
// riser      MECH inserts (day paper): view 'riser' (the cathedral's own dry riser up a card wall, a leaking joint, the
//            pressure gauge: needle 0..1 +needleAt/needleDur drops, leakAt) | 'hose' (macro: embers the size of a thumb
//            punch holes in a teal hose: holesAt [cue, cue, cue], thumbAt; pull 0..1 +pullAt: pull back). red 'needle'|'hole'
// tallyField view 'foot' (the field of ink tallies at the foot of the S-strip; step 0..1 +stepAt: twenty step forward and turn
//            teal) | 'field' (≈ 500 as 10 groups of 50; pills 0..1 +pillsAt: 1 FIREFIGHTER + 2 POLICE slide out) | 'parvis'
//            (night parvis at the north door: the twenty teal tallies + the ink tallies of L57, the "0" card pinned by a brass
//            clip: zeroAt). red 'ring'|'pills'|'zero'|'none'
// nightModel view 'lid' (the burnt roof lid lifts off the side card and is laid aside: liftAt) | 'tv' (a card TV camera on a
//            tripod in front of the bell-frame toy, its tower burning beneath the unlit frame) | 'curtain' (the night west
//            front, teal water ribbons at the top of both towers over the north tower's frame band: band, bandTo, bandAt) |
//            'tags' (two ≈ tags on a string across the night front, a dashed ½ h arc) | 'type' (a TYPE card on the drafting
//            table: text, clip) | 'survey' (the roofless model at night from low, an ink-40 survey-lamp beam sweeps: sweepAt,
//            sweepTo, the loupe lying unused) | 'vault' (looking straight down into the open model: the stone shell, one
//            burning piece drops: dropAt; three breaks: breakAt; bands 0..1 +bandsAt: flame bands still crawl round it; rain)
import * as THREE from 'three';
import * as M from '/engine/motion.js';
import { KIT } from './nd-sets.js';
import { GKIT } from './nd-graphics.js';
import { bellExtrasWorld } from './nd-airdrop.js';

let K = null; const boot = () => (K ??= { ...KIT, ...GKIT });
const clamp = M.clamp, lerp = (a, b, u) => a + (b - a) * u, range = (t, a, b) => clamp((t - a) / (b - a));
const fract = (x) => x - Math.floor(x), hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const TAU = Math.PI * 2, D = Math.PI / 180;
// animated param: p[key] (target) from p[key+'From'] (0) over [At, At+Dur]; unresolved cues fall back to `fb` seconds
function an(p, key, t, def = 0, fb = 0.5, dur = 1.2, ease = M.E.inOutSine) {
  const ks = p[key + 'KeysAt'] ?? p[key + 'Keys']; if (Array.isArray(ks) && ks.length) { // keyframes [[at, value, dur?], ...]: each moves from the previous value
    let v = ks[0][1]; for (let i = 1; i < ks.length; i++) { const [at, val, d] = ks[i], a = num(at, fb + i); v = lerp(v, val, ease(range(t, a, a + num(d, dur)))); } return v; }
  const v = p[key] ?? def; if (typeof v !== 'number') return v; const at = p[key + 'At']; if (at == null) return v;
  const a = num(at, fb); return lerp(p[key + 'From'] ?? 0, v, ease(range(t, a, a + num(p[key + 'Dur'], dur))));
}
const up = (t, at, fb, dur = 0.5) => range(t, num(at, fb), num(at, fb) + dur);
function redAt(p, t, def = 'none') { let r = p.red ?? def; if (p.redAt != null && t < num(p.redAt, 0)) r = 'none'; if (p.redSeq) for (const q of p.redSeq) if (t >= num(q.at, 0)) r = q.red; return r; }
const twos = (t) => Math.floor(t * 15) / 15;

// ---------------------------------------------------------------- fonts + the set frame
let FONTS = null;
const fonts = () => (FONTS ??= (async () => { await document.fonts.ready; for (const f of ['600 34px "Archivo Narrow"', '700 200px "Archivo Narrow"', '500 22px "Plex Mono"', '400 84px "Instrument Serif"', 'italic 400 60px "Instrument Serif"']) { try { await document.fonts.load(f); } catch { /* optional */ } } })());
async function frame(ctx, shot, world, { source = 'ILLUSTRATION · PAPER MODEL', screen = null } = {}) {
  boot(); await fonts();
  const L0 = K.canvasLayer(ctx), p = shot.params ?? {}, sky = p.sky ?? 'night', night = sky !== 'day';
  const o = { p, sky, night, shot, D: shot.duration ?? 6 };
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; K.smokeFor(p, shot);
    g.setTransform(s, 0, 0, s, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.letterSpacing = '0px';
    g.fillStyle = K.P.paper; g.fillRect(0, 0, 1920, 1080);
    K.applyCam(g, s, K.camAt(p, t), t);
    world(g, t, p, o);
    g.setTransform(s, 0, 0, s, 0, 0); g.setLineDash([]);
    if (screen) screen(g, t, p, o);
    overlays(g, t, p, o);
    K.fibre(g, night ? 0.06 : 0.085);
    const src = p.source === undefined ? source : p.source; if (src) K.sourceSlip(g, src);
  } };
}

// ---------------------------------------------------------------- grounds
// paper ground: day = the drafting table (lamp pool + survey grid); dusk = kraft under a light navy wash (≤ 30 %), lamp-lit;
// night = paper night: kraft under a navy halftone (never a glow on deep navy)
function ground(g, t, sky, { pool = [700, 360, 900], gears = true, seed = 1 } = {}) {
  const { P, lampPool, halftone, pen, gearPath, mix } = K;
  if (sky === 'day') {
    lampPool(g, pool[0], pool[1], pool[2], P.paper, mix(P.card, P.kraft, 0.85));
    g.save(); g.strokeStyle = rgba(P.ink40, 0.2); g.lineWidth = 1.25; g.beginPath(); for (let x = -160; x < 2100; x += 64) { g.moveTo(x, -300); g.lineTo(x, 1400); } for (let y = -136; y < 1400; y += 64) { g.moveTo(-300, y); g.lineTo(2200, y); } g.stroke(); g.restore();
  } else {
    const base = sky === 'dusk' ? mix(P.kraft, P.dusk, 0.2) : mix(P.kraft, P.night, 0.5);
    g.fillStyle = base; g.fillRect(-600, -600, 3200, 2400);
    const [px, py, pr] = pool, dens = sky === 'dusk' ? 0.12 : 0.3;
    lampPoolTone(g, px, py, pr, base, sky === 'dusk' ? 0.35 : 0.22);
    halftone(g, [-600, -600, 2600, 1800], (x, y) => { const d = Math.hypot((x - px) / 1.4, y - py) / pr; return clamp(dens * clamp(d - 0.3) * 1.4); }, sky === 'dusk' ? P.dusk : P.night, { pitch: 7, max: 0.8 });
  }
  if (gears) { const r0 = M.rng(seed * 17 + 3), bg = sky === 'day' ? P.paper : sky === 'dusk' ? mix(P.kraft, P.dusk, 0.4) : mix(P.kraft, P.night, 0.62);
    for (let i = 0; i < 4; i++) { const gx = [120, 1800, 1700, 260][i] + (r0() - 0.5) * 100, gy = [140, 120, 960, 990][i] + (r0() - 0.5) * 80, r = 110 + r0() * 120;
      pen(g, gearPath(gx, gy, r, Math.round(r / 9), t * (i % 2 ? -0.05 : 0.06) + i), { fill: mix(P.brassL, bg, 0.6), line: null, shade: 0.25, shadeColor: mix(P.brass, bg, 0.5), box: [gx - r, gy - r, gx + r, gy + r] }); } }
}

// a posterised lamp pool on a toned ground (hard-edged steps toward the paper colour)
function lampPoolTone(g, x, y, r, base, amt = 0.3) { const { P, mix } = K; [[1.3, 0.33], [0.95, 0.66], [0.62, 1]].forEach(([k, u]) => { g.beginPath(); g.ellipse(x, y, r * k * 1.4, r * k, -0.15, 0, TAU); g.fillStyle = mix(base, P.card, amt * u); g.fill(); }); }

// ---------------------------------------------------------------- screen overlays (chips, strip, warn, corner wheel, plates)
function overlays(g, t, p, o) {
  if (p.plates) plates(g, p.plates, t);
  if (p.corner) cornerWheel(g, p.corner, t, o);
  if (p.chips) chipStack(g, p.chips, t);
  if (p.strip) strip(g, p.strip, t);
  if (p.strip2) strip(g, p.strip2, t);
  if (p.note) note(g, p.note, t);
  if (p.warn) warn(g, p.warn, t);
}
function chipStack(g, chips, t) {
  const { P, pen, rrect, mono } = K; let y = 70;
  for (const c of chips) { const u = range(t, num(c.at, 0.3), num(c.at, 0.3) + 0.35); if (u <= 0) continue;
    const sc = c.small ? 0.78 : 1;
    g.save(); g.font = `600 ${30 * sc}px "Archivo Narrow"`; const w1 = g.measureText(c.text).width; g.font = `500 ${19 * sc}px "Plex Mono"`; g.letterSpacing = `${3 * sc}px`; const w2 = c.sub ? g.measureText(String(c.sub).toUpperCase()).width : 0; g.restore();
    const W = Math.max(w1, w2) + 56 * sc, H = (c.sub ? 92 : 62) * sc, x = 1920 - 80 - W + (1 - M.E.outCubic(u)) * 600;
    pen(g, rrect(x, y, W, H, 6), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, rrect(x + 12, y - 8, 30, 18, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
    g.save(); g.font = `600 ${30 * sc}px "Archivo Narrow"`; g.fillStyle = P.ink; g.fillText(c.text, x + 28 * sc, y + 44 * sc); g.restore();
    if (c.sub) mono(g, c.sub, x + 28 * sc, y + 76 * sc, 19 * sc, P.ink70);
    y += H + 20; }
}
// lower-third strip on kraft: big lines in Archivo, small lines in mono; `red` (a substring) gets a notched red underline
function strip(g, s, t) {
  const { P, pen, rect, mono } = K; const ls = [].concat(s.lines ?? []), at = num(s.at, 0.4), big = s.big ?? 1;
  const u = M.E.outCubic(range(t, at, at + 0.45)) * (s.outAt == null ? 1 : 1 - M.E.inCubic(range(t, num(s.outAt, 1e9), num(s.outAt, 1e9) + 0.4))); if (u <= 0 || !ls.length) return;
  const isBig = (i) => i < big, fnt = (i) => isBig(i) ? (s.serif ? 'italic 400 40px "Instrument Serif"' : '600 34px "Archivo Narrow"') : '500 20px "Plex Mono"';
  let w = 0; g.save(); ls.forEach((l, i) => { g.font = fnt(i); g.letterSpacing = isBig(i) ? '0px' : '3px'; w = Math.max(w, g.measureText(isBig(i) ? l : String(l).toUpperCase()).width); }); g.restore();
  const lh = (i) => isBig(i) ? 46 : 34, H = 30 + ls.reduce((a, _, i) => a + lh(i), 0), W = Math.min(1780, w + 84), x0 = 960 - W / 2, y0 = s.pos === 'top' ? 56 : 1080 - 104 - H;
  g.save(); g.translate((1 - u) * -1900, 0);
  pen(g, rect(x0, y0, W, H), { fill: P.kraft, lw: 2, shadow: true, breaks: false, highlight: false });
  let yy = y0 + 14; ls.forEach((l, i) => { yy += lh(i); const yb = yy - (isBig(i) ? 12 : 10);
    if (isBig(i)) { g.font = fnt(i); g.fillStyle = P.ink; g.textBaseline = 'alphabetic'; g.fillText(l, x0 + 42, yb); }
    else mono(g, l, x0 + 42, yb, 20, P.ink70);
    if (s.red && String(l).includes(s.red)) { const ru = range(t, num(s.redAt, at + 0.5), num(s.redAt, at + 0.5) + 0.35);
      if (ru > 0) { g.save(); g.font = fnt(i); g.letterSpacing = isBig(i) ? '0px' : '3px'; const L = isBig(i) ? l : String(l).toUpperCase(), sub = isBig(i) ? s.red : String(s.red).toUpperCase(), i0 = L.indexOf(sub), xs = g.measureText(L.slice(0, i0)).width, ws = g.measureText(sub).width; g.restore();
        notchUnder(g, x0 + 42 + xs, yb + 7, ws, ru); } } });
  g.restore();
}
// a quote card in a screen column: wrapped big text + mono source lines; `red` (a substring) gets a notched underline
function note(g, n, t) {
  const { P, pen, rect, mono } = K; const at = num(n.at, 0.4), u = M.E.outCubic(range(t, at, at + 0.45)); if (u <= 0) return;
  const x = n.x ?? 84, y0 = n.y ?? 120, w = n.w ?? 640, size = n.size ?? 40, f = n.serif ? 'serif' : 'narrow', wt = n.serif ? 400 : 600;
  const ls = K.wrap(g, n.text, w - 70, { size, f, weight: wt }), subs = [].concat(n.sub ?? []), lh = size * 1.18, H = 54 + ls.length * lh + subs.length * 30;
  g.save(); g.translate((1 - u) * -900, 0); K.card(g, x, y0, w, H, { seed: 23, thick: 6, shade: 0.1 }); K.brassClip(g, x + 70, y0 + 6, 0.7);
  ls.forEach((l, i) => { const yb = y0 + 34 + (i + 1) * lh - size * 0.25; K.txt(g, l, x + 36, yb, { size, f, weight: wt, italic: !!n.serif });
    if (n.red && l.includes(n.red)) { const ru = range(t, num(n.redAt, at + 0.6), num(n.redAt, at + 0.6) + 0.35), xs = K.measure(g, l.slice(0, l.indexOf(n.red)), { size, f, weight: wt, italic: !!n.serif }), ws = K.measure(g, n.red, { size, f, weight: wt, italic: !!n.serif }); notchUnder(g, x + 36 + xs, yb + 8, ws, ru); } });
  subs.forEach((s2, i) => mono(g, s2, x + 36, y0 + 40 + ls.length * lh + 10 + i * 30, 17, P.ink70));
  g.restore();
}
function notchUnder(g, x, y, w, k, th = 6) { const { P } = K; if (k <= 0) return; const ww = w * M.E.outCubic(clamp(k)); g.save(); g.fillStyle = P.red; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ww, y); if (ww > 24) { g.lineTo(x + ww - 10, y + th / 2); g.lineTo(x + ww, y + th); } else g.lineTo(x + ww, y + th); g.lineTo(x, y + th); g.closePath(); g.fill(); g.restore(); }
function warn(g, w, t) {
  const { P, pen, rect, mono } = K; const u = M.E.outCubic(range(t, num(w.at, 1), num(w.at, 1) + 0.4)); if (u <= 0) return; const ls = [].concat(w.lines);
  g.save(); g.font = '500 18px "Plex Mono"'; g.letterSpacing = '2.6px'; const W = Math.max(...ls.map(l => g.measureText(String(l).toUpperCase()).width)) + 92; g.restore();
  const H = 22 + ls.length * 30, x = 84 + (1 - u) * -900, y = (w.y ?? 1080 - 104) - H;
  pen(g, rect(x, y, W, H), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
  g.save(); g.fillStyle = P.ink; g.beginPath(); g.moveTo(x + 22, y + 34); g.lineTo(x + 38, y + 8); g.lineTo(x + 54, y + 34); g.closePath(); g.fill(); g.fillStyle = P.card; g.font = '700 18px "Archivo Narrow"'; g.textAlign = 'center'; g.fillText('!', x + 38, y + 31); g.restore();
  ls.forEach((l, i) => mono(g, l, x + 70, y + 30 + i * 30, 18, i ? P.ink70 : P.ink));
}
function plates(g, list, t) {
  const { P, pen, rect, mono } = K; let y = 64;
  for (const q of list) { const u = M.E.outCubic(range(t, num(q.at, 0.2), num(q.at, 0.2) + 0.35)); if (u <= 0) continue;
    g.save(); g.font = '600 28px "Archivo Narrow"'; const w1 = g.measureText(q.name).width; g.restore(); const W = Math.max(w1 + 110, 300), x = 84 + (1 - u) * -500;
    pen(g, rect(x, y, W, 78), { fill: P.card, lw: 2.2, shadow: true, breaks: false, highlight: false });
    dialHead(g, x + 40, y + 39, 24, { gaze: q.gaze ?? 90, t });
    g.save(); g.font = '600 28px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(q.name, x + 80, y + 36); g.restore(); mono(g, q.role ?? '', x + 80, y + 63, 15, P.ink70);
    y += 96; }
}
// a dial head: card disc, four ink-40 ticks, one gaze hand, brass pin (STYLE-BIBLE §6.1/§6.4): never a face
function dialHead(g, x, y, r, { gaze = 90, t = 0, fill = null } = {}) {
  const { P, pen, circle, lampShade } = K;
  pen(g, circle(x, y, r), { fill: fill ?? P.card, lw: Math.max(1.6, r / 14), shade: lampShade([x - r, y - r, x + r, y + r], 0, 0.35, 0.45), shadeColor: P.kraftD, box: [x - r, y - r, x + r, y + r], breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink40; g.lineWidth = Math.max(1.4, r / 14); g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.moveTo(x + Math.sin(a) * r * 0.7, y - Math.cos(a) * r * 0.7); g.lineTo(x + Math.sin(a) * r * 0.88, y - Math.cos(a) * r * 0.88); } g.stroke();
  g.translate(x, y); g.rotate(gaze * D); g.fillStyle = P.ink; g.beginPath(); g.moveTo(-r * 0.08, 0); g.lineTo(0, -r * 0.8); g.lineTo(r * 0.08, 0); g.closePath(); g.fill(); g.restore();
  pen(g, circle(x, y, r * 0.13), { fill: P.brass, lw: 1.2, breaks: false, highlight: false });
}
// gaze from a cue list [[at, deg], ...] (ticks into place, 3 steps)
function gazeAt(list, t, def = 90) { if (!list) return def; let g0 = def, out = def; for (const [at, deg] of list) { const u = K.tick(range(t, num(at, 0), num(at, 0) + 0.35), 3); out = lerp(g0, deg, u); if (u < 1) return out; g0 = deg; } return out; }

// ---------------------------------------------------------------- the right wheel (CLOCK TWO): drawn by deadlineWheel and the corner badge
// index angle (deg): still until runAt, then one escapement step per second with a spring settle; frozen at stopAt / freezeAt
function indexAng(t, { runAt = null, stopAt = null, freezeAt = null, step = 6, ang = 0 } = {}) {
  if (runAt == null) return { a: ang, run: false };
  const r0 = num(runAt, 1e9); let tt = t; let stopped = false;
  if (freezeAt != null && t >= num(freezeAt, 1e9)) { const f = num(freezeAt, 1e9) - r0; return { a: ang + (Math.floor(Math.max(0, f)) + 0.5) * step, run: false, frozen: true }; }
  if (stopAt != null && t >= num(stopAt, 1e9)) { tt = num(stopAt, 1e9); stopped = true; }
  const e = tt - r0; if (e <= 0) return { a: ang, run: false };
  const k = Math.floor(e), f = e - k, s = f < 0.82 ? 0 : M.E.springTight((f - 0.82) / 0.18);
  let a = ang + (k + s) * step;
  if (stopped) { const d = t - num(stopAt, 0); a += Math.sin(d * 40) * Math.exp(-d * 9) * 2.2; }
  return { a, run: !stopped, stopped };
}
function wheel(g, x, y, R, { a = 0, t = 0, red = 'none', night = false, run = false, half = true, escape = true } = {}) {
  const { P, pen, circle, gearPath, lampShade, mono, poly, rrect } = K, n = Math.round(R / 7) + 10;
  // escapement pallet (anchor) on top: rocks one way each tick while running
  if (escape) { const rock = run ? Math.sin(Math.floor(t) * Math.PI + Math.PI / 2) * 9 * (1 - range(fract(t), 0.0, 0.25) * 0.4) : 0;
    g.save(); g.translate(x, y - R * 1.12); g.rotate(rock * D);
    pen(g, poly([[-R * 0.42, R * 0.18], [-R * 0.08, -R * 0.06], [R * 0.08, -R * 0.06], [R * 0.42, R * 0.18], [R * 0.34, R * 0.24], [0, R * 0.04], [-R * 0.34, R * 0.24]]), { fill: P.brass, lw: 2.5, shade: 0.4, shadeColor: P.brassD, box: [-R * 0.42, -R * 0.06, R * 0.42, R * 0.24], breaks: false });
    pen(g, circle(0, 0, R * 0.06), { fill: P.brassL, lw: 2, breaks: false, highlight: false }); g.restore(); }
  pen(g, gearPath(x, y, R, n, a * D * 0.5), { fill: P.brass, lw: 3, shadow: true, shadowOff: [14, 16], shade: 0.45, shadeColor: P.brassD, box: [x - R, y - R, x + R, y + R], breaks: false });
  pen(g, circle(x, y, R * 0.8), { fill: night ? '#e2d9c6' : P.card, lw: 2.5, shade: lampShade([x - R, y - R, x + R, y + R], 0.03, 0.35, 0.5), shadeColor: P.kraftD, box: [x - R, y - R, x + R, y + R], breaks: false });
  // the track: a brass-light ring (no minute numbers, no minute ticks: only the start mark and the ½ H mark at the top)
  g.save(); g.strokeStyle = P.brassL; g.lineWidth = R * 0.07; g.beginPath(); g.arc(x, y, R * 0.66, 0, TAU); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, R * 0.66 + R * 0.035, 0, TAU); g.moveTo(x + R * 0.66 - R * 0.035, y); g.arc(x, y, R * 0.66 - R * 0.035, 0, TAU); g.stroke(); g.restore();
  if (half) { g.save(); g.fillStyle = P.ink; g.beginPath(); g.moveTo(x, y - R * 0.56); g.lineTo(x - R * 0.06, y - R * 0.76); g.lineTo(x + R * 0.06, y - R * 0.76); g.closePath(); g.fill(); g.restore();
    if (R > 70) { g.save(); g.font = `700 ${R * 0.13}px "Archivo Narrow"`; g.fillStyle = P.ink70; g.textAlign = 'center'; g.fillText('½ H', x, y - R * 0.38); g.restore(); } }
  // the index: a brass hand with a V notch near its tip
  g.save(); g.translate(x, y); g.rotate(a * D);
  const L = R * 0.74, w = R * 0.07, notchY = -L * 0.82;
  pen(g, poly([[-w, R * 0.12], [-w * 0.7, -L], [0, -L - w * 1.4], [w * 0.7, -L], [w, R * 0.12]]), { fill: P.brassL, lw: 2.5, shadow: true, shadowOff: [6, 8], breaks: false, highlight: false });
  g.fillStyle = red === 'notch' ? P.red : P.ink; g.beginPath(); g.moveTo(-w * 0.75, notchY - w); g.lineTo(0, notchY + w * 0.4); g.lineTo(w * 0.75, notchY - w); g.lineTo(w * 0.75, notchY - w * 2.2); g.lineTo(0, notchY - w * 0.8); g.lineTo(-w * 0.75, notchY - w * 2.2); g.closePath(); g.fill();
  if (red === 'notch') { g.restore(); const nx = x + Math.sin(a * D) * -notchY, ny = y - Math.cos(a * D) * -notchY; K.redRing(g, nx, ny, R * 0.16, P.red, 3); g.save(); }
  g.restore();
  pen(g, circle(x, y, R * 0.12), { fill: P.brass, lw: 2.5, shade: 0.4, shadeColor: P.brassD, box: [x - R * 0.12, y - R * 0.12, x + R * 0.12, y + R * 0.12], breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x - R * 0.06, y); g.lineTo(x + R * 0.06, y); g.stroke(); g.restore();
}
function cornerWheel(g, c, t, o) {
  const { P, mono } = K; const u = M.E.outBack(range(t, num(c.at, 0), num(c.at, 0) + 0.5)); if (u <= 0) return;
  const x = c.x ?? 190, y = (c.y ?? 170) + (1 - u) * -320, R = c.r ?? 88;
  const ia = indexAng(t, { runAt: c.runAt, stopAt: c.stopAt, freezeAt: c.freezeAt, ang: c.ang ?? 0 });
  wheel(g, x, y, R, { a: ia.a, t, red: c.red ?? 'none', night: o.night, run: ia.run, half: true });
  if (c.label !== false) K.tag(g, x - R * 0.2, y + R, x + R * 0.1, y + R + 46, c.label ?? 'Clock two', { size: 22, swing: -2, night: o.night, sub: c.sub ?? 'deadline' });
  let ty = y - R * 0.3; for (const q of c.tags ?? []) { const v = range(t, num(q.at, 0), num(q.at, 0) + 0.4); if (v <= 0) continue; const sw = Math.sin(t * 2.6 + ty) * 3 * (1 - range(t, num(q.at, 0), num(q.at, 0) + 2.5));
    g.save(); g.globalAlpha = v; K.tag(g, x + R * 0.9, ty, x + R + 34, ty + 6, q.text, { size: 20, swing: sw, night: o.night, sub: q.sub ?? null }); g.restore(); ty += q.sub ? 70 : 52; }
}

// ================================================================= SET: briefing (the table at police headquarters)
const GOLD = '#c9a25c';
function seatedFig(g, x, yTable, H, { body, gaze = 90, t = 0, epaulettes = false } = {}) {
  const { P, pen, pill, rrect, lampShade } = K; const bw = H * 0.46, bh = H * 0.64, top = yTable - bh;
  pen(g, rrect(x - bw / 2, top, bw, bh + 40, bw * 0.42), { fill: body, lw: 2.5, shadow: true, shadowOff: [10, 10], shade: lampShade([x - bw / 2, top, x + bw / 2, yTable], 0.05, 0.5, 0.4), shadeColor: K.mix(body, P.ink, 0.5), box: [x - bw / 2, top, x + bw / 2, yTable + 40], breaks: false });
  if (epaulettes) for (const s of [-1, 1]) pen(g, rrect(x + s * bw * 0.32 - 16, top + 10, 32, 12, 4), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
  pen(g, rrect(x - H * 0.05, top - H * 0.08, H * 0.1, H * 0.12, 3), { fill: K.mix(body, P.ink, 0.3), lw: 2, breaks: false, highlight: false });
  const r = H * 0.19, b = Math.sin(twos(t) * 2.1 + x) * 1.2; dialHead(g, x, top - H * 0.08 - r * 0.92 + b, r, { gaze, t });
  return { headY: top - H * 0.08 - r * 1.9 };
}
function standFig(g, x, yFloor, H, { body, gaze = 90, t = 0, arm = 70 } = {}) {
  const { P, pen, pill, rrect, lampShade } = K; const legL = H * 0.38, bh = H * 0.36, bw = H * 0.2, hip = yFloor - legL;
  for (const s of [-1, 1]) pen(g, pill(x + s * bw * 0.22, yFloor - legL / 2, bw * 0.34, legL + 6), { fill: K.mix(body, P.ink, 0.25), lw: 2, breaks: false, highlight: false });
  pen(g, rrect(x - bw / 2, hip - bh, bw, bh + 8, bw * 0.4), { fill: body, lw: 2.5, shadow: true, shade: lampShade([x - bw / 2, hip - bh, x + bw / 2, hip], 0.05, 0.5, 0.4), shadeColor: K.mix(body, P.ink, 0.5), box: [x - bw / 2, hip - bh, x + bw / 2, hip], breaks: false });
  for (const s of [-1, 1]) pen(g, rrect(x + s * bw * 0.3 - 11, hip - bh + 8, 22, 9, 3), { fill: P.brass, lw: 1.3, breaks: false, highlight: false });
  g.save(); g.translate(x + bw * 0.3, hip - bh + 18); g.rotate(-arm * D); pen(g, pill(0, H * 0.13, bw * 0.3, H * 0.28), { fill: body, lw: 2, breaks: false, highlight: false }); g.restore();
  const r = H * 0.1; dialHead(g, x, hip - bh - r * 1.15, r, { gaze, t });
  return { headY: hip - bh - r * 2.3 };
}
function namePlate(g, x, y, name, role, lit, { told = false, t = 0 } = {}) {
  const { P, pen, poly, mono } = K; g.save(); g.font = '700 22px "Archivo Narrow"'; const w = Math.max(g.measureText(name).width, 120) + 36; g.restore();
  pen(g, poly([[x - w / 2 + 8, y - 54], [x + w / 2 - 8, y - 54], [x + w / 2 + 6, y], [x - w / 2 - 6, y]]), { fill: K.mix(K.mix(P.kraftD, P.dusk, 0.35), P.card, lit), lw: 2, shadow: true, shadowOff: [6, 6], breaks: false, highlight: false });
  g.save(); g.globalAlpha = 0.35 + 0.65 * lit; g.font = '700 22px "Archivo Narrow"'; g.fillStyle = lit > 0.5 ? P.ink : P.ink70; g.textAlign = 'center'; g.fillText(name, x, y - 28); g.restore();
  if (role) { g.save(); g.globalAlpha = 0.3 + 0.7 * lit; mono(g, role, x, y - 9, 11, P.ink70, 'center'); g.restore(); }
  if (told && lit > 0.6) { const u = clamp((lit - 0.6) / 0.4); g.save(); g.globalAlpha = u; K.tag(g, x + w / 2 - 6, y - 40, x + w / 2 + 14, y + 6, 'told it later', { size: 17, swing: 3 }); g.restore(); }
}
function optionCard(g, cx, base, w, h, kind, { flip = 0, fade = 0, red = 'none', t = 0, seed = 1, night = false } = {}) {
  const { P, pen, poly, mono } = K; const sx = Math.abs(Math.cos(Math.PI * clamp(flip))), back = flip > 0.5;
  g.save(); g.translate(cx, base);
  pen(g, poly([[w * 0.18, -h * 0.45], [w * 0.36, 0], [w * 0.26, 0]]), { fill: P.kraftD, lw: 2, breaks: false, highlight: false }); // easel leg
  g.scale(Math.max(0.02, sx), 1); g.rotate((kind === 'send' ? -2 : 2) * D);
  K.card(g, -w / 2, -h, w, h, { seed, thick: 5, shade: 0.14 });
  const T = (s, y, size, col = P.ink, a = 1) => K.txt(g, s, 0, y, { size, f: 'narrow', weight: 700, align: 'center', color: col, alpha: a, maxW: w - 30 });
  if (kind === 'send') {
    T('SEND', -h + h * 0.22, h * 0.17); T('THEM IN', -h + h * 0.4, h * 0.17);
    const dx = -w * 0.12, dy = -h * 0.12; pen(g, K.rrect(dx - w * 0.1, dy - h * 0.3, w * 0.2, h * 0.3, 4), { fill: P.ink70, lw: 2, breaks: false, highlight: false }); // a door
    for (let i = 0; i < 3; i++) { const tx = dx + w * 0.16 + i * w * 0.08; pen(g, K.pill(tx, dy - h * 0.07, w * 0.04, h * 0.14), { fill: P.card, line: P.teal, lw: 2.4, breaks: false, highlight: false }); g.fillStyle = P.teal; g.beginPath(); g.arc(tx + 1, dy - h * 0.17, w * 0.016, 0, TAU); g.fill(); }
    mono(g, 'OPTION A', 0, -14, 13, P.ink70, 'center');
  } else {
    const a = back ? 1 - 0.75 * clamp(fade) : 1;
    if (!back) { T('HOLD', -h + h * 0.22, h * 0.17); T('BACK', -h + h * 0.4, h * 0.17); }
    else { T('DO NOTHING', -h + h * 0.2, h * 0.13); T('05:00', -h + h * 0.37, h * 0.15, P.ink70); }
    // two card towers (outline only once faded)
    for (const [i, x0] of [[0, -w * 0.27], [1, w * 0.07]]) { const tw = w * 0.2, th = h * 0.3, y0 = -h * 0.2 - th;
      g.save(); g.globalAlpha = a; pen(g, K.rect(x0, y0, tw, th), { fill: back && fade > 0.4 ? null : P.kraft, lw: 2, breaks: false, highlight: false }); if (back && fade > 0.4) { g.setLineDash([6, 5]); g.strokeStyle = P.ink40; g.lineWidth = 2; g.strokeRect(x0, y0, tw, th); } g.restore();
      if (back && i === 0 && red === 'tower') { g.save(); g.strokeStyle = P.red; g.lineWidth = 3; g.setLineDash([7, 6]); g.strokeRect(x0 - 6, y0 - 6, tw + 12, th + 12); g.restore(); } }
    mono(g, back ? 'BY GALLET’S ACCOUNT' : 'OPTION B', 0, -14, 13, P.ink70, 'center');
  }
  g.restore();
}
function windowCard(g, x, y, w, h, t, { red = false, sky = 'night', scale = 0.3, frameSmoke = 1, towerFlame = 1 } = {}) {
  const { P, pen, rect } = K;
  pen(g, rect(x - 18, y - 18, w + 36, h + 36), { fill: K.mix(P.kraftD, P.dusk, 0.25), lw: 2.5, shadow: true, shadowOff: [12, 14], breaks: false, highlight: false });
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  K.skyBands(g, sky === 'dusk' ? 'dusk' : 'night', y + h - 40, t, 0.4);
  K.rooftops(g, y + h - 30, t, { col: K.mix(P.night, P.nightL, 0.6), seed: 9, hMin: 20, hMax: 60, x0: x - 40, x1: x + w + 40 });
  g.translate(x + w * 0.5 - 760 * scale * 0.55, y + h * 0.14); g.scale(scale, scale);
  const BX = K.cardTower(g, 0, 0, 760, 1100, { open: 1, night: true, belfryTop: 0, belfryBot: 0.62, inside: (gg, a0, b0, a1, b1) => K.bellFrameInside(gg, a0, b0, a1, b1, { char: 0, flame: 0, redBell: -1, slip: 0, t, weights: false }), t });
  bellExtrasWorld(g, t, { towerFlame, frameSmoke }, BX, { night: true });
  g.restore();
  // mullions: a card cross
  pen(g, rect(x + w / 2 - 7, y, 14, h), { fill: K.mix(P.kraftD, P.dusk, 0.25), lw: 2, breaks: false, highlight: false });
  pen(g, rect(x, y + h * 0.42 - 7, w, 14), { fill: K.mix(P.kraftD, P.dusk, 0.25), lw: 2, breaks: false, highlight: false });
  if (red) { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([12, 8]); g.strokeRect(x - 30, y - 30, w + 60, h + 60); g.restore(); }
}
function hangingPlate(g, x, y, text, sub, u, t) {
  const { P, pen, rect, mono } = K; if (u <= 0) return; const yy = y - (1 - M.E.outBack(u)) * 320, sw = Math.sin(t * 2.2) * 1.5 * (1 - range(u, 0.6, 1) * 0.4);
  g.save(); g.font = '700 46px "Archivo Narrow"'; const w = g.measureText(text).width + 90; g.restore();
  g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 40, -300); g.lineTo(x + 40, yy); g.moveTo(x + w - 40, -300); g.lineTo(x + w - 40, yy); g.stroke(); g.restore();
  g.save(); g.translate(x + w / 2, yy); g.rotate(sw * D); g.translate(-w / 2, 0);
  K.card(g, 0, 0, w, 116, { seed: 31, thick: 6, shade: 0.12 });
  K.txt(g, text, w / 2, 58, { size: 46, f: 'narrow', weight: 700, align: 'center' }); mono(g, sub, w / 2, 94, 18, P.ink70, 'center');
  for (const px of [40, w - 40]) { g.fillStyle = P.brass; g.beginPath(); g.arc(px, 14, 7, 0, TAU); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.stroke(); }
  g.restore();
}
function lampHang(g, x, y, t) { const { P, pen, poly } = K; g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, -400); g.lineTo(x, y - 60); g.stroke(); g.restore();
  pen(g, poly([[x - 26, y - 62], [x + 26, y - 62], [x + 86, y], [x - 86, y]]), { fill: P.brass, lw: 2.5, shade: 0.4, shadeColor: P.brassD, box: [x - 86, y - 62, x + 86, y], breaks: false });
  g.fillStyle = P.emberL; g.beginPath(); g.ellipse(x, y + 4, 60, 10, 0, 0, TAU); g.fill(); }

async function briefing(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, poly, rect, mono } = K;
    const red = redAt(p, t, p.view === 'pov' ? 'edge' : 'gap'), lit = p.lit ?? {}, L = (k) => (lit[k + 'At'] == null ? 0 : (lit[k + 'At'] === true ? 1 : up(t, lit[k + 'At'], 1, 0.4)));
    const part = an(p, 'part', t, 1, 0.6), flip = an(p, 'flip', t, 0, 1), fade = an(p, 'fade', t, 0, 1.5), gz = p.gaze ?? {};
    const wallC = K.mix(P.kraft, P.dusk, 0.2), floorC = K.mix(P.kraftD, P.dusk, 0.3);
    if (p.view !== 'pov') {
      // ---------------- the room: back wall, window, lamp, figures, table, cards
      g.fillStyle = wallC; g.fillRect(-600, -600, 3200, 1240); lampPoolTone(g, 840, 330, 520, wallC, 0.45);
      K.halftone(g, [-600, -600, 2600, 640], (x, y) => clamp(Math.hypot((x - 840) / 1.5, y - 300) / 1800 - 0.25), P.dusk, { pitch: 7 });
      g.save(); g.strokeStyle = rgba(P.ink, 0.16); g.lineWidth = 2; g.beginPath(); for (let x = -560; x < 2600; x += 180) { g.moveTo(x, -600); g.lineTo(x, 470); } g.stroke(); g.restore();
      pen(g, rect(-600, 470, 3200, 120), { fill: K.mix(P.kraftD, P.dusk, 0.18), lw: 2, breaks: false, highlight: false, shade: 0.12, shadeColor: P.dusk, box: [-600, 470, 2600, 590] }); // wainscot
      pen(g, rect(-600, 462, 3200, 12), { fill: K.OAK.M, lw: 2, breaks: false, highlight: false });
      windowCard(g, 1180, 50, 500, 380, t, { red: red === 'window', sky: 'night', scale: 0.27 });
      if (p.plate !== false) hangingPlate(g, 170, 60, p.plateText ?? 'POLICE HEADQUARTERS', p.plateSub ?? '≈ 20:30 · NYT', p.plateAt == null ? 1 : up(t, p.plateAt, 0.3, 0.55), t);
      lampHang(g, 840, 250, t);
      // floor (boards)
      g.fillStyle = floorC; g.fillRect(-600, 590, 3200, 1200); g.save(); g.strokeStyle = rgba(P.ink, 0.18); g.lineWidth = 1.5; g.beginPath(); for (let y = 620, d = 22; y < 1300; y += d, d *= 1.15) { g.moveTo(-600, y); g.lineTo(2600, y); } g.stroke(); g.restore();
      // figures behind the table (heads above its far edge); Gallet stands at the near-left end
      seatedFig(g, 560, 640, 250, { body: P.ink70, gaze: gazeAt(gz.weilAt, t, 100), t });
      seatedFig(g, 850, 640, 236, { body: K.mix(P.ink40, P.dusk, 0.3), gaze: 160, t });
      seatedFig(g, 1130, 640, 236, { body: K.mix(P.ink40, P.dusk, 0.3), gaze: 200, t });
      seatedFig(g, 1440, 650, 262, { body: P.ink, gaze: gazeAt(gz.presidentAt, t, 230), t });
      // table: far edge y 610, near edge y 770, felt top, oak skirt
      const top = [[300, 612], [1760, 612], [1900, 772], [160, 772]];
      pen(g, poly(top), { fill: P.sage, lw: 3, shade: (x, y) => clamp((y - 612) / 160 * 0.35), shadeColor: P.sageD, box: [160, 612, 1900, 772], breaks: false, highlight: false });
      g.fillStyle = K.mix(P.sageL, P.emberL, 0.35); g.beginPath(); g.ellipse(860, 690, 420, 60, 0, 0, TAU); g.fill(); // the lamp pool on the felt (posterised)
      pen(g, rect(160, 772, 1740, 70), { fill: K.OAK.D, lw: 3, breaks: false, highlight: false, shade: 0.3, shadeColor: K.OAK.char, box: [160, 772, 1900, 842] });
      for (const lx of [210, 1840]) pen(g, rect(lx - 16, 842, 32, 300), { fill: K.OAK.D, lw: 2.5, breaks: false, highlight: false });
      // papers on the table (stacked cards, a plan)
      pen(g, poly([[1420, 700], [1600, 690], [1640, 742], [1450, 754]]), { fill: P.card, lw: 2, breaks: false, highlight: false });
      // name plates
      namePlate(g, 560, 700, 'ARIEL WEIL', 'MAYOR, 4TH ARR.', L('weil'), { told: p.told !== false, t });
      namePlate(g, 1440, 712, 'PRESIDENT MACRON', '', L('president'), { t });
      // Gallet, standing at the left end, briefing
      const gs = standFig(g, 250, 980, 520, { body: P.ink, gaze: gazeAt(gz.galletAt, t, 80), t, arm: 62 + Math.sin(twos(t) * 1.3) * 3 });
      namePlate(g, 430, 770, 'GEN. GALLET', 'PARIS FIRE BRIGADE', L('gallet'), { told: p.told !== false, t });
      if (p.cards !== false) {
        const gap = lerp(8, 170, M.E.inOutCubic(clamp(part))), cx = 990;
        optionCard(g, cx - 122 - gap / 2, 762, 244, 186, 'send', { t, seed: 3 });
        optionCard(g, cx + 122 + gap / 2, 762, 244, 186, 'hold', { flip, fade, red, t, seed: 4 });
        if (red === 'gap' && gap > 30) { g.save(); g.strokeStyle = P.red; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(cx, 540); g.lineTo(cx, 780); g.stroke(); g.restore(); K.redRing(g, cx, 660, Math.min(60, gap * 0.3 + 14), P.red, 3); }
      }
    } else {
      // ---------------- POV: seated at the table, the two cards near, the president at the far end
      g.fillStyle = wallC; g.fillRect(-600, -600, 3200, 1100); lampPoolTone(g, 960, 200, 460, wallC, 0.45);
      K.halftone(g, [-600, -600, 2600, 520], (x, y) => clamp(Math.hypot((x - 960) / 1.4, y - 260) / 1600 - 0.25), P.dusk, { pitch: 7 });
      windowCard(g, 740, 30, 440, 330, t, { red: red === 'window', sky: 'night', scale: 0.25 });
      lampHang(g, 1330, 170, t);
      g.fillStyle = floorC; g.fillRect(-600, 480, 3200, 1200);
      seatedFig(g, 960, 540, 200, { body: P.ink, gaze: gazeAt(gz.presidentAt, t, 180), t });
      namePlate(g, 960, 586, 'PRESIDENT MACRON', '', L('president'), { t });
      const tp = [[640, 528], [1280, 528], [2300, 1000], [-380, 1000]];
      pen(g, poly(tp), { fill: P.sage, lw: 3, shade: (x, y) => clamp(0.32 - (y - 528) / 480 * 0.25), shadeColor: P.sageD, box: [-380, 528, 2300, 1000], breaks: false, highlight: false });
      g.save(); g.strokeStyle = rgba(P.sageD, 0.5); g.lineWidth = 1.4; g.beginPath(); for (let i = -8; i <= 8; i++) { g.moveTo(960 + i * 40, 528); g.lineTo(960 + i * 160, 1000); } g.stroke(); g.restore();
      g.fillStyle = K.mix(P.sageL, P.emberL, 0.3); g.beginPath(); g.ellipse(960, 690, 360, 70, 0, 0, TAU); g.fill();
      pen(g, rect(-400, 1000, 2720, 120), { fill: K.OAK.D, lw: 3, breaks: false, highlight: false });
      const gap = lerp(60, 320, clamp(part));
      optionCard(g, 960 - 230 - gap / 2, 960, 460, 360, 'send', { t, seed: 5 });
      optionCard(g, 960 + 230 + gap / 2, 960, 460, 360, 'hold', { flip, fade, red, t, seed: 6 });
      if (red === 'edge') { g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.setLineDash([14, 9]); g.beginPath(); g.moveTo(960, 1000); g.lineTo(960, 640); g.stroke(); g.restore(); K.redRing(g, 960, 1000, 46, P.red, 3.5); }
    }
  }, { source: 'ILLUSTRATION · AS TOLD LATER BY ARIEL WEIL AND GEN. GALLET · NO TELEPHONE, NO FACES' });
}

// ================================================================= SET: stairStrip (H9: the stair-strip toy beside the closed model)
const GND = 980, SS = { x0: 560, x1: 780, top: 300 }, NS = { x0: 1060, x1: 1280, top: 40 }, BRY = 335, BELLY = 135;
const ROUTE = (() => { const pts = [[505, GND - 6], [590, GND - 14]], fl = 6;
  for (let i = 1; i <= fl; i++) pts.push([i % 2 ? 752 : 592, lerp(GND - 14, BRY, i / fl)]);
  pts.push([1090, BRY], [1252, 236], [1092, BELLY]); return pts; })();
function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function pathAt(pts, d) { d = Math.max(0, d); for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay); if (d <= l || i === pts.length - 1) { const u = clamp(d / l); return [ax + (bx - ax) * u, ay + (by - ay) * u, Math.atan2(by - ay, bx - ax)]; } d -= l; } return [...pts[pts.length - 1], 0]; }
function pathSlice(pts, d) { const out = [pts[0]]; let acc = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + l >= d) { const u = (d - acc) / l; out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); return out; } out.push(pts[i]); acc += l; } return out; }
const RL = pathLen(ROUTE);
const distOf = (k) => pathLen(ROUTE.slice(0, k + 1)); // distance to ROUTE[k]
const D_BRIDGE0 = distOf(8), D_BRIDGE1 = distOf(9), D_TOP = RL, D_GATE = (distOf(8) + distOf(9)) / 2;
function tallyFig(g, x, y, sc, { col, line, t = 0, i = 0, walk = 0 } = {}) {
  const { P, pen, pill } = K; const lean = Math.sin(twos(t) * 9 + i * 1.7) * 6 * walk;
  g.save(); g.translate(x, y); g.rotate(lean * D); g.scale(sc, sc);
  pen(g, pill(0, -17, 12, 34), { fill: col, line: line ?? P.ink, lw: 2.4, breaks: false, highlight: false, mis: [2, 1.5] });
  g.fillStyle = line ?? P.ink; g.beginPath(); g.arc(1.5, -30, 3.6, 0, TAU); g.fill(); g.restore();
}
function hoseStroke(g, pts, t, { w = 10 } = {}) {
  const { P } = K; if (pts.length < 2) return; g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, q[0], q[1]));
  g.strokeStyle = P.ink; g.lineWidth = w + 5; g.stroke(); g.strokeStyle = P.teal; g.lineWidth = w; g.stroke(); g.strokeStyle = P.tealL; g.lineWidth = 2.5; g.setLineDash([12, 18]); g.lineDashOffset = -twos(t) * 60; g.stroke(); g.restore();
}
function jetArc(g, x0, y0, x1, y1, t, u, { n = 3, lift = 120 } = {}) {
  const { P } = K; if (u <= 0) return; g.save(); g.lineCap = 'round';
  for (let j = 0; j < n; j++) { const ex = lerp(x0, x1 + (j - 1) * 14, u), ey = lerp(y0, y1 + (j - 1) * 8, u), cx = (x0 + ex) / 2 + 10, cy = Math.min(y0, ey) - lift * (0.7 + 0.3 * j);
    g.strokeStyle = P.ink; g.lineWidth = 9 - j * 1.5; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    g.strokeStyle = j === 1 ? P.tealL : P.teal; g.lineWidth = 6 - j * 1.4; g.setLineDash([16, 9]); g.lineDashOffset = -twos(t) * 110 - j * 9; g.stroke(); g.setLineDash([]); }
  if (u >= 1) for (let k = 0; k < 6; k++) { const a = fract(t * 1.6 + k / 6), dx = (hash(k) - 0.5) * 50; g.fillStyle = P.tealL; g.beginPath(); g.arc(x1 + dx * a, y1 - 10 - a * 30 + a * a * 40, 4 * (1 - a) + 1.5, 0, TAU); g.fill(); }
  g.restore();
}
// a flame card that stands up (u) and folds away (out) with a paper tick, on a card base
function flameCards(g, x0, x1, y, h, t, u, out, seed, { n = 4 } = {}) {
  const { flame } = K; const k = u * (1 - K.tick(clamp(out), 2, 0.5)); if (k <= 0.01) return;
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, n === 1 ? 0.5 : i / (n - 1)) + (hash(i + seed) - 0.5) * 16; flame(g, x, y, h * (0.7 + 0.45 * hash(i * 3 + seed)) * k, (x1 - x0) / n * 1.15, t, seed + i, { lean: 0.15, lw: 2 }); }
}
function stripCard(g, x0, x1, top, bot, label, night, louvres = false, windows = []) {
  const { P, pen, rect, mono } = K; const L = K.looks(night ? 'night' : 'day'), dx = 22, dy = -12;
  pen(g, K.poly([[x1, top], [x1 + dx, top + dy], [x1 + dx, bot + dy], [x1, bot]]), { fill: L.stoneD, lw: 2.2, shade: 0.35, shadeColor: L.stoneDD, box: [x1, top + dy, x1 + dx, bot], breaks: false, highlight: false });
  pen(g, rect(x0, top, x1 - x0, bot - top), { fill: L.stone, lw: 2.6, shadow: true, shadowOff: [16, 12], shadowA: night ? 0.3 : 0.13, shade: K.lampShade([x0, top, x1, bot], 0.03, 0.3, 0.5), shadeColor: L.stoneD, box: [x0, top, x1, bot] });
  g.save(); g.strokeStyle = rgba(night ? '#5d554b' : P.ink40, 0.5); g.lineWidth = 1; g.beginPath(); for (let y = top + 16; y < bot; y += 16) { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke(); g.restore();
  // the tower's top: balustrade band, corner pinnacles; two printed louvred lancets below it (a print, not an opening)
  pen(g, rect(x0 - 5, top - 20, x1 - x0 + 10, 20), { fill: L.stoneD, lw: 2, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.2; for (let q = 0; q < Math.floor((x1 - x0) / 20); q++) { g.beginPath(); g.arc(x0 + 10 + q * 20, top - 10, 5, 0, TAU); g.stroke(); } g.restore();
  for (const cx of [x0, x1]) pen(g, K.poly([[cx - 7, top - 20], [cx, top - 50], [cx + 7, top - 20]]), { fill: L.stoneD, lw: 1.8, breaks: false, highlight: false });
  if (louvres) for (const v of [0.3, 0.7]) { const cx = lerp(x0, x1, v), lw2 = (x1 - x0) * 0.2, y1 = top + 150, y0 = top + 26; const pts = K.archPts(cx, y1, lw2, y0 + lw2 * 0.7, lw2 * 0.7, 6);
    pen(g, K.poly(pts), { fill: night ? '#3a3638' : P.ink70, lw: 1.6, breaks: false, highlight: false }); g.save(); K.poly(pts)(g); g.clip(); g.strokeStyle = night ? '#8a7f70' : P.ink40; g.lineWidth = 1.5; g.beginPath(); for (let yy = y0; yy < y1; yy += 9) { g.moveTo(cx - lw2, yy); g.lineTo(cx + lw2, yy + 4); } g.stroke(); g.restore(); }
  for (const wy of windows) { const cx = (x0 + x1) / 2, lw2 = (x1 - x0) * 0.22; const pts = K.archPts(cx, wy + 120, lw2, wy + lw2 * 0.7, lw2 * 0.7, 6); pen(g, K.poly(pts), { fill: night ? '#3a3638' : P.ink70, lw: 1.6, breaks: false, highlight: false }); }
  if (label) { pen(g, rect(x0 + 14, bot - 50, x1 - x0 - 28, 36), { fill: P.card, lw: 1.6, breaks: false, highlight: false }); mono(g, label, (x0 + x1) / 2, bot - 25, 15, P.ink, 'center', 600); }
}
async function stairStrip(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, rect, poly, circle, mono } = K; const flat = p.layout === 'flat', night = o.night, red = redAt(p, t, flat ? 'route' : 'nozzle');
    // ground + stage: night = paper-night sky over the drafting table; day/flat = the drafting table
    if (night && !flat) { K.backdrop(g, t, { sky: o.sky, yH: GND + 40, glow: 0.35, seed: 47 }); g.fillStyle = K.mix(P.kraft, o.sky === 'dusk' ? P.dusk : P.night, 0.42); g.fillRect(-900, GND, 3800, 1400);
      K.halftone(g, [-900, GND, 2900, 2400], (x, y) => clamp(0.12 + (y - GND) / 1400), o.sky === 'dusk' ? P.dusk : P.night, { pitch: 7 }); pen(g, rect(-900, GND - 4, 3800, 10), { fill: K.mix(P.kraftD, P.night, 0.4), lw: 2, breaks: false, highlight: false }); }
    else ground(g, t, 'day', { pool: [900, 520, 1000], seed: 4 });
    // the card model beside the toy (towers intact; the roof lid laid aside at L68, so no roof on the side we never see)
    if (!flat && p.model !== false) { K.facadeCard(g, 120, GND, 5.6, { sky: night ? 'night' : 'day', fireS: K.fireSections(0), spire: 'gone', glow: 0 }, t);
      if (p.labels !== false) mono(g, 'THE MODEL · TOWERS INTACT', 235, GND + 40, 15, night ? P.paper : P.ink70, 'center'); }
    // the fire-engine token at the foot (ink card, brass ladder rails, the pump wheel turns)
    { const ex = 340, ey = GND; pen(g, K.rrect(ex, ey - 66, 150, 56, 6), { fill: P.ink, lw: 2.5, shadow: true, breaks: false, highlight: false }); pen(g, K.rrect(ex + 150, ey - 52, 40, 42, 5), { fill: P.ink, lw: 2.5, breaks: false, highlight: false });
      pen(g, rect(ex + 10, ey - 80, 130, 12), { fill: P.brassL, lw: 1.6, breaks: false, highlight: false }); for (const wx of [ex + 34, ex + 150]) pen(g, circle(wx, ey - 8, 14), { fill: P.ink70, lw: 2, breaks: false, highlight: false });
      const run = (p.lead != null || p.leadKeysAt) && !flat ? 1 : 0; pen(g, K.gearPath(ex + 92, ey - 38, 20, 10, t * 3 * run), { fill: P.brass, lw: 1.6, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brassD, box: [ex + 72, ey - 58, ex + 112, ey - 18] });
      if (p.labels !== false) mono(g, 'FIRE ENGINE', ex + 95, ey + 40, 14, night ? P.paper : P.ink70, 'center'); }
    // the mainspring under the strips (L72)
    if (p.spring != null) { const sp = an(p, 'spring', t, 1, 4, 1.2);
      if (flat) { K.mainspring(g, 450, GND - 20, 450, 340, sp, t, { coils: Math.round(lerp(26, 12, sp)), R: lerp(30, 20, sp) }); if (p.labels !== false) { K.tag(g, 450, 660, 170, 640, 'Mainspring', { size: 24, swing: -2, sub: sp > 0.7 ? 'wound: within the half hour' : 'slack' }); } }
      else { K.mainspring(g, 540, GND + 52, 1320, GND + 52, sp, t, { coils: Math.round(lerp(26, 12, sp)), R: lerp(26, 18, sp) }); } }
    // the strips + bridge tab
    stripCard(g, SS.x0, SS.x1, SS.top, GND, p.labels === false ? null : 'SOUTH TOWER', night && !flat, false);
    stripCard(g, NS.x0, NS.x1, NS.top, GND, p.labels === false ? null : 'NORTH TOWER', night && !flat, false, [420, 620]);
    if (p.labels !== false) { K.txt(g, 'S', (SS.x0 + SS.x1) / 2, GND - 90, { size: 70, f: 'narrow', weight: 700, align: 'center', color: rgba(P.ink, 0.22) }); K.txt(g, 'N', (NS.x0 + NS.x1) / 2, GND - 90, { size: 70, f: 'narrow', weight: 700, align: 'center', color: rgba(P.ink, 0.22) }); }
    pen(g, rect(SS.x1, BRY - 8, NS.x0 - SS.x1, 34), { fill: night && !flat ? '#a99e8b' : P.kraft, lw: 2.4, shadow: true, breaks: false, highlight: false });
    if (p.labels !== false) mono(g, 'BRIDGE', (SS.x1 + NS.x0) / 2 - 70, BRY + 20, 13, P.ink70, 'center');
    // printed stair flights (oak beams) on both strips, with treads
    for (let i = 1; i < ROUTE.length; i++) { const [ax, ay] = ROUTE[i - 1], [bx, by] = ROUTE[i]; if (i === 1 || i === 8) continue;
      K.beam(g, [ax, ay + 6], [bx, by + 6], 10, { col: K.OAK.L, lw: 1.6 }); g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.2; g.beginPath(); const n = Math.round(Math.hypot(bx - ax, by - ay) / 13); for (let j = 1; j < n; j++) { const u = j / n, x = lerp(ax, bx, u), y = lerp(ay, by, u) + 6; g.moveTo(x, y - 5); g.lineTo(x + (bx > ax ? -5 : 5), y + 5); } g.stroke(); g.restore(); }
    // the wall section (N-strip, right) and the floor strip (the landing)
    const WX0 = NS.x1 + 22, WX1 = NS.x1 + 170, WY0 = 214, WY1 = BRY + 10;
    pen(g, rect(WX0, WY0, WX1 - WX0, WY1 - WY0), { fill: night && !flat ? '#a99e8b' : P.kraft, lw: 2.4, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: P.kraftD, box: [WX0, WY0, WX1, WY1] });
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; g.beginPath(); for (let y = WY0 + 14; y < WY1 - 4; y += 14) { g.moveTo(WX0 + 12, y); g.lineTo(WX1 - 12, y + 5); } g.stroke(); g.restore();
    if (p.labels !== false) mono(g, 'WALL', (WX0 + WX1) / 2, WY0 - 10, 13, night && !flat ? P.paper : P.ink70, 'center');
    pen(g, rect(NS.x0 + 6, BRY + 12, NS.x1 - NS.x0 - 12, 14), { fill: K.OAK.M, lw: 1.8, breaks: false, highlight: false });
    // BELL HEIGHT mark
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(NS.x0 - 30, BELLY + 8); g.lineTo(NS.x1 + 30, BELLY + 8); g.stroke(); g.restore();
    g.fillStyle = red === 'mark' ? P.red : P.ink; g.beginPath(); g.moveTo(NS.x0 - 30, BELLY - 6); g.lineTo(NS.x0 - 4, BELLY + 8); g.lineTo(NS.x0 - 30, BELLY + 22); g.closePath(); g.fill();
    if (red === 'mark') K.redRing(g, NS.x0 - 20, BELLY + 8, 24, P.red, 3);
    if (p.labels !== false) K.tag(g, NS.x0 - 30, BELLY + 8, NS.x0 - 250, BELLY - 30, 'Bell height', { size: 22, swing: -2, night: night && !flat, sub: 'the frame’s foot' });
    // the miniature bell-frame toy on top of the N-strip (unlit; its band comes only with the record at L85)
    const band = an(p, 'band', t, 0, 1, 0.6), bout = an(p, 'bandOut', t, 0, 1, 0.5), bandK = band * (1 - K.tick(clamp(bout), 2, 0.5));
    { const sc = 0.3, bx = NS.x0 - 8, by = NS.top - 760 * sc + 4;
      g.save(); g.translate(bx, by); g.scale(sc, sc);
      const BX = K.cardTower(g, 0, 0, 760, 760, { open: 1, night: true, belfryTop: 0, belfryBot: 0.94, inside: (gg, a0, b0, a1, b1) => K.bellFrameInside(gg, a0, b0, a1, b1, { char: 0.35 * bandK, flame: 0, redBell: -1, slip: 0, t, weights: false }), t });
      if (bandK > 0.01) { const y1 = BX.by1, x0 = BX.bx0, x1 = BX.bx1; g.save(); if (p.pale) g.globalAlpha = 0.55; for (let i = 0; i < 6; i++) K.flame(g, lerp(x0 + 40, x1 - 40, i / 5), y1 - 30, (60 + 50 * hash(i)) * bandK, 110, t, 300 + i, { lean: 0.1, lw: 5 }); g.restore();
        if (p.pale) { g.fillStyle = rgba(P.card, 0.35); g.fillRect(x0, y1 - 200, x1 - x0, 210); } }
      if ((p.smoke ?? 1) > 0 && bandK < 0.5) bellExtrasWorld(g, t, { frameSmoke: (p.smoke ?? 1) * (1 - bandK) }, BX, { night: true });
      g.restore();
      if (red === 'band' && bandK > 0.05) { g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.beginPath(); g.ellipse(bx + 115, by + 200, 120, 34, 0, 0, TAU); g.stroke(); g.restore(); }
      if (p.labels !== false) mono(g, 'BELL FRAME (TOY)', bx + 120, by - 14, 14, night && !flat ? P.paper : P.ink70, 'center'); }
    // flames on the wall section and the landing floor (the tower's own fire, never the frame)
    flameCards(g, WX0 + 26, WX1 - 26, WY1 - 4, 120, t, an(p, 'wallFlame', t, 0, 1, 0.45), an(p, 'wallOut', t, 0, 3, 0.5), 400);
    const floorK = an(p, 'floorFlame', t, 0, 2, 0.45), floorO = an(p, 'floorOut', t, 0, 4, 0.5);
    flameCards(g, NS.x0 + 30, NS.x1 - 40, BRY + 14, 90, t, floorK, floorO, 430, { n: 3 });
    // the gate on the bridge tab (folds flat toward the N tower)
    const gate = an(p, 'gate', t, 0, 2, 0.35, M.E.inCubic), gx = (SS.x1 + NS.x0) / 2 + 40;
    { const h = 92 * Math.cos(gate * Math.PI / 2), gw = 70; g.save(); g.translate(gx, BRY + 2);
      pen(g, rect(-gw / 2, -h, gw, Math.max(2, h)), { fill: null, line: P.ink, lw: 2.5, breaks: false, highlight: false });
      g.strokeStyle = K.OAK.D; g.lineWidth = 6; g.beginPath(); for (let i = 0; i < 5; i++) { const x = -gw / 2 + 7 + i * (gw - 14) / 4; g.moveTo(x, 0); g.lineTo(x, -h); } g.moveTo(-gw / 2, -h * 0.5); g.lineTo(gw / 2, -h * 0.5); g.stroke();
      g.strokeStyle = P.ink; g.lineWidth = 1.4; g.stroke();
      pen(g, rect(gw / 2 - 6, -h * 0.55 - 8, 16, 16), { fill: P.brass, lw: 1.6, breaks: false, highlight: false });
      g.restore(); if (red === 'latch') K.redRing(g, gx + 42, BRY + 2 - 92 * Math.cos(gate * Math.PI / 2) * 0.55, 20, P.red, 3); }
    // route (flat: teal dashed, drawn on)
    if (p.route != null) { const ru = an(p, 'route', t, 1, 0.3, 4, M.E.inOutSine), pts = pathSlice(ROUTE, ru * RL);
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = P.card; g.lineWidth = 12; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, q[0], q[1] - 18)); g.stroke(); g.strokeStyle = P.teal; g.lineWidth = 6; g.setLineDash([16, 10]); g.stroke(); g.restore();
      const [hx, hy, ha] = pathAt(ROUTE, ru * RL); g.save(); g.translate(hx, hy - 18); g.rotate(ha); g.fillStyle = P.teal; g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -12); g.lineTo(-8, 12); g.closePath(); g.fill(); g.restore();
      if (red === 'route' && ru > 0.98) K.redRing(g, hx, hy - 18, 30, P.red, 3); }
    // the team: twenty teal tallies on the route, two hoses from the engine
    if (p.lead != null || p.leadKeysAt) {
      let lead = an(p, 'lead', t, 0, 0.5, 6, M.E.inOutSine) * RL; if (gate < 0.6) lead = Math.min(lead, D_GATE - 30);
      const n = p.n ?? 20, sp = 30, pos = [];
      for (let i = 0; i < n; i++) { const d = lead - i * sp; if (d >= 0) pos.push(pathAt(ROUTE, d)); else pos.push([505 + d * 0.9 - 10 * (i % 2), GND - 6 + (i % 2) * 4, 0]); }
      if (p.hoses !== false && !flat) for (const [k, off] of [[1, -4], [4, 5]]) { const d = Math.max(0, lead - k * sp), pts = [[480, GND - 34], [520, GND - 8], ...pathSlice(ROUTE, d).slice(1)].map(([x, y]) => [x + off, y - 14]); hoseStroke(g, pts, t, { w: 7 }); }
      for (let i = n - 1; i >= 0; i--) { const [x, y] = pos[i]; tallyFig(g, x, y, 1.0, { col: P.card, line: P.teal, t, i, walk: 1 }); }
      const [lx, ly] = pos[0];
      pen(g, K.rrect(lx + 8, ly - 30, 22, 9, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); // the branch pipe
      if (red === 'nozzle') K.redRing(g, lx + 24, ly - 26, 20, P.red, 3);
      for (const s of p.spray ?? []) { const su = up(t, s.at, 3, 0.5) * (1 - up(t, s.untilAt ?? 1e9, 1e9, 0.3)); const [tx, ty] = s.to === 'wall' ? [(WX0 + WX1) / 2, WY1 - 50] : s.to === 'frame' ? [NS.x0 + 110, NS.top - 40] : [NS.x0 + 120, BRY + 4]; jetArc(g, lx + 30, ly - 28, tx, ty, t, su, { lift: s.to === 'floor' ? 40 : 90 }); }
    }
    // the floor flame's red marker loop (it sits on the flame card as it stands and as it folds)
    if (red === 'floor' && floorK * (1 - K.tick(clamp(floorO), 2, 0.5)) > 0.05) { g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.beginPath(); g.ellipse(NS.x0 + 105, BRY - 20, 110, 52, -0.05, -2.2, -2.2 + TAU * 1.05); g.stroke(); g.restore(); }
    if (red === 'wall') { g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.beginPath(); g.ellipse((WX0 + WX1) / 2, WY1 - 50, 100, 70, 0, -2.2, -2.2 + TAU * 1.05); g.stroke(); g.restore(); }
    // GEN. GONTIER: up the N-strip to look, then down the S-strip (a dial-head figure, plate tag)
    if (p.gonUp != null || p.gonDown != null) { const gu = an(p, 'gonUp', t, 0, 0.5, 1.2), gd = an(p, 'gonDown', t, 0, 3, 3);
      const d = gd > 0 ? lerp(D_BRIDGE0, 0, gd) : lerp(D_BRIDGE1, D_TOP, gu), [x, y] = pathAt(ROUTE, d), face = gd > 0 ? -1 : 1;
      K.figure(g, x, y - 2, 64, { face, lean: 8, armF: 30 + 20 * Math.sin(twos(t) * 8), armB: -25, legF: 22 * Math.sin(twos(t) * 8), legB: -22 * Math.sin(twos(t) * 8), glint: 1, col: P.ink });
      K.tag(g, x + 8, y - 62, x + 40, y - 140, 'Gen. Gontier', { size: 20, swing: 2, night: night && !flat, sub: 'brigade general' }); }
  }, { source: 'ILLUSTRATION · STAIR STRIPS BESIDE THE MODEL, NOT A ROUTE INSIDE THE TOWERS · NYT, 16 JUL 2019' });
}

// ================================================================= SET: deadlineWheel (the right wheel close)
async function deadlineWheel(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, circle, mono, poly, rect } = K; const red = redAt(p, t, 'notch');
    ground(g, t, o.sky, { pool: [900, 430, 900], seed: 7 });
    const wx = p.wx ?? 880, wy = p.wy ?? 440, R = p.R ?? 280, wind = an(p, 'wind', t, p.windAt == null ? 1 : 1, 1, 0.9, M.E.inOutCubic);
    // the mainspring barrel (left), coupled by a small brass gear
    const bx = wx - R - 250, by = wy + 150, br = 150;
    pen(g, K.gearPath(wx - R - 40, wy + 120, 70, 14, -wind * 3 - (p.runAt != null ? Math.max(0, t - num(p.runAt, 1e9)) * 0.1 : 0)), { fill: P.brass, lw: 2.5, shade: 0.4, shadeColor: P.brassD, box: [wx - R - 110, wy + 50, wx - R + 30, wy + 190], breaks: false });
    pen(g, circle(bx, by, br), { fill: P.brass, lw: 3, shadow: true, shadowOff: [14, 16], shade: 0.4, shadeColor: P.brassD, box: [bx - br, by - br, bx + br, by + br], breaks: false });
    pen(g, circle(bx, by, br * 0.86), { fill: P.brassD, lw: 2, breaks: false, highlight: false });
    g.save(); g.translate(bx, by); g.rotate(wind * TAU * 1.6); K.coil(g, 0, 0, br * lerp(0.82, 0.62, wind), P.brassL, null, lerp(5, 7, wind)); g.restore();
    pen(g, circle(bx, by, 16), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
    if (p.labels !== false) mono(g, 'MAINSPRING', bx, by + br + 36, 16, o.night ? P.paper : P.ink70, 'center');
    const ia = indexAng(t, { runAt: p.runAt, stopAt: p.stopAt, freezeAt: p.freezeAt, ang: p.ang ?? 0, step: p.step ?? 6 });
    wheel(g, wx, wy, R, { a: ia.a, t, red, night: o.night, run: ia.run, half: true });
    // the label tag + the ½ H tag (red on L74)
    K.tag(g, bx, by - br, bx - 230, by - br - 210, p.label ?? 'Clock two · deadline', { size: 30, swing: -2, night: o.night, sub: p.sub ?? 'Gallet’s half hour (his own words)' });
    if (p.half !== false) { const hx = wx + R * 0.95, hy = wy + R * 0.78; g.save(); g.strokeStyle = o.night ? P.paper : P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(wx + R * 0.62, wy + R * 0.62); g.lineTo(hx - 60, hy + 6); g.stroke(); g.restore();
      g.save(); g.translate(hx, hy); g.rotate(Math.sin(t * 2.2) * 2 * D); const isR = red === 'half';
      pen(g, poly([[-70, 10], [-58, 0], [70, 0], [70, 80], [-58, 80], [-70, 70]]), { fill: isR ? P.red : P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
      g.font = '700 50px "Archivo Narrow"'; g.fillStyle = isR ? P.paper : P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('½ H', 8, 42);
      if (isR) { g.strokeStyle = P.red; g.lineWidth = 2.5; g.setLineDash([7, 6]); g.beginPath(); g.roundRect(-84, -14, 168, 108, 12); g.stroke(); }
      g.restore(); }
    // record tags on strings (wall-clock times only, never a minute count)
    let ty = p.tagsY ?? 150; const tx = p.tagsX ?? 1300;
    g.save(); g.strokeStyle = o.night ? rgba(P.paper, 0.6) : P.ink40; g.lineWidth = 2; g.beginPath(); g.moveTo(tx - 40, -300); g.lineTo(tx - 40, 980); g.stroke(); g.restore();
    for (const q of p.tags ?? []) { const v = range(t, num(q.at, 0.3), num(q.at, 0.3) + 0.35); if (v <= 0) { ty += q.sub ? 116 : 90; continue; } const sw = Math.sin(t * 2.4 + ty * 0.01) * 4 * (1 - range(t, num(q.at, 0.3), num(q.at, 0.3) + 2.2)) + (ia.run ? Math.sin(t * 3.1 + ty) * 1.2 : 0);
      g.save(); g.translate(0, (1 - M.E.outBack(v)) * -60); g.globalAlpha = clamp(v * 2); K.tag(g, tx - 40, ty, tx, ty + 8, q.text, { size: 30, swing: sw, night: o.night, sub: q.sub ?? null }); g.restore(); ty += q.sub ? 116 : 90; }
  }, { source: 'ILLUSTRATION · THE WHEEL CARRIES NO MINUTE COUNT · TIMES: CULTURE MINISTRY, NYT' });
}

// ================================================================= SET: riser (MECH inserts: the pipe, the gauge, the hose)
async function riser(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, rect, rrect, circle, mono, poly, halftone } = K; const red = redAt(p, t, p.view === 'hose' ? 'hole' : 'needle');
    ground(g, t, 'day', { pool: [800, 420, 950], seed: 9 });
    if (p.view !== 'hose') {
      // a card wall section standing on the table, stone courses; the dry riser runs up it (brass), couplings, a leaking joint
      const W0 = 360, W1 = 1500, T0 = 70, B0 = 960;
      pen(g, rect(W0, T0, W1 - W0, B0 - T0), { fill: P.card, lw: 3, shadow: true, shadowOff: [18, 16], shade: K.lampShade([W0, T0, W1, B0], 0.03, 0.3, 0.5), shadeColor: P.kraftD, box: [W0, T0, W1, B0] });
      g.save(); g.strokeStyle = rgba(P.ink40, 0.6); g.lineWidth = 1.2; g.beginPath(); for (let y = T0 + 40, r = 0; y < B0; y += 40, r++) { g.moveTo(W0, y); g.lineTo(W1, y); for (let x = W0 + (r % 2) * 70; x < W1; x += 140) { g.moveTo(x, y - 40); g.lineTo(x, y); } } g.stroke(); g.restore();
      const px = 700, jy = 470, leak = an(p, 'leak', t, 1, 1, 1.5);
      // the stain already on the card wall (halftone), the drips
      halftone(g, [px - 70, jy, px + 90, B0], (x, y) => clamp(0.55 - Math.abs(x - px - 10) / 110 - (y - jy) / 1300), P.tealD, { pitch: 8 });
      pen(g, rect(px - 26, -100, 52, B0 + 100), { fill: P.brassL, lw: 3, shade: 0.4, shadeColor: P.brass, box: [px - 26, -100, px + 26, B0], breaks: false });
      for (const cy of [210, jy, 760]) pen(g, rrect(px - 40, cy - 22, 80, 44, 6), { fill: P.brass, lw: 2.5, shade: 0.4, shadeColor: P.brassD, box: [px - 40, cy - 22, px + 40, cy + 22], breaks: false });
      for (let k = 0; k < 7; k++) { const a = fract(t * 0.9 + k / 7), x = px + 44 + Math.sin(k) * 6, y = jy + 6 + a * a * 420; if (leak < 0.2) break; pen(g, poly([[x, y - 12], [x + 7, y + 2], [x, y + 8], [x - 7, y + 2]]), { fill: P.tealL, lw: 1.6, breaks: false, highlight: false }); }
      g.save(); g.fillStyle = P.tealL; g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.ellipse(px + 44, B0 - 6, 70 * leak + 10, 12, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
      if (p.labels !== false) { K.tag(g, px - 26, 320, px - 330, 260, 'Dry riser', { size: 30, swing: -2, sub: 'the cathedral’s own pipe' }); K.tag(g, px + 40, jy, px - 320, jy + 120, 'Leaking joint', { size: 26, swing: 2, sub: 'drip stain' }); }
      // the pressure gauge on a branch
      const gx = 1110, gy = 400, gr = 190; pen(g, rect(px + 26, gy - 18, gx - gr - px, 36), { fill: P.brassL, lw: 2.5, breaks: false, highlight: false });
      pen(g, circle(gx, gy, gr), { fill: P.brass, lw: 3, shadow: true, shadowOff: [14, 16], shade: 0.45, shadeColor: P.brassD, box: [gx - gr, gy - gr, gx + gr, gy + gr], breaks: false });
      pen(g, circle(gx, gy, gr * 0.84), { fill: P.card, lw: 2.5, breaks: false, highlight: false, shade: K.lampShade([gx - gr, gy - gr, gx + gr, gy + gr], 0, 0.25, 0.5), shadeColor: P.kraftD, box: [gx - gr, gy - gr, gx + gr, gy + gr] });
      const a0 = 135 * D, a1 = 405 * D; g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; for (let i = 0; i <= 20; i++) { const a = lerp(a0, a1, i / 20), r1 = gr * 0.72, r2 = gr * (i % 5 ? 0.66 : 0.6); g.beginPath(); g.moveTo(gx + Math.cos(a) * r1, gy + Math.sin(a) * r1); g.lineTo(gx + Math.cos(a) * r2, gy + Math.sin(a) * r2); g.stroke(); } g.restore();
      g.save(); g.strokeStyle = P.teal; g.lineWidth = 10; g.beginPath(); g.arc(gx, gy, gr * 0.77, lerp(a0, a1, 0.55), a1); g.stroke(); g.restore();
      mono(g, 'PRESSURE', gx, gy + gr * 0.42, 18, P.ink70, 'center', 600);
      const nd = an(p, 'needle', t, 1, 4, 2.4, M.E.inOutCubic), na = lerp(lerp(a0, a1, 0.8), lerp(a0, a1, 0.22), nd) + Math.sin(t * 9) * 0.01 * (nd > 0 && nd < 1 ? 1 : 0);
      g.save(); g.translate(gx, gy); g.rotate(na); pen(g, poly([[-16, -7], [gr * 0.7, -2], [gr * 0.74, 0], [gr * 0.7, 2], [-16, 7]]), { fill: red === 'needle' ? P.red : P.ink, line: P.ink, lw: 1.5, breaks: false, highlight: false }); g.restore();
      pen(g, circle(gx, gy, 16), { fill: P.brass, lw: 2, breaks: false, highlight: false });
      if (red === 'needle') K.redRing(g, gx + Math.cos(na) * gr * 0.62, gy + Math.sin(na) * gr * 0.62, 34, P.red, 3);
      if (p.labels !== false) K.tag(g, gx + gr * 0.7, gy + gr * 0.7, gx + 120, gy + gr + 50, 'Pressure dropping', { size: 28, swing: -2, sub: 'NYT reconstruction' });
    } else {
      // macro: a fat teal hose across the frame, embers the size of a thumb burn holes in it; water spurts
      const pull = an(p, 'pull', t, 0, 6, 1.6), hy = (x) => 620 + Math.sin(x * 0.0028 + 0.6) * 70;
      const pts = []; for (let x = -200; x <= 2120; x += 40) pts.push([x, hy(x)]);
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, q[0], q[1]));
      g.strokeStyle = 'rgba(11,20,38,0.14)'; g.lineWidth = 170; g.translate(18, 26); g.stroke(); g.translate(-18, -26);
      g.strokeStyle = P.ink; g.lineWidth = 168; g.stroke(); g.strokeStyle = P.teal; g.lineWidth = 158; g.stroke(); g.strokeStyle = P.tealL; g.lineWidth = 40; g.translate(0, -40); g.stroke(); g.restore();
      g.save(); g.strokeStyle = rgba(P.tealD, 0.8); g.lineWidth = 2; for (let x = -180; x < 2100; x += 26) { g.beginPath(); g.moveTo(x, hy(x) + 30); g.lineTo(x + 16, hy(x) + 66); g.stroke(); } g.restore();
      pen(g, rect(1580, hy(1600) - 96, 70, 192), { fill: P.brass, lw: 3, shade: 0.4, shadeColor: P.brassD, box: [1580, hy(1600) - 96, 1650, hy(1600) + 96], breaks: false });
      const holes = [].concat(p.holesAt ?? [1.0, 2.2, 3.0]), hx = [520, 900, 1260];
      holes.forEach((at, i) => { const x = hx[i] ?? 600 + i * 300, y = hy(x) - 10, a = num(at, 1 + i), fall = range(t, a - 0.9, a), hit = up(t, a, a, 0.25);
        if (fall < 1 && fall > 0) { const ex = x + (1 - fall) * 60, ey = lerp(-120, y, M.E.inCubic(fall)); pen(g, poly(K.deckle([[ex - 26, ey - 18], [ex + 24, ey - 22], [ex + 30, ey + 16], [ex - 22, ey + 22]], 70 + i, 5, 10)), { fill: P.ember, lw: 2.5, breaks: false, highlight: false }); g.fillStyle = P.emberL; g.beginPath(); g.arc(ex - 2, ey - 2, 9, 0, TAU); g.fill(); }
        if (hit > 0) { pen(g, poly(K.deckle([[x - 34, y - 22], [x + 30, y - 26], [x + 36, y + 20], [x - 28, y + 24]], 90 + i, 6, 9)), { fill: P.soot, lw: 2.5, breaks: false, highlight: false });
          pen(g, poly(K.deckle([[x - 18, y - 10], [x + 16, y - 14], [x + 20, y + 10], [x - 14, y + 12]], 95 + i, 4, 7)), { fill: P.ember, line: null });
          g.save(); g.strokeStyle = P.tealL; g.lineCap = 'round'; for (let j = 0; j < 5; j++) { const ph = fract(t * 2.4 + j / 5), ang = -Math.PI / 2 + (j - 2) * 0.22; g.lineWidth = 6 * (1 - ph) + 1; g.beginPath(); g.moveTo(x + Math.cos(ang) * 20, y - 20); g.lineTo(x + Math.cos(ang) * (20 + ph * 90 * hit), y - 20 - Math.sin(-ang) * ph * 150 * hit + ph * ph * 60); g.stroke(); } g.restore();
          if (red === 'hole' && i === 0) K.redRing(g, x, y, 62, P.red, 3.5); } });
      // the thumb-scale card: a thumbprint silhouette beside an ember (scale: "the size of your thumb")
      const tu = M.E.outBack(up(t, p.thumbAt, 0.8, 0.5)); if (tu > 0) { const cx = 330, cy = 300; g.save(); g.translate(cx, cy); g.scale(tu, tu);
        K.card(g, -150, -150, 300, 270, { seed: 12, thick: 5 }); g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; for (let r = 10; r < 70; r += 9) { g.beginPath(); g.ellipse(-40, -30, r * 0.75, r, 0.2, 0.2, TAU - 0.4); g.stroke(); } g.restore();
        pen(g, poly(K.deckle([[40, -60], [96, -66], [104, -4], [44, 2]], 77, 6, 10)), { fill: P.ember, lw: 2.5, breaks: false, highlight: false }); mono(g, 'EMBER ≈ THUMB', 0, 90, 16, P.ink70, 'center', 600); g.restore(); }
      if (p.labels !== false && up(t, holes[0], 1, 0.4) > 0) K.tag(g, 520, hy(520) - 40, 560, 300, 'Holes in the hoses', { size: 30, swing: -2, sub: 'NYT, 16 Jul 2019' });
      if (pull > 0) { g.fillStyle = rgba(P.paper, 0); }
    }
  }, { source: 'ILLUSTRATION · RECONSTRUCTION: NYT, 16 JUL 2019 (SINGLE SOURCE)' });
}

// ================================================================= SET: tallyField (pill tallies §6.2)
async function tallyField(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, rect, rrect, mono, poly } = K; const view = p.view ?? 'foot', red = redAt(p, t, view === 'field' ? 'pills' : view === 'parvis' ? 'zero' : 'ring');
    if (view === 'foot') {
      // night stage: sky + rooftops behind, the drafting-table floor in front; the foot of the S-tower strip at the right
      K.backdrop(g, t, { sky: o.sky, yH: 600, glow: 0.25, seed: 27 });
      const FY = 600; g.fillStyle = K.mix(P.kraft, P.night, 0.42); g.fillRect(-600, FY, 3200, 1200); g.save(); g.beginPath(); g.rect(-600, FY, 3200, 1200); g.clip(); lampPoolTone(g, 900, 760, 520, K.mix(P.kraft, P.night, 0.42), 0.14); g.restore();
      K.halftone(g, [-600, FY, 2600, 1800], (x, y) => clamp(Math.hypot((x - 900) / 1.4, y - 760) / 1300 - 0.2), P.night, { pitch: 7 });
      pen(g, rect(-600, FY - 4, 3200, 8), { fill: K.mix(P.kraftD, P.night, 0.4), lw: 2, breaks: false, highlight: false });
      stripCard(g, 1500, 1730, -260, 840, 'SOUTH TOWER', true); K.beam(g, [1516, 830], [1714, 640], 12, { col: K.OAK.L }); K.beam(g, [1714, 640], [1516, 450], 12, { col: K.OAK.L }); K.beam(g, [1516, 450], [1714, 260], 12, { col: K.OAK.L });
      // the field: rows of ink tallies in groups of five; the front row's four groups (the twenty) step forward to the stair foot, turning teal
      const st = an(p, 'step', t, 1, 1, 1.0, M.E.inOutCubic), rows = [[660, 0.95], [722, 1.1], [792, 1.28], [870, 1.45]];
      rows.forEach(([y, sc], r) => { const gw = 5 * 17 * sc + 30 * sc, n = Math.floor(1300 / gw);
        for (let c = 0; c < n; c++) { const chosen = r === 3 && c >= n - 4, bx = 120 + c * gw + (r % 2) * 20;
          for (let i = 0; i < 5; i++) { const j = (c - (n - 4)) * 5 + i, x0 = bx + i * 17 * sc, x = chosen ? lerp(x0, 1000 + j * 25, st) : x0, y2 = chosen ? lerp(y, 840, st) : y;
            tallyFig(g, x, y2, sc, { col: chosen ? K.mix(P.ink70, P.card, st) : P.ink70, line: chosen ? K.mix(P.ink, P.teal, st) : P.ink, t, i: r * 100 + c * 5 + i, walk: chosen && st > 0.02 && st < 0.98 ? 1 : 0 }); } } });
      if (red === 'ring' && st > 0.6) { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([12, 8]); g.beginPath(); g.ellipse(1237, 815, 290, 62, 0, 0, TAU); g.stroke(); g.restore(); }
      if (p.labels !== false && st > 0.8) K.tag(g, 1237, 756, 900, 430, 'About twenty', { size: 34, swing: -2, night: true, sub: 'french government record' });
      // key
      pen(g, rect(110, 120, 400, 120), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
      for (let i = 0; i < 5; i++) tallyFig(g, 148 + i * 17, 202, 1, { col: P.ink70, t }); K.txt(g, '1 GROUP = 5', 270, 190, { size: 34, f: 'narrow', weight: 700 }); mono(g, 'FIREFIGHTERS', 272, 220, 15, P.ink70);
    } else if (view === 'field') {
      ground(g, t, 'day', { pool: [900, 450, 1000], seed: 23 });
      // ≈ 500 = ten groups of fifty (each a 10 x 5 block of small ink tallies)
      for (let k = 0; k < 10; k++) { const bx = 220 + (k % 5) * 300, by = 360 + Math.floor(k / 5) * 260;
        pen(g, rrect(bx - 26, by - 70, 266, 210, 12), { fill: K.mix(P.card, P.paper, 0.4), line: P.ink40, lw: 1.5, breaks: false, highlight: false });
        for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) tallyFig(g, bx + c * 22, by + r * 34, 0.72, { col: P.ink70, t, i: k * 50 + r * 10 + c }); }
      pen(g, rect(150, 110, 470, 120), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
      for (let i = 0; i < 5; i++) tallyFig(g, 185 + i * 14, 188, 0.72, { col: P.ink70, t }); K.txt(g, '1 BLOCK = 50', 300, 180, { size: 34, f: 'narrow', weight: 700 }); mono(g, 'FIREFIGHTERS', 302, 210, 15, P.ink70);
      K.txt(g, 'NEARLY 500', 1780, 190, { size: 64, f: 'narrow', weight: 700, align: 'right' }); mono(g, 'FOUGHT THE FIRE', 1780, 226, 18, P.ink70, 'right');
      // the injured: three small pills slide out of the field
      const pv = an(p, 'pills', t, 1, 4, 0.6, (x) => x), pu = pv > 0.002 ? M.E.outBack(pv) : 0; if (pu > 0) { const y0 = 860;
        g.save(); g.translate((1 - pu) * 800, 0);
        pen(g, rrect(1060, y0 - 50, 280, 100, 50), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false }); tallyFig(g, 1110, y0 + 22, 1.2, { col: P.ink70, t }); K.txt(g, '1 FIREFIGHTER', 1150, y0 + 10, { size: 30, f: 'narrow', weight: 700 });
        pen(g, rrect(1370, y0 - 50, 240, 100, 50), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false }); for (const dx of [0, 24]) tallyFig(g, 1410 + dx, y0 + 22, 1.2, { col: P.ink40, t }); K.txt(g, '+ 2 POLICE', 1470, y0 + 10, { size: 30, f: 'narrow', weight: 700 });
        if (red === 'pills' && pu > 0.9) { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([12, 8]); g.beginPath(); g.roundRect(1040, y0 - 70, 590, 140, 70); g.stroke(); g.restore(); }
        K.tag(g, 1060, y0, 620, y0 - 40, 'Very slightly hurt', { size: 28, swing: 2, sub: 'french government record' }); g.restore(); }
    } else {
      // the night parvis at the north door: twenty teal tallies in a row beside the ink tallies of L57; the 0 card
      K.backdrop(g, t, { sky: 'night', yH: 860, glow: 0.2, roofs: false, seed: 29 });
      const k = 15, ox = 760, oy = 880; const F = K.facadeCard(g, ox, oy, k, { sky: 'night', fireS: K.fireSections(0), spire: 'gone', glow: 0 }, t);
      g.fillStyle = '#6d6156'; g.fillRect(-400, oy, 2800, 600); K.halftone(g, [-400, oy, 2400, 1400], () => 0.25, P.night, { pitch: 7 });
      g.save(); g.strokeStyle = rgba('#2a2a33', 0.6); g.lineWidth = 1.5; g.beginPath(); for (let i = -30; i <= 30; i++) { g.moveTo(960 + i * 40, oy); g.lineTo(960 + i * 150, 1200); } for (let y = oy + 16, d = 16; y < 1200; y += d, d *= 1.2) { g.moveTo(-400, y); g.lineTo(2400, y); } g.stroke(); g.restore();
      for (let i = 0; i < 20; i++) tallyFig(g, 610 + i * 31, 950 + (i % 2) * 4, 1.5, { col: P.card, line: P.teal, t, i });
      for (let i = 0; i < 9; i++) tallyFig(g, 1310 + i * 31, 950 + (i % 2) * 4, 1.5, { col: P.ink70, t, i: 40 + i });
      if (p.labels !== false) { K.tag(g, 900, 890, 940, 740, 'The tower team', { size: 26, swing: 2, night: true, sub: 'teal' }); K.tag(g, 1430, 890, 1440, 740, 'The crews from the nave', { size: 26, swing: -2, night: true, sub: 'ink · a different group' }); }
      // the 0 card, pinned by a brass hinge clip; the "0" is the one red thing (notched underline + ring)
      const zu = M.E.outBack(up(t, p.zeroAt, 0.4, 0.45)); if (zu > 0) { g.save(); g.translate(330, 420); g.scale(zu, zu); g.rotate(-2 * D);
        K.card(g, -200, -230, 400, 470, { seed: 41, thick: 7 }); K.brassClip(g, 0, -222, 1.1);
        K.txt(g, '0', 0, 110, { size: 330, f: 'narrow', weight: 700, align: 'center' }); K.txt(g, 'DEATHS', 0, 185, { size: 48, f: 'narrow', weight: 700, align: 'center', color: P.ink70 });
        if (red === 'zero') { notchUnder(g, -80, 126, 160, up(t, p.zeroAt, 0.4, 0.8) * 1.4 - 0.3); K.redRing(g, 0, 0, 150, P.red, 3.5); } g.restore(); }
    }
  }, { source: 'ILLUSTRATION · ONE TALLY = ONE PERSON IN GROUPS · FIGURES: FRENCH GOVERNMENT RECORD, 17 APR 2019' });
}

// ================================================================= SET: nightModel (the card model at night: lid, tv, curtain, tags, type, survey, vault)
function nightStage(g, t, sky, yH, { glow = 0.25, seed = 61 } = {}) {
  const { P, pen, rect, halftone } = K; K.backdrop(g, t, { sky, yH, glow, seed });
  g.fillStyle = K.mix(P.kraft, sky === 'dusk' ? P.dusk : P.night, 0.5); g.fillRect(-900, yH, 3800, 1500); halftone(g, [-900, yH, 2900, 2600], (x, y) => clamp(0.12 + (y - yH) / 1400), sky === 'dusk' ? P.dusk : P.night, { pitch: 7 });
  pen(g, rect(-900, yH - 4, 3800, 10), { fill: K.mix(P.kraftD, P.night, 0.4), lw: 2, breaks: false, highlight: false });
}
// the roof lid off: repaint the sky over the roof band (nave and choir; the transept gable stays), then the vault shell's
// humps along the wall tops and a few charred truss stubs, ink-40 smoke wisps (never a section: we see the outside only)
function roofless(g, t, X, Y, k, yH, sky, { stubs = true, glow = 0.25, seed = 61 } = {}) {
  const { P, pen } = K;
  for (const [a, b] of [[13.6, 59.6], [72.4, 126.5]]) { g.save(); g.beginPath(); g.rect(X(a), Y(50), (b - a) * k, 17 * k + 1); g.clip(); K.backdrop(g, t, { sky, yH, glow, seed }); g.restore(); }
  for (let x = 14; x < 124; x += 7.4) { if (x > 57 && x < 73) continue; const x0 = X(x), w = Math.min(7.4, 124 - x) * k;
    pen(g, (gg) => { gg.beginPath(); gg.moveTo(x0, Y(33)); gg.quadraticCurveTo(x0 + w / 2, Y(37.6), x0 + w, Y(33)); gg.closePath(); }, { fill: '#d9cdb7', lw: 2, breaks: false, highlight: false, shade: 0.3, shadeColor: '#a99e8b', box: [x0, Y(37.6), x0 + w, Y(33)] }); }
  if (stubs) { g.save(); g.strokeStyle = P.soot; g.lineCap = 'round'; g.lineWidth = Math.max(3, k * 0.35); for (let i = 0; i < 16; i++) { const x = 16 + i * 6.6 + hash(i) * 2; if (x > 57 && x < 73) continue; const h = 1.5 + hash(i * 5) * 3.5; g.beginPath(); g.moveTo(X(x), Y(34.5)); g.lineTo(X(x + (hash(i * 3) - 0.5) * 1.5), Y(34.5 + h)); g.stroke(); } g.restore(); }
}
async function nightModel(ctx, shot) {
  return frame(ctx, shot, (g, t, p, o) => {
    const { P, pen, rect, poly, circle, mono, halftone } = K; const view = p.view ?? 'tags', red = redAt(p, t, 'none');
    if (view === 'lid') {
      nightStage(g, t, o.sky, 900, { glow: 0.3 });
      const k = 11.5, ox = 220, oy = 900, X = (m) => ox + m * k, Y = (m) => oy - m * k;
      K.sideCard(g, ox, oy, k, { sky: 'night', fireS: K.fireSections(0), roofGone: 0, spire: 'gone', glow: 0, glowWin: false }, t);
      if (up(t, p.liftAt, 0.3, 0.05) > 0) roofless(g, t, X, Y, k, 900, o.sky, { glow: 0.3, seed: 61 });
      // the lid: the roof band as one burnt card (eaves 33 m -> ridge 43 m), lifted off and laid aside on the table
      const lu = M.E.inOutCubic(up(t, p.liftAt, 0.3, 0.6)), au = M.E.inOutCubic(up(t, num(p.liftAt, 0.3) + 0.55, 0.85, 0.9));
      const lid = [[X(14), Y(33)], [X(16), Y(43)], [X(110), Y(43)], [X(116), Y(33)]];
      g.save(); const cx = X(65), cy = Y(38); g.translate(cx + au * 420, cy - lu * 170 + au * (oy + 100 - cy + 170)); g.rotate(au * 3 * D); g.scale(1 - au * 0.25, 1 - au * 0.62); g.translate(-cx, -cy);
      pen(g, poly(lid), { fill: '#5b6478', lw: 3, shadow: true, shadowOff: [14, 20], shadowA: 0.3, shade: 0.5, shadeColor: '#3d4a60', box: [X(14), Y(43), X(116), Y(33)], breaks: false });
      halftone(g, [X(14), Y(43), X(116), Y(33)], (x) => clamp(0.35 + 0.4 * Math.sin(x * 0.02)), P.soot, { pitch: 8 });
      for (let i = 0; i < 9; i++) { const hx = X(22 + i * 10.5 + hash(i) * 4), hy = Y(38 + (hash(i + 3) - 0.5) * 5), r = (1.2 + hash(i * 7) * 1.6) * k; pen(g, poly(K.deckle([[hx - r, hy - r * 0.5], [hx + r, hy - r * 0.6], [hx + r * 0.9, hy + r * 0.5], [hx - r * 0.8, hy + r * 0.6]], 300 + i, 4, 8)), { fill: K.mix(P.night, P.ember, 0.18), lw: 2, breaks: false, highlight: false }); }
      g.restore();
      if (lu > 0.5) { const isR = red === 'tag', ax = X(96), ay = Y(36), tx = 1330, ty = 150; g.save(); g.strokeStyle = rgba(P.paper, 0.75); g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + 40, ty + 120, tx, ty + 46); g.stroke(); g.fillStyle = P.paper; g.beginPath(); g.arc(ax, ay, 4, 0, TAU); g.fill(); g.restore();
        g.save(); g.translate(tx, ty); g.rotate(Math.sin(t * 2) * 2 * D); pen(g, poly([[-10, 10], [4, 0], [300, 0], [300, 92], [4, 92], [-10, 82]]), { fill: P.card, lw: 2.2, shadow: true, breaks: false, highlight: false });
        K.txt(g, 'ROOF · GONE', 26, 58, { size: 42, f: 'narrow', weight: 700 }); if (isR) notchUnder(g, 26, 72, 248, up(t, num(p.liftAt, 0.3) + 0.6, 0.9, 0.5)); g.restore(); }
    } else if (view === 'tv') {
      nightStage(g, t, 'night', 940, { glow: 0.3, seed: 63 });
      // the bell-frame toy beyond (unlit frame, the tower burning beneath it, smoke from the frame)
      g.save(); g.translate(880, 40); g.scale(0.62, 0.62);
      const BX = K.cardTower(g, 0, 0, 760, 1100, { open: 1, night: true, belfryTop: 0, belfryBot: 0.62, inside: (gg, a0, b0, a1, b1) => K.bellFrameInside(gg, a0, b0, a1, b1, { char: 0, flame: 0, redBell: -1, slip: 0, t, weights: false }), t });
      bellExtrasWorld(g, t, { towerFlame: 1, frameSmoke: 1 }, BX, { night: true }); g.restore();
      // a card TV camera on a tripod in the foreground (left), aimed at the tower
      const cx = 420, cy = 520; g.save(); g.strokeStyle = P.ink; g.lineCap = 'round';
      for (const [dx, dy] of [[-170, 560], [40, 600], [190, 540]]) { g.lineWidth = 16; g.beginPath(); g.moveTo(cx, cy + 90); g.lineTo(cx + dx, cy + dy); g.stroke(); g.strokeStyle = P.ink70; g.lineWidth = 9; g.stroke(); g.strokeStyle = P.ink; }
      g.restore(); g.save(); g.translate(cx, cy); g.rotate(-6 * D);
      pen(g, rrect0(-210, -90, 380, 170, 14), { fill: P.ink70, lw: 3, shadow: true, shadowOff: [16, 18], shadowA: 0.3, shade: 0.4, shadeColor: P.ink, box: [-210, -90, 170, 80], breaks: false });
      pen(g, rect(170, -60, 120, 110), { fill: P.ink, lw: 3, breaks: false, highlight: false }); pen(g, circle(290, -5, 52), { fill: '#2c3142', lw: 3, breaks: false, highlight: false }); pen(g, circle(290, -5, 30), { fill: K.mix(P.nightL, P.tealL, 0.3), lw: 2, breaks: false, highlight: false });
      pen(g, rect(-150, -150, 210, 60), { fill: P.ink, lw: 2.5, breaks: false, highlight: false }); mono(g, 'TV', -140, -110, 22, P.paper, 'left', 700);
      pen(g, circle(-170, -50, 9), { fill: P.ink40, lw: 1.5, breaks: false, highlight: false });
      g.restore();
      if (p.labels !== false) K.tag(g, 520, 470, 640, 260, 'On camera, 21:40', { size: 26, swing: 2, night: true, sub: 'deputy interior minister' });
    } else if (view === 'curtain' || view === 'tags') {
      nightStage(g, t, 'night', 960, { glow: view === 'curtain' ? 0.25 : 0.05, seed: 65 });
      const k = p.k ?? 11.2, ox = p.ox ?? 730, oy = 960, F = K.facadeCard(g, ox, oy, k, { sky: 'night', fireS: K.fireSections(0), spire: 'gone', glow: 0 }, t), X = F.X, Y = F.Y;
      if (view === 'curtain') {
        // the north tower's frame band peeking over its top (it is the frame burning at the top of the tower), shrinking
        const b = lerp(p.band ?? 1, p.bandTo ?? 0.45, M.E.inOutSine(up(t, p.bandAt, 1, num(p.bandDur, 3)))), bx0 = X(1.5), bx1 = X(13.5), by = Y(69.5);
        for (let i = 0; i < 6; i++) K.flame(g, lerp(bx0, bx1, i / 5), by, (46 + 30 * hash(i)) * b, 58, t, 500 + i, { lean: 0.2 });
        if (red === 'band') { g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.beginPath(); g.ellipse((bx0 + bx1) / 2, by - 24 * b, 110, 30 + 40 * b, 0, -2.2, -2.2 + TAU * 1.05); g.stroke(); g.restore(); }
        // the water curtain: teal paper ribbons rising at the top of both towers, bending over the north tower
        const wu = up(t, p.waterAt, 0.2, 1.2);
        for (let j = 0; j < 7; j++) { const sx = X(27 + j * 2.0), sy = Y(69), ex = lerp(bx1, bx0, j / 6), ey = by - 10, pk = Y(78 + (j % 3) * 1.5);
          const u = clamp(wu * 1.4 - j * 0.06); if (u <= 0) continue; g.save(); g.lineCap = 'round'; const mx = lerp(sx, ex, u), my = lerp(sy, ey, u);
          g.strokeStyle = P.ink; g.lineWidth = 9; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + mx) / 2, pk, mx, my); g.stroke(); g.strokeStyle = j % 2 ? P.tealL : P.teal; g.lineWidth = 6; g.setLineDash([18, 8]); g.lineDashOffset = -twos(t) * 120 - j * 7; g.stroke(); g.restore(); }
        for (let j = 0; j < 3; j++) { const sx = X(-14), sy = Y(40 + j * 4), ex = lerp(bx0, bx1, 0.2 + j * 0.25), ey = by - 6, pk = Y(84 + j * 2); const u = clamp(wu * 1.3 - 0.25 - j * 0.08); if (u <= 0) continue;
          g.save(); g.lineCap = 'round'; const mx = lerp(sx, ex, u), my = lerp(sy, ey, u); g.strokeStyle = P.ink; g.lineWidth = 9; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + ex) / 2 - 40, pk, mx, my); g.stroke(); g.strokeStyle = j % 2 ? P.tealL : P.teal; g.lineWidth = 6; g.setLineDash([18, 8]); g.lineDashOffset = -twos(t) * 120 - j * 5; g.stroke(); g.restore(); }
        K.plume(g, X(8), Y(72), t, { H: 360, W: 50, n: 8, drift: 0.5, seed: 22, depth: 0.4, sky: P.night, base: '#8b8790', shadeCol: '#4a4652', amount: 0.8, line: '#3d3a44' });
        if (p.labels !== false) K.tag(g, X(30), Y(74), X(41) + 60, Y(86), 'Water at the top of the towers', { size: 24, swing: -2, night: true, sub: 'culture ministry' });
      } else {
        // two ≈ tags on a string across the front, a dashed ½ h arc between them (never solid), red notch on the arc
        const u = up(t, p.at ?? 0.1, 0.1, 0.4), ax = X(-6), bx = X(47), sy = Y(63);
        g.save(); g.strokeStyle = rgba(P.paper, 0.8); g.lineWidth = 2.2; g.beginPath(); g.moveTo(ax - 200, sy - 40); g.quadraticCurveTo(960, sy + 30, bx + 200, sy - 40); g.stroke(); g.restore();
        g.save(); g.globalAlpha = u; K.tag(g, ax, sy - 6, ax - 160, sy + 30, '≈ 21:30 · go-ahead', { size: 30, swing: Math.sin(t * 1.8) * 1.5, night: true, sub: 'culture ministry' });
        K.tag(g, bx, sy - 6, bx - 60, sy + 30, '≈ 22:00 · « Elle est sauvée »', { size: 30, swing: Math.sin(t * 1.8 + 1) * 1.5, night: true, sub: 'culture ministry' });
        const acx = (ax + bx) / 2, acy = sy - 10, ar = (bx - ax) / 2 - 40; g.strokeStyle = P.brassL; g.lineWidth = 6; g.setLineDash([18, 12]); g.beginPath(); g.arc(acx, acy + ar * 0.6, ar, Math.PI * 1.18, Math.PI * 1.82); g.stroke(); g.setLineDash([]);
        const tx = acx, ty = acy + ar * 0.6 - ar; g.fillStyle = P.brassL; g.font = '700 46px "Archivo Narrow"'; g.textAlign = 'center'; g.fillText('≈ ½ h', tx, ty - 26);
        if (red === 'arc') { g.fillStyle = P.red; g.beginPath(); g.moveTo(tx - 14, ty - 12); g.lineTo(tx + 14, ty - 12); g.lineTo(tx, ty + 12); g.closePath(); g.fill(); K.redRing(g, tx, ty, 26, P.red, 3); }
        g.restore();
      }
    } else if (view === 'type') {
      ground(g, t, 'day', { pool: [900, 460, 1000], seed: 33 });
      const u = M.E.outBack(up(t, p.at, 0.15, 0.45)); g.save(); g.translate(960, 560); g.scale(u, u); g.rotate(-1.5 * D);
      K.card(g, -620, -260, 1240, 520, { seed: 44, thick: 8 }); K.brassClip(g, 0, -252, 1.3);
      const text = p.text ?? 'How close?'; K.txt(g, text, 0, 90, { size: 230, f: 'serif', weight: 400, align: 'center', color: P.ink });
      g.font = '400 230px "Instrument Serif"'; const w = g.measureText(text).width, qx = w / 2 - g.measureText('?').width / 2 - 4;
      const ru = up(t, p.redAt2 ?? p.qAt, 1.2, 0.5); if ((p.red ?? 'q') === 'q' && ru > 0) { g.strokeStyle = P.red; g.lineWidth = 5; g.beginPath(); g.arc(qx, 10, 120, -Math.PI / 2, -Math.PI / 2 + ru * TAU * 1.02); g.stroke(); }
      g.restore();
    } else if (view === 'survey') {
      nightStage(g, t, 'night', 880, { glow: 0.06, seed: 67 });
      const k = 10.5, ox = 140, oy = 880; K.sideCard(g, ox, oy, k, { sky: 'night', fireS: K.fireSections(0), roofGone: 0, spire: 'gone', glow: 0 }, t);
      roofless(g, t, (m) => ox + m * k, (m) => oy - m * k, k, 880, 'night', { glow: 0.06, seed: 67 });
      // the bell-frame toy beside the model (right), unlit, dark louvre
      g.save(); g.translate(1520, 360); g.scale(0.38, 0.38); K.cardTower(g, 0, 0, 760, 1100, { open: 1, night: true, belfryTop: 0, belfryBot: 0.62, inside: (gg, a0, b0, a1, b1) => K.bellFrameInside(gg, a0, b0, a1, b1, { char: 0.6, flame: 0, redBell: -1, slip: 0, t, weights: false }), t }); g.restore();
      // the survey lamp (foreground right, brass) and its ink-40 beam sweeping: shell first, then the bell toy
      const sw = M.E.inOutSine(up(t, p.sweepAt, 1, 1.4)), sw2 = M.E.inOutSine(up(t, p.sweep2At, 4, 1.4)), lx = 1260, ly = 1010;
      const tx = lerp(lerp(560, 980, sw), 1680, sw2), ty = lerp(lerp(oy - 35 * k, oy - 35 * k, sw), 560, sw2);
      g.save(); g.globalAlpha = 0.85; const ang = Math.atan2(ty - ly, tx - lx), L = Math.hypot(tx - lx, ty - ly), half = 0.12;
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(ang - half) * L * 1.1, ly + Math.sin(ang - half) * L * 1.1); g.lineTo(lx + Math.cos(ang + half) * L * 1.1, ly + Math.sin(ang + half) * L * 1.1); g.closePath(); g.clip();
      halftone(g, [-200, -200, 2200, 1300], () => 0.5, P.ink20, { pitch: 8 }); g.restore();
      g.save(); g.strokeStyle = P.paper; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(tx, ty, 120, 46, 0, 0, TAU); g.stroke(); g.restore();
      if (red === 'spot') K.redRing(g, tx, ty, 70, P.red, 3.5);
      g.save(); g.translate(lx, ly); g.rotate(ang); pen(g, poly([[0, -26], [90, -50], [90, 50], [0, 26]]), { fill: P.brass, lw: 3, shade: 0.4, shadeColor: P.brassD, box: [0, -50, 90, 50], breaks: false }); g.restore();
      pen(g, rect(lx - 12, ly, 24, 120), { fill: P.brassD, lw: 2.5, breaks: false, highlight: false });
      // the loupe lies unused on the table (front left)
      g.save(); g.translate(330, 1000); g.rotate(-12 * D); pen(g, K.rrect(60, -14, 180, 28, 10), { fill: K.OAK.M, lw: 2.5, breaks: false, highlight: false }); pen(g, circle(0, 0, 70), { fill: K.mix(P.nightL, P.tealL, 0.35), lw: 3, breaks: false, highlight: false }); g.strokeStyle = P.brass; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 2; g.stroke(); g.restore();
      if (p.labels !== false) { K.tag(g, 700, oy - 36 * k, 520, 140, 'The stone vault', { size: 26, swing: -2, night: true, sub: 'read by surveyors · months' }); K.tag(g, 1640, 560, 1600, 230, 'The oak frame', { size: 26, swing: 2, night: true, sub: 'bell frame' }); }
    } else if (view === 'vault') {
      // looking straight down into the open model: walls as thick card edges, the shell as domed bays (schematic)
      g.fillStyle = K.mix(P.kraft, P.night, 0.62); g.fillRect(-900, -900, 3800, 3000); halftone(g, [-900, -900, 2900, 2100], () => 0.22, P.night, { pitch: 7 });
      const x0 = 330, x1 = 1560, y0 = 340, y1 = 740, nb = 8, bw = (x1 - x0) / nb;
      // west towers (left, two squares seen from above, balustrade ring) and the apse (right, a half-round end)
      for (const ty of [y0 - 90, y1 - 150]) { pen(g, rect(x0 - 300, ty, 240, 240), { fill: '#d9cdb7', lw: 3, shadow: true, shadowOff: [16, 18], shadowA: 0.35, breaks: false, highlight: false, shade: 0.25, shadeColor: '#a99e8b', box: [x0 - 300, ty, x0 - 60, ty + 240] });
        g.save(); g.strokeStyle = '#7f7869'; g.lineWidth = 2; g.strokeRect(x0 - 280, ty + 20, 200, 200); g.restore(); }
      pen(g, (gg) => { gg.beginPath(); gg.moveTo(x1, y0 - 50); gg.lineTo(x1 + 60, y0 - 50); gg.arc(x1 + 60, (y0 + y1) / 2, (y1 - y0) / 2 + 50, -Math.PI / 2, Math.PI / 2); gg.lineTo(x1, y1 + 50); gg.closePath(); }, { fill: '#a99e8b', lw: 3, shadow: true, shadowOff: [16, 18], shadowA: 0.35, breaks: false, highlight: false });
      pen(g, rect(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100), { fill: '#a99e8b', lw: 3, shadow: true, shadowOff: [16, 18], shadowA: 0.35, breaks: false, highlight: false });
      pen(g, (gg) => { gg.beginPath(); gg.moveTo(x1 + 50, y0); gg.arc(x1 + 50, (y0 + y1) / 2, (y1 - y0) / 2, -Math.PI / 2, Math.PI / 2); gg.closePath(); }, { fill: '#d9cdb7', lw: 2.2, shade: 0.35, shadeColor: '#7f7869', box: [x1, y0, x1 + 260, y1], breaks: false, highlight: false });
      for (let i = 0; i < nb; i++) { const bx = x0 + i * bw, box = [bx, y0, bx + bw, y1];
        pen(g, rect(bx, y0, bw, y1 - y0), { fill: '#d9cdb7', lw: 2.2, shade: (x, y) => clamp(Math.hypot((x - bx - bw / 2) / bw, (y - (y0 + y1) / 2) / (y1 - y0)) * 0.9 - 0.15), shadeColor: '#7f7869', box, breaks: false, highlight: false });
        g.save(); g.strokeStyle = '#7f7869'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, y0); g.lineTo(bx + bw, y1); g.moveTo(bx + bw, y0); g.lineTo(bx, y1); g.stroke(); g.restore(); }
      // charred matchstick beams left at the ends; flame bands still crawling in the end bays (bands)
      const bands = an(p, 'bands', t, 0, 1, 1.5);
      for (let i = 0; i < 12; i++) { const side = i % 2, x = side ? lerp(x1 - bw * 1.6, x1 + 20, hash(i)) : lerp(x0 - 20, x0 + bw * 1.4, hash(i)), a = (hash(i * 3) - 0.5) * 0.6; const yy = i % 4 < 2 ? y0 : y1; K.beam(g, [x - 30, yy - 40], [x + 30 * Math.cos(a), yy + 40 + 30 * hash(i)], 14, { col: K.OAK.M, char: 0.85, lw: 2 }); }
      if (bands > 0) for (let i = 0; i < 9; i++) { const side = i % 2, x = side ? lerp(x1 - bw * 1.4, x1, hash(i + 9)) : lerp(x0, x0 + bw * 1.3, hash(i + 9)), y = lerp(y0 + 20, y1 - 10, hash(i * 5 + 1)); K.flame(g, x, y, 80 * bands * (0.6 + 0.5 * hash(i)), 70, t, 700 + i, { lean: 0.1 }); }
      // one burning piece drops (seen from above: it shrinks toward the shell), strikes; ink-40 dust rises
      const da = num(p.dropAt, 2), fu = range(t, da - 1.2, da), dx = 760, dy = 520;
      if (fu > 0 && fu < 1) { const s = lerp(3.2, 1, M.E.inCubic(fu)); g.save(); g.translate(dx + (1 - fu) * 120, dy - (1 - fu) * 90); g.scale(s, s); g.rotate(fu * 1.2);
        K.beam(g, [-50, -10], [50, 10], 14, { col: K.OAK.M, char: 0.6, lw: 2 }); K.flame(g, 0, -6, 34, 40, t, 801, { lean: 0.2 }); g.restore();
        g.save(); g.globalAlpha = 0.25 * fu; g.fillStyle = P.ink; g.beginPath(); g.ellipse(dx, dy + 10, 60 * fu, 18 * fu, 0, 0, TAU); g.fill(); g.restore(); }
      if (t >= da) { K.beam(g, [dx - 50, dy - 6], [dx + 50, dy + 12], 14, { col: K.OAK.M, char: 0.9, lw: 2 }); K.flame(g, dx, dy - 4, 30 * (1 - range(t, da + 2, da + 5)), 36, t, 802, { lean: 0.1 });
        const du = range(t, da, da + 3.5); for (let j = 0; j < 8; j++) { const a = j / 8 * TAU + 0.3, r = 30 + du * 150 * (0.7 + 0.3 * hash(j)); K.puff(g, dx + Math.cos(a) * r, dy + Math.sin(a) * r * 0.6, (24 + 30 * du) * (1 - du * 0.5), 900 + j, { fill: K.mix(P.ink40, P.card, 0.3 + du * 0.4), shadeCol: P.ink70, line: du > 0.7 ? null : P.ink70, lw: 1.5, shade: 0.4 }); } }
      // rain of pieces (the lift: they keep dropping)
      if ((p.rain ?? 0) > 0) for (let j = 0; j < 5; j++) { const ph = fract(t * 0.45 + j / 5), s = lerp(2.6, 0.9, ph), x = lerp(x0 + 100, x1 - 100, hash(j * 11)), y = lerp(y0 + 40, y1 - 40, hash(j * 13)); g.save(); g.translate(x, y); g.scale(s, s); K.beam(g, [-34, -6], [34, 6], 10, { col: K.OAK.M, char: 0.6, lw: 1.6 }); K.flame(g, 0, -4, 24, 28, t, 820 + j, { lean: 0.2 }); g.restore(); }
      // three hairline breaks in the shell (untimed; the L99 map names them): two ink dashed rings, one red loop
      const bu = range(t, num(p.breakAt, 1e9), num(p.breakAt, 1e9) + 0.9), brk = [[x0 + bw * 2.5, y0 + 120], [dx + 18, dy + 34], [x0 + bw * 5.6, y1 - 110]];
      if (bu > 0 || p.breaks) brk.forEach(([bx, by], i) => { const v = p.breaks ? 1 : clamp(bu * 3 - i * 0.6); if (v <= 0) return; g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); const r0 = M.rng(60 + i); let x = bx - 30 * v, y = by; g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += 10 * v + r0() * 6; y += (r0() - 0.5) * 16; g.lineTo(x, y); } g.moveTo(bx, by); g.lineTo(bx + (r0() - 0.5) * 30 * v, by - 26 * v); g.stroke(); g.restore();
        if (i === 1 && red === 'break') { g.save(); g.strokeStyle = P.red; g.lineWidth = 4.5; g.beginPath(); g.ellipse(bx, by, 64, 46, 0, -2.2, -2.2 + TAU * 1.05 * v); g.stroke(); g.restore(); } else { g.save(); g.strokeStyle = P.paper; g.lineWidth = 2.5; g.setLineDash([7, 6]); g.beginPath(); g.arc(bx, by, 52 * v, 0, TAU); g.stroke(); g.restore(); } });
      if (p.labels !== false) { mono(g, 'THE STONE VAULT · SEEN FROM ABOVE · SCHEMATIC', x0 - 40, y0 - 80, 16, P.paper); if (bu > 0.5 || p.breaks) mono(g, 'THREE PLACES · WHERE: CHAPTER 5', x0 - 40, y1 + 96, 16, P.paper); }
    }
  }, { source: 'ILLUSTRATION · PAPER MODEL' });
}
const rrect0 = (x, y, w, h, r) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

export const TOWER = { briefing, stairStrip, deadlineWheel, riser, tallyField, nightModel };
