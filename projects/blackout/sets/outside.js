// Exteriors.
//
//   substation  a 110/10 kV substation at night under floodlights: a lattice gantry, porcelain insulator
//               stacks, a power transformer with radiators and bushings, breakers, bus conductors, ice on the
//               steel, drifting snow in the floodlight cones, a chain-link fence. params.mode:
//               'wide' (establishing, slow dolly), 'breaker' (close on a breaker, a crew closing it by hand:
//               two people, a truck, headlights, the breaker clunks shut on the cue `close` and the bus lights up),
//               'ice' (macro on iced insulators), 'trucks' (the utility trucks arriving, headlights sweeping).
//               caption, source, close (word/s), snow (density)
//   city-dark   a street-level winter city where the windows and streetlights go out block by block under a
//               flashlight beam. engine/world city + snow. params.mode: 'street' (walking, the flashlight sweeps,
//               the far blocks already dark), 'blackout' (the lights go out block by block from `at`),
//               'restore' (they come back). caption
import * as THREE from 'three';
import * as W from '/engine/world/index.js';
import * as PE from '/engine/people/index.js';
import * as LW from './lw.js';
import { buildTown } from './town.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL } = LW;

export default function makeOutside(H) {
  const C = H.C;

  // ---------------------------------------------------------------- substation
  async function substation(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'wide', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 36, near: 0.05, far: 2000 });
    scene.background = new THREE.Color(0x05080e); scene.fog = new THREE.FogExp2(0x0a1420, 0.012);
    if (mode === 'breaker' || mode === 'trucks') await PE.preload({ wardrobe: ['military', 'overcoat'] });
    const steelM = new THREE.MeshStandardMaterial({ color: 0x5a5e62, roughness: 0.5, metalness: 0.75 });
    const iceM = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ea, roughness: 0.18, metalness: 0, transmission: 0.3, transparent: true, opacity: 0.55, thickness: 0.02 });
    const porc = new THREE.MeshStandardMaterial({ color: 0x8f9aa0, roughness: 0.32, metalness: 0.05 });
    const gravel = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.95, map: tex('/assets/pbr/gravel.a.jpg', 40), normalMap: tex('/assets/pbr/gravel.n.jpg', 40) });
    function tex(u, rep) { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); if (!u.includes('.n.')) t.colorSpace = THREE.SRGBColorSpace; return t; }
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), gravel); yard.rotation.x = -Math.PI / 2; yard.receiveShadow = true; scene.add(yard);
    // snow dusting on the gravel
    const snowG = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: 0xdce6f0, roughness: 0.85, transparent: true, opacity: 0.6, alphaMap: tex('/assets/pbr/gravel.a.jpg', 20) })); snowG.rotation.x = -Math.PI / 2; snowG.position.y = 0.01; scene.add(snowG);
    const root = new THREE.Group(); scene.add(root);
    const iceOn = mode === 'ice' || P.ice !== false;
    // insulator stack: stacked porcelain sheds on a steel post
    const insulator = (x, z, h = 2.4, ice = iceOn) => { const g = new THREE.Group(); g.position.set(x, 0, z);
      const n = Math.round(h / 0.17); for (let i = 0; i < n; i++) { const r = 0.12 + 0.05 * (i % 2); const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 16), porc); d.position.y = 0.3 + i * 0.17; d.castShadow = true; g.add(d); }
      g.add(LW.cylM(0.05, 0.05, 0.3, steelM, 0, 0.15, 0));
      if (ice) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, h, 12), iceM); sh.position.y = 0.3 + h / 2; g.add(sh);
        for (let i = 0; i < 14; i++) { const ic = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1 + hash(x, z, i) * 0.22, 5), iceM); ic.position.set((hash(x, i) - 0.5) * 0.3, 0.3 + hash(z, i) * h, (hash(z, i, 2) - 0.5) * 0.3); ic.rotation.x = Math.PI; g.add(ic); } }
      root.add(g); return g; };
    // transformer: tank, radiators, bushings, conservator
    const transformer = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z);
      g.add(LW.boxM(3.2, 2.6, 2.2, new THREE.MeshStandardMaterial({ color: 0x3a3f42, roughness: 0.45, metalness: 0.6 }), 0, 1.5, 0));
      for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) g.add(LW.boxM(0.06, 2.0, 0.5, steelM, sx * 1.75, 1.4, -0.9 + i * 0.3));
      g.add(LW.cylM(0.4, 0.4, 2.0, new THREE.MeshStandardMaterial({ color: 0x3a3f42, roughness: 0.4, metalness: 0.6 }), 0, 3.2, 1.3).rotateZ ? LW.cylM(0.4, 0.4, 2.0, steelM, 0, 3.4, 1.0) : LW.cylM(0.4, 0.4, 2.0, steelM, 0, 3.4, 1.0));
      for (const bx of [-0.8, 0, 0.8]) { const b = insulator(0, 0, 1.0, iceOn); b.position.set(x + bx, 0, z); b.children.forEach(c => c.position.y += 2.8); b.position.y = 0; }
      root.add(g); return g; };
    // lattice gantry (A-frames carrying the bus)
    const lattice = (x, z, h = 8, w = 1.0) => { const g = new THREE.Group(); g.position.set(x, 0, z);
      for (const sx of [-1, 1]) { const leg = LW.boxM(0.12, h, 0.12, steelM, sx * w / 2, h / 2, 0); g.add(leg);
        for (let y = 0.6; y < h; y += 0.8) { const br = LW.boxM(w * 1.05, 0.05, 0.05, steelM, 0, y, 0); g.add(br); const dg = LW.boxM(0.05, 0.05, 0.05, steelM, 0, y, 0); dg.scale.x = w * 1.3; dg.rotation.z = 0.7 * (y % 1.6 < 0.8 ? 1 : -1); g.add(dg); } }
      g.add(LW.boxM(w + 0.3, 0.14, 0.14, steelM, 0, h, 0)); root.add(g); return g; };
    // build the yard
    const posts = [];
    for (let i = 0; i < 5; i++) { const x = -14 + i * 7; lattice(x, -16, 9, 1.2); lattice(x, -8, 7, 1.0);
      insulator(x, -12.5, 2.2); insulator(x - 1.4, -9, 2.0); posts.push([x, -9]); }
    transformer(8, -2); transformer(-6, -2);
    // bus conductors (catenary sag) between gantries
    const busMat = new THREE.MeshStandardMaterial({ color: 0x6a6f74, roughness: 0.5, metalness: 0.7 });
    const bus = []; for (let i = 0; i < 5; i++) { const x = -14 + i * 7; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8.2, 6), busMat); c.rotation.x = Math.PI / 2; c.position.set(x, 8.6, -12); bus.push(c); root.add(c); }
    // breakers (SF6 dead-tank: a tank on legs with two bushings)
    const breakers = [];
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8, g = new THREE.Group(); g.position.set(x, 0, 4);
      g.add(LW.boxM(1.4, 0.9, 0.9, new THREE.MeshStandardMaterial({ color: 0x45484b, roughness: 0.5, metalness: 0.5 }), 0, 1.6, 0));
      for (const sx of [-0.4, 0.4]) { const b = insulator(0, 0, 1.0); b.position.set(x + sx, 2.0, 4); b.scale.setScalar(0.9); }
      for (const lx of [-0.5, 0.5]) g.add(LW.boxM(0.1, 1.2, 0.1, steelM, lx, 0.6, 0));
      const cab = LW.boxM(0.6, 1.0, 0.4, new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.6 }), 0.9, 0.5, 0); g.add(cab);
      root.add(g); breakers.push({ g, x }); }
    // chain-link fence (a far perimeter, as thin posts + a faint mesh plane)
    for (let i = -12; i <= 12; i++) { root.add(LW.boxM(0.06, 2.2, 0.06, steelM, i * 2.5, 1.1, 10)); }
    const fenceMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 2.2), new THREE.MeshStandardMaterial({ color: 0x888d92, roughness: 0.6, metalness: 0.6, transparent: true, opacity: 0.12, alphaTest: 0.01, side: THREE.DoubleSide })); fenceMesh.position.set(0, 1.1, 10); root.add(fenceMesh);
    // floodlights on poles: cones + sprites
    const floods = [];
    for (const [x, z] of [[-18, 8], [18, 8], [-18, -18], [18, -18]]) { const pole = LW.cylM(0.1, 0.12, 11, steelM, x, 5.5, z); root.add(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.fluoro).multiplyScalar(3) })); head.position.set(x, 11, z); root.add(head);
      const sp = new THREE.SpotLight(0xd6ffe4, 220, 60, 0.6, 0.5, 1.4); sp.position.set(x, 11, z); sp.target.position.set(x * 0.3, 0, z * 0.3 - 4); sp.castShadow = mode !== 'wide'; if (sp.castShadow) sp.shadow.mapSize.set(1024, 1024); root.add(sp, sp.target);
      floods.push({ x, z, head, sp }); }
    const moon = new THREE.HemisphereLight(0x20303f, 0x05080a, 0.3); scene.add(moon);
    // snow in the cones
    const sn = LW.snow({ count: 4000, box: [60, 24, 60], center: [0, 12, -4], size: 0.04, speed: 1.0, seed: 6, base: 0.04 }); scene.add(sn.points);
    floods.slice(0, 4).forEach((f, i) => sn.light(i, [f.x, 11, f.z], [-f.x * 0.3, -1, -f.z * 0.3 - 4], 0.55, 40, [0.6, 1, 0.75]));
    // crew + truck for breaker/trucks modes
    let crew = [], truck = null, tHead = [];
    const tClose = H.cue(shot, P.close, mode === 'breaker' ? Math.min(D - 1.2, D * 0.6) : Infinity);
    if (mode === 'breaker' || mode === 'trucks') {
      truck = buildTruck(); truck.position.set(14, 0, 6); truck.rotation.y = -1.9; scene.add(truck);
      tHead = [[-0.9, 0.9, -2.6], [0.9, 0.9, -2.6]].map(o => { const l = new THREE.SpotLight(0xfff2d8, 120, 50, 0.5, 0.5, 1.6); l.position.set(14, 0, 6); truck.add(l); l.position.set(...o); const tg = new THREE.Object3D(); tg.position.set(o[0], 0.3, -14); truck.add(tg); l.target = tg; return l; });
      const p1 = PE.person('military', { dress: { outfit: { color: 0x2a2f28 } } }); p1.root.position.set(-6 + 1.2, 0, 6.5); p1.root.rotation.y = Math.PI; scene.add(p1.root);
      const p2 = PE.person('overcoat', {}); p2.root.position.set(-6 - 0.9, 0, 7.2); p2.root.rotation.y = 2.6; scene.add(p2.root);
      await PE.props.ready(); crew = [{ p: p1, reach: [-6, 1.5, 4.3] }, { p: p2 }];
    }
    const cap = P.caption ? H.caption(layer, P.caption) : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    const rigs = {
      wide: [{ pos: [0, 2.0, 26], look: [0, 6, -8], mm: 28 }, { pos: [-1.5, 2.2, 22], look: [0, 6, -8], mm: 28 }],
      breaker: [{ pos: [-6 + 2.6, 1.9, 9.5], look: [-6, 1.6, 4], mm: 45 }, { pos: [-6 + 2.2, 1.8, 8.6], look: [-6, 1.5, 4], mm: 48 }],
      ice: [{ pos: [-13.4, 2.0, -10.2], look: [-14, 2.0, -12.5], mm: 85 }, { pos: [-13.3, 2.0, -10.6], look: [-14, 2.0, -12.5], mm: 90 }],
      trucks: [{ pos: [2, 1.8, 20], look: [14, 1.5, 6], mm: 32 }, { pos: [0.5, 1.8, 18.5], look: [13, 1.4, 6], mm: 35 }],
    };
    const rig = C.path(rigs[mode] ?? rigs.wide, { duration: D, accel: 0.35, decel: 0.5, float: 0.006, seed: 7 });
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        sn.update(t, camera, ctx.height);
        const flicker = mode === 'wide' ? 1 : 1; floods.forEach(f => { f.sp.intensity = 220 * flicker; });
        // the de-energised bus is dark until the breaker is closed by hand
        const closed = t > tClose; const busLit = mode === 'breaker' ? (closed ? smoother(range(t, tClose, tClose + 0.3)) : 0) : 1;
        busMat.emissive.set(busLit ? 0x204030 : 0x000000); busMat.emissiveIntensity = busLit * 0.4;
        for (const c of crew) { if (c.reach && mode === 'breaker') { c.p.play('point', t * 0.6).update(); c.p.reach('r', new THREE.Vector3(...c.reach).add(new THREE.Vector3(0, 0.2 * Math.max(0, Math.sin(t * 1.5)) * (t < tClose ? 1 : 0), 0)), 1); if (closed && t < tClose + 0.2) {} }
          else { c.p.play('idle', t * 0.5 + 1).update(); } }
        cap?.type(t);
      },
      dispose() {} };
  }
  function buildTruck() {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: 0xc7c2b4, roughness: 0.55, metalness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.5 });
    g.add(LW.boxM(2.1, 1.0, 2.4, body, 0, 1.3, -1.6)); // cab
    g.add(LW.boxM(2.1, 1.8, 4.6, body, 0, 1.6, 2.0));   // box (service body)
    g.add(LW.boxM(2.0, 0.5, 2.0, dark, 0, 0.35, 0));    // chassis
    for (const [x, z] of [[-1, -2.2], [1, -2.2], [-1, 2.2], [1, 2.2]]) { const w = LW.cylM(0.45, 0.45, 0.3, dark, x, 0.45, z); w.rotation.z = Math.PI / 2; g.add(w); }
    g.add(LW.boxM(1.6, 0.5, 0.1, new THREE.MeshBasicMaterial({ color: 0xffb020 }), 0, 2.7, 0)); // amber beacon bar
    g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    return g;
  }

  // ---------------------------------------------------------------- city-dark
  async function cityDark(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'blackout', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 34, near: 0.05, far: 2200 });
    scene.background = new THREE.Color(0x05080d); scene.fog = new THREE.FogExp2(0x0a141f, 0.012);
    const town = buildTown(scene, { radius: 900, poleRadius: 900, moon: 1.1, fog: 0.012, fogColor: 0x0a141f });
    const sn = LW.snow({ count: 5000, box: [50, 24, 50], center: [0, 10, 0], size: 0.045, speed: 0.9, seed: 8, base: 0.05 }); scene.add(sn.points);
    // the flashlight: a cone from the camera, slightly below the view axis, sweeping
    const tAt = H.cue(shot, P.at, mode === 'blackout' ? 1.0 : Infinity), span = P.span ?? Math.max(2, D - tAt - 0.8);
    const tR = H.cue(shot, P.restore, Infinity);
    // a street-level dolly down an avenue (negative z), the flashlight raking the facades
    const rig = C.path([{ pos: [2.5, 1.7, 40], look: [-6, 3, -20], mm: 30 }, { pos: [1.0, 1.7, 30], look: [-6, 3, -24], mm: 30 }], { duration: D, accel: 0.3, decel: 0.5, float: 0.01, seed: 9 });
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    const district = town.district;
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
        const sweep = 0.35 * Math.sin(t * 0.5), right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        const dir = fwd.clone().addScaledVector(right, sweep).addScaledVector(new THREE.Vector3(0, 1, 0), -0.12).normalize();
        const fpos = camera.position.clone().addScaledVector(right, 0.3).toArray();
        const k = mode === 'blackout' ? range(t, tAt, tAt + span) : 0, restore = range(t, tR, tR + (P.restoreSpan ?? 3));
        town.update(t, { camera, height: ctx.height, flash: { pos: fpos, dir: dir.toArray(), cos: 0.955, range: 70 },
          pow: (d) => { if (mode === 'street') return 1; const order = (hash(d, 'city') + d / 12) % 1; let on = order > k ? 1 : 1 - clamp((k - order) * 6); on = Math.max(on, LW.strike(clamp(restore * 1.4 - (1 - order)), d)); return on; } });
        sn.update(t, camera, ctx.height);
        cap?.type(t);
      },
      dispose() {} };
  }

  return { substation, 'city-dark': cityDark };
}
