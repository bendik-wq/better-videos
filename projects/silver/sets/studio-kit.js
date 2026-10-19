// STUDIO KIT (episode 7, silver): the premium product-shot look.
//   - studioEnv(renderer): a softbox studio baked to a PMREM environment (key box, top strip, rim strips, warm floor
//     bounce). Metal gets real reflections with soft gradients; matte clay gets soft wraparound light.
//   - studio(scene, renderer, o): environment + cyclorama sweep (no horizon) + key light with a tight shadow + fog
//     that melts the floor into the backdrop. Returns { key, cyc, contact }.
//   - contactShadow(scene, renderer, o): the soft blurred ground shadow under objects (render-from-below + 2 blurs),
//     updated every frame (pure function of the scene state, so motion-blur subsamples stay consistent).
//   - materials: silverMat (cast, slightly frosted), polishedSilver, clay, wood, velvet, glass, gold, brass, paperMat.
//   - geometry: barGeometry (an LBMA-style 1,000-oz cast bar: tapered, rounded, stamped top face),
//     coinGeometry, taperedBox.
//   - motion: spring (analytic damped oscillator, overshoot then settle), drop (fall + bounce), easing, rig (camera
//     on a Catmull-Rom path with smootherstep timing + a tiny handheld float).
// Units: 1 unit = 10 cm. A 1,000-oz bar is about 3.0 × 0.85 × 1.3 units (~31 kg).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

// ---------------------------------------------------------------- palette (bright house style + metals)
export const SP = {
  paper: '#f6f3ec', cyc: '#efebe2', cycTop: '#f7f5f0', ink: '#14233d', inkSoft: '#4b5a70', teal: '#2a8c86', sage: '#a9c5ae',
  red: '#e0241b', clay: '#f3f1ec', claySoft: '#e6e1d6', wood: '#a7714a', woodDark: '#6e4529', velvet: '#1d3557', felt: '#2e5e4e',
  silver: '#f2f3f5', gold: '#e6c36a', brass: '#c9a45a', sky: '#cfe3ef', navy: '#14233d', cream: '#efe4cc', oil: '#1b1b1f',
};

// ---------------------------------------------------------------- maths
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const outQuint = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const inCubic = (x) => Math.pow(clamp(x), 3);
export const inOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const inOutSine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
export const outBack = (x, s = 1.4) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
export function hash(...xs) { let h = 2166136261; for (const x of xs) for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
export function rng(seed = 1) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1; }

