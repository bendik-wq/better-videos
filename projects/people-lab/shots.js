// people-lab: six shots that test engine/people against the "CG mannequin" bar.
//   corridor  a suited man walks a long government corridor towards a bright window; follow-through
//   analyst   an analyst types at a desk, lit by his monitor; over the shoulder, slow drift
//   protest   a protest crowd on a wet street at dusk; placards; push in behind the crowd
//   orb       a hooded figure leans over a glowing orb (replaces Palantir's lathe robes)
//   office    an open-plan office floor from above; slow drift
//   command   a soldier in a command centre before the video wall; operators at consoles
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as PE from '/engine/people/index.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const { look: LK, props: PR, acts: AC, layouts: LY } = PE;

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const softTex = (() => { let t; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); return t; }; })();
// a soft additive glow card (lamp halos, light pools on floors, reflections on wet ground)
const glowMats = new Map();
function glow(color, w, h, opacity = 1) {
  const key = color + '/' + opacity; // shared per colour+opacity, so freeze() can merge the cards
  if (!glowMats.has(key)) glowMats.set(key, new THREE.MeshBasicMaterial({ map: softTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); // additive: fog would ADD the fog colour
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowMats.get(key));
}
function roomEnv(renderer) { const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return t; }

// ===================================================================== corridor
export async function corridor(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0c0d);
  scene.fog = new THREE.FogExp2(0x3a3a36, 0.045);
  scene.environment = roomEnv(renderer); scene.environmentIntensity = 0.18;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 120);
  const W = 3.0, H = 3.1, L = 46, z0 = 6;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), PR.pbr('Concrete034', { repeat: [1.2, 18], color: 0x6c6a66, roughness: 0.55, normalScale: 0.25, envMapIntensity: 1.2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = z0 - L / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = PR.pbr('PaintedPlaster017', { repeat: [L / 2.5, H / 2.5], color: 0x7d8479, roughness: 0.92, normalScale: 0.08 }); wallMat.roughnessMap = null; wallMat.envMapIntensity = 0.3;
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * W / 2, H / 2, z0 - L / 2); w.receiveShadow = true; scene.add(w); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ color: 0x6d6f6c, roughness: 0.95 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, z0 - L / 2); scene.add(ceil);
  // dado rail, skirting, doors with frames and small wired-glass windows, every 5.5 m alternating
  const dark = new THREE.MeshStandardMaterial({ color: 0x3b3a36, roughness: 0.6 });
  const wood = PR.pbr('Wood049', { repeat: [1, 2], color: 0x5a4a3c, roughness: 0.7, normalScale: 0.15, rotation: Math.PI / 2 });
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, L), dark); rail.position.set(sx * (W / 2 - 0.015), 1.0, z0 - L / 2); scene.add(rail);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, L), dark); skirt.position.set(sx * (W / 2 - 0.01), 0.06, z0 - L / 2); scene.add(skirt);
    for (let z = z0 - 3 - (sx > 0 ? 2.7 : 0); z > z0 - L + 2; z -= 5.5) {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 1.1), dark); fr.position.set(sx * (W / 2 - 0.02), 1.1, z); scene.add(fr);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.08, 0.94), wood); door.position.set(sx * (W / 2 - 0.035), 1.04, z); door.castShadow = door.receiveShadow = true; scene.add(door);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x8fa3b0 })); win.rotation.y = -sx * Math.PI / 2; win.position.set(sx * (W / 2 - 0.065), 1.55, z + 0.2); scene.add(win);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.07), new THREE.MeshStandardMaterial({ color: 0xc8c2b0, roughness: 0.4, metalness: 0.6 })); plate.rotation.y = -sx * Math.PI / 2; plate.position.set(sx * (W / 2 - 0.005), 1.6, z - 0.75); scene.add(plate);
    }
  }
  // ceiling: recessed fluorescent panels every 3.5 m, each throwing a soft pool on the floor
  for (let z = z0 - 1.5; z > z0 - L; z -= 3.5) {
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.62, 1.55) })); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, H - 0.01, z); scene.add(lamp);
    const pool = glow(0xd8e0d8, 2.6, 3.4, 0.10); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.004, z); scene.add(pool);
    for (const sx of [-1, 1]) { const wp = glow(0xd8e0d8, 3.0, 2.4, 0.07); wp.rotation.y = -sx * Math.PI / 2; wp.position.set(sx * (W / 2 - 0.01), 1.9, z); scene.add(wp); }
  }
  // the far end: a tall frosted window, overexposed; it is the key light (hard, low, through the haze)
  const end = z0 - L;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, H - 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.4, 7.4), fog: false })); win.position.set(0, H / 2, end + 0.01); scene.add(win);
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: 0x777777 })); endWall.position.set(0, H / 2, end); scene.add(endWall);
  for (let i = 1; i < 4; i++) { const mull = new THREE.Mesh(new THREE.BoxGeometry(0.05, H - 0.3, 0.05), dark); mull.position.set(-W / 2 + 0.2 + i * (W - 0.4) / 4, H / 2, end + 0.03); scene.add(mull); }
  const key = new THREE.DirectionalLight(0xfff0dc, 4.5); key.position.set(0.4, 2.3, end + 0.5); key.target.position.set(0, 0, z0); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -2; sc.right = 2; sc.top = 3; sc.bottom = -1; sc.near = 1; sc.far = L + 4; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  const halo = glow(0xfff2e0, 9, 7, 0.9); halo.material.fog = false; halo.position.set(0, H / 2, end + 0.3); scene.add(halo);
  scene.add(new THREE.HemisphereLight(0xc9d2cc, 0x403c36, 0.12));
  // the ceiling panels light the corridor: a few real (shadowless) point lights spaced down it
  for (let z = z0 - 6; z > z0 - 24; z -= 9) { const pl = new THREE.PointLight(0xe6eee6, 2.0, 9, 1.8); pl.position.set(0, H - 0.25, z); scene.add(pl); }

  // the man: charcoal wool suit; walks away from us towards the window
  const man = PE.person('suit', { dress: { garments: { male_elegantsuit01: { fabric: 'wool', tint: 0.8 } } } });
  scene.add(man.root);
  const walk = PE.walker(man, [[0.15, z0 - 2.2], [0.05, z0 - 12], [-0.15, z0 - 22]], { clip: 'walk', t0: 0.35, accel: 0.8, speed: 1.3, dist: 1.3 * (D - 0.35) + 2 });
  console.log('[scene] corridor freeze', JSON.stringify(PR.freeze(scene, { keep: [man.root] })));
  const subject = (t) => { const s = walk.gait.s(t); const p = walk.path.at(s); return [p.x, 0, p.z]; };
  const move = C.moves.followThrough({ subject, mm: 32, offset: [0.55, 1.62, 4.3], lag: 0.55, overshoot: 0.08, lookHeight: 1.25, float: 0.012, seed: 3 });
  return { scene, camera, update(t, p) {
    walk.update(t); move(camera, p, t);
  } };
}

