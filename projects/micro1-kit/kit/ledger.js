// LEDGER look: tokens, easing and 2D-canvas drawing helpers for the vertical (1080x1920) kit.
// Pure at import time (node imports the sets for their sfx plans); DOM is touched only inside functions.
//
// Layout contract (1080x1920 design units; the runtime scales to the render size):
//   content safe area   x 80..1000, y 220..1500
//   source line         y ~1460 (above the captions)
//   captions            y 1500..1700 (runtime overlay)
//   bottom 220 px and top 200 px: platform UI, keep empty (the progress bar sits on the very top edge)
export const W = 1080, H = 1920;
export const SAFE = { x0: 80, x1: 1000, y0: 220, y1: 1500, w: 920, cx: 540, cy: 860 };
export const PAL = {
  paper: '#f3efe6', paper2: '#ebe5d7', card: '#fbf9f4', rule: '#ddd5c4', ink: '#121212', inkSoft: '#57534b', inkFaint: '#a39d90',
  green: '#17a35b', greenDark: '#0f7a43', greenTint: '#d6eedf', yellow: '#ffe14d', red: '#e0241b',
};
export const FONT = { display: '"Big Shoulders Display"', body: '"Archivo Narrow"', mono: '"Plex Mono"' };
export const font = (weight, size, fam = FONT.display) => `${weight} ${Math.round(size)}px ${fam}, sans-serif`;
export const MIN_TEXT = 44; // nothing on screen is smaller than this (px at 1080 wide)

