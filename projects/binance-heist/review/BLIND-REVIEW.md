# Blind review: binance-heist / SCRIPT.md (narration v1)

Reviewer: an independent cold-viewer judge, 2026-11-04. I did not read LOOP.md or SCORECARD.md. I ignored the writer's emotion words and intensities until step 6 and rated each beat from the narration only, as a first-time, moderately interested viewer. A fact said calmly is a 2. Only real reversals and revelations get a 4 or 5.

Inputs: `docs/research/emotional-engine.md`, `docs/research/script-patterns.md`, `docs/research/hooks.md`.
Blind copy with my annotations: `projects/binance-heist/review/SCRIPT.blind.md`.

**Timestamps.** Line times assume 150 wpm and count only the numbered VO lines (no title card). Beat times in the critic output run 5–13 s later. The critic reads the `**TITLE: …**` line and the stray sentence "Tie rule not needed. B and C are re-hook and trailer material…" (under the hook table) as narration. **The real VO length is about 12:48, not 13:11.**

---

## 1. Blind annotation: what I changed and why

### Emotion (my reading)

| # | Beat | Writer | Blind | Line time |
|---|---|---|---|---|
| 1 | the number | intrigue 3 | intrigue 3 | 0:00 |
| 2 | the interview | unease 2 | curiosity 2 | 0:14 |
| 3 | twenty minutes | shock 4 | intrigue 3 | 0:32 |
| 4 | stakes and tease | tension 3 | intrigue 3 | 0:50 |
| 5 | the vault | curiosity 2 | curiosity 2 | 1:20 |
| 6 | the ad | unease 3 | unease 2 | 1:50 |
| 7 | caught | relief 2 | curiosity 2 | 2:08 |
| 8 | the map | surprise 4 | surprise 3 | 2:21 |
| 9 | the recruiter | intrigue 3 | curiosity 2 | 2:50 |
| 10 | the CEO | tension 2 | intrigue 3 | 3:14 |
| 11 | not detected | dread 4 | dread 3 | 3:54 |
| 12 | your chair | empathy 3 | empathy 3 | 4:23 |
| 13 | one laptop | curiosity 2 | curiosity 2 | 4:48 |
| 14 | the helper | tension 3 | curiosity 2 | 5:06 |
| 15 | wallet team | surprise 4 | surprise 3 | 5:36 |
| 16 | secondary | curiosity 3 | intrigue 3 | 6:07 |
| 17 | who | tension 3 | curiosity 1 | 6:32 |
| 18 | the pattern | awe 4 | unease 3 | 6:58 |
| 19 | the script | tension 3 | tension 3 | 7:35 |
| 20 | the permission slip | intrigue 2 | intrigue 3 | 7:54 |
| 21 | the vault signs | shock 5 | shock 5 | 8:30 |
| 22 | aftermath | curiosity 3 | curiosity 2 | 9:12 |
| 23 | binance pays | relief 2 | relief 2 | 9:30 |
| 24 | the laundering | tension 3 | curiosity 2 | 10:12 |
| 25 | the rest | indignation 4 | indignation 3 | 10:48 |
| 26 | the answer | awe 5 | satisfaction 3 | 11:41 |
| 27 | button | unease 4 | unease 3 | 12:21 |

Blind curve: `3 2 3 3 2 2 2 3 2 3 3 3 2 2 3 3 1 3 3 3 5 2 2 2 3 3 3`
Writer curve: `3 2 4 3 2 3 2 4 3 2 4 3 2 3 4 3 3 4 3 2 5 3 2 3 4 5 4`

I count **one** real peak: "Nobody broke into the vault. The vault signed for them." The rest of the script is a well-written, even 2–3.

### Loop and setup fixes (the narration doesn't open or close these where the annotation says)

| Item | Writer's annotation | What the narration does | Blind copy |
|---|---|---|---|
| P1 "one folder" | planted in *the number* | "One folder." is spoken in line 5, in *the interview* | plant moved to *the interview* |
| L3 "Who on that team would open a file from a stranger?" | closed in *not detected* (3:54) | answered 2 s later, line 31: "Someone looking for a new job." | closed in *the recruiter* |
| L4 "How do you get from a laptop … to the machine that signs for billions?" | opened in *not detected* | first asked in line 53, *one laptop* | opened in *one laptop* |
| L6 "Who pays for six point three billion?" | closed in *the rest* | answered 3 s later, line 97: "Binance says its customers won't." | closed in *binance pays* |
| L7 "Who else is it working on?" | opened in *the rest* | line 116 is a statement, not a question. The question comes in line 123, *the answer* | opened in *the answer* |
| L8 "Can anyone cash out six billion?" | closed in *the rest* | only a soft close ("very likely still held… some may already be with… laundering networks") | kept, flagged as soft |
| P4 "the one moment a careful engineer is told to run a stranger's code" | paid in *the answer* | paid with the **same** meaning (line 121 restates line 41) | kept, but it fails the "payoff changes meaning" test |

