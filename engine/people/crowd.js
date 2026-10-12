// engine/people/crowd.js: instanced crowds of 100-2000 people, deterministic in t.
//
// Each body (wardrobe id) is drawn with at most three draw calls whatever the head count:
//   near  full mesh  (LOD0, ~20k tris)   InstancedMesh, GPU skinning from a baked bone texture
//   mid   decimated  (LOD1, ~4k tris)    same skinning, same texture
//   far   impostor   (one quad)          camera-facing card from an atlas rendered at load
// The bone texture holds every clip's bone matrices at 30 fps (rows = frames, 4 texels per bone);
// the vertex shader picks the row from the uniform time plus per-instance clip/phase/rate, and
// blends the two nearest frames, so posing 2000 people costs the CPU nothing. Per frame the CPU
// only buckets instances by distance (and moves walkers), O(n).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as PC from './core.js';
import * as LK from './look.js';

const FPS = 30;

// ---------------------------------------------------------------- baking
function bakeBones(person, clipNames) {
  const skel = person.meshes[0].skeleton; const J = skel.bones.length;
  const rows = []; const index = {};
  for (const name of clipNames) {
    const c = PC.clip(name); const n = Math.max(2, Math.round(c.duration * FPS));
    index[name] = { row: rows.length, n, dur: c.duration, speed: c.speed, loop: c.loop };
    for (let f = 0; f < n; f++) { person.root.position.set(0, 0, 0); person.root.rotation.set(0, 0, 0); person.play(name, f / FPS).update(); rows.push(skel.bones.map((b, j) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, skel.boneInverses[j]))); }
  }
  // 3 texels per bone: the three rows of the affine matrix (row k = elements k, k+4, k+8, k+12)
  const W = J * 3, H = rows.length; const data = new Float32Array(W * H * 4);
  rows.forEach((mats, r) => mats.forEach((m, j) => { const e = m.elements; const o = (r * W + j * 3) * 4;
    for (let k = 0; k < 3; k++) { data[o + k * 4] = e[k]; data[o + k * 4 + 1] = e[k + 4]; data[o + k * 4 + 2] = e[k + 8]; data[o + k * 4 + 3] = e[k + 12]; } }));
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.needsUpdate = true; tex.magFilter = tex.minFilter = THREE.NearestFilter;
  return { tex, index, J, names: skel.bones.map(b => b.name) };
}

const SKIN_PARS = /* glsl */`
uniform highp sampler2D bvBones; uniform float bvTime;
attribute vec4 bvAnim; attribute vec4 skinIndex; attribute vec4 skinWeight;
vec4 bvR0, bvR1, bvR2;
void bvAdd(int row, float j, float w) { int x = int(j) * 3;
  bvR0 += w * texelFetch(bvBones, ivec2(x, row), 0); bvR1 += w * texelFetch(bvBones, ivec2(x + 1, row), 0); bvR2 += w * texelFetch(bvBones, ivec2(x + 2, row), 0); }
`;
// near: 4 influences, two frames blended; mid (no BV_LERP): the 2 strongest influences, one frame
const SKIN_BASE = /* glsl */`
  float bvF = mod(bvTime * bvAnim.z + bvAnim.w, bvAnim.y);
  float bvI = floor(bvF); float bvU = bvF - bvI;
  int bvA = int(bvAnim.x + bvI), bvB = int(bvAnim.x + mod(bvI + 1.0, bvAnim.y));
  bvR0 = vec4(0.0); bvR1 = vec4(0.0); bvR2 = vec4(0.0);
#ifdef BV_LERP
  for (int k = 0; k < 4; k++) { float w = skinWeight[k]; if (w > 0.0) { bvAdd(bvA, skinIndex[k], w * (1.0 - bvU)); bvAdd(bvB, skinIndex[k], w * bvU); } }
#else
  float bvW = skinWeight.x + skinWeight.y;
  bvAdd(bvA, skinIndex.x, skinWeight.x / bvW); bvAdd(bvA, skinIndex.y, skinWeight.y / bvW);
#endif
`;
const SKIN_N = 'objectNormal = vec3(dot(bvR0.xyz, objectNormal), dot(bvR1.xyz, objectNormal), dot(bvR2.xyz, objectNormal));';
const SKIN_P = 'transformed = vec3(dot(bvR0, vec4(transformed, 1.0)), dot(bvR1, vec4(transformed, 1.0)), dot(bvR2, vec4(transformed, 1.0)));';
// Patch any built-in material so it skins from the bone texture (chains an existing onBeforeCompile).
export function skinFromTexture(mat, uniforms, { lerp = true } = {}) {
  if (lerp) mat.defines = { ...(mat.defines ?? {}), BV_LERP: '' };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.uniforms.bvBones = uniforms.bvBones; sh.uniforms.bvTime = uniforms.bvTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <skinning_pars_vertex>', SKIN_PARS)
      .replace('#include <skinbase_vertex>', SKIN_BASE)
      .replace('#include <skinnormal_vertex>', SKIN_N)
      .replace('#include <skinning_vertex>', SKIN_P);
  };
  const key = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (key ? key() : '') + '|bvskin' + (lerp ? 'L' : '');
  return mat;
}

