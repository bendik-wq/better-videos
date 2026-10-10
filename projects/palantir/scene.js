// THE DATA RUSH: scene library.
// Every shot in project.mjs names a `set`; each set is a factory that builds a Three.js
// scene + camera + typography layer, driven by shot time and the narration's word timings.
import * as THREE from 'three';
import * as K from 'kit';
import { makeBroll } from './broll.js';
import { makeCinema } from './cinema.js';
import * as C from '/engine/cine.js';

const RED = 0xe0241b, SODIUM = 0xffa860, FLUO = 0x58ffa0, ICE = 0x9fc4ff, PAPER = '#efe7d6';
const CAP = `font:500 .9em 'Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#d9d2c3;line-height:1.6`;
const SERIF = `font-family:'Instrument Serif',serif;color:${PAPER}`;

// ---------------------------------------------------------------- helpers
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
function wt(shot, word, nth = 0) {
  if (!word) return 0;
  const hits = (shot.words || []).filter(x => norm(x.w).startsWith(norm(word)));
  return (hits[nth] ?? hits.at(-1))?.s ?? (shot.voAt - shot.start);
}
const vo0 = (shot) => shot.voAt - shot.start;
const voEnd = (shot) => vo0(shot) + (shot.voDur || 0);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function fakeText(x, w, h, { seed = 1, color = 'rgba(40,40,40,.85)', lines = 22, margin = 40, lh = null } = {}) {
  const r = K.rng(seed); const step = lh ?? (h - margin * 2) / lines;
  for (let i = 0; i < lines; i++) { let cx = margin; const y = margin + i * step; const end = w - margin - (r() < 0.15 ? r() * w * 0.5 : 0);
    while (cx < end) { const ww = 14 + r() * 70; if (cx + ww > end) break; x.fillStyle = color; x.fillRect(cx, y, ww, step * 0.42); cx += ww + 9; } }
}
function std(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, ...o }); }
function mesh(geo, mat, pos = [0, 0, 0], parent) { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.castShadow = m.receiveShadow = true; parent?.add(m); return m; }
// Camera language. The runtime picks an angle per shot (CAM.style); every set's move is
// re-interpreted through it, so the same set never looks the same twice.
export const CAM = { style: 'orbit' };
function camOrbit(camera, { r = 10, a0 = -0.4, a1 = 0.1, y0 = 2, y1 = 3, target = [0, 1, 0], p, t, hand = 0.03, seed = 0 }) {
  camera.userData.fov0 ??= camera.fov;
  let fov = camera.userData.fov0, roll = 0; const ty = target[1];
  let k = K.inOut(p), a = K.lerp(a0, a1, k), y = K.lerp(y0, y1, k); const h = K.handheld(t, hand, seed);
  r *= K.lerp(1.08, 0.93, k); // every move also creeps in, like a dolly on a long lens
  switch (CAM.style) {
    case 'low': r *= 0.72; y = Math.max(0.12, ty * 0.12); fov = fov * 1.25; break;                       // ground-level hero angle
    case 'god': { const sweep = K.lerp(a0, a0 + 0.9, k); camera.position.set(target[0] + Math.sin(sweep) * r * 0.18, ty + r * 1.35, target[2] + Math.cos(sweep) * r * 0.18);
      camera.up.set(Math.sin(sweep), 0, Math.cos(sweep)); camera.lookAt(...target); camera.up.set(0, 1, 0); camera.fov = fov; camera.updateProjectionMatrix(); return; }
    case 'dutch': roll = K.lerp(0.1, 0.2, k) * (seed % 2 ? 1 : -1); break;
    case 'crane': y = K.lerp(ty + r * 1.2, ty + r * 0.12, K.outCubic(p)); r *= K.lerp(1.15, 0.85, k); break;  // drop from high to eye level
    case 'reveal': a = a0 - 1.7 * (1 - K.outCubic(p)) ; break;                                              // big sweep that lands and settles
    case 'macro': r *= 0.42; y = ty + (y - ty) * 0.35; fov = fov * 0.7; break;                              // tight, long lens
    case 'whip': a = a1 + 1.4 * Math.pow(1 - K.outExpo(K.clamp(p * 1.4)), 1); break;                         // snaps in from the side
  }
  camera.position.set(target[0] + Math.sin(a) * r + h.x, y + h.y, target[2] + Math.cos(a) * r);
  camera.lookAt(...target); camera.rotation.z += h.r + roll;
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
function dispose(obj) {
  obj.traverse(o => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(mm => { for (const k in mm) if (mm[k]?.isTexture) mm[k].dispose(); mm.dispose(); }); });
}

// ---------------------------------------------------------------- props
const P = {
  drive() { // opened 3.5" hard drive: a company's whole history on one platter
    const g = new THREE.Group();
    const alu = std(0x8d9196, { metalness: 0.85, roughness: 0.35 });
    mesh(new THREE.BoxGeometry(4.0, 0.5, 5.8), alu, [0, 0.25, 0], g);
    mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.06, 96), std(0xd9dde2, { metalness: 1, roughness: 0.08 }), [0, 0.53, -0.6], g).name = 'platter';
    mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 32), alu, [0, 0.58, -0.6], g);
    const arm = new THREE.Group(); arm.position.set(1.4, 0.62, 1.8); g.add(arm); arm.name = 'arm';
    mesh(new THREE.BoxGeometry(0.22, 0.05, 2.6), std(0x3b3f44, { metalness: 0.8, roughness: 0.3 }), [-0.5, 0, -1.2], arm).rotation.y = 0.35;
    mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24), std(0x222222, { metalness: 0.6 }), [0, 0, 0], arm);
    const pcb = mesh(new THREE.BoxGeometry(3.6, 0.04, 1.2), std(0x0d3b23, { roughness: 0.8 }), [0, 0.52, 2.15], g);
    return g;
  },
  cards() { // stolen cards, scattered
    const g = new THREE.Group(); const r = K.rng(3);
    const tex = canvasTex(512, 320, (x, w, h) => { x.fillStyle = '#b8b2a6'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8c27a'; x.fillRect(50, 110, 80, 60); x.fillStyle = '#3a3a3a';
      for (let i = 0; i < 4; i++) x.fillRect(50 + i * 100, 210, 80, 26); x.fillRect(50, 260, 220, 16); });
    for (let i = 0; i < 26; i++) { const c = mesh(new THREE.BoxGeometry(1.7, 0.02, 1.07), [std(0x999999), std(0x999999), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.3 }), std(0x777777), std(0x999999), std(0x999999)], [(r() - 0.5) * 7, 0.02 + i * 0.022, (r() - 0.5) * 5], g); c.rotation.y = r() * 6.28; }
    return g;
  },
  coins() {
    const g = new THREE.Group(); const gold = std(0xc9a24a, { metalness: 1, roughness: 0.28 }); const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.09, 40); const r = K.rng(8);
    const stacks = [[0, 0, 22], [1.15, 0.2, 14], [-1.1, 0.3, 17], [0.4, -1.1, 9], [-0.5, 1.15, 6], [2.2, -0.6, 4]];
    const n = stacks.reduce((a, s) => a + s[2], 0); const im = new THREE.InstancedMesh(geo, gold, n); let k = 0; const m4 = new THREE.Matrix4();
    for (const [x, z, h] of stacks) for (let i = 0; i < h; i++) { m4.makeTranslation(x + (r() - 0.5) * 0.04, 0.045 + i * 0.092, z + (r() - 0.5) * 0.04); im.setMatrixAt(k++, m4); }
    im.castShadow = im.receiveShadow = true; g.add(im); g.scale.setScalar(1.3); return g;
  },
  orbSmall() { const g = new THREE.Group(); const o = makeOrb(1.2); o.position.y = 2.1; g.add(o); mesh(new THREE.CylinderGeometry(0.5, 0.9, 0.9, 40), std(0x1c1c1c, { metalness: 0.6, roughness: 0.4 }), [0, 0.45, 0], g); g.userData.orb = o; return g; },
  briefcase() {
    const g = new THREE.Group(); const leather = std(0x2a1a12, { roughness: 0.55 }); const brass = std(0xb08d4a, { metalness: 1, roughness: 0.3 });
    mesh(new THREE.BoxGeometry(4.4, 3.0, 1.1), leather, [0, 1.5, 0], g);
    for (const x of [-0.7, 0.7]) mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), brass, [x, 3.2, 0], g);
    mesh(new THREE.BoxGeometry(1.6, 0.14, 0.2), leather, [0, 3.45, 0], g);
    for (const x of [-1.4, 1.4]) mesh(new THREE.BoxGeometry(0.4, 0.3, 0.12), brass, [x, 2.6, 0.58], g);
    return g;
  },
  chip() {
    const g = new THREE.Group(); mesh(new THREE.BoxGeometry(5, 0.35, 5), std(0x16181a, { roughness: 0.4, metalness: 0.5 }), [0, 0.18, 0], g);
    mesh(new THREE.BoxGeometry(2.6, 0.12, 2.6), std(0x9aa0a6, { metalness: 1, roughness: 0.18 }), [0, 0.42, 0], g);
    const pin = new THREE.BoxGeometry(0.12, 0.06, 0.5), pm = std(0xc9a24a, { metalness: 1, roughness: 0.3 });
    const im = new THREE.InstancedMesh(pin, pm, 4 * 24); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); let k = 0;
    for (let side = 0; side < 4; side++) for (let i = 0; i < 24; i++) { const u = -2.2 + i * (4.4 / 23); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2);
      const v = new THREE.Vector3(u, 0.05, 2.7).applyQuaternion(q); m4.compose(v, q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(k++, m4); }
    g.add(im); return g;
  },
  folder() {
    const g = new THREE.Group(); const r = K.rng(5);
    const pageTex = canvasTex(512, 660, (x, w, h) => { x.fillStyle = '#e9e2d2'; x.fillRect(0, 0, w, h); fakeText(x, w, h, { seed: 2, lines: 30 }); });
    const manila = std(0xc9a86a, { roughness: 0.9 }); const paper = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.95 });
    for (let i = 0; i < 14; i++) { const isF = i % 3 === 0; const m = mesh(new THREE.BoxGeometry(3.3, 0.03, 4.3), isF ? manila : [paper, paper, paper, paper, paper, paper], [(r() - 0.5) * 0.35, 0.02 + i * 0.034, (r() - 0.5) * 0.35], g); m.rotation.y = (r() - 0.5) * 0.18; }
    const top = mesh(new THREE.PlaneGeometry(3.2, 4.2), paper, [0.1, 0.52, 0.05], g); top.rotation.x = -Math.PI / 2; top.rotation.z = 0.06;
    return g;
  },
  gavel() {
    const g = new THREE.Group(); const wood = std(0x4a2a17, { roughness: 0.45 });
    const head = mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 32), wood, [0, 0.95, 0], g); head.rotation.z = Math.PI / 2;
    for (const x of [-0.75, 0.75]) { const b = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 32), std(0xb08d4a, { metalness: 1, roughness: 0.3 }), [x, 0.95, 0], g); b.rotation.z = Math.PI / 2; }
    const h = mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.6, 16), wood, [0, 0.95, 1.85], g); h.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.35, 48), wood, [0.3, 0.17, -0.8], g);
    g.position.y = 0; return g;
  },
};

