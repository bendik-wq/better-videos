// PANAMA cold open: THE ONER (one camera, ~55 s, moving from frame 1).
//   Low skim (2 m) over the glittering Pacific at 10 a.m., racing a white LPG carrier into a Miraflores-like lock ->
//   into the chamber; the chamber fills and the camera rises with the water, climbing the stern -> over the ship and up the
//   staircase -> crests the top gate and tilts forward: Gatun Lake, islands, jungle, 85 ft above the sea -> a cruise over
//   the lake -> a hard pull-up to the whole isthmus with an ocean on each side; the flights pour into both seas -> a
//   section line sweeps in: the lake ABOVE both oceans -> clay clouds roll in and it rains on the watershed.
// Cue words (VO lines 1-5 of SCRIPT.md; params.cues overrides with { name: { word, at } }), default times without VO:
//   staircase 11.5 (the chamber starts to fill)   sky 17 (over the stern)   up 21.5 ('Up there': up the staircase)
//   lake 25 (crest + reveal)   afternoon 29 (lake cruise)   climbs 33 (pull-up starts)   pours 37.5 (water out to sea)
//   gallons 42 (section sweeps)   gone 46.5 (section complete)   rain 51 (clouds and rain on the watershed)
// params: cues, labels (true), counter (true: the "+ft" pill during the climb), sweep (s, default 3.6), fillSpan (s, 8.5)
import * as THREE from 'three';
import * as O from '/engine/oner.js';
import * as CK from './clay-kit.js';
import * as CW from './clay-world.js';

const { clamp, lerp, range, sstep, smoother } = CK;
const DEF = { staircase: 11.5, sky: 17, up: 21.5, lake: 25, afternoon: 29, climbs: 33, pours: 37.5, gallons: 42, gone: 46.5, rain: 51 };
const WORD = { staircase: 'staircase', sky: 'sky', up: 'Up', lake: 'lake', afternoon: 'afternoon', climbs: 'climbs', pours: 'pours', gallons: 'gallons', gone: 'Gone', rain: 'rain' };

