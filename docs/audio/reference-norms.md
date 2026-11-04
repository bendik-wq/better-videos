# Reference norms, and a blind self-check against real mixes

We cannot listen, so every render is judged against (a) published delivery specs and (b) measured
profiles of real narrated documentaries and human narration. The numbers below come from
`projects/audio-lab/reference_check.py`. The reference audio is measured locally and is never
committed.

## Delivery targets

| spec | value | source |
|---|---|---|
| YouTube playback reference | about -14 LUFS integrated (YouTube turns louder uploads down and does not turn quieter ones up) | YouTube publishes no LUFS figure; -14 is the level engineers observe in playback ([Joseph Nilo](https://josephnilo.com/blog/dialogue-loudness-lufs-true-peak-video/), [IRPR table](https://sounddesign.irpr.agency/tools/lufs-delivery-reference/)) |
| true-peak ceiling | -1 dBTP (headroom for the AAC/Opus encode) | common practice for streaming, and EBU R128 s4's limit for cinematic content ([EBU R 128 s4](https://tech.ebu.ch/docs/r/r128s4.pdf)) |
| Netflix (for comparison) | -27 LKFS dialogue-gated ±2, true peak ≤ -2 dBTP | ([IRPR table](https://sounddesign.irpr.agency/tools/lufs-delivery-reference/), [dvxuser](https://www.dvxuser.com/threads/dialogue-levels-for-streaming.5700269/)) |
| LRA for a narrated web documentary | 5–10 LU (measured references: 5.4–9.9) | measured below |
| speech-to-music gap under VO | 10–20 LU momentary (measured on our stems; references are not separable) | mixing convention |
| speech LTASS slope above about 400 Hz | about -6 dB/oct (the IEC 60268 programme curve is the best fit) | [Salford repository, on Byrne et al. 1994](https://salford-repository.worktribe.com/OutputFile/1491320) |

Our gates in `music/qa.py` are: -14 ±1 LUFS, ≤ -1 dBTP, no clipped runs, no isolated clicks,
mean L/R correlation > 0.2, L/R balance within 1.5 dB, and no 1/3-octave build-up in 1.6–8 kHz.

## References measured (analysis only)

| label | what | licence and source |
|---|---|---|
| nasa-earth-social | NASA "NASA Earth: Powering America's Future" (social cut, 42 s): narration, production music, SFX | NASA SVS 14789 ([api](https://svs.gsfc.nasa.gov/api/14789)); production music by Universal Production Music, measured only |
| nasa-smoke | NASA "Science of Smoke Illustrated" (3 min 24 s), a narrated explainer with a music bed | NASA SVS 15104 ([page](https://svs.gsfc.nasa.gov/15104)); music by Universal Production Music, measured only |
| lv1, lv2 | LibriVox human narration (Short Nonfiction Collection 107: "Chief Joseph", "Biblical Things Not Generally Known"), unprocessed amateur reads | Public Domain Mark ([archive.org](https://archive.org/details/snf107_2510_librivox)) |

## Results: audio-lab mix (`projects/audio-lab/renders/reference-check.md`)

| file | LUFS | LRA | PLR | ST sd | tilt 100–10k | tilt 500–8k | corr | 63 | 125 | 250 | 500 | 1k | 2k | 4k | 8k | 16k |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **our mix** | -14.1 | 9.2 | 13.1 | 3.80 | -1.62 | -2.14 | 0.68 | 2.5 | 0.9 | 3.7 | 1.9 | 0 | -4.0 | -6.0 | -5.8 | -17.5 |
| our VO (Kokoro + chain) | -19.4 | 8.5 | 16.4 | 4.71 | -1.09 | -2.12 | 1.00 | -33.6 | -4.4 | 4.1 | 1.7 | 0 | -4.1 | -6.0 | -5.9 | -22.4 |
| nasa-earth-social | -24.0 | 9.9 | 15.1 | 4.12 | -2.86 | -1.69 | 0.46 | 15.6 | 14.1 | 5.6 | 0.9 | 0 | -1.1 | -3.9 | -5.6 | -13.1 |
| nasa-smoke | -19.3 | 5.4 | 16.3 | 2.56 | -2.38 | -2.84 | 0.94 | -9.9 | 5.4 | 8.0 | 7.5 | 0 | -4.1 | -5.4 | -4.0 | -12.4 |
| lv1 (human VO) | -22.3 | 5.4 | 18.6 | 2.18 | -3.11 | -5.21 | 1.00 | -24.1 | 3.2 | 1.7 | 7.6 | 0 | -6.0 | -10.3 | -13.3 | -21.5 |
| lv2 (human VO) | -23.9 | 6.2 | 19.0 | 2.19 | -3.80 | -5.20 | 1.00 | -13.2 | -1.3 | 12.6 | 5.9 | 0 | -11.3 | -15.4 | -12.4 | -27.8 |

Band levels are octave-band power in dB relative to the 1 kHz octave. Tilt is the least-squares
slope of those band levels per octave, so pink noise reads 0.

### Reading it (the blind self-check)

- **Loudness and peaks are on spec.** We land at -14.1 LUFS and -1.0 dBTP. The NASA files sit at
  -19 to -24 LUFS because they are delivered unnormalised for download. YouTube only turns loud
  uploads down and never boosts quiet ones, so ours plays at the reference level and theirs would
  play 5–10 dB quieter.
- **PLR 13.1 dB vs 15–16 dB for NASA.** We are about 2.5 dB denser. That is normal for a -14 LUFS
  master against unlimited -19/-24 LUFS files, and it is far from crushed (a modern music master is
  around 8–9 dB PLR).
- **Dynamics.** Our LRA is 9.2 LU and our short-term SD is 3.8, between the busy NASA promo (9.9 and
  4.1) and the calm explainer (5.4 and 2.6). The first lab pass measured 11.2 LU, above the
  reference range. We cut the gap lift (7 to 5 dB) and the composer's dynamic range (11 to 8 dB) and
  re-checked. Our LRA includes the deliberate 3 s drop to silence on the chapter card.
- **Spectral shape matches the doc references in the presence and air bands.** At 2k/4k/8k we read
  -4.0/-6.0/-5.8, against nasa-smoke's -4.1/-5.4/-4.0. Our 16 kHz octave is about 5 dB darker,
  because Kokoro is a 24 kHz model with nothing above 12 kHz. Only the music carries the top octave.
  An air shelf on the VO cannot create content that is not there, and we do not fake it with
  exciters.
- **Low end.** Our 63 Hz octave is +2.5 (sub-bass, taiko, braaam), between nasa-smoke (-9.9, sparse
  bed) and the NASA promo (+15.6, a heavy trailer-style bed). For a cinematic doc that is a sensible
  middle. The 31.5 Hz octave is -7.9, and the music master high-passes at 32 Hz, so there is no
  wasted sub energy eating headroom.
- **The 100–160 Hz hole.** The overlay plot (`reference-ltas.png`) shows our first mix sagging
  about 6–8 dB between the sub hump and the voice, where every reference stays full. We
  added +2.5 dB at 130 Hz and a -2 dB shelf at 60 Hz to the music master, which narrowed the gap
  (the 125 Hz octave went from -0.2 to +0.9). The rest of the gap is the voice itself (see below).
- **Low-mids.** Human narrators (lv1, lv2, the nasa-smoke narrator) put +6 to +12 dB in the
  250–500 Hz octaves. Kokoro af_heart is lighter: +4.1 at 250 and +1.7 at 500. That is the female
  voice, and the chain's -1.5 dB box cut at 260 Hz. It is the clearest spectral tell between our VO
  and a human read. A male Kokoro voice (am_michael) or a gentler box cut closes most of it. We left
  it because af_heart's intelligibility numbers are the best of all the voices (see voice.md).
- **Tilt.** Ours is -1.6 dB/oct over 100 Hz–10 kHz, against -2.4 to -2.9 for the NASA mixes. Ours
  is a touch brighter, because the narration is female and our bed is darker than library music
  (we keep the vocal band clear). Over 500 Hz–8 kHz, -2.2 against NASA's -1.7 to -2.8 sits in range.
- **Stereo.** Our correlation is 0.68, between the NASA promo (0.46) and the explainer (0.94),
  safely mono-compatible. The single worst 400 ms block (-0.23, at 18.8 s) is the reverb tail ringing alone
  into the chapter-card drop, where only decorrelated hall reverb is playing. That is expected, and
  it folds to mono as a quieter tail, not a cancellation.
- **No harsh build-ups, no clipping, no clicks.** The narrow "resonances" reported for the mix
  (1758 and 2637 Hz) are sustained musical pitches (A6 is 1760 Hz, the fifth of D), not
  artefacts. The VO-only file has none.