// ---------------------------------------------------------------- maths + easing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const outCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const outQuart = (t) => 1 - Math.pow(1 - clamp(t), 4);
export const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const inOutCubic = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const inCubic = (t) => Math.pow(clamp(t), 3);
export const outBack = (t, k = 1.9) => { t = clamp(t); const c3 = k + 1; return 1 + c3 * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
// damped spring 0 -> 1 with one visible overshoot (snappy pops)
export const spring = (t, f = 3.2, z = 0.42) => { if (t <= 0) return 0; const x = clamp(t); return 1 - Math.exp(-z * 10 * x) * Math.cos(f * Math.PI * x * (1 - x * 0.3)); };
// pop envelope for an element appearing at `at`: alpha (fast) and scale (overshoot)
export function pop(t, at, d = 0.42, k = 2.2) { const u = range(t, at, at + d); return { u, a: clamp(u * 5), s: u <= 0 ? 0 : outBack(u, k) }; }
// slam: comes in big and lands (headline words)
export function slam(t, at, d = 0.28) { const u = range(t, at, at + d); return { u, a: clamp(u * 4), s: u <= 0 ? 0 : lerp(1.9, 1, outCubic(u)) + 0.06 * Math.sin(Math.PI * clamp((t - at - d) / 0.18)) * (t > at + d ? Math.exp(-(t - at - d) * 12) : 0) }; }
// continuous idle wobble so nothing is ever static
export const bob = (t, amp = 4, f = 0.6, ph = 0) => amp * Math.sin((t * f + ph) * Math.PI * 2);

export function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- shapes
export function rr(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
// paper card with a soft two-step shadow (cheap: no blur filter), optional ink border
export function card(g, x, y, w, h, { r = 26, fill = PAL.card, stroke = null, lw = 4, lift = 1, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = 'rgba(40,30,10,0.07)'; rr(g, x - 2, y + 10 * lift, w + 4, h + 8 * lift, r + 6); g.fill();
  g.fillStyle = 'rgba(40,30,10,0.09)'; rr(g, x + 2, y + 5 * lift, w - 4, h + 2 * lift, r + 2); g.fill();
  g.fillStyle = fill; rr(g, x, y, w, h, r); g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; rr(g, x, y, w, h, r); g.stroke(); }
  g.restore();
}
// highlighter swipe: marker-yellow band drawn left to right (u 0..1), slightly ragged, chisel ends
export function swipe(g, x, y, w, h, u, { color = PAL.yellow, seed = 1, alpha = 1, tilt = -0.012 } = {}) {
  if (u <= 0 || w <= 0) return;
  const r = rng(seed), ww = w * outCubic(u), n = 8, j = h * 0.06;
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color; g.beginPath();
  const yy = (xx) => y + (xx - x) * tilt;
  g.moveTo(x + h * 0.12, yy(x) + r() * j);
  for (let i = 1; i <= n; i++) { const xx = x + ww * i / n; g.lineTo(xx, yy(xx) + (r() - 0.5) * j); }
  g.lineTo(x + ww + h * 0.08, yy(x + ww) + h * 0.5);
  for (let i = n; i >= 0; i--) { const xx = x + ww * i / n; g.lineTo(xx - h * 0.06, yy(xx) + h + (r() - 0.5) * j); }
  g.closePath(); g.fill(); g.restore();
}
// red strike-through drawn on (u 0..1)
export function strike(g, x, y, w, u, { color = PAL.red, lw = 9 } = {}) {
  if (u <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 6, y + 4); g.lineTo(x - 6 + (w + 12) * outCubic(u), y - 4 * outCubic(u)); g.stroke(); g.restore();
}
// green check mark drawn on (u 0..1)
export function check(g, cx, cy, s, u, { color = PAL.green, lw } = {}) {
  if (u <= 0) return;
  const p = [[-0.42, 0.02], [-0.12, 0.32], [0.45, -0.32]];
  const l1 = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), l2 = Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]);
  const d = outCubic(u) * (l1 + l2);
  g.save(); g.strokeStyle = color; g.lineWidth = lw ?? s * 0.16; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(cx + p[0][0] * s, cy + p[0][1] * s);
  const k1 = Math.min(1, d / l1); g.lineTo(cx + lerp(p[0][0], p[1][0], k1) * s, cy + lerp(p[0][1], p[1][1], k1) * s);
  if (d > l1) { const k2 = (d - l1) / l2; g.lineTo(cx + lerp(p[1][0], p[2][0], k2) * s, cy + lerp(p[1][1], p[2][1], k2) * s); }
  g.stroke(); g.restore();
}
export function cross(g, cx, cy, s, u, { color = PAL.red, lw } = {}) {
  if (u <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = lw ?? s * 0.16; g.lineCap = 'round';
  const a = outCubic(clamp(u * 2)), b = outCubic(clamp(u * 2 - 1)), k = 0.36 * s;
  g.beginPath(); g.moveTo(cx - k, cy - k); g.lineTo(cx - k + 2 * k * a, cy - k + 2 * k * a);
  if (b > 0) { g.moveTo(cx + k, cy - k); g.lineTo(cx + k - 2 * k * b, cy - k + 2 * k * b); }
  g.stroke(); g.restore();
}
// arrow from (x0,y0) to (x1,y1), drawn to fraction u, with a head once nearly complete
export function arrow(g, x0, y0, x1, y1, u, { color = PAL.ink, lw = 8, head = 26, dash = null, dashOff = 0 } = {}) {
  if (u <= 0) return;
  const x = lerp(x0, x1, u), y = lerp(y0, y1, u), a = Math.atan2(y1 - y0, x1 - x0);
  g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  if (dash) { g.setLineDash(dash); g.lineDashOffset = dashOff; }
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * head * 0.6 * smooth(u * 4), y - Math.sin(a) * head * 0.6 * smooth(u * 4)); g.stroke();
  g.setLineDash([]);
  const hs = head * smooth(range(u, 0.6, 1));
  if (hs > 0.5) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - 0.5) * hs, y - Math.sin(a - 0.5) * hs); g.lineTo(x - Math.cos(a + 0.5) * hs, y - Math.sin(a + 0.5) * hs); g.closePath(); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- type
