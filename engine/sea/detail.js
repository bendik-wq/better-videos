// engine/sea/detail.js: the things that make a ship read as real steel at 50 m: a stepped accommodation
// block (deck lips, walkways, railings, stair towers, bridge wings with their window band, radar mast
// with turning scanners, satcom domes), a streamlined funnel, lifeboats (free-fall or davit), life-raft
// racks, manifold + hose cranes, mooring winches and bitts, P/V vent risers, fire monitors, railings with
// stanchions, a flag that flies (pure in t), an anchor chain. Every builder merges geometry per material
// (a VLCC stays ~40 draw calls). Used by ships.js and navy.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function texOf(c, { srgb = true, repeat = null, aniso = 8 } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = aniso; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
export const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1, ...o });
export const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
export const cyl = (r0, r1, h, x, y, z, seg = 12, axis = 'y') => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); g.translate(x, y, z); return g; };
export const sph = (r, x, y, z, w = 12, h = 8) => { const g = new THREE.SphereGeometry(r, w, h); g.translate(x, y, z); return g; };
// a bar between two points (railings, booms, chains, lattice members)
export function bar(a, b, r = 0.05, seg = 4) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = seg === 'box' ? new THREE.BoxGeometry(r * 2, L, r * 2) : new THREE.CylinderGeometry(r, r, L, seg); g.translate(0, L / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.applyQuaternion(q); g.translate(A.x, A.y, A.z); return g; }
export const merge = (list) => { list = list.filter(Boolean); return list.length ? mergeGeometries(list.map(g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; })) : null; };
export function meshOf(geos, mat, group, { cast = true, recv = true } = {}) { const g = merge(geos); if (!g) return null; const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; group.add(m); return m; }

// shared materials (one set per page; ships of the same paint share them)
const MAT = {};
export function paint(name) {
  return MAT[name] ??= ({
    white: () => std({ color: 0xbcb9b2, roughness: 0.55, metalness: 0.05 }),
    whiteDirty: () => std({ color: 0xa9a59c, roughness: 0.7, metalness: 0.05 }),
    steel: () => std({ color: 0x6a6d6c, roughness: 0.55, metalness: 0.15 }),
    darkSteel: () => std({ color: 0x2b2e30, roughness: 0.6, metalness: 0.15 }),
    glass: () => std({ color: 0x0d1418, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.4 }),
    orange: () => std({ color: 0xd8571a, roughness: 0.45 }),
    red: () => std({ color: 0x8e2a1e, roughness: 0.6 }),
    redBright: () => std({ color: 0xb02a1c, roughness: 0.5 }),
    yellow: () => std({ color: 0xc9a838, roughness: 0.55 }),
    rust: () => std({ color: 0x5c3420, roughness: 0.9 }),
    black: () => std({ color: 0x141516, roughness: 0.6, metalness: 0.2 }),
    rubber: () => std({ color: 0x18191a, roughness: 0.85 }),
    navyGrey: () => std({ color: 0x6f7679, roughness: 0.62, metalness: 0.15 }),
    navyDark: () => std({ color: 0x2f3437, roughness: 0.55, metalness: 0.3 }),
  })[name]();
}