**Two logic problems a viewer will notice:**
1. **Engineer B and "that team".** Line 29 says the attackers needed "a different person", and line 30 asks "Who on *that* team [the wallet team] would open a file from a stranger?" The answer is Software Engineer B, introduced only as "one of its software engineers" (line 32). Line 52 says B's laptop "still isn't the wallet", and line 58 presents the wallet-team link of the *next* two victims as a reveal. So B was apparently not on the wallet team, and the question in line 30 is answered wrongly.
2. **"The first one a stranger could touch."** Line 118 lists the chain starting with "An ad". Line 121 then calls the take-home test "the first one a stranger could touch". The ad came first. This is the climax line of the video, and it contradicts the sentence three lines above it.

---

## 2. Critic result on the blind copy

```
python3 studio/critic/script_critic.py projects/binance-heist/review/SCRIPT.blind.md

SCRIPT SCORE 86/100  (13:11, 1977 words, 27 beats)
  hook 100  rehooks 100  loops 100  emotion 30  rhythm 100  specifics 100
  emotion curve: 3 2 3 3 2 2 2 3 2 3 3 3 2 2 3 3 1 3 3 3 5 2 2 2 3 3 3
  - 0:00–8:43 no emotional peak for 8 min (target ≤ 3)
  - 8:43–13:10 no emotional peak for 4 min (target ≤ 3)
  - 3:21–4:57 flat emotion (intensity 3) for 96 s
  - 7:09–8:43 flat emotion (intensity 3) for 93 s
  - 9:25–11:02 flat emotion (intensity 2) for 96 s
  - 11:02–12:43 flat emotion (intensity 3) for 100 s
```

The same critic gives the writer's original annotations **100/100**. All 14 points of the gap come from the emotion check, and that check depends only on self-reported intensity. The other five sub-scores (hook, rehooks, loops, rhythm, specifics) pass on regex and loop-ledger checks, and those can't measure whether a beat lands. The critic's `loops` check only needs one live loop per beat. It does not test the 2–4 target in the doc.

---

## 3. Emotional-engine checklist (cold viewer)

### Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 every beat annotated, vocab words | **pass** | All 27 beats use §7 format and §2.1 words. |
| G2 loops/setups closed; L1 closes in last 15% | **pass (marginal)** | L1 closes at 11:41 of ~12:48 (91%). L8 closes only softly: "funds that haven't moved are 'very likely still held by North Korea'". |
| G3 no unearned asserted emotion | **pass** | No "shocking/terrifying". The strongest assertion is "here's the strange part" (line 12), and the fact earns it. |

### Points

