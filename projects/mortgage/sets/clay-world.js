// MORTGAGE clay world: a bright clay suburb (instanced houses, lawns, roads, street trees, a park with a pond, cars),
// and the `suburb` set (aerial and low passes over it). Parameters: projects/mortgage/SETS.md.
//   x east, y up, z south; 1 unit = 1 m. Streets run along x every BLOCK_Z m and along z every BLOCK_X m; houses face the
//   street on their side of the block. The hero lot (the house on the auction block) sits at HERO (a cleared lot).
// suburbWorld(scene, o) -> { lots, hero, h(x, z) = 0, tick(t, camera), carsOn(n), bounds, groups }
//   o: { nx, nz (blocks), hero (true: clear the hero lot and return its frame), clear: [[x0, x1, z0, z1]], cars (count),
//        lite (low-poly houses for far shots), seed, park (true) }
import * as THREE from 'three';
import * as CK from '/projects/panama/sets/clay-kit.js';
import * as PR from './clay-props.js';

const { clamp, lerp, range, sstep, smoother, mat, rng, hash } = CK;
const { C } = PR;
export const BLOCK_X = 132, BLOCK_Z = 72, ROAD = 11, LOT_W = 19;
export const HERO = { x: 0, z: 0 };

// house variants (front faces +z): bungalow, two-storey, ranch with garage, cottage
const VARIANTS = [
  { w: 10, d: 8, h: 3.7, R: 3.1 }, { w: 9, d: 8, h: 6.4, R: 3.0, storeys: 2 }, { w: 13.5, d: 8.5, h: 3.4, R: 2.7, garage: true }, { w: 8.2, d: 7.2, h: 3.9, R: 3.6 },
];

