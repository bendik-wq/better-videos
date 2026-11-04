// engine/sea/look.js: the bright looks (sun, sky, haze, water colours, grade) and the GLSL they share.
// Every shader in engine/sea (sky, ocean, land, post) reads the same uniforms, so the water reflects
// exactly the sky you see, and the haze on the land is the horizon colour of that sky.
import * as THREE from 'three';

const C = (r, g, b, k = 1) => new THREE.Vector3(r * k, g * k, b * k);
// sunAz: compass degrees (0 = north, 90 = east); local frame is x east, y up, z south.
export const LOOKS = {
  // High sun over the Gulf: pale dusty horizon, clean mid blue zenith, deep teal water, turquoise shallows.
  'bright-day': {
    sunEl: 58, sunAz: 160, sun: C(1.0, 0.965, 0.91, 3.3), zenith: C(0.045, 0.19, 0.50), horizon: C(0.72, 0.78, 0.82), sunHalo: 0.9,
    hazeDensity: 1 / 36000, hazeScale: 1400, hazeTint: C(0.80, 0.80, 0.78), skyAmb: C(0.30, 0.42, 0.62),
    deep: C(0.0022, 0.0195, 0.027), scatter: C(0.012, 0.085, 0.075), shallow: C(0.10, 0.52, 0.48), sand: C(0.82, 0.72, 0.54), absorb: C(0.42, 0.075, 0.06),
    foam: C(0.92, 0.93, 0.92), exposure: 1.0, contrast: 1.06, sat: 1.06, warm: 0.02, bloom: 0.55, landTint: C(1.0, 0.98, 0.95), landGain: 1.0, sunDisc: 1,
  },
  // Golden hour: low sun across the strait, warm haze, long glitter road, cooler water.
  golden: {
    sunEl: 7.5, sunAz: 252, sun: C(1.0, 0.66, 0.38, 3.6), zenith: C(0.045, 0.15, 0.34), horizon: C(0.98, 0.76, 0.52), sunHalo: 1.5,
    hazeDensity: 1 / 15000, hazeScale: 1100, hazeTint: C(0.95, 0.72, 0.52), skyAmb: C(0.25, 0.27, 0.36),
    deep: C(0.0035, 0.014, 0.024), scatter: C(0.02, 0.05, 0.05), shallow: C(0.10, 0.36, 0.36), sand: C(0.80, 0.62, 0.42), absorb: C(0.42, 0.075, 0.06),
    foam: C(1.0, 0.86, 0.72), exposure: 1.05, contrast: 1.08, sat: 1.04, warm: 0.06, bloom: 0.75, landTint: C(1.0, 0.80, 0.62), landGain: 0.8, sunDisc: 1,
  },
  // The Tanker War, 1980s (within the bright grade): a warm, hazy summer evening over the Gulf, faded
  // like Ektachrome: lower saturation, lifted blacks, warm tint, grain, a soft vignette.
  archive: {
    sunEl: 10, sunAz: 250, sun: C(1.0, 0.74, 0.5, 3.3), zenith: C(0.09, 0.18, 0.34), horizon: C(0.9, 0.78, 0.62), sunHalo: 1.4,
    hazeDensity: 1 / 11000, hazeScale: 1300, hazeTint: C(0.92, 0.78, 0.62), skyAmb: C(0.28, 0.28, 0.32),
    deep: C(0.004, 0.015, 0.021), scatter: C(0.02, 0.05, 0.048), shallow: C(0.12, 0.36, 0.34), sand: C(0.80, 0.64, 0.45), absorb: C(0.42, 0.075, 0.06),
    foam: C(1.0, 0.9, 0.78), exposure: 1.04, contrast: 1.03, sat: 0.86, warm: 0.06, bloom: 0.7, landTint: C(1.0, 0.84, 0.68), landGain: 0.85, sunDisc: 1,
    lift: 0.03, grain: 0.03, vignette: 0.28, tint: [1.03, 0.99, 0.91],
  },
  // Dawn over the Musandam fjords: the sun just up in the east, pink-gold haze, cool water.
  dawn: {
    sunEl: 4, sunAz: 95, sun: C(1.0, 0.6, 0.42, 3.1), zenith: C(0.075, 0.12, 0.26), horizon: C(0.96, 0.72, 0.6), sunHalo: 1.6,
    hazeDensity: 1 / 9000, hazeScale: 900, hazeTint: C(0.95, 0.75, 0.66), skyAmb: C(0.24, 0.26, 0.36),
    deep: C(0.003, 0.012, 0.022), scatter: C(0.016, 0.045, 0.05), shallow: C(0.1, 0.33, 0.35), sand: C(0.78, 0.6, 0.45), absorb: C(0.42, 0.075, 0.06),
    foam: C(1.0, 0.88, 0.8), exposure: 1.05, contrast: 1.05, sat: 1.02, warm: 0.04, bloom: 0.8, landTint: C(0.98, 0.78, 0.68), landGain: 0.75, sunDisc: 1,
  },
  // Bright day with smoke in the air (28 Feb 2026): the same sun, a browner, thicker horizon.
  smoke: {
    sunEl: 50, sunAz: 165, sun: C(1.0, 0.93, 0.84, 3.1), zenith: C(0.05, 0.19, 0.48), horizon: C(0.72, 0.71, 0.68), sunHalo: 1.0,
    hazeDensity: 1 / 24000, hazeScale: 1600, hazeTint: C(0.74, 0.70, 0.64), skyAmb: C(0.30, 0.38, 0.52),
    deep: C(0.0025, 0.018, 0.026), scatter: C(0.012, 0.075, 0.068), shallow: C(0.10, 0.48, 0.44), sand: C(0.80, 0.70, 0.52), absorb: C(0.42, 0.075, 0.06),
    foam: C(0.9, 0.9, 0.88), exposure: 1.0, contrast: 1.05, sat: 0.98, warm: 0.03, bloom: 0.5, landTint: C(0.96, 0.93, 0.88), landGain: 0.95, sunDisc: 1,
  },
  // Overcast-free "map" daylight for data shots: flatter, cleaner, higher key.
  map: {
    sunEl: 45, sunAz: 150, sun: C(1.0, 0.98, 0.95, 3.0), zenith: C(0.10, 0.24, 0.55), horizon: C(0.80, 0.84, 0.88), sunHalo: 0.5,
    hazeDensity: 1 / 60000, hazeScale: 2000, hazeTint: C(0.84, 0.87, 0.90), skyAmb: C(0.35, 0.45, 0.6),
    deep: C(0.012, 0.075, 0.11), scatter: C(0.02, 0.14, 0.17), shallow: C(0.12, 0.55, 0.55), sand: C(0.85, 0.76, 0.58), absorb: C(0.42, 0.075, 0.06),
    foam: C(0.95, 0.95, 0.95), exposure: 1.0, contrast: 1.0, sat: 1.0, warm: 0, bloom: 0.2, landTint: C(1, 1, 1), landGain: 1.0, sunDisc: 0,
  },
};

