// SHOT LAB: a neutral test world for engine/camera.js and the shot catalog (docs/shots/).
// Every shot in project.json names a catalog id; its camera is the catalog recipe itself, built
// from docs/shots/catalog.json at load, so what you see here is exactly what the catalog promises.
//
// Sets
//   world  a dusk city on the pole of a 150 km planet: ground grid, blocks with lit windows, a
//          tower, an office with one lit window (push-through), a plaza with a container (hero),
//          a pedestal object, a document on a table, a screen, a road with a car that cruises and
//          brakes, a walking figure, a ridge to the south. Pull-backs reach orbit.
//   globe  a procedural globe in a void with a graticule and two red markers.
// Params: { shot: 'FOL-012', t0: world-clock offset (s), label: true }
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as M from '/engine/camera.js';
import { world as worldHandles, ground, R } from './world-handles.mjs';

const W = worldHandles();
const SODIUM = 0xffa860, SUN = 0xffc694;
const qs = new URLSearchParams(location.search);

// ---------------------------------------------------------------- procedural textures
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// 3D value noise (hash lattice), fBm; deterministic
const hash3 = (x, y, z, s) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1013904223) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function noise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t, H = (i, j, k) => hash3(xi + i, yi + j, zi + k, s);
  return L(L(L(H(0, 0, 0), H(1, 0, 0), u), L(H(0, 1, 0), H(1, 1, 0), u), v), L(L(H(0, 0, 1), H(1, 0, 1), u), L(H(0, 1, 1), H(1, 1, 1), u), v), w);
}
const fbm = (x, y, z, s, oct = 5) => { let a = 0, f = 1, amp = 0.5; for (let i = 0; i < oct; i++) { a += amp * noise3(x * f, y * f, z * f, s + i); f *= 2.03; amp *= 0.5; } return a; };
// equirect planet albedo, sampled on the sphere (no seam, no pole pinch); same UV mapping as three
let planetCache = null;
function planetTextures() {
  if (planetCache) return planetCache;
  const Wd = 1536, Hd = 768;
  const albedo = document.createElement('canvas'); albedo.width = Wd; albedo.height = Hd; const ax = albedo.getContext('2d'); const img = ax.createImageData(Wd, Hd);
  const cloud = document.createElement('canvas'); cloud.width = Wd; cloud.height = Hd; const cx = cloud.getContext('2d'); const cimg = cx.createImageData(Wd, Hd);
  for (let j = 0; j < Hd; j++) for (let i = 0; i < Wd; i++) {
    const u = (i + 0.5) / Wd, v = (j + 0.5) / Hd, th = v * Math.PI, ph = u * 2 * Math.PI;
    const x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
    const e = fbm(x * 1.6 + 7, y * 1.6, z * 1.6, 11, 6) + 0.1 * Math.max(0, (y - 0.85) / 0.15) + 0.14 * Math.max(0, Math.min(1, (y - 0.99) / 0.009)), land = e > 0.52, polar = Math.max(0, Math.min(1, (y - 0.93) / 0.065));
    const k = (j * Wd + i) * 4; let r, g, b;
    if (land) { const m = fbm(x * 6, y * 6, z * 6, 23, 5), dry = Math.max(0, 0.7 - Math.abs(y)) * m, coast = Math.min(1, (e - 0.52) * 12);
      r = 46 + 70 * dry + 34 * m; g = 50 + 40 * dry + 26 * m; b = 36 + 14 * m; r = r * coast + 24 * (1 - coast); g = g * coast + 34 * (1 - coast); b = b * coast + 40 * (1 - coast); }
    else { const d = Math.min(1, (0.52 - e) * 6); r = 16 + 10 * (1 - d); g = 30 + 18 * (1 - d); b = 52 + 26 * (1 - d); }
    const dk = 1 - 0.25 * polar * polar * (3 - 2 * polar); img.data[k] = r * dk; img.data[k + 1] = g * dk; img.data[k + 2] = b * dk; img.data[k + 3] = 255;
    const c = fbm(x * 3 + 3, y * 3, z * 3, 41, 5); const ca = Math.max(0, Math.min(1, (c - 0.55) * 3.2)) * Math.min(1, Math.max(0, (0.985 - y) * 12)); cimg.data[k] = cimg.data[k + 1] = cimg.data[k + 2] = 255; cimg.data[k + 3] = ca * 220;
  }
  ax.putImageData(img, 0, 0); cx.putImageData(cimg, 0, 0);
  const tA = new THREE.CanvasTexture(albedo); tA.colorSpace = THREE.SRGBColorSpace; tA.anisotropy = 8;
  const tC = new THREE.CanvasTexture(cloud); tC.colorSpace = THREE.SRGBColorSpace;
  return (planetCache = { albedo: tA, clouds: tC });
}
// rim-lit atmosphere shell
function atmosphere(radius, sunDir, color = 0x8fb4ff, strength = 1) {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    uniforms: { uSun: { value: new THREE.Vector3(...sunDir).normalize() }, uC: { value: new THREE.Color(color) }, uK: { value: strength } },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uSun; uniform vec3 uC; uniform float uK; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(1.0 - max(dot(vN, v), 0.0), 4.0); float lit = smoothstep(-0.25, 0.4, dot(vN, uSun));
        gl_FragColor = vec4(uC * f * lit * uK * 1.4, 1.0); }` });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 48), m);
}

// windows: a 4 x 4 bay facade tile; lit bays are sodium or (rarely) fluorescent
function facadeTextures(seed = 3) {
  const r = K.rng(seed), lit = [];
  for (let i = 0; i < 64; i++) lit.push(r() < 0.22 ? (r() < 0.8 ? 1 : 2) : 0);
  const draw = (emit) => (x, w, h) => {
    x.fillStyle = emit ? '#000' : '#2a2928'; x.fillRect(0, 0, w, h);
    if (!emit) { const rr = K.rng(seed + 9); for (let i = 0; i < 1500; i++) { const v = 40 + rr() * 30; x.fillStyle = `rgba(${v},${v},${v - 4},.25)`; x.fillRect(rr() * w, rr() * h, 2 + rr() * 6, 1 + rr() * 3); } }
    const n = 8, cw = w / n, ch = h / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const L = lit[j * n + i], px = i * cw + cw * 0.26, py = j * ch + ch * 0.28, ww = cw * 0.48, hh = ch * 0.42;
      if (emit) { if (L) { x.fillStyle = L === 1 ? `rgba(255,${150 + (i * 7) % 40},90,1)` : 'rgba(150,255,190,0.9)'; x.fillRect(px, py, ww, hh); } }
      else { x.fillStyle = L ? '#2a2016' : '#101317'; x.fillRect(px, py, ww, hh); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(px, py, ww, 2); }
    }
    if (!emit) { x.fillStyle = '#242322'; x.fillRect(0, h - 6, 6, 6); } // solid texel for roofs (uv ~ 0,0)
  };
  const map = canvasTex(512, 512, draw(false)), emi = canvasTex(512, 512, draw(true));
  for (const t of [map, emi]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return { map, emi };
}
// a box whose wall UVs are in metres / bay size (so windows keep their size) and roof UVs on a solid texel
function buildingGeo(w, h, d, x, y0, z, bayW = 3.6, bayH = 3.4) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y0 + h / 2, z);
  const uv = g.attributes.uv, pos = g.attributes.position, nrm = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = nrm.getX(i), ny = nrm.getY(i), px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    if (Math.abs(ny) > 0.5) { uv.setXY(i, 0.003, 0.003); continue; }
    const s = Math.abs(nx) > 0.5 ? pz : px; uv.setXY(i, s / (bayW * 8), (py - y0) / (bayH * 8));
  }
  return g;
}

// ---------------------------------------------------------------- WORLD
let worldCache = null, officeGlass = null;
async function buildWorld(ctx) {
  if (worldCache) return worldCache;
  const { renderer } = ctx;
  const scene = new THREE.Scene();
  C.sky(scene, 'qwantani_dusk_2', { intensity: 0.26, bgIntensity: 0.38, blur: 0.0 });
  scene.fog = new THREE.FogExp2(0x3a3a45, 0.006);
  const sunDir = new THREE.Vector3(...W.sun).normalize(); // W.sun points toward the sun (low, ~19 deg)
  const sun = new THREE.DirectionalLight(SUN, 3.4); sun.position.copy(sunDir).multiplyScalar(400); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 50, far: 900 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06; scene.add(sun, sun.target);

  // ground: a high-res spherical cap in world coordinates (polar grid), planar UVs for the grid
  const gridTex = canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#26272a'; x.fillRect(0, 0, w, h); const r = K.rng(4);
    for (let i = 0; i < 9000; i++) { const v = 22 + r() * 18; x.fillStyle = `rgba(${v},${v},${v + 2},.35)`; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
    for (let i = 0; i <= 10; i++) { x.fillStyle = i % 10 === 0 ? 'rgba(120,124,130,.55)' : 'rgba(90,94,100,.28)'; const t = i % 10 === 0 ? 4 : 2; x.fillRect(i * w / 10 - t / 2, 0, t, h); x.fillRect(0, i * h / 10 - t / 2, w, t); }
  });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  const RINGS = 90, SEG = 128, RMAX = 2400;
  const cap = new THREE.BufferGeometry(), P = [], UV = [], I = [];
  P.push(0, ground(0, 0), 0); UV.push(0, 0);
  for (let i = 1; i <= RINGS; i++) { const rr = RMAX * Math.pow(i / RINGS, 2.2); for (let j = 0; j < SEG; j++) { const a = j / SEG * Math.PI * 2, x = Math.cos(a) * rr, z = Math.sin(a) * rr; P.push(x, ground(x, z), z); UV.push(x / 50, z / 50); } }
  for (let j = 0; j < SEG; j++) I.push(0, 1 + (j + 1) % SEG, 1 + j);
  for (let i = 1; i < RINGS; i++) for (let j = 0; j < SEG; j++) { const a = 1 + (i - 1) * SEG + j, b = 1 + (i - 1) * SEG + (j + 1) % SEG, c = a + SEG, d = b + SEG; I.push(a, b, c, b, d, c); }
  cap.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cap.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); cap.setIndex(I); cap.computeVertexNormals();
  const groundMesh = new THREE.Mesh(cap, new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.92, metalness: 0 })); groundMesh.receiveShadow = true; scene.add(groundMesh);

  // the rest of the planet (seen from altitude), clouds and the atmosphere rim
  const pt = planetTextures();
  const capTheta = Math.asin(RMAX * 0.92 / R);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 96, 0, Math.PI * 2, capTheta, Math.PI - capTheta), new THREE.MeshStandardMaterial({ map: pt.albedo, roughness: 0.95, metalness: 0 }));
  planet.position.set(0, -R, 0); scene.add(planet);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 128, 64), new THREE.MeshStandardMaterial({ map: pt.clouds, transparent: true, depthWrite: false, roughness: 1, opacity: 0.9 }));
  clouds.position.set(0, -R, 0); scene.add(clouds);
  const atmo = atmosphere(R * 1.035, sunDir.toArray(), 0x86aaff, 1.0); atmo.position.set(0, -R, 0); scene.add(atmo);

  // buildings: merged boxes with metric window UVs
  const fac = facadeTextures(5);
  const bmat = new THREE.MeshStandardMaterial({ map: fac.map, emissiveMap: fac.emi, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.6 });
  const geos = [], rng = K.rng(17);
  const roadDist = (x, z) => { let m = Infinity; for (let i = 0; i <= 200; i++) { const p = W.roadSpline.at(i / 200); m = Math.min(m, Math.hypot(p[0] - x, p[2] - z)); } return m; };
  const keepOut = [[0, 0, 24], [26, -26, 14], [-34, -38, 14], [64, -58, 12], [-13, -8, 8], [6, -4, 6]];
  const addB = (w, h, d, x, z) => { const g0 = buildingGeo(w, h, d, x, ground(x, z) - 0.5, z); g0.userData = { x, z, w, d }; geos.push(g0); };
  for (let i = 0; i < 1400; i++) {
    const a = rng() * Math.PI * 2, d0 = 22 + 900 * Math.pow(rng(), 0.75), x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    const far = Math.min(1, d0 / 700), w = (9 + rng() * 12) * (1 - 0.35 * far), d = (9 + rng() * 12) * (1 - 0.35 * far);
    const h = (6 + rng() * 20) * (1.5 - far) + (rng() < 0.06 * (1 - far) ? 25 + rng() * 25 : 0);
    if (roadDist(x, z) < Math.max(w, d) * 0.75 + 7) continue;
    if (keepOut.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + Math.max(w, d) * 0.6)) continue;
    if (W.weave.some(p => Math.hypot(p[0] - x, p[2] - z) < Math.max(w, d) * 0.7 + 4)) continue;
    if (Math.abs(z - W.ridge.crest[2] - 45 * Math.sin(x / 260) * Math.min(1, Math.abs(x) / 200)) < 60 + w) continue;
    if (geos.some(g0 => { const b = g0.userData; return Math.abs(b.x - x) < (b.w + w) / 2 + 3 && Math.abs(b.z - z) < (b.d + d) / 2 + 3; })) continue;
    addB(w, h, d, x, z);
  }
  addB(14, 72, 14, -34, -38); // the tower
  addB(12, 26, 18, 55, -60); addB(12, 30, 18, 73, -56); // the gap pair (gap at x = 64)
  // city lights for altitude: one point per building roof plus the street lamps (fade in above ~150 m)
  const lp = [], lc = [], lr = K.rng(23), col = new THREE.Color();
  for (const g0 of geos) { const b = g0.userData; if (!b) continue; const n = 1 + Math.floor(b.w * b.d / 90);
    for (let k = 0; k < n; k++) { const x = b.x + (lr() - 0.5) * b.w, z = b.z + (lr() - 0.5) * b.d; lp.push(x, ground(x, z) + 2, z); col.setHex(lr() < 0.85 ? SODIUM : 0xd8f0ff).multiplyScalar(0.6 + lr() * 0.6); lc.push(col.r, col.g, col.b); } }
  for (let s2 = 0; s2 < W.roadSpline.length; s2 += 9) { const p = W.roadSpline.at(s2 / W.roadSpline.length); lp.push(p[0], p[1] + 1, p[2]); col.setHex(SODIUM); lc.push(col.r, col.g, col.b); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  const cityLights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  scene.add(cityLights);
  const bmesh = new THREE.Mesh((await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries(geos), bmat); bmesh.castShadow = bmesh.receiveShadow = true; scene.add(bmesh);

  // the office: dark shell with one lit window at W.window (a hole the camera can pass through)
  const concrete = new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.9 }), inner = new THREE.MeshStandardMaterial({ color: 0x17140f, roughness: 0.95 });
  const box = (w, h, d, x, y, z, m = concrete, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  { const ox = 26, oz = -26, H = 20, y0 = ground(ox, oz), wx = W.window.point[0], wy = W.window.point[1] - y0, hw = 1.6, hh = 1.2, fz = oz + 6 - 0.15;
    box(16, 6, 12, ox, y0 + 3, oz); box(16, 0.3, 12, ox, y0 + H, oz); box(16, H, 0.3, ox, y0 + H / 2, oz - 6 + 0.15); box(0.3, H, 12, ox - 8 + 0.15, y0 + H / 2, oz); box(0.3, H, 12, ox + 8 - 0.15, y0 + H / 2, oz);
    box(16, wy - hh - 6, 0.3, ox, y0 + 6 + (wy - hh - 6) / 2, fz); box(16, H - wy - hh, 0.3, ox, y0 + wy + hh + (H - wy - hh) / 2, fz);
    box(wx - hw - (ox - 8), hh * 2, 0.3, (ox - 8 + wx - hw) / 2, y0 + wy, fz); box(ox + 8 - wx - hw, hh * 2, 0.3, (wx + hw + ox + 8) / 2, y0 + wy, fz);
    box(15.4, 0.2, 11.4, ox, y0 + 6.1, oz, inner); // upper floor
    const desk = box(2.2, 0.08, 1.0, W.window.inside[0], y0 + 6.95, W.window.inside[2], new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.6 }));
    box(0.08, 0.75, 0.9, desk.position.x - 1.0, y0 + 6.55, desk.position.z, inner); box(0.08, 0.75, 0.9, desk.position.x + 1.0, y0 + 6.55, desk.position.z, inner);
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 })); paper.rotation.x = -Math.PI / 2; paper.position.set(desk.position.x + 0.3, y0 + 7.0, desk.position.z); scene.add(paper);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(SODIUM).multiplyScalar(5) })); bulb.position.set(desk.position.x - 0.6, y0 + 7.45, desk.position.z - 0.2); scene.add(bulb);
    const lamp = new THREE.PointLight(SODIUM, 14, 12, 1.8); lamp.position.copy(bulb.position); scene.add(lamp);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hh * 2), new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0x6a3a14, emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.3 }));
    glass.position.set(wx, y0 + wy, fz + 0.05); scene.add(glass); officeGlass = glass;
  }
  // plaza: lighter paving, the container (hero), a pedestal with the object, a table with a document, a screen
  const paving = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ map: gridTex, color: 0x9a9a9a, roughness: 0.8 }));
  paving.rotation.x = -Math.PI / 2; paving.position.y = 0.02; paving.receiveShadow = true; scene.add(paving);
  const hero = K.container({ color: 0x8a2a1e }); hero.position.set(W.hero[0], W.plaza[1], W.hero[2]); hero.rotation.y = 0.35; hero.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(hero);
  box(0.6, 1.0, 0.6, W.object[0], W.object[1] - 0.62, W.object[2], new THREE.MeshStandardMaterial({ color: 0x2c2b29, roughness: 0.6 }));
  const obj = new THREE.Group(); obj.position.set(...W.object); scene.add(obj);
  box(0.26, 0.16, 0.18, 0, -0.04, 0, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.6 }), obj);
  box(0.2, 0.02, 0.13, 0, 0.05, 0, new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.3, metalness: 1 }), obj);
  box(1.2, 0.05, 0.8, W.doc.center[0], W.doc.center[1] - 0.04, W.doc.center[2], new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.6 }));
  const docTex = canvasTex(512, 366, (x, w, h) => { x.fillStyle = '#e9e2d2'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,40,40,.5)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(30, 40 + i * 34); x.lineTo(w - 30 - (i % 3) * 50, 40 + i * 34); x.lineWidth = 6; x.stroke(); }
    x.strokeStyle = '#e0241b'; x.lineWidth = 4; x.beginPath(); x.ellipse(w * 0.6, h * 0.45, 70, 34, -0.1, 0, Math.PI * 2); x.stroke(); });
  const doc = new THREE.Mesh(new THREE.PlaneGeometry(...W.doc.size), new THREE.MeshStandardMaterial({ map: docTex, roughness: 0.9 })); doc.rotation.x = -Math.PI / 2; doc.position.set(...W.doc.center); doc.position.y += 0.003; doc.receiveShadow = true; scene.add(doc);
  for (const lx of [-1, 1]) for (const lz of [-1, 1]) box(0.06, 0.88, 0.06, W.doc.center[0] + lx * 0.55, W.doc.center[1] - 0.48, W.doc.center[2] + lz * 0.35, inner);
  const scrTex = canvasTex(1024, 576, (x, w, h) => { x.fillStyle = '#05080c'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(140,190,255,.35)'; x.lineWidth = 1.5;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * w / 16, 0); x.lineTo(i * w / 16, h); x.stroke(); } for (let j = 0; j <= 9; j++) { x.beginPath(); x.moveTo(0, j * h / 9); x.lineTo(w, j * h / 9); x.stroke(); }
    x.fillStyle = 'rgba(150,200,255,.75)'; const r = K.rng(8); for (let i = 0; i < 260; i++) { x.globalAlpha = 0.2 + r() * 0.6; x.fillRect(r() * w, r() * h, 3, 3); } x.globalAlpha = 1; });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(...W.screen.size), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: scrTex, emissiveIntensity: 1.1 }));
  screen.position.set(...W.screen.point); scene.add(screen);
  box(W.screen.size[0] + 0.3, W.screen.size[1] + 0.3, 0.25, W.screen.point[0], W.screen.point[1], W.screen.point[2] - 0.15, new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.5, metalness: 0.5 }));
  box(0.3, W.screen.point[1] - W.screen.size[1] / 2, 0.3, W.screen.point[0], (W.screen.point[1] - W.screen.size[1] / 2) / 2, W.screen.point[2] - 0.3, inner);

  // road ribbon with a dashed centre line, sodium lamp heads and fake light pools
  const roadTex = canvasTex(128, 512, (x, w, h) => { x.fillStyle = '#151517'; x.fillRect(0, 0, w, h); const r = K.rng(2); for (let i = 0; i < 2000; i++) { const v = 18 + r() * 20; x.fillStyle = `rgba(${v},${v},${v},.5)`; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    x.fillStyle = 'rgba(210,200,170,.75)'; x.fillRect(w / 2 - 2, 0, 4, h * 0.45); x.fillStyle = 'rgba(200,200,200,.35)'; x.fillRect(4, 0, 3, h); x.fillRect(w - 7, 0, 3, h); });
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  const N = 600, RW = 9, rp = [], ru = [], ri = [];
  for (let i = 0; i <= N; i++) { const u = i / N, p = W.roadSpline.at(u), d = M.vec.flat(W.roadSpline.d1(u)), side = [-d[2], 0, d[0]];
    for (const s of [-1, 1]) { const x = p[0] + side[0] * s * RW / 2, z = p[2] + side[2] * s * RW / 2; rp.push(x, ground(x, z) + 0.03, z); ru.push((s + 1) / 2, u * W.roadSpline.length / 12); } }
  for (let i = 0; i < N; i++) { const a = i * 2; ri.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const roadMesh = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.55, metalness: 0.1 })); roadMesh.receiveShadow = true; scene.add(roadMesh);
  const poolTex = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,168,96,.32)'); g.addColorStop(1, 'rgba(255,168,96,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const poleM = new THREE.MeshStandardMaterial({ color: 0x0e0f11, roughness: 0.5, metalness: 0.6 }), headM = new THREE.MeshBasicMaterial({ color: new THREE.Color(SODIUM).multiplyScalar(4) });
  for (let s = 10; s < W.roadSpline.length; s += 34) { const u = s / W.roadSpline.length, p = W.roadSpline.at(u), d = M.vec.flat(W.roadSpline.d1(u)), side = [-d[2], 0, d[0]];
    const x = p[0] + side[0] * 6, z = p[2] + side[2] * 6, y = ground(x, z);
    box(0.14, 7, 0.14, x, y + 3.5, z, poleM); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.25), headM); hd.position.set(x - side[0] * 0.5, y + 6.95, z - side[2] * 0.5); scene.add(hd);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x - side[0] * 2, ground(x, z) + 0.06, z - side[2] * 2); scene.add(pool); }

  // the ridge to the south
  { const rgeo = new THREE.PlaneGeometry(2400, 160, 300, 40); rgeo.rotateX(-Math.PI / 2); const pa = rgeo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), bend = 45 * Math.sin(x / 260) * Math.min(1, Math.abs(x) / 200), z = pa.getZ(i) + W.ridge.crest[2] + 30 + bend, taper = Math.max(0, Math.min(1, (1150 - Math.abs(x)) / 500)), hgt = taper * taper * (3 - 2 * taper) * (17 * Math.exp(-Math.pow((z - bend - W.ridge.crest[2]) / 22, 2)) * (0.85 + 0.15 * Math.cos(x / 60)) + 2 * noise3(x / 30, 0, z / 30, 5));
      pa.setXYZ(i, x, ground(x, z) + hgt - 1.2 * taper - 0.6, z); }
    rgeo.computeVertexNormals(); const ridge = new THREE.Mesh(rgeo, new THREE.MeshStandardMaterial({ color: 0x23251f, roughness: 0.95 })); ridge.receiveShadow = ridge.castShadow = true; scene.add(ridge); }

  // the car: body + cabin, head and tail lights, one headlight spot (its motivated key on the road)
  const car = new THREE.Group(); scene.add(car);
  const paint = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.4, metalness: 0.35, envMapIntensity: 0.35 });
  box(4.4, 0.75, 1.9, 0, 0.0, 0, paint, car); box(2.3, 0.6, 1.7, -0.3, 0.65, 0, new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.15, metalness: 0.6, envMapIntensity: 0.4 }), car);
  const lightM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1d8).multiplyScalar(6) }), tailM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a10).multiplyScalar(3) });
  for (const s of [-0.65, 0.65]) { box(0.05, 0.14, 0.32, 2.21, 0.1, s, lightM, car); box(0.05, 0.12, 0.36, -2.21, 0.15, s, tailM, car); }
  for (const [x, z] of [[1.4, 0.95], [-1.4, 0.95], [1.4, -0.95], [-1.4, -0.95]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 })); wh.rotation.x = Math.PI / 2; wh.position.set(x, -0.38, z); car.add(wh); }
  const head = new THREE.SpotLight(0xfff1d8, 220, 60, 0.5, 0.6, 1.6); head.position.set(2.3, 0.1, 0); head.target.position.set(14, -1.2, 0); car.add(head, head.target);

  // the figure
  const matte = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.85, metalness: 0 });
  const fig = C.character('UAL', { clip: 'Walk_Loop', material: matte, phase: 0.3 }); fig.root.rotation.y = Math.PI / 2; scene.add(fig.root);

  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.05, 2000);
  const update = (tw) => {
    const cp = W.car(tw), hd = W.car.heading(tw); car.position.set(...cp); car.rotation.set(0, Math.atan2(-hd[2], hd[0]), 0); car.updateMatrixWorld(true);
    const k = Math.min(1, Math.max(0, (tw - W.figureStop + 0.9) / 1.2)); const ks = k * k * (3 - 2 * k);
    fig.blend([['Walk_Loop', tw, 1 - ks], ['Idle_Loop', tw - W.figureStop, ks]]); fig.root.position.set(...W.figure(tw));
  };
  return (worldCache = { scene, camera, update, sky: scene, cityLights, planetCenter: [0, -R, 0] });
}

// ---------------------------------------------------------------- GLOBE
let globeCache = null;
function buildGlobe(ctx) {
  if (globeCache) return globeCache;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010204);
  const pt = planetTextures(), Rg = W.globe.radius;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(Rg, 160, 80), new THREE.MeshStandardMaterial({ map: pt.albedo, roughness: 0.9, metalness: 0 })); scene.add(globe);
  const cl = new THREE.Mesh(new THREE.SphereGeometry(Rg * 1.008, 128, 64), new THREE.MeshStandardMaterial({ map: pt.clouds, transparent: true, depthWrite: false, opacity: 0.85 })); scene.add(cl);
  const sunDir = new THREE.Vector3(0.55, 0.6, 0.45).normalize();
  scene.add(atmosphere(Rg * 1.04, sunDir.toArray(), 0x86aaff, 1));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.8); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x2a3a52, 0.5));
  // graticule every 15 degrees (data/map read), faint
  const gm = new THREE.LineBasicMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.16 });
  for (let lat = -75; lat <= 75; lat += 15) { const pts = []; for (let lon = -180; lon <= 180; lon += 3) pts.push(new THREE.Vector3(...M.latLon(lat, lon, [0, 0, 0], Rg * 1.002))); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm)); }
  for (let lon = -180; lon < 180; lon += 15) { const pts = []; for (let lat = -90; lat <= 90; lat += 3) pts.push(new THREE.Vector3(...M.latLon(lat, lon, [0, 0, 0], Rg * 1.002))); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm)); }
  // red markers (annotation only): London, New York
  const red = new THREE.MeshBasicMaterial({ color: 0xe0241b });
  for (const [la, lo] of [[51.5, 0], [40.7, -74]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), red); m.position.set(...M.latLon(la, lo, [0, 0, 0], Rg * 1.004)); scene.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.17, 40), new THREE.MeshBasicMaterial({ color: 0xe0241b, side: THREE.DoubleSide })); ring.position.copy(m.position); ring.lookAt(0, 0, 0); scene.add(ring); }
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.01, 500);
  return (globeCache = { scene, camera, update() {} });
}

// ---------------------------------------------------------------- runtime
export default async function create(ctx) {
  const { renderer, shots, overlay } = ctx;
  await C.preload(renderer, { characters: ['UAL'], hdris: ['qwantani_dusk_2'] });
  const catalog = await (await fetch('/docs/shots/catalog.json')).json();
  const byId = Object.fromEntries(catalog.shots.map(s => [s.id, s]));
  const label = K.div(overlay, `left:4.2%;bottom:6%;font:500 .95em 'Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#d9d2c3;line-height:1.7;text-shadow:0 0 8px rgba(0,0,0,.6)`);
  const live = new Map();
  for (const s of shots) {
    const entry = byId[s.params.shot]; if (!entry) throw new Error(`[shot-lab] unknown catalog id ${s.params.shot}`);
    const move = new Function('M', 'W', `return (${entry.recipe});`)(M, W);
    const set = entry.lab === 'globe' ? buildGlobe(ctx) : await buildWorld(ctx);
    live.set(s.id, { entry, move, set, t0: s.params.t0 ?? entry.t0 ?? 0 });
  }
  return {
    frame({ shot, t }) {
      const L = live.get(shot.id), { set, move, entry } = L, tw = L.t0 + t;
      set.update(tw);
      const st = move.at(t, tw);
      if (entry.lab !== 'globe') {
        // altitude-aware clip planes, haze and sky: one scene works from 1 m to orbit
        const h = Math.max(0.5, M.vec.len(M.vec.sub(st.pos, set.planetCenter)) - R);
        // the office glass fades as the lens reaches it, so pushing through never pops the exposure
        if (officeGlass) { const gk = Math.min(1, Math.max(0, (M.vec.len(M.vec.sub(st.pos, W.window.point)) - 0.4) / 3.5)), gs = gk * gk * (3 - 2 * gk);
          officeGlass.material.opacity = 0.3 * gs; officeGlass.material.emissiveIntensity = 0.5 * gs; officeGlass.visible = gs > 0.001; }
        set.cityLights.material.opacity = Math.min(1, Math.max(0, (Math.log10(h) - 2.1) / 0.6)) * (1 - Math.min(1, Math.max(0, (Math.log10(h) - 4.6) / 0.6)));
        set.cityLights.material.size = (ctx.height / 1080) * (h < 3000 ? 2.6 : 2.0);
        set.scene.fog.density = 0.006 / (1 + Math.pow(h / 140, 2));
        set.scene.backgroundIntensity = 0.38 * Math.max(0, 1 - Math.log10(1 + h / 400) / 2.2);
        M.apply(set.camera, st, { near: Math.min(400, Math.max(0.05, h * 0.004)), far: Math.max(2500, (h + 600) * 8) });
      } else M.apply(set.camera, st);
      if (qs.get('label') !== '0') { label.innerHTML = `${entry.id} · ${entry.name}<br><span style="opacity:.6">${entry.lens} · ${move.dur.toFixed(1)} S</span>`; label.style.opacity = 1; }
      renderer.render(set.scene, set.camera);
    },
  };
}
