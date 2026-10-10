#!/usr/bin/env node
// Narration-first video renderer.
//
//   node engine/render.mjs projects/<name> [--draft] [--only=id,id] [--stills[=0.3,0.9]] [--workers=N] [--remux]
//                          [--fps=60] [--shutter=180 [--samples=2]] [--chunk-seconds=5] [--look=fast|reference]
//                          [--gl=llvmpipe|swiftshader] [--aa=fxaa|msaa|none] [--render-scale=0.667] [--finish=chunk|pass]
//   node engine/render.mjs projects/<name> --status        progress, ETA and the command that resumes the render
//
// 1. Synthesises each shot's VO (Kokoro / ElevenLabs / Piper) and aligns it word by word.
// 2. Derives shot timing from the narration; visuals and sound cues can key off words.
// 3. Renders every frame deterministically in headless Chromium (Three.js + DOM type). The film is
//    cut into ~5 s chunks (on shot boundaries where possible) that a pool of N persistent workers
//    pulls from a queue, so every worker stays busy to the end. Each finished chunk is a final,
//    film-finished mp4 in out/chunks-<hash>/; a rerun skips finished chunks (resume after a crash or
//    a container restart by running the same command again). Progress and ETA: out/progress.json.
// 4. Builds the score/sound-design bed and mixes it under the VO.
// 5. Concatenates the chunks (stream copy) and muxes the master.
//
// Speed (docs/research/render-speed.md): WebGL runs on Mesa llvmpipe through ANGLE's gl-egl
// backend on a surfaceless EGL (needs libegl1 + libegl-mesa0), falling back to SwiftShader
// if llvmpipe isn't picked up. Frames are captured with CDP captureScreenshot(optimizeForSpeed)
// in chrome-headless-shell. The film finish (halation, bloom, vignette, grain) runs inside each
// chunk's encoder; its glows are computed at quarter resolution (~20 CPU-ms/frame, was ~125).
// Per-project knobs live in project.settings:
//   settings.fps           output frame rate (default project.fps, else 30). Timeline, cues and audio are in seconds.
//   settings.shutter       motion blur: shutter angle in degrees (0 = off, 180 = film). Each output frame
//                          averages settings.shutterSamples (default 2) renders spread over the open shutter.
//   settings.chunkSeconds  target chunk length (default 5)
//   settings.workers       parallel browsers (default 3 on a 4-vCPU box)
//   settings.aa            'fxaa' (default) | 'msaa' (4x, slow on CPU) | 'none'
//   settings.renderScale   GL resolution scale, default 1 (DOM overlays always render at full res)
//   settings.look          'fast' (default) | 'reference' (the original full-res finish, ~6x slower, same look)
//   settings.preset/crf    x264 preset (default veryfast) and crf (default 18); settings.gop GOP length in s (0.5)
// Env: BV_GL=swiftshader forces SwiftShader; BV_CHROME overrides the browser binary.
import { chromium } from 'playwright-core';
import { spawn, fork, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SCRIPT = new URL(import.meta.url).pathname;
const args = process.argv.slice(2);
const projDir = path.resolve(args.find(a => !a.startsWith('--')) || 'projects/the-box');
const flag = (k) => { const a = args.find(a => a === `--${k}` || a.startsWith(`--${k}=`)); return a ? (a.split('=')[1] ?? true) : undefined; };
const out = path.join(projDir, 'out');
const progressPath = path.join(out, 'progress.json');
const fmtDur = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}m` : m ? `${m}m${String(x).padStart(2, '0')}s` : `${x}s`; };

if (flag('status')) { printStatus(); process.exit(0); }

const WORKER = !!flag('worker'); // internal: a pooled render worker, fed chunks by the parent over IPC
const DRAFT = !!flag('draft');
const ONLY = flag('only');

const mjs = path.join(projDir, 'project.mjs');
const project = fs.existsSync(mjs) ? (await import(pathToFileURL(mjs))).default : JSON.parse(fs.readFileSync(path.join(projDir, 'project.json'), 'utf8'));
const settings = project.settings ?? {};
const fps = Number(flag('fps') ?? (DRAFT ? 12 : settings.fps ?? project.fps ?? 30));
const [W, H] = DRAFT ? [960, 540] : [project.width, project.height];
fs.mkdirSync(out, { recursive: true });
const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28, ...opts }).toString();
const log = (...a) => console.log(...a);
const AA = String(flag('aa') ?? settings.aa ?? 'fxaa');
const RSCALE = Number(flag('render-scale') ?? settings.renderScale ?? 1);
const FINISH = String(flag('finish') ?? 'chunk'); // 'chunk': finish inside each chunk encode; 'pass': old separate pass
const LOOK = String(flag('look') ?? settings.look ?? 'fast');
const SHUTTER = Number(flag('shutter') ?? settings.shutter ?? 0);
const NS = SHUTTER > 0 ? Math.max(2, Math.round(Number(flag('samples') ?? settings.shutterSamples ?? 2))) : 1;
const CHUNK_S = Number(flag('chunk-seconds') ?? settings.chunkSeconds ?? 5);
// warm-up frames before a chunk that starts mid-shot (trails and other frame-to-frame state settle);
// a chunk that starts on a shot boundary needs just the one frame before it (the outgoing image)
const WARM = Math.round(Number(settings.warmup ?? Math.max(4, Math.round(fps / 4))));
// a mid-shot cut stays this many seconds clear of the shot's start, so it never lands inside a transition
const GUARD = Number(settings.cutGuard ?? 1.0);
const GOP = Math.max(1, Math.round(fps * Number(settings.gop ?? 0.5))); // YouTube: closed GOP of half the frame rate
let GL = String(flag('gl') ?? process.env.BV_GL ?? 'llvmpipe');
if (!['fxaa', 'msaa', 'none'].includes(AA)) throw new Error(`--aa must be fxaa|msaa|none, got ${AA}`);
if (!['llvmpipe', 'swiftshader'].includes(GL)) throw new Error(`--gl must be llvmpipe|swiftshader, got ${GL}`);
if (!['chunk', 'pass'].includes(FINISH)) throw new Error(`--finish must be chunk|pass, got ${FINISH}`);
if (!['fast', 'reference'].includes(LOOK)) throw new Error(`--look must be fast|reference, got ${LOOK}`);
if (!(RSCALE > 0 && RSCALE <= 1)) throw new Error(`renderScale must be in (0, 1], got ${RSCALE}`);
if (!(Number.isInteger(fps) && fps >= 1 && fps <= 120)) throw new Error(`fps must be an integer in 1..120, got ${fps}`);
if (!(SHUTTER >= 0 && SHUTTER <= 360)) throw new Error(`shutter must be 0..360 degrees, got ${SHUTTER}`);
if (!(CHUNK_S >= 1)) throw new Error(`chunk-seconds must be >= 1, got ${CHUNK_S}`);
const pageShot = (s) => ({ id: s.id, set: s.set, params: s.params, start: s.start, duration: s.duration, voAt: s.voAt, voDur: s.voDur, words: s.words, chapter: s.chapter });

// ---------- 1 + 2. voice-over and timeline (skipped by workers, who read the timeline) ----------
let shots;
const tlPath = path.join(out, 'timeline.json');
if (WORKER) {
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
  for (const s of shots) { if (['chapter'].includes(s.set)) continue; const key = (s.set ?? s.id) + JSON.stringify(s.params ?? {});
    if (seen.has(key)) throw new Error(`repeated visual: ${s.id} duplicates ${seen.get(key)} (${s.set})`); seen.set(key, s.id); }
  fs.writeFileSync(tlPath, JSON.stringify(shots, null, 1));
  const m = Math.floor(T / 60), sec = (T % 60).toFixed(1);
  log(`[timeline] ${shots.length} clips, ${m}m${sec}s @ ${fps}fps${NS > 1 ? ` (${SHUTTER}° shutter, ${NS} samples/frame)` : ''} ${W}x${H}`);
  if (flag('vo-only')) process.exit(0);
}
const total = shots.at(-1).start + shots.at(-1).duration;

// ---------- 3. frames ----------
let shotsToRender = shots;
if (ONLY) shotsToRender = shots.filter(s => ONLY.split(',').includes(s.id));
const f0 = Math.round(Math.min(...shotsToRender.map(s => s.start)) * fps);
const f1 = Math.round(Math.max(...shotsToRender.map(s => s.start + s.duration)) * fps);

// Times rendered for output frame f. With a shutter, NS samples spread over the open shutter
// starting at the frame's own time (so sample 0 is the unblurred frame), clamped to the shot the
// frame belongs to: a hard cut never smears two shots together.
const shotEndAt = (T) => { const s = shots.find(s => T >= s.start && T < s.start + s.duration); return s ? s.start + s.duration : Infinity; };
const sampleTimes = (f) => {
  const t0 = f / fps; if (NS === 1) return [t0];
  const end = shotEndAt(t0) - 1e-4, open = SHUTTER / 360 / fps;
  return Array.from({ length: NS }, (_, k) => Math.max(t0, Math.min(t0 + open * k / NS, end)));
};

// ---------- film finish (shared by the chunk encoders and the old separate pass) ----------
const finish = project.finish ?? {};
const FIN = { hal: finish.halation ?? 18, halA: finish.halationAmount ?? 0.55, bloom: finish.bloom ?? 0.18, vig: finish.vignette ?? 0.55, grain: finish.grain ?? 9 };
// `seed` is the absolute frame number the encoder starts at, so a chunk's grain never depends on
// which worker rendered it or in what order. Everything else in the chain is per-frame and stateless.
const noiseF = (seed) => `noise=c0s=${FIN.grain}:c0f=t+u:c1s=${FIN.grain / 3}:c1f=t+u:c2s=${FIN.grain / 3}:c2f=t+u${seed === undefined ? '' : `:all_seed=${seed}`}`;
// The original chain, all at full resolution in RGB (~125 CPU-ms/frame). Kept as the look reference.
const referenceChain = (seed) => [
  // blend must run in RGB; in YUV, screen-blending the chroma planes tints everything purple
  'format=gbrp',
  // halation: blurred highlights, tinted red-orange like film stock without anti-halation backing
  `split[base][hl];[hl]curves=all='0/0 0.62/0 1/1',gblur=sigma=${FIN.hal * W / 1920},colorchannelmixer=rr=1:gg=0.45:bb=0.25[glow];[base][glow]blend=all_mode=screen:all_opacity=${FIN.halA}`,
  // bloom: wide soft glow from everything bright
  `split[b2][bl];[bl]curves=all='0/0 0.5/0.05 1/1',gblur=sigma=${60 * W / 1920}[bloom];[b2][bloom]blend=all_mode=screen:all_opacity=${FIN.bloom}`,
  `vignette=angle=${FIN.vig}`,
  'format=yuv420p',
  noiseF(seed),
].join(',');
// The same look for ~20 CPU-ms/frame (PSNR ~44 dB against the reference, noise off):
//  - halation and bloom are blurred at quarter resolution, pre-scaled by their opacities and merged
//    with a screen blend there, then upscaled once (the glows are smooth, so nothing is lost);
//  - screen(a, g) = a + g(1 - a): the (1 - a) factor is applied at low res too, so the full-res
//    step is a plain add, which is exact in YUV (luma add, chroma add around 128). No RGB at 1080p;
//  - the full-range JPEG planes are relabelled, not converted, and one lut2 against a precomputed
//    vignette mask applies the vignette and the full-to-TV range squeeze together.
function fastChain(seed) {
  const ds = 4, w = Math.round(W / ds), h = Math.round(H / ds), k = W / 1920 / ds, A = FIN.halA, B = FIN.bloom;
  const relabel = 'mergeplanes=format=yuv420p:map1s=0:map1p=1:map2s=0:map2p=2';
  const r = (x) => +x.toFixed(4);
  return [
    `split[fa][fb]`,
    `[fa]${relabel}[fbase]`,
    `[fb]scale=${w}:${h}:flags=area,format=gbrp,split=3[fl1][fl2][fl3]`,
    `[fl1]curves=all='0/0 0.62/0 1/1',gblur=sigma=${r(FIN.hal * k)},colorchannelmixer=rr=${r(A)}:gg=${r(0.45 * A)}:bb=${r(0.25 * A)}[fhal]`,
    `[fl2]curves=all='0/0 0.5/0.05 1/1',gblur=sigma=${r(60 * k)},colorchannelmixer=rr=${r(B)}:gg=${r(B)}:bb=${r(B)}[fblo]`,
    `[fhal][fblo]blend=all_mode=screen[fglow]`,
    `[fl3]negate[finv]`,
    `[fglow][finv]blend=all_mode=multiply,scale=${W}:${H}:flags=bilinear:out_range=full,format=yuvj420p,${relabel}[fup]`,
    `[fbase][fup]blend=c0_mode=addition:c1_mode=grainmerge:c2_mode=grainmerge[fsum]`,
    `color=white:s=${W}x${H}:d=0.04,format=gbrp,vignette=angle=${FIN.vig}:dither=0,extractplanes=g,split[fvy][fvc]`,
    `[fvc]scale=${W / 2}:${H / 2}:flags=area,split[fvu][fvv]`,
    `[fvy][fvu][fvv]mergeplanes=format=yuv420p:map1s=1:map1p=0:map2s=2:map2p=0[fmask]`,
    `[fsum][fmask]lut2=c0='16+x*y*219/65025':c1='128+(x-128)*y*224/65025':c2='128+(x-128)*y*224/65025',${noiseF(seed)}`,
  ].join(';');
}
// [src] (full-range yuvj420p) -> finished picture
const finishBody = (seed) => LOOK === 'reference' ? referenceChain(seed) : fastChain(seed);
// Chunk encoder graph: [0:v] (JPEGs at fps*NS) -> optional shutter blend -> optional finish -> [v]
const chunkGraph = (seed) => {
  const blur = NS > 1 ? `,tmix=frames=${NS},select='eq(mod(n\\,${NS})\\,${NS - 1})',setpts=N/(${fps}*TB)` : '';
  return `[0:v]format=yuvj420p${blur}[src];` + (FINISH === 'chunk' ? `[src]${finishBody(seed)}[v]` : `[src]format=yuv420p[v]`);
};
// JPEG/JFIF is BT.601 and the finish keeps that matrix, so tag it (untagged HD is assumed BT.709)
const COLOR_TAGS = ['-colorspace', 'smpte170m', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
// chunk encoder: with the finish folded in, chunks are final picture; otherwise fast intermediates
const chunkEnc = FINISH === 'chunk'
  ? (DRAFT ? ['-preset', 'veryfast', '-crf', '23'] : ['-preset', settings.preset ?? 'veryfast', '-crf', String(settings.crf ?? 18), '-tune', 'grain'])
  : (DRAFT ? ['-preset', 'ultrafast', '-crf', '18'] : ['-preset', 'ultrafast', '-crf', '12']);
const encArgs = [...chunkEnc, '-g', String(GOP), '-bf', '2', '-pix_fmt', 'yuv420p', ...COLOR_TAGS];

// ---------- browser ----------
const BROWSERS = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
const findBrowser = () => {
  if (process.env.BV_CHROME) return process.env.BV_CHROME;
  const dirs = fs.existsSync(BROWSERS) ? fs.readdirSync(BROWSERS).sort().reverse() : [];
  // chrome-headless-shell (old headless) captures ~2x faster than the full binary
  for (const d of dirs) { const p = path.join(BROWSERS, d, 'chrome-linux', 'headless_shell'); if (d.startsWith('chromium_headless_shell') && fs.existsSync(p)) return p; }
  for (const d of dirs) { const p = path.join(BROWSERS, d, 'chrome-linux', 'chrome'); if (/^chromium-\d/.test(d) && fs.existsSync(p)) return p; }
  return undefined; // let Playwright pick
};
const GL_ARGS = {
  // Mesa llvmpipe through ANGLE's EGL backend on a surfaceless display: no Xvfb, no GPU.
  // --use-angle=gl or --use-gl=egl alone silently fall back to SwiftShader.
  llvmpipe: ['--use-angle=gl-egl', '--ignore-gpu-blocklist'],
  swiftshader: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};
async function launch(gl) {
  const env = { ...process.env, EGL_PLATFORM: 'surfaceless' };
  // llvmpipe uses every core by default. Capping LP_NUM_THREADS per worker was slower in testing.
  const browser = await chromium.launch({ executablePath: findBrowser(), args: GL_ARGS[gl], env });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const rendererName = await page.evaluate(() => {
    const g = document.createElement('canvas').getContext('webgl2'); if (!g) return 'none';
    const ext = g.getExtension('WEBGL_debug_renderer_info');
    return String(g.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : g.RENDERER));
  });
  return { browser, page, rendererName };
}
// Open a browser on the requested backend. If llvmpipe was asked for and not picked up, warn and
// fall back to SwiftShader (or fail, in a worker: the parent already resolved the backend and the
// chunk cache key depends on it).
async function launchChecked(strict) {
  let b = await launch(GL);
  const ok = GL === 'llvmpipe' ? /llvmpipe/i.test(b.rendererName) : /swiftshader/i.test(b.rendererName);
  if (!ok) {
    await b.browser.close();
    if (strict || GL !== 'llvmpipe') throw new Error(`[gl] wanted ${GL}, got renderer "${b.rendererName}"`);
    console.error(`\n[gl] !!!!! WARNING: llvmpipe NOT ACTIVE (renderer "${b.rendererName}"). Falling back to SwiftShader, ~3-10x slower.\n` +
      `[gl] !!!!! Install Mesa EGL: apt-get install -y libegl1 libegl-mesa0 libgl1-mesa-dri\n`);
    GL = 'swiftshader';
    b = await launch(GL);
  }
  if (!WORKER) log(`[gl] ${GL}: ${b.rendererName}`);
  return b;
}

// Resolve the backend once in the parent (workers get it via --gl) so the cache key is right.
if (!WORKER && !flag('stills')) { const b = await launchChecked(false); await b.browser.close(); }

async function openStage() {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type }); fs.createReadStream(p).pipe(res);
  }).listen(0);
  const { browser, page } = await launchChecked(WORKER);
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) log('[page]', m.text()); if (m.text().startsWith('[scene]')) log('[page]', m.text()); });
  page.on('pageerror', e => { console.error('[page error]', e); process.exit(1); });
  await page.goto(`http://127.0.0.1:${server.address().port}/engine/stage.html?project=/${path.relative(ROOT, projDir)}${process.env.STAGE_QS ?? ''}`);
  await page.evaluate(async (cfg) => window.__setup(cfg), { shots: shots.map(pageShot), width: W, height: H, fps, draft: DRAFT, aa: AA, renderScale: RSCALE, shutter: SHUTTER, samples: NS });
  // CDP capture with optimizeForSpeed: about half the cost of page.screenshot
  const cdp = await page.context().newCDPSession(page);
  const capture = async (quality = 95) => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, optimizeForSpeed: true })).data, 'base64');
  return { page, capture, close: async () => { await browser.close(); server.close(); } };
}

