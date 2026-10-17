// Copy the lab stills to renders/panama/graphics/ (1920x1080 jpg) and build contact sheets.
//   node engine/render.mjs projects/panama-gfx-lab --stills=0.25,0.6,0.95 && node projects/panama-gfx-lab/lab.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const ST = path.join(HERE, 'out/stills'), OUT = path.join(ROOT, 'renders/panama/graphics');
fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(ST).filter(f => f.endsWith('.jpg')).sort();
for (const f of files) fs.copyFileSync(path.join(ST, f), path.join(OUT, f));
// contact sheets: 4 columns, 480x270 tiles, up to 24 tiles per sheet; tiles labelled by file name
const pick = files.filter(f => process.argv.includes('--all') || /-60\.jpg$/.test(f));
for (let s = 0; s * 24 < pick.length; s++) {
  const part = pick.slice(s * 24, s * 24 + 24), n = part.length, cols = 4;
  const inputs = part.flatMap(f => ['-i', path.join(ST, f)]);
  const fl = part.map((f, i) => `[${i}:v]scale=480:270,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${f.replace(/\.jpg$/, '')}':x=6:y=6:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.55[v${i}]`).join(';');
  const layout = part.map((_, i) => `${(i % cols) * 480}_${Math.floor(i / cols) * 270}`).join('|');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${fl};${part.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=white[o]`, '-map', '[o]', '-q:v', '3', path.join(OUT, `contact-${s + 1}.jpg`)]);
}
console.log(`[panama-gfx-lab] ${files.length} stills, ${Math.ceil(pick.length / 24)} contact sheet(s) in ${path.relative(ROOT, OUT)}`);
