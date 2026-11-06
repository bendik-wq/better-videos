// PREVIEW: chapter 6 of episode 10 only (shots from ../notredame/shots/ch6.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch6 --stills=0.3,0.7 [--only=s601,s602]   -> projects/nd-ch6/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch6.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 6 preview', full: false });