// ---------- worker: a persistent browser that renders whatever chunk the parent hands it ----------
if (WORKER) {
  const { page, capture, close } = await openStage();
  const frameAt = (t) => page.evaluate((t) => window.__frame(t), t);
  // Render frames [a, b) into `file`. Written to a temp file and renamed when complete, so an
  // interrupted chunk is simply rendered again on the next run.
  async function renderChunk({ a, b, warm, file }) {
    const tmp = file + '.tmp.mp4';
    // warm up on the frames before the chunk: dissolves, whips and trails need the outgoing image
    for (let f = Math.max(0, a - warm); f < a; f++) await frameAt(f / fps);
    const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps * NS), '-i', '-',
      '-filter_complex', chunkGraph(a), '-map', '[v]', '-r', String(fps), '-c:v', 'libx264', ...encArgs, tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise(r => enc.on('close', r));
    enc.stdin.on('error', () => {}); // a dead encoder is reported by its exit code below
    for (let f = a; f < b; f++) {
      for (const t of sampleTimes(f)) {
        await frameAt(t);
        const buf = await capture();
        if (!enc.stdin.write(buf)) await Promise.race([new Promise(r => enc.stdin.once('drain', r)), closed]);
      }
      if ((f - a + 1) % 15 === 0) process.send({ type: 'progress', n: f - a + 1 });
    }
    enc.stdin.end(); const code = await closed;
    if (code !== 0) throw new Error(`chunk encoder exited ${code} on ${a}-${b}`);
    fs.renameSync(tmp, file);
  }
  const inbox = []; let wake = null;
  process.on('message', (m) => { inbox.push(m); wake?.(); });
  process.on('disconnect', () => process.exit(1)); // parent died: stop rendering
  process.send({ type: 'ready' });
  for (;;) {
    while (!inbox.length) await new Promise(r => { wake = r; });
    const m = inbox.shift();
    if (m.type === 'exit') break;
    const t = Date.now();
    await renderChunk(m.chunk);
    process.send({ type: 'done', ms: Date.now() - t });
  }
  await close();
  process.exit(0);
}