// ===================================================================== analyst at a desk
export async function analyst(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.FogExp2(0x070a0e, 0.06);
  scene.environment = roomEnv(renderer); scene.environmentIntensity = 0.05;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 80);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), PR.pbr('Carpet016', { repeat: [14, 14], color: 0x5a5e66, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const dk = PR.desk({ top: PR.pbr('Wood049', { repeat: [1, 1], color: 0x6a5a4c, roughness: 0.5 }) }); scene.add(dk);
  const mon = PR.monitor({ glow: 2.2 }); mon.group.position.set(0.05, 0.74, 0.12); scene.add(mon.group);
  const mon2 = PR.monitor({ glow: 1.8 }); mon2.group.position.set(-0.55, 0.74, 0.16); mon2.group.rotation.y = 0.35; scene.add(mon2.group);
  const kb = PR.keyboard(); kb.position.set(0.02, 0.74, -0.16); scene.add(kb);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.35 })); mug.position.set(0.5, 0.79, -0.05); mug.castShadow = true; scene.add(mug);
  for (let i = 0; i < 4; i++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.297), new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.9 })); pp.position.set(-0.45 + i * 0.012, 0.742 + i * 0.004, -0.15 + i * 0.01); pp.rotation.y = 0.2 - i * 0.07; scene.add(pp); }
  const ch = PR.chair(); ch.position.set(0.02, 0, -0.66); ch.rotation.y = Math.PI; scene.add(ch);
  // background: the dark office, other screens far off (soft rectangles in the haze)
  const r = K.rng(5);
  // the rest of the floor after hours: a few screens still on at far desks, dim, over dark desks
  const farC = document.createElement('canvas'); farC.width = 256; farC.height = 145; PR.defaultScreen(farC.getContext('2d'), 256, 145, 3);
  const farT = new THREE.CanvasTexture(farC); farT.colorSpace = THREE.SRGBColorSpace;
  const deskDark = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 });
  for (let i = 0; i < 16; i++) { const x0 = (r() - 0.5) * 16, z0 = 4 + r() * 10; const lum = 0.18 + r() * 0.25;
    const dd = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.74, 0.75), deskDark); dd.position.set(x0 + 0.3, 0.37, z0 + 0.2); scene.add(dd);
    for (let k = 0; k < (r() < 0.5 ? 1 : 2); k++) { if (r() < 0.25) continue; const s = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.3), new THREE.MeshBasicMaterial({ map: farT, color: new THREE.Color(lum, lum, lum * 1.1) }));
      s.position.set(x0 + k * 0.56, 1.16, z0); s.rotation.y = Math.PI; scene.add(s); } }
  // tall windows far behind: city glow
  const winWall = glow(0x2a3a55, 34, 7, 0.45); winWall.position.set(0, 2.6, 15); winWall.rotation.y = Math.PI; scene.add(winWall);
  // the analyst
  const man = PE.person('analyst', { dress: { garments: { toigo_fisherman_sweater: { fabric: 'wool', color: 0x34363a, map: false }, elvs_male_trouser: { fabric: 'wool', tint: 0.6 } }, skin: { tone: 0.9 }, hair: { color: 0x3a2e26 } } });
  man.root.position.set(0.02, 0.0, -0.56); scene.add(man.root);
  // light: the monitor (cool, soft, from the front-low), a warm practical far behind (rim on hair/shoulders)
  const ml = new THREE.SpotLight(0xa8c8ff, 9, 4, 1.0, 1, 1.6); ml.position.set(0.05, 1.18, 0.0); ml.target.position.set(0, 1.2, -0.9); ml.castShadow = true; ml.shadow.mapSize.set(1024, 1024); ml.shadow.bias = -0.0005; scene.add(ml, ml.target);
  const rim = new THREE.DirectionalLight(0xffc890, 1.4); rim.position.set(-1.5, 3, -4); rim.target.position.set(0, 1, -0.5); scene.add(rim, rim.target);
  const lamp = glow(0xffb070, 1.2, 1.2, 0.8); lamp.position.set(-2.6, 1.6, -5.5); scene.add(lamp);
  scene.add(new THREE.HemisphereLight(0x324058, 0x080808, 0.25));
  await PR.ready();
  const keys = v(0.02, 0.74, -0.16), screen = v(0.05, 1.16, 0.1);
  const rig = C.path([
    { pos: [-2.15, 1.42, -2.6], look: [0.15, 1.02, -0.2], mm: 40 },
    { pos: [-1.55, 1.38, -2.75], look: [0.25, 1.02, -0.2], mm: 40 },
  ], { duration: D, accel: 0.3, decel: 0.5, float: 0.006, seed: 11 });
  // the chair goes where the mocap actor's hips are (seat 10 cm under the pelvis joint)
  man.play('sit_idle', 0).update(); const hip = man.worldPos('pelvis');
  ch.position.set(hip.x, -0.04, hip.z - 0.1); console.log('[scene] analyst pelvis', hip.toArray().map(x => x.toFixed(3)).join(','));
  const dbg = shot.params.cam;
  return { scene, camera, update(t, p) {
    AC.typing(man, t, { keys, screen, seed: 2, lean: 0.0 });
    mon.draw(t); mon2.draw(t + 7); rig(camera, p, t);
    if (dbg) { C.lens(camera, 35); camera.position.set(...dbg); camera.lookAt(0, 0.9, -0.4); }
  } };
}

