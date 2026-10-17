# Bright style: tools, repos and assets to build it

Companion to [STYLE.md](STYLE.md). Every entry gives its URL, licence, GitHub stars (from the GitHub search API,
**2026-10-17**), **how it plugs into our engine** and a priority. Nothing here was installed (disk:
~11 GB free). Read with `docs/research/animation-libraries.md` and `docs/research/asset-sources.md`.
Those files already cover pmndrs/postprocessing, N8AO, UAL, CMU mocap, GSAP, flubber, Depth Anything,
Poly Haven, ambientCG, Kenney, Quaternius, Sketchfab, Natural Earth and OSM, so here they're only
cross-referenced.

**Priority:** **P0** = do next (directly unlocks the house blend). **P1** = soon. **P2** = nice to have. **Skip** = not for us, with the reason.
**Licence:** "verified" = from the GitHub API licence field or the vendored LICENSE file; otherwise
"[check]" (from the project page or from memory; confirm before you ship).

---

## Top 10 (in order)

| # | Resource | Why | Priority |
|---|---|---|---|
| 1 | **three.js built-ins**: `PCFSoftShadowMap`/VSM, `HemisphereLight`, `Fog`, `RoundedBoxGeometry`, `Sky`, PCSS example | Everything the clay look needs is already in `node_modules/three`; the prototype uses only these + post.js | P0 (done in `bright-lab`) |
| 2 | **N8AO** (already vendored) | Contact AO is what sells clay models | P0 (in use) |
| 3 | **pmndrs/postprocessing** `ToneMappingEffect` NEUTRAL/AGX + DOF (vendored) | Neutral keeps whites white; DOF on 85 mm = tilt-shift miniature | P0 (in use) |
| 4 | **OpenFreeMap / OpenMapTiles "Positron" + "Bright" styles** + **MapLibre GL JS** | Free, keyless vector basemaps in a bright style → texture for map slabs | P1 |
| 5 | **Protomaps basemaps + PMTiles** (flavours light / white / grayscale) | One-file regional extracts, offline and deterministic | P1 |
| 6 | **Overture Maps buildings / OSM footprints** | Real building footprints → our clay city for real places | P1 |
| 7 | **Kyutai Pocket TTS** | MIT, ~100M params, runs at 2.3–2.5× real time on a 4-vCPU box, voice cloning: the most practical Kokoro upgrade | P1 (A/B) |
| 8 | **takram three-geospatial** (atmosphere) | Physically based sky and aerial perspective for the world kit's bright tod | P2 |
| 9 | **three-gpu-pathtracer** | Path-traced clay stills for thumbnails (hoog-quality soft light) | P2 (thumbnails only) |
| 10 | **remotion-dev/skills `remotion-maps`** + **heygen hyperframes** | Agent-skill patterns for map animation and HTML→video; mine for ideas, don't adopt | P2 (read only) |

---

## 1. Agent skills and video frameworks

| Resource | URL | Licence | Stars | How it plugs in | Priority |
|---|---|---|---|---|---|
| Anthropic Agent Skills (official) | https://github.com/anthropics/skills | Apache-2.0 for most example skills [check per skill] | 181,697 | Format reference for our `.claude/skills/*` (frontmatter, progressive disclosure). No video skill in it; `canvas-design` and `algorithmic-art` are the closest | P2 (reference) |
| Remotion Agent Skills | https://github.com/remotion-dev/skills | not stated on the page [check] | 5,272 | 12 skills. `remotion-maps` (MapLibre/Mapbox/Cesium flyovers, animated routes and markers) is the one worth reading. Port its route draw-on and marker timing ideas into `motion.js`/`map.js`. Remotion itself is React; we don't adopt it | P2 (read) |
| Remotion | https://github.com/remotion-dev/remotion | Remotion License: free for individuals and companies of up to 3 people, company licence above that [check] | 64,696 | Not needed: our `render.mjs` already does deterministic headless-Chromium frames → ffmpeg | Skip |
| HyperFrames (HeyGen) | https://github.com/heygen-com/hyperframes | Apache-2.0 (verified) | 65,667 | "Write HTML. Render video. Built for agents": the same architecture as ours (Puppeteer + GSAP + ffmpeg). Worth reading for its agent-facing API and MCP design; nothing to import | P2 (read) |
| Claude Code video toolkit | https://github.com/digitalsamba/claude-code-video-toolkit | MIT (verified) | 2,260 | Remotion + TTS (Qwen-TTS, ElevenLabs) skills for Claude Code. Its TTS wiring may be useful for a Qwen3-TTS/Pocket TTS adapter in `voice.py` | P2 |
| Motion Canvas | https://github.com/motion-canvas/motion-canvas | MIT [check] | 19,368 | 2D code-driven animation (generator timelines). Kurzgesagt/PolyMatter-style flat scenes. We already have `motion.js` + the canvas kit; borrow its `tween`/signal ideas only | Skip |
| Theatre.js | https://github.com/theatre-js/theatre | core Apache-2.0, studio AGPL-3.0 [check] | 12,776 | Keyframe editor for three.js. Useful only if a human wants to hand-key camera paths; `cine.path` already covers our needs, and its studio is AGPL | Skip |