if (flag('stills')) {
  const { page, capture, close } = await openStage();
  const fr = flag('stills') === true ? [0.35, 0.85] : String(flag('stills')).split(',').map(Number);
  fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
  for (const s of shotsToRender) for (const x of fr) {
    await page.evaluate((t) => window.__frame(t), s.start + s.duration * x);
    fs.writeFileSync(path.join(out, 'stills', `${s.id}-${Math.round(x * 100)}.jpg`), await capture(85));
  }
  log(`[stills] ${shotsToRender.length} shots`);
  await close(); process.exit(0);
}

// chunks are cached by content: any change to code, assets timing, the shot list, the rasterizer
// or the render/encode/finish settings invalidates them
const engineFiles = fs.readdirSync(path.join(ROOT, 'engine')).filter(f => /\.(js|html)$/.test(f)).sort().map(f => path.join(ROOT, 'engine', f));
const chunkKey = crypto.createHash('sha1').update([fs.readFileSync(tlPath), ...engineFiles.map(f => fs.readFileSync(f)), ...fs.readdirSync(projDir).filter(f => /\.(m?js)$/.test(f)).sort().map(f => fs.readFileSync(path.join(projDir, f))), `${W}x${H}@${fps}`,
  JSON.stringify({ gl: GL, aa: AA, scale: RSCALE, finish: FINISH, look: LOOK, shutter: SHUTTER, ns: NS, enc: encArgs, vf: chunkGraph(0), capture: 'cdp-jpeg95' })].join('|')).digest('hex').slice(0, 10);
