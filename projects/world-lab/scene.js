// WORLD LAB: the world kit (engine/world) and the oner sequencer (engine/oner.js) in four moves.
//   hero   sky -> through the clouds -> a car on the interstate at blue hour -> chase -> it exits ->
//          arrives at a glass HQ tower -> crane up the facade -> pull out over the city -> the world
//          flattens into a map with labels and a red route -> pull back to the globe. One shot.
//   dive   globe -> region -> city -> street, golden hour.
//   pin    street-level walk past a building at dusk; the building becomes a map pin.
//   truck  a semi on the interstate at night, side tracking.
// Debug: ?wl=trace logs the oner's smoothness report; every set logs its frame time with ?wl=time.
import * as THREE from 'three';
import * as K from 'kit';
import * as W from '/engine/world/index.js';
import * as O from '/engine/oner.js';

const qs = new URLSearchParams(location.search);
const DEBUG = qs.get('wl') ?? '';
const V3 = (a) => new THREE.Vector3(...a);
const RED = '#e0241b';
const CAP = `font:500 .78em 'Plex Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:#bdb6a8;white-space:nowrap`;

function layer(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function corner(el, html, pos = 'left:4.2%;bottom:6%') { const d = document.createElement('div'); d.style.cssText = `position:absolute;${pos};${CAP}`; d.innerHTML = html; el.appendChild(d); return d; }

// ---------------------------------------------------------------- shared Denver world (blue hour)
// Geography (ground metres around the anchor, x east, z south): the interstate runs east-west
// ~1.9 km south of the anchor; the city sits north of it; the HQ stands by its own exit ramp.
let DENVER = null;
function denverWorld() { return DENVER ??= makeDenver(); }
async function makeDenver({ tod = 'blue', clouds = true, seed = 4 } = {}) {
  const w = await W.create({ place: 'denver', tod, seed, wet: 0.7,
    clouds: clouds ? { base: 2300, thick: 520, coverage: 0.6, fog: 0 } : null });
  const hwy = w.road({ kind: 'highway', name: 'I-70', points: [[30000, 2900], [18000, 2500], [9000, 2150], [4000, 1950], [0, 1960], [-5000, 2250], [-11000, 2900], [-20000, 3900]] });
  // exit ramp: leaves the westbound outer lane and curls north into the HQ forecourt
  const qE = hwy.nearest(2600, 1950, 200), sE = qE.s;
  const p0 = hwy.poseXZ(sE, hwy.lane(2)), f = [p0.tx, p0.tz], r = [-p0.tz, p0.tx];
  const at = (a, b) => [p0.gx + f[0] * a + r[0] * b, p0.gz + f[1] * a + r[1] * b];
  const ramp = w.road({ kind: 'ramp', name: 'exit', verges: 'right', points: [at(-30, 0), at(0, 0.6), at(30, 5), at(52, 14), at(66, 28), at(72, 46), at(73, 62)], lampSpacing: 38, blend: 18 });
  const end = at(73, 62);
  const hq = { gx: end[0] + r[0] * 34 + f[0] * 4, gz: end[1] + r[1] * 34 + f[1] * 4 };
  const city = w.city({ center: [hq.gx - 500, hq.gz - 1150], radius: 1650, seed: 11, angle: 0, avoid: [hwy, ramp], avoidPad: 16,
    downtown: { at: [hq.gx - 250, hq.gz - 420], radius: 560, height: 175 }, reserve: [{ gx: hq.gx, gz: hq.gz, r: 62 }] });
  const angle = Math.atan2(r[1], r[0]) - Math.PI / 2; // the tower faces the ramp
  const T = W.tower(w, { gx: hq.gx, gz: hq.gz, w: 42, d: 32, c: 5, h: 196, angle: -Math.atan2(f[1], f[0]), seed: 9 });
  w.extra.push(T.mesh, W.plaza(w, hq.gx, hq.gz, 96, 84, -Math.atan2(f[1], f[0])));
  w.setCity([hq.gx, hq.gz - 400], 1650);
  w.build();
  w.hwy = hwy; w.ramp = ramp; w.city0 = city; w.T = T; w.sE = sE; w.hq = hq;
  // traffic: westbound inner lane + all eastbound lanes; two avenues in town
  w.traffics = [W.traffic(w, hwy, { lanes: [0, -1, -2, -3], perKm: 7, seed: 5, speed: [28, 34] })];
  for (const [ax, i] of [['x', city.nearestLine('x', 900)], ['z', city.nearestLine('z', 300)], ['z', city.nearestLine('z', -500)]]) {
    const ln = city.line(ax, i); w.traffics.push(W.traffic(w, ln, { lanes: [0, 1, -1, -2], perKm: 9, speed: [11, 15], seed: 20 + i, mix: { sedan: 0.6, suv: 0.3, van: 0.1, truck: 0 } }));
  }
  console.log('[scene] denver world', JSON.stringify(city.stats));
  return w;
}

// ---------------------------------------------------------------- HERO
async function hero(ctx, shot) {
  const w = await denverWorld();
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 1, 1e7);
  const el = layer(ctx.overlay);
  const hwy = w.hwy, ramp = w.ramp, T = w.T, F = w.frame;
  // ---- the hero car: lane 1, moves to the outer lane, exits, stops at the forecourt
  const tExit = 11.6, tStop = 16.4, v0 = 31;
  const drv = W.driver([[0, v0], [tExit - 1.2, v0], [tExit + 1.0, 22], [tStop, 0]]);
  const sAtExit = drv.s(tExit) ;
  const s0 = w.sE - sAtExit; // so the car reaches the ramp at tExit
  const rt = w.route([
    { road: hwy, from: s0 - 50, to: s0 + drv.s(6.5), lane: 1 },
    { road: hwy, from: s0 + drv.s(6.5), to: s0 + drv.s(9.0), lane: 1, u1: hwy.lane(2) },
    { road: hwy, from: s0 + drv.s(9.0), to: w.sE, lane: 2 },
    { road: ramp, from: 30, to: ramp.L - 2 },
  ], { smooth: 16 });
  const S = (t) => drv.s(t) + 50; // route s (the route starts 50 m before s0)
  const pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  const car = (t) => { const s = Math.min(S(t), rt.L - 0.5); const a = rt.at(s); W.groundPose(w, rt, s, { roll: 0 }, pose); return { pos: pose.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), fwd: new THREE.Vector3(a.tx, 0, a.tz), quat: pose.quat.clone(), s }; };
  const C8 = car(8), F8 = C8.fwd, R8 = new THREE.Vector3(-F8.z, 0, F8.x), U = new THREE.Vector3(0, 1, 0);
  const off = (c, f, u, r) => c.pos.clone().addScaledVector(c.fwd, f).addScaledVector(U, u).addScaledVector(new THREE.Vector3(-c.fwd.z, 0, c.fwd.x), r).toArray();
  const at8 = (f, u, r) => C8.pos.clone().addScaledVector(F8, f).addScaledVector(U, u).addScaledVector(R8, r).toArray();
  // ---- the move
  const chase = O.follow(car, { offset: (t) => [K.lerp(-9.5, -6.2, K.smooth(K.range(t, 7, 12))), K.lerp(2.8, 1.75, K.smooth(K.range(t, 7, 12))), K.lerp(-1.6, -0.4, K.smooth(K.range(t, 7, 12)))],
    lookAt: (t) => [K.lerp(14, 9, K.smooth(K.range(t, 11, 15))), 0.6, 0], lag: 0.55, posLag: 0.1, mm: (t) => K.lerp(30, 28, K.range(t, 8, 15)), float: 0.04 });
  const ch = (t) => chase(t);
  const cStop = car(tStop);
  // the tower face looking at the forecourt (the ramp end)
  const toEnd = new THREE.Vector3(w.ramp.X[w.ramp.n - 1] - w.hq.gx, 0, w.ramp.Z[w.ramp.n - 1] - w.hq.gz).normalize();
  let face = 0, best = -2; for (let i = 0; i < 8; i++) { const n = T.facePoint(i, 0.5, 0, 1).sub(T.facePoint(i, 0.5, 0, 0)); const d = n.dot(toEnd); if (d > best) { best = d; face = i; } }
  const fp = (along, y, out) => T.facePoint(face, along, y, out).toArray();
  const lobby = fp(0.5, 0, 0);
  // heading of a camera looking at the facade (degrees, 0 = north, clockwise)
  const nrm = new THREE.Vector3(...fp(0.5, 0, 1)).sub(new THREE.Vector3(...lobby)); const hd = Math.atan2(-nrm.x, nrm.z) * 180 / Math.PI;
  const top = new THREE.Vector3(T.base.x, T.base.y + 205, T.base.z);
  const oner = O.oner({ shot, cues: { leads: 22.3 },
    segments: [
      // the descent is keyed in the car's frame ([forward, up, right]) so it lands exactly on the chase
      { from: 0, to: 9.6, cam: O.attach(car, O.keys([
        { t: 0, pos: [-7400, 5300, -1600], look: [26000, -900, -2200], mm: 32 },
        { t: 2.8, pos: [-5000, 3500, -900], look: [12000, -2600, -900], mm: 32 },
        { t: 3.9, pos: [-3900, 2950, -560], look: [5000, -2300, -300], mm: 31 },
        { t: 5.4, pos: [-2300, 2120, -220], look: [2400, -1700, 0], mm: 30 },
        { t: 6.9, pos: [-640, 520, -40], look: [10, 0, 0], mm: 30 },
        { t: 8.4, pos: [-60, 26, -6], look: [10, 0.5, 0], mm: 30 },
        { t: 9.6, pos: [-8.6, 2.6, -1.3], look: [13, 0.6, 0], mm: 29.5 },
      ], { logY: -2, vOut: 'auto' }), { lag: 0.6 }) },
      { from: 8.8, to: 15.2, cam: chase },
      { from: 14.2, to: 21.0, cam: O.keys([
        { t: 14.2, pos: ch(14.2).pos.toArray(), look: ch(14.2).pos.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(ch(14.2).quat).multiplyScalar(20)).toArray(), mm: 28 },
        { t: 15.7, pos: off(car(15.7), -7.5, 3.6, -1.2), look: off(car(15.7), 30, 5, 0), mm: 27 },
        { t: 17.2, pos: off(cStop, -1.5, 9, -2.5), look: fp(0.5, 34, 0), mm: 25 },
        { t: 18.6, pos: fp(0.42, 70, 30), look: fp(0.5, 105, 0), mm: 24 },
        { t: 21.0, pos: fp(0.4, 214, 34), look: fp(0.5, 232, -10), mm: 24 },
      ], { vIn: 'auto', vOut: 'auto' }) },
      { from: 20.2, to: 29.5, cam: O.geo(top.toArray(), { t0: 20.2, t1: 29.5, frame: F,
        alt: O.curve([[20.2, 52], [22.2, 700], [24.2, 2100], [25.6, 2700], [29.5, 1.2e7]], { log: true, vIn: 'auto' }),
        tilt: O.curve([[20.2, 72], [22.5, 38], [24.5, 2], [29.5, 0]], { vIn: 'auto' }),
        heading: O.curve([[20.2, hd], [29.5, hd + 28]], { vIn: 'auto' }),
        mm: O.curve([[20.2, 24], [24, 30], [29.5, 32]], { log: true }) }) },
    ],
    tracks: {
      map: [[0, 0], ['leads+0.2', 0], ['leads+2.8', 1], [27.2, 1], [29.0, 0]],
      flat: [[0, 0], ['leads+0.8', 0], ['leads+3.4', 1]],
      route: [[0, 0], ['leads+1.6', 0], ['leads+4.2', 1]],
      labels: [[0, 0], ['leads+1.4', 0], ['leads+3.2', 1], [26.6, 1], [27.4, 0]],
      globeLabel: [[0, 0], [27.8, 0], [28.8, 1]],
      exposure: [[0, 1.0], [6, 1.0], [8, 1.05], [26, 1.05], [29.5, 1.5]],
      cloudFog: [[0, 0], [3.7, 0], [4.25, 1], [4.85, 1], [6.5, 0]],
    },
  });
  // a dense cloud where the camera crosses the deck, so the descent goes through it (not a gap)
  { const p = oner.cam(4.65).pos; w.clouds.setHole(0, p.x, p.z, -2600); }
  if (DEBUG.includes('trace')) { const tr = oner.trace(60, 0, 29.5); const r = O.smoothness(tr, { scale: (p) => Math.max(2, F.altitude(new THREE.Vector3(...p)) - F.elev - 0) }); console.log('[scene] smooth', JSON.stringify({ speed: r.worstSpeedChange, ang: r.worstAngularChange, sp: r.speed.map(x => +x.toFixed(4)), an: r.angular.map(x => +x.toFixed(3)) })); }
  // ---- map layer: route line, labels
  const pts = rt.points.filter((_, i) => i % 2 === 0);
  const line = W.routeLine(w, pts, { width: 4.5 }); w.root.add(line.mesh);
  const L = W.labels(el);
  const [lat, lon] = F.geoOf(w.hq.gx, w.hq.gz);
  const lHQ = L.add('Headquarters', T.top, { kind: 'hq', dx: 110, dy: -80, size: 1.3, sub: `${lat.toFixed(4)}° N · ${Math.abs(lon).toFixed(4)}° W` });
  const pHwy = hwy.pose(w.sE + 900, 0); const lI = L.add('I-70', F.surface(pHwy.gx, pHwy.gz, pHwy.h + 2), { kind: 'road', dx: -40, dy: -40, size: 1.3 });
  const lD = L.add('Downtown', F.surface(w.hq.gx - 300, w.hq.gz - 450, 60), { kind: 'place', dx: 70, dy: -60, size: 1.25 });
  const lR = L.add('Union Station', F.surface(w.hq.gx - 1500, w.hq.gz - 900, 10), { kind: 'place', dx: -80, dy: -50, size: 1.1 });
  const lG = L.add('Denver, Colorado', F.surface(w.hq.gx, w.hq.gz, 0), { kind: 'place', dx: 120, dy: -90, size: 1.3, sub: `${lat.toFixed(2)}° N · ${Math.abs(lon).toFixed(2)}° W` });
  const cap = corner(el, '');
  const res = new THREE.Vector2(ctx.width, ctx.height);
  return {
    update(t) {
      el.style.display = '';
      const st = oner.state(t);
      oner.camera(t, camera);
      const c = car(t);
      if (DEBUG.includes('dbg')) { const ci = w.cameraInfo(camera); console.log('[scene] dbg', t.toFixed(2), 'cam', camera.position.toArray().map(x => x.toFixed(1)).join(','), 'agl', ci.agl.toFixed(1), 'car', c.pos.toArray().map(x => x.toFixed(1)).join(','), 'carGround', (w.height(c.pos.x, c.pos.z)).toFixed(1), 's', c.s.toFixed(1), 'L', rt.L.toFixed(1)); }
      W.groundPose(w, rt, Math.min(S(t), rt.L - 0.5), {}, pose);
      w.setState({ t, tod: 'blue', map: st.map, flat: st.flat, exposure: st.exposure, cloudFog: st.cloudFog, head: { pos: pose.pos, fwd: c.fwd, right: new THREE.Vector3(-c.fwd.z, 0, c.fwd.x), on: DEBUG.includes('nohead') ? 0 : 1 } });
      // vehicles
      w.fleet.begin();
      const brake = K.clamp((-drv.accel(t)) / 3);
      W.groundPose(w, rt, Math.min(S(t), rt.L - 0.5), {}, pose);
      w.fleet.add('sedan', pose, { paint: [0.035, 0.04, 0.05], lights: 1, brake, wheelAngle: S(t) / 0.34 });
      for (const tr of w.traffics) tr(t, w.fleet);
      w.fleet.end();
      line.set(st.route, Math.min(1, st.map * 1.5), res);
      w.render(ctx.renderer, camera);
      L.update(camera, (l) => l === lG ? st.globeLabel : l === lHQ ? Math.min(st.labels, 1) : st.labels * (1 - st.globeLabel));
    },
    hide() { el.style.display = 'none'; line.mesh.visible = false; },
    world: w,
  };
}

