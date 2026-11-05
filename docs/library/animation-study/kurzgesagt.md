# Kurzgesagt – In a Nutshell: animation study

Companion to `../video-autopsies/kurzgesagt.md`, which has caption-measured pacing (148–167 wpm of
runtime, a turn word every 19–27 s) and heatmap peaks for four videos. This file adds the
channel-wide numbers, the newer titles, the openings of five more videos, and how the channel
animates.

Labels: **[data]** our yt-dlp pull on 2026-11-05 · **[observed]** read from a transcript, a
thumbnail or a primary source · **[source]** a named web source · **[recall]** our memory of the
videos, not re-checked this pass · **[inferred]** our reading.

## 1. Numbers [data]

| | |
|---|---|
| Subscribers | 25.8M |
| Long-form videos | 255 · median **11M** views · newest 30: median **5.4M** |
| Shorts (second tab) | 142 · median 2.75M · top 10 below |
| Median length | Top 30: **8.2 min** · newest 30: **12.7 min** (it has got longer) |
| Titles (top 30) | Median 48 characters · 27% have a "?" · 33% open with What/How/Why · 7% say "you" |

### Top 12 by views [data]

| Views | Length | Title |
|---|---|---|
| 89M | 8:35 | The Coronavirus Explained & What You Should Do |
| 54M | 7:49 | The Immune System Explained I – Bacteria Infection |
| 36M | 8:06 | The Egg - A Short Story |
| 36M | 6:03 | What If You Detonated a Nuclear Bomb In The Marianas Trench? (Science not Fantasy) |
| 35M | 11:59 | The Largest Star in the Universe – Size Comparison |
| 35M | 7:09 | The Deadliest Being on Planet Earth – The Bacteriophage |
| 35M | 6:21 | The Fermi Paradox — Where Are All The Aliens? (1/2) |
| 33M | 13:44 | The Largest Black Hole in the Universe - Size Comparison |
| 32M | 7:06 | What If We Detonated All Nuclear Bombs at Once? |
| 32M | 10:13 | Why Black Holes Could Delete The Universe – The Information Paradox |
| 30M | 16:04 | Genetic Engineering Will Change Everything Forever – CRISPR |
| 29M | 8:56 | What if We Nuke a City? |

### Shorts top 10 [data] (`data/kurzgesagt.shorts.csv`; the flat pull gives no Shorts durations)

| Views | Title |
|---|---|
| 20M | The Deadly Power of a Coin-Sized Black Hole |
| 19M | How to Cut a Sandwich Perfectly – With Science |
| 14M | How You Can Live Forever... Maybe. |
| 14M | Something in Your Kitchen Emits Antimatter |
| 13M | Earth as a Cube – What Would It Look Like? |
| 13M | How Tiny Can a Black Hole Be? |
| 12M | How Many Moons Could Earth Handle? |
| 12M | Let's Make Earth Twice as Large! |
| 12M | How do Lasers Work? |
| 11M | Fentanyl Explained |

The Shorts are what-ifs and kitchen-scale surprises (a coin, a sandwich, your kitchen), plus one
cutdown of a long-form hit (*Fentanyl Explained*).

### Hits of the last 12 months [data, dated]

Dates are YouTube's relative labels ("3 months ago") turned into approximate dates by yt-dlp's
`approximate_date` option (`data/kurzgesagt.newest60.approx-dates.csv`). **Strictly inside 12
months: 23 uploads, median 5.7M.** At 2× that or more:

| Views | Length | Approx. date | Title |
|---|---|---|---|
| 23M | 21:44 | ~2026-10 | AI Just Crossed the Terrifying Line - Now What? |
| 21M | 15:14 | ~2026-10 | This Woman Cured Her Cancer with an Insane Method |

