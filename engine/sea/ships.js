// engine/sea/ships.js: procedural ships with PBR materials, built to real proportions, detailed for
// a camera 50 m away, cheap from 2 km.
//
//   const s = SH.ship('vlcc', { name: 'ARABIAN DAWN', seed: 3, loaded: 1 });  // vlcc | container | lng | destroyer | fastboat | dhow
//   sea.addShip(s);                       // its wake, bow wave and shadow go into the ocean shader
//   s.follow(lane, { s0: 1200, speed: 7.5 });   // or s.place(x, z, headingDeg); motion is analytic in t
//   // every frame, Sea.render calls s.update(t, sea): position on the lane, heave/pitch/roll from the waves
//
// Local frame: +x forward (bow at +L/2), y up (design waterline at y = 0), +z starboard. World heading is a
// compass bearing (0 = north = -z, 90 = east = +x), rotation.y = pi/2 - heading.
// Hull: lofted stations (parallel midbody, fine entrance and run, raked flared stem, bulbous bow,
// transom), one canvas atlas per ship for the sides (plating strakes and butts, boot-top, antifouling,
// rust streaks from every scupper and the hawse pipes, draft marks, Plimsoll mark, name and port), a
// normal map derived from it, and a roughness map (rust and salt are rough).
// Real proportions (L x B x D, draft): VLCC 330 x 60 x 29 m, T 21 m loaded / 9 m ballast; 14k TEU
// container ship 366 x 51 x 30, T 15; Moss LNG 290 x 49 x 27, T 11.5; Arleigh Burke destroyer
// 155 x 20 x 12, T 9.4; IRGC fast-attack boat 12 x 3 m; Gulf dhow (jalibut) 22 x 6 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as DT from './detail.js';

const D2R = Math.PI / 180;
const bar = DT.bar;
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function texOf(c, { srgb = true, repeat = null, aniso = 8 } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = aniso; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
// height canvas -> tangent-space normal map (Sobel)
function normalFrom(c, strength = 2) {
  const w = c.width, h = c.height, src = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const out = canvas(w, h), ox = out.getContext('2d'), img = ox.createImageData(w, h), d = img.data;
  const H = (x, y) => src[((Math.min(h - 1, Math.max(0, y))) * w + Math.min(w - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ox.putImageData(img, 0, 0); return out;
}
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1, ...o });
const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
const cyl = (r0, r1, h, x, y, z, seg = 12, axis = 'y') => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); g.translate(x, y, z); return g; };
const merge = (list) => list.length ? mergeGeometries(list.map(g => g.index ? g.toNonIndexed() : g)) : null;
function meshOf(geos, mat, group, { cast = true, recv = true } = {}) { const g = merge(geos.filter(Boolean)); if (!g) return null; g.computeVertexNormals?.(); const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; group.add(m); return m; }

// ============================================================ hull
// o: { L, B, D (keel to deck), T (draft), mid: [aft, fwd] parallel midbody (fraction of L from stern), entry, run (exponents),
//      rake (m of stem rake at deck), flare, bulb (radius fraction of B), transom (half-width fraction at deck), bilge (radius),
//      sheer (deck rise at bow, m), stations, girth }
export function hullGeometry(o) {
  const { L, B, D, T } = o, nx = o.stations ?? 120, ng = o.girth ?? 18;
  const mid0 = o.mid?.[0] ?? 0.22, mid1 = o.mid?.[1] ?? 0.72, entry = o.entry ?? 1.8, run = o.run ?? 2.2;
  const half = (s, y) => { // half-breadth at station s (0 stern .. 1 bow) and height y (waterline 0)
    let w;
    if (s >= mid1) { const u = (s - mid1) / (1 - mid1); const ex = entry * (1 - 0.35 * clamp(y / (D - T))); w = Math.pow(1 - Math.pow(u, ex), 1 / 1.25); }
    else if (s <= mid0) { const u = (mid0 - s) / mid0; w = Math.pow(1 - Math.pow(u, run), 0.85); const tr = (o.transom ?? 0.6) * sstep(-T * 0.2, (D - T) * 0.4, y); w = Math.max(w, tr * (1 - Math.pow(u, 8) * 0.15)); }
    else w = 1;
    // flare above the waterline near the bow
    if (s > mid1 && y > 0) w = Math.min(1, w + (o.flare ?? 0.12) * (y / (D - T)) * w * (1 - w) * 4);
    return clamp(w) * B / 2;
  };
  const bowX = (s, y) => { // stem rake and bulb: x offset near the bow end
    let dx = 0;
    if (s > 0.9) { const k = sstep(0.9, 1, s); dx += (o.rake ?? 6) * clamp(y / (D - T), -0.2, 1) * k;
      if (o.bulb) { const yb = -T * 0.62, g = Math.exp(-Math.pow((y - yb) / (T * 0.3), 2)); dx += g * B * (o.bulbLen ?? 0.12) * k; } }
    if (s < 0.05 && y > -T * 0.3) dx -= (o.overhang ?? 4) * sstep(-T * 0.3, D - T, y) * (1 - s / 0.05);
    return dx;
  };
  const bilge = o.bilge ?? B * 0.06;
  const pos = [], uv = [], idx = [], deckEdge = [];
  const ytop = (s) => (D - T) + (o.sheer ?? 1.5) * Math.pow(Math.max(0, s - 0.6) / 0.4, 2);
  for (let i = 0; i < nx; i++) {
    const s = i / (nx - 1), x0 = -L / 2 + s * L;
    // section points from the deck edge (j = 0) down the side, round the bilge, to the keel centre (j = ng - 1)
    const yt = ytop(s), yk = -T + (s > 0.93 && !o.bulb ? (s - 0.93) / 0.07 * T * 0.5 : 0) + (s < 0.06 ? (0.06 - s) / 0.06 * T * 0.45 : 0);
    const sec = [];
    const nSide = ng - 6;
    for (let j = 0; j < nSide; j++) { const y = lerp(yt, yk + bilge, j / (nSide - 1)); sec.push([half(s, y), y]); }
    const wb = half(s, yk + bilge * 0.5), r = Math.min(bilge, wb);
    for (let j = 1; j <= 4; j++) { const a = j / 4 * Math.PI / 2; sec.push([Math.max(0, wb - r + Math.cos(a) * r), yk + bilge - Math.sin(a) * bilge]); }
    sec.push([0, yk]);
    for (let side = 0; side < 2; side++) {
      for (let j = 0; j < sec.length; j++) {
        const [w, y] = sec[j], z = side ? w : -w;
        pos.push(x0 + bowX(s, y), y, z);
        // atlas: rows 0..0.5 = starboard (u runs stern -> bow), 0.5..1 = port (u runs bow -> stern)
        const v = clamp((y + T) / D), u = side ? s : 1 - s;
        uv.push(u, side ? 0.5 + v * 0.5 : v * 0.5);
      }
    }
    deckEdge.push([x0 + bowX(s, yt), yt, sec[0][0]]);
  }
  const ns = (ng - 6) + 5; // points per section side
  for (let i = 0; i < nx - 1; i++) for (let side = 0; side < 2; side++) for (let j = 0; j < ns - 1; j++) {
    const a = (i * 2 + side) * ns + j, b = a + 1, c = ((i + 1) * 2 + side) * ns + j, d = c + 1;
    if (side) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // transom: close the stern section
  const st = []; const s0 = 0; for (let j = 0; j < ns; j++) { const p = pos.slice(j * 3, j * 3 + 3); st.push(p); }
  const tg = new THREE.BufferGeometry(); const tp = [], ti = [];
  for (let j = 0; j < ns; j++) tp.push(st[j][0], st[j][1], st[j][2], st[j][0], st[j][1], -st[j][2]);
  for (let j = 0; j < ns - 1; j++) { const a = j * 2, b = a + 1, c = a + 2, d = a + 3; ti.push(a, c, b, b, c, d); }
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(tp.length / 3 * 2).fill(0.002), 2)); tg.setIndex(ti); tg.computeVertexNormals();
  // deck: a flat strip between the two deck edges (with sheer)
  const dp = [], du = [], di = [];
  for (let i = 0; i < deckEdge.length; i++) { const [x, y, w] = deckEdge[i]; dp.push(x, y, -w, x, y, w); du.push(i / (deckEdge.length - 1), 0, i / (deckEdge.length - 1), 1); }
  for (let i = 0; i < deckEdge.length - 1; i++) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals();
  return { hull: g, transom: tg, deck: dg, deckEdge, half, ytop, bowX };
}

