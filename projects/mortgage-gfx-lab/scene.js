// MORTGAGE GRAPHICS LAB: a minimal runtime that loads only projects/mortgage/sets/graphics*.js with the same H contract
// as projects/mortgage/scene.js, so the bright 2D/2.5D sets can be look-dev'd independently of the 3D libraries.
//   node engine/render.mjs projects/mortgage-gfx-lab --stills=0.25,0.6,0.95   then   node projects/mortgage-gfx-lab/lab.mjs
import * as THREE from 'three';
import * as K from 'kit';
import * as M from '/engine/motion.js';
import * as KIT from '/projects/mortgage/sets/graphics-kit.js';

const LIBS = ['graphics', 'graphics-data', 'graphics-maps', 'graphics-docs'];
const loaded = [];
for (const n of LIBS) {
  try { const m = await import(`/projects/mortgage/sets/${n}.js`); loaded.push(m.default); }
  catch (e) { console.error(`[lab] sets/${n}.js not loaded:`, e.message, e.stack); }
}
const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
function base(ctx, { fov = 40 } = {}) { return { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.1, 3000), layer: layerOf(ctx) }; }
const H = { THREE, K, M, base, layerOf, sc: () => window.innerHeight / 1080, wt: M.wt, cue: KIT.cue };

export default async function create(ctx) {
  const { renderer, width, height } = ctx;
  const SETS = {}; for (const f of loaded) Object.assign(SETS, f(H));
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d');
  const live = new Map();
  let pending = null; const orig = window.__frame;
  window.__frame = async (T) => { orig(T); await pending; };
  return { frame(a) { pending = draw(a); return pending; } };
  async function draw({ shot, t, p }) {
    if (!live.has(shot.id)) {
      for (const [id, v] of live) { v.dispose?.(); v.layer?.remove(); live.delete(id); }
      const f = SETS[shot.set]; if (!f) throw new Error(`unknown set ${shot.set}`);
      live.set(shot.id, await f(ctx, shot));
    }
    const inst = live.get(shot.id); if (inst.layer) inst.layer.style.display = 'block';
    const t0 = performance.now();
    await inst.update(t, p);
    window.__gfxMs = (window.__gfxMs ?? []); window.__gfxMs.push([shot.id, performance.now() - t0]);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (inst.canvas) cx.drawImage(inst.canvas, 0, 0, width, height);
    else { renderer.render(inst.scene, inst.camera); cx.drawImage(gl, 0, 0, width, height); }
  }
}
