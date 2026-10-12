// engine/people/props.js: props at real scale for people shots (desk, chair, monitor, keyboard,
// placard, orb, console) and a CC0 PBR texture loader (ambientCG sets in assets/people/env).
// Dimensions are real: desk top 0.74 m, seat 0.47 m, 24" monitor, A2 placard on a 1.1 m pole.
import * as THREE from 'three';
import * as K from 'kit';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const texCache = new Map();
const tl = new THREE.TextureLoader();
// pbr('Concrete034', { repeat: [4, 4], color, roughness }) -> MeshStandardMaterial with colour, normal, roughness maps
export function pbr(name, { repeat = [1, 1], color = 0xffffff, roughness = 1, normalScale = 1, metalness = 0, envMapIntensity = 1, rotation = 0 } = {}) {
  const load = (k, srgb) => {
    const key = `${name}/${k}/${repeat}/${rotation}`; if (texCache.has(key)) return texCache.get(key);
    const t = tl.load(`/assets/people/env/${name}/${k}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.rotation = rotation;
    t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; texCache.set(key, t); return t;
  };
  return new THREE.MeshStandardMaterial({ map: load('color', true), normalMap: load('normalgl'), roughnessMap: load('roughness'), color, roughness, metalness,
    normalScale: new THREE.Vector2(normalScale, normalScale), envMapIntensity });
}
// wait for every texture requested so far (sets call this before the first frame)
export async function ready() { await Promise.all([...texCache.values()].map(t => t.image ? null : new Promise(r => { const i = setInterval(() => { if (t.image) { clearInterval(i); r(); } }, 20); }))); }

const SH = {}; const shared = (k, f) => (SH[k] ??= f()); // one material per kind: lets freeze() merge a whole office
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

// Office desk, 1.4 x 0.75 m, top at 0.74 m. Front edge (where the person sits) faces -z.
export function desk({ top = null, frame = null, width = 1.4, depth = 0.75 } = {}) {
  const g = new THREE.Group();
  top ??= shared('deskTop', () => new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.55 }));
  frame ??= shared('deskFrame', () => new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.4, metalness: 0.6 }));
  g.add(box(width, 0.025, depth, top, 0, 0.7275, 0));
  for (const sx of [-1, 1]) { g.add(box(0.05, 0.715, 0.05, frame, sx * (width / 2 - 0.06), 0.3575, -depth / 2 + 0.06)); g.add(box(0.05, 0.715, 0.05, frame, sx * (width / 2 - 0.06), 0.3575, depth / 2 - 0.06)); }
  g.add(box(width - 0.15, 0.3, 0.015, frame, 0, 0.55, depth / 2 - 0.05)); // modesty panel
  return g;
}

// 24" monitor (0.53 x 0.30 m panel) on a stand; screen is an emissive canvas you can redraw.
let sharedScreen = null, sharedShell = null;
// shared: true -> every shared monitor uses one canvas, texture and material (an office of 100 screens)
export function monitor({ width = 0.53, height = 0.3, draw = null, glow = 1.6, shared = false } = {}) {
  const g = new THREE.Group();
  const shell = shared ? (sharedShell ??= new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.35, metalness: 0.2 })) : new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.35, metalness: 0.2 });
  let c, x, tex, smat;
  if (shared && sharedScreen) ({ c, x, tex, smat } = sharedScreen);
  else { c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * height / width); x = c.getContext('2d');
    tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; smat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(glow, glow, glow), toneMapped: true });
    if (shared) sharedScreen = { c, x, tex, smat }; }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width, height), smat);
  screen.position.set(0, 0.42, -0.012); screen.rotation.y = Math.PI; // faces -z (the user)
  g.add(box(width + 0.02, height + 0.02, 0.02, shell, 0, 0.42, 0));
  g.add(box(0.05, 0.25, 0.03, shell, 0, 0.17, 0.02)); g.add(box(0.22, 0.012, 0.16, shell, 0, 0.006, 0.02));
  g.add(screen);
  const api = { group: g, screen, canvas: c, ctx: x, texture: tex,
    draw(t) { (draw ?? defaultScreen)(x, c.width, c.height, t); tex.needsUpdate = true; } };
  api.draw(0);
  return api;
}
// a dense analyst screen: dark UI, a table of rows, a chart; deterministic in t (rows scroll)
export function defaultScreen(x, w, h, t) {
  x.fillStyle = '#0d1219'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1b2533'; x.fillRect(0, 0, w, 18); x.fillRect(0, 18, 70, h);
  const r = K.rng(7); const off = Math.floor(t * 3);
  for (let i = 0; i < 22; i++) { const rr = K.rng(1000 + i + off); x.fillStyle = i % 2 ? '#121a24' : '#0f1620'; x.fillRect(78, 26 + i * 12, w - 250, 11);
    for (let k = 0; k < 5; k++) { x.fillStyle = `rgba(180,200,225,${0.25 + rr() * 0.35})`; x.fillRect(84 + k * 50, 29 + i * 12, 14 + rr() * 26, 4); } }
  x.strokeStyle = 'rgba(120,180,255,.8)'; x.lineWidth = 1.5; x.beginPath();
  for (let i = 0; i <= 40; i++) { const v = 0.5 + 0.35 * Math.sin(i * 0.5 + t * 0.6) * Math.cos(i * 0.13 + 1.1); x.lineTo(w - 160 + i * 3.6, 40 + (1 - v) * 90); } x.stroke();
  x.fillStyle = 'rgba(120,180,255,.18)'; x.fillRect(w - 162, 150, 148, 110);
  for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(200,215,235,${0.3 + r() * 0.3})`; x.fillRect(8, 30 + i * 18, 50, 5); }
}

export function keyboard() {
  const g = new THREE.Group();
  g.add(box(0.44, 0.022, 0.14, shared('kb', () => new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.5 })), 0, 0.011, 0));
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), shared('keys', () => new THREE.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.65 })));
  keys.rotation.x = -Math.PI / 2; keys.position.y = 0.0225; g.add(keys);
  return g;
}

