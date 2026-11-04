// camera.js: a composable, deterministic camera-move library on three.js r169 + engine/cine.js.
//
//   import * as M from '/engine/camera.js';
//   const move = M.seq([
//     M.descendFromSky({ ground: car(0), h0: 400, h1: 18, dur: 5, ease: 'in' }),
//     M.followChase({ subject: car, dur: 6 }),
//     M.pullBackToPlanet({ ground: car(11), center: planet.center, radius: planet.radius, h0: 12, h1: 60000, dur: 7, ease: 'out' }),
//   ], { overlap: 1.2 });
//   // in update(t): M.apply(camera, move.at(t), { fx });    or    const rig = M.rig(move); rig(camera, p, t)
//
// Model
//   A Move is { dur, at(t, tg) -> state }. t is the move's local time in seconds (clamped to
//   [0, dur]); tg is world time for live subjects (defaults to t). A state is
//   { pos:[x,y,z], look:[x,y,z], up:[x,y,z], roll (rad), mm (full-frame focal length), focus (m) }.
//   Every move is a pure function of time: no frame-to-frame state, no randomness, so chunks can
//   render out of order on any worker. Subjects are functions t -> [x,y,z] (or fixed points); they
//   must accept any t (negative, past the end).
//
// Smoothness contract (numerically tested by projects/shot-lab/test-camera.mjs)
//   - All easings are C2 (cosine-ramp velocity profiles or quintic smootherstep): velocity and
//     acceleration are continuous, and standalone moves start and end at rest.
//   - Paths through points are natural cubic splines (C2), never Catmull-Rom (only C1).
//   - seq() hands velocity from one move to the next by crossfading *velocities* (not positions)
//     with a C2 window, then glides any absolute mismatch out with a C2 correction. No pops.
//   - follow() lags with a closed-form FIR (gamma kernel), never a per-frame simulation.
//   - Handheld is low-frequency only (< 0.35 Hz), so it never judders at 24/30/60 fps.
import * as THREE from 'three';
import * as C from './cine.js';

// ============================================================================ math
const D2R = Math.PI / 180, PI = Math.PI;
const Y = [0, 1, 0];
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mad = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const flat = (a) => norm([a[0], 0, a[2]]);
// rotate v about unit axis k by angle a (Rodrigues)
const rot = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), kd = dot(k, v); return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)]; };
export const vec = { add, sub, mul, mad, lerp3, dot, cross, len, norm, flat, rot };

// quintic smootherstep: zero velocity and acceleration at both ends (C2)
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
const dsmoother = (x) => (x <= 0 || x >= 1 ? 0 : 30 * x * x * (x - 1) * (x - 1));
const win = (x, a, b) => smoother((x - a) / (b - a)); // 0 -> 1 between a and b

// Camera position from a subject: az 0 = camera on +z looking toward -z; el up from horizontal.
export const around = (c, d, az = 0, el = 0) => [c[0] + Math.sin(az * D2R) * Math.cos(el * D2R) * d, c[1] + Math.sin(el * D2R) * d, c[2] + Math.cos(az * D2R) * Math.cos(el * D2R) * d];
// yaw/pitch of a view direction (yaw 0 = looking toward -z, positive yaw turns left)
export const dirOf = (yaw, pitch = 0) => [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
export const yawPitch = (from, to) => { const v = sub(to, from); return [Math.atan2(-v[0], -v[2]), Math.atan2(v[1], Math.hypot(v[0], v[2]))]; };
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// lat/lon in degrees to a point on a sphere; matches three's SphereGeometry UVs with an
// equirectangular texture (u = (lon + 180) / 360, v = (90 - lat) / 180).
export const latLon = (lat, lon, center = [0, 0, 0], radius = 1) => { const a = lat * D2R, b = lon * D2R; return add(center, mul([Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)], radius)); };

// ============================================================================ easing
// Velocity profile with cosine ramps: up over `accel`, cruise, down over `decel` (fractions of the
// move). Velocity and its derivative are continuous everywhere, so position is C2. accel = 0 means
// the move enters at cruise speed (for flow hand-offs); decel = 0 leaves at cruise speed.
export function profile(accel = 0.4, decel = 0.4) {
  const a = clamp(accel, 0, 1), b = clamp(decel, 0, 1 - a), m = 1 - a - b, area = 1 - (a + b) / 2;
  const f = (p) => {
    p = clamp(p);
    if (p < a) return (p / 2 - a / (2 * PI) * Math.sin(PI * p / a)) / area;
    if (p <= a + m) return (a / 2 + (p - a)) / area;
    const q = p - a - m; return (a / 2 + m + q / 2 + b / (2 * PI) * Math.sin(PI * q / b)) / area;
  };
  f.accel = a; f.decel = b; return f;
}
export const EASE = {
  linear: (p) => clamp(p),
  inOut: profile(0.4, 0.4), // default: one ease in, one ease out
  gentle: profile(0.5, 0.5), // all ramp, no cruise: slow creeps and holds
  in: profile(0.5, 0), // starts at rest, leaves at speed (into a seq hand-off)
  out: profile(0, 0.5), // enters at speed, settles
  snap: profile(0.12, 0.6), // fast attack, long settle: snap zoom, whip landing
  whip: profile(0.45, 0.45),
  settle: profile(0.2, 0.65), // pull-backs and reveals that land
  smoother,
};
export function easing(e = 'inOut') {
  if (typeof e === 'function') return e;
  if (typeof e === 'string') { if (!EASE[e]) throw new Error(`[camera] unknown ease '${e}'`); return EASE[e]; }
  if (Array.isArray(e)) return profile(e[0], e[1]);
  return profile(e.accel ?? 0.4, e.decel ?? 0.4);
}

// ============================================================================ state <-> vector
// 12 channels: pos 3, look 3, up 3, roll, ln(mm), focus in dioptres (1/m). Blends happen here, so
// lens changes are perceptually even (log mm) and focus pulls are even in dioptres like a real lens.
const NCH = 12;
export function pack(s) {
  const v = new Float64Array(NCH), u = s.up ?? Y;
  v[0] = s.pos[0]; v[1] = s.pos[1]; v[2] = s.pos[2]; v[3] = s.look[0]; v[4] = s.look[1]; v[5] = s.look[2];
  v[6] = u[0]; v[7] = u[1]; v[8] = u[2]; v[9] = s.roll ?? 0; v[10] = Math.log(s.mm ?? 35);
  v[11] = 1 / Math.max(1e-3, s.focus ?? len(sub(s.look, s.pos)));
  return v;
}
export function unpack(v) {
  return { pos: [v[0], v[1], v[2]], look: [v[3], v[4], v[5]], up: norm([v[6], v[7], v[8]]), roll: v[9], mm: Math.exp(v[10]), focus: 1 / Math.max(1e-6, v[11]) };
}
const vadd = (a, b, k = 1) => { const o = new Float64Array(NCH); for (let i = 0; i < NCH; i++) o[i] = a[i] + b[i] * k; return o; };
const vlerp = (a, b, t) => { const o = new Float64Array(NCH); for (let i = 0; i < NCH; i++) o[i] = a[i] + (b[i] - a[i]) * t; return o; };

// ============================================================================ Move
export class Move {
  constructor(dur, fn, meta = {}) { this.dur = Math.max(1e-6, dur); this.fn = fn; this.meta = meta; }
  // state at local time t (clamped); tg = world time for live subjects
  at(t, tg = t) { const tc = clamp(t, 0, this.dur); return this.fn(tc, tg - t + tc); }
  vec(t, tg = t) { return pack(this.at(t, tg)); }
  get start() { return this.at(0); }
  get end() { return this.at(this.dur); }
}
export const isMove = (m) => m instanceof Move;
export const move = (dur, fn, meta) => new Move(dur, fn, meta);

// subject: function t -> [x,y,z] | [x,y,z] | THREE.Vector3 | Object3D (live world position)
const _v = new THREE.Vector3();
export function subject(s, offset = null) {
  let f;
  if (typeof s === 'function') f = (t) => { const r = s(t); return Array.isArray(r) ? r : r.pos ? r.pos : [r.x, r.y, r.z]; };
  else if (Array.isArray(s)) f = () => s;
  else if (s?.isObject3D) f = () => { s.getWorldPosition(_v); return [_v.x, _v.y, _v.z]; };
  else if (s?.isVector3) f = () => [s.x, s.y, s.z];
  else f = () => [0, 1, 0];
  return offset ? (t) => add(f(t), offset) : f;
}

