// Episode 3 story sets: open water, the Gulf map, the law of the lanes, the LNG carrier, the Tanker War
// (1984-88), archive photos and cards, the seafarers, the Khasab smugglers, helium. Same house set format
// and conventions as index.js:   const { preload, ...sets } = makeScenic(H); Object.assign(SETS, sets);
//
// Modes (params.mode), all bright (bright-day; golden where golden: true; the Tanker War in the warm
// 'archive' sea look inside the episode's bright LUT):
//   open-water   empty-lanes | calm-golden | lever | empty-lanes-high | final
//   gulf-map     countries (each lights on its word in params.words) | exit
//   lanes-law    territorial | tss | oman | both-outside | redrawn
//   lng-carrier  a Moss LNG carrier at sea
//   tanker-war   burning | stark | convoy | mine | mantis | dawn-cruiser | radar | airliner | frigate
//   photo        file 'roberts' (US Navy, PD; parallax + quote) | mode 'parliament-card' (a dated text card)
//   seafarers    crew at the rail of an anchored tanker, the waiting fleet beyond, then the quote
//   smugglers    dawn: speedboats racing into Khasab harbour between the Musandam cliffs
//   helium       an MRI scanner room, then a chip wafer (cue: 'chips')
import * as THREE from 'three';
import * as K from 'kit';
import * as CAM from '/engine/camera.js';
import * as SEA from '/engine/sea/index.js';
import * as PX from '/engine/parallax.js';
import * as GEO from './geo.js';
const { smoother, lerp, clamp, V, range, ease, MONO, SERIF, RED, NAVY, NAVY_SOFT, PAPER, SAND, TURQ, wt, div, plate, captions, look, seaSet, withLand, aerial, anchorage, canvasTex, rng } = GEO;
const SMOKE = SEA.SMOKE, D2R = Math.PI / 180;
const fwdOf = (h) => [Math.sin(h), -Math.cos(h)];
const apply = (camera, s) => CAM.apply(camera, s);
const ARCH = (o = {}) => look('archive', o);

export function makeScenic(H = {}) {
  const SETS = {
    // ================================================================ open-water
    async 'open-water'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const mode = P.mode ?? 'empty-lanes';
      const golden = mode === 'calm-golden' || mode === 'final' || P.golden;
      const lk = mode === 'final' ? look('golden', { sunEl: 3.2, sunAz: 286, exposure: 1.06 }) : mode === 'calm-golden' ? look('golden', { sunEl: 5.5, sunAz: 268 })
        : mode === 'empty-lanes-high' ? look('bright-day', { sunEl: 58, sunAz: 330 }) : mode === 'lever' ? look('bright-day', { sunEl: 66, sunAz: 200 }) : look('bright-day', { sunEl: 40, sunAz: 292 });
      const calm = mode === 'calm-golden' || mode === 'final';
      const S = seaSet(ctx, shot, { look: lk, spectrum: calm ? { hs: 0.28, wind: 3 } : mode === 'empty-lanes' ? { hs: 0.7, wind: 6 } : {} });
      S.sea.environment();
      await withLand(S, { lod: mode === 'empty-lanes-high' ? 1 : 0 });
      const cap = captions(S.layer, shot, {}, H);
      const s0 = G.laneIn.nearest(...G.P.xz(26.56, 56.49)), q0 = G.laneIn.at(s0);
      let cam;
      if (mode === 'empty-lanes') {
        // gliding at 4 m along the empty inbound lane, a lane buoy passing close: the road with no traffic
        const buoy = SEA.ship('buoy', { seed: 3 }); S.sea.addShip(buoy); const [fx, fz] = fwdOf(q0.heading); buoy.place(q0.x + fx * 260 - fz * 70, q0.z + fz * 260 + fx * 70, 0, 0);
        cam = (t, k) => { const q = G.laneIn.at(s0 + 6 * t), [fx2, fz2] = fwdOf(q.heading), b = CAM.breath(t, 0.3, 2);
          return { pos: [q.x - fz2 * 20 + b.x, 4.2 + b.y, q.z + fx2 * 20], look: [q.x + fx2 * 2000 - fz2 * 150, 0, q.z + fz2 * 2000 + fx2 * 150], mm: 32, roll: b.r }; };
      } else if (mode === 'calm-golden') {
        const d = SEA.ship('dhow', { seed: 9 }); S.sea.addShip(d); d.place(q0.x - 1800, q0.z - 2600, 200, 2.5);
        cam = (t, k) => { const b = CAM.breath(t, 0.15, 3), yaw = (268 + lerp(-3, 3, k)) * D2R; return { pos: [q0.x + lerp(-30, 30, k), 2.2 + b.y, q0.z], look: [q0.x + Math.sin(yaw) * 3000, 40, q0.z - Math.cos(yaw) * 3000], mm: 45, roll: b.r }; };
      } else if (mode === 'lever') {
        // straight down from 900 m: a tanker crosses the frame in its lane, one in the other lane the other way: business as usual
        const a = SEA.ship('vlcc', { seed: 61, name: 'MARAN ORION', hullColor: '#22303f', deckColor: '#6b4436' }); S.sea.addShip(a); a.follow(G.laneIn, { s0: s0 - 260, speed: 7.4 });
        const sOut = G.laneOut.nearest(q0.x, q0.z); const b2 = SEA.ship('lng', { seed: 62 }); S.sea.addShip(b2); b2.follow(G.laneOut, { s0: sOut - 1500, speed: 8 });
        cam = (t, k) => { const st = a.pose(t, S.sea); const [fx, fz] = fwdOf(q0.heading); return { pos: [q0.x - fz * 900 + fx * 40 * k, 1300, q0.z + fx * 900 + fz * 40 * k], look: [q0.x - fz * 900 + fx * (40 * k + 1), 0, q0.z + fx * 900 + fz * (40 * k + 1)], up: [fx, 0, fz], mm: 28 }; };
        S._shadow = () => { const st = a.state; S.sea.shadows(V(st.x, 0, st.z), 250); };
      } else if (mode === 'empty-lanes-high') {
        // high over the strait: the lanes empty (ghost lines), ships waiting at anchor off both coasts
        for (const [lane, off] of [[G.laneIn, -1852], [G.laneIn, 1852], [G.laneOut, -1852], [G.laneOut, 1852]]) {
          const pts = []; for (let s = 0; s < lane.length; s += 600) { const q = lane.at(s), [fx, fz] = fwdOf(q.heading); pts.push([q.x - fz * off, q.z + fx * off]); }
          const m = GEO.ribbon(pts, { width: 140, y: 5, color: 0xe8f6ff, opacity: 0.3, glow: 1 }); S.sea.overlay.add(m); (S.ghosts ??= []).push(m); }
        anchorage(S.sea, [...(() => { const [x, z] = G.P.xz(26.32, 56.62); return [x, 0, z]; })()], { n: 16, r: 7000, seed: 21, heading: 330, minGap: 1100 });
        anchorage(S.sea, [...(() => { const [x, z] = G.P.xz(26.75, 56.05); return [x, 0, z]; })()], { n: 12, r: 6000, seed: 22, heading: 320, minGap: 1100 });
        const tg = G.P.xz(26.55, 56.38);
        cam = (t, k) => { const v = aerial([tg[0], 0, tg[1]], lerp(318, 326, k), 38, 16000); return { ...v, mm: 30 }; };
      } else {
        // final: on the glassy sea at golden hour, the sun on the horizon, one tanker far off in the glitter, Musandam in silhouette
        const far = SEA.ship('vlcc', { seed: 71, lite: true, hullColor: '#1e1f22' }); S.sea.addShip(far); const sf = G.laneOut.nearest(q0.x, q0.z); far.follow(G.laneOut, { s0: sf + 5200, speed: 6.5, dir: -1 });
        cam = (t, k) => { const b = CAM.breath(t, 0.08, 4), yaw = 286 * D2R; const px = q0.x + 2600, pz = q0.z + 2600;
          return { pos: [px + Math.sin(yaw) * lerp(0, 60, k), 1.6 + b.y, pz - Math.cos(yaw) * lerp(0, 60, k)], look: [px + Math.sin(yaw) * 4000, 26, pz - Math.cos(yaw) * 4000], mm: 40, roll: b.r * 0.5 }; };
      }
      return S.out((t, p) => {
        const k = smoother(p); apply(S.camera, cam(t, k));
        for (const m of S.ghosts ?? []) m.material.uniforms.uOp.value = 0.3 * ease(t, 0.5, 2.5);
        S._shadow?.();
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ================================================================ lng-carrier
    // A Moss LNG carrier laden out of the Gulf: the camera low off the bow quarter, the four domes passing.
    async 'lng-carrier'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 36, sunAz: 150 }), spectrum: { hs: 0.8, wind: 7 } });
      S.sea.environment(); await withLand(S, { lod: 1 });
      const s0 = G.laneOut.nearest(...G.P.xz(26.52, 56.56));
      const sh = SEA.ship('lng', { name: 'AL KHOR STAR', seed: 81 }); S.sea.addShip(sh); sh.follow(G.laneOut, { s0, speed: 8.5 });
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea), [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx, k = smoother(p), L = sh.length, b = CAM.breath(t, 0.5, 6);
        // starboard side, ahead of the bow, holding position while the ship slides past (camera speed < ship speed)
        const u = lerp(L * 0.62, L * 0.18, k), off = sh.beam / 2 + 85;
        apply(S.camera, { pos: [st.x + fx * u + sx * off + b.x, 16 + b.y, st.z + fz * u + sz * off], look: [st.x + fx * (u - 120), 14, st.z + fz * (u - 120)], mm: P.mm ?? 28, roll: b.r });
        S.sea.shadows(V(st.x + fx * (u - 80), 0, st.z + fz * (u - 80)), L * 0.45, 2048);
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ================================================================ tanker-war (1984-88)
    async 'tanker-war'(ctx, shot) {
      const mode = shot.params?.mode ?? 'burning';
      if (mode === 'radar') return radarScreen(ctx, shot, H);
      if (mode === 'airliner') return airliner(ctx, shot, H);
      return tankerWar(ctx, shot, H, mode);
    },

    // ================================================================ seafarers
    // On the main deck of a tanker at anchor: three crew at the rail in silhouette, the waiting fleet beyond
    // on a hazy golden sea; the IMO quote arrives on the last words.
    async seafarers(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const PE = await import('/engine/people/index.js'); await PE.preload({ wardrobe: ['casual_a', 'casual_b', 'military'] });
      const S = seaSet(ctx, shot, { look: look('golden', { sunEl: 11, sunAz: 248, hazeDensity: 1 / 11000, exposure: 1.05 }), spectrum: { hs: 0.35, wind: 3.5 } });
      S.sea.environment();
      const c = [52000, 0, 30000];
      const sh = SEA.ship('vlcc', { name: 'SEA PEARL', seed: 91, loaded: 0.9, anchored: true, deckColor: '#4e4a45' }); sh.wake = 0.3; S.sea.addShip(sh); sh.place(c[0], c[2], 330, 0);
      anchorage(S.sea, [c[0] + 3600, 0, c[2] - 2600], { n: 34, r: 5200, seed: 31, heading: 330, minGap: 750, avoid: [c[0], c[2], 900] });
      const yd = sh.depth - sh.draft, crew = [];
      const spots = [[-99, 27.2, 0.15, 'casual_a'], [-96.4, 26.9, -0.25, 'military'], [-88, 27.3, 0.4, 'casual_b']];
      for (const [x, z, ry, id] of spots) { const m = PE.person(id, { dress: { silhouette: true } }); m.root.position.set(x, yd + 0.02, z); m.root.rotation.y = ry; sh.body.add(m.root); crew.push(m); }
      const cap = captions(S.layer, shot, {}, H);
      // the quote: serif, light, on a plate bottom-left, arriving on the spoken quote
      const q0 = wt(shot, 'pleaded', Math.max(1, shot.duration - 4.5)) + 0.4;
      const pl = plate(S.layer, 'bl', 0.62);
      const qd = div(S.layer, `left:6%;bottom:16%;max-width:60%;${SERIF(3.4)}`, P.quote ?? '“Seafarers must not be targets.”');
      const by = div(S.layer, `left:6.2%;bottom:11%;${MONO(0.72, 'rgba(251,248,242,.85)')}`, P.by ?? '');
      return S.out((t, p) => {
        sh.update(t, S.sea);
        crew.forEach((m, i) => m.blend([[i === 1 ? 'idle_b' : 'idle', t + i * 2.3, 1]]).update());
        const k = smoother(p), b = CAM.breath(t, 0.04, 5);
        const loc = V(lerp(-108, -111, k), yd + 1.62 + b.y, 17.5 + b.x), aim = V(-58, yd - 3, 70);
        const wp = sh.worldOf(loc.toArray()), wa = sh.worldOf(aim.toArray());
        apply(S.camera, { pos: wp.toArray(), look: wa.toArray(), mm: P.mm ?? 30, roll: b.r });
        S.sea.shadows(sh.worldOf([-95, 0, 22]), 40, 2048);
        S.pres.draw(S.camera, t, { near: 0.1 });
        const qk = ease(t, q0, q0 + 0.8); qd.style.opacity = qk; by.style.opacity = ease(t, q0 + 0.5, q0 + 1.2); pl.style.opacity = qk;
        cap(t);
      });
    },

    // ================================================================ smugglers
    // Dawn at Khasab: Musandam's limestone walls in layers of haze, a breakwater, and the speedboats racing in
    // from the strait in loose file, rooster tails catching the low sun.
    async smugglers(ctx, shot) {
      const P = shot.params ?? {};
      const S = seaSet(ctx, shot, { look: look('dawn', { sunAz: 64, sunEl: 5 }), spectrum: { hs: 0.3, wind: 3 } });
      S.sea.environment();
      const cliffs = await fjord(S.sea);
      const boats = [], r = rng(17), n = P.n ?? 14;
      for (let i = 0; i < n; i++) { const b = SEA.ship('speedboat', { seed: 120 + i, color: ['#e9e6de', '#dfe4e8', '#ece7da', '#c9d3d8'][i % 4], stripe: ['#2a4f7a', '#8a2c22', '#2f6b5a', '#2a4f7a'][i % 4] }); S.sea.addShip(b); boats.push({ b, lane: (r() - 0.5) * 220 + 10, start: 170 + i * 85 + r() * 50, v: 15 + r() * 4 }); }
      const dh = []; for (let i = 0; i < 5; i++) { const d = SEA.ship('dhow', { seed: 140 + i }); S.sea.addShip(d); d.place(-260 - i * 28, 380 + i * 14, 175 + i * 3, 0); d.wake = 0.2; dh.push(d); }
      const spray = sprayPts(S.sea, n);
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        // boats run south (heading 182) down the bay towards the camera at the harbour mouth, then swing to port for the quay
        boats.forEach(({ b, lane, start, v }) => { const d = start - v * (t + 2); const turn = smoother(clamp((120 - d) / 200));
          const x = lane * (1 - turn * 0.6) - turn * 140, z = -d; b.place(x, z, 182 + turn * 40, v * (1 - turn * 0.4)); b.fixed.x -= Math.sin(b.fixed.heading) * b.fixed.speed * t; b.fixed.z += Math.cos(b.fixed.heading) * b.fixed.speed * t; b.pose(t, S.sea); });
        spray(t, boats.map(o => o.b));
        const k = smoother(p), b = CAM.breath(t, 0.25, 7);
        apply(S.camera, { pos: [70 + b.x, 2.6 + b.y, 160], look: [lerp(-10, 40, k), 14, -900], mm: P.mm ?? 50, roll: b.r });
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ================================================================ gulf-map, lanes-law, photo, helium: below
    async 'gulf-map'(ctx, shot) { return gulfMap(ctx, shot, H); },
    async 'lanes-law'(ctx, shot) { return lanesLaw(ctx, shot, H); },
    async photo(ctx, shot) { return photoSet(ctx, shot, H, SETS); },
    async helium(ctx, shot) { return helium(ctx, shot, H); },
  };
  return { async preload() { await GEO.load(); }, ...SETS };
}

