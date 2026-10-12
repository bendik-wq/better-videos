// engine/people/core.js: realistic people for documentary shots.
// Characters (MakeHuman/MPFB bodies + CC0/CC-BY wardrobe, built offline by
// engine/people/build/mpfb_build.py) share one skeleton (MPFB "game_engine" rig, UE4 bone names).
// Clips (CMU mocap, retargeted offline by build/retarget.py) are local rotations in an
// "identity-rest" convention: every bone's rest rotation is identity in the character frame
// (Y up, facing +Z). At load each character's skeleton is re-bound to that convention, so one clip
// fits every body. Everything here is a pure function of t: no mixer state, no clocks.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const ASSET = '/assets/people';
const loader = new GLTFLoader();
export const lib = { clips: null, names: null, index: null, legRef: 1, bodies: {}, meta: null };

// ------------------------------------------------------------------ loading
export async function loadClips(url = `${ASSET}/clips.glb`) {
  if (lib.clips) return lib.clips;
  const g = await loader.loadAsync(url);
  const json = g.parser.json;
  const names = json.nodes.map(n => n.name);
  const index = Object.fromEntries(names.map((n, i) => [n, i]));
  const J = names.length; const clips = {};
  g.animations.forEach((a, ai) => {
    const ex = json.animations[ai].extras ?? {};
    const fps = ex.fps ?? 30;
    const n = Math.max(1, Math.round(a.duration * fps) + 1);
    const q = new Float32Array(n * J * 4), pel = new Float32Array(n * 3);
    for (let i = 0; i < n * J; i++) q[i * 4 + 3] = 1;
    for (const tr of a.tracks) {
      const [node, prop] = tr.name.split('.'); const j = index[node] ?? index[node.replace(/_/g, '.')];
      if (j === undefined) continue;
      const it = tr.createInterpolant(); const size = prop === 'quaternion' ? 4 : 3;
      for (let f = 0; f < n; f++) {
        const v = it.evaluate(Math.min(f / fps, a.duration));
        if (prop === 'quaternion') q.set(v.subarray ? v.subarray(0, 4) : v.slice(0, 4), (f * J + j) * 4);
        else if (prop === 'position' && node === 'pelvis') pel.set(v.slice(0, 3), f * 3);
      }
    }
    const contacts = {};
    for (const s of ['l', 'r']) { const str = ex.contacts?.[s] ?? ''; contacts[s] = Uint8Array.from(str, c => c === '1' ? 1 : 0); }
    clips[a.name] = { name: a.name, fps, n, q, pel, loop: ex.loop !== false, speed: ex.speed ?? 0, duration: n / fps,
      stride: (ex.speed ?? 0) * (n / fps), contacts, kind: ex.kind, src: ex.src, desc: ex.desc };
  });
  lib.clips = clips; lib.names = names; lib.index = index; lib.J = J; lib.legRef = json.extras?.legLength ?? 0.9;
  return clips;
}

const ROLE = (name) => /eyebrow|eyelash/i.test(name) ? 'brow' : /low-?poly|high-?poly|eyes/i.test(name) ? 'eyes' : /hair|short0|bob0|afro|braid|ponytail|long0/i.test(name) ? 'hair'
  : /^Human$|\.body$|proxy|generic/i.test(name) ? 'skin' : /shoe|boot|oxford|sneaker/i.test(name) ? 'shoes' : 'cloth';

