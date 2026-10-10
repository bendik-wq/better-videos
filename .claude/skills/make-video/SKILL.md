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
- Chunks are cached per settings in `out/chunks-<hash>`; the hash covers code (every `engine/*.js`,
  `stage.html`, `engine/vendor/**`, the project's `.js` and `assets/**`), timeline, backend, AA,
  render scale, fps, shutter and encode/finish settings, so changing any of them re-renders.
- Smoothness: final episodes render at `fps: 60` with no shutter (about 2.5 h for 16 min on
  4 vCPU, ~1.85x the cost of 30 fps). A shutter blur at 30 fps costs as much as native 60 and
  looks less smooth; use it only for a 30 fps deliverable.
- `settings` lives at the top level of `project.json` / `project.mjs`:
  `settings: { fps: 60, aa: 'fxaa', renderScale: 1, workers: 3 }`.
- Scene code: anything that accumulates per frame (trails, smear decay) must scale with fps, e.g.
  `Math.pow(trails, 30 / fps)`, or it gets shorter in seconds at 60 fps.

## Cinematic toolkit (opt-in per set; sets without it render exactly as before)
Demo: `projects/fx-test` (library aisle rack focus + AO + god rays, follow-through walk, two
archive-photo parallax moves). Costs below are llvmpipe, 1080p, 4 vCPU, on a 263 ms base frame.
- **Lens and camera, `engine/cine.js`.** `C.lens(camera, mm)` (full-frame 16:9, `C.mmToFov`,
  `C.fovToMm`, `C.frameDistance(size, mm, fill)`). `C.path(keys, { duration, accel, decel, vIn,
  vOut, carry, float })` is the C1 rig: chord-length Hermite through `{pos, look, mm|fov}` keys
  plus one ease-in/ease-out velocity profile over the whole shot, so there are no speed pops at
  keys. Velocity carry-over on match cuts: build the outgoing rig with `duration` (and `vOut` if it
  should leave moving), then the incoming one with `{ duration: shot.duration, carry: outgoingRig }`;
  it enters at exactly the outgoing exit speed. `rig.velocity(p)`, `rig.exit()`.
  Presets (lens in mm): `C.moves.slowPush / pullBack / float / orbitReveal / truck({ target, mm,
  size|dist, az, el, ... })` and `C.moves.followThrough({ subject: t => [x,y,z], mm, offset, lag,
  overshoot })`. Handheld stays `K.handheld` (low-frequency only); keep `float` <= 0.03 here.
- **Characters.** `C.preload(renderer, { characters: ['UAL'] })`, `C.character('UAL', { clip:
  'Walk_Loop' })`: Quaternius UAL mannequin, CC0, 43 clips (`ch.clips`). `ch.blend([[clip, time,
  weight], ...])` crossfades purely in t. Pass a matte material (roughness ~0.85, near-black) for
  the silhouette look; the default glossy one reads as a game. Mixamo pose names alias to UE bones,
  but axes differ, so re-tune pose angles.
- **Post, `engine/post.js`.** `const fx = P.post(ctx, scene, camera, { ao, dof, rays, lens,
  quality, tone, hdr })`, then keep calling `renderer.render(scene, camera)`: stage.html routes it
  through the chain, and FXAA and the 2D compositors keep working. In `update`: `fx.focus(d)`,
  `fx.focusOn(obj)`, or a rack with `fx.focus(P.rack(t, [[0, near], [2.2, near], [3.5, far]]))`
  (eased in dioptres). `dof: { fstop: 2, mm: 35, bokeh: 4 }` derives the focus range from a thin
  lens. `rays: { light: bulbMesh }`, `lens: 'subtle' | 'vintage'`. The chain does its own ACES tone
  map; grain, halation and vignette stay in the ffmpeg finish.
  Measured adds per frame: DOF +240 ms (`low`, half-res) / +570 ms (`high`); N8AO +210 (`low`,
  half-res) / +240 (`medium`) / +440 (`high`); god rays +110; lens distortion + CA +45; chain
  overhead +11. Whole stack: `draft` +230 (no AO), `low` +470, `high` +1065 ms.
  `quality` defaults to `draft` under `--draft`, else `low`. `STAGE_QS='&postq=off'` turns
  every set's post off for a fast look-dev pass.
- **Archive photo parallax, `engine/parallax.js` + `engine/depth.py`.** Put PD/licensed photos in
  `projects/<p>/assets/archive/*.jpg` with a `SOURCES.md`, then run `python3 engine/depth.py
  projects/<p>` (Depth Anything V2 **Small** only, Apache-2.0; about 6-20 s per photo on CPU,
  cached; writes and commits `archive/depth/<stem>.depth.png|plate.jpg|json`). In the set: `const
  ph = await PX.photo(scene, '/projects/<p>/assets/archive/x.jpg', { mm: 50, depth: 0.5, center:
  [u, v], treatment: 'bw'|'sepia'|'selenium'|'slide', layers: 0|N })`, then `const move =
  PX.moves.push|pull|lateral|rise(ph, { amount, opts: { duration } })` and `move(camera, p, t)`.
  The edges where objects separate in depth are handled by fading stretched triangles over an
  inpainted background plate. Keep moves small (the defaults). Cost is about the same as a plain
  frame (~240 ms). Don't put a photo set through `post` with ACES unless you want its tones changed
  (use `tone: 'linear'`).

## Gotchas
- Call `camera.updateMatrixWorld()` before projecting (`K.toScreen` does it).
- Overlay layers are hidden unless active; position with `window.innerHeight / 1080`.
- CPU WebGL (llvmpipe): keep shadow-casting lights to 1–2 per set and use instancing for crowds.
- Determinism: chunks render in any order on any worker, each warmed up on the frame before it.
  Everything a frame shows must be a function of its time (no `Math.random`, no wall clock).
- YouTube can't be downloaded from the cloud box; ask the user for files or cookies.
- Fact-check every number in the VO and show a source caption.
