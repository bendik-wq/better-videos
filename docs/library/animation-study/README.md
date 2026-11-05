# Animation study: what the top animated explainer channels do, and what we can use

A study of 25 channels (mostly animated) plus a 2026 discovery pass, pulled on **2026-11-05**, to inform
**ep10**: a fully animated explainer at the level of Kurzgesagt, TED-Ed and OverSimplified, in **our
own visual theme**, with Bencivenga-grade copy. It builds on `../video-autopsies/`, which measures
documentary channels (Kurzgesagt caption-measured there).

**Second pass (same day).** This version fixes the review gaps: Jared Owen and Animagraffs added
and our distinctiveness claim narrowed (§5); real upload dates for the 12-month window; raw data
committed (`data/`); TED-Ed pacing and sound **measured from video**; estimated-timed verbatim
openings for Kurzgesagt, MinuteEarth, MinutePhysics, CGP Grey and Primer; runtime and topic
analysis across ~17,000 videos (§1.2–1.3); a discovery pass (§1.4); a copy section with draft ep10
title and thumbnail pairs (§4); scored technique ranking (§3); and a wider ban list (§6).

| File | Covers |
|---|---|
| [kurzgesagt.md](kurzgesagt.md) | 25.8M subs. Shorts top 10; corrected 12-month table; five openings with **estimated timings**; share evidence for *SOUTH KOREA IS OVER* |
| [ted-ed.md](ted-ed.md) | 23M subs. Seven openings **timed to the cue**; **cut rate, loudness and silences measured** on six lessons; two first-60 s shot logs |
| [oversimplified.md](oversimplified.md) | 33 videos at a 40M median; **no upload in 12 months**; hook section marked unverified with a watch checklist; Yarnhub as the live comparison |
| [minuteearth-minutephysics.md](minuteearth-minutephysics.md) | Five verbatim openings with estimated timings; 190–240 wpm narration |
| [infographics-show.md](infographics-show.md) | Panic titles re-tested with dates (they *do* beat their neighbours, n = 6) |
| [zack-d-films.md](zack-d-films.md) | 4,035 Shorts at a 14M median; long-form hits re-dated to 2022–23; the signature combination we may not ship |
| [science-cinema-melodysheep-sciencephile-whatif.md](science-cinema-melodysheep-sciencephile-whatif.md) | Full top 10s; dated windows; no transcripts available |
| [jared-owen-animagraffs.md](jared-owen-animagraffs.md) | **New.** 3D mechanical cutaways, including famous historical objects. Defines what we must not look like |
| [other-animated-outliers.md](other-animated-outliers.md) | Dated 12-month outliers for every channel; **discovery pass** (Yarnhub, Ink Explainer, Historically…); full top 10s for CGP Grey, Sam O'Nella, Primer, AsapSCIENCE |
| [data/](data/) | Every pull as CSV, the scripts, and derived tables (see §7) |
| [STYLE-BIBLE.md](STYLE-BIBLE.md) | Our ep10 look, "Paper & Spring" (written separately; §5 below narrows how it must be read) |

## Method and evidence labels

- **Channel metadata** [data]: `yt-dlp --flat-playlist -J` on each channel's `/videos` and
  `/shorts` tabs: title, views, duration, upload order. Committed as CSV in `data/`. The task asked
  for `/videos` and `/popular`; YouTube's "Popular" sort is a client-side chip with no URL that
  yt-dlp can pull, so **"popular" here = the full `/videos` list sorted by view count**, which is the
  same ranking (every video is in the pull, so nothing is missed).
- **Dates** [data]: the flat pull has no dates, so we re-pulled the newest 60 uploads of each
  channel with `--extractor-args youtubetab:approximate_date`, which converts YouTube's relative
  labels into approximate dates. **"Last 12 months" = strictly inside the window** (labelled in
  days, weeks or "N months ago"); "1 year ago" covers 12–23 months and is excluded. This replaced
  the first pass's "newest 30–40 uploads", which was badly wrong for slow channels.
