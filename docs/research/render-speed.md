# Render speed: where the time goes and how to get ~10x

Research and measurements for `engine/render.mjs`, which runs Three.js r169 in headless Chromium
under Playwright, CPU only, with no GPU in the cloud container. Written 2026-10-10.

Tags: **[measured]** = timed in this container (4 vCPU, 15 GB RAM, Chromium 1194 from
Playwright, Mesa 25.2.8, ffmpeg 6.1.1); **[primary]** = the project's own README, docs or
release notes; **[secondary]** = a third-party write-up; **[estimate]** = our own inference.

The profiling scripts live outside the repo, in the session scratchpad (`prof.mjs`, `e2e.mjs`,
`stage-x.html`, `long.sh`). The plan in section 6 says how to land each change in the engine.

---

## TL;DR

1. **Software WebGL is the bottleneck, not ffmpeg and not the screenshot.** Per frame at
   1080p, the synced `__frame()` draw takes 120 ms to 2,800 ms under SwiftShader, depending on
   the shot. Capture takes 95-190 ms. The x264 chunk encode costs about 85 CPU-ms. **[measured]**
2. **4x MSAA is the single worst cost on heavy shots.** On the canyon shot it took the frame
   from 138 ms to 841 ms under llvmpipe. **[measured]**
3. **Swap SwiftShader for Mesa llvmpipe** (ANGLE's `gl-egl` backend on a surfaceless EGL, no
   Xvfb needed). That gives 2-3.4x faster draws and faster capture, with output visually
   identical (PSNR 41-50 dB against SwiftShader). **[measured]**
4. Stacked quick wins (llvmpipe, headless shell, CDP capture with `optimizeForSpeed`, an
   `ultrafast` intermediate encode, MSAA off, GL at 2/3 resolution under a full-res DOM) took
   end-to-end throughput from **1,268 ms/frame to 87 ms/frame marginal (14.6x)**; 154.5 s to 17.9 s wall for 120 frames, including startup (8.6x) on a frame sample
   spread across *The Box*. **[measured]** Folding the film finish into the chunk encode
   removes another ~144 ms/frame serial pass (about an hour per 15-minute episode).
5. The "skill for fast rendering without FFmpeg" is almost certainly **Remotion's Agent Skills
   (`remotion-dev/skills`) together with `@remotion/web-renderer`**, which renders in the
   browser and encodes with WebCodecs through Mediabunny instead of FFmpeg. The other common
   candidate, **HeyGen HyperFrames**, does use FFmpeg. See section 4.

---

## 1. Where our time goes (measured)

### 1.1 Per-stage cost, SwiftShader baseline (the current engine config)

`prof.mjs` mirrors `openStage()` exactly (same Chromium binary, flags, viewport and
`__setup`). It reads `projects/the-box/out/timeline.json`, so voice synthesis doesn't run.
Each stage is timed separately. "Draw" forces the GPU work to finish by reading one pixel
back, so the number is honest. Medians come after 3 warm-up frames.

| Stage (1920x1080) | ms / frame |
|---|---|
| `__frame(t)` + WebGL draw, shot `object` (T=3 s) | 238-276 |
| same, shot `harbor` (T=12 s) | 546-560 |
| same, shot `numbers` (T=22 s) | 405 |
| same, shot `canyon` (T=32 s) | **2,818-2,828** |
| same, shot `title` (T=40 s) | 123-127 |
| `page.screenshot({type:'jpeg', quality:95})` (current) | 145-191 |
| `page.screenshot({type:'png'})` | 193 |
| CDP `Page.captureScreenshot` jpeg q95 `optimizeForSpeed:true` | 94-148 |
| `gl.readPixels` full frame, in the page only | 11 |
| RGBA to base64 in the page, the cost of getting raw pixels out over CDP | 100-110 |
| `canvas.toBlob('image/jpeg', 0.95)` in the page | 33-43 |
| ffmpeg mjpeg to x264 `medium` crf 15, batch, 4 threads (wall) | 128 |
| x264 `medium` crf 15, single thread (true CPU cost) | 85 |
| x264 `ultrafast` crf 15, single thread | 23 |
| Film finish filters alone, 1080p (one process, all cores) | 71 |
| Film finish + x264 `medium` crf 18 `-tune grain` (the final pass) | **144** |

