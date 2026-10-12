// Real footage, deterministic. One file, two halves:
//
//   NODE (CLI)   node engine/footage.js search <query> --source nasa [--max 10]
//                node engine/footage.js fetch  <query> --source nasa --max 5 [--min-height 720] [--tag t]
//                node engine/footage.js get    <source> <id> [--tag t]        one item by id (archive/nasa/loc/commons/svs)
//                node engine/footage.js files  <source> <id>                    downloadable files and sizes
//                node engine/footage.js pack   [--only tag,tag] [--dry]       (re)download the starter pack (assets/footage/pack.json)
//                node engine/footage.js list   [tag]                          the local library with licences
//                node engine/footage.js prep   projects/<name> [--force]      extract graded frame sequences for every footage shot
//                node engine/footage.js still  <file> <seconds> [--grade house] graded still (+ depth for engine/parallax.js)
//                node engine/footage.js lut    [name]                         write the house LUTs (.cube) to .cache/footage/luts
//   BROWSER      import * as FT from '/engine/footage.js';
//                const set = await FT.footage(ctx, shot, { file, in, out, speed, grade, reframe, caption, source });
//                set.update(t, p) in the scene's frame; renderer.render(set.scene, set.camera).
//
// Determinism: prep writes every source frame of [in, out] at a fixed sequence rate (the project fps by
// default) as graded JPEGs under .cache/footage/seq/<key>/. At render time frame k = floor((t + offset) * fps)
// of the speed-mapped source time is shown; with speed ramps the source time is the exact integral of the
// ramp. The browser has no synchronous image decode, so the first footage set wraps window.__frame: before
// the scene draws time T it awaits the frames every footage shot near T needs (pure function of T). A
// synchronous pure-JS decoder (engine/imagery/jpeg.js) is the fallback if a frame is ever asked for unplanned.
//
// Licences: the downloader only keeps items whose licence field is public domain / CC0 / US Government
// work (or Pexels / Pixabay licence with an API key you supply). Every clip gets a provenance JSON next
// to it: source URL, page, licence + evidence, credit, date, sha1. Catalog: docs/assets/footage-library.md.
import * as THREE from 'three';

const IS_NODE = typeof window === 'undefined';

// ===================================================================== shared (node + browser)
export const GRADES = {
  // name: lift (black level out), gamma, gain, saturation, warm (+ = warm highlights / cool shadows), contrast, tint
  house:   { lift: 0.035, gamma: 1.0,  gain: 0.97, sat: 0.82, warm: 0.06, contrast: 1.06, shadowTint: [-0.006, 0.0, 0.010], hiTint: [0.030, 0.012, -0.030] },
  archive: { lift: 0.05,  gamma: 1.04, gain: 0.95, sat: 0.55, warm: 0.08, contrast: 1.12, shadowTint: [0.004, 0.0, -0.004], hiTint: [0.040, 0.018, -0.040] },
  bw:      { lift: 0.045, gamma: 1.02, gain: 0.96, sat: 0.0,  warm: 0.03, contrast: 1.14, shadowTint: [0, 0, 0.004], hiTint: [0.018, 0.010, -0.012] },
  orbit:   { lift: 0.012, gamma: 1.03, gain: 1.0,  sat: 0.92, warm: 0.03, contrast: 1.08, shadowTint: [-0.004, 0.0, 0.010], hiTint: [0.018, 0.008, -0.020] },
  night:   { lift: 0.02,  gamma: 1.06, gain: 0.98, sat: 0.85, warm: 0.10, contrast: 1.10, shadowTint: [-0.010, -0.002, 0.016], hiTint: [0.060, 0.020, -0.060] },
  fluoro:  { lift: 0.03,  gamma: 1.02, gain: 0.97, sat: 0.78, warm: -0.02, contrast: 1.06, shadowTint: [-0.010, 0.012, 0.004], hiTint: [-0.010, 0.030, 0.006] },
  none: null,
};

// The house transfer: per channel, applied to display-referred RGB in 0..1. Pure function: the LUT
// written for ffmpeg and any in-browser grading use the same maths.
export function gradePixel(r, g, b, G) {
  if (!G) return [r, g, b];
  const luma = (x, y, z) => 0.2126 * x + 0.7152 * y + 0.0722 * z;
  // contrast around mid grey with a soft toe and shoulder (filmic S), then lift / gain / gamma
  const S = (x) => { const c = G.contrast; const y = 0.5 + (x - 0.5) * c; const toe = 0.06, sh = 0.94;
    if (y < toe) return toe * Math.pow(Math.max(y, 0) / toe, 1 + (c - 1) * 2.5); // deepen the toe, no clipping
    if (y > sh) return sh + (1 - sh) * (1 - Math.exp(-(y - sh) / (1 - sh)));    // roll highlights off
    return y; };
  let o = [S(r), S(g), S(b)];
  const L = luma(...o);
  // saturation (luma-preserving), less saturation in the deep shadows and the top highlights
  const sat = G.sat * (1 - 0.25 * Math.max(0, 1 - L / 0.12)) * (1 - 0.3 * Math.max(0, (L - 0.85) / 0.15));
  o = o.map(x => L + (x - L) * sat);
  // split tone: cool shadows, warm highlights
  const wS = Math.pow(1 - L, 2), wH = Math.pow(L, 1.5);
  o = o.map((x, i) => x + G.shadowTint[i] * wS * 2 + G.hiTint[i] * wH * (1 + G.warm * 4));
  // lift / gain / gamma
  o = o.map(x => { const y = G.lift + (G.gain - G.lift) * Math.min(Math.max(x, 0), 1); return Math.pow(Math.min(Math.max(y, 0), 1), 1 / G.gamma); });
  return o;
}

export function cube(name = 'house', N = 33) {
  const G = typeof name === 'string' ? GRADES[name] : name;
  const lines = [`TITLE "better-videos ${typeof name === 'string' ? name : 'custom'}"`, `LUT_3D_SIZE ${N}`, 'DOMAIN_MIN 0 0 0', 'DOMAIN_MAX 1 1 1'];
  for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++) {
    const o = gradePixel(r / (N - 1), g / (N - 1), b / (N - 1), G);
    lines.push(o.map(x => x.toFixed(5)).join(' '));
  }
  return lines.join('\n') + '\n';
}

// FNV-1a (32-bit, twice with different seeds) -> 16 hex chars. Same in node and the browser.
export function hash(str) {
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 0x01000193); h2 = Math.imul(h2 ^ c, 0x5bd1e995) ^ (h2 >>> 13); }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

// Library ids ('nasa-iss-city-lights') resolve to assets/footage/clips/<id>.<ext>; paths are used as given.
export const CLIP_DIR = 'assets/footage/clips';
// The cache key of a sequence: everything that changes its pixels. Must match in node and the browser.
export function seqKey(P) {
  const g = typeof P.grade === 'object' && P.grade ? P.grade : { lut: P.grade ?? 'house' };
  return hash(JSON.stringify({ f: P.file, in: +(P.in ?? 0), out: P.out == null ? null : +P.out, g, stab: P.stab ?? false, fit: P.fit ?? 'cover', res: P.res ?? 1, crop: P.crop ?? null, deint: P.deint ?? 'auto', v: 3 }));
}