- **Blocked from this container** (we didn't try to get around it): YouTube video files, captions,
  comments, the player API and **storyboard sprite sheets** (the `i.ytimg.com/sb/…` frames need a
  signature from the bot-checked player response; unsigned requests return 403). Reddit's API also
  returns 403.
- **Transcripts:**
  - TED-Ed: **ted.com transcript pages** with per-cue timestamps (timed to the second).
  - Kurzgesagt, MinuteEarth, MinutePhysics, CGP Grey, Primer: **rosetta.to** caption transcripts
    (verbatim, untimed). Timings are **[estimated]**: line start = words before it ÷ that video's
    words per minute of runtime. Error about ±10% plus any music-only intro.
  - **No verbatim transcript could be fetched for OverSimplified, The Infographics Show, Zack D.,
    melodysheep, Sciencephile, What If, Jared Owen, Animagraffs or Sam O'Nella.** Timed mirrors
    tried: youtubetotranscript.com (403), glasp.co (403), youtubetranscript.com (empty JS shell),
    tubescript.cc (500), the OverSimplified fandom wiki (402), chaindesk.ai (404). Those channel
    files say so and mark their hook notes as unverified.
- **Pacing** [data, TED-Ed only]: ted.com serves TED-Ed lessons as MP4 files, so six lessons were
  measured with ffmpeg scene detection, `silencedetect` and `ebur128`, and two were shot-logged from
  1 fps contact sheets (`ted-ed.md` §6b). No other channel's video is reachable; their pacing stays
  [recall] or [inferred] and is labelled so.
- **Thumbnails** [observed]: `hqdefault.jpg` for about 140 videos, viewed as contact sheets in a
  scratch folder and **described**; none committed (`thumbs/` deliberately not created).
- **[recall]** = our memory of the videos. Every [recall] item that a technique depends on is marked
  **verify first** in §3.

## 1. The numbers

### 1.1 Side by side [data]

"12-mo" = uploads strictly inside the last 12 months (§Method). "60+" = all 60 newest uploads are
inside it, so the window is sampled, not covered.

| Channel | Subs | Videos | Median views | 12-mo uploads · median | Top-30 median length → newest 30 | Top-30 titles: "?" / What-How-Why / "you" / digit |
|---|---|---|---|---|---|---|
| OverSimplified | 9.7M | 33 | **40M** | **0** (newest is 12–23 months old) | 18.3 → 19.9 min | 0 / 0 / 0 / (Part N) |
| Zack D. Films (Shorts) | 29.6M | 4,035 | **14M** | (Shorts undated) | ≤60 s | 37 / 60 / 13 / 0 |
| Kurzgesagt | 25.8M | 255 | 11M | 23 · 5.7M | 8.2 → **12.7 min** | 27 / 33 / 7 / 3 |
| Sam O'Nella | 4.8M | 68 | 11M | 4 · 1.4M | 7.4 → 7.8 | 0 / 10 / 7 / 7 |
| CGP Grey | 7.1M | 149 | 6.7M | **0** | 6.3 → 7.3 | 3 / 7 / 17 / 13 |
| Zack D. Films (long) | — | 12 | 5.3M | 4 · 6.8M (compilations) | 7.2 | 0 / 0 / 0 / **58** |
| **Jared Owen** | 4.5M | 88 | 3.0M | 3 · 1.2M | 12.9 → 15.3 | **100 / 100** / 0 / 3 |
| **Animagraffs** | 1.9M | 37 | 2.6M | 3 · 1.2M | 24.2 → 32.1 | 0 / 100 / 0 / 27 |
| AsapSCIENCE | 10.8M | 451 | 2.3M | 15 · 620K | 3.3 → 7.1 | 43 / 47 / 53 / 17 |
| **Yarnhub** (discovery) | 3.4M | 241 | 2.2M | **35 · 3.4M** | 14.1 → 12.9 | 0 / 7 / 0 / **50** |
| Primer | 1.9M | 23 | 1.8M | 1 | 12.8 | 9 / 26 / 0 / 4 |
| MinutePhysics | 6.0M | 304 | 1.3M | 12 · 405K | 3.9 → 5.3 | 27 / 30 / 0 / 10 |
| melodysheep | 3.2M | 123 | 1.0M | 4 · 1.8M | 3.6 → 6.7 | 3 / 3 / 0 / 30 |
| Simple History | 5.1M | 967 | 987K | 60+ · 200K | 6.9 → 9.8 | 7 / 3 / 0 / 30 |
| TED-Ed | 23M | 2,371 | 858K | 60+ · 377K | 4.9 → 6.0 | **53 / 77 / 37** / 0 |
| MinuteEarth | 3.3M | 412 | 851K | 26 · 371K | 2.7 → 3.7 | **67 / 77** / 3 / 0 |
| The Infographics Show | 15.5M | 5,775 | 567K | 60+ · 495K | 12.5 → 16.5 | 17 / 47 / 17 / 27 |
| What If | 9.0M | 959 | 495K | 49 · 495K | 5.5 → **24.2** | **97 / 97 / 53 / 57** |
| Sciencephile the AI | 1.1M | 157 | 465K | 16 · 238K | 9.1 → 12.7 | 13 / 13 / 3 / 17 |

**What the table says:**
1. **Scarcity beats volume.** OverSimplified (33 videos, 40M median), Sam O'Nella (68, 11M) and
   Kurzgesagt (255, 11M) dwarf the volume channels per video. Craft per video earns the multiple.
2. **Everyone is getting longer.** The newest 30 run longer than the top 30 on almost every
   long-form channel (What If 5.5 → 24 min, Kurzgesagt 8 → 13). But §1.2 shows length itself isn't
   what earns the views.
3. **The biggest channels mostly don't ask questions in titles** (OverSimplified 0%, CGP Grey 3%,
   melodysheep 3%). Jared Owen is the exception that proves the rule: 100% questions, but each one
   names a famous object and a model ("How does a Tank work? (M1A2 Abrams)").
4. **Numbers in titles are rare** except Zack D.'s long-form (58%), What If (57%) and Yarnhub (50%,
   mostly aircraft model numbers: F-16, MiG-29, B-17). All are **exact, physical** numbers.
5. **Two of the three biggest per-video channels have been silent for a year** (OverSimplified, CGP
   Grey). The famous-event animated lane is being worked, live, by Yarnhub and by new channels (§1.4).

### 1.2 Does runtime matter? [data, ~17,000 long-form videos]

For each channel we divided every long-form video's views by **that channel's median** (so a 1.00
means "typical for the channel") and took the median of those ratios by runtime bucket. Two eras:
the whole catalogue, and each channel's **newest 100** (same-era comparison, which reduces the bias
of old short videos having had longer to accumulate). Script: `data/scripts/analyse.py runtime`;
full output: `data/derived/runtime-buckets.txt`.

**Newest 100 per channel** (cell = median views ÷ channel median; n in brackets):

| Group | <4 min | 4–8 | 8–12 | 12–20 | 20–30 | 30+ |
|---|---|---|---|---|---|---|
| History channels pooled (8) | 0.91 (83) | 1.01 (64) | 1.02 (125) | 0.94 (165) | 0.97 (163) | 1.18 (100) |
| Science/explainer pooled (13) | 0.76 (220) | 1.07 (323) | 0.98 (194) | 1.05 (211) | 1.10 (155) | 0.68 (42) |
| OverSimplified (whole catalogue) | — | 1.00 (5) | 0.74 (2) | **1.24 (10)** | 0.95 (10) | 1.00 (5) |
| Kurzgesagt | 0.18 (8) | — | **1.10 (50)** | 0.98 (39) | — | — |
| Jared Owen | 0.28 (19) | 1.02 (30) | **3.13 (10)** | **2.20 (26)** | — | — |
| Infographics Show | — | — | — | 1.08 (62) | **1.28 (15)** | 0.61 (22) |
| melodysheep | 0.93 (79) | — | 1.60 (5) | 2.75 (2) | 6.30 (3) | 6.65 (8) |

