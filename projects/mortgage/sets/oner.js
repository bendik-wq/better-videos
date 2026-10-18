// MORTGAGE cold open: THE ONER (one camera, ~27 s, moving from frame 1). SCRIPT.md lines 1-6.
//   Tight on a big white clay wall clock at 12:59 (second hand sweeping) -> pull back over a glass ballot box while a stream
//   of sealed white envelopes pours in through the open side of the auction room (on top of a white tower) -> the minute
//   hand hits 12: the slot slides shut -> the pedestal prints a red ticket "5.300%" -> it lifts, turns to camera (the hit)
//   -> it flutters out of the building; the camera follows it down over a bright clay suburb -> it lands as the red price
//   tag on the hero house standing on a wooden auction block; the gavel above it strikes.
// Cue words (VO lines 1-6; params.cues overrides with { name: { word, at } }), default times without VO:
//   clock 'Twelve' 1.6 (date caption)   bids 'sale' 5.5 (pull back, the bid counter)   lock "o'clock" 11 (12:59:60, the slot
//   shuts)   number 'number' 14 (the ticket prints)   rate 'Five' 15.6 (the ticket turns to camera)   suburb 'highest' 18
//   (it flies out; the descent)   house 'house' 24.5 (it lands on the house; the gavel strikes 0.8 s later)
// Cues are forced into order with minimum gaps (GAP). Give the shot `min: 28` (or the VO length).
// params: cues, rate ('5.300%'), labels (true), bids ('$108B'), date ('WED 7 OCT 2026 · 12:59 PM ET'), since ('HIGHEST SINCE 2000'),
//         gavel (true), sold (false: a SOLD stamp on the strike), sunAz (140), sunEl (42), quality ('medium'), mapSize (4096)
import * as THREE from 'three';
import * as O from '/engine/oner.js';
import * as CK from '/projects/panama/sets/clay-kit.js';
import * as PR from './clay-props.js';
import * as CW from './clay-world.js';