// ============================================================ hull side atlas
// paint: { top: hull colour, boot: boot-top colour, bottom: antifouling, name, port, marks: true, rust: 0..1, seed }
function hullAtlas(o, dims, paint) {
  const W = paint.res ?? (o.lite ? 1024 : 4096), Hh = o.lite ? 256 : 1024, c = canvas(W, Hh), x = c.getContext('2d');
  const hc = canvas(W, Hh), hx = hc.getContext('2d');           // height (for the normal map)
  const rc = canvas(W, Hh), rx = rc.getContext('2d');           // roughness
  const { L, D, T } = dims, r = rng(paint.seed ?? 1);
  hx.fillStyle = '#808080'; hx.fillRect(0, 0, W, Hh); rx.fillStyle = `rgb(${Math.round((paint.rough ?? 0.5) * 255)},0,0)`; rx.fillRect(0, 0, W, Hh);
  for (let side = 0; side < 2; side++) {
    const oy = side ? Hh / 2 : 0, h = Hh / 2; // canvas y: top of this half = v 0.5/1 -> but canvas y grows down
    // v = (y + T) / D maps to canvas row: row = oy + (1 - v) * h  (flipY texture)
    const row = (y) => oy + (1 - clamp((y + T) / D)) * h;
    const col = (s) => (side ? s : 1 - s) * W;                    // s: 0 stern .. 1 bow
    const wl = paint.waterline ?? 0, loadT = T;
    // base paint: hull colour above the boot-top, antifouling below
    x.fillStyle = paint.top; x.fillRect(0, oy, W, h);
    x.fillStyle = paint.bottom; x.fillRect(0, row(wl - (paint.bootDepth ?? 0.4)), W, oy + h - row(wl - (paint.bootDepth ?? 0.4)));
    x.fillStyle = paint.boot ?? '#1d1f22'; x.fillRect(0, row(wl + (paint.bootH ?? 1.6)), W, row(wl - (paint.bootDepth ?? 0.4)) - row(wl + (paint.bootH ?? 1.6)));
    // fading and grime: large soft blotches
    for (let i = 0; i < 260; i++) { const px = r() * W, py = oy + r() * h, rr = 20 + r() * 140; const gr = x.createRadialGradient(px, py, 0, px, py, rr);
      const a = 0.05 + r() * 0.07; gr.addColorStop(0, r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    // plating: strakes (horizontal seams) every ~2.6 m, butts every ~10.5 m, staggered
    const pxPerM = W / L, pyPerM = h / D;
    hx.strokeStyle = '#9a9a9a'; x.strokeStyle = 'rgba(0,0,0,0.07)'; x.lineWidth = 1.0; hx.lineWidth = 1.6;
    for (let y = -T + 2.6, k = 0; y < D - T; y += 2.6, k++) {
      const ry = row(y); x.beginPath(); x.moveTo(0, ry); x.lineTo(W, ry); x.stroke(); hx.beginPath(); hx.moveTo(0, ry); hx.lineTo(W, ry); hx.stroke();
      for (let s = (k % 2) * 5.2; s < L; s += 10.4) { const cx = col(s / L); const r0 = row(y + 2.6), r1 = ry; x.beginPath(); x.moveTo(cx, r0); x.lineTo(cx, r1); x.stroke(); hx.beginPath(); hx.moveTo(cx, r0); hx.lineTo(cx, r1); hx.stroke(); }
    }
    // plate waviness ("hungry horse"): each plate field dishes in between the frames (0.85 m) and the
    // longitudinals (0.9 m); welding distortion makes the dishing uneven, so it catches grazing light
    { const fw = Math.max(2, 0.85 * pxPerM), top = row(D - T), bot = row(-T);
      for (let s = 0, k = 0; s < L; s += 0.85, k++) { const cx = col(s / L), a = (0.015 + 0.05 * r() * r()) * (0.5 + 0.5 * Math.sin(s * 0.07 + side));
        const g = hx.createLinearGradient(cx, 0, cx + (side ? fw : -fw), 0); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a})`); g.addColorStop(1, `rgba(255,255,255,${a})`);
        hx.fillStyle = g; hx.fillRect(Math.min(cx, cx + (side ? fw : -fw)), top, fw, bot - top); }
      const lh = Math.max(2, 0.9 * pyPerM);
      for (let y = -T; y < D - T; y += 0.9) { const ry = row(y), a = 0.01 + 0.03 * r() * r(); const g = hx.createLinearGradient(0, ry, 0, ry - lh); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a})`); g.addColorStop(1, `rgba(255,255,255,${a})`); hx.fillStyle = g; hx.fillRect(0, ry - lh, W, lh); }
      // dents and fender scrapes near the waterline amidships, touched-up paint patches
      for (let i = 0; i < 26; i++) { const px = col(0.2 + r() * 0.6), py = row(r() * (D - T) * 0.6), rr = (0.6 + r() * 2.2) * pxPerM; const g = hx.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); hx.fillStyle = g; hx.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 40; i++) { const px = r() * W, py = oy + r() * h * 0.7, ww = (2 + r() * 8) * pxPerM, hh = (0.8 + r() * 3) * pyPerM; x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.012 + r() * 0.02})`; x.fillRect(px, py, ww, hh); }
      for (let i = 0; i < 18; i++) { const px = col(0.15 + r() * 0.7), py = row(1 + r() * 4), ww = (1 + r() * 5) * pxPerM; x.fillStyle = `rgba(150,140,130,${0.08 + r() * 0.1})`; x.fillRect(px, py, ww, (0.1 + r() * 0.3) * pyPerM); rx.fillStyle = 'rgba(230,0,0,0.5)'; rx.fillRect(px, py, ww, 0.4 * pyPerM); } }
    // scupper rust streaks from the deck edge, hawse pipe streaks at the bow, weeping welds
    const rust = paint.rust ?? 0.6;
    const streak = (s, y0, len, wd, a) => { const cx = col(s), ry = row(y0), ry1 = row(y0 - len);
      const gr = x.createLinearGradient(0, ry, 0, ry1); gr.addColorStop(0, `rgba(120,52,22,${a})`); gr.addColorStop(0.3, `rgba(105,48,24,${a * 0.6})`); gr.addColorStop(1, 'rgba(90,40,20,0)');
      x.fillStyle = gr; const ww = wd * pxPerM; x.beginPath(); x.moveTo(cx - ww / 2, ry); x.lineTo(cx + ww / 2, ry); x.lineTo(cx + ww * 0.15, ry1); x.lineTo(cx - ww * 0.25, ry1); x.fill();
      rx.fillStyle = `rgba(235,0,0,${a * 0.7})`; rx.fillRect(cx - ww / 2, ry, ww, ry1 - ry); };
    for (let s = 2; s < L - 2; s += 3 + r() * 9) if (r() < 0.75) streak(s / L, D - T - 0.3, (0.8 + r() * 5) * rust * 1.4, 0.25 + r() * 0.5, (0.25 + r() * 0.45) * rust);
    for (let k = 0; k < 40 * rust; k++) { const s = r(); streak(s, -T + D * (0.3 + r() * 0.6), 0.5 + r() * 2.5, 0.1 + r() * 0.2, 0.15 + r() * 0.3); }
    if (paint.anchor !== false) { const s = 1 - 16 / L, yh = D - T - 3.2; // hawse pipe + anchor pocket
      x.fillStyle = '#121212'; x.beginPath(); x.ellipse(col(s), row(yh), 0.9 * pxPerM, 0.9 * pyPerM, 0, 0, Math.PI * 2); x.fill();
      streak(s, yh - 0.8, 7 * rust + 2, 1.6, 0.55); hx.fillStyle = '#404040'; hx.beginPath(); hx.ellipse(col(s), row(yh), 1.2 * pxPerM, 1.2 * pyPerM, 0, 0, Math.PI * 2); hx.fill(); }
    // waterline scum: a soft green-brown line at the actual waterline
    const g2 = x.createLinearGradient(0, row(wl + 0.6), 0, row(wl - 0.3)); g2.addColorStop(0, 'rgba(70,80,50,0)'); g2.addColorStop(0.6, 'rgba(70,80,50,0.35)'); g2.addColorStop(1, 'rgba(60,70,40,0)');
    x.fillStyle = g2; x.fillRect(0, row(wl + 0.6), W, row(wl - 0.3) - row(wl + 0.6));
    if (paint.marks !== false) {
      // draft marks (every 2 m at bow, stern and midships), Plimsoll disc midships
      x.fillStyle = paint.markColor ?? '#e8e6e0'; x.font = `600 ${Math.round(0.34 * pyPerM)}px 'Archivo Narrow', sans-serif`; x.textBaseline = 'middle';
      for (const s of [6 / L, 0.5, 1 - 8 / L]) for (let y = -T + 2; y < D - T - 1; y += 2) { const m = Math.round(y + T); x.textAlign = 'center'; x.fillText(String(m) + 'M', col(s), row(y)); }
      const pc = col(0.5) + (side ? -1 : 1) * 14 * pxPerM, py = row(wl + 1.2); x.strokeStyle = x.fillStyle; x.lineWidth = 0.08 * pxPerM;
      x.beginPath(); x.arc(pc, py, 0.6 * pxPerM, 0, Math.PI * 2); x.stroke(); x.fillRect(pc - 0.8 * pxPerM, py - 0.04 * pyPerM, 1.6 * pxPerM, 0.08 * pyPerM);
      // tug and thruster marks
      if (paint.thruster !== false) { const s = 1 - 22 / L; x.strokeStyle = x.fillStyle; x.lineWidth = 0.15 * pxPerM; x.beginPath(); x.arc(col(s), row(wl + 2.4), 1.0 * pxPerM, 0, Math.PI * 2); x.stroke(); x.font = `600 ${Math.round(0.9 * pyPerM)}px 'Archivo Narrow', sans-serif`; x.fillText('X', col(s), row(wl + 2.4)); }
    }
    // name at the bow (both sides read left to right) and name + port at the stern quarter
    if (paint.name) {
      const nh = (paint.nameH ?? 2.6) * pyPerM; x.font = `700 ${Math.round(nh)}px 'Archivo Narrow', sans-serif`; x.fillStyle = paint.nameColor ?? '#f0eee8'; x.textBaseline = 'middle';
      const yN = row(D - T - (paint.nameY ?? 2.6)); const sN = 1 - (paint.nameAt ?? 30) / L;
      x.save(); x.translate(col(sN), yN); x.scale(pxPerM / pyPerM * 1.0, 1); x.textAlign = 'center'; x.fillText(paint.name, 0, 0); x.restore();
      hx.save(); hx.translate(col(sN), yN); hx.scale(pxPerM / pyPerM, 1); hx.textAlign = 'center'; hx.font = x.font; hx.fillStyle = '#9a9a9a'; hx.fillText(paint.name, 0, 0); hx.restore();
    }
    if (paint.hullNumber) { // warship: big white number with a black drop shadow
      const nh = (paint.numberH ?? 4.5) * pyPerM; x.font = `700 ${Math.round(nh)}px 'Archivo Narrow', sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const s = 1 - (paint.numberAt ?? 20) / L, yN = row(D - T - (paint.numberY ?? 3.5));
      x.save(); x.translate(col(s), yN); x.scale(pxPerM / pyPerM, 1); x.fillStyle = 'rgba(10,10,10,0.9)'; x.fillText(paint.hullNumber, 0.12 * pyPerM, 0.12 * pyPerM); x.fillStyle = '#f2f2f2'; x.fillText(paint.hullNumber, 0, 0); x.restore();
    }
  }
  const map = texOf(c), normalMap = texOf(normalFrom(hc, paint.normal ?? 4), { srgb: false }), roughnessMap = texOf(rc, { srgb: false });
  // roughness lives in the green channel for three.js
  { const d = rc.getContext('2d', { willReadFrequently: true }); const im = d.getImageData(0, 0, W, Hh); for (let i = 0; i < im.data.length; i += 4) { im.data[i + 1] = im.data[i]; } d.putImageData(im, 0, 0); roughnessMap.needsUpdate = true; }
  return { map, normalMap, roughnessMap };
}

