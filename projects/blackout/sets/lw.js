// LIVE WIRE kit (episode 4): palette, type, the CRT pass, phosphor drawing, the 50 Hz scope, the
// SCADA HMI screen, fluorescent flicker and deterministic snow. Shared by every set in this folder.
// Everything here is a pure function of its arguments (t, seed): no state carried between frames.
//
// Light is power: every light in a frame is electric and motivated, and when the grid dies in the
// story the light dies in the frame (projects/blackout/STYLE.md).
import * as THREE from 'three';

export const PAL = {
  bg: '#000000', phosphor: '#5dff9e', fluoro: '#d8ffe6', sodium: '#ffa24a', flash: '#fff8ee',
  snow0: '#0b1a2a', snow1: '#9fb7cf', red: '#ff2b1f', ink: '#d8ffe6', inkSoft: '#7fae92', dim: '#2f6b4a',
  grid: 'rgba(93,255,158,0.10)', screen: '#cfe9ff',
};
export const RED = 0xff2b1f, GREEN = 0x5dff9e, FLUO = 0xd8ffe6, SODIUM = 0xffa24a, FLASH = 0xfff8ee;

// fonts: Big Shoulders Display (display, OFL) and VT323 (DEC VT320 terminal face, OFL), from
// projects/blackout/assets/fonts (fetched from github.com/google/fonts). Plex Mono comes from the stage.
export const FONT = { display: "'Big Shoulders Display'", term: "'VT323'", mono: "'Plex Mono'", ui: "'Archivo Narrow'" };
let fontsP = null;
export function loadFonts() {
  return fontsP ??= (async () => {
    const base = '/projects/blackout/assets/fonts/';
    const faces = [new FontFace('Big Shoulders Display', `url(${base}BigShouldersDisplay.ttf)`, { weight: '100 900' }),
      new FontFace('VT323', `url(${base}VT323-Regular.ttf)`)];
    for (const f of faces) { await f.load(); document.fonts.add(f); }
    await Promise.all(['900 40px "Big Shoulders Display"', '600 40px "Big Shoulders Display"', '300 40px "Big Shoulders Display"', '40px VT323'].map(s => document.fonts.load(s)));
  })();
}

// ---------------------------------------------------------------- maths
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const sstep = (a, b, x) => { const u = range(x, a, b); return u * u * (3 - 2 * u); };
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const inCubic = (x) => Math.pow(clamp(x), 3);
export function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
export function rng(seed = 1) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// smooth 1D value noise in [0, 1]
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, seed), hash(i + 1, seed), u); }
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
// shot-relative time of a spoken word (nth hit), else `fallback` (a number) when the VO doesn't say it
export function cue(shot, spec, fallback) {
  if (spec === undefined || spec === null) return fallback;
  if (typeof spec === 'number') return spec;
  const m = String(spec).match(/^(.+?)(?:@(\d+))?([+-][\d.]+)?$/); const [, word, nth, off] = m;
  const hits = (shot.words ?? []).filter(x => norm(x.w).startsWith(norm(word)));
  const t = hits.length ? (hits[Number(nth ?? 0)] ?? hits.at(-1)).s : fallback;
  return (t ?? 0) + Number(off ?? 0);
}

// ---------------------------------------------------------------- fluorescent and power
// A healthy fluorescent tube: steady with a faint deterministic shimmer (0.97..1).
export const tube = (t, seed = 0) => 0.975 + 0.025 * noise1(t * 7 + seed * 13, seed);
// Failing / striking tube. k: 0 = on, 1 = dead. Returns brightness 0..1 with the classic stutter:
// a dying tube blinks with shrinking duty; a striking one (strike=true) blinks twice then holds.
export function flickerOut(k, seed = 0) {
  if (k <= 0) return 1; if (k >= 1) return 0;
  const n = 9, i = Math.floor(k * n), r = hash(i, seed, 'fo');
  const duty = 1 - k; const on = r < duty * 0.95 + 0.05 * (i === 0 ? 1 : 0);
  return on ? (0.55 + 0.45 * hash(i, seed, 'b')) * (1 - k * 0.5) : 0.02 + 0.03 * hash(i, seed, 'g');
}
export function strike(k, seed = 0) {
  if (k <= 0) return 0; if (k >= 1) return 1;
  const blinks = [[0.0, 0.08], [0.22, 0.3], [0.45, 1.0]];
  for (const [a, b] of blinks) if (k >= a && k < b) return a === 0.45 ? 0.6 + 0.4 * sstep(0.45, 0.7, k) : 0.7 + 0.2 * hash(Math.floor(k * 30), seed);
  return 0.03;
}

