// Deterministic compositor transitions for a project's 2D comp canvas (see projects/palantir/scene.js).
//
//   import * as TR from '/engine/transitions.js';
//   const fx = TR.create({ width, height });            // scratch canvases + noise caches, once per runtime
//   // per frame, inside a transition of length TR.meta[name].dur seconds:
//   fx.render(cx, name, A, B, e, opts);                  // A = outgoing frame, B = incoming frame, e = 0..1 linear
//
// A and B are any CanvasImageSource the size of the frame (a frozen copy of the last outgoing comp
// frame, and the live GL canvas). `e` is linear progress; each transition applies its own easing.
// Every transition is a pure function of (A, B, e, opts): no state between frames, noise is seeded.
// Guarantees (checked by projects/fx-lab/bench.mjs at 1080p):
//   * e <= 0 draws exactly A, e >= 1 exactly B, and the picture is continuous in e (no pops);
//   * alpha coverage is exact: every pixel is a convex mix of A and B (running-average taps, masks
//     composited over an opaque base), so two identical flat frames stay flat through any transition
//     whose meta.kind is 'cover' or 'geo'. 'light' transitions add light or colour on purpose
//     (flash, leak, burn, dips) and 'shade' ones add shadow, dimming, paper or ink; both return to exactly B;
//   * cost < 40 ms per 1080p frame on CPU (software canvas); measured costs: docs/motion/README.md.
// Make the destination comp canvas with getContext('2d', { willReadFrequently: true }): on this CPU
// renderer a software canvas is 3-10x faster for these draws than the GPU-emulated default.
//
// opts common to most: dir (+1 / -1), at: [u, v] normalised anchor (centre of an iris, zoom, burn),
// seed (noise variant), color, amount (0..1 strength scale).
import { E, clamp, lerp, smoothstep, hash, rng } from '/engine/motion.js';

const bell = (e) => Math.sin(Math.PI * clamp(e));
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- metadata
// dur: default seconds; kind: 'cover' (pure mix of A and B), 'geo' (moves/warps A and B, still exact
// coverage), 'shade' (geometric, plus shadows, dimming, paper or ink for depth), 'light' (adds light or
// colour on purpose: flashes, dips, leaks, burns); sfx: matching engine/sfx.py preset(s), with the
// offset of the sound's anchor (its peak) relative to the transition start, as a fraction of dur.
export const meta = {
  'cut':            { dur: 0,    kind: 'cover', sfx: [['impact.soft', 0]], use: 'Default. Cut on a sound; on the word.' },
  'dissolve':       { dur: 0.45, kind: 'cover', sfx: [], use: 'Time passing, into/out of type, archive photos.' },
  'match-dissolve': { dur: 0.9,  kind: 'cover', sfx: [['swell.reverse', 0.5]], use: 'Two shapes become one: anchors converge while dissolving.' },
  'match-cut':      { dur: 0.5,  kind: 'geo',   sfx: [['impact.soft', 0.5]], use: 'Graphic match: anchors converge, hard cut at the midpoint.' },
  'dip-black':      { dur: 0.8,  kind: 'light', sfx: [['sub.drop', 0.5]], use: 'End of a movement; a breath before a new idea.' },
  'dip-red':        { dur: 0.6,  kind: 'light', sfx: [['impact.boom', 0.5]], use: 'Violence, alarm, a red-letter fact. Rare.' },
  'flash':          { dur: 0.22, kind: 'light', sfx: [['shutter', 0.5], ['impact.soft', 0.5]], use: 'Hard tonal shift; a photograph being taken; memory.' },
  'whip':           { dur: 0.42, kind: 'geo',   sfx: [['whoosh.m', 0.5]], use: 'Parallel action, simultaneous places (sideways in space).' },
  'slide':          { dur: 0.6,  kind: 'geo',   sfx: [['whoosh.s', 0.5]], use: 'Next item in a series (documents, photos on a table).' },
  'push':           { dur: 0.42, kind: 'geo',   sfx: [['whoosh.s', 0.5]], use: 'Going deeper into the same subject (Vox tracking transition).' },
  'pull-back':      { dur: 0.5,  kind: 'geo',   sfx: [['whoosh.s', 0.5], ['swell.reverse', 0.5]], use: 'Zooming out to context: the bigger picture.' },
  'zoom-through':   { dur: 0.55, kind: 'geo',   sfx: [['whoosh.l', 0.5]], use: 'Fly through a point (a window, a pupil, a dot on a map).' },
  'radial-zoom':    { dur: 0.36, kind: 'geo',   sfx: [['whoosh.xs', 0.5]], use: 'Energy cut between two centred subjects.' },
  'lens-blur':      { dur: 0.7,  kind: 'cover', sfx: [['swell.reverse', 0.5]], use: 'Dreamy dissolve; into memory or a quote.' },
  'focus-pull':     { dur: 0.9,  kind: 'cover', sfx: [['room.tone', 0]], use: 'Attention moves: rack from one picture to the next.' },
  'iris':           { dur: 0.6,  kind: 'cover', sfx: [['whoosh.s', 0.6]], use: 'Reveal from a point of interest (a face, a pin).' },
  'iris-black':     { dur: 1.0,  kind: 'light', sfx: [['shutter', 0.5]], use: 'Silent-film iris out and in on a point. Period pieces.' },
  'aperture':       { dur: 0.7,  kind: 'light', sfx: [['shutter', 0.48]], use: 'Camera blades close and open: surveillance, photography.' },
  'shape-circle':   { dur: 0.7,  kind: 'shade',   sfx: [['whoosh.s', 0.5]], use: 'Soft modern reveal from an anchor; B settles inside.' },
  'shape-box':      { dur: 0.7,  kind: 'shade',   sfx: [['ui.tick', 0], ['whoosh.s', 0.4]], use: 'A photo/frame expands to become the next shot.' },
  'linear-wipe':    { dur: 0.6,  kind: 'cover', sfx: [['whoosh.xs', 0.5]], use: 'Clean soft-edged wipe at any angle.' },
  'luma-wipe':      { dur: 0.9,  kind: 'cover', sfx: [['swell.reverse', 0.6]], use: 'Lights come up first: B grows out of the highlights of A.' },
  'light-leak':     { dur: 0.9,  kind: 'light', sfx: [['swell.reverse', 0.5], ['film.flutter', 0.3]], use: 'Warm film-camera leak over a dissolve. Memory, archive.' },
  'film-burn':      { dur: 1.1,  kind: 'light', sfx: [['film.burn', 0], ['impact.soft', 0.45]], use: 'End-of-reel burn eats A, B grows out of it. Archive, 1960s.' },
  'ink-bleed':      { dur: 1.2,  kind: 'shade', sfx: [['paper.rustle', 0.1], ['swell.reverse', 0.6]], use: 'Ink blooms through paper into B. Documents, maps, history.' },
  'paper-tear':     { dur: 0.75, kind: 'shade',   sfx: [['paper.tear', 0.15]], use: 'A document/photo is torn away to reveal B.' },
  'glitch':         { dur: 0.3,  kind: 'geo',   sfx: [['glitch.zap', 0.5]], use: 'Digital, surveillance, hacked feed. Few frames only.' },
  'scanline':       { dur: 0.6,  kind: 'light', sfx: [['ui.scan', 0]], use: 'A feed refreshes top to bottom: CCTV, screens, data.' },
  'pixel-sort':     { dur: 0.7,  kind: 'geo',   sfx: [['glitch.zap', 0.45], ['swell.reverse', 0.5]], use: 'Data corruption, a datamosh-like smear. Subtle.' },
  'split-slide':    { dur: 0.75, kind: 'geo',   sfx: [['whoosh.xs', 0.3], ['whoosh.xs', 0.55]], use: 'Editorial panel change; lists, comparisons.' },
  'grid-reveal':    { dur: 0.9,  kind: 'cover', sfx: [['ui.ticks', 0.1]], use: 'B assembles tile by tile: databases, surveillance walls.' },
  'mosaic-shatter': { dur: 0.9,  kind: 'shade',   sfx: [['glass.shatter', 0.15]], use: 'A breaks into tiles that fall away. A world comes apart.' },
  'parallax-slide': { dur: 0.7,  kind: 'shade',   sfx: [['whoosh.s', 0.45]], use: 'B covers A, A recedes slower and darker (depth).' },
  'page-turn':      { dur: 1.0,  kind: 'shade',   sfx: [['paper.page', 0.2]], use: 'Turning a page of a dossier, a book, a chapter.' },
  'redact-wipe':    { dur: 0.9,  kind: 'light', sfx: [['marker.swipe', 0.15], ['marker.swipe', 0.6]], use: 'Black redaction bars sweep A away and lift off B.' },
  'pass-through':   { dur: 0.6,  kind: 'shade',   sfx: [['whoosh.m', 0.5]], use: 'A dark foreground pillar wipes the lens: seamless move to B.' },
};
export const names = Object.keys(meta);
// Suggested DOM overlay opacities for the outgoing and incoming shot's type layer.
export function layerMix(name, e) {
  const k = meta[name]?.kind;
  if (name === 'cut' || name === 'match-cut' || name === 'glitch') return { out: e < 0.5 ? 1 : 0, in: e < 0.5 ? 0 : 1 };
  if (k === 'light' && /dip|iris-black|aperture|redact|flash/.test(name)) return { out: 1 - smoothstep(0, 0.45, e), in: smoothstep(0.55, 1, e) };
  return { out: 1 - smoothstep(0.2, 0.6, e), in: smoothstep(0.4, 0.85, e) };
}