// deck canvas: painted steel with walkways, hatch covers, rust and wear
function deckTexture({ color = '#3d5a3c', walk = '#6f7a6a', lines = '#d8d4c8', L = 330, B = 60, seed = 2, rust = 0.5, cl = true, res = 2048 }) {
  const W = res, H = Math.max(128, Math.round(res * B / L * 1.6)), c = canvas(W, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) { const px = r() * W, py = r() * H, rr = 5 + r() * 40; const gr = x.createRadialGradient(px, py, 0, px, py, rr); const k = r();
    gr.addColorStop(0, k < 0.35 * rust ? `rgba(110,50,25,${0.15 + r() * 0.3})` : k < 0.7 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  if (cl) { x.fillStyle = walk; x.fillRect(0, H * 0.47, W, H * 0.06); x.fillStyle = lines; x.fillRect(0, H * 0.465, W, 1); x.fillRect(0, H * 0.535, W, 1); }
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; x.fillRect(r() * W, r() * H, 2 + r() * 30, 1 + r() * 3); }
  return texOf(c, { aniso: 8 });
}

// superstructure walls: white (or grey) paint, window rows per deck, rust weeps under every window
function houseTexture({ color = '#e9e7e1', decks = 7, deckH = 2.8, width = 40, win = '#1b2328', winW = 1.1, winH = 1.1, gap = 1.6, seed = 4, rust = 0.5, bridge = true, res = 1024 }) {
  const W = res, H = Math.round(res * decks * deckH / width), c = canvas(W, Math.max(64, H)), x = c.getContext('2d'), r = rng(seed); const ppm = W / width;
  x.fillStyle = color; x.fillRect(0, 0, W, c.height);
  for (let d = 0; d < decks; d++) {
    const y0 = c.height - (d + 0.55) * deckH * ppm, top = d === decks - 1 && bridge;
    const ww = (top ? 1.6 : winW) * ppm, wh = (top ? 1.5 : winH) * ppm, step = top ? 1.75 * ppm : (winW + gap) * ppm;
    for (let xx = step * 0.6; xx < W - ww; xx += step) {
      if (!top && r() < 0.12) continue;
      x.fillStyle = win; x.fillRect(xx, y0 - wh / 2, ww, wh);
      x.fillStyle = 'rgba(160,190,210,0.18)'; x.fillRect(xx, y0 - wh / 2, ww, wh * 0.35);
      if (r() < rust) { const gr = x.createLinearGradient(0, y0 + wh / 2, 0, y0 + wh / 2 + (0.5 + r() * 1.6) * ppm); gr.addColorStop(0, 'rgba(120,60,30,0.45)'); gr.addColorStop(1, 'rgba(120,60,30,0)'); x.fillStyle = gr; x.fillRect(xx + ww * 0.3, y0 + wh / 2, ww * 0.4, (0.5 + r() * 1.6) * ppm); }
    }
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, c.height - d * deckH * ppm - 2, W, 2);
  }
  return texOf(c);
}

