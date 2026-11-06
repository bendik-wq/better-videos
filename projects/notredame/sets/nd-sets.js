// NOTRE-DAME (episode 10, "Notre-Dame Was 30 Minutes From Collapse"): the hero 2D canvas sets, "Paper & Spring" look
// (docs/library/animation-study/STYLE-BIBLE.md). Every set is a folded-card / paper-toy model on a drafting table or a
// toy-theatre night plate: printed card, thin navy pen line printed off-register (MIS), halftone and hatching shade
// under ONE lamp at 10 o'clock, hard cast shadows, brass mechanism parts and exactly one red thing per frame.
//
// Library convention (same as projects/palomares/scene.js): the default export is a factory (H) -> { setName: factory };
// a set factory is async (ctx, shot) -> { scene, camera, layer, canvas, update(t, p) }. `canvas` is a 1920x1080-scaled 2D
// canvas the set paints itself (a runtime composites it); everything is a pure function of (t, shot.params) and seeds.
// Named exports: KIT (drawing helpers) and SETS (the raw set factories) for other runtimes (projects/notredame-lab).
//
// Sets and params (all optional; t = seconds into the shot, p = 0..1 progress; "u" params are 0..1):
//   cathedral   view 'fold'|'side'|'facade', sky 'day'|'dusk'|'night', fire 0..1 or [14 section values], fireAt,
//               fireDur (animate fire 0->fire), smoke 0..1, wind (-1..1), spire 'standing'|'leaning'|'falling'|'gone',
//               spireU (fall progress), spireAt/spireDur (animate the fall), roofGone 0..1, glow 0..1 (orange paper glow),
//               clock 'HH:MM'|null, red 'origin'|'clock'|'spire'|'none', cam {x,y,z}, zoomTo {x,y,z,at,dur}, labels, source
//   forest      fire 0..1 (front along the attic, far -> near), fireAt/fireDur, char 0..1, collapse 0..1, debris 0..1,
//               vault true, red 'front'|'none', cam, labels, source
//   spireFall   u 0..1 (or at/dur to animate), sparks 0..1, dust 0..1, cam, shake true, labels, source
//   bellFrame   open 0..1, char 0..1, flame 0..1, redBell index|-1, slip 0..1, domino 0..1 (or dominoAt/dominoDur),
//               chain true (domino diagram), labels, weights true, sky, cam, source
//   clock       from 'HH:MM', to 'HH:MM', roll 0..1 (or rollAt/rollDur), spring 0..1, flapL 'FEU'|null, tagText '+30 MIN',
//               red 'tag'|'right'|'none', cathedral true (small card below), sky, source
//   paris       route 0..1 (or routeAt/routeDur), engines 0..1, boat 0..1, pump 0..1, zoom, center [x,y], labels, red, source
//   firefighters mode 'hose'|'chain'|'stair', n, u 0..1 (or uAt/uDur), sky, red 'relic'|'lead'|'none', labels, source,
//               view: hose 'low' (default: looming cropped façade, braced nozzle team, ladder truck) | 'side' (south flank,
//               hose team on the quay) | 'wide' (the original centred parvis); chain 'side' (default: façade at an angle,
//               the chain receding from the portal to a hand cart, mixed crew) | 'close' (insert: gloved hands passing the
//               reliquary in the portal) | 'wide'; label / sub (tag text), countSub (stair count card line)
//   every set   smokeSeed (number; default derived from the shot id, so plumes differ between shots), smokeStyle
//               'puff'|'column'|'lean'|'billow'
//   cathedral   view 'thumb' (thumbnail: façade right 60 %, opened north belfry with the red bell slipping, glow, spire gap,
//               "IF THEY FALL"): k, ox, oy, thumbText (array|string|null), textSize, textY, ground 'kraft'|'teal', slip, lean,
//               fire, glow, border
//   bellFrame   nx (pair layout: x of the north tower, default 640 so the opened door clears the counter badge)
import * as THREE from 'three';
import * as M from '/engine/motion.js';

// ================================================================= palette (bible §1.2) + the ep10 ember ramp
export const P = {
  paper: '#f7f6f1', card: '#ebe8de', kraft: '#dcd7c8', kraftD: '#c9c2ad',
  ink: '#14233d', ink70: '#3d4a60', ink40: '#8a93a3', ink20: '#c3c8cf',
  tealL: '#8cc5bf', teal: '#2a8c86', tealD: '#1d6662',
  sageL: '#d3e2d5', sage: '#a9c5ae', sageD: '#6f9a7a',
  brassL: '#e3cc98', brass: '#b98a3e', brassD: '#7d5a22',
  // ep10 fire: orange paper glow and ember card (flames stay brass-family paper cut-outs, never red, never a glow)
  emberL: '#f3cf9a', ember: '#e9a25a', emberD: '#c06f34', soot: '#2b2f38',
  red: '#e0241b', redD: '#9e1a14',
  night: '#14233d', nightL: '#22355a', nightD: '#0b1426', dusk: '#34466a', duskL: '#5a6283',
};
export const MIS = [4, 3];                     // the episode's misregistration vector (fixed, bible §3)
export const TAU = Math.PI * 2, D = Math.PI / 180;
const clamp = M.clamp, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const range = (t, a, b) => clamp((t - a) / (b - a));
const fract = (x) => x - Math.floor(x);
const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// colour mixing (hex) for depth tone: back planes recede into the sky / paper colour, never darker or blurrier
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const MIXC = new Map();
export function mix(a, b, u) { const k = a + b + u.toFixed(3); let v = MIXC.get(k); if (!v) { const x = hex(a), y = hex(b); v = toHex(x.map((c, i) => c + (y[i] - c) * u)); MIXC.set(k, v); } return v; }
const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };

// ================================================================= motion helpers
// tick (bible §10.1): n decisive steps with a spring settle
export const tick = (u, n, settle = 0.5) => { const x = clamp(u) * n, k = Math.min(n - 1, Math.floor(x)), f = x - k;
  const s = f < 1 - settle ? 0 : M.E.springTight((f - (1 - settle)) / settle); return (k + s) / n; };
// camBreath (bible §8): +-0.4 % scale sine over 6 s for 2D sets
export const camBreath = (t) => 1 + 0.004 * Math.sin(t * TAU / 6);
const twos = (t) => Math.floor(t * 15) / 15;  // characters / flames on twos
// animated param: value v, or animate 0 -> v from `at` over `dur` seconds (eased)
const anim = (p, key, t, def = 0, ease = M.E.inOutSine) => { const v = p[key] ?? def; const at = p[key + 'At'], dur = p[key + 'Dur'];
  if (at == null || typeof v !== 'number') return v; return v * ease(range(t, at, at + (dur ?? 2))); };

// ================================================================= canvas + primitives
function layerOf(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function canvasLayer(ctx) {
  const layer = layerOf(ctx.overlay), cv = document.createElement('canvas');
  cv.width = ctx.width; cv.height = ctx.height; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  layer.appendChild(cv); return { layer, cv, g: cv.getContext('2d'), s: ctx.width / 1920 };
}
export const pill = (x, y, w, h) => (g) => { g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2); };
export const rrect = (x, y, w, h, r = 4) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const rect = (x, y, w, h) => (g) => { g.beginPath(); g.rect(x, y, w, h); };
export const circle = (x, y, r) => (g) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
export const poly = (pts) => (g) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0], p[1])); g.closePath(); };
const polyline = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0], p[1])); };
const multi = (...bs) => (g) => { g.beginPath(); for (const b of bs) b.add(g); };
// pointed (gothic) arch outline: springs at y (bottom of the arch part), width w, total arch rise h; legs down to y0
export function archPts(cx, y0, w, yS, rise, n = 10) {
  const pts = [[cx - w / 2, y0], [cx - w / 2, yS]];
  for (let i = 1; i <= n; i++) { const a = i / n; pts.push([cx - w / 2 + (w / 2) * Math.sin(a * Math.PI / 2) ** 0.8, yS - rise * Math.sin(a * Math.PI / 2)]); }
  for (let i = n - 1; i >= 1; i--) { const a = i / n; pts.push([cx + w / 2 - (w / 2) * Math.sin(a * Math.PI / 2) ** 0.8, yS - rise * Math.sin(a * Math.PI / 2)]); }
  pts.push([cx + w / 2, yS], [cx + w / 2, y0]); return pts;
}
// deckle: a seeded irregular edge on a polygon (fixed per object, so it never shimmers)
export function deckle(pts, seed, amp = 2.2, step = 9, closed = true) {
  const r = M.rng(seed), out = [], N = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = Math.max(1, Math.round(L / step));
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let k = 0; k < n; k++) { const u = k / n, j = (r() - 0.5) * 2 * amp; out.push([a[0] + (b[0] - a[0]) * u + nx * j, a[1] + (b[1] - a[1]) * u + ny * j]); }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}
export function gearPath(cx, cy, r, n, ang = 0, depth = null, hole = 0.28) {
  depth = depth ?? Math.max(5, r * 0.16);
  return (g) => {
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = ang + i / n * TAU, w = TAU / n;
      [[a0, r - depth], [a0 + w * 0.12, r], [a0 + w * 0.42, r], [a0 + w * 0.54, r - depth]].forEach(([a, rr], k) => { const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; (i === 0 && k === 0 ? g.moveTo : g.lineTo).call(g, x, y); });
    }
    g.closePath();
    if (hole) { g.moveTo(cx + r * hole, cy); g.arc(cx, cy, r * hole, 0, TAU, true); }
  };
}

// ================================================================= print textures
let FIBRE = null;
function fibreTile() {
  if (FIBRE) return FIBRE;
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), im = x.createImageData(512, 512), r = M.rng(11);
  for (let i = 0; i < im.data.length; i += 4) { const v = 255 - Math.floor(r() * 26); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  x.strokeStyle = 'rgba(60,60,60,0.5)'; x.lineWidth = 0.8;
  for (let k = 0; k < 18; k++) { const a = r() * TAU, cx = r() * 512, cy = r() * 512, L = 20 + r() * 50; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a + 0.4) * L / 2, cy + Math.sin(a + 0.4) * L / 2, cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke(); }
  return (FIBRE = c);
}
export function fibre(g, a = 0.09, box = [-200, -200, 2320, 1480]) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = g.createPattern(fibreTile(), 'repeat');
  g.fillRect(box[0], box[1], box[2] - box[0], box[3] - box[1]); g.restore();
}
// world-fixed halftone dot screen inside the current clip, batched into one path. density(x, y) -> 0..1 area cover
export function halftone(g, box, density, color, { pitch = 11, angle = 45, max = 0.85 } = {}) {
  const [x0, y0, x1, y1] = box, ca = Math.cos(angle * D), sa = Math.sin(angle * D);
  let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9;
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) { const i = (x * ca + y * sa) / pitch, j = (-x * sa + y * ca) / pitch; i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
  const df = typeof density === 'function' ? density : () => density;
  g.beginPath();
  for (let i = Math.floor(i0) - 1; i <= Math.ceil(i1) + 1; i++) for (let j = Math.floor(j0) - 1; j <= Math.ceil(j1) + 1; j++) {
    const x = (i * ca - j * sa) * pitch, y = (i * sa + j * ca) * pitch;
    if (x < x0 - pitch || x > x1 + pitch || y < y0 - pitch || y > y1 + pitch) continue;
    const d = Math.min(max, df(x, y)); if (d <= 0.015) continue;
    const r = pitch * Math.sqrt(d / Math.PI); g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
  }
  g.fillStyle = color; g.fill();
}
export function hatch(g, box, { gap = 7, lw = 1.25, color = P.ink40, angle = 45 } = {}) {
  const [x0, y0, x1, y1] = box, L = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ca = Math.cos(angle * D), sa = Math.sin(angle * D);
  g.save(); g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
  for (let k = -L / 2 - gap; k <= L / 2 + gap; k += gap) { const px = cx - sa * k, py = cy + ca * k; g.moveTo(px - ca * L / 2, py - sa * L / 2); g.lineTo(px + ca * L / 2, py + sa * L / 2); }
  g.stroke(); g.restore();
}
// lamp at 10 o'clock: shade rises towards the bottom-right of the box
export const lampShade = (box, lo = 0, hi = 0.5, from = 0.45) => (x, y) => {
  const [x0, y0, x1, y1] = box, u = ((x - x0) / (x1 - x0 || 1) + (y - y0) / (y1 - y0 || 1)) / 2;
  return lo + (hi - lo) * clamp((u - from) / (1 - from));
};
// the off-register pen shape: [hard shadow] -> fill shifted by MIS [+ halftone, hatch] -> pen line -> lamp-side highlight
export function pen(g, build, o = {}) {
  const { fill = null, line = P.ink, lw = 3, mis = MIS, shade = 0, shadeColor = null, box = null, hatched = false, hatchColor = P.ink40, hatchGap = 7,
    shadow = false, shadowOff = [10, 12], shadowA = 0.12, breaks = true, pitch = 11, highlight = true, hiCol = 'rgba(247,246,241,0.7)', alpha = 1 } = o;
  if (alpha <= 0) return;
  if (alpha < 1) { g.save(); g.globalAlpha *= alpha; }
  if (shadow) { g.save(); g.translate(shadowOff[0], shadowOff[1]); build(g); g.fillStyle = `rgba(11,20,38,${shadowA})`; g.fill('evenodd'); g.restore(); }
  if (fill) {
    g.save(); g.translate(mis[0], mis[1]); build(g); g.fillStyle = fill; g.fill('evenodd');
    if ((shade || hatched) && box) {
      g.clip('evenodd');
      if (hatched) hatch(g, box, { color: hatchColor, gap: hatchGap });
      if (shade) halftone(g, box, typeof shade === 'function' ? shade : lampShade(box, 0, shade), shadeColor ?? P.ink40, { pitch });
    }
    g.restore();
  }
  if (line) {
    g.save(); build(g); g.strokeStyle = line; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
    if (breaks) g.setLineDash([340, 9, 120, 12]);
    g.stroke(); g.restore();
  }
  if (highlight && fill && box && box[2] - box[0] > 60) {
    g.save(); g.translate(mis[0], mis[1]); build(g); g.clip('evenodd'); g.translate(5, 5); build(g);
    g.strokeStyle = hiCol; g.lineWidth = 3; g.stroke(); g.restore();
  }
  if (alpha < 1) g.restore();
}
export function mono(g, text, x, y, size = 22, col = P.ink70, align = 'left', weight = 500) {
  g.save(); g.font = `${weight} ${size}px "Plex Mono"`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.letterSpacing = `${(size * 0.16).toFixed(1)}px`; g.fillText(String(text).toUpperCase(), x, y); g.restore();
}
// string tag (bible §9.4): punched luggage tag on a 2 px string, damped swing
export function tag(g, ax, ay, x, y, text, { size = 30, swing = 0, string = 2, night = false, sub = null } = {}) {
  g.save(); g.font = `500 ${Math.round(size * 0.55)}px "Plex Mono"`; g.letterSpacing = `${(size * 0.088).toFixed(1)}px`; const wsub = sub ? g.measureText(String(sub).toUpperCase()).width + size * 1.5 : 0; g.letterSpacing = '0px';
  g.font = `600 ${size}px "Archivo Narrow"`; const w = Math.max(g.measureText(text).width + size * 1.7, wsub), h = size * 1.75 + (sub ? size * 0.75 : 0);
  g.strokeStyle = night ? rgba(P.paper, 0.8) : P.ink70; g.lineWidth = string; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + x) / 2, Math.max(ay, y) + 18, x + size * 0.55, y + h / 2); g.stroke();
  g.fillStyle = night ? P.paper : P.ink; g.beginPath(); g.arc(ax, ay, 3.5, 0, TAU); g.fill();
  g.translate(x, y); g.rotate(swing * D);
  pen(g, poly([[0, 10], [12, 0], [w, 0], [w, h], [12, h], [0, h - 10]]), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
  g.fillStyle = P.paper; g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.beginPath(); g.arc(size * 0.55, h / 2, 5, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = P.ink; g.textBaseline = 'middle'; g.fillText(text, size * 1.05, sub ? size * 0.95 : h / 2 + 2);
  if (sub) mono(g, sub, size * 1.05, size * 1.95, Math.round(size * 0.55), P.ink70);
  g.restore();
}
export function coil(g, x, y, r, col = P.ink, red = null, lw = 3) {
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
  for (let a = 0; a <= 4 * TAU; a += 0.05) { const rr = r * (0.12 + 0.88 * a / (4 * TAU)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke(); if (red) { g.fillStyle = red; g.beginPath(); g.arc(x, y, r * 0.14, 0, TAU); g.fill(); } g.restore();
}
// dashed ring that shape-codes the one red thing (bible §1.5)
export function redRing(g, x, y, r, col = P.red, lw = 2.5) { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.setLineDash([7, 6]); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.restore(); }

// ================================================================= fire, smoke, embers (bible §20.2, ep10 extension)
// paper flame cut-out: 3-5 tips, flips between two shapes on twos; brass-light card, ember tongue, paper core, ink line
export function flame(g, x, y, h, w, t, seed = 1, o = {}) {
  if (h < 2) return;
  const { lw = 2, line = P.ink, outer = P.brassL, mid = P.ember, core = P.paper, lean = 0 } = o;
  const k = (Math.floor(t * 15) + seed) % 2, r = M.rng(seed * 7 + k * 101), n = 2 + Math.floor(r() * 2);
  const tips = Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n; return [u + (r() - 0.5) * 0.12, (0.55 + 0.45 * Math.sin(u * Math.PI)) * (0.7 + r() * 0.4), (r() - 0.5) * 0.3]; });
  const shape = (sc) => (gg) => { const x0 = x - w / 2 * sc, ww = w * sc; gg.beginPath(); gg.moveTo(x0, y);
    let px = x0; tips.forEach(([u, hh, sw], i) => { const tx = x0 + ww * u + (lean + sw) * h * hh * 0.4 * sc, ty = y - h * hh * sc;
      const nx = i < n - 1 ? x0 + ww * (u + tips[i + 1][0]) / 2 : x0 + ww, ny = i < n - 1 ? y - h * sc * 0.28 * Math.min(hh, tips[i + 1][1]) : y;
      gg.quadraticCurveTo(px + (tx - px) * 0.2, ty + (y - ty) * 0.45, tx, ty); gg.quadraticCurveTo(tx + (nx - tx) * 0.7, ty + (ny - ty) * 0.35, nx, ny); px = nx; });
    gg.closePath(); };
  pen(g, shape(1), { fill: outer, line, lw, breaks: false, highlight: false, mis: [2, 1.5] });
  g.save(); g.translate(2, 1.5); shape(0.64)(g); g.fillStyle = mid; g.fill(); shape(0.3)(g); g.fillStyle = core; g.fill(); g.restore();
}
// a puff: a seeded clump of circles drawn as one card shape, halftone shade under the lamp, fire-lit underside band
function puffPath(x, y, r, seed) {
  const rr = M.rng(seed), c = [[x, y, r]]; const n = 4 + Math.floor(rr() * 3);
  for (let i = 0; i < n; i++) { const a = rr() * TAU, d = r * (0.45 + rr() * 0.4); c.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r * (0.45 + rr() * 0.35)]); }
  return (g) => { g.beginPath(); for (const [cx, cy, cr] of c) { g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); } };
}
export function puff(g, x, y, r, seed, o = {}) {
  const { fill = P.card, shadeCol = P.ink40, shade = 0.42, line = P.ink40, lw = 2, lit = null, litA = 1 } = o;
  const b = puffPath(x, y, r, seed), box = [x - r * 2, y - r * 2, x + r * 2, y + r * 2];
  if (line) { g.save(); b(g); g.strokeStyle = line; g.lineWidth = lw * 2; g.lineJoin = 'round'; g.stroke(); g.restore(); }   // union outline
  g.save(); g.translate(MIS[0] * 0.6, MIS[1] * 0.6); b(g); g.fillStyle = fill; g.fill('nonzero'); g.clip('nonzero');
  halftone(g, box, lampShade(box, 0, shade, 0.38), shadeCol, { pitch: 11 });
  if (lit) { g.globalAlpha = litA; g.fillStyle = lit; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 1.25, r * 1.5, r * 0.75, 0, 0, TAU); g.fill(); }
  g.restore();
  if (line) { g.save(); b(g); g.clip('nonzero'); g.translate(-MIS[0] * 0.6, -MIS[1] * 0.6); g.restore(); }
}
// per-shot smoke variant: every set calls smokeFor(p, shot) at the top of update(), so plumes differ between shots
// (seed offset + a style) while staying a pure function of (t, params). params.smokeSeed (number) / params.smokeStyle
// ('puff' | 'column' | 'lean' | 'billow') override; the default seed comes from the shot id.
let SMOKE = { seed: 0, style: null };
export const shotSeed = (shot) => (M.hash(shot?.id ?? 'shot') % 997);
export function smokeFor(p = {}, shot = null) { SMOKE = { seed: p.smokeSeed ?? shotSeed(shot), style: p.smokeStyle ?? null }; return SMOKE; }
// a rising plume of layered paper smoke. depth 0 (near: lined, lit) .. 1 (far: no line, toned into the sky)
export function plume(g, x, y, t, o = {}) {
  let { H = 520, W = 90, n = 11, rate = 0.07, drift = 0.5, seed = 3, depth = 0, sky = P.paper, base = P.card, shadeCol = P.ink40,
    lit = null, amount = 1, line = P.ink40, style = null } = o;
  if (amount <= 0.01) return;
  seed += SMOKE.seed; style = style ?? SMOKE.style ?? 'puff';
  // seeded variety (width, lean, density), then the style
  W *= 0.82 + 0.36 * hash(seed * 1.3); drift += (hash(seed * 2.1) - 0.5) * 0.35; n = Math.max(5, n + Math.round((hash(seed * 3.7) - 0.5) * 4));
  if (style === 'column') { W *= 0.72; drift *= 0.3; n += 3; rate *= 0.85; }
  else if (style === 'lean') { drift = drift * 2.0 + 0.35; H *= 0.82; W *= 1.1; }
  else if (style === 'billow') { W *= 1.3; n = Math.max(5, n - 2); rate *= 0.8; }
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = fract(t * rate + i / n + hash(seed + i) * 0.03); // age 0..1, loops
    const sd = seed * 31 + i * 7 + Math.floor(t * rate + i / n + hash(seed + i) * 0.03) * 131;
    const yy = y - a * H * amount, xx = x + drift * H * a * a * 1.2 + Math.sin(a * 5 + hash(sd) * 6) * W * 0.25;
    const r = W * (0.35 + a * 1.25) * (0.8 + hash(sd + 1) * 0.4) * Math.min(1, a * 6 + 0.25) * (0.6 + 0.4 * amount);
    items.push([a, xx, yy, r, sd]);
  }
  items.sort((p, q) => q[0] - p[0]);
  for (const [a, xx, yy, r, sd] of items) {
    const fade = clamp(depth * 0.6 + a * 0.75 - 0.15);
    puff(g, xx, yy, r, sd, { fill: mix(base, sky, fade * 0.85), shadeCol: mix(shadeCol, sky, fade * 0.7), line: depth > 0.6 || fade > 0.7 ? null : mix(line, sky, fade),
      lit: lit && a < 0.45 ? lit : null, litA: clamp(1 - a * 2.2), shade: 0.45 * (1 - fade * 0.5) });
  }
}
// embers: brass-light paper flecks rising, seeded, on ones
export function embers(g, x0, y0, w, h, t, { n = 40, seed = 5, col = P.emberL, col2 = P.brassL, size = 4, drift = 0.4 } = {}) {
  g.save();
  for (let i = 0; i < n; i++) {
    const sp = 0.18 + hash(seed + i * 3) * 0.3, a = fract(t * sp + hash(seed + i));
    const x = x0 + hash(seed + i * 5) * w + Math.sin((t + i) * 2.1) * 10 + drift * a * h * 0.5, y = y0 - a * h;
    const s = size * (0.6 + hash(i + seed * 9) * 0.8) * (1 - a * 0.6);
    g.fillStyle = i % 3 ? col : col2; g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillRect(-s / 2, -s / 2, s, s * 0.7); g.restore();
  }
  g.restore();
}
// posterised sky (bible §5: a 3-step band, hard edges) with deckle edges so it reads as cut card
const SKY = {
  day: [P.paper, P.paper, P.paper],
  dusk: ['#2b3b5f', '#45547a', '#8a7a86', '#d3a172'],
  night: [P.nightD, P.night, P.nightL, '#5b4a52'],
};
function skyBands(g, kind, yH, t, glow = 0) {
  const c = SKY[kind] ?? SKY.dusk;
  g.fillStyle = c[0]; g.fillRect(-200, -200, 2320, 1480);
  const ys = [yH - 520, yH - 300, yH - 30];
  for (let i = 1; i < c.length; i++) {
    const y = ys[i - 1] ?? yH; const pts = deckle([[-200, y], [2120, y], [2120, 1400], [-200, 1400]], 90 + i, 3, 14);
    // the orange paper glow: the horizon band warms toward ember with the fire
    const col = i === c.length - 1 ? mix(c[i], P.ember, glow * 0.55) : i === c.length - 2 ? mix(c[i], '#9a6d63', glow * 0.45) : c[i];
    poly(pts)(g); g.fillStyle = col; g.fill();
  }
}
// glow (ep10 "orange paper glow", bible §5 posterised-band exception): five cut-card layers in the ember ramp, each a
// union of seeded lobes along the fire's span plus tongues rising above it (heat climbs), each torn with a deckle and
// printed with a halftone fringe in its own ink just outside its edge (a print tint step, never a gradient or a blur).
// Inner layers sit lower (the source is at the bottom). o.rise (tongue height, 0.55), o.layers (5), o.dots (true).
function glowRings(g, x, y, r, amt, t, seed = 1, sky = P.night, spanX = 0, o = {}) {
  if (amt <= 0.01) return;
  const { rise = 0.55, layers = 5, dots = true } = o;
  const cols = [mix(sky, '#7d5552', 0.62), mix(sky, '#9a5a45', 0.82), mix(sky, P.emberD, 0.92), P.ember, mix(P.ember, P.emberL, 0.72)];
  const tw = twos(t), n = 1 + Math.round(spanX / Math.max(1, r * 0.7)), lobes = [];
  for (let j = 0; j < n; j++) { const cx = x - spanX / 2 + (n > 1 ? spanX * j / (n - 1) : 0); lobes.push([cx, y + (hash(seed + j) - 0.5) * r * 0.2, r * (0.74 + 0.3 * hash(seed + j * 3)), 0.86]); }
  const nt = 2 + Math.floor(hash(seed * 5) * 3);
  for (let j = 0; j < nt; j++) { const u = (j + 0.5) / nt, cx = x - spanX / 2 - r * 0.25 + (spanX + r * 0.5) * u + (hash(seed + j * 7) - 0.5) * r * 0.3;
    lobes.push([cx, y - r * rise * (0.55 + 0.5 * hash(seed + j * 11)), r * (0.42 + 0.22 * hash(seed + j * 13)), 1.15]); }
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (const [cx, cy, rr] of lobes) { bx0 = Math.min(bx0, cx - rr * 1.2); bx1 = Math.max(bx1, cx + rr * 1.2); by0 = Math.min(by0, cy - rr * 1.3); by1 = Math.max(by1, cy + rr * 1.2); }
  for (let i = 0; i < layers; i++) {
    const k = amt * (1 - i * 0.165) * (1 + 0.018 * Math.sin(tw * 9 + i * 1.7)), sh = i * r * 0.08;
    const path = (sc) => { g.beginPath(); lobes.forEach(([cx, cy, rr, ey], j) => { const R = rr * k * sc, pts = [];
      for (let q = 0; q < 26; q++) { const a = q / 26 * TAU; pts.push([cx + Math.cos(a) * R, cy + sh + Math.sin(a) * R * ey]); }
      deckle(pts, seed * 10 + i * 31 + j * 17, 4.5, 15).forEach((p, m) => (m ? g.lineTo : g.moveTo).call(g, p[0], p[1])); g.closePath(); }); };
    if (dots && amt * (1 - i * 0.165) * r > 30) { g.save(); path(1.13); g.clip('nonzero'); halftone(g, [bx0, by0 + sh, bx1, by1 + sh], 0.38, cols[i], { pitch: 11 }); g.restore(); }
    path(1); g.fillStyle = cols[i]; g.fill('nonzero');
  }
}
// fire light on wet paving / stone: stacked torn horizontal strips in the ember ramp (reflection bands, widest near the
// middle row), flickering on twos; hard-edged card, never a wash. (x, y) centre, rx/ry half-extent, amt 0..1
export function litPatch(g, x, y, rx, ry, amt, t, seed = 3, base = '#6d6156') {
  if (amt <= 0.01) return;
  const n = Math.max(3, Math.round(ry / 7)), tw = twos(t);
  for (let i = 0; i < n; i++) { const v = (i + 0.5) / n * 2 - 1, prof = Math.sqrt(Math.max(0, 1 - v * v)), h = (ry * 2 / n) * 0.55;
    for (let j = 0; j < 3; j++) { const L = rx * prof * amt * (0.35 + 0.65 * hash(seed + i * 7 + j * 3)) * (1 + 0.06 * Math.sin(tw * 6 + i + j)), cx = x + (hash(seed * 3 + i + j * 11) - 0.5) * rx * 0.9;
      if (L < 8) continue; const c = j === 0 ? mix(base, P.emberD, 0.4) : j === 1 ? mix(base, P.ember, 0.5) : mix(base, P.emberL, 0.6), yy = y + v * ry, hh = h * (j === 2 ? 0.45 : 0.7);
      poly(deckle([[cx - L / 2, yy - hh / 2], [cx + L / 2, yy - hh / 2], [cx + L / 2, yy + hh / 2], [cx - L / 2, yy + hh / 2]], seed * 31 + i * 5 + j, 1.2, 10))(g); g.fillStyle = c; g.fill(); } }
}

