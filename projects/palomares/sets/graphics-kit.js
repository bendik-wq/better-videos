// Palomares bright graphics kit (episode 9, "America Lost the Same H-Bomb Twice"): palette, fonts, the 2D canvas set,
// camera drift, ledger drawing helpers, the seabed section (the episode's depth motif: sea surface, shelf, the canyon wall
// where bomb 4 lay, the plain it slid to) and an image loader. Shared by graphics.js, graphics-data.js, graphics-maps.js
// and graphics-docs.js. Not a set library: the default export returns no sets, so a runtime that loads every sets/*.js can
// load this file harmlessly. (Adapted from projects/aibubble/sets/graphics-kit.js; all AI-bubble data removed.)
//
// House identity (same bright house as Panama/Mortgage/AI bubble, docs/library/bright-style/STYLE.md): bright cool paper
// #f7f6f1 with faint ledger rules, ink navy #14233d, sage #a9c5ae and teal #2a8c86 accents, and ONE red #e0241b per frame
// for the thing that matters. Figures in Plex Mono, headlines in Inter (OFL, assets/fonts), quotes in Instrument Serif,
// labels in Archivo Narrow. Everything is authored on a 1920x1080 grid and is a pure function of (t, p): seeded noise only.
import * as THREE from 'three';
import * as M from '/engine/motion.js';

export const E = M.E, clamp = M.clamp, lerp = M.lerp, range = M.range, sstep = M.smoothstep, rng = M.rng, hash = M.hash;
export const TAU = Math.PI * 2;

export const P = {
  paper: '#f7f6f1', paperDeep: '#eceee6', card: '#fefefb', white: '#ffffff', desk: '#dfe6e1',
  ink: '#14233d', inkSoft: '#56637a', inkFaint: '#a3abb8', rule: 'rgba(20,35,61,0.13)', hair: 'rgba(20,35,61,0.08)',
  ledger: 'rgba(42,140,134,0.14)', ledgerCol: 'rgba(42,140,134,0.10)',
  teal: '#2a8c86', tealDeep: '#1d6a66', tealSoft: '#d2e9e4', tealPale: '#e8f4f1',
  sage: '#a9c5ae', sageDeep: '#6f9a7c', sagePale: '#e4eee5', mint: '#e3f0e7',
  navy: '#14233d', navySoft: '#33476b', steel: '#8ea0b8', steelPale: '#dfe5ee',
  red: '#e0241b', redSoft: '#f8d3cf', redPale: '#fdeceb',
  land: '#eef0e8', landSide: '#c9d2c6', landEdge: '#aab7a8', sea: '#cfe5e3', seaDeep: '#a9d2cf', shelf: '#e0efec',
};
export const F = { sans: 'Inter, "Archivo Narrow", sans-serif', serif: '"Instrument Serif", serif', mono: '"Plex Mono", monospace', narrow: '"Archivo Narrow", Inter, sans-serif' };

