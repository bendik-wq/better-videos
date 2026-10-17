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
  hemiSky: '#bcd6f0', hemiGround: '#e9dcc6', hemiI: 0.95,
  bgTop: '#8dbbe5', bgHorizon: '#e7eff4',
  fog: '#dfe9f1', fogNear: 900, fogFar: 6000,
  clay: '#f4f4f1', clay2: '#ecebe7', ground: '#d6d8d8', plate: '#e8e9e7', concrete: '#efece6', concreteWet: '#d3d8d7',
  water: '#46abad', waterDeep: '#2f9fae', shallow: '#bfe5df', park: '#cbd9b1', tree: '#9fc184', jungle: '#86b673', jungle2: '#a9c98e',
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
export function brightLight(scene, { target = [0, 0, 0], span = 900, fog = true, bg = [HOUSE.bgTop, HOUSE.bgHorizon], fogC = HOUSE.fog, fogNear = null, fogFar = null, near = fogNear ?? HOUSE.fogNear, far = fogFar ?? HOUSE.fogFar,
  mapSize = 2048, el = HOUSE.sunEl, az = HOUSE.sunAz, sunI = HOUSE.sunI, hemiI = HOUSE.hemiI, env = false, fill = 0.5 } = {}) {
  const dir = sunDir(el, az);
  const sun = new THREE.DirectionalLight(col(HOUSE.sun), sunI);
  sun.castShadow = true; sun.shadow.mapSize.set(mapSize, mapSize);
  const sc = sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = span * 0.5; sc.far = span * 6;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = span / 900 * 0.6;
  sun.dir = dir;
  sun.track = (p, s = span) => {
    const T = p.isVector3 ? p : new THREE.Vector3(...p);
    sun.target.position.copy(T); sun.position.copy(T).addScaledVector(dir, s * 3);
    if (s !== sun.__span) { sun.__span = s; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = s * 0.5; sc.far = s * 6; sun.shadow.normalBias = s / 900 * 0.6; sc.updateProjectionMatrix(); }
    sun.target.updateMatrixWorld();
  };
  sun.track(target);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(col(HOUSE.hemiSky), col(HOUSE.hemiGround), hemiI); scene.add(hemi); sun.hemi = hemi;
  // a cool, high fill from the opposite side (no shadows): shade reads blue-grey, never black (STYLE.md §3)
  if (fill > 0) { const f = new THREE.DirectionalLight(col('#cfe0f2'), fill); f.position.copy(sunDir(32, az + 180)).multiplyScalar(1000); f.target.position.set(0, 0, 0); scene.add(f, f.target); sun.fill = f; }
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

// ---------------------------------------------------------------- water: turquoise, glittering, animated in t
// Tileable value-noise height -> tangent normal map (built once).
let NTEX = null;
export function noiseNormal(N = 256, seed = 5) {
  if (NTEX) return NTEX;
  const P = 16, h = new Float32Array(N * N);
  const pn = (x, y, p, s) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const H = (a, b) => hash(((a % p) + p) % p, ((b % p) + p) % p, s); return lerp(lerp(H(i, j), H(i + 1, j), u), lerp(H(i, j + 1), H(i + 1, j + 1), u), v); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0, a = 1, n = 0; for (let o = 0, p = P / 4; o < 5; o++, p *= 2) { s += a * pn(x / N * p, y / N * p, p, seed + o); n += a; a *= 0.55; }
    h[y * N + x] = s / n;
  }
  const c = canvas(N, N), g = c.g, img = g.createImageData(N, N), d = img.data, H = (x, y) => h[((y + N) % N) * N + ((x + N) % N)], k = 9;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (-dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return NTEX = t;
}
// water material. scale: metres per noise tile; strength: normal strength; glint: sparkle gain; flow: [vx, vz] m/s drift.
// mat.tick(t) every frame (pure in t). Works on any mesh (world-space UVs), so chambers, lakes and the sea match.
export function water({ color = HOUSE.water, rough = 0.07, scale = 26, strength = 0.32, glint = 2.2, flow = [0.35, 0.22], opacity = 1, sun = null, side = THREE.FrontSide, depthWrite = true } = {}) {
  const U = { uT: { value: 0 }, uScale: { value: scale }, uStr: { value: strength }, uGlint: { value: glint }, uFlow: { value: new THREE.Vector2(...flow) },
    uSun: { value: (sun ?? sunDir()).clone().normalize() } };
  const m = new THREE.MeshStandardMaterial({ color: col(color), roughness: rough, metalness: 0, normalMap: noiseNormal(), envMap: skyEnv(), transparent: opacity < 1, opacity, side, depthWrite, envMapIntensity: 0.55 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWUv; uniform float uScale;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWUv = (modelMatrix * vec4(transformed, 1.)).xz / uScale;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWUv; uniform float uT, uStr, uGlint; uniform vec2 uFlow; uniform vec3 uSun;')
      .replace('#include <normal_fragment_maps>', /* glsl */`
        vec2 wu = vWUv;
        vec3 n1 = texture2D(normalMap, wu + uFlow * uT / 26.).xyz * 2. - 1.;
        vec3 n2 = texture2D(normalMap, wu * 2.3 + vec2(-uFlow.y, uFlow.x) * uT / 19. + .37).xyz * 2. - 1.;
        vec3 n3 = texture2D(normalMap, wu * 7.1 - uFlow * uT / 9. + .71).xyz * 2. - 1.;
        vec3 mapN = normalize(vec3((n1.xy + .6 * n2.xy + .35 * n3.xy) * uStr, 1.));
        mat3 tbnW = getTangentFrame(-vViewPosition, normal, wu);
        normal = normalize(tbnW * mapN);
        // sun glitter: a sharp specular lobe on the high-frequency normal, added as emission (so it blooms in the finish)
        vec3 sv = normalize((viewMatrix * vec4(uSun, 0.)).xyz), vv = normalize(vViewPosition);
        vec3 ng = normalize(tbnW * normalize(vec3(n3.xy * 3.2 + n2.xy * 1.4, 1.)));
        float gl = pow(max(dot(reflect(-vv, ng), sv), 0.), 260.) * uGlint * 9.;
        totalEmissiveRadiance += vec3(1., .97, .9) * gl;`);
  };
  m.customProgramCacheKey = () => 'panama-water';
  m.tick = (t) => { U.uT.value = t; return m; };
  m.U = U;
  return m;
}
// soft drop shadow under a floating diorama (the void floor)
export function catcher(y, { size = 6000, opacity = 0.14 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity })); m.position.y = y; m.receiveShadow = true; return m;
}
export function plane(w, d, material, { y = 0, x = 0, z = 0, seg = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, seg, seg).rotateX(-Math.PI / 2), material); m.position.set(x, y, z); m.receiveShadow = true; return m;
}

