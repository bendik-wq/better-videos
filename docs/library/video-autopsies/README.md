# Video autopsies: 70 top documentary videos, beat by beat

Beat-by-beat breakdowns of the biggest videos of 16 documentary and explainer channels, one file
per channel, plus this index of what they have in common. They feed `packaging` (title and
thumbnail patterns), `retention-script` (hooks, re-hook cadence, structure, endings) and
`idea-engine` (what kinds of ideas break out).

| File | Videos |
|---|---|
| [fern.md](fern.md) | 7 |
| [lemmino.md](lemmino.md) | 4 |
| [kurzgesagt.md](kurzgesagt.md) | 4 |
| [johnnyharris.md](johnnyharris.md) | 5 |
| [magnatesmedia.md](magnatesmedia.md) | 5 |
| [coldfusion.md](coldfusion.md) | 5 |
| [wendover.md](wendover.md) | 5 |
| [polymatter.md](polymatter.md) | 5 |
| [veritasium.md](veritasium.md) | 5 |
| [vox.md](vox.md) | 4 |
| [bloomberg.md](bloomberg.md) | 4 |
| [moon.md](moon.md) | 4 |
| [hoog.md](hoog.md) | 4 |
| [neo.md](neo.md) | 5 |
| [reallifelore.md](reallifelore.md) | 2 |
| [economicsexplained.md](economicsexplained.md) | 2 |
| **Total** | **70** |

## Method and evidence labels

YouTube video files can't be downloaded from this box, but metadata can. On **2026-10-12** we
pulled, for each video, with `yt-dlp --skip-download` (player client `android_vr`):

- the **watch-page metadata**: title, views, likes, length, publish date, description and the
  creator's **chapters**;
