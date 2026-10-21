// Episode 9 (Palomares, 17 Jan 1966) 3D sets. Reconstructed-channel look: white glossy models, painted sky dioramas,
// soft contact shadows, one red accent. Facts on screen come from projects/palomares/RESEARCH.md (§3, §5, §6, §7, §11).
// Full table of sets, modes, params and cues: projects/palomares/SETS-3d.md.
//
// Every set is async (ctx, shot) => { scene, camera, layer, update(t) } and a pure function of t.
// Common params (all sets):
//   camera    [{ pos, look, mm }, ...] camera keys (S.rig: Catmull-Rom + smootherstep over the shot); default per mode
//   caption   black-slab caption text (null = none); source  small source line bottom-right (null = none)
//   pills     [{ text, at (cue: seconds or 'word'/'word@2+0.3'), target: name | [x,y,z], red, until (cue) }]
//   seed      painted-sky seed;  quality  post quality ('medium' default)
// Cues accept seconds or spoken words (S.cue). Defaults play the full animation with no VO.
//
//   sky      refuelling at 31,000 ft: B-52G + KC-135A with the flying boom. mode 'approach' | 'collision' | 'fall'
//            at (cue: contact / bombs out), chutes (cue: first chute opens), speed (cloud scroll), labels (bool: 1-4 pills in fall)
//   bomb     hero B28 (22 x 145 in). mode 'hero' (slow turn on a plinth) | 'four' (three standing + red dashed 4th slot)
//            | 'chute' (hanging under its canopy on the sky, swinging) | 'numbers' (four bombs 1-4, each lit on its cue)
//            at [cues] (numbers), status [texts] (numbers: pill under each), missing [n] (numbers: slot drawn as dashed outline),
//            title (four: serif title upper right, e.g. "WHERE'S #4?"), chute 64|16 (canopy), spin (hero: rad/s), sky (hero on sky)
//   village  Palomares diorama on a floating disc. mode 'day' | 'impacts' | 'dust' | 'cleanup' | 'fence'
//            at [cue1, cue2, cue3] (impacts: bomb 1, 2, 3), dustAt / settleAt (dust), markers (bool), labels (bool: default pills)
//   sea      vertical sea cutaway, find site on the canyon wall. mode 'search' | 'found' | 'lift' | 'snap' | 'refind' | 'curv' | 'raise'
//            at (cue: the mode's main event), depths (bool), night (snap: darker water, default true), loop (bool: red loop on the break)
//   grid     probability search grid over a sea map. cells (2D array 0..1, rows N→S) or seeded default, at (cue: rise starts),
//            reveal ('cell' | 'all'), revealDur, highlight [[col,row],...], pin (bool), x (bool: found X), xAt (cue)
//   alvin    hero product shot of Alvin (1966, white) in blue water. pilots (bool), lights (bool), spin
//   trawler  Simó Orts's shrimp boat on a sea diorama. mode 'sighting' (chute + dark object splashing in the distance)
//            | 'pointing' (open water, nothing to see). at (cue: splash), figure (bool)
import * as THREE from 'three';
import * as S from './studio-kit.js';
import * as PR from './silver-props.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const v3 = (a) => new THREE.Vector3(...a);
const RED = '#e0241b';
const TAU = Math.PI * 2;
const mk = (g, m, { cast = true, receive = true } = {}) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = receive; return o; };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = S.inOut;

// ---------------------------------------------------------------- rods: instanced thin cylinders between two points (lines, risers, rigging)
const _ry = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
export function rods(n, mat, { seg = 6 } = {}) {
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, seg, 1, true).translate(0, 0.5, 0), mat, n); im.castShadow = true; im.frustumCulled = false;
  im.set = (i, a, b, r) => { const A = a.isVector3 ? a : v3(a), B = b.isVector3 ? b : v3(b); _d.subVectors(B, A); const L = _d.length();
    if (L < 1e-5 || r <= 0) { _m.makeScale(0, 0, 0); im.setMatrixAt(i, _m); return; }
    _q.setFromUnitVectors(_ry, _d.clone().divideScalar(L)); _s.set(r, L, r); _m.compose(A, _q, _s); im.setMatrixAt(i, _m); };
  im.hide = (i) => { _m.makeScale(0, 0, 0); im.setMatrixAt(i, _m); };
  im.done = () => { im.instanceMatrix.needsUpdate = true; };
  for (let i = 0; i < n; i++) im.hide(i); im.done();
  return im;
}
// a catenary-ish sagging curve from a to b (sag in units, downward), as points
function sagCurve(a, b, sag = 1, n = 16) { const out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push(new THREE.Vector3(S.lerp(a.x, b.x, u), S.lerp(a.y, b.y, u) - Math.sin(Math.PI * u) * sag, S.lerp(a.z, b.z, u))); } return out; }