// ==================================================================== the Tanker War, in the archive sea look
async function tankerWar(ctx, shot, H, mode) {
  const P = shot.params ?? {}; const G = await GEO.load();
  const LK = { burning: ARCH({ sunEl: 6, sunAz: 262 }), stark: ARCH({ sunEl: 5, sunAz: 268, hazeDensity: 1 / 9000 }), convoy: ARCH({ sunEl: 26, sunAz: 225, grain: 0.032 }),
    mine: ARCH({ sunEl: 12, sunAz: 100 }), mantis: ARCH({ sunEl: 9, sunAz: 250 }), 'dawn-cruiser': { ...look('dawn', { sunEl: 2.5, sunAz: 96 }), sat: 0.82, lift: 0.03, grain: 0.03, vignette: 0.28, tint: [1.03, 0.99, 0.92] },
    frigate: ARCH({ sunEl: 30, sunAz: 210 }) }[mode] ?? ARCH();
  const calm = mode === 'dawn-cruiser' || mode === 'stark';
  const S = seaSet(ctx, shot, { look: LK, spectrum: calm ? { hs: 0.35, wind: 3.5 } : { hs: 0.7, wind: 6 } });
  S.sea.environment();
  if (mode === 'convoy' || mode === 'frigate') await withLand(S, { lod: 2 });
  const cap = captions(S.layer, shot, {}, H);
  const plumes = []; let cam, shadow;
  if (mode === 'burning') {
    const sh = SEA.ship('vlcc', { era: '1980s', name: 'AL FUNTAS', seed: 201, loaded: 0.85, hullColor: '#2b2a28', deckColor: '#6b4436' }); sh.wake = 0.25; S.sea.addShip(sh); sh.place(0, 0, 200, 0.3);
    plumes.push(SMOKE.smoke(S.sea, { at: () => { const st = sh.state, [fx, fz] = fwdOf(st.heading); return [st.x + fx * 40, 24, st.z + fz * 40]; }, height: 900, radius: 22, spread: 5.5, rise: 11, wind: [7, 2], dark: 0.05, fire: 1, n: 170, seed: 5 }));
    cam = (t, k) => { const b = CAM.breath(t, 0.6, 4); return { pos: [-2300 + lerp(0, 120, k) + b.x, 18 + b.y, 600], look: [80, 160, 0], mm: 60, roll: b.r }; };
  } else if (mode === 'stark' || mode === 'frigate') {
    const f = SEA.ship('ffg7', { number: mode === 'stark' ? '31' : '58', seed: 211, flag: 'us' }); S.sea.addShip(f);
    if (mode === 'stark') { f.place(0, 0, 175, 1.0); f.extraUpdate = (t, sea, st) => { f.body.rotation.x += -4 * D2R; f.body.position.y -= 0.4; };
      plumes.push(SMOKE.smoke(S.sea, { at: () => f.worldOf([8, 6, -5.5]).toArray(), height: 260, radius: 6, spread: 6, rise: 6, wind: [5, -1.5], dark: 0.12, fire: 0.25, n: 120, seed: 9, opacity: 0.85 }));
      cam = (t, k) => { const b = CAM.breath(t, 0.4, 3); return { pos: [1250 - lerp(0, 220, k) + b.x, 6 + b.y, 330], look: [0, 22, 0], mm: 85, roll: b.r }; };
    } else { const s0 = G.laneIn.nearest(...G.P.xz(26.55, 56.5)); f.follow(G.laneIn, { s0, speed: 8 });
      cam = (t, k) => { const st = f.state, [fx, fz] = fwdOf(st.heading), b = CAM.breath(t, 1, 4); return { pos: [st.x + fx * lerp(160, 60, k) - fz * 240 + b.x, 40 + b.y, st.z + fz * lerp(160, 60, k) + fx * 240], look: [st.x - fx * 20, 6, st.z - fz * 20], mm: 35, roll: b.r }; }; }
    shadow = () => S.sea.shadows(V(f.state.x, 0, f.state.z), 90);
  } else if (mode === 'convoy') {
    const s0 = G.laneIn.nearest(...G.P.xz(26.52, 56.6)), v = 7;
    const lead = SEA.ship('ffg7', { number: '41', seed: 221, flag: 'us' }); S.sea.addShip(lead); lead.follow(G.laneIn, { s0: s0 + 900, speed: v });
    const tk = SEA.ship('vlcc', { era: '1980s', name: 'BRIDGETON', port: 'PHILADELPHIA', seed: 222, loaded: 0.95, flag: 'us', hullColor: '#2b2a28', deckColor: '#6b4436' }); S.sea.addShip(tk); tk.follow(G.laneIn, { s0, speed: v });
    const tk2 = SEA.ship('vlcc', { era: '1980s', name: 'GAS PRINCE', seed: 223, loaded: 0.6, flag: 'us', hullColor: '#3b2725', deckColor: '#5a5b52', L: 240, B: 40 }); S.sea.addShip(tk2); tk2.follow(G.laneIn, { s0: s0 - 700, speed: v });
    const rear = SEA.ship('cruiser', { number: '48', seed: 224, flag: 'us' }); S.sea.addShip(rear); rear.follow(G.laneIn, { s0: s0 - 1400, speed: v });
    cam = (t, k) => { const st = tk.pose(t, S.sea), [fx, fz] = fwdOf(st.heading), b = CAM.breath(t, 2, 4); return { pos: [st.x - fx * lerp(700, 560, k) + fz * 1500 + b.x, lerp(560, 500, k) + b.y, st.z - fz * lerp(700, 560, k) - fx * 1500], look: [st.x + fx * 120, 0, st.z + fz * 120], mm: 28, roll: b.r }; };
    shadow = () => S.sea.shadows(V(tk.state.x, 0, tk.state.z), 260);
  } else if (mode === 'mine') {
    const m = SEA.ship('mine', { seed: 231 }); S.sea.addShip(m); m.place(0, 0, 0, 0);
    const tk = SEA.ship('vlcc', { era: '1980s', name: 'BRIDGETON', seed: 222, loaded: 0.95, flag: 'us', hullColor: '#2b2a28', deckColor: '#6b4436' }); S.sea.addShip(tk); tk.place(-650, -420, 85, 7);
    const tW = wt(shot, P.word ?? 'mine', shot.duration * 0.6);
    cam = (t, k) => { const b = CAM.breath(t, 0.06, 3), push = ease(t, tW - 0.3, tW + 1.2); return { pos: [lerp(5.5, 3.8, push) + b.x, 1.05 + b.y * 0.6, lerp(6.5, 4.8, push)], look: [lerp(-30, 0, push), lerp(4, 0.15, push), lerp(-60, 0, push)], mm: lerp(30, 40, push), roll: b.r }; };
  } else if (mode === 'mantis') {
    const pf = SEA.ship('platform', { seed: 241 }); S.sea.addShip(pf); pf.place(0, 0, 30, 0);
    plumes.push(SMOKE.smoke(S.sea, { at: [0, 26, 0], area: [30, 20], height: 700, radius: 16, spread: 5, rise: 9, wind: [6, 1.5], dark: 0.06, fire: 1, n: 160, seed: 13 }));
    const f = SEA.ship('ffg7', { number: '58', seed: 242, flag: 'us' }); S.sea.addShip(f); f.place(-700, 1350, 95, 8);
    cam = (t, k) => { const b = CAM.breath(t, 0.5, 4); return { pos: [-450 + lerp(0, 120, k) + b.x, 8 + b.y, 2600], look: [-280, 90, 0], mm: 60, roll: b.r }; };
    shadow = () => S.sea.shadows(V(f.state.x, 0, f.state.z), 90);
  } else if (mode === 'dawn-cruiser') {
    const c = SEA.ship('cruiser', { number: '49', seed: 251, flag: 'us' }); S.sea.addShip(c); c.place(0, 0, 300, 4);
    cam = (t, k) => { const st = c.state, [fx, fz] = fwdOf(st.heading), b = CAM.breath(t, 0.2, 3); return { pos: [st.x + fx * lerp(180, 40, k) + fz * 520 + b.x, 7 + b.y, st.z + fz * lerp(180, 40, k) - fx * 520], look: [st.x + fx * 20, 14, st.z + fz * 20], mm: 50, roll: b.r }; };
    shadow = () => S.sea.shadows(V(c.state.x, 0, c.state.z), 100);
  }
  return S.out((t, p) => {
    const k = smoother(p); apply(S.camera, cam(t, k));
    for (const pl of plumes) pl.update(t + 200);
    shadow?.();
    S.pres.draw(S.camera, t);
    cap(t);
  });
}