// Low-frequency operator breathing: three incommensurate sines per axis, all < 0.35 Hz.
export function breath(t, amp = 0.02, seed = 0) {
  const n = (f, p) => Math.sin(t * f + p + seed * 13.7);
  return {
    x: amp * (0.6 * n(0.53, 0.0) + 0.3 * n(1.13, 1.1) + 0.1 * n(1.9, 2.3)),
    y: amp * (0.6 * n(0.41, 3.0) + 0.3 * n(0.97, 4.2) + 0.1 * n(1.7, 0.7)),
    r: amp * 0.004 * (n(0.31, 5.5) + 0.5 * n(0.83, 2.9)),
  };
}
function addBreath(s, tg, amp, seed) {
  if (!amp) return s;
  const h = breath(tg, amp, seed), f = norm(sub(s.look, s.pos)), r = norm(cross(f, s.up ?? Y)), u = cross(r, f);
  const d = add(mul(r, h.x), mul(u, h.y));
  return { ...s, pos: add(s.pos, d), look: add(s.look, mul(d, 0.85)), roll: (s.roll ?? 0) + h.r };
}

// lens-aware framing distance: an object `size` tall fills `fill` of frame height on `mm`
export const frameDistance = (size, mm, fill = 0.6) => C.frameDistance(size, mm, fill);
const distFor = (o, mm) => o.dist ?? frameDistance(o.size ?? 1.8, mm, o.fill ?? 0.6);

// Primitive factory: eases local time, evaluates the geometry, fills defaults, adds breathing.
function prim(name, o, defaults, geo) {
  o = { ...defaults, ...o };
  o.mm ??= 35; o.dur ??= 6; o._d = distFor(o, o.mm);
  const E = easing(o.ease), S = subject(o.subject ?? o.target ?? [0, 1, 0]);
  const m = new Move(o.dur, (t, tg) => {
    const s = geo(E(t / o.dur), tg, o, S, t);
    s.mm ??= o.mm; s.up ??= Y; s.roll ??= 0;
    return addBreath(s, tg, o.float, o.seed ?? 0);
  }, { name, opts: o });
  m.with = (more) => P[name]({ ...o, ...more });
  return m;
}

// ============================================================================ C2 paths
// Natural cubic spline through points, chord-length knots. C2 everywhere (Catmull-Rom is only C1).
export function spline(points) {
  const n = points.length, dim = points[0].length;
  if (n === 1) return { at: () => points[0].slice(), d1: () => new Array(dim).fill(0), d2: () => new Array(dim).fill(0), length: 0 };
  const k = [0]; for (let i = 1; i < n; i++) k.push(k[i - 1] + Math.max(1e-6, Math.hypot(...points[i].map((v, j) => v - points[i - 1][j]))));
  const L = k[n - 1]; const tk = k.map(x => x / L);
  const M = []; // second derivatives per dim (natural: 0 at the ends)
  for (let d = 0; d < dim; d++) {
    const y = points.map(p => p[d]), h = []; for (let i = 0; i < n - 1; i++) h.push(tk[i + 1] - tk[i]);
    const m = new Array(n).fill(0);
    if (n > 2) {
      const a = [], b = [], c = [], r = [];
      for (let i = 1; i < n - 1; i++) { a.push(h[i - 1]); b.push(2 * (h[i - 1] + h[i])); c.push(h[i]); r.push(6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1])); }
      for (let i = 1; i < r.length; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; r[i] -= w * r[i - 1]; }
      const s = new Array(r.length); s[r.length - 1] = r[r.length - 1] / b[r.length - 1];
      for (let i = r.length - 2; i >= 0; i--) s[i] = (r[i] - c[i] * s[i + 1]) / b[i];
      for (let i = 1; i < n - 1; i++) m[i] = s[i - 1];
    }
    M.push(m);
  }
  const seg = (u) => { let i = 0; while (i < n - 2 && u > tk[i + 1]) i++; return i; };
  const ev = (u, order) => {
    u = clamp(u); const i = seg(u), h = tk[i + 1] - tk[i], A = (tk[i + 1] - u) / h, B = (u - tk[i]) / h;
    return points[0].map((_, d) => {
      const y0 = points[i][d], y1 = points[i + 1][d], m0 = M[d][i], m1 = M[d][i + 1];
      if (order === 0) return A * y0 + B * y1 + ((A ** 3 - A) * m0 + (B ** 3 - B) * m1) * h * h / 6;
      if (order === 1) return (y1 - y0) / h - (3 * A * A - 1) * h / 6 * m0 + (3 * B * B - 1) * h / 6 * m1;
      return A * m0 + B * m1;
    });
  };
  // beyond [0, 1] the curve continues along its end tangent: natural ends have zero curvature, so
  // the extension is still C2 (aims can look past the end of a path without a kink)
  const at = (u) => { if (u < 0) return ev(0, 0).map((v, d) => v + ev(0, 1)[d] * u); if (u > 1) return ev(1, 0).map((v, d) => v + ev(1, 1)[d] * (u - 1)); return ev(u, 0); };
  // C2 aim direction: the chord to a point `a` ahead (a tangent from d1 would only be C1)
  const ahead = (u, a = 0.05) => { const p = at(u), q = at(u + a); return norm(sub(q, p)); };
  return { at, d1: (u) => ev(u, 1), d2: (u) => ev(u, 2), ahead, length: L, knots: tk };
}

// van Wijk & Nuij (2003) optimal zoom-and-pan: the camera zooms out, pans, zooms in, minimising
// perceived optical flow. Returns { S, at(s) -> [panDistance, width] } for s in [0, S].
export function zoomPath(u1, w0, w1, rho = 1.42) {
  const r2 = rho * rho;
  if (Math.abs(u1) < 1e-6 * Math.max(w0, w1)) {
    const k = Math.sign(w1 - w0) || 1, S = Math.abs(Math.log(w1 / w0)) / rho;
    return { S: S || 1e-6, at: (s) => [0, w0 * Math.exp(k * rho * s)] };
  }
  const b = (i) => { const w = i ? w1 : w0; return (w1 * w1 - w0 * w0 + (i ? -1 : 1) * r2 * r2 * u1 * u1) / (2 * w * r2 * u1); };
  const r = (i) => Math.log(-b(i) + Math.sqrt(b(i) * b(i) + 1));
  const r0 = r(0), r1 = r(1), S = (r1 - r0) / rho;
  return { S, at: (s) => [w0 / r2 * Math.cosh(r0) * Math.tanh(rho * s + r0) - w0 / r2 * Math.sinh(r0), w0 * Math.cosh(r0) / Math.cosh(rho * s + r0)] };
}

// Closed-form lag: a gamma (critically damped 2nd-order) FIR. Mean delay = lag seconds; a subject at
// constant velocity is followed exactly `lag` behind. Deterministic, pure in t, C-infinity smooth.
export function lagFilter(S, lag = 0.4, taps = 24) {
  if (!(lag > 0)) return S;
  const tau = lag / 2, span = 7 * tau, ss = [], ws = [];
  for (let k = 0; k < taps; k++) { const s = (k + 0.5) / taps * span; ss.push(s); ws.push(s * Math.exp(-s / tau)); }
  const sum = ws.reduce((a, b) => a + b, 0), mean = ss.reduce((a, s, k) => a + s * ws[k], 0) / sum;
  const sc = lag / mean; // rescale so the discrete kernel's mean is exactly `lag`
  const W = ws.map(w => w / sum), Sd = ss.map(s => s * sc);
  return (t) => { const o = [0, 0, 0]; for (let k = 0; k < taps; k++) { const p = S(t - Sd[k]); o[0] += W[k] * p[0]; o[1] += W[k] * p[1]; o[2] += W[k] * p[2]; } return o; };
}

