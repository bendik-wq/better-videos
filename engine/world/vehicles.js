// Vehicles: procedural low-poly cars (sedan, SUV, van), a semi tractor + trailer, an airliner.
// All share one shader (part ids per vertex: paint, glass, trim, tyre, rim, lamps), drawn as
// instanced fleets refilled every frame from pure functions of t: traffic(t) on roads, driver
// s(t) from a speed profile, wheels turning by s / r, headlight beams in the haze, light glows.
// (Kenney Car Kit, CC0, was evaluated: toy proportions; these are built to real dimensions.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { worldMaterial, GLSL_TONE, rng, clamp, lerp, smoother } from './core.js';
import { glowPoints } from './props.js';

const PART = { paint: 0, glass: 1, trim: 2, tyre: 3, head: 4, tail: 5, rim: 6, under: 7, amber: 8, cabin: 9, white: 10, chrome: 11 };
function tag(g, part) { g = g.index ? g.toNonIndexed() : g; const n = g.getAttribute('position').count; g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(n).fill(part), 1)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'aPart'].includes(k)) g.deleteAttribute(k); return g; }
const boxAt = (w, h, d, x, y, z, part) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return tag(g, part); };
// classify faces of a geometry by a function of (centre, normal) -> part
function classify(g, fn) {
  g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  const p = g.getAttribute('position'), n = g.getAttribute('normal'), part = new Float32Array(p.count);
  for (let i = 0; i < p.count; i += 3) {
    const c = [0, 1, 2].map(k => (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3 * (k === 0) + (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 * (k === 1) + (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 * (k === 2));
    const nn = [(n.getX(i) + n.getX(i + 1) + n.getX(i + 2)) / 3, (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3, (n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2)) / 3];
    part.fill(fn(c, nn), i, i + 3);
  }
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'aPart'].includes(k)) g.deleteAttribute(k);
  return g;
}

// ---------------------------------------------------------------- car bodies (x forward, y up, z right)
// Lofted: one cross-section per station along the length (a superellipse whose top narrows above the
// belt line - tumblehome), the side profile and plan taper interpolated from key points with a
// monotone spline, wheel arches pressed in around each wheel. Parts are classified per face
// (paint, glass, trim, lamps, under) so one instanced material shades every car.
function spl(K) { // K: [[x, v], ...] sorted; smooth (cosine-eased) interpolation
  return (x) => { if (x <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const t = (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0]), e = (1 - Math.cos(Math.PI * t)) / 2; return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * e; } return K.at(-1)[1]; };
}
function lofted({ L, W, top, bot, half, belt, glassX, roofX, wheels, wr, head, tail, grille, pillars = null, taper = 0.16, ex = 3.2, nx = 64, nr = 28 }) {
  const T = spl(top), Bt = spl(bot), Hw = spl(half), pos = [], idx = [];
  const ar = wr + 0.07;
  for (let i = 0; i <= nx; i++) {
    const xn = -1 + 2 * i / nx, x = xn * L / 2;
    const yt = T(xn), yb = Bt(xn), hw = Hw(xn) * W / 2;
    const yc = (yt + yb) / 2, hy = (yt - yb) / 2;
    for (let j = 0; j <= nr; j++) {
      const a = -Math.PI / 2 + 2 * Math.PI * j / nr; // start at the bottom centre, go round
      const c = Math.cos(a), sn = Math.sin(a);
      let y = yc + hy * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / ex);
      let z = hw * Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
      const k = Math.max(0, (y - belt) / Math.max(0.05, yt - belt)); z *= 1 - taper * Math.pow(k, 1.4);
      // wheel arches: press the side in around each wheel
      for (const [wx] of wheels) { const d = Math.hypot(x - wx, y - wr); if (d < ar && Math.abs(z) > hw * 0.55) { const q = 1 - d / ar; z *= 1 - 0.16 * Math.min(1, q * 4); y = Math.max(y, yb); } }
      pos.push(x, y, z);
    }
  }
  const R = nr + 1;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nr; j++) { const a0 = i * R + j, b0 = a0 + R; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
  // end caps (fans)
  for (const i of [0, nx]) { const c = pos.length / 3; let cx = 0, cy = 0; for (let j = 0; j <= nr; j++) { cx += pos[(i * R + j) * 3]; cy += pos[(i * R + j) * 3 + 1]; } pos.push(cx / R, cy / R, 0);
    for (let j = 0; j < nr; j++) idx.push(...(i ? [c, i * R + j, i * R + j + 1] : [c, i * R + j + 1, i * R + j])); }
  // smooth normals on the indexed loft, then expand: parts are decided per QUAD (two triangles) so
  // part borders follow the grid instead of zig-zagging
  const gi = new THREE.BufferGeometry(); gi.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gi.setIndex(idx); gi.computeVertexNormals();
  const nI = gi.getAttribute('normal');
  const P2 = new Float32Array(idx.length * 3), N2 = new Float32Array(idx.length * 3), part = new Float32Array(idx.length);
  idx.forEach((v, k) => { P2.set([pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]], k * 3); N2.set([nI.getX(v), nI.getY(v), nI.getZ(v)], k * 3); });
  const quads = nx * nr * 6;
  const partOf = (from, count) => { const c = [0, 0, 0], n = [0, 0, 0]; for (let k = from; k < from + count; k++) for (let d = 0; d < 3; d++) { c[d] += P2[k * 3 + d] / count; n[d] += N2[k * 3 + d] / count; } return cls(c, n); };
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
  const fill = () => { for (let k = 0; k < idx.length;) { const cnt = k < quads ? 6 : 3; part.fill(partOf(k, cnt), k, k + cnt); k += cnt; } g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); return g; };
  const cls = (c, n) => {
    const xn = c[0] / (L / 2), y = c[1], az = Math.abs(c[2]), hw = Hw(xn) * W / 2;
    if (n[1] < -0.55 || y < Bt(xn) + 0.06) return PART.under;
    for (const [wx] of wheels) if (Math.hypot(c[0] - wx, y - wr) < ar - 0.02 && az > hw * 0.5) return PART.under;
    if (head && xn > head[0] && y > head[1] && y < head[2] && az > hw * head[3]) return PART.head;
    if (tail && xn < tail[0] && y > tail[1] && y < tail[2] && az > hw * tail[3]) return PART.tail;
    if (grille && xn > grille[0] && y > grille[1] && y < grille[2] && az < hw * grille[3]) return PART.trim;
    if (y < Bt(xn) + 0.12 && (xn > 0.9 || xn < -0.92)) return PART.trim; // bumpers' lower valance
    if (y > belt && xn > glassX[0] && xn < glassX[1]) {
      if (n[1] > 0.75 && xn > roofX[0] && xn < roofX[1]) return PART.paint;   // roof skin
      if (Math.abs(n[2]) > 0.45) { // side glass: B pillar (black), C pillar (body colour), window frame top
        for (const px of pillars ?? []) if (Math.abs(xn - px) < 0.022) return PART.trim;
        if (xn < glassX[0] + 0.09 || y > T(xn) - 0.05) return PART.paint;
        if (y < belt + 0.035) return PART.trim;
      }
      return PART.glass;
    }
    return PART.paint;
  };
  return fill();
}
function carGeo(o) {
  const body = lofted(o);
  const parts = [body];
  for (const z of [-1, 1]) { // mirrors
    const m = new THREE.BoxGeometry(0.12, 0.11, 0.2); m.translate(o.mirror[0], o.mirror[1], z * (o.W / 2 + 0.06)); parts.push(tag(m, PART.paint));
  }
  const L = o.L, h = L / 2;
  return { geo: mergeGeometries(parts), wheels: o.wheels.map(([x, zf]) => [x, o.wr, zf]), wr: o.wr, tw: o.tw ?? 0.22, L, W: o.W,
    head: [[h - 0.05, o.lampY[0], -(o.W / 2 - 0.25)], [h - 0.05, o.lampY[0], o.W / 2 - 0.25]], tail: [[-h, o.lampY[1], -(o.W / 2 - 0.22)], [-h, o.lampY[1], o.W / 2 - 0.22]] };
}
const SEDAN = { L: 4.85, W: 1.84, wr: 0.33, belt: 0.93, ex: 5,
  top: [[-1, 0.52], [-0.985, 0.82], [-0.93, 0.95], [-0.72, 1.0], [-0.52, 1.07], [-0.36, 1.37], [-0.18, 1.45], [0.08, 1.44], [0.2, 1.33], [0.42, 0.98], [0.62, 0.9], [0.9, 0.8], [0.985, 0.66], [1, 0.42]],
  bot: [[-1, 0.42], [-0.85, 0.3], [0.85, 0.3], [1, 0.36]],
  half: [[-1, 0.8], [-0.94, 0.95], [-0.7, 1], [0.7, 1], [0.93, 0.95], [1, 0.78]],
  glassX: [-0.55, 0.43], roofX: [-0.38, 0.22], pillars: [-0.06], head: [0.93, 0.64, 0.75, 0.52], tail: [-0.94, 0.8, 0.9, 0.42], grille: [0.965, 0.45, 0.6, 0.42],
  wheels: [[1.42, -0.78], [1.42, 0.78], [-1.42, -0.78], [-1.42, 0.78]], mirror: [0.62, 1.0], lampY: [0.7, 0.85] };
