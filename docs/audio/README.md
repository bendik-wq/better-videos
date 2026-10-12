# Audio: score, voice and mix (round 3)

`engine/music/` is a deterministic numpy and scipy composer, a dialogue-priority mixer and an audio
QA suite. `engine/score.py` and `engine/voice.py` keep their CLIs and add the new features as
options, so existing projects render the same as before (byte-identical for a legacy score config).

- [research.md](research.md): Zimmer, Göransson, documentary scoring, and how each idea became a rule.
- [voice.md](voice.md): the Kokoro voice benchmark, the prosody tools, and the open-TTS survey (licences and CPU cost).
- [reference-norms.md](reference-norms.md): delivery specs, and our mix measured against real references.
- [listening-notes.md](listening-notes.md): the audio-lab showcase, section by section, verified by analysis.

Dependencies: `pip install scipy soundfile` (BSD). `matplotlib` is optional and only used for QA plots.
Without scipy, `score.py` falls back to the legacy drone and prints a warning, so renders never break.

## 1. Music in a project: `score.music`

```js
score: {
  seed: 3,                                 // any int; the score is a pure function of (timeline, cfg, seed)
  music: [
    { shot: 'open',  mood: 'wonder',  key: 'D', intensity: [0.3, 0.6] },   // [from, to] = a build
    { shot: 'depth', mood: 'mystery', key: 'C', intensity: 0.45 },
    { shot: 'clock', mood: 'tension', key: 'D', intensity: [0.3, 1.0], riser: true, clock: true },
    { shot: 'war',   mood: 'urgency', key: 'E', intensity: 0.85, hit: true },
    { shot: 'loss',  mood: 'melancholy', key: 'A', intensity: 0.4, until: 'archive' },
    { shot: 'archive', type: 'track', file: 'projects/audio-lab/assets/chopin-op69-1-excerpt.ogg', gainDb: -2, until: 'moving' },
    { shot: 'moving', mood: 'triumph', key: 'D', intensity: [0.55, 0.95], ending: 'resolve' },
  ],
  cues: [ /* the existing SFX cues are unchanged: boom, whoosh, sfx presets, transitions... */ ],
  // dropOnChapters: true (default): every shot with set 'chapter' is a drop to silence
  // drops: ['someShot'], extra silence windows
  // musicDb: 0, trims the music bus against the SFX in score.wav
}
```

Each entry starts at `shot` (plus `at` seconds). It runs `until` the start of another shot (plus
`untilAt`), or else until the next entry.

| key | meaning |
|---|---|
| `mood` | `tension`, `wonder` (aliases `discovery`, `bright`), `urgency`, `melancholy`, `triumph`, `mystery`, `silence` |
| `key` | `'D'`, `'F#'`, `'Eb minor'`, `'A dorian'`… Without a mode, the mood's mode is used (tension phrygian, wonder lydian, urgency minor, melancholy aeolian, triumph major, mystery harmonic minor) |
| `intensity` | 0–1, or `[from, to]` (or more points) for a build. It drives the layers that play, the filters, the velocities and the level automation (about 8 dB from 0 to 1) |
| `bpm` | override. By default the tempo is the mood's, adjusted so the section is a whole number of bars and the next downbeat lands on its cut |
| `clock` | ticking-clock motif. On by default for tension and urgency. 8ths, doubling to 16ths above intensity 0.75 |
| `riser` | Shepard-tone riser across the back half into the next section |
| `hit` | boom and taiko on the downbeat (a braaam too when intensity is high) |
| `braaam` | force a braaam on the downbeat |
| `breakdown` | the drop-out bar before the final push. Default on for rising builds of 8+ bars |
| `ending` | `flow` (default), `resolve` (land on the tonic and ring 2.5 s), `cut` |
| `layers` | force exactly these layers: `pad bass keys ostinato strings clock perc braaam` |
| `variant` | progression variant 0–2 (by default it is picked deterministically from the seed) |

**Layers by intensity** (thresholds per mood are in `composer.MOODS`): pads always. Then bass, keys
or motif, the ostinato (synth pulse, spiccato 16ths or plucks), strings (a 7-voice supersaw section
plus celli), the clock, taiko, and the braaam. Every section has an intro ramp (two bars), a build,
an optional breakdown bar, and an ending. At a key change the last chord releases fast, so two keys
never smear.

**Chapter cards.** Music stops dead at the cut, the hall reverb rings into the card, and the next
cue comes back on a hit (`after_drop`). Intense cues running into a card get a Shepard riser and a
reverse swell, so the silence lands as a hit.

**Licensed tracks**: `{type: 'track', file, licence, source, title, author, at, from, dur | until, fadeIn, fadeOut, gain | gainDb, loop, width, balance}`.
Only CC0 or public domain is accepted (`CC0`, `CC0-1.0`, `PD`, `PD-US`, `PDM-1.0`, `US-GOV-PD`).
The licence can sit on the cue or in a sidecar `<file>.licence.json`; anything else raises an error.
Wide spaced-pair recordings are narrowed (M/S width 0.6) and L/R-balanced for mono safety. Each use
is logged to `<out>/score.licences.json`. Also add the file to `assets/CREDITS.md`.

## 2. Outputs of `score.py`

`score.py timeline.json out/score.wav @cfg.json` still writes `score.wav` (music + SFX, peak 0.8,
16-bit), exactly what render.mjs's current ffmpeg mix expects. It also writes the bus stems
`score.music.wav` and `score.sfx.wav` (float, same scale) and `score.licences.json`.