// ---------------------------------------------------------------- the B28 (Mk 28 FI): 22 in x 145 in. Built along +y (tail at y=0, nose at y=L).
// Units: 1 unit = 10 cm (L = 36.8, R = 2.8). Scale the group for other unit systems.
export const B28 = { L: 36.8, R: 2.8 };
const b28TexCache = {};
function b28Tex(seed = 1) {
  if (b28TexCache[seed]) return b28TexCache[seed];
  const r = S.rng(seed);
  // u wraps around the body, v runs tail (0) to nose (1): canvas y = (1 - v) * H
  const t = S.canvasTex(1024, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#e9ebed'); gr.addColorStop(0.5, '#f1f2f3'); gr.addColorStop(1, '#e9ebed');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // brushed streaks
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '200,205,212' : '255,255,255'},${0.05 + r() * 0.08})`; g.fillRect(0, r() * H, W, 1 + r() * 2); }
    const yOf = (v) => (1 - v) * H;
    // panel seams
    g.fillStyle = 'rgba(120,130,140,0.4)'; for (const v of [0.5]) g.fillRect(0, yOf(v) - 1, W, 2);
    // white tape patches
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (const [u, v, w, h] of [[0.12, 0.5, 0.1, 0.05], [0.62, 0.42, 0.08, 0.035], [0.3, 0.7, 0.06, 0.03], [0.82, 0.58, 0.07, 0.05], [0.47, 0.26, 0.05, 0.03]]) g.fillRect(u * W, yOf(v), w * W, h * H);
    // stencils (small black type, runs along the body)
    g.fillStyle = 'rgba(30,36,46,0.8)'; g.font = '600 18px "Plex Mono"';
    g.save(); g.translate(0.25 * W, yOf(0.5)); g.rotate(-Math.PI / 2); g.fillText('CAUTION · DO NOT BUMP', 0, 0); g.restore();
    g.save(); g.translate(0.75 * W, yOf(0.45)); g.rotate(-Math.PI / 2); g.fillText('HANDLE WITH CARE', 0, 0); g.restore();
    g.fillRect(0.2 * W, yOf(0.66), 0.04 * W, 6); g.fillRect(0.7 * W, yOf(0.66), 0.04 * W, 6);
  });
  return (b28TexCache[seed] = t);
}
let B28GEO = null;
function b28Geos() {
  if (B28GEO) return B28GEO;
  const { L, R } = B28; const pts = [];
  // B28 (museum / Petrel-deck photos): flat circular tail plate, short slightly tapered tail section carrying 4 small trapezoidal fins,
  // a small shoulder, a long straight cylinder, and a BLUNT rounded nose cap (elliptical, ~0.7 D long). Stubby, not a rocket.
  pts.push(new THREE.Vector2(0.001, 0), new THREE.Vector2(2.1, 0), new THREE.Vector2(2.3, 0.2));
  pts.push(new THREE.Vector2(2.4, 3.5), new THREE.Vector2(2.55, 6.9), new THREE.Vector2(2.6, 7.1), new THREE.Vector2(R, 7.5));
  for (let i = 1; i <= 12; i++) pts.push(new THREE.Vector2(R, 7.5 + i * (33.0 - 7.5) / 12));
  const nL = L - 33.0; for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.001, R * Math.cos(a)), 33.0 + Math.sin(a) * nL)); }
  const body = new THREE.LatheGeometry(pts, 64);
  // fin: small trapezoid on the tail section (root 0.4→5.6, tip 0.4→4.2), squared-off trailing edge at the tail
  const sh = new THREE.Shape(); sh.moveTo(2.2, 0.4); sh.lineTo(2.2, 5.2); sh.lineTo(4.35, 4.4); sh.lineTo(4.35, 0.4); sh.closePath();
  const fin = new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2 }).translate(0, 0, -0.16);
  const ring = new THREE.TorusGeometry(R + 0.01, 0.06, 6, 64).rotateX(Math.PI / 2);
  const plate = new THREE.CylinderGeometry(2.0, 2.0, 0.3, 48).translate(0, 0.1, 0);
  return (B28GEO = { body, fin, ring, plate });
}
// b28({ tint, seed, damaged }) → Group (y-up, tail at origin). userData.mats = materials (for lighting changes)
export function b28({ seed = 1, color = '#ffffff', rough = 0.34, metal = 0.25 } = {}) {
  const G = new THREE.Group(); const geo = b28Geos();
  const skin = new THREE.MeshPhysicalMaterial({ map: b28Tex(seed), color, metalness: metal, roughness: rough, clearcoat: 0.45, clearcoatRoughness: 0.25, envMapIntensity: 1.1 });
  const finM = new THREE.MeshPhysicalMaterial({ color: '#e6e9ec', metalness: metal, roughness: rough + 0.05, clearcoat: 0.3, envMapIntensity: 1.1 });
  const darkM = S.clay('#9aa3ad', { rough: 0.5 });
  G.add(mk(geo.body, skin));
  for (let k = 0; k < 4; k++) { const f = mk(geo.fin, finM); f.rotation.y = k * Math.PI / 2 + Math.PI / 4; G.add(f); }
  for (const y of [7.5, 33.0]) { const r = mk(geo.ring, darkM, { cast: false }); r.position.y = y; G.add(r); }
  const pl = mk(geo.plate, darkM); pl.position.y = -0.12; G.add(pl);
  G.userData.mats = [skin, finM];
  return G;
}
// the side silhouette of the B28 (incl. two fins), in the group's local xy plane, closed polyline (for the dashed outline)
function b28Silhouette() {
  const { L, R } = B28; const e = 0.08; const right = [[2.3 + e, 0], [2.4 + e, 0.4], [4.35 + e, 0.4], [4.35 + e, 4.4], [2.52 + e, 5.1], [2.6 + e, 7.1], [R + e, 7.5], [R + e, 33.0]];
  const nL = L - 33.0; for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI / 2; right.push([(R + e) * Math.cos(a), 33.0 + Math.sin(a) * (nL + e)]); }
  const left = right.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  return [[0, 0], ...right, ...left, [-(2.3 + e), 0], [0, 0]];
}
// red dashed outline of the bomb silhouette (capsule dashes). .draw(k) reveals 0..1 of the dashes
export function dashedOutline(poly, { dash = 3.0, gap = 1.9, r = 0.55, color = RED, emissive = 0.35 } = {}) {
  const G = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8, emissive: color, emissiveIntensity: emissive });
  const P = poly.map(([x, y]) => new THREE.Vector3(x, y, 0)); const segs = []; let L = 0;
  for (let i = 1; i < P.length; i++) { const l = P[i].distanceTo(P[i - 1]); segs.push([P[i - 1], P[i], L, l]); L += l; }
  const at = (s) => { for (const [a, b, s0, l] of segs) if (s <= s0 + l) return a.clone().lerp(b, (s - s0) / l); return P.at(-1).clone(); };
  const dashes = [];
  for (let s = 0; s < L - 0.5; s += dash + gap) {
    const a = at(s), b = at(Math.min(L, s + dash)), mid = at(s + dash / 2);
    // dashes follow the curve: use a 3-point tube for each dash
    const c = new THREE.CatmullRomCurve3([a, mid, b]);
    const d = mk(new THREE.TubeGeometry(c, 6, r, 8, false), m, { cast: false }); G.add(d); dashes.push(d);
    const cap1 = mk(new THREE.SphereGeometry(r, 10, 8), m, { cast: false }); cap1.position.copy(a); d.add(cap1); cap1.position.sub(new THREE.Vector3());
    const cap2 = mk(new THREE.SphereGeometry(r, 10, 8), m, { cast: false }); cap2.position.copy(b); d.add(cap2);
  }
  G.userData = { dashes, draw(k) { const n = Math.ceil(dashes.length * clamp01(k)); dashes.forEach((d, i) => { d.visible = i < n; }); } };
  return G;
}

// ---------------------------------------------------------------- parachute canopy (off-white / dirty yellow nylon, gores). Apex at +y.
// canopy({ r, h, gores, collapse }) → Group with .set({ breath, squash }); skirt points in userData.skirt (local)
const goreTexCache = {};
function goreTex(gores) { if (goreTexCache[gores]) return goreTexCache[gores];
  return (goreTexCache[gores] = S.canvasTex(1024, 256, (g, W, H) => { for (let i = 0; i < gores; i++) { g.fillStyle = i % 2 ? '#efe9d6' : '#e4dbbd'; g.fillRect(i * W / gores, 0, W / gores + 1, H); }
    g.fillStyle = 'rgba(150,140,110,0.35)'; for (let i = 0; i < gores; i++) g.fillRect(i * W / gores - 1, 0, 2, H); g.fillStyle = 'rgba(200,190,160,0.5)'; g.fillRect(0, H - 14, W, 14); })); }
export function canopy({ r = 10, h = 6, gores = 16, seg = 48, color = '#ffffff' } = {}) {
  const G = new THREE.Group();
  const pts = []; for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.03 * r, Math.sin(a) * r), Math.cos(a) * h)); }
  const geo = new THREE.LatheGeometry(pts, seg); const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshPhysicalMaterial({ map: goreTex(gores), color, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const m = mk(geo, mat); G.add(m);
  const skirt = []; for (let i = 0; i < gores; i++) { const a = (i / gores) * TAU; skirt.push(new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r)); }
  G.userData = { mesh: m, skirt, r, h, mat,
    // breath: 0..1 pulse of the skirt; squash: 0 inflated → 1 collapsed (flattened, crumpled)
    set({ breath = 0, squash = 0, t = 0 } = {}) { const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2]; const a = Math.atan2(x, z), rr = Math.hypot(x, z);
        const scal = 1 + 0.035 * Math.cos(a * gores) * (rr / r) + breath * 0.05 * (1 - y / h) + squash * 0.25 * Math.sin(a * 3 + t) * (rr / r);
        const yy = y * (1 - squash * 0.85) + squash * Math.sin(a * 5 + rr * 0.4 + t * 0.7) * h * 0.12;
        p.setXYZ(i, x * scal, yy, z * scal); }
      p.needsUpdate = true; geo.computeVertexNormals(); } };
  G.userData.set({});
  return G;
}

// ---------------------------------------------------------------- aircraft (metres). +x = forward, +y up, span along z.
const metalTop = () => S.glossy('#c9d0d8', { rough: 0.28, coat: 0.8 });
const bellyWhite = () => S.glossy('#f5f5f2', { rough: 0.32, coat: 0.6 });
function halfLathe(prof, segs, upper, mat) { // lathe around y, then axis → x; upper half (+y) or lower
  const g = new THREE.LatheGeometry(prof, segs, upper ? Math.PI : 0, Math.PI).rotateZ(-Math.PI / 2);
  return mk(g, mat);
}
function planform(pts, thick, mat, { bevel = 0.12 } = {}) { // pts [[x,z]] in plan, thickness downward from y=+thick/2
  const sh = new THREE.Shape(); pts.forEach(([x, z], i) => i ? sh.lineTo(x, z) : sh.moveTo(x, z)); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 }).rotateX(Math.PI / 2).translate(0, thick / 2, 0);
  return mk(g, mat);
}
function finShape(pts, thick, mat) { // pts [[x,y]] in the xz=0 plane, extruded along z
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  return mk(new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }).translate(0, 0, -thick / 2), mat);
}
function nacelle(len, r, mat, lip) { const G = new THREE.Group(); const prof = [[0.001, 0], [r * 0.75, 0.05], [r, len * 0.12], [r * 0.95, len * 0.7], [r * 0.6, len], [0.001, len]].map(([a, b]) => new THREE.Vector2(a, b));
  const n = mk(new THREE.LatheGeometry(prof, 24).rotateZ(Math.PI / 2).translate(len / 2, 0, 0), mat); G.add(n);
  const ring = mk(new THREE.TorusGeometry(r * 0.82, r * 0.14, 8, 24).rotateY(Math.PI / 2), lip); ring.position.x = len / 2 - 0.05; G.add(ring);
  const hub = mk(new THREE.CircleGeometry(r * 0.75, 24).rotateY(Math.PI / 2), S.clay('#7d8792')); hub.position.x = len / 2 - 0.12; G.add(hub);
  return G; }
// B-52G (stylised): 48 m long, 56 m span, swept shoulder wing with 4 twin-engine pods, tall fin, natural metal top, white belly.
export function b52() {
  const G = new THREE.Group(); const top = metalTop(), bel = bellyWhite(), lip = S.clay('#8d97a2', { rough: 0.4 }), glass = S.glossy('#5d7d9c', { rough: 0.1, coat: 1 });
  const prof = [[0.05, -24], [0.7, -23.2], [1.25, -20], [1.7, -14], [1.85, -6], [1.85, 12], [1.8, 17], [1.62, 20], [1.3, 22], [0.85, 23.4], [0.3, 24.1], [0.001, 24.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const fu = new THREE.Group(); fu.add(halfLathe(prof, 32, true, top), halfLathe(prof, 32, false, bel)); fu.scale.set(1, 1.12, 0.88); G.add(fu);
  // cockpit glazing
  for (const z of [-0.55, 0.55]) { const w = mk(S.roundBox(1.6, 0.42, 0.5, 0.12), glass, { cast: false }); w.position.set(20.6, 1.3, z); w.rotation.z = -0.32; w.rotation.y = z > 0 ? 0.25 : -0.25; G.add(w); }
  const wf = mk(S.roundBox(0.9, 0.4, 1.0, 0.12), glass, { cast: false }); wf.position.set(21.4, 1.06, 0); wf.rotation.z = -0.5; G.add(wf);
  // refuelling receptacle (small dark slot behind the cockpit)
  const rc = mk(S.roundBox(1.0, 0.12, 0.5, 0.05), S.clay('#5b6573')); rc.position.set(16, 1.98, 0); G.add(rc);
  // shoulder wing: top metal slab + white under slab; slight dihedral (flight flex)
  const wing = [[7, 0], [-12.5, 28], [-16.3, 28], [-5, 0], [-16.3, -28], [-12.5, -28]];
  const wu = planform(wing, 0.35, top), wl = planform(wing, 0.35, bel); wu.position.y = 1.55; wl.position.y = 1.2;
  const wingG = new THREE.Group(); wingG.add(wu, wl); G.add(wingG);
  // engines: 4 pods of 2, on pylons, under and ahead of the leading edge
  const xLE = (z) => 7 - 19.5 * Math.abs(z) / 28;
  for (const z of [-19, -9.5, 9.5, 19]) { const P = new THREE.Group(); const x0 = xLE(z) + 1.4;
    for (const dz of [-0.72, 0.72]) { const n = nacelle(5.2, 0.68, top, lip); n.position.set(0, 0, dz); P.add(n); }
    const py = mk(S.roundBox(3.2, 1.1, 0.3, 0.1), top); py.position.set(-1.2, 0.5, 0); P.add(py);
    P.position.set(x0 - 1.6, 0.0, z); G.add(P); }
  // wingtip tanks + outrigger fairings
  for (const z of [-24.5, 24.5]) { const tk = nacelle(6.5, 0.55, top, lip); tk.position.set(xLE(z) - 3.5, 0.6, z); G.add(tk); }
  // tall fin (G model) + swept tailplane
  const fin = finShape([[-23.6, 1.6], [-15.5, 1.6], [-20.2, 10.4], [-23.8, 10.4]], 0.4, top); G.add(fin);
  const tp = planform([[-17.5, 0], [-22, 8], [-24, 8], [-23.2, 0], [-24, -8], [-22, -8]], 0.25, top); tp.position.y = 1.0; G.add(tp);
  // red-free SAC sash stays off: one red accent is reserved for the story. A thin navy cheat line along the fuselage
  G.userData = { receptacle: new THREE.Vector3(16, 2.05, 0), wing: wingG, len: 48 };
  return G;
}
// KC-135A (stylised): 41 m, 40 m span, low swept wing, 4 slim J57 pods, flying boom (33 ft 8 in tube + telescoping nozzle).
export function kc135() {
  const G = new THREE.Group(); const top = metalTop(), lip = S.clay('#8d97a2', { rough: 0.4 }), glass = S.glossy('#5d7d9c', { rough: 0.1, coat: 1 });
  const prof = [[0.05, -20.6], [0.55, -20], [1.15, -17.5], [1.8, -12], [1.95, -6], [1.95, 13], [1.8, 16.5], [1.4, 18.6], [0.8, 19.8], [0.001, 20.4]].map(([r, y]) => new THREE.Vector2(r, y));
  const fu = new THREE.Group(); fu.add(halfLathe(prof, 32, true, top), halfLathe(prof, 32, false, top)); fu.position.y = 0; G.add(fu);
  // upswept tail: lift the rear
  for (const z of [-0.5, 0.5]) { const w = mk(S.roundBox(1.4, 0.38, 0.55, 0.12), glass, { cast: false }); w.position.set(17.7, 1.05, z); w.rotation.z = -0.35; w.rotation.y = z > 0 ? 0.3 : -0.3; G.add(w); }
  const wing = [[4.5, 0], [-8.5, 20], [-10.8, 20], [-6.5, 0], [-10.8, -20], [-8.5, -20]];
  const w = planform(wing, 0.42, top); w.position.y = -1.0; G.add(w);
  const xLE = (z) => 4.5 - 13 * Math.abs(z) / 20;
  for (const z of [-13.5, -7, 7, 13.5]) { const n = nacelle(4.6, 0.62, top, lip); n.position.set(xLE(z) - 0.8, -2.0, z); G.add(n);
    const py = mk(S.roundBox(2.6, 0.9, 0.25, 0.1), top); py.position.set(xLE(z) - 1.6, -1.85, z); G.add(py); }
  const fin = finShape([[-19.8, 1.3], [-12.5, 1.3], [-17.6, 9.8], [-20.6, 9.8]], 0.4, top); G.add(fin);
  const tp = planform([[-15, 0], [-19, 7], [-20.6, 7], [-20, 0], [-20.6, -7], [-19, -7]], 0.25, top); tp.position.y = 0.6; G.add(tp);
  // boom operator's pod (blister under the tail)
  const pod = mk(new THREE.SphereGeometry(0.75, 20, 12), glass); pod.scale.set(1.6, 0.6, 1); pod.position.set(-14.5, -1.65, 0); G.add(pod);
  // flying boom: pivot under the tail, tube, two ruddervators, telescoping nozzle
  const boom = new THREE.Group(); boom.position.set(-17.6, -1.2, 0); G.add(boom);
  const tube = mk(new THREE.CylinderGeometry(0.22, 0.32, 10.3, 16).rotateZ(Math.PI / 2).translate(-5.15, 0, 0), top); boom.add(tube);
  const fair = mk(new THREE.SphereGeometry(0.45, 16, 10), top); fair.scale.set(1.6, 1, 1); boom.add(fair);
  for (const s of [-1, 1]) { const rv = mk(S.roundBox(1.6, 0.08, 1.4, 0.04), top); rv.position.set(-7.6, 0, s * 0.7); rv.rotation.x = s * 0.62; boom.add(rv); }
  const nozzle = mk(new THREE.CylinderGeometry(0.12, 0.12, 3.7, 12).rotateZ(Math.PI / 2).translate(-1.85, 0, 0), S.polishedSilver({ rough: 0.15 })); nozzle.position.x = -10.3; boom.add(nozzle);
  G.userData = { boom, nozzle, pivot: boom.position.clone(), tubeLen: 10.3, nozLen: 3.7, len: 41 };
  return G;
}
// boom tip position in tanker-local space for angle (rad, down from the horizontal, backwards) and nozzle extension e (0..1)
function boomTip(k, ang, ext) { const L = k.userData.tubeLen + ext * k.userData.nozLen; return k.userData.pivot.clone().add(new THREE.Vector3(-Math.cos(ang) * L, -Math.sin(ang) * L, 0)); }

// ---------------------------------------------------------------- clouds: instanced sunlit puffs (cumulus field) far below the planes
function cloudField({ n = 46, area = 2600, y = -320, seed = 5, scale = 1 } = {}) {
  const r = S.rng(seed); const items = [];
  for (let c = 0; c < n; c++) { const cx = (r() - 0.5) * area, cz = (r() - 0.5) * area, sz = (40 + r() * 70) * scale;
    const k = 6 + Math.floor(r() * 7);
    for (let j = 0; j < k; j++) { const s = sz * (0.45 + r() * 0.55); items.push({ p: [cx + (r() - 0.5) * sz * 2.4, y + (r() - 0.2) * sz * 0.35 + s * 0.15, cz + (r() - 0.5) * sz * 1.4], s: s, sv: [s * 1.2, s * 0.75, s] }); } }
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#a9c3df', emissiveIntensity: 0.18 });
  const im = S.instances(new THREE.IcosahedronGeometry(1, 2), m, items, { cast: false, receive: false });
  im.userData.items = items; return im;
}

// ---------------------------------------------------------------- fireball + debris (emissive spheres for bloom; instanced shards)
// lumpy puff geometry (noise-displaced icosphere), shared
let LUMP = null;
function lumpGeo() { if (LUMP) return LUMP; const g0 = new THREE.IcosahedronGeometry(1, 3); g0.deleteAttribute('normal'); g0.deleteAttribute('uv'); const g = mergeVertices(g0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const k = 1 + 0.14 * Math.sin(v.x * 4.1 + v.y * 2.3) * Math.cos(v.z * 3.7 - v.x) + 0.08 * Math.sin(v.y * 7.3 + v.z * 5.1); p.setXYZ(i, v.x * k, v.y * k, v.z * k); }
  g.computeVertexNormals(); return (LUMP = g); }
// fireball: white-hot core flash → many small flickering puffs whose heat rolls outward (white → yellow → orange → red), cooling into
// dark smoke that trails and rises. set(dt, scale, drift[x,y,z]) ; dt = seconds since contact. HDR colours feed the bloom.
function fireball({ n = 120, seed = 3 } = {}) {
  const r = S.rng(seed); const G = new THREE.Group();
  const fireM = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  const coreM = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.5, 4.6), transparent: true, fog: false });
  const smokeM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, envMapIntensity: 0.4 });
  const fire = new THREE.InstancedMesh(lumpGeo(), fireM, n), smoke = new THREE.InstancedMesh(lumpGeo(), smokeM, n);
  fire.frustumCulled = smoke.frustumCulled = false; fire.castShadow = false; smoke.castShadow = false;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), coreM); G.add(core, fire, smoke);
  const P = Array.from({ length: n }, () => { const u = r() * 2 - 1, a = r() * TAU, s2 = Math.sqrt(1 - u * u); return { d: [s2 * Math.cos(a) * 1.5, u * 0.75, s2 * Math.sin(a)], rr: Math.pow(r(), 0.8), sz: 0.6 + r() * 0.7, ph: r(), sg: 0.2 + r() * 0.2, rot: [r() * 6, r() * 6, r() * 6] }; });
  P.forEach((p, i) => smoke.setColorAt(i, new THREE.Color().setScalar(p.sg)));
  const C = [[1, new THREE.Color(3.0, 2.8, 2.2)], [0.8, new THREE.Color(1.7, 1.25, 0.3)], [0.55, new THREE.Color(1.35, 0.5, 0.06)], [0.3, new THREE.Color(0.85, 0.16, 0.03)], [0, new THREE.Color(0.25, 0.06, 0.03)]];
  const heatCol = (h) => { for (let k = 1; k < C.length; k++) if (h >= C[k][0]) return C[k][1].clone().lerp(C[k - 1][1], (h - C[k][0]) / (C[k - 1][0] - C[k][0])); return C.at(-1)[1].clone(); };
  fire.setColorAt(0, new THREE.Color()); smoke.instanceColor.needsUpdate = true;
  G.userData = { set(dt, scale = 1, drift = [0, 0, 0], t = 0) {
    const on = dt > 0; G.visible = on; if (!on) return;
    const k = 1 - Math.exp(-dt * 6); const cf = Math.max(0, 1 - dt / 0.8);
    core.scale.setScalar(Math.max(0.001, scale * (0.8 + 3.2 * k) * cf)); coreM.color.setRGB(6 * cf + 3 * (1 - cf), 5.5 * cf + 1.6 * (1 - cf), 4.6 * cf + 0.3 * (1 - cf)); coreM.opacity = clamp01(cf * 1.4);
    P.forEach((p, i) => { const a = dt * 1.1 - p.rr * 0.55 - p.ph * 0.15; // heat front rolls outward
      const R = scale * (0.5 + 4.6 * (1 - Math.exp(-Math.max(0, a) * 1.8))) * (0.2 + p.rr);
      const base = [p.d[0] * R + drift[0] * dt, p.d[1] * R + drift[1] * dt + dt * 0.5 * scale, p.d[2] * R + drift[2] * dt];
      const h = a < 0 ? 0 : clamp01(1 - a / 1.7) * (0.82 + 0.18 * Math.sin(t * 27 + i * 7.3));
      const grow = a < 0 ? 0 : Math.min(1, a / 0.12);
      const fs = scale * p.sz * (0.45 + 1.4 * h) * grow; S.place(fire, i, base, p.rot, a > 0 && h > 0.02 ? fs : 0.0001); fire.setColorAt(i, heatCol(h));
      const b = a - 0.9; // cooled into smoke: trails (drift) and rises
      const ss = b < 0 ? 0.0001 : scale * p.sz * Math.min(2.6, 0.8 + b * 0.9);
      S.place(smoke, i, [base[0] + drift[0] * b * 0.8, base[1] + b * 1.6 * scale, base[2] + drift[2] * b * 0.8], p.rot, ss); });
    fire.instanceMatrix.needsUpdate = smoke.instanceMatrix.needsUpdate = true; fire.instanceColor.needsUpdate = true; } };
  return G;
}
// burning debris: pieces on ballistic arcs with glowing trails (instanced spheres sampled back along each path)
function burningDebris({ n = 16, trail = 18, seed = 13 } = {}) {
  const r = S.rng(seed); const G = new THREE.Group();
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.25, 0.7), S.glossy('#9aa3ad', { rough: 0.4 }), n); heads.frustumCulled = false;
  const tr = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), n * trail); tr.frustumCulled = false;
  G.add(heads, tr);
  const P = Array.from({ length: n }, () => { const a = r() * TAU, el = -0.2 + r() * 1.2, v = 9 + r() * 16; return { v: [Math.cos(a) * Math.cos(el) * v * 1.3, Math.sin(el) * v, Math.sin(a) * Math.cos(el) * v * 0.7], w: [r() * 6, r() * 6, r() * 6], sz: 0.5 + r() * 1.3, life: 2.2 + r() * 2.5 }; });
  const pos = (p, t) => [p.v[0] * t - 5 * t * t, p.v[1] * t - 4.9 * t * t, p.v[2] * t];
  const hot = new THREE.Color(1.8, 0.85, 0.12), cool = new THREE.Color(0.3, 0.28, 0.26);
  G.userData = { set(dt, o = [0, 0, 0]) { G.position.set(...o);
    P.forEach((p, i) => { const on = dt > 0; S.place(heads, i, on ? pos(p, dt) : [0, -1e4, 0], [p.w[0] * dt, p.w[1] * dt, p.w[2] * dt], on ? p.sz : 0.0001);
      for (let k = 0; k < trail; k++) { const tt = dt - k * 0.035; const j = i * trail + k; const burn = clamp01(1 - dt / p.life);
        if (!on || tt < 0) { S.place(tr, j, [0, -1e4, 0], [0, 0, 0], 0.0001); continue; }
        const f = k / trail; S.place(tr, j, pos(p, tt), [0, 0, 0], (0.5 + 0.45 * p.sz) * (1 - f * 0.8) * (0.4 + 0.6 * burn)); tr.setColorAt(j, hot.clone().multiplyScalar(burn * (1 - f)).add(cool.clone().multiplyScalar(f + (1 - burn) * 0.6))); } });
    heads.instanceMatrix.needsUpdate = tr.instanceMatrix.needsUpdate = true; if (tr.instanceColor) tr.instanceColor.needsUpdate = true; } };
  G.userData.set(-1);
  return G;
}
function debris({ n = 70, seed = 9, mat } = {}) {
  const r = S.rng(seed); const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.15, 0.7), mat ?? S.glossy('#c9d0d8', { rough: 0.3 }), n); im.castShadow = false; im.frustumCulled = false;
  const P = Array.from({ length: n }, () => { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u), v = 6 + r() * 16; return { v: [s * Math.cos(a) * v, u * v * 0.6 + 3, s * Math.sin(a) * v], w: [r() * 8, r() * 8, r() * 8], sz: 0.3 + r() * 1.4 }; });
  im.userData = { set(dt, o = [0, 0, 0], g = 9.8) { P.forEach((p, i) => { if (dt <= 0) { S.place(im, i, [0, 0, 0], [0, 0, 0], 0.0001); return; }
    S.place(im, i, [o[0] + p.v[0] * dt - 6 * dt * dt * 0.5, o[1] + p.v[1] * dt - 0.5 * g * dt * dt, o[2] + p.v[2] * dt], [p.w[0] * dt, p.w[1] * dt, p.w[2] * dt], p.sz); }); im.instanceMatrix.needsUpdate = true; } };
  return im;
}


// ---------------------------------------------------------------- sea vehicles and ships (sea set units: x/z free, 1 unit ≈ 50 ft of depth; vehicles exaggerated)
// Alvin (1966): white fibreglass fairing and white sail (RESEARCH §11.4: white in 1966), 3 forward viewports, belly port, stern prop, side props,
// lobster-claw arm, lamps. Built in feet: ~22 ft long along +x (nose +x), 8 ft beam. userData: lamps [Vector3 local], dir (local forward-down)
export function alvin({ pilots = false } = {}) {
  const G = new THREE.Group(); const white = S.glossy('#f7f6f2', { rough: 0.3, coat: 0.8 }), grey = S.clay('#9aa3ad', { rough: 0.45 }), dark = S.glossy('#3d5f7f', { rough: 0.08, coat: 1 });
  const prof = [[0.01, -11], [1.6, -10.6], [3.0, -9.2], [3.8, -6.5], [4.0, -2], [4.0, 3], [3.7, 6.5], [3.0, 9.0], [1.9, 10.6], [0.01, 11.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = mk(new THREE.LatheGeometry(prof, 48).rotateZ(-Math.PI / 2), white); body.scale.set(1, 1.15, 1); G.add(body);
  const keel = mk(S.roundBox(16, 1.0, 3.2, 0.45), white); keel.position.set(-0.5, -4.9, 0); G.add(keel);
  const sailG = new THREE.CapsuleGeometry(0.9, 3.6, 8, 20).rotateZ(Math.PI / 2); const sail = mk(sailG, white); sail.scale.set(1, 2.6, 1); sail.position.set(2.4, 5.0, 0); G.add(sail);
  const sailTop = mk(S.roundBox(2.4, 0.3, 1.0, 0.12), grey); sailTop.position.set(2.6, 7.2, 0); G.add(sailTop);
  // viewports: 3 forward (pilot + two observers) and the belly port. Larger than life so they read.
  const vp = []; for (const [y, z] of [[1.0, 0], [-0.6, 1.25], [-0.6, -1.25]]) { const ring = mk(new THREE.TorusGeometry(0.62, 0.16, 10, 28).rotateY(Math.PI / 2), grey); const x = Math.abs(z) > 0.1 ? 10.72 : 10.88; ring.position.set(x, y, z); ring.lookAt(x + 5, y * 2.5, z * 3.5); G.add(ring);
    const gl = mk(new THREE.CircleGeometry(0.6, 28), pilots ? new THREE.MeshPhysicalMaterial({ color: '#bfe3f3', roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 }) : dark, { cast: false }); gl.position.copy(ring.position); gl.quaternion.copy(ring.quaternion); gl.rotateY(Math.PI / 2); G.add(gl); vp.push(gl); }
  // stern prop + guard, side props
  const hub = mk(new THREE.ConeGeometry(0.5, 1.4, 16).rotateZ(Math.PI / 2), grey); hub.position.set(-11.6, 0, 0); G.add(hub);
  const prop = new THREE.Group(); prop.position.set(-11.9, 0, 0); G.add(prop); for (let k = 0; k < 3; k++) { const bl = mk(S.roundBox(0.18, 1.9, 0.6, 0.08), grey); bl.position.y = 0; bl.geometry = bl.geometry.clone().translate(0, -0.1, 0); bl.rotation.x = k * TAU / 3; prop.add(bl); }
  const guard = mk(new THREE.TorusGeometry(2.2, 0.14, 8, 32).rotateY(Math.PI / 2), white); guard.position.set(-11.9, 0, 0); G.add(guard);
  for (const z of [-4.3, 4.3]) { const pod = mk(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16).rotateZ(Math.PI / 2), white); pod.position.set(-6.5, -1.2, z); G.add(pod); const st = mk(S.roundBox(0.4, 0.4, 0.8, 0.1), grey); st.position.set(-6.5, -1.4, z * 0.88); G.add(st); }
  // manipulator arm with lobster claw (stowed forward-low)
  const arm = new THREE.Group(); arm.position.set(7.6, -3.6, 1.6); G.add(arm);
  const a1 = mk(new THREE.CylinderGeometry(0.16, 0.16, 3.2, 10).rotateZ(Math.PI / 2).translate(1.6, 0, 0), grey); a1.rotation.z = -0.35; arm.add(a1);
  const claw = new THREE.Group(); claw.position.set(3.0, -1.1, 0); arm.add(claw); for (const s2 of [-1, 1]) { const c = mk(S.roundBox(1.0, 0.16, 0.22, 0.05), grey); c.position.set(0.4, s2 * 0.18, 0); c.rotation.z = s2 * 0.35; claw.add(c); }
  // lamps (warm)
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#fff1c4', emissiveIntensity: 2.2 }); const lamps = [];
  for (const [x, y, z] of [[8.3, -2.6, -2.0], [8.3, -2.6, 2.0], [4.6, 6.2, 0]]) { const l = mk(new THREE.CylinderGeometry(0.45, 0.38, 0.7, 16).rotateZ(Math.PI / 2), grey); l.position.set(x, y, z); G.add(l); const f = mk(new THREE.CircleGeometry(0.36, 16).rotateY(Math.PI / 2), lampM, { cast: false }); f.position.set(x + 0.36, y, z); G.add(f); lamps.push(new THREE.Vector3(x + 0.4, y, z)); }
  // pilots: two tiny figures behind the forward viewports
  if (pilots) { const skin = S.glossy('#bfe4ee', { rough: 0.35 }); for (const [y, z] of [[-0.7, 1.15], [-0.7, -1.15]]) { const hd = mk(new THREE.SphereGeometry(0.5, 16, 12), skin); hd.position.set(8.2, y + 0.2, z); G.add(hd); const bd = mk(new THREE.CapsuleGeometry(0.55, 0.6, 6, 12), skin); bd.position.set(7.6, y - 0.9, z); G.add(bd); } }
  G.userData = { lamps, prop, lampM };
  return G;
}
// CURV: aluminium tube frame (~13 x 5 x 6 ft), 4 black oblong buoyancy tanks with red-orange stencils, claw, props. Built in feet along +x.
export function curv() {
  const G = new THREE.Group(); const al = S.polishedSilver({ rough: 0.3, color: '#dfe3e7' }), tankM = S.glossy('#353a42', { rough: 0.3, coat: 1 });
  const L = 13, Wd = 5, Hh = 4.2; const rr = rods(24, al, { seg: 8 }); G.add(rr); let k = 0;
  const c = []; for (const x of [-L / 2, L / 2]) for (const y of [0, Hh]) for (const z of [-Wd / 2, Wd / 2]) c.push(new THREE.Vector3(x, y, z));
  const edge = (a, b) => rr.set(k++, c[a], c[b], 0.16);
  [[0, 4], [1, 5], [2, 6], [3, 7], [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 5], [2, 7]].forEach(([a, b]) => edge(a, b)); rr.done();
  for (let i = 0; i < 4; i++) { const t = mk(new THREE.CapsuleGeometry(0.75, 10, 8, 20).rotateZ(Math.PI / 2), tankM); t.position.set(0, Hh + 0.85, -1.9 + i * 1.27); G.add(t); }
  const lab = PR.labelPlane('CURV', { w: 3.2, h: 1.0, bg: null, color: '#ff6a2a' }); lab.position.set(0, Hh + 0.9, 2.7); G.add(lab);
  const claw = new THREE.Group(); claw.position.set(L / 2 + 0.6, 1.2, 0); G.add(claw); for (const s2 of [-1, 1]) { const j = mk(S.roundBox(2.0, 0.3, 0.5, 0.1), S.clay('#4a4f57')); j.position.set(0.8, s2 * 0.4, 0); j.rotation.z = s2 * 0.3; claw.add(j); }
  const box = mk(S.roundBox(3.2, 1.6, 2.4, 0.3), S.clay('#e9ecef')); box.position.set(-1, 1.0, 0); G.add(box);
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#fff1c4', emissiveIntensity: 2 }); const lamp = mk(new THREE.SphereGeometry(0.45, 12, 10), lampM); lamp.position.set(L / 2, 3.2, 1.6); G.add(lamp);
  G.userData = { lamp: lamp.position.clone() };
  return G;
}
// a Navy ship in haze grey (lightened): hull planform with a pointed bow, superstructure, funnel, mast. Units: ship ~ len long along +x
export function ship({ len = 14, beam = 2.4, color = '#bcc6cf', kind = 'navy' } = {}) {
  const G = new THREE.Group(); const hullM = S.glossy(color, { rough: 0.35 }), deck = S.clay('#9ea8b2', { rough: 0.7 }), sup = S.glossy(kind === 'trawler' ? '#ffffff' : '#dfe5ea', { rough: 0.35 });
  const L = len, B = beam, Hh = kind === 'trawler' ? 1.0 : 1.5;
  const plan = [[-L / 2, -B / 2], [L * 0.22, -B / 2], [L / 2, 0], [L * 0.22, B / 2], [-L / 2, B / 2]];
  const hull = planform(plan, Hh, hullM, { bevel: 0.15 }); hull.position.y = 0; G.add(hull);
  const boot = planform(plan.map(([x, z]) => [x * 1.005, z * 1.02]), 0.18, S.clay(kind === 'trawler' ? '#2a5c9a' : '#6f7c88')); boot.position.y = -0.35; G.add(boot);
  const dk = planform(plan.map(([x, z]) => [x * 0.98, z * 0.92]), 0.06, deck); dk.position.y = Hh / 2 + 0.02; G.add(dk);
  const y0 = Hh / 2 + 0.05;
  if (kind === 'trawler') { const wh = mk(S.roundBox(1.6, 1.2, 1.3, 0.12), sup); wh.position.set(-0.6, y0, 0); G.add(wh); const rf = mk(S.roundBox(1.8, 0.12, 1.5, 0.05), S.clay('#2a5c9a')); rf.position.set(-0.6, y0 + 1.2, 0); G.add(rf);
    const mast = mk(new THREE.CylinderGeometry(0.07, 0.08, 3.6, 8).translate(0, 1.8, 0), S.wood()); mast.position.set(1.4, y0, 0); G.add(mast);
    const boom = mk(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 8).rotateZ(-1.0).translate(1.3, 0.9, 0), S.wood()); boom.position.set(1.4, y0 + 1.2, 0); G.add(boom);
    G.userData = { boomTip: new THREE.Vector3(1.4 + 2.8, y0 + 3.0, 0) }; return G; }
  const s1 = mk(S.roundBox(L * 0.28, 1.1, B * 0.7, 0.1), sup); s1.position.set(L * 0.05, y0, 0); G.add(s1);
  const s2 = mk(S.roundBox(L * 0.15, 0.8, B * 0.55, 0.08), sup); s2.position.set(L * 0.08, y0 + 1.1, 0); G.add(s2);
  const br = mk(S.roundBox(L * 0.12, 0.25, B * 0.62, 0.05), S.glossy('#5d7d9c', { rough: 0.1 }), { cast: false }); br.position.set(L * 0.12, y0 + 1.5, 0); G.add(br);
  const fun = mk(S.roundBox(0.9, 1.2, 0.8, 0.25), sup); fun.position.set(-L * 0.08, y0 + 1.0, 0); G.add(fun);
  const mast = mk(new THREE.CylinderGeometry(0.06, 0.09, 3.4, 8).translate(0, 1.7, 0), sup); mast.position.set(L * 0.1, y0 + 1.6, 0); G.add(mast);
  const yard = mk(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6).rotateX(Math.PI / 2), sup); yard.position.set(L * 0.1, y0 + 4.2, 0); G.add(yard);
  if (kind === 'mizar') { const af = new THREE.Group(); af.position.set(-L * 0.25, y0, 0); G.add(af); for (const z of [-0.7, 0.7]) { const leg = mk(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 8).translate(0, 1.4, 0), S.clay('#e0241b' === color ? color : '#f2a33a')); leg.position.z = z; leg.rotation.x = z * 0.15; af.add(leg); } }
  if (kind === 'petrel') { const bm = mk(new THREE.CylinderGeometry(0.07, 0.09, 4, 8).translate(0, 2, 0), sup); bm.position.set(-L * 0.36, y0, 0); bm.rotation.z = 0.6; G.add(bm); const cap = mk(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 16), S.clay('#6f7c88')); cap.position.set(-L * 0.3, y0 + 0.2, 0); G.add(cap); }
  G.userData = { well: new THREE.Vector3(kind === 'petrel' ? -L * 0.4 : 0, 0, 0) };
  return G;
}

// Simó's shrimp trawler (metres): white sheered hull with a pointed bow, wooden deck, wheelhouse aft, mast + boom forward, gallows astern. Bow +x.
export function trawlerBoat({ L = 14, B = 4.4 } = {}) {
  const G = new THREE.Group(); const white = S.glossy('#fbfaf6', { rough: 0.3, coat: 0.7 }), blue = S.glossy('#2a5c9a', { rough: 0.35 }), woodM = S.wood({ coat: 0.3 });
  const prof = [[-7, -0.7], [-7, 1.5], [-2, 1.3], [3, 1.6], [6, 2.3], [7.1, 2.5], [6.4, 0.2], [4.6, -1.0], [-5.2, -1.1]];
  const sh = new THREE.Shape(); prof.forEach(([x, y], i) => i ? sh.lineTo(x * L / 14, y) : sh.moveTo(x * L / 14, y)); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 1, steps: 1 }).translate(0, 0, -0.5);
  // densify along x for the taper: rebuild via a lathe-free trick: subdivide by sampling (simple: scale z per vertex)
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (L / 14), y = p.getY(i); const w = x > 1 ? Math.max(0.04, 1 - Math.pow((x - 1) / 6.2, 1.5)) : x < -5 ? 0.88 : 1; const ww = w * (y < -0.5 ? 0.6 : 1); p.setZ(i, p.getZ(i) * B * ww); }
  g.computeVertexNormals(); const hull = mk(g, white); G.add(hull);
  // rub rail (blue) along the gunwale on both sides
  for (const sgn of [-1, 1]) { const pts = []; for (let k = 0; k <= 16; k++) { const x = -7 + k * 14 / 16; const y = x < -2 ? S.lerp(1.5, 1.3, (x + 7) / 5) : x < 3 ? S.lerp(1.3, 1.6, (x + 2) / 5) : x < 6 ? S.lerp(1.6, 2.3, (x - 3) / 3) : S.lerp(2.3, 2.5, (x - 6) / 1.1); const w = x > 1 ? Math.max(0.04, 1 - Math.pow((x - 1) / 6.2, 1.5)) : x < -5 ? 0.88 : 1; pts.push(new THREE.Vector3(x * L / 14, y - 0.15, sgn * (B / 2 * w + 0.03))); }
    G.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.09, 6, false), blue)); }
  const deck = mk(S.roundBox(L * 0.78, 0.08, B * 0.86, 0.03), woodM); deck.position.set(-0.9, 1.15, 0); G.add(deck);
  const wh = mk(S.roundBox(3.0, 2.2, 2.6, 0.12), white); wh.position.set(-3.6, 1.2, 0); G.add(wh);
  const roof = mk(S.roundBox(3.4, 0.16, 3.0, 0.06), blue); roof.position.set(-3.6, 3.4, 0); G.add(roof);
  for (const z of [-1.31, 1.31]) for (const x of [-4.4, -3.4, -2.6]) { const w = mk(S.roundBox(0.6, 0.6, 0.04, 0.05), S.glossy('#5d7d9c', { rough: 0.1 }), { cast: false }); w.position.set(x, 2.3, z); G.add(w); }
  const fw = mk(S.roundBox(0.04, 0.6, 1.8, 0.03), S.glossy('#5d7d9c', { rough: 0.1 }), { cast: false }); fw.position.set(-2.08, 2.3, 0); G.add(fw);
  const mast = mk(new THREE.CylinderGeometry(0.1, 0.13, 6.5, 10).translate(0, 3.25, 0), woodM); mast.position.set(1.5, 1.2, 0); G.add(mast);
  const boom = mk(new THREE.CylinderGeometry(0.07, 0.07, 6, 8).translate(0, 3, 0), woodM); boom.position.set(1.5, 2.2, 0); boom.rotation.z = -1.05; boom.rotation.x = 0.5; G.add(boom);
  const gal = mk(new THREE.TorusGeometry(1.4, 0.09, 6, 16, Math.PI), S.clay('#8d97a2')); gal.position.set(-6.4, 1.2, 0); gal.rotation.y = Math.PI / 2; G.add(gal);
  const drum = mk(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16).rotateX(Math.PI / 2), S.clay('#c8a46a')); drum.position.set(-5.3, 1.7, 0); G.add(drum);
  boom.updateMatrixWorld(); G.userData = { boomTip: new THREE.Vector3(1.5 + Math.sin(1.05) * 6, 2.2 + Math.cos(1.05) * 6 * Math.cos(0.5), Math.cos(1.05) * 6 * Math.sin(0.5)), deckY: 1.2 };
  return G;
}
// rope: a polyline drawn with instanced rods; .setPoints(pts, r)
function rope(n, color = '#f3efe2', r = 0.1) { const rr = rods(n, S.clay(color, { rough: 0.7 }), { seg: 7 }); rr.userData.r = r; rr.setPoints = (pts, rad = r) => { for (let i = 0; i < n; i++) { if (i < pts.length - 1) rr.set(i, pts[i], pts[i + 1], rad); else rr.hide(i); } rr.done(); }; return rr; }
// lamp cone (additive beam) from apex at origin along -y; .aim(from, to, len)
const coneTex = S.canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { srgb: false });
function beam({ len = 12, rad = 3.2, color = '#fff0c2', opacity = 0.3 } = {}) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 32, 1, true).translate(0, -len / 2, 0), new THREE.MeshBasicMaterial({ color, alphaMap: coneTex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = 5; m.frustumCulled = false; const down = new THREE.Vector3(0, -1, 0);
  m.aim = (from, to) => { m.position.copy(from); const d = to.clone().sub(from); const L = d.length(); m.quaternion.setFromUnitVectors(down, d.normalize()); m.scale.set(1, L / len, 1); }; return m;
}

// ---------------------------------------------------------------- shared stage: scene, camera, studio env + key light, sky, caption, pills, post
async function stage(H, ctx, shot, o = {}) {
  const P0 = shot.params ?? {};
  await PR.loadFont();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, o.near ?? 0.1, o.far ?? 3000);
  const st = S.studio(scene, ctx.renderer, { target: o.target ?? [0, 0, 0], span: o.span ?? 20, az: o.az ?? 130, el: o.el ?? 48, keyI: o.keyI ?? 2.3, color: o.color, fog: o.fog ?? false, contact: o.contact ?? false, mapSize: o.mapSize ?? 4096, cycEnv: o.cycEnv ?? 0.55 });
  if (o.hemi !== 0) scene.add(new THREE.HemisphereLight('#ffffff', '#e9e4d8', o.hemi ?? 0.4));
  const layer = H.layerOf(ctx);
  const dur = shot.duration ?? 8;
  const cap = P0.caption === null || P0.caption === '' ? null : (P0.caption ?? o.caption) ? H.caption(layer, P0.caption ?? o.caption, 'left:5.5%;top:7.5%', { at: 0.35 }) : null;
  const src = H.sourceLine(layer, P0.source === undefined ? (o.source ?? null) : P0.source);
  let fx = null;
  const sky = o.sky ? (await import('./thumbs.js')).paintedSky(P0.seed ?? o.seed ?? 4) : null;
  const toPx = (p) => { const q = (p.isVector3 ? p.clone() : v3(p)).project(camera); return [(q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080, q.z < 1 && q.z > -1]; };
  const cue = (spec, fb) => S.cue(shot, spec, fb);
  // pills: [{ text, at, until, target, red }]; targets: name → [x,y,z] (or a function of t)
  const pills = (o.ownPills ? [] : (P0.pills ?? o.pills ?? [])).map((p, i) => ({ ...p, el: H.pill(layer, p.text, { size: p.size ?? 26, dot: p.red ? RED : null }), t0: cue(p.at, 0.8 + i * 1.1), t1: p.until == null ? Infinity : cue(p.until, Infinity) }));
  pills.forEach(p => p.el.at(0, 0, 0));
  const finish = (post = {}) => {
    if (sky) { scene.background = sky; scene.fog = o.keepFog ? scene.fog : null; st.cyc.visible = false; }
    st.applyEnv();
    fx = H.P.post(ctx, scene, camera, { ao: post.ao ?? { radius: 0.8, intensity: 1.6, falloff: 0.8 }, dof: post.dof ?? false, bloom: post.bloom ?? { intensity: 0.45, threshold: 1.3, radius: 0.6 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    return fx;
  };
  const cam = (keys, t, opt = {}) => { const c = S.rig(camera, P0.camera ?? keys, t, { t0: 0, t1: dur, float: 0.02, ...opt }); if (fx?.dof) fx.focus(opt.focus ?? c.dist); return c; };
  const frame = (t, targets = {}) => {
    cap?.type(t);
    for (const p of pills) { let tg = typeof p.target === 'string' ? targets[p.target] : p.target; if (typeof tg === 'function') tg = tg(t); tg = tg ?? [0, 0, 0];
      const [x, y, vis] = toPx(tg); const a = vis ? S.range(t, p.t0, p.t0 + 0.35) * (1 - S.range(t, p.t1, p.t1 + 0.3)) : 0; p.el.at(x, y, a); }
    if (st.contact && st.contact.plane.visible) st.contact.update([st.cyc]);
  };
  return { P0, scene, camera, st, layer, dur, cap, src, sky, finish, toPx, cue, cam, frame, fx: () => fx };
}
// a big serif title (thumbnail type: black Instrument Serif), positioned in % of the frame
function serifTitle(H, layer, text, { css = 'right:5%;top:7%', size = 150, color = '#0b0b0b' } = {}) {
  if (!text) return null; const s = H.sc();
  const d = H.K.div(layer, `opacity:1;${css};font:400 ${size * s}px/0.95 ${H.FONT.serif},serif;color:${color};letter-spacing:-0.01em;white-space:nowrap;text-align:right`, text);
  return d;
}
// billboards: turn label planes to face the camera every frame (single-sided planes never read mirrored)
const faceCam = (objs, camera) => { for (const o of objs) if (o) o.quaternion.copy(camera.quaternion); };

export default function palSets(H) {
  return {
    // ================================================================ bomb: the hero B28 (1 unit = 10 cm)
    async bomb(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'hero';
      const onSky = mode === 'chute' || !!P0.sky;
      const G = await stage(H, ctx, shot, { target: [0, 0, 0], span: mode === 'chute' ? 60 : 46, az: 128, el: 52, sky: onSky, seed: P0.seed ?? 4, far: 6000,
        contact: onSky ? false : { w: 170, d: 110, blur: 2.6, darkness: 1.1, opacity: 0.6 }, fog: onSky ? false : [115, 270], color: '#f4f1ea',
        caption: { hero: null, four: null, chute: null, numbers: null }[mode] });
      const { scene, camera } = G; const { L, R } = B28;
      const dur = G.dur; const bombs = []; const extra = {};
      if (mode === 'hero') {
        const plinth = mk(S.roundBox(52, 7, 18, 0.8, 4), S.clay('#f6f4ef', { rough: 0.45, coat: 0.5 })); scene.add(plinth);
        const chockM = S.wood({ coat: 0.4 }); for (const x of [-11, 11]) { const c = mk(S.roundBox(3, 2.2, 9, 0.3), chockM); c.position.set(x, 7, 0); scene.add(c); }
        const b = b28(); b.rotation.z = -Math.PI / 2; const piv = new THREE.Group(); piv.position.set(0, 7 + 2.0 + R, 0); b.position.x = -L / 2; piv.add(b); scene.add(piv); bombs.push(piv);
        extra.piv = piv;
      } else if (mode === 'four') {
        const xs = P0.xs ?? [-39, -24, -9, 8.5];
        for (let i = 0; i < 3; i++) { const b = b28({ seed: 1 + i }); b.position.set(xs[i], 0, 0); b.rotation.y = Math.PI / 4 + (i - 1) * 0.06; scene.add(b); bombs.push(b); }
        const ol = dashedOutline(b28Silhouette(), { r: P0.stroke ?? 0.62 }); ol.position.set(xs[3], 0.2, 0); scene.add(ol); extra.ol = ol;
        // a faint dashed footprint ring on the floor, the empty slot
        const ring = mk(new THREE.RingGeometry(5.0, 5.6, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), { cast: false }); ring.position.set(xs[3], 0.05, 0); scene.add(ring); extra.ring = ring;
      } else if (mode === 'numbers') {
        const missing = new Set(P0.missing ?? []);
        for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 20;
          let b; if (missing.has(i + 1)) { b = dashedOutline(b28Silhouette(), { r: 0.5 }); b.position.set(x, 0.2, 0); }
          else { b = b28({ seed: 1 + i }); b.position.set(x, 0, 0); b.rotation.y = 0.45; }
          scene.add(b); const num = PR.labelPlane(String(i + 1), { w: 7, h: 7, bg: '#ffffff', color: '#14233d', radius: 0.5 }); num.material.alphaTest = 0.5; num.position.set(x, L + 7, 0); scene.add(num);
          bombs.push({ b, num, x, missing: missing.has(i + 1), at: G.cue((P0.at ?? [])[i], 0.7 + i * 0.9) }); }
        extra.numLit = [0, 1, 2, 3].map(i => PR.labelPlane(String(i + 1), { w: 7, h: 7, red: true, radius: 0.5 }));
        extra.numLit.forEach((m, i) => { m.material.alphaTest = 0.5; m.position.copy(bombs[i].num.position); m.position.z += 0.05; m.visible = false; scene.add(m); });
      } else if (mode === 'chute') {
        const big = (P0.chute ?? 64) === 64; const cr = big ? 46 : 24, line = big ? 70 : 42;
        const rig = new THREE.Group(); scene.add(rig); // pivot at the confluence of the risers (top of the bomb's rigging)
        const can = canopy({ r: cr, h: cr * 0.62, gores: 24 }); can.position.y = line; rig.add(can);
        const b = b28(); b.position.y = -L - 6; rig.add(b); bombs.push(b);
        const lines = rods(26, S.clay('#d8d2bf', { rough: 0.8 })); rig.add(lines);
        const lp = []; can.userData.skirt.forEach((s, i) => lines.set(i, new THREE.Vector3(s.x, line, s.z), new THREE.Vector3(0, 0, 0), 0.13));
        lines.set(24, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -6, 0), 0.3); lines.done();
        // far cloud puffs drifting up (descent)
        const cl = cloudField({ n: 26, area: 3000, y: 0, seed: 8, scale: 1.6 }); scene.add(cl); extra.cl = cl;
        extra.rig = rig; extra.can = can;
        G.st.setKey(140, 58); G.st.key.shadow.camera.far = 800;
      }
      G.st.key.shadow.camera.updateProjectionMatrix();
      const title = mode === 'four' ? serifTitle(H, G.layer, P0.title ?? null, { size: P0.titleSize ?? 130, css: 'right:4.5%;top:5%' }) : null;
      const statusPills = mode === 'numbers' && P0.status ? P0.status.map((s, i) => H.pill(G.layer, s, { size: 19, dot: i === 3 ? RED : null })) : [];
      statusPills.forEach(p => p.at(0, 0, 0));
      G.finish({ dof: mode === 'chute' ? false : { focus: 120, range: 60, bokeh: 1.4 }, bloom: { intensity: 0.35, threshold: 1.4, radius: 0.5 } });
      const keys = {
        hero: [{ pos: [-40, 22, 70], look: [0, 11, 0], mm: 50 }, { pos: [-22, 17, 78], look: [2, 11, 0], mm: 50 }],
        four: [{ pos: [-8, 12, 104], look: [-12, 22.5, 0], mm: 46 }, { pos: [-12, 11.5, 101], look: [-13, 22.5, 0], mm: 46 }],
        numbers: [{ pos: [-26, 36, 130], look: [0, 20, 0], mm: 38 }, { pos: [10, 34, 128], look: [0, 20, 0], mm: 38 }],
        chute: [{ pos: [110, -60, 220], look: [0, 22, 0], mm: 32 }, { pos: [80, -70, 235], look: [0, 18, 0], mm: 32 }],
      }[mode];
      return { scene, camera, layer: G.layer, update(t) {
        const c = G.cam(keys, t, { float: mode === 'four' ? 0.0 : 0.04 });
        if (mode === 'hero') { extra.piv.rotation.y = (P0.spin ?? 0.09) * t - 0.25; }
        if (mode === 'four') { const k = P0.drawAt == null ? 1 : S.range(t, G.cue(P0.drawAt, 0.5), G.cue(P0.drawAt, 0.5) + 1.2); extra.ol.userData.draw(k); extra.ol.quaternion.copy(camera.quaternion);
          if (title) title.style.opacity = String(S.range(t, G.cue(P0.titleAt, 0), G.cue(P0.titleAt, 0) + 0.4)); }
        if (mode === 'numbers') bombs.forEach((b, i) => { const k = S.range(t, b.at, b.at + 0.35); b.num.visible = k < 1; extra.numLit[i].visible = k > 0; const s = 1 + 0.25 * Math.sin(Math.PI * k);
          extra.numLit[i].scale.setScalar(s); faceCam([b.num, extra.numLit[i]], camera);
          if (b.missing) { b.b.userData.draw(S.range(t, b.at, b.at + 1.0)); b.b.quaternion.copy(camera.quaternion); }
          else b.b.userData.mats.forEach(m => { m.emissive = m.emissive ?? new THREE.Color(); m.emissive.set('#ffffff'); m.emissiveIntensity = 0.0; m.color.setScalar(S.lerp(0.62, 1, k)); });
          const sp = statusPills[i]; if (sp) { const [x, y, v] = G.toPx([b.x, -3, 6]); sp.at(x, y + 60, v ? S.range(t, b.at + 0.3, b.at + 0.6) : 0); } });
        if (mode === 'chute') { const sw = Math.sin(t * 1.1) * 0.12 + Math.sin(t * 0.47 + 1) * 0.05; extra.rig.rotation.z = sw; extra.rig.rotation.x = Math.sin(t * 0.8 + 0.4) * 0.05; extra.rig.rotation.y = t * 0.05;
          extra.can.userData.set({ breath: 0.5 + 0.5 * Math.sin(t * 2.3) });
          const im = extra.cl, it = im.userData.items; it.forEach((p, i) => S.place(im, i, [p.p[0] * 0.8, p.p[1] - 700 + t * 18, p.p[2] * 0.3 - 1900], [0, 0, 0], p.sv)); im.instanceMatrix.needsUpdate = true; }
        G.frame(t, { bomb: [0, 20, 0] });
      } };
    },

    // ================================================================ village: Palomares diorama (map 1 unit = 100 m; buildings/people exaggerated ~10x)
    // x = east, z = south. Positions from RESEARCH §11.7 / §3c (lat/lon → local metres / 100).
    async village(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'day';
      if (mode === 'cleanup') await PR.loadMannequins(['military']);
      const G = await stage(H, ctx, shot, { target: [2, 0, 3], span: 30, az: 150, el: 50, sky: true, seed: P0.seed ?? 6, far: 1200, keyI: 2.6,
        caption: { day: 'PALOMARES, SPAIN · 1966', impacts: '18 JAN 1966 · THREE BOMBS ON LAND', dust: 'PLUTONIUM DUST · WIND FROM THE NW (MODELLED)', cleanup: 'THE US CLEANUP · JAN–APR 1966', fence: 'PALOMARES TODAY' }[mode],
        source: { day: null, impacts: 'SOURCE: CSN; DNA 1975 · POSITIONS APPROXIMATE', dust: 'SOURCE: CSN MODEL (MM5/CALPUFF) · ILLUSTRATION', cleanup: 'SOURCE: GAO; CSN · ILLUSTRATION', fence: 'SOURCE: CSN · ILLUSTRATION' }[mode],
        pills: P0.pills ?? (P0.labels === false ? [] : {
          day: [{ text: 'PALOMARES', target: 'village', at: 0.8 }, { text: 'ALMANZORA RIVERBED (DRY)', target: 'river', at: 1.6 }, { text: 'MEDITERRANEAN', target: 'sea', at: 2.4 }],
          impacts: [{ text: 'RIVERBED · INTACT', target: 'bomb1', at: 1.6 }, { text: 'BEHIND THE CEMETERY', target: 'bomb2', at: 3.6, red: true }, { text: 'EDGE OF THE VILLAGE', target: 'bomb3', at: 5.6, red: true }],
          dust: [{ text: 'WIND FROM THE NW', target: 'wind', at: 1.4 }, { text: 'CONTAMINATED ZONES', target: 'zone2', at: 5.6, red: true }],
          cleanup: [{ text: '1,400 TONS OF SOIL AND PLANTS', target: 'barrels', at: 1.2 }, { text: 'SHIPPED TO SOUTH CAROLINA', target: 'barrels2', at: 2.6 }],
          fence: [{ text: 'FENCED ZONE · PLUTONIUM STILL IN THE SOIL', target: 'fence', at: 1.2, red: true }],
        }[mode]) });
      const { scene, camera } = G; const dur = G.dur; const r = S.rng(P0.seed ?? 11);
      const geo = (lat, lon) => [(lon + 1.7973) * 887, -(lat - 37.2474) * 1110];
      const SITE = { village: [0, 0], b1: geo(37.244, -1.777), b2: geo(37.2439, -1.8128), b3: geo(37.2476, -1.7928), z2b: geo(37.249, -1.809), z6: geo(37.2552, -1.7764), beach: geo(37.2325, -1.7954), cem: [-10.2, 2.6] };
      const DC = [2, 4], DR = 27;
      const coast = [[-12, 46], [-4, 31], [1.7, 16.5], [10, 11.2], [19.7, 6.4], [23, -1.3], [27, -10], [34, -22]];
      const coastZ = (x) => { for (let i = 1; i < coast.length; i++) if (x <= coast[i][0]) { const [x0, z0] = coast[i - 1], [x1, z1] = coast[i]; return S.lerp(z0, z1, (x - x0) / (x1 - x0)); } return coast.at(-1)[1]; };
      const inSea = (x, z) => z > coastZ(x) - 0.2;
      const river = [[11, -30], [12.5, -20], [14.2, -12], [15.6, -5], [17.2, 1], [18.4, 4.2], [19.7, 6.6]];
      const inDisc = (x, z, m = 0) => Math.hypot(x - DC[0], z - DC[1]) < DR - m;
      const dRiver = (x, z) => { let d = 1e9; for (let i = 1; i < river.length; i++) { const [ax, az] = river[i - 1], [bx, bz] = river[i]; const vx = bx - ax, vz = bz - az; const u = clamp01(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - u * vx, z - az - u * vz)); } return d; };
      // ground texture: ochre plain, field patches, beach, the riverbed, the shallow sea
      const TX = 2048, uvx = (x) => ((x - DC[0]) / (2 * DR) + 0.5) * TX, uvz = (z) => ((z - DC[1]) / (2 * DR) + 0.5) * TX;
      const groundTex = S.canvasTex(TX, TX, (g) => {
        g.fillStyle = '#e6d3a4'; g.fillRect(0, 0, TX, TX);
        for (let i = 0; i < 260; i++) { const x = r() * TX, y = r() * TX, w = 30 + r() * 110, h = 20 + r() * 80; g.fillStyle = ['#dcc690', '#e9d8ad', '#d7c79a', '#cfc08c'][i % 4]; g.globalAlpha = 0.55; g.fillRect(x, y, w, h); }
        g.globalAlpha = 1;
        // riverbed: wide pale gravel band
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); river.forEach(([x, z], i) => i ? g.lineTo(uvx(x), uvz(z)) : g.moveTo(uvx(x), uvz(z))); };
        g.strokeStyle = '#cdbf9f'; g.lineWidth = 64; path(); g.stroke(); g.strokeStyle = '#e4ddcb'; g.lineWidth = 46; path(); g.stroke();
        for (let i = 0; i < 900; i++) { const k = r() * (river.length - 1), j = Math.floor(k), f = k - j; const [ax, az] = river[j], [bx, bz] = river[j + 1]; g.fillStyle = r() < 0.5 ? '#c9c0ab' : '#f2ede2'; g.beginPath(); g.arc(uvx(S.lerp(ax, bx, f)) + (r() - 0.5) * 40, uvz(S.lerp(az, bz, f)) + (r() - 0.5) * 40, 1.5 + r() * 3, 0, 7); g.fill(); }
        // roads
        g.strokeStyle = '#f1e7cc'; g.lineWidth = 7; for (const [a, b] of [[[-26, 1], [0, 0]], [[0, 0], [13, -3]], [[13, -3], [24, -2]], [[0, 0], [1.7, 15]], [[0, 0], [-3, -26]]]) { g.beginPath(); g.moveTo(uvx(a[0]), uvz(a[1])); g.lineTo(uvx(b[0]), uvz(b[1])); g.stroke(); }
        // sea + beach (drawn per pixel row band along the coast)
        g.beginPath(); g.moveTo(uvx(coast[0][0]), uvz(coast[0][1])); coast.forEach(([x, z]) => g.lineTo(uvx(x), uvz(z))); g.lineTo(TX * 2, -TX); g.lineTo(TX * 2, TX * 2); g.lineTo(-TX, TX * 2); g.closePath();
        const sg = g.createLinearGradient(uvx(10), uvz(10), uvx(28), uvz(28)); sg.addColorStop(0, '#7fd3d8'); sg.addColorStop(1, '#2f86c8'); g.fillStyle = sg; g.fill();
        g.strokeStyle = '#f3e6c2'; g.lineWidth = 26; g.beginPath(); coast.forEach(([x, z], i) => i ? g.lineTo(uvx(x), uvz(z)) : g.moveTo(uvx(x), uvz(z))); g.stroke();
      });
      const W = new THREE.Group(); scene.add(W);
      const top = mk(new THREE.CircleGeometry(DR, 128).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: groundTex, roughness: 0.85, sheen: 0.2, envMapIntensity: 0.8 }), { cast: false }); top.position.set(DC[0], 0, DC[1]); W.add(top);
      const sideTex = S.canvasTex(1024, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9c08c'); gr.addColorStop(0.18, '#c9a874'); gr.addColorStop(0.55, '#b98f62'); gr.addColorStop(1, '#a37c55'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.15})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 2); } }, { repeat: [6, 1] });
      const side = mk(new THREE.CylinderGeometry(DR, DR * 0.97, 3.2, 128, 1, true), new THREE.MeshPhysicalMaterial({ map: sideTex, roughness: 0.9, envMapIntensity: 0.8 })); side.position.set(DC[0], -1.6, DC[1]); W.add(side);
      const bottom = mk(new THREE.CircleGeometry(DR * 0.97, 96).rotateX(Math.PI / 2), S.clay('#a37c55')); bottom.position.set(DC[0], -3.2, DC[1]); W.add(bottom);
      // sea: glossy water over the sea part of the disc
      { const N = 256, pts = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; pts.push([DC[0] + Math.cos(a) * (DR - 0.01), DC[1] + Math.sin(a) * (DR - 0.01)]); }
        let k0 = pts.findIndex((p, i) => !inSea(...p) && inSea(...pts[(i + 1) % N])); const arc = []; for (let j = 1; j <= N; j++) { const p = pts[(k0 + j) % N]; if (!inSea(...p)) break; arc.push(p); }
        const inner = coast.filter(([x, z]) => inDisc(x, z, 0.05)); const back = arc.at(-1)[0] < arc[0][0] ? inner.slice().sort((a, b) => a[0] - b[0]) : inner.slice().sort((a, b) => b[0] - a[0]);
        const sh = new THREE.Shape(); [...arc, ...back].forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)); sh.closePath();
        const wg = new THREE.ShapeGeometry(sh, 24).rotateX(-Math.PI / 2);
        const water = mk(wg, new THREE.MeshPhysicalMaterial({ color: '#3fa3d6', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4, depthWrite: false }), { cast: false }); water.position.y = 0.09; water.renderOrder = 2; W.add(water);
        // the water's cut face on the disc rim
        const a0 = Math.atan2(arc[0][1] - DC[1], arc[0][0] - DC[0]); let a1 = Math.atan2(arc.at(-1)[1] - DC[1], arc.at(-1)[0] - DC[0]); let da = a1 - a0; if (da < 0) da += TAU;
        const rim = mk(new THREE.CylinderGeometry(DR + 0.03, DR + 0.03, 0.9, 96, 1, true, Math.PI / 2 - a0 - da, da), new THREE.MeshPhysicalMaterial({ color: '#4cb3e0', roughness: 0.15, transparent: true, opacity: 0.85, clearcoat: 1, envMapIntensity: 1.2 }), { cast: false }); rim.position.set(DC[0], -0.36, DC[1]); W.add(rim); }
      // hills (north, north-east: Sierra Almagrera; west: rugged terrain behind bomb 2)
      const hillM = S.clay('#d9c393', { rough: 0.85 }), hillM2 = S.clay('#cdb684', { rough: 0.85 });
      for (const [x, z, rx, ry, rz] of [[-6, -18, 9, 2.6, 5.5], [6, -20, 8, 3.4, 5], [17, -15, 7, 4.2, 6], [24, -9, 5, 3.0, 4.5], [-19, -6, 6, 2.2, 7], [-20, 6, 4.5, 1.6, 5], [-12, -12, 5, 1.4, 4]]) {
        if (!inDisc(x, z, 2)) continue; for (let q = 0; q < 3; q++) { const f = [1, 0.62, 0.45][q]; const h = mk(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2), r() < 0.5 ? hillM : hillM2);
          h.scale.set(rx * f, ry * 0.62 * (q ? 1.25 * f : 1), rz * f); h.position.set(x + (q ? (r() - 0.5) * rx : 0), -0.02, z + (q ? (r() - 0.5) * rz * 0.8 : 0)); W.add(h); } }
      // fields: rows of tomatoes (green rows + red dots)
      const rows = [], dots = []; const plots = [];
      for (let k = 0; k < 400 && plots.length < (mode === 'fence' ? 30 : 30); k++) {
        const x = DC[0] + (r() - 0.5) * 44, z = DC[1] + (r() - 0.5) * 44, w = 1.4 + r() * 1.6, d = 1.0 + r() * 1.2;
        if (!inDisc(x, z, 3) || inSea(x, z + d) || dRiver(x, z) < 2.2 || Math.hypot(x, z) < 4.6 || Math.hypot(x - SITE.b2[0], z - SITE.b2[1]) < 2 || Math.hypot(x - SITE.b3[0], z - SITE.b3[1]) < 2.6 || Math.hypot(x - SITE.cem[0], z - SITE.cem[1]) < 2 || z < -11 || x < -21) continue;
        if (plots.some(p => Math.abs(p.x - x) < (p.w + w) / 2 + 0.3 && Math.abs(p.z - z) < (p.d + d) / 2 + 0.3)) continue;
        const ang = (r() - 0.5) * 0.3; plots.push({ x, z, w, d, ang });
        const nr = Math.max(3, Math.floor(d / 0.22)); for (let j = 0; j < nr; j++) { const zz = -d / 2 + (j + 0.5) * d / nr; const cx = x + Math.sin(ang) * zz, cz = z + Math.cos(ang) * zz;
          rows.push({ p: [cx, 0, cz], r: [0, ang, 0], sv: [w, 0.09, 0.11] });
          if (mode !== 'fence') for (let q = 0; q < Math.floor(w / 0.28); q++) { const u = -w / 2 + (q + 0.5) * w / Math.floor(w / 0.28); dots.push({ p: [cx + Math.cos(ang) * u + (r() - 0.5) * 0.05, 0.1, cz - Math.sin(ang) * u + 0.05], s: 0.042 }); } } }
      W.add(S.instances(S.roundBox(1, 1, 1, 0.3, 2), S.clay(mode === 'fence' ? '#7fb25a' : '#5f9a45', { rough: 0.7 }), rows, { cast: true }));
      if (dots.length) W.add(S.instances(new THREE.SphereGeometry(1, 8, 6), S.glossy('#e0241b', { rough: 0.3 }), dots, { cast: false }));
      // the village: white cube houses, church, plaza
      const houses = []; for (let k = 0; k < 900 && houses.length < 95; k++) { const a = r() * TAU, rr = Math.sqrt(r()) * 3.6, x = Math.cos(a) * rr * 1.15, z = Math.sin(a) * rr * 0.85;
        if (Math.hypot(x - 0.3, z + 0.4) < 1.0) continue; const w = 0.45 + r() * 0.35, d = 0.4 + r() * 0.35;
        if (houses.some(h => Math.abs(h.x - x) < (h.w + w) / 2 + 0.06 && Math.abs(h.z - z) < (h.d + d) / 2 + 0.06)) continue;
        houses.push({ x, z, w, d, h: 0.32 + r() * 0.3 * (r() < 0.25 ? 2 : 1) }); }
      for (const [x, z] of (mode === 'fence' ? [[4.6, -1.6], [2.3, -1.2]] : [[4.6, -0.9], [4.9, 0.6], [3.6, 1.2], [5.3, -0.1]])) houses.push({ x, z, w: 0.5, d: 0.45, h: 0.38 });
      W.add(S.instances(S.roundBox(1, 1, 1, 0.04, 2), S.clay('#fbfaf6', { rough: 0.5, coat: 0.3 }), houses.map(h => ({ p: [h.x, 0, h.z], r: [0, (r() - 0.5) * 0.2, 0], sv: [h.w, h.h, h.d] }))));
      const ch = new THREE.Group(); ch.position.set(0.3, 0, -0.4); W.add(ch); const wM = S.clay('#fbfaf6', { rough: 0.5, coat: 0.3 }), oM = S.clay('#d79a5b', { rough: 0.6 });
      ch.add(mk(S.roundBox(1.4, 0.75, 0.75, 0.04), wM)); const tw = mk(S.roundBox(0.38, 1.7, 0.38, 0.03), wM); tw.position.x = 0.75; ch.add(tw);
      const cap = mk(new THREE.ConeGeometry(0.3, 0.42, 4).rotateY(Math.PI / 4), oM); cap.position.set(0.75, 1.9, 0); ch.add(cap); const roof = mk(new THREE.CylinderGeometry(0.01, 0.42, 1.36, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), oM); roof.scale.set(1, 0.42, 1); roof.position.y = 0.78; ch.add(roof);
      // trees
      const trees = []; for (let k = 0; k < 140 && trees.length < 70; k++) { const x = DC[0] + (r() - 0.5) * 46, z = DC[1] + (r() - 0.5) * 46; if (!inDisc(x, z, 2) || inSea(x, z + 0.5) || dRiver(x, z) < 1 || Math.hypot(x, z) < 3.8 || Math.hypot(x - SITE.b3[0], z - SITE.b3[1]) < 4 || Math.hypot(x - SITE.b2[0], z - SITE.b2[1]) < 3.2 || plots.some(p => Math.abs(p.x - x) < p.w / 2 + 0.3 && Math.abs(p.z - z) < p.d / 2 + 0.3)) continue; trees.push({ p: [x, 0.22, z], s: 0.2 + r() * 0.14 }); }
      W.add(S.instances(new THREE.IcosahedronGeometry(1, 1), S.clay('#7d9a58', { rough: 0.8 }), trees));
      // cemetery: low white walls + cypresses
      const cem = new THREE.Group(); cem.position.set(SITE.cem[0], 0, SITE.cem[1]); cem.rotation.y = 0.2; W.add(cem);
      for (const [x, z, w, d] of [[0, -0.55, 1.6, 0.06], [0, 0.55, 1.6, 0.06], [-0.8, 0, 0.06, 1.1], [0.8, 0, 0.06, 1.1]]) { const m = mk(S.roundBox(w, 0.18, d, 0.02), wM); m.position.set(x, 0, z); cem.add(m); }
      for (const [x, z] of [[-0.4, -0.2], [0, 0.25], [0.4, -0.2], [-0.4, 0.25]]) { const c = mk(new THREE.ConeGeometry(0.09, 0.6, 10), S.clay('#3f6b45')); c.position.set(x, 0.3, z); cem.add(c); }
      // sites: bomb 1 (intact, riverbed), craters at 2 and 3
      const small = (k = 0.026) => { const b = b28(); b.scale.setScalar(k); return b; };
      const b1 = small(); b1.rotation.set(0, 0.7, Math.PI / 2 - 0.08); b1.position.set(SITE.b1[0] + 0.45, 0.07, SITE.b1[1] + 0.3); W.add(b1);
      const chute1 = mk(new THREE.CircleGeometry(0.42, 16).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#ece4cb', roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }), { cast: false }); chute1.scale.set(1.3, 1, 0.8); chute1.position.set(SITE.b1[0] - 0.55, 0.02, SITE.b1[1] - 0.2); W.add(chute1);
      const crater = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z);
        const rim = mk(new THREE.TorusGeometry(0.55, 0.16, 10, 40).rotateX(Math.PI / 2), S.clay('#c9ad79', { rough: 0.9 })); rim.scale.y = 0.6; g.add(rim);
        const pit = mk(new THREE.CircleGeometry(0.56, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7a5f40', roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 }), { cast: false }); pit.position.y = 0.025; g.add(pit);
        const ej = []; for (let i = 0; i < 18; i++) { const a = r() * TAU, d = 0.7 + r() * 1.3; ej.push({ p: [Math.cos(a) * d, 0.02, Math.sin(a) * d], s: 0.04 + r() * 0.06, c: r() < 0.5 ? '#c9ad79' : '#e9ecef' }); }
        g.add(S.instances(new THREE.IcosahedronGeometry(1, 0), S.clay('#ffffff'), ej, { cast: false })); g.scale.setScalar(s); W.add(g); return g; };
      const cr2 = crater(SITE.b2[0], SITE.b2[1], 1.15), cr3 = crater(SITE.b3[0], SITE.b3[1], 0.85);
      // markers: pole + numbered disc (billboarded)
      const markers = [['1', SITE.b1], ['2', SITE.b2], ['3', SITE.b3]].map(([n, [x, z]]) => { const g = new THREE.Group(); g.position.set(x, 0, z); W.add(g);
        const pole = mk(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8).translate(0, 1.1, 0), S.clay('#14233d')); g.add(pole);
        const lab = PR.labelPlane(n, { w: 0.85, h: 0.85, bg: '#14233d', color: '#ffffff', radius: 0.5 }); lab.material.alphaTest = 0.5; lab.position.y = 2.6; g.add(lab); g.userData.lab = lab; return g; });
      const showMarkers = P0.markers ?? (mode === 'impacts' || mode === 'dust');
      // contamination tint (soft orange-red ellipses on the ground)
      const tintTex = S.canvasTex(256, 256, (g) => { const rg = g.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.6, 'rgba(255,255,255,0.8)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); }, { srgb: false });
      const tintM = new THREE.MeshBasicMaterial({ color: '#ff4a26', alphaMap: tintTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, fog: false });
      const zones = [[SITE.b2, 3.4, 1.9, -0.6], [SITE.z2b, 1.6, 1.0, -0.4], [SITE.b3, 1.7, 1.1, -0.5], [SITE.z6, 2.4, 1.2, -0.7]].map(([[x, z], a, b, rot]) => { const m = mk(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), tintM, { cast: false, receive: false }); m.scale.set(a * 2, 1, b * 2); m.rotation.y = rot; m.position.set(x + 0.6, 0.04, z + 0.4); m.renderOrder = 3; W.add(m); return m; });
      // dust puffs (dust mode): from sites 2 and 3, drifting SE (wind from the NW, CSN model)
      const NP = 70, dustM = new THREE.MeshStandardMaterial({ color: '#e7a27c', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false, emissive: '#ff7a45', emissiveIntensity: 0.15 });
      const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), dustM, NP); dust.frustumCulled = false; dust.renderOrder = 4; W.add(dust);
      const dP = Array.from({ length: NP }, (_, i) => ({ src: i % 3 === 2 ? SITE.b3 : SITE.b2, d: r(), a: r() * TAU, sp: 0.6 + r() * 0.8, sz: 0.4 + r() * 0.7, ph: r() * 1.5 }));
      // impact puffs (impacts mode)
      const puffM = new THREE.MeshStandardMaterial({ color: '#efe2c4', roughness: 1, transparent: true, opacity: 0.8, depthWrite: false });
      const puffs = [0, 1, 2].map(() => { const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), puffM, 16); im.frustumCulled = false; W.add(im); return im; });
      const fallers = [0, 1, 2].map(() => { const b = small(0.026); b.visible = false; W.add(b); return b; });
      // cleanup: troops, bulldozers, rows of barrels, scraped soil
      const people = []; const extra = {};
      if (mode === 'cleanup') {
        const [cx, cz] = SITE.b2; const bx = cx - 0.4, bz = cz + 2.0;
        const drums = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 12; j++) drums.push({ p: [bx + j * 0.15, 0, bz + i * 0.17], sv: [0.06, 0.15, 0.06] });
        W.add(S.instances(new THREE.CylinderGeometry(1, 1, 1, 14).translate(0, 0.5, 0), S.glossy('#c3cad2', { rough: 0.25, coat: 0.9 }), drums));
        for (let i = 0; i < 7; i++) { const rib = mk(new THREE.BoxGeometry(12 * 0.15, 0.012, 0.004), S.clay('#8e98a4')); rib.position.set(bx + 0.825, 0.11, bz + i * 0.17 + 0.062); W.add(rib); }
        extra.barrels = [bx + 0.9, 0.5, bz + 0.5]; extra.barrels2 = [bx + 0.9, 0.5, bz + 1.3];
        const scrape = mk(new THREE.PlaneGeometry(2.6, 1.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#b48c5c', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), { cast: false }); scrape.position.set(cx - 0.2, 0.03, cz - 0.3); scrape.rotation.y = 0.3; W.add(scrape);
        const dozer = (x, z, ry) => { const g = new THREE.Group(); const yM = S.glossy('#9b9a64', { rough: 0.4 }), dM = S.clay('#4c5058');
          const tr = mk(S.roundBox(0.62, 0.12, 0.42, 0.05), dM); g.add(tr); const body = mk(S.roundBox(0.46, 0.2, 0.34, 0.04), yM); body.position.y = 0.12; g.add(body);
          const cab = mk(S.roundBox(0.2, 0.18, 0.26, 0.03), yM); cab.position.set(-0.08, 0.32, 0); g.add(cab); const bl = mk(S.roundBox(0.06, 0.18, 0.56, 0.02), yM); bl.position.set(0.4, 0, 0); g.add(bl);
          g.position.set(x, 0, z); g.rotation.y = ry; W.add(g); return g; };
        extra.dozers = [dozer(cx - 1.2, cz - 0.6, 0.3), dozer(cx + 0.9, cz - 1.0, -2.4)];
        const clips = ['idle', 'look_around', 'point', 'idle_b', 'talk', 'idle', 'look_around', 'idle_c', 'talk_b'];
        clips.forEach((c, i) => { const m = PR.mannequin('military', i === 2 ? PR.MQ.blue : '#9fb4a0', { unit: 0.12 }); m.root.position.set(cx - 0.9 + (i % 5) * 0.48 + r() * 0.15, 0, cz + 0.6 + Math.floor(i / 5) * 0.5 + r() * 0.1); m.root.rotation.y = r() * TAU; W.add(m.root); people.push({ m, c, ph: r() * 4 }); });
        // geiger-counter men sweep: two figures walking a line
      }
      if (mode === 'fence') {
        // today: chain-link fence with concrete posts around the zone-3 plot (galvanised posts, 2 m mesh; CSN)
        const [cx, cz] = SITE.b3; const hw = 1.25, hd = 0.95, fh = 0.32;
        const linkTex = S.canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(200,206,212,1)'; g.lineWidth = 5; for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k * 64 + 128, 0); g.lineTo(k * 64, 128); g.stroke(); } }, { srgb: true, repeat: [1, 1] });
        const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
        for (let i = 0; i < 4; i++) { const [ax, az] = corners[i], [bx2, bz2] = corners[(i + 1) % 4]; const L = Math.hypot(bx2 - ax, bz2 - az);
          const tx = linkTex.clone(); tx.repeat.set(L / 0.06, fh / 0.06); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.needsUpdate = true;
          const mesh = mk(new THREE.PlaneGeometry(L, fh), new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4, color: '#e6eaee' }), { cast: true, receive: false });
          mesh.position.set(cx + (ax + bx2) / 2, fh / 2 + 0.01, cz + (az + bz2) / 2); mesh.rotation.y = -Math.atan2(bz2 - az, bx2 - ax); W.add(mesh);
          const n = Math.ceil(L / 0.32); for (let k = 0; k <= n; k++) { const u = k / n; const pst = mk(S.roundBox(0.035, fh + 0.04, 0.035, 0.008), S.clay('#d4d2cc', { rough: 0.8 })); pst.position.set(cx + S.lerp(ax, bx2, u), 0, cz + S.lerp(az, bz2, u)); W.add(pst); }
          const wire = mk(new THREE.CylinderGeometry(0.005, 0.005, L, 4).rotateZ(Math.PI / 2), S.polishedSilver({ rough: 0.3 })); wire.position.set(cx + (ax + bx2) / 2, fh + 0.02, cz + (az + bz2) / 2); wire.rotation.y = -Math.atan2(bz2 - az, bx2 - ax); W.add(wire); }
        // radiation sign (yellow / black trefoil), front and back faces
        const signTex = S.canvasTex(256, 300, (g, w, h) => { g.fillStyle = '#f5c400'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
          g.fillStyle = '#111'; const cx2 = w / 2, cy = 112; for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3; g.beginPath(); g.moveTo(cx2, cy); g.arc(cx2, cy, 78, a - 0.52, a + 0.52); g.closePath(); g.fill(); }
          g.fillStyle = '#f5c400'; g.beginPath(); g.arc(cx2, cy, 24, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(cx2, cy, 15, 0, 7); g.fill();
          g.font = '700 34px "Archivo Narrow"'; g.textAlign = 'center'; g.fillText('ZONA RESTRINGIDA', cx2, 240); g.font = '600 24px "Archivo Narrow"'; g.fillText('PROHIBIDO EL PASO', cx2, 274); });
        const sign = mk(new THREE.PlaneGeometry(0.3, 0.35).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.15 }), { cast: true }); sign.position.set(cx + hw + 0.014, 0.2, cz + 0.1); W.add(sign);
        const back = mk(new THREE.PlaneGeometry(0.3, 0.35).rotateY(-Math.PI / 2), S.clay('#b9bec4')); back.position.copy(sign.position); back.position.x -= 0.006; W.add(back);
        // the fenced plot: bare, weedy ground inside, lettuces right outside
        const bare = mk(new THREE.PlaneGeometry(hw * 2 - 0.05, hd * 2 - 0.05).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#cdb98d', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), { cast: false }); bare.position.set(cx, 0.02, cz); W.add(bare);
        const weeds = []; for (let i = 0; i < 60; i++) weeds.push({ p: [cx + (r() - 0.5) * hw * 1.8, 0.02, cz + (r() - 0.5) * hd * 1.8], s: 0.02 + r() * 0.03, c: r() < 0.5 ? '#9aa86a' : '#b3b07a' }); W.add(S.instances(new THREE.IcosahedronGeometry(1, 0), S.clay('#ffffff'), weeds, { cast: false }));
        const lett = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 16; j++) lett.push({ p: [cx - 1.1 + j * 0.13, 0.03, cz + hd + 0.45 + i * 0.13], s: 0.034, c: j % 2 ? '#8cc25e' : '#7ab650' }); W.add(S.instances(new THREE.IcosahedronGeometry(1, 1), S.clay('#ffffff', { rough: 0.6 }), lett, { cast: false }));
        extra.fence = [cx, 0.6, cz];
      }
      G.st.key.shadow.camera.far = 400; G.st.key.shadow.camera.updateProjectionMatrix();
      G.finish({ ao: { radius: 0.5, intensity: 1.6, falloff: 0.8 }, dof: (mode === 'cleanup' || mode === 'fence') ? { focus: 10, range: 6, bokeh: 1.6 } : false });
      const at = [0, 1, 2].map(i => G.cue((P0.at ?? [])[i], mode === 'impacts' ? 1.2 + i * 2.0 : -10));
      const dustAt = G.cue(P0.dustAt, 0.8), settleAt = G.cue(P0.settleAt, dur * 0.55);
      const keys = {
        day: [{ pos: [32, 23, 42], look: [5, -1.5, 3], mm: 30 }, { pos: [15, 25, 48], look: [3, -1.5, 4], mm: 30 }],
        impacts: [{ pos: [8, 27, 46], look: [2, -1, 3], mm: 32 }, { pos: [-2, 26, 47], look: [1, -1, 3], mm: 32 }],
        dust: [{ pos: [-8, 30, 60], look: [1, -1, 5], mm: 32 }, { pos: [6, 33, 63], look: [3, -2, 6], mm: 32 }],
        cleanup: [{ pos: [-9.6, 2.2, 9.6], look: [-13.0, 0.15, 4.6], mm: 36 }, { pos: [-11.0, 2.0, 9.9], look: [-13.1, 0.15, 4.7], mm: 36 }],
        fence: [{ pos: [7.0, 1.05, 2.3], look: [4.0, 0.2, -0.3], mm: 34 }, { pos: [6.3, 0.95, 2.9], look: [3.9, 0.2, -0.2], mm: 34 }],
      }[mode];
      const targets = { village: [0, 2.4, 0], river: [15.6, 0.6, -5], sea: [20, 0.6, 14], bomb1: [SITE.b1[0], 3.3, SITE.b1[1]], bomb2: [SITE.b2[0], 3.3, SITE.b2[1]], bomb3: [SITE.b3[0], 3.3, SITE.b3[1]], cemetery: [SITE.cem[0], 0.8, SITE.cem[1]],
        wind: [-6, 6, -4], zone2: [SITE.b2[0] + 0.6, 0.5, SITE.b2[1] + 0.4], zone6: [SITE.z6[0], 0.5, SITE.z6[1]], beach: [SITE.beach[0], 0.4, SITE.beach[1]], barrels: extra.barrels, barrels2: extra.barrels2, fence: extra.fence };
      const sites = [SITE.b1, SITE.b2, SITE.b3];
      return { scene, camera, layer: G.layer, update(t) {
        G.cam(keys, t, { float: mode === 'fence' || mode === 'cleanup' ? 0.01 : 0.05 });
        markers.forEach((m, i) => { const vis = showMarkers && (mode !== 'impacts' || t > at[i]); m.visible = vis; if (vis) { const k = mode === 'impacts' ? S.spring(t - at[i] - 0.2, { zeta: 0.5, freq: 1.8 }) : 1; m.scale.setScalar(Math.max(0.001, k)); m.userData.lab.quaternion.copy(camera.quaternion); } });
        // impacts: a bomb falls to each site; 2 and 3 leave craters
        const craterK = (i) => mode === 'impacts' ? S.spring(t - at[i], { zeta: 0.55, freq: 2 }) : 1;
        b1.visible = mode !== 'impacts' || t > at[0]; chute1.visible = b1.visible;
        cr2.visible = mode !== 'day' && mode !== 'fence' && (mode !== 'impacts' || t > at[1]); cr2.scale.setScalar(1.15 * Math.max(0.001, craterK(1)));
        cr3.visible = mode !== 'day' && mode !== 'fence' && (mode !== 'impacts' || t > at[2]); cr3.scale.setScalar(0.85 * Math.max(0.001, craterK(2)));
        if (mode === 'day' || mode === 'fence') { cr2.visible = cr3.visible = false; b1.visible = chute1.visible = false; }
        fallers.forEach((f, i) => { const dt = t - at[i]; f.visible = mode === 'impacts' && dt > -0.9 && dt < 0; if (f.visible) { const u = (dt + 0.9) / 0.9; const [x, z] = sites[i]; f.position.set(x - (1 - u) * 1.5, 12 * (1 - u) * (1 - u) + 0.6 * (1 - u), z - (1 - u) * 2); f.rotation.set(i === 1 ? t * 9 : Math.PI, 0, i === 1 ? t * 5 : 0.2); } });
        puffs.forEach((im, i) => { const dt = t - at[i]; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + i; const on = mode === 'impacts' && dt > 0 && dt < 2.5; const rr = 0.3 + dt * (i === 0 ? 0.6 : 1.3); S.place(im, k, on ? [sites[i][0] + Math.cos(a) * rr, 0.2 + dt * (0.5 + (k % 3) * 0.3), sites[i][1] + Math.sin(a) * rr] : [0, -50, 0], [0, 0, 0], on ? (0.25 + dt * 0.35) * (i === 0 ? 0.5 : 1) : 0.0001); } im.instanceMatrix.needsUpdate = true; });
        puffM.opacity = 0.8 * clamp01(1 - Math.max(...at.map(a => clamp01((t - a) / 2.5)).filter((x, i) => t > at[i]).concat([0])) * 0.6);
        // dust cloud: rises, drifts SE, thins; then the tint settles
        const showDust = mode === 'dust';
        for (let i = 0; i < NP; i++) { const p = dP[i]; const dt = t - dustAt - p.ph; if (!showDust || dt < 0) { S.place(dust, i, [0, -50, 0], [0, 0, 0], 0.0001); continue; }
          const drift = dt * 1.35 * p.sp; const x = p.src[0] + Math.cos(p.a) * p.d * 0.8 + drift * 0.75, z = p.src[1] + Math.sin(p.a) * p.d * 0.8 + drift * 0.65, y = 0.3 + Math.min(2.6, dt * 1.2) * (0.5 + p.d) - Math.max(0, t - settleAt) * 0.5;
          S.place(dust, i, [x, Math.max(0.15, y), z], [0, 0, 0], p.sz * (0.5 + Math.min(2.5, dt * 0.6))); }
        dust.instanceMatrix.needsUpdate = true; dustM.opacity = 0.5 * (1 - S.range(t, settleAt, settleAt + 2.4));
        tintM.opacity = mode === 'dust' ? 0.5 * S.range(t, settleAt - 0.5, settleAt + 2.2) : mode === 'cleanup' ? 0.32 : mode === 'fence' ? 0.0 : 0;
        for (const p of people) p.m.play(p.c, p.ph + t).update();
        G.frame(t, targets);
      } };
    },

    // ================================================================ sea: the vertical cutaway (1 unit = 50 ft of depth; x compressed; vehicles exaggerated)
    // Depths from RESEARCH §5c/§6/§7: found 15 Mar at ~2,550 ft on a steep slope; line parted 24 Mar (anchor-to-grapnel line, below the anchor);
    // re-found 2 Apr 120 yd SSW at 2,800 ft on a gentler plain; dragged to ~2,850 ft; CURV fouled in the chute; lifted 7 Apr.
    async sea(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'search';
      const night = mode === 'snap' && P0.night !== false;
      const G = await stage(H, ctx, shot, { target: [-14, -16, -12], span: 60, az: 150, el: 62, sky: true, seed: P0.seed ?? 9, far: 2000, keyI: night ? 0.55 : 1.45, hemi: night ? 0.15 : 0.3,
        caption: { search: 'THE SEARCH · FEB–MAR 1966', found: '15 MAR 1966 · CONTACT #261', lift: '24 MAR 1966 · ONE LINE', snap: 'ABOUT 9 PM · 24 MAR 1966', refind: '2 APR 1966 · FOUND AGAIN', curv: '7 APR 1966 · CURV', raise: '7 APR 1966 · THE LIFT' }[mode],
        ownPills: true, source: { search: 'ILLUSTRATION · DEPTHS: DNA 1975', found: 'SOURCE: DNA 1975 · US NAVY 1967', lift: 'SOURCE: MORAN 2009 · RECONSTRUCTION', snap: 'SOURCE: DNA 1975; MORAN 2009 · RECONSTRUCTION', refind: 'SOURCE: DNA 1975', curv: 'SOURCE: MORAN 2009 · RECONSTRUCTION', raise: 'SOURCE: DNA 1975; MORAN 2009' }[mode] });
      const { scene, camera } = G; const dur = G.dur; const r = S.rng(3);
      const X0 = -70, X1 = 70, ZB = -26, Z0 = 0, YB = -32.5, ZM = -12;
      // seabed profile (y = -depth/100 ft; x compressed): shelf, ridge rim (~2,130 ft), steep canyon wall (find ~2,550 ft), gentler plain (2,800–2,850 ft)
      const ctrl = [[-82, 1.0], [-70, -1], [-55, -2.5], [-42, -6.5], [-32, -17], [-25, -21.3], [-22.5, -21.8], [-19.5, -24.0], [-17, -26.6], [-15, -27.8], [-11, -28.3], [-4, -28.6], [10, -29.2], [40, -30], [70, -30.6]];
      const spl = new THREE.SplineCurve(ctrl.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(700);
      const f = (x) => { for (let i = 1; i < spl.length; i++) if (spl[i].x >= x) { const a = spl[i - 1], b = spl[i]; return S.lerp(a.y, b.y, (x - a.x) / Math.max(1e-6, b.x - a.x)); } return spl.at(-1).y; };
      const T2 = (x) => { const d = (f(x + 0.3) - f(x - 0.3)) / 0.6; const L = Math.hypot(1, d); return new THREE.Vector3(1 / L, d / L, 0); };
      const N2 = (x) => { const t = T2(x); return new THREE.Vector3(-t.y, t.x, 0); };
      const surf = (x, z = ZM) => new THREE.Vector3(x, f(x), z);
      // seabed solid: profile extruded through the block depth
      { const sh = new THREE.Shape(); sh.moveTo(X0, YB); for (let x = X0; x <= X1 + 1e-6; x += 0.25) sh.lineTo(x, f(x)); sh.lineTo(X1, YB); sh.closePath();
        const g = new THREE.ExtrudeGeometry(sh, { depth: Z0 - ZB, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, ZB);
        { const gp = g.attributes.position, gn = g.attributes.normal; for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i); if (Math.abs(gn.getZ(i)) < 0.5 && x > X0 + 1e-3 && x < X1 - 1e-3 && Math.abs(y - f(x)) < 1e-3) { const n = N2(x); gn.setXYZ(i, n.x, n.y, 0); } } gn.needsUpdate = true; }
        const capTex = S.canvasTex(512, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0e2c2'); gr.addColorStop(1, '#dcc49a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${i % 2 ? '255,250,235' : '150,120,80'},0.13)`; const y = i * h / 26 + (r() - 0.5) * 8; c.fillRect(0, y, w, 3 + r() * 9); } }, { repeat: [1 / 140, 1 / 70] });
        capTex.repeat.set(1 / 140, 1 / 33); capTex.offset.set(0, 1); capTex.wrapS = capTex.wrapT = THREE.RepeatWrapping;
        const bed = mk(g, [new THREE.MeshPhysicalMaterial({ map: capTex, roughness: 0.9, envMapIntensity: 0.7 }), S.clay('#c8c2b0', { rough: 0.9, sheen: 0.1 })]); scene.add(bed); }
      // land wedge at the left end: the Spanish coast with a few white houses
      { const sh = new THREE.Shape(); sh.moveTo(-86, YB); sh.lineTo(-86, 4.2); sh.lineTo(-79, 3.6); sh.lineTo(-74, 1.4); sh.lineTo(-70.2, -1.8); sh.lineTo(-70, YB); sh.closePath();
        scene.add(mk(new THREE.ExtrudeGeometry(sh, { depth: Z0 - ZB, bevelEnabled: false }).translate(0, 0, ZB), [S.clay('#d8bf8f', { rough: 0.9 }), S.clay('#e6d3a4', { rough: 0.85 })]));
        for (let i = 0; i < 7; i++) { const h = mk(S.roundBox(1.4 + r(), 1.2 + r() * 0.8, 1.4, 0.1), S.clay('#fbfaf6', { rough: 0.5 })); h.position.set(-84.5 + (i % 4) * 2.0, 3.9, -6 - Math.floor(i / 4) * 6 - r() * 4); scene.add(h); } }
      // water: back wall gradient (cyan → ultramarine, never muddy), right end wall, translucent front face, glossy surface
      const wcol = night ? [new THREE.Color('#2366b4'), new THREE.Color('#0f2f78'), new THREE.Color('#071a4a')] : [new THREE.Color('#86e0f0'), new THREE.Color('#2f8fd8'), new THREE.Color('#1b47b4')];
      const gradAt = (y) => { const u = clamp01(-y / 31); return u < 0.5 ? wcol[0].clone().lerp(wcol[1], u * 2) : wcol[1].clone().lerp(wcol[2], (u - 0.5) * 2); };
      const gradGeo = (geo, axisY = true) => { const p = geo.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const col = gradAt(p.getY(i)); c.push(col.r, col.g, col.b); } geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return geo; };
      const back = new THREE.Mesh(gradGeo(new THREE.PlaneGeometry(X1 - X0, 36, 1, 32).translate((X0 + X1) / 2, -18, ZB + 0.02)), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); scene.add(back);
      const endW = new THREE.Mesh(gradGeo(new THREE.PlaneGeometry(Z0 - ZB, 31, 1, 32).rotateY(Math.PI / 2).translate(X1, -15.5, (Z0 + ZB) / 2)), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); scene.add(endW);
      { const sh = new THREE.Shape(); sh.moveTo(X0, 0); for (let x = X0; x <= X1 + 1e-6; x += 0.5) sh.lineTo(x, f(x)); sh.lineTo(X1, 0); sh.closePath();
        const fg = gradGeo(new THREE.ShapeGeometry(sh, 1)); const front = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: ['search', 'lift', 'raise'].includes(mode) ? 0.14 : 0.0, depthWrite: false, fog: false })); front.visible = ['search', 'lift', 'raise'].includes(mode); front.position.z = Z0 + 0.03; front.renderOrder = 6; scene.add(front); }
      const sg = new THREE.PlaneGeometry(X1 - X0, Z0 - ZB, 70, 12).rotateX(-Math.PI / 2).translate((X0 + X1) / 2, 0, (Z0 + ZB) / 2); const sBase = sg.attributes.position.array.slice();
      const seaTop = mk(sg, new THREE.MeshPhysicalMaterial({ color: night ? '#2a62b8' : '#3fa6dc', roughness: 0.12, transparent: true, opacity: 0.8, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4, depthWrite: false }), { cast: false }); seaTop.renderOrder = 7; scene.add(seaTop);
      const lip = mk(new THREE.PlaneGeometry(X1 - X0, 0.6).translate((X0 + X1) / 2, -0.3, Z0 + 0.05), new THREE.MeshBasicMaterial({ color: '#d8f4fb', transparent: true, opacity: 0.7, fog: false }), { cast: false }); scene.add(lip);
      // depth ruler (right end, front face)
      const ruler = []; if (P0.depths !== false) for (const ft of [0, 1000, 2000, 3000]) { const y = -ft / 100; const tk = mk(S.roundBox(2.2, 0.22, 0.22, 0.06), S.clay('#ffffff')); tk.position.set(X1 + 0.8, y - 0.11, Z0 + 0.2); scene.add(tk);
        const lb = PR.labelPlane(ft ? `${ft.toLocaleString('en-US')} FT` : 'SURFACE', { w: 6.4, h: 1.5, bg: '#ffffff', color: '#14233d', radius: 0.3 }); lb.material.alphaTest = 0.5; lb.material.emissive = new THREE.Color('#ffffff'); lb.material.emissiveMap = lb.material.map; lb.material.emissiveIntensity = 0.6; lb.position.set(X1 + 5.2, y, Z0 + 0.4); scene.add(lb); ruler.push(lb); }
      // sites
      const xF = -18.2, xR = -13.4, xC = -6;
      const BK = 5.4 / B28.L; // bomb exaggerated to 5.4 units long (~550 ft at this depth scale) so it reads in a full-column frame
      const placeBomb = (b, x, { roll = 0, lift = 0, z = ZM } = {}) => { const t = T2(x), n = N2(x); const base = surf(x, z).add(n.clone().multiplyScalar(B28.R * BK + 0.05 + lift)).sub(t.clone().multiplyScalar(B28.L * BK * 0.5));
        b.position.copy(base); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); b.rotateY(roll); return base; };
      const bomb = b28(); bomb.scale.setScalar(BK); scene.add(bomb);
      // draped chute over/behind the bomb (rebuilt when the site changes)
      const dGeo = new THREE.CircleGeometry(1, 48, 0, TAU); { const p = dGeo.attributes.position; const pos = []; for (let ring = 0; ring <= 10; ring++) for (let k = 0; k < 40; k++) { const rr = ring / 10, a = k / 40 * TAU; pos.push(Math.cos(a) * rr, Math.sin(a) * rr); }
        const g = new THREE.BufferGeometry(); const idx = []; const P = []; P.push(0, 0, 0); for (let ring = 1; ring <= 10; ring++) for (let k = 0; k < 40; k++) { const rr = ring / 10, a = k / 40 * TAU; P.push(Math.cos(a) * rr, 0, Math.sin(a) * rr); }
        for (let k = 0; k < 40; k++) idx.push(0, 1 + (k + 1) % 40, 1 + k); for (let ring = 1; ring < 10; ring++) for (let k = 0; k < 40; k++) { const a = 1 + (ring - 1) * 40 + k, b = 1 + (ring - 1) * 40 + (k + 1) % 40, c = 1 + ring * 40 + k, d = 1 + ring * 40 + (k + 1) % 40; idx.push(a, b, c, b, d, c); }
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(idx); var drapeGeo = g; }
      const drapeBase = drapeGeo.attributes.position.array.slice();
      const drape = mk(drapeGeo, new THREE.MeshPhysicalMaterial({ color: '#eadcae', roughness: 0.8, sheen: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.9 })); scene.add(drape);
      const setDrape = (x, { R = 3.4, off = 1.0, t = 0, puff = 0, z = ZM } = {}) => { // canopy centre `off` units downslope of the bomb centre, draped over it
        const T = T2(x), N = N2(x), Z = new THREE.Vector3(0, 0, 1); const p = drapeGeo.attributes.position; const c = surf(x, z);
        for (let i = 0; i < p.count; i++) { const u = drapeBase[i * 3] * R + off, v = drapeBase[i * 3 + 2] * R * 0.75; const ru = Math.hypot(drapeBase[i * 3], drapeBase[i * 3 + 2]);
          const along = u; const onBomb = Math.abs(along) < B28.L * BK * 0.55 ? Math.max(0, (B28.R * BK + 0.12) ** 2 - v * v) : 0;
          const h = 0.06 + Math.sqrt(onBomb) * 1.9 + 0.32 * Math.max(0, Math.sin(u * 2.3 + v * 1.1 + t * 0.4)) * ru + 0.22 * Math.max(0, Math.cos(v * 2.9 - u * 0.8)) * ru + puff * (1 - ru * ru) * 2.2 + (ru > 0.9 ? 0.0 : 0);
          const ground = f(c.x + T.x * u) - (c.y + T.y * u); // follow the slope curvature
          const w = c.clone().addScaledVector(T, u).addScaledVector(Z, v).addScaledVector(N, h); w.y += Math.max(0, ground - T.y * 0) * 0 + (ground > 0 ? ground : 0);
          p.setXYZ(i, w.x, w.y, w.z); }
        p.needsUpdate = true; drapeGeo.computeVertexNormals(); };
      // furrow (found mode): darker groove down the slope from the ridge rim
      const furrow = []; for (let x = -24; x < xF - 1.6; x += 0.3) furrow.push({ p: [x, f(x) + 0.02, ZM], r: [0, 0, Math.atan2(T2(x).y, T2(x).x)], sv: [0.36, 0.06, 0.6] });
      const furrowM = S.instances(S.roundBox(1, 1, 1, 0.3, 2), S.clay('#c9ad80', { rough: 1 }), furrow, { cast: false }); furrowM.visible = mode === 'found' || mode === 'search'; scene.add(furrowM);
      // ships
      const minesweeper = ship({ len: 11, beam: 2.1 }); minesweeper.position.set(-36, 0, -8); scene.add(minesweeper);
      const navy2 = ship({ len: 14, beam: 2.5 }); navy2.position.set(14, 0, -19); navy2.rotation.y = 0.15; scene.add(navy2);
      const navy3 = ship({ len: 12, beam: 2.2 }); navy3.position.set(-52, 0, -20); navy3.rotation.y = Math.PI; scene.add(navy3);
      const trawler = ship({ len: 6, beam: 1.7, kind: 'trawler' }); trawler.position.set(-62, 0, -4); trawler.rotation.y = 0.4; scene.add(trawler);
      const mizar = ship({ len: 15, beam: 2.7, kind: 'mizar', color: '#d3d9de' }); mizar.position.set(xF + 0.6, 0, ZM); mizar.visible = mode === 'lift' || mode === 'snap'; scene.add(mizar);
      const petrel = ship({ len: 15, beam: 2.8, kind: 'petrel' }); petrel.position.set(xC + 5, 0, ZM); petrel.visible = mode === 'curv' || mode === 'raise'; scene.add(petrel);
      if (mizar.visible || petrel.visible) { navy2.position.x = 22; }
      // night: deck work lights on Mizar
      if (night) for (const [x, y] of [[-3, 2.6], [2, 3.2], [-5.5, 1.6]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8), fog: false })); l.position.set(x, y, 1.2); mizar.add(l); }
      // Alvin (exaggerated: 22 ft → 5.5 units)
      const alv = alvin(); alv.scale.setScalar(7 / 22); scene.add(alv); alv.visible = ['search', 'found', 'refind'].includes(mode);
      const lampBeam = beam({ len: 10, rad: 3.0, opacity: night ? 0.4 : 0.28 }); scene.add(lampBeam); lampBeam.visible = alv.visible;
      const spot = new THREE.SpotLight('#f4f8ff', 0, 40, 0.42, 0.6, 0); scene.add(spot, spot.target);
      // rigging: POODL frame + strobe, anchor, main line, grapnel line, stubs
      const steel = S.clay('#8d97a2', { rough: 0.4 });
      const poodl = new THREE.Group(); { const rr = rods(9, steel); poodl.add(rr); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; rr.set(k, new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8), 0.05); } rr.set(8, new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 2.2, 0), 0.08); rr.done();
        const ring = mk(new THREE.TorusGeometry(0.8, 0.06, 6, 24).rotateX(Math.PI / 2), steel); poodl.add(ring); }
      const strobeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3.2), fog: false }); const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), strobeM); strobe.position.y = 1.9; poodl.add(strobe);
      const strobeL = new THREE.PointLight('#dfe9ff', 0, 40, 0); strobe.add(strobeL);
      scene.add(poodl); poodl.visible = mode === 'lift' || mode === 'snap';
      const anchor = new THREE.Group(); { const sh = mk(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8).translate(0, 0.8, 0), steel); anchor.add(sh); for (const s2 of [-1, 1]) { const fl = mk(S.roundBox(0.7, 0.12, 0.35, 0.05), steel); fl.position.set(s2 * 0.35, 0.1, 0); fl.rotation.z = s2 * 0.6; anchor.add(fl); } const rg = mk(new THREE.TorusGeometry(0.2, 0.05, 6, 16), steel); rg.position.y = 1.7; anchor.add(rg); }
      scene.add(anchor); anchor.visible = poodl.visible;
      const mainLine = rope(40, '#f3efe2', 0.14), grapLine = rope(30, '#f3efe2', 0.15), stub = rope(6, '#f3efe2', 0.15); scene.add(mainLine, grapLine, stub);
      const fray = rods(28, S.clay('#f3efe2', { rough: 0.8 })); scene.add(fray); const frayDirs = Array.from({ length: 28 }, () => new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize());
      // billowing canopy (lift/snap/curv/raise): inflated, tethered to the bomb by risers
      const can = canopy({ r: 5.2, h: 3.6, gores: 16 }); scene.add(can); const risers = rods(17, S.clay('#ddd5bd', { rough: 0.8 })); scene.add(risers);
      // sand plume (snap), sonar rings (search), CURV (curv/raise), cable for CURV
      const NS = 46, sandM = new THREE.MeshStandardMaterial({ color: '#e8d3a8', roughness: 1, transparent: true, opacity: 0.5, depthWrite: false });
      const sand = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), sandM, NS); sand.frustumCulled = false; sand.renderOrder = 4; scene.add(sand);
      const sandP = Array.from({ length: NS }, (_, i) => ({ u: i / NS, a: r() * TAU, sz: 0.5 + r() * 0.9, up: 0.4 + r() }));
      const ringM = new THREE.MeshBasicMaterial({ color: '#e9fbff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64, Math.PI), ringM.clone()); m.rotation.z = Math.PI; m.renderOrder = 6; scene.add(m); return m; });
      const cv = curv(); cv.scale.setScalar(7.5 / 13); scene.add(cv); cv.visible = mode === 'curv' || mode === 'raise';
      const umb = rope(30, '#2e333a', 0.07); scene.add(umb); const lines2 = rope(30, '#f3efe2', 0.08); scene.add(lines2);
      // red hand-drawn loop (thumbnail B) around the break
      const loopSvg = P0.loop ? (() => { const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); d.setAttribute('width', '100%'); d.setAttribute('height', '100%'); d.setAttribute('viewBox', `0 0 ${1080 * ctx.width / ctx.height} 1080`); d.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible'; G.layer.appendChild(d);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', RED); path.setAttribute('stroke-width', '11'); path.setAttribute('stroke-linecap', 'round'); d.appendChild(path); return path; })() : null;
      const shownPills = (P0.pills ?? {
        search: [{ text: 'SONAR', target: 'ping', at: 1.0 }, { text: 'ALVIN', target: 'alvin', at: 2.2 }],
        found: [{ text: '2,550 FT', target: 'bomb', at: 'end', red: true }],
        lift: [{ text: 'USNS MIZAR', target: 'ship', at: 0.6 }, { text: 'ONE LINE', target: 'line', at: 2.4 }, { text: '2,550 FT', target: 'bomb', at: 3.6 }],
        snap: [{ text: 'THE LINE PARTS BELOW THE ANCHOR', target: 'break', at: 'snap+0.5', until: 'snap+3.2', red: true }, { text: '120 YD DOWNSLOPE · 2,800 FT', target: 'bomb', at: 'snap+3.8' }],
        refind: [{ text: '15 MAR · 2,550 FT', target: 'ghost', at: 0.8 }, { text: '2 APR · 2,800 FT', target: 'bomb', at: 'find', red: true }],
        curv: [{ text: 'CURV · FOULED IN THE CHUTE', target: 'curv', at: 'foul', red: true }, { text: 'USS PETREL', target: 'ship', at: 0.8 }],
        raise: [{ text: 'USS PETREL', target: 'ship', at: 0.6 }, { text: '80 DAYS AFTER THE CRASH', target: 'bomb', at: 'end', red: true }],
      }[mode]);
      // cue table per mode
      const at = G.cue(P0.at, { search: 1.0, found: dur * 0.55, lift: 1.0, snap: dur * 0.36, refind: dur * 0.5, curv: dur * 0.45, raise: 0.6 }[mode]);
      const named = { end: dur * 0.72, snap: at, find: at, foul: at };
      const pills = shownPills.map((p, i) => { let c = p.at; if (typeof c === 'string') { const m = c.match(/^(end|snap|find|foul)([+-][\d.]+)?$/); if (m) c = named[m[1]] + Number(m[2] ?? 0); } let u = p.until; if (typeof u === 'string') { const m = u.match(/^(end|snap|find|foul)([+-][\d.]+)?$/); if (m) u = named[m[1]] + Number(m[2] ?? 0); }
        const el = H.pill(G.layer, p.text, { size: p.size ?? 26, dot: p.red ? RED : null }); el.at(0, 0, 0); return { ...p, el, t0: G.cue(c, 0.8 + i), t1: u == null ? Infinity : G.cue(u, Infinity) }; });
      // cameras
      const F = surf(xF), R2 = surf(xR), C2 = surf(xC);
      // full-column framing: surface + ships at the top, the gradient, the line, the slope in the bottom third
      const keys = P0.camera ?? {
        search: [{ pos: [-12, -14, 74], look: [-10, -15, -12], mm: 26 }, { pos: [-6, -15, 72], look: [-8, -15.5, -12], mm: 26 }],
        found: [{ pos: [-6, -14, 46], look: [-8, -14.5, -12], mm: 26 }, { pos: [-11, -20, 28], look: [-14, -21.5, -12], mm: 26 }],
        lift: [{ pos: [-4, -14, 48], look: [-7, -14.5, -12], mm: 26 }, { pos: [-7, -14.5, 46], look: [-8, -15, -12], mm: 26 }],
        refind: [{ pos: [-4, -15, 44], look: [-7, -16, -12], mm: 26 }, { pos: [-7, -22, 27], look: [-10, -23.5, -12], mm: 26 }],
        curv: [{ pos: [2, -18, 36], look: [-1, -19, -12], mm: 26 }, { pos: [1, -19.5, 32], look: [-1, -20.5, -12], mm: 27 }],
        raise: [{ pos: [3, -15, 50], look: [-1, -15, -12], mm: 26 }, { pos: [2, -13, 50], look: [-1, -13.5, -12], mm: 26 }],
      }[mode];
      // snap: two moves split at the break: a slow push down the line toward the rig, then a follow of the slide
      const snapA = [{ pos: [-4, -14, 48], look: [-7, -14.5, -12], mm: 26 }, { pos: [-11, -19.5, 28], look: [-14, -20.5, -12], mm: 26 }];
      const snapB = [{ pos: [-11, -19.5, 28], look: [-14, -20.5, -12], mm: 26 }, { pos: [-9, -22, 25], look: [-12, -23.5, -12], mm: 26 }, { pos: [-7, -23.5, 24], look: [-10, -25, -12], mm: 26 }];
      G.st.key.shadow.camera.far = 600; G.st.key.shadow.camera.updateProjectionMatrix();
      G.finish({ ao: { radius: 1.2, intensity: 1.6, falloff: 0.8 }, bloom: { intensity: night ? 0.9 : 0.4, threshold: 1.6, radius: 0.5 } });
      // a moonless night over the snap (RESEARCH G1: ~9% crescent, set or setting by 9:15 pm)
      if (night) scene.background = S.canvasTex(1024, 576, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060d24'); gr.addColorStop(0.7, '#13285a'); gr.addColorStop(1, '#22407a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        const rr = S.rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rr() * 0.6})`; g.beginPath(); g.arc(rr() * w, rr() * h * 0.75, 0.4 + rr() * 1.1, 0, 7); g.fill(); } });
      const tmp = new THREE.Vector3();
      return { scene, camera, layer: G.layer, update(t) {
        if (mode === 'snap' && !P0.camera) { if (t < at) S.rig(camera, snapA, t, { t0: 0, t1: at, float: 0.04 }); else S.rig(camera, snapB, t, { t0: at, t1: dur, float: 0.04 }); } else G.cam(keys, t, { float: 0.05 });
        // camera shake at the snap
        if (mode === 'snap') { const ds = t - at; if (ds > 0 && ds < 1.0) { const a = (1 - ds) * 0.45; camera.position.x += Math.sin(t * 61) * a; camera.position.y += Math.cos(t * 47) * a; camera.updateMatrixWorld(true); } }
        // sea surface waves
        { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const x = sBase[i * 3], z = sBase[i * 3 + 2]; p.setY(i, 0.12 * Math.sin(x * 0.35 + t * 1.3) + 0.08 * Math.sin(z * 0.6 - t * 1.1 + x * 0.1)); } p.needsUpdate = true; sg.computeVertexNormals(); }
        for (const sh of [minesweeper, navy2, navy3, trawler, mizar, petrel]) { sh.position.y = 0.06 * Math.sin(t * 1.2 + sh.position.x); sh.rotation.z = 0.02 * Math.sin(t * 0.9 + sh.position.x); }
        ruler.forEach(l => l.quaternion.copy(camera.quaternion));
        const tg = {}; let bx = xF, roll = 0.3, lift = 0, drapeOn = true, canOn = false, bombFree = null;
        // ---------------------------------------------------------------- per-mode staging
        if (mode === 'search' || mode === 'found' || mode === 'refind') {
          const tgtX = mode === 'refind' ? xR : xF; bx = tgtX;
          // Alvin path: down the slope toward the target, lamp sweeping, then landing on it at `at`
          const u = ease(S.range(t, 0, mode === 'search' ? dur : at));
          const ax = mode === 'search' ? S.lerp(-34, -21, u) : mode === 'found' ? S.lerp(xF - 9, tgtX - 5.5, u) : S.lerp(xF - 3, tgtX - 6, u);
          const ay = (mode === 'search' ? S.lerp(-8, -19, u) : f(ax) + S.lerp(6.5, 4.0, u)) + Math.sin(t * 0.9) * 0.15;
          alv.position.set(ax, ay, ZM + 2.5); alv.rotation.set(0, 0, mode === 'search' ? -0.15 : -0.32 + Math.sin(t * 0.6) * 0.03);
          alv.userData.prop.rotation.x = t * 6;
          const lampW = alv.localToWorld(alv.userData.lamps[0].clone()); const targetB = surf(tgtX).add(new THREE.Vector3(0, 0.3, 0));
          const sweep = mode === 'search' ? new THREE.Vector3(ax + 9 + Math.sin(t * 0.8) * 3, f(ax + 9) + 0.2, ZM) : targetB.clone().lerp(surf(ax + 8 + Math.sin(t * 1.1) * 2.5), 1 - ease(S.range(t, at - 1.4, at)));
          lampBeam.aim(lampW, sweep); spot.position.copy(lampW); spot.target.position.copy(sweep); spot.target.updateMatrixWorld();
          spot.intensity = mode === 'search' ? 1.2 : S.lerp(1.0, 2.2, S.range(t, at - 0.3, at + 0.4));
          tg.alvin = alv.position.clone().add(new THREE.Vector3(0, 3.4, 0));
          // sonar pings from the minesweeper
          rings.forEach((m, i) => { const per = 2.2, dt = ((t - i * per * 0.5 - (mode === 'search' ? 0.2 : 99)) % (per * 2)); const on = mode === 'search' && t > i * per * 0.5 && dt >= 0; m.visible = on; if (on) { const R = 1 + dt * 9; m.position.set(minesweeper.position.x, -1.0, minesweeper.position.z); m.scale.set(R, R, R); m.material.opacity = 0.75 * (1 - dt / (per * 2)); } });
          tg.ping = new THREE.Vector3(minesweeper.position.x + 5, -5, minesweeper.position.z);
        } else rings.forEach(m => (m.visible = false));
        if (mode === 'lift' || mode === 'snap') {
          // Mizar winches a 3½-in nylon line through its centre well; POODL 38 ft above the anchor; 300-ft line from the anchor to a grapnel in the risers
          const well = new THREE.Vector3(xF + 0.6, -0.8, ZM);
          const ds = t - at; const snapped = mode === 'snap' && ds > 0;
          const pre = mode === 'snap' ? ease(S.range(t, 0.2, at)) : ease(S.range(t, at + 2.2, dur)); // winch progress before the break
          const anchorBase = surf(xF - 5.5).add(new THREE.Vector3(0, 0.05, 0));
          let anc = anchorBase.clone(); anc.y += pre * 3.0; anc.x += pre * 0.8;
          if (snapped) { const k = 1 - Math.exp(-ds * 2.6); anc.y += k * 5; anc.x -= k * 0.8; }
          anchor.position.copy(anc); anchor.rotation.z = snapped ? Math.sin(ds * 5) * 0.4 * Math.exp(-ds) : pre * 0.4;
          poodl.position.copy(anc).add(new THREE.Vector3(0, 3.0, 0));
          // main line: from POODL up to Mizar's well (drawn upward in lift mode)
          const draw = mode === 'lift' ? ease(S.range(t, at, at + 2.0)) : 1;
          const mp = []; const top = poodl.position.clone().add(new THREE.Vector3(0, 2.2, 0)); const whip = snapped ? 2.6 * Math.exp(-ds * 1.4) : 0; for (let i = 0; i <= 39; i++) { const u2 = i / 39 * draw; mp.push(top.clone().lerp(well, u2).add(new THREE.Vector3(Math.sin(u2 * Math.PI) * (1 - pre) * 2.2 + whip * Math.sin(u2 * Math.PI * 3 - ds * 14) * Math.sin(u2 * Math.PI), 0, whip * 0.5 * Math.cos(u2 * Math.PI * 2 - ds * 11) * Math.sin(u2 * Math.PI)))); } mainLine.setPoints(mp, 0.14);
          poodl.visible = anchor.visible = draw > 0.98 || mode === 'snap';
          if (mode === 'lift') { poodl.visible = anchor.visible = true; }
          // the bomb: dragged slightly upslope as Mizar drifts, lifted off the bottom; after the break it drops and slides down to the re-find spot
          let bxNow = xF - pre * 0.9, bl = pre * (mode === 'snap' ? 1.4 : 0.5);
          if (snapped) { const fall = clamp01(ds / 0.45); bl = bl * (1 - fall * fall); const sl = S.inOutSine(S.range(ds, 0.3, 3.4)); bxNow = S.lerp(xF - 0.9, xR, sl); roll = 0.3 + sl * 9.5; lift = bl + Math.abs(Math.sin(sl * Math.PI * 3)) * 0.8 * (1 - sl); }
          else lift = bl;
          bx = bxNow;
          // grapnel line: anchor → chute risers (taut as the winch takes strain); after the break: a long stub trails the bomb, a short frayed stump hangs off the anchor
          const conf = surf(bx).add(N2(bx).multiplyScalar(lift + 0.9)).sub(T2(bx).multiplyScalar(B28.L * BK * 0.5 + 1.2));
          const brk = anc.clone().lerp(conf, 0.12);
          if (!snapped) { const sag = (1 - pre) * 1.6 + 0.1; grapLine.setPoints(sagCurve(anc.clone().add(new THREE.Vector3(0, 0.2, 0)), conf, -sag * 0, 24).map((p, i, arr) => { const u2 = i / (arr.length - 1); return p.add(new THREE.Vector3(0, -Math.sin(Math.PI * u2) * sag, 0)); }), 0.15); stub.setPoints([], 0.1); }
          else { const brkFall = brk.clone(); brkFall.y -= Math.min(4, ds * ds * 3); brkFall.x += ds * 0.6;
            const lower = []; for (let i = 0; i <= 20; i++) { const u2 = i / 20; lower.push(brkFall.clone().lerp(conf, u2).add(new THREE.Vector3(0, -Math.sin(Math.PI * u2) * Math.min(2.4, ds * 2), 0))); } grapLine.setPoints(lower, 0.15);
            const stp = anc.clone().add(new THREE.Vector3(0, 0.2, 0)); stub.setPoints([stp, stp.clone().add(new THREE.Vector3(0.15, -1.2, 0)).add(new THREE.Vector3(Math.sin(ds * 6) * 0.2 * Math.exp(-ds), 0, 0))], 0.1); }
          // frayed burst at the break
          for (let i = 0; i < 28; i++) { if (!snapped || ds > 1.6) { fray.hide(i); continue; } const k = 1 - Math.exp(-ds * 6); const d0 = frayDirs[i]; const a = brk.clone().add(d0.clone().multiplyScalar(0.15)); const b = brk.clone().add(d0.clone().multiplyScalar(0.4 + k * (1.3 + (i % 4) * 0.4))); b.y -= ds * ds * 0.6; fray.set(i, a, b, 0.035 * (1 - ds / 1.6) + 0.005); } fray.done();
          // strobe on POODL (the only light at the bottom that night)
          const blink = ((t * 1.2) % 1) < 0.08; strobeM.color.setScalar(blink ? 4 : 0.5); strobeL.intensity = mode === 'snap' ? (blink ? 14 : 1.2) : 0;
          // sand plume as it slides
          for (let i = 0; i < NS; i++) { const sp = sandP[i]; const tt = snapped ? ds - 0.35 - sp.u * 3.2 : -1; if (tt < 0) { S.place(sand, i, [0, -500, 0], [0, 0, 0], 0.0001); continue; }
            const x = S.lerp(xF - 0.8, xR, ease(clamp01(sp.u * 1.05))); const p0 = surf(x).add(new THREE.Vector3(Math.cos(sp.a) * 0.8, 0.3, Math.sin(sp.a) * 1.6));
            S.place(sand, i, [p0.x + tt * 0.6, p0.y + Math.min(4, tt * sp.up * 1.6), p0.z], [0, 0, 0], sp.sz * 0.6 * Math.min(2.4, 0.4 + tt * 0.9)); }
          sand.instanceMatrix.needsUpdate = true; sandM.opacity = snapped ? 0.42 * (1 - S.range(ds, 3.5, 7)) : 0;
          tg.ship = mizar.position.clone().add(new THREE.Vector3(0, 4.2, 0)); tg.line = top.clone().lerp(well, 0.55).add(new THREE.Vector3(0.4, 0, 0)); tg.break = brk.clone().add(new THREE.Vector3(0, 0.4, 0));
          canOn = true; drapeOn = false; bombFree = { conf, open: snapped ? 0.35 + 0.65 * (1 - S.range(ds, 0.2, 2.5)) : 0.35 + pre * 0.65 };
          if (loopSvg) { const [px, py, v] = G.toPx(brk); const [bxp, byp] = G.toPx(surf(bx)); const cx = (px + bxp) / 2, cy = (py + byp) / 2, rx = Math.max(140, Math.abs(px - bxp) * 0.7 + 90), ry = Math.max(110, Math.abs(py - byp) * 0.7 + 80);
            let d = ''; for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU * 1.08 - 0.4, w = 1 + 0.05 * Math.sin(a * 3 + 1); d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx * w).toFixed(1)},${(cy + Math.sin(a) * ry * w).toFixed(1)}`; } loopSvg.setAttribute('d', d); loopSvg.style.opacity = v && snapped ? String(S.range(ds, 0.3, 0.6)) : '0'; }
        } else { mainLine.setPoints([]); grapLine.setPoints([]); stub.setPoints([]); for (let i = 0; i < 28; i++) fray.hide(i); fray.done(); sandM.opacity = 0; }
        if (mode === 'curv' || mode === 'raise') {
          // the bomb on the deeper plain (~2,850 ft), chute billowing "like a giant jellyfish"; CURV flies in and fouls in the canopy; then the lift
          bx = xC; canOn = true; drapeOn = false;
          const rise = mode === 'raise' ? ease(S.range(t, at, dur * 0.92)) : 0;
          const yUp = rise * (-(f(xC)) - 10);
          const foul = mode === 'curv' ? ease(S.range(t, 0, at)) : 1;
          lift = 0.2 + yUp + (mode === 'raise' ? S.range(t, at, at + 1) * 1.2 : 0);
          const conf = surf(bx).add(N2(bx).multiplyScalar(lift + 0.9)).sub(T2(bx).multiplyScalar(B28.L * BK * 0.5 + 1.0));
          bombFree = { conf, open: 0.85 + 0.15 * Math.sin(t * 1.1), squash: mode === 'curv' ? 0.15 + 0.25 * S.range(t, at, at + 1.5) : 0.35 };
          // CURV
          const cvTarget = conf.clone().add(new THREE.Vector3(-2.0, 5.0, 0.8));
          cv.position.copy(new THREE.Vector3(xC - 12, f(xC) + 9, ZM + 1.5).lerp(cvTarget, foul)); cv.rotation.set(0, 0.25, -0.12 + Math.sin(t * 0.9) * 0.03 + (mode === 'curv' ? S.range(t, at, at + 1) * 0.35 : 0.35));
          const sh = petrel.position.clone().add(new THREE.Vector3(-4, -0.5, 0)); const cvTop = cv.position.clone().add(new THREE.Vector3(0, 1.8, 0));
          const um = []; for (let i = 0; i <= 28; i++) { const u2 = i / 28; um.push(cvTop.clone().lerp(sh, u2).add(new THREE.Vector3(Math.sin(Math.PI * u2) * 3 * (1 - rise), 0, 0))); } umb.setPoints(um, 0.07);
          const l2 = []; const ct = conf.clone().add(new THREE.Vector3(0, 3.2, 0)); const sh2 = petrel.position.clone().add(new THREE.Vector3(-5.5, -0.5, 0)); for (let i = 0; i <= 28; i++) { const u2 = i / 28; l2.push(ct.clone().lerp(sh2, u2).add(new THREE.Vector3(Math.sin(Math.PI * u2) * 1.6 * (1 - rise), 0, 0))); } lines2.setPoints(mode === 'raise' || t > at ? l2 : [], 0.08);
          tg.curv = cv.position.clone().add(new THREE.Vector3(0, 2.4, 0)); tg.ship = petrel.position.clone().add(new THREE.Vector3(0, 4.4, 0));
          spot.position.copy(cv.position).add(new THREE.Vector3(1.5, 0.8, 0)); spot.target.position.copy(conf); spot.target.updateMatrixWorld(); spot.intensity = 1.6;
          lampBeam.visible = true; lampBeam.aim(cv.position.clone().add(new THREE.Vector3(1.6, 0.9, 0.5)), conf.clone().add(new THREE.Vector3(1.2, -1.5, 0))); lampBeam.material.opacity = 0.22;
        } else { umb.setPoints([]); lines2.setPoints([]); }
        // ---------------------------------------------------------------- bomb + chute
        if (bombFree && (mode === 'curv' || mode === 'raise') && lift > 2) { // hanging below the rising bundle, nose down, tangled a third of the way up
          const conf = bombFree.conf; bomb.position.copy(conf).add(new THREE.Vector3(0.3, -0.8, 0)); bomb.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI + 0.25 + Math.sin(t * 0.8) * 0.06);
        } else placeBomb(bomb, bx, { roll, lift });
        drape.visible = drapeOn; if (drapeOn) setDrape(bx, { t, R: 3.7, off: -2.2 });
        can.visible = canOn; risers.visible = canOn;
        if (canOn && bombFree) { const o = bombFree.open; const T = T2(bx); const conf = bombFree.conf;
          const apexDir = (mode === 'lift' || mode === 'snap') ? new THREE.Vector3(1, 0.5, 0.35).normalize() : new THREE.Vector3(-0.35, 1, 0).normalize(); const cpos = conf.clone().addScaledVector(apexDir, 4.4 + o * 1.9);
          can.position.copy(cpos); can.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), apexDir); can.rotateY(t * 0.05);
          can.scale.set(0.45 + o * 0.55, 0.35 + o * 0.65, 0.45 + o * 0.55); can.userData.set({ breath: 0.5 + 0.5 * Math.sin(t * 1.4), squash: (1 - o) * 0.6 + (bombFree.squash ?? 0), t });
          can.updateMatrixWorld(true); const tail = bomb.localToWorld(new THREE.Vector3(0, 0, 0));
          can.userData.skirt.forEach((sk, k) => risers.set(k, can.localToWorld(sk.clone()), conf, 0.045)); risers.set(16, conf, tail, 0.07); risers.done();
          tg.chute = cpos; }
        // ghost of the first position (refind)
        tg.bomb = bomb.position.clone().add(new THREE.Vector3(0, 2.4, 0)); tg.ghost = surf(xF).add(new THREE.Vector3(0, 2.2, 0));
        if (mode === 'found' || mode === 'refind') tg.bomb = surf(bx).add(new THREE.Vector3(0.6, 2.6, 0));
        G.frame(t, tg);
        for (const p of pills) { let q = typeof p.target === 'string' ? tg[p.target] : p.target; if (!q) { p.el.at(0, 0, 0); continue; } const [x, y, v] = G.toPx(q); p.el.at(x, y, v ? S.range(t, p.t0, p.t0 + 0.35) * (1 - S.range(t, p.t1, p.t1 + 0.3)) : 0); }
      } };
    },

    // ================================================================ grid: Bayesian search grid over a stylised sea map (1 unit ≈ 0.6 km). x east, z south.
    async grid(ctx, shot) {
      const P0 = shot.params ?? {};
      const G = await stage(H, ctx, shot, { target: [0, 0, 0], span: 24, az: 140, el: 58, sky: true, seed: P0.seed ?? 12, far: 800, keyI: 2.0, ownPills: true,
        caption: 'PROBABILITY MAP · FEB–MAR 1966', source: 'AFTER CRAVEN; RICHARDSON (WAGNER ASSOCIATES) · VALUES ILLUSTRATIVE' });
      const { scene, camera } = G; const dur = G.dur; const r = S.rng(P0.seed ?? 21);
      const BW = 34, BD = 22;
      const coast = [[-18, 0.5], [-12, -2.2], [-7.5, -4.6], [-3, -7.6], [1, -10.4], [4, -12.5]];
      const coastZ = (x) => { for (let i = 1; i < coast.length; i++) if (x <= coast[i][0]) { const [x0, z0] = coast[i - 1], [x1, z1] = coast[i]; return S.lerp(z0, z1, (x - x0) / (x1 - x0)); } return coast.at(-1)[1]; };
      const beach = [-7.5, -4.6], simo = [1.5, 5.0], found = [2.6, 6.0], village = [-9.6, -7.0];
      const TX = 2048, ux = (x) => (x / BW + 0.5) * TX, uz = (z) => (z / BD + 0.5) * TX * BD / BW;
      const tex = S.canvasTex(TX, Math.round(TX * BD / BW), (g, w, h) => {
        const sg = g.createLinearGradient(0, 0, w, h); sg.addColorStop(0, '#bfe8f3'); sg.addColorStop(1, '#7fc3e6'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(40,110,170,0.25)'; g.lineWidth = 3; for (let k = 1; k < 9; k++) { g.beginPath(); coast.forEach(([x, z], i) => { const X = ux(x + k * 1.6), Z = uz(z + k * 1.9 + Math.sin(k + x * 0.3) * 0.4); i ? g.lineTo(X, Z) : g.moveTo(X, Z); }); g.stroke(); }
        g.beginPath(); g.moveTo(ux(coast[0][0]), uz(coast[0][1])); coast.forEach(([x, z]) => g.lineTo(ux(x), uz(z))); g.lineTo(ux(30), uz(-30)); g.lineTo(ux(-30), uz(-30)); g.closePath(); g.fillStyle = '#ead7aa'; g.fill();
        g.strokeStyle = '#f6ecd0'; g.lineWidth = 14; g.beginPath(); coast.forEach(([x, z], i) => i ? g.lineTo(ux(x), uz(z)) : g.moveTo(ux(x), uz(z))); g.stroke();
        g.strokeStyle = '#d9cdb2'; g.lineWidth = 9; g.beginPath(); g.moveTo(ux(-4.5), uz(-11)); g.quadraticCurveTo(ux(-4), uz(-8), ux(-4.3), uz(-6.4)); g.stroke();
        g.fillStyle = 'rgba(20,35,61,0.55)'; g.font = '600 30px "Plex Mono"'; g.fillText('MEDITERRANEAN', ux(7), uz(9.6));
      });
      const board = mk(S.roundBox(BW, 1.2, BD, 0.4, 3), [S.clay('#f4f2ee', { rough: 0.6 })]); board.position.y = -1.2; scene.add(board);
      const top = mk(new THREE.PlaneGeometry(BW - 0.6, BD - 0.6).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.7, envMapIntensity: 0.8 }), { cast: false }); top.position.y = 0.01; scene.add(top);
      // land relief: low hills + white village cubes
      for (const [x, z, rx, ry, rz] of [[-13, -8.5, 4, 0.6, 2.4], [-5, -10, 3.5, 0.7, 1.4], [-15.5, -4, 2, 0.35, 2]]) { const hh = mk(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), S.clay('#dcc796')); hh.scale.set(rx, ry, rz); hh.position.set(x, 0, z); scene.add(hh); }
      const vh = []; for (let i = 0; i < 26; i++) vh.push({ p: [village[0] + (r() - 0.5) * 2.2, 0, village[1] + (r() - 0.5) * 1.4], sv: [0.3 + r() * 0.2, 0.25 + r() * 0.2, 0.3 + r() * 0.2] }); scene.add(S.instances(S.roundBox(1, 1, 1, 0.05, 2), S.clay('#ffffff', { rough: 0.5 }), vh));
      // cells: probability (rows north → south). Default: two hypotheses (the fisherman's point, the inshore debris field) + noise
      const CS = 1.5, nx = 15, nz = 9, x0 = -9.8, z0 = -5.6; const cells = [];
      const gauss = (dx, dz, s2) => Math.exp(-(dx * dx + dz * dz) / (2 * s2 * s2));
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * CS, z = z0 + j * CS; if (z - CS * 0.5 < coastZ(x) + 0.3 || Math.abs(x) > BW / 2 - 1 || Math.abs(z) > BD / 2 - 1) continue;
        const pv = P0.cells?.[j]?.[i] ?? (0.95 * gauss(x - simo[0], z - simo[1], 2.4) + 0.42 * gauss(x - (beach[0] + 2.2), z - (beach[1] + 2.4), 2.2) + 0.08 * r());
        cells.push({ i, j, x, z, p: pv }); }
      const pmax = Math.max(...cells.map(c => c.p)); cells.forEach(c => (c.p = P0.cells ? clamp01(c.p) : c.p / pmax));
      const ramp = [[0, '#f8f3e6'], [0.3, '#f9dc8e'], [0.6, '#f39a4a'], [0.85, '#e5462a'], [1, '#c8160f']].map(([k, c]) => [k, new THREE.Color(c)]);
      const heat = (p) => { for (let k = 1; k < ramp.length; k++) if (p <= ramp[k][0]) return ramp[k - 1][1].clone().lerp(ramp[k][1], (p - ramp[k - 1][0]) / (ramp[k][0] - ramp[k - 1][0])); return ramp.at(-1)[1].clone(); };
      const cellM = S.glossy('#ffffff', { rough: 0.35, coat: 0.6 }); const cim = new THREE.InstancedMesh(S.roundBox(1, 1, 1, 0.08, 2), cellM, cells.length); cim.castShadow = cim.receiveShadow = true; scene.add(cim);
      cells.forEach((c, k) => cim.setColorAt(k, heat(c.p))); cim.instanceColor.needsUpdate = true;
      const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.55, 0.25), transparent: true, opacity: 0.9, fog: false }); const hot = cells.filter(c => c.p > 0.7); const gim = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowM, Math.max(1, hot.length)); gim.frustumCulled = false; scene.add(gim);
      // reveal order: row by row, west → east (the night's arithmetic, square by square)
      const order = cells.map((c, k) => k).sort((a, b) => cells[a].j - cells[b].j || cells[a].i - cells[b].i); const rank = new Map(order.map((k, n) => [k, n]));
      const at = G.cue(P0.at, 0.8), rDur = P0.revealDur ?? Math.max(1.5, dur * 0.5), reveal = P0.reveal ?? 'cell';
      const tOf = (k) => reveal === 'all' ? at : at + rank.get(k) / cells.length * rDur;
      // highlight frames (red)
      const hl = (P0.highlight ?? []).map(([i, j]) => { const c = cells.find(q => q.i === i && q.j === j); if (!c) return null; const g = new THREE.Group(); const m = S.glossy(RED, { rough: 0.3 }); for (const [dx, dz, w, d] of [[0, -CS / 2, CS, 0.12], [0, CS / 2, CS, 0.12], [-CS / 2, 0, 0.12, CS], [CS / 2, 0, 0.12, CS]]) { const b = mk(S.roundBox(w, 0.12, d, 0.04), m, { cast: false }); b.position.set(dx, 0, dz); g.add(b); } g.position.set(c.x, 0, c.z); scene.add(g); return { g, c }; }).filter(Boolean);
      // the fisherman's pin (navy) and the X (red)
      const pin = new THREE.Group(); { const m = S.glossy('#14233d', { rough: 0.3 }); const head = mk(new THREE.SphereGeometry(0.55, 24, 16), m); head.position.y = 2.6; pin.add(head); const cone = mk(new THREE.ConeGeometry(0.42, 2.2, 20).rotateX(Math.PI).translate(0, 1.2, 0), m); pin.add(cone); const dot = mk(new THREE.SphereGeometry(0.2, 16, 10), S.clay('#ffffff')); dot.position.set(0, 2.6, 0.45); pin.add(dot); }
      pin.position.set(simo[0], 0, simo[1]); pin.visible = P0.pin !== false; scene.add(pin);
      const X = new THREE.Group(); { const m = new THREE.MeshPhysicalMaterial({ color: RED, roughness: 0.3, clearcoat: 1, emissive: RED, emissiveIntensity: 0.3 }); for (const a of [0.785, -0.785]) { const b = mk(S.roundBox(2.6, 0.35, 0.5, 0.15), m); b.geometry = b.geometry.clone().translate(0, 0, 0); b.rotation.y = a; X.add(b); } }
      X.position.set(found[0], 0, found[1]); scene.add(X); const xOn = P0.x !== false, xAt = G.cue(P0.xAt, dur * 0.78);
      G.finish({ ao: { radius: 0.6, intensity: 1.6, falloff: 0.8 }, bloom: { intensity: 0.6, threshold: 1.2, radius: 0.6 }, dof: { focus: 40, range: 30, bokeh: 1.2 } });
      const pills = (P0.pills ?? [{ text: 'PALOMARES', target: 'village', at: 0.4 }, { text: "SIMÓ ORTS'S SIGHTING", target: 'pin', at: at + rDur * 0.6 }, { text: 'FOUND · 15 MAR 1966', target: 'x', at: xAt + 0.4, red: true }])
        .map((p, i) => { const el = H.pill(G.layer, p.text, { size: 26, dot: p.red ? RED : null }); el.at(0, 0, 0); return { ...p, el, t0: G.cue(p.at, 0.5 + i) }; });
      const keys = P0.camera ?? [{ pos: [-6, 28, 25], look: [-0.5, 0, 1], mm: 38 }, { pos: [3, 27, 27], look: [0.5, 0, 1], mm: 38 }];
      return { scene, camera, layer: G.layer, update(t) {
        G.cam(keys, t, { float: 0.03 });
        let g = 0; cells.forEach((c, k) => { const s2 = S.spring(t - tOf(k), { zeta: 0.55, freq: 2.2 }); const h = 0.12 + Math.max(0, s2) * (0.2 + c.p * 3.6);
          S.place(cim, k, [c.x, 0, c.z], [0, 0, 0], [CS * 0.88, s2 > 0 ? h : 0.0001, CS * 0.88]);
          if (c.p > 0.7) { S.place(gim, g, [c.x, s2 > 0 ? h + 0.02 : -5, c.z], [0, 0, 0], s2 > 0 ? CS * 0.7 : 0.0001); g++; } });
        cim.instanceMatrix.needsUpdate = true; gim.instanceMatrix.needsUpdate = true; glowM.opacity = 0.55 + 0.35 * Math.sin(t * 2.4) ** 2;
        for (const h of hl) { const k = cells.indexOf(h.c); const s2 = S.spring(t - tOf(k), { zeta: 0.55, freq: 2.2 }); h.g.position.y = 0.12 + Math.max(0, s2) * (0.2 + h.c.p * 3.6) + 0.02; h.g.visible = s2 > 0; }
        const ks = S.spring(t - xAt, { zeta: 0.45, freq: 1.8 }); X.visible = xOn && t > xAt; X.scale.setScalar(Math.max(0.001, ks)); const cf = cells.reduce((a, c) => Math.hypot(c.x - found[0], c.z - found[1]) < Math.hypot(a.x - found[0], a.z - found[1]) ? c : a, cells[0]);
        X.position.y = 0.12 + (0.2 + cf.p * 3.6) + 0.3;
        pin.position.y = 0.12 + 0.2 + 3.8 + 0.2 * Math.sin(t * 1.5);
        const tg = { village: [village[0], 1.4, village[1]], pin: [simo[0], 7.4, simo[1]], x: [found[0], X.position.y + 1.0, found[1]] };
        for (const p of pills) { const q = typeof p.target === 'string' ? tg[p.target] : p.target; const [x, y, v] = G.toPx(q ?? [0, 0, 0]); p.el.at(x, y, v ? S.range(t, p.t0, p.t0 + 0.35) : 0); }
        G.frame(t, tg);
      } };
    },

    // ================================================================ alvin: hero product shot of DSV Alvin (1966: white hull, white sail), in blue water (units: feet)
    async alvin(ctx, shot) {
      const P0 = shot.params ?? {};
      const G = await stage(H, ctx, shot, { target: [0, 0, 0], span: 18, az: 110, el: 70, keyI: 2.4, hemi: 0.5, ownPills: false,
        caption: P0.caption === undefined ? 'ALVIN · 22 FT · RATED TO 6,000 FT' : P0.caption, source: P0.source === undefined ? 'SOURCE: MORAN 2009; WHOI' : P0.source });
      const { scene, camera } = G; const dur = G.dur; G.st.cyc.visible = false;
      scene.background = S.canvasTex(1024, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fd6ee'); gr.addColorStop(0.45, '#2b8fd6'); gr.addColorStop(1, '#173fa8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const x = 120 + i * 100 + Math.sin(i * 3) * 40; const rg = g.createLinearGradient(x, 0, x + 120, h * 0.8); rg.addColorStop(0, 'rgba(255,255,255,0.13)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 30 + i % 3 * 12, 0); g.lineTo(x + 220, h * 0.85); g.lineTo(x + 140, h * 0.85); g.closePath(); g.fill(); } });
      const a = alvin({ pilots: !!P0.pilots }); scene.add(a);
      const beams = P0.lights === false ? [] : a.userData.lamps.slice(0, 2).map(() => { const b = beam({ len: 40, rad: 7, opacity: 0.1 }); scene.add(b); return b; });
      const spot = new THREE.SpotLight('#fff3d6', P0.lights === false ? 0 : 1.5, 80, 0.5, 0.7, 0); scene.add(spot, spot.target);
      const rim = new THREE.DirectionalLight('#bfe8ff', 1.4); rim.position.set(-30, 10, -30); scene.add(rim);
      const NP = 420, r = S.rng(4); const snow = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: '#eaf8ff', transparent: true, opacity: 0.75, fog: false }), NP); snow.frustumCulled = false; scene.add(snow);
      const sp = Array.from({ length: NP }, () => [(r() - 0.5) * 90, (r() - 0.5) * 50, (r() - 0.5) * 70 - 5, 0.04 + r() * 0.1, r()]);
      G.finish({ ao: { radius: 1.0, intensity: 1.4, falloff: 0.8 }, dof: { focus: 40, range: 14, bokeh: 2.2 }, bloom: { intensity: 0.6, threshold: 1.2, radius: 0.6 } });
      const keys = P0.camera ?? [{ pos: [33, 5, 19], look: [1.5, 0.5, 0], mm: 40 }, { pos: [27, 3, 28], look: [1, 0.5, 0], mm: 40 }];
      return { scene, camera, layer: G.layer, update(t) {
        const c = G.cam(keys, t, { float: 0.08 });
        a.rotation.set(0.02 * Math.sin(t * 0.6), (P0.spin ?? 0.04) * t - 0.12, -0.04 + 0.025 * Math.sin(t * 0.8)); a.position.y = 0.3 * Math.sin(t * 0.7); a.userData.prop.rotation.x = t * 5; a.updateMatrixWorld(true);
        const fwd = a.localToWorld(new THREE.Vector3(30, -9, 0));
        beams.forEach((b, i) => b.aim(a.localToWorld(a.userData.lamps[i].clone()), a.localToWorld(new THREE.Vector3(38, -10, i ? 4 : -4))));
        spot.position.copy(a.localToWorld(a.userData.lamps[0].clone())); spot.target.position.copy(fwd); spot.target.updateMatrixWorld();
        for (let i = 0; i < NP; i++) { const [x, y, z, s2, ph] = sp[i]; const yy = ((y - t * (0.6 + ph * 0.6) + 25) % 50 + 50) % 50 - 25; S.place(snow, i, [x + Math.sin(t * 0.3 + ph * 6) * 0.6, yy, z], [0, 0, 0], s2); } snow.instanceMatrix.needsUpdate = true;
        G.frame(t, { alvin: a.position.clone().add(new THREE.Vector3(2, 8, 0)) });
      } };
    },

    // ================================================================ trawler: Simó Orts's shrimp boat, Manuela Orts, on a sea diorama (1 unit = 1 m)
    async trawler(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'sighting';
      if (P0.figure !== false) await PR.loadMannequins(['casual_a']);
      const G = await stage(H, ctx, shot, { target: [0, 0, 0], span: 60, az: 135, el: 45, sky: true, seed: P0.seed ?? 14, far: 2000, keyI: 2.4,
        caption: { sighting: '17 JAN 1966 · ~5 MILES OFFSHORE', pointing: 'ALL HE COULD POINT TO WAS WATER' }[mode], source: 'SOURCE: MORAN 2009 · ILLUSTRATION',
        pills: P0.pills ?? (mode === 'sighting' ? [{ text: 'MANUELA ORTS', target: 'boat', at: 0.6 }, { text: 'A CHUTE GOES INTO THE SEA', target: 'chute', at: 2.0, red: true }] : [{ text: 'FRANCISCO SIMÓ ORTS', target: 'simo', at: 0.8 }]) });
      const { scene, camera } = G; const dur = G.dur; const r = S.rng(8);
      const DR = 62;
      const wg = new THREE.RingGeometry(0.01, DR, 120, 40).rotateX(-Math.PI / 2); const wBase = wg.attributes.position.array.slice();
      const water = mk(wg, new THREE.MeshPhysicalMaterial({ color: '#2f9ad6', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.3, transparent: true, opacity: 0.92 }), { cast: false }); scene.add(water);
      const sideM = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }); const sideG = new THREE.CylinderGeometry(DR, DR, 14, 120, 8, true).translate(0, -7, 0); { const p = sideG.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const u = clamp01(-p.getY(i) / 14); const col = new THREE.Color('#5fc6ea').lerp(new THREE.Color('#1e56b8'), u); c.push(col.r, col.g, col.b); } sideG.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
      scene.add(new THREE.Mesh(sideG, sideM)); const bot = mk(new THREE.CircleGeometry(DR, 96).rotateX(Math.PI / 2), S.clay('#e4d3ac')); bot.position.y = -14; scene.add(bot);
      const foam = mk(new THREE.TorusGeometry(DR, 0.35, 8, 160).rotateX(Math.PI / 2), S.clay('#eef9fd')); scene.add(foam);
      // the coast on the back rim: hills, a mountain and an abandoned chimney (Simó lined them up to fix the spot)
      const land = new THREE.Group(); scene.add(land); const hM = S.clay('#dcc694', { rough: 0.85 });
      for (const [a, rx, ry] of [[-2.2, 10, 2.6], [-1.9, 9, 4.5], [-1.62, 7, 7], [-1.35, 11, 3], [-1.05, 8, 2.2]]) { const h = mk(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), hM); h.scale.set(rx, ry, 3); h.position.set(Math.cos(a) * (DR - 3), -0.3, Math.sin(a) * (DR - 3)); h.rotation.y = -a - Math.PI / 2; land.add(h); }
      const chim = mk(new THREE.CylinderGeometry(0.35, 0.5, 5.5, 12).translate(0, 2.75, 0), S.clay('#c98a5c')); chim.position.set(Math.cos(-1.5) * (DR - 4), 0, Math.sin(-1.5) * (DR - 4)); land.add(chim);
      for (let i = 0; i < 8; i++) { const a = -1.35 + i * 0.05; const hs = mk(S.roundBox(1.2, 1.0, 1.2, 0.08), S.clay('#fbfaf6')); hs.position.set(Math.cos(a) * (DR - 2.5), 0.1, Math.sin(a) * (DR - 2.5)); land.add(hs); }
      // the boat (shrimp trawler, ~14 m), nets out astern
      const boat = trawlerBoat(); boat.position.set(-10, 0, 14); boat.rotation.y = -0.25; scene.add(boat);
      const name = PR.labelPlane('MANUELA ORTS', { w: 3.6, h: 0.55, bg: null, color: '#14233d' }); name.position.set(3.2, 1.25, 2.02); name.rotation.y = 0.12; boat.add(name);
      const nets = rods(4, S.clay('#9a8f78', { rough: 0.9 })); scene.add(nets);
      let simoM = null; if (P0.figure !== false) { simoM = PR.mannequin('casual_a', PR.MQ.blue, { unit: 1 }); simoM.root.position.set(3.0, 1.2, -0.6); boat.add(simoM.root); boat.updateMatrixWorld(true); { const lt = boat.worldToLocal(new THREE.Vector3(30, 0, -26)); simoM.root.rotation.y = Math.atan2(lt.x - 3.0, lt.z + 0.6); } }
      // the chute with a dark object under it (seen from the boat), descending into the sea
      const sight = new THREE.Group(); sight.position.set(30, 0, -26); scene.add(sight); sight.visible = mode === 'sighting';
      const can = canopy({ r: 9.75, h: 6, gores: 24 }); sight.add(can); const lines = rods(25, S.clay('#ddd5bd')); sight.add(lines);
      const obj = b28(); obj.scale.setScalar(0.1); obj.userData.mats.forEach(m => { m.color.set('#5b636e'); m.map = null; m.needsUpdate = true; }); obj.rotation.x = Math.PI; sight.add(obj);
      const at = G.cue(P0.at, dur * 0.45);
      const NS = 60; const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), S.clay('#f4fbff'), NS); drops.frustumCulled = false; sight.add(drops); const dd = Array.from({ length: NS }, () => [r() * TAU, 3 + r() * 6, 4 + r() * 6, 0.2 + r() * 0.4]);
      const ringM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false, fog: false }); const rings2 = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2), ringM.clone()); m.position.y = 0.15; sight.add(m); return m; });
      const ptRings = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64).rotateX(-Math.PI / 2), ringM.clone()); m.position.set(16, 0.2, -28); scene.add(m); return m; });
      G.finish({ ao: { radius: 1.2, intensity: 1.4, falloff: 0.8 }, dof: mode === 'pointing' ? { focus: 20, range: 12, bokeh: 1.6 } : false });
      const keys = P0.camera ?? (mode === 'sighting' ? [{ pos: [-24, 6, 40], look: [2, 8, -10], mm: 28 }, { pos: [-18, 5, 40], look: [5, 8, -12], mm: 30 }]
        : [{ pos: [-14, 4.5, 32], look: [-6, 3.2, 10], mm: 34 }, { pos: [-10, 4, 31], look: [-3, 3, 8], mm: 34 }]);
      return { scene, camera, layer: G.layer, update(t) {
        G.cam(keys, t, { float: 0.06 });
        { const p = wg.attributes.position; for (let i = 0; i < p.count; i++) { const x = wBase[i * 3], z = wBase[i * 3 + 2]; p.setY(i, 0.22 * Math.sin(x * 0.18 + t * 1.2) + 0.15 * Math.sin(z * 0.23 - t * 0.9 + x * 0.05)); } p.needsUpdate = true; wg.computeVertexNormals(); }
        boat.position.y = 0.12 * Math.sin(t * 1.3); boat.rotation.z = 0.035 * Math.sin(t * 1.05); boat.rotation.x = 0.02 * Math.sin(t * 0.8 + 1); boat.updateMatrixWorld(true);
        const tip = boat.localToWorld(boat.userData.boomTip.clone()); for (let k = 0; k < 2; k++) nets.set(k, tip, new THREE.Vector3(tip.x - 6 - k * 2, -0.2, tip.z + 6 + k), 0.04); nets.hide(2); nets.hide(3); nets.done();
        if (simoM) simoM.play(mode === 'pointing' ? 'point' : 'look_around', 1 + t).update();
        if (mode === 'sighting') { const dt = t - at; const k = clamp01((t + 0.5) / (at + 0.5)); const y = S.lerp(30, 0, k) ; const sink = Math.max(0, dt);
          const swing = Math.sin(t * 1.2) * 0.12 * (1 - clamp01(dt));
          can.position.set(0, dt < 0 ? y + 16 : S.lerp(16, 0.4, ease(clamp01(dt / 1.6))), 0); can.rotation.z = swing; const sq = clamp01(dt / 1.4); can.userData.set({ breath: 0.5 + 0.5 * Math.sin(t * 2), squash: sq, t }); can.scale.set(1 + sq * 0.2, 1, 1 + sq * 0.2);
          obj.position.set(Math.sin(swing) * -10, y + 1 - sink * 4, 0); obj.visible = dt < 1.2;
          can.updateMatrixWorld(true); const conf = obj.position.clone().add(new THREE.Vector3(0, 0.6, 0));
          can.userData.skirt.forEach((s0, i) => (dt < 0.8 ? lines.set(i, can.localToWorld(s0.clone()), conf, 0.06) : lines.hide(i))); lines.set(24, conf, obj.position.clone().add(new THREE.Vector3(0, 0, 0)), 0.1); lines.done();
          can.userData.mat.opacity = 1; can.visible = dt < 6;
          for (let i = 0; i < NS; i++) { const [a, v, up, s2] = dd[i]; const ok = dt > 0 && dt < 1.6; S.place(drops, i, ok ? [Math.cos(a) * v * dt, up * dt - 4.9 * dt * dt + 0.2, Math.sin(a) * v * dt] : [0, -50, 0], [0, 0, 0], ok ? s2 : 0.0001); } drops.instanceMatrix.needsUpdate = true;
          rings2.forEach((m, i) => { const d2 = dt - i * 0.4; m.visible = d2 > 0; if (d2 > 0) { const R = 2 + d2 * 5; m.scale.setScalar(R); m.material.opacity = 0.8 * Math.max(0, 1 - d2 / 4); } }); }
        ptRings.forEach((m, i) => { const d2 = ((t * 0.5 + i * 0.5) % 1); m.visible = mode === 'pointing' && !!P0.marker; m.scale.setScalar(2 + d2 * 7); m.material.opacity = 0.5 * (1 - d2); });
        G.frame(t, { boat: boat.position.clone().add(new THREE.Vector3(0, 9, 0)), chute: () => can.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 9, 0)), simo: boat.localToWorld(new THREE.Vector3(3.0, 3.4, -0.6)), water: [16, 1, -28] });
      } };
    },

    // ================================================================ sky: refuelling at 31,000 ft (metres). Tanker at the origin, flying +x.
    async sky(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'approach';
      const G = await stage(H, ctx, shot, { target: [-20, -6, 0], span: 60, az: 40, el: 55, sky: true, seed: P0.seed ?? 3, near: 0.5, far: 9000,
        caption: P0.caption === undefined ? (mode === 'approach' ? '17 JAN 1966 · 31,000 FT' : null) : P0.caption, source: P0.source === undefined ? (mode === 'approach' ? 'ILLUSTRATION · RECONSTRUCTION' : null) : P0.source });
      const { scene, camera } = G; const dur = G.dur;
      G.st.key.shadow.camera.far = 600; G.st.key.shadow.camera.updateProjectionMatrix();
      scene.fog = new THREE.Fog('#bcd9f2', 900, 5200);
      const tk = kc135(); scene.add(tk);
      const bm = b52(); scene.add(bm);
      const clouds = cloudField({ n: 60, area: 4200, y: -380, seed: 5, scale: 1.4 }); scene.add(clouds);
      const sea = mk(new THREE.PlaneGeometry(30000, 30000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#3b86c9', roughness: 0.5 }), { cast: false, receive: false }); sea.position.y = -2400;
      const fb = fireball({ n: 130 }); scene.add(fb); const deb = debris({ n: 60 }); scene.add(deb); const burn = burningDebris({ n: 18 }); scene.add(burn);
      // collision: each aircraft is two clipped halves that move together until contact, then break apart
      let tkA = null, bmA = null; const clips = [];
      if (mode === 'collision') { ctx.renderer.localClippingEnabled = true; tkA = kc135(); scene.add(tkA); bmA = b52(); scene.add(bmA);
        const clipGroup = (g, nx, cut) => { const local = new THREE.Plane(new THREE.Vector3(nx, 0, 0), -nx * cut), world = local.clone(); const mats = new Set();
          g.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); }); mats.forEach(m => { m.clippingPlanes = [world]; m.clipShadows = true; m.side = THREE.DoubleSide; }); clips.push({ g, local, world }); };
        clipGroup(tk, 1, -11.5); clipGroup(tkA, -1, -11.5); clipGroup(bm, 1, 8); clipGroup(bmA, -1, 8); }
      const flash = H.K.div(G.layer, 'opacity:0;inset:0;background:radial-gradient(circle at 50% 45%, rgba(255,252,240,1) 0%, rgba(255,236,190,.6) 30%, rgba(255,220,160,0) 65%)');
      // bombs (fall mode): four B28s at 1 unit = 1 m (scale 0.1), three with chutes
      const bombs = []; if (mode === 'fall') {
        const specs = [{ r: 2.6, line: 6, at: 0.0 }, { r: 0, line: 0, at: 99 }, { r: 2.6, line: 6, at: 0.5, torn: true }, { r: 8.5, line: 13, at: 0.25 }];
        specs.forEach((sp, i) => { const g = new THREE.Group(); const b = b28({ seed: i + 1 }); b.scale.setScalar(0.1); g.add(b);
          let can = null, lines = null; if (sp.r) { can = canopy({ r: sp.r, h: sp.r * 0.6, gores: 16 }); can.position.y = sp.line; g.add(can); lines = rods(17, S.clay('#d8d2bf', { rough: 0.8 })); g.add(lines); }
          scene.add(g); bombs.push({ g, b, can, lines, sp, i }); });
      }
      const layer = G.layer; const numPills = mode === 'fall' && P0.labels !== false ? bombs.map((b, i) => H.pill(layer, `${i + 1}`, { size: 26, dot: i === 3 ? RED : null })) : [];
      numPills.forEach(p => p.at(0, 0, 0));
      G.finish({ ao: { radius: 2.5, intensity: 1.2, falloff: 1 }, bloom: { intensity: 0.9, threshold: 1.05, radius: 0.75 } });
      const at = G.cue(P0.at, mode === 'collision' ? dur * 0.45 : mode === 'fall' ? 0.3 : dur);
      // contact geometry: boom at 30° with nozzle extended reaches the bomber's receptacle
      const ang = 0.52, tipC = boomTip(tk, ang, 0.85), recep = bm.userData.receptacle;
      const contact = tipC.clone().sub(recep); // bomber position at hook-up
      const speed = P0.speed ?? 55;
      const keys = P0.camera ?? {
        approach: [{ pos: [-2, -19, 78], look: [-20, -3, 0], mm: 30 }, { pos: [-16, -16, 72], look: [-24, -4, 0], mm: 32 }],
        collision: [{ pos: [-2, -20, 84], look: [-20, -4, 0], mm: 28 }, { pos: [-10, -26, 104], look: [-26, -14, 0], mm: 28 }],
        fall: [{ pos: [30, 0, 110], look: [-20, -30, 0], mm: 28 }, { pos: [20, -170, 120], look: [-22, -200, 0], mm: 30 }],
      }[mode];
      const tmp = new THREE.Vector3();
      return { scene, camera, layer, update(t) {
        if (mode !== 'fall' || P0.camera) G.cam(keys, t, { float: 0.25 });
        // clouds scroll backward (the formation flies at ~270 m/s; stylised)
        const it = clouds.userData.items; const off = (t * speed) % 4200;
        it.forEach((p, i) => { let x = p.p[0] - off; if (x < -2100) x += 4200; S.place(clouds, i, [x, p.p[1], p.p[2]], [0, 0, 0], p.sv); }); clouds.instanceMatrix.needsUpdate = true;
        // gentle formation bob
        const bob = Math.sin(t * 0.7) * 0.4;
        tk.position.set(0, bob, 0); tk.rotation.set(0, 0, Math.sin(t * 0.5) * 0.004);
        let bang = ang, ext = 0.85;
        if (mode === 'approach') {
          const k = ease(S.range(t, 0, Math.min(dur, at) * 0.92));
          bm.position.set(S.lerp(contact.x - 34, contact.x, k), S.lerp(contact.y - 24, contact.y, k) + bob * 0.8, S.lerp(16, 0, k)); bm.rotation.set(0, 0, 0.02 * (1 - k));
          ext = S.lerp(0.1, 0.85, ease(S.range(t, dur * 0.55, dur * 0.95))); bang = S.lerp(0.42, ang, k);
        } else if (mode === 'collision') {
          // hooked up, then a slight overrun and pitch-up into the tanker (USAF board: "overran ... pitched upward")
          const ov = ease(S.range(t, at - 2.2, at)); const dt = t - at;
          bm.position.set(contact.x + ov * 5.5, contact.y + ov * 2.2 + bob * 0.8, 0); bm.rotation.set(0, 0, ov * 0.07);
          bmA.position.copy(bm.position); bmA.rotation.copy(bm.rotation); tkA.position.copy(tk.position); tkA.rotation.copy(tk.rotation);
          if (dt > 0) { // after impact: both break apart and fall away behind and down, tumbling
            const d2 = dt * dt;
            tk.position.add(new THREE.Vector3(-dt * 7, -d2 * 2.0, 0)); tk.rotation.set(-dt * 0.1, 0, -dt * 0.22);
            tkA.position.add(new THREE.Vector3(-dt * 13, -d2 * 2.6 + dt * 1.2, dt * 2)); tkA.rotation.set(0, dt * 0.35, dt * 0.5);
            bm.position.add(new THREE.Vector3(-dt * 9, -d2 * 3.4, dt * 1.0)); bm.rotation.set(dt * 0.5, 0, bm.rotation.z - dt * 0.7);
            bmA.position.add(new THREE.Vector3(-dt * 12, -d2 * 2.4, 0)); bmA.rotation.set(dt * 0.22, 0, bmA.rotation.z - dt * 0.18);
            bmA.userData.wing.rotation.x = Math.min(0.5, dt * 0.25);
          }
          for (const c of clips) { c.g.updateMatrixWorld(true); c.world.copy(c.local).applyMatrix4(c.g.matrixWorld); }
          bang = ang - ov * 0.08;
        } else { // fall: wreckage high above, burning; bombs drop out
          bm.visible = false; tk.visible = false;
        }
        tk.userData.boom.rotation.z = bang; if (tkA) { tkA.userData.boom.rotation.z = bang; tkA.userData.nozzle.position.x = -tkA.userData.tubeLen + (1 - ext) * tkA.userData.nozLen; } tk.userData.nozzle.position.x = -tk.userData.tubeLen - (ext - 1) * 0 ; tk.userData.nozzle.scale.x = 1; tk.userData.nozzle.position.x = -tk.userData.tubeLen + (1 - ext) * tk.userData.nozLen;
        // fireball + debris
        if (mode === 'collision') { const dt = t - at; const hit = bm.position.clone().add(recep).add(new THREE.Vector3(1, 1, 0));
          const hp = tmp.set(contact.x + 5.5 + recep.x - 2, contact.y + 2.2 + recep.y + 1.6, 0);
          fb.position.copy(hp); fb.userData.set(dt, 2.9, [-9, -2.5, 0], t); deb.userData.set(dt, [hp.x, hp.y, hp.z]); burn.userData.set(dt, [hp.x, hp.y, hp.z]);
          flash.style.opacity = String(dt > 0 ? Math.max(0, 0.7 * Math.exp(-dt * 4)) : 0);
          bm.visible = tk.visible = !(dt > 0.25 && dt < 99) || true; }
        else if (mode === 'fall') { fb.position.set(-30, 70, -90); fb.userData.set(1.6 + t * 0.6, 4, [-6, 0, 0], t); deb.userData.set(1.2 + t, [-30, 70, -90]); }
        else { fb.userData.set(-1); deb.userData.set(-1); }
        if (mode === 'fall') {
          const chAt = G.cue(P0.chutes, at + 0.9);
          bombs.forEach((B, i) => { const dt = Math.max(0, t - at - i * 0.18); const open = B.sp.r ? ease(S.range(t, chAt + B.sp.at, chAt + B.sp.at + 1.2)) : 0;
            // tumbling free fall, then slow under canopy (stylised speeds)
            const x0 = -22 + i * 9, y = 4 - 9 * dt - 4 * dt * dt * (1 - open * 0.8) - (i === 1 ? 1.2 * dt * dt : 0), drift = i * 0.6;
            B.g.position.set(x0 - dt * (1.5 + drift), y, (i % 2 ? -5 : 4) - i);
            const tum = (1 - open) * (dt * (1.6 + i * 0.4)) + (i === 1 ? dt * 2.2 : 0);
            B.b.rotation.set(tum * 0.7 + Math.PI * open, 0, tum * 0.4 + 0.3 * (1 - open));
            if (B.can) { const s = Math.max(0.001, open); B.can.scale.set(s, Math.max(0.05, s), s); B.can.visible = open > 0.01; B.can.userData.set({ breath: 0.5 + 0.5 * Math.sin(t * 3 + i), squash: B.sp.torn ? 0.25 : 0, t });
              if (B.sp.torn) B.can.rotation.z = 0.25;
              const conf = new THREE.Vector3(0, 0.3, 0);
              B.can.userData.skirt.forEach((s0, k) => { if (open < 0.02) { B.lines.hide(k); return; } const p = s0.clone().multiplyScalar(open); p.applyEuler(B.can.rotation); p.y += B.sp.line * open; B.lines.set(k, p, conf, 0.035); });
              B.lines.done(); B.can.position.y = B.sp.line * open; B.g.rotation.z = Math.sin(t * 1.3 + i) * 0.12 * open; }
            if (i === 3 && !P0.camera) { const c = bombs.reduce((a, b) => a.add(b.g.position), new THREE.Vector3()).multiplyScalar(0.25); c.y = Math.max(c.y, bombs[3].g.position.y - 10);
              const u = S.smoother(S.range(t, 0, dur)); camera.position.set(c.x + S.lerp(20, 14, u), c.y + S.lerp(16, 3, u), c.z + S.lerp(54, 44, u)); camera.lookAt(c.x, c.y + 7, c.z);
              const fov = S.mmToFov(28); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(true); }
            B.open = open; });
          bombs.forEach((B, i) => { const pl = numPills[i]; if (!pl) return; const open = B.open; const [x, yy, v] = G.toPx(B.g.position.clone().add(new THREE.Vector3(0, B.can ? B.sp.line * open + B.sp.r * 0.6 * open + 1.5 : 2, 0))); pl.at(x, yy - 6, v ? S.range(t, at + 1.4 + i * 0.3, at + 1.8 + i * 0.3) : 0); });
        }
        G.frame(t, { tanker: tk.position.clone().add(new THREE.Vector3(0, 6, 0)), bomber: bm.position.clone().add(new THREE.Vector3(0, 6, 0)) });
      } };
    },
  };
}