// ============================================================================ primitives
// Common options: target|subject (point, fn t->point, Object3D), mm (lens), dur (s), ease,
// dist | size+fill (framing), az / el (deg), float (handheld amplitude, m), seed.
export const P = {};

// --- push and pull
P.dollyIn = (o) => prim('dollyIn', o, { mm: 40, push: 0.3, az: 0, el: 4 }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, lerp(o._d, o._d * (1 - o.push), u), o.az + (o.drift ?? 0) * u, o.el + (o.rise ?? 0) * u), look: c };
});
P.dollyOut = (o) => prim('dollyOut', o, { mm: 40, pull: 1.7, az: 0, el: 5, ease: 'settle' }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, lerp(o._d, o._d * o.pull, u), o.az + (o.drift ?? 0) * u, o.el + (o.rise ?? 0) * u), look: c };
});
// tension creep: 5-10 % over a long hold
P.creep = (o) => prim('creep', o, { mm: 50, push: 0.08, dur: 9, ease: 'gentle', az: 0, el: 3, float: 0.006 }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d * (1 - o.push * u), o.az, o.el), look: c };
});
P.pullBackReveal = (o) => prim('pullBackReveal', o, { mm: 35, pull: 3.2, az: 0, el: 6, rise: 12, ease: 'settle', dur: 7 }, (u, tg, o, S) => {
  const c = S(tg), d = o._d * Math.pow(o.pull, u); // exponential: even perceived speed
  return { pos: around(c, d, o.az + (o.drift ?? 0) * u, o.el + o.rise * u), look: add(c, [0, (o.lookRise ?? 0) * u, 0]) };
});
// dolly past the subject: it slides out of frame and the background takes over
P.pushPast = (o) => prim('pushPast', o, { mm: 32, side: 1.4, reach: 1.0, az: 0, el: 2, dur: 5 }, (u, tg, o, S) => {
  const c = S(tg), f = mul([Math.sin(o.az * D2R), 0, Math.cos(o.az * D2R)], -1), r = [Math.cos(o.az * D2R), 0, -Math.sin(o.az * D2R)];
  const pos = add(add(c, mul(r, o.side)), mul(f, lerp(-o._d, o._d * o.reach, u)));
  pos[1] = c[1] + Math.sin(o.el * D2R) * o._d;
  return { pos, look: add(pos, add(mul(f, 30), [0, -Math.sin(o.el * D2R) * 3, 0])) };
});

// --- lateral and vertical
P.truck = (o) => prim('truck', o, { mm: 35, az: 0, el: 3, parallel: 1, dur: 6 }, (u, tg, o, S) => {
  const c = S(tg), w = (o.track ?? 0.3 * o._d) / 2, side = [Math.cos(o.az * D2R), 0, -Math.sin(o.az * D2R)], k = lerp(-w, w, u) * (o.dir ?? 1);
  return { pos: mad(around(c, o._d, o.az, o.el), side, k), look: mad(c, side, k * o.parallel) };
});
// camera slides, aim stays locked on the subject: foreground and background separate (parallax)
P.parallaxSlide = (o) => prim('parallaxSlide', o, { mm: 40, az: 0, el: 3, dur: 6 }, (u, tg, o, S) => {
  const c = S(tg), w = (o.track ?? 0.45 * o._d) / 2, side = [Math.cos(o.az * D2R), 0, -Math.sin(o.az * D2R)];
  return { pos: mad(around(c, o._d, o.az, o.el), side, lerp(-w, w, u) * (o.dir ?? 1)), look: c };
});
P.wipeReveal = (o) => P.truck({ track: 0.9 * distFor(o, o?.mm ?? 32), parallel: 0.35, mm: 32, ease: 'inOut', ...o });
P.macroSlide = (o) => prim('macroSlide', o, { mm: 100, size: 0.25, fill: 0.7, az: 0, el: 20, dur: 6, ease: 'gentle' }, (u, tg, o, S) => {
  const c = S(tg), w = (o.track ?? 0.5 * o._d) / 2, side = [Math.cos(o.az * D2R), 0, -Math.sin(o.az * D2R)], k = lerp(-w, w, u) * (o.dir ?? 1);
  return { pos: mad(around(c, o._d, o.az, o.el), side, k), look: mad(c, side, k), focus: o._d };
});
P.pedestal = (o) => prim('pedestal', o, { mm: 35, az: 0, el: 0, rise: 1.2, dur: 5 }, (u, tg, o, S) => {
  const c = S(tg), dy = lerp(0, o.rise, u) - (o.center ? o.rise / 2 : 0);
  return { pos: add(around(c, o._d, o.az, o.el), [0, dy, 0]), look: add(c, [0, dy, 0]) };
});
// camera rises and pulls back a touch; the aim stays on the subject (tilts down as it rises)
P.craneUp = (o) => prim('craneUp', o, { mm: 30, az: 0, el: 2, rise: null, back: 0.15, dur: 6 }, (u, tg, o, S) => {
  const c = S(tg), rise = o.rise ?? 0.8 * o._d, p = around(c, o._d * (1 + o.back * u), o.az, o.el);
  return { pos: add(p, [0, rise * u, 0]), look: add(c, [0, (o.lookRise ?? 0) * u, 0]) };
});
P.craneDown = (o) => prim('craneDown', o, { mm: 30, az: 0, el: 2, rise: null, back: 0.15, dur: 6 }, (u, tg, o, S) => {
  const c = S(tg), rise = o.rise ?? 0.8 * o._d, k = 1 - u, p = around(c, o._d * (1 + o.back * k), o.az, o.el);
  return { pos: add(p, [0, rise * k, 0]), look: c };
});
// jib arm swinging in elevation around the subject at a fixed reach (with a little azimuth)
P.jibArc = (o) => prim('jibArc', o, { mm: 30, az: -10, swing: 20, el0: 38, el1: 6, dur: 6 }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d, o.az + o.swing * u, lerp(o.el0, o.el1, u)), look: c };
});
// pedestal up while the aim tilts from the foreground to the horizon: the classic establishing rise
P.craneReveal = (o) => prim('craneReveal', o, { mm: 28, az: 0, rise: 12, dur: 7, ease: 'settle' }, (u, tg, o, S) => {
  const c = S(tg), p0 = around(c, o._d, o.az, 0), fw = flat(sub(c, p0));
  const pos = add(p0, [0, 1.2 + o.rise * u, 0]), near = add(add(p0, mul(fw, 6)), [0, -1.0, 0]), far = add(c, [0, o.rise * 0.25, 0]);
  return { pos, look: lerp3(near, far, smoother(u * 1.15)) };
});

// --- arcs
P.orbit = (o) => prim('orbit', o, { mm: 40, az: -20, arc: 40, el: 8, dur: 7 }, (u, tg, o, S) => {
  const c = S(tg), el = lerp(o.el0 ?? o.el, o.el1 ?? o.el, u), d = lerp(o._d * (o.d0 ?? 1), o._d * (o.d1 ?? 1), u);
  return { pos: around(c, d, o.az + o.arc * (o.dir ?? 1) * u, el), look: add(c, [0, o.lookY ?? 0, 0]) };
});
P.arcPush = (o) => P.orbit({ arc: 30, d0: 1.15, d1: 0.9, el0: 9, el1: 5, mm: 50, ease: 'settle', ...o });
P.halfOrbitReveal = (o) => P.orbit({ arc: 180, az: -180, d0: 1.3, d1: 0.95, el0: 22, el1: 6, mm: 35, dur: 9, ease: 'inOut', ...o });
P.spiralDescent = (o) => prim('spiralDescent', o, { mm: 30, az: 0, arc: 270, h0: 40, h1: 2, r0: 30, r1: 8, dur: 10 }, (u, tg, o, S) => {
  const c = S(tg), a = (o.az + o.arc * (o.dir ?? 1) * u) * D2R, r = lerp(o.r0, o.r1, u), h = o.h0 * Math.pow(o.h1 / o.h0, u);
  return { pos: [c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], look: c };
});
P.helixRise = (o) => prim('helixRise', o, { mm: 28, az: 0, arc: 160, h0: 1.5, h1: 30, r0: 10, r1: 26, dur: 9, ease: 'settle' }, (u, tg, o, S) => {
  const c = S(tg), a = (o.az + o.arc * (o.dir ?? 1) * u) * D2R, r = lerp(o.r0, o.r1, u), h = lerp(o.h0, o.h1, u);
  return { pos: [c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], look: add(c, [0, (o.lookY ?? 0) * (1 - u), 0]) };
});

