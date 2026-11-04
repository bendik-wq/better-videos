// THE HACKERS WHO CAN TURN OFF THE POWER (episode 4): runtime. LIVE WIRE mode (projects/blackout/STYLE.md).
//
// Every shot in project.mjs names a `set`. Set libraries, merged in this order (a later one wins):
//   makeScreens(H)   ./sets/screens.js   CRT graphics: scope, chapter, title, numbers, quote, map-ops, terminal screen
//   makeGrid(H)      ./sets/grid.js      oneline (draw, trip, extrude), cursor (subpixel macro)
//   makeRooms(H)     ./sets/rooms.js     control-room (the dispatch centre, its operators, the town outside)
//   makeStill(H)     ./sets/still.js     flash (direct-flash stills), doc, quote printout, terminal (attacker's hands)
//   makeOutside(H)   ./sets/outside.js   substation, city-dark
//   makeOrbit(H)     ./sets/orbit.js     orbit-lights, cold-open (the oner)
//   makeFootage(H)   ./sets/footage.js   footage
// A set factory is async: (ctx, shot) -> { scene, camera, layer, update(t, p), dispose?, canvas?, toneMapping?, render? }
//   canvas       a 2D canvas the set paints itself: the runtime composites it instead of rendering GL
//   toneMapping  a THREE tone-mapping constant for this set (default ACES, the stage's)
//   render(r)    the set renders itself (custom pipelines, the CRT pass); otherwise renderer.render(scene, camera)
// Any shot may carry params.scope ('steady' | 'stutter' | 'flat' | 'drop' or drawScope opts, plus scopeCorner):
// the 50 Hz heartbeat in a corner of its type layer.
//
// Cutting: ./cuts.mjs planCuts() decides every transition from the shot list alone (params.trans wins); the
// same plan feeds the score (scoreTransitions + transitionCues), so each transition has its sound. Engine
// transitions come from engine/transitions.js, the four power cuts from ./sets/power-cuts.js, both on a 2D comp
// canvas; the outgoing shot is rendered live at (its duration + t), never frozen, so a frame is a pure function
// of time and chunks render in any order. Type layers (DOM) cross-fade with layerMix.
import * as THREE from 'three';
import * as K from 'kit';
import * as TR from '/engine/transitions.js';
import * as M from '/engine/motion.js';
import * as CAM from '/engine/camera.js';
import * as C from '/engine/cine.js';
import * as LW from '/projects/blackout/sets/lw.js';
import * as PC from '/projects/blackout/sets/power-cuts.js';
import { planCuts } from '/projects/blackout/cuts.mjs';

const LIBS = ['screens', 'grid', 'rooms', 'still', 'outside', 'orbit', 'footage'];
const loaded = [], loadErrors = {};
for (const n of LIBS) {
  try { const m = await import(`/projects/blackout/sets/${n}.js`); loaded.push(m.default ?? Object.values(m).find(f => typeof f === 'function' && /^make/.test(f.name))); }
  catch (e) { loadErrors[n] = e; console.warn(`[blackout] sets/${n}.js not loaded:`, e.message); }
}

