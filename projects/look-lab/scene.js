// LOOK LAB: the same six test frames under every look in engine/looks.js.
//   aerial  USDA NAIP + USGS 3DEP drone view (engine/imagery), haze + photo grade from LK.imagery(look)
//   ship    PD Navy footage at sea (engine/footage.js, graded 'none': the look's LUT does the work)
//   city    the world kit (Denver), sky / sun / exposure from LK.tod(look, W.TOD)
//   map     the Strait of Hormuz (Natural Earth), drawn in the look's palette
//   title   an editorial title card in the look's palette
//   chart   an area chart in the look's palette
// Every shot has params.look. Stills come out of render.mjs ungraded; projects/look-lab/lab.mjs then
// runs each through engine/grade/finish.mjs (LUT + finish) and builds the comparison sheets.
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as FT from '/engine/footage.js';
import * as IM from '/engine/imagery/index.js';
import * as W from '/engine/world/index.js';
import * as LK from '/engine/looks.js';

const sc = () => window.innerHeight / 1080;
function layerOf(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function el(parent, css, html = '') { const d = document.createElement('div'); d.style.cssText = css; d.innerHTML = html; parent.appendChild(d); return d; }
const HORMUZ = await (await fetch('/projects/look-lab/assets/hormuz.json')).json();

// ---------------------------------------------------------------- type over pictures (the bright-mode rule:
// light type sits on a soft shadow plate, never naked on a bright sky or sea)
function caption(layer, P, pal, { title, sub, src, corner = 'tl' }) {
  const s = sc();
  const plate = el(layer, `position:absolute;left:0;top:0;width:${1150 * s}px;height:${430 * s}px;background:radial-gradient(ellipse at 0% 0%, ${pal.plate} 0%, rgba(0,0,0,0) 70%)`);
  el(layer, `position:absolute;left:${96 * s}px;top:${82 * s}px;font:${60 * s}px/1.04 "Instrument Serif";color:${pal.plateInk};text-shadow:${pal.shadow}`, title);
  el(layer, `position:absolute;left:${99 * s}px;top:${156 * s}px;font:500 ${15 * s}px "Plex Mono";letter-spacing:.22em;text-transform:uppercase;color:${pal.plateInk};opacity:.86;text-shadow:${pal.shadow}`, sub);
  el(layer, `position:absolute;left:${96 * s}px;bottom:${54 * s}px;font:500 ${13 * s}px "Plex Mono";letter-spacing:.2em;text-transform:uppercase;color:${pal.plateInk};opacity:.78;text-shadow:${pal.shadow}`, src);
  const bplate = el(layer, `position:absolute;left:0;bottom:0;width:${900 * s}px;height:${160 * s}px;background:radial-gradient(ellipse at 0% 100%, ${pal.plate} 0%, rgba(0,0,0,0) 70%);opacity:.7`);
  layer.insertBefore(bplate, layer.firstChild); layer.insertBefore(plate, layer.firstChild);
}

// ---------------------------------------------------------------- aerial
async function aerial(ctx, shot) {
  const P = shot.params, look = P.look, pal = LK.palette(look), I = LK.imagery(look);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 5, 400000);
  const T = await IM.terrain(scene, 'pentagon', { lod: 0, haze: I.haze, grade: I.grade, renderer: ctx.renderer, segments: 48 });
  const c = T.toLocal(38.87085, -77.05585, 0);
  const rig = C.path([
    { pos: [c.x + 900, 780, c.z - 1050], look: [c.x - 500, 0, c.z + 700], mm: 32 },
    { pos: [c.x + 700, 700, c.z - 820], look: [c.x - 200, 0, c.z + 300], mm: 34 },
  ], { duration: shot.duration, accel: 0.3, decel: 0.3, seed: 3 });
  const layer = layerOf(ctx.overlay);
  caption(layer, P, pal, { title: 'Arlington, Virginia', sub: '38.871° N · 77.056° W · 780 M', src: 'IMAGERY: USDA NAIP · ELEVATION: USGS 3DEP · LOOK LAB' });
  return { scene, camera, layer, update(t, p) { rig(camera, p, t); T.update(camera); } };
}