const SUV = { L: 4.9, W: 1.96, wr: 0.38, belt: 1.12, taper: 0.1, ex: 6,
  top: [[-1, 0.62], [-0.99, 1.05], [-0.96, 1.6], [-0.88, 1.74], [-0.2, 1.76], [0.12, 1.74], [0.4, 1.18], [0.62, 1.1], [0.9, 1.02], [0.985, 0.86], [1, 0.55]],
  bot: [[-1, 0.5], [-0.85, 0.38], [0.85, 0.38], [1, 0.45]],
  half: [[-1, 0.86], [-0.95, 0.97], [-0.7, 1], [0.7, 1], [0.94, 0.96], [1, 0.84]],
  glassX: [-0.95, 0.38], roofX: [-0.9, 0.12], pillars: [-0.12, -0.6], head: [0.93, 0.84, 0.96, 0.52], tail: [-0.95, 0.92, 1.15, 0.45], grille: [0.965, 0.55, 0.8, 0.45],
  wheels: [[1.45, -0.84], [1.45, 0.84], [-1.45, -0.84], [-1.45, 0.84]], mirror: [0.48, 1.2], lampY: [0.9, 1.05] };
const VAN = { L: 5.4, W: 2.02, wr: 0.36, belt: 1.15, taper: 0.06, ex: 7,
  top: [[-1, 0.6], [-0.995, 1.5], [-0.98, 2.2], [-0.95, 2.3], [0.5, 2.32], [0.62, 2.2], [0.78, 1.25], [0.92, 1.1], [0.99, 0.9], [1, 0.6]],
  bot: [[-1, 0.45], [-0.88, 0.36], [0.88, 0.36], [1, 0.42]],
  half: [[-1, 0.9], [-0.96, 0.98], [-0.7, 1], [0.7, 1], [0.94, 0.95], [1, 0.84]],
  glassX: [0.45, 0.82], roofX: [0.4, 0.62], head: [0.94, 0.86, 0.98, 0.52], tail: [-0.97, 0.9, 1.35, 0.45], grille: [0.965, 0.55, 0.82, 0.45],
  wheels: [[1.7, -0.86], [1.7, 0.86], [-1.7, -0.86], [-1.7, 0.86]], mirror: [1.6, 1.3], lampY: [0.92, 1.1] };

