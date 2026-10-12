// THE 21 MILES THAT CONTROL THE WORLD (episode 3, the Strait of Hormuz): runtime. BRIGHT mode.
//
// Every shot in project.mjs names a `set`. Three set libraries, merged in this order (a later one wins):
//   makeHormuz(H)    ./sets/index.js     sea, ships, maps, footage
//   makeScenic(H)    ./sets/scenic.js    scenic / story sets (guarded: if it is missing, its shots render a
//                                        labelled slate under --draft and fail loudly in a final render)
//   makeGraphics(H)  ./sets/graphics.js  bright graphics: title, chapter, quote, numbers, bars, timeline,
//                                        doc, insurance, pump, flows
// A set factory is async: (ctx, shot) -> { scene, camera, layer, update(t, p), dispose?, canvas?, toneMapping?, render? }
//   canvas       a 2D canvas the set paints itself: the runtime composites it instead of rendering GL
//   toneMapping  a THREE tone-mapping constant for this set (default ACES, the stage's)
//   render(r)    the set renders itself (custom pipelines); otherwise renderer.render(scene, camera)
//
// Cutting: ./cuts.mjs planCuts() decides every transition from the shot list alone (params.trans wins);
// the same plan feeds score.transitions in project.mjs (scoreTransitions), so each transition has its
// sound. Transitions are engine/transitions.js on a 2D comp canvas; the outgoing shot is rendered live
// at (its duration + t), never frozen from an earlier frame, so a frame is a pure function of time and
// chunks render in any order. Type layers (DOM) cross-fade with TR.layerMix.
import * as THREE from 'three';
import * as K from 'kit';
import * as TR from '/engine/transitions.js';
import * as M from '/engine/motion.js';
import * as LK from '/engine/looks.js';
import * as CAM from '/engine/camera.js';
import * as C from '/engine/cine.js';
import { makeHormuz } from '/projects/hormuz/sets/index.js';
import { makeGraphics } from '/projects/hormuz/sets/graphics.js';
import { planCuts } from '/projects/hormuz/cuts.mjs';

let makeScenic = null, scenicError = null;
try { ({ makeScenic } = await import('/projects/hormuz/sets/scenic.js')); } catch (e) { scenicError = e; console.warn('[hormuz] sets/scenic.js not loaded:', e.message); }

// ---------------------------------------------------------------- helpers handed to every set library (H)
const PAL = LK.palette('bright-day');
const sc = () => window.innerHeight / 1080;
const CAP = `font:500 .9em 'Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:${PAL.plateInk};line-height:1.6;text-shadow:${PAL.shadow}`;
const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
function base(ctx, { fov = 40 } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.1, 3000);
  return { scene, camera, layer: layerOf(ctx) };
}
// light type over pictures sits on a soft shadow plate from its corner (bright-mode rule 17), never naked
function plate(layer, corner = 'tl', { w = 1150, h = 430, alpha = 1 } = {}) {
  const s = sc(), at = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%' }[corner];
  const pos = `${corner[0] === 't' ? 'top' : 'bottom'}:0;${corner[1] === 'l' ? 'left' : 'right'}:0`;
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;${pos};width:${w * s}px;height:${h * s}px;opacity:${alpha};background:radial-gradient(ellipse at ${at}, ${PAL.plate} 0%, rgba(8,20,38,0) 70%)`;
  layer.insertBefore(d, layer.firstChild); return d;
}
const caption = (layer, text, css = 'left:6%;top:8%') => { if (!text) return null; plate(layer, /right/.test(css) ? 'tr' : 'tl', { w: 1000, h: 300 }); return K.div(layer, `${css};${CAP}`, text); };
const sourceLine = (layer, text) => { if (!text) return null; plate(layer, 'br', { w: 900, h: 170, alpha: 0.75 });
  return K.div(layer, `right:4.2%;bottom:4.6%;font:500 .62em 'Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(251,248,242,.86);text-shadow:${PAL.shadow}`, text); };
const H = { THREE, K, M, LK, CAM, C, TR, PAL, pal: PAL, base, layerOf, plate, CAP, RED: 0xe0241b, caption, sourceLine, sc, wt: M.wt };

// ---------------------------------------------------------------- slate for a missing or failing set (draft only)
function slate(ctx, shot, msg) {
  const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height; const g = cv.getContext('2d');
  const s = ctx.height / 1080; const layer = layerOf(ctx);
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, update() {
    g.fillStyle = PAL.bg; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = PAL.accent; g.lineWidth = 3 * s; g.strokeRect(60 * s, 60 * s, cv.width - 120 * s, cv.height - 120 * s);
    g.fillStyle = PAL.ink; g.font = `${72 * s}px "Instrument Serif"`; g.fillText(`${shot.set}`, 120 * s, 470 * s);
    g.font = `500 ${20 * s}px "Plex Mono"`; g.fillStyle = PAL.accent; g.fillText(`MISSING SET · ${shot.id}`, 122 * s, 380 * s);
    g.fillStyle = PAL.inkSoft; g.fillText(String(msg).slice(0, 110).toUpperCase(), 122 * s, 540 * s);
    g.fillText(JSON.stringify(shot.params ?? {}).slice(0, 110), 122 * s, 590 * s);
  } };
}

export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  window.__ctx = ctx;
  const libs = [makeHormuz(H), makeScenic ? makeScenic(H) : {}, makeGraphics(H)];
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
  const ACES = renderer.toneMapping;

  const live = new Map(); window.__live = live;
  async function make(shot) {
    const f = SETS[shot.set];
    try {
      if (!f) throw new Error(`unknown set '${shot.set}'${scenicError ? ' (sets/scenic.js: ' + scenicError.message + ')' : ''}`);
      return await f(ctx, shot);
    } catch (e) {
      if (!ctx.draft) throw e;
      console.error(`[hormuz] ${shot.id} (${shot.set}): ${e.message}`);
      return slate(ctx, shot, e.message);
    }
  }
  const get = async (index) => {
    const shot = shots[index];
    if (!live.has(shot.id)) live.set(shot.id, { inst: await make(shot), index });
    for (const [id, v] of live) if (v.index < index - 1 || v.index > index + 1) { v.inst.dispose?.(); v.inst.layer?.remove(); live.delete(id); }
    return live.get(shot.id).inst;
  };
  // paint a set's picture for shot time t into the 2D context x (or leave it in the GL canvas when x is null)
  async function paint(inst, t, p, x) {
    await inst.update(t, p);
    if (inst.canvas) { if (x) { x.globalCompositeOperation = 'copy'; x.drawImage(inst.canvas, 0, 0, width, height); x.globalCompositeOperation = 'source-over'; } return inst.canvas; }
    renderer.toneMapping = inst.toneMapping ?? ACES;
    if (inst.render) inst.render(renderer); else renderer.render(inst.scene, inst.camera);
    renderer.toneMapping = ACES;
    if (x) { x.globalCompositeOperation = 'copy'; x.drawImage(gl, 0, 0, width, height); x.globalCompositeOperation = 'source-over'; }
    return gl;
  }

  // the stage calls frame() synchronously; frames here await (set creation, footage), so the page's
  // __frame is wrapped to wait for the pending frame (render.mjs awaits whatever __frame returns)
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
      // the outgoing shot keeps moving through the transition (its clock runs on past its end)
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
