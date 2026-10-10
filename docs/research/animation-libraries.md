# Animation libraries, packs and tools: what to add to the engine

Researched 2026-10-10. This builds on `asset-sources.md`, which already covers Poly Haven,
ambientCG, Kenney and Quaternius models, Mixamo, Sketchfab, Smithsonian, Natural Earth, OSM,
Freesound, Sonniss and fonts, and on `visual-craft.md`, which covers the shot and motion
vocabulary. Neither topic is repeated here.

**Our constraints, the filter for every row**

- Three.js **r169** in headless Chromium with **SwiftShader** (CPU). No real GPU and no WebGPU.
- **Seekable**: every frame must be a pure function of `t`, because `render.mjs` splits frames
  into chunks across workers. A library that only advances by `delta` has to be re-simulated
  from the shot start (pre-roll) or baked to keyframes.
- **Monetised YouTube**: NC and ND licences are out. GPL is acceptable only for tools we run and
  never ship. CC-BY needs an entry in `assets/CREDITS.json`.
- **Style bible**: photographic and cinematic. No realistic CG humans (silhouettes only), no
  whooshing 3D type, and only one accent colour.

**Legend:** ✅ permissive (MIT, Apache, Zlib, ISC, CC0, PD) · ⚠️ conditions (attribution,
custom licence, size thresholds) · ⛔ NC, ND or a blocking restriction.
"Verified" means this machine fetched the URL (HTTP 200) or ran the code on 2026-10-10.

---

## Measured on this machine (SwiftShader, 4 cores, 1920×1080)

The test scene had 40 shadowed boxes, a 2048² spotlight shadow and fog, using
`postprocessing@6.39.5` and `n8ao@2.0.1` with three r169. Each row is the time per frame
including the base render.

| Pipeline | ms/frame | Added cost |
|---|---|---|
| Plain `renderer.render` | 532 | — |
| + Bloom (mipmap) + Vignette + AgX tone map (one EffectPass) | 918 | +0.4 s |
| + DepthOfFieldEffect (bokeh) | 1972 | +1.4 s |
| + N8AO `Low` | 1527 | +1.0 s |
| + N8AO `Medium` | 1852 | +1.3 s |

Not measured: a second run that added ChromaticAberration+Noise, SMAA and the combined stack
hung under SwiftShader and was killed after 15 minutes. Two notes: `ChromaticAberrationEffect` must
go in its own `EffectPass` (it can't merge with other convolution effects such as SMAA; the
library throws), and a combined AO + DOF + bloom stack should be roughly the sum of the added
costs above, about 3.3 s per frame. Measure it before relying on that estimate.

How to read this: at 24 fps, one minute is 1,440 frames. Plain rendering takes about 13 min
per worker. The full AO + DOF + bloom stack is estimated at about 6× as long. Turn effects on per shot,
not globally: AO for interiors and close-ups, DOF for shots with a focus pull. `--draft` should
switch them off.

**Depth Anything V2 Small** (ONNX, fp32, 99 MB) ran with the `onnxruntime` 1.30 already
installed for Kokoro. It took **0.8 s per image at 518×294** and **3.6 s at 1022×574**, on CPU.
That is fast enough to batch-convert every archive photo in an episode in seconds.

---

## Tier 1: integrate now

### 1. pmndrs/postprocessing: DOF, bloom, god rays, chromatic aberration, LUT, SMAA, AgX
- **Repo:** https://github.com/pmndrs/postprocessing · npm `postprocessing@6.39.5`
- **Licence:** ✅ Zlib (derived three.js code is MIT). No attribution needed in the video.
- **Compatibility:** its peer range is `three >=0.168 <0.187`, so **r169 is supported**.
  Verified: it ran under SwiftShader (table above).
- **Deterministic?** Yes, with two caveats. Call `composer.render(1/fps)` with a fixed delta.
  `NoiseEffect` and `GlitchEffect` animate from accumulated time, so leave grain to the ffmpeg
  finish, which already does it.