// ---------------------------------------------------------------- anchors (graphic match cuts)
// a, b: { x, y, s } an object's screen position (px) and size (px) in the outgoing and incoming frame.
// Returns the transforms that make the two anchors coincide at progress u: A goes from identity to
// "a lands on b", B from "b sits on a" to identity. Each is { s, x, y } meaning: scale by s about the
// frame origin, then translate by (x, y): screen = p * s + (x, y).
export function matchAnchors(a, b, u, { maxZoom = 3 } = {}) {
  const r = clamp(b.s / a.s, 1 / maxZoom, maxZoom), px = lerp(a.x, b.x, u), py = lerp(a.y, b.y, u);
  const sA = Math.pow(r, u), sB = Math.pow(1 / r, 1 - u);
  return { A: { s: sA, x: px - a.x * sA, y: py - a.y * sA }, B: { s: sB, x: px - b.x * sB, y: py - b.y * sB } };
}
// Framing helper for scenes: the scale/offset that puts point a (px) at point b with size ratio.
export const alignTransform = (a, b) => matchAnchors(a, b, 1).A;

// Speed ramp (time remap) for a shot that ramps into a whip or out of a cut: content time for shot
// time t, where speed rises smoothly from 1 to `peak` and back over [at, at + dur] (raised cosine,
// closed-form integral, so the remap is C1 and deterministic). Use rampIn/Out windows that end on the cut.
export function speedRamp(t, { at = 0, dur = 0.5, peak = 3 } = {}) {
  if (t <= at) return t;
  const d = Math.min(t - at, dur), extra = (peak - 1) * 0.5 * (d - dur / TAU * Math.sin(TAU * d / dur));
  return t + extra;
}