const { clamp, lerp, range, sstep, smoother, mat, hash } = CK;
const { C } = PR;
const DEF = { clock: 1.6, bids: 5.5, lock: 11, number: 14, rate: 15.6, suburb: 18, house: 24.5 };
const WORD = { clock: 'Twelve', bids: 'sale', lock: "o'clock", number: 'number', rate: 'Five', suburb: 'highest', house: 'house' };
const GAP = { clock: 0.8, bids: 2.5, lock: 3.0, number: 1.8, rate: 1.2, suburb: 1.6, house: 4.5 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export default function makeOner(H) {
  const { P, K } = H;
  async function coldOpen(ctx, shot) {
    const P0 = shot.params ?? {};
    // ---- cue times (monotonic, with minimum gaps)
    const cues = Object.fromEntries(Object.keys(DEF).map(k => [k, { word: P0.cues?.[k]?.word ?? WORD[k], at: P0.cues?.[k]?.at ?? DEF[k] }]));
    const T = {}; let last = 0;
    for (const k of Object.keys(DEF)) { let t; try { t = O.cueTime(k, { shot, cues }); } catch { t = DEF[k]; } T[k] = Math.max(t, last + GAP[k]); last = T[k]; }
    const END = Math.max(shot.duration, T.house + 3);

    // ---- the world: suburb + the auction tower (west of the hero, room open to the south and east)
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 0.05, 6000);
    const TW = { x: -96, z: -4, h: 40 };
    const sun = CK.brightLight(scene, { target: [TW.x, TW.h, TW.z], span: 14, fog: true, fogC: '#e4ecf1', near: 420, far: 2600, mapSize: P0.mapSize ?? 4096, el: P0.sunEl ?? 42, az: P0.sunAz ?? 140, fill: 0.42, hemiI: 0.78, sunI: 3.2, bg: ['#94c1e8', '#e7eef3'] });
    const W = CW.suburbWorld(scene, { hero: true, clear: [[TW.x - 24, TW.x + 24, TW.z - 20, TW.z + 20]], cars: 12 });
    const R = V(TW.x, TW.h, TW.z); // the room's floor centre
    // tower body + two low neighbours (generic offices)
    const tw = new THREE.Group(); tw.position.set(TW.x, 0, TW.z); scene.add(tw);
    {
      const parts = [{ geo: PR.rbox(20, TW.h, 16, 0.4), color: '#f6f5f1' }, { geo: PR.rbox(24, 0.6, 20, 0.2), color: '#e8e5de' }];
      for (let y = 3.2; y < TW.h - 1; y += 3.4) parts.push({ geo: PR.rbox(20.12, 1.3, 16.12, 0.1, 1).translate(0, y, 0), color: '#d6e2ea' });
      parts.push({ geo: PR.rbox(6, 3.0, 0.4, 0.1).translate(0, 0.4, 8.05), color: '#cfdbe4' });
      tw.add(PR.mesh(PR.bake(parts), PR.vmat(0.85)));
      tw.add(PR.mesh(PR.bake([{ geo: PR.rbox(12, 9, 10, 0.3).translate(-17, 0, 8), color: '#f3f1ec' }, { geo: PR.rbox(10, 6, 9, 0.3).translate(15.5, 0, 9), color: '#f1efea' }]), PR.vmat(0.85)));
      tw.add(PR.trees([[-9, 12], [9, 12.5], [-22, -6], [20, -5]].map(([x, z], i) => ({ x, y: 0, z, s: 1.8 + 0.4 * hash(i, 2) })), { seed: 21 }));
    }
    // the auction room (floor, back wall with the clock, west wall, a bench, plants)
    const room = new THREE.Group(); room.position.copy(R); scene.add(room);
    room.add(PR.mesh(PR.bake([
      { geo: PR.rbox(20, 0.5, 16, 0.2).translate(0, -0.5, 0), color: '#efe9de' },
      { geo: PR.rbox(18.4, 0.04, 14.4, 0.02, 1), color: '#e9d4b4' },
      { geo: PR.rbox(20, 7.2, 0.6, 0.2).translate(0, 0, -7.7), color: '#f7f6f2' },
      { geo: PR.rbox(0.6, 7.2, 16, 0.2).translate(-9.7, 0, 0), color: '#f4f3ef' },
      { geo: PR.rbox(20.2, 0.5, 0.8, 0.15).translate(0, 7.2, -7.6), color: '#eceae4' },
      { geo: PR.rbox(0.8, 0.5, 16.2, 0.15).translate(-9.6, 7.2, 0), color: '#eceae4' },
      { geo: PR.rbox(1.4, 0.9, 9, 0.12).translate(-8.4, 0, 0.5), color: '#ffffff' },
      { geo: PR.rbox(6.4, 2.6, 0.12, 0.05).translate(-5.2, 2.2, -7.36), color: '#e6eef3' },
    ]), PR.vmat(0.85)));
    room.add(PR.bushes([{ x: -8.3, y: 0, z: -6.3, s: 0.9 }, { x: 8.6, y: 0, z: -6.4, s: 1.0 }]));
    const clock = PR.wallClock({ r: 1.75 }); clock.position.set(1.2, 4.3, -7.38); room.add(clock);
    const CLK = room.localToWorld(clock.position.clone());
    const box = PR.ballotBox({ w: 2.6, h: 1.9, d: 1.7, ped: 1.15 }); box.position.set(0.6, 0, -1.6); room.add(box);
    room.updateMatrixWorld(true);
    const SLOT = box.localToWorld(box.slot.clone()), PRN = box.localToWorld(box.printer.clone());
    // envelopes: the pile inside (grows until the lock) + the stream through the open east side
    const pileP = PR.pile(box.inside, 480, { s: 0.5, thick: 0.02, seed: 4 });
    const pileM = new THREE.InstancedMesh(PR.envelopeGeo(0.5), PR.vmat(0.8), pileP.length); pileM.castShadow = pileM.receiveShadow = true; box.add(pileM);
    const NS = 44, streamM = new THREE.InstancedMesh(PR.envelopeGeo(0.72), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: '#ffffff', emissiveIntensity: 0.32, side: THREE.DoubleSide }), NS); streamM.castShadow = true; streamM.frustumCulled = false; scene.add(streamM);
    const FLY = 1.35, PER = 0.085;
    // the hero: the house on the auction block (as in house-block), the gavel, the sound block
    const HX = W.heroLot.x, HZ = W.heroLot.z;
    const blk = PR.auctionBlock({ w: 16, d: 13, h: 2.4 }); blk.position.set(HX, 0, HZ); scene.add(blk);
    const hs = PR.house({ w: 10, d: 8, h: 4.6, R: 3.6, roof: C.roof }); hs.position.set(HX - 0.6, 2.4, HZ - 1.2); scene.add(hs);
    const sb = PR.soundBlock({ r: 1.25, h: 0.5 }); sb.position.set(HX - 5.9, 2.4, HZ + 4.3); scene.add(sb);
    const gv = PR.gavel(); gv.position.set(HX - 10.6, 2.4 + 1.5, HZ + 4.3); gv.visible = P0.gavel !== false; scene.add(gv);
    scene.updateMatrixWorld(true);
    const ANC = hs.localToWorld(hs.eave.clone()).add(V(-0.45, 0, 0.1)), HANG = ANC.clone().add(V(0, -1.5, 0.75));
    // the ticket = the tag
    const tag = PR.priceTag({ w: 4.1, h: 2.9, text: P0.rate ?? '5.300%' }); scene.add(tag);
    const str = PR.string(); scene.add(str);
    const S0 = 0.23;
    // ---- the ticket's path (pure in t)
    const FLOAT = R.clone().add(V(1.2, 2.5, 1.4));
    const flight = new THREE.CatmullRomCurve3([FLOAT, R.clone().add(V(5, 3.4, 1.4)), R.clone().add(V(13, 1.6, 2.6)), V(R.x + 32, 30, R.z + 7), V(R.x + 58, 21, R.z + 12), V(HX - 14, 13.5, HZ + 6), HANG], false, 'centripetal');
    const flu = (t) => smoother(range(t, T.suburb, T.house));
    function ticket(t, q) { // -> { pos, rot: Euler, s, string }
      const out = { pos: new THREE.Vector3(), rx: 0, ry: 0, rz: 0, s: S0, hang: false };
      const pr = T.number, kOut = smoother(range(t, pr, pr + 1.3));
      if (t < T.rate - 0.5) { // printing: lying flat, sliding out of the slot (+z), text up
        out.pos.copy(PRN).add(V(0, 0.02, -2.9 * S0 + kOut * 2.9 * S0)); out.rx = -Math.PI / 2; out.s = t < pr ? 0 : S0;
      } else if (t < T.suburb) { // lift and turn upright toward the camera, hover
        const k = smoother(range(t, T.rate - 0.5, T.rate + 0.35)), from = PRN.clone().add(V(0, 0.02, 0));
        out.pos.lerpVectors(from, FLOAT, k).add(V(0, Math.sin(Math.PI * k) * 0.5 + 0.04 * Math.sin(t * 2.3) * k, 0));
        out.rx = lerp(-Math.PI / 2, 0.05 * Math.sin(t * 1.7), k); out.ry = lerp(0, 0.18, k); out.rz = 0.06 * Math.sin(t * 1.3) * k;
      } else if (t < T.house) { // the flight: flutter down to the house, growing
        const u = flu(t), env = Math.sin(Math.PI * u);
        out.pos.copy(flight.getPoint(u)).add(V(0, 0.8 * env * Math.sin(t * 2.1), 1.2 * env * Math.sin(t * 1.4)));
        out.s = lerp(S0, 1, smoother(u)); out.rx = 0.35 * env * Math.sin(t * 4.3); out.rz = 0.45 * env * Math.sin(t * 3.1 + 1); out.ry = lerp(0.18, -0.16, u) - 0.7 * env;
      } else { // hanging on its string from the eave: a damped swing
        const th = PR.swing(t, T.house, 0.45, { T: 1.5, decay: 1.0 });
        out.pos.set(ANC.x + Math.sin(th) * 1.5, ANC.y - Math.cos(th) * 1.5, ANC.z + 0.75); out.rz = th; out.ry = -0.16; out.s = 1; out.hang = true;
      }
      return out;
    }
    // ---- the camera
    const room$ = (x, y, z) => [R.x + x, R.y + y, R.z + z];
    const C0 = [CLK.x, CLK.y, CLK.z];
    const segA = O.keys([
      { t: 0, pos: [C0[0] + 0.55, C0[1] - 0.3, C0[2] + 4.4], look: [C0[0] + 0.05, C0[1] - 0.05, C0[2]], mm: 35 },
      { t: T.bids - 0.2, pos: [C0[0] - 0.1, C0[1] - 0.4, C0[2] + 3.7], look: [C0[0], C0[1] - 0.1, C0[2]], mm: 35 },
      { t: T.bids + 1.6, pos: room$(4.8, 4.4, 8.6), look: room$(0.4, 2.4, -2.6), mm: 30 },
      { t: T.lock, pos: room$(3.9, 3.4, 7.1), look: room$(0.5, 2.5, -2.0), mm: 30 },
    ], { vOut: 'auto' });
    const segB = O.keys([
      { t: T.lock - 0.4, pos: room$(3.95, 3.45, 7.2), look: room$(0.5, 2.5, -2.0), mm: 30 },
      { t: T.number + 0.2, pos: room$(2.6, 2.4, 4.6), look: room$(0.6, 1.0, -0.2), mm: 32 },
      { t: T.rate, pos: room$(1.9, 2.75, 4.3), look: [FLOAT.x, FLOAT.y - 0.1, FLOAT.z], mm: 35 },
      { t: T.suburb + 0.3, pos: room$(1.6, 2.9, 4.0), look: [FLOAT.x + 0.3, FLOAT.y, FLOAT.z], mm: 35 },
    ], { vIn: 'auto', vOut: 'auto' });
    const segD = O.fn((t) => {
      const u = flu(t), tk = ticket(Math.min(t, T.house - 1e-3)), p = tk.pos;
      const off = [lerp(-3.4, -16, smoother(u)), lerp(1.3, 9, smoother(u)), lerp(2.2, 13, smoother(u))], ahead = [lerp(5, 9, u), lerp(-1.6, -3.5, u), lerp(0.6, -2, u)];
      return { pos: [p.x + off[0], p.y + off[1], p.z + off[2]], look: [p.x + ahead[0], p.y + ahead[1], p.z + ahead[2]], mm: lerp(30, 32, u) };
    });
    const hero = (dx, dy, dz) => [HX + dx, dy, HZ + dz];
    const segE = O.keys([
      { t: T.house - 1.4, pos: hero(-18, 15, 32), look: hero(1.5, 6.4, 1), mm: 33 },
      { t: T.house + 1.2, pos: hero(-16, 9.4, 29.5), look: hero(-0.3, 6.3, 0), mm: 35 },
      { t: END, pos: hero(-12.2, 8.0, 25.4), look: hero(-0.3, 6.4, 0), mm: 36 },
    ], { vIn: 'auto' });
    const on = O.oner({ shot, segments: [
      { from: 0, to: T.lock, cam: segA },
      { from: T.lock - 0.4, to: T.suburb + 0.3, cam: segB },
      { from: T.suburb - 0.9, to: T.house - 0.2, cam: segD },
      { from: T.house - 1.6, to: END, cam: segE },
    ] });
    window.__oner = on;
    const layer = H.layerOf(ctx);
    const fx = P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 2.4, falloff: 1 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    // ---- overlays
    const labels = P0.labels !== false;
    const cap = labels ? H.caption(layer, P0.date ?? 'WED 7 OCT 2026 · 12:59 PM ET', 'left:5.5%;top:7.5%', { at: 0.2, dur: 0.45 }) : null;
    const since = labels ? H.slab(layer, P0.since ?? 'HIGHEST SINCE 2000', 'left:5.5%;top:7.5%', { size: 40 }) : null;
    if (since) since.style.opacity = '0';
    const bidP = labels ? H.pill(layer, '', { size: 30 }) : null;
    const tenP = labels ? H.pill(layer, '$39B · <b>10-YEAR IOUS</b>', { size: 26 }) : null;
    const stp = P0.sold ? (() => { const s = H.sc(), el = K.div(layer, `left:60%;top:11%;padding:${10 * s}px ${34 * s}px;border:${9 * s}px solid ${C.ink};border-radius:${16 * s}px;color:${C.ink};font:700 ${120 * s}px/1 ${H.FONT.ui};letter-spacing:.06em;background:rgba(251,248,242,.55)`, 'SOLD'); return el; })() : null;
    const src = labels ? H.sourceLine(layer, P0.source ?? 'TREASURYDIRECT · 10-YEAR NOTE AUCTION · 7 OCT 2026') : null;
    if (src) src.style.opacity = '0';
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), v = new THREE.Vector3();
    const D2R = Math.PI / 180, aRest = 34 * D2R, aHit = 98 * D2R, HIT = T.house + 0.8;
    const bidsM = num(P0.bids ?? '$108B');
    function num(s) { return Number(String(s).replace(/[^0-9.]/g, '')); }

    return { scene, camera, layer, update(t) {
      const cs = on.camera(t, camera);
      W.tick(t);
      // light + AO scale with where the camera is (room ~14 m, descent up to ~45 m)
      const dRoom = camera.position.distanceTo(R), inRoom = 1 - sstep(T.suburb + 0.5, T.suburb + 2.5, t), outro = sstep(T.house - 1.5, T.house + 0.5, t);
      const tk = ticket(t);
      const tgt = inRoom > 0.5 ? R : outro > 0.5 ? V(HX, 3, HZ) : tk.pos;
      sun.track(tgt, lerp(lerp(46, 26, outro), 15, inRoom));
      if (fx.ao) fx.ao.configuration.aoRadius = lerp(lerp(3.5, 1.4, outro), 0.7, inRoom);
      // clock: 12:59:xx, the minute hand reaches 12 at T.lock
      const sec = 60 - (T.lock - t), mm = 59 + sec / 60;
      clock.set(12 + mm / 60, mm, ((sec % 60) + 60) % 60);
      // the slot shuts at the lock
      const kL = smoother(range(t, T.lock, T.lock + 0.45)); box.seal(kL);
      // pile: grows until the lock
      const nPile = Math.floor(lerp(150, pileP.length, clamp(t / T.lock)));
      pileP.forEach((e, i) => { const s = i < nPile ? 1 : 1e-4; Q.setFromEuler(E.set(e.rx, e.ry, e.rz)); M4.compose(Pp.set(e.x, e.y, e.z), Q, Sc.setScalar(s)); pileM.setMatrixAt(i, M4); });
      pileM.instanceMatrix.needsUpdate = true;
      // the stream: envelope i spawns every PER s (cyclic), flies FLY s into the slot; nothing spawns that would land after the lock
      for (let i = 0; i < NS; i++) {
        const cyc = Math.floor((t / PER - i) / NS), sp = (cyc * NS + i) * PER, u = (t - sp) / FLY;
        let s = 1; if (u < 0 || u > 1 || sp + FLY > T.lock) s = 0;
        const h1 = hash(i, cyc, 1), h2 = hash(i, cyc, 2), h3 = hash(i, cyc, 3);
        const a = V(R.x + 10 + 7 * h1, R.y + 4.5 + 5 * h2, R.z - 6 + 9 * h3), k = smoother(clamp(u)), kk = clamp(u);
        Pp.lerpVectors(a, SLOT, kk); Pp.y += Math.sin(Math.PI * kk) * (1.2 + 1.5 * h2);
        Q.setFromEuler(E.set((1 - k) * 4 * (h1 - 0.5), (1 - k) * 6 * h3 + k * 0.0, (1 - k) * 3 * (h2 - 0.5)));
        const sc = s * (kk > 0.93 ? (1 - kk) / 0.07 : 1);
        M4.compose(Pp, Q, Sc.setScalar(Math.max(1e-4, sc))); streamM.setMatrixAt(i, M4);
      }
      streamM.instanceMatrix.needsUpdate = true;
      // the ticket
      tag.position.copy(tk.pos); tag.rotation.set(tk.rx, tk.ry, tk.rz, 'YXZ'); tag.scale.setScalar(Math.max(1e-4, tk.s));
      str.visible = tk.hang; if (tk.hang) str.span(ANC, tk.pos);
      // gavel above the house: strikes after the landing
      let ga = aRest + 0.03 * Math.sin(t * 1.3);
      if (t > HIT - 0.5 && t <= HIT - 0.12) ga = lerp(aRest, 14 * D2R, CK.outCubic(range(t, HIT - 0.5, HIT - 0.12)));
      else if (t > HIT - 0.12 && t <= HIT) ga = lerp(14 * D2R, aHit, CK.inCubic(range(t, HIT - 0.12, HIT)));
      else if (t > HIT) ga = aHit - 11 * D2R * Math.exp(-5 * (t - HIT)) * Math.abs(Math.sin((t - HIT) * 9)) - 30 * D2R * sstep(HIT + 1.4, HIT + 2.6, t);
      gv.pivot.rotation.z = -ga;
      // overlays
      if (cap) { cap.type(t); cap.style.opacity = String(1 - sstep(T.bids - 0.3, T.bids + 0.2, t)); }
      if (bidP) {
        const [x, y] = K.toScreen(v.copy(SLOT).add(V(-1.7, 0.5, 0.6)), camera), kb = smoother(range(t, T.bids, T.lock));
        bidP.innerHTML = t < T.lock ? `BIDS &nbsp;<b>$${Math.round(bidsM * kb)}B</b>` : `<b>1:00 PM</b> · BIDS LOCKED`;
        bidP.at(x, y, sstep(T.bids + 0.4, T.bids + 0.9, t) * (1 - sstep(T.number - 0.2, T.number + 0.3, t)));
      }
      if (tenP) { const [x, y] = K.toScreen(v.copy(SLOT).add(V(1.9, -1.6, 0.9)), camera); tenP.at(x, y, sstep(T.bids + 1.6, T.bids + 2.1, t) * (1 - sstep(T.lock - 0.4, T.lock, t))); }
      if (since) since.style.opacity = String(sstep(T.suburb, T.suburb + 0.4, t) * (1 - sstep(T.house - 1.2, T.house - 0.6, t)));
      if (src) src.style.opacity = String(sstep(T.bids, T.bids + 0.4, t) * (1 - sstep(T.house - 0.5, T.house, t)));
      if (stp) { const k = range(t, HIT + 0.02, HIT + 0.3); stp.style.opacity = String(clamp(k * 3)); stp.style.transform = `rotate(-8deg) scale(${lerp(1.7, 1, CK.outCubic(k))})`; }
    }, dispose() { fx.dispose(); } };
  }
  return { 'cold-open': coldOpen };
}
