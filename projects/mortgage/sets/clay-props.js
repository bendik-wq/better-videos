// MORTGAGE clay props: the toy pieces every episode-6 set is built from (not a set library: imported by clay-world.js,
// clay-money.js and oner.js). Built on the Panama kit (/projects/panama/sets/clay-kit.js: light, maths, mat, instanced).
//
//   colours    C (white clay, paper, sage lawns, warm wood, slate roof, pastel accents; red only via C.red)
//   text       canvasTex(w, h, draw) | textPlane(text, o) (a lit plane with canvas type; .setText(t)) | stampDraw
//   geometry   rbox(w, h, d, r) (rounded clay box, base at y = 0) | bake([{ geo, color }]) (merged, vertex colours)
//   house      houseParts(o) -> { body, roof } baked geos | house(o) -> Group (hero detail, .eave anchor)
//   money      envelopeGeo(s) | iouMats() | coinGeo | billGeo
//   auction    auctionBlock(o) | gavel() | priceTag(o) (+ .setText, .string) | wallClock(o) (.set(h, m, s)) | ballotBox(o)
//   street     trees(items) (lollipop: trunk + crown) | carGeo() | padlock() | saleSign() | building(kind, o)
//   machines   conveyor(o) | bundler(o)
// Everything is deterministic; animation lives in the sets (pure functions of t).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as CK from '/projects/panama/sets/clay-kit.js';

const { mat, rng, lerp } = CK;
export const C = {
  clay: '#f4f4f1', clay2: '#ecebe7', clay3: '#e2e0da', paper: '#f3efe6', ground: '#ece7dd', plinth: '#ece6da',
  lawn: '#bcd39a', lawn2: '#b1cb8d', lawn3: '#c7dba9', hedge: '#9cc07f', road: '#d2d3cf', walk: '#ebe8e1', kerb: '#f2f0ea',
  wood: '#c98f58', woodDark: '#9c6638', woodLight: '#e0b27d', woodTop: '#d9a26a',
  roof: '#56637a', roofs: ['#e59a7a', '#d98b6a', '#b9a9ef', '#9fc4dd', '#e8c66a', '#a9c79a', '#f0b5a0', '#8fb0cf'],
  walls: ['#f6f4ef', '#f4efe6', '#f7f5f1', '#efece5', '#f5f1ea'],
  door: '#8fb0c9', door2: '#a9c79a', window: '#cfdde6', frame: '#fbfaf7',
  glass: '#d9eef4', ink: '#0f1e33', inkSoft: '#46536a', slate: '#7d8a99', steel: '#b8c0c8', belt: '#8a96a3',
  red: '#e0241b', coral: '#ff8a6a', lavender: '#b9a9ef', yellow: '#ffd23f', gold: '#e8bf4f', goldDark: '#c99a2e',
  turq: '#4fbcb8', turq2: '#7fd0c8', sky: '#9cc7ea', sage: '#a7c98d', grey: '#c9ccd0', greyDark: '#9aa1a9',
};
export const FONT = CK.FONT;

