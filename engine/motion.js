// Motion-graphics kit for the DOM/SVG overlay layer: eases, kinetic type, callouts, cards and data viz.
//
//   import * as M from '/engine/motion.js';
//   const st = M.stage(layer);                        // a 1920x1080-unit stage inside a set's overlay layer
//   const title = M.text.maskUp(st, { text: 'The Seeing Stone', at: M.wt(shot, 'seeing'), x: 140, y: 620 });
//   ... in update(t): title.update(t)                  // or st.update(t) to update everything made on it
//
// Every preset is a pure function of t (shot time, seconds): set in update(), no CSS animation, no
// wall clock, no state carried between frames. Times come from the narration with M.wt(shot, 'word')
// or M.wordTimes(shot, text). Every element takes `at` (start) and an optional `out` (exit start);
// exits ease out over `outDur` (default 0.35 s), nothing pops. Coordinates are 1080p pixels.
// House typography: Instrument Serif (names, numbers, titles), IBM Plex Mono tracked caps (metadata),
// Archivo Narrow Bold (red numerals and counters). Red #e0241b is for annotation only.
// The catalogue, with a still of each preset, is docs/motion/README.md.

// ================================================================ math and eases
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const smoothstep = (a, b, x) => { const t = range(x, a, b); return t * t * (3 - 2 * t); };

// Cubic bezier easing, as CSS cubic-bezier(x1, y1, x2, y2): Newton then bisection on x(t).
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    x = clamp(x); if (x === 0 || x === 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) { const d = X(t) - x; if (Math.abs(d) < 1e-6) return Y(t); const s = dX(t); if (Math.abs(s) < 1e-6) break; t -= d / s; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}

// Damped spring, closed form (Ryan Juckett, "Damped Springs"): position of a unit step response,
// x(0)=0 -> 1, v0 = initial velocity in units/s. zeta < 1 overshoots, 1 is critical, > 1 is sluggish.
// springT(t) takes seconds; spring() returns a normalised ease that lands exactly on 1 at t = 1.
export function springT({ zeta = 0.55, freq = 2.2, v0 = 0 } = {}) {
  const w = 2 * Math.PI * freq;
  return (t) => {
    if (t <= 0) return 0;
    const x0 = -1; let x;
    if (zeta < 1) { const a = w * Math.sqrt(1 - zeta * zeta); x = Math.exp(-w * zeta * t) * (x0 * Math.cos(a * t) + (v0 + w * zeta * x0) / a * Math.sin(a * t)); }
    else if (zeta === 1) x = ((v0 + w * x0) * t + x0) * Math.exp(-w * t);
    else { const r = w * Math.sqrt(zeta * zeta - 1), z1 = -w * zeta - r, z2 = -w * zeta + r;
      x = ((v0 - x0 * z2) * Math.exp(z1 * t) + (x0 * z1 - v0) * Math.exp(z2 * t)) / (z1 - z2); }
    return 1 + x;
  };
}
export function spring({ zeta = 0.5, bounces = 1.5 } = {}) {
  // normalised: choose the frequency so `bounces` half-oscillations fit in t in [0, 1], then
  // blend the last 15% onto exactly 1 (the residual there is < 1%, so the blend is invisible)
  const wd = Math.PI * Math.max(0.5, bounces), w = zeta < 1 ? wd / Math.sqrt(1 - zeta * zeta) : wd;
  const f = springT({ zeta, freq: w / (2 * Math.PI) });
  return (t) => { t = clamp(t); const k = smoothstep(0.85, 1, t); return f(t) * (1 - k) + k; };
}

const pw = (p) => [(t) => Math.pow(clamp(t), p), (t) => 1 - Math.pow(1 - clamp(t), p),
  (t) => { t = clamp(t); return t < 0.5 ? Math.pow(2 * t, p) / 2 : 1 - Math.pow(2 - 2 * t, p) / 2; }];
const [inQuad, outQuad, inOutQuad] = pw(2), [inCubic, outCubic, inOutCubic] = pw(3), [inQuart, outQuart, inOutQuart] = pw(4), [inQuint, outQuint, inOutQuint] = pw(5);
const X10 = 1 - Math.pow(2, -10);
const back = (s = 1.70158) => [(t) => { t = clamp(t); return t * t * ((s + 1) * t - s); }, (t) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; },
  (t) => { t = clamp(t); const s2 = s * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((s2 + 1) * 2 * t - s2)) / 2 : (Math.pow(2 * t - 2, 2) * ((s2 + 1) * (t * 2 - 2) + s2) + 2) / 2; }];
const [inBack, outBack, inOutBack] = back();

export const E = {
  linear: (t) => clamp(t),
  smooth: (t) => { t = clamp(t); return t * t * (3 - 2 * t); },
  smoother: (t) => { t = clamp(t); return t * t * t * (t * (6 * t - 15) + 10); }, // C2: zero velocity and acceleration at both ends
  inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, inQuart, outQuart, inOutQuart, inQuint, outQuint, inOutQuint,
  inSine: (t) => 1 - Math.cos(clamp(t) * Math.PI / 2), outSine: (t) => Math.sin(clamp(t) * Math.PI / 2), inOutSine: (t) => (1 - Math.cos(clamp(t) * Math.PI)) / 2,
  inExpo: (t) => (t <= 0 ? 0 : (Math.pow(2, 10 * (clamp(t) - 1)) - Math.pow(2, -10)) / X10),
  outExpo: (t) => (t >= 1 ? 1 : (1 - Math.pow(2, -10 * clamp(t))) / X10),
  inOutExpo: (t) => { t = clamp(t); return t < 0.5 ? E.inExpo(2 * t) / 2 : 0.5 + E.outExpo(2 * t - 1) / 2; },
  inCirc: (t) => 1 - Math.sqrt(1 - clamp(t) ** 2), outCirc: (t) => Math.sqrt(1 - (clamp(t) - 1) ** 2),
  inOutCirc: (t) => { t = clamp(t); return t < 0.5 ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2 : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2; },
  inBack, outBack, inOutBack, back: (s) => back(s)[1],
  spring: spring(), springSoft: spring({ zeta: 0.75, bounces: 1 }), springTight: spring({ zeta: 0.4, bounces: 2.5 }),
  // design-system curves (cubic-bezier control points)
  emphasized: bezier(0.2, 0, 0, 1), // Material 3 emphasized / standard: quick start, long settle
  decel: bezier(0.05, 0.7, 0.1, 1), accel: bezier(0.3, 0, 0.8, 0.15), // M3 emphasized decelerate / accelerate
  editorial: bezier(0.7, 0, 0.2, 1), // strong in-out for camera-like moves of type and panels
  css: bezier(0.25, 0.1, 0.25, 1), // CSS `ease`
  bezier, springT,
  steps: (n) => (t) => Math.floor(clamp(t) * n) / n,
};
// Animate "on twos" (Vox-style 12 fps graphics in a 24/60 fps edit): quantise time to 1/fps.
export const onTwos = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;
// Bell 0 -> 1 -> 0 over [0, 1] with zero slope at the ends.
export const bell = (t) => { t = clamp(t); return Math.sin(Math.PI * t) ** 2; };
// Eased progress of a segment: seg(t, at, dur, E.outCubic).
export const seg = (t, at, dur, ease = E.outCubic) => ease(range(t, at, at + dur));
// In/out envelope for an element alive from `at` (fade in over inDur) until `out` (fade out over outDur).
export function life(t, at, out = Infinity, inDur = 0.35, outDur = 0.35, ein = E.outCubic, eout = E.inOutSine) {
  return ein(range(t, at, at + inDur)) * (1 - eout(range(t, out, out + outDur)));
}

