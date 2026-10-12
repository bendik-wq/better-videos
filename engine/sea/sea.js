// engine/sea/sea.js: the Sea renderer. One object owns the look, the FFT spectrum, the ocean, the sky,
// an opaque scene (ships, land, sea floor, props) and the frame pipeline:
//   1. spectrum.update(t)                      FFT cascades at time t (pure function of t)
//   2. opaque pass -> rtA (HDR colour + float depth): sky dome, land, ships, floor, extras
//   3. rtB: copy rtA colour + depth (gl_FragDepth), then the ocean, which reads rtA for the water
//      column (shallows, submerged hulls, the photo seabed) and depth-tests against everything
//   4. overlay pass into rtB (spray particles, transparent extras) - optional
//   5. post: aerial perspective from depth (the same haze as the sky horizon), underwater fog with a
//      waterline across the lens, bloom on the sun glitter, exposure, Khronos PBR Neutral tone map
//      (photo content passes through unchanged), grade, sRGB out -> canvas (stage FXAA follows)
import * as THREE from 'three';
import { Spectrum } from './fft.js';
import { Ocean, noiseTexture } from './ocean.js';
import { LOOKS, makeUniforms, applyLook, mixLook, sunDir, GLSL } from './look.js';

const FSQ = new THREE.PlaneGeometry(2, 2);
const SHARED = {};
const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function quad(mat) { const m = new THREE.Mesh(FSQ, mat); m.frustumCulled = false; const s = new THREE.Scene(); s.add(m); return { scene: s, mesh: m, mat }; }

function skyMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uInvProj: { value: new THREE.Matrix4() }, uCamRot: { value: new THREE.Matrix4() } },
    vertexShader: /* glsl */`uniform mat4 uInvProj, uCamRot; varying vec3 vDir;
      void main() { vec4 v = uInvProj * vec4(position.xy, 1., 1.); vDir = (uCamRot * vec4(v.xyz / v.w, 0.)).xyz; gl_Position = vec4(position.xy, .999999, 1.); }`,
    fragmentShader: /* glsl */`${GLSL}
      varying vec3 vDir;
      void main() { vec3 d = normalize(vDir); vec3 c = skyColor(d);
        float cg = dot(d, uSunDir);
        c += uSunCol * uSunDisc * (smoothstep(.99996, .99998, cg) * 3000. + pow(max(cg, 0.), 8000.) * 6.);  // disc (~0.5 deg) + its glow
        gl_FragColor = vec4(c, 0.); }`,
    depthWrite: false, depthTest: true,
  });
}

function copyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { tC: { value: null }, tZ: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform sampler2D tC, tZ; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tC, vUv); gl_FragDepth = texture2D(tZ, vUv).r; }',
    depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
  });
}

