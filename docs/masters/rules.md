# 100 rules for a world-class documentary frame and sequence

Distilled from the master files in this folder, prioritised. Tier **A** (1–25) is non-negotiable on
every shot; tier **B** (26–65) shapes every sequence; tier **C** (66–100) is polish and special
cases. Each rule names its source (file in `docs/masters/`, or `house`) and the engine feature that
executes it. Read with `docs/style-bible.md`, `docs/research/visual-craft.md` §6 and the
`shot-design` skill.

Engine shorthand: `CAM` = `engine/camera.js`, `C` = `engine/cine.js`, `O` = `engine/oner.js`,
`TR` = `engine/transitions.js`, `M` = `engine/motion.js`, `K` = `engine/kit.js`, `P` = `engine/post.js`,
`FT` = `engine/footage.js`, `IM` = `engine/imagery`, `W` = `engine/world`, `LK` = `engine/looks.js`;
catalog ids (`EST-001` ...) are in `docs/shots/catalog.json`.

## Tier A: every shot (1–25)

| # | Rule | Source | Engine |
|---|---|---|---|
| 1 | **Real material first.** Real footage, real aerials, real data; build 3D only for shots no camera could take. | nolan, van-hoytema, arcane-fortiche | `FT.footage`, `IM.terrain`, then `W` / `O.oner` |
| 2 | **One motivated key light.** Every light has a source; everything else is bounce or sky. | deakins, lubezki, style bible | world `tod` sun; `K.keySpot`; never a second key |
| 3 | **One subject, one idea per frame.** If you can't say what the frame is about in five words, cut it down. | pixar, kurzgesagt, disney #3 | `shot-design` plan; `CAM.frameSubject` |
| 4 | **Every camera move has a motivation** (follow, reveal, realise, connect) and starts and ends eased. | fincher, disney #6 | `C.path` accel/decel; `CAM` primitives; `shot-design` "motivation" field |
| 5 | **No velocity pops**: C1-continuous inside a shot, speed carried across match cuts. | disney #6, house | `C.path`, `CAM.seq`, `carry`/`vOut`; `framediff.py` QA |
| 6 | **Scale needs a reference**: a known object small in a vast, sharp frame. | nolan, villeneuve | `EST-003`, `CHR-013`; ships/people at < 3% of frame |
| 7 | **Value structure first**: the subject is the brightest or darkest value; check in greyscale. | ridley-scott, arcane | look-dev stills → greyscale contact sheet |
| 8 | **One look per sequence**; change look only on a story turn (chapter, time jump, point of view). | nolan (Oppenheimer), pixar colour script | `settings.look`, `LK` per sequence |
| 9 | **Light the scene for the look**; a LUT can't turn night into day. | house, look-lab | `LK.tod(look, W.TOD)`, `LK.imagery(look)` |
| 10 | **Red is annotation only**, drawn on, never faded. | style bible | `K.markerLoop`, `M.callout.route`; `palette.accent` |
| 11 | **Cut on a sound or a word.** Nothing changes on screen silently. | edgar-wright, style bible | `beats` (word-timed); `score.transitions` auto sfx |
| 12 | **Shot length follows reading load**: a single object can cut at 2 s; a labelled map needs 5–7 s. | visual-craft, disney #9 | `shot-design` cut-rate targets |
| 13 | **Vary shot length** (never five equal shots in a row). | visual-craft (Cutting) | `pick.mjs --check` |
| 14 | **Suspense = longer holds; release = faster cuts.** | villeneuve | `min` durations; `beats` for the release |
| 15 | **Never the same visual twice.** | house | render.mjs repeated-visual guard |
| 16 | **Source line on every number.** | style bible | `M.data.*` `source`; Plex Mono caps |
| 17 | **Type never sits naked on a bright picture**: dark type on light paper, or light type on a soft shadow plate. | bright mode | `LK.palette(look).plate / plateInk / shadow` |
| 18 | **Captions in corners and edges**, never centred in the lower third. | style bible | overlay layout |
| 19 | **Saturated but never at the gamut edge.** Boost low-chroma colour, cap the boost. | kurzgesagt, bright mode | `LK` `vibrance` + soft `ceiling` |
| 20 | **Skin stays on the skin line.** | bright mode | `LK` skin band (`h 58`, `pull`) |
| 21 | **Blacks rich, not crushed in day; crushed only in noir.** | bright mode | `LK` `floor` (bright-day 0.012, noir 0) |
| 22 | **Keep the sky**: a soft shoulder, never clipped white. | van-hoytema, nolan | `LK` curve shoulder, `satHigh`; world `tod.exposure` |
| 23 | **Deterministic and pure in t.** | house | `K.rng(seed)`, no wall clock |
| 24 | **Look at it.** Stills before animation; contact sheets before renders; frame-diff after. | ridley-scott (boards), deakins (models) | `--stills`, `projects/look-lab/sheet.py`, `framediff.py` |
| 25 | **The technique must disappear.** If the audience notices the move, the move failed. | deakins (1917), spielberg | `O.smoothness`; no gratuitous whips/zooms |

