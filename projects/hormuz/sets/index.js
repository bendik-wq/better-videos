// Episode 3 sets: "The Strait That Controls a Fifth of the World's Oil" (the Strait of Hormuz): the sea,
// the ships and the maps. Story sets (open water, the Tanker War, law, people) are in scenic.js.
//
// House set format: makeHormuz(H) returns { preload(ctx, shots), <set>(ctx, shot) -> Promise<{ scene, camera, layer, update(t, p), dispose }> }.
// Register:   const { preload, ...sets } = makeHormuz(H); Object.assign(SETS, sets);   (factories are async)
// Every frame is a pure function of (t, p): ships move analytically along the real TSS lanes, waves are an
// FFT of t, smoke puffs have analytic ages, cameras are eased closed-form paths.
// Captions: sets draw params.caption (top-left, typed on, on a shadow plate) and params.source (bottom-right)
// themselves; pass H.captions = false to have the runtime draw them instead.
// Word cues: params that name a word ('widthAt': 'twenty') resolve against shot.words ({ w, s }, shot-relative).
//
// Modes (params.mode unless noted), all bright (look bright-day; golden hour where golden: true):
//   strait-aerial   traffic (default) | empty: true (the lanes with no ships, ghost lane lines) | sparse: true |
//                   haze: 'smoke' (strike smoke on the Iranian shore); alt / mm / drift(+-1) pick one of six views
//   tanker-hero     tracking (default, side 'port'|'starboard') | anchored | smoke | seizure-wide
//   navy-escort     escort (default) | lanes-low | blockade | golden-pass
//   fast-boats      n boats close on a tanker (Stena Impero)
//   chokepoint-map  lanes + 21 nmi crossing (widthAt / lanesAt word cues) | width (Larak - Great Quoin)
//   globe-dive      dive (default) | reverse: true (pull out to the globe)
//   gulf-terminal   oil terminal (default) | lng-dark (Ras Laffan, the trains shut down)
//   price-shock     brent (default) | forecast (EIA March 2026 forecast vs reality) | july | peak ($131 daily spot)
//   pipeline-bypass routes (default) | hit (strike on the East-West line, abstract)
//   bridge          watch (default) | radio (VHF ch 16 warning)
//   footage         a clip (params.file, aliases below) | fallback 'drone-sky' (CG RQ-4 over the strait)
import * as THREE from 'three';
import * as K from 'kit';
import * as CAM from '/engine/camera.js';
import * as SEA from '/engine/sea/index.js';
import * as FT from '/engine/footage.js';
import * as GEO from './geo.js';
const { smoother, lerp, clamp, V, range, ease, MONO, SERIF, RED, wt, div, plate, captions, look, seaSet, withLand, aerial, anchorage } = GEO;
const SMOKE = SEA.SMOKE;

// footage aliases: the shot list names clips by what they show
export const CLIPS = {
  'irgc-speedboat-sirocco': 'commons-iranian-irgc-speedboat-approaching-uss-sirocco-a',
  'ships-lcs-formation': 'ships-lcs-formation',
  'iran-drone-2019': 'iran-drone-2019',
};

