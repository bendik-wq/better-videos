// LEDGER runtime: 2D motion-graphics kit, vertical (1080x1920) or landscape (1920x1080) by the project's size. Every shot is a canvas set from ./sets (see README.md).
//
// An episode re-exports this runtime from its own scene.js:
//   export { default } from '/projects/micro1-kit/scene.js';                       // all overlays on
//   import { makeScene } from '/projects/micro1-kit/scene.js'; export default makeScene({ captions: false });
//
// Per frame: paper -> set (drawn in 1080x1920 design units, under a micro camera: slow push-in, drift and a
// kick on each of the set's hits) -> transition (engine/transitions.js or kit pop) -> global overlays
// (progress bar, source line, captions). Everything is a pure function of time: chunks render in any order.
import * as L from './kit/ledger.js';
import * as KT from './kit/trans.js';
import * as OV from './kit/overlays.js';
import * as TR from '/engine/transitions.js';
import SETS from './sets/index.js';
import { planCuts } from './cuts.mjs';

export function makeScene(opts = {}) {
  return async function create(ctx) {
    const { renderer, width, height, shots } = ctx;
    await L.loadFonts();
    L.setFrame(width, height); // portrait (1080x1920 units) or landscape (1920x1080 units) by canvas shape
    const k = width / L.W; // design units -> pixels
    const gl = renderer.domElement;
    const mk = () => { const c = document.createElement('canvas'); c.width = width; c.height = height; c.x = c.getContext('2d', { willReadFrequently: true, alpha: false }); return c; };
    const comp = mk(); comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.display = 'none'; // never composited: we draw no GL
    const cx = comp.x, prev = mk(), next = mk();
    const fx = TR.create({ width, height });
    const cuts = planCuts(shots); window.__plan = cuts;
    const paperC = L.paper(width, height, k);
    const ov = OV.create(shots, opts);
    const plans = new Map();
    const planOf = (shot) => {
      if (!plans.has(shot.id)) {
        const set = SETS[shot.set];
        if (!set) { if (!ctx.draft) throw new Error(`[micro1-kit] unknown set '${shot.set}' in ${shot.id} (have ${Object.keys(SETS).join(', ')})`); plans.set(shot.id, null); }
        else plans.set(shot.id, set.plan(shot));
      }
      return plans.get(shot.id);
    };

    // micro camera: slow push-in + drift + a decaying kick on every hit (slams, stamps, landings)
    function camera(t, shot, P) {
      const d = Math.max(1.5, shot.duration ?? 3), ph = (L.hash(shot.id) % 1000) / 1000 * 6.28;
      let s = 1 + 0.03 * L.smooth(t / d) + 0.006 * Math.sin(t * 0.8 + ph), dx = 7 * Math.sin(t * 0.55 + ph), dy = 6 * Math.sin(t * 0.43 + ph * 1.7), r = 0.002 * Math.sin(t * 0.37 + ph);
      for (const h of P?.hits ?? []) {
        const u = t - h.at; if (u < 0 || u > 0.45) continue;
        const e = Math.exp(-u * 12) * (h.amp ?? 1);
        s += 0.014 * e; dx += 7 * e * Math.sin(u * 62); dy += 5 * e * Math.cos(u * 55);
      }
      return { s, dx, dy, r };
    }
    function paintShot(x, index, t) {
      const shot = shots[index], P = planOf(shot);
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
      x.drawImage(paperC, 0, 0);
      const c = camera(t, shot, P), ox = L.SAFE.cx, oy = L.SAFE.cy;
      x.setTransform(k, 0, 0, k, 0, 0);
      x.translate(ox + c.dx, oy + c.dy); x.rotate(c.r); x.scale(c.s, c.s); x.translate(-ox, -oy);
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.lineCap = 'butt'; x.setLineDash([]); x.letterSpacing = '0px';
      if (P) SETS[shot.set].draw(x, t, shot, P);
      else { x.fillStyle = L.PAL.red; x.font = L.font(900, 90); x.fillText(`MISSING SET: ${shot.set}`, 90, 900); }
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    }

    let pending = null; const orig = window.__frame;
    window.__frame = async (T) => { orig(T); await pending; };
    return { frame(a) { pending = draw(a); return pending; } };

    async function draw({ T, shot, t, index }) {
      const cut = cuts[index] ?? { name: 'cut', dur: 0 };
      const inTr = index > 0 && cut.name !== 'cut' && cut.dur > 0 && t < cut.dur;
      if (inTr) {
        paintShot(prev.x, index - 1, shots[index - 1].duration + t);
        paintShot(next.x, index, t);
        const e = t / cut.dur;
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.drawImage(next, 0, 0);
        if (KT.has(cut.name)) KT.render(cx, cut.name, prev, next, e, width, height); else fx.render(cx, cut.name, prev, next, e, cut.opts);
      } else paintShot(cx, index, t);
      cx.setTransform(k, 0, 0, k, 0, 0); cx.globalAlpha = 1; cx.textAlign = 'left'; cx.letterSpacing = '0px';
      ov.draw(cx, T, shot, t);
      cx.setTransform(1, 0, 0, 1, 0, 0);
    }
  };
}

export default makeScene();