// --- god's eye
// straight down, rotating about the vertical; `up` carries the heading so nothing flips
P.godRotate = (o) => prim('godRotate', o, { mm: 35, h0: 40, h1: 34, yaw: 0, spin: 25, dur: 8, ease: 'gentle' }, (u, tg, o, S) => {
  const c = S(tg), h = o.h0 * Math.pow(o.h1 / o.h0, u), yaw = (o.yaw + o.spin * u) * D2R;
  return { pos: add(c, [0, h, 0]), look: c, up: dirOf(yaw) };
});
P.topDownPush = (o) => P.godRotate({ h0: 60, h1: 18, spin: 0, ease: 'settle', ...o });
// overhead looking down -> eye level looking at the subject (tilt down to the world)
P.overheadToEye = (o) => prim('overheadToEye', o, { mm: 30, az: 0, h0: 30, eye: 1.6, dur: 7, ease: 'inOut' }, (u, tg, o, S) => {
  const c = S(tg), head = flat(mul([Math.sin(o.az * D2R), 0, Math.cos(o.az * D2R)], -1)), k = smoother(u);
  const base = around(c, lerp(o._d * 0.25, o._d, u), o.az, 0);
  const pos = [base[0], lerp(c[1] + o.h0, (o.ground ?? 0) + o.eye, k), base[2]];
  const look = lerp3(c, add(c, [0, o.lookY ?? 0, 0]), k);
  return { pos, look, up: norm(lerp3(head, Y, k)) };
});

// --- angles and lens
P.dutchDrift = (o) => prim('dutchDrift', o, { mm: 35, az: 0, el: 3, roll: 9, push: 0.1, dur: 7, ease: 'gentle' }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d * (1 - o.push * u), o.az, o.el), look: c, roll: (o.roll0 ?? 0) * D2R + (o.roll - (o.roll0 ?? 0)) * D2R * u };
});
// vertigo: the camera travels while the lens compensates, so the subject holds its size and the
// background stretches. mm(u) = mm0 * d(u) / d0.
P.dollyZoom = (o) => prim('dollyZoom', o, { mm: 50, ratio: 0.5, az: 0, el: 2, dur: 4, ease: 'gentle' }, (u, tg, o, S) => {
  const c = S(tg), d = lerp(o._d, o._d * o.ratio, u);
  return { pos: around(c, d, o.az, o.el), look: c, mm: o.mm * d / o._d };
});
P.snapZoom = (o) => prim('snapZoom', o, { mm: 30, mm1: 85, az: 0, el: 3, dur: 0.7, ease: 'snap' }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d, o.az, o.el), look: c, mm: Math.exp(lerp(Math.log(o.mm), Math.log(o.mm1), u)) };
});
P.zoomCreep = (o) => prim('zoomCreep', o, { mm: 50, mm1: 65, az: 0, el: 3, dur: 9, ease: 'gentle' }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d, o.az, o.el), look: c, mm: Math.exp(lerp(Math.log(o.mm), Math.log(o.mm1), u)) };
});
// rack focus inside a near-static frame: focus pulls from `near` to `far` (metres, eased in dioptres)
P.rackHold = (o) => prim('rackHold', o, { mm: 50, az: 0, el: 3, near: 1.2, far: null, at: 0.35, over: 0.3, dur: 6, ease: 'linear', drift: 0.02 }, (u, tg, o, S) => {
  const c = S(tg), pos = around(c, o._d * (1 - o.drift * smoother(u)), o.az, o.el), far = o.far ?? o._d;
  const k = win(u, o.at, o.at + o.over); return { pos, look: c, focus: 1 / lerp(1 / o.near, 1 / far, k) };
});

// --- rotation from a fixed point
const aimMove = (name, o, defaults, yawFn) => prim(name, o, defaults, (u, tg, o, S, t) => {
  const pos = o.pos ?? around(S(tg), o._d, o.az ?? 0, o.el ?? 0);
  const [yaw, pitch, dist] = yawFn(u, pos, tg, o);
  return { pos, look: add(pos, mul(dirOf(yaw, pitch), dist)) };
});
const aimOf = (pos, x, tg) => { const p = subject(x)(tg); const [y, pi] = yawPitch(pos, p); return [y, pi, len(sub(p, pos))]; };
// whip pan: a fast eased swing between two aims (from/to points, or yaw0/yaw1 in degrees)
const swing = (u, pos, tg, o) => {
  const a = o.from ? aimOf(pos, o.from, tg) : [o.yaw0 * D2R, (o.pitch0 ?? 0) * D2R, 20];
  const b = o.to ? aimOf(pos, o.to, tg) : [o.yaw1 * D2R, (o.pitch1 ?? o.pitch0 ?? 0) * D2R, 20];
  const dy = o.turns ? (b[0] - a[0]) : wrapPi(b[0] - a[0]);
  return [a[0] + dy * u, lerp(a[1], b[1], u), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), u))];
};
P.whipPan = (o) => aimMove('whipPan', o, { mm: 35, yaw0: 0, yaw1: -100, dur: 0.55, ease: 'whip' }, swing);
P.pan = (o) => aimMove('pan', o, { mm: 35, yaw0: 20, yaw1: -20, dur: 7, ease: 'gentle' }, swing);
P.tiltUp = (o) => aimMove('tiltUp', o, { mm: 28, yaw0: 0, pitch0: -10, pitch1: 35, dur: 6, ease: 'inOut' }, (u, pos, tg, o) => {
  if (o.from || o.to) return swing(u, pos, tg, o);
  return [o.yaw0 * D2R, lerp(o.pitch0, o.pitch1, u) * D2R, 20];
});
// look-at shift: the frame re-aims from subject A to subject B (a motivated pan + focus pull)
P.lookAtShift = (o) => prim('lookAtShift', o, { mm: 40, dur: 4, ease: 'inOut' }, (u, tg, o, S) => {
  const pos = o.pos ?? [0, 1.6, 8];
  const [y, p, d] = swing(u, pos, tg, { from: o.from ?? o.a, to: o.to ?? o.b });
  return { pos, look: add(pos, mul(dirOf(y, p), d)), focus: d };
});

// --- holds
P.lockOff = (o) => prim('lockOff', o, { mm: 40, az: 0, el: 3, drift: 0.012, dur: 6, ease: 'linear', float: 0.004 }, (u, tg, o, S) => {
  const c = S(tg), side = [Math.cos(o.az * D2R), 0, -Math.sin(o.az * D2R)];
  const k = smoother(u) - 0.5; // eased micro drift so it starts and ends at rest
  return { pos: mad(around(c, o._d * (1 - o.drift * 0.5 * (k + 0.5)), o.az, o.el), side, k * o.drift * o._d), look: c };
});
P.handheld = (o) => prim('handheld', o, { mm: 35, az: 0, el: 2, dur: 6, ease: 'linear', float: 0.035 }, (u, tg, o, S) => {
  const c = S(tg); return { pos: around(c, o._d, o.az, o.el), look: c };
});
export const hold = (state, dur = 3, o = {}) => prim('hold', { ...o, dur }, { ease: 'linear' }, () => ({ ...state }));

// --- heroic
P.heroRise = (o) => prim('heroRise', o, { mm: 24, az: 0, height: 1.8, dur: 6, size: 2.2, fill: 0.75, ease: 'settle' }, (u, tg, o, S) => {
  const c = S(tg), H = o.height, p = around(c, lerp(o._d * 1.1, o._d * 0.85, u), o.az, 0);
  return { pos: [p[0], c[1] + lerp(0.15, H * 0.42, u), p[2]], look: add(c, [0, H * lerp(0.6, 0.72, u), 0]) };
});

