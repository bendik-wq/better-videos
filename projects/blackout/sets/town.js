// A winter town at night (Ivano-Frankivsk stand-in): Soviet panel blocks with lit windows, sodium street
// lamps with their pools on the snow, slush streets, falling snow, and the regional dispatch centre (a
// four-storey admin block whose second floor is the control room). Built for the cold-open oner (from
// 1 km down to a window) and city-dark (street level, under a flashlight). Light is power: every window and
// lamp belongs to a district, and uPow[d] (0..1) is the share of that district still lit; windows and lamps
// go out in a fixed hashed order as it falls, so a district dies window by window, block by block.
//
// Coordinates: metres, x east, y up, z south; the dispatch centre's front wall is on z = 0, centred on x = 0,
// facing +z. Everything is deterministic (seeded); update(t, state) is pure in its arguments.
import * as THREE from 'three';
import * as LW from './lw.js';

const { clamp, lerp, hash, rng } = LW;
export const NDIST = 12;
export const GRID = 112, STREET = 16, ANG = 0.21; // block pitch, street width, grid rotation (rad)
export const rot = (x, z, a = ANG) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];

const COMMON = /* glsl */`
uniform float uPow[${NDIST}]; uniform float uTime, uFogDen, uSnowGlow; uniform vec3 uFog, uMoon, uSodium;
uniform vec4 uFlashP; uniform vec4 uFlashD; uniform vec3 uFlashC; // flashlight: pos + range, dir + cos(cone), colour
float h1(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float powOf(float d) { int i = int(d + .5); float v = 1.; for (int k = 0; k < ${NDIST}; k++) if (k == i) v = uPow[k]; return v; }
vec3 flashlight(vec3 w, vec3 n) {
  if (uFlashP.w <= 0.) return vec3(0.);
  vec3 L = w - uFlashP.xyz; float d = length(L); vec3 l = L / max(d, 1e-3);
  float c = dot(l, uFlashD.xyz); float cone = smoothstep(uFlashD.w, mix(uFlashD.w, 1., .45), c);
  float hot = smoothstep(mix(uFlashD.w, 1., .55), 1., c) * .8;
  return uFlashC * (cone + hot) * max(dot(n, -l), 0.) * 9. / (1. + d * d * .35) * clamp(1. - d / uFlashP.w, 0., 1.);
}
vec3 fogIt(vec3 c, float dist) { float f = 1. - exp(-dist * uFogDen); return mix(c, uFog, f); }
`;