**Answer for ep10:** **between 4 and 30 minutes, runtime barely moves views** once you control for
channel (pooled ratios 0.94–1.10). The two clear signals: **under 4 minutes underperforms** on a
long-form tab (0.76–0.91, worse for Kurzgesagt at 0.18), and **channels whose craft is the long
immersive film** (melodysheep, Animagraffs) win big at 20+ min. For animated famous-event history
specifically, OverSimplified's best bucket is 12–20 min (1.24) and Yarnhub's 2026 hits run 12–17
min. **Set ep10 at 12–16 min, and let the story decide within that.** Topic and packaging (§1.3,
§4) are where the multiples are. Caveats: correlation only; long videos are made for topics the
channel already believes in.

### 1.3 Does topic category matter? [data, keyword classifier]

Titles were tagged by keyword (war, famous person, disaster, space, body/health, money/brand,
what-if, how-it-works). Cell = median of views ÷ channel median, all long-form videos; "≥3×" = share
of videos at three times the channel median or more (`data/derived/topic-categories.txt`).

| Category | All long-form: n · median ratio · ≥3× | History channels only |
|---|---|---|
| Body / health / drugs | 496 · **1.18×** · 23% | 17 · 0.97× |
| Famous person named | 364 · 1.09× · 17% | 181 · 1.02× · 12% |
| How it works / inside / explained | 907 · 1.09× · 18% | 148 · 0.86× · 7% |
| War / battle / military | 2,466 · 1.03× · 15% | 1,435 · 1.01× · 11% |
| What-if | 1,320 · 1.02× · 18% | 190 · 1.00× · 6% |
| Disaster / accident | 272 · 1.00× · 18% | 52 · 0.96× · 8% |
| Space | 672 · 1.00× · 16% | — |
| **Money / brand / company** | 360 · **0.83×** · 12% | 11 · 0.65× · 0% |
| None of these | 9,299 · 0.98× · 16% | 1,634 · 0.98× · 10% |

**Reading:** broad categories barely separate (most within ±10%). The one warning is **money and
brand titles at 0.83×**: the brand-disaster lane is not a reliable multiplier outside Zack D.'s three
2022–23 hits. Body/health is the strongest broad category. The classifier is crude (keyword
matches, multi-tagging), so treat this as "no category is a shortcut"; the **narrow door** inside a
famous topic (§2.1) is what separates hits, and that can't be keyword-counted.

### 1.4 The discovery pass [data]

Ten YouTube searches filtered to **this year, sorted by views** (*animated history*, *animated
documentary*, *disaster explained animation*, *animated war documentary*…), 515 unique videos, then
full catalogues of every animated-explainer channel found. Details in `other-animated-outliers.md`.
Highlights:

| Channel | Why it matters for ep10 |
|---|---|
| **Yarnhub** (3.4M subs; 12-mo median **3.4M**) | Live benchmark for animated famous-event history: one engagement or one aircraft per video, 12–17 min, no-text 3D thumbnails. *Wake Island: The Last Stand That Stunned Japan* 16M (~2026-09) |
| **Ink Explainer** (<6 months old) | *What Did Ancient Humans Actually Do All Day?* **18M**, 60× its median. A universal, concrete question beats polish |
| **The Last Day** (~3 months old) | *Nepal's 2026 Disaster Explained: The Glacier That Wiped Out a Valley* **5.1M**: a 2026 news disaster, animated, 19 min |
| **Historically** | *The ENTIRE History of ROME **[No AI]*** 10M: proof of human craft is now a title element |
| The Scribble Scholar, Zenn, Ifverse | New in 2026, each with a 4–10M title on a tiny base |

## 2. Cross-channel patterns

### 2.1 Topic: famous name, one narrow door
- **OverSimplified's top 12 are all events everyone knows by name.** Its one obscure topic, *The
  Pig War*, has a name that is itself a joke.
- **Yarnhub (live) tells a famous war through one unit or one moment**: *When a B-17 Tail Fell With
  a Gunner Inside*, *Midway From The Japanese Perspective*.
- **Jared Owen does the literal version**: *What's inside the Titanic?* (22M), *How did the Enigma
  Machine work?* (14M).
- **The 2026 breakouts ask a concrete question about famous or universal people**: *What Did
  Ancient Humans Actually Do All Day?*, *How Every Infamous Dictator Died*.
- **The recipe:** a household name, then **one narrow, surprising door into it** (one object, one
  decision, one number, the other side's view, or why it *didn't* happen).

### 2.2 Hook archetypes, with timed or quoted examples
1. **Escalate, then undercut.** Tsunamis, quakes, nuclear winter, "Earth ripped apart", then
   "well, almost" (Kurzgesagt, *Marianas Trench*).
2. **Second-person peril.** "You and nine other individuals have been captured by super
   intelligent alien overlords" (TED-Ed, 0:10.7, cue-timed); "you have two parents and each of
   those parents has two parents" (MinuteEarth, ~0:04 est.).
3. **The dated cold open with stacked scales.** "in the 1950s the US began the top secret project"
   at 0:00, 10 billion tons of TNT ~0:16, three scales by ~0:33, "how was it even possible" ~0:35
   (Kurzgesagt, Sundial; estimated).
4. **The false premise to knock down.** "Fentanyl must be amazing" at 0:00, "garbage heroin" ~0:12
   (estimated).
