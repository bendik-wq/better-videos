# IDEA: The Binance heist (pilot run, 2026-11-04)

## Signal row (radar `studio/signals/out/2026-11-04.md`, channel pick #3)

| # | Headline | Total | Signal | Fit | Pillars | Sources | Search | Wiki views | Age h |
|---|---|---|---|---|---|---|---|---|---|
| 3 | How malware and a bogus job interview let attackers nab $6.3B from Binance | 16.6 | 12.1 | 4.5 | money, tech | 3 |  |  | 2.8 |

Chosen by the parent session (step 0 done by the radar). This file records the `idea-engine` score.

## Idea in bank format

`Title | Thumbnail concept | Hook | F1F2F3F4F5 | E/H/T | Res | Vis | Key sources`

**The Job Interview That Cost $6.3 Billion** | A laptop alone on a desk in a black room under one work lamp; a code folder on screen, one red loop on the file name | "The biggest crypto theft on record didn't start with a genius piece of code. It started with a job offer." | 2 1 2 2 2 | H | 4 | 4 | Binance incident report (3 Nov 2026, via Reuters/Fortune/BleepingComputer); FBI alert (31 Oct 2026, via Yonhap/Nextgov); TRM Labs, Chainalysis, Elliptic

**Timely peg + evergreen core:** peg = Binance's 3 Nov report on the 29 Oct theft. Core = *how North Korea's hackers get inside companies through fake hiring*, which has worked before (Axie/Ronin 2022 per The Block, Bybit 2025 per FBI) and targets ordinary developers.

## Score (rubric in `docs/library/topic-bank.md`)

| Part | Score | One-line reason |
|---|---|---|
| F1 Absurd object + number | 2 | One coding assignment → $6.3B, most of it moved in ~20 min (TRM) |
| F2 Belief reopened | 1 | "Hacks are genius code" / "I'd never fall for a fake recruiter": partial, needs the script to sell it |
| F3 Timely + best explainer | 2 | Binance's report is 1 day old; nobody has yet explained the full June→Oct chain in one story |
| F4 Known villain / disaster | 2 | Binance (largest exchange) + "North Korea" (FBI attribution) + record size |
| F5 Familiar frame, one twist | 2 | Heist movie, but the vault was opened by a job interview |
| **Out** | **9** | |
| Life | 4 (H) | evergreen core (fake-interview intrusions), news peg |
| Res | 4 | Company's own incident report (tier 3) + FBI alert (tier 1, read via press) + on-chain analytics (tier 4). No indictment, no court record |
| Vis | 4 | Hero object (laptop/coding test), timeline clock, on-chain flow map. No real place to bake |
| Sat | −1 | **Gloam, "How Binance Lost $6,300,000,000 in One Night" — 2.03M views, 30 Oct 2026, 14:53** (6.6k-sub channel). Also Bloomberg TV 112k, Reconstructed 164k (1 Nov). Both predate the 3 Nov interview disclosure, so our angle (the human chain) is new primary material. A strict reading of the rubric ("over 2M on the same angle") gives −2. |
| **Total** | **20/25** (strict: 19/25) | |

**Bar (`studio/program.md`):** ≥18/25 and a channel pick → **passes** (20, or 19 strict). Topic-bank band: 19–21 = "needs a sharper angle" → the angle is the job interview and the six-month chain, not the size of the theft (Gloam already owns "how Binance lost $6.3B").

## Stress test (idea-engine step 5)

1. **3:00 and 6:00 wow factors:** 3:00 = Binance's own attack chain shown as the document (primary record: "Software Engineer B was contacted…"). 6:00 = computed comparison: if most of $6.36B moved in ~20 min, that is more than $2.6M a second; then the 50 signatures (Fireblocks/Blockaid via noze.it). Different kinds (record vs computed). ✅
2. **Hero object:** the take-home coding assignment on a laptop. ✅
3. **Fact risk:** attribution to North Korea is an FBI statement (official), denied by North Korea (Reuters). Binance's failures must be phrased in Binance's own words ("This should not have happened"). Engineers are private people: no names, no faces (they're "Engineer A/B/C" in Binance's report). Status ladder: no charges filed. Needs a light legal read for the Binance framing only. ⚠
4. **Fit:** money + tech lane ✅. No affiliate offer given; a security-key / password-manager offer would fit without contradiction but none is configured.
5. **Packaging smoke test:** 5 titles in 2 min — The Job Interview That Cost $6.3 Billion · The Coding Test That Robbed Binance · Never Run the Take-Home Test · How Hackers Got Hired Into Binance (inaccurate, dropped) · The Recruiter Who Wasn't Real. Thumbnails: laptop-in-void; document with red loop on "not detected". Strong. ✅

**Adjusted total after stress test:** 20/25 (no deductions).

## Why this one
- Pilot topic assigned by the parent from the radar.
- Hits three outlier factors at 2 (absurd number, timely, villain) and the familiar-frame twist.
- Risk: saturation on the generic angle and a news cycle that moves daily. Publish window: 7–10 days (by ~2026-11-13) or it becomes a hybrid that needs a stronger evergreen frame.

## Not done in this run (idea-engine steps 1–3, 6)
- The full 10–20 candidate news sweep and bank re-rank were skipped: step 0 was decided by the radar. The `docs/library/idea-log.md` append and topic-bank row were not written (the parent asked for the score in this file only; commit nothing).
