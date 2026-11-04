// Overlay the scribble style test on a video.  node scribble.mjs <in.mp4> <out.mp4> [--stills t1,t2 outdir]
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const HERE = path.dirname(fileURLToPath(import.meta.url)), [inp, out] = process.argv.slice(2);
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find((x) => fs.existsSync(x) && fs.statSync(x).isFile());
const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + path.join(HERE, 'scribble.html')); await p.evaluate(() => window.ready);
const si = process.argv.indexOf('--stills');
if (si > 0) {
  const dir = process.argv[si + 2]; fs.mkdirSync(dir, { recursive: true });
  for (const t of process.argv[si + 1].split(',').map(Number)) { await p.evaluate((t) => window.render(t), t); await p.screenshot({ path: `${dir}/s${t}.png`, omitBackground: true }); }
  await b.close(); process.exit(0);
}
const FPS = 24000 / 1001, N = Math.round(31.5 * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-f', 'image2pipe', '-framerate', '24000/1001', '-c:v', 'png', '-i', '-',
  '-filter_complex', '[0:v][1:v]overlay=0:0:shortest=1[v]', '-map', '[v]', '-map', '0:a', '-t', String(N / FPS),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let i = 0; i < N; i++) {
  await p.evaluate((t) => window.render(t), i / FPS);
  const buf = await p.screenshot({ type: 'png', omitBackground: true });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('->', out);
