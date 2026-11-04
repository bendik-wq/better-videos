// B-roll library: extra sets so an episode never shows the same visual twice.
// Each factory: (ctx, shot) => { scene, camera, layer, update(t, p) }. Params vary camera,
// light and content so the same set can appear more than once without looking repeated.
export function makeBroll(H) {
  const { THREE, K, C, base, mesh, std, camOrbit, caption, sourceLine, wt, vo0, voEnd, canvasTex, fakeText, P, CAP, SERIF, RED, PAPER, ease, nthOfSet } = H;
  const capOn = (el, text, t, a = 0.5) => { if (el) { el.style.opacity = 1; K.typeOn(el, text, K.range(t, a, a + 1.3)); } };
  // word-wrap for canvas text
  const wrap = (x, text, maxW) => { const out = []; let line = ''; for (const w of String(text).split(' ')) { const tr = line ? line + ' ' + w : w; if (x.measureText(tr).width > maxW && line) { out.push(line); line = w; } else line = tr; } if (line) out.push(line); return out; };
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

    // ---------- night city ----------
    // 'drone': a banking run down the avenue (AI arrives, every company wants in).
    // 'lightsoff': September 11. A still, wide, eye-level skyline in sodium haze; the windows go dark
    //   building by building from the far side toward camera while the camera barely breathes in.
    city(ctx, shot) {
      const P0 = shot.params; const off = P0.mode === 'lightsoff';
      const b = base(ctx, { floor: 0x0b0c0e, fog: off ? 0x0a0806 : 0x03050a, density: off ? 0.016 : 0.012, fov: 36 }); const { scene, camera } = b;
      const winTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#0d0f12'; x.fillRect(0, 0, w, h); const r = K.rng(4);
        for (let y = 8; y < h; y += 22) for (let c = 8; c < w; c += 20) { const on = r() < 0.55; x.fillStyle = on ? (r() < 0.2 ? '#9fd8ff' : '#ffcf8a') : '#16191d'; x.fillRect(c, y, 12, 14); } });
      winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
      const mat = new THREE.MeshStandardMaterial({ color: 0x15171b, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 1.2, roughness: 0.7, map: winTex });
      const r = K.rng(P0.seed ?? 3); const N = 420; const geo = new THREE.BoxGeometry(1, 1, 1); const im = new THREE.InstancedMesh(geo, mat, N); const m4 = new THREE.Matrix4(); let i = 0;
      const dark = new Float32Array(N); // per building: the moment its lights go out (0..1 of the fade)
      for (let gx = -14; gx <= 14; gx++) for (let gz = -14; gz <= 1; gz++) { if (i >= N || r() < 0.08) continue;
        const hgt = 2 + Math.pow(r(), 2.4) * (Math.abs(gx) < 4 && gz < -4 ? 28 : 12); const w = 1.6 + r() * 1.4;
        m4.compose(new THREE.Vector3(gx * 3.6, hgt / 2, gz * 3.6), new THREE.Quaternion(), new THREE.Vector3(w, hgt, w)); im.setMatrixAt(i, m4);
        dark[i] = K.clamp((gz + 14) / 16 * 0.75 + r() * 0.25); i++; }
      im.count = i; scene.add(im);
      const aOn = new THREE.InstancedBufferAttribute(new Float32Array(N).fill(1), 1); geo.setAttribute('aOn', aOn);
      mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOn; varying float vOn;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOn = aOn;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vOn;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vOn;'); };
      scene.add(new THREE.HemisphereLight(off ? 0x6a4a30 : 0x334466, 0x050505, off ? 0.35 : 0.6));
      const moon = new THREE.DirectionalLight(off ? 0xffa860 : 0x8899cc, off ? 0.35 : 0.6); moon.position.set(-30, 40, 20); scene.add(moon);
      const lbl = caption(b.layer, P0.caption, 'left:6%;bottom:9%');
      const tOut = shot.words?.find(w => /eleventh/i.test(w.w))?.s ?? shot.duration * 0.4;
      return { ...b, update(t, p) {
        const k = ease(p);
        if (off) {
          const f = K.range(t, tOut - 0.6, shot.duration - 0.4);
          for (let j = 0; j < i; j++) aOn.array[j] = 1 - K.smooth(K.range(f, dark[j] * 0.85, dark[j] * 0.85 + 0.15)) * 0.97;
          aOn.needsUpdate = true;
          const h = K.handheld(t, 0.06, 11);
          camera.position.set(K.lerp(-5, -3.5, k) + h.x, 3 + h.y, K.lerp(40, 33, k)); camera.lookAt(-2, K.lerp(11, 10, k), -20); camera.rotation.z += h.r;
        } else { // drone run down the avenue between the towers, banking gently
          const z = K.lerp(30, -40, k), ph = P0.seed ?? 0, x = Math.sin(t * 0.25 + ph) * 3.5, bank = Math.cos(t * 0.25 + ph) * 0.08;
          camera.position.set(x, K.lerp(26, 9, k), z); camera.lookAt(x * 0.4, K.lerp(4, 6, k), z - 30); camera.rotation.z += bank; }
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
        // follow-through: lock onto one folder, travel with it, and push into the slot behind it
        const hero = -12 + ease(p) * 18.5, side = P0.flip ? -1 : 1, k2 = K.smooth(K.range(p, 0.55, 1));
        const h = K.handheld(t, 0.03, 4);
        camera.position.set(hero - K.lerp(3.2, 2.0, k2) + h.x, K.lerp(2.6, 2.1, k2) + h.y, side * K.lerp(3.4, 2.2, k2));
        camera.lookAt(hero + K.lerp(2, 3.5, k2), K.lerp(1.4, 1.8, k2), 0);
        items[0].f.position.set(Math.min(hero, 9.3), 1.36, 0); items[0].f.visible = hero < 9.3;
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
    // default: the pitch. Warm pendants, a row of seated investors in silhouette, push down the table.
    // 'empty': after the meeting. One pendant, chairs pushed back, a doodled pad, top-down drift.
    // 'night': the customer "in control". Lamps off, cold window light across an empty table, low truck.
    boardroom(ctx, shot) {
      const P0 = shot.params; const mode = P0.mode ?? 'pitch';
      const b = base(ctx, { floor: 0x1a1714, fog: mode === 'night' ? 0x03060c : 0x000000, density: 0.03, fov: 34 }); const { scene, camera } = b;
      const wood = std(0x2b1a10, { roughness: 0.35, metalness: 0.1 });
      mesh(new THREE.BoxGeometry(3, 0.12, 14), wood, [0, 1.5, 0], scene);
      for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(0.2, 1.5, 12), wood, [x * 1, 0.75, 0], scene);
      const leather = std(0x0e0e0e, { roughness: 0.45 }); const r = K.rng(mode === 'empty' ? 9 : 2);
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const ch = new THREE.Group(); const push = mode === 'empty' ? 0.3 + r() * 0.9 : 0;
        ch.position.set(s * (2.2 + push), 0, -5 + i * 2 + (mode === 'empty' ? (r() - 0.5) * 0.6 : 0)); ch.rotation.y = (s > 0 ? -Math.PI / 2 : Math.PI / 2) + (mode === 'empty' ? (r() - 0.5) * 0.7 : 0); scene.add(ch);
        mesh(new THREE.BoxGeometry(1, 0.15, 1), leather, [0, 1.0, 0], ch); mesh(new THREE.BoxGeometry(1, 1.3, 0.12), leather, [0, 1.7, -0.45], ch); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), std(0x777777, { metalness: 1 }), [0, 0.5, 0], ch); }
      const lampOn = mode === 'pitch' ? [1, 1, 1] : mode === 'empty' ? [0, 1, 0] : [0, 0, 0];
      for (let i = 0; i < 3; i++) { const z = -4 + i * 4; mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 6), std(0x222222), [0, 5.5, z], scene);
        mesh(new THREE.ConeGeometry(0.5, 0.4, 32, 1, true), std(0x1d1d1d, { side: THREE.DoubleSide }), [0, 4, z], scene);
        if (!lampOn[i]) continue;
        const l = new THREE.SpotLight(0xffd7a0, mode === 'empty' ? 420 : 320, 12, 0.7, 0.6, 2); l.position.set(0, 3.9, z); l.target.position.set(0, 1.5, z); scene.add(l, l.target); l.castShadow = i === 1;
        mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0xffe2b8 }), [0, 3.81, z], scene).rotation.x = Math.PI / 2; }
      const doc = P.folder(); doc.scale.setScalar(0.25); doc.position.set(0.3, 1.57, P0.docZ ?? 0); scene.add(doc);
      const people = [];
      if (mode === 'pitch') { // the investors, seated, unconvinced
        const seats = [[-1, -3], [1, -3], [-1, -1], [1, 1], [-1, 3]];
        seats.forEach(([sd, z], k) => { const c = C.character('UAL', { clip: k % 2 ? 'Sitting_Idle_Loop' : 'Sitting_Talking_Loop', phase: k * 1.3 });
          c.root.position.set(sd * 2.05, 0.42, z); c.root.rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(c.root); people.push(c); }); }
      if (mode === 'pitch') { const rim = new THREE.SpotLight(0x9fb7ff, 260, 0, 0.6, 0.8, 1.6); rim.position.set(0, 4.5, -11); rim.target.position.set(0, 1.4, 0); scene.add(rim, rim.target);
        K.lightShaft(scene, { pos: [0, 4.5, -11], target: [0, 0.5, 2], radius: 3, color: 0x9fb7ff, intensity: 0.03 }); }
      if (mode === 'empty') { // the doodle on the pad
        const pad = canvasTex(256, 340, (x, w, h) => { x.fillStyle = '#ece6d6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#9fb3c8'; for (let y = 30; y < h; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
          x.strokeStyle = '#1a1a3a'; x.lineWidth = 3; const rr = K.rng(5); x.beginPath(); for (let i = 0; i < 60; i++) { const a = i * 0.5, rad = 20 + i * 1.3; x.lineTo(128 + Math.cos(a) * rad * (0.8 + rr() * 0.2), 170 + Math.sin(a) * rad * 0.9); } x.stroke(); });
        const pm = mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshStandardMaterial({ map: pad, roughness: 0.9 }), [-0.6, 1.565, 0.4], scene); pm.rotation.x = -Math.PI / 2; pm.rotation.z = 0.3; }
      if (mode === 'night') { // the window wall: cold city light raking across the table
        const win = new THREE.SpotLight(0x9fc4ff, 1800, 0, 0.5, 0.7, 1.4); win.position.set(-12, 6, 2); win.target.position.set(1, 1.5, 0); win.castShadow = true; win.shadow.mapSize.set(1024, 1024); scene.add(win, win.target);
        K.lightShaft(scene, { pos: [-12, 6, 2], target: [1, 0, 0], radius: 5, color: 0x9fc4ff, intensity: 0.05 });
        for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.15, 8, 0.15), std(0x050505), [-6, 4, -6 + i * 4], scene); }
      scene.add(new THREE.HemisphereLight(mode === 'night' ? 0x223355 : 0x334455, 0x050505, 0.25));
      const cap = caption(b.layer, P0.caption, 'left:6%;top:8%');
      return { ...b, update(t, p) {
        const k = ease(p), h = K.handheld(t, 0.02, 3); people.forEach(c => c.update(t));
        if (mode === 'empty' || P0.cam === 'top') { camera.position.set(K.lerp(-4.2, -3.2, k), K.lerp(7.5, 6.2, k), K.lerp(4.5, 3.2, k)); camera.lookAt(-0.3, 1.5, K.lerp(0.6, 0.2, k)); }
        else if (mode === 'night') { camera.position.set(K.lerp(4.5, 2.5, k) + h.x, 1.75 + h.y, K.lerp(9, 6, k)); camera.lookAt(K.lerp(-0.5, -1.5, k), 1.5, -3); }
        else { camera.position.set(K.lerp(-0.5, 0.5, k) + h.x, 2.4 + h.y, K.lerp(12, 8.5, k)); camera.lookAt(0, 1.6, -4); }
        capOn(cap, P0.caption, t, 0.6);
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
        const k = ease(p);
        const h = K.handheld(t, 0.05, 7);
        if (P0.view === 'front') { const a = K.lerp(0.5, -0.4, k); camera.position.set(-1.6 + Math.sin(a) * 9, K.lerp(0.5, 1.4, k) + h.y, 4 + Math.cos(a) * 9); camera.lookAt(-1.6, 1.6, 0); }
        else if (P0.view === 'aerial') { const a = K.lerp(-0.8, 0.9, k); camera.position.set(-1.6 + Math.sin(a) * 16, K.lerp(22, 9, k), -6 + Math.cos(a) * 16); camera.lookAt(-1.6, 1, -6); }
        else { const a = K.lerp(Math.PI * 0.95, Math.PI * 0.45, k); camera.position.set(-1.6 + Math.sin(a) * 11 + h.x, K.lerp(1.2, 2.6, k) + h.y, -6 + Math.cos(a) * 11); camera.lookAt(-1.6, 1.8, -4); }
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

    // ---------- the page that broke it: a headline on a stack ----------
    // A filing (sub mentions a FORM / 10-K / S-1) is a white legal page set in mono; anything else is
    // newsprint with the headline in serif. The camera drifts down the page onto the headline.
    press(ctx, shot) {
      const b = base(ctx, { floor: 0x151515, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const filing = /10-K|FORM|S-1|FILING/i.test(P0.sub ?? '');
      const newsTex = canvasTex(1024, 1400, (x, w, h) => {
        x.fillStyle = filing ? '#f1eee6' : '#e4ddcc'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.textAlign = 'left';
        if (filing) { x.font = '500 26px "Plex Mono"'; x.fillText(P0.sub ?? '', 70, 90); x.fillRect(70, 110, w - 140, 2);
          fakeText(x, w, 420, { seed: 7, lines: 9, margin: 70, color: 'rgba(30,30,30,.7)' });
          x.font = '500 40px "Plex Mono"'; const L = wrap(x, P0.headline ?? '', w - 160); L.forEach((l, i) => x.fillText(l, 80, 520 + i * 56));
          x.fillStyle = 'rgba(224,36,27,.85)'; x.fillRect(64, 480, 6, L.length * 56 + 20);
          x.fillStyle = '#111'; x.save(); x.translate(0, 560 + L.length * 56); fakeText(x, w, 700, { seed: 8, lines: 15, margin: 70, color: 'rgba(30,30,30,.7)' }); x.restore(); }
        else { x.font = '500 24px "Plex Mono"'; x.fillText(P0.sub ?? '', 60, 80); x.fillRect(60, 100, w - 120, 3);
          x.font = '400 72px "Instrument Serif"'; const L = wrap(x, P0.headline ?? '', w - 120); L.forEach((l, i) => x.fillText(l, 60, 190 + i * 78));
          const y0 = 230 + L.length * 78; x.fillRect(60, y0 - 20, w - 120, 1);
          x.save(); x.translate(0, y0); for (let c = 0; c < 3; c++) { x.save(); x.translate(c * 300, 0); fakeText(x, 330, h - y0, { seed: 10 + c, lines: 30, margin: 60, lh: 26 }); x.restore(); } x.restore(); }
      });
      const pm = new THREE.MeshStandardMaterial({ map: newsTex, roughness: 0.95 });
      const r = K.rng(filing ? 3 : 9); const paper = std(0xd8d0c0, { roughness: 0.95 });
      for (let i = 0; i < 14; i++) { const m = mesh(new THREE.BoxGeometry(3.4, 0.03, 4.6), paper, [(r() - 0.5) * 0.5, 0.015 + i * 0.032, (r() - 0.5) * 0.5], scene); m.rotation.y = (r() - 0.5) * 0.25; }
      const top = mesh(new THREE.PlaneGeometry(3.4, 4.65), pm, [0, 0.47, 0], scene); top.rotation.x = -Math.PI / 2; top.rotation.z = filing ? -0.04 : 0.05;
      const key = filing ? [3, 9, 2] : [-3, 9, 3];
      K.keySpot(scene, { color: filing ? 0xeef4ff : 0xfff0dc, intensity: 900, pos: key, target: [0, 0, 0], angle: 0.45, penumbra: 0.8, shadow: 2048 });
      K.lightShaft(scene, { pos: key, target: [0, 0, 0], radius: 3, intensity: 0.04 });
      scene.add(new THREE.HemisphereLight(0x334455, 0x050505, 0.3));
      const src = sourceLine(b.layer, P0.source);
      return { ...b, update(t, p) {
        const k = ease(p), h = K.handheld(t, 0.01, 5);
        // headline sits in the top third of the page (page z ~ -1.3)
        if (filing) { camera.position.set(K.lerp(1.4, 0.6, k) + h.x, K.lerp(4.4, 3.4, k) + h.y, K.lerp(1.6, 0.9, k)); camera.lookAt(K.lerp(0.1, -0.1, k), 0.47, K.lerp(-0.6, -0.9, k)); }
        else { camera.position.set(K.lerp(-1.2, -0.3, k) + h.x, K.lerp(5.2, 3.9, k) + h.y, K.lerp(2.6, 1.0, k)); camera.lookAt(K.lerp(-0.2, 0, k), 0.47, K.lerp(-0.6, -1.25, k)); }
        if (src) src.style.opacity = K.range(t, 0.8, 1.4) * 0.9;
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
    // left / right label the pans; the beam drops toward the heavy (right) side on `word`.
    balance(ctx, shot) {
      const b = base(ctx, { floor: 0x141414, density: 0.03, fov: 30 }); const { scene, camera, layer } = b; const P0 = shot.params;
      const brass = std(0xb08d4a, { metalness: 1, roughness: 0.3 });
      mesh(new THREE.CylinderGeometry(0.12, 0.2, 5, 16), brass, [0, 2.5, 0], scene); mesh(new THREE.CylinderGeometry(1, 1.2, 0.3, 32), brass, [0, 0.15, 0], scene);
      const beam = new THREE.Group(); beam.position.y = 5; scene.add(beam); mesh(new THREE.BoxGeometry(6, 0.14, 0.14), brass, [0, 0, 0], beam);
      const pans = [-3, 3].map(x => { const g = new THREE.Group(); beam.add(g); g.position.x = x; mesh(new THREE.CylinderGeometry(0.01, 0.01, 2, 4), brass, [0, -1, 0], g);
        mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.12, 32), brass, [0, -2, 0], g); return g; });
      const folder = P.folder(); folder.scale.setScalar(0.3); folder.position.y = -1.94; pans[0].add(folder);
      const coins = P.coins(); coins.scale.setScalar(0.35); coins.position.y = -1.94; pans[1].add(coins);
      lit(scene, { pos: [0, 14, 6], target: [0, 3, 0], intensity: 2400, radius: 5 });
      const lbl = [P0.left, P0.right].map((tx, i) => tx ? K.div(layer, `width:14em;margin-left:-7em;text-align:center;font:700 2.6em 'Archivo Narrow',sans-serif;letter-spacing:.06em;color:${i ? '#ff4a3d' : PAPER}`, tx) : null);
      const tw = P0.word ? wt(shot, P0.word) : shot.duration * 0.4;
      const from = P0.from ?? 0.02, to = P0.to ?? -0.24;
      return { ...b, update(t, p) {
        const tilt = K.lerp(from, to, ease(K.range(t, tw - 0.2, tw + 1.6))) + Math.sin(t * 1.3) * 0.006;
        beam.rotation.z = tilt; pans.forEach(g => { g.rotation.z = -tilt; });
        camOrbit(camera, { r: 13, a0: -0.2, a1: 0.2, y0: 3.4, y1: 3.8, target: [0, 3.4, 0], p, t });
        const s = window.innerHeight / 1080;
        pans.forEach((g, i) => { if (!lbl[i]) return; const v = new THREE.Vector3(0, -2.4, 0); g.localToWorld(v); const [sx, sy] = K.toScreen(v, camera);
          lbl[i].style.left = sx * s + 'px'; lbl[i].style.top = (sy + 40) * s + 'px'; lbl[i].style.opacity = i ? K.range(t, tw - 0.1, tw + 0.3) : K.range(t, 0.4, 0.9); });
      } };
    },

    // ---------- gold rush mine cart    // ---------- gold rush mine cart full of glowing data crystals ----------
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
      const cap = caption(b.layer, P0.caption, 'left:6%;top:8%');
      return { ...b, update(t, p) { const k = ease(p); camera.position.set(K.lerp(-6, 6, k), K.lerp(7, 9, k), 9); camera.lookAt(0, 1, -10); capOn(cap, P0.caption, t); } };
    },

    // ---------- rubber stamp on a document ----------
    // `text` is the stamp; the box fits it. Each appearance gets its own document and angle.
    stamp(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1714, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const v = nthOfSet(ctx, shot) % 2;
      const c = document.createElement('canvas'); c.width = 600; c.height = 780; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const paper = mesh(new THREE.PlaneGeometry(3.6, 4.68), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), [0, 0.01, 0], scene); paper.rotation.x = -Math.PI / 2; paper.rotation.z = v ? -0.08 : 0.05;
      const st = new THREE.Group(); scene.add(st); const wood = std(0x4a2a17, { roughness: 0.5 });
      mesh(new THREE.BoxGeometry(1.8, 0.25, 0.9), std(0x111111), [0, 0.12, 0], st); mesh(new THREE.BoxGeometry(1.6, 0.3, 0.7), wood, [0, 0.4, 0], st); mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 16), wood, [0, 1.1, 0], st); mesh(new THREE.SphereGeometry(0.35, 16, 12), wood, [0, 1.8, 0], st);
      lit(scene, { pos: v ? [3, 11, -2] : [-2, 12, 4], target: [0, 0, 0], intensity: 900, radius: 4, color: v ? 0xeef2ff : 0xfff0dc });
      const t0 = P0.word ? wt(shot, P0.word) : shot.duration * 0.45; let stamped = -1;
      const draw = (on) => { x.fillStyle = v ? '#f0eee8' : '#ebe4d4'; x.fillRect(0, 0, 600, 780);
        x.fillStyle = '#222'; x.font = v ? '500 18px "Plex Mono"' : '700 24px "Archivo Narrow"'; x.fillText(v ? 'PROJECT FILE · INTERNAL' : 'MEMORANDUM FOR THE RECORD', 50, 62);
        x.fillRect(50, 76, 500, 2); fakeText(x, 600, 780, { seed: 31 + v * 7, lines: 24, margin: 50 });
        if (!on) return; const label = P0.text ?? 'APPROVED';
        x.save(); x.translate(310, v ? 360 : 470); x.rotate(v ? 0.1 : -0.12); x.font = '700 84px "Archivo Narrow"'; const wd = Math.min(520, x.measureText(label).width + 70), sc = Math.min(1, 450 / x.measureText(label).width);
        x.globalAlpha = 0.9; x.strokeStyle = '#c41e16'; x.lineWidth = 8; x.strokeRect(-wd / 2, -55, wd, 110); x.fillStyle = '#c41e16'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.save(); x.scale(sc, 1); x.fillText(label, 0, 4); x.restore(); x.restore(); };
      const sx = v ? -0.1 : 0.4, sz = v ? -0.55 : 0.6;
      return { ...b, update(t, p) {
        const down = K.range(t, t0 - 0.3, t0), up = K.range(t, t0 + 0.15, t0 + 0.6);
        st.position.set(sx, t < t0 ? K.lerp(1.6, 0.02, down * down) : K.lerp(0.02, 1.6, ease(up)), sz); st.visible = !(t > t0 + 0.6) && t > t0 - 0.35;
        const s = t >= t0 ? 1 : 0; if (s !== stamped) { stamped = s; draw(s); tex.needsUpdate = true; }
        const k = ease(p);
        if (v) { camera.position.set(K.lerp(2.4, 1.4, k), K.lerp(3.0, 2.4, k), K.lerp(2.6, 1.6, k)); camera.lookAt(-0.1, 0, -0.5); }
        else { camera.position.set(K.lerp(-1, 0.5, k), K.lerp(7.5, 6.6, k), 4.2); camera.lookAt(0.2, 0, 0.2); }
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
        const front = 25 * ease(K.range(t, t0 - 0.4, t0 + 25 * 0.11 + 0.6)); const fi = Math.floor(front); const g0 = ds[fi].position, g1 = ds[Math.min(25, fi + 1)].position;
        const fx = K.lerp(g0.x, g1.x, front - fi), fz = K.lerp(g0.z, g1.z, front - fi);
        const h = K.handheld(t, 0.03, 2); camera.position.set(fx - 3.6 + h.x, 1.3 + h.y, fz + 4.6); camera.lookAt(fx + 1.5, 0.5, fz);
      } };
    },

    // ---------- courtroom ----------
    // The gavel falls on `word`; the camera eases down the aisle toward the bench.
    court(ctx, shot) {
      const b = base(ctx, { floor: 0x1c1712, density: 0.03, fov: 34 }); const { scene, camera } = b; const P0 = shot.params;
      const wood = std(0x3b2414, { roughness: 0.45 });
      mesh(new THREE.BoxGeometry(8, 2.6, 1.6), wood, [0, 1.3, -8], scene); mesh(new THREE.BoxGeometry(8.4, 0.2, 2), wood, [0, 2.7, -8], scene);
      mesh(new THREE.BoxGeometry(1.4, 3.4, 0.4), std(0x0e0e0e), [0, 3, -9.2], scene);
      for (let r = 0; r < 6; r++) for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(4.2, 0.12, 0.8), wood, [s * 3, 0.9, -2 + r * 2.2], scene); mesh(new THREE.BoxGeometry(4.2, 1.0, 0.12), wood, [s * 3, 1.4, -1.6 + r * 2.2], scene); }
      const pivot = new THREE.Group(); pivot.position.set(1.8, 2.85, -7.2); scene.add(pivot);
      const gv = P.gavel(); gv.scale.setScalar(0.35); gv.position.set(0, -0.05, -0.65); pivot.add(gv);
      lit(scene, { pos: [0, 14, -2], target: [0, 2, -8], intensity: 3400, radius: 6, angle: 0.35 });
      const win = new THREE.SpotLight(0xd8e4ff, 700, 0, 0.3, 0.5, 1.5); win.position.set(-14, 10, -4); win.target.position.set(0, 0, 0); scene.add(win, win.target);
      const tw = P0.word ? wt(shot, P0.word) : shot.duration * 0.3;
      const cap = caption(b.layer, P0.caption, 'left:6%;top:8%');
      return { ...b, update(t, p) {
        const k = ease(p); camera.position.set(K.lerp(1, -1, k), 2.6, K.lerp(12, 7, k)); camera.lookAt(0, 2.4, -8);
        // raise, strike on the word, small rebound
        const lift = K.range(t, tw - 0.6, tw - 0.12), hit = K.range(t, tw - 0.12, tw), reb = K.range(t, tw, tw + 0.5);
        pivot.rotation.x = t < tw - 0.12 ? 0.6 * ease(lift) : t < tw ? 0.6 * (1 - hit * hit) : 0.08 * Math.sin(Math.PI * reb) * (1 - reb);
        capOn(cap, P0.caption, t, 0.6);
      } };
    },

    // ---------- terminal: a monitor in a dark room, lines typing out ----------
    // v0: green phosphor CRT, close and tilted. v1: cold flat panel on a desk, wider, with the room.
    // Words like FLAGGED / DECLINED / REVERSED and quoted phrases go red.
    terminal(ctx, shot) {
      const v = nthOfSet(ctx, shot) % 2; const P0 = shot.params; const lines = P0.lines ?? [];
      const b = base(ctx, { floor: 0x0e0f10, fog: 0x020304, density: 0.04, fov: 30 }); const { scene, camera } = b;
      const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const ink = v ? '#cfe2ff' : '#7dffb0', bg = v ? '#05080e' : '#020a05';
      const mon = new THREE.Group(); scene.add(mon);
      if (!v) { mesh(new THREE.BoxGeometry(3.2, 2.5, 2.6), std(0x5f5a50, { roughness: 0.75 }), [0, 1.25, -1.1], mon); mesh(new THREE.BoxGeometry(2.7, 1.9, 0.1), std(0x121212), [0, 1.3, 0.2], mon); }
      else { mesh(new THREE.BoxGeometry(3.4, 2.05, 0.12), std(0x111214, { metalness: 0.5, roughness: 0.4 }), [0, 1.6, 0], mon); mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), std(0x111214), [0, 0.3, -0.1], mon); }
      const scr = mesh(new THREE.PlaneGeometry(v ? 3.2 : 2.5, v ? 2.0 : 1.56), new THREE.MeshBasicMaterial({ map: tex }), [0, v ? 1.6 : 1.3, v ? 0.07 : 0.26], mon);
      mesh(new THREE.BoxGeometry(8, 0.1, 3.5), std(0x241a12, { roughness: 0.6 }), [0, -0.05, -0.3], scene);
      const glow = new THREE.PointLight(v ? 0x9fc4ff : 0x58ffa0, 5, 6, 1.6); glow.position.set(0, 1.4, 2.2); scene.add(glow);
      K.keySpot(scene, { color: 0xfff0dc, intensity: 220, pos: [-4, 6, 3], target: [0, 0, 0], angle: 0.4, penumbra: 1, shadow: 0 });
      if (v) mon.rotation.y = -0.25;
      const red = /FLAGGED|DECLINED|REVERSED|“[^”]*”/g;
      const times = lines.map((_, i) => vo0(shot) + 0.2 + i * Math.max(0.5, (Math.max(1.5, shot.duration - vo0(shot) - 1.2)) / Math.max(1, lines.length)));
      const src = sourceLine(b.layer, P0.source);
      let lastKey = '';
      return { ...b, update(t, p) {
        const shown = lines.map((l, i) => l.slice(0, Math.floor(l.length * K.range(t, times[i], times[i] + Math.min(0.9, l.length * 0.03)))));
        const cursor = Math.floor(t * 2) % 2; const key = shown.join('|') + cursor;
        if (key !== lastKey) { lastKey = key;
          x.fillStyle = bg; x.fillRect(0, 0, 1024, 640); x.font = '500 34px "Plex Mono"'; x.textBaseline = 'top';
          x.fillStyle = ink; x.globalAlpha = 0.5; x.fillText(v ? '> CONTRACT RECORD' : '> FRAUD MONITOR v0.9', 50, 40); x.globalAlpha = 1;
          shown.forEach((l, i) => { let cx = 50; const y = 120 + i * 62; const full = lines[i];
            // colour red spans by their position in the full line
            const spans = []; let m; red.lastIndex = 0; while ((m = red.exec(full))) spans.push([m.index, m.index + m[0].length]);
            for (let ci = 0; ci < l.length; ci++) { x.fillStyle = spans.some(([a, bb]) => ci >= a && ci < bb) ? '#ff4a3d' : ink; x.fillText(l[ci], cx, y); cx += x.measureText(l[ci]).width; }
            if (l.length && l.length < full.length || (i === shown.findLastIndex(s => s.length) && cursor)) { x.fillStyle = ink; x.fillRect(cx + 4, y, 18, 34); } });
          // scanlines
          x.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < 640; y += 4) x.fillRect(0, y, 1024, 2);
          tex.needsUpdate = true; }
        const k = ease(p), h = K.handheld(t, 0.015, 7);
        if (!v) { camera.position.set(K.lerp(1.6, 0.7, k) + h.x, K.lerp(1.6, 1.4, k) + h.y, K.lerp(5.2, 3.6, k)); camera.lookAt(0, 1.3, 0); camera.rotation.z += 0.03; }
        else { camera.position.set(K.lerp(-3.2, -2.2, k) + h.x, K.lerp(2.2, 1.9, k) + h.y, K.lerp(7.5, 5.6, k)); camera.lookAt(0.3, 1.5, 0); }
        if (src) src.style.opacity = K.range(t, 1, 1.6) * 0.9;
      } };
    },

    // ---------- a document on the desk ----------
    // The layout follows the title: a letter (SENATE / LETTER), a filing (FORM / S-1), a memo
    // (MEMORANDUM) or a certificate (default, signed in ink). `red` is a phrase the letter quotes,
    // underlined in red marker. Each layout has its own light and camera.
    contract(ctx, shot) {
      const b = base(ctx, { floor: 0x1a1714, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params; const title = P0.title ?? 'AGREEMENT';
      const kind = /SENATE|LETTER/i.test(title) ? 'letter' : /FORM|S-1/i.test(title) ? 'filing' : /MEMO/i.test(title) ? 'memo' : 'cert';
      const c = document.createElement('canvas'); c.width = 900; c.height = 1170; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const paper = mesh(new THREE.PlaneGeometry(3.6, 4.68), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), [0, 0.01, 0], scene); paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = { letter: -0.04, filing: 0.06, memo: 0.12, cert: 0 }[kind];
      const pen = new THREE.Group(); scene.add(pen); mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.6, 16), std(0x111111, { metalness: 0.6, roughness: 0.2 }), [0, 0.8, 0], pen); mesh(new THREE.ConeGeometry(0.04, 0.15, 12), std(0xb08d4a, { metalness: 1 }), [0, -0.07, 0], pen).rotation.x = Math.PI;
      pen.visible = false;
      const key = { letter: [3, 10, -2], filing: [-4, 9, 1], memo: [0, 12, 5], cert: [-2, 12, 4] }[kind];
      lit(scene, { pos: key, target: [0, 0, 0], intensity: 900, radius: 4, color: kind === 'letter' ? 0xeef2ff : 0xfff0dc });
      const sig = Array.from({ length: 80 }, (_, i) => { const u = i / 79; return [230 + u * 420, 990 + Math.sin(u * 23) * 24 * (1 - u * 0.5) + Math.sin(u * 7) * 14]; });
      const drawBase = () => {
        x.fillStyle = kind === 'filing' ? '#f3f1ec' : '#ebe4d4'; x.fillRect(0, 0, 900, 1170); x.fillStyle = '#1a1a1a';
        if (kind === 'letter') { x.textAlign = 'center'; x.font = '400 54px "Instrument Serif"'; x.fillText('United States Senate', 450, 110); x.font = '500 18px "Plex Mono"'; x.fillText('WASHINGTON, DC 20510', 450, 145); x.textAlign = 'left'; }
        x.font = kind === 'filing' ? '500 26px "Plex Mono"' : '700 34px "Archivo Narrow"';
        const L = wrap(x, title, 780); L.forEach((l, i) => x.fillText(l, 60, (kind === 'letter' ? 220 : 90) + i * 40));
        const y0 = (kind === 'letter' ? 220 : 90) + L.length * 40 + 10; x.fillRect(60, y0, 780, 2);
        x.save(); x.translate(0, y0 + 10); fakeText(x, 900, kind === 'cert' ? 720 : 900, { seed: { letter: 44, filing: 45, memo: 46, cert: 47 }[kind], lines: kind === 'filing' ? 34 : 22, margin: 60 }); x.restore();
        if (P0.red) { x.font = '400 46px "Instrument Serif"'; const y = 640; x.fillStyle = '#1a1a1a'; x.fillText('…warning of a', 60, y); const w0 = x.measureText('…warning of a ').width;
          x.fillStyle = '#ebe4d4'; x.fillRect(60 + w0 - 4, y - 44, x.measureText(P0.red).width + 8, 58); x.fillStyle = '#1a1a1a'; x.fillText(P0.red, 60 + w0, y); return [60 + w0, y, x.measureText(P0.red).width]; }
        if (kind === 'cert') { x.fillStyle = '#555'; x.fillRect(220, 1030, 440, 2); x.font = '16px "Plex Mono"'; x.fillText('AUTHORIZED SIGNATURE', 220, 1055);
          x.strokeStyle = '#8a6a2a'; x.lineWidth = 3; x.beginPath(); x.arc(760, 980, 70, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(760, 980, 56, 0, Math.PI * 2); x.stroke(); }
        if (kind === 'memo') { x.font = '500 20px "Plex Mono"'; x.fillStyle = '#1a1a1a'; ['TO:   OFFICE OF THE MAYOR', 'FROM: PALANTIR TECHNOLOGIES', 'RE:   NO-COST PARTNERSHIP'].forEach((l, i) => x.fillText(l, 60, 860 + i * 34)); }
        return null; };
      const red = drawBase(); const baseImg = document.createElement('canvas'); baseImg.width = 900; baseImg.height = 1170; baseImg.getContext('2d').drawImage(c, 0, 0);
      const tRed = P0.red ? (wt(shot, P0.red.replace(/[“”]/g, '').split(' ')[0]) || shot.duration * 0.5) : 0;
      let lastK = -1;
      return { ...b, update(t, p) {
        const kSig = kind === 'cert' ? K.range(p, 0.2, 0.85) : 0, kRed = red ? ease(K.range(t, tRed, tRed + 0.8)) : 0, key2 = Math.round(kSig * 80) + kRed * 1000;
        if (key2 !== lastK) { lastK = key2; x.drawImage(baseImg, 0, 0);
          if (kind === 'cert') { const n = Math.floor(sig.length * kSig); x.strokeStyle = '#13235a'; x.lineWidth = 5; x.beginPath(); sig.slice(0, n).forEach(([a, bb], i) => i ? x.lineTo(a, bb) : x.moveTo(a, bb)); x.stroke(); }
          if (red && kRed > 0) { const [rx, ry, rw] = red; x.strokeStyle = 'rgba(224,36,27,.9)'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(rx - 6, ry + 14); x.lineTo(rx - 6 + (rw + 12) * kRed, ry + 10); x.stroke(); }
          tex.needsUpdate = true; }
        if (kind === 'cert') { const n = Math.max(1, Math.floor(sig.length * kSig)); const tip = sig[n - 1]; pen.position.set((tip[0] / 900 - 0.5) * 3.6, 0.02, (tip[1] / 1170 - 0.5) * 4.68); pen.rotation.set(-0.5, 0, -0.4); pen.visible = kSig > 0 && kSig < 1; }
        const k = ease(p), h = K.handheld(t, 0.01, 2);
        if (kind === 'letter') { camera.position.set(K.lerp(0.6, -0.2, k) + h.x, K.lerp(4.0, 2.6, k) + h.y, K.lerp(2.2, 1.2, k)); camera.lookAt(K.lerp(0, -0.3, k), 0, K.lerp(-0.5, -0.3, k)); }
        else if (kind === 'filing') { camera.position.set(K.lerp(-2.6, -1.6, k) + h.x, K.lerp(2.4, 2.0, k) + h.y, K.lerp(2.8, 1.8, k)); camera.lookAt(0.2, 0, -0.8); }
        else if (kind === 'memo') { camera.position.set(K.lerp(0.8, 0.2, k) + h.x, K.lerp(6.4, 5.0, k), K.lerp(2.8, 2.2, k)); camera.lookAt(0.1, 0, -0.3); }
        else { camera.position.set(K.lerp(-0.6, 0.6, k) + h.x, K.lerp(5.6, 5.0, k) + h.y, 3.4); camera.lookAt(0, 0, K.lerp(-0.2, 0.5, k)); }
      } };
    },

    // ---------- magnifying glass over records ----------
    // `text` is printed once on the ledger; the glass glides across the page and settles over it
    // on `word`, when the camera has eased in and a red box closes around it.
    magnifier(ctx, shot) {
      const b = base(ctx, { floor: 0x161412, density: 0.03, fov: 30 }); const { scene, camera } = b; const P0 = shot.params;
      const TX = 620, TY = 380; // where the word sits on the 1024x768 page
      const c = document.createElement('canvas'); c.width = 1024; c.height = 768; const x = c.getContext('2d'); const pages = new THREE.CanvasTexture(c); pages.colorSpace = THREE.SRGBColorSpace; pages.anisotropy = 8;
      x.fillStyle = '#e8e1d0'; x.fillRect(0, 0, 1024, 768); fakeText(x, 1024, 768, { seed: 61, lines: 34, margin: 40 });
      x.fillStyle = '#e8e1d0'; x.fillRect(TX - 70, TY - 22, 200, 40); x.fillStyle = '#1a1a1a'; x.font = '700 30px "Plex Mono"'; x.textBaseline = 'middle'; x.fillText(P0.text ?? '', TX - 50, TY);
      const base0 = document.createElement('canvas'); base0.width = 1024; base0.height = 768; base0.getContext('2d').drawImage(c, 0, 0);
      const desk = mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: pages, roughness: 0.9 }), [0, 0.01, 0], scene); desk.rotation.x = -Math.PI / 2;
      const wx = ((TX + 20) / 1024 - 0.5) * 8, wz = (TY / 768 - 0.5) * 6;
      const mg = new THREE.Group(); scene.add(mg);
      mesh(new THREE.TorusGeometry(0.9, 0.08, 16, 64), std(0x111111, { metalness: 0.6, roughness: 0.3 }), [0, 0, 0], mg).rotation.x = Math.PI / 2;
      const lens = mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.04, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, clearcoat: 1 }), [0, 0, 0], mg); lens.castShadow = false;
      const hnd = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.8, 16), std(0x3a2414), [1.6, 0, 0.3], mg); hnd.rotation.z = Math.PI / 2; hnd.rotation.y = -0.3;
      lit(scene, { pos: [-2, 10, 3], target: [wx * 0.5, 0, wz * 0.5], intensity: 1600, radius: 4 });
      const tw = P0.word ? wt(shot, P0.word) : shot.duration * 0.7; let boxed = -1;
      return { ...b, update(t, p) {
        const g = ease(K.range(t, 0, tw)); // the glass arrives exactly on the word
        mg.position.set(K.lerp(-2.4, wx, g) + Math.sin(t * 0.5) * 0.05 * (1 - g), 0.9 - 0.25 * g, K.lerp(-1.4, wz, g));
        const kb = Math.round(ease(K.range(t, tw, tw + 0.5)) * 20) / 20;
        if (kb !== boxed) { boxed = kb; x.drawImage(base0, 0, 0); if (kb > 0) { x.strokeStyle = '#c41e16'; x.lineWidth = 5; x.globalAlpha = kb; x.strokeRect(TX - 66, TY - 26, 160 * (0.6 + 0.4 * kb), 52); x.globalAlpha = 1; } pages.needsUpdate = true; }
        const k = ease(p);
        camera.position.set(K.lerp(0.3, wx + 0.2, k * 0.7), K.lerp(5.5, 3.2, k), K.lerp(3.6, wz + 2.0, k * 0.8)); camera.lookAt(K.lerp(0, wx, k), 0, K.lerp(0.2, wz, k));
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
