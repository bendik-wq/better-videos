// Panama bright graphics kit: palette, fonts, the 2D canvas set, camera drift, paper-cut drawing helpers.
// Shared by graphics.js, graphics-map.js, graphics-gauge.js and graphics-photo.js. Not a set library: the
// default export returns no sets, so a runtime that loads every sets/*.js can load this file harmlessly.
//
// House look (docs/library/bright-style/STYLE.md, house blend): warm paper #f6f1e7, turquoise water #7cc6c1,
// ink #1b2430, one red accent #e0241b, sun-yellow highlights. Inter (OFL, assets/fonts) for type, Instrument
// Serif italic for quotes and sea names, Plex Mono for sources. Everything is authored on a 1920x1080 grid
// and is a pure function of (t, p): seeded noise only, nothing carried between frames.
import * as THREE from 'three';
import * as M from '/engine/motion.js';

export const E = M.E, clamp = M.clamp, lerp = M.lerp, range = M.range, sstep = M.smoothstep, rng = M.rng, hash = M.hash;
export const TAU = Math.PI * 2;

export const P = {
  paper: '#f6f1e7', paperDeep: '#efe6d4', card: '#fffdf8', white: '#ffffff',
  water: '#7cc6c1', waterDeep: '#4fa9ab', waterDark: '#2f7f84', shelf: '#bfe5df', sea: '#8fd0cb', seaPale: '#d5eeea',
  ink: '#1b2430', inkSoft: '#5a6472', inkFaint: '#9aa1aa', rule: 'rgba(27,36,48,0.14)',
  red: '#e0241b', redSoft: '#f6c9c4', sun: '#ffd23f', sunSoft: '#ffe9a3', sand: '#f3dfae', sandDeep: '#e9c97f',
  land: '#ece3d1', landSide: '#cbbd9f', landEdge: '#b9a882', park: '#cbd9b1', coral: '#ff7a5c', lavender: '#b9a9ef',
};
export const F = { sans: 'Inter, "Archivo Narrow", sans-serif', serif: '"Instrument Serif", serif', mono: '"Plex Mono", monospace' };

