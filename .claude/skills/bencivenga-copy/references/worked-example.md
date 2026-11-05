# Worked example: one explainer packaged end to end

This is the skill's output format filled in, from the peg check to the description. The topic
(GPS and relativity) is **illustrative**: it was chosen because it suits an animated explainer and
MAINSPRING's clock metaphor, not by the ep10 packaging tournament. **Every fact is `[verify]`**
until the research pack confirms it against `docs/library/fact-check-playbook.md`. The main
sources a real pack would start from: Neil Ashby, "Relativity in the Global Positioning System",
*Living Reviews in Relativity* (2003); the GPS interface specification (IS-GPS-200); news reports
of GNSS jamming and spoofing.

Scores use `packaging` Step 2 (**P**, /10) and `checklist.md` §2 (**B**, /10). How they combine is
in `checklist.md` §0.

---

## 0. Peg check (news first, then a famous event)

| Step | Result |
|---|---|
| News in the last 14 days with a named, verifiable event? | GNSS jamming and spoofing near conflict zones have been reported repeatedly through 2024–26 `[verify the latest]`. It's a live *stake*, not a breaking event, so it goes in the hook's contract and Ch.4, not in the title |
| Famous name the casual viewer already knows? | Yes, twice: GPS (everyone's blue dot) and Einstein |
| A door nobody uses? | The 1977 NTS-2 satellite flew its atomic clock with the relativity correction switched off at first, then measured the drift `[verify in Ashby 2003]` |
| Decision | Evergreen title (it won't age), timely stake in the hook. Repackage after 30 days if a big spoofing story breaks |

## 1. Persuasion Equation (`checklist.md` §6, Bencivenga's binary rule)

| Part | First pass | Strong as can be? | After the fix |
|---|---|---|---|
| Urgent problem | "GPS uses relativity" is trivia to science fans; a casual viewer has no reason to care | **No → 0** | The stake that touches everyone: without the correction the blue dot drifts about 10 km a day, and someone can now fake the signal → **25** |
| Unique promise | The NTS-2 switch-off story plus the drift computed on screen, which the top GPS explainers don't tell `[verify by watching the top 5]` | Yes → 25 | 25 |
| Unquestionable proof | Ashby's figures; 38 µs × the speed of light ≈ 11 km, computed on screen; the clock's factory frequency offset from the specification shown as a document card | Yes → 25 | 25 |
| User-friendly proposition | Three questions that become chapters; 12–14 min; a plain promise ("you'll understand your phone's map") | Yes → 25 | 25 |
| **Total** | **75**: fix the weak part, don't polish wording | | **100**: proceed |

## 2. Twenty-five titles

Formula tags from `fascinations.md` §2. **G** = a gate failed (`checklist.md` §1).

| # | Title (chars) | Formula | P | B | Note |
|---|---|---|---|---|---|
| 1 | Without Einstein, Your Map Would Drift 10 km a Day (50) | F2 | 10 | 9 | ★ |
| 2 | The Clocks in Space That Run Fast on Purpose (44) | F2 | — | G1 | False implication: physics makes them run fast; engineers *set them slow* on purpose |
| 3 | GPS Would Drift 10 km a Day Without Einstein (44) | F2 | 10 | 8 | ★ search noun first |
| 4 | The 38 Microseconds Behind Your Phone's Map (43) | F3 | 9 | 8 | ★ |
| 5 | They Put a Clock in Orbit to Test Einstein (42) | F7 | 9 | 8 | ★ |
| 6 | Why Every GPS Clock Is Set to Run Slow (38) | F1 | 9 | 6 | No proof cue |
| 7 | The Switch They Left Off in 1977 (32) | F12 | 7 | 5 | Blind; a casual viewer can't tell what it's about |
| 8 | Time Runs Faster 20,000 km Up (29) | F3 | 8 | 7 | Good thumbnail text candidate |
| 9 | How GPS Works (13) | F9 | — | G5 | "How [machine] works" is Jared Owen's / Animagraffs' series shape |
| 10 | GPS Is Really a Clock (21) | F8 | 7 | 6 | Half-blind, thin proof |
| 11 | The Clock Correction Some Engineers Doubted (43) | F10 | — | G1 pending | Claim about people's beliefs: `[NEEDS SOURCE]` in Ashby or an oral history |
| 12 | Your Phone's Map Is an Einstein Experiment (42) | F8 | 8 | 7 | |
| 13 | Why Satellites Live in Faster Time (34) | F1 | 7 | 5 | Vague "live in" |
| 14 | Einstein Is in Your Pocket (26) | — | 5 | 4 | Clever, not specific (Bullet 27: no cleverness in headlines) |
| 15 | The Most Accurate Clocks You Use Every Day (42) | — | 6 | 5 | Superlative with no proof |
| 16 | Your Phone Trusts 4 Clocks It Can't See (39) | F2 | 10 | 7 | Strong itch; no relativity, so a weaker unique promise |
| 17 | The Day Relativity Became Engineering (37) | — | 6 | 5 | Abstract nouns |
| 18 | GPS Explained: Relativity and Satellites (40) | — | 4 | 3 | Lecture colon, label |
| 19 | Why Your Map Isn't 10 km Wrong (30) | F1 | 9 | 7 | Inverted version of #1; softer |
| 20 | The Clock That Had to Be Set Slow (33) | F12 | 8 | 6 | |
| 21 | 4 Satellites, 1 Equation, 1 Blue Dot (36) | F3 | 7 | 6 | List rhythm, little itch |
| 22 | The Experiment Hidden in Your Phone (35) | F12 | 8 | 6 | Blind |
| 23 | Every Blue Dot Is a Relativity Test (35) | F8 | 8 | 7 | |
| 24 | How Your Phone Knows Where You Are (34) | F9 | — | G5 | Same "how it works" signature as #9 |
| 25 | 38 Microseconds a Day Would Break GPS (37) | F3 | 9 | 8 | "Break" must be shown, not asserted |

## 3. The top five, scored

| Rank | Title | P | B (A B C D E) | P+B | Mobile front-load (first ~30 chars) | Search / browse |
|---|---|---|---|---|---|---|
| 1 | Without Einstein, Your Map Would Drift 10 km a Day | 10 | 9 (2 2 2 2 1) | 19 | "Without Einstein, Your Map Wou…": stake survives; the number may be cut, so the thumbnail carries a number | Browse |
| 2 | GPS Would Drift 10 km a Day Without Einstein | 10 | 8 (1 2 2 2 1) | 18 | "GPS Would Drift 10 km a Day W…": all proof survives | Search + browse |
| 3 | 38 Microseconds a Day Would Break GPS | 9 | 8 (1 2 2 2 1) | 17 | Whole title fits | Browse |
| 4 | The 38 Microseconds Behind Your Phone's Map | 9 | 8 (2 2 2 1 1) | 17 | "The 38 Microseconds Behind You…" | Browse |
| 5 | They Put a Clock in Orbit to Test Einstein | 9 | 8 (1 2 2 2 1) | 17 | "They Put a Clock in Orbit to T…" | Browse |

Critic block for #1 (`checklist.md` §8):

```
CANDIDATE: Without Einstein, Your Map Would Drift 10 km a Day
GATES: G1 ✓ (pending Ashby figure) G2 ✓ G3 ✓ G4 ✓ G5 ✓ G6 ✓
SCORE: P 10/10 · B 9/10 (A2 B2 C2 D2 E1)
YEAH-SURE TEST: "10 km? Really?" forms for a second, then the thumbnail's +38 µs and the
  on-screen sum (38 µs × c ≈ 11 km) at 0:20 answer it
PROOF IT DEPENDS ON: net clock offset ≈ 38 µs/day; position error ≈ 10 km/day if uncorrected
  — Ashby 2003 [verify the exact wording: some sources say "about 11 km"]
BEST SINGLE FIX: none to the title; make sure the sum is on screen by 0:30 (+1 to C would
  need a second cue in the title itself, which would push it past 50 characters)
```

**Thumbnail text** (complements, never repeats): **+38 µs** on a paper satellite clock whose
hands run ahead of a twin clock on the ground. Alternative for the A/B: no text, two clocks only.

**A/B plan (`packaging` Step 5):** title #1 against #2, thumbnail held fixed. One variable:
viewer-facing stake first ("Your Map") against search noun first ("GPS"). Winner on watch-time
share; log CTR too, as a diagnostic only.

## 4. Proof list (what the title and hook depend on)

| Claim | Proof element (`SKILL.md` Workflow D) | Source |
|---|---|---|
| Orbit clocks run fast by ≈ 38 µs/day net | Specifics + mechanism (gravity +45, speed −7) | Ashby 2003 `[verify]` |
| Uncorrected, ≈ 10 km/day of drift | Computed comparison, on screen | Our sum from the above |
| NTS-2 flew with the correction off at first | Document card + candor if the account is thin | Ashby 2003 `[verify]` |
| Clocks are set slightly slow before launch | The factory frequency as a document line | IS-GPS-200 `[verify the value]` |
| Signals are being jammed and spoofed | News cards with dates and named reporters | Research pack `[verify]` |

## 5. The 30-second hook

79 words, about 32 s at 150 wpm.

| Time | Slot | VO | Picture |
|---|---|---|---|
| 0:00 | 1 Confirm the click | "June 1977. A satellite carries an atomic clock into orbit, with one correction switched off." | The thumbnail's two paper clocks; one rises on a paper tower. Card: JUN 1977 · NTS-2 |
| 0:05 | 2 Proof object | "The correction was for relativity. So they measured instead." | The measured clock-rate line climbing on a paper chart; source card *Ashby 2003* |
| 0:10 | 3 Objection | "It sounds like a classroom story. But the clock ran fast, by almost exactly what Einstein predicted." | Prediction line and measured line meet |
| 0:17 | 4 Twist | "Every GPS satellite still has that error. Left alone, it would drag your blue dot about ten kilometres off course, every day." | The sum on screen: 38 µs × 300,000 km/s ≈ 11 km; the blue dot slides across a paper map |
| 0:25 | 5 Contract | "So why does time run faster up there? And what happens when someone fakes the clocks?" | Two question cards that become Ch.2 and Ch.4 |

Scores: `checklist.md` §3 **10/10** (A2 B3 C1 D2 E1 F1: the proof is on screen at 0:05, two
numbers in the body, ≤ 80 words). `retention-script` §3 hook score: score it there too; this skill
doesn't replace it. **Fallback** if Ashby doesn't support "switched off": "June 1977. A satellite
carries an atomic clock into orbit, to find out whether Einstein was right about time." (No claim
about the switch; the measurement story still stands.)

## 6. Cliffhanger ledger

| Ch. | Ends at | Shape (`SKILL.md` Workflow C) | Line | Paid at | Gap |
|---|---|---|---|---|---|
| 1 Four Clocks, One Dot | 3:05 | Wrong assumption flagged | "That works perfectly on paper. In orbit, the clocks refuse to agree." | 3:25 | 20 s |
| 2 Time Runs Faster Up There | 6:00 | Person about to enter | "The equations said so. In 1977, someone had to bet a satellite on them." | 6:15 | 15 s |
| 3 The Switch | 8:30 | Withheld detail | "The fix is a single number, set before launch. It's printed in the specification." | 8:50 | 20 s |
| Sponsor return | ~9:40 | Counter-intuitive pair (strongest) | "Every one of those clocks is set wrong on the ground, so it can be right in the sky." | 10:20 | 40 s |
| 4 Faking the Clocks | 12:00 | The clock | "A fake signal needs to be off by only a millionth of a second. Here's who's doing it." | 12:30 | 30 s |
| End | 13:40 | Callback to the thumbnail | The two clocks, still ticking apart, then one is wound back. No recap | — | — |

Shapes never repeat back to back; each payoff gap is logged in the `retention-script` open-loop
ledger.

## 7. A body-copy sample (Ch.2, the mechanism)

Plain statement, then the twist; one step per line, one picture per step (`SKILL.md` Workflow F).

> Gravity slows time. [two paper clocks, one at the foot of a paper tower]
> Not as a metaphor. Measurably. [the lower clock's second hand lags a hair]
> Up at twenty thousand kilometres, gravity is weaker, so the satellite's clock runs faster:
> about forty-five millionths of a second a day. [counter wheel: +45]
> But the satellite is also moving fast, and speed slows time down: about seven millionths.
> [counter wheel: −7]
> Put them together and you get thirty-eight. [counter: +38, hold 3 s]
> That's nothing. [beat] Unless you're measuring distance with light, which covers three hundred
> metres in a millionth of a second. [the sum assembles: 38 × 300 m ≈ 11 km]

Levity beat (one, dry): "Your phone has never heard of Einstein. It just works because a lot
of other people did."

## 8. Description and chapters

```
GPS satellites carry atomic clocks that run about 38 microseconds a day fast, because of
relativity. Left uncorrected, your position would drift around 10 km a day. Using Neil Ashby's
review of relativity in GPS and the GPS interface specification, we rebuild how the fix works,
and what happens when someone fakes the signal.

00:00 The clock launched with one setting off
01:05 Four clocks, one blue dot
03:05 Why the clocks refuse to agree
04:40 Gravity slows time (measurably)
06:00 The 1977 bet
07:20 The number set before launch
08:30 The fix, printed in the spec
10:20 Faking the clocks
12:00 A millionth of a second
13:20 Two clocks, still apart

Sources: Ashby, N. (2003) Living Reviews in Relativity 6:1; IS-GPS-200; [news sources with dates]
```

Ten description chapters, seven of them fascinations rather than labels (`checklist.md` §7 passes).

## 9. Shorts cut and localisation

**Short (≤ 60 s), cut from Ch.2–3:** first frame and first line together: "This clock is set wrong
on purpose." Proof by 0:03 (the frequency line from the spec on screen). Paid inside the Short:
the +45 −7 = +38 counter and the 11 km sum. Last line loops back to the first frame ("…which is
why it's set wrong on purpose"). Short title: *The Clock Set Wrong on Purpose* (30). The Short
pays its own gap (G3); the long video is linked as the related video, not teased as "part 2".

**Localised titles** (YouTube Studio → Subtitles → Title & description; translate the
fascination, not the words, and keep units metric with local number formatting):

| Language | Title | Note |
|---|---|---|
| es | Sin Einstein, tu mapa se desviaría 10 km al día | 47 chars; keeps the stake first |
| de | Ohne Einstein läge dein Navi täglich 10 km daneben | 50 chars; "Navi" is the everyday word |
| fr | Sans Einstein, votre GPS dériverait de 10 km par jour | 53 chars: over the house limit; a native writer shortens it (e.g. drop "de") and rechecks |

A native speaker checks each one for the "yeah, sure" reaction before publishing (`SKILL.md`
Workflow G). The thumbnail's **+38 µs** reads in every language, which is one more reason to keep
thumbnail text numeric.