// Deterministic randomness
export function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ================================================================ narration timing
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
// Shot-relative time of the nth spoken word starting with `word`; falls back to the VO start.
export function wt(shot, word, nth = 0) {
  if (!word) return 0;
  const hits = (shot.words || []).filter((x) => norm(x.w).startsWith(norm(word)));
  return (hits[nth] ?? hits.at(-1))?.s ?? ((shot.voAt ?? shot.start ?? 0) - (shot.start ?? 0));
}
export const vo0 = (shot) => (shot.voAt ?? 0) - (shot.start ?? 0);
export const voEnd = (shot) => vo0(shot) + (shot.voDur || 0);
// Start time for every word of `text`, matched in order against the narration. Words the VO does
// not say are spread evenly between their spoken neighbours (or from `fallback` at `gap` spacing).
export function wordTimes(shot, text, { fallback = 0.3, gap = 0.18 } = {}) {
  const ws = String(text).split(/\s+/).filter(Boolean), said = shot?.words || [];
  const out = new Array(ws.length).fill(null); let j = 0;
  ws.forEach((w, i) => { const n = norm(w); if (!n) return; for (let k = j; k < Math.min(said.length, j + 6); k++) if (norm(said[k].w) === n || norm(said[k].w).startsWith(n)) { out[i] = said[k].s; j = k + 1; break; } });
  for (let i = 0; i < out.length; i++) if (out[i] == null) { const prev = i ? out[i - 1] : fallback - gap; out[i] = prev + gap; }
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + 0.02);
  return out;
}

// ================================================================ house tokens
export const C = { PAPER: '#efe7d6', CAP: '#d9d2c3', DIM: '#8f897d', FAINT: '#5f5a52', INK: '#0b0b0c', RED: '#e0241b', RED_TEXT: '#ff4a3d', SODIUM: '#ffa860', FLUO: '#58ffa0' };
export const F = {
  SERIF: `font-family:'Instrument Serif',serif;font-weight:400;color:${C.PAPER}`,
  ITALIC: `font-family:'Instrument Serif',serif;font-style:italic;color:${C.PAPER}`,
  MONO: `font-family:'Plex Mono',monospace;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:${C.CAP}`,
  MONO_DIM: `font-family:'Plex Mono',monospace;font-weight:400;letter-spacing:.16em;text-transform:uppercase;color:${C.DIM}`,
  NUM: `font-family:'Archivo Narrow',sans-serif;font-weight:700;color:${C.RED}`,
};

// ================================================================ stage
const NS = 'http://www.w3.org/2000/svg';
// A 1920x1080-unit layer inside `parent` (a set's overlay layer): children are placed in 1080p
// pixels and the whole stage scales to the render size. st.update(t) updates every preset made on it.
export function stage(parent, { z = 2 } = {}) {
  const el = document.createElement('div');
  const s = (window.innerHeight || 1080) / 1080;
  el.style.cssText = `position:absolute;left:0;top:0;width:1920px;height:1080px;transform:scale(${s});transform-origin:0 0;font-size:16px;pointer-events:none;z-index:${z};opacity:1`;
  parent.appendChild(el);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1920 1080'); svg.setAttribute('width', 1920); svg.setAttribute('height', 1080);
  svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  svg.innerHTML = `<defs>
    <filter id="mk-rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>`;
  el.appendChild(svg);
  const items = [];
  const st = {
    el, svg, items, scale: s,
    add(item) { items.push(item); return item; },
    update(t) { for (const it of items) it.update(t); },
    div(css = '', html = '') { const d = document.createElement('div'); d.style.cssText = `position:absolute;${css}`; d.innerHTML = html; el.appendChild(d); return d; },
    make(tag, attrs = {}, parent = svg) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; },
  };
  return st;
}
const px = (v) => `${v.toFixed(2)}px`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// position helpers: anchor 'tl' | 'tr' | 'bl' | 'br' | 'c' relative to (x, y)
function place(d, x, y, anchor = 'tl') {
  d.style.left = px(x); d.style.top = px(y);
  const tx = anchor.includes('r') ? '-100%' : anchor === 'c' || anchor === 'tc' || anchor === 'bc' ? '-50%' : '0';
  const ty = anchor.startsWith('b') ? '-100%' : anchor === 'c' ? '-50%' : '0';
  d.dataset.base = `translate(${tx},${ty})`; d.style.transform = d.dataset.base;
}
const tf = (d, extra = '') => { d.style.transform = `${d.dataset.base || ''} ${extra}`; };
// stroke-dash draw-on for an SVG path/line/polyline
function drawable(e) { const L = e.getTotalLength ? e.getTotalLength() : 1000; e.style.strokeDasharray = `${L} ${L}`; e.draw = (p) => { e.style.strokeDashoffset = `${L * (1 - clamp(p))}`; e.style.opacity = p > 0 ? 1 : 0; }; e.len = L; e.draw(0); return e; }

// ================================================================ kinetic text
// Shared: words/chars as spans inside a block placed at (x, y).
function block(st, { x = 140, y = 540, anchor = 'tl', style = F.SERIF, size = 96, width = null, align = 'left', lh = 1.08 } = {}) {
  const d = st.div(`${style};font-size:${size}px;line-height:${lh};text-align:${align};white-space:${width ? 'normal' : 'nowrap'};${width ? `width:${width}px;` : ''}`);
  place(d, x, y, anchor); return d;
}
function spans(d, parts, wrap = false) {
  d.innerHTML = parts.map((w) => (wrap ? `<span style="display:inline-block;overflow:hidden;vertical-align:top;padding:0 .02em .12em;margin-bottom:-.12em"><span style="display:inline-block">${w}</span></span>` : `<span style="display:inline-block;white-space:pre">${w}</span>`)).join('');
  return [...d.children].map((c) => (wrap ? c.firstChild : c));
}
const timesFor = (n, at, stagger, times) => Array.from({ length: n }, (_, i) => (times && times[i] != null ? times[i] : at + i * stagger));

