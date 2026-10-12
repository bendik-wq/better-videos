// Hormuz bright graphics: title, chapter, quote, numbers, bars, timeline, doc, insurance, pump, flows.
//
// House set format (projects/hormuz/scene.js): makeGraphics(H) -> { <set>(ctx, shot) -> Promise<inst> }.
// Most sets paint a 2D canvas (inst.canvas) that the runtime composites directly (no GL cost); the paper
// sets (doc, insurance:cheque) are real 3D: paper on a sunlit desk with soft shadows (inst.toneMapping).
// Type lives in a DOM layer built with engine/motion.js (M.stage), keyed to the narration's word times.
//
// BRIGHT mode (docs/style-bible.md, LK.palette('bright-day')): paper and sand grounds, navy Instrument
// Serif, Plex Mono captions, turquoise sea tones, signal red only for annotation (rules, loops, stamps,
// the one number that matters). Depth: 3-5 layers with soft sun shadows (sun upper left) and a gentle
// parallax drift. Light type over pictures sits on a shadow plate, never naked.
// Every frame is a pure function of (t, p): seeded noise only, no state carried between frames.
//
// Params (every combination in projects/hormuz/SET-USAGE.md):
//   title     { title, sub, end }
//   chapter   { num, title, sub }
//   quote     { text, by, big, red }
//   numbers   { items: [{ word, value, prefix, suffix, sub }], source }
//   bars      { title, items: [{ label, value, word, display, red }], max, source }
//   timeline  { events: [{ year, label, word }], focus }
//   doc       { mode: unclos-cover | unclos | declaration | parties, caption, highlight, stamp, source }
//   insurance { mode: before | jump | cheque, source, caption }
//   pump      { gas, diesel, source }
//   flows     { mode: world | river | asia | us | days | world-dim | one-price, highlight, days, source }
import * as THREE from 'three';
import * as M from '/engine/motion.js';
import * as LK from '/engine/looks.js';

const E = M.E, clamp = M.clamp, lerp = M.lerp, range = M.range, sstep = M.smoothstep;
const TAU = Math.PI * 2;

