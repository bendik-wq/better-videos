---
name: make-video
description: Build or edit a documentary video in this repo (3D scenes, narration, score, film finish). Use for any request to make, change, extend or re-render a video, scene, shot or style test.
---

# Making a video

Read `docs/style-bible.md` first; it is the user's taste, encoded. `docs/fern-breakdown.md`
explains the reference and where we're trying to beat it.

## Layout
- `engine/render.mjs`: narration-first renderer (Piper VO → timing → frames in headless
  Chromium → score → film finish → mp4).
- `engine/stage.html`: page that hosts a scene, with fonts and import map.
- `engine/kit.js`: shared parts: easing, `handheld`, `voidStage`, `keySpot`, `lightShaft`
  (ray-marched), `dust`, `container`, `markerLoop`, `leader`, `toScreen`, `typeOn`.
- `engine/score.py`: procedural drone and sound-design cues.
- `projects/<name>/project.json`: shots, VO lines, voice, finish, score cues.
- `projects/<name>/scene.js`: one "set" per shot id: `{ scene, camera, update(t, p, shot), trails?, step? }`.

## Workflow
1. Write the VO into `project.json` shots first. Timing comes from the narration.
2. Build or modify sets in `scene.js`. Keep overlays deterministic: set every style in
   `update`, and use no CSS animations.
3. Look-dev: `node engine/render.mjs projects/<name> --stills=0.3,0.9 [--only=shotId]`, then
   montage the PNGs from `out/stills/` and inspect them before any full render.
4. Draft: `--draft` (960x540 at 12fps). Final: no flags (1920x1080; 3 workers by default)
   on a 4-core box. A partial render: `--only=firstId,lastId` renders that contiguous range.
5. Deliver `projects/<name>/out/<name>.mp4`. `out/` is git-ignored, so copy deliverables to `renders/`.

## Render speed flags
Defaults are the fast path; see `docs/research/render-speed.md` for the measurements.
- `--gl=llvmpipe|swiftshader` (or `BV_GL=swiftshader`): WebGL backend. Default is Mesa llvmpipe
  via ANGLE `gl-egl` on surfaceless EGL (needs `apt-get install -y libegl1 libegl-mesa0
  libgl1-mesa-dri`). The log prints `[gl] llvmpipe: ...`; a loud WARNING means it fell back to
  SwiftShader (3-10x slower). Fix the Mesa install rather than ignoring it.
- `--aa=fxaa|msaa|none` or `settings.aa` in the project file. Default `fxaa` (one post pass,
  ~10-18 ms/frame). `msaa` is 4x MSAA and costs 25-490 ms/frame on CPU, worst on dense geometry.
- `--render-scale=0.667` or `settings.renderScale`: GL renders smaller and is upscaled; DOM
  overlays stay at full res. Good for drafts and heavy shots. Scenes that copy the GL canvas into
  a 2D comp canvas must use `cx.drawImage(gl, 0, 0, width, height)`, never `drawImage(gl, 0, 0)`.
- `--finish=chunk|pass`: `chunk` (default) applies the film finish inside each chunk encode
  (x264 veryfast crf 18 `-tune grain`, override with `settings.preset` / `settings.crf`), so the
  master is a stream copy plus audio. `pass` is the old path: ultrafast crf 12 intermediates,
  then one whole-film finish pass.
- `--look=fast|reference` (`settings.look`): `fast` (default) computes halation and bloom at
  quarter resolution and does the full-res work in YUV (~20 CPU-ms/frame); `reference` is the
  original full-res RGB chain (~125 ms/frame). Same look (PSNR ~44 dB); use `reference` only to A/B.
- `--fps=60` (`settings.fps`, else `project.fps`): output frame rate, end to end. The timeline,
  word cues and score are in seconds, so nothing else changes. GOP is half a second (YouTube spec).
- `--shutter=180 [--samples=2]` (`settings.shutter`, `settings.shutterSamples`): motion blur.
  Each output frame averages N renders spread over the open shutter (sample 0 at the frame time,
  never across a cut). Costs N x the render time per frame; the finish/encode cost is unchanged.
  `--shutter=360 --samples=2` at 30 fps is exactly "render 60, blend pairs to 30".
- Chunks: `--chunk-seconds=5` (`settings.chunkSeconds`). Cut on a shot boundary near the target,
  else mid-shot at least `settings.cutGuard` (1 s) after a shot start, with `settings.warmup`
  frames of warm-up (default fps/4). A pool of `--workers=N` (`settings.workers`, default 3)
  persistent browsers pulls chunks from a queue; a crashed worker's chunk is requeued.
- Resume: chunks are final mp4s in `out/chunks-<hash>`, renamed into place only when complete. After
  a crash or a container restart just run the same command again. `--status` prints progress, rate,
  ETA, per-worker state and the exact resume command (from `out/progress.json`). For long renders,
  start it detached: `nohup node engine/render.mjs projects/<name> > projects/<name>/out/render.log 2>&1 &`.
- Chunks are cached per settings in `out/chunks-<hash>`; the hash covers code (every `engine/*.js`
  and `stage.html`, the project's `.js`), timeline, backend, AA, render scale, fps, shutter and
  encode/finish settings, so changing any of them re-renders.
- `settings` lives at the top level of `project.json` / `project.mjs`:
  `settings: { fps: 60, aa: 'fxaa', renderScale: 1, workers: 3 }`.
- Scene code: anything that accumulates per frame (trails, smear decay) must scale with fps, e.g.
  `Math.pow(trails, 30 / fps)`, or it gets shorter in seconds at 60 fps.

## Gotchas
- Call `camera.updateMatrixWorld()` before projecting (`K.toScreen` does it).
- Overlay layers are hidden unless active; position with `window.innerHeight / 1080`.
- CPU WebGL (llvmpipe): keep shadow-casting lights to 1–2 per set and use instancing for crowds.
- Determinism: chunks render in any order on any worker, each warmed up on the frame before it.
  Everything a frame shows must be a function of its time (no `Math.random`, no wall clock).
- YouTube can't be downloaded from the cloud box; ask the user for files or cookies.
- Fact-check every number in the VO and show a source caption.