## 2. three.js: sky, atmosphere, shadows, AO, tilt-shift, clay

| Resource | URL | Licence | Stars | How it plugs in | Priority |
|---|---|---|---|---|---|
| three.js core + `examples/jsm` | https://github.com/mrdoob/three.js | MIT | 116,533 | Already installed. Use `RoundedBoxGeometry` (soft model edges, catches a highlight line like hoog's models), `Sky` (Preetham, already used by the world kit), `webgl_shadowmap_pcss` (PCSS soft shadows: copy its `shadowmap_pars_fragment` patch for contact-hardening shadows), `VSMShadowMap` (soft, cheap blur; watch light-bleed), and the `HorizontalTiltShiftShader`/`VerticalTiltShiftShader` (a cheap screen-space tilt-shift if DOF is too slow) | P0 |
| N8AO | https://github.com/N8python/n8ao | CC0-1.0 (verified, `engine/vendor/n8ao-LICENSE`) | 502 | Vendored; `post.js { ao: { radius: 10 (m, city), intensity: 3 } }`. For clay, use `color` 0x2a3440 (blue-grey occlusion) instead of black | P0 (in use) |
| pmndrs/postprocessing | https://github.com/pmndrs/postprocessing | Zlib (verified, vendored) | 2,887 | Vendored 6.39.5. `ToneMappingMode.NEUTRAL`/`AGX` (`post.js tone: 'neutral'`), DOF for tilt-shift, `LUT3DEffect` if we ever grade in-browser instead of in ffmpeg | P0 (in use) |
| pmndrs/drei (shader source only) | https://github.com/pmndrs/drei | MIT [check] | 9,970 | React, so don't import it. But `SoftShadows` (a PCSS shader-chunk patch), `ContactShadows` (a blurred depth render on a plane, which is exactly the drop shadow under a floating diorama) and `AccumulativeShadows` are short GLSL/JS files we can port to vanilla in about 50 lines each | P1 (port ContactShadows) |
| takram three-geospatial | https://github.com/takram-design-engineering/three-geospatial | MIT (page) | 1,740 | `@takram/three-atmosphere` (Bruneton precomputed scattering: sky, aerial perspective, sun and sky light), `@takram/three-clouds`. It works on our curved-earth world frame. Use it to replace `sky.js` + haze for physically right bright skies. Precomputed LUTs are small; check that it runs on WebGL2 llvmpipe before you adopt it. Install via npm (MBs, not GBs) | P2 |
| 0beqz realism-effects | https://github.com/0beqz/realism-effects | MIT [check] | 1,736 | SSGI and TRAA. **Too heavy for CPU WebGL** (multi-pass, temporal accumulation breaks our determinism) | Skip |
| three-gpu-pathtracer | https://github.com/gkjohnson/three-gpu-pathtracer | MIT [check] | 1,914 | Path-traced clay at true soft-shadow quality, offline: thumbnails and hero stills only (hundreds of samples; minutes per frame on llvmpipe). Uses `three-mesh-bvh` | P2 (thumbnails) |
| three-mesh-bvh | https://github.com/gkjohnson/three-mesh-bvh | MIT [check] | 3,518 | Bake per-vertex AO / bent normals for the clay city once (deterministic, zero per-frame cost), so N8AO can stay at `low` | P2 |

## 3. Free 3D models and materials (CC0 first)

