// Orbit and the cold open.
//
//   orbit-lights  NASA Black Marble night lights on engine/world's globe, with a 500 m regional patch over
//                 eastern Europe (projects/blackout/assets/night/east-europe.jpg) whose districts switch off on cue.
//                 params: view ('europe' | 'ukraine' | 'region' | 'kyiv' | 'poland'), region ('ivano-frankivsk' |
//                 'chernivtsi' | 'kyiv' | 'kyiv-city' | 'three' | 'none'), at (word/s: the first district goes),
//                 span (s for the whole region), restore (word/s: lights come back island by island), frac (share
//                 of districts that fail, default 1), labels (true), caption
//   cold-open     THE ONER (STYLE.md): Europe at night from orbit -> descent over Ukraine through the snow clouds ->
//                 Ivano-Frankivsk at night, the dispatch centre's green windows -> through the window -> over the
//                 operator's shoulder, down to his still hand, up onto his monitor -> macro on the cursor that moves
//                 by itself -> it clicks, the breaker goes red -> the breaker clunk: black, silence.
//                 One camera, one continuous move (O.oner segments blend C1); the world (globe, clouds) hands over to
//                 the town inside a cloud whiteout. Cue words (params.cues overrides): window 'Twenty', operator
//                 'operator', hand 'hand', move 'starts', click 'Clicks', open 'breaker', dark 'dark'.
//                 Default times (no VO): clouds 9.5, window 20, operator 23.5, hand 26.5, move 30.5, click 34.5,
//                 dark 37.5 (the clunk); then black to the end of the shot.
import * as THREE from 'three';
import * as W from '/engine/world/index.js';
import * as O from '/engine/oner.js';
import * as LW from './lw.js';
import { buildTown, buildCentre, heroWindow, CENTRE } from './town.js';
import { buildRoom, ROOM, DESK_TOP, heroSpots } from './rooms.js';
import { hmiState } from './grid.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL, FONT } = LW;
const ANCHOR = { lat: 48.9226, lon: 24.7111 }; // Ivano-Frankivsk

