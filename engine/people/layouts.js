// engine/people/layouts.js: agent lists for crowd() (pure functions of a seed).
// Each returns [{ pos, yaw, body, clip, phase, rate, scale, tint, vel?, wrap? }].
import * as K from 'kit';

const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const gauss = (r) => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) / 0.58; };
// clothing tints: mostly dark, desaturated city colours; multiplied over garment textures
export const PALETTE = {
  street: [[0.55, 0.55, 0.58], [0.35, 0.36, 0.4], [0.7, 0.66, 0.6], [0.45, 0.4, 0.36], [0.3, 0.32, 0.3], [0.62, 0.5, 0.42], [0.5, 0.52, 0.6], [0.8, 0.78, 0.74]],
  office: [[0.9, 0.9, 0.92], [0.75, 0.8, 0.9], [0.55, 0.57, 0.62], [0.85, 0.82, 0.76]],
  protest: [[0.4, 0.4, 0.42], [0.3, 0.3, 0.32], [0.55, 0.5, 0.45], [0.6, 0.25, 0.22], [0.25, 0.3, 0.38], [0.7, 0.68, 0.64]],
};
const heightVar = (r) => K.clamp(1 + gauss(r) * 0.04, 0.9, 1.1); // ~ +-7 cm around 1.78 m

// A protest: a dense, roughly elliptical mass facing a focus (a stage, a line of police), denser
// at the front; most chant/raise fists, some talk, some wait.
export function protest({ count = 600, center = [0, 0], radius = [14, 9], facing = 0, seed = 1,
  bodies = ['protestor', 'hoodie', 'casual_a', 'casual_b', 'casual_f'], clips = { fists: 0.4, idle: 0.25, wait: 0.15, talk: 0.1, argue: 0.1 } } = {}) {
  const r = K.rng(seed); const out = []; const cs = Object.entries(clips);
  const pickClip = () => { let u = r(), acc = 0; for (const [c, w] of cs) { acc += w; if (u <= acc) return c; } return cs[0][0]; };
  const ca = Math.cos(facing), sa = Math.sin(facing);
  let tries = 0; const cell = new Map(); const minD = 0.62;
  while (out.length < count && tries++ < count * 30) {
    // rejection-sample a disc, biased to the front (towards the focus)
    const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) continue;
    const front = (v + 1) / 2; if (r() > 0.45 + 0.55 * front) continue;
    const lx = u * radius[0], lz = v * radius[1];
    const x = center[0] + lx * ca + lz * sa, z = center[1] - lx * sa + lz * ca;
    const key = `${Math.floor(x / minD)},${Math.floor(z / minD)}`; if (cell.has(key)) continue; cell.set(key, 1);
    out.push({ pos: [x, z], yaw: facing + gauss(r) * 0.35, body: pick(r, bodies), clip: pickClip(), phase: r() * 20, rate: 0.9 + r() * 0.2,
      scale: heightVar(r), tint: pick(r, PALETTE.protest) });
  }
  return out;
}

// A street: two sidewalks of walkers in both directions (wrapping along the street) plus loiterers.
export function street({ count = 300, length = 120, width = 3.2, gap = 9, axis = 'z', seed = 2,
  bodies = ['suit', 'casual_a', 'casual_b', 'casual_f', 'overcoat', 'office_f', 'hoodie'], walks = ['walk', 'walk_b', 'walk_c', 'walk_slow', 'walk_brisk'], idles = ['idle', 'wait', 'talk', 'phone'], standing = 0.15 } = {}) {
  const r = K.rng(seed); const out = [];
  for (let i = 0; i < count; i++) {
    const side = r() < 0.5 ? -1 : 1; const lane = side * (gap / 2 + r() * width); const along = (r() - 0.5) * length;
    const stand = r() < standing; const dir = r() < 0.5 ? 1 : -1; const v = (1.15 + r() * 0.4) * dir;
    const pos = axis === 'z' ? [lane, along] : [along, lane];
    const a = { pos, body: pick(r, bodies), scale: heightVar(r), tint: pick(r, PALETTE.street), phase: r() * 10 };
    if (stand) Object.assign(a, { clip: pick(r, idles), yaw: r() * Math.PI * 2, rate: 0.9 + r() * 0.2 });
    else Object.assign(a, { clip: pick(r, walks), vel: axis === 'z' ? [0, v] : [v, 0], wrap: { axis, min: -length / 2, max: length / 2 } });
    out.push(a);
  }
  return out;
}

// An airport concourse: a wide hall, cross-flows in four headings, clusters waiting.
export function concourse({ count = 400, size = [80, 40], seed = 3, bodies = ['suit', 'casual_a', 'casual_b', 'casual_f', 'office_f', 'overcoat', 'hoodie'] } = {}) {
  const r = K.rng(seed); const out = [];
  for (let i = 0; i < count; i++) {
    const x = (r() - 0.5) * size[0], z = (r() - 0.5) * size[1];
    const base = { body: pick(r, bodies), scale: heightVar(r), tint: pick(r, PALETTE.street), phase: r() * 10 };
    if (r() < 0.55) { const h = r() < 0.5; const d = r() < 0.5 ? 1 : -1; const v = (1.2 + r() * 0.35) * d;
      out.push({ ...base, pos: [x, z], clip: pick(r, ['walk', 'walk_b', 'walk_c', 'walk_brisk']), vel: h ? [v, 0] : [0, v], wrap: h ? { axis: 'x', min: -size[0] / 2, max: size[0] / 2 } : { axis: 'z', min: -size[1] / 2, max: size[1] / 2 } }); }
    else out.push({ ...base, pos: [x, z], yaw: r() * Math.PI * 2, clip: pick(r, ['idle', 'wait', 'phone', 'talk', 'look_around']), rate: 0.9 + r() * 0.2 });
  }
  return out;
}

// An open-plan office: rows of desks, a seated worker at most; a few standing / walking aisles.
// Returns { agents, desks:[{x,z,yaw}] } so the set can place furniture at the same spots.
export function office({ rows = 6, cols = 8, pitch = [3.2, 2.0], seed = 4, occupancy = 0.85, walkers = 8,
  bodies = ['office', 'office_f', 'analyst', 'suit', 'casual_f', 'suit_f'] } = {}) {
  const r = K.rng(seed); const agents = [], desks = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = (j - (cols - 1) / 2) * pitch[0], z = (i - (rows - 1) / 2) * pitch[1];
    const yaw = i % 2 ? Math.PI : 0; desks.push({ x, z, yaw });
    if (r() < occupancy) agents.push({ pos: [x, z - Math.cos(yaw) * 0.55], yaw, body: pick(r, bodies), clip: r() < 0.7 ? 'sit_type' : pick(r, ['sit_idle', 'sit_think']), phase: r() * 10, rate: 0.9 + r() * 0.2, scale: heightVar(r), tint: pick(r, PALETTE.office) });
  }
  const L = cols * pitch[0];
  for (let k = 0; k < walkers; k++) { const lane = (Math.floor(r() * (rows / 2)) * 2 - rows / 2 + 1) * pitch[1] + pitch[1] / 2; const d = r() < 0.5 ? 1 : -1;
    agents.push({ pos: [(r() - 0.5) * L, lane], body: pick(r, bodies), clip: pick(r, ['walk', 'walk_b', 'walk_slow']), vel: [d * (1.1 + r() * 0.3), 0], wrap: { axis: 'x', min: -L / 2 - 2, max: L / 2 + 2 }, phase: r() * 5, scale: heightVar(r), tint: pick(r, PALETTE.office) }); }
  return { agents, desks };
}
