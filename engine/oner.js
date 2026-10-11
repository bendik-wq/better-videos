// ONER: one continuous camera move across world states and scales, deterministic in t.
//
//   import * as O from '/engine/oner.js';
//   const on = O.oner({
//     shot,                                   // optional: narration words key the times
//     cues: { exit: 13.2 },                   // cue name -> default time (s); a spoken word overrides it
//     segments: [                             // camera moves, each a pure function of t; overlaps blend
//       { from: 0, to: 7, cam: O.keys([{ t: 0, pos, look, mm }, { t: 7, pos, look, mm }], { logY: 0 }) },
//       { from: 6, to: 14, cam: O.follow(subject, { offset: [-7, 2.2, 0] }) },
//       { from: 'exit', to: 'exit+3', cam: ... },     // cue names, word names, '+/-' offsets
//     ],
//     tracks: { map: [[20, 0], [23, 1]], tod: [[0, 'blue']], exposure: [[0, 1.0], [26, 1.4]] },
//   });
//   on.camera(t, camera)   -> sets position (world-local, doubles), orientation, fov
//   on.state(t)            -> { map, flat, tod, exposure, ... } (eased keyframe tracks)
//   on.apply(t, camera, world) -> both, plus world.setState(...)
//
// Blending: where two segments overlap, position lerps, orientation slerps and the focal length
// blends in log space with a smootherstep weight (C2 at the ends), so a cut between move types
// never pops. Scale: keys can interpolate height in log space (logY) so a dive from 10 km to 5 m
// keeps a constant perceived speed; world.render() applies the floating origin and sets near/far
// and haze from the camera's altitude. Use on.trace() / O.smoothness() to prove there are no pops.
import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const mmToFov = (mm, aspect = 16 / 9) => 2 * Math.atan(36 / Math.max(aspect, 1) / 2 / mm) * 180 / Math.PI;
const V = (a) => (a?.isVector3 ? a.clone() : new THREE.Vector3(...a));

// ---------------------------------------------------------------- cue times
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
export function cueTime(spec, { shot = null, cues = {} } = {}) {
  if (typeof spec === 'number') return spec;
  const m = String(spec).match(/^([^+\-@]+)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) throw new Error(`[oner] bad cue "${spec}"`);
  const [, name, nth, off] = m;
  let t = null;
  const word = cues[name]?.word ?? name;
  const hits = (shot?.words ?? []).filter(x => norm(x.w).startsWith(norm(word)));
  if (hits.length) t = (hits[Number(nth ?? 0)] ?? hits.at(-1)).s;
  if (t === null) { const c = cues[name]; t = typeof c === 'number' ? c : c?.at; }
  if (t === null || t === undefined) throw new Error(`[oner] cue "${name}" not spoken and has no default time`);
  return t + Number(off ?? 0);
}

// ---------------------------------------------------------------- camera states
// A camera state: { pos: Vector3, quat: Quaternion, fov (deg) }. Helpers build it from look-at.
const _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
export function lookState(pos, look, { fov = 40, mm = null, roll = 0, up = null } = {}) {
  const p = V(pos), l = V(look);
  _m.lookAt(p, l, up ? V(up) : _up);
  const q = new THREE.Quaternion().setFromRotationMatrix(_m);
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  return { pos: p, quat: q, fov: mm ? mmToFov(mm) : fov };
}

// Time-keyed C1 spline: keys [{ t, pos, look, mm|fov, roll }]. Non-uniform Catmull-Rom tangents in
// time; start/end velocity zero unless vIn/vOut ('auto' = keep the end slope). logY: interpolate
// height above logY in log space (pos and look), for moves that change scale.
export function keys(K, { logY = null, vIn = 0, vOut = 0, ease = null, up = null } = {}) {
  const n = K.length, T = K.map(k => k.t);
  const enc = (y) => (logY === null ? y : Math.log(Math.max(y - logY, 1e-3)));
  const dec = (y) => (logY === null ? y : logY + Math.exp(y));
  const ch = K.map(k => [k.pos[0], enc(k.pos[1]), k.pos[2], k.look[0], enc(k.look[1]), k.look[2], Math.log(k.mm ?? (36 / 1.7778 / 2 / Math.tan((k.fov ?? 40) * Math.PI / 360))), k.roll ?? 0]);
  const D = ch[0].length;
  const tan = monotoneTangents(T, ch, { vIn, vOut });
  const at = (t) => {
    if (ease) t = T[0] + (T[n - 1] - T[0]) * ease(clamp((t - T[0]) / (T[n - 1] - T[0])));
    if (t <= T[0]) return ch[0]; if (t >= T[n - 1]) return ch[n - 1];
    let i = 0; while (i < n - 2 && t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], x = (t - T[i]) / h;
    const h00 = 2 * x ** 3 - 3 * x ** 2 + 1, h10 = x ** 3 - 2 * x ** 2 + x, h01 = -2 * x ** 3 + 3 * x ** 2, h11 = x ** 3 - x ** 2;
    return ch[i].map((v, d) => h00 * v + h10 * h * tan[i][d] + h01 * ch[i + 1][d] + h11 * h * tan[i + 1][d]);
  };
  return (t) => { const c = at(t); return lookState([c[0], dec(c[1]), c[2]], [c[3], dec(c[4]), c[5]], { mm: Math.exp(c[6]), roll: c[7], up }); };
}