// Speed: a number, or ramp keys [[t, speed], ...] (piecewise linear in shot time). Returns the source
// seconds elapsed at shot time t: the exact integral, so ramps never jump.
export function sourceTime(t, speed = 1) {
  if (typeof speed === 'number') return t * speed;
  const k = speed; let acc = 0;
  if (t <= k[0][0]) return t * k[0][1];
  acc = k[0][0] * k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, s0] = k[i], [t1, s1] = k[i + 1];
    if (t <= t1) { const u = t - t0, ds = (s1 - s0) / (t1 - t0); return acc + s0 * u + 0.5 * ds * u * u; }
    acc += (s0 + s1) / 2 * (t1 - t0);
  }
  const [tl, sl] = k[k.length - 1]; return acc + (t - tl) * sl;
}
export function speedAt(t, speed = 1) {
  if (typeof speed === 'number') return speed;
  const k = speed; if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) { const u = (t - k[i][0]) / (k[i + 1][0] - k[i][0]); return k[i][1] + (k[i + 1][1] - k[i][1]) * u; }
  return k[k.length - 1][1];
}

const EASE = {
  linear: x => x,
  inOut: x => x * x * x * (x * (x * 6 - 15) + 10),            // quintic smootherstep: C2, no velocity pops
  in: x => x * x * x, out: x => 1 - Math.pow(1 - x, 3),
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;

// Reframe: { from: [cx, cy, zoom], to: [cx, cy, zoom], ease, at: [t0, t1] (s, default whole shot) }
// plus punch-ins: punch: [{ at, dur, zoom, center: [cx, cy], hold }] (eased in, held, eased out if hold
// is finite). Zoom is relative to the frame-filling image (1 = full frame). Returns the source
// window { cx, cy, s } in 0..1 image units, clamped so the frame never leaves the picture.
export function reframeAt(R, t, dur) {
  let cx = 0.5, cy = 0.5, z = 1;
  if (R) {
    const a = R.from ?? [0.5, 0.5, 1], b = R.to ?? a;
    const [t0, t1] = R.at ?? [0, dur];
    const e = (EASE[R.ease ?? 'inOut'] ?? EASE.inOut)(clamp((t - t0) / Math.max(1e-6, t1 - t0)));
    // zoom interpolates in log space so the apparent speed of a push is constant
    cx = lerp(a[0], b[0], e); cy = lerp(a[1], b[1], e); z = Math.exp(lerp(Math.log(a[2] ?? 1), Math.log(b[2] ?? 1), e));
    for (const P of R.punch ?? []) {
      const d = P.dur ?? 0.6, h = P.hold ?? Infinity;
      const kIn = EASE[P.ease ?? 'inOut'](clamp((t - P.at) / d)), kOut = Number.isFinite(h) ? EASE.inOut(clamp((t - P.at - d - h) / d)) : 0;
      const k = kIn * (1 - kOut);
      z *= Math.exp(Math.log(P.zoom ?? 1.25) * k);
      if (P.center) { cx = lerp(cx, P.center[0], k); cy = lerp(cy, P.center[1], k); }
    }
    // drift: slow, smooth operator float (sum of low sines; amplitude in frame widths)
    if (R.drift) { const A = R.drift; cx += A * (Math.sin(t * 0.37 + 1.3) * 0.6 + Math.sin(t * 0.83 + 0.2) * 0.4); cy += A * 0.7 * (Math.sin(t * 0.29 + 2.1) * 0.6 + Math.sin(t * 0.71) * 0.4); }
  }
  const s = 1 / Math.max(1, z);
  return { cx: clamp(cx, s / 2, 1 - s / 2), cy: clamp(cy, s / 2, 1 - s / 2), s };
}

// ===================================================================== browser runtime
const LIVE = [];          // footage instances, for the prefetch hook
let hooked = false;

function hookFrame() {
  if (hooked || IS_NODE || typeof window.__frame !== 'function') return;
  hooked = true;
  const orig = window.__frame;
  window.__frame = async (T) => {
    const jobs = [];
    for (const inst of LIVE) {
      const s = inst.shot, local = T - s.start, active = local >= 0 && local < s.duration;
      if (inst.layer) inst.layer.style.display = active ? '' : 'none';
      if (local < -1.5 || local > s.duration + 1.5) continue;   // neighbours: transitions may draw them
      jobs.push(inst.prefetch(clamp(local, 0, s.duration)));
    }
    await Promise.all(jobs);
    return orig(T);
  };
}

async function loadJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`footage: ${url} ${r.status} (run: node engine/footage.js prep <project>)`); return r.json(); }

let jpegMod = null;
function syncDecode(url) {
  // fallback only: synchronous XHR (binary string) + pure-JS decode
  const x = new XMLHttpRequest(); x.open('GET', url, false); x.overrideMimeType('text/plain; charset=x-user-defined'); x.send();
  const s = x.responseText, b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255;
  const im = jpegMod.decode(b, { formatAsRGBA: true, useTArray: true });
  const t = new THREE.DataTexture(im.data, im.width, im.height, THREE.RGBAFormat); t.flipY = false; t.needsUpdate = true; return t;
}

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const FRAG = /* glsl */`
  uniform sampler2D tA, tB; uniform float mixAB, fade, exposure; uniform vec4 win; uniform vec2 letter; varying vec2 vUv;
  void main() {
    vec2 uv = vec2(vUv.x, 1. - vUv.y);                       // image rows top-down
    vec2 q = win.xy + (uv - .5) * win.zw;
    vec3 c = texture2D(tA, q).rgb;
    if (mixAB > 0.) c = mix(c, texture2D(tB, q).rgb, mixAB);
    // letterbox / pillarbox mask for fit: 'contain'
    float m = step(letter.x, uv.x) * step(uv.x, 1. - letter.x) * step(letter.y, uv.y) * step(uv.y, 1. - letter.y);
    gl_FragColor = vec4(c * exposure * fade * m, 1.);
  }`;

/**
 * A footage set. P: {
 *   file      'assets/footage/clips/x.mp4' or a library id
 *   in, out   source seconds (out default: in + 30)
 *   speed     1 | 0.5 | ramp keys [[t, speed], ...]   (t in shot seconds)
 *   offset    seconds added to shot time before mapping (start later in the prepared range)
 *   blend     true: blend neighbouring frames when slower than 1x (default true for speed < 1)
 *   grade     'house' | 'archive' | 'bw' | 'orbit' | 'night' | 'fluoro' | 'none' | { lut, exposure, contrast, saturation, temp }
 *   reframe   { from, to, ease, at, punch: [...], drift }   (see reframeAt)
 *   caption   { text, at, dur, corner: 'tl'|'tr'|'bl'|'br', kind: 'serif'|'mono' } | string
 *   source    'NASA / JSC · 2014' -> SOURCE line, bottom-left, Plex Mono caps
 *   fadeIn, fadeOut   seconds of fade from / to black (default 0)
 *   stab, fit ('cover'|'contain'), res, crop [x, y, w, h] (source px), deint: prep-time options
 * }
 */
