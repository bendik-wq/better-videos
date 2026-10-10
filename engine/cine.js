// Cinematography layer: spline camera rigs, follow cams, animated characters, HDR skies.
// Everything is deterministic in time t so frames can render in any order / any worker.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as K from 'kit';

const chars = {}, skies = {}, envs = {};

export async function preload(renderer, { characters = ['Soldier', 'Xbot'], hdris = [] } = {}) {
  const gl = new GLTFLoader(), rl = new RGBELoader();
  await Promise.all([
    ...characters.map(async (n) => { chars[n] = await gl.loadAsync(`/assets/models/${MODEL_FILES[n] ?? n}.glb`); }),
    ...hdris.map(async (n) => {
      const tex = await rl.loadAsync(`/assets/hdri/${n}.hdr`); tex.mapping = THREE.EquirectangularReflectionMapping; skies[n] = tex;
      const pm = new THREE.PMREMGenerator(renderer); envs[n] = pm.fromEquirectangular(tex).texture; pm.dispose();
    }),
  ]);
}

// HDR sky: image-based lighting + optional visible background.
export function sky(scene, name, { background = true, intensity = 1, bgIntensity = 1, blur = 0 } = {}) {
  scene.environment = envs[name]; scene.environmentIntensity = intensity;
  if (background) { scene.background = skies[name]; scene.backgroundIntensity = bgIntensity; scene.backgroundBlurriness = blur; }
}

// ---------- characters ----------
const SILHOUETTE = () => new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.55, metalness: 0.1 });
// Characters: 'UAL' (Quaternius Universal Animation Library mannequin, CC0, 43 clips, see
// assets/CREDITS.md) is the one to use. 'Soldier' and 'Xbot' are Mixamo-derived and kept only so
// old projects render unchanged. UAL clips: Idle_Loop, Walk_Loop, Walk_Formal_Loop, Jog_Fwd_Loop,
// Sprint_Loop, Crouch_Idle_Loop, Sitting_Idle_Loop, Sitting_Talking_Loop, Idle_Talking_Loop,
// Push_Loop, PickUp_Table, Fixing_Kneeling, Interact, Death01, ... ('Idle' finds 'Idle_Loop').
const MODEL_FILES = { UAL: 'UAL_Mannequin' };
// Mixamo bone names -> UE names, so pose maps like POSE_RAISE_RIGHT find their bones on UAL.
// Bone axes differ between rigs: re-tune rotation values per rig.
const UE_ALIAS = { Hips: 'pelvis', Spine: 'spine_01', Spine1: 'spine_02', Spine2: 'spine_03', Neck: 'neck_01', Head: 'Head',
  LeftShoulder: 'clavicle_l', LeftArm: 'upperarm_l', LeftForeArm: 'lowerarm_l', LeftHand: 'hand_l',
  RightShoulder: 'clavicle_r', RightArm: 'upperarm_r', RightForeArm: 'lowerarm_r', RightHand: 'hand_r',
  LeftUpLeg: 'thigh_l', LeftLeg: 'calf_l', LeftFoot: 'foot_l', RightUpLeg: 'thigh_r', RightLeg: 'calf_r', RightFoot: 'foot_r' };