const chunkDir = path.join(out, `chunks-${chunkKey}`);
const chunkFile = (a, b) => path.join(chunkDir, `c-${a}-${b}.mp4`);

// Chunk plan: ~CHUNK_S seconds each. Prefer a shot boundary near the target length (the warm-up is
// then one frame); a long stretch without one is cut mid-shot, at least GUARD s after the shot's
// start so no transition straddles the cut, and that chunk warms up on WARM frames.
function planChunks() {
  const starts = shots.map(s => Math.round(s.start * fps));
  const bounds = new Set(starts.filter(x => x > f0 && x < f1));
  const want = Math.max(1, Math.round(CHUNK_S * fps));
  const chunks = []; let a = f0;
  const warmFor = (x) => x === 0 ? 0 : (x === f0 || bounds.has(x)) ? 1 : WARM;
  while (a < f1) {
    if (f1 - a <= want * 1.5) { chunks.push({ a, b: f1, warm: warmFor(a) }); break; }
    let best;
    for (const x of bounds) if (x >= a + want * 0.6 && x <= a + want * 1.5 && (best === undefined || Math.abs(x - a - want) < Math.abs(best - a - want))) best = x;
    if (best === undefined) {
      best = a + want;
      const sStart = Math.max(...starts.filter(x => x <= best));
      if (best - sStart < GUARD * fps) best = sStart + Math.ceil(GUARD * fps);
      if (best >= f1) best = f1;
    }
    chunks.push({ a, b: best, warm: warmFor(a) }); a = best;
  }
  return chunks;
}