export const text = {
  // Words rise into place one by one (on their spoken times if `times` is given, e.g. M.wordTimes(shot, text)).
  splitWords(st, { text: s, at = 0, stagger = 0.08, times = null, dur = 0.55, rise = 0.32, out, outDur = 0.35, ease = E.outCubic, ...o }) {
    const d = block(st, o); const ws = String(s).split(' ');
    const els = spans(d, ws.map((w, i) => esc(w) + (i < ws.length - 1 ? ' ' : '')));
    const T = timesFor(ws.length, at, stagger, times);
    return st.add({ el: d, update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      d.style.opacity = ex;
      els.forEach((e, i) => { const k = ease(range(t, T[i], T[i] + dur)); e.style.opacity = clamp(k * 1.6); e.style.transform = `translateY(${((1 - k) * rise).toFixed(3)}em)`; });
    } });
  },
  // Per-character stagger. from: 'below' (rise), 'fade', 'scale' (settles from 1.25 with a spring), 'track' (letter-spacing closes).
  perChar(st, { text: s, at = 0, stagger = 0.028, dur = 0.5, from = 'below', out, outDur = 0.3, ...o }) {
    const d = block(st, o); const cs = [...String(s)];
    const els = spans(d, cs.map((c) => (c === ' ' ? ' ' : esc(c))));
    const sp = spring({ zeta: 0.55, bounces: 1.2 });
    return st.add({ el: d, update(t) {
      d.style.opacity = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      els.forEach((e, i) => { const r = range(t, at + i * stagger, at + i * stagger + dur);
        if (from === 'scale') { const k = sp(r); e.style.opacity = clamp(r * 3); e.style.transform = `scale(${(1.25 - 0.25 * k).toFixed(4)})`; }
        else if (from === 'track') { const k = E.outExpo(r); e.style.opacity = k; e.style.transform = `translateX(${((1 - k) * (i - cs.length / 2) * 0.08).toFixed(3)}em)`; }
        else if (from === 'fade') e.style.opacity = E.inOutSine(r);
        else { const k = E.outCubic(r); e.style.opacity = clamp(k * 1.5); e.style.transform = `translateY(${((1 - k) * 0.45).toFixed(3)}em)`; } });
    } });
  },
  // Lines slide up from behind a mask (the editorial title reveal). `lines` or `text` split on '\n'.
  maskUp(st, { text: s, lines, at = 0, stagger = 0.12, dur = 0.8, ease = E.emphasized, out, outDur = 0.4, ...o }) {
    const d = block(st, o); const ls = lines ?? String(s).split('\n');
    d.innerHTML = ls.map((l) => `<div style="overflow:hidden;padding-bottom:.1em;margin-bottom:-.1em"><div style="will-change:transform">${esc(l)}</div></div>`).join('');
    const inner = [...d.children].map((c) => c.firstChild);
    return st.add({ el: d, update(t) {
      inner.forEach((e, i) => { const k = ease(range(t, at + i * stagger, at + i * stagger + dur));
        const x = E.inCubic(range(t, (out ?? Infinity) + i * stagger * 0.5, (out ?? Infinity) + i * stagger * 0.5 + outDur));
        e.style.transform = `translateY(${((1 - k) * 105 - x * 105).toFixed(2)}%)`; e.style.opacity = k > 0 && x < 1 ? 1 : 0; });
    } });
  },
  // Typewriter at `cps` characters per second, with a block caret that blinks after typing ends.
  typewriter(st, { text: s, at = 0, cps = 22, caret = true, out, outDur = 0.3, style = F.MONO, size = 22, ...o }) {
    const d = block(st, { style, size, ...o }); const str = String(s);
    const tx = document.createElement('span'), cr = document.createElement('span');
    cr.style.cssText = `display:inline-block;width:.6em;height:1em;vertical-align:-.12em;margin-left:.08em;background:currentColor`;
    d.append(tx, cr);
    return st.add({ el: d, update(t) {
      const n = Math.floor(clamp((t - at) * cps, 0, str.length)); tx.textContent = str.slice(0, n);
      const done = (t - at) * cps >= str.length; const blink = Math.floor((t - at - str.length / cps) * 2.2) % 2 === 0;
      cr.style.opacity = caret && t >= at && (!done || blink) ? 1 : 0;
      d.style.opacity = t >= at ? 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur)) : 0;
    } });
  },
  // Scramble-decode: characters cycle through glyphs and lock left to right. Monospace by default
  // so the line does not jitter in width.
  scramble(st, { text: s, at = 0, dur = 1.2, stagger = null, rate = 24, glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%', seed = 7, out, outDur = 0.3, style = F.MONO, size = 28, dimColor = C.DIM, ...o }) {
    const d = block(st, { style, size, ...o }); const str = String(s), n = str.length;
    const stg = stagger ?? (dur * 0.6) / Math.max(1, n);
    const els = spans(d, [...str].map((c) => (c === ' ' ? ' ' : esc(c))));
    return st.add({ el: d, update(t) {
      d.style.opacity = t >= at ? 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur)) : 0;
      const tick = Math.floor((t - at) * rate);
      els.forEach((e, i) => { const c = str[i]; if (c === ' ') return; const lock = at + i * stg + dur * 0.4;
        if (t >= lock) { e.textContent = c; e.style.color = ''; e.style.opacity = 1; }
        else if (t >= at + i * stg * 0.5) { const r = rng(hash(seed, i, tick)); e.textContent = glyphs[Math.floor(r() * glyphs.length)]; e.style.color = dimColor; e.style.opacity = 0.85; }
        else { e.textContent = c; e.style.opacity = 0; } });
    } });
  },
  // Odometer counter: every digit is a rolling column; value eases from `from` to `to`.
  counter(st, { from = 0, to = 100, at = 0, dur = 1.6, ease = E.outExpo, decimals = 0, prefix = '', suffix = '', sep = ',', style = F.SERIF, size = 160, out, outDur = 0.35, ...o }) {
    const d = block(st, { style, size, lh: 1, ...o });
    const fmt = (v) => { const s = Math.abs(v).toFixed(decimals); const [i, f] = s.split('.'); return (v < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (f ? '.' + f : ''); };
    const shape = fmt(to); // fixed layout: one column per character of the final value
    const pre = `<span>${esc(prefix)}</span>`, suf = `<span>${esc(suffix)}</span>`;
    d.innerHTML = pre + [...shape].map((c) => (/\d/.test(c) ? `<span style="display:inline-block;height:1em;overflow:hidden;vertical-align:top;position:relative"><span style="display:block;visibility:hidden">0</span><span class="col" style="position:absolute;left:0;top:0;display:flex;flex-direction:column">${[...Array(11)].map((_, k) => `<span style="height:1em;line-height:1em">${k % 10}</span>`).join('')}</span></span>` : `<span>${esc(c)}</span>`)).join('') + suf;
    const cols = [...d.querySelectorAll('.col')];
    return st.add({ el: d, value: 0, update(t) {
      const v = lerp(from, to, ease(range(t, at, at + dur))); this.value = v;
      const scale = Math.pow(10, decimals), iv = Math.abs(v) * scale;
      // each column rolls continuously with its place value (the last digit rolls fastest)
      cols.forEach((c, j) => { const place = Math.pow(10, cols.length - 1 - j); const pos = (iv / place) % 10;
        const frac = place === 1 ? pos : Math.floor(pos) + smoothstep(0.85, 1, (iv % place) / place);
        c.style.transform = `translateY(${(-frac).toFixed(4)}em)`; });
      d.style.opacity = t >= at ? 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur)) : 0;
    } });
  },
  // Number slam: lands from 1.3x with a fast spring, a one-frame-ish exposure kick (returned as
  // .impact(t), 0..1, for the runtime to drive a flash/shake) and a source line that follows.
  slam(st, { text: s, at = 0, style = F.NUM, size = 260, source = null, out, outDur = 0.3, ...o }) {
    const d = block(st, { style, size, lh: 0.9, ...o }); d.textContent = s;
    const src = source ? st.div(`${F.MONO_DIM};font-size:13px`, esc(source)) : null;
    if (src) { src.style.left = d.style.left; src.style.top = px(parseFloat(d.style.top) + size * 0.95 + 18); src.dataset.base = d.dataset.base.replace(/,[^)]*\)/, ',0)'); }
    const sp = spring({ zeta: 0.45, bounces: 1.6 });
    return st.add({ el: d, impact: (t) => Math.exp(-Math.max(0, t - at) * 14) * (t >= at ? 1 : 0), update(t) {
      const r = range(t, at, at + 0.45), k = sp(r), ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      d.style.opacity = (t >= at ? 1 : 0) * ex; tf(d, `scale(${(1.3 - 0.3 * k).toFixed(4)})`);
      if (src) { const ks = E.outCubic(range(t, at + 0.35, at + 0.8)); src.style.opacity = ks * ex; tf(src, `translateY(${(1 - ks) * 8}px)`); }
    } });
  },
  // Strike-through: a red marker line drawn across an existing text block (or new text).
  strike(st, { el, text: s, at = 0, dur = 0.45, color = C.RED, width = 7, tilt = -0.02, dim = 0.55, out, outDur = 0.3, ...o }) {
    const d = el ?? block(st, o); if (!el) d.textContent = s;
    const line = st.make('path', { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', filter: 'url(#mk-rough)' });
    let laid = false; let L = 1;
    return st.add({ el: d, update(t) {
      if (!laid) { const b = d.getBoundingClientRect(), sb = st.el.getBoundingClientRect(), k = 1 / st.scale;
        const x0 = (b.left - sb.left) * k - 10, x1 = (b.right - sb.left) * k + 10, y = (b.top - sb.top) * k + b.height * k * 0.55;
        line.setAttribute('d', `M${x0},${y - (x1 - x0) * tilt / 2} Q${(x0 + x1) / 2},${y + 3} ${x1},${y + (x1 - x0) * tilt / 2}`); L = line.getTotalLength(); line.style.strokeDasharray = `${L} ${L}`; laid = true; }
      const k = E.inOutCubic(range(t, at, at + dur)), ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      line.style.strokeDashoffset = `${L * (1 - k)}`; line.style.opacity = (k > 0 ? 1 : 0) * ex;
      if (!el) d.style.opacity = ex; d.style.filter = ''; d.style.color = ''; if (dim < 1) d.style.opacity = String((el ? 1 : ex) * (1 - (1 - dim) * k));
    } });
  },
  // Highlighter sweep: a red band wipes in behind the text (left to right), the text keeps its colour.
  highlight(st, { text: s, at = 0, dur = 0.55, color = 'rgba(224,36,27,.88)', textColor = null, pad = 0.12, out, outDur = 0.3, ...o }) {
    const d = block(st, o);
    d.innerHTML = `<span style="position:relative;display:inline-block;padding:0 ${pad}em"><span class="hl" style="position:absolute;left:0;right:0;top:12%;bottom:4%;background:${color};transform-origin:0 50%;transform:scaleX(0);border-radius:2px"></span><span class="tx" style="position:relative">${esc(s)}</span></span>`;
    const hl = d.querySelector('.hl'), tx = d.querySelector('.tx');
    return st.add({ el: d, update(t) {
      const k = E.inOutCubic(range(t, at, at + dur)), ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      hl.style.transform = `scaleX(${k.toFixed(4)}) skewX(-6deg)`; d.style.opacity = ex;
      if (textColor) tx.style.color = k > 0.5 ? textColor : '';
    } });
  },
  // Redaction bars: a document block whose lines are covered by black bars that lift off left to
  // right (mode 'reveal'), or bars that slam over chosen words (mode 'cover', `words`: indices).
  // paper: set on a paper document card (ink text), so black bars read on a dark film. Default on.
  redact(st, { lines = [], at = 0, stagger = 0.16, dur = 0.5, mode = 'reveal', words = [], style = F.MONO, size = 22, barColor = '#0b0b0c', paper = true, out, outDur = 0.3, ...o }) {
    const d = block(st, { style: paper ? style.replace(/color:[^;]+/, 'color:#1d1b18') : style, size, lh: 1.7, ...o });
    if (paper) d.style.cssText += `;background:${C.PAPER};padding:1.4em 1.8em 1.5em;box-shadow:0 18px 50px rgba(0,0,0,.55);transform-origin:0 0`;
    let wi = 0;
    d.innerHTML = lines.map((l) => `<div style="white-space:nowrap">${l.split(' ').map((w) => { const i = wi++; const cov = mode === 'reveal' || words.includes(i);
      return `<span style="position:relative;display:inline-block">${esc(w)}${cov ? `<span class="bar" data-i="${i}" style="position:absolute;left:-.15em;right:-.15em;top:.18em;bottom:.12em;background:${barColor};transform-origin:${mode === 'reveal' ? '100%' : '0'} 50%"></span>` : ''}</span>`; }).join(' ')}</div>`).join('');
    const bars = [...d.querySelectorAll('.bar')];
    return st.add({ el: d, update(t) {
      d.style.opacity = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      bars.forEach((b, j) => { const t0 = at + j * stagger; const k = E.inOutCubic(range(t, t0, t0 + dur));
        b.style.transform = `scaleX(${(mode === 'reveal' ? 1 - k : k).toFixed(4)})`; });
    } });
  },
};

// ================================================================ callouts
export const callout = {
  // Document callout: a hand-drawn red loop around (x, y), a leader line, then a label.
  doc(st, { x = 960, y = 540, rx = 120, ry = 60, label = '', sub = '', lx = null, ly = null, at = 0, color = C.RED, seed = 3, out, outDur = 0.35 }) {
    const r = rng(seed), pts = []; const a0 = -Math.PI * 0.6, N = 90, tilt = (r() - 0.5) * 0.2;
    for (let i = 0; i <= N; i++) { const u = i / N, a = a0 + u * Math.PI * 2 * 1.15; const g = 1 + 0.06 * u + (r() - 0.5) * 0.01;
      const px0 = Math.cos(a) * rx * g, py0 = Math.sin(a) * ry * g; pts.push([x + px0 * Math.cos(tilt) - py0 * Math.sin(tilt), y + px0 * Math.sin(tilt) + py0 * Math.cos(tilt)]); }
    const loop = drawable(st.make('path', { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L'), fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#mk-rough)' }));
    const LX = lx ?? x + rx + 220, LY = ly ?? y - ry - 90; const sx = x + Math.sign(LX - x) * rx * 0.75, sy = y + Math.sign(LY - y) * ry * 0.75;
    const lead = drawable(st.make('path', { d: `M${sx},${sy} L${LX},${LY} L${LX + Math.sign(LX - x) * 40},${LY}`, fill: 'none', stroke: C.PAPER, 'stroke-width': 1.5 }));
    const left = LX > x;
    const lab = st.div(`${F.MONO};font-size:18px;line-height:1.5;white-space:nowrap`, `${esc(label)}${sub ? `<div style="${F.MONO_DIM};font-size:13px">${esc(sub)}</div>` : ''}`);
    place(lab, LX + (left ? 52 : -52), LY - 14, left ? 'tl' : 'tr');
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      loop.draw(E.inOutCubic(range(t, at, at + 0.7))); lead.draw(E.outCubic(range(t, at + 0.5, at + 0.95)));
      const kl = E.outCubic(range(t, at + 0.8, at + 1.2)); lab.style.opacity = kl * ex; lab.style.clipPath = `inset(0 ${left ? (100 - kl * 100).toFixed(2) : 0}% 0 ${left ? 0 : (100 - kl * 100).toFixed(2)}%)`;
      loop.style.opacity = loop.style.opacity * ex; lead.style.opacity = lead.style.opacity * ex;
    } });
  },
  // Map route: the path draws on under a travelling dot with a halo; once drawn, a dash pattern
  // marches along it. points: [[x, y], ...] in 1080p px (smoothed with Catmull-Rom).
  route(st, { points, at = 0, dur = 2.4, ease = E.inOutCubic, color = C.RED, width = 4, dash = 14, march = 40, label = '', endLabel = '', out, outDur = 0.35 }) {
    const P = points; let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) { const p0 = P[i - 1] ?? P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] ?? p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`; }
    const ghost = st.make('path', { d, fill: 'none', stroke: color, 'stroke-width': width, opacity: 0.0, 'stroke-linecap': 'round' });
    const path = st.make('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
    const L = path.getTotalLength();
    const halo = st.make('circle', { r: 16, fill: color, opacity: 0 }), dot = st.make('circle', { r: 6.5, fill: C.PAPER, stroke: color, 'stroke-width': 3, opacity: 0 });
    const start = st.make('circle', { cx: P[0][0], cy: P[0][1], r: 5, fill: color, opacity: 0 });
    const lab = label ? st.div(`${F.MONO};font-size:15px;white-space:nowrap`, esc(label)) : null; if (lab) place(lab, P[0][0] + 14, P[0][1] + 10);
    const elab = endLabel ? st.div(`${F.SERIF};font-size:44px;white-space:nowrap`, esc(endLabel)) : null; if (elab) place(elab, P.at(-1)[0] + 20, P.at(-1)[1] - 30);
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      const k = ease(range(t, at, at + dur)), on = t >= at ? ex : 0;
      // solid while drawing, then a dash pattern that marches at `march` px/s
      const done = range(t, at + dur, at + dur + 0.4);
      if (done <= 0) { path.style.strokeDasharray = `${L * k} ${L}`; path.style.strokeDashoffset = '0'; }
      else { const dsh = lerp(L, dash, E.inOutSine(done)), gap = lerp(0.001, dash * 0.8, E.inOutSine(done)); path.style.strokeDasharray = `${dsh} ${gap}`; path.style.strokeDashoffset = `${-(t - at - dur) * march}`; }
      path.style.opacity = on; ghost.style.opacity = 0.18 * on * smoothstep(0, 0.2, k);
      const q = path.getPointAtLength(L * k); const pulse = 0.5 + 0.5 * Math.sin((t - at) * 5);
      dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); halo.setAttribute('cx', q.x); halo.setAttribute('cy', q.y);
      dot.style.opacity = on * clamp((t - at) * 6); halo.setAttribute('r', 12 + 8 * pulse); halo.style.opacity = on * 0.25 * (1 - 0.5 * pulse) * clamp((t - at) * 6);
      start.style.opacity = on * clamp((t - at) * 6);
      if (lab) lab.style.opacity = on * E.outCubic(range(t, at + 0.1, at + 0.5));
      if (elab) { const ke = E.outCubic(range(t, at + dur - 0.1, at + dur + 0.5)); elab.style.opacity = on * ke; tf(elab, `translateY(${(1 - ke) * 12}px)`); }
    } });
  },
  // Arrow: a curved stroke drawn from `from` to `to` (bend = sagitta in px), head appears at the end.
  arrow(st, { from, to, bend = 60, at = 0, dur = 0.6, color = C.PAPER, width = 2.5, head = 16, out, outDur = 0.3 }) {
    const [x0, y0] = from, [x1, y1] = to, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const cx = mx - (y1 - y0) / len * bend, cy = my + (x1 - x0) / len * bend;
    const path = drawable(st.make('path', { d: `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }));
    const ang = Math.atan2(y1 - cy, x1 - cx);
    const hp = (s) => `M${x1 - Math.cos(ang - 0.45) * head * s},${y1 - Math.sin(ang - 0.45) * head * s} L${x1},${y1} L${x1 - Math.cos(ang + 0.45) * head * s},${y1 - Math.sin(ang + 0.45) * head * s}`;
    const hd = st.make('path', { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      path.draw(E.inOutCubic(range(t, at, at + dur))); path.style.opacity = path.style.opacity * ex;
      const kh = E.outBack(range(t, at + dur * 0.85, at + dur + 0.2)); hd.setAttribute('d', hp(Math.max(0.001, kh))); hd.style.opacity = (kh > 0 ? 1 : 0) * ex;
    } });
  },
  // Bracket grouping a span (x, y0..y1), drawn out from its middle, with a label beside it.
  bracket(st, { x = 1400, y0 = 300, y1 = 700, side = 'right', depth = 24, label = '', sub = '', at = 0, dur = 0.55, color = C.PAPER, out, outDur = 0.3 }) {
    const s = side === 'right' ? 1 : -1, ym = (y0 + y1) / 2;
    const half = (ya) => drawable(st.make('path', { d: `M${x + s * depth},${ym} L${x + s * depth},${ya + (ya < ym ? 0 : 0)} L${x},${ya}`, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'miter' }));
    const a = half(y0), b = half(y1), nib = drawable(st.make('path', { d: `M${x + s * depth},${ym} L${x + s * (depth + 18)},${ym}`, fill: 'none', stroke: color, 'stroke-width': 2 }));
    const lab = st.div(`${F.SERIF};font-size:42px;line-height:1.05;white-space:nowrap`, `${esc(label)}${sub ? `<div style="${F.MONO_DIM};font-size:13px;margin-top:6px">${esc(sub)}</div>` : ''}`);
    place(lab, x + s * (depth + 34), ym, s > 0 ? 'tl' : 'tr'); lab.dataset.base += ' translateY(-50%)'; tf(lab);
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      const k = E.inOutCubic(range(t, at, at + dur)); a.draw(k); b.draw(k); nib.draw(E.outCubic(range(t, at + dur * 0.7, at + dur + 0.2)));
      for (const e of [a, b, nib]) e.style.opacity = e.style.opacity * ex;
      const kl = E.outCubic(range(t, at + dur * 0.8, at + dur + 0.45)); lab.style.opacity = kl * ex; tf(lab, `translateX(${s * (1 - kl) * 14}px)`);
    } });
  },
};

