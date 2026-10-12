// BLACKOUT LAB: look-dev for episode 4 (LIVE WIRE). Shot lists by LAB env var:
//   LAB=screens | rooms | outside | orbit | cold | reel (default reel)
//   LAB=screens node engine/render.mjs projects/blackout-lab --stills=0.5
import { scoreTransitions, transitionCues } from '../blackout/cuts.mjs';
const LAB = process.env.LAB ?? 'reel';
const S = (id, set, params = {}, extra = {}) => ({ id, set, params, min: 4, ...extra });
const LISTS = {
  screens: [
    S('scope-steady', 'scope', { mode: 'steady' }),
    S('scope-drop', 'scope', { mode: 'drop', at: 0.6, span: 2.5 }, { min: 5 }),
    S('scope-corner', 'scope', { mode: 'corner', at: 0.5, text: '230,000 PEOPLE. SIX HOURS IN THE DARK.' }),
    S('chapter', 'chapter', { num: 1, title: 'The Phantom Cursor', sub: 'IVANO-FRANKIVSK · 23 DEC 2015' }, { min: 5 }),
    S('title', 'title', { sub: 'EPISODE 4' }, { min: 6 }),
    S('numbers', 'numbers', { items: [{ value: 230000, sub: 'people lost power' }], source: 'SOURCE: TEST', scope: 'stutter' }),
    S('quote', 'quote', { text: '“The cursor started moving on its own, across the screen, toward the breakers.”', by: 'Operator account' }),
    S('map', 'map-ops', { view: 'ukraine', arcs: [{ from: [37.6, 55.75], to: [24.71, 48.92] }] }),
    S('map-both', 'map-ops', { view: 'both' }),
  ],
  grid: [
    S('cursor-click', 'cursor', { mode: 'click', move: 0.5, click: 3.6 }, { min: 6 }),
    S('cursor-drift', 'cursor', { mode: 'drift', zoom: 14 }),
    S('oneline-full', 'oneline', { mode: 'full', drawDur: 3, at: 5.5 }, { min: 9 }),
  ],
};
const shots = LISTS[LAB] ?? LISTS.screens;
export default {
  title: 'Blackout lab', fps: 60, width: 1920, height: 1080,
  settings: { fps: 60, aa: 'fxaa', cutGuard: 1.5, crf: 18 },
  voice: { engine: 'kokoro', name: 'af_heart' },
  timing: { padIn: 0.15, padOut: 0.4 },
  shots,
  score: { key: 'D', drone: 0.0, transitions: scoreTransitions(shots), cues: transitionCues(shots) },
};