export function sunDir(look, out = new THREE.Vector3()) {
  const el = look.sunEl * Math.PI / 180, az = look.sunAz * Math.PI / 180;
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

// shared uniforms (one object per Sea; materials reference these same objects)
export function makeUniforms() {
  const v = () => ({ value: new THREE.Vector3() }), f = (x = 0) => ({ value: x });
  return {
    uSunDir: v(), uSunCol: v(), uZenith: v(), uHorizon: v(), uSunHalo: f(1), uSkyAmb: v(), uHazeD: f(0), uHazeH: f(1000), uHazeTint: v(),
    uDeep: v(), uScatter: v(), uShallow: v(), uSand: v(), uAbsorb: v(), uFoamCol: v(), uLandTint: v(), uLandGain: f(1),
    uCam: v(), uCamH: f(10), uTime: f(0), uUnder: f(0), uSunDisc: f(1),
  };
}
export function applyLook(U, look) {
  U.uSunDir.value.copy(sunDir(look)); U.uSunCol.value.copy(look.sun); U.uZenith.value.copy(look.zenith); U.uHorizon.value.copy(look.horizon);
  U.uSunHalo.value = look.sunHalo; U.uSkyAmb.value.copy(look.skyAmb); U.uHazeD.value = look.hazeDensity; U.uHazeH.value = look.hazeScale; U.uHazeTint.value.copy(look.hazeTint);
  U.uDeep.value.copy(look.deep); U.uScatter.value.copy(look.scatter); U.uShallow.value.copy(look.shallow); U.uSand.value.copy(look.sand); U.uAbsorb.value.copy(look.absorb);
  U.uFoamCol.value.copy(look.foam); U.uLandTint.value.copy(look.landTint); U.uLandGain.value = look.landGain; U.uSunDisc.value = look.sunDisc ?? 1;
}
// lerp two looks (for a sun that moves during a shot): returns a new look object
export function mixLook(a, b, k) {
  a = typeof a === 'string' ? LOOKS[a] : a; b = typeof b === 'string' ? LOOKS[b] : b; const o = {};
  for (const key in a) { const x = a[key], y = b[key]; o[key] = x?.isVector3 ? x.clone().lerp(y, k) : typeof x === 'number' ? x + (y - x) * k : x; }
  return o;
}

// GLSL shared by every engine/sea shader
export const GLSL = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uZenith, uHorizon, uSkyAmb, uHazeTint, uCam, uDeep, uScatter, uShallow, uSand, uAbsorb, uFoamCol, uLandTint;
  uniform float uSunHalo, uHazeD, uHazeH, uCamH, uTime, uUnder, uLandGain, uSunDisc;
  const float PI = 3.14159265;
  const float R_EARTH = 6371000.;
  // sky radiance (no sun disc) for a direction; the horizon dips with altitude
  vec3 skyColor(vec3 d) {
    float dip = acos(clamp(R_EARTH / (R_EARTH + max(uCamH, 0.)), 0., 1.));
    float e = asin(clamp(d.y, -1., 1.)) + dip;
    float h = clamp(e, 0., 1.5708);
    float hz = exp(-h * 9.);                                         // the dusty horizon band
    vec3 c = mix(uZenith, uHorizon, pow(1. - h / 1.5708, 5.) * .85 + hz * .15);
    c += uHorizon * hz * .12;
    float cg = dot(d, uSunDir);
    const float g = .76; float mie = (1. - g * g) / pow(1. + g * g - 2. * g * cg, 1.5) / (4. * PI);
    c += uSunCol * mie * .055 * uSunHalo * (.35 + .65 * exp(-h * 3.));
    c += uSunCol * pow(max(cg, 0.), 6.) * .05 * uSunHalo * exp(-h * 2.);
    // below the horizon (seen only at altitude past the ocean edge): the haze
    c = mix(c, uHorizon * .95, smoothstep(0., -.02, e));
    return c;
  }
  // aerial perspective: optical depth of an exponential atmosphere between the camera and p
  // (y = metres above sea level), and the in-scattered colour for that view direction
  float hazeDepth(vec3 p) {
    float d = length(p - uCam), dy = p.y - uCam.y;
    float a = exp(-max(uCam.y, 0.) / uHazeH), b = exp(-max(p.y, 0.) / uHazeH);
    float k = abs(dy) > 1. ? (a - b) / (dy / uHazeH) : a;
    return uHazeD * d * max(k, 0.);
  }
  // the haze is the sky just above the horizon in that direction, so far water and land dissolve into it
  vec3 hazeColor(vec3 dir) {
    float dip = acos(clamp(R_EARTH / (R_EARTH + max(uCamH, 0.)), 0., 1.));
    vec3 hd = normalize(vec3(dir.x, 0., dir.z)); float e = clamp(asin(clamp(dir.y, -1., 1.)) + dip, 0., .25) * .3 + .004 - dip;
    return skyColor(normalize(vec3(hd.x * cos(e), sin(e), hd.z * cos(e))));
  }
  float schlick(float c) { return .02 + .98 * pow(1. - clamp(c, 0., 1.), 5.); }
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
`;
