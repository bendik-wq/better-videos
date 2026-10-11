// FX LAB: a test reel for the transition, motion-graphics and sound-design libraries.
//   Part 1: every transition in engine/transitions.js, between public-domain archive plates.
//   Part 2: every motion preset in engine/motion.js, driven by t and by narration word timings.
// Sound: engine/sfx.py cues, mixed by projects/fx-lab/mix.py onto the render (score.py has no sfx hook yet).
//   node engine/render.mjs projects/fx-lab --draft && python3 projects/fx-lab/mix.py projects/fx-lab
import fs from 'node:fs';

// transition names and default durations, read from engine/transitions.js (a browser module) without importing it
const src = fs.readFileSync(new URL('../../engine/transitions.js', import.meta.url), 'utf8');
const meta = Object.fromEntries([...src.matchAll(/^  '([a-z-]+)':\s*\{ dur: ([0-9.]+)/gm)].map((m) => [m[1], { dur: Number(m[2]) }]));
const TRANS = Object.keys(meta);

const PH = ['nsa-night-2013-paglen', 'waterhouse-magic-circle-1886', 'pentagon-aerial-1973', 'ibm704-langley-1957', 'cia-hq-aerial-1',
  'census-tabulator-1939', 'huey-1966', 'nsa-hq-fort-meade', 'ibm-edpm-1957', 'monk-1947', 'census-keypunch-operators-1940', 'pentagon-aerial-2003',
  'ibm704-ames-1958', 'cia-hq-aerial-2', 'census-card-puncher-1940'];
const T_OPTS = {
  'match-dissolve': { a: { x: 1010, y: 560, s: 260 }, b: { x: 960, y: 520, s: 520 } },
  'match-cut': { a: { x: 960, y: 520, s: 400 }, b: { x: 900, y: 600, s: 260 }, flash: true },
  'zoom-through': { at: [0.52, 0.48] }, iris: { at: [0.62, 0.42] }, 'iris-black': { at: [0.5, 0.45], atB: [0.4, 0.5] },
  'shape-circle': { at: [0.3, 0.6] }, 'shape-box': { rect: [0.58, 0.18, 0.28, 0.3] }, 'linear-wipe': { angle: 20 },
  whip: { dir: 1 }, slide: { dir: -1 }, 'parallax-slide': { dir: 1 }, 'pass-through': { dir: 1 },
};
let n = 0, k = 0;
const shots = [];
// ---------------------------------------------------------------- part 1: transitions
for (const name of TRANS.filter((x) => x !== 'cut')) {
  const i = n++;
  shots.push({ id: `t${String(i + 1).padStart(2, '0')}`, set: 'plate', min: Math.max(1.7, meta[name].dur + 0.9),
    params: { photo: PH[i % PH.length], trans: name, tdur: meta[name].dur, topts: T_OPTS[name] ?? {}, label: name, index: i + 1, of: TRANS.length - 1, look: i % 4 } });
}
// ---------------------------------------------------------------- part 2: motion presets
const M = (id, motion, extra = {}, params = {}) => shots.push({ id, set: 'motion', min: 3.4, ...extra, params: { motion, photo: PH[k++ % PH.length], trans: params.trans ?? 'dissolve', tdur: meta[params.trans ?? 'dissolve'].dur, ...params } });
M('m01', 'splitWords', { vo: 'Every frame is a pure function of time.', padIn: 0.4, padOut: 0.8 }, { trans: 'dip-black' });
M('m02', 'perChar');
M('m03', 'maskUp');
M('m04', 'typeScramble', { min: 4.0 });
M('m05', 'counter', { min: 3.8 }, { trans: 'flash' });
M('m06', 'docMarks', { min: 5.0 });
M('m07', 'callouts', { min: 4.6 }, { trans: 'focus-pull' });
M('m08', 'route', { min: 4.6 }, { trans: 'ink-bleed' });
M('m09', 'quote', { vo: 'The software found the patterns. Humans made the call.', padIn: 0.5, padOut: 1.0 }, { trans: 'lens-blur' });
M('m10', 'chapterNumeral', { min: 3.2 }, { trans: 'cut' });
M('m11', 'chapterRule', { min: 3.2 }, { trans: 'cut' });
M('m12', 'chapterIndex', { min: 3.2 }, { trans: 'cut' });
M('m13', 'chapterSplit', { min: 3.2 }, { trans: 'cut' });
M('m14', 'timeline', { min: 5.0 }, { trans: 'dip-black' });
M('m15', 'barRace', { min: 6.0 });
M('m16', 'lineDraw', { min: 4.4 });
M('m17', 'pieWaffle', { min: 4.4 });
M('m18', 'bigNumber', { min: 4.6 });

export default {
  title: 'FX lab: transitions, motion, sound',
  fps: 30,
  width: 1920,
  height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george', speed: 0.95 },
  timing: { padIn: 0.25, padOut: 0.4 },
  settings: { aa: 'none', cutGuard: 1.5, chunkSeconds: 6 },
  finish: { grain: 6, halation: 16, halationAmount: 0.42, bloom: 0.14, vignette: 0.5 },
  shots,
  score: { key: 'D', drone: 0.07, cues: [] },
};
