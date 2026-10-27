// Render the motion-graphics layer (everything except Josh's face and the audio).
//   node vsl/render.mjs timeline.json out/graphics.mp4             # full cut, 25 fps
//   node vsl/render.mjs timeline.json out/stills --stills 5,40,95  # PNG stills at those seconds
//   node vsl/render.mjs timeline.json out/part.mp4 --from 60 --to 90
//   node vsl/render.mjs timeline.json out/chunks --chunks 3000      # resumable, 2-min chunks
//   node vsl/render.mjs --overlay out/                             # face-panel frame + mask PNGs
//   --bg-speed 0 freezes the silk background (much smaller files for the same face quality)
//   --scale 2 renders at 2x pixels (4K); add --vertical for the 1080x1920 Reels layout (stage-v.css); --overlay out/ --size 900x1060 --radius 26 for its panel
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const exe = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium']
  .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'],
});
const V = args.includes('--vertical');
// --scale 2: same layout rendered at 2x pixels (3840x2160 for the long-form 4K masters; also applies to --overlay)
const SCALE = Number(opt('--scale') || 1);
const page = await browser.newPage({ viewport: V ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });

if (args[0] === '--overlay') {
  // Static layers for the face panel: a rounded mask, and the frame with Josh's name card on top.
  const out = args[1];
  fs.mkdirSync(out, { recursive: true });
  await page.goto('file://' + path.join(HERE, 'stage.html'));
  await page.evaluate(() => document.fonts.ready);
  const [OW, OH] = (opt('--size') || '576x824').split('x').map(Number);
  const RAD = Number(opt('--radius') || 18);
  await page.setViewportSize({ width: OW, height: OH });
  const base = `html,body{width:${OW}px;height:${OH}px;background:transparent!important;overflow:hidden}body>*{display:none!important}#ov{display:block!important;position:fixed;inset:0}`;
  await page.addStyleTag({ content: base });
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'ov'; document.body.appendChild(d); });
  await page.evaluate((r) => {
    document.getElementById('ov').innerHTML = `<div style="position:absolute;inset:0;border-radius:${r}px;background:#fff"></div>`;
  }, RAD);
  await page.screenshot({ path: path.join(out, 'face-mask.png'), omitBackground: true });
  await page.evaluate((r) => {
    document.getElementById('ov').innerHTML = `
      <div style="position:absolute;inset:0;border-radius:${r}px;background:radial-gradient(120% 90% at 45% 42%,rgba(11,18,32,0) 55%,rgba(11,18,32,.38) 100%)"></div>
      <div style="position:absolute;inset:0;border-radius:${r}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:240px;border-radius:0 0 ${r}px ${r}px;background:linear-gradient(180deg,rgba(11,18,32,0),rgba(11,18,32,.86))"></div>
      <div style="position:absolute;left:30px;bottom:28px;display:flex;align-items:center;gap:16px;font-family:Inter">
        <div style="width:56px;height:56px;border-radius:50%;background:#e9edf5;color:#0d1526;display:grid;place-items:center;font:600 20px/1 Inter">JL</div>
        <div style="color:#8a93a6;font:400 20px/1.3 Inter"><div style="color:#f3f5f9;font:500 24px/1.3 Inter">Josh Li</div>Founder, JC Health Group</div></div>`;
  }, RAD);
  await page.screenshot({ path: path.join(out, 'face-frame.png'), omitBackground: true });
  await browser.close();
  process.exit(0);
}

const [tlPath, outPath] = args;
const TL = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
await page.goto('file://' + path.join(HERE, 'stage.html'));
if (V) {
  await page.addStyleTag({ path: path.join(HERE, 'stage-v.css') });
  await page.evaluate(() => window.resizeSilk && window.resizeSilk(540, 960));
  await page.evaluate(() => { window.cardFade = true; });
}
// --full: Josh fills the frame; the graphics render with a transparent background (PNG frames, alpha .mov)
const FULL = args.includes('--full');
if (FULL) await page.addStyleTag({ path: path.join(HERE, V ? 'stage-vfull.css' : 'stage-full.css') });
if (opt('--bg-speed')) await page.evaluate((v) => { window.silkSpeed = v; }, Number(opt('--bg-speed')));
await page.evaluate((tl) => window.loadTimeline(tl), TL);
await page.evaluate(() => document.fonts.ready);

if (opt('--stills')) {
  fs.mkdirSync(outPath, { recursive: true });
  for (const s of opt('--stills').split(',').map(Number)) {
    await page.evaluate((t) => window.render(t), s);
    await page.screenshot({ path: path.join(outPath, `t${String(s.toFixed(1)).padStart(6, '0')}.png`), omitBackground: FULL });
  }
  await browser.close();
  process.exit(0);
}

const fps = TL.fps;
const fpsArg = Math.abs(fps - 24000 / 1001) < 1e-4 ? '24000/1001' : String(fps); // camera-native 23.976

async function encode(from, n, file) {
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', fpsArg, '-c:v', FULL ? 'png' : 'mjpeg', '-i', '-',
  ...(FULL ? ['-c:v', 'qtrle', '-pix_fmt', 'argb', '-r', fpsArg, '-f', 'mov'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', fpsArg, '-f', 'mp4']), file],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.render(t), from + i / fps);
  const buf = FULL ? await page.screenshot({ type: 'png', omitBackground: true }) : await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 250 === 0) process.stderr.write(`frame ${i}/${n}  ${((i + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} fps\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
process.stderr.write(`done: ${n} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min -> ${file}\n`);
}

const total = Math.round(TL.duration * fps);
if (opt('--chunks')) {
  // Background jobs here are stopped after 2 h, so long renders go out in chunks that are renamed
  // into place only when complete; re-running skips finished chunks. Several workers can share a
  // directory (each claims a chunk); delete stale *.part files before re-running after a kill.
  const size = Number(opt('--chunks'));
  fs.mkdirSync(outPath, { recursive: true });
  for (let k = 0; k * size < total; k++) {
    const file = path.join(outPath, `chunk-${String(k).padStart(3, '0')}.mp4`);
    if (fs.existsSync(file)) continue;
    try { fs.writeFileSync(file + '.part', '', { flag: 'wx' }); } catch { continue; } // another worker has it
    const a = k * size, n = Math.min(size, total - a);
    await encode(a / fps, n, file + '.part');
    fs.renameSync(file + '.part', file);
  }
} else {
  const from = Number(opt('--from') ?? 0), to = Number(opt('--to') ?? TL.duration);
  await encode(from, Math.round((to - from) * fps), outPath);
}
await browser.close();
