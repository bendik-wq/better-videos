// World kit core: the local frame (anchor ENU on a curved earth), shared uniforms, GLSL chunks
// (sky, aerial-perspective haze, lighting, map crossfade, noise), time-of-day presets and the
// JS twins of the GLSL hash/noise so CPU placement (trees, lights) matches what shaders draw.
//
// Frame: x = east, y = up, z = south (metres), origin on the ground at the place's anchor.
// The earth is a sphere of radius R + elev0 centred at (0, -(R + elev0), 0); every ground point
// is placed on it (azimuthal equidistant around the anchor), so the same scene works from street
// level to orbit. Rendering uses a floating origin (see oner.js / World.render): the camera sits at
// the origin and the world root is offset by -camera, so GPU coordinates stay small.
import * as THREE from 'three';
import { GLSL_PBR, pbrUniforms } from './materials.js';

export const R_EARTH = 6371000;
export const D2R = Math.PI / 180;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- hash + noise (JS twin of GLSL)
export function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, y, s = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
export function fbm(x, y, s = 0, oct = 4) { let a = 0, w = 0.5, f = 1; for (let i = 0; i < oct; i++) { a += w * vnoise(x * f, y * f, s + i * 17); f *= 2.03; w *= 0.5; } return a / (1 - Math.pow(0.5, oct)); }
// deterministic RNG (same as kit.rng)
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- frame / geo
export class Frame {
  constructor({ lat = 0, lon = 0, elev = 0 } = {}) {
    this.lat = lat; this.lon = lon; this.elev = elev; this.R = R_EARTH;
    const la = lat * D2R, lo = lon * D2R;
    // ENU basis in ECEF
    this.E = [-Math.sin(lo), Math.cos(lo), 0];
    this.N = [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)];
    this.U = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
    this.center = new THREE.Vector3(0, -(R_EARTH + elev), 0);
  }
  // unit ECEF -> local direction (x east, y up, z south)
  dirLocal(ex, ey, ez) {
    const e = ex * this.E[0] + ey * this.E[1] + ez * this.E[2], n = ex * this.N[0] + ey * this.N[1] + ez * this.N[2], u = ex * this.U[0] + ey * this.U[1] + ez * this.U[2];
    return [e, u, -n];
  }
  // lat/lon/height ASL -> local position (exact sphere)
  toLocal(lat, lon, h = 0, out = new THREE.Vector3()) {
    const la = lat * D2R, lo = lon * D2R, c = Math.cos(la);
    const [x, y, z] = this.dirLocal(c * Math.cos(lo), c * Math.sin(lo), Math.sin(la));
    const r = R_EARTH + h;
    return out.set(x * r, y * r - (R_EARTH + this.elev), z * r);
  }
  // ground coordinates (gx, gz) = azimuthal-equidistant metres around the anchor -> lat/lon
  geoOf(gx, gz) {
    const d = Math.hypot(gx, gz), th = d / R_EARTH;
    if (d < 1e-6) return [this.lat, this.lon];
    const ux = gx / d, uz = gz / d; // local dir east/south
    const s = Math.sin(th), c = Math.cos(th);
    // local direction -> ECEF: e*E + u*U + n*N with n = -z
    const e = s * ux, n = -s * uz, u = c;
    const X = e * this.E[0] + n * this.N[0] + u * this.U[0], Y = e * this.E[1] + n * this.N[1] + u * this.U[1], Z = e * this.E[2] + n * this.N[2] + u * this.U[2];
    return [Math.asin(clamp(Z, -1, 1)) / D2R, Math.atan2(Y, X) / D2R];
  }
  // lat/lon -> ground coordinates (inverse of geoOf)
  groundOf(lat, lon) {
    const la = lat * D2R, lo = lon * D2R, c = Math.cos(la);
    const [x, y, z] = this.dirLocal(c * Math.cos(lo), c * Math.sin(lo), Math.sin(la));
    const th = Math.acos(clamp(y, -1, 1)), hz = Math.hypot(x, z) || 1;
    return [x / hz * th * R_EARTH, z / hz * th * R_EARTH];
  }
  // point at ground coords (gx, gz) and height h above the anchor's elevation, on the sphere
  surface(gx, gz, h = 0, out = new THREE.Vector3()) {
    const d = Math.hypot(gx, gz), r = R_EARTH + this.elev + h;
    if (d < 1e-9) return out.set(gx, h, gz);
    const th = d / R_EARTH, s = Math.sin(th) / d;
    // y relative to anchor: r*cos(th) - (R+e0) = h*cos(th) - 2(R+e0) sin^2(th/2)
    const y = h * Math.cos(th) - 2 * (R_EARTH + this.elev) * Math.sin(th / 2) ** 2;
    return out.set(gx * s * r, y, gz * s * r);
  }
  // curvature drop at ground distance d (metres)
  drop(d) { return 2 * (R_EARTH + this.elev) * Math.sin(d / R_EARTH / 2) ** 2; }
  // local up at a local position
  upAt(p, out = new THREE.Vector3()) { return out.copy(p).sub(this.center).normalize(); }
  altitude(p) { return p.distanceTo(this.center) - R_EARTH; } // ASL
}