5. **The first-person anecdote.** "on a recent hike I came across a beautiful little Lake and I
   saw…a fish" (MinuteEarth, 0:00), question at ~0:15, ident at ~0:19 (estimated).
6. **The counted contract.** "there are three good reasons for that" at ~0:07 (MinutePhysics).
7. **A clock or timeline promise.** Hour-by-hour titles; melodysheep's counter.

**Timing:**
- TED-Ed [measured, cues]: music and logo first, **first spoken line at 6.5–10.7 s**; the riddle's
  challenge is stated by ~0:30.
- Kurzgesagt [estimated]: **speaks at 0:00**, thesis by **12–22 s**, contract or roadmap at
  **~30–40 s**, then a spoken chapter card.
- MinuteEarth [estimated]: the question or paradox lands at **~15–25 s**, the channel ident **after**
  it (19–30 s).
- MinutePhysics [estimated]: a counted contract by **~7 s**.

### 2.3 Script structure
- **Speech density** [data: transcript words ÷ runtime]: TED-Ed 150–167 wpm, Kurzgesagt 159–167,
  Primer 172–179, CGP Grey 177, MinuteEarth 190–209, **MinutePhysics 225–240**. Our narration
  (`../narration-style.md`) should sit at the Kurzgesagt rate: 150–165.
- **Short-form lessons** (TED-Ed, MinuteEarth): question → naive answer knocked down → mechanism →
  consequence → kicker or callback.
- **Long-form explainers** (Kurzgesagt): about 2,200–2,400 words for 13–15 min, the thesis by
  ~0:20, an escalation ladder, **a relief beat that reverses into a worse consequence** (Sundial,
  verbatim), causes, a reflective close, opinion labelled as opinion, sponsor *after* the close.
