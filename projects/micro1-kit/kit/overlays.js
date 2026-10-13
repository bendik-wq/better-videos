// LEDGER global overlays, drawn on the comp after the shot (and over transitions), in design units:
//   captions  word-by-word in the bottom band (portrait: 2-4 words, y 1500-1700; landscape: 2-5 words, y 880-1000),
//             current word on the yellow swipe
//   progress  a thin bar on the very top edge
//   source    params.source of the current shot, small mono line just above the captions
// Per-shot opt-out: params.captions === false hides captions for that shot; params.source = '' shows none.
import * as L from './ledger.js';

const clean = (w) => String(w).replace(/[*_]/g, '').replace(/^[“"(]+|[”",.;:)]+$/g, '').trim();

export function create(shots, opts = {}) {
  // portrait: 2-4 words, 92 px at y 1625; landscape: 2-5 words, 76 px at y 968 (band 880-1000)
  const { captions = true, progress = true, source = true, maxWords = L.pick(4, 5), maxChars = L.pick(18, 30), size = L.pick(92, 76), y = L.pick(1625, 968) } = opts;
  const CX = L.W / 2, CW = L.pick(940, 1600), SY = L.pick(1478, 860);
  // one global word list (beats repeat their parent's words: dedupe by absolute time)
  const seen = new Set(), words = [];
  for (const s of shots) for (const w of s.words ?? []) {
    const T = +(s.start + w.s).toFixed(2), key = `${T}|${w.w}`;
    if (seen.has(key) || T < s.start - 0.05) continue; seen.add(key);
    const c = clean(w.w); if (!c) continue;
    words.push({ w: c.toUpperCase(), raw: w.w, s: s.start + w.s, e: s.start + w.e, sid: s.id });
  }
  words.sort((a, b) => a.s - b.s);
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push({ words: cur, s: cur[0].s, e: cur.at(-1).e }); cur = []; };
  words.forEach((w, i) => {
    cur.push(w);
    const nx = words[i + 1], chars = cur.reduce((a, x) => a + x.w.length + 1, 0);
    const brk = !nx || cur.length >= maxWords || chars + (nx ? nx.w.length : 0) > maxChars || /[.,!?;:—]$/.test(w.raw) || nx.s - w.e > 0.38 || nx.sid !== w.sid && nx.s - w.e > 0.15;
    if (brk) flush();
  });
  chunks.forEach((c, i) => { const nx = chunks[i + 1]; c.end = nx ? Math.min(nx.s - 0.01, c.e + 0.7) : c.e + 0.8; });
  const total = shots.at(-1).start + shots.at(-1).duration;
  let ci = 0;
  const fitCache = new Map();

  function drawCaptions(g, T, shot) {
    if (shot.params?.captions === false) return;
    while (ci > 0 && chunks[ci].s > T) ci--;
    while (ci < chunks.length - 1 && chunks[ci + 1].s <= T) ci++;
    const c = chunks[ci]; if (!c || T < c.s - 0.03 || T > c.end) return;
    const txt = c.words.map((w) => w.w).join(' ');
    let fs = fitCache.get(txt); if (!fs) { fs = L.fit(g, txt, CW, size, L.pick(60, 48), 700, L.FONT.body); fitCache.set(txt, fs); }
    g.font = L.font(700, fs, L.FONT.body); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const sp = g.measureText(' ').width, ws = c.words.map((w) => g.measureText(w.w).width), wt = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    const pin = L.range(T, c.s - 0.03, c.s + 0.12), sc = L.lerp(0.9, 1, L.outBack(pin, 2.5));
    g.save(); g.translate(CX, y - fs * 0.35); g.scale(sc, sc); g.translate(-CX, -(y - fs * 0.35)); g.globalAlpha = L.clamp(pin * 3) * (1 - L.range(T, c.end - 0.12, c.end));
    let x = CX - wt / 2;
    c.words.forEach((w, i) => {
      const live = T >= w.s - 0.02 && (i === c.words.length - 1 ? T <= c.end : T < c.words[i + 1].s - 0.02);
      if (live) L.swipe(g, x - 12, y - fs * 0.84, ws[i] + 24, fs * 1.0, L.range(T, w.s - 0.03, w.s + 0.07), { seed: L.hash(w.w, i), tilt: 0 });
      // paper-coloured keyline keeps words readable if anything passes behind them
      g.lineWidth = 10; g.lineJoin = 'round'; g.strokeStyle = 'rgba(243,239,230,0.9)'; if (!live) g.strokeText(w.w, x, y);
      g.fillStyle = T >= w.s - 0.02 ? L.PAL.ink : 'rgba(18,18,18,0.55)'; g.fillText(w.w, x, y);
      x += ws[i] + sp;
    });
    g.restore();
  }
  function drawProgress(g, T) {
    const u = L.clamp(T / total);
    const bh = L.pick(12, 9);
    g.fillStyle = 'rgba(18,18,18,0.10)'; g.fillRect(0, 0, L.W, bh);
    g.fillStyle = L.PAL.green; g.fillRect(0, 0, L.W * u, bh);
    g.fillStyle = L.PAL.ink; g.fillRect(L.W * u - 6, 0, 6, bh);
  }
  function drawSource(g, shot, t) {
    const s = shot.params?.source; if (!s) return;
    const a = L.range(t, 0.15, 0.45); if (a <= 0) return;
    const txt = String(s).toUpperCase(), fs = L.fit(g, txt, CW, L.pick(46, 40), L.pick(40, 36), 600, L.FONT.body, 0.04);
    g.save(); g.globalAlpha = a; g.font = L.font(600, fs, L.FONT.body); g.letterSpacing = `${(0.04 * fs).toFixed(1)}px`; g.fillStyle = L.PAL.inkSoft; g.textAlign = 'center'; g.fillText(txt, CX, SY); g.restore();
  }
  return {
    chunks,
    draw(g, T, shot, t) {
      if (progress) drawProgress(g, T);
      if (source) drawSource(g, shot, t);
      if (captions) drawCaptions(g, T, shot);
    },
  };
}
