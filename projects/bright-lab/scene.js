// BRIGHT LAB: the house blend from docs/library/bright-style/STYLE.md §12, as four proof sets.
//   clayCity   hoog-Tokyo x Primal Space: a white-clay model city on a turquoise bay, hard-but-soft sun
//              at 40° from the south-west, sky-blue fill, N8AO contact darkening, aerial haze. One red
//              hero tower. params.tilt: 85 mm low angle with a tilt-shift (miniature) depth of field.
//   diorama    Primal Space cut-away block: lagoon over sand/clay strata, terracotta-roof houses,
//              floating on a pale gradient void with a soft drop shadow.
//   voidModel  hoog "plan" void: a white megastructure on a seamless grey-blue void, pastel accents.
//   mapSlab    Neo / RealLifeLore bright map: extruded paper land on a turquoise sea (Natural Earth),
//              a glowing yellow route (Wendover), pill and slab labels.
// Every value that defines the look is in HOUSE (copy it into a set to get the look). Everything is a
// pure function of t (no Math.random, no clock).
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as P from '/engine/post.js';

// ---------------------------------------------------------------- the house blend (STYLE.md §12)
export const HOUSE = {
  sunEl: 40, sunAz: 235, sun: '#fff6ea', sunI: 3.9,                 // warm white key, cross/three-quarter back
  hemiSky: '#bcd6f0', hemiGround: '#e9dcc6', hemiI: 0.78,            // sky-blue fill from above, warm bounce from below
  bgTop: '#8dbbe5', bgHorizon: '#e7eff4',                            // sky: clean mid-blue to a near-white horizon
  fog: '#dfe9f1', fogNear: 900, fogFar: 6000,                        // aerial haze, linear, horizon colour
  clay: '#f4f4f1', clay2: '#ecebe7', ground: '#d6d8d8', plate: '#e8e9e7',
  water: '#7cc6c1', waterDeep: '#4fa9ab', park: '#cbd9b1', tree: '#b2cb95',
  red: '#e0241b', coral: '#ff7a5c', lavender: '#b9a9ef', yellow: '#ffd23f', navy: '#0f1e33',
  land: '#ece3d1', landSide: '#cbbd9f', sea: '#7cc4c0',
  ao: { radius: 10, intensity: 3.0, falloff: 1.0 },                   // N8AO in metres (city scale)
  tone: 'neutral',                                                   // Khronos PBR Neutral: whites stay white
};
const col = (h) => new THREE.Color(h);
const clayMat = (hex, rough = 0.86) => new THREE.MeshStandardMaterial({ color: col(hex), roughness: rough, metalness: 0 });
const sc = () => window.innerHeight / 1080;
function layerOf(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function el(parent, css, html = '') { const d = document.createElement('div'); d.style.cssText = css; d.innerHTML = html; parent.appendChild(d); return d; }

// vertical gradient background (screen space), authored in sRGB
function gradientBg(top, horizon, split = 0.62) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, top); g.addColorStop(split, horizon); g.addColorStop(1, horizon);
  x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// sun + sky fill + haze, the same in every set
function brightLight(scene, { target = [0, 0, 0], span = 900, fog = true, bg = [HOUSE.bgTop, HOUSE.bgHorizon], fogC = HOUSE.fog, near = HOUSE.fogNear, far = HOUSE.fogFar, mapSize = 4096 } = {}) {
  const el = HOUSE.sunEl * Math.PI / 180, az = HOUSE.sunAz * Math.PI / 180;
  const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)); // az clockwise from north (-z)
  const sun = new THREE.DirectionalLight(col(HOUSE.sun), HOUSE.sunI);
  sun.position.set(...target).addScaledVector(dir, span * 3); sun.target.position.set(...target);
  sun.castShadow = true; sun.shadow.mapSize.set(mapSize, mapSize);
  const sc = sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = span * 0.5; sc.far = span * 6;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = span / 900 * 0.6;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(col(HOUSE.hemiSky), col(HOUSE.hemiGround), HOUSE.hemiI));
  scene.background = gradientBg(...bg);
  if (fog) scene.fog = new THREE.Fog(col(fogC), near, far);
  return sun;
}
function instanced(geo, mat, items, { cast = true, receive = true } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, items.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  items.forEach((it, i) => {
    e.set(0, it.ry ?? 0, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx, it.sy, it.sz)); im.setMatrixAt(i, m);
    if (it.c) im.setColorAt(i, col(it.c));
  });
  im.castShadow = cast; im.receiveShadow = receive; return im;
}
const BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); // base at y = 0