export function makeHormuz(H = {}) {
  const apply = (camera, s) => CAM.apply(camera, s);
  const source = (layer, text) => div(layer, `right:4.2%;bottom:4.6%;${MONO(0.62, 'rgba(251,248,242,.85)', 0.16)}`, text);
  const fwdOf = (h) => [Math.sin(h), -Math.cos(h)];

  const SETS = {
    // ------------------------------------------------------------------ strait-aerial
    // The traffic separation scheme from a drone/aircraft, high noon. Six views, picked from the params
    // so no two uses repeat: view ('open' | 'telephoto' | 'establish' | 'east' | 'north' | 'west'), or by alt.
    // params: alt (m), mm, drift (+1 / -1 direction, or m/s if |drift| > 3), empty, sparse, haze: 'smoke', golden, caption
    async 'strait-aerial'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const mode = P.empty ? 'empty' : P.sparse ? 'sparse' : P.haze === 'smoke' ? 'smoke' : 'traffic';
      const alt = P.alt ?? 2600;
      const view = P.view ?? (P.empty ? 'telephoto' : alt >= 8500 ? 'establish' : mode === 'smoke' ? 'north' : P.sparse ? 'west' : (P.drift ?? 1) < 0 ? 'east' : 'open');
      // the sun sits ahead of each view (a glitter road on the water), high enough for short shadows
      const SUN = { open: [56, 300], telephoto: [36, 75], establish: [55, 345], east: [52, 120], north: [44, 330], west: [55, 268] };
      const [sEl, sAz] = SUN[view] ?? [60, 170];
      const lk = P.golden ? look('golden') : mode === 'smoke' ? look('smoke', { sunEl: sEl, sunAz: sAz }) : look('bright-day', { sunEl: sEl, sunAz: sAz });
      const S = seaSet(ctx, shot, { look: lk, spectrum: mode === 'empty' ? { hs: 0.7, wind: 6 } : {} });
      S.sea.environment();
      await withLand(S, { lod: P.lod ?? 0 });
      const xz = (la, lo) => G.P.xz(la, lo);
      const VIEWS = {
        open: { from: xz(26.515, 56.60), to: xz(26.565, 56.545) },
        telephoto: { tgt: (() => { const q = G.laneIn.at(G.laneIn.nearest(...xz(26.57, 56.50))); return [q.x, 0, q.z]; })(), az: 25, pitch: 13 },
        establish: { tgt: [...(() => { const [x, z] = xz(26.66, 56.43); return [x, 0, z]; })()], az: 350, pitch: 27 },
        east: { tgt: [...(() => { const [x, z] = xz(26.53, 56.58); return [x, 0, z]; })()], az: 108, pitch: 21 },
        north: { tgt: [...(() => { const [x, z] = xz(27.0, 56.33); return [x, 0, z]; })()], az: 344, pitch: 3.2, alt: 1400 },
        west: { tgt: [...(() => { const [x, z] = xz(26.62, 56.36); return [x, 0, z]; })()], az: 292, pitch: 26 },
      };
      const Vw = VIEWS[view];
      let base;
      if (Vw.from) { const [cx, cz] = Vw.from, [lx, lz] = Vw.to; base = { pos: [cx, alt, cz], look: [lx, 0, lz] }; }
      else base = aerial(Vw.tgt, Vw.az, Vw.pitch, Vw.alt ?? alt);
      const dir = [base.look[0] - base.pos[0], base.look[2] - base.pos[2]], dl = Math.hypot(...dir), ux = dir[0] / dl, uz = dir[1] / dl;
      const drift = P.drift == null ? 1 : P.drift, speed = Math.abs(drift) > 3 ? drift : Math.sign(drift || 1) * alt * 0.011;
      // traffic
      const sIn = G.laneIn.nearest(base.look[0], base.look[2]), sOut = G.laneOut.nearest(base.look[0], base.look[2]);
      if (mode === 'traffic' || mode === 'smoke') {
        GEO.convoy(S.sea, G.laneIn, { lite: true, n: P.nIn ?? 7, s0: sIn - 7500, gap: 2300, speed: 7.2, seed: 2, names: ['ARABIAN DAWN', 'GULF STAR', 'SEA PEARL', 'NORDIC HORIZON', 'MARAN ORION', 'DESERT ROSE', 'AL SAFLIYA'] });
        GEO.convoy(S.sea, G.laneOut, { lite: true, n: P.nOut ?? 6, s0: sOut - 7000, gap: 2600, speed: 7.5, seed: 9, kinds: ['vlcc', 'lng', 'container', 'vlcc'] });
        // small traffic crossing (dhows between Musandam and Iran)
        for (let i = 0; i < 3; i++) { const d = SEA.ship('dhow', { seed: 70 + i }); S.sea.addShip(d); d.place(base.look[0] + (i - 1) * 2500, base.look[2] + 1500 - i * 1300, 20 + i * 150, 4.5); }
      } else if (mode === 'sparse') {
        GEO.convoy(S.sea, G.laneIn, { lite: true, n: 1, s0: sIn - 1500, gap: 3000, speed: 6.5, seed: 4 });
        GEO.convoy(S.sea, G.laneOut, { lite: true, n: 2, s0: sOut - 4000, gap: 5200, speed: 6.8, seed: 12, kinds: ['vlcc', 'lng'] });
      }
      // empty: ghost lines where the lanes are (the scheme's boundaries, dashed), fading in
      const ghosts = [];
      if (mode === 'empty' || mode === 'sparse') {
        for (const [lane, off] of [[G.laneIn, -1852], [G.laneIn, 1852], [G.laneOut, -1852], [G.laneOut, 1852]]) {
          const pts = []; for (let s = sIn - 30000; s < sIn + 30000; s += 400) { const q = lane.at(s), [fx, fz] = fwdOf(q.heading); pts.push([q.x - fz * off, q.z + fx * off]); }
          const m = GEO.ribbon(pts, { width: mode === 'empty' ? 14 : 34, y: 3, color: 0xe8f6ff, opacity: 0.3, glow: 1.0 }); S.sea.overlay.add(m); ghosts.push(m);
        }
      }
      // smoke on the Iranian shore: plumes from Bandar Abbas and along the coast, a brown bank on the horizon
      const plumes = [];
      if (mode === 'smoke') {
        const sites = [['Bandar Abbas', 0, 0], ['Bandar Abbas', -9000, 2500], ['Bandar Abbas', 14000, -1500], ['Qeshm', 6000, 3000]];
        sites.forEach(([n, dx, dz], i) => { const p = G.place(n); plumes.push(SMOKE.smoke(S.sea, { at: [p.x + dx, 20, p.z + dz], height: 2600 + i * 400, radius: 260 + i * 30, spread: 2.6, rise: 18, wind: [24, 8], dark: 0.16, n: 140, seed: 11 + i, opacity: 1, fire: 0 })); });
        const bp = G.place('Bandar Abbas'); plumes.push(SMOKE.smoke(S.sea, { at: [bp.x + 2000, 300, bp.z + 6000], area: [60000, 9000], height: 700, radius: 1800, spread: 1.0, rise: 6, wind: [8, 2], dark: 0.36, n: 70, seed: 41, opacity: 0.5 }));
      }
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const k = smoother(p), along = speed * (t - shot.duration / 2), b = CAM.breath(t, alt * 0.0012, 2);
        const fl = view === 'telephoto' ? 0.04 * k : 0.05 * k;
        apply(S.camera, { pos: [base.pos[0] + ux * along + b.x, base.pos[1] * (1 - fl) + b.y, base.pos[2] + uz * along], look: [base.look[0] + ux * along, 0, base.look[2] + uz * along], mm: P.mm ?? 30, roll: b.r });
        for (const m of ghosts) m.material.uniforms.uOp.value = (mode === 'empty' ? 0.32 : 0.22) * ease(t, 0.4, 2.2);
        for (const pl of plumes) pl.update(t + 600);
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ tanker-hero
    // A laden VLCC up close. modes:
    //   (default) low tracking shot alongside, the drone overtakes from amidships to the bow (side, mm, h, off)
    //   anchored  an idle tanker at anchor, golden, camera at the waterline under the bow (h, mm), the chain out,
    //             more ships waiting at anchor beyond
    //   smoke     a tanker hit off Oman (1 Mar 2026): smoke pouring from amidships, seen from a distance, long lens
    //   seizure-wide  wide and high, golden: a tanker stopped in the lane, fast boats circling it, traffic passing
    async 'tanker-hero'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const mode = P.mode ?? 'track';
      if (mode === 'anchored') return anchoredHero(ctx, shot, G);
      if (mode === 'smoke') return smokeHero(ctx, shot, G);
      if (mode === 'seizure-wide') return seizureWide(ctx, shot, G);
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden') : look('bright-day', { sunEl: 38, sunAz: 245 }) });
      S.sea.environment();
      if (P.land !== false) await withLand(S, { lod: 1 });
      const sh = SEA.ship('vlcc', { name: P.name ?? 'ARABIAN DAWN', seed: 4, loaded: 1, hullColor: P.hull ?? '#24262a', deckColor: '#5a4136' }); S.sea.addShip(sh);
      sh.follow(G.laneIn, { s0: P.s0 ?? 30000, speed: 7.5 });
      GEO.convoy(S.sea, G.laneIn, { lite: true, n: 2, s0: (P.s0 ?? 30000) + 2600, gap: 2500, speed: 7.3, seed: 5 });
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea), k = smoother(p), L = sh.length;
        const [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx, side = P.side === 'port' ? -1 : P.side === 'starboard' ? 1 : P.side ?? -1;
        const u = lerp(P.from ?? 0.22, P.to ?? 0.62, k) * L - L / 2, off = sh.beam / 2 + lerp(P.off ?? 95, (P.off ?? 95) * 0.82, k);
        const b = CAM.breath(t, 0.5, 5), hh = lerp(P.h ?? 34, (P.h ?? 34) * 0.8, k) + b.y;
        const pos = [st.x + fx * u + sx * off * side, hh, st.z + fz * u + sz * off * side];
        const lk = [st.x + fx * (u + 70), 6 + (P.lookY ?? 0), st.z + fz * (u + 70)];
        apply(S.camera, { pos: [pos[0] + b.x * sx, pos[1], pos[2] + b.x * sz], look: lk, mm: P.mm ?? 24, roll: b.r * 2 });
        S.sea.shadows(V(st.x + fx * u, 0, st.z + fz * u), L * 0.42, 2048);
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ bridge
    // On the bridge of a VLCC in the inbound lane: watch officers in silhouette against the bright windows,
    // consoles, the long deck ahead and the next tanker in the file.
    // params: mode ('watch' | 'radio': close on the VHF set, channel 16, its speaker live), mm, crew
    async bridge(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const radio = P.mode === 'radio';
      const PE = await import('/engine/people/index.js');
      await PE.preload({ wardrobe: ['military', 'casual_a', 'office'] });
      const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 52, sunAz: 215 }) });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const sh = SEA.ship('vlcc', { name: 'ARABIAN DAWN', seed: 4 }); S.sea.addShip(sh); sh.follow(G.laneIn, { s0: P.s0 ?? 26000, speed: 7.4 });
      GEO.convoy(S.sea, G.laneIn, { lite: true, n: 2, s0: (P.s0 ?? 26000) + 2200, gap: 2600, speed: 7.2, seed: 7 });
      const A = sh.parts.A; A.wh.visible = false;                       // the wheelhouse box goes; a real room takes its place
      const room = bridgeRoom(A, P);
      sh.body.add(room.group);
      const crew = [], ids = ['military', 'casual_a', 'office'];
      const spots = radio ? [[A.whX + 3.9, -3.4, Math.PI / 2 - 0.2], [A.whX + 3.3, 2.8, Math.PI / 2 + 0.3]] : [[A.whX + 4.0, -3.8, Math.PI / 2 - 0.3], [A.whX + 3.0, 3.2, Math.PI / 2 + 0.2], [A.whX + 4.4, 0.6, Math.PI / 2]];
      for (let i = 0; i < Math.min(P.crew ?? 3, spots.length); i++) { const m = PE.person(ids[i % 3], { dress: { silhouette: true } }); m.root.position.set(spots[i][0], room.floor + 0.06, spots[i][1]); m.root.rotation.y = spots[i][2]; sh.body.add(m.root); crew.push(m); }
      const cap = captions(S.layer, shot, { caption: P.caption ?? (radio ? '28 FEB 2026' : undefined) }, H);
      // radio: the VHF set's display as a panel on a plate, bottom-left: channel 16, live receive waveform
      let vhf = null;
      if (radio) { plate(S.layer, 'bl', 0.6); const box = div(S.layer, `left:6%;bottom:9%;${MONO(0.8)}`, '<div style="font-size:3.6em;letter-spacing:.04em;line-height:1">CH 16</div><div style="opacity:.8;margin-top:.4em">VHF · DISTRESS, SAFETY AND CALLING · RX</div>');
        const c = document.createElement('canvas'); c.width = 520; c.height = 90; c.style.cssText = 'display:block;margin-top:1em;width:26em;height:4.5em'; box.appendChild(c); const x = c.getContext('2d');
        vhf = (t) => { x.clearRect(0, 0, 520, 90); x.strokeStyle = 'rgba(251,248,242,.95)'; x.lineWidth = 2.4; x.beginPath(); const on = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9));
          for (let i = 0; i < 520; i += 2) { const a = Math.sin(i * 0.21 + t * 11) * Math.sin(i * 0.033 + t * 2.7) * on * (0.6 + 0.4 * Math.sin(i * 0.011 + t)); x.lineTo(i, 45 + a * 38); } x.stroke(); }; }
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea); sh.update(t, S.sea);
        crew.forEach((m, i) => m.blend([[i === 1 ? 'idle_b' : 'idle', t + i * 3, 1]]).update());
        room.update(t); vhf?.(t);
        const k = smoother(p), b = CAM.breath(t, 0.035, 9);
        let loc, aim, mm;
        { loc = V(A.whX - 2.4 + k * 1.1, room.floor + 1.62 + b.y, lerp(-1.2, 0.6, k) + b.x); aim = V(A.whX + 60, room.floor - 10, lerp(-6, 2, k)); mm = P.mm ?? 24; }
        const wp = sh.worldOf(loc.toArray()), wa = sh.worldOf(aim.toArray());
        apply(S.camera, { pos: wp.toArray(), look: wa.toArray(), mm, roll: b.r });
        S.sea.shadows(V(st.x, 0, st.z), 180);
        S.pres.draw(S.camera, t, { near: 0.05 });
        cap(t);
      });
    },

    // ------------------------------------------------------------------ chokepoint-map
    // The strait as a clean 3D map: real imagery and relief, the TSS lanes, the 21 nmi crossing and oil
    // flowing through as two particle streams. params: widthAt / lanesAt (words or seconds), labels,
    // mode 'width': closer on the narrowest crossing, Larak and Great Quoin named, the measurement drawn on
    async 'chokepoint-map'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const W = P.mode === 'width';
      const S = seaSet(ctx, shot, { look: look('map', { sunEl: 50, sunAz: 140, exposure: 1.05 }), spectrum: { hs: 0.4 } });
      S.sea.environment();
      const land = await withLand(S, { lod: 1, depthLevel: 1 });
      if (P.flat !== false) { land.setCurvature(0); S.sea.ocean.U.uCurv.value = 0; }
      const tW = wt(shot, P.widthAt, W ? 1.6 : 2.2), tL = wt(shot, P.lanesAt, tW + 1.4);
      for (const w of G.tssLocal) {
        if (w.type === 'separation_zone') { const sh = new THREE.Shape(w.pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
          const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, depthTest: false })); m.position.y = 40; m.renderOrder = 40; S.sea.overlay.add(m); }
        if (w.type === 'separation_boundary') S.sea.overlay.add(GEO.ribbon(w.pts, { width: 180, y: 45, color: 0xffffff, opacity: 0.7, dash: 1400, depthTest: false }));
      }
      const laneIn = GEO.ribbon(sample(G.laneIn, 28000, 72000), { width: 3700, y: 35, color: 0x5fd4ff, opacity: 0.22, glow: 1.3, depthTest: false });
      const laneOut = GEO.ribbon(sample(G.laneOut, 28000, 72000), { width: 3700, y: 35, color: 0xffc24a, opacity: 0.22, glow: 1.3, depthTest: false });
      S.sea.overlay.add(laneIn, laneOut);
      const flow = (lane, n, col, speed, size) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
        const m = new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false, map: dotTex(), blending: THREE.AdditiveBlending });
        const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 60; S.sea.overlay.add(pts);
        const r = K.rng(n); const off = Array.from({ length: n }, () => [r(), (r() - 0.5) * 2600]);
        return (t) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { const s = 15000 + ((off[i][0] * 75000 + speed * t) % 75000); const q = lane.at(s), fx = Math.sin(q.heading), fz = -Math.cos(q.heading);
          a[i * 3] = q.x + fz * off[i][1] * -1; a[i * 3 + 1] = 60; a[i * 3 + 2] = q.z + fx * off[i][1]; } g.attributes.position.needsUpdate = true; m.opacity = 0.95 * (W ? 0.5 : 1); }; };
      const fOut = flow(G.laneOut, 260, 0xffc24a, 2400, 5 * S.H / 1080), fIn = flow(G.laneIn, 120, 0x8fe3ff, 1800, 4 * S.H / 1080);
      const [a, b] = narrowest(G);
      const wl = GEO.ribbon([[a.x, a.z], [b.x, b.z]], { width: W ? 260 : 420, y: 80, color: 0xffffff, opacity: 0.95, glow: 1.6 }); S.sea.overlay.add(wl);
      // end ticks on the measurement
      const ux = (b.x - a.x), uz = (b.z - a.z), ul = Math.hypot(ux, uz), px = -uz / ul, pz = ux / ul;
      const ticks = [a, b].map(e => { const m = GEO.ribbon([[e.x - px * 1800, e.z - pz * 1800], [e.x + px * 1800, e.z + pz * 1800]], { width: W ? 220 : 320, y: 80, color: 0xffffff, opacity: 0.95, glow: 1.6 }); S.sea.overlay.add(m); return m; });
      const lb = GEO.labels(S.layer); const km = Math.hypot(a.x - b.x, a.z - b.z) / 1000;
      const L = (n, o) => lb.add(n, G.place(n), o);
      if (W) {
        lb.add('LARAK', a, { t0: 0.5, dx: -40, dy: -50, align: 'right', size: 1.15, sub: 'IRAN' });
        lb.add('GREAT QUOIN', b, { t0: 0.8, dx: 40, dy: 70, align: 'left', size: 1.15, sub: 'OMAN' });
        lb.add('IRAN', V(30000, 0, -95000), { t0: 1.2, dot: false, size: 1.3, dy: 0 }); lb.add('OMAN', G.place('Musandam'), { t0: 1.2, dot: false, size: 1.3, dy: 60 });
      } else if (P.labels !== false) {
        L('Bandar Abbas', { t0: 0.6 }); lb.add('QESHM', G.place('Qeshm Island'), { t0: 0.8, dot: false, dy: 0, size: 0.85 }); L('Larak', { t0: 1.0, dx: -60, dy: -30, align: 'right' }); L('Hormuz Island', { t0: 1.1, dx: 60, dy: -30, align: 'left' });
        L('Khasab', { t0: 1.3, dy: 50 }); lb.add('OMAN', G.place('Musandam'), { t0: 1.4, dot: false, size: 1.3, dy: 60 }); lb.add('IRAN', V(30000, 0, -95000), { t0: 1.4, dot: false, size: 1.3, dy: 0 });
        lb.add('GULF OF OMAN', V(70000, 0, 45000), { t0: 1.6, dot: false, size: 1.0, dy: 0 }); lb.add('PERSIAN GULF', V(-80000, 0, 20000), { t0: 1.6, dot: false, size: 1.0, dy: 0 });
      }
      const mid = V((a.x + b.x) / 2, 80, (a.z + b.z) / 2);
      lb.add(`≈ ${Math.round(km / 1.852)} NAUTICAL MILES`, mid, { dx: 120, dy: -10, align: 'left', size: 1.15, t0: tW, accent: '#ffffff', sub: `${Math.round(km)} km at the narrowest point` });
      const lq = G.laneOut.at(40000);
      if (!W) lb.add('TWO LANES · 2 MILES EACH', V(lq.x, 0, lq.z), { dx: 80, dy: 60, align: 'left', size: 0.8, t0: tL });
      source(S.layer, 'IMAGERY: COPERNICUS SENTINEL-2 2025, NASA · LANES: OPENSTREETMAP · ELEVATION: MAPZEN/SRTM');
      const cap = captions(S.layer, shot, { source: null, css: 'left:6%;bottom:9%', corner: 'bl', at: tW + 0.8 }, H);
      const c = W ? V((a.x + b.x) / 2, 0, (a.z + b.z) / 2) : V(0, 0, -6000);
      return S.out((t, p) => {
        const k = smoother(p);
        if (W) { const alt = lerp(P.alt0 ?? 95e3, P.alt1 ?? 72e3, k), az = lerp(0.35, 0.18, k); apply(S.camera, { pos: [c.x + Math.sin(az) * alt * 0.35, alt, c.z + Math.cos(az) * alt * 0.35], look: [c.x, 0, c.z], mm: 35 }); }
        else { const alt = lerp(P.alt0 ?? 230e3, P.alt1 ?? 140e3, k), az = lerp(-0.25, -0.05, k); apply(S.camera, { pos: [c.x + Math.sin(az) * alt * 0.55, alt, c.z + Math.cos(az) * alt * 0.55], look: [c.x, 0, c.z - alt * 0.05], mm: 35 }); }
        const lt = W ? 1 : clamp((t - 0.3) / 2.2), lanesK = W ? 0.45 : 1;
        laneIn.material.uniforms.uDraw.value = laneOut.material.uniforms.uDraw.value = laneIn.userData.length * lt;
        laneIn.material.uniforms.uOp.value = laneOut.material.uniforms.uOp.value = 0.22 * lanesK * (1 + 0.6 * ease(t, tL, tL + 0.5) * (1 - ease(t, tL + 2.5, tL + 3.2)));
        const dk = smoother(clamp((t - tW) / 1.0)); wl.material.uniforms.uDraw.value = wl.userData.length * dk;
        ticks.forEach(m => { m.material.uniforms.uOp.value = 0.95 * ease(t, tW - 0.2, tW + 0.2); });
        fOut(t); fIn(t);
        S.pres.draw(S.camera, t, { haze: 0.6 });
        lb.update(S.camera, t, S.W, S.H);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ globe-dive
    // From the whole Earth down to the strait (NASA Blue Marble globe -> regional imagery -> the lanes at
    // 3 km), or, reverse: true, from the lanes back out to the globe. params: h0 (m, 1.6e7), h1 (m, 3000)
    async 'globe-dive'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 64, sunAz: 150 }) });
      S.sea.environment();
      await withLand(S, { lod: 0 });
      GEO.convoy(S.sea, G.laneIn, { lite: true, n: 6, s0: 15000, gap: 2600, speed: 7.2, seed: 3 });
      GEO.convoy(S.sea, G.laneOut, { lite: true, n: 4, s0: 22000, gap: 3200, speed: 7.4, seed: 11 });
      const globe = await makeGlobe(ctx, G);
      const rt = S.pres.rt, blend = blendQuad();
      const tgt = G.laneIn.at(28000);
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        // altitude: log-linear with a C2 ease, so the apparent speed stays even across six orders of magnitude
        const k = smoother(P.reverse ? 1 - p : p), h = Math.exp(lerp(Math.log(P.h0 ?? 1.6e7), Math.log(P.h1 ?? 3000), k));
        const tilt = smoother(clamp((Math.log(4e4) - Math.log(h)) / (Math.log(4e4) - Math.log(P.h1 ?? 3000)))) * 0.95;
        const back = h * Math.tan(tilt * 0.9);
        const spin = P.reverse ? (1 - k) * 0.25 : 0;   // the pull-out turns a little, so it is not the dive played backwards
        const pos = [tgt.x - 2000 * tilt + Math.sin(spin) * back * 0.6, h, tgt.z + back * 0.6 * Math.cos(spin)], lk = [tgt.x, 0, tgt.z - back * 0.25];
        const fade = smoother(clamp((Math.log(h) - Math.log(3.2e5)) / (Math.log(9e5) - Math.log(3.2e5))));
        if (fade < 0.999) { apply(S.camera, { pos, look: lk, mm: 30, up: [0, 0, -1] }); S.pres.draw(S.camera, t); }
        if (fade > 0.001) { globe.draw(ctx.renderer, pos, lk, t, G); }
        blend.set(globe.rt.texture, rt.texture, fade);
        cap(t);
      });
      function blendQuad() {
        const q = S.pres.scene.children[0], m = q.material; const U = { tA: m.uniforms.tC, tB: { value: null }, k: { value: 0 } };
        q.material = new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
          fragmentShader: 'uniform sampler2D tA, tB; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = mix(texture2D(tA, vUv), texture2D(tB, vUv), k); }', depthTest: false, depthWrite: false });
        return { set(globeTex, seaTex, k) { U.tA.value = seaTex; U.tB.value = globeTex; U.k.value = k; } };
      }
    },

    // ------------------------------------------------------------------ gulf-terminal
    // (default) an oil terminal: tank farm on a desert shore, a 1.6 km trestle, a VLCC alongside, turquoise shallows.
    // lng-dark: Ras Laffan with its LNG trains shut down: process trains (columns, fin-fan banks, cold boxes),
    //   full-containment tanks, cold flare stacks, LNG carriers idle at the jetty, nothing moving. params: orbit, alt, golden
    async 'gulf-terminal'(ctx, shot) {
      const P = shot.params ?? {}; const lng = P.mode === 'lng-dark';
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden', { sunAz: 250 }) : look('bright-day', { sunEl: lng ? 40 : 48, sunAz: lng ? 230 : 140 }), spectrum: { hs: 0.45, wind: 5 } });
      S.sea.environment();
      const T = terminal(S.sea, { lng });
      let focus;
      if (lng) {
        for (const [i, dz] of [[0, 0], [1, 1]]) { const c = SEA.ship('lng', { name: ['AL KHOR STAR', 'UMM AL AMAD'][i], seed: 61 + i }); S.sea.addShip(c); c.place(T.berth.x + (i ? 560 : 0), T.berth.z - dz * 0, 90, 0); c.wake = 0.25; }
        const far = SEA.ship('lng', { seed: 77, lite: true }); S.sea.addShip(far); far.place(T.berth.x - 2600, T.berth.z - 3800, 120, 0); far.wake = 0.3;
        focus = V(T.plant.x, 0, T.plant.z - 500);
      } else {
        const vl = SEA.ship('vlcc', { name: 'GULF STAR', seed: 12, loaded: 0.35 }); S.sea.addShip(vl); vl.place(T.berth.x, T.berth.z, 90, 0); vl.wake = 0;
        const vl2 = SEA.ship('vlcc', { name: 'MARAN ORION', seed: 13, loaded: 0.9, hullColor: '#5a1d1a', deckColor: '#6b4436' }); S.sea.addShip(vl2); vl2.place(T.berth.x - 300, T.berth.z + 4200, 80, 5.5);
        focus = V(T.berth.x, 0, T.berth.z + 380);
        source(S.layer, 'ILLUSTRATIVE TERMINAL · BASED ON RAS TANURA AND FUJAIRAH LAYOUTS');
      }
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const k = smoother(p), b = CAM.breath(t, 2, 4);
        if (lng) { // from the sea, low: the idle carriers at the jetty in front, the dark trains and the cold flares behind
          apply(S.camera, { pos: [T.berth.x + lerp(700, 420, k) + b.x, 64 + b.y, T.berth.z - lerp(820, 760, k)], look: [T.berth.x - 120, 60, T.berth.z + 1700], mm: P.mm ?? 42, roll: b.r });
        } else { const a = ((P.az ?? 215) + (P.orbit ?? 24) * (k - 0.5)) * Math.PI / 180, r = P.r ?? 760, h = P.alt ?? 330;
          apply(S.camera, { pos: [focus.x + Math.sin(a) * r + b.x, h + b.y, focus.z + Math.cos(a) * r], look: [focus.x, 0, focus.z], mm: P.mm ?? 30, roll: b.r }); }
        S.sea.shadows(lng ? V(T.berth.x, 0, T.berth.z + 300) : V(focus.x, 0, focus.z), lng ? 700 : 900, 2048);
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ navy-escort
    // (default) a US destroyer abreast of a laden VLCC in the inbound lane, drone astern and above.
    // lanes-low   at the waterline in the outbound lane, looking south: a tanker crosses in front of the
    //             Musandam cliffs, the lanes hugging Oman's shore; a destroyer astern
    // blockade    two destroyers at speed, close and broadside, long lens: the blockade line
    // golden-pass golden hour, into the sun: destroyer and tanker side by side through the strait, silhouettes on the glitter
    async 'navy-escort'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const mode = P.mode ?? 'escort';
      if (mode === 'lanes-low') return lanesLow(ctx, shot, G);
      if (mode === 'blockade') return blockade(ctx, shot, G);
      const gold = mode === 'golden-pass' || P.golden;
      const S = seaSet(ctx, shot, { look: gold ? look('golden', { sunEl: 6.5, sunAz: 292 }) : look('bright-day', { sunEl: 58, sunAz: 200 }) });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const vl = SEA.ship('vlcc', { name: 'DESERT ROSE', seed: 21, hullColor: '#22303f', deckColor: '#6b4436' }); S.sea.addShip(vl); vl.follow(G.laneIn, { s0: P.s0 ?? 24000, speed: 7.6 });
      const dd = SEA.ship('destroyer', { number: P.number ?? '112', seed: 22 }); S.sea.addShip(dd);
      const offL = mode === 'golden-pass' ? 300 : 380;
      const track = SEA.lane(sample(G.laneIn, 0, G.laneIn.length).map(([x, z], i, a) => { const q = G.laneIn.at(i / (a.length - 1) * G.laneIn.length); return [x + Math.cos(q.heading) * -offL, z + Math.sin(q.heading) * -offL]; }));
      dd.follow(track, { s0: (P.s0 ?? 24000) + (mode === 'golden-pass' ? 120 : 260), speed: 7.6 });
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const st = vl.pose(t, S.sea), k = smoother(p);
        const [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx, b = CAM.breath(t, 2.5, 6);
        if (mode === 'golden-pass') {
          // low and astern, looking ahead along the lane into the low sun: both ships on the glitter road
          const back = lerp(900, 700, k), side = lerp(-60, -140, k), h = lerp(26, 20, k);
          apply(S.camera, { pos: [st.x - fx * back + sx * side + b.x, h + b.y * 0.3, st.z - fz * back + sz * side], look: [st.x + fx * 600 + sx * -180, 10, st.z + fz * 600 + sz * -180], mm: P.mm ?? 50, roll: b.r });
          S.sea.shadows(V(st.x + sx * -150, 0, st.z + sz * -150), 420);
        } else {
          const back = lerp(620, 420, k), side = lerp(-120, -260, k), h = lerp(170, 120, k);
          apply(S.camera, { pos: [st.x - fx * back + sx * side + b.x, h + b.y, st.z - fz * back + sz * side], look: [st.x + fx * 120 + sx * -190, 0, st.z + fz * 120 + sz * -190], mm: P.mm ?? 30, roll: b.r });
          S.sea.shadows(V(st.x + sx * -190, 0, st.z + sz * -190), 420);
        }
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ fast-boats
    // Tension: small fast-attack boats close on a tanker. Low camera at the tanker's side. params: n, from, to
    async 'fast-boats'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden', { sunEl: 10 }) : look('bright-day', { sunEl: 38, sunAz: 240 }), spectrum: { hs: 0.8, wind: 7 } });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const vl = SEA.ship('vlcc', { name: 'NORDIC HORIZON', seed: 31, hullColor: '#22303f', deckColor: '#4d5649' }); S.sea.addShip(vl); vl.follow(G.laneIn, { s0: P.s0 ?? 27000, speed: 6.5 });
      const n = P.n ?? 9, r = K.rng(5), boats = [], D = shot.duration;
      for (let i = 0; i < n; i++) { const b = SEA.ship('fastboat', { seed: 40 + i, color: ['#6b6f5f', '#7a7d70', '#5d6156'][i % 3] }); S.sea.addShip(b); boats.push({ b, row: Math.floor((i + 1) / 2), side: i % 2 ? 1 : -1, j: r() }); }
      const spray = sprayPoints(S.sea, n);
      const cap = captions(S.layer, shot, {}, H);
      return S.out((t, p) => {
        const st = vl.pose(t, S.sea), [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx;
        boats.forEach(({ b, row, side, j }, i) => {
          const d = lerp(P.from ?? 520, P.to ?? 110, smoother(clamp(t / D))) + row * 38 + j * 25;
          const lat = side * row * 42 * lerp(1, 0.55, t / D), along = 60 + lat + Math.sin(t * 0.7 + i) * 6;
          const x = st.x + fx * along + sx * d, z = st.z + fz * along + sz * d;
          b.place(x, z, (st.heading - Math.PI / 2 + 0.25 * side * (row > 0 ? 0.3 : 0)) * 180 / Math.PI, 18);
          b.fixed.x -= Math.sin(b.fixed.heading) * 18 * t; b.fixed.z += Math.cos(b.fixed.heading) * 18 * t;
        });
        boats.forEach(o => o.b.pose(t, S.sea));
        spray(t, boats.map(o => o.b));
        const k = smoother(p), b = CAM.breath(t, 0.5, 8);
        const u = 30, off = vl.beam / 2 + 18, hh = lerp(14, 11, k);
        let ax = 0, az = 0; for (const o of boats) { ax += o.b.state.x; az += o.b.state.z; }
        apply(S.camera, { pos: [st.x + fx * u + sx * off + b.x, hh + b.y, st.z + fz * u + sz * off], look: [ax / boats.length, 1, az / boats.length], mm: lerp(70, 45, k), roll: b.r });
        S.pres.draw(S.camera, t);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ price-shock
    // The sea becomes a chart: Brent (EIA, monthly) drawn as a line of light in the sky over the horizon.
    // modes: (default) from P.from | forecast: EIA's March 2026 forecast (a one-month disruption: above $95 for two
    // months, under $80 in Q3, ~$70 by December; path approximate) dashed, then what happened | july: 2026 close-up,
    // the June dip and the July resumption | peak: monthly line + the daily spot spikes ($128 on 2 Apr, $131 on 15 Sep)
    async 'price-shock'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const mode = P.mode ?? 'brent';
      const lk = mode === 'july' ? look('bright-day', { sunEl: 24, sunAz: 235, exposure: 0.98 }) : mode === 'peak' ? look('golden', { sunEl: 4.5, sunAz: 256, exposure: 0.92 }) : look('golden', { sunEl: 9, sunAz: 250, exposure: 0.95 });
      const S = seaSet(ctx, shot, { look: lk, spectrum: { hs: 0.6, wind: 5 } });
      S.sea.environment();
      const from = P.from ?? (mode === 'july' ? 2026 : mode === 'peak' ? 2025.4 : 2024);
      const data = G.brent.data.filter(([y, m]) => y + (m - 1) / 12 >= from - 1e-6);
      const forecast = mode === 'forecast' ? [[2026, 3, data.find(d => d[0] === 2026 && d[1] === 3)[2]], [2026, 4, 96], [2026, 5, 95], [2026, 6, 89], [2026, 7, 80], [2026, 8, 78], [2026, 9, 77], [2026, 10, 74], [2026, 11, 72], [2026, 12, 70]] : null;
      const tOf = (d) => d[0] + (d[1] - 1) / 12;
      const T0 = tOf(data[0]), T1 = forecast ? tOf(forecast.at(-1)) : tOf(data.at(-1));
      const X0 = mode === 'july' ? -2000 : -2600, X1 = -X0, Zc = -5200, Y0 = 70, YS = mode === 'july' ? 11 : 9.5, vMin = mode === 'july' ? 60 : 50;
      const xOf = (d) => lerp(X0, X1, (tOf(d) - T0) / (T1 - T0)), yOf = (v) => Y0 + (v - vMin) * YS;
      const real = forecast ? data.filter(d => tOf(d) <= 2026 + 2 / 12 + 1e-6) : data, after = forecast ? data.filter(d => tOf(d) >= 2026 + 2 / 12 - 1e-6) : [];
      const pts = real.map(d => [xOf(d), yOf(d[2])]), N = pts.length;
      const line = lineMesh(pts, Zc, 16, 0xffe2b0); S.sea.overlay.add(line.mesh);
      let fLine = null, aLine = null;
      if (forecast) { fLine = dashLine(forecast.map(d => [xOf(d), yOf(d[2])]), Zc + 1, 11, 0xbfe6ff, 70); S.sea.overlay.add(fLine.mesh);
        aLine = lineMesh(after.map(d => [xOf(d), yOf(d[2])]), Zc, 16, 0xffe2b0); S.sea.overlay.add(aLine.mesh); }
      const grid = []; for (const v of (mode === 'july' ? [70, 90, 110] : mode === 'peak' ? [60, 80, 100, 120] : [60, 80, 100, 120])) { const g = GEO.ribbon([[X0 - 200, 0], [X1 + 200, 0]], { width: 2.4, y: 0, color: 0xffffff, opacity: 0.32 }); g.rotation.x = Math.PI / 2; g.position.set(0, yOf(v), Zc - 1); S.sea.overlay.add(g); grid.push([g, v]); }
      const lb = GEO.labels(S.layer, { color: '#fff4e6' });
      for (const [, v] of grid) lb.add('$' + v, V(X0 - 260, yOf(v), Zc), { dot: false, dx: 0, dy: 10, align: 'right', size: 0.8, t0: 1.0 });
      const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], mon = (d) => MON[d[1] - 1] + ' ' + d[0];
      const D = shot.duration;
      const title = div(S.layer, `left:6%;top:9%;${SERIF(2.6)}`, mode === 'forecast' ? 'Brent: the forecast and the reality' : 'Brent crude, $ per barrel'); plate(S.layer, 'tl', 0.45).style.zIndex = -1;
      source(S.layer, P.source ?? (mode === 'forecast' ? 'FORECAST: EIA STEO, MARCH 2026 (PATH APPROXIMATE) · BRENT SPOT: EIA, MONTHLY' : mode === 'peak' ? 'BRENT SPOT: EIA, MONTHLY AVERAGE AND DAILY HIGHS (2 APR, 15 SEP 2026)' : 'DATA: U.S. ENERGY INFORMATION ADMINISTRATION, BRENT SPOT (RBRTE), MONTHLY'));
      lb.add(mon(data[0]), V(X0, Y0 - 40, Zc), { dot: false, dy: 40, size: 0.7, t0: 0.8 });
      lb.add(forecast ? 'DEC 2026' : mon(data.at(-1)), V(X1, Y0 - 40, Zc), { dot: false, dy: 40, size: 0.7, t0: 0.8 });
      // timing per mode
      const tA = forecast ? [0.5, D * 0.28] : [0.6, D * 0.62];
      const drawA = (t) => smoother(clamp((t - tA[0]) / (tA[1] - tA[0])));
      const tF = [tA[1] + 0.2, tA[1] + D * 0.22], tR = [tF[1] + 0.4, Math.min(D - 0.6, tF[1] + 0.4 + D * 0.25)];
      if (forecast) {
        const fe = forecast.at(-1); lb.add('THE FORECAST', V(xOf(fe), yOf(fe[2]), Zc), { dx: 10, dy: 60, align: 'right', size: 0.85, sub: 'EIA, MARCH 2026: ≈ ONE MONTH', show: (t) => ease(t, tF[1] - 0.3, tF[1] + 0.3) });
        const ae = after.at(-1); lb.add('WHAT HAPPENED', V(xOf(ae), yOf(ae[2]), Zc), { dx: 30, dy: -46, align: 'left', size: 0.95, accent: RED, sub: `$${ae[2].toFixed(0)} · ${mon(ae)}`, show: (t) => ease(t, tR[1] - 0.2, tR[1] + 0.4) });
        const m0 = forecast[0]; lb.add('MAR 2026', V(xOf(m0), yOf(m0[2]), Zc), { dx: -20, dy: -40, align: 'right', size: 0.7, show: (t) => ease(t, tA[1] - 0.3, tA[1] + 0.3) });
      } else if (mode === 'july') {
        const jl = data.find(d => d[0] === 2026 && d[1] === 7), jn = data.find(d => d[0] === 2026 && d[1] === 6);
        const iJ = data.indexOf(jl);
        lb.add('JUNE: A DEAL', V(xOf(jn), yOf(jn[2]), Zc), { dx: -10, dy: 70, align: 'right', size: 0.8, sub: '$' + jn[2].toFixed(0), show: (t) => clamp((drawA(t) * (N - 1) - data.indexOf(jn)) / 0.8) });
        lb.add('7 JUL · ATTACKS RESUME', V(xOf(jl), yOf(jl[2]), Zc), { dx: 20, dy: -70, align: 'left', size: 0.95, accent: RED, show: (t) => clamp((drawA(t) * (N - 1) - iJ) / 0.8) });
      } else {
        const peak = data.reduce((a, d, i) => d[2] > data[a][2] ? i : a, 0);
        if (mode !== 'peak') lb.add(`$${data[peak][2].toFixed(0)}`, V(pts[peak][0], pts[peak][1], Zc), { dx: 0, dy: -40, size: 1.6, accent: RED, sub: mon(data[peak]), show: (t) => clamp((drawA(t) * (N - 1) - peak) / 1.5) });
      }
      // peak: the daily spikes above the monthly averages
      const spikes = [];
      if (mode === 'peak') {
        for (const [y, m, v, day, big] of [[2026, 4, 128, '2 APR', false], [2026, 9, 131, '15 SEP', true]]) {
          const d = data.find(q => q[0] === y && q[1] === m), x = xOf(d), y0 = yOf(d[2]), y1 = yOf(v), i = data.indexOf(d);
          const sp = GEO.ribbon([[x, 0], [x, 1]], { width: big ? 10 : 7, y: 0, color: big ? 0xff5a4a : 0xffe2b0, opacity: 0.95, glow: big ? 2.2 : 1.4 }); sp.rotation.x = Math.PI / 2; S.sea.overlay.add(sp);
          const t0 = () => tA[0] + (tA[1] - tA[0]) * (i / (N - 1)) + 0.15;
          spikes.push({ sp, x, y0, y1, t0: t0() });
          lb.add(big ? '$131' : '≈ $128', V(x, y1, Zc), { dx: big ? 26 : -20, dy: big ? -30 : -24, align: big ? 'left' : 'right', size: big ? 1.7 : 0.9, accent: big ? RED : null, sub: `${day} 2026 · DAILY SPOT`, show: (t) => ease(t, t0() + 0.3, t0() + 0.8) });
        }
      }
      const cap = captions(S.layer, shot, { source: null }, H);
      return S.out((t, p) => {
        line.draw(drawA(t) * (N - 1));
        if (fLine) { fLine.draw(ease(t, tF[0], tF[1])); aLine.draw(ease(t, tR[0], tR[1]) * (after.length - 1)); }
        for (const s of spikes) { const k = ease(t, s.t0, s.t0 + 0.6); s.sp.scale.set(1, 1, 1); s.sp.position.set(0, 0, Zc + 2); s.sp.geometry.attributes.position.setY(0, s.y0); const a = s.sp.geometry.attributes.position.array;
          a[0] = s.x - 4; a[1] = s.y0; a[2] = Zc + 2; a[3] = s.x + 4; a[4] = s.y0; a[5] = Zc + 2; a[6] = s.x - 4; a[7] = lerp(s.y0, s.y1, k); a[8] = Zc + 2; a[9] = s.x + 4; a[10] = lerp(s.y0, s.y1, k); a[11] = Zc + 2; s.sp.geometry.attributes.position.needsUpdate = true; s.sp.rotation.x = 0; s.sp.position.set(0, 0, 0); s.sp.visible = k > 0.001; }
        title.style.opacity = clamp((t - 0.3) / 0.8);
        const k = smoother(p), b = CAM.breath(t, 0.3, 3);
        if (mode === 'july') apply(S.camera, { pos: [lerp(-300, 200, k) + b.x, lerp(10, 18, k) + b.y, lerp(-1100, -1500, k)], look: [lerp(-150, 250, k), lerp(480, 540, k), Zc], mm: 32, roll: b.r });
        else if (mode === 'peak') apply(S.camera, { pos: [lerp(500, -150, k) + b.x, lerp(30, 22, k) + b.y, lerp(-200, -700, k)], look: [lerp(300, 400, k), lerp(500, 560, k), Zc], mm: 30, roll: b.r });
        else apply(S.camera, { pos: [b.x, lerp(16, 28, k) + b.y, lerp(-300, -900, k)], look: [0, lerp(420, 470, k), Zc], mm: 32, roll: b.r });
        S.pres.draw(S.camera, t, { exposure: lerp(1.12, 1.0, drawA(t)) });
        lb.update(S.camera, t, S.W, S.H);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ pipeline-bypass
    // The way around: Saudi Arabia's East-West pipeline (Abqaiq -> Yanbu) and the UAE's Habshan-Fujairah line,
    // drawn across the real desert (Blue Marble + relief). mode 'hit': the East-West line is struck (10 Sep 2026):
    // a red pulse on the line, the oil flowing along it stops and the line beyond the strike goes dark. Abstract;
    // no attribution (contested). params: alt0/alt1
    async 'pipeline-bypass'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load(); const hit = P.mode === 'hit';
      const S = seaSet(ctx, shot, { look: look('map', { sunEl: 40, sunAz: 120, hazeDensity: 1 / 400000 }), spectrum: { hs: 0.2 } });
      S.sea.environment();
      const ar = await SEA.land(S.sea, 'arabia', { root: GEO.ROOT + 'imagery/', exaggeration: 3, segments: 160, deepCut: 1e9, cut: -1e9, floor: 4 });
      S.sea.scene.add(ar.group); ar.setCurvature(0); S.sea.ocean.U.uCurv.value = 0; S.sea.water = P.water ?? true;
      const xz = (la, lo) => ar.projection.xz(la, lo);
      const pipes = [], lb = GEO.labels(S.layer);
      const pl = G.vec.pipelines, cols = { 'East-West (Petroline)': 0xffc24a, 'Habshan-Fujairah (ADCOP)': 0xffc24a, 'Goreh-Jask': 0x9fb6c8 };
      let i = 0, ew = null;
      for (const [name, o] of Object.entries(pl)) {
        if (name === 'Goreh-Jask' && P.iran !== true) continue;
        if (hit && name !== 'East-West (Petroline)') continue;
        const pts = densify(o.path.map(([la, lo]) => xz(la, lo)), 40);
        const m = GEO.ribbon(pts, { width: hit ? 7000 : 9000, y: 6000, color: cols[name], opacity: 0.95, glow: 1.6 }); S.sea.overlay.add(m); pipes.push([m, hit ? 0.2 : 0.8 + i * 1.6]);
        if (name === 'East-West (Petroline)') ew = { pts, m };
        const end = o.path.at(-1), [ex, ez] = xz(end[0], end[1]);
        lb.add(name.split(' (')[0].toUpperCase(), V(ex, 9000, ez), { t0: hit ? 0.4 : 1.6 + i * 1.6, sub: hit ? '' : o.cap.split(' (')[0], dx: i ? 70 : -40, dy: i ? 70 : -50, align: i ? 'left' : 'right' }); i++;
      }
      const hz = V(...(() => { const [x, z] = xz(26.56, 56.45); return [x, 0, z]; })());
      lb.add('STRAIT OF HORMUZ', hz, { accent: RED, t0: 0.4, dx: 60, dy: -60, align: 'left' });
      for (const n of hit ? ['Abqaiq', 'Yanbu'] : ['Abqaiq', 'Yanbu', 'Habshan', 'Fujairah']) { const [la, lo] = G.vec.places[n]; const [x, z] = xz(la, lo); lb.add(n, V(x, 9000, z), { t0: hit ? 0.3 : 1.2, size: 0.7, dy: 34, dx: 0 }); }
      // the strike: a point on the line (illustrative position), red rings, a dark smudge; flow dots stop and dim downstream
      let strike = null;
      if (hit) {
        const L = ew.m.userData.length, sAt = L * 0.46; let acc = 0, sp = ew.pts[0];
        for (let k = 1; k < ew.pts.length; k++) { const d = Math.hypot(ew.pts[k][0] - ew.pts[k - 1][0], ew.pts[k][1] - ew.pts[k - 1][1]); if (acc + d >= sAt) { const f = (sAt - acc) / d; sp = [lerp(ew.pts[k - 1][0], ew.pts[k][0], f), lerp(ew.pts[k - 1][1], ew.pts[k][1], f)]; break; } acc += d; }
        const tS = wt(shot, P.hitAt ?? 'drones', 1.4);
        const rings = [0, 1, 2].map(j => { const pts = []; for (let a = 0; a <= 64; a++) pts.push([sp[0] + Math.cos(a / 64 * Math.PI * 2) * 1, sp[1] + Math.sin(a / 64 * Math.PI * 2) * 1]); const m = GEO.ribbon(pts, { width: 0.08, y: 7000, color: 0xff3b2e, opacity: 0.9, glow: 1.8 }); S.sea.overlay.add(m); m.userData.j = j; return m; });
        const dark = GEO.ribbon(ew.pts, { width: 7600, y: 6100, color: 0x2a2a2a, opacity: 0.0, glow: 0.4 }); S.sea.overlay.add(dark);
        lb.add('DRONE STRIKE', V(sp[0], 9000, sp[1]), { accent: RED, dx: 50, dy: -70, align: 'left', size: 1.05, sub: '10 SEP 2026 · PUMPING SHUT 11–22 SEP', show: (t) => ease(t, tS + 0.3, tS + 0.8) });
        const flowG = new THREE.BufferGeometry(), nF = 90; flowG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nF * 3), 3));
        const flowM = new THREE.PointsMaterial({ color: 0xfff0c0, size: 5 * S.H / 1080, sizeAttenuation: false, transparent: true, depthWrite: false, map: dotTex(), blending: THREE.AdditiveBlending });
        const flowP = new THREE.Points(flowG, flowM); flowP.frustumCulled = false; flowP.renderOrder = 70; S.sea.overlay.add(flowP);
        const cum = [0]; for (let k = 1; k < ew.pts.length; k++) cum.push(cum[k - 1] + Math.hypot(ew.pts[k][0] - ew.pts[k - 1][0], ew.pts[k][1] - ew.pts[k - 1][1]));
        const at = (s) => { s = clamp(s, 0, L); let k = 1; while (k < cum.length - 1 && cum[k] < s) k++; const f = (s - cum[k - 1]) / (cum[k] - cum[k - 1] || 1); return [lerp(ew.pts[k - 1][0], ew.pts[k][0], f), lerp(ew.pts[k - 1][1], ew.pts[k][1], f)]; };
        strike = { sp, tS, rings, dark, flow(t) { const a = flowG.attributes.position.array; const v = L / 9, tStop = tS + 0.4;
          for (let k = 0; k < nF; k++) { const s0 = (k / nF) * L; const tt = Math.min(t, tStop) + Math.max(0, t - tStop) * Math.max(0, 1 - (t - tStop) / 1.2) * 0.4; let s = (s0 + v * tt) % L;
            const q = at(s); a[k * 3] = q[0]; a[k * 3 + 1] = 7500; a[k * 3 + 2] = q[1]; } flowG.attributes.position.needsUpdate = true; flowM.opacity = 0.9 * (1 - 0.75 * ease(t, tStop, tStop + 1.5)); } };
      }
      source(S.layer, hit ? 'ROUTE SCHEMATIC · STRIKE POSITION ILLUSTRATIVE · SOURCE: EIA STEO, OCT 2026 · IMAGERY: NASA BLUE MARBLE' : 'ROUTES SCHEMATIC · CAPACITY: EIA (2025) · IMAGERY: NASA BLUE MARBLE');
      const c = (() => { const [x, z] = hit ? xz(24.6, 44.5) : xz(24.2, 48.3); return V(x, 0, z); })();
      const cap = captions(S.layer, shot, { source: null }, H);
      return S.out((t, p) => {
        const k = smoother(p), alt = hit ? lerp(P.alt0 ?? 1.55e6, P.alt1 ?? 1.25e6, k) : lerp(P.alt0 ?? 2.3e6, P.alt1 ?? 1.7e6, k);
        apply(S.camera, { pos: [c.x + lerp(-60e3, 60e3, k), alt, c.z + alt * 0.62], look: [c.x + lerp(-40e3, 80e3, k), 0, c.z - 60e3], mm: 35 });
        for (const [m, t0] of pipes) m.material.uniforms.uDraw.value = m.userData.length * smoother(clamp((t - t0) / (hit ? 1.0 : 2.2)));
        if (strike) {
          const { sp, tS, rings, dark } = strike;
          rings.forEach(m => { const u = t - tS - m.userData.j * 0.35, k2 = clamp(u / 1.6); const r = lerp(8000, 120000, smoother(k2));
            m.scale.set(r, 1, r); m.position.set(sp[0] * (1 - r), 0, sp[1] * (1 - r)); m.material.uniforms.uOp.value = u > 0 ? 0.9 * (1 - k2) : 0; m.visible = u > 0; });
          ew.m.material.uniforms.uCol.value.setHex(0xffc24a).lerp(new THREE.Color(0x8a6a50), ease(t, tS + 0.5, tS + 2.2));
          dark.material.uniforms.uOp.value = 0.35 * ease(t, tS + 0.4, tS + 2);
          strike.flow(t);
        }
        S.pres.draw(S.camera, t, { haze: 0.25 });
        lb.update(S.camera, t, S.W, S.H);
        cap(t);
      });
    },

    // ------------------------------------------------------------------ footage
    // Public-domain clips through engine/footage.js. Ungraded (grade 'none': the episode LUT grades them),
    // captioned on a plate. params: everything FT.footage takes; fallback: 'drone-sky' (a CG RQ-4 high over
    // the strait) when the clip is not in the library.
    async footage(ctx, shot) {
      const P0 = shot.params ?? {};
      const exists = async (url) => { try { const r = await fetch(url, { method: 'GET' }); return r.ok; } catch { return false; } };
      if (!(await exists(`/assets/footage/clips/${P0.file}.json`)) && P0.fallback) return SETS[P0.fallback] ? SETS[P0.fallback](ctx, shot) : droneSky(ctx, shot);
      // prefer the ungraded sequence; use the prepared one the project asked for if that is what exists
      let P = { ...P0, grade: P0.grade ?? 'none' }; delete P.caption; delete P.source; delete P.fallback;
      if (P0.grade == null && !(await exists(`/.cache/footage/seq/${FT.seqKey(P)}/meta.json`))) P = { ...P, grade: 'house' };
      const f = await FT.footage(ctx, shot, P);
      const layer = f.layer ?? GEO.layerOf(ctx);
      const cap = captions(layer, shot, { at: 0.4 }, H);
      return { ...f, layer, update(t, p) { const r = f.update(t, p); cap(t); return r; }, dispose() { f.dispose(); layer.remove(); } };
    },
    'drone-sky'(ctx, shot) { return droneSky(ctx, shot); },

    // look-dev helpers (not for the episode)
    async 'ship-look'(ctx, shot) {
      const P = shot.params ?? {}; const S = seaSet(ctx, shot, { fov: P.fov ?? 40, look: P.lookName ? look(P.lookName) : undefined });
      S.sea.environment();
      const sh = SEA.ship(P.kind ?? 'vlcc', P.ship ?? {}); S.sea.addShip(sh); sh.place(0, 0, P.heading ?? 90, P.speed ?? 6);
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea); const az = ((P.az ?? 30) + (P.orbit ?? 0) * t) * Math.PI / 180, hd = st.heading + az;
        const d = P.dist ?? 260, cx = st.x + Math.sin(hd) * d, cz = st.z - Math.cos(hd) * d;
        apply(S.camera, { pos: [cx, P.h ?? 30, cz], look: [st.x + Math.sin(st.heading) * (P.lookFwd ?? 0), P.lookY ?? 10, st.z - Math.cos(st.heading) * (P.lookFwd ?? 0)], mm: P.mm ?? 40 });
        S.sea.shadows(V(st.x, 0, st.z), sh.length * 0.65);
        S.pres.draw(S.camera, t);
      });
    },
  };

  // ==================================================================== mode builders
  async function anchoredHero(ctx, shot, G) {
    const P = shot.params ?? {};
    const S = seaSet(ctx, shot, { look: P.golden === false ? look('bright-day', { sunEl: 30, sunAz: 250 }) : look('golden', { sunEl: 8, sunAz: 256 }), spectrum: { hs: 0.5, wind: 5 } });
    S.sea.environment();
    await withLand(S, { lod: 2 });
    const c = [36000, 0, 22000];                                     // an anchorage off the Musandam east coast
    const sh = SEA.ship('vlcc', { name: 'NORDIC HORIZON', seed: 8, loaded: 0.92, anchored: true, hullColor: '#22303f', deckColor: '#4d5649' }); sh.wake = 0.45; S.sea.addShip(sh); sh.place(c[0], c[2], 300, 0);
    anchorage(S.sea, [c[0] - 4500, 0, c[2] - 2500], { n: 9, r: 3600, seed: 12, heading: 300, minGap: 900 });
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const st = sh.pose(t, S.sea), [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx, k = smoother(p), L = sh.length;
      // under the bow on the port side, at the waterline, sliding aft so the chain and the stem pass overhead
      const b = CAM.breath(t, 0.25, 4), h = (P.h ?? 3) + b.y * 0.6;
      const u = L / 2 + lerp(75, 58, k), off = -(sh.beam / 2 + lerp(38, 30, k));
      apply(S.camera, { pos: [st.x + fx * u + sx * off, h, st.z + fz * u + sz * off], look: [st.x + fx * (L * 0.36) + sx * -6, 13, st.z + fz * (L * 0.36) + sz * -6], mm: P.mm ?? 35, roll: b.r * 1.5 });
      S.sea.shadows(V(st.x + fx * L * 0.3, 0, st.z + fz * L * 0.3), L * 0.4, 2048);
      S.pres.draw(S.camera, t);
      cap(t);
    });
  }
  async function smokeHero(ctx, shot, G) {
    const P = shot.params ?? {};
    const S = seaSet(ctx, shot, { look: look('smoke', { sunEl: 44, sunAz: 205 }), spectrum: { hs: 0.7, wind: 6 } });
    S.sea.environment();
    await withLand(S, { lod: 1 });
    const pos = [26000, 0, 18000];                                   // off Oman's coast, east of the strait
    const sh = SEA.ship('vlcc', { name: P.name ?? 'SKY LIGHT', seed: 18, loaded: 0.8, hullColor: '#1e1f22', deckColor: '#6b4436' }); sh.wake = 0.3; S.sea.addShip(sh); sh.place(pos[0], pos[2], 245, 0.6);
    const plume = SMOKE.smoke(S.sea, { at: (t) => { const st = sh.state; const [fx, fz] = fwdOf(st.heading); return [st.x + fx * -20, 22, st.z + fz * -20]; }, height: 420, radius: 16, spread: 5, rise: 9, wind: [5.5, 2.5], dark: 0.06, fire: 0.9, n: 140, seed: 7, opacity: 0.95 });
    const haze2 = SMOKE.smoke(S.sea, { at: (t) => { const st = sh.state; return [st.x + 300, 60, st.z + 120]; }, area: [400, 200], height: 160, radius: 70, spread: 2.5, rise: 3, wind: [6, 3], dark: 0.12, n: 40, seed: 9, opacity: 0.4 });
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const st = sh.pose(t, S.sea), k = smoother(p), b = CAM.breath(t, 0.8, 6);
      const cam = [st.x - 1500 + lerp(0, 160, k), 24 + b.y, st.z - 800 + lerp(0, -60, k)];
      apply(S.camera, { pos: [cam[0] + b.x, cam[1], cam[2]], look: [st.x + 60, 110, st.z + 60], mm: P.mm ?? 70, roll: b.r });
      plume.update(t + 100); haze2.update(t + 100);
      S.sea.shadows(V(st.x, 0, st.z), sh.length * 0.6);
      S.pres.draw(S.camera, t);
      cap(t);
    });
  }
  async function seizureWide(ctx, shot, G) {
    const P = shot.params ?? {};
    const S = seaSet(ctx, shot, { look: P.golden === false ? look('bright-day') : look('golden', { sunEl: 9, sunAz: 250 }), spectrum: { hs: 0.6, wind: 5 } });
    S.sea.environment();
    await withLand(S, { lod: 1 });
    const s0 = 32000, q = G.laneIn.at(s0);
    const sh = SEA.ship('vlcc', { name: 'STENA VISION', seed: 33, loaded: 0.6, hullColor: '#5a1d1a', deckColor: '#6b4436' }); sh.wake = 0.4; S.sea.addShip(sh); sh.place(q.x, q.z, q.heading * 180 / Math.PI - 25, 0.4);
    GEO.convoy(S.sea, G.laneOut, { lite: true, n: 3, s0: G.laneOut.nearest(q.x, q.z) - 4500, gap: 3000, speed: 7.4, seed: 21, kinds: ['vlcc', 'container', 'lng'] });
    const boats = []; for (let i = 0; i < 5; i++) { const b = SEA.ship('fastboat', { seed: 90 + i }); S.sea.addShip(b); boats.push(b); }
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const st = sh.pose(t, S.sea), k = smoother(p);
      // boats hold a loose ring round the tanker, idling (short wakes), each drifting slowly along the ring
      boats.forEach((b, i) => { const R = 140 + (i % 3) * 50, a = i * 1.26 + (i % 2 ? 1 : -1) * 0.02 * t, v = 3.5;
        const x = st.x + Math.cos(a) * R * 1.6, z = st.z + Math.sin(a) * R; const head = Math.atan2(-Math.sin(a) * (i % 2 ? 1 : -1), -Math.cos(a) * (i % 2 ? 1 : -1) * 0.6) ;
        b.place(x, z, head * 180 / Math.PI, v); b.fixed.x -= Math.sin(b.fixed.heading) * v * t; b.fixed.z += Math.cos(b.fixed.heading) * v * t; b.pose(t, S.sea); });
      // into the low sun: the stopped tanker and its ring of boats on the glitter
      const a = (P.az ?? 250) + 10 * (k - 0.5), r = lerp(1300, 1150, k), h = lerp(260, 230, k), ar = a * Math.PI / 180, b = CAM.breath(t, 2, 5);
      apply(S.camera, { pos: [st.x - Math.sin(ar) * r + b.x, h + b.y, st.z + Math.cos(ar) * r], look: [st.x, 0, st.z], mm: P.mm ?? 40, roll: b.r });
      S.sea.shadows(V(st.x, 0, st.z), 300);
      S.pres.draw(S.camera, t);
      cap(t);
    });
  }
  async function lanesLow(ctx, shot, G) {
    const P = shot.params ?? {};
    const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 46, sunAz: 196 }), spectrum: { hs: 0.75, wind: 6 } });
    S.sea.environment();
    await withLand(S, { lod: 0 });
    // in the outbound lane near the narrows, looking south to the Quoin islands and the Musandam cliffs
    const s0 = G.laneOut.nearest(...G.P.xz(26.55, 56.47)), q = G.laneOut.at(s0);
    const vl = SEA.ship('vlcc', { name: 'GULF STAR', seed: 41, hullColor: '#1e1f22', deckColor: '#4d5649' }); S.sea.addShip(vl); vl.follow(G.laneOut, { s0: s0 - 420, speed: 7.2 });
    const dd = SEA.ship('destroyer', { number: '78', seed: 42 }); S.sea.addShip(dd); dd.follow(G.laneOut, { s0: s0 - 3600, speed: 7.4 });
    const [fx, fz] = fwdOf(q.heading), sx = -fz, sz = fx;
    const cam = [q.x - sx * 1300, 7, q.z - sz * 1300];
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const k = smoother(p), b = CAM.breath(t, 0.4, 3), st = vl.pose(t, S.sea);
      const yaw = Math.atan2(sx, -sz) + lerp(-0.05, 0.06, k);
      apply(S.camera, { pos: [cam[0] + b.x, cam[1] + b.y * 0.5, cam[2]], look: [cam[0] + Math.sin(yaw) * 4000, 30, cam[2] - Math.cos(yaw) * 4000], mm: P.mm ?? 40, roll: b.r });
      S.sea.shadows(V(st.x, 0, st.z), 220);
      S.pres.draw(S.camera, t);
      cap(t);
    });
  }
  async function blockade(ctx, shot, G) {
    const P = shot.params ?? {};
    const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 34, sunAz: 228, hazeDensity: 1 / 26000 }), spectrum: { hs: 1.0, wind: 8 } });
    S.sea.environment();
    const d1 = SEA.ship('destroyer', { number: '107', seed: 51 }); S.sea.addShip(d1); d1.place(0, 0, 80, 12);
    const d2 = SEA.ship('destroyer', { number: '96', seed: 52 }); S.sea.addShip(d2); d2.place(-700, -650, 80, 12);
    const cr = SEA.ship('cruiser', { number: '64', seed: 53, flag: 'us' }); S.sea.addShip(cr); cr.place(-2200, -1500, 80, 11.5);
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const st = d1.pose(t, S.sea), [fx, fz] = fwdOf(st.heading), sx = -fz, sz = fx, k = smoother(p), b = CAM.breath(t, 0.6, 7);
      // a camera boat pacing the lead ship 260 m off its starboard beam, the line receding behind it
      const pos = [st.x + sx * 520 + fx * lerp(260, 330, k) + b.x, 14 + b.y, st.z + sz * 520 + fz * lerp(260, 330, k)];
      apply(S.camera, { pos, look: [st.x - fx * lerp(120, 80, k), 10, st.z - fz * lerp(120, 80, k)], mm: P.mm ?? 70, roll: b.r });
      S.sea.shadows(V(st.x, 0, st.z), 140);
      S.pres.draw(S.camera, t);
      cap(t);
    });
  }
  // a CG RQ-4 high over the strait (footage fallback): the long-winged drone fills the bottom of the frame,
  // the strait 17 km below, camera chasing slightly above
  async function droneSky(ctx, shot) {
    const P = shot.params ?? {}; const G = await GEO.load();
    const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 55, sunAz: 150 }) });
    S.sea.environment();
    await withLand(S, { lod: 0 });
    GEO.convoy(S.sea, G.laneIn, { lite: true, n: 6, s0: 15000, gap: 2600, speed: 7.2, seed: 3 });
    GEO.convoy(S.sea, G.laneOut, { lite: true, n: 4, s0: 22000, gap: 3200, speed: 7.4, seed: 11 });
    const drone = rq4(); S.sea.scene.add(drone);
    const p0 = G.P.xz(26.42, 56.25), hdg = 70 * Math.PI / 180, v = 160, alt = 15000;
    const cap = captions(S.layer, shot, {}, H);
    return S.out((t, p) => {
      const k = smoother(p), x = p0[0] + Math.sin(hdg) * v * t, z = p0[1] - Math.cos(hdg) * v * t;
      drone.position.set(x, alt, z); drone.rotation.set(0, Math.PI / 2 - hdg, 0); drone.rotateX(0.02 * Math.sin(t * 0.4));
      const back = lerp(48, 40, k), up = lerp(14, 10, k), side = lerp(-22, -14, k), b = CAM.breath(t, 0.4, 2);
      const fx = Math.sin(hdg), fz = -Math.cos(hdg), sx = -fz, sz = fx;
      apply(S.camera, { pos: [x - fx * back + sx * side + b.x, alt + up + b.y, z - fz * back + sz * side], look: [x + fx * 60, alt - 30, z + fz * 60], mm: P.mm ?? 28, roll: b.r });
      S.sea.shadows(V(x, alt, z), 30, 1024);
      S.pres.draw(S.camera, t, { near: 0.5 });
      cap(t);
    });
  }

  return { async preload() { await FT.ready(); await GEO.load(); }, ...SETS };
}