At half resolution (960x540), the draw on the `object` shot fell from 276 ms to 90 ms and the
screenshot from 191 ms to 45 ms. The draw is fill-bound. **[measured]**

What this means:

- The screenshot path costs about the same for JPEG and PNG, so it isn't the encoder. It's
  Playwright's overhead plus compositor readback. Calling CDP directly with
  `optimizeForSpeed` halves it.
- `readPixels` itself is cheap (11 ms), but moving 8 MB of RGBA out of the page over CDP is
  not: base64 alone costs 100 ms. Raw RGBA to ffmpeg only pays off if the pixels leave the page
  through a binary channel (a WebSocket or `fetch` POST to our local server) or never leave at
  all (WebCodecs in the page). It also **drops the DOM/SVG overlay** (titles, labels, counters),
  which the engine relies on. In our end-to-end test it was slower than CDP JPEG (row I below).
- The final film-finish pass is a separate full decode, filter and encode at ~144 ms/frame. For
  27,000 frames (15 min at 30 fps) that's about **65 minutes of wall time** after rendering
  finishes. **[measured, extrapolated]**

### 1.2 Backend comparison (draw / capture, ms per frame, 1080p, median after warm-up)

| Shot | SwiftShader (current) | Lavapipe (ANGLE Vulkan) | **llvmpipe (ANGLE gl-egl)** |
|---|---|---|---|
| object T=3 | 238 / 131 | 440 / 141 | **101 / 71** |
| harbor T=12 | 546 / 144 | 532 / 142 | **159 / 80** |
| canyon T=32 | 2,828 / 148 | 1,200 / 162 | **832 / 90** |
| title T=40 | 123 / 147 | 109 / 96 | **64 / 82** |

Under chrome-headless-shell instead of the full Chrome binary, CDP capture on llvmpipe fell
further, to **43-56 ms**. **[measured]**

Quality check: frames rendered with SwiftShader and with llvmpipe compare at PSNR 49.8 dB /
SSIM 0.998 (harbor) and 41.3 dB / 0.990 (canyon). The differences are sub-pixel edge
antialiasing only, with no visible change. **[measured]**

`--use-angle=gl` and `--use-gl=egl` on their own silently fell back to SwiftShader. Only
`--use-angle=gl-egl`, with Mesa's EGL vendor library visible, picked up llvmpipe. Always assert
the renderer string. **[measured]**

### 1.3 Scene-level knobs on llvmpipe (draw ms; `stage-x.html` scratch copy, query toggles)

| Setting | object T=3 | harbor T=12 | canyon T=32 |
|---|---|---|---|
| current (MSAA 4x, PCFSoft shadows, pixel ratio 1) | 98 | 156 | 842 |
| `antialias:false` | 67 | 95 | **138** |
| pixel ratio 0.667 (GL 1280x720, CSS-scaled; DOM overlay stays 1080p) | 57 | 93 | 426 |
| both | **41** | **59** | **74** |
| both, with the scaled `drawImage` fix (correct image) | **35** | **55** | **61** |
| `PCFShadowMap` instead of `PCFSoftShadowMap` | 101 | 159 | 816 (no gain) |

Turning off MSAA needs a replacement for edge AA. Options: an FXAA/SMAA pass from
`three/addons/postprocessing`, which costs a few ms on llvmpipe **[estimate]**; or rendering at
pixel ratio 1.0 with no MSAA and letting the finish's bloom, halation and grain hide the
remaining jaggies. Check stills before adopting.

### 1.4 End-to-end throughput (3 workers on 4 vCPU, 120 frames sampled evenly across the whole timeline)

`e2e.mjs` runs the real loop (`__frame`, capture, x264 over stdin). Per-frame cost is
**marginal**: (wall at 120 frames - wall at 30 frames) / 90, which removes browser startup.