export async function footage(ctx, shot, P = {}) {
  hookFrame();
  const { width, height, overlay } = ctx;
  const key = seqKey(P), dir = `/.cache/footage/seq/${key}/`;
  const meta = await loadJSON(dir + 'meta.json');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;
  const U = { tA: { value: blank }, tB: { value: blank }, mixAB: { value: 0 }, fade: { value: 1 }, exposure: { value: P.exposure ?? 1 },
    win: { value: new THREE.Vector4(0.5, 0.5, 1, 1) }, letter: { value: new THREE.Vector2(0, 0) } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, toneMapped: false }));
  quad.frustumCulled = false; scene.add(quad);
  // contain: the prepared frame already holds the bars; nothing to mask. (letter kept for custom use)
  const speed = P.speed ?? 1, blend = P.blend ?? (typeof speed === 'number' ? speed < 0.99 : true);
  const R = meta.fps, N = meta.frames, dur = shot.duration;
  const cache = new Map(); const order = [];
  const urlOf = (i) => dir + String(i + 1).padStart(5, '0') + '.jpg';
  const indices = (t) => {
    const f = clamp((sourceTime(t + (P.offset ?? 0), speed)) * R + 1e-6, 0, N - 1);
    const i = Math.floor(f), fr = f - i;
    // at speed 1 and sequence fps == render fps this is exactly floor((t + offset) * fps)
    return blend && fr > 0.02 && i + 1 < N && Math.abs(speedAt(t, speed)) < 0.99 ? [i, i + 1, fr] : [i, i, 0];
  };
  async function load(i) {
    if (cache.has(i)) return cache.get(i);
    const p = (async () => {
      const blob = await (await fetch(urlOf(i))).blob();
      const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const tex = new THREE.Texture(bmp); tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
      return tex;
    })();
    cache.set(i, p); order.push(i);
    while (order.length > 8) { const j = order.shift(); const old = cache.get(j); cache.delete(j); old.then(t => { t.image?.close?.(); t.dispose(); }); }
    return p;
  }
  const ready = new Map(); // resolved textures
  const inst = {
    shot, layer: null,
    async prefetch(t) { const [a, b] = indices(t); for (const i of new Set([a, b])) ready.set(i, await load(i)); },
  };
  // overlay: caption + source line (house type, corners only, never centred in the lower third)
  let cap = null, src = null, capText = null;
  if (overlay && (P.caption || P.source)) {
    const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(layer); inst.layer = layer;
    const sc = height / 1080;
    // a soft scrim under corner type: keeps it legible on busy footage without a visible box
    const scrim = (corner) => { const d = document.createElement('div'); const [v, h] = [corner[0] === 't' ? 'top' : 'bottom', corner[1] === 'l' ? 'left' : 'right'];
      d.style.cssText = `position:absolute;${v}:0;${h}:0;width:${1100 * sc}px;height:${420 * sc}px;background:radial-gradient(ellipse at ${v} ${h}, rgba(0,0,0,.42), rgba(0,0,0,.18) 45%, rgba(0,0,0,0) 72%);opacity:0`; layer.appendChild(d); return d; };
    if (P.caption) {
      const C0 = typeof P.caption === 'string' ? { text: P.caption } : P.caption; cap = { at: 0.5, dur: Infinity, corner: 'tl', kind: 'serif', ...C0 };
      const pos = { tl: 'left:96px;top:84px', tr: 'right:96px;top:84px;text-align:right', bl: 'left:96px;bottom:120px', br: 'right:96px;bottom:120px;text-align:right' }[cap.corner];
      const font = cap.kind === 'mono' ? `font:500 ${20 * sc}px "Plex Mono";letter-spacing:.18em;text-transform:uppercase` : `font:${56 * sc}px/1.05 "Instrument Serif";letter-spacing:-.005em`;
      cap.el = document.createElement('div');
      cap.el.style.cssText = `position:absolute;${pos.replace(/(\d+)px/g, (m, v) => v * sc + 'px')};max-width:${860 * sc}px;${font};color:#ece6da;text-shadow:0 0 ${18 * sc}px rgba(0,0,0,.55)`;
      if (cap.sub) { cap.subEl = document.createElement('div'); cap.subEl.style.cssText = `font:500 ${16 * sc}px "Plex Mono";letter-spacing:.2em;text-transform:uppercase;opacity:.75;margin-top:${14 * sc}px`; }
      capText = document.createElement('span'); cap.el.appendChild(capText); if (cap.subEl) cap.el.appendChild(cap.subEl);
      layer.appendChild(cap.el);
    }
    if (P.source) {
      src = document.createElement('div');
      src.style.cssText = `position:absolute;left:${96 * sc}px;bottom:${56 * sc}px;font:500 ${14 * sc}px "Plex Mono";letter-spacing:.2em;text-transform:uppercase;color:#ece6da;opacity:0;text-shadow:0 0 ${10 * sc}px rgba(0,0,0,.6)`;
      src.textContent = /^(source|footage|photo|film|video)\b/i.test(P.source) ? P.source : 'FOOTAGE: ' + P.source; layer.appendChild(src);
    }
  }
  LIVE.push(inst);
  return {
    scene, camera, kind: 'footage', meta, layer: inst.layer, key,
    // time in source seconds of shot time t (for syncing graphics to what is on screen)
    sourceAt: (t) => (meta.in ?? 0) + sourceTime(t + (P.offset ?? 0), speed),
    update(t) {
      const [a, b, fr] = indices(t);
      const A = ready.get(a) ?? fallback(a);
      const B = b === a ? A : (ready.get(b) ?? fallback(b));
      U.tA.value = A; U.tB.value = B; U.mixAB.value = b === a ? 0 : fr;
      const w = reframeAt(P.reframe, t, dur);
      U.win.value.set(w.cx, w.cy, w.s, w.s);
      const fi = P.fadeIn ? EASE.inOut(clamp(t / P.fadeIn)) : 1, fo = P.fadeOut ? EASE.inOut(clamp((dur - t) / P.fadeOut)) : 1;
      U.fade.value = fi * fo;
      if (cap) {
        const k = clamp((t - cap.at) / 0.9), out = Number.isFinite(cap.dur) ? clamp((t - cap.at - cap.dur) / 0.5) : 0;
        if (cap.kind === 'mono') { const n = Math.round(cap.text.length * k); capText.textContent = cap.text.slice(0, n); }
        else { capText.textContent = cap.text; cap.el.style.clipPath = `inset(0 ${(1 - EASE.out(k)) * 100}% 0 0)`; }
        if (cap.subEl) { cap.subEl.textContent = cap.sub.slice(0, Math.round(cap.sub.length * clamp((t - cap.at - 0.5) / 0.8))); }
        cap.el.style.opacity = String(1 - out);
        if (cap.scrim) cap.scrim.style.opacity = String(clamp((t - cap.at + 0.4) / 0.8) * (1 - out));
      }
      if (src) src.style.opacity = String(0.82 * clamp((t - 0.25) / 0.4) * (1 - clamp((t - dur + 0.3) / 0.3)));
    },
    dispose() { const i = LIVE.indexOf(inst); if (i >= 0) LIVE.splice(i, 1); for (const p of cache.values()) p.then(t => t.dispose()); quad.geometry.dispose(); quad.material.dispose(); },
  };
  function fallback(i) {
    if (!jpegMod) throw new Error('footage: frame ' + i + ' not prefetched; is window.__frame hooked? (await FT.ready() in create)');
    const t = syncDecode(urlOf(i)); ready.set(i, t); return t;
  }
}

// Load the synchronous fallback decoder up front (optional; only used if a frame is drawn without prefetch).
export async function ready() { if (!IS_NODE && !jpegMod) jpegMod = await import('/engine/imagery/jpeg.js'); }

// A still frame of footage as an archive photo with 2.5D parallax (engine/parallax.js). Prepare it with
// `node engine/footage.js still <file> <seconds>` (prep does it for params.parallax automatically).
export async function parallaxStill(ctx, shot, P) {
  const PX = await import('/engine/parallax.js');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.05, 100);
  const url = `/.cache/footage/stills/${stillKey(P.file, P.parallax.at, P.grade ?? 'house')}.jpg`;
  const ph = await PX.photo(scene, url, { treatment: P.parallax.treatment ?? 'none', mm: 50, dist: 10, depth: P.parallax.depth ?? 0.5, center: P.parallax.center, layers: 0 });
  const move = PX.moves[P.parallax.move ?? 'push'](ph, { amount: P.parallax.amount, opts: { duration: shot.duration } });
  return { scene, camera, kind: 'parallax', update(t, p) { move(camera, p, t); }, dispose() { ph.dispose(); } };
}
export const stillKey = (file, at, grade) => 'st-' + hash(JSON.stringify({ file, at: +at, grade }));

