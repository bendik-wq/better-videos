// engine/sea/smoke.js: smoke plumes, fires and smoke banks for engine/sea, pure in t.
//
//   const pl = SM.smoke(sea, { at: [x, 0, z], height: 220, radius: 14, wind: [4, -1], dark: 0.08, fire: 1, seed: 3 });
//   // every frame (before sea.render): pl.update(t)   [or pass a function at: (t) => [x, y, z] to follow a ship]
//
// Each puff is a camera-facing card with a procedural cauliflower texture, lit like a sphere by the
// look's sun and sky (bright on the sun side, the underside in shade), so a column reads round and
// solid. Puffs are born at the source, rise (slowing as they cool), grow and drift with the wind; a
// puff's age is fract(t / life + phase), so any frame is a pure function of t. Fire: the youngest puffs
// glow orange and flicker (hash of the frame tick), no explosions. Aerial perspective is applied in the
// shader and pre-compensated for the haze the sea's post pass adds from the depth behind the puff, so a
// plume on the horizon dissolves into the haze like the land around it.
// Cost: overdraw. ~0.5 ms per 100 small puffs; a big close column (1/3 of the frame) ~20-40 ms on llvmpipe.
import * as THREE from 'three';
import { GLSL } from './look.js';

let PUFF = null;
function puffTexture() {
  if (PUFF) return PUFF;
  const N = 128, data = new Uint8Array(N * N * 4);
  const h = (x, y, s) => { let v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return (h(xi, yi, s) * (1 - ux) + h(xi + 1, yi, s) * ux) * (1 - uy) + (h(xi, yi + 1, s) * (1 - ux) + h(xi + 1, yi + 1, s) * ux) * uy; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N * 2 - 1, v = j / N * 2 - 1, r = Math.hypot(u, v);
    let f = 0, a = 0.5, fr = 3; for (let o = 0; o < 5; o++) { f += a * vn(u * fr + 7, v * fr + 3, o); a *= 0.5; fr *= 2.1; }
    const billow = Math.max(0, 1 - r * (1.05 - (f - 0.5) * 0.9));                    // a lumpy edge
    const dens = Math.pow(billow, 0.7) * (0.65 + f * 0.6);
    const k = (j * N + i) * 4; data[k] = Math.min(255, dens * 255); data[k + 1] = Math.min(255, f * 255); data[k + 2] = 0; data[k + 3] = 255;
  }
  PUFF = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); PUFF.magFilter = THREE.LinearFilter; PUFF.minFilter = THREE.LinearMipmapLinearFilter; PUFF.generateMipmaps = true; PUFF.needsUpdate = true;
  return PUFF;
}

