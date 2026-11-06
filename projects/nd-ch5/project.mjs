// PREVIEW: chapter 5 of episode 10 only (shots from ../notredame/shots/ch5.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch5 --stills=0.3,0.7 [--only=s501,s502]   -> projects/nd-ch5/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch5.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 5 preview', full: false });
