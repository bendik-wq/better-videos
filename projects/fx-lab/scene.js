// FX LAB runtime: archive plates (2D Ken Burns, graded) composited through engine/transitions.js, with
// engine/motion.js presets on the overlay. Both the outgoing and the incoming shot are drawn live during a
// transition (plates are cheap), so nothing freezes. Every frame is a pure function of (shot, t).
import * as TR from '/engine/transitions.js';
import * as M from '/engine/motion.js';

const ARCH = (n) => `/projects/${['huey-1966', 'monk-1947'].includes(n) ? 'fx-test' : 'palantir'}/assets/archive/${n}.jpg`;
const LOOKS = ['grayscale(1) contrast(1.12) brightness(0.86)', 'sepia(0.45) saturate(0.8) contrast(1.06) brightness(0.84)', 'saturate(0.82) contrast(1.05) brightness(0.86)', 'grayscale(0.6) sepia(0.25) contrast(1.1) brightness(0.8)'];

export default async function create(ctx) {
  const { width: W, height: H, shots, overlay, renderer } = ctx;
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.x = c.getContext('2d', { willReadFrequently: true }); return c; };
  const gl = renderer.domElement; gl.style.visibility = 'hidden';
  const comp = mk(); comp.style.cssText = `position:absolute;inset:0;width:${W}px;height:${H}px`; gl.after(comp);
  const cx = comp.x;
  const fx = TR.create({ width: W, height: H });
  const plateA = mk(), plateB = mk();

  // ---------------- photos, graded once at 1.15x frame size
  const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
  const graded = new Map();
  const names = [...new Set(shots.map((s) => s.params?.photo).filter(Boolean))];
  const imgs = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await load(ARCH(n))])));
  function plateImg(name, look, dim) {
    const key = `${name}|${look}|${dim}`; if (graded.has(key)) return graded.get(key);
    const i = imgs[name], c = mk(Math.round(W * 1.15), Math.round(H * 1.15)), s = Math.max(c.width / i.width, c.height / i.height);
    c.x.filter = LOOKS[look % LOOKS.length] + (dim ? ` brightness(${dim}) blur(${(dim < 0.5 ? 3 : 1) * W / 1920}px)` : '');
    c.x.drawImage(i, (c.width - i.width * s) / 2, (c.height - i.height * s) / 2, i.width * s, i.height * s); c.x.filter = 'none';
    graded.set(key, c); return c;
  }
  const vignette = mk(); { const g = vignette.x.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); vignette.x.fillStyle = g; vignette.x.fillRect(0, 0, W, H); }

  // A plate at shot time t: slow eased push with a drift, motivated by nothing more than looking closer.
  function drawPlate(c, shot, t) {
    const P = shot.params || {}, x = c.x, D = shot.duration;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    if (P.noPlate || !P.photo) { x.fillStyle = '#060606'; x.fillRect(0, 0, W, H); }
    else {
      const img = plateImg(P.photo, P.look ?? 2, shot.set === 'motion' ? (P.dim ?? (/barRace|lineDraw|pieWaffle|bigNumber|timeline/.test(P.motion) ? 0.18 : 0.3)) : 0);
      const u = M.E.inOutSine(M.clamp(t / (D + 1.5))), r = M.rng(M.hash(shot.id))(), dirx = r < 0.5 ? -1 : 1;
      const s = 1 / 1.15 * (1.0 + 0.07 * u), w = img.width * s, h = img.height * s;
      x.drawImage(img, (W - w) / 2 + dirx * 26 * (u - 0.5) * W / 1920, (H - h) / 2 - 10 * (u - 0.5) * H / 1080, w, h);
    }
    x.drawImage(vignette, 0, 0);
    if (shot.set === 'motion' && P.motion === 'route') drawMap(x);
  }
  // map backdrop for the route preset: graticule and seeded landmasses, drawn into the plate
  let mapCache = null;
  function drawMap(x) {
    if (!mapCache) { mapCache = mk(); const m = mapCache.x, r = M.rng(11), k = W / 1920; m.fillStyle = '#0a0b0c'; m.fillRect(0, 0, W, H);
      m.strokeStyle = 'rgba(217,210,195,0.07)'; m.lineWidth = 1; for (let gx = 0; gx <= 1920; gx += 120) { m.beginPath(); m.moveTo(gx * k, 0); m.lineTo(gx * k, H); m.stroke(); } for (let gy = 0; gy <= 1080; gy += 120) { m.beginPath(); m.moveTo(0, gy * k); m.lineTo(W, gy * k); m.stroke(); }
      for (let b = 0; b < 6; b++) { const cx0 = r() * 1920, cy0 = r() * 1080, R = 160 + r() * 260; m.beginPath();
        for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, rr = R * (1 + 0.25 * Math.sin(a * 3 + b) + 0.12 * Math.sin(a * 7 + b * 2) + 0.05 * Math.sin(a * 17)); const px = (cx0 + Math.cos(a) * rr * 1.3) * k, py = (cy0 + Math.sin(a) * rr * 0.8) * k; i ? m.lineTo(px, py) : m.moveTo(px, py); }
        m.closePath(); m.fillStyle = '#171614'; m.fill(); m.strokeStyle = 'rgba(217,210,195,0.18)'; m.lineWidth = 1.2 * k; m.stroke(); } }
    x.drawImage(mapCache, 0, 0); x.drawImage(vignette, 0, 0);
  }

  // ---------------- overlays
  const live = new Map();
  const ORD = shots.filter((s) => s.set === 'motion');
  function build(shot, index) {
    const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;overflow:hidden'; overlay.appendChild(layer);
    const st = M.stage(layer), P = shot.params || {};
    if (shot.set === 'plate') {
      M.card.caption(st, { meta: `TRANSITION ${String(P.index).padStart(2, '0')} / ${P.of} · ${P.tdur.toFixed(2)} S`, line: P.label, corner: 'bl', at: P.tdur + 0.05, out: shot.duration - 0.45 });
    } else {
      const k = ORD.indexOf(shot) + 1;
      M.card.caption(st, { meta: `MOTION ${String(k).padStart(2, '0')} / ${ORD.length}`, line: LABEL[P.motion] ?? P.motion, corner: CORNER[P.motion] ?? 'br', at: (P.tdur ?? 0.4) + 0.1, out: shot.duration - 0.45 });
      MOTION[P.motion]?.(st, shot);
    }
    return { layer, st, index };
  }
  const get = (shot, index) => {
    if (!live.has(shot.id)) live.set(shot.id, build(shot, index));
    for (const [id, v] of live) if (v.index < index - 1 || v.index > index + 1) { v.layer.remove(); live.delete(id); }
    return live.get(shot.id);
  };

  return {
    frame({ shot, t, index }) {
      const P = shot.params || {}, prev = index > 0 ? shots[index - 1] : null;
      const cur = get(shot, index), td = P.trans === 'cut' ? 0 : (P.tdur ?? 0);
      const inTr = !!(prev && td > 0 && t < td);
      const old = inTr ? get(prev, index - 1) : null;
      for (const v of live.values()) v.layer.style.display = v === cur || v === old ? 'block' : 'none';
      drawPlate(plateB, shot, t); cur.st.update(t);
      if (inTr) {
        drawPlate(plateA, prev, prev.duration + t); old.st.update(prev.duration + t);
        const e = t / td; fx.render(cx, P.trans, plateA, plateB, e, P.topts || {});
        const mix = TR.layerMix(P.trans, e); old.layer.style.opacity = mix.out; cur.layer.style.opacity = mix.in;
      } else { cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'copy'; cx.drawImage(plateB, 0, 0); cx.globalCompositeOperation = 'source-over'; cur.layer.style.opacity = 1; }
    },
  };
}

