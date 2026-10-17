// PANAMA clay world: a stylised isthmus at true metre scale, for the cold-open oner and the bright aerials.
//   x east, y up, z south (north = -z). The Atlantic is north, the Pacific south, Gatun Lake (26 m) on top in the middle.
//   Pacific lock (the oner's): a 2-step Panamax flight (2 lanes, miter gates) from the sea (y 0) to the lake (y 26), its sea
//   gate at z = LOCK_S.z0, climbing north. Atlantic lock (Gatun-like): a 3-step flight, sea end at z = LOCK_N.z0, climbing south.
//   Macro terrain (180 x 140 km, 500 m cells) with a 40 m detail patch around the Pacific lock and the south of the lake.
// world(scene, o) -> { h(x, z), lake: 26, flightS, flightN, ocean, lakeMesh, section, clouds, rainFx, arrowsOut, ships, tick(t, camera) }
// tick() also manages near/far, fog and the shadow frustum from the camera's altitude, so one camera can go from 2 m to 80 km.
import * as THREE from 'three';
import * as CK from './clay-kit.js';

const { clamp, lerp, sstep, smoother, fbm, HOUSE, mat, BOX } = CK;
export const LAKE = 26;                   // Gatun Lake, 85 ft (RESEARCH §1a)
export const LOCK_S = { z0: 20000, x: 0 }; // Pacific flight: sea gate at z0, climbs toward -z
export const LOCK_N = { z0: -26200, x: 0 }; // Atlantic flight: sea gate at z0, climbs toward +z