// ---------------------------------------------------------------- time of day
// Hand-tuned looks (linear RGB). Mixed with W.tod(a, b, k). Sun azimuth in degrees from north,
// clockwise (270 = west). Moon likewise.
const C = (h, k = 1) => { const c = new THREE.Color(h); return [c.r * k, c.g * k, c.b * k]; };
export const TOD = {
  day: { sunEl: 48, sunAz: 200, sun: C(0xfff4e6, 3.2), zenith: C(0x2a5aa8, 1.0), horizon: C(0x9fb8d6, 1.0), glow: C(0xffffff, 0.15), glowW: 0.35,
    haze: C(0xa9bcd2, 1.0), hazeDen: 0.000045, hazeH: 1600, ambSky: C(0x6f8fbf, 0.9), ambGround: C(0x5a5348, 0.5), night: 0, exposure: 0.85, stars: 0, moon: C(0x000000), moonEl: -30, moonAz: 90, cityGlow: C(0x000000), cloud: C(0xffffff, 1.6),
    preetham: 1, sky: { turbidity: 3, rayleigh: 1.2, mie: 0.005 }, hazeGain: 0.9, expAlt: [1, 0.95], envW: 0.8, bloom: 0.04, bloomThresh: 2.5, flare: 0.5, sat: 1.04, contrast: 1.05 },
  golden: { sunEl: 9, sunAz: 262, sun: C(0xffb066, 4.4), zenith: C(0x3d5f9c, 0.75), horizon: C(0xe8b088, 1.05), glow: C(0xff9a50, 0.6), glowW: 0.22,
    haze: C(0xd8a27a, 0.9), hazeDen: 0.00006, hazeH: 900, ambSky: C(0x7088b8, 0.5), ambGround: C(0x6a4a30, 0.3), night: 0.12, exposure: 0.95, stars: 0, moon: C(0x000000), moonEl: -30, moonAz: 90, cityGlow: C(0xffa860, 0.05), cloud: C(0xffc89a, 1.5),
    preetham: 1, sky: { turbidity: 9, rayleigh: 2.0, mie: 0.012 }, hazeGain: 0.9, expAlt: [1, 0.9], envW: 0.85, bloom: 0.06, bloomThresh: 1.8, flare: 0.7, sat: 1.05, contrast: 1.06 },
  blue: { sunEl: -6, sunAz: 278, sun: C(0x000000), zenith: C(0x0c1a3a, 0.75), horizon: C(0x4a5a86, 0.75), glow: C(0xe0784a, 0.55), glowW: 0.12,
    haze: C(0x2c3860, 0.55), hazeDen: 0.000045, hazeH: 1200, ambSky: C(0x3c5290, 0.75), ambGround: C(0x1a1a24, 0.2), night: 1, exposure: 1.25, stars: 0.15, moon: C(0x9fb6ff, 0.05), moonEl: 25, moonAz: 120, cityGlow: C(0xffa860, 0.22), cloud: C(0x8a8fb8, 0.55),
    preetham: 0, expAlt: [1, 1.15], envW: 0.7, envNightK: 1.4, bloom: 0.09, bloomThresh: 1.1, flare: 0, sat: 1.06, contrast: 1.05 },
  night: { sunEl: -30, sunAz: 300, sun: C(0x000000), zenith: C(0x02040b, 1), horizon: C(0x0b1222, 1), glow: C(0x101a30, 0.3), glowW: 0.2,
    haze: C(0x0d1424, 0.9), hazeDen: 0.00008, hazeH: 1000, ambSky: C(0x1c2846, 0.16), ambGround: C(0x0a0a0e, 0.06), night: 1, exposure: 1.6, stars: 0.8, moon: C(0x9fb6ff, 0.22), moonEl: 35, moonAz: 140, cityGlow: C(0xffa860, 0.3), cloud: C(0x3a4058, 0.35),
    preetham: 0, expAlt: [1, 1.2], envW: 0.7, envNightK: 1.1, bloom: 0.1, bloomThresh: 1.0, flare: 0, sat: 1.05, contrast: 1.05 },
};
export function todMix(a, b = null, k = 0) {
  a = typeof a === 'string' ? TOD[a] : a; b = typeof b === 'string' ? TOD[b] : b;
  if (!b || k <= 0) return a; if (k >= 1) return b;
  const o = {};
  for (const key in a) { const x = a[key], y = b[key] ?? a[key]; o[key] = Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], k)) : typeof x === 'number' ? lerp(x, y, k) : x; }
  for (const key in b) if (!(key in o)) o[key] = b[key];
  return o;
}
const azDir = (elDeg, azDeg) => { const e = elDeg * D2R, a = azDeg * D2R; return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)]; };

