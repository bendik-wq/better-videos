// THE CANAL THAT RUNS ON RAIN (episode 5): runtime. BRIGHT MODEL look (docs/library/bright-style/STYLE.md §13).
//
// Every shot in project.mjs names a `set`. Set libraries are loaded from ./sets/<name>.js in the order of LIBS (a later
// one wins on a name clash), plus any extra names listed in ./sets/libs.json (a JSON array of file stems). A library
// that is missing or fails to load is skipped (its error shows on the slate of any shot that needs it).
//   clay-locks    ./sets/clay-locks.js    lock, pools, expansion, hourglass              (3D, clay)
//   clay-land     ./sets/clay-land.js     section, french-cut, valley-flood, culebra, rio-indio
//   clay-aerial   ./sets/clay-aerial.js   aerial, queue
//   oner          ./sets/oner.js          cold-open (the oner)
//   graphics*     ./sets/graphics*.js     2D / data / maps / archive (second agent)
// The parameters of every set are documented in projects/panama/SETS.md.
//
// A library module's default export (or its first exported function named make*) is a factory (H) -> { setName: factory,
// ..., preload?(ctx, shots) }. A set factory is async: (ctx, shot) -> { scene, camera, layer, update(t, p), dispose?,
// canvas?, toneMapping?, render? }
//   canvas       a 2D canvas the set paints itself: the runtime composites it instead of rendering GL
//   toneMapping  a THREE tone-mapping constant for this set (default: Khronos PBR Neutral, the bright look; sets that
//                use engine/post.js do their own tone mapping in the chain)
//   render(r)    the set renders itself; otherwise renderer.render(scene, camera)
//
// Cutting: ./cuts.mjs planCuts() decides every transition from the shot list alone (params.trans wins); the same plan
// feeds the score (scoreTransitions), so each transition has its sound. Transitions come from engine/transitions.js on a
// 2D comp canvas; the outgoing shot is rendered live at (its duration + t), never frozen, so a frame is a pure function
// of time and chunks render in any order. Type layers (DOM) cross-fade with layerMix.
import * as THREE from 'three';
import * as K from 'kit';
import * as TR from '/engine/transitions.js';
import * as M from '/engine/motion.js';
import * as CAM from '/engine/camera.js';
import * as C from '/engine/cine.js';
import * as P from '/engine/post.js';
import * as LK from '/engine/looks.js';
import * as CK from '/projects/panama/sets/clay-kit.js';
import { planCuts } from '/projects/panama/cuts.mjs';

const ROOT = '/projects/panama/sets/';
const LIBS = ['graphics', 'graphics-data', 'graphics-maps', 'graphics-archive', 'clay-locks', 'clay-land', 'clay-aerial', 'oner'];
let extra = [];
try { const r = await fetch(ROOT + 'libs.json'); if (r.ok) extra = await r.json(); } catch { /* optional */ }
const loaded = [], loadErrors = {};
for (const n of [...LIBS, ...extra.filter(x => !LIBS.includes(x))]) {
  try {
    const m = await import(`${ROOT}${n}.js`);
    const f = m.default ?? Object.values(m).find(f => typeof f === 'function' && /^make/.test(f.name));
    if (typeof f === 'function') loaded.push([n, f]);
  } catch (e) { if (!/Failed to fetch dynamically imported module/i.test(e.message)) loadErrors[n] = e; console.warn(`[panama] sets/${n}.js not loaded:`, e.message); }
}