export default function makeOner(H) {
  const { P, K } = H;
  async function coldOpen(ctx, shot) {
    const P0 = shot.params ?? {};
    // ---- cue times (monotonic, at least `gap` apart)
    const cues = Object.fromEntries(Object.keys(DEF).map(k => [k, { word: P0.cues?.[k]?.word ?? WORD[k], at: P0.cues?.[k]?.at ?? DEF[k] }]));
    const T = {}; let last = 9.5;
    for (const k of Object.keys(DEF)) { let t; try { t = O.cueTime(k, { shot, cues }); } catch { t = DEF[k]; } T[k] = Math.max(t, last + 2.4); last = T[k]; }
    const enter = Math.min(9.5, T.staircase - 2), fillSpan = P0.fillSpan ?? Math.max(6, Math.min(8.5, T.up - T.staircase + 1));

    // ---- the world
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, ctx.width / ctx.height, 0.3, 30000);
    const sun = CK.brightLight(scene, { target: [0, 0, 19500], span: 500, fog: true, near: 2500, far: 30000, mapSize: P0.mapSize ?? 2048, el: P0.sunEl ?? 38, az: P0.sunAz ?? 40, fill: 0.85, hemiI: 1.1 });
    const W = CW.world(scene, { sunAz: P0.sunAz ?? 40, sunEl: P0.sunEl ?? 38 });
    const F = W.flightS, Z0 = CW.LOCK_S.z0, cz = (u) => Z0 - u, LX = F.laneZ(1);
    // the hero: a white LPG carrier, red funnel band (the shot's one accent)
    const hero = CK.ship('lpg', { seed: 3 }); hero.rotation.y = Math.PI / 2; scene.add(hero);
    const other = CK.ship('container', { seed: 6, accent: null }); other.rotation.y = -Math.PI / 2; scene.add(other);
    const mules = [-1, 1].flatMap(sd => [0, 1].map(k => { const m = CK.mule(); m.rotation.y = Math.PI / 2; scene.add(m); return { m, sd, k }; }));
    const layer = H.layerOf(ctx);
    const fx = P.post(ctx, scene, camera, { ao: { radius: 4, intensity: 1.3, falloff: 1 }, tone: 'neutral', quality: P0.quality ?? 'low' });

    // ---- levels: chamber 0 (east lane) fills sea -> step; the west lane steps down (a ship descending); chamber 1 waits at step
    const fill = (t) => smoother(range(t, T.staircase, T.staircase + fillSpan));
    const level0 = (t) => F.step * fill(t);
    // the hero moves into chamber 0 and stops: stern at u = 36
    const heroU = (t) => { const L = hero.userData.L; return lerp(58, 70, 1 - Math.pow(1 - clamp(t / enter), 2)) + L / 2; };

    // ---- the camera: keyed segments blended by O.oner (C1, pops impossible by construction)
    const sx = LX + 5;
    const segA = O.keys([
      { t: 0, pos: [sx + 2, 2.3, cz(-270)], look: [LX, 6, cz(0)], mm: 24 },
      { t: enter * 0.55, pos: [sx + 1, 2.2, cz(-95)], look: [LX, 8, cz(150)], mm: 24 },
      { t: enter, pos: [sx - 1, 2.6, cz(24)], look: [LX, 10, cz(170)], mm: 23 },
      { t: T.staircase + 0.6, pos: [sx - 2, 2.9, cz(33)], look: [LX, 11, cz(150)], mm: 22 },
    ], { vIn: 'auto' });
    // rising with the water, then climbing the stern: positions relative to the water level
    const climb = (t) => smoother(range(t, T.staircase + 1.2, T.sky + 0.6));
    const segB = O.fn((t) => { const w = level0(t), k = climb(t);
      return { pos: [lerp(sx - 2, LX + 1, k), w + lerp(2.9, 42, k), cz(lerp(33, 30, k))], look: [LX, w + lerp(11, 26, k), cz(lerp(150, 260, k))], mm: 22 }; });
    const wSky = F.step; // the chamber is full by then
    const segC = O.keys([
      { t: T.sky, pos: [LX + 1, wSky + 42, cz(30)], look: [LX, wSky + 26, cz(260)], mm: 22 },
      { t: T.up, pos: [LX - 4, 62, cz(300)], look: [LX - 6, 22, cz(600)], mm: 22 },
      { t: T.lake - 0.4, pos: [LX - 10, 46, cz(700)], look: [LX - 18, 30, cz(1500)], mm: 22 },
      { t: T.lake + 2.2, pos: [LX - 30, 105, cz(1150)], look: [LX - 260, 26, cz(9000)], mm: 24 },
      { t: T.afternoon, pos: [LX - 100, 190, cz(2200)], look: [-700, 20, cz(11000)], mm: 24 },
      { t: T.climbs, pos: [-260, 260, cz(3600)], look: [-1300, 20, cz(13000)], mm: 24 },
    ]);
    const segD = O.keys([
      { t: T.climbs - 0.6, pos: [-230, 240, cz(3450)], look: [-1250, 20, cz(12800)], mm: 24 },
      { t: T.pours - 1.2, pos: [9000, 9000, 16000], look: [-2000, 0, -2000], mm: 26 },
      { t: T.gallons - 0.5, pos: [56000, 22000, 11000], look: [-1500, 1300, -3500], mm: 28 },
      { t: T.rain + 1, pos: [61000, 21500, 8500], look: [-2500, 1300, -3500], mm: 28 },
      { t: Math.max(shot.duration, T.rain + 6), pos: [63000, 22000, 7000], look: [-3000, 1300, -3500], mm: 28 },
    ], { logY: -50, vOut: 'auto' });
    const on = O.oner({ shot, segments: [
      { from: 0, to: T.staircase + 0.9, cam: segA },
      { from: T.staircase + 0.3, to: T.sky + 0.5, cam: segB },
      { from: T.sky, to: T.climbs + 0.4, cam: segC },
      { from: T.climbs - 0.6, to: Math.max(shot.duration, T.rain + 6), cam: segD },
    ] });
    window.__oner = on;

    // ---- overlays: the climb counter, the lake pill, the section labels
    const s = H.sc();
    const ctr = P0.counter === false ? null : H.pill(layer, '', { size: 30 });
    const lakePill = H.pill(layer, 'GATUN LAKE', { size: 30, dot: '#3fb2b7' });
    const labels = P0.labels === false ? [] : [
      ['ATLANTIC · 0 FT', 0.05, 0, '#57bcbc'], ['GATUN LAKE · +85 FT', 0.47, CW.LAKE, '#3fb2b7'], ['PACIFIC · 0 FT', 0.93, 0, '#57bcbc'],
    ].map(([txt, z, y, dot]) => ({ el: H.pill(layer, txt, { size: 28, dot }), z, y }));
    const sea = H.slab(layer, 'SEA LEVEL', 'left:0;top:0', { size: 22 }); sea.style.opacity = '0';
    const v = new THREE.Vector3();
    const toS = (p) => K.toScreen(p, camera);

    return { scene, camera, layer, update(t) {
      on.camera(t, camera);
      W.tick(t, camera, sun);
      const alt = Math.max(1, camera.position.y);
      fx.ao && (fx.ao.configuration.aoRadius = clamp(alt * 0.25, 2, 300), fx.ao.configuration.distanceFalloff = 1);
      // lock state
      const w0 = level0(t);
      F.setLevel(0, 1, w0); F.setLevel(0, 0, F.step * (1 - fill(t))); F.setLevel(1, 0, F.step); F.setLevel(1, 1, F.step);
      F.setGate(0, 1, 1 - sstep(enter + 0.4, T.staircase, t)); F.setGate(0, 0, 0); F.setGate(1, 1, sstep(T.staircase + fillSpan - 0.4, T.staircase + fillSpan + 3.5, t)); F.setGate(1, 0, 0); F.setGate(2, 0, 0); F.setGate(2, 1, 0);
      const hu = heroU(t); hero.position.set(LX, w0, cz(hu));
      other.position.set(F.laneZ(0), F.step * (1 - fill(t)), cz(180));
      for (const { m, sd, k } of mules) m.position.set(LX + sd * (F.Wc / 2 + (sd > 0 ? F.wall : F.mid) / 2), F.wallTop(0) + 0.25, cz(hu + (k ? 70 : -70)));
      // macro beats
      const kp = sstep(T.pours - 0.5, T.pours + 1.5, t) * (1 - sstep(T.gone + 1, T.gone + 3, t));
      W.arrowsOut.forEach(a => a.tick(t, kp));
      const sweep = P0.sweep ?? 3.6, kr = sstep(T.gallons - 0.6, T.gallons + 0.8, t), ks = smoother(range(t, T.gallons, T.gallons + sweep));
      W.section.set(ks, kr, 1 - 0.85 * sstep(T.rain - 1.5, T.rain + 1.5, t));
      W.setClouds(t, sstep(T.rain - 1.5, T.rain + 3.5, t)); W.rainFx.tick(t, sstep(T.rain, T.rain + 2.5, t));
      // overlays
      if (ctr) {
        const ft = Math.round(lerp(0, 43, fill(t)) + 42 * sstep(T.up - 1, T.lake - 0.3, t));
        ctr.innerHTML = `<span style="opacity:.6">SEA LEVEL</span> &nbsp;+${ft} FT`;
        const a = sstep(T.staircase - 0.2, T.staircase + 0.6, t) * (1 - sstep(T.lake + 1.6, T.lake + 2.4, t));
        ctr.at(960, 150, a);
      }
      { const p = toS(v.set(LX - 220, CW.LAKE + 30, cz(4200))), a = sstep(T.lake + 0.4, T.lake + 1.2, t) * (1 - sstep(T.climbs - 1, T.climbs, t)); lakePill.at(p[0], p[1], a); }
      for (const L of labels) { const p = toS(v.copy(W.section.anchor(L.z, L.y))); L.el.at(p[0], p[1] - 14, sstep(T.gone - 0.8, T.gone + 0.2, t) * (1 - sstep(T.rain - 1, T.rain + 1, t))); }
    }, dispose() { fx.dispose(); } };
  }
  return { 'cold-open': coldOpen };
}