function postMaterial(U, sea) {
  const C = sea.spectrum.cascades;
  return new THREE.ShaderMaterial({
    uniforms: { ...U, tC: { value: null }, tZ: { value: null }, tB1: { value: null }, tB2: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
      uExposure: { value: 1 }, uContrast: { value: 1 }, uSat: { value: 1 }, uWarm: { value: 0 }, uBloom: { value: 0.5 }, uHaze: { value: 1 },
      tD0: { value: C[0].tD }, tD1: { value: C[1].tD }, uL: { value: new THREE.Vector3(C[0].L, C[1].L, C[2].L) }, uNear: { value: 0.1 }, uWaterOn: { value: 1 },
      uUnderCol: { value: new THREE.Vector3(0.02, 0.16, 0.18) }, uUnderK: { value: 0.07 }, uLift: { value: 0 }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`${GLSL}
      uniform sampler2D tC, tZ, tB1, tB2, tD0, tD1; uniform mat4 uInvProj, uCamWorld; uniform vec3 uL, uUnderCol, uFadeCol;
      uniform float uExposure, uContrast, uSat, uWarm, uBloom, uHaze, uNear, uWaterOn, uUnderK, uLift, uFade;
      varying vec2 vUv;
      vec3 neutral(vec3 c) { // Khronos PBR Neutral
        float sc = .8 - .04, d = .15; float x = min(c.r, min(c.g, c.b)); float off = x < .08 ? x - 6.25 * x * x : .04; c -= off;
        float pk = max(c.r, max(c.g, c.b)); if (pk < sc) return c; float d2 = 1. - sc; float np = 1. - d2 * d2 / (pk + d2 - sc); c *= np / pk;
        float g = 1. - 1. / (d * (pk - np) + 1.); return mix(c, np * vec3(1.), g); }
      vec3 srgb(vec3 c) { c = clamp(c, 0., 1.); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main() {
        vec3 c = texture2D(tC, vUv).rgb;
        float z = texture2D(tZ, vUv).r;
        vec4 vp = uInvProj * vec4(vUv * 2. - 1., z * 2. - 1., 1.); vp /= vp.w;
        vec3 wp = (uCamWorld * vec4(vp.xyz, 1.)).xyz; vec3 dir = normalize(wp - uCam);
        float dist = length(vp.xyz);
        // is this pixel's lens point under the water? (near-plane point vs the wave height there)
        vec4 np4 = uInvProj * vec4(vUv * 2. - 1., -1., 1.); np4 /= np4.w; vec3 nw = (uCamWorld * vec4(np4.xyz, 1.)).xyz;
        float wh = (texture2D(tD0, nw.xz / uL.x).y + texture2D(tD1, nw.xz / uL.y).y) * uWaterOn;
        bool under = uWaterOn > .5 && nw.y < wh && uCam.y < 6.;
        if (under) {
          float T = exp(-dist * uUnderK);
          vec3 Ed = uSunCol * max(uSunDir.y, 0.) + uSkyAmb;
          vec3 fogc = uUnderCol * Ed * (.25 + .75 * exp(-max(-nw.y, 0.) * .06));
          // light shafts from the surface
          float shaft = pow(texture2D(tD1, (nw.xz + dir.xz * 6.) / uL.y * .35).w * .5 + .5, 6.) * smoothstep(.0, .6, dir.y + .3);
          c = c * T + fogc * (1. - T) * (1. + shaft * .6);
          float edge = smoothstep(.0, .06, wh - nw.y); c = mix(c * .6 + uUnderCol * .2, c, edge);   // meniscus
        } else if (z < .999999) {
          float tau = hazeDepth(wp) * uHaze;
          vec3 hz = hazeColor(dir) * 1.0;
          c = c * exp(-tau) + hz * (1. - exp(-tau));
        }
        // bloom (glitter, sun) from the two blurred levels
        c += (texture2D(tB1, vUv).rgb * .6 + texture2D(tB2, vUv).rgb * .4) * uBloom;
        c *= uExposure;
        c = neutral(c);
        // grade (display-referred): contrast around mid grey, saturation, a touch of warmth
        float l = dot(c, vec3(.2126, .7152, .0722));
        c = mix(vec3(l), c, uSat);
        c = (c - .45) * uContrast + .45;
        c *= vec3(1. + uWarm, 1. + uWarm * .3, 1. - uWarm * .8);
        c = uLift + (1. - uLift) * c;
        c = mix(c, uFadeCol, uFade);
        gl_FragColor = vec4(srgb(c), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
}

function brightMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { tC: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tC; uniform vec2 uTexel; uniform float uThresh; varying vec2 vUv;
      vec3 f(vec2 o){ vec3 c = texture2D(tC, vUv + o * uTexel).rgb; float l = max(c.r, max(c.g, c.b)); return c * max(0., l - uThresh) / max(l, 1e-4); }
      void main(){ vec3 c = f(vec2(-1.,-1.)) + f(vec2(1.,-1.)) + f(vec2(-1.,1.)) + f(vec2(1.,1.)); gl_FragColor = vec4(min(c * .25, vec3(40.)), 1.); }`,
    depthTest: false, depthWrite: false,
  });
}
function blurMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { tC: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tC; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tC, vUv).rgb * .2270;
        c += (texture2D(tC, vUv + uDir * 1.3846).rgb + texture2D(tC, vUv - uDir * 1.3846).rgb) * .3162;
        c += (texture2D(tC, vUv + uDir * 3.2308).rgb + texture2D(tC, vUv - uDir * 3.2308).rgb) * .0703;
        gl_FragColor = vec4(c, 1.); }`,
    depthTest: false, depthWrite: false,
  });
}

export class Sea {
  /**
   * new Sea(renderer, { look: 'bright-day'|'golden'|'map'|object, spectrum: {...fft opts}, ocean: { foam, foamJ, slick, glitter, depth },
   *   renderScale: 1, bloom: true, water: true, env: true })
   */
  constructor(renderer, o = {}) {
    this.renderer = renderer; this.o = o;
    this.U = makeUniforms();
    this.setLook(o.look ?? 'bright-day');
    this.spectrum = new Spectrum(o.spectrum ?? {});
    this.noise = noiseTexture();
    this.ocean = new Ocean(this.U, this.spectrum, { ...(o.ocean ?? {}), noise: this.noise });
    this.water = o.water !== false;
    this.scene = new THREE.Scene();          // opaque: land, ships, floor, props (+ the sky, drawn last)
    this.overlay = new THREE.Scene();        // after the ocean: spray, particles, transparent things
    this.oceanScene = new THREE.Scene(); this.oceanScene.add(this.ocean.mesh);
    this.sky = new THREE.Mesh(FSQ, skyMaterial(this.U)); this.sky.frustumCulled = false; this.sky.renderOrder = 1e6;
    this.sky.onBeforeRender = (r, s, cam) => { this.sky.material.uniforms.uInvProj.value.copy(cam.projectionMatrixInverse); this.sky.material.uniforms.uCamRot.value.extractRotation(cam.matrixWorld); };
    this.scene.add(this.sky);
    // the sun and the sky light for standard (PBR) materials
    this.sun = new THREE.DirectionalLight(0xffffff, 3); this.sun.target.position.set(0, 0, 0); this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0); this.scene.add(this.hemi);
    this.post = quad(postMaterial(this.U, this)); this.copy = quad(copyMaterial());
    this.bright = quad(brightMaterial()); this.blur = quad(blurMaterial());
    this.ships = []; this.lastInfo = null;
    this.camHold = new THREE.PerspectiveCamera();
    this._envKey = null;
  }
  setLook(look) {
    this.look = typeof look === 'string' ? LOOKS[look] : look;
    applyLook(this.U, this.look);
    if (this.sun) this._lights();
  }
  mixLook(a, b, k) { this.setLook(mixLook(a, b, k)); }
  _lights() {
    const L = this.look, d = sunDir(L);
    this.sun.position.copy(d).multiplyScalar(1000); this.sun.color.setRGB(L.sun.x, L.sun.y, L.sun.z); this.sun.intensity = Math.PI * 0.95;
    this.hemi.color.setRGB(L.skyAmb.x, L.skyAmb.y, L.skyAmb.z); this.hemi.groundColor.setRGB(L.deep.x * 4 + 0.02, L.deep.y * 4 + 0.03, L.deep.z * 4 + 0.03); this.hemi.intensity = this.scene?.environment ? 0.0 : 2.2;
  }
  // a PMREM environment from this look's sky (for ships and props); cached per look
  environment() {
    const key = JSON.stringify([this.look.sunEl, this.look.sunAz, this.look.zenith, this.look.horizon]);
    if (key === this._envKey) return this.scene.environment;
    this._envKey = key;
    const s = new THREE.Scene(), geo = new THREE.SphereGeometry(100, 64, 32);
    const m = new THREE.ShaderMaterial({ uniforms: { ...this.U, uCamH: { value: 2 } }, side: THREE.BackSide,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `${GLSL} varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = d.y > -.02 ? skyColor(d) : mix(uHorizon * .8, uDeep * 6. + uScatter * .5, smoothstep(-.02, -.3, d.y));
        float cg = dot(d, uSunDir); c += uSunCol * pow(max(cg, 0.), 900.) * 60.; gl_FragColor = vec4(c, 1.); }` });
    s.add(new THREE.Mesh(geo, m));
    const pm = new THREE.PMREMGenerator(this.renderer); const rt = pm.fromScene(s, 0, 0.1, 1000);
    this.scene.environment?.dispose?.(); this.scene.environment = rt.texture; pm.dispose(); geo.dispose(); m.dispose();
    this._lights();
    return rt.texture;
  }
  // sun shadows (ships on themselves): an orthographic sun frustum around a focus point
  shadows(center, radius = 200, size = 2048) {
    const L = this.sun; L.castShadow = true; L.shadow.mapSize.set(size, size); const c = L.shadow.camera;
    c.left = -radius; c.right = radius; c.top = radius; c.bottom = -radius; c.near = 1; c.far = radius * 6; c.updateProjectionMatrix();
    L.shadow.bias = -0.0004; L.shadow.normalBias = radius / size * 1.5;
    const d = sunDir(this.look); L.position.copy(center).addScaledVector(d, radius * 3); L.target.position.copy(center); L.target.updateMatrixWorld();
  }
  addShip(ship) { this.ships.push(ship); this.scene.add(ship.group); return ship; }
  // render targets are shared by every Sea of the same size (frames render one at a time)
  _targets(w, h) {
    if (this.rtA?.width === w && this.rtA?.height === h) return;
    const key = w + 'x' + h;
    const T = SHARED[key] ??= (() => {
      const mk = (W, H, depth) => { const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: !!depth });
        if (depth) { rt.depthTexture = new THREE.DepthTexture(W, H, THREE.FloatType); rt.depthTexture.format = THREE.DepthFormat; } return rt; };
      return { rtA: mk(w, h, true), rtB: mk(w, h, true), q1: mk(w >> 2, h >> 2), q2: mk(w >> 2, h >> 2), e1: mk(w >> 3, h >> 3), e2: mk(w >> 3, h >> 3) };
    })();
    Object.assign(this, T);
  }
  /**
   * Render one frame. t: seconds (drives the waves); camera: a PerspectiveCamera in the local frame
   * (metres, x east, y up = sea level 0, z south). o: { target (RT or null), exposure, haze, fade, fadeCol }
   */
  render(camera, t, o = {}) {
    const r = this.renderer, U = this.U;
    const full = r.getDrawingBufferSize(new THREE.Vector2());
    const rs = this.o.renderScale ?? 1, w = Math.round(full.x * rs), h = Math.round(full.y * rs);
    this._targets(w, h);
    U.uTime.value = t; U.uCam.value.copy(camera.position); U.uCamH.value = Math.max(0, camera.position.y);
    if (this.water) this.spectrum.update(t);
    // ships: state at t, wakes into the ocean
    for (const s of this.ships) { s.update?.(t, this); s.curve?.(camera.position); }
    this.ocean.setShips(this.ships.filter(s => s.group.visible !== false));
    this.ocean.update(camera);
    // near/far from the altitude
    const hgt = Math.max(0.3, Math.abs(camera.position.y));
    camera.near = o.near ?? Math.min(40, Math.max(0.08, hgt * 0.04)); camera.far = o.far ?? Math.max(4e5, Math.sqrt(2 * 6371000 * hgt) * 1.6 + 5e4);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const ac = r.autoClear; r.autoClear = false;
    // 1. opaque
    r.setRenderTarget(this.rtA); r.setClearColor(0x000000, 0); r.clear(true, true, true);
    r.render(this.scene, camera);
    // 2. copy + ocean
    r.setRenderTarget(this.rtB); r.clear(true, true, true);
    this.copy.mat.uniforms.tC.value = this.rtA.texture; this.copy.mat.uniforms.tZ.value = this.rtA.depthTexture;
    r.render(this.copy.scene, ORTHO);
    if (this.water) {
      const OU = this.ocean.U; OU.uOpaque.value = this.rtA.texture; OU.uOpaqueDepth.value = this.rtA.depthTexture; OU.uHasOpaque.value = 1;
      OU.uInvProj.value.copy(camera.projectionMatrixInverse); OU.uRes.value.set(w, h);
      U.uUnder.value = camera.position.y < this.spectrum.height(camera.position.x, camera.position.z) ? 1 : 0;
      r.render(this.oceanScene, camera);
    }
    if (this.overlay.children.length) r.render(this.overlay, camera);
    // 3. bloom
    const L = this.look, bloom = (o.bloom ?? L.bloom ?? 0.5) * (this.o.bloom === false ? 0 : 1);
    if (bloom > 0) {
      this.bright.mat.uniforms.tC.value = this.rtB.texture; this.bright.mat.uniforms.uTexel.value.set(1 / w, 1 / h);
      r.setRenderTarget(this.q1); r.render(this.bright.scene, ORTHO);
      const B = this.blur.mat.uniforms;
      B.tC.value = this.q1.texture; B.uDir.value.set(1 / (w >> 2), 0); r.setRenderTarget(this.q2); r.render(this.blur.scene, ORTHO);
      B.tC.value = this.q2.texture; B.uDir.value.set(0, 1 / (h >> 2)); r.setRenderTarget(this.q1); r.render(this.blur.scene, ORTHO);
      B.tC.value = this.q1.texture; B.uDir.value.set(2 / (w >> 3), 0); r.setRenderTarget(this.e1); r.render(this.blur.scene, ORTHO);
      B.tC.value = this.e1.texture; B.uDir.value.set(0, 2 / (h >> 3)); r.setRenderTarget(this.e2); r.render(this.blur.scene, ORTHO);
    }
    // 4. post -> target
    const P = this.post.mat.uniforms;
    P.tC.value = this.rtB.texture; P.tZ.value = this.rtB.depthTexture; P.tB1.value = this.q1.texture; P.tB2.value = this.e2.texture; P.uBloom.value = bloom;
    P.uInvProj.value.copy(camera.projectionMatrixInverse); P.uCamWorld.value.copy(camera.matrixWorld);
    P.uExposure.value = (o.exposure ?? 1) * L.exposure; P.uContrast.value = L.contrast; P.uSat.value = L.sat; P.uWarm.value = L.warm; P.uHaze.value = o.haze ?? 1;
    P.uWaterOn.value = this.water ? 1 : 0; P.uFade.value = o.fade ?? 0; if (o.fadeCol) P.uFadeCol.value.set(...o.fadeCol);
    r.setRenderTarget(o.target ?? null);
    r.render(this.post.scene, ORTHO);
    r.setRenderTarget(null);
    r.autoClear = ac;
    return { w, h };
  }
  // House set format: the runtime renders (scene, camera) to the canvas itself. presenter() gives a scene
  // holding one full-screen quad that shows this sea's last frame (camera-independent), so a set returns
  // { scene: pres.scene, camera } and calls pres.draw(camera, t) in update().
  presenter() {
    const full = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(full.x, full.y, { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    const mat = new THREE.ShaderMaterial({ uniforms: { tC: { value: rt.texture } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: 'uniform sampler2D tC; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tC, vUv); }', depthTest: false, depthWrite: false, toneMapped: false });
    const q = quad(mat); q.scene.persistent = false;
    return { scene: q.scene, rt, draw: (camera, t, o = {}) => this.render(camera, t, { ...o, target: rt }), dispose: () => { rt.dispose(); mat.dispose(); } };
  }
  dispose() { this.spectrum.dispose(); this.noise.dispose(); this.scene.environment?.dispose?.();
    this.scene.traverse(o => { o.geometry?.dispose?.(); }); }
}