// Spring: 0 → 1 with overshoot and settle; dt = seconds since start. zeta < 1 bounces; freq in Hz.
export function spring(dt, { zeta = 0.42, freq = 2.4 } = {}) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * dt) * (Math.cos(wd * dt) + (zeta * w / wd) * Math.sin(wd * dt));
}
// Drop: height factor 1 → 0 under gravity, with `bounces` decaying hops (restitution e). Returns { y (0..1 of h), landed }.
export function drop(dt, { h = 1, g = 98, e = 0.32, bounces = 2 } = {}) {
  if (dt <= 0) return { y: h, v: 0, hit: -1 };
  let t0 = Math.sqrt(2 * h / g); if (dt < t0) return { y: h - 0.5 * g * dt * dt, hit: -1 };
  let v = g * t0 * e, t = dt - t0;
  for (let k = 0; k < bounces; k++) { const T = 2 * v / g; if (t < T) return { y: v * t - 0.5 * g * t * t, hit: k }; t -= T; v *= e; }
  return { y: 0, hit: bounces };
}
// cue(): seconds from a number, a spoken word ('word', 'word@2', 'word+0.4'), or { word, at }.
export function cue(shot, spec, fallback = 0) {
  if (spec === undefined || spec === null) return fallback;
  if (typeof spec === 'number') return spec;
  if (typeof spec === 'object') { const v = cue(shot, spec.word, NaN); return Number.isFinite(v) ? v : (spec.at ?? fallback); }
  const m = String(spec).match(/^([^@+\-]+)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) return fallback;
  const word = m[1].toLowerCase(), nth = Number(m[2] ?? 1) - 1, off = Number(m[3] ?? 0);
  const ws = shot?.words ?? []; const vo0 = (shot?.voAt ?? 0) - (shot?.start ?? 0);
  let k = 0; for (const w of ws) { const s = String(w.word ?? w.w ?? '').toLowerCase().replace(/[^a-z0-9$%.']/g, ''); if (s.startsWith(word)) { if (k === nth) return vo0 + (w.start ?? w.s) + off; k++; } }
  return fallback;
}

// ---------------------------------------------------------------- environment: a softbox studio, baked once per renderer
const envCache = new WeakMap();
export function studioEnv(renderer, { warm = 0.08, key = 7, rim = 5, top = 3.5, fill = 0.9, floor = 0.32, base = 0.2, zenith = 1.25, front = 2.4 } = {}) {
  const k = `${warm}|${key}|${rim}|${top}|${fill}|${floor}|${base}|${zenith}|${front}`;
  const byR = envCache.get(renderer) ?? new Map(); envCache.set(renderer, byR);
  if (byR.has(k)) return byR.get(k);
  const s = new THREE.Scene();
  // dome: soft vertical gradient (bright top, warm mid, darker floor) so metal never reflects pure black
  const dome = new THREE.SphereGeometry(60, 64, 32); const col = [];
  const pos = dome.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 60;
    // dark-ish surround (product-shot flags) so metal shows contrast; the panels below do the lighting
    const u = Math.pow(Math.max(0, y), 1.6);
    const c = y > 0 ? new THREE.Color().setRGB(lerp(base, zenith, u), lerp(base, zenith, u), lerp(base * 1.03, zenith * 1.02, u))
      : new THREE.Color().setRGB(lerp(base, floor, -y) * (1 + warm), lerp(base, floor, -y), lerp(base, floor, -y) * (1 - warm));
    col.push(c.r, c.g, c.b);
  }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  s.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  const panel = (w, h, pos, intensity, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * intensity, tint[1] * intensity, tint[2] * intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); return m;
  };
  panel(26, 18, [-22, 26, 18], key, [1, 0.985, 0.96]);        // key softbox: high front-left
  panel(40, 7, [0, 34, -2], top);                               // top strip: long highlight along bar tops
  panel(5, 30, [28, 12, -16], rim, [0.96, 0.98, 1]);            // rim strip: back-right edge light
  panel(5, 30, [-30, 10, -18], rim * 0.6, [0.96, 0.98, 1]);     // second rim: back-left
  panel(30, 16, [30, 6, 16], fill, [1, 0.97, 0.93]);            // warm fill card: right
  panel(44, 12, [-6, 7, 44], front, [1, 0.99, 0.97]);           // frontal softbox behind camera: gradient on front faces
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.0, 0.1, 200).texture; pm.dispose();
  s.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  byR.set(k, tex); return tex;
}