// ---------------------------------------------------------------- textures
// superstructure walls: paint with panel seams, window rows (frames, reflections of the sky), doors,
// rust weeps under every window, grime gathering at each deck line. width/height in metres.
export function wallTexture({ width = 40, decks = 7, deckH = 2.8, seed = 4, rust = 0.5, bridge = true, winW = 1.25, winH = 1.0, gap = 1.7, doors = 2, color = '#e7e5df', res = 1024, bridgeRow = 'band' } = {}) {
  const ppm = res / width, H = Math.max(64, Math.round(decks * deckH * ppm)), c = canvas(res, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, res, H);
  // panel seams (vertical every ~1.5 m) and soft paint variation
  for (let px = 0; px < res; px += 1.5 * ppm) { x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(px, 0, 1, H); }
  for (let i = 0; i < 90; i++) { const px = r() * res, py = r() * H, rr = 10 + r() * 60; const g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.04})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  for (let d = 0; d < decks; d++) {
    const yb = H - d * deckH * ppm, yc = yb - deckH * ppm * 0.52, top = d === decks - 1 && bridge;
    // grime at the foot of each deck, a darker band (deck edge shadow / run-off)
    const g = x.createLinearGradient(0, yb - 0.6 * ppm, 0, yb); g.addColorStop(0, 'rgba(60,50,40,0)'); g.addColorStop(1, 'rgba(60,50,40,0.22)'); x.fillStyle = g; x.fillRect(0, yb - 0.6 * ppm, res, 0.6 * ppm);
    if (top && bridgeRow === 'band') { // continuous bridge windows
      const wh = 1.45 * ppm; x.fillStyle = '#10181d'; x.fillRect(0.6 * ppm, yc - wh / 2, res - 1.2 * ppm, wh);
      const sky = x.createLinearGradient(0, yc - wh / 2, 0, yc + wh / 2); sky.addColorStop(0, 'rgba(170,200,220,0.35)'); sky.addColorStop(0.5, 'rgba(120,150,170,0.08)'); sky.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sky; x.fillRect(0.6 * ppm, yc - wh / 2, res - 1.2 * ppm, wh);
      x.fillStyle = 'rgba(200,200,200,0.8)'; for (let px = 0.6 * ppm; px < res - 0.6 * ppm; px += 1.6 * ppm) x.fillRect(px, yc - wh / 2, 0.08 * ppm, wh);
      continue;
    }
    const ww = winW * ppm, wh = winH * ppm, step = (winW + gap) * ppm;
    let k = 0;
    for (let px = step * 0.7; px < res - ww - step * 0.3; px += step, k++) {
      if (r() < 0.1) continue;
      if (d === 0 && doors && k % Math.max(3, Math.floor(res / step / doors)) === 1) { // a door instead
        x.fillStyle = '#8b8a84'; x.fillRect(px, yb - 2.0 * ppm, 0.9 * ppm, 2.0 * ppm); x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 1; x.strokeRect(px, yb - 2.0 * ppm, 0.9 * ppm, 2.0 * ppm); continue; }
      x.fillStyle = 'rgba(40,40,40,0.55)'; x.fillRect(px - 0.08 * ppm, yc - wh / 2 - 0.08 * ppm, ww + 0.16 * ppm, wh + 0.16 * ppm);   // frame
      x.fillStyle = '#121a1f'; x.fillRect(px, yc - wh / 2, ww, wh);
      const s = x.createLinearGradient(px, yc - wh / 2, px + ww, yc + wh / 2); s.addColorStop(0, 'rgba(180,205,225,0.32)'); s.addColorStop(0.45, 'rgba(120,150,170,0.06)'); s.addColorStop(1, 'rgba(255,255,255,0.0)'); x.fillStyle = s; x.fillRect(px, yc - wh / 2, ww, wh);
      if (r() < 0.25) { x.fillStyle = 'rgba(210,200,180,0.5)'; x.fillRect(px, yc - wh / 2, ww * (0.3 + r() * 0.6), wh * 0.5); } // curtains
      if (r() < rust) { const len = (0.4 + r() * 1.4) * ppm, gr = x.createLinearGradient(0, yc + wh / 2, 0, yc + wh / 2 + len); gr.addColorStop(0, 'rgba(120,64,30,0.45)'); gr.addColorStop(1, 'rgba(120,64,30,0)'); x.fillStyle = gr; x.fillRect(px + ww * (0.2 + r() * 0.5), yc + wh / 2, ww * 0.18, len); }
    }
  }
  return texOf(c);
}