export function suburbWorld(scene, o = {}) {
  const nx = o.nx ?? 7, nz = o.nz ?? 11, r = rng(o.seed ?? 11);
  const X0 = -nx * BLOCK_X / 2, Z0 = -nz * BLOCK_Z / 2, X1 = -X0, Z1 = -Z0;
  const root = new THREE.Group(); scene.add(root);
  const clear = [...(o.clear ?? [])];
  // the hero lot: the block whose south street runs at z = BLOCK_Z/2; lot centred on x = 0, house faces +z (south)
  const heroLot = { x: HERO.x, z: BLOCK_Z / 2 - ROAD / 2 - 15, ry: 0 };
  if (o.hero) clear.push([heroLot.x - 14, heroLot.x + 14, heroLot.z - 16, heroLot.z + 13]);
  const isClear = (x, z, m = 0) => clear.some(([a, b, c, d]) => x > a - m && x < b + m && z > c - m && z < d + m);
  // the park: one block (south-east of the hero) with a pond
  const parkB = o.park === false ? null : { bx: 1, bz: 1 };
  const inPark = (bx, bz) => parkB && bx === parkB.bx && bz === parkB.bz;
  const blockOf = (x, z) => [Math.floor((x - X0) / BLOCK_X) - Math.floor(nx / 2), Math.floor((z - Z0) / BLOCK_Z) - Math.floor(nz / 2)];

  // ---- ground: the paper void, the lawn plate, roads, sidewalks, lot lawns
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000).rotateX(-Math.PI / 2), mat(C.ground, 0.95)); paper.position.y = -0.6; paper.receiveShadow = true; root.add(paper);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 + 30, Z1 - Z0 + 30).rotateX(-Math.PI / 2), mat(C.lawn, 0.95)); lawn.position.y = -0.15; lawn.receiveShadow = true; root.add(lawn);
  const flat = [];
  // roads (asphalt in pale clay) with kerbs and sidewalks
  for (let k = 0; k <= nz; k++) { const z = Z0 + k * BLOCK_Z; flat.push({ x: 0, y: -0.1, z, sx: X1 - X0 + 30, sy: 0.16, sz: ROAD, c: C.road }); for (const s of [-1, 1]) flat.push({ x: 0, y: 0.03, z: z + s * (ROAD / 2 + 1.1), sx: X1 - X0 + 30, sy: 0.12, sz: 2.2, c: C.walk }); }
  for (let k = 0; k <= nx; k++) { const x = X0 + k * BLOCK_X; flat.push({ x, y: -0.1, z: 0, sx: ROAD, sy: 0.165, sz: Z1 - Z0 + 30, c: C.road }); for (const s of [-1, 1]) flat.push({ x: x + s * (ROAD / 2 + 1.1), y: 0.035, z: 0, sx: 2.2, sy: 0.12, sz: Z1 - Z0 + 30, c: C.walk }); }
  // lane dashes on the long streets
  for (let k = 0; k <= nz; k++) for (let x = X0 - 10; x < X1 + 10; x += 9) flat.push({ x, y: 0.0, z: Z0 + k * BLOCK_Z, sx: 3.2, sy: 0.1, sz: 0.25, c: '#f4f2ec' });
  // ---- lots and houses
  const lots = [], drive = [], hedge = [], treesA = [], carsP = [];
  const perRow = Math.floor((BLOCK_X - ROAD - 6) / LOT_W);
  for (let bx = 0; bx < nx; bx++) for (let bz = 0; bz < nz; bz++) {
    const xa = X0 + bx * BLOCK_X + ROAD / 2 + 3, za = Z0 + bz * BLOCK_Z + ROAD / 2 + 2.2, zb = Z0 + (bz + 1) * BLOCK_Z - ROAD / 2 - 2.2;
    const bxc = bx - Math.floor(nx / 2), bzc = bz - Math.floor(nz / 2);
    if (inPark(bxc, bzc)) { // park: lawn tint, pond, trees, paths
      const cx = X0 + (bx + 0.5) * BLOCK_X, cz = Z0 + (bz + 0.5) * BLOCK_Z;
      flat.push({ x: cx, y: 0.01, z: cz, sx: BLOCK_X - ROAD - 4, sy: 0.03, sz: BLOCK_Z - ROAD - 4.5, c: C.lawn3 });
      flat.push({ x: cx, y: 0.03, z: cz, sx: BLOCK_X - ROAD - 8, sy: 0.04, sz: 2.4, c: C.walk }, { x: cx - 30, y: 0.031, z: cz, sx: 2.4, sy: 0.04, sz: BLOCK_Z - ROAD - 8, c: C.walk });
      const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), CK.water({ color: '#58bfc0', scale: 14, strength: 0.25, glint: 1.4 }));
      pond.position.set(cx + 22, 0.09, cz + 4); pond.scale.set(24, 1, 13); pond.receiveShadow = true; root.add(pond); root.pond = pond;
      const rim = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), mat('#e9e2d2', 0.9)); rim.position.set(cx + 22, 0.07, cz + 4); rim.scale.set(26, 1, 15); root.add(rim);
      for (let i = 0; i < 26; i++) { const a = r() * 6.28, rr = 0.55 + r() * 0.45, x = cx + Math.cos(a) * (BLOCK_X / 2 - 14) * rr, z = cz + Math.sin(a) * (BLOCK_Z / 2 - 12) * rr; if (Math.hypot((x - cx - 22) / 28, (z - cz - 4) / 17) > 1 && !isClear(x, z, 4)) treesA.push({ x, y: 0, z, s: 2.2 + r() * 1.6 }); }
      continue;
    }
    for (const side of [0, 1]) for (let i = 0; i < perRow; i++) {
      const x = xa + LOT_W * (i + 0.5) + (BLOCK_X - ROAD - 6 - perRow * LOT_W) / 2, front = side ? zb : za, ry = side ? 0 : Math.PI, dir = side ? 1 : -1;
      const v = Math.floor(hash(bx, bz, side, i, 7) * VARIANTS.length), V = VARIANTS[v];
      const setback = 7 + hash(bx, bz, side, i, 2) * 2.5, hz = front - dir * (setback + V.d / 2);
      // alternate lot lawn tints (the patchwork)
      const lz0 = side ? (za + zb) / 2 : za, lz1 = side ? zb : (za + zb) / 2;
      if (isClear(x, hz, 2)) continue;
      flat.push({ x, y: 0.008, z: (lz0 + lz1) / 2, sx: LOT_W - 0.6, sy: 0.02, sz: lz1 - lz0 - 0.4, c: [C.lawn, C.lawn2, C.lawn3, '#b8d096'][Math.floor(hash(bx, bz, side, i, 3) * 4)] });
      const dx = x + (V.garage ? V.w * 0.2 : V.w / 2 + 2.2) * (side ? 1 : -1);
      drive.push({ x: dx, y: 0.04, z: front - dir * (setback / 2 + (V.garage ? 0 : 0)), sx: 3.4, sy: 0.05, sz: setback + (V.garage ? 0.4 : V.d), c: '#e4e1da' });
      if (!V.garage) drive.push({ x: dx, y: 0.04, z: front - dir * (setback + V.d / 2), sx: 3.4, sy: 0.05, sz: V.d, c: '#e4e1da' });
      lots.push({ x, z: hz, ry, v, w: V.w, d: V.d, h: V.h + V.R, eaveH: V.h, front, dir, drive: [dx, front - dir * (setback * 0.55)], block: [bx, bz], roof: C.roofs[Math.floor(hash(bx, bz, side, i, 5) * C.roofs.length)], wall: C.walls[Math.floor(hash(bx, bz, side, i, 6) * C.walls.length)] });
      if (hash(bx, bz, side, i, 9) < 0.55) carsP.push({ x: dx, z: front - dir * (setback * 0.45), ry: Math.PI / 2, c: ['#9fc4dd', '#f0b5a0', '#f6f4ef', '#b9a9ef', '#e8c66a', '#a9c79a'][Math.floor(hash(bx, bz, side, i, 10) * 6)] });
      // backyard tree and a street tree
      if (hash(bx, bz, side, i, 11) < 0.8) treesA.push({ x: x + (hash(bx, bz, side, i, 12) - 0.5) * 10, y: 0, z: hz - dir * (V.d / 2 + 6 + hash(bx, bz, side, i, 13) * 5), s: 1.8 + hash(bx, bz, side, i, 14) * 1.4 });
      if (i % 2 === 0) treesA.push({ x: x - LOT_W * 0.42, y: 0, z: front + dir * 0.1, s: 1.5 + hash(bx, bz, side, i, 15) * 0.6 });
      if (hash(bx, bz, side, i, 16) < 0.5) hedge.push({ x: x - dir * LOT_W * 0.2, y: 0, z: front - dir * 1.2, s: 0.9 });
    }
  }
  root.add(CK.instanced(CK.BOX, mat('#ffffff', 0.95), flat, { cast: false }));
  root.add(CK.instanced(CK.BOX, mat('#ffffff', 0.9), drive, { cast: false }));
  const heroX = heroLot.x;
  const treeItems = treesA.filter(t => !isClear(t.x, t.z, 3) && Math.abs(t.x - heroX) + Math.abs(t.z - heroLot.z) > 18);
  root.add(PR.trees(treeItems, { seed: 3, low: !!o.lowTrees }));
  if (hedge.length) root.add(PR.bushes(hedge.filter(b => !isClear(b.x, b.z, 2))));
  // houses: one body + one roof InstancedMesh per variant
  for (let v = 0; v < VARIANTS.length; v++) {
    const P = PR.houseParts({ ...VARIANTS[v], lite: true }), L = lots.filter(l => l.v === v);
    if (!L.length) continue;
    root.add(CK.instanced(P.body, PR.vmat(0.86), L.map(l => ({ x: l.x, y: 0, z: l.z, ry: l.ry, c: l.wall }))));
    root.add(CK.instanced(P.roof, PR.vmat(0.82), L.map(l => ({ x: l.x, y: 0, z: l.z, ry: l.ry, c: l.roof }))));
  }
  // cars: parked (static) + moving along the long streets (pure in t)
  const carG = PR.carGeo();
  root.add(CK.instanced(carG, PR.vmat(0.5), carsP.filter(c => !isClear(c.x, c.z, 2)).map(c => ({ x: c.x, y: 0.05, z: c.z, ry: c.ry, c: c.c }))));
  const nMove = o.cars ?? 14, movers = [];
  for (let i = 0; i < nMove; i++) { const k = Math.floor(hash(i, 21) * (nz + 1)), dir = hash(i, 22) < 0.5 ? 1 : -1; movers.push({ z: Z0 + k * BLOCK_Z + dir * 2.6, dir, ph: hash(i, 23), sp: 8 + hash(i, 24) * 4, c: ['#9fc4dd', '#f0b5a0', '#f6f4ef', '#b9a9ef', '#e8c66a'][i % 5] }); }
  const mov = new THREE.InstancedMesh(carG, PR.vmat(0.5), Math.max(1, nMove)); mov.castShadow = mov.receiveShadow = true; root.add(mov);
  movers.forEach((m, i) => mov.setColorAt(i, new THREE.Color(m.c)));
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  const span = X1 - X0 + 40;
  let active = nMove;
  const api = {
    root, lots, heroLot, bounds: { X0, X1, Z0, Z1 }, h: () => 0, isClear,
    carsOn(n) { active = clamp(n, 0, nMove); },
    tick(t) {
      root.pond?.material.tick?.(t);
      for (let i = 0; i < nMove; i++) {
        const m = movers[i]; if (i >= active) { M4.makeScale(0, 0, 0); mov.setMatrixAt(i, M4); continue; }
        const u = ((m.ph * span + t * m.sp * m.dir) % span + span) % span, x = X0 - 20 + u;
        Q.setFromAxisAngle(Y, m.dir > 0 ? 0 : Math.PI); M4.compose(V3.set(x, 0.05, m.z), Q, S1); mov.setMatrixAt(i, M4);
      }
      mov.instanceMatrix.needsUpdate = true;
    },
  };
  return api;
}

