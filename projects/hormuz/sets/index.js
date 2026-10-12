// Episode 3 sets: "The Strait That Controls a Fifth of the World's Oil" (the Strait of Hormuz).
//
// House set format: makeHormuz(H) returns { preload(ctx, shots), <set>(ctx, shot) -> Promise<{ scene, camera, layer, update(t, p), dispose }> }.
// Register like the Palantir libraries:   const { preload, ...sets } = makeHormuz(H); Object.assign(SETS, sets);
// (factories are async: they load imagery and build ships once; await them, as projects/hormuz-lab/scene.js does).
// Every frame is a pure function of (t, p): ships move analytically along the real TSS lanes, waves are an
// FFT of t, cameras are eased closed-form paths. Params per set are documented above each set.
import * as THREE from 'three';
import * as K from 'kit';
import * as CAM from '/engine/camera.js';
import * as SEA from '/engine/sea/index.js';
import * as FT from '/engine/footage.js';
import * as GEO from './geo.js';

const smoother = CAM.smoother, lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const MONO = (size = 0.9, color = '#f6f2ea', ls = 0.18) => `font:500 ${size}em 'Plex Mono',monospace;letter-spacing:${ls}em;text-transform:uppercase;color:${color};text-shadow:0 1px 8px rgba(0,0,0,.5)`;
const SERIF = (size = 3.2, color = '#f6f2ea') => `font:400 ${size}em/1.02 'Instrument Serif',serif;color:${color};text-shadow:0 2px 18px rgba(0,0,0,.45)`;
const RED = '#e0241b';
// a look with overrides (e.g. the sun higher for high noon)
const look = (name, o = {}) => ({ ...SEA.LOOKS[name], ...o });