// deck steel: plate seams, worn walkway, rust blooms, scuffs. colour: a muted deck paint.
export function deckTexture({ color = '#5d6656', walk = '#7a8070', lines = '#cfcabd', L = 330, B = 60, seed = 2, rust = 0.5, cl = true, res = 2048 }) {
  const W = res, H = Math.max(128, Math.round(res * B / L * 1.6)), c = canvas(W, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  const ppx = W / L, ppy = H / B;
  for (let i = 0; i < 700; i++) { const px = r() * W, py = r() * H, rr = 4 + r() * 36; const g = x.createRadialGradient(px, py, 0, px, py, rr); const k = r();
    g.addColorStop(0, k < 0.35 * rust ? `rgba(105,52,28,${0.12 + r() * 0.3})` : k < 0.65 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  // large-scale weathering: oil and soot patches, sun-faded areas
  for (let i = 0; i < 60; i++) { const px = r() * W, py = r() * H, rr = 40 + r() * 160; const g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, r() < 0.6 ? `rgba(30,25,20,${0.06 + r() * 0.08})` : `rgba(255,250,235,${0.04 + r() * 0.05})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  // plate seams: 2.4 m strakes along, butts every 9.6 m
  x.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < B; y += 2.4) x.fillRect(0, y * ppy, W, 1);
  for (let xx = 0; xx < L; xx += 9.6) x.fillRect(xx * ppx, 0, 1, H);
  if (cl) { x.fillStyle = walk; x.globalAlpha = 0.55; x.fillRect(0, H * 0.47, W, H * 0.06); x.globalAlpha = 1; x.fillStyle = lines; x.fillRect(0, H * 0.465, W, 1); x.fillRect(0, H * 0.535, W, 1); }
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`; x.fillRect(r() * W, r() * H, 2 + r() * 30, 1 + r() * 3); }
  // pipe-support rust lines running along under the cargo lines
  x.fillStyle = 'rgba(110,55,30,0.18)'; x.fillRect(0, H * 0.42, W, 3); x.fillRect(0, H * 0.56, W, 3);
  return texOf(c, { aniso: 8 });
}

// ---------------------------------------------------------------- railings
// a railing along a polyline of [x, y, z] (ship-local): top + mid rail, stanchions every `step` m
export function railing(pts, { h = 1.05, step = 1.6, r = 0.03 } = {}) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1];
    out.push(bar([a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], r, 'box'), bar([a[0], a[1] + h * 0.5, a[2]], [b[0], b[1] + h * 0.5, b[2]], r * 0.8, 'box'));
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) { const f = k / n; out.push(box(r * 1.6, h, r * 1.6, lerp(a[0], b[0], f), lerp(a[1], b[1], f) + h / 2, lerp(a[2], b[2], f))); } }
  return out;
}
const rectPts = (x0, x1, y, z0, z1) => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]];