- **Narrative history** (OverSimplified, Yarnhub, Zack D. long-form): chronological; characters
  make decisions; innocent ambition → ignored warning → reversal → human cost → irony; Part 1 ends
  on a turning point (Part 2 keeps 60–65% of Part 1's views [data]).
- **Twists are rarely plot twists.** They are a number or physics overturning an intuition: the
  ancestors that "should" number 137 billion; tumbleweeds that "are an invasive species"; the
  balloons that came down.

### 2.4 Animation grammar
1. **One idea per frame, and the eye knows where to look.**
2. **Abstractions become one of four images:** a society or army; a stack of familiar objects; a
   map with moving tokens; a running simulation.
3. **Composition changes far more often than the cut** [measured, TED-Ed]: hard cuts run **2–9
   per minute** (median shot 4–9 s; held sets of 30–140 s), but a new composition arrives every
   **4–6 s** (about 10–13 per minute in the first 60 s), half of them by push-in, pull-out or morph
   inside one set. Ep10's shot design should target **5–8 hard cuts/min and a new composition every
   4–6 s**, with **one held set per idea**.
4. **Something is drawn on to explain**: a route, a ring, an arrow (TED-Ed shot logs); MinutePhysics'
   graph at ~0:35.
5. **Scale shots**: a tiny labelled reference beside the giant subject, a slow pull-out, a hold.
6. **Characters simple and readable at phone size.**
7. **Text on screen sparse and functional**: labels, the spoken number, time labels attached to
   characters (TED-Ed's "1 MINUTE…10 MINUTES").

### 2.5 Sound
- **Loudness** [measured, TED-Ed]: integrated −18.5 to −22.3 LUFS with a **narrow 2.7–5.2 LU
  range**: voice and bed compressed into one band. Our masters target YouTube's −14 LUFS
  (`../sound-and-music.md`), but the narrow range is the lesson.
- **The bed breathes with the voice** [measured]: 0.6–4.8 full-mix near-silences per minute, nearly
  all 0.6–2 s, and **one 6.8 s total silence for the guess beat** (bridge riddle, 1:58.5–2:05.3).
- **An original or tightly fitted score** (Kurzgesagt via Epic Mountain, composed after picture lock
  [source]; melodysheep composes everything [source]).
- **SFX density and music-cue maps** could not be measured for any channel (stereo mixes only, and no
  video beyond TED-Ed). Still open.

### 2.6 What makes these videos shareable
Evidence, where we could get it (comments and Reddit are blocked from here, so this is web-search
evidence, not counts):
1. **The argument share:** *SOUTH KOREA IS OVER* was covered by Korea's Asiae the day after upload,
   drew a ~1,000-comment r/videos thread, criticism on r/kurzgesagt and a Korean reaction episode
   [source, `kurzgesagt.md` §8].
2. **The classroom share:** teachers name OverSimplified "a staple" of their classroom; Plugged In
   calls it animated CliffsNotes [source, `oversimplified.md` §8].
3. **The sequel request:** *ALL THE CATS* opens by saying one comment "kept coming up over and over"
   on the dog video [observed, transcript].
4. **Social currency, a dare, shared fear made calm, one quotable comparison** [inferred, as before].

### 2.7 Thumbnails, by grammar
| Grammar | Who | Note for us |
|---|---|---|
| 1–3 word white capitals + one glowing hero + a scale cue | Kurzgesagt | Banned look (§6) |
| The question in lesson lettering + one character acting it | TED-Ed | |
| Event name + caricatured leaders on a map + Part N | OverSimplified | Banned look |
| No text; one famous object altered by one wrong detail; photoreal daylight | Zack D. long-form | **Restricted** (§6): not with a brand-disaster topic |
| Object name + "Inside" + a clean CGI cutaway | Jared Owen | **Banned** look |
| Ghosted 3D cross-section, no text | Animagraffs | **Banned** look |
| Photoreal 3D aircraft or ships in action, no text | Yarnhub | |
| Time stamps in two panels | The Infographics Show | Mechanism only (our own objects) |
| A strike-through ("~~Black holes~~ Gray holes?") | Sciencephile | |
| One hand-drawn annotation on a plain map or diagram | CGP Grey | |
| Crude cartoon + 1–3 yellow words | Ink Explainer | |

## 3. The 25 most transferable techniques, scored and ranked

**Score = Fit × Evidence × Cost**, each 1–5 (max 125). Ties broken by Fit.
- **Fit**: how well it serves ep10 (an animated explainer of a famous or new event, in our engine).
- **Evidence**: 5 = measured [data] across several channels; 4 = [data] on one channel, or cue-timed
  or estimated-timed verbatim transcript; 3 = verbatim transcript, untimed, or thumbnails observed;
  2 = a third-party summary or a single [source]; 1 = [recall] only.
- **Cost**: 5 = nearly free (writing or packaging); 3 = a new scene type or asset; 1 = a large build.

Techniques with Evidence ≤ 2 are marked **verify first**: confirm by watching before ep10 depends
on them.

| # | Technique | F | E | C | Score | Evidence behind it |
|---|---|---|---|---|---|---|
| 1 | Famous name, one narrow door | 5 | 5 | 5 | **125** | OverSimplified 40M median; Yarnhub live; Jared Owen *Titanic*; 2026 breakouts |
| 2 | Dated cold open, present tense | 5 | 4 | 5 | **100** | Sundial (est. timed); TED-Ed cues |
| 3 | Other side's view, or why it *didn't* happen | 4 | 5 | 5 | **100** | Yarnhub *Midway…Japanese Perspective* 18M; Simple History 15× (12-mo); Castro 2.8× |
| 4 | Exact physical number in the title | 4 | 5 | 5 | **100** | What If 57%, Yarnhub 50%, Zack D. long 58% digits; model-name specificity (Jared Owen) |
| 5 | One human-unit comparison per rung | 5 | 4 | 4 | **80** | Sundial: 13 Great Pyramids, a Hiroshima a minute for 15 months (est. by ~0:33) |
| 6 | A counter or clock as the spine | 5 | 4 | 4 | **80** | Clock titles 1.4M vs 458K neighbours (Infographics, n = 3); What If deep-time hits |
| 7 | Thesis verdict in the title, refrain in the script | 4 | 4 | 5 | **80** | Kurzgesagt verdict titles [data]; "garbage heroin" refrain (transcript) |
| 8 | Commit-to-a-guess pause | 4 | 4 | 5 | **80** | Cue-timed (1:58.8) and **measured 6.8 s silent mix** (bridge riddle) |
| 9 | Ident and housekeeping only after the hook | 4 | 4 | 5 | **80** | MinuteEarth ident at ~19–30 s; Kurzgesagt sponsor after the close |
| 10 | Let it breathe: short drops with the voice, one long silence per act | 4 | 4 | 4 | **64** | Measured silences and loudness, TED-Ed; melodysheep interview |
| 11 | Composition every 4–6 s, cuts only 5–8/min | 5 | 4 | 3 | **60** | Measured, TED-Ed (6 lessons, 2 shot logs) |
| 12 | Escalate, then undercut, in the first 20 s | 4 | 3 | 5 | **60** | *Marianas* transcript (untimed) |
| 13 | Last line answers the first, as a callback | 4 | 3 | 5 | **60** | *Marianas*, *Infinite Hotel*, riddles (transcripts) |
| 14 | Second person in the first line and at re-hooks | 3 | 4 | 5 | **60** | TED-Ed cue 0:10.7; MinuteEarth est. 0:04 |
| 15 | Shorts cutdowns: payoff in frame 1, captions as picture, looping last line | 3 | 5 | 4 | **60** | Zack D. 14M Shorts median; Kurzgesagt Shorts 2.75M median |
| 16 | Relief beat that reverses into a worse consequence | 4 | 3 | 4 | **48** | Sundial (verbatim, untimed) |
| 17 | One person carries the abstraction | 4 | 3 | 4 | **48** | TED-Ed riddles (transcripts); *This Woman Cured Her Cancer* 21M |
| 18 | Show our method as evidence ("how we know") | 4 | 3 | 4 | **48** | *AI Slop* (transcript); "[No AI]" titles 8–10M (Historically) |
| 19 | Build the diagram on screen | 5 | 3 | 3 | **45** | MinutePhysics graph at ~0:35 (est.); TED-Ed drawn route/ring/arrow (shot logs) |
| 20 | Tragedy arc for a silly-sounding event | 4 | 2 | 5 | **40** | Balloonfest via a third-party summary. **Verify first** |
| 21 | Physics or numbers as the twist | 4 | 3 | 3 | **36** | Ancestor paradox, tumbleweeds, Sundial (transcripts) |
| 22 | Systems as tokens on a map or table | 5 | 2 | 3 | **30** | OverSimplified maps [recall + thumbnails]; Yarnhub. **Verify first** |
| 23 | A simulation as the wow beat | 3 | 4 | 2 | **24** | Primer 24M/15M; CGP Grey 44M/37M [data] |
| 24 | Series loop and recap bridge | 2 | 5 | 2 | **20** | OverSimplified Part 2 keeps 60–65% [data] |
| 25 | Sponsor or CTA written into the world | 2 | 1 | 3 | **6** | [recall] only; the one checked transcript (Sundial) has the sponsor *after* the story. **Verify first** |

Rows are in score order; ties are broken by Fit, then by the original order.

**How to build each, in our language:**
1. Pick an event everyone knows by name; tell it through one object, decision or number most people
   have never heard of.
2. Date, place, one action on a slow push-in. The date is set **in the world** (a stamped ledger
   line, a date wheel), not as a title card.
3. Run the title and thumbnail tournament with an "other side" and a "why it didn't happen" variant.
4. Test a full-digit figure title against a verdict title in Test & Compare.
5. Every big number gets a physical comparison built as **tally blocks or stacked card objects**,
   revealed by a pull-out.
6. A counter wheel or date flap that turns at each chapter: timeline and chapter card in one object.
7. A 3–6 word verdict the script repeats at each act turn with new meaning.
8. **Our version:** stop before the answer, ask the viewer to commit to a number, freeze a counter
   wheel mid-turn, drop the whole mix to silence for 4–6 s, then release. **Never** their "pause the
   video… 3, 2, 1" wording or an on-screen numeric countdown (§6).
9. No channel ident, sponsor or "in this video" before the hook lands; the contract by ~30–40 s.
10. Short drops of the bed with the voice between paragraphs; one long total silence per act, after
    the biggest reveal.
11. Shot plan: one held set per idea; inside it, push-ins, pull-outs and morphs every 4–6 s; hard cuts
   only at idea changes (5–8/min). Feed this to `shot-design`.
12. A 3–4 beat crescendo of consequences, then a hard stop and one dry line.
13. Write the last line first, as a twist on the first.
14. "You" in the first line and at each re-hook; a POV camera for those lines.
15. Three 30–45 s vertical cutdowns of the wow beats, with burned-in word captions in our typeface.
16. Warm light and a lifted bed, then the darker consequence. **In our own words** (§6).
17. One real person from the event (an operator, a clerk, a witness) threads the acts.
18. A 20–30 s beat that shows the primary document on screen (`../fact-check-playbook.md`).
19. Our 2D canvas layer draws strokes and labels over the set: the mess first, then the clean version.
20. Innocent ambition → ignored warning → reversal → human cost → irony as the five act cards.
21. Plan two beats where a counterintuitive mechanism animates, not just narrated.
22. Institutions as stamps, tokens or tallies on our paper map, moving as decisions are made.
23. Three.js instancing of hundreds of agents following one rule (a crowd, a queue, a run on a bank).
24. If the event is big, split at a natural turning point, with a recap Short between.
25. Only if verified: a CTA beat that happens on an object in the set.

## 4. Copy: what converts, and draft ep10 packaging

Uses `.claude/skills/bencivenga-copy`: specificity, proof ≥ claim, a curiosity gap, and the "yeah,
sure" test (would a sceptical viewer believe it?).

### 4.1 Why the winning titles convert

| Title (views) | Specificity | Proof | Curiosity gap | "Yeah, sure" risk |
|---|---|---|---|---|
| *How does a Tank work? (M1A2 Abrams)* (64M) | The model name | Implied: a real machine, opened | How it works inside | None: the promise is modest and certain |
| *The Pepsi Contest That Killed 5 People* (12M) | Brand + body count | A countable fact | How can a contest kill? | Low: checkable |
| *Toyota's $2,300,000,000 Mistake* (10M) | The full-digit figure | The number reads like a document | What mistake? | Low |
| *When a B-17 Tail Fell With a Gunner Inside* (22M) | One aircraft, one man | A concrete image | Did he survive? | Low |
| *What Did Ancient Humans Actually Do All Day?* (18M) | Everyday life, not "history" | — | "Actually" promises a correction | Low |
| *The ENTIRE History of ROME [No AI]* (10M) | — | **"[No AI]" is the proof claim** | — | Low: it's a craft promise |
| *SOUTH KOREA IS OVER* (15M) | A whole country | Thin in the title; the video carries it | Is it? | **High**: and it drew pushback (§2.6) but also the shares |
| *The AI bubble is about to pop...* (4.3M) | Named topic | None | When? | **High**: a prediction. Works now (§4.2) |
| *Most Terrifying Financial Chart in the World Right Now* (720K) | Generic | None | Weak | **High** and generic: the weakest panic title |

**The pattern:** the winners make a **small, concrete, checkable promise** (a model name, a figure,
one man in one tail) and leave **one question open**. Superlatives and urgency work only when tied
to something named.

### 4.2 The panic-title check [data, small n]

Re-tested with dates: in the Infographics Show's last two months, 6 panic-voice titles have a 1.2M
median against 458K for the other 54 in the same window, and a panic title beats a random neighbour
89% of the time. **But n = 6, and five of six are about named, live news** (OpenAI, MIT, Wall
Street). The two generic ones ("Most Terrifying…Chart/Shift") are the weakest. **Rule for ep10:
urgency only when attached to a named, verifiable specific, and proof on screen within 30 s.**

### 4.3 Draft ep10 title and thumbnail pairs (illustrative)

Ep10's topic is chosen in the packaging tournament (`packaging` skill), not here. These drafts show
how §3 and §4.1 apply to three candidates that fit MAINSPRING's lane (§5: clockwork, counter and
paper metaphors for history and news). **Every fact marked [verify] must be confirmed in
`../fact-check-playbook.md` before any of these is used.**

**A. The 1929 crash, through the ticker that couldn't keep up** [verify: on the big days the stock
ticker reportedly ran hours behind trading, so investors were selling on stale prices]
| Title | Thumbnail | Yeah-sure check |
|---|---|---|
| The Crash Was Worse Because the Clock Was Late | A paper ticker tape spooling off a counter wheel whose hands lag behind a second, faster wheel; no text | Needs the lag figure on screen by 0:30 |
| Black Tuesday's 2½-Hour Delay | The same, with one stamped line "2:30 LATE" [verify the figure] | Specific and checkable; strongest if the number holds |
| They Sold on Prices That Were Already Gone | A trader's hand on a ticker tape where the printed numbers fade to blank | Medium: needs proof of stale prices |