// ======================================================================== the `suburb` set
export default function makeClayWorld(H) {
  const { C: CINE, P, K } = H;
  const toS = (v, cam) => K.toScreen(v, cam);
  // views: [focus, dist, el°, az0°, az1°, mm, dist1 (×dist at the end), el1]
  const VIEWS = {
    wide: [[[0, 0, 0], 330, 34, -28, -14, 30, 0.9], [[-60, 3, 36], 90, 6.5, 89, 87, 28, 0.9, 7.5], [[20, 0, 0], 210, 62, 15, 28, 32, 1.25, 58]],
    forsale: [[[-30, 3, 16], 34, 13, -16, -6, 30, 0.92], [[-60, 3, 36], 80, 6, 89, 86, 30, 0.9], [[0, 2, 24], 80, 28, 20, 8, 32, 0.9]],
    locked: [[[0, 0, 10], 150, 36, -30, -18, 30, 0.88], [[-30, 0, 20], 120, 24, 60, 44, 28, 0.92], [[0, 0, 0], 240, 60, 10, 22, 32, 1.1, 55]],
    payment: [[[0, 0, 30], 100, 30, -34, -22, 30, 0.86], [[-20, 0, 36], 70, 18, 64, 50, 28, 0.92], [[0, 0, 20], 140, 46, 12, 24, 32, 0.95]],
    quiet: [[[-30, 3, 36], 70, 7, -84, -80, 32, 0.96], [[40, 0, 0], 260, 40, 160, 170, 30, 0.95], [[0, 3, 30], 48, 9, 14, 22, 35, 0.97]],
  };
  const orbit = (f, dist, el, az, mm) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return { pos: [f[0] + Math.sin(a) * Math.cos(e) * dist, f[1] + Math.sin(e) * dist, f[2] + Math.cos(a) * Math.cos(e) * dist], look: f, mm }; };
  async function suburb(ctx, shot) {
    const P0 = shot.params ?? {}, mode = P0.mode ?? 'wide', cv = clamp(P0.cam ?? 0, 0, 2) | 0;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 0.5, 9000);
    const v0 = (VIEWS[mode] ?? VIEWS.wide)[cv];
    const sun = CK.brightLight(scene, { target: v0[0], span: P0.span0 ?? Math.min(420, v0[1] * 1.3 + 40), fog: true, fogC: '#e4ecf1', near: P0.fogNear ?? (150 + v0[1] * 1.0), far: P0.fogFar ?? (900 + v0[1] * 3), mapSize: 4096, el: P0.sunEl ?? 42, az: P0.sunAz ?? 150, fill: 0.45, hemiI: 0.85, sunI: 3.4, bg: ['#94c1e8', '#e7eef3'] });
    const W = suburbWorld(scene, { hero: P0.hero ?? false, cars: mode === 'quiet' ? 3 : 16, seed: P0.seed ?? 11 });
    const layer = H.layerOf(ctx);
    // the hero house on its block (optional: hero: true)
    if (P0.hero) {
      const hb = PR.auctionBlock({ w: 15, d: 12, h: 1.8 }), hh = PR.house({ w: 10, d: 8, h: 4.2, R: 3.4 });
      hb.position.set(W.heroLot.x, 0, W.heroLot.z); hh.position.set(W.heroLot.x, 1.8, W.heroLot.z); scene.add(hb, hh);
    }
    // ---- mode props
    const kAt = H.cue(shot, P0.at, 0.8), kSpan = P0.span ?? Math.max(2, shot.duration * 0.55);
    const near = (l) => Math.hypot(l.x - v0[0][0], l.z - v0[0][2]);
    const signs = [], locks = [], pills = [];
    if (mode === 'forsale') {
      const pick = W.lots.filter(l => near(l) < (cv === 2 ? 110 : 90)).sort((a, b) => near(a) - near(b)).filter((l, i) => hash(l.x, l.z, 3) < 0.45).slice(0, P0.count ?? 5);
      pick.forEach((l, i) => { const s = PR.saleSign({ s: 2.2 }); s.position.set(l.x + (l.dir > 0 ? -1 : 1) * 4.2, 0, l.z + l.dir * (l.d / 2 + 4.2)); s.rotation.y = l.ry + (l.dir > 0 ? 0.35 : -0.35); scene.add(s); signs.push({ s, at: kAt + i * kSpan / Math.max(1, pick.length) * 0.6 }); });
    }
    if (mode === 'locked') {
      const pick = W.lots.filter(l => near(l) < 260 && hash(l.x, l.z, 17) < (P0.share ?? 0.5));
      const body = new THREE.InstancedMesh(PR.rbox(1.0, 0.8, 0.42, 0.14), mat(C.yellow, 0.45), pick.length), sh = new THREE.InstancedMesh(new THREE.TorusGeometry(0.32, 0.08, 8, 16, Math.PI), mat('#d5d8dc', 0.35), pick.length);
      body.castShadow = sh.castShadow = true; scene.add(body, sh);
      const face = PR.textPlane('<4%', { w: 0.9, h: 0.52, fg: C.ink, size: 0.82, res: 128 });
      const faces = new THREE.InstancedMesh(face.geometry, face.material, pick.length); scene.add(faces);
      pick.forEach((l, i) => locks.push({ l, at: kAt + (hash(l.x, l.z, 19)) * kSpan }));
      locks.body = body; locks.sh = sh; locks.faces = faces;
    }
    if (mode === 'payment') {
      const texts = P0.payments ?? ['$2,770/mo', '$2,468 → $2,770', '+$302/mo', '$2,770/mo', '+$300/mo'];
      const pick = W.lots.filter(l => near(l) < 90 && l.dir > 0).sort((a, b) => near(a) - near(b)).filter((_, i) => i % 2 === 0).slice(0, P0.count ?? 4);
      pick.forEach((l, i) => pills.push({ l, el: H.pill(layer, texts[i % texts.length], { size: 30 }), at: kAt + i * 0.45 }));
    }
    // ---- camera
    const [f, dist, el, az0, az1, mm, d1 = 1, el1 = el] = v0;
    const keys = P0.camera ?? [orbit(f, dist, el, az0, mm), orbit(f, dist * (1 + (d1 - 1) * 0.5), lerp(el, el1, 0.5), (az0 + az1) / 2, mm), orbit(f, dist * d1, el1, az1, mm)];
    const cam = CINE.path(keys, { duration: shot.duration, float: 0, accel: 0.3, decel: 0.3 });
    const fx = P.post(ctx, scene, camera, { ao: { radius: clamp(dist * 0.035, 1.5, 7), intensity: 2.2, falloff: 1 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    const cap = H.caption(layer, P0.caption ?? ({ locked: 'ABOUT HALF OF MORTGAGES · BELOW 4%', forsale: P0.caption, payment: P0.caption })[mode] ?? null);
    const src = H.sourceLine(layer, P0.source ?? (mode === 'locked' ? 'SOURCE: FHFA NATIONAL MORTGAGE DATABASE' : null));
    const ctr = mode === 'locked' && P0.counter !== false ? H.pill(layer, '', { size: 30, dot: C.gold }) : null;
    const v = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), E = new THREE.Euler();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); W.tick(t);
      if (fx.ao) fx.ao.configuration.aoRadius = clamp(camera.position.y * 0.03, 1.2, 7);
      sun.track(v.set(camera.position.x * 0.35 + f[0] * 0.65, 0, camera.position.z * 0.35 + f[2] * 0.65));
      for (const { s, at } of signs) { const k = CK.outCubic(range(t, at, at + 0.5)), b = 1 + 0.15 * Math.sin(Math.PI * clamp((t - at) / 0.5)); s.scale.setScalar(2.2 * Math.max(1e-3, k) * b); }
      if (locks.length) {
        let shown = 0;
        locks.forEach(({ l, at }, i) => {
          const k = range(t, at, at + 0.45), s = k <= 0 ? 1e-4 : CK.outCubic(k) * (1 + 0.25 * Math.sin(Math.PI * k)) * (P0.lockSize ?? 4.2), y = l.h + 2.2 + 0.25 * Math.sin(t * 1.6 + i);
          if (k > 0.5) shown++;
          Q.setFromEuler(E.set(0, Math.atan2(camera.position.x - l.x, camera.position.z - l.z), 0));
          M4.compose(v.set(l.x, y, l.z), Q, S.set(s, s, s)); locks.body.setMatrixAt(i, M4);
          M4.compose(v.set(l.x, y + 0.8 * s, l.z), Q, S.set(s, s, s)); locks.sh.setMatrixAt(i, M4);
          const off = new THREE.Vector3(0, 0.4 * s, 0.215 * s + 0.01).applyQuaternion(Q);
          M4.compose(v.set(l.x, y, l.z).add(off), Q, S.set(s, s, s)); locks.faces.setMatrixAt(i, M4);
        });
        locks.body.instanceMatrix.needsUpdate = locks.sh.instanceMatrix.needsUpdate = locks.faces.instanceMatrix.needsUpdate = true;
        if (ctr) { ctr.innerHTML = `LOCKED BELOW 4% &nbsp;<b>${Math.round(100 * shown / Math.max(1, locks.length / (P0.share ?? 0.5)))}%</b>`; ctr.at(960, 1000, sstep(kAt, kAt + 0.4, t)); }
      }
      for (const { l, el, at } of pills) { const [x, y] = toS(v.set(l.x, l.h + 3, l.z), camera); el.at(x, y, sstep(at, at + 0.35, t)); }
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }
  return { suburb };
}