// ---------------------------------------------------------------- terrain: a heightfield, optionally as a cut-away diorama block
// height(x, z) -> y (world); color(x, z, y, slope) -> '#hex' | [r, g, b] (linear-ish 0..1, sRGB hex preferred).
// base: the block's bottom (y); sides: true for Primal-style layered earth sides; strata: [[depthBelowTop, '#hex'], ...]
// (bands follow the surface: the first band is the topsoil, the rest fill to the base).
const _c = new THREE.Color();
const toCol = (c) => (Array.isArray(c) ? _c.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace) : _c.set(c));
export function terrain({ w, d, nx = 128, nz = 128, cx = 0, cz = 0, height, color, base = null, sides = false, strata = null, rough = 0.93, skirt = 0, hole = null, flat = false } = {}) {
  const pos = [], cols = [], idx = [], X = (i) => cx - w / 2 + w * i / nx, Z = (j) => cz - d / 2 + d * j / nz;
  const H = []; for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = X(i), z = Z(j), y = height(x, z); H.push(y); pos.push(x, y, z); }
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i, hx = (H[j * (nx + 1) + Math.min(nx, i + 1)] - H[j * (nx + 1) + Math.max(0, i - 1)]) / (2 * w / nx), hz = (H[Math.min(nz, j + 1) * (nx + 1) + i] - H[Math.max(0, j - 1) * (nx + 1) + i]) / (2 * d / nz);
    toCol(color(pos[k * 3], pos[k * 3 + 2], H[k], Math.hypot(hx, hz), hx, hz)); cols.push(_c.r, _c.g, _c.b);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (hole && hole(X(i + 0.5), Z(j + 0.5))) continue;
    const a = j * (nx + 1) + i, b = a + nx + 1; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0, flatShading: flat });
  const top = new THREE.Mesh(g, material); top.castShadow = top.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(top); grp.top = top; grp.height = height;
  if (sides && base !== null) grp.add(blockSides({ w, d, nx, nz, cx, cz, height, base, strata }));
  if (skirt) { // a curtain hanging under the border (hides cracks between nested terrains)
    grp.add(blockSides({ w, d, nx, nz, cx, cz, height, base: null, skirt, strata: [[1e9, '#b9b7a8']] }));
  }
  return grp;
}
// the four layered earth sides of a diorama block
export function blockSides({ w, d, nx, nz, cx = 0, cz = 0, height, base, strata = null, skirt = 0 }) {
  const S = strata ?? [[1.4, '#a4b37e'], [6, HOUSE.strata[0]], [14, HOUSE.strata[1]], [26, HOUSE.strata[2]], [1e9, HOUSE.strata[3]]];
  const pos = [], cols = [], nrm = [];
  const edges = [ // [x0, z0, x1, z1, n, outward normal]
    [cx - w / 2, cz + d / 2, cx + w / 2, cz + d / 2, nx, [0, 0, 1]], [cx + w / 2, cz + d / 2, cx + w / 2, cz - d / 2, nz, [1, 0, 0]],
    [cx + w / 2, cz - d / 2, cx - w / 2, cz - d / 2, nx, [0, 0, -1]], [cx - w / 2, cz - d / 2, cx - w / 2, cz + d / 2, nz, [-1, 0, 0]]];
  for (const [x0, z0, x1, z1, n, N] of edges) for (let i = 0; i < n; i++) {
    const xa = lerp(x0, x1, i / n), za = lerp(z0, z1, i / n), xb = lerp(x0, x1, (i + 1) / n), zb = lerp(z0, z1, (i + 1) / n);
    const ya = height(xa, za), yb = height(xb, zb), bot = base ?? Math.min(ya, yb) - skirt;
    let da = 0;
    for (const [th, c] of S) {
      const d0 = da, d1 = da + th; da = d1;
      const a0 = Math.max(bot, ya - d0), a1 = Math.max(bot, ya - d1), b0 = Math.max(bot, yb - d0), b1 = Math.max(bot, yb - d1);
      if (a0 <= bot && b0 <= bot) break;
      toCol(c);
      pos.push(xa, a0, za, xa, a1, za, xb, b0, zb, xb, b0, zb, xa, a1, za, xb, b1, zb);
      for (let k = 0; k < 6; k++) { cols.push(_c.r, _c.g, _c.b); nrm.push(...N); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true;
  return m;
}
// a flat strata box (simple slab: plinths, cut faces), base at y0, top at y1
export function slab({ w, d, y0 = -30, y1 = 0, x = 0, z = 0, top = HOUSE.park, strata = null } = {}) {
  return terrain({ w, d, nx: 1, nz: 1, cx: x, cz: z, height: () => y1, color: () => top, base: y0, sides: true, strata });
}

// ---------------------------------------------------------------- vegetation, houses
const TREE = new THREE.IcosahedronGeometry(1, 1);
const TREE0 = new THREE.IcosahedronGeometry(1, 0);
// items: [{ x, y, z, s }] -> instanced soft blobs, two greens; low: 20-face blobs for far shots
export function trees(items, { colors = [HOUSE.jungle, HOUSE.jungle2, '#7aa866', '#98bf7f'], seed = 3, low = false, squash = 0.85 } = {}) {
  const r = rng(seed);
  return instanced(low ? TREE0 : TREE, mat('#ffffff', 0.95), items.map(t => ({ x: t.x, y: t.y + t.s * squash * 0.7, z: t.z, sx: t.s, sy: t.s * squash, sz: t.s, ry: r() * 6, c: t.c ?? colors[Math.floor(r() * colors.length)] })), { cast: !low, receive: true });
}
// scatter points over a heightfield where ok(x, z, y) holds (deterministic)
export function scatter(n, { x0, x1, z0, z1, height, ok = () => true, seed = 1, s = [6, 12], tries = 6 } = {}) {
  const r = rng(seed), out = [];
  for (let k = 0; k < n * tries && out.length < n; k++) { const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), y = height(x, z); if (ok(x, z, y)) out.push({ x, y, z, s: lerp(s[0], s[1], r()) }); }
  return out;
}
const ROOF = new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
// clay houses: [{ x, y, z, w, d, h, ry }] -> walls (warm whites) + hip roofs (terracotta / pastel)
export function houses(items, { seed = 4, roofs = ['#d9825a', '#e0a07a', '#c97a5c', '#b9a9ef', '#e8c64a'], walls = ['#f6f1e8', '#f2e6d4', '#efe9df', '#f7f4ee'] } = {}) {
  const r = rng(seed), g = new THREE.Group();
  g.add(instanced(BOX, mat('#ffffff', 0.9), items.map(h => ({ x: h.x, y: h.y, z: h.z, sx: h.w, sy: h.h, sz: h.d, ry: h.ry ?? 0, c: walls[Math.floor(r() * walls.length)] }))));
  g.add(instanced(ROOF, mat('#ffffff', 0.85), items.map(h => ({ x: h.x, y: h.y + h.h, z: h.z, sx: h.w * 1.15, sy: h.h * 0.55, sz: h.d * 1.15, ry: h.ry ?? 0, c: roofs[Math.floor(r() * (roofs.length - 2))] }))));
  return g;
}

// ---------------------------------------------------------------- rain: streaks falling, pure in t (one draw call)
// box: [x0, x1, y0, y1, z0, z1]; speed m/s; len streak length (m). mat.tick(t). Fades at top and bottom.
export function rain({ box, count = 4000, speed = 9, len = 1.2, color = '#dfeaf4', opacity = 0.55, seed = 2, wind = [0.8, 0] } = {}) {
  const r = rng(seed), p = new Float32Array(count * 6);
  const [x0, x1, y0, y1, z0, z1] = box;
  for (let i = 0; i < count; i++) { const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); p.set([x, 0, z, x, 0, z], i * 6); }
  const phase = new Float32Array(count * 2), end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) { const f = hash(i, seed); phase[i * 2] = phase[i * 2 + 1] = f; end[i * 2] = 0; end[i * 2 + 1] = 1; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(phase, 1)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const U = { uT: { value: 0 }, uY0: { value: y0 }, uY1: { value: y1 }, uSpeed: { value: speed }, uLen: { value: len }, uCol: { value: col(color) }, uOp: { value: opacity }, uWind: { value: new THREE.Vector2(...wind) }, uOn: { value: 1 } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `attribute float aPh, aEnd; uniform float uT, uY0, uY1, uSpeed, uLen; uniform vec2 uWind; varying float vA;
      void main() { float H = uY1 - uY0; float y = uY1 - mod(uT * uSpeed + aPh * H, H); float k = (uY1 - y) / uSpeed;
        vec3 p = position; p.y = y + aEnd * uLen; p.xz += uWind * (k - aEnd * uLen / uSpeed);
        vA = smoothstep(uY0, uY0 + H * .12, y) * (1. - smoothstep(uY1 - H * .1, uY1, y));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform vec3 uCol; uniform float uOp, uOn; varying float vA; void main() { gl_FragColor = vec4(uCol, uOp * vA * uOn); }` });
  const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false;
  ls.tick = (t, on = 1) => { U.uT.value = t; U.uOn.value = on; ls.visible = on > 0.002; };
  return ls;
}