// ---------------------------------------------------------------- ship (PD footage)
async function ship(ctx, shot) {
  const P = shot.params, pal = LK.palette(P.look);
  const set = await FT.footage(ctx, shot, { file: P.file, in: P.in, out: P.out, grade: P.grade, reframe: { from: [0.5, 0.5, 1.04], to: [0.5, 0.5, 1.06] } });
  const layer = layerOf(ctx.overlay);
  caption(layer, P, pal, { title: 'Single file', sub: 'Littoral combat ships · at sea', src: 'U.S. NAVY / KEITH DEVINNEY · PUBLIC DOMAIN' });
  return { scene: set.scene, camera: set.camera, layer, update: (t, p) => set.update(t, p), set };
}

// ---------------------------------------------------------------- city (world kit at the look's time of day)
let DENVER = null;
async function denver() {
  return DENVER ??= (async () => {
    const w = await W.create({ place: 'denver', tod: 'day', seed: 4, wet: 0, clouds: { base: 2600, thick: 420, coverage: 0.32, fog: 0 }, renderScale: 0.8 });
    const city = w.city({ center: [0, -900], radius: 1500, seed: 11, angle: 0, downtown: { at: [150, -1000], radius: 520, height: 170 } });
    w.build(); w.city0 = city;
    w.traf = [W.traffic(w, city.line('z', city.nearestLine('z', -700)), { lanes: [0, 1, -1, -2], perKm: 10, speed: [11, 14], seed: 21, mix: { sedan: 0.6, suv: 0.3, van: 0.1, truck: 0 } })];
    return w;
  })();
}
async function citySet(ctx, shot) {
  const P = shot.params, look = P.look, pal = LK.palette(look);
  const w = await denver();
  const tod = LK.tod(look, W.TOD);
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 1, 1e7);
  const F = w.frame, g = (x, z, h) => F.surface(x, z, w.height(x, z) + h).toArray();
  const rig = C.path([
    { pos: g(1500, 900, 420), look: g(150, -1000, 40), mm: 35 },
    { pos: g(1380, 760, 400), look: g(150, -1000, 50), mm: 36 },
  ], { duration: shot.duration, accel: 0.3, decel: 0.3, seed: 5 });
  const layer = layerOf(ctx.overlay);
  caption(layer, P, pal, { title: 'A city at work', sub: 'World kit · Denver · ' + LK.get(look).label, src: 'RENDERED · ELEVATION: USGS 3DEP · LOOK LAB' });
  return { scene: w.scene, camera, layer, world: w, update(t, p) {
    rig(camera, p, t);
    w.setState({ t, tod, wet: 0 });
    w.fleet.begin(); for (const tr of w.traf) tr(t, w.fleet); w.fleet.end();
    w.render(ctx.renderer, camera);
  }, custom: true };
}

// ---------------------------------------------------------------- 2D sets (canvas in the overlay)
function canvasLayer(ctx) {
  const layer = layerOf(ctx.overlay), cv = document.createElement('canvas');
  cv.width = ctx.width; cv.height = ctx.height; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  layer.appendChild(cv); return { layer, cv, g: cv.getContext('2d') };
}
const blank = () => { const scene = new THREE.Scene(); scene.background = new THREE.Color(0); return { scene, camera: new THREE.PerspectiveCamera() }; };