// ---------------------------------------------------------------- RQ-4 Global Hawk (CG, for the fallback)
function rq4() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xc9cccd, roughness: 0.45, metalness: 0.2 }), dk = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.5 });
  const fus = new THREE.LatheGeometry([[0, -7.2], [0.35, -7], [0.55, -6], [0.7, -3], [0.82, 0], [0.8, 2.5], [0.6, 5.5], [0.3, 6.8], [0.05, 7]].map(([r, y]) => new THREE.Vector2(r, y)), 20); fus.rotateZ(-Math.PI / 2);
  const nose = new THREE.SphereGeometry(0.95, 20, 12); nose.scale(1.9, 0.85, 1); nose.translate(5.0, 0.2, 0);
  const wing = new THREE.BoxGeometry(1.6, 0.18, 39.9); const p = wing.attributes.position; for (let i = 0; i < p.count; i++) { const zz = Math.abs(p.getZ(i)) / 20; p.setX(i, p.getX(i) * (1 - zz * 0.55) - zz * 0.6); p.setY(i, p.getY(i) + zz * zz * 0.6); } wing.computeVertexNormals(); wing.translate(0.6, 0.2, 0);
  const eng = new THREE.CylinderGeometry(0.62, 0.5, 4.2, 16); eng.rotateZ(Math.PI / 2); eng.translate(-4.6, 1.15, 0);
  const vt = (s) => { const b = new THREE.BoxGeometry(1.4, 0.08, 3.0); b.translate(0, 0, s * 1.5); b.rotateX(-s * 0.85); b.translate(-6.4, 0.7, 0); return b; };
  for (const [geo, mat] of [[fus, m], [nose, m], [wing, m], [eng, m], [vt(1), m], [vt(-1), m]]) { const me = new THREE.Mesh(geo, mat); me.castShadow = true; g.add(me); }
  const inlet = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14), dk); inlet.rotation.y = Math.PI / 2; inlet.position.set(-2.45, 1.15, 0); g.add(inlet);
  return g;
}

