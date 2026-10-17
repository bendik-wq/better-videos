// PANAMA clay kit: the bright house blend (docs/library/bright-style/STYLE.md §13) as reusable parts.
// Exposed to every set library as H.CLAY (and, for blackout compatibility, its generic helpers as H.LW).
//
//   maths      clamp lerp range sstep smoother outCubic inCubic inOut hash rng noise1 cue typed typeCount
//   look       HOUSE (scene parameters), PAL (graphics palette = LK 'bright-model'), FONT, RED
//   three      mat(hex, rough) | water(opts) | brightLight(scene, opts) | gradientBg(top, horizon) | instanced(geo, mat, items)
//              BOX (unit box, base at y = 0) | slab(opts) (cut-away diorama block with layered earth sides)
//              terrain(opts) (heightfield mesh with vertex colours) | trees(items) | ship(kind, opts) | rain(opts)
//   DOM        pill / slab / leader / counter labels (positioned in 1080p units, scaled by sc())
// Everything is a pure function of t: no Math.random, no clock.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hullGeometry } from '/engine/sea/ships.js';

// ---------------------------------------------------------------- maths
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const sstep = (a, b, x) => { const u = range(x, a, b); return u * u * (3 - 2 * u); };
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const inCubic = (x) => Math.pow(clamp(x), 3);
export const inOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
export function rng(seed = 1) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, seed), hash(i + 1, seed), u); }
export function noise2(x, y, seed = 0) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(i, j, seed), b = hash(i + 1, j, seed), c = hash(i, j + 1, seed), d = hash(i + 1, j + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export const fbm = (x, y, seed = 0, oct = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < oct; k++) { s += a * noise2(x * f, y * f, seed + k * 17); n += a; a *= 0.5; f *= 2.03; } return s / n; };
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
// shot-relative time of a spoken word: 'word', 'word@2' (nth hit), 'word+0.4'; a number passes through;
// `fallback` when the VO doesn't say it (or there is no VO yet)
export function cue(shot, spec, fallback) {
  if (spec === undefined || spec === null) return fallback;
  if (typeof spec === 'number') return spec;
  if (typeof spec === 'object') return cue(shot, spec.word, spec.at ?? fallback);
  const m = String(spec).match(/^(.+?)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) return fallback;
  const [, word, nth, off] = m;
  if (/^-?[\d.]+$/.test(word)) return Number(word) + Number(off ?? 0);
  const hits = (shot?.words ?? []).filter(x => norm(x.w).startsWith(norm(word)));
  const t = hits.length ? (hits[Number(nth ?? 0)] ?? hits.at(-1)).s : fallback;
  return (t ?? 0) + Number(off ?? 0);
}
export function typed(text, n) { return String(text).slice(0, Math.max(0, Math.floor(n))); }
export function typeCount(text, t, at, cps = 30) { return clamp((t - at) * cps, 0, String(text).length); }
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); c.g = c.getContext('2d', { willReadFrequently: true }); return c; }
export function reset(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowBlur = 0; g.lineCap = 'round'; g.lineJoin = 'round'; }

// ---------------------------------------------------------------- look
export const HOUSE = {
  sunEl: 40, sunAz: 235, sun: '#fff6ea', sunI: 3.9,
  hemiSky: '#bcd6f0', hemiGround: '#e9dcc6', hemiI: 0.78,
  bgTop: '#8dbbe5', bgHorizon: '#e7eff4',
  fog: '#dfe9f1', fogNear: 900, fogFar: 6000,
  clay: '#f4f4f1', clay2: '#ecebe7', ground: '#d6d8d8', plate: '#e8e9e7', concrete: '#e9e6df', concreteWet: '#cfd3d2',
  water: '#58c4c0', waterDeep: '#2f9fae', shallow: '#bfe5df', park: '#cbd9b1', tree: '#9fc184', jungle: '#86b673', jungle2: '#a9c98e',
  red: '#e0241b', coral: '#ff7a5c', lavender: '#b9a9ef', yellow: '#ffd23f', navy: '#0f1e33', sky: '#9cc7ea',
  land: '#ece3d1', landSide: '#cbbd9f', sea: '#5fb8bb', void: '#dde5ec', mud: '#d9c7a6',
  strata: ['#d8c49a', '#c7a77b', '#b08a62', '#93704f'],
  ao: { radius: 10, intensity: 3.0, falloff: 1.0 },
  tone: 'neutral',
};
export const PAL = {
  bg: '#eef2f5', paper: '#fbfaf7', clay: '#f4f4f1', void: '#dde5ec', ink: '#0f1e33', inkSoft: '#46536a', accent: '#e0241b',
  coral: '#ff7a5c', lavender: '#b9a9ef', yellow: '#ffd23f', sea: '#7cc4c0', seaDeep: '#4fa9ab', shallow: '#bfe5df', sand: '#e6cf9f',
  land: '#ece3d1', landSide: '#cbbd9f', water: '#7cc4c0', sky: '#9cc7ea', park: '#cbd9b1', grid: 'rgba(15,30,51,0.10)',
  plate: '#0b0b0b', plateInk: '#ffffff', pill: '#fbf8f2', pillInk: '#0f1e33', shadow: '0 2px 14px rgba(15,30,51,0.28)', sun: '#fff6ea', navy: '#0f1e33',
  turquoise: '#3fbfbf', jungle: '#86b673', red: '#e0241b',
};
export const RED = PAL.red;
export const FONT = { display: "'Archivo Narrow'", ui: "'Archivo Narrow'", serif: "'Instrument Serif'", mono: "'Plex Mono'", term: "'Plex Mono'" };
export async function loadFonts() { try { await Promise.all(['700 40px "Archivo Narrow"', '40px "Instrument Serif"', 'italic 40px "Instrument Serif"', '500 40px "Plex Mono"'].map(f => document.fonts.load(f))); } catch { /* stage preloads them */ } }