// Per-channel tangents for time-keyed Hermite curves: weighted Catmull-Rom, limited per channel
// (Fritsch-Carlson) so a channel never overshoots its keys. A camera keyed to land 3 m above a car
// never dips underground on the way. vIn / vOut: 0 (rest) or 'auto' (keep the end slope).
export function monotoneTangents(T, ch, { vIn = 0, vOut = 0 } = {}) {
  const n = ch.length, D = ch[0].length;
  const sl = (i, d) => (ch[i + 1][d] - ch[i][d]) / (T[i + 1] - T[i]);
  return ch.map((c, i) => c.map((_, d) => {
    if (n < 2) return 0;
    if (i === 0) return vIn === 'auto' ? sl(0, d) : 0;
    if (i === n - 1) return vOut === 'auto' ? sl(n - 2, d) : 0;
    const a = sl(i - 1, d), b = sl(i, d);
    if (a * b <= 0) return 0;                                    // local extremum: flat tangent
    const h0 = T[i] - T[i - 1], h1 = T[i + 1] - T[i];
    let m = (a * h1 + b * h0) / (h0 + h1);
    const lim = 3 * Math.min(Math.abs(a), Math.abs(b)); if (Math.abs(m) > lim) m = Math.sign(m) * lim;
    return m;
  }));
}

// Pure-in-t smoothing of a vector function: weighted average over [t - span, t] (raised cosine).
function smoothed(fn, span, N = 24) {
  if (!span) return fn;
  const w = Array.from({ length: N + 1 }, (_, k) => 0.5 + 0.5 * Math.cos(Math.PI * k / N)); const W = w.reduce((a, b) => a + b, 0);
  return (t) => { const acc = new THREE.Vector3(); for (let k = 0; k <= N; k++) acc.addScaledVector(V(fn(t - span * k / N)), w[k] / W); return acc; };
}

// Chase / follow: subject(t) -> { pos, fwd } (world-local). offset [back(-)/front(+), up, right] in
// the subject's frame (heading smoothed over `lag` s, position over `posLag`); looks at the subject
// plus `lookAt` [ahead, up, right]. `float` adds a gentle handheld (metres).
export function follow(subject, { offset = [-7, 2.2, 0], lookAt = [6, 0.8, 0], lag = 0.6, posLag = 0.12, mm = 32, fov = null, float = 0, seed = 0, up = null } = {}) {
  const P = smoothed((t) => subject(t).pos, posLag);
  const F = smoothed((t) => subject(t).fwd, lag);
  const O = typeof offset === 'function' ? offset : () => offset, LA = typeof lookAt === 'function' ? lookAt : () => lookAt, MM = typeof mm === 'function' ? mm : () => mm;
  return (t) => {
    const p = P(t), f = F(t); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x), u = new THREE.Vector3(0, 1, 0);
    const o = O(t), la = LA(t);
    const pos = p.clone().addScaledVector(f, o[0]).addScaledVector(u, o[1]).addScaledVector(r, o[2]);
    if (float) { pos.x += float * (0.7 * Math.sin(t * 0.5 + seed) + 0.3 * Math.sin(t * 1.1 + 1.1 + seed)); pos.y += float * (0.7 * Math.sin(t * 0.4 + 3 + seed) + 0.3 * Math.sin(t * 0.9 + 4.2)); }
    const look = p.clone().addScaledVector(f, la[0]).addScaledVector(u, la[1]).addScaledVector(r, la[2]);
    return lookState(pos, look, { mm: fov ? null : MM(t), fov: fov ?? 40, up });
  };
}

