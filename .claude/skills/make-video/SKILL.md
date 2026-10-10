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
4. Draft: `--draft` (960x540 at 12fps). Final: no flags (1920x1080), plus `--workers=2` or `3`
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
- Chunks are cached per settings in `out/chunks-<hash>`; the hash covers code, timeline,
  backend, AA, render scale and encode/finish settings, so changing any of them re-renders.
- `settings` lives at the top level of `project.json` / `project.mjs`:
  `settings: { aa: 'fxaa', renderScale: 1 }`.

## Gotchas
- Call `camera.updateMatrixWorld()` before projecting (`K.toScreen` does it).
- Overlay layers are hidden unless active; position with `window.innerHeight / 1080`.
- CPU WebGL (llvmpipe): keep shadow-casting lights to 1–2 per set and use instancing for crowds.
- Determinism: chunks render in any order on any worker, each warmed up on the frame before it.
  Everything a frame shows must be a function of its time (no `Math.random`, no wall clock).
- YouTube can't be downloaded from the cloud box; ask the user for files or cookies.
- Fact-check every number in the VO and show a source caption.