// ---------------------------------------------------------------- clay city
const shoreZ = (x) => 330 + 70 * Math.sin(x / 240 + 0.6) + 35 * Math.sin(x / 97);
const HERO = [40, 0, 60];
function buildCity(scene) {
  const r = K.rng(7), B = 92, street = 16, bld = [], plates = [], parks = [], trees = [];
  const clays = ['#f5f5f2', '#f1f1ee', '#f8f7f4', '#eeeeea', '#f3f2ee', '#ebedee'];
  for (let i = -14; i <= 14; i++) for (let j = -14; j <= 6; j++) {
    const cx = i * B, cz = j * B, w = B - street;
    if (cz + w / 2 > shoreZ(cx) - 12) continue;
    const d = Math.hypot(cx - HERO[0], cz - HERO[2]);
    if (d > 1300 + 200 * K.rng(i * 31 + j)()) continue;
    plates.push({ x: cx, y: 0, z: cz, sx: w, sy: 0.6, sz: w });
    if (Math.abs(cx - HERO[0]) < 40 && Math.abs(cz - HERO[2]) < 40) continue;
    if (r() < 0.07) { parks.push({ x: cx, y: 0.6, z: cz, sx: w - 6, sy: 0.4, sz: w - 6 });
      for (let k = 0; k < 9; k++) { const s = 4 + r() * 3; trees.push({ x: cx + (r() - 0.5) * (w - 16), y: 0.6 + s * 0.9, z: cz + (r() - 0.5) * (w - 16), sx: s, sy: s * 1.1, sz: s }); } continue; }
    const hmax = 14 + 150 * Math.exp(-((d / 420) ** 2));
    const n = r() < 0.5 ? 2 : r() < 0.6 ? 3 : 4, cols = n === 4 ? 2 : n, rows = n === 4 ? 2 : 1;
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      const pw = (w - 6) / cols, pd = (w - 6) / rows, px = cx - (w - 6) / 2 + pw * (a + 0.5), pz = cz - (w - 6) / 2 + pd * (b + 0.5);
      const h = 7 + r() * hmax * (0.35 + 0.65 * r()), inset = 2 + r() * 3;
      const c = clays[Math.floor(r() * clays.length)];
      bld.push({ x: px, y: 0.6, z: pz, sx: pw - inset, sy: h, sz: pd - inset, c });
      if (h > 40 && r() < 0.6) bld.push({ x: px, y: 0.6 + h, z: pz, sx: (pw - inset) * 0.6, sy: 3 + r() * 6, sz: (pd - inset) * 0.6, c }); // setback / plant
      if (r() < 0.35) bld.push({ x: px + (r() - 0.5) * pw * 0.3, y: 0.6 + h, z: pz + (r() - 0.5) * pd * 0.3, sx: 4 + r() * 4, sy: 2 + r() * 2, sz: 4 + r() * 4, c: '#e2dfd8' });
    }
    // street trees on the bay-facing edge
    if (r() < 0.4) for (let k = 0; k < 5; k++) { const s = 3 + r() * 1.5; trees.push({ x: cx - w / 2 + 8 + k * (w - 16) / 4, y: s, z: cz + w / 2 + street / 2, sx: s, sy: s * 1.1, sz: s }); }
  }
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000).rotateX(-Math.PI / 2), clayMat(HOUSE.ground, 0.95)); ground.receiveShadow = true; g.add(ground);
  g.add(instanced(BOX, clayMat(HOUSE.plate), plates, { cast: false }));
  g.add(instanced(BOX, clayMat(HOUSE.park, 0.95), parks, { cast: false }));
  g.add(instanced(BOX, clayMat('#ffffff', 0.84), bld));
  g.add(instanced(new THREE.IcosahedronGeometry(1, 1), clayMat(HOUSE.tree, 0.95), trees));
  // the bay: a shoreline shape with a pale shelf, then deeper water
  const pts = []; for (let x = -4000; x <= 4000; x += 40) pts.push(new THREE.Vector2(x, -shoreZ(x)));
  const shape = (off) => { const s = new THREE.Shape(); s.moveTo(-4000, -6000); pts.forEach((p, i) => s.lineTo(p.x, p.y - off)); s.lineTo(4000, -6000); s.closePath(); return s; };
  const shelf = new THREE.Mesh(new THREE.ShapeGeometry(shape(0)).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: col('#bfe5df'), roughness: 0.35 }));
  shelf.position.y = 0.15; shelf.receiveShadow = true; g.add(shelf);
  const water = new THREE.Mesh(new THREE.ShapeGeometry(shape(26)).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: col(HOUSE.water), roughness: 0.3 }));
  water.position.y = 0.25; water.receiveShadow = true; g.add(water);
  // hero: one red tower (the only saturated object; hoog's one-red-building rule)
  const hero = new THREE.Group();
  const hm = new THREE.MeshStandardMaterial({ color: col(HOUSE.red), roughness: 0.55, emissive: col(HOUSE.red), emissiveIntensity: 0.06 });
  for (const [w, h, y] of [[36, 120, 0.6], [28, 34, 120.6], [12, 18, 154.6]]) { const m = new THREE.Mesh(BOX, hm); m.scale.set(w, h, w); m.position.y = y; m.castShadow = m.receiveShadow = true; hero.add(m); }
  hero.position.set(HERO[0], 0, HERO[2]); g.add(hero);
  scene.add(g);
  return { hero };
}
function clayCity(ctx, shot) {
  const P0 = shot.params, scene = new THREE.Scene();
  brightLight(scene, { target: [HERO[0], 0, HERO[2] - 200], span: 1100 });
  const { hero } = buildCity(scene);
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 5, 20000);
  const tgt = [HERO[0], 70, HERO[2]];
  const rig = P0.tilt
    ? C.path([{ pos: [HERO[0] + 900, 330, HERO[2] + 1250], look: [HERO[0], 70, HERO[2]], mm: 85 }, { pos: [HERO[0] + 840, 320, HERO[2] + 1170], look: [HERO[0], 72, HERO[2]], mm: 85 }], { duration: shot.duration, float: 0 })
    : C.path([{ pos: [HERO[0] + 560, 520, HERO[2] + 980], look: tgt, mm: 40 }, { pos: [HERO[0] + 470, 470, HERO[2] + 860], look: tgt, mm: 40 }], { duration: shot.duration, float: 0 });
  const fx = P.post(ctx, scene, camera, { ao: HOUSE.ao, tone: HOUSE.tone, quality: 'medium', ...(P0.tilt ? { dof: { focus: 700, range: 120, bokeh: 4 } } : {}) });
  const layer = layerOf(ctx.overlay), s = sc();
  // hoog-style label: thin lower-case sans, navy, with a hairline leader to the object
  const lab = el(layer, `position:absolute;font:500 ${30 * s}px "Archivo Narrow";letter-spacing:.02em;color:${HOUSE.navy};white-space:nowrap`, 'the new tower');
  const line = el(layer, `position:absolute;height:${1.5 * s}px;background:${HOUSE.navy};transform-origin:0 50%`);
  return { scene, camera, layer, update(t, p) {
    rig(camera, p, t);
    if (P0.tilt) fx.focusOn(hero.children[0]).set({ range: 90, bokeh: 5 });
    const [hx, hy] = K.toScreen(new THREE.Vector3(HERO[0] - 18, 150, HERO[2]), camera), lx = hx - 330, ly = hy - 120;
    lab.style.left = `${(lx - 10) * s - lab.offsetWidth}px`; lab.style.top = `${(ly) * s - 20 * s}px`;
    const ang = Math.atan2(hy - ly, hx - lx), len = Math.hypot(hx - lx, hy - ly);
    line.style.left = `${lx * s}px`; line.style.top = `${ly * s}px`; line.style.width = `${len * s}px`; line.style.transform = `rotate(${ang}rad)`;
  } };
}