function makeOrb(radius = 2) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uGlow: { value: 1 }, uTint: { value: new THREE.Color(0xff6a2a) } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT, uGlow; uniform vec3 uTint; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=0.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=0.5; } return s; }
      void main(){ vec3 p = normalize(vP)*2.0; float sw = fbm(p + vec3(uT*0.15, -uT*0.1, uT*0.07) + fbm(p*1.7 - uT*0.05));
        float core = pow(max(dot(vN, vV), 0.0), 2.5); float rim = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
        vec3 c = uTint * (pow(sw, 3.0) * 2.4 * core) * uGlow + vec3(0.6,0.7,0.9) * rim * 0.35 + uTint*0.04;
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const o = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), m);
  o.add(new THREE.PointLight(0xff6a2a, 40, 20, 2));
  return o;
}

// ---------------------------------------------------------------- set factories
// each returns { scene, camera, layer, update(t, p), trails?, step? }
function base(ctx, { fog = 0x000000, density = 0.03, floor = 0x1a1918, fov = 32 } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.1, 3000);
  const ground = floor === null ? null : K.voidStage(scene, { floor, fog, fogDensity: density });
  if (floor === null) { scene.background = new THREE.Color(fog); scene.fog = new THREE.FogExp2(fog, density); }
  const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(layer);
  return { scene, camera, ground, layer };
}
const caption = (layer, text, css = 'left:6%;top:8%') => text ? K.div(layer, `${css};${CAP}`, text) : null;
const sourceLine = (layer, text) => text ? K.div(layer, `right:5%;bottom:5%;font:400 .72em 'Plex Mono',monospace;letter-spacing:.14em;color:#8f897d`, text) : null;

