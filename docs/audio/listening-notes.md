# audio-lab listening notes (verified by analysis, not by ear)

Build it with `python3 projects/audio-lab/build.py` (about 2 minutes). Deliverables are in
`projects/audio-lab/renders/`:

| file | what |
|---|---|
| `audio-lab.mp4` | 73 s showcase, 720p: a colour card per section, a scrolling spectrum and word-timed captions |
| `audio-lab-mix.flac` | the final mix (-14.1 LUFS, -1.0 dBTP) |
| `mix-spectrogram.png`, `mix-loudness.png`, `mix-ltas.png` | spectrogram; momentary/short-term loudness with the VO overlaid; long-term spectrum |
| `mix.qa.json` | the QA report. All checks pass: 0 clipped runs, 0 clicks, no harsh build-ups |
| `reference-check.md`, `reference-ltas.png` | our mix and VO against NASA narrated videos and LibriVox narration (see [reference-norms.md](reference-norms.md)) |
| `sections.json`, `score.music.json` | per-section loudness, centroid and width, plus the composer's arrangement and the harmony report |
| `score.licences.json` | the licence log for the public-domain recording used |
| `voices/*.flac` | A/B voice samples: af_heart and am_michael, raw against round 3; am_fenrir round 3; Chatterbox-Turbo |

## Section by section

Times are from `timeline.json`. *Mix*, *music* and *VO* are integrated LUFS over the section.
Centroid and side level are for the music stem only.

| t (s) | section | what it demonstrates | arrangement (from the composer) | mix / music / VO | music centroid · side |
|---|---|---|---|---|---|
| 0.0 | **open**: wonder | discovery mode for the bright Hormuz episode. Four seconds of music alone, then VO over music | D lydian, 110 bpm (locked to 5 bars), D(maj7)–Asus2–Bm7–E–D (I–V–vi–**II**: the lydian ♯4 lives in the E major chord). Pluck 8th arpeggios, 16th pluck ostinato, celesta sparkle two octaves up, pads and strings | -15.1 / -23.0 / -19.5 | 427 Hz · -5.5 dB |
| 10.9 | **depth**: mystery | darker colour, sparse texture | C harmonic minor, 72 bpm, Cm–D° (i–ii°), celesta motif, sparse plucks on a 3/16 grid, long hall (50 % send) | -14.9 / -26.9 / -19.3 | 631 Hz · -3.0 dB |
| 17.7 | **ch1**: chapter card | **drop to silence**: whoosh into the cut, the dry music gated dead on the card, the hall tail rings for about 2 s and falls below -50 LUFS (momentary) before the next cue | (drop window 17.70–20.90) | -28.2 / -38.3 / none | |
| 20.9 | **clock**: tension | **ticking-clock build** in 8ths, doubling to 16ths once intensity passes 0.75. Pulse ostinato, sub, strings join at 0.55 and taiko at 0.7. **Breakdown bar** (bar 4: everything but the pad drops out), then a boom and reverse swell back in. **Shepard riser** across the back half into a hit | D phrygian, 102.5 bpm (7 bars), Dm–B♭–Gm–A° (i–♭VI–iv–v°), intensity 0.3 to 1.0. Enters straight after the drop on a hit | -13.8 / -20.1 / -19.5 | 361 Hz · -5.1 dB |
| 37.3 | **war**: urgency | fast and driving, entered on a hit with a **braaam** on the downbeat | E minor, 140 bpm, Em–C–D–Bm–Em, spiccato 16ths, taiko on 1 and 3 with fills, clock, strings | -13.0 / -17.5 / -19.1 | 317 Hz · -4.9 dB |
| 45.9 | **loss**: melancholy | piano motif with diatonic passing tones over strings | A aeolian, 62 bpm, Am (one 2-bar chord), piano + strings + sub | -15.2 / -25.4 / -19.3 | 1019 Hz · -3.5 dB |
| 53.6 | **archive**: licensed track | a **public-domain recording** placed as a `track` cue: Chopin Op. 69 No. 1, Luke Faulkner for Musopen, PDM-1.0. Composed music hands over to it. The recording's near-zero L/R correlation (0.06) is narrowed to width 0.6 and its 2 dB L/R lean is corrected | (track) | -13.6 / -30.8 / -19.4 | 633 Hz · -4.1 dB |
| 61.6 | **moving**: triumph | enters on a hit, then **resolves**: lands on the tonic and rings out | D major, 85 bpm, G(add9)–D–Asus4–**D** (IV–I–Vsus4–I, a forced tonic ending), strings, spiccato, taiko, piano | -13.8 / -18.5 / -19.4 | 309 Hz · -5.1 dB |

