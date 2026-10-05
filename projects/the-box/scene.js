// THE BOX — cold open.
// Fern's grammar (objects isolated in a black void, diorama reconstructions, tracked
// annotations, red marker) pushed through the taste board: sodium night, Wong Kar-wai
// fluorescent green with step-printing, deadpan flash cuts, editorial poster type.
import * as THREE from 'three';
import * as K from 'kit';

const SODIUM = 0xffa860, MOON = 0x6f8fb8, FLUO = 0x58ffa0, STEEL_RED = 0x8c2b1d;

export default async function create({ renderer, overlay, width, height, shots }) {
  const S = Object.fromEntries(shots.map(s => [s.id, s]));
  const aspect = width / height;
  const cam = (fov = 35) => new THREE.PerspectiveCamera(fov, aspect, 0.1, 3000);
  const groups = {};
  const layer = (id) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); groups[id] = d; return d; };

  // 2D compositor on top of the WebGL canvas: lets us do step-printing / smear trails.
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`;
  gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d');

  const sets = {};

  // =====================================================================
  // 1. OBJECT — a single container alone in the void; a work light clunks on.
  // =====================================================================
  {
    const scene = new THREE.Scene(); const camera = cam(30);
    const floor = K.voidStage(scene, { floor: 0x2a2826, fogDensity: 0.028 });
    const gt = K.grimeTexture(21, 120); gt.repeat.set(30, 30); floor.material.map = gt; floor.material.bumpMap = gt; floor.material.bumpScale = 1.5;
    const box = K.container({ color: STEEL_RED }); box.rotation.y = 0.42; box.position.set(0, 0, 0); scene.add(box);
    const key = K.keySpot(scene, { color: 0xfff0dc, intensity: 0, pos: [-1.5, 17, 3], target: [0, 1.2, 0], angle: 0.5, penumbra: 0.6 });
    const shaft = K.lightShaft(scene, { pos: [-1.5, 17, 3], target: [0, 0, 0], radius: 8.5, intensity: 0 });
    const rim = new THREE.SpotLight(0x9fb7ff, 0, 0, 0.5, 1, 2); rim.position.set(6, 5, -12); rim.target = box; scene.add(rim);
    const motes = K.dust(scene, { count: 900, box: [9, 14, 9], center: [-0.7, 7, 1.4], size: 0.045, opacity: 0.5 });
    const L = layer('object');
    const cap = K.div(L, `left:6.2%;top:8%;font:500 .95em 'Plex Mono',monospace;letter-spacing:.16em;color:#d9d2c3;line-height:1.7`);
    sets.object = {
      scene, camera,
      update(t, p, s) {
        // work light: dead until 0.7s, three-frame stutter, then on
        const on = t < 0.7 ? 0 : t < 0.78 ? 0.6 : t < 0.86 ? 0.05 : t < 0.95 ? 1.1 : 1;
        key.intensity = 4200 * on; shaft.material.uniforms.uI.value = 0.06 * on; rim.intensity = 260 * on;
        motes.material.opacity = 0.5 * on;
        motes.update(t);
        const k = K.inOut(p);
        const r = K.lerp(30, 21, k), a = K.lerp(-0.62, -0.28, k);
        const h = K.handheld(t, 0.035, 1);
        camera.position.set(Math.sin(a) * r + h.x, K.lerp(1.0, 3.2, k) + h.y, Math.cos(a) * r);
        camera.lookAt(0, K.lerp(3.2, 2.0, k), 0); camera.rotation.z += h.r;
        const capP = K.range(t, 2.6, 4.2);
        cap.style.opacity = capP > 0 ? 1 : 0;
        K.typeOn(cap, 'FIG. 1 STEEL CONTAINER, 35 FT · NEWARK, 1956', capP);
      },
    };
  }

  // =====================================================================
  // 2. HARBOR — night diorama of Port Newark; the Ideal X takes on box 58.
  // =====================================================================
  {
    const scene = new THREE.Scene(); const camera = cam(32);
    scene.background = new THREE.Color(0x020407); scene.fog = new THREE.FogExp2(0x03060b, 0.0065);
    // water with animated ripple normals
    const nCan = document.createElement('canvas'); nCan.width = nCan.height = 256;
    { const x = nCan.getContext('2d'), img = x.createImageData(256, 256), r = K.rng(4); const hgt = new Float32Array(256 * 256);
      const waves = Array.from({ length: 24 }, () => [r() * 6.28, (r() * 2 + 1) * 6.28 / 256 * (1 + Math.floor(r() * 8)), r() * 6.28, r()]);
      for (let y = 0; y < 256; y++) for (let x2 = 0; x2 < 256; x2++) { let v = 0; for (const [d, f, ph, a] of waves) v += a * Math.sin((Math.cos(d) * x2 + Math.sin(d) * y) * f + ph); hgt[y * 256 + x2] = v; }
      for (let y = 0; y < 256; y++) for (let x2 = 0; x2 < 256; x2++) { const i = y * 256 + x2, dx = hgt[y * 256 + ((x2 + 1) & 255)] - hgt[y * 256 + ((x2 + 255) & 255)], dy = hgt[((y + 1) & 255) * 256 + x2] - hgt[((y + 255) & 255) * 256 + x2];
        const n = new THREE.Vector3(-dx * 0.6, -dy * 0.6, 1).normalize(); img.data.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, n.z * 255, 255], i * 4); }
      x.putImageData(img, 0, 0); }
    const nTex = new THREE.CanvasTexture(nCan); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping; nTex.repeat.set(22, 22);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x05080c, roughness: 0.32, metalness: 0.85, normalMap: nTex, normalScale: new THREE.Vector2(0.07, 0.07) }));
    water.rotation.x = -Math.PI / 2; water.receiveShadow = true; scene.add(water);

    // hull: top-view outline extruded upward
    const ship = new THREE.Group(); scene.add(ship);
    const hs = new THREE.Shape(); const HL = 75, HB = 10.5;
    hs.moveTo(-HL, -HB * 0.85); hs.quadraticCurveTo(-HL - 3, 0, -HL, HB * 0.85); hs.lineTo(HL * 0.55, HB);
    hs.quadraticCurveTo(HL * 0.92, HB * 0.8, HL + 4, 0); hs.quadraticCurveTo(HL * 0.92, -HB * 0.8, HL * 0.55, -HB); hs.lineTo(-HL, -HB * 0.85);
    const hullG = new THREE.ExtrudeGeometry(hs, { depth: 10, bevelEnabled: false, curveSegments: 24 }); hullG.rotateX(-Math.PI / 2);
    const hgt = K.grimeTexture(31, 90); hgt.repeat.set(6, 1);
    const hull = new THREE.Mesh(hullG, new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.7, metalness: 0.4, roughnessMap: hgt, bumpMap: hgt, bumpScale: 2 }));
    hull.position.y = -4; hull.castShadow = hull.receiveShadow = true; ship.add(hull);
    const deckY = 6;
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.2, ...o });
    const addBox = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; ship.add(b); return b; };
    // spar deck the containers sit on
    addBox(112, 0.6, 18, 2, deckY + 0.3, 0, mat(0x2f3133));
    // stern house, bridge, funnel
    const white = mat(0xb9b2a4);
    addBox(16, 7, 17, -64, deckY + 3.5, 0, white); addBox(10, 4, 19, -63, deckY + 9, 0, white); addBox(6, 2.5, 12, -63, deckY + 12.2, 0, white);
    const fun = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 7, 24), mat(0x161616)); fun.position.set(-70, deckY + 11, 0); ship.add(fun);
    const winM = new THREE.MeshBasicMaterial({ color: 0xffc27a });
    for (let i = 0; i < 8; i++) for (const z of [-9.55, 9.55]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), winM); w.position.set(-67 + i * 1.1, deckY + 9.6, z); ship.add(w); }
    for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 1.2), winM); w.position.set(-57.95, deckY + 9.6, -5 + i * 2.5); ship.add(w); }
    // forecastle + masts
    addBox(12, 2.5, 15, 66, deckY + 1.25, 0, mat(0x2a2d30));
    for (const x of [58, -40]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 18, 8), mat(0x3a3a3a)); m.position.set(x, deckY + 9, 0); ship.add(m); }
    // 57 boxes on deck (10 rows x 3 across x 2 tiers, minus 3 empty slots; the 58th is on the hook)
    const palette = [0x8c2b1d, 0x7a2619, 0x93321f, 0x6d2a20, 0x9a3a24];
    const slots = []; for (let tier = 0; tier < 2; tier++) for (let row = 0; row < 10; row++) for (let c = 0; c < 3; c++) slots.push([row, c, tier]);
    const empty = new Set(['9,1,1', '9,2,1', '8,2,1']); const r2 = K.rng(9);
    for (const [row, c, tier] of slots) {
      if (empty.has(`${row},${c},${tier}`)) continue;
      const b = K.container({ color: palette[Math.floor(r2() * palette.length)], detail: false }); b.position.set(-48 + row * 11.2, deckY + 0.6 + tier * 2.62, -2.65 + c * 2.65); ship.add(b);
    }
    const hookBox = K.container({ color: STEEL_RED }); scene.add(hookBox);
    // crane work light that follows the box down
    const work = new THREE.SpotLight(0xfff2dc, 9000, 0, 0.32, 0.5, 2); scene.add(work, work.target);
    const workShaft = K.lightShaft(scene, { pos: [0, 33, 0], target: [0, 0, 0], radius: 6, color: 0xfff0dc, intensity: 0.07 });
    const hookSlot = new THREE.Vector3(-48 + 9 * 11.2, deckY + 0.6 + 2.62, 0);

    // pier
    const pier = new THREE.Group(); scene.add(pier);
    const pz = -HB - 9;
    const conc = K.grimeTexture(41, 140); conc.repeat.set(20, 2);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(260, 1.2, 14), mat(0x4a4744, { map: conc, bumpMap: conc, bumpScale: 1 })); slab.position.set(0, 2.4, pz); slab.receiveShadow = slab.castShadow = true; pier.add(slab);
    for (let x = -125; x <= 125; x += 6) { const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 10, 8), mat(0x1c1a18)); pile.position.set(x, -3, pz + 6.4); pier.add(pile); }
    for (let x = -90; x <= 90; x += 18) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.9, 12), mat(0x111111)); b.position.set(x, 3.45, pz + 6); pier.add(b); }
    // sodium lamp posts: the light that defines this set
    const lamps = [];
    for (const x of [-45, 5, 55]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 18, 8), mat(0x222222)); pole.position.set(x, 12, pz - 4); pier.add(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffd09a })); head.position.set(x, 21, pz - 3.2); pier.add(head);
      const sp = new THREE.SpotLight(SODIUM, 60000, 0, 0.85, 0.7, 2); sp.position.set(x, 21, pz - 3); sp.target.position.set(x + 4, 4, 0); scene.add(sp, sp.target);
      if (x === 55) { sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0005; sp.shadow.radius = 3; }
      K.lightShaft(scene, { pos: [x, 21, pz - 3], target: [x + 4, 0, 0], radius: 17, color: 0xffb070, intensity: 0.05 });
      lamps.push(sp);
    }
    const moon = new THREE.DirectionalLight(MOON, 1.1); moon.position.set(80, 120, 160); scene.add(moon);
    scene.add(new THREE.HemisphereLight(0x2a3a52, 0x080706, 0.6));
    // gantry crane on the pier, boom over the ship
    const craneM = mat(0x9b5a1c, { metalness: 0.5, roughness: 0.55 });
    const crane = new THREE.Group(); crane.position.set(hookSlot.x, 0, pz); scene.add(crane);
    const beam = (w, h, d, x, y, z, rz = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), craneM); b.position.set(x, y, z); b.rotation.z = rz; b.castShadow = true; crane.add(b); };
    for (const x of [-5, 5]) for (const z of [-5, 5]) beam(0.8, 30, 0.8, x, 18, z);
    beam(11, 1, 11, 0, 33, 0); beam(1.2, 1.4, 52, 0, 33.5, 18); beam(12, 0.6, 0.6, 0, 20, -5); beam(12, 0.6, 0.6, 0, 20, 5);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), craneM); cab.position.set(0, 31, 5); crane.add(cab);
    const cableM = new THREE.LineBasicMaterial({ color: 0x888888 });
    const cableG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const cable = new THREE.Line(cableG, cableM); scene.add(cable);
    const motes = K.dust(scene, { count: 500, box: [120, 30, 40], center: [0, 15, pz], size: 0.25, opacity: 0.35, color: 0xffc890 });

    const L = layer('harbor');
    const svg = K.svgLayer(L);
    const loc = K.div(L, `left:6.2%;bottom:9%;color:#efe7d6;line-height:1.25`,
      `<div style="font:500 .85em 'Plex Mono',monospace;letter-spacing:.2em;opacity:.75">26.04.1956</div>
       <div style="font:400 3.1em 'Instrument Serif',serif;letter-spacing:.01em">Port Newark, New Jersey</div>`);
    const tag = K.leader(L, svg, { html: 'Ideal X<br><span style="opacity:.6">converted T2 tanker</span>' });
    const loop = K.markerLoop(svg, { cx: 0, cy: 0, rx: 100, ry: 100, seed: 5, width: 6 });
    loop.setAttribute('vector-effect', 'non-scaling-stroke');
    const count = K.div(L, `font:700 6em 'Archivo Narrow',sans-serif;color:${K.RED};line-height:.9;letter-spacing:-.01em`);
    const countLbl = K.div(L, `font:500 .85em 'Plex Mono',monospace;letter-spacing:.2em;color:${K.RED}`, 'CONTAINERS');
    sets.harbor = {
      scene, camera,
      update(t, p, s) {
        nTex.offset.set(t * 0.004, t * 0.0025);
        motes.update(t);
        ship.position.y = Math.sin(t * 0.6) * 0.08; ship.rotation.x = Math.sin(t * 0.45) * 0.002;
        // camera: high diorama view drifting along the ship, settling lower
        const k = K.inOut(p);
        const h = K.handheld(t, 0.15, 2);
        camera.position.set(K.lerp(-30, 35, k) + h.x, K.lerp(44, 30, k) + h.y, K.lerp(-150, -118, k));
        camera.lookAt(K.lerp(-5, 22, k), K.lerp(4, 8, k), 0); camera.rotation.z += h.r;
        // box 58 comes down on the hook
        const drop = K.inOut(K.range(t, 0.2, s.duration * 0.62));
        const sway = Math.sin(t * 1.3) * 0.25 * (1 - drop);
        hookBox.position.set(hookSlot.x + sway, K.lerp(26, hookSlot.y, drop) + ship.position.y, K.lerp(-6, 0, drop));
        cable.geometry.setFromPoints([new THREE.Vector3(hookSlot.x + sway * 0.3, 33, K.lerp(-6, 0, drop)), new THREE.Vector3(hookBox.position.x, hookBox.position.y + 2.6, hookBox.position.z)]);
        work.position.set(hookSlot.x - 3, 31, -8); work.target.position.copy(hookBox.position);
        workShaft.position.set(hookSlot.x + 4, 32.5, -2); workShaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(hookSlot.x, 5, 0).sub(workShaft.position).normalize()); workShaft.updateMatrixWorld(); workShaft.material.uniforms.uInv.value.copy(workShaft.matrixWorld).invert();
        // annotations
        loc.style.opacity = K.range(t, 0.4, 1.4) * (1 - K.range(t, s.duration - 0.8, s.duration - 0.2));
        const [bx, by] = K.toScreen(new THREE.Vector3(-40, deckY + 17.5, 0), camera);
        tag.update(bx, by, bx - 230, by - 110, K.range(t, 2.2, 3.4));
        // when the VO lands on "fifty-eight", circle the deck cargo and count it
        const tLoop = s.voDur ? s.voAt - s.start + s.voDur - 2.2 : s.duration * 0.6;
        // circle the 58th box, tracked in 3D
        const hb = new THREE.Box3().setFromObject(hookBox), corners = [];
        for (const x of [hb.min.x, hb.max.x]) for (const y of [hb.min.y, hb.max.y]) for (const z of [hb.min.z, hb.max.z]) corners.push(K.toScreen(new THREE.Vector3(x, y, z), camera));
        const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
        const ccx = (Math.min(...xs) + Math.max(...xs)) / 2, ccy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const rx = (Math.max(...xs) - Math.min(...xs)) / 2 + 55, ry = (Math.max(...ys) - Math.min(...ys)) / 2 + 45;
        loop.setAttribute('transform', `translate(${ccx} ${ccy}) scale(${rx / 100} ${ry / 100})`);
        loop.draw(K.outCubic(K.range(t, tLoop, tLoop + 0.9)));
        const cp = K.range(t, tLoop + 0.3, tLoop + 1.3);
        const sc = window.innerHeight / 1080;
        count.style.opacity = cp > 0 ? 1 : 0; countLbl.style.opacity = cp > 0 ? 1 : 0;
        count.textContent = String(Math.round(58 * K.outCubic(cp))).padStart(2, '0');
        count.style.left = `${(ccx + rx * 0.62) * sc}px`; count.style.top = `${(ccy - ry - 110) * sc}px`;
        countLbl.style.left = `${(ccx + rx * 0.62 + 4) * sc}px`; countLbl.style.top = `${(ccy - ry - 18) * sc}px`;
      },
    };
  }

  // =====================================================================
  // 3. NUMBERS — break-bulk heap vs. one box, two pools of light, symmetric.
  // =====================================================================
  {
    const scene = new THREE.Scene(); const camera = cam(30);
    K.voidStage(scene, { floor: 0x1d1c1b, fogDensity: 0.03 });
    const lx = -6.5, rx = 6.5;
    K.keySpot(scene, { color: 0xc9d6ff, intensity: 2200, pos: [lx, 15, 3], target: [lx, 0, 0], angle: 0.33, penumbra: 0.7, shadow: 1024 });
    K.keySpot(scene, { color: 0xffe2bd, intensity: 2200, pos: [rx, 15, 3], target: [rx, 0, 0], angle: 0.33, penumbra: 0.7, shadow: 1024 });
    K.lightShaft(scene, { pos: [lx, 15, 3], target: [lx, 0, 0], radius: 5.2, color: 0xd8e2ff, intensity: 0.05 });
    K.lightShaft(scene, { pos: [rx, 15, 3], target: [rx, 0, 0], radius: 5.2, color: 0xffe6c8, intensity: 0.05 });
    // the heap: crates, sacks, barrels
    const r = K.rng(12);
    const crateM = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.85, bumpMap: K.grimeTexture(5, 150), bumpScale: 2 });
    const sackM = new THREE.MeshStandardMaterial({ color: 0xb7a582, roughness: 1 });
    const barrelM = new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: 0.5, metalness: 0.6 });
    const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), crateM, 70);
    const sacks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 14, 10), sackM, 60);
    const barrels = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 16), barrelM, 22);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const place = (mesh, n, sizeFn) => { for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 3.4; const hgt = (1 - rad / 3.6) * 2.6 * (0.4 + r() * 0.8);
      const sz = sizeFn(); e.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(lx + Math.cos(ang) * rad, sz.y / 2 + hgt, Math.sin(ang) * rad * 0.8), q, sz); mesh.setMatrixAt(i, m4);
    } mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); };
    place(crates, 70, () => { const s = 0.5 + r() * 0.7; return new THREE.Vector3(s * (1 + r() * 0.6), s * (0.6 + r() * 0.5), s); });
    place(sacks, 60, () => new THREE.Vector3(0.9 + r() * 0.3, 0.38 + r() * 0.1, 0.6 + r() * 0.2));
    place(barrels, 22, () => new THREE.Vector3(1, 1, 1));
    const box = K.container({ color: STEEL_RED }); box.position.set(rx, 0, 0); box.rotation.y = Math.PI / 2 - 0.12; box.scale.setScalar(0.62); scene.add(box);

    const L = layer('numbers');
    const svg = K.svgLayer(L);
    const head = K.div(L, `left:0;right:0;top:7%;text-align:center;font:500 .9em 'Plex Mono',monospace;letter-spacing:.24em;color:#cfc8ba`, 'COST TO LOAD ONE TON OF CARGO&nbsp;&nbsp;·&nbsp;&nbsp;1956');
    const numCss = `top:13%;width:50%;text-align:center;font:400 11em 'Instrument Serif',serif;line-height:1;color:#f1eadb;letter-spacing:-.02em`;
    const left = K.div(L, `left:0;${numCss}`), right = K.div(L, `left:50%;${numCss}`);
    const subCss = `top:36%;width:50%;text-align:center;font:italic 400 2.2em 'Instrument Serif',serif;color:#cfc8ba`;
    const lsub = K.div(L, `left:0;${subCss}`, 'by hand'), rsub = K.div(L, `left:50%;${subCss}`, 'in a box');
    const under = svg.make('path', { d: 'M1270 470 C1350 462 1460 474 1560 464', fill: 'none', stroke: K.RED, 'stroke-width': 7, 'stroke-linecap': 'round', filter: 'url(#marker)' });
    const ulen = under.getTotalLength(); under.style.strokeDasharray = ulen;
    const src = K.div(L, `right:5%;bottom:5%;font:400 .7em 'Plex Mono',monospace;letter-spacing:.14em;color:#8f897d`, "SOURCE: McLEAN'S 1956 COST ESTIMATE, PORT OF NEWARK");
    const fmt = (v) => '$' + v.toFixed(2);
    sets.numbers = {
      scene, camera,
      update(t, p, s) {
        const k = K.inOut(p); const h = K.handheld(t, 0.02, 3);
        camera.position.set(h.x, K.lerp(3.2, 2.6, k) + h.y, K.lerp(26, 21, k)); camera.lookAt(0, 1.6, 0); camera.rotation.z += h.r;
        const vo0 = s.voAt - s.start;
        const a = K.range(t, vo0 + 0.2, vo0 + 1.4), b = K.range(t, vo0 + s.voDur * 0.62, vo0 + s.voDur * 0.62 + 1.4);
        head.style.opacity = K.range(t, 0.1, 0.6);
        left.style.opacity = a > 0 ? 1 : 0; lsub.style.opacity = K.range(t, vo0 + 1.0, vo0 + 1.6);
        left.textContent = fmt(5.83 * K.outExpo(a));
        right.style.opacity = b > 0 ? 1 : 0; rsub.style.opacity = K.range(t, vo0 + s.voDur * 0.62 + 1.0, vo0 + s.voDur * 0.62 + 1.6);
        right.textContent = fmt(K.lerp(5.83, 0.16, K.outExpo(b)));
        const u = K.range(t, vo0 + s.voDur * 0.62 + 1.3, vo0 + s.voDur * 0.62 + 1.8);
        under.style.strokeDashoffset = ulen * (1 - u); under.style.opacity = u > 0 ? 1 : 0;
        src.style.opacity = K.range(t, 1.2, 2.0) * 0.9;
      },
    };
  }

  // =====================================================================
  // 4. CANYON — an endless aisle of boxes under fluorescent green; a trucker's
  //    rig idles at the end. Step-printed like Chungking Express.
  // =====================================================================
  {
    const scene = new THREE.Scene(); const camera = cam(40);
    scene.background = new THREE.Color(0x010503); scene.fog = new THREE.FogExp2(0x03100a, 0.022);
    const floor = K.voidStage(scene, { floor: 0x1a201c, fog: 0x010503, fogDensity: 0.022 });
    scene.fog = new THREE.FogExp2(0x03100a, 0.022);
    const wet = K.grimeTexture(51, 110); wet.repeat.set(40, 40);
    floor.material.roughnessMap = wet; floor.material.roughness = 0.35; floor.material.metalness = 0.3;
    const cols = [0x6b2a20, 0x2f4f4f, 0x5a5a55, 0x34465e, 0x7a5a2a, 0x4a2c2a, 0x38503c];
    const { body } = K.containerGeometry({ detail: false });
    const grime = K.grimeTexture(61, 140);
    const N = 2 * 26 * 5;
    const inst = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.3, roughnessMap: grime, bumpMap: grime, bumpScale: 0.8 }), N);
    const r = K.rng(77); const m4 = new THREE.Matrix4(); let i = 0;
    for (const side of [-1, 1]) for (let row = 0; row < 26; row++) for (let tier = 0; tier < 5; tier++) {
      if (tier === 4 && r() < 0.35) continue;
      // long axis across the aisle, door ends facing it
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side > 0 ? Math.PI : 0) + (r() - 0.5) * 0.02);
      m4.compose(new THREE.Vector3(side * (7.95 + r() * 0.2), tier * 2.6, -row * 2.55), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m4); inst.setColorAt(i, new THREE.Color(cols[Math.floor(r() * cols.length)])); i++;
    }
    inst.count = i; scene.add(inst);
    // fluorescent tubes strung across the aisle
    const tubeM = new THREE.MeshBasicMaterial({ color: 0xc8ffd8 });
    const tubes = []; for (let z = -4; z > -66; z -= 9) { const tube = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.08), tubeM); tube.position.set(0, 9.4, z); scene.add(tube); tubes.push(tube);
      const wire = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x0c0c0c })); wire.position.set(0, 9.55, z); scene.add(wire); }
    const pls = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(FLUO, 120, 30, 1.6); scene.add(l); return l; });
    // the truck: a 1950s cab with headlights, facing us at the end of the aisle
    const truck = new THREE.Group(); truck.position.set(0, 0, -58); scene.add(truck);
    const tm = new THREE.MeshStandardMaterial({ color: 0x2b3a33, roughness: 0.4, metalness: 0.6 });
    const tb = (w, h, d, x, y, z, m = tm) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); truck.add(b); };
    tb(2.3, 1.3, 2.2, 0, 1.45, 1.9); tb(2.4, 1.9, 1.7, 0, 2.2, 0); tb(2.2, 0.15, 1.5, 0, 3.2, 0);
    tb(1.6, 0.9, 0.08, 0, 2.55, 0.86, new THREE.MeshStandardMaterial({ color: 0x0a120e, roughness: 0.05, metalness: 0.9 }));
    tb(2.0, 0.6, 0.1, 0, 1.25, 3.0, new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.3 }));
    for (const x of [-1.1, 1.1]) for (const z of [1.9, -2.5, -9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 20), new THREE.MeshStandardMaterial({ color: 0x0b0b0b })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.55, z); truck.add(w); }
    const trailer = K.container({ color: 0x8c2b1d, detail: false }); trailer.rotation.y = Math.PI / 2; trailer.position.set(0, 1.0, -6.6); truck.add(trailer);
    const hlM = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
    for (const x of [-0.85, 0.85]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), hlM); h.position.set(x, 1.6, 3.02); truck.add(h); }
    const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,248,230,1)'); g.addColorStop(0.15, 'rgba(255,240,210,.5)'); g.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    for (const x of [-0.85, 0.85]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(4.5, 4.5, 1); s.position.set(x, 1.6, 3.2); truck.add(s); }
    const hl = new THREE.SpotLight(0xfff0d0, 450, 80, 0.45, 0.6, 1.5); hl.position.set(0, 1.6, 3.3); hl.target.position.set(0, 0.6, 30); truck.add(hl, hl.target);
    const motes = K.dust(scene, { count: 700, box: [8, 9, 60], center: [0, 4.5, -30], size: 0.06, opacity: 0.5, color: 0xc8ffd8 });

    const L = layer('canyon');
    const name = K.div(L, `left:7%;bottom:12%;color:#e9fff0;line-height:1.1`,
      `<div style="font:italic 400 4.6em 'Instrument Serif',serif">Malcom McLean</div>
       <div style="margin-top:.6em;font:500 .85em 'Plex Mono',monospace;letter-spacing:.22em;opacity:.8">TRUCKER&nbsp;&nbsp;·&nbsp;&nbsp;BORN MAXTON, NORTH CAROLINA, 1913</div>`);
    const flash = K.div(L, 'inset:0;background:#f4fff8');
    sets.canyon = {
      scene, camera, trails: 0.42, step: 3,
      update(t, p, s) {
        motes.update(t);
        const k = K.inOut(p); const h = K.handheld(t, 0.06, 4);
        const z = K.lerp(6, -38, k);
        camera.position.set(0.6 + h.x, 1.7 + h.y, z); camera.lookAt(0.2, 2.0, z - 20); camera.rotation.z += h.r * 2;
        // lights snap to the tube grid nearest the camera, so they read as fixed fixtures
        const base = Math.ceil((z + 4) / 9) * 9 - 4;
        pls.forEach((l, j) => { l.position.set(0, 9.0, base - j * 9); l.intensity = 110 * (j === 2 && Math.floor(t * 24) % 17 < 2 ? 0.25 : 1); });
        name.style.opacity = K.range(t, 1.2, 2.2) * (1 - K.range(t, s.duration - 1.2, s.duration - 0.4));
        // deadpan flash cut in: two frames of overexposure
        flash.style.opacity = t < 1 / 12 ? 0.95 : t < 2 / 12 ? 0.45 : 0;
      },
    };
  }

  // =====================================================================
  // 5. TITLE — poster card. Container in silhouette, numeral, title.
  // =====================================================================
  {
    const scene = new THREE.Scene(); const camera = cam(26);
    K.voidStage(scene, { floor: 0x000000, fogDensity: 0.03 });
    const box = K.container({ color: STEEL_RED }); box.rotation.y = -0.25; scene.add(box);
    const rim = new THREE.SpotLight(0xffd2a8, 3000, 0, 0.5, 0.9, 2); rim.position.set(-4, 8, -14); rim.target = box; scene.add(rim);
    const rim2 = new THREE.SpotLight(0xd6463a, 900, 0, 0.35, 0.9, 2); rim2.position.set(12, 6, -10); rim2.target = box; scene.add(rim2);
    const L = layer('title');
    const num = K.div(L, `left:5.5%;bottom:5%;font:700 22em 'Archivo Narrow',sans-serif;line-height:.8;color:${K.RED};letter-spacing:-.04em`, '1');
    const title = K.div(L, `left:0;right:0;top:37%;text-align:center;font:400 12em 'Instrument Serif',serif;line-height:1;color:#f3ecdd;letter-spacing:-.01em`, 'The Box');
    const sub = K.div(L, `left:0;right:0;top:61%;text-align:center;font:500 .95em 'Plex Mono',monospace;letter-spacing:.3em;color:#cfc8ba`, "HOW A TRUCKER'S STEEL BOX REBUILT THE WORLD");
    const credit = K.div(L, `right:5.5%;bottom:6%;text-align:right;font:500 .8em 'Plex Mono',monospace;letter-spacing:.2em;color:#a9a294;line-height:1.7`, 'NEWARK&nbsp;·&nbsp;HOUSTON<br>1956');
    sets.title = {
      scene, camera,
      update(t, p, s) {
        camera.position.set(K.lerp(-2, 1, p), 1.0, 30 - p * 2); camera.lookAt(0, 3.4, 0);
        const on = t > 0.04 && t < s.duration - 0.35 ? 1 : 0; // hard on, hard off
        title.style.opacity = on; num.style.opacity = on;
        sub.style.opacity = on * K.range(t, 0.9, 1.0); credit.style.opacity = on * K.range(t, 1.3, 1.4);
        rim.intensity = 3000 * on; rim2.intensity = 900 * on;
      },
    };
  }

  // ---------------------------------------------------------------------
  let lastSet = null;
  return {
    frame({ T, shot, t, p }) {
      const set = sets[shot.id];
      // step-printing: hold scene time for N frames, smear the frames together
      const fps24 = 24;
      const tt = set.step ? Math.floor(t * fps24 / set.step) * set.step / fps24 : t;
      for (const id in groups) groups[id].style.display = id === shot.id ? 'block' : 'none';
      set.update(tt, set.step ? tt / shot.duration : p, shot);
      renderer.render(set.scene, set.camera);
      if (set.trails && lastSet === set) { cx.globalAlpha = 1 - set.trails; cx.drawImage(gl, 0, 0); cx.globalAlpha = 1; }
      else { cx.globalAlpha = 1; cx.drawImage(gl, 0, 0); }
      lastSet = set;
    },
  };
}
