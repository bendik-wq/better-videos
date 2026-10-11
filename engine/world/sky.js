// Sky (full-screen, analytic: gradient, afterglow, sun/moon, light-pollution dome, stars, black
// space with a glowing limb from altitude) and the cloud deck (stacked noise layers on the sphere,
// lit from above by the time of day and from below by the city; fog when the camera is inside).
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, sstep, clamp } from './core.js';

export function buildSky(world) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const mat = worldMaterial(world.U, {
    uniforms: { uInvProj: { value: new THREE.Matrix4() }, uCamRot: { value: new THREE.Matrix4() } },
    vertex: /* glsl */`
      uniform mat4 uInvProj, uCamRot; varying vec3 vDir;
      void main() { vec4 v = uInvProj * vec4(position.xy, 1., 1.); vDir = (uCamRot * vec4(v.xyz / v.w, 0.)).xyz; gl_Position = vec4(position.xy, .99999, 1.); }`,
    fragment: /* glsl */`
      varying vec3 vDir;
      void main() { vec3 d = normalize(vDir); vec3 c = skyColor(d);
        float Tc = (uCloudFog > 0. ? exp(-uCloudFog * 4000.) : 1.) * (1. - uWhite); c = c * Tc + uCloudCol * (1. - Tc);
        if (uMap > .001) c = mix(c, uMapBg, uMap);
        gl_FragColor = vec4(c, 1.);
        ${GLSL_TONE} }`,
    depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = -100; mesh.name = 'sky';
  mesh.onBeforeRender = (r, s, cam) => { mat.uniforms.uInvProj.value.copy(cam.projectionMatrixInverse); mat.uniforms.uCamRot.value.extractRotation(cam.matrixWorld); };
  return mesh;
}

// ---------------------------------------------------------------- cloud deck
// A slab between base and base + thick (metres above the anchor), ray-marched in 8 jittered steps
// from whichever slab face the camera sees (or from the camera when it is inside), so it reads as
// volume from above, below and inside with no layer stripes. Density is 2D noise with a vertical
// profile (domed tops). Lit by the time of day from above and by the city from below.
// opts: { base, thick, fog (in-cloud fog multiplier; 0 when a keyed whiteout is used), coverage 0..1, radius, scale, wind:[x,z] m/s, holes: [[gx, gz, r]] (r < 0 = a denser patch), sigma }
export function buildClouds(world, o = {}) {
  const F = world.frame;
  const base = o.base ?? 1800, thick = o.thick ?? 500, rMax = o.radius ?? 90000;
  const group = new THREE.Group(); group.name = 'clouds';
  const holes = (o.holes ?? []).slice(0, 4).map(h => new THREE.Vector3(...h));
  while (holes.length < 4) holes.push(new THREE.Vector3(0, 0, 0));
  const plane = (h) => {
    const rings = [0]; for (let r = 60; r < rMax; r *= 1.12) rings.push(r); rings.push(rMax);
    const segs = 96, pos = [], idx = [], v = new THREE.Vector3();
    pos.push(0, h, 0);
    for (let j = 1; j < rings.length; j++) for (let s = 0; s < segs; s++) { const a = s / segs * Math.PI * 2; F.surface(Math.cos(a) * rings[j], Math.sin(a) * rings[j], h, v); pos.push(v.x, v.y, v.z); }
    for (let s = 0; s < segs; s++) idx.push(0, 1 + (s + 1) % segs, 1 + s);
    for (let j = 1; j < rings.length - 1; j++) for (let s = 0; s < segs; s++) { const a0 = 1 + (j - 1) * segs, a1 = 1 + j * segs, s1 = (s + 1) % segs; idx.push(a0 + s, a0 + s1, a1 + s, a0 + s1, a1 + s1, a1 + s); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); return geo;
  };
  const uni = { uBase: { value: base }, uThick: { value: thick }, uCov: { value: o.coverage ?? 0.5 }, uScale: { value: o.scale ?? 1 }, uMode: { value: 0 },
    uWind: { value: new THREE.Vector2(...(o.wind ?? [3, 1])) }, uRMax: { value: rMax }, uHoles: { value: holes }, uOpacity: { value: o.opacity ?? 1 }, uSigma: { value: o.sigma ?? 0.012 } };
  const mat = worldMaterial(world.U, {
    uniforms: uni,
    vertex: /* glsl */`
      varying vec3 vRel;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vRel = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      uniform float uBase, uThick, uCov, uScale, uRMax, uOpacity, uSigma, uMode; uniform vec2 uWind; uniform vec3 uHoles[4];
      varying vec3 vRel;
      float dens2(vec2 g, float k) {
        vec2 p = (g + uWind * uTime) / uScale;
        float n = texture(uNoise, p / 23000.).r * .55 + texture(uNoise, p / 7000. + .31).r * .3 + texture(uNoise, p / 1900. + .73).b * .15;
        for (int i = 0; i < 4; i++) if (uHoles[i].z != 0.) { float hr = abs(uHoles[i].z); n -= sign(uHoles[i].z) * .35 * (1. - smoothstep(hr * .3, hr, length(g - uHoles[i].xy) * (.75 + .5 * texture(uNoise, p / 3100. + .2).g))); }
        float prof = sin(3.14159 * (.1 + .8 * clamp(k, 0., 1.)));
        float th = mix(.62, .38, uCov) + (1. - prof) * .16;
        return smoothstep(th, th + .1, n);
      }
      void main() {
        float tHit = length(vRel); vec3 d = vRel / tHit;
        vec3 up = upAt(uOrigin); float du = dot(d, up);
        float t0, t1;
        if (uMode < .5) { t0 = tHit; t1 = tHit + min(uThick / max(abs(du), .06), 4500.); }  // outside: march into the slab
        else { t0 = 0.; t1 = tHit; }                                                         // inside: camera -> face
        float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));  // interleaved gradient noise
        const int N = CLOUD_STEPS; float ds = (t1 - t0) / float(N);
        float T = 1.; vec3 acc = vec3(0.);
        vec3 sh2 = normalize(uSunDir - up * dot(uSunDir, up) + 1e-4);
        float az = dot(normalize(d - up * du + 1e-4), sh2) * .5 + .5;
        vec3 topL = uCloudLit * (.6 + .8 * pow(az, 3.)) + uGlow * .4 * pow(az, 4.);
        vec3 e0 = uOrigin + d * t0;
        vec3 below = uAmbSky * .35 + uCityGlow * 2.4 * exp(-length(e0.xz - uCityPos.xz) / (uCityR * 2.2));
        for (int i = 0; i < N; i++) {
          float t = t0 + (float(i) + j) * ds; vec3 p = uOrigin + d * t;
          float k = (altOf(p) - uElev0 - uBase) / uThick;
          if (k < -.02 || k > 1.02) continue;
          float de = dens2(p.xz, k);
          if (de < .001) continue;
          vec3 L = mix(below, topL, smoothstep(.1, 1., k)) * mix(.55, 1., de);
          float a = 1. - exp(-uSigma * de * ds);
          acc += T * a * L; T *= 1. - a;
          if (T < .02) break;
        }
        vec3 hp = uOrigin + d * t0;
        float edge = 1. - smoothstep(uRMax * .55, uRMax * .95, length(hp.xz));
        // from high up the deck hands over to the globe's cloud map (fades out above ~30-80 km)
        float alpha = (1. - T) * uOpacity * edge * (1. - smoothstep(30000., 80000., uCamAlt - uElev0));
        vec3 col = acc / max(1. - T, 1e-3);
        col = applyFog(col, d * max(t0, 1.), uOrigin + d * max(t0, 1.));
        col = mix(col, uMapBg, uMap);
        gl_FragColor = vec4(col * alpha * (1. - uMap), alpha * (1. - uMap));
        ${GLSL_TONE}
      }`,
    defines: { CLOUD_STEPS: o.steps ?? (world.opts.quality === 'draft' ? 5 : 7) },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const top = new THREE.Mesh(plane(base + thick), mat), bot = new THREE.Mesh(plane(base), mat);
  for (const m of [top, bot]) { m.frustumCulled = false; m.renderOrder = 10; group.add(m); }
  // CPU twin of the density (for the in-cloud fog): sample the noise texture data
  const N = world.U.uNoise.value.image, nd = N.data, NW = N.width;
  const samp = (u, v, ch) => { u = (u % 1 + 1) % 1 * NW - 0.5; v = (v % 1 + 1) % 1 * NW - 0.5; const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    const at = (x, y) => nd[(((y % NW) + NW) % NW * NW + ((x % NW) + NW) % NW) * 4 + ch] / 255;
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy; };
  const api = {
    group, base, thick, mat,
    setHole(i, gx, gz, r) { holes[i].set(gx, gz, r); },
    // per frame: which faces to draw (outside: the face towards the camera; inside: both)
    setCamera(hAbove) {
      const inside = hAbove > base && hAbove < base + thick;
      // inside the slab the fog carries the whiteout; the faces only draw from outside
      uni.uMode.value = 0; top.visible = !inside && hAbove >= base + thick; bot.visible = !inside && hAbove <= base;
    },
    // fog density (1/m) for a camera at ground coords (gx, gz) and height above the anchor
    fogAt(gx, gz, hAbove, t) {
      if (hAbove < base - 150 || hAbove > base + thick + 150) return 0;
      const w = o.wind ?? [3, 1], sc = o.scale ?? 1, px = (gx + w[0] * t) / sc, pz = (gz + w[1] * t) / sc;
      let n = samp(px / 23000, pz / 23000, 0) * 0.55 + samp(px / 7000 + 0.31, pz / 7000 + 0.31, 0) * 0.3 + samp(px / 1900 + 0.73, pz / 1900 + 0.73, 2) * 0.15;
      for (const hl of holes) if (hl.z !== 0) { const hr = Math.abs(hl.z); n -= Math.sign(hl.z) * 0.35 * (1 - sstep(hr * 0.3, hr, Math.hypot(gx - hl.x, gz - hl.y) * (0.75 + 0.5 * samp(px / 3100 + 0.2, pz / 3100 + 0.2, 1)))); }
      const k = clamp((hAbove - base) / thick), prof = Math.sin(Math.PI * (0.1 + 0.8 * k)), th = (0.62 + (0.38 - 0.62) * (o.coverage ?? 0.5)) + (1 - prof) * 0.16;
      // soft shoulders above and below the slab so the whiteout fades in and out
      const d = sstep(th - 0.08, th + 0.1, n) * sstep(base - 150, base + 40, hAbove) * (1 - sstep(base + thick - 40, base + thick + 150, hAbove));
      return d * (o.sigma ?? 0.012) * 0.35 * (o.opacity ?? 1) * (o.fog ?? 1);
    },
  };
  return api;
}