export function character(name = 'Soldier', { clip = 'Idle', material = 'silhouette', scale = 1, phase = 0, speed = 1 } = {}) {
  const src = chars[name]; if (!src) throw new Error(`[cine] character ${name} not preloaded: C.preload(renderer, { characters: ['${name}'] })`);
  const root = SkeletonUtils.clone(src.scene); root.scale.setScalar(scale);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (material === 'silhouette') o.material = SILHOUETTE(); else if (material) o.material = material; } });
  const mixer = new THREE.AnimationMixer(root); const actions = {};
  for (const c of src.animations) actions[c.name] = mixer.clipAction(c);
  const find = (c) => actions[c] ?? actions[c + '_Loop'];
  let current = find(clip) ?? Object.values(actions)[0]; current?.play();
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o; });
  for (const k in UE_ALIAS) if (!bones[k] && bones[UE_ALIAS[k]]) bones[k] = bones[UE_ALIAS[k]];
  return {
    root, bones, clips: Object.keys(actions),
    play(c) { const a = find(c); if (a && a !== current) { current?.stop(); current = a; current.play(); } },
    update(t) { mixer.setTime(Math.max(0, t * speed + phase)); root.updateMatrixWorld(true); },
    // Crossfade, pure in t: blend([[clip, localTime, weight], ...]); weights should sum to 1.
    // e.g. walk -> idle over 0.4 s: const k = K.smooth(K.range(t, stop - 0.2, stop + 0.2));
    //      ch.blend([['Walk_Loop', t, 1 - k], ['Idle_Loop', t - stop, k]])
    blend(list) {
      for (const a of Object.values(actions)) { a.stop(); }
      for (const [c, lt, w] of list) { const a = find(c); if (!a || w <= 0) continue; a.reset(); a.play(); a.setEffectiveWeight(w); a.time = Math.max(0, lt * speed + phase) % a.getClip().duration; }
      mixer.update(0); root.updateMatrixWorld(true); current = null;
    },
    // add rotations (radians) on top of the animated pose, e.g. { RightArm: [x, y, z] }
    pose(map, k = 1) { for (const b in map) { const n = bones[b]; if (!n) continue; const [x, y, z] = map[b]; n.rotation.x += x * k; n.rotation.y += y * k; n.rotation.z += z * k; } },
  };
}

// Skydiver arch: arms out and up, legs bent back.
export const POSE_FREEFALL = { LeftArm: [0, 0, -0.2], RightArm: [0, 0, 0.2], LeftForeArm: [0, 0, -0.6], RightForeArm: [0, 0, 0.6], LeftUpLeg: [0.35, 0, 0], RightUpLeg: [0.35, 0, 0], LeftLeg: [-1.1, 0, 0], RightLeg: [-1.1, 0, 0], Spine: [-0.25, 0, 0] };
export const POSE_RAISE_RIGHT = { RightArm: [0, 0, 1.6], RightForeArm: [0, 0, 0.3] };

// ---------- camera rigs ----------
const V = (a) => new THREE.Vector3(...a);
// Spline camera: keys = [{ pos, look, fov? }...]; travels the curve with a smooth ease.
export function rig(keys, { ease = K.inOut, float = 0.04, seed = 0 } = {}) {
  const P = new THREE.CatmullRomCurve3(keys.map(k => V(k.pos)), false, 'centripetal');
  const L = new THREE.CatmullRomCurve3(keys.map(k => V(k.look)), false, 'centripetal');
  const fovs = keys.map(k => k.fov ?? null);
  return (camera, p, t) => {
    const u = ease(K.clamp(p)); const pos = P.getPoint(u), look = L.getPoint(u); const h = K.handheld(t, float, seed);
    camera.position.set(pos.x + h.x, pos.y + h.y, pos.z); camera.lookAt(look); camera.rotation.z += h.r;
    if (fovs[0] !== null) { const f = u * (fovs.length - 1); const i = Math.min(fovs.length - 2, Math.floor(f)); camera.fov = K.lerp(fovs[i], fovs[i + 1], f - i); camera.updateProjectionMatrix(); }
  };
}