// largest size <= max at which `text` fits in maxW (binary search on measureText)
export function fit(g, text, maxW, max, min = MIN_TEXT, weight = 800, fam = FONT.display, spacing = 0) {
  let lo = min, hi = max;
  const wAt = (s) => { g.font = font(weight, s, fam); return g.measureText(text).width + spacing * s * Math.max(0, text.length - 1); };
  if (wAt(hi) <= maxW) return hi;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (wAt(m) <= maxW) lo = m; else hi = m; }
  return Math.floor(lo);
}
// greedy word wrap at the current g.font
export function wrap(g, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    const tryL = line ? line + ' ' + w : w;
    if (g.measureText(tryL).width <= maxW || !line) line = tryL; else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out;
}
// wrap + shrink to fit a box: returns { size, lines, lh }
export function fitBlock(g, text, maxW, maxH, max, { min = MIN_TEXT, weight = 700, fam = FONT.body, lh = 1.12, maxLines = 6, oneLine = 0.75 } = {}) {
  // a single line wins if it stays at >= oneLine * max (short labels shouldn't wrap just to be bigger)
  const s1 = fit(g, text, maxW, max, min, weight, fam);
  if (s1 >= max * oneLine && s1 * lh <= maxH) { g.font = font(weight, s1, fam); if (g.measureText(text).width <= maxW) return { size: s1, lines: [text], lh: s1 * lh }; }
  for (let s = max; s >= min; s -= 2) {
    g.font = font(weight, s, fam);
    const lines = wrap(g, text, maxW);
    if (lines.length <= maxLines && lines.length * s * lh <= maxH && lines.every((l) => g.measureText(l).width <= maxW)) return { size: s, lines, lh: s * lh };
  }
  g.font = font(weight, min, fam);
  return { size: min, lines: wrap(g, text, maxW), lh: min * lh };
}
// small caps label in mono (kickers, sources): never below MIN_TEXT * 0.9
export function label(g, text, x, y, { size = 44, color = PAL.inkSoft, align = 'left', weight = 500, spacing = 0.08, alpha = 1, maxW = SAFE.w } = {}) {
  if (!text || alpha <= 0) return 0;
  g.save(); g.globalAlpha *= alpha;
  let s = size; g.font = font(weight, s, FONT.mono); g.letterSpacing = `${(spacing * s).toFixed(1)}px`;
  while (g.measureText(text).width > maxW && s > 40) { s -= 1; g.font = font(weight, s, FONT.mono); g.letterSpacing = `${(spacing * s).toFixed(1)}px`; }
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(text, x, y);
  const w = g.measureText(text).width; g.restore(); return w;
}
// a kicker chip: "● NEWS · 9 OCT 2026" in a pill, pops in at `at`
export function kicker(g, text, x, y, t, at = 0.1, { color = PAL.ink, dot = PAL.green, size = 44, align = 'left' } = {}) {
  if (!text) return;
  const p = pop(t, at, 0.4); if (p.a <= 0) return;
  g.save(); g.font = font(500, size, FONT.mono); g.letterSpacing = `${(0.1 * size).toFixed(1)}px`;
  const tw = g.measureText(text).width, w = tw + size * 1.9, h = size * 1.6;
  const x0 = align === 'center' ? x - w / 2 : x;
  g.translate(x0 + w / 2, y + h / 2); g.scale(p.s, p.s); g.globalAlpha = p.a;
  g.strokeStyle = color; g.lineWidth = 4; rr(g, -w / 2, -h / 2, w, h, h / 2); g.stroke();
  g.fillStyle = dot; g.beginPath(); g.arc(-w / 2 + size * 0.75, 0, size * 0.2 * (1 + 0.15 * Math.sin(t * 6)), 0, Math.PI * 2); g.fill();
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, -w / 2 + size * 1.25, size * 0.04);
  g.restore();
}

// ---------------------------------------------------------------- paper (built once per runtime)
export function paper(width = W, height = H, scale = 1) {
  const c = document.createElement('canvas'); c.width = width; c.height = height; const g = c.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, width, height);
  // faint ledger rules: wide baseline grid, like a pad
  g.strokeStyle = 'rgba(120,100,60,0.07)'; g.lineWidth = 2 * scale;
  for (let y = 120 * scale; y < height; y += 96 * scale) { g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.stroke(); }
  g.strokeStyle = 'rgba(23,163,91,0.10)'; g.beginPath(); g.moveTo(56 * scale, 0); g.lineTo(56 * scale, height); g.stroke();
  // grain + fibres
  const id = g.getImageData(0, 0, width, height), d = id.data, r = rng(7);
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  g.putImageData(id, 0, 0);
  g.lineWidth = 1.2 * scale;
  for (let i = 0; i < 260; i++) {
    const x = r() * width, y = r() * height, a = r() * Math.PI, l = (8 + r() * 26) * scale;
    g.strokeStyle = `rgba(110,90,60,${0.05 + r() * 0.06})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // very soft warm edge falloff
  const v = g.createRadialGradient(width / 2, height * 0.45, height * 0.25, width / 2, height * 0.45, height * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,70,30,0.10)');
  g.fillStyle = v; g.fillRect(0, 0, width, height);
  return c;
}

// fonts: Big Shoulders Display (OFL, copied into this kit); Archivo Narrow + Plex Mono come from engine/stage.html
let fontsP = null;
export function loadFonts(base = '/projects/micro1-kit/assets/fonts/') {
  return fontsP ??= (async () => {
    const f = new FontFace('Big Shoulders Display', `url(${base}BigShouldersDisplay.ttf)`, { weight: '100 900' });
    await f.load(); document.fonts.add(f);
    await Promise.all(['900 60px "Big Shoulders Display"', '800 60px "Big Shoulders Display"', '700 60px "Big Shoulders Display"', '700 60px "Archivo Narrow"', '500 60px "Archivo Narrow"', '500 60px "Plex Mono"', '400 60px "Plex Mono"'].map((s) => document.fonts.load(s)));
  })();
}