// ---------------------------------------------------------------- noise (seeded, cached)
function valueNoise(w, h, seed, { octaves = 5, base = 6, aspect = true } = {}) {
  const out = new Float32Array(w * h), r = rng(seed);
  let amp = 1, norm = 0, f = base;
  for (let o = 0; o < octaves; o++) {
    const gw = Math.ceil(f * (aspect ? w / h : 1)) + 2, gh = Math.ceil(f) + 2, g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = r();
    const sx = (gw - 2) / w, sy = (gh - 2) / h;
    for (let y = 0; y < h; y++) { const fy = y * sy, iy = fy | 0, ty = fy - iy, uy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < w; x++) { const fx = x * sx, ix = fx | 0, tx = fx - ix, ux = tx * tx * (3 - 2 * tx), k = iy * gw + ix;
        const a = g[k] + (g[k + 1] - g[k]) * ux, b = g[k + gw] + (g[k + gw + 1] - g[k + gw]) * ux;
        out[y * w + x] += (a + (b - a) * uy) * amp; } }
    norm += amp; amp *= 0.5; f *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

// ---------------------------------------------------------------- compositor
export function create({ width: W = 1920, height: H = 1080, quality = 1 } = {}) {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); c.x = c.getContext('2d', { willReadFrequently: true }); return c; };
  const S = W / 1920; // pixel constants below are authored at 1080p and scale with the frame
  const LO = 0.5 * quality, MQ = 0.25; // half-res for blur work and crisp procedural masks, quarter-res for heavy blur and soft masks
  const t1 = mk(W, H), t2 = mk(W, H);
  const lo1 = mk(W * LO, H * LO), lo2 = mk(W * LO, H * LO), lo3 = mk(W * LO, H * LO), lo4 = mk(W * LO, H * LO);
  const q1 = mk(W * MQ, H * MQ), q2 = mk(W * MQ, H * MQ), q3 = mk(W * MQ, H * MQ), q4 = mk(W * MQ, H * MQ);
  const lw = lo1.width, lh = lo1.height, mw = q1.width, mh = q1.height;
  const cache = new Map(); // deterministic per-key caches (noise fields, distance fields)
  const memo = (key, f) => { if (!cache.has(key)) cache.set(key, f()); return cache.get(key); };
  const noise = (seed, w, h, o) => memo(`n|${seed}|${w}|${h}|${JSON.stringify(o ?? {})}`, () => valueNoise(w, h, seed, o));
  const ids = new Map(); const id = (c) => { if (!ids.has(c)) ids.set(c, c.x.createImageData(c.width, c.height)); return ids.get(c); };
  const reset = (x) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; };
  const P = (o, W0 = W, H0 = H) => { const a = o.at ?? [0.5, 0.5]; return [a[0] * W0, a[1] * H0]; };

  // draw a full frame `img` into x (size w x h): scale s about (cx, cy), then offset (dx, dy), rotation r
  function put(x, img, { a = 1, s = 1, dx = 0, dy = 0, r = 0, cx, cy, w = W, h = H, op = 'source-over' } = {}) {
    if (a <= 0) return;
    x.globalAlpha = Math.min(1, a); x.globalCompositeOperation = op;
    cx ??= w / 2; cy ??= h / 2;
    if (s === 1 && r === 0) x.drawImage(img, dx, dy, w, h);
    else { x.setTransform(1, 0, 0, 1, 0, 0); x.translate(cx + dx, cy + dy); if (r) x.rotate(r); x.scale(s, s); x.drawImage(img, -cx, -cy, w, h); x.setTransform(1, 0, 0, 1, 0, 0); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  // affine { s, x, y } from matchAnchors (screen = p*s + (x, y)), drawn at canvas scale k
  function putAff(x, img, T, { a = 1, k = 1 } = {}) { if (a <= 0) return; x.globalAlpha = Math.min(1, a); x.setTransform(T.s, 0, 0, T.s, T.x * k, T.y * k); x.drawImage(img, 0, 0, W * k, H * k); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; }
  function fill(x, color, a = 1, op = 'source-over', w = W, h = H) { if (a <= 0) return; x.globalAlpha = Math.min(1, a); x.globalCompositeOperation = op; x.fillStyle = color; x.fillRect(0, 0, w, h); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  const up = (x, c, { a = 1, op = 'source-over' } = {}) => { if (a <= 0) return; x.globalAlpha = Math.min(1, a); x.globalCompositeOperation = op; x.drawImage(c, 0, 0, c.width, c.height, 0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; };
  const copyTo = (dst, src) => { reset(dst.x); dst.x.globalCompositeOperation = 'copy'; dst.x.drawImage(src, 0, 0); dst.x.globalCompositeOperation = 'source-over'; };

  // Paint a scene into a low-res canvas: paint(ctx, k) draws at scale k (k = canvas width / W).
  function paintLo(c, paint) { reset(c.x); c.x.clearRect(0, 0, c.width, c.height); paint(c.x, c.width / W); return c; }
  // The blur canvases for a blur of `px` full-res pixels: half-res for short blurs, quarter-res for long ones.
  const blurSet = (px) => (px > 24 ? [q1, q2, q3] : [lo1, lo2, lo3]);
  // Directional motion blur (box filter of length (dx, dy) full-res px) of `src` into dst, as a two-pass
  // cascade of running-average taps (a comb of n1 taps, then a box of the comb spacing): ~2*sqrt(L)
  // draws instead of L, no stepping, exact average (stays opaque wherever src was).
  function dirBlur(dst, tmp, src, dx, dy) {
    const k = src.width / W, L = Math.hypot(dx, dy) * k;
    if (L < 1) { copyTo(dst, src); return dst; }
    const n1 = Math.max(1, Math.round(Math.sqrt(L))), sp = L / n1, n2 = Math.max(2, Math.ceil(sp / 0.9));
    const pass = (out, inp, n, span) => { copyTo(out, inp); const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
      for (let i = 0; i < n; i++) { const f = n > 1 ? (i / (n - 1) - 0.5) * span : 0; out.x.globalAlpha = 1 / (i + 1); out.x.drawImage(inp, f * ux, f * uy); } out.x.globalAlpha = 1; };
    if (n1 > 1) { pass(tmp, src, n1, sp * (n1 - 1)); pass(dst, tmp, n2, sp); } else pass(dst, src, n2, L);
    return dst;
  }
  // Radial (zoom) blur about (cx, cy) full-res: scales spread geometrically over [1, 1 + amt], two-pass cascade.
  // Each pass is prefilled with its largest tap, so scaled-down content still covers the frame.
  function radialBlur(dst, tmp, src, amt, cx, cy) {
    const k = src.width / W, X = cx * k, Y = cy * k, w = src.width, h = src.height;
    const S = 1 + Math.max(0, amt), Lpx = amt * Math.hypot(Math.max(X, w - X), Math.max(Y, h - Y));
    const pass = (out, inp, n, top) => { reset(out.x); const tap = (s, a) => { out.x.globalAlpha = a; out.x.drawImage(inp, X - X * s, Y - Y * s, w * s, h * s); };
      out.x.globalCompositeOperation = 'copy'; tap(top, 1); out.x.globalCompositeOperation = 'source-over';
      for (let i = 0; i < n; i++) tap(Math.pow(top, n > 1 ? i / (n - 1) : 0), 1 / (i + 1)); out.x.globalAlpha = 1; };
    if (Lpx < 1) { copyTo(dst, src); return dst; }
    const n1 = Math.max(1, Math.round(Math.sqrt(Lpx))), n2 = Math.max(2, Math.ceil(Lpx / n1 / 0.9));
    if (n1 > 1) { const step = Math.pow(S, 1 / n1); pass(tmp, src, n1, Math.pow(S, (n1 - 1) / n1)); pass(dst, tmp, n2, step); } else pass(dst, src, n2, S);
    return dst;
  }
  // Defocus: Gaussian at r/3 then a 10-tap ring at ~0.8 r (a disc-like kernel, closer to a lens than a pure Gaussian).
  function defocus(dst, tmp, src, r) {
    const k = src.width / W, R = r * k;
    copyTo(tmp, src);
    if (R > 0.4) { tmp.x.filter = `blur(${(R / 3).toFixed(2)}px)`; tmp.x.drawImage(src, 0, 0); tmp.x.filter = 'none'; }
    copyTo(dst, tmp);
    if (R > 1) { const n = 10; for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.3; dst.x.globalAlpha = 1 / (i + 2); dst.x.drawImage(tmp, Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); } }
    dst.x.globalAlpha = 1; return dst;
  }
  // Composite B (optionally transformed) over x through a mask canvas `m` (alpha = coverage of B), upscaled.
  function maskOver(x, B, m, { s = 1, cx, cy, a = 1 } = {}) {
    reset(t1.x); t1.x.globalCompositeOperation = 'copy'; put(t1.x, B, { s, cx, cy, op: 'copy' });
    t1.x.globalCompositeOperation = 'destination-in'; t1.x.drawImage(m, 0, 0, m.width, m.height, 0, 0, W, H); reset(t1.x);
    x.globalAlpha = a; x.drawImage(t1, 0, 0); x.globalAlpha = 1;
  }
  // A sharp full-res layer blended over a blurred low-res version by weight w in [0, 1].
  function sharpOver(x, blurCanvas, w, paintSharp) {
    if (w > 0.001) up(x, blurCanvas);
    if (w < 0.999) { if (w <= 0.001) { paintSharp(x); return; } reset(t2.x); t2.x.clearRect(0, 0, W, H); paintSharp(t2.x); x.globalAlpha = 1 - w; x.drawImage(t2, 0, 0); x.globalAlpha = 1; }
  }
  // Draw `img` scaled by s about cc with alpha a into ctx at canvas scale `sc`. A scale below 1 is
  // underfilled with the same image at scale 1 (composited in `scratch` first, so alpha stays exact).
  function lay(ctx, img, s, cc, a, sc, scratch) {
    if (a <= 0) return;
    const o = { cx: cc[0] * sc, cy: cc[1] * sc, w: W * sc, h: H * sc };
    if (s >= 1) { put(ctx, img, { ...o, a, s }); return; }
    if (a >= 1) { put(ctx, img, { ...o }); put(ctx, img, { ...o, s }); return; }
    reset(scratch.x); put(scratch.x, img, { ...o, op: 'copy' }); put(scratch.x, img, { ...o, s });
    ctx.globalAlpha = a; ctx.drawImage(scratch, 0, 0, scratch.width, scratch.height, 0, 0, W * sc, H * sc); ctx.globalAlpha = 1;
  }
  // Two images at scales about a centre, mixed by k, with a radial blur of `amt`: push, pull, zooms.
  function zoomCross(x, A, B, { sA, sB, k, amt, c, cB = c }) {
    const blurPx = amt * Math.hypot(W, H) / 2, w = smoothstep(2, 14, blurPx);
    let lo = null;
    if (w > 0.001) { const [c1, c2, c3] = blurSet(blurPx), c4 = c1 === q1 ? q4 : lo4;
      paintLo(c1, (lx, sc) => { if (k < 1) lay(lx, A, sA, c, 1, sc, c4); lay(lx, B, sB, cB, k, sc, c4); });
      lo = radialBlur(c2, c3, c1, amt, c[0], c[1]); }
    sharpOver(x, lo, w, (sx) => { if (k < 1) lay(sx, A, sA, c, 1, 1, t1); lay(sx, B, sB, cB, k, 1, t1); });
  }

  // ------------------------------------------------------------ the transitions
  const T = {};
  T['cut'] = (x, A, B, e) => put(x, e < 0.5 ? A : B);
  T['dissolve'] = (x, A, B, e) => { put(x, A); put(x, B, { a: E.inOutSine(e) }); };
  // Anchors converge (see matchAnchors) under a common zoom z = R^(sin(pi u)/2), R = max(r, 1/r), which
  // keeps whichever image is shrinking covering the frame where it is visible: the image that only
  // grows is the opaque base, the other dissolves in or out inside its covered window.
  const coverNeed = (T, p) => { // extra zoom about p so that transform T covers the whole frame
    let z = 1; const ex = [[T.x, W * T.s, p[0], W], [T.y, H * T.s, p[1], H]];
    for (const [o, size, q, full] of ex) { if (o > 0 && q > o) z = Math.max(z, q / (q - o)); const far = o + size; if (far < full && far > q) z = Math.max(z, (full - q) / (far - q)); }
    return z; };
  const matchZ = (a, b, u, o, wA, wB) => { const r = clamp(b.s / a.s, 1 / (o.maxZoom ?? 3), o.maxZoom ?? 3); const z0 = Math.pow(Math.max(r, 1 / r), 0.5 * Math.sin(Math.PI * u));
    const M = matchAnchors(a, b, u, o), p = [lerp(a.x, b.x, u), lerp(a.y, b.y, u)];
    const zz = (T, z) => ({ s: T.s * z, x: p[0] + (T.x - p[0]) * z, y: p[1] + (T.y - p[1]) * z });
    const A0 = zz(M.A, z0), B0 = zz(M.B, z0);
    // a further zoom about the shared anchor keeps every visible image covering the frame (weights fade the
    // requirement in and out with visibility, so the zoom stays continuous and is exactly 1 at both ends)
    const z1 = Math.max(lerp(1, coverNeed(A0, p), wA), lerp(1, coverNeed(B0, p), wB));
    return { r, A: zz(A0, z1), B: zz(B0, z1) }; };
  T['match-dissolve'] = (x, A, B, e, o) => {
    const a = o.a ?? { x: W / 2, y: H / 2, s: 200 }, b = o.b ?? a, u = E.inOutCubic(e), up_ = b.s >= a.s;
    const M = matchZ(a, b, u, o, up_ ? 1 - smoothstep(0.85, 1, u) : 1 - smoothstep(0.5, 0.6, u), up_ ? smoothstep(0.4, 0.5, u) : smoothstep(0, 0.15, u));
    if (M.r >= 1) { putAff(x, A, M.A); putAff(x, B, M.B, { a: smoothstep(0.5, 0.85, u) }); }
    else { putAff(x, B, M.B); putAff(x, A, M.A, { a: 1 - smoothstep(0.15, 0.5, u) }); }
  };
  T['match-cut'] = (x, A, B, e, o) => {
    const a = o.a ?? { x: W / 2, y: H / 2, s: 200 }, b = o.b ?? a, u = E.inOutCubic(e), M = matchZ(a, b, u, o, 1 - smoothstep(0.5, 0.9, u), smoothstep(0.1, 0.5, u));
    if (e < 0.5) putAff(x, A, M.A); else putAff(x, B, M.B);
    if (o.flash) fill(x, '#fff7ec', Math.pow(clamp(1 - Math.abs(e - 0.5) * 6), 2) * 0.5, 'screen');
  };
  const dip = (x, A, B, e, o, color) => {
    const h = o.hold ?? 0.12, e1 = clamp(e / ((1 - h) / 2)), e2 = clamp((e - (1 + h) / 2) / ((1 - h) / 2));
    if (e < 0.5) { put(x, A); fill(x, color, E.inOutSine(e1)); } else { put(x, B); fill(x, color, 1 - E.inOutSine(e2)); }
  };
  T['dip-black'] = (x, A, B, e, o) => dip(x, A, B, e, o, o.color ?? '#000');
  T['dip-red'] = (x, A, B, e, o) => {
    const c = o.color ?? '#e0241b', h = o.hold ?? 0.06, e1 = clamp(e / ((1 - h) / 2)), e2 = clamp((e - (1 + h) / 2) / ((1 - h) / 2));
    const k = e < 0.5 ? E.inOutSine(e1) : 1 - E.inOutSine(e2);
    put(x, e < 0.5 ? A : B);
    // tint first (the picture goes red through its own tones), then flood to the solid colour
    reset(x); x.globalAlpha = smoothstep(0, 0.6, k); x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'screen'; x.globalAlpha = smoothstep(0, 0.7, k) * 0.35; x.fillRect(0, 0, W, H); reset(x);
    fill(x, c, Math.pow(smoothstep(0.35, 1, k), 1.5));
  };
  T['flash'] = (x, A, B, e, o) => {
    const c = o.color ?? '#fff7ec', f = e < 0.5 ? Math.pow(e / 0.5, 2.2) : Math.pow(1 - (e - 0.5) / 0.5, 2.6);
    put(x, e < 0.5 ? A : B); fill(x, c, Math.min(1, f * 1.4), 'screen'); fill(x, c, f * f);
  };
  // whip and slide: A leaves, B arrives along an axis; blur follows velocity
  const slideBlur = (x, A, B, e, o, ease, blurMax) => {
    const dir = o.dir ?? 1, vert = o.axis === 'y', D = vert ? H : W;
    const u = ease(e), du = (ease(Math.min(1, e + 0.01)) - ease(Math.max(0, e - 0.01))) / (Math.min(1, e + 0.01) - Math.max(0, e - 0.01));
    const vmax = o._vmax ?? 1, L = blurMax * D * clamp(du / vmax) * (o.amount ?? 1);
    const pa = -dir * D * u, pb = dir * D * (1 - u);
    const at = (p) => (vert ? { dy: p } : { dx: p });
    const w = smoothstep(3, 18, L);
    const lo = w > 0.001 ? (() => { const [c1, c2, c3] = blurSet(L);
      paintLo(c1, (lx, s) => { put(lx, A, { ...(vert ? { dy: pa * s } : { dx: pa * s }), w: W * s, h: H * s }); put(lx, B, { ...(vert ? { dy: pb * s } : { dx: pb * s }), w: W * s, h: H * s }); });
      return dirBlur(c2, c3, c1, vert ? 0 : L, vert ? L : 0); })() : null;
    sharpOver(x, lo, w, (sx) => { put(sx, A, at(Math.round(pa))); put(sx, B, at(Math.round(pb))); });
  };
  const whipEase = (e) => E.inOutCubic(e) * 0.5 + E.inOutQuint(e) * 0.5;
  T['whip'] = (x, A, B, e, o) => slideBlur(x, A, B, e, { ...o, _vmax: 3.4 }, whipEase, 0.32);
  T['slide'] = (x, A, B, e, o) => slideBlur(x, A, B, e, { ...o, _vmax: 2.6 }, E.inOutQuart, 0.02);
  T['push'] = (x, A, B, e, o) => {
    const c = P(o), am = o.amount ?? 1;
    zoomCross(x, A, B, { c, sA: 1 + 0.55 * am * E.inCubic(clamp(e / 0.6)), sB: 1 - 0.12 * am * (1 - E.outCubic(clamp((e - 0.4) / 0.6))), k: smoothstep(0.38, 0.62, e), amt: 0.16 * am * bell(e) ** 2 });
  };
  T['pull-back'] = (x, A, B, e, o) => {
    const c = P(o), am = o.amount ?? 1;
    zoomCross(x, A, B, { c, sA: 1 - 0.14 * am * E.inCubic(clamp(e / 0.6)), sB: 1 + 0.4 * am * (1 - E.outCubic(clamp((e - 0.4) / 0.6))), k: smoothstep(0.4, 0.6, e), amt: 0.12 * am * bell(e) ** 2 });
  };
  T['zoom-through'] = (x, A, B, e, o) => {
    const c = P(o), cB = o.atB ? [o.atB[0] * W, o.atB[1] * H] : c, am = o.amount ?? 1;
    const sA = Math.pow(1 + 2.2 * am, E.inCubic(clamp(e / 0.55))), sB = 1 - 0.16 * am * (1 - E.outCubic(clamp((e - 0.45) / 0.55)));
    zoomCross(x, A, B, { c, cB, sA, sB, k: smoothstep(0.44, 0.56, e), amt: 0.42 * am * bell(e) ** 3 });
  };
  T['radial-zoom'] = (x, A, B, e, o) => {
    const c = P(o), am = o.amount ?? 1;
    zoomCross(x, A, B, { c, sA: 1 + 0.06 * am * E.inCubic(clamp(e / 0.5)), sB: 1 + 0.06 * am * (1 - E.outCubic(clamp((e - 0.5) / 0.5))), k: smoothstep(0.42, 0.58, e), amt: 0.3 * am * bell(e) ** 3 });
  };
  // blur family: each image defocused on its own (half res for small radii, quarter res for large)
  const blurPair = (x, A, B, e, rA, rB, sA, sB, k) => {
    const lay2 = (dst, img, r, s, a) => {
      if (a <= 0) return;
      const w = smoothstep(1.0, 5, r);
      if (w <= 0.001) { put(dst, img, { s, a }); return; }
      const [c1, c2, c3] = [q1, q2, q3];
      paintLo(c1, (lx, q) => put(lx, img, { s, w: W * q, h: H * q })); defocus(c2, c3, c1, r);
      if (w >= 0.999) { up(dst, c2, { a }); return; }
      reset(t2.x); up(t2.x, c2); put(t2.x, img, { s, a: 1 - w }); dst.globalAlpha = a; dst.drawImage(t2, 0, 0); dst.globalAlpha = 1;
    };
    if (k < 0.999) lay2(x, A, rA, sA, 1); lay2(x, B, rB, sB, k);
  };
  T['lens-blur'] = (x, A, B, e, o) => {
    const R = (o.radius ?? 0.022) * W * (o.amount ?? 1), r = R * Math.pow(bell(e), 1.3), s = 1 + 0.02 * bell(e) ** 2;
    blurPair(x, A, B, e, r, r, s, s, smoothstep(0.3, 0.7, e));
  };
  T['focus-pull'] = (x, A, B, e, o) => {
    const R = (o.radius ?? 0.02) * W * (o.amount ?? 1), a = E.inOutSine(clamp(e / 0.6)), b = 1 - E.inOutSine(clamp((e - 0.4) / 0.6));
    blurPair(x, A, B, e, R * a, R * b, 1 + 0.025 * a, 1 + 0.025 * b, smoothstep(0.35, 0.65, e));
  };
  const maxR = (c) => Math.max(Math.hypot(c[0], c[1]), Math.hypot(W - c[0], c[1]), Math.hypot(c[0], H - c[1]), Math.hypot(W - c[0], H - c[1]));
  // B inside a soft-edged circle (radial gradient used as a destination-in mask: exact coverage)
  const circleOver = (x, B, c, R, f, s = 1) => {
    if (R <= 0.01) return;
    reset(t1.x); t1.x.globalCompositeOperation = 'copy'; put(t1.x, B, { s, cx: c[0], cy: c[1], op: 'copy' }); t1.x.globalCompositeOperation = 'destination-in';
    const g = t1.x.createRadialGradient(c[0], c[1], Math.max(0, R - f), c[0], c[1], R + 0.01); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    t1.x.fillStyle = g; t1.x.fillRect(0, 0, W, H); reset(t1.x); x.drawImage(t1, 0, 0);
  };
  T['iris'] = (x, A, B, e, o) => {
    const c = P(o), f = (o.feather ?? 10) * S, R = (maxR(c) + f) * E.inOutCubic(e);
    put(x, A); circleOver(x, B, c, R, Math.min(f, R));
  };
  T['iris-black'] = (x, A, B, e, o) => {
    const ca = P(o), cb = o.atB ? [o.atB[0] * W, o.atB[1] * H] : ca, h = o.hold ?? 0.1;
    const close = e < 0.5, u = close ? clamp(e / ((1 - h) / 2)) : clamp((e - (1 + h) / 2) / ((1 - h) / 2)), c = close ? ca : cb;
    const R = maxR(c) * (close ? 1 - E.inOutCubic(u) : E.inOutCubic(u));
    fill(x, '#000'); if (R < 0.5) return; x.save(); x.beginPath(); x.arc(c[0], c[1], R, 0, TAU); x.clip(); put(x, close ? A : B); x.restore();
  };
  T['aperture'] = (x, A, B, e, o) => {
    const c = P(o), n = o.blades ?? 7, h = o.hold ?? 0.04, close = e < 0.5;
    const u = close ? clamp(e / ((1 - h) / 2)) : clamp((e - (1 + h) / 2) / ((1 - h) / 2));
    const k = close ? E.inCubic(u) : 1 - E.outCubic(u); // 0 open .. 1 shut
    const R = maxR(c) * 1.25 * (1 - k), rot = k * 0.9 + (close ? 0 : 0.3);
    // blades: dark polygon frame outside an n-gon, with faint seams running tangentially off each vertex
    put(x, close ? A : B);
    if (k <= 0) return;
    const poly = []; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; poly.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]); }
    reset(x); x.beginPath(); x.rect(0, 0, W, H); x.moveTo(...poly[0]); for (let i = n - 1; i >= 0; i--) x.lineTo(...poly[i]); x.closePath();
    const g = x.createRadialGradient(c[0], c[1], R, c[0], c[1], R + Math.max(W, H) * 0.6); g.addColorStop(0, '#1a1a1c'); g.addColorStop(0.15, '#0c0c0d'); g.addColorStop(1, '#050505');
    x.fillStyle = g; x.fill('evenodd');
    x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 1.5 * S; x.beginPath();
    for (let i = 0; i < n; i++) { const [px, py] = poly[i], [qx, qy] = poly[(i + 1) % n], dx = px - qx, dy = py - qy, L = Math.hypot(dx, dy) || 1; x.moveTo(px, py); x.lineTo(px + dx / L * W, py + dy / L * W); }
    x.stroke(); reset(x);
  };
  T['shape-circle'] = (x, A, B, e, o) => {
    const c = P(o), u = E.inOutQuart(e), f = (o.feather ?? 40) * S, R = (maxR(c) + f) * u;
    put(x, A); fill(x, '#000', 0.4 * smoothstep(0, 0.6, e) * (1 - smoothstep(0.75, 1, e)));
    circleOver(x, B, c, R, Math.min(f, R), 1 + 0.08 * (1 - E.outCubic(e)));
  };
  T['shape-box'] = (x, A, B, e, o) => {
    const r0 = o.rect ?? [0.36, 0.33, 0.28, 0.34], u = E.emphasized(e);
    const bx = lerp(r0[0] * W, -1, u), by = lerp(r0[1] * H, -1, u), bw = lerp(r0[2] * W, W + 2, u), bh = lerp(r0[3] * H, H + 2, u), rad = lerp(o.radius ?? 6, 0, u);
    put(x, A); fill(x, '#000', 0.35 * smoothstep(0, 0.5, e) * (1 - smoothstep(0.7, 1, e)));
    // B starts framed inside the box (scaled down, faded in over the first fifth unless A already shows that frame)
    const s0 = Math.max(r0[2], r0[3]) * 1.15, s = lerp(s0, 1, u), cx = lerp((r0[0] + r0[2] / 2) * W, W / 2, u), cy = lerp((r0[1] + r0[3] / 2) * H, H / 2, u);
    reset(x); x.save(); x.beginPath(); x.roundRect(bx, by, bw, bh, rad); x.clip(); x.globalAlpha = o.inFrame ? 1 : smoothstep(0, 0.2, e);
    x.translate(cx, cy); x.scale(s, s); x.drawImage(B, -W / 2, -H / 2, W, H); x.restore(); reset(x);
  };
  T['linear-wipe'] = (x, A, B, e, o) => {
    const ang = (o.angle ?? 0) * Math.PI / 180, dx = Math.cos(ang), dy = Math.sin(ang), f = (o.feather ?? 0.12) * W;
    const half = (Math.abs(dx) * W + Math.abs(dy) * H) / 2, pos = lerp(-half - f, half + f, E.inOutCubic(e)) ;
    put(x, A);
    reset(t1.x); t1.x.globalCompositeOperation = 'copy'; t1.x.drawImage(B, 0, 0, W, H); t1.x.globalCompositeOperation = 'destination-in';
    const cx = W / 2 + dx * pos, cy = H / 2 + dy * pos, g = t1.x.createLinearGradient(cx - dx * f / 2, cy - dy * f / 2, cx + dx * f / 2, cy + dy * f / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); t1.x.fillStyle = g; t1.x.fillRect(0, 0, W, H); reset(t1.x);
    x.drawImage(t1, 0, 0);
  };
  T['luma-wipe'] = (x, A, B, e, o) => {
    const src = o.source === 'B' ? B : A, sft = o.soft ?? 0.12, inv = !!o.invert;
    reset(q2.x); q2.x.globalCompositeOperation = 'copy'; q2.x.filter = 'blur(1.5px)'; q2.x.drawImage(src, 0, 0, mw, mh); reset(q2.x);
    const L = q2.x.getImageData(0, 0, mw, mh).data, th = lerp(1 + sft, -sft, E.inOutSine(e)), md = id(q1), m = md.data;
    for (let i = 0; i < m.length; i += 4) { let l = (0.2126 * L[i] + 0.7152 * L[i + 1] + 0.0722 * L[i + 2]) / 255; if (inv) l = 1 - l; const k = clamp((l - th + sft) / (2 * sft)); m[i + 3] = 255 * k * k * (3 - 2 * k); }
    q1.x.putImageData(md, 0, 0);
    put(x, A); maskOver(x, B, q1);
  };
  T['light-leak'] = (x, A, B, e, o) => {
    const r = rng(hash('leak', o.seed ?? 1)), I = Math.pow(bell(e), 1.6) * (o.amount ?? 0.6), k = smoothstep(0.3, 0.7, e);
    put(x, A); put(x, B, { a: E.inOutSine(k) });
    if (I <= 0.002) return;
    reset(q1.x); q1.x.fillStyle = '#000'; q1.x.fillRect(0, 0, mw, mh); q1.x.globalCompositeOperation = 'lighter';
    const cols = o.colors ?? [[255, 120, 40], [255, 150, 70], [230, 60, 20], [255, 190, 120]];
    const side = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      const sx = r(), sy = r(), drift = (e - 0.5) * (0.6 + r() * 0.5) * side;
      const cx = (side < 0 ? 0.05 + sx * 0.3 : 0.65 + sx * 0.3) * mw + drift * mw, cy = (0.1 + sy * 0.8) * mh, rad = (0.3 + r() * 0.35) * mw;
      const c = cols[i % cols.length], a = (0.45 + r() * 0.3) * I;
      const g = q1.x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(0.5, `rgba(${c},${a * 0.35})`); g.addColorStop(1, `rgba(${c},0)`);
      q1.x.fillStyle = g; q1.x.fillRect(0, 0, mw, mh);
    }
    // a soft band from the gate edge, as on a real leaked roll
    const bx = (side < 0 ? 0.06 : 0.94) * mw + (e - 0.5) * 0.3 * mw * -side, gb = q1.x.createLinearGradient(bx - mw * 0.16, 0, bx + mw * 0.16, 0);
    gb.addColorStop(0, 'rgba(255,100,40,0)'); gb.addColorStop(0.5, `rgba(255,140,70,${0.55 * I})`); gb.addColorStop(1, 'rgba(255,100,40,0)'); q1.x.fillStyle = gb; q1.x.fillRect(0, 0, mw, mh);
    reset(q1.x); up(x, q1, { op: 'screen' });
  };
  // distance-from-origin + noise field for burns and ink (static per seed: cached)
  T['film-burn'] = (x, A, B, e, o) => {
    const seed = o.seed ?? 3, r = rng(hash('burn', seed)), c = o.at ? P(o, mw, mh) : [(r() < 0.5 ? 0.12 : 0.88) * mw, (0.3 + r() * 0.4) * mh];
    const F = memo(`burn|${seed}|${c}`, () => { const N = noise(seed, mw, mh, { octaves: 5, base: 5 }), d = Math.hypot(mw, mh), f = new Float32Array(mw * mh);
      for (let Y = 0; Y < mh; Y++) for (let X = 0; X < mw; X++) f[Y * mw + X] = Math.hypot(X - c[0], Y - c[1]) / d * 1.15 + (N[Y * mw + X] - 0.5) * 0.5; return f; });
    const lag = 0.13, th = lerp(-0.3, 1.4 + lag, E.inOutSine(e)), amt = o.amount ?? 1, wash = 0.19 * bell(e) ** 2 * amt;
    put(x, A);
    const md = id(q1), ma = md.data, gd = id(q2), ga = gd.data;
    for (let i = 0, j = 0; i < F.length; i++, j += 4) {
      const d = th - F[i]; // > 0 behind the front
      const m = clamp((d - lag) / 0.035 + 0.5); ma[j + 3] = 255 * m * m * (3 - 2 * m);
      // glow: orange at the front, white-yellow just behind it, gone by the time B shows through
      let al = 0, G = 120, Bc = 40;
      if (d > -0.012 && d < lag + 0.02) { const h = clamp(d / (lag * 0.45)); al = clamp((d + 0.012) / 0.012) * (1 - smoothstep(lag * 0.55, lag + 0.02, d)); G = lerp(95, 225, h); Bc = lerp(25, 150, h * h); }
      al = clamp(al * amt); if (al < wash) { G = 154; Bc = 74; al = wash; } // warm exposure lift around the peak, folded in
      ga[j] = 255; ga[j + 1] = G; ga[j + 2] = Bc; ga[j + 3] = 255 * al;
      // scorch: A browns and darkens just ahead of the front (same layer: glow behind the front, scorch ahead)
      if (d < 0 && d > -0.05 && al <= wash + 1e-6) { const sc = (1 + d / 0.05) ** 2 * 0.75; if (sc > al) { ga[j] = 30; ga[j + 1] = 12; ga[j + 2] = 4; ga[j + 3] = 255 * sc; } }
    }
    q1.x.putImageData(md, 0, 0); q2.x.putImageData(gd, 0, 0);
    reset(q4.x); q4.x.globalCompositeOperation = 'copy'; q4.x.filter = 'blur(1.2px)'; q4.x.drawImage(q2, 0, 0); reset(q4.x);
    maskOver(x, B, q1); up(x, q4, { a: 0.9 });
  };
  T['ink-bleed'] = (x, A, B, e, o) => {
    const seed = o.seed ?? 5, r = rng(hash('ink', seed));
    const drops = o.drops ?? Array.from({ length: 4 }, () => [r() * 0.8 + 0.1, r() * 0.7 + 0.15, 0.55 + r() * 0.7]);
    const F = memo(`ink|${seed}|${JSON.stringify(drops)}`, () => { const N = noise(seed, lw, lh, { octaves: 6, base: 4 }), diag = Math.hypot(lw, lh), f = new Float32Array(lw * lh);
      for (let Y = 0; Y < lh; Y++) for (let X = 0; X < lw; X++) { let m = 9; for (const [u, v, s] of drops) m = Math.min(m, Math.hypot(X - u * lw, Y - v * lh) / diag / s); f[Y * lw + X] = m + (N[Y * lw + X] - 0.5) * 0.2; } return f; });
    const [f0, f1] = memo(`inkr|${seed}|${JSON.stringify(drops)}`, () => { let a = 9, b = -9; for (const v of F) { if (v < a) a = v; if (v > b) b = v; } return [a, b]; });
    const th = lerp(f0 - 0.01, f1 + 0.02, E.inOutSine(e)), rim = 0.012, fade = 1 - smoothstep(0.85, 1, e);
    put(x, A);
    const md = id(lo1), rd = id(lo2), ma = md.data, ra = rd.data;
    if (ra[0] !== 10) for (let j = 0; j < ra.length; j += 4) { ra[j] = 10; ra[j + 1] = 9; ra[j + 2] = 12; }
    for (let i = 0, j = 0; i < F.length; i++, j += 4) {
      const d = th - F[i], m = clamp(d / 0.004 + 0.5);
      ma[j + 3] = 255 * m;
      // ink: a dense rim just inside the front, a pale wet halo just outside it
      if (d > 0.07 || d < -0.03) { ra[j + 3] = 0; continue; }
      const ink = d > 0 ? Math.exp(-d / rim) : 0, halo = d < 0 ? (1 + d / 0.03) * 0.18 : 0;
      ra[j + 3] = 255 * Math.max(ink * 0.9, halo) * fade;
    }
    lo1.x.putImageData(md, 0, 0); lo2.x.putImageData(rd, 0, 0);
    maskOver(x, B, lo1); up(x, lo2);
  };
  T['paper-tear'] = (x, A, B, e, o) => {
    const r = rng(hash('tear', o.seed ?? 2)), pts = [], N = 160, base = (o.y ?? 0.52) * H, slope = (r() - 0.5) * 0.12 * H;
    let wander = 0; for (let i = 0; i <= N; i++) { wander += (r() - 0.5) * 9 * S; wander *= 0.92; pts.push([i / N * (W + 40 * S) - 20 * S, base + slope * (i / N - 0.5) + wander + (Math.sin(i * 0.21 + r()) * 7 + (r() - 0.5) * 6) * S]); }
    const u = E.inOutCubic(e), lift = u * H * 0.8, rot = u * 0.06;
    const half = (c, top) => { c.beginPath(); c.moveTo(-40, top ? -H : 2 * H); c.lineTo(W + 40, top ? -H : 2 * H); for (let i = N; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
    const xf = (c, top, k = 1) => { c.translate(W * 0.5 * k, (top ? 0 : H) * k); c.rotate(top ? -rot : rot * 0.6); c.translate(-W * 0.5 * k, ((top ? -lift : lift) - (top ? 0 : H)) * k); };
    put(x, B);
    // soft shadows of both halves on B
    paintLo(q1, (lx, s) => { lx.fillStyle = 'rgba(0,0,0,0.65)'; lx.filter = `blur(${12 * S * s}px)`;
      for (const top of [true, false]) { lx.save(); xf(lx, top, s); lx.translate(0, 16 * S * s); lx.scale(s, s); half(lx, top); lx.fill(); lx.restore(); } lx.filter = 'none'; });
    up(x, q1, { a: smoothstep(0, 0.12, e) });
    for (const top of [true, false]) {
      reset(x); x.save(); xf(x, top); half(x, top); x.clip(); x.drawImage(A, 0, 0, W, H);
      // the white torn fibre edge along the tear, inside this half
      x.beginPath(); for (let i = 0; i <= N; i++) x.lineTo(pts[i][0], pts[i][1]); for (let i = N; i >= 0; i--) { const w = (2 + 3.5 * Math.abs(Math.sin(i * 0.7 + (top ? 0 : 1.3))) + (i % 7 === 0 ? 3 : 0)) * S; x.lineTo(pts[i][0], pts[i][1] + (top ? -w : w)); }
      x.closePath(); x.fillStyle = '#e8e1d2'; x.globalAlpha = smoothstep(0, 0.05, e); x.fill(); x.globalAlpha = 1; x.restore();
    }
    reset(x);
  };
  T['glitch'] = (x, A, B, e, o) => {
    const rate = o.rate ?? 30, dur = o.dur ?? meta.glitch.dur, step = Math.floor(e * dur * rate), r = rng(hash('glitch', o.seed ?? 1, step));
    const I = smoothstep(0, 0.45, e) * (1 - smoothstep(0.55, 1, e)) * (o.amount ?? 1);
    const flick = I > 0.3 && r() < 0.35, srcMain = (e < 0.5) !== flick ? A : B, other = srcMain === A ? B : A;
    const dx = Math.round(I * 9 * S * (r() < 0.5 ? -1 : 1));
    if (Math.abs(dx) >= 1) {
      // RGB split: red channel shifted by +dx, green+blue by -dx; summed with 'lighter' so a flat
      // frame stays exactly flat away from the |dx|-wide edge strips (which take the unshifted channel)
      const chan = (c, col) => { reset(c.x); c.x.globalCompositeOperation = 'copy'; c.x.drawImage(srcMain, 0, 0, W, H); c.x.globalCompositeOperation = 'multiply'; c.x.fillStyle = col; c.x.fillRect(0, 0, W, H); reset(c.x); };
      chan(t1, '#f00'); chan(t2, '#0ff');
      reset(x); x.globalCompositeOperation = 'copy'; x.drawImage(t1, 0, 0); x.globalCompositeOperation = 'source-over'; x.drawImage(t1, dx, 0);
      x.globalCompositeOperation = 'lighter'; x.drawImage(t2, -dx, 0);
      const ax = Math.abs(dx), gx = dx > 0 ? W - ax : 0; x.drawImage(t2, gx, 0, ax, H, gx, 0, ax, H); reset(x);
    } else put(x, srcMain);
    const n = Math.floor(I * 7);
    for (let i = 0; i < n; i++) { const y = Math.floor(r() * H), h = Math.max(2, Math.floor(r() * r() * H * 0.12)), off = Math.round((r() - 0.5) * I * 120 * S), src = r() < 0.25 ? other : srcMain;
      x.drawImage(src, 0, y, W, h, off, y, W, h); if (off > 0) x.drawImage(src, 0, y, off, h, 0, y, off, h); else if (off < 0) x.drawImage(src, W + off, y, -off, h, W + off, y, -off, h); }
  };
  let scanPat = null;
  T['scanline'] = (x, A, B, e, o) => {
    const u = E.inOutSine(e), ys = lerp(-6, H + 6, u), I = bell(e), r = rng(hash('scan', o.seed ?? 1, Math.floor(e * 40)));
    put(x, A); reset(x); x.save(); x.beginPath(); x.rect(0, 0, W, Math.max(0, ys)); x.clip(); put(x, B); x.restore();
    // tearing just behind the line
    for (let i = 0; i < 4; i++) { const y = Math.floor(ys - 6 * S - r() * 48 * S), h = Math.max(1, Math.round((2 + r() * 7) * S)), off = Math.round((r() - 0.5) * 36 * I * S); if (y < 0 || y + h > H) continue; x.drawImage(B, 0, y, W, h, off, y, W, h); }
    if (!scanPat) { const p = document.createElement('canvas'); p.width = 1; p.height = 4; const px = p.getContext('2d'); px.fillStyle = '#000'; px.fillRect(0, 0, 1, 1); scanPat = x.createPattern(p, 'repeat'); }
    reset(x); x.globalAlpha = 0.22 * I; x.fillStyle = scanPat; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    const g = x.createLinearGradient(0, ys - 60 * S, 0, ys + 4 * S); g.addColorStop(0, 'rgba(230,240,255,0)'); g.addColorStop(1, `rgba(230,240,255,${0.18 * I})`);
    x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, ys - 60 * S, W, 64 * S); x.fillStyle = `rgba(245,248,255,${0.75 * I})`; x.fillRect(0, ys - S, W, 2 * S); reset(x);
  };
  T['pixel-sort'] = (x, A, B, e, o) => {
    const u = E.inOutSine(e), bandH = (o.band ?? 0.3) * H, yc = lerp(-bandH / 2, H + bandH / 2, u), I = bell(e) * (o.amount ?? 1);
    put(x, A); reset(x); x.save(); x.beginPath(); x.rect(0, 0, W, Math.max(0, yc)); x.clip(); put(x, B); x.restore();
    if (I < 0.02) return;
    // sort runs of bright pixels in each column of the band (half res), brightest pulled downward
    const y0 = Math.max(0, Math.floor((yc - bandH / 2) * LO)), y1 = Math.min(lh, Math.ceil((yc + bandH / 2) * LO)), bh = y1 - y0; if (bh < 4) return;
    reset(lo1.x); lo1.x.globalCompositeOperation = 'copy'; lo1.x.drawImage(x.canvas, 0, y0 / LO, W, bh / LO, 0, 0, lw, bh); reset(lo1.x);
    const img = lo1.x.getImageData(0, 0, lw, bh), d = img.data, th = lerp(0.9, 0.3, I), lum = new Float32Array(bh), idx = new Int32Array(bh), tmp = new Uint8ClampedArray(bh * 4);
    for (let X = 0; X < lw; X++) {
      let Y = 0;
      while (Y < bh) {
        const i0 = (Y * lw + X) * 4; if ((0.3 * d[i0] + 0.59 * d[i0 + 1] + 0.11 * d[i0 + 2]) / 255 < th) { Y++; continue; }
        let Z = Y; while (Z < bh) { const i = (Z * lw + X) * 4; const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255; if (l < th) break; lum[Z - Y] = l; idx[Z - Y] = Z - Y; Z++; }
        const n = Z - Y; if (n > 2) { const sl = Array.from(idx.subarray(0, n)).sort((a, b) => lum[a] - lum[b]); for (let k = 0; k < n; k++) { const s = ((Y + sl[k]) * lw + X) * 4; tmp[k * 4] = d[s]; tmp[k * 4 + 1] = d[s + 1]; tmp[k * 4 + 2] = d[s + 2]; }
          for (let k = 0; k < n; k++) { const t = ((Y + k) * lw + X) * 4; d[t] = tmp[k * 4]; d[t + 1] = tmp[k * 4 + 1]; d[t + 2] = tmp[k * 4 + 2]; } }
        Y = Z;
      }
    }
    // feather the band top and bottom so it melts into the frame
    for (let Y = 0; Y < bh; Y++) { const a = 255 * Math.min(1, Math.min(Y, bh - 1 - Y) / (bh * 0.25)) * Math.min(1, I * 1.5); for (let X = 0; X < lw; X++) d[(Y * lw + X) * 4 + 3] = a; }
    lo1.x.putImageData(img, 0, 0); x.drawImage(lo1, 0, 0, lw, bh, 0, y0 / LO, W, bh / LO);
  };
  // panels and tiles
  T['split-slide'] = (x, A, B, e, o) => {
    const n = o.panels ?? 3, vert = o.axis !== 'x', st = o.stagger ?? 0.1, span = 1 - st * (n - 1);
    for (let i = 0; i < n; i++) {
      const p = E.inOutQuart(clamp((e - i * st) / span)), sgn = (i % 2 ? -1 : 1) * (o.dir ?? 1), D = vert ? H : W;
      const x0 = vert ? Math.floor(i * W / n) : 0, y0 = vert ? 0 : Math.floor(i * H / n), w = vert ? Math.floor((i + 1) * W / n) - x0 : W, h = vert ? H : Math.floor((i + 1) * H / n) - y0;
      reset(x); x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
      const oa = -sgn * D * p, ob = sgn * D * (1 - p);
      x.drawImage(A, vert ? 0 : oa, vert ? oa : 0, W, H); x.drawImage(B, vert ? 0 : ob, vert ? ob : 0, W, H); x.restore();
    }
  };
  T['grid-reveal'] = (x, A, B, e, o) => {
    const [cols, rows] = o.grid ?? [8, 4.5].map(Math.round), r = rng(hash('grid', o.seed ?? 1)), c = o.at ?? [0, 0], sp = o.span ?? 0.35;
    put(x, A); const cw = W / cols, ch = H / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = Math.hypot((i + 0.5) / cols - c[0], (j + 0.5) / rows - c[1]) / Math.SQRT2, delay = clamp(d * 0.75 + r() * 0.25) * (1 - sp);
      const p = clamp((e - delay) / sp); if (p <= 0) continue;
      const k = E.outCubic(p), s = 0.9 + 0.1 * E.outCubic(p), x0 = Math.round(i * cw), y0 = Math.round(j * ch), x1 = Math.round((i + 1) * cw), y1 = Math.round((j + 1) * ch);
      reset(x); x.save(); x.beginPath(); x.rect(x0, y0, x1 - x0, y1 - y0); x.clip(); x.globalAlpha = k;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; x.translate(mx, my); x.scale(s, s); x.translate(-mx, -my); x.drawImage(B, 0, 0, W, H); x.restore();
    }
    reset(x);
  };
  T['mosaic-shatter'] = (x, A, B, e, o) => {
    const [cols, rows] = o.grid ?? [12, 7], r = rng(hash('shatter', o.seed ?? 1)), c = o.at ?? [0.5, 0.5], sp = 0.55;
    put(x, B, { s: 1 + 0.05 * (1 - E.outCubic(e)) }); fill(x, '#000', 0.45 * (1 - E.inOutSine(e)));
    const cw = W / cols, ch = H / rows, intact = new Path2D(), moving = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const jr = r(), jx = r() - 0.5, jy = r() - 0.5, jrot = r() - 0.5;
      const d = Math.hypot((i + 0.5) / cols - c[0], ((j + 0.5) / rows - c[1]) * H / W) / 0.75, delay = clamp(d * 0.8 + jr * 0.2) * (1 - sp);
      const p = clamp((e - delay) / sp), x0 = Math.round(i * cw), y0 = Math.round(j * ch), x1 = Math.round((i + 1) * cw), y1 = Math.round((j + 1) * ch);
      if (p <= 0) intact.rect(x0, y0, x1 - x0, y1 - y0); else if (p < 1) moving.push([x0, y0, x1 - x0, y1 - y0, p, jx, jy, jrot, i, j]);
    }
    reset(x); x.save(); x.clip(intact); x.drawImage(A, 0, 0, W, H); x.restore();
    for (const [x0, y0, w, h, p, jx, jy, jrot, i, j] of moving) {
      const k = E.inCubic(p), ox = (((i + 0.5) / cols - c[0]) * 200 * k + jx * 50 * k) * S, oy = (((j + 0.5) / rows - c[1]) * 140 * k + jy * 50 * k + 120 * k * k) * S;
      reset(x); x.globalAlpha = 1 - smoothstep(0.55, 1, p); x.translate(x0 + w / 2 + ox, y0 + h / 2 + oy); x.rotate(jrot * 0.7 * k); x.scale(1 - 0.4 * k, 1 - 0.4 * k);
      x.drawImage(A, x0, y0, w, h, -w / 2, -h / 2, w, h);
    }
    reset(x);
  };
  T['parallax-slide'] = (x, A, B, e, o) => {
    const dir = o.dir ?? 1, u = E.emphasized(e), bx = Math.round(dir * W * (1 - u)), ax = Math.round(-dir * W * u * 0.3);
    put(x, A, { dx: ax }); fill(x, '#000', 0.5 * u);
    if (u <= 0) return;
    // soft contact shadow cast ahead of B's leading edge
    const edge = dir > 0 ? bx : bx + W, sw = 90 * S, g = x.createLinearGradient(edge, 0, edge - dir * sw, 0); g.addColorStop(0, `rgba(0,0,0,${0.45 * (1 - u)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    reset(x); x.fillStyle = g; x.fillRect(dir > 0 ? edge - sw : edge, 0, sw, H);
    put(x, B, { dx: bx });
  };
  T['page-turn'] = (x, A, B, e, o) => {
    const R = (o.radius ?? 0.07) * W, u = E.inOutSine(e), xf = lerp(W + 1, -R - 0.13 * W, u), dmax = W - xf, paper = o.paper ?? '#b9b2a4';
    put(x, B);
    if (dmax <= 0.5) { put(x, A); return; }
    // shadow on B just beyond the curl
    const cr = xf + Math.min(R, dmax), g = x.createLinearGradient(cr, 0, cr + 0.12 * W, 0); g.addColorStop(0, `rgba(0,0,0,${0.55 * smoothstep(0, 0.05, e)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    reset(x); x.fillStyle = g; x.fillRect(cr, 0, 0.12 * W, H);
    if (xf > 0) x.drawImage(A, 0, 0, Math.ceil(xf), H, 0, 0, Math.ceil(xf), H);
    // front of the curl (bulging, theta 0..pi/2), strips with shading
    const n = 28, thMax = Math.min(Math.PI / 2, dmax / R);
    for (let i = 0; i < n; i++) { const a0 = thMax * i / n, a1 = thMax * (i + 1) / n, s0 = xf + a0 * R, s1 = xf + a1 * R, d0 = xf + R * Math.sin(a0), d1 = xf + R * Math.sin(a1);
      if (d1 - d0 < 0.05) continue; x.drawImage(A, s0, 0, Math.max(0.5, s1 - s0), H, d0, 0, d1 - d0 + 0.6, H);
      x.fillStyle = `rgba(0,0,0,${0.35 * Math.sin(a0)})`; x.fillRect(d0, 0, d1 - d0 + 0.6, H); }
    // back of the page: curl (pi/2..pi) and the flap beyond it: mirrored A seen through paper, lit by the key
    if (dmax > R * Math.PI / 2) {
      const flap = Math.max(0, dmax - Math.PI * R), left = xf - flap;
      const back = (sx, sw, dx, dw, shade) => { reset(x); x.save(); x.translate(dx + dw, 0); x.scale(-dw / sw, 1); x.drawImage(A, sx, 0, sw, H, 0, 0, sw, H); x.restore();
        x.fillStyle = paper; x.globalAlpha = 0.72; x.fillRect(dx, 0, dw, H); x.globalAlpha = 1; if (shade) { x.fillStyle = shade; x.fillRect(dx, 0, dw, H); } };
      const thEnd = Math.min(Math.PI, dmax / R);
      for (let i = 0; i < n; i++) { const a0 = Math.PI / 2 + (thEnd - Math.PI / 2) * i / n, a1 = Math.PI / 2 + (thEnd - Math.PI / 2) * (i + 1) / n;
        const s0 = xf + a0 * R, s1 = xf + a1 * R, p0 = xf + R * Math.sin(a0), p1 = xf + R * Math.sin(a1); if (p0 - p1 < 0.05) continue;
        const light = Math.cos(a0 - Math.PI * 0.62); back(s0, Math.max(0.5, s1 - s0), p1, p0 - p1 + 0.6, light > 0 ? `rgba(255,248,235,${0.22 * light})` : `rgba(0,0,0,${-0.35 * light})`); }
      if (flap > 0.5) { back(xf + Math.PI * R, flap, left, flap, null);
        const gf = x.createLinearGradient(left, 0, xf, 0); gf.addColorStop(0, 'rgba(0,0,0,0.25)'); gf.addColorStop(1, 'rgba(0,0,0,0.05)'); x.fillStyle = gf; x.fillRect(left, 0, flap, H);
        const ge = x.createLinearGradient(left, 0, left - 50 * S, 0); ge.addColorStop(0, 'rgba(0,0,0,0.4)'); ge.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = ge; x.fillRect(left - 50 * S, 0, 50 * S, H); }
    }
    reset(x);
  };
  T['redact-wipe'] = (x, A, B, e, o) => {
    const n = o.rows ?? 7, r = rng(hash('redact', o.seed ?? 1)), stg = Array.from({ length: n }, () => r() * 0.18), col = o.color ?? '#070707';
    const first = e < 0.5, u = first ? e / 0.5 : (e - 0.5) / 0.5; put(x, first ? A : B);
    reset(x); x.fillStyle = col;
    for (let i = 0; i < n; i++) { const p = E.inOutCubic(clamp((u - stg[i]) / 0.8)), y0 = Math.floor(i * H / n), y1 = Math.floor((i + 1) * H / n);
      if (first) x.fillRect(0, y0, W * p, y1 - y0); else x.fillRect(W * p, y0, W * (1 - p) + 1, y1 - y0); }
  };
  T['pass-through'] = (x, A, B, e, o) => {
    const dir = o.dir ?? 1, u = lerp(E.inOutSine(e), e, 0.35), wO = (o.width ?? 0.8) * W, f = 0.1 * W;
    const lead = lerp(W + f, -wO - f, u), trail = lead + wO; // occluder's edges in a right-to-left pass (mirrored for dir = -1)
    const map = (v) => (dir > 0 ? v : W - v);
    put(x, A, { dx: -dir * 0.06 * W * u });
    const bx0 = Math.min(map(trail), map(W + 3 * f)), bx1 = Math.max(map(trail), map(W + 3 * f));
    reset(x); x.save(); x.beginPath(); x.rect(bx0, 0, bx1 - bx0, H); x.clip(); put(x, B, { dx: dir * 0.06 * W * (1 - u) }); x.restore();
    // the occluder: near-black, motion-blurred edges (wide feather), a faint warm rim on its leading edge
    const x0 = Math.min(map(lead), map(trail)), x1 = Math.max(map(lead), map(trail)), span = x1 - x0 + 2 * f, g = x.createLinearGradient(x0 - f, 0, x1 + f, 0);
    g.addColorStop(0, 'rgba(8,8,9,0)'); g.addColorStop(f / span, 'rgba(8,8,9,1)'); g.addColorStop(1 - f / span, 'rgba(8,8,9,1)'); g.addColorStop(1, 'rgba(8,8,9,0)');
    reset(x); x.fillStyle = g; x.fillRect(x0 - f, 0, span, H);
    const rimX = dir > 0 ? x0 + f * 0.1 : x1 - f * 0.1, gr = x.createLinearGradient(rimX - 40 * S, 0, rimX + 40 * S, 0); gr.addColorStop(0, 'rgba(255,190,120,0)'); gr.addColorStop(0.5, 'rgba(255,190,120,0.08)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
    x.globalCompositeOperation = 'screen'; x.fillStyle = gr; x.fillRect(rimX - 40 * S, 0, 80 * S, H); reset(x);
  };
  const hold = mk(W, H);
  return {
    names, meta, canvases: { t1, t2, lo1, lo2, q1, q2 },
    // Draw transition `name` at linear progress e from A (outgoing) to B (incoming) into ctx.
    render(x, name, A, B, e, opts = {}) {
      const f = T[name]; if (!f) throw new Error(`[transitions] unknown transition "${name}" (have: ${names.join(', ')})`);
      reset(x);
      if (!(e > 0)) { x.globalCompositeOperation = 'copy'; x.drawImage(A, 0, 0, W, H); reset(x); return; }
      if (e >= 1) { x.globalCompositeOperation = 'copy'; x.drawImage(B, 0, 0, W, H); reset(x); return; }
      x.save(); try { f(x, A, B, e, opts); } finally { x.restore(); reset(x); }
    },
    // Freeze `src` (e.g. the comp canvas on the last frame of the outgoing shot) and return the copy.
    hold(src) { reset(hold.x); hold.x.globalCompositeOperation = 'copy'; hold.x.drawImage(src, 0, 0, W, H); reset(hold.x); return hold; },
    held: hold,
    // Per-frame helper for a scene runtime. Draws the comp frame for shot `id` at shot time t:
    // during the first `dur` seconds it runs transition `name` from the outgoing picture to
    // `incoming`, otherwise it draws `incoming`. The outgoing picture is `outgoing` if you can still
    // render the previous shot live (better: nothing freezes), else the last comp frame of the
    // previous shot, frozen on the first frame of this one. Returns the progress e (or 1 when
    // not transitioning). render.mjs renders the frame before every chunk that starts on a shot
    // boundary, so the frozen frame exists; keep `dur` below settings.cutGuard (default 1 s).
    composite(x, { id, t, incoming, outgoing = null, name = 'cut', dur = meta[name]?.dur ?? 0, opts = {} }) {
      if (this._id !== undefined && this._id !== id) { this.hold(x.canvas); this._held = true; }
      this._id = id;
      const src = outgoing ?? (this._held ? hold : null);
      if (name !== 'cut' && dur > 0 && t < dur && src) { const e = t / dur; this.render(x, name, src, incoming, e, opts); return e; }
      reset(x); x.globalCompositeOperation = 'copy'; x.drawImage(incoming, 0, 0, W, H); reset(x); return 1;
    },
  };
}
