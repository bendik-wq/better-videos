// PREVIEW: chapter 3 of episode 10 only (shots from ../notredame/shots/ch3.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch3 --stills=0.3,0.7 [--only=s301,s302]   -> projects/nd-ch3/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch3.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 3 preview', full: false });