| Resource | URL | Licence | Stars | How it plugs in | Priority |
|---|---|---|---|---|---|
| Poly Haven (HDRIs, textures, models) | https://polyhaven.com · API https://github.com/Poly-Haven/Public-API | CC0 assets; API: say "Powered by Poly Haven" | 63 (API repo) | Already used (`assets/hdri`, `assets/pbr`). For the bright look use a **clear-sky noon HDRI at 2k** (`kloofendal_48d_partly_cloudy_puresky`, `qwantani_noon_puresky` [check names via the API]) for IBL fill instead of `modern_buildings` | P1 |
| KayKit City Builder Bits | https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0 | CC0 [check: KayKit packs are CC0] | 39 | Low-poly roads, buildings, cars, trees as glTF; recolour to clay `#f4f4f1` and use for miniature street-level shots | P1 |
| Kenney City Kit (Commercial/Suburban/Roads) | https://kenney.nl/assets | CC0 | n/a | As above; already listed in `asset-sources.md` | P1 |
| Quaternius buildings/vehicles | https://quaternius.com | CC0 | n/a | Clay-friendly low-poly hero objects (ships, planes, trains) for Primal-style dioramas | P1 |
| Overture Maps buildings | https://github.com/OvertureMaps/data · https://overturemaps.org | ODbL (OSM-derived buildings) / CDLA-Permissive-2.0 (other themes) [check per theme] | 1,174 | GeoParquet footprints + heights for any city → `engine/world/bake.py`-style step that writes instanced clay boxes. Fetch one bbox with DuckDB (`read_parquet('s3://overturemaps-us-west-2/...')`); keep only that city (MBs). Credit "© OpenStreetMap contributors, Overture Maps Foundation" | P1 |
| OSM via Overpass | https://overpass-api.de | ODbL | n/a | Small extracts of `building=*` with `height`/`building:levels`; it was blocked from this sandbox before (`asset-sources.md`), so run it locally | P1 |
| Smithsonian 3D (CC0 scans) | https://3d.si.edu | CC0 per item | n/a | Hero objects (aircraft, artefacts) turned clay for void shots | P2 |

## 4. Maps in a bright style

| Resource | URL | Licence | Stars | How it plugs in | Priority |
|---|---|---|---|---|---|
| MapLibre GL JS | https://github.com/maplibre/maplibre-gl-js | BSD-3-Clause [check; API shows NOASSERTION] | 11,880 | Render a styled basemap in the stage page (it's WebGL and deterministic if we set the camera per frame and wait for `idle`), then copy it to a texture for `map.js` slabs or use it as a full-frame layer. Light fonts/glyphs must be local for determinism | P1 |
| OpenFreeMap | https://openfreemap.org · https://github.com/hyperknot/openfreemap | MIT; data © OSM, © OpenMapTiles | 6,222 | Free, keyless tiles, styles **Positron** (white/grey; the hoog/B1M base), **Bright**, **Liberty**, **3D**. Offline: ≤3,000 tiles / 50 MB per download; cache per episode under `projects/<p>/assets/tiles/`. Credit on screen | P1 |
| OpenMapTiles styles: OSM Bright, Positron | https://github.com/openmaptiles/osm-bright-gl-style · https://github.com/openmaptiles/positron-gl-style | BSD-3 code, CC-BY 4.0 design [check] | 256 / 144 | Starting points for our own `bright-model` style JSON (land `#ece3d1`, water `#7cc4c0`, roads white, labels navy) | P1 |
| Protomaps basemaps + PMTiles | https://github.com/protomaps/basemaps · https://github.com/protomaps/PMTiles · CLI https://github.com/protomaps/go-pmtiles | BSD-3 code; data ODbL; styles CC0 [check] | 757 / 3,086 / 612 | `pmtiles extract https://build.protomaps.com/<date>.pmtiles city.pmtiles --bbox=...` gives one small file per place (no server, offline, deterministic). Flavours `light`, `white`, `grayscale` match the clay look; serve it through `render.mjs`'s static server | P1 |
| VersaTiles style toolkit | https://github.com/versatiles-org/versatiles-style | MIT (verified) | 114 | Programmatic MapLibre styles ("colorful", "graybeard", "neutrino") with recolour helpers; quick way to generate `bright-model` map styles | P2 |
| Natural Earth (vector + shaded relief rasters) | https://github.com/nvkelso/natural-earth-vector · https://www.naturalearthdata.com/downloads/10m-raster-data/ | Public domain | 2,247 | Already used (`look-lab/assets/hormuz.json`). Add **NE2/HYP shaded relief** rasters (public domain) as the texture on `mapSlab` land for RealLifeLore-style relief | P0 (relief texture) |
| tippecanoe (felt) | https://github.com/felt/tippecanoe | BSD-2-Clause (verified) | 1,623 | Build our own vector tiles from GeoJSON (borders, routes) if MapLibre becomes the map layer | P2 |
| CesiumJS | https://github.com/CesiumGS/cesium | Apache-2.0 [check] | 15,846 | Google-Earth-like globe flyovers (Neo). Heavy, and photoreal 3D tiles need tokens and terms; our world kit + `engine/imagery` already do this | Skip |
| deck.gl | https://github.com/visgl/deck.gl | MIT (verified) | 14,678 | Data layers (arcs, hexbins) over MapLibre; overkill next to `motion.js` | Skip |

## 5. LUTs and grade

