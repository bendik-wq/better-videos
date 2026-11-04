// Lighting passes for World.render, all pure functions of the frame (camera + state):
//
//   shadows   two sun cascades fitted to the shot: A (fine) around where the camera looks within a
//             few hundred metres, B (coarse) over the next kilometres. Light-space centres snap to
//             texels so edges do not crawl; casters render with a depth-only twin of their material.
//   mirror    the night-puddle reflection: the scene above the ground rendered from the camera
//             mirrored in the ground plane at quarter resolution (three's Reflector construction).
//   bloom     bright-pass at 1/4 res and a 4-level down/up blur (Jimenez 2014, CoD:AW), added in the
//             present pass before tone mapping, so street lights, head/tail lights and the sun bloom.
//   present   exposure, bloom, a sun lens flare only when the sun is in frame, AgX tone mapping
//             with a light "punchy" look, output to the canvas.
// Costs on llvmpipe at 1080p are measured in docs (see engine/world README section in the skill).
import * as THREE from 'three';

const FS_QUAD = new THREE.BufferGeometry();
FS_QUAD.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
const quadVS = 'varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }';

// ---------------------------------------------------------------- shadow casters
// depth-only material; instanced meshes get USE_INSTANCING from three automatically
const SHADOW_VS = /* glsl */`
  #ifdef TREE
  attribute vec3 aP; attribute vec4 aS; uniform vec3 uSunDirS; uniform vec2 uFade; varying vec2 vUv;
  #endif
  void main() {
  #ifdef TREE
    vec4 bw = modelMatrix * vec4(aP, 1.); vec3 up = vec3(0., 1., 0.);
    vec3 right = normalize(cross(up, uSunDirS)); float s = aS.x;
    vec3 p = bw.xyz + right * position.x * s * .8 + up * position.y * s;
    vUv = vec2((uv.x + aS.y) / 4., uv.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  #else
    #ifdef USE_INSTANCING
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
    #else
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    #endif
  #endif
  }`;
const SHADOW_FS = /* glsl */`
  #ifdef TREE
  uniform sampler2D uAtlas; varying vec2 vUv;
  #endif
  void main() {
  #ifdef TREE
    if (texture(uAtlas, vUv).a < .5) discard;
  #endif
    gl_FragColor = vec4(1.); }`;
export function shadowMaterial(kind = 'mesh', uniforms = {}) {
  return new THREE.ShaderMaterial({ vertexShader: SHADOW_VS, fragmentShader: SHADOW_FS, uniforms, defines: kind === 'tree' ? { TREE: 1 } : {}, colorWrite: false, side: THREE.DoubleSide });
}

