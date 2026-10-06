// B-roll library: extra sets so an episode never shows the same visual twice.
// Each factory: (ctx, shot) => { scene, camera, layer, update(t, p) }. Params vary camera,
// light and content so the same set can appear more than once without looking repeated.
export function makeBroll(H) {
  const { THREE, K, base, mesh, std, camOrbit, caption, wt, canvasTex, fakeText, P, CAP, SERIF, RED } = H;
  const lit = (scene, o = {}) => {
    const pos = o.pos ?? [-3, 16, 5], target = o.target ?? [0, 0, 0];
    K.keySpot(scene, { color: o.color ?? 0xfff0dc, intensity: o.intensity ?? 3200, pos, target, angle: o.angle ?? 0.5, penumbra: 0.7, shadow: o.shadow ?? 2048 });
    if (o.shaft !== false) K.lightShaft(scene, { pos, target, radius: o.radius ?? 7, color: o.color ?? 0xfff0dc, intensity: o.shaftI ?? 0.045 });
    if (o.fill !== false) scene.add(new THREE.HemisphereLight(o.sky ?? 0x40506a, 0x060606, o.fillI ?? 0.35));
  };
  const motes = (scene, o = {}) => K.dust(scene, { count: 500, box: o.box ?? [16, 10, 16], center: o.center ?? [0, 4, 0], size: o.size ?? 0.04, opacity: 0.4, color: o.color ?? 0xffffff });
  const label = (layer, text, css) => { const d = K.div(layer, css, text); return d; };
  const texText = (lines, { w = 512, h = 256, bg = '#e9e2d2', fg = '#1a1a1a', font = '700 64px "Archivo Narrow"', align = 'center' } = {}) =>
    canvasTex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = align; x.textBaseline = 'middle';
      lines.forEach((l, i) => x.fillText(l, align === 'center' ? w / 2 : 30, h / 2 + (i - (lines.length - 1) / 2) * parseInt(font.match(/(\d+)px/)[1]) * 1.15)); });

  return {
    // ---------- auction paddles raised one by one ----------
    auction(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1612, density: 0.03, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      lit(scene, { pos: [0, 18, 6], intensity: 4200, radius: 9 });
      const bids = P0.bids;
      const rows = []; const wood = std(0x3b2414, { roughness: 0.5 });
      for (let r = 0; r < 4; r++) for (let c = -4; c <= 4; c++) mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), wood, [c * 1.6, 0.45, r * 2.2], scene);
      const paddles = bids.map((bd, i) => {
        const g = new THREE.Group(); const x = (i - (bids.length - 1) / 2) * 3.4; g.position.set(x, 0, 1.2 + (i % 2) * 2.2); scene.add(g);
        mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), std(0x2a1c12), [0, 1.1, 0], g);
        const face = mesh(new THREE.BoxGeometry(1.6, 1.6, 0.06), [std(0xdddddd), std(0xdddddd), std(0xdddddd), std(0xdddddd),
          new THREE.MeshStandardMaterial({ map: texText([bd.label, bd.amount], { w: 512, h: 512, bg: bd.red ? '#c41e16' : '#ece6da', fg: bd.red ? '#fff' : '#111', font: '700 92px "Archivo Narrow"' }), roughness: 0.5 }), std(0xdddddd)], [0, 2.9, 0], g);
        return { g, x, t0: bd.word ? wt(shot, bd.word) : 0.3 + i * 0.4 };
      });
      motes(scene, { box: [20, 8, 10] });
      return { ...b, update(t, p) {
        paddles.forEach(pd => { const k = K.outCubic(K.range(t, pd.t0, pd.t0 + 0.6)); pd.g.position.y = K.lerp(-3.2, 0.6, k); pd.g.rotation.z = Math.sin(t * 2 + pd.x) * 0.04 * k; });
        camOrbit(camera, { r: 15, a0: P0.flip ? 0.3 : -0.3, a1: P0.flip ? 0.05 : -0.05, y0: 1.2, y1: 1.6, target: [0, 2.6, 1.5], p, t });
      } };
    },

    // ---------- bank vault door ----------
    vault(ctx, shot) {
      const b = base(ctx, { floor: 0x161616, density: 0.03, fov: 32 }); const { scene, camera } = b; const P0 = shot.params;
      const steel = std(0x8b8f94, { metalness: 0.95, roughness: 0.28 });
      mesh(new THREE.BoxGeometry(14, 10, 1.2), std(0x2a2a2a, { roughness: 0.8 }), [0, 5, -0.8], scene);
      const hinge = new THREE.Group(); hinge.position.set(-2.6, 4.2, 0.2); scene.add(hinge);
      const door = new THREE.Group(); door.position.set(2.6, 0, 0); hinge.add(door);
      const disk = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.9, 64), steel, [0, 0, 0], door); disk.rotation.x = Math.PI / 2;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const bolt = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 12), steel, [Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0], door); bolt.rotation.z = a + Math.PI / 2; }
      const wheel = new THREE.Group(); wheel.position.z = 0.6; door.add(wheel);
      mesh(new THREE.TorusGeometry(0.9, 0.08, 12, 48), steel, [0, 0, 0], wheel);
      for (let i = 0; i < 3; i++) { const s = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), steel, [0, 0, 0], wheel); s.rotation.z = i * Math.PI / 3; }
      const glow = new THREE.PointLight(0xffd59a, 0, 30, 1.5); glow.position.set(0, 4.2, -3); scene.add(glow);
      const back = mesh(new THREE.CircleGeometry(2.55, 48), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), [0, 4.2, -0.18], scene);
      lit(scene, { pos: [4, 14, 9], target: [0, 3, 0], intensity: 2600, radius: 6 });
      const [o0, o1] = P0.open ?? [0, 0.7];
      return { ...b, update(t, p) {
        const k = K.inOut(K.range(p, 0.15, 0.95)); const open = K.lerp(o0, o1, k);
        wheel.rotation.z = -K.range(p, 0, 0.3) * Math.PI * 1.5; hinge.rotation.y = -open * 1.6;
        glow.intensity = 300 * open; back.material.color.setScalar(0.15 + 0.6 * open);
        camOrbit(camera, { r: 14, a0: 0.35, a1: 0.15, y0: 3.6, y1: 4.4, target: [0, 4, 0], p, t });
      } };
    },

    // ---------- hourglass ----------
    hourglass(ctx, shot) {
      const b = base(ctx, { floor: 0x141210, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
      const prof = []; for (let i = 0; i <= 40; i++) { const y = i / 40 * 4; const r = 0.08 + 1.1 * Math.pow(Math.abs(y - 2) / 2, 0.7); prof.push(new THREE.Vector2(r, y)); }
      mesh(new THREE.LatheGeometry(prof, 64), glass, [0, 0.35, 0], scene);
      const wood = std(0x3a2414, { roughness: 0.5 });
      for (const y of [0.17, 4.53]) mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.34, 48), wood, [0, y, 0], scene);
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 10), wood, [Math.cos(a) * 1.3, 2.35, Math.sin(a) * 1.3], scene); }
      const sandM = std(0xd4a861, { roughness: 0.9 });
      const top = mesh(new THREE.ConeGeometry(1.0, 1.4, 48), sandM, [0, 3.1, 0], scene); top.rotation.x = Math.PI;
      const heap = mesh(new THREE.ConeGeometry(1.1, 1.2, 48), sandM, [0, 0.95, 0], scene);
      const streamN = 160; const sg = new THREE.BufferGeometry(); const sp = new Float32Array(streamN * 3); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xe6bd78, size: 0.04 })));
      lit(scene, { pos: [-4, 12, 6], target: [0, 2, 0], intensity: 2200, radius: 4.5 });
      const rim = new THREE.SpotLight(0x9fb7ff, 600, 0, 0.5, 1, 2); rim.position.set(5, 5, -6); rim.target.position.set(0, 2, 0); scene.add(rim, rim.target);
      const [f0, f1] = P0.fill ?? [0.2, 0.6];
      return { ...b, update(t, p) {
        const f = K.lerp(f0, f1, p); top.scale.setScalar(Math.max(0.05, 1 - f)); top.position.y = 2.45 + 0.7 * (1 - f);
        heap.scale.set(0.3 + f, 0.2 + f, 0.3 + f); heap.position.y = 0.52 + 0.6 * (0.2 + f) / 1.2 * 0.9;
        for (let i = 0; i < streamN; i++) { const u = ((i / streamN) + t * 1.7) % 1; sp[i * 3] = Math.sin(i * 7.1) * 0.02; sp[i * 3 + 1] = 2.35 - u * 1.4; sp[i * 3 + 2] = Math.cos(i * 3.3) * 0.02; }
        sg.attributes.position.needsUpdate = true;
        camOrbit(camera, { r: P0.close ? 6.5 : 10, a0: -0.5, a1: 0.4, y0: 2.2, y1: 2.8, target: [0, 2.3, 0], p, t });
      } };
    },

    // ---------- night city: every lit window is a company ----------
    city(ctx, shot) {
      const P0 = shot.params; const b = base(ctx, { floor: 0x0b0c0e, fog: P0.mode === 'dawn' ? 0x1a1410 : 0x03050a, density: 0.012, fov: 36 }); const { scene, camera } = b;
      const winTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#0d0f12'; x.fillRect(0, 0, w, h); const r = K.rng(4);
        for (let y = 8; y < h; y += 22) for (let c = 8; c < w; c += 20) { const on = r() < 0.55; x.fillStyle = on ? (r() < 0.2 ? '#9fd8ff' : '#ffcf8a') : '#16191d'; x.fillRect(c, y, 12, 14); } });
      winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
      const mat = new THREE.MeshStandardMaterial({ color: 0x15171b, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 1.2, roughness: 0.7, map: winTex });
      const r = K.rng(P0.seed ?? 3); const N = 420; const geo = new THREE.BoxGeometry(1, 1, 1); const im = new THREE.InstancedMesh(geo, mat, N); const m4 = new THREE.Matrix4(); let i = 0;
      for (let gx = -14; gx <= 14; gx++) for (let gz = -14; gz <= 1; gz++) { if (i >= N || r() < 0.08 || Math.abs(gx) < 1 && P0.mode === 'street') continue;
        const hgt = 2 + Math.pow(r(), 2.4) * (Math.abs(gx) < 4 && gz < -4 ? 28 : 12); const w = 1.6 + r() * 1.4;
        m4.compose(new THREE.Vector3(gx * 3.6, hgt / 2, gz * 3.6), new THREE.Quaternion(), new THREE.Vector3(w, hgt, w)); im.setMatrixAt(i++, m4); }
      im.count = i; scene.add(im);
      scene.add(new THREE.HemisphereLight(P0.mode === 'dawn' ? 0xffb070 : 0x334466, 0x050505, 0.6));
      const moon = new THREE.DirectionalLight(P0.mode === 'dawn' ? 0xffb070 : 0x8899cc, 0.6); moon.position.set(-30, 40, 20); scene.add(moon);
      const lbl = caption(b.layer, P0.caption, 'left:6%;bottom:9%');
      return { ...b, update(t, p) {
        const k = K.inOut(p);
        mat.emissiveIntensity = P0.mode === 'lightsoff' ? K.lerp(1.3, 0.05, K.range(p, 0.1, 0.9)) : P0.mode === 'lightson' ? K.lerp(0.05, 1.3, K.range(p, 0.05, 0.6)) : 1.2;
        if (P0.mode === 'street') { camera.position.set(0.5, 1.6, K.lerp(8, -10, k)); camera.lookAt(0, 6, -60); }
        else { const a = K.lerp(-0.6, -0.2, k); camera.position.set(Math.sin(a) * 70, K.lerp(36, 26, k), Math.cos(a) * 70); camera.lookAt(0, 4, -20); }
        if (lbl) lbl.style.opacity = K.range(t, 0.6, 1.4);
      } };
    },

    // ---------- conveyor of folders into a machine ----------
    conveyor(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.025, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      const beltTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#1b1b1b'; x.fillRect(0, 0, w, h); x.fillStyle = '#2c2c2c'; for (let i = 0; i < w; i += 16) x.fillRect(i, 0, 6, h); });
      beltTex.wrapS = THREE.RepeatWrapping; beltTex.repeat.set(12, 1);
      mesh(new THREE.BoxGeometry(30, 0.3, 2.4), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.6 }), [0, 1.2, 0], scene);
      for (let x = -14; x <= 14; x += 4) mesh(new THREE.BoxGeometry(0.2, 1.2, 2.6), std(0x333333, { metalness: 0.7 }), [x, 0.6, 0], scene);
      const machine = mesh(new THREE.BoxGeometry(5, 7, 5), std(0x111316, { metalness: 0.6, roughness: 0.4 }), [12, 3.5, 0], scene);
      const slot = mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: P0.color ?? 0x9fc4ff }), [9.48, 2.1, 0], scene); slot.rotation.y = -Math.PI / 2;
      const pl = new THREE.PointLight(P0.color ?? 0x9fc4ff, 160, 18, 1.6); pl.position.set(8.5, 2.2, 0); scene.add(pl);
      const items = []; const r = K.rng(2);
      for (let i = 0; i < 10; i++) { const f = P.folder(); f.scale.setScalar(0.32); scene.add(f); items.push({ f, off: i * 2.9, rot: (r() - 0.5) * 0.3 }); }
      lit(scene, { pos: [-2, 14, 6], target: [2, 1, 0], intensity: 5200, radius: 8, fillI: 0.6 });
      return { ...b, update(t, p) {
        beltTex.offset.x = -t * 0.35;
        items.forEach(it => { const x = ((it.off + t * 1.4) % 29) - 16; it.f.position.set(x, 1.36, 0); it.f.rotation.y = it.rot; it.f.visible = x < 9.4; });
        pl.intensity = 140 + Math.sin(t * 6) * 30;
        camOrbit(camera, { r: 13, a0: P0.flip ? 0.9 : 0.5, a1: P0.flip ? 0.6 : 0.2, y0: 4.5, y1: 3.2, target: [3, 1.8, 0], p, t });
      } };
    },

    // ---------- a single server rack, close ----------
    rack(ctx, shot) {
      const b = base(ctx, { floor: 0x101214, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const tint = P0.color ?? 0x7dffb0;
      mesh(new THREE.BoxGeometry(2.4, 7, 2.2), std(0x1c1e21, { metalness: 0.7, roughness: 0.35 }), [0, 3.5, 0], scene);
      const units = 20; const led = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), units * 8);
      const m4 = new THREE.Matrix4(); let k = 0;
      for (let u = 0; u < units; u++) { mesh(new THREE.BoxGeometry(2.1, 0.26, 0.04), std(0x2a2d31, { metalness: 0.8, roughness: 0.3 }), [0, 0.5 + u * 0.32, 1.12], scene);
        for (let j = 0; j < 8; j++) { m4.makeTranslation(-0.8 + j * 0.1, 0.5 + u * 0.32, 1.15); led.setMatrixAt(k++, m4); } }
      scene.add(led); const c = new THREE.Color();
      lit(scene, { pos: [3, 12, 7], target: [0, 3, 0], intensity: 1600, radius: 4, color: 0xd8e8ff });
      const glow = new THREE.PointLight(tint, 40, 8, 1.6); glow.position.set(0, 3.5, 2.5); scene.add(glow);
      motes(scene, { box: [6, 7, 6], center: [0, 3.5, 1] });
      return { ...b, update(t, p) {
        for (let i = 0; i < units * 8; i++) { const on = Math.sin(t * (3 + (i % 7)) + i * 1.7) > 0.2; led.setColorAt(i, on ? c.set(i % 13 === 0 ? 0xffb040 : tint) : c.set(0x111111)); }
        led.instanceColor.needsUpdate = true;
        if (P0.cam === 'low') camOrbit(camera, { r: 5.5, a0: -0.6, a1: -0.3, y0: 0.6, y1: 1.2, target: [0, 4, 1], p, t });
        else camOrbit(camera, { r: 7.5, a0: 0.4, a1: 0.1, y0: 4.5, y1: 3.5, target: [0, 3.4, 1], p, t });
      } };
    },

    // ---------- boardroom ----------
    boardroom(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1714, density: 0.03, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      const wood = std(0x2b1a10, { roughness: 0.35, metalness: 0.1 });
      mesh(new THREE.BoxGeometry(3, 0.12, 14), wood, [0, 1.5, 0], scene);
      for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(0.2, 1.5, 12), wood, [x * 1, 0.75, 0], scene);
      const leather = std(0x0e0e0e, { roughness: 0.45 });
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const ch = new THREE.Group(); ch.position.set(s * 2.2, 0, -5 + i * 2); ch.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(ch);
        mesh(new THREE.BoxGeometry(1, 0.15, 1), leather, [0, 1.0, 0], ch); mesh(new THREE.BoxGeometry(1, 1.3, 0.12), leather, [0, 1.7, -0.45], ch); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), std(0x777777, { metalness: 1 }), [0, 0.5, 0], ch); }
      const lamps = [];
      for (let i = 0; i < 3; i++) { const z = -4 + i * 4; mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 6), std(0x222222), [0, 5.5, z], scene);
        mesh(new THREE.ConeGeometry(0.5, 0.4, 32, 1, true), std(0x1d1d1d, { side: THREE.DoubleSide }), [0, 4, z], scene);
        const l = new THREE.SpotLight(0xffd7a0, 320, 12, 0.7, 0.6, 2); l.position.set(0, 3.9, z); l.target.position.set(0, 1.5, z); scene.add(l, l.target); l.castShadow = i === 1; lamps.push(l); }
      const doc = P.folder(); doc.scale.setScalar(0.25); doc.position.set(0.3, 1.57, P0.docZ ?? 0); scene.add(doc);
      scene.add(new THREE.HemisphereLight(0x334455, 0x050505, 0.25));
      return { ...b, update(t, p) {
        const k = K.inOut(p);
        if (P0.cam === 'top') { camera.position.set(0.2, K.lerp(13, 11, k), K.lerp(4, 1, k)); camera.lookAt(0, 1.5, 0); }
        else { camera.position.set(K.lerp(-0.5, 0.5, k), 2.4, K.lerp(12, 8.5, k)); camera.lookAt(0, 1.6, -4); }
      } };
    },

    // ---------- semi truck on a night highway ----------
    truck(ctx, shot) {
      const b = base(ctx, { floor: 0x0d0e10, fog: 0x04060a, density: 0.02, fov: 36 }); const { scene, camera } = b; const P0 = shot.params;
      const roadTex = canvasTex(64, 512, (x, w, h) => { x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8d0b0'; for (let y = 0; y < h; y += 128) x.fillRect(30, y, 4, 64); x.fillStyle = '#c8a24a'; x.fillRect(2, 0, 3, h); x.fillRect(59, 0, 3, h); });
      roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 40);
      const road = mesh(new THREE.PlaneGeometry(9, 400), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.6 }), [0, 0.01, -150], scene); road.rotation.x = -Math.PI / 2;
      const truck = new THREE.Group(); truck.position.set(-1.6, 0, 0); scene.add(truck);
      const paint = std(P0.color ?? 0x7a1d16, { roughness: 0.35, metalness: 0.5 });
      mesh(new THREE.BoxGeometry(2.4, 2.6, 2.6), paint, [0, 2.0, -1.0], truck); mesh(new THREE.BoxGeometry(2.4, 1.4, 1.6), paint, [0, 1.4, 0.9], truck);
      mesh(new THREE.BoxGeometry(2.0, 1.0, 0.05), std(0x05080a, { roughness: 0.05, metalness: 1 }), [0, 2.6, 0.26], truck);
      const box = K.container({ color: 0x5e6266, detail: false }); box.rotation.y = Math.PI / 2; box.position.set(0, 1.25, -8.4); truck.add(box);
      const wheels = []; for (const z of [0.9, -2.5, -11, -12.6]) for (const x of [-1.2, 1.2]) { const w = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 20), std(0x0b0b0b), [x, 0.55, z], truck); w.rotation.z = Math.PI / 2; wheels.push(w); }
      const hl = new THREE.SpotLight(0xfff2d0, 1200, 90, 0.4, 0.5, 1.4); hl.position.set(0, 1.4, 1.8); hl.target.position.set(0, 0, 40); truck.add(hl, hl.target);
      for (const x of [-0.9, 0.9]) mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff6e0 }), [x, 1.4, 1.72], truck);
      for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(0.2, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0xff2a1a }), [x, 0.9, -13.4], truck);
      const poles = []; for (let i = 0; i < 12; i++) { const g = new THREE.Group(); scene.add(g); mesh(new THREE.CylinderGeometry(0.08, 0.1, 9, 8), std(0x333333), [6, 4.5, 0], g);
        mesh(new THREE.BoxGeometry(2.4, 0.15, 0.4), std(0x333333), [4.9, 9, 0], g); const l = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), new THREE.MeshBasicMaterial({ color: 0xffb070 }), [3.9, 8.9, 0], g); poles.push(g); }
      const pl = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffa860, 120, 22, 1.6); scene.add(l); return l; });
      return { ...b, update(t, p) {
        const speed = 22; const d = t * speed;
        poles.forEach((g, i) => { g.position.z = ((i * 24 - d) % 288 + 288) % 288 - 260; });
        pl.forEach((l, i) => { const z = ((i * 24 - d) % 72 + 72) % 72 - 50; l.position.set(3.9, 8.6, z); });
        roadTex.offset.y = d / 10; wheels.forEach(w => { w.rotation.x = d * 2; });
        truck.position.y = Math.sin(t * 9) * 0.015;
        const k = K.inOut(p);
        if (P0.view === 'front') { camera.position.set(K.lerp(-3, -1, k), 1.2, 16); camera.lookAt(-1.6, 1.8, 0); }
        else if (P0.view === 'aerial') { camera.position.set(14, K.lerp(26, 18, k), K.lerp(14, 6, k)); camera.lookAt(-1.6, 0, -6); }
        else { camera.position.set(K.lerp(9, 7, k), 2.2, K.lerp(-2, -6, k)); camera.lookAt(-1.6, 1.8, -5); }
      } };
    },

    // ---------- dispatch desk at 2am ----------
    dispatch(ctx, shot) {
      const b = base(ctx, { floor: 0x141210, density: 0.04, fov: 32 }); const { scene, camera } = b; const P0 = shot.params;
      mesh(new THREE.BoxGeometry(5, 0.12, 2.2), std(0x3a2a1c, { roughness: 0.6 }), [0, 1.0, 0], scene);
      const screens = [];
      for (const [x, ry] of [[-1.1, 0.25], [1.1, -0.25]]) {
        const c = document.createElement('canvas'); c.width = 512; c.height = 384; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
        const mon = new THREE.Group(); mon.position.set(x, 1.06, -0.3); mon.rotation.y = ry; scene.add(mon);
        mesh(new THREE.BoxGeometry(1.8, 1.4, 1.3), std(0xc9c2ae, { roughness: 0.7 }), [0, 0.75, -0.3], mon);
        const scr = mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: tex }), [0, 0.78, 0.36], mon);
        screens.push({ c, x: c.getContext('2d'), tex, seed: x > 0 ? 7 : 3 });
      }
      const phone = new THREE.Group(); phone.position.set(1.7, 1.06, 0.5); scene.add(phone);
      mesh(new THREE.BoxGeometry(0.8, 0.25, 0.6), std(0x111111, { roughness: 0.4 }), [0, 0.12, 0], phone);
      const handset = mesh(new THREE.CapsuleGeometry(0.08, 0.6, 6, 12), std(0x111111), [0, 0.32, 0], phone); handset.rotation.z = Math.PI / 2;
      const clock = K.div(b.layer, `right:7%;top:9%;font:500 3.2em 'Plex Mono',monospace;color:#ff4a3d;letter-spacing:.06em;opacity:1`, '02:00');
      const scrLight = new THREE.PointLight(0x7dffb0, 30, 6, 1.5); scrLight.position.set(0, 1.9, 0.6); scene.add(scrLight);
      const lamp = new THREE.SpotLight(0xffd59a, 140, 6, 0.6, 0.6, 2); lamp.position.set(-2, 2.6, 0.6); lamp.target.position.set(-0.6, 1, 0.3); scene.add(lamp, lamp.target); lamp.castShadow = true;
      scene.add(new THREE.HemisphereLight(0x223344, 0x050505, 0.25));
      return { ...b, update(t, p) {
        screens.forEach(s => { const x = s.x; x.fillStyle = '#031208'; x.fillRect(0, 0, 512, 384); x.strokeStyle = '#1f6b3c'; x.lineWidth = 2; const r = K.rng(s.seed);
          const pts = Array.from({ length: 9 }, () => [40 + r() * 430, 40 + r() * 300]); x.beginPath(); pts.forEach(([a, c], i) => i ? x.lineTo(a, c) : x.moveTo(a, c)); x.stroke();
          pts.forEach(([a, c], i) => { x.fillStyle = i === Math.floor(t * 2) % 9 ? '#ff4a3d' : '#7dffb0'; x.fillRect(a - 4, c - 4, 8, 8); });
          x.fillStyle = '#7dffb0'; x.font = '18px "Plex Mono"'; for (let i = 0; i < 5; i++) x.fillText(`LOAD ${4180 + i * 7 + s.seed}  ${['IN TRANSIT', 'DELAYED', 'BROKEN DOWN', 'REROUTED', 'DELIVERED'][(i + Math.floor(t)) % 5]}`, 20, 30 + i * 22);
          s.tex.needsUpdate = true; });
        handset.position.y = 0.32 + (Math.floor(t * 12) % 2) * 0.012 * (Math.sin(t * 2) > 0 ? 1 : 0);
        camOrbit(camera, { r: 5.2, a0: -0.25, a1: 0.15, y0: 2.2, y1: 1.9, target: [0, 1.6, -0.2], p, t });
      } };
    },

    // ---------- chess: Thiel plays long games ----------
    chess(ctx, shot) {
      const b = base(ctx, { floor: 0x0f0f0f, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const sq = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1 }), 64); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 64; i++) { m4.makeTranslation((i % 8) - 3.5, 0.1, Math.floor(i / 8) - 3.5); sq.setMatrixAt(i, m4); sq.setColorAt(i, new THREE.Color(((i % 8) + Math.floor(i / 8)) % 2 ? 0x1a1a1a : 0xd8d0be)); }
      sq.receiveShadow = true; scene.add(sq);
      const piece = (h, crown) => { const pts = [[0.38, 0], [0.38, 0.1], [0.24, 0.2], [0.16, h * 0.5], [0.22, h * 0.8], [0.12, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)); const g = new THREE.Group();
        mesh(new THREE.LatheGeometry(pts, 32), null, [0, 0, 0], g); if (crown) mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), null, [0, h + 0.12, 0], g); return g; };
      const black = std(0x111111, { roughness: 0.25, metalness: 0.3 }), white = std(0xe8e0cc, { roughness: 0.3 });
      const set = (g, m) => g.traverse(o => { if (o.isMesh) o.material = m; });
      const king = piece(1.5, true); set(king, black); king.position.set(0.5, 0.2, 0.5); scene.add(king);
      const r = K.rng(5); for (let i = 0; i < 9; i++) { const pw = piece(0.7 + r() * 0.4, false); set(pw, i % 2 ? white : black); pw.position.set(Math.floor(r() * 8) - 3.5, 0.2, Math.floor(r() * 8) - 3.5); scene.add(pw); }
      lit(scene, { pos: [0.5, 12, 3], target: [0.5, 0, 0.5], intensity: 1300, radius: 2.4, angle: 0.25 });
      return { ...b, update(t, p) { camOrbit(camera, { r: P0.close ? 4.5 : 8, a0: -0.8, a1: -0.2, y0: 1.2, y1: 2.2, target: [0.5, 0.9, 0.5], p, t }); } };
    },

    // ---------- newspapers ----------
    press(ctx, shot) {
      const b = base(ctx, { floor: 0x151515, density: 0.03, fov: 32 }); const { scene, camera } = b; const P0 = shot.params;
      const newsTex = canvasTex(512, 700, (x, w, h) => { x.fillStyle = '#e4ddcc'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = '700 58px "Instrument Serif"'; x.textAlign = 'center'; x.fillText(P0.masthead ?? 'The Daily Record', w / 2, 70);
        x.fillRect(20, 90, w - 40, 3); x.font = '700 40px "Archivo Narrow"'; x.fillText(P0.headline ?? 'AI FIRMS RACE FOR DATA', w / 2, 150); fakeText(x, w, h, { seed: 4, lines: 26, margin: 30, lh: 20 }); });
      const pm = new THREE.MeshStandardMaterial({ map: newsTex, roughness: 0.95, side: THREE.DoubleSide });
      const r = K.rng(9); for (let i = 0; i < 18; i++) { const m = mesh(new THREE.BoxGeometry(2.6, 0.04, 3.5), [std(0xd8d0c0), std(0xd8d0c0), pm, std(0xd8d0c0), std(0xd8d0c0), std(0xd8d0c0)], [(r() - 0.5) * 0.2, 0.02 + i * 0.045, (r() - 0.5) * 0.2], scene); m.rotation.y = (r() - 0.5) * 0.15; }
      const falling = []; for (let i = 0; i < 14; i++) { const m = mesh(new THREE.PlaneGeometry(2.6, 3.5), pm, [0, 0, 0], scene); falling.push({ m, x: (r() - 0.5) * 12, z: (r() - 0.5) * 8 - 2, s: r(), ph: r() * 6 }); }
      lit(scene, { pos: [-2, 14, 5], target: [0, 0, 0], intensity: 2600, radius: 6 });
      return { ...b, update(t, p) {
        falling.forEach(f => { const y = 12 - ((t * (0.8 + f.s) + f.ph * 3) % 14); f.m.position.set(f.x + Math.sin(t + f.ph) * 0.6, y, f.z); f.m.rotation.set(t * 0.6 + f.ph, t * 0.3, f.ph); });
        camOrbit(camera, { r: 9, a0: 0.2, a1: -0.2, y0: 4, y1: 3, target: [0, 1, 0], p, t });
      } };
    },

    // ---------- speech bubbles: the internet talking ----------
    bubbles(ctx, shot) {
      const b = base(ctx, { floor: null, fog: 0x050508, density: 0.025, fov: 38 }); const { scene, camera } = b;
      const shape = new THREE.Shape(); const w = 2.4, h = 1.3, rr = 0.35; shape.moveTo(-w / 2 + rr, -h / 2); shape.lineTo(w / 2 - rr, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rr);
      shape.lineTo(w / 2, h / 2 - rr); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2); shape.lineTo(-w / 2 + rr, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rr);
      shape.lineTo(-w / 2, -h / 2 + rr); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2); shape.moveTo(-0.6, -h / 2); shape.lineTo(-0.9, -h / 2 - 0.5); shape.lineTo(-0.2, -h / 2);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
      const mats = [0xff5a1f, 0xe8e2d6, 0x9aa3ad, 0x6b7680].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
      const r = K.rng(12); const items = []; for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(geo, mats[i % 9 === 0 ? 0 : 1 + (i % 3)]); scene.add(m); items.push({ m, x: (r() - 0.5) * 30, z: -r() * 30, s: 0.4 + r() * 0.6, ph: r() * 20 }); }
      scene.add(new THREE.HemisphereLight(0xaabbcc, 0x111111, 1.1)); const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(5, 10, 8); scene.add(d);
      return { ...b, update(t, p) {
        items.forEach(it => { it.m.position.set(it.x, ((it.ph + t * it.s) % 20) - 10, it.z); it.m.rotation.set(Math.sin(t * 0.3 + it.ph) * 0.2, Math.sin(t * 0.2 + it.ph) * 0.5, 0); });
        camera.position.set(Math.sin(t * 0.1) * 2, 0, 14); camera.lookAt(0, 0, -10);
      } };
    },

    // ---------- padlock ----------
    lock(ctx, shot) {
      const b = base(ctx, { floor: 0x161616, density: 0.03, fov: 28 }); const { scene, camera } = b; const P0 = shot.params;
      const brass = std(0xb08d4a, { metalness: 1, roughness: 0.25 }), steel = std(0xc0c4c8, { metalness: 1, roughness: 0.2 });
      mesh(new THREE.BoxGeometry(2.4, 2.2, 1, 4, 4, 4), brass, [0, 1.3, 0], scene);
      const kh = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 20), std(0x111111), [0, 1.1, 0.51], scene); kh.rotation.x = Math.PI / 2;
      const shackle = mesh(new THREE.TorusGeometry(0.8, 0.16, 16, 48, Math.PI), steel, [0, 2.4, 0], scene);
      const legs = [-0.8, 0.8].map(x => mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 16), steel, [x, 2.2, 0], scene));
      lit(scene, { pos: [-3, 10, 6], target: [0, 1.5, 0], intensity: 1400, radius: 3 });
      const rim = new THREE.SpotLight(0x9fb7ff, 300, 0, 0.6, 1, 2); rim.position.set(4, 4, -6); rim.target.position.set(0, 1.5, 0); scene.add(rim, rim.target);
      const t0 = P0.word ? wt(shot, P0.word) : shot.duration * 0.5; const closing = P0.close !== false;
      return { ...b, update(t, p) {
        const k = K.outCubic(K.range(t, t0, t0 + 0.35)); const up = closing ? K.lerp(0.7, 0, k) : K.lerp(0, 0.7, k);
        shackle.position.y = 2.4 + up; legs.forEach(l => { l.position.y = 2.2 + up; });
        camOrbit(camera, { r: 9, a0: -0.4, a1: 0.25, y0: 1.8, y1: 2.4, target: [0, 1.7, 0], p, t });
      } };
    },

    // ---------- balance scale ----------
    balance(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const brass = std(0xb08d4a, { metalness: 1, roughness: 0.3 });
      mesh(new THREE.CylinderGeometry(0.12, 0.2, 5, 16), brass, [0, 2.5, 0], scene); mesh(new THREE.CylinderGeometry(1, 1.2, 0.3, 32), brass, [0, 0.15, 0], scene);
      const beam = new THREE.Group(); beam.position.y = 5; scene.add(beam); mesh(new THREE.BoxGeometry(6, 0.14, 0.14), brass, [0, 0, 0], beam);
      const pans = [-3, 3].map(x => { const g = new THREE.Group(); beam.add(g); g.position.x = x; mesh(new THREE.CylinderGeometry(0.01, 0.01, 2, 4), brass, [0, -1, 0], g);
        mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.12, 32), brass, [0, -2, 0], g); return g; });
      const coins = P.coins(); coins.scale.setScalar(0.35); coins.position.y = -1.94; pans[0].add(coins);
      const folder = P.folder(); folder.scale.setScalar(0.3); folder.position.y = -1.94; pans[1].add(folder);
      lit(scene, { pos: [0, 14, 6], target: [0, 3, 0], intensity: 2400, radius: 5 });
      return { ...b, update(t, p) {
        const tilt = K.lerp(P0.from ?? 0.15, P0.to ?? -0.15, K.inOut(K.range(p, 0.2, 0.8))) + Math.sin(t * 2) * 0.01;
        beam.rotation.z = tilt; pans.forEach(g => { g.rotation.z = -tilt; });
        camOrbit(camera, { r: 13, a0: -0.2, a1: 0.2, y0: 3.4, y1: 3.8, target: [0, 3.4, 0], p, t });
      } };
    },

    // ---------- gold rush mine cart full of glowing data crystals ----------
    mine(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1510, fog: 0x060402, density: 0.04, fov: 36 }); const { scene, camera } = b; const P0 = shot.params;
      const wood = std(0x3b2414, { roughness: 0.8 }); const iron = std(0x2a2a2a, { metalness: 0.8, roughness: 0.4 });
      for (let z = 10; z > -60; z -= 1) mesh(new THREE.BoxGeometry(2.4, 0.12, 0.3), wood, [0, 0.06, z], scene);
      for (const x of [-0.8, 0.8]) mesh(new THREE.BoxGeometry(0.1, 0.12, 70), iron, [x, 0.18, -25], scene);
      for (let z = 6; z > -60; z -= 6) { mesh(new THREE.BoxGeometry(0.3, 5, 0.3), wood, [-2.6, 2.5, z], scene); mesh(new THREE.BoxGeometry(0.3, 5, 0.3), wood, [2.6, 2.5, z], scene); mesh(new THREE.BoxGeometry(5.5, 0.35, 0.35), wood, [0, 5, z], scene);
        const lan = new THREE.PointLight(0xffa860, 30, 9, 1.6); lan.position.set(2.2, 4.2, z); scene.add(lan); mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }), [2.2, 4.2, z], scene); }
      const cart = new THREE.Group(); scene.add(cart); mesh(new THREE.BoxGeometry(1.9, 1.1, 2.6), iron, [0, 0.95, 0], cart);
      for (const x of [-0.8, 0.8]) for (const z of [-0.9, 0.9]) { const w = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16), iron, [x, 0.35, z], cart); w.rotation.z = Math.PI / 2; }
      const crystM = new THREE.MeshStandardMaterial({ color: 0x7fd8ff, emissive: P0.color ?? 0x3aa8ff, emissiveIntensity: 1.6, roughness: 0.2 });
      const r = K.rng(3); for (let i = 0; i < 22; i++) { const c = mesh(new THREE.OctahedronGeometry(0.22 + r() * 0.18), crystM, [(r() - 0.5) * 1.5, 1.55 + r() * 0.4, (r() - 0.5) * 2.1], cart); c.rotation.set(r() * 3, r() * 3, r() * 3); }
      const glow = new THREE.PointLight(P0.color ?? 0x3aa8ff, 60, 8, 1.5); glow.position.y = 2.2; cart.add(glow);
      return { ...b, update(t, p) {
        const z = K.lerp(2, -14, p); cart.position.z = z; cart.position.y = Math.abs(Math.sin(t * 7)) * 0.02;
        const h = K.handheld(t, 0.05, 2); camera.position.set(1.2 + h.x, 1.8 + h.y, z + 6); camera.lookAt(0, 1.2, z - 8);
      } };
    },

    // ---------- globe with data arcs ----------
    globe(ctx, shot) {
      const b = base(ctx, { floor: null, fog: 0x020306, density: 0.01, fov: 32 }); const { scene, camera } = b; const P0 = shot.params;
      const g = new THREE.Group(); scene.add(g);
      const dots = new THREE.BufferGeometry(); const N = 5000, pos = new Float32Array(N * 3); const r = K.rng(7);
      for (let i = 0; i < N; i++) { const u = r() * 2 - 1, th = r() * Math.PI * 2; const s = Math.sqrt(1 - u * u); const v = [s * Math.cos(th) * 5, u * 5, s * Math.sin(th) * 5];
        const land = Math.sin(v[0] * 0.9) * Math.cos(v[1] * 1.1) + Math.sin(v[2] * 0.7 + v[1]) > 0.35; if (!land) { pos.set([0, 0, 0], i * 3); continue; } pos.set(v, i * 3); }
      dots.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(dots, new THREE.PointsMaterial({ color: 0x9fb2c8, size: 0.05 })));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(4.95, 64, 48), new THREE.MeshBasicMaterial({ color: 0x05070c })));
      const arcs = []; const hub = new THREE.Vector3(1.5, 2.5, 4).normalize().multiplyScalar(5);
      for (let i = 0; i < 26; i++) { const a = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.2).normalize().multiplyScalar(5); const mid = a.clone().add(hub).multiplyScalar(0.5).normalize().multiplyScalar(6.6 + r());
        const curve = new THREE.QuadraticBezierCurve3(a, mid, hub); const geo = new THREE.TubeGeometry(curve, 48, 0.02, 6); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i % 6 === 0 ? 0xff4a3d : 0xffc890, transparent: true, opacity: 0.85 }));
        m.geometry.setDrawRange(0, 0); g.add(m); arcs.push({ m, d: r() * 3, n: geo.index.count }); }
      return { ...b, update(t, p) {
        g.rotation.y = -0.4 + t * 0.06; arcs.forEach(a => { const k = K.range(t, a.d * 0.6, a.d * 0.6 + 1.5); a.m.geometry.setDrawRange(0, Math.floor(a.n * k / 6) * 6); });
        camera.position.set(0, K.lerp(3, 1.5, p), K.lerp(19, 15, p)); camera.lookAt(0, 0, 0);
      } };
    },

    // ---------- crowd of contractors at laptops ----------
    crowd(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.035, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 10), std(0x3a3d42, { roughness: 0.6 }), 240);
      const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 14, 10), std(0x3a3d42, { roughness: 0.6 }), 240);
      const scr = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ color: 0xbfe0ff }), 240);
      const desk = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.06, 0.6), std(0x2a2520), 240);
      const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); let i = 0;
      for (let x = -7; x <= 7; x++) for (let z = 0; z < 16; z++) { const px = x * 1.6, pz = -z * 1.8;
        m4.makeTranslation(px, 0.75, pz); body.setMatrixAt(i, m4); m4.makeTranslation(px, 1.42, pz); head.setMatrixAt(i, m4);
        m4.makeTranslation(px, 0.9, pz - 0.55); desk.setMatrixAt(i, m4); q.setFromEuler(new THREE.Euler(-0.2, Math.PI, 0)); m4.compose(new THREE.Vector3(px, 1.15, pz - 0.75), q, new THREE.Vector3(1, 1, 1)); scr.setMatrixAt(i, m4); i++; }
      [body, head, scr, desk].forEach(m => { m.count = i; scene.add(m); });
      lit(scene, { pos: [0, 16, 4], target: [0, 0, -4], intensity: 2600, radius: 8, angle: 0.4 });
      scene.add(new THREE.HemisphereLight(0x5577aa, 0x050505, 0.35));
      return { ...b, update(t, p) { const k = K.inOut(p); camera.position.set(K.lerp(-6, 6, k), K.lerp(7, 9, k), 9); camera.lookAt(0, 1, -10); } };
    },

    // ---------- APPROVED stamp ----------
    stamp(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1714, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const c = document.createElement('canvas'); c.width = 600; c.height = 780; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const paper = mesh(new THREE.PlaneGeometry(3.6, 4.68), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), [0, 0.01, 0], scene); paper.rotation.x = -Math.PI / 2; paper.rotation.z = 0.05;
      const st = new THREE.Group(); scene.add(st); const wood = std(0x4a2a17, { roughness: 0.5 });
      mesh(new THREE.BoxGeometry(1.8, 0.25, 0.9), std(0x111111), [0, 0.12, 0], st); mesh(new THREE.BoxGeometry(1.6, 0.3, 0.7), wood, [0, 0.4, 0], st); mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 16), wood, [0, 1.1, 0], st); mesh(new THREE.SphereGeometry(0.35, 16, 12), wood, [0, 1.8, 0], st);
      lit(scene, { pos: [-2, 12, 4], target: [0, 0, 0], intensity: 900, radius: 4 });
      const t0 = P0.word ? wt(shot, P0.word) : shot.duration * 0.45; let stamped = -1;
      return { ...b, update(t, p) {
        const down = K.range(t, t0 - 0.3, t0), up = K.range(t, t0 + 0.15, t0 + 0.6);
        st.position.set(0.4, t < t0 ? K.lerp(1.6, 0.02, K.inOut(down)) : K.lerp(0.02, 1.6, K.inOut(up)), 0.6); st.visible = !(t > t0 + 0.6);
        const s = t >= t0 ? 1 : 0; if (s !== stamped) { stamped = s; x.fillStyle = '#ebe4d4'; x.fillRect(0, 0, 600, 780); fakeText(x, 600, 780, { seed: 31, lines: 26, margin: 50 });
          if (s) { x.save(); x.translate(330, 470); x.rotate(-0.12); x.strokeStyle = '#c41e16'; x.lineWidth = 8; x.strokeRect(-190, -55, 380, 110); x.fillStyle = '#c41e16'; x.font = '700 84px "Archivo Narrow"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(P0.text ?? 'APPROVED', 0, 4); x.restore(); }
          tex.needsUpdate = true; }
        camera.position.set(K.lerp(-1, 0.5, p), K.lerp(7.5, 6.6, p), 4.2); camera.lookAt(0.2, 0, 0.2);
      } };
    },

    // ---------- digital clock / time running ----------
    clock(ctx, shot) {
      const b = base(ctx, { floor: 0x101010, density: 0.03, fov: 30 }); const { scene, camera, layer } = b; const P0 = shot.params;
      const face = mesh(new THREE.CylinderGeometry(3, 3, 0.3, 96), std(0xe8e0cc, { roughness: 0.6 }), [0, 4, 0], scene); face.rotation.x = Math.PI / 2;
      mesh(new THREE.TorusGeometry(3.05, 0.18, 16, 96), std(0x1a1a1a, { metalness: 0.7, roughness: 0.3 }), [0, 4, 0.1], scene);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; mesh(new THREE.BoxGeometry(0.08, i % 3 ? 0.3 : 0.55, 0.05), std(0x111111), [Math.sin(a) * 2.6, 4 + Math.cos(a) * 2.6, 0.18], scene).rotation.z = -a; }
      const hand = (len, w, c) => { const g = new THREE.Group(); g.position.set(0, 4, 0.22); scene.add(g); mesh(new THREE.BoxGeometry(w, len, 0.04), std(c), [0, len / 2 - 0.2, 0], g); return g; };
      const hh = hand(1.6, 0.12, 0x111111), mh = hand(2.4, 0.08, 0x111111), sh = hand(2.5, 0.03, RED);
      lit(scene, { pos: [-3, 12, 8], target: [0, 4, 0], intensity: 1800, radius: 3.5 });
      const speed = P0.fast ? 120 : 6;
      return { ...b, update(t, p) {
        const m = t * speed; sh.rotation.z = -m * 0.1 * Math.PI * 2 / 6; mh.rotation.z = -m / 60 * Math.PI * 2; hh.rotation.z = -m / 720 * Math.PI * 2 - 1.2;
        camOrbit(camera, { r: 10, a0: -0.5, a1: -0.2, y0: 3.2, y1: 4.2, target: [0, 4, 0], p, t });
      } };
    },

    // ---------- light tunnel: speed ----------
    tunnel(ctx, shot) {
      const b = base(ctx, { floor: null, fog: 0x000000, density: 0.03, fov: 50 }); const { scene, camera } = b; const P0 = shot.params;
      const rings = []; const c1 = new THREE.Color(P0.color ?? 0x9fc4ff);
      for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(4, 0.03, 6, 6), new THREE.MeshBasicMaterial({ color: i % 9 === 0 ? 0xff4a3d : c1 })); m.rotation.z = i * 0.06; scene.add(m); rings.push(m); }
      return { ...b, update(t, p) {
        const sp = 18 * (P0.speed ?? 1); rings.forEach((m, i) => { m.position.z = -((i * 2 - t * sp) % 120 + 120) % 120; m.rotation.z = i * 0.06 + t * 0.2; });
        camera.position.set(Math.sin(t * 0.7) * 0.4, Math.cos(t * 0.5) * 0.4, 2); camera.lookAt(0, 0, -50); camera.rotation.z = Math.sin(t * 0.3) * 0.1;
      } };
    },

    // ---------- falling dominoes ----------
    dominoes(ctx, shot) {
      const b = base(ctx, { floor: 0x161616, density: 0.03, fov: 32 }); const { scene, camera } = b; const P0 = shot.params;
      const ds = []; for (let i = 0; i < 26; i++) { const g = new THREE.Group(); const a = i * 0.16; g.position.set(Math.sin(a) * 3 + i * 0.55 - 7, 0, Math.cos(a) * 1.5); g.rotation.y = Math.atan2(Math.cos(a) * 0.48, 0.55); scene.add(g);
        mesh(new THREE.BoxGeometry(0.16, 1.4, 0.7), std(i === 25 ? RED : 0xe8e0cc, { roughness: 0.4 }), [0, 0.7, 0], g); ds.push(g); }
      lit(scene, { pos: [0, 16, 6], target: [0, 0, 0], intensity: 3000, radius: 8 });
      const t0 = P0.word ? wt(shot, P0.word) : 0.6;
      return { ...b, update(t, p) {
        ds.forEach((g, i) => { const ti = t0 + i * 0.11; g.children[0].rotation.z = 0; g.rotation.z = 0; g.children[0].position.set(0, 0.7, 0);
          const k = K.range(t, ti, ti + 0.18); const ang = -1.25 * K.smooth(k); g.children[0].rotation.z = ang; g.children[0].position.set(Math.sin(-ang) * 0.7, Math.cos(ang) * 0.7, 0); });
        camOrbit(camera, { r: 14, a0: 0.6, a1: 0.3, y0: 5, y1: 3.5, target: [0, 0.6, 0], p, t });
      } };
    },

    // ---------- courtroom ----------
    court(ctx, shot) {
      const b = base(ctx, { floor: 0x1c1712, density: 0.03, fov: 34 }); const { scene, camera } = b;
      const wood = std(0x3b2414, { roughness: 0.45 });
      mesh(new THREE.BoxGeometry(8, 2.6, 1.6), wood, [0, 1.3, -8], scene); mesh(new THREE.BoxGeometry(8.4, 0.2, 2), wood, [0, 2.7, -8], scene);
      const chair = mesh(new THREE.BoxGeometry(1.4, 3.4, 0.4), std(0x0e0e0e), [0, 3, -9.2], scene);
      for (let r = 0; r < 6; r++) for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(4.2, 0.12, 0.8), wood, [s * 3, 0.9, -2 + r * 2.2], scene); mesh(new THREE.BoxGeometry(4.2, 1.0, 0.12), wood, [s * 3, 1.4, -1.6 + r * 2.2], scene); }
      const gv = P.gavel(); gv.scale.setScalar(0.35); gv.position.set(1.8, 2.8, -7.8); scene.add(gv);
      lit(scene, { pos: [0, 14, -2], target: [0, 2, -8], intensity: 3400, radius: 6, angle: 0.35 });
      const win = new THREE.SpotLight(0xd8e4ff, 700, 0, 0.3, 0.5, 1.5); win.position.set(-14, 10, -4); win.target.position.set(0, 0, 0); scene.add(win, win.target);
      return { ...b, update(t, p) { const k = K.inOut(p); camera.position.set(K.lerp(1, -1, k), 2.6, K.lerp(12, 7, k)); camera.lookAt(0, 2.4, -8); } };
    },

    // ---------- card terminal: payments ----------
    terminal(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      mesh(new THREE.BoxGeometry(1.6, 0.5, 3), std(0x1c1c1e, { roughness: 0.35 }), [0, 0.25, 0], scene);
      const scr = mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: tex }), [0, 0.52, -0.6], scene); scr.rotation.x = -Math.PI / 2 + 0.3;
      for (let i = 0; i < 12; i++) mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), std(0x3a3a3c), [-0.38 + (i % 3) * 0.38, 0.52, 0.2 + Math.floor(i / 3) * 0.3], scene);
      const card = mesh(new THREE.BoxGeometry(1.0, 0.02, 1.6), std(0x8a8f95, { metalness: 0.7, roughness: 0.3 }), [0, 0.6, 2.2], scene);
      lit(scene, { pos: [-2, 9, 4], target: [0, 0, 0], intensity: 1400, radius: 3, color: P0.red ? 0xff8070 : 0xfff0dc });
      return { ...b, update(t, p) {
        const k = K.inOut(K.range(p, 0.1, 0.5)); card.position.z = K.lerp(3.2, 1.5, k);
        const msg = p < 0.5 ? 'PROCESSING' : (P0.red ? 'FLAGGED' : 'APPROVED'); x.fillStyle = '#0a1410'; x.fillRect(0, 0, 256, 192); x.fillStyle = p < 0.5 ? '#9fe0b8' : (P0.red ? '#ff4a3d' : '#7dffb0');
        x.font = '700 30px "Plex Mono"'; x.textAlign = 'center'; x.fillText(msg, 128, 100); tex.needsUpdate = true;
        camOrbit(camera, { r: 5, a0: -0.5, a1: -0.2, y0: 3, y1: 2.4, target: [0, 0.4, 0.4], p, t });
      } };
    },

    // ---------- signing a contract ----------
    contract(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1714, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const c = document.createElement('canvas'); c.width = 600; c.height = 780; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const paper = mesh(new THREE.PlaneGeometry(3.6, 4.68), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), [0, 0.01, 0], scene); paper.rotation.x = -Math.PI / 2;
      const pen = new THREE.Group(); scene.add(pen); pen.traverse?.(o => { o.castShadow = false; }); mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.6, 16), std(0x111111, { metalness: 0.6, roughness: 0.2 }), [0, 0.8, 0], pen); mesh(new THREE.ConeGeometry(0.04, 0.15, 12), std(0xb08d4a, { metalness: 1 }), [0, -0.07, 0], pen).rotation.x = Math.PI;
      lit(scene, { pos: [-2, 12, 4], target: [0, 0, 0], intensity: 900, radius: 4 });
      const sig = Array.from({ length: 80 }, (_, i) => { const u = i / 79; return [150 + u * 300, 640 + Math.sin(u * 23) * 18 * (1 - u * 0.5) + Math.sin(u * 7) * 10]; });
      return { ...b, update(t, p) {
        const k = K.range(p, 0.15, 0.8); x.fillStyle = '#ebe4d4'; x.fillRect(0, 0, 600, 780); x.fillStyle = '#222'; x.font = '700 30px "Archivo Narrow"'; x.fillText(P0.title ?? 'DATA PARTNERSHIP AGREEMENT', 50, 70);
        fakeText(x, 600, 560, { seed: 44, lines: 20, margin: 50 }); x.fillStyle = '#555'; x.fillRect(140, 680, 330, 2); x.font = '14px "Plex Mono"'; x.fillText('AUTHORIZED SIGNATURE', 140, 700);
        const n = Math.floor(sig.length * k); x.strokeStyle = '#13235a'; x.lineWidth = 4; x.beginPath(); sig.slice(0, n).forEach(([a, bb], i) => i ? x.lineTo(a, bb) : x.moveTo(a, bb)); x.stroke(); tex.needsUpdate = true;
        const tip = sig[Math.max(0, n - 1)]; pen.position.set((tip[0] / 600 - 0.5) * 3.6, 0.02, (tip[1] / 780 - 0.5) * 4.68); pen.rotation.set(-0.5, 0, -0.4); pen.visible = k > 0 && k < 1;
        camera.position.set(K.lerp(-0.6, 0.6, p), 4.4, 3.8); camera.lookAt(0, 0, 0.9);
      } };
    },

    // ---------- magnifying glass over records ----------
    magnifier(ctx, shot) {
      const b = base(ctx, { floor: 0x161412, density: 0.03, fov: 30 }); const { scene, camera } = b;
      const pages = canvasTex(1024, 768, (x, w, h) => { x.fillStyle = '#e8e1d0'; x.fillRect(0, 0, w, h); fakeText(x, w, h, { seed: 61, lines: 34, margin: 40 }); x.strokeStyle = '#c41e16'; x.lineWidth = 4; x.strokeRect(520, 330, 160, 30); });
      const desk = mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: pages, roughness: 0.9 }), [0, 0.01, 0], scene); desk.rotation.x = -Math.PI / 2;
      const mg = new THREE.Group(); scene.add(mg);
      mesh(new THREE.TorusGeometry(0.9, 0.08, 16, 64), std(0x111111, { metalness: 0.6, roughness: 0.3 }), [0, 0, 0], mg).rotation.x = Math.PI / 2;
      const lens = mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.04, 48), new THREE.MeshBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.12, depthWrite: false }), [0, 0, 0], mg); lens.castShadow = false;
      const hnd = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.8, 16), std(0x3a2414), [1.6, 0, 0.3], mg); hnd.rotation.z = Math.PI / 2; hnd.rotation.y = -0.3;
      lit(scene, { pos: [-2, 10, 3], target: [0, 0, 0], intensity: 1600, radius: 4 });
      return { ...b, update(t, p) {
        mg.position.set(K.lerp(-2, 0.6, K.inOut(p)) + Math.sin(t * 0.7) * 0.2, 0.9, K.lerp(-1, 0.4, K.inOut(p)));
        camera.position.set(0.3, 5.5, 3.6); camera.lookAt(0, 0, 0.2);
      } };
    },

    // ---------- pallets of cash ----------
    cash(ctx, shot) {
      const b = base(ctx, { floor: 0x161616, density: 0.03, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      const bill = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#c9d2bf'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4b5d47'; x.lineWidth = 5; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#b8a77a'; x.fillRect(110, 0, 36, h); x.fillStyle = '#4b5d47'; x.font = '700 40px "Archivo Narrow"'; x.fillText('100', 20, 60); });
      const brick = new THREE.MeshStandardMaterial({ map: bill, roughness: 0.8 });
      const n = P0.pallets ?? 6; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.3, 0.3), brick, n * 200); const m4 = new THREE.Matrix4(); let k = 0;
      for (let pl = 0; pl < n; pl++) { const px = (pl % 3 - 1) * 3.2, pz = -Math.floor(pl / 3) * 3.4; mesh(new THREE.BoxGeometry(2.6, 0.2, 2.6), std(0x6b5236), [px, 0.1, pz], scene);
        for (let y = 0; y < 8; y++) for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 8; iz++) { if (k >= n * 200) break; m4.makeTranslation(px - 0.95 + ix * 0.63, 0.35 + y * 0.31, pz - 1.05 + iz * 0.3); im.setMatrixAt(k++, m4); } }
      im.count = k; im.castShadow = im.receiveShadow = true; scene.add(im);
      lit(scene, { pos: [0, 16, 6], target: [0, 0, -2], intensity: 3600, radius: 7 });
      return { ...b, update(t, p) { camOrbit(camera, { r: 15, a0: P0.flip ? 0.5 : -0.5, a1: P0.flip ? 0.2 : -0.2, y0: 7, y1: 4.5, target: [0, 1.2, -1.7], p, t }); } };
    },

    // ---------- two buildings joined: an acquisition ----------
    merge(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.025, fov: 32 }); const { scene, camera } = b;
      const winTex = canvasTex(128, 256, (x, w, h) => { x.fillStyle = '#1a1c20'; x.fillRect(0, 0, w, h); for (let y = 8; y < h; y += 20) for (let c = 8; c < w; c += 18) { x.fillStyle = '#ffcf8a'; x.fillRect(c, y, 10, 12); } });
      const bm = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.6 });
      const a = mesh(new THREE.BoxGeometry(3, 8, 3), bm, [-4, 4, 0], scene), c = mesh(new THREE.BoxGeometry(3, 5, 3), bm, [4, 2.5, 0], scene);
      const bridge = mesh(new THREE.BoxGeometry(1, 1, 2), std(RED, { emissive: 0x3a0503 }), [0, 3, 0], scene);
      lit(scene, { pos: [0, 18, 8], target: [0, 2, 0], intensity: 3000, radius: 8 });
      return { ...b, update(t, p) { const k = K.outCubic(K.range(p, 0.2, 0.7)); bridge.scale.x = Math.max(0.01, k * 5); camOrbit(camera, { r: 20, a0: -0.5, a1: 0.2, y0: 6, y1: 8, target: [0, 3, 0], p, t }); } };
    },
  };
}
