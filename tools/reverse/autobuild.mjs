#!/usr/bin/env node
// AUTOBUILD: frame-by-frame rebuild loop with DeepSeek as the builder and a pixel diff as the judge.
//   node tools/reverse/autobuild.mjs reverse/<name>/rebuild [--shots=s01,s02] [--iters=6] [--samples=8] [--model=deepseek-flash]
//
// For each shot of a project scaffolded by rebuild.mjs:
//   evidence  original frames at N sample times (one sheet), the shot's dominant colours, its exact length
//   loop      DeepSeek writes the whole composition (HTML/CSS/SVG + one paused GSAP timeline) →
//             `hyperframes diff <original> . --at <samples>` scores it (SSIM mean, worst 4×4 cell p05) →
//             `hyperframes snapshot --against` makes a render|original pair sheet → both go back to DeepSeek
//             with the score history; the best-scoring version is kept (never a worse one)
//   stop      pass (mean ≥ 0.92, cell p05 ≥ 0.75), --iters reached, or 2 rounds without improvement
// Writes compositions/<shot>.html (best), autobuild/<shot>/round-N.{html,json}, autobuild/log.jsonl.
// Lessons from reanimate (MIT): judge the middle of a move, not only its ends; fonts and canvas first; never lower
// a threshold; nothing may move that is still in the original, and the reverse.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const P = path.resolve(args.find(a => !a.startsWith('--')) ?? '');
if (!fs.existsSync(path.join(P, 'segments.md'))) { console.error('usage: node tools/reverse/autobuild.mjs reverse/<name>/rebuild [--shots=s01] [--iters=6]'); process.exit(1); }
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
const HF = path.join(ROOT, 'tools/reverse/node_modules/.bin/hyperframes');
const log = (...m) => console.log('[autobuild]', ...m);
const json = (out) => JSON.parse(out.slice(out.indexOf('{')));
const hf = (a, o = {}) => { const r = spawnSync(HF, a, { cwd: P, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 600000, ...o }); return r.stdout || r.stderr || ''; };

const index = fs.readFileSync(path.join(P, 'index.html'), 'utf8');
const video = index.match(/id="original-sound"[^>]*src="([^"]+)"/)[1];
const W = +index.match(/data-width="(\d+)"/)[1], H = +index.match(/data-height="(\d+)"/)[1];
const fps = +(index.match(/data-fps="([\d.\/]+)"/)?.[1] ?? '30').split('/').reduce((a, b) => a / b);
const shots = [...index.matchAll(/<div id="(s\d+)" data-composition-id="\1"[^>]*data-start="([\d.]+)" data-duration="([\d.]+)"/g)].map(m => ({ id: m[1], a: +m[2], d: +m[3] }));
const pick = opt.shots ? opt.shots.split(',') : shots.map(s => s.id);
const ITERS = +(opt.iters ?? 6), NS = +(opt.samples ?? 8);
const OUT = path.join(P, 'autobuild'); fs.mkdirSync(OUT, { recursive: true });

const SYSTEM = `You rebuild one shot of a video as a HyperFrames composition: plain HTML + CSS + inline SVG, animated by ONE paused GSAP 3 timeline. Output ONLY the complete file, no prose, no markdown fences. Exact format:
<template>
  <style> /* scope every selector under #<ID>-root */ </style>
  <div id="<ID>-root" data-composition-id="<ID>" data-width="${W}" data-height="${H}"> ...elements... </div>
  <script>
    (() => {
      const tl = gsap.timeline({ paused: true });
      // positions in seconds from the shot's start (0 = first frame of this shot)
      tl.progress(1).progress(0);
      window.__timelines["<ID>"] = tl;
    })();
  </script>
</template>
Hard rules: canvas is ${W}x${H} px, #<ID>-root is position:absolute; inset:0; overflow:hidden. Everything visible is a pure function of timeline time: no Date.now, Math.random (use a seeded mulberry32 if you need noise), timers, requestAnimationFrame, fetch, external images or fonts (system sans-serif / monospace only). Use tl.fromTo or tl.set, never tl.from. Use exact pixel positions and the measured hex colours. Typed text: reveal characters with tl.set on spans at measured times. Match WHERE things are, their SIZE, COLOUR, and WHEN they change. Do not animate anything that is still in the original. Prefer simple shapes that match the silhouettes and colours over detail you cannot see.`;