// Load a wardrobe character and re-bind its skeleton to identity rest rotations.
export async function loadBody(id, url = `${ASSET}/wardrobe/${id}.glb`) {
  if (lib.bodies[id]) return lib.bodies[id];
  const g = await loader.loadAsync(url);
  const scene = g.scene; scene.updateMatrixWorld(true);
  const bones = {}; scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
  // world rest positions in the character frame
  const rest = {}; for (const n in bones) rest[n] = new THREE.Vector3().setFromMatrixPosition(bones[n].matrixWorld);
  const invRoot = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  for (const n in rest) rest[n].applyMatrix4(invRoot);
  // re-bind: identity rotations, offsets = rest deltas (parents of the root bone are plain nodes
  // with identity transforms in our exports; we fold any into the root bone)
  const order = []; scene.traverse(o => { if (o.isBone) order.push(o); });
  for (const b of order) {
    b.quaternion.identity(); b.scale.set(1, 1, 1);
    if (b.parent?.isBone) b.position.subVectors(rest[b.name], rest[b.parent.name]);
    else { // root bone: position so its world == rest under its (non-bone) parents
      const pw = new THREE.Matrix4().copy(b.parent.matrixWorld).premultiply(invRoot).invert();
      const pq = new THREE.Quaternion().setFromRotationMatrix(pw);
      b.position.copy(rest[b.name]).applyMatrix4(pw); b.quaternion.copy(pq);
    }
  }
  scene.updateMatrixWorld(true);
  const skinned = []; scene.traverse(o => { if (o.isSkinnedMesh) { skinned.push(o); o.skeleton.calculateInverses(); o.frustumCulled = false; } });
  const leg = rest.thigh_l.distanceTo(rest.calf_l) + rest.calf_l.distanceTo(rest.foot_l);
  const height = (() => { const bb = new THREE.Box3(); for (const m of skinned) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } return bb.max.y - bb.min.y; })();
  const body = { id, scene, rest, leg, height, skinned, ex: g.parser.json.extras ?? {} };
  for (const m of skinned) m.userData.role = ROLE(m.name);
  lib.bodies[id] = body; return body;
}

// ------------------------------------------------------------------ sampling
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
// Write clip pose at local time `time` into out (Float32Array J*4 quats, pel[3]), weighted add.
function accumulate(clip, time, w, outQ, outP, scratch) {
  const { n, fps, q, pel, loop } = clip; const J = lib.J;
  let x = time * fps;
  if (loop) { x = ((x % n) + n) % n; } else x = Math.min(Math.max(x, 0), n - 1);
  const f0 = Math.floor(x), f1 = loop ? (f0 + 1) % n : Math.min(f0 + 1, n - 1), u = x - f0;
  for (let j = 0; j < J; j++) {
    const a = (f0 * J + j) * 4, b = (f1 * J + j) * 4;
    _qa.set(q[a], q[a + 1], q[a + 2], q[a + 3]); _qb.set(q[b], q[b + 1], q[b + 2], q[b + 3]); _qa.slerp(_qb, u);
    const o = j * 4;
    // hemisphere-consistent weighted sum (nlerp blend), normalised later
    const s = (outQ[o] * _qa.x + outQ[o + 1] * _qa.y + outQ[o + 2] * _qa.z + outQ[o + 3] * _qa.w) < 0 ? -w : w;
    outQ[o] += _qa.x * s; outQ[o + 1] += _qa.y * s; outQ[o + 2] += _qa.z * s; outQ[o + 3] += _qa.w * s;
  }
  for (let k = 0; k < 3; k++) outP[k] += w * (pel[f0 * 3 + k] * (1 - u) + pel[f1 * 3 + k] * u);
}

export function clip(name) {
  const c = lib.clips?.[name]; if (!c) throw new Error(`[people] unknown clip "${name}" (have: ${Object.keys(lib.clips ?? {}).join(', ')})`);
  return c;
}

// Contact state of foot s ('l'|'r') at clip time: 0..1 (eased near the ends of a contact).
export function contactAt(c, time, s, ease = 3) {
  const arr = c.contacts[s]; if (!arr?.length) return 0;
  const n = c.n; let x = time * c.fps; x = c.loop ? ((x % n) + n) % n : Math.min(Math.max(x, 0), n - 1);
  const f = Math.floor(x); if (!arr[f]) return 0;
  // distance (frames) to the nearest non-contact frame
  let d = 0; while (d < ease && arr[((f + d + 1) % n)] && arr[((f - d - 1 + n) % n)]) d++;
  return Math.min(1, (d + 1) / (ease + 1));
}

// ------------------------------------------------------------------ the person
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _m = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

