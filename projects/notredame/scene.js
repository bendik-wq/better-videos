// NOTRE-DAME WAS 30 MINUTES FROM COLLAPSE (episode 10): runtime. "Paper & Spring" 2D look
// (docs/library/animation-study/STYLE-BIBLE.md). No GL: every set is a 2D canvas set from
//   ./sets/nd-sets.js      cathedral, forest, spireFall, bellFrame, clock, paris, firefighters
//   ./sets/nd-graphics.js  title, chapter, quote, doc, bignumber, counter, timeline, compare, winder
// A set factory is async (ctx, shot) -> { layer, canvas, update(t, p) }; the runtime keeps the set's layer hidden and
// composites its canvas onto one comp canvas (so two shots can be mixed by a transition).
//
// Cutting: ./cuts.mjs planCuts() decides every transition from the shot list alone (params.trans wins); the same plan
// feeds the score. Engine names (engine/transitions.js) render through TR.create(); the Paper & Spring moves (case-open,
// loupe, gear-mesh, tape-feed, card-flip, fold-away, dip-ink) are drawn here. The outgoing shot is rendered live at
// (its duration + t), never frozen, so a frame is a pure function of time and chunks render in any order.
// Preview projects (projects/nd-ch<N>) re-export this file; the runtime only ever looks at ctx.shots.
import * as THREE from 'three';
import * as TR from '/engine/transitions.js';
import * as M from '/engine/motion.js';
import { SETS as HERO, KIT } from '/projects/notredame/sets/nd-sets.js';
import { GSETS } from '/projects/notredame/sets/nd-graphics.js';
import { planCuts, CUSTOM } from '/projects/notredame/cuts.mjs';

const SETS = { ...HERO, ...GSETS };
const { P, MIS, gearPath } = KIT;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const inOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const inOutQuart = (u) => (u < 0.5 ? 8 * u ** 4 : 1 - Math.pow(-2 * u + 2, 4) / 2);
const outCubic = (u) => 1 - Math.pow(1 - u, 3);
const inOutBack = M.E.inOutBack;

