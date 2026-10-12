// PBR material library for the world kit: CC0 texture sets (Poly Haven, ambientCG; packed by
// engine/world/pbr.py into assets/pbr/) stacked into two texture arrays, real HDRIs for ambient and
// reflections at low altitude, and the GLSL every world shader shares through GLSL_COMMON:
//
//   pbrA(layer, uv) / pbrN(layer, uv)   albedo (linear) / packed normal.xy + roughness of any layer
//   triA / triN                         triplanar sampling for surfaces without a natural UV
//   perturb(n, T, B, nt, k)             tangent-space normal from a packed sample, strength k
//   sunVis(local, n)                    two-cascade sun shadow (PCF), 1 when shadows are off
//   envDiffuse(n) / envSpec(R, rough)   HDRI irradiance (SH9) and prefiltered reflection, blended
//                                       with the analytic sky by altitude (uEnvW)
//   ggxSun(n, v, rough, F0)             GGX specular from the sun (shadowed by the caller)
//   wear(p) / grime(p, up) / puddles(p) world-space masks: wear, streaky grime, standing water
//   planarRefl(rel, distort)            the night puddle mirror (World.render's reflection pass)
//
// Determinism: textures decode with colorSpaceConversion 'none'; HDRI mips and SH are computed on
// the CPU from the file, never from GPU state. Layer indices: W.PBR.L.<name> (see layers.json).
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const BASE = '/assets/pbr/';
let PBR = null, ENV = {}, TREES = null;

// ---------------------------------------------------------------- texture arrays
async function pixels(url, size) {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, size, size);
  return x.getImageData(0, 0, size, size).data;
}
export async function loadPBR() {
  return PBR ??= (async () => {
    const meta = await (await fetch(BASE + 'layers.json')).json();
    const S = meta.size, n = meta.layers.length;
    const A = new Uint8Array(S * S * 4 * n), N = new Uint8Array(S * S * 4 * n);
    await Promise.all(meta.layers.map(async (l, i) => {
      const [a, nn] = await Promise.all([pixels(BASE + l.name + '.a.jpg', S), pixels(BASE + l.name + '.n.jpg', S)]);
      A.set(a, i * S * S * 4); N.set(nn, i * S * S * 4);
    }));
    const mk = (data, srgb) => {
      const t = new THREE.DataArrayTexture(data, S, S, n);
      t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
    };
    const L = Object.fromEntries(meta.layers.map(l => [l.name, l.index]));
    return { A: mk(A, true), N: mk(N, false), meta, L, layer: (name) => meta.layers[L[name]] };
  })();
}
export async function loadTrees() {
  return TREES ??= new THREE.TextureLoader().loadAsync(BASE + 'trees.png').then(t => {
    t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; return t;
  });
}