export class Person {
  constructor(body, { scale = 1, materials = null } = {}) {
    this.body = body;
    this.root = SkeletonUtils.clone(body.scene);
    this.root.scale.setScalar(scale);
    this.bones = {}; this.root.traverse(o => { if (o.isBone) this.bones[o.name] = o; if (o.isSkinnedMesh) o.frustumCulled = false; });
    this.boneList = lib.names.map(n => this.bones[n] ?? null);
    this.meshes = []; this.root.traverse(o => { if (o.isSkinnedMesh) this.meshes.push(o); });
    this.legScale = body.leg / lib.legRef;
    this._Q = new Float32Array(lib.J * 4); this._P = new Float32Array(3);
    if (materials) this.dress(materials);
  }
  dress(fn) { for (const m of this.meshes) { const r = fn(m.userData.role, m); if (r) m.material = r; } return this; }
  set castShadow(v) { for (const m of this.meshes) m.castShadow = v; }

  // Pose from a weighted list of [clipName, localTime, weight]; weights are normalised.
  blend(list) {
    const Q = this._Q.fill(0), P = this._P.fill(0); let W = 0;
    for (const [name, time, w] of list) if (w > 1e-4) { accumulate(clip(name), time, w, Q, P, null); W += w; }
    if (W <= 0) return this;
    const J = lib.J, bl = this.boneList;
    for (let j = 0; j < J; j++) {
      const b = bl[j]; if (!b) continue; const o = j * 4;
      const l = Math.hypot(Q[o], Q[o + 1], Q[o + 2], Q[o + 3]) || 1;
      b.quaternion.set(Q[o] / l, Q[o + 1] / l, Q[o + 2] / l, Q[o + 3] / l);
    }
    const pel = this.bones.pelvis, s = this.legScale;
    pel.position.set(P[0] / W * s, P[1] / W * s, P[2] / W * s).sub(this.bones.Root.position);
    return this;
  }
  play(name, time) { return this.blend([[name, time, 1]]); }
  update() { this.root.updateMatrixWorld(true); return this; }

  // Additive rotations (radians, XYZ euler in the bone's local = character-aligned frame).
  offset(map, k = 1) {
    for (const b in map) { const n = this.bones[b]; if (!n) continue; const [x, y, z] = map[b];
      _q.setFromEuler(new THREE.Euler(x * k, y * k, z * k)); n.quaternion.premultiply(_q); }
    return this;
  }

  // ---- world-space helpers (call after root/pose changes; they update matrices themselves)
  worldPos(bone, out = new THREE.Vector3()) { return out.setFromMatrixPosition(this.bones[bone].matrixWorld); }
  setWorldQuat(bone, qw) { // set a bone's local rotation so that its world rotation is qw
    const b = this.bones[bone]; b.parent.getWorldQuaternion(_q2); b.quaternion.copy(_q2.invert().multiply(qw)); b.updateMatrixWorld(true);
  }
  rotateWorld(bone, qdelta) { const b = this.bones[bone]; b.getWorldQuaternion(_q); this.setWorldQuat(bone, _q.premultiply(qdelta)); }