// ---------------------------------------------------------------- canvas type
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  tex.canvas = c; tex.g = g;
  tex.draw = (fn = draw) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); fn(g, w, h); tex.needsUpdate = true; return tex; };
  tex.draw(); return tex;
}
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// fit a one-line string into (w, h) at `size` of the height, condensed font
export function fitText(g, text, { x, y, w, h, size = 0.72, weight = 700, font = FONT.ui, color = C.ink, align = 'center', spacing = 0 }) {
  let px = h * size; g.font = `${weight} ${px}px ${font}`;
  const tw = g.measureText(text).width + spacing * (String(text).length - 1);
  if (tw > w) { px *= w / tw; g.font = `${weight} ${px}px ${font}`; }
  g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = align;
  if ('letterSpacing' in g) g.letterSpacing = `${spacing * px / (h * size)}px`;
  const ax = align === 'center' ? x + w / 2 : align === 'left' ? x : x + w;
  g.fillText(text, ax, y + h / 2 + px * 0.04);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
}
// a lit plane carrying a line of type. o: w, h (world), fg, bg (null = transparent), radius (0..0.5 of h), border,
// size, weight, font, align, sub (a second smaller line), basic (unlit), res (px per world unit of height)
export function textPlane(text, o = {}) {
  const { w = 2, h = 0.6, res = 256 } = o, ch = Math.round(Math.min(512, res)), cw = Math.round(ch * w / h);
  const draw = (t) => (g, W, Hh) => {
    if (o.bg) { g.fillStyle = o.bg; roundRect(g, 0, 0, W, Hh, (o.radius ?? 0) * Hh); g.fill(); }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = Hh * 0.05; roundRect(g, Hh * 0.05, Hh * 0.05, W - Hh * 0.1, Hh - Hh * 0.1, Math.max(0, (o.radius ?? 0) * Hh - Hh * 0.05)); g.stroke(); }
    const pad = o.pad ?? 0.12;
    if (o.sub) {
      fitText(g, t, { x: W * pad * 0.5, y: Hh * 0.04, w: W * (1 - pad), h: Hh * 0.62, size: o.size ?? 0.8, weight: o.weight ?? 700, font: o.font ?? FONT.ui, color: o.fg ?? C.ink, align: o.align ?? 'center' });
      fitText(g, o.sub, { x: W * pad * 0.5, y: Hh * 0.6, w: W * (1 - pad), h: Hh * 0.32, size: 0.8, weight: 500, font: FONT.mono, color: o.subColor ?? o.fg ?? C.inkSoft, align: o.align ?? 'center', spacing: 2 });
    } else fitText(g, t, { x: W * pad * 0.5, y: 0, w: W * (1 - pad), h: Hh, size: o.size ?? 0.72, weight: o.weight ?? 700, font: o.font ?? FONT.ui, color: o.fg ?? C.ink, align: o.align ?? 'center', spacing: o.spacing ?? 0 });
  };
  const tex = canvasTex(cw, ch, draw(text));
  const m = o.basic ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: true })
    : new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.82, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.receiveShadow = !o.basic;
  let cur = text; mesh.setText = (t) => { t = String(t); if (t !== cur) { cur = t; tex.draw(draw(t)); } return mesh; };
  mesh.tex = tex; return mesh;
}

// ---------------------------------------------------------------- geometry helpers
// rounded clay box, base at y = 0 (r: corner radius)
export function rbox(w, h, d, r = 0.08, seg = 2) { return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)).translate(0, h / 2, 0); }
const _col = new THREE.Color();
// merge [{ geo, color }] into one non-indexed geometry with a colour attribute (for instancing and fewer draw calls)
export function bake(list) {
  const out = list.filter(Boolean).map(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    _col.set(color ?? '#ffffff'); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _col.r; a[i * 3 + 1] = _col.g; a[i * 3 + 2] = _col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  });
  return mergeGeometries(out);
}
export const vmat = (rough = 0.86) => mat('#ffffff', rough, { vertexColors: true });
export function mesh(geo, material, { cast = true, receive = true } = {}) { const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = receive; return m; }
const prism = (w, R, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, R); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2); };