// ---------------------------------------------------------------- helpers handed to every set library (H)
const PAL = { ...LK.palette('bright-model'), ...CK.PAL };
const sc = () => window.innerHeight / 1080;
// house type: Primal/Neo slabs and Wendover pills; never naked white type on a bright sky (STYLE.md §7)
const CAP = `font:700 1.9em ${CK.FONT.ui};letter-spacing:.02em;text-transform:uppercase;color:#fff;line-height:1.05;background:${PAL.plate};padding:.22em .5em .18em;display:inline-block`;
const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
// base(ctx, { fov, near, far (the camera), light (true: CK.brightLight with the rest: target, span, fog, fogNear, fogFar, bg, az, el, ...) })
function base(ctx, { fov = 40, near = 0.5, far = 20000, light = true, ...lo } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, near, far);
  const sun = light ? CK.brightLight(scene, lo) : null;
  return { scene, camera, layer: layerOf(ctx), sun };
}
// a soft pale wash behind type that sits on a busy picture (the bright counterpart of blackout's black plate)
function plate(layer, corner = 'tl', { w = 1100, h = 380, alpha = 0.55, color = '251,250,247' } = {}) {
  const s = sc(), at = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%' }[corner];
  const pos = `${corner[0] === 't' ? 'top' : 'bottom'}:0;${corner[1] === 'l' ? 'left' : 'right'}:0`;
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;${pos};width:${w * s}px;height:${h * s}px;opacity:${alpha};background:radial-gradient(ellipse at ${at}, rgba(${color},.8) 0%, rgba(${color},0) 70%)`;
  layer.insertBefore(d, layer.firstChild); return d;
}
// caption: black slab, white caps (Primal Space), wiped on left to right; the caller drives .type(t)
function caption(layer, text, css = 'left:5.5%;top:7.5%', { at = 0.35, dur = 0.45 } = {}) {
  if (!text) return null;
  const el = K.div(layer, `opacity:1;${css};${CAP}`, String(text));
  el.type = (t) => { const k = CK.outCubic(CK.range(t, at, at + dur)); el.style.clipPath = `inset(0 ${(100 - k * 100).toFixed(2)}% 0 0)`; el.style.opacity = k > 0 ? '1' : '0'; };
  el.type(0); return el;
}
const sourceLine = (layer, text) => { if (!text) return null;
  return K.div(layer, `opacity:1;right:3.6%;bottom:4.2%;font:500 .66em ${CK.FONT.mono},monospace;letter-spacing:.14em;text-transform:uppercase;color:${PAL.ink};background:rgba(251,248,242,.82);padding:.35em .7em;border-radius:.3em`, text); };
// white pill label with a pointer (Wendover), positioned each frame: pill.at(x, y) in 1080p px (anchor = pointer tip)
function pill(layer, html, { size = 28, color = PAL.ink, bg = PAL.pill, dot = null } = {}) {
  const s = sc(); const e = K.div(layer, `opacity:1;padding:${7 * s}px ${18 * s}px;background:${bg};border-radius:${30 * s}px;box-shadow:0 ${2 * s}px ${14 * s}px rgba(15,30,51,.28);font:600 ${size * s}px ${CK.FONT.ui};color:${color};white-space:nowrap;transform:translate(-50%,-100%)`,
    (dot ? `<span style="display:inline-block;width:.55em;height:.55em;border-radius:50%;background:${dot};margin-right:.4em;vertical-align:.05em"></span>` : '') + html);
  const tip = K.div(layer, `opacity:1;width:0;height:0;border-left:${9 * s}px solid transparent;border-right:${9 * s}px solid transparent;border-top:${10 * s}px solid ${bg};transform:translate(-50%,-100%)`);
  e.at = (x, y, a = 1) => { e.style.left = `${x * s}px`; e.style.top = `${(y - 10) * s}px`; tip.style.left = `${x * s}px`; tip.style.top = `${y * s}px`; e.style.opacity = tip.style.opacity = String(a); };
  return e;
}
// black slab, white caps (Primal Space), at a fixed spot
function slab(layer, html, css = 'left:6%;top:8%', { size = 44 } = {}) {
  const s = sc(); return K.div(layer, `opacity:1;${css};padding:${8 * s}px ${16 * s}px;background:${PAL.plate};color:#fff;font:700 ${size * s}px/1.0 ${CK.FONT.ui};letter-spacing:.01em;text-transform:uppercase;white-space:nowrap`, html);
}
const H = { THREE, K, M, CAM, C, P, TR, LK, CK, CLAY: CK, LW: CK, PAL, pal: PAL, HOUSE: CK.HOUSE, base, layerOf, plate, CAP, RED: CK.RED, caption, sourceLine, pill, slab, sc, wt: M.wt, cue: CK.cue, FONT: CK.FONT };

