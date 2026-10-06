#!/usr/bin/env node
// Narration-first video renderer.
//
//   node engine/render.mjs projects/<name> [--draft] [--only=id,id] [--stills[=0.3,0.9]] [--workers=N] [--remux]
//
// 1. Synthesises each shot's VO (Kokoro / ElevenLabs / Piper) and aligns it word by word.
// 2. Derives shot timing from the narration; visuals and sound cues can key off words.
// 3. Renders every frame deterministically in headless Chromium (Three.js + DOM type),
//    optionally split across N parallel workers.
// 4. Builds the score/sound-design bed and mixes it under the VO.
// 5. Applies the film finish (halation, bloom, grain, vignette) and muxes the master.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const projDir = path.resolve(args.find(a => !a.startsWith('--')) || 'projects/the-box');
const flag = (k) => { const a = args.find(a => a === `--${k}` || a.startsWith(`--${k}=`)); return a ? (a.split('=')[1] ?? true) : undefined; };
const DRAFT = !!flag('draft');
const ONLY = flag('only');
const SEGMENT = flag('chunks'); // internal: "a:b;c:d|index" — the chunk list a worker renders

const mjs = path.join(projDir, 'project.mjs');
const project = fs.existsSync(mjs) ? (await import(pathToFileURL(mjs))).default : JSON.parse(fs.readFileSync(path.join(projDir, 'project.json'), 'utf8'));
const fps = DRAFT ? 12 : project.fps;
const [W, H] = DRAFT ? [960, 540] : [project.width, project.height];
const out = path.join(projDir, 'out');
fs.mkdirSync(out, { recursive: true });
const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28, ...opts }).toString();
const log = (...a) => console.log(...a);
const pageShot = (s) => ({ id: s.id, set: s.set, params: s.params, start: s.start, duration: s.duration, voAt: s.voAt, voDur: s.voDur, words: s.words, chapter: s.chapter });

// ---------- 1 + 2. voice-over and timeline (skipped by workers, who read the timeline) ----------
let shots;
const tlPath = path.join(out, 'timeline.json');
if (SEGMENT) {
  shots = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
} else {
  // pronunciation map: on-screen spelling stays, the voice gets the spoken form
  const say = project.voice.say ?? {};
  const speak = (t) => Object.entries(say).reduce((x, [k, v]) => x.replace(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), v), t);
  const v = project.voice.engine ? project.voice : { engine: 'piper', ...project.voice };
  const jobs = path.join(out, 'vo-jobs.json');
  fs.writeFileSync(jobs, JSON.stringify({ voice: v, root: ROOT, cache: path.join(ROOT, '.cache', 'vo'), shots: project.shots.filter(s => s.vo).map(s => ({ id: s.id, text: speak(s.vo), display: s.vo })) }));
  const vo = JSON.parse(sh('python3', [path.join(ROOT, 'engine', 'voice.py'), jobs]));
  const tm = { padIn: 0.25, padOut: 0.35, ...(project.timing ?? {}) };
  let T = 0;
  shots = project.shots.map((s0) => {
    const s = { ...s0 };
    const v = vo[s.id];
    s.start = T;
    s.voAt = T + (s.padIn ?? tm.padIn);
    s.voDur = v?.dur ?? 0;
    s.voFile = v?.wav;
    s.duration = Math.max(s.min ?? 0, (s.padIn ?? tm.padIn) + s.voDur + (s.padOut ?? tm.padOut));
    // words relative to shot start
    s.words = (v?.words ?? []).map(w => ({ w: w.w, s: +(w.s + s.voAt - T).toFixed(3), e: +(w.e + s.voAt - T).toFixed(3) }));
    T += s.duration;
    return s;
  });
  // beats: a shot's narration can cut to several visuals, each starting on a spoken word
  shots = shots.flatMap((s) => {
    if (!s.beats?.length) return [s];
    const norm = (w) => w.toLowerCase().replace(/[^a-z0-9$%.]/g, '').replace(/\.$/, '');
    const cuts = [0]; let from = 0;
    for (const [word] of s.beats) { const i = s.words.findIndex((w, j) => j >= from && norm(w.w).startsWith(norm(word)));
      if (i < 0) throw new Error(`beat word "${word}" not found in ${s.id}: ${s.vo}`); from = i + 1; cuts.push(s.words[i].s - 0.08); }
    const looks = [[s.set, s.params], ...s.beats.map(([, set, params]) => [set, params ?? {}])];
    return looks.map(([set, params], k) => {
      const a = cuts[k], b = k + 1 < cuts.length ? cuts[k + 1] : s.duration;
      return { ...s, id: k ? `${s.id}.${k}` : s.id, set, params, start: s.start + a, duration: b - a, beats: undefined,
        voFile: k ? undefined : s.voFile, words: s.words.map(w => ({ ...w, s: +(w.s - a).toFixed(3), e: +(w.e - a).toFixed(3) })) };
    });
  });
  // never show the same visual twice
  const seen = new Map();
  for (const s of shots) { if (['chapter'].includes(s.set)) continue; const key = s.set + JSON.stringify(s.params ?? {});
    if (seen.has(key)) throw new Error(`repeated visual: ${s.id} duplicates ${seen.get(key)} (${s.set})`); seen.set(key, s.id); }
  fs.writeFileSync(tlPath, JSON.stringify(shots, null, 1));
  const m = Math.floor(T / 60), sec = (T % 60).toFixed(1);
  log(`[timeline] ${shots.length} clips, ${m}m${sec}s @ ${fps}fps ${W}x${H}`);
  if (flag('vo-only')) process.exit(0);
}
const total = shots.at(-1).start + shots.at(-1).duration;

