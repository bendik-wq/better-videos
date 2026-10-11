# Editing library: edit craft that serves retention

Rules for how the picture and sound carry a narration-first faceless documentary. Each rule says
**what to do**, **why it holds viewers**, and **how it maps onto our engine**. The per-shot
mechanics (shot types, lenses, transitions, the no-repeat rules and the per-section ASL table)
live in `.claude/skills/shot-design/SKILL.md`; this file is the *why* and the extra rules
around it. Visual taste is in `docs/style-bible.md`; the camera and look craft in
`docs/research/visual-craft.md`.

Trust labels as in `retention-playbook.md`. **[test]** = measured on our engine.

---

## 0. First principles

1. **Pace is the rate of new information, not the rate of cuts.** "It's not the cutting speed,
   it's the speed at which you introduce progressive novel information" (Mario Joos, former
   MrBeast retention editor, [Vidpros](https://vidpros.com/retention-editing-what-you-can-learn-from-mario-joos/)) [practitioner].
   A fast cut that shows nothing new is noise; a slow push that reveals a new fact is pace.
2. **The fast-cut era peaked.** Retention editing cut every **1.3–1.5 s** (editor Dara Pesheva,
   [Gigazine](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end)).
   In 2024 MrBeast himself "slowed down our videos, focused on story telling, let scenes breathe"
   and said the ultra-fast style "doesn't even work" (same source) [primary, via press].
3. **Film has been speeding up for a century anyway.** Average shot length in English-language
   films fell from about 12 s (1930) to about 2.5 s; Quantum of Solace averages 1.7 s (James
   Cutting, [ScienceDaily](https://www.sciencedaily.com/releases/2010/02/100223121435.htm),
   [i-Perception 2011](https://journals.sagepub.com/doi/reader/10.1068/i0441aap)) [research].
   Viewers are trained for change; give it to them through *information and motion*, not only cuts.
4. **Emotion first.** Walter Murch's "Rule of Six" ranks what a cut must serve: emotion, story,
   rhythm, eye-trace, the 2D screen plane, then 3D space. He weights emotion at over half of
   what makes a good cut ([StudioBinder](https://www.studiobinder.com/blog/walter-murch-rule-of-six/),
   [No Film School](https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch)) [practitioner].
   If a cut is right emotionally but breaks continuity, keep it.
5. **Know your minute.** "You must always know what minute mark the content you are working on
   is" ([memo](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/)).
   Edit density follows the retention curve: densest in minute 1, very strong through minute 6,
   then sustainable.

---

## 1. Cut rate by section

The ASL table lives in `shot-design` §6. Here is the **visual-change budget** around it. A
"visual change" is a cut, a new annotation drawing on, a counter starting, a light event, a
camera gear change, or a type card. It is **not** a continuing camera move.

| Section | Max gap between visual changes | Why |
|---|---|---|
| Cold open (0:00–0:30) | **3 s** | The biggest loss is in minute one (memo: ~21M of 60M gone); every second must earn the next |
| Stakes and tease (0:30–1:00) | 4 s | Still inside the minute that loses most viewers |
| Ch.1–2 (1:00–~6:00) | 5 s | Memo: "quick scene changes" in minutes 3–6 |
| Mechanism / lull (Ch.3) | 6 s, with in-shot changes every 2–3 s | Slower explanation is allowed here, but it must stay visual |
| Tension build | 8 s, while light, drone or push keeps rising | A rising continuous change counts |
| Reveal landing | hold 6–10 s after the hit | The viewer needs time to feel it (Murch: emotion first) |
| Twist and payoff (Ch.4–5) | 5 s | Back halves have "killed" videos (memo); don't coast |

**Deliberate holds** (a static or near-static frame over 8 s) are allowed **at most twice per
chapter**, and only on a reveal, a document read, or an emotional beat. Log them in the shot plan.

---

## 2. Pattern interrupts every 30–40 s

The user's cadence for this channel is a **re-hook every 30–40 s** (the playbook's earlier
~90 s is superseded). A re-hook is a **script** beat (`hooks.md` §16); a pattern interrupt is
the **picture and sound** change that lands with it. They must land on the same beat.

Practitioner guidance ranges from an interrupt every 10–30 s, with the first near 25–35 s
([AIR Media-Tech](https://air.io/en/youtube-hacks/advanced-retention-editing-cutting-patterns-that-keep-viewers-past-minute-8),
[Creator Essentials](https://www.creatoressentials.com/glossary/pattern-interrupt/)) [vendor]. No
official YouTube number exists. Our rule: **small visual changes every ≤5 s (§1), plus a change
of *kind* every 30–40 s.**

**A change of kind** is one of these (rotate; never the same kind twice in a row):

| Kind | Example in our engine |
|---|---|
| Scale jump | Macro on an object → orbital map (or the reverse); the zoom oner |
| Mode switch | 3D set → document on a desk → chart → quote card → archival photo on a card |
| Light event | Lights go off; a sodium lamp clunks on; a flash frame on a tonal shift |
| Sound event | The drone drops out; a hard silence before a number; an impact on the cut |
| Camera gear change | Smooth dolly → step-print smear (≤1 sequence per chapter) |
| Time card | "1999 · MENLO PARK" in Plex Mono, hard cut |
| Annotation | A red loop draws on a tracked 3D detail |
| Counter | A number ticks up (the stair-step made visible) |

**Interrupts must be motivated** (style bible): by a word in the VO, a turn in the story, or a
sound. Random zooms, whooshes and shakes are banned; a documentary-focused guide makes the same
point that constant zooms, captions and sound hits "create activity without meaning"
([Creator Essentials](https://www.creatoressentials.com/glossary/pattern-interrupt/)).

**Place the first interrupt of kind at 0:25–0:35**, where the first big drop-off sits
([AIR Media-Tech](https://air.io/en/youtube-hacks/advanced-retention-editing-cutting-patterns-that-keep-viewers-past-minute-8)) [vendor].
In our hook anatomy that's the turn → question moment (`hooks.md` §0).

---

## 3. The visual variety budget

Faceless videos die from sameness: forty minutes of one 3D style feels like one long shot.
Budget variety per chapter like money.

**Per 3 minutes of runtime, use at least 4 different modes:**

1. 3D set (hero object, diorama, room, city)
2. Map or globe (2D or 3D)
3. Document or evidence (filing, memo, photo on a desk, screen capture)
4. Chart or number (counter, bar, line, scale comparison)
5. Typography (quote card, chapter card, time card)
6. Archival photo or footage on a 3D card
7. Abstract or metaphor (the seeing stone, a vault, light in fog)

**Caps:**

- No mode over **45%** of a chapter's runtime, and none over **60 s** continuous.
- Each chapter gets one **light state** of its own (palette from the style bible), so chapters
  feel like places.
- Reusing a set needs a new angle, lens and light state (`shot-design` §8).
- Rationed effects per episode: dolly zoom ≤1, Dutch ≤2, whip ≤1 per minute, flash frames ≤1
  per chapter, step-print ≤1 per chapter (`shot-design` §8).
- **Literal versus lateral illustration**: alternate shots that show exactly what the VO names
  (literal) with shots that show its implication or metaphor (lateral). Aim for about 60/40.
  All-literal feels like a slideshow; all-lateral loses the viewer [house].

---

## 4. Sound carries the cut

In a narration-first video, sound is half the edit. Our mix is VO-led with a ducked drone bed
(`engine/render.mjs` sidechain compressor), so sound design must be deliberate.

- **Cut on sound.** Every hard cut lands on a sound event: a clunk, a click, a hit, the first
  syllable of a stressed word (style bible). Cuts on silence feel like errors.
- **J-cut the ambience**: the incoming shot's ambience starts **0.3–1.0 s before** the picture
  cut (`shot-design` §7). The ear arrives first and the picture confirms it, which makes the cut
  feel motivated. A J-cut is "audio leads picture"; an L-cut is "audio lags picture"
  ([FilmDaft](https://filmdaft.com/the-l-cut-and-j-cut-how-film-editors-use-audio-to-control-time/)).
- **L-cut the tail**: let the outgoing shot's ambience or music tail run **0.3–0.8 s** under the
  next picture when the story continues in the same thought. It smooths dense explanation.
- **Silence is the loudest hit.** Drop the drone **0.5–1.0 s before** a reveal number or a
  chapter card, then hit. Use it at most once per 2 minutes, or it stops working.
- **Risers into reveals**: a 1–2 s rising tone or drone swell that peaks on the cut. Never a
  stock whoosh (style bible: never).
- **Room tone continuity**: each set has a constant bed (hum, wind, water). Changing the bed is
  itself a scene change; don't change it mid-scene.
- **Music changes at structure, not at random.** A cue changes at chapter cards, at the twist,
  and at the payoff. Changing it mid-chapter reads as a new section.
- **Duck harder under dense facts.** When the VO carries numbers, the bed sits lower (the
  sidechain does this; add a manual dip for reveal lines).
- **Every interrupt of kind (§2) has a sound signature.** No silent pattern interrupts.

---

## 5. J/L cuts and timing for narration

Narration-first editing has no on-camera speaker, so "J/L cuts" are about **where the picture
changes relative to the VO**. `engine/voice.py` aligns every script word to a timestamp
(`script_align`), so shots and annotations can key off exact words.

- **Cut on the key noun, not the line start.** A new picture lands on the stressed word that
  names it ("…was the C.I.A."), not on the first word of the sentence. Most of the time this is
  the last important word in the sentence.
- **Eye slightly ahead of the ear**: let the picture arrive **0–4 frames (≈0–70 ms at 60 fps)
  before** the word it illustrates. The viewer sees, then hears confirmation [house; standard
  motion-graphics practice].
- **Picture J-cut for transitions**: on a new scene, cut picture **0.3–0.6 s before the VO
  starts the new line** (inside `padIn`). The viewer reorients during the silence, so the first
  words land on a settled eye.
- **Picture L-cut for reflection**: after a heavy line, hold the outgoing picture **0.5–1.0 s
  into `padOut`** before cutting, so the line can land.
- **Annotations draw on the word**: red loops, leader lines and labels start on their word and
  finish within 0.5 s, staged with a 2–4 frame overlap (`shot-design` checklist).
- **Numbers count up to the word**: a counter should *arrive* at its final value on the spoken
  number, not start on it.
- **Never cut inside a word**, and never during the last 3 frames of a word.

---

## 6. When to hold and when to cut

**Cut when:**

- new information arrives in the VO (a new noun, a new number, a "but");
- the eye has finished scanning the frame. A simple frame with one subject reads in about
  **2–3 s**; a busy frame takes longer, so simplify it instead of holding;
- a sound event offers a cut point (§4);
- the camera move has delivered its motivation (it arrived where the word pointed).

**Hold when:**

- **a reveal is landing**: 6–10 s after the hit (`shot-design` §6);
- **the viewer must read**: hold for about **0.3 s per word on screen + 1 s**. Adult silent
  reading averages about 238 words per minute for non-fiction (Brysbaert, 2019,
  [Journal of Memory and Language](https://doi.org/10.1016/j.jml.2019.104047)) [research], but
  viewers are also listening, so budget slower than 4 words/s;
- **a diagram is being explained**: until the VO finishes with it, plus 1 s;
- **the camera move is the story**: a oner, a descent from orbit, a reveal by dolly. Don't cut a
  move that is still delivering information;
- **emotion**: a quiet beat after a human cost. Murch's first criterion.

**Never:**

- hold a frame that has stopped changing *and* stopped informing (the boring frame, §9);
- cut away from a document before the highlighted line has been read;
- cut on a beat that the VO has not reached yet (the picture spoils the line).

---

## 7. B-roll density for a faceless documentary

- **100% coverage.** Every second of VO has a picture that is deliberately chosen. There is no
  "talking head" to fall back on.
- **Each picture adds, never repeats** what the VO says word for word (style bible; Mayer's
  redundancy principle, §8).
- **Vox's kill rule**: make a video only when the story has distinctly visual elements;
  "narration over stock footage doesn't qualify" (Joe Posner, via
  [The Long Story](https://thelongstory.substack.com/p/why-the-best-journalists-on-youtube)) [press].
  Apply it per chapter: if a chapter has no distinctly visual element, rework it.
- **One visual idea per shot**, roughly 4–12 s per VO line (`retention-script` handoff).
- **Recurring visual anchors**: the hero object, the traced unit (`script-patterns.md` §1.3) and
  the map return across chapters. Recurrence builds callbacks and saves render budget.
- **Primary-source density**: at least **one primary document on screen per chapter** (filing,
  ruling, memo, archive photo, chart from the source). This is our wow factor (memo: "anything
  no other youtuber can do") and our fact-safety evidence at the same time.
- **Stock and AI imagery**: never stock-looking AI images (style bible). Real archive on a 3D
  card beats a generated image.

---

## 8. On-screen text rules

Evidence from multimedia-learning research (Richard Mayer's principles,
[NUS summary](https://medicine.nus.edu.sg/medixperience/scholarly-article/mayers-12-principles-of-multimedia-instruction/),
[Mayer 2020 PDF](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf)) [research]:

- **Redundancy**: people learn better from narration plus graphics than from narration plus
  graphics plus the same words as on-screen text. **Exception**: short text that names the key
  point and sits next to the part of the graphic it describes helps.
- **Signalling**: arrows, highlights and callouts that point at what matters help.
- **Modality**: spoken words beat printed words beside graphics, because printed text splits
  visual attention.

**House rules that follow:**

1. **Never caption the VO verbatim** (burned-in subtitles are for Shorts only; YouTube CC
   handles accessibility).
2. **Labels ≤5 words**, placed **next to the thing they label** (a leader line), drawn on the
   word.
3. **Numbers on screen get a source line** in Plex Mono caps: `$42.0B · FDIC · MAR 2023`.
4. **Quote cards**: ≤25 words, attributed (name, role, venue, date), held for reading time (§6);
   the VO reads the quote aloud while the text sits on screen (here redundancy is the point:
   exact words matter).
5. **One text element at a time** in the hero region; metadata can coexist in a corner.
6. **Type families**: Instrument Serif for names, numbers, titles; IBM Plex Mono tracked caps for
   metadata; Archivo Narrow Bold for red numerals only. No gradients, glow or outlines (style bible).
7. **Corners and edges**, never a centred lower third (style bible).
8. **Contrast**: aim for WCAG's 4.5:1 for anything that must be read
   ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)). Our darkness-first
   look makes this easy: put text over shadow, never over the lit hero.

---

## 9. Mobile, TV and legibility

**Where people watch.** Phones were about 70% of US adults' YouTube time in 2016 (comScore), but
the share has fallen as TV grew; eMarketer now forecasts under half of US YouTube time on mobile
([eMarketer](https://www.emarketer.com/content/youtube-no-longer-mostly-mobile-platform),
[Pixability](https://www.pixability.com/?p=1966)) [press]. Design for **both**: text must survive
a phone held upright, and the image must survive a 65" TV.

**The arithmetic [house].** A 1920 px frame shown in an upright phone's inline player is about
390 CSS px wide, a scale of **~0.2**. Text needs to be at least ~10 px on that screen to read
comfortably, so:

| Text role | Min size at 1080p | Why |
|---|---|---|
| Must-read (a number, a name, a quote) | **≥56 px** font size (~5% of frame height) | ≈11 px on an upright phone |
| Secondary label | ≥40 px | ≈8 px upright; fine landscape/full-screen |
| Source and metadata lines | ≥26 px | Accepted as unreadable upright; readable full-screen and on TV |
| Thumbnail text | glance test at 168×94 (`packaging` skill) | |

**Safe areas at 1920×1080 [house, from the YouTube player layout]:**

- **Bottom 130 px**: progress bar, player controls and closed captions. No must-read text.
- **Top-left ~600×120 px**: title and channel overlay when paused or hovered.
- **Top-right corner**: the info-card icon.
- **Last 5–20 s**: end-screen elements cover large areas; keep the button text centred-left and high.
- **So**: put labels top-right-of-centre, upper-left below the title zone, or mid-left; place
  source lines bottom-left **above** the 130 px band.

**Picture legibility on a phone:**

- One focal subject per frame, at least **15% of frame height** when it matters.
- Avoid detail that only reads at full screen (fine wireframes, small UI text). If the UI matters,
  push in until it's large.
- Check every chapter at phone size: render a still and view it at 390 px wide before finalising.

---

## 10. The "never let a frame be boring" checklist

Run this on every shot in the plan, and on any stretch where the retention graph dips.

- [ ] **Something moves**: camera, light, particles, haze, annotation, counter. A truly static
      frame over 2 s is a deliberate hold, logged as one.
- [ ] **There's a focal point** the eye goes to in under 0.5 s (one key light on it).
- [ ] **There's depth**: foreground, subject, background; or a deliberate flat graphic.
- [ ] **It adds information** the VO doesn't say, or makes the VO's information physical.
- [ ] **Something new arrived in the last 5 s** (§1 budget for the section).
- [ ] **A change of kind arrived in the last 30–40 s** (§2).
- [ ] **It's different from the previous shot** in scale, angle or mode (`shot-design` §8).
- [ ] **It has a sound layer**: an ambience, a hum, a cue. Never VO over digital silence.
- [ ] **It reads on a phone** (§9).
- [ ] **It's on-taste**: one key light, darkness default, red only as annotation, house type.
- [ ] **Its length is earned**: if it were 1 s shorter, would anything be lost? If not, cut it.
- [ ] **It's in the right register**: does its energy match where we are on the curve (minute 1
      densest, lull visual, twist sharp)?

---

## 11. The MrBeast rule set, adapted for a faceless documentary

Sources: the memo ([full text](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/)),
Chucky Appleby ([Social Media Today](https://www.socialmediatoday.com/news/youtube-shares-insights-mrbeasts-team-creates-compelling-thumbnail/709817/),
[The Ringer](https://www.theringer.com/2026/03/09/pop-culture/youtube-face-thumbnails-history-explained)),
Mario Joos ([Vidpros](https://vidpros.com/retention-editing-what-you-can-learn-from-mario-joos/)),
and MrBeast's 2024 posts ([Gigazine](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end)).
See `channel-breakdowns.md` §1 for the full read.

| # | MrBeast rule | Our version |
|---|---|---|
| 1 | Make the best *YouTube* video, not the best-produced one | The film finish serves retention; never sacrifice a re-hook for a pretty shot |
| 2 | Know the title and thumbnail; deliver the thumbnail early | The thumbnail's hero object is the first frame of the video, lit the same way |
| 3 | Freak out about the first minute | Cold open: visual change every ≤3 s; promise confirmed by 0:30; L1 stated by 0:30 |
| 4 | "Stop telling people what they will be watching and start showing them" | No "in this video"; no agenda; the first chapter starts mid-story |
| 5 | Re-engagement at ~3:00 and ~6:00 | Wow-factor beats: a primary document or a 3D reconstruction no one else has |
| 6 | Minutes 3–6: most exciting simple content, quick scene changes | Ch.2 gets the best material and the fastest change budget after minute 1 |
| 7 | The lull after 6:00 is where slower explanation goes, but back halves kill videos | Ch.3 mechanism allowed slower, never static; Ch.4 twist must add new facts |
| 8 | Stair-step the stakes | Escalate money, reach or consequence once per chapter, shown on screen |
| 9 | Wow factor = what no one else can do | Tracked 3D annotation, computed numbers, primary documents |
| 10 | Endings abrupt | Close L1, one button line, hard cut; no recap or outro |
| 11 | Brand deals are content; scripted reads crater | The offer is shown in our visual language, bridged from the story, ≤75 s |
| 12 | Simple enough for "a grandma and a kid" (Chucky) | One idea per shot, one idea per sentence, jargon after the hook |
| 13 | Check the thumbnail at feed size (Chucky) | Glance test at 168×94; on-screen text checked at phone size (§9) |
| 14 | Test packaging relentlessly (~50 concepts, closed-mouth test) | 25–50 titles, 10 sketches, 3 concepts, Test & Compare (`packaging`) |
| 15 | Slow down, let scenes breathe (2024) | Pace comes from new information; reveal holds of 6–10 s are allowed |
| 16 | Consultants are "cheat codes" | An expert read of the script before render is our cheapest quality gain |
| 17 | Creativity saves money | A clever metaphor set beats an expensive build; reuse sets with new light |
| 18 | Know your minute | Every shot in the plan carries its minute mark and its section budget |

---

## 12. Review passes before export

1. **Phone pass**: watch the full render on a phone, upright, at normal speed. Note every moment
   you want to scroll.
2. **Mute pass**: watch with sound off. Does the picture alone tell the story's shape? If a
   chapter is incomprehensible muted, it lacks a visual spine.
3. **Audio-only pass**: listen with the screen off. Does the VO stand alone? (Many viewers
   listen.) If not, the script relies on pictures it shouldn't.
4. **Minute-mark pass**: list the visual changes per minute and the changes of kind per 30–40 s
   against §1–§2.
5. **After upload**: read the retention graph against the beat sheet. Dips → which rule was
   broken? Log them in `projects/<name>/retention-notes.md` and adjust this file.
