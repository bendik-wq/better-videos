# Voice: Kokoro benchmark, prosody, the doc chain, and the open-TTS survey

## Recommendation

**Keep Kokoro `af_heart` at speed 0.95–0.96, with the round-3 pipeline on (the default).** It has
Kokoro's only A grade and a perfect transcript at every speed. Of all the voices tested it has the
fewest persistent vocoder resonances (2), its pitch range (9.5–10 st) is in the documentary
narrator band, and the round-3 pacing brings it to **162 wpm**, inside the 140–165 wpm documentary
range (the raw output ran at 175).

- **For a male narrator**, use `am_michael` at 0.95 (C+). It is the warmest male voice (116 Hz
  median), it has a natural 10.7 st range and it is the best-paced (139 wpm with prosody). In the
  raw single-call mode it misheard "Oman" as "old man"/"O Man". The round-3 sentence-level
  synthesis fixes that (WER 0).
- `am_fenrir` is the most animated voice (15.7 st). It suits an energetic explainer, but it is too
  excitable for a sober geopolitics doc.
- **Avoid** `bm_fable`: it has 27 % of its energy at 4.5–9 kHz, a hissy, breathy artefact, and no
  measurable pauses. Also avoid `am_onyx` and `bf_emma`, which are monotone at 5.4 and 7.0 st
  ranges, and `af_nicole`, a whisper voice at 112 wpm with 11 s of pauses in 22 s.

Speed changes the pace almost linearly: -0.05 of speed costs about 6 wpm. It barely changes pitch
expressiveness (±0.4 st), so slow the lines down with *dynamic per-line speed* and *pauses* rather
than a slower global speed. A global 0.90 makes every line sound sedated; a 0.90 reveal line lands.

## The benchmark (`projects/audio-lab/voice_bench.py`, data in `data/voice-bench.json`)

The paragraph, 64 words in documentary register:

> Every day, about twenty million barrels of oil pass through a channel barely thirty-nine kilometres wide. On one side, Iran. On the other, Oman and the Emirates. If this strait closed for even a week, petrol prices on the other side of the planet would jump overnight. So why has nobody ever managed to shut it? The answer is stranger than you think.

There were 20 voices × 3 speeds (0.90, 0.95, 1.00), rendered raw (one Kokoro call, as voice.py did
before round 3), plus 6 voices through the round-3 pipeline. We cannot listen, so we measure:
- **WER**: faster-whisper small.en against the script, with digits and spelling variants normalised.
- **word prob**: whisper's mean word confidence; mumbled words or odd stress lower it.
- **F0 range and SD**: YIN pitch track, 5–95th percentile in semitones. A narrator sits at about
  7–12 st, and below 6 st sounds monotone.
- **wpm**: overall rate, pauses included.
- **pauses**: gaps of 150 ms or more, below -40 dB.
- **presence**: 2–4.5 kHz energy share. Higher means clearer consonants.
- **sibilance**: 4.5–9 kHz energy share. Above about 8 % sounds hissy.
- **narrow resonances**: persistent spectral peaks more than 6 dB above their 1/3-octave
  neighbourhood in the median spectrum (vocoder ringing).
- **RTF**: synthesis time divided by audio time on this 4-vCPU Xeon (lower is faster).

The Kokoro grade is the model author's published grade ([VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)).
These are the speed 0.95 results:

| voice | Kokoro grade | WER | word prob | F0 median Hz | F0 range st | F0 SD st | wpm | pauses (n / s) | presence % | sibilance % | narrow resonances | RTF |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| af_heart | A | 0.000 | 0.98 | 203 | 9.51 | 2.94 | 175 | 7 / 2.94 | 2.05 | 3.09 | 2 | 0.498 |
| af_bella | A- | 0.000 | 0.98 | 207 | 8.08 | 3.13 | 170 | 7 / 3.19 | 0.72 | 1.38 | 11 | 0.583 |
| af_nicole | B- | 0.000 | 0.97 | 150 | 5.77 | 2.93 | 112 | 14 / 11.16 | 3.09 | 4.26 | 3 | 0.909 |
| bf_emma | B- | 0.000 | 0.98 | 180 | 7.01 | 2.08 | 190 | 6 / 2.71 | 5.82 | 3.97 | 7 | 0.301 |
| af_aoede | C+ | 0.031 | 0.96 | 177 | 9.65 | 3.18 | 184 | 5 / 2.16 | 0.48 | 0.86 | 2 | 0.748 |
| af_kore | C+ | 0.000 | 0.96 | 150 | 13.32 | 3.62 | 192 | 4 / 1.24 | 0.52 | 1.79 | 12 | 0.377 |
| af_sarah | C+ | 0.000 | 0.98 | 199 | 12.25 | 3.65 | 180 | 6 / 2.98 | 3.86 | 4.31 | 15 | 0.531 |
| am_fenrir | C+ | 0.000 | 0.96 | 143 | 15.73 | 4.3 | 193 | 5 / 1.42 | 3.14 | 2.53 | 7 | 0.483 |
| am_michael | C+ | 0.031 | 0.96 | 116 | 10.66 | 3.3 | 158 | 7 / 3.51 | 4.63 | 5.17 | 7 | 0.312 |
| am_puck | C+ | 0.000 | 0.97 | 110 | 13.66 | 3.82 | 202 | 5 / 1.22 | 2.08 | 4.4 | 4 | 0.485 |
| bf_isabella | C | 0.000 | 0.96 | 198 | 6.9 | 2.26 | 189 | 6 / 2.76 | 2.7 | 4.6 | 5 | 0.352 |
| bm_fable | C | 0.000 | 0.96 | 118 | 11.93 | 3.66 | 206 | 0 / 0 | 2.4 | 27.44 | 20 | 0.292 |
| bm_george | C | 0.000 | 0.97 | 139 | 9.86 | 2.99 | 170 | 9 / 2.97 | 1.86 | 2.57 | 18 | 0.516 |
| bm_lewis | D+ | 0.000 | 0.95 | 91 | 11.07 | 3.67 | 167 | 7 / 2.92 | 3.39 | 1.23 | 2 | 0.298 |
| am_echo | D | 0.000 | 0.97 | 109 | 11.74 | 3.17 | 205 | 6 / 1.58 | 1.03 | 8.08 | 19 | 0.26 |
| am_eric | D | 0.000 | 0.96 | 155 | 12.24 | 3.43 | 222 | 3 / 0.96 | 2.86 | 2.1 | 23 | 0.508 |
| am_liam | D | 0.031 | 0.95 | 131 | 13.87 | 3.92 | 207 | 5 / 1.79 | 4.61 | 4.14 | 16 | 0.307 |
| am_onyx | D | 0.000 | 0.96 | 84 | 5.43 | 1.62 | 204 | 3 / 1.04 | 1.09 | 1.78 | 19 | 0.283 |
| bm_daniel | D | 0.000 | 0.97 | 126 | 6.62 | 2.09 | 205 | 5 / 1.4 | 1.57 | 1.47 | 12 | 0.414 |
| am_adam | F+ | 0.000 | 0.96 | 119 | 9.75 | 2.84 | 190 | 5 / 2.2 | 3.6 | 2.69 | 3 | 0.491 |


**Round-3 pipeline vs raw** (the round-3 run uses the marked-up paragraph: line breaks, `*twenty million*`, `*overnight*`, and `> ` on the last line):

| voice | speed | pipeline | wpm | pauses (n / s) | F0 range st | presence % | sibilance % | WER | RTF |
|---|---|---|---|---|---|---|---|---|---|
| af_heart | 0.95 | raw | 175 | 7 / 2.94 | 9.51 | 2.05 | 3.09 | 0.000 | 0.50 |
| **af_heart** | **0.96** | **round3** | **162** | **7 / 3.78** | **10.14** | **4.98** | **3.30** | **0.000** | 0.99 |
| af_bella | 0.95 | raw | 170 | 7 / 3.19 | 8.08 | 0.72 | 1.38 | 0.000 | 0.58 |
| af_bella | 0.95 | round3 | 158 | 9 / 4.26 | 7.63 | 2.10 | 2.06 | 0.000 | 0.90 |
| am_michael | 0.95 | raw | 158 | 7 / 3.51 | 10.66 | 4.63 | 5.17 | 0.031 | 0.31 |
| am_michael | 0.95 | round3 | 139 | 7 / 4.28 | 9.59 | 9.23 | 5.14 | 0.000 | 1.00 |
| am_fenrir | 0.95 | raw | 193 | 5 / 1.42 | 15.73 | 3.14 | 2.53 | 0.000 | 0.48 |
| am_fenrir | 0.95 | round3 | 162 | 6 / 3.08 | 15.10 | 6.86 | 2.88 | 0.000 | 0.39 |
| bf_emma | 0.95 | raw | 190 | 6 / 2.71 | 7.01 | 5.82 | 3.97 | 0.000 | 0.30 |
| bf_emma | 0.95 | round3 | 161 | 8 / 3.50 | 6.17 | 10.14 | 4.00 | 0.000 | 1.12 |
| bm_george | 0.95 | raw | 170 | 9 / 2.97 | 9.86 | 1.86 | 2.57 | 0.000 | 0.52 |
| bm_george | 0.95 | round3 | 133 | 10 / 4.33 | 8.72 | 4.35 | 3.35 | 0.000 | 0.60 |