function mergedGeometry(body, refNames) {
  const geoms = [], mats = [];
  for (const m of body.skinned) {
    const g = new THREE.BufferGeometry();
    for (const a of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight']) if (m.geometry.attributes[a]) g.setAttribute(a, m.geometry.attributes[a].clone());
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.setIndex(m.geometry.index.clone());
    // remap joint indices to the reference skeleton order (LOD files may order joints differently)
    const names = m.skeleton.bones.map(b => b.name); const si = g.attributes.skinIndex;
    const map = names.map(n => refNames.indexOf(n)); const arr = new Float32Array(si.count * 4);
    for (let i = 0; i < si.count * 4; i++) arr[i] = Math.max(0, map[si.array[i]]);
    g.setAttribute('skinIndex', new THREE.Float32BufferAttribute(arr, 4));
    const sw = g.attributes.skinWeight; if (!(sw.array instanceof Float32Array)) { const a2 = new Float32Array(sw.count * 4); for (let i = 0; i < a2.length; i++) a2[i] = sw.getComponent(Math.floor(i / 4), i % 4); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(a2, 4)); }
    geoms.push(g); mats.push(m);
  }
  return { geometry: mergeGeometries(geoms, true), sources: mats };
}

// ---------------------------------------------------------------- impostor atlas
const VIEWS = 8, FRAMES = 12, CW = 96, CH = 192;
function renderAtlas(renderer, mesh, uniforms, clipInfos, light) {
  const nc = clipInfos.length;
  const rt = new THREE.WebGLRenderTarget(VIEWS * CW, FRAMES * CH * nc, { samples: 0 });
  rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(mesh);
  const cam = new THREE.OrthographicCamera(-0.55, 0.55, 2.05, -0.15, 0.1, 20);
  const lights = light === 'front' ? [[0xffffff, 2.2, [0.3, 0.8, 1]], [0x8090b0, 0.6, [0, 1, -1]]]
    : light === 'top' ? [[0xffffff, 2.4, [0.2, 1, 0.3]], [0x8090b0, 0.5, [0, 0.2, 1]]]
    : [[0xffe2c0, 3.2, [0.25, 0.55, -1]], [0x9fb4d8, 0.9, [-0.8, 0.3, -0.5]], [0x404858, 0.5, [0, 0.4, 1]]]; // backlit
  const L = lights.map(([c, i]) => { const d = new THREE.DirectionalLight(c, i); sc.add(d); sc.add(d.target); return d; });
  sc.add(new THREE.HemisphereLight(0x8090a0, 0x202020, light === 'back' || !light ? 0.25 : 0.6));
  const prev = { vp: renderer.getViewport(new THREE.Vector4()), sc: renderer.getScissor(new THREE.Vector4()), rt: renderer.getRenderTarget(), auto: renderer.autoClear, cc: renderer.getClearColor(new THREE.Color()), ca: renderer.getClearAlpha(), tm: renderer.toneMapping };
  const attr = mesh.geometry.attributes.bvAnim;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.autoClear = false; renderer.clear();
  uniforms.bvTime.value = 0;
  clipInfos.forEach((ci, k) => {
    for (let f = 0; f < FRAMES; f++) {
      const fr = frameOf(ci, f); attr.setXYZW(0, ci.row, ci.n, 0, fr); attr.needsUpdate = true;
      for (let v = 0; v < VIEWS; v++) {
        const a = v / VIEWS * Math.PI * 2; // camera azimuth around the character (0 = in front)
        cam.position.set(Math.sin(a) * 6, 0, Math.cos(a) * 6); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
        L.forEach((d, i) => { const dir = new THREE.Vector3(...lights[i][2]).normalize(); // camera-relative light
          const right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), back = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
          d.position.copy(right.multiplyScalar(dir.x).add(new THREE.Vector3(0, dir.y, 0)).add(back.multiplyScalar(dir.z)).multiplyScalar(10)); });
        renderer.setViewport(v * CW, (k * FRAMES + f) * CH, CW, CH); renderer.setScissor(v * CW, (k * FRAMES + f) * CH, CW, CH); renderer.setScissorTest(true);
        renderer.render(sc, cam);
      }
    }
  });
  renderer.setScissorTest(false); renderer.setRenderTarget(prev.rt); renderer.setViewport(prev.vp); renderer.setScissor(prev.sc); renderer.autoClear = prev.auto; renderer.setClearColor(prev.cc, prev.ca);
  sc.remove(mesh);
  return rt;
}
// impostor frames: loops sample one cycle (or a 3 s window of an idle, ping-ponged)
function frameOf(ci, f) {
  if (ci.dur <= 2.5) return f / FRAMES * ci.n;
  const span = Math.min(ci.n - 1, 3 * FPS); const u = f / (FRAMES - 1);
  return u * span;
}