// Task chair, seat at 0.47 m. Back towards +z (the sitter faces -z... set rotation to taste).
export function chair({ fabric = null } = {}) {
  const g = new THREE.Group();
  fabric ??= shared('chairFabric', () => new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.9 }));
  const metal = shared('chairMetal', () => new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.35, metalness: 0.7 }));
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46, 2, 1, 2), fabric); seat.position.set(0, 0.47, 0); g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.05, 4, 4, 1), fabric); back.position.set(0, 0.8, 0.25); back.rotation.x = 0.14; g.add(back);
  { const pa = back.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setZ(i, pa.getZ(i) + 0.08 * (x / 0.22) ** 2); } back.geometry.computeVertexNormals(); } // curved shell
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.03), metal); spine.position.set(0, 0.6, 0.27); g.add(spine);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4), metal); post.position.y = 0.24; g.add(post);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.32), metal);
    leg.position.set(Math.sin(a) * 0.15, 0.05, Math.cos(a) * 0.15); leg.rotation.y = a; g.add(leg);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), metal); w.position.set(Math.sin(a) * 0.3, 0.025, Math.cos(a) * 0.3); g.add(w); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  return g;
}

// Hand-lettered placard (A2 board on a wooden pole). text: one or two words.
export function placard({ text = 'NO', w = 0.6, h = 0.42, seed = 1, board = null, ink = '#1a1716' } = {}) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w); const x = c.getContext('2d');
  const r = K.rng(seed);
  board ??= ['#d9d2c2', '#cbbf9f', '#e2ddd2', '#b9a37e', '#d6cfc0'][Math.floor(r() * 5)]; // card, kraft, foam board
  x.fillStyle = board; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(90,80,60,${r() * 0.06})`; x.fillRect(r() * c.width, r() * c.height, 2 + r() * 12, 1 + r() * 3); }
  x.fillStyle = ink; x.font = `700 ${Math.round(c.height * (text.length > 6 ? 0.28 : 0.4))}px "Archivo Narrow", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  const lines = text.split('\n'); lines.forEach((l, i) => { x.save(); x.translate(c.width / 2, c.height * (0.5 + (i - (lines.length - 1) / 2) * 0.36)); x.rotate((r() - 0.5) * 0.06); x.fillText(l, 0, 0); x.restore(); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const cardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
  const card = new THREE.Group(); card.position.y = 1.1 + h / 2 - 0.05; card.rotation.z = (r() - 0.5) * 0.08;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), cardMat); front.position.z = 0.004; card.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shared('cardBack', () => new THREE.MeshStandardMaterial({ color: 0x9c8a6a, roughness: 0.95 }))); back.rotation.y = Math.PI; back.position.z = -0.004; card.add(back);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.25, 0.018), shared('pole', () => new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.8 }))); pole.position.y = 1.25 / 2 + 0.05;
  g.add(card, pole); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.userData.grip = [new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(0, 0.9, 0)]; // hand positions on the pole (local)
  return g;
}