// ---------------------------------------------------------------- diorama (Primal Space cut-away)
function diorama(ctx, shot) {
  const scene = new THREE.Scene(), r = K.rng(21);
  brightLight(scene, { target: [0, -20, 0], span: 260, fog: false, bg: ['#d7e2ea', '#f3f5f6'], mapSize: 2048 });
  const g = new THREE.Group(), S = 300;
  let y = 0; for (const [h, c] of [[7, '#dcc9a0'], [14, '#c7a77b'], [18, '#a9845f'], [24, '#8c6b4c']]) { const m = new THREE.Mesh(BOX, clayMat(c, 0.92)); m.scale.set(S, h, S); m.position.y = y - h; y -= h; m.castShadow = m.receiveShadow = true; g.add(m); }
  // lagoon on the near half: translucent teal over a sunken sand bed
  const bed = new THREE.Mesh(BOX, clayMat('#cdb98e', 0.95)); bed.scale.set(S, 1, S * 0.55); bed.position.set(0, -6, S * 0.225); bed.receiveShadow = true; g.add(bed);
  const water = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: col('#4fb4ad'), roughness: 0.2, transparent: true, opacity: 0.82 })); water.scale.set(S + 0.2, 5.6, S * 0.55 + 0.2); water.position.set(0, -5.4, S * 0.225); g.add(water);
  // island: grass top on the far half, houses with terracotta roofs, a campanile
  const top = new THREE.Mesh(BOX, clayMat('#c9d3a3', 0.95)); top.scale.set(S, 0.6, S * 0.45); top.position.set(0, 0, -S * 0.275); top.receiveShadow = true; g.add(top);
  const walls = [], roofs = [], walls2 = ['#efe6d6', '#f2dcc4', '#e9d2b8', '#f5ecdf', '#e3c9a8'];
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * (S - 30), z = -S * 0.06 - r() * (S * 0.42 - 20), w = 9 + r() * 10, d = 9 + r() * 8, h = 8 + r() * 12;
    walls.push({ x, y: 0.6, z, sx: w, sy: h, sz: d, c: walls2[Math.floor(r() * walls2.length)] });
    roofs.push({ x, y: 0.6 + h, z, sx: w * 0.75, sy: 5, sz: d * 0.75, ry: Math.PI / 4, c: ['#c8643c', '#b9573a', '#d27a4e'][Math.floor(r() * 3)] });
  }
  g.add(instanced(BOX, clayMat('#ffffff', 0.88), walls));
  g.add(instanced(new THREE.ConeGeometry(1, 1, 4).translate(0, 0.5, 0), clayMat('#ffffff', 0.8), roofs));
  const tw = new THREE.Mesh(BOX, clayMat('#e8c9a4')); tw.scale.set(8, 60, 8); tw.position.set(40, 0.6, -60); tw.castShadow = true; g.add(tw);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(6, 14, 4).translate(0, 7, 0), clayMat('#3f7f6a')); cap.position.set(40, 60.6, -60); cap.rotation.y = Math.PI / 4; cap.castShadow = true; g.add(cap);
  // boats on the lagoon
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(BOX, clayMat('#f6f3ee')); b.scale.set(10, 2, 3.5); b.position.set((r() - 0.5) * 220, -0.6, 30 + r() * 100); b.rotation.y = r() * 3; b.castShadow = true; g.add(b); }
  g.position.y = 30; scene.add(g);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.16 })); catcher.position.y = -60; catcher.receiveShadow = true; scene.add(catcher);
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 5, 6000);
  const rig = C.path([{ pos: [380, 300, 470], look: [0, -10, 0], mm: 40 }, { pos: [300, 290, 520], look: [0, -10, 0], mm: 40 }], { duration: shot.duration, float: 0 });
  P.post(ctx, scene, camera, { ao: { radius: 6, intensity: 2.2, falloff: 1 }, tone: HOUSE.tone, quality: 'medium' });
  const layer = layerOf(ctx.overlay), s = sc();
  // Primal Space label: white upper-case on a black slab, with a hand arrow
  el(layer, `position:absolute;left:${1240 * s}px;top:${150 * s}px;padding:${8 * s}px ${16 * s}px;background:#0b0b0b;color:#fff;font:700 ${46 * s}px/1.0 "Archivo Narrow";letter-spacing:.01em;text-transform:uppercase`, 'sand, then clay');
  return { scene, camera, layer, update(t, p) { rig(camera, p, t); } };
}