**B. Y2K, the disaster that didn't happen** (technique 3: why it *didn't* happen; the counter is the
subject) [verify: global remediation spend estimates, commonly cited in the hundreds of billions]
| Title | Thumbnail | Yeah-sure check |
|---|---|---|
| The Disaster That Didn't Happen | Two counter wheels rolling 9-9 to 0-0, the last digit jammed half-way; no text | Low risk; the curiosity is "why not?" |
| Y2K Wasn't a Hoax. Here's the Bill. | A stamped invoice line with a long full-digit figure [verify] | Specific; proof is the invoice itself |
| Why Midnight 2000 Was Quiet | A desk clock at 11:59 with a stack of punched cards holding the minute hand back | Medium; gentler, less clickable |

**C. Chernobyl, through the one test that started it** [verify: the timeline of the safety test and
the AZ-5 button]. **Caution:** heavily covered (a hit TV series), so only with a door nobody uses.
| Title | Thumbnail | Yeah-sure check |
|---|---|---|
| The Safety Test That Caused Chernobyl | A paper checklist on a clipboard, one line stamped in red; a counter reading the test's time | Low; checkable; the irony is the gap |

None of these may combine a brand-disaster topic with Zack D.'s thumbnail and title formulas (§6),
and none may show the real machine as a sectioned 3D cutaway (§5).