// ---------------------------------------------------------------- helpers
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
function sample(lane, s0, s1, step = 500) { const out = []; for (let s = s0; s <= s1; s += step) { const q = lane.at(s); out.push([q.x, q.z]); } return out; }
function densify(pts, n) { const out = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const f = k / n; out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); } out.push(pts.at(-1)); return out; }
let _dot = null;
function dotTex() { if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); _dot = new THREE.CanvasTexture(c); return _dot; }

// the narrowest water gap between the Iranian islands (Larak) and the Omani side (Musandam / Quoin), from the coast data
function narrowest(G) {
  // measured on the DEM by the bake (see facts.json): Larak Island -> the Quoin Islands, 38.8 km = 21 nmi
  const n = G.facts.narrowest, a = G.P.xz(...n.a), b = G.P.xz(...n.b);
  return [V(a[0], 0, a[1]), V(b[0], 0, b[1])];
}

// a thick line of light in a vertical plane (chart), drawn progressively: draw(i) shows points 0..i (fractional)
function lineMesh(pts, z, width, color) {
  const n = pts.length, seg = 24, pos = new Float32Array((n - 1) * seg * 2 * 3 + 6), idx = [];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const M = (n - 1) * seg + 1; for (let i = 0; i < M - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } g.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 70;
  // monotone cubic through the points (no overshoot), sampled
  const at = (u) => { const i = Math.min(n - 2, Math.floor(u)), f = u - i, p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const m1 = (p2[1] - p0[1]) / 2, m2 = (p3[1] - p1[1]) / 2, h00 = 2 * f ** 3 - 3 * f ** 2 + 1, h10 = f ** 3 - 2 * f ** 2 + f, h01 = -2 * f ** 3 + 3 * f ** 2, h11 = f ** 3 - f ** 2;
    return [lerp(p1[0], p2[0], f), h00 * p1[1] + h10 * m1 + h01 * p2[1] + h11 * m2]; };
  return { mesh, draw(u) {
    const m = Math.max(2, Math.round(u * seg) + 1);
    for (let i = 0; i < M; i++) { const uu = Math.min(u, i / seg); const p = at(uu), q = at(Math.min(n - 1, uu + 0.02)); const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      pos.set([p[0] - dy / l * width, p[1] + dx / l * width, z, p[0] + dy / l * width, p[1] - dx / l * width, z], i * 6); }
    g.setDrawRange(0, Math.max(0, (m - 1) * 6)); g.attributes.position.needsUpdate = true; } };
}