What the pipeline does to the numbers:
- It slows the read by 10–20 % through pauses, not through a slower voice.
- It about doubles presence (the +2 dB presence EQ and the compression).
- Sibilance stays put, because the de-esser holds it.
- It removes every misheard word: the "Oman" errors in raw mode came from long single-call
  batches, and sentence-level synthesis fixes them.

The round-3 RTF includes the 48 kHz chain. The whisper alignment that voice.py always ran is not
included. A 15-minute episode is about 15 minutes of CPU for VO, and it is cached per line.

## Prosody tools (in `engine/music/vo.py`, used by voice.py)

| tool | how | measured effect |
|---|---|---|
| sentence-level synthesis | each sentence, colon clause, dash clause, beat or line is its own Kokoro call, joined with 6 ms de-click fades | Kokoro resets its intonation per call, so every sentence gets a clean declarative fall. This also fixed the raw-mode "Oman" mishearings |
| punctuation pauses | `.` 0.38 s, `?` 0.45, `!` 0.38, `…` 0.65, `:` 0.32, `—` 0.24, `|` 0.35, line break 0.55, paragraph 0.9 (override with `voice.pauses`) | doc pacing: 162 wpm instead of 175 for af_heart |
| dynamic speed | reveal lines ×0.90: a short line (≤7 words) after `:`, `—` or `?`, a short final line, or an explicit `> ` line. Lines carrying numbers ×0.95, questions ×0.97 | reveals land; numbers are easier to catch |
| emphasis `*word*` | the stressed vowel (the whole diphthong) of the word is lengthened in Kokoro's phoneme input (`ˈɪ` becomes `ˈɪː`) | measured +8–25 % word duration and a slightly higher F0 peak. **Subtle**: Kokoro has no pitch-accent control |
| voice blends | `name: "af_heart:0.7,af_bella:0.3"` (weighted style vectors) | a new timbre between two voices |

What we tested that does **not** work with Kokoro (via kokoro-onnx 0.6.1, espeak phonemes):
- **CAPS**: the audio is identical; espeak lower-cases.
- **Asterisks in raw text**: read aloud as "asterisk". voice.py now strips them, so markup is
  safe.
- **A comma before a word**: adds a pause but *lowers* the pitch of the word (de-emphasis).
- **Lengthening only the first half of a diphthong**: breaks the word ("overnight" was heard as
  "over now"). We fixed this and re-measured it.
- **A dash before a word**: lengthens the word *before* the dash (phrase-final lengthening) and
  adds a beat. Useful for a setup, but it is not emphasis on the next word.

## The documentary voice chain (`vo.chain`, at 48 kHz, applied per line and cached)

1. 2 × 2nd-order high-pass at 75 Hz (24 dB/oct rumble cut).
2. -1.5 dB at 260 Hz (boxiness), +2 dB at 3.2 kHz (presence), +1 dB shelf at 9.5 kHz (air).
3. Split-band de-esser: an LR4 split at 5 kHz. The high band is turned down (4:1, at most 8 dB)
   when it comes within 8 dB of the full-band level.
4. Compressor: 2.5:1 at -24 dB, 8 ms attack, 120 ms release, 6 dB knee.
5. Room: synthetic 0.45 s small-room IR at 6 % wet. The tail rings out, not truncated.
6. Per-line loudness at -19 LUFS (so every line matches), then a -3 dBTP look-ahead limiter for
   plosives, and 5/30 ms edge fades.

Measured on the lab VO: no harsh 1/3-octave build-ups, no narrow resonances, zero clicks, and
-19.4 LUFS with LRA 8.5 across lines.