// ---------------------------------------------------------------- flow arrows: chevrons moving along a polyline, pure in t
const CHEV = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.9, 0.7); s.lineTo(-0.55, 0.7); s.lineTo(0.35, 0); s.lineTo(-0.55, -0.7); s.lineTo(-0.9, -0.7); s.closePath();
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2); })();
export function arrows(points, { count = 12, size = 4, speed = 6, color = '#ffffff', opacity = 0.95, lift = 0.2, vertical = false } = {}) {
  const pts = points.map(p => new THREE.Vector3(...p)), curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), L = curve.getLength();
  const m = new THREE.MeshBasicMaterial({ color: col(color), transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(CHEV, m, count); im.frustumCulled = false;
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  im.tick = (t, on = 1) => {
    im.visible = on > 0.002; m.opacity = opacity * on;
    for (let i = 0; i < count; i++) {
      const u = ((t * speed / L + i / count) % 1 + 1) % 1, p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const fade = Math.min(1, u * 6, (1 - u) * 6);
      if (vertical) { const m3 = new THREE.Matrix4().lookAt(new THREE.Vector3(), tg, Math.abs(tg.y) > 0.9 ? X : up); q.setFromRotationMatrix(m3).multiply(new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2)); }
      else q.setFromUnitVectors(X, new THREE.Vector3(tg.x, 0, tg.z).normalize());
      sc.setScalar(size * fade); M4.compose(p.clone().add(new THREE.Vector3(0, lift, 0)), q, sc); im.setMatrixAt(i, M4);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  im.tick(0); return im;
}

// ---------------------------------------------------------------- ships: clay-white, on the engine/sea lofted hull
// kind: 'lpg' (pressurised LPG carrier: three horizontal deck tanks) | 'tanker' | 'container' | 'bulk' | 'ancon' (1914
// steamer) | 'tug'. Local frame: +x forward (bow at +L/2), y up, waterline y = 0. Returns a Group with userData { L, B, T, D }.
// accent: the one saturated colour (funnel band); pass null for none.
const SHIPS = {
  lpg: { L: 225, B: 32.2, D: 22, T: 11, mid: [0.24, 0.7] }, tanker: { L: 228, B: 32.2, D: 21, T: 12, mid: [0.2, 0.74] },
  container: { L: 294, B: 32.2, D: 24, T: 12, mid: [0.22, 0.68] }, neo: { L: 366, B: 49, D: 30, T: 14, mid: [0.22, 0.68] },
  bulk: { L: 225, B: 32.2, D: 20, T: 12, mid: [0.2, 0.75] }, ancon: { L: 149, B: 17.7, D: 12, T: 7, mid: [0.3, 0.62] }, tug: { L: 32, B: 12, D: 5.5, T: 3.5, mid: [0.3, 0.5] },
};
export function ship(kind = 'lpg', o = {}) {
  const S = { ...SHIPS[kind] ?? SHIPS.lpg, ...o }, { L, B, D, T } = S, r = rng(o.seed ?? 7);
  const g = new THREE.Group(); g.userData = { kind, L, B, D, T };
  const hg = hullGeometry({ L, B, D, T, mid: S.mid, entry: kind === 'ancon' ? 1.4 : 1.9, run: 2.3, rake: kind === 'ancon' ? 1 : 5, flare: 0.12, bulb: kind !== 'ancon' && kind !== 'tug', transom: kind === 'tug' ? 0.85 : 0.72, bilge: B * 0.08, sheer: kind === 'ancon' ? 2.5 : 1.2, overhang: 4 });
  // two-tone by height: soft slate below the waterline, a navy boot-top, white topsides
  const hull = hg.hull, P = hull.attributes.position, cc = new Float32Array(P.count * 3);
  const top = col(o.hull ?? (kind === 'ancon' ? '#2f3540' : '#f7f6f2')), boot = col(o.boot ?? '#2d3f55'), bot = col(o.bottom ?? '#7d97a8');
  for (let i = 0; i < P.count; i++) { const y = P.getY(i), c = y < -0.4 ? bot : y < 0.9 ? boot : top; cc.set([c.r, c.g, c.b], i * 3); }
  hull.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  const hm = new THREE.Mesh(hull, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide })); hm.castShadow = hm.receiveShadow = true; g.add(hm);
  g.add(new THREE.Mesh(hg.transom, mat(o.hull ?? '#f2f1ec', 0.55)));
  const yd = D - T, deck = new THREE.Mesh(hg.deck, mat(o.deck ?? (kind === 'ancon' ? '#d9c9a8' : '#cdd5c8'), 0.85)); deck.receiveShadow = true; g.add(deck);
  const W = mat('#f6f5f1', 0.6), G = mat('#d9dcd8', 0.7), N = mat('#33465c', 0.4), Y = mat('#e9e3d2', 0.7);
  const parts = { w: [], g: [], n: [], y: [], a: [] };
  const box = (sx, sy, sz, x, y, z, k = 'w') => parts[k].push(new THREE.BoxGeometry(sx, sy, sz).translate(x, y + sy / 2, z));
  const cyl = (r0, h, x, y, z, k = 'w', axis = 'y', seg = 24) => { const c = new THREE.CylinderGeometry(r0, r0, h, seg); if (axis === 'x') c.rotateZ(Math.PI / 2); if (axis === 'z') c.rotateX(Math.PI / 2); parts[k].push(c.translate(x, y, z)); };
  // accommodation (aft, or forward of the stern for the container ship): decks, bridge with wings, window band, funnel
  const house = (x, decks = 6, wid = B * 0.78, len = 16) => {
    const dh = 2.9; for (let k = 0; k < decks; k++) box(len - k * 0.4, dh, wid - (k === decks - 1 ? 0 : 2), x - k * 0.2, yd + k * dh, 0);
    box(4.5, 1.1, B * 0.98, x + len / 2 - 2.6, yd + decks * dh - dh, 0);                         // bridge wings
    box(len * 0.12, 1.25, wid - 1.6, x + len / 2 - 0.1 - len * 0.06 + 0.15, yd + (decks - 1) * dh + 1.0, 0, 'n'); // bridge windows
    for (let k = 1; k < decks - 1; k++) box(0.3, 0.9, wid - 3.0, x + len / 2 - k * 0.2 + 0.02, yd + k * dh + 1.1, 0, 'n');
    box(len * 0.7, 0.6, wid * 0.7, x - 1, yd + decks * dh, 0, 'g');
    // funnel aft of the house
    const fx = x - len / 2 - 3, fy = yd + 2 * dh; box(7, decks * dh - dh, 5.5, fx, fy, 0, 'w');
    if (o.accent !== null) box(7.06, 1.6, 5.56, fx, fy + decks * dh - dh - 3.2, 0, 'a'); box(7.1, 0.7, 5.6, fx, fy + decks * dh - dh, 0, 'n');
  };
  if (kind === 'lpg') {
    house(-L / 2 + 26);
    const R = B * 0.29, xs = [-L / 2 + 64, -L / 2 + 116, -L / 2 + 168];
    for (const x of xs) { cyl(R, 46, x, yd + R * 0.72, 0, 'w', 'x', 40); parts.w.push(new THREE.SphereGeometry(R, 32, 12).scale(0.35, 1, 1).translate(x + 23, yd + R * 0.72, 0), new THREE.SphereGeometry(R, 32, 12).scale(0.35, 1, 1).translate(x - 23, yd + R * 0.72, 0));
      box(6, R * 0.6, B * 0.7, x, yd, 0, 'g'); cyl(1.6, 2.4, x, yd + R * 1.72 + 1.0, 0, 'g', 'y', 12); }
    box(xs[2] - xs[0] + 50, 1.2, 2.2, (xs[0] + xs[2]) / 2, yd + R * 1.72 + 0.4, 0, 'g');                    // catwalk over the tanks
    box(16, 3.2, B * 0.62, L / 2 - 18, yd, 0, 'w');                                                         // forecastle
    box(2.2, 16, 2.2, L / 2 - 28, yd, 0, 'g');                                                              // foremast
  } else if (kind === 'tanker' || kind === 'bulk') {
    house(-L / 2 + 24);
    if (kind === 'tanker') { for (let k = 0; k < 5; k++) cyl(0.5, L - 70, 8, yd + 1.2, -3 + k * 1.5, 'g', 'x', 8); box(L - 70, 0.2, 1.4, 8, yd + 2.4, 5.4, 'g');
      for (let x = -L / 2 + 60; x < L / 2 - 20; x += 12) box(0.3, 2.4, 0.3, x, yd, 5.4, 'g'); }
    else for (let k = 0; k < 7; k++) { const x = -L / 2 + 52 + k * 23; box(17, 2.0, B * 0.66, x, yd, 0, 'y'); if (k % 2 === 0 && k < 6) { cyl(1.1, 14, x + 11.5, yd + 7, 0, 'w', 'y', 12); box(22, 0.9, 0.9, x + 11.5, yd + 13, 0, 'w'); } }
    box(14, 3, B * 0.6, L / 2 - 16, yd, 0, 'w');
  } else if (kind === 'container' || kind === 'neo') {
    house(kind === 'neo' ? -L / 2 + 90 : -L / 2 + 34, kind === 'neo' ? 9 : 7, B * 0.66, 14);
    const pal = o.boxes ?? ['#f3a28f', '#9fd0d8', '#f4d58a', '#c9c1ee', '#f7f4ee', '#b5d7a8', '#e8b9a1', '#88b9d6'], items = [];
    const rows = Math.floor(B / 2.5) - 1, tiers = kind === 'neo' ? 8 : 6;
    for (let x = -L / 2 + 50; x < L / 2 - 26; x += 13.0) {
      if (kind === 'container' && Math.abs(x - (-L / 2 + 34)) < 12) continue; if (kind === 'neo' && Math.abs(x - (-L / 2 + 90)) < 12) continue;
      const bow = sstep(L / 2 - 70, L / 2 - 26, x), nt = Math.max(2, Math.round(tiers * (1 - bow * 0.6) - (hash(x, 3) < 0.3 ? 1 : 0)));
      for (let rr = 0; rr < rows; rr++) { const z = (rr - (rows - 1) / 2) * 2.5; if (Math.abs(z) > B / 2 * (1 - bow * 0.35) - 1.2) continue;
        for (let k = 0; k < nt; k++) { const h = hash(x, rr, k); items.push({ x, y: yd + 0.4 + k * 2.6, z, sx: 12.2, sy: 2.55, sz: 2.4, c: pal[Math.floor(h * pal.length)] }); } }
    }
    g.add(instanced(BOX, mat('#ffffff', 0.75), items));
    box(12, 3, B * 0.7, L / 2 - 14, yd, 0, 'w');
  } else if (kind === 'ancon') {
    for (let k = 0; k < 3; k++) box(46 - k * 8, 2.6, B * 0.82 - k, -6 - k * 2, yd + k * 2.6, 0, 'w');
    box(4, 1.2, B * 0.9, 10, yd + 7.8, 0, 'w'); box(0.3, 1.0, B * 0.7, 12.0, yd + 6.4, 0, 'n');
    cyl(2.1, 12, -10, yd + 12, 0, 'y', 'y', 20); if (o.accent !== null) cyl(2.15, 1.5, -10, yd + 16.6, 0, 'n', 'y', 20);
    cyl(0.45, 28, 38, yd + 14, 0, 'g', 'y', 8); cyl(0.45, 26, -46, yd + 13, 0, 'g', 'y', 8);
  } else if (kind === 'tug') {
    box(10, 3, B * 0.7, -1, yd, 0, 'w'); box(6, 2.4, B * 0.6, 0, yd + 3, 0, 'w'); box(0.3, 1.1, B * 0.5, 3.0, yd + 4.1, 0, 'n');
    cyl(0.9, 4, -4, yd + 5, 0, 'g', 'y', 10);
  }
  const mats = { w: W, g: G, n: N, y: Y, a: mat(o.accent ?? HOUSE.red, 0.55) };
  for (const [k, list] of Object.entries(parts)) if (list.length) { const m = new THREE.Mesh(merge(list), mats[k]); m.castShadow = m.receiveShadow = true; g.add(m); }
  return g;
}

