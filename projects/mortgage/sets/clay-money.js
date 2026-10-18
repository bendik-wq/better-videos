// MORTGAGE clay sets, money dioramas: house-block, bid-stack, seesaw, pipe, debt-tower, vault (alias fed-room).
// White clay on a pale void with a soft drop shadow, warm sun at ~42°, cool sky fill, N8AO, Khronos PBR Neutral.
// One red accent per shot at most (the rate tag, the cutoff line, the spread bracket, the new expensive debt).
// Parameters: projects/mortgage/SETS.md.
import * as THREE from 'three';
import * as CK from '/projects/panama/sets/clay-kit.js';
import * as PR from './clay-props.js';

const { clamp, lerp, range, sstep, smoother, mat, rng, hash } = CK;
const { C } = PR;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export default function makeClayMoney(H) {
  const { C: CINE, P, K } = H;
  const S = () => window.innerHeight / 1080;
  // a diorama stage: void gradient, sun + fill, a soft shadow catcher, post (AO + neutral tone mapping)
  function stage(ctx, shot, { target = [0, 0, 0], span = 30, aoR = 1.5, aoI = 2.4, az = 128, el = 42, bg = ['#9fc3e2', '#dfddd6'], far = 600, fov = 35 } = {}) {
    const P0 = shot.params ?? {};
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.1, far);
    const sun = CK.brightLight(scene, { target, span, fog: false, bg, mapSize: P0.mapSize ?? 4096, el: P0.sunEl ?? el, az: P0.sunAz ?? az, fill: 0.4, hemiI: 0.72, sunI: 3.0 });
    scene.add(CK.catcher(-0.001, { size: span * 30, opacity: 0.16 }));
    const fx = P.post(ctx, scene, camera, { ao: { radius: aoR, intensity: aoI, falloff: 1 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    return { scene, camera, sun, fx, layer: H.layerOf(ctx), P0 };
  }
  const rig = (shot, keys, o = {}) => CINE.path(keys, { duration: shot.duration, float: 0, accel: 0.32, decel: 0.38, ...o });
  const camKeys = (P0, def) => P0.camera ?? def;
  const toS = (v, cam) => K.toScreen(v, cam);
  // a plinth: a rounded slab, top at y = 0 (the diorama's table)
  const plinth = (w, d, { h = 0.5, color = C.plinth, x = 0, z = 0, r = 0.25 } = {}) => { const m = PR.mesh(PR.rbox(w, h, d, r), mat(color, 0.92)); m.position.set(x, -h, z); return m; };
  const fmtPct = (v, dp) => `${v.toFixed(dp)}%`;
  const decimals = (s) => (String(s).split('.')[1] ?? '').replace(/[^0-9]/g, '').length;
  const num = (s) => Number(String(s).replace(/[^0-9.\-]/g, ''));
  // a DOM stamp (ink border, rotated), pops in: .show(k)
  function stamp(layer, text, css, { color = C.ink, size = 120, rot = -8 } = {}) {
    const s = S(), el = K.div(layer, `${css};padding:${10 * s}px ${34 * s}px;border:${9 * s}px solid ${color};border-radius:${16 * s}px;color:${color};font:700 ${size * s}px/1 ${H.FONT.ui};letter-spacing:.06em;background:rgba(251,248,242,.55);transform-origin:50% 50%`, text);
    el.show = (k) => { el.style.opacity = String(clamp(k * 3)); el.style.transform = `rotate(${rot}deg) scale(${lerp(1.7, 1, CK.outCubic(k))})`; };
    el.show(0); return el;
  }
  // a big counter slab (top left) with a small sub line under it
  function counter(layer, sub, css = 'left:5.5%;top:7%') {
    const s = S();
    const el = K.div(layer, `opacity:1;${css};padding:${10 * s}px ${22 * s}px;background:#0b0b0b;color:#fff;font:700 ${80 * s}px/1 ${H.FONT.ui};letter-spacing:.01em`, '');
    const sb = sub ? K.div(layer, `opacity:1;${css.replace(/top:([\d.]+)%/, (m, v) => `top:${Number(v) + 9.6}%`)};padding:${6 * s}px ${14 * s}px;background:${C.paper};color:${C.ink};font:700 ${28 * s}px/1 ${H.FONT.ui};letter-spacing:.04em;text-transform:uppercase`, sub) : null;
    return { el, sb, set(html, a = 1) { el.innerHTML = html; el.style.opacity = String(a); if (sb) sb.style.opacity = String(a); } };
  }

  // ======================================================================== house-block: the hero (the thumbnail)
  // modes: idle | tag (swings on at `at`) | sold (gavel strikes at `at`, SOLD stamp) | rate (tag text from -> to over `span`)
  // views: hero | wide | close | gavel
  async function houseBlock(ctx, shot) {
    const { scene, camera, layer, fx, sun, P0 } = stage(ctx, shot, { target: [0, 4, 0], span: 22, aoR: 1.4, aoI: 2.6, az: 132, el: 42 });
    const mode = P0.mode ?? 'idle', view = P0.view ?? ({ rate: 'close', sold: 'gavel' }[mode] ?? 'hero');
    scene.add(plinth(34, 28, { h: 0.6, color: C.lawn, r: 0.3 }));
    scene.add(plinth(35, 29, { h: 0.35, color: '#efe9dd', r: 0.2 })); scene.children.at(-1).position.y = -0.95;
    const blk = PR.auctionBlock({ w: 16, d: 13, h: 2.4, lot: P0.lot ?? 'LOT 1' }); scene.add(blk);
    const TOP = blk.top;
    const hs = PR.house({ w: 10, d: 8, h: 4.6, R: 3.6, roof: P0.roof ?? C.roof }); hs.position.set(-0.6, TOP, -1.2); scene.add(hs);
    // lawn dressing: bushes along the block, two trees behind, a path
    scene.add(PR.bushes([[-9.5, 3], [-9.6, -2], [-9.2, -5], [9.6, -4], [9.8, 1.5], [-6, -7.6], [4, -7.7], [7.5, -7.4]].map(([x, z], i) => ({ x, y: 0, z, s: 0.9 + 0.3 * hash(i, 4) }))));
    scene.add(PR.trees([{ x: -11.5, y: 0, z: -8, s: 2.3 }, { x: 12, y: 0, z: -7.5, s: 2.0 }, { x: 13, y: 0, z: 6, s: 1.6 }], { seed: 9 }));
    // gavel + sound block (front-right of the block top)
    const sb = PR.soundBlock({ r: 1.25, h: 0.5 }); sb.position.set(-5.9, TOP, 4.3); scene.add(sb);
    const gv = PR.gavel(); gv.position.set(-10.6, TOP + 1.5, 4.3); scene.add(gv);
    const D2R = Math.PI / 180, aRest = 34 * D2R, aHit = 98 * D2R;
    // the tag: on a string from the front-right eave corner
    const anchor = hs.localToWorld(hs.eave.clone()).add(V(-0.45, 0, 0.1));
    const tagText = P0.rate ?? (mode === 'rate' ? (P0.from ?? '6.27%') : '5.3%');
    const tag = PR.priceTag({ w: 4.1, h: 2.9, text: tagText, sub: P0.sub ?? null }); scene.add(tag);
    const str = PR.string(); scene.add(str);
    const L = 1.5;
    // puff ring at the strike
    const puff = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); puff.position.set(-5.9, TOP + 0.55, 4.3); scene.add(puff);
    // ---- timing
    const at = H.cue(shot, P0.at, mode === 'sold' ? Math.min(2.5, shot.duration * 0.35) : 0.9), span = P0.span ?? Math.max(1.5, Math.min(4, shot.duration - at - 1.5));
    const VIEWS = {
      hero: [{ pos: [-17.5, 8.2, 31], look: [-0.4, 6.4, 0], mm: 35 }, { pos: [-13.5, 7.6, 28.5], look: [-0.2, 6.5, 0], mm: 36 }],
      wide: [{ pos: [-27, 18, 43], look: [0, 4.5, 0], mm: 32 }, { pos: [-20, 16, 40], look: [0.5, 4.8, 0], mm: 32 }],
      close: [{ pos: [0.2, 7.4, 17.5], look: [4.1, 5.1, 3.6], mm: 40 }, { pos: [1.3, 6.9, 15.6], look: [4.1, 5.0, 3.6], mm: 42 }],
      gavel: [{ pos: [-19, 9.5, 29], look: [-1.6, 6.0, 1], mm: 35 }, { pos: [-15, 9.0, 27.5], look: [-1.4, 6.0, 1], mm: 36 }],
    };
    const cam = rig(shot, camKeys(P0, VIEWS[view] ?? VIEWS.hero));
    const stp = mode === 'sold' ? stamp(layer, P0.stamp ?? 'SOLD', 'left:60%;top:11%') : null;
    const cap = H.caption(layer, P0.caption ?? null);
    const src = H.sourceLine(layer, P0.source ?? null);
    const a0 = num(P0.from ?? '6.27%'), a1 = num(P0.to ?? '7.40%'), dp = Math.max(decimals(P0.to ?? '7.40%'), 0);
    const hp = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      // gavel
      let ga = aRest + 0.03 * Math.sin(t * 1.3);
      if (mode === 'sold') {
        if (t > at - 0.5 && t <= at - 0.12) ga = lerp(aRest, 14 * D2R, CK.outCubic(range(t, at - 0.5, at - 0.12)));
        else if (t > at - 0.12 && t <= at) ga = lerp(14 * D2R, aHit, CK.inCubic(range(t, at - 0.12, at)));
        else if (t > at) ga = aHit - 11 * D2R * Math.exp(-5 * (t - at)) * Math.abs(Math.sin((t - at) * 9)) - 30 * D2R * sstep(at + 1.4, at + 2.6, t);
      }
      gv.pivot.rotation.z = -ga;
      const hit = mode === 'sold' ? t - at : -1;
      puff.material.opacity = hit > 0 ? 0.65 * (1 - range(hit, 0, 0.6)) : 0; puff.scale.setScalar(1.2 + 2.4 * CK.outCubic(range(hit, 0, 0.6)));
      // tag swing (pendulum about the anchor); 'tag' releases it from ~80°, 'sold' kicks it
      let th = 0.05 * Math.sin(t * 1.1), s = 1;
      if (mode === 'tag') { s = PR.pop(t, at - 0.15, 0.3); th = PR.swing(t, at, 1.35, { T: 1.5, decay: 1.1 }); if (t < at) th = 1.35; }
      if (mode === 'sold' && hit > 0) th += PR.swing(t, at, 0.32, { T: 1.4, decay: 1.4 }) * sstep(0, 0.05, hit);
      hp.set(anchor.x + Math.sin(th) * L, anchor.y - Math.cos(th) * L, anchor.z + 0.75);
      tag.position.copy(hp); tag.rotation.set(0, -0.16, th); tag.scale.setScalar(Math.max(1e-3, s));
      str.span(anchor, hp); str.visible = s > 0.01;
      if (mode === 'rate') { const k = smoother(range(t, at, at + span)); tag.setText(fmtPct(lerp(a0, a1, k), dp)); }
      // camera (a small kick on the strike)
      cam(camera, p, t);
      if (hit > 0 && hit < 0.4) { const e = (1 - hit / 0.4) * 0.06; camera.position.y += Math.sin(hit * 70) * e; }
      stp?.show(range(hit, 0.02, 0.3));
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== bid-stack: the single-price auction (RECONSTRUCTION)
  // phases: arrive -> sort -> fill -> cutoff -> single-price. `mode` = the last phase played; `from` = the first one
  // animated (earlier phases are already done). Cue params arriveAt/sortAt/fillAt/cutAt/priceAt (+ *Span).
  const YIELDS = [4.30, 4.50, 4.70, 4.90, 5.00, 5.10, 5.20, 5.25, 5.30, 5.35, 5.40, 5.45, 5.50, 5.60];
  const AMTS = [1, 1.5, 2, 3, 4, 6, 8, 9, 7.8125, 16, 17, 14, 11, 7.6875]; // $B, illustrative; sums to 108.0, cutoff fill 39.0
  const STOP = 8, PER = 0.5, OFFER = 39;
  async function bidStack(ctx, shot) {
    const { scene, camera, layer, fx, P0 } = stage(ctx, shot, { target: [0, 1, 0], span: 14, aoR: 0.6, aoI: 2.4, az: 140, el: 44 });
    const PH = ['arrive', 'sort', 'fill', 'cutoff', 'single-price'], mode = PH.includes(P0.mode) ? P0.mode : 'fill', mi = PH.indexOf(mode), fi = PH.indexOf(P0.from ?? mode);
    const DEFSPAN = { arrive: 4.2, sort: 4.6, fill: 5.0, cutoff: 2.4, 'single-price': 2.6 }, KEY = { arrive: 'arrive', sort: 'sort', fill: 'fill', cutoff: 'cut', 'single-price': 'price' };
    const T = {}, SP = {}; let next = 0.8;
    PH.forEach((ph, i) => {
      SP[ph] = P0[`${KEY[ph]}Span`] ?? DEFSPAN[ph];
      if (i < fi) T[ph] = -1000; else if (i > mi) T[ph] = 1e9; else { T[ph] = H.cue(shot, P0[`${KEY[ph]}At`], next); next = T[ph] + SP[ph] + 0.4; }
    });
    const nb = YIELDS.length, dx = 1.3, xb = (b) => (b - (nb - 1) / 2) * dx, th = 0.072;
    scene.add(plinth(nb * dx + 6.5, 9.5, { h: 0.45, color: C.plinth, z: 0.6 }));
    // the ruler (bid yields) along the front edge
    const rw = nb * dx + 1.0;
    const ruler = new THREE.Mesh(new THREE.PlaneGeometry(rw, 1.15).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      map: PR.canvasTex(2400, Math.round(2400 * 1.15 / rw), (g, W, Hh) => { const u = W / rw; g.strokeStyle = C.inkSoft; g.lineWidth = 3; g.beginPath(); g.moveTo(u * 0.3, Hh * 0.18); g.lineTo(W - u * 0.3, Hh * 0.18); g.stroke();
        YIELDS.forEach((y, b) => { const x = (xb(b) + rw / 2) * u; g.beginPath(); g.moveTo(x, Hh * 0.08); g.lineTo(x, Hh * 0.3); g.stroke(); PR.fitText(g, `${y.toFixed(2)}%`, { x: x - u * 0.55, y: Hh * 0.32, w: u * 1.1, h: Hh * 0.62, size: 0.86, weight: 700, color: C.ink }); }); }) }));
    ruler.position.set(0, 0.006, 1.2); ruler.receiveShadow = true; scene.add(ruler);
    // envelopes: one InstancedMesh; data per envelope
    const env = [], heapC = V(0, 0, 3.4);
    let cum = 0;
    YIELDS.forEach((y, b) => { const n = Math.round(AMTS[b] / PER), per = AMTS[b] / n; for (let k = 0; k < n; k++) { env.push({ b, k, c0: cum, c1: cum + per }); cum += per; } });
    const N = env.length, r = rng(7);
    const order = env.map((_, i) => i).sort((a, b) => hash(a, 31) - hash(b, 31));
    order.forEach((i, j) => { const e = env[i], L = Math.floor(j / 34), rr = 2.6 * (1 - L / 9) * Math.sqrt(hash(i, 2)), a = hash(i, 3) * 6.283;
      e.heap = { x: heapC.x + Math.cos(a) * rr * 1.5, y: 0.02 + L * 0.075 + hash(i, 5) * 0.03, z: heapC.z + Math.sin(a) * rr * 0.55, ry: hash(i, 4) * 3.1 }; e.arr = j / N; });
    env.forEach((e, i) => { e.stack = { x: xb(e.b) + (hash(i, 6) - 0.5) * 0.06, y: 0.02 + e.k * th, z: (hash(i, 7) - 0.5) * 0.05, ry: (hash(i, 8) - 0.5) * 0.08 }; e.srt = i / N; });
    const geo = PR.envelopeGeo(1);
    const im = new THREE.InstancedMesh(geo, PR.vmat(0.8), N); im.castShadow = im.receiveShadow = true; scene.add(im);
    // water columns (one per bin) and the offering gauge
    const wm = new THREE.MeshStandardMaterial({ color: C.turq, roughness: 0.15, transparent: true, opacity: 0.32, depthWrite: false, envMap: CK.skyEnv(), envMapIntensity: 0.6 });
    const cols = YIELDS.map((_, b) => { const m = new THREE.Mesh(PR.rbox(1.16, 1, 0.82, 0.05, 1), wm); m.position.set(xb(b), 0.01, 0); m.renderOrder = 4; scene.add(m); return m; });
    const gx = xb(0) - 2.2, gh = 3.2;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, gh, 32, 1, true).translate(0, gh / 2, 0), new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.06, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide, envMap: CK.skyEnv() }));
    tube.position.set(gx, 0, -0.2); tube.renderOrder = 6; scene.add(tube);
    const gBase = PR.mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.25, 32).translate(0, 0.125, 0), mat(C.clay, 0.8)); gBase.position.set(gx, 0, -0.2); scene.add(gBase);
    const gFill = PR.mesh(new THREE.CylinderGeometry(0.56, 0.56, 1, 32).translate(0, 0.5, 0), mat(C.turq, 0.3)); gFill.position.set(gx, 0.25, -0.2); scene.add(gFill);
    // the red cutoff line (between the stop bin and the next), rising from the table
    const cut = new THREE.Group(); cut.position.set((xb(STOP) + xb(STOP + 1)) / 2, 0, 0); scene.add(cut);
    const cutBar = PR.mesh(PR.rbox(0.1, 1, 0.1, 0.04, 1), mat(C.red, 0.5)); cutBar.position.z = 1.0; cut.add(cutBar);
    const cutSheet = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1).translate(0, 0.5, 0).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); cutSheet.position.z = -0.1; cut.add(cutSheet);
    const cutLine = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 3.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.red })); cutLine.position.set(0, 0.012, 0.4); scene.add(cutLine); cutLine.position.x = cut.position.x;
    // ---- labels
    const pills = { gauge: H.pill(layer, '', { size: 26 }), stop: H.pill(layer, 'HIGH YIELD · <b>5.300%</b>', { size: 30, dot: C.red }), part: H.pill(layer, '57.6% FILLED', { size: 24 }), none: H.pill(layer, 'ABOVE 5.300% · <b>NOTHING</b>', { size: 24, color: C.inkSoft }) };
    const price = YIELDS.slice(0, STOP + 1).map((_, b) => H.pill(layer, '5.300%', { size: 21 }));
    const capText = P0.caption ?? { arrive: 'SEALED BIDS · $108B FOR $39B', sort: 'SORTED · LOWEST RATE FIRST', fill: 'FILLED CHEAPEST FIRST', cutoff: 'THE LAST BID ACCEPTED SETS THE RATE', 'single-price': 'EVERYONE GETS THE SAME RATE' }[mode];
    const cap = H.caption(layer, capText);
    const src = H.sourceLine(layer, P0.source ?? 'RECONSTRUCTION · ILLUSTRATIVE BIDS · RESULT: TREASURYDIRECT, 7 OCT 2026');
    const VIEWS = {
      arrive: [{ pos: [-4.5, 10.5, 18.5], look: [0, 0.5, 1.0], mm: 30 }, { pos: [-2.0, 9.6, 17.2], look: [0.2, 0.6, 0.9], mm: 30 }],
      sort: [{ pos: [-6.5, 8.6, 18], look: [0, 0.9, 0.4], mm: 29 }, { pos: [-3, 7.8, 17], look: [0.4, 1.0, 0.2], mm: 29 }],
      fill: [{ pos: [-13.5, 7.0, 16.5], look: [-3.6, 1.2, 0], mm: 29 }, { pos: [-10.5, 6.6, 16.2], look: [-2.8, 1.2, 0], mm: 29 }],
      cutoff: [{ pos: [1.5, 6.4, 15.0], look: [3.4, 1.3, -0.5], mm: 31 }, { pos: [4.5, 6.0, 13.8], look: [3.8, 1.3, -0.5], mm: 31 }],
      'single-price': [{ pos: [-7.5, 7, 16], look: [-1.4, 1.2, 0], mm: 30 }, { pos: [-4.5, 6.6, 15.2], look: [-0.9, 1.2, 0], mm: 30 }],
    };
    const cam = rig(shot, camKeys(P0, VIEWS[mode]));
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), cW = new THREE.Color(), cT = new THREE.Color(C.turq2), cG = new THREE.Color('#b9bec5'), cc = new THREE.Color(), v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      const F = OFFER * smoother(range(t, T.fill, T.fill + SP.fill));
      const kc = smoother(range(t, T.cutoff, T.cutoff + 1.2)), ko = smoother(range(t, T.cutoff + 0.5, T.cutoff + 2.0));
      for (let i = 0; i < N; i++) {
        const e = env[i]; let x, y, z, rx = 0, ry, rz = 0, s = 1;
        const ta = T.arrive + e.arr * SP.arrive * 0.85, ts = T.sort + e.srt * SP.sort * 0.85;
        if (t < ta) { s = 0; x = e.heap.x; y = 9; z = e.heap.z; ry = 0; }
        else if (t < ta + 0.7) { const u = (t - ta) / 0.7; x = e.heap.x + (1 - u) * (hash(i, 9) - 0.5) * 3; y = e.heap.y + 8.5 * (1 - u * u); z = e.heap.z - (1 - u) * 2; ry = e.heap.ry + (1 - u) * 4; rx = (1 - u) * 2.2 * (hash(i, 10) - 0.5); rz = (1 - u) * 2.2 * (hash(i, 11) - 0.5); }
        else if (t < ts) { x = e.heap.x; y = e.heap.y; z = e.heap.z; ry = e.heap.ry; }
        else if (t < ts + 0.55) { const u = smoother((t - ts) / 0.55); x = lerp(e.heap.x, e.stack.x, u); z = lerp(e.heap.z, e.stack.z, u); y = lerp(e.heap.y, e.stack.y, u) + Math.sin(Math.PI * u) * (1.4 + hash(i, 12)); ry = lerp(e.heap.ry, e.stack.ry, u); rx = Math.sin(Math.PI * u) * 0.5; }
        else { x = e.stack.x; y = e.stack.y; z = e.stack.z; ry = e.stack.ry; }
        // rejected bids slide back and grey out
        if (e.b > STOP) { z -= 2.2 * ko; }
        Q.setFromEuler(E.set(rx, ry, rz)); M4.compose(Pp.set(x, y, z), Q, Sc.set(s, s, s)); im.setMatrixAt(i, M4);
        const f = clamp((F - e.c0) / (e.c1 - e.c0));
        cc.copy(cW.set('#ffffff')).lerp(cT, f); if (e.b > STOP) cc.lerp(cG, ko);
        im.setColorAt(i, cc);
      }
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      // water columns follow the filled amount per bin
      let c0 = 0;
      cols.forEach((m, b) => { const n = Math.round(AMTS[b] / PER), hgt = n * th + 0.04, fb = clamp((F - c0) / AMTS[b]); c0 += AMTS[b]; m.scale.y = Math.max(1e-3, hgt * fb); m.visible = fb > 0.001; });
      gFill.scale.y = Math.max(1e-3, (gh - 0.35) * F / OFFER);
      { const g = T.fill > 1e8 ? 0 : PR.pop(t, Math.min(T.fill - 0.6, T.sort + SP.sort), 0.5); tube.scale.setScalar(Math.max(1e-4, g)); gBase.scale.setScalar(Math.max(1e-4, g)); gFill.visible = g > 0.5; }
      cut.scale.set(1, Math.max(1e-3, 3.4 * kc), 1); cut.visible = kc > 0.001; cutLine.visible = kc > 0.001; cutLine.scale.set(1, 1, Math.max(1e-3, kc));
      // labels
      const showG = t > T.fill - 0.3 && T.fill < 1e8;
      { const [sx, sy] = toS(v.set(gx, gh + 0.4, -0.2), camera); pills.gauge.innerHTML = `ON SALE &nbsp;<b>$${F.toFixed(F >= OFFER - 0.05 ? 0 : 1)}B</b> / $39B`; pills.gauge.at(sx, sy, showG ? sstep(T.fill - 0.3, T.fill + 0.2, t) : 0); }
      { const [sx, sy] = toS(v.set(cut.position.x, 3.55, 1.0), camera); pills.stop.at(sx, sy, sstep(T.cutoff + 0.6, T.cutoff + 1.0, t)); }
      { const n = Math.round(AMTS[STOP] / PER), [sx, sy] = toS(v.set(xb(STOP), n * th * 0.576 + 0.1, 0.45), camera); pills.part.at(sx - 20, sy + 46, sstep(T.cutoff + 1.0, T.cutoff + 1.4, t) * (1 - sstep(T['single-price'], T['single-price'] + 0.3, t))); }
      { const [sx, sy] = toS(v.set((xb(STOP + 2) + xb(nb - 1)) / 2 + 0.4, 0.15, -1.2), camera); pills.none.at(sx, sy + 70, sstep(T.cutoff + 1.3, T.cutoff + 1.8, t)); }
      price.forEach((pl, b) => { const n = Math.round(AMTS[b] / PER), at = T['single-price'] + (STOP - b) * SP['single-price'] * 0.09, [sx, sy] = toS(v.set(xb(b), n * th * (b === STOP ? 0.576 : 1) + 0.25, 0), camera); pl.at(sx, sy, sstep(at, at + 0.25, t)); });
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== seesaw: price vs yield
  async function seesaw(ctx, shot) {
    const { scene, camera, layer, fx, P0 } = stage(ctx, shot, { target: [0, 2.5, 0], span: 14, aoR: 0.9, aoI: 2.4, az: 140, el: 42 });
    scene.add(plinth(22, 9, { h: 0.45, color: C.lawn3, r: 0.25 }));
    const fulc = PR.mesh(PR.bake([{ geo: new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.4, 0), new THREE.Vector2(1.4, 0), new THREE.Vector2(0, 2.5)]), { depth: 1.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }).translate(0, 0, -0.8), color: C.wood }, { geo: new THREE.CylinderGeometry(0.26, 0.26, 2.0, 16).rotateX(Math.PI / 2).translate(0, 2.5, 0), color: C.woodDark }]), PR.vmat(0.7));
    scene.add(fulc);
    const beam = new THREE.Group(); beam.position.set(0, 2.62, 0); scene.add(beam);
    beam.add(PR.mesh(PR.rbox(14, 0.34, 1.7, 0.14).translate(0, -0.05, 0), mat(C.woodLight, 0.72)));
    // the bond (left): an upright certificate slab on a base
    const cert = new THREE.Group(); cert.position.set(-5.6, 0.29, 0); beam.add(cert);
    cert.add(PR.mesh(PR.rbox(3.3, 0.35, 1.5, 0.1), mat(C.clay, 0.85)));
    const ctex = PR.canvasTex(768, 520, (g, W, Hh) => { g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, Hh); g.strokeStyle = '#7fae9c'; g.lineWidth = 14; PR.roundRect(g, 18, 18, W - 36, Hh - 36, 20); g.stroke(); g.lineWidth = 4; PR.roundRect(g, 44, 44, W - 88, Hh - 88, 12); g.stroke();
      PR.fitText(g, 'TREASURY NOTE', { x: 0, y: 70, w: W, h: 90, size: 0.8, color: C.ink }); PR.fitText(g, '10 YEARS · 4⅝% COUPON', { x: 0, y: 170, w: W, h: 60, size: 0.75, weight: 500, font: H.FONT.mono, color: C.inkSoft, spacing: 3 });
      PR.fitText(g, '$100', { x: 0, y: 250, w: W, h: 190, size: 0.85, color: '#5f9c86' }); });
    const card = new THREE.Mesh(PR.rbox(3.0, 2.15, 0.28, 0.08), [mat(C.clay, 0.8), mat(C.clay, 0.8), mat(C.clay, 0.8), mat(C.clay, 0.8), new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.8 }), mat(C.clay, 0.8)]);
    card.castShadow = card.receiveShadow = true; card.position.set(0, 0.32, 0); cert.add(card);
    // the yield (right): a 3D % sign on a base
    const pc = new THREE.Group(); pc.position.set(5.6, 0.29, 0); beam.add(pc);
    pc.add(PR.mesh(PR.rbox(3.0, 0.35, 1.5, 0.1), mat(C.clay, 0.85)));
    const pm = mat(P0.pctColor ?? C.lavender, 0.55), pG = new THREE.Group(); pG.position.y = 1.3; pG.scale.setScalar(0.78); pc.add(pG);
    for (const [x, y] of [[-0.62, 0.62], [0.62, -0.62]]) { const o = PR.mesh(new THREE.TorusGeometry(0.4, 0.17, 14, 32), pm); o.position.set(x, y, 0); o.scale.z = 1.6; pG.add(o); }
    const bar = PR.mesh(new RoundedBox(0.3, 2.9, 0.5), pm); bar.rotation.z = -0.62; pG.add(bar);
    // ---- motion
    const at = H.cue(shot, P0.at, 1.2), span = P0.span ?? 2.2, dir = P0.reverse ? -1 : 1, amp = (P0.tilt ?? 11) * Math.PI / 180;
    const k = (t) => { const u = range(t, at, at + span); return smoother(u) + 0.06 * Math.sin(Math.PI * clamp((t - at - span * 0.75) / 0.7)) * (u >= 0.75 ? 1 : 0); };
    const pF = num(P0.priceFrom ?? 100), pT = num(P0.priceTo ?? 94.86), yF = num(P0.yieldFrom ?? 4.625), yT = num(P0.yieldTo ?? 5.3), ydp = decimals(P0.yieldTo ?? '5.300') || 3;
    const pPill = H.pill(layer, '', { size: 32 }), yPill = H.pill(layer, '', { size: 32, dot: P0.redYield === false ? null : C.red });
    const cap = H.caption(layer, P0.caption ?? 'PRICE DOWN · YIELD UP');
    const src = H.sourceLine(layer, P0.source ?? 'PRICE PER $100 · 7 OCT 2026 · TREASURYDIRECT');
    const cam = rig(shot, camKeys(P0, [{ pos: [-5.5, 7.4, 21.5], look: [0, 2.7, 0], mm: 34 }, { pos: [1.5, 6.8, 20], look: [0, 2.7, 0], mm: 35 }]));
    const v = new THREE.Vector3();
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      const kk = k(t); beam.rotation.z = dir * amp * (P0.startTilt ?? 0) + dir * amp * kk;
      const u = clamp(smoother(range(t, at, at + span)));
      const pv = lerp(pF, pT, u), yv = lerp(yF, yT, u);
      pPill.innerHTML = `PRICE &nbsp;<b>$${pv.toFixed(2)}</b> ${u > 0.02 ? (pT < pF ? '↓' : '↑') : ''}`; yPill.innerHTML = `YIELD &nbsp;<b>${yv.toFixed(ydp)}%</b> ${u > 0.02 ? (yT > yF ? '↑' : '↓') : ''}`;
      beam.updateMatrixWorld();
      const a = beam.localToWorld(v.set(-5.6, 3.1, 0)); let [x, y] = toS(a, camera); pPill.at(x, y, sstep(0.3, 0.8, t));
      const b = beam.localToWorld(v.set(5.6, 3.2, 0)); [x, y] = toS(b, camera); yPill.at(x, y, sstep(0.5, 1.0, t));
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }
  function RoundedBox(w, h, d) { return PR.rbox(w, h, d, Math.min(w, d) * 0.45, 2).translate(0, -h / 2, 0); }

  // ======================================================================== pipe: from your front door to the bond market
  // modes: flow | compare | spread | prepay. The mortgage line rides on a riser `spread` units above the Treasury line.
  async function pipe(ctx, shot) {
    const { scene, camera, layer, fx, sun, P0 } = stage(ctx, shot, { target: [0, 2, 0], span: 26, aoR: 1.0, aoI: 2.4, az: 138, el: 44 });
    const mode = P0.mode ?? 'flow';
    scene.add(plinth(58, 22, { h: 0.45, color: C.plinth, x: 1, z: 1 }));
    scene.add(plinth(11, 9, { h: 0.08, color: C.lawn, x: -22.5, z: -4, r: 0.04 })); scene.children.at(-1).position.y = 0;
    const yT = 1.3, ZM = -3.6, ZT = 3.6, X0 = -15, XB = -1.2, XB1 = 3.0, X1 = 15;
    const spreadV = P0.spread ?? 2.3, at = H.cue(shot, P0.at, 1.2), span = P0.span ?? 3.0;
    const lift = (t) => mode === 'spread' ? lerp(P0.from ?? 0, spreadV, smoother(range(t, at, at + span))) : spreadV;
    // houses (left), feeding the mortgage line
    const hp = PR.houseParts({ w: 4.4, d: 3.6, h: 2.0, R: 1.6, over: 0.25, t: 0.2, chimney: false });
    const hItems = [[-25.5, -6.5, C.roofs[0]], [-21.5, -7.0, C.roofs[3]], [-24.5, -2.0, C.roofs[4]], [-20.0, -2.6, C.roofs[2]]];
    scene.add(CK.instanced(hp.body, PR.vmat(0.86), hItems.map(([x, z]) => ({ x, y: 0.08, z, ry: 0.4 }))));
    scene.add(CK.instanced(hp.roof, PR.vmat(0.8), hItems.map(([x, z, c]) => ({ x, y: 0.08, z, ry: 0.4, c }))));
    scene.add(PR.trees([{ x: -27.2, y: 0, z: -4.2, s: 1.0 }, { x: -18.2, y: 0, z: -8.0, s: 0.8 }, { x: -23, y: 0, z: -9.5, s: 0.9 }], { seed: 4 }));
    // the mortgage line (lifted group): belt -> bundler -> MBS belt
    const gM = new THREE.Group(); scene.add(gM);
    gM.add(PR.conveyor({ x0: X0, x1: XB, y: yT, z: ZM, wd: 1.5 }), PR.conveyor({ x0: XB1, x1: X1, y: yT, z: ZM, wd: 1.5 }));
    const bund = new THREE.Group(); bund.position.set((XB + XB1) / 2, 0, ZM); gM.add(bund);
    bund.add(PR.mesh(PR.bake([{ geo: PR.rbox(4.6, 3.6, 2.8, 0.3), color: '#ffffff' }, { geo: PR.rbox(4.66, 0.5, 2.86, 0.1).translate(0, 2.2, 0), color: C.turq2 }, { geo: PR.rbox(1.7, 1.0, 0.2, 0.1).translate(0, yT - 0.6, 1.4), color: '#3d4a5c' }, { geo: PR.rbox(1.7, 1.0, 0.2, 0.1).translate(0, yT - 0.6, -1.4), color: '#3d4a5c' }]), PR.vmat(0.75)));
    const press = PR.mesh(PR.bake([{ geo: new THREE.CylinderGeometry(0.22, 0.22, 1.8, 14).translate(0, 0.9, 0), color: '#c9ccd0' }, { geo: PR.rbox(1.4, 0.4, 1.2, 0.08), color: C.turq }]), PR.vmat(0.5)); press.position.set(0, 3.6, 0); bund.add(press);
    const bLabel = PR.textPlane('BUNDLER', { w: 3.2, h: 0.62, fg: C.ink, size: 0.7, spacing: 3 }); bLabel.position.set(0, 1.4 + yT, 1.42); bund.add(bLabel);
    // riser under the mortgage line (the step = the spread)
    const riser = PR.mesh(PR.rbox(X1 - X0 + 1.0, 1, 2.4, 0.08, 1), mat('#e7e2d8', 0.9)); riser.position.set((X0 + X1) / 2, 0, ZM); scene.add(riser);
    // the Treasury line: an auction box -> belt
    scene.add(PR.conveyor({ x0: X0, x1: X1, y: yT, z: ZT, wd: 1.5 }));
    const bb = PR.ballotBox({ w: 2.0, h: 1.4, d: 1.4, ped: 0.9 }); bb.position.set(X0 - 2.6, 0, ZT); scene.add(bb);
    const ePile = PR.pile(bb.inside, 40, { s: 0.7, thick: 0.035 }); scene.add(CK.instanced(PR.envelopeGeo(0.55), PR.vmat(0.8), ePile.map(e => ({ ...e, x: e.x + bb.position.x, z: e.z + ZT }))));
    // investors (generic buildings)
    const XI = 22.5;
    const inv = [['FUNDS', 'tower', -6.0, 3.2, 3.4, 7.0], ['INSURERS', 'stepped', 0.0, 4.4, 4.0, 5.4], ['BANKS', 'columns', 6.0, 5.6, 4.2, 4.8]].map(([name, kind, z, w, d, h]) => {
      const b = PR.building(kind, { w, d, h }); b.position.set(XI, 0, z); b.rotation.y = -Math.PI / 2; scene.add(b); return { name, z, h, el: H.pill(layer, name, { size: 26 }) };
    });
    scene.add(PR.trees([{ x: 26.5, y: 0, z: -9, s: 1.0 }, { x: 26, y: 0, z: 9.0, s: 1.1 }, { x: 26.8, y: 0, z: 3, s: 0.8 }], { seed: 6 }));
    // items
    const paperG = PR.bake([{ geo: PR.rbox(0.9, 0.04, 0.66, 0.02, 1), color: '#ffffff' }, { geo: PR.rbox(0.22, 0.012, 0.2, 0.01, 1).translate(-0.26, 0.04, -0.16), color: C.door }, ...[0, 1, 2].map(k => ({ geo: PR.rbox(0.5, 0.01, 0.05, 0.01, 1).translate(0.08, 0.04, -0.02 + k * 0.12), color: '#cfd4da' }))]);
    const nP = 9, LM = XB - X0, vM = 1.5, sP = LM / nP;
    const papers = new THREE.InstancedMesh(paperG, PR.vmat(0.8), nP); papers.castShadow = true; gM.add(papers);
    const nB = 5, LB = X1 - XB1, sB = LB / nB;
    const mbsM = PR.iouMats({ text: 'MBS', tint: '#f7f5ef' }), mbs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.75, 1.0).translate(0, 0.375, 0), mbsM, nB); mbs.castShadow = true; gM.add(mbs);
    const nT = 11, LT = X1 - X0, sT = LT / nT;
    const ious = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.6, 0.85).translate(0, 0.3, 0), PR.iouMats({ text: 'IOU' }), nT); ious.castShadow = true; scene.add(ious);
    // spread bracket (red) + guides
    const brk = new THREE.Group(); brk.position.set(X1 + 1.3, 0, (ZM + ZT) / 2); scene.add(brk);
    const bm = mat(C.red, 0.5), bv = PR.mesh(PR.rbox(0.14, 1, 0.14, 0.04, 1), bm), bc0 = PR.mesh(PR.rbox(0.9, 0.12, 0.14, 0.04, 1), bm), bc1 = bc0.clone(); brk.add(bv, bc0, bc1);
    const guide = (z) => { const g = PR.mesh(PR.rbox(2.2, 0.05, 0.05, 0.02, 1), mat('#9aa3ad', 0.6), { cast: false }); g.position.set(X1 + 0.3, 0, z); scene.add(g); return g; };
    const gdT = guide(ZT + 0.9), gdM = guide(ZM - 0.9);
    // labels
    const pl = {
      mort: H.pill(layer, mode === 'flow' || mode === 'prepay' ? 'YOUR LOAN' : `MORTGAGES · <b>${P0.mortRate ?? '≈7.4%'}</b>`, { size: 26, dot: C.door }),
      tsy: H.pill(layer, `10-YEAR TREASURY · <b>${P0.tsyRate ?? '≈5.1%'}</b>`, { size: 26, dot: C.turq }),
      mbs: H.pill(layer, 'BUNDLED · <b>MBS</b>', { size: 24 }), spread: H.pill(layer, '', { size: 30, dot: C.red }), prepay: H.pill(layer, 'PAID BACK EARLY', { size: 26, dot: C.yellow }),
    };
    const cap = H.caption(layer, P0.caption ?? { flow: 'YOUR MORTGAGE GETS SOLD', compare: 'SAME BUYERS · TWO CHOICES', spread: 'THE SPREAD', prepay: 'RATES FALL · BORROWERS REFINANCE' }[mode]);
    const src = H.sourceLine(layer, P0.source ?? (mode === 'spread' ? 'OUR MATH · FREDDIE MAC PMMS 7.40% − 10-YR 5.10% · 15 OCT 2026' : null));
    const VIEWS = {
      flow: [{ pos: [-20, 17, 37], look: [-2, 2.2, -1], mm: 28 }, { pos: [-13, 16, 37], look: [0, 2.2, -1], mm: 28 }],
      compare: [{ pos: [-4, 15, 37], look: [3, 2.4, -0.5], mm: 28 }, { pos: [2, 14.5, 36], look: [4, 2.4, -0.5], mm: 28 }],
      spread: [{ pos: [6, 6.8, 22], look: [13.5, 2.9, 0], mm: 32 }, { pos: [9, 6.4, 19.5], look: [14, 2.9, 0], mm: 33 }],
      prepay: [{ pos: [-16, 13, 26], look: [-14, 2.0, -3], mm: 30 }, { pos: [-12, 12.5, 26], look: [-12, 2.0, -3], mm: 30 }],
    };
    const cam = rig(shot, camKeys(P0, VIEWS[mode] ?? VIEWS.flow));
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), v = new THREE.Vector3();
    const fade = (x, a, b) => clamp(Math.min((x - a) / 0.6, (b - x) / 0.6));
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      const dy = lift(t); gM.position.y = dy; riser.scale.y = Math.max(1e-3, dy + 0.01); riser.visible = dy > 0.02;
      // papers (on gM local): pop on at the start, into the bundler at the end; prepay: some arc back to the houses
      let prepaying = 0;
      for (let k = 0; k < nP; k++) {
        const w = t * vM + k * sP, cyc = Math.floor(w / LM), u = (w % LM) / LM; let x = X0 + u * LM, y = yT + 0.02, z = ZM, s = Math.min(1, fade(x, X0, XB + 0.5) * 1.5), rx = 0;
        if (mode === 'prepay' && hash(k, cyc, 3) < 0.45 && u > 0.38) {
          const el = (u - 0.38) * LM / vM, a = clamp(el / 1.1), x0 = X0 + 0.38 * LM, hx = hItems[k % 4][0], hz = hItems[k % 4][1];
          x = lerp(x0, hx, smoother(a)); z = lerp(ZM, hz, smoother(a)); y = lerp(yT, 1.8 - dy, a) + Math.sin(Math.PI * a) * 2.2; rx = a * 6; s = a >= 1 ? 0 : 1; if (a < 1) prepaying++;
        }
        Q.setFromEuler(E.set(rx, 0, 0)); M4.compose(Pp.set(x, y, z), Q, Sc.set(s, s, s) .addScalar(s > 0 ? 0 : 1e-4)); papers.setMatrixAt(k, M4);
      }
      papers.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < nB; k++) { const x = XB1 + ((t * vM + k * sB) % LB), s = Math.max(1e-4, Math.min(1, fade(x, XB1 - 0.3, X1 + 0.3) * 1.5)); M4.compose(Pp.set(x, yT + 0.02, ZM), Q.identity(), Sc.set(s, s, s)); mbs.setMatrixAt(k, M4); }
      mbs.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < nT; k++) { const x = X0 + ((t * vM + k * sT) % LT), s = Math.max(1e-4, Math.min(1, fade(x, X0 - 0.3, X1 + 0.3) * 1.5)); M4.compose(Pp.set(x, yT + 0.02, ZT), Q.identity(), Sc.set(s, s, s)); ious.setMatrixAt(k, M4); }
      ious.instanceMatrix.needsUpdate = true;
      press.position.y = 3.6 - 1.1 * Math.pow(Math.abs(Math.sin(Math.PI * t * vM / sB)), 6);
      // bracket
      const show = mode === 'spread' || mode === 'compare';
      const kb = mode === 'spread' ? sstep(at - 0.6, at, t) : mode === 'compare' ? sstep(1.5, 2.2, t) : 0;
      brk.visible = gdT.visible = gdM.visible = show && kb > 0.01;
      bv.position.y = yT; bv.scale.y = Math.max(1e-3, dy); bc0.position.y = yT - 0.06; bc1.position.y = yT + dy - 0.06; bc0.position.x = bc1.position.x = 0;
      bm.color.set(mode === 'spread' ? C.red : C.inkSoft);
      gdT.position.y = yT; gdM.position.y = yT + dy;
      // labels
      let [x, y] = toS(v.set(X0 + 3, yT + dy + 1.4, ZM), camera); pl.mort.at(x, y, sstep(0.4, 0.9, t));
      [x, y] = toS(v.set(X0 + 4, yT + 1.4, ZT), camera); pl.tsy.at(x, y, mode === 'flow' || mode === 'prepay' ? 0 : sstep(0.7, 1.2, t));
      [x, y] = toS(v.set(XB1 + 3.4, yT + dy + 1.4, ZM), camera); pl.mbs.at(x, y, mode === 'flow' ? sstep(1.0, 1.5, t) : 0);
      [x, y] = toS(v.set(X1 + 1.3, yT + dy * 0.5, (ZM + ZT) / 2), camera); pl.spread.innerHTML = `SPREAD &nbsp;<b>≈${dy.toFixed(1)} PTS</b>`; pl.spread.at(x + 150, y + 22, show ? kb * (mode === 'spread' ? sstep(at, at + 0.3, t) : 1) : 0);
      [x, y] = toS(v.set(-22.5, 4.4, -4.5), camera); pl.prepay.at(x, y, mode === 'prepay' ? sstep(1.5, 2.0, t) : 0);
      for (const b of inv) { [x, y] = toS(v.set(XI, b.h + 1.0, b.z), camera); b.el.at(x, y, sstep(0.6, 1.1, t)); }
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== debt-tower: $40 trillion of IOUs
  // modes: grow (layers rise; the counter runs `from` -> `to`) | rollover (the bottom third rolls through the auction and
  // comes back red-tinted on top) | interest (a coin stream out of the tower outgrows a DEFENSE stack)
  async function debtTower(ctx, shot) {
    const { scene, camera, layer, fx, sun, P0 } = stage(ctx, shot, { target: [4, 9, 0], span: 24, aoR: 0.9, aoI: 2.4, az: 140, el: 42 });
    const mode = P0.mode ?? 'grow';
    const NL = 20, CX = 5, CZ = 4, bw = 1.5, bh = 0.72, bd = 1.0, gap = 0.05, PED = 0.9;
    scene.add(plinth(40, 18, { h: 0.45, color: C.plinth, x: 7 }));
    scene.add(PR.mesh(PR.rbox(CX * (bw + gap) + 1.0, PED, CZ * (bd + gap) + 1.0, 0.15), mat(C.clay2, 0.85)));
    const slot = (i) => { const l = Math.floor(i / (CX * CZ)), j = i % (CX * CZ), cx = j % CX, cz = Math.floor(j / CX); return [(cx - (CX - 1) / 2) * (bw + gap), PED + l * (bh + gap), (cz - (CZ - 1) / 2) * (bd + gap)]; };
    const NB = NL * CX * CZ, ROLL = 7, NR = ROLL * CX * CZ;
    const geo = new THREE.BoxGeometry(bw, bh, bd).translate(0, bh / 2, 0);
    const blocks = new THREE.InstancedMesh(geo, PR.iouMats({ text: 'IOU' }), NB); blocks.castShadow = blocks.receiveShadow = true; scene.add(blocks);
    const fresh = new THREE.InstancedMesh(geo, PR.iouMats({ text: 'IOU', tint: '#f3b2a9', ink: '#8a1c16' }), NR); fresh.castShadow = fresh.receiveShadow = true; scene.add(fresh);
    const at = H.cue(shot, P0.at, 0.8), span = P0.span ?? Math.max(3, shot.duration - at - 2.2);
    const from = num(P0.from ?? (mode === 'grow' ? 0 : 40.39)), to = num(P0.to ?? 40.39);
    // rollover rig: conveyor to an auction hopper
    let hop = null, conv = null;
    if (mode === 'rollover') {
      conv = PR.conveyor({ x0: 4.4, x1: 12.5, y: PED, z: 0, wd: 4.4 }); scene.add(conv);
      hop = PR.ballotBox({ w: 2.8, h: 2.2, d: 2.4, ped: 1.4 }); hop.scale.setScalar(1.5); hop.position.set(16, 0, -0.3); scene.add(hop);
      const ep = PR.pile(hop.inside, 50, { s: 0.9, thick: 0.05 }); const pg = CK.instanced(PR.envelopeGeo(0.7), PR.vmat(0.8), ep); pg.position.copy(hop.position); pg.scale.setScalar(1.5); scene.add(pg);
    }
    // interest: coins
    const coinG = PR.coinGeo().scale(3.0, 3.0, 3.0), CT = 0.37;
    let coins = null, def = null, nI = 0, nD = 0;
    if (mode === 'interest') {
      nD = P0.defenseCoins ?? 30; nI = Math.round(nD * (num(P0.interest ?? 1.05) / num(P0.defense ?? 0.965)));
      def = CK.instanced(coinG, PR.vmat(0.45), Array.from({ length: nD }, (_, i) => ({ x: 19 + (hash(i, 1) - 0.5) * 0.12, y: i * CT, z: 0.5 + (hash(i, 2) - 0.5) * 0.12, ry: hash(i, 3) * 6, c: '#d9dde2' }))); scene.add(def);
      coins = new THREE.InstancedMesh(coinG, PR.vmat(0.4), nI + 24); coins.castShadow = true; scene.add(coins);
    }
    // ---- labels
    const ctr = counter(layer, P0.sub ?? { grow: 'U.S. DEBT', rollover: 'ROLLED OVER · NEXT 12 MONTHS', interest: 'NET INTEREST · FY2026' }[mode]);
    const pl = { due: H.pill(layer, '≈1/3 DUE IN 12 MONTHS', { size: 26, dot: C.yellow }), old: H.pill(layer, 'OLD DEBT · <b>≈3.5%</b>', { size: 26 }), nw: H.pill(layer, 'NEW 10-YEAR · <b>5.3%</b>', { size: 26, dot: C.red }), hop: H.pill(layer, 'AUCTION', { size: 26 }),
      int: H.pill(layer, 'NET INTEREST · <b>$1.05T</b>', { size: 28, dot: C.gold }), def: H.pill(layer, 'DEFENSE · <b>$0.97T</b>', { size: 28, dot: '#c9ccd0' }) };
    const cap = H.caption(layer, P0.caption ?? null);
    const src = H.sourceLine(layer, P0.source ?? { grow: 'SOURCE: TREASURY DEBT TO THE PENNY · 15 OCT 2026', rollover: 'OUR MATH · MONTHLY STATEMENT OF THE PUBLIC DEBT', interest: 'SOURCE: MONTHLY TREASURY STATEMENT · FY2026' }[mode]);
    const VIEWS = {
      grow: [{ pos: [-17, 9, 32], look: [0, 8.2, 0], mm: 30 }, { pos: [-13, 13, 31], look: [0, 9.0, 0], mm: 30 }],
      rollover: [{ pos: [-6, 10.5, 37], look: [7, 6.8, 0], mm: 28 }, { pos: [-2, 10, 35], look: [8, 6.8, 0], mm: 28 }],
      interest: [{ pos: [-2, 10.5, 40], look: [9, 7.0, 0], mm: 28 }, { pos: [2, 10, 38], look: [10, 7.0, 0], mm: 28 }],
    };
    const cam = rig(shot, camKeys(P0, VIEWS[mode] ?? VIEWS.grow));
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), cY = new THREE.Color(), cW = new THREE.Color('#ffffff'), cYel = new THREE.Color('#fbe9a6'), v = new THREE.Vector3();
    const LH = bh + gap, nCyc = ROLL, cyc = span / nCyc;
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      let topY = PED + NL * LH;
      if (mode === 'grow') {
        const k = smoother(range(t, at, at + span)), f0 = from / to, shown = (f0 + (1 - f0) * k) * NB;
        for (let i = 0; i < NB; i++) { const [x, y, z] = slot(i), a = clamp(shown - i, 0, 1), s = a <= 0 ? 1e-4 : CK.outCubic(a); M4.compose(Pp.set(x, y + (1 - s) * 1.2, z), Q.identity(), Sc.set(s, s, s)); blocks.setMatrixAt(i, M4); }
        fresh.visible = false; topY = PED + Math.ceil(shown / (CX * CZ)) * LH;
        ctr.set(`$${lerp(from, to, k).toFixed(2)}T`);
      } else if (mode === 'rollover') {
        // cycle c: layer c slides out (+x) onto the conveyor (0..0.45), tower above drops one layer (0.45..0.7),
        // a fresh layer flies from the hopper to the top (0.3..1.0)
        const ct = (t - at) / cyc, done = clamp(Math.floor(ct), 0, nCyc), ph = ct - Math.floor(ct), act = ct >= 0 && ct < nCyc;
        const hl = sstep(at - 1.6, at - 0.8, t);
        const D = done + (act ? sstep(0.45, 0.7, ph) : 0);
        for (let i = 0; i < NB; i++) {
          const l = Math.floor(i / (CX * CZ)); let [x, y, z] = slot(i), s = 1;
          const u = l < ROLL ? ct - l : -1;
          if (u < 0) y -= D * LH;
          else { // at the bottom: slide out along +x, ride the conveyor, hop into the hopper
            const a = clamp(u / 1.6); x += a * 11.5; y = PED + 0.02;
            if (a > 0.8) { const b = (a - 0.8) / 0.2; x = lerp(x, 16, b); y += Math.sin(Math.PI * b) * 2.5 + b * 4.5; s = 1 - b * 0.9; }
            if (a >= 1) s = 0;
          }
          M4.compose(Pp.set(x, y, z), Q.identity(), Sc.setScalar(Math.max(1e-4, s))); blocks.setMatrixAt(i, M4);
          cY.copy(cW).lerp(cYel, l < ROLL ? hl * 0.9 : 0); blocks.setColorAt(i, cY);
        }
        blocks.instanceColor.needsUpdate = true;
        const drop = D * LH;
        topY = PED + NL * LH - drop;
        for (let i = 0; i < NR; i++) {
          const c = Math.floor(i / (CX * CZ)), j = i % (CX * CZ), [sx, , sz] = slot(j), u = ct - c - 0.3;
          let x = 16, y = 7, z = 0, s = 0;
          if (u >= 0) { const a = smoother(clamp(u / 0.9)); const ty = PED + (NL + c) * LH - drop; x = lerp(16 + (hash(i, 1) - 0.5), sx, a); z = lerp(-0.3, sz, a); y = lerp(7.5, ty, a) + Math.sin(Math.PI * a) * 4; s = Math.min(1, u * 4); }
          M4.compose(Pp.set(x, y, z), Q.identity(), Sc.setScalar(Math.max(1e-4, s))); fresh.setMatrixAt(i, M4);
        }
        fresh.instanceMatrix.needsUpdate = true;
        ctr.set(`$${(num(P0.rolled ?? 10.64) * clamp(D / nCyc)).toFixed(2)}T`, 1);
        const bt = toS(v.set(-4.2, PED + ROLL * LH * 0.5, 2.2), camera); pl.due.at(bt[0] - 110, bt[1], sstep(at - 1.4, at - 0.8, t) * (1 - sstep(at + span * 0.3, at + span * 0.3 + 0.4, t)));
        const ob = toS(v.set(10, PED + 1.3, 1.2), camera); pl.old.at(ob[0], ob[1], sstep(at + 0.4, at + 0.8, t));
        const nb = toS(v.set(0, topY + 1.6, 0), camera); pl.nw.at(nb[0], nb[1], sstep(at + cyc, at + cyc + 0.4, t));
        const hb = toS(v.set(16, 6.8, -0.3), camera); pl.hop.at(hb[0], hb[1], sstep(0.3, 0.8, t));
      } else {
        for (let i = 0; i < NB; i++) { const [x, y, z] = slot(i); M4.compose(Pp.set(x, y, z), Q.identity(), Sc.set(1, 1, 1)); blocks.setMatrixAt(i, M4); }
        fresh.visible = false;
        if (coins) {
          const k = range(t, at, at + span), landed = nI * k;
          for (let i = 0; i < nI + 24; i++) {
            let x, y, z, s = 1, rx = 0;
            if (i < nI) { const ta = at + i / nI * span, u = (t - ta) / 0.9 + 1; // u in [0,1]: flight before landing
              if (t >= ta) { x = 10 + (hash(i, 1) - 0.5) * 0.12; y = i * CT; z = 0.5 + (hash(i, 2) - 0.5) * 0.12; }
              else if (t > ta - 0.9) { const a = 1 - (ta - t) / 0.9; x = lerp(4.2, 10, a); y = lerp(11, i * CT, a) + Math.sin(Math.PI * a) * 3; z = lerp(0, 0.5, a); rx = (1 - a) * 8; }
              else { s = 0; x = 3; y = 12; z = 0; } }
            else { s = 0; x = 0; y = 0; z = 0; }
            Q.setFromEuler(E.set(rx, hash(i, 3) * 6, 0)); M4.compose(Pp.set(x, y, z), Q, Sc.setScalar(Math.max(1e-4, s))); coins.setMatrixAt(i, M4);
          }
          coins.instanceMatrix.needsUpdate = true;
          ctr.set(`$${(num(P0.interest ?? 1.05) * clamp(landed / nI)).toFixed(2)}T`);
          const ib = toS(v.set(10, Math.max(1, landed) * CT + 1.4, 0.5), camera); pl.int.at(ib[0] - 40, ib[1], sstep(at, at + 0.4, t));
          const db = toS(v.set(19, nD * CT + 1.2, 0.5), camera); pl.def.at(db[0] + 40, db[1], sstep(0.3, 0.8, t));
        }
      }
      blocks.instanceMatrix.needsUpdate = true;
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== vault: the Fed sets one night; the auction sets ten years
  // A small desk with a FED FUNDS dial and a tiny moon (overnight) beside a giant glass auction hopper (10-YEAR).
  // move: reveal (from the dial to the hopper, default) | wide
  async function vault(ctx, shot) {
    const { scene, camera, layer, fx, P0 } = stage(ctx, shot, { target: [3, 4, 0], span: 18, aoR: 0.9, aoI: 2.4, az: 140, el: 42 });
    scene.add(plinth(30, 14, { h: 0.45, color: C.plinth, x: 2 }));
    // desk
    const desk = PR.mesh(PR.bake([{ geo: PR.rbox(3.6, 0.22, 1.9, 0.08).translate(0, 1.6, 0), color: C.woodLight }, ...[[-1.6, -0.75], [1.6, -0.75], [-1.6, 0.75], [1.6, 0.75]].map(([x, z]) => ({ geo: PR.rbox(0.16, 1.6, 0.16, 0.05).translate(x, 0, z), color: C.wood }))]), PR.vmat(0.75));
    desk.position.set(-7, 0, 1); scene.add(desk);
    // the dial
    const dial = new THREE.Group(); dial.position.set(-7.4, 1.82, 1.1); scene.add(dial);
    dial.add(PR.mesh(PR.rbox(1.5, 1.1, 0.5, 0.12), mat(C.clay, 0.7)));
    const dtex = PR.canvasTex(512, 380, (g, W, Hh) => { g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, Hh); const cx = W / 2, cy = Hh * 0.78, R = W * 0.38;
      g.strokeStyle = C.ink; g.lineCap = 'round'; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; g.lineWidth = i % 5 ? 5 : 9; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
      PR.fitText(g, 'FED FUNDS', { x: 0, y: Hh * 0.8, w: W, h: Hh * 0.18, size: 0.8, color: C.ink, spacing: 4 }); });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.96), new THREE.MeshStandardMaterial({ map: dtex, roughness: 0.7 })); face.position.set(0, 0.55, 0.255); dial.add(face);
    const needle = new THREE.Group(); needle.position.set(0, 0.55 - 0.48 + 0.96 * 0.22, 0.27); dial.add(needle);
    needle.add(PR.mesh(PR.rbox(0.035, 0.4, 0.02, 0.01, 1), mat(C.ink, 0.5)));
    // a tiny clay moon on a stick (overnight)
    const moon = new THREE.Group(); moon.position.set(-5.9, 1.82, 0.6); scene.add(moon);
    moon.add(PR.mesh(PR.rbox(0.5, 0.12, 0.5, 0.05), mat(C.clay, 0.8)), PR.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6).translate(0, 0.5, 0), mat('#d9d5cc', 0.6)));
    const cres = new THREE.Shape(); cres.absarc(0, 0, 0.32, 0.6, Math.PI * 2 - 0.6, false); cres.absarc(0.16, 0, 0.26, Math.PI * 2 - 0.9, 0.9, true);
    const mm = PR.mesh(new THREE.ExtrudeGeometry(cres, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), mat(C.yellow, 0.6)); mm.position.set(0, 1.25, 0); moon.add(mm);
    // the giant hopper
    const hop = PR.ballotBox({ w: 2.6, h: 1.9, d: 1.7, ped: 1.15 }); const HS = 3.2; hop.scale.setScalar(HS); hop.position.set(6, 0, -0.6); scene.add(hop);
    const ep = PR.pile({ ...hop.inside, y0: hop.inside.y0 }, 900, { s: 0.5, thick: 0.022 });
    const pileM = new THREE.InstancedMesh(PR.envelopeGeo(0.5), PR.vmat(0.8), ep.length); pileM.castShadow = true; hop.add(pileM);
    const inflow = new THREE.InstancedMesh(PR.envelopeGeo(0.5 * HS), PR.vmat(0.8), 16); inflow.castShadow = true; scene.add(inflow);
    const fill0 = 0.6;
    const hl = PR.textPlane(P0.label ?? '10-YEAR NOTES', { w: 2.2, h: 0.32, fg: C.ink, size: 0.7, spacing: 3 }); hl.position.set(0, 1.15 * 0.32, 1.1); hop.add(hl);
    const pills = { fed: H.pill(layer, 'THE FED · <b>ONE NIGHT</b>', { size: 28 }), auc: H.pill(layer, 'THE AUCTION · <b>TEN YEARS</b>', { size: 30 }) };
    const cap = H.caption(layer, P0.caption ?? null);
    const src = H.sourceLine(layer, P0.source ?? null);
    const MOVES = {
      reveal: [{ pos: [-9.5, 3.2, 6.2], look: [-7.2, 2.2, 1], mm: 40 }, { pos: [-6, 6.5, 15], look: [-1, 3.2, 0], mm: 34 }, { pos: [-4, 9, 26], look: [2, 4.6, 0], mm: 30 }],
      wide: [{ pos: [-7, 8.5, 25], look: [1.5, 4.2, 0], mm: 30 }, { pos: [-3, 8, 24], look: [2.5, 4.4, 0], mm: 30 }],
    };
    const cam = rig(shot, camKeys(P0, MOVES[P0.move ?? 'reveal'] ?? MOVES.reveal), { accel: 0.4, decel: 0.45 });
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), v = new THREE.Vector3();
    const slotW = hop.localToWorld(hop.slot.clone());
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      needle.rotation.z = 0.5 + 0.08 * Math.sin(t * 0.9) - 0.12 * sstep(2, 3, t);
      const shown = ep.length * (fill0 + 0.25 * clamp(t / Math.max(1, shot.duration)));
      ep.forEach((e, i) => { const s = i < shown ? 1 : 1e-4; Q.setFromEuler(E.set(e.rx, e.ry, e.rz)); M4.compose(Pp.set(e.x, e.y, e.z), Q, Sc.setScalar(s)); pileM.setMatrixAt(i, M4); });
      pileM.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 16; i++) { const u = ((t * 0.55 + i / 16) % 1), a = u; const x = lerp(slotW.x - 9 + (hash(i, 1) - 0.5) * 3, slotW.x, a), y = lerp(slotW.y + 6, slotW.y, a * a) + Math.sin(Math.PI * a) * 2, z = lerp(slotW.z + 2, slotW.z, a);
        Q.setFromEuler(E.set((1 - a) * 3 * (hash(i, 2) - 0.5), (1 - a) * 4, (1 - a) * 3 * (hash(i, 3) - 0.5))); M4.compose(Pp.set(x, y, z), Q, Sc.setScalar(a > 0.96 ? 1e-4 : Math.min(1, a * 8))); inflow.setMatrixAt(i, M4); }
      inflow.instanceMatrix.needsUpdate = true;
      let [x, y] = toS(v.set(-7.2, 3.6, 1.1), camera); pills.fed.at(x, y, sstep(0.4, 0.9, t));
      [x, y] = toS(v.set(6, 12.3, -0.6), camera); pills.auc.at(x, y, sstep(shot.duration * 0.45, shot.duration * 0.45 + 0.5, t));
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  return { 'house-block': houseBlock, 'bid-stack': bidStack, seesaw, pipe, 'debt-tower': debtTower, vault, 'fed-room': vault };
}
