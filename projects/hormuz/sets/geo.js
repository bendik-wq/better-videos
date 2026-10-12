// Real geography for the Hormuz sets: vectors (Natural Earth coast, OSM TSS lanes, places, pipelines),
// EIA data, the local frame of the baked 'hormuz' imagery set, the traffic in the lanes, DOM labels.
import * as THREE from 'three';
import * as IM from '/engine/imagery/index.js';
import * as SEA from '/engine/sea/index.js';

export const ROOT = '/projects/hormuz/assets/';
const json = async (f) => { const r = await fetch(ROOT + f); if (!r.ok) throw new Error('hormuz: missing ' + f); return r.json(); };
let DATA = null;
export async function load() {
  if (DATA) return DATA;
  const [vec, brent, facts, set, arabia] = await Promise.all([json('geo/vectors.json'), json('geo/brent-monthly.json'), json('geo/facts.json'), IM.loadSet('hormuz', ROOT + 'imagery/'), IM.loadSet('arabia', ROOT + 'imagery/').catch(() => null)]);
  const P = IM.projection(set, { curvature: false });
  DATA = { vec, brent, facts, set, arabia, P };
  // TSS: OSM separation lanes (lane centre lines), extended along their end tangents
  const lanes = vec.tss.filter(w => w.type === 'separation_lane').map(w => w.path.map(([lo, la]) => P.xz(la, lo)));
  // inbound (westbound, into the Gulf) is the northern lane; its OSM way runs east -> west
  const north = lanes.find(l => l.reduce((a, p) => a + p[1], 0) / l.length < lanes.map(m => m.reduce((a, p) => a + p[1], 0) / m.length).reduce((a, b) => Math.min(a, b)) + 1);
  const south = lanes.find(l => l !== north);
  const ext = (l, a, b) => { const p0 = l[0], p1 = l[1], q0 = l.at(-1), q1 = l.at(-2); const d0 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), d1 = Math.hypot(q0[0] - q1[0], q0[1] - q1[1]);
    return [[p0[0] + (p0[0] - p1[0]) / d0 * a, p0[1] + (p0[1] - p1[1]) / d0 * a], ...l, [q0[0] + (q0[0] - q1[0]) / d1 * b, q0[1] + (q0[1] - q1[1]) / d1 * b]]; };
  DATA.laneIn = SEA.lane(ext(north, 30000, 30000));                       // east -> west
  DATA.laneOut = SEA.lane(ext(south[0][0] < south.at(-1)[0] ? south : [...south].reverse(), 30000, 30000)); // west -> east
  DATA.tssLocal = vec.tss.map(w => ({ type: w.type, pts: w.path.map(([lo, la]) => P.xz(la, lo)) }));
  DATA.place = (name, y = 0) => { const [la, lo] = vec.places[name]; const [x, z] = P.xz(la, lo); return new THREE.Vector3(x, y, z); };
  return DATA;
}

// a convoy in a lane: ships spaced along it (kinds cycle), speed in m/s; returns the ship list
export function convoy(sea, lane, { kinds = ['vlcc', 'container', 'vlcc', 'lng', 'vlcc'], n = 6, s0 = 0, gap = 2600, speed = 7, seed = 1, names = [] } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) { const kind = kinds[i % kinds.length];
    const s = SEA.ship(kind, { seed: seed * 17 + i, name: names[i] ?? undefined, loaded: kind === 'vlcc' ? (i % 3 === 1 ? 0.2 : 1) : undefined, hullColor: kind === 'vlcc' ? ['#1e1f22', '#5a1d1a', '#22303f', '#1e1f22'][i % 4] : undefined, deckColor: kind === 'vlcc' ? ['#405c42', '#7a3a2a', '#405c42', '#5d6a60'][i % 4] : undefined });
    sea.addShip(s); s.follow(lane, { s0: s0 + i * gap + ((i * 7919) % 500), speed: speed * (0.92 + ((i * 37) % 10) / 60) }); out.push(s); }
  return out;
}