- **Payoff:** very high. Real bokeh DOF and rack focus (`DepthOfFieldEffect`, animate
  `cocMaterial.focusDistance` from `t`), physically placed god rays (`GodRaysEffect` from the
  lamp mesh), `LensDistortionEffect` and `ChromaticAberrationEffect` for the "old lens" look,
  `ToneMappingEffect` with AgX, and `SMAAEffect`.
- **Integration:** about half a day. Swap `renderer.render` in `engine/stage.html` for an
  `EffectComposer` (HalfFloat buffer) when a set asks for it, and expose `K.post(scene, camera,
  { dof, bloom, rays, ca })`. Turn `renderer.toneMapping` off and use `ToneMappingEffect`
  instead, or tone mapping is applied twice. Keep halation, grain and vignette in ffmpeg.
- **URLs (verified 200):** `https://cdn.jsdelivr.net/npm/postprocessing@6.39.5/build/index.js`.
  Prefer `npm i postprocessing@6.39.5` and add the importmap entry
  `"postprocessing": "/node_modules/postprocessing/build/index.js"`.

### 2. N8AO: ambient occlusion that grounds objects
- **Repo:** https://github.com/N8python/n8ao · npm `n8ao@2.0.1`
- **Licence:** ✅ The README says CC0, and package.json says ISC. Both are permissive.
- **Deterministic?** **Yes, verified in source.** The `time` uniform is declared but never used
  by the shader. The blue-noise offset uses `frame`, which only increments when
  `configuration.accumulate = true`. Leave `accumulate` off and two renders at the same `t` are
  identical.
- **Payoff:** high. Contact shadows under containers, desks and silhouettes remove the
  "floating CG" look. This is the biggest single realism gain for low-poly kit models.
- **Integration:** about 1 hour after #1. Add `new N8AOPostPass(scene, camera, W, H)` after the
  `RenderPass` and call `setQualityMode('Low')` once (changing it recompiles the shader).
  Importmap gotcha (found while benchmarking): N8AO imports
  `three/examples/jsm/postprocessing/Pass.js`, so add
  `"three/examples/jsm/": "/node_modules/three/examples/jsm/"` to `stage.html`. Cost: +1.0 s
  per 1080p frame on Low.
- **URL (verified):** `https://cdn.jsdelivr.net/npm/n8ao@2.0.1/dist/N8AO.js`

### 3. Quaternius Universal Animation Library (UAL) + Universal Base Characters
- **Links:** https://quaternius.com/packs/universalanimationlibrary.html ·
  https://quaternius.itch.io/universal-animation-library ·
  https://quaternius.itch.io/universal-base-characters
- **Licence:** ✅ **CC0**. The Standard and Pro tiers are free. Source (.blend) is paid, and
  still CC0.
- **Contents:** 120+ clips (8-direction locomotion, jog, sprint, push, crawl, swim, sit, death,
  gun handling, emotes). A second library (UAL2) adds more. FBX, glTF/GLB and Blend. The base
  characters are 6 rigged humanoids.
- **Retargeting:** a third-party report (Cinevva, May 2026) says all the Quaternius "universal"
  packs share one 65-joint UE5-style skeleton, so the clips play on the base characters **with
  no retargeting**. Check this when importing.
- **Deterministic?** Yes. These are ordinary glTF clips, so `cine.character()` with
  `mixer.setTime(t)` already handles them.
- **Payoff:** high. It replaces our two Mixamo-derived example models (`Soldier.glb` and
  `Xbot.glb`, which `asset-sources.md` flags as a redistribution risk) with a CC0 rig and
  ~10× more actions, all shown as silhouettes per the style bible.