| Config | 120-frame wall (3 workers) | Marginal ms / frame | vs A |
|---|---|---|---|
| **A** current: SwiftShader, `page.screenshot` jpeg q95, x264 `medium` | 154.5 s | **1,268** | 1x |
| **E** llvmpipe (`gl-egl`) + headless shell + CDP `optimizeForSpeed` + x264 `ultrafast` | 42.1 s | **300** | 4.2x |
| **F** E + `antialias:false` | 21.0 s | **113** | 11.2x |
| **G** F + GL at pixel ratio 0.667 (DOM at 1080p)\* | 17.9 s | **87** | 14.6x |

\* *The Box* copies the GL canvas into a 2D "comp" canvas with `cx.drawImage(gl, 0, 0)`
(`projects/the-box/scene.js` around line 365). At a pixel ratio below 1 that call must become
`drawImage(gl, 0, 0, width, height)`, or the frame lands in the top-left corner. G was measured
with that one-line change in a scratch copy of the scene.

These numbers **do not include the film-finish pass** (~144 ms/frame, serial, after rendering).
Including it, the whole pipeline goes from ~1,412 to ~231 ms/frame (**~6x**). With the finish
folded into the parallel chunk encode (plan step 4), we expect **~10-14x** overall on
*The Box*. **[estimate from measured parts]**

Quality: F (MSAA off) against A scores PSNR 34.2 dB on the canyon frame. G scores 26.7 dB: the
same picture, a bit softer, with slightly more stair-stepping on panel edges. A crop
comparison showed no objectionable difference once the grain is on top. **[measured]**

Caveat on mix: the 120 samples are spread evenly over *The Box*'s 43 s, and the canyon shot
(2.8 s/frame on SwiftShader) is ~20% of them. Lighter shots gain less: the `title` shot goes
only 123 to 64 ms on draw. On a project of mostly light shots, expect roughly 3-5x from steps
1-3, with the finish pass becoming the largest remaining cost. **[measured / estimate]**

A 60-frame first pass, startup included, gave the same ranking: A 1,143, B (llvmpipe + CDP)
521, E 475, F 275, G 224 ms/frame (that G run predates the `drawImage` fix). Two workers matched three once the browser was llvmpipe
(llvmpipe already uses every core), and the raw `readPixels`-over-CDP path (I) came out at 355,
slower than CDP JPEG and without the overlay. **[measured]**

---

## 2. Candidate projects and techniques

Star counts are as shown on GitHub when fetched (October 2026). "Speedup" is per-frame
throughput on our workload unless stated otherwise.

### 2.1 Faster frame capture

