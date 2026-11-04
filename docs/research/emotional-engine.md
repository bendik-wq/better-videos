# Emotional engine: how great retention videos make you feel, then make you wait

The structure docs say **where** the beats go: `script-patterns.md` (seven story spines, open
loops, stair-stepping, but/therefore), `hooks.md` (cold opens, re-hooks R01–R50, buttons),
`retention-playbook.md` (metrics, the MrBeast memo, the 16-minute template) and
`video-autopsies/README.md` (what 70 winners actually do). This file covers the layer under
them: **what the viewer feels, beat by beat, and why the pull toward "what's next" works.** It
ends with a scoreable checklist and the **beat annotation format** that
`studio/critic/script_critic.py` reads.

Researched 2026-11-04. Trust labels as in the playbook: **[science]** is a peer-reviewed study
(the effect is real in the lab; the step to YouTube is our inference), **[official]**,
**[memo]**, **[practitioner]**, **[vendor]**, **[observed]** (our autopsies) and **[house]**.
Numbers that a company or creator reports about itself, with no method we could check, are
marked **unverified**.

---

## 1. The science, in seven findings

Use these to reason about a script, not to decorate it. "Dopamine hit" is a metaphor; the
studies below are about prediction, uncertainty and memory, and none of them measured YouTube.

| # | Finding | Source | What it means for a script |
|---|---|---|---|
| 1 | **Curiosity is a felt gap.** Curiosity arises when attention is drawn to a specific gap between what you know and what you want to know; it feels like a deprivation the answer relieves. It needs a little knowledge first: you can't be curious about a gap you can't see. | Loewenstein, "The psychology of curiosity", *Psychological Bulletin* 1994 ([record](https://stafforini.com/works/loewenstein-1994-psychology-curiosity-review/)) [science] | Give the viewer **enough** to see the shape of the missing piece, then withhold the piece. A vague tease ("something shocking happened") opens no gap. |
| 2 | **Curiosity peaks at medium confidence** and predicts memory. In trivia studies, curiosity was highest when people were moderately sure of the answer; curiosity activated reward areas (caudate), and highly curious answers were remembered better. | Kang et al., "The wick in the candle of learning", *Psychological Science* 2009 ([eScholarship PDF](https://escholarship.org/content/qt2zd605r7/qt2zd605r7.pdf?t=rttpgp)) [science] | The best questions are ones the viewer **thinks** they can answer. Let them half-guess ("predict, then reveal", `script-patterns.md` §2.9), then pay off with a twist on their guess. |
| 3 | **Curiosity states help people remember even unrelated material** shown during the wait, via the dopaminergic midbrain → hippocampus circuit. | Gruber, Gelman & Ranganath, *Neuron* 2014 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/)) [science] | Put the dense explanation (the "lull", memo) **inside** an open loop, never after the loop closes. The open question carries the mechanism. |
| 4 | **Information is its own reward.** Monkeys paid (in water) to learn early what reward was coming, even though knowing changed nothing; the same dopamine neurons coded both. Kidd & Hayden frame curiosity as a drive state for information. | Bromberg-Martin & Hikosaka, *Neuron* 2009 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/2723053)); Kidd & Hayden, *Neuron* 2015 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4635443)) [science] | A pure information payoff (the document, the number, the name) is a real reward. Our "wow" beats don't need explosions (autopsy pattern 4 agrees). |
| 5 | **Anticipation is coded by uncertainty.** Dopamine neurons fire on reward *prediction error* (better or worse than expected), and a separate sustained signal **ramps up during the wait**, largest when the outcome is a coin flip (p = 0.5). | Schultz, Dayan & Montague, *Science* 1997; Fiorillo, Tobler & Schultz, *Science* 2003 ([PubMed](https://pubmed.ncbi.nlm.nih.gov/12649484/)) [science] | Suspense needs a **genuinely open outcome**. If the viewer is sure how it ends, the wait is dead time. Keep two plausible answers alive ("Was it fraud, or just incompetence?"). Surprise = the gap between expectation and outcome, so set the expectation first. |
| 6 | **Suspense and surprise are different products.** Suspense is high when the *next* moment could swing beliefs a lot; surprise is how far beliefs actually moved. | Ely, Frankel & Kamenica, "Suspense and Surprise", *JPE* 2015 ([RePEc](https://econpapers.repec.org/RePEc:ucp:jpolec:doi:10.1086/677350)) [science] | Hitchcock's bomb under the table: tell the viewer the stakes (suspense) **or** hide them (surprise), on purpose, per beat. Most of a documentary should run on suspense; spend surprises at the peaks. |
| 7 | **Memory of an experience is peak + end.** Viewers' overall ratings of film clips tracked the most intense moment and the final moment; duration barely mattered. | Fredrickson & Kahneman, *JPSP* 1993 ([PDF](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/fredr-kahneman-jpsp1993.pdf)) [science] | What viewers remember (and recommend) is the **biggest peak and the last 30 s**. Put the strongest peak late and end on a high note, then stop (memo: abrupt endings). |

**Story-shape research** (big corpora, real outcomes):

- **Six emotional arcs.** Sentiment trajectories of ~1,300 Project Gutenberg novels cluster into
  six shapes: rise, fall, fall-rise ("man in a hole"), rise-fall ("Icarus"), rise-fall-rise
  ("Cinderella"), fall-rise-fall ("Oedipus"). The abstract says some arcs get more downloads; secondary write-ups
  name Icarus, Oedipus and man-in-a-hole as the most downloaded (**check the paper's own figure
  before quoting the order**). Reagan et al., *EPJ Data Science* 2016
  ([arXiv](https://arxiv.org/abs/1606.07772)) [science]. **For us:** the arcs with *more than one
  turn* win. Rise-and-fall spines (`script-patterns.md` §1.2) are Icarus; investigations are
  usually man-in-a-hole.
- **Fast stories are liked more.** Across ~50,000 film, TV and academic texts, "speed" (how far
  each segment moves from the last) predicted liking for films and TV, while "volume" (how much
  ground is covered) hurt TV. Toubia, Berger & Eliashberg, *PNAS* 2021
  ([RePEc](https://econpapers.repec.org/RePEc:nas:journl:v:118:y:2021:p:e2011695118)) [science].
  **For us:** every beat must *move* the story; don't widen the topic.
- **Narratives share a three-process shape:** staging (scene-setting words) early, plot
  progression in the middle, and **cognitive tension** (words like *think, believe, cause*)
  rising toward the climax. Fact-driven genres (TED talks, news) follow their own variants, and
  matching the norm did not predict popularity. Boyd, Blackburn & Pennebaker, *Science Advances*
  2020 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7413736)) [science]. **For us:** the
  "why/how" reasoning belongs late, near the climax, not in the first minute.
- **High arousal spreads.** NYT articles evoking awe, anger or anxiety were shared more; sadness
  (low arousal) less, even controlling for usefulness and surprise. Berger & Milkman, *JMR* 2012
  ([PDF](https://cssh.northeastern.edu/pandemic-teaching-initiative/wp-content/uploads/sites/43/2020/09/What-Makes-Online-Content-Viral.pdf))
  [science]. **For us:** peaks should be **awe, indignation or unease**, not pity.
- **A dramatic arc moves bodies; a flat telling doesn't.** In Paul Zak's lab, a story with a
  rising tension arc raised cortisol and oxytocin and predicted donations; a flat version of the
  same story did not ([Cerebrum 2015, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4445577))
  [science, single lab; oxytocin results have replication concerns]. Treat it as support for
  "tension first, then the person", not as a number.

---

## 2. The emotional beats of a documentary

Every beat in a script does one of these jobs. The **kind** goes into the annotation (§7).

| Kind | What the viewer feels | Device (see `script-patterns.md`, `hooks.md`) | Typical intensity |
|---|---|---|---|
| `setup` | orientation, mild curiosity | dated present-tense scene, the object, the person | 1–2 |
| `stakes` | concern, unease: "this matters to me" | money/power/safety/the viewer's life; stair-step (§2.2) | 3–4 |
| `complication` | tension: "that shouldn't happen" | "but…", the anomaly, the missing thing | 2–3 |
| `escalation` | rising dread or excitement | stair-step a level up; ticking clock | 3–4 |
| `reversal` | surprise, sometimes indignation | everything you assumed was wrong; the villain is the victim | 4–5 |
| `revelation` | awe, shock, "aha" | the document, the computed number, the hidden origin, the mechanism made simple | 4–5 |
| `release` | relief, amusement, breath | ma (rules.md #32), dry humour, a callback | 1–2 |
| `payoff` | satisfaction, vindication | closes L1 with something the viewer couldn't have guessed but now sees was inevitable | 4–5 |
| `button` | resonance, a last shiver | widen to the viewer, return to the opening, honest open question (autopsy pattern 8) | 3–4 |

**The four peak kinds** are the autopsy's replayed moments: mechanism made simple, computed
comparison, single clue or primary record, hidden origin (`video-autopsies/README.md`
pattern 4). An intensity-5 beat should be one of them **plus** a personal consequence: the number
alone is a 4; the number and who it ruined is a 5 [house].

### 2.1 Emotion vocabulary (closed list)

Use exactly these words in annotations, so the critic and reviewers speak one language. Arousal is
how activating the feeling is (Berger & Milkman's dimension). Pick the word for what the
**viewer** feels, not the people on screen.

| Word | Valence | Arousal | Use for |
|---|---|---|---|
| `curiosity` | + | low–mid | setups, questions, the default between peaks |
| `intrigue` | + | mid | an anomaly with a promise of an answer |
| `unease` | − | mid | something is off; slow dread |
| `tension` | − | mid–high | an outcome is open and matters (suspense) |
| `dread` | − | high | the bad outcome is coming and we know it |
| `surprise` | ± | high | a belief just moved (reversal) |
| `shock` | − | high | a reversal with harm attached |
| `awe` | + | high | scale, ingenuity, the impossible made real |
| `indignation` | − | high | injustice, someone got away with it (anger, the shareable kind) |
| `empathy` | ± | mid | one person's cost; a zoom-in (§2.8 in `script-patterns.md`) |
| `sadness` | − | low | use sparingly: it lowers arousal and sharing |
| `relief` | + | low | a release beat after a peak |
| `amusement` | + | mid | irony, absurdity, picture contradicts VO |
| `satisfaction` | + | mid–high | a loop closes cleanly |
| `vindication` | + | high | the viewer's suspicion turns out right; justice |
| `hope` | + | mid | a way out appears (usually in the last act) |

### 2.2 Intensity scale (1–5)

Rate how strongly a **first-time, moderately interested viewer** would feel it. Calibrate with
these anchors:

| Level | Anchor | Example |
|---|---|---|
| 1 | Neutral information; you'd skim it in an article | "The port handles about a fifth of the world's oil." |
| 2 | A mild question or a nice image; you'd keep watching but not lean in | "But the ships kept slowing down here." |
| 3 | You lean in: a clear question with stakes, a strong image, a stair-step | "If it closes for a week, petrol in Oslo doubles." |
| 4 | You'd tell someone: a reversal, a revelation, a computed number with a consequence | "The insurer had priced this exact scenario, three years earlier." |
| 5 | You replay it or say "no way" aloud: the twist that reframes the whole video, the document that proves it, the payoff | "The email was sent by the man who later investigated it." |

Rules: at most **one 5 per 4 minutes**; two 5s in a row cancel each other (no contrast) [house].
A 5 must be earned by the setups before it (§4).

---

## 3. The shape over time: pacing the peaks

What the evidence gives us:

- The memo plans re-engagements at about **3:00 and 6:00** and warns that viewers settle into a
  "lull" after minute 6 [memo] (`retention-playbook.md` §2).
- Winners' replayed peaks are **spread across the whole runtime**, most often in the middle
  40–60%; there is no single wow minute, so plan two or three [observed] (autopsy table A).
- Heat is front-loaded in 53 of 64 winners; the exceptions **rise at the end because of a late
  reveal** [observed].
- Memory is peak + end (finding 7) [science].
- Turn words land every ~27 s in winners (median), so the small "but" turns sit **between** the
  emotional peaks [observed].

**House pacing targets** (what `script_critic.py` enforces, and why):

| Unit | Target | Critic check |
|---|---|---|
| Micro-turn (a question, "but", a small reveal) | every **30–40 s**, never > 45 s | `rehooks` (≤ 40 s) |
| Emotional peak (intensity ≥ 4) | every **2–3 min**; never > 3 min apart | `emotion` (> 180 s is a fail) |
| Release after a peak (intensity drops ≥ 1) | within **15–45 s** of the peak | `emotion` flat check (> 90 s at one level) |
| Intensity-5 beats | **2–3 per video**: the twist (~65–75%), the payoff (last 15%), optionally the 3:00 or 6:00 wow | biggest peak in the last third |
| Biggest peak | in the **last third**, and the button within 60 s after it | `emotion` |
| Open loops | 2–4 open at all times; never zero before the last 8% | `loops` |

**Peak plan by length** [house, check against retention graphs after 3–5 uploads]:

| Length | Peaks ≥ 4 | Of which 5s | Where (minutes) |
|---|---|---|---|
| 12 min | 5–6 | 2 | 0:20 (hook), ~2:30, ~5:00, ~7:30, ~8:40 (twist, 5), ~11:00 (payoff, 5) |
| 16 min | 6–7 | 2–3 | 0:20, ~3:00, ~6:00 (wow, maybe 5), ~8:30, ~11:00 (twist, 5), ~13:30, ~15:00 (payoff, 5) |
| 20 min | 8–9 | 3 | 0:20, ~3:00, ~6:00, ~8:30, ~11:00, ~13:30 (twist, 5), ~16:00, ~18:30 (payoff, 5); the middle third needs one zoom-in `empathy` peak to break the lull |

**The curve to draw** is a sawtooth that climbs: each peak a little higher than the last
(stair-stepping, memo), with a release after each so the next peak has contrast. Plot it from the
critic's `emotion curve` line; if it looks like a flat line with spikes, the middle needs
escalation; if it climbs without dips, viewers tire and nothing feels big [house].

---

## 4. The curiosity economy: setups and payoffs

An open loop is a promise; a setup is a deposit that a later payoff withdraws. Both need a
ledger. The open-loop ledger is already defined (`retention-script` §6, `script-patterns.md`
§2.1). Add a **setup ledger** next to it.

### 4.1 Loop types

| Type | Lifetime | Example | Notes |
|---|---|---|---|
| **L1, the spine** | whole video | "How do you rob a central bank?" | Opened by 0:30, closed in the last 15%. Restate it at least once per chapter in sharper words. |
| **Chapter loop** | 2–4 min | "So who signed the order?" | Close it at the chapter's peak; open the next one in the same breath. |
| **Micro loop** | 10–60 s | "Keep that number in mind." / predict-then-reveal | The workhorse of the 30–40 s turns. |
| **Planted detail (setup)** | any | an object in the cold open, a throwaway name in Ch.1 | Not a question yet. It becomes a payoff when it returns with new meaning (callback, `script-patterns.md` §2.4). |

**Note for the critic:** `script_critic.py` deducts 8 points for any loop open longer than 6 min,
including L1. L1 is meant to stay open; accept that one deduction, or exempt L1 in the critic.

### 4.2 Setup ledger (write it in the outline)

| ID | Planted at | What (image, line, number, name) | Paid off at | New meaning on payoff |
|---|---|---|---|---|
| S1 | 0:08 | the cracked phone on the desk | 14:20 | it was the phone that recorded the call |
| S2 | 2:40 | "a junior analyst named Ruiz" | 11:05 | Ruiz is the whistle-blower |

Rules [house, from `script-patterns.md` §2.4 and Chekhov's gun]:

- Every payoff of intensity ≥ 4 must have at least one **setup at least 3 minutes earlier**. A
  twist with no plant feels like cheating; a plant with no payoff is clutter.
- 3–6 setups per video; every one paid off. A setup paid off within 60 s is a micro loop, not a setup.
- The viewer should be able to rewatch and see the clue was fair (the "inevitable in hindsight"
  test of a good payoff).

### 4.3 The chain: "but / therefore", never "and then"

Every link between beats is a complication (**but**) or a consequence (**therefore**), from Parker
and Stone (`script-patterns.md` §2.3). Add the emotional rule [house]:

- A **but** link should raise intensity or flip valence (unease → surprise).
- A **therefore** link may hold or lower intensity (it explains), but it must open or sharpen a
  question.
- An **and then** link changes nothing in the viewer's feelings or questions. Cut it or merge it.

Annotate the link on each beat (`link: but` / `link: therefore`, §7) so a reviewer can scan the
chain.

### 4.4 Anticipation tools (how to make the wait itself feel good)

From findings 4–6:

1. **Name the payoff, not the answer** ("by the end you'll know who was on the other side of the
   glass", `script-patterns.md` §2.1).
2. **Keep two live hypotheses.** Uncertainty, not mystery, drives anticipation (Fiorillo). State
   both: "Either the bank knew, or nobody did. Both are bad."
3. **Show the clock.** A deadline the viewer can see turns waiting into suspense (rules.md #28).
4. **Tell the viewer about the bomb** (suspense) when you want them to lean in for minutes; **hide
   it** (surprise) for the one beat you want them to replay.
5. **Let them guess** (Kang): "Before I tell you the number, guess." Then beat their guess.
6. **Delay with value.** Every second of delay must deliver new information
   (`script-patterns.md` §2.9, progressive novel information), or the wait reads as stalling.
7. **Pay off bigger than promised.** A payoff smaller than the tease is a prediction error in the
   wrong direction; viewers leave and don't come back (the memo's "yellow castle that turns out
   red" applies inside the video too).

---

## 5. How practitioners apply it

- **MrBeast memo** [memo, authenticity unconfirmed]: the stated goal for minutes 3–6 is to make
  viewers "fall in love with the story" and the people in it; stakes "get higher" deeper in the
  video; don't signal the end except to hype the payoff, and end abruptly
  ([mirror](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/)). Our
  translation: one person to care about per chapter (a zoom-in), escalating stakes, payoff last.
- **Paddy Galloway** [practitioner, secondhand]: idea, thumbnail and retention are the three
  levers; he credits retention to story rather than fast cuts, and to writing 3–4 intros and
  listening back ([Creator Science](https://podcast.creatorscience.com/paddy-galloway/),
  [interview digest](https://recapio.com/digest/meet-mrbeast-s-secret-youtube-consultant-paddy-galloway-interview-by-jon-youshaei)).
  Read the retention graph for "danger zones" and design the next script around them.
- **Retention Rabbit** [vendor, **unverified**]: an AI retention-prediction tool
  ([site](https://www.retentionrabbit.com/blog)). Its "2025 benchmark report" is quoted at second
  hand as 10,000+ videos across 75+ niches: average retention **23.7%**, **55%+ leave in the first
  minute**, and videos with 65%+ first-minute retention getting **58% higher AVD**
  ([tubelab summary](https://tubelab.net/blog/youtube-audience-retention)). The original report URL
  returned 404 on 2026-11-04 and no method is published. Use it only as a reminder that the first
  minute and the first peak decide most of the graph.
- **Johnny Harris** [practitioner, secondhand]: the title/thumbnail "promise" is the spine; he
  alternates "feeling" scenes and "thinking" scenes, with different music for each, to keep
  engagement ([How I Write digest](https://recapio.com/digest/why-every-johnny-harris-video-goes-viral-by-david-perell)).
  That is our peak/release alternation, said by a maker. Autopsies: `johnnyharris.md`.
- **Fern** [observed, `fern.md`]: dated present-tense cold opens, a three-question stack at
  ~1:00 that becomes the chapters, and peaks on primary records. The emotion is cold and
  procedural: unease → dread → indignation, rarely sadness. That palette suits our channel.

---

## 6. Failure modes (and the fix)

| Symptom | Likely cause | Fix |
|---|---|---|
| Slow slide through the middle | flat intensity (2–3) for > 90 s; information without a question | open a chapter loop; add a zoom-in `empathy` beat or a stair-step |
| Cliff right after a peak | the peak closed the only open loop | close one, open one (`script-patterns.md` §2.1) in the same beat |
| Viewers skip the twist | the twist wasn't set up; nothing to reframe | plant S-items ≥ 3 min earlier (§4.2) |
| The ending feels small | biggest peak in the middle; recap ending | move the strongest reveal into the last third; end on a button within 60 s |
| "Manipulative" comments | emotion asserted, not earned ("shocking", "terrifying") | show the evidence and let the viewer feel it; banned words in `narration-style.md` §2.2. YouTube also demonetises "emotionally manipulative" templates (`anti-ai-look.md` §1) |
| Monotone dread | every peak the same emotion | rotate: awe, indignation, surprise, empathy; a release with amusement |

---

## 7. Beat-level annotation format (read by `studio/critic/script_critic.py`)

Put one HTML comment **on its own line above each beat** in `SCRIPT.md`:

```
<!-- beat: <name> | emotion: <word> <1-5> | open: L2 | close: L1 | plant: S1 | pay: S2 | kind: <kind> | link: <but|therefore> -->
```

| Field | Required | Format | Read by the critic? |
|---|---|---|---|
| `beat` | yes | short name, no `|` or `-->` | yes (the beat name in reports) |
| `emotion` | yes | one word from §2.1, a space, an integer 1–5 (§2.2) | yes: intensity drives the peak/flat checks |
| `open` | when a question opens | comma-separated loop IDs `L1, L2…` | yes (loop ledger) |
| `close` | when a question closes | comma-separated loop IDs | yes |
| `plant` | when a setup is planted | comma-separated setup IDs `S1, S2…` (§4.2) | no (for reviewers; kept out of `open` so long-lived setups don't trip the critic's 6-minute loop check) |
| `pay` | when a setup pays off | comma-separated setup IDs | no (for reviewers) |
| `kind` | recommended | one of §2: `setup stakes complication escalation reversal revelation release payoff button` | no (for reviewers) |
| `link` | recommended | `but` or `therefore`: how this beat follows the previous one | no (for reviewers) |

Rules:

- **Omit** `open`/`close`/`plant`/`pay` when nothing opens or closes. Never write `-` or `none`: the critic
  would read it as a loop ID that is never closed.
- One annotation per beat; a beat is 15–60 s of narration (2–8 lines). The critic times beats at
  the script's wpm, so its peak spacing follows your annotations.
- Once any beat is annotated, `##` headings no longer start beats; annotate every beat.
- The `[↺]` re-hook marks and `**(opens L1)**` inline marks from `retention-script` still work and
  can be mixed in.

Example (opening of a 16-minute investigation; a drafting illustration, re-source every fact):

```markdown
<!-- beat: cold open | emotion: intrigue 3 | open: L1 | plant: S1 | kind: setup -->
It's February 2016. A printer in Dhaka stops working on a Friday morning.
Nobody notices that the paper it was meant to print is missing. [↺]

<!-- beat: the number | emotion: shock 4 | open: L2 | kind: stakes | link: but -->
By Monday, eighty-one million dollars has left the central bank of Bangladesh.
How do you rob a central bank, and why did a printer matter?

<!-- beat: who noticed | emotion: curiosity 2 | kind: setup | link: therefore -->
To answer that, you have to start with the one person who did notice.

<!-- beat: the typo | emotion: surprise 4 | close: L2 | open: L3 | kind: reversal | link: but -->
And what stopped the rest of the theft wasn't security. It was a spelling mistake.
```

`python3 studio/critic/script_critic.py projects/<slug>/SCRIPT.md` then prints the emotion curve
(e.g. `3 4 2 4 …`) and flags gaps between peaks, flat runs, unclosed loops and a missing late
climax.

---

## 8. Scoreable checklist (the reviewer's emotional pass, 100 points)

Run it after `script_critic.py` passes, reading the script **cold**, as a viewer. Each item is
pass (full points) or fail (0) unless a range is given. **Ship at ≥ 80 with every gate passed.**

| # | Check | Pts |
|---|---|---|
| G1 | **Gate:** every beat is annotated in the §7 format with a word from §2.1 | pass/fail |
| G2 | **Gate:** every loop and setup opened is closed; L1 closes in the last 15% | pass/fail |
| G3 | **Gate:** no emotion is asserted that the facts don't earn (no "shocking", "terrifying" in VO for a 2-intensity fact) | pass/fail |
| 1 | The hook reaches intensity ≥ 3 by 0:20 and opens L1 as a question the viewer could repeat | 8 |
| 2 | Peaks (≥ 4) are ≤ 3 min apart throughout; count matches the §3 table for the length | 10 |
| 3 | Each peak is followed by a release (≥ 1 lower) within 45 s, and the next peak tops the previous one in stakes or scale | 8 |
| 4 | The biggest peak is in the last third, and a button lands within 60 s after it; no recap | 8 |
| 5 | 2–3 intensity-5 beats, each one of the four peak kinds **plus** a human consequence | 8 |
| 6 | 2–4 loops open at every point before the payoff; nothing closes without something opening | 8 |
| 7 | 3–6 setups planted ≥ 3 min before their payoffs; each payoff changes the setup's meaning | 8 |
| 8 | Every link reads as `but` or `therefore`; 0 "and then" links (−2 per link, min 0) | 8 |
| 9 | Suspense is real: at each chapter's start, two outcomes are still plausible and stated | 6 |
| 10 | At least 4 different emotion words among the peaks; high-arousal (awe, indignation, shock, surprise, tension) outnumber low (sadness) | 6 |
| 11 | At least one zoom-in `empathy` beat in the middle third (one person, one cost) | 5 |
| 12 | The mechanism/explainer stretch sits inside an open loop, not after it closes | 5 |
| 13 | The payoff is bigger or stranger than the hook promised (not smaller, not the same) | 6 |
| 14 | The return line after the sponsor read is a re-hook at intensity ≥ 3 (autopsy pattern 1) | 6 |

Report format (one line per finding, so `studio` can fold the top 3 into the script):

```
emotional-pass 84/100  gates: G1 ok, G2 ok, G3 ok
- #3 fail 7:10 peak (shock 4) followed by 70 s at 3 — add a release beat
- #8 −2 "and then" at 9:40 and 12:05
```

---

## 9. Sources (accessed 2026-11-04)

Science: Loewenstein 1994 (*Psychological Bulletin* 116:75–98); Kang et al. 2009 (*Psychological
Science* 20:963–973); Gruber, Gelman & Ranganath 2014 (*Neuron* 84:486–496); Kidd & Hayden 2015
(*Neuron* 88:449–460); Bromberg-Martin & Hikosaka 2009 (*Neuron* 63:119–126); Schultz, Dayan &
Montague 1997 (*Science* 275:1593–1599); Fiorillo, Tobler & Schultz 2003 (*Science* 299:1898–1902);
Ely, Frankel & Kamenica 2015 (*JPE* 123:215–260); Fredrickson & Kahneman 1993 (*JPSP* 65:45–55);
Reagan et al. 2016 (*EPJ Data Science* 5:31); Toubia, Berger & Eliashberg 2021 (*PNAS*
118:e2011695118); Boyd, Blackburn & Pennebaker 2020 (*Science Advances* 6:eaba2196); Berger &
Milkman 2012 (*JMR* 49:192–205); Zak 2015 (*Cerebrum*, PMC4445577). Links inline.

Practice: the MrBeast memo mirror (alexanderjarvis.com); Creator Science and Jon Youshaei
interviews with Paddy Galloway (secondhand digests); Retention Rabbit site and the tubelab.net
summary of its report; the How I Write episode with Johnny Harris (secondhand digest); our
`docs/library/video-autopsies/`.
