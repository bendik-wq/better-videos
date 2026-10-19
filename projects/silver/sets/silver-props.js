// Episode 7 props: every object is built from primitives, in the studio look (studio-kit.js materials).
// Units: 1 unit = 10 cm. Every builder returns a THREE.Group (origin on the floor, centred) unless noted.
import * as THREE from 'three';
import * as S from './studio-kit.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
const mesh = (g, m, { cast = true, receive = true } = {}) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = receive; return o; };

// ---------------------------------------------------------------- 3D type (helvetiker bold; silver or clay numerals)
let FONT = null;
export async function loadFont() {
  if (FONT) return FONT;
  const json = await (await fetch('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json')).json();
  FONT = new FontLoader().parse(json); return FONT;
}
// text3d(str, { size, depth, material, align }) → mesh, baseline at y=0, centred on x (align 'center') ; call loadFont() first
export function text3d(str, { size = 1, depth = 0.25, material = S.polishedSilver(), align = 'center', bevel = true } = {}) {
  const g = new TextGeometry(String(str), { font: FONT, size, depth, curveSegments: 6, bevelEnabled: bevel, bevelThickness: size * 0.03, bevelSize: size * 0.022, bevelSegments: 3 });
  g.computeBoundingBox(); const bb = g.boundingBox;
  g.translate(align === 'center' ? -(bb.max.x + bb.min.x) / 2 : align === 'right' ? -bb.max.x : -bb.min.x, 0, -depth / 2);
  return mesh(g, material);
}

// ---------------------------------------------------------------- tableware: a fork (the hook) and a spoon
// Fork lies along +x (handle end at x=0, tines at x≈2.0), top face up; ~20 cm long. Gentle S-curve in profile.
export function forkGeometry() {
  const s = new THREE.Shape();
  // outline (top view), half-widths in units; handle 0→1.15, neck 1.15→1.45, head 1.45→2.0 with 4 tines
  const pts = [[0, 0.11], [0.08, 0.135], [0.5, 0.12], [1.0, 0.085], [1.2, 0.045], [1.38, 0.05], [1.5, 0.13], [1.58, 0.15]];
  // smooth outline: spline through the handle/neck points on each side, tines with rounded tips
  const side = (sg) => pts.map(([x, y]) => V2(x, y * sg));
  s.moveTo(0, -0.11);
  s.splineThru(side(-1).slice(1));
  const slot = 0.02, tip = 2.02, w = 0.3 / 4;
  for (let k = 0; k < 4; k++) {
    const y0 = -0.15 + k * w + (k ? slot / 2 : 0), y1 = -0.15 + (k + 1) * w - (k < 3 ? slot / 2 : 0), e = (k === 0 || k === 3) ? 0.035 : 0;
    if (k) s.lineTo(1.66, y0);
    s.lineTo(tip - e - 0.04, y0); s.quadraticCurveTo(tip - e + 0.02, (y0 + y1) / 2, tip - e - 0.04, y1);
    if (k < 3) { s.lineTo(1.66, y1); s.quadraticCurveTo(1.64, y1 + slot / 2, 1.66, y1 + slot); }
  }
  s.splineThru(side(1).reverse());
  s.quadraticCurveTo(-0.06, 0, 0, -0.11);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.016, bevelSegments: 5, curveSegments: 24 });
  g.rotateX(-Math.PI / 2); // lie flat (extrusion along +y)
  // profile curve: handle rises at the end, neck dips, head curls up slightly
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); const lift = 0.07 * Math.exp(-((x - 0.15) ** 2) / 0.08) - 0.05 * Math.exp(-((x - 1.3) ** 2) / 0.05) + 0.06 * Math.max(0, x - 1.6) ** 2 * 6; p.setY(i, p.getY(i) + lift); }
  g.computeVertexNormals(); g.computeBoundingBox(); g.translate(-1.0, -g.boundingBox.min.y, 0);
  return g;
}
export function spoonGeometry() {
  const s = new THREE.Shape(); s.moveTo(0, -0.1);
  [[0.5, -0.11], [1.05, -0.06], [1.25, -0.04]].forEach(([x, y]) => s.lineTo(x, y));
  s.bezierCurveTo(1.45, -0.2, 2.05, -0.2, 2.05, 0); s.bezierCurveTo(2.05, 0.2, 1.45, 0.2, 1.25, 0.04);
  [[1.05, 0.06], [0.5, 0.11], [0, 0.1]].forEach(([x, y]) => s.lineTo(x, y)); s.quadraticCurveTo(-0.05, 0, 0, -0.1);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); let y = p.getY(i) + 0.07 * Math.exp(-((x - 0.15) ** 2) / 0.08);
    if (x > 1.3) { const u = (x - 1.65) / 0.4, v = z / 0.2; y -= 0.07 * Math.max(0, 1 - u * u - v * v); } p.setY(i, y); }
  g.computeVertexNormals(); g.computeBoundingBox(); g.translate(-1.0, -g.boundingBox.min.y, 0);
  return g;
}