  // Two-bone IK: put the end joint at `target` (world), weight w; pole = world point the middle joint bends towards.
  ik(upper, lower, end, target, w = 1, pole = null) {
    if (w <= 1e-4) return this;
    this.root.updateMatrixWorld(true);
    const H = this.worldPos(upper), K = this.worldPos(lower, _v2.clone()), A = this.worldPos(end, _v3.clone());
    const endQ = this.bones[end].getWorldQuaternion(new THREE.Quaternion());
    const T = A.clone().lerp(target, w);
    const l1 = H.distanceTo(K), l2 = K.distanceTo(A);
    const d = T.clone().sub(H); const L = THREE.MathUtils.clamp(d.length(), Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4); d.normalize();
    const pl = (pole ? pole.clone() : K.clone()).sub(H); pl.sub(d.clone().multiplyScalar(pl.dot(d)));
    if (pl.lengthSq() < 1e-10) pl.set(0, 0, 1); pl.normalize();
    const a = THREE.MathUtils.clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1);
    const K2 = H.clone().addScaledVector(d, l1 * a).addScaledVector(pl, l1 * Math.sqrt(1 - a * a));
    const T2 = H.clone().addScaledVector(d, L);
    const r1 = new THREE.Quaternion().setFromUnitVectors(K.clone().sub(H).normalize(), K2.clone().sub(H).normalize());
    this.rotateWorld(upper, r1);
    const K3 = this.worldPos(lower, new THREE.Vector3()), A3 = this.worldPos(end, new THREE.Vector3());
    const r2 = new THREE.Quaternion().setFromUnitVectors(A3.sub(K3).normalize(), T2.sub(K3).normalize());
    this.rotateWorld(lower, r2);
    this.setWorldQuat(end, endQ); // end effector keeps its world orientation
    return this;
  }
  reach(side, target, w = 1, pole = null) {
    const s = side[0];
    const p = pole ?? this.worldPos(`lowerarm_${s}`).add(new THREE.Vector3(s === 'l' ? 0.3 : -0.3, -0.5, -0.2).applyQuaternion(this.root.getWorldQuaternion(new THREE.Quaternion())));
    return this.ik(`upperarm_${s}`, `lowerarm_${s}`, `hand_${s}`, target, w, p);
  }
  // Aim the head (and a little of the spine) at a world point: each bone takes a share of the
  // remaining error (spine 20 %, neck 45 %, head the rest), clamped to `max` radians overall.
  lookAt(target, w = 1, { max = 1.2 } = {}) {
    if (w <= 1e-4) return this;
    this.root.updateMatrixWorld(true);
    for (const [bone, k] of [['spine_03', 0.2], ['neck_01', 0.45], ['head', 1]]) {
      const hp = this.worldPos('head');
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.bones.head.getWorldQuaternion(new THREE.Quaternion()));
      const want = target.clone().sub(hp).normalize();
      const ang = Math.min(fwd.angleTo(want), max); if (ang < 1e-4) continue;
      const ax = fwd.clone().cross(want).normalize();
      this.rotateWorld(bone, new THREE.Quaternion().setFromAxisAngle(ax, ang * k * w));
    }
    return this;
  }
}

// ------------------------------------------------------------------ paths and walking
// A ground path through [[x, z], ...] (or [x, y, z]); C1 centripetal Catmull-Rom, arc-length table.
export function groundPath(points, { y = 0, samples = 400 } = {}) {
  const pts = points.map(p => p.length === 3 ? new THREE.Vector3(...p) : new THREE.Vector3(p[0], y, p[1]));
  const curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : new THREE.LineCurve3(pts[0], pts[1]);
  const tab = [0], P = [curve.getPoint(0)];
  for (let i = 1; i <= samples; i++) { const p = curve.getPoint(i / samples); tab.push(tab[i - 1] + p.distanceTo(P[i - 1])); P.push(p); }
  const length = tab[samples];
  const uAt = (s) => { s = Math.min(Math.max(s, 0), length); let lo = 0, hi = samples; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] < s) lo = m; else hi = m; }
    return (lo + (s - tab[lo]) / Math.max(1e-9, tab[hi] - tab[lo])) / samples; };
  return { length, curve,
    at: (s) => curve.getPoint(uAt(s)),
    tangent: (s) => { const e = 0.05; return curve.getPoint(uAt(s + e)).sub(curve.getPoint(uAt(s - e))).setY(0).normalize(); } };
}

// Distance along the path at time t for a walk that starts at t0, eases up to `speed` over
// `accel` s, cruises, and eases to a stop over `decel` s exactly at distance `dist`.
// Cosine velocity ramps: velocity is C1, position C2. Returns { s(t), v(t), tEnd }.
export function gait({ t0 = 0, speed = 1.35, dist, accel = 0.9, decel = 1.1 }) {
  const da = speed * accel / 2, dd = speed * decel / 2;
  let a = accel, b = decel, v = speed;
  if (da + dd > dist) { const k = dist / (da + dd); a *= Math.sqrt(k); b *= Math.sqrt(k); v *= Math.sqrt(k); }
  const cruise = Math.max(0, (dist - v * a / 2 - v * b / 2) / v);
  const T = a + cruise + b;
  const s = (t) => { t -= t0; if (t <= 0) return 0; if (t >= T) return dist;
    if (t < a) return v * (t / 2 - a / (2 * Math.PI) * Math.sin(Math.PI * t / a));
    const s1 = v * a / 2; if (t < a + cruise) return s1 + v * (t - a);
    const q = t - a - cruise; return s1 + v * cruise + v * (q / 2 + b / (2 * Math.PI) * Math.sin(Math.PI * q / b)); };
  const vel = (t) => { t -= t0; if (t <= 0 || t >= T) return 0; if (t < a) return v * (1 - Math.cos(Math.PI * t / a)) / 2;
    if (t < a + cruise) return v; const q = t - a - cruise; return v * (1 + Math.cos(Math.PI * q / b)) / 2; };
  return { s, v: vel, tEnd: t0 + T, speed: v };
}

