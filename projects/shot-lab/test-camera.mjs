#!/usr/bin/env node
// Numerical smoothness and correctness tests for engine/camera.js.
//   node projects/shot-lab/test-camera.mjs            all primitives, compositions, framing, follow
//   node projects/shot-lab/test-camera.mjs --catalog  also builds and checks every catalog recipe
//
// Smoothness test (per move, per channel: position, view direction, roll, log focal length):
//   sample at dt and dt/2, take finite-difference velocity and acceleration, and look at the
//   largest jump between consecutive samples. For a C2 signal the acceleration jump scales with dt
//   (halves when dt halves); a C1-only signal keeps a constant acceleration jump; a velocity pop
//   (C0) makes the acceleration jump *grow*. We assert the ratio < 0.7 (or the jump is negligible),
//   and that the peak acceleration is not a spike relative to the move's own velocity scale.
import { register } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '../..');
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(s, c, n) { if (s === 'kit') return n(${JSON.stringify('file://' + root + '/engine/kit.js')}, c); return n(s, c); }`));
const M = await import(root + '/engine/camera.js');
const { world } = await import(here + '/world-handles.mjs');

let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('  FAIL', msg); } };

const CH = ['pos', 'dir', 'roll', 'lens'];
export function smooth(m, name, opts = {}) {
  if (m.cuts?.length) { // hidden cuts: each piece must be smooth on its own
    const T = [0, ...m.cuts, m.dur]; let all = true;
    for (let i = 0; i < T.length - 1; i++) { const piece = M.move(T[i + 1] - T[i] - 2e-3, (t) => m.at(T[i] + 1e-3 + t)); all = smooth(piece, `${name} [piece ${i + 1}]`, { ...opts, atRest: false }) && all; }
    return all;
  }
  const { atRest = true, quiet = false } = opts;
  const a = M.measure(m, { dt: 1 / 240 }), b = M.measure(m, { dt: 1 / 480 });
  const rows = [];
  let good = true;
  for (const k of CH) {
    const A = a[k], B = b[k], scale = Math.max(A.vPeak, 1e-9);
    const negl = A.vPeak < 1e-7 || A.aJump < 1e-4 * Math.max(A.aPeak, 1e-9) + 1e-7 * scale + 1e-9;
    const rA = A.aJump > 0 ? B.aJump / A.aJump : 0, rV = A.vJump > 0 ? B.vJump / A.vJump : 0;
    const c2 = negl || rA < 0.7, c1 = negl || rV < 0.7;
    // spike: peak accel vs what a 0.25 s ramp up to peak speed would need (pi/2 * v / 0.25)
    const spike = A.aPeak / (scale * Math.PI / 2 / 0.25 + 1e-9);
    const spikeOk = A.vPeak < 1e-6 || spike < 1.5 || m.dur < 1.2;
    if (!(c1 && c2 && spikeOk)) good = false;
    rows.push(`${k}:${c2 ? 'C2' : c1 ? 'C1' : 'C0'}${spikeOk ? '' : '!spike' + spike.toFixed(1)}`);
    if (atRest && A.vPeak > 1e-6) { const rest = A.vStart / scale < 0.02 && A.vEnd / scale < 0.02; if (!rest) { good = false; rows.push(`${k}:not-at-rest(${(A.vStart / scale).toFixed(3)},${(A.vEnd / scale).toFixed(3)})`); } }
  }
  ok(good, `${name} ${rows.join(' ')}`);
  if (!quiet && good) console.log(`  ok  ${name.padEnd(28)} ${rows.join(' ')}`);
  return good;
}

const W = world();
console.log('== primitives');
const prims = {
  dollyIn: M.dollyIn({ target: W.hero }), dollyOut: M.dollyOut({ target: W.hero }), creep: M.creep({ target: W.hero, float: 0 }),
  pullBackReveal: M.pullBackReveal({ target: W.hero }), pushPast: M.pushPast({ target: W.hero }),
  truck: M.truck({ target: W.hero }), parallaxSlide: M.parallaxSlide({ target: W.hero }), wipeReveal: M.wipeReveal({ target: W.hero }),
  macroSlide: M.macroSlide({ target: W.object }), pedestal: M.pedestal({ target: W.hero }), craneUp: M.craneUp({ target: W.hero }),
  craneDown: M.craneDown({ target: W.hero }), jibArc: M.jibArc({ target: W.hero }), craneReveal: M.craneReveal({ target: W.tower }),
  orbit: M.orbit({ target: W.hero }), arcPush: M.arcPush({ target: W.hero }), halfOrbitReveal: M.halfOrbitReveal({ target: W.hero }),
  spiralDescent: M.spiralDescent({ target: W.plaza }), helixRise: M.helixRise({ target: W.tower }), godRotate: M.godRotate({ target: W.plaza }),
  topDownPush: M.topDownPush({ target: W.plaza }), overheadToEye: M.overheadToEye({ target: W.figureAt(0), size: 4 }),
  dutchDrift: M.dutchDrift({ target: W.hero }), dollyZoom: M.dollyZoom({ target: W.hero }), snapZoom: M.snapZoom({ target: W.hero }),
  zoomCreep: M.zoomCreep({ target: W.hero }), rackHold: M.rackHold({ target: W.hero, near: 1.5 }),
  whipPan: M.whipPan({ pos: [0, 1.7, 10], from: W.hero, to: W.tower }), pan: M.pan({ pos: [0, 1.7, 10] }), tiltUp: M.tiltUp({ pos: [0, 1.7, 30], from: [0, 0, 0], to: W.towerTop }),
  lookAtShift: M.lookAtShift({ pos: [2, 1.6, 12], from: W.hero, to: W.tower }), lockOff: M.lockOff({ target: W.hero, float: 0 }),
  heroRise: M.heroRise({ target: W.figureAt(0) }), pushThrough: M.pushThrough({ through: W.window.point, normal: W.window.normal, target: W.window.inside }),
  flyover: M.flyover({ target: W.plaza }), flyThrough: M.flyThrough({ gap: W.gap.point, dir: W.gap.dir }), trackPath: M.trackPath({ points: W.road }),
  fpvWeave: M.fpvWeave({ points: W.weave }), fpvDive: M.fpvDive({ edge: W.towerTop, height: 40, dir: [0, 0, 1] }),
  droneRidgeReveal: M.droneRidgeReveal({ crest: W.ridge.crest, dir: W.ridge.dir, vista: W.plaza }),
  pullBackToPlanet: M.pullBackToPlanet({ ground: W.plaza, center: W.planet.center, radius: W.planet.radius, h0: 4, h1: 400000 }),
  descendFromSky: M.descendFromSky({ ground: W.plaza, h0: 900, h1: 8, lookEnd: W.tower }),
  mapFlyTo: M.mapFlyTo({ from: { at: [0, 0], width: 200 }, to: { at: [3000, 1200], width: 120 }, tilt: 25 }),
  globeFly: M.globeFly({ center: W.globe.center, radius: W.globe.radius, from: { lat: 51.5, lon: 0, alt: 3 }, to: { lat: 40.7, lon: -74, alt: 2 } }),
};
for (const [k, m] of Object.entries(prims)) smooth(m, k);
console.log('== follows (live subject; start/end in motion is expected)');
const follows = { handheld: M.handheld({ target: W.hero }), lockOffFloat: M.lockOff({ target: W.hero }), followChase: M.followChase({ subject: W.car }), followSide: M.followSide({ subject: W.car }), followLead: M.followLead({ subject: W.car }), followTop: M.followTop({ subject: W.car }), followFigure: M.follow({ subject: W.figure, offset: [0.6, 1.5, 4], mm: 40 }) };
for (const [k, m] of Object.entries(follows)) smooth(m, k, { atRest: false });
console.log(`   primitives: ${Object.keys(prims).length + Object.keys(follows).length} tested (${Object.keys(M.P).length} exported in M.P)`);

console.log('== composition');
const oner = M.seq([
  M.descendFromSky({ ground: W.carAt(5), h0: 600, h1: 14, dur: 5, ease: 'in', heading: [0, 0, -1] }),
  M.followChase({ subject: W.car, dur: 7 }),
  M.pullBackToPlanet({ ground: W.carAt(13), center: W.planet.center, radius: W.planet.radius, h0: 12, h1: 400000, dur: 8, ease: 'out' }),
], { overlap: 1.4 });
smooth(oner, 'seq sky->car->planet', { atRest: false });
const flowSeq = M.seq([M.dollyIn({ target: W.hero, ease: 'in', dur: 4 }), M.orbit({ target: W.hero, ease: 'linear', dur: 4 }), M.craneUp({ target: W.hero, ease: 'out', dur: 4 })], { overlap: 1.0 });
smooth(flowSeq, 'seq dolly->orbit->crane (flow)');
const restSeq = M.seq([M.dollyIn({ target: W.hero }), M.lockOff({ target: W.hero }), M.orbit({ target: W.hero })], { overlap: 0 });
smooth(restSeq, 'seq rest-to-rest, overlap 0');
const chained = M.seq([M.orbit({ target: W.hero }), (prev) => M.dollyIn({ target: W.hero, dist: M.vec.len(M.vec.sub(prev.pos, W.hero)), az: -20 + 40 })]);
smooth(chained, 'seq chained via prevEnd');
// absolute landing: the last segment ends exactly on its own framing
{ const segEnd = M.pullBackToPlanet({ ground: W.carAt(13), center: W.planet.center, radius: W.planet.radius, h0: 12, h1: 400000, dur: 8, ease: 'out' }).end;
  const e = oner.end; ok(M.vec.len(M.vec.sub(e.pos, segEnd.pos)) < 1e-3 * 400000, `seq lands on last segment's framing (err ${M.vec.len(M.vec.sub(e.pos, segEnd.pos)).toExponential(2)})`); }