// ================================================================= the drafting-table world
function tableGround(g, { col = P.paper, y = 1080 } = {}) { g.fillStyle = col; g.fillRect(-200, -200, 2320, 1480); }
// the lamp pool: 3 posterised hard ellipses (bible §5 gradient exception: posterised, hard edges)
function lampPool(g, x, y, r, col = P.paper, dark = P.card) {
  g.fillStyle = mix(dark, col, 0.0); g.fillRect(-200, -200, 2320, 1480);
  [[1.35, 0.35], [1.0, 0.7], [0.68, 1]].forEach(([k, u]) => { g.beginPath(); g.ellipse(x, y, r * k * 1.4, r * k, -0.2, 0, TAU); g.fillStyle = mix(dark, col, u); g.fill(); });
}
// a foreground ruler on the table edge (layer 0): printed ticks, brass end cap
function ruler(g, x, y, w, lab = 'METRES') {
  pen(g, rect(x, y, w, 46), { fill: P.brassL, lw: 2.5, shadow: true, shade: 0.25, shadeColor: P.brass, box: [x, y, x + w, y + 46], breaks: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5;
  for (let i = 0; i <= w / 12; i++) { const xx = x + 10 + i * 12; if (xx > x + w - 10) break; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + (i % 10 === 0 ? 20 : i % 5 === 0 ? 14 : 8)); g.stroke(); }
  g.restore(); mono(g, lab, x + w - 16, y + 38, 14, P.ink70, 'right');
}
// a small brass counter wheel badge (the episode's spine, top-left): "HH:MM" drums in a brass housing
function counterBadge(g, x, y, time, { scale = 1, red = false, t = 0, night = false } = {}) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  const W = 250, H = 92;
  pen(g, gearPath(W - 6, H - 4, 34, 12, t * 0.5), { fill: P.brass, lw: 2, shade: 0.4, shadeColor: P.brassD, box: [W - 40, H - 40, W + 30, H + 30], breaks: false, highlight: false });
  pen(g, rrect(0, 0, W, H, 10), { fill: P.brass, lw: 2.5, shadow: true, shade: 0.4, shadeColor: P.brassD, box: [0, 0, W, H], breaks: false });
  const digits = String(time ?? '').replace(':', '');
  for (let i = 0; i < 4; i++) {
    const dx = 16 + i * 52 + (i > 1 ? 14 : 0);
    pen(g, rrect(dx, 12, 44, 68, 4), { fill: P.card, lw: 2, breaks: false, highlight: false, shade: (xx, yy) => (yy > 60 || yy < 22 ? 0.5 : 0), shadeColor: P.kraftD, box: [dx, 12, dx + 44, 80] });
    g.save(); g.font = '700 56px "Archivo Narrow"'; g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(digits[i] ?? '0', dx + 22 + 2, 48); g.restore();
  }
  g.fillStyle = P.ink; g.beginPath(); g.arc(122, 36, 4, 0, TAU); g.arc(122, 58, 4, 0, TAU); g.fill();
  if (red) { g.fillStyle = P.red; g.fillRect(14, H + 8, W - 28, 6); }
  g.restore();
}
function sourceLine(g, text, night = false) { if (text) mono(g, text, 96, 1080 - 52, 20, night ? rgba(P.paper, 0.85) : P.ink70); }
function applyCam(g, s, cam, t) {
  const c = { x: 960, y: 540, z: 1, rot: 0, ...(cam ?? {}) }, z = c.z * camBreath(t);
  g.setTransform(s, 0, 0, s, 0, 0); g.translate(960, 540); g.scale(z, z); g.rotate((c.rot ?? 0) * D); g.translate(-c.x, -c.y);
}
// camera from params: cam {x,y,z} plus optional zoomTo {x,y,z,at,dur} (eased lean-in / lift)
function camAt(p, t) {
  const a = { x: 960, y: 540, z: 1, ...(p.cam ?? {}) }; if (!p.zoomTo) return a;
  const b = { ...a, ...p.zoomTo }, u = M.E.inOutSine(range(t, p.zoomTo.at ?? 0, (p.zoomTo.at ?? 0) + (p.zoomTo.dur ?? 3)));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) };
}