// ---------------------------------------------------------------- accommodation block
// o: { x (centre), y (deck), len (fore-aft), wid (athwart), decks, dh, beam (ship), seed, lifeboats: 'freefall'|'davits'|'none',
//      sternX (for the free-fall ramp), mast: 'radar'|'navy'|null, bridgeWings (true), white (material) }
// returns { bridge: [x, y, z] eye point on the bridge, top, spin: [{ mesh, rate }] }
export function accommodation(body, o) {
  const { x, y, len, wid, decks = 7, dh = 2.9, beam, seed = 3 } = o, H = decks * dh, r = rng(seed);
  const wallM = paint('white'), trimM = paint('whiteDirty'), steel = paint('steel'), dark = paint('darkSteel');
  const res = o.lite ? 256 : 1024;
  const fore = new THREE.MeshStandardMaterial({ map: wallTexture({ res, width: wid, decks, deckH: dh, seed: seed + 1, rust: o.rust ?? 0.35 }), color: 0xbcb9b2, roughness: 0.55, metalness: 0.05 });
  const side = new THREE.MeshStandardMaterial({ map: wallTexture({ res, width: len, decks, deckH: dh, seed: seed + 2, rust: o.rust ?? 0.35, bridgeRow: 'windows' }), color: 0xbcb9b2, roughness: 0.55, metalness: 0.05 });
  // main block (the top deck is the wheelhouse, slightly longer forward), +x is forward
  const main = new THREE.Mesh(new THREE.BoxGeometry(len, H - dh, wid), [fore, fore, wallM, wallM, side, side]);
  main.position.set(x, y + (H - dh) / 2, 0); main.castShadow = main.receiveShadow = true; body.add(main);
  const whLen = len * 0.62, whX = x + len / 2 - whLen / 2 + 0.8;
  const foreTop = new THREE.MeshStandardMaterial({ map: wallTexture({ width: beam + 1, decks: 1, deckH: dh, seed: seed + 3, bridge: true }), color: 0xbcb9b2, roughness: 0.55, metalness: 0.05 });
  const sideTop = new THREE.MeshStandardMaterial({ map: wallTexture({ width: whLen, decks: 1, deckH: dh, seed: seed + 4, bridge: true }), color: 0xbcb9b2, roughness: 0.55, metalness: 0.05 });
  const wing = o.bridgeWings === false ? wid : beam + 1;
  const wh = new THREE.Mesh(new THREE.BoxGeometry(whLen, dh, wing), [foreTop, fore, wallM, wallM, sideTop, sideTop]);
  wh.position.set(whX, y + H - dh / 2, 0); wh.castShadow = wh.receiveShadow = true; body.add(wh);
  const lips = [], rails = [], stairs = [], kit = [], darks = [];
  // deck lips + walkways with railings round every deck from 1 up (the strong horizontal shadow lines)
  for (let d = 1; d < decks; d++) {
    const yy = y + d * dh, ext = d === decks - 1 ? 0 : 0.9;
    lips.push(box(len + ext * 2, 0.22, wid + ext * 2, x, yy - 0.11, 0));
    if (ext) rails.push(...railing(rectPts(x - len / 2 - ext, x + len / 2 + ext, yy, -wid / 2 - ext, wid / 2 + ext), { step: 1.8 }));
  }
  // wheelhouse roof (compass deck) with a railing, sun visor over the bridge windows
  lips.push(box(whLen + 1.4, 0.35, wing + 0.6, whX, y + H + 0.17, 0), box(0.9, 0.12, wing, whX + whLen / 2 + 0.4, y + H - 0.25, 0));
  rails.push(...railing(rectPts(whX - whLen / 2 - 0.6, whX + whLen / 2 + 0.6, y + H + 0.34, -wing / 2, wing / 2), { step: 2 }));
  // stair towers on the aft face: flights between the walkways
  for (let d = 0; d < decks - 1; d++) { const yy = y + d * dh, sz = (d % 2 ? -1 : 1) * wid * 0.3;
    stairs.push(bar([x - len / 2 - 0.5, yy + 0.1, sz - 1.4], [x - len / 2 - 0.5, yy + dh, sz + 1.4], 0.35, 'box')); }
  // bridge-wing undersides get a bracket, wing ends a small console
  for (const s of [-1, 1]) { kit.push(box(1.2, 1.1, 0.8, whX + whLen / 2 - 1.2, y + H - dh + 0.55, s * (wing / 2 - 0.8))); darks.push(box(0.15, 1.2, 0.15, whX + whLen / 2 - 1.2, y + H - dh - 0.6, s * (wing / 2 - 1))); }
  // life-raft canisters (white) on racks both sides, a rescue boat on a davit (starboard)
  const rafts = [];
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) rafts.push(cyl(0.38, 0.38, 1.3, x - len * 0.2 + k * 1.1, y + dh * 2 + 0.6, s * (wid / 2 + 0.5), 10, 'x'));
  const boats = [];
  const lb = o.lifeboats ?? 'freefall';
  if (lb === 'davits') for (const s of [-1, 1]) { boats.push(lifeboatGeo(8.5, 2.9, x - len * 0.1, y + dh * 1.7, s * (wid / 2 + 2.3)));
    darks.push(bar([x - len * 0.1 - 3, y + dh * 1.3, s * (wid / 2 + 0.2)], [x - len * 0.1 - 3, y + dh * 2.5, s * (wid / 2 + 2.6)], 0.18, 'box'), bar([x - len * 0.1 + 3, y + dh * 1.3, s * (wid / 2 + 0.2)], [x - len * 0.1 + 3, y + dh * 2.5, s * (wid / 2 + 2.6)], 0.18, 'box')); }
  if (lb === 'freefall') { const fx = (o.sternX ?? x - len / 2 - 8) + 0.5, fy = y + dh * 1.3; const g = lifeboatGeo(9, 3.2, 0, 0, 0); g.rotateZ(0.55); g.translate(fx, fy + 1.2, 0); boats.push(g);
    darks.push(bar([fx - 4.5, fy - 2.4, -1.8], [fx + 4.5, fy + 3.6, -1.8], 0.2, 'box'), bar([fx - 4.5, fy - 2.4, 1.8], [fx + 4.5, fy + 3.6, 1.8], 0.2, 'box'));
    boats.push(lifeboatGeo(5.2, 2.0, x - len * 0.15, y + dh * 1.6, wid / 2 + 2.0)); darks.push(bar([x - len * 0.15, y + dh * 1.3, wid / 2], [x - len * 0.15, y + dh * 2.4, wid / 2 + 2.2], 0.15, 'box')); }
  // radar mast on the compass deck: a steel post, a platform, two scanners (X-band faster), satcom radomes, whips
  const spin = [];
  if (o.mast !== null) {
    const mx = whX - whLen * 0.15, my = y + H + 0.35;
    kit.push(box(1.0, 7, 1.0, mx, my + 3.5, 0), box(3.2, 0.2, 2.4, mx, my + 5.2, 0), box(0.25, 5, 0.25, mx - 0.5, my + 9.5, 0), box(4, 0.15, 0.15, mx - 0.5, my + 10.5, 0));
    darks.push(box(0.4, 0.4, 5.5, mx + 0.8, my + 7.4, 0));
    for (const [k, len2, yy, rate] of [[0, 6.5, my + 7.6, 2 * Math.PI / 2.4], [1, 4.0, my + 5.6, 2 * Math.PI / 2.9]]) {
      const sc = new THREE.Mesh(merge([box(len2, 0.45, 0.35, 0, 0, 0), box(0.6, 0.5, 0.6, 0, -0.45, 0)]), paint('white')); sc.position.set(mx + (k ? 2.2 : 0.8), yy, k ? 2.2 * (r() < 0.5 ? 1 : -1) : 0); sc.castShadow = true; body.add(sc); spin.push({ mesh: sc, rate, phase: r() * 6.28 });
      if (k) kit.push(box(0.4, 1.3, 0.4, sc.position.x, yy - 0.9, sc.position.z));
    }
    const domes = [sph(0.7, whX + whLen * 0.2, my + 1.6, -wing * 0.18, 12, 8), sph(0.55, whX + whLen * 0.2, my + 1.4, wing * 0.18, 12, 8)];
    kit.push(cyl(0.2, 0.2, 1.0, whX + whLen * 0.2, my + 0.6, -wing * 0.18, 6), cyl(0.2, 0.2, 0.8, whX + whLen * 0.2, my + 0.5, wing * 0.18, 6));
    meshOf(domes, paint('white'), body);
    for (let k = 0; k < 5; k++) darks.push(cyl(0.03, 0.05, 4 + r() * 3, whX - whLen * 0.4 + k * 1.3, my + 2.5, (r() - 0.5) * wid * 0.6, 4));
  }
  meshOf(lips, trimM, body); if (!o.lite) { meshOf(rails, steel, body, { cast: false }); meshOf(stairs, dark, body); } meshOf(kit, paint('white'), body); meshOf(darks, dark, body);
  meshOf(rafts, paint('white'), body); meshOf(boats, paint('orange'), body);
  return { bridge: [whX + whLen / 2 - 1.2, y + H - dh + 1.7, 0], top: y + H, whX, whLen, wing, spin, main, wh };
}
// an enclosed lifeboat: a rounded hull with a canopy (orange), length l, beam b, centred at (x, y, z), axis +x
export function lifeboatGeo(l, b, x, y, z) {
  const hull = new THREE.CapsuleGeometry(b / 2, l - b, 4, 10); hull.rotateZ(Math.PI / 2); hull.scale(1, 0.62, 1);
  const top = new THREE.CapsuleGeometry(b * 0.4, l * 0.62, 4, 10); top.rotateZ(Math.PI / 2); top.scale(1, 0.75, 1); top.translate(0, b * 0.3, 0);
  const g = merge([hull, top]); g.translate(x, y, z); return g;
}

