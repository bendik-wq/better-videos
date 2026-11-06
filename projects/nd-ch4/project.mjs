// PREVIEW: chapter 4 of episode 10 only (shots from ../notredame/shots/ch4.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch4 --stills=0.3,0.7 [--only=s401,s402]   -> projects/nd-ch4/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch4.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 4 preview', full: false });
