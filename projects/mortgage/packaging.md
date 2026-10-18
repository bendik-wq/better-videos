# Episode 6: packaging. "The Auction That Sets Your Mortgage Rate"

Research source: `docs/library/cpm-research-2026-10.md`. The full fact pack is `projects/mortgage/RESEARCH.md`, being built.
Look: BRIGHT house blend (white clay, daylight, turquoise, one red accent). The bright-style thumbnail rules from the Panama
episode apply: a bright hero instead of the dark key-light grammar. The three gates are unchanged.

## Step 1: angle

**Familiar but unexpected:** "The Fed sets mortgage rates" is a belief nearly every homeowner holds.
- The Fed cut by 1.75 points (Sep 2024 → Dec 2025), yet the 30-year mortgage went from 6.09% to 7.40%.
- The price was set somewhere else: in a sealed auction where the US government sells its debt.
- On 7 Oct 2026 that auction cleared at 5.30%, the highest 10-year auction yield since 2000.

| Frame | Version | Cold-open mechanism (hooks.md) | Structure |
|---|---|---|---|
| ★ Hidden mechanism | The auction behind your mortgage rate | In medias res: the auction clock hits 1:00 pm | Mechanism reveal → stakes → countdown |
| Villain / contrarian | "It's not the Fed" | Belief reopened | Myth → proof → real culprit |
| Mystery object | A sealed bid | Object reveal | Object-led |
| Countdown | The next auctions (Nov 2026) | Ticking date | Countdown climax |

**Outlier factors hit (4 of 5):**
- an absurd concrete number on an object: $39 billion sold in minutes, at 5.3%;
- a belief reopened: the Fed;
- timeliness: highest since 2000, in the news this month;
- a familiar frame with a twist: a home "sold" at an auction.

**Core / casual / new:**
- **Core** (money, macro): yes.
- **Casual** (homeowners, renters, buyers): yes. It's their monthly payment.
- **New:** "why is my mortgage 7% if the Fed cut?" is a question millions are typing.

## Step 2: titles (score /10; ★ = top 5)

| # | Title | Chars | Score |
|---|---|---|---|
| ★1 | The Auction That Sets Your Mortgage Rate | 40 | 9 |
| ★2 | The Fed Cut Rates. So Why Is Your Mortgage 7%? | 46 | 9 |
| ★3 | Who Really Sets Your Mortgage Rate | 34 | 8 |
| ★4 | The $39 Billion Auction You Didn't Know About | 45 | 8 |
| ★5 | The 1 PM Auction That Prices Every Mortgage | 43 | 8 |
| 6 | It's Not the Fed Setting Your Mortgage Rate | 43 | 7 |
| 7 | Why Mortgage Rates Ignored the Fed | 34 | 7 |
| 8 | The Secret Auction Behind Your Mortgage | 39 | 6 (not secret: public; fails accuracy, cut) |
| 9 | Inside the Auction That Prices Your House | 41 | 7 |
| 10 | The Most Important Auction in the World | 39 | 7 |
| 11 | America Is Selling Debt at 5.3%. You Pay for It | 48 | 7 |
| 12 | Why Your Mortgage Is Set in a Sealed Bid | 40 | 7 |
| 13 | The Bond Market Just Overruled the Fed | 38 | 7 |
| 14 | The Price of America's IOU Just Hit 5.3% | 40 | 6 |
| 15 | The Auction Every Homebuyer Should Watch | 40 | 7 |
| 16 | How a Bond Auction Became Your Rent | 35 | 6 |
| 17 | Why 7% Mortgages Aren't Going Away | 34 | 6 (implies a forecast; soften) |
| 18 | The Bidders Who Decide What Your Home Costs | 43 | 7 |
| 19 | The Economics of Your Mortgage Rate | 35 | 6 |
| 20 | The $40 Trillion Problem Inside Your Mortgage | 45 | 7 |
| 21 | The Day the Bond Market Said No | 31 | 6 |
| 22 | Your Mortgage Is Set by Strangers in Tokyo | 42 | 5 (overclaims foreign role; cut) |
| 23 | The Highest Auction Since 2000 | 30 | 6 |
| 24 | Why the Fed Can't Lower Your Mortgage Rate | 42 | 7 (needs nuance: "can't directly") |
| 25 | The 30 Minutes That Set Your Mortgage | 37 | 5 (the window is not verified as 30 min; ⚑) |

- **Formulas used:**
  - "The [Thing] That [Verb] [Everything]" (Fern);
  - "[Belief], So Why [Paradox]?" (the belief-reopened shape);
  - "The $[Exact] [Thing]" (Wendover).
- **Lead:** #1. A/B title test of #1 vs #2: a label vs the paradox question, modelled on Veritasium's label-vs-claim pairs.

## Step 3: thumbnails (bright; three gates checked)

**A (lead): "SOLD AT 5.3%". Grammar: object in daylight (an auction).**
- A white clay suburban house on a wooden auction block in bright daylight, with a gavel above it.
- The one red element is the price tag hanging off the house: **5.3%** in Archivo Narrow Bold red.
- Text: "SOLD" (one word; the 5.3% is the red element).
- Gates:
  - 1 word ✓.
  - Hero: the house, at 45% of the frame height, a dark roof on pale ground, so it reads in grayscale ✓.
  - One red element ✓.
- Score 9.
- Plants the question: why is my house being auctioned? The title answers that it's the rate.

**B: "NOT THE FED". Grammar: the matchup.**
- On the left, a small clay Fed building with a down arrow labelled "−1.75". On the right, a large clay house with a big up arrow.
- One red element: a loop on the house arrow.
- Text: "NOT THE FED" (3 words ✓).
- Gates:
  - Hero: the house arrow ✓.
  - One red element ✓.
- Score 8.
- Pairs with title #1 or #3.

**C: "7.40%". Grammar: the absurd quantity.**
- A huge stack of white clay "IOU" envelopes (sealed bids) fills the frame.
- One envelope is open, showing "5.300%", with the red loop on it.
- Text: none (the number in the envelope is the hero detail).
- Gates:
  - 0 words ✓.
  - Hero: the stack silhouette ✓.
  - One red element ✓.
- Score 7.

- **Production:** A and C are stills from 3D sets (`house-auction`, `sealed-bids`). B uses the `fed-vs-market` set.
- **Make with:** `node projects/mortgage/thumbs/make.mjs`.

## Step 4: chosen pair, promises, prediction

**Ship:** title #1 with thumbnail A.

**Promise list** (each confirmed by 0:30, paid off by the end):
1. There is a real auction, and it prices mortgages. Show it in the cold open; explain the mechanism in Ch. 1–2.
2. The Fed cut, but mortgages rose. Show the paradox number in the first 30 s.
3. The price: 5.3%, the highest since 2000. It's in the cold open.
4. What it costs **you**: the $400K payment gap (our math) at the 3:00 wow.
5. What happens next: the November auctions, the climax countdown.

**End line candidate** (thumbnail echo): "…the house is sold at whatever price the auction says."

**Prediction:**
- 7 days: 40–120K views; 28 days: 150–500K.
- CTR 6–10%.
- RPM band $8–20, a working estimate from the research doc (Q4 money ads).

## Step 5: Test & Compare

- **Thumbnail test (title fixed at #1):** A (house + SOLD), B (NOT THE FED matchup), C (sealed bids).
- **Then a title test (thumbnail fixed):** #1 vs #2.
- Two-week run, winner chosen on watch-time share. Log it in `docs/research/packaging-log.md`.
