// Power-cut transitions (episode 4, LIVE WIRE). The picture loses its electricity: it is never a
// dissolve to black. Same contract as engine/transitions.js: render(cx, name, A, B, e, opts) draws the
// frame for linear progress e in [0, 1] from A (outgoing) and B (incoming); e <= 0 is exactly A,
// e >= 1 exactly B; pure in (A, B, e, opts). Sounds: cuts.mjs PROJECT_SFX (one place, shared with the score).
//
//   crt-collapse   the tube dies: the image squeezes to a bright horizontal line, the line to a dot, the dot
//                  fades; a beat of black; B cuts in. (Into chapter cards the line *is* the scope trace.)
//   flicker-out    a failing fluorescent: A stutters with shrinking duty to black; black; B cuts in.
//                  opts.strike: B strikes on like a tube (two blinks, then holds), for power coming back.
//   breaker-clunk  hard cut to black on the sound: one frame of A at 18 % with a 6 px mechanical jolt, then
//                  black until B cuts in.
//   flash-pop      direct flash: a white pop (#fff8ee) and B emerges over-exposed, decaying to its exposure.
export const META = {
  'crt-collapse':  { dur: 1.0, kind: 'light', use: 'A screen or a scene dies like a CRT: line, dot, black. Into chapter cards, out of HMIs.' },
  'flicker-out':   { dur: 0.9, kind: 'light', use: 'Fluorescent failure: a room loses power. opts.strike for restoration.' },
  'breaker-clunk': { dur: 0.6, kind: 'light', use: 'A breaker opens: hard cut to black on the clunk, silence, then B.' },
  'flash-pop':     { dur: 0.36, kind: 'light', use: 'Into a direct-flash still: shutter, white pop, B over-exposed then settles.' },
};
export const names = Object.keys(META);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const range = (t, a, b) => clamp((t - a) / (b - a));
const sstep = (a, b, x) => { const u = range(x, a, b); return u * u * (3 - 2 * u); };
function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }

export function layerMix(name, e) {
  if (name === 'crt-collapse') return { out: 1 - sstep(0.0, 0.35, e), in: e >= 1 ? 1 : 0 };
  if (name === 'flicker-out') return { out: flick(range(e, 0, 0.62), 5) > 0.5 && e < 0.62 ? 1 : 0, in: e >= 1 ? 1 : 0 };
  if (name === 'breaker-clunk') return { out: 0, in: e >= 1 ? 1 : 0 };
  if (name === 'flash-pop') return { out: e < 0.08 ? 1 : 0, in: sstep(0.25, 0.7, e) };
  return { out: 1 - e, in: e };
}
// dying tube brightness for k in [0, 1]
function flick(k, seed) {
  if (k <= 0) return 1; if (k >= 1) return 0;
  const n = 11, i = Math.floor(k * n), r = hash(i, seed, 'fo');
  const duty = Math.pow(1 - k, 0.8);
  return r < duty ? (0.45 + 0.55 * hash(i, seed, 'b')) : 0.025 + 0.03 * hash(i, seed, 'g');
}