// ===================================================================== protest on a wet street at dusk
export async function protest(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  await C.preload(renderer, { characters: [], hdris: ['qwantani_dusk_2'] });
  const scene = new THREE.Scene();
  C.sky(scene, 'qwantani_dusk_2', { background: true, intensity: 0.05, bgIntensity: 0.22 });
  scene.backgroundRotation = new THREE.Euler(0, 2.1, 0); scene.environmentRotation = new THREE.Euler(0, 2.1, 0);
  scene.fog = new THREE.FogExp2(0x4a3e3c, 0.016);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 600);
  // wet asphalt: low roughness with the texture's own variation as puddles
  const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 260), PR.pbr('Asphalt026A', { repeat: [6, 60], color: 0x2c2a28, roughness: 0.2, normalScale: 0.5, envMapIntensity: 3.0 }));
  road.rotation.x = -Math.PI / 2; road.position.z = -110; road.receiveShadow = true; scene.add(road);
  { // puddles: a roughness map of damp asphalt (0.55-0.75) broken by mirror-smooth standing water
    const c = document.createElement('canvas'); c.width = 256; c.height = 2048; const x = c.getContext('2d'); const rr = K.rng(17);
    x.fillStyle = 'rgb(0,150,0)'; x.fillRect(0, 0, 256, 2048);
    for (let i = 0; i < 900; i++) { const v = 120 + rr() * 80; x.fillStyle = `rgba(0,${v},0,.35)`; x.beginPath(); x.ellipse(rr() * 256, rr() * 2048, 4 + rr() * 20, 6 + rr() * 40, rr() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 160; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(0,40,0,.8)'); g.addColorStop(0.7, 'rgba(0,60,0,.5)'); g.addColorStop(1, 'rgba(0,150,0,0)');
      x.save(); x.translate(rr() * 256, rr() * 2048); x.scale(6 + rr() * 26, 10 + rr() * 60); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8);
    road.material.roughnessMap = t; road.material.roughness = 1; road.material.normalScale.set(0.35, 0.35); }
  const walkMat = PR.pbr('Concrete034', { repeat: [3, 60], color: 0x3a3836, roughness: 0.3, envMapIntensity: 2.0 });
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 260), walkMat); sw.position.set(sx * 15.5, 0.075, -110); sw.receiveShadow = true; scene.add(sw); }
  // facades: tall dark masses with irregular cornices and few warm windows, receding into haze
  // facades: stone with recessed windows (canvas: dark glass catching the sky, a few lit)
  const facC = document.createElement('canvas'); facC.width = 512; facC.height = 1024; { const x = facC.getContext('2d'); const rr = K.rng(31);
    x.fillStyle = '#4a4540'; x.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 2500; i++) { const v = 50 + rr() * 40; x.fillStyle = `rgba(${v},${v * 0.95},${v * 0.9},.25)`; x.fillRect(rr() * 512, rr() * 1024, 2 + rr() * 30, 1 + rr() * 4); }
    for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 4; fx++) { const X = 40 + fx * 120, Y = 40 + fy * 124;
      x.fillStyle = '#2a2724'; x.fillRect(X - 6, Y - 6, 72, 98); const g = x.createLinearGradient(0, Y, 0, Y + 86); g.addColorStop(0, '#5a6070'); g.addColorStop(1, '#1c1e24'); x.fillStyle = g; x.fillRect(X, Y, 60, 86);
      x.fillStyle = '#2a2724'; x.fillRect(X + 28, Y, 4, 86); x.fillRect(X, Y + 38, 60, 4); x.fillStyle = '#5e5850'; x.fillRect(X - 8, Y + 88, 76, 7); } }
  const facT = new THREE.CanvasTexture(facC); facT.colorSpace = THREE.SRGBColorSpace; facT.wrapS = facT.wrapT = THREE.RepeatWrapping; facT.anisotropy = 4;
  const fac = new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.8, map: facT, envMapIntensity: 0.6 });
  const r = K.rng(9); const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.8) });
  for (const sx of [-1, 1]) for (let z = 10; z > -230; ) {
    const w = 8 + r() * 14, h = 14 + r() * 26; const bg = new THREE.BoxGeometry(6, h, w); const uv = bg.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * w / 8, uv.getY(q) * h / 16); const b = new THREE.Mesh(bg, fac); b.position.set(sx * 21, h / 2, z - w / 2); scene.add(b);
    const corn = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.5, w), fac); corn.position.set(sx * 20.8, h - 0.4, z - w / 2); scene.add(corn);
    for (let k = 0; k < 4; k++) if (r() < 0.55) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), winMat); wn.rotation.y = -sx * Math.PI / 2; wn.position.set(sx * 17.98, 4 + Math.floor(r() * (h - 6) / 3.5) * 3.5, z - 1 - r() * (w - 2)); scene.add(wn); }
    z -= w + 0.3;
  }
  // street lights (sodium) both sides; halos + long reflections on the wet road
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.2) }), pole = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.6 });
  for (const sx of [-1, 1]) for (let z = 4; z > -200; z -= 24) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 8), pole); p.position.set(sx * 13.5, 4, z); scene.add(p);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.08), pole); arm.position.set(sx * 12.6, 7.9, z); scene.add(arm);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), lampMat); l.position.set(sx * 11.7, 7.8, z); scene.add(l);
    const h = glow(0xffb060, 4, 4, 0.55); h.position.set(sx * 11.7, 7.7, z + 0.2); scene.add(h);
    const refl = glow(0xffa050, 1.4, 14, 0.22); refl.rotation.x = -Math.PI / 2; refl.position.set(sx * 11.2, 0.02, z + 7); scene.add(refl);
  }
  // the sun is down the street behind the crowd: a low warm key into the lens, the sky as fill
  const key = new THREE.DirectionalLight(0xffa868, 3.2); key.position.set(-5, 8, -70); key.target.position.set(0, 0, 0); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 30, far: 120 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  scene.add(new THREE.HemisphereLight(0x5a6888, 0x1a1612, 0.06));
  const sun = glow(0xffc080, 60, 26, 0.55); sun.material.fog = false; sun.position.set(-4, 5, -200); scene.add(sun);
  // the crowd: 900 people facing us, marching on the light
  const agents = LY.protest({ count: 900, center: [0, -17], radius: [11.5, 15], facing: 0, seed: 21 });
  const crowdClips = ['fists', 'idle', 'wait', 'talk', 'argue'];
  const cr = await PE.crowd(scene, { renderer, agents, clips: crowdClips, impostorLight: 'back', lod: { nearPx: 330, midPx: 150, maxNear: 6, maxMid: 110 } });
  // placards held up through the crowd (their hands are lost in the mass)
  const words = ['NO', 'ENOUGH', 'NOT\nFOR SALE', 'WHO\nWATCHES?', 'STOP', 'OUR DATA', 'NO MORE', 'SHAME', 'HANDS OFF', 'WE SEE YOU'];
  const boards = [];
  agents.forEach((a, i) => { if (i % 15 !== 3 || a.pos[1] > -6) return; const pl = PR.placard({ text: words[i % words.length], seed: i }); scene.add(pl); boards.push([pl, a, i]); });
  // front row: three full protestors with placards (two-bone IK on the poles)
  const fg = [];
  for (let i = 0; i < 3; i++) { const id = ['protestor', 'hoodie', 'casual_f'][i]; const pp = PE.person(id, { dress: { outfit: { tint: 0.75 } } });
    pp.root.position.set(-2.4 + i * 2.3, 0, -3.6 - (i % 2) * 0.9); pp.root.rotation.y = (i - 1) * -0.12; scene.add(pp.root);
    const pl = PR.placard({ text: ['NOT\nFOR SALE', 'NO', 'WHO\nWATCHES?'][i], seed: 100 + i }); scene.add(pl); fg.push([pp, pl, i]); }
  await PR.ready();
  console.log('[scene] protest freeze', JSON.stringify(PR.freeze(scene, { keep: [...fg.map(f => f[0].root), ...fg.map(f => f[1]), ...boards.map(b => b[0])] })));
  const rig = C.path([
    { pos: [1.2, 1.7, 17.5], look: [0.0, 2.6, -30], mm: 65 },
    { pos: [0.7, 1.8, 14.5], look: [0.0, 2.7, -30], mm: 65 },
  ], { duration: D, accel: 0.35, decel: 0.45, float: 0.02, seed: 4 });
  return { scene, camera, crowd: cr, update(t, p) {
    rig(camera, p, t);
    fg.forEach(([pp, pl, i]) => AC.holdPlacard(pp, t, pl, { clip: i === 1 ? 'fists' : 'idle', seed: i * 1.7, rate: 0.7 + i * 0.12 }));
    boards.forEach(([pl, a, i]) => { const k = Math.max(0, Math.sin((t + i * 0.37) * Math.PI * 2 * (0.6 + (i % 5) * 0.06))) ** 2;
      pl.position.set(a.pos[0] + 0.05, 0.55 + 0.12 * k + (a.scale - 1) * 1.5, a.pos[1] + 0.25); pl.rotation.set(-0.04 * Math.sin(t + i), a.yaw + 0.15 * Math.sin(t * 0.4 + i), 0.08 * Math.sin(t * 0.9 + i * 2)); });
    cr.update(t, camera);
  } };
}