- **Integration:** about half a day. Download by hand (itch.io has no stable direct link) into
  `assets/vendor/quaternius/`. In `cine.js`, make the `mixamorig` name strip also handle the
  UE names (`upperarm_r`, `spine_02`…), or add a small bone alias map so `POSE_*` keeps working.

### 4. CMU Graphics Lab mocap (BVH) + three.js `BVHLoader` / `SkeletonUtils.retargetClip`
- **Repo (BVH conversion by B. Hahne/cgspeed):** https://github.com/una-dinosauria/cmu-mocap
  (the original is mocap.cs.cmu.edu, which returned 503 today).
- **Licence:** ⚠️ effectively free for commercial use. CMU's usage text says it is free for
  research and commercial projects. **You may not resell the data itself**, even converted.
  The READMEFIRST says CMU and Bruce Hahne both let you do whatever you want with the data.
  CMU asks for a credit, so add to `CREDITS`: "The data used in this project was obtained from
  mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217."
- **Contents:** ~2,500 clips by 100+ subjects, with an index spreadsheet in the repo. Useful
  documentary actions include walking with a briefcase, sitting, phone calls, pointing,
  arguing, sweeping and climbing.
- **URL pattern (verified 200):**
  `https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/<subj3>/<subj>_<nn>.bvh`,
  e.g. `.../data/001/01_01.bvh`. Root `Hips`, MotionBuilder naming, a T-pose on frame 1, Z-up.
- **Deterministic?** Yes, once converted to an `AnimationClip`.
- **Payoff:** medium to high. Real human weight and timing for silhouettes, which is what
  separates a "documentary figure" from a game idle loop. The data is noisy in places.
- **Integration:** 1–2 days. `BVHLoader` (in r169: `three/addons/loaders/BVHLoader.js`) gives a
  skeleton and clip. Then call `SkeletonUtils.retargetClip(target, source, clip, { names,
  hip: 'Hips', useFirstFramePosition: true })` with a name map onto the Quaternius or Mixamo
  rig. Forum threads show bind-pose mismatches ("squeezed bones"). The fix is to use the BVH
  T-pose frame as the reference, scale the hip translation track, and **bake once** in a Node
  or Chromium script to a GLB we cache. Never retarget at render time. Blender (not installed
  here) is the fallback.

### 5. GSAP 3.15 with SplitText, DrawSVG, MorphSVG and CustomEase (for the DOM/SVG overlay)
- **Repo:** https://github.com/greensock/GSAP · npm `gsap@3.15.0`
- **Licence:** ⚠️ the "Standard 'no charge' licence" (Webflow). **Commercial use, including all
  formerly paid plugins, is free.** The only prohibited use is building a no-code visual
  animation tool that competes with Webflow. Rendering video is not restricted. Webflow may
  change the licence, but versions you already have stay under their original terms, so **pin
  3.15.0 and vendor it**. Not OSI open source.
- **Deterministic?** Yes. Call `gsap.ticker.remove(gsap.updateRoot)` once, then
  `gsap.updateRoot(t)` inside `window.__frame(T)` (documented on the updateRoot page).
  Alternatively build paused timelines and call `tl.time(t)`. Also set
  `gsap.ticker.lagSmoothing(0)`.
- **Payoff:** high for the type layer. SplitText gives word, line and char stagger tied to the
  VO word times we already compute (the manim LaggedStart vocabulary). DrawSVG draws leader
  lines and marker loops on. MorphSVG gives the "one thing becomes the next" Transform
  (bar → counter, dot → node). CustomEase lets us match easing curves exactly.
- **Integration:** about half a day for a `K.gsap` bridge. Keep our own easings for 3D.
- **URLs (verified 200):** `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js`, and in
  the same folder `SplitText.min.js`, `DrawSVGPlugin.min.js`, `MorphSVGPlugin.min.js`,
  `CustomEase.min.js`.