// tractor: a long-nose conventional (Peterbilt 579 / Kenworth T680 proportions), lofted hood and cab,
// sleeper with fairing, chrome stacks, fuel tanks, fenders, steps; rear axles at -2.15 / -3.45
function tractorGeo() {
  const P = [];
  const rb = (w, h, d, x, y, z, part, r = 0.08) => { const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)); g.translate(x, y, z); P.push(tag(g, part)); };
  // hood + cab as one loft (x from the cab back -0.15 to the bumper 3.8)
  const hood = lofted({ L: 3.9, W: 2.42, wr: 0.52, belt: 2.3, taper: 0.12, ex: 3.6, nx: 40, nr: 24,
    top: [[-1, 2.95], [-0.2, 2.95], [-0.05, 2.9], [0.08, 2.1], [0.4, 1.98], [0.85, 1.85], [0.97, 1.7], [1, 1.2]],
    bot: [[-1, 1.05], [1, 0.95]], half: [[-1, 1], [0.05, 1], [0.1, 0.86], [0.9, 0.82], [1, 0.76]],
    glassX: [-0.3, 0.1], roofX: [-1, -0.06], head: [0.94, 1.32, 1.5, 0.5], tail: null, grille: [0.96, 1.1, 1.8, 0.6], wheels: [[1.0, -1.05], [1.0, 1.05]] });
  hood.translate(1.85, 0, 0); P.push(hood);
  rb(0.32, 0.36, 2.52, 3.86, 0.88, 0, PART.chrome, 0.1); // bumper
  rb(2.1, 2.9, 2.44, -1.05, 2.48, 0, PART.paint, 0.14); // sleeper
  rb(1.7, 0.42, 2.36, -0.95, 4.02, 0, PART.paint, 0.18); // roof fairing
  rb(7.4, 0.3, 0.96, -0.85, 0.98, 0, PART.under, 0.04); // frame rails
  for (const z of [-1, 1]) {
    const st = tag(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 12), PART.chrome); st.translate(-0.05, 3.3, z * 1.16); P.push(st);
    const tk = tag(new THREE.CylinderGeometry(0.34, 0.34, 1.4, 20).rotateZ(Math.PI / 2), PART.chrome); tk.translate(0.15, 0.82, z * 1.03); P.push(tk);
    rb(1.0, 0.1, 0.5, 2.6, 1.6, z * 1.08, PART.paint, 0.04); // fender
    rb(0.5, 0.06, 0.3, 0.45, 0.62, z * 1.08, PART.trim, 0.02); rb(0.5, 0.06, 0.3, 0.45, 0.32, z * 1.08, PART.trim, 0.02); // steps
    rb(0.08, 0.5, 0.06, 1.75, 2.75, z * 1.42, PART.chrome, 0.02); rb(0.06, 0.06, 0.22, 1.75, 2.6, z * 1.3, PART.chrome, 0.02); // mirror
    rb(0.6, 0.45, 0.04, -2.8, 0.75, z * 1.15, PART.under, 0.01); // mudflap
    P.push(boxAt(0.1, 0.08, 0.08, 1.95, 3.0, z * 0.85, PART.amber));
  }
  rb(0.25, 0.22, 2.1, 1.93, 3.05, 0, PART.paint, 0.08); // sun visor
  return { geo: mergeGeometries(P), wheels: [[2.85, 0.52, -1.02], [2.85, 0.52, 1.02], [-2.15, 0.52, -0.9], [-2.15, 0.52, 0.9], [-3.45, 0.52, -0.9], [-3.45, 0.52, 0.9]], wr: 0.52, tw: 0.3, dual: [0, 0, 1, 1, 1, 1], L: 7.8, W: 2.5,
    head: [[3.8, 1.42, -0.95], [3.8, 1.42, 0.95]], tail: [], marker: [[1.95, 3.0, -0.85], [1.95, 3.0, 0.85]] };
}
function trailerGeo() {
  // 53 ft dry van, kingpin at x = 0, box from +0.9 to -15.3, ribbed sides, side skirts, landing gear
  const P = [];
  const rb = (w, h, d, x, y, z, part, r = 0.05) => { const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)); g.translate(x, y, z); P.push(tag(g, part)); };
  rb(16.2, 2.75, 2.6, -7.2, 2.72, 0, PART.white, 0.06);
  rb(15.6, 0.25, 1.0, -7.2, 1.25, 0, PART.under, 0.02);
  rb(9.5, 0.75, 0.04, -6.5, 0.95, -1.27, PART.white, 0.01); rb(9.5, 0.75, 0.04, -6.5, 0.95, 1.27, PART.white, 0.01); // skirts
  rb(0.12, 0.38, 2.4, -15.3, 0.72, 0, PART.under, 0.02); // underride guard
  for (const z of [-0.8, 0.8]) rb(0.12, 0.9, 0.12, -1.3, 0.75, z, PART.under, 0.02); // landing gear
  for (const z of [-1, 1]) P.push(boxAt(0.06, 0.14, 0.24, -15.32, 1.35, z * 1.0, PART.tail));
  const markers = [];
  for (let x = 0.3; x > -15.3; x -= 3.9) for (const z of [-1, 1]) { P.push(boxAt(0.12, 0.08, 0.04, x, 1.45, z * 1.31, PART.amber)); markers.push([x, 1.45, z * 1.32]); }
  return { geo: mergeGeometries(P), wheels: [[-13.2, 0.52, -0.92], [-13.2, 0.52, 0.92], [-14.45, 0.52, -0.92], [-14.45, 0.52, 0.92]], wr: 0.52, tw: 0.3, dual: [1, 1, 1, 1], L: 16.2, W: 2.6, head: [], tail: [[-15.34, 1.35, -1], [-15.34, 1.35, 1]], marker: markers };
}
function planeGeo() {
  // narrow-body airliner, ~38 m long, 36 m span. x forward.
  const P = [];
  const prof = []; const Lf = 38;
  for (let i = 0; i <= 24; i++) { const t = i / 24; const x = -Lf / 2 + t * Lf; let r = 1.95; if (t > 0.88) r *= Math.sqrt(Math.max(0, 1 - ((t - 0.88) / 0.12) ** 2)) * 0.95 + 0.05; if (t < 0.25) r *= 0.35 + 0.65 * Math.sqrt(t / 0.25); prof.push(new THREE.Vector2(Math.max(0.02, r), x)); }
  const fus = new THREE.LatheGeometry(prof, 16); fus.rotateZ(-Math.PI / 2); P.push(classify(fus, (c) => c[0] > Lf / 2 - 3.3 && c[1] > 0.4 ? PART.glass : PART.white));
  const wing = new THREE.Shape(); wing.moveTo(3, 0); wing.lineTo(-4.5, 17.5); wing.lineTo(-6.2, 17.5); wing.lineTo(-4.2, 0); wing.lineTo(3, 0);
  for (const z of [-1, 1]) { const w = new THREE.ExtrudeGeometry(wing, { depth: 0.35, bevelEnabled: false }); w.rotateX(Math.PI / 2 * z); w.translate(-1, -0.7, 0); P.push(tag(w, PART.white));
    const eng = tag(new THREE.CylinderGeometry(0.95, 0.85, 3.6, 14).rotateZ(Math.PI / 2), PART.trim); eng.translate(1.2, -1.6, z * 5.8); P.push(eng);
    const st = new THREE.Shape(); st.moveTo(-15, 0); st.lineTo(-18.8, 6.2); st.lineTo(-19.8, 6.2); st.lineTo(-18.6, 0); st.lineTo(-15, 0);
    const s = new THREE.ExtrudeGeometry(st, { depth: 0.2, bevelEnabled: false }); s.rotateX(Math.PI / 2 * z); s.translate(0, 0.6, 0); P.push(tag(s, PART.white)); }
  const fin = new THREE.Shape(); fin.moveTo(-13.5, 1.5); fin.lineTo(-18.2, 8.6); fin.lineTo(-19.7, 8.6); fin.lineTo(-18.8, 1.5); fin.lineTo(-13.5, 1.5);
  const f = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false }); f.translate(0, 0, -0.15); P.push(tag(f, PART.paint));
  return { geo: mergeGeometries(P), wheels: [], wr: 1, L: 38, W: 36, head: [[17, -1.2, 0]], tail: [], nav: { left: [-5.6, -0.6, -17.5], right: [-5.6, -0.6, 17.5], tail: [-19.2, 0.5, 0], belly: [-2, -2.1, 0], top: [-2, 2.0, 0] } };
}
function wheelGeo() {
  // unit wheel (radius 1, width 1, axis z): tyre with rounded shoulders, a dished rim with five spokes
  const ri = 0.66, ro = 1, hw = 0.5;
  const pts = [[ri, -hw * 0.92], [ro - 0.1, -hw], [ro - 0.03, -hw * 0.92], [ro, -hw * 0.6], [ro, hw * 0.6], [ro - 0.03, hw * 0.92], [ro - 0.1, hw], [ri, hw * 0.92]].map(([r, z]) => new THREE.Vector2(r, z));
  const ty = new THREE.LatheGeometry(pts, 28); ty.rotateX(Math.PI / 2); // lathe axis y -> z
  const rim = new THREE.CylinderGeometry(ri, ri * 0.92, 0.14, 28, 1, false).rotateX(Math.PI / 2); rim.translate(0, 0, hw * 0.62);
  const rim2 = rim.clone(); rim2.rotateY(Math.PI);
  return mergeGeometries([tag(ty, PART.tyre), tag(rim, PART.rim), tag(rim2, PART.rim)]);
}

