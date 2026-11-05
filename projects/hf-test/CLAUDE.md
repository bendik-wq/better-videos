# projects/hf-test: HyperFrames engine test (MAINSPRING)

A 12 s test of HyperFrames 0.9.17 (HeyGen, Apache-2.0) as a picture engine for ep10.
The findings are in `docs/library/hyperframes-engine-test.md` and the craft notes in
`docs/library/hyperframes-craft.md`. The stock vendor CLAUDE.md/AGENTS.md was replaced on purpose.

Rules for working here:
- Local, free commands only: `check`, `lint`, `snapshot`, `render`, `measure *`, `audio`.
- Never run `publish`, `cloud`, `reverse`, `templates`, `login`/`auth`, `media-use generate` or
  any HeyGen-billed engine. Never sign in. Keep telemetry off (`npx hyperframes telemetry disable`)
  and do not send any "usage beacon".
- Don't run `skills update` or install vendor skills into this repo.
- Pin the CLI (`hyperframes@0.9.17`). Vendor every font and script under `assets/`: no network at
  render time.
- Compositions must be pure functions of time: no `Date.now()`, `Math.random()` or fetches.
- Style: `docs/library/animation-study/STYLE-BIBLE.md` (Paper & Spring). Our own characters and
  palette only. Never copy another creator's characters, palette signature, logo or names.