// ---------------------------------------------------------------- funnel
// a streamlined funnel (rounded-rect section, tapering, raked aft) with a company band and black top
export function funnel(body, { x, y, h = 14, len = 8, wid = 5.5, rake = 0.12, band = 0x1d4f8a, color = 0xb7b3ab, top = 0x151617, logo = null }) {
  const shape = new THREE.Shape(), rr = wid * 0.45, hl = len / 2, hw = wid / 2;
  shape.moveTo(-hl + rr, -hw); shape.lineTo(hl - rr * 1.6, -hw); shape.quadraticCurveTo(hl, -hw, hl, 0); shape.quadraticCurveTo(hl, hw, hl - rr * 1.6, hw); shape.lineTo(-hl + rr, hw); shape.quadraticCurveTo(-hl, hw, -hl, 0); shape.quadraticCurveTo(-hl, -hw, -hl + rr, -hw);
  const part = (y0, y1, col) => { const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i) + y0, f = 1 - 0.1 * (yy / h); p.setX(i, p.getX(i) * f - rake * yy); p.setZ(i, p.getZ(i) * f); p.setY(i, yy); }
    g.computeVertexNormals(); g.translate(x, y, 0); const m = new THREE.Mesh(g, std({ color: col, roughness: 0.5, metalness: 0.1 })); m.castShadow = m.receiveShadow = true; body.add(m); return m; };
  part(0, h * 0.62, color); part(h * 0.62, h * 0.8, band); part(h * 0.8, h * 0.9, color); part(h * 0.9, h, top);
  meshOf([cyl(0.6, 0.6, 2.4, x - rake * h - len * 0.15, y + h + 0.9, 0.9, 10), cyl(0.5, 0.5, 2.0, x - rake * h + len * 0.1, y + h + 0.7, -0.8, 10), cyl(0.35, 0.35, 1.6, x - rake * h - len * 0.3, y + h + 0.6, -1.2, 8)], paint('black'), body);
}

