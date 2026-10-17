// PANAMA clay sets, locks: lock, pools, expansion, hourglass. Parameters: projects/panama/SETS.md.
// Real proportions (RESEARCH.md §1a, §9): Panamax chamber 304.8 x 33.53 m (1000 x 110 ft), built in pairs; 13 m below the
// lower pool; Gatun steps 8.7 m (28 ft); miter-gate leaves 19.5 m wide x 2.13 m thick (64 x 7 ft), up to 25 m (82 ft);
// culverts 5.5 m (18 ft); 20 cross culverts and 100 floor holes per chamber. Neopanamax: 427 x 55 x 18.3 m, rolling gates,
// 3 water-saving basins per chamber recycling 60 %.
import * as THREE from 'three';
import * as CK from './clay-kit.js';

const { clamp, lerp, range, sstep, smoother, HOUSE, mat, BOX } = CK;
const FT = 0.3048;

export default function makeClayLocks(H) {
  const { C, P, K } = H;
  const S = () => window.innerHeight / 1080;
  // window k(t): 0 before `at`, eased to 1 over `span` (at: a word, a word+offset or seconds)
  const win = (shot, at, span, defAt, defSpan) => { const a = H.cue(shot, at, defAt), b = span ?? defSpan; return (t) => smoother(range(t, a, a + b)); };
  const post = (ctx, scene, camera, o = {}) => P.post(ctx, scene, camera, { ao: { radius: o.aoR ?? 8, intensity: o.aoI ?? 2.4, falloff: 1 }, tone: 'neutral', quality: o.q ?? 'medium', ...(o.dof ? { dof: o.dof } : {}) });
  const rig = (shot, keys, o = {}) => C.path(keys, { duration: shot.duration, float: 0, ...o });
  const toScreen = (v, cam) => K.toScreen(v.isVector3 ? v : new THREE.Vector3(...v), cam);
  const S_ = () => window.innerHeight / 1080;

  // section-material for the cut faces of water bodies (the front of a diorama's sea or lake)
  const waterSide = () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#6fc0bd'), roughness: 0.25, transparent: true, opacity: 0.8, depthWrite: false });
  // a water box: top = animated water, sides = cut section
  function waterBox(wm, { x0, x1, z0, z1, y0, y1 }) {
    const side = waterSide(), m = new THREE.Mesh(BOX, [side, side, wm, side, side, side]);
    m.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2); m.scale.set(x1 - x0, y1 - y0, z1 - z0); m.receiveShadow = true;
    m.setTop = (y) => { m.scale.y = Math.max(0.05, y - y0); }; return m;
  }

  // ======================================================================== lock: the cut-away chamber diorama
  // A two-step Panamax flight (sea pool -> chamber 0 -> chamber 1 -> lake pool), lanes in pairs, on a strata block.
  async function lock(ctx, shot) {
    const P0 = shot.params ?? {}, mode = P0.mode ?? 'fill';
    const { scene, camera, layer, sun } = H.base(ctx, { target: [340, 0, 0], span: 640, fog: false, bg: ['#c9dbe8', '#eef2f4'], mapSize: 4096, az: P0.sunAz ?? 112, el: P0.sunEl ?? 40 });
    scene.add(CK.catcher(-60));
    const xr = mode === 'culverts', ghostM = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, transparent: true, opacity: 0.22, depthWrite: false });
    const F = CK.lockFlight({ n: 2, lanes: 2, lo: 0, hi: 17.4, depth: 12.8, gate: 'miter', Lc: 304.8, Wc: 33.53, wall: 16, mid: 18, ...(xr ? { wallMat: ghostM('#eef3f5'), floorMat: ghostM('#e3e8ea') } : {}) });
    scene.add(F.group);
    const L = F.length, Z0 = -F.totalW / 2, BASE = -42;
    const wm = CK.water({ scale: 30 });
    // ground blocks either side of the flight (stepping up with the chambers) and the base under it
    const g = new THREE.Group(); scene.add(g);
    const side = 70, front = xr ? 0.01 : 26;
    const strata = [[1.2, '#b9cd95'], [5, HOUSE.strata[0]], [10, HOUSE.strata[1]], [14, HOUSE.strata[2]], [1e9, HOUSE.strata[3]]];
    const piece = (x0, x1, z0, z1, top) => z1 - z0 < 0.1 ? null : g.add(CK.slab({ w: x1 - x0, d: z1 - z0, x: (x0 + x1) / 2, z: (z0 + z1) / 2, y0: BASE, y1: top, top: HOUSE.park, strata }));
    const xMid = F.chamberX(1)[0] - F.GG / 2;
    piece(0, xMid, Z0 - side, Z0, F.wallTop(0)); piece(xMid, L, Z0 - side, Z0, F.wallTop(1));
    piece(0, xMid, -Z0, -Z0 + front, F.wallTop(0)); piece(xMid, L, -Z0, -Z0 + front, F.wallTop(1));
    for (let i = 0; i < 2; i++) { const [a, b] = F.chamberX(i); g.add(CK.slab({ w: b - a + F.GG * 2, d: F.totalW, x: (a + b) / 2, z: 0, y0: BASE, y1: F.floorY(i) - (xr ? 4.5 : 2.01), top: '#cfcac0', strata })); }
    // the sea (low end) and the lake (high end), with sea bed / lake bed blocks
    const SEA = 220, LAKE = 220;
    piece(-SEA, 0, Z0 - side, -Z0 + front, -14); piece(L, L + LAKE, Z0 - side, -Z0 + front, 17.4 - 14);
    const sea = waterBox(wm, { x0: -SEA, x1: 0, z0: Z0 - side, z1: -Z0 + front, y0: -14, y1: 0 }), lake = waterBox(wm, { x0: L, x1: L + LAKE, z0: Z0 - side, z1: -Z0 + front, y0: 3.4, y1: 17.4 });
    scene.add(sea, lake);
    // trees and the control house on the centre-wall end, lamp posts along the walls
    const tr = CK.scatter(70, { x0: 10, x1: L - 10, z0: Z0 - side + 6, z1: Z0 - 8, height: (x) => (x < xMid ? F.wallTop(0) : F.wallTop(1)) + 0.6, seed: 9, s: [4, 8] });
    g.add(CK.trees(tr));
    const ctl = new THREE.Group(); ctl.add(CK.instanced(BOX, mat('#f7f5f0', 0.8), [{ x: 0, y: 0, z: 0, sx: 30, sy: 9, sz: 14 }, { x: 0, y: 9, z: 0, sx: 12, sy: 7, sz: 10 }]));
    ctl.position.set(xMid, F.wallTop(1), 0); scene.add(ctl);
    const posts = []; for (let x = 20; x < L; x += 30) for (const z of [Z0 + 3, -Z0 - 3, 0]) posts.push({ x, y: x < xMid ? F.wallTop(0) : F.wallTop(1), z, sx: 0.5, sy: 9, sz: 0.5 });
    scene.add(CK.instanced(BOX, mat('#e6e6e2', 0.6), posts));
    // ships: the hero in the near lane (z+), a second one in the far lane going the other way
    const hero = CK.ship(P0.ship ?? 'lpg', { seed: 3 }), other = CK.ship('container', { seed: 5, accent: null });
    scene.add(hero, other);
    const zN = F.laneZ(1), zF = F.laneZ(0);
    // mules: 4 per ship (2 each side, fore and aft), on rails along the wall tops; cables to the ship
    const mules = [], cables = [];
    const railM = mat('#7f8a92', 0.5), rails = [];
    for (const z of [Z0 + 4, Z0 + F.wall - 4, -Z0 - 4, -Z0 - F.wall + 4, -F.mid / 2 + 4, F.mid / 2 - 4]) for (let i = 0; i < 2; i++) { const [a, b] = F.chamberX(i); rails.push({ x: (a + b) / 2, y: F.wallTop(i), z, sx: b - a + F.GG, sy: 0.25, sz: 1.6 }); }
    scene.add(CK.instanced(BOX, railM, rails, { cast: false }));
    if (mode === 'mules' || P0.mules) for (const [z, sd] of [[-Z0 - F.wall / 2, 1], [F.mid / 4, -1]]) for (const fwd of [1, -1]) {
      const m = CK.mule(); scene.add(m); mules.push({ m, z, sd, fwd });
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 6), mat('#3a3f44', 0.6)); scene.add(c); cables.push(c);
    }
    // swimmer: Halliburton, 1928. A tiny figure alone in an empty chamber (red cap: the one accent)
    let swimmer = null;
    if (mode === 'swimmer') {
      hero.visible = other.visible = false;
      swimmer = new THREE.Group();
      const skin = mat('#e9c7a8', 0.7), cap = mat(HOUSE.red, 0.5);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.2, 4, 10).rotateZ(Math.PI / 2), skin); body.position.y = -0.05; swimmer.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), cap); head.position.set(0.82, 0.06, 0); swimmer.add(head);
      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.6, 3, 6), skin), armR = armL.clone(); swimmer.add(armL, armR);
      swimmer.arms = [armL, armR];
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }));
      swimmer.ripples = [0, 1, 2].map(() => { const r = ripple.clone(); r.material = ripple.material.clone(); scene.add(r); return r; });
      const wake = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); swimmer.wake = wake; scene.add(wake);
      scene.add(swimmer);
    }
    // culvert x-ray: the wall culverts (5.5 m) along each wall, 20 cross culverts under the floor, 100 holes; flow arrows
    const xray = new THREE.Group(); xray.visible = mode === 'culverts'; scene.add(xray);
    const cyanM = new THREE.MeshBasicMaterial({ color: '#3fb8ff', transparent: true, opacity: 0.55, depthWrite: false });
    const cyanS = new THREE.MeshStandardMaterial({ color: '#7fd3ff', roughness: 0.4, emissive: '#3fb8ff', emissiveIntensity: 0.35, transparent: true, opacity: 0.85 });
    const culvR = 18 * FT / 2, wallZs = [Z0 + F.wall / 2, 0, -Z0 - F.wall / 2];
    const flowPaths = [];
    for (const z of wallZs) {
      const pts = [[-10, F.floorY(0) + 3, z], [F.chamberX(0)[1], F.floorY(0) + 3, z], [F.chamberX(1)[0], F.floorY(1) + 3, z], [L + 10, F.floorY(1) + 3, z]];
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.1);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, culvR, 16), cyanS); xray.add(tube);
      flowPaths.push(pts);
    }
    for (let i = 0; i < 2; i++) for (let l = 0; l < 2; l++) { const [a, b] = F.chamberX(i);
      for (let k = 0; k < 10; k++) { const x = lerp(a + 20, b - 20, k / 9), lat = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, F.Wc, 10).rotateX(Math.PI / 2), cyanS); lat.position.set(x, F.floorY(i) - 1.2, F.laneZ(l)); xray.add(lat);
        for (let h = 0; h < 5; h++) { const hole = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14).rotateX(-Math.PI / 2), mat('#20506a', 0.6)); hole.position.set(x, F.floorY(i) + 0.02, F.laneZ(l) + (h - 2) * 6); xray.add(hole); } } }
    // the near wall and near ground go x-ray (pale, translucent) in culvert mode
    const flow = []; // arrows: fill = lake -> culverts -> up through the floor; drain = chamber -> culverts -> sea
    const fillDir = mode !== 'drain';
    for (const pts of flowPaths) { const p2 = fillDir ? [...pts].reverse() : pts; const a = CK.arrows(p2.map(p => [p[0], p[1] + culvR + 0.4, p[2]]), { count: 18, size: 4.2, speed: 22, color: '#ffffff' }); a.visible = mode === 'culverts'; scene.add(a); flow.push(a); }
    const spill = CK.arrows([[-4, 0.3, zN], [-60, 0.3, zN + 8], [-160, 0.3, zN + 30]], { count: 10, size: 7, speed: 16, color: '#ffffff' }); spill.visible = mode === 'drain'; scene.add(spill);
    const upArrows = []; if (mode === 'culverts') for (let k = 0; k < 6; k++) { const x = lerp(F.chamberX(0)[0] + 40, F.chamberX(0)[1] - 40, k / 5); const a = CK.arrows([[x, F.floorY(0) + 0.5, zN], [x, F.floorY(0) + 6, zN]], { count: 2, size: 3.0, speed: 3, vertical: true }); scene.add(a); upArrows.push(a); }

    // ---- timing
    const kRise = win(shot, P0.at, P0.span, 1.0, Math.max(4, shot.duration - 3));
    const kGate = win(shot, P0.gateAt, P0.gateSpan, 1.0, 3.5);
    // ---- camera: a slow 3/4 orbit; mode-specific framing
    const c0 = F.chamberX(0), midX = (c0[0] + c0[1]) / 2;
    const views = {
      fill: [{ pos: [midX - 210, 120, 250], look: [midX + 20, 0, 10], mm: 32 }, { pos: [midX - 150, 112, 275], look: [midX + 40, 2, 10], mm: 32 }],
      wide: [{ pos: [midX - 330, 210, 420], look: [midX + 60, 0, 10], mm: 32 }, { pos: [midX - 250, 190, 455], look: [midX + 80, 2, 10], mm: 32 }],
      drain: [{ pos: [-250, 160, 360], look: [130, -2, 10], mm: 30 }, { pos: [-190, 150, 400], look: [150, 0, 10], mm: 30 }],
      gates: [{ pos: [F.chamberX(1)[0] - 120, 70, 150], look: [F.chamberX(1)[0] - 10, 6, 0], mm: 32 }, { pos: [F.chamberX(1)[0] - 95, 64, 170], look: [F.chamberX(1)[0] - 6, 6, 0], mm: 32 }],
      culverts: [{ pos: [midX - 160, 70, 300], look: [midX + 40, -6, 0], mm: 30 }, { pos: [midX - 110, 66, 320], look: [midX + 60, -6, 0], mm: 30 }],
      mules: [{ pos: [midX - 60, 46, 120], look: [midX + 30, 8, 10], mm: 30 }, { pos: [midX + 40, 46, 128], look: [midX + 120, 8, 10], mm: 30 }],
      swimmer: [{ pos: [midX + 22, 5, zN + 7], look: [midX + 35, -0.5, zN], mm: 50 }, { pos: [midX - 40, 52, zN + 70], look: [midX + 40, 2, zN], mm: 32 }],
    };
    const cam = rig(shot, P0.view ? views[P0.view] : views[mode] ?? views.fill, { accel: 0.4, decel: 0.4 });
    const fx = post(ctx, scene, camera, { aoR: 9, aoI: 2.6 });
    // ---- labels
    const s = S();
    const cap = H.caption(layer, P0.caption ?? ({ fill: 'NO PUMPS · GRAVITY ONLY', drain: 'OUT TO THE SEA', gates: 'GATE LEAF · 64 × 7 FT · UP TO 82 FT TALL', culverts: '18 FT CULVERTS · 100 HOLES PER CHAMBER', mules: 'ELECTRIC "MULES"', swimmer: 'RICHARD HALLIBURTON · 1928' })[mode], 'left:5.5%;top:7.5%');
    const dims = mode === 'fill' ? H.pill(layer, '1,000 × 110 ft', { size: 26 }) : null;
    const toll = mode === 'swimmer' ? H.slab(layer, 'TOLL: 36¢', 'left:5.5%;top:15.5%', { size: 40 }) : null;
    const swP = mode === 'swimmer' ? H.pill(layer, 'CHARGED BY WEIGHT · 150 LB', { size: 24, dot: HOUSE.red }) : null;
    const src = H.sourceLine(layer, P0.source ?? (mode === 'swimmer' ? 'SOURCE: GUINNESS · ACP' : 'SOURCE: PANAMA CANAL AUTHORITY'));
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t); F.tick(t);
      const kr = kRise(t);
      // levels by mode: fill raises chamber 0 near lane 0 -> 8.7, drain lowers it 8.7 -> 0; the far lane steps the other way
      const step = F.step;
      let lvl0 = 0, lvlF = step;
      if (mode === 'fill' || mode === 'culverts' || mode === 'mules') { lvl0 = lerp(0, step, kr); lvlF = lerp(step, 0, kr); }
      else if (mode === 'drain') { lvl0 = lerp(step, 0, kr); lvlF = lerp(0, step, kr); }
      else if (mode === 'gates') { lvl0 = step; lvlF = 0; }
      else if (mode === 'swimmer') { lvl0 = step * 0.5; lvlF = step * 0.5; }
      F.setLevel(0, 1, lvl0); F.setLevel(0, 0, lvlF); F.setLevel(1, 0, step * 2); F.setLevel(1, 1, step * (mode === 'gates' ? 1 : 2));
      // gates: in 'gates' the upper gate of chamber 0 (k = 1) swings open, then the ship moves on
      const kg = mode === 'gates' ? kGate(t) : 0;
      F.setGate(1, 1, kg); F.setGate(0, 1, mode === 'drain' ? sstep(0.85, 1, kr) : 0); F.setGate(2, 1, 0); F.setGate(1, 0, 0); F.setGate(0, 0, 0); F.setGate(2, 0, 0);
      // ships ride the water
      const hx = mode === 'gates' ? lerp(midX + 20, midX + 140, sstep(0.6, 1, range(t, H.cue(shot, P0.gateAt, 1) + 2.5, shot.duration))) : midX + (mode === 'mules' ? lerp(-40, 30, p) : 20);
      hero.position.set(hx, lvl0, zN); hero.rotation.y = 0;
      other.position.set(midX - 10, lvlF, zF); other.rotation.y = Math.PI;
      // mules follow the ship along the walls; cables from mule to bitts
      for (let i = 0; i < mules.length; i++) {
        const { m, z, fwd } = mules[i], x = hx + fwd * 70, wy = F.wallTop(0);
        m.position.set(x, wy + 0.25, z); m.rotation.y = 0;
        const a = new THREE.Vector3(x, wy + 3.5, z), b = new THREE.Vector3(hx + fwd * 92, lvl0 + 12, zN + (z > zN ? 14 : -14)), d = b.clone().sub(a);
        cables[i].position.copy(a).addScaledVector(d, 0.5); cables[i].scale.set(1, d.length(), 1); cables[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
      if (swimmer) {
        const sx = midX + 34 + t * 0.9, sy = lvl0 + 0.02; swimmer.position.set(sx, sy, zN); swimmer.rotation.y = 0;
        const ph = t * 4.2; swimmer.arms.forEach((a, j) => { const q = ph + j * Math.PI; a.position.set(0.55 + 0.35 * Math.cos(q), 0.05 + 0.25 * Math.sin(q), (j ? 1 : -1) * 0.22); a.rotation.set(0, 0, q); });
        swimmer.ripples.forEach((r, j) => { const u = ((t * 0.5 + j / 3) % 1); r.position.set(sx - 0.6 - u * 2, sy + 0.03, zN); r.scale.setScalar(0.6 + u * 4); r.material.opacity = 0.45 * (1 - u); });
        swimmer.wake.position.set(sx - 4, sy + 0.025, zN); swimmer.wake.scale.set(7, 1, 0.8);
      }
      flow.forEach(a => a.tick(t, mode === 'culverts' ? 1 : 0)); upArrows.forEach(a => a.tick(t, 1)); spill.tick(t, mode === 'drain' ? sstep(0.05, 0.3, kr) * (1 - sstep(0.9, 1, kr) * 0.5) : 0);
      // labels
      cap?.type(t);
      if (dims) { const [x, y] = toScreen(v.set(midX, F.wallTop(0) + 2, -Z0), camera); dims.at(x, y, sstep(0.6, 1.2, t)); }
      if (toll) toll.style.opacity = String(sstep(1.2, 1.6, t));
      if (swP && swimmer) { const [x, y] = toScreen(v.set(swimmer.position.x, swimmer.position.y + 3, zN), camera); swP.at(x, y - 10, sstep(2.5, 3.2, t)); }
      sun.track([camera.position.x * 0.3 + midX * 0.7, 0, 0]);
    }, dispose() { fx.dispose(); } };
  }


  // ======================================================================== pools: Olympic pools out of a lock, then 2,700 a day
  // An Olympic pool holds ~660,000 gal; one Panamax crossing ~50 M gal -> 76 pools; ~36 crossings a day -> ~2,700.
  async function pools(ctx, shot) {
    const P0 = shot.params ?? {}, count = P0.count ?? 76, field = P0.field ?? 2700, mode = P0.mode ?? 'count';
    const { scene, camera, layer, sun } = H.base(ctx, { target: [0, 0, 0], span: 400, fog: true, fogNear: 1500, fogFar: 9000, far: 30000, bg: ['#c6d8e6', '#eef2f4'], fogC: '#e6edf2', mapSize: 4096, az: 140, el: 44, fill: 0.55 });
    const ground = CK.plane(30000, 30000, mat('#cfdcc6', 0.95), { y: 0 }); scene.add(ground);
    // one pool: 50 x 25 m clay rim, turquoise water, lane ropes
    const PW = 50, PD = 25, gap = 8, pitchX = PW + gap, pitchZ = PD + gap;
    const rimM = mat('#f6f5f1', 0.75), wM = CK.water({ color: '#59c6cf', scale: 9, strength: 0.25, glint: 1.4 }), laneM = mat('#ffffff', 0.6);
    const cols = 12, n0 = Math.min(count, 200), nF = mode === 'field' ? field : n0;
    const grid = (i, cols) => [(i % cols) * pitchX, Math.floor(i / cols) * pitchZ];
    const colsF = Math.ceil(Math.sqrt(nF * pitchZ / pitchX));
    const rim = new THREE.InstancedMesh(BOX, rimM, nF), wat = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), wM, nF), lanes = new THREE.InstancedMesh(BOX, laneM, nF * 3);
    rim.castShadow = rim.receiveShadow = true; wat.receiveShadow = true; scene.add(rim, wat, lanes);
    const xOff = mode === 'field' ? -colsF * pitchX / 2 : 40, zOff = mode === 'field' ? -Math.ceil(nF / colsF) * pitchZ / 2 : -3 * pitchZ;
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
    // the lock chamber (clay) on the left, draining
    const F = CK.lockFlight({ n: 1, lanes: 1, lo: 0, hi: 8.7, depth: 12.8, gate: 'miter' }); F.group.position.set(-380, 0, -20); scene.add(F.group);
    F.group.visible = mode !== 'field';
    // a city block for scale in the field view (clay towers)
    const r = CK.rng(5), blocks = [];
    if (mode === 'field') for (let i = 0; i < 90; i++) { const x = -colsF * pitchX / 2 - 380 + (i % 9) * 40, z = -500 + Math.floor(i / 9) * 100; blocks.push({ x, y: 0, z, sx: 30, sy: 10 + r() * 60, sz: 80, c: '#f4f3ef' }); }
    if (blocks.length) scene.add(CK.instanced(BOX, mat('#ffffff', 0.85), blocks));
    const tCount = H.cue(shot, P0.at, 0.8), span = P0.span ?? Math.max(3, shot.duration - 2.5), kOf = (t) => clamp((t - tCount) / span);
    const cam = C.path(P0.camera ?? (mode === 'field'
      ? [{ pos: [300, 520, 900], look: [0, 0, 0], mm: 30 }, { pos: [600, 1500, 2100], look: [-100, 0, -100], mm: 30 }]
      : [{ pos: [-430, 120, 230], look: [-150, 0, -10], mm: 30 }, { pos: [-120, 230, 430], look: [230, 0, 40], mm: 30 }]), { duration: shot.duration, float: 0, accel: 0.35, decel: 0.45 });
    const fx = post(ctx, scene, camera, { aoR: 6, aoI: 2.0 });
    const s = S_();
    const ctr = K.div(layer, `opacity:1;left:5.5%;top:7%;padding:${10 * s}px ${22 * s}px;background:#0b0b0b;color:#fff;font:700 ${84 * s}px/1 ${H.FONT.ui};letter-spacing:.01em`, '0');
    const sub = H.slab(layer, mode === 'field' ? 'OLYMPIC POOLS · EVERY DAY' : 'OLYMPIC POOLS · ONE CROSSING', `left:5.5%;top:${7 + 10.2}%`, { size: 30 });
    sub.style.background = '#fbf8f2'; sub.style.color = '#0f1e33';
    const src = H.sourceLine(layer, P0.source ?? 'OUR MATH · 50 M GAL PER CROSSING ÷ 660,000 GAL PER POOL');
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wM.tick(t); F.tick(t);
      const k = kOf(t), shown = mode === 'field' ? nF * smoother(k) : count * k;
      F.setLevel(0, 0, lerp(8.7, 0, smoother(clamp(k * 1.05))));
      for (let i = 0; i < nF; i++) {
        const [gx, gz] = grid(i, mode === 'field' ? colsF : cols), x = xOff + gx, z = zOff + gz;
        const a = clamp(shown - i, 0, 1), sc = a <= 0 ? 0.0001 : mode === 'field' ? 1 : CK.outCubic(a) * (1 + 0.12 * Math.sin(Math.PI * a));
        M4.compose(V.set(x, 0, z), Q, S.set(PW * sc, 2.2 * sc + 0.0001, PD * sc)); rim.setMatrixAt(i, M4);
        M4.compose(V.set(x, 2.3 * sc, z), Q, S.set((PW - 3) * sc, 1, (PD - 3) * sc)); wat.setMatrixAt(i, M4);
        for (let l = 0; l < 3; l++) { M4.compose(V.set(x, 2.35 * sc, z + (l - 1) * 6 * sc), Q, S.set((PW - 4) * sc, 0.25 * sc + 0.0001, 0.35 * sc)); lanes.setMatrixAt(i * 3 + l, M4); }
      }
      rim.instanceMatrix.needsUpdate = wat.instanceMatrix.needsUpdate = lanes.instanceMatrix.needsUpdate = true;
      ctr.textContent = Math.round(mode === 'field' ? nF * smoother(k) : count * k).toLocaleString('en-US');
      ctr.style.opacity = String(sstep(tCount - 0.3, tCount + 0.1, t));
      sun.track([camera.position.x * 0.2, 0, camera.position.z * 0.2], mode === 'field' ? 1800 : 600);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== expansion: the 2016 Neopanamax locks beside the 1914 ones
  // 427 x 55 x 18.3 m chambers, rolling gates, 3 water-saving basins per chamber recycling 60 % (RESEARCH §1a, §1c).
  async function expansion(ctx, shot) {
    const P0 = shot.params ?? {}, mode = P0.mode ?? 'compare';
    const { scene, camera, layer, sun } = H.base(ctx, { target: [600, 0, 0], span: 900, fog: false, bg: ['#c9dbe8', '#eef2f4'], mapSize: 4096, az: 145, el: 44, fill: 0.55 });
    scene.add(CK.catcher(-70));
    const OLD = CK.lockFlight({ n: 3, lanes: 2, lo: 0, hi: 26, depth: 12.8, gate: 'miter', wall: 14, mid: 18 });
    const NEW = CK.lockFlight({ n: 3, lanes: 1, lo: 0, hi: 26, depth: 18.3, gate: 'rolling', Lc: 427, Wc: 55, wall: 22, GG: 30 });
    OLD.group.position.set(0, 0, -150); NEW.group.position.set(0, 0, 110); scene.add(OLD.group, NEW.group);
    // basins: 3 per chamber, terraced on the outer (+z) side, each with a water box; culverts as pipes
    const wm = CK.water({ scale: 22 }), basins = [];
    for (let i = 0; i < 3; i++) { const [a, b] = NEW.chamberX(i); for (let k = 0; k < 3; k++) {
      const y0 = NEW.pool(i) - 4 + k * 3.2, x0 = a + 10, x1 = b - 10, z0 = 110 + NEW.totalW / 2 + 20 + k * 72, z1 = z0 + 62;
      const top = y0 + 4, bot = y0 - 7, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rims = [[cx, z0 - 3, x1 - x0 + 12, 6], [cx, z1 + 3, x1 - x0 + 12, 6], [x0 - 3, cz, 6, z1 - z0], [x1 + 3, cz, 6, z1 - z0]];
      scene.add(CK.instanced(BOX, mat('#efece6', 0.85), [...rims.map(([x, z, w, d]) => ({ x, y: bot, z, sx: w, sy: top - bot, sz: d })), { x: cx, y: bot - 0.5, z: cz, sx: x1 - x0, sy: 1, sz: z1 - z0 }]));
      const hole = waterBox(wm, { x0, x1, z0, z1, y0: y0 - 5.5, y1: y0 }); hole.position.y = y0 - 5.5; scene.add(hole);
      basins.push({ i, k, box: hole, y0: y0 - 5.5, full: y0 + 2.6, empty: y0 - 5 });
    } }
    // ground block
    const L = Math.max(OLD.length, NEW.length);
    const strata = [[1.2, '#b9cd95'], [6, HOUSE.strata[0]], [12, HOUSE.strata[1]], [18, HOUSE.strata[2]], [1e9, HOUSE.strata[3]]];
    scene.add(CK.slab({ w: L + 200, d: 760, x: L / 2, z: 120, y0: -60, y1: -32, top: '#cfcac0', strata }));
    // ships: a Neopanamax container ship (366 x 49 m) and a Panamax one for scale
    const big = CK.ship('neo', { seed: 4 }), small = CK.ship('container', { seed: 9, accent: null }); scene.add(big, small);
    const kCycle = (t) => 0.5 - 0.5 * Math.cos(t / Math.max(4, shot.duration) * Math.PI * 2);
    const cam = C.path(P0.camera ?? (mode === 'basins'
      ? [{ pos: [NEW.chamberX(1)[0] - 120, 170, 640], look: [NEW.chamberX(1)[0] + 200, 0, 220], mm: 30 }, { pos: [NEW.chamberX(1)[0] - 40, 160, 660], look: [NEW.chamberX(1)[0] + 240, 0, 220], mm: 30 }]
      : [{ pos: [-230, 260, 560], look: [380, 0, 20], mm: 30 }, { pos: [-140, 245, 600], look: [430, 0, 20], mm: 30 }]), { duration: shot.duration, float: 0, accel: 0.4, decel: 0.4 });
    const fx = post(ctx, scene, camera, { aoR: 9, aoI: 2.4 });
    const cap = H.caption(layer, P0.caption ?? (mode === 'basins' ? '3 WATER-SAVING BASINS PER CHAMBER · 60% REUSED' : '2016 · 70 FT WIDER · 18 FT DEEPER'));
    const p1 = H.pill(layer, 'NEOPANAMAX · 2016', { size: 26, dot: '#3fb2b7' }), p2 = H.pill(layer, 'PANAMAX · 1914', { size: 24 });
    const src = H.sourceLine(layer, 'SOURCE: PANAMA CANAL AUTHORITY');
    const flowA = []; for (let k = 0; k < 3; k++) { const [a, b] = NEW.chamberX(1), x = (a + b) / 2 + (k - 1) * 90; const ar = CK.arrows([[x, NEW.pool(1) + 6, 110 + 20], [x, NEW.pool(1) + 6, 110 + NEW.totalW / 2 + 40 + k * 72]], { count: 4, size: 9, speed: 30 }); scene.add(ar); flowA.push(ar); }
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t); OLD.tick(t); NEW.tick(t);
      // chamber 1 cycles: draining fills the basins (top basin first), filling takes the water back
      const k = kCycle(t);
      for (let i = 0; i < 3; i++) NEW.setLevel(i, 0, NEW.pool(i) + (i === 1 ? NEW.step * (1 - k) : 0));
      for (const B of basins) { const kk = B.i === 1 ? sstep(B.k / 3, (B.k + 1) / 3, k) : 0.4; B.box.setTop(lerp(B.empty, B.full, kk)); }
      for (let i = 0; i < 3; i++) for (let l = 0; l < 2; l++) OLD.setLevel(i, l, OLD.pool(i + (i + l) % 2));
      for (let g = 0; g <= 3; g++) NEW.setGate(g, 0, 0);
      const dk = Math.sign(Math.sin(t / Math.max(4, shot.duration) * Math.PI * 2)); flowA.forEach(a => a.tick(dk >= 0 ? t : -t, mode === 'basins' ? 1 : 0.6));
      big.position.set(NEW.chamberX(1)[0] + 30 + big.userData.L / 2, NEW.level(1, 0), 110); big.rotation.y = 0;
      small.position.set(OLD.chamberX(1)[0] + 20 + small.userData.L / 2, OLD.level(1, 1), -150 + OLD.laneZ(1)); small.rotation.y = 0;
      cap?.type(t);
      { const [x, y] = K.toScreen(v.set(NEW.chamberX(2)[0], NEW.wallTop(2) + 12, 110), camera); p1.at(x, y, sstep(0.6, 1.2, t)); }
      { const [x, y] = K.toScreen(v.set(OLD.chamberX(2)[0], OLD.wallTop(2) + 10, -150), camera); p2.at(x, y, sstep(0.8, 1.4, t)); }
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== hourglass: the water budget in clay
  // Rain fills the top (the lake), ships ride the water down the neck (the locks), it runs out the bottom (the sea).
  // inflow / outflow in million m3 a day (normal ~15 in; Oct 2023: 7 in vs 10 out, RESEARCH §1c).
  async function hourglass(ctx, shot) {
    const P0 = shot.params ?? {}, deficit = P0.mode === 'deficit';
    const inflow = P0.inflow ?? (deficit ? 7 : 15), outflow = P0.outflow ?? 10;
    const { scene, camera, layer, sun } = H.base(ctx, { target: [0, 0, 0], span: 90, fog: false, bg: ['#a9c6dd', '#dfe8ee'], mapSize: 2048, az: 140, el: 46, fill: 0.5 });
    scene.add(CK.catcher(-0.01, { size: 600, opacity: 0.16 }));
    const floor = CK.plane(600, 600, mat('#d9e1e6', 1), { y: -0.02 }); scene.add(floor);
    // the bulb profile (radius by height), a lathe: glass (pale, translucent) and water volumes clipped at levels
    const Hh = 60, neck = 2.2, R = 17;
    const rad = (y) => { const u = y / Hh; const d = Math.abs(u - 0.5) * 2; return neck + (R - neck) * Math.pow(Math.sin(Math.min(1, d * 1.25) * Math.PI / 2), 0.9) * (1 - 0.35 * sstep(0.85, 1, d)); };
    const lathe = (y0, y1, inset = 0, n = 48) => { const pts = []; for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n); pts.push(new THREE.Vector2(Math.max(0.01, rad(y) - inset), y)); } pts.unshift(new THREE.Vector2(0.01, y0)); pts.push(new THREE.Vector2(0.01, y1)); return new THREE.LatheGeometry(pts, 64); };
    const glass = new THREE.Mesh(lathe(1.5, Hh - 1.5), new THREE.MeshStandardMaterial({ color: '#eaf4f7', roughness: 0.08, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, envMap: CK.skyEnv(), envMapIntensity: 1.2 }));
    glass.position.y = 4; glass.renderOrder = 3; scene.add(glass);
    // clay frame: two discs and three posts
    for (const y of [0, Hh + 4]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(R + 4, R + 4, 4, 64), mat('#f4f2ee', 0.8)); d.position.y = y + 2 - (y ? 2 : 0); d.castShadow = d.receiveShadow = true; scene.add(d); }
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5, p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, Hh + 2, 16), mat('#efe9df', 0.8)); p.position.set(Math.cos(a) * (R + 2), Hh / 2 + 3, Math.sin(a) * (R + 2)); p.castShadow = true; scene.add(p); }
    const wm = CK.water({ color: '#3fa9ad', scale: 6, strength: 0.25, glint: 1.5 }), wSide = new THREE.MeshStandardMaterial({ color: '#4fb3b4', roughness: 0.3, transparent: true, opacity: 0.9 });
    const topW = new THREE.Mesh(new THREE.BufferGeometry(), wSide); topW.position.y = 4; scene.add(topW);
    const botW = new THREE.Mesh(new THREE.BufferGeometry(), wSide); botW.position.y = 4; scene.add(botW);
    const capTop = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), wm), capBot = capTop.clone(); scene.add(capTop, capBot);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#5cc6c6', roughness: 0.2, transparent: true, opacity: 0.9 })); scene.add(stream);
    // tiny ships riding the stream down (clay, white)
    const shipsDown = [0, 1, 2].map(i => { const sh = CK.ship(['container', 'lpg', 'bulk'][i], { seed: i, accent: null }); sh.scale.setScalar(0.012); scene.add(sh); return sh; });
    // the cloud and rain on top
    const cloud = CK.instanced(new THREE.IcosahedronGeometry(1, 2), mat('#ffffff', 0.95), [[-6, 0, 0, 9], [4, 2, 1, 11], [12, 0, -1, 8], [2, -1, -6, 8]].map(([x, y, z, s]) => ({ x, y: Hh + 22 + y, z, sx: s, sy: s * 0.6, sz: s * 0.8 })), { receive: false }); scene.add(cloud);
    const rainFx = CK.rain({ box: [-12, 14, Hh + 8, Hh + 19, -6, 6], count: 700, speed: 26, len: 1.2, opacity: 0.85, color: '#cfe4f4', seed: 2, wind: [0, 0] }); scene.add(rainFx);
    const level0 = P0.level ?? 0.72, rate = (inflow - outflow) / 100 * (P0.speed ?? 0.6);
    let lastTop = -1, lastBot = -1;
    const setVol = (mesh, y0, y1) => { mesh.geometry.dispose(); mesh.geometry = y1 - y0 > 0.05 ? lathe(y0, y1, 0.25, 24) : new THREE.BufferGeometry(); };
    const cam = C.path(P0.camera ?? [{ pos: [92, 62, 158], look: [0, 44, 0], mm: 36 }, { pos: [56, 66, 172], look: [0, 44, 0], mm: 36 }], { duration: shot.duration, float: 0, accel: 0.4, decel: 0.4 });
    const fx = post(ctx, scene, camera, { aoR: 2.5, aoI: 1.8 });
    const pIn = H.pill(layer, `RAIN IN · ${inflow} M m³ / DAY`, { size: 26, dot: '#3fb2b7' }), pOut = H.pill(layer, `OUT TO SEA · ${outflow} M m³ / DAY`, { size: 26 });
    const pLake = H.pill(layer, 'GATUN LAKE', { size: 24 }), pLocks = H.pill(layer, 'THE LOCKS', { size: 22 }), pSea = H.pill(layer, 'THE SEA', { size: 22 });
    const net = deficit || inflow < outflow ? H.slab(layer, `−${outflow - inflow} MILLION m³ A DAY`, 'left:5.5%;top:7.5%', { size: 44 }) : null;
    const cap = H.caption(layer, P0.caption ?? (deficit ? 'OCTOBER 2023' : null), net ? 'left:5.5%;top:15.5%' : 'left:5.5%;top:7.5%');
    const src = H.sourceLine(layer, P0.source ?? 'SOURCE: PANAMA CANAL AUTHORITY');
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t); rainFx.tick(t, inflow > 0 ? 1 : 0);
      const top = clamp(level0 + rate * t / 10, 0.08, 0.98), bot = clamp(0.25 + Math.abs(outflow) * 0.004 * t, 0, 0.42);
      const yTop0 = Hh * 0.5 + 0.6, yTopL = lerp(yTop0, Hh - 2, top), yBotL = lerp(1.6, Hh * 0.5 - 1, bot);
      if (Math.abs(yTopL - lastTop) > 0.01) { setVol(topW, yTop0, yTopL); lastTop = yTopL; }
      if (Math.abs(yBotL - lastBot) > 0.01) { setVol(botW, 1.6, yBotL); lastBot = yBotL; }
      capTop.position.y = yTopL + 4; capTop.scale.setScalar(rad(yTopL) - 0.3); capBot.position.y = yBotL + 4; capBot.scale.setScalar(rad(yBotL) - 0.3);
      const sTop = yTop0 + 4, sBot = yBotL + 4; stream.position.y = (sTop + sBot) / 2; stream.scale.set(outflow / 10, sTop - sBot, outflow / 10); stream.visible = outflow > 0;
      shipsDown.forEach((sh, i) => { const u = ((t * 0.18 + i / 3) % 1); sh.position.set(Math.sin(u * 9) * 0.6, lerp(sTop + 1, sBot + 0.5, u), 1.2); sh.rotation.y = u * 6; sh.visible = u < 0.97; });
      for (const [el, x, y, z] of [[pIn, 4, Hh + 34, 0], [pOut, 0, -1, R + 6], [pLake, -R - 2, yTopL + 4, 0], [pLocks, 2.5, Hh / 2 + 4, 2], [pSea, R + 3, yBotL + 2, 0]]) { const [sx, sy] = K.toScreen(v.set(x, y, z), camera); el.at(sx, sy, sstep(0.4, 1, t)); }
      if (net) net.style.opacity = String(sstep(0.8, 1.3, t)); cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  return { lock, pools, expansion, hourglass };
}