export function makeGraphics(H = {}) {
  const pal = H.pal ?? LK.palette('bright-day');
  const INK = pal.ink, SOFT = pal.inkSoft, RED = pal.accent;
  const SERIF = `font-family:'Instrument Serif',serif;font-weight:400;color:${INK}`;
  const ITAL = `font-family:'Instrument Serif',serif;font-style:italic;color:${INK}`;
  const MONO = `font-family:'Plex Mono',monospace;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:${SOFT}`;
  const MONO_INK = MONO.replace(`color:${SOFT}`, `color:${INK}`);
  const NUM = `font-family:'Archivo Narrow',sans-serif;font-weight:700;color:${RED}`;
  const DOCFONT = `"Liberation Serif","Times New Roman",serif`;
  const wt = (shot, w, nth = 0, fb = null) => { if (!w) return fb ?? M.vo0(shot); const hit = (shot.words || []).some(x => String(x.w).toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(String(w).toLowerCase().replace(/[^a-z0-9]/g, ''))); return hit ? M.wt(shot, w, nth) : (fb ?? M.vo0(shot)); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---------------------------------------------------------------- canvas plumbing
  let S = 1; // device px per 1080p unit, set before every paint (shadow blur/offset are not transformed)
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const layerOf = (ctx) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(l); return l; };
  let GRAIN = null; const pats = new WeakMap();
  function grain(g) {
    if (!GRAIN) { GRAIN = mk(256, 256); const x = GRAIN.getContext('2d'), im = x.createImageData(256, 256), r = M.rng(17);
      for (let i = 0; i < im.data.length; i += 4) { const v = 232 + r() * 23; im.data[i] = v; im.data[i + 1] = v - 1; im.data[i + 2] = v - 3; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); }
    if (!pats.has(g)) pats.set(g, g.createPattern(GRAIN, 'repeat')); return pats.get(g);
  }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function shade(g, lift = 1, a = 1) { g.shadowColor = `rgba(70,52,28,${(0.12 + 0.05 * lift) * a})`; g.shadowBlur = (14 + 26 * lift) * S; g.shadowOffsetX = (4 + 6 * lift) * S; g.shadowOffsetY = (8 + 12 * lift) * S; }
  const noShade = (g) => { g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0; };
  // paper ground: tone, a soft sun from the upper left, a warm falloff to the edges, multiplied grain
  function ground(g, { tone = pal.bg, sun = [300, -120], warm = 0.1 } = {}) {
    g.fillStyle = tone; g.fillRect(-60, -60, 2040, 1200);
    const sg = g.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], 1700);
    sg.addColorStop(0, 'rgba(255,253,247,0.8)'); sg.addColorStop(0.45, 'rgba(255,251,242,0.28)'); sg.addColorStop(1, 'rgba(255,250,240,0)');
    g.fillStyle = sg; g.fillRect(-60, -60, 2040, 1200);
    const vg = g.createRadialGradient(960, 520, 500, 960, 540, 1350); vg.addColorStop(0, 'rgba(110,84,48,0)'); vg.addColorStop(1, `rgba(110,84,48,${warm})`);
    g.fillStyle = vg; g.fillRect(-60, -60, 2040, 1200);
    texture(g, () => g.fillRect(-60, -60, 2040, 1200), 0.55);
  }
  function texture(g, pathFn, a = 0.5) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = grain(g); pathFn(); g.restore(); }
  const drift = (p, amp = 1) => (E.inOutSine(p) * 2 - 1) * amp; // -amp .. amp over the shot, eased

  // a 2D set: canvas + motion stage; paint(g, t, p) in 1080p units; the stage drifts with `textDepth`
  function flat(ctx, shot, paint, { par = 10, textDepth = 0.6 } = {}) {
    const layer = layerOf(ctx), cv = mk(ctx.width, ctx.height), g = cv.getContext('2d', { willReadFrequently: true });
    const st = M.stage(layer), s = ctx.height / 1080;
    return { st, layer, inst: { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), layer, canvas: cv, st,
      update(t, p) {
        S = s; g.setTransform(s, 0, 0, s, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; noShade(g);
        paint(g, t, p);
        const dx = drift(p, par) * textDepth;
        st.el.style.transform = `translate(${(dx * s).toFixed(2)}px,0px) scale(${st.scale})`;
        st.update(t);
      },
      dispose() { layer.remove(); } } };
  }

  // ---------------------------------------------------------------- stage type helpers
  // lines (HTML allowed) rise from behind a mask, one after another
  function maskLines(st, { lines, x, y, size = 120, style = SERIF, at = 0, stagger = 0.13, dur = 0.9, lh = 1.0, align = 'left', anchor = 'tl', out, outDur = 0.4 }) {
    const d = st.div(`${style};font-size:${size}px;line-height:${lh};white-space:nowrap;text-align:${align}`);
    d.innerHTML = lines.map(l => `<div style="overflow:hidden;padding:0 .04em .14em;margin-bottom:-.14em"><div>${l}</div></div>`).join('');
    d.style.left = x + 'px'; d.style.top = y + 'px';
    d.style.transform = anchor === 'tr' ? 'translateX(-100%)' : anchor === 'tc' ? 'translateX(-50%)' : '';
    const inner = [...d.children].map(c => c.firstChild);
    return st.add({ el: d, update(t) {
      const ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      inner.forEach((e, i) => { const k = E.emphasized(range(t, at + i * stagger, at + i * stagger + dur)); e.style.transform = `translateY(${((1 - k) * 108).toFixed(2)}%)`; });
      d.style.opacity = (t >= at ? 1 : 0) * ex;
    } });
  }
  function fadeText(st, { html, x, y, size = 16, style = MONO, at = 0, dur = 0.6, rise = 10, anchor = 'tl', width = null, out, outDur = 0.35, lh = 1.5 }) {
    const d = st.div(`${style};font-size:${size}px;line-height:${lh};${width ? `width:${width}px;white-space:normal` : 'white-space:nowrap'}`, html);
    d.style.left = x + 'px'; d.style.top = y + 'px';
    const base = { tl: '', tr: 'translateX(-100%)', tc: 'translateX(-50%)', bl: 'translateY(-100%)', br: 'translate(-100%,-100%)', c: 'translate(-50%,-50%)', ml: 'translateY(-50%)' }[anchor] ?? '';
    return st.add({ el: d, update(t) {
      const k = E.outCubic(range(t, at, at + dur)), ex = 1 - E.inOutSine(range(t, out ?? Infinity, (out ?? Infinity) + outDur));
      d.style.opacity = (k * ex).toFixed(4); d.style.transform = `${base} translateY(${((1 - k) * rise).toFixed(2)}px)`;
    } });
  }
  // a red hairline that draws, then a mono line under it (the house meta caption, navy on paper)
  function metaCap(st, { text, x = 150, y = 118, at = 0.15, width = 56, color = RED, style = MONO_INK, size = 15 }) {
    const rule = st.div(`left:${x}px;top:${y}px;height:2px;width:${width}px;background:${color};transform-origin:0 50%`);
    const tx = fadeText(st, { html: esc(text), x, y: y + 14, size, style, at: at + 0.15, rise: 8 });
    return st.add({ update(t) { rule.style.transform = `scaleX(${E.emphasized(range(t, at, at + 0.55)).toFixed(4)})`; } });
  }
  // source line: bottom right; on pictures (light: true) it sits on a soft shadow plate in paper ink
  function srcLine(st, text, { at = 0.6, light = false, x = 1810, y = 1022 } = {}) {
    if (!text) return null;
    if (light) st.div(`right:0;bottom:0;width:980px;height:200px;background:radial-gradient(ellipse at 100% 100%, ${pal.plate} 0%, rgba(8,20,38,0) 70%);opacity:.8`);
    return fadeText(st, { html: esc(text), x, y, size: 13, style: light ? MONO.replace(`color:${SOFT}`, `color:${pal.plateInk};text-shadow:${pal.shadow}`) : MONO, at, anchor: 'br', rise: 6 });
  }
  // caption over a picture (top left), light type on a shadow plate
  function plateCap(st, text, { at = 0.3 } = {}) {
    if (!text) return null;
    st.div(`left:0;top:0;width:1150px;height:380px;background:radial-gradient(ellipse at 0% 0%, ${pal.plate} 0%, rgba(8,20,38,0) 70%)`);
    const rule = st.div(`left:110px;top:96px;height:2px;width:56px;background:${RED};transform-origin:0 50%`);
    fadeText(st, { html: esc(text), x: 110, y: 112, size: 16, style: MONO.replace(`color:${SOFT}`, `color:${pal.plateInk};text-shadow:${pal.shadow}`), at: at + 0.15 });
    return st.add({ update(t) { rule.style.transform = `scaleX(${E.emphasized(range(t, at, at + 0.55)).toFixed(4)})`; } });
  }

  // a paper tag (navy type on paper, lifted with a soft shadow): captions and sources over the desk sets
  function paperTag(st, text, { corner = 'tl', at = 0.4, size = 15 } = {}) {
    if (!text) return null;
    const pos = corner === 'tl' ? 'left:110px;top:90px' : 'right:110px;bottom:70px';
    const d = st.div(`${pos};background:${pal.paper};padding:16px 22px 14px 22px;box-shadow:0 10px 28px rgba(70,52,28,.22),0 2px 4px rgba(70,52,28,.12);border-radius:3px;white-space:nowrap`,
      `<div style="height:2px;width:40px;background:${RED};margin-bottom:10px"></div><div style="${MONO_INK};font-size:${size}px">${esc(text)}</div>`);
    return st.add({ el: d, update(t) { const k = E.emphasized(range(t, at, at + 0.6)); d.style.opacity = k.toFixed(4); d.style.transform = `translateY(${((1 - k) * 12).toFixed(2)}px)`; } });
  }
  // a legend card on a map: paper, shadow, rows that arrive on their words
  function legendCard(st, { x = 120, y = 110, width = 560, rows = [], at = null }) {
    const d = st.div(`left:${x}px;top:${y}px;width:${width}px;background:${pal.paper};padding:30px 34px 28px;box-shadow:0 14px 40px rgba(70,52,28,.22),0 2px 5px rgba(70,52,28,.12);border-radius:4px`);
    const els = rows.map((r, i) => { const e = document.createElement('div'); e.style.cssText = `margin-top:${i ? 22 : 0}px`; e.innerHTML = r.html; d.appendChild(e); return e; });
    const t0 = at ?? Math.min(...rows.map(r => r.at)) - 0.3;
    return st.add({ el: d, update(t) { const k = E.emphasized(range(t, t0, t0 + 0.7)); d.style.opacity = k.toFixed(4); d.style.transform = `translateY(${((1 - k) * 16).toFixed(2)}px)`;
      els.forEach((e, i) => { const kr = E.outCubic(range(t, rows[i].at, rows[i].at + 0.5)); e.style.opacity = kr.toFixed(4); e.style.transform = `translateY(${((1 - kr) * 8).toFixed(2)}px)`; }); } });
  }

  // ---------------------------------------------------------------- painted sea window (title, chapter)
  const noise1 = (x, seed) => Math.sin(x * 1.7 + seed) * 0.5 + Math.sin(x * 3.1 + seed * 2.3) * 0.28 + Math.sin(x * 7.3 + seed * 0.7) * 0.14 + Math.sin(x * 15.1 + seed * 5.1) * 0.06;
  function ridge(g, x0, w, hy, h, color, seed, u0 = 0, u1 = 1, dx = 0) {
    g.fillStyle = color; g.beginPath(); g.moveTo(x0 + w * u0 + dx, hy + 1);
    for (let u = u0; u <= u1 + 1e-6; u += 0.004) { const e = sstep(u0, u0 + 0.12, u) * (1 - sstep(u1 - 0.12, u1, u)); g.lineTo(x0 + w * u + dx, hy - h * e * (0.55 + 0.45 * noise1(u * 9, seed))); }
    g.lineTo(x0 + w * u1 + dx, hy + 1); g.closePath(); g.fill();
  }
  // tanker in side view, bow to `dir`; waterline at (x, y); len in px
  function ship(g, x, y, len, { dir = 1, color = INK, kind = 'tanker', wake = 0.5, t = 0 } = {}) {
    const L = len, h = L * 0.065;
    if (wake > 0) { const wg = g.createLinearGradient(x - dir * L * 0.5, 0, x - dir * L * 1.6, 0); wg.addColorStop(0, `rgba(255,255,255,${0.75 * wake})`); wg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = wg; g.beginPath(); g.moveTo(x - dir * L * 0.48, y - 0.5); g.lineTo(x - dir * L * 1.6, y + L * 0.012); g.lineTo(x - dir * L * 1.6, y + L * 0.03); g.lineTo(x - dir * L * 0.48, y + L * 0.012); g.closePath(); g.fill();
      g.fillStyle = `rgba(255,255,255,${0.55 * wake})`; g.beginPath(); g.ellipse(x + dir * L * 0.5, y + 0.5, L * 0.03, L * 0.008, 0, 0, TAU); g.fill(); }
    g.save(); g.translate(x, y); g.scale(dir, 1); g.fillStyle = color;
    g.beginPath(); g.moveTo(-L * 0.49, 0); g.lineTo(-L * 0.5, -h); g.lineTo(L * 0.44, -h); g.lineTo(L * 0.5, -h * 1.25); g.lineTo(L * 0.47, 0); g.closePath(); g.fill();
    if (kind === 'boat') { g.fillRect(-L * 0.1, -h * 2.4, L * 0.22, h * 1.5); }
    else if (kind === 'lng') { for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-L * 0.22 + i * L * 0.16, -h, L * 0.07, L * 0.06, 0, Math.PI, TAU); g.fill(); } g.fillRect(-L * 0.47, -h - L * 0.075, L * 0.1, L * 0.075); }
    else { g.fillRect(-L * 0.47, -h - L * 0.08, L * 0.1, L * 0.08); g.fillRect(-L * 0.445, -h - L * 0.115, L * 0.028, L * 0.04); g.fillRect(L * 0.38, -h - L * 0.022, L * 0.05, L * 0.022);
      g.fillRect(-L * 0.36, -h - L * 0.012, L * 0.72, L * 0.012); }
    g.restore();
    // reflection
    g.fillStyle = 'rgba(15,30,51,0.12)'; g.fillRect(x - L * 0.48, y + 1, L * 0.95, h * 0.6);
  }
  function seaWindow(g, X, Y, W, Hh, t, p, o = {}) {
    const dx = drift(p, o.par ?? 18);
    g.save(); rr(g, X, Y, W, Hh, o.r ?? 0); g.clip();
    const hy = Y + Hh * (o.horizon ?? 0.5), gold = !!o.golden, hazy = !!o.hazy;
    const sk = g.createLinearGradient(0, Y, 0, hy);
    sk.addColorStop(0, gold ? '#7ea6cf' : hazy ? '#8fb6d8' : '#4f97da'); sk.addColorStop(0.55, gold ? '#c9cdd0' : hazy ? '#c2d7e6' : '#93c3ea'); sk.addColorStop(1, gold ? '#f6d8ae' : hazy ? '#e7ecec' : '#ddecf1');
    g.fillStyle = sk; g.fillRect(X, Y, W, hy - Y + 1);
    const sx = X + W * (o.sunU ?? 0.68) + dx * 0.1, sy = Y + Hh * (o.sunV ?? 0.2);
    const glow = g.createRadialGradient(sx, sy, 0, sx, sy, W * 0.6); glow.addColorStop(0, gold ? 'rgba(255,226,170,0.85)' : 'rgba(255,248,232,0.75)'); glow.addColorStop(0.25, gold ? 'rgba(255,214,150,0.3)' : 'rgba(255,248,232,0.22)'); glow.addColorStop(1, 'rgba(255,248,232,0)');
    g.fillStyle = glow; g.fillRect(X, Y, W, Hh);
    g.fillStyle = gold ? '#fff1d6' : pal.sun; g.beginPath(); g.arc(sx, sy, o.sunR ?? 30, 0, TAU); g.fill();
    // soft clouds, drifting
    if (o.clouds !== false) { const r = M.rng(o.seed ?? 5); for (let i = 0; i < 4; i++) { const cx0 = X + W * r() + t * (4 + r() * 5) + dx * 0.2, cy0 = Y + Hh * (0.08 + r() * 0.24), cw = W * (0.18 + r() * 0.2);
      const cg = g.createRadialGradient(cx0, cy0, 0, cx0, cy0, cw); cg.addColorStop(0, `rgba(255,255,255,${hazy ? 0.4 : 0.55})`); cg.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(cx0, cy0); g.scale(1, 0.18); g.translate(-cx0, -cy0); g.fillStyle = cg; g.beginPath(); g.arc(cx0, cy0, cw, 0, TAU); g.fill(); g.restore(); } }
    // distant coast (Musandam), two hazy ridges
    if (o.coast !== false) { ridge(g, X, W, hy, Hh * 0.075, gold ? '#b9b2ad' : '#adc2d3', 3, 0.0, 0.42, dx * 0.15); ridge(g, X, W, hy, Hh * 0.045, gold ? '#a7a29f' : '#98b2c6', 9, 0.05, 0.3, dx * 0.3); }
    // sea
    const sg = g.createLinearGradient(0, hy, 0, Y + Hh);
    sg.addColorStop(0, gold ? '#9fb7b4' : '#7fcfcb'); sg.addColorStop(0.08, gold ? '#3f8f97' : '#2fb3b3'); sg.addColorStop(0.45, pal.sea); sg.addColorStop(1, pal.seaDeep);
    g.fillStyle = sg; g.fillRect(X, hy, W, Y + Hh - hy);
    // swell lines: darker and lighter strokes, wider with depth (perspective), moving slowly
    const r2 = M.rng(31);
    for (let i = 0; i < 70; i++) { const d = r2(), y = hy + Math.pow(d, 1.7) * (Y + Hh - hy), w = (8 + 140 * d) * (0.5 + r2()), x = X + ((r2() * W + t * (6 + 20 * d) + dx * d) % (W + 200)) - 100;
      g.fillStyle = r2() < 0.5 ? `rgba(8,60,80,${0.08 + 0.1 * d})` : `rgba(255,255,255,${0.06 + 0.08 * d})`; g.fillRect(x, y, w, 1 + 2.4 * d); }
    // glitter under the sun
    const r3 = M.rng(77);
    for (let i = 0; i < 150; i++) { const d = r3(), y = hy + 2 + Math.pow(d, 1.5) * (Y + Hh - hy) * 0.85, spread = 30 + 220 * d, x = sx + (r3() - 0.5) * 2 * spread * (0.4 + r3()) + dx * d;
      const a = Math.max(0, Math.sin(t * (2 + r3() * 3) + r3() * TAU)) * (1 - d * 0.6) * (gold ? 0.9 : 0.75);
      g.fillStyle = gold ? `rgba(255,232,190,${a})` : `rgba(255,252,240,${a})`; g.fillRect(x, y, 4 + 18 * d, 1 + 1.6 * d); }
    // horizon haze
    const hz = g.createLinearGradient(0, hy - 30, 0, hy + 40); hz.addColorStop(0, 'rgba(240,244,244,0)'); hz.addColorStop(0.45, `rgba(240,244,244,${hazy ? 0.6 : 0.35})`); hz.addColorStop(1, 'rgba(240,244,244,0)');
    g.fillStyle = hz; g.fillRect(X, hy - 30, W, 70);
    // smoke plume (ch. 2): dark, rising, leaning with the wind
    if (o.smoke) { const [u, v] = o.smoke, x0 = X + W * u + dx * 0.5, y0 = hy + Hh * v; const r4 = M.rng(5);
      for (let k = 0; k < 46; k++) { const f = k / 46, ph = (t * 0.06 + f) % 1, rad = 8 + 90 * ph, px = x0 + ph * W * 0.28 + (r4() - 0.5) * 30 * ph, py = y0 - ph * Hh * 0.5;
        const a = 0.42 * (1 - ph) * sstep(0, 0.05, ph); const cg = g.createRadialGradient(px, py, 0, px, py, rad); cg.addColorStop(0, `rgba(48,52,60,${a})`); cg.addColorStop(1, 'rgba(48,52,60,0)');
        g.fillStyle = cg; g.beginPath(); g.arc(px, py, rad, 0, TAU); g.fill(); }
      const fl = g.createRadialGradient(x0, y0 - 4, 0, x0, y0 - 4, 26); fl.addColorStop(0, 'rgba(255,190,110,0.9)'); fl.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = fl; g.beginPath(); g.arc(x0, y0 - 4, 26, 0, TAU); g.fill(); }
    // ships: { u, v (below horizon, 0..1 of sea), len, speed (px/s), dir, kind }
    for (const s of (o.ships ?? [])) { const y = hy + (Y + Hh - hy) * (s.v ?? 0.02); const depth = (s.v ?? 0.02);
      ship(g, X + W * s.u + (s.speed ?? 6) * t * (s.dir ?? 1) + dx * (0.3 + depth), y, s.len ?? 120, { dir: s.dir ?? 1, kind: s.kind, wake: s.wake ?? 0.5, color: gold ? '#1d2433' : INK }); }
    if (o.buoy) { const [u, v] = o.buoy, bx = X + W * u + dx * 0.7, by = hy + (Y + Hh - hy) * v + Math.sin(t * 1.6) * 2;
      g.fillStyle = RED; g.beginPath(); g.moveTo(bx - 9, by); g.lineTo(bx + 9, by); g.lineTo(bx + 4, by - 26); g.lineTo(bx - 4, by - 26); g.closePath(); g.fill();
      g.fillRect(bx - 1.5, by - 40, 3, 14); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(bx - 16, by + 1, 32, 2); }
    g.restore();
  }

  // ---------------------------------------------------------------- 3D paper desk (doc, cheque)
  function texOf(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  function desk(ctx, { tone = '#eadcbf' } = {}) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(tone);
    const camera = new THREE.PerspectiveCamera(28, ctx.width / ctx.height, 0.1, 200);
    const gc = mk(1024, 1024), gx = gc.getContext('2d'); gx.fillStyle = tone; gx.fillRect(0, 0, 1024, 1024);
    const r = M.rng(4); for (let i = 0; i < 26000; i++) { gx.fillStyle = `rgba(${r() < 0.5 ? '120,95,60' : '255,250,240'},${0.05 * r()})`; gx.fillRect(r() * 1024, r() * 1024, 1 + r() * 2, 1 + r() * 2); }
    const gt = texOf(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(6, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    scene.add(new THREE.HemisphereLight('#e8f0fa', '#cdb48a', 1.45));
    const sun = new THREE.DirectionalLight('#fff2df', 2.9); sun.position.set(-7, 12, -5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.radius = 4; scene.add(sun);
    return { scene, camera, sun };
  }
  // a sheet of paper lying on the desk (y up), w x h units, a gentle curl at its edges
  function sheet(map, w, h, { curl = 0.06, y = 0.01 } = {}) {
    const geo = new THREE.PlaneGeometry(w, h, 32, 32); const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) / (w / 2), v = pos.getY(i) / (h / 2); pos.setZ(i, curl * (Math.pow(Math.abs(u), 6) * 0.8 + Math.pow(Math.max(0, v), 8) * 0.6)); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, roughness: 0.88, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.castShadow = m.receiveShadow = true; return m;
  }
  // wrap text into lines for the document canvases; returns [{ text, x, y }] per word for highlight lookups
  function layoutText(x2, text, { x, y, w, size, lh = 1.45, font = DOCFONT, style = '' }) {
    x2.font = `${style} ${size}px ${font}`; const words = text.split(' '); const out = []; let cx = x, cy = y; const sp = x2.measureText(' ').width;
    for (const wd of words) { const ww = x2.measureText(wd).width; if (cx + ww > x + w && cx > x) { cx = x; cy += size * lh; } out.push({ text: wd, x: cx, y: cy, w: ww }); cx += ww + sp; }
    return { words: out, bottom: cy + size * lh };
  }
  function drawWords(x2, L, { size, font = DOCFONT, style = '', color = '#1d1b19' }) { x2.font = `${style} ${size}px ${font}`; x2.fillStyle = color; for (const w of L.words) x2.fillText(w.text, w.x, w.y); }
  // span of words matching a phrase (case-insensitive) -> rects per line
  function phraseRects(L, phrase, size) {
    const ws = L.words, key = phrase.toLowerCase().split(/\s+/); let i0 = -1;
    for (let i = 0; i <= ws.length - key.length; i++) if (key.every((k, j) => ws[i + j].text.toLowerCase().replace(/[^a-z0-9()]/g, '').startsWith(k.replace(/[^a-z0-9()]/g, '')))) { i0 = i; break; }
    if (i0 < 0) return [];
    const rects = []; for (let j = i0; j < i0 + key.length; j++) { const w = ws[j], last = rects.at(-1); if (last && Math.abs(last.y - w.y) < 1) last.x1 = w.x + w.w; else rects.push({ x0: w.x, x1: w.x + w.w, y: w.y }); }
    return rects.map(r => ({ ...r, top: r.y - size * 0.8, h: size * 1.05 }));
  }
  // highlighter sweep across rects (sand, multiplied under the ink), progress k
  function sweep(x2, rects, k, color = 'rgba(230,196,120,0.72)') {
    const total = rects.reduce((a, r) => a + (r.x1 - r.x0), 0); let left = total * k;
    x2.save(); x2.globalCompositeOperation = 'multiply'; x2.fillStyle = color;
    for (const r of rects) { const w = Math.min(left, r.x1 - r.x0 + 8); if (w <= 0) break; x2.beginPath(); x2.roundRect(r.x0 - 4, r.top, w, r.h, 3); x2.fill(); left -= w; }
    x2.restore();
  }
  // red marker underline drawn on, slightly rough
  function underline(x2, rects, k, { color = RED, width = 5, seed = 2 } = {}) {
    const total = rects.reduce((a, r) => a + (r.x1 - r.x0), 0); let left = total * k; const r0 = M.rng(seed);
    x2.save(); x2.strokeStyle = color; x2.lineWidth = width; x2.lineCap = 'round'; x2.globalAlpha = 0.92;
    for (const r of rects) { const w = Math.min(left, r.x1 - r.x0); if (w <= 0) break; const y = r.top + r.h + 4; x2.beginPath(); x2.moveTo(r.x0, y + (r0() - 0.5) * 3);
      for (let s = 0.1; s <= 1.001; s += 0.1) x2.lineTo(r.x0 + w * s, y + Math.sin(s * 9 + seed) * 1.6); x2.stroke(); left -= w; }
    x2.restore();
  }
  // red rubber stamp texture: double border, bold condensed caps, ink voids from seeded noise
  function stampCanvas(text) {
    const c = mk(1024, 360), x = c.getContext('2d'); x.strokeStyle = x.fillStyle = RED;
    x.lineWidth = 16; x.beginPath(); x.roundRect(20, 20, 984, 320, 26); x.stroke(); x.lineWidth = 5; x.beginPath(); x.roundRect(46, 46, 932, 268, 14); x.stroke();
    x.font = `700 190px "Archivo Narrow"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 188, 880);
    x.globalCompositeOperation = 'destination-out'; const r = M.rng(12);
    for (let i = 0; i < 2600; i++) { x.globalAlpha = 0.3 + 0.7 * r(); x.beginPath(); x.arc(r() * 1024, r() * 360, 0.6 + r() * 3.2, 0, TAU); x.fill(); }
    for (let i = 0; i < 9; i++) { x.globalAlpha = 0.25; x.fillRect(r() * 1024, 0, 6 + r() * 30, 360); }
    return c;
  }
  // camera over the desk: look at `target`, from an elevation/azimuth/distance, eased between two framings
  function deskCam(camera, a, b, k, t) {
    const L = (i) => lerp(a[i], b[i], k);
    const tx = L(0), tz = L(1), dist = L(2), el = L(3), az = L(4);
    const breathe = Math.sin(t * 0.5) * 0.015;
    camera.position.set(tx + Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist + breathe, tz + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(tx, 0, tz); camera.updateMatrixWorld();
  }

  // ================================================================ SETS
  const SETS = {};

  // ---------------------------------------------------------------- title
  SETS.title = async (ctx, shot) => {
    const P = shot.params ?? {}, end = !!P.end, D = shot.duration;
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g);
      const x0 = end ? 1060 : 1180, k = E.editorial(range(t, 0.05, 1.25)), w = (1920 - x0) * k;
      g.save(); shade(g, 1.4); g.fillStyle = pal.sea; g.fillRect(1920 - w, 0, w + 40, 1080); g.restore();
      seaWindow(g, 1920 - w, 0, (1920 - x0), 1080, t, p, end
        ? { golden: true, sunU: 0.42, sunV: 0.4, horizon: 0.5, ships: [{ u: 0.7, v: 0.012, len: 70, speed: 3, dir: 1, wake: 0.4 }], par: 14 }
        : { sunU: 0.66, sunV: 0.2, horizon: 0.5, ships: [0, 1, 2, 3].map(i => ({ u: 0.12 + i * 0.2, v: 0.02 + i * 0.006, len: 92 + i * 14, speed: 5, dir: -1, kind: i === 2 ? 'lng' : 'tanker' })), par: 14 });
      // the window's inner edge: a thin paper bevel catches the sun
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(1920 - w - 1, 0, 2, 1080);
    }, { par: 8 });
    const tt = String(P.title ?? '').replace(/\b(\d+)\b/g, `<span style="${NUM};font-size:.92em;letter-spacing:-.01em">$1</span>`);
    const m = tt.match(/^(.*?<\/span>\s*\S+)\s+(.*)$/); const lines = m ? [m[1], m[2]] : [tt];
    if (!end) {
      metaCap(st, { text: 'EPISODE 03', x: 150, y: 330, at: 0.5 });
      maskLines(st, { lines, x: 146, y: 390, size: 118, lh: 1.02, at: 0.65, out: D - 0.45 });
      fadeText(st, { html: esc(P.sub ?? ''), x: 152, y: 650, size: 18, style: MONO_INK, at: 1.45, out: D - 0.4 });
    } else {
      maskLines(st, { lines, x: 146, y: 400, size: 104, lh: 1.02, at: 0.5 });
      fadeText(st, { html: 'SOURCES AND DATA IN THE DESCRIPTION', x: 152, y: 650, size: 15, style: MONO, at: 1.6 });
      fadeText(st, { html: 'Thank you for watching.', x: 150, y: 700, size: 40, style: ITAL, at: 2.3 });
    }
    return inst;
  };

  // ---------------------------------------------------------------- chapter
  const CHAPTER_WINDOWS = {
    1: { sunU: 0.7, sunV: 0.18, ships: [0, 1, 2].map(i => ({ u: 0.18 + i * 0.26, v: 0.02 + i * 0.01, len: 70 + i * 18, speed: 4, dir: -1 })) },
    2: { hazy: true, sunU: 0.25, sunV: 0.24, smoke: [0.58, 0.035], ships: [{ u: 0.58, v: 0.035, len: 130, speed: 0, dir: -1, wake: 0 }] },
    3: { sunU: 0.3, sunV: 0.16, ships: [{ u: 0.6, v: 0.03, len: 150, speed: 3, dir: -1 }, { u: 0.25, v: 0.12, len: 26, speed: 26, dir: 1, kind: 'boat', wake: 1 }, { u: 0.18, v: 0.2, len: 24, speed: 28, dir: 1, kind: 'boat', wake: 1 }, { u: 0.08, v: 0.15, len: 22, speed: 27, dir: 1, kind: 'boat', wake: 1 }] },
    4: { sunU: 0.62, sunV: 0.14, hazy: true, ships: [], buoy: [0.4, 0.22] },
    5: { golden: true, sunU: 0.5, sunV: 0.42, ships: [{ u: 0.3, v: 0.015, len: 90, speed: 3, dir: 1 }] },
  };
  SETS.chapter = async (ctx, shot) => {
    const P = shot.params ?? {}, n = P.num ?? 1, D = shot.duration, win = CHAPTER_WINDOWS[n] ?? CHAPTER_WINDOWS[1];
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g, { sun: [200, -200] });
      // the giant numeral, sand on paper, behind everything (depth layer 0)
      const dn = drift(p, 12);
      g.save(); g.font = `700 760px "Archivo Narrow"`; g.fillStyle = pal.sand; g.globalAlpha = 0.5 * E.outCubic(range(t, 0, 0.9)); g.textBaseline = 'alphabetic';
      g.fillText(String(n), 640 - dn * 0.3, 1160 + (1 - E.emphasized(range(t, 0, 1.2))) * 60); g.restore();
      // the window card (depth layer 2): a photograph-like sea panel lifted off the paper
      const k = E.emphasized(range(t, 0.15, 1.2)), X = 1040 - dn * 0.8, Y = 150 + (1 - k) * 40, W = 730, Hh = 780;
      g.save(); g.globalAlpha = k; shade(g, 2.2); g.fillStyle = pal.paper; rr(g, X - 14, Y - 14, W + 28, Hh + 28, 6); g.fill(); g.restore();
      g.save(); g.globalAlpha = k; seaWindow(g, X, Y, W, Hh, t + 4 * n, p, { ...win, seed: n, horizon: 0.46, r: 3, par: 10 }); g.restore();
    }, { par: 12, textDepth: 0.2 });
    metaCap(st, { text: `CHAPTER ${String(n).padStart(2, '0')}`, x: 150, y: 400, at: 0.35 });
    maskLines(st, { lines: [esc(P.title ?? '')], x: 144, y: 450, size: 150, at: 0.5, out: D - 0.4 });
    fadeText(st, { html: esc(P.sub ?? ''), x: 152, y: 650, size: 17, style: MONO_INK, at: 1.15, out: D - 0.35 });
    return inst;
  };

  // ---------------------------------------------------------------- quote
  SETS.quote = async (ctx, shot) => {
    const P = shot.params ?? {}, D = shot.duration, text = String(P.text ?? ''), big = !!P.big;
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g, { tone: big ? pal.paper : pal.bg });
      // a big sand quote mark as the back layer, a turquoise sea hairline as the base of the composition
      const dn = drift(p, 14);
      if (!big) { g.save(); g.font = `400 900px "Instrument Serif"`; g.fillStyle = pal.sand; g.globalAlpha = 0.5 * E.outCubic(range(t, 0, 1)); g.fillText('“', 40 - dn * 0.4, 900); g.restore(); }
      else { const k = E.editorial(range(t, 0.1, 1.4)); g.fillStyle = pal.sea; g.fillRect(960 - 380 * k, 830, 760 * k, 3); }
    }, { par: 14, textDepth: 0.5 });
    const ws = text.split(' '), T = M.wordTimes(shot, text.replace(/[“”…"]/g, ''), { fallback: 0.4, gap: 0.2 });
    const size = big ? 92 : text.length > 110 ? 70 : text.length > 70 ? 80 : 96;
    const nLines = Math.ceil(text.length * size * 0.4 / (big ? 1500 : 1420)), qTop = Math.round(500 - nLines * size * 1.12 / 2);
    const box = big ? `left:210px;width:1500px;text-align:center;top:${qTop}px` : `left:200px;width:1420px;top:${qTop}px`;
    const q = st.div(`${box};${big ? ITAL : SERIF};font-size:${size}px;line-height:1.12`, ws.map(w => `<span style="position:relative;display:inline-block;margin-right:.24em">${esc(w)}</span>`).join(''));
    const els = [...q.children];
    // red quotes underline their key phrase (annotation): 'not physically blocked' or the given `mark`
    const mark = (P.mark ?? (P.red ? 'not physically blocked' : '')).toLowerCase().split(' ').filter(Boolean);
    let mi = -1; if (mark.length) for (let i = 0; i < ws.length; i++) if (mark.every((m, j) => (ws[i + j] ?? '').toLowerCase().replace(/[^a-z]/g, '') === m)) { mi = i; break; }
    const ul = mi >= 0 ? els.slice(mi, mi + mark.length).map(e => { const u = document.createElement('span'); u.style.cssText = `position:absolute;left:-.04em;right:-.28em;bottom:.02em;height:.07em;background:${RED};transform-origin:0 50%;transform:scaleX(0)`; e.appendChild(u); return u; }) : [];
    const rule = big ? null : st.div(`left:200px;top:${qTop - 44}px;height:2px;width:72px;background:${RED};transform-origin:0 50%`);
    const by = P.by ? fadeText(st, { html: esc(P.by), x: big ? 960 : 202, y: qTop + nLines * size * 1.12 + 60, size: 15, style: MONO_INK, anchor: big ? 'tc' : 'tl', at: Math.min(D - 1, T.at(-1) + 0.3) }) : null;
    st.add({ update(t) {
      const ex = 1 - E.inOutSine(range(t, D - 0.5, D));
      els.forEach((e, i) => { const k = E.inOutSine(range(t, T[i] - 0.08, T[i] + 0.25)); e.style.opacity = ((0.14 + 0.86 * k) * clamp((t - 0.15) * 3)).toFixed(4); });
      if (rule) rule.style.transform = `scaleX(${E.emphasized(range(t, 0.1, 0.7)).toFixed(4)})`;
      const ut = mi >= 0 ? T[mi + mark.length - 1] + 0.3 : 0; ul.forEach((u, j) => { u.style.transform = `scaleX(${E.inOutCubic(range(t, ut + j * 0.12, ut + j * 0.12 + 0.2)).toFixed(4)})`; });
      q.style.opacity = ex;
    } });
    return inst;
  };

  // ---------------------------------------------------------------- numbers: the number, then how big it is
  SETS.numbers = async (ctx, shot) => {
    const P = shot.params ?? {}, it = (P.items ?? [])[0] ?? { value: 0 }, D = shot.duration;
    const at = Math.max(0.35, wt(shot, it.word, 0, 0.5) - 0.1);
    const pct = it.suffix === '%', loss = String(it.prefix ?? '').includes('−'), mil = it.suffix === 'M';
    const n = pct ? 100 : it.value, cols = pct ? 10 : n > 420 ? 22 : 20, rows = Math.ceil(n / cols);
    const GX = 1010, GY = 220, GW = 760, GH = 600, cell = Math.min((GW - 100) / cols, (GH - 100) / rows), gap = cell * (pct ? 0.16 : 0.3);
    const ox = GX + (GW - cols * cell) / 2, oy = GY + (GH - rows * cell) / 2;
    const glyph = (g, x, y, c, kind) => {
      const q = c - gap;
      if (kind === 'ship') { g.beginPath(); g.roundRect(x - q * 0.05, y + q * 0.42, q * 1.1, q * 0.36, q * 0.18); g.fill(); g.fillRect(x + q * 0.02, y + q * 0.22, q * 0.2, q * 0.24); }
      else if (kind === 'barrel') { g.beginPath(); g.roundRect(x + q * 0.12, y, q * 0.76, q, q * 0.16); g.fill(); g.save(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + q * 0.12, y + q * 0.3, q * 0.76, q * 0.07); g.fillRect(x + q * 0.12, y + q * 0.63, q * 0.76, q * 0.07); g.restore(); }
      else { g.beginPath(); g.roundRect(x, y, q, q, q * 0.18); g.fill(); }
    };
    const kind = pct ? 'cell' : mil ? 'barrel' : 'ship';
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g);
      const dn = drift(p, 10), k = E.emphasized(range(t, 0.1, 0.9));
      // the card (lifted), then the units on it
      g.save(); g.translate(-dn * 0.6, (1 - k) * 30); g.globalAlpha = k; shade(g, 2); g.fillStyle = pal.paper; rr(g, GX, GY, GW, GH, 10); g.fill(); noShade(g);
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols), x = ox + c * cell, y = oy + r * cell;
        let fill, a;
        if (loss) { const ti = 0.25 + i / n * 0.6; a = E.outCubic(range(t, ti, ti + 0.3)); const gone = i >= n - Math.round(it.value), tg = at + 0.2 + (n - 1 - i) / n * 1.1; const kg = E.inOutSine(range(t, tg, tg + 0.35));
          fill = gone ? `rgba(23,163,166,${1 - kg * 0.86})` : pal.sea; if (gone && kg > 0) { g.strokeStyle = `rgba(15,30,51,${0.25 * kg})`; g.lineWidth = 1.2; g.beginPath(); g.roundRect(x + 0.5, y + 0.5, cell - gap - 1, cell - gap - 1, (cell - gap) * 0.18); g.stroke(); } }
        else { const filled = pct ? i < it.value : true, ti = pct ? (filled ? at + i / Math.max(1, it.value) * 0.8 : 0.3 + i / n * 0.5) : at + i / n * 1.6; a = E.outCubic(range(t, ti, ti + 0.25));
          fill = pct ? (filled ? pal.seaDeep : 'rgba(15,30,51,0.09)') : (mil ? pal.seaDeep : INK); }
        if (!pct && !loss && a < 1) { g.globalAlpha = k * 0.1 * (1 - a); g.fillStyle = INK; glyph(g, x, y, cell, kind); }
        if (a <= 0) continue; g.globalAlpha = k * a; g.fillStyle = fill; glyph(g, x, y + (1 - a) * 6, cell, kind);
      }
      g.restore();
    }, { par: 10, textDepth: 0.3 });
    const unit = pct ? '■ = 1%' : mil ? '■ = 1 MILLION BARRELS' : '■ = 1 SHIP';
    metaCap(st, { text: it.sub ?? '', x: 150, y: 640, at: at + 0.35, style: MONO_INK, size: 16 });
    const cnt = M.text.counter(st, { from: 0, to: it.value, at, dur: 0.95, prefix: it.prefix ?? '', suffix: it.suffix ?? '', style: SERIF, size: 270, x: 140, y: 610, anchor: 'bl' });
    fadeText(st, { html: unit, x: GX + 4, y: GY + GH + 26, size: 15, style: MONO, at: at + 0.6 });
    srcLine(st, P.source, { at: at + 1.0 });
    void cnt; return inst;
  };

  // ---------------------------------------------------------------- bars: extruded bars that grow on the word
  SETS.bars = async (ctx, shot) => {
    const P = shot.params ?? {}, items = P.items ?? [], max = P.max ?? Math.max(...items.map(i => i.value)) * 1.1;
    const X0 = 150, BW = 1500, BH = 96, Y0 = 400, GAPY = 250;
    const T = items.map((it, i) => Math.max(0.5 + i * 0.4, wt(shot, it.word, 0, 0.6 + i * 1.2) - 0.1));
    const fmt = (it, v) => it.display && v >= it.value - 1e-6 ? it.display : (it.value % 1 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'));
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g);
      const dn = drift(p, 10);
      // scale: faint verticals
      g.save(); g.translate(-dn * 0.2, 0); g.strokeStyle = pal.grid; g.lineWidth = 1; const step = max > 100 ? 50 : max > 15 ? 5 : 1;
      g.font = `500 14px "Plex Mono"`; g.fillStyle = 'rgba(70,83,106,0.7)';
      for (let v = 0; v <= max + 1e-6; v += step) { const x = X0 + BW * v / max; g.globalAlpha = E.outCubic(range(t, 0.2, 0.8)); g.beginPath(); g.moveTo(x, Y0 - 70); g.lineTo(x, Y0 + GAPY * (items.length - 1) + BH + 30); g.stroke(); g.fillText(String(v), x - 6, Y0 + GAPY * (items.length - 1) + BH + 60); }
      g.restore();
      items.forEach((it, i) => {
        const y = Y0 + i * GAPY, k = E.decel(range(t, T[i], T[i] + 1.1)), w = Math.max(0, BW * it.value / max * k);
        const top = it.red ? RED : pal.sea, side = it.red ? '#a3170f' : pal.seaDeep;
        g.save(); g.translate(-dn * 0.6, 0);
        // empty track
        g.fillStyle = 'rgba(15,30,51,0.06)'; rr(g, X0, y, BW * it.value / max, BH, 8); g.globalAlpha = E.outCubic(range(t, 0.3, 0.8)); g.fill(); g.globalAlpha = 1;
        if (w > 2) {
          g.save(); shade(g, 1.6); g.fillStyle = side; rr(g, X0, y + 10, w, BH, 10); g.fill(); g.restore();          // extruded side face
          const fg = g.createLinearGradient(0, y, 0, y + BH); fg.addColorStop(0, it.red ? '#ee4a3f' : '#3fc0c0'); fg.addColorStop(1, top);
          g.fillStyle = fg; rr(g, X0, y, w, BH, 10); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(X0 + 10, y + 6, Math.max(0, w - 20), 3);                // sun on the top edge
        }
        const v = it.value * k; g.font = `400 84px "Instrument Serif"`; g.fillStyle = INK; g.globalAlpha = E.outCubic(range(t, T[i] + 0.1, T[i] + 0.5));
        g.fillText(fmt(it, v), X0 + w + 24, y + BH * 0.8); g.restore();
      });
    }, { par: 10, textDepth: 0.6 });
    metaCap(st, { text: P.title ?? '', x: 150, y: 150, at: 0.2, size: 18 });
    items.forEach((it, i) => fadeText(st, { html: esc(it.label), x: X0, y: Y0 + i * GAPY - 46, size: 17, style: it.red ? MONO_INK : MONO_INK, at: T[i] - 0.15 }));
    srcLine(st, P.source, { at: 1.2 });
    return inst;
  };

  // ---------------------------------------------------------------- timeline: the decade, the war at sea as a band of water
  SETS.timeline = async (ctx, shot) => {
    const P = shot.params ?? {}, ev = P.events ?? [], focus = P.focus ?? -1;
    const y0 = Math.min(...ev.map(e => e.year)) - 2, y1 = Math.max(...ev.map(e => e.year)) + 2;
    const AX = 170, AW = 1580, AY = 640, X = (yr) => AX + AW * (yr - y0) / (y1 - y0);
    const T = ev.map((e, i) => wt(shot, e.word, 0, null) ?? 0); ev.forEach((e, i) => { if (!e.word) T[i] = Math.max(T[i - 1] ?? 0, 0) + 1.6; else T[i] = wt(shot, e.word, 0, 0.6 + i * 1.6); });
    for (let i = 1; i < T.length; i++) T[i] = Math.max(T[i], T[i - 1] + 0.9);
    const fA = ev[focus]?.year, fB = ev[focus + 1]?.year ?? (fA + 1), tf = T[focus] ?? 1;
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g);
      const dn = drift(p, 10), ka = E.editorial(range(t, 0.1, 1.0));
      g.save(); g.translate(-dn * 0.5, 0);
      // the war at sea: a band of sea between its years, with tankers crossing it and red hits
      if (focus >= 0) { const kb = E.emphasized(range(t, tf, tf + 1.0)), xa = X(fA), xb = lerp(xa, X(fB), kb);
        if (kb > 0) { g.save(); shade(g, 1.2); const bg = g.createLinearGradient(0, AY + 56, 0, AY + 176); bg.addColorStop(0, '#5fc6c4'); bg.addColorStop(1, pal.seaDeep); g.fillStyle = bg; rr(g, xa, AY + 56, xb - xa, 120, 8); g.fill(); g.restore();
          g.save(); rr(g, xa, AY + 56, xb - xa, 120, 8); g.clip(); const r = M.rng(9);
          for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.08 + 0.1 * r()})`; g.fillRect(xa + ((r() * (X(fB) - xa) + t * 12) % (X(fB) - xa)), AY + 66 + r() * 100, 20 + r() * 60, 1.5); }
          for (let i = 0; i < 4; i++) { const u = ((t - tf) * 0.05 + i * 0.27) % 1, sx = xa + (X(fB) - xa) * u; ship(g, sx, AY + 96 + i * 22, 52 + i * 6, { dir: i % 2 ? -1 : 1, color: INK, wake: 0.6 }); }
          for (let i = 0; i < 6; i++) { const th = tf + 0.8 + i * 0.55, a = Math.exp(-Math.max(0, t - th) * 1.4) * (t >= th ? 1 : 0); if (a <= 0.01) continue; const hx = xa + (X(fB) - xa) * ((i * 0.37 + 0.12) % 1), hy = AY + 86 + (i % 3) * 30;
            g.strokeStyle = `rgba(224,36,27,${a})`; g.lineWidth = 3; g.beginPath(); g.arc(hx, hy, 8 + (1 - a) * 22, 0, TAU); g.stroke(); }
          g.restore(); } }
      // axis + ticks
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(AX, AY); g.lineTo(AX + AW * ka, AY); g.stroke();
      g.font = `500 15px "Plex Mono"`; g.fillStyle = SOFT; g.textAlign = 'center';
      for (let yr = y0; yr <= y1; yr++) { const x = X(yr), a = sstep(x - 20, x, AX + AW * ka); if (a <= 0) continue; g.globalAlpha = a; g.fillRect(x - 0.75, AY - 10, 1.5, 10); g.fillText(String(yr), x, AY + 34); }
      g.globalAlpha = 1; g.textAlign = 'left';
      // event pins: a red dot drops on its year when spoken
      ev.forEach((e, i) => { const k = M.spring({ zeta: 0.5, bounces: 1.2 })(range(t, T[i], T[i] + 0.6)); if (k <= 0) return; g.fillStyle = i === focus ? RED : INK;
        g.beginPath(); g.arc(X(e.year), AY - 140 * (1 - k) * 0, 9 * k, 0, TAU); g.fill(); g.fillRect(X(e.year) - 1, AY - 110 * k, 2, 110 * k); });
      g.restore();
    }, { par: 10, textDepth: 0.5 });
    ev.forEach((e, i) => { fadeText(st, { html: `<div style="${SERIF};font-size:76px;line-height:1">${e.year}</div><div style="${i === focus ? MONO_INK : MONO};font-size:15px;margin-top:8px">${esc(e.label)}</div>`, x: X(e.year) - 4, y: AY - 230, size: 15, style: '', at: T[i] + 0.15 }); });
    metaCap(st, { text: 'THE IRAN–IRAQ WAR', x: 150, y: 150, at: 0.2 });
    return inst;
  };

  // ---------------------------------------------------------------- doc: real paper on a sunlit desk
  SETS.doc = async (ctx, shot) => {
    const P = shot.params ?? {}, mode = P.mode ?? 'unclos', D = shot.duration;
    const { scene, camera } = desk(ctx);
    const layer = layerOf(ctx), st = M.stage(layer);
    const PW = 1448, PH = 2048, pc = mk(PW, PH), px = pc.getContext('2d'); const ptex = texOf(pc);
    const page = sheet(ptex, 4.0, 4.0 * PH / PW, { curl: 0.05, y: 0.03 }); scene.add(page);
    // a second sheet under the first, offset (depth)
    const back = sheet(texOf((() => { const c = mk(64, 64), x = c.getContext('2d'); x.fillStyle = '#f3eee2'; x.fillRect(0, 0, 64, 64); return c; })()), 4.0, 4.0 * PH / PW, { curl: 0, y: 0.002 });
    back.position.set(0.32, 0.002, 0.22); back.rotation.z = -0.05; scene.add(back);
    let draw = () => {}, a = [0, 0, 11.5, 1.12, 0.22], b = [0, 0, 10.6, 1.18, 0.12], extra = null;
    const paperBase = (x, tone = '#fbf8f1') => { x.fillStyle = tone; x.fillRect(0, 0, PW, PH); const r = M.rng(8); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(120,100,70,${0.035 * r()})`; x.fillRect(r() * PW, r() * PH, 1 + r() * 2, 1 + r() * 2); } };
    const H1 = (x, s, y, size, { style = '', align = 'center', color = '#1d1b19', font = DOCFONT, ls = 0 } = {}) => { x.font = `${style} ${size}px ${font}`; x.fillStyle = color; x.textAlign = align; if (ls) x.letterSpacing = ls + 'px'; x.fillText(s, align === 'center' ? PW / 2 : 150, y); x.letterSpacing = '0px'; x.textAlign = 'left'; };
    if (mode === 'unclos-cover') {
      draw = (x) => { paperBase(x, '#5f8fbf'); const gg = x.createLinearGradient(0, 0, 0, PH); gg.addColorStop(0, 'rgba(255,255,255,0.08)'); gg.addColorStop(1, 'rgba(0,0,30,0.12)'); x.fillStyle = gg; x.fillRect(0, 0, PW, PH);
        // a plain globe ornament (generic meridians, not an emblem)
        x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 5; x.beginPath(); x.arc(PW / 2, 600, 190, 0, TAU); x.stroke(); x.lineWidth = 3;
        for (const r of [0.35, 0.7]) { x.beginPath(); x.ellipse(PW / 2, 600, 190 * r, 190, 0, 0, TAU); x.stroke(); } x.beginPath(); x.moveTo(PW / 2, 410); x.lineTo(PW / 2, 790); x.stroke();
        for (const v of [-0.5, 0, 0.5]) { const yy = 600 + v * 190, rx = Math.sqrt(1 - v * v) * 190; x.beginPath(); x.moveTo(PW / 2 - rx, yy); x.lineTo(PW / 2 + rx, yy); x.stroke(); }
        H1(x, 'THE LAW OF THE SEA', 1060, 108, { color: '#fbf8f1', ls: 10 });
        x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(PW / 2 - 220, 1120, 440, 4);
        H1(x, 'Official Text of the', 1250, 58, { style: 'italic', color: '#f1eee6' });
        H1(x, 'United Nations Convention', 1330, 70, { color: '#fbf8f1' }); H1(x, 'on the Law of the Sea', 1415, 70, { color: '#fbf8f1' });
        H1(x, 'with Annexes and Index', 1500, 58, { style: 'italic', color: '#f1eee6' });
        H1(x, 'UNITED NATIONS', 1840, 46, { color: '#fbf8f1', ls: 12 }); };
      a = [0.1, 0.4, 13.5, 1.0, 0.35]; b = [0, 0.1, 11.2, 1.12, 0.18];
    } else if (mode === 'unclos') {
      let rects = [];
      draw = (x, t) => { paperBase(x); H1(x, 'PART III', 230, 52, { ls: 6 }); H1(x, 'STRAITS USED FOR INTERNATIONAL NAVIGATION', 310, 40, { ls: 2 });
        H1(x, 'SECTION 2. TRANSIT PASSAGE', 470, 40, { ls: 3 }); H1(x, 'Article 38', 600, 52, { style: 'italic' }); H1(x, 'Right of transit passage', 670, 46, { style: 'italic' });
        const txt = '1. In straits referred to in article 37, all ships and aircraft enjoy the right of transit passage, which shall not be impeded; except that, if the strait is formed by an island of a State bordering the strait and its mainland, transit passage shall not apply if there exists seaward of the island a route through the high seas or through an exclusive economic zone of similar convenience with respect to navigational and hydrographical characteristics.';
        const L = layoutText(x, txt, { x: 170, y: 820, w: PW - 340, size: 50, lh: 1.5 }); rects = phraseRects(L, 'all ships and aircraft enjoy the right of transit passage, which shall not be impeded', 50);
        sweep(x, rects, E.inOutCubic(range(t, wt(shot, 'gives', 0, 2.5), wt(shot, 'gives', 0, 2.5) + 1.6)));
        drawWords(x, L, { size: 50 });
        x.font = `40px ${DOCFONT}`; x.fillStyle = '#5a554c'; x.textAlign = 'center'; x.fillText('— 38 —', PW / 2, PH - 120); x.textAlign = 'left'; };
      // the signature record slides in on "signed"
      const cc = mk(1600, 520), cx2 = cc.getContext('2d'); cx2.fillStyle = '#fffdf8'; cx2.fillRect(0, 0, 1600, 520);
      cx2.fillStyle = '#1d1b19'; cx2.font = `600 40px ${DOCFONT}`; cx2.fillText('Participant', 60, 110); cx2.fillText('Signature', 860, 110); cx2.fillText('Ratification', 1220, 110);
      cx2.fillRect(60, 135, 1480, 3); cx2.font = `46px ${DOCFONT}`; cx2.fillText('Iran (Islamic Republic of)', 60, 230); cx2.fillText('10 Dec 1982', 860, 230); cx2.fillText('—', 1300, 230);
      cx2.fillStyle = 'rgba(29,27,25,0.35)'; cx2.fillRect(60, 280, 1480, 1.5); cx2.font = `italic 36px ${DOCFONT}`; cx2.fillStyle = '#5a554c'; cx2.fillText('United Nations Treaty Collection · Chapter XXI.6', 60, 440);
      const card = sheet(texOf(cc), 3.6, 3.6 * 520 / 1600, { curl: 0.02, y: 0.08 }); card.rotation.z = 0.04; scene.add(card);
      const ts = wt(shot, 'signed', 0, 1.2);
      extra = (t) => { const k = E.emphasized(range(t, ts - 0.2, ts + 0.9)); card.position.set(lerp(3.6, 0.5, k), 0.08, lerp(2.8, 1.95, k)); card.visible = k > 0; };
      a = [0.1, -0.5, 10.6, 1.08, 0.26]; b = [0.25, 0.25, 9.6, 1.16, 0.12];
    } else if (mode === 'declaration') {
      const hl = P.highlight ?? 'Transit passage';
      draw = (x, t) => { paperBase(x); H1(x, 'IRAN (ISLAMIC REPUBLIC OF)', 260, 50, { ls: 4 }); H1(x, 'Declaration made upon signature (10 December 1982)', 350, 42, { style: 'italic' });
        x.fillStyle = 'rgba(29,27,25,0.5)'; x.fillRect(170, 420, PW - 340, 2);
        const p1 = '“…only states parties to the Law of the Sea Convention shall be entitled to benefit from the contractual rights created therein.”';
        const p2 = '“The above considerations pertain specifically (but not exclusively) to … The right of Transit passage through straits used for international navigation (Part III, Section 2, article 38).”';
        const L1 = layoutText(x, p1, { x: 170, y: 560, w: PW - 340, size: 56, lh: 1.5 }); const L2 = layoutText(x, p2, { x: 170, y: L1.bottom + 90, w: PW - 340, size: 56, lh: 1.5 });
        const tH = wt(shot, 'right', 0, 3.2), tU = wt(shot, 'only', 0, 4.5);
        sweep(x, phraseRects(L2, hl, 56), E.inOutCubic(range(t, tH, tH + 0.9)));
        drawWords(x, L1, { size: 56 }); drawWords(x, L2, { size: 56 });
        underline(x, phraseRects(L1, '…only states parties', 56), E.inOutCubic(range(t, tU, tU + 0.7)));
        x.font = `italic 36px ${DOCFONT}`; x.fillStyle = '#5a554c'; x.fillText('Excerpt. United Nations Treaty Collection, Chapter XXI.6, declarations and statements.', 170, PH - 160); };
      a = [0.05, -0.8, 9.4, 1.1, 0.22]; b = [0.05, -0.3, 7.8, 1.18, 0.08];
    } else { // parties
      draw = (x) => { paperBase(x); H1(x, 'UNITED NATIONS CONVENTION ON THE LAW OF THE SEA', 230, 40, { ls: 2 }); H1(x, 'Status of participants (excerpt)', 300, 40, { style: 'italic' });
        const cols = [170, 820, 1110]; x.font = `600 40px ${DOCFONT}`; x.fillStyle = '#1d1b19'; ['Participant', 'Signature', 'Ratification'].forEach((h, i) => x.fillText(h, cols[i], 470)); x.fillRect(170, 495, PW - 340, 3);
        const rows = [['Iran (Islamic Republic of)', '10 Dec 1982', '—'], ['Oman', '1 Jul 1983', '17 Aug 1989']];
        x.font = `46px ${DOCFONT}`; rows.forEach((r, j) => { r.forEach((c, i) => x.fillText(c, cols[i], 600 + j * 110)); x.fillStyle = 'rgba(29,27,25,0.25)'; x.fillRect(170, 635 + j * 110, PW - 340, 1.5); x.fillStyle = '#1d1b19'; });
        x.fillText('United States of America', 170, 1000); x.font = `italic 42px ${DOCFONT}`; x.fillStyle = '#6a6458'; x.fillText('not listed', 820, 1000);
        x.fillStyle = 'rgba(29,27,25,0.25)'; x.fillRect(170, 1035, PW - 340, 1.5);
        x.font = `italic 36px ${DOCFONT}`; x.fillStyle = '#5a554c'; x.fillText('United Nations Treaty Collection, Chapter XXI.6 (UNCLOS).', 170, PH - 160); };
      a = [0.0, -0.6, 10.2, 1.12, 0.24]; b = [0.0, -0.35, 9.0, 1.18, 0.1];
    }
    // the stamp: lifts off the page, slams down on the word, settles
    let stamp = null, tStamp = 0;
    if (P.stamp) { stamp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4 * 360 / 1024), new THREE.MeshStandardMaterial({ map: texOf(stampCanvas(P.stamp)), transparent: true, alphaTest: 0.35, roughness: 0.9, depthWrite: false }));
      stamp.rotation.x = -Math.PI / 2; stamp.castShadow = true; scene.add(stamp); tStamp = wt(shot, 'never', 0, 1.0) + 0.05; }
    let lastKey = null;
    const inst = { scene, camera, layer, toneMapping: THREE.NeutralToneMapping, st,
      update(t, p) {
        const key = mode === 'unclos' || mode === 'declaration' ? Math.round(t * 30) : 0;
        if (key !== lastKey) { draw(px, key / 30); ptex.needsUpdate = true; lastKey = key; }
        extra?.(t);
        const shake = stamp ? Math.exp(-Math.max(0, t - tStamp) * 9) * (t >= tStamp ? 1 : 0) : 0;
        deskCam(camera, a, b, E.inOutSine(p), t); camera.position.y -= shake * 0.12;
        if (stamp) { const u = range(t, tStamp - 0.22, tStamp); const h = u < 1 ? (1 - E.inQuad(u)) * 2.2 : 0; const land = M.spring({ zeta: 0.45, bounces: 1.5 })(range(t, tStamp, tStamp + 0.4));
          stamp.visible = t >= tStamp - 0.22; stamp.position.set(-0.15, 0.09 + h, 1.1); stamp.rotation.z = 0.12 - 0.02 * land; const sc0 = t < tStamp ? 1.18 : 1 + 0.06 * (1 - land); stamp.scale.set(sc0, sc0, 1); }
        st.update(t);
      },
      dispose() { layer.remove(); } };
    paperTag(st, P.caption, { at: 0.4 }); paperTag(st, P.source, { corner: 'br', at: 0.9, size: 13 });
    return inst;
  };

  // ---------------------------------------------------------------- insurance: the premium meter, the cheque
  SETS.insurance = async (ctx, shot) => {
    const P = shot.params ?? {}, mode = P.mode ?? 'before', D = shot.duration;
    if (mode === 'cheque') return cheque(ctx, shot);
    const GX = 170, GW = 1580, GY = 560, GH = 74, MAX = 8, X = (v) => GX + GW * v / MAX;
    const tOld = mode === 'jump' ? 0.5 : wt(shot, 'tenth', 0, 3);
    const tNew = mode === 'jump' ? wt(shot, 'three', 0, 6) : Infinity;
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      ground(g);
      const dn = drift(p, 10);
      g.save(); g.translate(-dn * 0.4, 0);
      // the insured: a tanker crossing a band of sea along the bottom (depth layer, slower than the rail)
      { const by = 880; const sg2 = g.createLinearGradient(0, by, 0, 1080); sg2.addColorStop(0, '#5fc6c4'); sg2.addColorStop(0.3, pal.sea); sg2.addColorStop(1, pal.seaDeep);
        g.fillStyle = sg2; g.fillRect(-60, by, 2040, 260); const r = M.rng(13);
        for (let i = 0; i < 60; i++) { const d = r(); g.fillStyle = r() < 0.5 ? `rgba(8,60,80,${0.1 + 0.1 * d})` : `rgba(255,255,255,${0.1 + 0.12 * d})`; g.fillRect(((r() * 2100 + t * (8 + 20 * d)) % 2160) - 120 + dn * 0.6, by + 8 + d * 190, 30 + 150 * d, 1 + 2 * d); }
        ship(g, 420 + t * 14 + dn * 0.8, by + 2, 360, { dir: 1, wake: 0.8 }); }
      // the scale: an extruded paper rail with ticks every 1 %
      g.save(); shade(g, 1.4); g.fillStyle = pal.paper; rr(g, GX - 20, GY - 20, GW + 40, GH + 40, 12); g.fill(); g.restore();
      g.fillStyle = 'rgba(15,30,51,0.05)'; rr(g, GX, GY, GW, GH, 6); g.fill();
      g.font = `500 16px "Plex Mono"`; g.fillStyle = SOFT; g.textAlign = 'center';
      for (let v = 0; v <= MAX; v++) { g.fillRect(X(v) - 0.75, GY + GH + 20, 1.5, 14); g.fillText(`${v}%`, X(v), GY + GH + 60); }
      for (let v = 0; v <= MAX; v += 0.25) g.fillRect(X(v) - 0.5, GY + GH + 20, 1, 6);
      g.textAlign = 'left';
      // old band: 0.10–0.25 %, a turquoise sliver
      const ko = E.emphasized(range(t, tOld, tOld + 0.8)); if (ko > 0) { g.fillStyle = pal.seaDeep; g.fillRect(X(0.10), GY - 6 * ko, (X(0.25) - X(0.10)) * ko + 1, GH + 12 * ko);
        g.strokeStyle = pal.seaDeep; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0.175), GY - 14); g.lineTo(X(0.175), GY - 90 * ko); g.stroke(); }
      // new band: 3.5–7.5 %, red (the number that matters), grows from the old one
      const kn = E.decel(range(t, tNew, tNew + 1.3)); if (kn > 0) { const a0 = lerp(0.10, 3.5, kn), a1 = lerp(0.25, 7.5, kn);
        g.save(); shade(g, 1.2); g.fillStyle = '#a3170f'; rr(g, X(a0), GY + 8, X(a1) - X(a0), GH, 6); g.fill(); g.restore();
        const rg = g.createLinearGradient(0, GY, 0, GY + GH); rg.addColorStop(0, '#ee4a3f'); rg.addColorStop(1, RED); g.fillStyle = rg; rr(g, X(a0), GY, X(a1) - X(a0), GH, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(X(a0) + 6, GY + 5, Math.max(0, X(a1) - X(a0) - 12), 3); }
      g.restore();
    }, { par: 10, textDepth: 0.4 });
    metaCap(st, { text: 'WAR-RISK INSURANCE · PREMIUM FOR ONE TRANSIT', x: 150, y: 150, at: 0.2, size: 17 });
    fadeText(st, { html: '% OF THE SHIP’S VALUE', x: 152, y: 206, size: 14, style: MONO, at: 0.5 });
    fadeText(st, { html: `<div style="${SERIF};font-size:110px;line-height:1">0.10–0.25%</div><div style="${MONO_INK};font-size:15px;margin-top:10px">${mode === 'jump' ? 'BEFORE THE WAR' : 'BEFORE 2026'}</div>`, x: X(0.175) - 6, y: GY - 260, at: tOld + 0.3, size: 15, style: '' });
    if (mode === 'jump') fadeText(st, { html: `<div style="${NUM};font-size:130px;line-height:1">3.5–7.5%</div><div style="${MONO_INK};font-size:15px;margin-top:10px">SUMMER 2026</div>`, x: X(3.5), y: GY - 280, at: tNew + 0.9, size: 15, style: '' });
    srcLine(st, P.source, { at: 1.0, y: 846 });
    return inst;
  };
  async function cheque(ctx, shot) {
    const P = shot.params ?? {};
    const { scene, camera } = desk(ctx, { tone: '#e6d6b6' });
    const layer = layerOf(ctx), st = M.stage(layer);
    const CW = 2400, CH = 1040, c = mk(CW, CH), x = c.getContext('2d'), tex = texOf(c);
    const chq = sheet(tex, 6.2, 6.2 * CH / CW, { curl: 0.03, y: 0.02 }); chq.rotation.z = -0.06; scene.add(chq);
    const pen = new THREE.Group(); { const m1 = new THREE.MeshStandardMaterial({ color: '#0f1e33', roughness: 0.35, metalness: 0.4 }), m2 = new THREE.MeshStandardMaterial({ color: '#c9a35c', roughness: 0.3, metalness: 0.9 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.6, 24), m1); body.rotation.z = Math.PI / 2; body.castShadow = true; pen.add(body);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 24), m2); tip.rotation.z = -Math.PI / 2; tip.position.x = 1.45; tip.castShadow = true; pen.add(tip); }
    pen.position.set(1.6, 0.1, 2.1); pen.rotation.y = 0.5; scene.add(pen);
    const tA = wt(shot, 'seven', 0, 2.2);
    const words = 'Seven million five hundred thousand and 00/100';
    const draw = (t) => {
      x.fillStyle = '#eef6f3'; x.fillRect(0, 0, CW, CH);
      x.strokeStyle = 'rgba(23,163,166,0.16)'; x.lineWidth = 2; for (let i = 0; i < 70; i++) { x.beginPath(); for (let u = 0; u <= CW; u += 12) x.lineTo(u, CH * 0.5 + Math.sin(u * 0.006 + i * 0.35) * 380 * Math.sin(i * 0.11 + 0.4)); x.stroke(); }
      x.strokeStyle = 'rgba(11,111,134,0.5)'; x.lineWidth = 6; x.strokeRect(30, 30, CW - 60, CH - 60);
      x.fillStyle = INK; x.font = `600 52px ${DOCFONT}`; x.fillText('WAR-RISK PREMIUM · ONE TRANSIT', 100, 140);
      x.font = `500 30px "Plex Mono"`; x.fillStyle = SOFT; x.fillText('ILLUSTRATIVE · NOT A REAL INSTRUMENT', 100, 195); x.fillText('No. 000001', CW - 380, 140);
      x.font = `40px ${DOCFONT}`; x.fillStyle = INK; x.fillText('PAY TO THE', 100, 420); x.fillText('ORDER OF', 100, 470);
      x.fillRect(330, 478, 1450, 2); x.fillRect(100, 640, 1900, 2); x.fillText('DOLLARS', 2030, 640);
      x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(1840, 380, 460, 120);
      x.font = `40px ${DOCFONT}`; x.fillText('MEMO', 100, 900); x.fillRect(240, 908, 900, 2); x.fillRect(1450, 908, 820, 2);
      // the handwriting: revealed left to right from the word
      const hand = (s, px0, py, size, t0, dur, align = 'left') => { const k = E.inOutSine(range(t, t0, t0 + dur)); if (k <= 0) return; x.save(); x.font = `italic ${size}px "Instrument Serif"`; const w = x.measureText(s).width, x0 = align === 'right' ? px0 - w : px0;
        x.beginPath(); x.rect(x0 - 10, py - size, (w + 20) * k, size * 1.4); x.clip(); x.fillStyle = '#1b2f63'; x.fillText(s, x0, py); x.restore(); };
      hand('the War-Risk Underwriters', 360, 465, 84, tA - 1.4, 1.0);
      hand('$7,500,000.00', 2280, 470, 96, tA, 0.9, 'right');
      hand(words, 120, 625, 76, tA + 0.5, 1.6);
      hand('Strait of Hormuz, one way', 260, 895, 64, tA + 1.6, 0.9);
      // signature scribble
      const ks = E.inOutSine(range(t, tA + 2.2, tA + 3.0)); if (ks > 0) { x.save(); x.strokeStyle = '#1b2f63'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); const N = Math.floor(80 * ks);
        for (let i = 0; i <= N; i++) { const u = i / 80; x.lineTo(1500 + u * 700, 870 - Math.sin(u * 22) * 34 * (1 - u * 0.4) - u * 30); } x.stroke(); x.restore(); }
    };
    let lastKey = null;
    paperTag(st, P.caption, { at: 0.4 }); paperTag(st, P.source, { corner: 'br', at: 0.9, size: 13 });
    return { scene, camera, layer, toneMapping: THREE.NeutralToneMapping, st,
      update(t, p) {
        const key = Math.round(t * 30); if (key !== lastKey) { draw(key / 30); tex.needsUpdate = true; lastKey = key; }
        // the pen rides the handwriting, lifting a little between strokes
        const k1 = E.inOutSine(range(t, tA - 1.4, tA + 2.5)), writing = k1 > 0 && k1 < 1 ? 1 : 0;
        pen.position.set(lerp(-1.6, 2.2, k1), 0.12 + 0.05 * Math.abs(Math.sin(t * 7)) * writing, lerp(-0.4, 1.4, k1));
        deskCam(camera, [0.1, 0.3, 11.6, 1.02, 0.32], [0.4, 0.2, 9.8, 1.12, 0.18], E.inOutSine(p), t);
        st.update(t);
      }, dispose() { layer.remove(); } };
  }

  // ---------------------------------------------------------------- pump: a sunny price sign that flips
  SETS.pump = async (ctx, shot) => {
    const P = shot.params ?? {};
    const rows = [['REGULAR', String(P.gas ?? '4.35'), wt(shot, 'four', 0, 1.6)], ['DIESEL', String(P.diesel ?? '6.29'), wt(shot, 'six', 0, 3.6)]];
    const SX = 1120, SY = 150, SW = 640, SHh = 520; // sign cabinet
    const flip = (g, x, y, w, h, digit, prevDigit, k) => {
      // a split-flap card: top half folds down from prev to digit (k 0..1)
      const half = h / 2; g.font = `700 ${h * 0.86}px "Archivo Narrow"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const face = (d, clipTop) => { g.save(); g.beginPath(); g.rect(x, clipTop ? y : y + half, w, half); g.clip(); g.fillStyle = '#16233a'; rr(g, x, y, w, h, 8); g.fill(); g.fillStyle = '#fbf8f2'; g.fillText(d, x + w / 2, y + h * 0.53); g.restore(); };
      face(k < 1 ? digit : digit, true); face(k < 0.5 ? prevDigit : digit, false);
      if (k > 0 && k < 1) { const top = k < 0.5, sy = top ? Math.cos(k * Math.PI) : -Math.cos(k * Math.PI);
        g.save(); g.translate(0, y + half); g.scale(1, Math.max(0.001, sy)); g.translate(0, -(y + half)); g.beginPath(); g.rect(x, top ? y : y + half, w, half); g.clip();
        g.fillStyle = '#1d2c46'; rr(g, x, y, w, h, 8); g.fill(); g.fillStyle = '#fbf8f2'; g.fillText(top ? prevDigit : digit, x + w / 2, y + h * 0.53); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, y + half - 1, w, 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    };
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      const dn = drift(p, 16), HY = 760;
      // sky, sun, clouds
      const sk = g.createLinearGradient(0, 0, 0, HY); sk.addColorStop(0, '#3f8fdc'); sk.addColorStop(0.6, '#8cc0ec'); sk.addColorStop(1, '#dcebf2'); g.fillStyle = sk; g.fillRect(-60, -60, 2040, HY + 60);
      const sx = 980 - dn * 0.1, sy = 120; const gl = g.createRadialGradient(sx, sy, 0, sx, sy, 950); gl.addColorStop(0, 'rgba(255,254,248,1)'); gl.addColorStop(0.07, 'rgba(255,252,240,0.75)'); gl.addColorStop(0.3, 'rgba(255,250,236,0.22)'); gl.addColorStop(1, 'rgba(255,250,236,0)'); g.fillStyle = gl; g.fillRect(-60, -60, 2040, HY + 60);
      g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(sx, sy, 46, 0, TAU); g.fill();
      // flat cumulus: a row of overlapping domes on a flat base, a cool shade underneath (Kurzgesagt-style)
      const r = M.rng(3); for (let i = 0; i < 5; i++) { const cw = 220 + r() * 260, cx0 = ((r() * 2300 + t * (6 + r() * 6) - dn * 0.3) % 2400) - 200, cy0 = 150 + r() * 260;
        const domes = []; let x = cx0 - cw / 2; while (x < cx0 + cw / 2) { const rad = cw * (0.1 + 0.12 * r()) * (1 - Math.abs(x - cx0) / cw); domes.push([x, rad]); x += rad * 0.9 + 6; }
        g.save(); g.beginPath(); g.rect(cx0 - cw, cy0 - cw, cw * 2, cw); g.clip();
        g.fillStyle = 'rgba(214,228,242,0.95)'; for (const [dx0, rad] of domes) { g.beginPath(); g.arc(dx0, cy0 + 4, rad + 2, 0, TAU); g.fill(); }
        g.fillStyle = '#fbfdff'; for (const [dx0, rad] of domes) { g.beginPath(); g.arc(dx0 - 3, cy0 - 3, rad, 0, TAU); g.fill(); }
        g.restore(); }
      // far hills, desert, road
      ridge(g, -60 - dn * 0.15, 2040, HY, 70, '#b7c7d4', 4); ridge(g, -60 - dn * 0.3, 2040, HY, 40, '#c9b994', 11, 0.1, 0.8);
      const gg = g.createLinearGradient(0, HY, 0, 1080); gg.addColorStop(0, '#e9d4a6'); gg.addColorStop(1, '#d6b98a'); g.fillStyle = gg; g.fillRect(-60, HY, 2040, 400);
      g.fillStyle = '#8f8c88'; g.beginPath(); g.moveTo(-60, 905); g.lineTo(1980, 845); g.lineTo(1980, 1140); g.lineTo(-60, 1140); g.fill();
      g.fillStyle = '#f2ead8'; for (let i = 0; i < 14; i++) { const u = ((i * 160 - dn * 1.2) % 2240) - 120; g.fillRect(u, 990 - u * 0.03, 90, 6); }
      // the station canopy at the left (mid-ground): slab, fascia, columns, two pumps, its shadow
      { const cx0 = 60 - dn * 0.6, cw = 760, cy = 470, ch = 46;
        g.save(); g.globalAlpha = 0.2; g.fillStyle = '#4a3a22'; g.beginPath(); g.moveTo(cx0 + 40, 905); g.lineTo(cx0 + cw + 40, 885); g.lineTo(cx0 + cw + 260, 960); g.lineTo(cx0 + 260, 990); g.fill(); g.restore();
        for (const u of [0.12, 0.88]) { const px0 = cx0 + cw * u - 14, pg2 = g.createLinearGradient(px0, 0, px0 + 28, 0); pg2.addColorStop(0, '#f4f2ee'); pg2.addColorStop(1, '#a9b0bb'); g.fillStyle = pg2; g.fillRect(px0, cy + ch, 28, 905 - cy - ch - 20 * u); }
        for (const u of [0.32, 0.62]) { const px0 = cx0 + cw * u; g.save(); shade(g, 0.8); g.fillStyle = '#f6f3ec'; rr(g, px0, 760, 70, 140, 6); g.fill(); g.restore(); g.fillStyle = INK; g.fillRect(px0 + 12, 780, 46, 30); g.fillStyle = pal.sea; g.fillRect(px0, 760, 70, 8); }
        g.save(); shade(g, 1.2); g.fillStyle = '#fbf8f2'; g.fillRect(cx0, cy, cw, ch); g.restore();
        g.fillStyle = INK; g.fillRect(cx0, cy + ch - 12, cw, 12); g.fillStyle = pal.sea; g.fillRect(cx0, cy + 8, cw, 6);
        const ug = g.createLinearGradient(0, cy + ch, 0, cy + ch + 60); ug.addColorStop(0, 'rgba(60,60,70,0.25)'); ug.addColorStop(1, 'rgba(60,60,70,0)'); g.fillStyle = ug; g.fillRect(cx0, cy + ch, cw, 60); }
      // the pylon (depth layer: nearest, moves most), with its long shadow toward the camera-right
      const ox = -dn * 0.9, poleX = SX + SW / 2 - 30 + ox;
      g.save(); g.globalAlpha = 0.22; g.fillStyle = '#4a3a22'; g.beginPath(); g.moveTo(poleX, 900); g.lineTo(poleX + 60, 900); g.lineTo(poleX + 560, 1080); g.lineTo(poleX + 440, 1080); g.fill(); g.restore();
      const pg = g.createLinearGradient(poleX, 0, poleX + 60, 0); pg.addColorStop(0, '#dfe3e8'); pg.addColorStop(0.35, '#ffffff'); pg.addColorStop(1, '#8e98a6'); g.fillStyle = pg; g.fillRect(poleX - 20, SY + SHh - 10, 100, 920 - SY - SHh + 10);
      g.save(); shade(g, 2.4); g.fillStyle = '#f6f3ec'; rr(g, SX + ox, SY, SW, SHh, 18); g.fill(); g.restore();
      const cab = g.createLinearGradient(SX + ox, 0, SX + SW + ox, 0); cab.addColorStop(0, 'rgba(255,255,255,0.0)'); cab.addColorStop(0.15, 'rgba(255,255,255,0.35)'); cab.addColorStop(1, 'rgba(90,100,120,0.18)'); g.fillStyle = cab; rr(g, SX + ox, SY, SW, SHh, 18); g.fill();
      g.fillStyle = INK; rr(g, SX + ox, SY, SW, 110, [18, 18, 0, 0]); g.fill();
      g.fillStyle = pal.sea; g.fillRect(SX + ox, SY + 110, SW, 10);
      g.fillStyle = '#fbf8f2'; g.font = `400 66px "Instrument Serif"`; g.fillText('U.S. average', SX + ox + 40, SY + 78);
      g.font = `500 17px "Plex Mono"`; g.fillStyle = 'rgba(251,248,242,0.8)'; g.letterSpacing = '3px'; g.fillText('PER GALLON', SX + ox + SW - 210, SY + 72); g.letterSpacing = '0px';
      rows.forEach(([label, price, tw], j) => {
        const ry = SY + 160 + j * 175; g.fillStyle = INK; g.font = `500 22px "Plex Mono"`; g.letterSpacing = '4px'; g.fillText(label, SX + ox + 40, ry + 32); g.letterSpacing = '0px';
        g.font = `700 64px "Archivo Narrow"`; g.fillText('$', SX + ox + 220, ry + 100);
        const chars = [...price]; let cx0 = SX + ox + 270; const rng = M.rng(40 + j);
        chars.forEach((ch, i) => { if (ch === '.') { g.fillStyle = INK; g.beginPath(); g.arc(cx0 + 10, ry + 118, 8, 0, TAU); g.fill(); cx0 += 28; return; }
          // each card cycles through digits, then lands on its own: 6 + 3i flips, 70 ms apart
          const nflip = 6 + 3 * i, t0 = tw - 0.35 + i * 0.05, u = (t - t0) / 0.07, step = Math.floor(clamp(u, 0, nflip)), frac = u >= nflip ? 1 : u < 0 ? 0 : u - Math.floor(u);
          const seq = []; for (let q = 0; q < nflip; q++) seq.push(String(Math.floor(rng() * 10))); seq.push(ch);
          const cur = u < 0 ? '–' : seq[Math.min(step + (frac > 0 ? 1 : 0), nflip)], prev = u < 0 ? '–' : (step === 0 ? '–' : seq[step - 1]);
          const before = u <= 0 ? '–' : seq[Math.min(step, nflip)];
          flip(g, cx0, ry + 50, 74, 112, u >= nflip ? ch : cur, u < 0 ? '–' : (frac > 0 ? before : prev), u >= nflip || u < 0 ? 1 : E.inOutSine(frac));
          cx0 += 84; });
      });
    }, { par: 16, textDepth: 0.9 });
    srcLine(st, P.source, { at: 1.0, light: true });
    plateCap(st, P.caption ?? 'U.S. PUMP PRICES · SEPTEMBER 2026', { at: 0.3 });
    return inst;
  };

  // ---------------------------------------------------------------- flows: the world map, oil as particles
  let WORLD = null;
  const loadWorld = async () => WORLD ??= (async () => { const r = await fetch('/projects/hormuz/assets/geo/world.json'); if (!r.ok) throw new Error('hormuz: missing assets/geo/world.json'); return r.json(); })();
  // Equal Earth projection (Šavrič, Patterson, Jenny 2018), lon/lat degrees -> unit plane
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, MC = Math.sqrt(3) / 2;
  const ee = (lon, lat) => { const l = lon * Math.PI / 180, th = Math.asin(MC * Math.sin(lat * Math.PI / 180)), t2 = th * th, t6 = t2 * t2 * t2;
    return [l * Math.cos(th) / (MC * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))]; };
  const HORMUZ = [56.4, 26.4];
  const ROUTES = {
    china: { w: 0.33, pts: [HORMUZ, [58.6, 24.6], [62, 21], [70, 13], [80, 5.8], [92, 5.6], [98, 4.5], [103.6, 1.4], [107, 6], [111, 13], [115, 19], [119, 24], [122, 30]] },
    japan: { w: 0.12, pts: [HORMUZ, [58.6, 24.6], [62, 21], [70, 13], [80, 5.8], [92, 5.6], [98, 4.5], [103.6, 1.4], [108, 7], [114, 14], [121, 21], [128, 28], [134, 33.5]] },
    korea: { w: 0.1, pts: [HORMUZ, [58.6, 24.6], [62, 21], [70, 13], [80, 5.8], [92, 5.6], [98, 4.5], [103.6, 1.4], [108, 7], [114, 14], [121, 21], [124.5, 29], [128.8, 35]] },
    india: { w: 0.16, pts: [HORMUZ, [58.6, 24.6], [62, 22.5], [66, 21.5], [69.5, 22.3]] },
    asia: { w: 0.13, pts: [HORMUZ, [58.6, 24.6], [62, 21], [70, 13], [80, 5.8], [92, 5.6], [98, 4.5], [103.6, 1.4], [104.5, -1.5], [107, -5.8]] },
    europe: { w: 0.11, pts: [HORMUZ, [58.6, 24.6], [57.5, 19], [52, 14.5], [45, 12.3], [42.5, 14], [39, 20], [35, 26], [32.6, 29.8], [32.3, 31.4], [28, 33.5], [18, 36], [8, 37.8], [-5.6, 36], [-9.8, 39], [-9.5, 44], [-4, 48.3], [2.5, 50.6], [4, 51.9]] },
    us: { w: 0.05, pts: [HORMUZ, [58.6, 24.6], [60, 16], [56, 2], [46, -18], [36, -32], [20, -36], [8, -26], [-12, -8], [-32, 8], [-55, 20], [-75, 24.2], [-85, 25.2], [-91, 28.6], [-94, 29.4]] },
  };
  const ASIA4 = ['CHN', 'IND', 'JPN', 'KOR'];
  const ASIA_OTHER = ['TWN', 'SGP', 'THA', 'PAK', 'BGD', 'LKA', 'VNM', 'PHL', 'MYS', 'IDN', 'MMR', 'KHM', 'LAO', 'MNG', 'PRK', 'NPL', 'BTN'];
  const VIEWS = { // lon, lat, zoom at the start and end of the shot
    world: [[14, 10, 0.86], [20, 12, 0.93]], 'world-dim': [[22, 10, 0.95], [24, 10, 0.9]], 'one-price': [[14, 6, 0.86], [16, 6, 0.9]],
    river: [[62, 14, 2.3], [68, 13, 2.5]], asia: [[86, 16, 1.85], [90, 18, 2.0]], us: [[-14, 14, 1.12], [-24, 16, 1.2]], days: [[66, 10, 2.05], [70, 10, 2.2]],
  };
  SETS.flows = async (ctx, shot) => {
    const P = shot.params ?? {}, mode = P.mode ?? 'world', D = shot.duration;
    const Wd = await loadWorld();
    // projected rings, centroids (plane units and lon/lat)
    const C = Object.entries(Wd.countries).map(([iso, rings]) => {
      const pr = rings.map(r => { const a = new Float32Array(r.length); for (let i = 0; i < r.length; i += 2) { const [x, y] = ee(r[i], r[i + 1]); a[i] = x; a[i + 1] = y; } return a; });
      const big = rings.reduce((m, r) => r.length > m.length ? r : m, rings[0]); let lo = 0, la = 0; for (let i = 0; i < big.length; i += 2) { lo += big[i]; la += big[i + 1]; }
      return { iso, pr, ll: [lo / (big.length / 2), la / (big.length / 2)] };
    });
    const byIso = Object.fromEntries(C.map(c => [c.iso, c]));
    // outline of the projected sphere
    const rim = []; for (let la = -90; la <= 90; la += 3) rim.push(ee(180, la)); for (let la = 90; la >= -90; la -= 3) rim.push(ee(-180, la));
    // routes: dense polylines in plane units with cumulative length
    const routes = Object.entries(ROUTES).map(([name, R]) => {
      const P0 = R.pts.map(([lo, la]) => ee(lo, la)), pts = [];
      for (let i = 0; i < P0.length - 1; i++) { const p0 = P0[i - 1] ?? P0[i], p1 = P0[i], p2 = P0[i + 1], p3 = P0[i + 2] ?? p2;
        for (let s = 0; s < 1; s += 0.1) { const s2 = s * s, s3 = s2 * s; pts.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3))); } }
      pts.push(P0.at(-1)); const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { name, w: R.w, pts, cum, len: cum.at(-1) };
    });
    const at = (r, u) => { const s = u * r.len; let lo = 0, hi = r.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.cum[m] < s) lo = m; else hi = m; }
      const f = (s - r.cum[lo]) / ((r.cum[hi] - r.cum[lo]) || 1), a = r.pts[lo], b = r.pts[hi]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), b[0] - a[0], b[1] - a[1]]; };
    // particles: per route, count by weight; seeded phase and lateral offset
    const density = mode === 'world-dim' ? 0.23 : 1, NP = Math.round((mode === 'river' || mode === 'days' ? 1500 : 1100) * density);
    const parts = []; { const r = M.rng(21); for (const rt of routes) { const n = Math.round(NP * rt.w); for (let i = 0; i < n; i++) parts.push({ rt, ph: r(), off: (r() - 0.5) * 2, sp: 0.85 + 0.3 * r() }); } }
    const V = VIEWS[mode] ?? VIEWS.world;
    let view = { k: 355, cx: 0, cy: 0 };
    const toS = (x, y) => [960 + (x - view.cx) * view.k, 540 - (y - view.cy) * view.k];
    const ll2s = (lo, la) => { const [x, y] = ee(lo, la); return toS(x, y); };
    // timing
    const tUS = wt(shot, mode === 'world' ? 'country' : 'seven', 0, mode === 'world' ? D * 0.6 : 1.0);
    const tAsia = wt(shot, mode === 'one-price' ? 'asia' : 'eighty', 0, 1.2), tFour = wt(shot, 'china', 0, tAsia + 2), tAll = wt(shot, 'everyone', 0, D * 0.55);
    const dim = mode === 'world-dim';
    const LAND = dim ? '#e4dfd6' : pal.land, WATER = dim ? '#b3cccd' : pal.water, SH = dim ? '#cddcda' : pal.shallow;
    const fillOf = (c, t) => { // [color, alpha] for a country's highlight at time t
      if ((mode === 'world' || mode === 'us') && c.iso === 'USA') return [pal.sand, E.outCubic(range(t, tUS - 0.2, tUS + 0.6))];
      if (mode === 'asia') { if (ASIA4.includes(c.iso)) return ['#dcb26a', E.outCubic(range(t, tFour - 0.1, tFour + 0.8))]; if (ASIA_OTHER.includes(c.iso) || ASIA4.includes(c.iso)) return [pal.sand, E.outCubic(range(t, tAsia - 0.2, tAsia + 0.7))]; }
      if (mode === 'one-price') { const d = Math.hypot(((c.ll[0] - HORMUZ[0] + 540) % 360) - 180, c.ll[1] - HORMUZ[1]);
        const R = (ASIA4.includes(c.iso) || ASIA_OTHER.includes(c.iso)) ? 1e3 * E.outCubic(range(t, tAsia - 0.1, tAsia + 0.6)) : lerp(0, 230, E.inOutSine(range(t, tAll - 0.2, tAll + 2.2)));
        return [ASIA4.includes(c.iso) || ASIA_OTHER.includes(c.iso) ? '#dcb26a' : pal.sand, sstep(d - 14, d, R)]; }
      return null;
    };
    const { st, inst } = flat(ctx, shot, (g, t, p) => {
      const k = E.inOutSine(p), [lo, la, z] = [0, 1, 2].map(i => lerp(V[0][i], V[1][i], k)); const [cx, cy] = ee(lo, la); view = { k: 355 * z, cx, cy };
      ground(g, { tone: pal.bg, warm: 0.06 });
      // the sea: inside the projected sphere outline, with a soft shadow (the map lifted off the paper)
      g.save(); g.beginPath(); rim.forEach(([x, y], i) => { const [sx, sy] = toS(x, y); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.closePath();
      shade(g, 1.6); g.fillStyle = WATER; g.fill(); noShade(g); g.clip();
      const wg = g.createRadialGradient(...ll2s(70, 0), 0, ...ll2s(70, 0), 1400); wg.addColorStop(0, 'rgba(11,111,134,0.0)'); wg.addColorStop(1, 'rgba(11,111,134,0.28)'); g.fillStyle = wg; g.fillRect(-60, -60, 2040, 1200);
      // graticule
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1; for (let lo2 = -180; lo2 <= 180; lo2 += 30) { g.beginPath(); for (let la2 = -90; la2 <= 90; la2 += 5) { const [sx, sy] = ll2s(lo2, la2); la2 > -90 ? g.lineTo(sx, sy) : g.moveTo(sx, sy); } g.stroke(); }
      for (let la2 = -60; la2 <= 60; la2 += 30) { g.beginPath(); for (let lo2 = -180; lo2 <= 180; lo2 += 5) { const [sx, sy] = ll2s(lo2, la2); lo2 > -180 ? g.lineTo(sx, sy) : g.moveTo(sx, sy); } g.stroke(); }
      // land: one path; shelf strokes, shadowed fill, grain, borders
      const land = new Path2D(); const vis = (a) => true;
      for (const c of C) for (const a of c.pr) { if (!vis(a)) continue; for (let i = 0; i < a.length; i += 2) { const sx = 960 + (a[i] - view.cx) * view.k, sy = 540 - (a[i + 1] - view.cy) * view.k; i ? land.lineTo(sx, sy) : land.moveTo(sx, sy); } land.closePath(); }
      g.lineJoin = 'round'; g.strokeStyle = SH; g.globalAlpha = 0.55; g.lineWidth = 7 * z; g.stroke(land); g.globalAlpha = 0.9; g.lineWidth = 3 * z; g.stroke(land); g.globalAlpha = 1;
      g.save(); g.shadowColor = 'rgba(40,60,70,0.22)'; g.shadowBlur = 10 * S; g.shadowOffsetX = 2 * S; g.shadowOffsetY = 4 * S; g.fillStyle = LAND; g.fill(land); g.restore();
      for (const c of C) { const f = fillOf(c, t); if (!f || f[1] <= 0.001) continue; const pth = new Path2D(); for (const a of c.pr) { for (let i = 0; i < a.length; i += 2) { const sx = 960 + (a[i] - view.cx) * view.k, sy = 540 - (a[i + 1] - view.cy) * view.k; i ? pth.lineTo(sx, sy) : pth.moveTo(sx, sy); } pth.closePath(); }
        g.globalAlpha = f[1]; g.fillStyle = f[0]; g.fill(pth); g.globalAlpha = 1; }
      texture(g, () => g.fill(land), 0.5);
      g.strokeStyle = dim ? 'rgba(70,83,106,0.25)' : 'rgba(70,83,106,0.38)'; g.lineWidth = 0.9; g.stroke(land);
      // routes (a faint navy lane), then the oil
      const reveal = mode === 'world-dim' ? 1 : E.outCubic(range(t, 0.2, 2.6));
      for (const rt of routes) { const focusA = mode === 'us' ? (rt.name === 'us' ? 1 : 0.3) : 1; g.strokeStyle = `rgba(15,30,51,${0.13 * focusA})`; g.lineWidth = (rt.w * 30 + 2) * Math.sqrt(z); g.lineCap = 'round'; g.beginPath();
        const n = Math.floor(rt.pts.length * reveal); rt.pts.slice(0, Math.max(2, n)).forEach(([x, y], i) => { const [sx, sy] = toS(x, y); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.stroke(); }
      const dots = new Path2D(), dotsDim = new Path2D(), tails = new Path2D(), rad = 1.25 * Math.sqrt(z) + 0.5;
      for (const q of parts) { const u = (q.ph + t * 0.16 * q.sp / q.rt.len) % 1; if (u > reveal) continue;
        const [x, y, dx, dy] = at(q.rt, u), dl = Math.hypot(dx, dy) || 1, wspan = (0.003 + q.rt.w * 0.03) * sstep(0, 0.04, u) * (1 - 0.5 * u), [sx, sy] = toS(x - dy / dl * q.off * wspan, y + dx / dl * q.off * wspan);
        const dimmed = mode === 'us' && q.rt.name !== 'us', P2 = dimmed ? dotsDim : dots; P2.moveTo(sx + rad, sy); P2.arc(sx, sy, rad, 0, TAU);
        if (!dimmed) { tails.moveTo(sx, sy); tails.lineTo(sx - dx / dl * 0.012 * view.k, sy + dy / dl * 0.012 * view.k); } }
      g.strokeStyle = 'rgba(15,30,51,0.35)'; g.lineWidth = rad; g.stroke(tails); g.fillStyle = INK; g.fill(dots); g.fillStyle = 'rgba(15,30,51,0.25)'; g.fill(dotsDim);
      g.restore();
      // the strait: a red ring (annotation), breathing
      const [hx, hy] = ll2s(...HORMUZ), pr = 0.5 + 0.5 * Math.sin(t * 3); g.strokeStyle = RED; g.lineWidth = 3; g.beginPath(); g.arc(hx, hy, 12 + 4 * z + pr * 3, 0, TAU); g.stroke();
      g.globalAlpha = 0.35 * (1 - pr); g.beginPath(); g.arc(hx, hy, 22 + 4 * z + pr * 16, 0, TAU); g.stroke(); g.globalAlpha = 1;
      // red hand-drawn loop around the US (world: on "country")
      if (mode === 'world') { const kl = E.inOutCubic(range(t, tUS, tUS + 0.8)); if (kl > 0) { const [ux, uy] = ll2s(-98, 39), rx = 0.36 * view.k * 0.62, ry = 0.2 * view.k * 0.62; const r = M.rng(4);
        g.strokeStyle = RED; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); const N = Math.floor(90 * kl); for (let i = 0; i <= N; i++) { const a = -2 + i / 90 * TAU * 1.12, gg = 1 + 0.07 * i / 90 + (r() - 0.5) * 0.012; const X = ux + Math.cos(a) * rx * gg, Y = uy + Math.sin(a) * ry * gg; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); } }
      // days: the calendar card (20 days of normal flow fill as the oil runs)
      if (mode === 'days') { const n = P.days ?? 20, X0 = 150, Y0 = 830, cw = 66, kc = E.emphasized(range(t, 0.3, 1.0)), tf0 = 1.0, tf1 = Math.max(tf0 + 2, wt(shot, 'twenty', 0, D * 0.5) + 0.4);
        g.save(); g.globalAlpha = kc; shade(g, 1.8); g.fillStyle = pal.paper; rr(g, X0 - 34, Y0 - 160, n * cw + 48, 270, 10); g.fill(); noShade(g);
        for (let i = 0; i < n; i++) { const kf = E.outCubic(range(t, lerp(tf0, tf1, i / n), lerp(tf0, tf1, i / n) + 0.25)); g.fillStyle = 'rgba(15,30,51,0.08)'; rr(g, X0 + i * cw, Y0, cw - 10, 70, 6); g.fill();
          if (kf > 0) { g.fillStyle = pal.seaDeep; g.globalAlpha = kc * kf; rr(g, X0 + i * cw, Y0 + 70 * (1 - kf), cw - 10, 70 * kf, 6); g.fill(); g.globalAlpha = kc; }
          g.font = `500 13px "Plex Mono"`; g.fillStyle = SOFT; g.fillText(String(i + 1), X0 + i * cw + 4, Y0 + 92); }
        g.restore(); }
    }, { par: 0, textDepth: 0 });
    // labels that ride the map (DOM, positioned from the live view every frame)
    const pins = [];
    const pin = (lo, la, html, { at = 0, anchor = 'tl', dx = 0, dy = 0, size = 15, style = MONO_INK, out } = {}) => { const it = fadeText(st, { html, x: 0, y: 0, size, style, at, anchor, out }); pins.push({ it, lo, la, dx, dy }); return it; };
    st.add({ update() { for (const q of pins) { const [x, y] = ll2s(q.lo, q.la); q.it.el.style.left = (x + q.dx) + 'px'; q.it.el.style.top = (y + q.dy) + 'px'; } } });
    if (mode !== 'river' && mode !== 'days') pin(HORMUZ[0], HORMUZ[1], 'STRAIT OF HORMUZ', { at: 0.4, dx: -24, dy: -54, anchor: 'tr', size: 13 });
    const big = (txt, sz = 92, st2 = SERIF) => `<div style="${st2};font-size:${sz}px;line-height:1">${txt}</div>`, cap = (txt, c = MONO_INK) => `<div style="${c};font-size:14px;margin-top:8px">${txt}</div>`;
    if (mode === 'world') pin(-98, 39, 'UNITED STATES', { at: tUS + 0.6, dx: 0, dy: 90, anchor: 'tc' });
    if (mode === 'river') legendCard(st, { x: 1240, y: 110, width: 560, rows: [
      { html: big('20 million') + cap('BARRELS OF OIL A DAY · 2024'), at: wt(shot, 'twenty', 0, 1) + 0.1 },
      { html: big('≈ one fifth', 60) + cap('OF ALL THE OIL THE WORLD CONSUMES', MONO), at: wt(shot, 'fifth', 0, 4) } ] });
    if (mode === 'asia') { legendCard(st, { x: 1270, y: 650, width: 540, rows: [
        { html: big('84%', 110, NUM) + cap('OF THE CRUDE WENT TO ASIA'), at: tAsia + 0.1 },
        { html: big('69%', 76) + cap('CHINA · INDIA · JAPAN · SOUTH KOREA', MONO), at: wt(shot, 'two', 0, tFour + 1.5) } ] });
      for (const [iso, lo, la] of [['CHINA', 103, 34], ['INDIA', 78, 22], ['JAPAN', 139, 37], ['S. KOREA', 128, 36.5]]) pin(lo, la, iso, { at: tFour + 0.3, anchor: 'tc', size: 13 }); }
    if (mode === 'us') { pin(-98, 39, 'UNITED STATES', { at: 0.5, anchor: 'tc', dy: -10, size: 14 });
      legendCard(st, { x: 1250, y: 650, width: 560, rows: [{ html: big('≈ 7%', 110, NUM) + cap('OF U.S. CRUDE IMPORTS CAME THROUGH HORMUZ') + cap('ABOUT 0.5 MILLION BARRELS A DAY · 2024', MONO), at: tUS + 0.1 }] }); }
    if (mode === 'days') fadeText(st, { html: big('400 million barrels', 60) + cap(`≈ ${P.days ?? 20} DAYS OF NORMAL FLOW THROUGH HORMUZ`), x: 150, y: 700, size: 14, style: '', at: 0.5 });
    if (mode === 'one-price') { pin(100, 52, 'ASIA FIRST', { at: tAsia + 0.4, anchor: 'tc', size: 14 });
      legendCard(st, { x: 120, y: 820, width: 620, rows: [{ html: big('One world price.', 76), at: wt(shot, 'one', 0, D - 2) }] }); }
    srcLine(st, P.source, { at: 1.0 });
    return inst;
  };

  return SETS;
}