// Attach: a keyed move expressed in a moving subject's frame (x = forward, y = up, z = right), e.g.
// a descent from 5 km onto a moving car that lands exactly on the chase offset. subject(t) ->
// { pos, fwd }; keyed = O.keys([...]) built from subject-frame positions/looks; heading smoothed.
export function attach(subject, keyed, { lag = 0.6 } = {}) {
  const P = (t) => V(subject(t).pos), Fw = smoothed((t) => subject(t).fwd, lag);
  return (t) => {
    const s = keyed(t), p = P(t), f = Fw(t); f.y = 0; f.normalize();
    const r = new THREE.Vector3(-f.z, 0, f.x), u = new THREE.Vector3(0, 1, 0);
    const basis = new THREE.Matrix4().makeBasis(f, u, r); // subject frame -> world
    const pos = s.pos.clone().applyMatrix4(basis).add(p);
    const q = new THREE.Quaternion().setFromRotationMatrix(basis).multiply(s.quat);
    return { pos, quat: q, fov: s.fov };
  };
}

// Geo move: hover over a focus point with altitude interpolated in log space (constant perceived
// speed from street to orbit). alt/tilt/heading: [from, to] over [t0, t1] with smootherstep;
// tilt 0 = straight down, 90 = horizontal; heading in degrees (0 = looking north).
// focus: [x, y, z] or t => [x, y, z]; frame (optional W.Frame) keeps "down" pointing at the earth's centre.
export function geo(focus, { t0, t1, alt = [1000, 1e6], tilt = [45, 0], heading = [0, 0], mm = [35, 35], ease = smoother, frame = null, lookShift = null } = {}) {
  const Fc = typeof focus === 'function' ? focus : () => focus;
  return (t) => {
    const k = ease(clamp((t - t0) / (t1 - t0)));
    const ev = (x, lg) => typeof x === 'function' ? x(t) : lg ? Math.exp(lerp(Math.log(x[0]), Math.log(x[1]), k)) : lerp(x[0], x[1], k);
    const a = ev(alt, true);
    const tl = ev(tilt) * Math.PI / 180, hd = ev(heading) * Math.PI / 180;
    const f = V(Fc(t));
    const up = frame ? f.clone().sub(frame.center).normalize() : new THREE.Vector3(0, 1, 0);
    // horizontal basis at the focus: north = -z projected
    const north = new THREE.Vector3(0, 0, -1).addScaledVector(up, -up.z * -1).normalize(), east = new THREE.Vector3().crossVectors(north, up).normalize();
    const dirH = north.clone().multiplyScalar(Math.cos(hd)).addScaledVector(east, Math.sin(hd));
    // camera sits at distance a along (-dirH*sin(tilt) + up*cos(tilt)) from the focus
    const off = up.clone().multiplyScalar(Math.cos(tl)).addScaledVector(dirH, -Math.sin(tl)).multiplyScalar(a);
    const pos = f.clone().add(off);
    let look = f; if (lookShift) look = f.clone().lerp(V(lookShift.to), lookShift.k ? lookShift.k(t) : 0);
    // up vector for lookAt: the heading direction (so straight-down views stay oriented north-up)
    // near straight-down the view's up vector blends to the heading so the frame stays north-up
    const upv = up.clone().lerp(dirH, smoother((Math.cos(tl) - 0.9) / 0.09)).normalize();
    return lookState(pos, look, { mm: ev(mm, true), up: upv });
  };
}

// Keyed scalar curve, C1 in time: [[t, v], ...] (non-uniform Catmull-Rom tangents; zero slope at the
// ends unless vIn / vOut = 'auto'). log: interpolate in log space (altitudes, focal lengths).
export function curve(K, { log = false, vIn = 0, vOut = 0 } = {}) {
  const T = K.map(k => k[0]), Y = K.map(k => (log ? Math.log(k[1]) : k[1])), n = K.length;
  const m = monotoneTangents(T, Y.map(y => [y]), { vIn, vOut }).map(v => v[0]);
  return (t) => {
    let y;
    if (n === 1 || t <= T[0]) y = Y[0]; else if (t >= T[n - 1]) y = Y[n - 1];
    else { let i = 0; while (i < n - 2 && t > T[i + 1]) i++; const h = T[i + 1] - T[i], x = (t - T[i]) / h;
      y = (2 * x ** 3 - 3 * x ** 2 + 1) * Y[i] + (x ** 3 - 2 * x ** 2 + x) * h * m[i] + (-2 * x ** 3 + 3 * x ** 2) * Y[i + 1] + (x ** 3 - x ** 2) * h * m[i + 1]; }
    return log ? Math.exp(y) : y;
  };
}

// Custom: fn(t) -> { pos, look, mm|fov, roll, up } or a state.
export const fn = (f) => (t) => { const s = f(t); return s.quat ? s : lookState(s.pos, s.look, s); };

