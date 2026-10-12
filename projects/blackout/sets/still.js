// Direct-flash still life, documents, the terminal, the printout.
//
//   flash     a deadpan photojournalism still of a single object under a harsh on-camera flash, with a hard
//             shadow just behind it (STYLE.md device 3). params.object: 'mouse' | 'breaker-handle' | 'phone' |
//             'usb' | 'transformer' | 'printout' | 'led' | 'server'. The shutter + white pop are the transition
//             into it (cuts.mjs flash-pop); hold 1.5-2.5 s. caption (stencilled), source.
//   doc       a page on a desk under a desk lamp, flash-lit: the indictment, the CISA advisory, or a report.
//             params.mode: 'indictment' | 'advisory' | 'report'; highlight (a phrase that gets boxed in red),
//             stamp, caption, source
//   terminal  the attacker's side: hands on a keyboard in the dark, a screen of scrolling code / a command being
//             typed. No faces, no hoodies (STYLE.md). params: text (the command typed), lines (code context),
//             mode ('type' | 'scroll' | 'enter'). Used for cross-cutting.
//   (quote printout is provided here too, used by screens.js when params.mode === 'printout'.)
import * as THREE from 'three';
import * as PE from '/engine/people/index.js';
import * as LW from './lw.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL, FONT } = LW;

