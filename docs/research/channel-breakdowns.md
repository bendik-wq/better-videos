# Channel breakdowns: what the best documentary and explainer channels actually do

Twenty channels, one template each: packaging, title formulas, thumbnail grammar, cold open,
pacing, narration, music and sound, signature visuals, sponsors, what made the biggest videos
explode, and what we steal. It sits on top of `docs/research/retention-playbook.md` (the
MrBeast memo summary and YouTube's official rules) and `docs/fern-breakdown.md`; neither is
repeated here. The hook, script and edit rules distilled from these pages live in
`hooks.md`, `script-patterns.md` and `editing-library.md`.

Researched October 2026.

## How to read this file

Trust labels, as in the playbook, plus two new ones:

- **[data]**: our own pull of each channel's public video list (title, duration, views) with
  `yt-dlp --flat-playlist`, run on **2026-10-11**. View counts are YouTube's rounded figures.
  "Long-form" means ≥3:00. "Outlier ×" is views divided by the channel's median long-form views.
  Reproduce with the command in the appendix.
- **[primary]**: the creator or channel saying it themselves (their site, their posts, a Q&A).
- **[press]**: a journalist's reporting.
- **[practitioner]**, **[vendor]**, **[memo]**: as defined in the playbook.
- **[observed]**: our characterisation from watching the channel, with **no external source**.
  Treat pacing figures marked *est.* as estimates to check with a stopwatch (see "Gaps").

No public source reports average shot length for any of these channels except the MrBeast
"retention editing" figure below. YouTube videos can't be downloaded on this box, so we could not
measure cuts ourselves.

---

## 0. Cross-channel title data [data]

Top 25 long-form videos by views per channel (475 titles; Bloomberg Originals excluded because its titles carry series suffixes). Percent of titles matching each pattern.

| Channel | Median title chars | Starts "Why" | Starts "How" | Superlative | Number or $ | "You/Your" | Secret/Real/Truth | Impossible/Insane/Evil/Dark | "vs" | "?" | Colon |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MrBeast | 33 | 0% | 0% | 12% | **88%** | 16% | 4% | 0% | **28%** | 4% | 0% |
| Fern | 34 | 4% | 20% | 24% | 8% | 0% | 0% | 8% | 0% | 4% | 4% |
| Kurzgesagt | 49 | 12% | 4% | 20% | 4% | 8% | 4% | 0% | 0% | **28%** | 0% |
| LEMMiNO | **27** | 0% | 0% | 0% | 44% | 0% | 0% | 4% | 0% | 0% | 12% |
| Johnny Harris | 34 | 28% | 8% | 4% | 12% | 12% | 8% | 0% | 4% | 16% | 0% |
| Vox | 42 | 24% | 12% | 8% | 12% | 16% | 4% | 0% | 0% | 12% | 16% |
| MagnatesMedia | 43 | 8% | 8% | 8% | 4% | 0% | **36%** | 28% | 0% | 0% | **40%** |
| Wendover | 38 | 16% | 24% | 12% | 12% | 0% | 0% | 4% | 0% | 0% | 12% |
| PolyMatter | 37 | **40%** | 20% | 4% | 16% | 4% | 4% | 0% | 0% | 8% | 20% |
| Neo | 33 | 16% | **48%** | 4% | 8% | 0% | 0% | 0% | 0% | 0% | 0% |
| hoog | 32 | 28% | 8% | 24% | 4% | 8% | 4% | 12% | 0% | 4% | 4% |
| ColdFusion | 47 | 0% | 40% | 12% | 32% | 16% | 4% | 4% | 0% | 20% | 0% |
| Business Casual | **53** | 8% | 32% | 8% | 4% | 0% | 4% | 0% | 0% | 0% | **60%** |
| Moon | 37 | 12% | 12% | 8% | 8% | 20% | 0% | 8% | 0% | 12% | 16% |
| Veritasium | 39 | 8% | 4% | 16% | 8% | 12% | 4% | 4% | 0% | 16% | 0% |
| Mark Rober | 44 | 0% | 4% | 12% | 28% | 4% | 0% | 4% | 24% | 4% | 0% |
| RealLifeLore | 45 | 24% | 20% | 12% | 24% | 20% | 8% | 12% | 0% | **36%** | 4% |
| Hindsight | 42 | **40%** | 20% | 4% | 0% | 4% | 4% | 20% | 0% | 12% | 4% |
| Sam O'Nella | 31 | 8% | 0% | 8% | 4% | 8% | 0% | 0% | 0% | 0% | 4% |
| **All 475** | **39** | 14% | 14% | 10% | 16% | 7% | 4% | 5% | 2% | 9% | 10% |

What the table says:

1. **Median top title is 39 characters.** Our ≤50 rule is right; aim for 30–45.
2. **There is no one formula.** Each channel owns one or two and repeats them (Neo "How…",
   PolyMatter and Hindsight "Why…", MrBeast "$X", Moon "…Tried To Warn You"). A recognisable
   formula is a brand asset. Pick ours and repeat it.
3. **Colons look like a weak-channel tell.** The two channels with the most colons (Business Casual
   60%, MagnatesMedia 40%) are both in the bottom four for median views per video in this set
   (0.58M and 0.17M). That's a correlation, not proof, but colons do read as a lecture title.
   Fern, Neo, Veritasium and MrBeast almost never use them.
4. **"Explained" is nearly dead** outside Kurzgesagt's older catalogue and Johnny Harris (2% overall).

### Outliers: biggest video versus channel median [data]

| Channel | Median long-form views | Biggest outliers (× median) |
|---|---|---|
| MrBeast | 15M | $456,000 Squid Game In Real Life! (65×); $1 vs $500,000 Plane Ticket! (40×) |
| MagnatesMedia | 0.17M | The Secret Chinese Company That Owns Everything (71×); The Disturbing History of Coca-Cola (45×) |
| Hindsight | 0.19M | Why living in Canada has become Impossible (36×) |
| Vox | 1.2M | Proof of evolution that you can find on your body (32×); Why no aquarium has a great white shark (27×) |
| ColdFusion | 0.66M | Three Men Lost in Space – The Apollo 13 Disaster (26×); Theranos – Silicon Valley's Greatest Disaster (18×) |
| Veritasium | 5.7M | Why Are 96,000,000 Black Balls on This Reservoir? (20×) |
| RealLifeLore | 3.0M | The Ocean is Way Deeper Than You Think (17×) |
| LEMMiNO | 2.8M | Cicada 3301: An Internet Mystery (15×) |
| Neo | 2.3M | Why Dubai's Man-Made Islands Are Still Empty (15×) |
| Moon | 0.62M | TikTok Is Worse Than You Thought (13×) |
| hoog | 0.66M | Why Amsterdam is Building a New Red Light District (10×) |
| Business Casual | 0.58M | How Rockefeller Built His Trillion Dollar Oil Empire (10×) |
| Bloomberg Originals (latest 600) | 0.23M | The Race to Harness Quantum Computing's Mind-Bending Power (41×); Inside OpenAI's Stargate Megafactory with Sam Altman (28×) |
| Kurzgesagt | 11M | The Coronavirus Explained & What You Should Do (8×) |
| PolyMatter | 0.91M | Zimbabwe's Currency Crisis: the worthless $100 trillion bill (8×) |
| Johnny Harris | 3.0M | Why People Think The Government Killed JFK (6×) |
| Wendover | 2.25M | Cities at Sea: How Aircraft Carriers Work (6×) |
| Fern | 3.9M | Mapping the Trump Shooting (5×); The Kids Who Hacked The CIA (5×) |
| Mark Rober | 41M | World's Largest Jello Pool (5×) |
| Sam O'Nella | 12M | Historical Misconceptions For You to Bring Up during Family Dinner (2×) |

**Five reasons videos explode, from the outliers [data + house analysis]:**

1. **One absurd, concrete object with a number on it.** 96,000,000 black balls; a $100 trillion
   bill; a jello pool; empty man-made islands. The image and the question are the same thing.
2. **A belief the viewer already holds, reopened.** "Why People Think The Government Killed JFK",
   "Historical Misconceptions", "Worse Than You Thought", "Way Deeper Than You Think". The viewer
   arrives with an opinion, which is a pre-built open loop.
3. **Timeliness plus the best explainer.** Coronavirus (Kurzgesagt, March 2020), Mapping the Trump
   Shooting (Fern, 6 min), Squid Game (MrBeast, two months after the show). Speed plus quality.
4. **A villain or disaster with a known name.** Theranos, Apollo 13, FTX, Enron, Coca-Cola, the
   "Secret Chinese Company". Rise-and-fall with a fall everyone has half-heard about.
5. **"Familiar but unexpected" metaphors.** "Cities at Sea" (aircraft carriers), "Proof of
   evolution … on your body", "The Kids Who Hacked The CIA". A known frame with one twist.

---

## 1. MrBeast

**Top videos by views [data]** (median long-form 15M, 624 long-form videos):

| Views | Length | Title |
|---|---|---|
| 972M | 25:42 | $456,000 Squid Game In Real Life! |
| 602M | 10:31 | $1 vs $500,000 Plane Ticket! |
| 583M | 15:37 | $1 vs $100,000,000 Car! |
| 576M | 14:47 | $1 vs $1,000,000,000 Yacht! |
| 564M | 17:44 | Last To Leave Circle Wins $500,000 |
| 549M | 19:42 | $10,000 Every Day You Survive In A Grocery Store |
| 530M | 20:45 | 7 Days Stranded On An Island |
| 494M | 41:27 | 50 YouTubers Fight For $1,000,000 |

### The production memo, in depth [memo]

"How to succeed in MrBeast production" is a 36-page onboarding document that leaked in September
2024. **Its authenticity has never been confirmed**
([Tubefilter](https://www.tubefilter.com/2024/09/17/mrbeast-internal-production-guide-leaked-key-points/),
[creatorhandbook](https://www.creatorhandbook.net/leaked-document-allegedly-reveals-mrbeasts-secrets-to-youtube-success-the-key-takeaways/)).
Full text: [alexanderjarvis.com](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/).
The playbook §2 has a 10-point summary. This is the deeper read, organised for documentary use.

**Goal and metrics.**
- "Make the best YOUTUBE videos possible." The document explicitly rejects the TV and Hollywood
  production pipeline ([Tubefilter](https://www.tubefilter.com/2024/09/17/mrbeast-internal-production-guide-leaked-key-points/)).
- Three numbers run the company: **CTR, AVD, AVP**. Example: 100M impressions and 10M clicks is a
  10% CTR. Two similar-length videos got 120M and 45M views; the bigger one held viewers
  **about 1:38 longer on average**.
- Average length of the last 100 videos: 81,801 s in total, about **13:37 each**. Shorter suits
  real-time or emotional content, longer suits spectacles.

**Packaging binds the content.**
- Title and thumbnail set the expectation. If the thumbnail shows a yellow castle and the video
  has a red one, or the "World's Largest" is ordinary, viewers feel cheated and leave.
- Extreme beats mild: "Bananas Are The Worst Food On Earth" over "I Don't Like Bananas";
  "I Survived" over "I Spent"; "50 Hours In Ketchup" over "50 Hours In My Front Yard".
- Every staff member must know their video's title and thumbnail.

**Minute by minute.**
- **Minute 1**: "This is why we freak out so much about the first minute." In one example, 60M
  people clicked and **about 21M were gone within the first minute**. Fixes: good lighting at the
  start, match the thumbnail's promise, plan exactly what is said, front-load the interesting part.
- **Minutes 1–3**: move from hype to execution. "Stop telling people what they will be watching
  and start showing them." Show "crazy progression" early (several days of a survival story in
  the first minutes). Put a **re-engagement at about 3:00**: something that makes viewers think
  only this channel could do it.
- **Minutes 3–6**: the most exciting content that is still simple, with quick scene changes. The
  goal is attachment to the story and the people. Viewers who reach the halfway point very likely
  finish. **Another re-engagement at about 6:00**, which can need more setup and should push the
  story forward.
- **After 6:00, the "lull"**: viewers are watching without deciding to. Slower, weaker material can
  live here, but "many videos were killed by poor back halves". Don't signal the ending early,
  except to build hype for the payoff. Long explanations and surprises go here.
- **Ending**: "The video endings must always be abrupt to protect retention."

**Devices.**
- **Stair-stepping**: stakes rise in steps toward a payoff. "I Bought The World's Largest
  Firework": $1, $10, $50, $375, $1,000, $10,000, then the world record.
- **Wow factor**: "Anything that no other youtuber can do." In "100 Days in the Circle", a house is
  craned in about 30 s into the video. The memo admits this is "data-illogical" but says the
  impression is worth it.
- **Formats with an answer at the end** ("last to leave", chases) hold viewers. Don't run the same
  format back to back.
- **Simplicity**: "The simpler the better." It has to be understood by a huge audience.
- **"No dull moments"** and "You can't fake intensity."
- **Know your minute**: "you must always know what minute mark the content you are working on is."
- **Consultants are "cheat codes"**: call the person who built the previous record holder before
  you build yours. For us: an expert read of the script is the cheapest wow factor available.
- **"Creativity saves money"**: a $20,000 gaming prize becomes a year of Doritos (about 1,825 bags
  at about $1). For us: a clever visual metaphor beats a costly 3D build.
- **"BRAND DEALS ARE CONTENT!"**: old scripted reads produced a retention "crater"; integrated
  deals made a much smaller dip. A former sponsor's CEO reportedly said the return was 1.7× an NFL
  championship ad.

### The editors, the 2024 slow-down, and Chucky

- **Retention editing, measured.** Video editor Dara Pesheva told reporters that the style cuts
  **every 1.3–1.5 seconds**, with most shots under 2 s, plus loud effects and flashing
  ([Gigazine](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end)) [press].
  This is the only reported cut rate for any channel in this file.
- **MrBeast then slowed down.** March 2024, on X: "This past year i've slowed down our videos,
  focused on story telling, let scenes breathe … yelled less, more personality, longer videos";
  "lets get rid of the ultra fast paced/overstim era of content"; "It doesn't even work"
  ([Gigazine](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end)) [primary, via press].
  "Survived 7 Days in an Abandoned City" is his cited example: longer shots, fewer flashing elements.
- **Mario Joos** (former MrBeast retention editor): "It's not the cutting speed, it's the speed at
  which you introduce progressive novel information." Also: "Structural context is god-like as a
  strategy"; one joke per segment; and the originality test, "Can another smart person without
  doing research replicate this content?"
  ([Vidpros](https://vidpros.com/retention-editing-what-you-can-learn-from-mario-joos/)) [practitioner, via vendor].
- **Chucky (Charles Appleby)**: MrBeast's thumbnail and title lead since about 2019, and
  co-founder of Viewstats ([The Ringer](https://www.theringer.com/2026/03/09/pop-culture/youtube-face-thumbnails-history-explained)) [press].
  - "Could a grandma understand this? Could a kid understand this?"
  - "Make your thumbnail easy to understand." Designing full-screen in Photoshop hides how small
    it really is; check it at feed size.
  - "Trust is what makes people come back and click on your videos." Deliver what the thumbnail
    promised, early ([Social Media Today](https://www.socialmediatoday.com/news/youtube-shares-insights-mrbeasts-team-creates-compelling-thumbnail/709817/)) [press].
  - The team explores **about 50 thumbnail and title concepts per video**, and decides the package
    before shooting ([Social Media Today](https://www.socialmediatoday.com/news/youtube-shares-insights-mrbeasts-team-creates-compelling-thumbnail/709817/), [win.gg](https://win.gg/mrbeasts-thumbnail-creator-reveals-strategy/)).
  - A mouth-closed versus mouth-open test across about 30 videos gave a small but consistent
    watch-time win. MrBeast: "Every A/B test, less cringe expression won"
    ([The Ringer](https://www.theringer.com/2026/03/09/pop-culture/youtube-face-thumbnails-history-explained)).

### Craft summary

| Field | MrBeast |
|---|---|
| Title formulas | `$1 vs $X [Thing]!`; `Last To Leave [Place] Wins $X`; `$X Every Day You Survive [Place]`; `[N] Days [Stranded/In] [Place]`; `I Survived [Ordeal]` [data] |
| Thumbnail grammar | Jimmy's face (closed mouth since 2023), one giant hero object, saturated colour, a money number. Readable by "a grandma and a kid" [press] |
| Cold open | States the premise and the prize in the first sentence while showing it. No intro [observed] |
| Pacing | 1.3–1.5 s cuts in the 2020–23 style [press]; deliberately slower since 2024 [primary] |
| Narration | Host on camera, high energy, second person to contestants and viewer [observed] |
| Music and sound | Constant bed, risers into reveals, impact hits on money numbers [observed] |
| Signature visuals | Money counters, on-screen stakes text, aerial establishing shots of builds [observed] |
| Sponsors | Integrated into the challenge itself [memo] |
| Why the biggest exploded | Squid Game: a cultural moment, rebuilt for real, two months after the show, with a $456K prize. The "$1 vs $X" series: a stair-step format in the title itself [data + house] |

**Steal for faceless docs**: stair-step every chapter; a wow-factor reveal by 0:30 and by 3:00;
know the minute; abrupt endings; integrate the offer into the story; "progressive novel
information" instead of faster cuts.

---

## 2. Fern

Made by the team behind the German channel Simplicissimus; co-founder Jonas; described as
"armchair documentaries" combining research with animation
([Electrify](https://www.electrify.video/news/electrify-expands-into-investigative-journalism-with-partnership-in-leading-documentary-channels)) [press].
Narration is partly by hoog, who is credited in the channel bio
([CreatorDB](https://creatordb.app/creatorstats/fern-tv/)) [press, secondhand]. Production details
are in `docs/fern-breakdown.md`.

| Views | Length | Title |
|---|---|---|
| 21M | 6:12 | Mapping the Trump Shooting |
| 20M | 23:05 | The Kids Who Hacked The CIA |
| 16M | 18:50 | The Hunt for the King of the Dark Web |
| 15M | 41:05 | How an FBI Agent Infiltrated the KKK |
| 11M | 28:10 | The Hunt for America's Smartest Killer |
| 11M | 27:38 | The Kids Who Hacked Xbox |
| 10M | 28:11 | The Death of Educational Content on YouTube |
| 10M | 20:55 | The Biggest Nuke in History |

Median long-form 3.9M views; median length **19:21**, recent videos 20–50 min [data].

| Field | Fern |
|---|---|
| Title formulas | `The Hunt for [Villain]`; `The Kids Who Hacked [Institution]`; `How [Insider] Infiltrated [Group]`; `Mapping [Event]`; `[Company]'s Darkest Secret`; `Exposing a $[big number] [Industry] Company`; `Why Did [Country] Buy This $[number] [Object]?` [data] |
| Thumbnail grammar | One object in a black void, one key light, red annotation only (see fern-breakdown) [observed] |
| Cold open | In-medias-res reconstruction: a 3D crime scene or a moment of the act, then the narrator steps back [observed] |
| Pacing | Slow dollies and orbits, few hard cuts; *est.* 5–10 s shots, carried by camera motion [observed] |
| Narration | Calm, dry, understated; British/neutral English; the facts do the shouting [observed] |
| Music and sound | Ambient drone beds, very little score, sparse sound design [observed] |
| Signature visuals | Blender dioramas, evidence boards, CCTV frames, 3D maps with leader lines, red circles [observed] |
| Sponsors | Not verified for this file |
| Why the biggest exploded | Mapping the Trump Shooting: a 6-minute 3D reconstruction of a live news event, released fast. The Kids Who Hacked The CIA: underdog-versus-giant in four words [data + house] |

The channel's own "The Death of Educational Content on YouTube" (10M) argues that AI copycat
channels are cloning its look, per a third-party summary
([youtubesummary](https://youtubesummary.com/summary/-Gnrp_caPvo)) [unverified summary]. **Lesson:
the look alone is now cheap. Research, primary sources and reconstruction are the moat.**

---

## 3. Kurzgesagt

| Views | Length | Title |
|---|---|---|
| 89M | 8:35 | The Coronavirus Explained & What You Should Do |
| 54M | 7:49 | The Immune System Explained I – Bacteria Infection |
| 36M | 8:06 | The Egg - A Short Story |
| 36M | 6:03 | What If You Detonated a Nuclear Bomb In The Marianas Trench? |
| 35M | 11:59 | The Largest Star in the Universe – Size Comparison |
| 35M | 7:09 | The Deadliest Being on Planet Earth – The Bacteriophage |
| 35M | 6:21 | The Fermi Paradox — Where Are All The Aliens? (1/2) |
| 32M | 13:44 | The Largest Black Hole in the Universe - Size Comparison |

Recent titles have moved toward emotion and stakes: "AI Just Crossed the Terrifying Line - Now
What?" (17M), "This Woman Cured Her Cancer with an Insane Method" (21M), "GERMANY IS OVER" [data].

**Process [primary]** ([kurzgesagt.org](https://kurzgesagt.org/youtube/); "How to Make a Kurzgesagt
Video in 1200 Hours", [transcript](https://www.lingq.com/en/learn-english-online/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/)):
books and papers first, then experts check the facts; a public source sheet for every video;
**about a dozen script drafts**; "writing is the bottleneck"; about **200 illustrated panels** per
video, 2–3 illustrators for 8–12 weeks; Steve Taylor narrates every video and his VO sets the
animation timing; a bespoke score for each video by Epic Mountain; about **1,200 hours** per video.

| Field | Kurzgesagt |
|---|---|
| Title formulas | `What If [Extreme Hypothetical]?`; `The Largest [X] – Size Comparison`; `The Deadliest [X]`; `[Topic] Explained`; `Why [Grand Claim]`; `The Uncomfortable Truth About [X]` [data] |
| Thumbnail grammar | Flat vector, one bright subject on a dark field, the bird mascot, a few words at most [observed] |
| Cold open | A second-person scenario ("Imagine you…") or a one-line provocative question, under 20 s [observed] |
| Pacing | Something moves in every frame; a new illustration roughly every sentence (*est.* 3–5 s) [observed] |
| Narration | Warm, wry, plain English; jokes as relief valves; short sentences [observed] |
| Music and sound | A bespoke cinematic score per video, swelling into the "awe" beats [primary] |
| Signature visuals | Size-comparison zoom-outs, cross-sections, the bird characters, consistent colour language [observed] |
| Sponsors | Own shop products at the end; foundation funding disclosed [observed] |
| Why the biggest exploded | Coronavirus: the clearest explainer at the moment of peak global need. The size comparisons: a pure "zoom out" that pays off every few seconds [data + house] |

**Steal**: the source sheet; a dozen drafts; let the VO set the animation timing; the
"zoom out" ladder (`script-patterns.md` §2.8).

---

## 4. LEMMiNO

| Views | Length | Title |
|---|---|---|
| 42M | 17:54 | Cicada 3301: An Internet Mystery |
| 30M | 24:54 | The Vanishing of Flight 370 |
| 24M | 29:27 | The Search For D. B. Cooper |
| 16M | 69:09 | The Enduring Mystery of Jack the Ripper |
| 15M | 98:11 | The Kennedy Assassination: Inside the Book Depository |
| 13M | 30:44 | The Unknowns: Mystifying UFO Cases |
| 12M | 27:45 | Extraordinary Until Proven Otherwise |

**Process [primary]** ([3M Q&A](https://rosetta.to/u/lemmino/3-000-000-q-a),
[4M Q&A](https://rosetta.to/u/lemmino/4-000-000-q-a)): a bare-bones script of key points, then
fleshed out over weeks or months; days or weeks to track down obscure sources; narrates himself;
Premiere Pro, After Effects and Cinema 4D; decides a video is done when "the pacing and
presentation feel right" and all the major beats of the story are covered. Uploads are rare.

| Field | LEMMiNO |
|---|---|
| Title formulas | `The Vanishing of [X]`; `The Search for [Person]`; `The Enduring Mystery of [X]`; `[Name]: An Internet Mystery`. The shortest titles in the set (median 27 chars) [data] |
| Thumbnail grammar | One dark, evocative image; minimal or no text; muted palette [observed] |
| Cold open | Atmospheric and slow: a place, a date, a quiet fact, then the question. The "calm before" [observed] |
| Pacing | Slow, deliberate; long holds on documents and 3D scenes (*est.* 6–12 s) [observed] |
| Narration | Measured, precise, almost no adjectives; careful hedging on what is known versus claimed [observed] |
| Music and sound | Original ambient electronic score (he calls music "very much a hobby" [primary]) [observed] |
| Signature visuals | Clean Cinema 4D environments, minimalist UI typography, maps, archival documents [observed] |
| Sponsors | Patreon-funded; not verified for this file |
| Why the biggest exploded | Unsolved mysteries with an existing fan base and no definitive answer. The video becomes the reference work [house] |

**Steal**: the confidence to hold; epistemic precision ("what we know / what was claimed / what
remains") as a structural device, which is also our fact-safety pattern.

---

## 5. Johnny Harris

| Views | Length | Title |
|---|---|---|
| 17M | 28:17 | Why People Think The Government Killed JFK |
| 14M | 30:52 | The "Deep State" Explained |
| 14M | 18:43 | Why People Think the World is Flat |
| 13M | 29:46 | The REAL Reason McDonalds Ice Cream Machines Are Always Broken |
| 11M | 16:26 | The Worst War You Never Learned About, Mapped |
| 11M | 21:34 | What happens if China invades Taiwan? |
| 10M | 22:12 | Why Putin Feared Navalny |

Ex-Vox (the twice Emmy-nominated *Borders* series); stated ethos "curiosity over clicks and
stories over soundbites"; "a scrappy, visual-first approach"
([Adobe MAX](https://www.adobe.com/max/2025/sessions/scrappy-smart-and-human-the-future-of-storytelling-os558.html)) [primary].
Builds his maps in After Effects with GEOlayers and Mapbox styles
([summary of his tutorial](https://glasp.co/youtube/GsojLuJpe_0)) [primary, via summary]. Recent
uploads include 3-hour "explained" deep dives [data].

| Field | Johnny Harris |
|---|---|
| Title formulas | `Why People Think [Belief]`; `The REAL Reason [Everyday Annoyance]`; `[X], Explained`; `[X], Mapped`; `What happens if [Scenario]?`; `[X] is worse than you think` [data] |
| Thumbnail grammar | Johnny's face plus a map or object, a red arrow or circle, 1–3 words [observed] |
| Cold open | First-person curiosity ("I've been obsessed with…") over a map push-in or on-camera; the question by 0:30 [observed] |
| Pacing | Mixed: fast map and archive montages, then long on-camera stretches [observed] |
| Narration | Conversational first person; "I", "we", "you"; thinking out loud [observed] |
| Music and sound | Tense pulsing score, paper and projector sound effects on still photos [observed; [Motion Array](https://blog.motionarray.com/learn/premiere-pro/edit-documentary-in-premiere-pro/)] |
| Signature visuals | Animated maps, paper textures, photos on a desk, hand-drawn red annotation, projector frames [observed] |
| Sponsors | Read on camera by the host, about 2–5 min in [observed] |
| Why the biggest exploded | "Why People Think X" takes a belief the viewer already has an opinion on and explains it from the inside, without mocking it. Huge casual audience [house] |

---

## 6. Vox

| Views | Length | Title |
|---|---|---|
| 38M | 3:55 | Proof of evolution that you can find on your body |
| 32M | 5:54 | Why no aquarium has a great white shark |
| 27M | 10:19 | The Israel-Palestine conflict: a brief, simple history |
| 27M | 9:54 | Inside Hong Kong's cage homes |
| 23M | 6:00 | Why all world maps are wrong |
| 23M | 21:54 | The rise of Xi Jinping, explained |

**Process [press]** ([Nieman Lab / The Long Story](https://thelongstory.substack.com/p/why-the-best-journalists-on-youtube)):
Joe Posner's founding rule was "no desks"; make a video **only if the story has distinctly visual
elements** ("narration over stock footage doesn't qualify"); the style "combined data viz,
animation, sound design, expert interviews, and narration"; one person owns each video from
pitch to publish; videos grew from about 3 min to about 8 min. Alumni include Johnny Harris,
Joss Fong and Cleo Abram.

| Field | Vox |
|---|---|
| Title formulas | `Why [Surprising Absence or Fact]`; `How [X] [Does Y]`; `[Topic], explained`; `Proof of [Big Idea] that you can find on your body`; `Why all [X] are wrong` (sentence case) [data] |
| Thumbnail grammar | One clear image plus 1–3 words of text, often an annotated photo [observed] |
| Cold open | A concrete puzzling observation ("Look at your wrist…") or a strange fact, within 10 s [observed] |
| Pacing | Brisk explainer; graphics change every sentence (*est.* 3–6 s) [observed] |
| Narration | The correspondent in first person, conversational, sometimes on camera [observed] |
| Music and sound | Sound design as punctuation: paper slides, clicks, pops on each graphic [press, observed] |
| Signature visuals | Annotated archival, paper-cutout collage, data viz, highlighter marks [observed] |
| Why the biggest exploded | Proof of evolution "you can find on your body": a big abstract idea made personal and checkable in 4 minutes. Great white shark: the mystery of an absence [house] |

**Steal**: the "distinctly visual" kill rule, and sound design on every graphic.

---

## 7. MagnatesMedia

| Views | Length | Title |
|---|---|---|
| 12M | 78:46 | The Secret Chinese Company That Owns Everything |
| 7.7M | 49:33 | Rockefeller: The World's First Billionaire |
| 7.6M | 33:50 | The Disturbing History of Coca-Cola |
| 6.5M | 68:34 | Why Netflix is Collapsing: The Truth About Netflix's Empire |
| 6.0M | 44:32 | The Most Illegal Business In The World: Silk Road |
| 5.3M | 15:36 | The Homeless Teen Who Created Louis Vuitton |

Self-described "mini movies about business and money" (channel descriptions, via
[faceless.my](https://faceless.my/youtube/faceless-business-documentary-channels/)) [vendor]. Recent
titles push caps words: "The INSANE Truth About OpenAI", "Thomas Edison: The IDIOT Who Changed The
World", "The $47 Billion Cult" (2.0M) [data].

| Field | MagnatesMedia |
|---|---|
| Title formulas | `The [Secret/Disturbing/Evil] [History/Truth] of [Brand]`; `The [Underdog] Who Created [Brand]`; `[Founder]: The [Superlative]`; `The $[N] Billion [Cult/Scam]` [data] |
| Thumbnail grammar | A founder portrait or brand logo plus a dark mood, 1–3 words, red accents [observed] |
| Cold open | A dramatic moment late in the story (a raid, a collapse), then "but to understand how we got here…" [observed] |
| Pacing | Fast stock and film-clip montage with jokes; *est.* 2–4 s [observed] |
| Narration | British, conversational, sardonic asides, meme humour [observed] |
| Music and sound | Cinematic trailer music, comedic needle drops [observed] |
| Signature visuals | Stock and archival footage, film clips, newspaper headlines, simple motion graphics [observed] |
| Sponsors | Early read, usually tied to money or business tools [observed] |
| Why the biggest exploded | A hidden-power villain ("Secret Chinese Company That Owns Everything", 71×) that touches products the viewer uses daily [house] |

---

## 8. Wendover Productions

| Views | Length | Title |
|---|---|---|
| 14M | 11:54 | Cities at Sea: How Aircraft Carriers Work |
| 12M | 12:03 | The US President's $2,614 Per Minute Transport System |
| 12M | 11:38 | The Economics of Airline Class |
| 12M | 10:50 | China's Geography Problem |
| 11M | 12:13 | Living Underwater: How Submarines Work |
| 10M | 8:28 | How Budget Airlines Work |
| 10M | 19:43 | The Failed Logistics of Russia's Invasion of Ukraine |

Founder Sam Denby; a Standard creator, and Standard launched the creator-owned streaming service
Nebula in 2019 ([Wikipedia: Nebula](https://en.wikipedia.org/wiki/Nebula_(streaming_service))) [press].

| Field | Wendover |
|---|---|
| Title formulas | `How [System] Works`; `The Economics of [Everyday Thing]`; `[Country]'s Geography Problem`; `Why [Company/Place] [Wins/Got So X]`; `The Problem With [X]`; `The [Exact $ figure] Per Minute [X]` [data] |
| Thumbnail grammar | One clean photo or render of the system, minimal text [observed] |
| Cold open | A precise, counter-intuitive fact about an everyday system, then "this is the story of…" [observed] |
| Pacing | Dense narration, constant motion graphics and stock; *est.* 3–5 s [observed] |
| Narration | Fast, dry, information-dense, wry humour [observed] |
| Music and sound | Light, low music bed [observed] |
| Signature visuals | Animated maps and route lines, logistics diagrams, airline and shipping stock [observed] |
| Sponsors | Historically Nebula or the CuriosityStream bundle; read about 2–4 min in [observed; Nebula partnership: [Nasdaq press release](https://www.nasdaq.com/press-release/curiosity-invests-in-nebula-worlds-largest-creator-owned-streaming-platform-2021-09)] |
| Why the biggest exploded | Metaphor titles ("Cities at Sea") and oddly exact numbers ("$2,614 Per Minute") [house] |

---

## 9. PolyMatter

| Views | Length | Title |
|---|---|---|
| 7.6M | 11:28 | Zimbabwe's Currency Crisis: the worthless $100 trillion bill |
| 5.8M | 8:04 | Apple's Money Problem (& Why It Won't Buy Netflix) |
| 5.2M | 11:35 | Why China Ended its One-Child Policy |
| 5.1M | 8:00 | How Cruise Ships Work |
| 5.0M | 13:02 | How North Korea Makes Money |
| 4.5M | 12:30 | Why 50 Million Chinese Homes are Empty |

Recent videos run 16–20 min with much lower views (0.1–0.4M) than the older 8–12 min catalogue [data].

| Field | PolyMatter |
|---|---|
| Title formulas | `Why [Country/Company] [Did Surprising Thing]`; `[Company]'s Money Problem`; `How [Pariah] Makes Money`; `Why [Huge Number] [X] are Empty`; `[Country] is Not [Popular Assumption]` [data] |
| Thumbnail grammar | Minimal flat graphic, one object or flag, dark field, one accent [observed] |
| Cold open | The thesis as a paradox in two sentences [observed] |
| Pacing | Steady; flat 2D motion graphics; *est.* 4–6 s [observed] |
| Narration | Calm, precise, essayistic [observed] |
| Music and sound | Minimal ambient bed [observed] |
| Signature visuals | Minimalist vector maps and charts, a restrained palette [observed] |
| Why the biggest exploded | One absurd object (a $100 trillion bill) that *is* the thesis [house] |

---

## 10. Neo

| Views | Length | Title |
|---|---|---|
| 34M | 10:56 | Why Dubai's Man-Made Islands Are Still Empty |
| 16M | 16:09 | How the CIA Found Osama bin Laden |
| 15M | 21:16 | How the U.S. Found Saddam Hussein |
| 14M | 10:41 | How the US President Travels |
| 14M | 18:58 | Inside Air Force One During 9/11 |
| 13M | 17:49 | The Densest City on Earth |
| 12M | 18:12 | The Genius Design of Apple Park |

Channel handle `@NeoExplains` [data]. We found no public information on who makes it.

| Field | Neo |
|---|---|
| Title formulas | `How [Agency] Found [Most-Wanted Person]`; `How [Powerful Person] [Does Everyday Thing]`; `Why [Mega-Project] Is Still [Empty/Abandoned]`; `Inside [Famous Vehicle/Building] During [Event]`; `The Genius Design of [Building]` [data] |
| Thumbnail grammar | An aerial or satellite image of a place, one red marker, little text [observed] |
| Cold open | An aerial descent onto the place, plus the paradox ("$X billion, and nobody lives here") [observed] |
| Pacing | Smooth satellite and 3D-map moves, archive; *est.* 4–7 s [observed] |
| Narration | Neutral, clear, documentary [observed] |
| Signature visuals | Google-Earth-style descents, 3D building cutaways, route maps [observed] |
| Why the biggest exploded | A visible mega-object with an obvious, unanswered question (why is it empty?) [house] |

**Steal**: the "drop from orbit to the place" opener is exactly the oner in our library brief.

---

## 11. hoog

| Views | Length | Title |
|---|---|---|
| 6.8M | 13:26 | Why Amsterdam is Building a New Red Light District |
| 5.8M | 9:54 | The Evil Design of Japan's Death Penalty |
| 4.6M | 31:01 | The Most Genius Kidnapping in History |
| 4.5M | 13:03 | What's Inside the World's Most Exclusive Club? |
| 4.4M | 10:51 | The Most Evil Building in Europe |
| 4.1M | 32:03 | The Tokyo Subway Attack |

Handle `@hoog-youtube`; credited for voice-overs on Fern ([CreatorDB](https://creatordb.app/creatorstats/fern-tv/)).
Recent uploads turn to AI ("What did Amodei see?", "Hugging Face: Why AI Might Kill Us",
"What happens if Europe loses the AI race?") [data].

| Field | hoog |
|---|---|
| Title formulas | `The Evil Design of [Institution]`; `The Most [Genius/Evil] [X] in [Place/History]`; `Why [City] is Building [Surprising Thing]`; `What's Inside [Exclusive Place]?`; `Mapping [Event]` [data] |
| Thumbnail grammar | Fern-adjacent: one 3D-rendered building or object, dark, one red element [observed] |
| Cold open | A design detail of a building or system, then its human consequence [observed] |
| Pacing | Slow 3D architectural camera moves (*est.* 5–8 s) [observed] |
| Narration | Low, calm, European English [observed] |
| Signature visuals | Isometric 3D city and building models, cutaways, floor plans [observed] |
| Why the biggest exploded | "Design" framed as moral ("Evil Design"), and the surprising civic plan (a new red-light district) [house] |

---

## 12. ColdFusion

| Views | Length | Title |
|---|---|---|
| 17M | 23:34 | Three Men Lost in Space – The Apollo 13 Disaster |
| 12M | 24:38 | Theranos – Silicon Valley's Greatest Disaster |
| 8.7M | 29:40 | The FTX Disaster is Deeper Than you Think |
| 8.7M | 19:04 | Enron - The Biggest Fraud in History |
| 7.9M | 11:23 | How BIG is Samsung? (They Have a Military Department!) |
| 7.3M | 21:33 | Who Controls All of Our Money? |

Dagogo Altraide creates and narrates every video ([State of the Creators](https://stateofthecreators.buzzsprout.com/850942/episodes/8943375-017-getting-3-millions-subscribers-on-youtube-focusing-on-quality-w-dagogo-of-coldfusion)) [primary]
and makes music as **Burn Water**, which scores the channel
([Tubefilter](https://www.tubefilter.com/2017/10/19/youtube-millionaires-cold-fusion-tv/)) [press].

| Field | ColdFusion |
|---|---|
| Title formulas | `[Company] – [Superlative] Disaster`; `The [X] Disaster is Deeper Than You Think`; `How to Lose $[N] Billion [Doing X]`; `[Company] Was Worth $[N]. Then Everyone Left`; `[X] is [Worse/Dodgier] Than You Think` [data] |
| Thumbnail grammar | A founder's face or a product on dark, 2–4 bold words [observed] |
| Cold open | A cold fact or news clip, then the signature greeting ("Hi, welcome to another episode of ColdFusion"). The greeting works only because it's a 15-year brand ritual; don't copy it [observed] |
| Pacing | Archive and news clips plus slow pans on photos; *est.* 4–7 s [observed] |
| Narration | Calm, soft, explanatory; Australian English [observed] |
| Music and sound | Chill electronic, downtempo; his own tracks [press] |
| Signature visuals | News-clip collage, archival photos, stock tech b-roll, simple titles [observed] |
| Sponsors | Read near the start [observed] |
| Why the biggest exploded | A disaster everyone half-knows, told completely (Apollo 13, Theranos, FTX, Enron) [house] |

---

## 13. Business Casual

| Views | Length | Title |
|---|---|---|
| 5.6M | 9:07 | How Rockefeller Built His Trillion Dollar Oil Empire |
| 5.2M | 40:22 | J.P. Morgan Documentary: How One Man Financed America |
| 5.1M | 10:26 | Rise of the Rothschilds: The World's Richest Family |
| 4.5M | 12:42 | Lamborghini: Never Insult a Tractor Tycoon |
| 4.0M | 14:00 | How Andrew Carnegie Became The Richest Man In The World |
| 3.8M | 8:14 | The Rise of Nike: How One Man Built a Billion-Dollar Brand |

| Field | Business Casual |
|---|---|
| Title formulas | `How [Tycoon] Built His [Superlative] Empire`; `Rise of [Dynasty]: [Superlative]`; `[Brand]: [Ironic Origin Line]`. The longest titles (median 53 chars) and the most colons (60%) [data] |
| Thumbnail grammar | An illustrated caricature of the tycoon with money or a logo; bright 2D [observed] |
| Cold open | A comic anecdote from the founder's life [observed] |
| Pacing | Animated 2D cut-out characters; brisk (*est.* 3–5 s) [observed] |
| Narration | Light, comic, storyteller [observed] |
| Signature visuals | Paper-cut-out caricatures, period maps, cartoon money [observed] |
| Why the biggest exploded | "Never Insult a Tractor Tycoon" is the standout: an origin story with an insult as its inciting incident, a villain and a revenge arc in six words [house] |

**Anti-lesson**: their colon-heavy biography titles cap their reach. The one non-biography
framing ("Never Insult a Tractor Tycoon") outperforms its siblings relative to effort.

---

## 14. Moon

| Views | Length | Title |
|---|---|---|
| 7.9M | 32:42 | TikTok Is Worse Than You Thought |
| 7.2M | 20:12 | The Truman Show Tried To Warn You |
| 5.5M | 50:04 | 1984 Tried To Warn You |
| 5.2M | 16:47 | Dubai Is Everything Wrong With Society |
| 4.1M | 15:39 | BlackRock: The Most Evil Business In The World |
| 3.9M | 24:05 | Discord: The Most Evil Business In The World |

| Field | Moon |
|---|---|
| Title formulas | `[Cultural Work] Tried To Warn You`; `[Platform] Is Worse Than You Thought`; `[Brand]: The Most Evil Business In The World`; `[Place] Is Everything Wrong With Society`; `The [Noun] Economy` (series formulas) [data] |
| Thumbnail grammar | One dark, iconic image (a logo or film still), heavy shadow, 0–2 words [observed] |
| Cold open | A slow, ominous statement over a film still; dread before information [observed] |
| Pacing | Slow; long holds on film clips and archive (*est.* 6–12 s) [observed] |
| Narration | Anonymous, deep, slow, contemplative; heavy second person [observed] |
| Music and sound | Dark ambient and piano under everything [observed] |
| Signature visuals | Film clips, archive, dark grade [observed] |
| Why the biggest exploded | Series formulas that pre-sell the emotion ("Tried To Warn You") on something the viewer uses daily (TikTok) [house] |

**Caution**: critics say Moon's videos often don't deliver on their titles
([Substack critique](https://cmdcph.substack.com/p/down-the-rabbit-hole-the-world-of),
[summary of a critique video](https://youtubesummary.com/summary/5vjsIhgIl70)) [opinion]. This is
the click-trap risk Veritasium warns about. Borrow the series-formula idea, not the overreach.

---

## 15. Veritasium

| Views | Length | Title |
|---|---|---|
| 112M | 12:07 | Why Are 96,000,000 Black Balls on This Reservoir? |
| 81M | 20:06 | These are the asteroids to worry about |
| 63M | 12:02 | World's Lightest Solid! |
| 62M | 55:00 | The Closest Thing We Have to Alien Technology |
| 60M | 3:01 | Backspin Basketball Flies Off Dam |
| 56M | 33:45 | Why It Was Almost Impossible to Make the Blue LED |
| 46M | 22:09 | The Simplest Math Problem No One Can Solve - Collatz Conjecture |

Recent titles are sentence-length and confident: "Something is jamming GPS over Europe. Here's
what we found", "Google Maps is unreasonably fast. Let me explain" [data].

### "Clickbait is Unreasonably Effective" (Aug 2021)

From the Gigazine write-up of the video ([Gigazine](https://gigazine.net/gsc_news/en/20210830-clickbait-effective/)) [primary, via press]:

- **The backspin video.** Under the title "Strange Applications of the Magnus Effect", the 2015
  video got 16.3M views in a week, **mostly embedded on news sites, not on YouTube**. Retitled
  "Backspin Basketball Flies Off Dam", with a thumbnail of the ball dropping off the dam, it kept
  climbing (now 60M [data]).
- **The asteroid video.** Called "the best movie in Veritasium history" by his team, it grew
  slowly. Adding "What can we do?" to the title didn't help. A strong thumbnail change and the
  simpler "These Are The Asteroids To Worry About" led to over 10M (now 81M [data]).
- **Title survey.** "You Are NOT a Visual Learner" versus "The Biggest Myth in Education": he
  expected a split; B won overwhelmingly. **Lesson: name the size of the idea, not the topic.**
- **Collatz.** A title using the jargon "Collatz problem" reaches only the people who already know
  it. "The simplest math problem no one can solve" reaches everyone. (The final title uses both:
  the hook first, the jargon after the dash.)
- **Two types of clickbait.** Type 1 accurately compresses the video's content ("legitbait"). Type 2
  deceives or exaggerates ("click trap", e.g. "9 in 10 Americans get this fact wrong"). Type 1 is
  necessary; Type 2 creates backlash.
- **Packaging effort.** Appealing but honest titles and thumbnails take "as much effort as
  editing the video itself".
- **Repackaging works late.** Two view peaks: one at release, one after the packaging change.

Other Veritasium facts:
- **Faces matter less than people think**: "we've done some internal research and not found faces
  to be that important" (Derek Muller, quoted in [The Ringer](https://www.theringer.com/2026/03/09/pop-culture/youtube-face-thumbnails-history-explained)) [primary, via press].
  Good news for a faceless channel.
- **Misconceptions first.** Muller's PhD found a clear, correct physics explanation video **did
  not** improve learning, and boosted students' confidence in their wrong ideas. A version that
  **stated the common misconception first** and then corrected it roughly doubled post-test
  scores (to almost 12 of 26)
  ([THE Journal](https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx)) [research, via press].
  This is the evidence base for the "everyone believes X" hook family in `hooks.md`.

| Field | Veritasium |
|---|---|
| Title formulas | `Why Are [Huge Exact Number] [Objects] on This [Place]?`; `The Simplest [X] No One Can [Y]`; `Why It Was Almost Impossible to [Achievement]`; `The Closest Thing We Have to [Sci-Fi Noun]`; `[Odd Thing] is unreasonably [adjective]. Let me explain`; `Something is [verbing] [X]. Here's what we found` [data] |
| Thumbnail grammar | One real object or phenomenon, high contrast, sometimes Derek with it; a few words at most [observed] |
| Cold open | On location with the physical thing, an immediate demonstration or provocative question; frequently "the misconception" stated as if true [observed] |
| Pacing | Long-form, with a demonstration or animation as a pattern interrupt every minute or so [observed] |
| Narration | Host on camera plus VO; Socratic; asks the viewer to predict before revealing [observed] |
| Music and sound | Light orchestral or electronic bed; silence at reveals [observed] |
| Signature visuals | Field demonstrations, high-speed footage, clean 3D animation, historic archive [observed] |
| Sponsors | A read near the start or end [observed] |
| Why the biggest exploded | 96,000,000 black balls: an absurd real image plus a huge exact number plus a "why" [data + house] |

**Retention practice (house synthesis from the above):** ask the viewer to predict, state the
wrong answer as if right, then reveal. Each prediction is a micro open loop.

---

## 16. Mark Rober

| Views | Length | Title |
|---|---|---|
| 223M | 10:28 | World's Largest Jello Pool- Can you swim in Jello? |
| 152M | 26:57 | Egg Drop From Space |
| 150M | 9:09 | Liquid Sand Hot Tub- Fluidized air bed |
| 147M | 21:40 | Backyard Squirrel Maze 1.0- Ninja Warrior Course |
| 130M | 19:00 | Mark Rober vs Dude Perfect- Ultimate Robot Battle |
| 128M | 16:37 | Shark Attack Test- Human Blood vs. Fish Blood |

Former NASA engineer; CrunchLabs (2022) is a build-box subscription introduced inside the video's
narrative rather than as a separate ad; his formats (Squirrel Maze, Glitter Bomb) are scaled
series ([OpusClip](https://www.opus.pro/blog/mark-robers-growth-playbook-how-he-engineered-one-of-youtubes-most-trusted-brands)) [vendor].
Rober argues attention has to come before learning
([Colin and Samir listing](https://rosetta.to/u/colinandsamir/2026)) [primary, via listing].

| Field | Mark Rober |
|---|---|
| Title formulas | `World's Largest [Absurd Object]- Can you [Verb]?`; `[X] vs [Y]- [Test]`; `[Thing] From Space`; `[Series] [N].0`; `Testing if [Myth]` [data] |
| Thumbnail grammar | Mark plus one giant absurd object, bright daylight, saturated [observed] |
| Cold open | The money shot first (the crash, the giant pool), then rewind to "how we got here" [observed; [OpusClip](https://www.opus.pro/blog/mark-robers-growth-playbook-how-he-engineered-one-of-youtubes-most-trusted-brands)] |
| Pacing | Build montages, failure and iteration beats, then a long payoff; *est.* 2–4 s in montages [observed] |
| Narration | Enthusiastic teacher, jokes, explains the science in the middle of the action [observed] |
| Music and sound | Upbeat, playful; big sound design on tests [observed] |
| Signature visuals | Slow motion, CAD animations of the build, test footage, villains (squirrels, porch pirates) [observed] |
| Sponsors | CrunchLabs integrated into the build story [vendor] |
| Why the biggest exploded | One giant absurd object plus a question a child can ask [house] |

---

## 17. Bloomberg Originals

Bloomberg's long-form channel: series such as *The Circuit* (Emily Chang), *The Future With
Hannah Fry*, *Hello World* and *Quicktake*, plus feature documentaries.

Top long-form among the **latest 600 uploads** (the full catalogue timed out) [data]; median
long-form 0.23M views, median length 13:31:

| Views | Length | Title |
|---|---|---|
| 9.6M | 24:02 | The Race to Harness Quantum Computing's Mind-Bending Power \| The Future With Hannah Fry |
| 6.6M | 42:12 | Inside OpenAI's Stargate Megafactory with Sam Altman \| The Circuit |
| 5.9M | 24:02 | Google CEO Sundar Pichai and the Future of AI \| The Circuit |
| 4.8M | 7:01 | How Singapore Got So Crazy Rich |
| 4.2M | 25:39 | How China's 'Perfect' Spy Got Caught |
| 4.2M | 22:32 | When JPMorgan CEO Jamie Dimon Speaks, the World Listens |
| 4.1M | 107:36 | RUIN: Money, Ego and Deception at FTX |
| 3.8M | 8:46 | Japan's Massive Money Experiment Is Over. Now What? |
| 3.2M | 7:57 | This Is How Huawei Shocked America With a Smartphone |

"Inside [famous AI company] with [famous CEO]" is the top outlier pattern (28× and 25× median):
**access** is the packaging.

| Field | Bloomberg Originals |
|---|---|
| Title formulas | `Inside [Famous Company]'s [Secret Place] with [CEO]`; `How [Country] Got So [Adjective] Rich`; `How [Country]'s '[Ironic Adjective]' [Spy/Scheme] Got Caught`; `[Policy] Is Over. Now What?`; `This Is How [Company] Shocked [Rival]`; `\| [Series Name]` suffix [data] |
| Thumbnail grammar | Real on-location photography; a subject or facility; 0–3 words [observed] |
| Cold open | On-location footage plus an interview soundbite as the hook, then the narrator [observed] |
| Pacing | Broadcast documentary: interviews, b-roll, aerials; *est.* 4–7 s [observed] |
| Narration | Reporter or presenter, authoritative, broadcast style [observed] |
| Music and sound | Licensed cinematic library score [observed] |
| Signature visuals | Real access (factories, labs, executives), drone aerials, Bloomberg data graphics [observed] |
| Sponsors | YouTube ads only; no in-video reads [observed] |
| Why the biggest exploded | Access no one else has (Altman's Stargate site, Pichai) and a celebrity science presenter. That is MrBeast's "wow factor" in journalistic form [data + house] |

**Steal**: real primary access (documents, filings, interview audio) is the documentary
wow-factor. We can't film on location, but we can show the actual filing.

---

## 18. RealLifeLore

| Views | Length | Title |
|---|---|---|
| 50M | 6:36 | The Ocean is Way Deeper Than You Think |
| 48M | 6:41 | What's the Deepest Hole We Can Possibly Dig? |
| 33M | 9:06 | How the Universe is Way Bigger Than You Think |
| 25M | 9:24 | These Are the Events That Will Happen Before 2050 |
| 21M | 31:56 | Why Russia is Invading Ukraine |
| 21M | 26:35 | How North Korea Finally Made It Impossible to Escape |

A Standard and Nebula creator ([Tubefilter](https://www.tubefilter.com/?p=166973)) [press].

| Field | RealLifeLore |
|---|---|
| Title formulas | `The [Familiar Thing] is Way [Bigger/Deeper] Than You Think`; `What's the [Superlative] [X] We Can Possibly [Y]?`; `Why [Country] [Can't/Is] [X]`; `How [Regime] Made It Impossible to [Y]`. Most questions (36%) [data] |
| Thumbnail grammar | One map or scale diagram, one arrow, 1–3 words [observed] |
| Cold open | A scale fact that breaks the viewer's mental model in one sentence [observed] |
| Pacing | Map and diagram animation; *est.* 4–6 s [observed] |
| Narration | Fast, neutral, dense [observed] |
| Signature visuals | Maps, terrain, scale diagrams (the "zoom" ladder) [observed] |
| Sponsors | Nebula / CuriosityStream bundle, about 1–3 min in [observed] |
| Why the biggest exploded | "Way Deeper Than You Think": the viewer's own belief, challenged, with a pure zoom ladder as the payoff [house] |

---

## 19. Hindsight

We matched the name to the channel `@HindsightYT` (country-economics explainers). If a different
"Hindsight" was meant, redo this section.

| Views | Length | Title |
|---|---|---|
| 6.7M | 17:01 | Why living in Canada has become Impossible |
| 3.2M | 16:06 | Why life in Australia has become Impossible |
| 3.1M | 11:47 | How Sweden is Destroyed by the Immigration Crisis |
| 2.5M | 16:59 | How the Dutch solved an (almost) Impossible Problem |
| 1.8M | 13:01 | You won't believe what Norway just found! |

| Field | Hindsight |
|---|---|
| Title formulas | `Why [living in Country] has become Impossible`; `Something Is Very Wrong in [Country]`; `[Country] Is Becoming A Big F*cking Deal`; `Anyone under [Age] is F*cked` [data] |
| Thumbnail grammar | A flag or map plus a person in distress, 1–3 words [observed] |
| Cold open | A personal-cost statistic ("a two-bedroom flat now costs…") [observed] |
| Why the biggest exploded | Personal stakes (rent, wages) in a country with a large online audience. "Impossible" names the feeling the viewer already has [house] |

**Caution**: its profanity-led recent titles have much lower views [data]. Emotional intensity
isn't a substitute for a concrete object.

---

## 20. Sam O'Nella Academy

| Views | Length | Title |
|---|---|---|
| 23M | 5:45 | Historical Misconceptions For You to Bring Up during Family Dinner |
| 20M | 7:49 | Tarrare, the Hungriest Man in History |
| 19M | 11:59 | The Presidential Assassination Nobody Talks About |
| 19M | 6:56 | Obscure Obsolete Inventions |
| 19M | 5:02 | Why It Sucked to Be a Pirate |
| 17M | 7:46 | Pre-Industrial Surgeries |

Median long-form 12M; the biggest video is only 2× median, the flattest distribution in the set [data].

| Field | Sam O'Nella |
|---|---|
| Title formulas | `Why It Sucked to Be a [Historical Job]`; `[Name], the [Superlative] [Person] in History`; `The [X] Nobody Talks About`; `Historical Misconceptions For You to [Social Use]` [data] |
| Thumbnail grammar | A crude MS-Paint stick figure in an absurd situation [observed] |
| Cold open | A deadpan statement followed by a visual joke that undercuts it [observed] |
| Pacing | Fast; a new drawing per joke (*est.* 2–4 s) [observed] |
| Narration | Deadpan, sarcastic, absurd asides [observed] |
| Signature visuals | Crude drawings where **the picture contradicts or exaggerates the VO**. The joke lives in the gap [observed] |
| Why it works | Brand trust: viewers click for the voice, not the topic. Hence the flat distribution [house] |

**Steal**: "picture contradicts the VO" is a legitimate retention device even in a serious
documentary, used once or twice per video for dry humour (the style bible's "absurd subject
played deadpan").

---

## 21. What we take from all twenty

1. **A repeatable title formula is a brand.** Pick two and use them for a season:
   - `The [Company] That [Unexpected Verb] [Everything/You]` (Palantir: "The Company That Sees Everything");
   - `Why [Exact Number] [Objects] [Did Something Strange]` (Veritasium style).
2. **The mystery object is the strongest documentary frame**: Veritasium's balls, PolyMatter's
   bill, Neo's islands, Fern's objects. It is already our house frame.
3. **Name the size of the idea, not the topic** (Veritasium's survey). Jargon goes after the hook.
4. **Misconception first, then the correction** (Muller's PhD). Every video should contain at least
   one "you probably think… actually…" beat.
5. **Wow factor = access or reconstruction no one else has** (MrBeast's house crane, Bloomberg's
   access, Fern's 3D). For us: a tracked 3D reconstruction or a primary document on screen by 0:30.
6. **Speed beats polish on news.** A 6-minute fast reconstruction (Fern on the Trump shooting) can
   beat every 40-minute polished video on the channel.
7. **Avoid colons and caps-lock adjectives.** In this set they cluster on the lower-view channels
   (a correlation only).
8. **Integrated sponsor or no sponsor.** Rober and MrBeast integrate; nobody's best video has a
   scripted read in the first minute.
9. **Slower can win.** MrBeast slowed down in 2024; LEMMiNO, Moon and Fern hold long shots. Pace
   comes from new information, not from cut speed (Joos).
10. **Length must be earned by story.** PolyMatter's recent 16–20 min videos get 0.1–0.4M views
    against a 0.91M channel median built on 8–12 min videos [data]. Many things changed at once
    (topics, the algorithm, competition), so this is a warning, not a measured effect.

---

## Gaps and how to close them

- **No public cut-rate data** for any channel except MrBeast's former style. To measure: download 3
  videos per channel on a personal machine, run
  `ffmpeg -i in.mp4 -filter:v "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time`,
  and compute shots per minute for the cold open (0:00–1:00), minute 3–6 and the back half. Log the
  results here and replace every *est.*
- **[observed] rows are our characterisation**, written without re-watching on this box. Verify the
  cold-open and sponsor timings against 2–3 videos per channel before treating them as fact.
- **Hindsight** identity is a best guess. **Bloomberg Originals** data covers only its latest 600 uploads.
- Several creator-process sources are summaries of Q&As or talks, not full transcripts.

## Appendix: reproduce the [data]

```bash
yt-dlp --flat-playlist --print "%(view_count)s|%(duration)s|%(upload_date)s|%(title)s" \
  "https://www.youtube.com/@<handle>/videos" > <handle>.txt
```

Handles used: `MrBeast`, `Fern-TV`, `kurzgesagt`, `LEMMiNO`, `johnnyharris`, `Vox`,
`MagnatesMedia`, `Wendoverproductions`, `PolyMatter`, `NeoExplains`, `hoog-youtube`, `ColdFusion`,
`BusinessCasual`, `moon-real`, `veritasium`, `MarkRober`, `RealLifeLore`, `HindsightYT`,
`SamONellaAcademy`; Bloomberg Originals by channel ID `UCUMZ7gohGI9HcU9VNsr2FJQ`.
