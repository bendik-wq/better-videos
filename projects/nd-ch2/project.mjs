// PREVIEW: chapter 2 of episode 10 only (shots from ../notredame/shots/ch2.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch2 --stills=0.3,0.7 [--only=s201,s202]   -> projects/nd-ch2/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch2.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 2 preview', full: false });