// ---------------------------------------------------------------- motion presets on display
const LABEL = { splitWords: 'text.splitWords', perChar: 'text.perChar', maskUp: 'text.maskUp', typeScramble: 'text.scramble + typewriter', counter: 'text.counter + slam',
  docMarks: 'text.redact + highlight + strike', callouts: 'callout.doc + arrow + bracket', route: 'callout.route', quote: 'card.quote', chapterNumeral: "card.chapter 'numeral'",
  chapterRule: "card.chapter 'rule'", chapterIndex: "card.chapter 'index'", chapterSplit: "card.chapter 'split'", timeline: 'card.timeline', barRace: 'data.barRace',
  lineDraw: 'data.line', pieWaffle: 'data.pie + waffle', bigNumber: 'data.bigNumber' };
const CORNER = { chapterNumeral: 'tr', chapterSplit: 'br', chapterRule: 'br', chapterIndex: 'br', quote: 'tr', docMarks: 'tr', callouts: 'tl', route: 'tl', barRace: 'tr', bigNumber: 'tr', lineDraw: 'tl', pieWaffle: 'tr' };
const CHAPTERS = ['The Seeing Stone', 'The War Machine', 'The Watchers', 'The Price', 'The Other Side'];
const MOTION = {
  splitWords(st, shot) { const text = 'Every frame is a pure function of time.';
    M.text.splitWords(st, { text, times: M.wordTimes(shot, text), x: 150, y: 400, size: 112, width: 1650, rise: 0.4 }); },
  perChar(st) { M.text.perChar(st, { text: 'Palantir', from: 'scale', at: 0.5, stagger: 0.05, x: 150, y: 330, size: 230 });
    M.text.perChar(st, { text: 'PALANTIR TECHNOLOGIES · FOUNDED 2003', from: 'track', at: 1.3, stagger: 0.018, x: 160, y: 640, size: 20, style: M.F.MONO }); },
  maskUp(st) { M.text.maskUp(st, { lines: ['The most dangerous', 'company in the world'], at: 0.5, x: 150, y: 330, size: 132 });
    M.text.maskUp(st, { lines: ['EPISODE 02 · PALANTIR'], at: 1.4, x: 156, y: 660, size: 18, style: M.F.MONO }); },
  typeScramble(st) { M.text.scramble(st, { text: 'CLASSIFIED // NOFORN', at: 0.5, dur: 1.5, x: 150, y: 300, size: 66, style: M.F.MONO.replace('letter-spacing:.2em', 'letter-spacing:.12em') });
    M.text.typewriter(st, { text: '> QUERY SUBJECT 88213', at: 1.6, cps: 20, x: 154, y: 470, size: 24 });
    M.text.typewriter(st, { text: 'ACCT #88214 CREATED 03:12 · FLAGGED', at: 2.7, cps: 26, x: 154, y: 520, size: 24, style: M.F.MONO_DIM }); },
  counter(st) { M.text.counter(st, { from: 0, to: 2400000000, prefix: '$', at: 0.5, dur: 1.9, x: 150, y: 290, size: 170 });
    const l = st.div(`left:156px;top:490px;${M.F.MONO};font-size:16px`, 'SHARES OUTSTANDING · ILLUSTRATIVE'); st.add({ update: (t) => (l.style.opacity = M.seg(t, 0.9, 0.5)) });
    M.text.slam(st, { text: '$209', at: 2.6, x: 1240, y: 600, size: 250, source: 'CLOSE · ILLUSTRATIVE FIGURE' }); },
  docMarks(st) { M.text.redact(st, { lines: ['MEMORANDUM FOR THE RECORD', 'SUBJECT: PROJECT TRON', 'SOURCE: REDACTED REDACTED', 'DISTRIBUTION: LIMITED TO NAMED STAFF'], mode: 'cover', words: [3, 6, 7, 11, 12, 13, 14], at: 0.5, stagger: 0.14, x: 150, y: 200, size: 24 });
    M.text.highlight(st, { text: 'to scare our enemies', at: 2.0, x: 150, y: 520, size: 84 });
    M.text.strike(st, { text: 'and keep the West safe', at: 3.1, x: 150, y: 680, size: 70, style: M.F.ITALIC }); },
  callouts(st) { M.callout.doc(st, { x: 1060, y: 520, rx: 210, ry: 120, label: 'FIG. 1 · THE BUILDING', sub: 'ILLUSTRATIVE ANNOTATION', at: 0.6, lx: 1450, ly: 300 });
    M.callout.arrow(st, { from: [330, 880], to: [820, 640], bend: 90, at: 1.8, color: M.C.PAPER });
    M.callout.bracket(st, { x: 1640, y0: 600, y1: 900, label: 'One campus', sub: 'ILLUSTRATIVE', at: 2.6 }); },
  route(st) { M.callout.route(st, { points: [[230, 760], [480, 640], [760, 690], [1010, 540], [1290, 500], [1560, 330]], at: 0.6, dur: 2.6, label: 'DEPARTURE · 03:12', endLabel: 'Arrival' }); },
  quote(st, shot) { const text = 'The software found the patterns. Humans made the call.';
    M.card.quote(st, { text, times: M.wordTimes(shot, text), by: 'ILLUSTRATIVE QUOTE · FX LAB', at: 0.3, variant: 'left' }); },
  chapterNumeral(st) { M.card.chapter(st, { num: 2, title: 'The War Machine', variant: 'numeral', at: 0.15 }); },
  chapterRule(st) { M.card.chapter(st, { num: 3, title: 'The Watchers', variant: 'rule', at: 0.15 }); },
  chapterIndex(st) { M.card.chapter(st, { num: 4, title: 'The Price', variant: 'index', chapters: CHAPTERS, at: 0.15 }); },
  chapterSplit(st) { M.card.chapter(st, { num: 5, title: 'The Other Side', variant: 'split', at: 0.15 }); },
  timeline(st) { M.card.timeline(st, { from: 1998, to: 2026, every: 4, at: 0.5, events: [{ year: 2003, label: 'FOUNDED', at: 1.5 }, { year: 2016, label: 'SUES THE ARMY', at: 2.6 }, { year: 2020, label: 'GOES PUBLIC', at: 3.6 }] }); },
  barRace(st) { M.data.barRace(st, { keys: [2018, 2019, 2020, 2021, 2022, 2023, 2024], at: 0.5, dur: 4.8, highlight: 'AGENCY C', x: 420, y: 230,
    series: { 'AGENCY A': [90, 95, 100, 104, 110, 112, 115], 'AGENCY B': [70, 80, 96, 99, 101, 98, 97], 'AGENCY C': [20, 34, 52, 80, 108, 131, 160], 'AGENCY D': [60, 62, 61, 65, 70, 72, 74], 'AGENCY E': [40, 44, 49, 60, 58, 66, 80], 'AGENCY F': [50, 51, 47, 45, 44, 42, 41], 'AGENCY G': [10, 18, 30, 39, 52, 63, 70] } }); },
  lineDraw(st) { const r = M.rng(5); let v = 10; const D = []; for (let i = 0; i <= 40; i++) { v *= 1 + (r() - 0.42) * 0.12 + (i > 30 ? 0.04 : 0); D.push([2020 + i / 8, v]); }
    M.data.line(st, { data: D, box: [200, 260, 1380, 560], at: 0.5, dur: 3.0, label: 'ILLUSTRATIVE INDEX · USD', format: (x) => '$' + x.toFixed(1), xLabels: [[2020, '2020'], [2022, '2022'], [2024, '2024'], [2025, '2025']] }); },
  pieWaffle(st) { M.data.pie(st, { values: [46, 24, 18, 12], labels: ['GOVERNMENT', 'COMMERCIAL US', 'COMMERCIAL INTL', 'OTHER'], cx: 560, cy: 560, r: 240, at: 0.5, dur: 1.6 });
    M.data.waffle(st, { total: 100, value: 23, cols: 10, x: 1160, y: 330, cell: 34, gap: 7, at: 1.3, dur: 1.8, label: '23 IN 100 · ILLUSTRATIVE' }); },
  bigNumber(st) { M.data.bigNumber(st, { value: 40, suffix: '×', label: 'THE GAP · ILLUSTRATIVE', ratio: 40, unitLabel: 'THE NEXT COMPETITOR', source: 'SOURCE: ILLUSTRATIVE FIGURES FOR THE FX LAB', at: 0.5, x: 150, y: 520 }); },
};