// ============================================================ the Ship object
class Ship {
  constructor(kind, dims, o) {
    this.kind = kind; this.group = new THREE.Group(); this.group.name = 'ship:' + kind;
    this.body = new THREE.Group(); this.group.add(this.body);   // pitch/roll/heave applied here
    this.length = dims.L; this.beam = dims.B; this.draft = dims.T; this.depth = dims.D;
    this.deckH = dims.deckH ?? (dims.D - dims.T); this.wake = o.wake ?? 1; this.shadow = o.shadow ?? 1;
    this.response = o.response ?? 1; this.state = { x: 0, z: 0, heading: 0, speed: 0 };
    this.path = null; this.fixed = null; this.extraUpdate = null; this.spin = []; this.flags = [];
  }
  place(x, z, headingDeg = 0, speed = 0) { this.fixed = { x, z, heading: headingDeg * D2R, speed }; this.path = null; return this; }
  follow(lane, { s0 = 0, speed = 7, dir = 1 } = {}) { this.path = { lane, s0, speed, dir }; this.fixed = null; return this; }
  // analytic pose at time t: lane position, then heave / pitch / roll from the wave field under the hull
  pose(t, sea) {
    let x, z, hd, v;
    if (this.path) { const { lane, s0, speed, dir } = this.path; const s = s0 + dir * speed * t; const p = lane.at(s); x = p.x; z = p.z; hd = p.heading + (dir < 0 ? Math.PI : 0); v = speed; }
    else { const f = this.fixed; v = f.speed; x = f.x + Math.sin(f.heading) * v * t; z = f.z - Math.cos(f.heading) * v * t; hd = f.heading; }
    const st = this.state; st.x = x; st.z = z; st.heading = hd; st.speed = v;
    let heave = 0, pitch = 0, roll = 0;
    if (sea?.water && this.response > 0) {
      const fx = Math.sin(hd), fz = -Math.cos(hd), sx = -fz, sz = fx, L = this.length * 0.42, Bh = this.beam * 0.45, S = sea.spectrum;
      const hb = S.height(x + fx * L, z + fz * L), hs = S.height(x - fx * L, z - fz * L), hp = S.height(x - sx * Bh, z - sz * Bh), hst = S.height(x + sx * Bh, z + sz * Bh);
      const hc = S.height(x, z);
      const k = this.response;
      heave = ((hb + hs + hp + hst) * 0.2 + hc * 0.2) * k;
      pitch = Math.atan2(hb - hs, 2 * L) * k; roll = Math.atan2(hp - hst, 2 * Bh) * k * 0.8;
      // small craft: a slow natural roll and the bow rising when planing
      if (this.length < 40) { roll += Math.sin(t * 1.7 + this.length) * 0.02 * k + Math.sin(t * 0.9) * 0.015 * k; pitch += (this.planing ?? 0) * clamp(v / 15) * 0.07; heave += (this.planing ?? 0) * clamp(v / 15) * 0.25; }
    }
    st.heave = heave; st.pitch = pitch; st.roll = roll;
    return st;
  }
  update(t, sea) {
    const st = this.pose(t, sea);
    this.group.position.set(st.x, 0, st.z); this.group.rotation.set(0, Math.PI / 2 - st.heading, 0);
    this.body.position.y = st.heave; this.body.rotation.set(st.roll, 0, st.pitch, 'XYZ');
    for (const q of this.spin) q.mesh.rotation.y = q.phase + t * q.rate;
    for (const f of this.flags) f.update(t, 6 + st.speed);
    this.extraUpdate?.(t, sea, st);
  }
  // earth curvature relative to the camera (matches the ocean and land shaders); Sea.render calls this
  // after setting the camera, so poses read by set code before rendering are never curved
  curve(cam) { const st = this.state, d2 = (st.x - cam.x) ** 2 + (st.z - cam.z) ** 2; this.group.position.y = -d2 / (2 * 6371000); }
  // world position of a local point (for cameras that follow a part of the ship)
  worldOf(local, out = new THREE.Vector3()) { this.group.updateMatrixWorld(true); return out.set(...local).applyMatrix4(this.body.matrixWorld); }
}

// ============================================================ kinds
const BUILD = {};