let GRAIN = null;
function grain(g) {
  if (!GRAIN) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = K.rng(17);
    for (let i = 0; i < im.data.length; i += 4) { const v = 236 + r() * 19; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); GRAIN = c; }
  return g.createPattern(GRAIN, 'repeat');
}
function mapSet(ctx, shot) {
  const P = shot.params, pal = LK.palette(P.look), s = sc();
  const { layer, cv, g } = canvasLayer(ctx); const Wd = cv.width, Ht = cv.height;
  const lab = (html, x, y, css) => el(layer, `position:absolute;left:${x * s}px;top:${y * s}px;${css}`, html);
  const lon0 = 55.9, lat0 = 25.7, kx = Math.cos(lat0 * Math.PI / 180);
  return { ...blank(), layer, update(t, p) {
    const span = K.lerp(11.8, 11.3, K.smooth(p)), ppd = Wd / span; // pixels per degree of longitude
    const X = (lon) => Wd / 2 + (lon - lon0) * ppd, Y = (lat) => Ht / 2 - (lat - lat0) * ppd / kx;
    const path = (arr, close) => { g.beginPath(); for (let i = 0; i < arr.length; i += 2) (i ? g.lineTo : g.moveTo).call(g, X(arr[i]), Y(arr[i + 1])); if (close) g.closePath(); };
    // water: a gentle depth gradient (deep in the Gulf of Oman, shallow turquoise in the Gulf)
    const wg = g.createLinearGradient(0, 0, Wd, Ht); wg.addColorStop(0, pal.water); wg.addColorStop(1, pal.seaDeep);
    g.globalAlpha = 1; g.fillStyle = pal.water; g.fillRect(0, 0, Wd, Ht);
    g.globalAlpha = 0.5; g.fillStyle = wg; g.fillRect(0, 0, Wd, Ht); g.globalAlpha = 1;
    // land, with a soft shadow on the water side (paper-cut depth, Kurzgesagt-style flat depth)
    // shallows: a pale shelf along every coast (stroked under the land), then the land on top
    g.save(); g.lineJoin = 'round'; g.strokeStyle = pal.shallow ?? pal.water; g.filter = `blur(${14 * s}px)`; g.globalAlpha = 0.85; g.lineWidth = 40 * s; for (const r of HORMUZ.land) { path(r, true); g.stroke(); }
    g.filter = `blur(${5 * s}px)`; g.globalAlpha = 0.5; g.lineWidth = 12 * s; for (const r of HORMUZ.land) { path(r, true); g.stroke(); } g.restore();
    g.save(); g.shadowColor = 'rgba(0,0,0,0.22)'; g.shadowBlur = 22 * s; g.shadowOffsetY = 6 * s;
    g.fillStyle = pal.land; for (const r of HORMUZ.land) { path(r, true); g.fill(); } g.restore();
    // paper grain on the land (deterministic noise tile, multiplied in)
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = grain(g); g.globalAlpha = 0.5; for (const r of HORMUZ.land) { path(r, true); g.fill(); } g.restore();
    g.fillStyle = pal.water; for (const r of HORMUZ.lakes) { path(r, true); g.fill(); }
    g.strokeStyle = pal.inkSoft; g.globalAlpha = 0.55; g.lineWidth = 1.4 * s; for (const r of HORMUZ.coast) { path(r, false); g.stroke(); }
    g.setLineDash([6 * s, 6 * s]); g.globalAlpha = 0.5; g.lineWidth = 1.2 * s; for (const r of HORMUZ.borders) { path(r, false); g.stroke(); } g.setLineDash([]); g.globalAlpha = 1;
    // graticule
    g.strokeStyle = pal.grid; g.lineWidth = 1; for (let lo = 50; lo <= 62; lo += 2) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), Ht); g.stroke(); } for (let la = 20; la <= 32; la += 2) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(Wd, Y(la)); g.stroke(); }
    // the tanker lane (red is annotation only): through the strait, drawn on
    const lane = [[51.2, 27.3], [53.6, 26.4], [55.6, 26.45], [56.35, 26.62], [56.75, 26.25], [57.2, 25.6], [58.6, 24.9], [60.2, 24.6]];
    const k = K.outCubic(K.range(t, 0.0, 0.6));
    const n = Math.max(2, Math.ceil(lane.length * k)); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [col, lw] of [[pal.land, 9], [pal.accent, 4]]) { g.strokeStyle = col; g.lineWidth = lw * s; g.beginPath(); for (let i = 0; i < n; i++) (i ? g.lineTo : g.moveTo).call(g, X(lane[i][0]), Y(lane[i][1])); g.stroke(); }
    g.strokeStyle = pal.accent;
    // the strait marker
    g.beginPath(); g.arc(X(56.45), Y(26.55), 30 * s, 0, Math.PI * 2); g.lineWidth = 2.5 * s; g.stroke();
    if (!layer.dataset.l) { layer.dataset.l = 1;
      const big = `font:${38 * s}px "Instrument Serif";color:${pal.ink};letter-spacing:.02em`;
      const cap = `font:500 ${19 * s}px "Plex Mono";letter-spacing:.34em;text-transform:uppercase;color:${pal.ink}`;
      const sea = `font:italic ${32 * s}px "Instrument Serif";color:${pal.ink};opacity:.75`;
      lab('IRAN', X(56.2) / s, Y(28.0) / s, cap); lab('OMAN', X(57.3) / s, Y(23.4) / s, cap); lab('U.A.E.', X(54.0) / s, Y(23.9) / s, cap);
      lab('Persian Gulf', X(51.6) / s, Y(26.75) / s, sea); lab('Gulf of Oman', X(58.2) / s, Y(24.75) / s, sea);
      lab('Strait of Hormuz', X(56.95) / s, Y(27.0) / s, big);
      lab('CHART: NATURAL EARTH (PUBLIC DOMAIN) · LANE SCHEMATIC', 96, 1010, `font:500 ${13 * s}px "Plex Mono";letter-spacing:.2em;color:${pal.inkSoft}`);
    }
  } };
}

