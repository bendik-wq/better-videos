// Grade the bright-lab stills with the bright-day LUT and the light "bright" finish from project.mjs, then
// write renders/bright-lab/<shot>.jpg and a contact sheet.
//   node engine/render.mjs projects/bright-lab --stills=0.5 && node projects/bright-lab/lab.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gradeStill } from '../../engine/grade/finish.mjs';
import project from './project.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const ST = path.join(HERE, 'out/stills'), OUT = path.join(ROOT, 'renders/bright-lab');
fs.mkdirSync(OUT, { recursive: true });
const done = [];
for (const s of project.shots) {
  const src = path.join(ST, `${s.id}-50.jpg`); if (!fs.existsSync(src)) { console.log('missing', src); continue; }
  const out = path.join(OUT, `${s.id}.jpg`);
  gradeStill(src, out, project.settings.look, { seed: 7, finish: project.finish });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-vf', 'scale=1280:-2', '-q:v', '4', out + '.tmp.jpg']); fs.renameSync(out + '.tmp.jpg', out);
  done.push(out);
}
const n = done.length, inputs = done.flatMap(f => ['-i', f]);
const cols = 2, rows = Math.ceil(n / cols), layout = done.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${done.map((_, i) => `[${i}:v]scale=640:360[v${i}]`).join(';')};${done.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=white[o]`, '-map', '[o]', '-q:v', '3', path.join(OUT, 'contact.jpg')]);
console.log(`[bright-lab] ${n} graded stills + contact sheet in ${path.relative(ROOT, OUT)}`);
