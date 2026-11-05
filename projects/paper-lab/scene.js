// PAPER LAB: proof frames for "Paper & Spring" (docs/library/animation-study/STYLE-BIBLE.md §19).
// Every helper here is the first draft of the sets/paper kit the bible lists in §17: penShape (off-register
// pen line), halftone (world- or screen-fixed dot screen), hatch, deckle, castShadow, gear, winder, tag.
// All drawing is in 1920x1080 stage units on a 2D canvas in the overlay; pure functions of t and seeds.
import * as THREE from 'three';
import * as M from '/engine/motion.js';

const P = {
  paper: '#f7f6f1', card: '#ebe8de', kraft: '#dcd7c8',
  ink: '#14233d', ink70: '#3d4a60', ink40: '#8a93a3',
  tealL: '#8cc5bf', teal: '#2a8c86', tealD: '#1d6662',
  sageL: '#d3e2d5', sage: '#a9c5ae', sageD: '#6f9a7a',
  brassL: '#e3cc98', brass: '#b98a3e', brassD: '#7d5a22',
  red: '#e0241b', redD: '#9e1a14',
  night: '#14233d', nightL: '#22355a', nightD: '#0b1426',
};
const MIS = [4, 3];             // the episode's press-misregistration vector (stage px)
const TAU = Math.PI * 2, D = Math.PI / 180;

// ---------------------------------------------------------------- canvas layer
function layerOf(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function canvasLayer(ctx) {
  const layer = layerOf(ctx.overlay), cv = document.createElement('canvas');
  cv.width = ctx.width; cv.height = ctx.height; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  layer.appendChild(cv); return { layer, cv, g: cv.getContext('2d'), s: ctx.width / 1920 };
}

// ---------------------------------------------------------------- paper ground (world-fixed fibre)
let FIBRE = null;
function fibreTile() {
  if (FIBRE) return FIBRE;
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), im = x.createImageData(512, 512), r = M.rng(11);
  for (let i = 0; i < im.data.length; i += 4) { const v = 255 - Math.floor(r() * 26); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  x.strokeStyle = 'rgba(60,60,60,0.5)'; x.lineWidth = 0.8;
  for (let k = 0; k < 14; k++) { const a = r() * TAU, cx = r() * 512, cy = r() * 512, L = 20 + r() * 50; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a + 0.4) * L / 2, cy + Math.sin(a + 0.4) * L / 2, cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke(); }
  return (FIBRE = c);
}
function paperGround(g, col = P.paper, fibre = 0.04) {
  g.fillStyle = col; g.fillRect(-4000, -4000, 9920, 9080);
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = fibre / 0.1 * 0.1 * 2.2; // tile is ~5 % dark on average
  g.fillStyle = g.createPattern(fibreTile(), 'repeat'); g.fillRect(-4000, -4000, 9920, 9080); g.restore();
}

// ---------------------------------------------------------------- primitives
const pill = (x, y, w, h) => (g) => { g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2); };
const rrect = (x, y, w, h, r = 6) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const circle = (x, y, r) => (g) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
const poly = (pts) => (g) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0], p[1])); g.closePath(); };
// deckle: a seeded irregular edge on a polygon (fixed per object, so it never shimmers)
function deckle(pts, seed, amp = 2.2, step = 9) {
  const r = M.rng(seed), out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let k = 0; k < n; k++) { const u = k / n, j = (r() - 0.5) * 2 * amp; out.push([a[0] + (b[0] - a[0]) * u + nx * j, a[1] + (b[1] - a[1]) * u + ny * j]); }
  }
  return out;
}
// gear outline with trapezoid teeth and a hub hole (even-odd)
function gearPath(cx, cy, r, n, ang = 0, depth = null, hole = 0.28) {
  depth = depth ?? Math.max(8, r * 0.16);
  return (g) => {
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = ang + i / n * TAU, w = TAU / n;
      const pts = [[a0, r - depth], [a0 + w * 0.12, r], [a0 + w * 0.42, r], [a0 + w * 0.54, r - depth]];
      pts.forEach(([a, rr], k) => { const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; (i === 0 && k === 0 ? g.moveTo : g.lineTo).call(g, x, y); });
    }
    g.closePath();
    g.moveTo(cx + r * hole, cy); g.arc(cx, cy, r * hole, 0, TAU, true);
  };
}