## 5. Where MAINSPRING's theme can stand (narrowed)

**The first pass was wrong.** It claimed that no channel treats its subject as "a physical mechanism
you can open, wind and watch run". **Jared Owen** (4.5M subs, 3.0M median) and **Animagraffs**
(1.9M, 2.6M median) do exactly that with 3D cutaways, and Jared Owen applies it to famous
historical objects (Titanic, Enigma, the Statue of Liberty). An ep10 that opens a real machine on a
grey background would read as a Jared Owen video.

**The space we can own, stated narrowly:**
- **Clockwork, paper and counter *metaphors*, applied to history and news**, not engineering
  cutaways. The event is shown as a mechanism **we build out of desk objects**: counter wheels,
  date flaps, punched cards, ledgers, stamps, tally blocks, a wound spring, on printed card with a
  pen line and halftone (STYLE-BIBLE "Paper & Spring").
- **The real machines of a story are never sectioned photoreal or CGI-clean.** If they appear, they
  appear as paper or card models in our style, and never as the explanatory hero.
- **Our subjects are events, decisions and numbers**, not how a device works. "How does X work?" is
  someone else's question; ours is "how did this *happen*, and what was the hidden mechanism?"

**What that leaves different from each neighbour:** Kurzgesagt is flat glow on dark; OverSimplified
is cut-out comedy caricatures; Zack D. is photoreal people and objects; Jared Owen and Animagraffs
are clean-CGI and ghosted cutaways of real machines; Yarnhub is photoreal 3D aircraft; Primer is
blobs. **Paper metaphor mechanisms for events** is still empty.

**Action for STYLE-BIBLE.md** (not edited in this pass): its one-line promise, "every subject is a
machine you can open, wind and watch run" and "hinged so the camera can open the case and show the
mechanism inside", should be amended to say the case and mechanism are **metaphorical paper
objects standing for the event**, never a cutaway of the real machine. Until then, read it that way.

In that language:
- technique 5 (comparisons) uses tally blocks and the counter wheel;
- technique 6 (the clock spine) uses the counter wheel and the date flap;
- technique 22 (systems as tokens) uses stamps and tallies;
- technique 8 (the guess pause) freezes a counter wheel mid-turn.

## 6. Distinctiveness guardrails for ep10

We study these channels; we don't wear their clothes. **Never use any of the following.**

### 6.1 Looks and characters
| Channel | Signature to avoid |
|---|---|
| Kurzgesagt | Glow-on-deep-navy and purple flat vector; bean-shaped big-eyed characters; the bird or any mascot like it; heavy white capitals over a neon hero; the ducks or birds Easter eggs |
| TED-Ed | The red logo bug; the educator by-line after a dash |
| OverSimplified | Round-headed cut-out caricatures of leaders; narrator-voiced pitched characters; their running gags |
| MinuteEarth / MinutePhysics | Whiteboard stick figures; marker-drawn style |
| The Infographics Show | Shocked caricature faces; coloured label-box text |
| Zack D. Films | The recurring avatar; **their already-told stories** (Balloonfest, the Pepsi Number Fever contest, Toyota's recall, the Starbucks logo, the Flamin' Hot story, Norman) |
| **Jared Owen** | **Clean CGI cutaways of real machines or buildings; colour-coded internals as the hero; the object-name + "Inside" thumbnail** |
| **Animagraffs** | **Ghosted, semi-transparent cross-sections of real machines** |
| Yarnhub | Photoreal 3D aircraft dogfights as the hero image |
| melodysheep | The letter-spaced poster title as a signature; sampled-scientist music |
| What If | The "IF" logo |
| Primer | Blob creatures |
| CGP Grey | Stick figure with glasses; the voice and monologue persona |

### 6.2 Verbatim lines we may not use (in narration or on screen)
| Line | Whose | Use instead |
|---|---|---|
| "Good news! Wait, no, bad news!" (any close variant) | Kurzgesagt | The mechanism: a relief beat, then the worse consequence, in our words |
| "Now, let's make this understandable…" / "let's add colours" | Kurzgesagt | Draw the clean version without announcing it |
| "Pause the video now…" / "Answer in: 3, 2, 1" and an on-screen numeric countdown | TED-Ed | A frozen counter wheel and silence (technique 8) |
| "In a Nutshell" | Kurzgesagt | — |
| "Hi, I'm … and this is …" ident patterns of other channels | MinuteEarth and others | Our own ident, after the hook |