// ---------------------------------------------------------------- the regional night-lights patch
const NIGHT = { bbox: [14, 43, 42, 56], url: '/projects/blackout/assets/night/east-europe.jpg' };
export const REGIONS = {
  'ivano-frankivsk': [[24.7, 48.75, 0.95]], chernivtsi: [[25.85, 48.3, 0.55]], kyiv: [[30.5, 50.3, 1.25]],
  'kyiv-city': [[30.52, 50.45, 0.22]], three: [[24.7, 48.75, 0.95], [25.85, 48.3, 0.55], [30.5, 50.3, 1.25]], none: [],
};
const NSEED = 24;
let nightTex = null;
async function loadNight() { return nightTex ??= new THREE.TextureLoader().loadAsync(NIGHT.url).then(t => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }); }
export async function nightPatch(w, { region = 'ivano-frankivsk' } = {}) {
  const tex = await loadNight(), F = w.frame, rG = W.R_EARTH + w.globeH + F.elev + 350;
  const [lo0, la0, lo1, la1] = NIGHT.bbox, NX = 220, NY = 110;
  const pos = new Float32Array((NX + 1) * (NY + 1) * 3), uv = new Float32Array((NX + 1) * (NY + 1) * 2), ll = new Float32Array((NX + 1) * (NY + 1) * 2);
  let i = 0;
  for (let y = 0; y <= NY; y++) for (let x = 0; x <= NX; x++, i++) {
    const lon = lo0 + (lo1 - lo0) * x / NX, lat = la1 - (la1 - la0) * y / NY, la = lat * Math.PI / 180, lo = lon * Math.PI / 180, c = Math.cos(la);
    const d = F.dirLocal(c * Math.cos(lo), c * Math.sin(lo), Math.sin(la));
    pos.set([F.center.x + d[0] * rG, F.center.y + d[1] * rG, F.center.z + d[2] * rG], i * 3); uv.set([x / NX, 1 - y / NY], i * 2); ll.set([lon, lat], i * 2);
  }
  const idx = []; for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) { const a = y * (NX + 1) + x, b = a + NX + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('aLL', new THREE.BufferAttribute(ll, 2)); geo.setIndex(idx);
  // district seeds: spread inside the region's circles (deterministic), ranked from the first circle's centre outwards
  const circles = REGIONS[region] ?? [], r = LW.rng(9);
  const seeds = [];
  for (let k = 0; k < NSEED; k++) { const c = circles.length ? circles[Math.min(circles.length - 1, Math.floor(k * circles.length / NSEED))] : [0, 0, 0]; const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * c[2]; seeds.push([c[0] + Math.cos(a) * rr / Math.cos(c[1] * Math.PI / 180), c[1] + Math.sin(a) * rr]); }
  const U = { tNight: { value: tex }, uSeeds: { value: seeds.map(s => new THREE.Vector2(...s)) }, uOn: { value: new Array(NSEED).fill(1) }, uCirc: { value: [0, 1, 2].map(k => new THREE.Vector3(...(circles[k] ?? [0, 0, 0]))) },
    uGain: { value: 1 }, uMapK: { value: 0 }, uBorder: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `attribute vec2 aLL; varying vec2 vUv, vLL; void main() { vUv = uv; vLL = aLL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tNight; uniform vec2 uSeeds[${NSEED}]; uniform float uOn[${NSEED}]; uniform vec3 uCirc[3]; uniform float uGain, uBorder; varying vec2 vUv, vLL;
      void main() {
        float v = texture2D(tNight, vUv).r;
        float L = smoothstep(.2, .95, v); float land = smoothstep(.03, .14, v);
        // in a failing region, the nearest district seed decides
        float inside = 0.; for (int k = 0; k < 3; k++) if (uCirc[k].z > 0.) { vec2 d = (vLL - uCirc[k].xy) * vec2(cos(radians(uCirc[k].y)), 1.); inside = max(inside, 1. - smoothstep(uCirc[k].z * .92, uCirc[k].z * 1.08, length(d))); }
        float best = 1e9, on = 1., second = 1e9;
        for (int k = 0; k < ${NSEED}; k++) { vec2 d = (vLL - uSeeds[k]) * vec2(.66, 1.); float dd = dot(d, d); if (dd < best) { second = best; best = dd; on = uOn[k]; } else if (dd < second) second = dd; }
        on = mix(1., on, inside);
        // district borders glow faintly red as they fail (annotation, not light)
        float edge = (1. - smoothstep(0., .0025, sqrt(second) - sqrt(best))) * inside * uBorder * (1. - on);
        // the patch only covers where there is light (so the globe's own coarser lights are replaced, its land kept)
        float Ls = smoothstep(.24, 1., v);
        vec3 col = vec3(1., .6, .28) * pow(Ls, 2.2) * 1.5 * uGain * on;
        col += vec3(1., .17, .12) * edge * .06;
        float fe = smoothstep(0., .04, vUv.x) * smoothstep(1., .96, vUv.x) * smoothstep(0., .06, vUv.y) * smoothstep(1., .94, vUv.y);
        float a = fe * max(smoothstep(.1, .5, v), edge * .5);
        gl_FragColor = vec4(col, a);
      }` });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = -45;
  w.add(mesh, { far: true });
  // district switching: rank seeds by distance from the first circle's centre (the city first, then outward)
  const c0 = circles[0] ?? [0, 0];
  const rank = seeds.map((s, k) => [k, Math.hypot((s[0] - c0[0]) * 0.66, s[1] - c0[1]) + hash(k, 'rk') * 0.15]).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  return { mesh, U, seeds, rank,
    // k in [0, 1]: progress of the failure; frac: share of districts that fail; restore in [0, 1]
    set(t, { k = 0, frac = 1, restore = 0, flick = true } = {}) {
      const n = Math.round(NSEED * frac);
      rank.forEach((s, j) => {
        let on = 1;
        if (j < n) { const u = clamp(k * n - j); on = flick ? LW.flickerOut(u, s) : 1 - u; }
        const back = clamp(restore * NSEED - (NSEED - 1 - j)); // islands come back in reverse order
        U.uOn.value[s] = Math.max(on, LW.strike(back, s));
      });
    } };
}