export class Shadows {
  constructor({ size = 2048 } = {}) {
    // one depth atlas (2S x S): cascade A in the left half, B in the right, so shaders use one sampler
    const dt = new THREE.DepthTexture(2 * size, size); dt.type = THREE.UnsignedIntType; dt.minFilter = dt.magFilter = THREE.NearestFilter;
    this.atlas = new THREE.WebGLRenderTarget(2 * size, size, { depthBuffer: true, depthTexture: dt, type: THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    this.size = [size, size];
    this.cam = [new THREE.OrthographicCamera(), new THREE.OrthographicCamera()];
    this.mat = shadowMaterial(); this.ms = 0;
  }
  // world: World; origin: camera local position; fwd: unit view direction (local); info: cameraInfo
  render(renderer, world, origin, fwd, info) {
    const U = world.U, sun = U.uSunDir.value, casters = world.casters();
    const agl = info.agl;
    // where the camera looks: the ground hit of the view ray (clamped), and the horizontal forward
    const down = Math.max(-fwd.y, 0.06), tHit = Math.min(agl / down, 4 * agl + 1500);
    const fh = new THREE.Vector3(fwd.x, 0, fwd.z); if (fh.lengthSq() < 1e-6) fh.set(0, 0, -1); fh.normalize();
    const gy = origin.y - agl;
    const halfA = THREE.MathUtils.clamp(tHit * 0.55, 28, 260);
    const cA = origin.clone().addScaledVector(fwd, Math.min(tHit, halfA * 1.6) * 0.62); cA.y = gy;
    const halfB = THREE.MathUtils.clamp(tHit * 1.6 + agl * 0.6, 420, 2600);
    const cB = origin.clone().addScaledVector(fh, halfB * 0.62); cB.y = gy;
    const D = 9000;
    const prev = world.root.position.clone();
    for (let i = 0; i < 2; i++) {
      const half = i ? halfB : halfA, c = i ? cB : cA, cam = this.cam[i], S = this.size[i];
      // light view: looking along -sun; snap the centre to the texel grid in light space
      const z = sun.clone().normalize(), up0 = Math.abs(z.y) > 0.98 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
      const x = new THREE.Vector3().crossVectors(up0, z).normalize(), y = new THREE.Vector3().crossVectors(z, x);
      const tx = 2 * half / S;
      const rel = c.clone().sub(origin);
      const lx = Math.round(rel.dot(x) / tx) * tx, ly = Math.round(rel.dot(y) / tx) * tx, lz = rel.dot(z);
      const cs = x.clone().multiplyScalar(lx).addScaledVector(y, ly).addScaledVector(z, lz);
      cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = D;
      cam.position.copy(cs).addScaledVector(z, D * 0.5); cam.up.copy(y); cam.lookAt(cs); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      // depth bias (metres along the light) folded into the matrix
      const bias = (i ? 1.2 : 0.35) / (D - 1);
      const M = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5 - bias, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
      (i ? U.uShMB : U.uShMA).value.copy(M);
      U.uShBias.value.setComponent(i, tx * 2.2);
      U.uShP.value.setComponent(i + 1, 1 / S);
      const A = this.atlas; A.viewport.set(i * S, 0, S, S); A.scissor.set(i * S, 0, S, S); A.scissorTest = true;
      renderer.setRenderTarget(A); renderer.setClearColor(0xffffff, 1); renderer.clear(true, true, false);
      const saved = [];
      for (const { obj, mat } of casters) { saved.push([obj, obj.material, obj.visible]); obj.material = mat ?? this.mat; }
      const vis = []; world.scene.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine) && !casters.some(c => c.obj === o)) { vis.push([o, o.visible]); o.visible = false; } });
      renderer.render(world.scene, cam);
      for (const [o, v] of vis) o.visible = v;
      for (const [o, m] of saved) o.material = m;
    }
    U.uShA.value = this.atlas.depthTexture;
    world.root.position.copy(prev);
    renderer.setRenderTarget(null);
  }
}