// ================================================================ captions and cards
export const card = {
  // Lower-third-free caption: a corner block (meta line in mono + optional serif line) with a short
  // red rule that draws first. corner: 'tl' | 'tr' | 'bl' | 'br'.
  caption(st, { meta = '', line = '', corner = 'tl', at = 0, out, outDur = 0.35, margin = [110, 96] }) {
    const right = corner.includes('r'), bottom = corner.startsWith('b');
    const d = st.div(`text-align:${right ? 'right' : 'left'};white-space:nowrap`);
    d.innerHTML = `<div class="rule" style="height:2px;width:56px;background:${C.RED};margin:${right ? '0 0 14px auto' : '0 0 14px 0'};transform-origin:${right ? '100%' : '0'} 50%"></div>` +
      `<div style="overflow:hidden"><div class="m" style="${F.MONO};font-size:15px">${esc(meta)}</div></div>` + (line ? `<div style="overflow:hidden;padding-bottom:.08em"><div class="l" style="${F.SERIF};font-size:46px;line-height:1.1;margin-top:6px">${esc(line)}</div></div>` : '');
    place(d, right ? 1920 - margin[0] : margin[0], bottom ? 1080 - margin[1] : margin[1], (bottom ? 'b' : 't') + (right ? 'r' : 'l'));
    const rule = d.querySelector('.rule'), m = d.querySelector('.m'), l = d.querySelector('.l');
    return st.add({ el: d, update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      rule.style.transform = `scaleX(${E.emphasized(range(t, at, at + 0.5)).toFixed(4)})`;
      const km = E.emphasized(range(t, at + 0.12, at + 0.7)); m.style.transform = `translateY(${(1 - km) * 105}%)`;
      if (l) { const kl = E.emphasized(range(t, at + 0.22, at + 0.9)); l.style.transform = `translateY(${(1 - kl) * 105}%)`; }
      d.style.opacity = (t >= at ? 1 : 0) * ex;
    } });
  },
  // Quote card: serif quote whose words light up as they are spoken (times from M.wordTimes), a
  // hairline rule and the attribution in mono. variant: 'left' | 'center' | 'right'.
  quote(st, { text: s, by = '', times = null, at = 0, stagger = 0.12, variant = 'left', red = false, size = null, out, outDur = 0.4 }) {
    const long = s.length > 80, fs = size ?? (long ? 66 : s.length < 24 ? 128 : 92);
    const box = { left: 'left:150px;width:1300px;text-align:left', center: 'left:220px;width:1480px;text-align:center', right: 'left:470px;width:1300px;text-align:right' }[variant];
    const ws = s.split(' ');
    const q = st.div(`${box};top:${long ? 250 : 320}px;${F.SERIF};font-size:${fs}px;line-height:1.1;${red ? `color:${C.RED_TEXT}` : ''}`, ws.map((w) => `<span style="opacity:.0">${esc(w)} </span>`).join(''));
    const els = [...q.children]; const T = timesFor(ws.length, at, stagger, times);
    const rule = st.div(`height:2px;width:72px;background:${C.RED};${variant === 'right' ? 'right:150px' : variant === 'center' ? 'left:924px' : 'left:150px'};top:${long ? 210 : 280}px;transform-origin:${variant === 'right' ? '100%' : variant === 'center' ? '50%' : '0'} 50%`);
    const att = by ? st.div(`${box};top:${long ? 860 : 820}px;${F.MONO};font-size:15px;letter-spacing:.3em`, esc(by)) : null;
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      els.forEach((e, i) => { e.style.opacity = (0.16 + 0.84 * E.inOutSine(range(t, T[i] - 0.05, T[i] + 0.25))) * clamp((t - at) * 3) * ex; });
      rule.style.transform = `scaleX(${E.emphasized(range(t, at, at + 0.6)).toFixed(4)})`; rule.style.opacity = ex;
      if (att) { const k = E.outCubic(range(t, T.at(-1) + 0.2, T.at(-1) + 0.8)); att.style.opacity = k * ex; att.style.transform = `translateY(${(1 - k) * 10}px)`; }
    } });
  },
  // Chapter card variants. 'numeral': the house card (giant red Archivo numeral, serif title);
  // 'rule': a red hairline draws across, mono index above a serif title; 'index': the table of
  // contents with the current chapter lit; 'split': number and title either side of a vertical rule.
  chapter(st, { num = 1, title = '', variant = 'numeral', chapters = [], at = 0, out, outDur = 0.5 }) {
    const nn = String(num).padStart(2, '0'); const parts = []; let upd;
    if (variant === 'numeral') {
      const n = st.div(`left:110px;top:1060px;${F.NUM};font-size:420px;line-height:.8;letter-spacing:-.04em`, String(num)); place(n, 110, 1040, 'bl');
      const lb = st.div(`${F.MONO};font-size:15px;letter-spacing:.32em`, `CHAPTER ${nn}`); place(lb, 128, 110);
      const tt = st.div(`${F.SERIF};font-size:128px;line-height:1;text-align:right;white-space:nowrap`, `<div style="overflow:hidden;padding-bottom:.1em"><div>${esc(title)}</div></div>`); place(tt, 1790, 940, 'br');
      const ti = tt.firstChild.firstChild;
      upd = (t, ex) => { const kn = E.emphasized(range(t, at, at + 0.9)); n.style.opacity = ex; n.style.clipPath = `inset(${((1 - kn) * 100).toFixed(2)}% 0 0 0)`; tf(n, `translateY(${(1 - kn) * 40}px)`);
        lb.style.opacity = ex * E.outCubic(range(t, at + 0.45, at + 0.8)); ti.style.transform = `translateY(${(1 - E.emphasized(range(t, at + 0.25, at + 1.1))) * 110}%)`; tt.style.opacity = ex; };
      parts.push(n, lb, tt);
    } else if (variant === 'rule') {
      const line = st.div(`left:150px;top:560px;height:2px;width:1620px;background:${C.RED};transform-origin:0 50%`);
      const lb = st.div(`${F.MONO};font-size:16px;letter-spacing:.34em`, `CHAPTER ${nn}`); place(lb, 150, 520, 'bl');
      const tt = st.div(`${F.SERIF};font-size:118px;line-height:1;white-space:nowrap;overflow:hidden;padding-bottom:.1em`, `<div>${esc(title)}</div>`); place(tt, 146, 586);
      upd = (t, ex) => { line.style.transform = `scaleX(${E.editorial(range(t, at, at + 1.0)).toFixed(4)})`; line.style.opacity = ex;
        lb.style.opacity = ex * E.outCubic(range(t, at + 0.5, at + 0.9)); tt.firstChild.style.transform = `translateY(${(-1 + E.emphasized(range(t, at + 0.35, at + 1.2))) * 110}%)`; tt.style.opacity = ex; };
    } else if (variant === 'index') {
      const list = chapters.length ? chapters : [title];
      const rows = list.map((c, i) => { const cur = i + 1 === num; const r = st.div(`white-space:nowrap;${cur ? F.SERIF : F.ITALIC};font-size:${cur ? 76 : 40}px;line-height:1.25;${cur ? '' : `color:${C.FAINT}`}`,
        `<span style="${F.MONO_DIM};font-size:14px;vertical-align:middle;margin-right:28px;${cur ? `color:${C.RED_TEXT}` : ''}">${String(i + 1).padStart(2, '0')}</span>${esc(c)}`); place(r, 300, 540 + (i - (num - 1)) * 92 - (cur ? 20 : 0), 'tl'); return r; });
      upd = (t, ex) => rows.forEach((r, i) => { const k = E.emphasized(range(t, at + Math.abs(i + 1 - num) * 0.07, at + 0.7 + Math.abs(i + 1 - num) * 0.07)); r.style.opacity = ex * k; tf(r, `translateX(${(1 - k) * -30}px)`); });
    } else { // split
      const v = st.div(`left:760px;top:330px;width:2px;height:420px;background:${C.RED};transform-origin:50% 0`);
      const n = st.div(`${F.SERIF};font-size:300px;line-height:1;white-space:nowrap`, nn); place(n, 712, 540, 'tr'); n.dataset.base += ' translateY(-50%)';
      const tt = st.div(`${F.SERIF};font-size:96px;line-height:1.05;width:900px`, `<div style="overflow:hidden;padding-bottom:.1em"><div>${esc(title)}</div></div>`); place(tt, 812, 540); tt.dataset.base += ' translateY(-50%)'; tf(tt);
      const lb = st.div(`${F.MONO};font-size:14px;letter-spacing:.34em`, 'CHAPTER'); place(lb, 812, 380);
      upd = (t, ex) => { v.style.transform = `scaleY(${E.editorial(range(t, at, at + 0.8)).toFixed(4)})`; v.style.opacity = ex;
        const kn = E.emphasized(range(t, at + 0.3, at + 1.1)); n.style.opacity = ex; n.style.clipPath = `inset(0 0 0 ${((1 - kn) * 100).toFixed(2)}%)`; tf(n, `translateX(${(1 - kn) * 60}px)`);
        tt.firstChild.firstChild.style.transform = `translateY(${(1 - E.emphasized(range(t, at + 0.45, at + 1.2))) * 110}%)`; tt.style.opacity = ex; lb.style.opacity = ex * E.outCubic(range(t, at + 0.7, at + 1.1)); };
    }
    return st.add({ update(t) { upd(t, (t >= at ? 1 : 0) * (1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur)))); } });
  },
  // Timeline scrubber: an axis of years; a playhead travels (springing onto each event at its time)
  // and events pop their labels as it passes. events: [{ year, label, at }].
  timeline(st, { from = 1990, to = 2030, events = [], y = 640, x0 = 160, x1 = 1760, at = 0, out, outDur = 0.4, every = 5 }) {
    const X = (yr) => lerp(x0, x1, (yr - from) / (to - from));
    const axis = drawable(st.make('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: C.DIM, 'stroke-width': 1.5 }));
    const ticks = []; for (let yr = from; yr <= to; yr++) { const big = yr % every === 0; const l = st.make('line', { x1: X(yr), x2: X(yr), y1: y - (big ? 14 : 6), y2: y, stroke: big ? C.CAP : C.FAINT, 'stroke-width': 1, opacity: 0 }); ticks.push([yr, l, big ? (() => { const d = st.div(`${F.MONO_DIM};font-size:13px`, yr); place(d, X(yr), y + 16, 'tc'); return d; })() : null]); }
    const head = st.make('line', { y1: y - 70, y2: y + 6, stroke: C.RED, 'stroke-width': 2, opacity: 0 }), knob = st.make('circle', { cy: y - 70, r: 5, fill: C.RED, opacity: 0 });
    const tag = st.div(`${F.NUM};font-size:40px;line-height:1`, '');
    const evs = events.map((e) => { const d = st.div(`white-space:nowrap`, `<div style="${F.SERIF};font-size:54px;line-height:1">${e.year}</div><div style="${F.MONO};font-size:14px;margin-top:8px">${esc(e.label)}</div>`); place(d, X(e.year), y - 110, 'bl'); const pin = st.make('circle', { cx: X(e.year), cy: y, r: 6, fill: C.PAPER, opacity: 0 }); return { ...e, d, pin }; });
    const sp = spring({ zeta: 0.6, bounces: 1.2 });
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      axis.draw(E.editorial(range(t, at, at + 0.9))); axis.style.opacity = axis.style.opacity * ex;
      ticks.forEach(([yr, l, d], i) => { const k = range(t, at + 0.1 + i / ticks.length * 0.8, at + 0.3 + i / ticks.length * 0.8); l.style.opacity = k * ex; if (d) d.style.opacity = k * ex; });
      // playhead: rests on the last event reached, springs to the next at its time
      let yr = from; let prev = from;
      for (const e of evs) { if (t >= e.at) { yr = lerp(prev, e.year, sp(range(t, e.at, e.at + 0.9))); prev = e.year; } }
      const hx = X(yr), on = (t >= at + 0.5 ? 1 : 0) * ex;
      for (const e of [head]) { e.setAttribute('x1', hx); e.setAttribute('x2', hx); e.style.opacity = on; }
      knob.setAttribute('cx', hx); knob.style.opacity = on;
      tag.textContent = Math.round(yr); place(tag, hx + 12, y - 92, 'bl'); tag.style.opacity = evs.length && t < evs[0].at ? on : 0;
      evs.forEach((e) => { const k = E.outCubic(range(t, e.at + 0.25, e.at + 0.75)); e.d.style.opacity = k * ex; tf(e.d, `translateY(${(1 - k) * 14}px)`); e.pin.style.opacity = (t >= e.at + 0.2 ? 1 : 0) * ex; });
    } });
  },
};