// ---------- 3. frames ----------
let shotsToRender = shots;
if (ONLY) shotsToRender = shots.filter(s => ONLY.split(',').includes(s.id));
let f0 = Math.round(Math.min(...shotsToRender.map(s => s.start)) * fps);
let f1 = Math.round(Math.max(...shotsToRender.map(s => s.start + s.duration)) * fps);
let segIndex = null;
if (SEGMENT) segIndex = Number(SEGMENT.split('|')[1]);
// chunks are cached by content: any change to code, assets timing or the shot list invalidates them
const chunkKey = crypto.createHash('sha1').update([fs.readFileSync(tlPath), ...['engine/kit.js', 'engine/cine.js', 'engine/stage.html'].map(f => fs.readFileSync(path.join(ROOT, f))), ...fs.readdirSync(projDir).filter(f => /\.(m?js)$/.test(f)).map(f => fs.readFileSync(path.join(projDir, f))), `${W}x${H}@${fps}`].join('|')).digest('hex').slice(0, 10);
const chunkDir = path.join(out, `chunks-${chunkKey}`);

async function openStage() {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type }); fs.createReadStream(p).pipe(res);
  }).listen(0);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) log('[page]', m.text()); if (m.text().startsWith('[scene]')) log('[page]', m.text()); });
  page.on('pageerror', e => { console.error('[page error]', e); process.exit(1); });
  await page.goto(`http://127.0.0.1:${server.address().port}/engine/stage.html?project=/${path.relative(ROOT, projDir)}${process.env.STAGE_QS ?? ''}`);
  await page.evaluate(async (cfg) => window.__setup(cfg), { shots: shots.map(pageShot), width: W, height: H, fps, draft: DRAFT });
  return { page, close: async () => { await browser.close(); server.close(); } };
}

