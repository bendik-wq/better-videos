# revid: reverse-engineer any video into an editable project that renders back 1:1

## The promise, stated honestly
"1:1 verbatim" for **any** video is reachable only as a **hybrid**. Hand-written code cannot redraw a painted
character acting or photographic footage pixel for pixel; HyperFrames' Pro product doesn't either (it cuts those
from the original and generates the rest). So revid decomposes each shot into layers and models what it can:

- **plate**: the static background of the shot (temporal median, after removing camera motion)
- **sprites**: moving elements cut from the original with alpha, plus a per-frame transform (x, y, scale, rotation,
  opacity) fitted to keyframes and easing curves → editable motion
- **text**: OCR'd words with position, size and reveal timing (metadata now, live text later)
- **baked**: whatever the model can't explain (non-rigid acting, morphs, particles) as per-frame RGBA crops
- **residual**: the per-pixel difference that remains, so the output is always verbatim

Every run reports **fidelity** (PSNR/SSIM of the rebuild vs the original) and **understanding**: the share of
pixels × frames carried by plate + sprites + text, against baked + residual. "1 out of 1" means fidelity passes on
every video. Understanding is the number we push up over time.

## Pipeline
```
ingest   URL → yt-dlp / Monid → CFR mp4 · probe · audio
shots    cuts (hyperframes measure cuts) → frame ranges
camera   per-frame global affine (ECC, translation→affine) → stabilised frames
plate    masked temporal median of stabilised frames
fg       |frame − plate| > τ, morphology → components → tracks (IoU + centroid, gap-tolerant)
element  key frame (largest, least occluded) → RGBA sprite; per frame: ECC similarity fit sprite→frame,
         opacity by least squares; residual SSIM per frame; rigid if ≥ 0.95 else baked sequence
motion   per-property series → keyframes: fitEasing (25 cubic-beziers, free duration k∈[1,2], rmse<0.03),
         spring/back when overshoot > 2 %, else hold per-frame values
text     OCR (RapidOCR) on sprites and plate → words, boxes, first-visible frame per char (typed reveals)
scene    scene.json: canvas, shots, plate, layers (sprite | text | baked), keyframes, residual
render   (a) compositor.py: numpy, exact, fast → verify; (b) HyperFrames project → edit and re-render
verify   per shot PSNR/SSIM + per-element SSIM; failing regions → baked/residual; report.md
```

## Benchmark (how we know it works)
`bench/`: synthetic motion-graphics videos with **known ground truth** (shapes, sprites, eased moves, scale and
rotation, fades, a camera pan, typed text, a non-rigid blob, grain). Score: fidelity, understanding, and parameter
recovery error (keyframe times ±1 frame, position ±1 px, easing family). Plus two real clips (our ep10, a
Kurzgesagt segment: private study, never published).

## Who does what
**DeepSeek (grunt work):** benchmark generator, unit tests and fixtures, CLI glue, README, HyperFrames emitter
boilerplate, first-pass reading of frames, code-fix rounds in the autobuild loop.
**Claude:** architecture, the decomposer and compositor maths, judging every DeepSeek output, the verify gates.

## Rules
Others' videos: private study only, never published or uploaded. No HeyGen, no sign-in. Keys never in the repo.