// ---------- clouds ----------
let cloudTex = null;
function cloudTexture() {
  if (cloudTex) return cloudTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const r = K.rng(5);
  for (let i = 0; i < 90; i++) { const px = 128 + (r() - 0.5) * 140, py = 128 + (r() - 0.5) * 90, rad = 20 + r() * 50;
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  cloudTex = new THREE.CanvasTexture(c); cloudTex.colorSpace = THREE.SRGBColorSpace; return cloudTex;
}
export function cloudLayer(scene, { y = -60, spread = 600, count = 160, size = 90, color = 0xfff4e8, seed = 3 } = {}) {
  const g = new THREE.Group(); const r = K.rng(seed); const tex = cloudTexture();
  for (let i = 0; i < count; i++) { const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: 0.85, fog: false });
    const s = new THREE.Sprite(m); const sc = size * (0.6 + r()); s.scale.set(sc, sc * 0.6, 1); s.position.set((r() - 0.5) * spread, y - r() * 40, (r() - 0.5) * spread); g.add(s); }
  scene.add(g); return g;
}

// ---------- lenses (full-frame 36 mm gate; Three.js fov is vertical) ----------
// 16:9 full frame: gate 36 x 20.25 mm, so vFOV = 2·atan(10.125 / mm). 40 mm -> 28.4°.
export const mmToFov = (mm, aspect = 16 / 9) => 2 * Math.atan(36 / Math.max(aspect, 1) / 2 / mm) * 180 / Math.PI;
export const fovToMm = (fov, aspect = 16 / 9) => 36 / Math.max(aspect, 1) / 2 / Math.tan(fov * Math.PI / 360);
export function lens(camera, mm) {
  camera.filmGauge = 36; camera.setFocalLength(mm); // Three: filmHeight = gauge / max(aspect, 1)
  return camera;
}
// Distance at which an object `size` tall fills `fill` of the frame height on `mm`.
export const frameDistance = (size, mm, fill = 0.6, aspect = 16 / 9) => size / fill / (2 * Math.tan(mmToFov(mm, aspect) * Math.PI / 360));

// ---------- C1 motion ----------
// Velocity profile over the shot: cosine ramp up over `accel`, cruise, cosine ramp down over
// `decel`. Position is its integral, so velocity is continuous (C1) and so is acceleration.
// v0 / v1 are the normalised entry/exit speeds ds/dp (0 = start/end at rest). Returns
// { s(p), ds(p) } with s(0) = 0, s(1) = 1.
export function profile({ accel = 0.35, decel = 0.35, v0 = 0, v1 = 0 } = {}) {
  const a = K.clamp(accel, 0, 1), b = K.clamp(decel, 0, 1 - a);
  const den = Math.max(0.05, 1 - (a * v0 + b * v1) / 2);
  const A = (1 - (a + b) / 2) / den;
  const r0 = Math.max(0, v0 * A), r1 = Math.max(0, v1 * A);
  const PI = Math.PI, m = 1 - a - b;
  const area = a * (r0 + 1) / 2 + m + b * (1 + r1) / 2; // == A unless clamped
  const R = (p) => {
    if (p <= 0) return 0;
    if (p < a) return r0 * p + (1 - r0) * (p / 2 - a / (2 * PI) * Math.sin(PI * p / a));
    const up = a * (r0 + 1) / 2;
    if (p <= a + m) return up + (p - a);
    const q = Math.min(p, 1) - (a + m);
    return up + m + q + (r1 - 1) * (q / 2 - b / (2 * PI) * Math.sin(PI * q / b));
  };
  const r = (p) => p < a ? r0 + (1 - r0) * (1 - Math.cos(PI * p / a)) / 2 : p <= a + m ? 1 : r1 + (1 - r1) * (1 + Math.cos(PI * (p - a - m) / b)) / 2;
  return { s: (p) => K.clamp(R(K.clamp(p)) / area), ds: (p) => r(K.clamp(p)) / area };
}