// Render a list of [a, b) frame chunks. Each chunk is written to a temp file and renamed when
// complete, so an interrupted render resumes from the last finished chunk.
async function renderChunks(list) {
  const todo = list.filter(([a, b]) => !fs.existsSync(path.join(chunkDir, `c-${a}-${b}.mp4`)));
  if (!todo.length) return;
  const { page, close } = await openStage();
  const t0 = Date.now(); let done = 0; const total = todo.reduce((n, [a, b]) => n + b - a, 0);
  for (const [a, b] of todo) {
    const file = path.join(chunkDir, `c-${a}-${b}.mp4`), tmp = file + '.tmp.mp4';
    // warm up on the previous frame so dissolves, whips and trails have their outgoing image
    if (a > 0) await page.evaluate((t) => window.__frame(t), (a - 1) / fps);
    const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', DRAFT ? '23' : '15', '-pix_fmt', 'yuv420p', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      await page.evaluate((t) => window.__frame(t), f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
      if (++done % (fps * 4) === 0) { const rate = done / ((Date.now() - t0) / 1000); log(`[render w${segIndex}] ${done}/${total}  ${rate.toFixed(1)} fps  eta ${((total - done) / rate / 60).toFixed(1)}m`); }
    }
    enc.stdin.end(); await new Promise(r => enc.on('close', r));
    fs.renameSync(tmp, file);
  }
  await close();
}

if (SEGMENT) {
  await renderChunks(SEGMENT.split('|')[0].split(';').map(c => c.split(':').map(Number)));
  process.exit(0);
}

if (flag('stills')) {
  const { page, close } = await openStage();
  const fr = flag('stills') === true ? [0.35, 0.85] : String(flag('stills')).split(',').map(Number);
  fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
  for (const s of shotsToRender) for (const x of fr) {
    await page.evaluate((t) => window.__frame(t), s.start + s.duration * x);
    await page.screenshot({ path: path.join(out, 'stills', `${s.id}-${Math.round(x * 100)}.jpg`), type: 'jpeg', quality: 85 });
  }
  log(`[stills] ${shotsToRender.length} shots`);
  await close(); process.exit(0);
}

const silent = path.join(out, DRAFT ? 'picture-draft.mp4' : 'picture.mp4');
const t0 = Date.now();
if (!(flag('remux') && fs.existsSync(silent))) {
  const N = Number(flag('workers') ?? 1);
  fs.mkdirSync(chunkDir, { recursive: true });
  // chunks of ~15s, cut on shot boundaries
  const bounds = [...new Set([f0, ...shots.map(s => Math.round(s.start * fps)).filter(x => x > f0 && x < f1), f1])].sort((x, y) => x - y);
  const chunks = []; let a = f0;
  for (const b of bounds.slice(1)) { if (b - a >= fps * 15 || b === f1) { chunks.push([a, b]); a = b; } }
  const left = chunks.filter(([x, y]) => !fs.existsSync(path.join(chunkDir, `c-${x}-${y}.mp4`)));
  log(`[render] ${chunks.length} chunks, ${chunks.length - left.length} already done (cache ${path.basename(chunkDir)})`);
  // deal remaining chunks out round-robin so every worker gets a mix of heavy and light shots
  const per = Array.from({ length: N }, () => []); left.forEach((c, i) => per[i % N].push(c));
  await Promise.all(per.filter(l => l.length).map((l, i) => new Promise((res, rej) => {
    const p = spawn(process.execPath, [new URL(import.meta.url).pathname, projDir, `--chunks=${l.map(c => c.join(':')).join(';')}|${i}`, ...(DRAFT ? ['--draft'] : [])], { stdio: 'inherit' });
    p.on('close', c => c === 0 ? res() : rej(new Error(`worker ${i} exited ${c}`)));
  })));
  const list = path.join(out, 'segments.txt');
  fs.writeFileSync(list, chunks.map(([x, y]) => `file '${path.join(chunkDir, `c-${x}-${y}.mp4`)}'`).join('\n'));
  sh('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  log(`[render] ${f1 - f0} frames in ${((Date.now() - t0) / 60000).toFixed(1)}m with ${N} worker(s)`);
}

// ---------- 4. sound ----------
const audioFrom = f0 / fps, audioLen = (f1 - f0) / fps;
const byId = Object.fromEntries(shots.map(s => [s.id, s]));
const wordAt = (s, w, nth = 0) => {
  const hits = s.words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9.$%]/g, '').startsWith(w.toLowerCase()));
  return hits[nth]?.s ?? hits.at(-1)?.s ?? s.voAt - s.start;
};
const cues = [...(project.score?.cues ?? []), ...(project.cues ? project.cues(shots) : [])].map(c => {
  const s = byId[c.shot];
  return { ...c, at: c.word ? wordAt(s, c.word, c.nth) + (c.offset ?? 0) : c.at ?? 0 };
});
const bed = path.join(out, 'score.wav');
fs.writeFileSync(path.join(out, 'score-cfg.json'), JSON.stringify({ ...(project.score ?? {}), cues }));
execFileSync('python3', [path.join(ROOT, 'engine', 'score.py'), tlPath, bed, '@' + path.join(out, 'score-cfg.json')], { stdio: 'inherit' });