// ---------------------------------------------------------------- void model (hoog's plan void)
function voidModel(ctx, shot) {
  const scene = new THREE.Scene(), r = K.rng(5);
  const VOID = '#dde5ec';
  brightLight(scene, { target: [0, 0, 0], span: 320, bg: ['#c3d2df', VOID], fogC: VOID, near: 500, far: 1500, mapSize: 2048 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000).rotateX(-Math.PI / 2), clayMat(VOID, 1)); floor.receiveShadow = true; scene.add(floor);
  const g = new THREE.Group(), white = clayMat('#f4f2ee', 0.82);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 4, 96).translate(0, 2, 0), white); ring.castShadow = ring.receiveShadow = true; g.add(ring);
  const towers = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + 0.2, rr = 55 + r() * 45; towers.push([Math.cos(a) * rr, Math.sin(a) * rr, 9 + r() * 7, 30 + r() * 70]); }
  for (const [x, z, rad, h] of towers) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 40).translate(0, h / 2 + 4, 0), white); m.position.set(x, 0, z); m.castShadow = m.receiveShadow = true; g.add(m); }
  // pastel accents: a lavender spine (the highway) and coral markers (hoog Tokyo palette)
  const spine = new THREE.Mesh(BOX, clayMat(HOUSE.lavender, 0.7)); spine.scale.set(560, 6, 14); spine.position.set(0, 4, 0); spine.rotation.y = -0.45; spine.castShadow = spine.receiveShadow = true; g.add(spine);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 3, 24).translate(0, 1.5, 0), clayMat(HOUSE.coral, 0.6)); const u = -200 + i * 100; m.position.set(Math.cos(-0.45) * u, 10, -Math.sin(-0.45) * u); m.castShadow = true; g.add(m); }
  scene.add(g);
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 5, 8000);
  const rig = C.path([{ pos: [330, 260, 380], look: [0, 20, 0], mm: 35 }, { pos: [260, 250, 430], look: [0, 20, 0], mm: 35 }], { duration: shot.duration, float: 0 });
  P.post(ctx, scene, camera, { ao: { radius: 8, intensity: 2.4, falloff: 1 }, tone: HOUSE.tone, quality: 'medium' });
  const layer = layerOf(ctx.overlay), s = sc();
  el(layer, `position:absolute;left:${120 * s}px;top:${96 * s}px;font:400 ${44 * s}px "Archivo Narrow";color:${HOUSE.navy};letter-spacing:.01em`, 'a city on the water, 1960');
  el(layer, `position:absolute;left:${122 * s}px;top:${152 * s}px;font:500 ${15 * s}px "Plex Mono";color:${HOUSE.navy};opacity:.7;letter-spacing:.2em;text-transform:uppercase`, 'model · not to scale');
  return { scene, camera, layer, update(t, p) { rig(camera, p, t); } };
}