// ---------------------------------------------------------------- HDRI: float equirect, CPU mips, SH9
// Env frame: u = atan(x, -z) / 2pi + .5 (u = .5 looks north, -z), v = acos(y) / pi (row 0 = zenith).
// The sun disc is clamped out (our sun is analytic); its azimuth is kept so the env can be turned
// to agree with the world's sun.
export async function loadEnv(name, { clampLum = 6 } = {}) {
  return ENV[name] ??= (async () => {
    const meta = await (await fetch(BASE + 'layers.json')).json();
    const tex = await new RGBELoader().setDataType(THREE.FloatType).loadAsync(BASE + meta.hdri[name].file);
    const { width: W0, height: H0, data: src } = tex.image; tex.dispose();
    // RGBELoader keeps file row order (row 0 = top); copy, find the sun, clamp it
    let level = new Float32Array(W0 * H0 * 4), best = -1, bi = 0;
    for (let i = 0; i < W0 * H0; i++) {
      const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2], l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (l > best) { best = l; bi = i; }
      const k = l > clampLum ? clampLum / l : 1;
      level[i * 4] = r * k; level[i * 4 + 1] = g * k; level[i * 4 + 2] = b * k; level[i * 4 + 3] = 1;
    }
    const sunU = ((bi % W0) + 0.5) / W0, sunV = (Math.floor(bi / W0) + 0.5) / H0;
    const sunAz = (sunU - 0.5) * 2 * Math.PI, sunEl = Math.PI / 2 - sunV * Math.PI;
    const mips = [{ data: level, width: W0, height: H0 }];
    let w = W0, h = H0;
    while (w > 1 || h > 1) {
      const w2 = Math.max(1, w >> 1), h2 = Math.max(1, h >> 1), d = new Float32Array(w2 * h2 * 4), s = mips.at(-1).data;
      for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) for (let c = 0; c < 4; c++) {
        const y0 = Math.min(h - 1, y * 2), y1 = Math.min(h - 1, y * 2 + 1), x0 = Math.min(w - 1, x * 2), x1 = Math.min(w - 1, x * 2 + 1);
        d[(y * w2 + x) * 4 + c] = (s[(y0 * w + x0) * 4 + c] + s[(y0 * w + x1) * 4 + c] + s[(y1 * w + x0) * 4 + c] + s[(y1 * w + x1) * 4 + c]) / 4;
      }
      mips.push({ data: d, width: w2, height: h2 }); w = w2; h = h2;
    }
    // half float: linearly filterable everywhere (float32 linear filtering is an extension llvmpipe may refuse)
    const half = (m) => { const d = new Uint16Array(m.data.length); for (let i = 0; i < d.length; i++) d[i] = THREE.DataUtils.toHalfFloat(Math.min(m.data[i], 65000)); return { data: d, width: m.width, height: m.height }; };
    const hm = mips.map(half);
    const t = new THREE.DataTexture(hm[0].data, W0, H0, THREE.RGBAFormat, THREE.HalfFloatType);
    t.mipmaps = hm; t.generateMipmaps = false; t.flipY = false;
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.needsUpdate = true;
    // SH9 irradiance from a 64x32 level (cosine-convolved, Ramamoorthi & Hanrahan 2001)
    const m = mips.find(q => q.width <= 64), sh = Array.from({ length: 9 }, () => [0, 0, 0]);
    let wsum = 0, upper = [0, 0, 0], uw = 0;
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const th = (y + 0.5) / m.height * Math.PI, ph = ((x + 0.5) / m.width - 0.5) * 2 * Math.PI;
      const dx = Math.sin(th) * Math.sin(ph), dy = Math.cos(th), dz = -Math.sin(th) * Math.cos(ph);
      const dw = Math.sin(th) * (Math.PI / m.height) * (2 * Math.PI / m.width); wsum += dw;
      const Y = [0.282095, 0.488603 * dy, 0.488603 * dz, 0.488603 * dx, 1.092548 * dx * dy, 1.092548 * dy * dz, 0.315392 * (3 * dz * dz - 1), 1.092548 * dx * dz, 0.546274 * (dx * dx - dy * dy)];
      const i = (y * m.width + x) * 4;
      for (let k = 0; k < 9; k++) for (let c = 0; c < 3; c++) sh[k][c] += m.data[i + c] * Y[k] * dw;
      if (dy > 0.1) { for (let c = 0; c < 3; c++) upper[c] += m.data[i + c] * dw; uw += dw; }
    }
    const A = [Math.PI, 2.094395, 2.094395, 2.094395, 0.785398, 0.785398, 0.785398, 0.785398, 0.785398];
    const Yc = [0.282095, 0.488603, 0.488603, 0.488603, 1.092548, 1.092548, 0.315392, 1.092548, 0.546274];
    // fold the basis constants in: shader evaluates c0 + c1 y + c2 z + c3 x + c4 xy + c5 yz + c6 (3z^2 - 1) + c7 xz + c8 (x^2 - y^2), divided by pi
    const coef = sh.map((v, k) => new THREE.Vector3(...v.map(c => c * A[k] * Yc[k] / Math.PI)));
    const up = upper.map(c => c / uw), upLum = 0.2126 * up[0] + 0.7152 * up[1] + 0.0722 * up[2];
    return { tex: t, sh: coef, sunAz, sunEl, upLum, lods: mips.length };
  })();
}

