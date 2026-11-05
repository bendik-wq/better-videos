# HyperFrames as our animation engine: a 12-second test (2026-11-05)

**Question:** should ep10, a fully animated 15–20 min explainer in our "Paper & Spring" look
(`animation-study/STYLE-BIBLE.md`), render its picture in **HyperFrames** (HeyGen, Apache-2.0,
HTML/SVG/CSS/GSAP rendered frame by frame in headless Chrome), or should we extend our own engine's
2D canvas sets (`engine/render.mjs`, bible §17)?

**Short answer (revised after a second round of tests, same day):** HyperFrames works for
flat-vector animation, is free for everything we need, holds sync through a picture-only render
plus our own mux (≤ 1 frame, no drift at 20 min), and behaves at the scale of a 20-minute,
300-sub-composition timeline. Its review and measure tooling is better than ours. But a
head-to-head port of one shot into our own canvas engine came out **equal** on look and similar on
speed. The engine choice is therefore not the critical path: the **scene/rig library is**, and it
costs the same in either engine (§11). **Recommendation (§12): provisional hybrid, pending a
2-minute pilot**, not a commitment. Render at **30 fps**.

Round-2 test projects: `projects/hf-test/` (fixed), `projects/hf-scale/` (scale + sync),
`projects/hf-acting/` (character stress), `projects/hf-port/` (the same shot in our canvas engine).

Craft lessons from their skill docs are in `hyperframes-craft.md`.

---

## 1. What was built

`projects/hf-test/`, created with `npx hyperframes init hf-test --example blank --skip-skills
--resolution landscape` (CLI **v0.9.17**, Node 22). It is a 1920×1080, **60 fps**, 12.0 s
composition:

| File | What |
|---|---|
| `index.html` | Root: paper ground, two scene hosts, static paper-fibre overlay (seeded `feTurbulence`, 5 % multiply), the `<audio>` VO track, palette as composition variables |
| `compositions/ladder.html` | 0–8.2 s, one continuous take. **The Winder** (our faceless paper character, teal capsule, brass wind-up key) stands, anticipates, hops (squash and stretch within the bible's 8 % budget), looks up and points at the question *"How small is the smallest part of you?"* (per-word blur-in). A brass **loupe** lands on its arm, and the camera **dives** (expo.inOut, 1.5 s) into one cell (red nucleus = the one red thing), holds, then **pulls out** in one take (power2.inOut, 2.7 s) through tissue → the Winder → a city → Earth. A kinetic readout (`≈ 10⁻⁵ m` … `10⁷ m`, plus the rung name) rolls with the zoom. The pull-out **holds on the city** (0.6 s), where the Winder stands among the buildings, then goes on to Earth, which keeps the city skyline and a red pin on top (the carrier through the zoom). Earth shrinks to a dot |
| `compositions/count.html` | 8.1–12 s. **Morph transition**: the teal dot widens into a slot and turns brass (clip-path + colour, 0.5 s power3.out). 14 paper **counter drums** pop in, then **roll** to `37,200,000,000,000` (low digits spin more, lead digit lands last, back.out). Label *CELLS IN ONE HUMAN BODY*, source line *Bianconi 2013 (est.)*, red pencil underline draws on, then a diagonal **ink wipe** to a night plate with `MAINSPRING` printed in letter by letter |
| `assets/` | GSAP 3.15.0 vendored (`assets/vendor/gsap.min.js`); **all fonts vendored** as woff2 from our `assets/fonts`: Instrument Serif (the question title, as a bible chapter title), Archivo Narrow 700 (numbers and the end card, the bible's stand-in until Inter 900 is installed), IBM Plex Mono 500 (labels, data, source lines). No Inter, no Google Fonts. Plus `vo.wav` |

**Audio note:** `.cache/vo/lines/` doesn't exist in this container (no cached ElevenLabs lines).
The WAV is our CC0 reference read `assets/voices/stuart_bell.wav` (8.45 s, resampled to 48 kHz
stereo), placed at 0.3 s. The sync test (§7) uses generated cues instead.

**Look techniques, all SVG:**
- **Off-register pen:** the art tree is cloned once at load into a *fill pass* (strokes off,
  shifted +4,+3 px on screen) and a *line pass* (fills off, `vector-effect: non-scaling-stroke`, so
  the pen stays 2–3 px at any zoom).
- **Halftone shade:** 45° dot `<pattern>`s clipped by crescent masks lit from the top-left lamp.
- **The scale ladder:** each rung is drawn at its own scale (cell ×1, Winder ×36, city ×216,
  planet ×1296, ratio 6 per rung) and nested at the point where it sits inside the next. The camera
  is `scale(6^-z)` around a blended focus, with rung opacities as functions of z. It is a pure
  function of time, driven by one linear clock tween's `onUpdate`.
- **Honest compression (fixed in round 2).** The drawing compresses ×1296 in total while the
  real span is 10⁻⁵ m → 10⁷ m (12 orders of magnitude; cell → human alone is ~10⁵, not 36). By
  HyperFrames' own rule that a beautiful wrong diagram is worse than none, round 1 was misleading.
  Now the readout prints the **real** size, the rung label never contradicts the number (between
  rungs it reads `YOU → CITY`, at a rung `A CITY · 10 KM`), and a third line says
  `ZOOM NOT TO SCALE · REAL JUMP ×6,000` for the step in progress (×100, ×1,700, ×6,000, ×1,300).
  For ep10 proper, pick one: keep the compression and say it (as now, plus a VO line), or go
  log-correct (one rung per power of ten, ~13 rungs, which needs more art and more time).
- **Character on twos:** a custom ease wrapper quantises the Winder's pose tweens to 15 fps, while
  camera, type and mechanism run on ones (bible §6.6).

---

## 2. Render speed (measured)

Box: 4 vCPU, 15 GB RAM, no GPU. HyperFrames downloads its own **chrome-headless-shell 152** into
`~/.cache/hyperframes/chrome/` and captures with BeginFrame on software GL (SwiftShader).

| Run | Wall time | Throughput | Notes |
|---|---|---|---|
| `render` (auto workers), round 1 | 1 m 54 s | 177 ms/frame | Auto calibration picked **1 worker**. Always pass `--workers 4` |
| `render --workers 4`, round 2 (fixed ladder, vendored fonts) | **49.8 s** | 720 frames · **~69 ms/frame effective** · 4.1× realtime | 7.8 MB, H.264 CRF 16, AAC 48 k |
| `render --workers 4 --format png-sequence` (×2, round 2) | 136 s / 141 s | 5.2 fps | PNG writing dominates |
| hf-acting (3 IK rigs + 240-figure crowd, 4 s @ 30 fps) | capture 8.8 s | **73 ms/frame** | §10 |
| hf-scale, 8-shot 32 s timeline @ 30 fps | 70 s wall | ~68 ms/frame | §9 |
| `check` (hf-test) | 9.5 s | | lint + runtime + layout + contrast + craft samples |

**The ~69 ms/frame is a capture floor, not scene cost.** A near-empty 30 fps scene, the 60 fps
cell-to-planet zoom and the 240-figure crowd all land at 68–73 ms/frame at 4 workers. Scene
complexity didn't matter until something heavy (blur filters, hundreds of masks, video layers),
which we haven't hit yet.

**Fonts are now fully offline.** Round 1 fetched Inter and IBM Plex Mono from Google Fonts on the
first compile. Round 2 declares every face with `@font-face` from `assets/fonts/`. With
`~/.cache/hyperframes/fonts/` moved aside, the render completed and **no font cache was
recreated**, so there was no fetch.

## 3. Determinism (measured)

- **Audio:** bit-identical across renders (same MD5).
- **Same worker count (4w vs 4w), PNG sequences, round 2:** **717 of 720 frames byte-identical.**
  Three frames differ (5.53 s: 2 px; 6.15 s and 6.20 s: 6 and 13 px, max 14/255), all on
  anti-aliased edges during the fast zoom. This is the case that matters for chunk-cache reuse.
- **Different worker counts (4w vs 2w), round 1:** 607/720 identical; 113 differ by 5–126 px
  (max 49/255).
- **MP4 vs MP4** (1w vs 4w): PSNR 49.5 dB average, 43.3 dB minimum.

**Consequence for a chunk cache:** HyperFrames is *visually* deterministic, not bit-exact, even
at a fixed worker count. Key cached chunks on **inputs** (composition files, timing.json, assets,
CLI version, worker count), as our engine already does, never on an output hash. A re-rendered
chunk can differ invisibly from a cached neighbour, and that's harmless at a cut.

**Seek bug caught by the tooling (round 1):** several `fromTo`s per element left elements on the
last-authored from-state before the first tween. `check`'s lint
`gsap_repeated_fromto_without_baseline` flagged it. The fix: `tl.progress(1).progress(0)` after
building, plus `immediateRender:false` on repeat tweens.

## 4. Quality: what the frames show

Round 2 frames were read at 1.2 / 3.0 / 5.6 / 6.2 / 6.7 / 7.3 / 7.65 / 7.95 / 11.75 s.

**Fixed in round 2 (four of them were visible in round-1 frames but not reported then):**
- **Readout label lagged the number:** at 6.2 s it read `YOU · 1.7 M` over ≈10¹ m. Now the label
  and exponent come from the same zoom value (see §1, honest compression).
- **City rung unreadable:** pale card-on-paper rectangles that were fully visible for only
  ~0.35 s while the zoom was at full speed. Now there are solid ink, teal, sage and brass blocks,
  windows on every building, halftone shade, and a 0.6 s hold with the Winder standing in the city.
- **Earth lost the carrier:** a generic teal ball. Now it has a survey graticule, an ink outline,
  the city skyline on top and the red pin. **Engine bug found doing this:** Chrome drew none of the
  planet's line-pass strokes (`vector-effect: non-scaling-stroke` under a ×1296 nested scale
  draws nothing). The planet's pen lines now live in the fill pass. For production, avoid huge
  nested scales: re-base each rung's coordinates near 1.
- **Wind-up key looked like it came out of the arm.** It now sits on the back, above the shoulder,
  and its shaft ends at the body outline, so no hidden line leaks through.
- **Type contradicted the style bible.** Inter is gone. The question is now set in Instrument
  Serif 104 px, the end card in Archivo Narrow 700, and labels and data in Plex Mono 500, all
  vendored (§2).

Still true from round 1: crisp vector at any zoom, constant pen weight, halftone reads as print,
the digit roll lands cleanly, no banding at CRF 16. **Kept on purpose:** `check` warns that the
end card is on screen 1.15 s (< 2 s floor), because the test is fixed at 12 s.

### 4.1 Benchmark against the target league (measured, and the verdict downgraded)

The round-1 verdict "looks professional" wasn't benchmarked. Round 2 compared it with the only
reference pictures this container can get: **published thumbnails** (YouTube blocks video
downloads here). Thumbnails are packaging, so they're denser and more saturated than in-video
frames. Treat this as an upper bound for the league, not a like-for-like comparison.

| Set | Mean luma | Saturation | Edge density* | Colours > 0.2 % of frame* |
|---|---|---|---|---|
| **hf-test (12 frames, 1/s)** | 207 | **0.137** | **4.0 %** (0.9–8.4) | **11.5** |
| Kurzgesagt thumbs (9) | 78 | 0.669 | 5.3 % | 42.1 |
| TED-Ed thumbs (9) | 143 | 0.340 | 8.1 % | 31.8 |
| MinuteEarth thumbs (9) | 192 | 0.152 | 8.9 % | 28.8 |
| CGP Grey thumbs (9) | n/a | n/a | 6.6 % | 23.0 |

\*Our own script (`projects/hf-scale/tools/edge_density.py`): share of pixels with a luma gradient > 24 at 960×540,
and the number of 3-bit-per-channel colour bins covering > 0.2 % of the frame. Luma and saturation
come from `npx hyperframes measure look out/hf-test.mp4 --compare <ref>.mp4` (refs = 12 thumbnails,
1 s each). `same_look: false` against all three; the closest was MinuteEarth (luma ratio 0.93,
saturation ratio 1.11).

**Verdict:** the test proves the **engine** can draw our look cleanly. It does **not** show
league-level visual density: we have roughly half the detail and a third of the colour variety of
the references, with flat light and no depth cues (no cast shadows beyond the contact ellipse, no
atmospheric layers, no secondary motion in the background). Paper & Spring is meant to be lighter
than Kurzgesagt (bible §1.3), but even MinuteEarth, the brightest and lowest-saturation reference,
has twice our edge density. **Pilot gate added (§12):** a chapter's frames must reach ≥ 6 % edge
density and ≥ 20 colour bins on average, and pass a side-by-side read against reference frames.

## 5. The measure tools (all free, no sign-in): what each outputs

All take any MP4, so **they work on our own engine's renders**, and return JSON in 2–5 s on a
12 s file. There's no `measure motion`: the motion tools are `events`, `curve` and `energy`.

| Command | Output | Our use |
|---|---|---|
| `measure probe` | size, fps, frames, duration, audio, VFR/HDR flags | Delivery gate |
| `measure cuts` | Every hard cut `{t, frame, change}`, the shots between, `not_cuts` (flashes, whips, fast moves). hf-test: **1 cut at 10.817 s** (the ink wipe); the one-take zoom and the morph are correctly ignored | Cuts/min and average shot length vs the autopsy numbers |
| `measure events --map` | cut/flash/appear/disappear/change/**hold** counts on a 4×4 grid, holds list, sound onsets, "windows worth looking at" | **Dead-stretch detector**; picture changes vs sound onsets |
| `measure look` | Mean luma, contrast, saturation, b/w share, warmth; `--grid` per-cell colour; **`--compare` another video** | Bible §1.3 L/S band; benchmark vs references (§4.1). hf-test: L 207, S 0.137 (under the bible's 0.18–0.30) |
| `measure curve --roi` | Per move: prop, start, duration, overshoot %, anticipation %, closest GSAP ease | Checks that an ease reads as intended |
| `measure energy A B` | Motion correlation between two clips (r, lag, ratio) | Regression between two renders of a shot |
| `measure ink --roi --at` | Bounds and line heights of marks | Type-size floor (28 px) |
| `measure frames --range a,b` | A strip of consecutive native frames | Reviewing a transition |
| `measure extract` | A still or clip | |
| **`measure sync --roi`** | Lag between motion in an ROI (meant for a mouth) and voice energy: `best_lag_ms`, correlation, confidence | Built for lip sync. **It works on any ROI**: on our sync square (§7) it read **+18 ms (picture late, ≈ 0.55 frame), confidence medium**, which agrees with our own onset check. Usable as a quick A/V offset probe on our renders |
| **`measure face`** | Face box per sampled frame, face height share, and a verdict on whether a generated presenter keeps the likeness at that size | **Not relevant** to a faceless channel (on hf-acting: 0 faces, "unmeasured"). Note: the first run **downloads opencv.js + Haar cascades** (~12 MB) from the network |
| `audio <video> --json` | Kind, onsets, LUFS integrated / short-term max, true peak, clipping, silences | Loudness gate (don't trust `kind`) |

Also free: `snapshot --at/--range` (contact sheets), `keyframes --shot`, and `check` with a
`<name>.motion.json` of assertions.

## 6. Free vs Pro (v0.9.17; we never signed in): verified, not inferred

| Status | Commands |
|---|---|
| **Free, local, run here** | `init`, `lint`, `check`, `snapshot`, local `render` (mp4/webm/mov/gif/png-seq/hls, `--start/--end`), `measure *` (incl. `face`, `sync`), `audio`, `telemetry` |
| **Free, local, listed by `--help`, not run here** | `validate`, `inspect`, `keyframes`, `timeline`, `compare`, `benchmark`, `preview`, `beats`, `normalize-audio`, `tts` (Kokoro), `transcribe` (whisper/Parakeet), `remove-background` |
| **Pro / HeyGen account** | `reverse` (reverse-any-video), `templates` (style-sampling), `cloud render`, `media-use generate` (credits), `transcribe --engine heygen` (billed) |
| **`publish`: works WITHOUT sign-in** [verified from source `packages/cli/src/commands/publish.ts` + its tests; not executed] | It **uploads the whole project to HeyGen's servers anonymously** and returns a private URL plus a `claim_token` URL; signing in is only needed to *claim* it. So an agent running the stock `npm run publish` would ship our unreleased episode to a third party with no prompt for credentials. **We removed the `publish` script** from `projects/hf-test/package.json` and replaced the vendor CLAUDE.md/AGENTS.md (they told agents to run `npm run publish` and to "invoke /hyperframes" vendor skills). |

**Telemetry:** on by default. Verified **disabled** (`telemetry status` → `disabled`, source:
`/root/.hyperframes/config.json`). In CI, also set `HYPERFRAMES_NO_TELEMETRY=1`.

**Licences.** HyperFrames: Apache-2.0. Fonts: OFL. **GSAP 3.15.0: verified against
gsap.com/standard-license (last modified 30 May 2025, effective 30 Apr 2025).** Commercial use is
free. The permitted use is worded as use "on any website, web application, or digital
interface". Rendered video and YouTube are **not mentioned**. The prohibited use is building
no-code visual animation tools that compete with Webflow, which doesn't apply to us. **Status:
very likely fine, not explicitly covered.** Before ep10 ships, either email GreenSock to confirm
in writing that rendered video is covered, or keep the generator free of GSAP-specific features so
an MIT tweener (or our own `engine/motion.js` eases) can replace it. Our scenes use only
`fromTo`/`set`/eases plus `onUpdate` clocks, so the swap is small.

## 7. Integration with our VO / score pipeline: tested (was untested)

`projects/hf-scale/` (generated by `build.mjs`, 101 lines) is the integration plan in miniature:

1. `build.mjs` writes **`timing.json`** the way our engine would export it: 300 shots × 4 s =
   20 min, **2,517 words** with `t0/t1` at arbitrary (non-frame-aligned) times, and one cue per shot
   on a word onset.
2. It generates **one sub-composition per shot** with **word-timed tweens inlined from
   timing.json** (each word pops in at its `t0`; no fetch at render time), plus a black sync
   square that turns on at the cue.
3. It writes **`out/mix.wav`**: a 10 ms 1 kHz blip at every cue (our stand-in "VO onset").
4. HyperFrames renders **picture only** (the root has no `<audio>`).
5. `tools/sync_check.py` does the planned mux (`-c:v copy`, mix cut to the chunk span, AAC
   320 k), decodes the muxed file back, and finds every picture onset (sync square) and audio
   onset (blip).

| Chunk | Cues | Picture onset − cue | Audio onset − cue | Audio − picture |
|---|---|---|---|---|
| 0–30 s | 7/7 found | **+0.04 … +0.96 frame** | +0.04 ms | −32 … −1 ms |
| 1170–1200 s (end of the 20 min film) | 7/7 | +0.11 … +0.86 frame | +0.04 ms | −29 … −4 ms |
| 0–60 s = two chunks **stream-copy concatenated** | 15/15 | +0.04 … +0.96 frame | +0.04 ms | −32 … −1 ms |

**Reading:** the picture always lands on the **first frame at or after** the cue (correct
quantisation: never early, never more than one frame late). The audio is sample-exact after the
AAC mux. There's **no drift at 20 min**, and the concat seam is exact (1,800 frames, 60.000 s).
The word-timed tweens render where timing.json puts them (checked in snapshots at 3/43/…/1199 s).
`measure sync` on the same file agrees (+18 ms picture-late).

**Rule for the generator:** because picture onsets quantise *up* to 33 ms at 30 fps, schedule
anything that must "land on the stressed word" at `t0 − 2 frames` (bible: lands 2 f before), and
let the quantiser do the rest.

**What's still not tested:** a real ElevenLabs VO with real alignment through `engine/voice.py`
(no cached lines in this container, and the engine's mix step needs Python `soundfile`, which is
missing here, see §8), and SFX placement from timing.json. Both use the same mechanism as the
blips, so the risk is low.

## 8. Head-to-head: the same shot in our own engine's 2D canvas (measured)

`projects/hf-port/` ports the counter-drum beat of `count.html` (0–2.5 s: the housing morph, 14
drums popping in and rolling to 37,200,000,000,000, label blur-in, source line, red underline)
to a canvas set in `engine/render.mjs`, using the same eases and timings.

| | HyperFrames (`count.html`) | Our canvas (`hf-port/scene.js`) |
|---|---|---|
| Lines for this beat | 131 (whole sub-comp incl. ink wipe) | **74** |
| Agent authoring time | not timed (round 1) | **4 min 48 s** wall, one pass, no fix loop (a translation of a finished design, so a lower bound) |
| Render | 69 ms/frame at 4 workers (whole film) | 150 frames in 30 s = **200 ms/frame on 1 worker** (a 2.5 s film is one chunk, so only one worker ran; **SwiftShader fallback**: llvmpipe/EGL isn't installed in this container). HF on 1 worker: 177 ms/frame |
| Result vs HF frames | n/a | **SSIM 0.94** over the 2.5 s (differences: fibre overlay absent, ±6 px label baseline). Side by side at 0.6 / 1.2 / 2.3 s the two read as the same shot |
| Timing source | needs the generator (§7) | **native**: `M.wt(shot, word)` reads aligned VO words today |
| Gotchas | none | engine's audio mix failed here: `score.py` needs `soundfile` (container issue, not engine design) |

**What this shows:** for a flat-vector beat, the two engines are at **parity on look and close on
speed**. The canvas port was quick because canvas `fillText`, `roundRect`, `clip` and
`setLineDash` cover this kind of shot. HyperFrames' edge is in the things this beat didn't need:
SVG masks and patterns, non-scaling strokes through deep zooms, text layout, the Studio scrubber,
and `check`/`snapshot`. Our canvas also already has a **richer Winder rig**
(`projects/paper-lab/scene.js`: pose dictionary, dial-head gaze, key with motion arcs) than the
hf-test SVG one. So the §12 recommendation is **provisional**.

## 9. Scale: a 20-minute, 300-sub-composition timeline (measured)

`projects/hf-scale/`: 300 sub-compositions (3.6 MB of HTML), 2,517 word tweens, 300 gears, 18,000
tally rects, 1200 s at 30 fps.

| Step | 20 min / 300 comps | 32 s / 8 comps |
|---|---|---|
| `node build.mjs` | 0.3 s | |
| `lint` | 13.9 s, 0.3 GB | |
| `check` (runtime, layout, motion, contrast, craft: 597 samples every 2 s) | **103 s, peak RSS 4.3 GB**, 0 errors | ~10 s |
| `snapshot --at` 3 times (incl. 1196 s) | 37 s, 2.9 GB | ~10 s |
| `render --start a --end a+30` (4 workers) | **129–142 s wall, peak 2.5–3.3 GB** | 70 s, 1.6 GB |
| … compile | 18–34 s | 0.5 s |
| … probe + reference background | 9–12 s | 0.8 s |
| … page load per worker | 5.2–5.4 s | 0.2 s |
| … capture 900 frames | 61–64 s (**~69 ms/frame**) | ~65 s (~68 ms/frame) |
| Seek cost deep in the timeline | **none**: the chunk at 1170 s captured as fast as the chunk at 0 s | |

**Reading:** scale costs **fixed overhead per render call** (~60–75 s) and memory (4.3 GB for a
full `check`), **not per-frame time**. Nothing broke: all 300 timelines were found
(`pollSubCompositionTimelines … ready`), and snapshots and chunks deep in the film are correct.

**Projection for a 20-minute episode (measured floor × frames, plus overheads):**
- **30 fps:** 36,000 frames × 69 ms ≈ **41 min capture**, plus ~70 s per render call. With
  3-minute chunks (7 calls) that's ≈ **50 min**. With 30 s chunks (40 calls), overhead alone adds
  ~45 min, so **use chunks of 2–3 min**.
- **60 fps:** ≈ 83 min capture, ≈ 92 min total.
- Heavier scenes (blur, many masks, video layers) will raise the floor. Budget per chapter in the
  pilot.

**Recommendation: 30 fps for a 20-minute episode.** The bible animates characters on twos (15 fps)
and the camera on ones. At 30 fps the camera still moves every frame, halves render time and file
size, and every reference channel in our autopsies publishes at 24–30 fps. Keep 60 fps only for a
short, zoom-heavy showpiece where judder is visible, and render it as its own chunk.

## 10. Character acting stress test (measured, partly failed)

`projects/hf-acting/` (4 s, 30 fps): three rigs with **2-bone IK legs** (walk with planted feet)
and **IK arms** (one reaches for a ball in flight and catches it), a **dial-head gaze** (our
faceless "expression"), a squash-and-stretch **surprise take**, and a **240-figure crowd** walking
with per-figure phase. All of it is solved per frame from one clock in `onUpdate`.

- **Speed:** 73 ms/frame, the same capture floor. Per-frame IK on 3 rigs plus a 240-node crowd
  costs nothing measurable.
- **Quality, honestly:** the first pass had a **broken walk** (stretched legs from unclamped IK
  targets). The second pass fixed it with target clamping and a planted-foot cycle. Still visible:
  hips set too low, so idle characters crouch; the walker passes through another character (no
  staging); the gaze reads, but there's no eye/brow acting; and a crowd of identical tallies reads
  as texture, not people. **OverSimplified-style acting (many expressive characters, staging, comic
  timing) is not proven.** The engine is not the limit (there's no cost wall). The limit is the
  **rig library**, which doesn't exist yet in either engine.
- `measure look`: luma 231, saturation 0.054. Even sparser than hf-test.

## 11. The real cost: authoring 15–20 minutes of hand-made animation (estimated)

Measured densities: `ladder.html` is **459 lines for 8.2 s (≈ 56 lines per screen-second)**, and
`count.html` is 131 lines for 3.9 s (≈ 34). Hand-writing a 1,080 s episode at ~45 lines/s gives
**≈ 48,000 lines**. At the one timed rate we have (74 lines in 4.8 min ≈ 15 lines/min, translating
a finished design, with no design or review loop), that's **~54 agent-hours of typing alone**.
Typical look-and-fix loops are 3–5× that. **Not viable shot-by-shot**, in HyperFrames *or* in
canvas.

**So the scene/rig library is the critical path, sized like this [estimate]:**

| Library piece (`engine/hf/` or `sets/paper`) | ~Lines |
|---|---|
| Paper FX: per-object misregistration, halftone, fibre, deckle, hatch, cast shadow | 400 |
| Winder rig: pose dict, IK limbs, walk/run/hop cycles, gaze dial, key, mood states, on-twos | 800 |
| Cameo / historical-figure card rig + 6 body types × 4 expressions | 600 |
| Crowd / tally field (formations, flows, counts to N) | 300 |
| Camera rig + scale ladder (log-correct option) | 400 |
| Mechanisms: gear train with meshing, counter wheel, mainspring, stamp | 500 |
| Survey-sheet map kit (coastlines from data, routes, pins) | 700 |
| Chart instruments (card-strip bars, tape timelines, dial gauges) | 600 |
| Type kit (title stamp, chapter card, string tag, source line, quote card) | 400 |
| Transitions (morph, carry, flood, through-object, dip, ink wipe) | 500 |
| Generator (`timing.json` → shots, chunking, cache key, QA hooks) | 600 |
| **~25 parameterised scene templates** at ~200 each | 5,000 |
| **Total, built once, reused every episode** | **≈ 10,800** |

With it, an episode is **~180–250 shots × 15–30 lines of params ≈ 3,000–7,000 lines**, roughly the
size of today's `project.mjs` files, plus maybe 5–10 bespoke hero shots at ~300 lines each.
That's an **order of magnitude** less than hand-making every shot. The library is the same size
in either engine; HyperFrames' SVG primitives make about a third of it (paper FX, type, masks)
cheaper to write.

## 12. Recommendation: provisional, pending the pilot

**Provisional hybrid:** HyperFrames renders the 2D animated picture, and our engine conducts
(timing.json export, VO, score, SFX, mix, finish, mux, 3D clay and map shots). It's **not
committed** until a pilot passes. The case is narrower than in round 1:

- **For HyperFrames (measured):** sync through picture-only + our mux holds to ≤ 1 frame with no
  drift at 20 min (§7). A 300-shot timeline works, with no deep-seek cost (§9). The review and
  measure tools found real bugs. SVG primitives suit Paper & Spring. All free and local.
- **Against, or neutral (measured):** on a flat-vector beat our canvas engine matched the look
  (SSIM 0.94) and was quick to author (§8). Our engine has native word timing and an existing,
  richer Winder rig. HyperFrames adds a second toolchain, ~70 s per render call, and 4 GB `check`
  runs. Neither engine yet reaches league visual density (§4.1) or character acting (§10).
- **Decisive (estimated):** the ~11k-line scene/rig library (§11), not the engine.

**Pilot (one real 2-min chapter, 30 fps, from a real ElevenLabs timing.json):**
1. Build the first ~4k lines of the library (paper FX, Winder rig v2, camera/ladder, type kit,
   3 transitions, generator) **in HyperFrames**, and time it.
2. Build the same chapter's two hardest shots in canvas as a control, and time them.
3. Gates: (a) render ≤ 120 ms/frame effective at 4 workers; (b) `check` 0 errors, plus a cold
   `--start` mid-chapter matching a straight render (SSIM ≥ 0.99); (c) VO onsets vs picture cues
   ≤ 1 frame (`tools/sync_check.py` adapted to word cues); (d) visual density ≥ 6 % edges and ≥ 20
   colour bins on average, and a side-by-side read against reference frames; (e) authoring rate
   ≥ 60 screen-seconds per agent-day once the library exists.
4. If HyperFrames loses on (e) or (a), extend the canvas sets instead and keep HyperFrames'
   `measure`/`audio` tools for QA either way.

**Hygiene, done in round 2:** CLI pinned (0.9.17); telemetry verified off; the `publish` script
removed; vendor CLAUDE.md/AGENTS.md replaced with our rules (never `publish`/`cloud`/sign-in, no
usage beacon, no vendor skill installs); GSAP and all fonts vendored; `.hyperframes/` and
`renders/` artifacts git-ignored.

---

### Reproduce

```bash
cd projects/hf-test && npx hyperframes@0.9.17 check            # passes; 1 lint warn (file length), 1 craft warn (end card)
npx hyperframes@0.9.17 render --workers 4 -o out/hf-test.mp4   # ~50 s
npx hyperframes@0.9.17 measure look out/hf-test.mp4 --compare <reference.mp4>

cd ../hf-scale && node build.mjs                               # timing.json, 300 comps, out/mix.wav
npx hyperframes@0.9.17 render --workers 4 --start 1170 --end 1200 -o out/c1170.mp4
python3 tools/sync_check.py out/c1170.mp4 1170                 # mux + onset check (JSON)

cd ../hf-acting && npx hyperframes@0.9.17 render --workers 4 -o out/acting.mp4
node engine/render.mjs projects/hf-port --workers=4            # canvas control (needs python soundfile for the mix)
```
Outputs (git-ignored): `projects/hf-test/out/hf-test.mp4` (12 s, 1080p60, 7.8 MB),
`projects/hf-scale/out/{c0000,c0030,c1170,c0000_60}.mp4` + `.muxed.mp4`,
`projects/hf-acting/out/acting.mp4`, `projects/hf-port/out/picture-fin.mp4`.