export const MODELS = {
  sedan: () => carGeo(SEDAN), suv: () => carGeo(SUV), van: () => carGeo(VAN),
  tractor: tractorGeo, trailer: trailerGeo, plane: planeGeo,
};

// ---------------------------------------------------------------- material
// Clear-coat paint (base: paint colour with metallic flake, rough .35; coat: sharp dielectric layer
// reflecting the sky / HDRI streets / night mirror), tinted glass with a dark cabin behind, chrome,
// rubber (ambientCG Rubber004) with sidewall lettering-free shading, lamps with lens cells that
// bloom. Door shut-lines and panel gaps in the shader. Lit by the shared sun (shadowed) + ambient.
export function vehicleMaterial(world) {
  return world._vehMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute float aPart; attribute vec3 aPaint; attribute vec4 aLit;
      varying vec3 vRel, vLocal, vN, vP; varying float vPart; varying vec3 vPaint; varying vec4 vLit;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vRel = wp.xyz; vLocal = wp.xyz + uOrigin;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vP = position; vPart = aPart; vPaint = aPaint; vLit = aLit;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vN, vP; varying float vPart; varying vec3 vPaint; varying vec4 vLit;
      void main() {
        vec3 n = normalize(vN); vec3 v = normalize(-vRel);
        int p = int(vPart + .5);
        float paint = p == 0 || p == 10 ? 1. : 0.;
        vec3 alb = vPaint; float rough = .35, coat = 1., metal = .5; vec3 emit = vec3(0.);
        // shut-lines (doors, hood, boot) as thin dark grooves on the paint
        float gap = 0.;
        if (p == 0) { float ax = abs(vP.x); gap = (1. - smoothstep(.004, .012, abs(fract((vP.x + 2.43) / 1.21) - .5) * 1.21 - .59)) * step(.42, vP.y) * step(vP.y, 1.02) * step(ax, 1.6); alb *= 1. - gap * .7; }
        if (p == 1) { alb = vec3(.012, .014, .016); rough = .03; coat = 1.; metal = 0.; }
        else if (p == 2 || p == 7 || p == 9) { alb = vec3(.025); rough = .6; coat = .2; metal = 0.; }
        else if (p == 3) { vec2 tuv = vec2(atan(vP.y, vP.x) * .5, vP.z) ; vec4 R = pbrA(L_RUBBER, tuv); alb = R.rgb * .25 + .008; rough = .85; coat = 0.; metal = 0.; }
        else if (p == 6) { float a = atan(vP.y, vP.x); float r = length(vP.xy); float spokes = smoothstep(.25, .55, abs(sin(a * 2.5))) * step(.22, r) * step(r, .6);
          alb = mix(vec3(.55, .56, .58), vec3(.015), spokes); rough = .25; coat = .3; metal = 1.; }
        else if (p == 4) { vec2 c = fract(vP.zy * vec2(18., 22.)); float cellL = .6 + .4 * smoothstep(.5, .2, length(c - .5)); alb = vec3(.5); rough = .05; coat = 1.; metal = 0.; emit = vec3(1., .94, .84) * 30. * vLit.x * cellL; }
        else if (p == 5) { vec2 c = fract(vP.zy * vec2(14., 20.)); float cellL = .55 + .45 * smoothstep(.5, .15, length(c - .5)); alb = vec3(.18, .01, .01); rough = .1; coat = 1.; metal = 0.;
          emit = vec3(1., .02, .008) * (.7 + 2.2 * vLit.y) * max(vLit.x, vLit.y) * cellL * 2.; }
        else if (p == 8) { alb = vec3(.3, .2, .05); rough = .2; metal = 0.; emit = vec3(1., .55, .12) * 5. * vLit.x; }
        else if (p == 10) { float rib = smoothstep(.04, .0, abs(fract(vP.x / 1.22) - .5) - .44); vec4 M = pbrA(L_METAL, vP.xy * vec2(.5, .5));
          alb = vec3(.62, .62, .6) * (.88 + .12 * rib) * (.85 + .15 * smoothstep(.8, 2.4, vP.y)) * mix(vec3(1.), M.rgb * 1.6, .25); rough = .4; coat = .1; metal = 0.; }
        else if (p == 11) { alb = vec3(.75); rough = .08; coat = 0.; metal = 1.; }
        // metallic flake in the base coat (sub-pixel sparkle, stable in object space)
        if (p == 0) { float fl = texture(uNoise, vP.xy * 3.1 + vP.z * 1.7).a; alb *= .92 + .16 * fl; }
        float sv = sunVis(vLocal, n);
        vec3 F0 = mix(vec3(.04), alb, metal);
        vec3 diff = alb * (1. - metal);
        vec3 col = diff * lightDiffuseV(n, vLocal, sv) + diff * headlights(vLocal, n) * .3;
        col += diff * vec3(1., .55, .24) * .35 * uNight * (n.y * .5 + .5);   // overhead sodium on lit roads
        float nv = max(dot(n, v), 1e-3);
        vec3 rf = reflect(-v, n);
        // environment: sky above, HDRI (real streets) near the ground, the night mirror is not used here
        vec3 envS = skyEnv(normalize(rf + vec3(0., .02, 0.)));
        vec3 envB = envS, envC = envS;
        if (uEnvW > .001) { envB = mix(envS, envHdri(rf, rough), uEnvW); envC = mix(envS, envHdri(rf, .02), uEnvW); }
        // ground reflected in the lower body: dark road
        float down = smoothstep(.05, -.25, rf.y); envB = mix(envB, uAmbGround * .5, down * .6); envC = mix(envC, uAmbGround * .4 + uCityGlow * .1, down * .6);
        // overhead sodium lamps streaking over the body at night
        float overhead = smoothstep(.55, .95, rf.y) * uNight * smoothstep(.75, 1., sin(dot(vLocal.xz, vec2(.7, .7)) * .12) * .5 + .5);
        envC += vec3(1., .6, .28) * overhead * 2.5;
        col += envB * fresnelR(nv, F0, rough) * (1. - rough * .7) + ggxSun(n, v, max(rough, .08), F0) * sv;
        // clear coat on paint (and the glass / lamp lenses): sharp, ior 1.5
        vec3 Fc = fresnelR(nv, vec3(.04), .02) * coat;
        col = col * (1. - Fc) + envC * Fc + ggxSun(n, v, .03, vec3(.04)) * sv * coat;
        col += emit;
        col = applyFog(col, vRel, vLocal);
        col = mix(col, uMapRoad * 1.3, uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
  });
}
// soft contact shadow under each vehicle (ambient occlusion on the road): multiplied over the ground
function contactMaterial(world) {
  return world._contactMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`varying vec2 vUv; varying vec3 vRel; void main() { vUv = uv; vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vRel = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`varying vec2 vUv; varying vec3 vRel; void main() { vec2 q = (vUv - .5) * 2.; float d = length(max(abs(q) - vec2(.62, .35), 0.)) / .45;
      float a = (1. - smoothstep(0., 1., d)) * .78 * (1. - uMap) * (1. - smoothstep(300., 900., length(vRel)));
      gl_FragColor = vec4(vec3(1. - a), 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
  });
}
function beamMaterial(world) {
  return world._beamMat ??= worldMaterial(world.U, {
    uniforms: { uBeamLen: { value: 30 } },
    vertex: /* glsl */`
      attribute vec4 aLit; varying vec3 vRel, vN; varying float vAlong, vI;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vRel = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vAlong = position.x; vI = aLit.x; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vN; varying float vAlong, vI;
      void main() { vec3 v = normalize(-vRel); float edge = pow(abs(dot(normalize(vN), v)), 1.5);
        float k = pow(1. - clamp(vAlong, 0., 1.), 2.) * smoothstep(0., .04, vAlong);
        float haze = clamp(uHazeDen * 9000. + uCloudFog * 400., .15, 1.);
        vec3 col = vec3(1., .9, .75) * edge * k * vI * haze * .14 * (1. - uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------- fleet (instanced, refilled each frame)
export function fleet(world, { capacity = {}, beams = true } = {}) {
  const group = new THREE.Group(); group.name = 'fleet';
  const mat = vehicleMaterial(world), wGeo = wheelGeo();
  const kinds = {};
  const cap = { sedan: 120, suv: 80, van: 40, tractor: 30, trailer: 30, plane: 2, ...capacity };
  let wheelCap = 0, lightCap = 0;
  for (const [k, n] of Object.entries(cap)) {
    if (!n) continue; const M = MODELS[k](); const geo = M.geo.clone();
    const im = new THREE.InstancedMesh(geo, mat, n); im.count = 0; im.frustumCulled = false;
    geo.setAttribute('aPaint', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
    group.add(im); kinds[k] = { M, im, n, used: 0 };
    wheelCap += n * M.wheels.length; lightCap += n * (M.head.length + M.tail.length + (M.marker?.length ?? 0) + (M.nav ? 5 : 0));
  }
  const wheels = new THREE.InstancedMesh(wGeo, mat, Math.max(1, wheelCap)); wheels.count = 0; wheels.frustumCulled = false;
  wGeo.setAttribute('aPaint', new THREE.InstancedBufferAttribute(new Float32Array(wheels.instanceMatrix.count * 3), 3)); wGeo.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(wheels.instanceMatrix.count * 4), 4));
  group.add(wheels);
  const beamCap = beams ? (cap.sedan + cap.suv + cap.van + cap.tractor) * 2 : 0;
  let beamMesh = null;
  if (beamCap) {
    const cone = new THREE.CylinderGeometry(1, 0.03, 1, 20, 1, true); cone.rotateZ(-Math.PI / 2); cone.translate(0.5, 0, 0); // x: 0 at lamp, 1 at far end
    cone.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(beamCap * 4), 4));
    beamMesh = new THREE.InstancedMesh(cone, beamMaterial(world), beamCap); beamMesh.count = 0; beamMesh.frustumCulled = false; beamMesh.renderOrder = 30; beamMesh.userData.noShadow = true; group.add(beamMesh);
  }
  const contact = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), contactMaterial(world), Object.values(cap).reduce((a, b) => a + b, 0));
  contact.count = 0; contact.frustumCulled = false; contact.renderOrder = 4.5; contact.userData.noShadow = true; contact.name = 'contact'; group.add(contact);
  let nC = 0;
  const glows = glowPoints(world, Math.max(1, lightCap), { size: 0.3, halo: 1.6, minPx: 1.2, night: false, intensity: 1.4, maxPx: 26 });
  group.add(glows.points);
  const m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3(), up = new THREE.Vector3();
  let nW = 0, nB = 0, nG = 0;
  const api = {
    group, kinds, glows,
    begin() { for (const k in kinds) kinds[k].used = 0; nW = 0; nB = 0; nG = 0; nC = 0; },
    // pose: { pos: Vector3 (local), quat: Quaternion }, wheelAngle (rad), paint [r,g,b], lights 0..1, brake 0..1
    // roll (rad, + = lean right) and pitch (rad, + = nose up) tilt the body on its suspension; wheels stay planted
    add(kind, pose, { paint = [0.3, 0.3, 0.32], lights = 1, brake = 0, wheelAngle = 0, beam = true, scale = 1, roll = 0, pitch = 0 } = {}) {
      const K = kinds[kind]; if (!K || K.used >= K.n) return;
      const i = K.used++; sc.setScalar(scale); m4.compose(pose.pos, pose.quat, sc);
      if (roll || pitch) { const pv = 0.55 * scale; m4.multiply(w4.makeTranslation(0, pv, 0)).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(roll, 0, pitch, 'XZY'))).multiply(w4.makeTranslation(0, -pv, 0)); }
      K.im.setMatrixAt(i, m4);
      if (nC < contact.instanceMatrix.count && kind !== 'plane' && scale > 0.05) { const L = K.M.L, Wd = K.M.W; m4.compose(pose.pos, pose.quat, sc.set(L + 0.9, 1, Wd + 0.7).multiplyScalar(scale)); m4.multiply(w4.makeTranslation(kind === 'trailer' ? -7.2 / (L + 0.9) : 0, 0.03, 0)); contact.setMatrixAt(nC++, m4); }
      K.im.geometry.getAttribute('aPaint').setXYZ(i, ...paint); K.im.geometry.getAttribute('aLit').setXYZW(i, lights, brake, 0, 0);
      for (const [x, y, z] of K.M.wheels) {
        if (nW >= wheels.instanceMatrix.count) break;
        const wi = K.M.wheels.findIndex(q => q[0] === x && q[2] === z), dual = K.M.dual?.[wi]; const r = K.M.wr; w4.makeRotationZ(-wheelAngle); w4.scale(sc.set(r, r, dual ? 0.62 : (K.M.tw ?? 0.24)).multiplyScalar(scale)); w4.setPosition(x * scale, y * scale, (z + (dual ? Math.sign(z) * 0.12 : 0)) * scale);
        m4.compose(pose.pos, pose.quat, sc.setScalar(1)).multiply(w4); wheels.setMatrixAt(nW, m4); nW++;
      }
      const L = (p, c, I) => { if (nG >= glows.n) return; v.set(...p).multiplyScalar(scale).applyQuaternion(pose.quat).add(pose.pos); glows.set(nG, v.x, v.y, v.z, I); glows.color(nG, c); nG++; };
      for (const p of K.M.head) L(p, [1, 0.92, 0.8], lights * 2.2);
      for (const p of K.M.tail) L(p, [1, 0.06, 0.03], (0.25 + brake * 1.2) * Math.max(lights, brake));
      for (const p of K.M.marker ?? []) L(p, [1, 0.5, 0.1], lights * 0.22);
      if (K.M.nav) { const t = world.U.uTime.value; const strobe = (ph) => (Math.sin((t + ph) * Math.PI * 2 / 1.2) > 0.96 ? 3 : 0);
        L(K.M.nav.left, [1, 0.08, 0.05], 1.2); L(K.M.nav.right, [0.1, 1, 0.3], 1.2); L(K.M.nav.tail, [1, 1, 1], 0.6 + strobe(0.3)); L(K.M.nav.belly, [1, 0.1, 0.05], strobe(0.6) ? 2 : 0.2); L(K.M.nav.top, [1, 1, 1], strobe(0.0)); }
      if (beamMesh && beam && lights > 0.01 && K.M.head.length && kind !== 'plane') {
        for (const p of K.M.head) { if (nB >= beamCap) break;
          const len = 28 * scale, rad = 3.2 * scale;
          w4.makeScale(len, rad * 0.5, rad); w4.premultiply(new THREE.Matrix4().makeRotationZ(-0.045)); w4.setPosition(p[0] * scale, p[1] * scale, p[2] * scale);
          m4.compose(pose.pos, pose.quat, sc.setScalar(1)).multiply(w4); beamMesh.setMatrixAt(nB, m4); beamMesh.geometry.getAttribute('aLit').setXYZW(nB, lights, 0, 0, 0); nB++; }
      }
    },
    end() {
      for (const k in kinds) { const K = kinds[k]; K.im.count = K.used; K.im.instanceMatrix.needsUpdate = true; K.im.geometry.getAttribute('aPaint').needsUpdate = true; K.im.geometry.getAttribute('aLit').needsUpdate = true; }
      wheels.count = nW; wheels.instanceMatrix.needsUpdate = true; contact.count = nC; contact.instanceMatrix.needsUpdate = true;
      if (beamMesh) { beamMesh.count = nB; beamMesh.instanceMatrix.needsUpdate = true; beamMesh.geometry.getAttribute('aLit').needsUpdate = true; }
      for (let i = nG; i < glows.n; i++) glows.set(i, 0, 0, 0, 0);
      glows.commit();
    },
  };
  return api;
}

// ---------------------------------------------------------------- poses
// Ground pose on a path that has at(s) -> { gx, gz, h, tx, tz }: position on the sphere, heading
// from the tangent, pitch from the grade, optional roll (lateral acceleration lean).
const Y = new THREE.Vector3(0, 1, 0);
export function groundPose(world, path, s, { lift = 0, roll = 0, u = 0 } = {}, out = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }) {
  const a = path.at(s), b = path.at(s + 2), c = path.at(s - 2);
  const rx = -a.tz, rz = a.tx;
  world.frame.surface(a.gx + rx * u, a.gz + rz * u, a.h + lift, out.pos);
  const yaw = Math.atan2(-a.tz, a.tx), pitch = Math.atan2(b.h - c.h, 4);
  out.quat.setFromEuler(new THREE.Euler(roll, yaw, pitch, 'YZX'));
  return out;
}

// Speed profile -> s(t). keys: [[t, speed m/s], ...] eased between keys (smootherstep), integrated
// on a fine fixed grid so s(t) is deterministic and exactly repeatable.
export function driver(keys, { s0 = 0, dt = 1 / 240 } = {}) {
  const t0 = keys[0][0], t1 = keys.at(-1)[0];
  const vAt = (t) => { if (t <= t0) return keys[0][1]; if (t >= t1) return keys.at(-1)[1]; let i = 0; while (keys[i + 1][0] < t) i++; const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return lerp(va, vb, smoother((t - ta) / (tb - ta))); };
  const N = Math.ceil((t1 - t0) / dt) + 1, S = new Float64Array(N); S[0] = s0;
  for (let i = 1; i < N; i++) { const ta = t0 + (i - 1) * dt; S[i] = S[i - 1] + (vAt(ta) + 4 * vAt(ta + dt / 2) + vAt(ta + dt)) / 6 * dt; }
  const s = (t) => { if (t <= t0) return s0 + keys[0][1] * (t - t0); if (t >= t1) return S[N - 1] + keys.at(-1)[1] * (t - t1); const f = (t - t0) / dt, i = Math.min(N - 2, Math.floor(f)); return lerp(S[i], S[i + 1], f - i); };
  const accel = (t) => (vAt(t + 0.05) - vAt(t - 0.05)) / 0.1;
  return { s, v: vAt, accel };
}

// Traffic on a road: lanes (road.lane indices, negative = opposite direction), deterministic.
// Returns (t, fleet, { skip(s, laneIdx) }) that adds every vehicle for time t.
export function traffic(world, rd, { lanes = [0, 1, -1, -2], perKm = 6, speed = [24, 31], seed = 3, from = 0, to = null, mix = { sedan: 0.55, suv: 0.25, van: 0.08, truck: 0.12 }, fade = 60, lights = 1, paints = null } = {}) {
  const r = rng(seed); to = to ?? rd.L; const span = to - from;
  const PAINTS = paints ?? [[0.02, 0.02, 0.022], [0.32, 0.32, 0.33], [0.6, 0.6, 0.58], [0.08, 0.1, 0.16], [0.25, 0.04, 0.03], [0.5, 0.48, 0.44], [0.04, 0.06, 0.05], [0.7, 0.7, 0.68]];
  const TRUCK_PAINTS = [[0.5, 0.06, 0.04], [0.04, 0.06, 0.12], [0.6, 0.6, 0.58], [0.03, 0.03, 0.03], [0.1, 0.18, 0.1]];
  const cars = [];
  for (const ln of lanes) {
    const n = Math.max(1, Math.round(span / 1000 * perKm)); const v = speed[0] + r() * (speed[1] - speed[0]);
    for (let k = 0; k < n; k++) {
      const x = r(); const kind = x < mix.sedan ? 'sedan' : x < mix.sedan + mix.suv ? 'suv' : x < mix.sedan + mix.suv + mix.van ? 'van' : 'truck';
      cars.push({ lane: ln, u: rd.lane(ln), s0: (k + r() * 0.6) / n * span, v: v * (kind === 'truck' ? 0.88 : 0.97 + r() * 0.06), kind, paint: kind === 'truck' ? TRUCK_PAINTS[Math.floor(r() * TRUCK_PAINTS.length)] : PAINTS[Math.floor(r() * PAINTS.length)] });
    }
  }
  const pa = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, pb = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  const flip = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI);
  const path = { at: (s) => rd.pose(s, 0) };
  return (t, F, { skip } = {}) => {
    for (const c of cars) {
      const dir = c.lane < 0 ? -1 : 1;
      let d = ((c.s0 + c.v * t) % span + span) % span;
      const s = dir > 0 ? from + d : to - d;
      if (skip?.(s, c.lane)) continue;
      const edge = Math.min(d, span - d), sc = clamp(edge / fade);
      if (sc <= 0.01) continue;
      const lp = { at: (x) => { const p = rd.pose(x, c.u); return { ...p, tx: p.tx * dir, tz: p.tz * dir }; } };
      if (c.kind === 'truck') {
        groundPose(world, lp, s, { lift: 0 }, pa); F.add('tractor', pa, { paint: c.paint, lights, wheelAngle: s / 0.52 * dir, scale: sc });
        groundPose(world, lp, s - dir * 3.0 - dir * 7, { lift: 0 }, pb);
        // trailer: kingpin over the tractor's fifth wheel, heading towards it from its rear axle
        const king = rd.pose(s - dir * 2.85, c.u), rear = rd.pose(s - dir * 2.85 - dir * 13.8, c.u);
        const yaw = Math.atan2(-(king.gz - rear.gz), king.gx - rear.gx);
        world.frame.surface(king.gx, king.gz, king.h, pb.pos); pb.quat.setFromEuler(new THREE.Euler(0, yaw, 0, 'YZX'));
        F.add('trailer', pb, { paint: [0.6, 0.6, 0.58], lights, wheelAngle: s / 0.52 * dir, scale: sc, beam: false });
      } else {
        groundPose(world, lp, s, {}, pa);
        F.add(c.kind, pa, { paint: c.paint, lights, wheelAngle: s / 0.34 * dir, scale: sc });
      }
    }
  };
}
