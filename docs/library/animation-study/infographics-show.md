# The Infographics Show: animation study

The volume machine of animated YouTube: **5,775 videos**, several a week for more than 12 years,
made with a stable 2D cartoon template. Useful to us for **title and thumbnail testing at scale**
and for its **"Minute by Minute / Hour by Hour" formats**, not for craft.

Labels: **[data]** our yt-dlp pull on 2026-11-05 · **[observed]** thumbnails we looked at ·
**[source]** · **[recall]** · **[inferred]**.

## 1. Numbers [data]

| | |
|---|---|
| Subscribers | 15.5M |
| Videos | 5,775 · median **567K** · newest 30: median **489K** |
| Median length | Top 30: **12.5 min** · newest 30: **16.5 min** (plus 2–3.5-hour compilations) |
| Titles (top 30) | Median 44 characters · 17% "?" · 47% What/How/Why · **27% contain a digit** · 20% have a word in capitals |

### Top 12 [data]
| Views | Length | Title |
|---|---|---|
| 27M | 7:04 | What Happens When You Die? |
| 22M | 12:26 | Russian Sleep Experiment - EXPLAINED |
| 20M | 17:57 | How SEAL Team Took Down Osama bin Laden (Minute by Minute) |
| 19M | 7:54 | What Happens to Your Body While You Are Having Sex? |
| 17M | 13:49 | How They Caught Serial Killer Ted Bundy |
| 15M | 201:20 | The Most Watched Infographics Show Stories of 2019 |
| 15M | 8:00 | Insane Way El Chapo Escaped Prison |
| 14M | 8:33 | What Does it Actually Feel Like to be Shot |
| 14M | 10:30 | What The Last 24 Hours of Death Row Prisoner Look Like |
| 13M | 15:29 | What If North Korea Launched a Nuclear Bomb (Minute by Minute) |
| 13M | 9:41 | I Was Trapped Underwater For 3 Days |
| 13M | 12:14 | Man So Violent Even Other Prisoners Fear Him |

### The 2025–26 shift [data]
The newest titles are written in a **news-panic voice**, mostly about AI and money:
- *The AI bubble is about to pop...* (**4.3M**, the biggest recent hit)
- *Holy sh\*t spacetime is fake...* (2.1M)
- *Wall Street is freaking out over OpenAI now...* (1.4M)
- *MIT looked at what AI actually killed and holy sh\*t...* (1.0M)
- *How Are Americans Buying $80,000 Trucks on a $70,000 Salary?* (1.0M)
- *World War 3 - Hour by Hour at 35,000 Feet* (1.0M)
- *Karma Just Hit Roblox. Hard.* (961K)

Also *$40 Trillion Debt Passed. The American ECONOMY Is Collapsing.*, *UNPLUG Your Smart TV NOW!*
and *The Nuclear Football is BROKEN. It's JUST 4 Minutes to WW3.*

### Panic titles, re-tested with dates [data, small n]

The channel posts almost daily, so its newest 60 uploads cover only about the **last two months**
(approx. dates ~2026-09 to 2026-11; `data/TheInfographicsShow.newest60.approx-dates.csv`). Inside
that same window (same season, same algorithm, same age ± weeks):

| Group | n | Median views | Top |
|---|---|---|---|
| Panic-voice titles ("…" trail-off, "holy sh\*t", "freaking out", "about to", "Most Terrifying") | **6** | **1.2M** | 4.3M, 2.1M, 1.4M, 1.0M, 720K, 592K |
| Clock titles ("Hour by Hour") | 3 | 1.4M | 2.7M, 1.4M, 1.0M |
| Everything else | 54 | 458K | |

A panic title beats a random other title from the same window **89% of the time** (rank-sum
probability, 6 × 54 pairs).