## Tier B: every sequence (26–65)

| # | Rule | Source | Engine |
|---|---|---|---|
| 26 | Build the episode on a **story spine** (once upon a time / every day / one day / because of that ×2 / until finally / ever since). | pixar | `retention-script` outline |
| 27 | Make a **colour script**: one still per chapter, side by side, before building. | pixar | `--stills=0.5` + `sheet.py` strip |
| 28 | **Ticking clock**: a deadline the audience can hear, accelerating across the chapter. | nolan | `score` cue `ticks` / sfx `clock.tick` with rising tempo |
| 29 | **Cross-cut 2–3 strands** toward one climax, each alternation shorter. | nolan (Dunkirk) | `whip` (simultaneous places), `cut`; `shot-design` |
| 30 | **Stillness, then a burst**: hold a quiet wide, then cut hard on the word. | villeneuve | `EST-020` + `cut` + `sub.drop` after the cut |
| 31 | **Silence before the hit**, not on it. Drop the drone 0.5–1.5 s before the impact. | nolan, villeneuve | score cue gap; `impact.boom` after |
| 32 | **Ma**: one 3–5 s breath per chapter, no VO, ambience only, placed before a reveal. | ghibli | no-VO shot with `min`; `wind.amb` / `room.tone` |
| 33 | **Reveal order**: watcher → thing → wide with both. | spielberg | `REV-022` → `REV-002` → `EST-003` |
| 34 | **Withhold, then reveal**: show the effect before the cause. | spielberg, ridley-scott | `REV-003` Boom-down past the occluder, `REV-004` |
| 35 | **The disguised oner**: one move covering 3–4 compositions. | spielberg, cuaron | `O.oner` segments; `ONE-*` |
| 36 | **Environment has the weight of a character**: drift from subject to context mid-shot. | cuaron | `CAM.lookAtShift`, `REV-014` |
| 37 | **Camera moves only when the subject moves.** | fincher | `O.attach`, `CAM.hold` |
| 38 | **Push in when power shifts** (the turn of the argument). | fincher | `CAM.creep` keyed to the word |
| 39 | **Tokens on a board**: high static wides make vehicles into pieces in a game. | villeneuve | `EST-005`, `DAT-009`, `CAM.godRotate` |
| 40 | **Match cuts** link ideas by shape or motion (hull → bar, route → line). | edgar-wright, kubrick (2001) | `TR` `match-cut`, `match-dissolve`, `TRN-011` |
| 41 | **Whip pans for "meanwhile"**, landing on a rehearsed end frame. | edgar-wright, wes-anderson | `TR` `whip`, `TRN-001/002`, `CAM.whipPan` |
| 42 | **Every transition has its sound.** | edgar-wright | `score.transitions`, `TR.meta[name].sfx` |
| 43 | **One-point perspective for systems** (corridors, control rooms, avenues). | kubrick | `CAM.dollyIn` on axis, 18–24 mm |
| 44 | **Planimetric inserts** for documents and objects: frontal, flat, legible. | wes-anderson | `OBJ-004`, `OBJ-016`, `M.callout.doc` |
| 45 | **Silhouette over detail** when a face would be wrong (and we hide faces). | deakins, spielberg | `CHR-001`, `PE.look.rig('backlit')` |
| 46 | **Atmosphere is depth**: haze, smoke, dust in light. | ridley-scott, villeneuve | `tod.hazeDen`, `K.lightShaft`, `K.dust`, `P` `rays` |
| 47 | **Foreground layer** in establishing and reveal shots. | ridley-scott | `EST-022`, `REV-004`, `CAM.parallaxSlide` |
| 48 | **Wide and close, few mids.** | nolan | `shot-design` lens mix: 24–32 mm and 85–135 mm |
| 49 | **Large format feel**: sharp, low grain, true skies in daylight. | van-hoytema | `bright-day` finish (grain 5), `renderScale` 1 on heroes |
| 50 | **Hard sun 30–45° above the horizon, cross or 3/4 back**, sky-blue open shade, warm ground bounce. | greig-fraser, bright mode | `LK.tod('bright-day')` sunEl 36, `ambSky`, `ambGround` |
| 51 | **Sea is turquoise in the shallows, ink-blue offshore**, never cyan-green or slate. | bright mode | `LK` bands h 172→198, h 262 |
| 52 | **Sand golden, foliage olive**, never lemon or game green. | greig-fraser, bright mode | `LK` bands h 88, h 132 |
| 53 | **Daylight finish is gentle**: less vignette, soft halation, low grain. | bright mode | `LK.finish('bright-day')` |
| 54 | **Graphics take their colours from the look.** No ad-hoc hex. | wes-anderson, polymatter | `LK.palette(look)` |
| 55 | **Max 3 colours + red per graphic frame.** | polymatter, kurzgesagt | palette discipline |
| 56 | **Flat depth for 2D sets**: 3–5 layers with value steps and soft shadows. | kurzgesagt | canvas shadows, as in `projects/look-lab` map |
| 57 | **Maps are places the camera flies to.** | johnny harris | `CAM.mapFlyTo`, `DAT-001/002`, `W` map layer |
| 58 | **Map texture says "document"**: paper, grain, drawn-on routes. | johnny harris (youtube.md) | paper overlay stepped at 12 fps; `#marker` filter |
| 59 | **Graphics on twos (12–15 fps), camera on ones.** | spider-verse, vox | `M.onTwos` |
| 60 | **Type arrives on the word, leaves before the next idea.** | apple, vox | `M.text.*` with word times |
| 61 | **Highlight the spoken phrase**, never the whole paragraph. | vox | `M.text.highlight` |
| 62 | **Apple ease**: long deceleration, no bounce on hero objects. | apple-buck-manvsmachine | `C.path` decel 0.6–0.7 |
| 63 | **Follow-through**: secondary elements land 2–4 frames after the primary. | disney #5 | staggered `at` in `M` |
| 64 | **Anticipation before big moves** (3–5% counter-move). | disney #2 | `CAM.seq` short reverse segment |
| 65 | **Arcs, not diagonals**, for landing moves. | disney #7 | `CAM.arcPush`, `CAM.jibArc` |