// ---------------------------------------------------------------- shared uniforms
export function makeUniforms(frame) {
  const v3 = (x = 0, y = 0, z = 0) => ({ value: new THREE.Vector3(x, y, z) });
  return {
    uOrigin: v3(), uCenter: { value: frame.center.clone() }, uR: { value: R_EARTH }, uElev0: { value: frame.elev }, uCamAlt: { value: frame.elev + 2 },
    uSunDir: v3(0, 1, 0), uSunCol: v3(), uMoonDir: v3(0, 1, 0), uMoonCol: v3(),
    uZenith: v3(), uHorizon: v3(), uGlow: v3(), uGlowW: { value: 0.2 }, uAmbSky: v3(), uAmbGround: v3(),
    uNight: { value: 0 }, uStars: { value: 0 }, uHazeCol: v3(), uHazeDen: { value: 0.00005 }, uHazeH: { value: 1200 },
    uCityGlow: v3(), uCityPos: v3(), uCityR: { value: 6000 },
    uCloudFog: { value: 0 }, uWhite: { value: 0 }, uCloudCol: v3(1, 1, 1), uCloudLit: v3(1, 1, 1),
    uMap: { value: 0 }, uFlat: { value: 0 }, uTime: { value: 0 }, uLightsFar: { value: 0 }, uPx: { value: 1000 },
    uHead: { value: [new THREE.Vector4(0, -1e9, 0, 0), new THREE.Vector4(0, -1e9, 0, 0)] }, // hero headlights: xyz pos, w intensity
    uHeadDir: v3(1, 0, 0),
    uMapBg: v3(...C(0x070809)), uMapLand: v3(...C(0x17191c)), uMapInk: v3(...C(0xb9b2a3)), uMapRoad: v3(...C(0x3a3c40)), uMapWater: v3(...C(0x070b10)), uMapBldg: v3(...C(0x1e2024)),
    uNoise: { value: noiseTexture() }, uUpCam: v3(0, 1, 0), uSunH: v3(1, 0, 0), uDip: { value: 0 }, uSpace: { value: 0 }, uLimbW: { value: 0.05 },
    ...pbrUniforms(),
  };
}
export function applyTod(U, tod) {
  const s = azDir(tod.sunEl, tod.sunAz), m = azDir(tod.moonEl, tod.moonAz);
  U.uSunDir.value.set(...s); U.uMoonDir.value.set(...m);
  // the sun's light fades through the horizon (atmospheric extinction) instead of switching off
  const sk = sstep(-2.5, 4, tod.sunEl);
  U.uSunCol.value.set(...tod.sun).multiplyScalar(sk);
  U.uMoonCol.value.set(...tod.moon).multiplyScalar(sstep(-2, 8, tod.moonEl));
  U.uZenith.value.set(...tod.zenith); U.uHorizon.value.set(...tod.horizon); U.uGlow.value.set(...tod.glow); U.uGlowW.value = tod.glowW;
  U.uAmbSky.value.set(...tod.ambSky); U.uAmbGround.value.set(...tod.ambGround);
  U.uNight.value = tod.night; U.uStars.value = tod.stars; U.uHazeCol.value.set(...tod.haze); U.uHazeDen.value = tod.hazeDen; U.uHazeH.value = tod.hazeH;
  U.uCityGlow.value.set(...tod.cityGlow); U.uCloudLit.value.set(...tod.cloud);
}

