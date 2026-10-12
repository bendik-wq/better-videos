// LIVE WIRE screen graphics: everything that lives on a phosphor CRT. Each set paints a 2D canvas that goes
// through the CRT pass (sets/lw.js crt(): curvature, scanlines, mask, bloom, vignette, collapse).
//
//   scope     the 50 Hz heartbeat.   params.mode: 'steady' | 'stutter' | 'flat' | 'drop' | 'corner'
//             at (word or s): when it flatlines / starts to fall / moves to the corner; to (Hz, drop), span (s),
//             end ('flat' | 'hold' | 'recover'), label, text (corner mode: the line typed beside it), caption
//   chapter   the scope runs, flatlines, the line stays as a rule and the title types on above it.
//             params: num, title, sub, at (flatline time, default 0.9 s)
//   title     the episode title strikes on letter by letter like fluorescent tubes over a 50 Hz trace; at the
//             end the power fails and the letters die. params: title, kicker, sub, end (true: no failure, slow)
//   numbers   CRT counter readouts. params.items [{ value, word, prefix, suffix, sub, red, decimals, from }],
//             source, label
//   quote     a quote typed on a SCADA terminal. params: text, by, mode ('screen' | 'printout': green-bar
//             paper from a dot-matrix printer, sets/rooms.js), red
//   map-ops   a clean CRT tactical map. params.view: 'ukraine' | 'us' | 'both'; pins [{ name, lon, lat, word,
//             sub, red }], arcs [{ from: [lon, lat], to: [lon, lat], word }], focus: [lon, lat], zoom, title, label
import * as THREE from 'three';
import * as LW from './lw.js';

const { clamp, lerp, range, sstep, smoother, outCubic, glowText, glowPath, hash, PAL, FONT } = LW;