// ---------------------------------------------------------------- planar mirror (night puddles)
export class Mirror {
  constructor() { this.cam = new THREE.PerspectiveCamera(); this.rt = null; }
  render(renderer, world, cam, groundRelY, size, hide) {
    const w = Math.max(64, Math.round(size.x / 4)), h = Math.max(36, Math.round(size.y / 4));
    if (!this.rt || this.rt.width !== w) { this.rt?.dispose(); this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
    // mirror position, view target and up across the plane y = groundRelY (camera sits at the origin)
    const m = this.cam, mir = (v) => { v.y = 2 * groundRelY - v.y; return v; };
    const pos = mir(cam.position.clone()), dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), upv = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const target = mir(cam.position.clone().add(dir)); upv.y = -upv.y;
    m.fov = cam.fov; m.aspect = cam.aspect; m.near = Math.max(0.5, cam.near); m.far = Math.min(cam.far, 60000);
    m.position.copy(pos); m.up.copy(upv); m.lookAt(target); m.updateProjectionMatrix(); m.updateMatrixWorld();
    m.layers.mask = cam.layers.mask;
    const U = world.U;
    U.uReflM.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(m.projectionMatrix).multiply(m.matrixWorldInverse);
    const vis = hide.map(o => [o, o.visible]); for (const o of hide) o.visible = false;
    renderer.setRenderTarget(this.rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
    const on = U.uReflOn.value; U.uReflOn.value = 0; U.uReflT.value = null; // never sample the target being drawn
    renderer.render(world.scene, m);
    U.uReflOn.value = on;
    for (const [o, v] of vis) o.visible = v;
    renderer.setRenderTarget(null);
    U.uReflT.value = this.rt.texture;
  }
}

// ---------------------------------------------------------------- bloom + present
const DOWN_FS = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uFirst; varying vec2 vUv;
  vec3 S(vec2 o) { return texture(tSrc, vUv + o * uTexel).rgb; }
  void main() {
    // 13-tap box-of-boxes downsample (Jimenez 2014)
    vec3 a = S(vec2(-2, 2)), b = S(vec2(0, 2)), c = S(vec2(2, 2)), d = S(vec2(-2, 0)), e = S(vec2(0, 0)), f = S(vec2(2, 0)),
         g = S(vec2(-2, -2)), h = S(vec2(0, -2)), i = S(vec2(2, -2)), j = S(vec2(-1, 1)), k = S(vec2(1, 1)), l = S(vec2(-1, -1)), m = S(vec2(1, -1));
    vec3 col = e * .125 + (a + c + g + i) * .03125 + (b + d + f + h) * .0625 + (j + k + l + m) * .125;
    if (uFirst > .5) { float br = max(col.r, max(col.g, col.b)); col *= max(br - uThresh, 0.) / max(br, 1e-4); col = min(col, vec3(60.)); }
    gl_FragColor = vec4(col, 1.); }`;
const UP_FS = /* glsl */`
  uniform sampler2D tSrc, tBase; uniform vec2 uTexel; uniform float uMixUp; varying vec2 vUv;
  void main() {
    vec3 s = vec3(0.);
    s += texture(tSrc, vUv + uTexel * vec2(-1, -1)).rgb; s += texture(tSrc, vUv + uTexel * vec2(0, -1)).rgb * 2.; s += texture(tSrc, vUv + uTexel * vec2(1, -1)).rgb;
    s += texture(tSrc, vUv + uTexel * vec2(-1, 0)).rgb * 2.; s += texture(tSrc, vUv).rgb * 4.; s += texture(tSrc, vUv + uTexel * vec2(1, 0)).rgb * 2.;
    s += texture(tSrc, vUv + uTexel * vec2(-1, 1)).rgb; s += texture(tSrc, vUv + uTexel * vec2(0, 1)).rgb * 2.; s += texture(tSrc, vUv + uTexel * vec2(1, 1)).rgb;
    gl_FragColor = vec4(texture(tBase, vUv).rgb + s / 16. * uMixUp, 1.); }`;
const PRESENT_FS = /* glsl */`
  uniform sampler2D tSrc, tBloom; uniform float uBloom, uSat, uContrast, uFlare, uSharpen; uniform vec2 uSrcTexel; uniform vec3 uSunScr, uFlareCol; uniform vec2 uAspect; varying vec2 vUv;
  vec3 ghost(vec2 uv, vec2 c, float k, float r, vec3 tint) { vec2 p = c + (vec2(.5) - c) * k * 2.; float d = length((uv - p) * uAspect); return tint * smoothstep(r, r * .6, d) * .5 + tint * exp(-d * d / (r * r * .2)) * .3; }
  void main() {
    vec3 col = texture(tSrc, vUv).rgb;
    if (uSharpen > 0.) { vec3 nb = texture(tSrc, vUv + vec2(uSrcTexel.x, 0.)).rgb + texture(tSrc, vUv - vec2(uSrcTexel.x, 0.)).rgb + texture(tSrc, vUv + vec2(0., uSrcTexel.y)).rgb + texture(tSrc, vUv - vec2(0., uSrcTexel.y)).rgb;
      col = max(col + (col - nb * .25) * uSharpen, col * .5); }
    col += texture(tBloom, vUv).rgb * uBloom;
    if (uFlare > .001) { // a few soft ghosts on the line through the centre and a faint anamorphic streak, only with the sun in frame
      vec2 c = uSunScr.xy; vec3 fl = vec3(0.);
      fl += ghost(vUv, c, .55, .05, vec3(1., .65, .35)); fl += ghost(vUv, c, .8, .025, vec3(.5, .8, 1.)); fl += ghost(vUv, c, 1.25, .08, vec3(1., .5, .3) * .6); fl += ghost(vUv, c, 1.6, .035, vec3(.6, 1., .7) * .5);
      float sy = (vUv.y - c.y) * uAspect.y; fl += uFlareCol * exp(-sy * sy * 9000.) * exp(-abs(vUv.x - c.x) * 3.) * .6;
      col += fl * uFlareCol * uFlare;
    }
    gl_FragColor = vec4(col, 1.);
    #include <tonemapping_fragment>
    // light "punchy" look on top of AgX: contrast around mid grey, saturation
    vec3 o = gl_FragColor.rgb; float l = dot(o, vec3(.2126, .7152, .0722));
    o = mix(vec3(l), o, uSat); o = pow(max(o, 0.), vec3(uContrast)) * pow(.18, 1. - uContrast);
    gl_FragColor.rgb = o;
    #include <colorspace_fragment>
  }`;

export class Post {
  constructor() { this.levels = []; this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(FS_QUAD, null); this.quad.frustumCulled = false; this.scene.add(this.quad);
    const sm = (fs, u) => new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
    this.down = sm(DOWN_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1.2 }, uFirst: { value: 0 } });
    this.up = sm(UP_FS, { tSrc: { value: null }, tBase: { value: null }, uTexel: { value: new THREE.Vector2() }, uMixUp: { value: 1 } });
    this.present = new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: PRESENT_FS, depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: { tSrc: { value: null }, tBloom: { value: null }, uBloom: { value: 0.06 }, uSat: { value: 1.08 }, uContrast: { value: 1.06 }, uFlare: { value: 0 }, uSharpen: { value: 0 }, uSrcTexel: { value: new THREE.Vector2() }, uSunScr: { value: new THREE.Vector3() }, uFlareCol: { value: new THREE.Vector3(1, 0.8, 0.6) }, uAspect: { value: new THREE.Vector2(16 / 9, 1) } } });
  }
  _ensure(size) {
    const w = Math.max(8, size.x >> 2), h = Math.max(8, size.y >> 2);
    if (this.levels[0]?.width === w) return;
    for (const l of this.levels) l.dispose(); this.levels = [];
    const opt = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    for (let i = 0, ww = w, hh = h; i < 5; i++, ww = Math.max(2, ww >> 1), hh = Math.max(2, hh >> 1)) this.levels.push(new THREE.WebGLRenderTarget(ww, hh, opt));
    this.ups = this.levels.slice(0, 4).map(l => new THREE.WebGLRenderTarget(l.width, l.height, opt));
  }
  pass(renderer, mat, target) { this.quad.material = mat; renderer.setRenderTarget(target); renderer.render(this.scene, this.cam); }
  // src: the HDR scene target. opts: { bloom, thresh, flare, sunScr, exposure, sat, contrast }
  render(renderer, src, size, o = {}) {
    this._ensure(size);
    const L = this.levels, d = this.down.uniforms, u = this.up.uniforms;
    const bloom = o.bloom ?? 0.06;
    if (bloom > 0) {
      d.uThresh.value = o.thresh ?? 1.2;
      let prev = src;
      for (let i = 0; i < L.length; i++) { d.tSrc.value = prev.texture; d.uTexel.value.set(1 / prev.width, 1 / prev.height); d.uFirst.value = i === 0 ? 1 : 0; this.pass(renderer, this.down, L[i]); prev = L[i]; }
      // upsample: ups[i] = L[i] + blur(ups[i+1] or L[last])
      let top = L[L.length - 1];
      for (let i = L.length - 2; i >= 0; i--) { u.tSrc.value = top.texture; u.tBase.value = L[i].texture; u.uTexel.value.set(1 / top.width, 1 / top.height); this.pass(renderer, this.up, this.ups[i]); top = this.ups[i]; }
    }
    const p = this.present.uniforms;
    p.tSrc.value = src.texture; p.tBloom.value = this.ups[0].texture; p.uBloom.value = bloom > 0 ? bloom / 5 : 0;
    p.uFlare.value = o.flare ?? 0; if (o.sunScr) p.uSunScr.value.copy(o.sunScr); p.uAspect.value.set(size.x / size.y, 1);
    p.uSharpen.value = o.sharpen ?? 0; p.uSrcTexel.value.set(1 / src.width, 1 / src.height);
    p.uSat.value = o.sat ?? 1.08; p.uContrast.value = o.contrast ?? 1.06;
    const tm = renderer.toneMapping, ex = renderer.toneMappingExposure;
    renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = o.exposure ?? 1;
    this.pass(renderer, this.present, null);
    renderer.toneMapping = tm; renderer.toneMappingExposure = ex;
  }
}