// ---------------------------------------------------------------- the land
const g2 = (x, z, cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
const mid = (x) => 7000 * Math.sin(x / 42000) + 2500 * Math.sin(x / 15000 + 0.7) * (1 - Math.exp(-((x / 9000) ** 2)));
export function coastN(x) { const base = mid(x) - 30500 + 2300 * Math.sin(x / 17000 + 1) + 1100 * Math.sin(x / 5300 + 0.4); return lerp(base, LOCK_N.z0 - 160 - x * x / 5000, Math.exp(-((x / 2600) ** 2))); }
export function coastS(x) { const base = mid(x) + 25500 + 2400 * Math.sin(x / 15000 + 2.2) + 900 * Math.sin(x / 4100 + 1.3) - 3000 * Math.exp(-((x / 9000) ** 2)); return lerp(base, LOCK_S.z0 + 150 + x * x / 4000, Math.exp(-((x / 2400) ** 2))); }
// lake mask 0..1 (Gatun Lake + its southern arm to the Pacific flight + the arm north to the Atlantic flight)
export function lakeMask(x, z) {
  const n = (fbm(x / 6000, z / 6000, 31, 3) - 0.5) * 0.9;
  let m = Math.max(
    g2(x, z, -3500, -9000, 15000, 9500), g2(x, z, -12000, -2500, 9000, 6500), g2(x, z, 6000, -14000, 8000, 6500), g2(x, z, -9000, -17000, 9000, 5500),
    g2(x, z, 1500, 2500, 6000, 9000), g2(x, z, -800, 11000, 4200, 6200), g2(x, z, -1200, 15200, 4600, 3300), g2(x, z, 600, 17800, 2000, 1300));
  m = m * (1 + n) ;
  // the channels to both flights (narrow, exact)
  const armS = (z > 14000 && z < LOCK_S.z0 - 681 + 2) ? Math.exp(-((x / 240) ** 4)) : 0;
  const armN = (z < -20000 && z > LOCK_N.z0 + 1010 - 2) ? Math.exp(-((x / 260) ** 4)) : 0;
  return clamp(Math.max(m, armS * 1.2, armN * 1.2), 0, 1.5);
}
const LAKE_ON = 0.5;
export function height(x, z) {
  const dn = z - coastN(x), ds = coastS(x) - z, cd = Math.min(dn, ds);
  if (cd < 0) return Math.max(-70, -6 + cd * 0.004);                                   // sea bed
  const ridge = 1 - Math.abs(fbm(x / 11000, z / 11000, 7, 4) * 2 - 1);
  let hl = 2 + sstep(0, 2200, cd) * (26 + 210 * ridge * ridge + 60 * fbm(x / 2500, z / 2500, 3, 3));
  // the lake: shores rise above 26 m, the bed sits below; islands poke through
  const m = lakeMask(x, z);
  if (m > 0.25) {
    hl = Math.max(hl, lerp(hl, 30 + 40 * fbm(x / 1800, z / 1800, 5, 3), sstep(0.25, 0.42, m)));
    const isl = fbm(x / 1400, z / 1400, 11, 3), bed = LAKE - 4 - 14 * sstep(0.5, 0.75, m) + 26 * sstep(0.6, 0.78, isl) + 10 * sstep(0.7, 0.9, isl);
    hl = lerp(hl, bed, sstep(0.42, 0.56, m));
  }
  // flatten around the flights: aprons at the wall tops, the chamber footprints sunk out of the way
  for (const [L, dir, n, top0, top1] of [[LOCK_S, -1, 2, 16.5, 29.5], [LOCK_N, 1, 3, 12.2, 29.6]]) {
    const len = n === 2 ? 681.6 : 1010.4, u = (z - L.z0) * dir, ax = Math.abs(x - L.x);
    if (u > -400 && u < len + 60 && ax < 520) {
      const k = (1 - sstep(220, 520, ax)) * (1 - sstep(len + 20, len + 60, u)) * (1 - sstep(-400, -120, -u));
      const apron = u < len * (n === 2 ? 0.5 : 0.33) ? top0 : u < len * (n === 2 ? 1 : 0.66) ? lerp(top0, top1, n === 2 ? 1 : 0.5) : top1;
      hl = lerp(hl, u < 0 ? 4 : apron, k);
      if (ax < 75 && u > -2 && u < len + 1) hl = -30;                                    // the flight itself
      if (ax < 70 && u < 0) hl = -15;                                                    // approach from the sea
    }
  }
  return hl;
}
// colour by height / slope / place (sRGB hex)
const cJ = [new THREE.Color('#7fae6a'), new THREE.Color('#93bd79'), new THREE.Color('#6d9e5e'), new THREE.Color('#a7c88c')];
const DRY = new THREE.Color('#ead9b8'), SAND = new THREE.Color('#efe0bd'), MUD = new THREE.Color('#d8c7a4'), SHELF = new THREE.Color('#c6ebe2'), DEEP = new THREE.Color('#2f97a3'), LBED = new THREE.Color('#9fc7b0'), GRASS = new THREE.Color('#bcd39b'), CONC = new THREE.Color('#e3e0d8');
// colour by height / slope / place, with a baked hillshade from the sun (relief exaggerated E x so 300 m hills read from 60 km)
export function colorAt({ sunAz = 125, sunEl = 50, E = 7, lakeY = LAKE } = {}) {
  const L = CK.sunDir(sunEl, sunAz);
  return (x, z, y, slope, hx = 0, hz = 0) => {
    const c = new THREE.Color();
    if (y < 0) return c.copy(SHELF).lerp(DEEP, sstep(-3, -38, y));
    const m = lakeMask(x, z);
    if (m > 0.45 && y < lakeY - 0.3) return c.copy(LBED);
    if (m > 0.4 && y < LAKE + 0.4) return c.copy(DRY).lerp(MUD, sstep(lakeY, LAKE + 0.4, y) * 0.5);
    const nearLock = (Math.abs(x) < 400 && ((z > LOCK_S.z0 - 760 && z < LOCK_S.z0 + 200) || (z > LOCK_N.z0 - 200 && z < LOCK_N.z0 + 1100)));
    if (nearLock && y > 3) return c.copy(GRASS).lerp(CONC, 0.25);
    if (y < 2.2) return c.copy(SAND);
    if (m > 0.4 && y < LAKE + 1.2) return c.copy(MUD).lerp(GRASS, 0.4);
    const n = fbm(x / 900, z / 900, 2, 3), k = Math.floor(n * 3.99);
    c.copy(cJ[k]).lerp(cJ[(k + 1) % 4], (n * 4) % 1 * 0.5);
    if (slope > 0.35) c.lerp(new THREE.Color('#5f8f55'), 0.3);
    if (y > 180) c.lerp(new THREE.Color('#9db98a'), 0.3);
    const nx = -hx * E, nz = -hz * E, nl = Math.hypot(nx, 1, nz), sh = (nx * L.x + L.y + nz * L.z) / nl / L.y;
    return c.multiplyScalar(clamp(0.78 + 0.26 * sh, 0.62, 1.14));
  };
}

// ---------------------------------------------------------------- the section curtain (lake ABOVE both oceans)
// A vertical panel along x = 0 from the Atlantic to the Pacific, its profile exaggerated E times; it sweeps in (prog)
// and rises (rise). Water levels from RESEARCH §1a: Gatun 3 steps (85 ft), Pedro Miguel 1 (31 ft), Miraflores 2 (54 ft).
export function sectionCurtain({ z0 = -36000, z1 = 27000, E = 210, y0 = -2200, top = 8400 } = {}) {
  const W = 2048, Hh = 512, c = CK.canvas(W, Hh), g = c.g;
  const Y = (y) => Hh - (y * E - y0) / (top - y0) * Hh, X = (f) => f * W;
  const ft = (f) => f * 0.3048;
  // schematic, not to scale along the canal: the steps get room to read (the 3D panel spans the real coasts)
  const prof = [[0, 0], [0.13, 0], [0.13, ft(28)], [0.165, ft(28)], [0.165, ft(57)], [0.2, ft(57)], [0.2, ft(85)],
    [0.74, ft(85)], [0.74, ft(54)], [0.79, ft(54)], [0.79, ft(27)], [0.835, ft(27)], [0.835, 0], [1, 0]];
  const landTop = ft(85) + 9, bedLake = ft(85) - 13;
  // land (cream, strata below): from the Atlantic coast to the Pacific coast
  g.fillStyle = 'rgba(236,227,209,0.97)'; g.beginPath(); g.moveTo(X(0.1), Y(-6)); g.lineTo(X(0.125), Y(landTop)); g.lineTo(X(0.845), Y(landTop)); g.lineTo(X(0.87), Y(-6)); g.lineTo(X(0.87), Hh); g.lineTo(X(0.1), Hh); g.closePath(); g.fill();
  g.fillStyle = 'rgba(203,189,159,0.97)'; g.fillRect(X(0.1), Y(-9), X(0.77), Hh);
  g.fillStyle = 'rgba(176,138,98,0.97)'; g.fillRect(X(0.1), Y(-16), X(0.77), Hh);
  // water under the profile: oceans to the bottom beyond the coasts, the locks and the lake as channels in the land
  g.save(); g.beginPath(); g.moveTo(0, Hh); for (const [f, y] of prof) g.lineTo(X(f), Y(y)); g.lineTo(W, Hh); g.closePath(); g.clip();
  g.fillStyle = 'rgba(63,178,183,0.97)'; g.fillRect(0, 0, X(0.1) + 2, Hh); g.fillRect(X(0.87) - 2, 0, W, Hh);
  g.fillRect(X(0.1), 0, X(0.77), Y(-4)); g.fillStyle = 'rgba(52,160,170,0.97)'; g.fillRect(X(0.2), Y(ft(85)) + 2, X(0.54), Y(bedLake) - Y(ft(85)));
  g.restore();
  // sea level, dashed, right across: the lake sits 85 ft above it
  g.strokeStyle = '#0f1e33'; g.lineWidth = 5; g.setLineDash([26, 16]); g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke(); g.setLineDash([]);
  // the section line itself: bold white over navy, along the water surface
  g.lineJoin = 'round'; for (const [w, col] of [[14, '#0f1e33'], [6, '#ffffff']]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); prof.forEach(([f, y], i) => (i ? g.lineTo(X(f), Y(y)) : g.moveTo(X(f), Y(y)))); g.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const U = { map: { value: tex }, uProg: { value: 0 }, uRise: { value: 0 }, uOp: { value: 1 } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D map; uniform float uProg, uRise, uOp; varying vec2 vUv;
      void main() { if (vUv.x > uProg + .002) discard; vec2 uv = vec2(vUv.x, (vUv.y - (1. - uRise)) / max(uRise, 1e-3)); if (uv.y < 0.) discard;
        vec4 c = texture2D(map, uv);
        float edge = 1. - smoothstep(0., .004, uProg - vUv.x); c.rgb = mix(c.rgb, vec3(1., .84, .25), edge * step(uProg, .999)); c.a = max(c.a, edge * .95 * step(uProg, .999));
        gl_FragColor = vec4(c.rgb, c.a * uOp); }` });
  m.toneMapped = false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, top - y0).rotateY(-Math.PI / 2), m);
  mesh.position.set(0, (top + y0) / 2, (z0 + z1) / 2); mesh.renderOrder = 10; mesh.frustumCulled = false;
  mesh.set = (prog, rise, op = 1) => { U.uProg.value = prog; U.uRise.value = rise; U.uOp.value = op; mesh.visible = prog > 0.001 && rise > 0.001 && op > 0.001; };
  // anchor(f, y): a point on the panel at schematic fraction f (0 = Atlantic end), level y (m, unexaggerated)
  mesh.anchor = (f, y) => new THREE.Vector3(0, y * E, lerp(z0, z1, f)); mesh.E = E;
  mesh.set(0, 0);
  return mesh;
}

// ---------------------------------------------------------------- the world
export function world(scene, o = {}) {
  const grp = new THREE.Group(); scene.add(grp);
  const H = o.height ?? height;
  // macro terrain with a hole under the detail patch
  const PATCH = o.patch ?? { x0: -5200, x1: 5200, z0: 9000, z1: 22600 };
  const MID = { x0: -40000, x1: 30000, z0: -36000, z1: 32000 }, CELL = 250;
  const col = colorAt({ sunAz: o.sunAz ?? 125, sunEl: o.sunEl ?? 50, lakeY: o.lakeLevel ?? LAKE });
  const inBox = (B, m) => (x, z) => x > B.x0 + m && x < B.x1 - m && z > B.z0 + m && z < B.z1 - m;
  const far = CK.terrain({ w: 480000, d: 360000, nx: 320, nz: 240, cx: -5000, cz: -2000, height: H, color: col, hole: inBox(MID, 1500), rough: 0.95, skirt: 0 });
  far.top.castShadow = false; grp.add(far);
  const macro = CK.terrain({ w: MID.x1 - MID.x0, d: MID.z1 - MID.z0, nx: (MID.x1 - MID.x0) / CELL, nz: (MID.z1 - MID.z0) / CELL, cx: (MID.x0 + MID.x1) / 2, cz: (MID.z0 + MID.z1) / 2, height: H, color: col, hole: inBox(PATCH, CELL), rough: 0.95, skirt: 120 });
  macro.top.castShadow = false; grp.add(macro);
  const pw = PATCH.x1 - PATCH.x0, pd = PATCH.z1 - PATCH.z0;
  const patch = CK.terrain({ w: pw, d: pd, nx: Math.round(pw / 40), nz: Math.round(pd / 40), cx: (PATCH.x0 + PATCH.x1) / 2, cz: (PATCH.z0 + PATCH.z1) / 2, height: H, color: col, skirt: 60, rough: 0.95 });
  grp.add(patch);
  // water: the ocean (y 0) and the lake (y 26, masked to the lake)
  const oceanM = CK.water({ color: o.sea ?? '#2c9fa9', scale: 34, strength: 0.34, glint: 2.6, opacity: 0.8 });
  // pushed back in depth: the post chain's depth is coarse, and the ocean must never fight the chamber water at y = 0
  oceanM.polygonOffset = true; oceanM.polygonOffsetFactor = 2; oceanM.polygonOffsetUnits = 8;
  const ocean = CK.plane(900000, 900000, oceanM, { y: -0.4 }); grp.add(ocean);
  const LB = { x0: -32000, x1: 22000, z0: -27000, z1: 19400 };
  const mc = CK.canvas(1024, 1024), mg = mc.g, img = mg.createImageData(1024, 1024);
  for (let j = 0; j < 1024; j++) for (let i = 0; i < 1024; i++) { const x = lerp(LB.x0, LB.x1, (i + 0.5) / 1024), z = lerp(LB.z0, LB.z1, (j + 0.5) / 1024), v = lakeMask(x, z) > 0.4 ? 255 : 0, k = (j * 1024 + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255; }
  mg.putImageData(img, 0, 0);
  const maskTex = new THREE.CanvasTexture(mc); maskTex.colorSpace = THREE.NoColorSpace; maskTex.flipY = false;
  const lakeM = CK.water({ color: o.lakeColor ?? '#3aaeae', scale: 30, strength: 0.3, glint: 2.4 });
  lakeM.alphaMap = maskTex; lakeM.alphaTest = 0.5; lakeM.polygonOffset = true; lakeM.polygonOffsetFactor = 2; lakeM.polygonOffsetUnits = 8;
  const lakeGeo = new THREE.PlaneGeometry(LB.x1 - LB.x0, LB.z1 - LB.z0).rotateX(-Math.PI / 2);
  // plane uv after rotateX(-pi/2): u along +x, v along -z  -> flip v so the mask (row 0 = z0) lines up
  const uv = lakeGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  const lakeMesh = new THREE.Mesh(lakeGeo, lakeM); lakeMesh.position.set((LB.x0 + LB.x1) / 2, o.lakeLevel ?? LAKE, (LB.z0 + LB.z1) / 2); lakeMesh.receiveShadow = true; grp.add(lakeMesh);
  // the flights
  const flightS = CK.lockFlight({ n: 2, lanes: 2, lo: 0, hi: LAKE, depth: 12.8, gate: 'miter' });
  flightS.group.rotation.y = Math.PI / 2; flightS.group.position.set(LOCK_S.x, 0, LOCK_S.z0); grp.add(flightS.group);
  const flightN = CK.lockFlight({ n: 3, lanes: 2, lo: 0, hi: LAKE, depth: 12.8, gate: 'miter' });
  flightN.group.rotation.y = -Math.PI / 2; flightN.group.position.set(LOCK_N.x, 0, LOCK_N.z0); grp.add(flightN.group);
  for (const F of [flightN]) for (let i = 0; i < F.n; i++) for (let l = 0; l < 2; l++) F.setLevel(i, l, F.pool(i + (l + i) % 2));
  // jungle near the camera's path: trees on the patch above the lake / sea shores
  const tz = (x, z, y) => y > 3 && !(Math.abs(x) < 330 && z > LOCK_S.z0 - 760 && z < LOCK_S.z0 + 220) && lakeMask(x, z) < 0.5 && (y > LAKE + 1.5 || lakeMask(x, z) < 0.2) && z < coastS(x) - 60;
  const jungle = CK.scatter(o.trees ?? 9000, { x0: PATCH.x0 + 100, x1: PATCH.x1 - 100, z0: PATCH.z0 + 100, z1: PATCH.z1 - 100, height: H, ok: tz, seed: 17, s: [9, 20], tries: 3 });
  // a dense jungle belt along the lake shores (the 'jungle-shore' look), on top of the scattered trees
  const shore = CK.scatter(o.shoreTrees ?? 7000, { x0: PATCH.x0 + 100, x1: PATCH.x1 - 100, z0: PATCH.z0 + 100, z1: PATCH.z1 - 100, height: H, ok: (x, z, y) => tz(x, z, y) && lakeMask(x, z) > 0.22 && y > LAKE + 2, seed: 23, s: [10, 18], tries: 8 });
  const tr = CK.trees([...jungle, ...shore], { low: true, seed: 5, colors: ['#78a965', '#8dba74', '#6a9a5b', '#9cc483', '#84b26c'] }); tr.castShadow = true; grp.add(tr);
  // Panama City: white towers east of the Pacific entrance (macro detail)
  const city = [], r = CK.rng(8);
  for (let k = 0; k < 420; k++) { const x = 7000 + r() * 6500, z = coastS(x) - 300 - r() * 2600; const y = H(x, z); if (y < 3 || y > 60) continue; const tall = Math.exp(-(((x - 10500) / 1500) ** 2)) * (r() < 0.5 ? 1 : 0.4); city.push({ x, y, z, sx: 40 + r() * 50, sy: 20 + tall * 220 * r() + r() * 30, sz: 40 + r() * 50, c: r() < 0.08 ? '#dfe8ee' : '#f5f4f0' }); }
  grp.add(CK.instanced(BOX, mat('#ffffff', 0.8), city));
  // ships: anchored at both entrances, a few on the lake (pure in t through tick)
  const ships = [];
  const add = (kind, x, z, hd, o2 = {}) => { const s = CK.ship(kind, { seed: ships.length + 3, accent: null, ...o2 }); s.position.set(x, o2.y ?? 0, z); s.rotation.y = hd; grp.add(s); ships.push(s); return s; };
  const kinds = ['container', 'bulk', 'tanker', 'lpg', 'container', 'bulk'];
  if (o.anchored !== false) { for (let k = 0; k < 14; k++) { const a = r() * 6.28; add(kinds[k % 6], -2600 + r() * 7000, LOCK_S.z0 + 2600 + r() * 5200, a); }
  for (let k = 0; k < 10; k++) add(kinds[(k + 2) % 6], -3500 + r() * 7000, LOCK_N.z0 - 2400 - r() * 4800, r() * 6.28); }
  const LY = o.lakeLevel ?? LAKE;
  const lakeShips = o.lakeShips === false ? [] : [add('container', -900, 15200, Math.PI / 2 + 0.25, { y: LY }), add('bulk', 1300, 12400, -Math.PI / 2 - 0.4, { y: LY }), add('tanker', -1500, 9800, Math.PI / 2 + 0.6, { y: LY })];
  // spill arrows: water leaving the flights for the sea at both ends (macro scale)
  const arrowsOut = [CK.arrows([[0, 30, LOCK_S.z0 + 300], [200, 30, LOCK_S.z0 + 5000], [1500, 30, LOCK_S.z0 + 12000]], { count: 5, size: 1500, speed: 5000, color: '#ffffff' }),
    CK.arrows([[0, 30, LOCK_N.z0 - 300], [-200, 30, LOCK_N.z0 - 5000], [-1500, 30, LOCK_N.z0 - 12000]], { count: 5, size: 1500, speed: 5000, color: '#ffffff' })];
  arrowsOut.forEach(a => { a.visible = false; grp.add(a); });
  // section curtain
  const section = sectionCurtain(); grp.add(section);
  // rain: clay clouds over the watershed, a soft rain shaft under each, streaks
  const clouds = new THREE.Group(); grp.add(clouds); const cl = [];
  for (let k = 0; k < 22; k++) { const x = -24000 + r() * 40000, z = -21000 + r() * 34000, s = 2200 + r() * 1800; cl.push({ x, z, s, y: 4200 + r() * 900, ph: r() }); }
  const cloudIm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), mat('#ffffff', 0.95), cl.length * 3); cloudIm.castShadow = true; cloudIm.receiveShadow = false; clouds.add(cloudIm); cloudIm.frustumCulled = false;
  const shaftM = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying float vY; void main() { vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uOp; varying float vY; void main() { gl_FragColor = vec4(.80, .86, .92, uOp * (.10 + .32 * vY)); }` });
  const shaftGeo = new THREE.CylinderGeometry(0.62, 0.9, 1, 24, 1, true).translate(0, 0.5, 0);
  const shafts = cl.map(c => { const m = new THREE.Mesh(shaftGeo, shaftM); m.position.set(c.x + c.s * 0.4, 0, c.z); m.scale.set(c.s, c.y - 200, c.s); m.renderOrder = 4; clouds.add(m); return m; });
  const rainFx = CK.rain({ box: [-24000, 16000, 0, 4200, -21000, 13000], count: 22000, speed: 1700, len: 650, color: '#eef4fa', opacity: 0.65, wind: [140, 0], seed: 4 }); grp.add(rainFx);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sv = new THREE.Vector3();
  function setClouds(t, k) {
    clouds.visible = k > 0.001; if (!clouds.visible) return;
    let i = 0; for (const c of cl) for (let b = 0; b < 3; b++) {
      const kk = smoother(clamp(k * 1.6 - c.ph * 0.6)), sx = c.s * (1 - b * 0.22) * kk;
      V.set(c.x + b * c.s * 0.55 - 2500 * (1 - kk) + t * 40, c.y + b * 160, c.z + (b - 1) * c.s * 0.25); Sv.set(sx, sx * 0.5, sx * 0.8);
      M4.compose(V, Q, Sv.x > 1 ? Sv : Sv.setScalar(0.001)); cloudIm.setMatrixAt(i++, M4);
    }
    cloudIm.instanceMatrix.needsUpdate = true;
    shaftM.uniforms.uOp.value = sstep(0.5, 1, k);
    shafts.forEach((m, j) => { m.position.x = cl[j].x + cl[j].s * 0.4 + t * 40; });
  }
  setClouds(0, 0); rainFx.tick(0, 0);
  const api = {
    group: grp, h: H, lake: LAKE, flightS, flightN, ocean, lakeMesh, oceanM, lakeM, section, clouds, rainFx, arrowsOut, ships, lakeShips, setClouds, macro, patch, trees: tr,
    // per frame: water, near/far, fog, shadow frustum (sun = the set's DirectionalLight from CK.brightLight)
    tick(t, camera, sun) {
      oceanM.tick(t); lakeM.tick(t); flightS.tick(t); flightN.tick(t);
      { const a = Math.max(1, camera.position.y), g = 0.35 + (1 - sstep(400, 4000, a)) * 2.3; oceanM.U.uGlint.value = g; lakeM.U.uGlint.value = g; const rr = lerp(0.07, 0.42, sstep(600, 6000, a)); oceanM.roughness = lakeM.roughness = rr; }
      lakeShips.forEach((s, i) => { const v = 4.5, a = s.rotation.y; s.position.x += 0; s.userData.x0 ??= s.position.x; s.userData.z0 ??= s.position.z;
        s.position.x = s.userData.x0 + Math.cos(a) * v * t; s.position.z = s.userData.z0 - Math.sin(a) * v * t; });
      const alt = Math.max(1, camera.position.y - Math.max(0, H(camera.position.x, camera.position.z)));
      const la = Math.log10(alt);
      camera.near = clamp(alt * 0.2, 0.3, 600); camera.far = clamp(alt * 400, 30000, 700000); camera.updateProjectionMatrix();
      if (scene.fog) { const k = sstep(2.2, 4.8, la); scene.fog.near = lerp(2500, 70000, k); scene.fog.far = lerp(30000, 340000, k); }
      if (sun) {
        // shadow frustum follows the camera; its centre is snapped to whole shadow texels in light space (no shimmer)
        // and its size changes in octave steps (no constant re-scaling), so shadows hold still while the camera moves
        const d = new THREE.Vector3(); camera.getWorldDirection(d);
        const span = Math.pow(2, Math.ceil(Math.log2(clamp(alt * 3.2, 800, 70000)))), fwd = clamp(alt * 2.2, 250, 60000);
        const tgt = camera.position.clone().addScaledVector(new THREE.Vector3(d.x, 0, d.z).normalize(), fwd); tgt.y = 0;
        const L = sun.dir, R = new THREE.Vector3(0, 1, 0).cross(L).normalize(), U = L.clone().cross(R).normalize(), texel = 2 * span / sun.shadow.mapSize.x;
        const a = Math.round(tgt.dot(R) / texel) * texel, b = Math.round(tgt.dot(U) / texel) * texel, c = tgt.dot(L);
        tgt.copy(R).multiplyScalar(a).addScaledVector(U, b).addScaledVector(L, c);
        sun.track(tgt, span); if (sun.shadow.camera.far !== span * 8) { sun.shadow.camera.far = span * 8; sun.shadow.camera.updateProjectionMatrix(); }
      }
    },
  };
  return api;
}