// ---------------------------------------------------------------- noise texture
let NOISE = null;
export function noiseTexture() {
  if (NOISE) return NOISE;
  const N = 256, data = new Uint8Array(N * N * 4);
  // tileable value-noise octaves in R,G,B (periods 8, 16, 32 cells) and white hash in A
  const tile = (x, y, p, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash2(((a % p) + p) % p, ((b % p) + p) % p, s);
    return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    let f = 0, w = 0.5, a = 0; for (let o = 0; o < 4; o++) { const p = 8 << o; f += w * tile(x / N * p, y / N * p, p, 3 + o); a += w; w *= 0.5; }
    data[i] = Math.round(f / a * 255);
    data[i + 1] = Math.round(tile(x / N * 16, y / N * 16, 16, 11) * 255);
    let g = 0; w = 0.5; a = 0; for (let o = 0; o < 3; o++) { const p = 32 << o; g += w * tile(x / N * p, y / N * p, p, 21 + o); a += w; w *= 0.5; }
    data[i + 2] = Math.round(g / a * 255);
    data[i + 3] = Math.round(hash2(x, y, 99) * 255);
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  NOISE = t; return t;
}

// ---------------------------------------------------------------- GLSL
export const GLSL_COMMON = /* glsl */`
uniform vec3 uOrigin, uCenter; uniform float uR, uElev0, uCamAlt;
uniform vec3 uSunDir, uSunCol, uMoonDir, uMoonCol, uZenith, uHorizon, uGlow, uAmbSky, uAmbGround; uniform float uGlowW;
uniform float uNight, uStars; uniform vec3 uHazeCol; uniform float uHazeDen, uHazeH;
uniform vec3 uCityGlow, uCityPos; uniform float uCityR;
uniform float uCloudFog, uWhite; uniform vec3 uCloudCol, uCloudLit;
uniform float uMap, uFlat, uTime, uLightsFar;
uniform vec4 uHead[2]; uniform vec3 uHeadDir;
uniform vec3 uMapBg, uMapLand, uMapInk, uMapRoad, uMapWater, uMapBldg;
uniform sampler2D uNoise;
uniform vec3 uUpCam, uSunH; uniform float uDip, uSpace, uLimbW;
${GLSL_PBR}
float hash2u(int x, int y, int s) {
  uint h = uint(x) * 0x27d4eb2du ^ uint(y) * 0x165667b1u ^ uint(s) * 0x9e3779b9u;
  h = (h ^ (h >> 15u)) * 0x85ebca6bu; h = (h ^ (h >> 13u)) * 0xc2b2ae35u; h ^= h >> 16u;
  return float(h) / 4294967296.0;
}
float vnoise(vec2 p, int s) {
  vec2 i = floor(p), f = p - i; vec2 u = f * f * (3. - 2. * f); int x = int(i.x), y = int(i.y);
  return mix(mix(hash2u(x, y, s), hash2u(x + 1, y, s), u.x), mix(hash2u(x, y + 1, s), hash2u(x + 1, y + 1, s), u.x), u.y);
}
float tnoise(vec2 p) { return texture(uNoise, p).r; } // tileable fbm, period 1
float altOf(vec3 local) { return length(local - uCenter) - uR; }
vec3 upAt(vec3 local) { return normalize(local - uCenter); }
// cheap aerial-perspective colour for a view direction (haze lit by the sky, afterglow, city light)
vec3 hazeColor(vec3 d, vec3 local) {
  vec3 dh = d - uUpCam * dot(d, uUpCam);
  float az = dot(uSunH, dh) * inversesqrt(dot(dh, dh) + 1e-8) * .5 + .5;
  vec3 c = uHazeCol + uGlow * .3 * pow(az, 4.);
  if (uSkyPb > .001) {
    // looking down, the scattering angle to the sun opens up: fade from the horizon colour in this
    // azimuth to the one 90 degrees from the sun (no Mie peak), so nadir views carry no sun wedge
    float dy = dot(d, uUpCam);
    vec3 hz = hazeLutAt(normalize(vec3(dh.x, max(dy, 0.) + .002, dh.z)));
    vec3 perp = hazeLutAt(normalize(vec3(-uSunH.z, .002, uSunH.x)));
    c = mix(c, mix(hz, perp, smoothstep(0., .35, -dy)), uSkyPb);
  }
  float city = exp(-length(local.xz - uCityPos.xz) / (uCityR * 1.5));
  c += uCityGlow * city * .45;
  return c;
}
vec3 skyColor(vec3 d) {
  vec3 up = uUpCam;
  float h = max(uCamAlt, 0.);
  float el = asin(clamp(dot(d, up), -1., 1.)) + uDip;
  vec3 dh = d - up * dot(d, up);
  float az = dot(uSunH, dh) * inversesqrt(dot(dh, dh) + 1e-8) * .5 + .5;
  float e = max(el, 0.);
  vec3 c = mix(uHorizon, uZenith, pow(1. - exp(-e * 4.), .7));
  c += uGlow * exp(-e / uGlowW) * (pow(az, 2.2) * .9 + .1);
  float mu = dot(d, uSunDir);
  if (uSkyPb > .001) c = mix(c, preethamSky(d, up) + uGlow * .12 * exp(-e / uGlowW) * pow(az, 3.), uSkyPb);
  c += uSunCol * (smoothstep(.99985, .99995, mu) * 30. + pow(max(mu, 0.), 18.) * .06 + pow(max(mu, 0.), 3.) * .015);
  float mm = dot(d, uMoonDir);
  c += uMoonCol * (smoothstep(.99990, .99996, mm) * 40. + pow(max(mm, 0.), 60.) * .3);
  // light pollution dome over the city
  vec3 cd = uCityPos - uOrigin; float cl = length(cd.xz);
  float toward = dot(dh * inversesqrt(dot(dh, dh) + 1e-8), normalize(vec3(cd.x, 0., cd.z) + 1e-5)) * .5 + .5;
  c += uCityGlow * exp(-e / .08) * mix(.25, 1., pow(toward, 4.)) * exp(-cl / (uCityR * 6.)) * 1.2;
  // below the horizon: haze
  c = mix(c, hazeColor(d, uOrigin) * .8, smoothstep(.0, -.04, el));
  // stars (stable in direction; antialiased)
  vec3 a = abs(d); vec2 sp = a.x > a.y && a.x > a.z ? d.yz / a.x : a.y > a.z ? d.xz / a.y : d.xy / a.z;
  sp *= 420.; vec2 cell = floor(sp); float hs = hash2u(int(cell.x), int(cell.y), a.x > a.y && a.x > a.z ? 1 : a.y > a.z ? 2 : 3);
  float star = 0.;
  if (hs > .985) { vec2 o = vec2(hash2u(int(cell.x), int(cell.y), 7), hash2u(int(cell.x), int(cell.y), 8)) * .6 + .2;
    float r = length(sp - cell - o); star = smoothstep(.22, 0., r) * pow((hs - .985) / .015, 2.) * 2.; }
  float space = uSpace;
  c += vec3(.8, .85, 1.) * star * max(uStars * smoothstep(-.02, .2, el), space) * (1. - clamp(length(uSunCol) * .3, 0., 1.) * (1. - space));
  // from high up the sky goes black above a thin glowing limb
  vec3 limb = vec3(.25, .45, 1.) * .35 * exp(-abs(el) / uLimbW) * (.08 + .92 * pow(az, 2.));
  c = mix(c, limb + vec3(.8, .85, 1.) * star, space);
  return c;
}
// cheap sky radiance for reflections (no stars, limb or disc): gradient / Preetham LUT + afterglow + city dome
vec3 skyEnv(vec3 d) {
  float e = max(dot(d, uUpCam), 0.);
  vec3 c = mix(uHorizon, uZenith, pow(1. - exp(-e * 4.), .7));
  vec3 dh = d - uUpCam * dot(d, uUpCam);
  float az = dot(uSunH, dh) * inversesqrt(dot(dh, dh) + 1e-8) * .5 + .5;
  c += uGlow * exp(-e / uGlowW) * (pow(az, 2.2) * .9 + .1);
  if (uSkyPb > .001) c = mix(c, hazeLutAt(normalize(vec3(dh.x, e + .002, dh.z))) * 1.1, uSkyPb);
  c += uCityGlow * exp(-e / .08) * .6;
  return c;
}
// haze + cloud-deck fog along the ray from the camera to a fragment
vec3 applyFog(vec3 col, vec3 rel, vec3 local) {
  float L = length(rel); vec3 d = rel / max(L, 1e-3);
  float a0 = uCamAlt - uElev0, a1 = altOf(local) - uElev0, H = uHazeH;
  float e0 = exp(-clamp(a0, -300., 2e5) / H), e1 = exp(-clamp(a1, -300., 2e5) / H), da = a1 - a0;
  float od = uHazeDen * L * (abs(da) > 1. ? (e0 - e1) * H / da : e0);
  float T = exp(-od);
  col = col * T + hazeColor(d, local) * (1. - T);
  float Tc = exp(-uCloudFog * L) * (1. - uWhite * (1. - exp(-L / 120.)));
  return col * Tc + uCloudCol * (1. - Tc);
}
// diffuse light: sun (shadowed: vis from sunVis) + moon + hemisphere / HDRI ambient
vec3 lightDiffuseV(vec3 n, vec3 local, float vis) {
  vec3 up = upAt(local);
  float hemi = dot(n, up) * .5 + .5;
  // twilight: ambient sky light dies away on the night side of the terminator (matches the globe)
  float tw = mix(.35, 1., smoothstep(-.3, .05, dot(up, uSunDir)));
  vec3 amb = mix(uAmbGround, uAmbSky, hemi) * tw;
  if (uEnvW > .001) amb = mix(amb, envDiffuse(n), uEnvW);
  return amb + uSunCol * max(dot(n, uSunDir), 0.) * vis + uMoonCol * max(dot(n, uMoonDir), 0.);
}
vec3 lightDiffuse(vec3 n, vec3 local) { return lightDiffuseV(n, local, sunVis(local, n)); }
// hero headlights (two spot lights carried by the followed vehicle)
vec3 headlights(vec3 local, vec3 n) {
  vec3 acc = vec3(0.);
  for (int i = 0; i < 2; i++) {
    vec3 L = uHead[i].xyz - local; float d = length(L); L /= max(d, 1e-3);
    float cone = smoothstep(.82, .97, dot(-L, normalize(uHeadDir + vec3(0., -.06, 0.))));
    acc += vec3(1., .93, .8) * uHead[i].w * cone * max(dot(n, L), 0.) / (1. + d * d * .025);
  }
  return acc;
}
// Orbit shading shared by the globe and (from high up) the terrain patch, so the patch never shows
// as a disc on the globe: white sun, twilight band, city lights on the night side, the cloud map.
vec3 globeShade(vec3 day, float nl, float cloud, float land, vec3 n, vec3 rel) {
  float sunD = dot(n, uSunDir); float lit = smoothstep(-.06, .12, sunD);
  vec3 sunW = vec3(1., .96, .9) * 2.1;
  vec3 col = day * (sunW * max(sunD, 0.) + vec3(.35, .3, .45) * .25 * smoothstep(-.18, .04, sunD) * (1. - smoothstep(.04, .3, sunD)) + uAmbSky * .03);
  vec3 v = normalize(-rel), hv = normalize(v + uSunDir);
  col += sunW * pow(max(dot(n, hv), 0.), 120.) * (1. - land) * .5 * lit;
  col += vec3(1., .62, .3) * nl * nl * 1.6 * (1. - lit) * max(uNight, .6);
  float cv = cloud * smoothstep(250000., 1500000., uCamAlt);
  vec3 cc = vec3(1.) * (sunW * max(sunD, 0.) + uAmbSky * .1 * smoothstep(-.2, .05, sunD));
  return mix(col, cc, cv * .85);
}
// y of the bare sphere (no relief) at a local position: used by uFlat to flatten the world to a map
float flatY(vec3 local) { float d = length(local.xz); float s = sin(d / uR * .5); return -2. * (uR + uElev0) * s * s; }
`;

export const GLSL_TONE = /* glsl */`
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;

// ShaderMaterial factory for world parts: shared uniforms by reference + own uniforms.
export function worldMaterial(U, { vertex, fragment, uniforms = {}, defines = undefined, ...opts }) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, ...uniforms },
    vertexShader: GLSL_COMMON + vertex,
    fragmentShader: GLSL_COMMON + fragment,
    ...(defines ? { defines } : {}),
    ...opts,
  });
  return m;
}