// ===================================================================== hooded figure at the orb
export async function orb(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020203);
  scene.fog = new THREE.FogExp2(0x0a0705, 0.09);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 60);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), PR.pbr('Concrete034', { repeat: [8, 8], color: 0x3a3632, roughness: 0.75 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), PR.pbr('Plaster001', { repeat: [6, 3], color: 0x2e2a26, roughness: 1 })); wall.position.set(0, 6, -5); wall.receiveShadow = true; scene.add(wall);
  const o = PR.orb({ radius: 0.13, color: 0xffa860, intensity: 0.7, height: 1.12 }); scene.add(o.group);
  // the figure: monk robe + deep hood, face lost in shadow (skin darkened, no lit features)
  const fig = PE.person('robe', { dress: { garments: { donitz_monk_robe: { fabric: 'wool', color: 0x231f1c }, donitz_monk_robe_hood: { fabric: 'wool', color: 0x231f1c } }, skin: { tone: 0.25, sss: 1.4 } } });
  fig.root.position.set(0, 0, 0.58); fig.root.rotation.y = Math.PI; scene.add(fig.root);
  const back = new THREE.SpotLight(0x8aa0c8, 3, 12, 0.35, 0.9, 1.2); back.position.set(-1.5, 4.5, -3.5); back.target.position.set(0, 1.4, 0.6); scene.add(back, back.target);
  scene.add(new THREE.HemisphereLight(0x1a1c22, 0x050403, 0.2));
  const motes = shot.params.motes !== true ? new THREE.Group() : new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffc89a, size: 0.012, transparent: true, opacity: 0.6, depthWrite: false }));
  const r = K.rng(4), mp = new Float32Array(160 * 3); for (let i = 0; i < 160; i++) { mp[i * 3] = (r() - 0.5) * 1.6; mp[i * 3 + 1] = 0.6 + r() * 1.6; mp[i * 3 + 2] = (r() - 0.5) * 1.6; } // dust in the orb's light only
  if (motes.geometry) motes.geometry.setAttribute('position', new THREE.BufferAttribute(mp, 3)); scene.add(motes);
  await PR.ready();
  const rig = C.moves.orbitReveal({ target: [0, 1.38, 0.3], mm: 50, dist: 3.4, az: shot.params.az ?? 208, el: 6, arc: 18, push: 0.08, opts: { duration: D, float: 0.008 } });
  return { scene, camera, update(t, p) {
    o.update(t); AC.attendOrb(fig, t, o.center, { seed: 2, lean: 0.22, open: 0.23 });
    motes.position.y = (t * 0.02) % 0.1; motes.rotation.y = t * 0.03;
    rig(camera, p, t);
  } };
}