// ---- VLCC crude carrier (330 m, 300 000 dwt). o.era '1980s': older house (davit lifeboats, taller block,
// no free-fall boat), o.flag: 'us' | 'iran' | ... (ensign at the stern), o.anchored: chain out, no way on
BUILD.vlcc = (o) => {
  const loaded = o.loaded ?? 1, L = o.L ?? 330, B = o.B ?? 60, D = 29, T = lerp(9.5, 21.5, loaded), old = o.era === '1980s';
  const S = new Ship('vlcc', { L, B, D, T }, { response: 0.5, ...o });
  const hg = hullGeometry({ L, B, D, T, mid: [0.2, 0.74], entry: 2.2, run: 2.6, rake: 5, flare: 0.08, bulb: true, bulbLen: 0.12, transom: 0.72, bilge: 3.5, sheer: 1.2, overhang: 5 });
  const atlas = hullAtlas(o, { L, D, T }, { top: o.hullColor ?? '#1e1f22', bottom: '#7a2a20', boot: '#141516', name: o.name ?? 'ARABIAN DAWN', port: o.port, seed: o.seed ?? 3, rust: o.rust ?? 0.75, waterline: 0, bootH: 2.2 });
  const hullMat = std({ side: THREE.DoubleSide, map: atlas.map, normalMap: atlas.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: atlas.roughnessMap, roughness: 1, metalness: 0.0, envMapIntensity: 1.0 });
  const hull = new THREE.Mesh(hg.hull, hullMat); hull.castShadow = hull.receiveShadow = true; S.body.add(hull);
  const tr = new THREE.Mesh(hg.transom, std({ color: o.hullColor ?? 0x1e1f22, roughness: 0.6, metalness: 0.0 })); S.body.add(tr);
  const deckCol = o.deckColor ?? '#4d5649';
  const deckMat = std({ map: DT.deckTexture({ color: deckCol, L, B, seed: (o.seed ?? 3) + 1, res: o.lite ? 512 : 2048 }), roughness: 0.78, metalness: 0.1 });
  const deck = new THREE.Mesh(hg.deck, deckMat); deck.receiveShadow = true; S.body.add(deck);
  const yd = D - T; const pipeMat = std({ color: o.pipeColor ?? 0x6f746b, roughness: 0.6, metalness: 0.1 }), steel = DT.paint('steel');
  const greenMat = std({ color: new THREE.Color(deckCol).multiplyScalar(0.95), roughness: 0.72, metalness: 0.15 }), red = DT.paint('red'), dark = DT.paint('darkSteel');
  const pipes = [], frames = [], greens = [], reds = [], darks = [], whites = [], yellows = [], rails = [];
  const x0 = -L / 2 + 62, x1 = L / 2 - 30;
  // cargo lines along the centre, fire main + foam line, pipe supports every 9 m, the catwalk on stanchions
  for (let k = 0; k < 6; k++) pipes.push(cyl(0.45, 0.45, x1 - x0, (x0 + x1) / 2, yd + 0.9 + (k % 2) * 0.05, -3.2 + k * 1.3, 10, 'x'));
  for (let k = 0; k < 4; k++) pipes.push(cyl(0.18, 0.18, x1 - x0, (x0 + x1) / 2, yd + 0.7, -9 + k * 0.6 + (k > 1 ? 15 : 0), 8, 'x'));
  reds.push(cyl(0.2, 0.2, x1 - x0, (x0 + x1) / 2, yd + 1.7, 6.2, 8, 'x'));                                         // fire main (red)
  for (let xx = x0; xx < x1; xx += 9) { frames.push(box(0.3, 0.5, 9, xx, yd + 0.4, 0)); frames.push(box(0.2, 2.4, 0.2, xx, yd + 1.2, 5.2), box(0.2, 2.4, 0.2, xx, yd + 1.2, 4.2)); }
  frames.push(box(x1 - x0, 0.12, 1.4, (x0 + x1) / 2, yd + 2.4, 4.7));                                               // catwalk
  rails.push(...DT.railing([[x0, yd + 2.45, 4.0], [x1, yd + 2.45, 4.0]], { step: 3, h: 1.0 }), ...DT.railing([[x0, yd + 2.45, 5.4], [x1, yd + 2.45, 5.4]], { step: 3, h: 1.0 }));
  // manifolds both sides midships, a hose crane each side, drip trays
  for (const sd of [-1, 1]) { const m = DT.manifold(-4, yd, B / 2, sd); pipes.push(...m.pipes); darks.push(...m.valves); reds.push(...m.wheels); greens.push(...m.trays);
    const c = DT.crane(10, yd, sd * (B / 2 - 9), { h: 6.5, boom: 22, elev: 0.5 + (o.seed ?? 3) % 3 * 0.08, slew: sd > 0 ? -0.35 : Math.PI + 0.35 }); whites.push(...c.ped); whites.push(...c.arm); darks.push(...c.hook); }
  // tank hatches, P/V vent risers, fire monitors on the catwalk, deck lights
  for (let k = 0; k < 10; k++) { const xx = x0 + 10 + k * (x1 - x0 - 20) / 9; for (const sd of [-1, 1]) { greens.push(box(2.4, 0.7, 2.4, xx, yd + 0.35, sd * 15), cyl(0.5, 0.5, 0.25, xx + 3, yd + 0.12, sd * 21, 10)); pipes.push(cyl(0.22, 0.22, 5, xx + 1.5, yd + 2.5, sd * 10, 8)); darks.push(cyl(0.45, 0.3, 0.6, xx + 1.5, yd + 5.2, sd * 10, 8)); } }
  for (let xx = x0 + 20; xx < x1; xx += 40) { reds.push(box(1.6, 1.0, 1.6, xx, yd + 3.0, 4.7), cyl(0.15, 0.2, 1.8, xx + 0.6, yd + 3.9, 4.7, 6, 'x')); darks.push(cyl(0.08, 0.08, 6, xx + 4, yd + 3, -B / 2 + 3, 5)); }
  // forecastle: bulwark, windlasses, chain to the hawse pipes, mooring winches, the foremast
  const fx = L / 2 - 24; greens.push(box(22, 2.8, B * 0.5, fx, yd + 1.4, 0));
  const fdk = yd + 2.8;
  for (const sd of [-1, 1]) { darks.push(cyl(1.0, 1.0, 2.2, L / 2 - 20, fdk + 1.0, sd * 4.5, 14, 'z'), box(3, 1.2, 2.6, L / 2 - 22, fdk + 0.6, sd * 4.5)); darks.push(...DT.bitts(L / 2 - 30, fdk, sd * 9));
    darks.push(bar([L / 2 - 20, fdk + 0.2, sd * 4.5], [L / 2 - 12, fdk, sd * 7.5], 0.25, 4)); greens.push(...DT.winch(L / 2 - 33, fdk, sd * 6, sd)); }
  rails.push(...DT.railing([[fx - 11, fdk, -B * 0.25], [fx + 8, fdk, -B * 0.22], [L / 2 - 4, fdk, 0], [fx + 8, fdk, B * 0.22], [fx - 11, fdk, B * 0.25]], { h: 1.1 }));
  pipes.push(cyl(0.35, 0.35, 16, L / 2 - 12, fdk + 8, 0, 8)); whites.push(box(1.2, 0.8, 1.2, L / 2 - 12, fdk + 12, 0));
  // bitts and fairleads along the deck edge, mooring winches midships and aft
  for (let xx = -L / 2 + 60; xx < L / 2 - 40; xx += 26) for (const sd of [-1, 1]) darks.push(...DT.bitts(xx, yd, sd * (B / 2 - 2.2)));
  for (const xx of [-L / 2 + 48, -30, 30]) for (const sd of [-1, 1]) greens.push(...DT.winch(xx, yd, sd * (B / 2 - 7), sd));
  // aft: poop deck, the accommodation, funnel, stern mooring deck
  const hl = old ? 20 : 22, hw = B * (old ? 0.55 : 0.62), decks = old ? 8 : 7, dh = 2.9, ax = -L / 2 + 30;
  greens.push(box(hl + 14, 2.4, B * 0.86, ax - 4, yd + 1.2, 0));
  const A = DT.accommodation(S.body, { lite: o.lite, x: ax, y: yd + 2.4, len: hl, wid: hw, decks, dh, beam: B, seed: (o.seed ?? 3) + 7, lifeboats: old ? 'davits' : 'freefall', sternX: -L / 2 + 6, rust: old ? 0.5 : 0.35 });
  S.spin.push(...A.spin);
  DT.funnel(S.body, { x: ax - hl / 2 - 6.5, y: yd + 2.4 + dh * (decks - 3), h: old ? 12 : 13, len: old ? 7 : 9, wid: old ? 6.5 : 5.5, band: o.bandColor ?? 0x1d4f8a, color: o.funnelColor ?? 0xb7b3ab });
  if (old) whites.push(box(4, 3, 4, ax - hl / 2 - 2, yd + 2.4 + 1.5, 0));
  rails.push(...DT.railing([[-L / 2 + 6, yd + 2.4, -B * 0.36], [-L / 2 + 2, yd + 2.4, 0], [-L / 2 + 6, yd + 2.4, B * 0.36]], { h: 1.1 }));
  for (const sd of [-1, 1]) { darks.push(...DT.bitts(-L / 2 + 10, yd + 2.4, sd * B * 0.3)); greens.push(...DT.winch(-L / 2 + 16, yd + 2.4, sd * 9, sd)); }
  // provision crane by the house
  { const c = DT.crane(ax + hl / 2 + 4, yd, -hw / 2 - 1, { h: 4, boom: 12, elev: 0.75, slew: 0.6, r: 0.5 }); whites.push(...c.ped, ...c.arm); darks.push(...c.hook); }
  meshOf(pipes, pipeMat, S.body); meshOf(frames, steel, S.body); meshOf(greens, greenMat, S.body); meshOf(reds, red, S.body); meshOf(darks, dark, S.body); meshOf(whites, DT.paint('white'), S.body);
  // railings along the deck edge with stanchions
  for (const sd of [-1, 1]) { const pts = []; for (let i = 8; i < hg.deckEdge.length - 3; i += 2) { const [xx, yy, w] = hg.deckEdge[i]; pts.push([xx, yy, sd * w * 0.993]); } rails.push(...DT.railing(pts, { h: 1.05, step: 1.8 })); }
  if (!o.lite) meshOf(rails, steel, S.body, { cast: false });
  if (o.flag) { const f = DT.flag(o.flag, { w: 3.2, h: 2.0 }); f.mesh.position.set(-L / 2 + 1.5, yd + 2.4 + 5, 0); f.mesh.rotation.y = Math.PI; S.body.add(f.mesh); meshOf([cyl(0.08, 0.1, 6, -L / 2 + 1.5, yd + 2.4 + 3, 0, 6)], steel, S.body); S.flags.push(f); }
  if (o.anchored) { meshOf(DT.anchorChain(L / 2 - 14, yd - 3.2, -B * 0.18, { out: 34, s: -1 }), DT.paint('black'), S.body, { cast: false }); }
  S.parts = { hull, deck, house: A.main, wings: A.wh, bridge: A.bridge, A };
  return S;
};