### 6. flubber: path morphing (MIT, pure function of t)
- **Repo:** https://github.com/veltman/flubber · npm `flubber@0.4.2` · ✅ MIT
- `flubber.interpolate(a, b)(t)` returns a path string. `toCircle`, `separate` and `combine`
  handle one-to-many shapes. Deterministic by construction. It is a smaller, OSI-licensed
  alternative to MorphSVG if we want to avoid GSAP's custom licence for morphs.
  Verified URL: `https://cdn.jsdelivr.net/npm/flubber@0.4.2/build/flubber.min.js`
- **Payoff:** medium. Map outline → company logo silhouette, bar → number. **Effort:** 1 hour.

### 7. Depth Anything V2 **Small**: archive photo → depth → parallax "2.5D"
- **Repo:** https://github.com/DepthAnything/Depth-Anything-V2 · ONNX:
  https://huggingface.co/onnx-community/depth-anything-v2-small
- **Licence:** ✅ **Small is Apache-2.0.** ⛔ Base, Large and Giant are **CC-BY-NC-4.0**, so
  never use them.
- **Verified:** downloaded
  `https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx`
  (99 MB; `model_int8.onnx` and `model_fp16.onnx` also exist) and ran it with Python
  `onnxruntime` 1.30 (already installed). Results: **0.8 s at 518 px and 3.6 s at 1022 px on
  CPU.** Input is ImageNet-normalised, NCHW, with sides that are multiples of 14. The output is
  relative inverse depth.
- **Deterministic?** Yes. It runs offline as a preprocessing step, and its output is a texture.
- **Payoff:** very high for this channel. A 1960s photojournalism still becomes a slow push with
  real parallax (the "Kid Stays in the Picture" effect from `visual-craft.md`).
  Two ways to build it:
  (a) a displaced plane: a `PlaneGeometry(…, 256, 144)` with `displacementMap = depth`, a gentle
  0.3–1.0 unit truck, and the camera kept close to its axis so the stretched edges don't show;
  (b) 3–4 layers split by depth thresholds, with the holes filled by a blurred clone plate.
- **Integration:** about 1 day. Add `engine/depth.py` (same pattern as `voice.py`, cached in
  `.cache/depth/`) and `K.photoCard(scene, img, depth, { layers })`.

### 8. LUTs through the ffmpeg finish: build our own `.cube` files rather than downloading packs
- ffmpeg's `lut3d=file=grade.cube:interp=tetrahedral` goes after halation, before grain. It is
  deterministic and costs nothing in GL. `postprocessing`'s `LUT3DEffect` with `LUTCubeLoader`
  (also in three r169 as `LUTPass` and `LUTCubeLoader`) can apply a LUT in-GL if we ever need it
  per shot.
- **Why we write our own:** there is no clean CC0/MIT film-emulation pack on GitHub. Q-DDL's 800
  LUTs are ⚠️ CC-BY 4.0 (and ad-gated downloads). The RawTherapee/Pat David HaldCLUT collection
  (`http://rawtherapee.com/shared/HaldCLUT.zip`) states **no licence for the LUT files**, and
  many are named after Kodak and Fuji trademarks. "Free" LUT sites are aggregators with
  conflicting terms.
- **Plan:** a 40-line Python script writes 33³ `.cube` files for our palettes (*fluorescent*
  Wong Kar-wai green, *sodium*, *1967 faded slide*, *direct flash*) as curves plus a
  split-tone in a log-ish space. We own them, and they are versioned in `assets/luts/`.
  **Effort:** half a day. **Payoff:** high consistency across episodes.

---

## Tier 2: next