**This reverses the first pass's lesson** ("panic titles don't lift the baseline"). What's true is
narrower: the *channel* median hasn't moved (window 495K vs 567K all-time), because only 6 of 60
titles use the voice; but **the ones that do roughly double or triple their neighbours**. Two
confounds keep this from being a rule:
1. **Topic.** Five of the six are about **named, live news** (an AI bubble, OpenAI, MIT, "the most
   terrifying financial chart"). The lift may come from the news hook, not the panic.
2. **n = 6** in one two-month window.

**The Bencivenga reading** (`.claude/skills/bencivenga-copy`): the winners pair urgency with a
**named, checkable source** (*MIT looked at…*, *Wall Street…OpenAI*) or a vivid physical claim
(*spacetime is fake*). The weakest two (*Most Terrifying Financial Chart/Shift…*, 720K and 592K) are
the most generic: urgency with nothing specific to check. So: **urgency works only when attached to
something specific enough to verify**; on its own it reads as "yeah, sure".

## 2. Title shapes

1. **"What happens when/to your body…":** the universal body question (death, sex, being shot).
2. **The true-crime procedural:** *How They Caught…*, *Insane Way [X] Escaped…*, *Man So Violent…*
3. **The clock format:** *(Minute by Minute)*, *Hour by Hour*, *The Last 24 Hours of…*. **A clock
   in the title promises a close, step-by-step reconstruction** of a famous event (the bin Laden
   raid, 20M).
4. **First-person survival:** *I Was Trapped Underwater For 3 Days*: an animated testimony.
5. **Internet legend, explained:** *Russian Sleep Experiment - EXPLAINED* (22M).

## 3. Thumbnail grammar [observed: 9 looked at]

- **Cartoon people with exaggerated fear or shock** (wide eyes, open mouth, sweat): Einstein
  ("EINSTEIN WAS WRONG"), a Jensen-like CEO shouting at a crumbling chip ("IT'S STARTING").
- **Text in coloured label boxes** (yellow, red or black blocks with heavy sans capitals): RUSSIAN /
  SLEEP / EXPERIMENT stacked; HOW THEY CAUGHT / TED BUNDY.
- **Timestamps as text** for the clock format: **3:33 AM** over a soldier on a ladder, **3:39 AM**
  over a startled bin Laden. A split frame tells the story in two time-coded panels.
- **Red dashed arrows** (the escape route) and a diagram of the body (SEX: a skin, muscle,
  skeleton and organ cutaway).
- Gradients that are bright to the point of loud; everything at maximum saturation.

## 4. Hook mechanics [recall · inferred]

- **The second-person premise in the first line** ("Imagine you're…"; "You wake up…"), then
  **a rapid list of what's coming** [recall].
- **The clock format opens on a time stamp:** "It's 11 p.m. on May 1st…", then counts forward
  [recall].
- Sponsor read early, often around 1:00 [recall; **unverified**: no transcript of this channel was
  fetchable (rosetta.to doesn't carry it; the timed mirrors are blocked). Check by watching before
  relying on it].

## 5. Script structure

- 2,000–4,000-word scripts for 8–15 minutes. A team of writers and 5–15 animators in parallel;
  two main narrators with neutral accents [source: becomeviral.com case study, an estimate].
- **The template:** premise → context → numbered or time-coded escalation → the worst moment →
  aftermath → "what would you do?" CTA [recall + inferred].
- **Volume is the strategy:** with thousands of uploads, titles are A/B tested at scale (they
  have spoken publicly about cutting title ideation "from 2 hours to 2 minutes" with a tool)
  [source: spotterstudio.com creator story, title only].

## 6. Animation grammar [observed + recall]

- **A reusable 2D puppet library:** the same body rigs, outfits and backgrounds reused across
  thousands of videos. Characters slide in, gesture and blink, with little full-body acting.
- **A scene per sentence:** each sentence gets a new illustrated vignette, so the cut rate is
  high, about one every 3–5 seconds [recall + inferred]. The visuals illustrate the line literally.
- **Maps, arrows and clocks** for the procedural formats.

## 7. Sound

- Library music beds that change by section; standard whooshes and impacts [recall].

## 8. Why it gets shared

- Fear and morbid curiosity (death, prison, serial killers) and the "would you survive?" debate in
  the comments [inferred].

## 9. What we take, and what we must not copy

**Take (mechanisms only):**
1. **A clock as the structure** for a famous event: the reconstruction advances in fixed time steps.
   In our engine that's a counter wheel or a date flap that turns at each chapter. **The title must
   not use their labels** "(Minute by Minute)", "Hour by Hour" or "The Last 24 Hours of…" (README §6);
   say the time in our own words or put the clock in the thumbnail instead.
2. **Time stamps as image evidence** in a thumbnail, drawn as one of our own objects (a stamped
   ledger line, a counter), not their two-panel time-code layout.
3. The plain "What happens when…" body question as a framing line.
4. **A lesson from their data:** urgency lifts a title only when it's attached to a named, checkable
   specific (n = 6, §1). Bencivenga-grade copy means *specific* and *believable*; loud alone is the
   weakest variant.

**Don't copy:** the shocked-caricature thumbnail face, coloured label-box text, the "holy sh\*t..."
voice, the "(Minute by Minute)" / "Hour by Hour" title tags, or literal one-vignette-per-sentence
illustration.