// halftone dot screen inside the current clip. density(x, y) in 0..1 (area coverage).
// world: dots on the world grid (they scale with the camera). screen: dots on a fixed screen grid.
function halftone(g, box, density, color, { pitch = 11, angle = 45, screen = false, s = 1 } = {}) {
  g.save();
  const m = g.getTransform();
  let [x0, y0, x1, y1] = box;
  if (screen) { // map the box to device px, draw the grid there in stage px at the base scale
    const a = m.transformPoint(new DOMPoint(x0, y0)), b = m.transformPoint(new DOMPoint(x1, y1));
    g.setTransform(s, 0, 0, s, 0, 0); [x0, y0, x1, y1] = [a.x / s, a.y / s, b.x / s, b.y / s];
  }
  const inv = screen ? new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]).inverse() : null;
  const ca = Math.cos(angle * D), sa = Math.sin(angle * D), cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const n = Math.ceil(R / pitch) + 1;
  g.fillStyle = color;
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    // grid anchored at the origin so pitch phase is stable as objects move
    const gx = Math.round(cxm / pitch) * pitch, gy = Math.round(cym / pitch) * pitch;
    const x = gx + (i * ca - j * sa) * pitch, y = gy + (i * sa + j * ca) * pitch;
    if (x < x0 - pitch || x > x1 + pitch || y < y0 - pitch || y > y1 + pitch) continue;
    let d;
    if (screen) { const w = inv.transformPoint(new DOMPoint(x * s, y * s)); d = density(w.x, w.y); } else d = density(x, y);
    if (d <= 0.01) continue;
    const rr = pitch * Math.sqrt(Math.min(1, d) / Math.PI);
    g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  }
  g.restore();
}
function hatch(g, box, { gap = 7, lw = 1.25, color = P.ink40, angle = 45 } = {}) {
  const [x0, y0, x1, y1] = box, L = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ca = Math.cos(angle * D), sa = Math.sin(angle * D);
  g.save(); g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
  for (let k = -L; k <= L; k += gap) { const px = cx - sa * k, py = cy + ca * k; g.moveTo(px - ca * L, py - sa * L); g.lineTo(px + ca * L, py + sa * L); }
  g.stroke(); g.restore();
}
// lamp at 10 o'clock: shade rises towards the bottom-right of the box
const lampShade = (box, lo = 0, hi = 0.5, from = 0.45) => (x, y) => {
  const [x0, y0, x1, y1] = box, u = ((x - x0) / (x1 - x0) + (y - y0) / (y1 - y0)) / 2;
  return lo + (hi - lo) * M.clamp((u - from) / (1 - from));
};