// panel-block facades: window grid lit by district power, snow on roofs and ledges
function buildingMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 aInfo; // district, seed, kind, -
      varying vec3 vW, vN, vO; varying vec4 vInfo; varying vec3 vScale;
      void main() {
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * (normal / (sc * sc))));
        vO = position * sc; vO.y += sc.y * .5; vScale = sc; vInfo = aInfo;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: COMMON + /* glsl */`
      varying vec3 vW, vN, vO; varying vec4 vInfo; varying vec3 vScale;
      void main() {
        vec3 n = normalize(vN); float dist = length(vW - cameraPosition);
        float pw = powOf(vInfo.x);
        vec3 col;
        if (n.y > .5) { // roof: snow, faintly lit by the town's own glow
          float g = .55 + .25 * h1(floor(vW.xz * .5));
          col = vec3(.8, .86, .95) * (uMoon * 1.4 + uSodium * .025 * uSnowGlow * pw) * g;
        } else {
          float u = abs(n.x) > .5 ? vO.z * sign(n.x) : vO.x * -sign(n.z);
          float side = abs(n.x) > .5 ? vScale.z : vScale.x;
          float fh = vInfo.z > .5 ? 3.0 : 2.75;            // storey height (older brick: 3.0 m)
          float wx = 3.2, cx = floor((u + side * .5) / wx), cy = floor(vO.y / fh);
          vec2 f = vec2(fract((u + side * .5) / wx), fract(vO.y / fh));
          // panel joints and grime
          float joint = smoothstep(.0, .02, f.x) * smoothstep(1., .98, f.x) * smoothstep(.0, .03, f.y);
          vec3 wall = mix(vec3(.11, .105, .1), vec3(.16, .15, .135), vInfo.z) * (.75 + .3 * h1(vec2(cx, cy) + vInfo.y)) * mix(.6, 1., joint);
          col = wall * (uMoon * 1.2 + uSodium * .06 * pw * smoothstep(26., 0., vO.y));
          // windows (not on the ground floor of shops; not at the edges)
          vec2 fw = fwidth(f) * 1.2;
          float inX = smoothstep(.2 - fw.x, .2 + fw.x, f.x) * smoothstep(.8 + fw.x, .8 - fw.x, f.x);
          float inY = smoothstep(.32 - fw.y, .32 + fw.y, f.y) * smoothstep(.86 + fw.y, .86 - fw.y, f.y);
          float win = inX * inY * step(.5, cy) * step(cx, floor(side / wx) - 1.) * step(1., cx + .001);
          float r = h1(vec2(cx * 1.7 + vInfo.y * 31., cy * 2.3 + dot(n, vec3(5., 0., 9.))));
          float lit = step(r, .48 * pw + .0001) * step(.001, pw);
          float k = h1(vec2(cy, cx) + vInfo.y * 7.);
          vec3 lamp = k < .72 ? vec3(1., .6, .28) * (1.1 + 1.1 * h1(vec2(cx, cy + 3.))) : k < .9 ? vec3(.9, .95, 1.) * 1.1 : vec3(.4, .6, 1.) * (.9 + .5 * sin(uTime * (3. + 7. * r) + r * 40.));
          // curtains: some windows glow through fabric, a few show a room's back wall
          lamp *= .45 + .55 * step(.35, h1(vec2(cx + 9., cy)));
          vec3 glass = vec3(.012, .016, .024) + uSodium * .01 * pw;
          col = mix(col, lit > .5 ? lamp : glass, win);
          // snow on the ledges under each window
          col = mix(col, vec3(.75, .8, .9) * uMoon * 2., inX * smoothstep(.27, .3, f.y) * smoothstep(.33, .3, f.y) * step(.5, cy));
        }
        col += flashlight(vW, n) * (n.y > .5 ? .9 : .5);
        gl_FragColor = vec4(fogIt(col, dist), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}

function groundMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: COMMON + /* glsl */`
      uniform float uGrid, uStreet, uAng; varying vec3 vW;
      float tn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + 1.), f.x), f.y); }
      void main() {
        float ca = cos(-uAng), sa = sin(-uAng); vec2 g = vec2(vW.x * ca - vW.z * sa, vW.x * sa + vW.z * ca);
        vec2 q = abs(mod(g + uGrid * .5, uGrid) - uGrid * .5);
        float road = 1. - smoothstep(uStreet * .5 - 1., uStreet * .5 + 1., min(q.x, q.y));
        float tracks = 0.; { float along = q.x < q.y ? q.x : q.y; tracks = smoothstep(.55, .0, abs(fract(along / 2.6) - .5) * 2.6) * road; }
        float n = tn(vW.xz * .35) * .5 + tn(vW.xz * 2.1) * .3 + tn(vW.xz * 9.) * .2;
        vec3 snow = vec3(.78, .84, .93) * (.85 + .2 * n);
        vec3 slush = vec3(.2, .2, .21) * (.7 + .5 * n);
        vec3 alb = mix(snow, slush, road * (.55 + .4 * tracks));
        vec3 col = alb * uMoon * 1.6;
        col += alb * flashlight(vW, vec3(0., 1., 0.)) * 1.4;
        float dist = length(vW - cameraPosition);
        gl_FragColor = vec4(fogIt(col, dist), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}

// sodium lamp pools on the snow (additive decals) and the lamp heads (sprites)
function poolMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec2 aLamp; varying vec2 vUv; varying float vP; varying vec3 vW; uniform float uPow[${NDIST}];
      float powOf(float d) { int i = int(d + .5); float v = 1.; for (int k = 0; k < ${NDIST}; k++) if (k == i) v = uPow[k]; return v; }
      void main() { vUv = uv; float pw = powOf(aLamp.x); vP = step(aLamp.y, pw * .999 + .0005) * step(.001, pw); vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform vec3 uSodium, uFog; uniform float uFogDen; varying vec2 vUv; varying float vP; varying vec3 vW;
      void main() { float d = length(vUv - .5) * 2.; float a = exp(-d * d * 3.2) * (1. - smoothstep(.85, 1., d)); float fog = exp(-length(vW - cameraPosition) * uFogDen);
        gl_FragColor = vec4(uSodium * a * vP * .22 * fog, 1.);
        #include <colorspace_fragment>
      }` });
}
function headMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: { ...U, uPx: { value: 1000 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec2 aLamp; uniform float uPx; uniform float uPow[${NDIST}]; varying float vP; varying float vFog; uniform float uFogDen;
      float powOf(float d) { int i = int(d + .5); float v = 1.; for (int k = 0; k < ${NDIST}; k++) if (k == i) v = uPow[k]; return v; }
      void main() { float pw = powOf(aLamp.x); vP = step(aLamp.y, pw * .999 + .0005) * step(.001, pw);
        vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float d = -mv.z; vFog = exp(-d * uFogDen * .6);
        gl_PointSize = clamp(1.4 * uPx / max(d, 1.), 2.2, 90.) * vP; }`,
    fragmentShader: `uniform vec3 uSodium; varying float vP; varying float vFog;
      void main() { vec2 q = gl_PointCoord - .5; float d = length(q) * 2.; float a = exp(-d * d * 7.) * 1.4 + exp(-d * 3.5) * .35; gl_FragColor = vec4(uSodium * a * vP * vFog * 1.6, 1.);
        #include <colorspace_fragment>
      }` });
}