// spray particles for the speedboats (white, catching the sun)
function sprayPts(sea, nBoats, per = 60) {
  const n = nBoats * per, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ color: new THREE.Color(2.4, 2.2, 2.0), size: 0.9, transparent: true, opacity: 0.55, depthWrite: false, map: new THREE.CanvasTexture(c) });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; sea.overlay.add(pts);
  const r = rng(77), seeds = Array.from({ length: n }, () => [r(), r(), r(), r()]);
  return (t, boats) => { const a = g.attributes.position.array;
    for (let b = 0; b < boats.length; b++) { const st = boats[b].state, fx = Math.sin(st.heading), fz = -Math.cos(st.heading), sx = -fz, sz = fx, L = boats[b].length;
      for (let k = 0; k < per; k++) { const i = b * per + k, [s0, s1, s2, s3] = seeds[i]; const age = ((t * 1.6 + s0) % 1);
        const back = L * 0.5 + age * 16 * (0.5 + s1), up = Math.sin(age * Math.PI) * (1.6 + s2 * 2.2), lat = (s3 - 0.5) * (1.2 + age * 5);
        a[i * 3] = st.x - fx * back + sx * lat; a[i * 3 + 1] = up; a[i * 3 + 2] = st.z - fz * back + sz * lat; } }
    g.attributes.position.needsUpdate = true; };
}

// Musandam fjord walls (procedural, real scale: 300-700 m limestone walls) round a bay 1.6 km wide, in
// three layers of ridges that the dawn haze separates; rock texture from the PBR library (Poly Haven, CC0).
async function fjord(sea) {
  const load = (u, srgb) => new THREE.TextureLoader().loadAsync(u).then(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; });
  const [ra, rn] = await Promise.all([load('/assets/pbr/stone.a.jpg', true), load('/assets/pbr/stone.n.jpg', false)]);
  ra.repeat.set(1, 1); rn.repeat.set(1, 1);
  const mat = new THREE.MeshStandardMaterial({ map: ra, normalMap: rn, color: 0xb9a690, roughness: 0.95, metalness: 0 });
  const g = new THREE.Group(); sea.scene.add(g);
  const noise = (x, y) => Math.sin(x * 0.0021 + 1.3) * 0.5 + Math.sin(x * 0.0057 + y * 0.003) * 0.3 + Math.sin(x * 0.013 + 2) * 0.15 + Math.sin(x * 0.041 + y * 0.02) * 0.05;
  // a wall: a strip along z (from zA to zB) at lateral x0 facing +-x, height H(z), steep face with ledges
  const wall = (x0, side, zA, zB, H0, seed) => {
    const nz = 220, ny = 40, geo = new THREE.PlaneGeometry(1, 1, nz, ny), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const u = uv.getX(i), v = uv.getY(i), z = lerp(zA, zB, u);
      const H = H0 * (0.75 + 0.35 * noise(z + seed * 977, seed));
      const y = v * H - 30;
      const gully = Math.pow(Math.abs(Math.sin(z * 0.011 + seed * 3.1)), 6) * 60 + Math.pow(Math.abs(Math.sin(z * 0.027 + seed)), 8) * 25;
      const out = Math.pow(1 - v, 1.6) * H * 0.6 * (0.8 + 0.4 * noise(z * 1.7, seed * 3)) + Math.sin(z * 0.004 + seed) * 120 + gully * (1 - v * 0.5) + Math.sin(v * 9 + z * 0.01) * 6 + Math.max(0, -y) * 2;
      p.setXYZ(i, x0 + side * out, y, z); uv.setXY(i, z / 260, y / 260); }
    geo.computeVertexNormals(); if (side > 0) { const idx = geo.index.array; for (let i = 0; i < idx.length; i += 3) { const t2 = idx[i]; idx[i] = idx[i + 1]; idx[i + 1] = t2; } geo.computeVertexNormals(); }
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  wall(-850, -1, 600, -9000, 520, 1); wall(900, 1, 600, -9000, 600, 2);
  wall(-2600, -1, -5000, -16000, 900, 3); wall(2700, 1, -5000, -16000, 950, 4);
  wall(-6000, -1, -12000, -26000, 1200, 5);
  // the breakwater at the harbour mouth: a rubble mound
  const bw = new THREE.Mesh(new THREE.CylinderGeometry(6, 14, 8, 10, 1).scale(1, 1, 1), mat); bw.scale.set(1, 1, 18); bw.position.set(-140, 0, 120); g.add(bw);
  return g;
}

