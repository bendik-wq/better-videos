# Library build brief: world-class shots, motion and scripts

**Goal.** Turn this repo into the best faceless-documentary production system on YouTube. That means:
- **Shots:** a library of about 200 shots and camera moves, including continuous "oner" moves. Example: drop from the sky down to a car on a road, follow the car, follow it to its destination, then pull out until the world becomes a map.
- **Assets:** world-class building blocks.
- **Motion:** smoother, cooler animation.
- **Writing:** a deep library of editing and retention craft.

Everything feeds the skills, so every future episode uses it automatically.

## Read first
- `.claude/skills/make-video/SKILL.md` (engine, flags, cinematic toolkit)
- `docs/style-bible.md`, `docs/research/visual-craft.md`, `docs/research/animation-libraries.md`, `docs/research/retention-playbook.md`
- `engine/cine.js` (C.path C1 rigs, C.moves, C.lens, C.character), `engine/post.js`, `engine/parallax.js`, `engine/kit.js`
- `projects/palantir/` (the latest episode: `scene.js` runtime, `stone.js`, `ops.js`, `geo.js`). This is the current quality bar; beat it.

## Hard rules (the renderer depends on them)
- **Determinism.** Every frame is a pure function of `(t, p)`. Chunks render out of order on 3 workers. Use `K.rng(seed)` instead of `Math.random()`. No wall clock. No state carried from frame to frame, except caches that are rebuilt deterministically.
- **Rendering budget.** We render on CPU (Mesa llvmpipe, 1080p, 60 fps). A plain frame costs about 250 ms. Average shot cost must stay at or below about 450 ms per frame. Measure what you build and offer quality knobs.
- **Licences.** Only use CC0, public-domain or permissive (MIT, Apache, Zlib, BSD) assets and code. Record every asset in `assets/CREDITS.md` with its source URL and licence. No NC/ND licences, no GPL in shipped engine code, and no logins.
- **Look.** Photographic and cinematic, never video-game or "AI slop". Use one motivated key light, haze and darkness as the default, red only for annotation, and the house typography.
- **Camera motion.** Smooth: C1-continuous and eased, with no velocity pops. Every move needs a motivation.
- **Verify by looking.** Render stills or short clips and look at them with the Read tool. Iterate until the result is premium.
- **Shared working tree.** Other agents work in parallel on other files. Edit only the files you own. Commit only those files, then run `git pull --rebase origin claude/blissful-bardeen-c9c7lr` and `git push -u origin claude/blissful-bardeen-c9c7lr`. Never stash, reset or commit other agents' files. Every commit message must end with these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01FMQnPjokachikudnZNL8ev
  ```
- **Research.** Use WebSearch and WebFetch (load them via ToolSearch). Do not use `mcp__github__*`; read github.com through WebFetch instead. Cite sources. YouTube videos can't be downloaded from this box, so use articles, transcripts, breakdowns and talks.