// ---------------------------------------------------------------- the town
export function buildTown(scene, opts = {}) {
  const R = opts.radius ?? 1700, seed = opts.seed ?? 21, r = rng(seed);
  const U = { uPow: { value: new Array(NDIST).fill(1) }, uTime: { value: 0 }, uFogDen: { value: opts.fog ?? 0.0011 }, uSnowGlow: { value: 1 },
    uFog: { value: new THREE.Color(opts.fogColor ?? 0x0d1622) }, uMoon: { value: new THREE.Color(0x0a0f18).multiplyScalar(opts.moon ?? 1) }, uSodium: { value: new THREE.Color(0xffa24a) },
    uFlashP: { value: new THREE.Vector4(0, 0, 0, 0) }, uFlashD: { value: new THREE.Vector4(0, 0, -1, 0.9) }, uFlashC: { value: new THREE.Color(0xfff2dc) },
    uGrid: { value: GRID }, uStreet: { value: STREET }, uAng: { value: ANG } };
  const group = new THREE.Group(); scene.add(group);
  // districts: Voronoi seeds; district 0 is the dispatch centre's own block (it keeps power longest)
  const seeds = opts.seeds ? opts.seeds.slice(0, NDIST) : [[0, -60]]; if (!opts.seeds) for (let i = 1; i < NDIST; i++) { const a = i / (NDIST - 1) * Math.PI * 2 + r() * 0.4, d = 300 + r() * (R - 400); seeds.push([Math.cos(a) * d, Math.sin(a) * d]); }
  while (seeds.length < NDIST) seeds.push([1e6, 1e6]);
  const district = (x, z) => { let b = 0, bd = 1e18; seeds.forEach(([sx, sz], i) => { const d = (x - sx) ** 2 + (z - sz) ** 2 * (i === 0 && !opts.seeds ? 6 : 1); if (d < bd) { bd = d; b = i; } }); return b; };
  // ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30000, 64), groundMaterial(U)); ground.rotation.x = -Math.PI / 2; group.add(ground);
  // buildings: in each block (grid cell) 1-4 slabs; panel blocks outside the old centre, brick blocks inside
  const B = [];
  const reserve = opts.reserve ?? [[0, -8, 70]];
  const nCells = Math.ceil(R / GRID) + 1;
  for (let i = -nCells; i <= nCells; i++) for (let j = -nCells; j <= nCells; j++) {
    const [cx, cz] = rot(i * GRID, j * GRID); if (Math.hypot(cx, cz) > R) continue;
    const inner = GRID - STREET - 10, old = Math.hypot(cx, cz) < 520 ? 1 : 0;
    const layout = r(); const slabs = layout < 0.35 ? [[0, -0.28, 0.9, 0.22], [0, 0.28, 0.9, 0.22]] : layout < 0.6 ? [[-0.25, 0, 0.22, 0.85], [0.25, 0, 0.22, 0.85]] : layout < 0.8 ? [[0, -0.3, 0.9, 0.2], [-0.32, 0.18, 0.2, 0.55], [0.32, 0.18, 0.2, 0.55]] : [[0, 0, 0.32, 0.32]];
    for (const [ox, oz, sw, sd] of slabs) {
      if (r() < 0.12) continue;
      const [bx, bz] = rot(ox * inner, oz * inner); const x = cx + bx, z = cz + bz;
      if (reserve.some(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) < rr + 30)) continue;
      const floors = old ? 3 + Math.floor(r() * 2) : (r() < 0.6 ? 5 : r() < 0.85 ? 9 : 4);
      const tower = layout >= 0.8 && r() < 0.25;
      const h = (old ? 3.0 : 2.75) * (tower ? 16 : floors) + 1.2;
      B.push({ x, z, w: Math.max(12, sw * inner), d: Math.max(11, sd * inner), h, d0: district(x, z), seed: r() * 100, old });
    }
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  const bmesh = new THREE.InstancedMesh(box, buildingMaterial(U), B.length);
  const info = new Float32Array(B.length * 4); const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ANG);
  B.forEach((b, i) => { m.compose(new THREE.Vector3(b.x, b.h / 2, b.z), q, new THREE.Vector3(b.w, b.h, b.d)); bmesh.setMatrixAt(i, m); info.set([b.d0, b.seed, b.old, 0], i * 4); });
  bmesh.geometry = box.clone(); bmesh.geometry.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4)); bmesh.frustumCulled = false; group.add(bmesh);
  // lamps: along every street, 34 m apart, alternating sides
  const L = [];
  for (let i = -nCells; i <= nCells; i++) for (let s = -R; s <= R; s += 34) for (const ax of [0, 1]) {
    const side = (Math.floor(s / 34) % 2 ? 1 : -1) * (STREET * 0.5 + 1.2);
    const [x, z] = ax ? rot(i * GRID + GRID / 2 + side, s) : rot(s, i * GRID + GRID / 2 + side);
    if (Math.hypot(x, z) > R) continue; if (reserve.some(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) < rr * 0.5)) continue;
    L.push({ x, z, d0: district(x, z), k: hash(x, z, 'lamp') });
  }
  const lampAttr = new Float32Array(L.length * 2); L.forEach((l, i) => lampAttr.set([l.d0, l.k], i * 2));
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), poolMaterial(U), L.length);
  L.forEach((l, i) => { m.compose(new THREE.Vector3(l.x, 0.05, l.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), new THREE.Vector3(17 + 6 * l.k, 17 + 6 * l.k, 1)); pools.setMatrixAt(i, m); });
  pools.geometry.setAttribute('aLamp', new THREE.InstancedBufferAttribute(lampAttr, 2)); pools.frustumCulled = false; pools.renderOrder = 2; group.add(pools);
  const hp = new Float32Array(L.length * 3); L.forEach((l, i) => hp.set([l.x, 8.6, l.z], i * 3));
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3)); hg.setAttribute('aLamp', new THREE.BufferAttribute(lampAttr, 2));
  const heads = new THREE.Points(hg, headMaterial(U)); heads.frustumCulled = false; heads.renderOrder = 3; group.add(heads);
  // poles near the centre (the only ones the camera can resolve)
  const near = L.filter(l => Math.hypot(l.x, l.z) < (opts.poleRadius ?? 520));
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.6, metalness: 0.5 });
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.13, 8.8, 6), poleMat, near.length);
  near.forEach((l, i) => { m.compose(new THREE.Vector3(l.x, 4.4, l.z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m); }); group.add(poles);
  return { group, U, buildings: B, lamps: L, seeds, district, bmesh, heads,
    // state: { t, pow: [NDIST] or fn(d) -> 0..1, flash: { pos, dir, cos, range } | null, camera, height }
    update(t, st = {}) {
      U.uTime.value = t;
      for (let d = 0; d < NDIST; d++) U.uPow.value[d] = clamp(typeof st.pow === 'function' ? st.pow(d) : (st.pow?.[d] ?? 1));
      if (st.flash) { const f = st.flash; U.uFlashP.value.set(...f.pos, f.range ?? 40); const dd = new THREE.Vector3(...f.dir).normalize(); U.uFlashD.value.set(dd.x, dd.y, dd.z, f.cos ?? 0.93); }
      else U.uFlashP.value.w = 0;
      if (st.camera) heads.material.uniforms.uPx.value = (st.height ?? 1080) / (2 * Math.tan(st.camera.fov * Math.PI / 360));
    } };
}