// spray and rooster tails behind small fast boats: analytic particles (age = phase of a periodic emitter)
function sprayPoints(sea, nBoats, per = 70) {
  const n = nBoats * per, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.2), size: 1.6, transparent: true, opacity: 0.5, depthWrite: false, map: dotTex() });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; sea.overlay.add(pts);
  const r = K.rng(77), seeds = Array.from({ length: n }, () => [r(), r(), r(), r()]);
  return (t, boats) => { const a = g.attributes.position.array;
    for (let b = 0; b < boats.length; b++) { const st = boats[b].state, fx = Math.sin(st.heading), fz = -Math.cos(st.heading), sx = -fz, sz = fx, L = boats[b].length;
      for (let k = 0; k < per; k++) { const i = b * per + k, [s0, s1, s2, s3] = seeds[i]; const age = ((t * 1.4 + s0) % 1);
        const back = L * 0.5 + age * 22 * (0.5 + s1), up = Math.sin(age * Math.PI) * (2.2 + s2 * 2.5), lat = (s3 - 0.5) * (1.5 + age * 6);
        a[i * 3] = st.x - fx * back + sx * lat; a[i * 3 + 1] = up; a[i * 3 + 2] = st.z - fz * back + sz * lat; } }
    g.attributes.position.needsUpdate = true; };
}