## Better open TTS on this CPU? (survey October 2026, licences checked)

| model | licence (code / weights) | commercial use | CPU here | verdict |
|---|---|---|---|---|
| **Kokoro-82M v1.0** (in use; v1.0 is still the latest English release) | Apache-2.0 / Apache-2.0 | yes | RTF 0.3–0.6 raw, about 1.0 with prosody and chain | best quality per CPU second; no cloning |
| **Chatterbox-Turbo** (Resemble AI, 350M) | MIT / MIT | yes (outputs are Perth-watermarked when you run their watermarker) | **measured RTF 2.15** (ONNX, q4 LM + q8 decoder, about 0.8 GB download, 40 s of LM decoding for 25 s of audio) | runs, WER 0, natural rhythm. But greedy decoding left 1.3–2.4 s dead pauses between sentences (trim them in post). It clones a reference clip, so the voice is as good as the reference; we fed it Kokoro af_heart rather than a real person. **A viable "premium" engine at 4–5× Kokoro's cost.** Not wired into voice.py; `projects/audio-lab/tts_candidates.py` is the working harness |
| NeuTTS Air (Neuphonic, 0.7B) | Apache-2.0 | yes | Q4 GGUF 527 MB, needs llama.cpp + the NeuCodec decoder (torch) | not tested (torch); a plausible next trial |
| Kitten TTS nano | Apache-2.0 | yes | 24 MB, very fast | clearly below Kokoro in published comparisons; not worth it |
| Piper | MIT, per-voice licences | per voice | very fast | already a fallback engine; robotic beside Kokoro |
| StyleTTS2 (LibriTTS) | MIT code; the weights carry a "tell listeners it is synthetic" condition, and some mirrors say CC-BY-NC | unclear | about Kokoro's cost | Kokoro *is* a StyleTTS2-family model trained further; no gain |
| F5-TTS | MIT code / **CC-BY-NC-4.0 weights** (Emilia data) | **no** | slow on CPU | excluded: NC |
| XTTS-v2 (Coqui) | **Coqui Public Model License (non-commercial)** | **no** (Coqui has shut down, so there is nobody to sell a licence) | slow | excluded: NC |
| Spark-TTS, Fish/OpenAudio S1-mini | CC-BY-NC-SA | **no** | | excluded: NC |
| Orpheus 3B, Dia 1.6B, Sesame CSM-1B | Apache-2.0 | yes | 1–3B-parameter LLM decoders: about 5–20× real time on 4 vCPUs (estimated from size; not run) | not reasonable on this CPU |

Sources: [Picovoice on-device TTS benchmark](https://picovoice.ai/blog/on-device-tts/),
[Kokoro vs XTTS vs Chatterbox](https://localaimaster.com/blog/kokoro-vs-xtts-vs-chatterbox),
[Chatterbox-Turbo](https://www.resemble.ai/learn/models/chatterbox-turbo) and its
[ONNX model card](https://huggingface.co/ResembleAI/chatterbox-turbo-ONNX) (MIT),
[NeuTTS Air card](https://huggingface.co/neuphonic/neutts-air) (Apache-2.0),
[Kitten TTS](https://huggingface.co/KittenML/kitten-tts-nano-0.2) (Apache-2.0),
F5 and XTTS licence summaries from [Spheron](https://www.spheron.network/blog/self-host-voice-cloning-gpu-cloud-xtts-f5-tts-openvoice-v2/)
and [PromptQuorum](https://www.promptquorum.com/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts).
The licences were read from the model cards over the Hugging Face API on 12 October 2026.

**Honest summary.** Kokoro with the round-3 pacing and chain is the right default: it is
intelligible, consistent, cheap and Apache-licensed. The one model that might sound more human is
Chatterbox-Turbo: an LLM-style prosody model, MIT-licensed, and it runs here at RTF 2.15. Its
pauses need trimming and its timbre depends on the reference clip. Whether it is *better* needs
human ears; our metrics (WER, pitch range, rate) do not separate it from Kokoro. If someone can
listen, A/B `projects/audio-lab/out/tts/chatterbox-turbo-q4.wav` against
`out/voice-bench/af_heart-0.95-raw.wav`. ElevenLabs (already supported by voice.py) remains the
paid option for a clearly human read.
