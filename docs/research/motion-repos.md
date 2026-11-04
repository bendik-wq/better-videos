# Motion repos: open-source tools for premium motion graphics and editing

Which open-source engines, libraries and packs could sit **alongside** our Three.js engine to make
type, data graphics, transitions and the finish look premium, and which to leave alone. This is
the "whole tools" view; `animation-libraries.md` (2026-10-10) already covers libraries *inside*
the engine (postprocessing, N8AO, GSAP, flubber, Depth Anything, Theatre.js, Lottie, Rive,
mocap) and `render-speed.md` covers render backends. Asset sources are in `asset-sources.md` and
`docs/library/sound-and-music.md`. Those are not repeated here, only updated where something
changed.

Checked 2026-11-04. Stars and last push come from GitHub (via the ungh.cc mirror, because this
box can't call the GitHub API); versions and release dates from the npm and PyPI registries;
licences from each repo's LICENSE file. Speed claims by a tool's own maker are **unverified**.

**The filter (same as `animation-libraries.md`):**

- **Seekable:** every frame a pure function of `t`; `render.mjs` renders chunks out of order
  across workers. CPU only (SwiftShader/llvmpipe), no real GPU.
- **Licence:** commercial use on a monetised channel; no NC/ND; GPL only for tools we run, never
  code we ship in the page.
- **Taste:** the style bible (photographic, editorial type, one accent, drawn-on annotation) and
  `anti-ai-look.md` (no template look). A library whose free content is flat UI motion is only as
  good as what we build with it.
- **Fit:** it must accept our word timings, palette (`LK.palette`) and finish, not replace them.

Legend: ✅ permissive · ⚠️ conditions · ⛔ blocked.

---

## 1. Summary table

| Tool | What it is | Licence | Render path | Quality ceiling | Maturity (2026-11-04) | Fit with our engine | Verdict |
|---|---|---|---|---|---|---|---|
| **HyperFrames** (heygen-com/hyperframes) | HTML/CSS/JS compositions → deterministic MP4; adapters for GSAP, CSS, Lottie, Three.js, anime.js, WAAPI | ✅ Apache-2.0 | headless Chrome seeks each frame, FFmpeg encodes; local, Docker, Lambda; parallel `--workers`; RGBA out (`png-sequence`, WebM, MOV) | high for 2D type, data, UI; 3D via its Three.js adapter | **78.5k★**, `hyperframes@0.9.12` released 2026-11-04; very active, pre-1.0 | Same frame contract as ours (seek-per-frame Chrome + ffmpeg). Skills already on branch `claude/blissful-dirac-nlvgjk` | **Adopt (pilot)** for the 2D overlay layer |
| **GSAP 3.15** | timeline tweening + SplitText, DrawSVG, MorphSVG, CustomEase | ⚠️ "Standard no-charge" licence: all plugins free for commercial use since 2025; only bans building a no-code tool that competes with Webflow ([gsap.com](https://gsap.com/standard-license)) | in-page; seek with `tl.time(t)` / `gsap.updateRoot(t)` | high (the industry's web motion standard) | 30.1k★, `gsap@3.15.1` 2026-11-04 | Planned in `animation-libraries.md` #5, **not yet integrated** (no `gsap` in `engine/`). HyperFrames' default runtime too | **Adopt** |
| **gl-transitions** | 100+ GLSL transitions under one spec | ✅ MIT (two transitions BSD) | any GL: a fragment shader with `progress` 0→1; ports to WGSL/Metal; ffmpeg via `xfade-easing` | medium: many are showy (cube, swirl, page curl) | 2.2k★, `gl-transitions@2.4.0` 2026-11-04 | `engine/transitions.js` already has 36 in-engine transitions; port 2 shaders only | **Borrow selectively** |
| **Remotion** | React components → video | ⚠️ free for individuals and companies of **≤3 employees**; otherwise $25/seat/month, or $0.01/render with a $100/month minimum for automated rendering ([LICENSE](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md), [pricing](https://www.remotion.pro/license)). Source-available, not open source | headless Chrome + ffmpeg; Lambda/Cloud Run; very mature | high | 70.5k★, `remotion@4.0.540` 2026-11-02 | A second renderer in React that duplicates `render.mjs`; licence cost if the studio grows past 3 people | **Avoid** (mine ideas only) |
| **Motion Canvas** | TypeScript generator-based animation + editor | ✅ MIT | editor-first; export from the browser editor; no first-class headless render | high for vector explainers (3b1b-like) | 19.7k★; last npm release `@motion-canvas/core@3.17.2` **2024-12-14**; repo last push 2026-07 | Imperative generator timeline, not `f(t)` with random access; React-free but its own world | **Avoid** |
| **Revideo** (now midrender/revideo) | Motion Canvas fork with headless rendering, audio, parallel render | ✅ MIT | `renderVideo()` headless; parallel workers; Cloud Run | as Motion Canvas | 4.2k★, `@revideo/core@0.11.0` 2026-07-10; now "the engine behind" Midrender | A whole second engine; small team tied to one product | **Avoid** |
| **Manim CE** / ManimGL | Python maths animation (3Blue1Brown) | ✅ MIT | CLI renders scenes on CPU (Cairo) or OpenGL to MP4/MOV, transparent output possible | very high for maths, equations, graphs; flat look | CE 42.2k★, `manim 0.22.1` 2026-10-27; 3b1b/manim 96.1k★, `manimgl 1.7.2` 2024-12 | Offline side renderer for a single equation or proof beat, composited as RGBA | **Niche**: only for a maths-heavy episode |
| **Theatre.js** | keyframe editor + player | ✅ core Apache-2.0 · ⚠️ studio AGPL | `sequence.position = t` | high for hand-tuned hero moves | 12.9k★; npm `@theatre/core@0.7.2` 2024-05; repo last push 2024-08 (stale) | Already Tier 2 #9 in `animation-libraries.md` as a pure keyframe player | **No change** |
| **anime.js v4** | light tween engine with splitText, drawable, morph | ✅ MIT | `tl.seek(ms)` | medium-high | **74.2k★**, `animejs@4.5.0` 2026-06-22 | MIT fallback if GSAP's licence ever changes (`animation-libraries.md` #15) | **Fallback** |
| **Motion** (motiondivision) | React/JS UI animation | ✅ MIT | rAF-driven, UI-first | high for UI | 34.9k★, `motion@14.9.1` 2026-11-04 | Built for interfaces, not seek-per-frame video | **Skip** |
| **Lottie** (lottie-web, dotLottie, rlottie, ThorVG) | play After Effects (Bodymovin) exports | ✅ MIT (rlottie mostly MIT) | seekable (`goToAndStop(frame, true)`, `setFrame`) | as good as the AE file; free packs are flat UI style | lottie-web 32.3k★ (`5.13.0` 2025-05, slowing); dotlottie-web `0.82.1` 2026-11-02 (ThorVG WASM, 1.9k★) | Fine technically; only useful if a designer makes on-style AE animations for us | **Skip packs; keep the door open** |
| **Rive** | interactive vector state machines | ✅ runtime MIT · editor proprietary | runtime advances by time delta; state machines are interactive, not timeline-first | high for character/UI | rive-wasm 1.0k★, `@rive-app/canvas@2.49.3` 2026-11-04 | Authoring locked in a proprietary editor; interactivity is wasted on video | **Avoid** |
| **Natron** | node compositor (Nuke-like) | GPL-2.0 (tool only) | desktop + command-line renderer | high for compositing | 5.6k★, last push 2026-07; slow releases | Everything it does, our ffmpeg finish + `post.js` already do in code | **Avoid** |
| **Friction** / **Glaxnimate** | After-Effects-like vector motion editors | GPL-3.0 (tools only) | GUI; export to video / Lottie | medium | Friction 1.9k★, active | GUI keyframing doesn't fit an agent pipeline | **Avoid** |
| **MLT / Kdenlive / Shotcut / Olive** | NLE engines and editors | MLT LGPL; Kdenlive GPL; Olive GPL | `melt` CLI renders MLT XML headless | medium | MLT 1.9k★ active; Olive 9.1k★ stalled since 2024-12 | We assemble in `render.mjs`; an NLE adds nothing we need | **Avoid** |
| **editly** | declarative JSON → video (uses gl-transitions) | ✅ MIT | Node + ffmpeg + headless GL | medium (template feel) | 5.6k★; last npm release **2022-12** | Stalled; template look | **Avoid** |
| **Diffusion Studio core** / **etro** | browser video-editing engines (WebCodecs) | MPL-2.0 / MIT | in-browser | medium | 1.3k★ / 1.2k★ | Solve in-browser editing, not offline rendering | **Skip** |
| **OpenColorIO** / **colour-science** | colour management / colour maths in Python | ✅ BSD-3 | offline | n/a (correctness) | OCIO 2.1k★ (push 2026-10); colour 2.7k★, `colour-science 0.4.7` 2025-12 | colour-science is the right library for writing our own `.cube` LUTs (`animation-libraries.md` #8) | **Use for LUT tooling** |

---

## 2. Notes per tool

### 2.1 HyperFrames: adopt for the 2D layer (pilot first)

- **What it gives us:** an HTML-native composition format with tracks and clips, a paused-timeline
  contract (GSAP by default), a linter (`hyperframes lint` catches non-determinism such as
  unseeded `Math.random()` and a Three.js root without `data-duration`), frame snapshots for
  checking cuts, and a registry of **about 450 blocks** (kinetic type, captions, charts, maps,
  transitions, camera moves) installed as editable source
  ([README](https://github.com/heygen-com/hyperframes)). The agent skills are already in this repo
  on branch `claude/blissful-dirac-nlvgjk` (`hyperframes`, `-core`, `-animation`, `-cli`,
  `-registry`, `-keyframes`, `-audio`, `-creative`, `-studio`, `media-use`).
- **Render path:** headless Chrome per worker (~256 MB each), BeginFrame capture where available,
  software GL in Docker, FFmpeg encode; `--format png-sequence | mov | webm` keep **alpha**
  (`hyperframes-cli` skill, `preview-render.md`). The FAQ quotes a 300-frame 1080p composition in
  9.8 s (**unverified**: their hardware, a light composition). Third-party comparisons with
  Remotion contradict each other ([wireflow](https://www.wireflow.ai/blog/hyperframes-vs-remotion)),
  so measure on our box.
- **Cautions:** pre-1.0 and moving fast (a release on the day we checked); HeyGen sells cloud
  rendering credits and "Pro" skills (`/reverse-any-video`, `/style-sampling`); the CLI sends
  anonymous telemetry until disabled (`npx hyperframes telemetry disable`,
  [FAQ](https://hyperframes.heygen.com/faq)). The registry's ready-made blocks are generic SaaS-
  launch motion by default: **restyle every block to the style bible** or it will read as a
  template (`anti-ai-look.md` §2.3).
- **How it fits:** don't move the 3D engine. Render type, charts, chapter cards and annotation
  overlays as **RGBA PNG sequences** at our fps and duration, driven by the same word timings
  (`beats`), and composite them in the ffmpeg finish **before** grain and halation, so both layers
  share one film texture. Pinned version, vendored, telemetry off.
- **Pilot (1 day):** rebuild one chapter card and one `M.data` counter as HyperFrames
  compositions; compare look, render time per frame on this CPU, and how easily an agent edits
  them, against the current `engine/motion.js` versions. Adopt only if it's better on two of three.

### 2.2 GSAP: integrate the bridge already planned

Nothing changed in the licence picture since `animation-libraries.md` #5, except that it is now
confirmed on the licence page: all plugins (SplitText, MorphSVG, DrawSVG…) free for commercial
use, effective 30 April 2025, and AI-generated GSAP code is explicitly allowed
([gsap.com/standard-license](https://gsap.com/standard-license)). Current release is 3.15.1
(2026-11-04). It is still not wired into `engine/`. Do the `K.gsap` bridge with a paused timeline
and `tl.time(t)`: it gives us SplitText word reveals on the VO word times, DrawSVG for leader
lines and MorphSVG for "one thing becomes the next", which are the three motions that most
separate premium explainer graphics from template ones. If HyperFrames is adopted, the same GSAP
code runs in both places.

### 2.3 gl-transitions: borrow two, not the pack

The collection is clean (MIT, one spec, CI that renders every port) and now ships an
`@gl-transitions/remotion` package and an Agent Skill ([README](https://github.com/gl-transitions/gl-transitions)).
But most of its 100+ effects are exactly the showy transitions `anti-ai-look.md` §2.4 warns
against (cube, swirl, page curl, glitch memories). Our `transitions.js` already covers the
documentary set (cuts, dissolves, match cuts, whip, push, luma wipe, light leak, film burn, ink
bleed). Worth porting as GLSL into `transitions.js`: a **directional warp** (a motion-matched
alternative to the whip) and **CrossWarp** (a softer match-dissolve). We already have a luma wipe. For transitions between separately rendered segments, `xfade-easing` (MIT) adds eased
and GLSL-ported transitions to stock ffmpeg `xfade` without a custom ffmpeg build
([repo](https://github.com/scriptituk/xfade-easing)).

### 2.4 Remotion: the mature option we shouldn't take

Remotion is the most mature code-to-video stack (Lambda, Player, 4.0.540 on 2026-11-02, a
skills repo for agents) and its quality ceiling is high. We skip it because (1) it is a second
renderer that would duplicate `render.mjs`, `transitions.js` and `motion.js` in React; (2) its
licence is free only while the business has ≤3 employees, and automated rendering then costs
$0.01 per render with a $100/month minimum; (3) a 5.0 licence change is announced in the LICENSE
file. Its open ideas (transition presentations, the `<Sequence>` model) are already reflected in
our engine and in HyperFrames.

### 2.5 Motion Canvas, Revideo, Manim: great tools, wrong shape

- **Motion Canvas** is lovely for vector explainers but editor-first, and its last package release
  was December 2024. **Revideo** forked it to add headless rendering, and is now tied to one
  company's product. Both would be a parallel engine with its own scene model.
- **Manim** is the best tool on earth for animating mathematics, and the 3Blue1Brown vocabulary
  (Write, Transform, Indicate, LaggedStart) is already our motion grammar (`visual-craft.md` §4).
  Use Manim CE only if an episode needs real equations; render the beat with a transparent
  background and composite it like any other RGBA layer, recoloured to `LK.palette`.

### 2.6 Lottie and Rive: technically fine, aesthetically off

Both are seekable or close to it, and dotLottie (ThorVG) is actively maintained. The problem is the
content: free Lottie and Rive libraries are flat UI and character motion, the look that reads as
"stock explainer". Keep Lottie for one case: a designer hand-animates an on-style element
(e.g. a hand-drawn annotation set) in After Effects and exports it. Rive's editor is proprietary,
so we can't generate or edit its files from code.

### 2.7 After-Effects-like desktop tools

Natron (GPL-2.0), Friction and Glaxnimate (GPL-3.0), Blender's compositor and the MLT-based
editors are real tools, but they're GUI-first. Our compositing (`post.js`: DOF, bloom, god rays,
lens effects) and finish (ffmpeg halation, LUT, grain, vignette) are already code. **Blender** is
the exception worth keeping in mind as an offline **asset** tool (modelling, baking textures and
light maps, then exporting glTF), not as a renderer: Cycles on this CPU would cost minutes per
frame (`render-speed.md`).

### 2.8 Kinetic typography and transition "packs"

- **Code, not packs.** GSAP SplitText (free) or anime.js `splitText` (MIT) give word/line/char
  reveals tied to VO timings; HyperFrames' `kinetic-type-beats` blueprint and its text-effect list
  are good references. Paid After Effects template packs (Envato, Motion Array) are proprietary,
  can't be driven from code, and are the most recognisable "template" look on YouTube. Avoid.
- **Type rules stay ours:** Instrument Serif / Plex Mono caps / Archivo Narrow numerals, arrive on
  the word, corners and edges (`rules.md` #18, #60).

### 2.9 LUTs, grain and colour

No change to `animation-libraries.md` #8: write our own `.cube` LUTs. Do it with
**colour-science** (BSD-3) for the maths (log encodings, Oklab, gamut mapping) and keep the files
versioned. **OpenColorIO** (BSD-3) matters only if we start mixing in camera footage with its own
log profile. Grain stays procedural and seeded in the finish; downloadable "film grain overlay"
packs mostly have unclear licences and visibly loop.

### 2.10 Open SFX and music with clear licences

Already researched: `docs/library/sound-and-music.md` §5 (public-domain recordings, Freesound CC0,
Free Music Archive, Musopen, Pixabay Music, Incompetech CC-BY, the YouTube Audio Library and
Content ID), `asset-sources.md` (Sonniss GDC bundle, Freesound API, BBC ⛔) and
`animation-libraries.md` #20–21 (Kenney CC0, BigSoundBank, ZzFX). Our procedural `score.py` and
`sfx.py` stay the first choice. Rule from `anti-ai-look.md` §2.6: no AI-generated music.

---

## 3. Recommendation

**Adopt, in this order:**

1. **GSAP 3.15 bridge in `engine/stage.html`** (half a day). The cheapest, biggest step for type
   and annotation quality, already planned, now licence-confirmed. Pin and vendor 3.15.1.
2. **HyperFrames as the 2D overlay renderer, after a one-day pilot** (§2.1). Apache-2.0, the same
   seek-per-frame Chrome + ffmpeg architecture as ours, alpha output, a linter for determinism,
   agent skills we already have, and a very active project. It lets agents build chapter cards,
   charts and kinetic type faster without touching the 3D engine. Restyle every registry block.
3. **Two gl-transitions shaders ported into `transitions.js`** (hours): directional warp and
   CrossWarp. Only motivated, quiet ones.

**Avoid:** Remotion (licence and duplication), Motion Canvas and Revideo (parallel engines, stalled
or single-company), Rive (proprietary authoring), stock Lottie and AE template packs (template
look), Natron/Friction/Glaxnimate/NLEs (GUI-first), editly (stalled), and any "free LUT" or grain
pack without a clear licence.

**Watch:** HyperFrames 1.0 (API stability), Theatre.js (dormant), Manim CE (only for maths).

---

## 4. Sources (accessed 2026-11-04)

Repos (stars and last push via ungh.cc): heygen-com/hyperframes, remotion-dev/remotion,
motion-canvas/motion-canvas, midrender/revideo, ManimCommunity/manim, 3b1b/manim,
theatre-js/theatre, greensock/GSAP, juliangarnier/anime, motiondivision/motion,
airbnb/lottie-web, LottieFiles/dotlottie-web, Samsung/rlottie, thorvg/thorvg, rive-app/rive-wasm,
gl-transitions/gl-transitions, gre/gl-transition-libs, scriptituk/xfade-easing,
transitive-bullshit/ffmpeg-gl-transition, NatronGitHub/Natron, friction2d/friction,
mltframework/mlt, KDE/kdenlive, olive-editor/olive, mifi/editly, diffusionstudio/core,
etro-js/etro, AcademySoftwareFoundation/OpenColorIO, colour-science/colour, blender/blender.
Registries: npm (`hyperframes`, `remotion`, `@motion-canvas/core`, `@revideo/core`,
`@theatre/core`, `gsap`, `animejs`, `motion`, `lottie-web`, `@lottiefiles/dotlottie-web`,
`@rive-app/canvas`, `gl-transitions`, `editly`, `@diffusionstudio/core`); PyPI (`manim`,
`manimgl`, `colour-science`). Licences: each repo's LICENSE file; Remotion LICENSE.md and
remotion.pro/license; gsap.com/standard-license. Docs: HyperFrames README and FAQ
(hyperframes.heygen.com), the `hyperframes-*` skills on branch `claude/blissful-dirac-nlvgjk`,
the gl-transitions README, the Revideo README.