// ==================================================================== gulf-map
async function gulfMap(ctx, shot, H) {
  const P = shot.params ?? {}; const G = await GEO.load(); const exit = P.mode === 'exit';
  const S = seaSet(ctx, shot, { look: look('map', { sunEl: 42, sunAz: 130, hazeDensity: 1 / 500000 }), spectrum: { hs: 0.2 } });
  S.sea.environment();
  const ar = await SEA.land(S.sea, 'arabia', { root: GEO.ROOT + 'imagery/', exaggeration: 3, segments: 160, deepCut: 1e9, darkCut: false, cut: -4 });
  S.sea.scene.add(ar.group); ar.setCurvature(0); S.sea.ocean.U.uCurv.value = 0; S.sea.water = P.water ?? true;
  const xz = (la, lo) => ar.projection.xz(la, lo);
  const lb = GEO.labels(S.layer);
  const NAMES = { Kuwait: 'Kuwait', Iraq: 'Iraq', Bahrain: 'Bahrain', Qatar: 'Qatar', Saudi: 'Saudi Arabia', Emirates: 'United Arab Emirates', Iran: 'Iran', Oman: 'Oman' };
  const LBL = { Kuwait: [29.2, 47.6], Iraq: [30.9, 46.6], Bahrain: [26.05, 50.55], Qatar: [25.3, 51.2], 'Saudi Arabia': [26.0, 48.6], 'United Arab Emirates': [24.0, 54.2], Iran: [28.6, 51.9], Oman: [25.9, 56.3] };
  const words = P.words ?? Object.keys(NAMES).slice(0, 7);
  const items = [];
  const fillMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
  for (const w of exit ? [] : words) {
    const name = NAMES[w] ?? w, c = G.vec.countries.find(x => x.name === name); if (!c) continue;
    const meshes = [], rings = [];
    for (const poly of c.polys) { if (poly.length < 4) continue; const pts = poly.map(([lo, la]) => xz(la, lo)); const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, fillMat(w === 'Iran' ? 0xe6cf9f : 0xfbf8f2)); m.position.y = 9000; m.renderOrder = 41; S.sea.overlay.add(m); meshes.push(m);
      const r = GEO.ribbon([...pts, pts[0]], { width: 3500, y: 9500, color: 0xffffff, opacity: 0, glow: 1.4, depthTest: false }); S.sea.overlay.add(r); rings.push(r); }
    const t0 = wt(shot, w, 0.6 + items.length * 1.2);
    const [la, lo] = LBL[name]; lb.add(name.toUpperCase(), V(...(() => { const [x, z] = xz(la, lo); return [x, 9000, z]; })()), { dot: false, dy: 0, size: w === 'Iran' || w === 'Saudi' ? 1.2 : 0.9, show: (t) => ease(t, t0, t0 + 0.4) });
    items.push({ meshes, rings, t0 });
  }
  const gulfC = (() => { const [x, z] = xz(27.0, 51.3); return V(x, 0, z); })(), hz = (() => { const [x, z] = xz(26.56, 56.45); return V(x, 0, z); })();
  let arrow = null;
  if (exit) {
    const path = [[28.9, 49.4], [27.6, 50.9], [26.6, 53.0], [26.25, 55.2], [26.55, 56.45], [25.9, 57.3], [24.6, 58.6]].map(([la, lo]) => xz(la, lo));
    const pts = []; for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < 20; k++) { const f = k / 20; pts.push([lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f)]); } pts.push(path.at(-1));
    arrow = GEO.ribbon(pts, { width: 26000, y: 9000, color: 0x17d0d4, opacity: 0.9, glow: 1.5, depthTest: false }); S.sea.overlay.add(arrow);
    lb.add('PERSIAN GULF', V(gulfC.x, 9000, gulfC.z), { dot: false, dy: 0, size: 1.2, t0: 0.3 });
    lb.add('ONE WAY OUT', V(hz.x, 9000, hz.z), { accent: RED, dx: 70, dy: -80, align: 'left', size: 1.3, sub: 'THE STRAIT OF HORMUZ', t0: wt(shot, 'one', 1.4) });
    lb.add('GULF OF OMAN', V(...(() => { const [x, z] = xz(24.9, 58.2); return [x, 9000, z]; })()), { dot: false, dy: 0, size: 0.9, t0: 2.4 });
  } else lb.add('PERSIAN GULF', V(gulfC.x, 9000, gulfC.z), { dot: false, dy: 0, size: 1.25, t0: wt(shot, 'body', shot.duration - 2) });
  GEO.div(S.layer, `right:4.2%;bottom:4.6%;${MONO(0.62, 'rgba(251,248,242,.85)', 0.16)}`, 'BORDERS: NATURAL EARTH · IMAGERY: NASA BLUE MARBLE');
  const cap = captions(S.layer, shot, {}, H);
  return S.out((t, p) => {
    const k = smoother(p);
    if (exit) { const c = gulfC.clone().lerp(hz, lerp(0.15, 0.85, k)), alt = lerp(1.9e6, 1.1e6, k); apply(S.camera, { pos: [c.x - alt * 0.1, alt, c.z + alt * 0.55], look: [c.x, 0, c.z], mm: 35 });
      arrow.material.uniforms.uDraw.value = arrow.userData.length * ease(t, 0.6, 3.2); }
    else { const alt = lerp(2.3e6, 1.95e6, k); apply(S.camera, { pos: [gulfC.x + lerp(-50e3, 40e3, k), alt, gulfC.z + alt * 0.5], look: [gulfC.x + lerp(-30e3, 40e3, k), 0, gulfC.z], mm: 35 }); }
    for (const it of items) { const a = ease(t, it.t0, it.t0 + 0.35), last = items.at(-1).t0 + 1.6; const hold = 1 - 0.55 * ease(t, it.t0 + 1.2, it.t0 + 2) * (1 - ease(t, last, last + 0.8));
      it.meshes.forEach(m => m.material.opacity = 0.42 * a * hold); it.rings.forEach(r => r.material.uniforms.uOp.value = 0.95 * a * hold); }
    S.pres.draw(S.camera, t, { haze: 0.2 });
    lb.update(S.camera, t, S.W, S.H);
    cap(t);
  });
}