| Candidate | Repo / source | Stars / activity | License | Speeds up | Expected speedup | Integration effort |
|---|---|---|---|---|---|---|
| **CDP `Page.captureScreenshot` + `optimizeForSpeed`** | [CDP docs](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot) | Chromium core | BSD | capture | 1.5-2x on capture (191 to 94 ms; 43 ms in headless shell) **[measured]** | Trivial: 3 lines in `renderChunks` |
| **chrome-headless-shell** (old headless) | ships with Playwright (`chromium_headless_shell-1194`) | Chromium core | BSD | capture, compositor | Capture 70-80 to 43-56 ms on llvmpipe **[measured]** | Trivial: change `executablePath` |
| `HeadlessExperimental.beginFrame` | [CDP docs](https://chromedevtools.github.io/devtools-protocol/tot/HeadlessExperimental/); wrapper [alexey-pelykh/puppeteer-capture](https://github.com/alexey-pelykh/puppeteer-capture) | wrapper: 22 stars | MIT | determinism, capture in the same round trip as the frame | No published benchmark. Saves one round trip per frame (~5-15 ms) **[estimate]**. Headless shell only; experimental API **[primary]** | Medium: create the target with `enableBeginFrameControl` and launch with `--deterministic-mode`/`--enable-begin-frame-control`. Our `__frame(t)` already makes us deterministic, so the gain is small |
| `Page.startScreencast` | CDP | core | BSD | capture | Not suitable: it is frame-rate-driven and drops or duplicates frames; no per-frame ack sync for offline rendering **[estimate]** | n/a |
| `canvas.toBlob` / `toDataURL` | Web API | n/a | n/a | capture | toBlob JPEG costs 33 ms in the page **[measured]**, but it is **canvas only** (no DOM overlay) and still needs a transfer channel | Medium |
| `gl.readPixels` to raw RGBA to ffmpeg stdin | n/a | n/a | n/a | capture | readPixels costs 5-11 ms **[measured]**. Over CDP base64 it is slower overall (row I). Only wins with a binary side channel, and it loses the overlay | Medium-high; overlay needs a separate solution |
| **WebCodecs `VideoEncoder` in the page + [Mediabunny](https://github.com/Vanilagy/mediabunny) / [mp4-muxer](https://github.com/Vanilagy/mp4-muxer)** | Vanilagy/mediabunny | 7.3k stars | MPL-2.0 | capture + encode (frames never leave the page) | Removes capture transfer and the x264 process. canvas-record reports WebCodecs "5-10x faster than H264MP4Encoder and 20x faster than FFmpeg" (that is ffmpeg.wasm) **[primary, [canvas-record](https://github.com/dmnsgn/canvas-record)]**. On our box VP9/AV1 work in software; **H.264 is unsupported in Playwright's Chromium** (no proprietary codecs) **[measured]**. Chrome-for-Testing or Chrome stable has H.264 **[estimate]** | Medium. Canvas only, so the DOM overlay must move into the canvas (see html-in-canvas) |
| html-in-canvas (`drawElementImage`, `layoutsubtree`/`drawable`) | [WICG explainer](https://github.com/WICG/html-in-canvas), [Chrome blog](https://developer.chrome.com/blog/html-in-canvas-ot-changes) | Chrome origin trial (150-155) | n/a | lets DOM overlays be drawn into the WebGL/2D canvas, which unlocks canvas-only capture | HyperFrames v0.7.38 made "drawElement fast capture" default on macOS GPU renders: "roughly 2x faster capture" **[primary, [release](https://newreleases.io/project/github/heygen-com/hyperframes/release/v0.7.38)]** | High; flag-gated and the API is still changing |
| [tungs/timecut](https://github.com/tungs/timecut) / timesnap | GitHub | 654 stars, low activity | BSD-3 | capture; virtual time | Canvas mode "often faster" than screenshots, no numbers **[primary]**. We already control time ourselves | Low value: our engine already does what it does |
| CCapture.js | [spite/ccapture.js](https://github.com/spite/ccapture.js) | old, unmaintained | MIT | in-page capture | Superseded by WebCodecs **[estimate]** | n/a |
| Remotion renderer | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | very active | Remotion License (free for individuals and small companies, paid above) | parallel tabs, headless shell, `--gl` options | Same per-frame mechanism as ours (screenshot per frame, then FFmpeg). Gains come from concurrency and Lambda fan-out **[primary, [GL docs](https://www.remotion.dev/docs/gl-options)]**. Its Rust compositor does video frame extraction for `<OffthreadVideo>`, not WebGL capture **[secondary, [DeepWiki](https://deepwiki.com/remotion-dev/remotion/4.4-compositor-system)]** | High (React rewrite) for little per-frame gain |
| `@remotion/web-renderer` | [docs](https://www.remotion.dev/docs/web-renderer/) | stable from v4.0.491 | Remotion License | no FFmpeg: rebuilds each frame from DOM geometry onto a canvas, encodes with WebCodecs via Mediabunny | No published benchmark. Only a subset of HTML/CSS is supported **[primary, [how it works](https://convert.remotion.dev/docs/client-side-rendering/how-it-works)]** | High; our Three.js plus DOM-overlay stage would need porting |
| Revideo / Motion Canvas | [redotvideo/revideo](https://github.com/redotvideo/revideo) (4.1k, MIT), [motion-canvas](https://github.com/motion-canvas/motion-canvas) (MIT) | active / slower | MIT | parallel workers (Revideo); image sequence or FFmpeg exporter (Motion Canvas) | No numbers published **[primary, [Motion Canvas rendering docs](https://motioncanvas.io/docs/rendering/video)]** | High; a different scene model (2D canvas) |
| **HeyGen HyperFrames** | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | ~60k stars shown, very active | Apache-2.0 | HTML to MP4, `--workers auto`, beginFrame capture, Lambda path, dedup | Seek per frame in headless Chrome, encode with FFmpeg **[primary]**. Uses BeginFrame **[secondary, [silenceper](https://silenceper.com/en/article/2026-05-02-hyperframes-html-video-rendering/)]**. One user reports about 2x from 3 workers on 4 vCPU **[secondary, [Vercel template](https://vercel.com/new/smolkar/templates/next.js/hyperframes-on-vercel)]** | High (new composition format). Worth borrowing ideas: frame dedup, batched drawElement capture |

### 2.2 Faster CPU WebGL than SwiftShader

| Candidate | Source | Speeds up | Expected speedup | Effort |
|---|---|---|---|---|
| **Mesa llvmpipe via ANGLE `--use-angle=gl-egl`** (surfaceless EGL) | Mesa (`libegl1`, `libegl-mesa0`); [Microlink write-up](https://microlink.io/blog/webgl-without-a-gpu) | draw and compositor | **2-3.4x on draw** **[measured]**. Microlink: 24 s to 6 s isolated (~4x), ~2x under load **[secondary]** | Low: install 2 packages (or vendor them), set 2 env vars, change 1 flag, assert the renderer string. Microlink needed Xvfb with `--use-angle=gl`; with `gl-egl` and `EGL_PLATFORM=surfaceless` we didn't **[measured]** |
| Lavapipe via ANGLE `--use-angle=vulkan` | `mesa-vulkan-drivers` | draw | Mixed: 0.5x to 2.4x vs SwiftShader **[measured]**. Slower than llvmpipe GL everywhere | Low, but not worth it |
| `--use-angle=swiftshader` + `--enable-unsafe-swiftshader` | current | baseline | 1x | n/a |
| headless-gl (stackgl) | [stackgl/headless-gl](https://github.com/stackgl/headless-gl) | Three.js in Node without a browser | WebGL2 is "experimental" **[primary]**. Three.js r169 is WebGL2-only, and we would lose the DOM overlay **[estimate]** | High; not recommended |
| node-canvas-webgl / Three.js in Node | various | same | Same blockers as headless-gl | High |

### 2.3 Parallelism, resolution and frame count

| Technique | Evidence | Expected speedup | Effort |
|---|---|---|---|
| **More workers** | With llvmpipe, 2 workers matched 3 on 4 vCPU; the box is CPU-saturated **[measured]** | ~1x more on this box. Only more cores help: chunking across machines (Remotion Lambda style) scales linearly **[estimate]** | Our chunk cache already supports it. Needs a remote runner |
| **GL at 2/3 resolution, DOM at full res** (`renderer.setPixelRatio(0.667)` with CSS at 1080p) | Draw fell 1.5-2x; text stays crisp because the compositor upsamples only the canvas **[measured]** | 1.2-1.5x end to end **[measured]** | One line in `stage.html`. Make it per project |
| Real-ESRGAN upscale on CPU | Docs: CPU inference "extremely slow"; no 1080p CPU number published **[primary, [FAQ](https://mintlify.com/xinntao/Real-ESRGAN/resources/faq)]** | Negative on CPU | n/a |
| ffmpeg `scale=flags=lanczos` from 1280x720 | cheap (~5 ms/frame) **[estimate]**, but blurs DOM text; the pixel-ratio trick above is strictly better | Prefer pixel ratio | n/a |
| Render at 24 fps instead of 30 | 20% fewer frames. *The Box* is already at 24 | 1.25x | Trivial (`project.fps`) |
| 12-15 fps + RIFE / `minterpolate` | RIFE is GPU-bound; no CPU benchmark exists **[secondary, [SVP wiki](https://svp-team.com/wiki/RIFE_AI_interpolation)]**. `minterpolate` is slow and warps type **[estimate]** | Negative or risky on CPU | Not recommended. Vox-style 12 fps graphics (`step`) are fine artistically |
| **Skip unchanged frames** (holds, static title cards, chapter cards) | HyperFrames ships a "dedup extension" **[primary, release notes]** | Depends on content: 1.1-1.5x for documentary pacing **[estimate]** | Medium: scene declares `static` for a time range, or hash the GL output plus overlay DOM state, and repeat the last JPEG |

### 2.4 Encoding and the finish

| Technique | Evidence | Expected speedup | Effort |
|---|---|---|---|
| **Intermediate chunks with x264 `ultrafast`** (they are re-encoded by the finish anyway) | 85 to 23 CPU-ms per frame **[measured]** | Frees ~60 CPU-ms/frame for rendering | One flag |
| **Apply the film finish in the chunk encoders** instead of a second whole-film pass | Finish + encode costs 144 ms/frame serially **[measured]** | Removes ~1 h per 15-min episode, and the work runs across the parallel workers | Low-medium. Watch for grain seed and chunk-boundary consistency (temporal noise is per-frame anyway) |
| Finish as a WebGL post pass in the page (halation, bloom, grain, vignette shaders) | Downsampled blurs on llvmpipe are a few ms **[estimate]** | Removes ffmpeg's 71 ms filter cost entirely | Medium. Match the look against the ffmpeg reference stills |

### 2.5 GPU fallback

| Option | Evidence | Notes |
|---|---|---|
| Cloud GPU (RTX 4090 at about $0.14-0.34/h on Vast.ai/RunPod community; L4 about $0.40/h) | **[secondary, [deploybase](https://deploybase.ai/articles/cheapest-gpu-cloud-in-2026-provider-pricing-ranked), [computeprices](https://computeprices.com/providers/vast/gpus/rtx4090)]** | Same engine with `--use-angle=vulkan` or `--use-gl=angle --use-angle=gl-egl` on NVIDIA. Draws drop to a few ms, and capture and encode become the limit (~60-100 ms/frame) **[estimate]**. A 15-min episode costs well under $1 of GPU time. NVENC can replace x264 |
| Blender EEVEE headless | EEVEE needs OpenGL; headless EGL landed in 2022 **[primary, [commit](https://developer.blender.org/rB3195a38)]**. Under software GL it is "super slow" **[secondary, [devtalk](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-eevee/1436)]** | Only on a GPU box. Cycles on CPU is far slower than our raster pipeline. A rewrite of every scene; not recommended |

---

## 3. Ranked shortlist (speedup per unit of effort)

| # | Change | Measured / expected gain | Effort |
|---|---|---|---|
| 1 | **llvmpipe via `--use-angle=gl-egl`** + Mesa EGL (+ renderer assert) | 4.2x end to end together with #3 (A 1,268 to E 300 ms/frame) **[measured]**; draw alone 2-3.4x | ~1 h |
| 2 | **MSAA off + cheap AA pass** (FXAA/SMAA), check stills | 2.7x on top of #1 (E 300 to F 113 ms/frame); canyon draw 842 to 138 ms **[measured]** | ~2 h |
| 3 | **headless shell + CDP `captureScreenshot` `optimizeForSpeed` + x264 `ultrafast` intermediates** | capture 191 to 43-56 ms; x264 CPU 85 to 23 ms **[measured]** (bundled into E above) | ~1 h |
| 4 | **Film finish folded into the per-chunk encode** (later: as a WebGL pass) | removes ~144 ms/frame serial (~1 h/episode) | ~half a day |
| 5 | **GL at 2/3 pixel ratio under a full-res DOM**, per project or per shot | 1.3x on top of #2 (F 113 to G 87 ms/frame) **[measured]**; needs the `drawImage` scale fix in scenes that use a 2D comp canvas | ~30 min |
| 6 | Hold/static-frame dedup | 1.1-1.5x [estimate] | ~1 day |
| 7 | GPU box (RTX 4090/L4) for final renders | 5-10x more [estimate] | infra |
| 8 | In-page WebCodecs + Mediabunny (needs html-in-canvas or a canvas-drawn overlay) | removes capture and x264, maybe 1.3x more [estimate] | days; experimental APIs |

**Combined 1-5: about 10-14x on *The Box* end to end (finish included), measured parts plus estimate. Steps 1-3 alone take 2 hours of work and give 4-11x on render throughput.**

---

## 4. The "skill for fast rendering without FFmpeg"

Candidates, most likely first:

1. **Remotion Agent Skills: [remotion-dev/skills](https://github.com/remotion-dev/skills)**
   (~5k stars; installed with `npx skills add remotion-dev/skills`). It has 12 sub-skills,
   including `remotion-render`, `remotion-best-practices` and **`remotion-multimedia`**,
   "guidance for browser-based multimedia handling with Mediabunny". **[primary]** It pairs
   with **`@remotion/web-renderer`**, which "encodes with WebCodecs using Mediabunny instead of
   FFmpeg" and renders in the browser with no server or bundling step. **[primary, [docs](https://www.remotion.dev/docs/web-renderer/)]**
   This is the only well-known agent skill set whose headline rendering path drops FFmpeg.
   Caveats: it supports only a subset of HTML/CSS, Remotion's license is not OSI-open, and no
   speed benchmark is published.
2. **HeyGen HyperFrames: [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)**
   (Apache-2.0; 21+ skills installed with `npx skills add heygen-com/hyperframes`). It's the
   most popular "HTML to video for agents" skill set, and it's what people mean when they talk
   about HeyGen's agent video tooling. It **does use FFmpeg** (headless Chrome capture, then
   FFmpeg encode). **[primary]** Its "fast capture" (drawElement, ~2x) is a capture speedup, not
   an FFmpeg replacement.
3. Smaller ones: the Mediabunny skill on MCP Market (conversion only); the `motion-video` skill
   PR in [margarinrobert-ctrl/main#44](https://github.com/margarinrobert-ctrl/main/pull/44) (WebCodecs
   export in the viewer's browser, unmerged); [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit)
   (FFmpeg optional).

**Does "not using FFmpeg" matter for us?** Only a little. In our pipeline ffmpeg's encode is
~23-85 CPU-ms per frame, and it runs in parallel with the browser. The draw is 100-2,800 ms. In-page
WebCodecs would save the capture transfer plus x264, but it requires moving the DOM overlay into
the canvas, and Playwright's Chromium cannot encode H.264 (VP9/AV1 only) **[measured]**. The big
win is in the rasterizer and in MSAA, not the encoder.

---

## 5. What we did not get to

- `HeadlessExperimental.beginFrame` wasn't benchmarked (it needs target creation outside
  Playwright's page model). We expect a small gain because we already drive time ourselves.
- AA replacement quality (FXAA vs SMAA vs none-plus-grain) needs a still-by-still look.
- No GPU was available to measure the GPU fallback.
- Measurements cover *The Box*. *Data Rush* scenes may weigh differently; rerun `prof.mjs`
  per project.

---

## 6. Implementation plan for `engine/`

Each step is independently shippable and keeps output deterministic. Check every step with
`--stills` before and after, and compare with `ffmpeg -lavfi psnr`.

**Step 1: llvmpipe (rank 1).**
- Setup: `apt-get install -y libegl1 libegl-mesa0` (add to the cloud setup script). Mesa
  25.2's `libgallium` with llvmpipe is already installed here.
- In `openStage()`: launch args `['--use-angle=gl-egl', '--ignore-gpu-blocklist']`, with env
  `EGL_PLATFORM=surfaceless` and, if the glvnd vendor file isn't in the default path,
  `__EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/50_mesa.json`. Playwright's
  `launch({ env })` passes these through.
- After `__setup`, read `WEBGL_debug_renderer_info`. Fail loudly unless it contains `llvmpipe`,
  or fall back to the SwiftShader args behind `--gl=swiftshader`.
- Optional: `LP_NUM_THREADS` = cores / workers when running more than one worker.
- Add the renderer string to `chunkKey` so cached chunks from different rasterizers don't mix.

**Step 2: capture and intermediates (rank 3).**
- `executablePath`: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
- Replace `page.screenshot` with `cdp.send('Page.captureScreenshot', { format:'jpeg', quality:95, optimizeForSpeed:true })`
  through `page.context().newCDPSession(page)`, and decode `data` from base64.
- Chunk encode: `-preset ultrafast -crf 12` (they are intermediates; the master re-encodes).

**Step 3: AA (rank 2).**
- `stage.html`: `antialias: cfg.aa ?? false`. Add an `SMAAPass` (or an FXAA `ShaderPass`) after
  the scene render, which needs `scene.js` to render through an `EffectComposer` that `kit.js`
  provides. Alternatively, let projects opt back into MSAA per shot.

**Step 4: finish in the chunk encoder (rank 4).**
- Move the `vf` chain into `renderChunks`' ffmpeg args. Make the noise filter deterministic per
  chunk by seeding it from the chunk start frame (`noise=...:all_seed=<a>`). Encode chunks at the
  final quality (`medium`, crf 18, `-tune grain`, or `ultrafast` crf 14 if the box is still
  CPU-bound). Then the master step is a `-c:v copy` concat plus the audio mux.
- Later: port halation, bloom, grain and vignette into a GLSL pass in `stage.html` and drop the
  filter chain.

**Step 5: resolution knob (rank 5).** `renderer.setPixelRatio(cfg.glScale ?? 1)`, with
`project.glScale` (e.g. 0.667 for drafts and busy shots). CSS size stays at 1080p, so the DOM
overlay stays sharp. Scenes that copy the GL canvas into a 2D canvas (*The Box*'s `comp`) must
draw it scaled: `cx.drawImage(gl, 0, 0, width, height)`.

**Step 6: hold dedup.** Let a scene return `{ static: true }` from `frame()` (or detect it by
hashing `readPixels` of a 64x36 downsample plus `overlay.innerHTML`). When it's static, write the
previous JPEG again without drawing or capturing.

**Step 7 (optional): GPU runner.** The same engine on a rented RTX 4090 or L4 with
`--use-angle=vulkan`. Swap libx264 for `h264_nvenc` in the chunk encoder.

---

## Sources

- Chrome DevTools Protocol: [Page.captureScreenshot](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot), [HeadlessExperimental](https://chromedevtools.github.io/devtools-protocol/tot/HeadlessExperimental/)
- [Microlink: WebGL without a GPU (SwiftShader to llvmpipe)](https://microlink.io/blog/webgl-without-a-gpu)
- [Remotion GL options](https://www.remotion.dev/docs/gl-options) · [Remotion web renderer](https://www.remotion.dev/docs/web-renderer/) · [How client-side rendering works](https://convert.remotion.dev/docs/client-side-rendering/how-it-works) · [remotion-dev/skills](https://github.com/remotion-dev/skills) · [Remotion agent skills docs](https://www.remotion.dev/docs/ai/skills)
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) · [HyperFrames v0.7.38 release notes](https://newreleases.io/project/github/heygen-com/hyperframes/release/v0.7.38) · [silenceper: HyperFrames architecture](https://silenceper.com/en/article/2026-05-02-hyperframes-html-video-rendering/)
- [Vanilagy/mediabunny](https://github.com/Vanilagy/mediabunny) · [dmnsgn/canvas-record](https://github.com/dmnsgn/canvas-record)
- [tungs/timecut](https://github.com/tungs/timecut) · [alexey-pelykh/puppeteer-capture](https://github.com/alexey-pelykh/puppeteer-capture) · [redotvideo/revideo](https://github.com/redotvideo/revideo) · [Motion Canvas rendering](https://motioncanvas.io/docs/rendering/video)
- [WICG html-in-canvas](https://github.com/WICG/html-in-canvas) · [Chrome: HTML-in-Canvas updates](https://developer.chrome.com/blog/html-in-canvas-ot-changes)
- [stackgl/headless-gl](https://github.com/stackgl/headless-gl)
- [SVP: RIFE AI interpolation](https://svp-team.com/wiki/RIFE_AI_interpolation) · [Real-ESRGAN FAQ](https://mintlify.com/xinntao/Real-ESRGAN/resources/faq)
- [Blender headless EGL commit](https://developer.blender.org/rB3195a38) · [Blender devtalk on EEVEE headless](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-eevee/1436)
- GPU pricing: [deploybase](https://deploybase.ai/articles/cheapest-gpu-cloud-in-2026-provider-pricing-ranked), [computeprices](https://computeprices.com/providers/vast/gpus/rtx4090)