| # | Check | Score | Justifying line |
|---|---|---|---|
| 1 | Hook ≥3 by 0:20, L1 as a repeatable question | **8/8** | "About six point three billion dollars… it didn't start with a genius piece of code. > It started with a job interview." (0:00–0:14), then "So how does one coding test turn into the largest theft in crypto history?" (0:27). Caveat: the first 14 s add nothing beyond the title "The Job Interview That Cost $6.3 Billion". |
| 2 | Peaks ≤3 min apart; count matches §3 (13 min → 5–6 peaks) | **0/10** | One peak, at 8:30 ("The vault signed for them"). From 0:00 to 8:30 there is nothing above a 3. The best candidates are "You can't change who works for you" (2:33) and "Not random people. Both of them worked on the wallet team" (5:36), and both are telegraphed by earlier lines. |
| 3 | Release within 45 s after each peak; each peak tops the last | **0/8** | There is a release ("You take the permission back. Eventually…", 9:12, 42 s after the peak). But with one peak there is no sawtooth: after it the curve slides 2-2-2-3-3-3 and never climbs back. |
| 4 | Biggest peak in last third + button within 60 s; no recap | **0/8** | The peak is at about 66%, which only just counts as the last third. The button lands about 3:50 later (12:21). Line 118 is a recap: "With a chain of ordinary things. An ad. A list of names. A recruiter. A video call. A helpful internal tool." |
| 5 | 2–3 intensity-5 beats, peak kind + human consequence | **0/8** | Only one: "The vault signed for them" + "customers… couldn't take out their own money" (8:53). |
| 6 | 2–4 loops open at every point before the payoff | **0/8** | Only L1 is open over 3:14–4:48 ("the CEO", "not detected", "your chair"), 9:30–10:12 and 10:48–11:41. Most chapter loops close within seconds: L3 (5 s), L6 (3 s), L9 (5 s). |
| 7 | 3–6 setups ≥3 min ahead; each payoff changes meaning | **0/8** | P5 ("Hold on to that", 0:58 → "They didn't have to", 8:30) is excellent, and P1, P2 and P3 work. But P4 is paid with the same meaning: line 41 "It's the one moment a careful engineer is *told* to run a stranger's code" comes back at 12:05 as "The one moment when running a stranger's code isn't a mistake. It's the job." This is the L1 payoff, so it's the one that matters most. *(With a lenient reading that counts four of five setups: 8/8.)* |
| 8 | All links but/therefore; −2 per "and then" | **0/8** | 4 "and then" links. 1:20 "First, what was actually robbed." (cold open → background). 3:14 "Then a first-round interview…" (the next step in a known sequence). 6:32 "Before the answer, the question investigators asked first." (a digression that stalls L5). 7:35 "Thursday, the twenty-ninth of October." (the next date). |
| 9 | Suspense: two outcomes plausible and stated at each chapter start | **0/6** | No chapter states two hypotheses, and the cold open settles every chapter's outcome in advance: caught once (1:04) → Ch.1; interview + fake company (0:14–0:43) → Ch.2; keys never stolen (0:58) → Ch.4; 98% replaced (9:46) answers Ch.5 in its first minute. |
| 10 | ≥4 emotion words among peaks; high arousal > low | **0/6** | One peak, one word (shock). |
| 11 | Zoom-in empathy beat in middle third, one person + one cost | **0/5** | "Look at it from that chair instead" (4:23) zooms in well, but the cost to the person never appears there. The only cost line, "Binance has declined to say what happens to the engineers," is held back to 12:17. *(Lenient: 5/5.)* |
| 12 | Mechanism inside an open loop | **5/5** | The permission-slip explainer (7:54–8:30) sits inside L5 "And without the private key, you can't move the coins. Right?" The hot-wallet explainer (1:20) sits inside L2. |
| 13 | Payoff bigger/stranger than the hook promised | **0/6** | The hook promised "a job interview → $6.3 billion". The payoff is that same claim as a list (line 118). The stranger idea, "the vault signed for them", was spent at 8:30. |
| 14 | Return line after sponsor read is a re-hook ≥3 | **N/A** | The script has no sponsor or affiliate slot. That is itself a gap against the house frame (affiliate at 20–25%). |

**Checklist score: 13 / 94 (14/100 normalised), all gates pass.** A lenient reading of #7 and #11 gives 26/94 (28/100). Both are far below the ship line of 80.

Why so low for a script that reads well: it's clean, accurate, TTS-ready and has a strong hook. But it plays as **a well-narrated reading of Binance's incident report**, with about 15 lines framed as "Binance says / according to the report". The countdown spine tells the outcome first. The cold open then spoils four of the five chapters, so the middle confirms what the viewer was already told instead of revealing anything.

---

## 4. Ten most likely click-away moments

