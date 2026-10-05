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
4. Draft: `--draft` (960x540 at 12fps). Final: no flags (1920x1080 at 24fps), about 2–4 render-fps.
5. Deliver `projects/<name>/out/<name>.mp4`. `out/` is git-ignored, so copy deliverables to `renders/`.

## Gotchas
- Call `camera.updateMatrixWorld()` before projecting (`K.toScreen` does it).
- Overlay layers are hidden unless active; position with `window.innerHeight / 1080`.
- SwiftShader WebGL: keep shadow-casting lights to 1–2 per set and use instancing for crowds.
- YouTube can't be downloaded from the cloud box; ask the user for files or cookies.
- Fact-check every number in the VO and show a source caption.