// Walk a person along a path, deterministic in t.
//   path   groundPath(...) or point list;  opts.clip ('walk'), opts.idle ('idle'), opts.speed (m/s),
//   opts.t0 / accel / decel / dist (default path length), opts.phase (cycles), opts.footLock (true)
// Gait phase is driven by distance travelled (phase = s / stride), so the planted foot's speed
// relative to the ground is exactly zero at any speed; foot locking (two-bone IK on the planted
// ankle) then removes the residual slide from turning and blending.
export function walker(person, path, opts = {}) {
  const P = Array.isArray(path) ? groundPath(path) : path;
  const c = clip(opts.clip ?? 'walk'); const idle = opts.idle ?? 'idle';
  const stride = c.stride * person.legScale * (opts.strideScale ?? 1);
  const g = gait({ dist: opts.dist ?? P.length, speed: opts.speed ?? c.speed * person.legScale, t0: opts.t0 ?? 0, accel: opts.accel ?? 0.9, decel: opts.decel ?? 1.1 });
  const ph0 = opts.phase ?? 0;
  const phase = (t) => g.s(t) / stride + ph0;              // cycles
  const yawAt = (t) => { const d = P.tangent(Math.min(g.s(t) + 0.25, P.length - 0.01)); return Math.atan2(d.x, d.z); };
  const wWalk = (t) => { const k = Math.min(1, g.v(t) / (0.45 * g.speed)); return k * k * (3 - 2 * k); };
  const place = (t, obj) => { const p = P.at(g.s(t)); obj.position.set(p.x, p.y, p.z); obj.rotation.set(0, yawAt(t) + (opts.yaw ?? 0), 0); };
  const pose = (t) => {
    const w = wWalk(t), ct = phase(t) * c.duration;
    person.blend([[c.name, ct, w], [idle, t - (opts.t0 ?? 0) + (opts.idlePhase ?? 0), 1 - w]]);
  };
  // the time at which the walk phase was `ph` (phase is monotonic; bisection)
  const timeOfPhase = (ph, tHi) => { let lo = (opts.t0 ?? 0) - 1, hi = tHi; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (phase(m) < ph) lo = m; else hi = m; } return hi; };
  const lockOn = opts.footLock !== false;
  const api = { path: P, gait: g, phase, tEnd: g.tEnd, clip: c };
  api.update = (t) => {
    place(t, person.root); pose(t); person.update();
    if (!lockOn) return person;
    const w = wWalk(t); if (w < 0.02) return person;
    const locks = [];
    for (const s of ['l', 'r']) {
      const ph = phase(t), ct = ph * c.duration, n = c.n, fx = (((ct * c.fps) % n) + n) % n;
      const k = contactAt(c, ct, s); if (k <= 0) continue;
      const arr = c.contacts[s]; let f = Math.floor(fx), back = 0;
      while (arr[(f - 1 + n) % n] && back < n) { f = (f - 1 + n) % n; back++; }
      const frames = back + (fx - Math.floor(fx));
      const ts = timeOfPhase(ph - frames / n, t);
      locks.push([s, ts, k]);
    }
    const pins = locks.map(([s, ts, k]) => { place(ts, person.root); pose(ts); person.update(); return [s, person.worldPos(`foot_${s}`), k]; });
    if (pins.length) { place(t, person.root); pose(t); person.update(); }
    for (const [s, pin, k] of pins) person.ik(`thigh_${s}`, `calf_${s}`, `foot_${s}`, pin, k * w);
    person.update();
    return person;
  };
  return api;
}