// ================================================================ data viz
export const data = {
  // Bar race: series { label: [v at keys[0], v at keys[1], ...] }; ranks and values interpolate
  // continuously between keys, bars resort smoothly. highlight: a label drawn in red.
  barRace(st, { series, keys, at = 0, dur = 6, top = 6, x = 300, y = 260, w = 1260, rowH = 82, highlight = null, format = (v) => Math.round(v).toLocaleString('en-US'), keyStyle = F.SERIF, out, outDur = 0.4 }) {
    const names = Object.keys(series);
    const rows = names.map((n) => { const r = st.div(`left:0;top:0;height:${rowH * 0.62}px;white-space:nowrap`);
      r.innerHTML = `<div class="lb" style="position:absolute;left:-284px;top:50%;transform:translateY(-50%);${F.MONO};font-size:15px;text-align:right;width:260px">${esc(n)}</div><div class="bar" style="position:absolute;left:0;top:0;bottom:0;background:${n === highlight ? C.RED : C.PAPER};opacity:${n === highlight ? 1 : 0.86};transform-origin:0 50%"></div><div class="v" style="position:absolute;top:50%;transform:translateY(-50%);${F.SERIF};font-size:${rowH * 0.5}px"></div>`;
      return { n, r, bar: r.querySelector('.bar'), v: r.querySelector('.v') }; });
    const keyEl = st.div(`${keyStyle};font-size:150px;line-height:1;color:${C.FAINT}`, ''); place(keyEl, x + w, y + rowH * top + 30, 'br');
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      const u = clamp((t - at) / dur) * (keys.length - 1), i0 = Math.min(keys.length - 2, Math.floor(u)), f = E.inOutSine(u - i0);
      const vals = names.map((n) => lerp(series[n][i0], series[n][i0 + 1], f));
      const rank = (vs) => { const o = vs.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]); const r = []; o.forEach(([, i], k) => (r[i] = k)); return r; };
      const r0 = rank(names.map((n) => series[n][i0])), r1 = rank(names.map((n) => series[n][i0 + 1]));
      const max = Math.max(...vals) || 1; const intro = E.emphasized(range(t, at, at + 0.8));
      rows.forEach((o, i) => { const rk = lerp(r0[i], r1[i], E.inOutCubic(smoothstep(0.1, 0.9, u - i0))); const vis = clamp(top - rk);
        const bw = Math.max(2, w * vals[i] / max * intro);
        o.r.style.left = px(x); o.r.style.top = px(y + rk * rowH); o.r.style.opacity = vis * ex * (t >= at ? 1 : 0);
        o.bar.style.width = px(bw); o.v.style.left = px(bw + 16); o.v.textContent = format(vals[i]); });
      keyEl.textContent = keys[Math.min(keys.length - 1, Math.round(u))]; keyEl.style.opacity = ex * intro;
    } });
  },
  // Line chart that draws on, with a dot and a value label riding the head. data: [[x, y], ...].
  line(st, { data: D, box = [200, 220, 1500, 640], at = 0, dur = 2.5, ease = E.inOutSine, color = C.PAPER, accent = C.RED, format = (v) => v.toFixed(0), label = '', yMin = null, yMax = null, xLabels = [], out, outDur = 0.4 }) {
    const [bx, by, bw, bh] = box; const xs = D.map((d) => d[0]), ys = D.map((d) => d[1]);
    const xa = Math.min(...xs), xb = Math.max(...xs), ya = yMin ?? Math.min(...ys), yb = yMax ?? Math.max(...ys);
    const P = D.map(([u, v]) => [bx + (u - xa) / (xb - xa) * bw, by + bh - (v - ya) / (yb - ya) * bh]);
    const base = drawable(st.make('line', { x1: bx, x2: bx + bw, y1: by + bh, y2: by + bh, stroke: C.FAINT, 'stroke-width': 1 }));
    const grid = [0.25, 0.5, 0.75].map((g) => st.make('line', { x1: bx, x2: bx + bw, y1: by + bh * (1 - g), y2: by + bh * (1 - g), stroke: C.FAINT, 'stroke-width': 1, 'stroke-dasharray': '2 8', opacity: 0 }));
    const path = st.make('path', { d: 'M' + P.map((p) => p.join(',')).join(' L'), fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const L = path.getTotalLength(); path.style.strokeDasharray = `${L} ${L}`;
    // arc length -> data index lookup so the label shows the interpolated value at the head
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const dot = st.make('circle', { r: 7, fill: accent, opacity: 0 }), ring = st.make('circle', { r: 16, fill: 'none', stroke: accent, 'stroke-width': 1.5, opacity: 0 });
    const val = st.div(`${F.SERIF};font-size:52px;line-height:1;white-space:nowrap`, ''); const lab = label ? st.div(`${F.MONO_DIM};font-size:13px`, esc(label)) : null; if (lab) place(lab, bx, by - 40);
    const xl = xLabels.map(([u, s]) => { const d = st.div(`${F.MONO_DIM};font-size:13px`, esc(s)); place(d, bx + (u - xa) / (xb - xa) * bw, by + bh + 16, 'tc'); return d; });
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur)), on = (t >= at ? 1 : 0) * ex;
      base.draw(E.editorial(range(t, at - 0.3, at + 0.4))); base.style.opacity = base.style.opacity * ex; grid.forEach((g) => (g.style.opacity = 0.6 * on * range(t, at, at + 0.4)));
      const k = ease(range(t, at, at + dur)), s = cum.at(-1) * k; path.style.strokeDashoffset = `${L * (1 - k)}`; path.style.opacity = on;
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const f = clamp((s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
      const hx = lerp(P[i - 1][0], P[i][0], f), hy = lerp(P[i - 1][1], P[i][1], f), v = lerp(D[i - 1][1], D[i][1], f);
      for (const c of [dot, ring]) { c.setAttribute('cx', hx); c.setAttribute('cy', hy); c.style.opacity = on; }
      ring.setAttribute('r', 12 + 6 * Math.sin((t - at) * 4) ** 2);
      val.textContent = format(v); place(val, hx + 22, hy - 24, 'bl'); val.style.opacity = on; if (lab) lab.style.opacity = on;
      xl.forEach((d) => (d.style.opacity = on * range(t, at, at + 0.5)));
    } });
  },
  // Pie that sweeps in slice by slice (a donut when `inner` > 0); `highlight` index is red, the
  // rest step down in paper tones. Labels sit outside each slice.
  pie(st, { values, labels = [], cx = 960, cy = 540, r = 280, inner = 0.55, at = 0, dur = 1.4, highlight = 0, out, outDur = 0.4, format = (v, f) => `${Math.round(f * 100)}%` }) {
    const sum = values.reduce((a, b) => a + b, 0); const tones = [C.PAPER, '#b9b2a4', '#8f897d', '#6c675e', '#4f4b45'];
    let a0 = -Math.PI / 2; const sl = values.map((v, i) => { const a1 = a0 + v / sum * Math.PI * 2; const s = { a0, a1, v, f: v / sum,
      p: st.make('path', { fill: i === highlight ? C.RED : tones[(i - (i > highlight ? 1 : 0)) % tones.length], opacity: 0 }),
      d: st.div(`white-space:nowrap;text-align:center`, `<div style="${F.SERIF};font-size:46px;line-height:1">${format(v, v / sum)}</div>${labels[i] ? `<div style="${F.MONO_DIM};font-size:12px;margin-top:4px">${esc(labels[i])}</div>` : ''}`) };
      const am = (a0 + a1) / 2; place(s.d, cx + Math.cos(am) * (r + 70), cy + Math.sin(am) * (r + 70), 'c'); a0 = a1; return s; });
    const arc = (a, b, R, Ri) => { const lg = b - a > Math.PI ? 1 : 0; const P = (ang, rr) => `${(cx + Math.cos(ang) * rr).toFixed(2)},${(cy + Math.sin(ang) * rr).toFixed(2)}`;
      return Ri > 0 ? `M${P(a, R)} A${R},${R} 0 ${lg} 1 ${P(b, R)} L${P(b, Ri)} A${Ri},${Ri} 0 ${lg} 0 ${P(a, Ri)} Z` : `M${cx},${cy} L${P(a, R)} A${R},${R} 0 ${lg} 1 ${P(b, R)} Z`; };
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      const sweep = -Math.PI / 2 + E.inOutCubic(range(t, at, at + dur)) * Math.PI * 2;
      sl.forEach((s, i) => { const b = Math.min(s.a1, sweep); if (b <= s.a0 + 1e-4) { s.p.style.opacity = 0; s.d.style.opacity = 0; return; }
        const pop = i === highlight ? E.outBack(range(t, at + dur, at + dur + 0.5)) * 14 : 0; const am = (s.a0 + s.a1) / 2;
        s.p.setAttribute('d', arc(s.a0, b - 0.006, r, r * inner)); s.p.setAttribute('transform', `translate(${Math.cos(am) * pop},${Math.sin(am) * pop})`); s.p.style.opacity = ex;
        s.d.style.opacity = ex * E.outCubic(range(t, at + dur * (s.a1 + Math.PI / 2) / (Math.PI * 2), at + dur * (s.a1 + Math.PI / 2) / (Math.PI * 2) + 0.4)); });
    } });
  },
  // Waffle: a grid of `total` squares that fill in reading order; the first `value` are red.
  waffle(st, { total = 100, value = 23, cols = 10, x = 760, y = 240, cell = 40, gap = 8, at = 0, dur = 1.6, label = '', out, outDur = 0.4 }) {
    const sq = []; for (let i = 0; i < total; i++) { const c = i % cols, r = Math.floor(i / cols);
      sq.push(st.make('rect', { x: x + c * (cell + gap), y: y + r * (cell + gap), width: cell, height: cell, fill: i < value ? C.RED : C.PAPER, opacity: 0 })); }
    const lab = label ? st.div(`${F.MONO};font-size:15px`, esc(label)) : null; if (lab) place(lab, x, y + Math.ceil(total / cols) * (cell + gap) + 18);
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      sq.forEach((s, i) => { const t0 = at + (i / total) * dur * (i < value ? 1 : 1); const k = E.outCubic(range(t, t0, t0 + 0.25));
        const sz = cell * (0.6 + 0.4 * k); s.setAttribute('width', sz); s.setAttribute('height', sz); s.setAttribute('transform', `translate(${(cell - sz) / 2},${(cell - sz) / 2})`);
        s.style.opacity = k * ex * (i < value ? 1 : 0.22); });
      if (lab) lab.style.opacity = ex * range(t, at + dur, at + dur + 0.4);
    } });
  },
  // Big number with a comparison object: the number counts up (serif), then a row of unit marks
  // (`ratio` of them, e.g. 40 for "40x") fills in to show how big that is against `unitLabel`.
  bigNumber(st, { value, prefix = '', suffix = '', label = '', source = '', ratio = 10, unitLabel = '', at = 0, dur = 1.4, x = 150, y = 470, out, outDur = 0.4, decimals = 0 }) {
    const n = text.counter(st, { from: 0, to: value, at, dur, prefix, suffix, decimals, x, y, size: 210, anchor: 'bl' }); st.items.pop();
    const lb = st.div(`${F.MONO};font-size:16px;white-space:nowrap`, esc(label)); place(lb, x + 6, y + 18);
    const src = source ? st.div(`${F.MONO_DIM};font-size:12px;white-space:nowrap`, esc(source)) : null; if (src) place(src, x + 6, 1000);
    const cols = Math.min(ratio, 25), rowsN = Math.ceil(ratio / cols), u = 30, g = 10;
    const marks = []; for (let i = 0; i < ratio; i++) { const c = i % cols, r = Math.floor(i / cols); marks.push(st.make('rect', { x: x + 6 + c * (u + g), y: y + 90 + r * (u + g), width: u, height: u, fill: i === 0 ? C.RED : 'none', stroke: i === 0 ? C.RED : C.CAP, 'stroke-width': 1.5, opacity: 0 })); }
    const ul = unitLabel ? st.div(`${F.MONO_DIM};font-size:13px;white-space:nowrap`, `<span style="color:${C.RED_TEXT}">■</span> = ${esc(unitLabel)}`) : null; if (ul) place(ul, x + 6, y + 90 + rowsN * (u + g) + 10);
    return st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      n.update(t); n.el.style.opacity = String(Number(n.el.style.opacity) * ex);
      lb.style.opacity = ex * E.outCubic(range(t, at + 0.3, at + 0.8)); if (src) src.style.opacity = ex * range(t, at + dur, at + dur + 0.5);
      const t1 = at + dur + 0.1; marks.forEach((m, i) => { const k = E.outCubic(range(t, t1 + i * Math.min(0.06, 1.4 / ratio), t1 + i * Math.min(0.06, 1.4 / ratio) + 0.25)); m.style.opacity = k * ex; });
      if (ul) ul.style.opacity = ex * range(t, t1 + 0.3, t1 + 0.8);
    } });
  },
};