const SETS = {
  // ---------- airliner in a dark hangar ----------
  plane(ctx, shot) {
    const b = base(ctx, { floor: 0x1b1c1e, density: 0.012, fov: 30 });
    const { scene, camera, layer } = b;
    const wet = K.grimeTexture(9, 120); wet.repeat.set(30, 30); b.ground.material.roughnessMap = wet; b.ground.material.roughness = 0.3; b.ground.material.metalness = 0.25;
    const plane = new THREE.Group(); scene.add(plane);
    const yellow = std(0xf0c419, { roughness: 0.35, metalness: 0.15 }), white = std(0xd8d6cf, { roughness: 0.4 }), dark = std(0x1b1b1b, { metalness: 0.6, roughness: 0.35 });
    const body = mesh(new THREE.CapsuleGeometry(2, 30, 16, 48), yellow, [0, 4.2, 0], plane); body.rotation.z = Math.PI / 2;
    const nose = mesh(new THREE.SphereGeometry(2, 48, 32), yellow, [17, 4.2, 0], plane); nose.scale.set(1.6, 1, 1);
    const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(-5, 15); ws.lineTo(-8, 15); ws.lineTo(-7, 0); ws.lineTo(0, 0);
    for (const sz of [-1, 1]) { const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.35, bevelEnabled: false }); wg.rotateX(Math.PI / 2); if (sz < 0) wg.scale(1, 1, -1);
      const w = mesh(wg, white, [3, 3.4, sz * 1.6], plane);
      const eng = mesh(new THREE.CylinderGeometry(1.1, 1.0, 4, 32), white, [0.5, 2.2, sz * 6.5], plane); eng.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 32), dark, [2.55, 2.2, sz * 6.5], plane).rotation.z = Math.PI / 2; }
    const ts = new THREE.Shape(); ts.moveTo(0, 0); ts.lineTo(-5, 8); ts.lineTo(-8, 8); ts.lineTo(-7.5, 0);
    const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.3, bevelEnabled: false }); const tail = mesh(tg, yellow, [-12, 5.6, -0.15], plane);
    const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.lineTo(-2.5, 5.5); hs.lineTo(-4.5, 5.5); hs.lineTo(-4, 0);
    for (const sz of [-1, 1]) { const g = new THREE.ExtrudeGeometry(hs, { depth: 0.2, bevelEnabled: false }); g.rotateX(Math.PI / 2); if (sz < 0) g.scale(1, 1, -1); mesh(g, yellow, [-13.5, 5.2, sz * 1.2], plane); }
    const winM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
    for (let i = 0; i < 26; i++) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.35, 0.45, 0.05), winM, [-11 + i * 1.0, 4.9, sz * 1.97], plane);
    for (const [x, z] of [[13, 0], [1, -2.6], [1, 2.6]]) { mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), dark, [x, 1.1, z], plane); const w = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 24), dark, [x, 0.55, z], plane); w.rotation.x = Math.PI / 2; }
    plane.rotation.y = 0.3;
    scene.add(new THREE.HemisphereLight(0x8090a0, 0x101010, 0.9));
    const lamps = [-14, 0, 14].map((x, i) => { const l = K.keySpot(scene, { color: 0xfff1dc, intensity: 9000, pos: [x, 26, 4], target: [x * 0.8, 0, 0], angle: 0.42, penumbra: 0.6, shadow: i === 1 ? 2048 : 0 });
      const sh = K.lightShaft(scene, { pos: [x, 26, 4], target: [x * 0.8, 0, 0], radius: 11, intensity: 0.05 }); return [l, sh]; });
    const motes = K.dust(scene, { count: 700, box: [60, 26, 30], center: [0, 12, 0], size: 0.08, opacity: 0.35 });
    const cap = caption(layer, shot.params.caption, 'left:6%;bottom:9%');
    const mode = shot.params.mode;
    return { ...b, update(t, p) {
      motes.update(t);
      lamps.forEach(([l, sh], i) => { let on = 1; if (mode === 'lightsOff') on = t < 1.0 + i * 1.2 ? 1 : t < 1.08 + i * 1.2 ? 0.3 : 0.0; if (mode === 'lightsOff' && i === 1 && t > 2.3) on = 0.06;
        l.intensity = 9000 * on; sh.material.uniforms.uI.value = 0.05 * on; });
      if (mode === 'top') { const k = K.inOut(p); camera.position.set(K.lerp(-10, 10, k), 82, 14); camera.lookAt(K.lerp(-3, 3, k), 0, 0); }
      else if (mode === 'tail') { camOrbit(camera, { r: 26, a0: -2.1, a1: -1.75, y0: 2, y1: 7, target: [-10, 7, 0], p, t, hand: 0.05 }); }
      else if (mode === 'lightsOff') { camOrbit(camera, { r: 52, a0: 0.95, a1: 0.85, y0: 17, y1: 19, target: [0, 3, 0], p, t, hand: 0.04 }); }
      else camOrbit(camera, { r: 50, a0: 0.45, a1: 0.8, y0: 10, y1: 15, target: [0, 3.5, 0], p, t, hand: 0.05 });
      if (cap) cap.style.opacity = K.range(t, 0.6, 1.4);
    } };
  },

  // ---------- river of messages ----------
  messages(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x020306, density: 0.03, fov: 40 });
    const { scene, camera, layer } = b;
    const atlas = canvasTex(1024, 1024, (x) => { for (let i = 0; i < 16; i++) { const cx = (i % 4) * 256, cy = Math.floor(i / 4) * 256; x.fillStyle = i % 5 === 0 ? '#1d3b5c' : '#e6e2d9'; x.fillRect(cx + 6, cy + 6, 244, 244);
      x.fillStyle = i % 5 === 0 ? '#9fc4ff' : '#555'; x.fillRect(cx + 22, cy + 22, 90, 16); fakeText(x, 244, 200, { seed: i + 3, lines: 8, margin: 0, color: i % 5 === 0 ? 'rgba(160,196,255,.7)' : 'rgba(60,60,60,.8)' }); } });
    // reposition fake text into each tile
    const N = 2400; const r = K.rng(4);
    const geo = new THREE.PlaneGeometry(1.6, 1.0);
    const mat = new THREE.MeshBasicMaterial({ map: atlas, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = (vMapUv * 0.25) + vec2(mod(float(gl_InstanceID), 4.0), floor(mod(float(gl_InstanceID), 16.0) / 4.0)) * 0.25;'); };
    const im = new THREE.InstancedMesh(geo, mat, N); scene.add(im);
    const seeds = Array.from({ length: N }, () => [(r() - 0.5) * 34, (r() - 0.5) * 16, r() * 220, r() * 6.28, 0.5 + r()]);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const glow = new THREE.PointLight(0x9fc4ff, 0, 0); scene.add(glow); let heroCard = null;
    if (shot.params.counters) K.div(layer, 'left:0;right:0;top:0;height:42%;background:linear-gradient(#000e,#0000);opacity:1');
    const counters = (shot.params.counters || []).map((c, i) => K.div(layer, `left:${6 + i * 30}%;top:9%;${SERIF};line-height:1;text-shadow:0 0 30px #000`,
      `<div class="v" style="font-size:7em;letter-spacing:-.02em"></div><div style="${CAP};margin-top:.4em">${c.label}</div>`));
    const speed = shot.params.mode === 'drift' ? 2.5 : 5;
    return { ...b, update(t, p) {
      for (let i = 0; i < N; i++) { const [x, y, z0, rot, s] = seeds[i]; const z = ((z0 + t * speed * s) % 220) - 216;
        e.set(Math.sin(t * 0.3 + rot) * 0.4, rot + t * 0.1 * s, Math.cos(t * 0.2 + rot) * 0.3); q.setFromEuler(e);
        v.set(x + Math.sin(z * 0.03 + rot) * 2, y + Math.cos(z * 0.025 + rot) * 1.5, z); m4.compose(v, q, one); im.setMatrixAt(i, m4); }
      im.instanceMatrix.needsUpdate = true;
      // ride alongside a single email as it tumbles through the storm
      const hz = -30 + t * speed * 1.1; const hx = Math.sin(t * 0.4) * 2.5, hy = Math.cos(t * 0.33) * 1.2;
      const h = K.handheld(t, 0.06, 7); camera.position.set(hx - 1.6 + h.x, hy + 0.6 + h.y, hz + 4.2); camera.lookAt(hx, hy, hz - 6); camera.rotation.z += h.r + Math.sin(t * 0.5) * 0.12;
      if (!heroCard) { heroCard = new THREE.Mesh(geo, mat.clone()); heroCard.material.onBeforeCompile = () => {}; scene.add(heroCard); }
      heroCard.position.set(hx, hy, hz); heroCard.rotation.set(Math.sin(t) * 0.4, t * 0.6, Math.cos(t * 0.8) * 0.3); heroCard.scale.setScalar(1.6);
      (shot.params.counters || []).forEach((c, i) => { const t0 = wt(shot, c.word); const k = K.range(t, t0, t0 + 1.1);
        counters[i].style.opacity = k > 0 ? 1 : 0; counters[i].querySelector('.v').textContent = Math.round(c.value * K.outExpo(k)) + c.unit; });
    } };
  },

  // ---------- 3D bar columns ----------
  bars(ctx, shot) {
    const b = base(ctx, { floor: 0x141414, density: 0.02, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params; const items = P0.items; const n = items.length;
    const svg = K.svgLayer(layer);
    K.keySpot(scene, { intensity: 5200, pos: [0, 24, 10], target: [0, 0, 0], angle: 0.55, penumbra: 0.7, shadow: 2048 });
    scene.add(new THREE.HemisphereLight(0x334455, 0x080808, 0.4));
    const spacing = 5.2, cols = items.map((it, i) => {
      const m = std(it.red ? RED : 0xd8d2c4, { roughness: 0.5, metalness: 0.1, emissive: it.red ? 0x3a0503 : 0x000000 });
      const c = mesh(new THREE.BoxGeometry(3, 1, 3), m, [(i - (n - 1) / 2) * spacing, 0, 0], scene); c.geometry.translate(0, 0.5, 0); return c; });
    const H = 9.5 / P0.max;
    const title = K.div(layer, `left:0;right:0;top:7%;text-align:center;${CAP}`, P0.title);
    const src = sourceLine(layer, P0.source);
    const labels = items.map(it => K.div(layer, `width:16em;margin-left:-8em;text-align:center;line-height:1.05`,
      `<div class="v" style="${SERIF};font-size:4.4em;${it.red ? `color:#ff4a3d` : ''}"></div><div style="${CAP};margin-top:.3em">${it.label}</div>`));
    const loop = P0.highlight !== undefined ? K.markerLoop(svg, { cx: 0, cy: 0, rx: 100, ry: 100, seed: 3, width: 6 }) : null;
    loop?.setAttribute('vector-effect', 'non-scaling-stroke');
    return { ...b, update(t, p) {
      // crane with the growth: the camera rises as the newest column rises, then settles wide
      const grow = items.reduce((m, it, i) => { if (!it.word || P0.settled) return m; const t0 = wt(shot, it.word) - 0.1; const g = K.outExpo(K.range(t, t0, t0 + 1.2)); return t >= t0 ? { i, g, h: it.value * H * g } : m; }, null);
      if (grow) { const x = cols[grow.i].position.x; const k2 = K.smooth(K.range(t, wt(shot, items[grow.i].word) + 1.4, shot.duration));
        camera.position.set(K.lerp(x + 6, 0, k2), K.lerp(Math.max(1.2, grow.h * 0.9), 6, k2), K.lerp(16, 40, k2)); camera.lookAt(K.lerp(x, 0, k2), K.lerp(grow.h * 0.75, 4.2, k2), 0); }
      else camOrbit(camera, { r: 40, a0: -0.18, a1: 0.12, y0: 7, y1: 6, target: [0, 4.2, 0], p, t, hand: 0.03 });
      title.style.opacity = K.range(t, 0, 0.5); if (src) src.style.opacity = K.range(t, 0.4, 1) * 0.9;
      items.forEach((it, i) => {
        const t0 = P0.settled || !it.word ? -1 : wt(shot, it.word) - 0.1;
        const k = t0 < 0 ? 1 : K.outExpo(K.range(t, t0, t0 + 1.2));
        cols[i].scale.y = Math.max(0.001, it.value * H * k);
        cols[i].visible = k > 0;
        const [sx, sy] = K.toScreen(new THREE.Vector3(cols[i].position.x, it.value * H * k + 1.2, 0), camera);
        const s = window.innerHeight / 1080; labels[i].style.left = sx * s + 'px'; labels[i].style.top = Math.max(150, sy - 150) * s + 'px';
        labels[i].style.opacity = k > 0 ? 1 : 0;
        labels[i].querySelector('.v').textContent = it.display ? (k > 0.98 ? it.display : '$' + Math.round(it.value * k) + 'M') : '$' + (it.value * k).toFixed(it.value % 1 ? 1 : 0) + 'M';
        if (loop && i === P0.highlight) { const [, ty] = K.toScreen(new THREE.Vector3(cols[i].position.x, it.value * H, 0), camera); const [cx, by] = K.toScreen(new THREE.Vector3(cols[i].position.x, 0, 0), camera);
          loop.setAttribute('transform', `translate(${cx} ${(ty + by) / 2}) scale(1.5 ${((by - ty) / 2 + 60) / 100})`); loop.draw(K.outCubic(K.range(t, 0.8, 1.8))); }
      });
    } };
  },

  // ---------- one object in a void ----------
  hero(ctx, shot) {
    const b = base(ctx, { floor: 0x262422, density: 0.03 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const gt = K.grimeTexture(21, 120); gt.repeat.set(30, 30); b.ground.material.map = gt; b.ground.material.bumpMap = gt;
    const prop = P[P0.prop](); scene.add(prop);
    const box = new THREE.Box3().setFromObject(prop); const size = box.getSize(new THREE.Vector3()); const mid = box.getCenter(new THREE.Vector3());
    const R = Math.max(size.x, size.z, size.y * 1.4);
    const col = P0.tint === 'red' ? 0xff5040 : 0xfff0dc;
    K.keySpot(scene, { color: col, intensity: 2400 * (R / 5) ** 1.2 + 1200, pos: [-R * 0.3, R * 3.2, R * 0.5], target: [mid.x, 0, mid.z], angle: 0.45, penumbra: 0.6, shadow: 2048 });
    K.lightShaft(scene, { pos: [-R * 0.3, R * 3.2, R * 0.5], target: [mid.x, 0, mid.z], radius: R * 1.5, color: col, intensity: 0.05 });
    const rim = new THREE.SpotLight(0x9fb7ff, 300 * R / 4, 0, 0.6, 1, 2); rim.position.set(R * 1.5, R * 0.8, -R * 2.5); rim.target.position.copy(mid); scene.add(rim, rim.target);
    const motes = K.dust(scene, { count: 600, box: [R * 2, R * 3, R * 2], center: [mid.x, R * 1.4, mid.z], size: 0.02 * R, opacity: 0.45 });
    const cap = caption(layer, P0.caption);
    const platter = prop.getObjectByName?.('platter'), orb = prop.userData?.orb;
    return { ...b, update(t, p) {
      motes.update(t); if (platter) platter.rotation.y = t * 9; if (orb) orb.material.uniforms.uT.value = t;
      const tgt = [mid.x, mid.y * 0.8, mid.z]; const r = R * 2.6;
      if (P0.cam === 'top') { const k = K.inOut(p); camera.position.set(mid.x + R * 0.2, R * K.lerp(3.2, 2.6, k), mid.z + R * K.lerp(0.9, 0.6, k)); camera.lookAt(...tgt); camera.rotation.z += K.lerp(0, 0.15, k); }
      else if (P0.cam === 'orbit') camOrbit(camera, { r, a0: -0.9, a1: 0.2, y0: R * 0.5, y1: R * 0.8, target: tgt, p, t });
      else if (P0.cam === 'rise') camOrbit(camera, { r, a0: -0.35, a1: -0.15, y0: R * 0.15, y1: R * 1.2, target: tgt, p, t });
      else camOrbit(camera, { r: K.lerp(r * 1.35, r * 0.95, K.inOut(p)), a0: -0.5, a1: -0.3, y0: R * 0.45, y1: R * 0.6, target: tgt, p: 0, t });
      if (cap) { cap.style.opacity = 1; K.typeOn(cap, P0.caption, K.range(t, 0.3, 1.6)); }
    } };
  },

  // ---------- name card ----------
  name(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.02, fov: 35 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const streak = K.lightShaft(scene, { pos: [-6, 14, -6], target: [3, -6, -10], radius: 4, color: 0xfff1dc, intensity: 0.12 });
    const motes = K.dust(scene, { count: 900, box: [24, 14, 10], center: [0, 0, -8], size: 0.05, opacity: 0.4 });
    const nm = K.div(layer, `left:0;right:0;top:38%;text-align:center;${P0.brand ? "font:700 9em 'Archivo Narrow',sans-serif;letter-spacing:-.02em;color:" + PAPER : SERIF + ';font-size:9.5em'};line-height:1`, P0.name);
    const role = K.div(layer, `left:0;right:0;top:61%;text-align:center;${CAP};letter-spacing:.3em`, P0.role);
    return { ...b, update(t, p) {
      motes.update(t); camera.position.set(Math.sin(t * 0.1) * 0.5, 0, 8); camera.lookAt(0, 0, -8);
      const t0 = P0.word ? wt(shot, P0.word) : 0.2;
      nm.style.opacity = t > t0 ? 1 : 0; role.style.opacity = K.range(t, t0 + 0.5, t0 + 1.0);
      nm.style.letterSpacing = `${K.lerp(0.02, -0.01, K.outCubic(K.range(t, t0, t0 + 3)))}em`;
    } };
  },

  // ---------- the seeing stone ----------
  orb(ctx, shot) {
    const b = base(ctx, { floor: 0x0d0d0e, density: 0.03, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const orb = makeOrb(2.2); orb.position.y = 3.6; scene.add(orb);
    mesh(new THREE.CylinderGeometry(0.9, 1.6, 1.4, 48), std(0x161616, { metalness: 0.7, roughness: 0.35 }), [0, 0.7, 0], scene);
    if (P0.mode === 'cia') orb.material.uniforms.uTint.value.set(0x7fb2ff);
    K.keySpot(scene, { color: 0xffe3c8, intensity: 900, pos: [3, 14, 6], target: [0, 0, 0], angle: 0.4, penumbra: 0.8, shadow: 1024 });
    const motes = K.dust(scene, { count: 600, box: [10, 9, 10], center: [0, 4, 0], size: 0.04, opacity: 0.45, color: 0xffc8a0 });
    const cap = caption(layer, P0.caption, 'left:6%;bottom:9%');
    return { ...b, update(t, p) {
      motes.update(t); orb.material.uniforms.uT.value = t + 10;
      const t0 = P0.word ? wt(shot, P0.word) : 0;
      orb.material.uniforms.uGlow.value = P0.mode === 'dim' ? 0.45 : P0.mode === 'reveal' ? K.lerp(0.15, 1.2, K.outCubic(K.range(t, t0 - 0.3, t0 + 1.5))) : 1.0;
      camOrbit(camera, { r: K.lerp(17, 13, K.inOut(p)), a0: -0.3, a1: 0.25, y0: 3.2, y1: 4.2, target: [0, 3.4, 0], p, t });
      if (cap) cap.style.opacity = K.range(t, 0.8, 1.6);
    } };
  },

  // ---------- title / end card ----------
  title(ctx, shot) {
    const b = base(ctx, { floor: 0x000000, density: 0.03, fov: 28 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const orb = makeOrb(1.6); orb.position.set(0, 1.7, -6); scene.add(orb); orb.material.uniforms.uGlow.value = 0.55;
    const t1 = K.div(layer, `left:0;right:0;top:34%;text-align:center;${SERIF};font-size:11em;line-height:1;letter-spacing:-.01em`, P0.title);
    const sub = K.div(layer, `left:0;right:0;top:60%;text-align:center;${CAP};letter-spacing:.32em`, P0.sub);
    const ep = K.div(layer, `left:5.5%;bottom:6%;font:700 1.1em 'Archivo Narrow',sans-serif;letter-spacing:.3em;color:#e0241b`, P0.end ? '' : 'EPISODE 01');
    return { ...b, update(t, p) {
      orb.material.uniforms.uT.value = t; camera.position.set(K.lerp(-1, 1, p), 1.6, 12 - p); camera.lookAt(0, 1.6, -6);
      const on = t > 0.06 && t < shot.duration - 0.3 ? 1 : 0;
      t1.style.opacity = on; sub.style.opacity = on * K.range(t, 0.9, 1.0); ep.style.opacity = on * K.range(t, 1.3, 1.4);
    } };
  },

  // ---------- chapter card ----------
  chapter(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.02 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const motes = K.dust(scene, { count: 500, box: [20, 12, 10], center: [0, 0, -8], size: 0.04, opacity: 0.35 });
    const num = K.div(layer, `left:6%;bottom:4%;font:700 26em 'Archivo Narrow',sans-serif;line-height:.8;color:#e0241b;letter-spacing:-.04em`, String(P0.num));
    const lbl = K.div(layer, `left:7%;top:10%;${CAP};letter-spacing:.32em`, `CHAPTER ${String(P0.num).padStart(2, '0')}`);
    const tt = K.div(layer, `right:7%;bottom:12%;text-align:right;${SERIF};font-size:8em;line-height:1`, P0.title);
    return { ...b, update(t) {
      motes.update(t); camera.position.set(0, 0, 8); camera.lookAt(0, 0, -8);
      const on = t > 0.04 && t < shot.duration - 0.25 ? 1 : 0;
      num.style.opacity = on; lbl.style.opacity = on * K.range(t, 0.5, 0.6); tt.style.opacity = on * K.range(t, 0.25, 0.35);
    } };
  },

  // ---------- timeline of years ----------
  timeline(ctx, shot) {
    const b = base(ctx, { floor: 0x121212, density: 0.025, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params; const ev = P0.events;
    const y0 = 1998, y1 = 2028, X = (y) => (y - y0) * 3 - 45;
    mesh(new THREE.BoxGeometry(95, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0x8f897d }), [0, 0.03, 0], scene);
    for (let y = y0; y <= y1; y++) mesh(new THREE.BoxGeometry(0.04, y % 5 === 0 ? 0.6 : 0.25, 0.04), new THREE.MeshBasicMaterial({ color: 0x5f5a52 }), [X(y), 0.15, 0], scene);
    const yearLbls = []; for (let y = 2000; y <= 2025; y += 5) yearLbls.push([y, K.div(layer, `font:400 .8em 'Plex Mono',monospace;color:#8f897d;letter-spacing:.1em`, y)]);
    const poles = ev.map((e, i) => { const m = mesh(new THREE.BoxGeometry(0.08, 1, 0.08), new THREE.MeshBasicMaterial({ color: i === P0.focus ? RED : 0xe8e0d0 }), [X(e.year), 0, 0], scene); m.geometry.translate(0, 0.5, 0);
      const cap = mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: i === P0.focus ? RED : 0xfff6e0 }), [X(e.year), 0, 0], scene); return [m, cap]; });
    const lbls = ev.map((e, i) => K.div(layer, `line-height:1.1`, `<div style="${SERIF};font-size:3.6em${i === P0.focus ? ';color:#ff4a3d' : ''}">${e.year}</div><div style="${CAP}">${e.label}</div>`));
    K.keySpot(scene, { intensity: 3000, pos: [X(ev[P0.focus].year), 18, 6], target: [X(ev[P0.focus].year), 0, 0], angle: 0.5, penumbra: 0.9, shadow: 0 });
    scene.add(new THREE.HemisphereLight(0x445566, 0x050505, 0.5));
    return { ...b, update(t, p) {
      const k = K.inOut(p); const fx = P0.track ? K.lerp(X(ev[0].year), X(ev.at(-1).year), K.inOut(K.range(t, wt(shot, ev[0].word) || 0.5, wt(shot, ev.at(-1).word) + 1))) : X(ev[P0.focus].year);
      const h = K.handheld(t, 0.05, 3); camera.position.set(fx + K.lerp(-6, -2, k) + h.x, 4.5 + h.y, 17); camera.lookAt(fx, 1.5, 0);
      const s = window.innerHeight / 1080;
      ev.forEach((e, i) => { const t0 = e.word ? wt(shot, e.word) : 0.2 + i * 0.15; const kk = K.outCubic(K.range(t, t0, t0 + 0.8)); const hgt = 3 + (i % 2) * 1.2;
        poles[i][0].scale.y = Math.max(0.001, hgt * kk); poles[i][1].position.y = hgt * kk; poles[i][1].visible = kk > 0;
        const [sx, sy] = K.toScreen(new THREE.Vector3(X(e.year), hgt * kk, 0), camera); lbls[i].style.left = (sx + 16) * s + 'px'; lbls[i].style.top = (sy - 80) * s + 'px'; lbls[i].style.opacity = K.range(t, t0 + 0.3, t0 + 0.8); });
      yearLbls.forEach(([y, d]) => { const [sx, sy] = K.toScreen(new THREE.Vector3(X(y), 0, 0.5), camera); d.style.left = (sx - 20) * s + 'px'; d.style.top = (sy + 14) * s + 'px'; d.style.opacity = sx > 0 && sx < 1920 ? 0.8 : 0; });
    } };
  },

  // ---------- quotation ----------
  quote(ctx, shot) {
    const b = base(ctx, { floor: 0x0e0e0e, density: 0.04, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    if (P0.book) { const book = new THREE.Group(); mesh(new THREE.BoxGeometry(3.2, 0.55, 4.6), std(0x1a1a1a, { roughness: 0.6 }), [0, 0.28, 0], book);
      mesh(new THREE.BoxGeometry(3.1, 0.48, 4.45), std(0xe8e0cc, { roughness: 0.9 }), [0.06, 0.28, 0], book); book.rotation.y = 0.5; scene.add(book); }
    K.keySpot(scene, { intensity: 1600, pos: [0, 14, 4], target: [0, 0, 0], angle: 0.35, penumbra: 0.9, shadow: P0.book ? 1024 : 0 });
    const motes = K.dust(scene, { count: 500, box: [12, 10, 8], center: [0, 4, 0], size: 0.035, opacity: 0.4 });
    const words = (P0.text || '').split(' ');
    const q = K.div(layer, `left:12%;right:12%;top:30%;text-align:center;${SERIF};font-size:${P0.text.length > 70 ? 4.6 : 5.8}em;line-height:1.12;${P0.red ? 'color:#ff4a3d' : ''}`,
      words.map(w => `<span style="opacity:0">${w} </span>`).join(''));
    const by = K.div(layer, `left:0;right:0;bottom:16%;text-align:center;${CAP};letter-spacing:.3em`, P0.by || '');
    const book = P0.book ? K.div(layer, `left:0;right:0;bottom:18%;text-align:center;${SERIF};font-style:italic;font-size:3.2em`, 'Zero to One <span style="font-style:normal;font-size:.5em;letter-spacing:.2em;font-family:Plex Mono">· 2014</span>') : null;
    const spans = [...q.children];
    return { ...b, update(t, p) {
      motes.update(t); camera.position.set(Math.sin(t * 0.15) * 0.6, K.lerp(5, 4, p), K.lerp(15, 13, p)); camera.lookAt(0, 0.6, 0);
      q.style.opacity = P0.dim ? 0.35 : 1;
      const a = P0.dim ? -1 : vo0(shot), e = P0.dim ? -1 : Math.max(a + 0.6, voEnd(shot) - 0.4);
      spans.forEach((sp, i) => { const ti = a + (e - a) * (i / spans.length); sp.style.opacity = K.range(t, ti, ti + 0.25); });
      by.style.opacity = K.range(t, e, e + 0.6) * (P0.dim ? 0.5 : 1); if (book) book.style.opacity = K.range(t, 0.6, 1.4);
    } };
  },

  // ---------- graph of nodes ----------
  network(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x030305, density: 0.02, fov: 35 });
    const { scene, camera, layer } = b; const P0 = shot.params; const r = K.rng(11);
    const nodes = [], edges = []; const nodeGeo = new THREE.SphereGeometry(0.22, 20, 14);
    const addNode = (pos, color = 0xe8e0d0, size = 1, label) => { const m = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color })); m.position.copy(pos); m.scale.setScalar(size); scene.add(m);
      const n = { m, label: label ? K.div(layer, `${label.big ? SERIF + ';font-size:3em' : CAP}`, label.text) : null, t0: label?.t0 ?? 0 }; nodes.push(n); return n; };
    const lineMat = (c, o) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
    const addEdge = (a, bb, c = 0x8f897d, o = 0.4) => { const g = new THREE.BufferGeometry().setFromPoints([a.m.position, bb.m.position]); const l = new THREE.Line(g, lineMat(c, o)); scene.add(l); edges.push({ l, a, b: bb }); };
    if (P0.mode === 'fraud') {
      for (let i = 0; i < 160; i++) addNode(new THREE.Vector3((r() - 0.5) * 30, (r() - 0.5) * 16, (r() - 0.5) * 20), 0x8a8f99, 0.6 + r() * 0.6);
      const ring = [3, 17, 42, 66, 90, 121, 140]; ring.forEach(i => { nodes[i].m.material.color.set(RED); nodes[i].m.scale.setScalar(1.4); });
      for (let i = 0; i < 220; i++) { const a = nodes[Math.floor(r() * 160)], c = nodes[Math.floor(r() * 160)]; if (a.m.position.distanceTo(c.m.position) < 7) addEdge(a, c, 0x5a5f66, 0.25); }
      ring.forEach((i, k) => addEdge(nodes[i], nodes[ring[(k + 1) % ring.length]], RED, 0.9));
    } else if (P0.mode === 'ontology') {
      const grid = []; for (let x = 0; x < 9; x++) for (let z = 0; z < 6; z++) grid.push(addNode(new THREE.Vector3((x - 4) * 3.2, (r() - 0.5) * 1.5, (z - 2.5) * 3.2), [0xe8e0d0, 0x9fc4ff, 0xffa860][Math.floor(r() * 3)], 0.8));
      for (let i = 0; i < grid.length; i++) for (let j = i + 1; j < grid.length; j++) if (grid[i].m.position.distanceTo(grid[j].m.position) < 4.6 && r() < 0.55) addEdge(grid[i], grid[j], 0x9fc4ff, 0.35);
    } else { // Thiel's web
      const center = addNode(new THREE.Vector3(0, 0, 0), RED, 2.2, { text: 'Peter Thiel', big: true, t0: 0 });
      const ff = addNode(new THREE.Vector3(-6, 2.5, 2), 0xe8e0d0, 1.5, { text: 'Founders Fund', t0: 0 }); addEdge(center, ff, 0xe8e0d0, 0.8);
      const spots = { palantir: [7, 3, -2], openai: [6, -4, 3], anthropic: [-3, -5, -3], 'scale ai': [-9, -2, -4] };
      (P0.reveal || [['palantir', 'Palantir'], ['openai', 'OpenAI'], ['anthropic', 'Anthropic'], ['x', 'Scale AI']]).forEach(([w, name]) => {
        const n = addNode(new THREE.Vector3(...spots[name.toLowerCase()]), 0xe8e0d0, 1.3, { text: name, t0: P0.all ? 0 : wt(shot, w) }); addEdge(ff, n, RED, 0.85); });
      for (let i = 0; i < 90; i++) { const n = addNode(new THREE.Vector3((r() - 0.5) * 34, (r() - 0.5) * 18, (r() - 0.5) * 20 - 6), 0x3a3d42, 0.5); }
    }
    const motes = K.dust(scene, { count: 500, box: [40, 20, 30], center: [0, 0, 0], size: 0.06, opacity: 0.3 });
    return { ...b, update(t, p) {
      motes.update(t);
      const k = K.inOut(p), a = K.lerp(-0.35, 0.35, k), R = P0.mode === 'thiel' ? 26 : 32;
      camera.position.set(Math.sin(a) * R, P0.mode === 'ontology' ? K.lerp(22, 16, k) : K.lerp(5, 2, k), Math.cos(a) * R); camera.lookAt(0, 0, 0);
      const s = window.innerHeight / 1080;
      nodes.forEach(n => { const vis = t >= n.t0; n.m.visible = vis || !n.label; if (P0.pulse && n.m.material.color.getHex() === RED) n.m.scale.setScalar(2.2 + Math.sin(t * 4) * 0.2);
        if (n.label) { const [sx, sy] = K.toScreen(n.m.position, camera); n.label.style.left = (sx + 18) * s + 'px'; n.label.style.top = (sy - 18) * s + 'px'; n.label.style.opacity = K.range(t, n.t0, n.t0 + 0.4); } });
      edges.forEach(e => { e.l.visible = e.a.m.visible && e.b.m.visible; });
      if (P0.mode === 'ontology') { const reveal = K.range(t, 0.3, shot.duration * 0.8); edges.forEach((e, i) => { e.l.visible = i / edges.length < reveal; }); }
    } };
  },

  // ---------- server corridor ----------
  corridor(ctx, shot) {
    const P0 = shot.params; const tint = P0.color === 'green' ? FLUO : ICE; const fogc = P0.color === 'green' ? 0x02100a : 0x02060f;
    const b = base(ctx, { floor: 0x15181a, fog: fogc, density: 0.03, fov: 40 });
    const { scene, camera } = b;
    const wet = K.grimeTexture(51, 110); wet.repeat.set(40, 40); b.ground.material.roughnessMap = wet; b.ground.material.roughness = 0.3; b.ground.material.metalness = 0.4;
    const ledTex = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, h); const r = K.rng(2);
      for (let y = 20; y < h; y += 34) { x.fillStyle = '#16181b'; x.fillRect(10, y, w - 20, 26); for (let i = 0; i < 6; i++) if (r() < 0.7) { x.fillStyle = r() < 0.15 ? '#ffb040' : (P0.color === 'green' ? '#7dffb0' : '#8fc8ff'); x.fillRect(20 + i * 12, y + 10, 5, 5); } } });
    const rackM = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.5, metalness: 0.6 }); const faceM = new THREE.MeshStandardMaterial({ map: ledTex, emissiveMap: ledTex, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.4 });
    const geo = new THREE.BoxGeometry(1.2, 4.4, 2.0); const N = 2 * 40; const im = new THREE.InstancedMesh(geo, [rackM, rackM, rackM, rackM, faceM, faceM], N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); let i = 0;
    for (const side of [-1, 1]) for (let row = 0; row < 40; row++) { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2); m4.compose(new THREE.Vector3(side * 2.4, 2.2, -row * 1.25), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i++, m4); }
    scene.add(im);
    const tubeM = new THREE.MeshBasicMaterial({ color: P0.color === 'green' ? 0xc8ffd8 : 0xd8e8ff });
    for (let z = -2; z > -50; z -= 6) mesh(new THREE.BoxGeometry(0.1, 0.06, 2.6), tubeM, [0, 4.7, z], scene);
    const pls = [0, 1, 2].map(() => { const l = new THREE.PointLight(tint, 60, 18, 1.6); scene.add(l); return l; });
    const motes = K.dust(scene, { count: 500, box: [4, 4, 40], center: [0, 2.2, -20], size: 0.03, opacity: 0.45, color: tint });
    const sp = P0.speed ?? 1;
    return { ...b, update(t, p) {
      motes.update(t); const z = K.lerp(4, -6 * sp - 4, p); const h = K.handheld(t, 0.04, 5);
      camera.position.set(0.3 + h.x, 1.6 + h.y, z); camera.lookAt(0.1, 1.9, z - 12); camera.rotation.z += h.r;
      const base6 = Math.ceil((z + 2) / 6) * 6 - 2; pls.forEach((l, j) => l.position.set(0, 4.4, base6 - j * 6));
    } };
  },

  // ---------- the data wall ----------
  wall(ctx, shot) {
    const b = base(ctx, { floor: 0x0d0d0d, density: 0.03, fov: 38 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const vocab = ['posts', 'wiki', 'news', 'code', 'forum', 'books', 'reviews', 'papers', 'comments', 'threads', 'blogs', 'docs', 'lyrics', 'recipes', 'Q&A', 'patents', 'manuals', 'subtitles', 'emails', 'tweets'];
    const atlas = canvasTex(1024, 1024, (x) => { const r = K.rng(6); for (let i = 0; i < 64; i++) { const cx = (i % 8) * 128, cy = Math.floor(i / 8) * 128; x.fillStyle = '#121212'; x.fillRect(cx + 3, cy + 3, 122, 122);
      x.fillStyle = '#f0e8d8'; x.font = '500 30px "Plex Mono"'; x.fillText(vocab[i % vocab.length], cx + 12, cy + 44); x.fillStyle = 'rgba(240,232,216,.3)'; for (let l = 0; l < 4; l++) x.fillRect(cx + 12, cy + 62 + l * 14, 40 + r() * 60, 6); } });
    const cols = 34, rows = 16, N = cols * rows; const geo = new THREE.BoxGeometry(1.9, 1.9, 0.3);
    // unlit tiles so instance colour fully controls brightness (dimming the wall)
    const mat = new THREE.MeshBasicMaterial({ map: atlas });
    mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * 0.125 + vec2(mod(float(gl_InstanceID), 8.0), floor(mod(float(gl_InstanceID) * 7.0, 64.0) / 8.0)) * 0.125;'); };
    const im = new THREE.InstancedMesh(geo, mat, N); const m4 = new THREE.Matrix4(); const order = []; const r = K.rng(9);
    for (let i = 0; i < N; i++) { const x = (i % cols - cols / 2) * 2.05, y = Math.floor(i / cols) * 2.05 + 1; m4.makeTranslation(x, y, -8 + (r() - 0.5) * 0.4); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(1, 1, 1)); order.push(r()); }
    scene.add(im);
    scene.add(new THREE.HemisphereLight(0x8899aa, 0x050505, 0.25));
    const cap = caption(layer, P0.caption, 'left:6%;bottom:9%');
    const big = (P0.words || []).map((w, i) => K.div(layer, `left:${8 + (i % 3) * 30}%;top:${18 + Math.floor(i / 3) * 22}%;${SERIF};font-size:6em;text-shadow:0 0 40px #000`, w));
    const c = new THREE.Color();
    return { ...b, update(t, p) {
      const k = K.inOut(p); const h = K.handheld(t, 0.06, 9);
      // oblique: the wall recedes into fog like a cliff face
      camera.position.set(K.lerp(-30, -22, k) + h.x, K.lerp(4, 7, k) + h.y, K.lerp(10, 6, k)); camera.lookAt(K.lerp(4, 10, k), K.lerp(11, 14, k), -8); camera.rotation.z += h.r;
      const lit = P0.mode === 'full' ? 1 : P0.mode === 'dark' ? 0.06 : K.lerp(1, 0.08, K.range(t, 0.5, shot.duration - 0.5));
      for (let i = 0; i < N; i++) { const on = order[i] < lit ? 1 : 0.02; const fl = on > 0.5 ? 0.75 + 0.25 * Math.sin(t * 2 + i) : on; im.setColorAt(i, c.setScalar(fl * (P0.mode === 'dark' && on > 0.5 ? 0.6 : 1))); }
      im.instanceColor.needsUpdate = true;
      if (cap) cap.style.opacity = K.range(t, 0.8, 1.6);
      (P0.words || []).forEach((w, i) => { const t0 = wt(shot, w); big[i].style.opacity = K.range(t, t0, t0 + 0.15) * (1 - K.range(t, t0 + 1.6, t0 + 1.9)); });
    } };
  },

  // ---------- big numbers ----------
  numbers(ctx, shot) {
    const b = base(ctx, { floor: 0x161514, density: 0.03, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params; const n = P0.items.length;
    P0.items.forEach((_, i) => { const x = (i - (n - 1) / 2) * 13; K.keySpot(scene, { intensity: 1800, pos: [x, 15, 3], target: [x, 0, 0], angle: 0.32, penumbra: 0.7, shadow: 0 });
      K.lightShaft(scene, { pos: [x, 15, 3], target: [x, 0, 0], radius: 5, intensity: 0.05 }); });
    const motes = K.dust(scene, { count: 500, box: [30, 12, 10], center: [0, 5, 0], size: 0.04, opacity: 0.4 });
    const head = K.div(layer, `left:0;right:0;top:9%;text-align:center;${CAP};letter-spacing:.26em`, P0.header);
    const els = P0.items.map((it, i) => K.div(layer, `left:${(i / n) * 100}%;width:${100 / n}%;top:24%;text-align:center;line-height:1`,
      `<div class="v" style="${SERIF};font-size:${n > 1 ? 13 : 16}em;letter-spacing:-.02em"></div><div style="${SERIF};font-style:italic;font-size:2.4em;margin-top:.2em;color:#cfc8ba">${it.sub || ''}</div>`));
    const src = sourceLine(layer, P0.source);
    return { ...b, update(t, p) {
      motes.update(t); const h = K.handheld(t, 0.02, 2); camera.position.set(h.x, K.lerp(3.4, 2.8, p) + h.y, K.lerp(28, 23, p)); camera.lookAt(0, 2, 0);
      head.style.opacity = K.range(t, 0, 0.5); if (src) src.style.opacity = K.range(t, 1, 1.6) * 0.9;
      P0.items.forEach((it, i) => { const t0 = wt(shot, it.word) - 0.1; const k = K.range(t, t0, t0 + 1.3); els[i].style.opacity = k > 0 ? 1 : 0;
        els[i].querySelector('.v').textContent = (it.prefix || '') + (it.value * K.outExpo(k)).toFixed(it.dec ?? 0) + (it.suffix || ''); });
    } };
  },

  // ---------- editorial list ----------
  list(ctx, shot) {
    const b = base(ctx, { floor: 0x0f0f0f, density: 0.035, fov: 30 });
    const { scene, camera, layer } = b; const P0 = shot.params; const items = P0.items;
    const papers = new THREE.Group(); scene.add(papers); const r = K.rng(4); const pageTex = canvasTex(256, 330, (x, w, h) => { x.fillStyle = '#d9d2c3'; x.fillRect(0, 0, w, h); fakeText(x, w, h, { seed: 9, lines: 18, margin: 18 }); });
    const pm = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9, side: THREE.DoubleSide });
    for (let i = 0; i < 40; i++) { const m = mesh(new THREE.PlaneGeometry(2.1, 2.7), pm, [(r() - 0.5) * 30 + 9, r() * 10 + 1, -r() * 14 - 4], papers); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData.s = r(); }
    K.keySpot(scene, { intensity: 2400, pos: [10, 18, 6], target: [8, 4, -8], angle: 0.55, penumbra: 0.9, shadow: 0 });
    scene.add(new THREE.HemisphereLight(0x445566, 0x050505, 0.3));
    const head = K.div(layer, `left:7%;top:10%;${CAP};letter-spacing:.26em;color:#ff4a3d`, P0.header || '');
    const cols = P0.columns || 1; const per = Math.ceil(items.length / cols);
    const fs = P0.big ? 6.4 : items.length > 5 ? 3.6 : 4.6;
    const els = items.map(([, label], i) => { const c = Math.floor(i / per), row = i % per;
      return K.div(layer, `left:${7 + c * 42}%;top:${20 + row * (P0.big ? 20 : items.length > 5 && cols === 1 ? 11 : 13)}%;${SERIF};font-size:${fs}em;line-height:1;white-space:nowrap`,
        `<span style="font:500 .2em 'Plex Mono',monospace;letter-spacing:.2em;color:${P0.check ? '#ff4a3d' : '#8f897d'};vertical-align:middle;margin-right:1.6em">${P0.check ? '✓' : P0.steps ? 'STEP ' + (i + 1) : String(i + 1).padStart(2, '0')}</span>${label}`); });
    return { ...b, update(t, p) {
      papers.children.forEach((m, i) => { m.rotation.x += 0; m.position.y = (m.userData.y0 ??= m.position.y) - t * (0.15 + m.userData.s * 0.3); m.rotation.z = t * 0.1 * (m.userData.s - 0.5); });
      camera.position.set(K.lerp(-2, 1, p), 4, 18); camera.lookAt(6, 4, -8);
      head.style.opacity = K.range(t, 0, 0.4);
      items.forEach(([w], i) => { const t0 = wt(shot, w) - 0.05; els[i].style.opacity = K.range(t, t0, t0 + 0.2); els[i].style.transform = `translateY(${(1 - K.outCubic(K.range(t, t0, t0 + 0.5))) * 0.4}em)`; });
    } };
  },

  // ---------- the archive (where operational knowledge lives) ----------
  archive(ctx, shot) {
    const b = base(ctx, { floor: 0x1e1d1b, fog: 0x050806, density: 0.035, fov: 36 });
    const { scene, camera } = b; const P0 = shot.params;
    const shelfM = std(0x3a3d40, { metalness: 0.6, roughness: 0.5 });
    const boxGeo = new THREE.BoxGeometry(0.9, 0.7, 1.1); const boxM = std(0xb59a6a, { roughness: 0.95 });
    const binGeo = new THREE.BoxGeometry(0.18, 0.75, 0.9);
    const rows = 14, levels = 6, perShelf = 6; const N = 2 * rows * levels * perShelf; const im = new THREE.InstancedMesh(boxGeo, boxM, N); const m4 = new THREE.Matrix4(); const r = K.rng(5); let i = 0;
    const binM = new THREE.MeshStandardMaterial({ roughness: 0.7 }); const bins = new THREE.InstancedMesh(binGeo, binM, 2 * rows * 30); let j = 0;
    for (const side of [-1, 1]) for (let row = 0; row < rows; row++) {
      const z = -row * 4; mesh(new THREE.BoxGeometry(1.4, 6.6, 0.1), shelfM, [side * 2.6, 3.3, z - 2], scene);
      for (let lv = 0; lv < levels; lv++) { mesh(new THREE.BoxGeometry(1.4, 0.06, 4), shelfM, [side * 2.6, 0.3 + lv * 1.05, z], scene);
        for (let k = 0; k < perShelf; k++) if (r() < 0.86) { m4.makeTranslation(side * 2.6 + (r() - 0.5) * 0.1, 0.68 + lv * 1.05, z - 1.6 + k * 0.62); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(0.09, 0.3, 0.35 + r() * 0.2)); i++; } }
      for (let k = 0; k < 30 && r() < 0.98; k++) { m4.makeTranslation(side * 2.6, 0.72 + 5 * 1.05 + 0.05, z - 1.8 + k * 0.12); bins.setMatrixAt(j, m4); bins.setColorAt(j, new THREE.Color([0x2b4a6b, 0x6b2b2b, 0x2b5b3b, 0x1a1a1a][Math.floor(r() * 4)])); j++; }
    }
    im.count = i; bins.count = j; scene.add(im, bins);
    // desk with lamp at the end of the aisle
    const desk = new THREE.Group(); desk.position.set(0, 0, -6); scene.add(desk);
    mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), std(0x3b2a1e, { roughness: 0.6 }), [0, 1.0, 0], desk);
    for (const x of [-1.1, 1.1]) for (const z of [-0.5, 0.5]) mesh(new THREE.BoxGeometry(0.06, 1, 0.06), shelfM, [x, 0.5, z], desk);
    const f = P.folder(); f.scale.setScalar(0.32); f.position.set(-0.3, 1.04, 0); desk.add(f);
    const lamp = new THREE.SpotLight(0xffd9a0, 120, 6, 0.7, 0.6, 2); lamp.position.set(0.7, 2.1, 0); lamp.target.position.set(-0.2, 1, 0); desk.add(lamp, lamp.target); lamp.castShadow = true;
    mesh(new THREE.ConeGeometry(0.22, 0.3, 24, 1, true), std(0x1d3b2a), [0.7, 2.15, 0], desk);
    const tubeM = new THREE.MeshBasicMaterial({ color: 0xe8ffe8 }); for (let z = 0; z > -56; z -= 6) mesh(new THREE.BoxGeometry(0.08, 0.05, 2.2), tubeM, [0, 6.9, z], scene);
    const pls = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xd8ffe0, 50, 16, 1.6); scene.add(l); return l; });
    const motes = K.dust(scene, { count: 500, box: [4, 6, 30], center: [0, 3, -12], size: 0.03, opacity: 0.4 });
    return { ...b, update(t, p) {
      motes.update(t); const k = K.inOut(p); const h = K.handheld(t, 0.04, 6); let z;
      if (P0.cam === 'desk') { z = -2.2; camera.position.set(K.lerp(1.3, 0.8, k) + h.x, K.lerp(1.9, 1.7, k) + h.y, K.lerp(-3.4, -4.4, k)); camera.lookAt(-0.1, 1.05, -6); }
      else if (P0.cam === 'rise') { z = -20; camera.position.set(0 + h.x, K.lerp(1.5, 9, k) + h.y, -30 + 8); camera.lookAt(0, K.lerp(2, 1, k), -40); }
      else { z = K.lerp(8, -14, k); camera.position.set(0.2 + h.x, 1.7 + h.y, z); camera.lookAt(0, 1.9, z - 10); }
      const b6 = Math.ceil((camera.position.z) / 6) * 6; pls.forEach((l, j2) => l.position.set(0, 6.6, b6 - j2 * 6));
      camera.rotation.z += h.r;
    } };
  },

  // ---------- the closing window ----------
  window(ctx, shot) {
    const b = base(ctx, { floor: 0x1c1b19, density: 0.02, fov: 32 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const wallM = std(0x0e0e0e, { roughness: 0.95 });
    const W = 3.4, Hh = 6.5;
    mesh(new THREE.BoxGeometry(20, 16, 0.6), wallM, [-W / 2 - 10, 8, -6], scene); mesh(new THREE.BoxGeometry(20, 16, 0.6), wallM, [W / 2 + 10, 8, -6], scene);
    mesh(new THREE.BoxGeometry(W, 8, 0.6), wallM, [0, Hh + 1 + 4, -6], scene); mesh(new THREE.BoxGeometry(W, 1, 0.6), wallM, [0, 0.5, -6], scene);
    const shutter = mesh(new THREE.BoxGeometry(W + 0.2, Hh, 0.2), std(0x2a2a2a, { metalness: 0.7, roughness: 0.4 }), [0, 0, -5.6], scene);
    const sun = new THREE.SpotLight(0xffe7c2, 0, 0, 0.3, 0.3, 1); sun.position.set(0, 9, -24); sun.target.position.set(0, 0, 6); scene.add(sun, sun.target); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    // beam starts at the opening so the wall never occludes part of it
    const shaft = K.lightShaft(scene, { pos: [0, 6.5, -6.4], target: [0, 0, 5], radius: 3.6, color: 0xffe7c2, intensity: 0.16 });
    const backdrop = mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: 0xffe9cc }), [0, 8, -30], scene);
    const motes = K.dust(scene, { count: 900, box: [6, 8, 16], center: [0, 3, 0], size: 0.035, opacity: 0.6, color: 0xffe7c2 });
    const lbl = K.div(layer, `left:6%;bottom:9%;${CAP}`, '');
    const bar = K.div(layer, `left:6%;bottom:7%;height:2px;background:#e0241b;width:0`);
    const [c0, c1] = P0.close;
    return { ...b, update(t, p) {
      motes.update(t);
      const c = K.lerp(c0, c1, K.inOut(p)); const open = 1 - c;
      // shutter drops from the top of the opening
      shutter.scale.y = Math.max(0.001, c); shutter.position.y = 1 + Hh - (Hh * c) / 2;
      sun.intensity = 9000 * open; shaft.material.uniforms.uI.value = 0.1 * open; backdrop.material.color.setScalar(0.4 + 0.6 * open);
      const h = K.handheld(t, 0.03, 8); camera.position.set(K.lerp(-3, -1.5, p) + h.x, 2.2 + h.y, K.lerp(14, 11, p)); camera.lookAt(0, 3.4, -6);
      lbl.style.opacity = K.range(t, 0.4, 1); lbl.textContent = `THE WINDOW · ${Math.round(open * 100)}% OPEN`; bar.style.opacity = 1; bar.style.width = `${open * 20}%`;
    } };
  },

  // ---------- value of the Nth dataset ----------
  curve(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x030303, density: 0.02 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const motes = K.dust(scene, { count: 500, box: [24, 14, 10], center: [0, 0, -8], size: 0.04, opacity: 0.3 });
    const svg = K.svgLayer(layer); const X0 = 300, X1 = 1650, Y0 = 860, Y1 = 220;
    const f = (u) => Y0 - (Y0 - Y1) * Math.exp(-u * 4.2) * 0.98;
    svg.make('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: '#8f897d', 'stroke-width': 1.5 }); svg.make('line', { x1: X0, y1: Y0, x2: X0, y2: Y1 - 40, stroke: '#8f897d', 'stroke-width': 1.5 });
    const pts = Array.from({ length: 120 }, (_, i) => { const u = i / 119; return `${X0 + (X1 - X0) * u},${f(u)}`; });
    const path = svg.make('polyline', { points: pts.join(' '), fill: 'none', stroke: '#efe7d6', 'stroke-width': 4 }); const len = 2200; path.style.strokeDasharray = len;
    const dot = svg.make('circle', { r: 11, fill: '#e0241b' });
    K.div(layer, `left:${X0 / 19.2}%;top:${(Y1 - 110) / 10.8}%;${CAP}`, 'VALUE OF THE DATASET TO AN AI LAB').style.opacity = 1;
    K.div(layer, `left:${X1 / 19.2 - 22}%;top:${(Y0 + 24) / 10.8}%;width:22%;text-align:right;${CAP}`, 'NUMBER OF SIMILAR DATASETS SOLD →').style.opacity = 1;
    K.div(layer, `left:${X0 / 19.2}%;top:${(Y0 + 60) / 10.8}%;width:60%;font:400 .72em 'Plex Mono',monospace;letter-spacing:.14em;color:#8f897d`, 'ILLUSTRATIVE · NOT TO SCALE').style.opacity = 1;
    const tags = (P0.mark || []).map(([, u], i) => K.div(layer, `${SERIF};font-size:3em;line-height:1`, i === 0 && u === 0 ? 'The first' : u >= 1 ? 'The fiftieth' : ''));
    return { ...b, update(t, p) {
      motes.update(t); camera.position.set(0, 0, 8); camera.lookAt(0, 0, -8);
      path.style.strokeDashoffset = len * (1 - K.outCubic(K.range(t, 0.1, 1.6)));
      let u = 0; (P0.mark || []).forEach(([w, uu], i) => { const t0 = wt(shot, w); if (t >= t0) u = K.lerp(u, uu, K.inOut(K.range(t, t0, t0 + 1.2)));
        const tx = X0 + (X1 - X0) * uu, ty = f(uu); const s = window.innerHeight / 1080; tags[i].style.left = (tx + 24) * s + 'px'; tags[i].style.top = (ty - 70) * s + 'px'; tags[i].style.opacity = K.range(t, t0, t0 + 0.4); });
      const x = X0 + (X1 - X0) * u; dot.setAttribute('cx', x); dot.setAttribute('cy', f(u)); dot.style.opacity = K.range(t, 0.6, 1);
    } };
  },

  // ---------- affiliate disclosure ----------
  disclosure(ctx, shot) {
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.02 });
    const { scene, camera, layer } = b;
    const motes = K.dust(scene, { count: 400, box: [20, 12, 10], center: [0, 0, -8], size: 0.04, opacity: 0.3 });
    K.div(layer, `left:12%;top:24%;${CAP};letter-spacing:.3em;color:#ff4a3d;opacity:1`, 'DISCLOSURE');
    const t1 = K.div(layer, `left:12%;right:12%;top:33%;${SERIF};font-size:4.6em;line-height:1.15`, 'micro1 is a partner of this channel. The link in the description is an affiliate link.');
    return { ...b, update(t) { motes.update(t); camera.position.set(0, 0, 8); camera.lookAt(0, 0, -8); t1.style.opacity = K.range(t, 0.2, 0.6); } };
  },

  // ---------- anonymisation ----------
  scrub(ctx, shot) {
    const b = base(ctx, { floor: 0x121212, density: 0.03, fov: 30 });
    const { scene, camera, layer } = b;
    const pages = []; const r = K.rng(2);
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('canvas'); c.width = 600; c.height = 780; const x = c.getContext('2d');
      const names = Array.from({ length: 9 }, () => [60 + r() * 300, 80 + Math.floor(r() * 26) * 26, 60 + r() * 120]);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = mesh(new THREE.PlaneGeometry(3.6, 4.68), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [(i - 1) * 4.1, 2.6, -i * 0.3], scene);
      m.rotation.y = (1 - i) * 0.12; pages.push({ c, x, tex, names, seed: i });
    }
    K.keySpot(scene, { intensity: 2600, pos: [0, 16, 8], target: [0, 2, 0], angle: 0.5, penumbra: 0.8, shadow: 0 });
    scene.add(new THREE.HemisphereLight(0x556677, 0x050505, 0.4));
    const cap = K.div(layer, `left:6%;bottom:9%;${CAP}`, 'IDENTIFYING DETAILS REMOVED BEFORE TRANSFER');
    return { ...b, update(t, p) {
      const k = K.range(t, 1.0, shot.duration * 0.7);
      pages.forEach((pg, i) => { const { x } = pg; x.fillStyle = '#ebe4d4'; x.fillRect(0, 0, 600, 780); fakeText(x, 600, 780, { seed: pg.seed + 20, lines: 28, margin: 50 });
        x.fillStyle = '#7a1410'; x.fillRect(50, 40, 200, 18);
        pg.names.forEach(([nx, ny, nw], j) => { const kk = K.range(k * pg.names.length - j, 0, 1); x.fillStyle = '#0b0b0b'; x.fillRect(nx, ny - 4, nw * kk, 20); });
        pg.tex.needsUpdate = true; });
      camera.position.set(K.lerp(-1.5, 1.5, p), 3.2, K.lerp(13, 11, p)); camera.lookAt(0, 2.5, 0);
      cap.style.opacity = K.range(t, 1.2, 2);
    } };
  },

  // ---------- call to action ----------
  endcard(ctx, shot) {
    const b = base(ctx, { floor: 0x0a0a0a, density: 0.03, fov: 28 });
    const { scene, camera, layer } = b; const P0 = shot.params;
    const orb = makeOrb(1.4); orb.position.set(5, 1.8, -4); scene.add(orb);
    const lead = K.div(layer, `left:8%;top:22%;${CAP};letter-spacing:.3em;color:#ff4a3d`, 'FOR COMPANY OWNERS & ADVISORS');
    const url = K.div(layer, `left:8%;top:30%;${SERIF};font-size:6.4em;line-height:1`, P0.url);
    const sub = K.div(layer, `left:8%;top:46%;${SERIF};font-style:italic;font-size:2.6em;color:#cfc8ba`, 'Find out what your operational data is worth.');
    const note = K.div(layer, `left:8%;top:56%;${CAP}`, P0.note);
    return { ...b, update(t, p) {
      orb.material.uniforms.uT.value = t; camera.position.set(K.lerp(-1, 0.5, p), 1.6, 12); camera.lookAt(1, 1.6, -4);
      lead.style.opacity = K.range(t, 0.2, 0.5); url.style.opacity = K.range(t, 0.5, 0.9); sub.style.opacity = K.range(t, 1.1, 1.6); note.style.opacity = K.range(t, 1.6, 2.1);
    } };
  },
};