// ===================================================================== office floor from above
export async function office(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x101214);
  scene.environment = roomEnv(renderer); scene.environmentIntensity = 0.25;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.5, 200);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), PR.pbr('Carpet016', { repeat: [24, 16], color: 0x3c3f44, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // benching: pairs of desks face to face across a low frosted divider; 1.8 m aisles between pairs
  const desks = [], agents = []; const rr = K.rng(7);
  const bodies = ['office', 'office_f', 'analyst', 'suit', 'casual_f', 'suit_f', 'casual_b'];
  const tints = [[0.85, 0.85, 0.9], [0.55, 0.6, 0.7], [0.4, 0.42, 0.46], [0.75, 0.7, 0.62], [0.3, 0.32, 0.35]];
  for (let k = -3; k <= 3; k++) for (let c = -4; c <= 4; c++) for (const side of [-1, 1]) {
    const x = c * 1.62, z = k * 3.4 + side * 0.4, yaw = side < 0 ? 0 : Math.PI; desks.push({ x, z, yaw });
    if (rr() < 0.8) agents.push({ pos: [x, z - Math.cos(yaw) * 0.66], yaw, body: bodies[Math.floor(rr() * bodies.length)], clip: rr() < 0.72 ? 'sit_type' : (rr() < 0.5 ? 'sit_idle' : 'sit_think'), phase: rr() * 10, rate: 0.9 + rr() * 0.2, scale: 0.96 + rr() * 0.08, tint: tints[Math.floor(rr() * tints.length)] });
  }
  for (let k = 0; k < 6; k++) { const lane = (Math.floor(rr() * 6) - 3) * 3.4 + 1.7; const d = rr() < 0.5 ? 1 : -1;
    agents.push({ pos: [(rr() - 0.5) * 14, lane], body: bodies[Math.floor(rr() * bodies.length)], clip: ['walk', 'walk_b', 'walk_slow'][k % 3], vel: [d * (1.1 + rr() * 0.3), 0], wrap: { axis: 'x', min: -9, max: 9 }, phase: rr() * 5, scale: 1, tint: tints[k % tints.length] }); }
  const top = PR.pbr('Wood049', { repeat: [1, 1], color: 0xb0a090, roughness: 0.55, normalScale: 0.2 }), frame = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.5 });
  const divMat = new THREE.MeshStandardMaterial({ color: 0xc8d0d4, roughness: 0.35, transparent: true, opacity: 0.55 });
  const paper = new THREE.MeshStandardMaterial({ color: 0x9a9890, roughness: 0.9 }), mugM = new THREE.MeshStandardMaterial({ color: 0xd0ccc4, roughness: 0.4 });
  const mons = [];
  desks.forEach((d, i) => {
    const g = PR.desk({ top, frame, width: 1.56 }); g.position.set(d.x, 0, d.z); g.rotation.y = d.yaw; scene.add(g);
    const m = PR.monitor({ glow: 1.5, shared: true }); m.group.position.set(0, 0.74, 0.2); m.group.rotation.x = -0.08; g.add(m.group); mons.push(m);
    const kb = PR.keyboard(); kb.position.set((rr() - 0.5) * 0.1, 0.74, -0.14); g.add(kb);
    const c = PR.chair(); c.position.set((rr() - 0.5) * 0.15, -0.04, -0.72 - rr() * 0.1); c.rotation.y = Math.PI + (rr() - 0.5) * 0.5; g.add(c);
    for (let q = 0; q < Math.floor(rr() * 4); q++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.297), paper); pp.position.set(-0.55 + rr() * 0.3, 0.744 + q * 0.004, -0.1 + rr() * 0.15); pp.rotation.y = rr() - 0.5; g.add(pp); }
    if (rr() < 0.5) { const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.1, 12), mugM); mg.position.set(0.5 + rr() * 0.15, 0.79, rr() * 0.2 - 0.1); g.add(mg); }
  });
  for (let k = -3; k <= 3; k++) { const dv = new THREE.Mesh(new THREE.BoxGeometry(9 * 1.62, 0.4, 0.03), divMat); dv.position.set(0, 0.94, k * 3.4); scene.add(dv); }
  const cr = await PE.crowd(scene, { renderer, agents, clips: ['sit_type', 'sit_idle', 'sit_think', 'walk', 'walk_b', 'walk_slow'], impostors: false, lod: { nearPx: 0, midPx: 0, maxNear: 6, maxMid: 400 } });
  // overhead: one soft key straight down (fluorescent grid), ceiling light panels out of frame
  // evening: the overhead grid at half, each row of panels pooling light on the desks below,
  // the screens adding their own cool spill; a low warm sun through the west windows rakes in
  const key = new THREE.DirectionalLight(0xffc89a, 1.6); key.position.set(-14, 9, 4); key.target.position.set(0, 0, 0); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 2, far: 50 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03;
  const top2 = new THREE.DirectionalLight(0xe6eeff, 0.7); top2.position.set(2, 20, 3); scene.add(top2);
  scene.add(new THREE.HemisphereLight(0xb8c4d8, 0x303030, 0.35));
  for (let k = -3; k <= 3; k++) { const pool = glow(0xcfe0ff, 18, 3.0, 0.06); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.77, k * 3.4); scene.add(pool); }
  await PR.ready();
  const rig = C.path([
    { pos: [-1.8, 13.0, 1.2], look: [-1.6, 0, 0.9], mm: 35 },
    { pos: [1.6, 12.4, -0.2], look: [1.8, 0, -0.5], mm: 35 },
  ], { duration: D, accel: 0.4, decel: 0.4, float: 0.01, seed: 2, roll: 0 });
  // screens only redraw every few seconds: 48 canvases per frame is wasted CPU
  mons.forEach((m, i) => { if (i < 1) m.draw(i); });
  console.log('[scene] office freeze', JSON.stringify(PR.freeze(scene)));
  return { scene, camera, crowd: cr, update(t, p) { rig(camera, p, t); camera.rotation.z += shot.params.noroll ? 0 : 0.35 + 0.1 * (p - 0.5); cr.update(t, camera); } };
}