// ---------------------------------------------------------------- houses
// A gable house: rounded body, white gable ends, two roof slabs, door, windows, chimney, front step.
// The front faces +z. o: w (x), d (z), h (eave), R (roof rise), over (eave overhang), storeys (1 | 2), door/window colours
export function houseParts(o = {}) {
  const { w = 10, d = 8, h = 4.6, R = 3.4, over = 0.55, t = 0.38, chimney = true, storeys = h > 6 ? 2 : 1, garage = false } = o;
  const wallC = o.wall ?? '#ffffff', doorC = o.door ?? C.door, winC = o.window ?? C.window, frameC = o.frame ?? C.frame;
  const body = [], roof = [], lite = !!o.lite;
  const rb = lite ? (W, Hh, D) => new THREE.BoxGeometry(W, Hh, D).translate(0, Hh / 2, 0) : rbox;
  body.push({ geo: rbox(w, h, d, 0.14, lite ? 1 : 2), color: wallC });
  body.push({ geo: prism(w - 0.04, R - 0.02, d - 0.04).translate(0, h, 0), color: wallC });
  // roof slabs
  const hw = w / 2, a = Math.atan2(R, hw), L = Math.hypot(hw, R) + over, n = [Math.sin(a), Math.cos(a)];
  for (const sd of [-1, 1]) {
    const g = new RoundedBoxGeometry(L, t, d + over * 2, lite ? 1 : 2, t * 0.45);
    g.rotateZ(-sd * a);
    const cx = sd * (Math.cos(a) * (L / 2 - 0.12)) + sd * n[0] * t * 0.5, cy = h + R - Math.sin(a) * (L / 2 - 0.12) + n[1] * t * 0.5;
    roof.push({ geo: g.translate(cx, cy, 0), color: '#ffffff' });
  }
  // ridge cap
  roof.push({ geo: new THREE.CylinderGeometry(t * 0.55, t * 0.55, d + over * 2 + 0.05, lite ? 6 : 10).rotateX(Math.PI / 2).translate(0, h + R + t * 0.55, 0), color: '#ffffff' });
  if (chimney) body.push({ geo: rb(0.95, R * 0.75 + 1.2, 0.95, 0.08).translate(hw * 0.45, h + R * 0.35, -d * 0.18), color: wallC });
  // door, step, windows on the front (+z)
  const zf = d / 2, dx = garage ? -w * 0.22 : -w * 0.12;
  body.push({ geo: rb(1.25, 2.25, 0.16, 0.05).translate(dx, 0.25, zf), color: doorC });
  body.push({ geo: rb(1.7, 2.45, 0.1, 0.04).translate(dx, 0.2, zf - 0.02), color: frameC });
  body.push({ geo: rb(2.2, 0.25, 0.9, 0.06).translate(dx, 0, zf + 0.4), color: '#e9e6df' });
  const win = (x, y, z = zf, ww = 1.35, hh = 1.25) => { body.push({ geo: rb(ww + 0.3, hh + 0.3, 0.1, 0.04).translate(x, y - 0.15, z - 0.02), color: frameC }, { geo: rb(ww, hh, 0.14, 0.03).translate(x, y, z), color: winC }); };
  const xs = garage ? [w * 0.18] : [dx + 2.4, dx - 2.2].filter(x => Math.abs(x) < hw - 1);
  if (garage) body.push({ geo: rb(w * 0.36, 2.6, 0.14, 0.05).translate(w * 0.2, 0, zf), color: '#f9f8f4' }, { geo: rb(w * 0.36 - 0.4, 0.06, 0.18, 0.02).translate(w * 0.2, 0.9, zf), color: '#dcd9d2' }, { geo: rb(w * 0.36 - 0.4, 0.06, 0.18, 0.02).translate(w * 0.2, 1.7, zf), color: '#dcd9d2' });
  else for (const x of xs) win(x, 1.25);
  if (storeys > 1) for (const x of [-w * 0.27, w * 0.27]) win(x, h - 2.3);
  // side windows (+x / -x)
  if (!lite) for (const sd of [-1, 1]) { const g1 = rb(0.14, 1.2, 1.3, 0.03).translate(sd * hw, 1.3, 0), g2 = rb(0.1, 1.5, 1.6, 0.03).translate(sd * (hw - 0.02), 1.15, 0); body.push({ geo: g2, color: frameC }, { geo: g1, color: winC }); }
  return { body: bake(body), roof: bake(roof), w, d, h, R, over };
}
// a single detailed house (hero). Returns Group with .eave (local Vector3: the front-right eave corner) and .ridge.
export function house(o = {}) {
  const p = houseParts(o), g = new THREE.Group();
  g.add(mesh(p.body, vmat(0.86)));
  const rm = mesh(p.roof, mat(o.roof ?? C.roof, 0.8, { vertexColors: true })); g.add(rm);
  g.eave = new THREE.Vector3(p.w / 2 + p.over * 0.6, p.h - 0.15, p.d / 2 + p.over * 0.6);
  g.ridge = new THREE.Vector3(0, p.h + p.R + 0.5, 0); g.dims = p;
  return g;
}

// ---------------------------------------------------------------- vegetation: lollipop trees (trunk + crown), one call
export function trees(items, { seed = 3, colors = ['#9cc47f', '#8fbb76', '#a9cc8c', '#b5d39a', '#86b46d'], trunk = '#b48a64', low = false } = {}) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(CK.instanced(new THREE.CylinderGeometry(0.16, 0.22, 1, 6).translate(0, 0.5, 0), mat(trunk, 0.9), items.map(t => ({ x: t.x, y: t.y, z: t.z, sx: t.s, sy: t.s * 0.9, sz: t.s })), { cast: !low }));
  const crown = low ? new THREE.IcosahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, 1);
  g.add(CK.instanced(crown, mat('#ffffff', 0.95), items.map(t => ({ x: t.x, y: t.y + t.s * 1.55, z: t.z, sx: t.s * 0.95, sy: t.s * (t.tall ? 1.35 : 1.0), sz: t.s * 0.95, ry: r() * 6, c: t.c ?? colors[Math.floor(r() * colors.length)] })), { cast: !low }));
  return g;
}
export function bushes(items, { seed = 5, colors = ['#9cc07f', '#a9c98e', '#93ba78'] } = {}) {
  const r = rng(seed);
  return CK.instanced(new THREE.IcosahedronGeometry(1, 1), mat('#ffffff', 0.95), items.map(b => ({ x: b.x, y: b.y + b.s * 0.45, z: b.z, sx: b.s, sy: b.s * 0.7, sz: b.s, ry: r() * 6, c: colors[Math.floor(r() * colors.length)] })));
}

