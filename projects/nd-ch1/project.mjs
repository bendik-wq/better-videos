// PREVIEW: chapter 1 of episode 10 only (shots from ../notredame/shots/ch1.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch1 --stills=0.3,0.7 [--only=s101,s102]   -> projects/nd-ch1/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch1.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 1 preview', full: false });