export default function makeStill(H) {
  const C = H.C;
  // stencilled flash caption: hard white VT323 caps on a corner, as if sprayed on the print
  function stencil(layer, text, css = 'left:6%;bottom:9%') {
    if (!text) return null;
    const s = H.sc();
    const el = H.K.div(layer, `opacity:1;${css};font:400 2.0em ${FONT.term};letter-spacing:.1em;color:${PAL.flash};text-shadow:0 0 1px rgba(0,0,0,.9),2px 2px 0 rgba(0,0,0,.6);text-transform:uppercase`, '');
    el.type = (t) => { const n = LW.typeCount(text, t, 0.25, 30, 2); el.textContent = LW.typed(text, n); };
    el.type(0); return el;
  }

  // ---------------------------------------------------------------- flash
  async function flash(ctx, shot) {
    const P = shot.params ?? {}, obj = P.object ?? 'mouse', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 42, near: 0.01, far: 40 });
    scene.background = new THREE.Color(0x020203);
    const fr = framing(obj);
    // the surface: a worn desk (wood laminate) indoors, or packed snow outside for the transformer
    const outdoor = obj === 'transformer';
    const surf = outdoor ? new THREE.MeshStandardMaterial({ color: 0xd9e2ec, roughness: 0.9, map: noiseTex(5, 0.85, 1) })
      : PE.props.pbr('Wood049', { repeat: [2.2, 2.2], color: 0x8a7a66, roughness: 0.62 });
    const table = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), surf); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
    // a back plane just behind the subject (wall / cabinet / night), so the flash shadow lands on something
    const backC = outdoor ? 0x0a0d12 : obj === 'breaker-handle' || obj === 'server' ? 0x2a2c2e : 0x3a3630;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshStandardMaterial({ color: backC, roughness: 0.9 })); back.position.set(0, 2.5, fr.wall ?? -0.6); back.receiveShadow = true; scene.add(back);
    const subject = new THREE.Group(); scene.add(subject);
    await buildObject(obj, subject); await PE.props.ready();
    subject.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // the on-camera flash: on the lens axis, a hand's width above it -> a crisp shadow offset just behind
    const flashL = new THREE.SpotLight(0xfff8ee, 1, 0, 0.9, 0.05, 2);
    flashL.castShadow = true; flashL.shadow.mapSize.set(2048, 2048); flashL.shadow.bias = -0.0002; flashL.shadow.normalBias = 0.002; flashL.shadow.radius = 0.5; flashL.shadow.camera.near = 0.05;
    scene.add(flashL, flashL.target);
    const amb = new THREE.AmbientLight(0x1a2026, outdoor ? 0.05 : 0.03); scene.add(amb);
    // frozen snow in the flash (outdoors only): flakes near the lens burn white
    let sn = null; if (outdoor) { sn = LW.snow({ count: 2500, box: [6, 4, 6], center: [0, 1.6, 1.2], size: 0.03, speed: 0, seed: 12, base: 0.0 }); sn.light(0, [0, 0, 0], [0, 0, -1], 0.5, 6, [3, 3, 2.9]); scene.add(sn.points); }
    // photographic finish on the print: fast vignette, grain, the date stamp in orange LCD digits
    const s = H.sc();
    const vig = H.K.div(layer, `opacity:1;inset:0;background:radial-gradient(ellipse 62% 70% at 50% 56%, rgba(0,0,0,0) 30%, rgba(0,0,0,.55) 72%, rgba(0,0,0,.92) 100%)`, '');
    const grain = LW.canvas(480, 270); grain.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:overlay;opacity:.32;image-rendering:auto'; layer.appendChild(grain);
    const stamp = H.K.div(layer, `opacity:1;right:6.5%;bottom:7%;font:400 ${2.6}em ${FONT.term};letter-spacing:.14em;color:#ff8a1e;text-shadow:0 0 6px rgba(255,120,20,.85),0 0 16px rgba(255,90,10,.45)`, P.stamp ?? '15 12 23');
    const cap = P.caption ? stencil(layer, P.caption, 'left:6.5%;bottom:7.5%') : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    let lastG = -1;
    return { scene, camera, layer,
      update(t) {
        LW.breathe(camera, t, fr.pos, fr.look, { amp: 0.0015, seed: 3 });
        camera.fov = LW.mmFov(fr.mm); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
        // flash head: just above the lens, aimed down the lens axis
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        flashL.position.copy(camera.position).addScaledVector(up, fr.up ?? 0.07); flashL.target.position.copy(camera.position).addScaledVector(fwd, 2);
        flashL.intensity = (fr.power ?? 9) * (1 - 0.05 * sstep(0, 0.5, t));
        if (sn) sn.update(0.37, camera, ctx.height), sn.light(0, flashL.position.toArray(), fwd.toArray(), 0.6, 6, [3, 3, 2.9]);
        // grain: a new seeded field every frame (24 fps like film), deterministic in t
        const gi = Math.floor(t * 24); if (gi !== lastG) { lastG = gi; const id = grain.g.createImageData(480, 270), r = LW.rng(gi * 7919 + 13); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } grain.g.putImageData(id, 0, 0); }
        cap?.type(t);
      },
      dispose() {} };
  }
  function noiseTex(seed, lo, hi) { const c = LW.noiseCanvas(256, 256, seed, { scale: 12, lo: lo * 255, hi: hi * 255 }); const t = LW.ctex(c, { repeat: [6, 6] }); return t; }
  // the camera: deadpan, frontal-ish, a little high, the subject centred low; power: flash intensity at that distance
  const framing = (obj) => ({
    mouse: { pos: [0.03, 0.34, 0.46], look: [0, 0.02, -0.03], mm: 55, power: 2.0, wall: -0.45, up: 0.13 },
    'breaker-handle': { pos: [0.14, 1.0, 1.75], look: [0, 0.98, -0.06], mm: 42, power: 9, wall: -0.08, up: 0.12 },
    phone: { pos: [0.1, 0.62, 0.86], look: [0.06, 0.03, -0.02], mm: 42, power: 4.5, wall: -0.5, up: 0.12 },
    usb: { pos: [0.02, 0.22, 0.26], look: [0, 0.01, -0.01], mm: 60, power: 1.2, wall: -0.4 },
    transformer: { pos: [0.3, 1.25, 2.6], look: [0, 0.9, 0], mm: 40, power: 26, wall: -3.5, up: 0.1 },
    printout: { pos: [0.02, 0.7, 0.55], look: [0, 0.01, -0.04], mm: 42, power: 4, wall: -0.6 },
    led: { pos: [-0.1, 0.22, 0.3], look: [-0.17, 0.16, 0], mm: 70, power: 1.4, wall: -0.06 },
    server: { pos: [0.25, 1.0, 1.9], look: [0, 0.85, 0], mm: 40, power: 14, wall: -0.5 },
  }[obj] ?? { pos: [0.02, 0.4, 0.5], look: [0, 0.03, 0], mm: 50, power: 3 });

  // ---- objects (metres, resting on y = 0, facing +z = the camera)
  const PH = (c, r = 0.45, extra = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.25, clearcoatRoughness: 0.4, ...extra });
  function mouseBody() {
    // a 2000s office mouse: an egg-shaped dome, flat underside, a little narrower and lower at the front
    const g = new THREE.SphereGeometry(1, 64, 40), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const front = THREE.MathUtils.smoothstep(z, -0.2, 1); // z+ = front (cable end)
      x *= 0.031 * (1 - 0.18 * front); z *= 0.058; y = y < 0 ? y * 0.004 : y * 0.034 * (1 - 0.3 * front) * (1 - 0.15 * Math.pow(Math.abs(x) / 0.031, 2));
      p.setXYZ(i, x, y + 0.006, z); }
    g.computeVertexNormals(); return g;
  }
  async function buildObject(obj, g) {
    const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    if (obj === 'mouse' || obj === 'usb') {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.003, 0.19), M(0x1b2a3a, 0.95)); pad.position.set(0.01, 0.0015, 0.0); g.add(pad);
      // the pad's printed logo, worn
      const pc = LW.canvas(256, 212); pc.g.fillStyle = '#1b2a3a'; pc.g.fillRect(0, 0, 256, 212); pc.g.globalAlpha = 0.5; pc.g.fillStyle = '#9fb1c0'; pc.g.font = `22px ${FONT.ui}`; pc.g.fillText('DISTRIBUTION · OBLENERGO', 20, 196);
      for (let i = 0; i < 400; i++) { pc.g.fillStyle = `rgba(200,210,220,${0.04 * hash(i)})`; pc.g.fillRect(hash(i, 1) * 256, hash(i, 2) * 212, 3, 1); }
      pad.material = new THREE.MeshStandardMaterial({ map: LW.ctex(pc), roughness: 0.95 });
    }
    if (obj === 'mouse') {
      const m = new THREE.Group(); m.rotation.y = Math.PI; g.add(m);
      // the shell's print: the two-button split and the button seam, a faint logo, wear on the palm
      const mc = LW.canvas(512, 256), x = mc.g; x.fillStyle = '#cfcbc0'; x.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(90,80,60,${0.05 * hash(i, 'w')})`; x.fillRect(hash(i, 1) * 512, 40 + hash(i, 2) * 80, 2, 2); }
      x.strokeStyle = '#4a463e'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 70); x.stroke(); // split between the buttons
      x.beginPath(); for (let u = 0; u <= 256; u += 4) { const y = 70 + 6 * Math.cos((u - 128) / 128 * Math.PI); u ? x.lineTo(u, y) : x.moveTo(u, y); } x.stroke(); // seam
      x.fillStyle = 'rgba(70,64,52,.55)'; x.font = `italic 13px ${FONT.ui}`; x.save(); x.translate(384, 40); x.scale(0.6, 1); x.fillText('optical', -20, 0); x.restore();
      const shell = PH(0xffffff, 0.38, { map: LW.ctex(mc) });
      const body = new THREE.Mesh(mouseBody(), shell); body.position.set(0, 0.003, 0); m.add(body);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.0062, 24), M(0x262626, 0.8)); wheel.rotation.z = Math.PI / 2; wheel.position.set(0, 0.0315, 0.017); m.add(wheel);
      for (let i = 0; i < 20; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.0064, 0.0009, 0.0011), M(0x141414, 0.85)); const a = i / 20 * Math.PI * 2; r.position.set(0, 0.0315 + Math.sin(a) * 0.0088, 0.017 + Math.cos(a) * 0.0088); r.rotation.x = -a; m.add(r); }
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.002, 0.019), M(0x1a1a18, 0.9)); slot.position.set(0, 0.0352, 0.017); m.add(slot);
      // the cable out of the front, across the desk
      const cab = new THREE.CatmullRomCurve3([[0, 0.012, 0.058], [0.004, 0.006, 0.09], [-0.02, 0.003, 0.16], [0.04, 0.003, 0.25], [0.02, 0.003, 0.4]].map(p => new THREE.Vector3(p[0], p[1], -p[2])));
      // cable leaves the FRONT (toward the monitor, away from the camera)
      g.add(new THREE.Mesh(new THREE.TubeGeometry(cab, 64, 0.0019, 8), M(0x2a2826, 0.5)));
      g.rotation.y = 0.35;
    }
    else if (obj === 'usb') { const body = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.052, 2, 2, 2), PH(0x1a1b1f, 0.35)); body.position.set(0, 0.0045, 0); g.add(body);
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0045, 0.012), M(0xd8d8d8, 0.2, 1)); conn.position.set(0, 0.0045, 0.032); g.add(conn);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.003, 0.0009, 6, 16), M(0x888888, 0.3, 1)); ring.position.set(0, 0.0045, -0.03); ring.rotation.x = Math.PI / 2; g.add(ring);
      const led = new THREE.Mesh(new THREE.CircleGeometry(0.0012, 10), new THREE.MeshBasicMaterial({ color: 0xff3020 })); led.rotation.x = -Math.PI / 2; led.position.set(0.004, 0.0087, -0.015); g.add(led);
      g.rotation.y = -0.6; }
    else if (obj === 'breaker-handle') {
      // a switchgear door: grey enamel steel, rivets, a label plate, a black lever in a moulded housing, OFF
      const steel = PE.props.pbr('Metal032', { repeat: [1.5, 1.5], color: 0x7e8a86, roughness: 0.55, metalness: 0.35 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.04), steel); door.position.set(0, 0.85, -0.06); g.add(door);
      for (const [x, y] of [[-0.55, 1.6], [0.55, 1.6], [-0.55, 0.1], [0.55, 0.1]]) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M(0x6a6e6a, 0.4, 0.8)); r.position.set(x, y, -0.035); g.add(r); }
      const house = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.06, 2, 2, 2), PH(0x161616, 0.5)); house.position.set(0, 0.85, -0.01); g.add(house);
      const lever = new THREE.Group(); lever.position.set(0, 0.85, 0.025); lever.rotation.x = 0.55; g.add(lever); // tipped down: OFF
      lever.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.18), PH(0x101010, 0.42)).translateZ(0.09));
      lever.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.05), PH(0xb81e14, 0.45)).translateZ(0.18));
      for (const [y, txt, col] of [[1.08, 'I  ON', '#1a1a1a'], [0.62, 'O  OFF', '#b81e14']]) { const c = LW.canvas(256, 72); c.g.fillStyle = '#e4e0d4'; c.g.fillRect(0, 0, 256, 72); c.g.fillStyle = col; c.g.font = `bold 40px ${FONT.ui}`; c.g.textBaseline = 'middle'; c.g.fillText(txt, 18, 38);
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.056), new THREE.MeshStandardMaterial({ map: LW.ctex(c), roughness: 0.5 })); pl.position.set(0, y, -0.038); g.add(pl); }
      { const c = LW.canvas(512, 160); c.g.fillStyle = '#d9d4c4'; c.g.fillRect(0, 0, 512, 160); c.g.fillStyle = '#222'; c.g.font = `bold 46px ${FONT.mono}`; c.g.fillText('Q13  F-13', 24, 64); c.g.font = `30px ${FONT.mono}`; c.g.fillText('10 kV  SS-07', 24, 120);
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.11), new THREE.MeshStandardMaterial({ map: LW.ctex(c), roughness: 0.55 })); pl.position.set(0, 1.35, -0.038); g.add(pl); }
    }
    else if (obj === 'phone') {
      // a 2000s office desk phone, beige: wedge base, keypad, display; the handset off the hook beside it
      const beige = PH(0xd8d0bc, 0.42);
      const shape = new THREE.Shape(); shape.moveTo(-0.1, 0); shape.lineTo(0.1, 0); shape.lineTo(0.1, 0.035); shape.lineTo(-0.1, 0.075); shape.closePath();
      const base = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.21, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 4 }), beige); base.rotation.y = Math.PI / 2; base.position.set(-0.105, 0.0, 0.1); g.add(base);
      for (let i = 0; i < 12; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.008, 0.018, 1, 1, 1), PH(0xefe9da, 0.5)); const r = Math.floor(i / 3), c = i % 3; k.position.set(-0.03 + c * 0.03, 0.05 - r * 0.0075 + 0.006, -0.02 + r * 0.025); k.rotation.x = -0.19; g.add(k); }
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.025), new THREE.MeshStandardMaterial({ color: 0x42523a, roughness: 0.3, emissive: 0x0a1206 })); disp.rotation.x = -Math.PI / 2 - 0.19; disp.position.set(0.0, 0.07, -0.07); g.add(disp);
      // the cradle, empty
      const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.2), PH(0xcfc6b0, 0.45)); cradle.position.set(0.07, 0.062, 0); g.add(cradle);
      // handset lying on the desk, receiver up
      const hs = new THREE.Group(); hs.position.set(0.21, 0.022, 0.06); hs.rotation.set(0, -0.5, 0.12); g.add(hs);
      const arc = new THREE.CatmullRomCurve3([[-0.09, 0, 0], [-0.04, 0.012, 0], [0.04, 0.012, 0], [0.09, 0, 0]].map(p => new THREE.Vector3(...p)));
      hs.add(new THREE.Mesh(new THREE.TubeGeometry(arc, 30, 0.017, 16), beige));
      for (const sx of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.022, 0.03, 24), beige); cup.position.set(sx * 0.095, -0.004, 0); g.add(cup); cup.removeFromParent(); hs.add(cup);
        const holes = new THREE.Mesh(new THREE.CircleGeometry(0.018, 20), M(0x4a4436, 0.8)); holes.rotation.x = -Math.PI / 2; holes.position.set(sx * 0.095, 0.0115, 0); hs.add(holes); }
      // the coiled cord: a helix from the handset to the base
      const pts = []; for (let i = 0; i <= 300; i++) { const u = i / 300; const a = u * Math.PI * 2 * 26; const cx = THREE.MathUtils.lerp(0.13, -0.02, u), cz = THREE.MathUtils.lerp(0.1, 0.17, u) + 0.05 * Math.sin(u * Math.PI);
        pts.push(new THREE.Vector3(cx + 0.006 * Math.cos(a), 0.008 + 0.006 * Math.sin(a), cz + 0.002 * Math.sin(a * 0.5))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.0016, 5), M(0xbfb6a0, 0.55)));
      g.rotation.y = -0.15;
    }
    else if (obj === 'transformer') {
      const tank = PE.props.pbr('Metal032', { repeat: [2, 2], color: 0x5f6a62, roughness: 0.5, metalness: 0.4 });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.8, 2, 2, 2), tank).translateY(0.55));
      for (const sx of [-1, 1]) for (let i = 0; i < 12; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.012), tank).translateX(sx * 0.63).translateY(0.52).translateZ(-0.33 + i * 0.06));
      for (const bx of [-0.3, 0, 0.3]) { const b = new THREE.Group(); b.position.set(bx, 1.05, 0.1); for (let i = 0; i < 7; i++) b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055 + 0.025 * (i % 2), 0.055 + 0.025 * (i % 2), 0.035, 18), PH(0x7e5a3a, 0.25)).translateY(0.03 + i * 0.045)); g.add(b); }
      const snowM = new THREE.MeshStandardMaterial({ color: 0xeef3f8, roughness: 0.85 });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.07, 0.86, 8, 1, 6), snowM).translateY(1.085));
      for (let i = 0; i < 16; i++) { const ic = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05 + 0.1 * hash(i, 'ic'), 6), new THREE.MeshPhysicalMaterial({ color: 0xcfe6f0, roughness: 0.1, transmission: 0.5, transparent: true, opacity: 0.8 })); ic.rotation.x = Math.PI; ic.position.set(-0.52 + i * 0.07, 1.0, 0.41); g.add(ic); }
      const nameplate = LW.canvas(256, 128); nameplate.g.fillStyle = '#c9c3b2'; nameplate.g.fillRect(0, 0, 256, 128); nameplate.g.fillStyle = '#222'; nameplate.g.font = `bold 26px ${FONT.mono}`; nameplate.g.fillText('ТМ-400/10', 14, 46); nameplate.g.font = `20px ${FONT.mono}`; nameplate.g.fillText('10/0.4 kV  400 kVA', 14, 90);
      g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshStandardMaterial({ map: LW.ctex(nameplate), roughness: 0.5 })).translateY(0.6).translateZ(0.401));
    }
    else if (obj === 'led' || obj === 'server') {
      // a 19" rack of 1U/2U servers: front panels with vents, drive bays, labels; most power LEDs dark
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.9), PH(0x111214, 0.5)); rack.position.set(0, 0.9, -0.45); if (obj === 'server') g.add(rack);
      const units = obj === 'server' ? 14 : 1;
      for (let u = 0; u < units; u++) {
        const hU = u % 4 === 0 ? 2 : 1, c = LW.canvas(512, 44 * hU); const x = c.g;
        x.fillStyle = '#2b2e32'; x.fillRect(0, 0, 512, 44 * hU); x.fillStyle = '#1c1e21';
        for (let i = 0; i < 36; i++) for (let j = 0; j < 2 * hU; j++) x.fillRect(150 + i * 6 + (j % 2) * 3, 8 + j * 9, 3, 5); // vent holes
        for (let k = 0; k < 4; k++) { x.fillStyle = '#3a3e43'; x.fillRect(380 + k * 30, 6, 26, 44 * hU - 12); x.fillStyle = '#16181a'; x.fillRect(383 + k * 30, 10, 20, 4); }
        x.fillStyle = '#e8e4d8'; x.fillRect(14, 10, 70, 14); x.fillStyle = '#222'; x.font = `11px ${FONT.mono}`; x.fillText(`DC-${String(u + 1).padStart(2, '0')}`, 18, 21);
        const front = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.0445 * hU), new THREE.MeshStandardMaterial({ map: LW.ctex(c), roughness: 0.45, metalness: 0.4 }));
        const y = obj === 'server' ? 0.12 + u * 0.115 : 0.16; front.position.set(0, y, 0.002); g.add(front);
        const on = obj === 'led' ? true : hash(u, 'pw') > 0.82;
        const led = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 12), new THREE.MeshBasicMaterial({ color: on ? new THREE.Color(0x40ff90).multiplyScalar(3) : 0x0c0c0c })); led.position.set(-0.2, y, 0.004); g.add(led);
        if (obj === 'led') { const l2 = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa24a).multiplyScalar(3) })); l2.position.set(-0.18, y, 0.004); g.add(l2); }
      }
    }
    else if (obj === 'printout') { const page = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.28, 20, 12), printTex()); page.rotation.x = -Math.PI / 2; page.position.y = 0.004;
      const pa = page.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.008 * Math.sin(pa.getX(i) * 14) + 0.004 * pa.getY(i)); page.geometry.computeVertexNormals(); g.add(page); }
  }
  function labelTex(txt) { const c = LW.canvas(256, 64); c.g.fillStyle = '#d8d4c8'; c.g.fillRect(0, 0, 256, 64); c.g.fillStyle = '#111'; c.g.font = `bold 34px ${FONT.ui}`; c.g.textBaseline = 'middle'; c.g.fillText(txt, 10, 34); return new THREE.MeshStandardMaterial({ map: LW.ctex(c), roughness: 0.6 }); }
  function printTex() { const c = LW.canvas(720, 500); c.g.fillStyle = '#e9efd9'; c.g.fillRect(0, 0, 720, 500); for (let i = 0; i < 10; i++) { c.g.fillStyle = i % 2 ? '#d7e6c4' : '#e9efd9'; c.g.fillRect(0, i * 50, 720, 50); }
    c.g.fillStyle = '#20302a'; c.g.font = `22px ${FONT.mono}`; for (let i = 0; i < 9; i++) c.g.fillText(`${15}:${31 + i}:0${i}  SS-0${1 + i % 7}  CB OPEN  REMOTE`, 20, 40 + i * 50); return new THREE.MeshStandardMaterial({ map: LW.ctex(c), roughness: 0.85 }); }

  // ---------------------------------------------------------------- doc
  async function doc(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'indictment', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 36, near: 0.02, far: 30 });
    scene.background = new THREE.Color(0x070707);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.6, map: tx('/assets/pbr/concrete.a.jpg', 3, 0x2a2018) })); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
    function tx(u, rep, col) { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; return t; }
    const paper = docCanvas(mode, P); const pt = LW.ctex(paper);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.99), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.9 })); page.rotation.x = -Math.PI / 2; page.position.y = 0.002; page.receiveShadow = true; scene.add(page);
    // a second page peeking under it
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.99), new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.9 })); p2.rotation.x = -Math.PI / 2; p2.position.set(0.04, 0.001, 0.05); p2.rotation.z = 0.06; scene.add(p2);
    // the desk lamp: a warm, tight pool from the upper left; plus a hard flash option
    const lamp = new THREE.SpotLight(0xffe0a8, 24, 6, 0.6, 0.6, 1.6); lamp.position.set(-0.7, 0.9, 0.5); lamp.target.position.set(0.05, 0, -0.05); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); scene.add(lamp, lamp.target);
    const flashL = new THREE.PointLight(0xfff8ee, 0, 10, 2); flashL.position.set(0.1, 1.6, 1.2); scene.add(flashL);
    scene.add(new THREE.AmbientLight(0x181410, 0.1));
    // a red grease-pencil box around the highlight phrase appears on its cue
    const boxEl = P.highlight ? H.K.svgLayer(layer) : null;
    const cap = P.caption ? H.caption(layer, P.caption) : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    const tHi = H.cue(shot, P.highlightAt, D * 0.55);
    const rig = C.path([{ pos: [0.05, 1.05, 0.95], look: [0.03, 0, -0.08], mm: 42 }, { pos: [0.0, 0.98, 0.82], look: [0.03, 0, -0.12], mm: 45 }], { duration: D, accel: 0.3, decel: 0.5, float: 0.004, seed: 11 });
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        flashL.intensity = P.flash ? 40 * Math.exp(-Math.max(0, t) * 3) : 0;
        if (boxEl && paper.hi) { const k = smoother(range(t, tHi, tHi + 0.4));
          // project the highlight rect (paper uv) to screen
          const uv = paper.hi, world = (u, v) => new THREE.Vector3((u - 0.5) * 0.72, 0.003, (v - 0.5) * 0.99);
          const pts = [[uv[0], uv[1]], [uv[0] + uv[2], uv[1]], [uv[0] + uv[2], uv[1] + uv[3]], [uv[0], uv[1] + uv[3]]].map(([u, v]) => { const w = world(u, v).project(camera); return [(w.x * 0.5 + 0.5) * 1920, (0.5 - w.y * 0.5) * 1080]; });
          boxEl.innerHTML = k > 0 ? `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${PAL.red}" stroke-width="${5}" stroke-linejoin="round" stroke-dasharray="${pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0) + 400}" stroke-dashoffset="${(1 - k) * 2000}" opacity="0.95"/>` : ''; }
        cap?.type(t);
      },
      dispose() {} };
  }
  function docCanvas(mode, P) {
    const c = LW.canvas(880, 1210), g = c.g; g.fillStyle = '#ece7d8'; g.fillRect(0, 0, 880, 1210);
    // paper grain
    g.globalAlpha = 0.04; for (let i = 0; i < 2600; i++) { g.fillStyle = hash(i) > 0.5 ? '#000' : '#fff'; g.fillRect(hash(i, 1) * 880, hash(i, 2) * 1210, 1, 1); } g.globalAlpha = 1;
    g.fillStyle = '#1a1712';
    const head = (txt, y, sz = 26, al = 'center', font = FONT.mono) => { g.font = `${sz}px ${font}`; g.textAlign = al; g.fillText(txt, al === 'center' ? 440 : 80, y); g.textAlign = 'left'; };
    const body = (lines, y, sz = 18, x = 80) => { g.font = `${sz}px ${FONT.mono}`; g.fillStyle = '#2a251c'; for (const ln of lines) { g.fillText(ln, x, y); y += sz * 1.55; } return y; };
    let hi = null;
    if (mode === 'indictment') {
      head('UNITED STATES DISTRICT COURT', 90); head('WESTERN DISTRICT OF PENNSYLVANIA', 122);
      g.strokeStyle = '#1a1712'; g.lineWidth = 1; g.beginPath(); g.moveTo(80, 150); g.lineTo(800, 150); g.stroke();
      body(['UNITED STATES OF AMERICA', '', '              v.', '', 'YULIY SERGEYEVICH ANDRIENKO, et al.,', 'Defendants.'], 200, 20);
      head('I N D I C T M E N T', 430, 30);
      let y = body(['COUNT ONE', '(Conspiracy to Commit Computer Fraud)', '', 'The Grand Jury charges:', '', 'Beginning in or around November 2015, the', 'defendants, officers of Unit 74455 of the', 'Russian Main Intelligence Directorate (GRU),', 'did knowingly cause the transmission of code', 'and commands to protected computers operating', "Ukraine's electricity grid, resulting in", 'blackouts affecting hundreds of thousands of', 'customers.'], 500, 19);
      hi = [80 / 880, 905 / 1210, 720 / 880, 86 / 1210]; // the "Ukraine's electricity grid" lines
      g.font = `15px ${FONT.mono}`; g.fillStyle = '#6a5c44'; g.fillText('Case 2:20-cr-00316  ·  Document 1  ·  Filed 10/15/20', 80, 1170);
    } else if (mode === 'advisory') {
      g.fillStyle = '#143a5a'; g.fillRect(0, 0, 880, 70); g.fillStyle = '#fff'; head('CISA  ·  CYBERSECURITY ADVISORY', 46, 26, 'left', FONT.ui);
      g.fillStyle = '#1a1712'; head('AA24-038A', 120, 22, 'left'); head('PRC State-Sponsored Actors Compromise and', 160, 22, 'left'); head('Maintain Persistent Access to U.S. Critical', 196, 22, 'left'); head('Infrastructure', 232, 22, 'left');
      g.strokeStyle = '#143a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(80, 260); g.lineTo(800, 260); g.stroke();
      body(['SUMMARY', '', 'The authoring agencies assess that PRC state-', 'sponsored cyber actors are seeking to pre-', 'position themselves on IT networks for', 'disruptive or destructive cyberattacks against', 'U.S. critical infrastructure in the event of a', 'major crisis or conflict with the United States.', '', 'This is NOT consistent with traditional cyber', 'espionage operations.'], 320, 20);
      hi = [80 / 880, 395 / 1210, 720 / 880, 175 / 1210];
      g.font = `15px ${FONT.mono}`; g.fillStyle = '#6a5c44'; g.fillText('Joint advisory · NSA · FBI · CISA · 7 Feb 2024', 80, 1170);
    } else {
      head(P.title ?? 'TLP:WHITE  ·  JOINT ANALYSIS', 90, 24, 'left'); g.strokeStyle = '#1a1712'; g.beginPath(); g.moveTo(80, 118); g.lineTo(800, 118); g.stroke();
      body(P.lines ?? ['Analysis of the Cyber Attack on the', 'Ukrainian Power Grid', '', 'The malware itself did not directly cause', 'the outage. Based on the analysis, the', 'outage was caused by the use of the', "control systems' own HMI software by", 'remote attackers.'], 180, 20);
      hi = P.hi ?? [80 / 880, 335 / 1210, 720 / 880, 120 / 1210];
    }
    c.hi = P.highlight ? hi : null; return c;
  }

  // ---------------------------------------------------------------- terminal (the attacker's hands)
  async function terminal(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration;
    await PE.preload({ wardrobe: ['hoodie'] }); // body only; we never show the torso/face
    const { scene, camera, layer } = H.base(ctx, { fov: 34, near: 0.02, far: 20 });
    scene.background = new THREE.Color(0x030405);
    // a real desk at 0.74 m; the attacker sits at it (we frame only the hands, keyboard and screen)
    const DT = 0.74;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const dk = PE.props.desk({ width: 1.6 }); scene.add(dk);
    const kb = PE.props.keyboard(); kb.position.set(0, DT, 0.1); scene.add(kb);
    const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.4 })); mouse.scale.set(1, 0.55, 1.7); mouse.position.set(0.34, DT + 0.016, 0.12); scene.add(mouse);
    // the screen: scrolling code / a command line, on the attacker's monitor (the only light)
    const scr = LW.canvas(1024, 640); const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace;
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.41), new THREE.MeshBasicMaterial({ map: scrTex, color: new THREE.Color(1.3, 1.3, 1.3) })); mon.position.set(0, DT + 0.36, -0.5); scene.add(mon);
    const bez = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.47, 0.03), new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.4 })); bez.position.set(0, DT + 0.36, -0.52); scene.add(bez);
    bez.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.04), new THREE.MeshStandardMaterial({ color: 0x0d0e10 })).translateY(-0.33).translateZ(0.02));
    // the monitor is the key (cold, from the front); a faint warm practical behind for a rim on the hands
    const scrL = new THREE.SpotLight(0x9fe8c8, 14, 2.8, 1.1, 0.8, 1.6); scrL.position.set(0, DT + 0.5, -0.3); scrL.target.position.set(0, DT, 0.15); scrL.castShadow = true; scrL.shadow.mapSize.set(1024, 1024); scene.add(scrL, scrL.target);
    const rim = new THREE.PointLight(0xff8a50, 3.0, 3, 1.8); rim.position.set(0.9, DT + 0.5, 1.0); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x0a1410, 0.06));
    // the attacker, seated, hands on the keyboard (torso in shadow, no face in frame)
    const man = PE.person('hoodie', { dress: { silhouette: { color: 0x0c0e10 } } }); man.root.position.set(0, 0, 0.98); man.root.rotation.y = Math.PI; scene.add(man.root);
    man.play('sit_type', 0).update(); const hip = man.worldPos('pelvis'); man.root.position.set(man.root.position.x - hip.x, man.root.position.y - hip.y + 0.46, man.root.position.z - hip.z + 0.9);
    const ch = PE.props.chair(); ch.position.set(0, 0, 1.0); scene.add(ch);
    await PE.props.ready();
    const text = P.text ?? 'ipconfig /all', at = 0.6, cps = P.cps ?? 10;
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    const keysV = new THREE.Vector3(0, DT + 0.02, 0.1), mouseV = new THREE.Vector3(0.34, DT + 0.02, 0.12);
    const rig = C.path([{ pos: [0.52, DT + 0.42, 0.82], look: [0.0, DT + 0.04, -0.02], mm: 40 }, { pos: [0.44, DT + 0.38, 0.72], look: [0.0, DT + 0.03, -0.08], mm: 42 }], { duration: D, accel: 0.3, decel: 0.5, float: 0.008, seed: 13 });
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        drawTerminalScreen(scr.g, 1024, 640, t, { text, at, cps, mode: P.mode ?? 'type', lines: P.lines }); scrTex.needsUpdate = true;
        PE.acts.typing(man, t, { keys: keysV, screen: new THREE.Vector3(0, DT + 0.36, -0.5), seed: 3, lean: 0.02, mouse: true });
        cap?.type(t);
      },
      dispose() {} };
  }
  function drawTerminalScreen(g, w, h, t, { text, at, cps, mode, lines }) {
    LW.reset(g); g.fillStyle = '#030705'; g.fillRect(0, 0, w, h);
    g.font = `22px ${FONT.mono}`; const lh = 26; let y = 30;
    const code = lines ?? ['C:\\> whoami /priv', 'SeTcbPrivilege                Enabled', 'C:\\> net group "Domain Admins" /domain', '...', 'C:\\> psexec \\\\SCADA-HMI-01 -u svc_scada cmd', 'Connecting to SCADA-HMI-01...', 'Starting PSEXESVC...'];
    const shown = Math.min(code.length, Math.floor(range(t, 0, 1.8) * code.length));
    for (let i = 0; i < shown; i++) { g.fillStyle = code[i].startsWith('C:\\>') ? '#8fffc0' : '#3f9a6a'; g.fillText(code[i], 24, y); y += lh; }
    y += 6;
    const n = LW.typeCount(text, t, at + 1.2, cps, 4);
    g.fillStyle = '#eaffee'; g.fillText('C:\\SCADA> ' + LW.typed(text, n), 24, y);
    g.font = `22px ${FONT.mono}`; if (n < text.length || Math.floor(t * 2.2) % 2) { const pre = 'C:\\SCADA> ' + LW.typed(text, n); LW.cursorBlock(g, 24 + g.measureText(pre).width + 4, y, 22, t, { color: '#8fffc0' }); }
    if (mode === 'enter' && n >= text.length && t > at + 2.5) { g.fillStyle = '#8fffc0'; g.fillText('> command sent to RTU. breaker Q13: OPEN', 24, y + lh); }
    // scanlines
    g.globalAlpha = 0.06; g.fillStyle = '#000'; for (let yy = 0; yy < h; yy += 3) g.fillRect(0, yy, w, 1); g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- printout (used by screens.js quote mode)
  H.printout = async function printout(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration, text = P.text ?? '', by = String(P.by ?? '').toUpperCase();
    const { scene, camera, layer } = H.base(ctx, { fov: 36, near: 0.02, far: 20 });
    scene.background = new THREE.Color(0x060706);
    const deskM = new THREE.MeshStandardMaterial({ color: 0x14160f, roughness: 0.7 });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), deskM); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
    const paper = LW.canvas(720, 1000); const pt = new THREE.CanvasTexture(paper); pt.colorSpace = THREE.SRGBColorSpace;
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.0, 1, 20), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.85 })); page.rotation.x = -Math.PI / 2; page.position.y = 0.003; page.receiveShadow = true;
    const pa = page.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.006 * Math.sin(pa.getY(i) * 20)); page.geometry.computeVertexNormals(); scene.add(page);
    const lamp = new THREE.SpotLight(0xd8ffe6, 20, 5, 0.6, 0.7, 1.6); lamp.position.set(-0.5, 0.9, 0.6); lamp.target.position.set(0.05, 0, 0); lamp.castShadow = true; scene.add(lamp, lamp.target);
    scene.add(new THREE.AmbientLight(0x101810, 0.1));
    const at = H.M.vo0(shot) + 0.2, cps = clamp(text.length / Math.max(1.2, (shot.voDur || D) * 0.8), 10, 30);
    const cap = P.caption ? H.caption(layer, P.caption) : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    const rig = C.path([{ pos: [0.03, 1.0, 0.85], look: [0.02, 0, -0.1], mm: 40 }, { pos: [0.0, 0.92, 0.74], look: [0.02, 0, -0.15], mm: 43 }], { duration: D, accel: 0.3, decel: 0.5, float: 0.004, seed: 15 });
    return { scene, camera, layer,
      update(t, p) {
        rig(camera, p, t);
        LW.reset(paper.g); paper.g.fillStyle = '#e9efd9'; paper.g.fillRect(0, 0, 720, 1000);
        for (let i = 0; i < 20; i++) { paper.g.fillStyle = i % 2 ? '#dcead0' : '#e9efd9'; paper.g.fillRect(0, i * 50, 720, 50); }
        for (const sx of [20, 700]) for (let i = 0; i < 20; i++) { paper.g.fillStyle = '#c4cbb0'; paper.g.beginPath(); paper.g.arc(sx, 25 + i * 50, 7, 0, 7); paper.g.fill(); } // tractor-feed holes
        paper.g.fillStyle = '#20302a'; paper.g.font = `26px ${FONT.mono}`;
        paper.g.fillText('> SYSTEM LOG', 60, 54);
        const words = text.split(/\s+/); const lines = []; let cur = ''; paper.g.font = `30px ${FONT.mono}`;
        for (const wd of words) { const s = cur ? cur + ' ' + wd : wd; if (paper.g.measureText(s).width > 600 && cur) { lines.push(cur); cur = wd; } else cur = s; } if (cur) lines.push(cur);
        const n = LW.typeCount(text, t, at, cps, 9); let k = n, y = 160;
        for (const ln of lines) { const s = ln.slice(0, Math.max(0, k)); k -= ln.length + 1; paper.g.fillStyle = '#1a2a24'; paper.g.fillText(s, 60, y); y += 48; }
        if (by && n >= text.length) { paper.g.fillStyle = '#4a5a4a'; paper.g.font = `24px ${FONT.mono}`; paper.g.fillText('-- ' + by, 60, y + 20); }
        pt.needsUpdate = true; cap?.type(t);
      },
      dispose() {} };
  };

  return { flash, doc, terminal };
}
