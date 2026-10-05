#!/usr/bin/env node
// Narration-first video renderer.
//
//   node engine/render.mjs projects/the-box [--draft] [--only=shotId] [--frames=a:b]
//
// 1. Synthesises each shot's voice-over with Piper (cached by text hash).
// 2. Derives shot timing from the narration (pad_in + VO + pad_out).
// 3. Renders every frame deterministically in headless Chromium (Three.js + DOM type).
// 4. Builds the score/sound-design bed, mixes it under the VO.
// 5. Applies the film finish (halation, grain, vignette) and muxes the master.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const projDir = path.resolve(args.find(a => !a.startsWith('--')) || 'projects/the-box');
const flag = (k) => { const a = args.find(a => a.startsWith(`--${k}`)); return a ? (a.split('=')[1] ?? true) : undefined; };
const DRAFT = !!flag('draft');
const ONLY = flag('only');

const project = JSON.parse(fs.readFileSync(path.join(projDir, 'project.json'), 'utf8'));
const fps = DRAFT ? 12 : project.fps;
const [W, H] = DRAFT ? [960, 540] : [project.width, project.height];
const out = path.join(projDir, 'out');
const cache = path.join(ROOT, '.cache');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(cache, 'vo'), { recursive: true });

const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'], ...opts }).toString();
const probeDur = (f) => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

// ---------- 1. voice-over ----------
const voice = path.join(cache, 'voices', `${project.voice.model}.onnx`);
for (const s of project.shots) {
  if (!s.vo) continue;
  const key = crypto.createHash('sha1').update(JSON.stringify([project.voice, s.vo])).digest('hex').slice(0, 12);
  s.voFile = path.join(cache, 'vo', `${s.id}-${key}.wav`);
  if (!fs.existsSync(s.voFile)) {
    console.log(`[vo] ${s.id}`);
    execFileSync('python3', ['-m', 'piper', '-m', voice, '-f', s.voFile,
      '--length-scale', String(project.voice.lengthScale ?? 1), '--sentence-silence', String(project.voice.sentenceSilence ?? 0.35)],
      { input: s.vo, stdio: ['pipe', 'ignore', 'inherit'] });
  }
  s.voDur = probeDur(s.voFile);
}

// ---------- 2. timeline ----------
let T = 0;
for (const s of project.shots) {
  s.start = T;
  s.duration = Math.max(s.min ?? 0, (s.padIn ?? 0.6) + (s.voDur ?? 0) + (s.padOut ?? 0.6));
  s.voAt = T + (s.padIn ?? 0.6);
  T += s.duration;
}
const total = T;
fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(project.shots.map(({ id, start, duration, voAt, voDur, vo }) => ({ id, start, duration, voAt, voDur, vo })), null, 2));
console.log(`[timeline] ${project.shots.length} shots, ${total.toFixed(2)}s @ ${fps}fps ${W}x${H}`);

// ---------- 3. frames ----------
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

let shotsToRender = project.shots;
if (ONLY) shotsToRender = project.shots.filter(s => ONLY.split(',').includes(s.id));
const rangeStart = Math.min(...shotsToRender.map(s => s.start));
const rangeEnd = Math.max(...shotsToRender.map(s => s.start + s.duration));
let f0 = Math.round(rangeStart * fps), f1 = Math.round(rangeEnd * fps);
const fr = flag('frames'); if (fr) [f0, f1] = fr.split(':').map(Number);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('[scene]')) console.log('[page]', m.text()); });
page.on('pageerror', e => { console.error('[page error]', e); process.exit(1); });
const rel = path.relative(ROOT, projDir);
await page.goto(`http://127.0.0.1:${port}/engine/stage.html?project=/${rel}`);
await page.evaluate(async (cfg) => window.__setup(cfg), { shots: project.shots.map(({ id, start, duration, voAt, voDur }) => ({ id, start, duration, voAt, voDur })), width: W, height: H, fps, draft: DRAFT });

// --stills[=0.3,0.8]: one PNG per shot at those fractions, for fast look-dev.
if (flag('stills')) {
  const fr = flag('stills') === true ? [0.35, 0.85] : String(flag('stills')).split(',').map(Number);
  fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
  for (const s of shotsToRender) for (const x of fr) {
    await page.evaluate((t) => window.__frame(t), s.start + s.duration * x);
    await page.screenshot({ path: path.join(out, 'stills', `${s.id}-${Math.round(x * 100)}.png`) });
    console.log(`[still] ${s.id} @ ${x}`);
  }
  await browser.close(); server.close(); process.exit(0);
}