// ---------------------------------------------------------------- deck machinery
// a hose-handling / provision crane: pedestal, slewing house, boom raised at `elev` rad towards `slew` rad
export function crane(x, y, z, { h = 6, boom = 20, elev = 0.55, slew = 0, r = 0.8 } = {}) {
  const ped = [cyl(r, r * 1.15, h, x, y + h / 2, z, 12), box(r * 2.6, 1.6, r * 2.2, x, y + h + 0.8, z)];
  const bx = Math.cos(slew), bz = Math.sin(slew), p0 = [x + bx * 0.6, y + h + 1.2, z + bz * 0.6], p1 = [p0[0] + bx * Math.cos(elev) * boom, p0[1] + Math.sin(elev) * boom, p0[2] + bz * Math.cos(elev) * boom];
  const arm = [bar(p0, p1, 0.32, 'box'), bar([x - bx * 0.8, y + h + 1.4, z - bz * 0.8], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 0.3, (p0[2] + p1[2]) / 2], 0.08, 4)];
  const hook = [bar(p1, [p1[0], p1[1] - 6, p1[2]], 0.03, 3), box(0.4, 0.6, 0.4, p1[0], p1[1] - 6.3, p1[2])];
  return { ped, arm, hook };
}
// a cargo manifold on one side (s = -1 port, +1 starboard): risers from the deck lines, valves with
// handwheels, reducers at the ship's side, a drip tray beneath
export function manifold(xc, yd, halfB, s, n = 4) {
  const pipes = [], valves = [], wheels = [], trays = [];
  for (let k = 0; k < n; k++) { const xx = xc - (n - 1) * 1.6 + k * 3.2, z0 = s * 4, z1 = s * (halfB - 1.6);
    pipes.push(cyl(0.38, 0.38, Math.abs(z1 - z0), xx, yd + 1.35, (z0 + z1) / 2, 10, 'z'), cyl(0.38, 0.38, 0.6, xx, yd + 1.0, z0, 10));
    pipes.push(cyl(0.55, 0.55, 0.12, xx, yd + 1.35, z1, 14, 'z'), cyl(0.5, 0.5, 0.12, xx, yd + 1.35, z1 - s * 1.2, 14, 'z'));   // flanges
    valves.push(box(0.9, 0.9, 0.7, xx, yd + 1.35, s * (halfB - 4.5)), cyl(0.06, 0.06, 1.1, xx, yd + 2.2, s * (halfB - 4.5), 5));
    const w = new THREE.TorusGeometry(0.42, 0.05, 4, 12); w.rotateX(Math.PI / 2); w.translate(xx, yd + 2.75, s * (halfB - 4.5)); wheels.push(w);
    for (const zz of [s * 6, s * (halfB - 3)]) trays.push(box(0.25, 1.35, 0.25, xx, yd + 0.67, zz)); }
  trays.push(box(n * 3.2 + 1.5, 0.35, 3.4, xc, yd + 0.2, s * (halfB - 2.6)));
  return { pipes, valves, wheels, trays };
}
// mooring: a winch (drum + warping head + brake band) with its axis across the ship
export function winch(x, y, z, s = 1) { return [cyl(0.9, 0.9, 1.8, x, y + 1.2, z, 14, 'z'), cyl(0.45, 0.55, 0.8, x, y + 1.2, z + s * 1.5, 10, 'z'), box(1.6, 1.0, 0.5, x, y + 0.5, z - s * 1.1), box(2.4, 0.4, 3.6, x, y + 0.2, z + s * 0.2)]; }
export function bitts(x, y, z) { return [cyl(0.32, 0.32, 0.9, x - 0.6, y + 0.45, z, 10), cyl(0.32, 0.32, 0.9, x + 0.6, y + 0.45, z, 10), box(2.0, 0.15, 0.9, x, y + 0.07, z), cyl(0.42, 0.42, 0.08, x - 0.6, y + 0.92, z, 10), cyl(0.42, 0.42, 0.08, x + 0.6, y + 0.92, z, 10)]; }