// ---------------------------------------------------------------- lock flight: N chambers, walls, gates, water, culverts
// Local frame: +x runs from the low (sea) end to the high (lake) end; lanes side by side in z; floor y per chamber.
// o: { n, Lc (chamber length), Wc (width), lanes, gate: 'miter' | 'rolling', lo (sea level), hi (lake level), depth (below
//      the lower pool), wall (side wall width), mid (centre wall width), gateGap (length of a gate block between chambers) }
// Returns { group, chamberX(i) -> [x0, x1], laneZ(l), level(i, l) getter, setLevel(i, l, y), setGate(i, l, open01), steps,
//          wallTop(i), length, mules: [] }. Levels default to the step levels (chamber i at its lower pool).
export function lockFlight(o = {}) {
  const n = o.n ?? 2, Lc = o.Lc ?? 304.8, Wc = o.Wc ?? 33.53, lanes = o.lanes ?? 2, lo = o.lo ?? 0, hi = o.hi ?? 26, depth = o.depth ?? 13,
    wall = o.wall ?? 15, mid = o.mid ?? 18, GG = o.gateGap ?? 24, gateType = o.gate ?? 'miter', fb = o.freeboard ?? 3.5;
  const step = (hi - lo) / n, pool = (k) => lo + step * k; // pool k: 0 = sea .. n = lake
  const length = n * Lc + (n + 1) * GG, X0 = 0;
  const cx = (i) => [X0 + GG + i * (Lc + GG), X0 + GG + i * (Lc + GG) + Lc];
  const laneZ = (l) => (l - (lanes - 1) / 2) * (Wc + mid);
  const totalW = lanes * Wc + (lanes - 1) * mid + 2 * wall, Z0 = -totalW / 2;
  const grp = new THREE.Group(), conc = o.wallMat ?? mat(o.concrete ?? HOUSE.concrete, 0.82), wet = mat(HOUSE.concreteWet, 0.32), floorM = o.floorMat ?? mat('#cfcac0', 0.9);
  const walls = [];
  // chamber floors + walls per chamber, gate blocks between chambers (they step up)
  const floorY = (i) => pool(i) - depth;
  const wallTop = (i) => pool(i + 1) + fb;
  for (let i = 0; i < n; i++) {
    const [a, b] = cx(i), top = wallTop(i), fy = floorY(i), len = b - a;
    // side + centre walls along this chamber
    const zs = []; let z = Z0; zs.push([z, wall]); z += wall;
    for (let l = 0; l < lanes; l++) { z += Wc; if (l < lanes - 1) { zs.push([z, mid]); z += mid; } }
    zs.push([z, wall]);
    for (const [zz, ww] of zs) {
      walls.push({ x: (a + b) / 2, y: fy - 2, z: zz + ww / 2, sx: len + 0.02, sy: top - fy + 2, sz: ww });
    }
    for (let l = 0; l < lanes; l++) walls.push({ x: (a + b) / 2, y: fy - 2, z: laneZ(l), sx: len, sy: 2, sz: Wc, floor: true });
  }
  // gate blocks (the sills and gate recesses) between chambers: from the lower floor to the higher wall top
  for (let k = 0; k <= n; k++) {
    const a = X0 + k * (Lc + GG), b = a + GG, lowI = Math.max(0, k - 1), top = wallTop(Math.min(n - 1, k)) + (k === n ? 0 : 0);
    const sill = k === 0 ? floorY(0) : k === n ? floorY(n - 1) + step : floorY(k);
    let z = Z0;
    walls.push({ x: (a + b) / 2, y: floorY(lowI) - 2, z: z + wall / 2, sx: GG, sy: top - floorY(lowI) + 2 + (k === n ? 0 : 0), sz: wall });
    z += wall;
    for (let l = 0; l < lanes; l++) { walls.push({ x: (a + b) / 2, y: floorY(lowI) - 2, z: laneZ(l), sx: GG, sy: sill - floorY(lowI) + 2, sz: Wc, floor: true }); z += Wc;
      if (l < lanes - 1) { walls.push({ x: (a + b) / 2, y: floorY(lowI) - 2, z: z + mid / 2, sx: GG, sy: top - floorY(lowI) + 2, sz: mid }); z += mid; } }
    walls.push({ x: (a + b) / 2, y: floorY(lowI) - 2, z: z + wall / 2, sx: GG, sy: top - floorY(lowI) + 2, sz: wall });
  }
  const wm = instanced(BOX, conc, walls.filter(w => !w.floor)); grp.add(wm);
  grp.add(instanced(BOX, floorM, walls.filter(w => w.floor)));
  // copings: a pale cap line on every wall top (reads as the model's crisp edge), and lamp posts along the centre wall
  // water per chamber per lane: a box from the floor to the level (top face = water material)
  const wmat = water({ color: o.waterColor ?? HOUSE.water, scale: 18, strength: 0.28 });
  const levels = [], waterMeshes = [], wetBands = [];
  for (let i = 0; i < n; i++) for (let l = 0; l < lanes; l++) {
    const [a, b] = cx(i), m = new THREE.Mesh(BOX, wmat); m.position.set((a + b) / 2, floorY(i), laneZ(l)); m.receiveShadow = true;
    m.scale.set(Lc + GG * 0.9, depth, Wc - 0.05); grp.add(m); waterMeshes.push(m); levels.push(pool(i));
    // the wet band: darker glossy concrete up to the last high water (the chamber's upper pool)
    for (const sd of [-1, 1]) { const wb = new THREE.Mesh(BOX, wet); wb.position.set((a + b) / 2, pool(i), laneZ(l) + sd * (Wc / 2 - 0.02)); wb.scale.set(Lc, step + 0.3, 0.12); grp.add(wb); wetBands.push(wb); }
  }
  // gates: at boundary k (0 = sea gate .. n = lake gate), per lane
  const gates = [];
  const leafH = (k) => (k === 0 ? pool(1) + fb - floorY(0) : k === n ? hi + 1.2 - (floorY(n - 1) + step) : pool(k + 1) + 0.6 - floorY(k)) ;
  for (let k = 0; k <= n; k++) for (let l = 0; l < lanes; l++) {
    const xg = X0 + k * (Lc + GG) + GG * 0.5, base = k === 0 ? floorY(0) : k === n ? floorY(n - 1) + step : floorY(k), h = Math.min(leafH(k), 25.6) + (k === n ? 0 : 0);
    const gg = new THREE.Group(); gg.position.set(xg, base, laneZ(l)); grp.add(gg);
    const gm = mat(o.gateColor ?? '#c6ccce', 0.6), rib = mat('#aab3b8', 0.6);
    if (gateType === 'miter') {
      const half = Wc / 2, theta = Math.acos(Math.min(1, half / 19.5)), leafL = 19.5;
      const leaves = [];
      for (const sd of [-1, 1]) {
        const hinge = new THREE.Group(); hinge.position.set(-GG * 0.15, 0, sd * half); gg.add(hinge);
        const leaf = new THREE.Group(); hinge.add(leaf);
        const body = new THREE.Mesh(BOX, gm); body.scale.set(2.13, h, leafL); body.position.set(0, 0, -sd * leafL / 2); body.castShadow = body.receiveShadow = true; leaf.add(body);
        for (let y = 2.5; y < h - 1; y += 3.2) { const rb = new THREE.Mesh(BOX, rib); rb.scale.set(2.5, 0.45, leafL - 0.4); rb.position.set(0, y, -sd * leafL / 2); leaf.add(rb); }
        const walk = new THREE.Mesh(BOX, mat('#eef0ee', 0.7)); walk.scale.set(2.6, 0.35, leafL); walk.position.set(0, h, -sd * leafL / 2); leaf.add(walk);
        leaves.push({ hinge, sd });
      }
      // closed: leaves point upstream (+x) and meet at the centre; open: folded into the wall recesses
      gates.push({ k, l, set(open) { for (const L of leaves) L.hinge.rotation.y = gateAngle(L.sd, theta, open); }, group: gg, leaves });
    } else { // rolling gate: a thick slab that slides sideways into a recess in the wall
      const slabM = new THREE.Mesh(BOX, gm); slabM.scale.set(10, h, Wc + 2); slabM.castShadow = slabM.receiveShadow = true; gg.add(slabM);
      for (let y = 3; y < h - 1; y += 4) { const rb = new THREE.Mesh(BOX, rib); rb.scale.set(10.4, 0.5, Wc + 2.2); rb.position.y = y; gg.add(rb); }
      gates.push({ k, l, set(open) { const z = smoother(open) * (Wc + 4) * (l % 2 ? 1 : -1); gg.children.forEach(c => { c.position.z = z; }); }, group: gg });
    }
  }
  // closed: the leaves point upstream (+x) and meet on the centre line at the miter angle; open: folded parallel to the wall
  function gateAngle(sd, theta, open) { return lerp(-sd * theta, -sd * (Math.PI / 2 - 0.03), smoother(open)); }
  gates.forEach(gt => gt.set(0));
  const api = {
    group: grp, n, Lc, Wc, lanes, lo, hi, step, depth, length, wall, mid, totalW, gates, chamberX: cx, laneZ, pool, floorY, wallTop, GG,
    level: (i, l = 0) => levels[i * lanes + l],
    setLevel(i, l, y) { levels[i * lanes + l] = y; const m = waterMeshes[i * lanes + l]; m.scale.y = Math.max(0.05, y - floorY(i)); },
    setGate(k, l, open) { const gt = gates.find(g => g.k === k && g.l === l); gt?.set(clamp(open)); },
    tick(t) { wmat.tick(t); },
    waterMat: wmat, waterMeshes,
  };
  for (let i = 0; i < n; i++) for (let l = 0; l < lanes; l++) api.setLevel(i, l, pool(i));
  return api;
}