// DOM labels anchored to world points (leader line + dot), all styles set per frame
export function labels(layer, { color = '#f6f2ea' } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible'; layer.appendChild(svg);
  const list = []; const v = new THREE.Vector3();
  return {
    add(text, at, { dx = 0, dy = -46, sub = '', size = 0.95, dot = true, align = 'center', t0 = 0, t1 = 1e9, accent = null, show = null } = {}) {
      const el = document.createElement('div'); el.style.cssText = `position:absolute;white-space:nowrap;font:500 ${size * 1.3}em 'Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:${color};text-shadow:0 1px 8px rgba(0,0,0,.55),0 0 2px rgba(0,0,0,.4)`;
      el.innerHTML = text + (sub ? `<div style="font-size:.68em;letter-spacing:.14em;opacity:.8;margin-top:.25em">${sub}</div>` : ''); layer.appendChild(el);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', accent ?? 'rgba(255,255,255,.75)'); ln.setAttribute('stroke-width', '1.3'); svg.appendChild(ln);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', dot ? '3.5' : '0'); c.setAttribute('fill', accent ?? '#fff'); svg.appendChild(c);
      const L = { el, ln, c, at, dx, dy, align, t0, t1, show }; list.push(L); return L;
    },
    update(camera, t, W, H) {
      camera.updateMatrixWorld();
      for (const L of list) {
        const a = typeof L.at === 'function' ? L.at(t) : L.at; v.copy(a).project(camera);
        const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        const k = (L.show ? L.show(t) : Math.min(1, Math.max(0, (t - L.t0) / 0.6)) * Math.min(1, Math.max(0, (L.t1 - t) / 0.6))) * (vis ? 1 : 0);
        const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H, s = H / 1080;
        L.el.style.opacity = k; L.ln.style.opacity = k; L.c.style.opacity = k;
        L.el.style.left = (x + L.dx * s) + 'px'; L.el.style.top = (y + L.dy * s) + 'px'; L.el.style.transform = `translate(${L.align === 'center' ? '-50%' : L.align === 'right' ? '-100%' : '0'}, -100%)`;
        L.ln.setAttribute('x1', x); L.ln.setAttribute('y1', y); L.ln.setAttribute('x2', x + L.dx * s); L.ln.setAttribute('y2', y + (L.dy + 6) * s); L.c.setAttribute('cx', x); L.c.setAttribute('cy', y);
      }
    },
  };
}