// ---- container ship (366 m, ~14 000 TEU)
BUILD.container = (o) => {
  const L = o.L ?? 366, B = o.B ?? 51, D = 30, T = o.T ?? 14.5;
  const S = new Ship('container', { L, B, D, T }, { response: 0.5, ...o });
  const hg = hullGeometry({ L, B, D, T, mid: [0.28, 0.62], entry: 1.5, run: 2.0, rake: 9, flare: 0.25, bulb: true, bulbLen: 0.14, transom: 0.85, bilge: 2.5, sheer: 2.5, overhang: 9 });
  const atlas = hullAtlas(o, { L, D, T }, { top: o.hullColor ?? '#20324f', bottom: '#8a2c22', boot: '#151718', name: o.name ?? 'GULF MERIDIAN', seed: o.seed ?? 5, rust: o.rust ?? 0.45, bootH: 2 });
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, normalMap: atlas.normalMap, roughnessMap: atlas.roughnessMap, roughness: 1, metalness: 0.25 })); hull.castShadow = hull.receiveShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: 0x20324f })));
  const deck = new THREE.Mesh(hg.deck, std({ map: deckTexture({ color: '#5a5d5c', L, B, seed: 9, cl: false }), roughness: 0.8 })); S.body.add(deck);
  const yd = D - T, r = rng(o.seed ?? 5);
  // containers: 40 ft boxes (12.19 x 2.59 x 2.44 m), bays along the hull, rows across, tiers up; lashing bridges between bays
  const cTex = (() => { const c = canvas(256, 64), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 64); for (let i = 0; i < 256; i += 4) { x.fillStyle = i % 8 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.5)'; x.fillRect(i, 3, 2, 58); }
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 0, 256, 3); x.fillRect(0, 61, 256, 3); x.fillRect(0, 0, 3, 64); x.fillRect(253, 0, 3, 64); return texOf(c, { aniso: 4 }); })();
  const palette = [0x2d5f8f, 0xb33a26, 0x8a8f94, 0xd9d6cf, 0x2f6b3e, 0xc8742a, 0x6b3b2a, 0x1f3f6a, 0x3a8fb0, 0x9e2a2b, 0xd7b043, 0x54585c];
  const bays = [], cg = new THREE.BoxGeometry(12.1, 2.55, 2.4);
  const bridgeX = -L / 2 + L * 0.62, engX = -L / 2 + 40;
  for (let bx = -L / 2 + 46; bx < L / 2 - 32; bx += 13.2) {
    if (Math.abs(bx - bridgeX) < 12 || Math.abs(bx - engX) < 10) continue;
    const s = (bx + L / 2) / L, wHalf = hg.half(s, yd) - 1.2, rows = Math.max(2, Math.floor(wHalf * 2 / 2.5));
    const tiers = Math.round(lerp(5, 9, sstep(0.05, 0.25, s)) * (1 - sstep(0.8, 0.97, s) * 0.45) * (0.85 + r() * 0.2));
    for (let ri = 0; ri < rows; ri++) { const z = -((rows - 1) * 2.5) / 2 + ri * 2.5; const hh = Math.max(1, tiers - (r() < 0.2 ? Math.floor(r() * 3) : 0));
      for (let ti = 0; ti < hh; ti++) bays.push([bx, yd + 1.5 + 1.3 + ti * 2.6, z, palette[Math.floor(r() * palette.length)]]); }
  }
  const im = new THREE.InstancedMesh(cg, std({ map: cTex, roughness: 0.65, metalness: 0.3 }), bays.length); const m4 = new THREE.Matrix4(), col = new THREE.Color();
  bays.forEach(([x, y, z, c], i) => { m4.makeTranslation(x, y, z); im.setMatrixAt(i, m4); col.setHex(c).offsetHSL(0, (r() - 0.5) * 0.1, (r() - 0.5) * 0.08); im.setColorAt(i, col); });
  im.castShadow = im.receiveShadow = true; S.body.add(im);
  const steel = std({ color: 0x9a9c9a, roughness: 0.55, metalness: 0.5 }), white = std({ color: 0xe9e7e0, roughness: 0.55 });
  const lash = []; for (let bx = -L / 2 + 46 + 6.6; bx < L / 2 - 32; bx += 13.2) lash.push(box(0.6, 6, B * 0.8, bx, yd + 3, 0));
  meshOf(lash, steel, S.body);
  // bridge block forward of midships (accommodation builder), engine casing + funnel aft
  const decks = 9, dh = 2.8, hw = B * 0.55;
  const A = DT.accommodation(S.body, { lite: o.lite, x: bridgeX, y: yd + 2, len: 14, wid: hw, decks, dh, beam: B, seed: 21, lifeboats: 'none' }); S.spin.push(...A.spin);
  meshOf([box(16, 14, B * 0.5, engX, yd + 7, 0)], DT.paint('white'), S.body);
  DT.funnel(S.body, { x: engX, y: yd + 14, h: 9, len: 10, wid: 6, color: o.funnelColor ?? 0x1d3f6e, band: 0xb9b5ad });
  S.parts = { hull, bridge: A.bridge };
  return S;
};

// ---- Moss-type LNG carrier (290 m, four spherical tanks)
BUILD.lng = (o) => {
  const L = o.L ?? 290, B = o.B ?? 49, D = 27, T = o.T ?? 11.5;
  const S = new Ship('lng', { L, B, D, T }, { response: 0.5, ...o });
  const hg = hullGeometry({ L, B, D, T, mid: [0.22, 0.66], entry: 1.7, run: 2.2, rake: 7, flare: 0.18, bulb: true, transom: 0.75, bilge: 3, sheer: 2 });
  const atlas = hullAtlas(o, { L, D, T }, { top: o.hullColor ?? '#2c3542', bottom: '#8a2c22', name: o.name ?? 'AL KHOR STAR', seed: o.seed ?? 7, rust: o.rust ?? 0.35 });
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, normalMap: atlas.normalMap, roughnessMap: atlas.roughnessMap, roughness: 1, metalness: 0.25 })); hull.castShadow = hull.receiveShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: 0x2a3c55 })));
  S.body.add(new THREE.Mesh(hg.deck, std({ map: DT.deckTexture({ color: '#5d6a60', L, B, seed: 13 }), roughness: 0.75 })));
  const yd = D - T, tan = std({ color: o.tankColor ?? 0xc9bfa6, roughness: 0.6 }), steel = DT.paint('steel'), dark = DT.paint('darkSteel');
  const R = 18.5, xs = [-L / 2 + 92, -L / 2 + 135, -L / 2 + 178, -L / 2 + 221].slice(0, o.tanks ?? 4);
  const pipes = [], darks = [], whites = [], rails = [], greens = [], reds = [];
  for (const x of xs) {
    // the tank cover: a hemisphere on a skirt that flares into the deck; a dome tower on the top
    const prof = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI / 2; prof.push(new THREE.Vector2(Math.max(0.01, Math.cos(a) * R), Math.sin(a) * R + 7)); }
    prof.unshift(new THREE.Vector2(R + 1.6, 0), new THREE.Vector2(R + 0.4, 2.5), new THREE.Vector2(R, 4.5));
    const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), tan); dome.position.set(x, yd, 0); dome.castShadow = dome.receiveShadow = true; S.body.add(dome);
    darks.push(cyl(2.2, 2.2, 3.2, x, yd + 7 + R + 1.2, 0, 16), box(5, 0.3, 5, x, yd + 7 + R + 2.9, 0));
    rails.push(...DT.railing([[x - 2.5, yd + 7 + R + 3.05, -2.5], [x + 2.5, yd + 7 + R + 3.05, -2.5], [x + 2.5, yd + 7 + R + 3.05, 2.5], [x - 2.5, yd + 7 + R + 3.05, 2.5], [x - 2.5, yd + 7 + R + 3.05, -2.5]], { step: 1.6 }));
    for (const sd of [-1, 1]) pipes.push(cyl(0.35, 0.35, 9, x, yd + 2, sd * (R + 4), 8));
  }
  // the trunk deck / pipe rack running past the domes, walkway on top
  greens.push(box(xs.at(-1) - xs[0] + 50, 3.2, 6, (xs[0] + xs.at(-1)) / 2, yd + 1.6, -R - 5.5));
  for (let k = 0; k < 5; k++) pipes.push(cyl(0.3, 0.3, xs.at(-1) - xs[0] + 50, (xs[0] + xs.at(-1)) / 2, yd + 3.6, -R - 7.5 + k * 1.0, 8, 'x'));
  rails.push(...DT.railing([[xs[0] - 25, yd + 3.2, -R - 2.8], [xs.at(-1) + 25, yd + 3.2, -R - 2.8]], { step: 3 }));
  // manifold midships + hose cranes, forecastle, mooring
  const mx = (xs[1] + xs[2]) / 2;
  for (const sd of [-1, 1]) { const m = DT.manifold(mx, yd, B / 2, sd, 3); pipes.push(...m.pipes); darks.push(...m.valves); reds.push(...m.wheels); greens.push(...m.trays);
    const c = DT.crane(mx + 8, yd, sd * (B / 2 - 6), { h: 5, boom: 16, elev: 0.6, slew: sd > 0 ? -0.5 : Math.PI + 0.5 }); whites.push(...c.ped, ...c.arm); darks.push(...c.hook); }
  greens.push(box(20, 2.8, B * 0.5, L / 2 - 22, yd + 1.4, 0));
  for (const sd of [-1, 1]) { darks.push(cyl(1.0, 1.0, 2.2, L / 2 - 20, yd + 3.8, sd * 4.5, 14, 'z')); darks.push(...DT.bitts(L / 2 - 28, yd + 2.8, sd * 9)); }
  for (let xx = -L / 2 + 50; xx < L / 2 - 40; xx += 30) for (const sd of [-1, 1]) darks.push(...DT.bitts(xx, yd, sd * (B / 2 - 2)));
  pipes.push(cyl(0.35, 0.35, 14, L / 2 - 12, yd + 9.8, 0, 8));
  const decks = 6, dh = 2.9, ax = -L / 2 + 30, hw = B * 0.7;
  greens.push(box(30, 2.0, B * 0.86, ax - 3, yd + 1.0, 0));
  const A = DT.accommodation(S.body, { lite: o.lite, x: ax, y: yd + 2, len: 20, wid: hw, decks, dh, beam: B, seed: 31, lifeboats: 'freefall', sternX: -L / 2 + 6 }); S.spin.push(...A.spin);
  DT.funnel(S.body, { x: ax - 16, y: yd + 2 + dh * 3, h: 12, len: 9, wid: 6, color: o.funnelColor ?? 0x9a1d22, band: 0xb9b5ad });
  meshOf(pipes, steel, S.body); meshOf(darks, dark, S.body); meshOf(whites, DT.paint('white'), S.body); meshOf(greens, std({ color: 0x5f6a62, roughness: 0.75 }), S.body); meshOf(reds, DT.paint('red'), S.body);
  for (const sd of [-1, 1]) { const pts = []; for (let i = 8; i < hg.deckEdge.length - 3; i += 2) { const [xx, yy, w] = hg.deckEdge[i]; pts.push([xx, yy, sd * w * 0.993]); } rails.push(...DT.railing(pts, { h: 1.05, step: 1.8 })); }
  if (!o.lite) meshOf(rails, steel, S.body, { cast: false });
  S.parts = { hull, bridge: A.bridge };
  return S;
};

