# Reference voices (for engine "chatterbox")

| File | Source | Licence |
|---|---|---|
| `stuart_bell.wav` | Voice-Zero (curated LibriVox readers), via `kyutai/tts-voices/voice-zero/stuart_bell.wav` | CC0 |
| `peter_yearsley.wav` | Voice-Zero, via `kyutai/tts-voices/voice-zero/peter_yearsley.wav` | CC0 |

Both are LibriVox volunteer readers whose public-domain recordings were collected by Voice-Zero. They only set the
narrator's timbre and delivery for synthetic narration. Setup for the engine: `python3 -m venv /root/cbenv && /root/cbenv/bin/pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu && /root/cbenv/bin/pip install chatterbox-tts`.