| Resource | URL | Licence | How it plugs in | Priority |
|---|---|---|---|---|
| Our own generator, `engine/looks.js` | in repo | ours | Add the `bright-model` preset from STYLE.md §13.2 and run `node engine/looks.js write bright-model`. Generated LUTs beat downloaded packs: documented curves, no licence risk (`animation-libraries.md` §8 reached the same conclusion) | P0 |
| Blender AgX / Khronos PBR Neutral reference | https://github.com/KhronosGroup/ToneMapping (PBR Neutral spec) · https://github.com/sobotka/AgX | Apache-2.0 / [check] | We already have both in postprocessing; use them as the scene tone map before the LUT | P0 (in use) |
| Free LUT packs (RocketStock, etc.) | various | mixed, often "free with email", not CC | No: unclear licences and none are built for clay whites | Skip |

## 6. TTS voices better than Kokoro (open weights)

Kokoro (`hexgrad/kokoro`, Apache-2.0, 9,397 stars, 82M) is our baseline: CPU real time, no cloning.
Weight licences matter more than code licences here. **Before you ship, check the Hugging Face model card for
commercial use.**

| Model | URL | Code / weights licence | Stars | CPU on our box? | How it plugs in | Priority |
|---|---|---|---|---|---|---|
| **Kyutai Pocket TTS** | https://github.com/kyutai-labs/pocket-tts | MIT code (verified); weights: per-voice licences page [check] | 9,915 | **Yes**: ~100M params, 2.3–2.5× real time on 4 vCPU per its README; install ~200 MB with the CPU torch index | New `say_pocket()` in `engine/voice.py` (`TTSModel.load_model()`, `get_state_for_audio_prompt(wav)`, `generate_audio`). Clone a licensed narrator sample. Keep the model loaded across lines | **P1** |
| Kitten TTS | https://github.com/KittenML/KittenTTS | Apache-2.0 (verified) | 16,109 | Yes (tiny, CPU-first) | Quality likely below Kokoro; A/B only | P2 |
| Neuphonic NeuTTS (Air) | https://github.com/neuphonic/neutts | "Other" (verified NOASSERTION) [check] | 6,313 | Yes (on-device, GGUF) | Cloning on CPU; check the licence before use | P2 |
| Qwen3-TTS | https://github.com/QwenLM/Qwen3-TTS | Apache-2.0 (verified) | 13,828 | Slow on CPU [check size] | Voice design from a text prompt and cloning; best run on a GPU box offline, then commit the WAVs | P2 |
| Resemble Chatterbox | https://github.com/resemble-ai/chatterbox | MIT (verified) | 27,022 | Too slow (GPU recommended, ~0.5B) | Excellent expressive narration + cloning; GPU-only for us | P2 (GPU) |
| Microsoft VibeVoice | https://github.com/microsoft/VibeVoice | MIT (verified) | 54,857 | No (1.5B+) | Long-form multi-speaker; GPU | P2 (GPU) |
| Dia, Sesame CSM, Zonos, Orpheus, Higgs Audio v2 | https://github.com/nari-labs/dia · https://github.com/SesameAILabs/csm · https://github.com/Zyphra/Zonos · https://github.com/canopyai/Orpheus-TTS · https://github.com/boson-ai/higgs-audio | Apache-2.0 code (verified); Orpheus weights follow the Llama licence; Higgs weights have their own licence [check] | 19,407 / 14,727 / 7,235 / 6,357 / 8,371 | No (GPU) | Dialogue/conversational models; not narrators | Skip |
| F5-TTS, Fish Speech, IndexTTS2 | https://github.com/SWivid/F5-TTS · https://github.com/fishaudio/fish-speech · https://github.com/index-tts/index-tts | MIT code but **CC-BY-NC weights** (F5); Fish weights CC-BY-NC-SA; IndexTTS custom licence [check] | 15,415 / 33,227 / 24,535 | n/a | **Non-commercial weights**, so not for a monetised channel | Skip |

---

## 7. How these become the house blend: work order

1. **P0, done:** `projects/bright-lab` (clay city, tilt-shift, diorama, void, map slab) using only three.js built-ins, N8AO, postprocessing NEUTRAL and DOF.
2. **P0, next:** add `bright-model` to `engine/looks.js`; add Natural Earth relief to `mapSlab`; port drei `ContactShadows` (vanilla, ~50 lines) for floating dioramas; add OFL fonts (Montserrat 800/900, Inter 500/600, Jost 300/400, Oswald 600).
3. **P1:** the clay mode in `engine/world` (STYLE.md §13.3); Overture/OSM footprints → clay city for real places; Protomaps/OpenFreeMap Positron tiles as a bright map texture; Pocket TTS A/B against Kokoro on one episode script.
4. **P2:** takram atmosphere in the world kit; path-traced thumbnails; read `remotion-maps` and HyperFrames for agent-facing API ideas.