// ---- Arleigh Burke-class destroyer (155 m), haze grey
BUILD.destroyer = (o) => {
  const L = o.L ?? 155, B = 20, D = 12.5, T = 6.3; // hull draught (sonar dome to 9.4 m)
  const S = new Ship('destroyer', { L, B, D, T, deckH: 8 }, { response: 0.8, ...o });
  const hg = hullGeometry({ L, B, D, T, mid: [0.3, 0.5], entry: 1.25, run: 1.6, rake: 10, flare: 0.5, bulb: false, transom: 0.8, bilge: 3, sheer: 3.5, overhang: 1, stations: 140 });
  const grey = '#7c8285';
  const atlas = hullAtlas(o, { L, D, T }, { top: grey, bottom: '#59221d', boot: '#2a2c2e', hullNumber: o.number ?? '112', numberAt: 28, numberH: 3.6, seed: o.seed ?? 11, rust: o.rust ?? 0.25, marks: false, bootH: 0.6, anchor: true, rough: 0.6 });
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, normalMap: atlas.normalMap, roughnessMap: atlas.roughnessMap, roughness: 1, metalness: 0.2 })); hull.castShadow = hull.receiveShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: grey })));
  S.body.add(new THREE.Mesh(hg.deck, std({ map: deckTexture({ color: '#4d5254', walk: '#5a5f61', L, B, seed: 17, rust: 0.1, cl: false }), roughness: 0.85 })));
  const yd = D - T, hz = std({ color: 0x7f8588, roughness: 0.62, metalness: 0.15 }), dk = std({ color: 0x2b2f31, roughness: 0.5, metalness: 0.3 }), spy = std({ color: 0x6d7376, roughness: 0.4, metalness: 0.4 });
  // forward deckhouse with the raked faces (SPY-1 arrays), pilot house, mast, two stacks, aft deckhouse, hangar, flight deck
  const fwd = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 9.5, 11, 8, 1), hz); fwd.scale.set(1.6, 1, 1); fwd.rotation.y = Math.PI / 8; fwd.position.set(12, yd + 5.5, 0); fwd.castShadow = fwd.receiveShadow = true; S.body.add(fwd);
  meshOf([box(14, 4, 13, 14, yd + 13, 0)], hz, S.body);                                            // pilot house
  meshOf([box(12.5, 1.4, 0.4, 20.5, yd + 14.3, 0)], dk, S.body);                                  // bridge windows (front)
  for (const [az, x] of [[0, 21], [Math.PI, 3]]) for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.CircleGeometry(2.1, 8), spy); p.position.set(x, yd + 8.5, sd * 6.2); p.rotation.y = sd > 0 ? 0.5 + az : Math.PI - 0.5 + az; S.body.add(p); }
  meshOf([cyl(0.6, 1.1, 22, 4, yd + 24, 0, 8), box(6, 0.3, 0.3, 4, yd + 28, 0), box(3, 0.3, 0.3, 4, yd + 32, 0), box(1.6, 1.6, 2.4, 4, yd + 26, 0)], hz, S.body);
  for (const x of [-8, -26]) { const st = new THREE.Mesh(new THREE.BoxGeometry(6, 9, 6.5), hz); st.position.set(x, yd + 9, 0); st.rotation.z = -0.08; st.castShadow = true; S.body.add(st);
    meshOf([box(4.5, 1, 5, x - 0.4, yd + 13.8, 0)], dk, S.body); }
  meshOf([box(30, 7, 15, -16, yd + 3.5, 0), box(16, 6.5, 15, -42, yd + 3.2, 0)], hz, S.body);    // deckhouses + hangar
  meshOf([box(26, 0.15, 15, -L / 2 + 14, yd - 2.2 + 0.05, 0)], std({ color: 0x3a3e40, roughness: 0.9 }), S.body); // flight deck
  // 5-inch gun, VLS cells (forward and aft), CIWS
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 2.4, 10), hz); gun.scale.set(1.4, 1, 1); gun.position.set(L / 2 - 38, yd + 1.2 + 1.5, 0); S.body.add(gun);
  meshOf([cyl(0.15, 0.18, 7, L / 2 - 33, yd + 2.9, 0, 8, 'x')], dk, S.body);
  meshOf([box(9, 0.5, 6, L / 2 - 50, yd + 1.25, 0), box(12, 0.5, 6, -L / 2 + 38, yd + 0.4, 0)], std({ color: 0x5f6467, roughness: 0.7 }), S.body);
  meshOf([cyl(1.1, 1.1, 2.2, 30, yd + 16, 0, 10), cyl(1.1, 1.1, 2.2, -50, yd + 8.5, 0, 10)], std({ color: 0xd9d9d6, roughness: 0.4 }), S.body);
  S.parts = { hull, bridge: [20, yd + 14, 0] };
  return S;
};

