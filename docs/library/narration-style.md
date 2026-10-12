# Narration style: voice and wording

The narrator's voice for every episode. It builds on `docs/research/script-patterns.md` §3 (TTS
rhythm, measured Kokoro behaviour), which stays the rulebook for numbers and pauses. This file is
the word-level toolkit: what the voice sounds like, which words carry it, which words kill it,
and 50 worked rewrites.

Evidence labels: **[observed]** from the caption transcripts of the 70 videos in
`video-autopsies/` (pulled with yt-dlp on 2026-10-12; numbers are from our own counts);
**[test]** our Kokoro tests in `script-patterns.md` §3.2; **[house]** our rule, with the reason.

---

## 0. The voice in one paragraph

Calm, dry, exact. The narrator knows the ending and is in no hurry. Short declaratives; the
facts do the shouting. No hype words, no greeting, no "guys". Present tense for scenes ("It's
October 2015. John Brennan's phone rings."), past tense for analysis. One wry line per
chapter at most. The model is Fern's understatement and LEMMiNO's epistemic care, at Wendover's
information density.

### What the top videos actually sound like [observed]

From the caption transcripts in `video-autopsies/` (word counts ÷ runtime):

| Measure | What we found | Our target |
|---|---|---|
| Speaking rate | Most narrated docs sit at 150–185 words per minute of runtime; slow, atmospheric channels (Moon, LEMMiNO) sit lower; dense explainers (Wendover, PolyMatter) higher. See `video-autopsies/README.md` for the full table | 150 wpm (Kokoro 0.96, measured on Palantir) |
| Turn words ("but", "however", "yet", "except", "until", "instead") | Dense explainers average a turn word every ~10–20 s; the median gap between turns is shortest in the cold open | One real turn every 30–40 s at minimum (the re-hook cadence), with smaller "but"s in between |
| Cold opens | Fern opens in a dated scene ("It's October 2015, a chilly day in autumn.") and reaches the first turn ("But John Brennan happens to be…") inside 25 s | Image, lean, turn by 0:22 (`hooks.md` §0) |
| Endings | The biggest videos end on a widened implication, not a recap (Fern's CIA video ends on a FISA statistic and "Maybe they're even surveilling us.") | One button line, then stop |

---

## 1. 200 strong verbs and transitions

### 1.1 Verbs (120)

Pick the verb that shows the mechanism. Weak verbs ("is", "has", "makes", "does", "gets", "goes")
are allowed only when the noun is doing the work.

**Money moving (20):** siphon, funnel, bleed, burn, pour, sink, pump, skim, park, launder,
hoard, stockpile, underwrite, bankroll, leverage, short, dump, bail out, write off, claw back.

**Power and control (20):** seize, corner, squeeze, choke, smother, lock in, buy out, swallow,
absorb, outflank, outlast, strong-arm, lean on, muscle, annex, carve up, dictate, override,
gatekeep, rubber-stamp.

**Secrecy and exposure (16):** bury, shred, redact, mask, cloak, leak, surface, unearth, expose,
trace, unmask, pin down, smuggle, slip past, scrub, whitewash.

**Collapse and failure (16):** crack, buckle, unravel, implode, crater, stall, seize up, wither,
evaporate, bleed out, cave, fold, spiral, tip over, snap, grind to a halt.

**Growth and scale (16):** balloon, mushroom, sprawl, surge, swell, compound, snowball, multiply,
outgrow, eclipse, dwarf, overtake, flood, blanket, spread, saturate.

**Technology and systems (16):** route, sort, rank, flag, scrape, ingest, index, train, throttle,
reroute, mirror, sync, ping, spoof, patch, brick.

**Investigation and knowing (16):** notice, spot, catch, track, match, cross-check, tally,
reconstruct, piece together, audit, sift, decode, crack (a code), corroborate, chase down, confirm.

### 1.2 Transitions (80)

Every transition is a **but** or a **therefore** (`script-patterns.md` §2.3). An "and then" is a
missed opportunity. Grouped by job; the group names match the re-hook groups in `hooks.md` §16.

**Turn / reversal (16)**
1. But.
2. Except.
3. And yet.
4. Instead,
5. Until,
6. That's not what happened.
7. There was a catch.
8. It didn't last.
9. On paper.
10. That was the plan.
11. Then the numbers came in.
12. Nobody checked.
13. It worked. That was the problem.
14. Almost.
15. Not quite.
16. The opposite happened.

**Consequence / therefore (14)**
17. So,
18. Which meant
19. That's why
20. The result:
21. Within a year,
22. By the end of the decade,
23. From then on,
24. Overnight,
25. That one decision
26. Which left
27. And so
28. Here's what that bought them.
29. The bill came later.
30. It set off a chain.

**New question / loop (12)**
31. Which raises a question.
32. So who paid?
33. Where did it go?
34. Why would anyone…?
35. The obvious question is X. The better one is Y.
36. Hold that thought.
37. We'll come back to that number.
38. Keep an eye on [name].
39. That detail matters later.
40. To understand why, go back to [year].
41. There's a second problem.
42. Nobody asked the next question.

**Stakes jump (10)**
43. That was the small one.
44. It got bigger.
45. Multiply that by [N].
46. Now do that every day.
47. And it wasn't just [X].
48. At that point it stopped being [X]'s problem.
49. The next number is worse.
50. Scale that up.
51. That's one [company]. There were [N].
52. That's the cost per [unit]. Here's the total.

**Zoom / scale change (8)**
53. Zoom out.
54. Now look closer.
55. From orbit, it's a dot.
56. Up close, it's [X].
57. On the map, it's [X]. On the ground, it's [Y].
58. That's the view from [place]. From [other place], it looks different.
59. One level down.
60. Pull back further.

**Time and place (10)**
61. It's [month], [year].
62. Meanwhile, in [place],
63. [N] years earlier,
64. Fast forward [N] years.
65. That same week,
66. At [time] that night,
67. By morning,
68. Back in [place],
69. Today,
70. As of [month year],

**Reveal (10)**
71. Here it is.
72. This is the document.
73. Look at line [N].
74. It's in the filing.
75. In their own words:
76. This is what it actually looked like.
77. Here's the number they left out.
78. The answer was there the whole time.
79. We ran the numbers.
80. This is the moment it changed.

---

## 2. Banned clichés and why

If one appears in a draft, rewrite the line. The scorer in `retention-script` counts each as a
fail on check 20 (TTS-ready) once this file is in use.

### 2.1 Openers and filler (never)

| Banned | Why | Use instead |
|---|---|---|
| "In today's world…" / "In today's day and age…" | Says nothing; dates the video | Name the year or the thing |
| "Let's dive in." / "Let's dive right in." / "Without further ado" | Delays the hook; signals a template | Start on the image |
| "In this video, we'll…" / "Today we're going to look at…" | Telling, not showing (MrBeast memo: "stop telling people what they will be watching") | The cold-open image and its question |
| "Hey guys" / "What's up" / "Welcome back" | We're faceless; there's no host to greet | Nothing |
| "Before we begin, make sure to like and subscribe" | Interrupts the most valuable 30 s | A one-line ask in the last 20 s, if at all |
| "Buckle up." / "Grab your popcorn." | Hype the video can't earn | A specific stake |
| "Have you ever wondered…?" | Generic question; the viewer hasn't | A concrete question about a concrete object |
| "Let's take a closer look." / "Let's break it down." | Narrates the edit | Just cut closer |
| "It's no secret that…" | If it's no secret, why say it? | State the fact |
| "Since the dawn of time" / "Throughout history" | Vague and usually false | A date |

### 2.2 Hype and weasel words (never in VO; never in titles)

shocking, insane, crazy, mind-blowing, jaw-dropping, unbelievable, game-changer, game-changing,
revolutionary, disruptive, groundbreaking, epic, literally (as an intensifier), basically,
essentially, actually (as filler), very, really, extremely, incredibly, truly, totally, arguably,
some say, many believe, experts agree (unnamed), it is said that, needless to say, at the end of the
day, when all is said and done, the rest is history, a perfect storm, a double-edged sword, the
elephant in the room, a wake-up call, a new normal, uncharted territory, at a crossroads, the tip of
the iceberg, a slippery slope, rabbit hole, deep dive, unpack, delve, navigate (the landscape),
landscape (as a metaphor), ecosystem (unless biological or a defined business term), leverage (as
a vague verb; fine for debt), synergy, robust, seamless, cutting-edge, state-of-the-art, tapestry,
testament to, plays a crucial role, it's important to note, it's worth noting, in conclusion, to sum
up.

[house] "Delve", "tapestry", "testament to" and "navigate the landscape" are also strong signals of
machine-written text to viewers; Fern's own video on AI copycat channels is about exactly that
look (`channel-breakdowns.md` §2).

### 2.3 Structures to avoid

- **"And then… and then…"** chains. Rewrite as but/therefore.
- **Rhetorical-question stacks**: three questions in a row. One question, then an answer or a scene.
- **"Not only X, but also Y"**: reads as an essay. Two sentences.
- **Passive agentless voice** for wrongdoing ("mistakes were made"). Name who, or say nobody knows.
- **Throat-clearing qualifiers** ("It could be argued that perhaps…"). Either attribute it or cut it.
- **Recaps** at chapter ends ("So, to recap…"). End chapters on a question (`retention-script` §7).
- **Signposting the ending** ("Before we wrap up…"). The memo: don't signal the end; end abruptly.

---

## 3. Sentence-rhythm patterns

Each pattern names a shape and gives an example. Use them on purpose; vary them across a chapter.
Line breaks are real pauses in our renderer (`script-patterns.md` §3.4), so the layout below is the
timing.

| # | Pattern | Shape | Example |
|---|---|---|---|
| P1 | Long-long-short | 18–22, 18–22, 2–5 words | "For eleven years the company told investors its software ran the airline. Every quarter the numbers went up and nobody asked to see it. / Nobody looked." |
| P2 | The fragment triple | Three noun phrases, then a sentence | "Stolen cards. Fake accounts. A warehouse in Ohio. All of it ran through one server." |
| P3 | The number drop | Set-up line; number alone on its own line, `padOut` 0.8 | "So how much did it cost? / Four hundred million dollars." |
| P4 | The definition flip | "X isn't A. It's B." | "Palantir isn't a data company. It's a permissions company." |
| P5 | The callback echo | Repeat an earlier exact phrase in a new context | Ch.1: "Nobody looked." … Ch.4: "This time, somebody looked." |
| P6 | The scale ladder | Same sentence frame, growing number | "One server. Then a room of them. Then a building. Then eleven buildings in three states." |
| P7 | Present-tense scene | Date, place, one sensory detail, one action | "It's March 2008. A trading floor in Manhattan. The screens go red at nine thirty-one." |
| P8 | The quiet verdict | A plain declarative after drama | "It was legal. All of it." |
| P9 | The concession turn | "Yes, X. But Y." | "Yes, the fund made money. But only for the people who left first." |
| P10 | The question answered by an image | Question line; next shot shows the answer; VO resumes after a beat | "So where does the water go? / [shot: the cooling towers, 3 s, no VO]" |
| P11 | The list with a twist | Two expected items, a third unexpected | "It sold software to banks, to hospitals, and to the Los Angeles Police Department." |
| P12 | The time-stamp cut | Start consecutive lines with dates | "Twenty nineteen: the first contract. Twenty twenty-one: the second. Twenty twenty-three: everything." |
| P13 | The counter-intuitive pair | Two facts that shouldn't both be true | "It has never turned a profit. It's worth more than Boeing." |
| P14 | The plain-English restatement | Jargon line, then "In other words," and a 6-word version | "…a total return swap. In other words, he bet with borrowed money and hid it." |
| P15 | The withheld name | Describe the actor for two lines, then name them | "He'd never run a bank. He'd never worked in finance. His name was…" |
| P16 | The second-person drop-in | One "you" line to make it personal, max 3 per video | "If you've paid for a flight in the last ten years, you've paid for this." |

**Rhythm budget per minute of VO** [house, from our 150 wpm budget and `script-patterns.md` §3.1]:
about 11–13 sentences; at least 2 under 6 words; none over 25; at least one but/therefore turn;
at most one number line that stands alone.

---

## 4. Numbers written for TTS

The rules and the Kokoro test results are in `script-patterns.md` §3.2. This is the lookup table.

| Caption (on screen) | VO text (what the voice reads) | Note |
|---|---|---|
| $2M | two million dollars | Never "$2M" (misread as "$2.2M" in our test) |
| $4.3B | four point three billion dollars | |
| $41.97B | about forty-two billion dollars | Round in speech, exact on screen |
| $0.10 | ten cents | |
| $178,000 | a hundred and seventy-eight thousand dollars | |
| $1.2T | one point two trillion dollars | |
| 1/3 | a third | Never "1/3" (read "one slash three") |
| 0.5% | half a percent | |
| 78% | seventy-eight percent | |
| 3–4B | between three and four billion | |
| 10x | ten times | |
| 2003 | two thousand and three | Pick one style for 2000–2009 per episode |
| 2026 | twenty twenty-six | |
| 1999 | nineteen ninety-nine | |
| 1920s | the nineteen twenties | |
| Q3 2025 | the third quarter of twenty twenty-five | |
| FY2025 | its twenty twenty-five fiscal year | |
| 10:30 p.m. | ten thirty at night | |
| 9/11 | September the eleventh | |
| Mar 10, 2023 | March the tenth, twenty twenty-three | |
| 3,000 km | three thousand kilometres | Spell units; pick US or UK spelling per episode |
| 500 MW | five hundred megawatts | |
| 1.5 GW | one and a half gigawatts | |
| 10^25 FLOP | ten to the twenty-fifth operations | Prefer an analogy on screen |
| H100 | H one hundred | Test new product names |
| GPT-4 | G.P.T. four | |
| ASML | A.S.M.L. | Dot acronyms the voice might read as a word |
| TSMC | T.S.M.C. | Fine in test, dot anyway for safety |
| NATO, NASA | NATO, NASA | Spoken as words |
| No. 1 | number one | |
| #2 | second | |
| ~ | about | |
| > / < | more than / less than | |
| % change | "up a third" / "down by half" | Fractions land better than percentages |
| 1 in 5 | one in five | |
| 10,000 | ten thousand | |
| 100,000,000 | a hundred million | |
| 2.4 million | two point four million | |
| 47 pages | forty-seven pages | |

Two numbers per sentence at most; never two big numbers back to back (`script-patterns.md` §3.2 rule 10).
When you must compare, give the reference first: "Apple made about a hundred billion dollars.
This company made more."

---

## 5. Fifty before/after rewrites

Each pair names the fix. Use them as a lookup when a line feels flat. The "after" lines are
shapes: any fact in them is illustrative and needs a source row before it goes in a script.

### Openers (1–8)

| # | Before | After | Fix |
|---|---|---|---|
| 1 | "In today's world, data is everywhere." | "Every time you tap a card, eleven companies find out." | Concrete event, number, stakes |
| 2 | "Let's dive into the story of Theranos." | "In twenty fifteen, a nineteen-dollar blood test was worth nine billion dollars." | Start on the absurd object and number |
| 3 | "Have you ever wondered how airlines make money?" | "Most airlines lose money flying people. They make it somewhere else." | Paradox instead of generic question |
| 4 | "This is the story of a company you've probably never heard of." | "You've never heard of this company. It has your address." | Short + personal stakes |
| 5 | "Today we're going to look at the 2008 financial crisis." | "On September the fifteenth, two thousand and eight, a bank with six hundred billion dollars in assets ran out of cash." | Dated scene, number, turn built in |
| 6 | "Artificial intelligence is changing the world in many ways." | "This building in Iowa drinks more water than the town around it." | Object and place, not abstraction |
| 7 | "There are many theories about what happened to the money." | "Two billion dollars left the account in eleven minutes. Nobody has found it." | Specific mystery |
| 8 | "Welcome back to the channel, today's video is a big one." | (cut; start on the image) | Delete the greeting |

### Turns and transitions (9–16)

| # | Before | After | Fix |
|---|---|---|---|
| 9 | "And then the company grew even more." | "Then it doubled. Which is when the regulators noticed." | Therefore beat |
| 10 | "However, there were some problems." | "There was one problem. The machines didn't work." | Name the problem |
| 11 | "But things were about to change in a big way." | "Then, on a Tuesday in March, the auditor resigned." | Event, not foreshadow |
| 12 | "Things went from bad to worse." | "That cost them a customer. The next mistake cost them the bank." | Stair-step with specifics |
| 13 | "Little did they know…" | "They didn't know the call was being recorded." | Fact, not cliché (and only if documented) |
| 14 | "Meanwhile, on the other side of the world…" | "Seven thousand miles away, in Shenzhen, a factory got the same order." | Place + link to the thread |
| 15 | "So, to recap, we've seen how…" | "Which leaves one question." | No recap; open a loop |
| 16 | "This would turn out to be a huge mistake." | "It was the last good decision the company made." | Understatement beats hype |

### Explaining a mechanism (17–26)

| # | Before | After | Fix |
|---|---|---|---|
| 17 | "Inflation is when the general price level rises over time." | "A loaf of bread cost a dollar. Now it costs a dollar fifty. The bread didn't change. The dollar did." | Object, then reframe |
| 18 | "Network effects mean the product becomes more valuable as more people use it." | "One phone is useless. Two phones make a call. A billion phones make a monopoly." | Scale ladder |
| 19 | "Leverage allows investors to amplify their returns using borrowed money." | "Put in one dollar, borrow nine. If the bet rises ten percent, you've doubled your money. If it falls ten percent, you've lost everything." | Numbers both ways |
| 20 | "The company utilises a subscription-based revenue model." | "You pay every month. Whether you use it or not." | Plain English, viewer stake |
| 21 | "Large language models are trained on vast amounts of data." | "To build it, they fed it more text than a person could read in twenty thousand lifetimes." | Analogy with a human unit (source the number) |
| 22 | "Data brokers collect and sell personal information." | "Your address, your salary and your medical searches sit in a spreadsheet. It's for sale. About forty cents a name." | Concrete list + price (verify price) |
| 23 | "The supply chain is extremely complex and interconnected." | "One chip crosses seventy borders before it reaches your phone." | One traced unit (verify) |
| 24 | "Central banks control the money supply through various tools." | "The Fed doesn't print money. It types it." | Definition flip |
| 25 | "The process is quite complicated, but essentially…" | "Three steps. Borrow it. Hide it. Repeat." | Signal a list, fragment triple |
| 26 | "This created a bubble in the housing market." | "Prices rose because people expected prices to rise. That's all a bubble is." | Mechanism in one line |

### Numbers and scale (27–34)

| # | Before | After | Fix |
|---|---|---|---|
| 27 | "The company is worth $3.2 trillion dollars." | "The company is worth about three trillion dollars. More than the economy of France." | TTS-safe + comparison (verify) |
| 28 | "It costs approximately $700,000 per day to run." | "It costs about seven hundred thousand dollars a day. Eight dollars a second." | Per-second reframe |
| 29 | "Over 50% of respondents agreed." | "More than half said yes." | Fraction over percent |
| 30 | "The data center uses 100 MW of power." | "It draws a hundred megawatts. About as much as eighty thousand homes." | Human unit (verify) |
| 31 | "Revenue grew by 1,000% between 2019 and 2023." | "In four years, revenue grew elevenfold." | One clean multiplier, correct maths (1,000% growth = 11×) |
| 32 | "There were 96,000,000 balls on the reservoir." | "Ninety-six million balls." (alone on its line, padOut 0.8) | Number drop pattern |
| 33 | "A huge amount of money was lost." | "Eight billion dollars. Gone in a weekend." | Number + time |
| 34 | "The fine was $5 billion, which is a lot." | "Five billion dollars. About a month of profit." | Scale it against the payer |

### People and power (35–42)

| # | Before | After | Fix |
|---|---|---|---|
| 35 | "He was a very powerful and influential man." | "Three presidents took his calls." | Show the power |
| 36 | "She was extremely ambitious." | "At nineteen, she dropped out of Stanford. At thirty, she was a billionaire on paper." | Facts, no mind-reading |
| 37 | "The CEO was a controversial figure." | "Half the board wanted him gone. The other half owed him their jobs." | Specific tension (sourced) |
| 38 | "He probably felt betrayed." | "He never said how he felt. He sold every share the next morning." | No mind-reading; action instead |
| 39 | "The government was spying on its citizens." | "A court found the F.B.I. had misused the database two hundred and seventy-eight thousand times." | Attributed finding (the figure Fern closes on; verify the ruling) |
| 40 | "Experts say the technology is dangerous." | "Its own safety team wrote, in twenty twenty-three, that it 'could be misused'." | Named source, quote |
| 41 | "He scammed thousands of people." | "Prosecutors say he took money from about four thousand investors. He denies it." | Status + response |
| 42 | "The company is basically a monopoly." | "Nine out of ten searches go through it. The regulator called it a monopoly in court." | Data + attribution |

### Endings and chapter ends (43–50)

| # | Before | After | Fix |
|---|---|---|---|
| 43 | "And that's the story of how X happened." | "The building is still there. The lights are still on. Nobody works inside." | Return to the opening image |
| 44 | "Only time will tell what happens next." | "The next filing is due in March. We'll be reading it." | Concrete, dated |
| 45 | "Thanks for watching, see you in the next one!" | (cut; end on the button) | Abrupt ending |
| 46 | "In conclusion, this shows the importance of regulation." | "The law that would have stopped it is still in committee." | Implication, not moral |
| 47 | "This chapter showed how the company grew." | "It had everything. Except a reason to exist." | Chapter ends on a hook |
| 48 | "It's a fascinating story with many lessons." | "Every company in this story is still in business. Except one." | Final reversal |
| 49 | "So what do you think? Let me know in the comments." | "So the real question isn't whether it's legal. It's who decided it should be." | Leave the loop the viewer carries away |
| 50 | "As we've seen, the situation is very complex." | "Nobody planned it. That's what makes it hard to stop." | One clear thesis |

---

## 6. The edit pass (run on every SCRIPT.md)

1. Search the banned lists (§2) and rewrite each hit.
2. Highlight every "and then", "also", "additionally": convert to but/therefore or cut.
3. Highlight every weak verb (is, has, makes, does, gets, goes, there is/are): replace half of them
   with §1.1 verbs.
4. Check every number against §4 and `script-patterns.md` §3.2.
5. Read each chapter's last line: it must be a question or a reversal, never a summary.
6. Count sentences per minute and the short-sentence quota (§3, rhythm budget).
7. Render one chapter with the project voice and listen. If the voice stumbles twice on a line,
   rewrite it.