// A glowing orb ("seeing stone") on a stone plinth: emissive core with a slow deterministic swirl,
// a soft halo sprite and a point light.
export function orb({ radius = 0.16, color = 0xffb46a, intensity = 6, height = 1.0 } = {}) {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, height - radius * 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.85 }));
  plinth.position.y = (height - radius * 0.9) / 2; plinth.castShadow = plinth.receiveShadow = true; g.add(plinth);
  const uniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } };
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.ShaderMaterial({ uniforms,
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vN; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){ vec3 p = vP * 9.0; float s = n(p + vec3(0.0, uTime * 0.35, uTime * 0.2)) * 0.6 + n(p * 2.1 - uTime * 0.3) * 0.4;
        float rim = pow(1.0 - abs(vN.z), 2.0); float core = pow(max(vN.z, 0.0), 3.0);
        vec3 c = uColor * (0.3 + 1.2 * s * s) + vec3(1.0, 0.9, 0.75) * pow(s, 6.0) * 1.2; // slow smoke in a lit glass core
        gl_FragColor = vec4(c * (0.55 + 1.3 * rim), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` }));
  core.position.y = height; g.add(core);
  const hc = document.createElement('canvas'); hc.width = hc.height = 128; const hx = hc.getContext('2d');
  const gr = hx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,220,170,0.9)'); gr.addColorStop(0.25, 'rgba(255,170,90,0.35)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
  hx.fillStyle = gr; hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color }));
  halo.scale.setScalar(radius * 9); halo.position.y = height; g.add(halo);
  const light = new THREE.PointLight(color, intensity, 7, 1.6); light.position.y = height; light.castShadow = true; light.shadow.mapSize.set(512, 512); light.shadow.bias = -0.002; g.add(light);
  return { group: g, core, light, halo, center: new THREE.Vector3(0, height, 0),
    update(t) { uniforms.uTime.value = t; const k = 1 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 5.3 + 1); light.intensity = intensity * k; halo.material.opacity = 0.85 * k; } };
}

// Operator console: a sloped desk with three screens (command-centre row).
export function consoleRow({ seats = 4, pitch = 1.3, screen = null } = {}) {
  const g = new THREE.Group(); const mons = [];
  const metal = shared('console', () => new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.45, metalness: 0.5 }));
  g.add(box(seats * pitch, 0.04, 0.8, metal, 0, 0.74, 0)); g.add(box(seats * pitch, 0.7, 0.05, metal, 0, 0.37, 0.38));
  for (let i = 0; i < seats; i++) { const m = monitor({ draw: screen, glow: 1.4, shared: true }); m.group.position.set((i - (seats - 1) / 2) * pitch, 0.76, 0.22); g.add(m.group); mons.push(m); }
  return { group: g, monitors: mons };
}

// Merge every static mesh under `root` into one mesh per (material, shadow flags): a set built from
// hundreds of props (desks, chairs, lamps, facades) drops from thousands of draw calls to tens.
// Skips skinned/instanced meshes, sprites, points and anything under an object in `keep`
// (or flagged userData.dynamic). Returns { before, after } draw counts.
export function freeze(root, { keep = [] } = {}) {
  root.updateMatrixWorld(true);
  const skip = new Set(); for (const k of keep) k?.traverse?.(o => skip.add(o));
  const groups = new Map(); const victims = [];
  root.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.geometry?.isInstancedBufferGeometry || skip.has(o) || o.userData.dynamic || Array.isArray(o.material)) return;
    let p = o.parent, dyn = false; while (p) { if (p.userData?.dynamic || skip.has(p)) dyn = true; p = p.parent; } if (dyn) return;
    const g = o.geometry; if (!g.index || !g.attributes.normal) return;
    const key = o.material.uuid + '|' + o.castShadow + o.receiveShadow + '|' + (g.attributes.uv ? 1 : 0);
    if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geoms: [] });
    const c = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv']) if (g.attributes[a]) c.setAttribute(a, g.attributes[a].clone()); c.setIndex(g.index.clone());
    c.applyMatrix4(o.matrixWorld); groups.get(key).geoms.push(c); victims.push(o);
  });
  for (const o of victims) o.parent.remove(o);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  for (const { mat, cast, recv, geoms } of groups.values()) {
    const m = new THREE.Mesh(mergeGeometries(geoms, false), mat); m.geometry.applyMatrix4(inv); m.castShadow = cast; m.receiveShadow = recv; root.add(m);
  }
  return { before: victims.length, after: groups.size };
}