// flat ribbon (lane, route, pipeline) on or above the surface: world points [x, z] -> mesh
export function ribbon(pts, { width = 400, y = 30, color = 0xffffff, opacity = 0.85, dash = 0, glow = 1, depthTest = true } = {}) {
  const pos = [], uv = [], idx = []; let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    let dx = q[0] - o[0], dz = q[1] - o[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    if (i) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    pos.push(p[0] - dz * width / 2, y, p[1] + dx * width / 2, p[0] + dz * width / 2, y, p[1] - dx * width / 2); uv.push(acc, 0, acc, 1);
    if (i < pts.length - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: opacity }, uDraw: { value: 1e12 }, uDash: { value: dash }, uLen: { value: acc }, uGlow: { value: glow }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uCol; uniform float uOp, uDraw, uDash, uLen, uGlow, uT; varying vec2 vUv;
      void main(){ if (vUv.x > uDraw) discard; float e = 1. - abs(vUv.y * 2. - 1.); float a = smoothstep(0., .35, e) * uOp;
        if (uDash > 0.) a *= step(.5, fract((vUv.x - uT) / uDash));
        float head = smoothstep(uDraw - uLen * .02, uDraw, vUv.x) * step(vUv.x, uDraw) * (uDraw < uLen ? 1. : 0.);
        gl_FragColor = vec4(uCol * uGlow * (1. + head * 2.), a); }`,
    transparent: true, depthWrite: false, depthTest, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 50; mesh.userData.length = acc; return mesh;
}

// ================================================================== shared set kit (index.js + scenic.js)
import * as CAMK from '/engine/camera.js';
export const smoother = CAMK.smoother, lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (t, a, b) => smoother(range(t, a, b));
export const MONO = (size = 0.9, color = '#fbf8f2', ls = 0.18) => `font:500 ${size}em 'Plex Mono',monospace;letter-spacing:${ls}em;text-transform:uppercase;color:${color};text-shadow:0 1px 18px rgba(8,20,38,.35),0 0 2px rgba(8,20,38,.3)`;
export const SERIF = (size = 3.2, color = '#fbf8f2') => `font:400 ${size}em/1.04 'Instrument Serif',serif;color:${color};text-shadow:0 2px 18px rgba(8,20,38,.35)`;
export const NAVY = '#0f1e33', NAVY_SOFT = '#46536a', PAPER = '#f4efe6', RED = '#e0241b', SAND = '#e6cf9f', TURQ = '#17a3a6', DEEP = '#0b6f86';
const norm = (w) => String(w).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
// shot-relative time of the nth spoken word starting with `word` (narration timing), or `fb`
export function wt(shot, word, fb = 1.2, nth = 0) {
  if (word == null) return fb; if (typeof word === 'number') return word;
  const hits = (shot.words || []).filter(x => norm(x.w).startsWith(norm(word)));
  return (hits[nth] ?? hits.at(-1))?.s ?? fb;
}
export function layerOf(ctx) { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none;overflow:hidden'; ctx.overlay.appendChild(l); return l; }
export function div(layer, css, html = '') { const d = document.createElement('div'); d.style.cssText = 'position:absolute;' + css; d.innerHTML = html; layer.appendChild(d); return d; }
// bright-mode type on pictures: light type on a soft navy shadow plate from its corner (never a box)
export function plate(layer, corner = 'tl', k = 0.58) {
  const at = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%' }[corner];
  return div(layer, `inset:0;pointer-events:none;background:radial-gradient(ellipse 62% 52% at ${at}, rgba(8,20,38,${k}) 0%, rgba(8,20,38,${k * 0.45}) 38%, rgba(8,20,38,0) 72%)`);
}
// caption (top-left, typed on) + source line (bottom-right) with their plates; returns update(t)
export function captions(layer, shot, { caption, source, at = 0.5, corner = 'tl', css } = {}, H = {}) {
  const P = shot.params ?? {}; caption = caption ?? P.caption; source = source ?? P.source;
  if (H.captions === false) return () => {};
  const els = [];
  if (caption) { const pl = plate(layer, corner === 'tl' ? 'tl' : corner); const d = div(layer, `${css ?? (corner === 'tl' ? 'left:6%;top:8%' : 'left:6%;bottom:9%')};${MONO(1.15)};line-height:1.6;white-space:nowrap`, '');
    els.push((t) => { const k = range(t, at, at + 0.25 + caption.length * 0.035); d.textContent = caption.slice(0, Math.round(caption.length * k)); pl.style.opacity = range(t, at - 0.4, at + 0.4); }); }
  if (source) { const pl = plate(layer, 'br', 0.42); const d = div(layer, `right:4.2%;bottom:4.6%;${MONO(0.72, 'rgba(251,248,242,.88)', 0.16)}`, source);
    els.push((t) => { const k = range(t, at + 0.6, at + 1.2); d.style.opacity = k; pl.style.opacity = k; }); }
  return (t) => els.forEach(f => f(t));
}
const LOOKC = (name, o = {}) => ({ ...SEA.LOOKS[name], ...o });
export { LOOKC as look };
// a Sea + presenter (house set format), a camera and a DOM layer
export function seaSet(ctx, shot, o = {}) {
  const P = shot.params ?? {};
  const sea = new SEA.Sea(ctx.renderer, { look: P.look ? (typeof P.look === 'string' ? SEA.LOOKS[P.look] : P.look) : o.look ?? 'bright-day', spectrum: { ...(o.spectrum ?? {}), ...(P.spectrum ?? {}) }, ocean: { ...(o.ocean ?? {}), ...(P.ocean ?? {}) }, renderScale: P.renderScale ?? o.renderScale ?? 1, bloom: o.bloom });
  const pres = sea.presenter();
  const camera = new THREE.PerspectiveCamera(o.fov ?? 40, ctx.width / ctx.height, 0.1, 1e6);
  const layer = layerOf(ctx);
  const disposers = [];
  return { sea, pres, camera, layer, W: ctx.width, H: ctx.height, ctx, onDispose: (f) => disposers.push(f),
    out(update) { return { scene: pres.scene, camera, layer, update, sea, dispose() { disposers.forEach(f => f()); pres.dispose(); sea.dispose(); layer.remove(); } }; } };
}
export async function withLand(S, { levels = 99, lod = 0, depthLevel = 1, root } = {}) {
  const L = await SEA.land(S.sea, 'hormuz', { root: root ?? ROOT + 'imagery/', lod, levels });
  S.sea.scene.add(L.group);
  const b = L.bathy[Math.min(depthLevel, L.bathy.length - 1)], U = S.sea.ocean.U;
  U.uDepthTex.value = b.tex; U.uDepthBox.value.copy(b.box); U.uDepthOn.value = 1;
  const c = L.bathy.at(-1); if (c !== b) { U.uDepthTex2.value = c.tex; U.uDepthBox2.value.copy(c.box); }
  return L;
}
// camera from a target, a compass azimuth (deg, the way the camera LOOKS), a pitch (deg below horizontal) and altitude
export function aerial(target, az, pitch, alt) { const a = az * Math.PI / 180, d = alt / Math.tan(pitch * Math.PI / 180); return { pos: [target[0] - Math.sin(a) * d, alt, target[2] + Math.cos(a) * d], look: [target[0], 0, target[2]] }; }
// fixed ships at anchor (heading into the wind, no way on), deterministic layout around a centre
export function anchorage(sea, c, { n = 12, r = 4000, kinds = ['vlcc', 'container', 'lng', 'vlcc', 'vlcc'], seed = 5, heading = 320, lite = true, minGap = 700, avoid = null } = {}) {
  const rnd = K_rng(seed), out = [], pts = [];
  for (let i = 0; i < n * 8 && out.length < n; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d * 1.5, z = c[2] + Math.sin(a) * d;
    if (pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < minGap) || (avoid && Math.hypot(avoid[0] - x, avoid[1] - z) < avoid[2])) continue; pts.push([x, z]);
    const kind = kinds[out.length % kinds.length];
    const s = SEA.ship(kind, { seed: seed * 31 + out.length, lite, loaded: kind === 'vlcc' ? (rnd() < 0.5 ? 0.3 : 0.95) : undefined, anchored: true, hullColor: kind === 'vlcc' ? ['#1e1f22', '#5a1d1a', '#22303f', '#3b2725'][out.length % 4] : undefined, deckColor: kind === 'vlcc' ? ['#4d5649', '#6b4436', '#4d5649', '#555b55'][out.length % 4] : undefined });
    s.wake = 0.35; sea.addShip(s); s.place(x, z, heading + (rnd() - 0.5) * 24, 0); out.push(s); }
  return out;
}
function K_rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const rng = K_rng;
// canvas -> texture helper for paper cards and screens
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw?.(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, x, tex: t }; }