// ---------------------------------------------------------------- Preetham sky (three.js Sky.js, MIT), CPU twin
// Used for the haze LUT (aerial perspective colour by azimuth/elevation) and the per-frame sky constants.
const totalRayleigh = [5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5];
const MieConst = [1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14];
export function preethamParams(sunDir, { turbidity = 4, rayleigh = 1.6, mie = 0.006 } = {}) {
  const zc = Math.min(1, Math.max(-1, sunDir[1]));
  const cutoff = Math.PI / 1.95, steep = 1.5, EE = 1000;
  const sunE = EE * Math.max(0, 1 - Math.exp(-((cutoff - Math.acos(zc)) / steep)));
  const c = 0.2 * turbidity * 10e-18;
  return { sunE, betaR: totalRayleigh.map(v => v * rayleigh), betaM: MieConst.map(v => 0.434 * c * v * mie), g: 0.8 };
}
export function preetham(d, sunDir, P) {
  const up = [0, 1, 0], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const za = Math.acos(Math.max(0, dot(up, d)));
  const inv = 1 / (Math.cos(za) + 0.15 * Math.pow(93.885 - za * 180 / Math.PI, -1.253));
  const sR = 8.4e3 * inv, sM = 1.25e3 * inv;
  const Fex = [0, 1, 2].map(i => Math.exp(-(P.betaR[i] * sR + P.betaM[i] * sM)));
  const ct = dot(d, sunDir);
  const rPhase = 3 / (16 * Math.PI) * (1 + Math.pow(ct * 0.5 + 0.5, 2));
  const g = P.g, mPhase = 1 / (4 * Math.PI) * ((1 - g * g) / Math.pow(1 - 2 * g * ct + g * g, 1.5));
  const k = Math.min(1, Math.max(0, Math.pow(1 - dot(up, sunDir), 5)));
  return [0, 1, 2].map(i => {
    const br = P.betaR[i] * rPhase, bm = P.betaM[i] * mPhase, f = (br + bm) / (P.betaR[i] + P.betaM[i]);
    let Lin = Math.pow(P.sunE * f * (1 - Fex[i]), 1.5);
    Lin *= 1 + (Math.pow(P.sunE * f * Fex[i], 0.5) - 1) * k;
    return (Lin + 0.1 * Fex[i]) * 0.04 + [0, 0.0003, 0.00075][i];
  });
}
// haze LUT: 64 azimuths (u = atan(x, -z)/2pi + .5) x 4 elevations (0, 3, 10, 30 deg), linear RGB
export function hazeLut(tex, sunDir, P, gain = 1) {
  const W = 64, H = 4, els = [0.5, 3, 10, 30];
  const data = tex?.image?.data ?? new Uint16Array(W * H * 4); const hf = THREE.DataUtils.toHalfFloat;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ph = ((i + 0.5) / W - 0.5) * 2 * Math.PI, el = els[j] * Math.PI / 180;
    const d = [Math.cos(el) * Math.sin(ph), Math.sin(el), -Math.cos(el) * Math.cos(ph)];
    const c = preetham(d, sunDir, P); const o = (j * W + i) * 4;
    data[o] = hf(Math.min(c[0] * gain, 6e4)); data[o + 1] = hf(Math.min(c[1] * gain, 6e4)); data[o + 2] = hf(Math.min(c[2] * gain, 6e4)); data[o + 3] = hf(1);
  }
  if (!tex) { tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; }
  tex.needsUpdate = true; return tex;
}