// ---- IRGC-style fast-attack boat (12 m), planing
BUILD.fastboat = (o) => {
  const L = o.L ?? 12.5, B = 3.0, D = 1.9, T = 0.55;
  const S = new Ship('fastboat', { L, B, D, T, deckH: 1.5 }, { response: 1.4, wake: 1.6, shadow: 0.6, ...o }); S.planing = 1;
  const hg = hullGeometry({ L, B, D, T, mid: [0.15, 0.45], entry: 1.4, run: 4, rake: 1.8, flare: 0.35, bulb: false, transom: 0.95, bilge: 0.2, sheer: 0.4, overhang: 0, stations: 40, girth: 12 });
  const col = o.color ?? '#6b6f5f';
  const atlas = hullAtlas(o, { L, D, T }, { top: col, bottom: '#3a3c34', boot: '#2a2b26', marks: false, anchor: false, thruster: false, seed: o.seed ?? 21, rust: 0.15, res: 512, bootH: 0.15, bootDepth: 0.1, rough: 0.45 });
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, roughness: 0.5, metalness: 0.1 })); hull.castShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: col })));
  S.body.add(new THREE.Mesh(hg.deck, std({ color: 0x55594d, roughness: 0.7 })));
  const yd = D - T, m = std({ color: 0x5e6256, roughness: 0.55 }), dk = std({ color: 0x1f2124, roughness: 0.4, metalness: 0.5 });
  meshOf([box(2.6, 1.3, 2.2, -0.5, yd + 0.65, 0), box(1.2, 0.08, 2.0, 0.9, yd + 1.25, 0)], m, S.body);    // console + windscreen frame
  meshOf([box(0.3, 0.7, 1.9, 0.95, yd + 1.0, 0)], std({ color: 0x223038, roughness: 0.1, metalness: 0.6 }), S.body);
  meshOf([cyl(0.12, 0.12, 1.0, 3.2, yd + 0.5, 0, 8), cyl(0.05, 0.05, 1.6, 3.9, yd + 1.05, 0, 6, 'x'), box(0.5, 0.35, 0.3, 3.3, yd + 1.05, 0)], dk, S.body); // bow machine gun
  meshOf([box(0.9, 0.9, 0.7, -L / 2 + 0.4, yd + 0.1, -0.6), box(0.9, 0.9, 0.7, -L / 2 + 0.4, yd + 0.1, 0.6)], dk, S.body);   // outboards
  // crew: three dark figures (simple capsules) at the console and the gun
  const crewM = std({ color: 0x2c2d2a, roughness: 0.9 });
  for (const [x, z] of [[-1.6, 0.4], [-1.6, -0.5], [2.6, 0]]) { const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.0, 4, 8), crewM); c.position.set(x, yd + 0.8, z); c.castShadow = true; S.body.add(c); }
  // flag: red-white-green
  S.parts = { hull, bridge: [-1.6, yd + 1.6, 0] };
  return S;
};

// ---- dhow (jalibut / sambuk, ~22 m), wooden, motorised
BUILD.dhow = (o) => {
  const L = o.L ?? 22, B = 6.2, D = 3.6, T = 1.8;
  const S = new Ship('dhow', { L, B, D, T, deckH: 1.8 }, { response: 1.1, wake: 0.6, ...o });
  const hg = hullGeometry({ L, B, D, T, mid: [0.35, 0.45], entry: 1.3, run: 1.5, rake: 5.5, flare: 0.3, bulb: false, transom: 0.7, bilge: 1.2, sheer: 1.6, overhang: 2.5, stations: 50, girth: 14 });
  const wood = o.color ?? '#9b7a52';
  const atlas = hullAtlas(o, { L, D, T }, { top: wood, bottom: '#e9e4d8', boot: '#3b2c1e', marks: false, anchor: false, thruster: false, seed: o.seed ?? 31, rust: 0.05, res: 1024, bootH: 0.25, bootDepth: 0.2, rough: 0.8 });
  // planks: dark seams every 0.2 m
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, normalMap: atlas.normalMap, roughness: 0.85, metalness: 0 })); hull.castShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: wood, roughness: 0.85 })));
  S.body.add(new THREE.Mesh(hg.deck, std({ color: 0x7d6446, roughness: 0.9 })));
  const yd = D - T, w = std({ color: 0x6e5236, roughness: 0.85 }), white = std({ color: 0xe8e2d4, roughness: 0.8 }), r = rng(o.seed ?? 31);
  meshOf([box(5, 2.2, B * 0.9, -L / 2 + 3.5, yd + 1.6, 0), box(5.6, 0.2, B, -L / 2 + 3.5, yd + 2.8, 0)], white, S.body);        // stern cabin
  meshOf([box(0.25, 9, 0.25, 1.5, yd + 4.5, 0), box(0.18, 0.18, 10, 1.5, yd + 7, 0)], w, S.body);                                // mast + yard
  const cargo = []; for (let i = 0; i < 26; i++) cargo.push(box(0.8 + r(), 0.6 + r() * 0.4, 0.8 + r() * 0.6, -3 + r() * 9, yd + 0.4 + Math.floor(i / 9) * 0.6, (r() - 0.5) * 3.5));
  meshOf(cargo, std({ color: 0xb4a07e, roughness: 0.95 }), S.body);
  const tyres = []; for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) { const g = new THREE.TorusGeometry(0.35, 0.12, 6, 10); g.translate(-6 + i * 2.2, yd - 0.4, sd * (B / 2 + 0.05)); tyres.push(g); }
  meshOf(tyres, std({ color: 0x151515, roughness: 0.8 }), S.body);
  S.parts = { hull, bridge: [-L / 2 + 5, yd + 3.4, 0] };
  return S;
};

export const KINDS = Object.keys(BUILD);
// other modules (navy.js, props.js) add kinds through this; KINDS is refreshed
export function defineKind(name, fn) { BUILD[name] = fn; if (!KINDS.includes(name)) KINDS.push(name); }
export { Ship, hullAtlas, std, meshOf };
export function ship(kind, o = {}) { const b = BUILD[kind]; if (!b) throw new Error('sea: unknown ship kind ' + kind + ' (' + KINDS.join(', ') + ')'); const S = b(o);
  S.group.traverse(m => { if (!m.isMesh || !m.material) return; const list = Array.isArray(m.material) ? m.material : [m.material];
    for (const mt of list) { if (!Array.isArray(m.material)) mt.side = THREE.DoubleSide; if (o.weather !== false) DT.weather(mt, mt.userData.grime ?? (mt.map ? 0.55 : 1)); } }); return S; }

// ============================================================ lanes
// A sea lane through [x, z] points (metres, local frame): natural spline resampled by arc length, so
// ships move at constant speed with C1 heading. lane.at(s) -> { x, z, heading (rad, compass) }
export function lane(points, { samples = 2000 } = {}) {
  const n = points.length; const k = [0]; for (let i = 1; i < n; i++) k.push(k[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const Lk = k[n - 1];
  // Catmull-Rom (centripetal-ish by chord) for shape, then arc-length table
  const cr = (u) => { const t = u * Lk; let i = 0; while (i < n - 2 && t > k[i + 1]) i++; const h = k[i + 1] - k[i], f = (t - k[i]) / h;
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(n - 1, i + 2)];
    const m1 = [(p2[0] - p0[0]) * 0.5, (p2[1] - p0[1]) * 0.5], m2 = [(p3[0] - p1[0]) * 0.5, (p3[1] - p1[1]) * 0.5];
    const h00 = 2 * f ** 3 - 3 * f ** 2 + 1, h10 = f ** 3 - 2 * f ** 2 + f, h01 = -2 * f ** 3 + 3 * f ** 2, h11 = f ** 3 - f ** 2;
    return [h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0], h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1]]; };
  const pts = [], arc = [0]; for (let i = 0; i <= samples; i++) pts.push(cr(i / samples));
  for (let i = 1; i <= samples; i++) arc.push(arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = arc[samples];
  const at = (s) => {
    const ext = s < 0 ? s : s > total ? s - total : 0; s = clamp(s, 0, total);
    let lo = 0, hi = samples; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arc[m] <= s) lo = m; else hi = m; }
    const f = (s - arc[lo]) / Math.max(1e-9, arc[hi] - arc[lo]);
    const x = lerp(pts[lo][0], pts[hi][0], f), z = lerp(pts[lo][1], pts[hi][1], f);
    const a = Math.max(0, lo - 3), b = Math.min(samples, hi + 3);
    const dx = pts[b][0] - pts[a][0], dz = pts[b][1] - pts[a][1], heading = Math.atan2(dx, -dz), l = Math.hypot(dx, dz) || 1;
    return { x: x + dx / l * ext, z: z + dz / l * ext, heading };
  };
  // arc length of the lane point nearest to (x, z)
  const nearest = (x, z) => { let bi = 0, bd = Infinity; for (let i = 0; i <= samples; i++) { const d = (pts[i][0] - x) ** 2 + (pts[i][1] - z) ** 2; if (d < bd) { bd = d; bi = i; } } return arc[bi]; };
  return { at, nearest, length: total, points };
}
