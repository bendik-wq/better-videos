// hormuz-lab: look-dev reel for the episode 3 sets (projects/hormuz/sets). Runtime: every shot is a set
// from makeHormuz(H); transitions come from engine/transitions.js (params.trans, default cut).
import * as THREE from 'three';
import * as K from 'kit';
import * as TR from '/engine/transitions.js';
import { makeHormuz } from '/projects/hormuz/sets/index.js';

const CAP = `font:500 .9em 'Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#f4efe6;line-height:1.6;text-shadow:0 1px 6px rgba(0,0,0,.45)`;
function base(ctx, { fov = 40 } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(fov, ctx.width / ctx.height, 0.1, 3000);
  const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(layer);
  return { scene, camera, layer };
}
const H = { THREE, K, base, CAP, RED: 0xe0241b, caption: (layer, text, css = 'left:6%;top:8%') => text ? K.div(layer, `${css};${CAP}`, text) : null,
  sourceLine: (layer, text) => text ? K.div(layer, `right:4%;bottom:4%;font:400 .7em 'Plex Mono',monospace;letter-spacing:.14em;color:rgba(255,255,255,.75);text-shadow:0 1px 4px rgba(0,0,0,.5)`, text) : null };

export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  window.__ctx = ctx; const lib = makeHormuz(H);
  const { preload, ...SETS } = lib;
  if (preload) await preload(ctx, shots);
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d', { willReadFrequently: true });
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d');
  const fx = TR.create({ width, height });
  const live = new Map(); window.__live = live;
  const get = async (shot, index) => {
    if (!live.has(shot.id)) { const f = SETS[shot.set]; if (!f) throw new Error('unknown set ' + shot.set); live.set(shot.id, { inst: await f(ctx, shot), index }); }
    for (const [id, v] of live) if (v.index < index - 1 || v.index > index + 1) { v.inst.dispose?.(); v.inst.layer?.remove(); live.delete(id); }
    return live.get(shot.id).inst;
  };
  // the stage calls frame() synchronously; frames here may await (set creation, footage), so the page's
  // __frame is wrapped to wait for the pending frame (render.mjs awaits whatever __frame returns)
  let pending = null; const orig = window.__frame;
  window.__frame = async (T) => { orig(T); await pending; };
  let lastShot = null;
  return { frame(a) { pending = draw(a); return pending; } };
  async function draw({ shot, t, p, index }) {
      const inst = await get(shot, index);
      const tr = shot.params?.trans ?? 'cut', T = TR.meta[tr]?.dur ?? 0;
      const inTr = index > 0 && T > 0 && t < T;
      if (inTr) { // the outgoing shot's frame at the cut point, rendered fresh (pure function of time)
        const ps = shots[index - 1], pi = await get(ps, index - 1);
        pi.update(ps.duration, 1); renderer.render(pi.scene, pi.camera); px.drawImage(gl, 0, 0, width, height);
      }
      for (const v of live.values()) if (v.inst.layer) v.inst.layer.style.display = v.inst === inst ? 'block' : 'none';
      await inst.update(t, p);
      renderer.render(inst.scene, inst.camera);
      if (inTr) fx.render(cx, tr, prev, gl, t / T, shot.params?.transOpts ?? {});
      else cx.drawImage(gl, 0, 0, width, height);
      lastShot = shot;
  }
}