// ================================================================= Paris backdrop (layer 3/2): rooftops, chimneys, quay, Seine, trees, tallies
function rooftops(g, y, t, { sky, col, seed = 21, x0 = -100, x1 = 2020, hMin = 40, hMax = 120, dome = true, lineCol = null } = {}) {
  const r = M.rng(seed); let x = x0;
  g.save(); g.beginPath(); g.moveTo(x0, y + 300);
  const chim = [];
  while (x < x1) {
    const w = 60 + r() * 110, h = hMin + r() * (hMax - hMin), m = 10 + r() * 16;
    g.lineTo(x, y - h + m); g.lineTo(x + 8, y - h); g.lineTo(x + w - 8, y - h); g.lineTo(x + w, y - h + m);
    const nc = 1 + Math.floor(r() * 3); for (let k = 0; k < nc; k++) chim.push([x + 12 + r() * (w - 30), y - h, 6 + r() * 6, 10 + r() * 14]);
    if (dome && r() < 0.05) { const cx = x + w / 2; g.lineTo(cx - 30, y - h); g.arc(cx, y - h, 30, Math.PI, 0); }
    x += w;
  }
  g.lineTo(x1, y + 300); g.closePath(); g.fillStyle = col; g.fill();
  for (const [cx, cy, w, h] of chim) { g.fillRect(cx, cy - h, w, h + 1); g.fillRect(cx - 2, cy - h - 3, w + 4, 3); }
  if (lineCol) { g.strokeStyle = lineCol; g.lineWidth = 1.25; for (let k = 0; k < 60; k++) { const xx = x0 + r() * (x1 - x0), yy = y - hMin * 0.6 + r() * 60; g.strokeRect(xx, yy, 7, 10); } }
  g.restore();
}
function trees(g, y, x0, x1, { col = P.sage, shadeCol = P.sageD, line = P.ink, lw = 2, seed = 4, t = 0, size = 34 } = {}) {
  const r = M.rng(seed);
  for (let x = x0; x < x1; x += size * 1.3 + r() * size * 0.6) {
    const s = size * (0.8 + r() * 0.4), sw = Math.sin(t * 1.3 + x * 0.01) * 1.5;
    g.save(); g.fillStyle = line ?? shadeCol; g.fillRect(x - 2, y - s * 0.4, 4, s * 0.5); g.restore();
    puff(g, x + sw, y - s * 1.0, s * 0.55, seed * 100 + Math.round(x), { fill: col, shadeCol, line, lw, shade: 0.5 });
  }
}
function tallyCrowd(g, x0, x1, y, t, { col = P.sage, line = P.ink, sc = 0.8, seed = 9, dens = 1 } = {}) {
  const r = M.rng(seed);
  for (let x = x0; x < x1; x += 11 * sc / dens + r() * 6 * sc) {
    const lean = Math.sin(t * 1.6 + x * 0.03) * 4 + (r() - 0.5) * 4, yy = y + (r() - 0.5) * 8 * sc;
    g.save(); g.translate(x, yy); g.rotate(lean * D); g.scale(sc, sc);
    pen(g, pill(0, -17, 12, 34), { fill: col, line, lw: 1.6, breaks: false, highlight: false, mis: [2, 1.5] });
    g.fillStyle = P.card; g.beginPath(); g.arc(0, -28, 3.2, 0, TAU); g.fill();
    g.restore();
  }
}
function seine(g, y0, y1, t, { col = P.tealL, line = P.teal, night = false } = {}) {
  g.fillStyle = col; g.fillRect(-200, y0, 2320, y1 - y0);
  g.save(); g.strokeStyle = line; g.lineWidth = 2; g.lineCap = 'round';
  const r = M.rng(77), step = Math.floor(t * 30 / 8); // water lines drift 1 px every 8 f (bible §10.6)
  for (let k = 0; k < 26; k++) { const yy = y0 + 8 + r() * (y1 - y0 - 14), x = ((r() * 2100 + step * 1.5) % 2200) - 140, w = 40 + r() * 120;
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  g.restore();
}
// quay wall with stone courses (layer 2 or 0)
function quay(g, y, h, { col = P.card, line = P.ink, shadeCol = P.kraftD, lw = 2 } = {}) {
  pen(g, rect(-40, y, 2000, h), { fill: col, line, lw, shade: 0.3, shadeColor: shadeCol, box: [-40, y, 1960, y + h], breaks: false, highlight: false });
  g.save(); g.strokeStyle = mix(line, col, 0.55); g.lineWidth = 1.25; g.beginPath();
  for (let yy = y + 14; yy < y + h; yy += 14) { g.moveTo(-40, yy); g.lineTo(1960, yy); const off = ((yy - y) / 14) % 2 ? 0 : 22;
    for (let x = -40 + off; x < 1960; x += 44) { g.moveTo(x, yy - 14); g.lineTo(x, yy); } }
  g.stroke(); g.restore();
}

// ================================================================= NOTRE-DAME geometry (metres; side: x from the west front, y up)
// Proportions from published dimensions: towers 69 m, spire 96 m above ground (Viollet-le-Duc), roof ridge ~43 m,
// nave + choir ~128 m long, west front ~41 m wide, transept ~48 m across (here: the south arm gable at x 60-72).
export const ND = { towerH: 69, ridge: 43, eaves: 33, spireH: 96, length: 128, facadeW: 41, crossX: 66, roofX0: 14, roofX1: 116 };
// roof sections (for the fire): 14 sections from the towers to the apse; section 7 is the crossing
export const SECTIONS = Array.from({ length: 14 }, (_, i) => { const x0 = ND.roofX0 + i * (ND.roofX1 - ND.roofX0) / 14; return [x0, x0 + (ND.roofX1 - ND.roofX0) / 14]; });
const ORIGIN = 66; // the fire began in the attic near the crossing (base of the spire); spreads both ways
function fireSections(fire) {
  if (Array.isArray(fire)) return SECTIONS.map((_, i) => clamp(fire[i] ?? 0));
  return SECTIONS.map(([a, b]) => { const d = Math.abs((a + b) / 2 - ORIGIN) / 52; return clamp((fire * 1.18 - d) * 3.2); });
}

// --- the shared look of a card face: day (card on paper) or night (card lit by fire, ink line)
function looks(sky) {
  const night = sky !== 'day';
  return {
    night, stone: night ? '#d9cdb7' : P.card, stoneD: night ? '#a99e8b' : P.kraft, stoneDD: night ? '#7f7869' : P.kraftD,
    lead: night ? '#5b6478' : '#9aa3b3', leadD: night ? '#3d4a60' : P.ink70, line: P.ink, glass: night ? P.ember : P.tealL, glassD: night ? P.emberD : P.teal,
    shade: night ? '#6d6458' : P.ink40, sky: night ? (sky === 'dusk' ? '#45547a' : P.night) : P.paper,
  };
}

// WEST FAÇADE, drawn in stage px. ox, oy = bottom-left; k px per metre. st: { sky, open (north tower opened, bellFrame), spire, fire... }
function facadeCard(g, ox, oy, k, st, t) {
  const L = looks(st.sky), X = (m) => ox + m * k, Y = (m) => oy - m * k, W = ND.facadeW;
  const lw = Math.max(1.5, Math.min(3, k * 0.28)), lw2 = lw * 0.7;
  const box = [X(0), Y(69), X(W), Y(0)];
  // silhouette: base block to 49 m (gallery top), two towers to 69 m
  const sil = [[0, 0], [0, 69], [15, 69], [15, 49], [26, 49], [26, 69], [41, 69], [41, 0]].map(([x, y]) => [X(x), Y(y)]);
  pen(g, poly(sil), { fill: L.stone, line: L.line, lw, shade: lampShade(box, 0.04, 0.32, 0.5), shadeColor: L.stoneD, box, shadow: !L.night, highlight: true });
  // buttresses (vertical strips), stepped
  for (const [a, b] of [[0, 2.4], [12.6, 15], [26, 28.4], [38.6, 41]]) pen(g, rect(X(a), Y(66), (b - a) * k, 66 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false, shade: 0.25, shadeColor: L.stoneDD, box: [X(a), Y(66), X(b), Y(0)] });
  // portals (three pointed portals with nested archivolts, the central one larger)
  for (const [cx, w, h] of [[7.6, 8.6, 14.5], [20.5, 10.2, 17], [33.4, 8.6, 14.5]]) {
    for (let r = 0; r < 4; r++) {
      const ww = w * (1 - r * 0.16), hh = h * (1 - r * 0.05), rise = ww * 0.95;
      const pts = archPts(X(cx), Y(0), ww * k, Y(hh - rise), rise * k, 8);
      pen(g, poly(pts), { fill: r === 0 ? L.stoneD : r === 3 ? (L.night ? '#3b3a3c' : P.ink70) : mix(L.stoneD, L.stone, r * 0.4), line: L.line, lw: r ? lw2 : lw, breaks: false, highlight: false,
        shade: r === 3 ? 0 : 0.3, shadeColor: L.stoneDD, box: [X(cx - ww / 2), Y(hh), X(cx + ww / 2), Y(0)] });
    }
    // tympanum bands + doors split by the trumeau
    g.save(); g.strokeStyle = L.night ? P.ink40 : P.ink40; g.lineWidth = 1.25; for (let b = 0; b < 3; b++) { const yy = Y(h * 0.42 + b * h * 0.09); g.beginPath(); g.moveTo(X(cx - w * 0.3), yy); g.lineTo(X(cx + w * 0.3), yy); g.stroke(); } g.restore();
    pen(g, rect(X(cx - 0.35), Y(h * 0.42), 0.7 * k, h * 0.42 * k), { fill: L.stone, line: L.line, lw: lw2, breaks: false, highlight: false });
  }
  // statue niches on the buttress faces at portal level (four)
  for (const cx of [1.2, 13.8, 27.2, 39.8]) { pen(g, poly(archPts(X(cx), Y(9), 1.6 * k, Y(12), 1.4 * k, 5)), { fill: L.stoneDD, line: L.line, lw: lw2, breaks: false, highlight: false });
    pen(g, pill(X(cx), Y(10.8), 0.8 * k, 2.6 * k), { fill: L.night ? '#5f5a52' : P.ink40, line: null }); }
  // Gallery of Kings: 28 niches between 20 and 24.5 m
  pen(g, rect(X(0), Y(24.8), W * k, 5 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  for (let i = 0; i < 28; i++) { const cx = 0.75 + i * (W - 1.5) / 27.0;
    g.save(); g.translate(MIS[0] * 0.5, MIS[1] * 0.5); poly(archPts(X(cx), Y(20.3), 1.15 * k, Y(23.1), 0.9 * k, 4))(g); g.fillStyle = L.night ? '#4a4846' : P.ink70; g.fill(); g.restore();
    g.fillStyle = L.stone; g.beginPath(); g.roundRect(X(cx) - 0.25 * k, Y(22.6), 0.5 * k, 2.3 * k, 0.25 * k); g.fill(); g.beginPath(); g.arc(X(cx), Y(22.9), 0.28 * k, 0, TAU); g.fill(); }
  g.save(); g.strokeStyle = L.line; g.lineWidth = lw2; g.beginPath(); g.moveTo(X(0), Y(20.2)); g.lineTo(X(W), Y(20.2)); g.moveTo(X(0), Y(25)); g.lineTo(X(W), Y(25)); g.stroke(); g.restore();
  // rose level: the west rose (≈9.6 m) in a square frame + the tower windows (paired lancets in a blind arch)
  const rc = [X(20.5), Y(33.5)], rr = 4.8 * k;
  pen(g, rect(X(15.6), Y(40.5), 9.8 * k, 14.5 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  rose(g, rc[0], rc[1], rr, L, st, t, 24);
  for (const cx of [7.6, 33.4]) {
    pen(g, poly(archPts(X(cx), Y(26), 8 * k, Y(36), 5 * k, 8)), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
    for (const dx of [-1.9, 1.9]) pen(g, poly(archPts(X(cx + dx), Y(26.5), 2.6 * k, Y(34), 2.2 * k, 6)), { fill: L.night ? mix(L.glassD, P.soot, 0.3) : P.ink70, line: L.line, lw: lw2, breaks: false, highlight: false });
    pen(g, circle(X(cx), Y(38.3), 1.2 * k), { fill: L.night ? L.glassD : P.ink70, line: L.line, lw: lw2, breaks: false, highlight: false });
  }
  // the Grand Gallery (41-49 m): an open arcade of colonnettes across the whole front — sky shows through
  pen(g, rect(X(0), Y(49), W * k, 8 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  for (let i = 0; i < 26; i++) { const x0 = 0.9 + i * (W - 1.8) / 26, ww = (W - 1.8) / 26 * 0.72;
    g.save(); g.translate(MIS[0] * 0.5, MIS[1] * 0.5); poly(archPts(X(x0 + ww / 2), Y(42), ww * k, Y(46.2), ww * 0.9 * k, 4))(g); g.fillStyle = L.night ? mix(L.sky, P.ember, (st.glow ?? 0) * 0.5) : P.paper; g.fill(); g.restore();
    g.save(); g.strokeStyle = L.line; g.lineWidth = Math.max(1, lw2 * 0.8); poly(archPts(X(x0 + ww / 2), Y(42), ww * k, Y(46.2), ww * 0.9 * k, 4))(g); g.stroke(); g.restore(); }
  g.save(); g.strokeStyle = L.line; g.lineWidth = lw2; g.beginPath(); for (const yy of [41, 47.2, 49]) { g.moveTo(X(0), Y(yy)); g.lineTo(X(W), Y(yy)); } g.stroke(); g.restore();
  // tower belfry stage (49-69 m): two tall louvered lancets per tower (the abat-sons that let the bells' sound out)
  for (const [tx, open] of [[0, st.openNorth], [26, false]]) {
    if (open) continue; // the north tower is drawn as an opened paper toy by bellFrame
    for (const dx of [4.2, 10.8]) {
      const cx = tx + dx, pts = archPts(X(cx), Y(50.5), 3.6 * k, Y(62), 3.2 * k, 6);
      pen(g, poly(pts), { fill: L.night ? '#3a3638' : P.ink70, line: L.line, lw: lw2, breaks: false, highlight: false });
      g.save(); poly(pts)(g); g.clip(); g.strokeStyle = L.night ? '#8a7f70' : P.ink40; g.lineWidth = Math.max(1.2, k * 0.12);
      g.beginPath(); for (let yy = 51.2; yy < 64.5; yy += 0.9) { g.moveTo(X(cx - 2), Y(yy)); g.lineTo(X(cx + 2), Y(yy + 0.4)); } g.stroke(); g.restore();
      pen(g, rect(X(cx - 0.15), Y(64.5), 0.3 * k, 14 * k), { fill: L.stone, line: null });
    }
    // corner pinnacles + top balustrade (quatrefoil band)
    pen(g, rect(X(tx), Y(69), 15 * k, 2.6 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
    g.save(); g.strokeStyle = L.line; g.lineWidth = 1.2; for (let q = 0; q < 10; q++) { g.beginPath(); g.arc(X(tx + 0.75 + q * 1.5), Y(67.7), 0.5 * k, 0, TAU); g.stroke(); } g.restore();
    for (const cx of [tx + 0.6, tx + 14.4]) pen(g, poly([[X(cx - 0.6), Y(69)], [X(cx), Y(71.5)], [X(cx + 0.6), Y(69)]]), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  }
  // statues on the rose level: Virgin and angels (tiny card figures) for detail
  for (const [cx, h] of [[20.5, 3.4], [18.4, 2.8], [22.6, 2.8]]) pen(g, pill(X(cx), Y(26.6 + h / 2), 0.9 * k, h * k), { fill: L.stone, line: L.line, lw: lw2 * 0.8, breaks: false, highlight: false });
  // stone courses (hairline, decorative) + grime halftone on the lamp-away side
  g.save(); poly(sil)(g); g.clip(); g.strokeStyle = rgba(L.night ? '#5d554b' : P.ink40, 0.55); g.lineWidth = 1; g.beginPath();
  for (let yy = 1.5; yy < 69; yy += 1.5) { g.moveTo(X(0), Y(yy)); g.lineTo(X(W), Y(yy)); } g.stroke(); g.restore();
  return { sil, X, Y, k };
}
// a rose window: stone ring, radial tracery, two rings of oculi, glass in teal (day) or ember (lit from inside by the fire)
function rose(g, cx, cy, R, L, st, t, n = 24) {
  pen(g, circle(cx, cy, R * 1.08), { fill: L.stone, line: L.line, lw: Math.max(1.5, R / 22), breaks: false, highlight: false });
  const lit = (st.glow ?? 0) > 0.05 && L.night;
  pen(g, circle(cx, cy, R), { fill: lit ? mix(L.glassD, P.ember, 0.5 + 0.1 * Math.sin(twos(t) * 7)) : L.glass, line: L.line, lw: Math.max(1.2, R / 30), breaks: false, highlight: false,
    shade: lit ? 0 : 0.4, shadeColor: L.glassD, box: [cx - R, cy - R, cx + R, cy + R] });
  g.save(); g.strokeStyle = L.night ? '#3b3530' : P.ink; g.lineWidth = Math.max(1, R / 40);
  g.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU; g.moveTo(cx + Math.cos(a) * R * 0.22, cy + Math.sin(a) * R * 0.22); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.stroke();
  for (const rr of [0.22, 0.58, 0.8]) { g.beginPath(); g.arc(cx, cy, R * rr, 0, TAU); g.stroke(); }
  for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9, R * 0.075, 0, TAU); g.stroke(); }
  for (let i = 0; i < n / 2; i++) { const a = (i + 0.5) / (n / 2) * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.69, cy + Math.sin(a) * R * 0.69, R * 0.09, 0, TAU); g.stroke(); }
  g.restore();
  pen(g, circle(cx, cy, R * 0.12), { fill: L.stone, line: L.line, lw: 1.2, breaks: false, highlight: false });
}

// SOUTH SIDE ELEVATION in stage px. ox, oy = bottom of the west front; k px/m. st: { sky, fire[], roofGone, spire, spireU, glow }
function sideCard(g, ox, oy, k, st, t) {
  const L = looks(st.sky), X = (m) => ox + m * k, Y = (m) => oy - m * k;
  const lw = Math.max(1.5, Math.min(3, k * 0.3)), lw2 = lw * 0.7;
  const F = st.fireS, gone = st.roofGone ?? 0;
  // --- aisles + chapels (low walls with lean-to roofs), nave x 14-60, choir 72-112, apse to 126
  const lowBox = [X(14), Y(18), X(126), Y(0)];
  pen(g, poly([[X(14), Y(0)], [X(14), Y(12)], [X(112), Y(12)], [X(118), Y(10)], [X(124), Y(6)], [X(126), Y(0)]]), { fill: L.stoneD, line: L.line, lw, shade: lampShade(lowBox, 0.1, 0.38, 0.3), shadeColor: L.stoneDD, box: lowBox, highlight: false });
  pen(g, poly([[X(14), Y(12)], [X(14), Y(16)], [X(112), Y(16)], [X(119), Y(13)], [X(124), Y(8)], [X(124), Y(6)], [X(118), Y(10)], [X(112), Y(12)]]), { fill: L.lead, line: L.line, lw: lw2, highlight: false, breaks: false, shade: 0.35, shadeColor: L.leadD, box: [X(14), Y(16), X(124), Y(6)] });
  // chapel windows
  for (let x = 16; x < 120; x += 7.4) { if (x > 58 && x < 73) continue; pen(g, poly(archPts(X(x + 1.7), Y(2.5), 2.2 * k, Y(8.2), 1.8 * k, 5)), { fill: st.glowWin ? mix(L.glassD, P.ember, 0.4) : (L.night ? '#3b3a3c' : P.ink70), line: L.line, lw: lw2 * 0.9, breaks: false, highlight: false }); }
  // --- clerestory wall 16-33 m
  const wallPts = [[X(14), Y(16)], [X(14), Y(33)], [X(112), Y(33)], [X(119), Y(31)], [X(123), Y(26)], [X(124), Y(16)]];
  const wallBox = [X(14), Y(33), X(124), Y(16)];
  pen(g, poly(wallPts), { fill: L.stone, line: L.line, lw, shade: lampShade(wallBox, 0.05, 0.3, 0.35), shadeColor: L.stoneD, box: wallBox, highlight: true });
  // clerestory windows
  for (let x = 15.9; x < 121; x += 7.4) { if (x > 58 && x < 73) continue;
    const lit = st.glowWin ? clamp(F[Math.min(13, Math.max(0, Math.floor((x - 14) / (102 / 14))))] * 1.5) : 0;
    pen(g, poly(archPts(X(x + 2), Y(18.5), 3 * k, Y(28.5), 2.4 * k, 6)), { fill: lit > 0.05 ? mix(P.emberD, P.emberL, lit * 0.7) : (L.night ? '#38363a' : P.ink70), line: L.line, lw: lw2, breaks: false, highlight: false });
    g.save(); g.strokeStyle = L.night ? '#5d554b' : P.ink40; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(x + 2), Y(18.5)); g.lineTo(X(x + 2), Y(29.8)); g.stroke(); g.restore(); }
  // cornice
  pen(g, rect(X(14), Y(34), 98 * k, 1.4 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  // --- the roof: lead covering 33-43 m (seen side-on it is a band), ridge cresting; hip over the apse
  const roofPts = [[X(14), Y(33)], [X(14), Y(43)], [X(112), Y(43)], [X(117), Y(41.5)], [X(121.5), Y(37.5)], [X(124), Y(33)]];
  const roofBox = [X(14), Y(43), X(124), Y(33)];
  g.save(); poly(roofPts)(g); g.clip();
  // when the roof is gone the band shows the burning frame (matchstick trusses) against the sky + glow
  pen(g, poly(roofPts), { fill: L.lead, line: null, shade: lampShade(roofBox, 0.18, 0.45, 0.2), shadeColor: L.leadD, box: roofBox, highlight: false });
  // standing-seam lead lines
  g.strokeStyle = rgba(L.night ? '#a8b0bf' : P.ink70, 0.55); g.lineWidth = 1.2; g.beginPath(); for (let x = 14.6; x < 124; x += 1.3) { g.moveTo(X(x), Y(33)); g.lineTo(X(x), Y(43)); } g.stroke();
  for (let i = 0; i < 14; i++) {
    const [a, b] = SECTIONS[i], f = F[i], gg = clamp(gone * 1.6 - (1 - f) * 0.9);
    if (f > 0.15) { g.save(); rect(X(a), Y(43), (b - a) * k + 1, 10 * k)(g); g.clip(); hatch(g, [X(a), Y(43), X(b), Y(33)], { color: rgba(P.soot, clamp(f * 1.3)), gap: 5, lw: 1.5 }); g.restore(); }
    if (gg > 0.02) {
      // exposed burning frame: sky/glow behind, charred trusses in front
      g.save(); const top = Y(43), hgt = 10 * k * gg; rect(X(a), top, (b - a) * k + 1, hgt)(g); g.fillStyle = mix(L.sky, P.ember, 0.45 + 0.35 * f); g.fill();
      g.strokeStyle = P.soot; g.lineWidth = Math.max(2, k * 0.32); g.lineCap = 'round';
      for (let x = a + 0.8; x < b; x += 3.1) { const br = hash(x * 3.7) < gg * 0.7, top = br ? 33 + 10 * (0.25 + hash(x) * 0.4) : 43 - 0.5 * gg;
        g.beginPath(); g.moveTo(X(x), Y(33)); g.lineTo(X(x + (br ? 0.6 : 0)), Y(top)); if (!br) { g.moveTo(X(x - 1.4), Y(33)); g.lineTo(X(x), Y(39.5)); g.lineTo(X(x + 1.4), Y(33)); } g.stroke(); }
      g.strokeStyle = P.emberL; g.lineWidth = 1.5; g.beginPath(); for (let x = a + 0.8; x < b; x += 3.1) { g.moveTo(X(x) + 2, Y(34)); g.lineTo(X(x) + 2, Y(36 + hash(x) * 4)); } g.stroke();
      g.restore();
    }
  }
  g.restore();
  pen(g, poly(roofPts), { fill: null, line: L.line, lw });
  // ridge cresting (lead fleurons): tiny teeth along the ridge, missing where burnt
  g.save(); g.fillStyle = L.leadD; for (let x = 14.6; x < 112; x += 1.1) { const i = Math.min(13, Math.floor((x - 14) / (102 / 14))); if (F[i] > 0.4 && gone > 0.2) continue; g.fillRect(X(x), Y(44), Math.max(1.5, 0.35 * k), 1 * k); } g.restore();
  // --- flying buttresses (the stone props): pinnacled piers on the aisle + arched flyers to the clerestory
  for (let x = 14.2; x < 118; x += 7.4) { if (x > 57 && x < 73) continue;
    const px = X(x), py = Y(24), w = 1.6 * k;
    pen(g, rect(px - w / 2, py, w, 24 * k - 12 * k + 1), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
    pen(g, poly([[px - w / 2, py], [px, py - 4 * k], [px + w / 2, py]]), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
    const fl = (gg) => { gg.beginPath(); gg.moveTo(px + w / 2, Y(20.5)); gg.quadraticCurveTo(px + 1.2 * k, Y(28.5), px + 1.5 * k, Y(31.2)); gg.lineTo(px + 1.0 * k, Y(31.2)); gg.quadraticCurveTo(px + 0.75 * k, Y(27), px + w / 2, Y(23.5)); gg.closePath(); };
    pen(g, fl, { fill: L.stoneD, line: L.line, lw: lw2 * 0.9, breaks: false, highlight: false });
  }
  // --- the west towers' south face (x 0-14), 69 m
  const tBox = [X(0), Y(69), X(14), Y(0)];
  pen(g, poly([[X(0), Y(0)], [X(0), Y(69)], [X(14), Y(69)], [X(14), Y(0)]]), { fill: L.stone, line: L.line, lw, shade: lampShade(tBox, 0.06, 0.3, 0.4), shadeColor: L.stoneD, box: tBox, shadow: false });
  for (const dx of [3.6, 10.4]) { const pts = archPts(X(dx), Y(50.5), 3.4 * k, Y(62), 3 * k, 6);
    pen(g, poly(pts), { fill: L.night ? '#3a3638' : P.ink70, line: L.line, lw: lw2, breaks: false, highlight: false });
    g.save(); poly(pts)(g); g.clip(); g.strokeStyle = L.night ? '#8a7f70' : P.ink40; g.lineWidth = Math.max(1.2, k * 0.12); g.beginPath(); for (let yy = 51.2; yy < 64.5; yy += 0.9) { g.moveTo(X(dx - 2), Y(yy)); g.lineTo(X(dx + 2), Y(yy + 0.4)); } g.stroke(); g.restore(); }
  pen(g, rect(X(0), Y(49), 14 * k, 8 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  for (let i = 0; i < 9; i++) { const x0 = 0.6 + i * 1.5; g.save(); poly(archPts(X(x0 + 0.5), Y(42), 1.05 * k, Y(46.2), 0.9 * k, 4))(g); g.fillStyle = L.night ? L.sky : P.paper; g.fill(); g.strokeStyle = L.line; g.lineWidth = 1; g.stroke(); g.restore(); }
  pen(g, rect(X(0), Y(69), 14 * k, 2.6 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  pen(g, poly(archPts(X(7), Y(26), 6 * k, Y(35), 4 * k, 8)), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  for (const [a, b] of [[0, 1.6], [12.4, 14]]) pen(g, rect(X(a), Y(66), (b - a) * k, 66 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  g.save(); poly([[X(0), Y(0)], [X(0), Y(69)], [X(14), Y(69)], [X(14), Y(0)]])(g); g.clip(); g.strokeStyle = rgba(L.night ? '#5d554b' : P.ink40, 0.5); g.lineWidth = 1; g.beginPath(); for (let yy = 1.5; yy < 69; yy += 1.5) { g.moveTo(X(0), Y(yy)); g.lineTo(X(14), Y(yy)); } g.stroke(); g.restore();
  // --- the south transept gable (x 60-72): portal, the south rose (≈12.9 m), gable to 46 m, flanking turrets
  const tx0 = 60, tx1 = 72, tc = 66;
  const gab = [[X(tx0), Y(0)], [X(tx0), Y(33)], [X(tc), Y(45.5)], [X(tx1), Y(33)], [X(tx1), Y(0)]];
  const gBox = [X(tx0), Y(46), X(tx1), Y(0)];
  pen(g, poly(gab), { fill: L.stone, line: L.line, lw, shade: lampShade(gBox, 0.02, 0.25, 0.45), shadeColor: L.stoneD, box: gBox });
  for (const cx of [tx0, tx1]) { pen(g, rect(X(cx - 1), Y(47), 2 * k, 47 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
    pen(g, poly([[X(cx - 1.1), Y(47)], [X(cx), Y(52)], [X(cx + 1.1), Y(47)]]), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false }); }
  for (let r = 0; r < 3; r++) { const ww = 7 - r * 1.2; pen(g, poly(archPts(X(tc), Y(0), ww * k, Y(11 - ww * 0.9), ww * 0.9 * k, 7)), { fill: r === 2 ? (L.night ? '#3b3a3c' : P.ink70) : mix(L.stoneD, L.stone, r * 0.5), line: L.line, lw: lw2, breaks: false, highlight: false }); }
  pen(g, rect(X(tx0 + 0.6), Y(16), 10.8 * k, 1.4 * k), { fill: L.stoneD, line: L.line, lw: lw2, breaks: false, highlight: false });
  rose(g, X(tc), Y(25.2), 5.6 * k, L, st, t, 24);
  // the gable's small triangle rose + crockets
  pen(g, circle(X(tc), Y(38.5), 1.5 * k), { fill: L.night ? L.glassD : P.ink70, line: L.line, lw: lw2, breaks: false, highlight: false });
  g.save(); g.fillStyle = L.stoneD; for (let i = 1; i < 7; i++) { for (const sgn of [-1, 1]) { const u = i / 7, x = tc + sgn * 6 * (1 - u), y = 33 + 12.5 * u; g.beginPath(); g.arc(X(x), Y(y + 0.4), 0.45 * k, 0, TAU); g.fill(); } } g.restore();
  // --- the spire (Viollet-le-Duc, 96 m): lead-clad oak, octagonal, crockets, lucarnes, cross + rooster
  if (st.spire === 'gone') { // the stump: a charred hole at the crossing
    pen(g, poly(deckle([[X(63), Y(43)], [X(64.5), Y(46.5)], [X(66), Y(44.6)], [X(67.8), Y(47.2)], [X(69), Y(43)]], 51, 2, 6, true)), { fill: P.soot, line: L.line, lw: lw2, breaks: false, highlight: false });
  }
  return { X, Y, k };
}
// the spire at (bx, by) = crossing ridge. st.spire state + st.spireU (0..1 fall) -> a lean, a break and a fall
function spire(g, bx, by, k, L, st, t, opts = {}) {
  const state = st.spire ?? 'standing', u = st.spireU ?? 0;
  let a1 = 0, a2 = 0, drop = 0, split = false, alpha = 1;
  if (state === 'leaning') a1 = -(st.spireLean ?? 7);
  if (state === 'falling') { // lean, then the needle breaks above the lower stage and drops through the crossing
    a1 = -M.E.inCubic(clamp(u / 0.55)) * 14; split = u > 0.32; a2 = -M.E.inQuad(clamp((u - 0.32) / 0.6)) * 48;
    drop = M.E.inQuad(clamp((u - 0.4) / 0.6)) * 47 * k; alpha = 1 - clamp((u - 0.85) / 0.15);
  }
  const lw = Math.max(1.5, Math.min(3, k * 0.3)), lw2 = lw * 0.75;
  const lead = L.night ? '#6b7385' : '#9aa3b3', leadD = L.night ? '#3d4a60' : P.ink70;
  // lower stage (ridge to ~58 m): octagon drum with gabled lucarnes and pinnacles; the needle 58 -> 93 m; cross/rooster
  const lower = (gg) => {
    pen(gg, poly([[-5.5 * k, 2 * k], [-5.5 * k, -9 * k], [-4.2 * k, -15 * k], [4.2 * k, -15 * k], [5.5 * k, -9 * k], [5.5 * k, 2 * k]]), { fill: lead, line: L.line, lw, shade: lampShade([-5.5 * k, -15 * k, 5.5 * k, 2 * k], 0.15, 0.5, 0.25), shadeColor: leadD, box: [-5.5 * k, -15 * k, 5.5 * k, 2 * k], highlight: false });
    for (const cx of [-3.2, 0, 3.2]) { pen(gg, poly(archPts(cx * k, -2 * k, 1.8 * k, -8 * k, 1.8 * k, 5)), { fill: L.night && (st.glow ?? 0) > 0.2 ? P.ember : (L.night ? '#2c2a30' : P.ink), line: L.line, lw: lw2, breaks: false, highlight: false });
      pen(gg, poly([[(cx - 1.3) * k, -9.5 * k], [cx * k, -13 * k], [(cx + 1.3) * k, -9.5 * k]]), { fill: lead, line: L.line, lw: lw2, breaks: false, highlight: false }); }
    for (const cx of [-5.5, 5.5]) pen(gg, poly([[(cx - 0.7) * k, -9 * k], [cx * k, -19 * k], [(cx + 0.7) * k, -9 * k]]), { fill: lead, line: L.line, lw: lw2, breaks: false, highlight: false });
  };
  const needle = (gg) => {
    const pts = [[-4 * k, 0], [-0.25 * k, -35 * k], [0.25 * k, -35 * k], [4 * k, 0]];
    pen(gg, poly(pts), { fill: lead, line: L.line, lw, shade: (x) => clamp(0.12 + (x / (4 * k)) * 0.4), shadeColor: leadD, box: [-4 * k, -35 * k, 4 * k, 0], highlight: false });
    gg.save(); gg.strokeStyle = leadD; gg.lineWidth = Math.max(1, k * 0.12); gg.beginPath(); for (const f of [-0.5, 0, 0.5]) { gg.moveTo(f * 4 * k, 0); gg.lineTo(f * 0.25 * k, -35 * k); } gg.stroke(); gg.restore();
    // crockets (tiny hooks up both edges) + lucarne tiers
    gg.save(); gg.fillStyle = L.line; for (let i = 1; i < 16; i++) { const v = i / 16, w = 4 * (1 - v) + 0.25 * v; for (const sg of [-1, 1]) { gg.beginPath(); gg.arc(sg * (w + 0.35) * k, -v * 35 * k, Math.max(1.2, 0.3 * k), 0, TAU); gg.fill(); } } gg.restore();
    for (const [yy, w] of [[-7, 1.6], [-15, 1.2], [-22, 0.8]]) pen(gg, poly(archPts(0, yy * k, w * k, (yy - w * 1.6) * k, w * 0.9 * k, 4)), { fill: L.night ? '#2c2a30' : P.ink, line: null });
    // cross + the copper rooster
    gg.save(); gg.strokeStyle = L.line; gg.lineWidth = Math.max(1.5, k * 0.25); gg.beginPath(); gg.moveTo(0, -35 * k); gg.lineTo(0, -40 * k); gg.moveTo(-1.3 * k, -38 * k); gg.lineTo(1.3 * k, -38 * k); gg.stroke();
    gg.fillStyle = P.brass; gg.beginPath(); gg.ellipse(0, -40.8 * k, 0.9 * k, 0.6 * k, 0, 0, TAU); gg.fill(); gg.strokeStyle = L.line; gg.lineWidth = 1; gg.stroke(); gg.restore();
  };
  g.save(); g.globalAlpha *= alpha; g.translate(bx, by); g.rotate(a1 * D);
  lower(g);
  g.translate(0, -15 * k);
  if (split) { g.translate(-drop * 0.25, drop); g.rotate(a2 * D); }
  needle(g);
  if (split && u < 0.8) { // the snapped base of the needle: jagged, charred
    pen(g, poly(deckle([[-4 * k, 0], [4 * k, 0], [3 * k, 2.5 * k], [-3 * k, 2.2 * k]], 77, 2, 5)), { fill: P.soot, line: L.line, lw: lw2, breaks: false, highlight: false });
  }
  g.restore();
}

// fire on the roof of the side card: flames on each burning section, glow, smoke plumes, embers (drawn after the card)
function sideFire(g, X, Y, k, st, t, back = false) {
  const F = st.fireS, night = st.sky !== 'day', sky = looks(st.sky).sky;
  if (back) { // behind the card: glow rings + far smoke
    const tot = F.reduce((a, b) => a + b, 0) / 14; if (tot <= 0.01) return;
    const cx = SECTIONS.reduce((a, s, i) => a + ((s[0] + s[1]) / 2) * F[i], 0) / Math.max(0.01, F.reduce((a, b) => a + b, 0));
    if (night) { const xs = SECTIONS.map((q, i) => F[i] > 0.1 ? (q[0] + q[1]) / 2 : null).filter(v => v != null); const span = xs.length ? (Math.max(...xs) - Math.min(...xs)) * k : 0;
      glowRings(g, X(cx), Y(47), 26 * k * (0.6 + Math.sqrt(tot)) + 8 * k * (st.glow ?? 0), clamp(0.5 + tot), t, 3, sky, span); }
    for (let i = 0; i < 14; i += 2) if (F[i] > 0.2) plume(g, X((SECTIONS[i][0] + SECTIONS[i][1]) / 2), Y(46), t + i * 1.7, { H: 70 * k * (0.6 + F[i]), W: 9 * k, n: 9, drift: 0.45 + (st.wind ?? 0.3), seed: 40 + i, depth: 0.85, sky, base: night ? '#6a6670' : P.card, shadeCol: night ? '#4a4652' : P.ink40, amount: F[i] * (st.smoke ?? 1) });
    return;
  }
  for (let i = 1; i < 14; i += 2) { const f = Math.max(F[i], F[i - 1]); if (f <= 0.15) continue; const x = SECTIONS[i][0];
    plume(g, X(x), Y(50), t + i * 2.3, { H: 70 * k * (0.5 + f), W: 7 * k, n: 8, drift: 0.4 + (st.wind ?? 0.3), seed: 60 + i, depth: 0.25, sky, base: night ? '#8b8790' : P.card, shadeCol: night ? '#4a4652' : P.ink40, lit: night ? P.emberL : P.brassL, amount: f * (st.smoke ?? 1), line: night ? '#3d3a44' : P.ink40 });
  }
  if (!/^gone/.test(st.spire)) spire(g, X(ND.crossX), Y(ND.ridge), k, looks(st.sky), st, t);
  for (let i = 0; i < 14; i++) {
    const f = F[i]; if (f <= 0.03) continue; const [a, b] = SECTIONS[i], big = (i % 3 === 1) ? 1.7 : 1;
    { const x = (a + b) / 2 + Math.sin(i * 3) * 1.2, h = (3 + 8 * f) * (0.6 + 0.6 * hash(i * 5)) * big * k;
      flame(g, X(x), Y(43 - (st.roofGone ?? 0) * 3) + 2, h, (b - a) * 1.5 * big * k, t, i * 7, { lw: Math.max(1.6, k * 0.22), lean: 0.25 + (st.wind ?? 0.3) * 0.5 }); }
  }
  const tot = F.reduce((x, y) => x + y, 0) / 14;
  if (tot > 0.02) embers(g, X(20), Y(46), 90 * k, 45 * k, t, { n: Math.round(70 * tot) + 10, seed: 13, size: Math.max(3, k * 0.45) });
}

// ================================================================= shared night / day backdrop
// back(g, o): sky (posterised deckled bands at night, a lamp pool on the drafting table by day) + two rooftop planes
function backdrop(g, t, { sky = 'dusk', yH = 880, glow = 0, roofs = true, seed = 21 } = {}) {
  const night = sky !== 'day';
  if (night) { skyBands(g, sky, yH - 40, t, glow); const r = M.rng(5); g.fillStyle = rgba(P.paper, 0.5); for (let i = 0; i < 46; i++) g.fillRect(r() * 1920, r() * 330, 2, 2); }
  else { lampPool(g, 620, 360, 900, P.paper, P.card);
    for (let i = 0; i < 6; i++) { const x = ((hash(i * 7) * 2300 + t * (6 + i * 2)) % 2400) - 240, y = 120 + hash(i * 3) * 330, r = 46 + hash(i + 9) * 40;
      g.save(); g.translate(x, y); g.scale(1.9, 0.75); puff(g, 0, 0, r, 900 + i, { fill: mix(P.card, P.paper, 0.2), shadeCol: mix(P.ink40, P.paper, 0.45), line: mix(P.ink40, P.paper, 0.35), lw: 1.5, shade: 0.35 }); g.restore(); } }
  if (!roofs) return;
  rooftops(g, yH - 60, t, { col: night ? mix(P.nightL, '#6a5a60', 0.35 + glow * 0.3) : mix(P.sageL, P.paper, 0.35), seed, hMin: 70, hMax: 170 });
  rooftops(g, yH - 10, t, { col: night ? mix(P.night, P.nightL, 0.55) : mix(P.sage, P.paper, 0.5), seed: seed + 1, hMin: 40, hMax: 110, lineCol: night ? rgba(P.emberL, 0.45) : rgba(P.sageD, 0.4) });
}
// layer 0: the left-bank quay parapet with a crowd of tallies watching (frames the bottom of the picture)
function foreQuay(g, t, y, { night = true, glow = 0, crowd = true } = {}) {
  seine(g, y, y + 70, t, { col: night ? mix(P.nightL, P.tealD, 0.45) : P.tealL, line: night ? mix(P.teal, P.ember, glow * 0.5) : P.teal });
  if (night && glow > 0.05) { g.save(); g.strokeStyle = P.ember; g.lineWidth = 3; const r = M.rng(12 + Math.floor(t * 7.5)); for (let i = 0; i < 30 * glow; i++) { const x = 420 + r() * 1100, yy = y + 10 + r() * 52; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 14 + r() * 40, yy); g.stroke(); } g.restore(); }
  quay(g, y + 70, 60, { col: night ? '#4b4f5e' : P.card, line: P.ink, shadeCol: night ? '#2c3142' : P.kraftD });
  pen(g, rect(-40, y + 66, 2000, 10), { fill: night ? '#6c6a70' : P.kraft, line: P.ink, lw: 2, breaks: false, highlight: false });
  if (crowd) { trees(g, y + 74, 30, 1900, { col: night ? '#3e5a55' : P.sage, shadeCol: night ? '#22323a' : P.sageD, seed: 6, t, size: 26, line: P.ink });
    tallyCrowd(g, 560, 1880, y + 128, t, { col: night ? '#5f7d79' : P.sage, sc: 0.9, seed: 4, dens: 0.8 }); }
  pen(g, rect(-40, y + 130, 2000, 140), { fill: night ? '#2c3142' : P.kraft, line: P.ink, lw: 3, breaks: false, highlight: false });
}
// the source line on its own paper slip (type always sits on paper, bible §7)
function sourceSlip(g, text) {
  if (!text) return; g.save(); g.font = '500 20px "Plex Mono"'; g.letterSpacing = '3.2px'; const w = g.measureText(text.toUpperCase()).width + 36; g.restore();
  pen(g, rect(84, 1080 - 84, w, 40), { fill: P.card, lw: 1.5, shadow: true, breaks: false, highlight: false });
  mono(g, text, 102, 1080 - 57, 20, P.ink70);
}
// fold-view axonometry: ground point (u = metres north of the south-west corner, v = metres east) -> screen
const foldPt = (C, u, v) => [C.cx - u * C.k * C.fa[0] + v * C.k * C.sa[0], C.cy - u * C.k * C.fa[1] + v * C.k * C.sa[1]];
// the Île de la Cité as a paper plinth under the folded cards: card top, kraft thickness, deckled river edge
function plinth(g, C, t, { night, glow }) {
  const quad = [[-34, -70], [-34, 175], [80, 175], [80, -70]].map(([u, v]) => foldPt(C, u, v));
  const top = deckle(quad, 17, 3, 16);
  // card thickness on the two edges facing us (south and west)
  const th = 22, front = [quad[0], quad[1], [quad[1][0], quad[1][1] + th], [quad[0][0], quad[0][1] + th]], west = [quad[3], quad[0], [quad[0][0], quad[0][1] + th], [quad[3][0], quad[3][1] + th]];
  pen(g, poly(west), { fill: night ? '#5a5048' : P.kraftD, lw: 2, breaks: false, highlight: false });
  pen(g, poly(front), { fill: night ? '#6d6156' : P.kraft, lw: 2, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink, 0.25), box: [Math.min(front[0][0], front[1][0]), Math.min(front[0][1], front[1][1]) - 5, Math.max(front[0][0], front[1][0]), Math.max(front[2][1], front[3][1]) + 5] });
  pen(g, poly(top), { fill: night ? mix('#8e8578', P.ember, glow * 0.18) : P.card, lw: 2.5, breaks: true, highlight: false });
  // paving lines of the parvis + the garden behind the apse (sage) + the quay road
  g.save(); poly(top)(g); g.clip(); g.strokeStyle = rgba(night ? '#3a3632' : P.ink40, 0.55); g.lineWidth = 1.2; g.beginPath();
  for (let v = -66; v < 0; v += 4) { const a = foldPt(C, -30, v), b = foldPt(C, 78, v); g.moveTo(...a); g.lineTo(...b); }
  for (let u = -30; u < 78; u += 6) { const a = foldPt(C, u, -66), b = foldPt(C, u, -2); g.moveTo(...a); g.lineTo(...b); } g.stroke();
  const gard = [[-28, 132], [-28, 172], [74, 172], [74, 132]].map(([u, v]) => foldPt(C, u, v)); poly(gard)(g); g.fillStyle = night ? '#4f665c' : P.sageL; g.fill(); g.restore();
  // a trees row on the south side (between the side card and the river)
  for (let v = 20; v < 170; v += 13) { const [x, y] = foldPt(C, -22 - (v % 2) * 3, v), sc = 1;
    g.fillStyle = P.ink; g.fillRect(x - 2, y - 26, 4, 26); puff(g, x, y - 38 * sc, 15 * sc, v * 7, { fill: night ? '#46635b' : P.sage, shadeCol: night ? '#22323a' : P.sageD, line: P.ink, lw: 1.6, shade: 0.5 }); }
}


// ================================================================= cathedral view 'thumb' (packaging lead "IF THEY FALL")
// The folded-card west front fills the right ~60 %, cropped below the Gallery of Kings; orange paper glow and a dashed
// ghost where the spire stood; the north tower's belfry opened like a paper toy (door swung out, hatched inside face) to show
// the oak bell frame: lower beam charred and cracked, flames under it, ONE red bell slipping off its pin mid-fall (dashed
// red ring = the only red); the south tower leans slightly (the domino stake). Words in Inter 900 ink in the left 40 %,
// coil badge top-left, kraft ground in a 14 px teal-shade border (ground: 'teal' = full teal-shade ground).
// params: k (22), ox, oy, thumbText (['IF', 'THEY', 'FALL'] | string | null), textSize, ground 'kraft'|'teal', slip (0.55),
// lean (2.5 deg), fire (1), glow (1), border (true)
let INTER = null;
export function loadInter() {
  return INTER ??= (async () => { try { const f = new FontFace('Inter', 'url(/projects/mortgage/assets/fonts/Inter-latin.woff2)', { weight: '100 900' }); await f.load(); document.fonts.add(f);
    await document.fonts.load('900 100px Inter'); await document.fonts.load('700 100px Inter'); } catch (e) { console.warn('[nd] Inter not loaded:', e.message); } })();
}
function thumbBelfry(g, x0, y0, x1, y1, t, { slip = 0.55, open = 1 } = {}) {
  const W = x1 - x0, H = y1 - y0;
  // inside: dark oak back wall + halftone, fire light strips low down
  pen(g, rect(x0, y0, W, H), { fill: '#2a2326', lw: 3, breaks: false, highlight: false, shade: (xx, yy) => clamp(0.15 + (yy - y0) / H * 0.1), shadeColor: '#120e10', box: [x0, y0, x1, y1] });
  g.save(); rect(x0, y0, W, H)(g); g.clip();
  litPatch(g, (x0 + x1) / 2, y1 - H * 0.08, W * 0.55, H * 0.1, 1, t, 41, '#2a2326');
  const sill = y1 - H * 0.2, head = y0 + H * 0.2, px = W / 12;
  for (const v of [0.06, 0.5, 0.94]) beam(g, [x0 + W * v, y0 - 4], [x0 + W * v, sill], 0.75 * px, { col: OAK.M, lw: 2, char: v > 0.9 ? 0.4 : 0 });
  for (const [a, b] of [[0.06, 0.5], [0.5, 0.94]]) { beam(g, [x0 + W * a, head + H * 0.06], [x0 + W * b, sill - H * 0.04], 0.35 * px, { col: OAK.L, lw: 1.5, char: 0.3 }); }
  beam(g, [x0 - 6, head], [x1 + 6, head], 0.8 * px, { col: OAK.M, lw: 2 });
  // the lower beam: charred, cracked through the middle, the two halves sagging, ember cracks; flames lick it
  const mid = x0 + W * 0.52, sag = 10 + 6 * Math.sin(twos(t) * 3);
  beam(g, [x0 - 8, sill], [mid - 4, sill + sag], 1.1 * px, { col: OAK.M, char: 0.9, ember: 1, t, lw: 2.5 });
  beam(g, [mid + 4, sill + sag + 4], [x1 + 8, sill - 2], 1.1 * px, { col: OAK.M, char: 0.95, ember: 1, t, lw: 2.5 });
  g.strokeStyle = P.emberL; g.lineWidth = 3; g.beginPath(); g.moveTo(mid - 8, sill - 12); g.lineTo(mid + 2, sill + 2); g.lineTo(mid - 4, sill + 12); g.lineTo(mid + 6, sill + 24); g.stroke();
  for (let i = 0; i < 5; i++) flame(g, x0 + W * (0.12 + i * 0.19), y1 + 8, (H * 0.2 + H * 0.12 * hash(i + 4)) * (1 + 0.08 * Math.sin(twos(t) * 5 + i)), W * 0.26, t, 120 + i, { lw: 2.5, lean: 0.12 });
  // small brass bell (right), the red bell slipping off its pin (left)
  const hy = head + 0.5 * px;
  pen(g, circle(x0 + W * 0.77, hy, 6), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
  bell(g, x0 + W * 0.77, hy + 4, W * 0.3, { tilt: Math.sin(t * 2) * 2, lw: 2.5 });
  const pinX = x0 + W * 0.3, d = W * 0.5, s2 = clamp(slip), bx = pinX + s2 * d * 0.22, by = hy + 8 + s2 * s2 * H * 0.22 + Math.sin(t * 9) * 1.5, tilt = 6 + s2 * 30;
  // the broken headstock stub + the bare pin it slipped off
  beam(g, [pinX - d * 0.42, hy + 0.4 * px], [pinX + d * 0.25, hy + 0.6 * px + 10], 0.55 * px, { col: OAK.D, char: 0.6, lw: 2 });
  pen(g, circle(pinX - d * 0.32, hy + 0.45 * px, 7), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
  // fall arcs (paper speed marks, not blur)
  g.save(); g.strokeStyle = P.paper; g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(bx - d * 0.05, by - d * 0.15, d * (0.62 + i * 0.1), -Math.PI * 0.95, -Math.PI * 0.72); g.stroke(); } g.restore();
  bell(g, bx, by, d, { tilt, red: true, lw: 3 });
  g.restore();
  redRing(g, bx + Math.sin(tilt * D) * d * 0.4, by + d * 0.42, d * 0.78, P.red, 4);
  // the door leaf hinged on the left edge, swung out ~150 deg: hatched printed inside face (glue tabs, fold line, "N")
  const th = clamp(open) * 152 * D, dw = W * Math.cos(th), dsk = -W * Math.sin(th) * 0.18;
  const leaf = [[x0, y0], [x0 + dw, y0 + dsk], [x0 + dw, y1 + dsk], [x0, y1]];
  pen(g, poly(leaf), { fill: '#a99e8b', lw: 3, breaks: false, highlight: false, hatched: true, hatchColor: P.ink40, box: [x0 + dw, y0 + dsk, x0, y1], shadow: true, shadowOff: [14, 12], shadowA: 0.25 });
  g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2.5; g.setLineDash([10, 7]); g.beginPath(); g.moveTo(x0 + dw * 0.9, y0 + dsk * 0.9 + 14); g.lineTo(x0 + dw * 0.9, y1 + dsk * 0.9 - 14); g.stroke(); g.restore();
  for (const v of [0.2, 0.5, 0.8]) { const ax = x0 + dw * 0.98, ay = y0 + dsk + H * v - 26; pen(g, poly([[ax, ay], [ax - 24, ay + 9], [ax - 24, ay + 44], [ax, ay + 52]]), { fill: P.kraft, lw: 1.8, breaks: false, highlight: false }); }
  g.save(); g.font = '700 54px "Archivo Narrow"'; g.fillStyle = P.ink70; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', x0 + dw * 0.5, y0 + dsk * 0.5 + H * 0.5); g.restore();
  for (const v of [0.15, 0.5, 0.85]) pen(g, rrect(x0 - 8, y0 + H * v - 15, 16, 30, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false });
}
function thumbComp(g, t, p) {
  const k = p.k ?? 22, W = ND.facadeW, ox = p.ox ?? 1920 - 34 - W * k, oy = p.oy ?? 40 + 71.5 * k, X = (m) => ox + m * k, Y = (m) => oy - m * k;
  const teal = p.ground === 'teal', gnd = teal ? P.tealD : P.kraft;
  g.fillStyle = gnd; g.fillRect(-200, -200, 2320, 1480);
  if (!teal) halftone(g, [0, 0, 1920, 1080], lampShade([0, 0, 1920, 1080], 0, 0.22, 0.45), P.kraftD, { pitch: 14 });
  const fire = p.fire ?? 1;
  glowRings(g, X(20.5), Y(54), 9.5 * k, clamp(0.5 + 0.5 * fire) * (p.glow ?? 1), t, 9, gnd, 14 * k, { rise: 0.85 });
  plume(g, X(19), Y(62), t, { H: 520, W: 4.2 * k, n: 9, drift: 0.5, seed: 77, depth: 0.25, sky: gnd, base: '#8b8790', shadeCol: '#4a4652', lit: P.emberL, amount: fire, line: P.ink, style: 'column' });
  // the gap where the spire stood: a dashed ink ghost of the lower stage + needle, 0.72x (it stood ~60 m behind the front)
  { const k2 = k * 0.72, bx = X(20.5), by = Y(47); g.save(); g.strokeStyle = teal ? rgba(P.paper, 0.75) : P.ink70; g.lineWidth = 3; g.setLineDash([14, 10]);
    g.beginPath(); g.moveTo(bx - 5.5 * k2, by); g.lineTo(bx - 5.5 * k2, by - 9 * k2); g.lineTo(bx - 4 * k2, by - 15 * k2); g.lineTo(bx - 0.25 * k2, by - 50 * k2); g.lineTo(bx + 0.25 * k2, by - 50 * k2); g.lineTo(bx + 4 * k2, by - 15 * k2); g.lineTo(bx + 5.5 * k2, by - 9 * k2); g.lineTo(bx + 5.5 * k2, by); g.stroke(); g.restore(); }
  for (let j = 0; j < 5; j++) flame(g, X(15.8 + j * 2.4), Y(48.6), (5 + 6 * hash(j + 1)) * k * fire, 3.2 * k, t, 140 + j, { lean: 0.25, lw: 3 });
  const st = { sky: 'dusk', fireS: fireSections(0.9), spire: 'gone', glow: 1, openNorth: true };
  const lean = p.lean ?? 2.5, sx0 = X(25.6), sy1 = Y(49);
  g.save(); g.beginPath(); g.rect(-200, -200, 2400, 1500); g.rect(sx0, -200, X(41) + 60 - sx0, sy1 + 200); g.clip('evenodd'); facadeCard(g, ox, oy, k, st, t); g.restore();
  g.save(); g.translate(X(41), sy1); g.rotate(lean * D); g.translate(-X(41), -sy1); g.beginPath(); g.rect(sx0, -200, X(41) + 60 - sx0, sy1 + 200); g.clip(); facadeCard(g, ox, oy, k, st, t); g.restore();
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(sx0, sy1); for (let i = 1; i <= 8; i++) g.lineTo(sx0 + (X(41) - sx0) * i / 8, sy1 + (i % 2 ? 7 : -3)); g.stroke(); g.restore();
  // the opened north tower keeps its crown: balustrade (quatrefoils) + corner pinnacles
  pen(g, rect(X(0), Y(69), 15 * k, 2.6 * k), { fill: '#a99e8b', lw: 2.5, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.6; for (let q = 0; q < 10; q++) { g.beginPath(); g.arc(X(0.75 + q * 1.5), Y(67.7), 0.5 * k, 0, TAU); g.stroke(); } g.restore();
  for (const cx of [0.6, 14.4]) pen(g, poly([[X(cx - 0.6), Y(69)], [X(cx), Y(71.5)], [X(cx + 0.6), Y(69)]]), { fill: '#a99e8b', lw: 2.5, breaks: false, highlight: false });
  thumbBelfry(g, X(1.2), Y(66.4), X(13.8), Y(49.6), t, { slip: p.slip ?? 0.55 });
  // the coil badge (brass coil on a card roundel)
  pen(g, circle(118, 112, 66), { fill: P.card, lw: 3, shadow: true, breaks: false, highlight: false }); pen(g, circle(118, 112, 66), { fill: null, line: P.brass, lw: 6, breaks: false });
  coil(g, 118, 112, 46, P.brassD, null, 6);
  const tx = p.thumbText === undefined ? ['IF', 'THEY', 'FALL'] : p.thumbText;
  if (tx) { const ls = [].concat(tx), size = p.textSize ?? (ls.length > 2 ? 250 : 210), y0 = p.textY ?? (1080 - 92 - (ls.length - 1) * size * 0.9);
    g.save(); g.font = `900 ${size}px Inter, "Archivo Narrow"`; g.letterSpacing = `${-size * 0.02}px`; g.textBaseline = 'alphabetic';
    ls.forEach((l, i) => { g.fillStyle = 'rgba(11,20,38,0.18)'; g.fillText(l, 76 + 10, y0 + i * size * 0.9 + 12); g.fillStyle = teal ? P.paper : P.ink; g.fillText(l, 76, y0 + i * size * 0.9); });
    g.restore(); }
  if (p.border !== false && !teal) { g.save(); g.strokeStyle = P.tealD; g.lineWidth = 28; g.strokeRect(0, 0, 1920, 1080); g.restore(); }
}

// ================================================================= SET: cathedral
const VIEW = { fold: { k: 7.9, ox: 560, ground: 800 }, side: { k: 8.6, ox: 400, ground: 905 }, facade: { k: 8.5, ground: 905 } };
async function cathedral(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const view = p.view ?? 'fold', sky = p.sky ?? 'dusk', V = VIEW[view] ?? VIEW.fold;
  if (view === 'thumb') await loadInter();
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 1920, 1080);
    const fire = anim(p, 'fire', t, 0), smoke = p.smoke ?? 1, glow = p.glow ?? (sky === 'day' ? 0 : clamp(fire * 1.4));
    let spireU = p.spireU ?? 0; if (p.spireAt != null) spireU = range(t, p.spireAt, p.spireAt + (p.spireDur ?? 3));
    const st = { sky, fireS: fireSections(fire), roofGone: anim(p, 'roofGone', t, 0), spire: p.spire ?? 'standing', spireU, glow, wind: p.wind ?? 0.35, smoke, glowWin: sky !== 'day' && fire > 0.05, spireLean: p.spireLean };
    const night = sky !== 'day', Lk = looks(sky), k = p.k ?? V.k, yG = p.ground ?? V.ground;
    const cam = camAt(p, t); applyCam(g, s, cam, t);
    if (view === 'thumb') { g.setTransform(s, 0, 0, s, 0, 0); thumbComp(g, t, p); fibre(g, 0.07); return; }
    backdrop(g, t, { sky, yH: view === 'fold' ? yG + 40 : yG, glow });
    let originPt = null;
    if (view === 'side') {
      const ox = p.ox ?? V.ox, X = (m) => ox + m * k, Y = (m) => yG - m * k;
      // ground shadow of the card (hard, down-right) on the far quay
      sideFire(g, X, Y, k, st, t, true);
      sideCard(g, ox, yG, k, st, t);
      sideFire(g, X, Y, k, st, t, false);
      originPt = [X(64), Y(41)];
      foreQuay(g, t, yG, { night, glow });
    } else if (view === 'facade') {
      const ox = p.ox ?? 960 - 20.5 * k, oy = yG, cx = ox + 20.5 * k;
      if (night && fire > 0) glowRings(g, cx, oy - 62 * k, 62 * k, clamp(0.4 + fire), t, 2, Lk.sky);
      // the spire stands ~60 m behind the front: drawn 0.72x (perspective cheat) between the towers, or the gap where it stood
      const stF = { ...st };
      if (fire > 0.05) plume(g, cx + 4 * k, oy - 55 * k, t, { H: 75 * k, W: 8 * k, n: 10, drift: st.wind, seed: 8, depth: 0.3, sky: Lk.sky, base: night ? '#8b8790' : P.card, shadeCol: night ? '#4a4652' : P.ink40, lit: P.emberL, amount: fire * smoke, line: night ? '#3d3a44' : P.ink40 });
      if (st.spire !== 'gone') spire(g, cx, oy - 47 * k, k * 0.72, Lk, stF, t);
      if (fire > 0.05) for (let j = 0; j < 4; j++) flame(g, cx + (-4.2 + j * 2.8) * k, oy - 48.6 * k, (5 + 9 * fire) * (0.7 + 0.4 * hash(j)) * k, 3.4 * k, t, 30 + j, { lean: 0.3 });
      // parvis: paving + the trees of the square, then the card, then a dimension rule (69 m / 96 m)
      pen(g, rect(-40, oy - 6, 2000, 30), { fill: night ? '#6d6156' : P.kraft, lw: 2, breaks: false, highlight: false });
      g.save(); g.strokeStyle = rgba(night ? '#3a3632' : P.ink40, 0.6); g.lineWidth = 1.2; g.beginPath(); for (let x = -40; x < 1960; x += 26) { g.moveTo(x, oy - 6); g.lineTo(x - 18, oy + 24); } g.stroke(); g.restore();
      // façade shadow on the parvis (hard, down-right)
      g.save(); g.fillStyle = `rgba(11,20,38,${night ? 0.25 : 0.12})`; g.beginPath(); g.moveTo(ox + 6, oy); g.lineTo(ox + 41 * k + 6, oy); g.lineTo(ox + 41 * k + 90, oy + 24); g.lineTo(ox + 90, oy + 24); g.fill(); g.restore();
      facadeCard(g, ox, oy, k, { ...st, openNorth: p.openNorth }, t);
      for (const [x0, x1] of [[60, ox - 30], [ox + 41 * k + 30, 1880]]) trees(g, oy + 2, x0, x1, { col: night ? '#46635b' : P.sage, shadeCol: night ? '#22323a' : P.sageD, seed: 8 + x0, t, size: 46, line: P.ink });
      if (p.rule !== false) { // the survey rule: brass ruler with 69 m and 96 m ticks
        const rx = ox + 41 * k + 70; pen(g, rect(rx, oy - 96 * k, 22, 96 * k), { fill: P.brassL, lw: 2, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brass, box: [rx, oy - 96 * k, rx + 22, oy] });
        g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let m = 0; m <= 96; m += 2) { const yy = oy - m * k; g.moveTo(rx, yy); g.lineTo(rx + (m % 10 === 0 ? 14 : 7), yy); } g.stroke(); g.restore();
        for (const [m, lab] of [[69, '69 M · TOWERS'], [96, '96 M · SPIRE']]) { g.save(); g.strokeStyle = night ? rgba(P.paper, 0.8) : P.ink70; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(m === 69 ? ox + 41 * k : cx + 3, oy - m * k); g.lineTo(rx, oy - m * k); g.stroke(); g.restore(); mono(g, lab, rx + 34, oy - m * k + 8, 22, night ? P.paper : P.ink); }
      }
      foreQuay(g, t, oy + 24, { night, glow, crowd: p.crowd !== false });
      if (p.labels !== false && !night) { tag(g, ox + 20.5 * k, oy - 33.5 * k, ox - 560, oy - 400, 'West rose', { size: 28, swing: -2, sub: '≈ 9.6 M ACROSS' }); tag(g, ox + 4 * k, oy - 60 * k, ox - 560, oy - 620, 'North tower', { size: 28, swing: 2, sub: 'the 8 bells hang here' }); }
      if (!night) { // drafting tools on the table edge: a brass divider (hinged) and a pencil
        g.save(); g.translate(1500, 1040); g.rotate(-0.25);
        for (const a of [-0.32, 0.32]) { g.save(); g.rotate(a); pen(g, poly([[-7, 0], [7, 0], [2, 230], [-2, 230]]), { fill: P.brassL, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [-7, 0, 7, 230] }); g.restore(); }
        pen(g, circle(0, 0, 18), { fill: P.brass, lw: 2.5, breaks: false, highlight: false }); pen(g, circle(0, 0, 6), { fill: P.brassD, lw: 1.5, breaks: false, highlight: false }); g.restore();
        g.save(); g.translate(380, 1050); g.rotate(-0.08); pen(g, poly([[0, -11], [420, -11], [460, 0], [420, 11], [0, 11]]), { fill: P.sage, lw: 2.5, shadow: true, breaks: false, highlight: false }); pen(g, poly([[420, -11], [460, 0], [420, 11]]), { fill: P.kraft, lw: 2, breaks: false, highlight: false }); g.restore(); }
    } else { // fold: the west façade card and the south side card folded at the south-west corner (axonometric), on an island plinth
      const C = { k, cx: p.ox ?? V.ox, cy: yG, fa: [0.62, 0.21], sa: [0.88, -0.15] };
      // the river under the plinth: axonometric water lines
      g.fillStyle = night ? mix(P.nightL, P.tealD, 0.4) : P.tealL; g.fillRect(-200, yG - 140, 2320, 1400);
      g.save(); g.strokeStyle = night ? mix(P.teal, P.ember, glow * 0.4) : P.teal; g.lineWidth = 2; const r = M.rng(31), step = Math.floor(t * 30 / 8);
      for (let i = 0; i < 40; i++) { const x = (r() * 2400 + step * 1.4) % 2400 - 240, y = yG - 120 + r() * 400, w = 40 + r() * 90; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * C.sa[0], y + w * C.sa[1]); g.stroke(); } g.restore();
      plinth(g, C, t, { night, glow });
      // card shadows on the plinth (hard, lamp top-left)
      g.save(); g.fillStyle = `rgba(11,20,38,${night ? 0.25 : 0.13})`; g.beginPath(); const s0 = foldPt(C, 41, 0), s1 = foldPt(C, 0, 0), s2 = foldPt(C, 0, 126), s3 = foldPt(C, -10, 126), s4 = foldPt(C, -10, 8), s5 = foldPt(C, 41, -2);
      g.moveTo(...s0); g.lineTo(...s1); g.lineTo(...s2); g.lineTo(s3[0] + 30, s3[1] + 10); g.lineTo(s4[0] + 30, s4[1] + 10); g.lineTo(s5[0] + 20, s5[1] + 8); g.closePath(); g.fill(); g.restore();
      g.save(); g.transform(C.sa[0], C.sa[1], 0, 1, C.cx, C.cy);
      sideFire(g, (m) => m * k, (m) => -m * k, k, st, t, true);
      sideCard(g, 0, 0, k, st, t);
      g.save(); poly([[0, 0], [0, -69 * k], [14 * k, -69 * k], [14 * k, -34 * k], [124 * k, -33 * k], [126 * k, 0]])(g); g.clip(); halftone(g, [0, -70 * k, 128 * k, 0], 0.1, night ? '#4a4038' : P.ink40, { pitch: 11 }); g.restore();
      sideFire(g, (m) => m * k, (m) => -m * k, k, st, t, false);
      g.restore();
      g.save(); g.transform(C.fa[0], C.fa[1], 0, 1, C.cx - 41 * k * C.fa[0], C.cy - 41 * k * C.fa[1]);
      facadeCard(g, 0, 0, k, { ...st, openNorth: p.openNorth }, t);
      g.restore();
      g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(C.cx, C.cy); g.lineTo(C.cx, C.cy - 69 * k); g.stroke(); g.restore();
      originPt = [C.cx + 64 * k * C.sa[0], C.cy + 64 * k * C.sa[1] - 41 * k];
      if (p.foreground !== false) foreQuay(g, t, 1000, { night, glow, crowd: true });
    }
    // ---- the one red thing: the fire's origin (a pin + dashed ring), or the clock underline
    const red = p.red ?? (fire > 0 && view !== 'facade' ? 'origin' : 'clock');
    if (red === 'origin' && originPt) {
      const [ox, oy] = originPt;
      pen(g, circle(ox, oy, 9), { fill: P.red, line: P.ink, lw: 2.5, breaks: false, highlight: false }); redRing(g, ox, oy, 19);
      if (p.labels !== false) tag(g, ox + 4, oy - 12, ox + (p.tagDx ?? -380), oy + (p.tagDy ?? -300), p.originLabel ?? 'Attic, near the crossing', { size: 28, swing: -2, night, sub: p.originSub ?? 'where the fire began' });
    }
    if (p.tags) for (const tg of p.tags) tag(g, ...tg.at, ...tg.to, tg.text, { size: 28, swing: tg.swing ?? 0, night, sub: tg.sub });
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock !== null) counterBadge(g, 96, 72, p.clock ?? '18:18', { red: red === 'clock', t, night });
    if (p.kicker) mono(g, p.kicker, 380, 128, 24, night ? rgba(P.paper, 0.9) : P.ink70);
    fibre(g, night ? 0.06 : 0.09);
    sourceSlip(g, p.source ?? 'ILLUSTRATION · PROPORTIONS FROM PUBLISHED DIMENSIONS');
  } };
}

// ================================================================= oak + figures + bells (shared by forest, bellFrame, firefighters)
export const OAK = { L: '#d6b98f', M: '#a98159', D: '#73553a', char: '#3a2f2a' };
// a beam as a matchstick: ink edge stroke, then the oak body shifted by MIS (off-register), optional char
function beam(g, a, b, w, { col = OAK.M, char = 0, line = P.ink, lw = 1.6, ember = 0, t = 0 } = {}) {
  if (w < 0.6) { g.strokeStyle = mix(col, OAK.char, char); g.lineWidth = Math.max(0.8, w); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); return; }
  g.lineCap = 'butt';
  g.strokeStyle = line; g.lineWidth = w + lw * 2; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  g.save(); g.translate(MIS[0] * 0.5, MIS[1] * 0.5); g.strokeStyle = mix(col, OAK.char, char); g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  if (w > 5) { g.strokeStyle = rgba(char > 0.5 ? P.emberL : P.paper, char > 0.5 ? 0.35 + 0.3 * ember : 0.45); g.lineWidth = Math.max(1, w * 0.18); const nx = (b[1] - a[1]), ny = -(b[0] - a[0]), L = Math.hypot(nx, ny) || 1, o = w * 0.28;
    g.beginPath(); g.moveTo(a[0] - nx / L * o, a[1] - ny / L * o); g.lineTo(b[0] - nx / L * o, b[1] - ny / L * o); g.stroke(); }
  if (ember > 0.05 && w > 3) { g.strokeStyle = P.ember; g.lineWidth = Math.max(1, w * 0.12); g.setLineDash([w * 0.8, w * 1.4]); g.lineDashOffset = -twos(t) * 20; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.setLineDash([]); }
  g.restore();
}
// FIGURE: a small faceless firefighter (bible §6.4b proportions, dial head) in a brass helmet. pose angles in degrees
// (0 = limb hanging down, 90 = pointing forward). Without the new options it draws exactly as before (one-piece limbs).
// Articulation (additive): foreF / foreB = elbow bend (deg, + folds the forearm up/forward); kneeF / kneeB = knee bend
// (deg, + folds the shin back); handF / handB = [x, y] stage targets solved with 2-bone IK (they override armF/armB/fore*);
// tank (true: brass air cylinder on the back), coat (body colour), hands (true: glove dots), held = (g, hx, hy) drawn at the
// front hand after the front arm (in stage space).
export function figure(g, x, y, h, o = {}) {
  const { lean = 0, armF = 20, armB = -20, legF = 8, legB = -8, face = 1, col = P.ink70, band = P.brassL, helmet = P.brass, lw = Math.max(1.4, h / 60), carry = null, glint = 0,
    foreF = null, foreB = null, kneeF = null, kneeB = null, handF = null, handB = null, tank = false, hands = null, held = null } = o;
  const hd = h * 0.135, bh = h * 0.36, bw = h * 0.17, legL = h * 0.42, armL = bh * 0.8, big = h >= 220 && (o.foreF != null || o.handF || o.kneeF != null);
  const artic = foreF != null || foreB != null || handF || handB || kneeF != null || kneeB != null;
  g.save(); g.translate(x, y); g.scale(face, 1);
  g.save(); g.fillStyle = 'rgba(11,20,38,0.18)'; g.beginPath(); g.ellipse(4, 0, bw * 1.2, bw * 0.25, 0, 0, TAU); g.fill(); g.restore();
  const limb = (px, py, ang, len, w, c) => { g.save(); g.translate(px, py); g.rotate(-ang * D); pen(g, pill(0, len / 2 - w / 2, w, len), { fill: c, lw, breaks: false, highlight: false, mis: [1.5, 1] }); g.restore(); };
  // a two-segment limb: upper along `ang`, lower along `ang + bend` (deg); returns the end point (local)
  const limb2 = (px, py, ang, len, w, c, bend, w2 = w * 0.9) => {
    const a1 = ang * D, l1 = len * 0.52, ex = px + Math.sin(a1) * l1, ey = py + Math.cos(a1) * l1, a2 = (ang + bend) * D, l2 = len * 0.5;
    limb(px, py, ang, l1 + w * 0.3, w, c); limb(ex, ey, ang + bend, l2 + w2 * 0.3, w2, c);
    g.save(); g.fillStyle = c; g.beginPath(); g.arc(ex + 0.8, ey + 0.6, w * 0.47, 0, TAU); g.fill(); g.restore();
    const end = [ex + Math.sin(a2) * l2, ey + Math.cos(a2) * l2];
    if (big) { const bx = ex + (end[0] - ex) * 0.6, by2 = ey + (end[1] - ey) * 0.6; g.save(); g.translate(bx, by2); g.rotate(-(ang + bend) * D); g.fillStyle = band; g.fillRect(-w2 * 0.5, -w2 * 0.16, w2, w2 * 0.32); g.restore(); }
    return end;
  };
  const boot = (p, ang) => { if (!big || !p) return; g.save(); g.translate(p[0], p[1]); pen(g, rrect(-bw * 0.2, -bw * 0.2, bw * 0.62, bw * 0.34, bw * 0.12), { fill: P.ink, lw, breaks: false, highlight: false, mis: [1.5, 1] }); g.restore(); };
  // 2-bone IK in the body frame: shoulder (sx, sy) -> target (tx, ty); the elbow bends down
  const ik = (sx, sy, tx, ty, len) => { const a = len * 0.52, b = len * 0.5; let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const dm = (a + b) * 0.995;
    if (d > dm) { dx *= dm / d; dy *= dm / d; d = dm; } d = Math.max(d, Math.abs(a - b) + 1);
    const base = Math.atan2(dx, dy), al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)), u = base - al;
    const ex = sx + Math.sin(u) * a, ey = sy + Math.cos(u) * a, f = Math.atan2(sx + dx - ex, sy + dy - ey);
    return [u / D, (f - u) / D]; };
  // stage point -> body frame (after translate(x, y), scale(face, 1), translate(0, -legL), rotate(lean))
  const toBody = ([tx, ty]) => { const lx = (tx - x) * face, ly = ty - y + legL, c = Math.cos(-lean * D), s2 = Math.sin(-lean * D); return [lx * c - ly * s2, lx * s2 + ly * c]; };
  const shB = [-bw * 0.1, -bh * 0.88], shF = [bw * 0.15, -bh * 0.88];
  let aB = armB, fB = foreB, aF = armF, fF = foreF;
  if (handB) { const [tx, ty] = toBody(handB); [aB, fB] = ik(shB[0], shB[1], tx, ty, armL); }
  if (handF) { const [tx, ty] = toBody(handF); [aF, fF] = ik(shF[0], shF[1], tx, ty, armL); }
  const dark = mix(col, P.ink, 0.35), showHands = hands ?? artic;
  const glove = (p) => { if (!showHands) return; g.save(); g.fillStyle = P.ink; g.beginPath(); g.arc(p[0], p[1], bw * (big ? 0.24 : 0.2), 0, TAU); g.fill(); if (big) { g.fillStyle = band; g.fillRect(p[0] - bw * 0.2, p[1] - bw * 0.04, bw * 0.4, bw * 0.06); } g.restore(); };
  if (kneeB != null) boot(limb2(-bw * 0.15, -legL, legB, legL + 2, bw * 0.42, dark, -kneeB, bw * 0.38)); else limb(-bw * 0.15, -legL, legB, legL + 2, bw * 0.42, dark);
  g.save(); g.translate(0, -legL); g.rotate(lean * D);
  if (tank) pen(g, rrect(-bw * 0.86, -bh * 0.92, bw * 0.42, bh * 0.66, bw * 0.2), { fill: P.brass, lw, breaks: false, highlight: false, mis: [1.5, 1], shade: 0.4, shadeColor: P.brassD, box: [-bw * 0.95, -bh * 0.92, -bw * 0.53, -bh * 0.26] });
  if (fB != null) glove(limb2(shB[0], shB[1], aB, armL, bw * 0.34, dark, fB)); else limb(shB[0], shB[1], armB, armL, bw * 0.34, dark);
  pen(g, rrect(-bw / 2, -bh, bw, bh + 2, bw * 0.3), { fill: col, lw, breaks: false, highlight: false, mis: [1.5, 1] });
  g.fillStyle = band; g.fillRect(-bw / 2 + 1, -bh * 0.42, bw - 2, Math.max(1.5, h * 0.025)); g.fillRect(-bw / 2 + 1, -bh * 0.18, bw - 2, Math.max(1.5, h * 0.025));
  if (artic) { g.strokeStyle = P.ink; g.lineWidth = Math.max(1, lw * 0.6); g.beginPath(); g.moveTo(0, -bh * 0.95); g.lineTo(0, -bh * 0.05); g.stroke(); } // coat placket
  if (big) { pen(g, rrect(-bw * 0.42, -bh * 1.04, bw * 0.84, bh * 0.14, bw * 0.06), { fill: mix(col, P.ink, 0.3), lw: lw * 0.8, breaks: false, highlight: false, mis: [1, 1] }); // collar
    if (tank) { g.strokeStyle = P.ink; g.lineWidth = Math.max(2, bw * 0.08); g.beginPath(); g.moveTo(-bw * 0.45, -bh * 0.9); g.lineTo(bw * 0.4, -bh * 0.45); g.stroke(); } // harness strap
    pen(g, rrect(-bw / 2, -bh * 0.08, bw, bh * 0.2, bw * 0.08), { fill: mix(col, P.ink, 0.15), lw: lw * 0.8, breaks: false, highlight: false, mis: [1, 1] }); } // coat hem
  // dial head + brass helmet (dome, crest, neck flap)
  const hy = -bh - hd * 0.75;
  pen(g, circle(bw * 0.05, hy, hd * 0.62), { fill: P.card, lw, breaks: false, highlight: false, mis: [1, 1] });
  g.fillStyle = P.ink; g.fillRect(bw * 0.05 - hd * 0.05, hy, hd * 0.55, Math.max(1.2, h * 0.018));
  pen(g, (gg) => { gg.beginPath(); gg.arc(bw * 0.05, hy + hd * 0.05, hd * 0.75, Math.PI * 1.02, Math.PI * 1.98); gg.lineTo(bw * 0.05 + hd * 0.85, hy + hd * 0.1); gg.lineTo(bw * 0.05 - hd * 0.85, hy + hd * 0.1); gg.closePath(); }, { fill: helmet, lw, breaks: false, highlight: false, mis: [1, 1] });
  g.fillStyle = P.ink; g.fillRect(bw * 0.05 - hd * 0.8, hy + hd * 0.1, hd * 0.55, hd * 0.5);
  if (glint) { g.strokeStyle = P.paper; g.lineWidth = Math.max(1, h / 90); g.beginPath(); g.arc(bw * 0.05, hy + hd * 0.05, hd * 0.55, Math.PI * 1.15, Math.PI * 1.4); g.stroke(); }
  if (fF != null) glove(limb2(shF[0], shF[1], aF, armL, bw * 0.34, col, fF)); else limb(shF[0], shF[1], armF, armL, bw * 0.34, col);
  if (carry) carry(g, bw * 0.15 + Math.sin(armF * D) * bh * 0.8, -bh * 0.88 + Math.cos(armF * D) * bh * 0.8);
  g.restore();
  if (kneeF != null) boot(limb2(bw * 0.15, -legL, legF, legL + 2, bw * 0.42, col, -kneeF, bw * 0.38)); else limb(bw * 0.15, -legL, legF, legL + 2, bw * 0.42, col);
  g.restore();
  if (held && handF) held(g, handF[0], handF[1]);
}
// a bell (classic profile), mouth diameter d, top of crown at (cx, ty); brass with lamp-side halftone shade
export function bellPath(cx, ty, d) {
  return (g) => { const r = d / 2; g.beginPath(); g.moveTo(cx - r * 0.42, ty + d * 0.1);
    g.quadraticCurveTo(cx - r * 0.5, ty, cx, ty); g.quadraticCurveTo(cx + r * 0.5, ty, cx + r * 0.42, ty + d * 0.1);
    g.bezierCurveTo(cx + r * 0.62, ty + d * 0.18, cx + r * 0.6, ty + d * 0.5, cx + r * 0.78, ty + d * 0.68); g.quadraticCurveTo(cx + r * 0.95, ty + d * 0.8, cx + r, ty + d * 0.84);
    g.lineTo(cx - r, ty + d * 0.84); g.quadraticCurveTo(cx - r * 0.95, ty + d * 0.8, cx - r * 0.78, ty + d * 0.68); g.bezierCurveTo(cx - r * 0.6, ty + d * 0.5, cx - r * 0.62, ty + d * 0.18, cx - r * 0.42, ty + d * 0.1); g.closePath(); };
}
function bell(g, cx, ty, d, { fill = P.brass, shadeCol = P.brassD, line = P.ink, lw = 2.5, tilt = 0, red = false } = {}) {
  g.save(); g.translate(cx, ty); g.rotate(tilt * D); g.translate(-cx, -ty);
  pen(g, bellPath(cx, ty, d), { fill: red ? P.red : fill, line, lw, shadow: true, shade: (x) => clamp(0.08 + 0.55 * ((x - (cx - d / 2)) / d) ** 1.4), shadeColor: red ? P.redD : shadeCol, box: [cx - d / 2, ty, cx + d / 2, ty + d * 0.84], highlight: true });
  g.strokeStyle = line; g.lineWidth = Math.max(1.2, lw * 0.6); g.beginPath(); for (const v of [0.22, 0.62, 0.72]) { const w = v < 0.5 ? d * 0.26 : d * (0.38 + (v - 0.6) * 0.9); g.moveTo(cx - w, ty + d * v); g.lineTo(cx + w, ty + d * v); } g.stroke();
  pen(g, circle(cx, ty + d * 0.84, d * 0.07), { fill: P.ink70, line, lw: 1.5, breaks: false, highlight: false }); // clapper ball
  g.restore();
}

// ================================================================= SET: forest (the oak roof frame, looking down the attic)
async function forest(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const N = 20, VPx = p.vpx ?? 990, VPy = p.vpy ?? 500, S0 = p.scale ?? 128, eye = 4.0, Z = (k) => 1 + k * 0.42;
  const PR = (x, y, z) => [VPx + x * S0 / z, VPy - (y - eye) * S0 / z];
  const TR = [[[-6, 0], [0, 10], 0.42], [[6, 0], [0, 10], 0.42], [[-6, 0.4], [6, 0.4], 0.4], [[0, 0.4], [0, 10], 0.32], [[-2.6, 6], [2.6, 6], 0.28], [[-1.2, 8.2], [1.2, 8.2], 0.22],
    [[0, 1.8], [-3.4, 4.3], 0.24], [[0, 1.8], [3.4, 4.3], 0.24], [[-4.4, 0.4], [-4.4, 2.7], 0.2], [[4.4, 0.4], [4.4, 2.7], 0.2]];
  const r0 = M.rng(19); const fall = Array.from({ length: N }, () => TR.map(() => [r0() * 3 - 1.5, 0.15 + r0() * 0.6, r0() * 0.5, r0()]));
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); applyCam(g, s, camAt(p, t), t); g.clearRect(-200, -200, 2400, 1500);
    const fire = anim(p, 'fire', t, 0.6), collapse = anim(p, 'collapse', t, 0), charA = p.char ?? 1;
    const burn = (k) => clamp((fire * (N + 3) - (N - 1 - k)) / 3), col = (k) => clamp((collapse * (N + 4) - (N - 1 - k)) / 3) * (burn(k) > 0.6 ? 1 : 0);
    const zF = Z(N + 1), far = '#2a2120';
    // roof underside (boards running to the vanishing point) fills the frame; the far gable end glows when burning
    g.fillStyle = mix(OAK.D, far, 0.55); g.fillRect(-200, -200, 2400, 1500);
    const fz = Z(Math.max(0, N - 1 - fire * (N + 3)));
    // the roof slopes nearest us: laths running to the vanishing point, crossed by big near rafters (the frame fills the picture)
    g.save(); g.lineCap = 'butt';
    for (let i = 1; i < 26; i++) { const v = i / 26; for (const sx of [-1, 1]) { const x = sx * 6 * (1 - v), y = 10 * v; g.strokeStyle = rgba(P.ink, 0.55); g.lineWidth = 3; g.beginPath(); g.moveTo(...PR(x, y, 0.32)); g.lineTo(...PR(x, y, Z(N))); g.stroke();
      g.strokeStyle = rgba(OAK.M, 0.35); g.lineWidth = 2; g.beginPath(); g.moveTo(...PR(x, y - 0.12, 0.32)); g.lineTo(...PR(x, y - 0.12, Z(N))); g.stroke(); } }
    g.restore();
    // far end: the burning gable (glow rings) or dark
    const fe = [PR(-6, 0, zF), PR(0, 10, zF), PR(6, 0, zF)];
    if (fire > 0.02) glowRings(g, VPx, VPy - 20, 260, clamp(0.3 + fire), t, 7, far, 120);
    // the vault extrados = the floor: stone card, ribs as humps, a plank walkway to the vanishing point
    const fl = [PR(-6, 0, zF), PR(6, 0, zF), PR(6, 0, 0.3), PR(-6, 0, 0.3)];
    pen(g, poly(fl), { fill: mix('#cfc2a8', P.ember, 0.12 * fire), line: P.ink, lw: 2, breaks: false, highlight: false, shade: (x, y) => clamp(0.05 + (y - VPy) / 2200), shadeColor: '#8d7d68', box: [-200, VPy, 2200, 1100] });
    g.save(); poly(fl)(g); g.clip();
    for (let k = 0; k < N + 2; k += 1) { const z = Z(k) + 0.19, a = PR(-6, 0, z), b = PR(6, 0, z), m = PR(0, 1.3, z);
      g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(m[0], m[1] - (b[1] - m[1]) * 0.6, ...b); g.strokeStyle = P.ink70; g.lineWidth = Math.max(1, 3 / z); g.stroke();
      g.beginPath(); g.moveTo(...PR(-3, 0, z - 0.19)); g.quadraticCurveTo(...PR(-3, 1.4, z), ...PR(-3, 0, z + 0.19)); g.moveTo(...PR(3, 0, z - 0.19)); g.quadraticCurveTo(...PR(3, 1.4, z), ...PR(3, 0, z + 0.19)); g.lineWidth = Math.max(1, 2 / z); g.strokeStyle = rgba(P.ink70, 0.7); g.stroke(); }
    for (const x of [-0.5, 0.5]) { beam(g, PR(x, 0.15, 0.32), PR(x, 0.15, zF), 6, { col: OAK.L, lw: 1.2 }); }
    // debris caught by the vault: charred timbers + lead drips on the floor near collapsed trusses
    const dr = M.rng(41);
    for (let k = N - 1; k >= 0; k--) { const c = col(k); if (c < 0.3) continue; for (let i = 0; i < 9; i++) { const z = Z(k) + dr() * 0.5 - 0.1, x = dr() * 10 - 5; const a = PR(x, 0.3, z), b = PR(x + dr() * 3 - 1.5, 0.25, z + dr() * 0.4);
      if (dr() < c * (p.debris ?? 1)) beam(g, a, b, 0.35 * S0 / z, { col: OAK.D, char: 1, ember: 1, t }); } }
    g.restore();
    // long members: ridge, purlins, wall plates (lines to the vanishing point)
    const longs = [[0, 10], [-2, 6.7], [2, 6.7], [-4, 3.3], [4, 3.3], [-6, 0.2], [6, 0.2]];
    // trusses + common rafters, far to near
    for (let k = N - 1; k >= 0; k--) {
      const z = Z(k), b = burn(k), c = col(k), ch = clamp(b * 1.4 - 0.25) * charA, hz = clamp((z - 1) / 7);
      // the fire wall: where the front stands, the attic section behind it is a posterised wall of fire-lit smoke (flat card, 3 steps)
      if (b > 0.85 && burn(k - 1) <= 0.85 && k > 0) { const sec = (sc) => [PR(-6 * sc, 0.2, z + 0.05), PR(0, 0.2 + 9.8 * sc, z + 0.05), PR(6 * sc, 0.2, z + 0.05)];
        [[1, P.emberD], [0.78, P.ember], [0.5, P.emberL]].forEach(([sc, cc]) => { poly(deckle(sec(sc), 60 + k, 4, 16))(g); g.fillStyle = cc; g.fill(); });
        embers(g, PR(-6, 0, z)[0], PR(0, 0, z)[1], PR(6, 0, z)[0] - PR(-6, 0, z)[0], 10 * S0 / z, t, { n: 30, seed: 3 + k, size: 4 }); }
      const tone = (cc) => mix(cc, b > 0.2 ? '#7a4a30' : far, hz * 0.55);
      // common rafters between this truss and the next (the matchstick lattice)
      if (k === 0) for (let j = 0; j < 4; j++) { const zz = 0.45 + j * 0.13; for (const sx of [-1, 1]) beam(g, PR(sx * 6, 0, zz), PR(0, 10, zz), 0.2 * S0 / zz, { col: OAK.M, lw: 2 }); }
      if (c < 0.5) for (let j = 1; j < 4; j++) { const zz = z + j * 0.095; for (const sx of [-1, 1]) beam(g, PR(sx * 6, 0, zz), PR(0, 10, zz), 0.16 * S0 / zz, { col: tone(OAK.M), char: ch, line: P.ink, lw: 1 }); }
      if (k === N - 1 || k % 1 === 0) for (const [x, y] of longs) { if (c > 0.5 && y > 1) continue; beam(g, PR(x, y, z), PR(x, y, Z(k + 1)), 0.25 * S0 / z, { col: tone(OAK.M), char: ch, lw: 1.2 }); }
      TR.forEach(([a, bb, w], i) => { const fl2 = fall[k][i];
        const A = c ? [lerp(a[0], a[0] + fl2[0], c), lerp(a[1], fl2[1], M.E.inQuad(c)), z + fl2[2] * c] : [a[0], a[1], z];
        const B = c ? [lerp(bb[0], bb[0] + fl2[0] * 1.3, c), lerp(bb[1], fl2[1] + 0.2, M.E.inQuad(c)), z + fl2[2] * c * 0.6] : [bb[0], bb[1], z];
        beam(g, PR(...A), PR(...B), w * S0 / z, { col: tone(i < 2 ? OAK.M : OAK.L), char: ch, ember: b, t, lw: Math.max(1, 2.2 / z) }); });
      if (b > 0.05 && c < 0.8) for (let j = 0; j < 6; j++) { const u = (j + 0.5) / 6, side = j % 2 ? 1 : -1, x = side * 6 * (1 - u), y = 10 * u;
        const [px, py] = PR(x, y, z); flame(g, px, py + 0.3 * S0 / z, (0.6 + 0.9 * b * hash(k * 9 + j)) * S0 / z, 1.6 * S0 / z, t, k * 11 + j, { lw: Math.max(1, 2.2 / z), lean: 0.2 }); }
    }
    // smoke under the ridge, drifting toward us (layered puffs), embers, sparks
    for (let i = 0; i < 9; i++) { const a = fract(t * 0.05 + i / 9), z = lerp(Z(N), 1.6, a), [px, py] = PR((hash(i) - 0.5) * 2.4, 9.4 - hash(i + 3) * 1.2, z);
      puff(g, px, py, 0.75 * S0 / z, 300 + i * 13 + Math.floor(t * 0.05 + i / 9) * 7, { fill: mix('#7b7280', far, clamp(1 - a) * 0.6), shadeCol: '#3d3a44', line: a > 0.4 ? '#2a2830' : null, lw: 2, lit: P.emberD, litA: 0.6 * fire, shade: 0.5 }); }
    embers(g, 200, 1000, 1600, 900, t, { n: Math.round(30 + 80 * fire), seed: 9, size: 5 });
    // the one red thing: the fire front pin on the walkway
    if ((p.red ?? 'front') === 'front' && fire > 0.02) { const [rx, ry] = PR(0, 0.3, Math.max(0.9, fz - 0.3)); pen(g, circle(rx, ry, 10), { fill: P.red, lw: 2.5, breaks: false, highlight: false }); redRing(g, rx, ry, 20);
      if (p.labels !== false) tag(g, rx + 6, ry, rx + 140, ry + 120, p.frontLabel ?? 'The fire front', { size: 28, swing: 3, night: true, sub: p.frontSub ?? 'moving through the oak frame' }); }
    if (p.labels !== false) { const [ax, ay] = PR(-3.4, 4.3, Z(0)); tag(g, ax, ay, 150, 640, 'Oak trusses', { size: 30, swing: -3, night: true, sub: 'the attic called "the forest"' }); }
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock !== null) counterBadge(g, 96, 72, p.clock ?? '18:43', { t, night: true });
    fibre(g, 0.06); sourceSlip(g, p.source ?? 'ILLUSTRATION · SCHEMATIC ROOF FRAME · NOT TO SCALE');
  } };
}

// ================================================================= SET: spireFall (close on the crossing, night)
async function spireFall(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const k = p.k ?? 11.5, ox = p.ox ?? 960 - 66 * k, oy = p.oy ?? 1080 + 14 * k; // ground below frame: we see ~14..100 m
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot);
    const u = p.at != null ? range(t, p.at, p.at + (p.dur ?? 4)) : (p.u ?? 0.5);
    const imp = 0.74, hit = clamp((u - imp) / (1 - imp)), sh = (p.shake !== false && u > imp && hit < 0.25) ? (1 - hit / 0.25) : 0;
    const cam = camAt(p, t); cam.x += Math.sin(t * 93) * 12 * sh; cam.y += Math.cos(t * 71) * 10 * sh; applyCam(g, s, cam, t); g.clearRect(-200, -200, 2400, 1500);
    const X = (m) => ox + m * k, Y = (m) => oy - m * k;
    const st = { sky: 'night', fireS: fireSections(p.fire ?? 0.8), roofGone: 0.55, spire: 'falling', spireU: Math.min(u, 0.999), glow: 1, wind: p.wind ?? 0.9, smoke: p.smoke ?? 0.55, glowWin: true };
    backdrop(g, t, { sky: 'night', yH: Y(14), glow: 1, roofs: false });
    sideFire(g, X, Y, k, st, t, true);
    sideCard(g, ox, oy, k, { ...st, spire: 'gone-hidden' }, t);
    // the crossing: once struck, a torn hole through roof and vault reveals the nave below (paper torn, hatched edge)
    const hole = deckle([[X(58), Y(43)], [X(61), Y(36)], [X(66), Y(31.5)], [X(71), Y(35.5)], [X(74), Y(43)]], 23, 4, 10);
    if (hit > 0) { g.save(); poly(hole)(g); g.fillStyle = '#1a1416'; g.fill(); g.clip(); glowRings(g, X(66), Y(26), 7 * k, hit, t, 5, '#1a1416'); g.restore(); pen(g, poly(hole), { fill: null, line: P.ink, lw: 3 }); }
    sideFire(g, X, Y, k, { ...st, spire: 'gone-hidden' }, t, false);
    // the falling spire, clipped to (above the ridge) ∪ (the hole) once it passes through
    g.save(); g.beginPath(); g.rect(-200, -400, 2400, Y(43) + 400); if (hit > 0) hole.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, q[0], q[1])); g.clip();
    spire(g, X(ND.crossX), Y(ND.ridge), k, looks('night'), st, t); g.restore();
    // impact: paper dust burst (puff ring rising) + spark burst (brass flecks on ballistic arcs, short streaks not blur)
    if (hit > 0) {
      const ix = X(66), iy = Y(40), dustA = p.dust ?? 1;
      for (let i = 0; i < 11; i++) { const a = -Math.PI * (0.02 + 0.96 * i / 10), e = 1 - (1 - hit) ** 3, R = (30 + 300 * e) * (0.75 + hash(i) * 0.4);
        const px = ix + Math.cos(a) * R * 1.5, py = iy + Math.sin(a) * R * 0.75 - hit * 50, rr = (26 + 46 * e) * (0.7 + hash(i + 5) * 0.5) * dustA;
        puff(g, px, py, rr, 700 + i, { fill: mix(P.kraft, '#77707a', hit * 0.7), shadeCol: '#5a5048', line: P.ink, lw: 2, lit: P.emberL, litA: clamp(1 - hit * 1.5), shade: 0.45 }); }
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < Math.round(70 * (p.sparks ?? 1)); i++) { const a = -Math.PI * hash(i * 3.1) , v = 250 + hash(i * 7.7) * 650, tt = hit * 1.6, gx = Math.cos(a) * v * tt, gy = Math.sin(a) * v * tt + 520 * tt * tt;
        if (tt > 0.3 + hash(i) * 1.3) continue; const vx = Math.cos(a) * v, vy = Math.sin(a) * v + 1040 * tt, L = 0.03;
        g.strokeStyle = i % 3 ? P.emberL : P.brassL; g.lineWidth = 3 + hash(i) * 3; g.beginPath(); g.moveTo(ix + gx, iy + gy); g.lineTo(ix + gx - vx * L, iy + gy - vy * L); g.stroke(); }
      g.restore();
    }
    embers(g, X(30), Y(45), 75 * k, 50 * k, t, { n: 70, seed: 21, size: 5 });
    // the one red thing: the break point on the spire (before impact) -> the hole in the vault (after)
    if (u < imp) { const a1 = -M.E.inCubic(clamp(u / 0.55)) * 14 * D, bx = X(66) + Math.sin(-a1) * -15 * k, by = Y(43) - Math.cos(a1) * 15 * k; redRing(g, bx, by, 22); pen(g, circle(bx, by, 7), { fill: P.red, lw: 2, breaks: false, highlight: false }); }
    else { redRing(g, X(66), Y(38), 8 * k * (0.6 + 0.4 * hit), P.red, 3.5); }
    if (p.labels !== false) tag(g, X(70), Y(80), X(82), Y(88), u < imp ? 'Spire, 96 m' : 'Through the vault', { size: 32, swing: -2, night: true, sub: u < imp ? 'oak and lead, 1859' : 'at the crossing' });
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock !== null) counterBadge(g, 96, 72, p.clock ?? '19:50', { t, night: true });
    fibre(g, 0.06); sourceSlip(g, p.source ?? 'ILLUSTRATION · SPIRE FELL ~19:50 (AFP)');
  } };
}

