// LOOK LAB: 6 test frames x 5 looks (engine/looks.js). Render stills, then grade + sheet with lab.mjs:
//   node engine/footage.js prep projects/look-lab
//   node engine/render.mjs projects/look-lab --stills=0.5
//   node projects/look-lab/lab.mjs            -> renders/look-lab/*.jpg
import { names } from '../../engine/looks.js';
const SETS = ['aerial', 'ship', 'city', 'map', 'title', 'chart'];
const only = process.env.LOOKS ? process.env.LOOKS.split(',') : names();
export default {
  title: 'Look lab: one frame set, every look',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30 },
  shots: only.flatMap(look => SETS.map(set => ({ id: `${set}-${look}`, set, min: 1.0, params: set === 'ship' ? { look, file: 'ships-lcs-formation', in: 20, out: 22, grade: 'none' } : { look } }))),
};
