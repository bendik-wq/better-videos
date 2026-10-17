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
    const F = CK.lockFlight({ n: 2, lanes: 2, lo: 0, hi: 17.4, depth: 12.8, gate: 'miter', Lc: 304.8, Wc: 33.53, wall: 16, mid: 18 });
    scene.add(F.group);
    const L = F.length, Z0 = -F.totalW / 2, BASE = -42;
    const wm = CK.water({ scale: 30 });
    // ground blocks either side of the flight (stepping up with the chambers) and the base under it
    const g = new THREE.Group(); scene.add(g);
    const side = 70, front = mode === 'culverts' ? 6 : 26;
    const strata = [[1.2, '#b9cd95'], [5, HOUSE.strata[0]], [10, HOUSE.strata[1]], [14, HOUSE.strata[2]], [1e9, HOUSE.strata[3]]];
    const piece = (x0, x1, z0, z1, top) => g.add(CK.slab({ w: x1 - x0, d: z1 - z0, x: (x0 + x1) / 2, z: (z0 + z1) / 2, y0: BASE, y1: top, top: HOUSE.park, strata }));
    const xMid = F.chamberX(1)[0] - F.GG / 2;
    piece(0, xMid, Z0 - side, Z0, F.wallTop(0)); piece(xMid, L, Z0 - side, Z0, F.wallTop(1));
    piece(0, xMid, -Z0, -Z0 + front, F.wallTop(0)); piece(xMid, L, -Z0, -Z0 + front, F.wallTop(1));
    for (let i = 0; i < 2; i++) { const [a, b] = F.chamberX(i); g.add(CK.slab({ w: b - a + F.GG * 2, d: F.totalW, x: (a + b) / 2, z: 0, y0: BASE, y1: F.floorY(i) - 2.01, top: '#cfcac0', strata })); }
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
      swimmer: [{ pos: [midX + 20, 6, zN + 8], look: [midX + 34, -0.5, zN], mm: 50 }, { pos: [midX - 120, 120, zN + 160], look: [midX + 40, -2, zN], mm: 32 }],
    };
    const cam = rig(shot, P0.view ? views[P0.view] : views[mode] ?? views.fill, { accel: 0.4, decel: 0.4 });
    const fx = post(ctx, scene, camera, { aoR: 9, aoI: 2.6 });
    // ---- labels
    const s = S();
    const cap = H.caption(layer, P0.caption ?? ({ fill: 'NO PUMPS · GRAVITY ONLY', drain: 'OUT TO THE SEA', gates: 'GATE LEAF · 64 × 7 FT · UP TO 82 FT TALL', culverts: '18 FT CULVERTS · 100 HOLES PER CHAMBER', mules: 'ELECTRIC "MULES"', swimmer: 'RICHARD HALLIBURTON · 1928' })[mode], 'left:5.5%;top:7.5%');
    const dims = mode === 'fill' ? H.pill(layer, '1,000 × 110 ft', { size: 26 }) : null;
    const toll = mode === 'swimmer' ? H.slab(layer, 'TOLL: 36¢', 'left:5.5%;top:15.5%', { size: 40 }) : null;
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
      sun.track([camera.position.x * 0.3 + midX * 0.7, 0, 0]);
    }, dispose() { fx.dispose(); } };
  }

  return { lock };
}