// ---------------------------------------------------------------- 2D canvas helpers
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); c.g = c.getContext('2d', { willReadFrequently: true }); return c; }
export function reset(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowBlur = 0; g.lineCap = 'round'; g.lineJoin = 'round'; }
// Phosphor stroke: a wide dim halo, a mid glow and a hot core, added ('lighter'). pts in px.
export function glowPath(g, pts, { color = PAL.phosphor, width = 3, glow = 1, alpha = 1, core = '#eafff2' } = {}) {
  if (pts.length < 2 || alpha <= 0) return;
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  path(); g.strokeStyle = color; g.globalAlpha = 0.07 * glow * alpha; g.lineWidth = width * 9; g.stroke();
  g.globalAlpha = 0.18 * glow * alpha; g.lineWidth = width * 3.4; g.stroke();
  g.globalAlpha = 0.85 * alpha; g.lineWidth = width; g.stroke();
  g.strokeStyle = core; g.globalAlpha = 0.6 * alpha; g.lineWidth = Math.max(1, width * 0.38); g.stroke();
  g.restore();
}
// glowing text: a soft halo copy (blurred via a cheap offset ring) plus the core, 'lighter'
export function glowText(g, text, x, y, { font = `64px ${FONT.term}`, color = PAL.phosphor, alpha = 1, align = 'left', base = 'alphabetic', glow = 1, spacing = 0 } = {}) {
  if (alpha <= 0 || !text) return;
  g.save(); g.font = font; g.textAlign = align; g.textBaseline = base; g.globalCompositeOperation = 'lighter';
  if (spacing) g.letterSpacing = `${spacing}px`;
  g.fillStyle = color;
  const r = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 40) * 0.06 * glow;
  if (r > 0.5) { g.globalAlpha = 0.16 * alpha; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillText(text, x + Math.cos(a) * r, y + Math.sin(a) * r); } }
  g.globalAlpha = alpha; g.fillText(text, x, y);
  g.restore();
}
// type-on: the first n characters of text (n may be fractional; the cursor block blinks at 2 Hz when idle)
export function typed(text, n) { return String(text).slice(0, Math.max(0, Math.floor(n))); }
export function cursorBlock(g, x, y, h, t, { color = PAL.phosphor, on = true, w = null } = {}) {
  if (!on || Math.floor(t * 2.2) % 2) return; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = color; g.globalAlpha = 0.85; g.fillRect(x, y - h * 0.82, w ?? h * 0.5, h * 0.95); g.restore();
}
// chars typed at time t from `at` at `cps` chars per second with human jitter (deterministic)
export function typeCount(text, t, at, cps = 22, seed = 1) {
  if (t < at) return 0; let tt = at, n = 0; const L = text.length;
  while (n < L) { const c = text[n]; const d = (1 / cps) * (0.55 + 0.9 * hash(n, seed)) * (c === ' ' ? 1.4 : 1) * (/[.,:;]/.test(c) ? 2.4 : 1); if (tt + d > t) break; tt += d; n++; }
  return n;
}
export const typeEnd = (text, at, cps = 22, seed = 1) => { let tt = at; for (let n = 0; n < text.length; n++) { const c = text[n]; tt += (1 / cps) * (0.55 + 0.9 * hash(n, seed)) * (c === ' ' ? 1.4 : 1) * (/[.,:;]/.test(c) ? 2.4 : 1); } return tt; };

