# Other animated channels and recent outliers

Shorter notes on animated channels that show a specific transferable trick, the **dated
last-12-month outliers** across every channel we pulled, and a **wider discovery pass** for 2025–26
breakout animated channels outside our original list.

Labels: **[data]** our yt-dlp pulls on 2026-11-05 (CSV files in `data/`) · **[observed]**
thumbnails we looked at · **[recall]** · **[inferred]**.

## How "last 12 months" is measured now

The first pass used "the newest 40 uploads", because the flat pull has no dates. That window was
wrong for slow channels (OverSimplified's newest 30 span eight years). This pass re-pulled the
newest 60 uploads of every channel with yt-dlp's `--extractor-args youtubetab:approximate_date`,
which turns YouTube's relative labels ("3 months ago") into approximate dates. **Strictly inside
12 months** = labelled in weeks, days or "N months ago"; "1 year ago" (12–23 months) is outside.
Approximate dates are month-accurate inside a year and year-accurate beyond it. Per-channel output:
`data/derived/outliers-last-12-months.txt`. Caveat: a video posted 3 weeks ago has had 3 weeks to
collect views; a ×median figure understates recent uploads.

## Last-12-month animated outliers (≥ 2× the channel's in-window median) [data]

| Channel | In-window uploads · median | Views | ×med | Length | ~Date | Title | What made it pop [inferred] |
|---|---|---|---|---|---|---|---|
| Kurzgesagt | 23 · 5.7M | 23M | 4.0 | 21:44 | 2026-10 | AI Just Crossed the Terrifying Line - Now What? | A dated news event told as a thriller |
| Kurzgesagt | | 21M | 3.7 | 15:14 | 2026-10 | This Woman Cured Her Cancer with an Insane Method | One person's story plus "insane" |
| AsapSCIENCE | 15 · 620K | **8.6M** | **13.9** | 4:58 | 2026-10 | Nobody has EVER seen an El Niño like this | A live news hook + "never before" |
| AsapSCIENCE | | 3.1M | 5.0 | 7:10 | 2025-12 | What your ball size says about you | Body + "says about you" |
| Epic History | 20 · 654K | 4.2M | 6.4 | 8:54 | 2026-09 | Alexander's Speech That Crushed a Mutiny | Famous name + one decisive moment |
| The Infographics Show | 60+ · 495K | 4.3M | 8.7 | 20:02 | 2026-10 | The AI bubble is about to pop... | Named news + urgency (see `infographics-show.md`) |
| The Infographics Show | | 2.7M | 5.5 | 18:08 | 2026-10 | What Lethal Radiation Does to Your Body (Hour by Hour) | Body + clock |
| TED-Ed | 60+ · 377K | 4.5M | 11.9 | 5:26 | 2026-10 | 4 ways to fix your attention span | Self-help utility |
| TED-Ed | | 3.4M | 9.0 | 5:22 | 2026-06 | What toys have kids played with throughout history? | Nostalgia + history |
| Simple History | 60+ · 200K | 3.0M | **15.0** | 9:28 | 2026-02 | Why the Americans were so feared by The Japanese | The other side's view of a famous war |
| Simple History | | 1.3M | 6.5 | 11:11 | 2026-03 | Why all the F-14 Tomcats were Shredded | A famous object + a surprising fate |
| MinuteEarth | 26 · 371K | 3.0M | 8.1 | 3:13 | 2026-09 | Why Are Some People Mosquito Magnets? | Personal, "is it me?" |
| MinuteEarth | | 2.5M | 6.7 | 12:42 | 2025-12 | ALL THE CATS, EXPLAINED | A complete sweep of a beloved category |
| What If | 49 · 495K | 2.6M | 5.3 | 25:12 | 2026-07 | If All Humans Vanished, How Long Until Earth Erased Every Trace Of Us? | A deep-time clock |
| Sam O'Nella | 4 · 1.4M | 3.5M | 2.5 | 22:57 | 2026-09 | Pliny Explains it All 2: MAN | A famous ancient book, deadpan |
| Johnny Harris (live-action + animated maps) | 22 · 3.1M | 7.9M | 2.5 | 186:18 | 2026-04 | The Modern Middle East, Explained | The giant sweep |
| Kings and Generals | 60+ · 243K | 877K | 3.6 | 55:57 | 2026-09 | Sudan's Three Civil Wars Explained | A live war, explained from the start |
| MinutePhysics | 12 · 405K | 1.3M | 3.2 | 4:44 | 2026-08 | Strings Don't Vibrate The Way You Think | Correcting what you think |
| Not Just Bikes | 18 · 636K | 1.9M | 3.0 | 29:00 | 2026-10 | They Finally Built Good Transit!? | |

**No upload strictly inside 12 months:** OverSimplified, CGP Grey. **Too few to judge (≤ 4):**
melodysheep, Primer, Jared Owen, Animagraffs, Zack D. long-form (compilations), Sam O'Nella. "60+"
means all 60 of the newest uploads fall inside the window, so the window was sampled, not covered.

**Corrections to the first pass's table:** Zack D.'s Balloonfest, Pepsi and Toyota videos are
3–4 years old; OverSimplified's Punic Wars, Primer's *Catch A Cheater*, CGP Grey's *Runways*, History
Matters' *Castro/Guantanamo* (2.4M) and Kurzgesagt's *SOUTH KOREA IS OVER* are all 12–23 months old
or older. They remain good examples, but not 12-month outliers.

## Discovery pass: animated channels outside our list (2026 uploads, sorted by views) [data]

**Method.** Ten YouTube searches through yt-dlp, each filtered to **"this year" and sorted by view
count** (`sp=CAMSBAgFEAE=`): *animated history*, *animated documentary*, *history animation
explained*, *animated explainer*, *3d animation how it works*, *animated story true*, *what if
animation*, *historical event animated*, *disaster explained animation*, *animated war
documentary*. 515 unique videos (`data/discovery_search_2026.csv`). We dropped trailers, kids' TV,
fan animation, music and Hindi-language horror-story channels, then pulled the full catalogue of
each remaining animated-explainer channel (`data/discovery_*.videos.csv`).

| Channel | Subs | Videos | Catalogue median | Last 12 mo: n · median | Top 2026 hit | Note |
|---|---|---|---|---|---|---|
| **Yarnhub** | 3.4M | 241 | 2.2M | **35 · 3.4M** | *Wake Island: The Last Stand That Stunned Japan* 16M (~2026-09) | 3D-animated WW2 and air-combat stories, 12–17 min. *When F-16 Falcons Ate Hawks for Breakfast* 32M and *Midway From The Japanese Perspective* 18M are 1–2 years old. **The live benchmark for animated famous-event history** |
| **Ink Explainer** | 162K | 20 | 300K | 20 · 300K | ***What Did Ancient Humans Actually Do All Day?* 18M** (~2026-09) | A channel under 6 months old; **60× its median** on one title. Crude cartoon cavemen, 1–3 yellow words |
| **Zenn** | 199K | 39 | 30K | 39 · 30K | *What Did Ancient Humans Do at Night?* 8.1M (~2026-05) | Same "ancient humans' daily life" question, started ~2026-04 |
| **The Scribble Scholar** | 110K | 112 | 60K | 111 · 50K | *How Every Infamous Dictator Died* 10M (~2026-03) | "How every [famous group] died" sweep |
| **Historically** | 1.63M | 23 | 2.3M | 8 · 2.7M | *The ENTIRE History of ROME [No AI]* 10M (~2026-05), *…CHINA [No AI]* 8.5M | **"[No AI]" in the title as proof of craft** |
| Good Enough | 1.58M | 33 | 2.1M | 8 · 1.7M | *The 5 Times the World Ended* 7.0M (~2026-04) | Superlative lists |
| Serious History | 863K | 60 | 1.15M | 18 · 820K | *Extreme Vigilante Justice in History* 7.6M (~2026-03) | "…in History" lists |
| Simple Paint | 545K | 138 | 430K | 98 · 320K | *The Worst Mistakes Humans Ever Made* 3.8M (~2026-02) | "The worst [X] deaths ever", ~daily |
| IMPERIAL | 532K | 30 | 740K | 3 · 880K | *The Most Famous Killing in History* 5.2M (~2026-04) | Famous-event essays |
| The Last Day | 35K | 23 | 140K | 23 · 140K | *Nepal's 2026 Disaster Explained: The Glacier That Wiped Out a Valley* 5.1M (~2026-09) | **A 2026 news disaster, animated, 19 min, on a channel about 3 months old** |
| Ifverse | 60K | 16 | 140K | 16 · 140K | *What If Your Reaction Time Was 10x Faster?* 4.6M (~2026-10) | Brand-new second-person what-ifs |
| Stargaze | 611K | 148 | 200K | 25 · 460K | *What If a Black Hole Entered Our Solar System? (Simulation)* 4.7M | 3D space simulations |

**What the discovery pass adds:**
1. **Brand-new channels can break out on one title.** Ink Explainer (under 6 months, 18M), Zenn,
   The Scribble Scholar, Ifverse and The Last Day all had a 4–18M hit within months of starting.
   The common factor is a **universal, concrete question about famous people or everyday human
   life** (*What did ancient humans actually do all day?*, *How every infamous dictator died*), not
   production polish.
2. **"Actually" and "every" are doing the work**: a correction of what you assume, or a complete
   sweep you can't stop halfway through.
3. **A live 2026 disaster, animated, can do 5M on a tiny channel** (The Last Day, Nepal). News +
   animation works if it's quick.
4. **Anti-AI proof is now a title element** ("[No AI]", Historically, 8–10M). The audience is
   asking for proof of human craft (see README §4, proof).
5. **Yarnhub is the closest live comparison for ep10's genre**: famous war, one narrow door, 3D
   animation, 12–17 min, no-text thumbnails.

The search is US-biased and limited to 60 results per query, so channels in other languages are
under-sampled (Ridddle's Ukrainian channel is a reminder they exist).

---

## CGP Grey [data · observed]
7.05M subscribers · 149 videos · **median 6.7M** · no upload in the last 12 months.

| Views | Length | Title |
|---|---|---|
| 44M | 4:30 | Traffic Has a Perfect Solution. Humans Are the Problem. |
| 37M | 8:28 | The Fastest Way to Board a Plane Feels Like the Slowest |
| 37M | 4:42 | The US-Canada Border Is 5,500 Miles of Pure Nonsense |
| 34M | 5:09 | You Can Never Become Pope |
| 26M | 18:13 | Try to Rule Fairly and You'll Be Overthrown |
| 26M | 6:23 | The Secret Reason Horses Let Us Ride Them |
| 25M | 5:15 | The UK Is a Country Made of Countries |
| 22M | 9:27 | Pentagons Are Terrible at One Thing |
| 21M | 8:38 | The Royal Family Runs on Rules You've Never Heard Of |
| 21M | 4:30 | Watching This Video Disqualifies You From Jury Duty for Life |

**Opening, verbatim** (rosetta.to; estimated timing, README method): *Tumbleweeds Aren't From Here*
(14M, 6:42, 177 wpm of runtime) opens on the cliché image, "bouncing across a scene tumbleweed
established the Wild West as Western" (0 s), turns it into a life story told as a sacrifice ("to
intentionally starve themselves to die and to dry to catch the wind", ~28 s), then lands the twist
at ~55 s: "before the 1800s there were no homesteaders and no tumbleweed in the West tumbleweed are
an invasive species". **The famous image first, the reversal about it by ~1 min.** (*The Pirate
Captain Wasn't Really the Boss* transcribes at only 103 wpm of runtime, a sign of long music
passages or a partial transcript, so it isn't used.)

- **Title = a paradox or verdict in a full sentence**, often with a twist clause: "…Feels Like the
  Slowest", "…Humans Are the Problem", *Pentagons Are Terrible at One Thing*, *A4 Paper Is Too
  Perfect*, *Two Is the Wrong Number of Days Off*. No questions (3%). This is the strongest
  *statement* title style in the study.
- **Thumbnail** [observed]: very plain. A map with a route, stick figures with a yellow circle on
  one, a single bright red hexagon over the Giant's Causeway, a crowned stick figure with the
  hand-written arrow "you". **One annotation does all the work.**
- **Animation** [recall]: stick figures with glasses, flat icons, map animations, stock-photo
  cutouts, a fast talking-head-free monologue. **Simulations** (traffic, boarding) show the rule
  play out.
- **Take:** the statement title with a twist clause; **one hand-drawn annotation** in the
  thumbnail; simulate the system so the viewer *sees* the counterintuitive result.

## Sam O'Nella Academy [data · observed]
4.81M subscribers · 68 videos · **median 11M**.

| Views | Length | Title |
|---|---|---|
| 23M | 5:45 | Historical Misconceptions For You to Bring Up during Family Dinner |
| 20M | 7:49 | Tarrare, the Hungriest Man in History |
| 19M | 11:59 | The Presidential Assassination Nobody Talks About |
| 19M | 6:56 | Obscure Obsolete Inventions |
| 19M | 5:02 | Why It Sucked to Be a Pirate |
| 17M | 8:06 | Top 10 Worst Animal Skeletons |
| 17M | 7:33 | Why Produce Used to Suck |
| 17M | 7:46 | Pre-Industrial Surgeries |
| 17M | 4:15 | Dog Breed Deformities |
| 16M | 9:07 | Timothy Dexter: The Dumbest Rags-to-Riches Story |

No transcript was fetchable (not on rosetta.to).

- **A deliberately crude MS-Paint style:** the narrator's own long-haired stick avatar in every
  thumbnail, next to badly drawn historical figures. Big serif black text (WHY IT SUCKED TO BE A
  PIRATE) [observed].
- **Writing** [recall]: deadpan, absurdist asides, fast jokes per line. Obscure *people* with a
  superlative ("the Hungriest Man in History", "the Dumbest Rags-to-Riches Story").
- **Take:** *The [superlative] [person] in History* is a strong historical hook; deadpan beats
  polish. **Don't copy:** the avatar or the crude style.

## Primer [data · observed]
1.94M subscribers · 23 videos · median 1.8M.

| Views | Length | Title |
|---|---|---|
| 24M | 13:17 | Simulating the Evolution of Aggression |
| 15M | 10:00 | Simulating Natural Selection |
| 6.6M | 22:38 | How To Catch A Cheater With Math |
| 6.5M | 20:49 | Simulating the Evolution of Sacrificing for Family |
| 6.1M | 12:50 | Epidemic, Endemic, and Eradication Simulations |
| 4.8M | 12:22 | Simulating Supply and Demand |
| 4.6M | 15:00 | Simulating the Evolution of Rock, Paper, Scissors |
| 4.5M | 13:23 | Simulating Green Beard Altruism |
| 4.4M | 14:03 | Simulating alternate voting systems |
| 4.4M | 10:22 | Simulating Foraging Decisions |

**Openings, verbatim** (rosetta.to, estimated timing): both top videos open with **no hook at all**,
just a plain statement of the topic: "in this video we're going to start exploring conflict between
creatures…" (*Aggression*, 0 s); "this video is about natural selection" (*Natural Selection*, 0 s).
The rules are laid out by ~15–30 s ("food will appear each day and then blobs will appear and go
out to eat the food"). **Primer's hook is the simulation on screen, not the words**: the evidence
that a strong enough visual can carry a flat first line. Not a model for our narration.

- **3D blob creatures in a clean, grey studio space**, with on-screen labels and charts in thin
  serif text. The simulation *is* the visual: the viewer watches thousands of agents follow a
  rule and a pattern emerge [observed].
- **Take:** a rule-based **agent simulation in our Three.js engine** is a natively animated wow
  beat (crowds, markets, a panic) that no illustrator-led channel can match cheaply.
  **Don't copy:** the blob character design.

## AsapSCIENCE [data]
10.8M subscribers · 451 videos · median 2.3M.

| Views | Length | Title |
|---|---|---|
| 68M | 2:59 | Do You Hear "Yanny" or "Laurel"? (SOLVED with SCIENCE) |
| 65M | 3:05 | The Periodic Table Song (2018 Update!) |
| 44M | 1:15 | The Pi Song (Memorize 100 Digits Of π) |
| 37M | 2:54 | The Periodic Table Song |
| 32M | 7:50 | How To Fall Asleep In 2 Minutes |
| 29M | 2:06 | What Colour Is This Dress? (SOLVED with SCIENCE) |
| 27M | 3:09 | This Is 200 Calories |
| 24M | 3:00 | Is Masturbation Good For You? |
| 24M | 1:38 | How Old Are Your Ears? (Hearing Test) |
| 23M | 3:29 | What Happens When You Stop Smoking? |

**Viral-moment science** (the dress, Yanny/Laurel), **songs**, and **"This Is 200 Calories"**-style
direct demos. 40% of the top titles have a word in capitals. **Take:** react to the week's viral
argument with the definitive explainer, fast.

## Simple History · History Matters · The Armchair Historian · Kings and Generals · Epic History [data]

| Channel | Subs | Median | Top hit | Format note |
|---|---|---|---|---|
| Simple History | 5.12M | 987K | *Sniper Decoys: Dummy Heads* 23M | Flat 2D soldiers; one weird object or tactic per video; "Weird Weapons", "Strange Stories", "Cross Section" series |
| History Matters | 1.92M | 1.7M | *What Happened When Kamikaze Pilots Failed or Wimped Out?* 10M | **3–4 min "Why didn't X…?" puzzles** with "(Short Animated Documentary)" as a suffix |
| The Armchair Historian | 2.54M | 1.0M | *D-Day From the German Perspective* 8.4M | **The other side's perspective** on a famous event |
| Kings and Generals | 4.22M | 415K | *How Rome Conquered Greece* 20M (2 h) | Map-and-army-token animation; very long campaign documentaries |
| Epic History | 3.2M | 1.1M | *Alexander the Great (All Parts)* 29M | Map animation + 3D guides (*3D Guide to an 18th century Ship-of-the-Line* 8.5M) |

**Take:**
1. **The famous event from the unexpected side** ("…From the German Perspective").
2. **"Why didn't X happen?"**: a counterfactual puzzle about a famous moment.
3. **One weird object from a famous war** (sniper dummy heads).
4. **The "All Parts" compilation** as a second-life upload.
5. ~~The 3D cutaway guide as a format for us~~ (withdrawn: engineering cutaways are Jared Owen's
   and Animagraffs' territory, see `jared-owen-animagraffs.md`).

## Alternate History Hub [data]
2.49M subscribers · median 1.2M. Top: *History of the Fallout World (Lore)* 11M, *What if Germany
Won WWI?* 7.9M, *The Alternate Timeline Iceberg Explained* 7.4M. Recent hits: *The Only Way
Germany Could've Won WWII* (2.9M). **Counterfactuals about the most famous events.**