// follow segment is locked to the car after settling
{ const seg = oner.segments[1], tMid = seg.start + seg.dur - oner.segments[2].overlap, f = M.followChase({ subject: W.car, dur: 7 });
  const err = M.vec.len(M.vec.sub(oner.at(tMid).pos, f.at(tMid - seg.start, tMid).pos)); ok(err < 1e-6, `follow segment locked to subject after settle (err ${err.toExponential(2)})`); }
// no speed dip to zero across a flow hand-off
{ let minV = Infinity; const h = 1 / 240; for (let t = 3; t < 9; t += h) { const v = M.vec.len(M.vec.sub(flowSeq.at(t + h).pos, flowSeq.at(t).pos)) / h; minV = Math.min(minV, v); }
  ok(minV > 0.05, `flow hand-off keeps moving (min speed ${minV.toFixed(3)} m/s)`); }
smooth(M.blend(M.orbit({ target: W.hero }), M.dollyIn({ target: W.tower }), [2, 5]), 'blend orbit->dolly ramp [2,5]');
smooth(M.lookAt(M.truck({ target: W.hero }), W.car, { lead: 0.4, weight: [1, 3] }), 'lookAt lead on truck', { atRest: false });
smooth(M.layer(M.orbit({ target: W.hero }), M.pedestal({ target: W.hero, rise: 2 })), 'layer orbit + pedestal');
const ramp = M.speedRamp(M.trackPath({ points: W.road, ease: 'linear', dur: 8 }), [[0, 0], [0.2, 1], [0.45, 0.15], [0.6, 0.15], [0.8, 1], [1, 0]]);
smooth(ramp, 'speedRamp 1 -> 0.15 -> 1');
{ let mono = true, prev = -1; for (let t = 0; t <= 8; t += 0.01) { const w = ramp.warp(t); if (w < prev - 1e-9) mono = false; prev = w; } ok(mono && Math.abs(ramp.warp(8) - 8) < 1e-9, 'speedRamp warp monotone, spans the move'); }

