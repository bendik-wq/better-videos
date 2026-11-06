// PREVIEW: chapter 0 of episode 10 only (shots from ../notredame/shots/ch0.mjs). Same voice, runtime and cut policy as
// projects/notredame; its own out/ dir, so chapter writers never collide. Stills:
//   node engine/render.mjs projects/nd-ch0 --stills=0.3,0.7 [--only=s001,s002]   -> projects/nd-ch0/out/stills/<id>-<pct>.jpg
import { projectOf } from '../notredame/project.mjs';
import ch from '../notredame/shots/ch0.mjs';
export default projectOf([ch], { title: 'Notre-Dame ep10 · chapter 0 preview', full: false });
