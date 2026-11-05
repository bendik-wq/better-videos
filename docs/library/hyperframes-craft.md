# HyperFrames craft notes: what HeyGen's skill teaches about story, motion, look and review

A distillation of the HyperFrames agent skill (HeyGen, **Apache-2.0**,
`github.com/heygen-com/hyperframes`, commit `32eb4c3`, 2026-11-05; CLI v0.9.17). Sources read:
`skills/hyperframes/SKILL.md`, every file in `skills/hyperframes/references/` (story, motion, look,
film, storyboard, storyboard-format, format, spec, captions, sound, review, overlays, runtimes,
types/{explainer, data, character, 3d, launch, music, vertical}),
`skills/reverse-any-video/` (SKILL.md and references start, animated, match, people), and
`skills/style-sampling/references/remix.md`. The text below is our summary, in our words. A few short
quotes are marked as quotes; the rest is paraphrase (Apache-2.0 permits both, with credit). Their numbers are presented as theirs: HeyGen says it **measured**
them frame by frame on its own launch films, which are short 20–90 s promos, not 15-minute
documentaries. Where a number needs scaling to our format, the scaling is marked **[ours]**.

How this fits our library: it sits beside `animation-study/STYLE-BIBLE.md` (our "Paper & Spring"
look), `video-autopsies/` (what top channels do) and the `shot-design` / `retention-script`
skills. Engine findings from our own test are in `hyperframes-engine-test.md`.

---

## 1. The big idea: a weak film is good motion wrapped around no story

Their opening diagnosis matches what our autopsies keep finding: *"Most weak films are good motion
around no story."* Their remedy is a sequence of decisions, made in words, before anything is built.

### 1.1 The one thing (story.md §1)
- **One line for what it is**, one for **what the viewer remembers, in the viewer's words** (not a
  slogan), and **one viewer doing one real task** as the spine. In an explainer the spine is *"one
  concrete example worked through"*. One real piece of data (a number, a file, an object) travels
  through the whole film from hook to payoff.
- **Keep facts apart from creative choices.** Every on-screen claim traces to a source. Never derive
  a claim the source didn't make. Their example: "40 min to 2 min" must not become "20× faster".
  Mark illustrative numbers as illustrative. (This matches our `fact-check-playbook.md`.)

### 1.2 Three storylines that are three different films (story.md §2)
- Sketch **5+ one-line ideas**, each pairing a **device** (what the story is) with a **form** (how the
  camera and cuts carry it). Drop the ones the subject can't carry, keep the **three that differ
  most**, and make one of them **"the bold one you would not have picked first."**
- Each storyline states its world, device and form; **the first two seconds exactly**; its beats in
  one line; its look in one line; its sound in one line. **Words only, nothing built** until one is
  picked. Pick for the story a stranger would follow and remember, *ahead of the most striking
  picture*.
- **Device menu** (theirs, abridged): a moment in someone's day · a character does the work · the
  result first · life before and after · a number lands · a question with the input inside it ·
  **the object is the explanation** (a machine whose working is the idea; the camera tours it).
- **Form menu**: one continuous take · object-to-object chain (each shot ends on the thing that opens
  the next) · **an endless zoom** (the detail turns out to be the next world) · a flight through one
  world · cut on the beat · **match cuts** (one shape holds while everything else changes) · split
  screen to one · one frame that rebuilds itself.
- **Their test:** *"A pitch where all three are plain cuts between scenes has not tried the forms."*

**[ours]** For a 15–20 min episode, run this once for the whole film (the spine) and again per
chapter (each chapter picks its own device and form, with no form repeated in adjacent chapters).
"The object is the explanation" plus "an endless zoom" is the core Paper & Spring grammar: a
mechanism you open, and scale ladders.

### 1.3 The hook (story.md §3, types/vertical.md)
- **The first two seconds are the densest of the film, and frame 0 is the thumbnail**: never black,
  never a logo alone. Open on the thing working, a real moment that creates the need, a question
  with the input inside it, or *"a sentence whose last word becomes the picture"*.
