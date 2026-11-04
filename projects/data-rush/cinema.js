// Cinematic sequences: real locations, animated people, and a camera that moves like a
// director's (spline rigs, follow cams, push-throughs). All shots here are framed 2.39:1.
import * as C from '/engine/cine.js';

export function makeCinema(H) {
  const { THREE, K, base, mesh, std, caption, wt, canvasTex, fakeText, makeOrb, RED } = H;
  const scope = (o) => ({ ...o, scope: true });
  const SUIT = () => new THREE.MeshStandardMaterial({ color: 0x3c4048, roughness: 0.5, metalness: 0.15 });
  const spot = (scene, pos, target, { color = 0xfff0dc, intensity = 3000, angle = 0.45, shadow = 0, shaft = 0.04, radius = 6 } = {}) => {
    K.keySpot(scene, { color, intensity, pos, target, angle, penumbra: 0.7, shadow });
    if (shaft) K.lightShaft(scene, { pos, target, radius, color, intensity: shaft });
  };

  // ---------- an airliner with a livery, an open forward door and airstairs ----------
  function airliner({ lit = true } = {}) {
    const g = new THREE.Group();
    const yellow = std(0xf0c419, { roughness: 0.32, metalness: 0.2 }), white = std(0xdedbd2, { roughness: 0.35, metalness: 0.2 }), dark = std(0x16171a, { metalness: 0.6, roughness: 0.35 });
    const prof = []; const L = 38;
    for (let i = 0; i <= 60; i++) { const u = i / 60; const x = u * L - L / 2; let r = 2.1;
      if (u < 0.12) r = 2.1 * Math.sqrt(Math.sin(u / 0.12 * Math.PI / 2)); if (u > 0.8) r = 2.1 * (1 - Math.pow((u - 0.8) / 0.2, 1.6) * 0.75);
      prof.push(new THREE.Vector2(Math.max(0.05, r), x)); }
    const fus = mesh(new THREE.LatheGeometry(prof, 48), yellow, [0, 4.4, 0], g); fus.rotation.z = -Math.PI / 2;
    const belly = mesh(new THREE.BoxGeometry(L * 0.7, 0.5, 4.1), dark, [-1, 3.2, 0], g);
    const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(-6, 17); ws.lineTo(-8.5, 17); ws.lineTo(-8, 0);
    for (const sz of [-1, 1]) { const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.4, bevelEnabled: false }); wg.rotateX(Math.PI / 2); if (sz < 0) wg.scale(1, 1, -1);
      mesh(wg, white, [3, 3.6, sz * 1.8], g);
      const eng = mesh(new THREE.CylinderGeometry(1.2, 1.05, 4.5, 40), white, [1, 2.2, sz * 7], g); eng.rotation.z = Math.PI / 2;
      const fan = mesh(new THREE.CircleGeometry(1.0, 32), dark, [3.27, 2.2, sz * 7], g); fan.rotation.y = Math.PI / 2;
      const wl = mesh(new THREE.BoxGeometry(1.4, 2, 0.2), yellow, [-4.6, 4.6, sz * 18.6], g); wl.rotation.x = sz * 0.2; }
    const ts = new THREE.Shape(); ts.moveTo(0, 0); ts.lineTo(-6, 9); ts.lineTo(-9, 9); ts.lineTo(-8.5, 0);
    const fin = mesh(new THREE.ExtrudeGeometry(ts, { depth: 0.35, bevelEnabled: false }), yellow, [-12.5, 5.8, -0.17], g);
    const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.lineTo(-3, 6); hs.lineTo(-5, 6); hs.lineTo(-4.6, 0);
    for (const sz of [-1, 1]) { const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.2, bevelEnabled: false }); hg.rotateX(Math.PI / 2); if (sz < 0) hg.scale(1, 1, -1); mesh(hg, yellow, [-14.5, 5.2, sz * 1.0], g); }
    const winM = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, emissive: lit ? 0xffb066 : 0x000000, emissiveIntensity: lit ? 0.9 : 0, roughness: 0.2 });
    const wins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.44, 0.05), winM, 2 * 28); const m4 = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < 28; i++) for (const sz of [-1, 1]) { m4.makeTranslation(-12 + i * 0.95, 5.05, sz * 2.07); wins.setMatrixAt(k++, m4); } g.add(wins);
    const cock = mesh(new THREE.BoxGeometry(1.2, 0.5, 2.6), std(0x050608, { roughness: 0.05, metalness: 0.9 }), [16.3, 5.3, 0], g); cock.rotation.z = -0.35;
    // forward door (left side, facing +z), warm cabin glow behind it
    const door = mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshBasicMaterial({ color: 0x3a2412 }), [13.2, 4.5, 2.11], g);
    mesh(new THREE.PlaneGeometry(0.7, 1.5), new THREE.MeshBasicMaterial({ color: 0xa8662c }), [13.25, 4.45, 2.12], g);
    const doorLight = new THREE.PointLight(0xffb070, 30, 8, 1.6); doorLight.position.set(13.2, 4.6, 3); g.add(doorLight);
    for (const [x, z] of [[14.5, 0], [1, -3], [1, 3]]) { mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8), dark, [x, 1.1, z], g); const w = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 24), dark, [x, 0.6, z], g); w.rotation.x = Math.PI / 2; }
    // airstairs truck at the door
    const stairs = new THREE.Group(); stairs.position.set(13.2, 0, 4.9); g.add(stairs);
    const rampG = new THREE.BoxGeometry(1.2, 0.15, 5.6); const ramp = mesh(rampG, std(0x8a8d90, { metalness: 0.7, roughness: 0.4 }), [0, 1.9, 0.9], stairs); ramp.rotation.x = 0.62;
    mesh(new THREE.BoxGeometry(1.8, 1.2, 4), std(0xd8d4c8), [0, 0.6, 2.6], stairs);
    return { g, door, doorLight, wins };
  }

  return {
    // ================= dusk tarmac: the cold open =================
    tarmac(ctx, shot) {
      const P0 = shot.params; const night = P0.phase === 'night';
      const b = base(ctx, { floor: 0x2a2a2c, fog: night ? 0x05070c : 0x6b5a50, density: night ? 0.012 : 0.006, fov: 30 });
      const { scene, camera } = b;
      C.sky(scene, night ? 'moonless_golf' : 'qwantani_dusk_2', { intensity: night ? 0.35 : 0.9, bgIntensity: night ? 0.5 : 1 });
      b.ground.material.roughness = 0.25; b.ground.material.metalness = 0.4; const wet = K.grimeTexture(9, 120); wet.repeat.set(60, 60); b.ground.material.roughnessMap = wet;
      const sun = new THREE.DirectionalLight(night ? 0x6f86b8 : 0xffb070, night ? 0.4 : 2.2); sun.position.set(-60, 20, -40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, far: 200 }); scene.add(sun);
      const { g, doorLight } = airliner({ lit: !night }); g.rotation.y = 0.25; scene.add(g);
      // ground crew walking away from the aircraft
      const crew = [C.character('Soldier', { clip: 'Walk', phase: 0.3 }), C.character('Soldier', { clip: 'Walk', phase: 1.1 })];
      crew.forEach((c, i) => { c.root.position.set(16 + i * 1.4, 0, 9 + i * 0.8); c.root.rotation.y = Math.atan2(-0.55, -1.3); scene.add(c.root); });
      for (let i = 0; i < 8; i++) { const l = mesh(new THREE.ConeGeometry(0.12, 0.4, 12), std(0xff6a1a, { emissive: 0x401000 }), [20 - i * 4, 0.2, 12], scene); }
      const cap = caption(b.layer, P0.caption, 'left:6%;bottom:16%');
      const rigs = {
        wide: C.rig([{ pos: [70, 2.2, 52], look: [6, 4, 0], fov: 28 }, { pos: [52, 6, 38], look: [8, 5, 0], fov: 30 }, { pos: [40, 9, 30], look: [9, 4.6, 0], fov: 32 }], { float: 0.08 }),
        // float along the fuselage and push into the open door
        door: C.rig([{ pos: [-26, 12, 26], look: [-6, 5, 0], fov: 34 }, { pos: [-2, 8.5, 18], look: [6, 5, 1], fov: 36 }, { pos: [9, 5.6, 11], look: [12.6, 4.6, 2.2], fov: 38 }, { pos: [12.6, 4.7, 4.1], look: [13.6, 4.5, -1], fov: 44 }], { float: 0.03 }),
        tail: C.rig([{ pos: [-52, 1.0, 30], look: [-16, 8, 0], fov: 24 }, { pos: [-46, 1.6, 22], look: [-16, 9, 0], fov: 24 }], { float: 0.05 }),
        night: C.rig([{ pos: [40, 30, 50], look: [0, 3, 0], fov: 30 }, { pos: [30, 22, 44], look: [0, 3, 0], fov: 30 }], { float: 0.04 }),
      };
      const move = rigs[P0.phase] ?? rigs.wide;
      return scope({ ...b, update(t, p) {
        crew.forEach((c, i) => { c.update(t); c.root.position.x = 16 + i * 1.4 + t * 0.55; c.root.position.z = 9 + i * 0.8 + t * 1.3; });
        doorLight.intensity = night ? 0 : 30;
        move(camera, p, t);
        if (cap) cap.style.opacity = K.range(t, 0.8, 1.6);
      } });
    },

    // ================= inside the dead airliner =================
    cabin(ctx, shot) {
      const b = base(ctx, { floor: null, fog: 0x0a0806, density: 0.05, fov: 40 }); const { scene, camera } = b;
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 34, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfc8bc, roughness: 0.8, side: THREE.BackSide }));
      shell.rotation.x = Math.PI / 2; shell.position.set(0, 2.0, -15); scene.add(shell);
      mesh(new THREE.PlaneGeometry(4.2, 34), std(0x2b2f3a, { roughness: 0.95 }), [0, 0.15, -15], scene).rotation.x = -Math.PI / 2;
      const seatM = std(0x26354a, { roughness: 0.8 }); const seatG = new THREE.BoxGeometry(0.5, 0.12, 0.5), backG = new THREE.BoxGeometry(0.5, 0.75, 0.12);
      const seats = new THREE.InstancedMesh(seatG, seatM, 26 * 6), backs = new THREE.InstancedMesh(backG, seatM, 26 * 6); const m4 = new THREE.Matrix4(); let k = 0;
      for (let r = 0; r < 26; r++) for (const x of [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5]) { const z = -2 - r * 0.85; m4.makeTranslation(x, 0.62, z); seats.setMatrixAt(k, m4); m4.makeTranslation(x, 1.0, z + 0.25); backs.setMatrixAt(k, m4); k++; }
      seats.castShadow = backs.castShadow = true; scene.add(seats, backs);
      for (const x of [-1.45, 1.45]) mesh(new THREE.BoxGeometry(0.9, 0.5, 30), std(0xe2ddd2, { roughness: 0.7 }), [x, 2.95, -15], scene);
      // dusk light through the windows, as shafts across the aisle
      for (let r = 0; r < 12; r++) { const z = -2 - r * 2.2; const w = mesh(new THREE.PlaneGeometry(0.28, 0.4), new THREE.MeshBasicMaterial({ color: 0xffb070 }), [2.05, 1.75, z], scene); w.rotation.y = -Math.PI / 2;
        if (r % 3 === 0) K.lightShaft(scene, { pos: [2.05, 1.8, z], target: [-0.6, 0.2, z + 0.4], radius: 0.6, color: 0xffb070, intensity: 0.12 }); }
      for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffa860, 4, 6, 1.8); l.position.set(1.2, 1.7, -2 - i * 5); scene.add(l); }
      const strip = mesh(new THREE.BoxGeometry(0.04, 0.02, 30), new THREE.MeshBasicMaterial({ color: 0x9fffb0 }), [-0.35, 0.17, -15], scene);
      // the laptop left open on a seat, still glowing with email
      const lap = new THREE.Group(); lap.position.set(0.05, 0.17, -13.0); lap.rotation.y = 0.4; scene.add(lap);
      mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), std(0x8d9196, { metalness: 0.8, roughness: 0.3 }), [0, 0, 0], lap);
      const scr = canvasTex(512, 320, (x, w, h) => { x.fillStyle = '#f4f6fa'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d3b5c'; x.fillRect(0, 0, 120, h); x.fillStyle = '#dfe6ef';
        for (let i = 0; i < 9; i++) { x.fillStyle = i === 2 ? '#cfe0f5' : '#ffffff'; x.fillRect(130, 10 + i * 34, 372, 30); x.fillStyle = '#556'; x.fillRect(140, 18 + i * 34, 90, 6); x.fillStyle = '#99a'; x.fillRect(240, 18 + i * 34, 220, 6); } });
      const screen = mesh(new THREE.PlaneGeometry(0.42, 0.27), new THREE.MeshBasicMaterial({ map: scr }), [0, 0.14, -0.16], lap); screen.rotation.x = -0.25;
      const glow = new THREE.PointLight(0xcfe0ff, 3, 2.5, 1.5); glow.position.set(0.05, 0.5, -12.8); scene.add(glow);
      const move = C.rig([{ pos: [0.6, 1.75, -0.5], look: [0, 1.5, -12], fov: 40 }, { pos: [0.1, 1.55, -6], look: [0, 0.8, -13], fov: 38 }, { pos: [0.0, 1.0, -11.4], look: [0.05, 0.2, -13.0], fov: 34 }], { float: 0.02 });
      const motes = K.dust(scene, { count: 600, box: [4, 3, 20], center: [0, 1.6, -9], size: 0.012, opacity: 0.55, color: 0xffc890 });
      return scope({ ...b, update(t, p) { motes.update(t); move(camera, p, t); } });
    },

    // ================= bankruptcy court, behind the bidders =================
    court2(ctx, shot) {
      const P0 = shot.params; const b = base(ctx, { floor: 0x1c1712, density: 0.035, fov: 34 }); const { scene, camera } = b;
      C.sky(scene, 'industrial_sunset_puresky', { background: false, intensity: 0.25 });
      const wood = std(0x3b2414, { roughness: 0.45 });
      mesh(new THREE.BoxGeometry(9, 2.8, 1.8), wood, [0, 1.4, -10], scene); mesh(new THREE.BoxGeometry(9.4, 0.2, 2.2), wood, [0, 2.9, -10], scene);
      mesh(new THREE.BoxGeometry(1.6, 3.6, 0.5), std(0x0e0e0e), [0, 3.1, -11.5], scene);
      for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(1.2, 9, 1.2), std(0x2a2520, { roughness: 0.8 }), [-8 + i * 5.3, 4.5, -13], scene);
      // tall windows, low sun raking across the room
      for (let i = 0; i < 3; i++) { const w = mesh(new THREE.PlaneGeometry(2.2, 6), new THREE.MeshBasicMaterial({ color: 0xffe2b8 }), [-12, 5, -6 + i * 4], scene); w.rotation.y = Math.PI / 2;
        K.lightShaft(scene, { pos: [-12, 6, -6 + i * 4], target: [2, 0, -4 + i * 4], radius: 1.6, color: 0xffd8a8, intensity: 0.08 }); }
      const sunL = new THREE.SpotLight(0xffd8a8, 3000, 0, 0.5, 0.6, 1.5); sunL.position.set(-12, 7, -2); sunL.target.position.set(2, 0, -2); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); scene.add(sunL, sunL.target);
      spot(scene, [0, 14, -4], [0, 2, -10], { intensity: 2400, angle: 0.35, shaft: 0.03, radius: 5 });
      // the bidders: rows of standing figures; three of them will raise paddles
      const people = []; const r = K.rng(4);
      for (let row = 0; row < 3; row++) for (let i = -2; i <= 2; i++) { if (i === 0) continue; const c = C.character(r() < 0.5 ? 'Soldier' : 'Xbot', { clip: r() < 0.5 ? 'Idle' : 'idle', phase: r() * 3 });
        c.root.position.set(i * 1.5 + (r() - 0.5) * 0.3, 0, -3 + row * 1.9); c.root.rotation.y = (r() - 0.5) * 0.2; scene.add(c.root); people.push(c); }
      const bidders = [people[1], people[3], people[6]]; const paddleM = std(0xe8e2d6, { roughness: 0.6 });
      bidders.forEach((c) => { const hand = c.bones.RightHand; if (!hand) return; const pd = new THREE.Group(); hand.add(pd);
        const s = 1 / (c.root.scale.x || 1); const face = mesh(new THREE.BoxGeometry(22, 22, 1), paddleM, [0, 28, 0], pd); mesh(new THREE.CylinderGeometry(1, 1, 22, 8), std(0x2a1c12), [0, 12, 0], pd); });
      const tRaise = P0.word ? wt(shot, P0.word) : shot.duration * 0.5;
      const move = C.rig([{ pos: [0.2, 1.65, 4.5], look: [0, 1.7, -10], fov: 34 }, { pos: [0.05, 1.7, 0.2], look: [0, 2.4, -10], fov: 32 }, { pos: [0, 2.0, -3.5], look: [0, 3.0, -11], fov: 30 }], { float: 0.025 });
      return scope({ ...b, update(t, p) {
        people.forEach(c => c.update(t));
        bidders.forEach((c, i) => { const k = K.outCubic(K.range(t, tRaise + i * 0.35, tRaise + i * 0.35 + 0.6)); c.pose({ RightArm: [0, 0, -2.4], RightForeArm: [0, 0, -0.4] }, k); });
        move(camera, p, t);
      } });
    },

    // ================= the leap: two figures jump from a cargo ramp =================
    skydive(ctx, shot) {
      const b = base(ctx, { floor: null, fog: 0xbfd0e0, density: 0.0012, fov: 42 }); const { scene, camera } = b;
      C.sky(scene, 'kloppenheim_06_puresky', { intensity: 1.0 });
      const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(30, 60, -40); scene.add(sun);
      // cargo hold: a dark box open at the back (-z), ramp tilted down
      const hold = new THREE.Group(); scene.add(hold); const metal = std(0x2a2e33, { metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
      mesh(new THREE.BoxGeometry(5, 0.2, 14), metal, [0, 0, -3], hold); mesh(new THREE.BoxGeometry(0.2, 4, 14), metal, [-2.5, 2, -3], hold); mesh(new THREE.BoxGeometry(0.2, 4, 14), metal, [2.5, 2, -3], hold);
      mesh(new THREE.BoxGeometry(5, 0.2, 14), metal, [0, 4, -3], hold); mesh(new THREE.BoxGeometry(5, 4, 0.2), metal, [0, 2, 4], hold);
      const ramp = mesh(new THREE.BoxGeometry(5, 0.2, 4), metal, [0, -0.6, -11.6], hold); ramp.rotation.x = -0.3;
      for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(4.8, 0.1, 0.1), metal, [0, 3.8, 3 - i * 2.2], hold);
      const jl = new THREE.PointLight(0xff3020, 6, 8, 1.6); jl.position.set(2.2, 3.4, -9); hold.add(jl); mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff3020 }), [2.3, 3.4, -9], hold);
      const jumpers = [C.character('Soldier', { clip: 'Idle', phase: 0 }), C.character('Soldier', { clip: 'Idle', phase: 0.7 })];
      const pivots = jumpers.map((c, i) => { const pv = new THREE.Group(); pv.add(c.root); c.root.position.set(0, -0.9, 0); pv.position.set(i ? 0.8 : -0.8, 1.0, -9.6); scene.add(pv); return pv; });
      if (!location.search.includes('noclouds')) C.cloudLayer(scene, { y: -175, spread: 900, count: 220, size: 140 });
      if (!location.search.includes('noclouds')) C.cloudLayer(scene, { y: -320, spread: 1400, count: 160, size: 260, seed: 9 });
      const tJump = shot.duration * 0.38;
      const fallY = (dt) => dt <= 0 ? 0 : -(0.5 * 9.8 * Math.min(dt, 4) ** 2 + Math.max(0, dt - 4) * 39); // to terminal velocity
      return scope({ ...b, update(t, p) {
        jl.color.set(t > tJump - 1.2 ? 0x30ff60 : 0xff3020);
        const centre = new THREE.Vector3();
        jumpers.forEach((c, i) => { const dt = t - tJump - i * 0.08; c.update(t); const pv = pivots[i];
          if (dt <= 0) { pv.position.set(i ? 0.8 : -0.8, 1.0, -9.6); pv.rotation.set(0, 0, 0); }
          else { pv.position.set((i ? 0.8 : -0.8) + (i ? 1 : -1) * dt * 0.35, 1.0 + fallY(dt) + Math.min(dt, 0.6) * 1.2, -9.6 - dt * 5);
            pv.rotation.set(-K.smooth(Math.min(1, dt / 1.2)) * Math.PI / 2, Math.sin(dt * 0.5 + i) * 0.3, Math.sin(dt * 0.8 + i) * 0.15); c.pose(C.POSE_FREEFALL, Math.min(1, dt / 0.8)); c.root.updateMatrixWorld(true); }
          centre.add(pv.position); });
        centre.multiplyScalar(0.5);
        // camera: behind them in the hold, then out of the ramp following them down
        const k = K.smooth(K.range(t, tJump + 0.5, tJump + 2.0));
        const inHold = new THREE.Vector3(0.3, 1.7, K.lerp(-2, -6.5, K.inOut(K.range(t, 0, tJump)))), follow = centre.clone().add(new THREE.Vector3(0.6, K.lerp(1.2, 2.6, k), K.lerp(4.5, 4.2, k)));
        camera.position.lerpVectors(inHold, follow, k); const look = new THREE.Vector3(0, K.lerp(1.2, 0, k), -14).lerp(centre.clone().add(new THREE.Vector3(0, -0.4, -1)), k); camera.fov = K.lerp(42, 52, k); camera.updateProjectionMatrix();
        const h = K.handheld(t, 0.05 + k * 0.08, 3); camera.position.x += h.x; camera.position.y += h.y; camera.lookAt(look); camera.rotation.z += h.r * 2 + k * 0.08;
      } });
    },

    // ================= a lone figure before the seeing stone =================
    monolith(ctx, shot) {
      const P0 = shot.params; const b = base(ctx, { floor: 0x1d1c1b, fog: 0x0c0b0a, density: 0.018, fov: 30 }); const { scene, camera } = b;
      const conc = K.grimeTexture(41, 120); conc.repeat.set(4, 12);
      const cm = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.95, map: conc });
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(6, 80, 6), cm, [s * 18, 40, -10 - i * 22], scene);
      const orb = makeOrb(9); orb.position.set(0, 26, -80); scene.add(orb); orb.children[0].intensity = 4000; orb.children[0].distance = 200;
      if (P0.tint) orb.material.uniforms.uTint.value.set(P0.tint);
      K.lightShaft(scene, { pos: [0, 70, 6], target: [0, 0, 0], radius: 5, color: 0xfff0dc, intensity: 0.08 });
      K.keySpot(scene, { intensity: 9000, pos: [0, 70, 6], target: [0, 0, 0], angle: 0.08, penumbra: 0.5, shadow: 1024 });
      const fig = C.character('Soldier', { clip: 'Idle' }); scene.add(fig.root);
      const motes = K.dust(scene, { count: 900, box: [30, 40, 60], center: [0, 20, -30], size: 0.12, opacity: 0.35, color: 0xffc8a0 });
      const cap = caption(b.layer, P0.caption, 'left:6%;bottom:16%');
      const move = C.rig([{ pos: [0.8, 1.2, 3.2], look: [0, 6, -80], fov: 34 }, { pos: [1.5, 2.5, 9], look: [0, 10, -80], fov: 30 }, { pos: [3, 6, 22], look: [0, 14, -80], fov: 26 }], { float: 0.03 });
      return scope({ ...b, update(t, p) { fig.update(t); motes.update(t); orb.material.uniforms.uT.value = t + 4; move(camera, p, t); if (cap) cap.style.opacity = K.range(t, 1, 1.8); } });
    },

    // ================= a figure walking the foot of the data wall =================
    wallwalk(ctx, shot) {
      const b = base(ctx, { floor: 0x101010, fog: 0x050505, density: 0.012, fov: 28 }); const { scene, camera } = b;
      const vocab = ['posts', 'wiki', 'news', 'code', 'forum', 'books', 'reviews', 'papers', 'comments', 'threads', 'blogs', 'docs', 'lyrics', 'recipes', 'Q&A', 'patents', 'manuals', 'subtitles', 'emails', 'tweets'];
      const atlas = canvasTex(1024, 1024, (x) => { const r = K.rng(8); for (let i = 0; i < 64; i++) { const cx = (i % 8) * 128, cy = Math.floor(i / 8) * 128; x.fillStyle = '#121212'; x.fillRect(cx + 3, cy + 3, 122, 122);
        x.fillStyle = '#f0e8d8'; x.font = '500 30px "Plex Mono"'; x.fillText(vocab[(i * 7) % vocab.length], cx + 12, cy + 44); x.fillStyle = 'rgba(240,232,216,.3)'; for (let l = 0; l < 4; l++) x.fillRect(cx + 12, cy + 62 + l * 14, 40 + r() * 60, 6); } });
      const mat = new THREE.MeshBasicMaterial({ map: atlas });
      mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * 0.125 + vec2(mod(float(gl_InstanceID), 8.0), floor(mod(float(gl_InstanceID) * 5.0, 64.0) / 8.0)) * 0.125;'); };
      const cols = 70, rows = 34; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.9, 0.3), mat, cols * rows); const m4 = new THREE.Matrix4(); const r = K.rng(2);
      for (let i = 0; i < cols * rows; i++) { m4.makeTranslation((i % cols - cols / 2) * 2.05, Math.floor(i / cols) * 2.05 + 1, -6 + (r() - 0.5) * 0.3); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setScalar(0.5 + r() * 0.5)); }
      scene.add(im);
      const fig = C.character('Soldier', { clip: 'Walk', material: SUIT() }); fig.root.rotation.y = -Math.PI / 2; scene.add(fig.root);
      K.keySpot(scene, { intensity: 1200, pos: [0, 10, 4], target: [0, 0, -3], angle: 0.6, penumbra: 1, shadow: 1024 });
      return scope({ ...b, update(t, p) {
        fig.update(t); const x = -6 + t * 1.25; fig.root.position.set(x, 0, -2.5);
        const k = K.inOut(p); camera.position.set(x - 5 + k * 2, K.lerp(0.4, 0.9, k), 13); camera.lookAt(x + 1, K.lerp(3.5, 5.5, k), -6);
      } });
    },

    // ================= silhouette against the closing window =================
    windowfig(ctx, shot) {
      const b = base(ctx, { floor: 0x1c1b19, density: 0.02, fov: 30 }); const { scene, camera } = b;
      const wallM = std(0x0e0e0e, { roughness: 0.95 }); const W = 3.4, Hh = 6.5;
      mesh(new THREE.BoxGeometry(20, 16, 0.6), wallM, [-W / 2 - 10, 8, -6], scene); mesh(new THREE.BoxGeometry(20, 16, 0.6), wallM, [W / 2 + 10, 8, -6], scene);
      mesh(new THREE.BoxGeometry(W, 8, 0.6), wallM, [0, Hh + 1 + 4, -6], scene); mesh(new THREE.BoxGeometry(W, 1, 0.6), wallM, [0, 0.5, -6], scene);
      mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: 0xffe9cc }), [0, 8, -30], scene);
      const sun = new THREE.SpotLight(0xffe7c2, 9000, 0, 0.3, 0.3, 1); sun.position.set(0, 9, -24); sun.target.position.set(0, 0, 6); scene.add(sun, sun.target); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      K.lightShaft(scene, { pos: [0, 6.5, -6.4], target: [0, 0, 5], radius: 3.6, color: 0xffe7c2, intensity: 0.16 });
      const fig = C.character('Soldier', { clip: 'Idle' }); fig.root.position.set(0.2, 0, -2.5); scene.add(fig.root);
      const motes = K.dust(scene, { count: 900, box: [6, 8, 16], center: [0, 3, 0], size: 0.035, opacity: 0.6, color: 0xffe7c2 });
      const move = C.rig([{ pos: [-0.8, 1.5, 9], look: [0, 2.8, -6], fov: 30 }, { pos: [0.4, 1.7, 3.6], look: [0, 2.8, -6], fov: 34 }], { float: 0.02 });
      return scope({ ...b, update(t, p) { fig.update(t); motes.update(t); move(camera, p, t); } });
    },

    // ================= Steadicam behind a clerk in the archive =================
    archivewalk(ctx, shot) {
      const b = base(ctx, { floor: 0x1e1d1b, fog: 0x050806, density: 0.035, fov: 36 }); const { scene, camera } = b;
      const shelfM = std(0x3a3d40, { metalness: 0.6, roughness: 0.5 }); const boxM = std(0xb59a6a, { roughness: 0.95 });
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.7, 1.1), boxM, 2 * 16 * 6 * 6); const m4 = new THREE.Matrix4(); const r = K.rng(6); let i = 0;
      for (const side of [-1, 1]) for (let row = 0; row < 16; row++) { const z = -row * 4; mesh(new THREE.BoxGeometry(1.4, 6.6, 0.1), shelfM, [side * 2.6, 3.3, z - 2], scene);
        for (let lv = 0; lv < 6; lv++) { mesh(new THREE.BoxGeometry(1.4, 0.06, 4), shelfM, [side * 2.6, 0.3 + lv * 1.05, z], scene);
          for (let k = 0; k < 6; k++) if (r() < 0.86) { m4.makeTranslation(side * 2.6, 0.68 + lv * 1.05, z - 1.6 + k * 0.62); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(0.09, 0.3, 0.35 + r() * 0.2)); i++; } } }
      im.count = i; scene.add(im);
      const tubeM = new THREE.MeshBasicMaterial({ color: 0xe8ffe8 }); for (let z = 0; z > -64; z -= 6) mesh(new THREE.BoxGeometry(0.08, 0.05, 2.2), tubeM, [0, 6.9, z], scene);
      const pls = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xd8ffe0, 50, 16, 1.6); scene.add(l); return l; });
      const fig = C.character('Soldier', { clip: 'Walk', material: SUIT() }); scene.add(fig.root);
      const follow = new THREE.SpotLight(0xfff0dc, 60, 10, 0.5, 0.8, 1.6); scene.add(follow, follow.target);
      const carry = mesh(new THREE.BoxGeometry(0.6, 0.4, 0.45), boxM, [0, 0, 0], scene);
      return scope({ ...b, update(t, p) {
        fig.update(t); const z = 2 - t * 1.25; fig.root.position.set(0, 0, z); carry.position.set(0, 1.05, z - 0.32); follow.position.set(0.8, 4, z + 2); follow.target.position.set(0, 1, z);
        const h = K.handheld(t, 0.04, 6); camera.position.set(0.6 + h.x, 2.1 + h.y, z + 5.2); camera.lookAt(0, 1.4, z - 6); camera.rotation.z += h.r;
        const b6 = Math.ceil(z / 6) * 6; pls.forEach((l, j) => l.position.set(0, 6.6, b6 - j * 6));
      } });
    },
  };
}
