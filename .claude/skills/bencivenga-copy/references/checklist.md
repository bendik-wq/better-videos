# Bencivenga critic rubric (0–10)

Every critic, human or agent, scores copy with this file. Score **each candidate separately**,
show the sub-scores, and name the single change that would add the most points. Copy that fails a
**gate** scores 0 whatever the sub-scores say.

The structure follows Bencivenga's Persuasion Equation scoring (25 points per part, `sources.md`
S1), rescaled to 10 and weighted towards proof, because his central rule, in his own newsletter,
is never to make the claim bigger than the proof (S16, Bullets 3 and 7).

**Evidence status of the numbers in this file.** The rubric's *structure* is his. The
*thresholds* (≥ 8 to ship, 90 s, 0:12 and so on) are **[house] and uncalibrated**: as of
2026-11-05 no episode's CTR, AVD or Test & Compare result is logged in this repo, so no
threshold has been checked against our own data. §10 says what each one rests on and how we
calibrate it.

---

## 0. How this rubric combines with `packaging` and `retention-script`

There are two title rubrics and two hook rubrics. They measure different things, so **both run,
and neither replaces the other**:

| Asset | Selection score (ranks candidates) | Believability score (this file) | Rule |
|---|---|---|---|
| Title | `packaging` Step 2, /10 (gap, concrete noun, length, accuracy, clarity) | §2, /10 (itch, unique promise, built-in proof, specificity, ease) | Keep a title only if **P ≥ 7 and B ≥ 7**. Rank the survivors by **P + B** (/20); break ties on B's sub-score C (built-in proof). Gates from both apply |
| Hook | `retention-script` §3 hook score, /25, ≥ 20 | §3, /10, ≥ 8 | Both thresholds must pass. Timings: `retention-script`'s anatomy governs 0:00–1:00; this file's five slots sit inside its first 30 s (image = slot 1, lean = slot 2, turn = slots 3–4, loop = slot 5) |
| Script | `retention-script` self-check, /100, ≥ 90 | §6 Persuasion Equation audit | Both must pass; §6 failing sends the *idea* back, the self-check sends the *draft* back |

Where the two disagree on a rule (not a score), the stricter rule wins. Length is the same in
both (≤ 50 characters, never over 60).

---

## 1. Gates (any fail → score 0, rewrite)

| Gate | Fails when |
|---|---|
| **G1 Accuracy** | Any fact, number **or implication** (a causal link, a total, a stale value) isn't in the research pack at the required source tier (`fact-check-playbook.md`). Claims about what people believed or felt need a source too |
| **G2 Proof ≥ claim** | The claim is bigger than what the video shows on screen. A title must be backed by 0:30 (`packaging` Step 4) and settled by the end |
| **G3 Paid curiosity** | The video doesn't resolve the gap it opens (title), or a cliffhanger isn't paid before the next one opens |
| **G4 No hype** | Any word from `narration-style.md` §2.2, caps-lock adjectives, emoji, "SHOCKING"-style bait, exclamation marks in titles (S16 Bullet 3: they add "the aroma of hype") |
| **G5 Original** | Reuses another creator's wording, title, series tag, character, mascot, palette signature or footage, or fails the shape test (§9) |
| **G6 Safe** | Defamation or privacy risk not handled per `fact-check-playbook.md` §5; an invented threat to the viewer |

---

## 2. Titles (and title + thumbnail-text pairs)

Score five sub-scores; their maxima differ (C carries the most weight because proof does).

**A. Urgent problem / itch (0–2)**
- 0: a topic label ("The Halifax Explosion")
- 1: a mild question
- 2: a gap the viewer feels now, about a thing they can picture

**B. Unique promise (0–2)**
- 0: could title any video on the topic
- 1: some angle, but predictable (S16 Bullet 23: predictability kills curiosity)
- 2: an angle only this video has (record, mechanism, person, twist); can't be guessed

**C. Built-in proof (0–3)**
- 0: pure assertion; "yeah, sure"
- 1: plausible but unsupported
- 2: one proof cue inside the title or the pair (exact number, date, named authority, a picture
  of the proof on the thumbnail)
- 3: two proof cues, and the cynic's "yeah, sure" doesn't form

**D. Specificity (0–2)**
- 0: adjectives, vague nouns
- 1: one concrete noun or number
- 2: concrete nouns plus an exact number/unit or a name; every word earns its place

**E. Easy to say yes (0–1)**
- 0: jargon, over 50 characters, or needs context
- 1: ≤ 50 characters, plain words, the hook survives a mobile cut (the first ~30 characters carry
  the itch; `SKILL.md` Workflow A step 7)

**Total /10.** Keep for the long list at **≥ 7**; the A/B pair needs **≥ 8** (both [house]).

Anchors:
- **2/10** *The Tunguska Event Explained* (A0 B0 C0 D1 E1: a label; "explained" is the only gap).
- **5/10** *The Mysterious Siberian Explosion* (A1 B1 C0 D2 E1: "mysterious" is an adjective doing
  the work; no proof cue).