const BILL_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aCell; attribute vec3 aTint;
varying vec2 vUv0; varying vec2 vUv1; varying float vMix; varying vec3 vTint;
uniform vec2 cell; uniform float frames; uniform float clips;
#include <fog_pars_vertex>
void main() {
  vec3 toCam = cameraPosition - aPos; toCam.y = 0.0; vec3 fwd = normalize(toCam);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  float s = aCell.w;
  vec3 wp = aPos + right * (position.x * 1.1 * s) + vec3(0.0, (position.y * 2.2 - 0.15) * s, 0.0);
  // aCell: x = view, y = clip, z = frame (float)
  float f0 = floor(aCell.z), f1 = mod(f0 + 1.0, frames); vMix = aCell.z - f0;
  vec2 base = vec2(aCell.x * cell.x, 0.0);
  vec2 uv = vec2(position.x + 0.5, position.y);
  vUv0 = base + vec2(uv.x * cell.x, ((aCell.y * frames + f0) + uv.y) * cell.y);
  vUv1 = base + vec2(uv.x * cell.x, ((aCell.y * frames + f1) + uv.y) * cell.y);
  vTint = aTint;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BILL_FRAG = /* glsl */`
uniform sampler2D atlas; uniform float gain;
varying vec2 vUv0; varying vec2 vUv1; varying float vMix; varying vec3 vTint;
#include <fog_pars_fragment>
void main() {
  vec4 a = mix(texture2D(atlas, vUv0), texture2D(atlas, vUv1), vMix);
  if (a.a < 0.45) discard;
  gl_FragColor = vec4(a.rgb / max(a.a, 1e-3) * vTint * gain, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the crowd
/**
 * crowd(scene, opts) -> { update(t, camera), count, stats() }
 *   opts.renderer       needed for impostor atlases
 *   opts.bodies         wardrobe ids to cast from, e.g. ['casual_a', 'hoodie', 'casual_f']
 *   opts.clips          clip names used by the crowd (baked once per body)
 *   opts.agents         array of { pos:[x,z] | [x,y,z], yaw, body, clip, phase (s), rate, scale, tint:[r,g,b] or hex,
 *                        vel:[vx,vz] (m/s, walkers), wrap:{ axis:'x'|'z', min, max } } (see layouts.js)
 *   opts.lod            { near: 14, mid: 45 } metres (camera distance); beyond mid -> impostor
 *   opts.dress          (role, mesh, body) -> material, default LK.dresser({}) per body
 *   opts.shadows        near bucket casts shadows (default true), opts.midShadows (false)
 *   opts.impostorLight  'back' (default) | 'front' | 'top'; opts.impostorGain (1)
 */
export async function crowd(scene, opts) {
  const { renderer } = opts;
  const clipNames = opts.clips;
  // LOD by projected height in pixels (CPU rasterisers are triangle-bound: ~1 us per triangle on
  // 4 llvmpipe threads, so the triangle budget decides): near above nearPx, impostor below midPx;
  // at most maxNear / maxMid people get the meshes, nearest first.
  const lod = { nearPx: 460, midPx: 150, maxNear: 6, maxMid: 160, ...(opts.lod ?? {}) };
  const agents = opts.agents;
  const groups = [];
  const usedBodies = [...new Set(agents.map(a => a.body))];
  for (const id of usedBodies) {
    const b0 = await PC.loadBody(id), b1 = await PC.loadBody(id + '_lod1', `${PC.ASSET}/wardrobe/${id}_lod1.glb`).catch(() => null);
    const ref = new PC.Person(b0); const bake = bakeBones(ref, clipNames);
    const uniforms = { bvBones: { value: bake.tex }, bvTime: { value: 0 } };
    const dress = opts.dress ? (role, m) => opts.dress(role, m, id) : LK.dresser(opts.dressOpts?.[id] ?? opts.dressOpts?.default ?? {});
    const matsFor = (merged, cheap) => merged.sources.map(m => {
      // LOD1 meshes have no images: borrow LOD0's material for the same garment
      const twin = b0.skinned.find(s => s.name === m.name) ?? b0.skinned.find(s => s.userData.role === m.userData.role) ?? m;
      const src = dress(twin.userData.role, twin);
      // mid LOD: plain standard material (no sheen / wrap lighting): the per-pixel cost of a
      // dense crowd is what dominates on CPU, and at that size the sheen band is sub-pixel
      const mat = cheap ? new THREE.MeshStandardMaterial({ map: src.map, color: src.color, roughness: src.roughness, metalness: 0,
        alphaHash: src.alphaHash, side: src.side }) : Object.assign(src.clone(), { onBeforeCompile: src.onBeforeCompile });
      return skinFromTexture(mat, uniforms, { lerp: !cheap });
    });
    const mk = (body, cheap = false) => {
      const merged = mergedGeometry(body, bake.names); const g = merged.geometry;
      const n = agents.length;
      g.setAttribute('bvAnim', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
      const mesh = new THREE.InstancedMesh(g, matsFor(merged, cheap), n);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3).setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false; mesh.count = 0;
      const depth = skinFromTexture(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), uniforms, { lerp: !cheap });
      mesh.customDepthMaterial = depth;
      mesh.userData.cheap = cheap;
      scene.add(mesh); return mesh;
    };
    const near = mk(b0), mid = b1 ? mk(b1, true) : null;
    near.castShadow = opts.shadows !== false; near.receiveShadow = true; if (mid) { mid.castShadow = !!opts.midShadows; mid.receiveShadow = true; }
    // impostor atlas from the mid mesh (one instance)
    let far = null;
    if (opts.impostors !== false && renderer) {
      const one = mk(b1 ?? b0, false); one.count = 1; one.setMatrixAt(0, new THREE.Matrix4()); one.instanceMatrix.needsUpdate = true; scene.remove(one);
      const infos = clipNames.map(c => bake.index[c]);
      const rt = renderAtlas(renderer, one, uniforms, infos, opts.impostorLight);
      const qg = new THREE.InstancedBufferGeometry(); const plane = new THREE.PlaneGeometry(1, 1); plane.translate(0, 0.5, 0);
      qg.index = plane.index; qg.setAttribute('position', plane.attributes.position);
      const n = agents.length;
      qg.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
      qg.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
      qg.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
      const mat = new THREE.ShaderMaterial({ vertexShader: BILL_VERT, fragmentShader: BILL_FRAG, fog: true,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { atlas: { value: rt.texture }, gain: { value: opts.impostorGain ?? 1 },
          cell: { value: new THREE.Vector2(1 / VIEWS, 1 / (FRAMES * clipNames.length)) }, frames: { value: FRAMES }, clips: { value: clipNames.length } }]) });
      mat.uniforms.atlas.value = rt.texture;
      far = new THREE.Mesh(qg, mat); far.frustumCulled = false; qg.instanceCount = 0; scene.add(far);
      far.userData.rt = rt;
    }
    groups.push({ id, b0, bake, uniforms, near, mid, far, clipIdx: Object.fromEntries(clipNames.map((c, i) => [c, i])) });
  }
  const byBody = Object.fromEntries(groups.map(g => [g.id, g]));
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _up = new THREE.Vector3(0, 1, 0);
  const frustum = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();
  const tint = agents.map(a => a.tint == null ? [1, 1, 1] : Array.isArray(a.tint) ? a.tint : _c.set(a.tint).toArray());
  let last = { near: 0, mid: 0, far: 0, culled: 0 };

  // agent position at time t (walkers move along vel and wrap inside their lane)
  const posAt = (a, t, out) => {
    const y = a.pos.length === 3 ? a.pos[1] : 0; let x = a.pos[0], z = a.pos.length === 3 ? a.pos[2] : a.pos[1];
    if (a.vel) { x += a.vel[0] * t; z += a.vel[1] * t;
      if (a.wrap) { const w = a.wrap, L = w.max - w.min; if (w.axis === 'x') x = w.min + (((x - w.min) % L) + L) % L; else z = w.min + (((z - w.min) % L) + L) % L; } }
    return out.set(x, y, z);
  };
  return {
    count: agents.length, groups, lod,
    stats: () => last,
    update(t, camera) {
      camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(_pm);
      const cam = camera.getWorldPosition(new THREE.Vector3());
      const H = renderer ? renderer.getDrawingBufferSize(new THREE.Vector2()).y : 1080;
      const pxPerM = H / (2 * Math.tan(camera.fov * Math.PI / 360)); // pixels per metre at 1 m
      for (const g of groups) { g.uniforms.bvTime.value = t; g._n = 0; g._m = 0; g._f = 0; }
      let culled = 0;
      // visible agents, nearest first: instances draw in buffer order, so front-to-back order lets
      // the depth test reject hidden pixels before shading (the big cost of a dense crowd on CPU)
      const vis = [];
      agents.forEach((a, i) => {
        const sc = a.scale ?? 1; const p = posAt(a, t, new THREE.Vector3());
        _sph.center.set(p.x, p.y + 0.9 * sc, p.z); _sph.radius = 1.1 * sc;
        if (!frustum.intersectsSphere(_sph)) { culled++; return; }
        vis.push([p.distanceToSquared(cam), i, p]);
      });
      vis.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      let nNear = 0, nMid = 0;
      vis.forEach(([d2, i, p]) => {
        const a = agents[i]; const g = byBody[a.body]; const info = g.bake.index[a.clip]; const sc = a.scale ?? 1;
        _p.copy(p); const d = Math.sqrt(d2);
        const yaw = a.yaw ?? (a.vel ? Math.atan2(a.vel[0], a.vel[1]) : 0);
        // playback rate: walkers advance the cycle by distance (no foot slide), others by time
        const rate = a.vel && info.speed > 0 ? Math.hypot(a.vel[0], a.vel[1]) / (info.speed * g.b0.leg / PC.lib.legRef * sc) : (a.rate ?? 1);
        const fpsRate = FPS * rate, ph = ((a.phase ?? 0) * FPS) % info.n;
        const px = 1.8 * sc * pxPerM / Math.max(d, 0.1);
        const wantNear = px > lod.nearPx || (!g.mid && !g.far), wantMid = px > lod.midPx || !g.far;
        if (wantNear && nNear < lod.maxNear || (!g.mid && !g.far)) {
          nNear++; put(g.near, g._n++, _p, yaw, sc, info, fpsRate, ph, tint[i]);
        } else if ((wantNear || wantMid) && g.mid && (nMid++ < lod.maxMid || !g.far)) {
          put(g.mid, g._m++, _p, yaw, sc, info, fpsRate, ph, tint[i]);
        } else if (g.far) {
          const k = g._f++; const geo = g.far.geometry;
          geo.attributes.aPos.setXYZ(k, _p.x, _p.y, _p.z);
          // view index: camera azimuth around the agent relative to its facing
          const az = Math.atan2(cam.x - _p.x, cam.z - _p.z) - yaw; const v = ((Math.round(az / (Math.PI * 2) * VIEWS) % VIEWS) + VIEWS) % VIEWS;
          const tt = (t * fpsRate + ph) % info.n; // frame in bake units -> impostor frame
          let fr;
          if (info.dur <= 2.5) fr = tt / info.n * FRAMES;
          else { const span = Math.min(info.n - 1, 3 * FPS); const u = (tt % (2 * span)); const pp = u < span ? u : 2 * span - u; fr = pp / span * (FRAMES - 1); }
          geo.attributes.aCell.setXYZW(k, v, g.clipIdx[a.clip], Math.min(fr, FRAMES - 1.001), sc);
          geo.attributes.aTint.setXYZ(k, tint[i][0], tint[i][1], tint[i][2]);
        }
      });
      let N = 0, Mi = 0, F = 0;
      for (const g of groups) {
        for (const [mesh, n] of [[g.near, g._n], [g.mid, g._m]]) if (mesh) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.geometry.attributes.bvAnim.needsUpdate = true; mesh.visible = n > 0; }
        if (g.far) { g.far.geometry.instanceCount = g._f; for (const k of ['aPos', 'aCell', 'aTint']) g.far.geometry.attributes[k].needsUpdate = true; g.far.visible = g._f > 0; }
        N += g._n; Mi += g._m; F += g._f;
      }
      last = { near: N, mid: Mi, far: F, culled };
    },
  };
  function put(mesh, k, p, yaw, sc, info, fpsRate, ph, tn) {
    _q.setFromAxisAngle(_up, yaw); _s.setScalar(sc); _m.compose(p, _q, _s); mesh.setMatrixAt(k, _m);
    mesh.geometry.attributes.bvAnim.setXYZW(k, info.row, info.n, fpsRate, ph);
    mesh.instanceColor.setXYZ(k, tn[0], tn[1], tn[2]);
  }
}
