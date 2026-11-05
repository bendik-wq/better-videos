# YouTube packaging mechanics (for max distribution without bait)

Bencivenga wrote for mail and print; these are the platform facts his rules have to fit. Each
item says what it rests on: **[platform]** = YouTube's own help pages (`sources.md` Y1–Y3);
**[observed]** / **[data]** = our measurements in `docs/library/video-autopsies/` and
`docs/library/animation-study/`; **[house]** = our rule, untested on this channel.

---

## 1. The peg: news first, then a famous event

The user's brief for this channel: use new news if any works; if not, a big, unique historic event
with a name everybody knows. Speed on news produced the largest outliers we measured
(Kurzgesagt's coronavirus video 8 days after the pandemic declaration, 89.6M; ColdFusion's FTX
5 days after the bankruptcy; `video-autopsies/README.md` §B11) [observed].

1. **Scan** (with `idea-engine`, every run): news from the last 14 days in our lanes. A story
   qualifies only if it has **a named event, a primary record we can show, and a mechanism we can
   animate**, and we can ship while it's still news (the winners above shipped in 2–8 days).
2. **Ask the Bencivenga question:** does the news make the *problem urgent* (Persuasion Equation
   part 1)? A peg that adds no urgency is decoration; skip it.
3. **No qualifying news →** a famous event or object (known name = the casual viewer's itch is
   already there) **plus a door nobody uses**: the primary record, the overlooked person, the
   mechanism nobody animated (`fascinations.md` §1–3).
4. **Hybrid (most common):** an evergreen title and a timely stake in the hook and one chapter
   (`worked-example.md` §0). Evergreen titles keep earning; timely titles spike and decay.
5. **Timely title →** plan the repackage on day 30 (`packaging` Step 5: revisit
   underperformers), when the news word has gone stale.

## 2. Mobile truncation and front-loading

- **The title is often cut on phones**, and how much shows depends on device, layout and the
  surface (home, suggested, search) [platform behaviour, no fixed number published]. Our working
  rule [house]: **the itch and the proof cue live in the first ~30 characters**, and the whole
  title stays ≤ 50 (`packaging` Step 2). The median title in our 70 autopsied winners is 40.5
  characters [observed].
- **Front-load test:** cut the title at 30 characters. Does the stub still make someone want to
  click? "Without Einstein, Your Map Wou…" yes; "The Surprising Story of How Ei…" no.
- **Don't spend the first words on setup** ("The Story of…", "Inside the…", "Here's Why…").
- If the number must fall late in the title, put it on the thumbnail too (the number is proof,
  and the thumbnail always shows).

## 3. Search vs browse vs suggested

Bencivenga's "Fuzzy Dice" Bullet: meet buyers where they're already looking (`principles.md` §16).

| Surface | What the viewer is doing | What the title needs |
|---|---|---|
| Search | Typing a noun | The searched noun early, in the viewer's words ("GPS", not "satellite navigation"); the description's first line repeats it |
| Browse (home) | Scrolling a feed of competing titles (Caples' *Reader's Digest* contents page, `principles.md` §7) | The itch and the proof cue first; unpredictability |
| Suggested (next to a video) | Finishing a related video | Shares nouns with the neighbour so it's recognisably "next", but promises the angle the neighbour didn't cover |

Evergreen explainers lean on search over time; new uploads live or die in browse in the first
days. When unsure, A/B the two (search noun first vs stake first) with Test & Compare.

## 4. Test & Compare: testing the curiosity gap

[platform, Y1–Y2] Up to three titles, three thumbnails or three combinations. YouTube picks the
winner by **watch-time share**, not CTR, and labels it Winner, Preferred or None. Editing the title
or thumbnail during the test stops it.

What that means for copy [house]:
- **A curiosity gap the video doesn't pay loses**, because a click that leaves early adds no
  watch time. Test & Compare is a mechanical proof ≥ claim check.
- **Test one variable**, and make it a copy hypothesis, not a coin flip. Useful pairs:

| Hypothesis | Variant A | Variant B |
|---|---|---|
| Blind vs half-blind | *The Switch They Left Off in 1977* | *They Put a Clock in Orbit to Test Einstein* |
| Proof in the title vs proof on the thumbnail | Number in the title, no thumbnail text | No number in the title, number on the thumbnail |
| Search noun vs stake first | *GPS Would Drift 10 km a Day Without Einstein* | *Without Einstein, Your Map Would Drift 10 km a Day* |
| Label vs narrative claim (observed live on Veritasium) | *The Biggest Chemical Coverup In History* | *How One Company Secretly Poisoned The Planet* |

- **Log CTR too**, as a diagnostic: high CTR with lower watch-time share means the gap
  over-promised; that's a G2 lesson for the critics (`checklist.md` §10 calibration).

## 5. Shorts and clips

The animated Shorts lane is large (Zack D. Films, 14M median per Short;
`animation-study/README.md` §1.1) [data], but a Short is a separate piece of copy, not a trailer.

Rules [house]:
1. **Frame 1 is the claim and the picture together.** No title card; there's no time for one.
2. **Proof by 0:03**: the number, record or demonstration on screen.
3. **Pay the gap inside the Short** (G3). "Watch the full video to find out" is an unpaid tease;
   link the long video as the related video instead.
4. **One idea, one turn.** Claim → proof → twist → loop line that leads back into frame 1.
5. **Shorts title** ≤ 40 characters, the fascination stated plainly ("The Clock Set Wrong on
   Purpose").
6. **Cut from the replayed kinds**: a mechanism made simple, a computed comparison, a single clue
   or record (`video-autopsies/README.md` §B4) [observed]: these are the moments people rewind in
   long videos.
7. **No other channel's Shorts system**: no emoji-suffix titles, no recurring avatar
   (`animation-study/README.md` §6).

## 6. Localisation

[platform, Y3] YouTube Studio lets you add translated titles and descriptions (Subtitles → Title &
description) and can add auto-dubbed audio tracks.

Rules [house]:
- **Translate the fascination, not the words.** Keep the formula (counter-intuitive pair, number
  + odd unit) and the proof cue; let a native writer find the natural phrasing.
- **Run the "yeah, sure" test in the target language** with a native speaker: a claim that reads
  plain in English can read as hype elsewhere, and vice versa.
- **Units and number formats travel badly.** Metric with local formatting (10 km; 1.746 or 1 746
  where that's the convention). Never round a sourced number differently per language.
- **Length grows** in German, French and Spanish; recheck the 50-character limit and the
  30-character front-load in each language.
- **Thumbnail text that's a number or a symbol works in every language** (**+38 µs**, **18% →
  1%**); word-based thumbnail text doesn't localise, so prefer numbers for videos we expect to
  travel.
- **Auto-dubbed narration** inherits our script: short sentences and numbers spelled as spoken
  (`retention-script` §10) dub better. Listen to one dubbed track before relying on it.