// ================================================================= SET: bellFrame (the north tower opened like a paper toy)
// The eight north-tower bells (2013 set): name, kg. Mouth diameter drawn ∝ cube root of mass (Gabriel ≈ 1.85 m).
export const BELLS = [['Gabriel', 4162], ['Anne-Geneviève', 3477], ['Denis', 2502], ['Marcel', 1925], ['Étienne', 1494], ['Benoît-Joseph', 1309], ['Maurice', 1011], ['Jean-Marie', 782]];
// a card tower (oblique paper box): front face + right side face; the belfry door (front of the belfry stage) hinged on
// its left edge, opened by `open` (0..1 -> 0..155°), shows its hatched inside face past 90°.
function cardTower(g, x, y, w, h, { depth = 0.34, open = 0, night = false, belfryTop = 0.0, belfryBot = 0.52, inside = null, louvers = true, label = null, t = 0 } = {}) {
  const dx = w * depth * 0.8, dy = -w * depth * 0.42, L = looks(night ? 'night' : 'day');
  const side = [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]], top = [[x, y], [x + dx, y + dy], [x + w + dx, y + dy], [x + w, y]];
  pen(g, poly(side), { fill: L.stoneD, lw: 2.5, shade: 0.35, shadeColor: L.stoneDD, box: [x + w, y + dy, x + w + dx, y + h], shadow: true, shadowOff: [16, 14], shadowA: night ? 0.3 : 0.13 });
  pen(g, poly(top), { fill: L.stone, lw: 2.5, breaks: false, highlight: false });
  const front = [x, y, w, h];
  pen(g, rect(...front), { fill: L.stone, lw: 3, shade: lampShade([x, y, x + w, y + h], 0.03, 0.28, 0.5), shadeColor: L.stoneD, box: [x, y, x + w, y + h], shadow: true, shadowOff: [16, 14], shadowA: night ? 0.3 : 0.13 });
  g.save(); rect(...front)(g); g.clip(); g.strokeStyle = rgba(night ? '#5d554b' : P.ink40, 0.55); g.lineWidth = 1; g.beginPath(); for (let yy = y + 18; yy < y + h; yy += 18) { g.moveTo(x, yy); g.lineTo(x + w, yy); } g.stroke(); g.restore();
  // side-face windows (louvered lancets), stone courses
  for (const v of [0.18, 0.62]) { const sx = x + w + dx * v, sw = dx * 0.26, sy = y + dy * v + h * 0.06; pen(g, poly([[sx, sy + h * 0.4], [sx, sy + 20], [sx + sw / 2, sy], [sx + sw, sy + 20 + dy * 0.26 * 0.0], [sx + sw, sy + h * 0.4 + dy * 0.1]]), { fill: night ? '#2c2a30' : P.ink70, lw: 1.5, breaks: false, highlight: false }); }
  const by0 = y + h * belfryTop + 26, by1 = y + h * belfryBot, bx0 = x + 22, bx1 = x + w - 22;
  // the opening: inside the belfry (dark back wall, halftone), then the inside scene, then the door leaf
  const th = clamp(open) * 155 * D;
  if (open > 0.01) {
    pen(g, rect(bx0, by0, bx1 - bx0, by1 - by0), { fill: night ? '#2a2326' : OAK.D, lw: 2.5, breaks: false, highlight: false, shade: 0.5, shadeColor: night ? '#120e10' : '#4d3a28', box: [bx0, by0, bx1, by1] });
    g.save(); rect(bx0, by0, bx1 - bx0, by1 - by0)(g); g.clip(); if (inside) inside(g, bx0, by0, bx1, by1); g.restore();
  }
  const dw = (bx1 - bx0) * Math.cos(th), dsk = -(bx1 - bx0) * Math.sin(th) * 0.22;
  const leaf = [[bx0, by0], [bx0 + dw, by0 + dsk], [bx0 + dw, by1 + dsk], [bx0, by1]];
  const inner = th > Math.PI / 2;
  pen(g, poly(leaf), { fill: inner ? L.stoneD : L.stone, lw: 2.5, breaks: false, highlight: false, hatched: inner, hatchColor: P.ink40, box: [Math.min(bx0, bx0 + dw), by0 + Math.min(0, dsk), Math.max(bx0, bx0 + dw), by1 + Math.max(0, dsk)], shadow: open > 0.05, shadowOff: [10, 8] });
  if (!inner && louvers) { // the two tall louvered lancets on the closed/opening leaf (scaled with the leaf)
    for (const v of [0.27, 0.73]) { const cxv = bx0 + dw * v, lw2 = Math.abs(dw) * 0.3, top2 = by0 + 40 + dsk * v, bot = by1 - 30 + dsk * v;
      if (lw2 < 4) continue; const pts = archPts(cxv, bot, lw2, top2 + lw2 * 0.8, lw2 * 0.8, 6);
      pen(g, poly(pts), { fill: night ? '#2c2a30' : P.ink70, lw: 2, breaks: false, highlight: false });
      g.save(); poly(pts)(g); g.clip(); g.strokeStyle = night ? '#7d7266' : P.ink40; g.lineWidth = 2; g.beginPath(); for (let yy = top2; yy < bot; yy += 13) { g.moveTo(cxv - lw2, yy); g.lineTo(cxv + lw2, yy + 6); } g.stroke(); g.restore(); }
  }
  if (inner && Math.abs(dw) > 30) { // the printed inside of a paper toy: glue tabs, fold marks, assembly letters
    const lx = (v, w2) => [bx0 + dw * v, by0 + dsk * v + w2];
    g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.setLineDash([9, 6]);
    for (const v of [0.08, 0.92]) { const [ax, ay] = lx(v, 10), [bx, byy] = lx(v, by1 - by0 - 10); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, byy); g.stroke(); }
    g.restore();
    for (const v of [0.25, 0.5, 0.75]) { const [ax, ay] = lx(0.96, (by1 - by0) * v - 30); pen(g, poly([[ax, ay], [ax + Math.sign(dw) * 26, ay + 10], [ax + Math.sign(dw) * 26, ay + 50], [ax, ay + 60]]), { fill: P.kraft, lw: 1.5, breaks: false, highlight: false }); }
    const [mx, my] = lx(0.5, (by1 - by0) * 0.45); mono(g, 'GLUE TAB B', mx, my, 18, P.ink70, 'center'); mono(g, 'FOLD', mx, my + 40, 18, P.ink70, 'center');
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; const [cx3, cy3] = lx(0.5, (by1 - by0) * 0.75); g.beginPath(); g.arc(cx3, cy3, 34, 0, TAU); g.stroke(); g.font = '700 40px "Archivo Narrow"'; g.fillStyle = P.ink70; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', cx3, cy3 + 2); g.restore();
  }
  // hinge knuckles (brass) on the left edge: this opens
  for (const v of [0.15, 0.5, 0.85]) pen(g, rrect(bx0 - 7, by0 + (by1 - by0) * v - 13, 14, 26, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(bx0, by0 - 10); g.lineTo(bx0, by1 + 10); g.stroke(); g.restore();
  // top balustrade + pinnacles
  pen(g, rect(x - 6, y - 26, w + 12, 26), { fill: L.stoneD, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5; for (let q = 0; q < Math.floor(w / 26); q++) { g.beginPath(); g.arc(x + 13 + q * 26, y - 13, 7, 0, TAU); g.stroke(); } g.restore();
  for (const cx of [x, x + w]) pen(g, poly([[cx - 9, y - 26], [cx, y - 64], [cx + 9, y - 26]]), { fill: L.stoneD, lw: 2, breaks: false, highlight: false });
  return { bx0, by0, bx1, by1, dx, dy };
}
// the wooden bell frame (beffroi) with the 8 bells in two tiers. Returns nothing; draws inside the opening box
function bellFrameInside(g, x0, y0, x1, y1, o) {
  const { char = 0, flame: fl = 0, redBell = -1, slip = 0, t = 0, weights = true, swing = 0 } = o;
  const W = x1 - x0, H = y1 - y0, px = W / 13.5; // px per metre inside the 12 m belfry
  const tiers = [[0, 4, y0 + H * 0.52], [4, 8, y0 + H * 0.06]]; // [from, to, headstock y]
  const sill = y1 - H * 0.07;
  // frame: posts, sills, braces (the bottom sill is the lower beam that chars)
  const posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(v => x0 + W * v);
  for (const xx of posts) beam(g, [xx, y0 + 4], [xx, sill], 0.35 * px, { col: OAK.M, lw: 1.6 });
  for (const [, , hy] of tiers) beam(g, [x0, hy], [x1, hy], 0.32 * px, { col: OAK.M, lw: 1.6 });
  beam(g, [x0, y0 + H * 0.47], [x1, y0 + H * 0.47], 0.3 * px, { col: OAK.M, lw: 1.6 });
  for (let i = 0; i < 4; i++) { const a = posts[i], b = posts[i + 1];
    beam(g, [a, y0 + H * 0.47], [b, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 }); beam(g, [b, y0 + H * 0.47], [a, y0 + H * 0.1], 0.2 * px, { col: OAK.L, lw: 1.2 });
    beam(g, [a, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: OAK.L, lw: 1.2, char: char * 0.6 }); beam(g, [b, sill], [(a + b) / 2, y0 + H * 0.56], 0.2 * px, { col: OAK.L, lw: 1.2, char: char * 0.6 }); }
  // the lower beam: chars to soot with ember cracks; flames lick it
  beam(g, [x0 - 10, sill], [x1 + 10, sill], 0.55 * px, { col: OAK.M, char, ember: char, t, lw: 2 });
  if (char > 0.2) { g.save(); g.strokeStyle = P.emberL; g.lineWidth = 2; const r = M.rng(7); g.beginPath(); for (let i = 0; i < 9; i++) { let xx = x0 + r() * W, yy = sill - 0.2 * px; g.moveTo(xx, yy); for (let j = 0; j < 3; j++) { xx += (r() - 0.5) * 18; yy += 0.15 * px; g.lineTo(xx, yy); } } g.stroke(); g.restore(); }
  if (fl > 0.02) { g.save(); g.fillStyle = rgba(P.ember, 0.22 * fl); g.fillRect(x0, sill - 1.6 * px, W, 1.6 * px + 20); g.restore(); for (let i = 0; i < 4; i++) flame(g, x0 + W * (i + 0.3 + 0.4 * hash(i + 2)) / 4, y1 + 6, (1.0 + 1.9 * fl * (0.6 + hash(i) * 0.6)) * px, 2.6 * px, t, 50 + i, { lw: 2, lean: 0.15 }); }
  // bells: largest four on the lower tier, smaller four above; each on a headstock with brass gudgeon pins
  BELLS.forEach(([name, kg], i) => {
    const tier = i < 4 ? tiers[0] : tiers[1], j = i % 4, cx = (posts[j] + posts[j + 1]) / 2, d = 1.85 * Math.cbrt(kg / 4162) * px * 1.3;
    const hy = tier[2], isRed = i === redBell, sl = isRed ? slip : 0;
    const sw = Math.sin(t * 2.2 + i) * swing;
    beam(g, [cx - d * 0.7, hy + 0.35 * px], [cx + d * 0.7, hy + 0.35 * px], 0.4 * px, { col: OAK.D, lw: 1.5, char: i < 4 ? char * 0.4 : 0 });
    for (const sx of [-1, 1]) pen(g, circle(cx + sx * d * 0.62, hy + 0.35 * px, Math.max(3, 0.12 * px)), { fill: P.brassL, lw: 1.5, breaks: false, highlight: false });
    bell(g, cx + sl * d * 0.5, hy + 0.55 * px + sl * sl * 2.6 * px, d, { tilt: sw + sl * 34, red: isRed, lw: 2.5 });
    if (isRed) redRing(g, cx + sl * d * 0.5, hy + 0.55 * px + d * 0.42 + sl * sl * 2.6 * px, d * 0.72, P.red, 3);
    if (weights) { const lab = kg >= 1000 ? `${(kg / 1000).toFixed(1)} T` : `${kg} KG`; g.save(); g.font = '600 15px "Plex Mono"'; g.letterSpacing = '1.5px'; const tw = g.measureText(lab).width + 10; g.restore();
      pen(g, rect(cx - tw / 2, hy + 0.55 * px + d * 0.9 + 6, tw, 22), { fill: P.card, lw: 1.2, breaks: false, highlight: false });
      mono(g, lab, cx, hy + 0.55 * px + d * 0.9 + 23, 15, P.ink, 'center', 600); }
  });
}
async function bellFrame(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const sky = p.sky ?? 'dusk', night = sky !== 'day';
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); applyCam(g, s, camAt(p, t), t); g.clearRect(-200, -200, 2400, 1500);
    const open = anim(p, 'open', t, 1), char = anim(p, 'char', t, 0.5), fl = anim(p, 'flame', t, 0.6), slip = anim(p, 'slip', t, 0), dom = anim(p, 'domino', t, 0);
    const pair = p.layout === 'pair' || dom > 0 || p.chain;
    const yG = pair ? 800 : 1120; // pair: towers shortened + lowered so the opened door (it swings out left) clears the counter badge
    backdrop(g, t, { sky, yH: yG + 30, glow: night ? 0.7 : 0, roofs: true, seed: 33 });
    if (night) glowRings(g, pair ? 860 : 900, pair ? 470 : 520, 300, 0.9, t, 4, SKY[sky]?.[1] ?? P.night, 300);
    const inside = (gg, x0, y0, x1, y1) => bellFrameInside(gg, x0, y0, x1, y1, { char, flame: fl, redBell: p.redBell ?? 2, slip, t, weights: p.weights !== false, swing: p.swing ?? 0 });
    if (!pair) {
      // one big north tower: the belfry stage fills the frame; the roof fire glows behind
      plume(g, 1450, 640, t, { H: 600, W: 70, n: 10, drift: 0.4, seed: 4, depth: 0.5, sky: SKY[sky]?.[1] ?? P.paper, base: night ? '#8b8790' : P.card, shadeCol: night ? '#4a4652' : P.ink40, lit: P.emberL, amount: 1 });
      cardTower(g, 520, 150, 760, 1100, { open, night, belfryTop: 0.0, belfryBot: 0.66, inside, t });
      tallyCrowd(g, 20, 420, 1060, t, { col: night ? '#5f7d79' : P.sage, sc: 1.1, seed: 2 });
    } else {
      // the pair: north tower (opened) leans into the south tower; the gallery between them cracks
      const a1 = M.E.inCubic(clamp(dom / 0.6)) * 7, a2 = M.E.inCubic(clamp((dom - 0.45) / 0.55)) * 4;
      const nx = p.nx ?? 640, sx = nx + 630, tw = 380, th = 560, ty = yG - th;
      plume(g, 1500, 560, t, { H: 520, W: 60, n: 10, drift: 0.4, seed: 4, depth: 0.5, sky: SKY[sky]?.[1] ?? P.paper, base: night ? '#8b8790' : P.card, shadeCol: night ? '#4a4652' : P.ink40, lit: P.emberL, amount: 1 });
      // gallery between towers (cracks open as the north tower leans)
      pen(g, rect(nx + tw, ty + th * 0.55, sx - nx - tw, th * 0.45), { fill: looks(sky).stoneD, lw: 2.5, breaks: false, highlight: false, shade: 0.3, shadeColor: looks(sky).stoneDD, box: [nx + tw, ty + th * 0.55, sx, yG] });
      for (let i = 0; i < 7; i++) { const x0 = nx + tw + 14 + i * (sx - nx - tw - 28) / 7; pen(g, poly(archPts(x0 + 22, ty + th * 0.68, 34, ty + th * 0.6, 26, 4)), { fill: night ? '#2c2a30' : P.ink70, lw: 1.5, breaks: false, highlight: false }); }
      if (dom > 0.3) { g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); let xx = (nx + tw + sx) / 2, yy = ty + th * 0.56; g.moveTo(xx, yy); for (let j = 0; j < 6; j++) { xx += (hash(j) - 0.5) * 30; yy += 24 * clamp((dom - 0.3) * 3); g.lineTo(xx, yy); } g.stroke(); g.restore(); }
      g.save(); g.translate(sx + tw, yG); g.rotate(a2 * D); g.translate(-(sx + tw), -yG);
      cardTower(g, sx, ty, tw, th, { open: 0, night, belfryBot: 0.5, t });
      if (p.labels !== false) tag(g, sx + tw * 0.5, ty + th * 0.3, sx + tw * 0.62, ty - 150, 'South tower', { size: 28, swing: 2, night, sub: 'Emmanuel · 13 t' });
      g.restore();
      g.save(); g.translate(nx + tw, yG); g.rotate(a1 * D); g.translate(-(nx + tw), -yG);
      cardTower(g, nx, ty, tw, th, { open, night, belfryBot: 0.62, inside, t });
      g.restore();
      // ground, quay
      pen(g, rect(-40, yG, 2000, 40), { fill: night ? '#6d6156' : P.kraft, lw: 2.5, breaks: false, highlight: false });
      // the domino diagram: four cards that tip in sequence (frame → bells → north tower → south tower)
      if (p.chain !== false) { const labs = ['Oak frame', 'Bells', 'North tower', 'South tower'];
        labs.forEach((lb, i) => { const cx = 640 + i * 330, cy = yG + 118, ti = M.E.inCubic(clamp((dom - i * 0.2) / 0.25)) * 28;
          g.save(); g.translate(cx + 90, cy + 50); g.rotate(ti * D); g.translate(-(cx + 90), -(cy + 50));
          pen(g, rect(cx - 90, cy - 50, 180, 100), { fill: i === 3 ? P.card : P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.2, shadeColor: P.kraftD, box: [cx - 90, cy - 50, cx + 90, cy + 50] });
          g.save(); g.font = '600 30px "Archivo Narrow"'; g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lb, cx, cy - 6); g.restore(); mono(g, `STEP ${i + 1}`, cx, cy + 32, 15, P.ink70, 'center');
          g.restore(); if (i < 3) { g.save(); g.strokeStyle = night ? P.paper : P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 105, cy); g.lineTo(cx + 222, cy); g.lineTo(cx + 210, cy - 10); g.moveTo(cx + 222, cy); g.lineTo(cx + 210, cy + 10); g.stroke(); g.restore(); } });
      }
    }
    if (!pair && p.labels !== false) { tag(g, 1290, 780, 1420, 820, 'Lower beam', { size: 30, swing: 2, night, sub: char > 0.3 ? 'charring' : 'oak' }); tag(g, 1180, 300, 1380, 210, '8 bells', { size: 30, swing: -2, night, sub: '780 kg to 4.2 t' }); }
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock !== null) counterBadge(g, 96, 72, p.clock ?? '20:30', { t, night });
    fibre(g, night ? 0.06 : 0.09); sourceSlip(g, p.source ?? 'PAPER MODEL · BELL WEIGHTS: NOTRE-DAME DE PARIS, 2013 BELLS');
  } };
}