export function makeHormuz(H = {}) {
  const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
  const div = (layer, css, html = '') => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;' + css; d.innerHTML = html; layer.appendChild(d); return d; };
  const source = (layer, text) => div(layer, `right:4.2%;bottom:4.6%;${MONO(0.62, 'rgba(255,255,255,.82)', 0.16)}`, text);

  // a sea, its presenter (house set format), a camera and a DOM layer
  function seaSet(ctx, shot, o = {}) {
    const P = shot.params ?? {};
    const sea = new SEA.Sea(ctx.renderer, { look: P.look ? (typeof P.look === 'string' ? SEA.LOOKS[P.look] : P.look) : o.look ?? 'bright-day', spectrum: { ...(o.spectrum ?? {}), ...(P.spectrum ?? {}) }, ocean: { ...(o.ocean ?? {}), ...(P.ocean ?? {}) }, renderScale: P.renderScale ?? o.renderScale ?? 1, bloom: o.bloom });
    const pres = sea.presenter();
    const camera = new THREE.PerspectiveCamera(o.fov ?? 40, ctx.width / ctx.height, 0.1, 1e6);
    const layer = layerOf(ctx);
    return { sea, pres, camera, layer, W: ctx.width, H: ctx.height,
      out(update) { return { scene: pres.scene, camera, layer, update, sea, dispose() { pres.dispose(); sea.dispose(); layer.remove(); } }; } };
  }
  const apply = (camera, s) => CAM.apply(camera, s);
  async function withLand(S, { levels = 99, lod = 0, depthLevel = 1, root } = {}) {
    const L = await SEA.land(S.sea, 'hormuz', { root: root ?? GEO.ROOT + 'imagery/', lod, levels });
    S.sea.scene.add(L.group);
    const b = L.bathy[Math.min(depthLevel, L.bathy.length - 1)], U = S.sea.ocean.U;
    U.uDepthTex.value = b.tex; U.uDepthBox.value.copy(b.box); U.uDepthOn.value = 1;
    const c = L.bathy.at(-1); if (c !== b) { U.uDepthTex2.value = c.tex; U.uDepthBox2.value.copy(c.box); }
    return L;
  }

  const SETS = {
    // ------------------------------------------------------------------ strait-aerial
    // A single file of tankers through the real TSS lanes at high noon, seen from a drone/aircraft.
    // params: alt (m, 1600), along (m along the inbound lane where the camera looks, 26000), drift (m/s, 40),
    //         side (m off the lane, -2500), heading offset deg (yawOff, 0), mm (lens, 32), golden (bool)
    async 'strait-aerial'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden') : look('bright-day', { sunEl: 72, sunAz: 170 }) });
      S.sea.environment();
      await withLand(S, { lod: P.lod ?? 0 });
      // camera over the south-east end of the scheme, looking up the lanes towards Larak and the Iranian coast
      const [cx, cz] = G.P.xz(...(P.from ?? [26.515, 56.60])), [lx, lz] = G.P.xz(...(P.to ?? [26.565, 56.545]));
      const sIn = G.laneIn.nearest(lx, lz), sOut = G.laneOut.nearest(lx, lz);
      GEO.convoy(S.sea, G.laneIn, { n: P.nIn ?? 7, s0: sIn - 6500, gap: 2300, speed: 7.2, seed: 2, names: ['ARABIAN DAWN', 'GULF STAR', 'SEA PEARL', 'NORDIC HORIZON', 'MARAN ORION', 'DESERT ROSE', 'AL SAFLIYA'] });
      GEO.convoy(S.sea, G.laneOut, { n: P.nOut ?? 6, s0: sOut - 7000, gap: 2600, speed: 7.5, seed: 9, kinds: ['vlcc', 'lng', 'container', 'vlcc'] });
      const D = shot.duration, dx = lx - cx, dz = lz - cz, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
      return S.out((t, p) => {
        const k = smoother(p), along = (P.drift ?? 45) * (t - D / 2), alt = (P.alt ?? 1500) * (1 - 0.05 * k);
        const b = CAM.breath(t, P.float ?? 3, 2);
        apply(S.camera, { pos: [cx + ux * along + b.x, alt + b.y, cz + uz * along], look: [lx + ux * along, 0, lz + uz * along], mm: P.mm ?? 30, roll: b.r });
        S.pres.draw(S.camera, t);
      });
    },

    // ------------------------------------------------------------------ tanker-hero
    // Low, over-water tracking shot alongside a laden VLCC; the drone overtakes from amidships to the bow.
    // params: off (m off the hull side, 70), h (camera height, 9), from / to (fraction of the hull from stern, 0.45 -> 0.95), mm (28), golden
    async 'tanker-hero'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden') : look('bright-day', { sunEl: 40, sunAz: 245 }) });
      S.sea.environment();
      if (P.land !== false) await withLand(S, { lod: 1 });
      const sh = SEA.ship('vlcc', { name: P.name ?? 'ARABIAN DAWN', seed: 4, loaded: 1, hullColor: P.hull ?? '#3b2725', deckColor: '#55604f' }); S.sea.addShip(sh);
      sh.follow(G.laneIn, { s0: P.s0 ?? 30000, speed: 7.5 });
      const others = GEO.convoy(S.sea, G.laneIn, { n: 2, s0: (P.s0 ?? 30000) + 2600, gap: 2500, speed: 7.3, seed: 5 });
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea), k = smoother(p), L = sh.length;
        const fx = Math.sin(st.heading), fz = -Math.cos(st.heading), sx = -fz, sz = fx, side = P.side ?? -1;
        const u = lerp(P.from ?? 0.3, P.to ?? 0.75, k) * L - L / 2, off = sh.beam / 2 + lerp(P.off ?? 120, (P.off ?? 120) * 0.85, k);
        const b = CAM.breath(t, 0.5, 5), hh = lerp(P.h ?? 42, (P.h ?? 42) * 0.8, k) + b.y;
        const pos = [st.x + fx * u + sx * off * side, hh, st.z + fz * u + sz * off * side];
        const lk = [st.x + fx * (u + 90), 4 + (P.lookY ?? 0), st.z + fz * (u + 90)];
        apply(S.camera, { pos: [pos[0] + b.x * sx, pos[1], pos[2] + b.x * sz], look: lk, mm: P.mm ?? 24, roll: b.r * 2 });
        S.sea.shadows(V(st.x, 0, st.z), L * 0.6);
        S.pres.draw(S.camera, t);
      });
    },

    // ------------------------------------------------------------------ bridge
    // On the bridge of a VLCC in the inbound lane: silhouetted watch officers, consoles, the long deck
    // ahead and the next tanker in the file. params: mm (24), look ('bright-day'), crew (3)
    async bridge(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const PE = await import('/engine/people/index.js');
      await PE.preload({ wardrobe: ['military', 'casual_a', 'office'] });
      const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 55, sunAz: 215 }) });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const sh = SEA.ship('vlcc', { name: 'ARABIAN DAWN', seed: 4 }); S.sea.addShip(sh); sh.follow(G.laneIn, { s0: P.s0 ?? 26000, speed: 7.4 });
      GEO.convoy(S.sea, G.laneIn, { n: 2, s0: (P.s0 ?? 26000) + 2200, gap: 2600, speed: 7.2, seed: 7 });
      // the bridge: a room on top of the accommodation block, in ship-local coordinates
      sh.parts.house.scale.y = 0.86; sh.parts.house.position.y -= sh.parts.house.geometry.parameters.height * 0.07; sh.parts.wings.visible = false;
      const [bx, by] = sh.parts.bridge, room = new THREE.Group(); room.position.set(bx - 4, by - 1.3, 0); sh.body.add(room);
      const dim = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.1, envMapIntensity: 0.35 });
      const W = 34, Dp = 8, Hh = 2.9;
      const add = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; room.add(o); return o; };
      add(new THREE.BoxGeometry(Dp, 0.12, W), dim(0x2a2c2e), 0, 0, 0);                                // floor
      add(new THREE.BoxGeometry(Dp + 1, 0.2, W + 1), dim(0xd9d6cf), 0, Hh, 0);                        // ceiling
      add(new THREE.BoxGeometry(0.2, Hh, W), dim(0xcfcbc2), -Dp / 2, Hh / 2, 0);                       // back wall
      add(new THREE.BoxGeometry(0.25, 1.05, W), dim(0x8b8f91), Dp / 2, 0.52, 0);                       // window sill wall
      add(new THREE.BoxGeometry(0.25, 0.32, W), dim(0x8b8f91), Dp / 2, Hh - 0.16, 0);                  // header
      for (let i = 0; i <= 14; i++) add(new THREE.BoxGeometry(0.16, Hh, 0.14), dim(0x55595b), Dp / 2, Hh / 2, -W / 2 + i * W / 14); // mullions
      for (const sd of [-1, 1]) add(new THREE.BoxGeometry(Dp, Hh, 0.2), dim(0xcfcbc2), 0, Hh / 2, sd * W / 2);
      // consoles with screens (radar, ECDIS) under the windows, captain's chair
      const scr = (w, h, hue) => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#04121a'; x.fillRect(0, 0, 256, 160);
        x.strokeStyle = hue; x.lineWidth = 1.5; for (let r = 20; r < 90; r += 18) { x.beginPath(); x.arc(128, 80, r, 0, Math.PI * 2); x.stroke(); }
        for (let i = 0; i < 9; i++) { x.fillStyle = hue; x.fillRect(128 + Math.cos(i * 1.9) * (20 + i * 7), 80 + Math.sin(i * 2.3) * (16 + i * 6), 4, 3); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.6, 1.6, 1.6) }); };
      for (const z of [-6, -2.2, 1.6, 5.4]) { add(new THREE.BoxGeometry(1.2, 1.0, 3.2), dim(0x3a3d40, 0.5), Dp / 2 - 1.2, 0.5, z);
        const s = add(new THREE.PlaneGeometry(1.0, 0.65), scr(1, 1, z < 0 ? '#3fe0a0' : '#ffb347'), Dp / 2 - 1.75, 1.25, z); s.rotation.y = -Math.PI / 2 + 0.0; s.rotation.x = 0; s.rotateX(-0.3); }
      { const fill = new THREE.PointLight(0xdfe8f0, 18, 16, 2); fill.position.set(-1, Hh - 0.4, 0); room.add(fill); }   // bounce light from the bright windows
      // crew: silhouettes (backlit by the windows)
      const crew = [];
      const ids = ['military', 'casual_a', 'office'];
      for (let i = 0; i < (P.crew ?? 3); i++) { const m = PE.person(ids[i % 3], { dress: { silhouette: true } }); m.root.position.set([1.2, 0.2, 1.8][i], 0.06, [-3.8, 3.2, 0.4][i]); m.root.rotation.y = [Math.PI / 2 - 0.3, Math.PI / 2 + 0.2, Math.PI / 2][i]; room.add(m.root); crew.push(m); }
      return S.out((t, p) => {
        const st = sh.pose(t, S.sea); sh.update(t, S.sea);
        crew.forEach((m, i) => m.blend([[i === 2 ? 'idle_b' : 'idle', t + i * 3, 1]]).update());
        const k = smoother(p), b = CAM.breath(t, 0.04, 9);
        const loc = V(lerp(-2.6, -1.4, k) + bx - 4, by - 1.3 + 1.62 + b.y, lerp(-1.2, 0.6, k) + b.x), aim = V(bx - 4 + 60, by - 12, lerp(-6, 2, k));
        const wp = sh.worldOf(loc.toArray()), wa = sh.worldOf(aim.toArray());
        apply(S.camera, { pos: wp.toArray(), look: wa.toArray(), mm: P.mm ?? 24, roll: st.roll * 0.0 + b.r });
        S.camera.near = 0.1;
        S.sea.shadows(V(st.x, 0, st.z), 180);
        S.pres.draw(S.camera, t, { near: 0.1 });
      });
    },

    // ------------------------------------------------------------------ chokepoint-map
    // The strait as a clean 3D map: real imagery and relief, the TSS lanes, the 21 nmi width callout and
    // oil flowing through as two particle streams. params: alt0/alt1 (m, 230e3 -> 140e3), labels (true)
    async 'chokepoint-map'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('map', { sunEl: 50, sunAz: 140, exposure: 1.05 }), spectrum: { hs: 0.4 } });
      S.sea.environment();
      const land = await withLand(S, { lod: 1, depthLevel: 1 });
      if (P.flat !== false) { land.setCurvature(0); S.sea.ocean.U.uCurv.value = 0; }
      // lanes + separation zone, slightly above the water
      for (const w of G.tssLocal) {
        if (w.type === 'separation_zone') { const sh = new THREE.Shape(w.pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
          const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, depthTest: false })); m.position.y = 40; m.renderOrder = 40; S.sea.overlay.add(m); }
        if (w.type === 'separation_boundary') S.sea.overlay.add(GEO.ribbon(w.pts, { width: 180, y: 45, color: 0xffffff, opacity: 0.7, dash: 1400, depthTest: false }));
      }
      const laneIn = GEO.ribbon(sample(G.laneIn, 28000, 72000), { width: 3700, y: 35, color: 0x5fd4ff, opacity: 0.22, glow: 1.3, depthTest: false });
      const laneOut = GEO.ribbon(sample(G.laneOut, 28000, 72000), { width: 3700, y: 35, color: 0xffc24a, opacity: 0.22, glow: 1.3, depthTest: false });
      S.sea.overlay.add(laneIn, laneOut);
      // flows: glowing particles moving along each lane (inbound empty tankers, outbound laden: brighter, denser)
      const flow = (lane, n, col, speed, size) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
        const m = new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false, map: dotTex(), blending: THREE.AdditiveBlending });
        const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 60; S.sea.overlay.add(pts);
        const r = K.rng(n); const off = Array.from({ length: n }, () => [r(), (r() - 0.5) * 2600]);
        return (t) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { const s = 15000 + ((off[i][0] * 75000 + speed * t) % 75000); const q = lane.at(s), fx = Math.sin(q.heading), fz = -Math.cos(q.heading);
          a[i * 3] = q.x + fz * off[i][1] * -1; a[i * 3 + 1] = 60; a[i * 3 + 2] = q.z + fx * off[i][1]; } g.attributes.position.needsUpdate = true; }; };
      const fOut = flow(G.laneOut, 260, 0xffc24a, 2400, 5 * S.H / 1080), fIn = flow(G.laneIn, 120, 0x8fe3ff, 1800, 4 * S.H / 1080);
      // the narrowest crossing: Larak Island's south shore to the Quoin Islands (Didamar), from the coastline data
      const [a, b] = narrowest(G);
      const wl = GEO.ribbon([[a.x, a.z], [b.x, b.z]], { width: 420, y: 80, color: 0xffffff, opacity: 0.95, glow: 1.6 }); S.sea.overlay.add(wl);
      const lb = GEO.labels(S.layer); const km = Math.hypot(a.x - b.x, a.z - b.z) / 1000;
      const L = (n, o) => lb.add(n, G.place(n), o);
      if (P.labels !== false) {
        L('Bandar Abbas', { t0: 0.6 }); lb.add('QESHM', G.place('Qeshm Island'), { t0: 0.8, dot: false, dy: 0, size: 0.85 }); L('Larak', { t0: 1.0, dx: -60, dy: -30, align: 'right' }); L('Hormuz Island', { t0: 1.1, dx: 60, dy: -30, align: 'left' });
        L('Khasab', { t0: 1.3, dy: 50 }); lb.add('OMAN', G.place('Musandam'), { t0: 1.4, dot: false, size: 1.3, dy: 60 }); lb.add('IRAN', V(30000, 0, -95000), { t0: 1.4, dot: false, size: 1.3, dy: 0 });
        lb.add('GULF OF OMAN', V(70000, 0, 45000), { t0: 1.6, dot: false, size: 1.0, dy: 0 }); lb.add('PERSIAN GULF', V(-80000, 0, 20000), { t0: 1.6, dot: false, size: 1.0, dy: 0 });
      }
      const mid = V((a.x + b.x) / 2, 80, (a.z + b.z) / 2);
      const wlab = lb.add(`${Math.round(km / 1.852)} NAUTICAL MILES`, mid, { dx: 120, dy: -10, align: 'left', size: 1.15, t0: P.widthAt ?? 2.2, accent: '#ffffff', sub: `${Math.round(km)} km at the narrowest point` });
      const lq = G.laneOut.at(40000); const lanesLab = lb.add('TWO LANES · 2 MILES EACH', V(lq.x, 0, lq.z), { dx: 80, dy: 60, align: 'left', size: 0.8, t0: (P.widthAt ?? 2.2) + 1.2 });
      source(S.layer, 'IMAGERY: COPERNICUS SENTINEL-2 2025, NASA · LANES: OPENSTREETMAP · ELEVATION: MAPZEN/SRTM');
      const c = V(0, 0, -6000);
      return S.out((t, p) => {
        const k = smoother(p), alt = lerp(P.alt0 ?? 230e3, P.alt1 ?? 140e3, k), az = lerp(-0.25, -0.05, k);
        apply(S.camera, { pos: [c.x + Math.sin(az) * alt * 0.55, alt, c.z + Math.cos(az) * alt * 0.55], look: [c.x, 0, c.z - alt * 0.05], mm: 35 });
        laneIn.material.uniforms.uDraw.value = laneOut.material.uniforms.uDraw.value = laneIn.userData.length * clamp((t - 0.3) / 2.2);
        wl.material.uniforms.uDraw.value = wl.userData.length * smoother(clamp((t - (P.widthAt ?? 2.2)) / 1.0));
        fOut(t); fIn(t);
        S.pres.draw(S.camera, t, { haze: 0.6 });
        lb.update(S.camera, t, S.W, S.H);
      });
    },

    // ------------------------------------------------------------------ globe-dive
    // From the whole Earth down to the strait: NASA Blue Marble globe -> regional imagery -> the lanes at
    // 3 km. params: h0 (m, 1.6e7), h1 (m, 3000)
    async 'globe-dive'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('bright-day', { sunEl: 64, sunAz: 150 }) });
      S.sea.environment();
      await withLand(S, { lod: 0 });
      GEO.convoy(S.sea, G.laneIn, { n: 6, s0: 15000, gap: 2600, speed: 7.2, seed: 3 });
      GEO.convoy(S.sea, G.laneOut, { n: 4, s0: 22000, gap: 3200, speed: 7.4, seed: 11 });
      const globe = await makeGlobe(ctx, G);
      const rt = S.pres.rt, blend = blendQuad();
      const tgt = G.laneIn.at(28000);
      return S.out((t, p) => {
        // altitude: log-linear with a C2 ease, so the apparent speed stays even across six orders of magnitude
        const k = smoother(p), h = Math.exp(lerp(Math.log(P.h0 ?? 1.6e7), Math.log(P.h1 ?? 3000), k));
        const tilt = smoother(clamp((Math.log(4e4) - Math.log(h)) / (Math.log(4e4) - Math.log(P.h1 ?? 3000)))) * 0.95; // tilts from straight down to oblique in the last part
        const back = h * Math.tan(tilt * 0.9);
        const pos = [tgt.x - 2000 * tilt, h, tgt.z + back * 0.6], look = [tgt.x, 0, tgt.z - back * 0.25];
        const fade = smoother(clamp((Math.log(h) - Math.log(3.2e5)) / (Math.log(9e5) - Math.log(3.2e5))));   // 1 = globe only
        if (fade < 0.999) { apply(S.camera, { pos, look, mm: 30, up: [0, 0, -1] }); S.pres.draw(S.camera, t); }
        if (fade > 0.001) { globe.draw(ctx.renderer, pos, look, t, G); }
        blend.set(globe.rt.texture, rt.texture, fade); S.camera.userData.pres = blend;
      });
      function blendQuad() { // replace the presenter's quad material: mix the globe and the sea frames
        const q = S.pres.scene.children[0], m = q.material; const U = { tA: m.uniforms.tC, tB: { value: null }, k: { value: 0 } };
        q.material = new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
          fragmentShader: 'uniform sampler2D tA, tB; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = mix(texture2D(tA, vUv), texture2D(tB, vUv), k); }', depthTest: false, depthWrite: false });
        return { set(globeTex, seaTex, k) { U.tA.value = seaTex; U.tB.value = globeTex; U.k.value = k; } };
      }
    },

    // ------------------------------------------------------------------ gulf-terminal
    // An oil terminal: tank farm on a desert shore, a 1.4 km trestle to two loading jetties, a VLCC
    // alongside, turquoise shallows over sand. params: orbit (deg over the shot, 30), alt (m, 260), golden
    async 'gulf-terminal'(ctx, shot) {
      const P = shot.params ?? {};
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden', { sunAz: 250 }) : look('bright-day', { sunEl: 48, sunAz: 140 }), spectrum: { hs: 0.45, wind: 5 } });
      S.sea.environment();
      const T = terminal(S.sea);
      const vl = SEA.ship('vlcc', { name: 'GULF STAR', seed: 12, loaded: 0.35 }); S.sea.addShip(vl); vl.place(T.berth.x, T.berth.z, 90, 0); vl.wake = 0;
      const vl2 = SEA.ship('vlcc', { name: 'MARAN ORION', seed: 13, loaded: 0.9, hullColor: '#5a1d1a', deckColor: '#7a3a2a' }); S.sea.addShip(vl2); vl2.place(T.berth.x - 300, T.berth.z + 4200, 80, 5.5);
      source(S.layer, 'ILLUSTRATIVE TERMINAL · BASED ON RAS TANURA AND FUJAIRAH LAYOUTS');
      return S.out((t, p) => {
        const k = smoother(p), a = ((P.az ?? 215) + (P.orbit ?? 24) * (k - 0.5)) * Math.PI / 180, r = P.r ?? 760, h = P.alt ?? 330;
        const c = V(T.berth.x, 0, T.berth.z + 380), b = CAM.breath(t, 2, 4);
        apply(S.camera, { pos: [c.x + Math.sin(a) * r + b.x, h + b.y, c.z + Math.cos(a) * r], look: [c.x, 0, c.z], mm: P.mm ?? 30, roll: b.r });
        S.sea.shadows(V(T.berth.x - 300, 0, T.berth.z - 300), 900, 2048);
        S.pres.draw(S.camera, t);
      });
    },

    // ------------------------------------------------------------------ navy-escort
    // A US destroyer abreast of a laden VLCC in the inbound lane; drone from astern and above.
    async 'navy-escort'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden') : look('bright-day', { sunEl: 60, sunAz: 200 }) });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const vl = SEA.ship('vlcc', { name: 'DESERT ROSE', seed: 21 }); S.sea.addShip(vl); vl.follow(G.laneIn, { s0: P.s0 ?? 24000, speed: 7.6 });
      const dd = SEA.ship('destroyer', { number: P.number ?? '112', seed: 22 }); S.sea.addShip(dd);
      // the destroyer steams on a parallel track 380 m to port, slightly ahead
      const track = SEA.lane(sample(G.laneIn, 0, G.laneIn.length).map(([x, z], i, a) => { const q = G.laneIn.at(i / (a.length - 1) * G.laneIn.length); return [x + Math.cos(q.heading) * -380, z + Math.sin(q.heading) * -380]; }));
      dd.follow(track, { s0: (P.s0 ?? 24000) + 260, speed: 7.6 });
      return S.out((t, p) => {
        const st = vl.pose(t, S.sea), k = smoother(p);
        const fx = Math.sin(st.heading), fz = -Math.cos(st.heading), sx = -fz, sz = fx;
        const back = lerp(620, 420, k), side = lerp(-120, -260, k), h = lerp(170, 120, k), b = CAM.breath(t, 2.5, 6);
        apply(S.camera, { pos: [st.x - fx * back + sx * side + b.x, h + b.y, st.z - fz * back + sz * side], look: [st.x + fx * 120 + sx * -190, 0, st.z + fz * 120 + sz * -190], mm: P.mm ?? 30, roll: b.r });
        S.sea.shadows(V(st.x + sx * -190, 0, st.z + sz * -190), 420);
        S.pres.draw(S.camera, t);
      });
    },

    // ------------------------------------------------------------------ fast-boats
    // Tension: a swarm of small fast-attack boats closes on a tanker. Low camera off the tanker's side.
    // params: n (boats, 9), from (m, 1700), to (m, 260)
    async 'fast-boats'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: P.golden ? look('golden', { sunEl: 10 }) : look('bright-day', { sunEl: 40, sunAz: 240 }), spectrum: { hs: 1.0, wind: 8 } });
      S.sea.environment();
      await withLand(S, { lod: 1 });
      const vl = SEA.ship('vlcc', { name: 'NORDIC HORIZON', seed: 31 }); S.sea.addShip(vl); vl.follow(G.laneIn, { s0: P.s0 ?? 27000, speed: 6.5 });
      const n = P.n ?? 9, r = K.rng(5), boats = [], D = shot.duration;
      for (let i = 0; i < n; i++) { const b = SEA.ship('fastboat', { seed: 40 + i, color: ['#6b6f5f', '#7a7d70', '#5d6156'][i % 3] }); S.sea.addShip(b); boats.push({ b, row: Math.floor((i + 1) / 2), side: i % 2 ? 1 : -1, j: r() }); }
      const spray = sprayPoints(S.sea, n);
      return S.out((t, p) => {
        const st = vl.pose(t, S.sea), fx = Math.sin(st.heading), fz = -Math.cos(st.heading), sx = -fz, sz = fx;
        // boats: an arrowhead approaching from the starboard beam, converging
        boats.forEach(({ b, row, side, j }, i) => {
          const d = lerp(P.from ?? 520, P.to ?? 95, smoother(clamp(t / D))) + row * 40 + j * 25;
          const lat = side * row * 45 * lerp(1, 0.55, t / D), along = 60 + lat * 1.0 + Math.sin(t * 0.7 + i) * 6;
          const x = st.x + fx * along + sx * d, z = st.z + fz * along + sz * d;
          b.place(x, z, (st.heading - Math.PI / 2 + 0.25 * side * (row > 0 ? 0.3 : 0)) * 180 / Math.PI, 18); b.fixed.x = x; b.fixed.z = z;
          // place() moves along its heading at speed from t = 0: freeze the analytic offset (pose at t uses x + v t)
          b.fixed.x -= Math.sin(b.fixed.heading) * 18 * t; b.fixed.z += Math.cos(b.fixed.heading) * 18 * t;
        });
        boats.forEach(o => o.b.pose(t, S.sea));
        spray(t, boats.map(o => o.b));
        const k = smoother(p), b = CAM.breath(t, 0.5, 8);
        const u = 30, off = vl.beam / 2 + 18, hh = lerp(14, 11, k);
        apply(S.camera, { pos: [st.x + fx * u + sx * off + b.x, hh + b.y, st.z + fz * u + sz * off], look: (() => { let ax = 0, az = 0; for (const o of boats) { ax += o.b.state.x; az += o.b.state.z; } return [ax / boats.length, 1, az / boats.length]; })(), mm: lerp(70, 45, k), roll: b.r });
        S.pres.draw(S.camera, t);
      });
    },

    // ------------------------------------------------------------------ price-shock
    // The sea becomes a chart: Brent (EIA, monthly) rises out of the horizon as a line of light.
    // params: from (year, 2024), months to show (to 2026-09)
    async 'price-shock'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('golden', { sunEl: 9, sunAz: 250, exposure: 0.95 }), spectrum: { hs: 0.6, wind: 5 } });
      S.sea.environment();
      const data = G.brent.data.filter(([y]) => y >= (P.from ?? 2024));
      const N = data.length, X0 = -2600, X1 = 2600, Zc = -5200, Y0 = 70, YS = 9.5;   // chart plane in the sky over the horizon
      const yOf = (v) => Y0 + (v - 50) * YS;
      const pts = data.map(([y, m, v], i) => [lerp(X0, X1, i / (N - 1)), yOf(v)]);
      const line = lineMesh(pts, Zc, 16, 0xffe2b0); S.sea.overlay.add(line.mesh);
      const grid = []; for (const v of [60, 80, 100, 120]) { const g = GEO.ribbon([[X0 - 200, 0], [X1 + 200, 0]], { width: 2.4, y: 0, color: 0xffffff, opacity: 0.35 }); g.rotation.x = Math.PI / 2; g.position.set(0, yOf(v), Zc - 1); S.sea.overlay.add(g); grid.push([g, v]); }
      const lb = GEO.labels(S.layer, { color: '#fff4e6' });
      for (const [g, v] of grid) lb.add('$' + v, V(X0 - 260, yOf(v), Zc), { dot: false, dx: 0, dy: 10, align: 'right', size: 0.8, t0: 1.0 });
      const peak = data.reduce((a, d, i) => d[2] > data[a][2] ? i : a, 0);
      const mon = (d) => ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d[1] - 1] + ' ' + d[0];
      const pk = lb.add(`$${data[peak][2].toFixed(0)}`, V(pts[peak][0], pts[peak][1], Zc), { dx: 0, dy: -40, size: 1.6, accent: RED, sub: mon(data[peak]), show: (t) => clamp((drawAt(t) * (N - 1) - peak) / 1.5) });
      lb.add(mon(data[0]), V(X0, Y0 - 40, Zc), { dot: false, dy: 40, size: 0.7, t0: 0.8 });
      lb.add(mon(data[N - 1]), V(X1, Y0 - 40, Zc), { dot: false, dy: 40, size: 0.7, t0: 0.8 });
      const title = div(S.layer, `left:6%;top:9%;${SERIF(2.6)}`, 'Brent crude, $ per barrel');
      source(S.layer, 'DATA: U.S. ENERGY INFORMATION ADMINISTRATION, BRENT SPOT (RBRTE), MONTHLY');
      const D = shot.duration, drawAt = (t) => smoother(clamp((t - 0.6) / (D * 0.62)));
      return S.out((t, p) => {
        const draw = drawAt(t);
        line.draw(draw * (N - 1));
        const at = Math.min(N - 1, Math.floor(draw * (N - 1)));
        title.style.opacity = clamp((t - 0.3) / 0.8);
        const k = smoother(p), b = CAM.breath(t, 0.3, 3);
        apply(S.camera, { pos: [b.x, lerp(16, 28, k) + b.y, lerp(2400, 1600, k)], look: [0, lerp(380, 460, k), Zc], mm: 32, roll: b.r });
        S.pres.draw(S.camera, t, { exposure: lerp(1, 0.82, draw) });
        lb.update(S.camera, t, S.W, S.H);
      });
    },

    // ------------------------------------------------------------------ pipeline-bypass
    // The way around: Saudi Arabia's East-West pipeline (Abqaiq -> Yanbu) and the UAE's Habshan-Fujairah line,
    // drawn across the real desert (Blue Marble + relief). params: alt0/alt1 (m, 2.6e6 -> 1.9e6)
    async 'pipeline-bypass'(ctx, shot) {
      const P = shot.params ?? {}; const G = await GEO.load();
      const S = seaSet(ctx, shot, { look: look('map', { sunEl: 40, sunAz: 120, hazeDensity: 1 / 400000 }), spectrum: { hs: 0.2 } });
      S.sea.environment();
      const ar = await SEA.land(S.sea, 'arabia', { root: GEO.ROOT + 'imagery/', exaggeration: 3, segments: 160, deepCut: 1e9, darkCut: false, cut: -1e9 });
      S.sea.scene.add(ar.group); ar.setCurvature(0); S.sea.ocean.U.uCurv.value = 0; S.sea.water = P.water ?? false;   // the Blue Marble sea is the map's sea
      // the arabia set has its own centre: express everything in its frame
      const xz = (la, lo) => ar.projection.xz(la, lo);
      const pipes = [], lb = GEO.labels(S.layer);
      const pl = G.vec.pipelines, cols = { 'East-West (Petroline)': 0xffc24a, 'Habshan-Fujairah (ADCOP)': 0xffc24a, 'Goreh-Jask': 0x9fb6c8 };
      let i = 0;
      for (const [name, o] of Object.entries(pl)) {
        if (name === 'Goreh-Jask' && P.iran !== true) continue;
        const pts = densify(o.path.map(([la, lo]) => xz(la, lo)), 40);
        const m = GEO.ribbon(pts, { width: 9000, y: 6000, color: cols[name], opacity: 0.95, glow: 1.6 }); S.sea.overlay.add(m); pipes.push([m, 0.8 + i * 1.6]);
        const end = o.path.at(-1), [ex, ez] = xz(end[0], end[1]);
        lb.add(name.split(' (')[0].toUpperCase(), V(ex, 9000, ez), { t0: 1.6 + i * 1.6, sub: o.cap.split(' (')[0], dx: i ? 70 : -40, dy: i ? 70 : -50, align: i ? 'left' : 'right' }); i++;
      }
      const hz = V(...(() => { const [x, z] = xz(26.56, 56.45); return [x, 0, z]; })());
      lb.add('STRAIT OF HORMUZ', hz, { accent: RED, t0: 0.4, dx: 60, dy: -60, align: 'left' });
      for (const n of ['Abqaiq', 'Yanbu', 'Habshan', 'Fujairah']) { const [la, lo] = G.vec.places[n]; const [x, z] = xz(la, lo); lb.add(n, V(x, 9000, z), { t0: 1.2, size: 0.7, dy: 34, dx: 0 }); }
      source(S.layer, 'ROUTES SCHEMATIC · CAPACITY: EIA (2025) · IMAGERY: NASA BLUE MARBLE');
      const c = (() => { const [x, z] = xz(24.2, 48.3); return V(x, 0, z); })();
      return S.out((t, p) => {
        const k = smoother(p), alt = lerp(P.alt0 ?? 2.3e6, P.alt1 ?? 1.7e6, k);
        apply(S.camera, { pos: [c.x + lerp(-60e3, 60e3, k), alt, c.z + alt * 0.62], look: [c.x + lerp(-40e3, 80e3, k), 0, c.z - 60e3], mm: 35 });
        for (const [m, t0] of pipes) m.material.uniforms.uDraw.value = m.userData.length * smoother(clamp((t - t0) / 2.2));
        S.pres.draw(S.camera, t, { haze: 0.25 });
        lb.update(S.camera, t, S.W, S.H);
      });
    },

    // ------------------------------------------------------------------ footage
    // Public-domain clips (US Navy / DVIDS via Commons, NASA) through engine/footage.js, graded and captioned.
    // params: everything FT.footage takes (file, in, out, speed, grade, reframe, caption, source)
    async footage(ctx, shot) {
      const P = { grade: 'house', ...(shot.params ?? {}) };
      const f = await FT.footage(ctx, shot, P);
      const layer = f.layer ?? layerOf(ctx);
      return { ...f, layer, update(t, p) { f.update(t, p); }, dispose() { f.dispose(); layer.remove(); } };
    },

    // look-dev helpers (not for the episode)
    async 'ship-look'(ctx, shot) {
      const P = shot.params ?? {}; const S = seaSet(ctx, shot, { fov: P.fov ?? 40 });
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
    async 'open-sea'(ctx, shot) {
      const P = shot.params ?? {}; const S = seaSet(ctx, shot);
      S.sea.environment();
      return S.out((t, p) => {
        const h = P.h ?? 12, yaw = (P.yaw ?? 160) * Math.PI / 180, pitch = (P.pitch ?? -8) * Math.PI / 180, x = (P.dx ?? 0) * t, y = h + (P.dh ?? 0) * t;
        apply(S.camera, { pos: [x, y, 0], look: [x + Math.sin(yaw) * Math.cos(pitch), y + Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)], mm: P.mm ?? 30 });
        S.pres.draw(S.camera, t);
      });
    },
  };

  return { async preload() { await FT.ready(); await GEO.load(); }, ...SETS };
}

// ---------------------------------------------------------------- helpers
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
function terminal(sea) {
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