**Corrected from the first pass:** *SOUTH KOREA IS OVER* (15M), *Why Does Fentanyl Feel So Good?*
(13M), *We Have To Talk About Weed* (13M), *We Finally Know More About Humanity's First
Civilization* (11M), *AI Slop Is Destroying The Internet* (11M) and *Why Humanity Will Never Leave
The Solar System* (10M) are labelled "1 year ago", which means 12–23 months old. *South Korea*
went up on **2 April 2025** [source: Asiae, §8]. They are the channel's recent verdict-title
hits, but not last-12-month hits. Both strict-window outliers are only weeks old, so their totals
are still climbing.

## 2. Title shapes

1. **The size ladder:** `The Largest [X] in the Universe – Size Comparison` (35M, 33M).
2. **A what-if with destruction:** `What If We Detonated…` and `What if We Nuke a City?` (36M, 32M,
   29M). The *(Science not Fantasy)* tag tells you the answer is real.
3. **[Topic] Explained**, with a series number (*Immune System Explained I*) or a promise to act
   (*& What You Should Do*).
4. **The newer verdict titles** (2024–26): `[Country] IS OVER`, `[Thing] Is Insane`,
   `The Uncomfortable Truth About [X]`, `Why Does [Drug] Feel So Good?`, `You Need To Quit Weed.`,
   `[Thing] Is Destroying The Internet`. A plain verdict, often in capitals, sometimes in the
   second person [observed]. The channel moved from neutral questions to stated opinions, and its
   best recent videos are the opinionated ones [data + inferred].
5. **A named paradox, or "The Most Insane [X] You Never Heard About"** (*The Most Insane Weapon You
   Never Heard About*, **14M, 13:56 [data]**: confirmed in our own pull, not just on the third-party
   page): a superlative plus "you've never heard of it".

## 3. Thumbnail grammar [observed: we looked at the top 9 and three recent ones]

- **One to three words in heavy white sans capitals across the top:** 100% VIRUS, LARGEST STAR,
  DEEP SEA NUKE, CORONA VIRUS, BACTERIOPHAGE, LOST FOREVER, THE EGG, WE LOST CONTROL, THE IMMUNE
  SYSTEM. The words are a label or a verdict, not the title.
- **One glowing hero object in the centre:** a mushroom cloud, a phage, an egg of galaxies, a huge
  eye. It is lit from inside, against a dark or saturated field.
- **A scale cue when the topic is size:** a white arrow pointing to a dot labelled OUR SUN under a
  wall of star.
- **Neon light on deep blue or purple.** The light comes from the subject: cyan, magenta, acid
  green, orange.
- **Characters look out at you:** the big eyes over the mask, the fanged red cells.

## 4. Hook mechanics: the first 60 seconds of five videos

Read from rosetta.to's caption-based transcripts. Quotes are short phrases only.

### 4.0 Timings [estimated, not cue-measured]

rosetta.to has no per-line timestamps, and the timed mirrors we tried (youtubetotranscript.com
403, glasp.co 403, youtubetranscript.com returns an empty JavaScript shell, tubescript.cc 500,
chaindesk.ai 404) don't work from this container; YouTube's own caption and storyboard endpoints
are bot-checked. So timings below are **estimated**: each line's start = words before it ÷ the
video's words per minute of runtime (transcript word count ÷ runtime from our pull). Kurzgesagt
starts speaking at once (the transcripts have no music-only intro), so the error is roughly
±10%, about ±3 s at the 30 s mark. Full output: `data/derived/openings-estimated-timing.txt`.

| Video | wpm of runtime | First line at | Thesis or question | Roadmap or chapter card | First number |
|---|---|---|---|---|---|
| *SOUTH KOREA IS OVER* | 164 | ~0 s, the title spoken as the first sentence | "What will the collapse look like?" ~22 s | Chapter card "The real population bomb" ~27 s | 2.1 children per woman ~29 s |
| *Most Insane Weapon* (Sundial) | 167 | ~0 s, "in the 1950s…" | "how was it even possible…" ~33–36 s | "Everything is different forever" ~38 s; "let's set the stage" ~40 s | 10 billion tons ~16 s; three scales by ~33 s |
| *Why Does Fentanyl Feel So Good?* | 161 | ~0 s, the false premise | Thesis "garbage heroin" ~12 s | "Let's learn what fentanyl does to you" ~30 s; card "Pain and pleasure" ~37 s | — |
| *AI Slop Is Destroying The Internet* | 159 | ~0 s, a shop plug and "stay tuned until the end" | Thesis ~11 s | — | "about half of internet traffic is bots" ~29 s |