// ---------------------------------------------------------------- cyclorama sweep (floor curving up into a wall)
export function cycGeometry({ width = 400, depth = 120, radius = 40, height = 160, seg = 48 } = {}) {
  // profile in (z, y): floor from z = +depth/2 to z = -depth/2, quarter circle of `radius`, wall up to `height`
  const prof = [];
  const zf = depth / 2, zb = -depth / 2;
  for (let i = 0; i <= 8; i++) prof.push([lerp(zf, zb, i / 8), 0]);
  for (let i = 1; i <= seg; i++) { const a = (i / seg) * Math.PI / 2; prof.push([zb - Math.sin(a) * radius, radius - Math.cos(a) * radius]); }
  for (let i = 1; i <= 6; i++) prof.push([zb - radius, radius + (height - radius) * i / 6]);
  const nx = 24, verts = [], uvs = [], idx = [];
  let L = 0; const acc = [0]; for (let i = 1; i < prof.length; i++) { L += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); acc.push(L); }
  for (let j = 0; j < prof.length; j++) for (let i = 0; i <= nx; i++) { verts.push(lerp(-width / 2, width / 2, i / nx), prof[j][1], prof[j][0]); uvs.push(i / nx, acc[j] / L); }
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + nx + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// studio(scene, renderer, o) → { key, cyc, env, contact?, setKey(az, el) }
//   o.color      cyc colour (default paper); o.bg (background/fog colour, default = color)
//   o.target     what the key light's shadow frames; o.span = shadow frustum half-size (units)
//   o.az, o.el   key light direction in degrees (az 0 = from camera side +z, positive = from the left)
//   o.env        studioEnv options; o.envIntensity
//   o.contact    contactShadow options or false
export function studio(scene, renderer, o = {}) {
  const { color = SP.cyc, bg = o.color ?? SP.cyc, target = [0, 0, 0], span = 18, az = 125, el = 40, keyI = 2.3, fog = [70, 190], envIntensity = 1, contact = {}, cyc: cycOpt = {}, shadowBias = -0.0004, mapSize = 4096 } = o;
  const env = studioEnv(renderer, o.env ?? {});
  scene.environment = env; scene.environmentIntensity = envIntensity;
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(new THREE.Color(bg), fog[0], fog[1]);
  const cyc = new THREE.Mesh(cycGeometry(cycOpt), new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, envMapIntensity: o.cycEnv ?? 0.3 }));
  cyc.position.set(target[0], 0, target[2] + (cycOpt.back ?? 0)); cyc.receiveShadow = true; scene.add(cyc);
  const key = new THREE.DirectionalLight(0xfff6ea, keyI);
  key.castShadow = true; key.shadow.mapSize.set(mapSize, mapSize); key.shadow.bias = shadowBias; key.shadow.normalBias = 0.02; key.shadow.radius = o.soft ?? 14; key.shadow.blurSamples = 20;
  const sc = key.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = 400;
  key.target.position.set(...target); scene.add(key, key.target);
  const setKey = (a, e) => { const A = a * Math.PI / 180, E = e * Math.PI / 180; key.position.set(target[0] - Math.sin(A) * Math.cos(E) * 120, Math.sin(E) * 120, target[2] + Math.cos(A) * Math.cos(E) * 120); key.shadow.camera.updateProjectionMatrix(); };
  setKey(az, el);
  cyc.material.envMap = env;
  const out = { key, cyc, env, setKey, applyEnv: () => applyEnv(scene, env) };
  if (contact !== false) out.contact = contactShadow(scene, renderer, { center: target, ...contact });
  return out;
}

// three r163+: material.envMapIntensity only applies when the material has its own envMap (else the
// scene-wide environmentIntensity wins). Give every material the env explicitly so per-material
// strengths work (cyc floor low, metal high). Call once after the set is built.
export function applyEnv(scene, env) {
  scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m && 'envMap' in m && !m.envMap && m.isMeshStandardMaterial) { m.envMap = env; m.needsUpdate = true; } });
}

// ---------------------------------------------------------------- contact shadow (three.js webgl_shadow_contact, made deterministic)
export function contactShadow(scene, renderer, { center = [0, 0, 0], w = 40, d = 30, res = 512, height = 6, blur = 2.2, darkness = 0.85, opacity = 0.72, y = 0.012 } = {}) {
  const rt = new THREE.WebGLRenderTarget(res, res), rtB = new THREE.WebGLRenderTarget(res, res);
  rt.texture.generateMipmaps = rtB.texture.generateMipmaps = false;
  const group = new THREE.Group(); group.position.set(center[0], y, center[2]); scene.add(group);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: rt.texture, opacity, transparent: true, depthWrite: false, fog: false }));
  plane.renderOrder = 1; plane.scale.y = -1; group.add(plane);
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, d / 2, -d / 2, 0, height); cam.rotation.x = Math.PI / 2; group.add(cam);
  const depthMat = new THREE.MeshDepthMaterial(); depthMat.userData.darkness = { value: darkness };
  depthMat.onBeforeCompile = (sh) => { sh.uniforms.darkness = depthMat.userData.darkness; sh.fragmentShader = `uniform float darkness;\n${sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );')}`; };
  depthMat.depthTest = false; depthMat.depthWrite = false;
  const hb = new THREE.ShaderMaterial(HorizontalBlurShader); hb.depthTest = false;
  const vb = new THREE.ShaderMaterial(VerticalBlurShader); vb.depthTest = false;
  const blurPlane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), hb); blurPlane.visible = false; group.add(blurPlane);
  const pass = (amount) => {
    blurPlane.visible = true;
    blurPlane.material = hb; hb.uniforms.tDiffuse.value = rt.texture; hb.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(rtB); renderer.render(blurPlane, cam);
    blurPlane.material = vb; vb.uniforms.tDiffuse.value = rtB.texture; vb.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(rt); renderer.render(blurPlane, cam);
    blurPlane.visible = false;
  };
  const hidden = [];
  return {
    group, plane,
    // call once per frame before the main render; `hide` = objects that must not cast (the cyc, etc.)
    update(hide = []) {
      const bg = scene.background, fog = scene.fog, ov = scene.overrideMaterial, rtPrev = renderer.getRenderTarget();
      scene.background = null; scene.fog = null; plane.visible = false; hidden.length = 0;
      for (const o of hide) if (o.visible) { o.visible = false; hidden.push(o); }
      scene.overrideMaterial = depthMat; const cc = renderer.getClearAlpha(); renderer.setClearAlpha(0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
      scene.overrideMaterial = ov;
      pass(blur); pass(blur * 0.4);
      for (const o of hidden) o.visible = true;
      renderer.setRenderTarget(rtPrev); renderer.setClearAlpha(cc); scene.background = bg; scene.fog = fog; plane.visible = true;
    },
    dispose() { rt.dispose(); rtB.dispose(); plane.geometry.dispose(); plane.material.dispose(); depthMat.dispose(); hb.dispose(); vb.dispose(); },
  };
}