### 6.3 Title tags and formulas we may not use
| Tag or formula | Whose |
|---|---|
| "(Minute by Minute)", "Hour by Hour", "The Last 24 Hours of…" | The Infographics Show (What If also uses "Hour by Hour") |
| "(Science not Fantasy)"; "`[X] IS OVER`" in capitals; "The Most Insane [X] You Never Heard About" | Kurzgesagt |
| "Can you solve the … riddle?" as a series | TED-Ed |
| "`[Event] - [Channel] (Part N)`" | OverSimplified |
| "ALL THE [X], EXPLAINED" | MinuteEarth |
| "You Are Alive to Watch…"; "What If…" as a series opener | What If |
| "TIMELAPSE OF…" | melodysheep |
| "How does [machine] work? ([model])"; "What's inside [famous object]?" | Jared Owen |
| "How a [machine] Works" | Animagraffs |
| "The [Brand/Place] [Thing] That Killed N People"; "[Brand]'s $[full number] Mistake" | Zack D. long-form |
| "holy sh\*t…" voice | The Infographics Show |
| Emoji-suffix titles as a system | Zack D. Shorts |

### 6.4 Combinations we may not ship
- **The Zack D. long-form signature:** a brand, product or civic-stunt disaster topic + a no-text
  photoreal thumbnail of one famous object altered by one wrong detail (or shaped like a more famous
  disaster) + a title in his formula. **With a brand or place disaster topic, any two of the three
  is already too close**; use one of our own thumbnail grammars and avoid both title formulas.
- **The Jared Owen signature:** a famous object or machine + a sectioned or orbiting 3D cutaway as
  the explanation + a "how it works" or "what's inside" title.

## 7. Data and reproducibility

`data/` holds everything behind the [data] labels:
- `<handle>.videos.csv` and `<handle>.shorts.csv`: every video in the flat pull (position from newest,
  id, title, views, duration). 25 channels plus the discovery channels.
- `<handle>.newest60.approx-dates.csv`: the dated re-pull.
- `discovery_search_2026.csv` and `discovery_<channel>.videos.csv`: the discovery pass.
- `channels.csv`: subscribers and video counts.
- `derived/`: top-10 lists for every tab, the 12-month outlier tables, runtime and topic tables,
  TED-Ed pacing measurements, and the estimated-timed openings.
- `scripts/`: `build_csv.py` (raw yt-dlp JSON → CSV), `analyse.py` (top, recent, runtime, topic),
  `ro.py` (estimated timings from rosetta.to pages), `measure.sh` (ffmpeg cut, silence and loudness
  measurement). They expect the raw JSON in a scratch folder; to reproduce, re-run the yt-dlp
  commands in the Method section and point `build_csv.py` at the output.

Spot-check from the review, still matching: OverSimplified 33 videos, 40M median, top 105M / 75M /
72M / 69M / 68M (`data/OverSimplified.videos.csv`).

**Still open** (needs video or comment access this container doesn't have): cut rates and shot logs
for any channel except TED-Ed; SFX density and music maps; verbatim openings for OverSimplified,
Infographics, Zack D., melodysheep, Sciencephile, What If, Jared Owen, Animagraffs, Sam O'Nella;
comment and share counts. The fastest fix is a person watching the four OverSimplified openings
with the checklist in `oversimplified.md` §4.

## 8. Sources

**First-party and primary:**
- [kurzgesagt.org/youtube](https://kurzgesagt.org/youtube/) — the process page
- rosetta.to transcripts: Kurzgesagt (*Marianas Trench*, *Immune System*, *Most Insane Weapon*, *Fentanyl*, *AI Slop*, *South Korea Is Over*, *How to Make a Kurzgesagt Video in 1200 Hours*); MinuteEarth (*fish in mountain lakes*, *The Ancestor Paradox*, *ALL THE CATS*, *How We Make MinuteEarth Videos*); MinutePhysics (*wind turbines*, *Common Moon Mistakes*); CGP Grey (*Tumbleweeds*); Primer (*Aggression*, *Natural Selection*)
- ted.com transcript pages with timed cues and the lessons' MP4 files (*prisoner hat riddle*, *bridge riddle*, *Infinite Hotel*, *What is depression*, *didn't drink water*, *language of lying*, *attention span*, *didn't brush teeth*)
- [oversimplified.tv/create](https://www.oversimplified.tv/create)
- [A Sound Effect: Timelapse of the Future sound (2019 interview with John D. Boswell)](https://www.asoundeffect.com/timelapse-of-the-future-sound/)
- [Chris Reilly portfolio: Zack D. Films pipeline](https://supersets.chrisreillyportfolio.com/zackdfilms.php)

**Share evidence:**
- [Asiae on *South Korea Is Over*](https://cm.asiae.co.kr/en/article/2025040314164945986); [Korea Deconstructed reaction episode](https://castbox.fm/episode/Is-Korea-Falling-Apart--4-Young-Koreans-React-to-"Korea-is-Over"-id6866104-id873131750)
- [World History Encyclopedia teacher forum](https://community.worldhistory.org/t/what-s-your-go-to-youtube-channel-for-teaching-history/70); [Plugged In review of OverSimplified](https://www.pluggedin.com/youtube-reviews/oversimplified/); [The Central Trend](https://thecentraltrend.com/126092/opinion/oversimplified-really-knows-how-to-make-history-fun/)

**Third-party summaries:**
- youtubesummary.com summaries of `_XV6Jz3Xg18` (Balloonfest), `QLq6GEiHqR8` (Pig War), `zqllxbPWKNI` (Napoleonic Wars) and `uD4izuDMUQA` (Timelapse of the Future)
- [becomeviral.com Infographics Show case study](https://becomeviral.com/blog/infographics-show-case-study) (estimates only)
- [Ofcom TED-Ed submission](https://www.ofcom.org.uk/siteassets/resources/documents/tv-radio-and-on-demand/broadcast-guidance/psb/psb3/10._ted-ed.pdf)
- [Cartoon Brew: Buzzco and TED-Ed](https://www.cartoonbrew.com/biz/buzzco-creates-animation-for-ted%e2%80%99s-ted-ed-initiative-61854.html)