// ---------------------------------------------------------------- DIVE: globe -> region -> city -> street, golden hour
async function dive(ctx, shot) {
  const w = await denverWorld();
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 1, 1e7);
  const el = layer(ctx.overlay); const F = w.frame, city = w.city0;
  // land at street level on an avenue in the north of town, looking south-west down it
  const ix = city.nearestLine('x', -300), iz = city.nearestLine('z', -1100);
  const [gx, gz] = city.toG(city.LX[ix].c, city.LZ[iz].c + 60);
  const gy = w.height(gx, gz); const focus = F.surface(gx, gz, gy + 1.8);
  const ahead = F.surface(gx, gz + 400, gy + 6);
  const cam = O.geo(focus.toArray(), { t0: 0, t1: 9.6, frame: F,
    alt: O.curve([[0, 1.25e7], [4.2, 3.0e5], [6.6, 9000], [8.6, 600], [9.6, 260]], { log: true, vOut: 'auto' }),
    tilt: O.curve([[0, 0], [6.0, 4], [8.6, 38], [9.6, 52]], { vOut: 'auto' }),
    heading: O.curve([[0, 60], [7, 120], [9.6, 178]], { vOut: 'auto' }),
    mm: O.curve([[0, 30], [9.6, 28]], { log: true }) });
  // final approach: down the street's axis to eye level (keys continue the geo move's velocity)
  const fwdOf = (s) => s.pos.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(s.quat).multiplyScalar(200));
  const oner = O.oner({ segments: [{ from: 0, to: 9.9, cam }, { from: 9.0, to: 13.0, cam: O.keys([
    { t: 9.0, pos: cam(9.0).pos.toArray(), look: fwdOf(cam(9.0)).toArray(), mm: 28.2 },
    { t: 9.6, pos: cam(9.6).pos.toArray(), look: fwdOf(cam(9.6)).toArray(), mm: 28 },
    { t: 11.3, pos: F.surface(gx, gz - 40, gy + 14).toArray(), look: F.surface(gx, gz + 160, gy + 8).toArray(), mm: 27 },
    { t: 13.0, pos: F.surface(gx, gz + 6, gy + 1.7).toArray(), look: ahead.toArray(), mm: 26 }], { vIn: 'auto' }) }],
    tracks: { exposure: [[0, 0.95], [5, 0.9], [9, 0.85]] } });
  w.clouds.setHole(1, gx, gz, 2500);
  const L = W.labels(el);
  const lC = L.add('Colorado', F.surface(-60000, -40000, 3000), { kind: 'place', dx: 70, dy: -50, size: 1.2 });
  const traf = [];
  for (const [ax, i] of [['z', iz]]) traf.push(W.traffic(w, city.line(ax, i), { lanes: [0, 1, -1, -2], perKm: 14, speed: [9, 13], seed: 40 + i, mix: { sedan: 0.6, suv: 0.3, van: 0.1, truck: 0 } }));
  return {
    world: w,
    update(t) {
      el.style.display = '';
      const st = oner.state(t); oner.camera(t, camera);
      w.setState({ t, tod: 'golden', exposure: st.exposure });
      w.fleet.begin(); for (const tr of [...traf, w.traffics[0]]) tr(t, w.fleet); w.fleet.end();
      w.render(ctx.renderer, camera);
      L.update(camera, (l) => K.smooth(K.range(t, 4.6, 5.4)) * (1 - K.smooth(K.range(t, 6.6, 7.4))));
    },
    hide() { el.style.display = 'none'; },
  };
}