export function create({ width: W = 1920, height: H = 1080 } = {}) {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); c.x = c.getContext('2d', { willReadFrequently: true }); return c; };
  const small = mk(64, 36), row = mk(64, 1);
  const reset = (x) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; };
  const black = (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); };
  const S = H / 1080;

  function collapse(x, A, e, o) {
    // 0 .. 0.42: vertical squeeze (accelerating); 0.38 .. 0.6: line shrinks to a dot; 0.6 .. 0.74: dot fades
    const ky = range(e, 0, 0.42), kx = range(e, 0.38, 0.6), kd = range(e, 0.58, 0.74);
    const sy = Math.max(0.0035, 1 - Math.pow(ky, 2.2) * 0.9965), sx = Math.max(0.004, 1 - Math.pow(kx, 1.6) * 0.996);
    black(x);
    if (kd >= 1) return;
    // the averaged line (a column average of A, so a thin line never aliases)
    reset(small.x); small.x.drawImage(A, 0, 0, 64, 36); reset(row.x); row.x.drawImage(small, 0, 0, 64, 36, 0, 0, 64, 1);
    const w = W * sx, h = H * sy, x0 = (W - w) / 2, y0 = (H - h) / 2;
    const boost = 1 + 3 * sstep(0.2, 0.42, ky);
    if (sy > 0.03) { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; x.globalAlpha = 1; x.drawImage(A, x0, y0, w, h); }
    // line core (blended in as the squeeze completes) + glow, brighter as the beam concentrates
    const lineA = sstep(0.04, 0.012, sy) * (1 - kd);
    const lh = Math.max(2 * S, h);
    if (lineA > 0) { x.globalAlpha = lineA; x.drawImage(row, 0, 0, 64, 1, x0, H / 2 - lh / 2, w, lh); }
    x.globalCompositeOperation = 'lighter';
    const g = 1 - kd, core = o.color ?? '#d8ffe6';
    for (const [hh, a] of [[lh * 1.2 + 3 * S, 0.55 * boost], [lh * 6 + 14 * S, 0.12 * boost], [lh * 24 + 50 * S, 0.035 * boost]]) {
      x.globalAlpha = Math.min(1, a * g * sstep(0.0, 0.35, ky)); x.fillStyle = core;
      const ww = Math.max(w, hh * 0.6);
      const grd = x.createLinearGradient(0, H / 2 - hh / 2, 0, H / 2 + hh / 2); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, core); grd.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grd; x.fillRect((W - ww) / 2, H / 2 - hh / 2, ww, hh);
    }
    // the last dot
    if (kx > 0.85) { const r = (6 + 30 * (1 - kd)) * S; const gr = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, r); gr.addColorStop(0, core); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = (1 - kd) * sstep(0.85, 1, kx); x.fillStyle = gr; x.fillRect(W / 2 - r, H / 2 - r, 2 * r, 2 * r); }
    reset(x);
  }

  function render(x, name, A, B, e, opts = {}) {
    reset(x);
    if (e <= 0) { x.drawImage(A, 0, 0, W, H); return; }
    if (e >= 1) { x.drawImage(B, 0, 0, W, H); return; }
    if (name === 'crt-collapse') {
      collapse(x, A, e, opts);
      if (opts.on === 'expand') { const k = range(e, 0.8, 1); if (k > 0) { const sy = Math.max(0.004, Math.pow(k, 1.6)); black(x); x.drawImage(B, 0, H * (1 - sy) / 2, W, H * sy); } }
      return;
    }
    if (name === 'flicker-out') {
      const k = range(e, 0, 0.62); black(x);
      const f = flick(k, opts.seed ?? 5);
      if (k < 1) { x.globalAlpha = f; x.drawImage(A, 0, 0, W, H); x.globalAlpha = 1;
        // the fluorescent cast in the stutter: a faint green wash on the lit frames
        if (f > 0.3) { x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(200,255,215)'; x.globalAlpha = 0.5 * k; x.fillRect(0, 0, W, H); reset(x); } }
      if (opts.strike) { const s = range(e, 0.72, 1); const blink = s <= 0 ? 0 : s < 0.12 ? 0.7 : s < 0.3 ? 0.04 : s < 0.42 ? 0.8 : s < 0.55 ? 0.06 : 0.75 + 0.25 * sstep(0.55, 1, s); if (blink > 0) { x.globalAlpha = blink; x.drawImage(B, 0, 0, W, H); x.globalAlpha = 1; } }
      return;
    }
    if (name === 'breaker-clunk') {
      black(x);
      const fr = e * (META['breaker-clunk'].dur) * 60; // frames at 60 fps
      if (fr < 1.5) { x.globalAlpha = 0.18; x.drawImage(A, 0, 6 * S, W, H); x.globalAlpha = 1; }
      return;
    }
    if (name === 'flash-pop') {
      const c = opts.color ?? '#fff8ee';
      if (e < 0.06) { x.drawImage(A, 0, 0, W, H); x.globalAlpha = sstep(0, 0.06, e); x.fillStyle = c; x.fillRect(0, 0, W, H); reset(x); return; }
      const k = range(e, 0.06, 1), w = Math.pow(1 - k, 2.2);
      x.drawImage(B, 0, 0, W, H);
      // over-exposure: B added onto itself, then the white veil decays
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.9 * w; x.drawImage(B, 0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = Math.min(1, 1.15 * w * w); x.fillStyle = c; x.fillRect(0, 0, W, H); reset(x);
      return;
    }
    throw new Error(`[power-cuts] unknown transition ${name}`);
  }
  return { render };
}