// ==================================================================== lanes-law
// The narrows as a top-down map (Sentinel-2 + relief): the 12 nm territorial seas grow from each coast
// (a distance field from Natural Earth's land), the IMO lanes, Oman's waters, the treaty circle, Iran's redrawn lanes.
let TERR = null;
function territory(G, half = 90000, N = 512) {
  if (TERR) return TERR;
  // rasterise land per country in the local frame (x east, z south), cell = 2 half / N
  const cell = 2 * half / N, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
  const draw = (name, col) => { const ct = G.vec.countries.find(q => q.name === name); x.fillStyle = col; for (const poly of ct.polys) { x.beginPath(); poly.forEach(([lo, la], i) => { const [px, pz] = G.P.xz(la, lo); const u = (px + half) / cell, v = (pz + half) / cell; i ? x.lineTo(u, v) : x.moveTo(u, v); }); x.closePath(); x.fill(); } };
  x.fillStyle = '#000'; x.fillRect(0, 0, N, N); draw('Iran', '#ff0000'); draw('Oman', '#00ff00'); draw('United Arab Emirates', '#0000ff');
  const img = x.getImageData(0, 0, N, N).data;
  // islands too small for Natural Earth's polygons at this scale: Larak and the Quoins, as discs
  const isl = [[26.855, 56.375, 2800, 0], [26.508, 56.512, 900, 1], [26.48, 56.53, 700, 1]];
  const edt = (mask) => { const INF = 1e9, d = new Float32Array(N * N); for (let i = 0; i < N * N; i++) d[i] = mask[i] ? 0 : INF;
    const s = Math.SQRT2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i; let v = d[k]; if (i) v = Math.min(v, d[k - 1] + 1); if (j) { v = Math.min(v, d[k - N] + 1); if (i) v = Math.min(v, d[k - N - 1] + s); if (i < N - 1) v = Math.min(v, d[k - N + 1] + s); } d[k] = v; }
    for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) { const k = j * N + i; let v = d[k]; if (i < N - 1) v = Math.min(v, d[k + 1] + 1); if (j < N - 1) { v = Math.min(v, d[k + N] + 1); if (i < N - 1) v = Math.min(v, d[k + N + 1] + s); if (i) v = Math.min(v, d[k + N - 1] + s); } d[k] = v; }
    return d; };
  const mI = new Uint8Array(N * N), mO = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) { mI[i] = img[i * 4] > 128; mO[i] = img[i * 4 + 1] > 128; }
  for (const [la, lo, r, who] of isl) { const [px, pz] = G.P.xz(la, lo); const ci = (px + half) / cell, cj = (pz + half) / cell, rr = r / cell; for (let j = Math.floor(cj - rr); j <= cj + rr; j++) for (let i = Math.floor(ci - rr); i <= ci + rr; i++) if ((i - ci) ** 2 + (j - cj) ** 2 <= rr * rr && i >= 0 && j >= 0 && i < N && j < N) (who ? mO : mI)[j * N + i] = 1; }
  const dI = edt(mI), dO = edt(mO), data = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) { data[i * 4] = Math.min(255, dI[i] * cell / 40000 * 255); data[i * 4 + 1] = Math.min(255, dO[i] * cell / 40000 * 255); data[i * 4 + 2] = (mI[i] || mO[i]) ? 255 : 0; data[i * 4 + 3] = 255; }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); tex.flipY = false; tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return (TERR = { tex, half });
}
async function lanesLaw(ctx, shot, H) {
  const P = shot.params ?? {}; const G = await GEO.load(); const mode = P.mode ?? 'territorial';
  const S = seaSet(ctx, shot, { look: look('map', { sunEl: 52, sunAz: 150, exposure: 1.04 }), spectrum: { hs: 0.4 } });
  S.sea.environment();
  const land = await withLand(S, { lod: 1, depthLevel: 1 }); land.setCurvature(0); S.sea.ocean.U.uCurv.value = 0;
  const T = territory(G);
  const NM = 1852, D = shot.duration;
  // timing per mode (word cues)
  const tGrow = mode === 'territorial' ? [wt(shot, 'twelve', 1.0), wt(shot, 'twelve', 1.0) + 2.4] : [0, 0.01];
  const tOver = mode === 'territorial' ? wt(shot, 'more', 5) : 1e9;
  const showI = { territorial: 1, tss: 0.25, oman: 0.25, 'both-outside': 0.0, redrawn: 0.9 }[mode], showO = { territorial: 1, tss: 0.25, oman: 1, 'both-outside': 0, redrawn: 0.3 }[mode];
  const bandMat = new THREE.ShaderMaterial({ uniforms: { tT: { value: T.tex }, uR: { value: 0 }, uI: { value: 0 }, uO: { value: 0 }, uOv: { value: 0 }, uHalf: { value: T.half } },
    vertexShader: 'varying vec2 vXZ; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vXZ = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D tT; uniform float uR, uI, uO, uOv, uHalf; varying vec2 vXZ;
      void main(){ vec2 uv = (vXZ + uHalf) / (2. * uHalf); vec4 d = texture2D(tT, uv); if (d.b > .5) discard;
        float dI = d.r * 40000., dO = d.g * 40000., aa = 220.;
        float bi = smoothstep(uR + aa, uR - aa, dI), bo = smoothstep(uR + aa, uR - aa, dO);
        float ei = smoothstep(260., 0., abs(dI - uR)) * step(1., uR), eo = smoothstep(260., 0., abs(dO - uR)) * step(1., uR);
        vec3 ci = vec3(.90, .74, .45), co = vec3(.12, .72, .72);
        float ai = bi * uI * .34, ao = bo * uO * .34;
        vec3 c = ci * ai + co * ao * (1. - ai); float a = ai + ao * (1. - ai);
        float ov = bi * bo * uOv; float hatch = smoothstep(.45, .55, fract((vXZ.x + vXZ.y) / 1400.));
        float ah = ov * (.18 + .5 * hatch); c = c * (1. - ah) + vec3(1.) * ah; a = a + ah * (1. - a);
        float ae = clamp((ei * uI + eo * uO) * .75, 0., 1.); c = c * (1. - ae) + vec3(1.) * ae; a = a + ae * (1. - a);
        gl_FragColor = vec4(c / max(a, 1e-4), a); }`,
    transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(2 * T.half, 2 * T.half).rotateX(-Math.PI / 2), bandMat); band.position.y = 60; band.renderOrder = 38; S.sea.overlay.add(band);
  // TSS: lanes (2 nm), separation zone, labels
  const tssW = []; for (const w of G.tssLocal) { if (w.type === 'separation_zone') { const sh = new THREE.Shape(w.pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false })); m.position.y = 80; m.renderOrder = 42; S.sea.overlay.add(m); tssW.push(m); m.userData.k = 0.6; } }
  const laneR = (lane, col) => { const m = GEO.ribbon(sample(lane, 20000, lane.length - 20000), { width: 2 * NM, y: 70, color: col, opacity: 0, glow: 1.1, depthTest: false }); S.sea.overlay.add(m); return m; };
  const lIn = laneR(G.laneIn, 0x8fe3ff), lOut = laneR(G.laneOut, 0xffd27a);
  const lb = GEO.labels(S.layer);
  const [na, nb] = (() => { const n = G.facts.narrowest, a = G.P.xz(...n.a), b = G.P.xz(...n.b); return [V(a[0], 0, a[1]), V(b[0], 0, b[1])]; })();
  const mid = na.clone().lerp(nb, 0.5);
  const show = { lanes: mode === 'tss' || mode === 'oman' ? 1 : mode === 'redrawn' ? 0.25 : 0 };
  // per-mode annotation
  const extras = [];
  if (mode === 'territorial') {
    lb.add('IRAN · 12 NM', V(na.x - 9000, 0, na.z + 6000), { dot: false, dy: 0, size: 1.0, show: (t) => ease(t, tGrow[0] + 0.8, tGrow[0] + 1.3) });
    lb.add('OMAN · 12 NM', V(nb.x + 9000, 0, nb.z - 2000), { dot: false, dy: 0, size: 1.0, show: (t) => ease(t, tGrow[0] + 1.0, tGrow[0] + 1.5) });
    lb.add('12 + 12 = 24 > 21', mid, { dx: 140, dy: -20, align: 'left', size: 1.25, accent: '#ffffff', sub: 'NO HIGH SEAS AT THE NARROWEST POINT', show: (t) => ease(t, tOver, tOver + 0.5) });
    const wl = GEO.ribbon([[na.x, na.z], [nb.x, nb.z]], { width: 300, y: 90, color: 0xffffff, opacity: 0.95, glow: 1.5, depthTest: false }); S.sea.overlay.add(wl); extras.push((t) => wl.material.uniforms.uDraw.value = wl.userData.length * ease(t, tOver - 0.4, tOver + 0.4));
  } else if (mode === 'tss') {
    const s = G.laneIn.nearest(mid.x, mid.z), q = G.laneIn.at(s), qo = G.laneOut.at(G.laneOut.nearest(mid.x, mid.z));
    const zc = new THREE.Vector3((q.x + qo.x) / 2, 0, (q.z + qo.z) / 2);
    const t1 = wt(shot, 'inbound', 2.5), t2 = wt(shot, 'buffer', 3.5), t3 = wt(shot, 'outbound', 4.5);
    lb.add('2 NM · INBOUND', V(q.x, 0, q.z), { dx: -60, dy: -60, align: 'right', size: 0.95, show: (t) => ease(t, t1, t1 + 0.4) });
    lb.add('2 NM · BUFFER', zc, { dx: 80, dy: -10, align: 'left', size: 0.95, show: (t) => ease(t, t2, t2 + 0.4) });
    lb.add('2 NM · OUTBOUND', V(qo.x, 0, qo.z), { dx: 60, dy: 60, align: 'left', size: 0.95, show: (t) => ease(t, t3, t3 + 0.4) });
    extras.push((t) => { lIn.material.uniforms.uOp.value = 0.32 * ease(t, t1 - 0.2, t1 + 0.4); tssW.forEach(m => m.material.opacity = 0.16 * ease(t, t2 - 0.2, t2 + 0.4)); lOut.material.uniforms.uOp.value = 0.32 * ease(t, t3 - 0.2, t3 + 0.4); });
  } else if (mode === 'oman') {
    const tR = wt(shot, 'Oman', D * 0.6);
    lb.add('OMANI WATERS', V(nb.x + 6000, 0, nb.z - 7000), { dot: false, dy: 0, size: 1.1, show: (t) => ease(t, 1.0, 1.6) });
    const ring = []; const c = G.laneIn.at(G.laneIn.nearest(mid.x, mid.z)), co = G.laneOut.at(G.laneOut.nearest(mid.x, mid.z)), rc = [(c.x + co.x) / 2, (c.z + co.z) / 2];
    for (let a = 0; a <= 72; a++) ring.push([rc[0] + Math.cos(a / 72 * Math.PI * 2 + 2) * 9000, rc[1] + Math.sin(a / 72 * Math.PI * 2 + 2) * 6500]);
    const rm = GEO.ribbon(ring, { width: 600, y: 95, color: 0xe0241b, opacity: 1, glow: 1.25, depthTest: false }); S.sea.overlay.add(rm);
    extras.push((t) => { rm.material.uniforms.uDraw.value = rm.userData.length * ease(t, tR, tR + 0.9); lIn.material.uniforms.uOp.value = lOut.material.uniforms.uOp.value = 0.3; tssW.forEach(m => m.material.opacity = 0.14); });
  } else if (mode === 'redrawn') {
    const tN = wt(shot, 'redrew', D * 0.55);
    const path = (pts) => { const p = pts.map(([la, lo]) => G.P.xz(la, lo)), out = []; for (let i = 0; i < p.length - 1; i++) for (let k = 0; k < 16; k++) { const f = k / 16; out.push([lerp(p[i][0], p[i + 1][0], f), lerp(p[i][1], p[i + 1][1], f)]); } out.push(p.at(-1)); return out; };
    // approximate, after the PMO chart reported by Maritime Executive (8 Apr 2026): inbound between Qeshm and Larak, outbound just south of Larak
    const inb = GEO.ribbon(path([[26.64, 56.80], [26.80, 56.54], [26.912, 56.41], [26.912, 56.33], [26.85, 56.20], [26.765, 56.08], [26.68, 55.96]]), { width: 1300, y: 75, color: 0xffb648, opacity: 0.85, glow: 1.4, depthTest: false });
    const outb = GEO.ribbon(path([[26.66, 55.99], [26.745, 56.15], [26.805, 56.32], [26.80, 56.43], [26.73, 56.57], [26.58, 56.80]]), { width: 1300, y: 75, color: 0xffe2a8, opacity: 0.85, glow: 1.4, depthTest: false });
    S.sea.overlay.add(inb, outb);
    const p1 = G.P.xz(26.905, 56.36), p2 = G.P.xz(26.80, 56.40);
    lb.add('INBOUND · BETWEEN QESHM AND LARAK', V(p1[0], 0, p1[1]), { dx: -40, dy: -60, align: 'right', size: 0.85, show: (t) => ease(t, tN + 0.9, tN + 1.4) });
    lb.add('OUTBOUND · SOUTH OF LARAK', V(p2[0], 0, p2[1]), { dx: 60, dy: 70, align: 'left', size: 0.85, show: (t) => ease(t, tN + 1.6, tN + 2.1) });
    lb.add('IMO LANES · “TRANSIT PROHIBITED”', V(mid.x + 5000, 0, mid.z + 6000), { dx: 60, dy: 50, align: 'left', size: 0.8, accent: RED, show: (t) => ease(t, tN - 0.5, tN) });
    extras.push((t) => { inb.material.uniforms.uDraw.value = inb.userData.length * ease(t, tN + 0.4, tN + 1.6); outb.material.uniforms.uDraw.value = outb.userData.length * ease(t, tN + 1.0, tN + 2.2);
      const dim = 1 - 0.6 * ease(t, tN - 0.4, tN + 0.4); lIn.material.uniforms.uOp.value = lOut.material.uniforms.uOp.value = 0.35 * dim; lIn.material.uniforms.uCol.value.setHex(0x8fe3ff).lerp(new THREE.Color(0xe0241b), ease(t, tN - 0.4, tN + 0.4) * 0.6); lOut.material.uniforms.uCol.value.copy(lIn.material.uniforms.uCol.value); });
    GEO.div(S.layer, `right:4.2%;bottom:4.6%;${MONO(0.62, 'rgba(251,248,242,.85)', 0.16)}`, 'SOURCE: MARITIME EXECUTIVE, 8 APR 2026 · ROUTES APPROXIMATE');
  }
  // both-outside: the treaty as a circle of member dots, the two flags left outside it
  let treaty = null;
  if (mode === 'both-outside') treaty = treatyGraphic(S.layer, shot);
  if (mode === 'territorial' || mode === 'oman' || mode === 'tss') GEO.div(S.layer, `right:4.2%;bottom:4.6%;${MONO(0.62, 'rgba(251,248,242,.85)', 0.16)}`, mode === 'tss' ? 'LANES: IMO / OPENSTREETMAP · IMAGERY: COPERNICUS SENTINEL-2' : '12 NM FROM THE COAST, SIMPLIFIED (NATURAL EARTH) · ILLUSTRATIVE');
  if (['territorial', 'oman'].includes(mode)) { lb.add('IRAN', V(30000, 0, -60000), { dot: false, size: 1.3, dy: 0, t0: 0.4 }); lb.add('OMAN', G.place('Musandam'), { dot: false, size: 1.3, dy: 40, t0: 0.4 }); }
  const cap = captions(S.layer, shot, { source: null }, H);
  const view = { territorial: [92e3, 0.3, 0.2], tss: [52e3, 0.5, 0.42], oman: [62e3, 0.2, 0.15], 'both-outside': [120e3, 0.1, 0.1], redrawn: [85e3, -0.15, -0.05] }[mode];
  const c0 = mode === 'redrawn' ? (() => { const [x, z] = G.P.xz(26.78, 56.42); return V(x, 0, z); })() : mid;
  return S.out((t, p) => {
    const k = smoother(p), alt = view[0] * lerp(1.06, 0.94, k), az = lerp(view[1], view[2], k);
    apply(S.camera, { pos: [c0.x + Math.sin(az) * alt * 0.3, alt, c0.z + Math.cos(az) * alt * 0.3], look: [c0.x, 0, c0.z], mm: 35 });
    const U = bandMat.uniforms; U.uR.value = mode === 'territorial' ? 12 * NM * ease(t, tGrow[0], tGrow[1]) : 12 * NM;
    U.uI.value = showI * (mode === 'redrawn' ? 0.3 + 0.7 * ease(t, wt(shot, 'redrew', D * 0.55), wt(shot, 'redrew', D * 0.55) + 0.6) : 1); U.uO.value = showO * ease(t, 0.2, 1.0); U.uOv.value = ease(t, tOver, tOver + 0.6);
    for (const f of extras) f(t);
    S.pres.draw(S.camera, t, { haze: 0.5, fade: mode === 'both-outside' ? 0.45 * ease(t, 0.2, 1.2) : 0, fadeCol: [0.06, 0.12, 0.2] });
    lb.update(S.camera, t, S.W, S.H);
    treaty?.(t);
    cap(t);
  });
}
function sample(lane, s0, s1, step = 500) { const out = []; for (let s = s0; s <= s1; s += step) { const q = lane.at(s); out.push([q.x, q.z]); } return out; }
// DOM/SVG graphic: a ring labelled UNCLOS packed with member dots; the Iranian and US flags outside it
function treatyGraphic(layer, shot) {
  const W = 1920, Hh = 1080, cx = 960, cy = 520, R = 300, r = rng(5);
  const flag = (k) => { const { c } = canvasTex(240, 150, (x, w, h) => { const t = SEA.DETAIL.flagTexture(k); x.drawImage(t.image, 0, 0, w, h); }); return c.toDataURL(); };
  const dots = []; for (let i = 0; i < 900 && dots.length < 150; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (R - 26); const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; if (dots.every(([px, py]) => Math.hypot(px - x, py - y) > 30)) dots.push([x, y, r()]); }
  const box = div(layer, 'inset:0'); box.innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" style="position:absolute;inset:0;width:100%;height:100%">
    <circle id="ring" cx="${cx}" cy="${cy}" r="${R}" fill="rgba(251,248,242,0.06)" stroke="#fbf8f2" stroke-width="3" stroke-dasharray="${2 * Math.PI * R}" stroke-dashoffset="${2 * Math.PI * R}"/>
    ${dots.map(([x, y, s], i) => `<circle class="d" data-s="${s}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#9fe3e0" opacity="0"/>`).join('')}
  </svg>`;
  const lab = div(layer, `left:50%;top:${(cy - R - 70) / Hh * 100}%;transform:translateX(-50%);${MONO(1.25)}`, 'UNCLOS');
  const sub = div(layer, `left:50%;top:${(cy + R + 26) / Hh * 100}%;transform:translateX(-50%);${MONO(0.7, 'rgba(251,248,242,.8)')}`, 'THE PARTIES TO THE LAW OF THE SEA TREATY');
  const mk = (k, side, title, note) => { const d = div(layer, `top:${(cy - 80) / Hh * 100}%;${side}:7%;text-align:center;width:22%`); d.innerHTML = `<img src="${flag(k)}" style="width:62%;box-shadow:0 6px 30px rgba(0,0,0,.35)"><div style="${MONO(1.0)};margin-top:.9em">${title}</div><div style="${MONO(0.66, 'rgba(251,248,242,.82)')};margin-top:.4em">${note}</div>`; return d; };
  const fI = mk('iran', 'left', 'IRAN', 'SIGNED 1982 · NEVER RATIFIED'), fU = mk('us', 'right', 'UNITED STATES', 'NOT A PARTY');
  const ring = box.querySelector('#ring'), ds = [...box.querySelectorAll('.d')];
  const tI = wt(shot, 'both', 1.2), tU = tI + 0.5;
  return (t) => { ring.setAttribute('stroke-dashoffset', 2 * Math.PI * R * (1 - ease(t, 0.3, 1.5))); lab.style.opacity = ease(t, 0.6, 1.1); sub.style.opacity = ease(t, 1.4, 2.0);
    ds.forEach(d => d.setAttribute('opacity', ease(t, 1.0 + +d.dataset.s * 1.2, 1.3 + +d.dataset.s * 1.2) * 0.85));
    fI.style.opacity = ease(t, tI, tI + 0.5); fI.style.transform = `translateX(${-30 * (1 - ease(t, tI, tI + 0.8))}px)`; fU.style.opacity = ease(t, tU, tU + 0.5); fU.style.transform = `translateX(${30 * (1 - ease(t, tU, tU + 0.8))}px)`; };
}

// ==================================================================== studio kit (non-sea sets)
// a plain three.js scene the runtime renders (ACES, sRGB); cards and screens use unlit, untonemapped materials
function studio(ctx, { fov = 35, bg = 0xf4efe6 } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.05, 5000);
  const layer = GEO.layerOf(ctx); const disp = [];
  return { scene, camera, layer, W: ctx.width, H: ctx.height, onDispose: (f) => disp.push(f),
    out(update) { return { scene, camera, layer, update, dispose() { disp.forEach(f => f()); scene.traverse(o => { o.geometry?.dispose?.(); }); layer.remove(); } }; } };
}
const unlit = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
// paper grain overlay for cards (stepped at 12 fps, like the map paper)
function paperGrain(x, w, h, seed) { const r = rng(seed); x.globalAlpha = 0.045; for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? '#000' : '#fff'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } x.globalAlpha = 1; }

