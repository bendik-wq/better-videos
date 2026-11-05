// Building blocks for the "min" style (render.mjs --full --min): a few crisp words per beat and hand-drawn marker
// scribbles that draw on. Every helper takes `at` = seconds after the beat starts.
const P = (d, at, dur = 0.7, cls = '') => `<path ${cls ? `class="${cls}" ` : ''}data-draw data-d="${at}" data-dur="${dur}" d="${d}"/>`;
const svg = (vb, inner, attrs = '') => `<svg class="ln" viewBox="${vb}" preserveAspectRatio="none" ${attrs}>${inner}</svg>`;

// headline (h1 big, h2 smaller). Wrap the one key word in <k>…</k> to make it gold; <d>…</d> greys a word out.
const fmt = (t) => t.replace(/<k>(.*?)<\/k>/g, '<span class="k">$1</span>').replace(/<d>(.*?)<\/d>/g, '<span class="dim">$1</span>');
export const h1 = (t, at = 0.15) => `<div class="h1 split" data-d="${at}" data-step="0.07">${fmt(t)}</div>`;
export const h2 = (t, at = 0.15) => `<div class="h2 split" data-d="${at}" data-step="0.06">${fmt(t)}</div>`;
export const tag = (t, at = 0) => `<div class="tag" data-d="${at}">${t}</div>`;
// handwritten side note (Caveat), optionally gold
export const note = (t, at, gold = false) => `<div class="note${gold ? ' g' : ''}" data-d="${at}">${t}</div>`;

// marker marks around a word inside a headline: under (two quick strokes), circle, strike, box
export const under = (w, at, gold = false) => `<span class="mk u">${w}${svg('0 0 100 10', P('M1 6 C 22 3, 55 8, 99 4', at, 0.45, gold ? 'g' : '') + P('M6 9 C 35 7, 70 9, 96 7', at + 0.3, 0.35, gold ? 'g' : ''))}</span>`;
export const circle = (w, at, gold = true) => `<span class="mk o">${w}${svg('0 0 100 50', P('M86 9 C 64 -1, 14 2, 5 20 C -3 37, 34 51, 66 47 C 96 43, 103 22, 82 8 C 74 4, 64 3, 55 4', at, 0.8, gold ? 'g' : ''))}</span>`;
export const strike = (w, at) => `<span class="mk x">${w}${svg('0 0 100 10', P('M0 6 C 30 3, 70 8, 100 4', at, 0.35))}</span>`;
export const box = (w, at, gold = false) => `<span class="mk b">${w}${svg('0 0 100 50', P('M3 4 L97 2 L98 47 L2 48 Z', at, 0.9, gold ? 'g' : ''))}</span>`;

// free-standing marks (fixed pixel size, sit in the beat's flow)
export const arrow = (at, w = 150, gold = false) => `<svg class="ln" width="${w}" height="44" viewBox="0 0 ${w} 44">${P(`M4 30 C ${w * 0.35} 34, ${w * 0.65} 18, ${w - 10} 14`, at, 0.5, gold ? 'g' : '')}${P(`M${w - 30} 4 L${w - 8} 14 L${w - 26} 30`, at + 0.42, 0.25, gold ? 'g' : '')}</svg>`;
export const arrowDown = (at, gold = false) => `<svg class="ln" width="44" height="110" viewBox="0 0 44 110">${P('M22 4 C 18 40, 26 70, 22 100', at, 0.45, gold ? 'g' : '')}${P('M8 84 L22 102 L36 84', at + 0.38, 0.25, gold ? 'g' : '')}</svg>`;
export const tick = (at, s = 56) => `<svg class="ln" width="${s}" height="${s}" viewBox="0 0 40 40">${P('M5 22 L15 32 L36 7', at, 0.4, 'g')}</svg>`;
export const cross = (at, s = 52) => `<svg class="ln" width="${s}" height="${s}" viewBox="0 0 40 40">${P('M8 8 L32 32', at, 0.22)}${P('M32 8 L8 32', at + 0.16, 0.22)}</svg>`;
export const squiggle = (at, w = 220) => `<svg class="ln" width="${w}" height="24" viewBox="0 0 ${w} 24">${P(Array.from({ length: Math.floor(w / 22) }, (_, i) => `${i ? 'S' : 'M2 12 C 8 2,'} ${i * 22 + 13} ${i % 2 ? 22 : 2}, ${i * 22 + 22} 12`).join(' '), at, 0.7)}</svg>`;
// a short list: each row a tick (or cross) + 1–3 words
export const list = (rows) => `<div class="mlist" style="display:grid;gap:14px">${rows.map(([t, at, ok = true]) =>
  `<div data-d="${at}" style="display:flex;align-items:center;gap:20px;font:600 56px/1.05 InterV;letter-spacing:-.04em;color:#fff">${ok ? tick(at + 0.1, 48) : cross(at + 0.1, 44)}<span>${fmt(t)}</span></div>`).join('')}</div>`;
// big number that counts up
export const num = (to, at, { from = 0, pre = '', suf = '', dec = 0 } = {}) =>
  `<div class="h1" style="font-weight:700"><span data-d="${at}" data-count="${to}" data-from="${from}" data-pre="${pre}" data-suf="${suf}" data-dec="${dec}">${pre}${from}${suf}</span></div>`;