// --- through and over
// push through a plane (window, glass, screen, page): approach, cross the plane, keep going.
// through: point on the plane; normal: unit normal toward the start side; target: look beyond.
P.pushThrough = (o) => prim('pushThrough', o, { mm: 35, mm1: null, before: 6, after: 3, dur: 5, ease: [0.35, 0.3] }, (u, tg, o) => {
  const n = norm(o.normal ?? [0, 0, 1]), p0 = o.through ?? [0, 1.5, 0], target = o.target ? subject(o.target)(tg) : mad(p0, n, -50);
  const pos = mad(p0, n, lerp(o.before, -o.after, u)), mm = o.mm1 ? Math.exp(lerp(Math.log(o.mm), Math.log(o.mm1), u)) : o.mm;
  return { pos, look: lerp3(mad(p0, n, -o.after - 4), target, smoother(u)), mm };
});
// skim toward the subject, pass over it, keep travelling; the aim lets it go under the camera
P.flyover = (o) => prim('flyover', o, { mm: 28, dir: [0, 0, -1], h0: 4, h1: 14, reach: 30, dur: 7, ease: 'inOut' }, (u, tg, o, S) => {
  const c = S(tg), f = flat(o.dir), sp = spline([mad(add(c, [0, o.h0, 0]), f, -o.reach), add(c, [0, o.h1, 0]), add(mad(c, f, o.reach), [0, o.h1 * 1.3, 0])]);
  const pos = sp.at(u), ahead = add(mad(c, f, o.reach * 3), [0, o.h1 * 0.4, 0]);
  return { pos, look: lerp3(c, ahead, win(u, 0.3, 0.85)), up: norm(add(f, Y)) };
});
// thread a gap (between buildings, under a bridge): level through the gap, rise on the far side
P.flyThrough = (o) => prim('flyThrough', o, { mm: 24, dir: [0, 0, -1], before: 30, after: 30, rise: 6, dur: 6, ease: 'inOut' }, (u, tg, o) => {
  const g = o.gap ?? [0, 3, 0], f = flat(o.dir), sp = spline([mad(add(g, [0, 1.5, 0]), f, -o.before), g, add(mad(g, f, o.after), [0, o.rise, 0])]);
  const pos = sp.at(u); return { pos, look: mad(pos, sp.ahead(u, 0.12), 20) };
});
// a path through points, aimed ahead along the tangent (or at a target)
P.trackPath = (o) => prim('trackPath', o, { mm: 30, dur: 8, ease: 'inOut', ahead: 0.06, lookDist: 15, lookY: 0 }, (u, tg, o) => {
  o._sp ??= spline(o.points); const pos = o._sp.at(u);
  if (o.target || o.subject) return { pos, look: subject(o.target ?? o.subject)(tg) };
  return { pos, look: add(mad(pos, o._sp.ahead(u, o.ahead), o.lookDist), [0, o.lookY, 0]) };
});

// --- FPV: low, fast, banked into turns (roll from lateral curvature, smoothed so roll is C2)
// coordinated-turn bank: roll = atan(v * yawRate / g), from the chord heading (C2), soft-limited
const bankRoll = (sp, u, dur, max, scale = 1) => {
  const hd = (x) => { const d = sp.ahead(x - 0.03, 0.06); return Math.atan2(d[0], d[2]); }, b = 0.045, v = sp.length / dur;
  const raw = (x) => max * Math.tanh(Math.atan(v * wrapPi(hd(x + b) - hd(x - b)) / (2 * b) / dur / 9.81) * scale / max);
  // a pilot rolls in and out over ~half a second: Gaussian FIR over the path (pure in u)
  let acc = 0, ws = 0; for (let k = -6; k <= 6; k++) { const w = Math.exp(-k * k / 12); acc += w * raw(u + k * 0.012); ws += w; }
  return acc / ws;
};
P.fpvWeave = (o) => prim('fpvWeave', o, { mm: 16, dur: 10, ease: [0.25, 0.25], bank: 0.6, maxRoll: 0.4, ahead: 0.06, pitch: -6 }, (u, tg, o) => {
  o._sp ??= spline(o.points); const pos = o._sp.at(u), tan = o._sp.ahead(u, o.ahead);
  const look = mad(pos, norm(add(tan, [0, Math.sin(o.pitch * D2R), 0])), 10);
  return { pos, look, roll: bankRoll(o._sp, u, o.dur, o.maxRoll, o.bank) };
});
// FPV dive: crest an edge, nose over, fall down the face, pull out low into forward flight
P.fpvDive = (o) => prim('fpvDive', o, { mm: 16, dir: [0, 0, -1], height: 30, dur: 6, ease: [0.3, 0.2] }, (u, tg, o) => {
  const e = o.edge ?? [0, 30, 0], f = flat(o.dir), H = o.height, b = sub(e, [0, H, 0]);
  o._sp ??= spline([add(mad(e, f, -10), [0, 3, 0]), add(mad(e, f, 2.5), [0, 0.5, 0]), add(mad(b, f, 4), [0, H * 0.45, 0]), add(mad(b, f, 9), [0, 3, 0]), add(mad(b, f, 34), [0, 2.5, 0])]);
  const pos = o._sp.at(u); return { pos, look: mad(pos, o._sp.ahead(u, 0.06), 10), up: norm(add(f, Y)) };
});
// drone rises over a ridge (or roofline) and tilts down onto the vista behind it
P.droneRidgeReveal = (o) => prim('droneRidgeReveal', o, { mm: 24, dir: [0, 0, -1], back: 25, low: 6, clear: 8, ahead: 35, dur: 8, ease: 'inOut' }, (u, tg, o) => {
  const cr = o.crest ?? [0, 10, 0], f = flat(o.dir), vista = o.vista ? subject(o.vista)(tg) : add(mad(cr, f, 200), [0, -cr[1], 0]);
  o._sp ??= spline([add(mad(cr, f, -o.back), [0, -o.low, 0]), add(mad(cr, f, -o.back * 0.35), [0, o.clear * 0.6, 0]), add(mad(cr, f, o.ahead * 0.3), [0, o.clear, 0]), add(mad(cr, f, o.ahead), [0, o.clear * 1.25, 0])]);
  const pos = o._sp.at(u), skyAim = add(mad(cr, f, 40), [0, 6, 0]);
  return { pos, look: lerp3(skyAim, vista, win(u, 0.25, 0.9)), up: norm(add(f, mul(Y, 2))) };
});

// --- scale: sky <-> ground <-> planet (log-height, so perceived speed is even across 6 decades)
function heightMove(name, o, defaults, hFn) {
  return prim(name, o, defaults, (u, tg, o) => {
    const g = o.ground ? subject(o.ground)(tg) : [0, 0, 0], n = o.center ? norm(sub(g, o.center)) : Y, R = o.radius ?? 6.4e6;
    let head = o.heading ?? [0, 0, -1]; head = norm(sub(head, mul(n, dot(head, n))));
    const h = hFn(u, o), up = rot(head, n, (o.spin ?? 0) * D2R * u);
    const toCenter = o.center ? smoother((Math.log(h) - Math.log(R * 0.03)) / (Math.log(R * 0.8) - Math.log(R * 0.03))) : 0;
    const tilt = o.tilt ? mad(g, head, Math.tan(o.tilt * D2R) * h) : g; // aim ahead of nadir by `tilt` degrees
    let look = o.center ? lerp3(tilt, o.center, toCenter) : tilt, upv = up;
    if (o.lookEnd) { const k = win(u, o.landAt ?? 0.62, 1); look = lerp3(look, subject(o.lookEnd)(tg), k); upv = norm(lerp3(up, n, k)); }
    return { pos: mad(g, n, h), look, up: upv };
  });
}
P.pullBackToPlanet = (o) => heightMove('pullBackToPlanet', o, { mm: 35, h0: 3, h1: 2e7, dur: 9, ease: 'inOut' }, (u, o) => o.h0 * Math.pow(o.h1 / o.h0, u));
P.descendFromSky = (o) => heightMove('descendFromSky', o, { mm: 35, h0: 800, h1: 6, dur: 7, ease: 'inOut' }, (u, o) => o.h0 * Math.pow(o.h1 / o.h0, u));