function titleSet(ctx, shot) {
  const P = shot.params, look = P.look, pal = LK.palette(look), s = sc();
  const { layer, cv, g } = canvasLayer(ctx);
  const dark = ['noir-sodium', 'blue-hour', 'golden-hour'].includes(look);
  el(layer, `position:absolute;left:${122 * s}px;top:${330 * s}px;font:700 ${54 * s}px "Archivo Narrow";color:${pal.accent}`, '03');
  el(layer, `position:absolute;left:${118 * s}px;top:${400 * s}px;font:${150 * s}px/0.95 "Instrument Serif";color:${pal.ink};letter-spacing:-.015em`, 'The Strait');
  el(layer, `position:absolute;left:${124 * s}px;top:${575 * s}px;font:500 ${17 * s}px "Plex Mono";letter-spacing:.26em;color:${pal.inkSoft}`, 'HORMUZ · 21 MILES AT ITS NARROWEST');
  el(layer, `position:absolute;right:${96 * s}px;bottom:${56 * s}px;font:500 ${13 * s}px "Plex Mono";letter-spacing:.2em;color:${pal.inkSoft}`, 'LOOK LAB · ' + LK.get(look).label.toUpperCase());
  return { ...blank(), layer, update() {
    const Wd = cv.width, Ht = cv.height;
    g.fillStyle = pal.bg; g.fillRect(0, 0, Wd, Ht);
    // a band of sea along the right third, like a window onto the place (not a gradient on type)
    const x0 = Wd * 0.62; const sg = g.createLinearGradient(0, 0, 0, Ht);
    sg.addColorStop(0, dark ? pal.sky : pal.sky); sg.addColorStop(0.46, dark ? pal.sky : '#cfe6f2'); sg.addColorStop(0.5, pal.sea); sg.addColorStop(1, pal.seaDeep);
    g.fillStyle = sg; g.fillRect(x0, 0, Wd - x0, Ht);
    // sun disc on the horizon band
    g.fillStyle = pal.sun; g.globalAlpha = 0.9; g.beginPath(); g.arc(x0 + (Wd - x0) * 0.62, Ht * 0.33, 46 * s, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    // a tanker silhouette on the horizon
    const hy = Ht * 0.5, tx = x0 + (Wd - x0) * 0.3; g.fillStyle = pal.navy;
    g.beginPath(); g.moveTo(tx, hy - 4 * s); g.lineTo(tx + 180 * s, hy - 4 * s); g.lineTo(tx + 170 * s, hy + 3 * s); g.lineTo(tx + 6 * s, hy + 3 * s); g.closePath(); g.fill();
    g.fillRect(tx + 150 * s, hy - 16 * s, 18 * s, 12 * s);
  } };
}

function chartSet(ctx, shot) {
  const P = shot.params, look = P.look, pal = LK.palette(look), s = sc();
  const { layer, cv, g } = canvasLayer(ctx);
  // illustrative series for the look test only (not for publication)
  const yrs = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], v = [18.6, 18.9, 21.0, 19.6, 17.8, 18.4, 20.9, 20.5, 20.3];
  el(layer, `position:absolute;left:${120 * s}px;top:${110 * s}px;font:${64 * s}px/1 "Instrument Serif";color:${pal.ink}`, 'Oil through the strait');
  el(layer, `position:absolute;left:${123 * s}px;top:${190 * s}px;font:500 ${15 * s}px "Plex Mono";letter-spacing:.22em;color:${pal.inkSoft}`, 'MILLION BARRELS PER DAY');
  el(layer, `position:absolute;left:${120 * s}px;bottom:${56 * s}px;font:500 ${13 * s}px "Plex Mono";letter-spacing:.2em;color:${pal.inkSoft}`, 'ILLUSTRATIVE SERIES · LOOK-LAB TEST ONLY');
  const big = el(layer, `position:absolute;font:700 ${74 * s}px "Archivo Narrow";color:${pal.accent}`, '20.3');
  return { ...blank(), layer, update(t) {
    const Wd = cv.width, Ht = cv.height; g.fillStyle = pal.bg; g.fillRect(0, 0, Wd, Ht);
    const x0 = 140 * s, x1 = Wd - 380 * s, y0 = Ht - 160 * s, y1 = 300 * s, lo = 14, hi = 23;
    const X = (i) => x0 + (x1 - x0) * i / (yrs.length - 1), Y = (val) => y0 - (y0 - y1) * (val - lo) / (hi - lo);
    g.strokeStyle = pal.grid; g.lineWidth = 1; g.font = `500 ${17 * s}px "Plex Mono"`; g.fillStyle = pal.inkSoft;
    for (let val = 15; val <= 23; val += 2) { g.beginPath(); g.moveTo(x0, Y(val)); g.lineTo(x1, Y(val)); g.stroke(); g.fillText(String(val), x1 + 14 * s, Y(val) + 4 * s); }
    yrs.forEach((y, i) => g.fillText(String(y), X(i) - 22 * s, y0 + 38 * s));
    const k = K.outCubic(K.range(t, 0, 0.5)), n = (yrs.length - 1) * k;
    const pts = []; for (let i = 0; i <= Math.floor(n); i++) pts.push([X(i), Y(v[i])]);
    if (n % 1 > 0) { const i = Math.floor(n), f = n % 1; pts.push([K.lerp(X(i), X(i + 1), f), Y(K.lerp(v[i], v[i + 1], f))]); }
    const ag = g.createLinearGradient(0, y1, 0, y0); ag.addColorStop(0, pal.sea); ag.addColorStop(1, pal.bg);
    g.globalAlpha = 0.55; g.fillStyle = ag; g.beginPath(); g.moveTo(pts[0][0], y0); for (const q of pts) g.lineTo(...q); g.lineTo(pts[pts.length - 1][0], y0); g.closePath(); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = ['noir-sodium', 'blue-hour', 'golden-hour'].includes(look) ? pal.sea : pal.seaDeep; g.lineWidth = 3.5 * s; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo : g.moveTo).call(g, ...q)); g.stroke();
    const e = pts[pts.length - 1]; g.fillStyle = pal.accent; g.beginPath(); g.arc(e[0], e[1], 7 * s, 0, Math.PI * 2); g.fill();
    big.style.left = (e[0] / s + 26) * s + 'px'; big.style.top = (e[1] / s - 46) * s + 'px';
  } };
}

// ---------------------------------------------------------------- runtime
const SETS = { aerial, ship, city: citySet, map: mapSet, title: titleSet, chart: chartSet };
export default async function create(ctx) {
  const { renderer, shots } = ctx;
  await FT.ready();
  const live = new Map();
  for (const s of shots) live.set(s.id, await SETS[s.set](ctx, s));
  const layers = [...live.values()].map(v => v.layer).filter(Boolean);
  return {
    frame({ shot, t, p }) {
      const inst = live.get(shot.id);
      for (const l of layers) l.style.display = l === inst.layer ? '' : 'none';
      inst.update(t, p);
      if (!inst.custom) renderer.render(inst.scene, inst.camera);
    },
  };
}