// ---------- progress file (out/progress.json) and --status ----------
const startedAt = Date.now();
const prev = (() => { try { return JSON.parse(fs.readFileSync(progressPath, 'utf8')); } catch { return null; } })();
const progress = { pid: process.pid, project: path.basename(projDir), cmd: ['node', path.relative(process.cwd(), SCRIPT), ...process.argv.slice(2)].join(' '),
  cwd: process.cwd(), fps, size: `${W}x${H}`, shutter: SHUTTER, samples: NS, workers: 0, chunkDir: path.basename(chunkDir), phase: 'starting', startedAt,
  updatedAt: startedAt, chunks: [], frames: f1 - f0, framesDone: 0, rate: prev?.chunkDir === path.basename(chunkDir) ? prev.rate : null, eta: null, active: {}, chunkMs: prev?.chunkDir === path.basename(chunkDir) ? (prev.chunkMs ?? {}) : {} };
let lastWrite = 0;
function writeProgress(force = false) {
  if (!force && Date.now() - lastWrite < 2000) return;
  lastWrite = Date.now(); progress.updatedAt = lastWrite;
  const tmp = progressPath + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(progress)); fs.renameSync(tmp, progressPath);
}
function printStatus() {
  let P; try { P = JSON.parse(fs.readFileSync(progressPath, 'utf8')); } catch { console.log(`[status] nothing rendered yet for ${projDir} (no out/progress.json)`); return; }
  let alive = false; try { process.kill(P.pid, 0); alive = true; } catch { }
  // finished chunks on disk are the truth (the parent may have died since its last write)
  const done = P.chunks.filter(([a, b]) => fs.existsSync(path.join(out, P.chunkDir, `c-${a}-${b}.mp4`)));
  const framesDone = done.reduce((n, [a, b]) => n + b - a, 0);
  const age = (Date.now() - P.updatedAt) / 1000;
  const pct = P.frames ? (100 * framesDone / P.frames).toFixed(1) : '0';
  const running = alive && P.phase !== 'done' && P.phase !== 'failed';
  const eta = P.rate ? (P.frames - framesDone) / P.rate : null;
  console.log(`[status] ${P.project}  ${P.size} @ ${P.fps}fps${P.samples > 1 ? ` (${P.shutter}° shutter x${P.samples})` : ''}  phase: ${P.phase}${running ? ` (pid ${P.pid} running)` : alive ? '' : ' (not running)'}`);
  console.log(`[status] chunks ${done.length}/${P.chunks.length}  frames ${framesDone}/${P.frames} (${pct}%)  ` +
    `${P.rate ? `rate ${P.rate.toFixed(2)} fps  ` : ''}${eta !== null && P.phase === 'render' ? `eta ${fmtDur(eta)}  ` : ''}elapsed ${fmtDur((P.updatedAt - P.startedAt) / 1000)}  updated ${fmtDur(age)} ago`);
  for (const [w, c] of Object.entries(P.active ?? {})) console.log(`[status]   w${w}: frames ${c.a}-${c.b}  ${c.n ?? 0}/${c.b - c.a} done, ${fmtDur((P.updatedAt - c.since) / 1000)} in`);
  if (P.phase === 'done') console.log(`[status] master: ${P.master}`);
  else if (!running) console.log(`[status] to resume (finished chunks are kept): cd ${P.cwd} && ${P.cmd}`);
}

