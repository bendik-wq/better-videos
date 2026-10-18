// Grade the lab stills with the bright-model LUT + finish -> renders/mortgage/<shot>-<pct>.jpg, a contact sheet, and the
// STYLE.md §2.2 numbers (mean L, p5, % < 0.06, % > 0.85, mean S) per still.
//   node projects/mortgage/lab/stills.mjs [pct=50]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gradeStill } from '../../../engine/grade/finish.mjs';
import project from './project.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const ST = path.join(HERE, 'out/stills'), OUT = path.join(ROOT, 'renders/mortgage');
fs.mkdirSync(OUT, { recursive: true });
const pcts = (process.argv[2] ?? '50').split(',');
const done = [];
for (const s of project.shots) for (const pc of pcts) {
  const src = path.join(ST, `${s.id}-${pc}.jpg`); if (!fs.existsSync(src)) continue;
  const out = path.join(OUT, `${s.id}${pcts.length > 1 ? '-' + pc : ''}.jpg`);
  gradeStill(src, out, project.settings.look, { seed: 7, finish: project.finish });
  // measure (sRGB luma) on a 480x270 copy
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', out, '-vf', 'scale=480:270', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
  const L = [], S = []; for (let i = 0; i < raw.length; i += 3) { const r = raw[i] / 255, g = raw[i + 1] / 255, b = raw[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); L.push(0.2126 * r + 0.7152 * g + 0.0722 * b); S.push(mx ? (mx - mn) / mx : 0); }
  const sorted = [...L].sort((a, b) => a - b), n = L.length, mean = L.reduce((a, b) => a + b, 0) / n;
  const m = { L: mean.toFixed(2), p5: sorted[Math.floor(n * 0.05)].toFixed(2), black: (100 * L.filter(x => x < 0.06).length / n).toFixed(1) + '%', white: (100 * L.filter(x => x > 0.85).length / n).toFixed(1) + '%', S: (S.reduce((a, b) => a + b, 0) / n).toFixed(2) };
  console.log(path.basename(out).padEnd(34), JSON.stringify(m));
  done.push(out);
}
if (done.length > 1) {
  const cols = 3, w = 640, h = 360, sheets = [];
  for (let p = 0; p * 12 < done.length; p++) {
    const page = done.slice(p * 12, p * 12 + 12), inputs = page.flatMap(f => ['-i', f]);
    const layout = page.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|');
    const name = path.join(OUT, `contact${p ? '-' + (p + 1) : ''}.jpg`);
    const fc = page.length === 1 ? `[0:v]scale=${w}:${h}[o]` : `${page.map((_, i) => `[${i}:v]scale=${w}:${h}[v${i}]`).join(';')};${page.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${page.length}:layout=${layout}:fill=white[o]`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc, '-map', '[o]', '-q:v', '3', name]);
    sheets.push(name);
  }
  console.log(`[mortgage] ${done.length} graded stills + ${sheets.map(s => path.relative(ROOT, s)).join(', ')}`);
}