// ---------------------------------------------------------------- the CRT pass
// A full-screen pass for sets that paint a 2D canvas (or render to a target): barrel curvature, scanlines,
// a faint aperture-grille mask, phosphor bloom (mip taps), chromatic fringe, vignette, power and the
// collapse to a line / dot (sqY, sqX). Display-referred maths; output is written as-is (no tone map).
const CRT_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const CRT_FS = /* glsl */`
precision highp float;
uniform sampler2D tSrc; uniform vec2 uRes; uniform float uCurve, uScan, uMask, uBloom, uVig, uPower, uTime, uSqY, uSqX, uNoise, uAberr, uLift, uFlat, uEncode;
uniform vec3 uTint;
varying vec2 vUv;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec2 c = vUv * 2. - 1.;
  vec2 cc = c * (1. + uCurve * vec2(c.y * c.y * .28, c.x * c.x * .42));
  vec2 q = vec2(cc.x / max(uSqX, 1e-4), cc.y / max(uSqY, 1e-4));
  vec2 uv = q * .5 + .5;
  // soft-edged tube face
  vec2 e = smoothstep(vec2(1.), vec2(1. - .012 / max(uSqX, .02), 1. - .012 / max(uSqY, .02)), abs(q));
  float inside = mix(1., e.x * e.y, uCurve > 0. ? 1. : step(.999, uSqY * uSqX) < .5 ? 1. : 0.);
  inside *= step(abs(q.x), 1.) * step(abs(q.y), 1.);
  float ab = uAberr * dot(c, c);
  vec3 col = vec3(texture2D(tSrc, uv + vec2(ab, 0.)).r, texture2D(tSrc, uv).g, texture2D(tSrc, uv - vec2(ab, 0.)).b);
  vec3 bl = textureLod(tSrc, uv, 3.).rgb * .55 + textureLod(tSrc, uv, 5.).rgb * .45;
  if (uEncode > .5) { col = pow(max(col, 0.), vec3(1. / 2.2)); bl = pow(max(bl, 0.), vec3(1. / 2.2)); }
  col += bl * uBloom;
  // scanlines (270 visible lines; strength fades out when they'd alias at draft size)
  float sl = .5 + .5 * cos(uv.y * 270. * 6.2831853);
  float scanK = uScan * smoothstep(400., 900., uRes.y);
  col *= 1. - scanK * (1. - sl) * (1. - .6 * smoothstep(.4, 1., dot(col, vec3(.33))));
  // aperture grille (output pixels)
  float px = mod(floor(vUv.x * uRes.x), 3.);
  vec3 m = px < 1. ? vec3(1., .82, .82) : px < 2. ? vec3(.82, 1., .82) : vec3(.82, .82, 1.);
  col *= mix(vec3(1.), m, uMask * smoothstep(900., 1080., uRes.y));
  // collapse: the beam concentrates, so a line or a dot burns brighter
  float conc = 1. / sqrt(max(uSqY * mix(1., uSqX, .6), 1e-3));
  col *= mix(1., min(conc, 9.), 1. - smoothstep(.02, .35, uSqY));
  col = col * uTint * uPower + uLift * uTint;
  // vignette, noise
  float v = 1. - uVig * smoothstep(.35, 1.45, length(c * vec2(.92, 1.08)));
  col *= v;
  col += (h12(vUv * uRes + fract(uTime * 7.31) * 913.) - .5) * uNoise;
  gl_FragColor = vec4(max(col, 0.) * inside, 1.);
}`;
export function crt(ctx, opts = {}) {
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const src = opts.canvas ?? canvas(ctx.width, ctx.height);
  const tex = opts.texture ?? new THREE.CanvasTexture(src);
  if (!opts.texture) { tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; }
  const U = { tSrc: { value: tex }, uRes: { value: new THREE.Vector2(ctx.width, ctx.height) }, uCurve: { value: opts.curve ?? 0.12 }, uScan: { value: opts.scan ?? 0.22 },
    uMask: { value: opts.mask ?? 0.1 }, uBloom: { value: opts.bloom ?? 0.9 }, uVig: { value: opts.vignette ?? 0.55 }, uPower: { value: 1 }, uTime: { value: 0 },
    uSqY: { value: 1 }, uSqX: { value: 1 }, uNoise: { value: opts.noise ?? 0.035 }, uAberr: { value: opts.aberr ?? 0.0012 }, uLift: { value: opts.lift ?? 0.0 }, uFlat: { value: 0 }, uEncode: { value: opts.encode ? 1 : 0 },
    uTint: { value: new THREE.Vector3(...(opts.tint ?? [1, 1, 1])) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: CRT_VS, fragmentShader: CRT_FS, depthTest: false, depthWrite: false, toneMapped: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; scene.add(quad);
  return {
    canvas: src, g: src.g ?? src.getContext('2d'), U, tex, scene, camera,
    // per frame: set state, mark the canvas dirty, render the pass to the current target
    render(renderer, { t = 0, power = 1, sqY = 1, sqX = 1, dirty = true } = {}) {
      U.uTime.value = t; U.uPower.value = power; U.uSqY.value = sqY; U.uSqX.value = sqX;
      if (dirty && !opts.texture) tex.needsUpdate = true;
      renderer.render(scene, camera);
    },
    dispose() { tex.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------- the 50 Hz oscilloscope
// drawScope(g, box, t, o): an analogue scope: graticule (10 x 8 divisions), a phosphor trace with
// persistence, readouts. o.mode: 'steady' | 'stutter' | 'flat' (flatline at o.at) | 'drop' (frequency
// falls from 50 Hz from o.at over o.span s to o.to Hz, then o.end: 'flat' | 'hold' | 'recover').
// o.amp (0..1 of the half-height), o.freqShow (readout), o.grid (0..1), o.alpha. Pure in t.
export function scopeState(t, o = {}) {
  const mode = o.mode ?? 'steady', at = o.at ?? 1.5;
  let f = 50, amp = 1, glitch = 0, dead = 0;
  if (mode === 'flat') { const k = range(t, at, at + (o.fall ?? 0.55)); amp = 1 - smoother(k); f = 50 - 6 * k * k; dead = k; }
  if (mode === 'drop') {
    const span = o.span ?? 4, to = o.to ?? 47.5, k = smoother(range(t, at, at + span));
    f = lerp(50, to, k) - 0.02 * Math.sin(t * 3.1);
    if ((o.end ?? 'flat') === 'flat') { const kk = range(t, at + span, at + span + 0.5); amp = 1 - smoother(kk); dead = kk; if (kk > 0) f = lerp(f, 0, kk); }
    if (o.end === 'recover') { const kr = smoother(range(t, at + span + 1.2, at + span + 4)); f = lerp(f, 50, kr); }
  }
  if (mode === 'stutter') {
    const slot = Math.floor(t * 9), r = hash(slot, o.seed ?? 3, 'st');
    glitch = r > 0.62 ? (r - 0.62) / 0.38 : 0;
    amp = 1 - 0.75 * glitch * (hash(slot, 'a') > 0.5 ? 1 : 0.3);
    f = 50 + (hash(slot, 'f') - 0.5) * 1.6 * glitch;
  }
  if (mode === 'steady') f = 50 + 0.012 * Math.sin(t * 0.7 + 1) + 0.006 * Math.sin(t * 2.3);
  return { f, amp, glitch, dead, mode };
}
export function drawScope(g, box, t, o = {}) {
  const [x0, y0, w, h] = box, cy = y0 + h / 2, S = o.scale ?? (h / 640), alpha = o.alpha ?? 1;
  const st = scopeState(t, o);
  // graticule
  if ((o.grid ?? 1) > 0) {
    g.save(); g.globalAlpha = (o.grid ?? 1) * alpha; g.strokeStyle = 'rgba(93,255,158,0.16)'; g.lineWidth = Math.max(1, 1.2 * S);
    for (let i = 0; i <= 10; i++) { const x = x0 + w * i / 10; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + h); g.stroke(); }
    for (let j = 0; j <= 8; j++) { const y = y0 + h * j / 8; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
    g.strokeStyle = 'rgba(93,255,158,0.32)';
    for (let i = 0; i <= 50; i++) { const x = x0 + w * i / 50; g.beginPath(); g.moveTo(x, cy - 6 * S); g.lineTo(x, cy + 6 * S); g.stroke(); }
    for (let j = 0; j <= 40; j++) { const y = y0 + h * j / 40; g.beginPath(); g.moveTo(x0 + w / 2 - 6 * S, y); g.lineTo(x0 + w / 2 + 6 * S, y); g.stroke(); }
    g.restore();
  }
  // trace: the display shows `cycles` periods of 50 Hz across the width (fixed time base), so a falling
  // frequency stretches the wave visibly. Persistence: the previous sweeps, fading.
  const cycles = o.cycles ?? 2.5, A = (o.amp ?? 0.62) * h / 2 * st.amp;
  const tb = cycles / 50; // seconds across the screen
  const N = Math.max(80, Math.round(w / (2.2 * S)));
  const trace = (tt, a, wd) => {
    const s2 = scopeState(tt, o), pts = [];
    // phase continuity: integrate the frequency (cheap closed form for our piecewise-smooth f: sample)
    const ph0 = phaseAt(tt, o);
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = x0 + u * w; let y = Math.sin(ph0 + u * tb * s2.f * 2 * Math.PI);
      if (s2.glitch > 0) { const k = hash(Math.floor(tt * 9), Math.floor(u * 7), 'g'); if (k > 0.7) y = y * 0.2 + (hash(Math.floor(u * 40), Math.floor(tt * 30)) - 0.5) * 0.6 * s2.glitch; }
      pts.push([x, cy - y * (o.amp ?? 0.62) * h / 2 * s2.amp]);
    }
    glowPath(g, pts, { width: wd, alpha: a * alpha, glow: o.glow ?? 1, color: o.color ?? (s2.f < (o.alarmHz ?? 49.2) && s2.mode === 'drop' ? '#ffd27a' : PAL.phosphor) });
  };
  for (let k = 3; k >= 1; k--) trace(t - k * 0.045, 0.16 / k, (o.width ?? 3.2) * S);
  trace(t, 1, (o.width ?? 3.2) * S);
  // readouts
  if (o.readout !== false) {
    const fs = Math.round(30 * S); g.save();
    const fTxt = (st.dead >= 1 ? '--.--' : (st.dead > 0 ? '00.00' : st.f.toFixed(2))) + ' Hz';
    glowText(g, 'CH1', x0 + 10 * S, y0 + fs + 6 * S, { font: `${fs}px ${FONT.term}`, alpha: 0.75 * alpha });
    const alarm = st.mode === 'drop' && st.f < (o.alarmHz ?? 49.2) && st.dead < 1;
    glowText(g, fTxt, x0 + w - 10 * S, y0 + fs + 6 * S, { font: `${fs}px ${FONT.term}`, align: 'right', alpha, color: alarm ? PAL.red : PAL.phosphor });
    glowText(g, `${(o.vdiv ?? '100 kV')}/div   ${(tb * 100).toFixed(1)} ms/div`, x0 + 10 * S, y0 + h - 10 * S, { font: `${Math.round(fs * 0.8)}px ${FONT.term}`, alpha: 0.55 * alpha });
    if (o.label) glowText(g, o.label, x0 + w - 10 * S, y0 + h - 10 * S, { font: `${Math.round(fs * 0.8)}px ${FONT.term}`, align: 'right', alpha: 0.7 * alpha });
    if (st.dead >= 1 && o.noSignal !== false) glowText(g, 'NO SIGNAL', x0 + w / 2, cy - 40 * S, { font: `${Math.round(fs * 1.1)}px ${FONT.term}`, align: 'center', alpha: alpha * (Math.floor(t * 2) % 2 ? 0.35 : 0.9), color: PAL.red });
    g.restore();
  }
  return st;
}
// integrated phase of the scope trace (radians), numerically from the frequency curve; the trigger
// re-arms each sweep so a steady 50 Hz stands still, a changing one drifts (as a real scope does)
function phaseAt(t, o) {
  const st = scopeState(t, o);
  if (st.mode === 'steady') return 0.3 + 0.05 * Math.sin(t * 0.9);
  // drift relative to a 50 Hz trigger: integral of (f - 50) dt, sampled at 40 Hz
  let ph = 0; const dt = 1 / 40, n = Math.max(0, Math.floor(t / dt));
  for (let i = 0; i < n; i++) ph += (scopeState(i * dt, o).f - 50) * dt * 2 * Math.PI * 0.35;
  return 0.3 + ph;
}

// ---------------------------------------------------------------- corner scope (DOM overlay on any set)
// params.scope on a shot: 'steady' | 'stutter' | 'flat' | 'drop' (or an object of drawScope opts).
export function cornerScope(layer, ctx, spec, { corner = 'tr', w = 300, h = 150 } = {}) {
  const s = ctx.height / 1080, o = typeof spec === 'string' ? { mode: spec } : { ...spec };
  const c = canvas(w * s, h * s); c.style.cssText = `position:absolute;${corner[0] === 't' ? 'top' : 'bottom'}:${46 * s}px;${corner[1] === 'l' ? 'left' : 'right'}:${56 * s}px;width:${w * s}px;height:${h * s}px;opacity:.92`;
  layer.appendChild(c);
  return { el: c, update(t) {
    reset(c.g); c.g.fillStyle = 'rgba(0,6,3,0.72)'; c.g.fillRect(0, 0, c.width, c.height);
    drawScope(c.g, [6 * s, 6 * s, c.width - 12 * s, c.height - 12 * s], t, { grid: 0.6, cycles: 2, amp: 0.55, width: 2.4, scale: s * 0.42, ...o, readout: o.readout ?? true });
    c.g.strokeStyle = 'rgba(93,255,158,.35)'; c.g.lineWidth = 1; c.g.strokeRect(0.5, 0.5, c.width - 1, c.height - 1);
  } };
}

// ---------------------------------------------------------------- the SCADA HMI (2015 regional DMS)
// One-line of a 110/35/10 kV district network on a dark operator screen, the way a 2015 distribution
// dispatcher saw it: menu bar, the diagram, an alarm list, a status bar. Breakers: filled green square
// = CLOSED, red outline = OPEN (STYLE.md). st: { t, open: {id: 0..1}, cursor: {x, y, down, visible},
// dialog: 0..1, title, clock, alarms: [[time, text]], lockout: 0..1 }. Drawn into g at w x h.
export const HMI_BREAKERS = [
  // id, x, y (fractions of the diagram box), label
  ['Q1', 0.16, 0.22, 'T1 110'], ['Q2', 0.84, 0.22, 'T2 110'],
  ['Q11', 0.08, 0.62, 'F-11'], ['Q12', 0.2, 0.62, 'F-12'], ['Q13', 0.32, 0.62, 'F-13'], ['Q14', 0.44, 0.62, 'F-14'],
  ['Q21', 0.56, 0.62, 'F-21'], ['Q22', 0.68, 0.62, 'F-22'], ['Q23', 0.8, 0.62, 'F-23'], ['Q24', 0.92, 0.62, 'F-24'],
  ['QB', 0.5, 0.42, 'BUS-TIE'],
];
export function hmiBreaker(id, w, h) { const b = HMI_BREAKERS.find(x => x[0] === id) ?? HMI_BREAKERS[5]; const D = hmiBox(w, h); return [D[0] + b[1] * D[2], D[1] + b[2] * D[3]]; }
const hmiBox = (w, h) => [w * 0.04, h * 0.1, w * 0.92, h * 0.6];
export function drawHMI(g, w, h, st = {}) {
  const t = st.t ?? 0, s = h / 1024, open = st.open ?? {};
  reset(g); g.lineCap = 'butt';
  g.fillStyle = '#05090c'; g.fillRect(0, 0, w, h);
  // menu bar + title
  g.fillStyle = '#20262c'; g.fillRect(0, 0, w, 34 * s);
  g.fillStyle = '#9fb1c0'; g.font = `${17 * s}px ${FONT.ui}`; g.textBaseline = 'middle';
  ['File', 'View', 'Control', 'Alarms', 'Trends', 'Reports', 'Help'].forEach((m, i) => g.fillText(m, 14 * s + i * 82 * s, 17 * s));
  g.textAlign = 'right'; g.fillText(st.title ?? 'DMS · DISTRICT 110/35/10 kV · SS-07', w - 14 * s, 17 * s); g.textAlign = 'left';
  g.fillStyle = '#0c1318'; g.fillRect(0, 34 * s, w, 40 * s);
  g.fillStyle = '#5dff9e'; g.font = `${20 * s}px ${FONT.mono}`; g.fillText('SUBSTATION SS-07   110 kV / 10 kV', 18 * s, 54 * s);
  const D = hmiBox(w, h), X = (u) => D[0] + u * D[2], Y = (v) => D[1] + v * D[3];
  const green = '#46e08a', red = '#ff2b1f', dead = '#3b4a44';
  const anyOpen = (ids) => ids.some(i => (open[i] ?? 0) > 0.5);
  const energ1 = !anyOpen(['Q1']), energ2 = !anyOpen(['Q2']);
  const line = (x1, y1, x2, y2, live, wd = 3) => { g.strokeStyle = live ? green : dead; g.lineWidth = wd * s; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  // incoming 110 kV lines and transformers
  for (const [u, live, nm] of [[0.16, true, 'L-110 NORTH'], [0.84, true, 'L-110 SOUTH']]) {
    line(X(u), Y(0.0), X(u), Y(0.18), live, 4);
    g.fillStyle = '#9fb1c0'; g.font = `${15 * s}px ${FONT.mono}`; g.fillText(nm, X(u) + 10 * s, Y(0.03));
  }
  for (const [u, id, live] of [[0.16, 'Q1', energ1], [0.84, 'Q2', energ2]]) {
    line(X(u), Y(0.26), X(u), Y(0.3), live, 4);
    // transformer: two circles
    g.strokeStyle = live ? green : dead; g.lineWidth = 2.5 * s; g.beginPath(); g.arc(X(u), Y(0.33), 13 * s, 0, 7); g.stroke(); g.beginPath(); g.arc(X(u), Y(0.33) + 16 * s, 13 * s, 0, 7); g.stroke();
    line(X(u), Y(0.33) + 29 * s, X(u), Y(0.5), live, 4);
  }
  // 10 kV busbars (two sections + tie)
  const busL = energ1 || (energ2 && (open.QB ?? 0) < 0.5), busR = energ2 || (energ1 && (open.QB ?? 0) < 0.5);
  line(X(0.04), Y(0.5), X(0.47), Y(0.5), busL, 7); line(X(0.53), Y(0.5), X(0.96), Y(0.5), busR, 7);
  line(X(0.47), Y(0.5), X(0.5), Y(0.42), busL && (open.QB ?? 0) < 0.5, 3); line(X(0.5), Y(0.42), X(0.53), Y(0.5), busR && (open.QB ?? 0) < 0.5, 3);
  g.fillStyle = '#9fb1c0'; g.font = `${15 * s}px ${FONT.mono}`; g.fillText('10 kV BUS 1', X(0.05), Y(0.5) - 14 * s); g.fillText('10 kV BUS 2', X(0.54), Y(0.5) - 14 * s);
  // feeders
  for (const b of HMI_BREAKERS.filter(b => b[0].length === 3)) {
    const live = (b[1] < 0.5 ? busL : busR) && (open[b[0]] ?? 0) < 0.5;
    line(X(b[1]), Y(0.5), X(b[1]), Y(0.58), b[1] < 0.5 ? busL : busR, 3);
    line(X(b[1]), Y(0.66), X(b[1]), Y(0.92), live, 3);
    g.strokeStyle = live ? green : dead; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(X(b[1]) - 9 * s, Y(0.92)); g.lineTo(X(b[1]) + 9 * s, Y(0.92)); g.lineTo(X(b[1]), Y(0.92) + 12 * s); g.closePath(); g.stroke();
    g.fillStyle = live ? '#cfe9ff' : '#5c6a70'; g.font = `${14 * s}px ${FONT.mono}`; g.textAlign = 'center'; g.fillText(b[3], X(b[1]), Y(0.98)); g.textAlign = 'left';
    g.fillStyle = live ? '#7fae92' : '#5c6a70'; g.fillText(live ? `${(180 + 40 * hash(b[0])).toFixed(0)} A` : '0 A', X(b[1]) + 14 * s, Y(0.8));
  }
  // breakers
  for (const b of HMI_BREAKERS) {
    const k = clamp(open[b[0]] ?? 0), x = X(b[1]), y = Y(b[2]), r = 13 * s;
    const blink = k > 0.5 && k < 1 ? (Math.floor(t * 3) % 2) : 0;
    if (k < 0.5) { g.fillStyle = green; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.strokeStyle = '#0a1a10'; g.lineWidth = 2 * s; g.strokeRect(x - r + 3 * s, y - r + 3 * s, 2 * r - 6 * s, 2 * r - 6 * s); }
    else { g.fillStyle = blink ? 'rgba(255,43,31,.55)' : '#05090c'; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.strokeStyle = red; g.lineWidth = 3.4 * s; g.strokeRect(x - r, y - r, 2 * r, 2 * r); g.beginPath(); g.moveTo(x - r * 0.6, y); g.lineTo(x + r * 0.6, y); g.stroke(); }
    g.fillStyle = '#9fb1c0'; g.font = `${13 * s}px ${FONT.mono}`; g.fillText(b[0], x + r + 5 * s, y - r + 4 * s);
  }
  // confirm dialog
  if ((st.dialog ?? 0) > 0) {
    const a = clamp(st.dialog), dw = 420 * s, dh = 170 * s, dx = X(st.dialogAt?.[0] ?? 0.32) + 40 * s, dy = Y(st.dialogAt?.[1] ?? 0.62) - 40 * s;
    g.globalAlpha = a; g.fillStyle = '#d4d0c8'; g.fillRect(dx, dy, dw, dh); g.fillStyle = '#0a246a'; g.fillRect(dx, dy, dw, 30 * s);
    g.fillStyle = '#fff'; g.font = `bold ${16 * s}px ${FONT.ui}`; g.fillText('Control: ' + (st.dialogId ?? 'Q13'), dx + 10 * s, dy + 16 * s);
    g.fillStyle = '#000'; g.font = `${17 * s}px ${FONT.ui}`; g.fillText(`Open breaker ${st.dialogId ?? 'Q13'}?`, dx + 24 * s, dy + 66 * s);
    for (const [bx, lb] of [[dx + 120 * s, 'OPEN'], [dx + 250 * s, 'Cancel']]) { g.fillStyle = '#d4d0c8'; g.fillRect(bx, dy + 110 * s, 100 * s, 36 * s); g.strokeStyle = '#404040'; g.lineWidth = 1.5 * s; g.strokeRect(bx, dy + 110 * s, 100 * s, 36 * s); g.fillStyle = '#000'; g.textAlign = 'center'; g.fillText(lb, bx + 50 * s, dy + 129 * s); g.textAlign = 'left'; }
    g.globalAlpha = 1;
  }
  // alarm list
  const AY = h * 0.74; g.fillStyle = '#0c1318'; g.fillRect(0, AY, w, h * 0.21);
  g.fillStyle = '#9fb1c0'; g.font = `${15 * s}px ${FONT.ui}`; g.fillText('ALARMS / EVENTS', 14 * s, AY + 16 * s);
  const al = st.alarms ?? [];
  al.slice(-6).forEach(([tm, tx, sev], i) => { g.fillStyle = sev === 'ok' ? '#7fae92' : (Math.floor(t * 2.5 + i) % 2 && i === al.slice(-6).length - 1 ? '#ffd0cc' : '#ff5a4a'); g.font = `${16 * s}px ${FONT.mono}`; g.fillText(`${tm}  ${tx}`, 18 * s, AY + 44 * s + i * 24 * s); });
  // status bar
  g.fillStyle = '#20262c'; g.fillRect(0, h - 34 * s, w, 34 * s);
  g.fillStyle = '#9fb1c0'; g.font = `${16 * s}px ${FONT.mono}`; g.fillText(`OPERATOR: DISP-2   ${st.clock ?? '23.12.2015 15:35:12'}`, 14 * s, h - 17 * s);
  g.textAlign = 'right'; g.fillStyle = (st.lockout ?? 0) > 0.5 ? '#ff5a4a' : '#7fae92'; g.fillText((st.lockout ?? 0) > 0.5 ? 'REMOTE SESSION ACTIVE' : 'COMM OK  ·  RTU 07', w - 14 * s, h - 17 * s); g.textAlign = 'left';
  // pointer (drawn last: a classic white arrow with a black edge)
  const cu = st.cursor; if (cu && cu.visible !== false) pointer(g, cu.x, cu.y, (cu.size ?? 1) * s * 1.25, cu.down);
  g.textBaseline = 'alphabetic';
}
export function pointer(g, x, y, k = 1, down = false) {
  const P = [[0, 0], [0, 22], [5, 17], [9, 26], [12.5, 24.5], [8.5, 16], [15.5, 16]];
  g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); P.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
  g.fillStyle = down ? '#e8e8e8' : '#ffffff'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#000'; g.lineJoin = 'miter'; g.stroke();
  g.restore();
}
// The pointer's path when it moves "by itself": a remote operator's hand: hesitant start, a fast
// ballistic sweep, two small corrective sub-movements, settle on the target. Pure in t.
export function ghostPath(t, from, to, { at = 0, dur = 1.6, seed = 4 } = {}) {
  const k = range(t, at, at + dur);
  // minimum-jerk main sweep to 96 % plus a corrective sub-movement
  const mj = (u) => smoother(u);
  const main = mj(range(k, 0.05, 0.72)) * 0.965, corr = mj(range(k, 0.74, 0.98)) * 0.035;
  const u = main + corr;
  const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) || 1;
  // slight curvature of the arm's arc and a tremor that fades as it lands
  const bow = Math.sin(Math.PI * clamp(u)) * L * 0.06 * (hash(seed) > 0.5 ? 1 : -1);
  const trem = (1 - k) * 0.8 * (noise1(t * 9, seed) - 0.5);
  return [from[0] + dx * u - dy / L * bow + trem, from[1] + dy * u + dx / L * bow + trem * 0.6];
}

// ---------------------------------------------------------------- deterministic snow (THREE.Points)
// Flakes fall at their own speed, drift and tumble; positions are a pure function of uTime. Inside a
// lit cone (floodlight / flashlight / streetlight) a flake catches the light: uL[i] = pos + range,
// uD[i] = dir + cos(cone). Up to 4 lights.
export function snow(opts = {}) {
  const { count = 4000, box = [40, 20, 40], center = [0, 10, 0], size = 0.035, speed = 0.9, seed = 7, color = 0xdfe9f5, base = 0.06, wind = [0.25, 0, 0.05] } = opts;
  const r = rng(seed), P = new Float32Array(count * 3), A = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { P.set([r(), r(), r()], i * 3); A.set([0.6 + r() * 0.8, r() * 6.283, 0.5 + r(), r()], i * 4); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aR', new THREE.BufferAttribute(A, 4));
  const U = { uTime: { value: 0 }, uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(...center) }, uSize: { value: size }, uSpeed: { value: speed },
    uColor: { value: new THREE.Color(color) }, uBase: { value: base }, uWind: { value: new THREE.Vector3(...wind) }, uPx: { value: 1000 },
    uL: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -1e5, 0, 0)) }, uD: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -1, 0, 1)) }, uLC: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(1, 1, 1)) },
    uOpacity: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uSize, uSpeed, uPx, uBase; uniform vec3 uBox, uCenter, uWind; uniform vec4 uL[4], uD[4]; uniform vec3 uLC[4];
      attribute vec4 aR; varying float vA; varying vec3 vC;
      void main() {
        vec3 p = position;
        float fall = uTime * uSpeed * aR.x / uBox.y;
        p.y = fract(p.y - fall);
        p.x = fract(p.x + (uWind.x * uTime + .35 * sin(uTime * .7 * aR.z + aR.y)) / uBox.x);
        p.z = fract(p.z + (uWind.z * uTime + .3 * cos(uTime * .6 * aR.z + aR.y * 1.3)) / uBox.z);
        vec3 w = uCenter + (p - .5) * uBox;
        vec3 lit = vec3(uBase);
        for (int i = 0; i < 4; i++) { if (uL[i].w <= 0.) continue; vec3 L = w - uL[i].xyz; float d = length(L); float c = dot(L / max(d, 1e-3), uD[i].xyz);
          lit += uLC[i] * smoothstep(uD[i].w, mix(uD[i].w, 1., .35), c) * clamp(1. - d / uL[i].w, 0., 1.) * clamp(1. - d / uL[i].w, 0., 1.) * 3.; }
        vC = lit; vec4 mv = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
        float sz = uSize * (.6 + .8 * aR.z) * uPx / max(-mv.z, .05);
        vA = smoothstep(0., 1.5, sz) * smoothstep(0., .04, p.y) * smoothstep(1., .96, p.y);
        gl_PointSize = clamp(sz, 1.5, 48.);
        vA *= clamp(sz / 1.5, .15, 1.) * (sz > 30. ? 30. / sz : 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity; varying float vA; varying vec3 vC;
      void main() { vec2 q = gl_PointCoord - .5; float d = length(q); float a = smoothstep(.5, .1, d) * vA * uOpacity; gl_FragColor = vec4(uColor * vC * a, a); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 10;
  return { points: pts, U,
    update(t, camera, height) { U.uTime.value = t; U.uPx.value = (height ?? 1080) / (2 * Math.tan((camera?.fov ?? 40) * Math.PI / 360)); },
    light(i, pos, dir, cosCone, rangeM, color = [1, 0.85, 0.6]) { U.uL.value[i].set(pos[0], pos[1], pos[2], rangeM); const d = new THREE.Vector3(...dir).normalize(); U.uD.value[i].set(d.x, d.y, d.z, cosCone); U.uLC.value[i].set(...color); },
    off(i) { U.uL.value[i].w = 0; },
  };
}

// ---------------------------------------------------------------- small 3D helpers
export function std(color, { rough = 0.7, metal = 0, emissive = 0x000000, ei = 1, map = null, side = THREE.FrontSide } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: ei, map, side });
}
export function boxM(w, h, d, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }
export function cylM(r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
// canvas texture, sRGB
export function ctex(c, { mip = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; } if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
// procedural grime / noise canvas (value noise octaves), deterministic
export function noiseCanvas(w, h, seed = 1, { scale = 32, oct = 4, lo = 0, hi = 255, tint = [1, 1, 1] } = {}) {
  const c = canvas(w, h), id = c.g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0, a = 0.5, f = 1 / scale, tot = 0;
    for (let o = 0; o < oct; o++) { const X = x * f, Y = y * f, ix = Math.floor(X), iy = Math.floor(Y), fx = X - ix, fy = Y - iy, u = fx * fx * (3 - 2 * fx), q = fy * fy * (3 - 2 * fy);
      const n = lerp(lerp(hash(ix, iy, seed, o), hash(ix + 1, iy, seed, o), u), lerp(hash(ix, iy + 1, seed, o), hash(ix + 1, iy + 1, seed, o), u), q); v += n * a; tot += a; a *= 0.5; f *= 2; }
    v = lo + (hi - lo) * v / tot; const i = (y * w + x) * 4; id.data[i] = v * tint[0]; id.data[i + 1] = v * tint[1]; id.data[i + 2] = v * tint[2]; id.data[i + 3] = 255;
  }
  c.g.putImageData(id, 0, 0); return c;
}
// a camera "hold": an almost-still locked-off frame that breathes (sub-percent float), deterministic
export function breathe(camera, t, base, look, { amp = 0.004, seed = 1 } = {}) {
  camera.position.set(base[0] + amp * Math.sin(t * 0.31 + seed), base[1] + amp * 0.7 * Math.sin(t * 0.23 + seed * 2), base[2] + amp * 0.5 * Math.sin(t * 0.19 + seed * 3));
  camera.lookAt(...look);
}
export const mmFov = (mm, aspect = 16 / 9) => 2 * Math.atan(36 / aspect / 2 / mm) * 180 / Math.PI; // full-frame 36 mm wide, 16:9
