#!/usr/bin/env node
// REBUILD: our own, fully local equivalent of HyperFrames' Pro "reverse" (rebuild any video as an editable HTML/GSAP
// composition). Their `reverse start` only asks HeyGen's server for a licence/session (no video goes up, nothing comes
// back but a plan); every real step is local open-source code. This scaffolder does those steps without the server:
//
//   node tools/reverse/rebuild.mjs <video> [--name=slug] [--from=a --to=b]
//
// 1. measures the video (tools/reverse/reverse.mjs) unless reverse/<name>/breakdown.json exists
// 2. `hyperframes init --video` (local), then makes it safe: no publish script, our CLAUDE.md, GSAP vendored
// 3. one composition per shot, frame-exact (frame ÷ fps, rounded down), on the original's canvas and fps, with the
//    original's soundtrack as one <audio>; each shot starts as a flat fill of its dominant colour (a diff baseline)
// 4. refs/: the original's first, middle and last frame of every shot, for the builder to read (never played)
// 5. segments.md (## S01 · a–b s, Pixels: rebuilt) and REBUILD.md (the per-shot checklist and the diff loop)
// Then an agent rebuilds shot by shot and scores with the free local `hyperframes diff` (SSIM, missing content, cuts).
// Study and remix only: never publish a rebuild of someone else's video. Guide: .claude/skills/reverse-video.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const src = args.find(a => !a.startsWith('--'));
if (!src) { console.error('usage: node tools/reverse/rebuild.mjs <video> [--name=slug] [--from=s --to=s]'); process.exit(1); }
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
const HF = path.join(ROOT, 'tools/reverse/node_modules/.bin/hyperframes');
if (!fs.existsSync(HF)) { console.error('run `npm i` in tools/reverse first'); process.exit(1); }
const log = (...m) => console.log('[rebuild]', ...m);
const name = (opt.name ?? path.basename(src, path.extname(src))).replace(/[^\w.-]/g, '_');
const dir = path.join(ROOT, 'reverse', name), video = path.resolve(src);