**What this shows:** the first-pass claim holds, as an estimate. Kurzgesagt **opens on the line
itself** (no title sting), puts the **thesis in the first 12–22 s**, and states the **contract or
roadmap at ~30–40 s**, followed at once by a spoken chapter card. Compare TED-Ed's measured
6.5–10.7 s logo and music open before the first word (`ted-ed.md`).

### a. *What If You Detonated a Nuclear Bomb In The Marianas Trench?* (36M)
1. The question: "what would happen if we detonated humanity's most powerful nuclear weapon…".
2. Three escalating disasters: tsunamis destroy coastal cities, then "earthquakes would level
   countries", then "new volcanoes would bring us nuclear winter".
3. The biggest step: "maybe even earth could be ripped apart".
4. **The deflation: "well, almost."** The build-up goes flat in two words.
5. The place, by analogy: the trench "looks like an upside down mountain", **almost three times
   deeper than the Titanic's grave**, at about 1,000 atmospheres of pressure.
6. The promise: "a great place for our nuclear test."

**Device: escalate, then undercut, then a human-unit scale.** The ending comes back to the
question: "pretty much nothing" [observed].

### b. *The Immune System Explained I* (54M)
1. "Every second of your life, you are under attack." Second person, high stakes.
2. "Billions of bacteria, viruses and fungi…", then the system as "a super complex little army"
   with guards, soldiers, intelligence and weapons factories.
3. A joke that deflates it: "to protect you from, uh, well, dying."
4. **The diagram is built in front of you:** 12 jobs, 21 cell types, then "Now, let's make this
   understandable", "let's add colours", "let's illustrate the cells". The viewer watches chaos
   become a clean visual system.
5. "Isn't this complexity just awesome?" Then the scope is narrowed: only these cells.
6. "So, what happens in the case of an infection?" Then "a wild rusty nail appears" (a
   video-game reference) and the story starts.

**Device: show the complexity, simplify it on screen, then tell a story.** After the opening the
structure is a battle: the nail, the wave of bacteria, the macrophages, the neutrophils that die
after five days, the "dire" midpoint, the antibodies turning it, the memory cells [observed].

### c. *The Most Insane Weapon You Never Heard About* (Project Sundial)
1. A dated cold open: in the 1950s the US starts the top-secret Project Sundial.
2. Stakes: a bomb to "destroy all of human civilization", "conceived in cold logic".
3. **Three scales in a row:** 10 billion tons of TNT; a pyramid of explosives "13 times taller
   than the actual Great Pyramid"; 3,000 times all the bombs of WWII; a Hiroshima every minute
   "would take you over 15 months".
4. The question: "how was it even possible?"
5. A spoken chapter card, *Everything is Different Forever*, then "let's set the stage", then
   **"if you were 40 in 1945"**: put the viewer in the timeline.

The rest is an escalation ladder (atomic bomb → failed arms-control off-ramp → surprise Soviet
test → H-bomb → Sundial), a speculative detonation, then **"Good news! Wait, no, bad news!"** It
was never built, but today's arsenal may be just as bad. It closes on "would you press the
button?" [observed].

### d. *Why Does Fentanyl Feel So Good?* (13M)
1. A false premise to knock down: "Fentanyl must be amazing."
2. A list of what people give up: loved ones, homes, dignity, lives.
3. **The thesis twist:** "garbage heroin, inferior in every single way but one", "the perfect
   drug for dealers", "many people it kills are not even fentanyl addicts".