console.log('== framing');
for (const thirds of ['left', 'right', 'center']) {
  const fr = M.frameSubject({ center: [3, 1, -4], size: [0.8, 1.8, 0.8] }, { thirds, headroom: 0.12, lens: 35, az: 25, el: 4, fill: 0.5 });
  const top = M.project(fr.state, [3, 1.9, -4]), mid = M.project(fr.state, [3, 1, -4]), bot = M.project(fr.state, [3, 0.1, -4]);
  const sx = { left: -1 / 3, right: 1 / 3, center: 0 }[thirds];
  ok(Math.abs(mid[0] - sx) < 0.01, `frameSubject ${thirds}: subject x ${mid[0].toFixed(3)} on ${sx.toFixed(3)}`);
  ok(Math.abs((1 - top[1]) / 2 - 0.12) < 0.02, `frameSubject ${thirds}: headroom ${((1 - top[1]) / 2).toFixed(3)} ~ 0.12`);
  ok(Math.abs((top[1] - bot[1]) / 2 - 0.5) < 0.04, `frameSubject ${thirds}: fill ${((top[1] - bot[1]) / 2).toFixed(3)} ~ 0.5`);
}

console.log('== determinism and follow lag');
{ const f = M.followChase({ subject: W.car, dur: 10 }); const ts = [7.3, 0.2, 5.5, 9.9, 0.2, 7.3]; const r = ts.map(t => f.at(t).pos.join());
  ok(r[0] === r[5] && r[1] === r[4], 'follow is pure in t (out-of-order evaluation identical)');
  const lin = (t) => [2 * t, 0, -5 * t], g = M.lagFilter(lin, 0.6), e = M.vec.len(M.vec.sub(g(3), lin(2.4)));
  ok(e < 1e-9, `closed-form lag: constant-velocity subject trails exactly 0.6 s (err ${e.toExponential(1)})`);
  const s1 = oner.at(9.3).pos.join(), _ = oner.at(2.1), s2 = oner.at(9.3).pos.join(); ok(s1 === s2, 'seq is pure in t'); }

