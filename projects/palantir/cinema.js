// Cinematic sequences: real locations, animated people, and a camera that moves like a
// director's (spline rigs, follow cams, push-throughs). All shots here are framed 2.39:1.
import * as C from '/engine/cine.js';

export function makeCinema(H) {
  const { THREE, K, base, mesh, std, caption, wt, canvasTex, fakeText, makeOrb, RED, ease } = H;
  const capOn = (el, text, t, a = 0.6) => { if (el) { el.style.opacity = 1; K.typeOn(el, text, K.range(t, a, a + 1.4)); } };
  // silhouettes only: the CC0 UAL mannequin in matte near-black (or a dark suit for a walking figure)
  const MATTE = () => new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.88, metalness: 0.02 });
  const figure = (clip, o = {}) => C.character('UAL', { clip, material: o.material ?? MATTE(), phase: o.phase ?? 0 });
  const scope = (o) => ({ ...o, scope: true });
  const SUIT = () => new THREE.MeshStandardMaterial({ color: 0x1e2126, roughness: 0.7, metalness: 0.05 });
  const spot = (scene, pos, target, { color = 0xfff0dc, intensity = 3000, angle = 0.45, shadow = 0, shaft = 0.04, radius = 6 } = {}) => {
    K.keySpot(scene, { color, intensity, pos, target, angle, penumbra: 0.7, shadow });
    if (shaft) K.lightShaft(scene, { pos, target, radius, color, intensity: shaft });
  };


  return {
    // ================= the lawsuit: behind counsel, facing the bench =================
    // Palantir v. United States. Two silhouettes at the plaintiff's table, the other table empty
    // across the aisle, low sun raking through tall windows. A slow Steadicam push up the aisle.
    court2(ctx, shot) {
      const P0 = shot.params; const b = base(ctx, { floor: 0x1c1712, density: 0.035, fov: 34 }); const { scene, camera } = b;
      C.sky(scene, 'industrial_sunset_puresky', { background: false, intensity: 0.2 });
      const wood = std(0x3b2414, { roughness: 0.45 });
      mesh(new THREE.BoxGeometry(9, 2.8, 1.8), wood, [0, 1.4, -10], scene); mesh(new THREE.BoxGeometry(9.4, 0.2, 2.2), wood, [0, 2.9, -10], scene);
      mesh(new THREE.BoxGeometry(1.6, 3.6, 0.5), std(0x0e0e0e), [0, 3.1, -11.5], scene);
      for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(1.2, 9, 1.2), std(0x2a2520, { roughness: 0.8 }), [-8 + i * 5.3, 4.5, -13], scene);
      for (let i = 0; i < 3; i++) { const w = mesh(new THREE.PlaneGeometry(2.2, 6), new THREE.MeshBasicMaterial({ color: 0xffe2b8 }), [-12, 5, -6 + i * 4], scene); w.rotation.y = Math.PI / 2;
        K.lightShaft(scene, { pos: [-12, 6, -6 + i * 4], target: [2, 0, -4 + i * 4], radius: 1.6, color: 0xffd8a8, intensity: 0.08 }); }
      const sunL = new THREE.SpotLight(0xffd8a8, 3000, 0, 0.5, 0.6, 1.5); sunL.position.set(-12, 7, -2); sunL.target.position.set(2, 0, -2); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); scene.add(sunL, sunL.target);
      spot(scene, [0, 14, -4], [0, 2, -10], { intensity: 2400, angle: 0.35, shaft: 0.03, radius: 5 });
      for (const x of [-2.6, 2.6]) { mesh(new THREE.BoxGeometry(3.4, 0.1, 1.4), wood, [x, 1.5, -6], scene); for (const dx of [-1.5, 1.5]) mesh(new THREE.BoxGeometry(0.1, 1.5, 1.2), wood, [x + dx, 0.75, -6], scene); }
      mesh(new THREE.BoxGeometry(12, 1.1, 0.12), wood, [0, 0.55, -3.4], scene);
      for (const x of [-3.3, -1.9, 1.9, 3.3]) { const ch = new THREE.Group(); ch.position.set(x, 0, -4.8); scene.add(ch); mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), std(0x0e0e0e), [0, 0.95, 0], ch); mesh(new THREE.BoxGeometry(0.8, 0.45, 0.1), std(0x0e0e0e), [0, 1.2, 0.4], ch); }
      const people = [-3.3, -1.9].map((x, i) => { const c = figure('Sitting_Idle_Loop', { phase: i * 1.7 }); c.root.position.set(x, 0.42, -4.8); c.root.rotation.y = Math.PI; scene.add(c.root); return c; });
      const cap = caption(b.layer, P0.caption, 'left:6%;top:16%');
      const move = C.path([{ pos: [0.6, 1.65, 4.5], look: [-0.6, 1.7, -10], mm: 35 }, { pos: [0.3, 1.75, 0.6], look: [-0.8, 2.2, -10], mm: 40 }, { pos: [0.2, 2.1, 0.0], look: [-1.0, 2.6, -11], mm: 42 }], { duration: shot.duration, accel: 0.4, decel: 0.45, float: 0.02 });
      return scope({ ...b, update(t, p) { people.forEach(c => c.update(t)); move(camera, p, t); capOn(cap, P0.caption, t); } });
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
      const fig = figure('Idle_Loop'); fig.root.rotation.y = Math.PI; scene.add(fig.root);
      const motes = K.dust(scene, { count: 900, box: [30, 40, 60], center: [0, 20, -30], size: 0.12, opacity: 0.35, color: 0xffc8a0 });
      const cap = caption(b.layer, P0.caption, 'left:6%;bottom:16%');
      const move = C.path([{ pos: [0.8, 1.2, 3.2], look: [0, 6, -80], fov: 34 }, { pos: [1.5, 2.5, 9], look: [0, 10, -80], fov: 30 }, { pos: [3, 6, 22], look: [0, 14, -80], fov: 26 }], { duration: shot.duration, float: 0.03 });
      return scope({ ...b, update(t, p) { fig.update(t); motes.update(t); orb.material.uniforms.uT.value = t + 4; move(camera, p, t); if (cap) cap.style.opacity = K.range(t, 1, 1.8); } });
    },

    // ================= a figure walking the foot of the data wall =================
    wallwalk(ctx, shot) {
      const b = base(ctx, { floor: 0x101010, fog: 0x050505, density: 0.012, fov: 28 }); const { scene, camera } = b;
      const vocab = ['BMA', 'SENATE', 'NYT', 'PROTEST', 'FOIA', 'THE VERGE', 'LAWSUIT', 'NHS', 'ICE', 'AMNESTY', 'HEARING', 'LETTER', 'PETITION', 'BOYCOTT', 'INQUIRY', 'REUTERS', 'MARCH', 'COUNCIL', 'EPIC', 'EDITORIAL'];
      const atlas = canvasTex(1024, 1024, (x) => { const r = K.rng(8); for (let i = 0; i < 64; i++) { const cx = (i % 8) * 128, cy = Math.floor(i / 8) * 128; x.fillStyle = '#121212'; x.fillRect(cx + 3, cy + 3, 122, 122);
        x.fillStyle = i % 11 === 0 ? '#ff4a3d' : '#f0e8d8'; x.font = '500 22px "Plex Mono"'; x.fillText(vocab[(i * 7) % vocab.length], cx + 12, cy + 44); x.fillStyle = 'rgba(240,232,216,.3)'; for (let l = 0; l < 4; l++) x.fillRect(cx + 12, cy + 62 + l * 14, 40 + r() * 60, 6); } });
      const mat = new THREE.MeshBasicMaterial({ map: atlas });
      mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * 0.125 + vec2(mod(float(gl_InstanceID), 8.0), floor(mod(float(gl_InstanceID) * 5.0, 64.0) / 8.0)) * 0.125;'); };
      const cols = 70, rows = 34; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.9, 0.3), mat, cols * rows); const m4 = new THREE.Matrix4(); const r = K.rng(2);
      for (let i = 0; i < cols * rows; i++) { m4.makeTranslation((i % cols - cols / 2) * 2.05, Math.floor(i / cols) * 2.05 + 1, -6 + (r() - 0.5) * 0.3); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setScalar(0.5 + r() * 0.5)); }
      scene.add(im);
      const fig = figure('Walk_Formal_Loop', { material: SUIT() }); fig.root.rotation.y = Math.PI / 2; scene.add(fig.root);
      K.keySpot(scene, { intensity: 1200, pos: [0, 10, 4], target: [0, 0, -3], angle: 0.6, penumbra: 1, shadow: 1024 });
      return scope({ ...b, update(t, p) {
        fig.update(t); const x = -6 + t * 1.25; fig.root.position.set(x, 0, -2.5);
        const k = ease(p), cxp = -6 + shot.duration * 1.25 * k; camera.position.set(cxp - 5 + k * 2, K.lerp(0.4, 0.9, k), 13); camera.lookAt(cxp + 1, K.lerp(3.5, 5.5, k), -6);
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
      const fig = figure('Idle_Loop'); fig.root.position.set(0.2, 0, -2.5); fig.root.rotation.y = Math.PI; scene.add(fig.root);
      const motes = K.dust(scene, { count: 900, box: [6, 8, 16], center: [0, 3, 0], size: 0.035, opacity: 0.6, color: 0xffe7c2 });
      const move = C.path([{ pos: [-0.8, 1.5, 9], look: [0, 2.8, -6], fov: 30 }, { pos: [0.4, 1.7, 3.6], look: [0, 2.8, -6], fov: 34 }], { duration: shot.duration, float: 0.02 });
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
      const fig = figure('Walk_Loop'); fig.root.rotation.y = Math.PI; scene.add(fig.root);
      const cap = caption(b.layer, shot.params.caption, 'left:6%;top:16%');
      const follow = new THREE.SpotLight(0xfff0dc, 60, 10, 0.5, 0.8, 1.6); scene.add(follow, follow.target);
      const carry = mesh(new THREE.BoxGeometry(0.6, 0.4, 0.45), boxM, [0, 0, 0], scene);
      return scope({ ...b, update(t, p) {
        fig.update(t); const z = 2 - t * 1.25; fig.root.position.set(0, 0, z); carry.position.set(0, 1.05, z - 0.32); follow.position.set(0.8, 4, z + 2); follow.target.position.set(0, 1, z);
        const h = K.handheld(t, 0.03, 6), cz = 2 - shot.duration * 1.25 * ease(p); camera.position.set(0.6 + h.x, 2.1 + h.y, cz + 5.2); camera.lookAt(0, 1.4, cz - 6); camera.rotation.z += h.r; capOn(cap, shot.params.caption, t);
        const b6 = Math.ceil(z / 6) * 6; pls.forEach((l, j) => l.position.set(0, 6.6, b6 - j * 6));
      } });
    },
  };
}