| # | What | Repo / URL | Licence | Seekable here? | Payoff | Effort and notes |
|---|---|---|---|---|---|---|
| 9 | **Theatre.js core**: keyframe camera and lights in a GUI, play back by `t` | https://github.com/theatre-js/theatre · `@theatre/core@0.7.2` (verified jsdelivr URL `…/@theatre/core@0.7.2/dist/index.js`) | ✅ core Apache-2.0 · ⚠️ studio **AGPL-3.0** (fine as a local authoring tool, never ship it) | Yes: `sheet.sequence.position = t`; load exported JSON via `getProject(id, { state })` | High for hand-tuned hero shots (rack focus plus camera plus light timing) | 1–2 days. ⚠️ **Stale**: last npm release May 2024, and development "temporarily" moved to a private repo. Use it as a pure-data keyframe player, so a dead project costs us nothing. |
| 10 | **@pmndrs/vanilla**: drei for vanilla three | https://github.com/pmndrs/drei-vanilla · `@pmndrs/vanilla@1.25.0` (verified) | ✅ MIT | Mostly. `CameraShake.update(delta, elapsedTime)` and `Cloud.update(camera, elapsedTime, delta)` take elapsed time; seed `Math.random` because `SimplexNoise` and `Cloud` use it | Medium-high: `SpotLightMaterial` (volumetric cone for the "light is the event" rule), `pcss` soft shadows, `Caustics`, `MeshTransmissionMaterial`, `MeshReflectorMaterial` (wet floor), `Cloud`, `Sparkles`, `Splat` | Hours per feature. Needs the importmap entry `three/examples/jsm/` (imports `Addons.js`). |
| 11 | **three-good-godrays**: screen-space raymarched shafts through real shadow maps | https://github.com/ameobea/three-good-godrays · npm 0.12.1 | ✅ (the repo has a LICENSE file; npm shows none, so check before vendoring) | Yes (no temporal accumulation documented; `blur` option) | High: true occluded shafts from a window or lamp, beyond our `K.lightShaft` | Half a day. Point and directional lights only (not spot). Peer `three <=0.182`, `postprocessing ^6.33`. Raymarching on SwiftShader is costly; benchmark at `raymarchSteps` 30. |
| 12 | **Rapier** physics, baked to clips (ragdoll falls, cascading coins, collapsing stacks) | https://github.com/dimforge/rapier.js · `@dimforge/rapier3d-compat@0.21.0`, plus a `-deterministic-compat` build | ✅ Apache-2.0 | Only if baked: simulate at a fixed 1/120 s step once and store transforms as an `AnimationClip`/JSON keyed by `t` | Medium-high: "money falling", objects with real weight | 1 day for a `bake()` helper. Use the deterministic build so re-bakes match. |
| 13 | **three.js r169 built-ins we don't use yet** | `examples/jsm/objects/Water.js`, `Water2.js`, `Sky.js`, `Lensflare.js`, `animation/CCDIKSolver.js`, `postprocessing/GTAOPass.js`, `loaders/LottieLoader.js` (all verified 200 at r169) | ✅ MIT | Yes: Water takes a `time` uniform you set from `t`; CCDIK is a per-frame solve on top of `mixer.setTime` | Water: harbours and river boats (1967 look). CCDIK: hands on a desk or phone, feet on stairs. | Hours each. CCDIK plus `cine.character().pose()` covers most "reach" needs, so no extra IK library is required. |
| 14 | **sketchpunklabs/ossos**: IK rigs and retargeting between unlike skeletons | https://github.com/sketchpunklabs/ossos | ✅ MIT | Yes (solvers are stateless per frame; bone springs are not, so skip those) | Medium: retargeting CMU onto Quaternius when `retargetClip` falls short; FABRIK, two-bone limb, look-at | 1–2 days, and the API is in flux. Fallback for #4. |
| 15 | **anime.js v4**: MIT alternative to GSAP | https://github.com/juliangarnier/anime · `animejs@4.5.0` (verified `…/dist/modules/index.js`) | ✅ MIT | Yes: `createTimeline({ autoplay: false })` then `tl.seek(ms, true)` (callbacks muted) | Medium: `splitText`, `createDrawable` (line draw-on) and `morphTo` cover most of GSAP | Use it if the GSAP licence is ever a concern. Same integration effort. |
| 16 | **Gaussian splats** (photoreal captured scenes) | https://github.com/sparkjsdev/spark (`@sparkjsdev/spark@2.3.1`, MIT) · https://github.com/mkkellogg/GaussianSplats3D (`@mkkellogg/gaussian-splats-3d@0.4.7`, MIT) | ✅ MIT (each scan has its own licence) | Static scenes yes (sorting depends on the camera only) | Very high when the asset exists: a real trading floor or server hall at photographic fidelity | Spark needs **three ≥0.180** (an engine upgrade). GaussianSplats3D supports ≥0.160 but is unmaintained. SwiftShader sorting of 1M+ splats will be slow, so prototype with a capped splat count. |
| 17 | **three.js `CityGenerator`** (seeded skyscrapers, streets, props) | `examples/jsm/generators/CityGenerator.js` on `dev` (not in r169) | ✅ MIT | Yes (static, seeded) | High for "the city at night" establishing shots | Written for **TSL / WebGPURenderer** (`three/webgpu`). It needs an engine upgrade (WebGPURenderer has a WebGL2 fallback) or a port of its geometry generators to plain materials. Track it. |
| 18 | **MapLibre GL + Protomaps PMTiles** (offline vector basemaps) | https://github.com/maplibre/maplibre-gl-js (`maplibre-gl@6.13.0`, ✅ BSD-3) · https://github.com/protomaps/basemaps | Code BSD-3 · style CC0 · ⚠️ tiles **ODbL**: "© OpenStreetMap contributors" on screen | Yes: `map.jumpTo({ center, zoom, bearing, pitch })` per frame, then await `idle` | High for geography beats (fly from a country to a port to a building) | 1 day, served from a local `.pmtiles`. Simpler maps should stay **d3-geo** (✅ ISC, `d3-geo@3.1.1` verified) with Natural Earth to SVG, which is pure and cheap. Skip deck.gl. |
| 19 | **troika-three-text** (SDF text placed in 3D) | https://github.com/protectwise/troika · `troika-three-text@0.52.5` (verified) | ✅ MIT | Yes after `await text.sync()` at setup (glyph generation runs in a worker) | Medium: type painted on signs, screens and container sides, tracked perfectly by camera moves without `K.toScreen` | Hours. The style bible bans whooshing 3D titles; use it for diegetic text only. |
| 20 | **Kenney audio packs + BigSoundBank** (CC0 SFX to layer under `score.py`) | https://kenney.nl/assets/impact-sounds · https://kenney.nl/assets/sci-fi-sounds · https://kenney.nl/assets/ui-audio (WAV mirror: https://github.com/Calinou/kenney-interface-sounds) · https://bigsoundbank.com | ✅ CC0 (Kenney) · ✅ CC0 / WTFPL / PD, commercial OK, no attribution (BigSoundBank `droit.html`) | n/a (offline mix) | Medium: real transients (clunks, latches, paper, keyboard) layered over the synthesised hits | Hours. Put them in `assets/vendor/sfx/` and log in CREDITS. BigSoundBank's realistic foley is the better fit than Kenney's game-y sounds. |
| 21 | **ZzFX** (procedural SFX in a few lines) | https://github.com/KilledByAPixel/ZzFX · `zzfx@1.4.0` (verified) | ✅ MIT | Yes (pure from parameters) | Low-medium: UI ticks, blips for data counters | Port the generator to numpy in `score.py`. Prefer it over jsfxr, whose licence file 404s today. |