// ---------------------------------------------------------------- tanker-war: radar (the Aegis combat information centre display)
// A large-screen tactical display, blue, as the CIC's big displays were: the strait's coastline from the real
// vectors, range rings, own ship, surface contacts, and one air track leaving Bandar Abbas to the south-west.
// Neutral symbols, no fabricated track data. The camera pushes slowly into the screen.
async function radarScreen(ctx, shot, H) {
  const P = shot.params ?? {}; const G = await GEO.load();
  const S = studio(ctx, { bg: 0x02060b, fov: 30 });
  const { c, x, tex } = canvasTex(1920, 1080);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), unlit(tex)); S.scene.add(scr);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), new THREE.MeshBasicMaterial({ color: 0x0b0f14 })); bezel.position.z = -0.01; S.scene.add(bezel);
  // projection: equirect around the ship, 1 px = 60 m
  const own = [26.62, 56.12], s = 1 / 105, ox = 900, oy = 600;
  const pxy = (la, lo) => { const dx = (lo - own[1]) * 111320 * Math.cos(own[0] * D2R), dy = (la - own[0]) * 110540; return [ox + dx * s, oy - dy * s]; };
  const coast = [...G.vec.coast, ...(G.vec.coastFine ?? [])];
  const BA = [27.218, 56.378], DXB = [25.25, 55.36];
  const r = rng(4), contacts = Array.from({ length: 14 }, () => [own[0] + (r() - 0.6) * 0.6, own[1] + (r() - 0.35) * 1.2, r()]).filter(([la]) => la < 26.85);
  const draw = (t) => {
    x.fillStyle = '#071a33'; x.fillRect(0, 0, 1920, 1080);
    const g = x.createRadialGradient(960, 540, 100, 960, 540, 1100); g.addColorStop(0, 'rgba(40,90,150,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = g; x.fillRect(0, 0, 1920, 1080);
    x.strokeStyle = 'rgba(120,180,255,0.18)'; x.lineWidth = 1.5; for (let rr = 1; rr <= 6; rr++) { x.beginPath(); x.arc(ox, oy, rr * 10 * 1852 * s, 0, Math.PI * 2); x.stroke(); }
    x.strokeStyle = '#b9e4ff'; x.lineWidth = 2.2; for (const line of coast) { x.beginPath(); line.forEach(([lo, la], i) => { const [px, py] = pxy(la, lo); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); }
    // the commercial air corridor (dashed) from Bandar Abbas towards Dubai
    x.setLineDash([14, 12]); x.strokeStyle = 'rgba(185,228,255,0.45)'; x.lineWidth = 2; x.beginPath(); x.moveTo(...pxy(...BA)); x.lineTo(...pxy(...DXB)); x.stroke(); x.setLineDash([]);
    x.font = '500 22px "Plex Mono", monospace'; x.fillStyle = 'rgba(185,228,255,0.8)'; x.fillText('BANDAR ABBAS', pxy(...BA)[0] + 16, pxy(...BA)[1] - 10);
    for (const [la, lo, q] of contacts) { const [px, py] = pxy(la, lo); x.strokeStyle = '#d8f0ff'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 7, Math.PI, 0); x.stroke(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.arc(ox, oy, 12, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + 30, oy - 12); x.stroke();
    // the air track: from the airport along the corridor, a leader showing its course, a history trail
    const f = clamp(0.02 + t / (shot.duration * 4.5)), la = lerp(BA[0], DXB[0], f), lo = lerp(BA[1], DXB[1], f), [px, py] = pxy(la, lo), [qx, qy] = pxy(lerp(BA[0], DXB[0], f + 0.06), lerp(BA[1], DXB[1], f + 0.06));
    for (let k = 1; k < 9; k++) { const fk = f - k * 0.006; if (fk < 0) break; const [hx, hy] = pxy(lerp(BA[0], DXB[0], fk), lerp(BA[1], DXB[1], fk)); x.fillStyle = `rgba(255,230,140,${0.6 - k * 0.06})`; x.fillRect(hx - 2, hy - 2, 4, 4); }
    const blink = 0.75 + 0.25 * Math.sin(t * 6);
    x.strokeStyle = `rgba(255,226,120,${blink})`; x.lineWidth = 3; x.beginPath(); x.arc(px, py, 13, Math.PI, 0); x.lineTo(px + 13, py + 2); x.stroke(); x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke();
    x.fillStyle = '#ffe278'; x.font = '600 24px "Plex Mono", monospace'; x.fillText('AIR TRACK', px + 22, py - 18);
    // the sweep (refresh) and scan lines
    const a = t * 2.1; const sw = x.createConicGradient(a, ox, oy); sw.addColorStop(0, 'rgba(150,210,255,0.16)'); sw.addColorStop(0.06, 'rgba(150,210,255,0)'); sw.addColorStop(1, 'rgba(150,210,255,0)'); x.fillStyle = sw; x.fillRect(0, 0, 1920, 1080);
    x.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = 0; yy < 1080; yy += 4) x.fillRect(0, yy, 1920, 1);
    x.font = '500 20px "Plex Mono", monospace'; x.fillStyle = 'rgba(185,228,255,0.7)'; x.fillText('RANGE RINGS 10 NM', 60, 1030); x.fillText('ILLUSTRATIVE RECONSTRUCTION', 1520, 1030);
    tex.needsUpdate = true;
  };
  const cap = captions(S.layer, shot, {}, H);
  // a soft reflection of the room on the glass (a gradient plane in front)
  const { tex: gt } = canvasTex(256, 256, (q, w, h) => { const g = q.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.03)'); q.fillStyle = g; q.fillRect(0, 0, w, h); });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), unlit(gt, { transparent: true, depthWrite: false })); glass.position.z = 0.005; S.scene.add(glass);
  return S.out((t, p) => { const k = smoother(p), b = CAM.breath(t, 0.004, 3);
    draw(t); apply(S.camera, { pos: [lerp(-0.35, -0.15, k) + b.x, lerp(0.06, 0.03, k) + b.y, lerp(2.75, 2.35, k)], look: [lerp(0.05, 0.15, k), 0.02, 0], mm: 40, roll: b.r });
    cap(t); });
}

// ---------------------------------------------------------------- tanker-war: airliner (Iran Air 655)
// Restraint: an Airbus A300 crosses a bright, clear sky, small, unhurried; nothing happens to it on screen.
// Then the frame fades to a paper memorial card. No explosion, no missile.
async function airliner(ctx, shot, H) {
  const P = shot.params ?? {}; const D = shot.duration;
  const S = studio(ctx, { bg: 0x7fb5e6, fov: 30 });
  // sky dome: deep blue zenith to a pale, hazy horizon, the sun up and behind the camera
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec3 vD; void main(){ float h = clamp(vD.y, 0., 1.); vec3 c = mix(vec3(.80,.87,.92), vec3(.22,.48,.80), pow(h, .55)); gl_FragColor = vec4(c, 1.); }' }));
  S.scene.add(sky);
  S.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x8a8478, 1.4)); const sun = new THREE.DirectionalLight(0xfff3e0, 2.4); sun.position.set(-0.4, 1, 0.6); S.scene.add(sun);
  const plane = a300(); S.scene.add(plane);
  // the memorial card
  const { tex } = canvasTex(1920, 1080, (x, w, h) => { x.fillStyle = PAPER; x.fillRect(0, 0, w, h); paperGrain(x, w, h, 655);
    x.fillStyle = NAVY; x.textAlign = 'center'; x.font = '400 120px "Instrument Serif", serif'; x.fillText('Iran Air Flight 655', w / 2, h * 0.42);
    x.font = '500 38px "Plex Mono", monospace'; x.fillStyle = NAVY_SOFT; x.fillText('3 JULY 1988', w / 2, h * 0.52);
    x.fillStyle = NAVY; x.font = '500 44px "Plex Mono", monospace'; x.fillText((P.caption ?? 'IRAN AIR 655 · 290 KILLED').includes('290') ? '290 PEOPLE ON BOARD · 66 CHILDREN' : P.caption, w / 2, h * 0.64);
    x.fillStyle = NAVY_SOFT; x.fillRect(w / 2 - 60, h * 0.565, 120, 2); });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, a: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: 'uniform sampler2D map; uniform float a; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb, a); }' }));
  card.frustumCulled = false; card.renderOrder = 100; S.scene.add(card);
  const tCard = Math.max(D * 0.55, wt(shot, 'passenger', D * 0.5));
  return S.out((t, p) => {
    const f = t / D; plane.position.set(lerp(-150, 150, f * 0.9), 240, -520); plane.rotation.set(0, Math.PI + 0.25, -0.04);
    apply(S.camera, { pos: [0, 0, 0], look: [lerp(-50, 40, f), 240, -520], mm: 50 });
    tex.colorSpace = THREE.SRGBColorSpace; card.material.uniforms.a.value = ease(t, tCard, tCard + 1.4);
  });
}
// an Airbus A300 (B2/B4): 54 m long, 45 m span, low swept wing, two underwing engines, tall fin
function a300() {
  const g = new THREE.Group(), w = new THREE.MeshStandardMaterial({ color: 0xe9ebec, roughness: 0.4, metalness: 0.15 }), grey = new THREE.MeshStandardMaterial({ color: 0x9da3a8, roughness: 0.5, metalness: 0.3 });
  const fus = new THREE.LatheGeometry([[0, -27], [1.2, -25.5], [2.4, -22], [2.82, -16], [2.82, 12], [2.4, 19], [1.4, 24], [0.3, 27]].map(([r, y]) => new THREE.Vector2(r, y)), 24); fus.rotateZ(-Math.PI / 2);
  const wing = (s) => { const sh = new THREE.Shape([[0, 0], [7.6, 0], [21.5 * Math.tan(28 * D2R) + 2.4, 21.5], [21.5 * Math.tan(28 * D2R), 21.5]].map(([a, b]) => new THREE.Vector2(a, b))); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false }); ge.rotateX(Math.PI / 2); ge.scale(1, 1, s); ge.translate(-1.5, -1.2, s * 1.5); ge.rotateY(Math.PI); return ge; };
  const tail = (s) => { const sh = new THREE.Shape([[0, 0], [5.4, 0], [8.5, 8.2], [6.6, 8.2]].map(([a, b]) => new THREE.Vector2(a, b))); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }); ge.rotateX(Math.PI / 2); ge.scale(1, 1, s); ge.rotateY(Math.PI); ge.translate(-20, 0.4, 0); return ge; };
  const fin = (() => { const sh = new THREE.Shape([[0, 0], [8.5, 0], [12.5, 9.5], [9.6, 9.5]].map(([a, b]) => new THREE.Vector2(a, b))); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }); ge.rotateY(Math.PI); ge.translate(-17.5, 1.8, 0.2); return ge; })();
  for (const ge of [fus, wing(1), wing(-1), tail(1), tail(-1), fin]) g.add(new THREE.Mesh(ge, w));
  for (const s of [1, -1]) { const e = new THREE.CylinderGeometry(1.35, 1.15, 5.2, 18); e.rotateZ(Math.PI / 2); e.translate(1.0, -2.6, s * 9.4); g.add(new THREE.Mesh(e, grey)); }
  return g;
}