// Non-uniform cubic Hermite through values at knots tau (weighted Catmull-Rom tangents), C1.
function hermite(vals, tau) {
  const n = vals.length, dim = vals[0].length;
  const slope = (i) => vals[i + 1].map((v, k) => (v - vals[i][k]) / Math.max(1e-9, tau[i + 1] - tau[i]));
  const m = vals.map((_, i) => {
    if (n < 2) return new Array(dim).fill(0);
    if (i === 0) return slope(0);
    if (i === n - 1) return slope(n - 2);
    const h0 = tau[i] - tau[i - 1], h1 = tau[i + 1] - tau[i], s0 = slope(i - 1), s1 = slope(i);
    return s0.map((_, k) => (s0[k] * h1 + s1[k] * h0) / (h0 + h1));
  });
  const seg = (u) => { let i = 0; while (i < n - 2 && u > tau[i + 1]) i++; return i; };
  return {
    at(u) {
      if (n === 1) return vals[0].slice();
      u = K.clamp(u, tau[0], tau[n - 1]); const i = seg(u), h = tau[i + 1] - tau[i], x = (u - tau[i]) / h;
      const h00 = 2 * x ** 3 - 3 * x ** 2 + 1, h10 = x ** 3 - 2 * x ** 2 + x, h01 = -2 * x ** 3 + 3 * x ** 2, h11 = x ** 3 - x ** 2;
      return vals[i].map((v, k) => h00 * v + h10 * h * m[i][k] + h01 * vals[i + 1][k] + h11 * h * m[i + 1][k]);
    },
    d(u) { // derivative w.r.t. u
      if (n === 1) return new Array(dim).fill(0);
      u = K.clamp(u, tau[0], tau[n - 1]); const i = seg(u), h = tau[i + 1] - tau[i], x = (u - tau[i]) / h;
      const d00 = 6 * x ** 2 - 6 * x, d10 = 3 * x ** 2 - 4 * x + 1, d01 = -6 * x ** 2 + 6 * x, d11 = 3 * x ** 2 - 2 * x;
      return vals[i].map((v, k) => (d00 * v + d01 * vals[i + 1][k]) / h + d10 * m[i][k] + d11 * m[i + 1][k]);
    },
  };
}

/**
 * C1 camera path. keys: [{ pos, look, mm? | fov? }]. Knots are spaced by chord length, so the
 * camera travels at near-constant speed along the curve, and the `profile` time warp gives the
 * whole shot one ease-in and one ease-out: no velocity pops at keys, ever.
 *   opts.accel / decel   fraction of the shot spent speeding up / slowing down (default .35/.35)
 *   opts.duration        shot length in s; needed for velocity carry-over
 *   opts.vIn / vOut      entry / exit speed in world units per second (default 0 = at rest)
 *   opts.carry           an outgoing rig: start at its exit speed (match cuts). Needs both durations.
 *   opts.float, seed     low-frequency handheld (K.handheld), amplitude in world units
 * Returns rig(camera, p, t) with .exit(), .velocity(p), .at(p) for match-cut planning.
 */
export function path(keys, { accel = 0.35, decel = 0.35, duration = null, vIn = 0, vOut = 0, carry = null, float = 0.02, seed = 0, roll = 0 } = {}) {
  const P = keys.map(k => [...k.pos]), L = keys.map(k => [...(k.look ?? keys[0].look)]);
  const F = keys.map(k => [k.fov ?? (k.mm ? mmToFov(k.mm) : NaN)]);
  const hasFov = !Number.isNaN(F[0][0]);
  // chord-length knots (fall back to look-point travel for pans from a fixed spot)
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  let tau = [0]; for (let i = 1; i < P.length; i++) tau.push(tau[i - 1] + Math.max(dist(P[i], P[i - 1]), 0.25 * dist(L[i], L[i - 1]), 1e-4));
  const T = tau.at(-1) || 1; tau = tau.map(x => x / T);
  const hp = hermite(P, tau), hl = hermite(L, tau), hf = hasFov ? hermite(F, tau) : null;
  const len = (v) => Math.hypot(...v);
  if (carry && duration && carry.duration) vIn = len(carry.exit());
  const v0 = duration && vIn ? vIn * duration / Math.max(1e-6, len(hp.d(0))) : 0;
  const v1 = duration && vOut ? vOut * duration / Math.max(1e-6, len(hp.d(1))) : 0;
  const prof = profile({ accel: v0 ? Math.min(accel, 0.5) : accel, decel, v0, v1 });
  const rig = (camera, p, t = 0) => {
    const u = prof.s(p), pos = hp.at(u), look = hl.at(u), h = K.handheld(t, float, seed);
    camera.position.set(pos[0] + h.x, pos[1] + h.y, pos[2]); camera.lookAt(look[0], look[1], look[2]); camera.rotation.z += h.r + roll;
    if (hf) { const f = hf.at(u)[0]; if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); } }
  };
  rig.duration = duration;
  rig.at = (p) => ({ pos: hp.at(prof.s(p)), look: hl.at(prof.s(p)) });
  // world-space velocity (units/s) at shot fraction p; needs duration
  rig.velocity = (p) => { const d = hp.d(prof.s(p)), k = prof.ds(p) / (duration || 1); return d.map(x => x * k); };
  rig.exit = () => rig.velocity(1);
  rig.speed = (p) => len(rig.velocity(p));
  return rig;
}