// --- maps and globes (van Wijk optimal zoom/pan)
// A flat map in the y = mapY plane. from/to: { at: [x, z] | [x, y, z], width } (visible ground width).
P.mapFlyTo = (o) => prim('mapFlyTo', o, { mm: 35, tilt: 0, rho: 1.42, mapY: 0, dur: 6, ease: 'inOut' }, (u, tg, o) => {
  const xz = (p) => (p.length === 3 ? [p[0], p[2]] : p), a = xz(o.from.at), b = xz(o.to.at);
  const dx = b[0] - a[0], dz = b[1] - a[1], D = Math.hypot(dx, dz);
  o._zp ??= zoomPath(D, o.from.width, o.to.width, o.rho);
  const [s, w] = o._zp.at(u * o._zp.S), k = D > 1e-9 ? s / D : 0, c = [a[0] + dx * k, o.mapY, a[1] + dz * k];
  const head = o.heading ? flat(o.heading) : D > 1e-9 ? [dx / D, 0, dz / D] : [0, 0, -1];
  const hf = 2 * Math.tan(C.mmToFov(o.mm) * D2R / 2) * 16 / 9, dist = w / hf, tl = o.tilt * D2R;
  const pos = add(c, add(mul(Y, Math.cos(tl) * dist), mul(head, -Math.sin(tl) * dist)));
  return { pos, look: c, up: norm(add(head, mul(Y, Math.sin(tl)))) };
});
// Great-circle flight over a globe: from/to { lat, lon, alt } (alt above the surface).
P.globeFly = (o) => prim('globeFly', o, { mm: 35, rho: 1.42, tilt: 0, dur: 7, ease: 'inOut' }, (u, tg, o) => {
  const c = o.center ?? [0, 0, 0], R = o.radius ?? 1;
  const A = norm(sub(latLon(o.from.lat, o.from.lon, c, R), c)), B = norm(sub(latLon(o.to.lat, o.to.lon, c, R), c));
  const ang = Math.acos(clamp(dot(A, B), -1, 1)), axis = ang > 1e-6 ? norm(cross(A, B)) : norm(cross(A, Math.abs(A[1]) < 0.9 ? Y : [1, 0, 0]));
  o._zp ??= zoomPath(ang * R, o.from.alt ?? R * 0.5, o.to.alt ?? R * 0.5, o.rho);
  const [s, alt] = o._zp.at(u * o._zp.S), phi = ang > 1e-6 ? s / R : 0;
  const n = rot(A, axis, phi), head = norm(cross(axis, n)), surf = mad(c, n, R), tl = (o.tilt ?? 0) * D2R;
  const pos = add(mad(surf, n, alt * Math.cos(tl)), mul(head, -alt * Math.sin(tl)));
  return { pos, look: surf, up: norm(add(head, mul(n, Math.sin(tl)))) };
});

// --- follow (closed-form lag, lead room, subject-local offsets)
// offset is [right, up, back] in the subject's heading frame (frame: 'local', default) or a world
// vector (frame: 'world'). lag: seconds the camera trails; lookahead: seconds the aim leads.
export function follow(subjectFn, o = {}) {
  o = { offset: [0, 1.6, 6], frame: 'local', lag: 0.35, lookahead: 0.4, lookHeight: 0.8, mm: 35, dur: 6, minSpeed: 0.15, dir0: [0, 0, -1], ...o };
  const S = subject(subjectFn), F = lagFilter(S, o.lag), FL = lagFilter(S, o.lag * 0.6);
  const hd = o.heading ?? subjectFn?.heading, HD = hd && o.lag > 0 ? lagFilter((t) => hd(t), o.lag) : hd;
  const head = (t) => { if (HD) return flat(HD(t)); const a = F(t - 0.25), b = F(t + 0.25), v = [b[0] - a[0], 0, b[2] - a[2]];
    return norm(mad(v, o.dir0, o.minSpeed * 0.5)); };
  const m = new Move(o.dur, (t, tg) => {
    const p = F(tg), f = o.frame === 'local' ? head(tg) : o.dir0, r = norm(cross(f, Y));
    const off = o.frame === 'local' ? add(add(mul(r, o.offset[0]), mul(Y, o.offset[1])), mul(f, -o.offset[2])) : o.offset;
    const look = add(FL(tg + o.lookahead), [0, o.lookHeight, 0]);
    const top = Math.abs(off[1]) > 3 * Math.hypot(off[0], off[2]); // overhead follow: carry heading in `up`
    const s = { pos: add(p, off), look, up: top ? f : Y, roll: (o.roll ?? 0) * D2R, mm: o.mm };
    return addBreath(s, tg, o.float ?? 0, o.seed ?? 0);
  }, { name: 'follow', opts: o });
  m.with = (more) => follow(subjectFn, { ...o, ...more });
  return m;
}
P.followChase = (o) => follow(o.subject, { offset: [0, 1.7, 7], lag: 0.35, lookahead: 0.5, lookHeight: 0.6, mm: 35, ...o });
P.followSide = (o) => follow(o.subject, { offset: [6, 1.1, 0], lag: 0.2, lookahead: 0.25, lookHeight: 0.6, mm: 50, ...o });
P.followLead = (o) => follow(o.subject, { offset: [0.4, 1.4, -7], lag: 0.25, lookahead: 0, lookHeight: 0.8, mm: 40, ...o });
P.followTop = (o) => follow(o.subject, { offset: [0, 28, 0.001], lag: 0.3, lookahead: 0.2, lookHeight: 0, mm: 35, ...o });
P.follow = (o) => follow(o.subject, o);

// expose every primitive at the top level too: M.orbit({...}) === M.P.orbit({...})
export const {
  dollyIn, dollyOut, creep, pullBackReveal, pushPast, truck, parallaxSlide, wipeReveal, macroSlide, pedestal, craneUp, craneDown,
  jibArc, craneReveal, orbit, arcPush, halfOrbitReveal, spiralDescent, helixRise, godRotate, topDownPush, overheadToEye,
  dutchDrift, dollyZoom, snapZoom, zoomCreep, rackHold, whipPan, pan, tiltUp, lookAtShift, lockOff, handheld, heroRise,
  pushThrough, flyover, flyThrough, trackPath, fpvWeave, fpvDive, droneRidgeReveal, pullBackToPlanet, descendFromSky,
  mapFlyTo, globeFly, followChase, followSide, followLead, followTop,
} = P;

// ============================================================================ composition
// Gauss-Legendre nodes and weights (n = 24), computed once by Newton iteration on P_n
const GL = (() => { const n = 24, out = [];
  for (let i = 1; i <= n; i++) { let x = Math.cos(PI * (i - 0.25) / (n + 0.5)), dp = 0;
    for (let it = 0; it < 100; it++) { let p0 = 1, p1 = x; for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (x * p1 - p0) / (x * x - 1); const dx = p1 / dp; x -= dx; if (Math.abs(dx) < 1e-15) break; }
    out.push([x, 2 / ((1 - x * x) * dp * dp)]); }
  return out; })();
// integral over [a, b] of w(s) * f(s) (f returns a channel vector), 24-point Gauss-Legendre
function quad(a, b, w, f) {
  const o = new Float64Array(NCH); if (b <= a) return o; const h = (b - a) / 2, c = (a + b) / 2;
  for (const [x, wt] of GL) { const s = c + h * x, k = wt * h * w(s); if (k === 0) continue; const v = f(s); for (let i = 0; i < NCH; i++) o[i] += k * v[i]; }
  return o;
}

/**
 * seq([...segments], { overlap, settle }) chains moves into one continuous move.
 * Segments: a Move, a function (prevEndState) => Move (to start where the last one ended), or
 * { move, overlap, settle, anchor }.
 * Hand-off: across each overlap window the camera's *velocity* crossfades from the outgoing move to
 * the incoming one with a C2 window (velocities, not positions, are blended, so there is no rubber-
 * band pull between two far-apart points). Then any absolute difference between where the camera is
 * and where the incoming move expects it is glided out over `settle` seconds with a C2 curve, so
 * each move still lands exactly on its own framing. The result is C2 if every segment is.
 *   overlap: seconds (number | per-boundary array | 'auto' = min(0.9 s, 30 % of the shorter move))
 *   settle:  seconds over which a segment absorbs the mismatch (default: until its exit overlap)
 *   anchor:  false on a segment keeps it relative (no absolute correction)
 */
