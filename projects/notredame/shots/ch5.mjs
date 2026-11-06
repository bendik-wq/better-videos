// Chapter 5 shots: 5. WHAT HELD (file order 97–100, 107, 109, 110, 102–105a, 111, 112). PLACEHOLDER STUB (production lead): one simple shot per script line so the whole
// episode renders. The chapter writer replaces this file (keep the export names and the check()). See ../SHOTS-GUIDE.md.
import { chapter, stub, M } from './lib.mjs';
const c = chapter(5);
const { S, CH, check } = c;
export const shots = check([
  CH('What Held', 'the survey', { lit: 'none' }, M('wonder', 'F', [0.3, 0.45])),
  ...stub(c, [['cathedral', { view: 'fold', fire: 0, roofGone: 1, spire: 'gone' }], ['forest', { fire: 0, char: 1, collapse: 1, vault: true }], ['bellFrame', { open: 1, char: 0.6 }], ['cathedral', { view: 'facade', fire: 0, spire: 'gone' }]]),
]);
export default shots;
