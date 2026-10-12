# Scoring research: how the big scores build tension, and what that means for a numpy composer

This is the research behind `engine/music/`. Each technique ends with the rule we encoded.

## Hans Zimmer and Christopher Nolan

**Shepard tone (Dunkirk, The Prestige).** Nolan wrote the *Dunkirk* script around the Shepard-tone
illusion, "whereby you feel a continuing rise in pitch", even though the music never actually climbs
that high. The tone is a stack of sine waves an octave apart that all glide up together. A loudness
window over log-frequency fades each component in at the bottom and out at the top, so the ear only
ever hears the rise. Nolan had already built *The Prestige* score with David Julyan around the same
device. ([Gulf News](https://gulfnews.com/entertainment/dunkirk-soundtrack-how-it-all-came-together-1.2066116),
[SF Classical Voice](https://sfcv.t324.com/articles/feature/inside-making-dunkirks-landmark-soundtrack),
[Filmotomy](https://filmotomy.com/fyc-hans-zimmer-score-dunkirk/))
- **Rule:** `instruments.shepard()` builds seven octave-spaced partials under a raised-cosine window
  over log2(f), at 0.12–0.22 octaves/s, with a crescendo. The composer lays it across the back half
  of a build (`riser: true`), or across any intense section that runs into a chapter-card drop.

**The ticking clock (Dunkirk).** Nolan recorded his own pocket watch and sent it to Zimmer, who turned
the tick into a synth sound: "their mystery had a pulse". Nolan worried about the double-time
ticking: "such an insistent sound… a balancing act over months of how much is too much".
([Gulf News](https://gulfnews.com/entertainment/dunkirk-soundtrack-how-it-all-came-together-1.2066116),
[The Playlist](https://theplaylist.net/nolan-hans-zimmer-dunkirk-score-20171130/))
- **Rule:** `instruments.tick()` excites two metallic resonances (tick and tock) with a sharp click.
  The clock plays 8ths locked to the cue tempo and doubles to 16ths once intensity passes 0.75 (the
  "double-time" top of the build). It is on by default for tension and urgency.

**Texture and metric power over melody.** The *Dunkirk* score mixes synths with extended cello and
bass techniques. It aims for anxiety, texture and metric power more than tunes, and it is designed
to work hand in hand with the sound effects. ([MFiles review](https://www.mfiles.co.uk/reviews/hans-zimmer-dunkirk.htm),
[National Post via PressReader](https://www.pressreader.com/canada/national-post-latest-edition/20170728/281522226160019))
- **Rule:** tension uses few chords and long harmonic rhythm (two bars per chord). It leans on the
  phrygian ♭II and a pedal tone. The work is done by the pulse ostinato (16ths on root, fifth and
  octave), a sub-bass and the clock, while melody stays low and sparse (`piano_low`).

**The BRAAAM (Inception).** The origin is disputed. Zimmer's account is brass played into a piano in a
church with the sustain pedal down, plus "a bit of electronic nonsense". Mike Zarin says the sound
grew out of his teaser-trailer work. One breakdown names the instruments as bassoon, horn, trombone
and tuba in unison with timpani. ([Wikipedia: BRAAAM](https://en.wikipedia.org/wiki/BRAAAM),
[Northwestern: the origins of braaam](https://sites.northwestern.edu/hundredthmile/the-origins-of-braaam),
[Hollywood Reporter](https://www.hollywoodreporter.com/news/braaams-beginners-how-a-horn-793220))
- **Rule:** `instruments.braaam()` stacks detuned saws on the root, octave, twelfth and double octave.
  A filter snaps open in 80 ms and closes over about 1 s, under a 29 Hz growl and tanh drive, with a
  sine sub and a long hall. It fires only on the downbeat of an intense section (intensity ≥ 0.85
  for tension and urgency, 0.9 for triumph) or on request (`braaam: true`). Used sparingly, it
  punctuates; used constantly, it becomes a parody.

## Ludwig Göransson (Oppenheimer, Tenet)

- Nolan asked for the violin as Oppenheimer's voice. It moves between warm romance and mania through
  vibrato and bow pressure, and the theme grows from one violin to a full section as the story
  widens. Göransson reworked the horror string cluster into a melodic vibrato. Some themes, such as
  Los Alamos, are pure synthesiser. ([Film Stories](https://filmstories.co.uk/features/ludwig-goransson-interview-oppenheimer-composer-on-the-films-devastating-score/),
  [USC Thornton](https://music.usc.edu/?p=145187), [Slashfilm](https://slashfilm.com/1448770/composer-ludwig-goransson-oppenheimer-score-exclusive-interview),
  [Academy](https://attheacademy.oscars.org/features/ludwig-goransson-oppenheimer-interview))
- **Rule:** the strings in `instruments.strings()` have vibrato with a delayed onset (none on the
  attack, blooming after 0.25–0.55 s) and slow random pitch drift. The bow noise follows the
  register, and a crescendo "swell" breathes on long notes. Intensity adds the string layer in stages
  (pads first, then strings, then percussion), which is the one-violin-to-orchestra idea built as an
  arrangement rule.

## Documentary scoring (Netflix doc beds, Epic Mountain for Kurzgesagt, LEMMiNO, Fern)

What these share, from listening and from how the cues are released (Epic Mountain publishes the
Kurzgesagt music as albums; [kottke](https://kottke.org/18/01/the-soundtrack-to-kurzgesagt),
[Epic Mountain on SoundCloud](https://soundcloud.com/epicmountain/quantum-computers)):
1. **One idea per cue, repeated with variation.** A short motif is restated over each chord, and
   that repetition is what makes music sound composed rather than generated.
   **Rule:** a 4-note motif is chosen once per section, snapped to chord tones on strong beats, and
   given diatonic passing tones off the beat. It moves up a step on alternate repetitions.
2. **Wonder is bright modes and shimmering arpeggios.** The Epic Mountain sound for discovery is
   pluck and mallet 8ths over major or lydian add9 harmony, with a wide reverb.
   **Rule:** the `wonder` mood uses lydian (the ♯4 shimmer of I to II), add9 and maj7 voicings,
   Karplus-Strong plucks in 8ths, and 16th pluck ostinatos once intensity passes 0.35.
3. **Music fills the gaps and steps back under words.** Beds dip under narration and swell in the
   pauses, so a line lands, then the music answers it.
   **Rule:** in the mixer the music swells up in pauses longer than about 0.8 s (+5 dB over 0.9 s)
   and drops ahead of the next word (80 ms look-ahead).
4. **Chapter structure per cue: intro, build, drop out, resolve.** A cue starts with pads alone,
   adds layers bar by bar, thins out to almost nothing one bar before the climax (the "drop out"),
   comes back on a hit, and then either resolves to the tonic or cuts dead into a chapter card.
   **Rule:** `compose_section()` uses a two-bar intro ramp and a breakdown bar at `nb-3` on any
   rising build of 8 or more bars, followed by a boom and a reverse swell. Endings are `resolve`
   (land on the tonic and ring for 2.5 s), `cut`, or `flow`. Chapter cards are silence windows: the
   dry stems are gated, but the reverb keeps ringing into the card.
5. **Tempo locked to picture.** Cue tempi are chosen so the next section's downbeat lands on its cut.
   **Rule:** `lock_tempo()` rounds the section to a whole number of 4/4 bars and adjusts the bpm (the
   mood's tempo, usually within ±10 %) to fit.

## Harmony per mood (what is encoded in `theory.py`)

| mood | mode | progressions (scale degrees; colours) | harmonic rhythm | tempo |
|---|---|---|---|---|
| tension | phrygian | i(sus2)–i–♭VI–♭II · i–♭VI–iv–v · i(add9)–♭VI(add9)–i–♭II | 2 bars | 96 |
| wonder / discovery | lydian | I(add9)–II–vi7–V(sus2) · Imaj7–Vsus2–vi7–II · I(add9)–iii7–V–II | 1 bar | 104 |
| urgency | natural minor | i–♭VI–♭VII–v and rotations | 1 bar | 128 |
| melancholy | aeolian | i(add9)–♭VImaj7–♭III–♭VII · i–iv7–♭VImaj7–v(sus4) | 2 bars | 72 |
| triumph | major | I–V–vi–IV · ♭VI–♭VII–I(add9) (the "epic cadence") · IV(add9)–I–Vsus4–V | 1 bar | 92 |
| mystery | harmonic minor | i(add9)–♭VImaj7–iv–V · i–ii°–i–♭VI · i(sus2)–iv7–♭VImaj7♯11–V | 2 bars | 80 |

Voice leading (`theory.voice_lead`) picks, for each chord, the 4-voice voicing between D3 and D5
that minimises total voice movement. It adds penalties for drifting from the centre of the register,
for every voice moving the same way (parallel motion), and for semitone rubs between adjacent
voices. Voicings below G3 must not open with a close third or second, to avoid low mud. The bass
takes the chord root between G1 and G2.

Ostinato patterns are written as chord-tone indices (root, third, fifth, octave, tenth, twelfth,
diatonic ninth) rather than fixed semitones, so a pattern written for a minor chord never plays a
minor third over the ♭VI or ♭II major chords. The symbolic harmony report (`composer.LAST`) checks
this on every render.

## What we did not do, and why

- No sampled orchestra: no sample library we know of is both CC0 and good enough, and the brief is
  procedural numpy. Real recordings can still be used through `{type: 'track'}` cues (CC0 or public
  domain only).
- No live convolution with real hall IRs. The good free IRs (OpenAIR) are mostly CC-BY or
  CC-BY-NC, so we synthesise IRs instead: band-dependent RT60, early reflections, a density
  build-up and stereo-decorrelated tails.
