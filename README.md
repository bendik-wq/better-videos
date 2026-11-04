# better-videos

Documentary videos rendered from code: 3D sets, narration, sound and a film finish. The goal is
Fern's documentary grammar pushed through a specific taste (see `docs/style-bible.md`).

```bash
# Mesa EGL so headless Chromium can use llvmpipe (2-3x faster than SwiftShader) without a GPU or Xvfb
apt-get install -y libegl1 libegl-mesa0 libgl1-mesa-dri ffmpeg
npm install && pip install piper-tts numpy
# voices go in .cache/voices (see docs); then:
node engine/render.mjs projects/the-box --stills      # look-dev frames
node engine/render.mjs projects/the-box --draft       # fast low-res cut
node engine/render.mjs projects/the-box               # 1080p master -> projects/the-box/out/the-box.mp4
```

Rendering uses Playwright's chrome-headless-shell (`/opt/pw-browsers`, or `PLAYWRIGHT_BROWSERS_PATH`)
with WebGL on Mesa llvmpipe. The renderer prints the WebGL renderer string at startup and warns
loudly, then falls back to SwiftShader, if llvmpipe isn't active. `--gl=swiftshader` (or
`BV_GL=swiftshader`) forces SwiftShader. See `docs/research/render-speed.md`.

Voice: `en_US-ryan-high` from https://huggingface.co/rhasspy/piper-voices (download the `.onnx`
and `.onnx.json` into `.cache/voices/`). To use your own voice or ElevenLabs instead, drop WAVs in
and point `voFile` at them.

- `docs/fern-breakdown.md`: what Fern does, and where this beats it
- `docs/style-bible.md`: the rules
- `.claude/skills/make-video/`: how Claude works in this repo
- `renders/`: delivered cuts