// ---------------------------------------------------------------- PIN: walk past a building; it becomes a map pin
async function pinSet(ctx, shot) {
  const w = await denverWorld();
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 0.1, 1e7);
  const el = layer(ctx.overlay); const F = w.frame, city = w.city0;
  // a mid-rise on a quiet street, west of downtown
  const cands = city.bldgs.filter(b => b.h > 26 && b.h < 60 && b.gf > 0 && b.w > 18 && b.d > 18).map(b => ({ b, g: city.toG(b.cx, b.cz) }))
    .filter(({ g }) => Math.hypot(g[0] - (w.hq.gx - 1400), g[1] - (w.hq.gz - 700)) < 600);
  const { b } = cands[0];
  // walk the far sidewalk of the street in front of it (city frame: +z is south)
  const blk = city.blocks.find(k => b.cx > k.x0 && b.cx < k.x1 && b.cz > k.z0 && b.cz < k.z1);
  const ln = city.LZ[blk.j + 1], half = ln.avenue ? 10.9 : 5.6;
  const sx = b.cx, sz = ln.c + half - 2.4;
  const P = (x, y, z) => { const [gx, gz] = city.toG(x, z); return F.surface(gx, gz, w.height(gx, gz) + y); };
  const top = P(b.cx, b.h + 2, b.cz), base = P(b.cx, 0.5, b.cz);
  const ang = city.angle;
  const walk = O.keys([
    { t: 0, pos: P(sx - 30, 1.65, sz).toArray(), look: P(sx + 14, 4, sz - 16).toArray(), mm: 28 },
    { t: 3.6, pos: P(sx - 4, 1.7, sz).toArray(), look: P(sx + 8, 9, sz - 22).toArray(), mm: 28 },
    { t: 5.0, pos: P(sx + 2, 1.75, sz).toArray(), look: P(sx + 9, 14, sz - 24).toArray(), mm: 28 },
  ]);
  const wf = (t) => { const s = walk(t); const h = K.handheld(t, 0.035, 3); s.pos.x += h.x; s.pos.y += h.y * 0.6; return s; };
  const lookDir = new THREE.Vector3().subVectors(P(sx + 8, 0, sz - 22), P(sx - 4, 0, sz)); const hd = Math.atan2(lookDir.x, -lookDir.z) * 180 / Math.PI;
  // the rise starts where the walk is: same distance from the building, eye height
  const w0 = walk(4.4).pos, dH = Math.hypot(w0.x - base.x, w0.z - base.z), d0 = Math.hypot(dH, w0.y - base.y);
  const til0 = Math.atan2(dH, w0.y - base.y) * 180 / Math.PI;
  const up = O.geo(base.toArray(), { t0: 3.4, t1: 9.5, frame: F,
    alt: O.curve([[3.4, d0], [4.4, d0 * 1.05], [6.4, 260], [7.8, 800], [9.5, 1200]], { log: true }),
    tilt: O.curve([[3.4, til0], [4.4, til0 - 1], [6.8, 24], [8.2, 0], [9.5, 0]]),
    heading: O.curve([[3.4, hd], [9.5, hd + 25]]), mm: [28, 30] });
  const oner = O.oner({ segments: [{ from: 0, to: 5.0, cam: O.fn(wf) }, { from: 3.8, to: 9.5, cam: up }],
    tracks: { map: [[0, 0], [5.4, 0], [7.0, 1]], flat: [[0, 0], [6.0, 0], [7.6, 1]], pin: [[0, 0], [7.4, 0], [8.4, 1]], outline: [[0, 0], [6.8, 0], [7.8, 1]] } });
  const pn = W.pin(el, { label: 'The office', sub: 'FLOOR 9 · LEASED 2019' });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 1920 1080'); svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; el.appendChild(svg);
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'path'); poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', RED); poly.setAttribute('stroke-width', '3'); poly.setAttribute('stroke-linejoin', 'round'); svg.appendChild(poly);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([a, c]) => P(b.cx + a * b.w / 2, 0.6, b.cz + c * b.d / 2));
  const traf = []; void [W.traffic(w, city.line('z', blk.j + 1), { lanes: [0, -1], perKm: 16, speed: [8, 11], seed: 77, mix: { sedan: 0.6, suv: 0.3, van: 0.1, truck: 0 } })];
  const v = new THREE.Vector3();
  return {
    world: w,
    update(t) {
      el.style.display = '';
      const st = oner.state(t); oner.camera(t, camera);
      w.setState({ t, tod: W.todMix('golden', 'blue', 0.72), map: st.map, flat: st.flat });
      w.fleet.begin(); for (const tr of traf) tr(t, w.fleet); w.fleet.end();
      w.render(ctx.renderer, camera);
      // red footprint drawn on, then the pin drops into it
      const pts = corners.map(c => { v.copy(c); v.y = K.lerp(c.y, F.surface(...city.toG(b.cx, b.cz), 0).y * 0 + c.y, 1); v.project(camera); return [(v.x + 1) / 2 * 1920, (1 - v.y) / 2 * 1080]; });
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`; const k = st.outline * 4;
      for (let i = 1; i < 5; i++) { const f = K.clamp(k - (i - 1)); if (f <= 0) break; const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; d += ` L${(ax + (bx - ax) * f).toFixed(1)},${(ay + (by - ay) * f).toFixed(1)}`; }
      poly.setAttribute('d', st.outline > 0.001 ? d : ''); 
      pn.update(camera, P(b.cx, 0.6, b.cz), st.pin);
    },
    hide() { el.style.display = 'none'; },
  };
}

// ---------------------------------------------------------------- TRUCK: a semi on the interstate at night, side tracking
async function truck(ctx, shot) {
  const w = await denverWorld();
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 0.1, 1e7);
  const el = layer(ctx.overlay); const F = w.frame, hwy = w.hwy;
  const lane = -3, v = 25, s0 = hwy.nearest(9000, 2150, 300).s;          // eastbound outer lane, east of town
  const sT = (t) => s0 - v * t;                                              // eastbound = decreasing s
  const pathE = { at: (x) => { const p = hwy.pose(x, hwy.lane(lane)); return { ...p, tx: -p.tx, tz: -p.tz }; } };
  const pa = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, pb = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  const subj = (t) => { const p = pathE.at(sT(t)); return { pos: F.surface(p.gx, p.gz, p.h + 1.8), fwd: new THREE.Vector3(p.tx, 0, p.tz) }; };
  // camera in the median, level with the cab, drifting back along the trailer: [forward, up, right]
  const side = O.attach(subj, O.keys([
    { t: 0, pos: [4.5, 0.5, -19], look: [0.5, 0.3, 0], mm: 32 },
    { t: 4, pos: [-3.5, 0.75, -18.2], look: [-5, 0.2, 0], mm: 32 },
    { t: 8, pos: [-10.5, 0.45, -19], look: [-10.5, 0.4, 0], mm: 30 },
  ]), { lag: 0.8 });
  const oner = O.oner({ segments: [{ from: 0, to: 8, cam: side }], tracks: { exposure: [[0, 1.15]] } });
  const traf = W.traffic(w, hwy, { lanes: [0, 1, 2], perKm: 6, seed: 9, speed: [30, 34] });
  corner(el, 'I-70 EASTBOUND · 02:14', 'right:4.2%;bottom:6%');
  return {
    world: w,
    update(t) {
      el.style.display = '';
      const st = oner.state(t); oner.camera(t, camera);
      w.setState({ t, tod: 'night', exposure: st.exposure });
      w.fleet.begin();
      const s = sT(t);
      W.groundPose(w, pathE, s, {}, pa); w.fleet.add('tractor', pa, { paint: [0.32, 0.03, 0.02].map(x => x * 0.6), lights: 1, wheelAngle: -s / 0.52 });
      const king = pathE.at(s - 2.85), rear = pathE.at(s + 13.8 - 2.85);
      // pathE.at takes road s; the trailer trails behind (larger s, since we drive towards smaller s)
      const kp = hwy.pose(s + 2.85, hwy.lane(lane)), rp = hwy.pose(s + 2.85 + 13.8, hwy.lane(lane));
      F.surface(kp.gx, kp.gz, kp.h, pb.pos); pb.quat.setFromEuler(new THREE.Euler(0, Math.atan2(-(kp.gz - rp.gz), kp.gx - rp.gx), 0, 'YZX'));
      w.fleet.add('trailer', pb, { paint: [0.6, 0.6, 0.58], lights: 1, wheelAngle: -s / 0.52, beam: false });
      traf(t, w.fleet);
      w.fleet.end();
      w.render(ctx.renderer, camera);
    },
    hide() { el.style.display = 'none'; },
  };
}

// ---------------------------------------------------------------- runtime
const SETS = { hero, dive, pin: pinSet, truck };
export default async function create(ctx) {
  const { shots } = ctx;
  const live = new Map(); let cur = null;
  // build every set up front (textures load once; worlds are deterministic)
  for (const s of shots) live.set(s.id, await SETS[s.set](ctx, s));
  return {
    frame({ shot, t }) {
      const inst = live.get(shot.id); window.__wl = inst;
      if (cur && cur !== inst) cur.hide?.();
      cur = inst;
      const sync = () => { const g = ctx.renderer.getContext(); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); };
      if (DEBUG.includes('time')) { inst.update(t); sync(); }
      if (DEBUG.includes('prof') && inst.world) { // cost of each part: render with it hidden
        const w = inst.world; const parts = {}; w.scene.traverse(o => { if (o.name && o !== w.scene) parts[o.name] = o; });
        const time = () => { let m = 1e9; for (let k = 0; k < 3; k++) { const a = performance.now(); inst.update(t); sync(); m = Math.min(m, performance.now() - a); } return m; };
        time(); const all = time(); const out = { all: Math.round(all) };
        for (const [n, o] of Object.entries(parts)) { const v = o.visible; o.visible = false; o.userData.forceHidden = true; out[n] = Math.round(all - time()); o.visible = v; o.userData.forceHidden = false; }
        console.log('[scene] prof', t.toFixed(2), JSON.stringify(out));
      }
      const t0 = performance.now();
      inst.update(t);
      if (DEBUG.includes('time')) { const g = ctx.renderer.getContext(); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); console.log('[scene] ms', shot.id, t.toFixed(2), (performance.now() - t0).toFixed(0)); }
    },
  };
}