// ---------------------------------------------------------------- mule: an electric towing locomotive (1914 shape, modern silver-white)
export function mule({ color = '#f2f2ee', accent = '#2d3f55' } = {}) {
  const g = new THREE.Group(), parts = [], dark = [];
  parts.push(new THREE.BoxGeometry(9.8, 2.4, 3.0).translate(0, 1.6, 0), new THREE.BoxGeometry(3.4, 1.8, 3.1).translate(-1.6, 3.7, 0), new THREE.BoxGeometry(3.4, 1.8, 3.1).translate(1.9, 3.7, 0));
  dark.push(new THREE.BoxGeometry(9.0, 0.6, 2.6).translate(0, 0.3, 0), new THREE.BoxGeometry(0.15, 0.8, 2.6).translate(-3.3, 3.9, 0), new THREE.BoxGeometry(0.15, 0.8, 2.6).translate(3.6, 3.9, 0));
  const a = new THREE.Mesh(merge(parts), mat(color, 0.5)), b = new THREE.Mesh(merge(dark), mat(accent, 0.5));
  a.castShadow = b.castShadow = true; g.add(a, b); return g;
}

// bake a ship (or any group) into one geometry with vertex colours, for instancing many of them (queues, harbours)
export function bake(group) {
  group.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), list = [], M = new THREE.Matrix4(), c = new THREE.Color();
  const push = (geo, m, color) => { let g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.color) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([color.r, color.g, color.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
    list.push(g); };
  group.traverse((o) => {
    if (!o.isMesh) return; const base = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), mc = o.material?.color ?? c.set('#ffffff');
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); const cc = new THREE.Color(1, 1, 1); if (o.instanceColor) o.getColorAt(i, cc); push(o.geometry, new THREE.Matrix4().multiplyMatrices(base, M), cc.multiply(mc)); } }
    else push(o.geometry, base, o.material?.vertexColors ? new THREE.Color(1, 1, 1) : mc);
  });
  return mergeGeometries(list);
}