// 1. measurements
if (!fs.existsSync(path.join(dir, 'breakdown.json'))) {
  log('measuring first'); const r = spawnSync('node', [path.join(ROOT, 'tools/reverse/reverse.mjs'), video, `--name=${name}`], { stdio: 'inherit', env });
  if (r.status) process.exit(r.status);
}
const B = JSON.parse(fs.readFileSync(path.join(dir, 'breakdown.json'), 'utf8'));
const { width: W, height: H, fps } = B.probe;
const fpsText = JSON.parse(execFileSync(HF, ['measure', 'probe', video], { env, encoding: 'utf8' }).replace(/^[^{]*/, '')).fps_text;
const from = +(opt.from ?? 0), to = +(opt.to ?? B.probe.duration);
const fl = (t) => Math.floor(Math.round(t * fps) / fps * 1e6) / 1e6; // frame-exact seconds, rounded down
const shots = B.shots.filter(s => s.end > from && s.start < to).map((s, i) => ({ ...s, id: `s${String(i + 1).padStart(2, '0')}`, a: fl(Math.max(s.start, from)), b: fl(Math.min(s.end, to)) }));
log(`${shots.length} shots, ${from}–${to} s, ${W}x${H} @ ${fpsText}`);

// 2. project
const P = path.join(dir, 'rebuild');
if (fs.existsSync(P)) { console.error(`[rebuild] ${P} exists; delete it or pick another --name`); process.exit(1); }
execFileSync(HF, ['init', 'rebuild', '--video', video, '--keep-original', '--skip-transcribe', '--skip-skills', '--non-interactive'], { cwd: dir, env, stdio: 'ignore' });
const pkg = JSON.parse(fs.readFileSync(path.join(P, 'package.json'), 'utf8')); delete pkg.scripts.publish;
pkg.scripts.diff = `npx --yes hyperframes@0.9.19 diff ${path.basename(video)} . --segments segments.md`;
fs.writeFileSync(path.join(P, 'package.json'), JSON.stringify(pkg, null, 2));
fs.rmSync(path.join(P, 'AGENTS.md'), { force: true });
fs.writeFileSync(path.join(P, 'CLAUDE.md'), `# Rebuild study: ${name}\nOur own local reverse (tools/reverse/rebuild.mjs). Read REBUILD.md first.\n- Free local commands only: measure, diff, check, lint, snapshot, render. Never publish, cloud, reverse, templates, auth/login or media-use generate. Telemetry stays off.\n- Never play the original's whole frame; refs/ are for reading only.\n- A study: never publish or upload this rebuild. Our own work takes techniques, never the creator's art, characters, voice, logo or name.\n`);
fs.mkdirSync(path.join(P, 'assets/vendor'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'projects/hf-test/assets/vendor/gsap.min.js'), path.join(P, 'assets/vendor/gsap.min.js'));
fs.mkdirSync(path.join(P, 'compositions'), { recursive: true }); fs.mkdirSync(path.join(P, 'refs'), { recursive: true });

// 3. compositions: one per shot
for (const s of shots) {
  const bg = s.colours?.[0] ?? '#808080', d = +(s.b - s.a).toFixed(6);
  fs.writeFileSync(path.join(P, 'compositions', `${s.id}.html`), `<template>
  <style>
    #${s.id}-root { position: absolute; inset: 0; overflow: hidden; background: ${bg}; }
  </style>
  <!-- ${s.id}: original ${s.a}–${s.b} s (${d} s). refs/${s.id}-in.jpg · -mid · -out. Said: ${s.said.replace(/--/g, '—').slice(0, 300)} -->
  <div id="${s.id}-root" data-composition-id="${s.id}" data-width="${W}" data-height="${H}">
    <!-- rebuild every layer here: backdrop, cards, text (size from ink), sub-assets cut with measure extract -->
  </div>
  <script>
    (() => {
      const tl = gsap.timeline({ paused: true });
      // times are seconds from this shot's start; use fromTo, never from; everything a function of time
      tl.progress(1).progress(0);
      window.__timelines["${s.id}"] = tl;
    })();
  </script>
</template>
`);
  for (const [tag, t] of [['in', s.a + 0.5 / fps], ['mid', (s.a + s.b) / 2], ['out', s.b - 1.5 / fps]])
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(Math.max(0, t)), '-i', video, '-frames:v', '1', '-q:v', '3', path.join(P, 'refs', `${s.id}-${tag}.jpg`)]);
}
const hosts = shots.map((s, i) => `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${+(s.a - from).toFixed(6)}" data-duration="${+(s.b - s.a).toFixed(6)}" data-track-index="${1 + (i % 2)}" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`).join('\n');
fs.writeFileSync(path.join(P, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${+(fl(to) - fl(from)).toFixed(6)}" data-width="${W}" data-height="${H}" data-fps="${fpsText}">
${hosts}
      <audio id="original-sound" class="clip" src="${path.basename(video)}" data-start="0" data-media-start="${fl(from)}" data-duration="${+(fl(to) - fl(from)).toFixed(6)}" data-track-index="9" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);

// 4. segments for diff, and the plan
fs.writeFileSync(path.join(P, 'segments.md'), shots.map(s => `## ${s.id.toUpperCase()} · ${+(s.a - from).toFixed(3)}–${+(s.b - from).toFixed(3)} s\nPixels: rebuilt\n`).join('\n'));
fs.writeFileSync(path.join(P, 'REBUILD.md'), `# Rebuild: ${name} (${from}–${to} s)

Scaffolded by \`tools/reverse/rebuild.mjs\`, our local equivalent of HyperFrames' Pro reverse (no HeyGen, no sign-in).
Original: \`${path.basename(video)}\` · ${W}×${H} · ${fpsText} fps · ${shots.length} shots. Measurements: \`../REVERSE.md\`, \`../breakdown.json\`.

## Loop, per shot
1. Read \`refs/<id>-in|mid|out.jpg\`, then consecutive frames at every change:
   \`hyperframes measure frames ${path.basename(video)} --range a,b --width 480\` (add \`--roi x,y,w,h\` for one element).
2. Rebuild every layer in \`compositions/<id>.html\`: backdrop (\`measure look --grid 8x6 --at t\`), cards and UI in HTML,
   text sized from ink (\`measure ink --at t --roi …\`, then letter-spacing), moves timed with \`measure curve\`,
   photos/clips/logos cut on their own box (\`measure extract --at t --roi …\`). Never the whole original frame.
3. Check without rendering: \`hyperframes diff ${path.basename(video)} . --at t1,t2,t3\`. Fix the worst cell it names.
4. When every shot has content: \`hyperframes check\`, then \`hyperframes render -o out.mp4\` and
   \`hyperframes diff ${path.basename(video)} out.mp4 --segments segments.md --sbs\`. Pass: mean SSIM ≥ 0.92, p05 ≥ 0.85,
   worst-cell p05 ≥ 0.75, no missing cuts, no missing structure. Render + diff once more after fixes, then stop.
5. Painted/animated shots: decide per shot what code carries (text, logos, light, a camera over a still world from
   clean plates) and what it can't (a character acting, morphing art). Mark the latter \`Pixels: regenerated\` in
   segments.md; we have no paid generator, so note it and move on, or rebuild it in our own style.

## Shots
| id | in–out (s) | len | top colours | said |
|---|---|---|---|---|
${shots.map(s => `| ${s.id} | ${s.a}–${s.b} | ${(s.b - s.a).toFixed(2)} | ${(s.colours ?? []).slice(0, 3).join(' ')} | ${s.said.slice(0, 120).replace(/\|/g, '/')} |`).join('\n')}

## Hand-over
Write what is rebuilt, what is approximate (substituted fonts), and the last diff's numbers here. Then list the
techniques worth taking into our own style, with the frame-exact numbers (durations, eases, sizes, cut timing).
`);
log('done →', P);
