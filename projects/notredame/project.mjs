// NOTRE-DAME WAS 30 MINUTES FROM COLLAPSE. Episode 10 of MAINSPRING, fully animated in "Paper & Spring"
// (docs/library/animation-study/STYLE-BIBLE.md). Narration is read straight from SCRIPT.md (105 numbered lines, file order,
// incl. 86a/105a/117b) and voiced once per line (projects/notredame-vo, per-line cache), so regrouping lines reuses audio.
// Facts: RESEARCH.md only. Per-line pictures + fact locks: VISUALS.md. Shot structure + sound: OUTLINE.md.
// Sets: sets/nd-sets.js + sets/nd-graphics.js (APIs in their headers). Runtime: scene.js. Cuts and their sounds: cuts.mjs.
// Shots live in shots/ch0.mjs .. ch6.mjs (one file per chapter, helpers in shots/lib.mjs; guide: SHOTS-GUIDE.md).
// Each chapter has its own preview project (projects/nd-ch<N>) that renders only that chapter.
import { scoreTransitions, transitionCues } from './cuts.mjs';
import { voice } from '../notredame-vo/project.mjs';
import { ORDER, LINES } from './shots/lib.mjs';
import ch0 from './shots/ch0.mjs';
import ch1 from './shots/ch1.mjs';
import ch2 from './shots/ch2.mjs';
import ch3 from './shots/ch3.mjs';
import ch4 from './shots/ch4.mjs';
import ch5 from './shots/ch5.mjs';
import ch6 from './shots/ch6.mjs';

// shot objects are copied so the mood strip below never mutates a chapter module another importer shares
export const CHAPTERS = [ch0, ch1, ch2, ch3, ch4, ch5, ch6];
export function assemble(chapters, { full = true } = {}) {
  const shots = chapters.flat().map(s => ({ ...s, params: { ...(s.params ?? {}) } }));
  for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;
  if (full) { // the whole film voices every SCRIPT line exactly once, in file order
    const said = shots.filter(s => s.vo).flatMap(s => s.vo.split('\n')), want = ORDER.map(k => LINES[k]);
    const i = want.findIndex((x, j) => said[j] !== x);
    if (i >= 0 || said.length !== want.length) throw new Error(`[notredame] narration differs from SCRIPT.md at line ${ORDER[i] ?? '(end)'}`);
  }
  const ids = new Set(); for (const s of shots) { if (ids.has(s.id)) throw new Error(`[notredame] duplicate shot id ${s.id}`); ids.add(s.id); }
  const music = [];
  for (const s of shots) { if (s.mood) music.push({ shot: s.id, ...s.mood }); delete s.mood; }
  return { shots, music };
}

export function projectOf(chapters, { title, full = true } = {}) {
  const { shots, music } = assemble(chapters, { full });
  return {
    title,
    fps: 60, width: 1920, height: 1080,
    // 2D canvas sets only: no GL work, so no AA pass; cutGuard keeps chunk cuts clear of the longest move (gear-mesh 1.2 s)
    settings: { fps: 60, aa: 'none', cutGuard: 1.5, crf: 20, browserArgs: ['--disable-gpu-compositing'] },
    finish: { grain: 3, halation: 0, bloom: 0, vignette: 0.08 },
    voice,
    timing: { padIn: 0.15, padOut: 0.35 },
    shots,
    score: { key: 'D', transitions: scoreTransitions(shots), music },
    cues: (timeline) => transitionCues(timeline),
  };
}

export default projectOf(CHAPTERS, { title: 'Notre-Dame Was 30 Minutes From Collapse' });