console.log('== van Wijk endpoints');
{ const m = prims.mapFlyTo, s0 = m.start, s1 = m.end; ok(Math.abs(s0.look[0]) < 1e-6 && Math.abs(s1.look[0] - 3000) < 1e-6 && Math.abs(s1.look[2] - 1200) < 1e-6, 'mapFlyTo starts and lands on its targets'); }

console.log('== cost');
{ const N = 2000; let t0 = performance.now(); for (let i = 0; i < N; i++) prims.orbit.at(i / N * 7); const a = (performance.now() - t0) / N;
  t0 = performance.now(); for (let i = 0; i < N; i++) oner.at(i / N * oner.dur); const b = (performance.now() - t0) / N;
  console.log(`   orbit.at: ${(a * 1000).toFixed(1)} us/frame   3-segment follow oner.at: ${(b * 1000).toFixed(0)} us/frame`); }

if (process.argv.includes('--catalog')) {
  console.log('== catalog recipes');
  const cat = JSON.parse(fs.readFileSync(root + '/docs/shots/catalog.json', 'utf8'));
  const ids = new Set(); let built = 0;
  for (const s of cat.shots) {
    ok(!ids.has(s.id), `unique id ${s.id}`); ids.add(s.id);
    let m;
    try { m = new Function('M', 'W', `return (${s.recipe});`)(M, W); } catch (e) { ok(false, `${s.id} recipe throws: ${e.message}`); continue; }
    ok(M.isMove(m), `${s.id} returns a Move`); if (!M.isMove(m)) continue; built++;
    ok(m.dur >= s.duration[0] - 0.01 && m.dur <= s.duration[1] + 0.01, `${s.id} duration ${m.dur.toFixed(2)} within ${s.duration}`);
    smooth(m, `${s.id} ${s.name}`, { atRest: false, quiet: true });
    for (const k of ['pos', 'look']) ok(m.at(m.dur * 0.5)[k].every(Number.isFinite), `${s.id} finite ${k}`);
  }
  console.log(`   ${built}/${cat.shots.length} recipes built and passed checks unless listed above`);
}
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