// VO: place each shot's wav on a silent track with numpy-free ffmpeg concat (handles hundreds of shots)
const voTrack = path.join(out, 'vo.wav');
{
  const parts = []; let cursor = 0; const tmp = path.join(out, 'vo-parts'); fs.mkdirSync(tmp, { recursive: true });
  const sil = (d, i) => { const f = path.join(tmp, `sil-${i}.wav`); sh('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `anullsrc=r=24000:cl=mono`, '-t', d.toFixed(4), f]); return f; };
  shots.filter(s => s.voFile).forEach((s, i) => {
    const at = s.voAt - audioFrom;
    if (at + s.voDur < 0 || at > audioLen) return;
    if (at > cursor) { parts.push(sil(at - cursor, i)); cursor = at; }
    const f = path.join(tmp, `vo-${i}.wav`);
    sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', s.voFile, '-ar', '24000', '-ac', '1', f]);
    parts.push(f); cursor += s.voDur;
  });
  if (cursor < audioLen) parts.push(sil(audioLen - cursor, 'end'));
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
  sh('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'pcm_s16le', voTrack]);
}
const mix = path.join(out, 'mix.wav');
const graph = `[0:a]atrim=start=${audioFrom}:duration=${audioLen},asetpts=PTS-STARTPTS[bed];` +
  // documentary voice chain: rumble cut, presence lift, gentle compression, a touch of room
  `[1:a]aformat=channel_layouts=stereo,highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,aecho=0.8:0.4:35:0.06,apad,asplit[vo][vosc];` +
  `[bed][vosc]sidechaincompress=threshold=0.04:ratio=5:release=450[duck];[duck][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=9[a]`;
sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', bed, '-i', voTrack, '-filter_complex', graph, '-map', '[a]', '-t', String(audioLen), mix]);

// ---------- 5. film finish + mux ----------
const finish = project.finish ?? {};
const master = path.join(out, DRAFT ? 'draft.mp4' : `${path.basename(projDir)}.mp4`);
const vf = [
  // blend must run in RGB; in YUV, screen-blending the chroma planes tints everything purple
  'format=gbrp',
  // halation: blurred highlights, tinted red-orange like film stock without anti-halation backing
  `split[base][hl];[hl]curves=all='0/0 0.62/0 1/1',gblur=sigma=${(finish.halation ?? 18) * W / 1920},colorchannelmixer=rr=1:gg=0.45:bb=0.25[glow];[base][glow]blend=all_mode=screen:all_opacity=${finish.halationAmount ?? 0.55}`,
  // bloom: wide soft glow from everything bright
  `split[b2][bl];[bl]curves=all='0/0 0.5/0.05 1/1',gblur=sigma=${60 * W / 1920}[bloom];[b2][bloom]blend=all_mode=screen:all_opacity=${finish.bloom ?? 0.18}`,
  `vignette=angle=${finish.vignette ?? 0.55}`,
  'format=yuv420p',
  `noise=c0s=${finish.grain ?? 9}:c0f=t+u:c1s=${(finish.grain ?? 9) / 3}:c1f=t+u:c2s=${(finish.grain ?? 9) / 3}:c2f=t+u`,
].join(',');
sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', mix, '-filter_complex', `[0:v]${vf}[v]`, '-map', '[v]', '-map', '1:a',
  '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', DRAFT ? '23' : '18', '-tune', 'grain', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', master]);
log(`[master] ${master}  (${(total / 60).toFixed(1)} min)`);