function sampleTimes(s) { const pad = Math.min(0.1, s.d / 10); return Array.from({ length: NS }, (_, i) => +(s.a + pad + (s.d - 2 * pad) * (i + 0.5) / NS).toFixed(3)); }
function sheetOfOriginal(s, times, file) {
  const tmp = path.join(OUT, s.id, 'ref'); fs.mkdirSync(tmp, { recursive: true });
  times.forEach((t, i) => spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', path.join(P, video), '-frames:v', '1', path.join(tmp, `${String(i).padStart(2, '0')}.png`)]));
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, '%02d.png'), '-vf', `scale=${Math.min(W, 640)}:-2,tile=${Math.min(4, NS)}x${Math.ceil(NS / 4)}:padding=6:color=white`, '-frames:v', '1', file]);
}
function score(times) {
  const out = hf(['diff', video, '.', '--at', times.join(','), '--json', '--worst', '2', '--out', path.join(OUT, '.diff')]);
  try { const d = json(out); return { mean: d.ssim?.mean ?? 0, p05: d.ssim?.p05 ?? 0, cell: d.ssim?.cell_p05 ?? 0, missing: d.missing_content?.share ?? null, worst: (d.worst ?? []).map(w => ({ t: w.t, cell: w.cell?.roi, ssim: w.cell?.ssim })) }; }
  catch { return { mean: 0, p05: 0, cell: 0, error: out.slice(-400) }; }
}
function pairSheet(times, file) {
  const dir = path.join(OUT, '.snap'); fs.rmSync(dir, { recursive: true, force: true });
  hf(['snapshot', '.', '--at', times.join(','), '--no-end', '--against', video, '--output', dir, '--json']);
  const pairs = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^pair-\d+/.test(f)).sort() : [];
  if (!pairs.length) return null;
  pairs.forEach((f, i) => fs.copyFileSync(path.join(dir, f), path.join(dir, `p${String(i).padStart(2, '0')}.jpg`)));
  const cols = 2, rows = Math.ceil(pairs.length / cols);
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'p%02d.jpg'), '-vf', `scale=900:-2,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', file]);
  return fs.existsSync(file) ? file : null;
}
function ask(prompt, files, out) {
  const r = spawnSync('node', [path.join(ROOT, 'tools/deepseek/ask.mjs'), prompt, ...files.map(f => `--file=${f}`), `--model=${opt.model ?? 'deepseek-flash'}`, `--system=${SYSTEM}`, `--out=${out}`, '--max=60000', '--task=autobuild'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status) throw new Error('deepseek failed: ' + r.stderr.slice(-300));
  let h = fs.readFileSync(out, 'utf8').replace(/^```[a-z]*\n?|```\s*$/gm, '').trim();
  const a = h.indexOf('<template>'), b = h.lastIndexOf('</template>');
  if (a < 0 || b < 0) throw new Error('no <template> in answer');
  return h.slice(a, b + 11) + '\n';
}

const breakdown = (() => { try { return JSON.parse(fs.readFileSync(path.join(P, '..', 'breakdown.json'), 'utf8')); } catch { return null; } })();
for (const s of shots.filter(x => pick.includes(x.id))) {
  const dir = path.join(OUT, s.id); fs.mkdirSync(dir, { recursive: true });
  const comp = path.join(P, 'compositions', `${s.id}.html`);
  const times = sampleTimes(s), local = times.map(t => +(t - s.a).toFixed(3));
  const refSheet = path.join(dir, 'original.jpg'); sheetOfOriginal(s, times, refSheet);
  const grid = hf(['measure', 'look', video, '--grid', '8x6', '--at', String(times[Math.floor(NS / 2)])]);
  const colours = breakdown?.shots?.find(x => Math.abs(x.start - s.a) < 0.05)?.colours ?? [];
  let best = { html: fs.readFileSync(comp, 'utf8'), ...score(times), round: 0 };
  const hist = [{ round: 0, mean: best.mean, cell: best.cell }];
  log(`${s.id} ${s.d}s · baseline SSIM ${best.mean.toFixed(3)} cell ${best.cell.toFixed(3)}`);
  let stale = 0;
  for (let k = 1; k <= ITERS; k++) {
    const pair = pairSheet(times, path.join(dir, `pair-${k - 1}.jpg`));
    const prompt = `Shot ID: ${s.id}. Length ${s.d.toFixed(3)} s at ${fps} fps, canvas ${W}x${H}.
Image 1 (original.jpg): the ORIGINAL at these shot-relative times, left to right, top to bottom: ${local.join(', ')} s.
${pair ? 'Image 2: YOUR current render beside the original at the same times (render | reference pairs).' : ''}
Dominant colours of the shot: ${colours.join(', ')}.
Mean colour per cell (8x6 grid, mid-shot) as measured: ${grid.replace(/\s+/g, ' ').slice(0, 2500)}
Score history (SSIM 0..1, higher is better; pass = mean >= 0.92 and worst-cell p05 >= 0.75): ${JSON.stringify(hist)}
Worst moments now: ${JSON.stringify(best.worst ?? [])} (cell = [x, y, w, h] in pixels).
Current best composition:
${best.html}
Improve it to match the original frame by frame. First fix the large areas (background, big shapes, their colours and positions), then timing of appearances, then detail. Return the full new file.`;
    let html;
    try { html = ask(prompt, [refSheet, ...(pair ? [pair] : [])], path.join(dir, `round-${k}.raw.txt`)); }
    catch (e) { log(`${s.id} round ${k}: ${e.message}`); stale++; if (stale >= 2) break; continue; }
    fs.writeFileSync(path.join(dir, `round-${k}.html`), html);
    fs.writeFileSync(comp, html);
    const sc = score(times);
    fs.writeFileSync(path.join(dir, `round-${k}.json`), JSON.stringify(sc, null, 1));
    hist.push({ round: k, mean: +sc.mean.toFixed(4), cell: +sc.cell.toFixed(4) });
    fs.appendFileSync(path.join(OUT, 'log.jsonl'), JSON.stringify({ shot: s.id, round: k, ...sc }) + '\n');
    const better = sc.mean > best.mean + 0.002;
    log(`${s.id} round ${k}: SSIM ${sc.mean.toFixed(3)} cell ${sc.cell.toFixed(3)} ${better ? '↑ kept' : '· reverted'}${sc.error ? ' ERROR ' + sc.error.slice(0, 120) : ''}`);
    if (better) { best = { html, ...sc, round: k }; stale = 0; } else { fs.writeFileSync(comp, best.html); stale++; }
    if (best.mean >= 0.92 && best.cell >= 0.75) { log(`${s.id} passes`); break; }
    if (stale >= 2) { log(`${s.id}: two rounds without improvement, stopping`); break; }
  }
  fs.writeFileSync(comp, best.html);
  pairSheet(times, path.join(dir, 'final-pair.jpg'));
  log(`${s.id} best: round ${best.round}, SSIM ${best.mean.toFixed(3)}, cell ${best.cell.toFixed(3)}`);
}