// ---------------------------------------------------------------- flag (flies in the wind, pure in t)
export function flagTexture(kind) {
  const c = canvas(256, 160), x = c.getContext('2d'), W = 256, H = 160;
  if (kind === 'us') { for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#f3f1ea' : '#b22234'; x.fillRect(0, i * H / 13, W, H / 13 + 1); }
    x.fillStyle = '#3c3b6e'; x.fillRect(0, 0, W * 0.4, H * 7 / 13); x.fillStyle = '#f3f1ea'; for (let j = 0; j < 9; j++) for (let i = 0; i < (j % 2 ? 5 : 6); i++) { x.beginPath(); x.arc((j % 2 ? 17 : 8.5) + i * 17, 6 + j * 9.2, 2.2, 0, 7); x.fill(); } }
  else if (kind === 'iran') { const b = ['#239f40', '#f3f1ea', '#da0000']; b.forEach((c2, i) => { x.fillStyle = c2; x.fillRect(0, i * H / 3, W, H / 3 + 1); }); x.fillStyle = '#da0000'; x.font = '700 40px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('☫', W / 2, H / 2 + 2); }
  else if (kind === 'oman') { x.fillStyle = '#f3f1ea'; x.fillRect(0, 0, W, H / 3); x.fillStyle = '#db161b'; x.fillRect(0, H / 3, W, H / 3); x.fillStyle = '#008000'; x.fillRect(0, H * 2 / 3, W, H / 3); x.fillStyle = '#db161b'; x.fillRect(0, 0, W * 0.27, H); }
  else if (kind === 'red') { x.fillStyle = '#9b1c16'; x.fillRect(0, 0, W, H); }
  else { x.fillStyle = '#2d4f8a'; x.fillRect(0, 0, W, H); x.fillStyle = '#f3f1ea'; x.fillRect(0, H * 0.4, W, H * 0.2); }
  return texOf(c, { aniso: 4 });
}
// returns { mesh, update(t, speed) }: a 16x10 cloth whose ripple is an analytic travelling wave
export function flag(kind, { w = 3.6, h = 2.2 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, 16, 8); g.translate(w / 2, 0, 0); const p = g.attributes.position, base = Float32Array.from(p.array);
  const m = new THREE.Mesh(g, std({ map: flagTexture(kind), side: THREE.DoubleSide, roughness: 0.8 })); m.castShadow = true;
  return { mesh: m, update(t, wind = 8) { for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], f = x / w;
      p.setZ(i, Math.sin(x * 1.6 - t * (3 + wind * 0.4)) * 0.28 * f + Math.sin(x * 3.1 - t * 6.1 + y) * 0.08 * f); p.setY(i, y - f * f * 0.25); } p.needsUpdate = true; g.computeVertexNormals(); } };
}

// ---------------------------------------------------------------- anchor chain
// from a hawse pipe at local (x, y, z) down and forward into the water at angle `a` (catenary-ish)
export function anchorChain(x, y, z, { len = 34, out = 26, s = 1 } = {}) {
  const pts = []; for (let i = 0; i <= 14; i++) { const f = i / 14; pts.push([x + out * f, y - (y + 6) * Math.pow(f, 0.8) - Math.sin(f * Math.PI) * 1.5, z + s * f * 2]); }
  const out2 = []; for (let i = 0; i < pts.length - 1; i++) out2.push(bar(pts[i], pts[i + 1], 0.22, 6));
  return out2;
}