// ---------- parent: chunk queue and worker pool ----------
const silent = path.join(out, `picture${DRAFT ? '-draft' : ''}${FINISH === 'chunk' ? '-fin' : ''}.mp4`);
const t0 = Date.now();
async function renderAll(chunks, N) {
  const queue = chunks.filter(c => !fs.existsSync(chunkFile(c.a, c.b)));
  const doneBefore = chunks.filter(c => fs.existsSync(chunkFile(c.a, c.b))).reduce((n, c) => n + c.b - c.a, 0);
  let doneNow = 0, chunksDone = chunks.length - queue.length;
  progress.framesDone = doneBefore; progress.phase = 'render'; progress.workers = N; writeProgress(true);
  log(`[render] ${chunks.length} chunks of ~${CHUNK_S}s, ${chunksDone} already done (cache ${path.basename(chunkDir)}), ${N} worker(s)`);
  if (!queue.length) return;
  const passArgs = [projDir, '--worker', `--gl=${GL}`, `--fps=${fps}`, `--shutter=${SHUTTER}`, `--samples=${NS}`, `--aa=${AA}`, `--render-scale=${RSCALE}`, `--finish=${FINISH}`, `--look=${LOOK}`, ...(DRAFT ? ['--draft'] : [])];
  const tries = new Map(); const workers = new Map();
  const rT0 = Date.now();
  const tick = (force) => {
    const partial = [...workers.values()].reduce((n, w) => n + (w.cur ? w.n : 0), 0);
    const el = (Date.now() - rT0) / 1000, f = doneNow + partial;
    if (f > 0 && el > 20) progress.rate = f / el;
    progress.framesDone = doneBefore + doneNow;
    progress.eta = progress.rate ? (progress.frames - progress.framesDone - partial) / progress.rate : null;
    progress.active = Object.fromEntries([...workers.entries()].filter(([, w]) => w.cur).map(([i, w]) => [i, { a: w.cur.a, b: w.cur.b, n: w.n, since: w.since }]));
    writeProgress(force);
  };
  await new Promise((resolve, reject) => {
    let failed = false, respawns = 0;
    const fail = (e) => { if (failed) return; failed = true; for (const w of workers.values()) w.proc.kill(); reject(e); };
    const give = (w) => {
      const c = queue.shift();
      if (!c) { w.cur = null; w.proc.send({ type: 'exit' }); return; }
      w.cur = c; w.n = 0; w.since = Date.now();
      w.proc.send({ type: 'chunk', chunk: { ...c, file: chunkFile(c.a, c.b) } });
    };
    const start = (i) => {
      const proc = fork(SCRIPT, passArgs, { stdio: 'inherit' });
      const w = { proc, cur: null, n: 0, since: Date.now() }; workers.set(i, w);
      proc.on('message', (m) => {
        if (m.type === 'progress') { w.n = m.n; return tick(); }
        if (m.type === 'done') {
          const c = w.cur; doneNow += c.b - c.a; chunksDone++; progress.chunkMs[`${c.a}-${c.b}`] = m.ms; w.cur = null; tick(true);
          const fpsNow = (c.b - c.a) / (m.ms / 1000);
          log(`[render] w${i} ${c.a}-${c.b} in ${(m.ms / 1000).toFixed(0)}s (${fpsNow.toFixed(1)} fps)  ${chunksDone}/${chunks.length} chunks  ${(100 * progress.framesDone / progress.frames).toFixed(1)}%` +
            `${progress.rate ? `  ${progress.rate.toFixed(2)} fps overall  eta ${fmtDur(progress.eta)}` : ''}`);
        }
        give(w); // 'ready' or 'done': hand out the next chunk
      });
      proc.on('exit', (code) => {
        workers.delete(i);
        if (failed) return;
        if (w.cur || (code !== 0 && queue.length)) {
          // the worker died: put its chunk back and replace it (a page error or OOM shouldn't kill an hours-long render)
          if (w.cur) {
            const k = `${w.cur.a}-${w.cur.b}`, n = (tries.get(k) ?? 0) + 1; tries.set(k, n);
            if (n > 2) return fail(new Error(`chunk ${k} failed ${n} times`));
            queue.unshift(w.cur); w.cur = null;
          }
          if (++respawns > 3 * N) return fail(new Error(`workers keep dying (last exit code ${code})`));
          console.error(`[render] worker ${i} exited ${code}; requeued its chunk and restarting it`);
          return start(i);
        }
        if (!workers.size) queue.length ? fail(new Error('all workers exited with chunks left')) : resolve();
      });
    };
    for (let i = 0; i < Math.min(N, queue.length); i++) start(i);
    const iv = setInterval(() => tick(), 5000); iv.unref();
  });
}