// ================================================================= SET: clock (two counter wheels and the +30 MIN mainspring)
const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + m; };
// odometer drums for minutes-of-day v (float): [H tens, H units, M tens, M units] as floats (carry rolls in the last unit)
function odo(v) { const c = (base) => clamp((v % base) - (base - 1)); const mU = v % 10, mT = Math.floor(v / 10) % 6 + c(10), h = v / 60;
  const hU = Math.floor(h) % 10 + clamp((v % 60) - 59), hT = Math.floor(h / 10) + clamp((v % 600) - 599); return [hT, hU % 10 + 0, mT, mU]; }
function drum(g, x, y, w, h, val, radix, { stripes = 0 } = {}) {
  pen(g, rrect(x, y, w, h, 6), { fill: P.card, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 6); g.clip();
  const f = val - Math.floor(val), d0 = Math.floor(val) % radix;
  g.font = `700 ${h * 0.78}px "Archivo Narrow"`; g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const k of [-1, 0, 1]) { const d = ((d0 + k) % radix + radix) % radix, yy = y + h / 2 + (k - f) * h * 1.0; g.fillText(String(d), x + w / 2 + 2, yy + 4); }
  if (stripes > 0.02) { g.strokeStyle = rgba(P.ink, 0.35 * stripes); g.lineWidth = 2; for (let yy = y + 6; yy < y + h; yy += 9) { g.beginPath(); g.moveTo(x + 8, yy); g.lineTo(x + w - 8, yy); g.stroke(); } }
  // drum curvature: halftone bands top and bottom (the drum turns away)
  halftone(g, [x, y, x + w, y + h], (xx, yy) => { const u = Math.abs((yy - y) / h - 0.5) * 2; return clamp((u - 0.55) * 1.4); }, P.kraftD, { pitch: 9 });
  g.restore();
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x, y, w, h, 6); g.stroke(); g.restore();
}
function counter(g, x, y, sc, v, { rolling = 0, label = '', sub = '', night = false, t = 0, flap = null } = {}) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  const W = 560, H = 250;
  for (const [gx, gy, r, n, sp] of [[W - 30, H - 10, 70, 16, 0.5], [40, H + 20, 46, 12, -0.8]]) pen(g, gearPath(gx, gy, r, n, t * sp), { fill: P.brass, lw: 2.5, shade: 0.45, shadeColor: P.brassD, box: [gx - r, gy - r, gx + r, gy + r], breaks: false });
  pen(g, rrect(0, 0, W, H, 18), { fill: P.brass, lw: 3, shadow: true, shadowOff: [14, 16], shade: lampShade([0, 0, W, H], 0.05, 0.5, 0.35), shadeColor: P.brassD, box: [0, 0, W, H] });
  pen(g, rrect(18, 18, W - 36, H - 36, 12), { fill: P.brassD, lw: 2, breaks: false, highlight: false });
  for (const [sx, sy] of [[34, 34], [W - 34, 34], [34, H - 34], [W - 34, H - 34]]) { pen(g, circle(sx, sy, 7), { fill: P.brassL, lw: 1.5, breaks: false, highlight: false }); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.stroke(); }
  const ds = odo(v), radix = [3, 10, 6, 10];
  ds.forEach((d, i) => drum(g, 52 + i * 112 + (i > 1 ? 40 : 0), 45, 96, 160, d, radix[i], { stripes: i === 3 ? rolling : i === 2 ? rolling * 0.4 : 0 }));
  g.fillStyle = P.ink; g.beginPath(); g.arc(W / 2 + 0, 100, 7, 0, TAU); g.arc(W / 2, 150, 7, 0, TAU); g.fill();
  if (flap) { pen(g, rrect(W / 2 - 110, H + 40, 220, 96, 8), { fill: P.ink, lw: 2.5, shadow: true, breaks: false, highlight: false });
    g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 110, H + 88); g.lineTo(W / 2 + 110, H + 88); g.stroke();
    g.font = '700 70px "Archivo Narrow"'; g.fillStyle = P.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '8px'; g.fillText(flap, W / 2 + 4, H + 90); g.letterSpacing = '0px'; }
  g.restore();
  if (label) tag(g, x + W * sc * 0.5, y + H * sc, x + W * sc * 0.18, y + H * sc + (flap ? 175 : 60) * sc, label, { size: 30, swing: -2, night, sub });
}
// a stretched coil spring between two hooks (pitch grows with tension) + the +30 tag
function mainspring(g, x0, y0, x1, y1, tension, t, { coils = 16, R = 34 } = {}) {
  const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
  g.save(); g.translate(x0, y0); g.rotate(a);
  const pts = []; const n = coils * 24, e = 40; for (let i = 0; i <= n; i++) { const u = i / n, ph = u * coils * TAU; pts.push([e + u * (L - 2 * e), Math.sin(ph) * R, Math.cos(ph)]); }
  // back half (behind), then front half: a 3D helix in 2 passes, ink edge + brass core
  for (const pass of [0, 1]) { g.lineCap = 'round';
    for (let i = 0; i < n; i++) { const [xa, ya, za] = pts[i], [xb, yb] = pts[i + 1]; if ((za > 0) !== !!pass) continue;
      g.strokeStyle = P.ink; g.lineWidth = 9; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
      g.strokeStyle = pass ? P.brassL : P.brassD; g.lineWidth = 5; g.beginPath(); g.moveTo(xa + 1, ya + 1); g.lineTo(xb + 1, yb + 1); g.stroke(); } }
  for (const ex of [0, L]) { g.strokeStyle = P.ink; g.lineWidth = 9; g.beginPath(); g.moveTo(ex, 0); g.lineTo(ex === 0 ? e : L - e, 0); g.stroke(); g.strokeStyle = P.brassL; g.lineWidth = 5; g.stroke(); }
  g.restore();
}
async function clock(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const sky = p.sky ?? 'day', night = sky !== 'day';
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); applyCam(g, s, camAt(p, t), t); g.clearRect(-200, -200, 2400, 1500);
    const a = toMin(p.from ?? '18:18'), b = toMin(p.to ?? '18:48');
    let roll = p.roll ?? 1; if (p.rollAt != null) roll = M.E.inOutCubic(range(t, p.rollAt, p.rollAt + (p.rollDur ?? 2.5)));
    const v = a + (b - a) * roll, rolling = p.rollAt != null ? Math.sin(Math.PI * clamp(roll)) : 0, tension = p.spring ?? roll;
    if (night) skyBands(g, sky, 980, t, 0.6); else lampPool(g, 560, 330, 1000, P.paper, P.card);
    // back layer: big pale gears turning slowly (the clockwork behind the story), paper-hazed
    const bg = night ? SKY[sky][1] : P.paper;
    for (const [gx, gy, r, n, sp] of [[300, 980, 260, 28, 0.08], [760, 1060, 170, 20, -0.12], [1600, 140, 220, 24, 0.07], [1830, 420, 140, 16, -0.11], [120, 160, 150, 18, -0.06]])
      pen(g, gearPath(gx, gy, r, n, t * sp), { fill: mix(P.brassL, bg, 0.55), line: null, shade: 0.3, shadeColor: mix(P.brass, bg, 0.5), box: [gx - r, gy - r, gx + r, gy + r] });
    // a small card cathedral below, flame roofline + bent spire (mid layer)
    if (p.cathedral !== false) { g.save(); g.translate(1180, 1010); const kk = 3.3;
      sideCard(g, 0, 0, kk, { sky: night ? 'night' : 'dusk', fireS: fireSections(0.7), roofGone: 0.2, glow: 0.8, glowWin: true, spire: 'leaning' }, t);
      sideFire(g, (m) => m * kk, (m) => -m * kk, kk, { sky: 'dusk', fireS: fireSections(0.7), roofGone: 0.2, spire: 'leaning', spireLean: 12, smoke: 0.6, wind: 0.4 }, t, false); g.restore(); }
    const k = 0.95, lx = 110, ly = 250, rx = 1230, ry = 250;
    counter(g, lx, ly, k, a, { label: p.labelL ?? 'First alarm', sub: p.subL ?? '18:18 (ALSO GIVEN AS 18:20)', night, t, flap: p.flapL === undefined ? 'FEU' : p.flapL });
    counter(g, rx, ry, k, v, { rolling, label: p.labelR ?? 'Brigade called', sub: p.subR ?? '18:48 NYT · 18:51 AFP', night, t });
    const sx0 = lx + 560 * k + 6, sx1 = rx - 6, sy = ly + 125 * k;
    mainspring(g, sx0, sy, sx1, sy, tension, t, { coils: Math.round(lerp(22, 11, clamp(tension))), R: lerp(44, 30, clamp(tension)) });
    // the +30 MIN tag: the one red thing (paper text on red, notched + dashed ring)
    const tx = (sx0 + sx1) / 2, ty = sy + 120, red = p.red ?? 'tag';
    g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, sy + 30); g.lineTo(tx, ty); g.stroke(); g.restore();
    g.save(); g.translate(tx, ty); g.rotate(Math.sin(t * 2.4) * 2 * D);
    pen(g, poly([[-110, 12], [-96, 0], [110, 0], [110, 96], [-96, 96], [-110, 84]]), { fill: red === 'tag' ? P.red : P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.25, shadeColor: red === 'tag' ? P.redD : P.kraftD, box: [-110, 0, 110, 96] });
    g.fillStyle = P.paper; g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(-88, 48, 7, 0, TAU); g.fill(); g.stroke();
    g.font = '700 60px "Archivo Narrow"'; g.fillStyle = red === 'tag' ? P.paper : P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.tagText ?? '+30 MIN', 12, 50);
    if (red === 'tag') { g.save(); g.strokeStyle = P.red; g.lineWidth = 2.5; g.setLineDash([7, 6]); g.beginPath(); g.roundRect(-126, -14, 252, 124, 14); g.stroke(); g.restore(); }
    g.restore();
    if (p.title) { g.save(); g.font = '400 84px "Instrument Serif"'; g.fillStyle = night ? P.paper : P.ink; g.fillText(p.title, 110, 170); g.restore(); }
    g.setTransform(s, 0, 0, s, 0, 0); fibre(g, night ? 0.06 : 0.09);
    sourceSlip(g, p.source ?? 'SOURCES: NYT 16 JUL 2019 · AFP · PARIS PROSECUTOR · "ABOUT HALF AN HOUR"');
  } };
}