export default function makeOrbit(H) {
  // ---------------------------------------------------------------- orbit-lights
  const VIEWS = {
    europe: { focus: [49.5, 20], alt: [5.2e6, 4.2e6], tilt: [26, 24], heading: [10, 16], mm: 35 },
    ukraine: { focus: [48.9, 27.5], alt: [1.5e6, 1.15e6], tilt: [18, 22], heading: [0, 6], mm: 35 },
    region: { focus: [48.8, 25.0], alt: [4.2e5, 3.3e5], tilt: [8, 14], heading: [0, 4], mm: 40 },
    kyiv: { focus: [50.4, 30.5], alt: [1.6e5, 1.25e5], tilt: [6, 12], heading: [0, 4], mm: 40 },
    poland: { focus: [52.0, 19.4], alt: [1.4e6, 1.15e6], tilt: [16, 20], heading: [0, 5], mm: 35 },
  };
  const LABELS = [['KYIV', 30.52, 50.45], ['IVANO-FRANKIVSK', 24.71, 48.92], ['CHERNIVTSI', 25.94, 48.29], ['LVIV', 24.03, 49.84], ['WARSAW', 21.01, 52.23], ['MINSK', 27.56, 53.9], ['BUCHAREST', 26.1, 44.43], ['ODESA', 30.73, 46.48]];
  async function orbitLights(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration, V = VIEWS[P.view ?? 'region'];
    const w = await W.create({ lat: V.focus[0], lon: V.focus[1], tod: W.TOD.night, clouds: { base: 2400, thick: 700, coverage: 0.42, fog: 0 }, shadows: false, mirror: false, renderScale: ctx.draft ? 1 : 0.9, fleet: false });
    w.build();
    const patch = await nightPatch(w, { region: P.region ?? 'ivano-frankivsk' });
    patch.U.uBorder.value = P.border === false ? 0 : 1;
    const camera = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 10, 1e8);
    const layer = H.layerOf(ctx);
    const F = w.frame, focus = F.toLocal(V.focus[0], V.focus[1], 0).toArray();
    const cam = O.geo(focus, { t0: 0, t1: D, frame: F, alt: V.alt, tilt: V.tilt, heading: V.heading, mm: [V.mm, V.mm * 1.04] });
    const tA = H.cue(shot, P.at, Math.min(1.2, D * 0.2)), span = P.span ?? Math.max(1.5, Math.min(5, D - tA - 1)), tR = H.cue(shot, P.restore, Infinity);
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    const lbls = (P.labels === false ? [] : LABELS).map(([n, lo, la]) => { const el = H.K.div(layer, `opacity:1;font:400 1.25em ${FONT.term};letter-spacing:.08em;color:${PAL.fluoro};text-shadow:0 0 8px rgba(0,0,0,.9);white-space:nowrap`, n); return { el, p: F.toLocal(la, lo, 0) }; });
    const tod = { ...W.TOD.night, sunEl: -75, cityGlow: [1, 0.55, 0.25].map(x => x * 0.3), stars: 0.7 };
    return { scene: w.scene, camera, layer, toneMapping: THREE.NoToneMapping,
      update(t) {
        const s = cam(t); camera.position.copy(s.pos); camera.quaternion.copy(s.quat); camera.fov = s.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
        w.setState({ t, tod, exposure: 1.25 });
        patch.set(t, { k: range(t, tA, tA + span), frac: P.frac ?? 1, restore: range(t, tR, tR + (P.restoreSpan ?? 3)) });
        const v = new THREE.Vector3();
        for (const L of lbls) { v.copy(L.p).project(camera); const vis = v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.9; L.el.style.display = vis ? '' : 'none';
          L.el.style.left = `${(v.x * 0.5 + 0.5) * 100}%`; L.el.style.top = `${(0.5 - v.y * 0.5) * 100}%`; L.el.style.transform = 'translate(10px,-50%)'; L.el.style.opacity = (0.75 * sstep(0.3, 1.2, t)).toFixed(3); }
        cap?.type(t);
      },
      render(r) { w.render(r, camera); } };
  }

  // ---------------------------------------------------------------- cold-open (the oner)
  async function coldOpen(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration;
    const CUES = { clouds: 9.5, window: { word: 'Twenty', at: 20 }, operator: { word: 'operator', at: 23.5 }, hand: { word: 'hand', at: 26.5 }, move: { word: 'starts', at: 30.5 },
      click: { word: 'Clicks', at: 34.5 }, open: { word: 'breaker', at: 35 }, dark: { word: 'dark', at: 37.5 }, ...(P.cues ?? {}) };
    const T = (name) => O.cueTime(name, { shot, cues: CUES });
    const tC = T('clouds'), tWin = T('window'), tOp = Math.max(tWin + 2.4, T('operator')), tHand = Math.max(tOp + 2.2, T('hand')), tMove = Math.max(tHand + 2.4, T('move')), tClick = Math.max(tMove + 3.0, T('click')), tDark = Math.max(tClick + 1.6, T('dark'));
    const tS = tC + 0.3; // the handover inside the whiteout
    // ---- the world: globe + snow cloud deck, anchored on Ivano-Frankivsk (same frame as the town: x east, z south)
    const w = await W.create({ lat: ANCHOR.lat, lon: ANCHOR.lon, tod: W.TOD.night, clouds: { base: 2300, thick: 650, coverage: 0.62, fog: 0 }, shadows: false, mirror: false, renderScale: ctx.draft ? 1 : 0.9, fleet: false, relief: { amp: 25, scale: 5000 } });
    w.build();
    const patch = await nightPatch(w, { region: 'none' });
    const F = w.frame;
    // ---- the town, the dispatch centre and the control room (one three.js scene)
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05080d);
    const town = buildTown(scene, { radius: 1900, poleRadius: 420, fog: 0.00055 });
    const centre = buildCentre(scene);
    const room = await buildRoom(scene, ctx);
    const moon = new THREE.HemisphereLight(0x22324a, 0x06080a, 0.25); scene.add(moon);
    for (const [x, z] of [[-11, 13], [9, 13]]) { const s = new THREE.SpotLight(0xffa24a, 70, 40, 0.75, 0.6, 1.6); s.position.set(x, 9, z); s.target.position.set(x * 0.4, 4, -1); scene.add(s, s.target);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.sodium).multiplyScalar(4) })); head.position.set(x, 9, z); scene.add(head); }
    const sn = LW.snow({ count: 6000, box: [70, 40, 70], center: [0, 20, 20], size: 0.035, speed: 1.1, seed: 3, base: 0.07 });
    scene.add(sn.points);
    sn.light(0, [-11, 9, 13], [0.3, -1, -0.5], 0.6, 26, [1, 0.6, 0.3]); sn.light(1, [9, 9, 13], [-0.3, -1, -0.5], 0.6, 26, [1, 0.6, 0.3]);
    sn.light(2, [CENTRE.hero, 5.6, -0.5], [0, -0.2, 1], 0.5, 10, [0.6, 1, 0.75]);
    // the white veil of the cloud deck (we come out of it under the clouds, in falling snow)
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x8f98a6, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
    veil.frustumCulled = false; veil.renderOrder = 999; const vScene = new THREE.Scene(), vCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); vScene.add(veil);
    // ---- the screen geometry (for the macro): pixel -> world
    const S = heroSpots(), SW = room.SW, SH = room.SH;
    const scrZ = ROOM.rowA - 0.24 + 0.0255 + 0.001, scrC = [ROOM.hero, DESK_TOP + 0.32];
    const px2w = (px, py) => [scrC[0] - 0.188 + px / SW * 0.376, scrC[1] + 0.1505 - py / SH * 0.301, scrZ];
    const hmiAt = (t) => hmiState(t - 0, { W: SW, H: SH, target: P.target ?? 'Q13', tMove, tClick: tClick, mode: 'click', clock0: -tWin });
    // the macro rig follows the pointer late and soft (a pure average over the last half second)
    const follow = (t) => { let ax = 0, ay = 0, ws = 0; for (let k = 0; k < 8; k++) { const tt = t - 0.55 * k / 7, wk = 1 - k / 9, s2 = hmiAt(tt); ax += s2.cursor.x * wk; ay += s2.cursor.y * wk; ws += wk; }
      let fx = ax / ws + 26, fy = ay / ws + 22; const bx = LW.hmiBreaker(P.target ?? 'Q13', SW, SH), k = smoother(range(t, tClick + 0.2, tClick + 1.3)); return [lerp(fx, bx[0] + 30, k), lerp(fy, bx[1] + 18, k)]; };
    const macro = (t, back = 0.042) => { const [fx, fy] = follow(t), p = px2w(fx, fy); return { pos: [p[0] + 0.012, p[1] - 0.006, p[2] + back], look: [p[0], p[1], p[2]] }; };
    // ---- the camera: one oner
    const anchorL = new THREE.Vector3(0, 0, 0), eu = F.toLocal(47.5, 13.0, 0);
    const geo = O.geo((t) => { const k = smoother(range(t, 0, tC * 0.85)); return eu.clone().lerp(anchorL, k).toArray(); }, { t0: 0, t1: tS + 0.6, frame: F,
      alt: O.curve([[0, 6.4e6], [tC * 0.45, 9e5], [tC * 0.8, 3.0e4], [tS + 0.6, 2400]], { log: true, vOut: 'auto' }),
      tilt: O.curve([[0, 22], [tC * 0.6, 24], [tS + 0.6, 52]], { vOut: 'auto' }), heading: O.curve([[0, 34], [tC * 0.7, 12], [tS + 0.6, 0]], { vOut: 'auto' }), mm: [30, 34] });
    const gS = geo(tS - 0.4), gLook = (s) => s.pos.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(s.quat).multiplyScalar(2000));
    const hw = heroWindow(), hd = room.heroP; room.update(0, {}); const head = hd.worldPos('head');
    const mon = [S.monitor[0], S.monitor[1] - 0.005, scrZ];
    const town0 = O.keys([
      { t: tS - 0.4, pos: gS.pos.toArray(), look: gLook(gS).toArray(), mm: 34 },
      { t: tC + 4.5, pos: [140, 720, 1750], look: [0, 30, 0], mm: 34 },
      { t: tWin - 4.0, pos: [-18, 70, 230], look: [hw.x, 14, 0], mm: 34 },
      { t: tWin - 1.2, pos: [hw.x, hw.y + 0.9, 26], look: [hw.x, hw.y, 0], mm: 32 },
      { t: tWin + 0.9, pos: [hw.x, hw.y - 0.05, 0.6], look: [hw.x, hw.y - 0.35, -6], mm: 30 },
      { t: tOp, pos: [head.x + 0.42, head.y + 0.28, head.z + 0.55], look: mon, mm: 32 },
      { t: tHand, pos: [S.hand[0] + 0.32, S.hand[1] + 0.32, S.hand[2] + 0.42], look: [S.hand[0] + 0.06, S.hand[1], S.hand[2] - 0.05], mm: 38 },
      { t: tMove - 0.6, pos: [mon[0] + 0.03, mon[1] + 0.01, mon[2] + 0.42], look: mon, mm: 40 },
      { t: tMove + 1.4, ...macro(tMove + 1.4, 0.07), mm: 45 },
    ], { vIn: 'auto' });
    const macroSeg = (t) => { const m = macro(t); return O.lookState(m.pos, m.look, { mm: 45 }); };
    const pullBack = (t) => { const m = macro(t, lerp(0.042, 0.062, smoother(range(t, tClick + 0.3, tDark)))); return O.lookState(m.pos, m.look, { mm: 45 }); };
    const oner = O.oner({ segments: [
      { from: 0, to: tS, cam: geo },
      { from: tS - 0.4, to: tMove + 1.4, cam: town0 },
      { from: tMove + 0.9, to: tClick + 0.3, cam: macroSeg },
      { from: tClick, to: D + 1, cam: pullBack },
    ] });
    if (/onertrace/.test(location.search)) { const tr = oner.trace(60, 0, tDark); const rr = O.smoothness(tr, { scale: (p) => Math.max(0.05, Math.min(p[1] < 2000 ? Math.hypot(p[0], p[1] - 5, p[2]) : F.altitude(new THREE.Vector3(...p)), 1e7) * 0.1) }); console.log('[scene] onertrace', JSON.stringify({ sp: rr.worstSpeedChange, an: rr.worstAngularChange })); }
    const camera = new THREE.PerspectiveCamera(34, ctx.width / ctx.height, 0.01, 1e8);
    const layer = H.layerOf(ctx);
    const cap = P.caption ? H.caption(layer, P.caption, 'left:5.5%;bottom:8%', { at: tMove }) : null;
    const tod = { ...W.TOD.night, sunEl: -75, cityGlow: [1, 0.55, 0.25].map(x => x * 0.12), cloud: [0.11, 0.115, 0.13], stars: 0.7 };
    let phase = 'world', tNow = 0, blackK = 0;
    return { scene, camera, layer, toneMapping: THREE.ACESFilmicToneMapping,
      update(t) {
        tNow = t;
        oner.camera(t, camera);
        phase = t < tS ? 'world' : 'town';
        blackK = t >= tDark ? 1 : 0;
        if (phase === 'world') {
          // whiteout through the deck: we fly into the snow cloud
          w.setState({ t, tod, exposure: lerp(1.3, 1.7, sstep(tC - 1.5, tC - 0.1, t)), cloudFog: sstep(tC - 1.4, tC - 0.05, t) });
          patch.set(t, {});
        } else {
          const alt = camera.position.y;
          camera.near = alt > 300 ? 2 : alt > 40 ? 0.3 : 0.004; camera.far = alt > 300 ? 9000 : 2500; camera.updateProjectionMatrix();
          veil.material.opacity = 1 - sstep(tS + 0.2, tC + 2.6, t);
          const st = hmiAt(t);
          room.update(t, { banks: [1, 1, 1, 1], screens: 1, hmi: st, mimicDead: st.opened ? 0.04 : 0 });
          town.update(t, { pow: () => 1, camera, height: ctx.height });
          // snow follows the camera outside; inside, only the flakes past the window remain
          const inside = camera.position.z < -0.2 && camera.position.y < 9;
          sn.U.uCenter.value.set(inside ? 0 : camera.position.x, inside ? 6 : camera.position.y, inside ? 18 : camera.position.z - 10);
          sn.update(t, camera, ctx.height);
        }
        cap?.type(t);
      },
      render(r) {
        if (blackK >= 1) { r.setClearColor(0x000000, 1); r.clear(); return; }
        if (phase === 'world') { w.render(r, camera); return; }
        r.toneMapping = THREE.ACESFilmicToneMapping; r.render(scene, camera);
        if (veil.material.opacity > 0.001) { const ac = r.autoClear; r.autoClear = false; r.render(vScene, vCam); r.autoClear = ac; }
      } };
  }
  return { 'orbit-lights': orbitLights, 'cold-open': coldOpen };
}