export function smoke(sea, o = {}) {
  const n = o.n ?? 90, height = o.height ?? 200, R = o.radius ?? 12, spread = o.spread ?? 4, rise = o.rise ?? 7, life = o.life ?? height / rise;
  const wind = o.wind ?? [3, 0], seed = o.seed ?? 1, area = o.area ?? [0, 0];
  const geo = new THREE.InstancedBufferGeometry(); const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
  const aP = new Float32Array(n * 4), aQ = new Float32Array(n * 4);
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); geo.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4)); geo.instanceCount = n;
  const U = sea.U;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, tPuff: { value: puffTexture() }, uAlb: { value: new THREE.Color(...(o.color ?? [o.dark ?? 0.1, (o.dark ?? 0.1) * 0.97, (o.dark ?? 0.1) * 0.93])) }, uOp: { value: o.opacity ?? 0.9 },
      uFire: { value: o.fire ?? 0 }, uTick: { value: 0 }, uHazeK: { value: o.haze ?? 1 }, uCamWorld: { value: new THREE.Matrix4() } },
    vertexShader: /* glsl */`
      uniform mat4 uCamWorld; attribute vec4 aP; attribute vec4 aQ; varying vec2 vUv; varying vec4 vQ; varying vec3 vW; varying vec3 vNv; varying float vRot;
      void main() {
        vUv = uv; vQ = aQ;
        vec3 c = (viewMatrix * vec4(aP.xyz, 1.)).xyz;
        float ca = cos(aQ.z), sa = sin(aQ.z); vec2 p = position.xy * aP.w; p = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);
        vec4 mv = vec4(c + vec3(p, 0.), 1.);
        vW = (uCamWorld * mv).xyz; vRot = aQ.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL}
      uniform mat4 uCamWorld; uniform sampler2D tPuff; uniform vec3 uAlb; uniform float uOp, uFire, uTick, uHazeK; varying vec2 vUv; varying vec4 vQ; varying vec3 vW; varying float vRot;
      void main() {
        vec4 tx = texture2D(tPuff, vUv); float dens = tx.r;
        float a = dens * vQ.x * uOp; if (a < .004) discard;
        // sphere normal of the puff in view space, rotated back with the card, then to world
        vec2 q = (vUv * 2. - 1.); float ca = cos(-vRot), sa = sin(-vRot); q = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
        vec3 nv = normalize(vec3(q * .9, sqrt(max(.05, 1. - dot(q, q) * .8))));
        vec3 nw = normalize(mat3(uCamWorld) * nv);
        float sunL = max(dot(nw, uSunDir) * .6 + .4, 0.) * (.55 + .45 * tx.g);
        float self = mix(.35, 1., vQ.y);                                    // puffs deep in the column are shadowed by the rest
        vec3 col = uAlb * (uSunCol * sunL * self * .9 + uSkyAmb * (.8 + .4 * nw.y));
        // fire: the youngest puffs glow and flicker
        if (uFire > 0.) { float f = smoothstep(.07, .0, vQ.w) * uFire; float fl = .75 + .25 * fract(sin(uTick * 12.9898 + vQ.z * 78.233) * 43758.5);
          col += vec3(3.2, 1.25, .32) * f * fl * (.4 + .6 * dens); a = max(a, f * dens * .9); }
        // aerial perspective, pre-compensated for the post pass's haze of whatever lies behind
        vec3 dir = normalize(vW - uCam);
        float to = hazeDepth(vec3(vW.x, min(vW.y, 400.), vW.z)) * uHazeK;   // sea-level air along the line of sight, so a plume reads the same against sky and sea
        float tb = 0.; if (dir.y < -1e-4) { float dpl = uCam.y / -dir.y; if (dpl < sqrt(2. * R_EARTH * max(uCam.y, 1.)) * .98) { vec3 pb = uCam + dir * dpl; tb = hazeDepth(pb) * uHazeK; } }
        vec3 hz = hazeColor(dir);
        vec3 S = col * exp(-to) + hz * (1. - exp(-to));
        vec3 C = S;   // (post-pass compensation dropped: against the sky it went black at the horizon)
        if (tb > 0. && tb < to) C = S;
        gl_FragColor = vec4(max(C, 0.), a);
      }`,
    transparent: true, depthWrite: false, depthTest: true,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = o.renderOrder ?? 80; sea.overlay.add(mesh);
  mesh.onBeforeRender = (r, s, cam) => mat.uniforms.uCamWorld.value.copy(cam.matrixWorld);
  const rnd = (() => { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const P = Array.from({ length: n }, (_, i) => ({ ph: (i + rnd() * 0.8) / n, a: rnd() * 6.28, b: rnd() * 6.28, r: rnd(), s: 0.7 + rnd() * 0.6, ax: (rnd() - 0.5) * area[0], az: (rnd() - 0.5) * area[1], spin: (rnd() - 0.5) * 0.4, rot: rnd() * 6.28 }));
  const at = typeof o.at === 'function' ? o.at : () => o.at ?? [0, 0, 0];
  const st = { visible: true, k: 1 };
  return {
    mesh, P: st,
    update(t, { strength = 1 } = {}) {
      mesh.visible = st.visible && strength > 0.001;
      const b = at(t), wx = wind[0], wz = wind[1];
      mat.uniforms.uTick.value = Math.floor(t * 24);
      for (let i = 0; i < n; i++) { const p = P[i];
        const age = ((t / life + p.ph) % 1 + 1) % 1, T = age * life;
        const hh = height * (1 - Math.pow(1 - age, 1.7));                    // rises fast, then slows as it cools
        const tur = R * (0.4 + age * spread) * 0.45;
        const x = b[0] + p.ax + wx * T + Math.sin(p.a + T * 0.35) * tur, z = b[2] + p.az + wz * T + Math.cos(p.b + T * 0.3) * tur, y = b[1] + hh + Math.sin(p.b + T * 0.5) * tur * 0.3;
        const size = R * (1 + age * spread) * p.s * 2;
        const fade = Math.min(1, age / 0.06) * (1 - smooth(0.55, 1, age)) * strength;
        aP.set([x, y, z, size], i * 4); aQ.set([fade, 1 - age * 0.8, p.rot + T * p.spin, age], i * 4);
      }
      geo.attributes.aP.needsUpdate = geo.attributes.aQ.needsUpdate = true;
    },
    dispose() { geo.dispose(); mat.dispose(); mesh.removeFromParent(); },
  };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