// ---------------------------------------------------------------- uniforms (merged into the world's U)
export function pbrUniforms() {
  const ph = new THREE.DataArrayTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, 1); ph.needsUpdate = true;
  const e = new THREE.DataTexture(new Float32Array([0, 0, 0, 1]), 1, 1, THREE.RGBAFormat, THREE.FloatType); e.needsUpdate = true;
  return {
    uPbrA: { value: ph }, uPbrN: { value: ph },
    uEnvT: { value: e }, uEnvT2: { value: e }, uEnvSH: { value: Array.from({ length: 9 }, () => new THREE.Vector3()) }, uEnvSH2: { value: Array.from({ length: 9 }, () => new THREE.Vector3()) },
    uEnvW: { value: 0 }, uEnvMix: { value: 0 }, uEnvYaw: { value: 0 }, uEnvYaw2: { value: 0 }, uEnvGain: { value: 1 }, uEnvGain2: { value: 1 }, uEnvLods: { value: 1 },
    uShA: { value: null }, uShMA: { value: new THREE.Matrix4() }, uShMB: { value: new THREE.Matrix4() }, uShP: { value: new THREE.Vector4(0, 1 / 2048, 1 / 2048, 0) }, uShBias: { value: new THREE.Vector2(0.1, 1) },
    uReflT: { value: null }, uReflM: { value: new THREE.Matrix4() }, uReflOn: { value: 0 },
    uHazeLut: { value: null }, uSkyPb: { value: 0 }, uPbBetaR: { value: new THREE.Vector3() }, uPbBetaM: { value: new THREE.Vector3() }, uPbSunE: { value: 0 }, uPbGain: { value: 1 },
    uWetness: { value: 0 }, uLayerTile: { value: new Array(32).fill(0).map(() => new THREE.Vector2(1, 1)) },
  };
}