- the **caption track** (manual where published, otherwise YouTube's auto captions) with word
  timings, for **51 of the 70** videos (the rest hit YouTube's rate limit; those entries are built
  from metadata, chapters and the heatmap, and say so);
- YouTube's **"most replayed" heatmap** (100 points per video), for 64 of the 70;
- the **thumbnail** image, which we looked at for every video.

Transcripts were used for measurement and are quoted only in short phrases. Nothing was
downloaded except text and thumbnails, and none of it is committed.

Labels: **[observed]** = read directly from the captions, chapters, heatmap, thumbnail or
description; **[data]** = our view-count pulls (`docs/research/channel-breakdowns.md` appendix);
**[inferred]** = our interpretation.

**What the measures mean.** *wpm of runtime* = caption words ÷ video minutes (it includes music-only
stretches, so it's a pacing measure, not the narrator's speed). *Turn gap* = median seconds between
sentence-level turn words (*but, however, yet, except, until, instead*). *Heatmap peaks* = local
maxima of YouTube's most-replayed curve, excluding the first 4% (every video peaks at 0:00);
"most replayed" means rewound or rewatched, **not** retention. *Heat quarters* = the mean of the
curve in each quarter of the video.

Reproduce one video:

```bash
yt-dlp --skip-download --ignore-no-formats-error --extractor-args "youtube:player_client=android_vr" \
  --write-info-json --write-subs --write-auto-subs --sub-langs en --sub-format json3 \
  --write-thumbnail --convert-thumbnails jpg -o "%(id)s.%(ext)s" -- <VIDEO_ID>
# chapters: .chapters  heatmap: .heatmap  captions: <id>.en.json3 (events[].segs[].utf8 with tOffsetMs)
```

Pace requests at 60 s or more apart; at shorter gaps YouTube answers 429 and drops the captions.

---

## Cross-video patterns

### A. What the numbers say [observed, n as stated]

| Measure | Result | What it means for us |
|---|---|---|
| Length (70 videos) | Median **19.4 min**; 6–79 min | Our 12–20 min target sits in the middle. Median views by length: <10 min 5.8M (12 videos), 10–15 min 12.2M (14), 15–20 min 10.8M (10), 20–30 min 11.2M (22), 30+ min 8.3M (12). No length penalty from 10 to 30 min in this sample of winners |
| Pacing (51 with captions) | Median **163 wpm of runtime**; 122 (Neo) to 216 (Moon) | Our 150 wpm budget is on the calm side of normal; calm channels (Neo, LEMMiNO, Bloomberg) win with imagery carrying the pace |
| Turn-word gap (51) | Median **26.7 s**; middle half 20–38 s | Confirms the 30–40 s re-hook cadence as a ceiling, with smaller "but" turns in between (`narration-style.md` §1.2) |
| First turn word (51) | Median **0:31**; 25 of 51 turn by 0:30 | Our "turn by 0:22" rule is stricter than half the winners. Keep it; it's a strength |
| Chapters (70) | **45** publish chapters; median **9** per video | More than our 4–6 on-screen chapter cards. See pattern 9 |
| Heat shape (64) | First quarter hotter than the last in **53 of 64**; median last/first ratio **0.63** | Front-load; every video loses replay energy. The exceptions rise at the end because of a late reveal (Veritasium's leaded-petrol video, Neo's Saudi critic) |
| Top-peak position (64) | Spread across the whole runtime; the most common decile is the middle (40–60%) | There is no single "wow minute"; plan two or three wow beats, not one |
| Title length (70) | Median **40.5 characters** | Matches the 39-character median of the 475-title set |

### B. Twelve patterns that recur

**1. The sponsor-skip landing is the most replayed moment in a large share of videos.**
In the videos with a mid-roll sponsor read, the first line after the read is the top heatmap peak
in six (Fern's *Bank Heist* 9:01, Moon's *BlackRock* 7:58 and *Instagram* 13:44, Johnny Harris's
*McDonald's* 8:37, hoog's *Kidnapping* 7:45, Vox's *Why can't prices just stay the same?* 3:50) and the second peak in three more (Fern's *CIA* 7:23,
*Dark Web* 6:46, *President* 7:37) [observed]. Viewers skip the read and land there. **So the
return line is the most-heard line after the hook**: write it as a re-hook (`retention-script` §8
step 5), give it a hard visual change, and keep the read itself skippable in one gesture (a clean
visual boundary in and out).

**2. The question stack at 0:30–1:40.**
Two to five explicit questions in a row that become the video's contract: Veritasium's five
(why black? safe? cost? evaporation? real purpose?, 0:57–1:05), Fern's three-question loops
(*Bank Heist* 1:33, *President* 1:03, *Scariest Building* 1:06), LEMMiNO's triad in *Cicada* (2:03,
repeated word for word at 5:08), hoog's three in *Tokyo* (0:30), Vox's two in *EV war* (1:39),
Bloomberg's two in *Singapore* (0:44), Moon's two in *Instagram* (1:00). An automatic count (two or more questions within 15 s, between 0:15 and 1:50) finds the stack in **12 of the first 49** captioned videos, plus LEMMiNO's at 2:03 [observed].
The questions then map onto chapters. It's the visible form of our open-loop ledger.

**3. The dated present-tense cold open.**
"It's October 2015…" (Fern), "On the 4th of January, 2012…" (LEMMiNO), "In 2003, the construction
of… The World was announced" (Neo), "In 1929 in Chicago, people kept mysteriously dying…"
(Veritasium), "July 2026. Thousands of AIs are placed in solitary confinement…" (Kurzgesagt). An automatic
count finds a year or month in the first 20 s of **about 15 of the first 49** captioned videos [observed]. A date plus a place plus one action is the fastest way to a scene in narration
alone, which suits a faceless channel. Kurzgesagt's AI outlier (17.9M in about a week) uses it for
software [observed].