`score.py --vo timeline.json vo.wav start len` is unchanged. It writes 48 kHz when voice.py's chain
is on (resampled band-limited), and 24 kHz otherwise.

`score.py --mix out/score.wav out/vo.wav out/mix.wav start len [--plots]` is the new
dialogue-priority mix (section 4). It writes `mix.wav` (48 kHz, 24-bit), `mix.qa.json`, and with
`--plots`, `mix-spectrogram.png`, `mix-loudness.png` and `mix-ltas.png`.

**Wiring it into render.mjs** (not owned by the audio pass). Replace the `graph` and `ffmpeg` lines
in step 4 (`const mix = …; const graph = …; sh('ffmpeg', …, mix)`) with:

```js
const mix = path.join(out, 'mix.wav');
execFileSync('python3', [path.join(ROOT, 'engine', 'score.py'), '--mix', bed, voTrack, mix, String(audioFrom), String(audioLen)], { stdio: 'inherit' });
```

voice.py now applies the voice chain per line, so the old ffmpeg VO EQ, compression and echo
should not run on top of it. Until render.mjs switches, the old path still works, but the voice is
processed twice (mildly).

## 3. Python API

```python
import sys; sys.path.insert(0, 'engine')
from music import compose, mix, qa, instruments as I, theory, dsp

bed = compose([dict(start=0, end=20, mood='wonder', key='D', intensity=[0.3, 0.7]),
               dict(start=22, end=40, mood='tension', key='D', intensity=[0.3, 1.0], riser=True)],
              total=42, seed=1, drops=[(20, 22)])           # (N, 2) float, mastered to -16 LUFS / -1 dBTP
from music import composer; composer.LAST['harmony']       # symbolic harmony check per layer
master, buses = mix.mix(music=bed, sfx=None, vo=vo48k)      # -14 LUFS, -1 dBTP
report = qa.report(master, vo=buses['vo'], music=buses['music'])
```

Instruments (48 kHz, deterministic per seed): `pad(midi | chord)`, `strings(midi | chord, section=violins|celli|basses)`,
`spiccato`, `piano` (additive: inharmonic partials, 3-string unison, two-stage decay, hammer),
`pluck` (Karplus-Strong, fractional-delay tuned, measured within 0.3 cents), `celesta`, `pulse`,
`sub`, `braaam`, `taiko`, `boom`, `tick`, `shepard`, `noise_riser`, `reverse_swell`.

DSP: RBJ biquads (`lp hp bp peak lowshelf highshelf eq`), `tv_lowpass` (time-varying resonant
filter), LR4 `crossover3`, `compress` (soft knee, sidechain), `limit` (look-ahead, 4x true-peak
detector), `reverb(kind=hall|plate|room|cathedral)` (synthetic IRs), `widen`, `haas`, `pan`,
`loudness` (ITU-R BS.1770-4; matches pyloudnorm within 0.05 LU), and `true_peak`.

## 4. The mix (`music/mix.py`)

| bus | processing |
|---|---|
| VO | already chained per line by voice.py. Normalised to -16 LUFS (speech-gated) before the master |
| MUSIC | the bed at -16 LUFS, then -6 dB. Three-band sidechain duck keyed from the VO: 250 Hz–5 kHz -8 dB, lows -2.5, highs -4. 80 ms look-ahead, 40 ms attack, 450 ms release, 250 ms hold between words. A gap lift brings music up 5 dB (over 0.9 s) in pauses longer than about 0.8 s |
| SFX | -3 dB, then a 3 dB duck in the vocal band only |
| MASTER | 22 Hz HPF, glue compression 1.6:1, loudness to **-14 LUFS integrated**, true-peak limiter at **-1 dBTP** (4x oversampled), re-measured until both hold |

## 5. Voice (`engine/voice.py`, interface unchanged)

The new voice options and markup are summarised here. Details and the benchmark are in [voice.md](voice.md).

```js
voice: { engine: 'kokoro', name: 'af_heart', speed: 0.96 }   // prosody + doc chain are on by default
voice: { ..., prosody: false, fx: false }                   // the exact pre-round-3 output
voice: { ..., name: 'af_heart:0.7,af_bella:0.3' }           // blended voice
voice: { ..., pauses: { '.': 0.42 }, revealSlow: 0.9, room: 0.06 }
```

VO text markup is stripped from captions and word timings: `*word*` for emphasis, `> ` at the
start of a line for a reveal (spoken slower), and `|` for a beat. Line breaks and blank lines are
pauses.

## 6. Audio QA (`music/qa.py`, also `python3 -m music.qa file.wav [report.json] [plot-prefix]` from `engine/`)

The report holds:
- integrated loudness, LRA, maximum short-term and momentary loudness;
- true peak and sample peak;
- clipped runs, isolated clicks and DC offset;
- octave-band balance relative to 1 kHz, and the octave-band tilt;
- 1/3-octave harsh build-ups (1.6–8 kHz) and persistent narrow resonances;
- stereo correlation (mean, minimum, and where the minimum is), L/R balance and side level;
- VO-over-music gap under speech, and the speech fraction.

`checks` and `pass` gate on: -14 ±1 LUFS, ≤ -1 dBTP, no clipping, correlation > 0.2, L/R within
1.5 dB, and no harsh build-up.