// layer indices (the order of LAYERS in engine/world/pbr.py / assets/pbr/layers.json)
export const LAYER = { asphalt: 0, asphalt_wet: 1, pavers: 2, concrete: 3, brick: 4, stone: 5, curtain: 6, ribbon: 7, brickwin: 8, piers: 9, gravel: 10, grass: 11, dirt: 12, metal: 13, chrome: 14, rubber: 15, markings: 16, sheet: 17 };
const DEFINES = Object.entries(LAYER).map(([k, v]) => `#define L_${k.toUpperCase()} ${v}.`).join('\n');
export const GLSL_PBR = /* glsl */`
${DEFINES}
uniform highp sampler2DArray uPbrA, uPbrN;
uniform sampler2D uEnvT, uEnvT2; uniform vec3 uEnvSH[9], uEnvSH2[9]; uniform float uEnvW, uEnvMix, uEnvYaw, uEnvYaw2, uEnvGain, uEnvGain2, uEnvLods;
uniform highp sampler2D uShA; uniform mat4 uShMA, uShMB; uniform vec4 uShP; uniform vec2 uShBias;
uniform sampler2D uReflT; uniform mat4 uReflM; uniform float uReflOn;
uniform sampler2D uHazeLut; uniform float uSkyPb, uPbSunE, uPbGain; uniform vec3 uPbBetaR, uPbBetaM;
uniform float uWetness;
vec4 pbrA(float L, vec2 uv) { return texture(uPbrA, vec3(uv, L)); }
vec4 pbrN(float L, vec2 uv) { return texture(uPbrN, vec3(uv, L)); }
vec4 pbrAg(float L, vec2 uv, vec2 dx, vec2 dy) { return textureGrad(uPbrA, vec3(uv, L), dx, dy); }
vec4 pbrNg(float L, vec2 uv, vec2 dx, vec2 dy) { return textureGrad(uPbrN, vec3(uv, L), dx, dy); }
vec3 perturb(vec3 n, vec3 T, vec3 B, vec4 nt, float k) { vec2 xy = (nt.xy * 2. - 1.) * k; return normalize(T * xy.x + B * xy.y + n * sqrt(max(1. - dot(xy, xy), .05))); }
// triplanar albedo / normal (world-space projections, blend sharpened by the normal)
vec3 triW(vec3 n) { vec3 w = pow(abs(n), vec3(6.)); return w / (w.x + w.y + w.z); }
vec4 triA(float L, vec3 p, vec3 n, float s) { vec3 w = triW(n); return pbrA(L, p.zy / s) * w.x + pbrA(L, p.xz / s) * w.y + pbrA(L, p.xy / s) * w.z; }
float luma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
// ---- world-space masks (uNoise: R fbm period 8 cells, G period 16, B fbm 32+, A white)
float wear(vec2 p) { return smoothstep(.35, .75, texture(uNoise, p / 37.).r * .65 + texture(uNoise, p / 5.3).b * .35); }
// grime: darker towards the ground and in vertical streaks below ledges (rain run-off)
float grime(vec2 fu, float y, float h) {
  float streak = texture(uNoise, vec2(fu.x / 9., y / 140.)).g * texture(uNoise, vec2(fu.x / 2.3, .5)).r;
  return clamp(exp(-y / 2.5) * .55 + streak * smoothstep(.25, .9, streak) * .9 + (1. - smoothstep(0., 2.5, h - y)) * .25, 0., 1.);
}
// standing water on a road / pavement: low spots of a smooth noise field, more with uWetness
float puddles(vec2 p, float wet) {
  float n = texture(uNoise, p / 23.).r * .75 + texture(uNoise, p / 4.1 + .37).r * .25;
  return smoothstep(.66 - wet * .07, .71 - wet * .07, n);
}
// ---- sun shadow: two cascades fitted to the shot (World.render), 4-tap PCF on hardware compare
// manual compare on a plain depth sampler (a shadow sampler on an unset unit is an INVALID_OPERATION in WebGL2)
float shCmp(highp sampler2D m, vec2 uv, float z, vec2 tx) {
  vec2 f = fract(uv / tx - .5), b = (floor(uv / tx - .5) + .5) * tx;
  vec4 d = vec4(texture(m, b).r, texture(m, b + vec2(tx.x, 0.)).r, texture(m, b + vec2(0., tx.y)).r, texture(m, b + tx).r);
  vec4 s = step(vec4(z), d);
  return mix(mix(s.x, s.y, f.x), mix(s.z, s.w, f.x), f.y);
}
float sunVis(vec3 local, vec3 n) {
  if (uShP.x < .5) return 1.;
  // one atlas, one lookup: cascade A (left half) where it covers the point, else B (right half)
  vec3 rel = local - uOrigin;
  vec3 pa = (uShMA * vec4(rel + n * uShBias.x, 1.)).xyz, pb = (uShMB * vec4(rel + n * uShBias.y, 1.)).xyz;
  vec2 ea = abs(pa.xy - .5), eb = abs(pb.xy - .5);
  float inA = step(max(ea.x, ea.y), .47) * step(pa.z, 1.);
  vec3 c = inA > .5 ? vec3(pa.x * .5, pa.y, pa.z) : vec3(pb.x * .5 + .5, pb.y, pb.z);
  float tx = inA > .5 ? uShP.y : uShP.z;
  float fade = inA > .5 ? 1. : (1. - smoothstep(.43, .49, max(eb.x, eb.y))) * step(pb.z, 1.);
  vec2 txy = vec2(tx * .5, tx);
  float s = (shCmp(uShA, c.xy + vec2(-.5, -.3) * txy, c.z, txy) + shCmp(uShA, c.xy + vec2(.5, .3) * txy, c.z, txy)) * .5;
  return mix(1., mix(1., s, fade), uShP.w);
}
// ---- environment
vec3 envRot(vec3 d, float a) { float c = cos(a), s = sin(a); return vec3(d.x * c - d.z * s, d.y, d.z * c + d.x * s); }
vec2 envUv(vec3 d) { return vec2(atan(d.x, -d.z) * .15915494 + .5, acos(clamp(d.y, -1., 1.)) * .31830989); }
vec3 shEval(vec3 c[9], vec3 d) {
  return c[0] + c[1] * d.y + c[2] * d.z + c[3] * d.x + c[4] * d.x * d.y + c[5] * d.y * d.z + c[6] * (3. * d.z * d.z - 1.) + c[7] * d.x * d.z + c[8] * (d.x * d.x - d.y * d.y);
}
vec3 envDiffuse(vec3 n) {
  if (uEnvMix > .999) return max(shEval(uEnvSH2, envRot(n, uEnvYaw2)), 0.) * uEnvGain2;
  vec3 a = max(shEval(uEnvSH, envRot(n, uEnvYaw)), 0.) * uEnvGain;
  if (uEnvMix > .001) a = mix(a, max(shEval(uEnvSH2, envRot(n, uEnvYaw2)), 0.) * uEnvGain2, uEnvMix);
  return a;
}
vec3 envHdri(vec3 R, float rough) {
  float lod = (uEnvLods - 2.) * pow(clamp(rough, 0., 1.), .55);
  if (uEnvMix > .999) return textureLod(uEnvT2, envUv(envRot(R, uEnvYaw2)), lod).rgb * uEnvGain2;
  vec3 a = textureLod(uEnvT, envUv(envRot(R, uEnvYaw)), lod).rgb * uEnvGain;
  if (uEnvMix > .001) a = mix(a, textureLod(uEnvT2, envUv(envRot(R, uEnvYaw2)), lod).rgb * uEnvGain2, uEnvMix);
  return a;
}
vec3 ggxSun(vec3 n, vec3 v, float rough, vec3 F0) {
  vec3 h = normalize(v + uSunDir); float nl = max(dot(n, uSunDir), 0.), nv = max(dot(n, v), 1e-3), nh = max(dot(n, h), 0.), vh = max(dot(v, h), 0.);
  float a = max(rough * rough, .002), a2 = a * a, dd = nh * nh * (a2 - 1.) + 1.;
  float D = a2 / (3.14159 * dd * dd);
  float k = a * .5, G = nl / (nl * (1. - k) + k) * nv / (nv * (1. - k) + k);
  vec3 F = F0 + (1. - F0) * pow(1. - vh, 5.);
  return uSunCol * D * G * F / (4. * nv + 1e-4);
}
vec3 fresnelR(float nv, vec3 F0, float rough) { return F0 + (max(vec3(1. - rough), F0) - F0) * pow(1. - nv, 5.); }
// planar mirror of the scene above the ground (night puddles); distort in uv units
vec3 planarRefl(vec3 rel, vec2 distort) { vec4 c = uReflM * vec4(rel, 1.); return texture(uReflT, c.xy / c.w + distort).rgb; }
// haze colour from the Preetham LUT: azimuth u, elevation rows (0, 3, 10, 30 deg)
vec3 hazeLutAt(vec3 d) {
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float row = el < 3. ? clamp(el, 0., 3.) / 3. : el < 10. ? 1. + (el - 3.) / 7. : 2. + clamp((el - 10.) / 20., 0., 1.);
  return texture(uHazeLut, vec2(atan(d.x, -d.z) * .15915494 + .5, (row + .5) / 4.)).rgb;
}
// Preetham sky radiance (three.js Sky.js, MIT), scaled into scene units by uPbGain
vec3 preethamSky(vec3 d, vec3 up) {
  float za = acos(max(0., dot(up, d)));
  float inv = 1. / (cos(za) + .15 * pow(93.885 - za * 57.29578, -1.253));
  vec3 Fex = exp(-(uPbBetaR * 8.4e3 * inv + uPbBetaM * 1.25e3 * inv));
  float ct = dot(d, uSunDir);
  float rP = .0596831 * (1. + pow(ct * .5 + .5, 2.));
  float g = .8, mP = .0795775 * (1. - g * g) / pow(1. - 2. * g * ct + g * g, 1.5);
  vec3 f = (uPbBetaR * rP + uPbBetaM * mP) / (uPbBetaR + uPbBetaM);
  vec3 Lin = pow(uPbSunE * f * (1. - Fex), vec3(1.5));
  Lin *= mix(vec3(1.), pow(uPbSunE * f * Fex, vec3(.5)), clamp(pow(1. - dot(up, uSunDir), 5.), 0., 1.));
  return ((Lin + .1 * Fex) * .04 + vec3(0., .0003, .00075)) * uPbGain;
}
`;