| # | Time | Line | Why |
|---|---|---|---|
| 1 | **1:20** | 15–16 "First, what was actually robbed. An exchange holds its customers' coins. Most exchanges keep the bulk offline…" | The classic post-title drop: the hook ends and a background lecture starts. Crypto-curious viewers already know hot and cold wallets. "Keep that machine in mind" (1:44) comes 24 s too late. |
| 2 | **2:50** | 31–35 "In September, Binance says, a recruiter reached out… A real platform. A fake person." | Third telling of the recruiter. The viewer heard "a recruiter with the title Project Director" at 0:14 and "the company… didn't exist" at 0:43. |
| 3 | **3:14** | 36–37 "Then a first-round interview… The second round was with the company's chief executive, on a chat app." | Already told at 0:21 ("Two interviews later came the usual last step") and 0:43 ("The chief executive on the call was a character"). Sequence only, nothing new. |
| 4 | **5:06** | 55–57 "Binance had its own internal A.I. tool. Binance hasn't said exactly what it does. But it says the attackers used it." | A tease with no content, followed by a 28-word sentence. The viewer gets told they won't learn what the interesting thing is. |
| 5 | **6:07** | 63 "Binance stresses that A.I. played a secondary role. The main weapon was still old-fashioned deception." | Deflates the AI beat seconds after "The company's own A.I. helper had become part of the break-in." |
| 6 | **6:32** | 67–70 "Before the answer, the question investigators asked first… the F.B.I. issued a cyber alert. It said North Korea was responsible…" | An open stall ("Before the answer") on the best micro-loop in the film, filled with an attribution the viewer got at 0:50. The highest-risk spot in the middle. |
| 7 | **9:30** | 97–100 "Binance says its customers won't… replaced ninety-eight percent of the affected tokens" | The viewer's personal stake disappears with three minutes left. Nobody lost money, and the open question just closed. |
| 8 | **10:12** | 105–107 "converting the stolen assets mainly into Ether… decentralised finance platforms and instant-swap exchanges… the Secret Service and the I.R.S." | A procedural list of agencies and asset types with no question attached. It reads like a news-wire wrap-up. |
| 9 | **11:13** | 113–115 "Pyongyang nets at least a billion dollars a year… nuclear programme… President Trump said: 'We don't know if it's North Korea…'" | Widening to geopolitics plus a tonally odd quote tells the viewer the story is over, so they leave before the button. |
| 10 | **11:46** | 118 "Not with one genius exploit. With a chain of ordinary things. An ad. A list of names. A recruiter…" | A recap list, which the docs ban, followed by a climax line that contradicts it ("the first one a stranger could touch"). Viewers who stayed this long now get a summary instead of a reveal. |

## 5. Five strongest moments

| # | Time | Line | Why it works |
|---|---|---|---|
| 1 | **8:30** | 86–87 "The private keys never left Binance. \| They didn't have to. > Nobody broke into the vault. \| The vault signed for them." | A mechanism made simple, a fair payoff of P5 (0:58, "Hold on to that") and P3 (1:44), and the most replayable line in the film. Line 91 "the permission slips kept working. \| The draining went on." adds the consequence. |
| 2 | **0:00** | 1–3 "About six point three billion dollars… it didn't start with a genius piece of code. > It started with a job interview." | Misconception first, clean turn in 25 words, a gap the viewer can say in one sentence. |
| 3 | **3:41** | 39–41 "If you're not a programmer, that might sound odd. If you are, it sounds like any other Tuesday… It's the one moment a careful engineer is *told* to run a stranger's code." | The film's real insight, said simply. It deserves to be the twist, not a mid-Ch.2 aside. |
| 4 | **2:33** | 28 "You can change a password. You can't change who works for you." | A quotable reversal that explains why getting caught didn't matter. |
| 5 | **7:24** | 75–77 "Half a billion. \| One and a half billion. \| Now six point three… Fifty-seven attempts stopped. \| This one wasn't." | A clean stair-step and a good beat-ending punch. (Close behind: 8:25 "Why fifty? … only one had to work. The rest were insurance." and the 9:36 "Quick guess" predict-then-reveal.) |

---

## 6. Where the writer rated a beat ≥1 higher than I did

14 of 27 beats. The writer averages 3.15 and I average 2.70. The gap is almost all in "4 vs 3" claims, where a beat is labelled a reveal but the viewer was told the fact earlier.