let fontsP = null;
export function loadFonts() {
  return fontsP ??= (async () => {
    try {
      const f = new FontFace('Inter', 'url(/projects/mortgage/assets/fonts/Inter-latin.woff2)', { weight: '100 900' });
      await f.load(); document.fonts.add(f);
    } catch (e) { console.warn('[palomares] Inter not loaded:', e.message); }
    await Promise.all(['500', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 40px Inter`)).concat(
      [document.fonts.load('40px "Instrument Serif"'), document.fonts.load('italic 40px "Instrument Serif"'), document.fonts.load('500 40px "Plex Mono"'), document.fonts.load('400 40px "Plex Mono"'), document.fonts.load('700 40px "Archivo Narrow"'), document.fonts.load('400 40px "Archivo Narrow"')]));
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
  if (!hits.length) return fallback;
  return (hits[Number(nth ?? 0)] ?? hits.at(-1)).s + Number(off ?? 0);
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
  const k = { S, W: 1920, H: 1080, D, shot, ctx, cam: camO };
  k.view = (depth = 1, t = k.t) => {
    const u = camO.ease(clamp(t / D)), z = 1 + camO.push * u * depth, ox = (u - 0.5) * camO.dx * depth, oy = (u - 0.5) * camO.dy * depth;
    g.setTransform(S * z, 0, 0, S * z, S * (camO.fx - camO.fx * z - ox), S * (camO.fy - camO.fy * z - oy));
  };
  k.flat = () => g.setTransform(S, 0, 0, S, 0, 0);
  return {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, k,
    async update(t, p) {
      // a full reset every frame (pixels, clip stack, state): leftover clip edges of the previous frame's flap tiles ghosted as hairlines
      if (g.reset) g.reset(); else g.clearRect(0, 0, cv.width, cv.height);
      k.t = t; setS(S); g.setTransform(S, 0, 0, S, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; noShadow(g); g.letterSpacing = '0px'; g.setLineDash([]);
      // an opaque base every frame: the paper is drawn with a slow push and soft alphas, so without this the previous
      // shot's pixels (split-flap tile outlines, cards) ghost through the comp
      g.fillStyle = P.paper ?? '#f7f6f1'; g.fillRect(0, 0, 1920, 1080);
      await paint(g, t, p ?? t / D, k);
    },
    dispose() { layer?.remove?.(); },
  };
}

// ---------------------------------------------------------------- paper, grain, ledger, shadows
const grainCache = new WeakMap(); let GRAIN = null;
function grainTile() {
  if (GRAIN) return GRAIN; GRAIN = mk(256, 256); const x = GRAIN.getContext('2d'), im = x.createImageData(256, 256), r = rng(17);
  // black speckles with alpha (1 - v/255), drawn source-over: the same result as multiplying by a v-grey tile, without the
  // multiply composite (its scratch layer ghosted old pixels on the software canvas)
  for (let i = 0; i < im.data.length; i += 4) { const v = 238 + r() * 17; im.data[i] = 1; im.data[i + 1] = 0; im.data[i + 2] = 0; im.data[i + 3] = Math.round(255 - v); }
  x.putImageData(im, 0, 0); return GRAIN;
}
export function grain(g, w = 1920, h = 1080, a = 0.45, x0 = 0, y0 = 0) {
  if (!grainCache.has(g)) grainCache.set(g, g.createPattern(grainTile(), 'repeat'));
  g.save(); g.globalAlpha *= a; g.fillStyle = grainCache.get(g); g.fillRect(x0, y0, w, h); g.restore();
}
// ledger rules: thin horizontal lines every `step`, optional column rules and a double margin line (teal, never red)
export function ledgerLines(g, x0, y0, w, h, { step = 54, cols = [], margin = null, color = P.ledger, colColor = P.ledgerCol, alpha = 1 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color;
  for (let y = y0 + step; y < y0 + h; y += step) g.fillRect(x0, y, w, 1.6);
  g.fillStyle = colColor; for (const cx of cols) g.fillRect(cx, y0, 1.6, h);
  if (margin != null) { g.fillStyle = 'rgba(42,140,134,0.32)'; g.fillRect(margin, y0, 2, h); g.fillRect(margin + 7, y0, 2, h); }
  g.restore();
}
// the paper ground: bright cool paper, a soft daylight from the upper left, faint grain, optional ledger rules
export function paper(g, { tone = P.paper, sun = [380, -160], cool = 0.06, grainA = 0.4, ledger = true, step = 54, margin = 96, cols = null } = {}) {
  g.fillStyle = tone; g.fillRect(-200, -200, 2320, 1480);
  if (ledger) ledgerLines(g, -200, -200 + ((54 * 6) % step), 2320, 1480, { step, margin, cols: cols ?? [] });
  const sg = g.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], 1900);
  sg.addColorStop(0, 'rgba(255,255,255,0.8)'); sg.addColorStop(0.5, 'rgba(255,255,253,0.25)'); sg.addColorStop(1, 'rgba(255,255,250,0)');
  g.fillStyle = sg; g.fillRect(-200, -200, 2320, 1480);
  const vg = g.createRadialGradient(960, 540, 640, 960, 540, 1400); vg.addColorStop(0, 'rgba(40,60,90,0)'); vg.addColorStop(1, `rgba(40,60,90,${cool})`);
  g.fillStyle = vg; g.fillRect(-200, -200, 2320, 1480);
  grain(g, 2320, 1480, grainA, -200, -200);
}
// soft paper-cut shadow; lift 0..2 (how high the cut floats). Blur and offset are in device px, so scale by S.
let SS = 1; export const setS = (s) => { SS = s; };
export function shadow(g, lift = 1, a = 1, S = SS) {
  g.shadowColor = `rgba(20,35,61,${(0.11 + 0.06 * lift) * a})`; g.shadowBlur = (10 + 22 * lift) * S; g.shadowOffsetX = (2 + 4 * lift) * S; g.shadowOffsetY = (5 + 11 * lift) * S;
}
export const noShadow = (g) => { g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; };
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export function card(g, x, y, w, h, { r = 22, fill = P.card, lift = 1, S = SS, alpha = 1, grainA = 0.3, stroke = null } = {}) {
  if (alpha <= 0 || w <= 0 || h <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  // the drop shadow as a filtered shape (canvas shadowBlur leaves a hard edge at the blur's extent on big cards in Chrome)
  // (stacked translucent rounded rects instead of ctx.filter blur: the filter's scratch layer is not cleared on the software
  // canvas, so a previous shot's clip edges ghosted through big cards)
  { const b = (10 + 22 * lift) / 2, A = 0.11 + 0.06 * lift, N = 9, sx = x + 2 + 4 * lift, sy = y + 5 + 11 * lift; g.save();
    for (let i = 0; i < N; i++) { const e = b * (1 - 2 * (i + 0.5) / N); g.fillStyle = `rgba(20,35,61,${(A / N * 1.25).toFixed(4)})`; rr(g, sx - e, sy - e, w + 2 * e, h + 2 * e, Math.max(1, r + e)); g.fill(); }
    g.restore(); }
  rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill();
  if (grainA) { g.save(); rr(g, x, y, w, h, r); g.clip(); grain(g, w, h, grainA, x, y); g.restore(); }
  if (stroke) { rr(g, x, y, w, h, r); g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- type
export function font(size, weight = 800, fam = F.sans, style = '') { return `${style} ${weight} ${size}px ${fam}`.trim(); }
export function text(g, s, x, y, { size = 40, weight = 800, fam = F.sans, style = '', color = P.ink, align = 'left', base = 'alphabetic', track = 0, alpha = 1, upper = false, maxW = null } = {}) {
  s = String(s ?? ''); if (upper) s = s.toUpperCase(); if (alpha <= 0 || !s) return;
  g.save(); g.globalAlpha *= clamp(alpha); g.font = font(size, weight, fam, style); g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = `${track * size}px`;
  if (maxW) { const w = g.measureText(s).width; if (w > maxW) { const k = maxW / w; g.translate(x, y); g.scale(k, k); x = 0; y = 0; } }
  g.fillText(s, x, y); g.restore();
}
// ledger figures: Plex Mono (fixed-width digits, so numbers stay put while they count)
export const fig = (g, s, x, y, o = {}) => text(g, s, x, y, { weight: 500, fam: F.mono, ...o });
export function measure(g, s, size, weight = 800, fam = F.sans, track = 0, style = '') { g.save(); g.font = font(size, weight, fam, style); g.letterSpacing = `${track * size}px`; const w = g.measureText(String(s)).width; g.restore(); return w; }
export function wrap(g, s, maxW, size, weight = 700, fam = F.sans, style = '') {
  const words = String(s).split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(g, n, size, weight, fam, 0, style) > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur); return lines;
}
// a line that rises out of a mask (k 0..1)
export function riseText(g, s, x, y, k, o = {}) {
  const size = o.size ?? 40; if (k <= 0 || !s) return;
  g.save(); const w = measure(g, o.upper ? String(s).toUpperCase() : s, size, o.weight ?? 800, o.fam ?? F.sans, o.track ?? 0, o.style ?? '');
  const sc = o.maxW && w > o.maxW ? o.maxW / w : 1, ww = w * sc;
  const ax = o.align === 'center' ? x - ww / 2 : o.align === 'right' ? x - ww : x;
  g.beginPath(); g.rect(ax - size * 0.3, y - size * 1.05, ww + size * 0.6, size * 1.38); g.clip();
  text(g, s, x, y + (1 - E.emphasized(k)) * size * 1.15, o); g.restore();
}
export const fmt = (v, dec = 0) => { const s = Math.abs(v).toFixed(dec); const [a, b] = s.split('.'); return (v < 0 ? '−' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };
export const signed = (v, dec = 2) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(dec);

// white pill label (Wendover): dark type, soft shadow, optional dot colour
export function pill(g, s, x, y, { size = 30, color = P.ink, fill = P.white, dot = null, align = 'left', alpha = 1, k = 1, weight = 700, pad = 0.55, lift = 0.6, fam = F.sans, track = 0 } = {}) {
  if (k <= 0 || !s) return null;
  const w = measure(g, s, size, weight, fam, track) + size * pad * 2 + (dot ? size * 0.75 : 0), h = size * 1.75;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y0 = y - h / 2;
  const sc = E.outBack(clamp(k * 1.2));
  g.save(); g.globalAlpha *= alpha * clamp(k * 2.5); g.translate(x0 + w / 2, y); g.scale(sc, sc); g.translate(-(x0 + w / 2), -y);
  shadow(g, lift); rr(g, x0, y0, w, h, h / 2); g.fillStyle = fill; g.fill(); noShadow(g);
  let tx = x0 + size * pad;
  if (dot) { g.fillStyle = dot; g.beginPath(); g.arc(tx + size * 0.28, y, size * 0.26, 0, TAU); g.fill(); tx += size * 0.75; }
  text(g, s, tx, y + size * 0.36, { size, weight, color, fam, track }); g.restore();
  return { x: x0, y: y0, w, h };
}
// navy slab with white caps (Primal/Neo): the claim label. fill P.red only for the number that matters.
export function slab(g, s, x, y, { size = 34, fill = P.ink, color = P.white, align = 'left', k = 1, track = 0.05, lift = 0.8, weight = 800 } = {}) {
  if (k <= 0 || !s) return null; s = String(s).toUpperCase();
  const w = measure(g, s, size, weight, F.sans, track) + size * 1.1, h = size * 1.7;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.save(); g.globalAlpha *= clamp(k * 3); const wk = E.emphasized(k);
  g.beginPath(); g.rect(x0 - 40, y - h / 2 - 40, (w + 80) * wk, h + 80); g.clip();
  shadow(g, lift); rr(g, x0, y - h / 2, w, h, 8); g.fillStyle = fill; g.fill(); noShadow(g);
  text(g, s, x0 + size * 0.55, y + size * 0.36, { size, weight, color, track }); g.restore();
  return { x: x0, w, h };
}
// kicker: short teal rule + mono caps (the meta caption)
export function kicker(g, s, x, y, k = 1, { color = P.ink, rule = P.teal, size = 24 } = {}) {
  if (k <= 0 || !s) return;
  g.save(); g.fillStyle = rule; g.fillRect(x, y - size * 1.6, 64 * E.emphasized(k), 5);
  text(g, s, x, y, { size, weight: 500, fam: F.mono, color, track: 0.14, upper: true, alpha: E.outCubic(range(k, 0.2, 1)) }); g.restore();
}
// source line, bottom right, on a soft paper backing so it reads on anything
export function source(g, s, k = 1, { x = 1840, y = 1040, align = 'right', color = P.inkSoft, size = 18, back = true } = {}) {
  if (!s || k <= 0) return;
  s = String(s).toUpperCase();
  if (back) { const w = measure(g, s, size, 500, F.mono, 0.1); const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x; g.save(); g.globalAlpha = 0.86 * E.outCubic(k); rr(g, x0 - 14, y - size * 1.25, w + 28, size * 1.9, 7); g.fillStyle = P.paper; g.fill(); g.restore(); }
  text(g, s, x, y, { size, weight: 500, fam: F.mono, color, align, track: 0.1, alpha: E.outCubic(k) });
}
// ⏱ live fact: navy pill, white mono caps, red dot
export function asOf(g, s, x, y, k = 1, { align = 'left', size = 22 } = {}) {
  if (!s || k <= 0) return null;
  return pill(g, String(s).toUpperCase(), x, y, { size, fill: P.ink, color: P.white, dot: P.red, align, k, weight: 500, fam: F.mono, track: 0.08 });
}
// our math: mint pill with a teal dot
export function ourMath(g, s, x, y, k = 1, { align = 'left', size = 22 } = {}) {
  if (k <= 0) return null;
  return pill(g, String(s ? `OUR MATH · ${s}` : 'OUR MATH').toUpperCase(), x, y, { size, fill: P.mint, color: P.tealDeep, dot: P.teal, align, k, weight: 500, fam: F.mono, track: 0.06 });
}
// a hand-drawn red marker loop around a box (k 0..1 draws it on)
export function markerLoop(g, x, y, w, h, k, { color = P.red, width = 6, seed = 3, over = 1.12, padX = 26, padY = 18 } = {}) {
  if (k <= 0) return; const r = rng(seed), cx = x + w / 2, cy = y + h / 2, rx = w / 2 + padX, ry = h / 2 + padY;
  const n = 64, turns = over, j = [r() * 0.04, r() * 0.06, r() * TAU];
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha *= 0.92;
  g.beginPath(); const m = Math.max(2, Math.floor(n * turns * clamp(k)));
  for (let i = 0; i <= m; i++) {
    const a = -2.6 + (i / n) * TAU, wob = 1 + j[0] * Math.sin(a * 3 + j[2]) + (i / n) * 0.05;
    const px = cx + Math.cos(a) * rx * wob, py = cy + Math.sin(a) * ry * (1 + j[1] * Math.cos(a * 2));
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke(); g.restore();
}

// ---------------------------------------------------------------- marks
// red map pin with a pulse ring
export function pin(g, x, y, t, k = 1, { color = P.red, r = 11, pulse = true } = {}) {
  if (k <= 0) return; const s = E.outBack(clamp(k * 1.3));
  g.save(); if (pulse) { const ph = (t * 0.7) % 1; g.strokeStyle = color; g.globalAlpha = (1 - ph) * 0.55 * k; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + ph * 34, 0, TAU); g.stroke(); }
  g.globalAlpha = 1; shadow(g, 0.4); g.fillStyle = P.white; g.beginPath(); g.arc(x, y, (r + 5) * s, 0, TAU); g.fill(); noShadow(g);
  g.fillStyle = color; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.fill(); g.restore();
}
// a clock face (hands at h:m:s), white disc with navy ticks
export function clock(g, cx, cy, R, hh, mm, ss = 0, { red = false, k = 1 } = {}) {
  if (k <= 0) return; const s = E.outBack(clamp(k));
  g.save(); g.translate(cx, cy); g.scale(s, s);
  shadow(g, 1.2); g.fillStyle = P.white; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); noShadow(g);
  g.strokeStyle = P.ink; g.lineWidth = R * 0.05; g.beginPath(); g.arc(0, 0, R * 0.97, 0, TAU); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; g.strokeStyle = big ? P.ink : P.inkFaint; g.lineWidth = big ? R * 0.035 : R * 0.012;
    g.beginPath(); g.moveTo(Math.sin(a) * R * 0.86, -Math.cos(a) * R * 0.86); g.lineTo(Math.sin(a) * R * (big ? 0.72 : 0.8), -Math.cos(a) * R * (big ? 0.72 : 0.8)); g.stroke(); }
  const hand = (a, L, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(-Math.sin(a) * L * 0.14, Math.cos(a) * L * 0.14); g.lineTo(Math.sin(a) * L, -Math.cos(a) * L); g.stroke(); };
  const ah = ((hh % 12) + mm / 60 + ss / 3600) / 12 * TAU, am = (mm + ss / 60) / 60 * TAU, as = ss / 60 * TAU;
  hand(ah, R * 0.5, R * 0.07, P.ink); hand(am, R * 0.74, R * 0.05, P.ink); hand(as, R * 0.8, R * 0.018, red ? P.red : P.teal);
  g.fillStyle = red ? P.red : P.ink; g.beginPath(); g.arc(0, 0, R * 0.06, 0, TAU); g.fill();
  g.restore();
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

// ---------------------------------------------------------------- dates
export const ms = (d) => Date.parse(d + 'T00:00:00Z');
export const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const dstr = (d) => { const x = new Date(typeof d === 'number' ? d : ms(d)); return `${x.getUTCDate()} ${MON[x.getUTCMonth()]} ${x.getUTCFullYear()}`; };

// ---------------------------------------------------------------- the seabed section (RESEARCH §5c, §6, §7, §11.3)
// Bomb 4's depths in feet. S01 p.94 (✓): it "descended to a depth of 355 fathoms [2,130 ft]… touched down on the rim of
// an underwater ridge", was dragged over the edge and slid down a furrow "approximately 400 feet long" to 2,550 ft "lying on
// a 70 degree slope" (found 15 Mar); after the 24 Mar line parted it lay "120 yards" away on 210°T "at a depth of 2800 feet"
// (re-found 2 Apr: 250 ft deeper, D35). Lifted 7 Apr from ~2,850 ft (S40 + NRDC caption, ⚑). Pinnacle's 22 Jan sonar hits:
// "just over two thousand feet" (S40, ⚑).
export const DEPTH = { pinnacle: 2000, touch: 2130, find: 2550, refind: 2800, lift: 2850 };
// A SCHEMATIC profile, coast to canyon floor: [u (0..1 across; NOT to horizontal scale), feet below the surface (negative =
// land above the sea, drawn at the same exaggerated scale)]. Shelf (~80 m) to ~5 km, the shelf break (200 m ≈ 656 ft), the
// canyon slope, the ridge rim (2,130 ft), the steep wall where bomb 4 was found (2,550 ft), the gentler plain where it was
// re-found (2,800 ft) and lifted (~2,850 ft). Shape after RESEARCH §11.3 (S38 bathymetry, a reconstruction).
export const SEABED = [[-0.03, -340], [0.02, -320], [0.06, -230], [0.1, -90], [0.13, 0], [0.16, 60], [0.25, 200], [0.29, 262],
  [0.34, 656], [0.42, 1300], [0.5, 1800], [0.565, 2080], [0.6, 2130], [0.622, 2150], [0.636, 2700], [0.7, 2760], [0.8, 2800], [1.03, 2900]];
export function bedFt(u) {
  const S = SEABED; if (u <= S[0][0]) return S[0][1];
  for (let i = 1; i < S.length; i++) if (u <= S[i][0]) { const [a, fa] = S[i - 1], [b, fb] = S[i]; return lerp(fa, fb, (u - a) / (b - a)); }
  return S.at(-1)[1];
}
// where each state sits along the profile (u): on the rim, on the wall at 2,550, on the plain at 2,800 and ~2,850 ft
const uAt = (ft, a, b) => { for (let u = a; u <= b; u += 0.0002) if (bedFt(u) >= ft) return u; return b; };
export const UPOS = { touch: 0.611, find: uAt(2550, 0.622, 0.636), refind: uAt(2800, 0.7, 0.95), lift: uAt(2850, 0.8, 1.02), simo: 0.45 };

// geometry of a section drawn in rect [x0, ys (the sea surface), w, h (pixels for maxFt)]
export function section(rect, { maxFt = 3000, landK = 1 } = {}) {
  const [x0, ys, w, h] = rect;
  const X = (u) => x0 + u * w, Y = (ft) => ys + (ft < 0 ? ft * landK : ft) * h / maxFt;
  const ang = (u) => { const a = [X(u - 0.003), Y(bedFt(u - 0.003))], b = [X(u + 0.003), Y(bedFt(u + 0.003))]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  // a point on the bed, lifted `off` px along the normal (toward the water)
  const at = (u, off = 0) => { const a = ang(u); return [X(u) + Math.sin(a) * off, Y(bedFt(u)) - Math.cos(a) * off]; };
  const pts = [[X(-1.5), Y(SEABED[0][1])]]; for (let u = SEABED[0][0]; u <= 1.03; u += 0.002) pts.push([X(u), Y(bedFt(u))]);
  return { X, Y, at, ang, pts, x0, ys, w, h, maxFt, shore: X(0.13) };
}
// paint it: sea (pale teal deepening), the bed (sand under the sea, house land above it), the surface line with slow swell,
// a few village blocks on the shore. o: { t, alpha, dark (0..1 extra night tint), village, sea, bedLine }
export function drawSection(g, S, { t = 0, alpha = 1, dark = 0, village = true, x1 = null, swell = 1 } = {}) {
  if (alpha <= 0) return;
  const xr = x1 ?? S.X(1.03), yb = S.ys + S.h + 80;
  g.save(); g.globalAlpha *= alpha;
  // sea
  const sg = g.createLinearGradient(0, S.ys, 0, S.ys + S.h);
  sg.addColorStop(0, '#d9ecea'); sg.addColorStop(0.35, '#c3e0de'); sg.addColorStop(1, '#94c1c2');
  g.fillStyle = sg; g.fillRect(S.shore - 2, S.ys, xr - S.shore + 2, yb - S.ys);
  if (dark > 0) { const dg = g.createLinearGradient(0, S.ys, 0, S.ys + S.h); dg.addColorStop(0, `rgba(20,35,61,${0.08 * dark})`); dg.addColorStop(1, `rgba(20,35,61,${0.42 * dark})`); g.fillStyle = dg; g.fillRect(S.shore - 2, S.ys, xr - S.shore + 2, yb - S.ys); }
  // faint isobath ticks in the water every 500 ft (ledger feel)
  g.fillStyle = 'rgba(42,140,134,0.16)';
  for (let ft = 500; ft < S.maxFt; ft += 500) { const y = S.Y(ft); for (let x = S.shore + 10; x < xr; x += 14) g.fillRect(x, y, 6, 1.5); }
  // the bed (land above the surface uses the house land tones)
  const [lx, ly] = S.pts.at(-1), ext = [xr + 40, ly + (xr + 40 - lx) * 0.04], line = [...S.pts, ext];
  const bed = new Path2D(); bed.moveTo(S.pts[0][0], yb); line.forEach(([x, y]) => bed.lineTo(x, y)); bed.lineTo(xr + 40, yb); bed.closePath();
  const bg = g.createLinearGradient(0, S.Y(-340), 0, yb);
  const k0 = clamp((S.ys - S.Y(-340)) / (yb - S.Y(-340)));
  bg.addColorStop(0, '#f3f4ee'); bg.addColorStop(k0, '#e9ebe2'); bg.addColorStop(Math.min(1, k0 + 0.001), '#ebe6d6'); bg.addColorStop(1, '#d8d1bc');
  // soft shadow by jittered stacked fills (no ctx.filter: its scratch layer ghosts old pixels on the software canvas)
  g.save(); g.fillStyle = 'rgba(20,35,61,0.016)'; for (let i = 0; i < 8; i++) { const a = i * 0.785, rr2 = 4.5; g.save(); g.translate(3 + Math.cos(a) * rr2, 7 + Math.sin(a) * rr2); g.fill(bed); g.restore(); } g.restore();
  g.fillStyle = bg; g.fill(bed);
  g.save(); g.clip(bed); const gx = Math.max(-300, S.pts[0][0]); grain(g, xr - gx + 200, yb - S.Y(-400), 0.35, gx, S.Y(-400)); g.restore();
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.6; g.lineJoin = 'round'; g.beginPath(); line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
  // the surface: navy line with a slow swell
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath();
  for (let x = S.shore; x <= xr; x += 6) { const y = S.ys + Math.sin(x * 0.03 + t * 1.3) * 2.2 * swell; x === S.shore ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke(); g.restore();
  // a village on the shore (white blocks, navy hairlines)
  if (village) {
    // inset from the frame edge, and each block sits on the lowest point of the ground under it (no floating corners)
    const r = rng(23); const vx0 = Math.max(S.X(0.035), 48), vx1 = Math.max(S.X(0.115), vx0 + 150);
    for (let i = 0; i < 6; i++) {
      const x = lerp(vx0, vx1, (i + r() * 0.4) / 6), bw = 18 + r() * 12, bh = 14 + r() * 16, gy = (xx) => S.Y(bedFt((xx - S.x0) / S.w)), y = Math.max(gy(x), gy(x + bw)) + 4;
      g.fillStyle = P.white; g.strokeStyle = 'rgba(20,35,61,0.6)'; g.lineWidth = 1.4; g.fillRect(x, y - bh + 3, bw, bh); g.strokeRect(x, y - bh + 3, bw, bh);
    }
  }
  g.restore();
}
// bomb 4 as a glyph: a white casing with navy line, rounded nose, tail fins; ang = nose direction. L = length in px.
// chute 0..1 trails the pale (off-white, RESEARCH READ FIRST 3) canopy behind the tail. ghost: dashed outline only.
export function bomb(g, x, y, ang, L, { alpha = 1, chute = 0, ghost = false, line = P.ink, fill = P.white, t = 0, lw = null } = {}) {
  if (alpha <= 0) return;
  const r = L * 0.085, w = lw ?? Math.max(1.6, L * 0.035);
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.rotate(ang);
  if (chute > 0 && !ghost) {
    const cl = L * 0.95 * chute, sw = Math.sin(t * 1.6) * 0.08;
    g.save(); g.fillStyle = 'rgba(250,247,236,0.96)'; g.strokeStyle = 'rgba(20,35,61,0.55)'; g.lineWidth = w * 0.6;
    g.beginPath(); g.moveTo(-L / 2, -r * 0.6);
    g.bezierCurveTo(-L / 2 - cl * 0.4, -r * 1.2, -L / 2 - cl * 0.8, -L * (0.3 + sw) * chute, -L / 2 - cl, -L * (0.2 + sw) * chute);
    g.bezierCurveTo(-L / 2 - cl * 1.1, 0, -L / 2 - cl * 1.05, L * (0.18 - sw) * chute, -L / 2 - cl * 0.85, L * (0.26 - sw) * chute);
    g.bezierCurveTo(-L / 2 - cl * 0.5, r * 1.6, -L / 2 - cl * 0.25, r, -L / 2, r * 0.6); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(-L / 2, 0); g.lineTo(-L / 2 - cl * 0.8, i * L * 0.07 * chute); } g.stroke(); g.restore();
  }
  const body = new Path2D();
  body.moveTo(-L / 2, -r); body.lineTo(L / 2 - r * 1.9, -r); body.bezierCurveTo(L / 2 - r * 0.4, -r, L / 2, -r * 0.45, L / 2, 0);
  body.bezierCurveTo(L / 2, r * 0.45, L / 2 - r * 0.4, r, L / 2 - r * 1.9, r); body.lineTo(-L / 2, r); body.closePath();
  const fins = new Path2D();
  fins.moveTo(-L / 2 + r * 1.6, -r); fins.lineTo(-L / 2 - r * 0.1, -r * 2.25); fins.lineTo(-L / 2 - r * 0.25, -r); fins.closePath();
  fins.moveTo(-L / 2 + r * 1.6, r); fins.lineTo(-L / 2 - r * 0.1, r * 2.25); fins.lineTo(-L / 2 - r * 0.25, r); fins.closePath();
  g.lineWidth = w; g.lineJoin = 'round'; g.strokeStyle = line;
  if (ghost) { g.setLineDash([w * 2.4, w * 1.8]); g.stroke(body); g.stroke(fins); g.restore(); return; }
  if (!ghost) { shadow(g, 0.25, 0.8); g.fillStyle = fill; g.fill(fins); g.fill(body); noShadow(g); }
  g.stroke(fins); g.stroke(body);
  g.beginPath(); g.moveTo(L / 2 - r * 3.2, -r); g.lineTo(L / 2 - r * 3.2, r); g.moveTo(-L / 2 + r * 2.4, -r); g.lineTo(-L / 2 + r * 2.4, r); g.lineWidth = w * 0.6; g.stroke();
  g.restore();
}
// a small ship on the surface (hull below the line, deckhouse and an A-frame aft): navy silhouette
export function ship(g, x, y, s = 1, { alpha = 1, color = P.ink } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.scale(s, s); g.fillStyle = color;
  g.beginPath(); g.moveTo(-70, -6); g.lineTo(78, -6); g.lineTo(62, 12); g.lineTo(-62, 12); g.closePath(); g.fill();
  g.fillRect(-28, -24, 46, 18); g.fillRect(-14, -36, 20, 12); g.fillRect(-4, -50, 3, 14);
  g.lineWidth = 3; g.strokeStyle = color; g.beginPath(); g.moveTo(-60, -6); g.lineTo(-50, -30); g.lineTo(-40, -6); g.stroke();
  g.restore();
}
// a fence (posts + mesh) standing on ground y, from x0 to x1
export function fence(g, x0, x1, y, h = 26, { alpha = 1, color = P.ink } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.strokeStyle = color; g.lineWidth = 2.2;
  for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 22))) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); }
  g.lineWidth = 1; g.globalAlpha *= 0.6; g.beginPath();
  for (let x = x0; x < x1; x += 7) { g.moveTo(x, y - h + 3); g.lineTo(Math.min(x1, x + 7), y - 2); g.moveTo(Math.min(x1, x + 7), y - h + 3); g.lineTo(x, y - 2); }
  g.stroke(); g.globalAlpha /= 0.6; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y - h); g.lineTo(x1, y - h); g.stroke();
  g.restore();
}
// a red pulse ring (the one red thing), with a solid dot
export function pulse(g, x, y, t, k = 1, { r = 10, color = P.red, dot = true } = {}) {
  if (k <= 0) return;
  g.save();
  for (let q = 0; q < 2; q++) { const ph = (t * 0.75 + q * 0.5) % 1; g.strokeStyle = color; g.globalAlpha = (1 - ph) * 0.6 * k; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + ph * 38, 0, TAU); g.stroke(); }
  if (dot) { g.globalAlpha = k; g.fillStyle = color; g.beginPath(); g.arc(x, y, r * 0.55 * E.outBack(clamp(k)), 0, TAU); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- images (photos: projects/palomares/assets/photos, or any absolute path)
const IMG = {};
export function image(url) {
  return IMG[url] ??= new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error(`image not found: ${url}`)); im.src = url; })
    .then(async (im) => { try { await im.decode(); } catch { /* already decoded */ } return im; });
}

export const esc = (s) => String(s ?? '');
export default function makeGraphicsKit() { return {}; }