// ---------------------------------------------------------------- bright map slab (Neo / RLL / Wendover)
const HORMUZ = await (await fetch('/projects/look-lab/assets/hormuz.json')).json();
function mapSlab(ctx, shot) {
  const scene = new THREE.Scene(), k = 60, kx = Math.cos(26 * Math.PI / 180);
  const X = (lon) => (lon - 56.2) * k * kx, Z = (lat) => -(lat - 26.0) * k;
  brightLight(scene, { target: [0, 0, 0], span: 700, fog: true, bg: ['#9cc9de', '#d9edf0'], fogC: '#d9edf0', near: 560, far: 1250, mapSize: 4096 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000).rotateX(-Math.PI / 2), clayMat(HOUSE.sea, 0.5)); sea.receiveShadow = true; scene.add(sea);
  const topM = clayMat(HOUSE.land, 0.95), sideM = clayMat(HOUSE.landSide, 0.95), shelfM = new THREE.MeshStandardMaterial({ color: col('#b3e0da'), roughness: 0.6 });
  for (const ring of HORMUZ.land) {
    const sh = new THREE.Shape(); for (let i = 0; i < ring.length; i += 2) (i ? sh.lineTo : sh.moveTo).call(sh, X(ring[i]), -Z(ring[i + 1]));
    const land = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: false }).rotateX(-Math.PI / 2), [topM, sideM]); land.castShadow = land.receiveShadow = true; scene.add(land);
    const shelf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 7, bevelSegments: 1 }).rotateX(-Math.PI / 2), shelfM); shelf.receiveShadow = true; scene.add(shelf);
  }
  // the glowing route (unlit, so it reads at full brightness and blooms in the finish)
  const route = [[50.6, 26.6], [52.6, 26.5], [55.0, 26.55], [56.3, 26.45], [57.0, 25.8], [57.9, 24.9], [59.6, 23.9]].map(([lo, la]) => new THREE.Vector3(X(lo), 4.2, Z(la)));
  const curve = new THREE.CatmullRomCurve3(route);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 1.6, 8), new THREE.MeshBasicMaterial({ color: col(HOUSE.yellow) })));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 4.0, 8), new THREE.MeshBasicMaterial({ color: col(HOUSE.yellow), transparent: true, opacity: 0.25, depthWrite: false })));
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 5, 12000);
  const rig = C.path([{ pos: [90, 430, 470], look: [0, 0, -30], mm: 32 }, { pos: [60, 405, 440], look: [0, 0, -30], mm: 32 }], { duration: shot.duration, float: 0 });
  P.post(ctx, scene, camera, { ao: { radius: 10, intensity: 1.6, falloff: 1 }, tone: HOUSE.tone, quality: 'medium' });
  const layer = layerOf(ctx.overlay), s = sc();
  const pill = el(layer, `position:absolute;padding:${7 * s}px ${18 * s}px;background:#fbf8f2;border-radius:${30 * s}px;box-shadow:0 ${2 * s}px ${14 * s}px rgba(15,30,51,.28);font:600 ${28 * s}px "Archivo Narrow";color:${HOUSE.navy};white-space:nowrap`, 'Strait of Hormuz');
  const slabs = [['IRAN', 55.2, 28.6], ['OMAN', 57.4, 21.9], ['UAE', 54.2, 23.6]].map(([n, lo, la]) => [el(layer, `position:absolute;padding:${5 * s}px ${12 * s}px;background:${HOUSE.navy};color:#fbf8f2;font:700 ${24 * s}px "Archivo Narrow";letter-spacing:.12em`, n), lo, la]);
  return { scene, camera, layer, update(t, p) {
    rig(camera, p, t);
    const [px, py] = K.toScreen(new THREE.Vector3(X(56.3), 6, Z(26.75)), camera);
    pill.style.left = `${px * s - pill.offsetWidth / 2}px`; pill.style.top = `${py * s - pill.offsetHeight - 14 * s}px`;
    for (const [e, lo, la] of slabs) { const [x, y] = K.toScreen(new THREE.Vector3(X(lo), 4, Z(la)), camera); e.style.left = `${x * s - e.offsetWidth / 2}px`; e.style.top = `${y * s}px`; }
  } };
}

const SETS = { clayCity, diorama, voidModel, mapSlab };
export default async function create(ctx) {
  const { renderer, shots } = ctx;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const live = new Map();
  for (const s of shots) live.set(s.id, await SETS[s.set](ctx, s));
  const layers = [...live.values()].map(v => v.layer).filter(Boolean);
  return {
    frame({ shot, t, p }) {
      const inst = live.get(shot.id);
      for (const l of layers) l.style.display = l === inst.layer ? '' : 'none';
      inst.update(t, p);
      renderer.render(inst.scene, inst.camera);
    },
  };
}