// ---------------------------------------------------------------- foundry: crucible (with molten silver), ingot mould, pour stream
export function moltenMat(k = 1) { return new THREE.MeshStandardMaterial({ color: '#ff6a10', emissive: new THREE.Color('#ff4a00'), emissiveIntensity: 3 * k, roughness: 0.2, metalness: 0.0 }); }
export function crucible({ r = 0.9, h = 1.4 } = {}) {
  const G = new THREE.Group();
  const prof = [V2(0, 0), V2(r * 0.72, 0), V2(r * 0.8, 0.05), V2(r, h * 0.92), V2(r * 1.04, h), V2(r * 0.9, h), V2(r * 0.86, h * 0.92), V2(r * 0.66, 0.12), V2(0, 0.12)];
  const body = mesh(new THREE.LatheGeometry(prof, 64), S.clay('#e9e4da', { rough: 0.8 })); G.add(body);
  const melt = mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.7, 0.02, 48), moltenMat(), { cast: false }); melt.position.y = h * 0.78; G.add(melt);
  const glow = new THREE.PointLight('#ffb35a', 6, 8, 2); glow.position.y = h * 1.2; G.add(glow);
  G.userData = { melt, glow, h, r, setLevel(k) { melt.position.y = 0.15 + (h * 0.8 - 0.15) * k; const rr = S.lerp(0.68, 0.86, k); melt.scale.set(rr / 0.86, 1, rr / 0.86); } };
  return G;
}
export function mould({ l = 3.3, w = 1.6, h = 1.0 } = {}) {
  const G = new THREE.Group(); const iron = S.clay('#3b3f46', { rough: 0.55, sheen: 0.1 });
  const outer = mesh(S.roundBox(l, h, w, 0.08), iron); G.add(outer);
  // the cavity: a tapered bar-shaped hole (drawn as a dark inset + a fill bar that rises)
  // the cavity reads as a dark recess (an inset plate just below the top); the melt is a slab that rises through it
  const cav = mesh(S.roundBox(l * 0.86, 0.04, w * 0.76, 0.02), S.clay('#1c1e22', { rough: 0.8 }), { cast: false });
  cav.position.y = h - 0.035; G.add(cav);
  const fill = mesh(S.roundBox(l * 0.84, 0.3, w * 0.74, 0.05), moltenMat(0.9), { cast: false });
  fill.position.y = h - 0.32; G.add(fill);
  G.userData = { fill, setFill(k) { fill.position.y = h - 0.32 + 0.31 * Math.min(1, k); fill.visible = k > 0.02; } };
  return G;
}
// a falling stream of molten metal from a to b (tube along a parabola); call .set(k) 0..1 for how much has poured
export function pourStream(a, b, { r = 0.07 } = {}) {
  const m = moltenMat(1.1);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(a[0] + (b[0] - a[0]) * 0.35, a[1] + 0.25, a[2] + (b[2] - a[2]) * 0.35), new THREE.Vector3(...b));
  const o = mesh(new THREE.TubeGeometry(curve, 40, r, 12, false), m, { cast: false });
  o.userData.set = (k0, k1 = 1) => { o.geometry.setDrawRange(Math.floor(o.geometry.index.count * k0 / 3) * 3, Math.floor(o.geometry.index.count * (k1 - k0) / 3) * 3); o.visible = k1 > k0; };
  return o;
}