// ---------------------------------------------------------------- money
// a sealed envelope (back, flap up), size 1 x 0.64 at s = 1, base at y = 0
export function envelopeGeo(s = 1, { seal = C.lavender } = {}) {
  const tri = new THREE.Shape(); tri.moveTo(-0.47, -0.29); tri.lineTo(0.47, -0.29); tri.lineTo(0, 0.06); tri.closePath();
  const flap = new THREE.ExtrudeGeometry(tri, { depth: 0.012, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.066, 0);
  const parts = [{ geo: rbox(1, 0.055, 0.64, 0.025, 1), color: '#ffffff' }, { geo: flap, color: '#e9e6df' }];
  if (seal) parts.push({ geo: new THREE.CylinderGeometry(0.075, 0.075, 0.02, 14).translate(0, 0.072, -0.06), color: seal });
  return bake(parts).scale(s, s, s);
}
// six materials for a box: IOU type on +z and +y, plain clay elsewhere
export function iouMats({ color = C.clay, ink = C.inkSoft, text = 'IOU', tint = null } = {}) {
  const tex = canvasTex(256, 160, (g, W, H) => { g.fillStyle = tint ?? color; g.fillRect(0, 0, W, H); g.strokeStyle = ink; g.globalAlpha = 0.35; g.lineWidth = 6; roundRect(g, 14, 14, W - 28, H - 28, 10); g.stroke(); g.globalAlpha = 0.85; fitText(g, text, { x: 0, y: 8, w: W, h: H - 16, size: 0.62, color: ink }); });
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), plain = mat(tint ?? color, 0.86);
  return [plain, plain, face, plain, face, plain];
}
export const coinGeo = () => bake([{ geo: new THREE.CylinderGeometry(0.5, 0.5, 0.12, 28), color: C.gold }, { geo: new THREE.CylinderGeometry(0.38, 0.38, 0.135, 28), color: '#efcf6c' }]);