4. A joke in the second person: the "dumbest drug to ruin your life for".
5. The roadmap: "Let's learn what fentanyl does to you."
6. The frame: pain and pleasure as two forces, with the brain's voices acted out ("Pleasure.
   More. Do that again.").

**Device: a refrain verdict.** "Garbage heroin" comes back in variations all the way through
[observed].

### e. *AI Slop Is Destroying The Internet* (11M)
1. The sponsor line comes first, plus "stay tuned until the end for the reveal" (a loop opened at
   0:00).
2. Thesis: AI slop is saturating the internet; "about half of internet traffic is bots".
3. A joke: "the black hole of meaninglessness that is LinkedIn".
4. The story: their own fact-checking found invented facts in AI-made research for a video about
   brown dwarfs. One of the sources was AI-written. Then a popular video repeated the invented
   facts. "Where the death of the internet begins."
5. The ending: a pledge (human-made, checked, accountable) and a plain request for support.

**Device: the channel's own method as evidence.** It describes its 100-hour fact-check and shows
what went wrong [observed]. See also the AI outlier in `../video-autopsies/kurzgesagt.md`: a dated
present-tense story about software, with the agents' own logs quoted on screen.

## 5. Script structure

- **Length:** about 2,200 words for 13–15 minutes (Sundial, Fentanyl). That's about 150–170 wpm of
  runtime with music-only passages [observed estimate].
- **Common shapes:**
  1. **A scale ladder** (Largest Star, Black Hole): each rung adds a comparison, with transitions
     like "let's go bigger".
  2. **A consequence chain** (what-if nukes): the premise, then minute-by-minute physics, then
     myths knocked down, then a moral on scale ("nature dwarfs human power").
  3. **A body or cell battle** (the immune series): an inciting injury, waves of escalation, a dark
     midpoint, a turn, then memory cells as the after-effect.
  4. **A history escalation ladder** (Sundial, first civilisation): each side's move forces the next.
  5. **A verdict essay** (South Korea, Fentanyl, Weed, AI Slop): the thesis in the first 20 s, then
     the mechanism, then a twist ("no way back"; "the only good news…"), then causes, then a call
     to action.
- **Twists** come from *physics or numbers*: the bubble shrinks; even tripling the fertility rate
  wouldn't fix the age pyramid. They are almost never plot twists [observed].