// ---------------------------------------------------------------- the rotary phone (margin call). Origin at the base centre; faces +z.
export function phone({ color = '#ecebe6', accent = '#14233d' } = {}) {
  const G = new THREE.Group(); const body = S.glossy(color, { rough: 0.35, coat: 0.8 }); const dark = S.glossy(accent, { rough: 0.4 });
  // body: a sloped rounded block
  const b = S.roundBox(2.2, 0.9, 2.0, 0.28, 4); const p = b.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); if (y > 0.4) p.setY(i, y - (z + 1) * 0.12); p.setX(i, p.getX(i) * (1 - y * 0.12)); }
  b.computeVertexNormals(); G.add(mesh(b, body));
  // dial: a disc with 10 finger holes, tilted to face the viewer
  const dialG = new THREE.Group(); dialG.position.set(0, 0.86, 0.32); dialG.rotation.x = -0.42; G.add(dialG);
  dialG.add(mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.06, 48).rotateX(0), S.glossy('#f7f5f0', { rough: 0.2, coat: 1 })));
  const holes = new THREE.Group(); dialG.add(holes);
  for (let k = 0; k < 10; k++) { const a = -Math.PI * 0.35 + k * (Math.PI * 1.55 / 9); const h = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 20), dark, { cast: false }); h.position.set(Math.cos(a) * 0.45, 0.012, Math.sin(a) * 0.45); holes.add(h); }
  const cap = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 32), S.clay('#ffffff')); cap.position.y = 0.02; dialG.add(cap);
  // handset on two cradle prongs
  const hs = new THREE.Group(); hs.position.set(0, 1.08, -0.42); G.add(hs);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.15, -0.12, 0), new THREE.Vector3(-0.85, 0.05, 0), new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(0.85, 0.05, 0), new THREE.Vector3(1.15, -0.12, 0)]);
  hs.add(mesh(new THREE.TubeGeometry(curve, 48, 0.13, 16), body));
  for (const sx of [-1, 1]) { const cup = mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.32, 32), body); cup.position.set(sx * 1.12, -0.2, 0); hs.add(cup); }
  for (const sx of [-0.62, 0.62]) { const pr = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12), body); pr.position.set(sx, 0.86, -0.42); G.add(pr); }
  // coiled cord (a helix tube) from the left of the body to the handset
  const pts = []; for (let i = 0; i <= 160; i++) { const u = i / 160; const c = new THREE.Vector3(-1.1 - u * 0.5, 0.25 + Math.sin(u * Math.PI) * 0.1, -0.3 + u * 0.2); pts.push(c.add(new THREE.Vector3(0, Math.cos(u * 60) * 0.06, Math.sin(u * 60) * 0.06))); }
  G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.022, 6), dark));
  G.userData = { handset: hs, dial: dialG,
    // ring(t): t in seconds since ringing started; the handset rattles in its cradle in bursts (2 s on, 4 s off, like a US ring)
    ring(t, on = true) { if (!on || t < 0) { hs.position.y = 1.08; hs.rotation.set(0, 0, 0); G.rotation.z = 0; return 0; }
      const ph = t % 6, a = ph < 2 ? 1 : 0; const j = Math.sin(t * 2 * Math.PI * 21) * a;
      hs.position.y = 1.08 + Math.abs(j) * 0.035; hs.rotation.z = j * 0.035; G.rotation.z = j * 0.006; return a; } };
  return G;
}