let fontsP = null;
export function loadFonts() {
  return fontsP ??= (async () => {
    try {
      const f = new FontFace('Inter', 'url(/projects/panama/assets/fonts/Inter-latin.woff2)', { weight: '100 900' });
      await f.load(); document.fonts.add(f);
    } catch (e) { console.warn('[panama] Inter not loaded:', e.message); }
    await Promise.all(['500', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 40px Inter`)).concat(
      [document.fonts.load('40px "Instrument Serif"'), document.fonts.load('italic 40px "Instrument Serif"'), document.fonts.load('500 40px "Plex Mono"')]));
  })();
}

// word cue: number (s) | 'word' | 'word@n' | 'word+0.4' ; falls back when the narration lacks it
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
export function cue(shot, spec, fallback = 0) {
  if (spec === undefined || spec === null || spec === '') return fallback;
  if (typeof spec === 'number') return spec;
  const m = String(spec).match(/^(.+?)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) return fallback;
  const [, word, nth, off] = m;
  const hits = (shot.words ?? []).filter(x => norm(x.w).startsWith(norm(word)));
  const t = hits.length ? (hits[Number(nth ?? 0)] ?? hits.at(-1)).s : fallback;
  return (t ?? 0) + Number(off ?? 0);
}
export const vo0 = (shot) => Math.max(0, (shot.voAt ?? 0) - (shot.start ?? 0));
// spread n cue times: explicit words win; others are spaced from `from` across `span` (dead-air rule: start early)
export function cues(shot, items, { from = 0.5, span = null, key = 'word', min = 0.9 } = {}) {
  const D = shot.duration ?? 8, n = items.length, sp = span ?? Math.max(min * (n - 1), (D - from - 1.6));
  return items.map((it, i) => cue(shot, it?.[key], from + (n > 1 ? sp * i / (n - 1) : 0)));
}

export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay?.appendChild(l); return l; };

// ---------------------------------------------------------------- the canvas set
// paint(g, t, p, k) draws in 1080p units; k = { S, W, H, view(depth), shot, D }. view(depth) applies the slow
// camera push/drift for a layer at that depth (0 = locked, 1 = the main plane, >1 = closer to the lens).
export function canvasSet(Hh, ctx, shot, paint, cam = {}) {
  const cv = mk(ctx.width, ctx.height), g = cv.getContext('2d');
  const layer = Hh?.layerOf ? Hh.layerOf(ctx) : layerOf(ctx);
  const S = ctx.height / 1080, D = Math.max(0.5, shot.duration ?? 6);
  const camO = { push: 0.045, dx: 26, dy: 8, fx: 960, fy: 540, ease: E.inOutSine, ...cam, ...(shot.params?.cam ?? {}) };
  const k = { S, W: 1920, H: 1080, D, shot, ctx };
  k.view = (depth = 1, t = k.t) => {
    const u = camO.ease(clamp(t / D)), z = 1 + camO.push * u * depth, ox = (u - 0.5) * camO.dx * depth, oy = (u - 0.5) * camO.dy * depth;
    g.setTransform(S * z, 0, 0, S * z, S * (camO.fx - camO.fx * z - ox), S * (camO.fy - camO.fy * z - oy));
  };
  k.flat = () => g.setTransform(S, 0, 0, S, 0, 0);
  return {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, k,
    async update(t, p) {
      k.t = t; setS(S); g.setTransform(S, 0, 0, S, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; noShadow(g); g.letterSpacing = '0px';
      await paint(g, t, p ?? t / D, k);
    },
    dispose() { layer?.remove?.(); },
  };
}

// ---------------------------------------------------------------- paper, grain, shadows
const grainCache = new WeakMap(); let GRAIN = null;
function grainTile() {
  if (GRAIN) return GRAIN; GRAIN = mk(256, 256); const x = GRAIN.getContext('2d'), im = x.createImageData(256, 256), r = rng(17);
  for (let i = 0; i < im.data.length; i += 4) { const v = 236 + r() * 19; im.data[i] = v; im.data[i + 1] = v - 1; im.data[i + 2] = v - 4; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); return GRAIN;
}
export function grain(g, w = 1920, h = 1080, a = 0.45, x0 = 0, y0 = 0) {
  if (!grainCache.has(g)) grainCache.set(g, g.createPattern(grainTile(), 'repeat'));
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = grainCache.get(g); g.fillRect(x0, y0, w, h); g.restore();
}
// the paper ground: tone, a warm sun from the upper left, faint fibre grain
export function paper(g, { tone = P.paper, sun = [380, -160], warm = 0.07, grainA = 0.5 } = {}) {
  g.fillStyle = tone; g.fillRect(-200, -200, 2320, 1480);
  const sg = g.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], 1900);
  sg.addColorStop(0, 'rgba(255,255,250,0.85)'); sg.addColorStop(0.5, 'rgba(255,252,244,0.3)'); sg.addColorStop(1, 'rgba(255,250,240,0)');
  g.fillStyle = sg; g.fillRect(-200, -200, 2320, 1480);
  const vg = g.createRadialGradient(960, 540, 600, 960, 540, 1400); vg.addColorStop(0, 'rgba(120,92,52,0)'); vg.addColorStop(1, `rgba(120,92,52,${warm})`);
  g.fillStyle = vg; g.fillRect(-200, -200, 2320, 1480);
  grain(g, 2320, 1480, grainA, -200, -200);
}
// soft paper-cut shadow; lift 0..2 (how high the cut floats). Blur and offset are in device px, so scale by S.
let SS = 1; export const setS = (s) => { SS = s; };
export function shadow(g, lift = 1, a = 1, S = SS) {
  g.shadowColor = `rgba(58,44,24,${(0.13 + 0.06 * lift) * a})`; g.shadowBlur = (10 + 22 * lift) * S; g.shadowOffsetX = (2 + 4 * lift) * S; g.shadowOffsetY = (5 + 11 * lift) * S;
}
export const noShadow = (g) => { g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; };
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export function card(g, x, y, w, h, { r = 22, fill = P.card, lift = 1, S = SS, alpha = 1, grainA = 0.35 } = {}) {
  g.save(); g.globalAlpha *= alpha; shadow(g, lift, 1, S); rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); noShadow(g);
  if (grainA) { g.save(); rr(g, x, y, w, h, r); g.clip(); grain(g, w, h, grainA, x, y); g.restore(); }
  g.restore();
}

// ---------------------------------------------------------------- type
export function font(size, weight = 800, fam = F.sans, style = '') { return `${style} ${weight} ${size}px ${fam}`.trim(); }
export function text(g, s, x, y, { size = 40, weight = 800, fam = F.sans, style = '', color = P.ink, align = 'left', base = 'alphabetic', track = 0, alpha = 1, upper = false, maxW = null } = {}) {
  s = String(s ?? ''); if (upper) s = s.toUpperCase();
  g.save(); g.globalAlpha *= alpha; g.font = font(size, weight, fam, style); g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = `${track * size}px`;
  if (maxW) { const w = g.measureText(s).width; if (w > maxW) { const k = maxW / w; g.translate(x, y); g.scale(k, k); x = 0; y = 0; } }
  g.fillText(s, x, y); g.restore();
}
export function measure(g, s, size, weight = 800, fam = F.sans, track = 0, style = '') { g.save(); g.font = font(size, weight, fam, style); g.letterSpacing = `${track * size}px`; const w = g.measureText(String(s)).width; g.restore(); return w; }
export function wrap(g, s, maxW, size, weight = 700, fam = F.sans, style = '') {
  const words = String(s).split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(g, n, size, weight, fam, 0, style) > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur); return lines;
}
// a line that rises out of a mask (k 0..1)
export function riseText(g, s, x, y, k, o = {}) {
  const size = o.size ?? 40; if (k <= 0) return;
  g.save(); const w = measure(g, s, size, o.weight ?? 800, o.fam ?? F.sans, o.track ?? 0, o.style ?? '');
  const ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  g.beginPath(); g.rect(ax - size * 0.3, y - size * 1.05, w + size * 0.6, size * 1.38); g.clip();
  text(g, s, x, y + (1 - E.emphasized(k)) * size * 1.15, o); g.restore();
}
export const fmt = (v, dec = 0) => { const s = Math.abs(v).toFixed(dec); const [a, b] = s.split('.'); return (v < 0 ? '−' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };

// white pill label (Wendover): dark type, soft shadow, optional dot colour
export function pill(g, s, x, y, { size = 30, color = P.ink, fill = P.white, dot = null, align = 'left', alpha = 1, k = 1, weight = 700, pad = 0.55, lift = 0.6 } = {}) {
  if (k <= 0 || !s) return null;
  const w = measure(g, s, size, weight) + size * pad * 2 + (dot ? size * 0.75 : 0), h = size * 1.75;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y0 = y - h / 2;
  const sc = E.outBack(clamp(k * 1.2));
  g.save(); g.globalAlpha *= alpha * clamp(k * 2.5); g.translate(x0 + w / 2, y); g.scale(sc, sc); g.translate(-(x0 + w / 2), -y);
  shadow(g, lift); rr(g, x0, y0, w, h, h / 2); g.fillStyle = fill; g.fill(); noShadow(g);
  let tx = x0 + size * pad;
  if (dot) { g.fillStyle = dot; g.beginPath(); g.arc(tx + size * 0.28, y, size * 0.26, 0, TAU); g.fill(); tx += size * 0.75; }
  text(g, s, tx, y + size * 0.36, { size, weight, color }); g.restore();
  return { x: x0, y: y0, w, h };
}
// ink slab with white caps (Primal/Neo): the claim label
export function slab(g, s, x, y, { size = 34, fill = P.ink, color = P.white, align = 'left', k = 1, track = 0.06, lift = 0.8, weight = 800 } = {}) {
  if (k <= 0 || !s) return null; s = String(s).toUpperCase();
  const w = measure(g, s, size, weight, F.sans, track) + size * 1.1, h = size * 1.7;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.save(); g.globalAlpha *= clamp(k * 3); const wk = E.emphasized(k);
  g.beginPath(); g.rect(x0 - 40, y - h / 2 - 40, (w + 80) * wk, h + 80); g.clip();
  shadow(g, lift); rr(g, x0, y - h / 2, w, h, 8); g.fillStyle = fill; g.fill(); noShadow(g);
  text(g, s, x0 + size * 0.55, y + size * 0.36, { size, weight, color, track }); g.restore();
  return { x: x0, w, h };
}
// kicker: short red rule + mono caps (the meta caption)
export function kicker(g, s, x, y, k = 1, { color = P.ink, rule = P.red, size = 24 } = {}) {
  if (k <= 0 || !s) return;
  g.save(); g.fillStyle = rule; g.fillRect(x, y - size * 1.6, 64 * E.emphasized(k), 5);
  text(g, s, x, y, { size, weight: 500, fam: F.mono, color, track: 0.16, upper: true, alpha: E.outCubic(range(k, 0.2, 1)) }); g.restore();
}
// source / as-of line, bottom right (or left)
export function source(g, s, k = 1, { x = 1840, y = 1036, align = 'right', color = P.inkSoft, size = 20 } = {}) {
  if (!s || k <= 0) return;
  text(g, s, x, y, { size, weight: 500, fam: F.mono, color, align, track: 0.1, upper: true, alpha: E.outCubic(k) });
}
export function asOf(g, s, x, y, k = 1, { align = 'left', size = 24 } = {}) {
  if (!s || k <= 0) return null;
  return pill(g, s, x, y, { size, fill: P.sunSoft, color: P.ink, dot: P.red, align, k, weight: 800 });
}

// ---------------------------------------------------------------- water
// a wavy water body from y=level down to `bottom`, waves travel with t
export function waterPath(g, x0, x1, level, bottom, t, { amp = 7, len = 260, speed = 0.6, phase = 0 } = {}) {
  g.beginPath(); g.moveTo(x0, bottom);
  for (let x = x0; x <= x1 + 1; x += 12) {
    const y = level + Math.sin((x / len) * TAU + t * speed * TAU + phase) * amp + Math.sin((x / (len * 0.43)) * TAU - t * speed * 1.7 * TAU + phase * 2) * amp * 0.35;
    g.lineTo(x, y);
  }
  g.lineTo(x1, bottom); g.closePath();
}
export function water(g, x0, x1, level, bottom, t, o = {}) {
  const top = o.color ?? P.water, deep = o.deep ?? P.waterDeep;
  g.save();
  if (o.lift !== 0) shadow(g, o.lift ?? 0.6);
  waterPath(g, x0, x1, level - 6, bottom, t, { ...o, phase: (o.phase ?? 0) + 1.3 }); g.fillStyle = o.back ?? P.shelf; g.fill(); noShadow(g);
  waterPath(g, x0, x1, level, bottom, t, o);
  const gr = g.createLinearGradient(0, level, 0, bottom); gr.addColorStop(0, top); gr.addColorStop(1, deep); g.fillStyle = gr; g.fill();
  // glints
  g.globalAlpha = 0.5; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3; g.lineCap = 'round';
  const r = rng(o.seed ?? 5);
  for (let i = 0; i < (o.glints ?? 10); i++) {
    const gx = x0 + r() * (x1 - x0), gy = level + 20 + r() * Math.min(200, bottom - level - 30), gl = 30 + r() * 70, ph = (t * 0.35 + r()) % 1;
    g.globalAlpha = 0.45 * Math.sin(ph * Math.PI);
    g.beginPath(); g.moveTo(gx + ph * 30, gy); g.lineTo(gx + gl + ph * 30, gy); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- icons
// a small container ship, side view, bow to the right; len in px
export function ship(g, x, y, len, { color = P.ink, boxes = true, alpha = 1, rot = 0, hull = null, deck = P.white, seed = 3 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.rotate(rot); const L = len, h = L * 0.16;
  // containers
  if (boxes) { const cols = [P.red, P.water, P.sun, P.coral, P.waterDeep, P.lavender], r = rng(seed); const n = 7, bw = L * 0.62 / n;
    for (let i = 0; i < n; i++) { const st = 1 + Math.floor(r() * 2.2); for (let j = 0; j < st; j++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(-L * 0.36 + i * bw, -h * 0.55 - (j + 1) * h * 0.62, bw - L * 0.008, h * 0.58); } } }
  // bridge
  g.fillStyle = deck; g.fillRect(-L * 0.47, -h * 2.1, L * 0.1, h * 1.6); g.fillStyle = color; g.fillRect(-L * 0.47, -h * 2.1, L * 0.1, h * 0.28);
  // hull
  g.fillStyle = hull ?? color; g.beginPath(); g.moveTo(-L * 0.5, -h * 0.55); g.lineTo(L * 0.5, -h * 0.55); g.lineTo(L * 0.43, h * 0.45); g.lineTo(-L * 0.47, h * 0.45); g.closePath(); g.fill();
  g.fillStyle = P.red; g.fillRect(-L * 0.47, h * 0.18, L * 0.9, h * 0.27);
  g.restore();
}
// top-down ship marker for maps (pointed hull), heading in radians
export function shipTop(g, x, y, len, heading, { color = P.white, edge = P.ink, alpha = 1 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.rotate(heading); const L = len, w = L * 0.3;
  shadow(g, 0.4); g.fillStyle = color; g.beginPath(); g.moveTo(L * 0.5, 0); g.quadraticCurveTo(L * 0.3, -w / 2, L * 0.1, -w / 2); g.lineTo(-L * 0.5, -w / 2); g.lineTo(-L * 0.5, w / 2); g.lineTo(L * 0.1, w / 2); g.quadraticCurveTo(L * 0.3, w / 2, L * 0.5, 0); g.fill(); noShadow(g);
  g.strokeStyle = edge; g.lineWidth = Math.max(1.5, L * 0.05); g.stroke();
  g.fillStyle = edge; g.fillRect(-L * 0.42, -w * 0.3, L * 0.14, w * 0.6);
  g.restore();
}
// rain streaks over a region (clip first), deterministic in t
export function rain(g, x0, y0, w, h, t, { n = 160, color = 'rgba(47,127,132,0.55)', len = 34, speed = 900, slant = 0.22, seed = 9, width = 2.4 } = {}) {
  const r = rng(seed); g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const px = r(), py = r(), sp = speed * (0.75 + r() * 0.5), L = len * (0.6 + r() * 0.8);
    const yy = y0 + ((py * h + t * sp) % (h + L)) - L, xx = x0 + px * w + (yy - y0) * slant;
    g.moveTo(xx, yy); g.lineTo(xx + L * slant, yy + L);
  }
  g.stroke(); g.restore();
}
// red map pin with a pulse ring
export function pin(g, x, y, t, k = 1, { color = P.red, r = 11, pulse = true } = {}) {
  if (k <= 0) return; const s = E.outBack(clamp(k * 1.3));
  g.save(); if (pulse) { const ph = (t * 0.7) % 1; g.strokeStyle = color; g.globalAlpha = (1 - ph) * 0.55 * k; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + ph * 34, 0, TAU); g.stroke(); }
  g.globalAlpha = 1; shadow(g, 0.4); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, (r + 5) * s, 0, TAU); g.fill(); noShadow(g);
  g.fillStyle = color; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.fill(); g.restore();
}
// a polyline drawn on to fraction k (with a length table)
export function polyLen(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return cum; }
export function polyAt(pts, cum, k) {
  const L = cum.at(-1) * clamp(k); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++;
  const a = pts[i - 1], b = pts[i], u = (L - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
  return { x: lerp(a[0], b[0], clamp(u)), y: lerp(a[1], b[1], clamp(u)), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), i };
}
export function drawPoly(g, pts, cum, k) {
  if (k <= 0 || pts.length < 2) return; const e = polyAt(pts, cum, k);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < e.i; j++) g.lineTo(pts[j][0], pts[j][1]); g.lineTo(e.x, e.y); g.stroke(); return e;
}
// smooth a polyline (Chaikin)
export function smooth(pts, n = 2) { let p = pts; for (let k = 0; k < n; k++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [a, b] = [p[i], p[i + 1]]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(p.at(-1)); p = q; } return p; }

export const esc = (s) => String(s ?? '');
export default function makeGraphicsKit() { return {}; }
