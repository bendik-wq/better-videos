// Globe: NASA Blue Marble (day), Black Marble (night lights), cloud composite and a Natural Earth
// map mask, on a sphere in the place's local frame, so the same camera flies from orbit to street.
// Lit by the same sun as everything else (terminator, twilight band, city lights on the night side,
// ocean glint) with an additive atmosphere shell. Map mode: dark land, ink coasts, borders, graticule.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, R_EARTH } from './core.js';

export function buildGlobe(world, earth, { segW = 512, segH = 256, clouds = true } = {}) {
  const F = world.frame, rG = R_EARTH + world.globeH + world.frame.elev;
  const group = new THREE.Group(); group.name = 'globe';
  group.position.copy(F.center);
  const nV = (segW + 1) * (segH + 1), pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2);
  let i = 0;
  for (let y = 0; y <= segH; y++) for (let x = 0; x <= segW; x++, i++) {
    const lat = 90 - y / segH * 180, lon = -180 + x / segW * 360, la = lat * Math.PI / 180, lo = lon * Math.PI / 180, c = Math.cos(la);
    const d = F.dirLocal(c * Math.cos(lo), c * Math.sin(lo), Math.sin(la));
    pos.set([d[0] * rG, d[1] * rG, d[2] * rG], i * 3); nor.set(d, i * 3); uv.set([x / segW, 1 - y / segH], i * 2);
  }
  const idx = [];
  for (let y = 0; y < segH; y++) for (let x = 0; x < segW; x++) { const a = y * (segW + 1) + x, b = a + segW + 1; if (y > 0) idx.push(a, b, a + 1); if (y < segH - 1) idx.push(b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.Uint32BufferAttribute(idx, 1));
  const mat = worldMaterial(world.U, {
    uniforms: { uDay: { value: earth.day }, uNightT: { value: earth.night }, uClouds: { value: earth.clouds }, uMapT: { value: earth.map }, uCloudsOn: { value: clouds ? 1 : 0 }, uFade: { value: 1 } },
    vertex: /* glsl */`
      varying vec3 vRel, vLocal, vN; varying vec2 vUv;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vRel = wp.xyz; vLocal = wp.xyz + uOrigin; vN = normal; vUv = uv; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      uniform sampler2D uDay, uNightT, uClouds, uMapT; uniform float uCloudsOn, uFade;
      varying vec3 vRel, vLocal, vN; varying vec2 vUv;
      void main() {
        vec3 n = normalize(vN);
        vec3 day = texture(uDay, vUv).rgb;
        vec3 mk = texture(uMapT, vUv).rgb;
        float nl = texture(uNightT, vUv).r;
        vec3 col = globeShade(day, nl, uCloudsOn * texture(uClouds, vUv).r, mk.r, n, vRel);
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) {
          vec3 m = mix(uMapWater, uMapLand * 1.6, mk.r);
          m = mix(m, uMapInk * .6, mk.g * .8); m = mix(m, uMapInk * .45, mk.b * .7);
          vec2 gr = vUv * vec2(36., 18.); vec2 fw = fwidth(gr);
          vec2 gl = 1. - smoothstep(vec2(0.), fw * 1.2, abs(fract(gr + .5) - .5));
          m = mix(m, uMapInk * .25, max(gl.x, gl.y) * .5);
          col = mix(col, m, uMap);
        }
        gl_FragColor = vec4(col, uFade);
        ${GLSL_TONE}
      }`,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = -50; group.add(mesh);
  // atmosphere shell: additive, back faces, brightest at the limb, coloured by the sun side
  const shell = new THREE.Mesh(new THREE.SphereGeometry(rG + 90000, 128, 64), worldMaterial(world.U, {
    uniforms: { uCenterL: { value: F.center }, uRg: { value: rG } },
    vertex: /* glsl */`varying vec3 vRel, vLocal; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vRel = wp.xyz; vLocal = wp.xyz + uOrigin; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      uniform float uRg; varying vec3 vRel, vLocal;
      void main() {
        vec3 d = normalize(vRel); vec3 o = uOrigin - uCenter;
        // closest approach of the view ray to the earth's centre -> height of the ray above the surface
        float t = -dot(o, d); vec3 c = o + d * max(t, 0.); float hgt = length(c) - uRg;
        float a = exp(-max(hgt, 0.) / 14000.) * smoothstep(-6000., 0., hgt);
        vec3 nn = normalize(c);
        float sd = dot(nn, uSunDir), sun = smoothstep(-.25, .35, sd);
        vec3 col = mix(vec3(.05, .09, .2) * .12, vec3(.3, .55, 1.) * .9, sun) + vec3(1., .45, .2) * .35 * smoothstep(-.3, 0., sd) * (1. - smoothstep(0., .3, sd));
        float space = smoothstep(30000., 300000., uCamAlt);
        gl_FragColor = vec4(col * a * space * (1. - uMap * .7), 1.);
        ${GLSL_TONE}
      }`,
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  shell.frustumCulled = false; shell.renderOrder = -40; group.add(shell);
  return { group, mesh, shell, radius: rG };
}