// ================================================================= SET: paris (the survey sheet: Île de la Cité and the Seine)
// Schematic outlines in metres (x east, y south, origin = the cathedral crossing); simplified, labelled SCHEMATIC.
const CITE = [[-905, -40], [-860, -95], [-760, -135], [-600, -170], [-420, -190], [-250, -195], [-80, -180], [90, -150], [210, -110], [300, -55], [345, 5], [300, 55], [190, 85], [60, 95], [-90, 100], [-260, 100], [-430, 95], [-600, 75], [-760, 40], [-860, 5]];
const LOUIS = [[420, -60], [540, -130], [760, -160], [980, -120], [1110, -45], [1100, 25], [930, 85], [700, 105], [500, 75]];
const NORTH = [[-1700, -330], [-900, -300], [-300, -330], [300, -300], [800, -330], [1500, -300], [1700, -320], [1700, -1400], [-1700, -1400]];
const SOUTH = [[-1700, 190], [-900, 175], [-300, 165], [300, 160], [520, 205], [900, 230], [1700, 200], [1700, 1400], [-1700, 1400]];
const BRIDGES = [[-830, -300, -120], [-830, 0, 175], [-620, -300, -150], [-450, -310, -185], [-250, -320, -190], [-480, 90, 170], [-230, 98, 165], [-110, 100, 165], [100, 90, 160], [360, -20, -20], [380, -80, -300], [800, 100, 228]];
const CATH = (() => { const pts = [[-64, -22], [-50, -22], [-50, -17], [-10, -17], [-10, -40], [8, -40], [8, -17], [40, -17], [54, -14], [62, -7], [64, 0], [62, 7], [54, 14], [40, 17], [8, 17], [8, 40], [-10, 40], [-10, 17], [-50, 17], [-50, 22], [-64, 22]]; return pts; })();
const ROUTE = [[1500, -900], [1200, -700], [900, -470], [600, -360], [240, -345], [-150, -340], [-250, -330], [-250, -190], [-250, -60], [-150, -40], [-90, -10]];
function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function pathAt(pts, d) { for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= l) { const u = d / l; return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; } d -= l; } const n = pts.length - 1; return [pts[n][0], pts[n][1], Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0])]; }
async function paris(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const r0 = M.rng(3), blocks = [];
  for (const [land, sgn] of [[NORTH, -1], [SOUTH, 1]]) for (let i = 0; i < 260; i++) { const x = -1700 + r0() * 3400, y = sgn * ((sgn < 0 ? 400 : 290) + r0() * 700); blocks.push([x, y, 60 + r0() * 120, 40 + r0() * 90, r0() * 0.3 - 0.15]); }
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); applyCam(g, s, camAt(p, t), t); g.clearRect(-200, -200, 2400, 1500);
    const route = anim(p, 'route', t, 1), eng = anim(p, 'engines', t, route), boat = anim(p, 'boat', t, 1), pump = anim(p, 'pump', t, 0.8);
    const z = (p.zoom ?? 1) * 0.92, [ccx, ccy] = p.center ?? [-120, -40];
    // the drafting table + the sheet with card thickness and a hard shadow
    lampPool(g, 600, 300, 1000, P.kraft, P.kraftD);
    const sx0 = 70, sy0 = 50, sx1 = 1850, sy1 = 1030;
    g.save(); g.fillStyle = 'rgba(11,20,38,0.16)'; g.fillRect(sx0 + 14, sy0 + 16, sx1 - sx0, sy1 - sy0); g.restore();
    pen(g, rect(sx0, sy0, sx1 - sx0, sy1 - sy0), { fill: P.paper, lw: 2, breaks: false, highlight: false });
    g.save(); g.beginPath(); g.rect(sx0 + 24, sy0 + 24, sx1 - sx0 - 48, sy1 - sy0 - 48); g.clip();
    g.translate(960, 540); g.scale(z, z); g.translate(-ccx, -ccy);
    // water + water-lining (engraved chart: coast-parallel teal lines)
    g.fillStyle = P.tealL; g.fillRect(-2000, -1500, 4000, 3000);
    for (const land of [NORTH, SOUTH, CITE, LOUIS]) { const lp = poly(land);
      for (const kk of [30, 19, 10, 4]) { g.save(); lp(g); g.strokeStyle = P.teal; g.lineWidth = (2 * kk + 1.6) / z; g.lineJoin = 'round'; g.stroke(); lp(g); g.strokeStyle = P.tealL; g.lineWidth = (2 * kk - 1.6) / z; g.stroke(); g.restore(); } }
    // drifting current ticks in the river
    g.save(); g.strokeStyle = P.teal; g.lineWidth = 2 / z; const st2 = Math.floor(t * 30 / 8); const rr = M.rng(8); for (let i = 0; i < 40; i++) { const y = rr() < 0.5 ? -240 - rr() * 60 : 130 + rr() * 30, x = ((rr() * 3400 + st2 * 4) % 3400) - 1700; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.stroke(); } g.restore();
    for (const land of [NORTH, SOUTH]) pen(g, poly(deckle(land, 5, 3, 14)), { fill: P.card, lw: 2.5 / z, breaks: false, highlight: false, shadow: true, shadowOff: [4 / z, 5 / z] });
    // city blocks: hatched card blocks (ink-40 hatch = built), quais as clear roads
    g.save(); poly(NORTH)(g); poly(SOUTH)(g); g.clip();
    for (const [x, y, w, h, a] of blocks) { g.save(); g.translate(x, y); g.rotate(a); pen(g, rect(-w / 2, -h / 2, w, h), { fill: P.kraft, line: P.ink40, lw: 1.25 / z, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink40, 0.7), hatchGap: 7 / z, box: [-w / 2, -h / 2, w / 2, h / 2] }); g.restore(); }
    g.restore();
    g.save(); g.lineJoin = 'round'; for (const [land, off] of [[NORTH, -48], [SOUTH, 40]]) { g.beginPath(); land.slice(0, 7).forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, q[0], q[1] + off)); g.strokeStyle = P.ink40; g.lineWidth = 24 / z; g.stroke(); g.strokeStyle = P.paper; g.lineWidth = 20 / z; g.stroke(); } g.restore();
    for (const land of [CITE, LOUIS]) pen(g, poly(deckle(land, 9, 2.5, 12)), { fill: P.card, lw: 3 / z, breaks: false, highlight: false, shadow: true, shadowOff: [4 / z, 5 / z] });
    for (const [x0, y0, x1, y1] of [[-660, -165, -430, 70], [-420, -40, -262, 82], [-330, -180, -120, -70], [-860, -60, -700, 10], [-420, -175, -350, -60]]) pen(g, rect(x0, y0, x1 - x0, y1 - y0), { fill: P.kraft, line: P.ink40, lw: 1.5 / z, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink40, 0.8), hatchGap: 7 / z, box: [x0, y0, x1, y1], shadow: true, shadowOff: [3, 4] });
    g.save(); poly(CITE)(g); g.clip(); for (let i = 0; i < 0; i++) { const x = -820 + i * 46, y = -120 + (i % 3) * 50; if (x > -260) break; g.save(); g.translate(x, y); pen(g, rect(-18, -20, 36, 40), { fill: P.kraft, line: P.ink40, lw: 1.25 / z, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink40, 0.7), hatchGap: 7 / z, box: [-18, -20, 18, 20] }); g.restore(); }
    // square behind the apse (sage) + the parvis (paved)
    pen(g, poly([[80, -60], [300, -40], [330, 10], [280, 60], [80, 80]]), { fill: P.sageL, line: P.ink40, lw: 1.25 / z, breaks: false, highlight: false });
    for (let i = 0; i < 9; i++) puff(g, 110 + i * 22, -20 + (i % 3) * 28, 11, 90 + i, { fill: P.sage, shadeCol: P.sageD, line: P.ink, lw: 1.5 / z, shade: 0.5 });
    pen(g, rect(-200, -90, 130, 180), { fill: P.kraft, line: P.ink40, lw: 1.25 / z, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink40, 0.4), hatchGap: 10 / z, box: [-200, -90, -70, 90] });
    g.restore();
    // bridges: card strips with parapet lines
    for (const [x, y0, y1] of BRIDGES) pen(g, rect(x - 12, Math.min(y0, y1), 24, Math.abs(y1 - y0)), { fill: P.card, lw: 2 / z, breaks: false, highlight: false, shadow: true, shadowOff: [3 / z, 4 / z] });
    // the cathedral footprint: ink cross with paper inner line
    pen(g, poly(CATH), { fill: P.ink, line: P.ink, lw: 2 / z, shadow: true, shadowOff: [4 / z, 5 / z], breaks: false, highlight: false });
    g.strokeStyle = P.paper; g.lineWidth = 1.5 / z; g.beginPath(); g.moveTo(-58, 0); g.lineTo(56, 0); g.moveTo(0, -26); g.lineTo(0, 26); g.stroke();
    // pump hoses from the river into the island (teal = flow)
    if (pump > 0.02) { g.save(); g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-120, 150, -60, 26], [40, 140, 20, 26], [170, 125, 52, 18]]) { const u2 = clamp(pump * 1.4 - 0.2); g.strokeStyle = P.ink; g.lineWidth = 7 / z; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, u2), lerp(y0, y1, u2)); g.stroke(); g.strokeStyle = P.teal; g.lineWidth = 4 / z; g.stroke(); } g.restore(); }
    // the fireboat on the south arm: card hull, wake lines, a teal hose arc
    if (boat > 0.01) { const bx = lerp(-700, -20, M.E.decel(boat)), by = 140;
      g.save(); g.strokeStyle = P.teal; g.lineWidth = 2 / z; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(bx - 40 - i * 26, by - 8 - i * 3); g.lineTo(bx - 40 - i * 26 - 22, by - 8 - i * 4); g.moveTo(bx - 40 - i * 26, by + 8 + i * 3); g.lineTo(bx - 40 - i * 26 - 22, by + 8 + i * 4); g.stroke(); } g.restore();
      pen(g, poly([[bx - 40, by - 11], [bx + 26, by - 11], [bx + 44, by], [bx + 26, by + 11], [bx - 40, by + 11]]), { fill: P.ink, lw: 2 / z, shadow: true, shadowOff: [3, 4], breaks: false, highlight: false });
      pen(g, rect(bx - 22, by - 6, 26, 12), { fill: P.brassL, lw: 1.5 / z, breaks: false, highlight: false });
      if (boat > 0.95) { g.save(); g.strokeStyle = P.teal; g.lineWidth = 3 / z; g.setLineDash([8, 6]); g.lineDashOffset = -t * 40; g.beginPath(); g.moveTo(bx + 10, by - 8); g.quadraticCurveTo(bx + 20, by - 90, -20, 30); g.stroke(); g.restore(); } }
    // the red route thread (4 px, paper halo) + brass pins + engine tokens riding it
    const RL = pathLen(ROUTE), d = route * RL;
    const sub = []; for (let i = 0; i < ROUTE.length; i++) { const L1 = pathLen(ROUTE.slice(0, i + 1)); if (L1 <= d) sub.push(ROUTE[i]); else { const [x, y] = pathAt(ROUTE, d); sub.push([x, y]); break; } }
    const red = p.red ?? 'route';
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; polyline(g, sub); g.strokeStyle = P.paper; g.lineWidth = 9 / z; g.stroke(); g.strokeStyle = red === 'route' ? P.red : P.ink; g.lineWidth = 5 / z; g.stroke(); g.restore();
    for (const q of [ROUTE[0], ROUTE[ROUTE.length - 1]]) pen(g, circle(q[0], q[1], 9 / z), { fill: P.brass, lw: 2 / z, breaks: false, highlight: false });
    for (let i = 0; i < 4; i++) { const di = clamp(eng * RL - i * 70, 0, RL); if (eng * RL - i * 70 <= 0) continue; const [x, y, a] = pathAt(ROUTE, di);
      g.save(); g.translate(x, y); g.rotate(a); pen(g, rrect(-24, -11, 48, 22, 4), { fill: P.ink, lw: 1.8 / z, shadow: true, shadowOff: [3, 4], breaks: false, highlight: false });
      pen(g, rect(-18, -5, 30, 10), { fill: P.brassL, lw: 1.2 / z, breaks: false, highlight: false }); g.strokeStyle = P.ink; g.lineWidth = 1.2 / z; g.beginPath(); for (let j = -14; j < 12; j += 5) { g.moveTo(j, -5); g.lineTo(j, 5); } g.stroke();
      pen(g, rect(14, -9, 8, 18), { fill: P.paper, lw: 1.2 / z, breaks: false, highlight: false }); g.restore(); }
    g.restore();
    // labels (screen space, map positions)
    const S = (x, y) => [960 + (x - ccx) * z, 540 + (y - ccy) * z];
    mono(g, 'S E I N E', ...S(-760, -238), 26, P.tealD); mono(g, 'S E I N E', ...S(450, 172), 22, P.tealD);
    mono(g, 'RIVE DROITE', ...S(-900, -350), 22, P.ink); mono(g, 'RIVE GAUCHE', ...S(-900, 228), 22, P.ink);
    mono(g, 'ÎLE DE LA CITÉ', ...S(-720, -40), 22, P.ink); mono(g, 'ÎLE SAINT-LOUIS', ...S(600, -10), 20, P.ink);
    if (p.labels !== false) { const [cx2, cy2] = S(0, -26); tag(g, cx2, cy2, cx2 - 120, cy2 - 330, 'Notre-Dame', { size: 34, swing: -2, sub: 'east end of the island' }); if (boat > 0.5) { const [bx2, by2] = S(lerp(-700, -20, M.E.decel(boat)), 150); tag(g, bx2, by2, bx2 - 320, by2 + 120, 'Fireboat', { size: 28, swing: 3, sub: 'pumping from the Seine' }); } }
    // neat line, grid ticks, compass (the coil), key, scale bar
    g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.strokeRect(sx0 + 24, sy0 + 24, sx1 - sx0 - 48, sy1 - sy0 - 48);
    g.beginPath(); for (let x = sx0 + 24; x <= sx1 - 24; x += 89) { g.moveTo(x, sy0 + 24); g.lineTo(x, sy0 + 38); g.moveTo(x, sy1 - 24); g.lineTo(x, sy1 - 38); } for (let y = sy0 + 24; y <= sy1 - 24; y += 89) { g.moveTo(sx0 + 24, y); g.lineTo(sx0 + 38, y); g.moveTo(sx1 - 24, y); g.lineTo(sx1 - 38, y); } g.stroke();
    coil(g, sx1 - 110, sy0 + 250, 40, P.ink, null, 3); mono(g, 'N', sx1 - 116, sy0 + 192, 22, P.ink);
    g.save(); const sb = 200 * z; pen(g, rect(sx1 - 120 - sb, sy1 - 90, sb, 14), { fill: P.ink, lw: 1.5, breaks: false, highlight: false }); pen(g, rect(sx1 - 120 - sb, sy1 - 90, sb / 2, 14), { fill: P.paper, lw: 1.5, breaks: false, highlight: false }); g.restore();
    mono(g, '200 M', sx1 - 120 - sb, sy1 - 102, 18, P.ink70);
    pen(g, rect(sx0 + 50, sy0 + 50, 470, 150), { fill: P.card, lw: 1.5, shadow: true, breaks: false, highlight: false });
    mono(g, 'SURVEY SHEET · 15 APR 2019', sx0 + 72, sy0 + 88, 20, P.ink);
    g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.beginPath(); g.moveTo(sx0 + 74, sy0 + 124); g.lineTo(sx0 + 124, sy0 + 124); g.stroke(); g.restore(); mono(g, 'ROUTE (SCHEMATIC)', sx0 + 140, sy0 + 131, 18, P.ink70);
    pen(g, rrect(sx0 + 84, sy0 + 152, 34, 16, 3), { fill: P.ink, lw: 1.5, breaks: false, highlight: false }); mono(g, 'FIRE ENGINE', sx0 + 140, sy0 + 168, 18, P.ink70);
    g.setTransform(s, 0, 0, s, 0, 0); counterBadge(g, 1520, 72 + 0, p.clock ?? '18:51', { scale: 0.85, t }); fibre(g, 0.09);
    sourceSlip(g, p.source ?? 'SCHEMATIC MAP · OUTLINES SIMPLIFIED · ROUTE ILLUSTRATIVE');
  } };
}

