// Chapter 4 shots: 4. THE SECOND CLOCK (lines 68–95; file order 93–94 before 88a). PLACEHOLDER STUB (production lead): one simple shot per script line so the whole
// episode renders. The chapter writer replaces this file (keep the export names and the check()). See ../SHOTS-GUIDE.md.
import { chapter, stub, M } from './lib.mjs';
const c = chapter(4);
const { S, CH, check } = c;
export const shots = check([
  CH('The Second Clock', 'the tower plan', { lit: 'deadline' }, M('urgency', 'D', [0.35, 0.5])),
  ...stub(c, [['cathedral', { view: 'side', fire: 0.8, roofGone: 0.6, spire: 'gone' }], ['bellFrame', { open: 1, char: 0.5 }], ['firefighters', { mode: 'stair' }], ['clock', { from: '21:30', to: '22:00' }], ['cathedral', { view: 'facade', fire: 0.6 }]]),
]);
export default shots;