// ---------------------------------------------------------------- three: materials and light
const col = (h) => new THREE.Color(h);
const MATS = new Map();
export function mat(hex, rough = 0.86, o = {}) {
  const k = `${hex}|${rough}|${JSON.stringify(o)}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color: col(hex), roughness: rough, metalness: 0, ...o }));
  return MATS.get(k);
}
export const BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
export function gradientBg(top, horizon, split = 0.62) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, top); g.addColorStop(split, horizon); g.addColorStop(1, horizon);
  x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function sunDir(el = HOUSE.sunEl, az = HOUSE.sunAz) { const e = el * Math.PI / 180, a = az * Math.PI / 180; return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)); }
// sun + cool sky fill + haze. Returns the sun; sun.track(target) re-centres the shadow frustum (for long moves).
export function brightLight(scene, { target = [0, 0, 0], span = 900, fog = true, bg = [HOUSE.bgTop, HOUSE.bgHorizon], fogC = HOUSE.fog, near = HOUSE.fogNear, far = HOUSE.fogFar,
  mapSize = 2048, el = HOUSE.sunEl, az = HOUSE.sunAz, sunI = HOUSE.sunI, hemiI = HOUSE.hemiI, env = true } = {}) {
  const dir = sunDir(el, az);
  const sun = new THREE.DirectionalLight(col(HOUSE.sun), sunI);
  sun.castShadow = true; sun.shadow.mapSize.set(mapSize, mapSize);
  const sc = sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = span * 0.5; sc.far = span * 6;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = span / 900 * 0.6;
  sun.dir = dir;
  sun.track = (p, s = span) => {
    const T = p.isVector3 ? p : new THREE.Vector3(...p);
    sun.target.position.copy(T); sun.position.copy(T).addScaledVector(dir, s * 3);
    if (s !== sc.right) { sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = s * 0.5; sc.far = s * 6; sun.shadow.normalBias = s / 900 * 0.6; sc.updateProjectionMatrix(); }
    sun.target.updateMatrixWorld();
  };
  sun.track(target);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(col(HOUSE.hemiSky), col(HOUSE.hemiGround), hemiI); scene.add(hemi); sun.hemi = hemi;
  scene.background = gradientBg(...bg);
  if (fog) scene.fog = new THREE.Fog(col(fogC), near, far);
  if (env) scene.environment = skyEnv();
  return sun;
}
// a tiny equirect sky (zenith blue -> white horizon -> warm ground) for water and wet-concrete reflections
let ENV = null;
export function skyEnv() {
  if (ENV) return ENV;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#5f9ad8'); gr.addColorStop(0.32, '#9cc7ea'); gr.addColorStop(0.49, '#eef4f8'); gr.addColorStop(0.52, '#d9d3c4'); gr.addColorStop(1, '#a7a08f');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  // the sun (az 235, el 40) as a soft hot spot, so glints have a source in reflections too
  const sx = ((235 / 360) * 256 + 64) % 256, sy = (0.5 - 40 / 180) * 128, rg = g.createRadialGradient(sx, sy, 0, sx, sy, 14);
  rg.addColorStop(0, 'rgba(255,250,235,1)'); rg.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  return ENV = t;
}
export function instanced(geo, material, items, { cast = true, receive = true } = {}) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, items.length)), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  items.forEach((it, i) => {
    e.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1)); im.setMatrixAt(i, m);
    if (it.c) im.setColorAt(i, col(it.c));
  });
  im.count = items.length;
  im.castShadow = cast; im.receiveShadow = receive; return im;
}
export const merge = (list) => mergeGeometries(list.filter(Boolean).map(g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) n.deleteAttribute(k); return n; }));