- **Let the old way fail on screen** before the relief arrives.
- Their tell: a prompt box being typed into as the opener.

### 1.4 Beat shares (story.md §4) and how to scale them
Their launch shape at about 35 s: hook 8 % · tension 12 % · reveal 8 % (20–30 % in) · proof 40 % ·
**payoff 20 % at 60–80 % in, "the biggest visual moment, once"** · claim 8 % · end card 8 %. The
process runs fast, and the payoff plays at normal speed. **[ours]** Inside each chapter: the
biggest visual moment lands once, 60–80 % of the way through, at normal speed, after a
0.3–0.75 s hold.

### 1.5 Worlds (story.md §5)
A film visits **several worlds, each with its own ground, light and scale**, never one dark canvas
with small UI floating in it. **Enter each world through an object already on screen.** Keep one
*home stage* to return to, one *carrier* the eye follows, and the palette and type constant
across worlds. **[ours]** Our home stage is the drafting table. The carrier is the Winder or the
one red thing.

### 1.6 Copy rules (story.md §6, explainer.md)
- Titles ≤ 6 words a line (an explainer's up to ~10), one line on screen at a time, no trailing
  periods. Read time is **0.5 s + 0.3 s per word**, and the film's last line holds **≥ 2 s**.
- **Show, don't list**: no bullet slides or three-card rows. Similar things each get their own
  picture.
- **With a voiceover, the screen never repeats the spoken sentence word for word.**
- They keep a short list of launch-ad hype verbs to avoid (the "seamless / game-changing"
  family), and no opening on an introduction line or a logo. **[ours]** Our own banned-phrase list
  lives in `narration-style.md`; use that, not theirs.
- **Two tests:** read the lines alone, and a stranger should get the pitch; watch the pictures
  alone, and they should tell the same story.

### 1.7 Explainers specifically (types/explainer.md)
- **Ground it first:** start where the viewer already is (a person, a place or a situation they
  know) and a question they'd ask about it. The abstract device enters *inside* that situation as
  the thing that answers the question, and the film **returns to the person at the end**. Opening
  on the device alone gives you a diagram, not an explainer.
- Devices that explain: the object is the explanation · **one diagram that grows** (one part per
  beat, each appearing when it is named) · **continuous transformation** (each step morphs out of
  the last, so a cut never loses the thread) · the worked example.
- **Shapes of information**: pick the shape first, then the picture. The shapes are a number that
  lands, a myth turned over (wrong idea struck through, right one printed over it), before and
  after, many converging into a few, a network densifying, one chosen out of many, steps in order,
  a real document with the detail circled, a quote as a poster, a chapter card. Similar lines then
  get different pictures.
- Labels sit **on the part they name** (with a leader line), appear with it, and **no legends**.
- *"A beautiful wrong diagram is worse than none."* Check the science of each step before
  animating it.
- Tells: bullets, icons in circles, three cards in a row, the whole diagram at once, the narrator
  repeating the on-screen text.

### 1.8 Data (types/data.md)
- **A number is earned by the scene before it, then made physical** (a count becomes a skyline, a
  share becomes a crowd). The number is the biggest thing on screen, set in tabular figures. A
  count-up runs **1.2–1.6 s, then holds**. One data module drives every figure, and a source line
  is on screen.
- Charts are built **in reading order**: frame and axis → reference line → data drawing in → **one**
  annotation on the point that matters. Highlight one series and grey the rest. **The same object
  carries across beats** (a bar becomes the ground of the next scene).
- Tells: KPI-card grids, dashboards, pie charts, every number counting at once, unsourced numbers.

### 1.9 Characters (types/character.md)
- A recurring character gives each transition a reason to happen and gives the film its jokes.
- **Mood changes go through a take**: anticipation, squash, the new face, settle. Never a snap.
- **Code moves everything at once, on one curve, by the same amount. Break that**: head leads and
  arms follow; vary the amounts; never move both arms, both eyes or a crowd in unison.
- **Contact sells it**: feet on the ground, props held, eyes on what they look at.
- **One action = one read**: lead the eye to where it will happen, play the action fast, then hold
  the reaction. *"A sign or caption that repeats what the action already shows is the classic
  failure."*
- **Build a rig as parameters over time**, with mood as keyed states (`[[t0,"normal"],[t1,"scared"]]`)
  the rig eases between. **Hand-drawn boil**: redraw outlines ~12×/s with jitter seeded by
  `floor(t*12)`, so the line lives while the character holds and every render matches.
- One chapter per sub-composition, all drawing from the same rig and helpers.

### 1.10 3D and simulations (types/3d.md)
**Simulate once at load into arrays, then look up the state at t**, so `render(t)` stays pure. One
hero object beats a crowd: **fly into it rather than orbit it** (*"one dive is worth ten turns"*).
Turn the environment, not the object, so highlights sweep. Clamp divide-by-zero values: one NaN
pixel through bloom blacks out a whole frame.

---

## 2. Motion (motion.md): the measured numbers

These are the most directly usable numbers in the repo. Ours are in STYLE-BIBLE §10. Where theirs
differ, the note says which wins.

| Topic | HyperFrames default |
|---|---|
| Fast move | 0.3–0.6 s, motion blur peaking at the fastest frame: 6–12 px on text-sized elements, 15–20 px full-frame, horizontal-only on a horizontal move. One move = one tween |
| **Arrive slow, leave clean** | Long-tailed ease-outs on arrivals; **exits 40–50 % shorter** than entrances; an exit is one smooth motion (never slide, stop, leave). Snappy entrances read as glitches: slowing the whole video by ~1 s often fixes it |
| **Ease by role** | Arrival `expo.out` / `power4.out`; camera move or colour flood `power2.inOut`; zoom-through or exit `power3.in`; linear only for rotation and progress. One ease and one duration on everything is, in their words, the default that makes a film "feel generated". |
| Springs by damping ratio | 1.0 no bounce · **0.7–0.85 premium** · 0.4–0.6 playful · < 0.3 cartoon. Position and size may bounce; **opacity and colour never do** |
| Overlap | Start the next element when the previous is **30–50 % done** (fully sequential = robotic; all at once = cheap) |
| Stagger | Letters 1 frame apart, words 60–120 ms, list items 40–80 ms |
| Beat grid | frames per beat = fps × 60 / BPM; compute each beat from its index, **never accumulate rounded beats** (drift) |
| Cuts | **At the fastest frame of a move**, matching direction and speed on both sides; the new screen arrives slightly large and settles |
| **Titles** | **A landed title is dead still.** Vary entrances within a film: per-word blur 6→0 px in 0.13 s, 0.067 s apart (no translate); per-word grey→ink; whole-line blur 8→0 in 0.13–0.2 s; per-letter for a name; a word rolling like a slot machine (~0.1 s a roll) |
| Holds | 0.5 s + 0.3 s/word; a 1–2-word chapter line can hold 0.4 s; exit with a 0.13–0.25 s blur-out |
| Title size | 4–9 % of frame height; quiet lines 2.5–4 % against hero words filling 60–90 % of the width |
| Rhythm | Montage cuts 0.13–0.8 s; a demo holds one framing 7–10 s while things act; **average shot 1.8–3 s with motion inside**; hold 0.3–0.75 s before the payoff |
| Good continuous motion | The UI working, footage, a character acting, a 3D world turning, a background stage orbiting **3–5° a second** |
| **Looks generated** | Breathing, floating or pulsing loops on titles and UI; titles still sliding or scaling after they land; a slow creeping push late in a scene; bounce on UI; click rings; every scene entering the same way; everything fading and sliding up |

**Conflict with our bible, resolved [ours]:** STYLE-BIBLE §10.6 says "nothing is ever fully
still" (a gear turns, the key ticks). HyperFrames says titles and UI must be dead still once they
land. Both hold: **type and data blocks are dead still once landed; the world and the characters
keep ticking.** Never put the camera "breathe" (`CAM.breathe`) on a frame whose main read is a
title.

### 2.1 Transitions with a cause
Use **3–5 kinds in a film, each caused by something on screen**. At most **a third of the seams
between beats are hard cuts**, and worlds never crossfade into each other. Their recipe list
(film.md) gives durations and eases for about nine transition kinds. In our paraphrase, the
families are:
- **Through an object**: zoom through a small element until it fills the frame, or let a card
  grow past the frame and become the next world. These are fast (≈0.35–0.65 s) on a strong
  ease-in, and the surroundings fall away.
- **Same stage, new content**: a morph (one container widens into the next in ≈0.2 s with a
  short horizontal blur), a carry-across (the result shrinks and lands inside the next world), a
  colour flood (the hero stays while the ground changes in ≈0.4 s), or a blur swap.
- **Punctuation**: a short whip, an iris from the point of action, and a dip cut (darken the
  outgoing frame for a few frames so the hard cut reads as meant).
Read the source for the exact numbers before building one; treat them as starting values for
20–90 s promos, not rules for a documentary.

Their fix table is worth keeping. In short: if it feels too fast, slow the camera moves only;
if it feels like slides, enter each scene through an object on screen; if the titles feel
restless, land them and hold them still.

**[ours]** Map onto our kit (`engine/transitions.js`, bible §11): case-open is "object becomes the
world"; the loupe is "zoom through"; stamp-drop plus paper-ring is a "colour flood" variant. Add a
**dip cut** and a **morph**. In our hf-test the planet-dot → counter-housing morph read cleanly
in 0.5 s (see the engine test doc).

### 2.2 Mechanism rules
- Punch-ins, zooms and reframes: tween `scale` and `x`/`y` on a **wrapper**, never on the timed
  media. Crops and reveals: tween `clip-path` or a mask on an inner wrapper.
- A move that must land on a hit starts **40–190 ms early**; a reaction starts **0–45 ms after**;
  **the hit itself is an instant set (easing a hit kills it)** (film.md "On music").
- Any single treatment goes stale after **~6 s**: lengthen a section with a hold or a new
  treatment, never by slowing tweens.

---

## 3. Look (look.md, spec.md)

- **Left alone, the same brief produces the same look run after run, and banning that look just
  moves it to the next default.** Outside input breaks it, in this order: the project's design spec
  → a real brand → a reference the person gave → the subject's own world.
- **A reference gives its grammar, never its content**: shot lengths, how titles enter and leave,
  transitions, palette *roles*, type scale and weight. Write it down, marking what was measured
  apart from what was guessed. (This is the legal and creative line we already hold with
  Kurzgesagt and others in STYLE-BIBLE §0.)
- **Turn every adjective into a number** in a `SPEC.md`: GOAL · OUTPUT · TIME · LOOK (hex, faces,
  sizes, the medium and its numbers, shadow offset/blur/opacity, grain %, vignette %) · OBJECTS
  (each drawn so it reads without a label: *"a mirror is silvered glass with a bright edge and a
  mount, not a bar"*) · MOTION (eases by role, springs as damping, durations in frames) · SHOTS
  (one line each: frames, hero move, the read with its window, sound, hand-off) · BANNED · QA.
- Their word-to-number table: *premium* = a material with numbers; *modern* = a camera and a type
  system; *clean* = a grid and a ration (12 cols, 96 px margins, accent on one word); *dynamic* =
  cuts on the beat, layout change per bar, one hero move per shot; *playful* = springs at damping
  0.45–0.6, 10–30 % exaggerated poses; *cinematic* = a 35 mm framing, key light upper left, rim
  behind, 6 % vignette.
- **Composition numbers:** the hero fills **≥ 40 %** of the frame's height or width; **one hero move
  per shot**, with secondary moves travelling 50–70 % as far and starting 100–200 ms later while
  everything else holds; **something new every 2–4 s**; readable text ≥ 28 px at 1080 (2.6 % of
  the short side). *"Too many words: cut words, never shrink type."*
- **A look holds together when it is the rules of one medium, not a palette.** Their risograph
  example: paper, ink A, ink B (one accent, one focus a frame), overprint (+3 px misregistration)
  and halftone, and *the motion comes from the medium* (printed plate by plate, not faded in).
  Our Paper & Spring is exactly this kind of medium look (off-register pen, halftone, brass
  mechanism, one red thing). Keep the rule that **motion comes from the medium**: things are
  stamped, hinged, wound and printed, not faded.
- **Their "BANNED by default" list** (where generated video lands): a dark or navy void with small
  things floating; glow, bloom, neon, lens flares, glowing orbs, floating particles; purple or blue
  gradients, mesh gradients, glass cards; **the cream-paper + serif display + italic accent words +
  "01/02" labels + small mono caps labels + pill chips look**; everything centred; everything fading
  in at once; text moving while read; corner labels, HUD readouts, corner brackets; three cards in a
  row; a title over a dimmed screenshot; the docked logo.
  **[ours] Warning:** Paper & Spring sits close to their "cream paper + serif + small mono caps"
  tell (paper `#f7f6f1`, Instrument Serif chapter titles, Plex Mono caps labels). What keeps ours off
  that default is the **medium** (pen line, halftone, mechanism, the one red thing). So: never
  ship a frame that is *only* paper + serif + mono label; every frame needs at least three of
  the five distinctness tells (STYLE-BIBLE §0).
- Video facts: a full-screen linear gradient on a dark ground bands under H.264 (use radial, solid,
  or solid plus a local glow); an accent at 5 % opacity vanishes in compression (use 15–25 % for
  atmosphere, full saturation for the focal element).
- Make it re-brandable: palette and faces as root variables (`var(--color-accent)`).

---

## 4. Sound (sound.md)

- A film over ~15 s that tells something gets a **music bed and sounds on its visible actions**.
  **Narrated: the voice is the clock**, and text lands on the word that says it. Music-only: the
  music is the clock.
- *"Let the sound act out the story"*: the old way near silence, the music opening when the answer
  appears, the music holding back until the payoff.
- **Effects are few and exact; every one has a cause on screen**: click (a real click), whoosh (a
  cut or a fast big move), key tick (text arriving), pop (a badge or number landing), and a
  **riser into impact once in the film**. Place a sound so its **peak lands one frame after its
  picture** (light before sound). Each hit sits **3–6 dB over the bed**. **Rotate 2–3 takes** of a
  repeated sound (*"the same whoosh on every cut is the most common tell"*). A bed whose energy is
  under 150 Hz plays as nothing on a phone.
- Levels: music under voice ≈ 0.14 gain; true peak ≤ −1 dBTP; social mix −16 to −14 LUFS.
- Their own humility rule, which we should copy: the agent **cannot hear**, so the delivery note
  says sound was *measured, not heard*.
- **[ours]** Our `engine/score.py` + `sfx.py` already go further (we generate the score). Adopt:
  peak one frame after the picture, 2–3 rotating takes per effect, riser-impact once per film
  (plus once per chapter turn at most), and an under-150 Hz energy check in `engine/music/qa.py`.

---

## 5. Captions and overlays (captions.md, overlays.md), briefly

- Caption groups: 2–3 words for high energy, 3–5 conversational, 4–6 calm. Break at sentence ends
  or 150 ms pauses. One group at a time. Never start a caption at exactly 0 s. Every group gets a
  hard kill (`tl.set(... visibility hidden)`) after its exit.
- Size each group to fit; landscape captions sit 80–120 px from the bottom, inside the 80 %
  title-safe box. Over footage, choose the blend by the background brightness (< 60 screen, 60–180
  overlay, > 180 normal) and use a scrim the size of the text, never a full-width bar.
- Card density over a talking head: one per 6–8 s under 1 min, one per 8–12 s up to 3 min, one per
  12–20 s up to 10 min. A static card goes dead after ~8 s.
- Whisper invents "Thank you." over silence: drop words that start inside a final silence.

---

## 6. Review (review.md): the most valuable process piece

*"You wrote the timeline, so you know what happens; the viewer sees it once, at full speed, often
on a phone."* Review as **a harsh motion director, not a proud author.**

1. **Measure**: `check` (lint, runtime, layout, contrast, plus craft warnings: `line_unread`,
   `dead_stretch` > 3 s with nothing changing, `text_below_floor`, `first_frame_empty`,
   `film_silent`). A warning is a question: fix it, or keep it deliberately and say why.
2. **Look**: contact sheets of every scene's start and middle, **a strip across every cut (−0.2 s
   to +0.2 s)**, and the beat frames **at phone width (360 px)**.
3. **Describe every beat frame in one sentence as a stranger would, naming every object.** An object
   you'd have to explain ("those bars are mirrors") is a **P0**.
4. Read the beat frames in order: does each one cause the next? Compare each with its line in
   SPEC. Name every default the frames show and add it to BANNED.
5. One pass per question: does it read as what it is · does the subject separate from the ground ·
   framing and contact · **timing as a first-time viewer** · tells · **the pictures alone** · **the
   phone sheet**.
6. Notes go in one format: `t=4.2s · where · problem → exact change · what stays`, ranked **P0**
   (breaks the read or the contract), **P1** (weakens it), P2 (polish). Fix text first, then
   timing, then detail. **Never score the film out of 10**: a score finds nothing to fix. A film that feels busy:
   cut about a third of the motion and keep the moves that lead the eye.
7. Fresh eyes: a sub-agent gets only the storyboard and the sheets and returns P0/P1 lines.
8. End with a `REVIEW.md` delivery note: creative calls, storylines not built, what was measured vs
   only looked at, **the weakest shot and what you'd change**, warnings kept on purpose.

**[ours]** Our QA loop should adopt this loop, adding our own automated per-frame checks
(STYLE-BIBLE §17: red share ≤ 3 %, banned hues, mean L/S range). We should also stop numeric "8/10"
scoring of drafts, which our critic passes sometimes do, in favour of ranked P0/P1 lines.

---

## 7. Storyboards (storyboard.md, storyboard-format.md)

- Pose each shot **in the real composition at its key moment** (real words, fonts and colours,
  focal point big enough for a phone), snapshot all the stills in one run, and lay them out as a
  board (`boards/storyboard.html`). Stop for a go. Notes on a frame change only that frame.
- `STORYBOARD.md` frames carry `status` (outline → built → animated), `duration`, `transition_in`,
  `voiceover`, and two keys every plan should have:
  **`reads`**, what the viewer must understand in order, each with a non-overlapping time window
  long enough for its words, and **`sound`**, the bed, the effects on visible actions, or silence.
- **[ours]** Our `shot-design` output should gain `reads` (with windows) and `sound` per shot. Those
  are what make a shot plan checkable.

---

## 8. Reverse-any-video and style-sampling: the method (the product itself is Pro)

`reverse-any-video` and style-sampling templates are **paid HyperFrames Pro features** that sign
into HeyGen. We did not sign in or pay. The method in their docs is free to learn, and most of it
we can do with ffmpeg plus the free `measure` commands:

- **The original decides the frame**: probe size, fps (NTSC stays fractional) and duration as frames
  ÷ fps; find every cut (`measure cuts`, which catches jump cuts and punch-ins that scene scores
  miss); **read consecutive frames wherever something changes** (sheets a second apart miss 1–3-frame
  timing, entry direction, blur at cuts and one-frame flashes).
- **Every layer, rebuilt**: components (text, cards, charts, maps) in HTML; sub-assets cut from their
  own box; never play the original's whole frame. Graphics change on exact frames: *an element
  fully there on frame 241 is set there, not faded in.* Size text from its ink (crop and compare
  ink boxes), then letter-spacing. Measure the backdrop on a grid over time. Fast moves need
  directional blur (`feGaussianBlur stdDeviation="24 0"`; CSS `blur()` is symmetric and wrong).
- **Animated or painted films**: the character, world and camera are one picture, so decide shot by
  shot what code can carry (text, logos, light on the picture, a camera over a still world rebuilt
  from clean plates) and what must be generated (a character acting, morphing pictures, flowing
  detail).
- **Style-sampling remix (remix.md)**: a fixed order (read → settle voice → facts + script → stop 1
  storyboard → voice → footage → shot plan + build → checks → stop 2 draft → render). Two rules we
  should copy:
  - Never use the sampled creator's face, voice, footage, wordmark or show name.
  - Before adding any graphic, find the creator's own precedent for that kind of moment; with none,
    leave it out. **[ours]** Translated: before adding any graphic, find *our own* precedent in
    STYLE-BIBLE §16 (RC-1…RC-6) or the shot-design kit; with none, either don't add it or log it
    as a new kit item.
  - It also asks for a `GAPS.md` per project (where the template was missing, unclear or wrong) and
    a `LOG.md`, and for the episode's numbers to be reported beside the series' own: cuts a minute,
    pause density, longest hold, loudness, sound effects on picture changes. **[ours]** Add both
    files and that comparison table to our make-video QA.

---

## 9. The render contract (format.md, runtimes.md): why it matters even if we never use HyperFrames

Their determinism rules are the same as ours (`engine/motion.js`), stated more sharply:
- **Everything visible is a function of timeline time.** No `Date.now()`, no unseeded random, no
  timers, no `requestAnimationFrame` clock, no infinite repeats. Seed with mulberry32. Measure layout
  once, never in `onUpdate`.
- **Simulate once at load, look up at t.**
- `fromTo`, never `from`, in anything that is re-seeked. **Gotcha we hit in our own test:** several
  `fromTo` on one element leave the *last-authored* from-state as the resting state before the first
  tween runs (GSAP renders from-values immediately). Their lint `gsap_repeated_fromto_without_baseline`
  caught it. Fix: `immediateRender:false` on later ones, or render the timeline to the end and back
  once at build (`tl.progress(1).progress(0)`).
- Heavy setup registers a readiness promise (`window.__hf.buildReady[...]`) rather than waiting on
  frames.

---

## 10. What to adopt now (summary for ep10)

1. **SPEC.md per episode and per chapter**, with adjectives as numbers and a BANNED line that grows
   after every review.
2. **Three storylines per chapter** (device × form), including one bold option; words before builds.
3. **Ease by role** plus "arrive slow, leave clean", exits 40–50 % shorter, overlap 30–50 %, and
   titles dead still once landed.
4. **3–5 transition kinds per film, each caused by something on screen**; ≤ 1/3 hard cuts between
   beats; add the dip cut and morph to `transitions.js`.
5. **`reads` + `sound` per shot** in shot-design output.
6. **The review loop of §6** with P0/P1 lines, the stranger-description test, the phone-width sheet,
   and `REVIEW.md`. No numeric scores.
7. **Sound placement**: peak one frame after the picture, rotating takes, riser-impact once.
8. Use the free HyperFrames `measure` and `check`-style craft checks on our own renders where they
   help (see `hyperframes-engine-test.md` §5).

*Credit: HyperFrames © HeyGen, licensed under the Apache License 2.0. Quotations are short excerpts
for commentary; everything else is our paraphrase.*
