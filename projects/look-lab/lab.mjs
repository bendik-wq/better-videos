// Grade the look-lab stills through engine/grade/finish.mjs (LUT + the finish render.mjs will run) and
// build comparison sheets in renders/look-lab/.
//   node projects/look-lab/lab.mjs [--looks a,b] [--raw]   (stills from: node engine/render.mjs projects/look-lab --stills=0.5)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gradeStill } from '../../engine/grade/finish.mjs';
import { names, get } from '../../engine/looks.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const ST = path.join(HERE, 'out/stills'), GR = path.join(HERE, 'out/graded'), OUT = path.join(ROOT, 'renders/look-lab');
fs.mkdirSync(GR, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : null; };
const LOOKS = (arg('looks') ?? names().join(',')).split(',');
const SETS = ['aerial', 'ship', 'city', 'map', 'title', 'chart'];
const t0 = Date.now();
for (const look of LOOKS) for (const set of SETS) {
  const src = path.join(ST, `${set}-${look}-50.jpg`); if (!fs.existsSync(src)) { console.log('missing', src); continue; }
  gradeStill(src, path.join(GR, `${set}-${look}.jpg`), look, { seed: 7 });
  // the same raw frame under the old default finish with no LUT (what render.mjs does today)
  if (look === 'bright-day') gradeStill(src, path.join(GR, `${set}-${look}-nolut.jpg`), null, { seed: 7, finish: { halation: 18, halationAmount: 0.55, bloom: 0.18, vignette: 0.55, grain: 9 } });
}
console.log(`[look-lab] graded ${LOOKS.length * SETS.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const labels = Object.fromEntries(LOOKS.map(l => [l, get(l).label]));
execFileSync('python3', [path.join(HERE, 'sheet.py'), GR, ST, OUT, JSON.stringify({ looks: LOOKS, sets: SETS, labels })], { stdio: 'inherit' });
