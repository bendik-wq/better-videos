// engine/people/acts.js: layered behaviours on top of mocap clips, all pure functions of t.
// A clip gives the body its weight and timing; an act pins the hands where the set needs them
// (keys, a placard pole, around an orb) with two-bone IK, and points the head at what matters.
import * as THREE from 'three';
import * as K from 'kit';
import { clip as PE_clip, lib as PE_lib } from './core.js';

const v3 = (a) => a.isVector3 ? a.clone() : new THREE.Vector3(...a);
// smooth deterministic noise in [-1, 1] (sum of sines with incommensurate rates)
const wob = (t, s) => (Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 2.9 + s * 1.3) * 0.3 + Math.sin(t * 4.3 + s * 2.1) * 0.2);

// Typing at a keyboard. keys: world centre of the keyboard (Vector3); screen: world point to look at.
// Fingers do the fast work, so the hands only make small, bursty moves (a hunt across the
// rows, a reach to the mouse on the right every few seconds).
export function typing(p, t, { clip = 'sit_idle', keys, screen, seed = 1, lean = 0.12, mouse = true, w = 1 } = {}) {
  p.play(clip, t + seed * 3.1);
  p.offset({ spine_01: [lean * 0.5, 0, 0], spine_02: [lean * 0.5, 0, 0] });
  p.update();
  const yaw = p.root.rotation.y; const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const burst = 0.5 + 0.5 * Math.sin(t * 0.9 + seed); // typing bursts and pauses
  const mouseK = mouse ? K.smooth(K.clamp((Math.sin(t * 0.37 + seed * 2) - 0.55) * 4)) : 0; // right hand to the mouse now and then
  for (const s of ['l', 'r']) {
    const sx = s === 'l' ? 1 : -1;
    const base = v3(keys).addScaledVector(right, sx * 0.1).addScaledVector(fwd, -0.02).setY(keys.y + 0.035);
    base.addScaledVector(right, 0.012 * wob(t * 3.0 * (0.4 + burst), seed + sx)).addScaledVector(fwd, 0.01 * wob(t * 2.6, seed * 2 + sx));
    base.y += 0.008 * Math.max(0, wob(t * 6.0 * burst, seed * 3 + sx));
    if (s === 'r' && mouseK > 0) base.lerp(v3(keys).addScaledVector(right, -0.34).addScaledVector(fwd, 0.04).setY(keys.y + 0.03), mouseK);
    const pole = p.worldPos(`lowerarm_${s}`).addScaledVector(right, sx * 0.35).add(new THREE.Vector3(0, -0.4, 0));
    p.reach(s, base, w, pole);
  }
  if (screen) p.lookAt(v3(screen).add(new THREE.Vector3(0.05 * wob(t * 0.4, seed), 0.03 * wob(t * 0.3, seed + 4), 0)), 0.85 * w);
  return p;
}

// Holding a placard on a pole with both hands (raised; it pumps with the chant).
// placard: a props.placard() group added to the scene; the act positions it each frame.
export function holdPlacard(p, t, placard, { clip = 'idle', seed = 1, height = 0.18, pump = 0.09, rate = 0.9, forward = 0.32 } = {}) {
  p.play(clip, t + seed * 2.3); p.update();
  const yaw = p.root.rotation.y; const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const chest = p.worldPos('spine_03');
  const k = Math.max(0, Math.sin((t + seed) * Math.PI * 2 * rate)) ** 2; // a beat: up on the shout
  const base = chest.clone().addScaledVector(fwd, forward).add(new THREE.Vector3(0, height + pump * k, 0)).addScaledVector(right, -0.04 * wob(t * 0.5, seed));
  // pole stands just in front of the chest, tilted a touch; hands at its two grips
  placard.position.copy(base).add(new THREE.Vector3(0, -0.62 - 0.12, 0));
  placard.rotation.set(0.05 * wob(t, seed), yaw + 0.1 * wob(t * 0.3, seed + 5), 0.06 * wob(t * 0.7, seed + 2));
  placard.updateMatrixWorld(true);
  const [g0, g1] = placard.userData.grip.map(g => g.clone().applyMatrix4(placard.matrixWorld));
  p.reach('r', g0, 1, p.worldPos('lowerarm_r').addScaledVector(right, -0.4).add(new THREE.Vector3(0, -0.3, 0)));
  p.reach('l', g1, 1, p.worldPos('lowerarm_l').addScaledVector(right, 0.4).add(new THREE.Vector3(0, -0.3, 0)));
  return p;
}

// Hands cupped around (not touching) an orb at `center`; the figure leans in slowly.
export function attendOrb(p, t, center, { clip = 'idle', seed = 1, lean = 0.25, open = 0.17, w = 1 } = {}) {
  p.play(clip, t * 0.6 + seed); // slowed: a still, attentive body
  p.offset({ spine_01: [lean * 0.4, 0, 0], spine_02: [lean * 0.35, 0, 0], spine_03: [lean * 0.25, 0, 0], neck_01: [lean * 0.4, 0, 0] });
  p.update();
  const yaw = p.root.rotation.y; const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const c = v3(center); const breath = 0.01 * Math.sin(t * 1.3 + seed);
  for (const s of ['l', 'r']) { const sx = s === 'l' ? 1 : -1;
    const tgt = c.clone().addScaledVector(right, sx * (open + breath)).addScaledVector(fwd, -0.05).add(new THREE.Vector3(0, 0.02 + 0.01 * wob(t * 0.5, seed + sx), 0));
    p.reach(s, tgt, w, p.worldPos(`lowerarm_${s}`).addScaledVector(right, sx * 0.5).add(new THREE.Vector3(0, -0.35, 0)));
    // palms toward the orb: turn the hand about the forearm axis
  }
  p.lookAt(c, 0.9 * w);
  return p;
}

// Point at a world target with the right arm (blend w), body otherwise from its clip.
// The index finger extends (finger rotations from the 'point' clip's right hand, mirrored for the
// left, blended by w). side: 'r' | 'l'.
export function pointAt(p, target, w = 1, side = 'r') {
  if (w <= 0) return p;
  const s = side[0], up = `upperarm_${s}`, lo = `lowerarm_${s}`, ha = `hand_${s}`;
  const sh = p.worldPos(up); const dir = v3(target).sub(sh).normalize();
  const len = sh.distanceTo(p.worldPos(lo)) + p.worldPos(lo).distanceTo(p.worldPos(ha));
  p.reach(s, sh.clone().addScaledVector(dir, len * 0.985), w, sh.clone().add(new THREE.Vector3(0, -0.6, 0)).addScaledVector(dir, 0.3));
  const c = PE_clip('point');
  for (const f of ['index', 'middle', 'ring', 'pinky', 'thumb']) for (const k of [1, 2, 3]) {
    const j = PE_lib.index[`${f}_0${k}_r`]; const bone = p.bones[`${f}_0${k}_${s}`]; if (j === undefined || !bone) continue;
    const q = new THREE.Quaternion(c.q[j * 4], c.q[j * 4 + 1], c.q[j * 4 + 2], c.q[j * 4 + 3]);
    if (s === 'l') { q.y = -q.y; q.z = -q.z; } // mirror across the body's midplane (x -> -x)
    bone.quaternion.slerp(q, w);
  }
  p.update();
  return p;
}