if (!(flag('remux') && fs.existsSync(silent))) {
  const N = Number(flag('workers') ?? settings.workers ?? 3);
  fs.mkdirSync(chunkDir, { recursive: true });
  for (const f of fs.readdirSync(chunkDir)) if (f.endsWith('.tmp.mp4')) fs.rmSync(path.join(chunkDir, f)); // half-written chunks from a crash
  const chunks = planChunks();
  progress.chunks = chunks.map(c => [c.a, c.b]);
  try { await renderAll(chunks, N); } catch (e) { progress.phase = 'failed'; progress.error = String(e.message ?? e); writeProgress(true); throw e; }
  const list = path.join(out, 'segments.txt');
  fs.writeFileSync(list, chunks.map(({ a, b }) => `file '${chunkFile(a, b)}'`).join('\n'));
  sh('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  log(`[render] ${f1 - f0} frames in ${((Date.now() - t0) / 60000).toFixed(1)}m with ${N} worker(s)`);
}
progress.phase = 'audio'; progress.active = {}; writeProgress(true);

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

// VO: every shot's wav at its exact sample on one track (score.py --vo; no cumulative rounding)
const voTrack = path.join(out, 'vo.wav');
execFileSync('python3', [path.join(ROOT, 'engine', 'score.py'), '--vo', tlPath, voTrack, String(audioFrom), String(audioLen)], { stdio: 'inherit' });
const mix = path.join(out, 'mix.wav');
const graph = `[0:a]atrim=start=${audioFrom}:duration=${audioLen},asetpts=PTS-STARTPTS[bed];` +
  // documentary voice chain: rumble cut, presence lift, gentle compression, a touch of room
  `[1:a]aformat=channel_layouts=stereo,highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,aecho=0.8:0.4:35:0.06,apad,asplit[vo][vosc];` +
  `[bed][vosc]sidechaincompress=threshold=0.04:ratio=5:release=450[duck];[duck][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=9,aresample=48000,apad[a]`; // loudnorm drops its last ~50 ms; pad back to the exact length
sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', bed, '-i', voTrack, '-filter_complex', graph, '-map', '[a]', '-ar', '48000', '-t', String(audioLen), mix]);

// ---------- 5. film finish + mux ----------
const master = path.join(out, DRAFT ? 'draft.mp4' : `${path.basename(projDir)}.mp4`);
const tf = Date.now(); progress.phase = 'mux'; writeProgress(true);
if (FINISH === 'chunk') {
  // the chunks already carry the finish: stream-copy the picture, encode only the audio
  sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', mix, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', String(audioLen), '-movflags', '+faststart', master]);
} else {
  sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', mix, '-filter_complex', `[0:v]format=yuvj420p[src];[src]${finishBody()}[v]`, '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', DRAFT ? '23' : '18', '-tune', 'grain', '-g', String(GOP), '-bf', '2', ...COLOR_TAGS,
    '-c:a', 'aac', '-b:a', '256k', '-t', String(audioLen), '-movflags', '+faststart', master]);
}
log(`[finish] ${FINISH === 'chunk' ? 'mux only (finish ran in the chunk encoders)' : 'separate finish pass'} in ${((Date.now() - tf) / 1000).toFixed(1)}s`);
log(`[master] ${master}  (${(audioLen / 60).toFixed(1)} min @ ${fps}fps, total ${fmtDur((Date.now() - t0) / 1000)})`);
progress.phase = 'done'; progress.master = master; progress.wall = (Date.now() - startedAt) / 1000; writeProgress(true);