// a procedural Gulf oil terminal on a desert shore (local frame: shore along x at z = 0, sea to the north, -z)
function terminal(sea, { lng = false } = {}) {
  const g = new THREE.Group(); sea.scene.add(g);
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.05, ...o });
  // sand: seabed sloping from the beach to 22 m, the desert behind (canvas texture: dunes, tracks)
  const sandTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#cdb68e'; x.fillRect(0, 0, 512, 512); const r = K.rng(3);
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '90,70,40' : '255,245,220'},${0.04 + r() * 0.06})`; x.fillRect(r() * 512, r() * 512, 2 + r() * 20, 1 + r() * 3); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.anisotropy = 8; return t; })();
  const N = 160, size = 9000, geo = new THREE.PlaneGeometry(size, size, N, N); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position; const r = K.rng(9);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i);
    const shore = 60 * Math.sin(x / 900) + 40 * Math.sin(x / 330 + 1);
    const d = z - shore; let y = d > 0 ? Math.min(6, d * 0.02) + Math.max(0, (d - 300) * 0.01) * (0.5 + 0.5 * Math.sin(x / 400 + z / 300)) : Math.max(-24, d * 0.012 - Math.pow(Math.max(0, -d - 600) / 1000, 1.3) * 8);
    if (d < 0) y += Math.sin(x / 40) * 0.15 + Math.sin(z / 23 + x / 70) * 0.1;            // sand ripples under the water
    p.setY(i, y); }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, std(0xffffff, { map: sandTex, roughness: 0.95 })); ground.receiveShadow = true; ground.position.set(0, 0, 900); g.add(ground);
  if (lng) return lngPlant(g, std, ground);
  // tank farm: 24 white floating-roof tanks on the shore, bunds, pipe racks
  const white = std(0xe9e5dc, { roughness: 0.55 }), steel = std(0x8d9091, { roughness: 0.45, metalness: 0.6 });
  const tanks = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) tanks.push([-1400 + i * 130, 1500 + j * 130]);
  const tg = new THREE.CylinderGeometry(42, 42, 20, 40); const im = new THREE.InstancedMesh(tg, white, tanks.length); const m4 = new THREE.Matrix4();
  tanks.forEach(([x, z], i) => { m4.makeTranslation(x, 10 + 6, z); im.setMatrixAt(i, m4); }); im.castShadow = im.receiveShadow = true; g.add(im);
  const roofs = new THREE.InstancedMesh(new THREE.CylinderGeometry(40, 40, 0.6, 40), std(0xa9a69d, { roughness: 0.6 }), tanks.length); tanks.forEach(([x, z], i) => { m4.makeTranslation(x, 6 + 17, z); roofs.setMatrixAt(i, m4); }); g.add(roofs);
  const bunds = new THREE.Mesh(new THREE.BoxGeometry(820, 2, 560), std(0xbfa57c)); bunds.position.set(-1075, 6, 1695); bunds.receiveShadow = true; g.add(bunds);
  // trestle: a 1.6 km causeway of piles + deck + pipes out to deep water, a T-head with two berths
  const jx = -300; const tre = []; const L0 = 300, L1 = -1500;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, L0 - L1), std(0x7b7f80, { roughness: 0.7 })); deck.position.set(jx, 9, (L0 + L1) / 2); deck.castShadow = deck.receiveShadow = true; g.add(deck);
  const pipeG = new THREE.CylinderGeometry(0.6, 0.6, L0 - L1, 10); pipeG.rotateX(Math.PI / 2);
  for (let k = 0; k < 4; k++) { const pm = new THREE.Mesh(pipeG, steel); pm.position.set(jx - 4 + k * 2.6, 10.4, (L0 + L1) / 2); g.add(pm); }
  const pileG = new THREE.CylinderGeometry(0.7, 0.7, 40, 8); const npile = Math.floor((L0 - L1) / 30) * 2; const piles = new THREE.InstancedMesh(pileG, std(0x5a5a55), npile + 40); let pi = 0;
  for (let z = L1; z < L0; z += 30) for (const sd of [-1, 1]) { m4.makeTranslation(jx + sd * 6, -11, z); piles.setMatrixAt(pi++, m4); }
  const head = new THREE.Mesh(new THREE.BoxGeometry(520, 2, 40), std(0x55595a, { roughness: 0.9 })); head.position.set(jx, 10, L1 - 20); head.castShadow = head.receiveShadow = true; g.add(head);
  for (let x = -250; x <= 250; x += 25) for (const zz of [L1 - 5, L1 - 35]) { if (pi >= npile + 40) break; m4.makeTranslation(jx + x, -11, zz); piles.setMatrixAt(pi++, m4); }
  piles.count = pi; g.add(piles);
  // loading platforms with arms + dolphins
  for (const bx of [-140, 140]) {
    const plat = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 26), std(0x6f7375)); plat.position.set(jx + bx, 11, L1 - 50); plat.castShadow = true; g.add(plat);
    for (let a = 0; a < 4; a++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 18, 0.9), std(0xd9c23b, { roughness: 0.5 })); arm.position.set(jx + bx - 12 + a * 8, 21, L1 - 56); arm.rotation.x = -0.35; arm.castShadow = true; g.add(arm); }
    for (const dx of [-160, -60, 60, 160]) { const dol = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 5, 16), std(0x9a9d9e)); dol.position.set(jx + bx + dx * 0.9, 10, L1 - 60); g.add(dol); }
  }
  // a few flares, a jetty building
  const bld = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 18), white); bld.position.set(jx + 40, 14, L1 - 20); bld.castShadow = true; g.add(bld);
  return { group: g, berth: V(jx, 0, L1 - 60 - 32) };
}

// NASA Blue Marble globe with clouds and an atmosphere rim, positioned in the sea's local frame
// (the strait at the local origin; earth centre at (0, -R, 0)); renders into its own target.
async function makeGlobe(ctx, G) {
  const R = 6371000, lat0 = G.set.center.lat * Math.PI / 180, lon0 = G.set.center.lon * Math.PI / 180;
  const load = (u) => new Promise((ok, no) => new THREE.TextureLoader().load(u, ok, undefined, no));
  const [day, clouds] = await Promise.all([load('/assets/world/earth/day.jpg'), load('/assets/world/earth/clouds.jpg')]);
  day.colorSpace = THREE.SRGBColorSpace; day.anisotropy = 8;
  // ENU basis at the anchor in ECEF
  const E = V(-Math.sin(lon0), Math.cos(lon0), 0), Nn = V(-Math.sin(lat0) * Math.cos(lon0), -Math.sin(lat0) * Math.sin(lon0), Math.cos(lat0)), U = V(Math.cos(lat0) * Math.cos(lon0), Math.cos(lat0) * Math.sin(lon0), Math.sin(lat0));
  // local = (x east, y up, z south): rotation matrix rows
  const M = new THREE.Matrix4().set(E.x, E.y, E.z, 0, U.x, U.y, U.z, -R, -Nn.x, -Nn.y, -Nn.z, 0, 0, 0, 0, 1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const geo = new THREE.SphereGeometry(R, 192, 96);
  // three's sphere: x = -cos(phi) sin(theta)..., map to ECEF so that uv (equirect) matches lon/lat
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const lon = (uv.getX(i) - 0.5) * Math.PI * 2, lat = (uv.getY(i) - 0.5) * Math.PI; pos.setXYZ(i, R * Math.cos(lat) * Math.cos(lon), R * Math.cos(lat) * Math.sin(lon), R * Math.sin(lat)); }
  geo.computeVertexNormals(); geo.applyMatrix4(M);
  const sun = new THREE.Vector3(...SEA.sunDir(SEA.LOOKS['bright-day']).toArray());
  const mat = new THREE.ShaderMaterial({ uniforms: { tDay: { value: day }, tCl: { value: clouds }, uSun: { value: sun }, uCam: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D tDay, tCl; uniform vec3 uSun, uCam; varying vec2 vUv; varying vec3 vN, vW;
      void main(){ vec3 n = normalize(vN); vec3 v = normalize(uCam - vW); float l = clamp(dot(n, normalize(uSun)) * 1.1 + .15, 0., 1.);
        vec3 c = pow(texture2D(tDay, vUv).rgb, vec3(1.0)) * 1.15; float cl = texture2D(tCl, vUv).r; c = mix(c, vec3(.95), smoothstep(.15, .8, cl) * .85);
        float fres = pow(1. - max(dot(n, v), 0.), 3.); c = mix(c, vec3(.45, .65, 1.), fres * .6);
        gl_FragColor = vec4(c * l, 1.); }` });
  const earth = new THREE.Mesh(geo, mat); earth.frustumCulled = false; scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 96, 48), new THREE.ShaderMaterial({ uniforms: { uCam: mat.uniforms.uCam, uC: { value: new THREE.Vector3(0, -R, 0) } }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uCam, uC; varying vec3 vW; void main(){ vec3 v = normalize(vW - uCam); vec3 oc = uCam - uC; float b = dot(oc, v); float d = length(oc + v * max(-b, 0.)) / ${(R).toFixed(1)};
      float a = smoothstep(1.025, .995, d) * smoothstep(.97, 1.0, d); gl_FragColor = vec4(vec3(.35, .6, 1.) * a * 1.4, a); }` }));
  atm.position.set(0, -R, 0); atm.frustumCulled = false; scene.add(atm);
  const cam = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 1000, 1e8);
  const full = ctx.renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(full.x, full.y, { type: THREE.UnsignedByteType });
  return { rt, draw(renderer, pos, look, t) {
    CAM.apply(cam, { pos, look, mm: 30, up: [0, 0, -1] }); const h = pos[1]; cam.near = Math.max(100, h * 0.3); cam.far = h + 2 * R; cam.updateProjectionMatrix();
    mat.uniforms.uCam.value.set(...pos);
    renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(null);
    // linear -> display for the plain MeshBasic path: the shader output is display-referred already
  } };
}

// Ras Laffan-style LNG plant (illustrative): six process trains in a row behind the shore (each a pipe rack
// spine with fin-fan air-cooler banks on top, fractionation columns, a cold box, compressor houses), four
// full-containment tanks, a flare area with cold stacks, a jetty with two berths. Everything shut down: no
// flame, no steam. Local frame as terminal(): shore along x, sea at -z.
function lngPlant(g, std, ground) {
  const white = std(0xd9d6ce, { roughness: 0.55 }), grey = std(0x8e9191, { roughness: 0.6, metalness: 0.3 }), dark = std(0x4b4f52, { roughness: 0.6, metalness: 0.3 }), rack = std(0x6e7376, { roughness: 0.6, metalness: 0.4 }), fin = std(0x9a9e9f, { roughness: 0.4, metalness: 0.6 }), yellow = std(0xc4a43c, { roughness: 0.6 });
  const geos = { white: [], grey: [], dark: [], rack: [], fin: [], yellow: [] };
  const box = (k, w, h, d, x, y, z) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); geos[k].push(b); };
  const cyl = (k, r0, r1, h, x, y, z, seg = 14) => { const c = new THREE.CylinderGeometry(r0, r1, h, seg); c.translate(x, y, z); geos[k].push(c); };
  const y0 = 7, r = K.rng(31);
  for (let tr = 0; tr < 6; tr++) {
    const z0 = 1400 + tr * 210, x0 = -900, len = 900;
    box('rack', len, 1.2, 14, x0 + len / 2, y0 + 9, z0); for (let x = x0; x < x0 + len; x += 18) { box('rack', 0.8, 9, 0.8, x, y0 + 4.5, z0 - 6.5); box('rack', 0.8, 9, 0.8, x, y0 + 4.5, z0 + 6.5); }
    box('fin', len * 0.8, 2.2, 22, x0 + len * 0.45, y0 + 11.5, z0); for (let x = x0 + 20; x < x0 + len * 0.85; x += 12) cyl('dark', 2.6, 2.6, 0.6, x, y0 + 12.9, z0 - 5.5, 12), cyl('dark', 2.6, 2.6, 0.6, x, y0 + 12.9, z0 + 5.5, 12);
    for (let k = 0; k < 7; k++) { const h = 30 + r() * 45, rr = 2.2 + r() * 2.2, x = x0 + 60 + k * 110 + r() * 30, z = z0 + (k % 2 ? 40 : -40); cyl('white', rr, rr, h, x, y0 + h / 2, z); cyl('grey', rr * 1.06, rr * 1.06, 1, x, y0 + h * 0.66, z); box('rack', rr * 2.6, 0.3, rr * 2.6, x, y0 + h * 0.8, z); }
    box('white', 26, 52, 22, x0 + len - 60, y0 + 26, z0 + 50);                  // the cold box (main cryogenic exchanger)
    box('grey', 70, 16, 34, x0 + len - 150, y0 + 8, z0 - 55);                   // compressor house
    for (let k = 0; k < 4; k++) cyl('white', 6, 6, 12, x0 + 140 + k * 30, y0 + 6, z0 + 60, 18);
  }
  // full-containment LNG tanks (concrete, domed roof), near the jetty root
  for (let k = 0; k < 4; k++) { const x = 350 + k * 120, z = 900 + (k % 2) * 110; cyl('white', 42, 42, 38, x, y0 + 19, z, 40); const dome = new THREE.SphereGeometry(42, 40, 10, 0, Math.PI * 2, 0, 0.4); dome.translate(x, y0 + 38 - 42 * Math.cos(0.4), z); geos.white.push(dome); box('rack', 6, 6, 6, x, y0 + 41, z); }
  // flare stacks: tall, cold (no flame), with guy-wire platforms
  for (let k = 0; k < 3; k++) { const x = 1200 + k * 40, z = 2200; cyl('grey', 1.4, 1.8, 140, x, y0 + 70, z, 10); for (const yy of [40, 80, 120]) box('rack', 5, 0.5, 5, x, y0 + yy, z); cyl('dark', 2, 2, 3, x, y0 + 141, z, 10); }
  // jetty: trestle to a long berth line with loading platforms (arms parked)
  const jx = -300, L0 = 300, L1 = -1500;
  box('dark', 16, 1.4, L0 - L1, jx, 9, (L0 + L1) / 2); for (let k = 0; k < 4; k++) { const p = new THREE.CylinderGeometry(0.7, 0.7, L0 - L1, 10); p.rotateX(Math.PI / 2); p.translate(jx - 4 + k * 2.6, 10.6, (L0 + L1) / 2); geos.grey.push(p); }
  box('dark', 900, 2.2, 36, jx + 280, 10, L1 - 18);
  for (const bx of [-140, 420]) { box('grey', 44, 4, 30, jx + bx, 12, L1 - 46); for (let a = 0; a < 4; a++) { const arm = new THREE.BoxGeometry(1, 20, 1); arm.rotateX(-0.12); arm.translate(jx + bx - 14 + a * 9, 24, L1 - 54); geos.yellow.push(arm); } }
  // shore roads and sheds
  for (let k = 0; k < 10; k++) box('white', 30 + r() * 40, 8 + r() * 6, 20 + r() * 20, -1200 + r() * 2400, y0 + 5, 700 + r() * 300);
  const mats = { white, grey, dark, rack, fin, yellow };
  for (const [k, list] of Object.entries(geos)) if (list.length) { const m = new THREE.Mesh(mergeGeometries(list.map(x => x.index ? x.toNonIndexed() : x)), mats[k]); m.castShadow = m.receiveShadow = true; g.add(m); }
  return { group: g, berth: V(jx - 140, 0, L1 - 46 - 26), plant: V(-300, 0, 1500) };
}

// a dashed line of light (forecasts): static dashes, revealed with draw(u in 0..1)
function dashLine(pts, z, width, color, dash = 60) {
  const pos = [], idx = []; let n = 0;
  const L = []; let acc = 0; for (let i = 0; i < pts.length; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(acc); }
  const at = (s) => { let i = 1; while (i < L.length - 1 && L[i] < s) i++; const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; };
  const order = [];
  for (let s = 0; s < acc; s += dash * 2) { const a = at(s), b = at(Math.min(acc, s + dash)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * width, ny = dx / l * width;
    pos.push(a[0] + nx, a[1] + ny, z, a[0] - nx, a[1] - ny, z, b[0] + nx, b[1] + ny, z, b[0] - nx, b[1] - ny, z); idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; order.push(s / acc); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.8), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })); mesh.frustumCulled = false; mesh.renderOrder = 69;
  return { mesh, draw(u) { const k = order.filter(o => o <= u + 1e-6).length; g.setDrawRange(0, k * 6); } };
}

// a bridge (wheelhouse) interior fitted into the accommodation's top deck: floor, ceiling, back wall, the
// window wall (sill, header, mullions; open glazing), consoles with radar/ECDIS screens, a VHF set on the
// forward console (channel 16, live waveform), the captain's chair. Ship-local coordinates.
function bridgeRoom(A, P = {}) {
  const group = new THREE.Group(), whLen = A.whLen, W = Math.min(A.wing - 4, 40), Hh = 2.9;
  const floor = A.top - Hh, front = A.whX + whLen / 2 - 0.4, back = A.whX - whLen / 2 + 0.4, depth = front - back;
  const dim = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.05, envMapIntensity: 0.6 });
  const add = (gg, m, x, y, z) => { const o = new THREE.Mesh(gg, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; group.add(o); return o; };
  const cx = (front + back) / 2;
  add(new THREE.BoxGeometry(depth, 0.12, W), dim(0x7a7672, 0.8), cx, floor, 0);
  add(new THREE.BoxGeometry(depth + 1, 0.2, W + 1), dim(0xd9d6cf), cx, floor + Hh, 0);
  add(new THREE.BoxGeometry(0.2, Hh, W), dim(0xcfcbc2), back, floor + Hh / 2, 0);
  add(new THREE.BoxGeometry(0.25, 1.05, W), dim(0x8b8f91), front, floor + 0.52, 0);
  add(new THREE.BoxGeometry(0.25, 0.32, W), dim(0x8b8f91), front, floor + Hh - 0.16, 0);
  for (let i = 0; i <= 16; i++) add(new THREE.BoxGeometry(0.14, Hh, 0.12), dim(0x55595b), front, floor + Hh / 2, -W / 2 + i * W / 16);
  for (const sd of [-1, 1]) add(new THREE.BoxGeometry(depth, Hh, 0.2), dim(0xcfcbc2), cx, floor + Hh / 2, sd * W / 2);
  const scr = (hue) => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#04121a'; x.fillRect(0, 0, 256, 160);
    x.strokeStyle = hue; x.lineWidth = 1.5; for (let r = 20; r < 90; r += 18) { x.beginPath(); x.arc(128, 80, r, 0, Math.PI * 2); x.stroke(); }
    for (let i = 0; i < 9; i++) { x.fillStyle = hue; x.fillRect(128 + Math.cos(i * 1.9) * (20 + i * 7), 80 + Math.sin(i * 2.3) * (16 + i * 6), 4, 3); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.6, 1.6, 1.6) }); };
  for (const z of [-6, -2.2, 1.6, 5.4]) { add(new THREE.BoxGeometry(1.2, 1.0, 3.2), dim(0x5d6266, 0.5), front - 1.2, floor + 0.5, z);
    const s = add(new THREE.PlaneGeometry(1.0, 0.65), scr(z < 0 ? '#3fe0a0' : '#ffb347'), front - 1.75, floor + 1.25, z); s.rotation.y = -Math.PI / 2; s.rotateX(-0.3); }
  // VHF set on the console's top, starboard of centre: a grey box with an LCD (channel 16), a speaker grille, the handset on its hook
  const rx = front - 1.05, ry = floor + 1.02, rz = 3.2;
  add(new THREE.BoxGeometry(0.3, 0.12, 0.42), dim(0x8a8f93, 0.4), rx, ry + 0.06, rz);
  const lcd = document.createElement('canvas'); lcd.width = 256; lcd.height = 96; const lx = lcd.getContext('2d'); const lt = new THREE.CanvasTexture(lcd); lt.colorSpace = THREE.SRGBColorSpace;
  const lm = new THREE.MeshBasicMaterial({ map: lt, color: new THREE.Color(1.4, 1.4, 1.4), side: THREE.DoubleSide, toneMapped: false });
  const face = add(new THREE.PlaneGeometry(0.38, 0.1), lm, rx - 0.165, ry + 0.06, rz); face.rotation.y = -Math.PI / 2; face.castShadow = face.receiveShadow = false;
  const hand = add(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), dim(0x1c1d1e, 0.5), rx - 0.02, ry + 0.22, rz - 0.3);
  add(new THREE.BoxGeometry(0.4, 0.5, 0.5), dim(0x3a3d40, 0.5), front - 2.2, floor + 0.25, -0.5);          // chair base
  add(new THREE.BoxGeometry(0.6, 0.7, 0.6), dim(0x24262a, 0.8), front - 2.2, floor + 0.85, -0.5);
  for (const z of [-8, 0, 8]) { const fill = new THREE.PointLight(0xe6eef5, 90, 22, 2); fill.position.set(cx - 1, floor + Hh - 0.5, z); group.add(fill); }
  return { group, floor, front, radio: { x: rx, y: ry, z: rz }, update(t) {
    lx.fillStyle = '#0a1a14'; lx.fillRect(0, 0, 256, 96); lx.fillStyle = '#9dffcf'; lx.font = '700 54px "Plex Mono", monospace'; lx.textBaseline = 'middle'; lx.fillText('16', 14, 50);
    lx.font = '500 16px "Plex Mono", monospace'; lx.fillText('DSC  25W  RX', 100, 22);
    lx.strokeStyle = '#9dffcf'; lx.lineWidth = 2; lx.beginPath(); for (let i = 0; i < 140; i++) { const a = Math.sin(i * 0.31 + t * 9) * Math.sin(i * 0.07 + t * 2.3) * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 0.02))); lx.lineTo(100 + i, 62 + a * 22); } lx.stroke();
    lt.needsUpdate = true; } };
}