Object.assign(SETS, makeBroll({ THREE, K, base, mesh, std, camOrbit, caption, wt, canvasTex, fakeText, P, CAP, SERIF, RED }));
Object.assign(SETS, makeCinema({ THREE, K, base, mesh, std, caption, wt, canvasTex, fakeText, makeOrb, RED }));

// Instrument Serif draws '1' like an 'l', so the brand name gets a sans '1'.
function brandify(el) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const hits = [];
  while (w.nextNode()) if (/micro1/.test(w.currentNode.nodeValue)) hits.push(w.currentNode);
  for (const n of hits) { const span = document.createElement('span');
    span.innerHTML = n.nodeValue.replace(/micro1/g, 'micro<span style="font-family:\'Archivo Narrow\',sans-serif;font-weight:700;font-style:normal">1</span>'); n.replaceWith(span); }
}

// ---------------------------------------------------------------- runtime
export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  await C.preload(renderer, { hdris: ['qwantani_dusk_2', 'moonless_golf', 'kloppenheim_06_puresky', 'industrial_sunset_puresky'] });
  // 2.39:1 scope bars for cinematic sequences
  const bars = [0, 1].map(i => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:0;right:0;${i ? 'bottom' : 'top'}:0;height:${(height - width / 2.39) / 2}px;background:#000;display:none;z-index:5`; ctx.overlay.appendChild(d); return d; });
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`;
  gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d');
  const live = new Map();
  let last = null;
  const get = (shot, index) => {
    if (!live.has(shot.id)) {
      const f = SETS[shot.set]; if (!f) throw new Error(`[scene] unknown set ${shot.set}`);
      const inst = f(ctx, shot); brandify(inst.layer); live.set(shot.id, { inst, index });
    }
    // free anything more than one shot behind
    for (const [id, v] of live) if (v.index < index - 1) { dispose(v.inst.scene); v.inst.layer.remove(); live.delete(id); }
    return live.get(shot.id).inst;
  };
  // Cuts carry motion: whip pans and push-throughs with smear, dissolves into/out of type.
  const HARD = new Set(['chapter', 'title']);
  const TEXT = new Set(['list', 'quote', 'numbers', 'curve', 'chapter', 'title', 'disclosure', 'endcard', 'name', 'scrub']);
  const ANGLES = ['reveal', 'low', 'crane', 'dutch', 'orbit', 'god', 'macro', 'whip'];
  const hash = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const angleFor = (i) => { const sh = shots[i]; if (!sh) return 'orbit'; if (sh.params?.angle) return sh.params.angle; if (TEXT.has(sh.set) || sh.set === 'bars') return 'orbit';
    let a = ANGLES[hash(sh.id) % ANGLES.length]; if (i > 0 && a === angleFor.cache?.[i - 1]) a = ANGLES[(hash(sh.id) + 3) % ANGLES.length]; (angleFor.cache ??= {})[i] = a; return a; };
  for (let i = 0; i < shots.length; i++) angleFor(i);
  const transFor = (i) => { const sh = shots[i], pv = shots[i - 1]; if (!pv || HARD.has(sh.set) || HARD.has(pv.set)) return 'cut';
    if (sh.params?.trans) return sh.params.trans; if (TEXT.has(sh.set) || TEXT.has(pv.set)) return 'dissolve';
    return ['whip', 'push', 'dissolve', 'whip', 'push'][hash(sh.id + 'x') % 5]; };
  const DUR = { dissolve: 0.3, whip: 0.42, push: 0.38, cut: 0 };
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d');
  const smear = (img, x0, dx, taps, alpha, sx = 1) => { for (let i = 0; i < taps; i++) { const f = taps > 1 ? i / (taps - 1) - 0.5 : 0; cx.globalAlpha = alpha / Math.max(1, taps * 0.55);
    const w = width * sx, hgt = height * sx; cx.drawImage(img, x0 + f * dx - (w - width) / 2, -(hgt - height) / 2 + (sx !== 1 ? f * dx * 0.3 : 0), w, hgt); } cx.globalAlpha = 1; };
  let lastShot = null;
  return {
    frame({ shot, t, p, index }) {
      const inst = get(shot, index);
      if (lastShot && lastShot.id !== shot.id) px.drawImage(comp, 0, 0); // freeze the outgoing frame
      const continuous = lastShot && (lastShot.id !== shot.id || lastShot.id === shot.id);
      for (const v of live.values()) v.inst.layer.style.display = v.inst === inst ? 'block' : 'none';
      CAM.style = angleFor.cache[index] ?? 'orbit';
      inst.update(t, p);
      bars.forEach(d => { d.style.display = inst.scope ? 'block' : 'none'; });
      renderer.render(inst.scene, inst.camera);
      const tr = transFor(index), T = DUR[tr];
      if (continuous && T && t < T) {
        const k = K.smooth(t / T), dir = hash(shot.id) % 2 ? 1 : -1;
        cx.fillStyle = '#000'; cx.fillRect(0, 0, width, height);
        if (tr === 'whip') { const e = K.inOut(t / T), blur = Math.sin(Math.PI * e) * width * 0.12;
          smear(prev, -dir * e * width, blur, 9, 1); smear(gl, dir * (1 - e) * width, blur, 9, 1); }
        else if (tr === 'push') { const e = K.inOut(t / T);
          smear(prev, 0, Math.sin(Math.PI * e) * 60, 6, 1 - e, 1 + e * 0.6); smear(gl, 0, Math.sin(Math.PI * e) * 60, 6, e, 0.85 + e * 0.15); }
        else { cx.drawImage(prev, 0, 0); cx.globalAlpha = k; cx.drawImage(gl, 0, 0, width, height); cx.globalAlpha = 1; }
        inst.layer.style.opacity = k;
      } else {
        inst.layer.style.opacity = 1;
        if (inst.trails && last === inst) { cx.globalAlpha = 1 - inst.trails; cx.drawImage(gl, 0, 0, width, height); cx.globalAlpha = 1; } else cx.drawImage(gl, 0, 0, width, height);
      }
      last = inst; lastShot = shot;
    },
  };
}