// ---------------------------------------------------------------- people: stylised clay peg figures (no faces), optional cowboy hat
export function person({ coat = '#14233d', skin = '#e9cdb4', hat = null, height = 1.8, shirt = '#f3f1ec', tie = null, seed = 1 } = {}) {
  const G = new THREE.Group(); const H = height / 1.8;
  const legs = mesh(S.roundBox(0.36 * H, 0.82 * H, 0.22 * H, 0.09 * H), S.clay('#2b2f38')); G.add(legs);
  const torso = mesh(new THREE.CapsuleGeometry(0.22 * H, 0.42 * H, 8, 24), S.clay(coat, { rough: 0.7 })); torso.position.y = 1.12 * H; torso.scale.z = 0.7; G.add(torso);
  const collar = mesh(new THREE.CylinderGeometry(0.075 * H, 0.09 * H, 0.08 * H, 16), S.clay(shirt)); collar.position.y = 1.43 * H; G.add(collar);
  if (tie) { const t = mesh(new THREE.ConeGeometry(0.045 * H, 0.28 * H, 4), S.clay(tie)); t.position.set(0, 1.3 * H, 0.15 * H); t.rotation.x = Math.PI; G.add(t); }
  const head = mesh(new THREE.SphereGeometry(0.15 * H, 32, 20), S.clay(skin, { rough: 0.55, sheen: 0.5 })); head.position.y = 1.6 * H; head.scale.set(0.92, 1.08, 0.95); G.add(head);
  for (const sx of [-1, 1]) { const arm = mesh(new THREE.CapsuleGeometry(0.065 * H, 0.5 * H, 6, 12), S.clay(coat, { rough: 0.7 })); arm.position.set(sx * 0.29 * H, 1.06 * H, 0); arm.rotation.z = sx * 0.12; G.add(arm); G.userData[sx < 0 ? 'armL' : 'armR'] = arm; }
  if (hat === 'cowboy' || hat === 'stetson') {
    const hc = hat === 'stetson' ? '#f1ece0' : '#7b5235';
    const brim = mesh(new THREE.CylinderGeometry(0.3 * H, 0.3 * H, 0.025 * H, 40), S.clay(hc)); brim.position.y = 1.73 * H; brim.scale.z = 0.86;
    const bp = brim.geometry.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i); bp.setY(i, bp.getY(i) + (x * x) * 0.45); } brim.geometry.computeVertexNormals();
    const crown = mesh(new THREE.CylinderGeometry(0.13 * H, 0.16 * H, 0.17 * H, 32), S.clay(hc)); crown.position.y = 1.83 * H; crown.scale.z = 0.9;
    const band = mesh(new THREE.CylinderGeometry(0.162 * H, 0.164 * H, 0.03 * H, 32), S.clay('#14233d')); band.position.y = 1.765 * H; band.scale.z = 0.9;
    G.add(brim, crown, band);
  } else if (hat === 'cap') { const c = mesh(new THREE.SphereGeometry(0.16 * H, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), S.clay('#14233d')); c.position.y = 1.66 * H; G.add(c); }
  G.userData.head = head; G.userData.H = H;
  return G;
}

// ---------------------------------------------------------------- vehicles
// a 1970s four-engine jet (707-ish), nose toward +x. ~ 46 m long → 1:100 scale = 4.6 units.
export function jet({ color = '#f4f2ed', stripe = '#14233d', scale = 1 } = {}) {
  const G = new THREE.Group(); const white = S.glossy(color, { rough: 0.3, coat: 0.7 }), navy = S.glossy(stripe, { rough: 0.35 });
  const fus = mesh(new THREE.CapsuleGeometry(0.22, 4.0, 12, 24).rotateZ(Math.PI / 2), white); fus.position.y = 0.55; G.add(fus);
  const nose = mesh(new THREE.SphereGeometry(0.22, 24, 16), white); nose.position.set(2.2, 0.55, 0); nose.scale.set(1.6, 1, 1); G.add(nose);
  const stripeM = mesh(new THREE.CylinderGeometry(0.224, 0.224, 3.8, 32, 1, true, -0.25, 0.5).rotateZ(Math.PI / 2), navy, { cast: false }); stripeM.position.y = 0.55; stripeM.rotation.x = Math.PI / 2; G.add(stripeM);
  const wingShape = new THREE.Shape([V2(0, 0), V2(-0.9, 2.2), V2(-1.25, 2.2), V2(-0.9, 0)]);
  for (const sz of [-1, 1]) {
    const w = mesh(new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), white);
    w.rotation.x = sz * Math.PI / 2; w.position.set(0.55, 0.45, 0); w.scale.z = sz; G.add(w);
    for (const k of [0.8, 1.6]) { const e = mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.5, 20).rotateZ(Math.PI / 2), S.glossy('#d7d5cf')); e.position.set(0.55 - k * 0.42 + 0.15, 0.3, sz * k); G.add(e); }
    const t = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V2(0, 0), V2(-0.45, 0.8), V2(-0.65, 0.8), V2(-0.45, 0)]), { depth: 0.035, bevelEnabled: false }), white);
    t.rotation.x = sz * Math.PI / 2; t.position.set(-1.6, 0.6, 0); t.scale.z = sz; G.add(t);
  }
  const fin = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V2(0, 0), V2(-0.75, 1.0), V2(-1.0, 1.0), V2(-0.8, 0)]), { depth: 0.04, bevelEnabled: false }), navy);
  fin.position.set(-1.45, 0.7, -0.02); G.add(fin);
  G.scale.setScalar(scale); return G;
}
export function truck({ color = '#e0241b', scale = 1 } = {}) {
  const G = new THREE.Group(); const cab = mesh(S.roundBox(0.8, 0.8, 0.9, 0.12), S.glossy(color)); cab.position.set(1.0, 0.2, 0); G.add(cab);
  const box = mesh(S.roundBox(2.0, 1.0, 1.0, 0.06), S.clay('#f3f1ec')); box.position.set(-0.45, 0.2, 0); G.add(box);
  for (const x of [1.0, -0.2, -1.0]) for (const z of [-0.45, 0.45]) { const wh = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 20).rotateX(Math.PI / 2), S.clay('#2b2f38')); wh.position.set(x, 0.2, z); G.add(wh); }
  G.scale.setScalar(scale); return G;
}