// the off-register pen shape: [shadow] -> fill (shifted by MIS) [+ halftone, hatch] -> pen line (not shifted)
function pen(g, build, o = {}) {
  const { fill = null, line = P.ink, lw = 3, mis = MIS, shade = 0, shadeColor = null, box = null, hatched = false, shadow = false,
    breaks = true, screenDots = false, s = 1, pitch = 11, highlight = true } = o;
  if (shadow) { g.save(); g.translate(10, 12); build(g); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(20,35,61,0.12)'; g.fill('evenodd'); g.restore(); }
  if (fill) {
    g.save(); g.translate(mis[0], mis[1]); build(g); g.fillStyle = fill; g.fill('evenodd');
    if ((shade || hatched) && box) {
      g.clip('evenodd');
      if (hatched) hatch(g, box);
      if (shade) halftone(g, box, typeof shade === 'function' ? shade : lampShade(box, 0, shade), shadeColor ?? fill, { s, screen: screenDots, pitch });
    }
    g.restore();
  }
  if (line) {
    g.save(); build(g); g.strokeStyle = line; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
    if (breaks) g.setLineDash([340, 9, 120, 12]);
    g.stroke(); g.restore();
  }
  if (highlight && fill && box && box[2] - box[0] > 80) { // one paper stroke inside the lamp-side (top-left) edge
    g.save(); g.translate(mis[0], mis[1]); build(g); g.clip('evenodd'); g.translate(6, 6); build(g);
    g.strokeStyle = 'rgba(247,246,241,0.75)'; g.lineWidth = 3; g.stroke(); g.restore();
  }
}

// ---------------------------------------------------------------- characters
// THE WINDER. pose: { lean, headDx, headDy, armF, armB (deg from straight down, + = forward), legF, legB, sq (squash),
// key (deg), keyBlur (0..1 motion arcs), lift (px off the ground), face: 1 right / -1 left, armBend }
const POSES = {
  idle: { lean: 0, armF: 12, armB: -10, legF: 6, legB: -6, gaze: 0 },
  slump: { lean: 14, headDx: 0.10, headDy: 0.10, armF: 18, armB: 14, legF: 4, legB: -2, sq: 0.94, key: 64, gaze: 80 },
  panic: { lean: -8, armF: 158, armB: -150, legF: 26, legB: -24, lift: 0.07, keyBlur: 1, sq: 1.05, gaze: -70 },
  proud: { lean: -7, headDy: -0.03, armF: 135, armB: -18, legF: 10, legB: -10, sq: 1.04, gaze: -25 },
  shrug: { lean: 0, headDy: 0.06, armF: 75, armB: -75, legF: 5, legB: -5, sq: 0.98, armBend: -105, gaze: null },
  lookback: { lean: 4, headDx: -0.04, armF: 8, armB: -4, legF: 4, legB: -4, key: 40, keyBlur: -1, gaze: 175, dial: true },
};
function winder(g, x, y, h, pose = POSES.idle, o = {}) {
  const p = { lean: 0, headDx: 0, headDy: 0, armF: 10, armB: -10, legF: 6, legB: -6, sq: 1, key: 0, keyBlur: 0, lift: 0, face: 1, armBend: 0, gaze: 0, dial: true, ...pose, ...o };
  const bh = 0.5 * h * p.sq, bw = 0.5 * h / 1.7 / Math.sqrt(p.sq), hd = 0.62 * (0.5 * h / 1.7) * 1.55, legL = 0.27 * h, lw = h > 200 ? 3 : 2;
  g.save(); g.translate(x, y - p.lift * h); g.scale(p.face, 1);
  if (o.contact !== false) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(20,35,61,${p.lift ? 0.10 : 0.18})`; g.beginPath(); g.ellipse(6 / p.face, p.lift * h, bw * 1.2, bw * 0.22, 0, 0, TAU); g.fill(); g.restore(); }
  const limb = (px, py, ang, len, w, col, bend = 0) => {
    g.save(); g.translate(px, py); g.rotate(-ang * D);
    if (!bend) pen(g, pill(0, len / 2 - w / 2, w, len), { fill: col, lw, breaks: false, highlight: false });
    else { pen(g, pill(0, len * 0.26, w, len * 0.55), { fill: col, lw, breaks: false, highlight: false }); g.translate(0, len * 0.5); g.rotate(bend * D); pen(g, pill(0, len * 0.22, w, len * 0.5), { fill: col, lw, breaks: false, highlight: false }); }
    g.restore();
  };
  // legs from the hip
  limb(-bw * 0.18, -legL, p.legB, legL + 2, bw * 0.34, P.tealD);
  // body pivots at the hip
  g.save(); g.translate(0, -legL); g.rotate(p.lean * D);
  limb(-bw * 0.05, -bh * 0.78, p.armB, bh * 0.62, bw * 0.3, P.tealD, -p.armBend);
  // the key in the back (three lobes), on the body's back side
  g.save(); g.translate(-bw * 0.5, -bh * 0.55); g.rotate(p.key * D);
  const kr = h * 0.075;
  pen(g, rrect(-kr * 1.4, -kr * 0.16, kr * 1.4, kr * 0.32, 3), { fill: P.brass, lw: lw - 0.5, breaks: false, highlight: false });
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + Math.PI / 2; pen(g, circle(-kr * 1.4 + Math.cos(a) * kr * 0.55 - kr * 0.4, Math.sin(a) * kr * 0.55, kr * 0.42), { fill: P.brass, lw: lw - 0.5, breaks: false, highlight: false }); }
  g.restore();
  if (p.keyBlur) { // motion arcs, not blur: three concentric arc strokes behind the key
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 1.6; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const rr = h * (0.13 + i * 0.035); g.beginPath(); const a0 = p.keyBlur > 0 ? 1.0 : 3.4; g.arc(-bw * 0.5 - h * 0.1, -bh * 0.55, rr, a0, a0 + 1.6); g.stroke(); }
    // direction ticks: a small arrowhead on the outer arc
    const rr = h * 0.2, a = (p.keyBlur > 0 ? 2.6 : 3.4), ax = -bw * 0.5 - h * 0.1 + Math.cos(a) * rr, ay = -bh * 0.55 + Math.sin(a) * rr;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 8 * Math.sign(p.keyBlur), ay - 8); g.moveTo(ax, ay); g.lineTo(ax + 9 * Math.sign(p.keyBlur), ay + 5); g.stroke();
    g.restore();
  }
  const bodyBox = [-bw / 2, -bh, bw / 2, 0];
  pen(g, pill(0, -bh / 2, bw, bh), { fill: P.teal, lw, shade: 0.5, shadeColor: P.tealD, box: bodyBox, breaks: false });
  // head
  pen(g, circle(bw * 0.06 + p.headDx * h, -bh - hd * 0.42 + p.headDy * h, hd / 2), { fill: P.card, lw, shade: 0.4, shadeColor: P.kraft,
    box: [bw * 0.06 + p.headDx * h - hd / 2, -bh - hd * 0.92 + p.headDy * h, bw * 0.06 + p.headDx * h + hd / 2, -bh + hd * 0.08 + p.headDy * h], breaks: false });
  // the dial head: four ink-40 ticks and ONE hand = where the Winder is looking (null = looking at us: pin only)
  if (p.dial) {
    const hx = bw * 0.06 + p.headDx * h, hy = -bh - hd * 0.42 + p.headDy * h, hr = hd / 2;
    g.save(); g.translate(hx + MIS[0] * 0, hy); g.strokeStyle = P.ink40; g.lineWidth = Math.max(1.25, h / 260); g.lineCap = 'round';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * hr * 0.72, Math.sin(a) * hr * 0.72); g.lineTo(Math.cos(a) * hr * 0.86, Math.sin(a) * hr * 0.86); g.stroke(); }
    if (p.gaze != null) { const a = (p.gaze - p.lean) * D; g.strokeStyle = P.ink; g.lineWidth = Math.max(2.5, h / 70); g.beginPath(); g.moveTo(-Math.cos(a) * hr * 0.15, -Math.sin(a) * hr * 0.15); g.lineTo(Math.cos(a) * hr * 0.66, Math.sin(a) * hr * 0.66); g.stroke(); }
    g.fillStyle = P.brass; g.beginPath(); g.arc(0, 0, Math.max(2.5, hr * 0.12), 0, TAU); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 1.25; g.stroke();
    g.restore();
  }
  limb(bw * 0.12, -bh * 0.78, p.armF, bh * 0.62, bw * 0.3, P.teal, p.armBend);
  g.restore();
  limb(bw * 0.18, -legL, p.legF, legL + 2, bw * 0.34, P.teal);
  g.restore();
}
// TALLY: a sage pill with a paper head dot. lean = deg
function tally(g, x, y, { col = P.sage, lean = 0, hollow = false, sc = 1, line = P.ink } = {}) {
  g.save(); g.translate(x, y); g.rotate(lean * D); g.scale(sc, sc);
  pen(g, pill(0, -17, 12, 34), { fill: hollow ? P.paper : col, line, lw: 1.6, breaks: false, highlight: false, mis: [2, 1.5] });
  if (!hollow) { g.fillStyle = P.card; g.beginPath(); g.arc(0, -28, 3.2, 0, TAU); g.fill(); }
  g.restore();
}
function tallyGroup(g, x, y, o = {}) { for (let i = 0; i < 4; i++) tally(g, x + i * 16, y, o); tally(g, x + 24, y + 2, { ...o, lean: 62, sc: 1.05 }); }
// STAMP: ink rectangle with a paper rubber-stamp emblem
function stampBlock(g, x, y, w, h, emblem = 'tower') {
  pen(g, rrect(x, y, w, h, 6), { fill: P.ink, line: P.ink, lw: 2, shadow: true, breaks: false, highlight: false });
  g.save(); g.strokeStyle = P.paper; g.fillStyle = P.paper; g.lineWidth = 3; const cx = x + w / 2, cy = y + h * 0.42, r = w * 0.28;
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  if (emblem === 'tower') g.fillRect(cx - r * 0.22, cy - r * 0.6, r * 0.44, r * 1.2);
  else { g.beginPath(); for (let k = -1; k <= 1; k += 0.1) { const xx = cx + k * r * 0.7, yy = cy + Math.sin(k * 6) * r * 0.2; k === -1 ? g.moveTo(xx, yy) : g.lineTo(xx, yy); } g.stroke(); }
  g.restore();
}
// STRING TAG
function tag(g, ax, ay, x, y, text, { font = '600 34px "Archivo Narrow"', swing = 0 } = {}) {
  g.save(); g.font = font; const w = g.measureText(text).width + 56, h = 58;
  g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + x) / 2, Math.max(ay, y) + 18, x + 18, y + h / 2); g.stroke();
  g.translate(x, y); g.rotate(swing * D);
  pen(g, poly([[0, 10], [12, 0], [w, 0], [w, h], [12, h], [0, h - 10]]), { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
  g.fillStyle = P.paper; g.strokeStyle = P.ink40; g.beginPath(); g.arc(18, h / 2, 5, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = P.ink; g.textBaseline = 'middle'; g.fillText(text, 34, h / 2 + 2);
  g.restore();
}
function mono(g, text, x, y, size = 24, col = P.ink70, align = 'left') {
  g.save(); g.font = `500 ${size}px "Plex Mono"`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.letterSpacing = `${size * 0.16}px`; g.fillText(text.toUpperCase(), x, y); g.restore();
}
function coil(g, x, y, r, col = P.ink, red = P.red, lw = 3) {
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
  for (let a = 0; a <= 4 * TAU; a += 0.05) { const rr = r * (0.12 + 0.88 * a / (4 * TAU)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke(); if (red) { g.fillStyle = red; g.beginPath(); g.arc(x, y, r * 0.14, 0, TAU); g.fill(); } g.restore();
}

// ---------------------------------------------------------------- the opened case (shared by sf-case, thumbs, vertical)
function openCase(g, cx, cy, R, { t = 0, s = 1, ground = 'paper' } = {}) {
  // the lid, hinged open up-left, showing its hatched inner face
  const lid = (gg) => { gg.beginPath(); gg.ellipse(cx - R * 1.02, cy - R * 0.52, R * 0.36, R * 0.98, 32 * D, 0, TAU); };
  pen(g, lid, { fill: P.brassL, lw: 3, shadow: true, hatched: true, box: [cx - R * 1.6, cy - R * 1.6, cx - R * 0.4, cy + R * 0.6] });
  // hinge knuckles
  pen(g, rrect(cx - R * 0.86, cy - R * 0.2, 14, 26, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  pen(g, rrect(cx - R * 0.94, cy + R * 0.06, 14, 26, 4), { fill: P.brass, lw: 2, breaks: false, highlight: false });
  // the case: brass rim ring + paper-card face
  const box = [cx - R, cy - R, cx + R, cy + R];
  pen(g, circle(cx, cy, R), { fill: P.brass, lw: 3, shadow: true, shade: (x, y) => { const a = Math.atan2(y - cy, x - cx), u = Math.cos(a - 45 * D); return M.clamp(u * 0.6, 0, 0.55); }, shadeColor: P.brassD, box, s });
  pen(g, circle(cx, cy, R * 0.88), { fill: P.card, lw: 2, box: [cx - R * 0.88, cy - R * 0.88, cx + R * 0.88, cy + R * 0.88], shade: lampShade([cx - R, cy - R, cx + R, cy + R], 0, 0.22, 0.55), shadeColor: P.kraft, s });
  g.save(); g.beginPath(); g.arc(cx, cy, R * 0.86, 0, TAU); g.clip();
  // teal pipes
  g.lineCap = 'round'; g.lineJoin = 'round';
  const pipe = (pts, w) => { g.save(); g.translate(MIS[0], MIS[1]); g.strokeStyle = P.teal; g.lineWidth = w; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, cx + q[0] * R, cy + q[1] * R)); g.stroke(); g.restore();
    g.strokeStyle = P.ink; g.lineWidth = 2; for (const side of [-1, 1]) { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, cx + q[0] * R, cy + q[1] * R + side * w / 2)); g.stroke(); } };
  pipe([[-0.9, 0.36], [-0.35, 0.36], [-0.35, -0.05], [0.0, -0.05]], R * 0.08);
  pipe([[0.0, 0.0], [0.42, 0.0], [0.42, 0.5], [0.9, 0.5]], R * 0.08);
  // brass gears meshing with the red one
  const rot = t * 0.6;
  pen(g, gearPath(cx - R * 0.42, cy - R * 0.42, R * 0.26, 14, -rot * 1.4), { fill: P.brass, lw: 2.5, shade: 0.45, shadeColor: P.brassD, box: [cx - R * 0.7, cy - R * 0.7, cx - R * 0.16, cy - R * 0.16], s });
  pen(g, gearPath(cx + R * 0.45, cy - R * 0.38, R * 0.2, 11, -rot * 1.8 + 0.2), { fill: P.brass, lw: 2.5, shade: 0.45, shadeColor: P.brassD, box: [cx + R * 0.24, cy - R * 0.6, cx + R * 0.66, cy - R * 0.17], s });
  // tallies at the bottom of the case
  for (let k = 0; k < 4; k++) tallyGroup(g, cx - R * 0.55 + k * 92, cy + R * 0.72, { lean: Math.sin(k * 1.3) * 3 });
  g.restore();
  // THE one red thing: the centre gear, shape-coded with a notch ring
  pen(g, gearPath(cx, cy, R * 0.3, 16, rot), { fill: P.red, lw: 3, shade: 0.4, shadeColor: P.redD, box: [cx - R * 0.3, cy - R * 0.3, cx + R * 0.3, cy + R * 0.3], s });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.arc(cx, cy, R * 0.36, 0, TAU); g.stroke(); g.restore();
  pen(g, circle(cx, cy, R * 0.06), { fill: P.brass, lw: 2, breaks: false, highlight: false });
}

// ---------------------------------------------------------------- sets
function caseOpen(ctx, shot) {
  const L = canvasLayer(ctx);
  return { layer: L.layer, update(t) {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0);
    paperGround(g);
    const z = 1.08; g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
    openCase(g, 1150, 560, 300, { t, s });
    tag(g, 1150 + 70, 560 - 70, 1500, 230, 'The pump', { swing: -4 });
    winder(g, 700, 900, 150, { ...POSES.idle, headDx: 0.03, headDy: -0.04, lean: -6, armF: 40 });
    g.setTransform(s, 0, 0, s, 0, 0);
    mono(g, 'Style frame · paper lab · RC-1 f 150 · not real data', 96, 1080 - 64, 20);
  } };
}

function acting(ctx) {
  const L = canvasLayer(ctx);
  const cast = [['idle', 'Idle', 'baseline'], ['slump', 'Run down', 'sad: key stops'], ['panic', 'Panic', 'key spins, feet up'],
    ['proud', 'Proud', 'chest up, one arm'], ['shrug', 'Shrug', '"nobody knows"'], ['lookback', 'Look-back', 'gag: key reverses']];
  return { layer: L.layer, update() {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0); paperGround(g);
    g.save(); g.font = '400 84px "Instrument Serif"'; g.fillStyle = P.ink; g.fillText('Posture does the acting', 120, 170); g.restore();
    mono(g, 'Winder pose library v0 · same rig · no face', 124, 222, 22);
    g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.beginPath(); g.moveTo(96, 820); g.lineTo(1824, 820); g.stroke();
    cast.forEach(([k, name, note], i) => {
      const x = 230 + i * 292;
      winder(g, x, 820, 330, POSES[k]);
      g.save(); g.font = '600 36px "Archivo Narrow"'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(name, x, 885); g.restore();
      mono(g, note, x, 925, 15, P.ink70, 'center');
    });
    mono(g, 'Style frame · paper lab · §6.7 proof', 96, 1080 - 64, 20);
  } };
}

function front(ctx) {
  const L = canvasLayer(ctx);
  // an invented coastline (not a real place): land to the east, sea to the west
  const land = deckle([[700, 120], [1900, 120], [1900, 980], [880, 980], [820, 860], [900, 760], [780, 640], [860, 520], [740, 400], [820, 260]], 41, 3, 10);
  return { layer: L.layer, update() {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0); paperGround(g);
    // sheet: sea fill + water-lining + land
    g.save(); g.beginPath(); g.rect(96, 80, 1728, 900); g.clip();
    g.fillStyle = P.tealL; g.fillRect(96, 80, 1728, 900);
    const landPath = poly(land);
    for (const k of [34, 22, 13, 6]) { g.save(); landPath(g); g.strokeStyle = P.teal; g.lineWidth = 2 * k + 1.25; g.lineJoin = 'round'; g.stroke(); landPath(g); g.strokeStyle = P.tealL; g.lineWidth = 2 * k - 1.25; g.stroke(); g.restore(); }
    pen(g, landPath, { fill: P.card, lw: 2, shadow: true, breaks: false, highlight: false });
    // hachures on a ridge
    g.strokeStyle = P.ink40; g.lineWidth = 1.25; for (let k = 0; k < 18; k++) { const x = 1420 + k * 18, y = 300 + Math.sin(k * 0.5) * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 16); g.stroke(); }
    // fronts over time: dated ghosts (dashed ink-40) -> the current front (ink, ratchet teeth point the way it moves)
    const frontAt = (x0) => [[x0, 140], [x0 + 60, 300], [x0 + 20, 470], [x0 + 90, 640], [x0 + 40, 820], [x0 + 70, 960]];
    [[1560, 'AUG'], [1420, 'SEP']].forEach(([x0, lab]) => {
      g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; g.setLineDash([10, 7]); g.beginPath(); frontAt(x0).forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, ...q)); g.stroke(); g.restore();
      mono(g, lab, x0 + 70, 170, 20, P.ink70);
    });
    const cur = frontAt(1250);
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath(); cur.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, ...q)); g.stroke();
    g.fillStyle = P.ink; // ratchet teeth (60/30 saw) on the attacker's side, pointing west
    for (let i = 0; i < cur.length - 1; i++) { const [a, b] = [cur[i], cur[i + 1]]; const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L2 / 34), ux = (b[0] - a[0]) / L2, uy = (b[1] - a[1]) / L2;
      for (let k = 0; k < n; k++) { const px = a[0] + ux * (k * 34 + 8), py = a[1] + uy * (k * 34 + 8); g.beginPath(); g.moveTo(px, py); g.lineTo(px + ux * 18, py + uy * 18); g.lineTo(px - uy * 14 + ux * 4, py + ux * 14 + uy * 4); g.closePath(); g.fill(); } }
    g.restore(); mono(g, 'OCT', 1310, 170, 22, P.ink);
    // armies: side A = filled ink tallies under a Stamp; side B = hollow paper tallies under a Stamp (shape-coded, no hue needed)
    stampBlock(g, 1600, 430, 70, 110, 'tower');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) tallyGroup(g, 1520 + c * 92, 610 + r * 48, { col: P.ink, line: P.ink });
    stampBlock(g, 960, 520, 70, 110, 'wave');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) tallyGroup(g, 1000 + c * 92 + 60, 700 + r * 48, { hollow: true });
    // the town at the front: a card that is torn and hatched (damage), with paper smoke puffs (halftone shade, no blur)
    const town = deckle([[1180, 380], [1290, 380], [1300, 440], [1250, 470], [1200, 455], [1175, 430]], 7, 5, 7);
    pen(g, poly(town), { fill: P.kraft, lw: 2, hatched: true, box: [1170, 370, 1310, 480], breaks: false, highlight: false });
    [[1238, 340, 34], [1262, 296, 28], [1236, 258, 22], [1270, 226, 16]].forEach(([x, y, r]) => pen(g, circle(x, y, r), { fill: P.card, line: P.ink40, lw: 1.6, shade: 0.5, shadeColor: P.ink40, box: [x - r, y - r, x + r, y + r], s, breaks: false, highlight: false }));
    // flames as paper cut-outs in brass-light (red stays reserved)
    [[1200, 384, 22], [1226, 376, 30], [1256, 380, 20]].forEach(([x, y, h2]) => pen(g, poly([[x - 9, y], [x, y - h2], [x + 9, y], [x + 3, y - h2 * 0.45]]), { fill: P.brassL, lw: 1.6, breaks: false, highlight: false }));
    // the one red thing: the bridge the story follows (pin + notch ring)
    pen(g, circle(1120, 610, 13), { fill: P.red, lw: 2.5, breaks: false, highlight: false });
    g.save(); g.strokeStyle = P.red; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.arc(1120, 610, 24, 0, TAU); g.stroke(); g.restore();
    tag(g, 1120, 596, 860, 300, 'The bridge', { swing: 3 });
    coil(g, 1740, 150, 34, P.ink, null, 2.5);
    g.restore();
    // neat line + 10° ticks + key
    g.strokeStyle = P.ink40; g.lineWidth = 1.25; g.strokeRect(96, 80, 1728, 900);
    for (let x = 96; x <= 1824; x += 144) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x, 92); g.moveTo(x, 980); g.lineTo(x, 968); g.stroke(); }
    g.fillStyle = P.paper; g.fillRect(120, 104, 470, 128); g.strokeRect(120, 104, 470, 128);
    tallyGroup(g, 148, 160, { col: P.ink }); mono(g, 'Side A · 1 tally = 1,000', 250, 152, 18, P.ink);
    tallyGroup(g, 148, 214, { hollow: true }); mono(g, 'Side B · 1 tally = 1,000', 250, 206, 18, P.ink);
    mono(g, 'Style frame · history module · invented map · not real data', 96, 1080 - 40, 18);
  } };
}

function thumb(ctx, shot) {
  const L = canvasLayer(ctx), gr = shot.params.ground;
  const bg = { paper: P.paper, teal: P.tealD, night: P.night }[gr], word = gr === 'paper' ? P.ink : P.paper;
  return { layer: L.layer, update() {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0);
    if (gr === 'paper') paperGround(g); else { g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080); g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.25; g.fillStyle = g.createPattern(fibreTile(), 'repeat'); g.fillRect(0, 0, 1920, 1080); g.restore(); }
    // thumbnail line weights: 6 px pen line, 8 px off-register (bible §15)
    const save = MIS.slice(); MIS[0] = 8; MIS[1] = 6;
    g.save(); g.lineWidth = 6;
    openCase(g, 1420, 580, 380, { s });
    g.restore();
    winder(g, 930, 1010, 130, { ...POSES.panic, lift: 0.04 });
    MIS[0] = save[0]; MIS[1] = save[1];
    g.save(); g.font = '700 230px "Archivo Narrow"'; g.fillStyle = word; g.textBaseline = 'alphabetic';
    g.fillText('IT', 100, 440); g.font = '700 200px "Archivo Narrow"'; g.fillText('STOPPED', 100, 650); g.restore();
    coil(g, 120, 96, 34, word, P.red, 5);
  } };
}

// stress card: halftone patches (world-fixed row 1, screen-fixed row 2) at pitch 8 / 11 / 14, density 0.35 / 0.55,
// hairlines 1.25 / 2 / 3 px, paper fibre, 22 px mono text. params.zoom scales the world about the centre.
export const STRESS = { cols: [330, 760, 1190], rows: [260, 600], w: 360, h: 240, pitches: [8, 11, 14] };
function stress(ctx, shot) {
  const L = canvasLayer(ctx), z = shot.params.zoom ?? 1;
  return { layer: L.layer, update() {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0);
    g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
    paperGround(g);
    STRESS.rows.forEach((cy, r) => STRESS.cols.forEach((cx, c) => {
      const x0 = cx - STRESS.w / 2, y0 = cy - STRESS.h / 2, box = [x0, y0, x0 + STRESS.w, y0 + STRESS.h];
      g.save(); g.beginPath(); g.rect(...box.slice(0, 2), STRESS.w, STRESS.h); g.fillStyle = P.teal; g.fill(); g.clip();
      halftone(g, box, (x) => x < cx ? 0.35 : 0.55, P.tealD, { pitch: STRESS.pitches[c], screen: r === 1, s });
      g.restore();
      mono(g, `${r ? 'screen' : 'world'} · ${STRESS.pitches[c]} px`, x0, y0 - 14, 20, P.ink70);
    }));
    // hairlines
    [1.25, 2, 3].forEach((lw, i) => { g.strokeStyle = i ? P.ink : P.ink40; g.lineWidth = lw; for (let k = 0; k < 6; k++) { const y = 160 + i * 150 + k * 14; g.beginPath(); g.moveTo(1460, y); g.lineTo(1820, y + 30); g.stroke(); } mono(g, `${lw} px`, 1460, 146 + i * 150, 18); });
    hatch(g, [1460, 640, 1820, 860]); g.strokeStyle = P.ink; g.lineWidth = 2; g.strokeRect(1460, 640, 360, 220); mono(g, 'hatch 7 px', 1460, 626, 18);
    mono(g, 'Source: 22 px Plex Mono · the quick brown fox 1,234,567', 120, 930, 22);
    mono(g, 'Source: 20 px Plex Mono · 0123456789', 120, 975, 20);
  } };
}

function vertical(ctx) {
  const L = canvasLayer(ctx);
  // a 9:16 frame is 607.5 x 1080 inside the 16:9 stage; we lay it out at x 656..1264, then crop and upscale in check.py
  return { layer: L.layer, update() {
    const { g, s } = L; g.setTransform(s, 0, 0, s, 0, 0);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 1920, 1080);
    g.save(); g.beginPath(); g.rect(656, 0, 608, 1080); g.clip();
    g.fillStyle = P.tealD; g.fillRect(656, 0, 608, 1080);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.25; g.fillStyle = g.createPattern(fibreTile(), 'repeat'); g.fillRect(656, 0, 608, 1080); g.restore();
    g.save(); g.font = '700 118px "Archivo Narrow"'; g.fillStyle = P.paper; g.textAlign = 'center'; g.fillText('IT STOPPED.', 960, 250); g.restore();
    openCase(g, 990, 560, 220, { s });
    winder(g, 790, 800, 90, { ...POSES.panic, lift: 0.04 });
    // Shorts UI zones (scaled from 1080x1920): right action rail ~ 120 px, bottom title/caption block ~ 380 px, top ~ 120 px
    const k = 1080 / 1920;
    g.save(); g.fillStyle = 'rgba(224,36,27,0.14)'; g.strokeStyle = P.paper; g.setLineDash([6, 6]); g.lineWidth = 1.5;
    g.fillRect(1264 - 120 * k, 1080 - 1040 * k, 120 * k, 1040 * k - 380 * k); g.strokeRect(1264 - 120 * k, 1080 - 1040 * k, 120 * k, 1040 * k - 380 * k);
    g.fillRect(656, 1080 - 380 * k, 608, 380 * k); g.strokeRect(656, 1080 - 380 * k, 608, 380 * k);
    g.fillRect(656, 0, 608, 120 * k); g.strokeRect(656, 0, 608, 120 * k);
    g.restore();
    g.restore();
  } };
}

// ---------------------------------------------------------------- runtime
const SETS = { caseOpen, acting, front, thumb, stress, vertical };
export default async function create(ctx) {
  const { renderer, shots } = ctx;
  await document.fonts.ready;
  for (const f of ['600 34px "Archivo Narrow"', '700 250px "Archivo Narrow"', '500 22px "Plex Mono"', '400 84px "Instrument Serif"']) await document.fonts.load(f);
  const live = new Map();
  for (const s of shots) live.set(s.id, await SETS[s.set](ctx, s));
  const layers = [...live.values()].map(v => v.layer);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.paper); const cam = new THREE.PerspectiveCamera();
  return {
    frame({ shot, t }) {
      const inst = live.get(shot.id);
      for (const l of layers) l.style.display = l === inst.layer ? '' : 'none';
      renderer.render(scene, cam);
      inst.update(t);
    },
  };
}