// ===================================================================== node CLI
async function cli(argv) {
  const fs = await import('node:fs'), path = await import('node:path'), cp = await import('node:child_process'), crypto = await import('node:crypto'), url = await import('node:url');
  const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
  const CACHE = path.join(ROOT, '.cache', 'footage');
  const LIB = path.join(ROOT, CLIP_DIR);
  const BOOL = new Set(['force', 'dry', 'json', 'allow-by']);
  const opt = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const [k, v] = a.slice(2).split(/=(.*)/s);
    opt[k] = v !== undefined ? v : BOOL.has(k) ? true : argv[++i];
  }
  const cmd = pos[0];
  const log = (...a) => console.error('[footage]', ...a);
  const UA = 'better-videos-footage/1 (documentary renderer; https://github.com/bendik-wq/better-videos)';
  const sh = (bin, a, o = {}) => cp.execFileSync(bin, a, { maxBuffer: 1 << 30, encoding: 'utf8', ...o });
  // curl honours the agent proxy (node's fetch does not)
  const curl = (u, extra = []) => sh('curl', ['-sSL', '--fail', '--retry', '4', '--retry-delay', '3', '-A', UA, ...extra, u]);
  const getJSON = (u, extra) => JSON.parse(curl(u, extra));
  const download = (u, file) => { fs.mkdirSync(path.dirname(file), { recursive: true }); cp.execFileSync('curl', ['-sSL', '--fail', '--retry', '6', '--retry-delay', '20', '--retry-all-errors', '-A', UA, '-o', file + '.part', u], { stdio: 'inherit' }); fs.renameSync(file + '.part', file); };
  const probe = (f) => { try { const j = JSON.parse(sh('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f])); const v = j.streams.find(s => s.codec_type === 'video');
    const [n, d] = (v?.avg_frame_rate ?? '0/1').split('/').map(Number); return { duration: +j.format.duration, width: v?.width, height: v?.height, fps: d ? n / d : 0, codec: v?.codec_name, field: v?.field_order ?? 'progressive', audio: j.streams.some(s => s.codec_type === 'audio') }; } catch { return null; } };
  const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const enc = encodeURIComponent;
  const PD_RX = /public ?domain|publicdomain|pd-|cc0|no known (copyright )?restrictions|not subject to copyright|us(-| )?gov|united states government work|work of the (u\.?s\.?|united states)/i;

  // ---------------------------------------------------------------- sources
  // Each: search(q, max) -> [{ source, id, title, page, date, licence, evidence, credit, ok, files: [{url, width, height, size, kind}] }]
  const S = {
    nasa: {
      search(q, max) {
        const j = getJSON(`https://images-api.nasa.gov/search?q=${enc(q)}&media_type=video&page_size=${Math.min(100, max * 3)}`);
        return j.collection.items.slice(0, max * 3).map(it => { const d = it.data[0];
          const third = /©|copyright|courtesy of (?!nasa)|credit: (?!nasa)/i.test(`${d.description ?? ''} ${d.secondary_creator ?? ''}`);
          return { source: 'nasa', id: d.nasa_id, title: d.title, page: `https://images.nasa.gov/details/${enc(d.nasa_id)}`, date: d.date_created?.slice(0, 10), center: d.center,
            licence: third ? 'NASA media, but the description names a third-party rights holder: check' : 'Public domain (NASA media; not subject to US copyright)',
            evidence: 'https://www.nasa.gov/nasa-brand-center/images-and-media/', credit: `NASA${d.center ? ' / ' + d.center : ''}${d.secondary_creator ? ' / ' + d.secondary_creator : ''}`, ok: !third, desc: (d.description ?? '').slice(0, 300) }; }).slice(0, max);
      },
      files(it) {
        const list = getJSON(`https://images-api.nasa.gov/asset/${enc(it.id)}`).collection.items.map(x => x.href.replace(/^http:/, 'https:'));
        const v = list.filter(u => /\.(mp4|mov|m4v)$/i.test(u));
        const rank = (u) => /~large\.mp4/i.test(u) ? 0 : /~orig\.mp4/i.test(u) ? 1 : /~medium\.mp4/i.test(u) ? 2 : /\.mp4$/i.test(u) && !/~(small|mobile|preview)/i.test(u) ? 3 : 9;
        return v.sort((a, b) => rank(a) - rank(b)).map(u => ({ url: u }));
      },
    },
    svs: { // NASA Scientific Visualization Studio
      search(q, max) {
        const j = getJSON(`https://svs.gsfc.nasa.gov/api/search/?search=${enc(q)}&limit=${max * 3}`);
        return j.results.slice(0, max * 2).map(r => ({ source: 'svs', id: String(r.id), title: r.title, page: r.url.replace(/^http:/, 'https:'), date: r.release_date?.slice(0, 10),
          licence: 'Public domain (NASA Goddard SVS; check the page credits for third-party data)', evidence: 'https://svs.gsfc.nasa.gov/help/#copyright', credit: 'NASA Scientific Visualization Studio', ok: true }));
      },
      files(it) {
        const j = getJSON(`https://svs.gsfc.nasa.gov/api/${it.id}`);
        const out = [];
        const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
          if (typeof o.url === 'string' && /\.(mp4|mov|webm)$/i.test(o.url)) out.push({ url: o.url.replace(/^http:/, 'https:'), width: o.width, height: o.height, size: o.filesize });
          Object.values(o).forEach(walk); };
        walk(j.media_groups ?? j);
        const credits = (j.credits ?? []).map(c => c.person?.name).filter(Boolean); if (credits.length) it.credit += ' (' + credits.slice(0, 3).join(', ') + ')';
        return out.sort((a, b) => Math.abs((a.height ?? 0) - 1080) - Math.abs((b.height ?? 0) - 1080));
      },
    },
    archive: { // archive.org: Prelinger, FedFlix (US government films), NASA, NARA uploads. Licence checked per item.
      search(q, max, o = {}) {
        const coll = o.collection ? ` AND collection:(${o.collection})` : '';
        const j = getJSON(`https://archive.org/advancedsearch.php?q=${enc(`(${q}) AND mediatype:movies${coll}`)}&fl[]=identifier&fl[]=title&fl[]=licenseurl&fl[]=date&fl[]=collection&fl[]=rights&rows=${max * 4}&sort[]=downloads+desc&output=json`);
        return j.response.docs.map(d => {
          const lic = d.licenseurl ?? '', colls = [].concat(d.collection ?? []);
          const gov = colls.some(c => /fedflix|nasa|usgovernmentdocuments|national_archives|usnationalarchives|NARA/i.test(c)) || /^gov\./.test(d.identifier);
          const pd = /publicdomain|zero/i.test(lic);
          // a PD mark set by an arbitrary uploader is not evidence: trust Prelinger, FedFlix and gov.* (NARA / agency) items
          const trusted = gov || colls.includes('prelinger') || /^gov\./.test(d.identifier);
          if (pd && !trusted) return { source: 'archive', id: d.identifier, title: d.title, page: `https://archive.org/details/${d.identifier}`, date: String(d.date ?? '').slice(0, 10), collections: colls,
            licence: `Uploader-marked public domain (${lic}), not a curated PD collection: verify the film's status, then --force`, evidence: lic, credit: 'Internet Archive', ok: false };
          return { source: 'archive', id: d.identifier, title: d.title, page: `https://archive.org/details/${d.identifier}`, date: String(d.date ?? '').slice(0, 10), collections: colls,
            licence: pd ? `Public domain (${lic})` : gov ? 'US Government work (FedFlix / agency upload): public domain' : `Not marked public domain (${lic || 'no licence field'}): skip`,
            evidence: pd ? lic : gov ? 'https://archive.org/details/FedFlix' : '', credit: colls.includes('prelinger') ? 'Prelinger Archives / Internet Archive' : 'Internet Archive' + (gov ? ' (US Government film)' : ''), ok: pd || gov };
        }).slice(0, max * 2);
      },
      files(it) {
        const j = getJSON(`https://archive.org/metadata/${enc(it.id)}`);
        const fl = j.files.filter(f => /\.(mp4|mpeg|mpg|mov|ogv|m4v)$/i.test(f.name));
        const rank = (f) => (/h\.264|mpeg4/i.test(f.format ?? '') && !/512kb|ia\.mp4/i.test(f.name) ? 0 : /\.mp4$/i.test(f.name) && !/512kb/i.test(f.name) ? 1 : /512kb/i.test(f.name) ? 3 : 2);
        // highest resolution first (archive derivatives are often smaller than the MPEG-2 master), then H.264
        return fl.sort((a, b) => (+b.height || 0) - (+a.height || 0) || rank(a) - rank(b) || (+a.size) - (+b.size)).map(f => ({ url: `https://archive.org/download/${enc(it.id)}/${f.name.split('/').map(enc).join('/')}`, size: +f.size, width: +f.width || undefined, height: +f.height || undefined }));
      },
    },
    loc: { // Library of Congress
      search(q, max) {
        const j = getJSON(`https://www.loc.gov/search/?q=${enc(q)}&fa=online-format:video&fo=json&c=${max * 3}`);
        return j.results.map(r => { const rights = [].concat(r.rights_advisory ?? r.rights ?? []).join(' ');
          const ok = /no known restrictions|public domain/i.test(rights);
          return { source: 'loc', id: r.id, title: r.title, page: r.url ?? r.id, date: r.date, licence: ok ? `Public domain / no known restrictions (${rights.slice(0, 120)})` : `Rights: ${rights.slice(0, 160) || 'not stated'}: skip`,
            evidence: r.url ?? r.id, credit: 'Library of Congress' + (r.partof?.length ? ', ' + [].concat(r.partof)[0] : ''), ok }; }).slice(0, max * 2);
      },
      files(it) {
        const j = getJSON(`${it.page.replace(/\/$/, '')}/?fo=json`);
        const out = []; const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o.url === 'string' && /\.(mp4|mov)$/i.test(o.url)) out.push({ url: o.url, width: o.width, height: o.height, size: o.size }); Object.values(o).forEach(walk); };
        walk(j.resources ?? j); walk(j.item?.resources);
        const rs = j.item?.rights_advisory ?? j.item?.rights; if (rs) it.licence = (/no known restrictions|public domain/i.test([].concat(rs).join(' ')) ? 'Public domain / no known restrictions: ' : 'Rights: ') + [].concat(rs).join(' ').slice(0, 200);
        it.ok = /^Public domain/.test(it.licence);
        return out;
      },
    },
    commons: { // Wikimedia Commons: PD / CC0 only (CC BY with --allow-by)
      search(q, max, o = {}) {
        const j = getJSON(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${enc(q + ' filetype:video')}&gsrlimit=${Math.min(50, max * 4)}&prop=imageinfo&iiprop=url|size|extmetadata|mime`);
        const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
        return pages.map(p => { const ii = p.imageinfo?.[0] ?? {}, m = ii.extmetadata ?? {}; const lic = m.LicenseShortName?.value ?? '';
          const pd = /public domain|^pd|cc0/i.test(lic) || /^pd/i.test(m.License?.value ?? ''); const by = /^cc by(-sa)?/i.test(lic);
          const ok = pd || (o['allow-by'] && /^cc by( |$|-\d)/i.test(lic));
          const artist = (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 120);
          return { source: 'commons', id: p.title.replace(/^File:/, ''), title: (m.ObjectName?.value ?? p.title).replace(/<[^>]+>/g, ''), page: ii.descriptionurl, date: (m.DateTimeOriginal?.value ?? '').replace(/<[^>]+>/g, '').slice(0, 10),
            licence: lic + (pd ? '' : by ? ' (attribution required; share-alike if -SA): skip unless --allow-by' : ': skip'), evidence: m.LicenseUrl?.value ?? ii.descriptionurl, credit: artist || 'Wikimedia Commons', ok,
            files: [{ url: ii.url, width: ii.width, height: ii.height, size: ii.size }] }; }).slice(0, max * 2);
      },
      // Commons serves VP9 transcodes next to the original; they are far smaller than 4K .ogv masters. Upload
      // servers rate-limit range reads, so these are downloaded whole (curl, polite UA) and trimmed locally.
      files(it) {
        const o = it.files[0]; const m = /\/commons\/(\w)\/(\w\w)\/([^?]+)/.exec(o.url); if (!m) return it.files;
        const t = (r) => ({ url: `https://upload.wikimedia.org/wikipedia/commons/transcoded/${m[1]}/${m[2]}/${m[3]}/${m[3]}.${r}.vp9.webm`, height: +r.replace('p', ''), local: true });
        return [...(o.height > 1080 ? [t('1080p')] : []), ...(o.height >= 720 ? [t('720p')] : []), { ...o, url: o.url.split('?')[0], local: true }];
      },
    },
    dvids: { // needs a free DVIDS API key in DVIDS_API_KEY (registration). Without one, DVIDS footage is reached via Commons (PD-USGov-Military).
      search(q, max) {
        const k = process.env.DVIDS_API_KEY; if (!k) throw new Error('dvids: set DVIDS_API_KEY (free key from https://api.dvidshub.net), or use --source commons with "DVIDS" in the query');
        const j = getJSON(`https://api.dvidshub.net/search?api_key=${k}&q=${enc(q)}&type[]=video&max_results=${max * 2}`);
        return j.results.map(r => ({ source: 'dvids', id: r.id, title: r.title, page: r.url, date: r.date?.slice(0, 10), licence: 'Public domain (US DoW visual information); DoW endorsement disclaimer requested', evidence: 'https://www.dvidshub.net/about/copyright', credit: `DVIDS / ${r.unit_name ?? 'US DoW'}`, ok: true }));
      },
      files(it) { const k = process.env.DVIDS_API_KEY; const j = getJSON(`https://api.dvidshub.net/asset?api_key=${k}&id=${enc(it.id)}`); return (j.results?.files ?? []).filter(f => /mp4/.test(f.type ?? f.src)).map(f => ({ url: f.src, width: f.width, height: f.height, size: f.size })).sort((a, b) => Math.abs(a.height - 1080) - Math.abs(b.height - 1080)); },
    },
    nara: { // National Archives Catalog API v2 needs an x-api-key (request from Catalog_API@nara.gov). Many NARA films are mirrored on archive.org (FedFlix) and Commons.
      search(q, max) {
        const k = process.env.NARA_API_KEY; if (!k) throw new Error('nara: set NARA_API_KEY (request one from Catalog_API@nara.gov), or use --source archive (FedFlix) / commons');
        const j = getJSON(`https://catalog.archives.gov/api/v2/records/search?q=${enc(q)}&typeOfMaterials=Moving%20Images&availableOnline=true&limit=${max * 2}`, ['-H', `x-api-key: ${k}`]);
        return (j.body?.hits?.hits ?? []).map(h => { const r = h._source.record; return { source: 'nara', id: String(r.naId), title: r.title, page: `https://catalog.archives.gov/id/${r.naId}`, date: r.productionDates?.[0]?.logicalDate?.slice(0, 10),
          licence: (r.useRestriction?.status ?? '') + ' ' + (r.useRestriction?.note?.join?.(' ') ?? ''), evidence: `https://catalog.archives.gov/id/${r.naId}`, credit: 'National Archives and Records Administration', ok: /unrestricted/i.test(r.useRestriction?.status ?? ''),
          files: (r.digitalObjects ?? []).filter(d => /video|mp4/i.test(d.objectType + d.objectUrl)).map(d => ({ url: d.objectUrl, size: d.objectFileSize })) }; });
      },
      files(it) { return it.files; },
    },
    pexels: { // licence allows commercial use and modification; do NOT redistribute the files as-is (keep them out of git)
      search(q, max) {
        const k = process.env.PEXELS_API_KEY; if (!k) throw new Error('pexels: set PEXELS_API_KEY (free key)');
        const j = getJSON(`https://api.pexels.com/videos/search?query=${enc(q)}&per_page=${max}`, ['-H', `Authorization: ${k}`]);
        return j.videos.map(v => ({ source: 'pexels', id: String(v.id), title: v.url.split('/').slice(-2, -1)[0], page: v.url, date: '', licence: 'Pexels licence (free use, no attribution; no redistribution or sale of unaltered copies)', evidence: 'https://www.pexels.com/license/', credit: `${v.user?.name ?? ''} / Pexels`, ok: true,
          files: v.video_files.filter(f => f.file_type === 'video/mp4').sort((a, b) => Math.abs(a.height - 1080) - Math.abs(b.height - 1080)).map(f => ({ url: f.link, width: f.width, height: f.height })) }));
      },
      files(it) { return it.files; },
    },
    pixabay: {
      search(q, max) {
        const k = process.env.PIXABAY_API_KEY; if (!k) throw new Error('pixabay: set PIXABAY_API_KEY (free key)');
        const j = getJSON(`https://pixabay.com/api/videos/?key=${k}&q=${enc(q)}&per_page=${Math.max(3, max)}`);
        return j.hits.map(v => ({ source: 'pixabay', id: String(v.id), title: v.tags, page: v.pageURL, date: '', licence: 'Pixabay Content License (free use; no standalone redistribution or sale)', evidence: 'https://pixabay.com/service/license-summary/', credit: `${v.user} / Pixabay`, ok: true,
          files: ['large', 'medium'].map(s => v.videos[s]).filter(f => f?.url).map(f => ({ url: f.url, width: f.width, height: f.height, size: f.size })) }));
      },
      files(it) { return it.files; },
    },
  };
  S.prelinger = { search: (q, max) => S.archive.search(q, max, { collection: 'prelinger' }), files: S.archive.files };
  S.fedflix = { search: (q, max) => S.archive.search(q, max, { collection: 'FedFlix' }), files: S.archive.files };
  S.noaa = { search: (q, max) => S.commons.search(q + ' NOAA', max), files: S.commons.files };

  function choose(files, minH) {
    const ok = files.filter(f => !f.height || f.height >= minH);
    return (ok.length ? ok : files)[0];
  }

  function save(it, { tag = [], minH = 480, trim = null, id = null } = {}) {
    if (!it.ok && !opt.force) { log(`skip ${it.source}:${it.id} — ${it.licence}`); return null; }
    const files = S[it.source].files(it);
    if (!files?.length) { log(`skip ${it.source}:${it.id} — no downloadable video file`); return null; }
    if (it.source === 'loc' && !it.ok) { log(`skip ${it.id} — ${it.licence}`); return null; }
    const f = choose(files, minH);
    const cid = id ?? `${it.source}-${slug(it.id).slice(0, 48)}`;
    const ext = (f.url.match(/\.(mp4|mov|m4v|webm|ogv|mpeg|mpg)(\?|$)/i)?.[1] ?? 'mp4').toLowerCase();
    let file = path.join(LIB, `${cid}.${trim ? 'mp4' : ext}`);
    const prov = path.join(LIB, `${cid}.json`);
    if (fs.existsSync(file) && fs.existsSync(prov) && !opt.force) { log(`have ${cid}`); return JSON.parse(fs.readFileSync(prov, 'utf8')); }
    fs.mkdirSync(LIB, { recursive: true });
    if (trim && f.local) {
      const raw = path.join(CACHE, 'dl', `${cid}.${ext}`);
      if (!fs.existsSync(raw)) { log(`download ${f.url}`); download(f.url, raw); }
      file = path.join(LIB, `${cid}.mp4`);
      sh('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(trim[0]), '-i', raw, '-t', String(trim[1] - trim[0]), '-map', '0:v:0', '-map', '0:a:0?', '-vf', "scale='min(1920,iw)':-2:flags=lanczos", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', file + '.part.mp4']);
      fs.renameSync(file + '.part.mp4', file); fs.rmSync(raw);
    } else if (trim) {
      // only the useful part, read straight from the server with HTTP range requests (ffmpeg seeks in the
      // remote file, so a 30 s piece of a 2 GB 4K master costs ~30 s of bytes): H.264 CRF 18, <=1080p, audio kept
      file = path.join(LIB, `${cid}.mp4`);
      log(`trim ${trim[0]}-${trim[1]} s of ${f.url}`);
      sh('ffmpeg', ['-y', '-loglevel', 'error', '-user_agent', UA, '-ss', String(trim[0]), '-i', f.url, '-t', String(trim[1] - trim[0]), '-map', '0:v:0', '-map', '0:a:0?', '-vf', "scale='min(1920,iw)':-2:flags=lanczos", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', file + '.part.mp4']);
      fs.renameSync(file + '.part.mp4', file);
    } else {
      const raw = path.join(CACHE, 'dl', `${cid}.${ext}`);
      if (!fs.existsSync(raw)) { log(`download ${f.url}`); download(f.url, raw); }
      if (!['mp4', 'mov', 'm4v'].includes(ext)) {
        file = path.join(LIB, `${cid}.mp4`);
        sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-map', '0:v:0', '-map', '0:a:0?', '-vf', "scale='min(1920,iw)':-2:flags=lanczos", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', file]);
        fs.rmSync(raw);
      } else fs.renameSync(raw, file);
    }
    const pr = probe(file);
    const sha1 = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
    const rec = { id: cid, title: it.title, source: it.source, sourceId: it.id, page: it.page, download: f.url, date: it.date, licence: it.licence, licenceEvidence: it.evidence, credit: it.credit,
      tags: tag, trim, file: path.relative(ROOT, file), bytes: fs.statSync(file).size, sha1, ...pr, fetched: new Date().toISOString().slice(0, 10) };
    fs.writeFileSync(prov, JSON.stringify(rec, null, 1));
    log(`saved ${rec.file} (${(rec.bytes / 1e6).toFixed(1)} MB, ${pr?.width}x${pr?.height}, ${pr?.duration?.toFixed(1)} s) — ${rec.licence}`);
    return rec;
  }

  // ---------------------------------------------------------------- prep (frame sequences)
  function lutFile(name) {
    const d = path.join(CACHE, 'luts'); fs.mkdirSync(d, { recursive: true });
    const G = typeof name === 'object' ? name : GRADES[name];
    const f = path.join(d, `${typeof name === 'object' ? 'g-' + hash(JSON.stringify(name)) : name}.cube`);
    if (!fs.existsSync(f) || opt.force) fs.writeFileSync(f, cube(G));
    return f;
  }
  function resolveFile(f) {
    if (fs.existsSync(path.join(ROOT, f))) return path.join(ROOT, f);
    for (const e of ['mp4', 'mov', 'm4v', 'webm', 'ogv', 'mpeg', 'mpg']) { const p = path.join(LIB, `${f}.${e}`); if (fs.existsSync(p)) return p; }
    throw new Error(`footage: no such clip ${f} (fetch it: node engine/footage.js pack, or get <source> <id>)`);
  }
  function gradeChain(P) {
    const g = typeof P.grade === 'object' && P.grade ? P.grade : { lut: P.grade ?? 'house' };
    const f = [];
    if (g.exposure || g.contrast || g.saturation || g.gamma) f.push(`eq=brightness=${(g.exposure ?? 0).toFixed(3)}:contrast=${(g.contrast ?? 1).toFixed(3)}:saturation=${(g.saturation ?? 1).toFixed(3)}:gamma=${(g.gamma ?? 1).toFixed(3)}`);
    if (g.temp) f.push(`colortemperature=temperature=${Math.round(6500 - g.temp * 1500)}:mix=0.6`);
    if (g.lut && g.lut !== 'none') f.push(`lut3d=file='${lutFile(g.lut).replace(/'/g, "\\'")}':interp=tetrahedral`);
    return f;
  }
  function prepOne(P, fps, W, H) {
    const key = seqKey(P), dir = path.join(CACHE, 'seq', key), metaF = path.join(dir, 'meta.json');
    if (fs.existsSync(metaF) && !opt.force) { const m = JSON.parse(fs.readFileSync(metaF, 'utf8')); if (m.fps === fps && m.w === W) { log(`have ${key} ${P.file} [${P.in ?? 0}, ${P.out ?? '…'}]`); return m; } }
    const src = resolveFile(P.file), pr = probe(src);
    const t0 = +(P.in ?? 0), t1 = Math.min(P.out == null ? t0 + 30 : +P.out, pr.duration);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const res = P.res ?? 1, w = Math.round(W * res / 2) * 2, h = Math.round(H * res / 2) * 2;
    const pre = [];
    if ((P.deint ?? 'auto') === true || ((P.deint ?? 'auto') === 'auto' && pr.field && !/progressive|unknown/.test(pr.field))) pre.push('bwdif=mode=send_frame');
    if (P.crop) pre.push(`crop=${P.crop[2]}:${P.crop[3]}:${P.crop[0]}:${P.crop[1]}`);
    const seek = ['-ss', t0.toFixed(3), '-to', t1.toFixed(3), '-i', src];
    if (P.stab) { // vidstab: detect on the trimmed range, then transform (smooth camera path, crop the moving edge)
      const trf = path.join(dir, 'stab.trf');
      sh('ffmpeg', ['-y', '-loglevel', 'error', ...seek, '-vf', [...pre, `vidstabdetect=shakiness=${P.stab.shakiness ?? 6}:accuracy=12:result='${trf}'`].join(','), '-f', 'null', '-']);
      pre.push(`vidstabtransform=input='${trf}':smoothing=${P.stab.smoothing ?? 30}:zoom=${P.stab.zoom ?? 4}:optzoom=0:interpol=bicubic`);
    }
    const fit = (P.fit ?? 'cover') === 'cover' ? `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}` : `scale=${w}:${h}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`;
    const vf = [...pre, `fps=${fps}`, 'setsar=1', fit, ...gradeChain(P), 'format=yuvj420p'].join(',');
    const t = Date.now();
    sh('ffmpeg', ['-y', '-loglevel', 'error', ...seek, '-vf', vf, '-q:v', String(P.q ?? 3), '-start_number', '1', path.join(dir, '%05d.jpg')]);
    const frames = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
    const m = { key, file: P.file, in: t0, out: t1, fps, w, h, frames, grade: P.grade ?? 'house', stab: !!P.stab, source: pr, prepared: new Date().toISOString() };
    fs.writeFileSync(metaF, JSON.stringify(m, null, 1));
    const mb = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0) / 1e6;
    log(`prep ${key} ${P.file} [${t0}, ${t1.toFixed(2)}] -> ${frames} frames @${fps} ${w}x${h} (${mb.toFixed(0)} MB, ${((Date.now() - t) / 1000).toFixed(1)} s)`);
    return m;
  }
  function stillOne(file, at, grade = 'house') {
    const d = path.join(CACHE, 'stills'); fs.mkdirSync(d, { recursive: true });
    const out = path.join(d, stillKey(file, at, grade) + '.jpg');
    if (!fs.existsSync(out) || opt.force) sh('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(at), '-i', resolveFile(file), '-frames:v', '1', '-vf', ['scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080', ...gradeChain({ grade })].join(','), '-q:v', '2', out]);
    cp.execFileSync('python3', [path.join(ROOT, 'engine', 'depth.py'), out], { stdio: 'inherit' });
    log(`still ${path.relative(ROOT, out)}`); return out;
  }
  // all footage params in a project (shots and beats, recursively): objects with a .file that is a clip
  function footageParams(project) {
    const out = [], seen = new Set();
    const isClip = (f) => typeof f === 'string' && (/\.(mp4|mov|m4v|webm|ogv|mpe?g)$/i.test(f) || fs.existsSync(path.join(LIB, f + '.json')));
    const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
      if (isClip(o.file)) { const k = seqKey(o); if (!seen.has(k)) { seen.add(k); out.push(o); } }
      Object.values(o).forEach(walk); };
    walk(project.shots); walk(project.footage);
    return out;
  }

  // ---------------------------------------------------------------- commands
  const src = opt.source ?? 'nasa', max = +(opt.max ?? 5), tags = opt.tag ? String(opt.tag).split(',') : [];
  if (cmd === 'search') {
    if (!S[src]) throw new Error(`unknown source ${src}: ${Object.keys(S).join(', ')}`);
    const r = S[src].search(pos.slice(1).join(' '), max, opt);
    if (opt.json) console.log(JSON.stringify(r, null, 1));
    else for (const it of r) console.log(`${it.ok ? 'OK  ' : 'SKIP'} ${it.source}:${it.id}\n     ${it.title}\n     ${it.date ?? ''}  ${it.licence}\n     ${it.page}`);
  } else if (cmd === 'fetch') {
    const q = pos.slice(1).join(' '); if (!S[src]) throw new Error(`unknown source ${src}`);
    let n = 0; for (const it of S[src].search(q, max * 2, opt)) { if (n >= max) break; try { if (save(it, { tag: tags, minH: +(opt['min-height'] ?? 480) })) n++; } catch (e) { log(`fail ${it.id}: ${e.message.split('\n')[0]}`); } }
    log(`${n} clip(s) in ${CLIP_DIR}`);
  } else if (cmd === 'get') {
    const [, s, id] = pos; const it = itemById(s, id);
    save(it, { tag: tags, minH: +(opt['min-height'] ?? 480), trim: opt.trim ? String(opt.trim).split(',').map(Number) : null, id: opt.id });
  } else if (cmd === 'files') {
    const it = itemById(pos[1], pos[2]); console.log(it.title, '|', it.licence);
    for (const f of S[it.source === 'archive' ? 'archive' : it.source].files(it)) {
      let size = f.size; if (!size) { try { size = +(/content-length:\s*(\d+)/i.exec(sh('curl', ['-sSIL', '-A', UA, f.url]).split(/\r?\n\r?\n/).filter(Boolean).pop() ?? '')?.[1] ?? 0); } catch { size = 0; } }
      console.log(`${(size / 1e6).toFixed(1).padStart(8)} MB  ${f.width ?? ''}x${f.height ?? ''}  ${f.url}`);
    }
  } else if (cmd === 'pack') {
    const pack = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/footage/pack.json'), 'utf8'));
    const only = opt.only ? String(opt.only).split(',') : null; let bytes = 0, n = 0;
    for (const c of pack.clips) {
      if (only && !c.tags.some(t => only.includes(t))) continue;
      if (opt.dry) { console.log(c.id, c.source, c.sourceId); continue; }
      try { const it = itemById(c.source, c.sourceId); const r = save(it, { tag: c.tags, minH: c.minHeight ?? 480, trim: c.trim ?? null, id: c.id }); if (r) { bytes += r.bytes; n++; } }
      catch (e) { log(`fail ${c.id}: ${e.message.split('\n')[0]}`); }
    }
    log(`pack: ${n} clips, ${(bytes / 1e9).toFixed(2)} GB in ${CLIP_DIR}`);
  } else if (cmd === 'list') {
    const recs = fs.existsSync(LIB) ? fs.readdirSync(LIB).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(LIB, f), 'utf8'))) : [];
    let tot = 0; for (const r of recs) { if (pos[1] && !r.tags?.includes(pos[1])) continue; tot += r.bytes ?? 0;
      console.log(`${r.id.padEnd(52)} ${String(r.width + 'x' + r.height).padEnd(10)} ${(r.duration ?? 0).toFixed(0).padStart(5)} s  ${(r.tags ?? []).join(',').padEnd(22)} ${r.licence.slice(0, 60)}`); }
    console.log(`${recs.length} clips, ${(tot / 1e9).toFixed(2)} GB`);
  } else if (cmd === 'prep') {
    const projDir = path.resolve(pos[1]);
    const mjs = path.join(projDir, 'project.mjs');
    const project = fs.existsSync(mjs) ? (await import(url.pathToFileURL(mjs))).default : JSON.parse(fs.readFileSync(path.join(projDir, 'project.json'), 'utf8'));
    const fps = +(opt.fps ?? project.footageFps ?? project.settings?.fps ?? project.fps ?? 30), W = project.width ?? 1920, H = project.height ?? 1080;
    const list = footageParams(project);
    log(`${list.length} footage sequence(s) @ ${fps} fps`);
    for (const P of list) { prepOne(P, fps, W, H); if (P.parallax) stillOne(P.file, P.parallax.at, P.grade ?? 'house'); }
  } else if (cmd === 'still') {
    stillOne(pos[1], +pos[2], opt.grade ?? 'house');
  } else if (cmd === 'lut') {
    for (const n of pos[1] ? [pos[1]] : Object.keys(GRADES).filter(k => GRADES[k])) log('lut', lutFile(n));
  } else {
    console.log(fs.readFileSync(url.fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 14).join('\n'));
  }

  function itemById(s, id) {
    if (s === 'nasa') { const j = getJSON(`https://images-api.nasa.gov/search?nasa_id=${enc(id)}`); const it = j.collection.items[0]; if (!it) throw new Error('no nasa item ' + id);
      const d = it.data[0]; const third = /©|copyright/i.test(d.description ?? '');
      return { source: 'nasa', id, title: d.title, page: `https://images.nasa.gov/details/${enc(id)}`, date: d.date_created?.slice(0, 10), licence: third ? 'third-party rights named: check' : 'Public domain (NASA media; not subject to US copyright)', evidence: 'https://www.nasa.gov/nasa-brand-center/images-and-media/', credit: `NASA${d.center ? ' / ' + d.center : ''}`, ok: !third }; }
    if (s === 'svs') { const j = getJSON(`https://svs.gsfc.nasa.gov/api/${id}`); return { source: 'svs', id: String(id), title: j.title, page: `https://svs.gsfc.nasa.gov/${id}/`, date: j.release_date?.slice(0, 10), licence: 'Public domain (NASA Goddard SVS)', evidence: 'https://svs.gsfc.nasa.gov/help/#copyright', credit: 'NASA Scientific Visualization Studio', ok: true }; }
    if (['archive', 'prelinger', 'fedflix'].includes(s)) { const m = getJSON(`https://archive.org/metadata/${enc(id)}`).metadata; const lic = m.licenseurl ?? ''; const colls = [].concat(m.collection ?? []);
      const gov = colls.some(c => /fedflix|nasa|usgovernmentdocuments|national_archives|usnationalarchives/i.test(c)) || /^gov\./.test(id); const pd = /publicdomain|zero/i.test(lic) && (gov || colls.includes('prelinger'));
      return { source: 'archive', id, title: m.title, page: `https://archive.org/details/${id}`, date: String(m.date ?? m.year ?? '').slice(0, 10), collections: colls, licence: pd ? `Public domain (${lic})` : gov ? 'US Government work (FedFlix / agency upload): public domain' : `Not marked public domain (${lic || 'none'})`, evidence: pd ? lic : 'https://archive.org/details/FedFlix', credit: (colls.includes('prelinger') ? 'Prelinger Archives / Internet Archive' : 'Internet Archive') + (m.creator ? ` / ${[].concat(m.creator)[0]}` : ''), ok: pd || gov }; }
    if (s === 'commons') { const it = S.commons.search(`"${id.replace(/\.[a-z0-9]+$/i, '')}"`, 8, opt).find(x => x.id === id) ?? (() => {
        const j = getJSON(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${enc('File:' + id)}&prop=imageinfo&iiprop=url|size|extmetadata`); const p = Object.values(j.query.pages)[0]; const ii = p.imageinfo[0], m = ii.extmetadata; const lic = m.LicenseShortName?.value ?? '';
        const pd = /public domain|^pd|cc0/i.test(lic); return { source: 'commons', id, title: (m.ObjectName?.value ?? id).replace(/<[^>]+>/g, ''), page: ii.descriptionurl, date: (m.DateTimeOriginal?.value ?? '').replace(/<[^>]+>/g, '').slice(0, 10), licence: lic, evidence: m.LicenseUrl?.value ?? ii.descriptionurl, credit: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 120) || 'Wikimedia Commons', ok: pd || (opt['allow-by'] && /^cc by/i.test(lic)), files: [{ url: ii.url, width: ii.width, height: ii.height }] }; })();
      return it; }
    if (s === 'loc') { const j = getJSON(`https://www.loc.gov/item/${enc(id)}/?fo=json`); const rs = [].concat(j.item?.rights_advisory ?? j.item?.rights ?? []).join(' ');
      return { source: 'loc', id, title: j.item?.title, page: `https://www.loc.gov/item/${id}/`, date: j.item?.date, licence: (/no known restrictions|public domain/i.test(rs) ? 'Public domain / no known restrictions: ' : 'Rights: ') + rs.slice(0, 200), evidence: `https://www.loc.gov/item/${id}/`, credit: 'Library of Congress', ok: /no known restrictions|public domain/i.test(rs) }; }
    throw new Error(`get: unsupported source ${s}`);
  }
}

if (IS_NODE) {
  const { fileURLToPath } = await import('node:url');
  if (process.argv[1] && fileURLToPath(import.meta.url) === (await import('node:path')).resolve(process.argv[1])) {
    cli(process.argv.slice(2)).catch(e => { console.error('[footage] error:', e.message); process.exit(1); });
  }
}