| Beat | Writer → Blind | Why I rate it lower |
|---|---|---|
| twenty minutes (0:32) | shock 4 → intrigue 3 | "Most of it moved in about twenty minutes" is a number with no consequence attached yet. "The company… didn't exist" was implied by "a recruiter with the title Project Director". |
| the ad (1:50) | unease 3 → 2 | "It's an old trick." The script calls it routine itself, and line 12 already said it was caught. |
| the map (2:21) | surprise 4 → 3 | A good line, but it answers a question asked 70 s earlier with an answer a viewer half-guesses ("they learned something"). That's a 3: lean in, not tell a friend. |
| the recruiter (2:50) | intrigue 3 → 2 | Repeats 0:14 and 0:43. "A real platform. A fake person." was already established. |
| not detected (3:54) | dread 4 → 3 | We knew from 0:12 that the interview was the attack. That the malware ran is expected, and the long quote ("endpoint security protection tools") is flat. "The laptop now answered to someone else" is the good line. |
| the helper (5:06) | tension 3 → 2 | "Binance hasn't said exactly what it does." The beat withholds its own content. |
| wallet team (5:36) | surprise 4 → 3 | Telegraphed: "They had learned who was on the wallet team" (2:27), and the narration even says "Remember what leaked in June". That's satisfaction, not surprise. |
| who (6:32) | tension 3 → 1 | Restates the 0:50 attribution and explicitly delays the answer. |
| the pattern (6:58) | awe 4 → 3 | A stair-step is a 3 on the §2.2 anchors. It's unease, not awe (nobody is impressed by North Korea). |
| aftermath (9:12) | curiosity 3 → 2 | L9 opens and closes in 5 s ("You take the permission back"). "Who pays?" is answered 3 s into the next beat. |
| the laundering (10:12) | tension 3 → 2 | No live outcome. Most viewers assume the money gets laundered, and the beat is a list of agencies. |
| the rest (10:48) | indignation 4 → 3 | The nuclear-funding stake is widely known and comes as a stack of attributions ("Experts say…"). The Trump quote undercuts the indignation. |
| the answer (11:41) | awe 5 → satisfaction 3 | A recap, the P4 payoff repeats line 41 word for word in meaning, and it contradicts line 118. Nothing new is revealed. |
| button (12:21) | unease 4 → 3 | "It will look like one folder" is a neat callback, but "same lure aimed at ordinary developers" is asserted, not shown. The end lands softly. |

I rated two beats higher than the writer: *the CEO* (2 → 3, for "any other Tuesday" / "told to run a stranger's code") and *the permission slip* (2 → 3, for "fifty slips… the rest were insurance").

---

## 7. Verdict: **REVISE**

The writing quality is ship-level: clean sentences, honest attribution, a strong hook and one great line. The emotional structure is not. The cold open uses up the chapters' reveals, the middle confirms things the viewer already knows, the only peak sits at 66%, and the ending recaps and contradicts itself. The critic's 100/100 rests on the writer's own intensities. Re-rated blind, it drops to 86/100, and the emotional-engine checklist scores 13/94.

### The 5 changes that matter most

1. **Stop spoiling the chapters in the cold open (lines 7–10).** Keep the hook, "the private keys were never stolen. Hold on to that", and "caught once already. So why didn't that stop them?". Move "the company didn't exist / the CEO was a character" into Ch.2 as its reveal at about 3:15 ("The company didn't exist. The chief executive was a character."). Move the F.B.I./North Korea attribution to its first mention in the pattern beat. That turns three repeat beats (*the recruiter*, *the CEO*, *who*) into two new peaks near 3:00 and 7:00, fixes click-aways #2, #3 and #6, and frees about 30 s.

2. **Rebuild the ending so the biggest new thing comes last, with no recap.** Cut lines 105–107 and 113–115 (procedural list, generalities, Trump quote) and compress Ch.5 to about 75 s: the 98% quick-guess, then "Replacing the money isn't the same as getting it back", then 3.24 billion still held. Replace line 118's list with one new fact or reframe. Fix the contradiction in line 121: the ad came first, so make the claim "the only link the security team *can't* block, because it's the job". Land the button within 60 s of that peak.

3. **Fix the Engineer B / "that team" logic and use it as a reversal.** Change line 30 to ask about Binance generally. Then plant a real chapter loop: "Engineer B wasn't on the wallet team. So why him?" Pay it at 5:36 with "because B's laptop was the door to two people who were." The *wallet team* beat becomes an earned 4, and 2+ loops stay open through 3:14–4:48.

4. **Replace stalls and deflations with two-hypothesis suspense.** Cut line 63 ("A.I. played a secondary role…") or fold it into one clause. Cut the "Before the answer" stall (line 67). Open each chapter with two outcomes, both stated: Ch.1 "Either Binance missed it, or catching it didn't matter." Ch.4 "Either they had the keys, or they didn't need them." Ch.5 "Either customers eat this, or Binance does." This fixes checklist #8 and #9 and click-aways #5 and #6.

5. **Give the zoom-in a cost, and add the missing sponsor slot.** Move line 122 ("Binance has declined to say what happens to the engineers") into *your chair* at about 4:45, so the empathy beat has one person and one cost. Place the affiliate read at about 3:00 (after the Ch.2 reveal from change 1) and bring the viewer back with a re-hook at intensity 3 or higher (for example, line 41). That fixes checklist #11 and #14.

**Housekeeping:** the critic counts the `**TITLE: …**` line and "Tie rule not needed. B and C are re-hook…" as narration. Move them or format them as headings or table rows so the timing is real. Also check that cutting P4's restatement doesn't remove line 41's best phrasing.