// ---------------------------------------------------------------- photo
async function photoSet(ctx, shot, H, SETS) {
  const P = shot.params ?? {};
  if (P.mode === 'parliament-card') return dateCard(ctx, shot, H);
  const S = studio(ctx, { bg: 0x000000, fov: 30 });
  let ph;
  try { ph = await PX.photo(S.scene, `/projects/hormuz/assets/archive/${P.file ?? 'roberts'}.jpg`, { treatment: P.treatment ?? 'slide', mm: 45, depth: 0.45 }); }
  catch (e) { if (P.fallback) { const [set, mode] = P.fallback.split(':'); return SETS[set](ctx, { ...shot, params: { ...shot.params, mode } }); } throw e; }
  const move = PX.moves.push(ph, { amount: 0.16 });
  const pl = plate(S.layer, 'bl', 0.66);
  const qd = div(S.layer, `left:6%;bottom:17%;max-width:60%;${SERIF(3.6)}`, P.quote ?? '');
  const by = div(S.layer, `left:6.2%;bottom:12%;${MONO(0.72, 'rgba(251,248,242,.85)')}`, P.by ?? '');
  const src = div(S.layer, `right:4.2%;bottom:4.6%;${MONO(0.6, 'rgba(251,248,242,.8)', 0.16)}`, P.source ?? 'U.S. NAVY · PH2 RUDY D. PAHOYO · DUBAI, MAY 1988 · PUBLIC DOMAIN');
  const tq = wt(shot, 'should', shot.duration * 0.35);
  return S.out((t, p) => { move(S.camera, p, t); const k = ease(t, tq - 0.2, tq + 0.6); qd.style.opacity = k; pl.style.opacity = 0.3 + 0.7 * k; by.style.opacity = ease(t, tq + 0.4, tq + 1.0); src.style.opacity = ease(t, 0.6, 1.2); });
}
// a dated text card on paper: the date in serif, one line of what happened, the decision that followed
function dateCard(ctx, shot, H) {
  const P = shot.params ?? {};
  const S = studio(ctx, { bg: 0xf4efe6, fov: 30 });
  const G0 = GEO.load();
  const { tex, x } = canvasTex(2400, 1350, (x, w, h) => { x.fillStyle = PAPER; x.fillRect(0, 0, w, h); paperGrain(x, w, h, 22); });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.25), unlit(tex)); S.scene.add(mesh);
  let drawn = false;
  const paint = async () => { const G = await G0; const w = 2400, h = 1350;
    // the strait's coastline, faint, as a watermark on the right
    x.save(); x.beginPath(); x.rect(1500, 0, 900, 1350); x.clip(); x.strokeStyle = 'rgba(70,83,106,0.16)'; x.lineWidth = 2.5; const c0 = [26.6, 56.3], sc = 1500;
    for (const line of [...G.vec.coast, ...(G.vec.coastFine ?? [])]) { x.beginPath(); line.forEach(([lo, la], i) => { const px = 1650 + (lo - c0[1]) * sc * Math.cos(c0[0] * D2R), py = 700 - (la - c0[0]) * sc; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); }
    x.restore(); x.fillStyle = NAVY; x.textAlign = 'left'; x.font = '400 190px "Instrument Serif", serif'; x.fillText(P.title ?? '22 June 2025', 190, 520);
    x.fillStyle = RED; x.fillRect(196, 580, 150, 6);
    x.fillStyle = NAVY; x.font = '400 74px "Instrument Serif", serif'; x.fillText(P.line ?? 'Iran’s parliament votes to back', 190, 720); x.fillText(P.line2 ?? 'closing the Strait of Hormuz.', 190, 810);
    x.fillStyle = NAVY_SOFT; x.font = '500 34px "Plex Mono", monospace'; x.fillText(P.sub ?? 'THE FINAL DECISION: THE SUPREME NATIONAL SECURITY COUNCIL', 196, 930);
    x.font = '500 26px "Plex Mono", monospace'; x.fillText(P.source ?? 'SOURCE: PRESS TV VIA THE NEW ARAB, 22 JUN 2025', 196, 1230);
    tex.needsUpdate = true; drawn = true; };
  const ready = paint();
  return ready.then(() => S.out((t, p) => { const k = smoother(p); apply(S.camera, { pos: [lerp(-0.1, 0.05, k), lerp(-0.03, 0.02, k), lerp(5.75, 5.3, k)], look: [lerp(-0.08, 0.03, k), 0, 0], mm: 50 }); mesh.material.opacity = 1; }));
}

