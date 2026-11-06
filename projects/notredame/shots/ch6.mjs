// Chapter 6 shots: 6. THE BELLS COME HOME (lines 113–125) + the end card. PLACEHOLDER STUB (production lead): one simple shot per script line so the whole
// episode renders. The chapter writer replaces this file (keep the export names and the check()). See ../SHOTS-GUIDE.md.
import { chapter, stub, M } from './lib.mjs';
const c = chapter(6);
const { S, CH, check } = c;
export const shots = check([
  CH('The Bells Come Home', '2019 → 2024', { lit: 'none' }, M('melancholy', 'A', [0.25, 0.4])),
  ...stub(c, [['bellFrame', { open: 1 }], ['cathedral', { view: 'facade', fire: 0, spire: 'standing' }], ['clock', { from: '18:18', to: '18:48', roll: 0 }], ['cathedral', { view: 'fold', fire: 0 }]]),
  { id: 'end', set: 'title', params: { end: true }, min: 7, mood: M('melancholy', 'A', [0.35, 0.5], { ending: 'resolve' }) },
]);
export default shots;
