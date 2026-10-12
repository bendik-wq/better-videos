// engine/sea/ocean.js: the ocean surface. A camera-centred polar grid (dense under the lens, kilometres
// wide at the horizon) displaced by the FFT cascades, with per-cascade displacement faded out where
// the grid is too coarse to carry it (LOD from 2 m to 10 km up). The fragment shader does the look:
//   - normals and slope variance from the mipmapped cascade slopes (LEAN-style: E[s^2] - E[s]^2), so
//     the sun turns from single glints near the lens into a broad glitter road far away and from altitude
//   - sun specular: anisotropic Gaussian slope distribution (Cox-Munk / Bruneton 2010)
//   - fresnel sky reflection of the same sky the sky dome draws
//   - upwelling colour + crest subsurface; turquoise shallows: Beer-Lambert through the real water
//     column to whatever is under the surface (sand floor, the real seabed / photo), read from the
//     opaque pass (colour + depth)
//   - foam: wave-breaking (Jacobian), shore break, ship wakes (Kelvin arms, turbulent centreline,
//     bow wave), all broken up by a tiling foam texture
//   - wind slicks: kilometre-scale roughness modulation (the streaks you see from a plane)
//   - ship shadows on the water (analytic, from each hull's footprint)
//   - seen from below: Snell's window, total internal reflection, the underside of the waves
import * as THREE from 'three';
import { GLSL } from './look.js';

export const MAX_SHIPS = 16;