- **9/10** *80 Million Trees Fell. No One Found a Crater.* (A2 B2 C2 D2 E1: the counter-intuitive
  pair is itch and unique promise; the number is one proof cue and the thumbnail **NO CRATER** a
  second, but C stays at 2 because the Lake Cheko candor beat is needed for the title to stay
  true. The first draft, *Nothing Hit the Ground*, scored 0: G1, it denies a live hypothesis.)

---

## 3. The 30-second hook

| Sub-score | Points | Scoring |
|---|---|---|
| **A. Confirms the click** | 0–2 | 2: the first frame and line show what the title/thumbnail promised (date, place, action, or for an explainer a drawable claim). 1: by 0:10. 0: later |
| **B. Proof early** | 0–3 | 3: a primary record, demonstration or computed comparison is **on screen with its source card by 0:12** (the end of slot 2). 2: on screen by 0:20. 1: narrated but not shown, or after 0:20. 0: none in the hook |
| **C. Pre-empted objection** | 0–1 | The viewer's doubt is voiced and answered (or candidly bounded) |
| **D. Unique twist** | 0–2 | 2: a fact that makes this story different from the one the viewer thinks they know. 1: the familiar version told well |
| **E. Contract** | 0–1 | Ends on 2–3 questions or one stake that the chapters will pay |
| **F. Economy** | 0–1 | ≤ 80 words, no sentence over 25 words, no banned opener, and no more than 2 statistics the viewer must *remember* (dates don't count; a single number ladder counts as one, see §10) |

Ship threshold **≥ 8** [house]. Anchor (every fact in it is in the research pack's wording or
marked):

> **9/10** "[card: 21 AUG 1986 · NYOS, CAMEROON] August 1986. A valley in Cameroon goes to sleep.
> By morning, more than seventeen hundred people in it are dead. [toll on screen + source card:
> the official count `[verify]`] Nothing burned. Nothing fell. It sounds like a legend, so here's
> the record: [the 1987 scientific investigation on screen, e.g. Kling et al., *Science*
> `[verify]`] the killer came out of a lake, and it was invisible. So what was in the water? Why
> did it come out that night? And why are engineers still pumping it out today `[verify the
> degassing pipes]`?"
> (A2 B3 C1 D1 E1 F1 = 9: about 70 words; the toll card and the report are on screen by about
> 0:10. D gets 1 because "an invisible gas from a lake" is the version most viewers who know the
> story already know; a twist from the research pack, such as the cloud's speed downhill or the
> reason that night, would make it 10.)

**Why the old anchor was replaced:** it said "the scientists who arrived that week thought so
too", an unsourced claim about what people believed. That fails G1, so a critic calibrating on it
would have learned to pass invented proof. The anchor itself must model proof ≥ claim.

---

## 4. Chapter cliffhangers and re-hooks (score each)

| Sub-score | Points | Full marks when |
|---|---|---|
| **A. Specific hidden payload** | 0–3 | One exact answer is coming ("on page 41", "it wasn't the engine"), not a vague "but things were about to change" |
| **B. Believability** | 0–2 | Anchored in a record, a person or a number the viewer has already seen |
| **C. Stakes rise** | 0–2 | The payoff matters more than the last one (scale, danger or reversal) |
| **D. Paid fast** | 0–2 | 2: paid within 90 s. 1: within 3 min (a chapter loop, `retention-script` §6). 0: later or never |
| **E. Variety** | 0–1 | A different shape from the previous cliffhanger (`fascinations.md` §4) |

Ship threshold **≥ 7**; the sponsor-return line **≥ 9** (both [house]; the sponsor-return weight
rests on `video-autopsies/README.md` §B1, [observed]).

---

## 5. On-screen proof beats (score each major claim)

| Sub-score | Points | Full marks when |
|---|---|---|
| **A. Proof matches the claim's size** | 0–3 | The bigger the claim, the stronger the evidence: official record or measurement for hard numbers, named witness for experiences |
| **B. Visible** | 0–2 | Shown (document, demonstration, comparison), not only narrated, and readable in ≤ 2 s |
| **C. Sourced on screen** | 0–2 | A source card (who, what, when) is on screen while the claim is spoken |
| **D. Reason why** | 0–2 | The mechanism or *because* comes with the fact (S16 Bullets 9–10) |
| **E. Candor** | 0–1 | Uncertainty or dispute is stated where it exists (S16 Bullet 3: "candor is gloriously effective") |

Ship threshold **≥ 7** for every claim used in the title, thumbnail or hook.

---

## 6. Full script pass (the Persuasion Equation audit)

Bencivenga's rule, from his own site (S1): give each part 25 points, and **subtract 25 for any
part that is not as strong as it can be**. It's a binary test per part, and it's strict on
purpose: "present but weak" loses the full 25, the same as "missing".

| Part | 25 or 0 | It's "as strong as can be" when the critic can name **no concrete improvement available from the research pack** to… |
|---|---|---|
| Urgent problem | | …make the first minute's need for the answer stronger, or tie the stake closer to the viewer |
| Unique promise | | …make the video more different from the top 3 videos on this topic |
| Unquestionable proof | | …strengthen any title/thumbnail/hook claim's proof (all §5 ≥ 7, at least one primary record on screen) |
| User-friendly proposition | | …make the contract clearer by 0:30, the chapter names more payoff-like or the pace easier |

Score and action:
- **100**: ship (to `shot-design` / `make-video`, once `retention-script`'s self-check also passes).
- **75**: one part is weak. Name it and the available fix, fix that part, rescore. Don't touch
  the parts that scored.
- **≤ 50**: the idea isn't ready. Back to `packaging` Step 1 (angle) or to research.

A critic who scores a part 0 must write the improvement that's available; "it could always be
better" isn't one. Optionally record a graded 0–25 per part as a diagnostic, but the gate is
the binary score.

---

## 7. Description and chapters

| Check | Pass when |
|---|---|
| First two lines | Restate the promise as a specific fact + name the proof source; the searchable noun (the thing people type) appears in line 1 |
| Chapter names | 8–12 description chapters; at least half are fascinations, not labels |
| Sources | Main sources listed (this is proof and costs nothing) |
| No bait | No promise the video doesn't keep; no hype words |

Pass/fail; no score.

---

## 8. Critic output template

```
CANDIDATE: <text>
GATES: G1 ✓ G2 ✓ G3 ✓ G4 ✓ G5 ✓ G6 ✓
SCORE: P 9/10 (packaging) · B 8/10 (A2 B2 C2 D1 E1)
YEAH-SURE TEST: <what a cynic says, or "no objection forms">
PROOF IT DEPENDS ON: <fact> — <research-pack source / NEEDS SOURCE>
SHAPE TEST: <pass, or whose signature it matches>
BEST SINGLE FIX: <one change, expected +points>
```

A fully filled example, from the Persuasion Equation to the description, is in
`worked-example.md`.

---

## 9. Shape test (feeds G5)

Run on every title in the long list (`fascinations.md` §6 has the detail):
1. Does it use another channel's series tag (`animation-study/README.md` §6.3)?
2. Does the package match one channel on two of topic lane, title formula and thumbnail grammar?
3. Swap test: with that channel's name after it, would a regular viewer believe it's theirs?
4. Voice test: would the hook read as theirs with the pictures removed?

Any "yes" → G5 fails.

---

## 10. What each threshold rests on, and how we calibrate

| Rule | Status | What it rests on |
|---|---|---|
| Proof ≥ claim; claim and proof joined in the title | **[primary]** | S16 Bullets 3 and 7; Caples' headline test cited there (the doctor-authority headline won by 71%) |
| Score each part 25 / subtract 25 if not as strong as can be | **[primary]** | S1 |
| No jokes or puns in headlines | **[primary]** | S16 Bullet 27 (his first copy chief's rule) |
| Interest = benefit + curiosity; predictability kills curiosity | **[primary]** | S16 Bullet 23 |
| Proof on screen by 0:12 (full marks), by 0:30 (gate) | [house] | Only indirect: 15 of 49 winners name a date in the first 20 s and the replayed moments are mechanisms, comparisons and records (`video-autopsies/README.md` §B3–B4) [observed]; 0:30 matches `packaging` Step 4's promise rule. Not tested on our channel |
| Cliffhanger paid within 90 s | [house] | The winners' turn-word gap is ~27 s median (§A) [observed]; no data on payoff latency itself |
| ≤ 2 statistics to remember in the hook | [house] | Counter-example on file: Kurzgesagt's Fermi hook answers its question with a stair-step of numbers (`video-autopsies/kurzgesagt.md` §3) [observed]. Hence "a number ladder counts as one" |
| ≥ 2 proof elements per hook/title claim | [house] | Reasoning from S16 Bullet 29 (credibility from many proof elements); untested |
| Ship ≥ 8 (title pair, hook), ≥ 7 (long list, cliffhangers) | [house] | Arbitrary starting points |
| Sponsor-return line ≥ 9 | [house] on [observed] | The return line is a top-two replay peak in 9 autopsied videos (§B1) |

**Calibration protocol** (run it; don't argue about thresholds without it):
1. Before upload, record in `docs/research/packaging-log.md` (create it if missing) for each
   Test & Compare variant: the P and B scores, and for the shipped hook its §3 and
   `retention-script` scores.
2. After the test (and at 7 and 28 days), add: impressions CTR, watch-time share (the Test &
   Compare winner metric), average view duration and % of viewers still watching at 0:30, from
   YouTube Studio.
3. Back-score the shipped titles and hooks of the episodes already in `projects/` the same way,
   so we start with a baseline once their analytics are pulled.
4. After **8 or more** scored, published packages: check whether higher B scores go with higher
   watch-time share and 0:30 retention (rank correlation; with this few points, look for a
   consistent direction, not significance). Move a threshold only when the data points the same
   way at least twice; note the change and the date in this table.
5. Until then, treat every [house] threshold as a default to argue with, not a law.
