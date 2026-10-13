// The dispatch centre interior: a 2015 regional distribution control room (Wong Kar-wai fluorescent green).
// Fluorescent banks (area lights), operator consoles with 19" 5:4 LCDs running the DMS one-line, a mimic wall
// of the district grid, operators (engine/people) at their desks, the window wall with the snowy town behind.
// buildRoom() is shared with the cold-open oner (sets/orbit.js), where the camera flies in through the window.
//
//   control-room   params.mode:
//     'wide'      locked one-point perspective down the room to the mimic wall, a slow dolly in (Kubrick/Fincher)
//     'shoulder'  over the operator's shoulder onto his monitor: the cursor moves by itself (move / click cues)
//     'hand'      the operator's hand resting beside the mouse; it never moves. The screen behind, soft.
//     'dark'      the backup power dies: the tube banks flicker out one by one (at), then the screens (screensAt)
//     'profile'   the stoic operator against the glow of the wall, face in shadow
//   caption (e.g. 'RECONSTRUCTION'), target (breaker id), cityDark (the town outside already dark)
import * as THREE from 'three';
import * as PE from '/engine/people/index.js';
import * as LW from './lw.js';
import { lcdMaterial, hmiState } from './grid.js';
import { buildTown, buildCentre, CENTRE, NDIST } from './town.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL, FONT } = LW;

// room box in centre coordinates (see town.js CENTRE)
export const ROOM = { x0: -8, x1: 8, z0: -12.6, z1: -0.3, y0: CENTRE.floor, y1: CENTRE.floor + 3.2, rowA: -3.65, rowB: -7.1, hero: CENTRE.hero };
export const DESK_TOP = ROOM.y0 + 0.74;
export function heroSpots() {
  const x = ROOM.hero, z = ROOM.rowA;
  return { desk: [x, DESK_TOP, z], monitor: [x, DESK_TOP + 0.32, z - 0.24], mouse: [x + 0.36, DESK_TOP + 0.02, z + 0.17], hand: [x + 0.25, DESK_TOP + 0.035, z + 0.33], seat: [x, ROOM.y0, z + 0.98] };
}

// the mimic wall: the district one-line, nodes and lines; tripped nodes red
function drawMimic(g, w, h, st) {
  LW.reset(g); g.fillStyle = '#04080a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(93,255,158,.06)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  const r = LW.rng(77), N = 26, nodes = [];
  for (let i = 0; i < N; i++) nodes.push([80 + (i % 13) * (w - 160) / 12 + (r() - 0.5) * 50, 120 + Math.floor(i / 13) * 250 + (r() - 0.5) * 60]);
  const dead = st.dead ?? 0;
  g.lineWidth = 4;
  for (let i = 0; i < N; i++) for (const j of [i + 1, i + 13]) if (j < N && (j !== i + 1 || i % 13 !== 12)) {
    const off = hash(i, 'mimic') < dead || hash(j, 'mimic') < dead;
    g.strokeStyle = off ? '#26352e' : '#46e08a'; g.beginPath(); g.moveTo(...nodes[i]); g.lineTo(...nodes[j]); g.stroke(); }
  nodes.forEach(([x, y], i) => { const off = hash(i, 'mimic') < dead; g.fillStyle = off ? '#ff2b1f' : '#46e08a'; g.fillRect(x - 12, y - 12, 24, 24);
    g.fillStyle = '#9fb1c0'; g.font = `20px ${FONT.mono}`; g.fillText(`PS-${String(i + 1).padStart(2, '0')}`, x + 16, y - 14); });
  g.fillStyle = '#9fb1c0'; g.font = `28px ${FONT.ui}`; g.fillText('REGIONAL DISTRIBUTION NETWORK · 110/35/10 kV', 30, 44);
}