// ---------------------------------------------------------------- auction pieces
// warm-wood auction block (plinth with plank lines, a top board, front steps), base at y = 0
export function auctionBlock({ w = 16, d = 13, h = 2.4, steps = true, lot = 'LOT 1' } = {}) {
  const g = new THREE.Group(), parts = [];
  parts.push({ geo: rbox(w, h - 0.35, d, 0.18), color: C.wood });
  parts.push({ geo: rbox(w + 0.5, 0.38, d + 0.5, 0.14).translate(0, h - 0.38, 0), color: C.woodTop });
  const n = 6; for (let i = 1; i < n; i++) { const y = (h - 0.35) * i / n; parts.push({ geo: rbox(w + 0.06, 0.06, d + 0.06, 0.02, 1).translate(0, y, 0), color: C.woodDark }); }
  parts.push({ geo: rbox(w + 0.3, 0.3, d + 0.3, 0.1).translate(0, 0, 0), color: C.woodDark });
  if (steps) for (let k = 0; k < 2; k++) parts.push({ geo: rbox(4.2, (h - 0.1) * (k + 1) / 3, 1.1, 0.1).translate(-w * 0.28, 0, d / 2 + 0.55 + (1 - k) * 1.05), color: k ? C.woodLight : C.wood });
  g.add(mesh(bake(parts), vmat(0.78)));
  if (lot) { const p = textPlane(lot, { w: 3.4, h: 1.0, bg: '#f7f1e6', fg: C.ink, radius: 0.12, size: 0.6, spacing: 4 }); p.position.set(w * 0.22, (h - 0.35) * 0.5, d / 2 + 0.035); g.add(p); }
  g.top = h; g.dims = { w, d, h }; return g;
}
// the gavel: head (x axis) on a handle; group origin = the grip end, the head at +y. .pivot rotates about z to strike.
export function gavel({ s = 1 } = {}) {
  const g = new THREE.Group(), pivot = new THREE.Group(); g.add(pivot);
  const parts = [
    { geo: new THREE.CylinderGeometry(0.22, 0.26, 5.2, 16).translate(0, 2.6, 0), color: C.woodDark },
    { geo: new THREE.CylinderGeometry(0.85, 0.85, 3.4, 28).rotateZ(Math.PI / 2).translate(0, 5.4, 0), color: C.wood },
    { geo: new THREE.CylinderGeometry(0.9, 0.9, 0.32, 28).rotateZ(Math.PI / 2).translate(1.1, 5.4, 0), color: C.woodDark },
    { geo: new THREE.CylinderGeometry(0.9, 0.9, 0.32, 28).rotateZ(Math.PI / 2).translate(-1.1, 5.4, 0), color: C.woodDark },
    { geo: new THREE.SphereGeometry(0.34, 16, 10).translate(0, 0, 0), color: C.woodDark },
  ];
  pivot.add(mesh(bake(parts), vmat(0.6))); g.scale.setScalar(s); g.pivot = pivot; return g;
}
export function soundBlock({ r = 1.3, h = 0.5 } = {}) { return mesh(bake([{ geo: new THREE.CylinderGeometry(r, r * 1.04, h, 32).translate(0, h / 2, 0), color: C.woodDark }, { geo: new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.04, 32).translate(0, h + 0.01, 0), color: C.wood }]), vmat(0.6)); }
// the red price tag: an upright luggage tag hanging from its eyelet (the origin), body below (-y), white type on both
// faces (+z / -z). .setText(t), .hole (local eyelet point), .dims. o: w, h, text, sub (small second line), color, ink
export function priceTag({ w = 3.6, h = 2.5, text = '5.3%', color = C.red, ink = '#ffffff', depth = 0.1, sub = null } = {}) {
  const s = new THREE.Shape(), top = 0.32, sh = 0.62, r = 0.2;
  s.moveTo(-w * 0.2, top); s.lineTo(w * 0.2, top); s.lineTo(w / 2, top - sh); s.lineTo(w / 2, -h + r); s.quadraticCurveTo(w / 2, -h, w / 2 - r, -h);
  s.lineTo(-w / 2 + r, -h); s.quadraticCurveTo(-w / 2, -h, -w / 2, -h + r); s.lineTo(-w / 2, top - sh); s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.13, 0, Math.PI * 2, true); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 2, curveSegments: 16 }).translate(0, 0, -depth / 2);
  const g = new THREE.Group(), body = mesh(geo, mat(color, 0.5)); g.add(body);
  const th = h - sh + top - 0.2, ty = top - sh - th / 2 - 0.05;
  const mk = () => textPlane(text, { w: w * 0.9, h: th * 0.94, fg: ink, size: sub ? 0.9 : 0.78, sub, subColor: 'rgba(255,255,255,.88)', res: 360 });
  const f = mk(); f.position.set(0, ty, depth / 2 + 0.04); g.add(f);
  const b = mk(); b.rotation.y = Math.PI; b.position.set(0, ty, -depth / 2 - 0.04); g.add(b);
  const ring = mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 20), mat('#f1ede4', 0.5)); g.add(ring);
  g.hole = new THREE.Vector3(0, 0, 0);
  g.setText = (t) => { f.setText(t); b.setText(t); return g; };
  g.dims = { w, h }; g.body = body;
  return g;
}
// a string between two world points (a thin cylinder): .span(a, b)
export function string({ r = 0.035, color = '#f3eee4' } = {}) {
  const m = mesh(new THREE.CylinderGeometry(r, r, 1, 6).translate(0, 0.5, 0), mat(color, 0.7), { cast: true, receive: false });
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  m.span = (a, b) => { d.subVectors(b, a); const L = d.length(); m.position.copy(a); m.scale.set(1, Math.max(1e-3, L), 1); if (L > 1e-6) m.quaternion.setFromUnitVectors(up, d.normalize()); };
  return m;
}
// a wall clock facing +z, centre at the origin. .set(h, m, s) in clock units (h 0..12, m 0..60, s 0..60)
export function wallClock({ r = 1.6, rim = C.clay, face = '#fbfaf6', ink = C.ink } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.3, 64).rotateX(Math.PI / 2).translate(0, 0, 0.05), mat(rim, 0.6)));
  g.add(mesh(new THREE.TorusGeometry(r * 1.06, r * 0.07, 12, 64).translate(0, 0, 0.22), mat('#e9e7e1', 0.5)));
  const tex = canvasTex(1024, 1024, (x, W) => {
    const R = W / 2; x.fillStyle = face; x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = R * (big ? 0.84 : 0.88), r1 = R * 0.93;
      x.strokeStyle = ink; x.lineWidth = big ? 14 : 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke(); }
    x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${R * 0.2}px ${FONT.ui}`;
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; x.fillText(String(i), R + Math.sin(a) * R * 0.68, R - Math.cos(a) * R * 0.68 + R * 0.01); }
    x.font = `500 ${R * 0.065}px ${FONT.mono}`; x.fillStyle = C.inkSoft; x.fillText('EASTERN TIME', R, R + R * 0.36);
  });
  const fm = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })); fm.position.z = 0.21; fm.receiveShadow = true; g.add(fm);
  const hand = (len, wid, z, color) => { const p = new THREE.Group(); p.position.z = z; const m = mesh(new RoundedBoxGeometry(wid, len + wid, 0.06, 2, wid * 0.45).translate(0, len / 2 - wid * 0.6, 0), mat(color, 0.5)); p.add(m); g.add(p); return p; };
  const hh = hand(r * 0.5, r * 0.075, 0.27, ink), mh = hand(r * 0.78, r * 0.05, 0.34, ink), sh = hand(r * 0.86, r * 0.018, 0.4, C.turq);
  const cap = mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.06, 0.12, 20).rotateX(Math.PI / 2).translate(0, 0, 0.42), mat(C.turq, 0.4)); g.add(cap);
  g.set = (h, m, s) => { hh.rotation.z = -(h % 12) / 12 * Math.PI * 2; mh.rotation.z = -(m / 60) * Math.PI * 2; sh.rotation.z = -(s / 60) * Math.PI * 2; };
  g.set(12, 59, 0); return g;
}
// a glass ballot box (the auction hopper) on a clay pedestal with a printer slot. Origin at the pedestal's base.
// o: w, h (glass), d, ped (pedestal height). Returns Group with .inside {x0,x1,y0,z0,z1}, .slot (world-local top-centre),
// .seal(k) (slides the lid over the slot), .printer (local slot point on the pedestal front)
export function ballotBox({ w = 2.6, h = 1.9, d = 1.7, ped = 1.15, frame = C.clay } = {}) {
  const g = new THREE.Group(), fr = 0.09, parts = [];
  parts.push({ geo: rbox(w + 0.5, ped, d + 0.5, 0.16), color: '#ffffff' });
  parts.push({ geo: rbox(w + 0.2, 0.12, d + 0.2, 0.04).translate(0, ped, 0), color: '#e9e7e1' });
  const y0 = ped + 0.12;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push({ geo: rbox(fr, h, fr, 0.03).translate(sx * (w / 2), y0, sz * (d / 2)), color: '#ffffff' });
  for (const y of [y0, y0 + h]) { for (const sz of [-1, 1]) parts.push({ geo: rbox(w + fr, fr, fr, 0.03).translate(0, y - fr / 2, sz * d / 2), color: '#ffffff' }); for (const sx of [-1, 1]) parts.push({ geo: rbox(fr, fr, d + fr, 0.03).translate(sx * w / 2, y - fr / 2, 0), color: '#ffffff' }); }
  // lid with a slot along x
  const lidY = y0 + h, slotW = 1.25, slotD = 0.22;
  parts.push({ geo: rbox(w + 0.12, 0.12, (d - slotD) / 2 + 0.06, 0.04).translate(0, lidY, -(d / 2 + slotD / 2) / 2 - 0.03), color: '#ffffff' });
  parts.push({ geo: rbox(w + 0.12, 0.12, (d - slotD) / 2 + 0.06, 0.04).translate(0, lidY, (d / 2 + slotD / 2) / 2 + 0.03), color: '#ffffff' });
  for (const sx of [-1, 1]) parts.push({ geo: rbox((w - slotW) / 2, 0.12, slotD + 0.02, 0.03).translate(sx * (slotW / 2 + (w - slotW) / 4), lidY, 0), color: '#ffffff' });
  // printer slot on the pedestal front
  parts.push({ geo: rbox(1.0, 0.16, 0.06, 0.03).translate(0, ped * 0.62, (d + 0.5) / 2), color: '#3d4a5c' });
  parts.push({ geo: rbox(1.3, 0.42, 0.04, 0.06).translate(0, ped * 0.62 - 0.13, (d + 0.5) / 2 - 0.01), color: '#e6e4de' });
  g.add(mesh(bake(parts), vmat(0.7)));
  const glassM = new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.22, envMap: CK.skyEnv(), envMapIntensity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h - 0.02, d - 0.02).translate(0, y0 + h / 2, 0), glassM); glass.renderOrder = 5; g.add(glass);
  // the sliding cover (closes the slot)
  const cover = mesh(rbox(slotW + 0.2, 0.08, slotD + 0.16, 0.03), mat('#e9e6df', 0.6)); cover.position.set(-(slotW + 0.3), lidY + 0.12, 0); g.add(cover);
  const knob = mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(C.ink, 0.5)); knob.position.set(0, 0.12, 0); cover.add(knob);
  g.seal = (k) => { cover.position.x = lerp(-(slotW + 0.3) * 0.86 - 0.05, 0, k); };
  g.seal(0);
  g.inside = { x0: -w / 2 + 0.12, x1: w / 2 - 0.12, y0: y0 + 0.02, z0: -d / 2 + 0.12, z1: d / 2 - 0.12, h };
  g.slot = new THREE.Vector3(0, lidY + 0.12, 0); g.printer = new THREE.Vector3(0, ped * 0.62 + 0.02, (d + 0.5) / 2 + 0.03);
  g.glass = glass; return g;
}

// ---------------------------------------------------------------- street pieces
export function carGeo() {
  return bake([
    { geo: rbox(4.2, 1.0, 1.9, 0.38).translate(0, 0.35, 0), color: '#ffffff' },
    { geo: rbox(2.3, 0.8, 1.7, 0.3).translate(-0.3, 1.2, 0), color: '#ffffff' },
    { geo: rbox(2.2, 0.58, 1.74, 0.22).translate(-0.3, 1.3, 0), color: '#cfdde6' },
    ...[[-1.35, 1], [1.35, 1], [-1.35, -1], [1.35, -1]].map(([x, z]) => ({ geo: new THREE.CylinderGeometry(0.4, 0.4, 0.3, 14).rotateX(Math.PI / 2).translate(x, 0.4, z * 0.88), color: '#4a5566' })),
  ]);
}
// padlock (body faces +z), base at y = 0, ~1 unit tall. text on the body face.
export function padlock({ color = C.gold, text = '<4%', s = 1 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(1.0, 0.8, 0.42, 0.14), mat(color, 0.45)));
  const sh = mesh(new THREE.TorusGeometry(0.32, 0.075, 10, 24, Math.PI), mat('#c9ccd0', 0.35)); sh.position.y = 0.8; g.add(sh);
  for (const sx of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 10), mat('#c9ccd0', 0.35)); leg.position.set(sx * 0.32, 0.8, 0); g.add(leg); }
  if (text) { const p = textPlane(text, { w: 0.86, h: 0.5, fg: C.ink, size: 0.8, res: 160 }); p.position.set(0, 0.4, 0.215); g.add(p); }
  g.scale.setScalar(s); return g;
}
// FOR SALE sign on a post, board faces +z, base at y = 0
export function saleSign({ text = 'FOR SALE', s = 1, board = '#ffffff', ink = C.ink } = {}) {
  const g = new THREE.Group();
  g.add(mesh(bake([{ geo: rbox(0.16, 2.4, 0.16, 0.04), color: '#e8e4dc' }, { geo: rbox(1.9, 0.12, 0.14, 0.04).translate(0.55, 2.25, 0), color: '#e8e4dc' }]), vmat(0.8)));
  const b = mesh(rbox(1.7, 1.0, 0.08, 0.06), mat(board, 0.8)); b.position.set(0.75, 1.05, 0); g.add(b);
  const p = textPlane(text, { w: 1.55, h: 0.7, fg: ink, size: 0.62, res: 200, sub: null }); p.position.set(0.75, 1.55, 0.05); g.add(p);
  g.scale.setScalar(s); return g;
}
// generic investor / institution buildings (no real building, no logos): 'columns' | 'tower' | 'block' | 'stepped'
export function building(kind = 'block', { w = 8, d = 7, h = 9, color = '#ffffff' } = {}) {
  const parts = [];
  if (kind === 'columns') {
    parts.push({ geo: rbox(w, 0.6, d, 0.1), color: '#e9e6df' }, { geo: rbox(w - 0.6, 0.5, d - 0.6, 0.1).translate(0, 0.6, 0), color: '#efece6' });
    const n = 5; for (let i = 0; i < n; i++) parts.push({ geo: new THREE.CylinderGeometry(0.32, 0.36, h - 2.6, 16).translate(-w / 2 + 1 + i * (w - 2) / (n - 1), 1.1 + (h - 2.6) / 2, d / 2 - 1), color });
    parts.push({ geo: rbox(w - 1.6, h - 2.6, d - 2.8, 0.1).translate(0, 1.1, -0.6), color: '#f1eee8' });
    parts.push({ geo: rbox(w, 0.7, d - 0.4, 0.1).translate(0, h - 1.5, 0), color });
    parts.push({ geo: prism(w, 1.3, d - 0.6).translate(0, h - 0.8, 0), color });
  } else if (kind === 'tower') {
    parts.push({ geo: rbox(w, h, d, 0.3), color });
    for (let y = 1.6; y < h - 0.6; y += 1.3) parts.push({ geo: rbox(w + 0.08, 0.5, d + 0.08, 0.05).translate(0, y, 0), color: '#d9e4ea' });
    parts.push({ geo: rbox(w * 0.6, 1.2, d * 0.6, 0.2).translate(0, h, 0), color });
  } else if (kind === 'stepped') {
    parts.push({ geo: rbox(w, h * 0.5, d, 0.25), color }, { geo: rbox(w * 0.74, h * 0.3, d * 0.74, 0.22).translate(0, h * 0.5, 0), color }, { geo: rbox(w * 0.46, h * 0.2, d * 0.46, 0.2).translate(0, h * 0.8, 0), color });
    for (let y = 1.2; y < h * 0.5 - 0.5; y += 1.4) parts.push({ geo: rbox(w + 0.06, 0.4, d + 0.06, 0.05).translate(0, y, 0), color: '#e3e6e2' });
  } else {
    parts.push({ geo: rbox(w, h, d, 0.25), color });
    for (let y = 1.4; y < h - 0.8; y += 1.6) for (let x = -w / 2 + 1.2; x < w / 2 - 0.8; x += 1.4) parts.push({ geo: rbox(0.8, 0.9, 0.1, 0.04).translate(x, y, d / 2), color: '#d9e4ea' });
  }
  return mesh(bake(parts), vmat(0.85));
}

// ---------------------------------------------------------------- machines
// a straight conveyor along +x from x0 to x1 at belt height y (top surface), width wd. Returns Group with .top (y of the
// belt surface) and .rollers (an instanced mesh); .tick(t, speed) turns the rollers.
export function conveyor({ x0 = 0, x1 = 20, y = 1.4, z = 0, wd = 1.6, belt = C.belt, frame = '#ffffff', legs = true } = {}) {
  const g = new THREE.Group(), L = x1 - x0, cx = (x0 + x1) / 2, parts = [];
  parts.push({ geo: rbox(L, 0.14, wd, 0.06).translate(cx, y - 0.14, z), color: belt });
  for (const sz of [-1, 1]) parts.push({ geo: rbox(L + 0.2, 0.34, 0.16, 0.06).translate(cx, y - 0.3, z + sz * (wd / 2 + 0.08)), color: frame });
  if (legs) for (let x = x0 + 0.6; x <= x1 - 0.5; x += Math.max(2.5, L / Math.ceil(L / 4))) for (const sz of [-1, 1]) parts.push({ geo: rbox(0.18, y - 0.3, 0.18, 0.05).translate(x, 0, z + sz * (wd / 2 + 0.05)), color: '#e6e3dc' });
  g.add(mesh(bake(parts), vmat(0.75)));
  // rollers poking out under the belt ends
  for (const x of [x0, x1]) { const r = mesh(new THREE.CylinderGeometry(0.16, 0.16, wd + 0.1, 16).rotateX(Math.PI / 2), mat('#c9ccd0', 0.4)); r.position.set(x, y - 0.12, z); g.add(r); }
  g.top = y; g.z = z; g.x0 = x0; g.x1 = x1; return g;
}

// ---------------------------------------------------------------- small animation helpers
// a pop-in scale: 0 before `at`, overshoots to ~1.12 and settles at 1 after `dur`
export function pop(t, at, dur = 0.4) { const k = CK.clamp((t - at) / dur); if (k <= 0) return 0; return CK.outCubic(k) * (1 + 0.18 * Math.sin(Math.PI * k)); }
// damped swing (radians): released at `at` from angle a0, period T, decay per second
export function swing(t, at, a0, { T = 1.6, decay = 1.2 } = {}) { const u = t - at; if (u < 0) return a0; return a0 * Math.exp(-decay * u) * Math.cos(2 * Math.PI * u / T); }
// deterministic resting spots for n envelopes inside a box { x0, x1, y0, z0, z1 } (layers of a loose grid, jittered)
export function pile(box, n, { seed = 5, s = 0.5, thick = 0.05 } = {}) {
  const r = rng(seed), W = box.x1 - box.x0, D = box.z1 - box.z0, cols = Math.max(1, Math.floor(W / (s * 0.9))), rows = Math.max(1, Math.floor(D / (s * 0.62))), per = cols * rows, out = [];
  for (let i = 0; i < n; i++) {
    const L = Math.floor(i / per), j = i % per, cx = j % cols, cz = Math.floor(j / cols);
    out.push({ x: box.x0 + (cx + 0.5) * W / cols + (r() - 0.5) * s * 0.5, y: box.y0 + L * thick * 1.6 + r() * thick * 0.6, z: box.z0 + (cz + 0.5) * D / rows + (r() - 0.5) * s * 0.3,
      rx: (r() - 0.5) * 0.25, ry: (r() - 0.5) * 1.2, rz: (r() - 0.5) * 0.25 });
  }
  return out;
}
