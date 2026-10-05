# better-videos

Documentary videos rendered from code: 3D sets, narration, sound and a film finish. The goal is
Fern's documentary grammar pushed through a specific taste (see `docs/style-bible.md`).

```bash
npm install && pip install piper-tts numpy
# voices go in .cache/voices (see docs); then:
node engine/render.mjs projects/the-box --stills      # look-dev frames
node engine/render.mjs projects/the-box --draft       # fast low-res cut
node engine/render.mjs projects/the-box               # 1080p master -> projects/the-box/out/the-box.mp4
```

Voice: `en_US-ryan-high` from https://huggingface.co/rhasspy/piper-voices (download the `.onnx`
and `.onnx.json` into `.cache/voices/`). To use your own voice or ElevenLabs instead, drop WAVs in
and point `voFile` at them.

- `docs/fern-breakdown.md`: what Fern does, and where this beats it
- `docs/style-bible.md`: the rules
- `.claude/skills/make-video/`: how Claude works in this repo
- `renders/`: delivered cuts