// a second-screen: trends and an alarm summary (static, cheap)
function drawTrend(g, w, h, seed) {
  LW.reset(g); g.fillStyle = '#060a0d'; g.fillRect(0, 0, w, h); g.fillStyle = '#20262c'; g.fillRect(0, 0, w, 26);
  g.fillStyle = '#9fb1c0'; g.font = `15px ${FONT.ui}`; g.fillText('TRENDS · LOAD MW', 10, 18);
  const r = LW.rng(seed); g.strokeStyle = '#46e08a'; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i <= 60; i++) { const v = 0.55 + 0.2 * Math.sin(i * 0.2 + seed) + 0.05 * r(); g.lineTo(20 + i * (w - 40) / 60, 60 + (1 - v) * (h * 0.5)); } g.stroke();
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 ? '#5c6a70' : '#7fae92'; g.font = `14px ${FONT.mono}`; g.fillText(`15:${String(10 + i * 2).padStart(2, '0')}:0${i}  FEEDER ${i + 3}  ${(150 + r() * 90).toFixed(0)} A`, 16, h * 0.62 + i * 18); }
}

export async function buildRoom(scene, ctx, opts = {}) {
  await PE.preload({ wardrobe: ['analyst', 'office', 'office_f'] });
  const g = new THREE.Group(); scene.add(g);
  const R = ROOM, W = R.x1 - R.x0, Dp = R.z1 - R.z0, Hh = R.y1 - R.y0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
  const nz = LW.noiseCanvas(256, 256, 3, { scale: 10, lo: 205, hi: 255 }), nt = new THREE.CanvasTexture(nz); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(10, 4); nt.colorSpace = THREE.SRGBColorSpace;
  const wallM = new THREE.MeshStandardMaterial({ color: 0x55665a, roughness: 0.92, map: nt });
  const floorM = new THREE.MeshStandardMaterial({ color: 0x2a332e, roughness: 0.42, map: nt });
  const ceilM = new THREE.MeshStandardMaterial({ color: 0x6d776f, roughness: 0.95 });
  const plane = (w, h, mat, pos, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(...pos); m.rotation.set(...rot); m.receiveShadow = true; g.add(m); return m; };
  plane(W, Dp, floorM, [cx, R.y0 + 0.002, cz], [-Math.PI / 2, 0, 0]);
  plane(W, Dp, ceilM, [cx, R.y1, cz], [Math.PI / 2, 0, 0]);
  plane(W, Hh, wallM, [cx, R.y0 + Hh / 2, R.z0], [0, 0, 0]);
  plane(Dp, Hh, wallM, [R.x0, R.y0 + Hh / 2, cz], [0, Math.PI / 2, 0]);
  plane(Dp, Hh, wallM, [R.x1, R.y0 + Hh / 2, cz], [0, -Math.PI / 2, 0]);
  // ceiling grid lines and the fluorescent fixtures (emissive diffusers) in 4 banks (rows)
  const banks = [-2.0, -4.9, -7.8, -10.7].map((z, bi) => {
    const fixtures = [-5, -1.6, 1.8, 5.2].map((x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.05, 0.32), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.fluoro) })); m.position.set(x, R.y1 - 0.03, z); g.add(m); return m; });
    // two point lights per bank stand in for the tubes (area lights cost too much on CPU)
    const L = [-3.3, 3.5].map(x => { const l = new THREE.PointLight(0xd4ffe0, 0, 10, 1.6); l.position.set(x, R.y1 - 0.35, z); g.add(l); return l; });
    return { fixtures, L, z };
  });
  // mimic wall
  const mc = LW.canvas(2048, 640); drawMimic(mc.g, 2048, 640, { dead: 0 });
  const mt = new THREE.CanvasTexture(mc); mt.colorSpace = THREE.SRGBColorSpace;
  const mimicM = new THREE.MeshBasicMaterial({ map: mt, color: new THREE.Color(1.15, 1.15, 1.15) });
  const mimic = plane(11.5, 3.6, mimicM, [0, R.y0 + 1.75, R.z0 + 0.03], [0, 0, 0]);
  const mimicL = new THREE.PointLight(0x5dff9e, 1.2, 9, 1.5); mimicL.position.set(0, R.y0 + 1.6, R.z0 + 1.0); g.add(mimicL);
  // desks, monitors, chairs, operators
  const deskTop = new THREE.MeshStandardMaterial({ color: 0x3f443e, roughness: 0.5 }), deskBody = new THREE.MeshStandardMaterial({ color: 0x343a34, roughness: 0.7 });
  const shell = new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.45, metalness: 0.2 });
  const SW = 1280, SH = 1024; const hero = LW.canvas(SW, SH);
  const heroTex = new THREE.CanvasTexture(hero); heroTex.colorSpace = THREE.NoColorSpace; heroTex.generateMipmaps = true; heroTex.minFilter = THREE.LinearMipmapLinearFilter; heroTex.magFilter = THREE.NearestFilter;
  const heroM = lcdMaterial(heroTex, [SW, SH], { gain: 1.25 });
  const small = LW.canvas(640, 512); LW.drawHMI(small.g, 640, 512, { t: 3, cursor: { visible: false } });
  const smallT = new THREE.CanvasTexture(small); smallT.colorSpace = THREE.SRGBColorSpace;
  const trend = LW.canvas(640, 512); drawTrend(trend.g, 640, 512, 4); const trendT = new THREE.CanvasTexture(trend); trendT.colorSpace = THREE.SRGBColorSpace;
  const screenMats = [];
  const monitor = (x, y, z, yaw, mat) => { const m = new THREE.Group(); m.position.set(x, y, z); m.rotation.y = yaw;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.345, 0.05), shell); b.position.y = 0.32; m.add(b);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.03), shell); st.position.set(0, 0.1, 0.03); m.add(st);
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.18), shell); ft.position.set(0, 0.007, 0.03); m.add(ft);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.376, 0.301), mat); s.position.set(0, 0.32, 0.0255); m.add(s); g.add(m); return { group: m, screen: s }; };
  const desks = [];
  for (const [z, xs] of [[R.rowA, [-4.8, R.hero, 1.6, 4.8]], [R.rowB, [-4.8, -1.6, 1.6, 4.8]]]) for (const x of xs) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.8), deskTop); top.position.set(x, DESK_TOP - 0.02, z); top.receiveShadow = true; g.add(top);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.7, 0.04), deskBody); body.position.set(x, R.y0 + 0.35, z - 0.36); g.add(body);
    for (const sx of [-0.7, 0.7]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.76), deskBody); lg.position.set(x + sx, R.y0 + 0.35, z); g.add(lg); }
    const isHero = x === R.hero && z === R.rowA;
    const mats = isHero ? [heroM, new THREE.MeshBasicMaterial({ map: trendT, color: new THREE.Color(1.1, 1.1, 1.1) })] : [new THREE.MeshBasicMaterial({ map: smallT, color: new THREE.Color(1.1, 1.1, 1.1) }), new THREE.MeshBasicMaterial({ map: trendT, color: new THREE.Color(0.9, 0.9, 0.9) })];
    const m1 = monitor(x, DESK_TOP, z - 0.24, 0, mats[0]); const m2 = monitor(x - 0.43, DESK_TOP, z - 0.18, 0.32, mats[1]);
    screenMats.push(...mats.map((mm, i) => ({ mat: mm, hero: isHero && i === 0 })));
    // keyboard, mouse + pad, a phone, papers, a mug
    const kb = PE.props.keyboard(); kb.position.set(x - 0.02, DESK_TOP, z + 0.18); g.add(kb);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.003, 0.2), new THREE.MeshStandardMaterial({ color: 0x1a2024, roughness: 0.9 })); pad.position.set(x + 0.36, DESK_TOP + 0.0015, z + 0.2); g.add(pad);
    const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.35 })); mouse.scale.set(1, 0.55, 1.75); mouse.position.set(x + 0.36, DESK_TOP + 0.016, z + 0.17); g.add(mouse);
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.22), new THREE.MeshStandardMaterial({ color: 0xc8c4b8, roughness: 0.5 })); ph.position.set(x + 0.6, DESK_TOP + 0.03, z - 0.05); ph.rotation.y = -0.3; g.add(ph);
    for (let k = 0; k < 3; k++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.003, 0.297), new THREE.MeshStandardMaterial({ color: 0xe6e4dc, roughness: 0.9 })); pp.position.set(x - 0.5 + k * 0.01, DESK_TOP + 0.002 + k * 0.003, z + 0.12); pp.rotation.y = 0.15 - k * 0.1; g.add(pp); }
    if (hash(x, z) > 0.4) { const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.1, 18), new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.4 })); mug.position.set(x - 0.62, DESK_TOP + 0.05, z - 0.1); g.add(mug); }
    desks.push({ x, z, isHero, m1, m2 });
  }
  // monitor spill on the hero (and a dim one per desk row)
  const spill = new THREE.SpotLight(0xbfe6ff, 2.2, 3.2, 1.1, 0.9, 1.5); spill.position.set(R.hero, DESK_TOP + 0.35, R.rowA - 0.15); spill.target.position.set(R.hero, DESK_TOP + 0.3, R.rowA + 1.2); g.add(spill, spill.target);
  const spillB = new THREE.PointLight(0x9fd8c0, 1.4, 6, 1.8); spillB.position.set(0, DESK_TOP + 0.4, R.rowB + 0.2); g.add(spillB);
  const hemi = new THREE.HemisphereLight(0x52705e, 0x0a0e0b, 0.12); g.add(hemi);
  // operators
  const ops = [];
  const mk = (id, x, z, dress, seed) => { const p = PE.person(id, { dress }); p.root.position.set(x, R.y0, z + 0.98); p.root.rotation.y = Math.PI; g.add(p.root);
    const ch = PE.props.chair(); ch.position.set(x, R.y0, z + 0.95); ch.rotation.y = 0; g.add(ch); ops.push({ p, x, z, seed, chair: ch }); return p; };
  const heroP = mk('analyst', R.hero, R.rowA, { garments: { toigo_fisherman_sweater: { fabric: 'wool', color: 0x2e3430, map: false }, elvs_male_trouser: { fabric: 'wool', tint: 0.6 } }, skin: { tone: 0.85 }, hair: { color: 0x2a2420 } }, 1);
  if (opts.crew !== false) { mk('office', 4.8, R.rowA, {}, 2); mk('office_f', -1.6, R.rowB, {}, 3); mk('office', 4.8, R.rowB, {}, 4); }
  // seat each chair under its sitter's pelvis
  for (const o of ops) { o.p.play('sit_idle', 0).update(); const hp = o.p.worldPos('pelvis'); o.chair.position.set(hp.x, R.y0 - 0.04, hp.z + 0.08); }
  await PE.props.ready();
  const H = heroSpots();
  const handL = new THREE.Vector3(R.hero - 0.16, DESK_TOP + 0.035, R.rowA + 0.26), handR = new THREE.Vector3(...H.hand), screenP = new THREE.Vector3(...H.monitor);
  let lastDead = -1;
  return { group: g, banks, desks, ops, heroP, heroTex, heroM, hero, mimicM, mimicL, spill, spillB, hemi, SW, SH, screenMats,
    // state: { t, banks: [4] 0..1, screens: 0..1, hmi: drawHMI state, mimicDead: 0..1, still: true (hero hand still) }
    update(t, st = {}) {
      const bk = st.banks ?? [1, 1, 1, 1];
      banks.forEach((b, i) => { const v = clamp(bk[i]) * LW.tube(t, i); for (const l of b.L) l.intensity = 15 * v; for (const f of b.fixtures) f.material.color.set(PAL.fluoro).multiplyScalar(0.03 + 1.6 * v); });
      const sc = st.screens ?? 1;
      for (const s of screenMats) { if (s.hero) s.mat.uniforms.uPower.value = sc; else s.mat.color.setScalar(1.1 * sc); }
      mimicM.color.setScalar(1.15 * sc); mimicL.intensity = 22 * sc; spill.intensity = 7 * sc; spillB.intensity = 9 * sc;
      hemi.intensity = 0.02 + 0.12 * Math.max(...bk.map(v => clamp(v)));
      if (st.hmi) { LW.drawHMI(hero.g, SW, SH, st.hmi); heroTex.needsUpdate = true; }
      const dead = Math.round((st.mimicDead ?? 0) * 26) / 26; if (dead !== lastDead) { drawMimic(mc.g, 2048, 640, { dead }); mt.needsUpdate = true; lastDead = dead; }
      // operators: the hero sits still, hand beside the mouse, eyes on the screen; the others work
      for (const o of ops) {
        if (o.p === heroP) {
          o.p.play('sit_idle', 2).offset({ spine_01: [0.06, 0, 0], spine_02: [0.05, 0, 0] }); o.p.update();
          const pole = (s) => o.p.worldPos(`lowerarm_${s}`).add(new THREE.Vector3(s === 'l' ? -0.3 : 0.3, -0.45, 0.1));
          o.p.reach('r', handR, 1, pole('r')); o.p.reach('l', handL, 1, pole('l'));
          o.p.lookAt(screenP, 0.9); // stock-still: the stoic operator (CG idle/typing loops read as fake)
        } else { o.p.play('sit_idle', 1 + o.seed * 1.3).update(); o.p.lookAt(new THREE.Vector3(o.x, DESK_TOP + 0.32, o.z - 0.24), 0.8); }
      }
    } };
}

