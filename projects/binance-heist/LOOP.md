# Script loop log: The Job Interview That Cost $6.3 Billion

Judge: `python3 studio/critic/script_critic.py projects/binance-heist/SCRIPT.md` (fixed; not edited by this run).
Bar (`studio/program.md`): total ≥ 85, hook ≥ 80, no "never closed" loop, no flat stretch > 90 s. Stop at the bar or after 5 attempts.
Rule: change one thing (the judge's top issue), keep it only if the score rises.

Note: the critic file changed on disk during this run (another session added an `L1` exemption to the "> 6 min open" check, matching `emotional-engine.md` §4.1). All attempts below were scored with the version that includes it.

| Attempt | Total | hook | rehooks | loops | emotion | rhythm | specifics | Length | Top issue → change | Kept? |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 (v1 draft) | **97** | 100 | 100 | 80 | 100 | 100 | 100 | 11:55, 1,788 w | "0:00 / 0:14 nothing is left open" → (see attempt 1) | baseline |
| 1 | **100** | 100 | 100 | 100 | 100 | 100 | 100 | 11:55 | Opened L1 on the first beat (the misconception line already creates the gap "how can a job interview start a theft?"); the explicit L1 question restates it. | ✅ kept (+3) |
| 2 | **100** | 100 | 100 | 100 | 100 | 95 | 100 | 13:14, 1,985 w | Not a critic issue: the draft ran 11:55, under the 12–16 min brief, and failed `emotional-engine.md` checks (no middle-third empathy beat; setups P2/P5 paid off < 3 min after planting). Added the "your chair" empathy beat, the laundering beat (opens/closes L8), a predict-then-reveal on the 98%, and planted P5 ("the private keys were never stolen") in the cold open; fixed "millions of customers" (unsourced). | ⚠ kept though the total did not rise (100 → 100, rhythm 100 → 95): it fixes a brief requirement the critic doesn't measure. Logged as a deviation from the keep rule. |
| 3 | **100** | 100 | 100 | 100 | 100 | 100 | 100 | 13:16 | "11:02 sentence of 26 words" → split the Elliptic line in two (the critic's splitter doesn't split after a closing quote). | ✅ kept (rhythm 95 → 100) |

**Stopped after attempt 3:** at the bar (and at the critic's ceiling) with hook 100, no unclosed loop, no flat stretch.

## Step 5: cold self-review and the final re-run

Reviewed against `docs/research/emotional-engine.md` §8 and `docs/research/script-patterns.md` §2 and §4.

| Fix | Why (checklist item) | Change |
|---|---|---|
| 1 | #1 / retention-script check 3: L1 stated as a question by 0:30. It came at ~0:50. | Trimmed the interview beat and moved "So how does one coding test turn into the largest theft in crypto history?" to 0:28. |
| 2 | #6: 2–4 loops open at every point before the payoff. Only L1 was open 8:43–9:18 and 10:49–11:37. | Micro-loop L9 at the twist ("So how do you stop a machine that has permission to empty you?" → revoked); L7 ("a method can be used again") opened in "the rest" instead of inside the payoff. |
| 3 | #9: two live outcomes at chapter starts. Ch.3 began with no stated alternatives. | Ch.3 opens on "From one laptop, there are two ways to the money. Steal the keys. Or steal the people who hold them." (and the beat rises to tension 3) |
| gate | Fact-safety pass (`script-patterns.md` §4.5), not scored | "calling himself" → "with the title"; "Neither did its chief executive" → "The chief executive on the call was a character"; "caught these attackers" → "caught part of this attack"; "installed" → "downloaded"; cut the intent claim "to look real"; CZ's post re-dated to "that same night"; cut the mind-reading line "investigators care less about this one theft than about the method"; 98% line made grammatical and dated. |
| parse | Critic hygiene | The description chapter list was a fenced block and was being timed as narration (+22 s); moved to bullets. |

**Final re-run:** `SCRIPT SCORE 100/100 (13:11, 1,977 words, 27 beats) — hook 100 · rehooks 100 · loops 100 · emotion 100 · rhythm 100 · specifics 100`.

**Emotional pass (`emotional-engine.md` §8), reviewer's own scoring after the fixes:** gates G1 ok, G2 ok (L1 closes at 11:56 = 90%), G3 ok. 83/94 scored points (item 14, the sponsor return line, is n/a: no sponsor) ≈ **88/100**. Open findings:
- #5/house rule: the two 5s (8:43 twist, 11:56 payoff) are 3:13 apart; the house rule says at most one 5 per 4 min, but the §3 peak plan for 12 min puts them 2:20 apart. The rules conflict at this length; we followed the peak plan.
- #9 partial: Ch.1, Ch.2 and Ch.5 still open on a question, not two stated outcomes.
- #6 partial: 0:00–0:51 has only L1 open (the cold open).

**What the critic can't see** (and why 100 is not a quality verdict): it rewards marked devices (`[↺]`, "?", "but") and annotated intensities, which the writer sets. A blind reviewer pass (program.md) has not been run.