export default function makeScreens(H) {
  // a CRT set: paint(g, t, p, S) draws into the 1080p-authored canvas; crtOpts tune the tube; power(t) etc.
  function crtSet(ctx, shot, paint, crtOpts = {}, extra = {}) {
    const { layer } = H.base(ctx);
    const C = LW.crt(ctx, crtOpts), g = C.g, W = ctx.width, Ht = ctx.height, S = Ht / 1080;
    const cap = shot.params?.caption ? H.caption(layer, shot.params.caption) : null;
    const src = shot.params?.source ? H.sourceLine(layer, shot.params.source) : null;
    let state = {};
    return {
      scene: C.scene, camera: C.camera, layer,
      update(t, p) { LW.reset(g); g.fillStyle = '#000'; g.fillRect(0, 0, W, Ht); state = paint(g, t, p, S, W, Ht) ?? {}; cap?.type(t); },
      render(r) { C.render(r, { t: state.t ?? 0, power: state.power ?? 1, sqY: state.sqY ?? 1, sqX: state.sqX ?? 1 }); },
      dispose() { C.dispose(); }, ...extra,
    };
  }

  // ---------------------------------------------------------------- scope
  async function scope(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'steady', D = shot.duration;
    const at = H.cue(shot, P.at, mode === 'corner' ? 1.6 : Math.min(2.2, D * 0.45));
    const smode = mode === 'corner' ? (P.scopeMode ?? 'steady') : mode;
    const label = P.label ?? (mode === 'drop' ? 'GRID FREQUENCY · UKRAINE' : 'GRID FREQUENCY');
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      // the locked camera on the tube creeps in by 3 % over the shot (Fincher: precise, slow)
      const z = 1 + 0.03 * smoother(t / Math.max(D, 1));
      let box = [W * 0.09, Ht * 0.15, W * 0.82, Ht * 0.7];
      if (mode === 'corner') { const k = smoother(range(t, at, at + 1.1)); const tgt = [W * 0.69, Ht * 0.07, W * 0.26, Ht * 0.2]; box = box.map((v, i) => lerp(v, tgt[i], k)); }
      g.save(); g.translate(W / 2, Ht / 2); g.scale(z, z); g.translate(-W / 2, -Ht / 2);
      const st = LW.drawScope(g, box, t, { mode: smode, at, span: P.span ?? 4.5, to: P.to ?? 47.6, end: P.end ?? 'flat', scale: box[3] / 760, cycles: P.cycles ?? 2.5, label: mode === 'corner' ? null : P.label ?? label, vdiv: P.vdiv ?? '100 kV', seed: P.seed ?? 3 });
      g.restore();
      // the big frequency readout over the tube (drop mode): the number that matters
      if (mode === 'drop' || P.big) {
        const f = st.dead > 0 ? (P.to ?? 47.6) : st.f; const alarm = f < 49.2; const dead = st.dead >= 1;
        glowText(g, dead ? '--.--' : `${f.toFixed(2)}`, W * 0.09 + 6 * S, Ht * 0.115, { font: `600 ${118 * S}px ${FONT.display}`, color: alarm ? PAL.red : PAL.phosphor, base: 'alphabetic' });
        g.font = `600 ${118 * S}px ${FONT.display}`; const wv = g.measureText(dead ? '--.--' : f.toFixed(2)).width;
        glowText(g, 'Hz', W * 0.09 + 16 * S + wv, Ht * 0.115, { font: `${54 * S}px ${FONT.term}`, alpha: 0.8 });
        if (alarm && st.dead < 1) glowText(g, 'UNDER-FREQUENCY', W * 0.91, Ht * 0.105, { font: `${44 * S}px ${FONT.term}`, align: 'right', color: PAL.red, alpha: Math.floor(t * 3) % 2 ? 0.45 : 1 });
      }
      if (mode === 'corner' && P.text) {
        const n = LW.typeCount(P.text, t, at + 0.9, P.cps ?? 24, 5);
        g.font = `${P.size ?? 96}px ${FONT.term}`;
        const lines = wrap(g, P.text, W * 0.62, `${(P.size ?? 96) * S}px ${FONT.term}`);
        let k = n, y = Ht * 0.48 - (lines.length - 1) * (P.size ?? 96) * S * 0.5, cur = t < at + 0.6;
        for (const ln of lines) { const s = ln.slice(0, Math.max(0, k)); k -= ln.length + 1; glowText(g, s, W * 0.08, y, { font: `${(P.size ?? 96) * S}px ${FONT.term}` });
          if (!cur && k < 0) { g.font = `${(P.size ?? 96) * S}px ${FONT.term}`; LW.cursorBlock(g, W * 0.08 + g.measureText(s).width + 6 * S, y, (P.size ?? 96) * S, t, { on: true }); cur = true; }
          y += (P.size ?? 96) * S * 1.05; }
      }
      return { t, power: 1 };
    }, { curve: 0.14, bloom: 1.0 });
  }

  // ---------------------------------------------------------------- chapter
  async function chapter(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration;
    const fl = P.at ?? 0.9, title = String(P.title ?? 'Chapter').toUpperCase(), sub = String(P.sub ?? '').toUpperCase();
    const num = String(P.num ?? 1).padStart(2, '0');
    const tStart = fl + 0.75, cps = clamp(title.length / 0.9, 9, 22);
    const tEnd = LW.typeEnd(title, tStart, cps, 11);
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      const cy = Ht * 0.6;
      // the trace: full width, no graticule; a steady 50 Hz that flatlines into the rule under the title
      const st = LW.drawScope(g, [W * 0.06, cy - Ht * 0.22, W * 0.88, Ht * 0.44], t, { mode: 'flat', at: fl, fall: 0.5, grid: 0, readout: false, cycles: 4.5, amp: 0.5, width: 3, scale: S, noSignal: false });
      // readout in the corner: 50.00 Hz -> 0.00 Hz
      glowText(g, st.dead >= 1 ? '00.00 Hz' : `${st.f.toFixed(2)} Hz`, W * 0.94, Ht * 0.12, { font: `${40 * S}px ${FONT.term}`, align: 'right', alpha: 0.75, color: st.dead > 0.02 ? PAL.red : PAL.phosphor });
      glowText(g, `CH ${num}`, W * 0.06, Ht * 0.12, { font: `${40 * S}px ${FONT.term}`, alpha: 0.75 * sstep(fl + 0.4, fl + 0.6, t) });
      // title
      const n = LW.typeCount(title, t, tStart, cps, 11), s = LW.typed(title, n), fs = (P.size ?? 168) * S;
      g.font = `800 ${fs}px ${FONT.display}`; g.letterSpacing = `${2 * S}px`;
      glowText(g, s, W * 0.06, cy - 34 * S, { font: `800 ${fs}px ${FONT.display}`, glow: 0.8, spacing: 2 * S });
      const tw = g.measureText(s).width;
      if (t > tStart - 0.3) LW.cursorBlock(g, W * 0.06 + tw + 10 * S, cy - 34 * S, fs * 0.8, t, { on: true, w: fs * 0.32 });
      g.letterSpacing = '0px';
      if (sub) { const n2 = LW.typeCount(sub, t, tEnd + 0.25, 30, 12); glowText(g, LW.typed(sub, n2), W * 0.06, cy + 70 * S, { font: `${48 * S}px ${FONT.term}`, alpha: 0.8, color: PAL.fluoro }); }
      return { t };
    }, { curve: 0.1, bloom: 0.95, scan: 0.25 });
  }

  // ---------------------------------------------------------------- title
  async function title(ctx, shot) {
    const P = shot.params ?? {}, D = shot.duration, END = !!P.end;
    const kicker = String(P.kicker ?? 'THE HACKERS WHO CAN').toUpperCase();
    const big = (P.lines ?? ['TURN OFF', 'THE POWER']).map(s => s.toUpperCase());
    const fail = END ? Infinity : (P.failAt ?? D - 1.5);
    // per-letter strike times (deterministic), kicker first, then the big lines
    const letters = [];
    const pushLine = (txt, line) => [...txt].forEach((ch, i) => letters.push({ ch, line, i, t0: 0.55 + (line === 0 ? i * 0.035 : 0.75 + (line - 1) * 0.42 + i * 0.07 + hash(i, line) * 0.12) * (END ? 1.4 : 1), die: fail + hash(i, line, 'd') * 0.9 }));
    pushLine(kicker, 0); big.forEach((b, k) => pushLine(b, k + 1));
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      // tube warm-up: a dot, a line, the raster
      const sqX = Math.max(0.006, sstep(0.0, 0.18, t)), sqY = Math.max(0.004, Math.pow(sstep(0.12, 0.5, t), 1.5));
      const sizes = [74 * S, 232 * S, 232 * S], ys = [Ht * 0.25, Ht * 0.49, Ht * 0.73], fonts = [`600 ${sizes[0]}px ${FONT.display}`, `900 ${sizes[1]}px ${FONT.display}`, `900 ${sizes[2]}px ${FONT.display}`];
      const spacing = [14 * S, 6 * S, 6 * S];
      // layout per line (centred)
      const lineTxt = [kicker, ...big]; const widths = lineTxt.map((s, i) => { g.font = fonts[i]; g.letterSpacing = `${spacing[i]}px`; return g.measureText(s).width; });
      const advance = (i, k) => { g.font = fonts[i]; g.letterSpacing = `${spacing[i]}px`; return g.measureText(lineTxt[i].slice(0, k)).width; };
      for (const L of letters) {
        let b = LW.strike(range(t, L.t0, L.t0 + 0.5), L.i * 7 + L.line);
        if (t > L.die) b *= LW.flickerOut(range(t, L.die, L.die + 0.55), L.i + L.line * 31);
        if (b <= 0.01) continue;
        const x = W / 2 - widths[L.line] / 2 + advance(L.line, L.i);
        glowText(g, L.ch, x, ys[L.line], { font: fonts[L.line], alpha: b, glow: 0.9, spacing: spacing[L.line], color: L.line === 0 ? PAL.fluoro : PAL.phosphor });
      }
      g.letterSpacing = '0px';
      // the 50 Hz trace along the bottom: steady, stutters as the power fails, flatlines
      const mode = END ? 'steady' : 'flat';
      LW.drawScope(g, [W * 0.18, Ht * 0.81, W * 0.64, Ht * 0.12], t, { mode: t > fail - 0.8 && t < fail ? 'stutter' : mode, at: fail + 0.2, grid: 0, readout: false, cycles: 6, amp: 0.4, width: 2.2, scale: S, alpha: sstep(0.5, 1.2, t) * 0.8 });
      if (P.sub) glowText(g, String(P.sub).toUpperCase(), W / 2, Ht * 0.96, { font: `${34 * S}px ${FONT.term}`, align: 'center', alpha: 0.6 * sstep(2.4, 3, t) });
      return { t, sqX, sqY };
    }, { curve: 0.12, bloom: 1.05, scan: 0.22 });
  }

  // ---------------------------------------------------------------- numbers
  async function numbers(ctx, shot) {
    const P = shot.params ?? {}, items = P.items ?? [{ value: 230000, word: null, sub: 'customers without power' }];
    const n = items.length;
    const T = items.map((it, i) => H.cue(shot, it.word, 0.4 + i * 1.2));
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      if (P.label) glowText(g, String(P.label).toUpperCase(), W * 0.07, Ht * 0.13, { font: `${44 * S}px ${FONT.term}`, alpha: 0.7, color: PAL.fluoro });
      items.forEach((it, i) => {
        const t0 = T[i]; if (t < t0 - 0.05) return;
        const k = outCubic(range(t, t0, t0 + (it.roll ?? 1.25)));
        const from = it.from ?? 0, v = lerp(from, it.value, k), dec = it.decimals ?? (Number.isInteger(it.value) ? 0 : 1);
        const txt = (it.prefix ?? '') + fmt(v, dec) + (it.suffix ?? '');
        const y = n === 1 ? Ht * 0.56 : Ht * (0.36 + i * (0.5 / Math.max(1, n - 1)) * (n > 2 ? 1 : 1.05));
        const fs = (n === 1 ? 300 : n === 2 ? 210 : 150) * S;
        const settle = sstep(0, 0.12, t - t0 - (it.roll ?? 1.25)) * (1 - sstep(0.12, 0.6, t - t0 - (it.roll ?? 1.25)));
        const col = it.red ? PAL.red : PAL.phosphor;
        // the counter: digits still rolling carry a vertical smear (an odometer on a slow phosphor)
        if (k < 1) for (let j = 1; j <= 3; j++) glowText(g, (it.prefix ?? '') + fmt(lerp(from, it.value, outCubic(range(t - j * 0.03, t0, t0 + (it.roll ?? 1.25)))), dec) + (it.suffix ?? ''), W * 0.07, y - j * 10 * S * (1 - k), { font: `800 ${fs}px ${FONT.display}`, alpha: 0.12 / j, color: col });
        glowText(g, txt, W * 0.07, y, { font: `800 ${fs}px ${FONT.display}`, color: col, glow: 0.9 + settle * 2.5, alpha: sstep(t0 - 0.05, t0 + 0.1, t) });
        if (it.sub) { const ns = LW.typeCount(String(it.sub).toUpperCase(), t, t0 + 0.35, 34, 20 + i); glowText(g, LW.typed(String(it.sub).toUpperCase(), ns), W * 0.072, y + fs * 0.3, { font: `${(n === 1 ? 54 : 44) * S}px ${FONT.term}`, alpha: 0.85, color: PAL.fluoro }); }
      });
      return { t };
    }, { curve: 0.1, bloom: 0.95 });
  }
  const fmt = (v, dec) => { const s = Math.abs(v).toFixed(dec); const [a, b] = s.split('.'); return (v < 0 ? '−' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };

  // ---------------------------------------------------------------- quote (screen)
  function wrap(g, text, maxW, font) { g.font = font; const words = String(text).split(/\s+/); const lines = []; let cur = '';
    for (const w of words) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; } if (cur) lines.push(cur); return lines; }
  async function quote(ctx, shot) {
    const P = shot.params ?? {};
    if (P.mode === 'printout' && H.printout) return H.printout(ctx, shot);
    const text = P.text ?? '“…”', by = String(P.by ?? '').toUpperCase(), D = shot.duration;
    const v0 = H.M.vo0(shot), vd = shot.voDur || D * 0.7;
    const cps = clamp(text.length / Math.max(1.2, vd * 0.8), 12, 40), at = v0 + 0.15;
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      const fs = (P.size ?? (text.length > 140 ? 58 : 72)) * S, font = `${fs}px ${FONT.term}`;
      glowText(g, P.header ?? `> PRINT LOG  ·  ${by || 'TERMINAL'}`, W * 0.08, Ht * 0.14, { font: `${36 * S}px ${FONT.term}`, alpha: 0.5 });
      const lines = wrap(g, text, W * 0.8, font);
      const n = LW.typeCount(text, t, at, cps, 9); let k = n; let y = Ht * 0.5 - (lines.length - 1) * fs * 0.55;
      let curX = null, curY = null;
      for (const ln of lines) { const s = ln.slice(0, Math.max(0, k)); k -= ln.length + 1; if (s.length || curX === null) {
          glowText(g, s, W * 0.08, y, { font, color: P.red ? PAL.red : PAL.fluoro, glow: 0.7 }); g.font = font; if (s.length < ln.length || k < 0) { if (curX === null) { curX = W * 0.08 + g.measureText(s).width + 8 * S; curY = y; } } }
        y += fs * 1.1; }
      const done = n >= text.length;
      if (!done && curX !== null) LW.cursorBlock(g, curX, curY, fs, t, { on: true });
      if (done && by) { const tb = LW.typeEnd(text, at, cps, 9) + 0.3; const nb = LW.typeCount('— ' + by, t, tb, 30, 4); glowText(g, LW.typed('— ' + by, nb), W * 0.08, y + fs * 0.4, { font: `${40 * S}px ${FONT.term}`, alpha: 0.7, color: PAL.inkSoft });
        g.font = `${40 * S}px ${FONT.term}`; LW.cursorBlock(g, W * 0.08 + g.measureText(LW.typed('— ' + by, nb)).width + 6 * S, y + fs * 0.4, 40 * S, t); }
      return { t };
    }, { curve: 0.12, bloom: 0.85 });
  }

  // ---------------------------------------------------------------- map-ops
  let GEO = null;
  const geo = () => GEO ??= fetch('/projects/blackout/assets/geo/vectors.json').then(r => r.json());
  const VIEWS = {
    ukraine: { box: [21.6, 43.9, 40.6, 52.8], pins: [
      { name: 'IVANO-FRANKIVSK', lon: 24.71, lat: 48.92, sub: 'PRYKARPATTYAOBLENERGO' }, { name: 'CHERNIVTSI', lon: 25.94, lat: 48.29, sub: 'CHERNIVTSIOBLENERGO' },
      { name: 'KYIV', lon: 30.52, lat: 50.45, sub: 'KYIVOBLENERGO' }] },
    us: { box: [-125.5, 23.5, -66.5, 50], pins: [] },
  };
  async function mapOps(ctx, shot) {
    const P = shot.params ?? {}, view = P.view ?? 'ukraine', D = shot.duration;
    const data = await geo();
    const views = view === 'both' ? ['ukraine', 'us'] : [view];
    const pins = (P.pins ?? (view === 'both' ? [] : VIEWS[view].pins)).map((pn, i) => ({ ...pn, t0: H.cue(shot, pn.word, 0.9 + i * 0.7) }));
    const arcs = (P.arcs ?? []).map((a, i) => ({ ...a, t0: H.cue(shot, a.word, 1.2 + i * 0.8) }));
    return crtSet(ctx, shot, (g, t, p, S, W, Ht) => {
      views.forEach((vw, vi) => {
        const V = VIEWS[vw], panel = views.length === 2 ? [vi * W / 2, 0, W / 2, Ht] : [0, 0, W, Ht];
        let [lo0, la0, lo1, la1] = V.box; const fc = P.focus ?? [(lo0 + lo1) / 2, (la0 + la1) / 2];
        // slow push toward the focus (on the camera's terms: one motivated move)
        const z = (P.zoom ?? 1) * (1 + (P.push ?? 0.12) * smoother(t / Math.max(D, 1)));
        const kx = Math.cos((la0 + la1) / 2 * Math.PI / 180);
        const sc = Math.min(panel[2] * 0.9 / ((lo1 - lo0) * kx), panel[3] * 0.82 / (la1 - la0)) * z;
        const X = (lon) => panel[0] + panel[2] / 2 + (lon - fc[0]) * kx * sc, Y = (lat) => panel[1] + panel[3] * 0.53 - (lat - fc[1]) * sc;
        g.save(); g.beginPath(); g.rect(panel[0], panel[1], panel[2], panel[3]); g.clip();
        // graticule
        g.strokeStyle = 'rgba(93,255,158,0.07)'; g.lineWidth = 1 * S;
        for (let lo = Math.floor(lo0 - 10); lo <= lo1 + 10; lo += 2) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), Ht); g.stroke(); }
        for (let la = Math.floor(la0 - 10); la <= la1 + 10; la += 2) { g.beginPath(); g.moveTo(panel[0], Y(la)); g.lineTo(panel[0] + panel[2], Y(la)); g.stroke(); }
        const R = data.regions[vw === 'ukraine' ? 'ua' : 'us'];
        const draw = (L, style, w, close = false) => { for (const a of L ?? []) { g.beginPath(); for (let i = 0; i < a.length; i += 2) { const x = X(a[i]), y = Y(a[i + 1]); i ? g.lineTo(x, y) : g.moveTo(x, y); } if (close) { g.fillStyle = style; g.fill(); } else { g.strokeStyle = style; g.lineWidth = w; g.stroke(); } } };
        const reveal = sstep(0, 0.9, t);
        g.globalAlpha = reveal;
        draw(R.land, 'rgba(10,32,20,0.55)', 0, true);
        draw(R.states, 'rgba(93,255,158,0.16)', 1 * S);
        draw(R.borders, 'rgba(93,255,158,0.38)', 1.4 * S);
        draw(R.coast, 'rgba(93,255,158,0.5)', 1.4 * S);
        // the subject country, brighter
        const home = data.countries[vw === 'ukraine' ? 'UKR' : 'USA'];
        g.globalCompositeOperation = 'lighter';
        draw(home, 'rgba(93,255,158,0.07)', 0, true);
        for (const a of home) glowPath(g, Array.from({ length: a.length / 2 }, (_, i) => [X(a[i * 2]), Y(a[i * 2 + 1])]), { width: 2 * S, alpha: 0.7 * reveal, glow: 0.6 });
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        // sweep: a scan bar crossing every 4 s (the tactical refresh)
        const sw = ((t * 0.25) % 1) * panel[2] + panel[0];
        const gr = g.createLinearGradient(sw - 220 * S, 0, sw, 0); gr.addColorStop(0, 'rgba(93,255,158,0)'); gr.addColorStop(0.85, 'rgba(93,255,158,0.045)'); gr.addColorStop(1, 'rgba(93,255,158,0)');
        g.fillStyle = gr; g.fillRect(sw - 220 * S, 0, 220 * S, Ht);
        // pins in this view
        for (const pn of pins.filter(q => (q.view ?? views[0]) === vw)) {
          if (t < pn.t0) continue; const k = range(t, pn.t0, pn.t0 + 0.4), x = X(pn.lon), y = Y(pn.lat), col = pn.red ? PAL.red : PAL.phosphor;
          const ring = ((t - pn.t0) % 1.6) / 1.6;
          g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = 2 * S;
          g.globalAlpha = (1 - ring) * 0.7; g.beginPath(); g.arc(x, y, (8 + 46 * ring) * S, 0, 7); g.stroke();
          g.globalAlpha = 1; const r = 9 * S; g.strokeRect(x - r, y - r, 2 * r, 2 * r); g.beginPath(); g.moveTo(x - 2.2 * r, y); g.lineTo(x - 1.3 * r, y); g.moveTo(x + 1.3 * r, y); g.lineTo(x + 2.2 * r, y); g.moveTo(x, y - 2.2 * r); g.lineTo(x, y - 1.3 * r); g.moveTo(x, y + 1.3 * r); g.lineTo(x, y + 2.2 * r); g.stroke();
          g.restore();
          const nm = String(pn.name).toUpperCase(), n = LW.typeCount(nm, t, pn.t0 + 0.1, 30, 2), dx = (pn.dx ?? 26) * S, dy = (pn.dy ?? -18) * S;
          glowText(g, LW.typed(nm, n), x + dx, y + dy, { font: `${40 * S}px ${FONT.term}`, color: pn.red ? PAL.red : PAL.fluoro, alpha: k });
          if (pn.sub) { const s2 = String(pn.sub).toUpperCase(); glowText(g, LW.typed(s2, LW.typeCount(s2, t, pn.t0 + 0.4, 36, 3)), x + dx, y + dy + 30 * S, { font: `${28 * S}px ${FONT.term}`, alpha: 0.65 * k }); }
        }
        // arcs (an origin to a target; drawn progressively, dashed head)
        for (const a of arcs.filter(q => (q.view ?? views[0]) === vw)) {
          const k = smoother(range(t, a.t0, a.t0 + 1.2)); if (k <= 0) continue;
          const [x0, y0] = [X(a.from[0]), Y(a.from[1])], [x1, y1] = [X(a.to[0]), Y(a.to[1])], mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.25;
          const pts = []; for (let i = 0; i <= 60 * k; i++) { const u = i / 60; pts.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1]); }
          glowPath(g, pts, { width: 2.4 * S, color: a.red === false ? PAL.phosphor : PAL.red, core: '#ffd8d4', glow: 0.8 });
        }
        if (views.length === 2) { g.strokeStyle = 'rgba(93,255,158,0.4)'; g.lineWidth = 2 * S; g.beginPath(); g.moveTo(panel[0] + panel[2] - 1, Ht * 0.08); g.lineTo(panel[0] + panel[2] - 1, Ht * 0.92); g.stroke(); }
        glowText(g, (P.labels?.[vi] ?? (vw === 'ukraine' ? 'UKRAINE' : 'UNITED STATES')), panel[0] + 40 * S, Ht * 0.1, { font: `600 ${54 * S}px ${FONT.display}`, alpha: 0.85 * reveal, spacing: 4 * S });
        g.restore();
      });
      if (P.title) glowText(g, String(P.title).toUpperCase(), W * 0.96, Ht * 0.1, { font: `${40 * S}px ${FONT.term}`, align: 'right', alpha: 0.7 });
      glowText(g, P.stamp ?? 'TAC-MAP  ·  LIVE', W * 0.96, Ht * 0.94, { font: `${30 * S}px ${FONT.term}`, align: 'right', alpha: 0.45 });
      return { t };
    }, { curve: 0.1, bloom: 0.9, scan: 0.2 });
  }

  H.crtSet = crtSet; H.wrap = wrap;
  return { scope, chapter, title, numbers, quote, 'map-ops': mapOps };
}