export default function makeRooms(H) {
  const C = H.C;
  // ---------------------------------------------------------------- control-room
  async function controlRoom(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'wide', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 40, near: 0.03, far: 6000 });
    scene.background = new THREE.Color(0x02040a); scene.fog = new THREE.FogExp2(0x0b1a2a, 0.0004);
    const town = buildTown(scene, { radius: 1400, poleRadius: 300 });
    const centre = buildCentre(scene);
    const room = await buildRoom(scene, ctx);
    const sn = LW.snow({ count: 3500, box: [36, 16, 28], center: [0, 8, 14], size: 0.03, speed: 1.0, seed: 4, base: 0.05 });
    scene.add(sn.points);
    // a street lamp outside the window row lights the snow
    sn.light(0, [4, 9, 12], [0, -1, -0.2], 0.55, 22, [1, 0.62, 0.3]);
    const cap = P.caption ? H.caption(layer, P.caption, P.captionPos ?? 'left:5.5%;top:7.5%') : null;
    const src = P.source ? H.sourceLine(layer, P.source) : null;
    const tMove = H.cue(shot, P.move, 1.0), tClick = H.cue(shot, P.click, Math.min(D - 1.5, tMove + 3.4));
    const tDark = H.cue(shot, P.at, mode === 'dark' ? 1.4 : Infinity), tScr = H.cue(shot, P.screensAt, tDark + 2.4);
    const R = ROOM, S = heroSpots();
    const shots = {
      wide: [{ pos: [0, R.y0 + 1.62, R.z1 - 0.4], look: [0, R.y0 + 1.5, R.z0], mm: 24 }, { pos: [0, R.y0 + 1.6, R.z1 - 1.3], look: [0, R.y0 + 1.5, R.z0], mm: 24 }],
      dark: [{ pos: [3.6, R.y0 + 1.75, R.z1 - 0.45], look: [-1.2, R.y0 + 1.2, R.z0 + 3], mm: 22 }, { pos: [3.45, R.y0 + 1.74, R.z1 - 0.7], look: [-1.2, R.y0 + 1.2, R.z0 + 3], mm: 22 }],
      shoulder: [{ pos: [S.desk[0] + 0.42, R.y0 + 1.42, S.desk[2] + 1.45], look: [S.monitor[0] - 0.02, S.monitor[1] - 0.02, S.monitor[2]], mm: 40 }, { pos: [S.desk[0] + 0.3, R.y0 + 1.36, S.desk[2] + 1.1], look: [S.monitor[0], S.monitor[1] - 0.02, S.monitor[2]], mm: 45 }],
      // top-down macro on the untouched mouse; the hand stays out of frame (CG hands read as fake)
      hand: [{ pos: [S.mouse[0] + 0.04, S.mouse[1] + 0.40, S.mouse[2] + 0.05], look: [S.mouse[0] + 0.04, S.mouse[1], S.mouse[2] - 0.01], mm: 50 }, { pos: [S.mouse[0] + 0.04, S.mouse[1] + 0.34, S.mouse[2] + 0.04], look: [S.mouse[0] + 0.04, S.mouse[1], S.mouse[2] - 0.01], mm: 50 }],
      profile: [{ pos: [S.desk[0] + 2.3, R.y0 + 1.25, S.desk[2] + 0.95], look: [S.desk[0], R.y0 + 1.22, S.desk[2] + 0.95], mm: 65 }, { pos: [S.desk[0] + 2.2, R.y0 + 1.25, S.desk[2] + 0.85], look: [S.desk[0], R.y0 + 1.22, S.desk[2] + 0.95], mm: 70 }],
      window: [{ pos: [-5.5, R.y0 + 1.6, R.rowB + 1.4], look: [-1, R.y0 + 1.5, R.z1 + 5], mm: 28 }, { pos: [-5.2, R.y0 + 1.6, R.rowB + 1.0], look: [-1, R.y0 + 1.5, R.z1 + 5], mm: 28 }],
    };
    if (mode === 'profile') { room.update(0, {}); const hd = room.heroP.worldPos('head');
      shots.profile = [{ pos: [hd.x + 1.7, hd.y + 0.02, hd.z - 0.5], look: [hd.x, hd.y - 0.04, hd.z - 0.12], mm: 75 }, { pos: [hd.x + 1.6, hd.y + 0.0, hd.z - 0.42], look: [hd.x, hd.y - 0.04, hd.z - 0.12], mm: 80 }]; }
    scene.fog = new THREE.FogExp2(0x08120d, mode === 'window' ? 0.004 : 0.022);
    const rig = C.path(shots[mode] ?? shots.wide, { duration: D, accel: 0.35, decel: 0.5, float: 0.004, seed: 5 });
    const cityK = P.cityDark ? 0 : 1;
    return { scene, camera, layer,
      async update(t, p) {
        rig(camera, p, t);
        let banks = [1, 1, 1, 1], screens = 1;
        if (mode === 'dark') { banks = [0, 1, 2, 3].map(i => LW.flickerOut(range(t, tDark + i * 0.7, tDark + i * 0.7 + 0.9), i + 7)); screens = 1 - range(t, tScr, tScr + 0.25) * (Math.floor((t - tScr) * 20) % 3 ? 1 : 0.7); if (t > tScr + 0.25) screens = 0; }
        const hmi = hmiState(t, { W: room.SW, H: room.SH, target: P.target ?? 'Q13', tMove, tClick, mode: mode === 'shoulder' || mode === 'hand' ? (P.cursor ?? 'click') : 'still' });
        room.update(t, { banks, screens, hmi, mimicDead: mode === 'dark' ? 0.4 : (hmi.opened ? 0.08 : 0) });
        town.update(t, { pow: (d) => cityK * (mode === 'dark' && d > 0 ? 1 - range(t, tDark - 1 + d * 0.15, tDark + d * 0.15) : 1), camera, height: ctx.height });
        sn.update(t, camera, ctx.height);
        cap?.type(t);
      },
      dispose() {} };
  }
  return { 'control-room': controlRoom };
}