// ---------- move presets (all C1, all keyed by lens) ----------
// Common args: target [x,y,z]; mm (lens, default per move); size + fill (frame the subject:
// it fills `fill` of frame height) or dist; az / el in degrees (0 az = camera on +z looking -z).
const D2R = Math.PI / 180;
const around = (target, dist, az, el) => [target[0] + Math.sin(az * D2R) * Math.cos(el * D2R) * dist, target[1] + Math.sin(el * D2R) * dist, target[2] + Math.cos(az * D2R) * Math.cos(el * D2R) * dist];
const distFor = (o, mm) => o.dist ?? frameDistance(o.size ?? 1.8, mm, o.fill ?? 0.6);
export const moves = {
  // "This matters": a straight push on one axis, 15-30 % of the distance. 40 mm.
  slowPush(o = {}) {
    const mm = o.mm ?? 40, tg = o.target ?? [0, 1, 0], d = distFor(o, mm), az = o.az ?? 0, el = o.el ?? 4, push = o.push ?? 0.2;
    const from = around(tg, d, az, el), to = around(tg, d * (1 - push), az + (o.drift ?? 0), el + (o.rise ?? 0));
    return path([{ pos: from, look: tg, mm }, { pos: to, look: tg, mm }], { accel: 0.3, decel: 0.45, float: o.float ?? 0.015, ...o.opts });
  },
  // Pull back from the detail to the system; lands on outCubic-like settle. 40 mm.
  pullBack(o = {}) {
    const mm = o.mm ?? 40, tg = o.target ?? [0, 1, 0], d = distFor(o, mm), az = o.az ?? 0, el = o.el ?? 6, k = o.pull ?? 2;
    return path([{ pos: around(tg, d, az, el), look: tg, mm }, { pos: around(tg, d * k, az + (o.drift ?? 0), el + (o.rise ?? 4)), look: tg, mm }], { accel: 0.15, decel: 0.6, float: o.float ?? 0.015, ...o.opts });
  },
  // Hover: the camera breathes around a held frame (a lateral drift of ~3 % of the distance).
  float(o = {}) {
    const mm = o.mm ?? 50, tg = o.target ?? [0, 1, 0], d = distFor(o, mm), az = o.az ?? 0, el = o.el ?? 5, s = o.drift ?? 1;
    const keys = [[-1.2, 0], [0, 0.6], [1.2, 0]].map(([da, de]) => ({ pos: around(tg, d * (1 - 0.02 * de), az + da * s, el + de * s * 0.5), look: tg, mm }));
    return path(keys, { accel: 0.5, decel: 0.5, float: o.float ?? 0.03, ...o.opts });
  },
  // Orbit reveal: 20-40° of arc with a slight push, landing on the hero angle. 50 mm.
  orbitReveal(o = {}) {
    const mm = o.mm ?? 50, tg = o.target ?? [0, 1, 0], d = distFor(o, mm), arc = o.arc ?? 32, az1 = o.az ?? 0, az0 = az1 - arc * (o.dir ?? 1);
    const el0 = o.el0 ?? (o.el ?? 6) + 4, el1 = o.el ?? 6, push = o.push ?? 0.1, n = 6;
    const keys = Array.from({ length: n }, (_, i) => { const k = i / (n - 1); return { pos: around(tg, d * (1 + push * (1 - k)), K.lerp(az0, az1, k), K.lerp(el0, el1, k)), look: tg, mm }; });
    return path(keys, { accel: 0.25, decel: 0.55, float: o.float ?? 0.015, ...o.opts });
  },
  // Lateral truck past a foreground element: parallax. 35 mm. `track` = travel in world units.
  truck(o = {}) {
    const mm = o.mm ?? 35, tg = o.target ?? [0, 1, 0], d = distFor(o, mm), az = o.az ?? 0, el = o.el ?? 3, w = (o.track ?? 0.15 * d) / 2;
    const c = around(tg, d, az, el), side = [Math.cos(az * D2R), 0, -Math.sin(az * D2R)];
    const off = (k) => c.map((v, i) => v + side[i] * k * w), look = (k) => tg.map((v, i) => v + side[i] * k * w * (o.parallel ?? 0.6));
    return path([{ pos: off(-1), look: look(-1), mm }, { pos: off(1), look: look(1), mm }], { accel: 0.3, decel: 0.3, float: o.float ?? 0.015, ...o.opts });
  },
  // Follow-through: the frame follows a moving subject with a lag and settles with a slight
  // overshoot after it stops, like an operator on a fluid head. subject(t) -> [x,y,z] in world
  // (must accept any t, including negative). Pure in t: an FIR of a damped second-order response.
  followThrough(o = {}) {
    const mm = o.mm ?? 35, off = o.offset ?? [0, 1.2, frameDistance(o.size ?? 1.8, mm, o.fill ?? 0.5)], lag = o.lag ?? 0.45, over = o.overshoot ?? 0.12;
    const zeta = K.clamp(Math.sqrt(Math.log(over || 1e-3) ** 2 / (Math.PI ** 2 + Math.log(over || 1e-3) ** 2)), 0.3, 1);
    const wn = 2.2 / Math.max(0.05, lag), wd = wn * Math.sqrt(1 - zeta * zeta) || wn;
    const N = 40, span = 4 / (zeta * wn), dt = span / N;
    let w = Array.from({ length: N + 1 }, (_, k) => { const x = k * dt; return Math.exp(-zeta * wn * x) * Math.sin(wd * x); });
    const sum = w.reduce((a, b) => a + b, 0); w = w.map(x => x / sum);
    const filt = (t) => { const acc = [0, 0, 0]; for (let k = 0; k <= N; k++) { const s = o.subject(t - k * dt); acc[0] += w[k] * s[0]; acc[1] += w[k] * s[1]; acc[2] += w[k] * s[2]; } return acc; };
    const lookY = o.lookHeight ?? 1.0;
    const rig = (camera, p, t = 0) => {
      const c = filt(t), cl = filt(t + lag * 0.35); // the frame leads the body a touch: the operator anticipates
      const h = K.handheld(t, o.float ?? 0.02, o.seed ?? 0);
      camera.position.set(c[0] + off[0] + h.x, c[1] + off[1] + h.y, c[2] + off[2]);
      camera.lookAt(cl[0], cl[1] + lookY, cl[2]); camera.rotation.z += h.r;
      const f = mmToFov(mm); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
    };
    rig.velocity = (p, t) => { const e = 1e-3, a = filt(t - e), b = filt(t + e); return a.map((v, i) => (b[i] - v) / (2 * e)); };
    return rig;
  },
};