// ===================================================================== soldier in a command centre
// (pointing from behind reads poorly: the arm hides behind the body. AC.pointAt is for side views.)
function wallScreen(x, w, h, t) {
  x.fillStyle = '#061018'; x.fillRect(0, 0, w, h);
  // a map: coast lines as noisy contours, a grid, tracks
  x.strokeStyle = 'rgba(60,140,190,.35)'; x.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 32) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, h); x.stroke(); }
  for (let gy = 0; gy < h; gy += 32) { x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke(); }
  x.strokeStyle = 'rgba(120,200,240,.8)'; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i <= 120; i++) { const u = i / 120; x.lineTo(u * w, h * (0.55 + 0.12 * Math.sin(u * 9) + 0.06 * Math.sin(u * 23 + 1))); } x.stroke();
  const r = K.rng(3);
  for (let i = 0; i < 28; i++) { const px = r() * w, py = r() * h * 0.5 + h * 0.1, a = r() * 6.28, sp = 6 + r() * 10; const q = (t * 0.05 * sp) % 40;
    x.fillStyle = i % 7 === 0 ? 'rgba(255,90,70,.95)' : 'rgba(150,230,255,.9)'; x.fillRect(px + Math.cos(a) * q - 2, py + Math.sin(a) * q - 2, 4, 4);
    x.strokeStyle = 'rgba(150,230,255,.25)'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * q, py + Math.sin(a) * q); x.stroke(); }
  x.fillStyle = 'rgba(150,210,240,.7)'; for (let i = 0; i < 14; i++) x.fillRect(10, h - 120 + i * 8, 40 + r() * 80, 3);
}
export async function command(ctx, shot) {
  const { width, height, renderer } = ctx; const D = shot.duration;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020407);
  scene.fog = new THREE.FogExp2(0x061019, 0.045);
  scene.environment = roomEnv(renderer); scene.environmentIntensity = 0.04;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), PR.pbr('Concrete034', { repeat: [10, 10], color: 0x3a3e44, roughness: 0.35, envMapIntensity: 1.2 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // the video wall: 4 x 2 panels with bezels, 10 m wide, 4 m tall, 9 m in front
  const panels = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 288; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 1.38), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.5, 1.5, 1.5), fog: false }));
    m.position.set(-3.75 + i * 2.5, 1.6 + j * 1.42, -9); scene.add(m); panels.push({ c, x: c.getContext('2d'), tex, i, j });
  }
  const bez = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.05, 0.1), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 })); bez.position.set(0, 2.31, -9.08); scene.add(bez);
  const wl = new THREE.DirectionalLight(0x7fc4ff, 2.2); wl.position.set(0, 2.6, -9); wl.target.position.set(0, 1, 2); scene.add(wl, wl.target);
  wl.castShadow = true; wl.shadow.mapSize.set(2048, 2048); Object.assign(wl.shadow.camera, { left: -7, right: 7, top: 5, bottom: -2, near: 1, far: 20 }); wl.shadow.bias = -0.0004;
  const halo = glow(0x3c8cd0, 16, 7, 0.3); halo.position.set(0, 2.3, -8.9); scene.add(halo);
  const floorRefl = glow(0x3c8cd0, 10, 6, 0.12); floorRefl.rotation.x = -Math.PI / 2; floorRefl.position.set(0, 0.01, -6.5); scene.add(floorRefl);
  // console rows with seated operators (crowd, near/mid meshes)
  const rows = []; const agents = [];
  for (let k = 0; k < 3; k++) { const z = -6.2 + k * 2.4; const cr = PR.consoleRow({ seats: 5, pitch: 1.4 }); cr.group.position.set(0, 0, z); scene.add(cr.group); rows.push(cr);
    cr.monitors.forEach((m, i) => m.draw(i + k * 3));
    for (let i = 0; i < 5; i++) if ((i + k) % 4 !== 1) agents.push({ pos: [(i - 2) * 1.4, z + 0.62], yaw: Math.PI, body: ['office', 'military', 'office_f', 'analyst'][(i + k) % 4], clip: (i + k) % 3 ? 'sit_type' : 'sit_idle', phase: i * 2.3 + k, rate: 1, scale: 1, tint: [0.35, 0.37, 0.4] });
    for (let i = 0; i < 5; i++) { const c = PR.chair(); c.position.set((i - 2) * 1.4, 0, z + 0.62); c.rotation.y = Math.PI; scene.add(c); } }
  const cr = await PE.crowd(scene, { renderer, agents, clips: ['sit_type', 'sit_idle'], impostors: false, lod: { nearPx: 380, midPx: 0, maxNear: 3, maxMid: 40 } });
  // the soldier: stands behind the last row, watching; at 55 % he raises an arm to point at the wall
  const sol = PE.person('military', { dress: { garments: { elvs_male_coveralls_1: { fabric: 'nylon', color: 0x5d6450 }, mindfront_tactical_vest_male: { fabric: 'canvas', color: 0x3a3e30, map: false }, mindfront_patrol_cap: { fabric: 'cotton', color: 0x4a5040, map: false } } } });
  sol.root.position.set(0.5, 0, 0.6); sol.root.rotation.y = Math.PI - 0.2; scene.add(sol.root);
  scene.add(new THREE.HemisphereLight(0x1c2a3a, 0x050505, 0.4));
  const warm = new THREE.DirectionalLight(0xffb070, 0.6); warm.position.set(4, 5, 6); scene.add(warm);
  await PR.ready();
  const rig = C.path([
    { pos: [-2.0, 1.3, 5.2], look: [2.2, 1.7, -9], mm: 32 },
    { pos: [-1.5, 1.32, 4.0], look: [2.3, 1.75, -9], mm: 32 },
  ], { duration: D, accel: 0.3, decel: 0.5, float: 0.01, seed: 8 });
  const target = v(-2.2, 2.6, -9); let lastWall = null; // he watches the left of the wall, where the red tracks are
  console.log('[scene] command freeze', JSON.stringify(PR.freeze(scene, { keep: [sol.root] })));
  return { scene, camera, crowd: cr, update(t, p) {
    const k = K.smooth(K.range(t, D * 0.5, D * 0.5 + 0.8)) * (1 - K.smooth(K.range(t, D - 1.0, D - 0.3)));
    sol.play('idle', t + 3).update(); sol.lookAt(target, 0.5 + 0.4 * k); sol.update();
    if (shot.params.dbg) { const sh = sol.worldPos('upperarm_r'), el = sol.worldPos('lowerarm_r'), ha = sol.worldPos('hand_r'); console.log('[scene] ik', k.toFixed(2), 'sh', sh.toArray().map(x => x.toFixed(2)), 'el', el.toArray().map(x => x.toFixed(2)), 'hand', ha.toArray().map(x => x.toFixed(2)), 'dirToT', target.clone().sub(sh).normalize().toArray().map(x => x.toFixed(2)), 'dirHand', ha.clone().sub(sh).normalize().toArray().map(x => x.toFixed(2))); }
    const tq = Math.floor(t * 8) / 8; if (tq !== lastWall) { lastWall = tq; for (const pn of panels) { wallScreen(pn.x, pn.c.width, pn.c.height, tq + pn.i * 3 + pn.j * 7); pn.tex.needsUpdate = true; } } // content is a pure function of tq: redraw only when it changes
    rig(camera, p, t); cr.update(t, camera);
  } };
}