**4. The replayed moments are explanations, not explosions.**
Classifying each video's top non-sponsor peak [observed, interpretation inferred]:
- **a mechanism made simple** (7): how money is created (ColdFusion 10:59), the subscription pivot
  (MagnatesMedia's Netflix 18:30), social engineering step by step (Fern's CIA 15:00), Silk Road's
  rating system (7:34), the loss-leader staples (PolyMatter's Costco 1:58), the US tax rule
  (PolyMatter's Apple 1:31), a plan's zoning (hoog's Tokyo 2:47);
- **a computed comparison** (6): 14 first-class passengers vs 122 in economy (Wendover 1:30), light
  speed around a star (Kurzgesagt 9:28), humanity at 0.73 on the Kardashev scale (2:17), Shenzhen vs
  Los Angeles wages (PolyMatter 1:45), Singapore's tax rate (Bloomberg 2:39), carrier counts
  (Wendover 0:49);
- **a single clue or primary record** (6): the hidden text in an image file (LEMMiNO 0:42), the radar
  turn-back (3:59), the NSA's prior solution (7:31), LBJ's recorded call (Johnny Harris 9:36), the
  courier's name (Neo 5:10), the service manual (19:03);
- **a hidden origin** (4): shade balls were invented to keep birds away (Veritasium 5:48), Teflon as
  the substance that reacts with nothing (5:24), Coke's lobbying (19:37), Amsterdam's AI urinal coda
  (hoog 12:13).
**Our wow beats at ~3:00 and ~6:00 should be one of these four kinds**, which are also the kinds our
engine renders well: an animated mechanism (`DAT-008`, `DAT-020`), a computed bar or counter
(`DAT-006`, `DAT-021`), a document close-up (`OBJ-016`), a map line (`DAT-002`).

**5. One absurd object with a number on it.**
The five most-viewed videos in the set: 96,000,000 black balls (112.7M), the coronavirus (89.6M),
the blue LED (56.3M), the ocean's depth (50.5M), the Collatz formula (46.5M) [observed]. Four of
five are a single object or diagram with a number or a formula. This is outlier factor F1.

**6. Thumbnails: one hero, one red element, text that complements the title.**
Across 70 thumbnails [observed]:
- **54 of 70 carry words**; most often 2–5 words, and often *different* from the title (PolyMatter:
  title "How North Korea Makes Money", thumbnail "HOW NORTH KOREA WORKS"; Vox: title asks "Why China
  is winning the EV war", thumbnail answers "IT'S THE BATTERY"; Wendover: title "$2,614 Per Minute",
  thumbnail "How the President Travels").
- **About 21 of 70 show a real face**, concentrated in four channels (Johnny Harris, ColdFusion,
  Moon, Fern). The two biggest place videos (Neo's Dubai islands, RealLifeLore's ocean) and the two
  biggest mysteries (LEMMiNO's Cicada and MH370) have none.
- **Fern 7 of 7 and hoog 4 of 4 use exactly one red element** (a WANTED label, a red arrow, a red
  crosshair, a red-lit building, a red trapdoor outline).
- Recurring grammars we hadn't listed: **the case board** (cork, red string, WANTED or MOST
  WANTED stamp, eye-bars: Fern's two biggest and Neo's bin Laden), **the absence drawn** (Vox's
  dashed shark outline), **the stair-step triptych** (Veritasium's LEDs labelled EASY, EASY, ALMOST
  IMPOSSIBLE), **the model city with one red building** (hoog's "sexscraper"), **money as a tower on
  a map** (Bloomberg's Singapore), **the blueprint** (Johnny Harris's ice-cream machine drawn as a
  service-manual line drawing), **the comment screenshot** (Fern's "the money was never recovered").

**7. Titles are being A/B tested in public.**
Three of the 70 returned a different title on the watch page than in the same day's channel list:
Fern's *The Scariest Building in Europe* / *Why Did China Buy This $343,000,000 Building?*;
Veritasium's *The Biggest Chemical Coverup In History* / *How One Company Secretly Poisoned The
Planet*; and *How A Single Color (Almost) Stopped Technology From Progressing* / *Why It Was Almost
Impossible to Make the Blue LED* [observed]. The pairs show what they test: a **superlative vs a
$-number question**, and **a label vs a narrative claim**. Our Test & Compare plans should test title
shapes like these, one variable at a time.

**8. Endings: return to the opening, widen, or admit the unknown. Never recap.**
- **Callback to the thumbnail or cold open**: Fern's heist ends on the thumbnail's own words ("the
  money… was never recovered"); MagnatesMedia's Netflix ends on Blockbuster outliving Netflix.
- **Widen to the viewer**: Fern's CIA video ends on a surveillance statistic and "Maybe they're even
  surveilling us."
- **Honest open question**: LEMMiNO ("Did Cooper survive? I have no idea.").
- **Archive voice as the button**: Johnny Harris's JFK ends on Oswald's recorded "No." [observed]
Recaps are rare and belong to the plainest videos (ColdFusion's *Enron* "CONCLUSION", Wendover's
*China* "Conclusion"); the biggest outliers end on a callback, a widening or an open question [observed].

**9. More chapters than we use.**
45 of 70 publish chapters, median 9, up to 17 (Bloomberg's spy video, Veritasium's blue LED)
[observed]. Chapters are navigation and search entries as much as story beats; many are plain labels
("Partnership with Walgreens"). **Keep 4–6 on-screen chapter cards (story acts) but publish 8–12
description chapters** at sub-beats, named as curiosity where possible.

**10. The sponsor sits at 4–9 minutes or at the very end.**
Fern, Johnny Harris, MagnatesMedia, Moon and hoog read mid-roll at 4:10–9:00; Wendover, PolyMatter,
Neo and the 2017–20 catalogue name the sponsor in the first sentence and read at the end; Bloomberg
has none [observed]. Fern bridges into the read from the story's own subject (privacy for a hacking
story). Our option A (after Ch.1's payoff, ~3:40–4:40) is earlier than all of them; see the
`retention-script` update.

**11. Speed on news wins outsized views.**
Kurzgesagt's coronavirus video eight days after the pandemic declaration (89.6M); ColdFusion's FTX
five days after the bankruptcy (8.8M); Johnny Harris's Taiwan scenario two days after the invasion of
Ukraine (11.6M); Kurzgesagt's AI incident video (17.9M in a week) [observed]. Timeliness is outlier
factor F3; `idea-engine` should check the news every run.

**12. Primary material is the moat, and the creators say so.**
Fern's own most-discussed recent video is about AI channels cloning its look (10.9M views in six
weeks); the team built a tool to catch thumbnail copies and fact-checked the copycats [observed].
The videos that hold best rest on a book or witness (Fern's KKK, Bloomberg's spy podcast), obtained
documents (Johnny Harris's manuals, Veritasium's DuPont files) or self-measurement (Derek's blood
test). For a faceless 3D channel this is the single most important lesson: **every episode needs at
least one primary record on screen.**

### C. Title shapes seen in this set (for `packaging`)

| Shape | Examples here | Views |
|---|---|---|
| Why are [exact huge number] [objects] on this [place]? | Veritasium | 112.7M |
| [Topic] Explained & What You Should Do | Kurzgesagt | 89.6M |
| The [Thing] is Way [Bigger] Than You Think | RealLifeLore | 50.5M |
| The Simplest [X] No One Can [Y] – [Jargon] | Veritasium | 46.5M |
| The Man Who Accidentally [Did Huge Thing] | Veritasium | 43.4M |
| [Name]: An Internet Mystery / The Vanishing of [X] / The Search For [Person] | LEMMiNO | 42.5M, 30.0M, 24.4M |
| Why [Mega-Project] Is Still Empty | Neo | 34.8M |
| Why no [place] has a [thing] | Vox | 32.8M |
| The Kids Who Hacked [Institution] / The Hunt for [Villain] | Fern | 20.1M, 16.8M |
| [Tech] Just Crossed the Terrifying Line – Now What? | Kurzgesagt | 17.9M |
| Why People Think [Belief] | Johnny Harris | 17.4M |
| Cities at Sea: How [System] Works | Wendover | 14.1M |
| The REAL Reason [Everyday Annoyance] | Johnny Harris | 13.6M |
| [Company] – [Superlative] Disaster | ColdFusion | 12.7M |
| The Secret [Nationality] Company That Owns Everything | MagnatesMedia | 12.1M |
| The Economics of [Everyday Thing] | Wendover | 12.2M |
| The [Person]'s $[exact] Per Minute [System] | Wendover | 12.2M |
| How [Agency] Found [Person] | Neo | 16.2M |
| Why [Country] Has [Exact Number] [Objects] (and likely more) | Johnny Harris | 9.6M |
| [Platform] Is Worse Than You Thought | Moon | 8.0M |
| [Country]'s Currency Crisis: the worthless $100 trillion bill | PolyMatter | 7.6M |
| Why [City] is Building [Surprising Thing] | hoog | 6.9M |
| How [Country] Got So Crazy Rich | Bloomberg | 4.9M |

### D. What changed in our skills because of this

- `retention-script`: the sponsor return line is written as the strongest re-hook; a question
  stack by 1:00 opens the ledger; at least one primary record on screen per chapter; wow beats from
  the four replay kinds; endings from the four types above; the narration-style edit pass.
- `packaging`: the new thumbnail grammars (case board, absence drawn, stair-step triptych, model
  city, money tower, blueprint); thumbnail text complements the title; title A/B pairs modelled on
  the observed tests.
- `idea-engine`: outlier factors weighted by this set (F1 and F3 produce the biggest numbers).

### E. Gaps

- 19 videos have no caption analysis (rate limit). Their entries use metadata, chapters, heatmap
  and thumbnails. Re-run the fetch with 60–90 s gaps to fill them.
- The heatmap is "most replayed", not audience retention; no public source gives retention curves.
- View counts are a snapshot (2026-10-12) and favour old videos.
- Cut rates are still unmeasured (no video files); see `channel-breakdowns.md` "Gaps".

---

## The 70 videos at a glance

Sorted by views. Measured on 2026-10-12. "Turn gap" and "wpm" need captions; "—" = not available.

| # | Channel | Title | Views | Length | wpm | Turn gap (s) | First turn | Chapters | Top replay peak |
|---|---|---|---|---|---|---|---|---|---|
| 1 | [veritasium](veritasium.md) | Why Are 96,000,000 Black Balls on This Reservoir? | 112.7M | 12:07 | 192 | 22.6 | 1:40 | 9 | 5:48 |
| 2 | [kurzgesagt](kurzgesagt.md) | The Coronavirus Explained & What You Should Do | 89.6M | 8:35 | — | — | — | — | 4:27 |
| 3 | [veritasium](veritasium.md) | How A Single Color (Almost) Stopped Technology From Progressing | 56.3M | 33:45 | — | — | — | — | 9:27 |
| 4 | [reallifelore](reallifelore.md) | The Ocean is Way Deeper Than You Think | 50.5M | 6:36 | 191 | 32.0 | 0:19 | 6 | 2:58 |
| 5 | [veritasium](veritasium.md) | The Simplest Math Problem No One Can Solve - Collatz Conjecture | 46.5M | 22:09 | — | — | — | — | 16:23 |
| 6 | [veritasium](veritasium.md) | The Man Who Accidentally Killed The Most People In History | 43.4M | 24:57 | — | — | — | — | 22:42 |
| 7 | [lemmino](lemmino.md) | Cicada 3301: An Internet Mystery | 42.5M | 17:53 | 136 | 27.4 | 0:51 | 4 | 0:42 |
| 8 | [veritasium](veritasium.md) | The Biggest Chemical Coverup In History | 37.1M | 54:08 | 165 | 29.2 | 0:17 | 13 | 5:24 |
| 9 | [kurzgesagt](kurzgesagt.md) | The Largest Star in the Universe – Size Comparison | 35.8M | 11:59 | 148 | 26.7 | 0:53 | — | 6:35 |
| 10 | [kurzgesagt](kurzgesagt.md) | The Fermi Paradox — Where Are All The Aliens? (1/2) | 35.4M | 6:20 | 167 | 23.8 | 0:29 | — | 2:17 |
| 11 | [neo](neo.md) | Why Dubai's Man-Made Islands Are Still Empty | 34.8M | 10:56 | 137 | 78.1 | 0:19 | 5 | 4:28 |
| 12 | [vox](vox.md) | Why no aquarium has a great white shark | 32.8M | 5:54 | 171 | 25.0 | 0:08 | 5 | 4:50 |
| 13 | [lemmino](lemmino.md) | The Vanishing of Flight 370 | 30.0M | 24:54 | 138 | 25.8 | 3:39 | — | 3:59 |
| 14 | [vox](vox.md) | Inside Hong Kong’s cage homes | 27.3M | 9:53 | 129 | 43.1 | 0:49 | 5 | 6:49 |
| 15 | [lemmino](lemmino.md) | The Search For D. B. Cooper | 24.4M | 29:26 | 160 | 34.8 | 0:30 | 7 | 29:09 |
| 16 | [reallifelore](reallifelore.md) | How North Korea Finally Made It Impossible to Escape | 21.0M | 26:35 | — | — | — | 13 | 23:07 |
| 17 | [fern](fern.md) | The Kids Who Hacked The CIA | 20.1M | 23:05 | 164 | 38.1 | 0:26 | 9 | 15:00 |
| 18 | [kurzgesagt](kurzgesagt.md) | AI Just Crossed the Terrifying Line - Now What? | 17.9M | 21:44 | 152 | 19.4 | 0:49 | — | — |
| 19 | [johnnyharris](johnnyharris.md) | Why People Think The Government Killed JFK | 17.4M | 28:17 | 176 | 26.6 | 0:39 | 6 | 9:36 |
| 20 | [fern](fern.md) | The Hunt for the King of the Dark Web | 16.8M | 18:50 | 152 | 20.0 | 2:15 | 4 | 18:27 |
| 21 | [neo](neo.md) | How the CIA Found Osama bin Laden | 16.2M | 16:08 | 137 | 18.6 | 1:47 | — | 5:10 |
| 22 | [fern](fern.md) | How an FBI Agent Infiltrated the KKK | 15.2M | 41:05 | — | — | — | — | 9:26 |
| 23 | [economicsexplained](economicsexplained.md) | MIT Has Predicted that Society Will Collapse in 2040 / Economics Explained | 14.5M | 18:02 | — | — | — | 10 | 10:28 |
| 24 | [neo](neo.md) | How the US President Travels | 14.4M | 10:40 | — | — | — | — | 7:54 |
| 25 | [wendover](wendover.md) | Cities at Sea: How Aircraft Carriers Work | 14.1M | 11:54 | 191 | 57.5 | 1:42 | 10 | 11:46 |
| 26 | [johnnyharris](johnnyharris.md) | The REAL Reason McDonalds Ice Cream Machines Are Always Broken | 13.6M | 29:45 | 183 | 42.4 | 0:22 | 11 | 8:37 |
| 27 | [neo](neo.md) | The Genius Design of Apple Park | 12.8M | 18:11 | — | — | — | — | — |
| 28 | [wendover](wendover.md) | China's Geography Problem | 12.7M | 10:50 | 168 | 17.2 | 0:18 | 9 | 4:07 |
| 29 | [coldfusion](coldfusion.md) | Theranos – Silicon Valley’s Greatest Disaster | 12.7M | 24:38 | 175 | 30.2 | 0:28 | 11 | 8:07 |
| 30 | [wendover](wendover.md) | The US President's $2,614 Per Minute Transport System | 12.2M | 12:03 | 178 | 39.5 | 0:56 | 10 | 11:26 |
| 31 | [wendover](wendover.md) | The Economics of Airline Class | 12.2M | 11:37 | 166 | 25.6 | 0:19 | 6 | 1:30 |
| 32 | [magnatesmedia](magnatesmedia.md) | The Secret Chinese Company That Owns Everything | 12.1M | 1:18:46 | 195 | 20.1 | 0:15 | 12 | — |
| 33 | [johnnyharris](johnnyharris.md) | What happens if China invades Taiwan? | 11.6M | 21:34 | — | — | — | — | 7:58 |
| 34 | [fern](fern.md) | The Death of Educational Content on YouTube | 10.9M | 28:11 | 173 | 31.5 | 1:38 | — | 5:38 |
| 35 | [bloomberg](bloomberg.md) | The Race to Harness Quantum Computing's Mind-Bending Power / The Future With Hannah Fry | 9.6M | 24:02 | — | — | — | — | 20:54 |
| 36 | [johnnyharris](johnnyharris.md) | Why Switzerland Has 374,142 Bunkers (and likely more) | 9.6M | 29:22 | 142 | 20.1 | 2:20 | 14 | 23:12 |
| 37 | [lemmino](lemmino.md) | The Unbreakable Kryptos Code | 9.3M | 47:01 | 153 | 24.3 | 0:12 | 13 | 23:58 |
| 38 | [coldfusion](coldfusion.md) | The FTX Disaster is Deeper Than you Think | 8.8M | 29:40 | 161 | 39.8 | 0:15 | 14 | — |
| 39 | [coldfusion](coldfusion.md) | Enron - The Biggest Fraud in History | 8.7M | 19:04 | 158 | 31.1 | 0:06 | 12 | 15:03 |
| 40 | [johnnyharris](johnnyharris.md) | The Problem With Elon Musk | 8.6M | 42:46 | — | — | — | — | 26:05 |
| 41 | [neo](neo.md) | Why Saudi Arabia Is Building a Linear City | 8.6M | 15:21 | 122 | 43.1 | 4:48 | 8 | 13:48 |
| 42 | [fern](fern.md) | Why the U.S. President Is Almost Impossible to Kill | 8.0M | 27:12 | 150 | 40.3 | 0:48 | — | 14:09 |
| 43 | [moon](moon.md) | TikTok Is Worse Than You Thought | 8.0M | 32:42 | — | — | — | 12 | 18:18 |
| 44 | [wendover](wendover.md) | Why There are Now So Many Shortages (It's Not COVID) | 7.8M | 19:46 | 158 | 21.1 | 0:37 | 12 | 7:07 |
| 45 | [magnatesmedia](magnatesmedia.md) | The Disturbing History of Coca-Cola | 7.6M | 33:50 | 176 | 15.4 | 0:05 | 7 | 19:37 |
| 46 | [polymatter](polymatter.md) | Zimbabwe’s Currency Crisis: the worthless $100 trillion bill | 7.6M | 11:28 | — | — | — | — | 1:01 |
| 47 | [coldfusion](coldfusion.md) | Who Controls All of Our Money? | 7.3M | 21:33 | 174 | 52.3 | 2:05 | 14 | 10:59 |
| 48 | [hoog](hoog.md) | Why Amsterdam is Building a New Red Light District | 6.9M | 13:25 | 161 | 14.9 | 1:07 | 9 | 12:13 |
| 49 | [magnatesmedia](magnatesmedia.md) | Why Netflix is Collapsing: The Truth About Netflix's Empire | 6.6M | 1:08:34 | 194 | 15.6 | 0:04 | 13 | 18:30 |
| 50 | [coldfusion](coldfusion.md) | How to Lie Your Way to $34 Billion [Nikola Motors Fraud] | 6.4M | 25:50 | 167 | 29.5 | 1:02 | 10 | 15:45 |
| 51 | [magnatesmedia](magnatesmedia.md) | The Most Illegal Business In The World: Silk Road | 6.0M | 44:31 | 214 | 21.6 | 0:39 | 11 | 7:34 |
| 52 | [hoog](hoog.md) | The Evil Design of Japan's Death Penalty | 5.9M | 9:54 | — | — | — | 4 | 6:43 |
| 53 | [fern](fern.md) | The Bank Heist of the Century | 5.8M | 22:33 | 163 | 35.5 | 0:07 | — | 9:01 |
| 54 | [polymatter](polymatter.md) | Apple's Money Problem (& Why It Won't Buy Netflix) | 5.8M | 8:04 | 174 | 13.3 | 0:18 | 10 | 1:31 |
| 55 | [moon](moon.md) | Dubai Is Everything Wrong With Society | 5.3M | 16:47 | — | — | — | 8 | 2:10 |
| 56 | [magnatesmedia](magnatesmedia.md) | How WhatsApp Makes Money: The INSANE Story of WhatsApp | 5.3M | 30:22 | 148 | 36.8 | 0:24 | 11 | 20:20 |
| 57 | [economicsexplained](economicsexplained.md) | How the World's Richest Country Lost 90% of its GDP | 5.3M | 14:16 | — | — | — | 7 | — |
| 58 | [polymatter](polymatter.md) | How North Korea Makes Money | 5.1M | 13:02 | 154 | 37.4 | 0:51 | — | 8:04 |
| 59 | [bloomberg](bloomberg.md) | How Singapore Got So Crazy Rich | 4.9M | 7:01 | 129 | 95.1 | 0:06 | 6 | 2:39 |
| 60 | [hoog](hoog.md) | youtube video #FRdeyrfhVIg | 4.7M | 31:00 | — | — | — | 15 | 7:45 |
| 61 | [polymatter](polymatter.md) | Why 50 Million Chinese Homes are Empty | 4.5M | 12:30 | 144 | 25.3 | 0:12 | 6 | 12:00 |
| 62 | [bloomberg](bloomberg.md) | How China's 'Perfect' Spy Got Caught / Bloomberg Investigates | 4.3M | 25:39 | 132 | 42.9 | 2:37 | 17 | 18:12 |
| 63 | [polymatter](polymatter.md) | Why Costco is Cheaper than Amazon | 4.2M | 8:57 | 151 | 16.6 | 0:56 | 2 | 8:19 |
| 64 | [moon](moon.md) | BlackRock: The Most Evil Business In The World | 4.2M | 15:39 | 204 | 24.4 | 0:48 | 8 | 7:58 |
| 65 | [moon](moon.md) | How Instagram Changed Society Forever | 3.7M | 23:41 | 216 | 12.1 | 0:02 | — | 13:44 |
| 66 | [vox](vox.md) | Why China is winning the EV war | 3.4M | 8:37 | 170 | 49.3 | 0:42 | — | 6:32 |
| 67 | [bloomberg](bloomberg.md) | This Is How Huawei Shocked America With a Smartphone | 3.2M | 7:57 | — | — | — | 5 | 3:48 |
| 68 | [hoog](hoog.md) | The $41 Billion Plan for Tokyo | 3.0M | 12:43 | 146 | 13.4 | 0:20 | 8 | 2:47 |
| 69 | [fern](fern.md) | The Scariest Building in Europe | 2.7M | 24:50 | 153 | 29.4 | 0:16 | — | — |
| 70 | [vox](vox.md) | Why can’t prices just stay the same? | 2.5M | 7:30 | 174 | 17.9 | 0:20 | — | 3:50 |