// ----------------------------------------------------------------- firefighters: shared parvis pieces (views low / side / close)
// perspective paving: rows spaced geometrically from the horizon y0, columns converging on (vx, vy); seeded slab tones
function paving(g, y0, y1, vx, vy, t, { base = '#6d6156', alt = '#62584e', alt2 = '#776a5d', line = '#3a3632', seed = 5, W = 120 } = {}) {
  g.fillStyle = base; g.fillRect(-200, y0, 2320, y1 - y0 + 300);
  const rows = []; for (let y = y0 + 5, d = 6; y < y1 + 260; y += d, d *= 1.24) rows.push(y);
  const cx = (i, y) => vx + i * W * (y - vy) / Math.max(1, (y1 - vy));
  for (let r = 0; r < rows.length - 1; r++) for (let i = -60; i < 60; i++) {
    const h = hash(seed * 13 + i * 7.3 + r * 31.7); if (h > 0.34) continue;
    const a = rows[r], b = rows[r + 1], xa = cx(i, a), xb = cx(i + 1, a), xc = cx(i + 1, b), xd = cx(i, b); if (Math.max(xa, xd) > 2200 || Math.max(xb, xc) < -200) continue;
    poly([[xa, a], [xb, a], [xc, b], [xd, b]])(g); g.fillStyle = h < 0.17 ? alt : alt2; g.fill();
  }
  g.save(); g.strokeStyle = rgba(line, 0.75); g.lineWidth = 1.4; g.beginPath();
  for (let i = -60; i <= 60; i++) { const x0 = cx(i, y0), x1 = cx(i, y1 + 260); if (Math.max(x0, x1) < -200 || Math.min(x0, x1) > 2200) continue; g.moveTo(x0, y0); g.lineTo(x1, y1 + 260); }
  for (const y of rows) { g.moveTo(-200, y); g.lineTo(2120, y); } g.stroke(); g.restore();
}
// a puddle on the paving: torn teal card, ember reflection streaks, ripple ticks (drift on 8 f steps)
function puddle(g, x, y, rx, ry, t, seed = 1, glow = 1) {
  const pts = []; for (let q = 0; q < 24; q++) { const a = q / 24 * TAU, w = 1 + 0.18 * Math.sin(a * 3 + seed); pts.push([x + Math.cos(a) * rx * w, y + Math.sin(a) * ry * w]); }
  const pp = deckle(pts, seed * 11, 2.5, 12);
  pen(g, poly(pp), { fill: mix(P.nightL, P.tealD, 0.55), line: P.ink, lw: 2, breaks: false, highlight: false, mis: [3, 2] });
  g.save(); poly(pp)(g); g.clip(); const st = Math.floor(t * 30 / 8);
  g.strokeStyle = P.ember; g.lineWidth = 3; g.lineCap = 'round'; const r = M.rng(seed * 5 + st % 3);
  for (let i = 0; i < 9 * glow; i++) { const xx = x - rx * 0.7 + r() * rx * 1.3, yy = y - ry * 0.6 + r() * ry * 1.2; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 12 + r() * 30, yy); g.stroke(); }
  g.strokeStyle = P.tealL; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const xx = x - rx * 0.6 + r() * rx * 1.1, yy = y - ry * 0.5 + r() * ry; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 20 + r() * 26, yy); g.stroke(); }
  g.restore();
}
// fat paper hose: ink edge, teal body, light seam, brass couplings at the given point indices; smoothed through pts
function hoseLine(g, pts, w = 18, { couplings = [], flow = 0, t = 0 } = {}) {
  const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } g.lineTo(...pts[pts.length - 1]); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.translate(8, 10); path(); g.strokeStyle = 'rgba(11,20,38,0.22)'; g.lineWidth = w + 6; g.stroke(); g.restore(); // hard cast shadow
  path(); g.strokeStyle = P.ink; g.lineWidth = w + 6; g.stroke();
  g.save(); g.translate(MIS[0] * 0.5, MIS[1] * 0.5); path(); g.strokeStyle = P.teal; g.lineWidth = w; g.stroke(); g.restore();
  g.save(); g.translate(-w * 0.18, -w * 0.22); path(); g.strokeStyle = P.tealL; g.lineWidth = Math.max(2, w * 0.18); if (flow) { g.setLineDash([w * 1.2, w * 1.6]); g.lineDashOffset = -t * 60 * flow; } g.stroke(); g.restore();
  g.restore();
  for (const i of couplings) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    g.save(); g.translate(...pts[i]); g.rotate(ang); pen(g, rrect(-w * 0.9, -w * 0.85, w * 1.8, w * 1.7, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brassD, box: [-w, -w, w, w] });
    g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-w * 0.3, -w * 0.85); g.lineTo(-w * 0.3, w * 0.85); g.moveTo(w * 0.3, -w * 0.85); g.lineTo(w * 0.3, w * 0.85); g.stroke(); g.restore(); }
}
// a water jet: a paper ribbon on a quadratic arc (teal with an ink edge, light dashes flowing), droplets + splash at the end
function jet(g, x0, y0, cx, cy, x1, y1, t, { w = 14, seed = 1, splash = 1 } = {}) {
  g.save(); g.lineCap = 'round';
  const arc = () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); };
  arc(); g.strokeStyle = P.ink; g.lineWidth = w + 5; g.stroke();
  arc(); g.strokeStyle = P.teal; g.lineWidth = w; g.stroke();
  arc(); g.strokeStyle = P.tealL; g.lineWidth = Math.max(2, w * 0.35); g.setLineDash([w * 2.2, w * 1.4]); g.lineDashOffset = -t * 220; g.stroke(); g.setLineDash([]);
  g.restore();
  // droplets: card diamonds peeling off the arc's last third, falling (on ones)
  const q = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  for (let i = 0; i < 26; i++) { const a = fract(t * (0.6 + hash(seed + i) * 0.5) + hash(seed * 3 + i)), u = 0.55 + hash(seed + i * 7) * 0.45, [px, py] = q(u);
    const dx = (hash(seed + i * 11) - 0.5) * 90 * a, dy = a * a * 160 + (hash(i + seed) - 0.5) * 20, s = (w * 0.45) * (1 - a * 0.5);
    g.save(); g.translate(px + dx, py + dy); g.rotate(0.6 + i); pen(g, poly([[0, -s], [s * 0.6, 0], [0, s], [-s * 0.6, 0]]), { fill: i % 3 ? P.tealL : P.paper, lw: 1.4, breaks: false, highlight: false, mis: [1.5, 1] }); g.restore(); }
  if (splash) for (let i = 0; i < 4; i++) puff(g, x1 + (hash(seed + i) - 0.5) * w * 6, y1 + (hash(seed + i * 3) - 0.5) * w * 3, w * (1.1 + hash(seed * 7 + i) * 0.8) * splash, seed * 50 + i + Math.floor(t * 4) % 3,
    { fill: P.paper, shadeCol: P.tealL, line: P.ink40, lw: 1.5, shade: 0.4 });
}
// a brass branch pipe (nozzle) from (x, y) along angle a (rad), length L
function nozzle(g, x, y, a, L, w = 16) {
  g.save(); g.translate(x, y); g.rotate(a);
  pen(g, poly([[0, -w * 0.55], [L * 0.75, -w * 0.42], [L, -w * 0.26], [L, w * 0.26], [L * 0.75, w * 0.42], [0, w * 0.55]]), { fill: P.brassL, lw: 2.5, shadow: true, shadowOff: [8, 10], breaks: false, highlight: false, shade: 0.45, shadeColor: P.brass, box: [0, -w, L, w] });
  pen(g, rrect(L * 0.25, -w * 0.75, w * 0.9, w * 1.5, 3), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  pen(g, rrect(L * 0.35, w * 0.4, w * 0.4, w * 1.3, 3), { fill: P.ink70, lw: 1.5, breaks: false, highlight: false }); // the lever
  g.restore();
}
// fire engine with an aerial ladder: ink card body, brass ladder rails + rungs from the turntable to `to`
function ladderTruck(g, x, y, sc, to, t, { flip = false } = {}) {
  g.save(); g.translate(x, y); g.scale(flip ? -sc : sc, sc);
  pen(g, rrect(0, -150, 470, 120, 10), { fill: P.ink, lw: 3, shadow: true, shadowOff: [12, 12], breaks: false, highlight: false });
  pen(g, rrect(470, -128, 130, 98, 12), { fill: P.ink, lw: 3, breaks: false, highlight: false });
  pen(g, rect(490, -116, 82, 42), { fill: P.tealL, lw: 2, breaks: false, highlight: false });
  for (const bx of [30, 140, 250, 360]) pen(g, rect(bx, -136, 92, 70), { fill: '#24324d', lw: 1.5, breaks: false, highlight: false });
  g.fillStyle = P.brassL; g.fillRect(4, -60, 590, 7);
  for (const wx of [90, 330, 520]) { pen(g, circle(wx, -26, 34), { fill: P.ink70, lw: 3, breaks: false, highlight: false }); pen(g, gearPath(wx, -26, 17, 8, 0), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); }
  pen(g, rrect(150, -186, 120, 40, 6), { fill: P.brass, lw: 2.5, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brassD, box: [150, -186, 270, -146] });
  g.restore();
  if (!to) return;
  const bx = x + (flip ? -1 : 1) * 210 * sc, by = y - 175 * sc, [tx, ty] = to, L = Math.hypot(tx - bx, ty - by), ang = Math.atan2(ty - by, tx - bx), w = 30 * sc;
  g.save(); g.translate(bx, by); g.rotate(ang);
  g.save(); g.translate(12, 14); g.fillStyle = 'rgba(11,20,38,0.16)'; g.fillRect(0, -w / 2, L, w); g.restore();
  g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); for (let d = 10; d < L; d += 22 * sc) { g.moveTo(d, -w / 2); g.lineTo(d, w / 2); } g.stroke();
  for (const sy of [-w / 2, w / 2]) pen(g, rect(0, sy - 4, L, 8), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
  g.restore();
}
// the hose hydrant (layer 0 prop): brass pillar, valve wheel, chained cap
function hydrant(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  pen(g, rrect(-34, -150, 68, 150, 10), { fill: P.brass, lw: 3, shadow: true, shadowOff: [14, 10], breaks: false, shade: lampShade([-34, -150, 34, 0], 0.05, 0.55, 0.3), shadeColor: P.brassD, box: [-34, -150, 34, 0] });
  pen(g, pill(0, -152, 84, 26), { fill: P.brassL, lw: 2.5, breaks: false, highlight: false });
  pen(g, gearPath(0, -176, 22, 10, 0, 6, 0.3), { fill: P.brassD, lw: 2, breaks: false, highlight: false });
  pen(g, rrect(30, -110, 30, 34, 5), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
  g.restore();
}
// a hand cart (layer 0/1): slatted oak bed, two spoked wheels, shafts, a load of wrapped works and boxes
function handCart(g, x, y, s, t, { load = 1 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.save(); g.fillStyle = 'rgba(11,20,38,0.2)'; g.beginPath(); g.ellipse(170, 8, 300, 26, 0, 0, TAU); g.fill(); g.restore();
  for (const [sx, sy, ex, ey] of [[-220, -150, 20, -160], [-220, -128, 20, -126]]) beam(g, [sx, sy], [ex, ey], 14, { col: OAK.L, lw: 2 });
  if (load > 0) { // the load: a wrapped painting (kraft, string cross), a brass frame corner, boxes, a sage blanket
    pen(g, poly([[60, -250], [250, -290], [280, -168], [80, -150]]), { fill: P.kraft, lw: 2.5, shadow: true, breaks: false, highlight: false, hatched: true, hatchColor: rgba(P.ink, 0.18), box: [60, -290, 280, -150] });
    g.strokeStyle = P.ink70; g.lineWidth = 2; g.beginPath(); g.moveTo(70, -200); g.lineTo(270, -230); g.moveTo(160, -270); g.lineTo(180, -158); g.stroke();
    pen(g, rect(240, -250, 120, 92), { fill: P.brassL, lw: 2.5, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [240, -250, 360, -158] });
    pen(g, rect(256, -236, 88, 64), { fill: P.ink70, lw: 1.5, breaks: false, highlight: false });
    pen(g, rect(-10, -214, 92, 60), { fill: P.card, lw: 2.5, breaks: false, highlight: false, shade: 0.3, shadeColor: P.kraftD, box: [-10, -214, 82, -154] });
    mono(g, 'FRAGILE', 36, -178, 14, P.ink70, 'center');
    pen(g, poly(deckle([[300, -170], [420, -186], [430, -150], [300, -150]], 9, 2, 10)), { fill: P.sage, lw: 2, breaks: false, highlight: false, shade: 0.4, shadeColor: P.sageD, box: [300, -186, 430, -150] });
  }
  pen(g, rect(-10, -160, 450, 34), { fill: OAK.M, lw: 3, shadow: true, breaks: false, highlight: false });
  g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let sx = 20; sx < 440; sx += 46) { g.moveTo(sx, -160); g.lineTo(sx, -126); } g.stroke();
  for (const wx of [70, 360]) { pen(g, circle(wx, -60, 66), { fill: null, line: P.ink, lw: 10 }); g.save(); g.strokeStyle = OAK.L; g.lineWidth = 5; g.beginPath(); g.arc(wx, -60, 66, 0, TAU); g.stroke();
    g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + 0.2; g.moveTo(wx, -60); g.lineTo(wx + Math.cos(a) * 62, -60 + Math.sin(a) * 62); } g.stroke(); g.restore();
    pen(g, circle(wx, -60, 13), { fill: P.brass, lw: 2, breaks: false, highlight: false }); }
  g.restore();
}
// the Crown of Thorns reliquary: a brass ring frame around a crystal tube; the crown inside is the one red thing (+ dashed ring)
function reliquary(g, x, y, r, t, red = true) {
  pen(g, circle(x, y, r), { fill: null, line: P.ink, lw: r * 0.42 });
  g.save(); g.strokeStyle = P.brass; g.lineWidth = r * 0.3; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.strokeStyle = P.tealL; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.strokeStyle = red ? P.red : P.brassD; g.lineWidth = Math.max(1.5, r * 0.08); for (let a = 0; a < 22; a++) { const aa = a / 22 * TAU; g.beginPath(); g.moveTo(x + Math.cos(aa) * r * 0.92, y + Math.sin(aa) * r * 0.92); g.lineTo(x + Math.cos(aa + 0.35) * r * 1.08, y + Math.sin(aa + 0.35) * r * 1.08); g.stroke(); }
  g.strokeStyle = P.brassD; g.lineWidth = Math.max(1.5, r * 0.1); g.beginPath(); g.moveTo(x, y - r * 1.15); g.lineTo(x, y - r * 1.6); g.moveTo(x - r * 0.2, y - r * 1.42); g.lineTo(x + r * 0.2, y - r * 1.42); g.stroke();
  g.restore();
  if (red) redRing(g, x, y, r * 1.75, P.red, Math.max(2.5, r * 0.08));
}
// 'low' hose view: a looming cropped façade, a braced nozzle team in the foreground, a ladder truck, puddles, a hydrant
function ffHoseLow(g, t, p, { sky, night, red }) {
  const skyC = SKY[sky]?.[1] ?? P.night;
  backdrop(g, t, { sky, yH: 690, glow: 0.9, seed: 52 });
  const k = 13.5, ox = 900, oy = 772, X = (m) => ox + m * k, Y = (m) => oy - m * k;
  glowRings(g, X(20.5), Y(56), 170, 1, t, 11, skyC, 260, { rise: 0.75 });
  plume(g, X(19), Y(52), t, { H: 520, W: 80, n: 10, drift: 0.55, seed: 12, depth: 0.25, sky: skyC, base: '#8b8790', shadeCol: '#4a4652', lit: P.emberL, amount: 1, line: '#3d3a44' });
  for (let j = 0; j < 4; j++) flame(g, X(15.6 + j * 2.9), Y(48.6), (5 + 4 * hash(j + 3)) * k, 3.4 * k, t, 80 + j, { lean: 0.3 });
  facadeCard(g, ox, oy, k, { sky, fireS: fireSections(0.9), spire: 'gone', glow: 1, wind: 0.4 }, t);
  // the aerial ladder truck against the south tower (right), a figure at the top with a jet onto the roof
  const top = [X(39), Y(44)];
  paving(g, oy, 1080, 1140, 600, t, { seed: 7 });
  litPatch(g, X(20.5), oy + 26, 560, 34, 1, t, 4);
  ladderTruck(g, 1560, 880, 0.82, top, t);
  figure(g, top[0] - 6, top[1] + 4, 96, { face: -1, lean: 10, legF: 10, legB: -12, handF: [top[0] - 70, top[1] - 34], handB: [top[0] - 40, top[1] - 22], tank: true, glint: 1 });
  jet(g, top[0] - 74, top[1] - 38, top[0] - 160, top[1] - 260, X(26), Y(50), t, { w: 9, seed: 3, splash: 0.6 });
  // a second team at the portal base (mid layer), hose snaking back across the paving
  hoseLine(g, [[2000, 1000], [1700, 960], [1420, 900], [1220, 860], [1040, 838]], 12, { couplings: [2], flow: 1, t });
  for (const [fx, fh, ph] of [[1000, 200, 0], [1080, 190, 1.2]]) figure(g, fx, 842 + (fh - 190) * 0.2, fh, { face: -1, lean: 12 + Math.sin(twos(t) * 2 + ph) * 2, legF: 22, legB: -24, kneeF: 18, kneeB: 6,
    handF: [fx - fh * 0.42, 842 - fh * 0.62], handB: [fx - fh * 0.22, 842 - fh * 0.52], tank: true, glint: 1 });
  { const hb = [1000 - 200 * 0.22, 842 - 200 * 0.52], hf = [1000 - 200 * 0.42, 842 - 200 * 0.62], a = Math.atan2(hf[1] - hb[1], hf[0] - hb[0]) - 0.35;
    nozzle(g, hb[0], hb[1], a, 72, 10); jet(g, hb[0] + Math.cos(a) * 72, hb[1] + Math.sin(a) * 72, 860, 360, X(13), Y(47), t, { w: 9, seed: 9, splash: 0.5 }); }
  puddle(g, 1300, 990, 150, 26, t, 3); puddle(g, 760, 905, 90, 16, t, 5);
  // the foreground team: hydrant -> hose -> backup man -> braced nozzle man; the jet arcs up over the gallery
  const N0 = [650, 735], dir = [0.77, -0.64], tip = [N0[0] + dir[0] * 170, N0[1] + dir[1] * 170];
  hydrant(g, 44, 1075, 1.0);
  hoseLine(g, [[100, 975], [200, 1030], [330, 1020], [420, 960], [470, 880], [560, 800], [N0[0], N0[1]]], 26, { couplings: [1, 5], flow: 1, t });
  const sw = Math.sin(twos(t) * 2.4) * 1.5;
  figure(g, 330, 1070, 520, { face: 1, lean: 16 + sw, legF: 26, legB: -30, kneeF: 22, kneeB: 4, handF: [520, 818], handB: [462, 886], tank: true, glint: 1 });
  figure(g, 560, 1074, 610, { face: 1, lean: 14 + sw, legF: 30, legB: -34, kneeF: 30, kneeB: 2, handF: [N0[0] + dir[0] * 110, N0[1] + dir[1] * 110], handB: [N0[0] + dir[0] * 20, N0[1] + dir[1] * 20], tank: true, glint: 1,
    helmet: red === 'lead' ? P.red : P.brass });
  nozzle(g, N0[0], N0[1], Math.atan2(dir[1], dir[0]), 170, 22);
  jet(g, tip[0], tip[1], 930, -60, X(20.5), Y(47), t, { w: 20, seed: 5, splash: 0.8 });
  if (red === 'lead') redRing(g, 560 + 0.05 * 103 + Math.sin(14 * D) * 0.95 * 610 * 0.36, 1074 - 610 * 0.42 - 610 * 0.36 * 0.98 - 610 * 0.1, 64);
  embers(g, 200, 760, 1700, 760, t, { n: 50, seed: 31, size: 6 });
  if (p.labels !== false) tag(g, 330, 1012, 120, 250, p.label ?? 'Hose lines', { size: 32, swing: -2, night, sub: p.sub ?? 'water from hydrants and the Seine' });
}
// 'side' hose view: the south flank card burning, the ladder truck on the quay, a hose team on the bank (low, across)
function ffHoseSide(g, t, p, { sky, night, red }) {
  const k = 6.6, ox = 230, oy = 760, X = (m) => ox + m * k, Y = (m) => oy - m * k;
  backdrop(g, t, { sky, yH: oy, glow: 0.9, seed: 53 });
  const st = { sky, fireS: fireSections(0.85), roofGone: 0.55, spire: 'gone', glow: 1, wind: 0.5, smoke: 1, glowWin: true };
  sideFire(g, X, Y, k, st, t, true); sideCard(g, ox, oy, k, st, t); sideFire(g, X, Y, k, st, t, false);
  paving(g, oy, 1080, 980, 640, t, { seed: 9, W: 150 });
  litPatch(g, X(66), oy + 30, 600, 34, 1, t, 6);
  ladderTruck(g, 260, 960, 0.9, [X(52), Y(36)], t);
  figure(g, X(52) - 4, Y(36) + 6, 70, { face: 1, lean: 10, handF: [X(52) + 50, Y(36) - 30], handB: [X(52) + 30, Y(36) - 18], tank: true, glint: 1 });
  jet(g, X(52) + 52, Y(36) - 32, X(58), Y(60), X(66), Y(42), t, { w: 8, seed: 21, splash: 0.5 });
  const n = p.n ?? 4, crew = Array.from({ length: n }, (_, i) => { const fx = 1060 + i * 150, fh = 240 + i * 22, y = 950 + i * 22; return { fx, fh, y, hand: [fx - fh * (i ? 0.3 : 0.2), y - fh * (i ? 0.5 : 0.55)] }; });
  const hp = [[1990, 1075], [1760, 1050], ...crew.slice().reverse().map(c => c.hand)];
  hoseLine(g, hp, 18, { couplings: [1], flow: 1, t });
  crew.forEach(({ fx, fh, y, hand }, i) => { const ph = i * 0.9;
    figure(g, fx, y, fh, { face: -1, lean: 14 + Math.sin(twos(t) * 2 + ph) * 2, legF: 24, legB: -26, kneeF: 20, kneeB: 4, handF: i ? [hand[0] - fh * 0.1, hand[1] - fh * 0.04] : [fx - fh * 0.42, y - fh * 0.66], handB: hand, tank: true, glint: 1,
      helmet: i === 0 && red === 'lead' ? P.red : P.brass }); });
  const c0 = crew[0], nz = Math.atan2(-(c0.fh * 0.11), -(c0.fh * 0.22));
  nozzle(g, c0.hand[0], c0.hand[1], nz, 76, 12);
  const tipX = c0.hand[0] + Math.cos(nz) * 76, tipY = c0.hand[1] + Math.sin(nz) * 76;
  jet(g, tipX, tipY, X(98), Y(72), X(84), Y(43), t, { w: 12, seed: 23, splash: 0.8 });
  if (red === 'lead') redRing(g, 1060 - 5, 950 - 240 * 0.92, 40);
  puddle(g, 820, 1010, 160, 24, t, 8);
  embers(g, X(10), Y(44), 100 * k, 60 * k, t, { n: 60, seed: 41, size: 5 });
  if (p.labels !== false) tag(g, 1240, 930, 1360, 560, p.label ?? 'Hose lines', { size: 32, swing: 2, night, sub: p.sub ?? 'water from hydrants and the Seine' });
}
// 'side' chain view: the façade seen at an angle on the left, the chain receding from the portal to a cart in the foreground
function ffChainSide(g, t, p, { sky, night, red, u }) {
  const skyC = SKY[sky]?.[1] ?? P.night;
  backdrop(g, t, { sky, yH: 700, glow: 0.9, seed: 54 });
  const k = 15, ox = 40, oy = 810, fa = [0.66, -0.2];
  glowRings(g, 300, 120, 180, 1, t, 13, skyC, 200, { rise: 0.6 });
  plume(g, 330, 140, t, { H: 480, W: 80, n: 10, drift: 0.7, seed: 14, depth: 0.25, sky: skyC, base: '#8b8790', shadeCol: '#4a4652', lit: P.emberL, amount: 1, line: '#3d3a44' });
  g.save(); g.transform(fa[0], fa[1], 0, 1, ox, oy); facadeCard(g, 0, 0, k, { sky, fireS: fireSections(0.9), spire: 'gone', glow: 1 }, t);
  g.save(); poly([[0, 0], [0, -69 * k], [41 * k, -69 * k], [41 * k, 0]])(g); g.clip(); halftone(g, [0, -69 * k, 41 * k, 0], lampShade([0, -69 * k, 41 * k, 0], 0.05, 0.35, 0.3), '#4a4038', { pitch: 11 }); g.restore();
  g.restore();
  // the south flank recedes from the façade's far corner toward a vanishing point (wall, clerestory, burning roof)
  const cx = ox + 41 * k * fa[0], cy = oy + 41 * k * fa[1], VP = [1700, 720], toVP = (px, py, u2) => [lerp(px, VP[0], u2), lerp(py, VP[1], u2)];
  const wallTop = cy - 33 * k, roofTop = cy - 43 * k, U1 = 0.72;
  const wall = [[cx, cy], [cx, wallTop], toVP(cx, wallTop, U1), toVP(cx, cy, U1)];
  pen(g, poly(wall), { fill: '#a99e8b', lw: 3, breaks: false, highlight: false, shade: lampShade([cx, wallTop, 1920, cy], 0.15, 0.5, 0.2), shadeColor: '#6d6458', box: [cx, wallTop, 1920, cy] });
  const roof = [[cx, wallTop], [cx, roofTop], toVP(cx, roofTop, U1), toVP(cx, wallTop, U1)];
  pen(g, poly(roof), { fill: '#5b6478', lw: 3, breaks: false, highlight: false, shade: 0.4, shadeColor: '#3d4a60', box: [cx, roofTop, 1920, wallTop] });
  for (let j = 0; j < 9; j++) { const u0 = 0.04 + j * 0.072, u1b = u0 + 0.034, [ax, ay] = toVP(cx, wallTop + 6 * k, u0), [bx, by2] = toVP(cx, cy - 16 * k, u0), [ex2] = toVP(cx, wallTop, u1b);
    const w = Math.max(6, ex2 - ax); pen(g, poly(archPts(ax + w / 2, by2, w, ay + w * 0.6, w * 0.7, 5)), { fill: P.ember, lw: 2, breaks: false, highlight: false });
    const [px0, py0] = toVP(cx, wallTop, u0 - 0.012), [px1, py1] = toVP(cx, cy, u0 - 0.012), pw = 26 * (1 - u0 * 1.1); // a buttress pier between the windows
    pen(g, poly([[px0 - pw / 2, py0 + 6], [px0 + pw / 2, py0 + 6], [px1 + pw * 0.8, py1], [px1 - pw * 0.8, py1]]), { fill: '#8a8070', lw: 2, breaks: false, highlight: false }); }
  for (let j = 0; j < 12; j++) { const u0 = 0.02 + j * 0.055, [fx, fy] = toVP(cx, roofTop, u0), sc = 1 - u0 * 1.1; flame(g, fx, fy + 16 * sc, (120 + 90 * hash(j + 5)) * sc, 150 * sc, t, 90 + j, { lean: 0.35 }); }
  // the ground meets the façade's sheared base and the flank's receding base: clip the paving under both lines
  { const [wx, wy] = toVP(cx, cy, U1); g.save(); poly([[ox - 400, oy + 400 * 0.2], [ox, oy], [cx, cy], [wx, wy], [2200, wy], [2200, 1400], [-300, 1400]])(g); g.clip();
    paving(g, wy - 10, 1080, VP[0], VP[1] - 30, t, { seed: 11, W: 170 }); g.restore(); }
  litPatch(g, 560, 846, 420, 30, 1, t, 9);
  // the chain: positions along a receding curve; hands reach for whatever sits between neighbours
  const n = p.n ?? 9, P0 = (v) => [lerp(470, 1390, v), lerp(820, 1070, v ** 1.15)], H = (v) => lerp(120, 470, v ** 1.35);
  const pos = Array.from({ length: n }, (_, i) => { const v = i / (n - 1), [x, y] = P0(v); return { x, y, h: H(v), v }; });
  const handY = (f) => f.y - f.h * 0.6;
  const items = [['relic', u], ['box', u - 0.2], ['chalice', u - 0.36], ['frame', u + 0.17]].map(([kind, uu]) => [kind, uu]).filter(([, uu]) => uu >= 0 && uu <= 1);
  const itemAt = (uu) => { const f = uu * (n - 1), i = Math.min(n - 2, Math.floor(f)), fr = f - i, a = pos[i], b = pos[i + 1];
    return { i, fr, x: lerp(a.x + a.h * 0.22, b.x - b.h * 0.18, fr), y: lerp(handY(a), handY(b), fr) - Math.sin(fr * Math.PI) * lerp(a.h, b.h, fr) * 0.12, s: lerp(a.h, b.h, fr) / 300 }; };
  const its = items.map(([kind, uu]) => ({ kind, ...itemAt(uu) }));
  // cops and officials by the portal (ink, flat caps), small
  for (const [fx, fy, fh] of [[300, 818, 96], [395, 812, 92]]) figure(g, fx, fy, fh, { face: 1, col: P.ink, helmet: P.ink, band: P.tealL, lean: 0, armF: 10, armB: -8 });
  // the chain mixes firefighters (brass helmets) with police and officials (ink coats, flat caps); people turn to the side
  // they are receiving from, then swing to pass (face flips with the item)
  for (let i = 0; i < n; i++) { const f = pos[i], ph = Math.sin(twos(t) * 3 + i * 0.9), crew = i % 4 === 2 ? 'police' : i % 5 === 3 ? 'official' : 'ff';
    const give = its.find(o => o.i === i), take = its.find(o => o.i === i - 1), face = give ? 1 : take ? -1 : (i % 2 ? -1 : 1);
    const reach = (o) => [o.x, o.y + f.h * 0.03];
    const hf = give ? reach(give) : take ? reach(take) : [f.x + face * f.h * 0.2, handY(f) + f.h * 0.1 + f.h * 0.03 * ph];
    const hb = give ? [give.x - f.h * 0.06, give.y + f.h * 0.05] : take ? [take.x + f.h * 0.07, take.y + f.h * 0.06] : [f.x + face * f.h * 0.06, handY(f) + f.h * 0.16];
    const lk = crew === 'ff' ? {} : { col: crew === 'police' ? P.ink : '#4a5163', helmet: P.ink, band: crew === 'police' ? P.tealL : P.ink40 };
    figure(g, f.x, f.y, f.h * (crew === 'ff' ? 1 : 0.96), { face, lean: (give || take ? 10 : 3) + 2 * ph, legF: 14, legB: -16, kneeF: 12, kneeB: 4, handF: hf, handB: hb, tank: crew === 'ff' && i % 3 === 1, glint: crew === 'ff' ? 1 : 0, ...lk }); }
  for (const o of its) { const s = o.s * 1.1;
    if (o.kind === 'relic') reliquary(g, o.x, o.y, 26 * s + 6, t, red === 'relic');
    else if (o.kind === 'box') pen(g, rect(o.x - 26 * s, o.y - 20 * s, 52 * s, 40 * s), { fill: P.brassL, lw: 2, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [o.x - 26 * s, o.y - 20 * s, o.x + 26 * s, o.y + 20 * s] });
    else if (o.kind === 'frame') { pen(g, rect(o.x - 36 * s, o.y - 46 * s, 72 * s, 60 * s), { fill: P.brassL, lw: 2, breaks: false, highlight: false }); pen(g, rect(o.x - 26 * s, o.y - 37 * s, 52 * s, 42 * s), { fill: P.ink70, lw: 1.5, breaks: false, highlight: false }); }
    else pen(g, poly([[o.x - 10 * s, o.y - 24 * s], [o.x + 10 * s, o.y - 24 * s], [o.x + 4 * s, o.y], [o.x + 4 * s, o.y + 12 * s], [o.x + 12 * s, o.y + 18 * s], [o.x - 12 * s, o.y + 18 * s], [o.x - 4 * s, o.y + 12 * s], [o.x - 4 * s, o.y]]), { fill: P.brass, lw: 2, breaks: false, highlight: false }); }
  puddle(g, 820, 1000, 120, 18, t, 12);
  handCart(g, 1500, 1080, 0.95, t);
  hoseLine(g, [[-60, 1050], [120, 1040], [260, 1000], [360, 1050], [500, 1090]], 20, { couplings: [2] }); // a dead hose across the foreground (layer 0)
  embers(g, 150, 700, 1700, 700, t, { n: 46, seed: 33, size: 5 });
  const relic = its.find(o => o.kind === 'relic');
  if (p.labels !== false && relic) tag(g, relic.x, relic.y - 30, 1240, 250, p.label ?? 'The Crown of Thorns', { size: 32, swing: 2, night, sub: p.sub ?? 'carried out by a human chain' });
}
// a sleeve + gloved hand (paper cut): from the sleeve root (x0, y0) to the palm (x1, y1); reflective bands, cuff, mitten + thumb
function sleeveHand(g, x0, y0, x1, y1, w, { face = 1, t = 0, col = P.ink70 } = {}) {
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
  g.save(); g.translate(x0, y0); g.rotate(a);
  g.save(); g.translate(16, 22); g.fillStyle = 'rgba(11,20,38,0.25)'; g.beginPath(); g.roundRect(-40, -w / 2, L + 40, w, w * 0.3); g.fill(); g.restore();
  pen(g, rrect(-60, -w / 2, L - w * 0.35 + 60, w, w * 0.22), { fill: col, lw: 4, breaks: false, highlight: true, shade: (xx, yy) => clamp(0.1 + (yy / w + 0.5) * 0.45), shadeColor: mix(col, P.ink, 0.5), box: [-60, -w / 2, L, w / 2] });
  for (const u of [0.38, 0.62]) { g.fillStyle = P.brassL; g.fillRect(-60 + (L + 60) * u, -w / 2 + 3, w * 0.22, w - 6); g.fillStyle = 'rgba(247,246,241,0.55)'; g.fillRect(-60 + (L + 60) * u + w * 0.05, -w / 2 + 3, w * 0.05, w - 6); }
  pen(g, rrect(L - w * 0.62, -w * 0.56, w * 0.36, w * 1.12, w * 0.12), { fill: mix(col, P.ink, 0.45), lw: 3, breaks: false, highlight: false }); // cuff
  g.translate(L, 0);
  // the mitten: palm + four-finger block curled over, thumb on top (face: which side the thumb sits)
  pen(g, rrect(-w * 0.32, -w * 0.5, w * 0.92, w * 0.95, w * 0.34), { fill: P.ink, lw: 3, breaks: false, highlight: false, mis: [3, 2] });
  pen(g, pill(w * 0.2, -w * 0.52 * face, w * 0.62, w * 0.3), { fill: P.ink, line: P.ink70, lw: 2, breaks: false, highlight: false, mis: [2, 1.5] });
  g.strokeStyle = P.brassL; g.lineWidth = 2.5; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(-w * 0.2, -w * 0.32); g.quadraticCurveTo(w * 0.35, -w * 0.4, w * 0.48, 0); g.stroke(); g.setLineDash([]);
  g.restore();
}
// 'close' chain view: an insert on two gloved hands passing the reliquary in front of the central portal; inside the
// portal the chain carries on in silhouette (depth), embers and a smoke band cross the top
function ffChainClose(g, t, p, { sky, night, red, u }) {
  backdrop(g, t, { sky, yH: 300, glow: 0.9, seed: 55, roofs: false });
  const k = 60, ox = 960 - 20.5 * k, oy = 1190;
  facadeCard(g, ox, oy, k, { sky, fireS: fireSections(0.9), spire: 'gone', glow: 1 }, t);
  // inside the central doorway: the chain carries on in silhouette, lit from above by the fire
  g.save(); poly(archPts(ox + 20.5 * k, oy, 10.2 * k * 0.52, oy - (17 * 0.85 - 10.2 * 0.52 * 0.95) * k, 10.2 * 0.52 * 0.95 * k, 8))(g); g.clip();
  litPatch(g, ox + 20.5 * k, oy - 0.5 * k, 3.4 * k, 0.4 * k, 1, t, 21, '#3b3a3c');
  for (let i = 0; i < 6; i++) { const fx = ox + 17.6 * k + i * 1.1 * k + Math.sin(twos(t) * 2 + i) * 4, fh = 250 + (i % 2) * 16;
    figure(g, fx, oy - 1.5 * k, fh, { face: 1, col: '#22262f', band: P.emberD, helmet: '#5b4a3a', lean: 6 + 3 * Math.sin(twos(t) * 3 + i), armF: 75, armB: 55, legF: 6, legB: -6 }); }
  embers(g, ox + 17 * k, oy - 1.5 * k, 7 * k, 500, t, { n: 24, seed: 3, size: 5 });
  g.restore();
  plume(g, -200, 150, t, { H: 120, W: 70, n: 7, drift: 2.6, seed: 18, depth: 0.15, sky: '#5a6283', base: '#8b8790', shadeCol: '#4a4652', lit: P.emberL, amount: 1, line: '#3d3a44', style: 'lean' });
  // the pass: the reliquary travels a little from the left hands to the right hands as u runs 0 -> 1
  const v = M.E.inOutSine(clamp(u * 1.3 - 0.15)), R = 104, rx = lerp(900, 1020, v), ry = 600 - Math.sin(v * Math.PI) * 24 + Math.sin(t * 1.7) * 3;
  const gl = 1 - v * 0.5, gr = 0.5 + v * 0.5; // grip share (the giving hand eases off)
  sleeveHand(g, -140, 1000 + 40 * (1 - gl), rx - R - 34 - 30 * (1 - gl), ry + 16, 150, { face: 1, t });
  reliquary(g, rx, ry, R, t, red === 'relic');
  sleeveHand(g, 2080, 1010 + 40 * (1 - gr), rx + R + 34 + 30 * (1 - gr), ry + 22, 150, { face: -1, t });
  embers(g, 0, 1080, 1920, 700, t, { n: 30, seed: 7, size: 6 });
  if (p.labels !== false) tag(g, rx - 20, ry - R * 1.75, 160, 250, p.label ?? 'The Crown of Thorns', { size: 34, swing: -2, night, sub: p.sub ?? 'passed hand to hand' });
}
// ================================================================= SET: firefighters (hose lines, the human chain, the tower climb)
async function firefighters(ctx, shot) {
  const L0 = canvasLayer(ctx); const p = shot.params ?? {};
  const mode = p.mode ?? 'hose', sky = p.sky ?? 'night', night = sky !== 'day';
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; smokeFor(p, shot); applyCam(g, s, camAt(p, t), t); g.clearRect(-200, -200, 2400, 1500);
    let u = p.u ?? 0.5; if (p.uAt != null) u = range(t, p.uAt, p.uAt + (p.uDur ?? 4));
    const tw2 = twos(t), red = p.red ?? (mode === 'chain' ? 'relic' : 'lead');
    if (mode === 'stair') {
      backdrop(g, t, { sky, yH: 1000, glow: 0.8, seed: 41 });
      glowRings(g, 1300, 300, 260, 1, t, 6, SKY[sky]?.[1] ?? P.night, 200);
      // the south tower opened as a paper toy: a switchback stair inside, ~20 figures climbing toward the belfry
      const x0 = 640, y0 = 70, w = 640, h = 1100;
      const inside = (gg, a0, b0, a1, b1) => {
        const fl = 7, fh = (b1 - b0) / fl, pts = [];
        for (let i = 0; i <= fl; i++) pts.push([i % 2 ? a1 - 60 : a0 + 60, b1 - i * fh]);
        // the stair flights: card strips with tread ticks
        for (let i = 0; i < fl; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[i + 1]; beam(gg, [xa, ya], [xb, yb], 18, { col: OAK.L, lw: 2 });
          gg.strokeStyle = P.ink; gg.lineWidth = 1.5; gg.beginPath(); for (let j = 1; j < 14; j++) { const v = j / 14, x = lerp(xa, xb, v), y = lerp(ya, yb, v); gg.moveTo(x, y - 9); gg.lineTo(x + (xb > xa ? -8 : 8), y + 9); } gg.stroke(); }
        // smoke inside the stairwell, top
        for (let i = 0; i < 5; i++) puff(gg, a0 + (a1 - a0) * (i + 0.5) / 5 + Math.sin(t + i) * 10, b0 + 40 + (i % 2) * 30, 50, 500 + i, { fill: '#5a5560', shadeCol: '#2c2a30', line: null, shade: 0.5, lit: P.emberD, litA: 0.7 });
        const L = pathLen(pts), n = p.n ?? 20;
        for (let i = 0; i < n; i++) { const d = clamp(u * 1.25 - i * 0.045) * L * 0.97 + 10; const [x, y, a] = pathAt(pts, d), face = Math.cos(a) >= 0 ? 1 : -1, ph = (tw2 * 2 + i * 0.37) % 1;
          if (i === 0 && red === 'lead') redRing(gg, x, y - 60, 30);
          figure(gg, x, y - 8, 64, { face, lean: 12, armF: 40 + 25 * Math.sin(ph * TAU), armB: -30, legF: 25 * Math.sin(ph * TAU), legB: -25 * Math.sin(ph * TAU), glint: 1, helmet: i === 0 && red === 'lead' ? P.red : P.brass }); }
      };
      cardTower(g, x0, y0, w, h, { open: p.open ?? 1, night, belfryTop: 0.0, belfryBot: 0.86, inside, louvers: true, t });

      if (p.labels !== false) tag(g, x0 + w, y0 + 300, x0 + w + 180, y0 + 200, 'About 20 firefighters', { size: 32, swing: -2, night, sub: 'up the tower stairs (AFP)' });
      // count card (tally blocks: 4 groups of 5 = 20)
      pen(g, rect(110, 760, 400, 170), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false }); mono(g, '1 TALLY = 1 FIREFIGHTER', 130, 795, 18, P.ink);
      for (let gi = 0; gi < 4; gi++) { for (let i = 0; i < 4; i++) { pen(g, pill(140 + gi * 92 + i * 16, 872, 12, 40), { fill: P.ink70, lw: 1.6, breaks: false, highlight: false, mis: [2, 1.5] }); g.fillStyle = P.brass; g.beginPath(); g.arc(140 + gi * 92 + i * 16, 850, 6, Math.PI, 0); g.fill(); }
        g.save(); g.translate(140 + gi * 92 + 24, 872); g.rotate(-62 * D); pen(g, pill(0, 0, 11, 72), { fill: P.ink, lw: 1.6, breaks: false, highlight: false, mis: [2, 1.5] }); g.restore(); }
      mono(g, p.countSub ?? '≈ 20 OF NEARLY 500', 130, 918, 18, P.ink70);
    } else if ((p.view ?? (mode === 'hose' ? 'low' : 'side')) !== 'wide') {
      // hose views 'low' (default) / 'side', chain views 'side' (default) / 'close'; 'wide' is the original centred parvis
      const view = p.view ?? (mode === 'hose' ? 'low' : 'side'), o = { sky, night, red, u };
      if (mode === 'hose') (view === 'side' ? ffHoseSide : ffHoseLow)(g, t, p, o); else (view === 'close' ? ffChainClose : ffChainSide)(g, t, p, o);
    } else {
      // hose / chain: the parvis at night, the façade card burning behind (mid layer), figures in front
      backdrop(g, t, { sky, yH: 760, glow: 0.9, seed: 51 });
      const k = 7.0, ox = mode === 'chain' ? 980 : 1050, oy = 720, st = { sky, fireS: fireSections(0.9), roofGone: 0.6, spire: 'gone', glow: 1, wind: 0.4, smoke: 1 };
      glowRings(g, ox + 20.5 * k, oy - 58 * k, 40 * k, 1, t, 2, SKY[sky]?.[1] ?? P.night, 30 * k);
      plume(g, ox + 20 * k, oy - 52 * k, t, { H: 560, W: 70, n: 10, drift: 0.5, seed: 12, depth: 0.3, sky: SKY[sky]?.[1], base: '#8b8790', shadeCol: '#4a4652', lit: P.emberL, amount: 1, line: '#3d3a44' });
      for (let j = 0; j < 4; j++) flame(g, ox + (15 + j * 3.6) * k, oy - 48.5 * k, (8 + 6 * hash(j)) * k, 4 * k, t, 70 + j, { lean: 0.3 });
      facadeCard(g, ox, oy, k, st, t);
      // parvis paving (perspective lines) layer 1 floor
      pen(g, rect(-40, oy, 2000, 400), { fill: '#6d6156', lw: 2.5, breaks: false, highlight: false });
      g.save(); g.strokeStyle = rgba('#3a3632', 0.7); g.lineWidth = 1.5; g.beginPath(); for (let i = -30; i <= 30; i++) { g.moveTo(960 + i * 40, oy); g.lineTo(960 + i * 140, 1100); } for (let y = oy + 20, d = 18; y < 1100; y += d, d *= 1.18) { g.moveTo(-40, y); g.lineTo(1960, y); } g.stroke(); g.restore();
      // fire light on the paving: flat ember wash band (hard edge)
      litPatch(g, ox + 20 * k, oy + 30, 520, 60, 1, t, 2);
      if (mode === 'hose') {
        // the pump engine (card truck, ink body, brass ladder) at left; hoses snake to the line of figures; water arcs to the roof
        const tx = 120, ty = 940;
        pen(g, rrect(tx, ty - 120, 330, 120, 8), { fill: P.ink, lw: 3, shadow: true, breaks: false, highlight: false }); pen(g, rrect(tx + 330, ty - 90, 90, 90, 8), { fill: P.ink, lw: 3, breaks: false, highlight: false });
        pen(g, rect(tx + 345, ty - 78, 60, 34), { fill: P.tealL, lw: 2, breaks: false, highlight: false }); pen(g, rect(tx + 20, ty - 150, 290, 22), { fill: P.brassL, lw: 2, breaks: false, highlight: false });
        g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); for (let x = tx + 30; x < tx + 300; x += 18) { g.moveTo(x, ty - 150); g.lineTo(x, ty - 128); } g.stroke();
        for (const wx of [tx + 70, tx + 260, tx + 380]) { pen(g, circle(wx, ty, 30), { fill: P.ink70, lw: 3, breaks: false, highlight: false }); pen(g, gearPath(wx, ty, 16, 8, t * 0), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); }
        const n = p.n ?? 6, hose = [];
        for (let i = 0; i < n; i++) hose.push([560 + i * 150, 900 - i * 14 + Math.sin(i * 1.7) * 10]);
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; const hp = [[tx + 420, ty - 30], [500, 960], ...hose];
        g.strokeStyle = P.ink; g.lineWidth = 16; g.beginPath(); hp.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, ...q)); g.stroke(); g.strokeStyle = P.teal; g.lineWidth = 10; g.stroke();
        g.strokeStyle = P.tealL; g.lineWidth = 3; g.setLineDash([14, 22]); g.lineDashOffset = -t * 60; g.stroke(); g.restore();
        hose.forEach(([x, y], i) => figure(g, x, y + 46, 120, { face: 1, lean: -8 + Math.sin(tw2 * 2 + i) * 2, armF: 70, armB: 50, legF: 18, legB: -22, glint: 1, helmet: i === n - 1 && red === 'lead' ? P.red : P.brass }));
        // water: three teal dashed arcs from the nozzle to the roof (paper droplets, no glow)
        const [nx2, ny2] = hose[n - 1];
        g.save(); g.lineCap = 'round'; for (let j = 0; j < 3; j++) { g.strokeStyle = j === 1 ? P.tealL : P.teal; g.lineWidth = 7 - j * 1.5; g.setLineDash([18, 10]); g.lineDashOffset = -t * 120 - j * 9; g.beginPath(); g.moveTo(nx2 + 40, ny2 - 60); g.quadraticCurveTo(nx2 + 120 + j * 30, ny2 - 620, ox + (24 + j * 6) * k, oy - 46 * k); g.stroke(); } g.restore();
        if (red === 'lead') redRing(g, nx2 + 4, ny2 - 52, 30);
        if (p.labels !== false) tag(g, 500, 960, 300, 600, 'Hose line', { size: 30, swing: -3, night, sub: 'water from hydrants and the Seine' });
      } else {
        // the human chain: figures pass objects from the portal to a cart; the reliquary (red ring) travels along
        const n = p.n ?? 11, xs = Array.from({ length: n }, (_, i) => 1180 - i * 98), y = 960;
        const items = [['relic', u], ['box', u - 0.18], ['chalice', u - 0.33], ['box', u + 0.2]];
        xs.forEach((x, i) => { const ph = Math.sin(tw2 * 3 + i * 0.9); figure(g, x, y - (i % 2) * 10, 150, { face: -1, lean: 6 * ph, armF: 80 + 30 * ph, armB: 60 - 20 * ph, legF: 10, legB: -12, glint: 1 }); });
        for (const [kind, uu] of items) { if (uu < 0 || uu > 1) continue; const f = uu * (n - 1), i = Math.floor(f), fr = f - i, x = lerp(xs[i], xs[Math.min(n - 1, i + 1)], fr), yy = y - 150 * 0.62 - Math.sin(fr * Math.PI) * 26 - (i % 2) * 10;
          if (kind === 'relic') { pen(g, circle(x, yy, 22), { fill: null, line: P.ink, lw: 9 }); g.save(); g.strokeStyle = red === 'relic' ? P.red : P.brass; g.lineWidth = 6; g.beginPath(); g.arc(x, yy, 22, 0, TAU); g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 1.5; for (let a = 0; a < 16; a++) { const aa = a / 16 * TAU; g.beginPath(); g.moveTo(x + Math.cos(aa) * 18, yy + Math.sin(aa) * 18); g.lineTo(x + Math.cos(aa + 0.2) * 28, yy + Math.sin(aa + 0.2) * 28); g.stroke(); } g.restore(); if (red === 'relic') redRing(g, x, yy, 40); }
          else if (kind === 'box') pen(g, rect(x - 22, yy - 16, 44, 32), { fill: P.brassL, lw: 2, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [x - 22, yy - 16, x + 22, yy + 16] });
          else pen(g, poly([[x - 10, yy - 22], [x + 10, yy - 22], [x + 4, yy], [x + 4, yy + 12], [x + 12, yy + 18], [x - 12, yy + 18], [x - 4, yy + 12], [x - 4, yy]]), { fill: P.brass, lw: 2, breaks: false, highlight: false }); }
        pen(g, rrect(80, 860, 170, 90, 6), { fill: P.kraft, lw: 2.5, shadow: true, breaks: false, highlight: false, hatched: true, box: [80, 860, 250, 950] }); for (const wx of [110, 220]) pen(g, circle(wx, 955, 18), { fill: P.ink70, lw: 2.5, breaks: false, highlight: false });
        if (p.labels !== false) tag(g, xs[Math.max(0, Math.floor(u * (n - 1)))], y - 140, 1320, 230 + 0, 'The Crown of Thorns', { size: 30, swing: 2, night, sub: 'carried out by a human chain' });
      }
      foreQuay(g, t, 1040, { night, glow: 0.8, crowd: false });
    }
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock !== null) counterBadge(g, 96, 72, p.clock ?? (mode === 'stair' ? '21:05' : '19:30'), { t, night });
    fibre(g, night ? 0.06 : 0.09); sourceSlip(g, p.source ?? (mode === 'stair' ? 'ILLUSTRATION · ROUTE TO BE VERIFIED (BSPP / NYT)' : 'ILLUSTRATION'));
  } };
}

// ================================================================= exports
export const KIT = { OAK, figure, bellPath, BELLS, P, MIS, TAU, D, mix, tick, camBreath, pen, halftone, hatch, deckle, lampShade, poly, rect, rrect, circle, pill, gearPath, archPts,
  mono, tag, coil, redRing, flame, puff, plume, embers, fibre, counterBadge, rooftops, trees, tallyCrowd, seine, quay, skyBands, glowRings, lampPool, ruler,
  facadeCard, sideCard, spire, sideFire, fireSections, looks, canvasLayer, applyCam, camAt, anim, range, sourceLine,
  // additive (round 2): more of the set internals, for nd-graphics.js and other runtimes
  cardTower, bellFrameInside, sourceSlip, backdrop, foreQuay, odoCounter: counter, drum, odo, mainspring, bell, beam, SKY, ND,
  paving, puddle, hoseLine, jet, nozzle, ladderTruck, hydrant, handCart, reliquary, sleeveHand, litPatch, smokeFor, shotSeed, loadInter, thumbComp, thumbBelfry, twos };
export const SETS = { cathedral, forest, spireFall, bellFrame, clock, paris, firefighters };
export default function makeNotreDameSets() { return { ...SETS }; }
