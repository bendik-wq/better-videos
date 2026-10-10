# Build brief: Palantir episode sets

The user wants this video to be **dramatically better than episode 1**: cinematic, *smooth as smooth can be*, never AI slop, and never a repeated visual. Fern-like 3D documentary, Villeneuve/Deakins camera language, photographic taste (see `docs/style-bible.md`).

## Read first
- `projects/palantir/SCRIPT.md`: the narration, so you know what each shot must make the viewer feel.
- `projects/palantir/SET-USAGE.md`: every `(set, params)` combination the shot list uses, with the line it plays under. **Your sets must support every combination listed for them.**
- `projects/palantir/project.mjs`: the shot list.
- `.claude/skills/make-video/SKILL.md`, including the "Cinematic toolkit" and speed-flag sections.
- `docs/style-bible.md`, `docs/research/visual-craft.md` (shot vocabulary) and `.claude/skills/shot-design/SKILL.md`.
- `projects/data-rush/scene.js`, `cinema.js` and `broll.js`, for how sets are written (factory → `{ scene, camera, layer, update(t, p), scope? }`).
- `engine/cine.js` (`C.path` C1 rigs, `C.moves.*` presets, `C.lens`, `C.character('UAL', …)`), `engine/post.js` (DOF/AO/god rays/lens) and `engine/parallax.js`.

## Contract
- **Signature.** Your file exports `make<Name>(H)` returning `{ setName(ctx, shot) { … } }`. `H` = `{ THREE, K, C, PP, PX, base, mesh, std, camOrbit, caption, sourceLine, wt, vo0, voEnd, canvasTex, fakeText, makeOrb, props, CAP, SERIF, RED, SODIUM, FLUO, ICE, PAPER }`. See `projects/palantir/scene.js`.
- **Determinism.** Every frame must be a pure function of `(t, p)`; chunks render in any order. No `Math.random()` (use `K.rng(seed)`), no `performance.now()`, no state carried between frames.
- **Word sync.** `wt(shot, 'word')` gives the time the narrator says a word. Key reveals to the words in the VO.
- **Camera.** Smooth and motivated. Use `C.path(...)` or `C.moves.*` with ease in/out, keep the handheld low-frequency, and use real lenses (24/40/65/135mm via `C.lens`). Every shot needs a move with a reason: push in on revelation, pull back on scale, lateral move for parallax, follow-through on motion. No pops, no jerks, no linear moves.
- **Variety.** Each `mode` or `variant` must look clearly different: angle, lens, light, composition. The same set must never read as the same shot twice.
- **Look.**
  - One motivated key light per shot: sodium `#ffa860`, fluorescent green `#58ffa0`, work light `#fff0dc`, or cold monitor blue. Darkness is the default.
  - Haze and light shafts (`K.lightShaft`, `K.dust`).
  - Red `#e0241b` only as annotation.
  - Typography: Instrument Serif for statements, IBM Plex Mono caps for captions and sources, Archivo Narrow Bold for numerals.
  - Captions sit at the edges, never centred lower thirds. Show `params.caption` and `params.source` when given; `caption(layer, text, css)` and `sourceLine(layer, text)` exist.
- **People.** Silhouettes only (UAL mannequin with a matte near-black or suit material). No realistic CG faces.
- **Cost.** About 250 ms/frame for a plain frame on llvmpipe. Post effects cost: DOF low +240 ms, AO +212 ms, god rays +111 ms. Use DOF where a rack focus *means* something (the stone sets, mostly). Keep the average shot under about 450 ms/frame.
- **Scope.** Set `scope: true` on the returned object for the most cinematic sequences (2.39:1 bars), as `cinema.js` does.
- **Look-dev.**
  - Render stills: `node engine/render.mjs projects/palantir --stills=0.2,0.6,0.95 --only=<shotId>`. Check `--help` or the SKILL.md for the exact flags.
  - Look at every still with the Read tool. Iterate until each would hold up as a frame from a high-end documentary.
  - Fix ugly geometry, flat lighting, clipped text and empty frames.
- **Shared tree.** Other agents work in the same tree on other files. Edit only the files you own. Commit only your files (`git add <your files>`), then `git pull --rebase origin claude/blissful-bardeen-c9c7lr` and `git push -u origin claude/blissful-bardeen-c9c7lr`. The commit message must end with these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01FMQnPjokachikudnZNL8ev
  ```
- **Narration timing.** It is being generated now (`projects/palantir/out/` VO cache). If it isn't ready when you need stills, the renderer may synthesize it; that's fine.