export function seq(segments, o = {}) {
  const segs = [], ovl = [0], meta = [];
  let prevEnd = o.from ?? null;
  segments.forEach((s, i) => {
    const spec = isMove(s) || typeof s === 'function' ? { move: s } : s;
    const m = typeof spec.move === 'function' && !isMove(spec.move) ? spec.move(prevEnd) : spec.move;
    segs.push(m); meta.push(spec); prevEnd = m.end;
    if (i > 0) {
      const ov = spec.overlap ?? (Array.isArray(o.overlap) ? o.overlap[i - 1] : o.overlap) ?? 'auto';
      // a floor of 0.3 s: even rest-to-rest joins crossfade velocity, so live or breathing moves never pop
      ovl.push(ov === 'auto' ? Math.min(0.9, 0.3 * Math.min(segs[i - 1].dur, m.dur)) : Math.max(o.hard ? 0 : 0.3, ov));
    }
  });
  ovl.push(0);
  const n = segs.length, d = segs.map(m => m.dur);
  for (let i = 0; i < n; i++) { const tot = ovl[i] + ovl[i + 1]; if (tot > d[i] * 0.95) { const k = d[i] * 0.95 / tot; if (i > 0) ovl[i] *= k; ovl[i + 1] *= k; } }
  const T = [0]; for (let i = 1; i < n; i++) T.push(T[i - 1] + d[i - 1] - ovl[i]);
  const dur = T[n - 1] + d[n - 1];
  const settle = segs.map((m, i) => clamp(meta[i].settle ?? o.settle ?? (d[i] - ovl[i + 1]), Math.min(0.2, d[i] - ovl[i + 1]), d[i] - ovl[i + 1]));
  // C_i(x): integral of W_i * dS_i over [0, x]
  const contrib = (i, x, base) => {
    const S = (s) => segs[i].vec(s, base + T[i] + s), oi = ovl[i], ox = ovl[i + 1], e = d[i] - ox;
    const wIn = (s) => dsmoother(s / oi) / oi, wOut = (s) => -dsmoother((s - e) / ox) / ox;
    const Sx = S(x);
    if (oi > 0 && x <= oi) { const q = quad(0, x, wIn, S), W = smoother(x / oi), o = new Float64Array(NCH); for (let k = 0; k < NCH; k++) o[k] = W * Sx[k] - q[k]; return o; }
    let cin; const S0 = S(oi);
    if (oi > 0) { const q = quad(0, oi, wIn, S); cin = vadd(S0, q, -1); } else cin = new Float64Array(NCH);
    if (x <= e || ox <= 0) return vadd(cin, vadd(Sx, S0, -1));
    const Se = S(e), q = quad(e, x, wOut, S), W = 1 - smoother((x - e) / ox), o = new Float64Array(NCH);
    for (let k = 0; k < NCH; k++) o[k] = cin[k] + Se[k] - S0[k] + W * Sx[k] - Se[k] - q[k];
    return o;
  };
  const cache = new Map();
  const corrections = (base) => {
    const key = base.toFixed(6); if (cache.has(key)) return cache.get(key);
    const ms = []; const start = segs[0].vec(0, base);
    for (let i = 0; i < n; i++) {
      if (i === 0 || meta[i].anchor === false) { ms.push(new Float64Array(NCH)); continue; }
      const t = T[i] + settle[i]; let p = start;
      for (let j = 0; j <= i; j++) p = vadd(p, contrib(j, clamp(t - T[j], 0, d[j]), base));
      for (let j = 0; j < i; j++) p = vadd(p, ms[j]);
      ms.push(vadd(segs[i].vec(settle[i], base + t), p, -1));
    }
    const out = { start, ms }; if (cache.size > 64) cache.clear(); cache.set(key, out); return out;
  };
  const m = new Move(dur, (t, tg) => {
    const base = tg - t, { start, ms } = corrections(base); let v = start;
    for (let i = 0; i < n; i++) {
      if (t > T[i]) v = vadd(v, contrib(i, Math.min(t - T[i], d[i]), base));
      if (i > 0) { const g = smoother((t - T[i]) / settle[i]); if (g > 0) v = vadd(v, ms[i], g); }
    }
    return unpack(v);
  }, { name: 'seq' });
  m.segments = segs.map((s, i) => ({ name: s.meta?.name, start: T[i], dur: d[i], overlap: ovl[i] }));
  return m;
}

// cut([a, b, ...]): play moves back to back with a HIDDEN cut between them (the camera jumps). Only
// for joins inside a frame that is fully black, white or occluded (a page, an eye, a dark surface);
// build the halves so speeds and directions match ('in' then 'out' easing) and the cut is felt as
// one move. .cuts lists the cut times (tests measure each piece separately).
export function cut(moves) {
  const T = [0]; moves.forEach((m, i) => T.push(T[i] + m.dur));
  const r = new Move(T.at(-1), (t, tg) => { let i = 0; while (i < moves.length - 1 && t >= T[i + 1]) i++; return moves[i].at(t - T[i], tg - t + t); }, { name: 'cut' });
  r.cuts = T.slice(1, -1); r.segments = moves.map((m, i) => ({ name: m.meta?.name, start: T[i], dur: m.dur, overlap: 0 })); return r;
}
// blend(a, b, w): w is a number, a function of t, or [t0, t1] (C2 ramp from a to b between t0..t1).
export function blend(a, b, w = 0.5) {
  const W = typeof w === 'function' ? w : Array.isArray(w) ? (t) => win(t, w[0], w[1]) : () => w;
  return new Move(Math.max(a.dur, b.dur), (t, tg) => unpack(vlerp(a.vec(t, tg), b.vec(t, tg), W(t))), { name: 'blend' });
}
// overlay the *motion* of b on a (b's displacement from its own start is added): e.g. a slow
// pedestal layered under an orbit, or a drift layered on a follow.
export function layer(a, b, k = 1) {
  return new Move(Math.max(a.dur, b.dur), (t, tg) => { const b0 = b.vec(0, tg - t); return unpack(vadd(a.vec(t, tg), vadd(b.vec(t, tg), b0, -1), k)); }, { name: 'layer' });
}
// re-aim a move at a (moving) subject, leading it by `lead` seconds; weight number | fn | [t0, t1]
export function lookAt(m, subj, o = {}) {
  const S = subject(subj), lead = o.lead ?? 0.3, hgt = o.height ?? 0, w = o.weight ?? 1;
  const W = typeof w === 'function' ? w : Array.isArray(w) ? (t) => win(t, w[0], w[1]) : () => w;
  const F = o.lag ? lagFilter(S, o.lag) : S;
  return new Move(m.dur, (t, tg) => { const s = m.at(t, tg), p = add(F(tg + lead), [0, hgt, 0]), k = W(t);
    return { ...s, look: lerp3(s.look, p, k), focus: o.focus === false ? s.focus : lerp(s.focus, len(sub(p, s.pos)), k) }; }, { name: 'lookAt' });
}
export function breathe(m, o = {}) { return new Move(m.dur, (t, tg) => addBreath(m.at(t, tg), tg, o.amp ?? 0.02, o.seed ?? 0), { name: 'breathe' }); }
export function retime(m, dur) { const k = m.dur / dur; return new Move(dur, (t, tg) => m.at(t * k, tg - t + t * k), { name: 'retime' }); }
export function reverse(m) { return new Move(m.dur, (t, tg) => m.at(m.dur - t, tg - t + m.dur - t), { name: 'reverse' }); }
// hold the first frame for `pre` seconds (and the last for `post`)
export function delay(m, pre = 0, post = 0) { return new Move(m.dur + pre + post, (t, tg) => m.at(t - pre, tg - pre), { name: 'delay' }); }
export function offset(m, dp = [0, 0, 0], dl = dp) { return new Move(m.dur, (t, tg) => { const s = m.at(t, tg); return { ...s, pos: add(s.pos, dp), look: add(s.look, dl) }; }, { name: 'offset' }); }
export function lens(m, mmFn) { return new Move(m.dur, (t, tg) => ({ ...m.at(t, tg), mm: typeof mmFn === 'function' ? mmFn(t) : mmFn }), { name: 'lens' }); }

