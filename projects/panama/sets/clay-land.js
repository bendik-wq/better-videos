// PANAMA clay sets, land: section, french-cut, valley-flood, culebra, rio-indio. Parameters: projects/panama/SETS.md.
// All are cut-away diorama blocks (Primal Space) on the pale void: layered earth sides, turquoise water with a cut face,
// white-clay structures, one red accent at most. Distances are schematic (labelled where it matters); levels are real
// and exaggerated vertically (section: Gatun 3 steps to 85 ft, Pedro Miguel 1 step (31 ft), Miraflores 2 steps (54 ft)).
import * as THREE from 'three';
import * as CK from './clay-kit.js';

const { clamp, lerp, range, sstep, smoother, fbm, HOUSE, mat, BOX } = CK;
const FT = 0.3048;

export default function makeClayLand(H) {
  const { C, P, K } = H;
  const win = (shot, at, span, defAt, defSpan) => { const a = H.cue(shot, at, defAt), b = span ?? defSpan; return (t) => smoother(range(t, a, a + b)); };
  const post = (ctx, scene, camera, o = {}) => P.post(ctx, scene, camera, { ao: { radius: o.aoR ?? 6, intensity: o.aoI ?? 2.0, falloff: 1 }, tone: 'neutral', quality: o.q ?? 'medium' });
  const rig = (shot, keys, o = {}) => C.path(keys, { duration: shot.duration, float: 0, accel: 0.4, decel: 0.4, ...o });
  const scr = (v, cam) => K.toScreen(v, cam);
  const waterSide = (c = '#56b3b2', op = 1) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: 0.3, transparent: op < 1, opacity: op, depthWrite: op >= 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  function waterBox(wm, { x0, x1, z0, z1, y0, y1, side = null }) {
    const sd = side ?? waterSide(), m = new THREE.Mesh(BOX, [sd, sd, wm, sd, sd, sd]);
    m.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2); m.scale.set(x1 - x0, Math.max(0.05, y1 - y0), z1 - z0); m.receiveShadow = true;
    m.setTop = (y) => { m.scale.y = Math.max(0.05, y - y0); m.visible = y - y0 > 0.06; }; m.y0 = y0; return m;
  }
  const dioStage = (ctx, o) => { const b = H.base(ctx, { fog: false, bg: ['#cad9e6', '#eef2f4'], mapSize: 4096, fill: 0.55, ...o }); b.scene.add(CK.catcher(o.floor ?? -60, { opacity: 0.12 })); return b; };

  // ======================================================================== section: the isthmus, cut along the canal
  // x: Atlantic (-800) -> Pacific (+800), 1 unit ~ 50 m; levels exaggerated E x. Front face (z = 0) is the cut.
  async function section(ctx, shot) {
    const P0 = shot.params ?? {}, E = 2.4, madden = !!(P0.madden || P0.variant === 'madden');
    const { scene, camera, layer, sun } = dioStage(ctx, { target: [0, 0, -60], span: 900, az: P0.sunAz ?? 150, el: 44, floor: -90 });
    const Y = (m) => m * E, LAKE = Y(26), PM = Y(54 * FT), MF1 = Y(27 * FT);
    const steps = { gatun: [-560, -470], pedro: [228, 252], mira: [318, 372] };
    // the water surface along x (real levels, exaggerated); ships ride it
    const level = (x) => {
      if (x < steps.gatun[0]) return 0;
      if (x < steps.gatun[1]) { const k = (x - steps.gatun[0]) / 30; return Y([0, 28, 57, 85][Math.min(3, Math.floor(k) + 1)] * FT) * 0 + Y(lerp(0, 85, clamp(Math.floor(k + 1) / 3)) * FT); }
      if (x < steps.pedro[0]) return LAKE;
      if (x < steps.pedro[1]) return PM;
      if (x < steps.mira[0]) return PM;
      if (x < steps.mira[1]) return x < (steps.mira[0] + steps.mira[1]) / 2 ? MF1 : 0;
      return 0;
    };
    // terrain behind the cut: hills, the lake basin, the continental divide at Culebra, a channel along z in [-36, 0]
    const hgt = (x, z) => {
      const hills = 70 + 70 * fbm(x / 160, z / 160, 4, 4) + 60 * Math.exp(-(((x - 160) / 90) ** 2));          // the divide near Culebra
      let h = hills;
      const coastA = -585 + 30 * Math.sin(z / 40), coastP = 395 + 25 * Math.sin(z / 50);
      if (x < coastA) h = lerp(-30, 4, sstep(coastA - 60, coastA, x));
      if (x > coastP) h = lerp(4, -30, sstep(coastP, coastP + 60, x));
      // the lake basin: below lake level between Gatun and Gamboa, with islands
      const inLake = sstep(-480, -440, x) * (1 - sstep(60, 110, x)) * sstep(-158, -128, z);
      const isl = sstep(0.62, 0.8, fbm(x / 70, z / 70, 9, 3));
      h = lerp(h, LAKE - 16 + 26 * isl, inLake * (1 - 0.0));
      // Miraflores Lake (small, between the two Pacific flights)
      const inML = sstep(250, 262, x) * (1 - sstep(306, 318, x)) * sstep(-95, -65, z);
      h = lerp(h, PM - 10, inML);
      // the channel (Culebra Cut through the divide, approaches, lock footprints)
      if (z > -38) h = Math.min(h, level(x) - (x > -590 && x < 400 ? 12 : 30));
      if (madden) { const inM = Math.exp(-(((x - 140) / 70) ** 2 + ((z + 120) / 30) ** 2)); h = lerp(h, Math.max(h, 150), clamp(inM * 3)); }
      return h;
    };
    const blk = CK.terrain({ w: 1600, d: 170, nx: 320, nz: 40, cx: 0, cz: -85, height: hgt, base: -70, sides: true,
      color: (x, z, y) => (y < 4 && (x < -560 || x > 380) ? '#ead9b5' : y < LAKE + 2 && x > -480 && x < 100 && z < -36 ? '#cfc39f' : y > 150 ? '#a9c98e' : fbm(x / 60, z / 60, 2, 2) > 0.5 ? '#86b673' : '#9cc483'),
      strata: [[3, '#a4b37e'], [16, HOUSE.strata[0]], [30, HOUSE.strata[1]], [50, HOUSE.strata[2]], [1e9, HOUSE.strata[3]]] });
    scene.add(blk);
    scene.add(CK.trees(CK.scatter(900, { x0: -580, x1: 390, z0: -168, z1: -40, height: hgt, ok: (x, z, y) => y > LAKE + 4, seed: 7, s: [5, 9] })));
    // water: seas, lock chambers, the lake, the cut, Miraflores Lake: boxes with a turquoise cut face
    const wm = CK.water({ scale: 14, strength: 0.3 }), boxes = [];
    const add = (x0, x1, z0, z1, y0, y1) => { const b = waterBox(wm, { x0, x1, z0, z1: z1 === 0 ? 0.4 : z1, y0, y1 }); scene.add(b); boxes.push(b); return b; };
    add(-800, -560, -170, 0, -30, 0); add(372, 800, -170, 0, -30, 0);
    for (let i = 0; i < 3; i++) add(-560 + i * 30, -560 + (i + 1) * 30 - 2, -36, 0, -10, Y([28, 57, 85][i] * FT));
    const lake = add(-470, 228, -170, 0, LAKE - 30, LAKE);
    add(228, 252, -36, 0, PM - 12, PM); const ml = add(252, 318, -100, 0, PM - 14, PM);
    add(318, 344, -36, 0, MF1 - 12, MF1);
    // lock walls (white clay) at each step, gates as thin slabs
    const walls = [];
    for (const [a, b, n] of [[-560, -470, 3], [228, 252, 1], [318, 372, 2]]) { const w = (b - a) / n;
      for (let i = 0; i <= n; i++) walls.push({ x: a + i * w, y: -12, z: -18, sx: 2.2, sy: (i < n ? level(a + i * w + 1) : level(a + i * w - 1)) + 6 + 12, sz: 36, c: '#d6dcde' });
      walls.push({ x: (a + b) / 2, y: -12, z: -37, sx: b - a, sy: Math.max(level(a + 1), level(b - 1)) + 18, sz: 2.5, c: '#f2f0ea' }); }
    scene.add(CK.instanced(BOX, mat('#ffffff', 0.7), walls));
    // the Gatun Dam (earth, behind the Atlantic flight) and, in the madden variant, Madden Dam and Lake Alhajuela upriver
    const dam = new THREE.Mesh(new THREE.CylinderGeometry(14, 30, 1, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 3.2), mat('#c9d9a6', 0.95)); dam.scale.y = LAKE + 8; dam.position.set(-480, (LAKE + 8) / 2 - 2, -120); dam.castShadow = dam.receiveShadow = true; scene.add(dam);
    let alh = null, river = null;
    if (madden) {
      const ALH = Y(76), wm2 = CK.water({ scale: 12 });
      alh = waterBox(wm2, { x0: 95, x1: 190, z0: -150, z1: -95, y0: ALH - 20, y1: ALH }); scene.add(alh);
      const md = new THREE.Mesh(BOX, mat('#eeece6', 0.8)); md.scale.set(4, ALH + 6 - 40, 60); md.position.set(92, 40, -122); md.castShadow = true; scene.add(md);
      river = CK.arrows([[90, ALH - 2, -122], [70, ALH * 0.6, -110], [55, LAKE + 6, -90], [40, LAKE + 1, -60]], { count: 7, size: 6, speed: 30, color: '#ffffff' }); scene.add(river);
    }
    // ships climbing: three ships moving along the canal, riding the level
    const ships = [0, 1, 2].map(i => { const s = CK.ship(['lpg', 'container', 'bulk'][i], { seed: i + 2, accent: null }); s.scale.setScalar(0.085); scene.add(s); return s; });
    // flow out: arrows down the steps into both seas
    const outA = CK.arrows([[-475, LAKE + 1, -18], [-545, Y(28 * FT) + 1, -18], [-600, 1, -18], [-700, 1, -40]], { count: 9, size: 7, speed: 40 });
    const outP = CK.arrows([[230, LAKE + 1, -18], [320, PM + 1, -18], [372, 1, -18], [480, 1, -40]], { count: 9, size: 7, speed: 40 });
    scene.add(outA, outP);
    // rain over the watershed
    const rainFx = CK.rain({ box: [-460, 220, 0, 230, -170, -5], count: 3500, speed: 160, len: 9, color: '#e9f1f8', opacity: 0.7, seed: 3, wind: [6, 0] }); scene.add(rainFx);
    const cloud = CK.instanced(new THREE.IcosahedronGeometry(1, 2), mat('#ffffff', 0.95), [...Array(9)].map((_, i) => ({ x: -420 + i * 75 + 20 * Math.sin(i * 3), y: 240 + 10 * Math.sin(i), z: -95 + 25 * Math.cos(i * 2), sx: 46, sy: 22, sz: 36 })), { receive: false }); scene.add(cloud);
    // ---- timing
    const kDrop = win(shot, P0.dropAt ?? P0.at, P0.dropSpan ?? P0.span, 1.0, 4), kRain = win(shot, P0.rainAt ?? P0.at, P0.rainSpan ?? P0.span, 0.8, 3);
    const drop = Y((P0.drop ?? 6) * FT) * (P0.levelDrop ? 1 : 0), refill = P0.rain ? 1 : 0;
    // ---- camera
    const hl = P0.highlight ?? null, focus = { atlantic: -680, gatun: -515, lake: -200, culebra: 170, pedro: 240, miraflores: 345, pacific: 600 }[hl] ?? (madden ? 60 : 0);
    const wide = hl == null || P0.wide;
    const keys = wide
      ? [{ pos: [-120, 1050, 820], look: [focus * 0.4 - 20, 0, -90], mm: 28 }, { pos: [140, 1020, 840], look: [focus * 0.4 + 20, 0, -90], mm: 28 }]
      : [{ pos: [focus - 110, 190, 270], look: [focus, Y(18), -45], mm: 30 }, { pos: [focus + 50, 180, 265], look: [focus + 20, Y(18), -45], mm: 30 }];
    const cam = rig(shot, P0.camera ?? (madden ? [{ pos: [-160, 420, 420], look: [60, 50, -100], mm: 30 }, { pos: [-60, 400, 450], look: [90, 50, -100], mm: 30 }] : keys));
    const fx = post(ctx, scene, camera, { aoR: 6, aoI: 2.0 });
    // ---- labels
    const names = { atlantic: ['ATLANTIC', -690, 0], gatun: ['GATUN · 3 STEPS', -515, Y(85 * FT) + 8], lake: ['GATUN LAKE · 85 FT', -150, LAKE + 6], culebra: ['CULEBRA CUT', 165, LAKE + 30], pedro: ['PEDRO MIGUEL · 1 STEP', 240, LAKE + 10], miraflores: ['MIRAFLORES · 2 STEPS', 345, PM + 8], pacific: ['PACIFIC', 600, 0] };
    const pills = Object.entries(names).filter(([k]) => wide ? ['atlantic', 'lake', 'pacific'].includes(k) || k === hl : k === hl).map(([k, [txt, x, y]]) => ({ el: H.pill(layer, txt, { size: k === hl ? 30 : 24, dot: k === hl ? PAL_Y : null }), x, y, k }));
    if (madden) pills.push({ el: H.pill(layer, 'LAKE ALHAJUELA · 1935', { size: 26, dot: '#3fb2b7' }), x: 140, y: Y(76) + 6, z: -122 });
    const cap = H.caption(layer, P0.caption ?? null);
    const src = H.sourceLine(layer, P0.source ?? 'NOT TO SCALE · LEVELS: PANAMA CANAL AUTHORITY');
    const dropPill = P0.levelDrop ? H.pill(layer, `−${P0.drop ?? 6} FT`, { size: 30, bg: '#0b0b0b', color: '#fff' }) : null;
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t);
      // lake level: drop, then refill with rain
      const kd = kDrop(t), kr = kRain(t), lv = LAKE - drop * kd + (refill ? drop * kr : 0);
      lake.setTop(lv);
      rainFx.tick(t, P0.rain ? sstep(0, 1, kr * 4) : 0); cloud.visible = !!P0.rain;
      const flowOn = P0.flowOut ? 1 : 0; outA.tick(t, flowOn); outP.tick(t, flowOn); river?.tick(t, 1);
      // ships along the canal (pure in t): positions loop through the canal
      ships.forEach((s, i) => { const x = -700 + ((t * 26 + i * 520) % 1300); const lvl = x > -470 && x < 228 ? lv : level(x); s.position.set(x, lvl, -18); s.rotation.y = 0; s.visible = x < 760; });
      cap?.type(t);
      for (const L of pills) { const [x, y] = scr(v.set(L.x, L.y + (L.k === 'lake' ? lv - LAKE : 0), L.z ?? -18), camera); L.el.at(x, y - 6, sstep(0.3, 0.9, t)); }
      if (dropPill) { const [x, y] = scr(v.set(-60, lv, -10), camera); dropPill.at(x, y + 70, kd); }
    }, dispose() { fx.dispose(); } };
  }
  const PAL_Y = '#ffd23f';

  // ======================================================================== french-cut: the failed sea-level trench (1881-1889)
  async function frenchCut(ctx, shot) {
    const P0 = shot.params ?? {};
    const { scene, camera, layer } = dioStage(ctx, { target: [0, 0, 0], span: 340, az: 140, el: 42, floor: -70 });
    const trenchW = (x) => 22 + 8 * Math.sin(x / 40);
    const hgt = (x, z) => { const m = 40 + 80 * Math.exp(-((x / 120) ** 2)) + 28 * fbm(x / 60, z / 60, 3, 4); const tz = Math.abs(z), w = trenchW(x);
      return tz < w ? -6 : lerp(-6, m, sstep(w, w + 50, tz)); };
    const blk = CK.terrain({ w: 420, d: 300, nx: 168, nz: 120, height: hgt, base: -50, sides: true, color: (x, z, y, sl) => y < 2 ? '#d8c39a' : sl > 0.9 ? '#c7a77b' : fbm(x / 40, z / 40, 1, 2) > 0.55 ? '#86b673' : '#9cc483' });
    scene.add(blk);
    // the slides: clay wedges sliding down both banks into the trench
    const slideM = mat('#c7a77b', 0.95), slides = [];
    for (const [x, sd, w] of [[-60, 1, 46], [30, -1, 52], [95, 1, 40], [-130, -1, 38]]) {
      const g = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1, 1, 3, 1).rotateZ(sd * Math.PI / 2).scale(18, w * 0.5, w), slideM); g.castShadow = g.receiveShadow = true; scene.add(g);
      slides.push({ g, x, sd, w });
    }
    // flood water in the trench (muddy turquoise), rain
    const wm = CK.water({ color: '#7cb9a8', scale: 10 });
    const flood = waterBox(wm, { x0: -210, x1: 210, z0: -26, z1: 26, y0: -6, y1: -5.9, side: waterSide('#8cbfae', 0.8) }); scene.add(flood);
    const rainFx = CK.rain({ box: [-210, 210, -6, 160, -150, 150], count: 5000, speed: 110, len: 6, opacity: 0.6, seed: 9 }); scene.add(rainFx);
    // the planned sea level: a dashed line through the mountain at y = 0 (the plan that could not hold)
    const dash = [], seaY = 0; for (let x = -205; x < 205; x += 12) dash.push({ x, y: seaY, z: 0, sx: 7, sy: 0.8, sz: 0.8 });
    const dashM = new THREE.MeshBasicMaterial({ color: '#0f1e33', transparent: true, opacity: 0.9 }); const dashes = CK.instanced(BOX, dashM, dash, { cast: false, receive: false }); scene.add(dashes);
    // a few 1880s excavators (clay) in the trench
    const exc = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(BOX, mat('#f2f0ea', 0.7)); b.scale.set(9, 4, 5); g.add(b); const arm = new THREE.Mesh(BOX, mat('#d6dcde', 0.7)); arm.scale.set(12, 1, 1); arm.position.set(7, 4, 0); arm.rotation.z = 0.5; g.add(arm); g.position.set(-120 + i * 110, -6, (i - 1) * 6); g.children.forEach(c => { c.castShadow = true; }); scene.add(g); exc.push(g); }
    const kSlide = win(shot, P0.slideAt ?? P0.at, P0.slideSpan ?? P0.span, 1.0, Math.max(3, shot.duration * 0.45));
    const kRain = win(shot, P0.rainAt, P0.rainSpan, shot.duration * 0.45, 2), kFlood = win(shot, P0.floodAt, P0.floodSpan, shot.duration * 0.5, Math.max(3, shot.duration * 0.45));
    const cam = rig(shot, P0.camera ?? [{ pos: [-340, 200, 150], look: [30, -4, 0], mm: 32 }, { pos: [-300, 190, 190], look: [40, -4, 0], mm: 32 }]);
    const fx = post(ctx, scene, camera);
    const cap = H.caption(layer, P0.caption ?? 'THE FRENCH CANAL · 1881–1889');
    const sea = H.pill(layer, 'PLANNED: SEA LEVEL', { size: 24, bg: '#0b0b0b', color: '#fff' });
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t);
      const ks = kSlide(t), kf = kFlood(t), kr = kRain(t);
      for (const s of slides) { const w = trenchW(s.x), d = lerp(w + 60, w * 0.25, ks); s.g.position.set(s.x, lerp(46, 4, ks), s.sd * d); }
      flood.setTop(lerp(-5.9, 9, kf)); rainFx.tick(t, kr * (P0.rain === false ? 0 : 1));
      cap?.type(t);
      const [x, y] = scr(v.set(150, seaY, 0), camera); sea.at(x, y - 10, sstep(0.6, 1.2, t));
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== valley-flood: the Chagres valley drowns (1907-1913)
  async function valleyFlood(ctx, shot) {
    const P0 = shot.params ?? {};
    const { scene, camera, layer } = dioStage(ctx, { target: [0, 0, 0], span: 420, az: 135, el: 42, floor: -60 });
    const river = (x) => 25 * Math.sin(x / 70) + 12 * Math.sin(x / 23);
    const LAKEY = 34;
    const hills = [[-120, -80, 60, 55], [60, 90, 70, 60], [160, -60, 45, 50], [-40, 40, 36, 44], [-190, 110, 50, 48]]; // [x, z, r, h] (the third is Barro Colorado)
    const hgt = (x, z) => { let h = 6 + 10 * sstep(80, 230, Math.abs(z - river(x))) + 30 * sstep(150, 240, Math.abs(z)) + 8 * fbm(x / 50, z / 50, 6, 3);
      for (const [hx, hz, r, hh] of hills) h += hh * Math.exp(-(((x - hx) / r) ** 2 + ((z - hz) / r) ** 2));
      const d = Math.abs(z - river(x)); if (d < 10) h = lerp(0, h, sstep(4, 10, d));
      return h; };
    const blk = CK.terrain({ w: 520, d: 480, nx: 160, nz: 150, height: hgt, base: -40, sides: true, color: (x, z, y) => (y < 1.5 ? '#c7b48d' : y < 9 ? '#c6d79d' : fbm(x / 40, z / 40, 4, 2) > 0.55 ? '#86b673' : '#9cc483') });
    scene.add(blk);
    // the river, villages, the railroad
    const wm = CK.water({ scale: 10 });
    const rv = []; for (let x = -258; x < 258; x += 4) rv.push({ x, y: 0.4, z: river(x), sx: 4.6, sy: 0.4, sz: 9, ry: -Math.atan((river(x + 1) - river(x - 1)) / 2) });
    const riverMesh = CK.instanced(BOX, mat('#56b9b8', 0.3), rv, { cast: false }); scene.add(riverMesh);
    const vill = [['GORGONA', -150, 30], ['MATACHÍN', -10, -40], ['GAMBOA', 130, 25]];
    const houses = [], r = CK.rng(4);
    for (const [, vx, vz] of vill) for (let k = 0; k < 16; k++) { const x = vx + (r() - 0.5) * 50, z = vz + river(vx) + (r() - 0.5) * 40; if (Math.abs(z - river(x)) < 9) continue; houses.push({ x, y: hgt(x, z) - 0.3, z, w: 5 + r() * 3, d: 4 + r() * 3, h: 3 + r() * 2, ry: r() * 3 }); }
    const hs = CK.houses(houses); scene.add(hs);
    const rail = [], ties = []; for (let x = -255; x < 255; x += 2.5) { const z = river(x) + 20 + 6 * Math.sin(x / 50); rail.push({ x, y: hgt(x, z) + 0.3, z, sx: 2.6, sy: 0.35, sz: 1.6, ry: 0 }); if (Math.round(x / 2.5) % 2 === 0) ties.push({ x, y: hgt(x, z) + 0.15, z, sx: 0.6, sy: 0.3, sz: 3.2 }); }
    scene.add(CK.instanced(BOX, mat('#4a4f57', 0.6), rail, { cast: false }), CK.instanced(BOX, mat('#8a7a66', 0.9), ties, { cast: false }));
    // trees on the hills
    scene.add(CK.trees(CK.scatter(900, { x0: -255, x1: 255, z0: -235, z1: 235, height: hgt, ok: (x, z, y) => y > 10 && Math.abs(z - river(x)) > 14, seed: 6, s: [3, 6] })));
    // the dam at the downstream end (x = +260): it rises; then the lake rises over the valley
    const dam = new THREE.Mesh(BOX, mat('#c9d9a6', 0.95)); dam.scale.set(18, 1, 480); dam.position.set(250, 0, 0); dam.castShadow = dam.receiveShadow = true; scene.add(dam);
    const lake = waterBox(wm, { x0: -260, x1: 241, z0: -240, z1: 240, y0: -0.5, y1: 0 }); scene.add(lake);
    const kDam = win(shot, P0.damAt, P0.damSpan, 0.6, 1.6), kFlood = win(shot, P0.at, P0.span, 2.2, Math.max(4, shot.duration - 4));
    const cam = rig(shot, P0.camera ?? [{ pos: [-330, 250, 420], look: [0, 10, 0], mm: 32 }, { pos: [-250, 270, 470], look: [10, 10, 0], mm: 32 }]);
    const fx = post(ctx, scene, camera);
    const cap = H.caption(layer, P0.caption ?? 'THE CHAGRES VALLEY · 1907–1913');
    const pills = vill.map(([n, x, z]) => ({ el: H.pill(layer, n, { size: 24 }), x, z: z + river(x), y: 12 }));
    const rr = H.pill(layer, 'OLD PANAMA RAILROAD', { size: 22, bg: '#0b0b0b', color: '#fff' });
    const bc = H.pill(layer, 'BARRO COLORADO', { size: 28, dot: '#86b673' });
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t);
      const kd = kDam(t), kf = kFlood(t), ly = lerp(0.6, LAKEY, kf);
      dam.scale.y = lerp(1, LAKEY + 6, kd);
      lake.setTop(ly); riverMesh.visible = kf < 0.15;
      cap?.type(t);
      for (const L of pills) { const [x, y] = scr(v.set(L.x, Math.max(L.y, ly + 3), L.z), camera); L.el.at(x, y, sstep(0.3, 0.8, t) * (1 - sstep(0.25, 0.45, kf))); }
      { const [x, y] = scr(v.set(-80, hgt(-80, 0) + 3, river(-80) + 20), camera); rr.at(x, y, sstep(0.5, 1, t) * (1 - sstep(0.1, 0.3, kf))); }
      { const [x, y] = scr(v.set(160, hgt(160, -60) + 4, -60), camera); bc.at(x, y, sstep(0.75, 0.95, kf)); }
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== culebra: the cut, the slides, the dike, the blast
  async function culebra(ctx, shot) {
    const P0 = shot.params ?? {}, blast = P0.mode === 'blast';
    const { scene, camera, layer } = dioStage(ctx, { target: [0, 0, 0], span: 380, az: 130, el: 44, floor: -70 });
    // canyon along x; terraced (benched) slopes; floor at y = 0, width 60
    const half = 30, bench = 9, rise = 12;
    const hgt = (x, z) => { const d = Math.abs(z) - half; if (d < 0) return 0; const k = Math.floor(d / bench), f = (d % bench) / bench; return Math.min(110, k * rise + rise * sstep(0.55, 1, f)) + 8 * fbm(x / 40, z / 40, 2, 2) * sstep(0, 30, d); };
    const W2 = 460, D2 = 360;
    const blk = CK.terrain({ w: W2, d: D2, nx: 230, nz: 180, height: hgt, base: -40, sides: true, color: (x, z, y, sl) => (Math.abs(z) < half + 0.5 ? '#d7c39b' : sl > 0.6 ? '#c7a77b' : y > 80 ? '#93bd79' : '#d8c49a') });
    scene.add(blk);
    scene.add(CK.trees(CK.scatter(500, { x0: -225, x1: 225, z0: -175, z1: 175, height: hgt, ok: (x, z, y) => y > 95, seed: 2, s: [3, 6] })));
    // rails on the floor and on the benches, dirt trains, steam shovels
    const rails = []; for (const z of [-18, -6, 8, 20]) rails.push({ x: 0, y: 0.25, z, sx: W2, sy: 0.3, sz: 1.5 });
    for (const zz of [half + bench * 1.5, -(half + bench * 2.5)]) rails.push({ x: 0, y: hgt(0, zz) + 0.25, z: zz, sx: W2, sy: 0.3, sz: 1.5 });
    scene.add(CK.instanced(BOX, mat('#5b5f66', 0.6), rails, { cast: false }));
    const train = (n) => { const g = new THREE.Group(); const loco = new THREE.Mesh(BOX, mat('#33465c', 0.6)); loco.scale.set(9, 4, 3); g.add(loco);
      for (let i = 0; i < n; i++) { const car = new THREE.Mesh(BOX, mat('#e9e6df', 0.8)); car.scale.set(8, 1.6, 3.2); car.position.x = -10 - i * 9; g.add(car); const dirt = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6).scale(3.6, 1.4, 1.5), mat('#c7a77b', 0.95)); dirt.position.set(-10 - i * 9, 1.6, 0); g.add(dirt); }
      g.children.forEach(c => { c.castShadow = true; }); scene.add(g); return g; };
    const trains = [train(9), train(7)];
    const shovel = () => { const g = new THREE.Group(); const body = new THREE.Mesh(BOX, mat('#f2f0ea', 0.7)); body.scale.set(8, 6, 5); g.add(body);
      const boom = new THREE.Group(); boom.position.set(3, 6, 0); g.add(boom); const b = new THREE.Mesh(BOX, mat('#d6dcde', 0.6)); b.scale.set(14, 1, 1); b.position.x = 7; boom.add(b);
      const bucket = new THREE.Mesh(BOX, mat('#46536a', 0.6)); bucket.scale.set(2.4, 2.4, 2.4); bucket.position.x = 14; boom.add(bucket);
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4, 8), mat('#33465c', 0.6)); stack.position.set(-2.5, 8, 0); g.add(stack);
      g.boom = boom; g.children.forEach(c => { c.castShadow = true; }); scene.add(g); return g; };
    const shovels = [[-120, 12], [-30, -14], [70, 14], [150, -12]].map(([x, z]) => { const s = shovel(); s.position.set(x, 0, z); s.rotation.y = z > 0 ? -Math.PI / 2 : Math.PI / 2; return s; });
    // steam puffs (soft white spheres rising, pure in t)
    const puffs = CK.instanced(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.75 }), [...Array(24)].map(() => ({ x: 0, y: 0, z: 0 })), { cast: false }); scene.add(puffs);
    // the slide: a wedge of the north bank creeping into the cut (14 ft a day)
    const slide = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateY(Math.PI / 2).scale(70, 30, 34), mat('#c7a77b', 0.95)); slide.castShadow = slide.receiveShadow = true; scene.add(slide);
    // the Gamboa dike (blast mode): a thin earth wall at x = +150, the lake behind it, then the blast and the pour
    const dike = new THREE.Mesh(BOX, mat('#c9b48a', 0.95)); dike.scale.set(10, 26, half * 2 + 2); dike.position.set(150, 0, 0); dike.castShadow = dike.receiveShadow = true; scene.add(dike);
    const wm = CK.water({ scale: 10 }), lakeY = 22;
    const lakeBox = waterBox(wm, { x0: 155, x1: 230, z0: -half, z1: half, y0: 0, y1: lakeY }); scene.add(lakeBox);
    const pour = waterBox(wm, { x0: -230, x1: 155, z0: -half, z1: half, y0: 0, y1: 0.06 }); scene.add(pour);
    const debris = CK.instanced(new THREE.IcosahedronGeometry(1, 0), mat('#b08a62', 0.95), [...Array(60)].map(() => ({ x: 0, y: 0, z: 0 }))); scene.add(debris);
    const smoke = CK.instanced(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 1, transparent: true, opacity: 0.8 }), [...Array(30)].map(() => ({ x: 0, y: 0, z: 0 })), { cast: false }); scene.add(smoke);
    dike.visible = lakeBox.visible = pour.visible = debris.visible = smoke.visible = blast || P0.dike;
    const tB = H.cue(shot, P0.at, blast ? 2.0 : 999), kPour = win(shot, P0.at, P0.span ?? 4.5, tB + 0.4, 4.5);
    const kSlide = win(shot, P0.slideAt, P0.slideSpan, 0.5, shot.duration - 1);
    const cam = rig(shot, P0.camera ?? (blast ? [{ pos: [-190, 105, 40], look: [150, 8, 0], mm: 30 }, { pos: [-150, 98, 50], look: [150, 8, 0], mm: 30 }] : [{ pos: [-290, 230, 150], look: [0, 0, 0], mm: 30 }, { pos: [-230, 220, 190], look: [20, 0, 0], mm: 30 }]));
    const fx = post(ctx, scene, camera);
    const cap = H.caption(layer, P0.caption ?? (blast ? '10 OCTOBER 1913 · GAMBOA DIKE' : 'THE CULEBRA CUT · 1907–1913'));
    const slideP = blast ? null : H.pill(layer, 'SLIDE · 14 FT A DAY', { size: 26, bg: '#0b0b0b', color: '#fff' });
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t);
      trains[0].position.set(-230 + ((t * 9) % 460), 0.3, -18); trains[1].position.set(230 - ((t * 7 + 200) % 460), 0.3, 8); trains[1].rotation.y = Math.PI;
      shovels.forEach((s, i) => { s.boom.rotation.z = 0.25 + 0.3 * Math.sin(t * 1.3 + i * 1.7); });
      for (let i = 0; i < 24; i++) { const s = shovels[i % 4], u = ((t * 0.5 + i / 6) % 1); V3.set(s.position.x - 2.5 * Math.cos(s.rotation.y) + 3 * u, 10 + u * 22, s.position.z); S3.setScalar(1.2 + u * 4); M4.compose(V3, Q, S3); puffs.setMatrixAt(i, M4); }
      puffs.instanceMatrix.needsUpdate = true; puffs.material.opacity = 0.6;
      const ks = kSlide(t); slide.position.set(-90, lerp(40, 10, ks), lerp(half + 60, half + 8, ks));
      if (dike.visible) {
        const kb = range(t, tB, tB + 2.2), kp = kPour(t);
        dike.visible = t < tB + 0.15; lakeBox.setTop(lerp(lakeY, 15, kp));
        pour.scale.x = lerp(1, 385, kp); pour.position.x = 155 - pour.scale.x / 2; pour.setTop(t > tB ? lerp(0.1, 14, sstep(0, 0.6, kp)) : 0.06);
        debris.visible = smoke.visible = t > tB && kb < 1;
        for (let i = 0; i < 60; i++) { const a = CK.hash(i, 1) * 6.28, sp = 20 + 40 * CK.hash(i, 2), u = (t - tB); V3.set(150 + Math.cos(a) * sp * u * 0.6, 12 + sp * u - 4.9 * u * u * 6, Math.sin(a) * sp * u * 0.6); S3.setScalar(1 + 2 * CK.hash(i, 3)); M4.compose(V3, Q, S3); debris.setMatrixAt(i, M4); }
        debris.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 30; i++) { const a = CK.hash(i, 5) * 6.28, u = clamp((t - tB) / 2.2); V3.set(150 + Math.cos(a) * 30 * u, 10 + 50 * u * CK.hash(i, 6), Math.sin(a) * 30 * u); S3.setScalar((6 + 10 * CK.hash(i, 7)) * Math.sin(Math.PI * clamp(u * 1.1))); M4.compose(V3, Q, S3.x > 0.01 ? S3 : S3.setScalar(0.01)); smoke.setMatrixAt(i, M4); }
        smoke.instanceMatrix.needsUpdate = true;
      }
      cap?.type(t);
      if (slideP) { const [x, y] = scr(v.set(-90, slide.position.y + 16, slide.position.z), camera); slideP.at(x, y, sstep(0.5, 1, t)); }
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== rio-indio: the planned reservoir west of Gatun
  async function rioIndio(ctx, shot) {
    const P0 = shot.params ?? {};
    const { scene, camera, layer } = dioStage(ctx, { target: [0, 0, 0], span: 420, az: 140, el: 42, floor: -70 });
    const river = (x) => 30 * Math.sin(x / 60 + 1) + 10 * Math.sin(x / 19);
    const FUT = 26;   // the future lake's level (schematic)
    const hgt = (x, z) => { const d = Math.abs(z - river(x)); let h = 4 + 34 * sstep(20, 170, d) + 22 * fbm(x / 60, z / 60, 3, 4) * sstep(10, 60, d);
      if (x > 175) h = Math.min(h, lerp(h, 2, sstep(175, 205, x)));                                             // Gatun Lake at the east end
      if (d < 7) h = lerp(0, h, sstep(3, 7, d)); return h; };
    const blk = CK.terrain({ w: 520, d: 440, nx: 170, nz: 150, height: hgt, base: -50, sides: true, color: (x, z, y) => (y < 1.2 ? '#c7b48d' : x > 200 ? '#cfc39f' : fbm(x / 40, z / 40, 4, 2) > 0.55 ? '#86b673' : '#9cc483') });
    scene.add(blk);
    const wm = CK.water({ scale: 10 });
    const gatun = waterBox(wm, { x0: 200, x1: 260, z0: -220, z1: 220, y0: -8, y1: 6 }); scene.add(gatun);
    const rv = []; for (let x = -258; x < 200; x += 4) rv.push({ x, y: 0.4, z: river(x), sx: 4.6, sy: 0.4, sz: 7, ry: -Math.atan((river(x + 1) - river(x - 1)) / 2) });
    scene.add(CK.instanced(BOX, mat('#56b9b8', 0.3), rv, { cast: false }));
    const r = CK.rng(12), houses = [];
    for (const [vx, vz] of [[-150, 30], [-40, -50], [60, 40]]) for (let k = 0; k < 12; k++) { const x = vx + (r() - 0.5) * 40, z = vz + river(vx) + (r() - 0.5) * 30; if (Math.abs(z - river(x)) < 8) continue; houses.push({ x, y: hgt(x, z) - 0.3, z, w: 4 + r() * 3, d: 4 + r() * 2, h: 3 + r() * 1.5, ry: r() * 3 }); }
    scene.add(CK.houses(houses, { seed: 8 }));
    scene.add(CK.trees(CK.scatter(1100, { x0: -255, x1: 195, z0: -215, z1: 215, height: hgt, ok: (x, z, y) => y > 6, seed: 3, s: [3, 6] })));
    // the future lake: a ghosted water volume rising to FUT, its shoreline as a dashed outline (marching squares on FUT)
    const ghost = new THREE.Mesh(BOX, [waterSide('#8fd3d0', 0.35), waterSide('#8fd3d0', 0.35), new THREE.MeshStandardMaterial({ color: '#7fd0cf', roughness: 0.2, transparent: true, opacity: 0.5, depthWrite: false }), waterSide('#8fd3d0', 0.35), waterSide('#8fd3d0', 0.35), waterSide('#8fd3d0', 0.35)]);
    ghost.position.set(-30, 0, 0); ghost.scale.set(450, 0.1, 440); scene.add(ghost);
    const dashPts = []; for (let x = -255; x < 180; x += 3) for (let z = -215; z < 215; z += 3) { const a = hgt(x, z) - FUT, b = hgt(x + 3, z) - FUT, c = hgt(x, z + 3) - FUT; if (a * b < 0 || a * c < 0) if ((Math.floor(x / 3) + Math.floor(z / 3)) % 3 !== 0) dashPts.push({ x, y: FUT + 0.6, z, sx: 2.2, sy: 0.6, sz: 2.2 }); }
    const outline = CK.instanced(BOX, new THREE.MeshBasicMaterial({ color: '#ffffff' }), dashPts, { cast: false, receive: false }); scene.add(outline);
    // the main dam (white clay) at the valley's downstream end, the 9 km tunnel (x-ray) to Gatun Lake
    const dam = new THREE.Mesh(BOX, mat('#f2f0ea', 0.8)); dam.scale.set(10, FUT + 6, 70); dam.position.set(150, 0, river(150)); dam.castShadow = true; scene.add(dam);
    const tunnelPts = [[100, -14, river(100) - 50], [150, -18, -60], [220, -10, -40]];
    const tunnel = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tunnelPts.map(p => new THREE.Vector3(...p))), 60, 3, 12), new THREE.MeshStandardMaterial({ color: '#7fd3ff', emissive: '#3fb8ff', emissiveIntensity: 0.35, roughness: 0.4 })); scene.add(tunnel);
    const flow = CK.arrows(tunnelPts.map(p => [p[0], p[1] + 3.5, p[2]]), { count: 8, size: 4, speed: 22 }); scene.add(flow);
    const kFill = win(shot, P0.at, P0.span, 1.2, Math.max(3, shot.duration - 3));
    const fillOn = P0.fill !== false;
    const cam = rig(shot, P0.camera ?? [{ pos: [-340, 250, 380], look: [0, 0, 0], mm: 32 }, { pos: [-260, 240, 430], look: [15, 0, 0], mm: 32 }]);
    const fx = post(ctx, scene, camera);
    const plan = H.slab(layer, P0.label ?? 'PLANNED · CONSTRUCTION FROM 2028', 'left:5.5%;top:7.5%', { size: 40 });
    const pills = [['RÍO INDIO', -120, 6, river(-120)], ['9 KM TUNNEL', 160, 4, -60], ['GATUN LAKE', 230, 8, 120]].map(([n, x, y, z]) => ({ el: H.pill(layer, n, { size: 26, dot: n === '9 KM TUNNEL' ? '#3fb8ff' : '#3fb2b7' }), x, y, z }));
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t); wm.tick(t); flow.tick(t, 1);
      const kf = fillOn ? kFill(t) : 0; ghost.scale.y = Math.max(0.1, FUT * kf); ghost.visible = kf > 0.004;
      plan.style.opacity = String(sstep(0.2, 0.6, t));
      for (const L of pills) { const [x, y] = scr(v.set(L.x, L.y, L.z), camera); L.el.at(x, y, sstep(0.5, 1.0, t)); }
    }, dispose() { fx.dispose(); } };
  }

  return { section, 'french-cut': frenchCut, 'valley-flood': valleyFlood, culebra, 'rio-indio': rioIndio };
}