---

## Tier 3: skip, and why

| What | Licence / blocker | Why skip |
|---|---|---|
| **Text-to-motion models**: MoMask (https://github.com/EricGuo5513/momask-codes), MDM (https://github.com/GuyTevet/motion-diffusion-model), T2M-GPT, MotionGPT (https://github.com/OpenMotionLab/MotionGPT) | Code is MIT, **but the weights are trained on HumanML3D, which is built from AMASS** ⛔ (AMASS licence: non-commercial only, and explicitly bans "production of other artefacts for commercial purposes"). SMPL needs a separate commercial licence from Meshcapade. | Motions from these models are a legal grey area for a monetised channel. MoMask does run on CPU (its WebUI notes, 2024-08), but torch isn't installed here and output is a 22-joint skeleton that needs foot IK. Use CMU BVH plus Quaternius clips instead. Revisit only for a model trained on permissively licensed mocap. |
| **AMASS** and anything SMPL-based (DanceDB, Motion-X…) | ⛔ non-commercial (https://amass.is.tue.mpg.de/license.html) | Same reason as above. |
| **LAFAN1** (Ubisoft) https://github.com/ubisoft/ubisoft-laforge-animation-dataset | ⛔ **CC BY-NC-ND 4.0** | It is high-quality locomotion data, but both NC and ND apply. |
| **Bandai Namco Research Motion dataset** https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset | ⛔ **CC BY-NC 4.0** (verified in the dataset's LICENSE file) | It has 15 styles (angry, tired, proud…), which would be lovely, but NC rules it out. |
| **100STYLE** https://zenodo.org/records/8127870 | ✅ **CC BY 4.0** (verified on Zenodo; `100STYLE.zip` is 1.5 GB) | **Not a licence skip; parked.** It has 100 locomotion styles in BVH on a custom skeleton. Retargeting cost is high, and we need actions more than walk styles. Credit "100STYLE, Mason et al." if we use it. |
| **Ready Player Me** | Service shut down 2026-01-31 (Netflix acquisition). No open successor. | Also off-style, since we don't show realistic or stylised faces. Quaternius base characters cover our silhouettes. |
| **Mixamo** | ⚠️ Adobe terms (no raw redistribution, login only) | Already flagged in `asset-sources.md`. UAL (CC0) replaces it. |
| **mannequin.js** https://github.com/boytchev/mannequin.js | ⛔ **GPL-3.0** | It would end up in the page code we render. The Quaternius rigs are better. |
| **three-ik** (npm 0.1.0, 2018) | MIT, but abandoned | CCDIKSolver (in r169) and ossos cover it. |
| **three-gpu-pathtracer** https://github.com/gkjohnson/three-gpu-pathtracer | MIT | Now **requires WebGPU** and three ≥0.185. Path tracing on SwiftShader would take minutes per frame anyway. |
| **realism-effects** (SSGI, TRAA, motion blur) https://github.com/0beqz/realism-effects | MIT | Last npm release May 2023. It depends on **temporal reprojection across consecutive frames**, which breaks our any-order chunked rendering. |
| **@takram/three-clouds / three-atmosphere** | MIT | They require React Three Fiber, React 19 and three ≥0.170. Their volumetric raymarch is too heavy for CPU. Our sprite `cloudLayer` and the vanilla `Cloud` (#10) are enough. |
| **three.quarks** https://github.com/Alchemist0823/three.quarks | MIT | It only advances by `update(delta)` with `Math.random`, so it isn't seekable without full re-simulation per chunk. Latest needs three ≥0.182 (0.16.0 supports ≥0.165). Our stateless `K.dust`-style particles (position = f(seed, t)) fit the engine better. Reconsider for complex smoke or sparks, with a seeded RNG and pre-roll. |
| **three-nebula** | MIT | Same delta-only simulation problem, and its ESM build path 404s on jsdelivr. |
| **fft-ocean** https://github.com/jbouny/fft-ocean | MIT | Old, and uses float render targets that are slow on SwiftShader. `Water.js` (r169) is enough for harbours. |
| **Motion Canvas / Revideo / Remotion** | MIT / MIT / ⚠️ Remotion is free only for individuals and companies of **≤3 people**, otherwise a paid company licence | These are whole rendering engines that duplicate `render.mjs`. Motion Canvas's last npm release was Feb 2025. Mine their component ideas only (e.g. `reactvideoeditor/remotion-templates`, MIT), but they are React-bound. |
| **manim-web** https://github.com/maloyan/manim-web | MIT | A young project (~370 stars) with uncertain seek and export support. GSAP or anime.js plus flubber already give us Write, Transform and LaggedStart. |
| **Lottie** (lottie-web 5.13.0 MIT, dotLottie 0.81 MIT, LottieFiles "Lottie Simple License", commercial OK) | ✅ | It is technically perfect (`anim.goToAndStop(frame, true)` is seekable), but free Lottie libraries are flat, cartoony UI motion that the style bible rules out. Keep it in mind for one-off hand-drawn annotation if a designer makes it. |
| **Rive** (`@rive-app/canvas` MIT runtime) | Runtime MIT; authoring is in the proprietary Rive editor | State-machine and interactivity value is lost on a video. There is no documented seek for export, and the look doesn't fit. |
| **Typing and text effect libs**: TypeIt | ⛔ **GPL-3.0** | `K.typeOn` and SplitText cover it. |
| **Popmotion / Motion One (`motion`)** | MIT | Popmotion is abandoned (2022). Motion is built for UI and React, with a rAF-driven model that is less seek-friendly than GSAP or anime.js. |
| **Film LUT packs** (Q-DDL CC-BY, "free" aggregator packs, RawTherapee HaldCLUTs) | ⚠️ attribution, unclear or no licence, trademark names | See #8: we write our own LUTs. |
| **BBC SFX, OpenAIR IRs with NC items, Lots of Sounds API** | ⛔ personal or NC (BBC) · per-item CC, some NC (OpenAIR) · CC0 but the full catalogue is paywalled (Lots of Sounds) | Use Kenney, BigSoundBank and Freesound CC0. For reverb, filter OpenAIR to CC-BY items, or synthesise IRs in numpy. |

---

## Suggested order of work

1. `postprocessing` + N8AO behind a per-shot `post:` param, with drafts off (tier 1 #1–2).
2. `engine/depth.py` + `K.photoCard` for archive photos (#7).
3. Our own `.cube` LUTs in the ffmpeg finish (#8).
4. Quaternius UAL import and a bone alias map in `cine.js`; retire `Soldier.glb` and `Xbot.glb` (#3).
5. A GSAP bridge for overlay type and SVG, with flubber for morphs (#5–6).
6. A CMU BVH → GLB bake script (#4).
7. Then tier 2: SpotLightMaterial cones, a Theatre.js keyframe player, Rapier bakes, MapLibre.

## Sources (all accessed 2026-10-10)

Quaternius UAL page and itch.io; Cinevva blog (UAL skeleton notes, 2026-05); CMU BVH mirror
README and READMEFIRST (una-dinosauria/cmu-mocap); Papers With Code CMU entry; Bandai Namco
dataset LICENSE; LAFAN1 README; Zenodo record 8127870 (100STYLE); AMASS licence page;
HumanML3D, MoMask, MDM and MotionGPT READMEs; three.js forum threads on `retargetClip`;
gsap.com/standard-license and the `gsap.updateRoot` docs; Theatre.js README and core API docs;
anime.js docs (`seek`); remotion LICENSE.md; lottie-web README; LottieFiles licence page;
pmndrs/postprocessing, N8AO (README and `dist/N8AO.js` source), three-gpu-pathtracer,
realism-effects, three.quarks, three-good-godrays, ossos, mannequin.js, manim-web, Spark and
fft-ocean READMEs; npm registry metadata for every package version and licence quoted;
Depth-Anything-V2 README and the onnx-community model card; Protomaps FAQ; Kenney audio
category; BigSoundBank `droit.html`; OpenAIR licence notes; Ready Player Me shutdown coverage
(Avatar SDK and Genies blogs, 2026).