const silent = path.join(out, DRAFT ? 'picture-draft.mp4' : 'picture.mp4');
const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'slow', '-crf', DRAFT ? '23' : '14', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  await page.evaluate((t) => window.__frame(t), f / fps);
  const buf = await page.screenshot({ type: 'png' });
  if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
  if ((f - f0) % fps === 0) {
    const done = f - f0 + 1, rate = done / ((Date.now() - t0) / 1000);
    process.stdout.write(`\r[render] ${done}/${f1 - f0} frames  ${rate.toFixed(1)} fps  eta ${((f1 - f - 1) / rate).toFixed(0)}s   `);
  }
}
enc.stdin.end();
await new Promise(r => enc.on('close', r));
await browser.close(); server.close();
console.log(`\n[render] done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

// ---------- 4. sound ----------
const audioFrom = f0 / fps, audioLen = (f1 - f0) / fps;
const bed = path.join(out, 'score.wav');
execFileSync('python3', [path.join(ROOT, 'engine', 'score.py'), path.join(out, 'timeline.json'), bed, JSON.stringify(project.score ?? {})], { stdio: 'inherit' });
const voInputs = [], voFilters = [];
project.shots.filter(s => s.voFile).forEach((s, i) => {
  voInputs.push('-i', s.voFile);
  const d = Math.max(0, Math.round((s.voAt - audioFrom) * 1000));
  voFilters.push(`[${i + 1}:a]aformat=channel_layouts=stereo,adelay=${d}|${d},volume=1.0[v${i}]`);
});
const n = voFilters.length;
const mix = path.join(out, 'mix.wav');
const vMix = n ? `${voFilters.join(';')};${Array.from({ length: n }, (_, i) => `[v${i}]`).join('')}amix=inputs=${n}:normalize=0,` +
  // radio-doc voice chain: rumble cut, presence, gentle compression, a touch of room
  `highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,aecho=0.8:0.5:40:0.08,asplit[vo][vosc];` : '';
const bedIn = `[0:a]atrim=start=${audioFrom}:duration=${audioLen},asetpts=PTS-STARTPTS[bed];`;
const graph = n
  // duck the score under the narration
  ? `${bedIn}${vMix}[bed][vosc]sidechaincompress=threshold=0.05:ratio=4:release=400[duck];[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[a]`
  : `${bedIn}[bed]loudnorm=I=-16:TP=-1.5[a]`;
sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', bed, ...voInputs, '-filter_complex', graph, '-map', '[a]', '-t', String(audioLen), mix]);

// ---------- 5. film finish + mux ----------
const finish = project.finish ?? {};
const master = path.join(out, DRAFT ? 'draft.mp4' : `${path.basename(projDir)}.mp4`);
const vf = [
  // halation: blurred highlights, tinted red-orange like Kodak's anti-halation-free stocks, screened back on
  `split[base][hl];[hl]curves=all='0/0 0.62/0 1/1',gblur=sigma=${(finish.halation ?? 18) * W / 1920},colorchannelmixer=rr=1:gg=0.45:bb=0.25[glow];[base][glow]blend=all_mode=screen:all_opacity=${finish.halationAmount ?? 0.55}`,
  // bloom: wide soft glow from everything bright
  `split[b2][bl];[bl]curves=all='0/0 0.5/0.05 1/1',gblur=sigma=${60 * W / 1920}[bloom];[b2][bloom]blend=all_mode=screen:all_opacity=${finish.bloom ?? 0.18}`,
  `vignette=angle=${finish.vignette ?? 0.55}`,
  `noise=c0s=${finish.grain ?? 9}:c0f=t+u:c1s=${(finish.grain ?? 9) / 2}:c1f=t+u:c2s=${(finish.grain ?? 9) / 2}:c2f=t+u`,
  'format=yuv420p',
].join(',');
sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', mix, '-filter_complex', `[0:v]${vf}[v]`, '-map', '[v]', '-map', '1:a',
  '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'slow', '-crf', DRAFT ? '23' : '16', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', master]);
console.log(`[master] ${master}`);