// a tiling value-noise texture (RGBA = 4 octave sets), deterministic
export function noiseTexture(N = 256, seed = 11) {
  const data = new Uint8Array(N * N * 4);
  const rnd = (i, j, o) => { let h = (i * 374761393 + j * 668265263 + o * 2147483647 + seed * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, P, o) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const g = (a, b) => rnd(((a % P) + P) % P, ((b % P) + P) % P, o);
    return (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) + (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) for (let c = 0; c < 4; c++) {
    let s = 0, a = 0.5, tot = 0; for (let oct = 0; oct < 5; oct++) { const P = 4 * (1 << oct) * (c + 1); s += a * vn(i / N * P, j / N * P, P, c * 10 + oct); tot += a; a *= 0.5; }
    data[(j * N + i) * 4 + c] = Math.round(s / tot * 255);
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}

function polarGrid(segs = 192, rings = 260, q = 1.045) {
  const pos = [], idx = [];
  pos.push(0, 0, 0);
  let r = 1; const radii = [];
  for (let j = 0; j < rings; j++) { radii.push(r); r *= q; }
  for (let j = 0; j < rings; j++) for (let s = 0; s < segs; s++) { const a = s / segs * Math.PI * 2; pos.push(Math.cos(a) * radii[j], radii[j] * (q - 1), Math.sin(a) * radii[j]); }
  for (let s = 0; s < segs; s++) idx.push(0, 1 + (s + 1) % segs, 1 + s);
  for (let j = 0; j < rings - 1; j++) for (let s = 0; s < segs; s++) { const a0 = 1 + j * segs, a1 = a0 + segs, s1 = (s + 1) % segs; idx.push(a0 + s, a0 + s1, a1 + s, a0 + s1, a1 + s1, a1 + s); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e12); return g;
}

export function oceanMaterial(U, spectrum, o = {}) {
  const C = spectrum.cascades;
  const uni = {
    ...U,
    tD0: { value: C[0].tD }, tD1: { value: C[1].tD }, tD2: { value: C[2].tD }, tS0: { value: C[0].tS }, tS1: { value: C[1].tS }, tS2: { value: C[2].tS },
    uL: { value: new THREE.Vector3(C[0].L, C[1].L, C[2].L) }, uR0: { value: 1 }, uQ: { value: 1.045 }, uFar: { value: 4e5 },
    uNoise: { value: o.noise ?? noiseTexture() }, uUnres: { value: spectrum.sigmaUnresolved }, uFoamJ: { value: o.foamJ ?? 0.92 }, uFoamK: { value: o.foam ?? 1 },
    uSlick: { value: o.slick ?? 0.5 }, uChopFade: { value: 1 },
    uOpaque: { value: null }, uOpaqueDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1, 1) },
    uNear: { value: 0.1 }, uFarCam: { value: 1e5 }, uHasOpaque: { value: 0 },
    uShipA: { value: Array.from({ length: MAX_SHIPS }, () => new THREE.Vector4()) }, uShipB: { value: Array.from({ length: MAX_SHIPS }, () => new THREE.Vector4()) },
    uShipC: { value: Array.from({ length: MAX_SHIPS }, () => new THREE.Vector4()) }, uShips: { value: 0 },
    uDepthTex: { value: null }, uDepthBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uDepthTex2: { value: null }, uDepthBox2: { value: new THREE.Vector4(0, 0, 0, 0) }, uDepthOn: { value: 0 }, uDepthConst: { value: o.depth ?? 2000 }, uDepthScale: { value: 1 },
    uGlitter: { value: o.glitter ?? 1 }, uFlat: { value: 0 }, uCurv: { value: 1 }, uAmp: { value: 1 },
  };
  return new THREE.ShaderMaterial({
    uniforms: uni,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${GLSL}
      uniform sampler2D tD0, tD1, tD2; uniform vec3 uL; uniform float uR0, uQ, uFar, uCurv, uAmp, uFlat;
      varying vec3 vW; varying vec2 vXZ; varying float vSpacing, vDistCam; varying vec3 vFade;
      void main() {
        float r = length(position.xz) * uR0;
        vec2 dirc = length(position.xz) > 0. ? normalize(position.xz) : vec2(0.);
        r = min(r, uFar);
        vec2 xz = uCam.xz + dirc * r;
        float spacing = max(position.y * uR0, .02);
        vec3 fade = vec3(1. - smoothstep(uL.x / 40., uL.x / 8., spacing), 1. - smoothstep(uL.y / 40., uL.y / 8., spacing), 1. - smoothstep(uL.z / 40., uL.z / 8., spacing));
        fade *= uAmp * (1. - uFlat);
        vec3 d = vec3(0.);
        if (fade.x > 0.) d += textureLod(tD0, xz / uL.x, 0.).xyz * fade.x;
        if (fade.y > 0.) d += textureLod(tD1, xz / uL.y, 0.).xyz * fade.y;
        if (fade.z > 0.) d += textureLod(tD2, xz / uL.z, 0.).xyz * fade.z;
        vec3 w = vec3(xz.x + d.x, d.y, xz.y + d.z);
        float dd = length(w.xz - uCam.xz);
        w.y -= uCurv * dd * dd / (2. * R_EARTH);                          // the earth curves away under the haze
        vW = w; vXZ = xz; vSpacing = spacing; vFade = fade; vDistCam = dd;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL}
      uniform sampler2D tS0, tS1, tS2, tD0, tD1, tD2, uNoise, uOpaque, uOpaqueDepth, uDepthTex, uDepthTex2;
      uniform vec3 uL; uniform float uUnres, uFoamJ, uFoamK, uSlick, uHasOpaque, uNear, uFarCam, uDepthOn, uDepthConst, uDepthScale, uGlitter, uFlat, uAmp;
      uniform vec2 uRes; uniform mat4 uInvProj; uniform vec4 uDepthBox, uDepthBox2;
      // elevation (m, + land / - sea floor) from the finest DEM that covers p; 1e4 = unknown
      float elevAt(vec2 p) { vec2 a = (p - uDepthBox.xy) / (uDepthBox.zw - uDepthBox.xy); if (all(greaterThan(a, vec2(0.))) && all(lessThan(a, vec2(1.)))) return texture(uDepthTex, a).r;
        vec2 b = (p - uDepthBox2.xy) / (uDepthBox2.zw - uDepthBox2.xy); if (uDepthBox2.z > uDepthBox2.x && all(greaterThan(b, vec2(0.))) && all(lessThan(b, vec2(1.)))) return texture(uDepthTex2, b).r; return -1e4; }
      uniform vec4 uShipA[${MAX_SHIPS}], uShipB[${MAX_SHIPS}], uShipC[${MAX_SHIPS}]; uniform int uShips;
      varying vec3 vW; varying vec2 vXZ; varying float vSpacing, vDistCam; varying vec3 vFade;

      float linDepth(float z) { vec4 v = uInvProj * vec4(0., 0., z * 2. - 1., 1.); return -v.z / v.w; }
      float noiseA(vec2 p) { return texture(uNoise, p).r; }

      // Kelvin wake height (m) in ship-local coords: u = metres behind the stern, v = lateral (m)
      float kelvin(float u, float v, float L, float B, float V) {
        if (u < -L * .3) return 0.;
        float uu = max(u, 0.) + L * .15;
        float kt = 9.81 / max(V * V, 1.);                                  // transverse wavenumber, lambda = 2 pi V^2 / g
        float wedge = uu * .3536;                                          // tan(19.47 deg)
        float av = abs(v);
        float inW = smoothstep(wedge * 1.05, wedge * .75, av);
        float amp = .45 * clamp(V / 8., 0., 1.4) * sqrt(B / 30.) / sqrt(1. + uu / (L * 1.2));
        float tr = sin(kt * uu) * inW * amp * .55;
        // divergent waves: short crests along the arms, at about 35 deg to the track
        float kd = kt * 2.4; float ph = kd * (av * .82 + uu * .57);
        float arm = exp(-pow((av - wedge * .92) / (2. + uu * .045), 2.));
        float dv = sin(ph) * arm * amp;
        return (tr + dv) * smoothstep(-L * .3, L * .1, u);
      }

      void main() {
        vec3 P = vW;
        vec3 V = normalize(uCam - P); float dist = length(uCam - P);
        bool below = uUnder > .5;
        // ---- slopes and their variance (mip-filtered by distance)
        vec2 s = vec2(0.); vec2 v2 = vec2(0.);
        vec4 a0 = texture(tS0, vXZ / uL.x), a1 = texture(tS1, vXZ / uL.y), a2 = texture(tS2, vXZ / uL.z);
        float f0 = uAmp * (1. - uFlat);
        s = (a0.xy + a1.xy + a2.xy) * f0;
        v2 = (max(a0.zw - a0.xy * a0.xy, 0.) + max(a1.zw - a1.xy * a1.xy, 0.) + max(a2.zw - a2.xy * a2.xy, 0.)) * f0 * f0;
        float J = (texture(tD0, vXZ / uL.x).w - 1.) + (texture(tD1, vXZ / uL.y).w - 1.) + (texture(tD2, vXZ / uL.z).w - 1.) + 1.;
        J = mix(1., J, f0);
        float crest = texture(tD1, vXZ / uL.y).y * f0;
        // wind slicks: km-scale patches of calmer, mirror-like water
        vec2 wd = normalize(vec2(1., .7)); vec2 sxz = vec2(dot(vXZ, wd), dot(vXZ, vec2(-wd.y, wd.x)) * 3.5);   // streaks along the wind
        float slick = smoothstep(.48, .66, texture(uNoise, sxz / 9000. + vec2(.13, .71)).g * .65 + texture(uNoise, sxz / 2300. + .3).b * .35);
        float rough = mix(1., .35, slick * uSlick);
        s *= mix(1., .8, slick * uSlick); v2 *= rough;
        float sig = uUnres * rough * f0 + 2e-5;
        vec2 var = v2 + sig;
        // ---- ship wakes, bow waves, hull shadows
        float wakeFoam = 0., aerated = 0., shadow = 0., calm = 0.;
        vec2 ws = vec2(0.);
        for (int i = 0; i < ${MAX_SHIPS}; i++) {
          if (i >= uShips) break;
          vec4 A = uShipA[i], B = uShipB[i], Cc = uShipC[i];
          vec2 dlt = P.xz - A.xy; vec2 fw = A.zw, sd = vec2(-fw.y, fw.x);
          float u = dot(dlt, fw), vv = dot(dlt, sd);
          float L = B.x, Bm = B.y, Vs = B.z, fk = B.w;
          float Lw = max(L, Vs * 9.);                                        // small fast craft leave wakes far longer than themselves
          float us = -(u + L * .5);                                         // metres behind the stern
          // shadow: the point seen from the sun, lifted to the deck height, inside the footprint?
          { vec2 q = dlt + uSunDir.xz / max(uSunDir.y, .05) * Cc.x; float qu = dot(q, fw), qv = dot(q, sd);
            float inHull = (1. - smoothstep(L * .5 - 6., L * .5, abs(qu + L * .04))) * (1. - smoothstep(Bm * .5 - 2., Bm * .5 + 1., abs(qv) + max(0., qu - L * .32) * .35));
            shadow = max(shadow, inHull * Cc.y); }
          if (us > -L * 1.2 && us < Lw * 40. && abs(vv) < max(us, 0.) * .45 + Bm * 3.) {
            // turbulent centreline: foam near the stern, a long pale aerated streak behind
            float W = Bm * (.55 + .32 * pow(max(us, 0.) / Bm, .55));
            float lat = 1. - smoothstep(W * .35, W * .62, abs(vv));
            float n = noiseA(vec2(us, vv) / (Bm * 2.2) + A.xy * .001) * .65 + noiseA(vec2(us, vv) / (Bm * .55)) * .35;
            float near = smoothstep(-L * .55, 0., us) * exp(-max(us, 0.) / (Lw * (.45 + .6 * fk)));
            wakeFoam = max(wakeFoam, lat * near * smoothstep(.45, .75, n + .25 * near) * fk * .9);
            aerated = max(aerated, lat * smoothstep(-L * .5, 0., us) * exp(-max(us, 0.) / (Lw * 4.5)) * (.35 + .65 * n) * min(1., Vs / 5.) * .6);
            calm = max(calm, (1. - smoothstep(W * .45, W * 1.2, abs(vv))) * smoothstep(0., L, us) * exp(-max(us, 0.) / (L * 10.)));
            // Kelvin arms: whitecaps along the arms close to the ship, height field for the normals
            float e = 1.5;
            float h0 = kelvin(us, vv, L, Bm, Vs), hu = kelvin(us + e, vv, L, Bm, Vs), hv = kelvin(us, vv + e, L, Bm, Vs);
            vec2 g = vec2(hu - h0, hv - h0) / e;                               // d/dus, d/dvv
            float lam = 6.283 * Vs * Vs / 9.81 / 2.4, fpx = dist * .0011 / max(V.y, .08);   // shortest Kelvin wavelength vs the pixel footprint
            ws += (-fw * g.x + sd * g.y) * (1. - smoothstep(lam * .12, lam * .3, fpx));
            float wedge = max(us, 0.) * .3536;
            float armF = exp(-pow((abs(vv) - wedge) / (Bm * .3 + us * .015), 2.)) * exp(-max(us, 0.) / (Lw * .9)) * smoothstep(-L * .1, L * .2, us);
            wakeFoam = max(wakeFoam, armF * smoothstep(.45, .8, n) * .8 * fk * min(1., Vs / 6.));
          }
          // bow wave: a white roll of water along the forward third of the hull
          float bu = u - L * .5;                                              // metres from the bow (negative = aft)
          if (bu > -L * .5 && bu < Bm * 2. && abs(vv) < Bm * 1.6) {
            float hw = Bm * .5 * clamp(1. - pow(max(bu + L * .32, 0.) / (L * .32), 2.), 0., 1.);
            float side = abs(vv) - hw;
            float n2 = noiseA(vec2(bu, vv) / 9. + A.xy * .002);
            float bw = exp(-pow(side / (1.2 + Bm * .05), 2.)) * smoothstep(-L * .5, -L * .1, bu) * (1. - smoothstep(0., Bm, bu));
            float spray = exp(-pow(side / (3. + Bm * .2), 2.)) * smoothstep(-L * .18, 0., bu) * (1. - smoothstep(0., Bm * .8, bu));
            wakeFoam = max(wakeFoam, (bw * .7 + spray) * smoothstep(.3, .65, n2 + .2) * clamp(Vs / 6., 0., 1.) * fk);
          }
        }
        s += ws;
        s *= (1. - calm * .5); var *= (1. - calm * .55);
        // ---- normal
        vec3 N = normalize(vec3(-s.x, 1., -s.y));
        if (below) N = -N;
        // ---- water column under this pixel (shallows)
        float bedT = 1e9; vec3 bed = vec3(0.); float bedKind = 0.;
        vec2 suv = gl_FragCoord.xy / uRes;
        if (uHasOpaque > .5) {
          vec2 ruv = clamp(suv + N.xz * vec2(1., -1.) * .015 * clamp(30. / dist, 0., 1.), .001, .999);
          float zr = texture(uOpaqueDepth, ruv).r;
          vec2 uv2 = linDepth(zr) < dist ? suv : ruv;                         // never refract things in front of the water
          float zb = texture(uOpaqueDepth, uv2).r; vec4 o = texture(uOpaque, uv2);
          if (zb < .99999) { float db = linDepth(zb); float cosv = max(dot(V, normalize(uCam - P)), .05);
            bedT = max(0., db / max(linDepth(gl_FragCoord.z), 1e-3) * dist - dist); bed = o.rgb; bedKind = o.a; }
        }
        float depthHere = uDepthConst;
        float elevHere = uDepthOn > .5 ? elevAt(P.xz) : -1e4;
        if (elevHere > -9e3) depthHere = max(0., -elevHere) * uDepthScale;
        // from altitude, land in the DEM owns the pixel (depth precision cannot separate a 2 m beach from the sea 100 km away)
        if (uCamH > 1200. && elevHere > .5 && !below && texture(uOpaque, gl_FragCoord.xy / uRes).a > .25) discard;
        // ---- lighting
        vec3 L = uSunDir; float mu = max(dot(V, vec3(0., 1., 0.)), .02);
        float NV = max(dot(N, V), 0.);
        float F = schlick(NV);
        vec3 R = reflect(-V, N); if (!below) R.y = abs(R.y);
        vec3 sky = skyColor(R);
        // sun: slope-space Gaussian (anisotropic variance), Bruneton's reflectance
        vec3 H = normalize(V + L);
        vec2 zeta = -H.xz / max(H.y, .05);
        vec2 dz = zeta - (-s);
        float p = exp(-.5 * (dz.x * dz.x / var.x + dz.y * dz.y / var.y)) / (2. * PI * sqrt(var.x * var.y));
        float ch = max(H.y, .05);
        float spec = schlick(dot(V, H)) * p / (4. * mu * ch * ch * ch * ch) * max(L.y, 0.);
        spec *= (1. - shadow * .92);
        // sparkle: unresolved micro-facets near the lens catch the sun as single points
        // the probability that a micro-facet in this pixel's footprint points the sun at the lens ~ p,
        // so sparkles appear where the glitter lobe is; each lives one 1/24 s tick (real glitter twinkles)
        float gl = 0.;
        if (uGlitter > 0. && dist < 350.) {
          float fp = max(.06, dist * .0009);
          vec2 cell = floor(vXZ / fp); float hsh = hash12(cell + floor(uTime * 24.) * 17.31);
          float pr = clamp(p * .0025 * fp, 0., .35);
          gl = step(1. - pr, hsh) * uGlitter * (1. - shadow) * smoothstep(350., 120., dist);
        }
        vec3 sunSpec = uSunCol * (spec + gl * schlick(dot(V, H)) * 4. / (4. * mu) * max(L.y, .05) * 12.);
        // upwelling light: deep body colour, crest subsurface (light through the thin crests)
        vec3 Ed = uSunCol * max(L.y, 0.) + uSkyAmb * 1.2;
        vec3 body = uDeep * Ed * (1. - shadow * .35);
        float sss = pow(max(dot(normalize(vec3(-V.x, 0., -V.z)), normalize(vec3(L.x, 0., L.z))) * .5 + .5, 0.), 3.) * .55 + .45;
        body += uScatter * Ed * max(crest, 0.) * sss * (1. - smoothstep(60., 600., dist));
        body += uScatter * Ed * aerated * .9;                                 // bubbles in the wake: pale turquoise
        // shallow water: Beer-Lambert to the bottom (or to the real seabed photo)
        if (uDepthOn > .5 || bedT < 1e8) {
          float t = uDepthOn > .5 && bedT > 1e8 ? depthHere / mu : bedT;
          vec3 T = exp(-(uAbsorb + (bedKind > .9 ? .22 : .03)) * t);
          vec3 floorCol = bedT < 1e8 ? bed : uSand * Ed * .35;
          if (bedKind > .45 && bedKind < .55) T = mix(vec3(1.), T, .35);    // photo seabed: the water column is already in it
          vec3 shallowScatter = uShallow * Ed * .12 * (1. - exp(-t * .25));
          if (bedKind > .9 && bedT < 1e8) body = floorCol * T * .6 + body * (1. - T);                  // a submerged hull: just fades into the water
          else body = mix(body, floorCol * T + shallowScatter * (1. - T.g) + body * (1. - T.g) * .4, 1. - smoothstep(18., 40., t));
        }
        // ---- foam
        float fn = noiseA(vXZ / 7.3) * .6 + noiseA(vXZ / 1.9 + .37) * .4;
        float brk = smoothstep(uFoamJ, uFoamJ - .22, J) * smoothstep(.35, .75, fn) * (1. - smoothstep(150., 1200., dist));
        float shore = 0.;
        if (uDepthOn > .5 && depthHere < 3. && dist < 4000.) shore = (1. - smoothstep(1500., 4000., dist)) * smoothstep(3., .4, depthHere) * smoothstep(.4, .7, fn + .25 * sin(vXZ.x * .05 + vXZ.y * .04 + uTime * .9));
        float foam = clamp(max(brk * uFoamK, max(wakeFoam, shore)), 0., 1.);
        vec3 foamCol = uFoamCol * (uSunCol * max(dot(N, L) * .6 + .4, 0.) * (1. - shadow * .7) + uSkyAmb * 1.4) / PI;
        // ---- combine
        vec3 col;
        if (!below) {
          col = mix(body, sky, F) + sunSpec;
          col = mix(col, foamCol, foam * .92);
        } else {
          // from below: Snell's window (refracted sky) inside ~48.6 deg, total internal reflection outside
          vec3 Rf = refract(-V, N, 1.333);
          float win = length(Rf) > .0 ? 1. : 0.;
          vec3 through = skyColor(normalize(Rf + vec3(0., 1e-4, 0.))) * (1. - schlick(abs(dot(N, V)))) + uSunCol * pow(max(dot(Rf, L), 0.), 400.) * 30.;
          col = mix(uDeep * Ed * 1.4, through, win) + foamCol * foam * .5;
        }
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

export class Ocean {
  constructor(U, spectrum, o = {}) {
    this.spectrum = spectrum;
    this.material = oceanMaterial(U, spectrum, o);
    this.mesh = new THREE.Mesh(polarGrid(o.segments ?? 192, o.rings ?? 300, 1.045), this.material);
    this.mesh.frustumCulled = false; this.mesh.name = 'ocean';
    this.U = this.material.uniforms;
  }
  // per frame: grid scale from the camera height (dense under the lens), far edge at the horizon
  update(camera) {
    const h = Math.max(1, Math.abs(camera.position.y));
    this.U.uR0.value = Math.min(400, Math.max(0.12, h * 0.025));
    this.U.uFar.value = Math.sqrt(2 * 6371000 * h + h * h) * 1.25 + 30000;
  }
  setShips(list) {
    const U = this.U; let n = 0;
    for (const s of list) { if (n >= MAX_SHIPS) break; const st = s.state; if (!st) continue;
      U.uShipA.value[n].set(st.x, st.z, Math.sin(st.heading), -Math.cos(st.heading));
      U.uShipB.value[n].set(s.length, s.beam, st.speed, s.wake ?? 1);
      U.uShipC.value[n].set(s.deckH ?? 12, s.shadow ?? 1, 0, 0); n++; }
    U.uShips.value = n;
  }
}
