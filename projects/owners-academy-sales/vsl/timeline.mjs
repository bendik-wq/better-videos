// Build the frame timeline for a split-layout cut: segments (clips and cards), right-panel beats,
// word-synced captions and chapters.
//   node vsl/timeline.mjs [cut=vsl-b2b] > vsl/timeline.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beats as vslBeats, cards, chapters } from './beats.mjs';
import { beats as faqBeats } from './faq-beats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// CUT_ROOT: another project's folder with its own clips.json, snapped.json and (optional) beats.mjs
const ROOT = process.env.CUT_ROOT || path.join(HERE, '..');
const own = path.resolve(ROOT) === path.resolve(HERE, '..');
const beats = own ? { ...vslBeats, ...faqBeats } : (await import(path.resolve(ROOT, 'beats.mjs'))).beats;
const cutName = process.argv[2] || 'vsl-b2b';
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'clips.json'), 'utf8'));
const snapped = JSON.parse(fs.readFileSync(path.join(ROOT, 'snapped.json'), 'utf8'));
const CARD = 2.6;

const cardHtml = (c) => `<div class="num" data-d="0.05">${c.eyebrow}</div><div class="ttl split" data-d="0.2">${c.title}</div><div class="rule"></div>` +
  (c.poster ? '<div class="poster" data-d="1.2"><div class="av">JL</div><div><b>Josh Li</b>Founder, JC Health Group</div></div>' : '') +
  (c.cta ? '<div data-d="1.1" style="display:flex;align-items:center;gap:30px;margin-top:10px"><span class="btn">See if you qualify →</span><span class="url">apply.grosfjeld-li.com</span></div>' : '');

// caption text clean-up: whisper spellings, fillers, split numbers
const FIX = { 'Lee.': 'Li.', 'Lee': 'Li', '6040': '60/40' };
const CLIP_FIX = { // per-clip mishearings
  'owner-a': { state: 'estate' },
  'faq-board-seat': { point: 'appoint' },
  'faq-board-equity-a': { "Kyle's": "Carl's" },
  'faq-training': { 'Debelle?': 'Deibel?', 'Peniel.': 'Peña.' },
};
const FILLER = /^(um|uh|uh,|um,)$/i;

const segments = [], allBeats = [], captions = [], chaps = [];
let t = 0;
const cut = spec.cuts[cutName];
const chapterNames = cut.chapters ?? chapters;
// cut.intro === false: start straight on the first clip (Reels hooks)
const seq = [...(cut.intro === false ? [] : [{ card: 'intro' }]), ...cut.sequence, { card: 'end' }];
for (const item of seq) {
  if (typeof item === 'object' && item.chapter) { // chapter marker with no card (keeps the talk flowing)
    chaps.push({ name: item.chapter, t0: t });
    continue;
  }
  if (typeof item === 'object') {
    const c = cut.cards?.[item.card] ?? cards[item.card];
    if (!c) throw new Error(`no card "${item.card}" in beats.mjs`);
    const dur = c.dur || CARD;
    segments.push({ kind: 'card', name: item.card, t0: t, t1: t + dur, html: cardHtml(c), fine: c.fine || '' });
    if (!cut.chapter && chapterNames[item.card]) chaps.push({ name: chapterNames[item.card], t0: t });
    t += dur;
    continue;
  }
  const s = snapped[item];
  if (!s?.words) throw new Error(`clip ${item} has no word timings; re-run snap.py for it`);
  const dur = +(s.out - s.in).toFixed(3);
  if (!chaps.length) chaps.push({ name: cut.chapter || chapterNames.start, t0: t });
  segments.push({ kind: 'clip', id: item, t0: t, t1: t + dur, in: s.in, out: s.out });
  for (const b of beats[item] || []) allBeats.push({ t0: t + b.at, html: b.html, clip: item });

  // captions: short single lines, broken on pauses and sentence ends
  let g = null;
  const flush = () => { if (g && g.words.length) captions.push(g); g = null; };
  s.words.forEach(([raw, a, b], i) => {
    let w = (CLIP_FIX[item]?.[raw] ?? FIX[raw] ?? raw).trim();
    if (!w || FILLER.test(w)) return;
    const join = /^[,.%]|^-\d|^-[a-z]/.test(w) || /^,\d/.test(w);
    const prev = i ? s.words[i - 1] : null;
    const gap = prev ? a - prev[2] : 0;
    const len = g ? g.words.reduce((n, x) => n + x[0].length + 1, 0) : 0;
    if (g && !join && (len + w.length > 44 || gap > 0.65 || (/[.?!]$/.test(g.words.at(-1)[0]) && len > 14))) flush();
    if (!g) g = { t0: t + a, words: [] };
    g.words.push([w, t + a, t + b, join ? 1 : 0]);
  });
  flush();
  t += dur;
}
// beats run until the next beat or the next card; captions until the next caption (max +0.6 s)
allBeats.sort((a, b) => a.t0 - b.t0);
allBeats.forEach((b, i) => {
  const nextBeat = allBeats[i + 1]?.t0 ?? Infinity;
  const nextCard = segments.find((s) => s.kind === 'card' && s.t0 > b.t0)?.t0 ?? t;
  b.t1 = Math.min(nextBeat, nextCard);
});
captions.forEach((c, i) => {
  const last = c.words.at(-1)[2] + 0.6;
  const seg = segments.find((s) => c.t0 >= s.t0 && c.t0 < s.t1);
  c.t1 = Math.min(captions[i + 1]?.t0 ?? Infinity, last, seg.t1);
});

// cut.chapterMarks: [[source seconds, name], ...] put chapters inside one long clip (no cards, no cuts)
for (const [src, name] of cut.chapterMarks || []) {
  const seg = segments.find((x) => x.kind === 'clip' && !x.id.startsWith('tz-') && src >= x.in && src < x.out);
  if (seg) chaps.push({ name, t0: seg.t0 + (src - seg.in) });
}
chaps.sort((a, b) => a.t0 - b.t0);
// cut.fps: e.g. 23.976 so camera footage keeps its own frame rate (no duplicated frames)
const fps = cut.fps === 23.976 ? 24000 / 1001 : cut.fps || 25;
const out = { fps, duration: +t.toFixed(3), segments, beats: allBeats, captions, chapters: chaps };
process.stdout.write(JSON.stringify(out));
process.stderr.write(`${cutName}: ${Math.floor(t / 60)}m${String(Math.round(t % 60)).padStart(2, '0')}s, ${segments.length} segments, ${allBeats.length} beats, ${captions.length} caption lines\n`);