// ---------------------------------------------------------------- helpers handed to every set library (H)
const PAL = LW.PAL;
const sc = () => window.innerHeight / 1080;
const CAP = `font:400 1.5em ${LW.FONT.term};letter-spacing:.06em;text-transform:uppercase;color:${PAL.fluoro};line-height:1.15;text-shadow:0 0 8px rgba(93,255,158,.45),0 0 2px rgba(0,0,0,.9)`;
const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
function base(ctx, { fov = 40, near = 0.05, far = 3000 } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, near, far);
  return { scene, camera, layer: layerOf(ctx) };
}
// light type on pictures sits on a soft black plate from its corner, never naked
function plate(layer, corner = 'tl', { w = 1100, h = 380, alpha = 0.85 } = {}) {
  const s = sc(), at = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%' }[corner];
  const pos = `${corner[0] === 't' ? 'top' : 'bottom'}:0;${corner[1] === 'l' ? 'left' : 'right'}:0`;
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;${pos};width:${w * s}px;height:${h * s}px;opacity:${alpha};background:radial-gradient(ellipse at ${at}, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 70%)`;
  layer.insertBefore(d, layer.firstChild); return d;
}
// captions: VT323 terminal caps, typed on (the caller drives .type(t))
function caption(layer, text, css = 'left:5.5%;top:7.5%', { at = 0.35, cps = 26 } = {}) {
  if (!text) return null;
  plate(layer, /right/.test(css) ? (/bottom/.test(css) ? 'br' : 'tr') : (/bottom/.test(css) ? 'bl' : 'tl'), { w: 1000, h: 300 });
  const el = K.div(layer, `opacity:1;${css};${CAP}`, '');
  el.type = (t) => { if (t < at - 0.05) { el.innerHTML = ''; return; } const n = LW.typeCount(text, t, at, cps, 3); el.innerHTML = LW.typed(text, n).replace(/ /g, '&nbsp;') + (n < text.length || Math.floor(t * 2.2) % 2 === 0 ? '<span style="opacity:.85">▌</span>' : ''); };
  el.type(0); return el;
}
const sourceLine = (layer, text) => { if (!text) return null; plate(layer, 'br', { w: 900, h: 170, alpha: 0.75 });
  return K.div(layer, `opacity:1;right:4.2%;bottom:4.6%;font:500 .62em 'Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(216,255,230,.78);text-shadow:0 0 10px rgba(0,0,0,.8)`, text); };
const H = { THREE, K, M, CAM, C, TR, LW, PAL, pal: PAL, base, layerOf, plate, CAP, RED: LW.RED, caption, sourceLine, sc, wt: M.wt, cue: LW.cue };

// ---------------------------------------------------------------- slate for a missing or failing set (draft only)
function slate(ctx, shot, msg) {
  const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height; const g = cv.getContext('2d');
  const s = ctx.height / 1080; const layer = layerOf(ctx);
  return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, update() {
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = PAL.red; g.lineWidth = 3 * s; g.strokeRect(60 * s, 60 * s, cv.width - 120 * s, cv.height - 120 * s);
    g.fillStyle = PAL.phosphor; g.font = `${90 * s}px ${LW.FONT.display}`; g.fillText(`${shot.set}`, 120 * s, 470 * s);
    g.font = `${30 * s}px ${LW.FONT.term}`; g.fillStyle = PAL.red; g.fillText(`MISSING SET · ${shot.id}`, 122 * s, 380 * s);
    g.fillStyle = PAL.inkSoft; g.fillText(String(msg).slice(0, 110).toUpperCase(), 122 * s, 540 * s);
    g.fillText(JSON.stringify(shot.params ?? {}).slice(0, 110), 122 * s, 590 * s);
  } };
}

export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  window.__ctx = ctx;
  await LW.loadFonts();
  const libs = loaded.map(f => f(H));
  const SETS = {};
  for (const lib of libs) { const { preload, ...sets } = lib; Object.assign(SETS, sets); }
  for (const lib of libs) if (typeof lib.preload === 'function') await lib.preload(ctx, shots);

  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d', { willReadFrequently: true });
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d', { willReadFrequently: true });
  const next = document.createElement('canvas'); next.width = width; next.height = height; const nx = next.getContext('2d', { willReadFrequently: true });
  const fx = TR.create({ width, height }), pc = PC.create({ width, height });
  const plan = planCuts(shots, { ...TR.meta, ...PC.META });
  window.__plan = plan;
  const ACES = renderer.toneMapping;

  const live = new Map(); window.__live = live;
  async function make(shot) {
    const f = SETS[shot.set];
    try {
      if (!f) throw new Error(`unknown set '${shot.set}'${Object.keys(loadErrors).length ? ' (' + Object.entries(loadErrors).map(([k, e]) => `sets/${k}.js: ${e.message}`).join('; ') + ')' : ''}`);
      const inst = await f(ctx, shot);
      // the 50 Hz heartbeat in a corner of any shot
      if (shot.params?.scope && inst.layer) {
        const cs = LW.cornerScope(inst.layer, ctx, shot.params.scope, { corner: shot.params.scopeCorner ?? 'tr' });
        const up = inst.update.bind(inst); inst.update = async (t, p) => { await up(t, p); cs.update(t); };
      }
      return inst;
    } catch (e) {
      if (!ctx.draft) throw e;
      console.error(`[blackout] ${shot.id} (${shot.set}): ${e.message}\n${e.stack}`);
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
    renderer.toneMapping = inst.toneMapping ?? ACES;
    if (inst.render) inst.render(renderer); else renderer.render(inst.scene, inst.camera);
    renderer.toneMapping = ACES;
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
      const e = t / cut.dur, isPC = !!PC.META[cut.name];
      if (isPC) pc.render(cx, cut.name, prev, next, e, cut.opts); else fx.render(cx, cut.name, prev, next, e, cut.opts);
      const mix = isPC ? PC.layerMix(cut.name, e) : TR.layerMix(cut.name, e);
      if (out.layer) out.layer.style.opacity = mix.out.toFixed(4);
      if (inst.layer) inst.layer.style.opacity = mix.in.toFixed(4);
    } else {
      await paint(inst, t, p, cx);
      if (inst.layer) inst.layer.style.opacity = '1';
    }
  }
}