// ---------------------------------------------------------------- cue resolution (runtime, before a set is built)
// The graphics sets resolve word cues themselves; the hero sets (nd-sets.js) only take seconds. So for every param key
// named `at`, `…At` or `…Dur` (at any depth: zoomTo.at, steps[i].at) the runtime turns a string into seconds:
//   'Feu'  'minutes@1' (2nd time said)  'fell+0.3'  'fell-0.2'   -> the word's start in this clip (+ offset)
//   '40%'  '40%+0.2'                                              -> that fraction of the clip's duration
// A word the narration lacks: graphics sets keep the string (their own default schedule); hero sets get `fallback`
// (the fraction in params.cueFallback, default 0.25 of the clip) and a console warning.
const normW = (w) => String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
export function cueTime(shot, spec) {
  if (typeof spec === 'number') return spec;
  const s = String(spec).trim();
  const pc = s.match(/^([\d.]+)%([+-][\d.]+)?$/); if (pc) return (shot.duration ?? 0) * (+pc[1] / 100) + Number(pc[2] ?? 0);
  const m = s.match(/^(.+?)(?:@(\d+))?([+-][\d.]+)?$/); if (!m) return null;
  const hits = (shot.words ?? []).filter(x => normW(x.w).startsWith(normW(m[1])));
  if (!hits.length) return null;
  return (hits[Number(m[2] ?? 0)] ?? hits.at(-1)).s + Number(m[3] ?? 0);
}
const CUE_KEY = /^(at|.+At|dur|.+Dur)$/;
function resolveCues(shot, hero) {
  const fb = (shot.duration ?? 4) * (shot.params?.cueFallback ?? 0.25);
  const walk = (v, key) => {
    if (Array.isArray(v)) return v.map(x => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    if (typeof v === 'string' && key && CUE_KEY.test(key)) { const t = cueTime(shot, v); if (t != null) return +t.toFixed(3);
      if (hero) { console.warn(`[notredame] ${shot.id}: cue "${v}" (${key}) not in the narration; using ${fb.toFixed(2)} s`); return fb; } }
    return v;
  };
  return { ...shot, params: walk(shot.params ?? {}, null) };
}

// ---------------------------------------------------------------- slate for a missing or failing set (draft only)
function slate(ctx, shot, msg) {
  const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height; const g = cv.getContext('2d'); const s = ctx.height / 1080;
  return { canvas: cv, update() {
    g.fillStyle = P.paper; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = P.red; g.lineWidth = 3 * s; g.strokeRect(60 * s, 60 * s, cv.width - 120 * s, cv.height - 120 * s);
    g.fillStyle = P.ink; g.font = `700 ${90 * s}px "Archivo Narrow"`; g.fillText(`${shot.set}`, 120 * s, 470 * s);
    g.font = `500 ${28 * s}px "Plex Mono"`; g.fillStyle = P.red; g.fillText(`MISSING SET · ${shot.id}`, 122 * s, 380 * s);
    g.fillStyle = P.ink70; g.fillText(String(msg).slice(0, 110), 122 * s, 540 * s);
    g.fillText(JSON.stringify(shot.params ?? {}).slice(0, 110), 122 * s, 590 * s);
  } };
}

// ---------------------------------------------------------------- the Paper & Spring transitions (2D, pure in e)
// x: comp context (W x H); A, B: outgoing / incoming frames (canvases); e: 0..1; o: opts ({ dir, seed, at, hinge, y })
function makeCustom(W, H) {
  const k = H / 1080;
  const put = (x, img, { s = 1, cx = W / 2, cy = H / 2, dx = 0, dy = 0, r = 0, a = 1 } = {}) => {
    x.save(); x.globalAlpha = a; x.translate(cx + dx, cy + dy); if (r) x.rotate(r); x.scale(s, s); x.drawImage(img, -cx, -cy, W, H); x.restore(); };
  const shade = (x, color, a, box = [0, 0, W, H]) => { if (a <= 0) return; x.save(); x.globalAlpha = Math.min(1, a); x.fillStyle = color; x.fillRect(...box); x.restore(); };
  const inkLine = (x, draw, lw, color = P.ink) => { x.save(); x.strokeStyle = color; x.lineWidth = lw; x.lineCap = 'round';
    x.translate(MIS[0] * k * 0.5, MIS[1] * k * 0.5); draw(x); x.stroke(); x.restore(); };
  const T = {
    // T1: A is a watch-back lid hinged on its top (or left) edge; it swings up and away, B (the mechanism) settles under it
    'case-open'(x, A, B, e, o) {
      const u = inOutBack(clamp(e)), th = clamp(u, 0, 1.08) * Math.PI / 2, c = Math.max(0, Math.cos(th));
      const left = o.hinge === 'left';
      put(x, B, { s: lerp(1.07, 1, clamp(u, 0, 1.2)) });
      const L = (left ? W : H) * c;
      // the lid's hard shadow on the mechanism (lamp at 10 o'clock: falls down-right of the lid edge)
      const sh = 0.38 * (1 - c) * (c > 0 ? 1 : 0), gr = left ? x.createLinearGradient(L, 0, L + 220 * k, 0) : x.createLinearGradient(0, L, 0, L + 200 * k);
      gr.addColorStop(0, `rgba(20,35,61,${sh})`); gr.addColorStop(1, 'rgba(20,35,61,0)');
      x.save(); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.restore();
      if (c > 0.002) {
        x.save(); if (left) x.drawImage(A, 0, 0, L, H); else x.drawImage(A, 0, 0, W, L); x.restore();
        shade(x, P.ink, 0.45 * (1 - c), left ? [0, 0, L, H] : [0, 0, W, L]);
        // brass rim on the lid's free edge, printed off-register
        x.save(); x.fillStyle = P.brass; if (left) x.fillRect(L - 12 * k, 0, 12 * k, H); else x.fillRect(0, L - 12 * k, W, 12 * k); x.restore();
        inkLine(x, (g) => { g.beginPath(); if (left) { g.moveTo(L, 0); g.lineTo(L, H); } else { g.moveTo(0, L); g.lineTo(W, L); } }, 3 * k);
      }
    },
    // T2: a brass loupe ring opens on o.at, showing B at 3.5x; the lens grows until it fills the frame
    'loupe'(x, A, B, e, o) {
      const [au, av] = o.at ?? [0.5, 0.5], cx = au * W, cy = av * H;
      const rFull = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.08;
      const r0 = 170 * k, r = e < 0.3 ? r0 * M.E.outBack(e / 0.3) : lerp(r0, rFull, Math.pow((e - 0.3) / 0.7, 2.2));
      const zs = lerp(3.5, 1, inOutCubic(ss(0.15, 1, e)));
      put(x, A, { s: lerp(1, 1.12, ss(0.3, 1, e)), cx, cy, a: 1 });
      shade(x, P.ink, 0.18 * ss(0, 0.3, e));
      if (r <= 0.5) return;
      const ring = Math.min(34 * k, Math.max(10 * k, r * 0.12));
      // hard shadow of the ring (down-right)
      x.save(); x.strokeStyle = 'rgba(20,35,61,0.28)'; x.lineWidth = ring; x.beginPath(); x.arc(cx + 14 * k, cy + 12 * k, r + ring / 2, 0, Math.PI * 2); x.stroke(); x.restore();
      x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
      x.translate(cx, cy); x.scale(zs, zs); x.translate(-cx, -cy); x.drawImage(B, 0, 0, W, H); x.restore();
      // glass glint + brass ring with an ink pen line
      x.save(); x.strokeStyle = 'rgba(247,246,241,0.35)'; x.lineWidth = 6 * k; x.beginPath(); x.arc(cx, cy, r * 0.86, Math.PI * 1.08, Math.PI * 1.42); x.stroke(); x.restore();
      x.save(); x.strokeStyle = P.brass; x.lineWidth = ring; x.beginPath(); x.arc(cx, cy, r + ring / 2, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = P.brassD; x.lineWidth = 3 * k; x.beginPath(); x.arc(cx, cy, r + 2 * k, 0, Math.PI * 2); x.stroke(); x.restore();
      inkLine(x, (g) => { g.beginPath(); g.arc(cx, cy, r + ring, 0, Math.PI * 2); }, 3 * k);
    },
    // T3: a brass gear rides the seam; A rolls out (slower: depth), B rolls in over it
    'gear-mesh'(x, A, B, e, o) {
      const dir = o.dir ?? 1, u = inOutCubic(clamp(e)), edge = dir > 0 ? W * (1 - u) : W * u;
      put(x, A, { dx: -dir * W * u * 0.55 });
      shade(x, P.ink, 0.25 * u);
      x.save(); x.beginPath(); if (dir > 0) x.rect(edge, 0, W - edge, H); else x.rect(0, 0, edge, H); x.clip(); put(x, B, { dx: dir * W * (1 - u) }); x.restore();
      const R = 230 * k, cy = (o.y ?? 0.5) * H, ang = -dir * (W * u) / R;
      x.save(); x.translate(14 * k, 12 * k); x.fillStyle = 'rgba(20,35,61,0.22)'; gearPath(edge, cy, R, 18, ang)(x); x.fill('evenodd'); x.restore();
      x.save(); x.fillStyle = P.brass; gearPath(edge, cy, R, 18, ang)(x); x.fill('evenodd');
      x.fillStyle = P.brassL; x.beginPath(); x.arc(edge, cy, R * 0.55, 0, Math.PI * 2); x.arc(edge, cy, R * 0.3, 0, Math.PI * 2, true); x.fill('evenodd');
      x.fillStyle = P.brassD; x.beginPath(); x.arc(edge, cy, R * 0.12, 0, Math.PI * 2); x.fill(); x.restore();
      inkLine(x, (g) => gearPath(edge, cy, R, 18, ang)(g), 3 * k);
    },
    // T4: time skip; a ticker tape races across the frame while A pushes out and B pushes in, then stops dead
    'tape-feed'(x, A, B, e, o) {
      const dir = o.dir ?? 1, u = inOutQuart(clamp(e)), v = Math.abs(u - inOutQuart(clamp(e - 0.02))) * W;
      for (const [img, dx] of [[A, -dir * W * u], [B, dir * W * (1 - u)]]) {
        put(x, img, { dx }); if (v > 10 * k) { put(x, img, { dx: dx - dir * v * 0.6, a: 0.35 }); put(x, img, { dx: dx - dir * v * 1.2, a: 0.2 }); } }
      const th = 110 * k * ss(0, 0.14, e) * (1 - ss(0.88, 1, e)), cy = (o.y ?? 0.62) * H;
      if (th < 1) return;
      x.save(); x.fillStyle = 'rgba(20,35,61,0.22)'; x.fillRect(0, cy - th / 2 + 12 * k, W, th); // hard shadow
      x.fillStyle = P.card; x.fillRect(0, cy - th / 2, W, th);
      const pitch = 46 * k, off = ((dir * W * 3.2 * u) % pitch + pitch) % pitch;
      x.fillStyle = P.kraftD; for (let X = -pitch + off; X < W + pitch; X += pitch) { x.beginPath(); x.arc(X, cy - th * 0.36, th * 0.07, 0, Math.PI * 2); x.arc(X, cy + th * 0.36, th * 0.07, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = P.ink70; for (let X = -pitch * 4 + off * 4 % (pitch * 4); X < W + pitch * 4; X += pitch) x.fillRect(X, cy - th * 0.16, 3 * k, th * (Math.round(X / pitch) % 4 ? 0.18 : 0.32));
      x.restore();
      inkLine(x, (g) => { g.beginPath(); g.moveTo(0, cy - th / 2); g.lineTo(W, cy - th / 2); g.moveTo(0, cy + th / 2); g.lineTo(W, cy + th / 2); }, 2.5 * k);
    },
    // T5: the frame is a card; it flips on its vertical axis to B printed on the back
    'card-flip'(x, A, B, e) {
      x.save(); x.fillStyle = P.kraft; x.fillRect(0, 0, W, H); x.restore();
      const c = Math.cos(clamp(e) * Math.PI), sx = Math.abs(c), lift = 1 - 0.06 * Math.sin(clamp(e) * Math.PI), img = c >= 0 ? A : B;
      if (sx < 0.003) return;
      x.save(); x.translate(W / 2 + 16 * k, H / 2 + 14 * k); x.scale(sx * lift, lift); x.fillStyle = 'rgba(20,35,61,0.25)'; x.fillRect(-W / 2, -H / 2, W, H); x.restore();
      x.save(); x.translate(W / 2, H / 2); x.scale(sx * lift, lift); x.drawImage(img, -W / 2, -H / 2, W, H); x.restore();
      shade(x, P.ink, 0.35 * (1 - sx), [W / 2 - W / 2 * sx * lift, H / 2 - H / 2 * lift, W * sx * lift, H * lift]);
    },
    // T6: A folds in half like a map (right half over the left), then the folded half lifts away to the left
    'fold-away'(x, A, B, e) {
      put(x, B);
      const e1 = clamp(e / 0.55), e2 = clamp((e - 0.55) / 0.45), th = inOutCubic(e1) * Math.PI, c = Math.cos(th), hw = W / 2;
      const m = inOutCubic(e2), dx = -W * 0.75 * m, dy = -H * 0.08 * m, r = -0.1 * m;
      x.save(); x.translate(dx, dy); x.translate(hw, H / 2); x.rotate(r); x.translate(-hw, -H / 2);
      x.save(); x.fillStyle = `rgba(20,35,61,${0.25 * (0.4 + m)})`; x.fillRect(16 * k + 24 * k * m, 14 * k + 30 * k * m, c >= 0 ? W : hw, H); x.restore();
      x.drawImage(A, 0, 0, hw, H, 0, 0, hw, H);                          // left half stays
      if (c >= 0) { x.drawImage(A, hw, 0, hw, H, hw, 0, hw * c, H); shade(x, P.ink, 0.4 * (1 - c), [hw, 0, hw * c, H]); }
      else { const w = hw * -c; x.fillStyle = P.card; x.fillRect(hw - w, 0, w, H); KIT.fibre(x, 0.12, [hw - w, 0, hw, H]); shade(x, P.ink, 0.25 * (1 + c), [hw - w, 0, w, H]); }
      inkLine(x, (g) => { g.beginPath(); g.moveTo(hw, 0); g.lineTo(hw, H); }, 3 * k);
      x.restore();
    },
    // a breath through the navy ink plate
    'dip-ink'(x, A, B, e) {
      if (e < 0.5) { put(x, A); shade(x, P.night, ss(0, 0.45, e)); } else { put(x, B); shade(x, P.night, 1 - ss(0.55, 1, e)); }
    },
  };
  return T;
}

export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  window.__ctx = ctx;
  await document.fonts.ready;
  for (const f of ['600 34px "Archivo Narrow"', '700 250px "Archivo Narrow"', '500 22px "Plex Mono"', '400 84px "Instrument Serif"', 'italic 40px "Instrument Serif"']) await document.fonts.load(f);
  await KIT.loadInter();

  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`; gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d', { willReadFrequently: true });
  const mk = () => { const c = document.createElement('canvas'); c.width = width; c.height = height; return [c, c.getContext('2d', { willReadFrequently: true })]; };
  const [prev, px] = mk(), [next, nx] = mk();
  const fx = TR.create({ width, height });
  const CT = makeCustom(width, height);
  const plan = planCuts(shots, TR.meta);
  window.__plan = plan;

  const live = new Map(); window.__live = live;
  async function make(shot) {
    try {
      const f = SETS[shot.set];
      if (!f) throw new Error(`unknown set '${shot.set}' (have ${Object.keys(SETS).join(', ')})`);
      const inst = await f(ctx, resolveCues(shot, !!HERO[shot.set]));
      if (inst.layer) inst.layer.style.display = 'none'; // composited from inst.canvas, never shown as DOM
      return inst;
    } catch (e) {
      if (!ctx.draft && !shot.params?.allowSlate) throw e;
      console.error(`[notredame] ${shot.id} (${shot.set}): ${e.message}\n${e.stack}`);
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
  const reset = (x) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over'; };
  async function paint(inst, t, p, x) { await inst.update(t, p); if (x) put(x, inst.canvas); return inst.canvas; }

  let pending = null; const orig = window.__frame;
  window.__frame = async (T) => { orig(T); await pending; };
  return { frame(a) { pending = draw(a); return pending; } };

  async function draw({ shot, t, p, index }) {
    const inst = await get(index);
    const cut = plan[index] ?? { name: 'cut', dur: 0 };
    const inTr = index > 0 && cut.name !== 'cut' && cut.dur > 0 && t < cut.dur;
    if (!inTr) { await paint(inst, t, p, cx); return; }
    const out = await get(index - 1), ps = shots[index - 1];
    await paint(out, ps.duration + t, 1, px);
    await paint(inst, t, p, nx);
    const e = t / cut.dur;
    reset(cx);
    if (CT[cut.name]) { cx.clearRect(0, 0, width, height); CT[cut.name](cx, prev, next, e, cut.opts ?? {}); reset(cx); }
    else fx.render(cx, TR.meta[cut.name] ? cut.name : (CUSTOM[cut.name]?.fallback ?? 'dissolve'), prev, next, e, cut.opts);
  }
}
