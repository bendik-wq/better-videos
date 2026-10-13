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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildTown, GRID, rot } from './town.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL } = LW;

export default function makeOutside(H) {
  const C = H.C;

  // ---------------------------------------------------------------- substation
  async function substation(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'wide', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 36, near: 0.05, far: 900 });
    scene.background = new THREE.Color(0x03060a); scene.fog = new THREE.FogExp2(0x0b1520, 0.016);
    const crew = mode === 'breaker' || mode === 'trucks';
    if (crew) await PE.preload({ wardrobe: ['overcoat', 'military'] });
    const T = (u, rep, srgb = true) => { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const galv = new THREE.MeshStandardMaterial({ color: 0x8c9296, roughness: 0.42, metalness: 0.85 });
    const porc = new THREE.MeshPhysicalMaterial({ color: 0x7d878c, roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.15 }); // grey glazed porcelain
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x3f8a7e, roughness: 0.1, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3 });
    const tankM = new THREE.MeshStandardMaterial({ color: 0x4f5a54, roughness: 0.5, metalness: 0.45, map: T('/assets/people/env/Metal032/color.jpg', 3), normalMap: T('/assets/people/env/Metal032/normalgl.jpg', 3, false) });
    const snowM = new THREE.MeshStandardMaterial({ color: 0xe6edf4, roughness: 0.88 });
    const iceM = new THREE.MeshPhysicalMaterial({ color: 0xcfe6f0, roughness: 0.08, transmission: 0.55, transparent: true, opacity: 0.8 });
    // the yard: gravel with drifted snow, a concrete road through it
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: 0x55585a, roughness: 0.95, map: T('/assets/pbr/gravel.a.jpg', 70), normalMap: T('/assets/pbr/gravel.n.jpg', 70, false) }));
    yard.rotation.x = -Math.PI / 2; yard.receiveShadow = true; scene.add(yard);
    const drift = LW.noiseCanvas(512, 512, 31, { scale: 40, oct: 5, lo: 0, hi: 255 });
    const dT = new THREE.CanvasTexture(drift); dT.wrapS = dT.wrapT = THREE.RepeatWrapping; dT.repeat.set(6, 6);
    const snowLayer = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: 0xe2e9f0, roughness: 0.9, alphaMap: dT, transparent: true, alphaTest: 0.35 })); snowLayer.rotation.x = -Math.PI / 2; snowLayer.position.y = 0.015; snowLayer.receiveShadow = true; scene.add(snowLayer);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 260), new THREE.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 0.8, map: T('/assets/pbr/concrete.a.jpg', 20) })); road.rotation.x = -Math.PI / 2; road.position.set(14, 0.02, 0); road.receiveShadow = true; scene.add(road);
    const parts = []; // merged galvanised steel
    const bar = (a, b, w = 0.07) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B); const g = new THREE.BoxGeometry(w, L, w); const m = new THREE.Matrix4().lookAt(A, B, new THREE.Vector3(0, 0, 1).cross(B.clone().sub(A)).lengthSq() > 1e-6 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); g.applyQuaternion(q); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); parts.push(g); };
    // a square lattice tower: 4 legs, horizontals every `step`, X bracing on every face
    const tower = (x, z, h, w = 0.9, step = 1.0) => { const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * w / 2, z + b * w / 2]);
      for (const [cx, cz] of c) bar([cx, 0, cz], [cx, h, cz], 0.09);
      for (let y = 0; y < h - 0.01; y += step) for (let k = 0; k < 4; k++) { const p = c[k], q = c[(k + 1) % 4]; bar([p[0], y + step, p[1]], [q[0], y + step, q[1]], 0.05); bar([p[0], y, p[1]], [q[0], Math.min(h, y + step), q[1]], 0.04); bar([q[0], y, q[1]], [p[0], Math.min(h, y + step), p[1]], 0.04); } };
    // a truss beam between two towers
    const beam = (x0, x1, z, y, d = 0.8, hgt = 0.9) => { for (const dz of [-d / 2, d / 2]) for (const dy of [0, hgt]) bar([x0, y + dy, z + dz], [x1, y + dy, z + dz], 0.07);
      const n = Math.round((x1 - x0) / 1.0); for (let i = 0; i < n; i++) { const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n;
        for (const dz of [-d / 2, d / 2]) bar([xa, y, z + dz], [xb, y + hgt, z + dz], 0.04); bar([xa, y + hgt, z - d / 2], [xa, y + hgt, z + d / 2], 0.04); bar([xa, y, z - d / 2], [xa, y, z + d / 2], 0.04); } };
    // two bays of gantries (110 kV): towers at x = -16, -2, 12 on two lines
    const TX = [-18, -4, 10];
    for (const z of [-22, -8]) { for (const x of TX) tower(x, z, 11, 1.0); for (let i = 0; i < TX.length - 1; i++) beam(TX[i] + 0.5, TX[i + 1] - 0.5, z, 10.1); }
    // insulator strings hanging from the beams, conductors in catenary between the gantry lines
    const discG = new THREE.CylinderGeometry(0.14, 0.14, 0.035, 24), capG = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12);
    const strings = [];
    for (const z of [-22, -8]) for (let i = 0; i < TX.length - 1; i++) for (const ph of [-3.2, 0, 3.2]) { const x = (TX[i] + TX[i + 1]) / 2 + ph; strings.push([x, z]); }
    const discs = new THREE.InstancedMesh(discG, glass, strings.length * 9), caps = new THREE.InstancedMesh(capG, galv, strings.length * 9);
    const M = new THREE.Matrix4(); let di = 0;
    for (const [x, z] of strings) for (let k = 0; k < 9; k++) { M.makeTranslation(x, 10.0 - 0.16 * k, z); discs.setMatrixAt(di, M); caps.setMatrixAt(di, M); di++; }
    discs.castShadow = caps.castShadow = true; scene.add(discs, caps);
    const condM = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.35, metalness: 0.9 });
    for (let i = 0; i < TX.length - 1; i++) for (const ph of [-3.2, 0, 3.2]) { const x = (TX[i] + TX[i + 1]) / 2 + ph;
      const pts = []; for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push(new THREE.Vector3(x, 8.55 - 1.3 * Math.sin(Math.PI * u), -22 + 14 * u)); }
      const cm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6), condM); cm.castShadow = true; scene.add(cm);
      // a rime of ice along the top of the conductor
      const ice = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().add(new THREE.Vector3(0, 0.02, 0)))), 40, 0.03, 6), iceM); scene.add(ice);
      // droppers from the conductor to the breakers below
    }
    // live-tank breakers: three porcelain columns per bay with interrupter heads, a mechanism cabinet
    const shed = (x, y0, z, h, r = 0.13) => { const n = Math.round(h / 0.11); for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * (k % 2 ? 0.75 : 1), r * (k % 2 ? 0.75 : 1), 0.06, 20), porc); m.position.set(x, y0 + 0.06 + k * 0.11, z); m.castShadow = true; scene.add(m); } };
    const cabinets = [];
    for (let i = 0; i < TX.length - 1; i++) { const cx = (TX[i] + TX[i + 1]) / 2;
      for (const ph of [-1.4, 0, 1.4]) { const x = cx + ph; const post = LW.cylM(0.09, 0.11, 2.2, galv, x, 1.1, -1.5, 10); scene.add(post); bar([x - 0.35, 0, -1.85], [x, 1.6, -1.5], 0.05); bar([x + 0.35, 0, -1.15], [x, 1.6, -1.5], 0.05); shed(x, 2.2, -1.5, 1.6); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 20), galv); head.rotation.z = Math.PI / 2; head.position.set(x, 4.0, -1.5); head.castShadow = true; scene.add(head);
        const snowCap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.25), snowM); snowCap.position.set(x, 4.18, -1.5); scene.add(snowCap); }
      const cab = new THREE.Group(); cab.position.set(cx, 0, 0.2);
      cab.add(LW.boxM(1.0, 1.7, 0.6, new THREE.MeshStandardMaterial({ color: 0x8d948c, roughness: 0.5, metalness: 0.3 }), 0, 0.85, 0));
      cab.add(LW.boxM(1.04, 0.06, 0.64, snowM, 0, 1.73, 0));
      const door = LW.boxM(0.9, 1.5, 0.02, new THREE.MeshStandardMaterial({ color: 0x7c847c, roughness: 0.5, metalness: 0.3 }), 0, 0.85, 0.31); cab.add(door);
      // the manual closing handle and a little red/green flag window
      const handle = new THREE.Group(); handle.position.set(0.25, 1.05, 0.34); cab.add(handle); handle.add(LW.boxM(0.04, 0.04, 0.22, new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 }), 0, 0, 0.11));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), new THREE.MeshBasicMaterial({ color: 0x00aa44 })); flag.position.set(-0.2, 1.25, 0.322); cab.add(flag);
      cab.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(cab); cabinets.push({ cab, handle, flag, x: cx }); }
    // the power transformer: tank on a plinth, banks of radiator fins, conservator, bushings
    const trafo = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z);
      g.add(LW.boxM(5.2, 0.4, 4.2, new THREE.MeshStandardMaterial({ color: 0x6e6c68, roughness: 0.9, map: T('/assets/pbr/concrete.a.jpg', 1) }), 0, 0.2, 0));
      g.add(LW.boxM(3.4, 3.0, 2.4, tankM, 0, 1.9, 0)); g.add(LW.boxM(3.5, 0.08, 2.5, snowM, 0, 3.44, 0));
      for (const sx of [-1, 1]) for (let k = 0; k < 16; k++) g.add(LW.boxM(0.03, 2.3, 0.62, tankM, sx * (1.8 + k * 0.06) , 1.85, -0.8 + (k % 2) * 0.0).translateZ(0)); // fin banks
      for (const sx of [-1, 1]) for (const zz of [-0.8, 0.8]) { for (let k = 0; k < 14; k++) g.add(LW.boxM(0.025, 2.2, 0.55, tankM, sx * (1.85 + k * 0.055), 1.85, zz)); g.add(LW.boxM(0.8, 0.08, 0.6, snowM, sx * 2.2, 2.98, zz)); }
      const cons = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.6, 24), tankM); cons.rotation.z = Math.PI / 2; cons.position.set(0, 4.1, -0.9); g.add(cons); g.add(LW.boxM(0.08, 0.7, 0.08, tankM, 0, 3.7, -0.9));
      for (const bx of [-0.9, 0, 0.9]) { const b = new THREE.Group(); b.position.set(bx, 3.4, 0.4); b.rotation.x = 0.15; for (let k = 0; k < 12; k++) b.add(new THREE.Mesh(new THREE.CylinderGeometry(k % 2 ? 0.09 : 0.13, k % 2 ? 0.09 : 0.13, 0.07, 20), porc).translateY(k * 0.1)); b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), galv).translateY(1.3)); g.add(b); }
      g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(g); return g; };
    trafo(-11, 9); trafo(3, 9);
    // chain-link fence with posts and barbed top
    for (let i = -20; i <= 20; i++) { bar([i * 2.5, 0, 22], [i * 2.5, 2.4, 22], 0.07); }
    bar([-50, 2.3, 22], [50, 2.3, 22], 0.04); bar([-50, 0.1, 22], [50, 0.1, 22], 0.04);
    const meshC = LW.canvas(64, 64); meshC.g.strokeStyle = '#fff'; meshC.g.lineWidth = 3; meshC.g.beginPath(); meshC.g.moveTo(0, 32); meshC.g.lineTo(32, 0); meshC.g.lineTo(64, 32); meshC.g.lineTo(32, 64); meshC.g.closePath(); meshC.g.stroke();
    const mT = new THREE.CanvasTexture(meshC); mT.wrapS = mT.wrapT = THREE.RepeatWrapping; mT.repeat.set(160, 8);
    const fence = new THREE.Mesh(new THREE.PlaneGeometry(100, 2.3), new THREE.MeshStandardMaterial({ color: 0x8a9094, metalness: 0.7, roughness: 0.5, alphaMap: mT, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); fence.position.set(0, 1.2, 22); scene.add(fence);
    const steel = new THREE.Mesh(mergeGeometries(parts), galv); steel.castShadow = true; steel.receiveShadow = true; scene.add(steel);
    // sodium floodlights on poles: real spot lights (one casts shadows), visible lamp heads, haze cones
    const floods = [];
    const coneMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uCol: { value: new THREE.Color(0xffa24a) }, uI: { value: 1 } },
      vertexShader: `varying float vY; varying vec3 vN, vV; void main() { vY = uv.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uI; varying float vY; varying vec3 vN, vV; void main() { float f = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(uCol * f * vY * vY * .05 * uI, 1.); }` });
    for (const [x, z, tx, tz, sh] of [[-24, 6, -8, -10, true], [20, 6, 2, -12, false], [-6, 19, -6, 2, false]]) {
      const pole = LW.cylM(0.12, 0.16, 14, galv, x, 7, z); scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0x222426, roughness: 0.5 })); head.position.set(x, 14, z); head.lookAt(tx, 0, tz); scene.add(head);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa24a).multiplyScalar(6) })); lens.position.copy(head.position).add(new THREE.Vector3(tx - x, -14, tz - z).normalize().multiplyScalar(0.27)); lens.lookAt(tx, 0, tz); scene.add(lens);
      const sp = new THREE.SpotLight(0xffa24a, 1600, 80, 0.66, 0.45, 1.45); sp.position.set(x, 14, z); sp.target.position.set(tx, 3, tz); sp.castShadow = sh; if (sh) { sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0004; }
      scene.add(sp, sp.target);
      const dir = new THREE.Vector3(tx - x, -14, tz - z), L = dir.length(); const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(0.62) * L, L, 32, 1, true), coneMat); cone.geometry.translate(0, -L / 2, 0); cone.position.set(x, 14, z); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize()); scene.add(cone);
      floods.push({ x, z, tx, tz, sp, lens, cone, L });
    }
    scene.add(new THREE.HemisphereLight(0x1d2a38, 0x050608, 0.35));
    // snow drifting through the cones
    const sn = LW.snow({ count: 7000, box: [70, 20, 60], center: [-2, 10, 0], size: 0.04, speed: 1.0, seed: 6, base: 0.025 }); scene.add(sn.points);
    floods.forEach((f, i) => sn.light(i, [f.x, 14, f.z], [f.tx - f.x, -14, f.tz - f.z], 0.82, 34, [1.6, 0.9, 0.42]));
    // crew truck (headlights, beacon) and the worker in hi-vis at the cabinet
    let worker = null, mate = null, truck = null, beacon = null;
    const tClose = H.cue(shot, P.close, mode === 'breaker' ? Math.min(D - 1.2, D * 0.6) : Infinity);
    const cabA = cabinets[0];
    if (crew || P.truck) {
      truck = buildTruck(); truck.position.set(14, 0, 7); truck.rotation.y = Math.PI * 0.86; scene.add(truck);
      for (const o of [[-0.75, 0.95, -2.75], [0.75, 0.95, -2.75]]) { const l = new THREE.SpotLight(0xfff0d8, 260, 45, 0.42, 0.5, 1.6); truck.add(l); l.position.set(...o); const tg = new THREE.Object3D(); tg.position.set(o[0] * 3, 0, -24); truck.add(tg); l.target = tg;
        const hl = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2dc).multiplyScalar(5) })); hl.position.set(o[0], o[1], o[2] - 0.02); hl.rotation.y = Math.PI; truck.add(hl); }
      sn.light(3, truck.localToWorld(new THREE.Vector3(0, 0.95, -2.8)).toArray(), new THREE.Vector3(0, -0.05, -1).applyQuaternion(truck.quaternion).toArray(), 0.9, 30, [1.4, 1.35, 1.25]);
      beacon = truck.getObjectByName('beacon');
    }
    if (crew) {
      const hivis = { outfit: { fabric: 'nylon', color: 0xff6a10 } };
      worker = PE.person('military', { dress: hivis }); scene.add(worker.root);
      worker.root.position.set(cabA.x + 0.25, 0, 1.15); worker.root.rotation.y = Math.PI;
      // reflective tape: two silver bands around the torso and one per sleeve
      const tape = new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.25, metalness: 0.6, emissive: 0x303438 });
      for (const [bone, r, y] of [['spine_02', 0.165, 0.02], ['spine_03', 0.175, 0.06], ['lowerarm_l', 0.055, 0.12], ['lowerarm_r', 0.055, 0.12]]) { const b = worker.bones?.[bone]; if (!b) continue; const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.045, 20, 1, true), tape); band.position.y = y; b.add(band); }
      mate = PE.person('overcoat', { dress: { outfit: { fabric: 'wool', color: 0x23272a } } }); scene.add(mate.root); mate.root.position.set(cabA.x - 1.6, 0, 2.6); mate.root.rotation.y = 2.5;
      await PE.props.ready();
    }
    const cap = P.caption ? H.caption(layer, P.caption) : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    const rigs = {
      wide: [{ pos: [17, 1.8, 17], look: [-6, 5.0, -14], mm: 24 }, { pos: [16.4, 1.85, 14.6], look: [-6, 5.0, -14], mm: 24 }],
      breaker: [{ pos: [cabA.x + 3.4, 1.65, 5.6], look: [cabA.x + 0.1, 1.2, 0.4], mm: 40 }, { pos: [cabA.x + 2.9, 1.62, 4.9], look: [cabA.x + 0.1, 1.2, 0.4], mm: 42 }],
      ice: [{ pos: [(TX[0] + TX[1]) / 2 - 1.2, 8.3, -4.6], look: [(TX[0] + TX[1]) / 2 - 3.2, 9.2, -8], mm: 50 }, { pos: [(TX[0] + TX[1]) / 2 - 1.3, 8.35, -4.9], look: [(TX[0] + TX[1]) / 2 - 3.2, 9.2, -8], mm: 55 }],
      trucks: [{ pos: [2, 1.6, 21], look: [13, 1.2, 6], mm: 32 }, { pos: [0.6, 1.6, 19.5], look: [12, 1.2, 5], mm: 34 }],
    };
    const rig = C.path(rigs[mode] ?? rigs.wide, { duration: D, accel: 0.35, decel: 0.5, float: 0.006, seed: 7 });
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        sn.update(t, camera, ctx.height);
        // the breaker closes by hand on the cue: the handle swings, the flag goes red->green, the bus is live
        const k = smoother(range(t, tClose - 0.5, tClose));
        if (cabA) { cabA.handle.rotation.x = lerp(0.9, -0.5, k); cabA.flag.material.color.setHex(t > tClose ? 0xd01810 : 0x00aa44); }
        if (worker) { worker.play('idle', 2).update(); const hp = cabA.handle.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 0.2));
          worker.reach('r', hp, 1); worker.reach('l', hp.clone().add(new THREE.Vector3(-0.12, 0.05, 0)), 0.6); worker.lookAt(hp, 0.8); }
        if (mate) mate.play('idle_b', 5).update();
        if (truck) { const bc = truck.getObjectByName('beacon'); if (bc) bc.material.color.setScalar(0).setRGB(1.6 * (0.5 + 0.5 * Math.sin(t * 9)), 0.6 * (0.5 + 0.5 * Math.sin(t * 9)), 0); }
        cap?.type(t);
      },
      dispose() {} };
  }
  function buildTruck() {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: 0xd9d4c4, roughness: 0.45, metalness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.6 }), win = new THREE.MeshStandardMaterial({ color: 0x0b1015, roughness: 0.1, metalness: 0.6 });
    g.add(LW.boxM(2.2, 1.25, 1.9, body, 0, 1.55, -1.9));               // cab
    g.add(LW.boxM(2.1, 0.55, 0.06, win, 0, 1.85, -2.86));              // windscreen
    g.add(LW.boxM(2.25, 1.75, 4.6, body, 0, 1.75, 1.45));              // service body
    for (let i = 0; i < 4; i++) g.add(LW.boxM(0.02, 1.3, 1.0, new THREE.MeshStandardMaterial({ color: 0xc9c4b4, roughness: 0.5, metalness: 0.4 }), 1.135, 1.75, -0.4 + i * 1.12)); // compartment doors
    g.add(LW.boxM(2.1, 0.6, 6.6, dark, 0, 0.62, 0));                   // chassis
    g.add(LW.boxM(2.3, 0.08, 4.7, new THREE.MeshStandardMaterial({ color: 0xe6edf4, roughness: 0.85 }), 0, 2.66, 1.45)); // snow on the roof
    for (const [x, z] of [[-1, -2.0], [1, -2.0], [-1, 1.9], [1, 1.9], [-1, 2.9], [1, 2.9]]) { const w = LW.cylM(0.48, 0.48, 0.32, dark, x, 0.48, z); w.rotation.z = Math.PI / 2; g.add(w); }
    const bc = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.25), new THREE.MeshBasicMaterial({ color: 0xffa020 })); bc.name = 'beacon'; bc.position.set(0, 2.25, -1.9); g.add(bc);
    for (const sx of [-1, 1]) g.add(LW.boxM(0.18, 0.12, 0.05, new THREE.MeshBasicMaterial({ color: 0x601010 }), sx * 0.9, 0.95, 3.32)); // tail lights
    g.add(LW.boxM(2.0, 0.35, 0.1, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 }), 0, 0.85, -2.92)); // grille
    g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    return g;
  }

  // ---------------------------------------------------------------- city-dark
  async function cityDark(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'blackout', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 34, near: 0.05, far: 2400 });
    scene.background = new THREE.Color(0x04070c); scene.fog = new THREE.FogExp2(0x0b1520, 0.006);
    // the street: the avenue at local x = GRID/2 (between block columns 0 and 1), walking north (-z)
    const sx = GRID / 2, W = (lx, lz) => rot(lx, lz);
    // one district per block along the avenue, both sides (district 0 farthest -> dies first in 'blackout')
    const seeds = []; for (let j = 0; j < 6; j++) for (const side of [-1, 1]) seeds.push(W(sx + side * 40, 120 - j * GRID));
    const town = buildTown(scene, { radius: 900, poleRadius: 700, moon: 1.4, fog: 0.006, fogColor: 0x0b1520, reserve: [], seeds });
    const sn = LW.snow({ count: 6000, box: [44, 22, 60], center: [0, 9, 0], size: 0.045, speed: 0.95, seed: 8, base: 0.04 }); scene.add(sn.points);
    const tAt = H.cue(shot, P.at, mode === 'blackout' ? 1.0 : Infinity), span = P.span ?? Math.max(2.2, D - tAt - 0.8);
    const tR = H.cue(shot, P.restore, mode === 'restore' ? 0.8 : Infinity);
    const z0 = 40, z1 = 22, p0 = W(sx + 2.2, z0), p1 = W(sx + 1.6, z1), l0 = W(sx - 3, z0 - 120), l1 = W(sx - 3, z1 - 120);
    const rig = C.path([{ pos: [p0[0], 1.7, p0[1]], look: [l0[0], 6, l0[1]], mm: 28 }, { pos: [p1[0], 1.7, p1[1]], look: [l1[0], 6, l1[1]], mm: 28 }], { duration: D, accel: 0.3, decel: 0.5, float: 0.012, seed: 9 });
    // the four lamps nearest the walk light the snow
    const near = town.lamps.map(l => ({ ...l, d: Math.hypot(l.x - (p0[0] + p1[0]) / 2, l.z - (p0[1] + p1[1]) / 2) })).sort((a, b) => a.d - b.d).slice(0, 3);
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    // power per district: 'blackout' -> far blocks die first, the wave walks toward the camera; 'restore' -> they strike back on
    const nD = seeds.length;
    const powOf = (t) => (d) => {
      if (d >= nD) return 1;
      const j = Math.floor(d / 2); // block index along the avenue: 0 behind the camera ... 5 far ahead
      if (mode === 'street') return 1;
      if (mode === 'restore') return LW.strike(range(t, tR + j * 0.45 + (d % 2) * 0.2, tR + j * 0.45 + (d % 2) * 0.2 + 0.7), d);
      const tj = tAt + (5 - j) / 6 * span * 0.85 + (d % 2) * 0.18; // the far blocks go first, the wave walks toward us
      return LW.flickerOut(range(t, tj, tj + 0.5), d);
    };
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x), sweep = 0.3 * Math.sin(t * 0.55 + 0.6);
        const dir = fwd.clone().addScaledVector(right, sweep).addScaledVector(new THREE.Vector3(0, 1, 0), -0.08).normalize();
        const pw = powOf(t);
        const lit = (d) => pw(d);
        town.update(t, { camera, height: ctx.height, pow: lit, flash: P.flashlight === false ? null : { pos: camera.position.clone().addScaledVector(right, 0.35).addScaledVector(new THREE.Vector3(0, 1, 0), -0.25).toArray(), dir: dir.toArray(), cos: 0.955, range: 80 } });
        near.forEach((l, i) => { const on = lit(l.d0) > l.k * 0.999 ? 1 : 0; if (on) sn.light(i, [l.x, 8.6, l.z], [0, -1, 0], 0.55, 16, [1.6, 0.92, 0.42]); else sn.off(i); });
        sn.light(3, camera.position.toArray(), dir.toArray(), 0.955, 30, [1.4, 1.38, 1.3]);
        sn.U.uCenter.value.set(camera.position.x + fwd.x * 18, 9, camera.position.z + fwd.z * 18);
        sn.update(t, camera, ctx.height);
        cap?.type(t);
      },
      dispose() {} };
  }

  return { substation, 'city-dark': cityDark };
}