// ---------------------------------------------------------------- textures
export function canvasTex(w, h, draw, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
// fine noise for frosted/cast metal roughness and bump
let NOISE = null;
export function noiseTex(N = 512, seed = 7) {
  if (NOISE) return NOISE;
  const r = rng(seed);
  NOISE = canvasTex(N, N, (g) => {
    const im = g.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const x = i % N, y = (i / N) | 0; const lf = Math.sin(x / 37 + Math.sin(y / 53) * 2) * Math.sin(y / 41 + Math.cos(x / 61) * 2);
      const v = 140 + lf * 45 + (r() - 0.5) * 60 + (r() < 0.004 ? -60 : 0); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); g.filter = 'blur(1.4px)'; g.drawImage(g.canvas, 0, 0);
  }, { srgb: false, repeat: [1.5, 1.5] });
  return NOISE;
}

// ---------------------------------------------------------------- materials
export const silverMat = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.color ?? SP.silver, metalness: 1, roughness: o.rough ?? 0.2, roughnessMap: o.frost === false ? null : noiseTex(), envMapIntensity: o.env ?? 1.6, clearcoat: o.clearcoat ?? 0.0, ...(o.extra ?? {}) });
export const polishedSilver = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.color ?? SP.silver, metalness: 1, roughness: o.rough ?? 0.07, envMapIntensity: o.env ?? 1.2 });
export const goldMat = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.color ?? SP.gold, metalness: 1, roughness: o.rough ?? 0.18, envMapIntensity: 1.1 });
export const brassMat = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.color ?? SP.brass, metalness: 1, roughness: o.rough ?? 0.32, envMapIntensity: 1 });
export const clay = (hex = SP.clay, o = {}) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: o.rough ?? 0.62, metalness: 0, sheen: o.sheen ?? 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: o.env ?? 0.9, clearcoat: o.coat ?? 0.0, clearcoatRoughness: 0.5, ...(o.extra ?? {}) });
export const glossy = (hex, o = {}) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: o.rough ?? 0.35, metalness: 0, clearcoat: o.coat ?? 0.6, clearcoatRoughness: 0.18, envMapIntensity: 1 });
export const velvet = (hex = SP.velvet) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.9, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.55), envMapIntensity: 0.7 });
export const glass = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.color ?? '#ffffff', roughness: 0.04, metalness: 0, transmission: 0, transparent: true, opacity: o.opacity ?? 0.22, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false });
let WOOD = null;
export function woodTex() {
  if (WOOD) return WOOD;
  const r = rng(11);
  WOOD = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = SP.wood; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y = r() * h, a = 0.04 + r() * 0.12, th = 1 + r() * 5, wav = r() * 20;
      g.strokeStyle = r() < 0.5 ? `rgba(80,45,22,${a})` : `rgba(235,190,140,${a * 0.8})`; g.lineWidth = th; g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 140 + i) * wav); g.stroke(); }
  }, { repeat: [1, 1] });
  return WOOD;
}
export const wood = (o = {}) => new THREE.MeshPhysicalMaterial({ map: woodTex(), color: o.color ?? '#ffffff', roughness: o.rough ?? 0.5, clearcoat: o.coat ?? 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.8 });
export const paperMat = (map, o = {}) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.85, sheen: 0.2, envMapIntensity: 0.9, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent });

// ---------------------------------------------------------------- geometry
// Taper a geometry: x/z scale at the bottom = `bottom` (top stays 1). y is assumed in [y0, y1].
export function taper(geo, { bottom = 0.88, bottomZ = bottom } = {}) {
  geo.computeBoundingBox(); const { min, max } = geo.boundingBox; const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = (p.getY(i) - min.y) / (max.y - min.y); p.setX(i, p.getX(i) * lerp(bottom, 1, k)); p.setZ(i, p.getZ(i) * lerp(bottomZ, 1, k)); }
  geo.computeVertexNormals(); return geo;
}
// planar top-down UVs (u along x, v along z) so a stamp texture lands on the top face only
export function planarUV(geo) {
  geo.computeBoundingBox(); const { min, max } = geo.boundingBox; const p = geo.attributes.position; const uv = [];
  for (let i = 0; i < p.count; i++) uv.push((p.getX(i) - min.x) / (max.x - min.x), 1 - (p.getZ(i) - min.z) / (max.z - min.z));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return geo;
}
// box-projected second UV set (uv1) for surface texture on every face (roughness mottling), scale = texture repeats per unit
export function boxUV1(geo, scale = 0.5) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = [];
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ay >= ax && ay >= az) uv.push(x * scale, z * scale); else if (ax >= az) uv.push(z * scale + 0.37, y * scale); else uv.push(x * scale + 0.71, y * scale); }
  geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2)); return geo;
}
// Bar stamp (bump map): a sunken cartouche with FINE SILVER / 999.0 / serial, mirrored correctly for planarUV
const stampCache = new Map();
export function barStamp(serial = 'Nº 1980-0127', { lines = ['FINE SILVER', '999.0'] } = {}) {
  const k = serial + lines.join('|'); if (stampCache.has(k)) return stampCache.get(k);
  const t = canvasTex(1024, 448, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    // the cast surface: faint ripples
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},0.025)`; g.lineWidth = 9; g.beginPath(); g.ellipse(w / 2, h / 2, 60 + i * 13, 25 + i * 6, 0, 0, Math.PI * 2); g.stroke(); }
    // a sunken rounded cartouche
    g.fillStyle = '#5c5c5c'; const rr = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x, y, ww, hh, r); g.fill(); };
    rr(150, 92, 724, 264, 26);
    g.fillStyle = '#929292'; rr(162, 104, 700, 240, 20);
    g.fillStyle = '#4a4a4a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 74px "Archivo Narrow", sans-serif'; g.fillText(lines[0], w / 2, 168);
    g.font = '700 92px "Archivo Narrow", sans-serif'; g.fillText(lines[1], w / 2, 254);
    g.font = '500 38px "Plex Mono", monospace'; g.fillText(serial, w / 2, 320);
    g.filter = 'blur(1.5px)'; g.drawImage(g.canvas, 0, 0);
  }, { srgb: false });
  stampCache.set(k, t); return t;
}
// A 1,000-oz cast bar. Returns a BufferGeometry, y from 0 (bottom) to h. Planar UVs for the stamp.
let BAR = null;
export function barGeometry({ l = 3.0, h = 0.85, w = 1.3, r = 0.12, seg = 4 } = {}) {
  if (BAR && !arguments.length) return BAR;
  const g = new RoundedBoxGeometry(l, h, w, seg, r);
  taper(g, { bottom: 0.9, bottomZ: 0.84 });
  // the cast top is very slightly domed and wavy
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > h / 2 - r * 0.6) { const x = p.getX(i) / l, z = p.getZ(i) / w; p.setY(i, y + 0.025 * (1 - 4 * x * x) * (1 - 4 * z * z) + 0.008 * Math.sin(x * 19 + z * 7)); } }
  g.translate(0, h / 2, 0); g.computeVertexNormals(); planarUV(g); boxUV1(g, 0.55);
  if (!arguments.length) BAR = g; return g;
}
export function barMaterial(o = {}) {
  const m = silverMat({ rough: o.rough ?? 0.17, ...o });
  if (o.stamp !== false) { m.bumpMap = barStamp(o.serial, o); m.bumpScale = o.bumpScale ?? 2.2; }
  if (m.roughnessMap) { m.roughnessMap = m.roughnessMap.clone(); m.roughnessMap.channel = 1; m.roughnessMap.repeat.set(1, 1); m.roughnessMap.needsUpdate = true; m.roughness = (o.rough ?? 0.17) * 1.5; }
  return m;
}
// coin: a disc with a raised rim; y from 0 to h
export function coinGeometry({ r = 0.19, h = 0.022, rim = 0.015, seg = 64 } = {}) {
  const pts = [[0, 0], [r, 0], [r, h], [r - rim, h], [r - rim, h * 0.7], [0, h * 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, seg);
}
// generic rounded tapered block (clay buildings, cases)
export const roundBox = (x, y, z, r = 0.08, seg = 3) => new RoundedBoxGeometry(x, y, z, seg, Math.min(r, x / 2 - 1e-3, y / 2 - 1e-3, z / 2 - 1e-3)).translate(0, y / 2, 0);
export { mergeGeometries };

// ---------------------------------------------------------------- instanced helpers
export function instances(geo, material, items, { cast = true, receive = true } = {}) {
  const m = new THREE.InstancedMesh(geo, material, Math.max(1, items.length)); m.castShadow = cast; m.receiveShadow = receive;
  const o = new THREE.Object3D();
  items.forEach((it, i) => { o.position.set(...it.p); o.rotation.set(...(it.r ?? [0, 0, 0])); o.scale.setScalar(it.s ?? 1); if (it.sv) o.scale.set(...it.sv); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  if (items.some(it => it.c)) items.forEach((it, i) => m.setColorAt(i, new THREE.Color(it.c ?? '#ffffff')));
  m.count = items.length; m.instanceMatrix.needsUpdate = true; return m;
}
// set one instance's transform (for animation)
const _o = new THREE.Object3D();
export function place(mesh, i, p, r = [0, 0, 0], s = 1) { _o.position.set(...p); _o.rotation.set(...r); if (Array.isArray(s)) _o.scale.set(...s); else _o.scale.setScalar(s); _o.updateMatrix(); mesh.setMatrixAt(i, _o.matrix); }

// ---------------------------------------------------------------- camera rig
// keys: [{ pos:[x,y,z], look:[x,y,z], mm?:35 }, ...] spread across [t0, t1] (seconds), or with explicit `at` per key.
// Catmull-Rom through positions and look targets; timing is smootherstep over the whole move (no stop at inner keys).
// float: handheld micro-drift amplitude in units (0 = locked off).
const mmToFov = (mm) => 2 * Math.atan(12 / mm) * 180 / Math.PI; // 24 mm sensor height (full-frame vertical)
export { mmToFov };
function cr(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
function path(arr, u) {
  const n = arr.length; if (n === 1) return arr[0].slice();
  const f = clamp(u) * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i;
  const P = (k) => arr[Math.max(0, Math.min(n - 1, k))];
  return [0, 1, 2].map(c => cr(P(i - 1)[c], P(i)[c], P(i + 1)[c], P(i + 2)[c], t));
}
export function rig(camera, keys, t, { t0 = 0, t1 = 8, ease = smoother, float = 0.03, seed = 1 } = {}) {
  const u = ease(range(t, t0, t1));
  const p = path(keys.map(k => k.pos), u), l = path(keys.map(k => k.look), u);
  const mms = keys.map(k => k.mm ?? 35); const mmf = (mms.length - 1) * u, mi = Math.min(mms.length - 2, Math.floor(mmf));
  const mm = mms.length === 1 ? mms[0] : lerp(mms[mi], mms[mi + 1], smoother(mmf - mi));
  if (float) { p[0] += noise1(t * 0.31, seed) * float; p[1] += noise1(t * 0.27, seed + 7) * float * 0.7; l[0] += noise1(t * 0.23, seed + 3) * float * 0.6; l[1] += noise1(t * 0.29, seed + 5) * float * 0.5; }
  camera.position.set(...p); camera.lookAt(...l);
  const fov = mmToFov(mm); if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
  return { pos: p, look: l, mm, dist: Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]) };
}