// ---------------------------------------------------------------- tracks
// [[t, value], ...] eased with smootherstep between keys (values: numbers, arrays, or strings for
// TOD names, resolved by `mixers[name]`). Cue specs allowed for t.
function track(keysIn, resolve) {
  const K = keysIn.map(([t, v, e]) => [resolve(t), v, e]);
  return (t) => {
    if (t <= K[0][0]) return { a: K[0][1], b: K[0][1], k: 0 };
    if (t >= K.at(-1)[0]) return { a: K.at(-1)[1], b: K.at(-1)[1], k: 0 };
    let i = 0; while (t > K[i + 1][0]) i++;
    const [ta, va] = K[i], [tb, vb, e] = K[i + 1];
    const x = (t - ta) / (tb - ta);
    return { a: va, b: vb, k: e === 'linear' ? x : smoother(x) };
  };
}

// ---------------------------------------------------------------- the oner
export function oner({ shot = null, cues = {}, segments = [], tracks = {}, tod = null } = {}) {
  const T = (x) => cueTime(x, { shot, cues });
  const segs = segments.map(s => ({ ...s, a: T(s.from), b: T(s.to) })).sort((x, y) => x.a - y.a);
  const tr = Object.fromEntries(Object.entries(tracks).map(([k, v]) => [k, track(v, T)]));
  const cam = (t) => {
    // active segments and their weights: each segment ramps in over its overlap with the previous one
    const act = segs.filter(s => t >= s.a - 1e-9 && t <= s.b + 1e-9);
    if (!act.length) { const s = t < segs[0].a ? segs[0] : segs.filter(s => s.b <= t).at(-1) ?? segs.at(-1); return s.cam(clamp(t, s.a, s.b)); }
    let st = act[0].cam(t);
    for (let i = 1; i < act.length; i++) {
      const prev = act[i - 1], cur = act[i];
      const w = smoother((t - cur.a) / Math.max(1e-6, prev.b - cur.a));
      const s2 = cur.cam(t);
      st = { pos: st.pos.clone().lerp(s2.pos, w), quat: st.quat.clone().slerp(s2.quat, w), fov: Math.exp(lerp(Math.log(st.fov), Math.log(s2.fov), w)) };
    }
    return st;
  };
  const state = (t) => {
    const o = {};
    for (const [k, f] of Object.entries(tr)) {
      const { a, b, k: x } = f(t);
      if (typeof a === 'number') o[k] = lerp(a, b, x);
      else if (Array.isArray(a)) o[k] = a.map((v, i) => lerp(v, b[i], x));
      else o[k] = { a, b, k: x }; // e.g. TOD names: the caller mixes
    }
    return o;
  };
  const api = {
    segments: segs, T, cam, state,
    camera(t, camera) {
      const s = cam(t); camera.position.copy(s.pos); camera.quaternion.copy(s.quat);
      if (Math.abs(camera.fov - s.fov) > 1e-6) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(); return s;
    },
    // sample the camera path: [{ t, pos, quat, fov }] at fps
    trace(fps = 30, t0 = segs[0].a, t1 = segs.at(-1).b) { const out = []; for (let t = t0; t <= t1 + 1e-9; t += 1 / fps) { const s = cam(t); out.push({ t, pos: s.pos.toArray(), quat: s.quat.toArray(), fov: s.fov }); } return out; },
  };
  return api;
}

// Smoothness report over a trace: per-frame linear speed relative to altitude-ish scale, angular
// speed (deg/frame), and the worst frame-to-frame change of each (a pop is a spike in the change).
export function smoothness(trace, { scale = (p) => 1 } = {}) {
  const sp = [], an = [];
  for (let i = 1; i < trace.length; i++) {
    const a = trace[i - 1], b = trace[i];
    const d = Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]) / Math.max(1e-6, scale(a.pos));
    const qa = new THREE.Quaternion(...a.quat), qb = new THREE.Quaternion(...b.quat);
    sp.push(d); an.push(qa.angleTo(qb) * 180 / Math.PI + Math.abs(Math.log(b.fov / a.fov)) * 40);
  }
  const jump = (arr) => { let m = 0, at = 0; for (let i = 1; i < arr.length; i++) { const x = Math.abs(arr[i] - arr[i - 1]) / Math.max(1e-6, (arr[i] + arr[i - 1]) / 2 + 1e-3); if (x > m) { m = x; at = i; } } return { m, at }; };
  return { speed: sp, angular: an, worstSpeedChange: jump(sp), worstAngularChange: jump(an) };
}