- **Endings:** a reflective or lyrical line ("would you press the button?"; "the universe is too
  beautiful not to be experienced"), then a hard cut to the sponsor, Patreon or shop. Opinion is
  labelled as opinion ("In our opinion…") [observed].
- **Process** [source: kurzgesagt.org/youtube and the *1200 Hours* making-of on rosetta.to]: weeks
  of research from books and papers, a source sheet, **about a dozen script drafts**, experts
  checking, "writing is the bottleneck"; 2–3 illustrators for 8–12 weeks, **about 200 panels**;
  2–3 animators for 8–10 weeks in After Effects (Cinema 4D being tried), all motion keyframed by
  hand; music composed for the finished cut (Epic Mountain); about 1,200 hours per video.

## 6. Animation grammar

- **Continuous camera, few hard cuts** [recall; not measurable here: video and storyboard frames
  are blocked. TED-Ed, which works the same way, measures 2–9 hard cuts/min with held shots of
  30–140 s (`ted-ed.md` §pacing)]. Scenes are one wide canvas. The camera
  trucks or zooms through it, or objects morph (a cell becomes a factory, a planet becomes a
  ball). Transitions are often **match-shapes**: a circle becomes the next circle. About 200
  panels over about 12 minutes is a new illustrated scene every 3–4 s [inferred], but the eye
  reads one flowing ride.
- **Turning abstractions into pictures:** systems become **societies or militaries** (immune cells
  as an army, AIs as a secret society); quantities become **familiar objects stacked** (pyramids
  of TNT, Hiroshimas per minute); time becomes **a journey** ("if you were 40 in 1945"; a broken
  time machine).
- **Scale shots:** a tiny labelled reference (OUR SUN, a human, Earth) beside the giant subject. A
  slow pull-out, then a hold.
- **Recurring devices** [recall, verify by watching before relying on it]: the bird-like mascot, a sponsor character, Easter eggs,
  creatures that look at the camera, glow and soft gradients on flat shapes, and few outlines.
- **Colour:** saturated light sources on deep blue, purple and teal. Warm reds and oranges mean
  danger (nukes, infection, the AI eye) [observed in thumbnails].
- **Characters:** round, bean-shaped, big-eyed, with no mouth or a minimal one. Cells and microbes
  get fangs when hostile [observed in thumbnails].
- **Text on screen:** sparse. Labels on key objects, numbers when a figure is spoken, and chapter
  titles spoken as questions [recall + `../video-autopsies/kurzgesagt.md`].

## 7. Sound

- An original score per video, composed after picture lock to "emphasize key moments"
  [source]. Ambient synth beds rise into swells on the reveals [recall].
- Sound effects form a layer "many viewers don't consciously notice"; the team recommends
  headphones [source]. Small pops and whooshes come with every object that appears [recall].
- One calm narrator throughout, recorded with a Neumann TLM-103 and re-recorded line by line until
  right [source].

## 8. Why it gets shared

- **Shared fear plus comfort:** pandemic, nukes, AI, collapse. Each video is a fear that gets a
  calm explanation and an action [inferred from the top list].
- **Status in the share:** "the clearest explanation of X" is something people forward to win an
  argument (Fentanyl, Weed, Ozempic) [inferred].
- **Evidence for *SOUTH KOREA IS OVER*** [source]: Korean outlet Asiae reported it at 2.18M views
  the day after upload (it went up 2 April 2025); an r/videos thread drew close to 1,000 comments;
  r/kurzgesagt users criticised the framing; Korea Deconstructed made a reaction episode with four
  young Koreans (18 May 2025). **The verdict title got shared as an argument**, in both directions,
  including inside the country it was about. Asiae also covered the 2023 *Why Korea is Dying Out*
  (2.6M in two days). Sources: [Asiae](https://cm.asiae.co.kr/en/article/2025040314164945986),
  [Korea Deconstructed episode](https://castbox.fm/episode/Is-Korea-Falling-Apart--4-Young-Koreans-React-to-"Korea-is-Over"-id6866104-id873131750).
  We couldn't read YouTube comments or Reddit directly (both blocked here).
- **The sponsor sits at the end, not inside the story** [observed, Sundial transcript]: the
  content ends on "would you press the button?" and a reflective close, then "That was a lot." and
  the sponsor read, then a shop read. The first-pass "sponsor character" note is unverified.
- **Comparisons people quote:** "We're 0.73 on the Kardashev scale"; "13 Great Pyramids of TNT"
  [observed].

## 9. What we take, and what we must not copy

**Take (as mechanisms, never their wording):**
- The escalate-and-undercut hook.
- One human-unit comparison per rung.
- Building the diagram on screen: show the mess, then simplify it live, in our own words.
- A verdict refrain.
- A dated cold open.
- A relief beat that turns into a worse consequence (the mechanism behind their good-news/bad-news
  line; the line itself is banned, README §6).
- An ending that comes back to the opening question.

**Don't copy:** any of their stock lines verbatim ("Good news! Wait, no, bad news!", "Now, let's
make this understandable", "In a Nutshell"), the `[X] IS OVER` capitals verdict form, the deep-navy-and-neon palette with glowing flat vector, bean-shaped big-eyed
characters, the bird or any mascot like it, their wide heavy white thumbnail capitals over a neon
hero, or the "In a Nutshell" phrasing. Our ep10 look has to come from our own engine
(`../bright-style/STYLE.md`): 3D, daylight and material-based light, not glow-on-dark.