// ---------------------------------------------------------------- helium
// An MRI suite, white and bright (the magnet's bore, the table, ceiling light panels), then on 'chips'
// a cross-dissolve to a silicon wafer turning under clean light, its dies throwing thin-film colour.
async function helium(ctx, shot, H) {
  const P = shot.params ?? {}; const D = shot.duration;
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const S = studio(ctx, { bg: 0xeef1f2, fov: 35 });
  const pm = new THREE.PMREMGenerator(ctx.renderer); const env = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose(); S.scene.environment = env; S.onDispose(() => env.dispose());
  const mri = new THREE.Group(), wafer = new THREE.Group(); S.scene.add(mri, wafer);
  const W = (c, r = 0.35, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  // room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), W(0xd9dcdc, 0.22)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; mri.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), W(0xe9ecec, 0.8)); wall.position.set(0, 2, -3.2); mri.add(wall);
  const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), W(0xdfe6e8, 0.8)); wall2.position.set(-4.5, 2, 0); wall2.rotation.y = Math.PI / 2; mri.add(wall2);
  for (let i = 0; i < 3; i++) { const lp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); lp.rotation.x = Math.PI / 2; lp.position.set(-1.6 + i * 1.6, 3.0, 0.2); mri.add(lp); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), W(0xf2f2f2, 0.9)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.02; mri.add(ceil);
  // the magnet: a rounded housing with the bore, a flared front cowl, and the patient table
  const prof = []; const R0 = 0.36, R1 = 1.05, L = 1.8;
  for (const [r, z] of [[R0, -L / 2], [R0, L / 2 - 0.15], [R0 + 0.12, L / 2], [R1 - 0.2, L / 2 + 0.05], [R1, L / 2 - 0.15], [R1, -L / 2 + 0.15], [R1 - 0.2, -L / 2], [R0 + 0.06, -L / 2]]) prof.push(new THREE.Vector2(r, z));
  prof.push(prof[0].clone());
  const housing = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), W(0xf4f5f5, 0.28)); housing.rotation.x = Math.PI / 2; housing.position.set(0, 1.1, -1.0); housing.castShadow = true; mri.add(housing);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 1.6), W(0xe7e9ea, 0.4)); stand.position.set(0, 0.25, -1.0); mri.add(stand);
  const band = new THREE.Mesh(new THREE.TorusGeometry(R1 - 0.02, 0.025, 8, 72), W(0x1d6f8a, 0.4)); band.position.set(0, 1.1, -0.2); mri.add(band);
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 2.6), W(0xe2e4e5, 0.35)); table.position.set(0, 0.86, 0.9); table.castShadow = true; mri.add(table);
  const tbase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 1.2), W(0xdadcdd, 0.4)); tbase.position.set(0, 0.4, 1.3); mri.add(tbase);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 1.9), W(0x3c6f86, 0.7)); pad.position.set(0, 0.95, 1.0); mri.add(pad);
  const key = new THREE.RectAreaLight ? null : null;
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(2, 5, 3); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024); mri.add(dl); mri.add(new THREE.HemisphereLight(0xffffff, 0xd8dcdc, 0.6));
  // the wafer: 300 mm disk, die grid with thin-film colour (angle-dependent hue), a holder
  const { tex } = canvasTex(1024, 1024, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); const n = 22, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const cx = (i + 0.5) * s - w / 2, cy = (j + 0.5) * s - h / 2; if (Math.hypot(cx, cy) > w / 2 - s * 0.7) continue; x.fillStyle = `hsl(${(i * 13 + j * 7) % 40 + 200}, 30%, ${40 + ((i + j) % 3) * 6}%)`; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      x.fillStyle = 'rgba(255,255,255,0.18)'; for (let k = 0; k < 6; k++) x.fillRect(i * s + 6 + k * (s - 12) / 6, j * s + 8, (s - 12) / 8, s - 16); } });
  const wm = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uCam: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW, vN; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D map; uniform vec3 uCam; varying vec2 vUv; varying vec3 vW, vN;
      vec3 film(float d){ return .5 + .5 * cos(6.2832 * (vec3(0., .33, .67) + d)); }
      void main(){ vec3 v = normalize(uCam - vW); float c = abs(dot(v, vN)); vec3 tx = texture2D(map, vUv).rgb;
        float die = step(.05, dot(tx, vec3(1.)));
        vec3 base = mix(vec3(.62, .64, .68), tx * 1.2, die);
        vec3 irid = film(c * 1.6 + vUv.x * .3 + vUv.y * .2) * .55;
        vec3 col = base * (.55 + .45 * c) + irid * die * (1. - c * .6) + pow(1. - c, 4.) * .4;
        if (length(vUv - .5) > .5) discard;
        gl_FragColor = vec4(col, 1.); }` });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(1.5, 96), wm); disk.rotation.x = -Math.PI / 2; disk.position.y = 0.02; wafer.add(disk);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), W(0xf1f3f4, 0.6)); ground.rotation.x = -Math.PI / 2; wafer.add(ground);
  wafer.position.set(100, 0, 0);
  // the dissolve: render both, mix via a full-screen quad of the previous scene? keep it simple: a white flash-free crossfade using a DOM veil
  const veil = div(S.layer, 'inset:0;background:#eef1f2;opacity:0');
  const tC = Math.min(wt(shot, 'used', D * 0.65), D - 2.2);
  const src = div(S.layer, `right:4.2%;bottom:4.6%;${MONO(0.6, NAVY_SOFT, 0.16)};text-shadow:none`, P.source ?? 'SOURCE: USGS (2024)');
  const lab1 = div(S.layer, `left:6%;top:8%;${MONO(0.85, NAVY)};text-shadow:none`, 'LIQUID HELIUM COOLS THE MAGNET');
  const lab2 = div(S.layer, `left:6%;top:8%;${MONO(0.85, NAVY)};text-shadow:none`, 'AND IT IS USED TO MAKE CHIPS');
  return S.out((t, p) => {
    const second = t > tC;
    const v = 1 - Math.abs(clamp((t - tC) / 0.45, -1, 1)); veil.style.opacity = smoother(v);
    lab1.style.opacity = ease(t, 0.6, 1.1) * (1 - ease(t, tC - 0.4, tC)); lab2.style.opacity = ease(t, tC + 0.4, tC + 0.9); src.style.opacity = ease(t, 0.8, 1.3);
    if (!second) { const k = smoother(clamp(t / tC)); apply(S.camera, { pos: [lerp(1.9, 1.2, k), lerp(1.55, 1.4, k), lerp(3.4, 2.6, k)], look: [lerp(0, -0.1, k), 1.05, -0.8], mm: 28 }); }
    else { const k = smoother(clamp((t - tC) / (D - tC))); const a = lerp(-0.5, 0.2, k); disk.rotation.z = t * 0.12;
      const pos = [100 + Math.sin(a) * 2.6, lerp(1.6, 1.15, k), Math.cos(a) * 2.6]; apply(S.camera, { pos, look: [100, 0, 0.1], mm: 45 }); }
    wm.uniforms.uCam.value.copy(S.camera.position);
  });
}