## Tier C: polish and special cases (66–100)

| # | Rule | Source | Engine |
|---|---|---|---|
| 66 | Pulse under VO sits low; the voice always wins. | nolan | `score` ducking; ticks ≤ −18 dB under VO |
| 67 | Sub-bass felt more than heard for threat. | villeneuve | `score` drone, `sub.drop` |
| 68 | Operatic silence: 2–4 s of room tone in the tensest moment. | villeneuve | score gap + `room.tone` |
| 69 | Contact sound only in airless places (orbit, underwater). | cuaron | no whooshes; `sub.drop`, `room.tone` |
| 70 | Music drops out just before a reveal and returns with it. | spielberg | score cue timing |
| 71 | Motion-sync sound design: every motion graphic has a click or swell. | apple, edgar-wright | sfx `ui.tick`, `swell.reverse` |
| 72 | Insert montages: 0.25–0.5 s per insert, one sound per insert. | edgar-wright | `beats` |
| 73 | Dolly zoom once per episode, on the realisation. | spielberg (Jaws) | `REV-007`, `CAM.dollyZoom` |
| 74 | Snap zoom for comedy or shock only. | edgar-wright | `REV-012`, `CAM.snapZoom` |
| 75 | Slow zoom-out from detail to tableau to show the system around a person. | kubrick (Barry Lyndon) | `CAM.zoomCreep`, `DAT-010` |
| 76 | Symmetry for institutions; break it when power breaks. | kubrick, wes-anderson | centred `lockOff`; then `dutchDrift` |
| 77 | Format change for scale (letterbox → full frame on the hero reveal). | nolan, wes-anderson | `TR` `shape-box`; overlay mattes |
| 78 | Step-printing for memory or a person. | kaminski, style bible | `step: 3`, `trails: 0.4` |
| 79 | Archive in its own look (`archive-warm`), never in the present-day look. | nolan (Oppenheimer) | `LK` `archive-warm`; `PX.photo` treatment |
| 80 | Halftone or print texture only in archive/print contexts. | spider-verse | 2D comp overlay in archive sets |
| 81 | Lens character (CA, distortion) only for archive or "found" footage. | spider-verse, house | `P` `lens: 'vintage'` |
| 82 | Contre-jour with flare for wonder; sun within 30° of the lens axis. | lubezki, kaminski | `tod.flare`; halation per look |
| 83 | Wide lens close to the subject for intimacy with context. | lubezki | 16–24 mm, `REV-009` |
| 84 | Floating camera ≤ 0.03 float; handheld from low-frequency spectra only. | lubezki, house | `C.moves.float`, `K.handheld` |
| 85 | Night is navy, teal and sodium, not black; fill is the key. | michael-mann | `blue-hour` look, `tod.ambSky` |
| 86 | Practicals are the only warm accents at night. | michael-mann | `blue-hour` band h 58 sat 1.16; `W.glowPoints` |
| 87 | Lone figure against the sprawl for isolation. | michael-mann | `CHR-004`, `CHR-007` |
| 88 | Process montage of hands, screens and documents for procedure. | fincher | `OBJ-016`, `OBJ-020`, `M.text.typewriter` |
| 89 | Shape language: danger sharp, safety round. | pixar | icon design |
| 90 | Everything breathes: icons, clouds, water keep moving slightly. | kurzgesagt, disney #8 | `CAM.breathe`, world clouds |
| 91 | Painted, not half-photoreal, when a 3D set can't be real. | arcane-fortiche | matte materials, painted sky |
| 92 | Squash/settle on numbers that slam in (4–6% overshoot). | disney #1 | `M.text.slam`, `M.spring` |
| 93 | Correct lens maths and real scale references. | disney #11 | `C.lens`, `C.frameDistance` |
| 94 | Plan multiple angles of key actions and cut between them on beats. | ridley-scott | 2–3 rigs per action; `beats` |
| 95 | A ma-length hold on the final image of the episode. | ghibli, house | `END-002`, `END-014` |
| 96 | Return to the opening frame at the end (bookend). | house | `END-013` |
| 97 | Bleach-bypass or other strong looks only with a story reason. | kaminski, greig-fraser | add a preset to `LK` |
| 98 | Thumbnail frame comes from a real shot of the video (centred hero). | van-hoytema (IMAX centre), house | `thumbs/make.mjs` (see palantir) |
| 99 | Measure every new technique's ms/frame and offer a quality knob. | house | `?wl=time`, `postq` |
| 100 | Smoothness QA after every final render: no frame-diff spikes inside a shot except deliberate hits. | house | `projects/world-lab/framediff.py` |