// ---------------------------------------------------------------- places
// vault shelving: rows × levels of shelves; returns { group, slots: [[x,y,z]] } for bars (each slot holds one bar)
export function vaultShelves({ rows = 3, bays = 4, levels = 4, bayL = 3.4, depth = 1.6, levelH = 1.25, gap = 2.6 } = {}) {
  const G = new THREE.Group(); const steel = S.clay('#d9dde2', { rough: 0.45, sheen: 0.1 }), dark = S.clay('#3b4250', { rough: 0.5 });
  const slots = [];
  for (let r = 0; r < rows; r++) {
    const z = -r * (depth + gap);
    for (let b = 0; b <= bays; b++) for (const dz of [-depth / 2, depth / 2]) { const post = mesh(S.roundBox(0.1, levels * levelH + 0.2, 0.1, 0.02), dark); post.position.set((b - bays / 2) * bayL, 0, z + dz); G.add(post); }
    for (let l = 0; l < levels; l++) {
      const sh = mesh(S.roundBox(bays * bayL + 0.2, 0.06, depth + 0.1, 0.02), steel); sh.position.set(0, l * levelH + 0.12, z); G.add(sh);
      for (let b = 0; b < bays; b++) slots.push([(b - bays / 2 + 0.5) * bayL, l * levelH + 0.18, z]);
    }
  }
  return { group: G, slots };
}
export function derrick({ h = 6, color = '#14233d' } = {}) {
  const G = new THREE.Group(); const m = S.clay(color, { rough: 0.6 }); const w0 = h * 0.22, w1 = h * 0.04;
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of legs) { const a = new THREE.Vector3(sx * w0, 0, sz * w0), b = new THREE.Vector3(sx * w1, h, sz * w1); const len = a.distanceTo(b);
    const c = mesh(new THREE.CylinderGeometry(0.05, 0.06, len, 8), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.lookAt(b); c.rotateX(Math.PI / 2); G.add(c); }
  for (let k = 1; k < 7; k++) { const y = (k / 7) * h, w = S.lerp(w0, w1, k / 7);
    for (let e = 0; e < 4; e++) { const [ax, az] = legs[e], [bx, bz] = legs[(e + 1) % 4]; const a = new THREE.Vector3(ax * w, y, az * w), b = new THREE.Vector3(bx * w, y, bz * w);
      const c = mesh(new THREE.CylinderGeometry(0.03, 0.03, a.distanceTo(b), 6), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.lookAt(b); c.rotateX(Math.PI / 2); G.add(c); } }
  const top = mesh(S.roundBox(w1 * 3, 0.2, w1 * 3, 0.03), m); top.position.y = h; G.add(top);
  return G;
}
export function pumpjack({ color = '#14233d', accent = '#e0241b' } = {}) {
  const G = new THREE.Group(); const m = S.clay(color, { rough: 0.6 });
  const base = mesh(S.roundBox(3.2, 0.25, 1.0, 0.06), S.clay('#9aa1ab')); G.add(base);
  const post = mesh(S.roundBox(0.25, 1.9, 0.5, 0.04), m); post.position.set(0, 0.2, 0); G.add(post);
  const beam = new THREE.Group(); beam.position.set(0, 2.15, 0); G.add(beam);
  const bm = mesh(S.roundBox(3.6, 0.22, 0.3, 0.05), m); bm.position.y = -0.11; beam.add(bm);
  const head = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.32, 24, 1, false, 0, Math.PI * 0.6).rotateX(Math.PI / 2), S.clay(accent)); head.position.set(1.8, -0.1, 0); head.rotation.z = Math.PI * 0.7; beam.add(head);
  const cw = mesh(S.roundBox(0.6, 0.6, 0.5, 0.06), S.clay('#9aa1ab')); cw.position.set(-1.9, -0.8, 0); G.add(cw);
  G.userData = { beam, tick(t) { beam.rotation.z = Math.sin(t * 1.4) * 0.22; cw.position.y = -0.8 + Math.sin(t * 1.4) * 0.35; } };
  return G;
}
// a classical bank / exchange building (columns, pediment); w along x, origin at the base front centre
export function building({ w = 8, d = 5, h = 4.2, cols = 6, label = null, color = '#f4f1ea' } = {}) {
  const G = new THREE.Group(); const m = S.clay(color, { rough: 0.7 }), shade = S.clay('#e4ded2', { rough: 0.75 });
  const steps = [0, 1, 2].map(k => { const s = mesh(S.roundBox(w + 1.2 - k * 0.35, 0.18, d + 1.0 - k * 0.3, 0.03), m); s.position.y = k * 0.18; G.add(s); return s; });
  const core = mesh(S.roundBox(w - 0.6, h, d - 1.2, 0.05), shade); core.position.set(0, 0.54, -0.5); G.add(core);
  for (let i = 0; i < cols; i++) { const c = mesh(new THREE.CylinderGeometry(0.22, 0.25, h - 0.2, 24), m); c.position.set((i - (cols - 1) / 2) * (w - 1) / (cols - 1), 0.54 + (h - 0.2) / 2, d / 2 - 0.4); G.add(c); }
  const ent = mesh(S.roundBox(w + 0.2, 0.45, d, 0.04), m); ent.position.set(0, 0.54 + h - 0.15, 0); G.add(ent);
  const ped = new THREE.Shape([V2(-w / 2 - 0.1, 0), V2(w / 2 + 0.1, 0), V2(0, 1.2)]);
  const pg = mesh(new THREE.ExtrudeGeometry(ped, { depth: d - 0.2, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), m); pg.position.set(0, 0.54 + h + 0.3, -d / 2 + 0.1); G.add(pg);
  if (label) { const lp = labelPlane(label, { w: w * 0.6, h: 0.38, bg: null, color: '#14233d' }); lp.position.set(0, 0.54 + h + 0.08, d / 2 + 0.02); G.add(lp); }
  return G;
}

// ---------------------------------------------------------------- money and paper
export function cashStack({ w = 1.56, d = 0.66, h = 0.3, band = true } = {}) {
  const G = new THREE.Group();
  const tex = S.canvasTex(512, 220, (g, W, Hh) => { g.fillStyle = '#cfe0c8'; g.fillRect(0, 0, W, Hh); g.strokeStyle = '#6f9a74'; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, Hh - 28); g.fillStyle = '#5a8a62'; g.font = '700 90px "Archivo Narrow"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$100', W / 2, Hh / 2); g.beginPath(); g.arc(90, Hh / 2, 50, 0, 7); g.stroke(); g.beginPath(); g.arc(W - 90, Hh / 2, 50, 0, 7); g.stroke(); });
  const side = S.clay('#e6ecdf', { rough: 0.9 });
  const top = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.85, envMapIntensity: 0.8 });
  const s = mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, top, side, side, side]); G.add(s);
  if (band) { const b = mesh(new THREE.BoxGeometry(0.28, h + 0.01, d + 0.01).translate(0, h / 2, 0), S.clay('#f2e8c9')); G.add(b); }
  return G;
}
// a flat card with canvas text (labels in the scene: lit, shadow-receiving). Returns a mesh facing +z.
export function labelPlane(text, { w = 3, h = 0.6, bg = '#ffffff', color = '#14233d', font = '700', family = 'Archivo Narrow', pad = 0.12, res = 256, radius = 0.12, red = false } = {}) {
  const W = Math.round(res * w / h), H = res;
  const tex = S.canvasTex(W, H, (g) => {
    if (bg) { g.fillStyle = red ? '#e0241b' : bg; g.beginPath(); g.roundRect(0, 0, W, H, radius * H); g.fill(); }
    g.fillStyle = red ? '#ffffff' : color; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = H * (1 - pad * 2) * 0.82; g.font = `${font} ${fs}px "${family}"`; while (g.measureText(text).width > W * 0.92 && fs > 8) { fs *= 0.95; g.font = `${font} ${fs}px "${family}"`; }
    g.fillText(text, W / 2, H * 0.53);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: tex, transparent: !bg, roughness: 0.6, envMapIntensity: 0.6, side: THREE.DoubleSide }));
  m.receiveShadow = true; return m;
}
// a sheet of paper (document) lying flat or standing: canvas drawer(g, W, H) paints it
export function sheet(draw, { w = 2.1, h = 2.97, res = 900 } = {}) {
  const tex = S.canvasTex(Math.round(res * w / h), res, (g, W, H) => { g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, W, H); draw(g, W, H); });
  const geo = new THREE.PlaneGeometry(w, h, 8, 8);
  const m = mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.9, sheen: 0.2, envMapIntensity: 0.7, side: THREE.DoubleSide }));
  return m;
}
// a brass balance scale: two pans; .set(tilt) in radians (+ = left pan down)
export function balance({ arm = 3.2 } = {}) {
  const G = new THREE.Group(); const br = S.brassMat({ rough: 0.28 });
  const base = mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.25, 48), S.wood()); G.add(base);
  const post = mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 24), br); post.position.y = 1.85; G.add(post);
  const beam = new THREE.Group(); beam.position.y = 3.55; G.add(beam);
  beam.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, arm * 2, 16).rotateZ(Math.PI / 2), br));
  const pans = [];
  for (const sx of [-1, 1]) { const hang = new THREE.Group(); hang.position.x = sx * arm; beam.add(hang);
    for (const a of [0, 2.1, 4.2]) { const ch = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.8, 6), br); ch.position.set(Math.cos(a) * 0.45, -0.9, Math.sin(a) * 0.45); ch.rotation.z = -Math.cos(a) * 0.24; ch.rotation.x = Math.sin(a) * 0.24; hang.add(ch); }
    const pan = mesh(new THREE.CylinderGeometry(0.95, 0.75, 0.12, 48), br); pan.position.y = -1.85; hang.add(pan); pans.push(hang); }
  G.userData = { beam, pans, set(tilt) { beam.rotation.z = tilt; for (const p of pans) p.rotation.z = -tilt; } };
  return G;
}
// a big rubber stamp (handle + block); stamp face text is drawn as an ink decal elsewhere
export function rubberStamp({ color = '#e0241b' } = {}) {
  const G = new THREE.Group();
  const blk = mesh(S.roundBox(2.2, 0.35, 1.0, 0.06), S.wood()); G.add(blk);
  const pad = mesh(S.roundBox(2.1, 0.08, 0.9, 0.03), S.clay(color, { rough: 0.8 })); pad.position.y = -0.06; G.add(pad);
  const neck = mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.6, 24), S.wood()); neck.position.y = 0.6; G.add(neck);
  const knob = mesh(new THREE.SphereGeometry(0.42, 32, 20), S.glossy(color)); knob.position.y = 1.15; knob.scale.y = 0.85; G.add(knob);
  return G;
}
// split-flap style price board in 3D: a dark slab with a label plane you update via .setText()
export function priceBoard({ w = 6, h = 1.6, title = 'SILVER · $/OZ' } = {}) {
  const G = new THREE.Group();
  const slab = mesh(S.roundBox(w, h, 0.3, 0.06), S.glossy('#14233d', { rough: 0.4 })); G.add(slab);
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.86), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, h / 2, 0.16); G.add(face);
  let last = null;
  G.userData.setText = (txt, { red = false } = {}) => { const k = txt + red; if (k === last) return; last = k;
    g.fillStyle = '#0f1b30'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#9fb3c8'; g.font = '600 46px "Plex Mono"'; g.textBaseline = 'top'; g.fillText(title, 28, 18);
    g.fillStyle = red ? '#ff4a3d' : '#f7f5f0'; g.font = `700 ${c.height * 0.56}px "Plex Mono"`; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillText(txt, c.width - 30, c.height - 26); g.textAlign = 'left'; tex.needsUpdate = true; };
  G.userData.setText('$0.00');
  return G;
}