// ---------------------------------------------------------------- the dispatch centre
// A four-storey 1970s admin block, 40 x 14 m, front on z = 0. Concrete panels, ribbon windows; floor 2 is the
// control room (its window row is real glass; the room itself comes from rooms.js buildRoom and sits at
// ROOM.origin). Other windows glow fluorescent green-white from behind (lit offices), some dark.
export const CENTRE = { w: 40, d: 14, floor: 3.9, storey: 3.5, floors: 4, winW: 1.9, winH: 1.65, sill: 0.95, pitch: 3.2, hero: -1.6 };
export function heroWindow() { const C = CENTRE; return { x: C.hero, y: C.floor + C.sill + C.winH / 2, z: 0, w: C.winW, h: C.winH }; }
export function buildCentre(scene, opts = {}) {
  const C = CENTRE, g = new THREE.Group(); scene.add(g);
  const tl = new THREE.TextureLoader();
  const conc = tl.load('/assets/pbr/concrete.a.jpg'); conc.wrapS = conc.wrapT = THREE.RepeatWrapping; conc.colorSpace = THREE.SRGBColorSpace; conc.repeat.set(4, 2);
  const concN = tl.load('/assets/pbr/concrete.n.jpg'); concN.wrapS = concN.wrapT = THREE.RepeatWrapping; concN.repeat.set(4, 2);
  const wallM = new THREE.MeshStandardMaterial({ color: 0x6c6f6c, map: conc, normalMap: concN, roughness: 0.92 });
  const snowM = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.85 });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x3a3e40, roughness: 0.5, metalness: 0.4 });
  const add = (w, h, d, x, y, z, mat = wallM) => { const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); mm.position.set(x, y, z); mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
  const H = C.floor + C.storey * (C.floors - 1) + 1.0;
  // back and sides (closed), roof slab with snow
  add(C.w, H, 0.3, 0, H / 2, -C.d); add(0.3, H, C.d, -C.w / 2, H / 2, -C.d / 2); add(0.3, H, C.d, C.w / 2, H / 2, -C.d / 2);
  add(C.w + 0.6, 0.35, C.d + 0.6, 0, H, -C.d / 2); add(C.w + 0.4, 0.28, C.d + 0.4, 0, H + 0.3, -C.d / 2, snowM);
  add(C.w + 0.6, 0.9, 0.3, 0, H + 0.6, 0.15); add(C.w + 0.6, 0.1, 0.42, 0, H + 1.1, 0.15, snowM); // parapet + snow
  // front: spandrels (horizontal bands) and piers between windows
  const levels = [0, ...Array.from({ length: C.floors - 1 }, (_, i) => C.floor + i * C.storey)];
  const nCols = Math.floor(C.w / C.pitch);
  const cols = Array.from({ length: nCols }, (_, i) => -C.w / 2 + C.pitch / 2 + i * C.pitch + (C.w - nCols * C.pitch) / 2);
  const heroCol = cols.reduce((b, x) => Math.abs(x - C.hero) < Math.abs(b - C.hero) ? x : b, cols[0]);
  C.hero = heroCol;
  const glowWins = [], glass = [];
  const backM = (lit, k) => new THREE.MeshBasicMaterial({ color: lit ? new THREE.Color(0xc8ffd9).multiplyScalar(0.9 + 0.5 * k) : new THREE.Color(0x05080a), toneMapped: true });
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x9fb7c4, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false });
  levels.forEach((y0, fi) => {
    const top = fi === levels.length - 1 ? H : levels[fi + 1];
    if (fi === 0) { add(C.w, C.floor, 0.3, 0, C.floor / 2, -0.15); return; } // ground floor: closed plinth with a door
    const ws = y0 + C.sill, we = ws + C.winH;
    add(C.w, ws - y0, 0.3, 0, (y0 + ws) / 2, -0.15); add(C.w, top - we, 0.3, 0, (we + top) / 2, -0.15);
    add(C.w, 0.06, 0.38, 0, ws - 0.03, 0.05, snowM); // sill snow line
    const xs = [-C.w / 2, ...cols.flatMap(x => [x - C.winW / 2, x + C.winW / 2]), C.w / 2];
    for (let i = 0; i < xs.length; i += 2) if (xs[i + 1] - xs[i] > 0.01) add(xs[i + 1] - xs[i], C.winH, 0.3, (xs[i] + xs[i + 1]) / 2, (ws + we) / 2, -0.15);
    for (const x of cols) {
      add(C.winW, 0.06, 0.12, x, ws + 0.03, -0.12, frameM); add(C.winW, 0.06, 0.12, x, we - 0.03, -0.12, frameM); if (!(fi === 1 && x === heroCol)) add(0.06, C.winH, 0.12, x, (ws + we) / 2, -0.12, frameM);
      const room = fi === 1 && Math.abs(x) < (opts.roomHalf ?? 8);
      if (!(fi === 1 && x === heroCol && opts.openHero)) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(C.winW, C.winH), glassM); gl.position.set(x, (ws + we) / 2, -0.1); gl.renderOrder = 5; g.add(gl); glass.push(gl); }
      if (!room) { const k = hash(x, fi, 'w'), lit = k < 0.55; const b = new THREE.Mesh(new THREE.PlaneGeometry(C.winW, C.winH), backM(lit, k)); b.position.set(x, (ws + we) / 2, -0.9); g.add(b); glowWins.push({ mesh: b, lit, k }); }
    }
  });
  // the entrance canopy and a sign
  add(6, 0.25, 2.2, 6, 3.0, 1.1, frameM); add(6.1, 0.12, 2.3, 6, 3.18, 1.1, snowM);
  return { group: g, glowWins, glass, heroX: heroCol, height: H,
    setPower(k) { for (const w of glowWins) w.mesh.material.color.setHex(w.lit && k > w.k * 0.9 ? 0xc8ffd9 : 0x05080a); } };
}