// ---------------------------------------------------------------- slate for a missing or failing set (draft only)
function slate(ctx, shot, msg) {
  const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height; const g = cv.getContext('2d');
  const s = ctx.height / 1080; const layer = layerOf(ctx);
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, update() {
    g.fillStyle = PAL.void; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = PAL.red; g.lineWidth = 3 * s; g.strokeRect(60 * s, 60 * s, cv.width - 120 * s, cv.height - 120 * s);
    g.fillStyle = PAL.ink; g.font = `700 ${90 * s}px ${CK.FONT.ui}`; g.fillText(`${shot.set}`, 120 * s, 470 * s);
    g.font = `500 ${28 * s}px ${CK.FONT.mono}`; g.fillStyle = PAL.red; g.fillText(`MISSING SET · ${shot.id}`, 122 * s, 380 * s);
    g.fillStyle = PAL.inkSoft; g.fillText(String(msg).slice(0, 110), 122 * s, 540 * s);
    g.fillText(JSON.stringify(shot.params ?? {}).slice(0, 110), 122 * s, 590 * s);
  } };
}

export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  window.__ctx = ctx;
  await CK.loadFonts();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const libs = loaded.map(([n, f]) => { try { return f(H); } catch (e) { loadErrors[n] = e; console.warn(`[panama] sets/${n}.js factory failed:`, e.message); return {}; } });
  const SETS = {};
  for (const lib of libs) { const { preload, ...sets } = lib; Object.assign(SETS, sets); }
  for (const lib of libs) if (typeof lib.preload === 'function') await lib.preload(ctx, shots);

  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d', { willReadFrequently: true });
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d', { willReadFrequently: true });
  const next = document.createElement('canvas'); next.width = width; next.height = height; const nx = next.getContext('2d', { willReadFrequently: true });
  const fx = TR.create({ width, height });
  const plan = planCuts(shots, TR.meta);
  window.__plan = plan;
  const STAGE_TM = renderer.toneMapping, TM = THREE.NeutralToneMapping ?? STAGE_TM;

  const live = new Map(); window.__live = live;
  async function make(shot) {
    const f = SETS[shot.set];
    try {
      if (!f) throw new Error(`unknown set '${shot.set}'${Object.keys(loadErrors).length ? ' (' + Object.entries(loadErrors).map(([k, e]) => `sets/${k}.js: ${e.message}`).join('; ') + ')' : ''}`);
      return await f(ctx, shot);
    } catch (e) {
      if (!ctx.draft && !shot.params?.allowSlate) throw e;
      console.error(`[panama] ${shot.id} (${shot.set}): ${e.message}\n${e.stack}`);
      return slate(ctx, shot, e.message);
    }
  }
  const get = async (index) => {
    const shot = shots[index];
    if (!live.has(shot.id)) live.set(shot.id, { inst: await make(shot), index });
    for (const [id, v] of live) if (v.index < index - 1 || v.index > index + 1) { v.inst.dispose?.(); v.inst.layer?.remove(); live.delete(id); }
    return live.get(shot.id).inst;
  };
  const put = (x, src) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over'; x.drawImage(src, 0, 0, width, height); };
  async function paint(inst, t, p, x) {
    await inst.update(t, p);
    if (inst.canvas) { if (x) put(x, inst.canvas); return inst.canvas; }
    renderer.toneMapping = inst.toneMapping ?? TM;
    if (inst.render) inst.render(renderer); else renderer.render(inst.scene, inst.camera);
    renderer.toneMapping = STAGE_TM;
    if (x) put(x, gl);
    return gl;
  }

  let pending = null; const orig = window.__frame;
  window.__frame = async (T) => { orig(T); await pending; };
  return { frame(a) { pending = draw(a); return pending; } };

  async function draw({ shot, t, p, index }) {
    const inst = await get(index);
    const cut = plan[index] ?? { name: 'cut', dur: 0 };
    const inTr = index > 0 && cut.name !== 'cut' && cut.dur > 0 && t < cut.dur;
    const out = inTr ? await get(index - 1) : null;
    for (const v of live.values()) if (v.inst.layer) v.inst.layer.style.display = (v.inst === inst || v.inst === out) ? 'block' : 'none';
    if (inTr) {
      const ps = shots[index - 1];
      await paint(out, ps.duration + t, 1, px);
      await paint(inst, t, p, nx);
      const e = t / cut.dur;
      fx.render(cx, cut.name, prev, next, e, cut.opts);
      const mix = TR.layerMix(cut.name, e);
      if (out.layer) out.layer.style.opacity = mix.out.toFixed(4);
      if (inst.layer) inst.layer.style.opacity = mix.in.toFixed(4);
    } else {
      await paint(inst, t, p, cx);
      if (inst.layer) inst.layer.style.opacity = '1';
    }
  }
}