/**
 * Speed ramp: keys [[q, speed], ...] over the new timeline (q in 0..1, speed relative, >= 0).
 * Speeds interpolate with cosine blends (C1 speed, C2 position). The move keeps its duration unless
 * opts.dur is given. Returns a Move whose .warp(t) maps new time to the move's own time; apply the
 * same warp to the world clock for a true slow-motion beat (scene.update(m.warp(t))).
 */
export function timeWarp(keys, dur = 1, outDur = dur) {
  const q = keys.map(k => k[0]), v = keys.map(k => Math.max(0, k[1])), cum = [0];
  const segInt = (i, x) => { const h = q[i + 1] - q[i]; return h * (v[i] * x + (v[i + 1] - v[i]) * (x / 2 - Math.sin(PI * x) / (2 * PI))); };
  for (let i = 0; i < q.length - 1; i++) cum.push(cum[i] + segInt(i, 1));
  const total = cum.at(-1) || 1;
  return (t) => { const x = clamp(t / outDur); let i = 0; while (i < q.length - 2 && x > q[i + 1]) i++;
    if (x <= q[0]) return 0; const h = q[i + 1] - q[i]; return dur * (cum[i] + segInt(i, clamp((x - q[i]) / h))) / total; };
}
export function speedRamp(m, keys, o = {}) {
  const outDur = o.dur ?? m.dur, w = timeWarp(keys, m.dur, outDur);
  const r = new Move(outDur, (t, tg) => { const tw = w(t); return m.at(tw, o.warpWorld === false ? tg : tg - t + tw); }, { name: 'speedRamp' });
  r.warp = w; return r;
}

// ============================================================================ framing
/**
 * frameSubject(box, opts): solve camera position and aim so the subject sits on a composition.
 *   box: THREE.Box3 | { min, max } | { center, size: [w, h, d] }
 *   opts: thirds 'left' | 'right' | 'center' | NDC x; headroom (frame fraction above the top, 0.1);
 *         fill (subject height / frame height, 0.55) or dist; lens/mm; az, el (deg); aspect.
 * Returns { pos, look, mm, dist, state } (state can go straight into hold() or apply()).
 */
export function frameSubject(box, o = {}) {
  const mn = box.min ? [box.min.x ?? box.min[0], box.min.y ?? box.min[1], box.min.z ?? box.min[2]] : sub(box.center, mul(box.size, 0.5));
  const mx = box.max ? [box.max.x ?? box.max[0], box.max.y ?? box.max[1], box.max.z ?? box.max[2]] : add(box.center, mul(box.size, 0.5));
  const c = lerp3(mn, mx, 0.5), h = mx[1] - mn[1], wdt = Math.hypot(mx[0] - mn[0], mx[2] - mn[2]);
  const mm = o.lens ?? o.mm ?? 40, aspect = o.aspect ?? 16 / 9, fill = o.fill ?? 0.55, head = o.headroom ?? 0.1;
  const tv = Math.tan(C.mmToFov(mm, aspect) * D2R / 2), th = tv * aspect;
  let dist = o.dist ?? h / 2 / (fill * tv);
  if (!o.dist) dist = Math.max(dist, wdt / 2 / (0.9 * th));
  const sx = typeof o.thirds === 'number' ? o.thirds : { left: -1 / 3, right: 1 / 3, center: 0 }[o.thirds ?? 'center'];
  const fy = h / 2 / (dist * tv); // half the subject height in NDC
  const sy = o.sy ?? clamp(1 - 2 * head - fy, -0.9, 0.9);
  const pos = around(c, dist, o.az ?? 0, o.el ?? 5);
  // aim: rotate the view so c lands at (sx, sy). Solve yaw/pitch by fixed-point iteration (exact for no roll).
  let [yaw, pitch] = yawPitch(pos, c);
  for (let it = 0; it < 8; it++) {
    const f = dirOf(yaw, pitch), r = norm(cross(f, Y)), u = cross(r, f), v = sub(c, pos);
    const z = dot(v, f), px = dot(v, r) / z / th, py = dot(v, u) / z / tv;
    yaw -= Math.atan((px - sx) * th) * 0.9; pitch -= Math.atan((sy - py) * tv) * 0.9;
  }
  const look = mad(pos, dirOf(yaw, pitch), dist);
  return { pos, look, mm, dist, state: { pos, look, up: Y, roll: 0, mm, focus: dist } };
}
// project a world point with a state (NDC x, y), for tests and framing checks
export function project(state, p, aspect = 16 / 9) {
  const f = norm(sub(state.look, state.pos)), r = norm(cross(f, state.up ?? Y)), u = cross(r, f), v = sub(p, state.pos), z = dot(v, f);
  const tv = Math.tan(C.mmToFov(state.mm, aspect) * D2R / 2);
  return [dot(v, r) / z / (tv * aspect), dot(v, u) / z / tv];
}

// ============================================================================ apply
const _m = new THREE.Matrix4(), _e = new THREE.Vector3(), _t = new THREE.Vector3(), _u = new THREE.Vector3(), _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
/** Put a state on a three.js camera. opts.fx: a post.js chain (focus is pulled to state.focus). */
export function apply(camera, s, o = {}) {
  _e.set(...s.pos); _t.set(...s.look); _u.set(...(s.up ?? Y));
  const f = norm(sub(s.look, s.pos)); if (len(cross(f, s.up ?? Y)) < 1e-5) _u.set(0, 0, -1); // degenerate guard
  camera.position.copy(_e); _m.lookAt(_e, _t, _u); camera.quaternion.setFromRotationMatrix(_m);
  if (s.roll) camera.quaternion.multiply(_q.setFromAxisAngle(_z, s.roll));
  const fov = C.mmToFov(s.mm ?? 35, camera.aspect || 16 / 9);
  if (Math.abs(camera.fov - fov) > 1e-9) { camera.fov = fov; camera.updateProjectionMatrix(); }
  if (o.near || o.far) { camera.near = o.near ?? camera.near; camera.far = o.far ?? camera.far; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
  if (o.fx?.focus && s.focus) o.fx.focus(s.focus);
  return camera;
}
/** cine.js-compatible rig: (camera, p, t) => void. fit: true plays the whole move over the shot (by p). */
export function rig(m, o = {}) { const r = (camera, p, t) => apply(camera, m.at(o.fit ? p * m.dur : t - (o.start ?? 0)), o); r.move = m; return r; }

// ============================================================================ measurement
/** Sample a move: velocity, acceleration and jerk peaks for pos, look direction, roll and log-mm. */
export function measure(m, { dt = 1 / 240, from = 0, to = m.dur } = {}) {
  const N = Math.max(4, Math.round((to - from) / dt)), h = (to - from) / N;
  const sig = (s) => { const f = norm(sub(s.look, s.pos)); return [...s.pos, ...f, s.roll, Math.log(s.mm)]; };
  const xs = []; for (let i = 0; i <= N; i++) xs.push(sig(m.at(from + i * h)));
  const diff = (a) => a.slice(1).map((x, i) => x.map((v, k) => (v - a[i][k]) / h));
  const v = diff(xs), a = diff(v), j = diff(a);
  const mag = (x, k0, k1) => Math.hypot(...x.slice(k0, k1));
  const peak = (arr, k0, k1) => arr.reduce((p, x) => Math.max(p, mag(x, k0, k1)), 0);
  const jump = (arr, k0, k1) => arr.slice(1).reduce((p, x, i) => Math.max(p, Math.hypot(...x.slice(k0, k1).map((q, k) => q - arr[i][k0 + k]))), 0);
  const ch = { pos: [0, 3], dir: [3, 6], roll: [6, 7], lens: [7, 8] }, out = {};
  for (const k in ch) out[k] = { vPeak: peak(v, ...ch[k]), aPeak: peak(a, ...ch[k]), vJump: jump(v, ...ch[k]), aJump: jump(a, ...ch[k]), vStart: mag(v[0], ...ch[k]), vEnd: mag(v.at(-1), ...ch[k]) };
  return out;
}