## What the analysis says you would hear

- **VO is always on top.** Under speech the VO sits a median **15.0 LU** above the music
  (10th percentile 6.4 LU), inside the 10–20 LU documentary range. The music dips mostly in
  250 Hz–5 kHz (-8 dB), so the sub and the air keep moving while the words are clear. In the loudness
  plot, the grey momentary line rises between the blue VO lines: that is the gap lift (+5 dB over
  about 0.9 s), the music answering each line.
- **Even VO.** Every line measures -19.1 to -19.5 LUFS (the chain normalises per line), so no
  line jumps out.
- **Dynamics across the piece.** The loudness plot shows a 4 s music-only intro at about -21 LUFS
  short-term, the clear chapter drop to silence, the tension build ramping from -20 to -12 with the
  breakdown dip visible, and urgency as the densest section (music -17.5 LUFS). Melancholy and
  mystery are the quietest beds (-25 to -27). LRA is 9.2 LU, inside the 5–10 reference range.
- **Bright vs dark moods.** The music centroid runs from 309 Hz (triumph: sub, taiko and braaam
  weight) to 1019 Hz (melancholy: piano and strings, no sub). Wonder is 427 Hz with the celesta
  sparkle. That is darker than its "bright" label suggests, because the sub-bass and pads dominate
  the centroid. Its 2–8 kHz bands come from the plucks and celesta.
- **Stereo.** Mean correlation 0.68, music side level -3 to -5.5 dB under mid. The widest moment
  is the reverb tail alone in the chapter drop (worst 400 ms block -0.23 at 18.8 s). That is
  decorrelated hall, quiet, and it folds to mono as a softer tail, not a cancellation.
- **Harmony.** The symbolic harmony report gives 100 % chord tones in pads, bass and strings,
  96.8 % in the ostinato (3.2 % diatonic ninths) and 91.5 % in keys (8.5 % diatonic passing tones).
  0 % of notes fall outside the scale.
- **Tuning.** Karplus-Strong plucks are within 0.3 cents (fractional-delay loop). The piano reads
  1–5 cents sharp from partial stretch, like a real piano's stretch tuning.
- **Cleanliness.** The click detector (a lone second-difference spike, more than 4× its ±1 ms
  neighbourhood) finds 0 clicks in the mix, the VO and every music stem. Getting there took four
  fixes, all found by this detector:
  - the first wrap of the Karplus-Strong loop was a step, so the excitation now has a Tukey taper;
  - linear 1.5–3 ms onsets left slope kinks, so they are now raised-cosine;
  - level automation stepped at section joins, so it now uses 60 ms ramps;
  - the VO files ended on a non-zero sample, so the room tail now rings and the edges fade.

## Honest limits

- We cannot listen. Everything above is measured. "Musical" is argued from structure: functional
  progressions, voice-led voicings, motif repetition, tempo-locked ostinatos, dynamics arcs, and a
  harmony report with no wrong notes. It is not a listening judgement. Synthesised strings and
  brass will not pass for a recorded orchestra. The pads, plucks, piano, pulses, clock, risers and
  percussion are the strong timbres. The supersaw strings and the braaam read as "hybrid trailer
  synth", the Zimmer palette, not as a real section.
- Short sections (7–8 s) get only one or two chords, so melancholy here is a single two-bar Am.
  Real episode cues of 30–90 s get full progressions, breakdowns and endings.
- The VO is band-limited at 12 kHz (Kokoro is a 24 kHz model). The music carries the top octave.
- Cost on this 4-vCPU box, for the full 14-minute Palantir timeline with a 6-cue score and 5
  chapter drops: `score.py` takes about 6.5 minutes (peak memory under 5 GB, after moving to float32
  reverb buses, overlap-add convolution and chunked filters; the first version ran out of memory).
  `score.py --mix` with QA takes about 5 minutes. That mix measured -14.1 LUFS, -1.0 dBTP, LRA 2.0
  (wall-to-wall narration) and 12.8 LU of VO over music, and passed every check.
