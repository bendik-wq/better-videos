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
    const { scene, camera, layer } = H.base(ctx, { fov: 42, near: 0.02, far: 40 });
    scene.background = new THREE.Color(0x05070a);
    // the deadpan table: a seamless mid-grey surface receding, the subject centred
    const tableM = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.82 });
    const table = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), tableM); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.9 })); back.position.set(0, 7, -1.6); back.receiveShadow = true; scene.add(back);
    const subject = new THREE.Group(); scene.add(subject);
    buildObject(obj, subject);
    subject.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // the on-camera flash: a hard point light just at the lens, slightly above, so the shadow falls just behind
    const flashL = new THREE.PointLight(0xfff8ee, 260, 30, 1.3); flashL.position.set(0.12, 1.9, 2.6); flashL.castShadow = true; flashL.shadow.mapSize.set(2048, 2048); flashL.shadow.bias = -0.0004; flashL.shadow.radius = 1.5; scene.add(flashL);
    const fill = new THREE.AmbientLight(0x1c2228, 0.06); scene.add(fill);
    const cap = P.caption ? stencil(layer, P.caption) : null, src = P.source ? H.sourceLine(layer, P.source) : null;
    // framing: a precise, locked, frontal composition (planimetric); the flash falloff vignettes the edges
    const fr = framing(obj);
    return { scene, camera, layer,
      update(t) {
        LW.breathe(camera, t, fr.pos, fr.look, { amp: 0.0025, seed: 3 });
        camera.fov = fr.mm ? LW.mmFov(fr.mm) : 42; camera.updateProjectionMatrix();
        // the flash has already fired (the transition). It holds, with the faintest decay of over-exposure.
        flashL.intensity = 260 * (1 - 0.08 * sstep(0, 0.4, t));
        cap?.type(t);
      },
      dispose() {} };
  }
  const framing = (obj) => ({
    mouse: { pos: [0.1, 0.42, 1.1], look: [0, 0.06, 0], mm: 50 },
    'breaker-handle': { pos: [0.2, 1.0, 1.8], look: [0, 0.7, 0], mm: 45 },
    phone: { pos: [0.3, 0.7, 1.5], look: [0, 0.18, 0], mm: 40 },
    usb: { pos: [0.1, 0.3, 0.7], look: [0, 0.03, 0], mm: 60 },
    transformer: { pos: [0.4, 1.4, 3.2], look: [0, 0.8, 0], mm: 35 },
    printout: { pos: [0.2, 1.1, 1.6], look: [0, 0.02, 0], mm: 42 },
    led: { pos: [0.05, 0.3, 0.7], look: [0, 0.12, 0], mm: 70 },
    server: { pos: [0.4, 1.0, 2.2], look: [0, 0.7, 0], mm: 38 },
  }[obj] ?? { pos: [0.1, 0.5, 1.2], look: [0, 0.1, 0], mm: 45 });
  function buildObject(obj, g) {
    const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    if (obj === 'mouse') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), M(0x26282c, 0.3)); b.scale.set(1, 0.52, 1.7); b.position.y = 0.04; g.add(b);
      const split = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.01, 0.08), M(0x15161a)); split.position.set(0, 0.082, 0.04); g.add(split);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 12), M(0x0a0a0c)); wheel.rotation.z = Math.PI / 2; wheel.position.set(0, 0.085, 0.045); g.add(wheel);
      const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.05, -0.12], [0.03, 0.02, -0.4], [-0.05, 0.015, -0.9], [0.1, 0.012, -1.6]].map(p => new THREE.Vector3(...p))), 24, 0.006, 6), M(0x1a1b1d)); g.add(cord);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.34), M(0x16181c, 0.95)); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.002; g.add(pad); }
    else if (obj === 'breaker-handle') { const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.1), M(0x3a4a3a, 0.5, 0.3)); panel.position.y = 0.7; g.add(panel);
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), M(0xcc2a20, 0.4)); h.position.set(0, 0.78, 0.1); h.rotation.z = 0.5; g.add(h);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M(0x1a1a1a, 0.4)); knob.position.set(0.14, 0.92, 0.12); g.add(knob);
      for (const y of [1.08, 0.52]) { const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), labelTex(y > 0.8 ? 'ON  I' : 'OFF  O')); lbl.position.set(-0.02, y, 0.051); g.add(lbl); } }
    else if (obj === 'phone') { const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.3), M(0xd8d4c8, 0.5)); base.position.y = 0.035; g.add(base);
      for (let i = 0; i < 12; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.045), M(0x2a2a2a, 0.4)); k.position.set(-0.08 + (i % 3) * 0.08, 0.075, -0.06 + Math.floor(i / 3) * 0.05); g.add(k); }
      // the handset, off the hook, lying beside it, cord coiled
      const hs = new THREE.Group(); hs.position.set(0.28, 0.03, 0.08); hs.rotation.y = -0.6; g.add(hs);
      hs.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 16).rotateZ(Math.PI / 2), M(0xcfcbbf, 0.45)));
      for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16).rotateX(Math.PI / 2), M(0xcfcbbf, 0.45)); ear.position.set(sx * 0.14, 0, 0); hs.add(ear); }
      const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.28, 0.03, 0.14], [0.1, 0.02, 0.0], [0.18, 0.02, -0.1], [0.05, 0.02, -0.16], [0, 0.04, -0.12]].map(p => new THREE.Vector3(...p))), 30, 0.006, 6), M(0x1a1a1a)); g.add(cord); }
    else if (obj === 'usb') { const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.17), M(0x1a1b1f, 0.4)); body.position.y = 0.012; g.add(body);
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.055), M(0xcfcfcf, 0.25, 0.9)); conn.position.set(0, 0.012, 0.1); g.add(conn);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.016, 0.05), M(0x101114, 0.4)); cap.position.set(0, 0.013, -0.18); g.add(cap); }
    else if (obj === 'transformer') { const tank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.8), M(0x3a3f42, 0.4, 0.5)); tank.position.y = 0.55; g.add(tank);
      for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.2), M(0x44494c, 0.4, 0.5)).translateX(sx * 0.62).translateY(0.52).translateZ(-0.3 + i * 0.12));
      for (const bx of [-0.3, 0, 0.3]) { const b = new THREE.Group(); b.position.set(bx, 1.05, 0); for (let i = 0; i < 6; i++) b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07 + 0.03 * (i % 2), 0.07 + 0.03 * (i % 2), 0.05, 12), M(0x8f9aa0, 0.3)).translateY(0.05 + i * 0.06)); g.add(b); }
      // snow + ice on top
      const snow = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.06, 0.84), M(0xdfe8f2, 0.85)); snow.position.y = 1.06; g.add(snow); }
    else if (obj === 'led') { const face = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.05), M(0x15161a, 0.5, 0.3)); face.position.y = 0.12; g.add(face);
      const slots = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.02), M(0x0a0a0c)); slots.position.set(0, 0.12, 0.028); g.add(slots);
      for (let i = 0; i < 8; i++) { const on = hash(i, 'led') > 0.35; const l = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), new THREE.MeshBasicMaterial({ color: on ? (hash(i, 'c') > 0.5 ? 0x46e08a : 0xffa24a) : 0x101010 })); l.position.set(-0.2 + i * 0.05, 0.16, 0.041); g.add(l);
        if (on) { const halo = new THREE.Mesh(new THREE.CircleGeometry(0.02, 12), new THREE.MeshBasicMaterial({ color: hash(i, 'c') > 0.5 ? 0x46e08a : 0xffa24a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })); halo.position.copy(l.position); halo.position.z += 0.001; g.add(halo); } } }
    else if (obj === 'server' || obj === 'printout') {
      if (obj === 'server') { const rack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.9), M(0x1a1c1f, 0.5, 0.3)); rack.position.y = 0.75; g.add(rack);
        for (let u = 0; u < 9; u++) { const unit = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.02), M(0x26282c, 0.4, 0.4)); unit.position.set(0, 0.2 + u * 0.14, 0.451); g.add(unit);
          for (let i = 0; i < 2; i++) { const on = hash(u, i, 'srv') > 0.3; const l = new THREE.Mesh(new THREE.CircleGeometry(0.006, 8), new THREE.MeshBasicMaterial({ color: on ? 0x46e08a : 0x151515 })); l.position.set(-0.4 + i * 0.04, 0.2 + u * 0.14, 0.462); g.add(l); } } }
      else { // printout: a fan-fold green-bar page, slightly curled
        const page = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.5, 20, 12), printTex()); page.rotation.x = -Math.PI / 2; page.position.y = 0.004;
        const pa = page.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.02 * Math.sin(pa.getX(i) * 6) + 0.01 * pa.getY(i)); page.geometry.computeVertexNormals(); g.add(page); }
    }
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
