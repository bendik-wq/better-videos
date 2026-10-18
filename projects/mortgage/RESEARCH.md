# The Auction That Sets Your Mortgage Rate: research and fact-check

Episode brief: `docs/library/cpm-research-2026-10.md` (winner A); packaging: `projects/mortgage/packaging.md`.
Compiled **2026-10-18**. The script is written from this pack, never from memory. Every spoken number needs a row here.
Source IDs (S01…) point to `SOURCES.md`, which gives full URLs, publishers, dates, tiers and read status.

**Confidence levels**
- **High**: a primary record (Treasury auction result PDF, Fiscal Data API file, FOMC statement, BoE notice, 1929 circular) or official statistics, or two independent strong sources that agree.
- **Medium**: one strong source (one quality outlet, one institutional page), a WebFetch extract we haven't read in full, or several secondary outlets that may share one origin.
- **Low**: contested, a single weak source, or paraphrased. Low rows can't go in the title, the thumbnail, the cold open or a red annotation (playbook §1 and §7).

**Markers**
- ⏱ means time-sensitive. Re-check it on VO-lock day and again on publish day, and put an "as of" date in the caption.
- ⚑ means it must be resolved or cut before the script locks.
- ↔ means a contested range or two official measures. Say both, or use the safe wording given.
- **Our math** means we computed it from a tier-1/2 file; the method is in the row or in §11. Label it "Our math" on screen.

**Access note (affects sourcing)**
- **Auction results**: the TreasuryDirect results PDFs for 7 Oct (10-year) and 8 Oct (30-year) and the 10-year offering announcement were downloaded and read in full with `pdftotext` (S01–S03). The full Fiscal Data auctions file (2,793 note and bond auctions, Oct 1979 – Oct 2026) was downloaded through the API and analysed by us (S05).
- **Rates**: Treasury's 2026 daily par-yield CSV (S16) and FRED CSVs for DGS10, DGS30, MORTGAGE30US, DFEDTARU/L, DFEDTAR, WALCL, TREAST, WSHOMCB, Z.1 holder series and NAR series were downloaded and parsed (S17, S19, S24, S38, S39, S41).
- **Debt**: Debt to the Penny, average interest rates, MSPD tables 1 and 3, interest expense and the **September 2026 Monthly Treasury Statement** (table 9) were pulled from the Fiscal Data API (S28–S32).
- **CBO** returned **HTTP 403** to both WebFetch and curl. Its September 2026 Monthly Budget Review (8 Oct 2026) is known only through a search summary and the American Action Forum's write-up (S33, S34). ⚑
- **NAR** newsroom pages returned a generic page to curl; NAR figures come through FRED's NAR series (S41) and one WebFetch extract (S42).
- **Fed, NY Fed, TreasuryDirect, Treasury, BoE, Boston Fed and St. Louis Fed pages** were read through WebFetch extracts, not in full.
- The **1929 NY Fed circular**, **Garbade (2008)**, **Cunliffe's LDI letter**, **Rose & Spiegel (FRBSF)** and **Yardeni's 2023 note** were downloaded as PDFs and read with `pdftotext`.

**Rules for this episode**
- No accusation of any named person or firm is central. Name the Fed chair (Kevin Warsh, per S25) only in neutral context.
- **"The Fed doesn't set mortgage rates" is our hook, but it must stay true.** The Fed sets an overnight rate; long rates are set in the bond market, which the Fed *influences* (S26). Never say the Fed "has nothing to do with" mortgage rates.
- **Don't merge two periods.** The cut cycle (Sep 2024 – Dec 2025) and the 2026 surge to 7.40% are different stories, and the Fed **hiked** in Sep 2026 (§5). Use the safe constructions in §5c.
- **Indirect bidders are not "foreigners".** Treasury's own investor-class data show investment funds, not foreign accounts, take most 10-year notes (§3d).
- Our 3D reconstruction of the 7 Oct auction is a **reconstruction**: label it, and build it only from S01/S05 numbers.

---

## 0. Timeline at a glance

| Date | Event | Source |
|---|---|---|
| 17 Jun 1929 | Law signed letting Treasury sell bills at auction | S45 (search: S44 context) |
| 10 Dec 1929 | Mellon's notice: first Treasury bill offering, $100M (or thereabouts) of 90-day bills | S44 |
| 13 Dec 1929, 2:00 pm EST | Tenders close at the Federal Reserve Banks | S44 |
| 14 Dec 1929 | Treasury announces $224M bid; accepted from 99.310 down to a 99.152 stop | S45 |
| 25 Feb 1993 | WSJ front page carries Carville's "come back as the bond market" line | S54 (citing WSJ p. A1) |
| 4 Feb 1994 | FOMC's first-ever immediate policy announcement: funds rate +25 bp to 3.25% | S46, S24 |
| 7 Nov 1994 | 10-year closes at 8.05%, the 1994 peak (from 5.19% on 15 Oct 1993) | S17 (our math) |
| 6 Dec 1994 | Orange County files for Chapter 9 bankruptcy | S48 |
| 2 Nov 1998 | All Treasury auctions switch to the single-price format | S12 |
| 8 Nov 2000 | 10-year auction clears at 5.865%, the last one at or above 5.300% before 2026 | S05 (our math) |
| 10 Aug 2000 | 30-year auction clears at 5.697%, the last one above 5.618% before 2026 | S05 (our math) |
| 25 Feb 2021 | Weak 7-year auction: bid-to-cover 2.04, dealers take 39.8% | S05 (our math), S59 |
| 23 Sep 2022 | UK fiscal statement ("mini-budget") | S51 |
| 28 Sep 2022 | BoE: emergency long-gilt purchases "on whatever scale is necessary" | S50 |
| 14 Oct 2022 | BoE purchases end: £19.3bn bought | S51, S52 |
| 20 Oct 2022 | Truss: "I cannot deliver the mandate on which I was elected" | S53 |
| 9 Nov 2023 | Weak 30-year auction: dealers take 24.7%, tail ~5 bp | S05, S14, S58 |
| 18 Sep 2024 | First Fed cut: −50 bp to 4.75–5.00% | S20 |
| 19 Sep 2024 | 30-year mortgage 6.09% (PMMS) | S19 |
| 16 Jan 2025 | Mortgage reaches 7.04% after 100 bp of cuts | S19 |
| 29 Oct 2025 | Fed cuts to 3.75–4.00%; QT to end 1 Dec 2025 | S21 |
| 10 Dec 2025 | Last cut: 3.50–3.75% (9–3 vote); bill purchases to begin | S22 |
| 26 Feb 2026 | Mortgage low of the whole period: **5.98%** | S19 |
| 5 Aug 2026 | Refunding: 10-year $42B; sizes held "for at least the next several quarters" | S10 |
| 18 Aug 2026 | Gross debt first passes $40T ($40.05T) | S28 (our math) |
| 15 Sep 2026 | 10-year closes at 5.00%, its first 5% close of 2026 | S16/S17 |
| 16 Sep 2026 | Fed **hikes** 25 bp to 3.75–4.00% (12–0), first hike since Jul 2023 | S23, S24 |
| 24 Sep 2026 | Mortgage passes 7% (7.03%) | S19 |
| 5 Oct 2026 | 10-year closes at **5.31%**, highest close since May 2002 | S16 (our math) |
| 7 Oct 2026, 1:00 pm ET | **10-year auction: $39B at 5.300%**, highest since Nov 2000 | S01, S05 |
| 8 Oct 2026, 1:00 pm ET | 30-year auction: $22B at 5.618%, highest since Aug 2000 | S02, S05 |
| 8 & 15 Oct 2026 ⏱ | Mortgage **7.40%**, highest since Nov 2023 | S18, S19 |
| 15 Oct 2026 ⏱ | Gross debt **$40.39T**; held by the public $32.54T | S28 |
| 16 Oct 2026 ⏱ | 10-year 5.09%, 30-year 5.43% | S16 |
| **4 Nov 2026** | **Next quarterly refunding announcement** | S09, S10, S11 |
| **10 Nov 2026** | **Next 10-year auction** (new issue) | S09 |
| **12 Nov 2026** | **Next 30-year auction** (11 Nov is Veterans Day) | S09 |

---

## 1. The auction machine: how a Treasury note auction works

### 1a. Step by step

| Step | What happens | Exact wording / figure | Source | Confidence |
|---|---|---|---|---|
| 1. Announcement | Treasury publishes the offering several days ahead: security, amount, dates, closing times. The 7 Oct 10-year was announced **1 Oct 2026**, "Embargoed Until 11:00 A.M." | Offering amount **$39,000,000,000**; "Currently Outstanding $91,623,000,000"; "(Reopening)" | S03 | High |
| 1a. The calendar | Treasury posts a tentative six-month schedule; quarterly refunding press conferences "usually happen on the first Wednesday in February, May, August, and November" | — | S06, S09 | High |
| 2. Bids | **Competitive**: the bidder names the yield ("Must be expressed as a yield with three decimals e.g., 7.123%"), max award **35%** of the offering. **Non-competitive**: accepts whatever yield the auction sets, max **$10 million** | 7 Oct: "Maximum Award $13,650,000,000" (= 35% of $39B); "Maximum Noncompetitive Award $10,000,000"; "Competitive Bid Yield Increments 0.001%" | S03, S06, S07 | High |
| 2a. Who may bid | Open to the public. Institutions bid directly; individuals bid through TreasuryDirect (non-competitive only) or through a bank, broker or dealer | — | S06 | High |
| 3. Closing time ⏱ | **Notes and bonds: non-competitive 12:00 noon ET, competitive 1:00 pm ET.** Bills: 11:00 am / 11:30 am ET | 7 Oct: "Noncompetitive Closing Time 12:00 Noon ET"; "Competitive Closing Time 1:00 p.m. ET" | S03, S05 | High. **The brief's "11:30 for non-competitive" is wrong for notes; 11:30 is the bill competitive close** |
| 4. Award | Non-competitive bids are filled first. Competitive bids are then "accepted in order of their rate, yield, or discount margin, starting with the lowest, until the offering is fully awarded" | — | S06 | High |
| 5. Single price ("Dutch"/uniform price) | "All winning bidders receive the same rate, yield, or discount margin as the highest accepted bid." The highest accepted yield is the **high yield** (market slang: the **stop-out**). Bids at exactly the high yield are pro-rated: on 7 Oct, "Allotted at High 57.60%" | Footnote 1 on the result: "All tenders at lower yields were accepted in full." | S01, S06 | High |
| 5a. History of the format | Treasury used multiple-price (pay-your-bid) auctions; uniform pricing was used for 2- and 5-year notes from Sept 1992, and **all** auctions switched on **2 Nov 1998** | — | S12 | Medium (Federal Register via search summary) ⚑ read the FR notice |
| 6. Results | Posted on TreasuryDirect the same afternoon. TreasuryDirect account holders see their own results "after 5 PM Eastern time on auction day" | No official release-time stamp is printed on the results PDF | S01, S06 | High for the PDF. ⚑ **"Results within minutes"**: standard market practice, but we found no Treasury page stating it. Say "minutes later, Treasury posts the result" only after finding one, or say "that afternoon" |
| 7. Settlement | Payment and delivery on the issue date: **15 Oct 2026** for both Oct auctions | — | S01, S02 | High |
| SOMA | The Fed doesn't bid competitively. Maturing Fed holdings are rolled into the auction as **add-ons, on top of** the offering ("SOMA Amounts Included in Offering Amount: No") | 7 Oct: SOMA $926.29M, outside the $39B | S01, S03 | High |
| FIMA | Foreign central banks can bid non-competitively through the NY Fed: "up to $2,000 million … not to exceed $500 million per account" | 7 Oct: FIMA $0 | S01, S03 | High |
| Bid-to-cover | On Treasury's result: tendered ÷ accepted, **excluding SOMA**. 7 Oct: "$108,068,999,700/$39,000,031,700 = 2.77" | — | S01 | High |

### 1b. Bidder categories: Treasury's definitions (verbatim where marked)

| Term | Definition | Source | Confidence |
|---|---|---|---|
| **Primary dealer** | A Primary Dealer "bidding for its own house account" | S07 | High (extract) |
| **Direct bidder** | A non-primary-dealer submitter bidding directly for its own account; the category "does not indicate the domicile of the bidder" | S07 | High (extract) |
| **Indirect bidder** | "a customer placing a competitive bid through a primary dealer or direct submitter," which includes "Foreign and International Monetary Authorities placing bids through the Federal Reserve Bank of New York" | S07 | High (extract) |
| **Dealers' obligation** | Primary dealers are required "to bid on a pro-rata basis in all Treasury auctions at reasonably competitive prices" | S08 | High (extract) |
| Who they are ⏱ | **25 primary dealers** (list on NY Fed page). NatWest Markets Securities' withdrawal was effective **16 Oct 2026** | S08 | Medium-High (extract; re-check) |
| Why auctions don't "fail" | Brookings (Wessel): a failed auction would be "one in which the Treasury doesn't have enough bidders to take all the debt", "almost impossible" because dealers "are the bidders of last resort" | S14 | Medium-High (tier 4) |

### 1c. Tail, when-issued and stop-through

| Term | Definition | Source | Confidence |
|---|---|---|---|
| **When-issued (WI)** | Between announcement and issue, the security trades forward; "the yield determined in this forward trading" is the when-issued yield | S13 | High (Dallas Fed) |
| **Tail** | "The tail is the highest yield accepted at auction less the security's when-issued yield", measured "immediately before the auction's conclusion." Positive tail = weaker demand than the market expected | S13, S14 | High |
| **Stop-through** | The negative case: the auction clears *below* the WI yield (strong demand) | S13 (search summary) | Medium |
| Our caveat | Treasury doesn't publish WI yields; tails are market-data numbers (tier 5) | — | — |

---

## 2. The 7 Oct 2026 10-year and 8 Oct 30-year auctions

### 2a. Official results (S01, S02; cross-checked field by field against S05)

| Item | 10-year (7 Oct 2026) | 30-year (8 Oct 2026) |
|---|---|---|
| Security | 9-Year 10-Month Note, **reopening** of the Aug 2026 10-year; CUSIP 91282CRF0; Series E-2036 | 29-Year 10-Month Bond, reopening; CUSIP 912810UW6; "Bonds of August 2056" |
| Coupon | 4-5/8% | 5-1/8% |
| **High yield** | **5.300%** | **5.618%** |
| Allotted at high | 57.60% | 26.77% |
| Median / low yield | 5.255% / 4.300% | 5.567% / 5.000% |
| Price | 94.864261 | 92.889131 |
| **Offering** | **$39,000,000,000** | **$22,000,000,000** |
| Total tendered / accepted (incl. SOMA) | $108,995,289,900 / $39,926,321,900 | $56,435,875,700 / $22,522,535,300 |
| **Bid-to-cover** | **2.77** | **2.54** |
| Competitive accepted | $38,665,438,000 | $21,939,603,600 |
| Non-competitive / FIMA | $334,593,700 / $0 | $60,409,100 / $0 |
| SOMA add-on | $926,290,200 | $522,522,600 |
| Treasury Retail | $88,776,700 | $18,955,000 |
| **Primary dealers** (accepted) | **$984,000,000 = 2.5%** of competitive | $1,490,500,000 = 6.8% |
| **Direct bidders** | $6,618,200,000 = **17.1%** | $4,583,044,100 = 20.9% |
| **Indirect bidders** | $31,063,238,000 = **80.3%** | $15,866,059,500 = 72.3% |
| Closing times | Non-comp 12:00 noon ET; comp **1:00 pm ET** | same |
| Issue / maturity | 15 Oct 2026 / 15 Aug 2036 | 15 Oct 2026 / 15 Aug 2056 |

Shares are our math (accepted ÷ total competitive accepted). Confidence: **High** (primary record).

### 2b. How unusual was it? (our math, from the full Fiscal Data file, S05)

Method: all nominal (non-TIPS, non-FRN) auctions whose original term is 10-Year (362 auctions since Oct 1979) or 30-Year (287 since Nov 1979), ranked by high yield.

| Claim | Result | Confidence |
|---|---|---|
| **Highest 10-year auction yield since 2000** | ✅ The last 10-year auction at or above 5.300% was **8 Nov 2000, 5.865%** (a 9-year 9-month reopening). Every 10-year auction from Feb 2001 to Sep 2026 cleared lower. 2007 peak: 5.230% (12 Jun 2007) | High (our math). NBC independently: "the highest of any U.S. government sale of 10-year debt since November 2000" (S56) |
| 30-year: highest since… | ✅ The last 30-year auction above 5.618% was **10 Aug 2000, 5.697%**. (No 30-year auctions were held between Aug 2001 and Feb 2006) | High (our math) |
| Demand was **strong**, not weak | Bid-to-cover 2.77 vs an average of **2.51** over the previous 12 ten-year auctions; the highest for a regular 10-year since **13 Jan 2016** (also 2.77) | High (our math) |
| Dealers were left with almost nothing | Primary dealers took **2.5%**, the **lowest share in the dataset's bidder-category history** (from May 2008). Previous low: 4.2% (10 Sep 2025) | High (our math). Category data in S05 start 2008 ⚑ say "the lowest since at least 2008" |
| Indirect share | 80.3%: high but not a record (record 87.9%, 9 Apr 2025) | High (our math) |
| The 2026 climb, 10-year auctions | 4.173% (12 Jan) → 4.468% (12 May) → 4.683% (12 Aug, new issue $42B) → 4.834% (9 Sep) → **5.300% (7 Oct)** | High |
| The 2026 climb, 30-year auctions | 4.825% (13 Jan) → 5.046% (13 May) → 5.216% (13 Aug) → 5.308% (10 Sep) → **5.618% (8 Oct)** | High |
| A year earlier | 10-year 8 Oct 2025: 4.117%; 30-year 9 Oct 2025: 4.734% | High |
| Market yield that day ⏱ | Treasury par curve, 7 Oct close: 10-year **5.28%**, 30-year **5.67%** (the 30-year's 2026 high). Intraday the 10-year touched 5.36% and the 30-year 5.73% (MercoPress, tier 5) | S16 High; S57 Medium |
| Market reaction | NBC: yields "pulled back later in the day following a Treasury Department auction … for which there was strong demand." Peter Boockvar (One Point BFG): "likely the 24 yr highs in rates, brought out the buyers and resulted in a great auction" | S56 Medium (tier 5 + on-record) |
| ⚑ Tail / stop-through on 7 Oct | Not found. Treasury doesn't publish the WI yield | — |
| Scale of FY2026 issuance | **436 auctions** in FY2026 (1 Oct 2025 – 30 Sep 2026): 328 bills, 82 notes (incl. TIPS/FRN), 26 bonds; **$31.28T** offered (excl. SOMA add-ons), $32.89T accepted incl. **$1.61T SOMA**. Bills were **86%** of gross issuance ($26.88T) | High (our math, S05). This resolves the brief's "~435 auctions, ~$33T" row: **$33T includes the Fed's add-ons; $31.3T doesn't** |

### 2c. Reconstruction notes for the 3D scene (all from S01/S03)
- The clock: bids close **1:00:00 pm ET**, Wednesday 7 Oct 2026. Non-competitive window closes at noon.
- The stack: $108.07B of bids for $39.00B of notes (2.77×). Competitive bids are filled from **4.300%** (lowest 5%: footnote 3) up through the **5.255%** median to the **5.300%** stop; bids at 5.300% got 57.60% of what they asked for; everything above 5.300% got nothing.
- The pie: indirect 80.3%, direct 17.1%, dealers 2.5% of competitive awards.
- Label: "Reconstruction. Bid distribution between the low, median and high yields is illustrative; Treasury publishes only those three points."

### 2d. Who actually bought? (Treasury investor-class allotments, S15)

The bidder categories above say *how* bids arrived, not *who* owns the notes. Treasury's Office of Debt Management also publishes allotments by **investor class**. The latest file (posted 7 Oct 2026) covers issues through **30 Sep 2026**; the October auctions appear in early November ⚑ ⏱.

| 10-year note issue | Investment funds | Foreign & international | Dealers & brokers | Others | Auction "indirect" share |
|---|---|---|---|---|---|
| 15 Sep 2026 (auctioned 9 Sep) | **66.3%** | **28.1%** | 5.3% | 0.3% | 79.2% |
| 17 Aug 2026 (12 Aug) | 73.9% | 15.4% | 10.2% | 0.5% | 76.7% |
| 15 Jul 2026 (8 Jul) | 74.6% | 14.8% | 10.3% | 0.2% | 81.5% |

Shares of non-SOMA allotment, our math. **Takeaway: "indirect" ≈ 80% does not mean foreigners bought 80%. In September, foreign and international accounts took about 28%; investment funds took two-thirds.** Confidence: High (primary data; our math).

---

## 3. How the 10-year links to your mortgage rate

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The benchmark | "The 10-year Treasury note specifically acts as a benchmark or base rate for the 30-year mortgage rate." | S26 (St. Louis Fed, *Page One Economics*, 1 Oct 2026) | High |
| Why 10, not 30 | The 10-year "has a closer duration to the average mortgage"; most mortgages are paid off, refinanced or the house sold early; the average time before payoff "tends to be much closer to 10 years" | S26 | High (extract) |
| The formula | Mortgage rate ≈ Treasury yield + mortgage spread; the spread covers risk plus "origination expenses, servicing fees, and lender profit" | S26 | High |
| The pipe | Lenders pool loans into **mortgage-backed securities (MBS)**; investors "receive regular payouts of principal and interest made by homeowners," and compare MBS returns with the 10-year | S26 | High |
| What the spread mostly is | Boston Fed (Willen): the coupon spread "largely reflects the price of the prepayment option": borrowers can refinance when rates fall and stay put when they rise, so investors "lose in both" | S27 (Boston Fed CPP 26-3, 19 May 2026) | High (extract) |
| Spread components | Fannie/Freddie guarantee fees ≈ **42 bp**; lender intermediation margin; the prepayment option, driven by yield-curve slope, rate volatility and refinancing costs (about **80%** of coupon-spread variation since 2006) | S27 | Medium-High |
| Spread history | Mortgage–10-year spread: **>300 bp** in 2007–09, **<100 bp** in 2021 | S27 | High |
| The Fed's lever | The Fed "influences mortgage rates largely by affecting the financial market's expectations about inflation"; after a policy change "you don't usually see immediate movement in mortgage interest rates"; it can also buy Treasuries or MBS | S26 | High |
| ⏱ **The spread today** (our math) | PMMS 7.40% (15 Oct 2026) − 10-year 5.10% (15 Oct close) = **2.30 pts**. Using the PMMS week's average 10-year (9–15 Oct): **2.21 pts** | S16, S19 | High (our math) |
| Spread a year ago | 16 Oct 2025: 6.27% − 3.99% = 2.28 pts (week-avg 2.24) | S19, S17 | High |
| 2026 average | **1.98 pts** (41 weeks) | our math | High |
| **Long-run average** (our math) | **1.76 pts**, Apr 1971 – Oct 2026 (2,899 weeks; PMMS minus the 7-day average 10-year). 1990–2019: 1.66. 2010–19: 1.69. 2023 average: **2.85**; widest since 2020: **3.11 (1 Jun 2023)** | S17, S19 | High (method stated) |
| So what moved your rate in 2026? (our math) | 10-year: 4.19% (2 Jan) → 5.10% (15 Oct) = **+0.91**. PMMS: 6.15% (31 Dec 2025) → 7.40% = **+1.25**. The spread was ≈1.97 at the end of 2025 (6.15 − 4.18) and still ≈1.97 in the week of 17 Sep 2026; it is 2.21–2.30 now, so it widened only ~0.25–0.33. **Most of the rise is the Treasury yield itself** | S16, S19 | High (our math) |

---

## 4. The Fed vs the long end

### 4a. Fed funds target path (FOMC statements; FRED for effective dates)

| Announced | Move | New target range | Vote | Source | Confidence |
|---|---|---|---|---|---|
| 26 Jul 2023 | +25 | 5.25–5.50% (the peak) | — | S24 | High |
| **18 Sep 2024** | **−50** | **4.75–5.00%** | 11–1 (Bowman preferred −25) | S20 | High |
| 7 Nov 2024 | −25 | 4.50–4.75% | — | S24 | High (date from FRED effective 8 Nov) |
| 18 Dec 2024 | −25 | 4.25–4.50% | — | S24 | High (FRED) |
| 17 Sep 2025 | −25 | 4.00–4.25% | — | S24 | High (FRED) |
| 29 Oct 2025 | −25 | 3.75–4.00%; QT ends **1 Dec 2025** | — | S21 | High |
| **10 Dec 2025** | **−25** | **3.50–3.75%** | **9–3** (Miran wanted −50; Goolsbee, Schmid no change) | S22 | High |
| **16 Sep 2026** | **+25** | **3.75–4.00%** | **12–0**; "Inflation remains elevated." | S23 | High |

- **Total cut, Sep 2024 – Dec 2025: 1.75 points in six moves** (5.25–5.50 → 3.50–3.75). ✅
- **Net since the first cut: −1.50** (5.25–5.50 → 3.75–4.00 today). ⏱
- ⏱ Fed chair today: **Kevin Warsh** (Board page, S25). Powell is listed as a governor. ⚑ date Warsh became chair (not on the page).
- Dec 2025 statement: reserves "have declined to ample levels"; the Fed "will initiate purchases of shorter-term Treasury securities as needed" (S22).

### 4b. The mortgage rate and the 10-year through it all (PMMS weekly, Thursdays; 10-year daily close)

| Date | What happened | 30-yr mortgage (PMMS) | 10-year | Source |
|---|---|---|---|---|
| 16 Sep 2024 | 2024 low for the 10-year | — | **3.63%** | S16/S17 |
| 19 Sep 2024 | First PMMS after the first cut | **6.09%** | 3.73% | S19 |
| 26 Sep 2024 | Mortgage low of the cut cycle | **6.08%** | 3.79% | S19 |
| 16 Jan 2025 | After 100 bp of cuts | **7.04%** | 4.61% (14 Jan close 4.78%) | S19, S17 |
| 11 Dec 2025 | First PMMS after the last cut | **6.22%** | 4.14% | S19 |
| 26 Feb 2026 | Low of the whole period | **5.98%** | ~4.0% | S19 |
| 17 Sep 2026 | Day after the hike | 6.95% | 4.94% | S19, S17 |
| 24 Sep 2026 | Back above 7% | 7.03% | 5.18% | S19 |
| 8 Oct 2026 | Week of the auctions | **7.40%** | 5.22% | S19 |
| 15 Oct 2026 ⏱ | Latest | **7.40%** (15-yr 6.71%); a year ago 6.27% | 5.10% | S18, S19 |

- **7.40% is the highest PMMS since 16 Nov 2023 (7.44%)** (our math, S19).
- ⏱ Freddie Mac, 15 Oct 2026: "The 30-year fixed-rate mortgage averaged 7.40% as of October 15, 2026, unchanged from last week." (S18)

### 4c. The paradox, stated safely (our math)

| Window | Fed target (upper) | 10-year | 30-yr mortgage | Verdict |
|---|---|---|---|---|
| **First 4 months of cuts**: 18 Sep 2024 → 16 Jan 2025 | 5.50 → 4.50 (**−1.00**) | 3.70 → 4.61 (**+0.91**) | 6.09 → 7.04 (**+0.95**) | ✅ The cleanest "Fed cut, mortgages rose" fact |
| **The whole cut cycle**: 18 Sep 2024 → 10/11 Dec 2025 | 5.50 → 3.75 (**−1.75**) | 3.70 → 4.13 (**+0.43**) | 6.09 → 6.22 (**+0.13**) | ✅ "The Fed cut 1¾ points; mortgages ended slightly *higher*" |
| **Since the first cut, to today** | 5.50 → 4.00 (**−1.50**) | 3.70 → 5.10 (**+1.40**) | 6.09 → 7.40 (**+1.31**) | ✅ but note the Sep 2026 hike sits inside it |
| 2026 only | 3.75 → 4.00 (**+0.25**) | 4.19 → 5.10 (+0.91) | 6.15 → 7.40 (+1.25) | ⚠ Here the Fed and mortgages moved the **same** way. Don't use 2026 as "proof the Fed doesn't matter" |

**Safe script lines:**
- "When the Fed started cutting in September 2024, the average mortgage was 6.09%. Four months and a full point of cuts later, it was 7.04%."
- "In all, the Fed cut by one and three-quarter points. By the time it stopped, mortgage rates were *higher* than when it started."
- "Today the Fed's rate is a point and a half lower than in summer 2024. Mortgages are 1.3 points higher."
- ✗ Don't say: "The Fed cut 1.75 points and mortgages rose from 6.09% to 7.40%" as one move (the 7.40% came 10 months after the last cut, after a hike). The packaging line "−1.75 vs 7.40%" needs the dates on screen.

---

## 5. The debt

| Claim | Exact figure | Source | Confidence |
|---|---|---|---|
| ⏱ **Gross debt** | **$40,388,317,675,071.91** (15 Oct 2026) | S28 | High. "AS OF 15 OCT 2026" |
| ⏱ Held by the public / intragovernmental | **$32,538,236,547,452** / $7,850,081,127,620 | S28 | High |
| A year ago | 15 Oct 2025: $37.94T gross ($30.38T public). Change: **+$2.45T** | S28 (our math) | High. **The brief's "$37.97T a year earlier" is off by $30B; use $37.94T** |
| Crossed $40T | First record ≥ $40T: **18 Aug 2026** ($40.05T) | S28 (our math) | High |
| End of FY2026 (30 Sep 2026) | $40.17T gross; $32.43T public | S28, S30 | High |
| ⚠ "Held by the public" includes the Fed | The Fed holds **$4.57T** of Treasuries (H.4.1, 14 Oct 2026), i.e. **14.4%** of marketable debt | S37 (our math) | High |
| **Net interest, FY2026 (official)** | **$1,051.8 billion** (MTS function "Net Interest"), up from $970.4B in FY2025: **+$81.4B (+8.4%)** | S32 | High (MTS Sep 2026, table 9) |
| Ranking | MTS FY2026 outlays: Social Security $1,667.1B, Medicare $1,072.6B, **Net interest $1,051.8B**, Health $1,025.6B, **National defense $965.2B** | S32 | High. **Safe: "more than the entire defense budget"** |
| ↔ CBO's figure | AAF's summary of CBO's MBR (8 Oct 2026): "Interest payments on the national debt increased by $115 billion (11 percent)" because "the debt was larger and long-term interest rates were higher"; "Net interest was the second-largest government expenditure behind Social Security." One secondary site puts CBO's level at $1.143T | S33, S34 | Medium. ⚑ CBO measures "net interest on the public debt" (different scope) and its PDF was 403'd. **Use the MTS $1.05T on screen** unless CBO is read directly |
| Gross interest on Treasury securities | Interest expense on public issues **$1,068.5B** (FY2025: $973.7B); plus $291.9B on intragovernmental (trust fund) holdings = $1,360.4B gross | S31 (our math) | High. **Don't use $1.36T as "interest cost": $292B of it is paid to trust funds** |
| Interest vs revenue | Net interest ÷ receipts = $1,051.8B ÷ $5,403.3B = **19.5%** ("about one dollar in five") | S32 (our math) | High |
| FY2026 deficit | Receipts $5,403.3B; outlays $7,395.8B; **deficit ≈ $1.99T** (CBO: "$2.0 trillion") | S32, S34 | High |
| ⏱ **Average rate on marketable debt** | **3.518%** (30 Sep 2026). Bills 3.870%, notes 3.383%, bonds 3.466%, TIPS 1.149%, FRN 4.141% | S29 | High |
| Its history | Low **1.424% (31 Jan 2022)**; 1.432% (Dec 2021); 3.406% (Sep 2025). 3.518% is the highest since **Sep 2008** (3.665%) | S29 (our math) | High |
| The repricing gap | New 10-year money costs **5.30%** vs **3.38%** average on notes outstanding | S01, S29 | High (our math: compare only, no projection) |
| Marketable debt, 30 Sep 2026 | **$31.83T**: bills $7.12T, notes $16.28T, bonds $5.55T, TIPS $2.17T, FRN $0.71T | S30 | High |
| **Bills share** | $7.12T ÷ $31.83T = **22.4%** | S30 (our math) | High |
| **Coming due within 12 months** (our math) | Marketable securities maturing 1 Oct 2026 – 30 Sep 2027 (MSPD table 3, deduplicated by CUSIP): **$10.64T = 33.4%** of marketable debt. Bills $7.12T, notes $2.92T, FRN $0.35T, TIPS $0.22T, bonds $0.03T | S30 | High (method); includes Fed-held securities. Say "**about a third of America's marketable debt, more than ten trillion dollars, comes due within a year**" |

---

## 6. Who buys and holds US debt

### 6a. Foreign holders (TIC Table 5, S35; end-Aug 2026 is the latest month ⏱; next release ~mid-Nov ⚑)

| Holder | Aug 2026 | Change | Confidence |
|---|---|---|---|
| **All foreign** | **$9,331.7B** (Aug 2025: $9,249.1B) | +$83B y/y. ≈ **28.8%** of debt held by the public ($32.41T on 31 Aug); ≈33.5% excluding the Fed (our math) | High |
| Of which foreign official | $3,755.6B | down from $4,009.6B (Feb 2026) | High |
| **Japan** | **$1,068.3B** | −$171.0B since Feb 2026 ($1,239.3B); −$115.6B y/y. Still #1 | High |
| **UK** | **$1,009.5B** | +$108B y/y ($901.3B). #2 and closing on Japan | High |
| **China (mainland)** | **$590.7B** | −$109.0B y/y ($699.7B) | High |
| Next | Belgium $490.5B, Canada $464.6B, Cayman Islands $463.0B, Luxembourg $448.2B | — | High |
| ⚠ Caveat 1 | "The data in this table are collected primarily from U.S.-based custodians and broker-dealers", so a country is where the custodian sits, not necessarily the owner (Belgium, Luxembourg, UK, Cayman carry other countries' holdings) | S36 | High |
| ⚠ Caveat 2 | Form SLT reports holdings at fair (market) value (the form's title: "…Fair Value Changes…"), so when yields rise, holdings fall even with **no** selling | S36 | Medium. ⚑ Treasury's TIC net-sales figures for Japan/China (Table 3/SLT flows) would separate sales from price effects |

### 6b. The Fed (H.4.1, S37; QT status S21, S22)

| Claim | Figure | Confidence |
|---|---|---|
| ⏱ Treasuries held (14 Oct 2026) | **$4,569,911M**; bills **$565.5B (+$370.0B y/y)**; nominal notes & bonds $3,618.0B | High |
| ⏱ MBS held | **$1,898.1B (−$187.9B y/y)** | High |
| ⏱ Total assets | $6,755.6B (+$159.2B y/y) | High |
| QT status | **Ended 1 Dec 2025.** From that date the Fed rolls over all maturing Treasuries at auction and reinvests "all principal payments from the Federal Reserve's holdings of agency securities into Treasury bills." Since Dec 2025 it also buys shorter-term Treasuries "as needed" for reserves | High (S21 implementation note; S22) |
| So | The Fed is **not** buying 10-year notes or MBS. Its MBS keep running off (≈$188B a year), adding supply the market must absorb | High (our reading of S37 + S21) |

### 6c. Domestic holders (Fed Z.1, end-Q2 2026, via FRED; S39)

| Sector | Treasury holdings | Note |
|---|---|---|
| Rest of world (market value) | $9.27T | Consistent with TIC |
| Fed (monetary authority, Z.1 basis) | $4.08T | Z.1 valuation differs from H.4.1 face value |
| Money market funds | **$3.28T** | The biggest domestic buyer of bills |
| Households & nonprofits | $2.83T | ⚠ Z.1's household sector is a **residual that includes hedge funds**. Don't say "families own $2.8T" |
| Banks (US-chartered depositories) | $1.80T | |
| Mutual funds | $1.74T | |
| State & local governments | $0.56T | |
| Private pensions | $0.59T | |
| Insurers (P&C $0.38T, life $0.23T) | $0.61T | |
| Total (all holders) | $29.01T | Z.1 total; differs from MSPD's $31.8T by valuation and coverage |

Confidence: **Medium** (official series, but FRED series IDs and valuation bases weren't checked against the Z.1 L.210 PDF ⚑).

---

## 7. The household stakes

### 7a. Payment math (our math)

Formula: **M = P · i / (1 − (1 + i)^−n)**, with i = annual rate ÷ 12, n = 360 months. Principal and interest only (no tax, insurance or PMI).

| Loan | Rate | Monthly P&I | Total interest over 30 yrs |
|---|---|---|---|
| $400,000 | 3.00% | **$1,686.42** | $207,110 |
| $400,000 | 6.09% (Sep 2024) | $2,421.40 | $471,703 |
| $400,000 | **6.27%** (Oct 2025) | **$2,468.07** | $488,507 |
| $400,000 | **7.40%** (Oct 2026) | **$2,769.52** | **$597,027** |

- **7.40% vs 6.27%: +$301.44 a month; +$108,520 over the loan.** ✅ (matches the brief)
- **7.40% vs 3.00%: +$1,083.10 a month.** ✅
- 7.40% vs 6.09% (first cut week): +$348.12 a month.
- **Median-price home** (Sep 2026, $417,500, 20% down = $334,000 loan): **$2,312.55/month at 7.40%** vs $2,060.84 at 6.27% (**+$251.71**) and $1,408.16 at 3% (our math).

### 7b. Prices and sales (NAR via FRED, S41; NAR extract S42)

| Claim | Figure | Confidence |
|---|---|---|
| ⏱ Median existing-home price, Sep 2026 | **$417,500**, +1.3% y/y (Sep 2025: $412,300). 2026 peak: $442,800 (Jun) | High (NAR series on FRED) |
| ⏱ Existing-home sales, Sep 2026 | **3.99 million** SAAR, +1.5% m/m (Aug 3.93M); Sep 2025: 4.08M | High |
| NAR's Lawrence Yun | "Further increases in mortgage rates in recent weeks mean fewer buyers can qualify to purchase a home." | Medium (S42 extract) ⚑ confirm on NAR's release page |
| Inventory | 1.60 million (Sep 2026) | Medium (S42) |
| Census median sales price (all homes, Q2 2026) | $410,700 (MSPUS); new homes, Aug 2026: $393,700 | High (S43) |
| ⚑ Affordability index | Not pulled (NAR HAI or Atlanta Fed HOAM). Optional | — |

### 7c. The lock-in effect (FHFA NMDB, Q2 2026; released 30 Sep 2026; S40)

Shares of **51.4 million** outstanding mortgages, by number of loans (our sums of FHFA's buckets):

| Rate on the loan | Q2 2026 | Q1 2022 (peak of cheap money) |
|---|---|---|
| Below 3% | **19.2%** | 24.6% |
| 3–4% | 29.9% | 40.6% |
| **Below 4%** | **49.1%** (about half) | 65.2% |
| 4–5% | 16.5% | 20.3% |
| **Below 5%** | **65.6%** (about two in three) | 85.5% |
| 5–6% | 12.0% | 7.0% |
| **Below 6%** | **77.6%** ("more than three in four") | 92.5% |
| 6% or more | 22.5% | 7.5% |
| Average rate, all outstanding | **4.4%** | 3.8% |

Confidence: **High** (FHFA file, our sums). **The brief's "four in five pay under 6%" → say "more than three in four" (77.6%).**

---

## 8. The climax: the next auctions (Treasury tentative schedule, S09; refunding S10, S11)

| Date (2026) | Event | Detail | Confidence |
|---|---|---|---|
| **Wed 4 Nov** | **Quarterly refunding announcement** (sizes for the Nov 3/10/30-year auctions; guidance) | "The next release is scheduled for November 4, 2026" (S11); also the announcement date for the three refunding auctions (S09). ⚑ time of day (usually 8:30 am ET; not on the page) | High (date) |
| Mon 9 Nov | 3-year note auction | Settles 16 Nov | High |
| **Tue 10 Nov** | **10-year note auction** (a **new** issue, not a reopening) | Settles Mon 16 Nov | High |
| Wed 11 Nov | Veterans Day: markets closed | — | High |
| **Thu 12 Nov** | **30-year bond auction** (new issue) | Settles Mon 16 Nov | High |
| Wed 18 Nov | 20-year bond | — | High |
| Thu 19 Nov | 10-year TIPS (reopening) | — | High |
| 23–25 Nov | 2-, 5- and 7-year notes (2-year FRN on 24 Nov) | — | High |
| Tue 8 Dec / Thu 10 Dec | Next 10-year / 30-year (reopenings) | — | High |
| Likely sizes ⚑ | Not yet announced. The Aug refunding sized the new 10-year at **$42B** and 30-year at **$25B**, and "Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters" (5 Aug 2026) | S10 | High (guidance); the Nov sizes are **unknown until 4 Nov** |
| Other dates nearby ⚑ | The next FOMC meeting and the Sep TIC release (mid-Nov) aren't verified here | — | ⚑ |

Script-safe climax: "On November tenth, at one in the afternoon, the Treasury will sell its next batch of ten-year notes. Whatever price those bids set will flow into mortgage rates within days."
(The "within days" is our reading of S26; PMMS is weekly. Say "within days" only, never "the same day".)

---

## 9. Story material for the middle of the film

### 9a. The first Treasury bill auction, December 1929

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The notice | NY Fed Circular No. 949, **10 Dec 1929**: "$100,000,000 (or thereabouts) … Public Notice of Offering of Treasury Bills." Secretary Mellon: the bills "will be sold on a discount basis to the highest bidders" | S44 | High (primary) |
| The deadline | Tenders "up to two o'clock P. M., Eastern Standard time, on Friday, December 13, 1929." "Tenders will not be received at the Treasury Department, Washington." | S44 | High |
| The paper | Dated 17 Dec 1929, maturing 17 Mar 1930; "bearer form only," denominations $1,000, $10,000 and $100,000; "No tender for an amount less than $10,000 will be considered." Prices bid to three decimals, "e. g., 99.125. Fractions must not be used." | S44 | High |
| The result | On Saturday 14 Dec, Treasury said investors bid for **$224 million**; it accepted from **99.310** down to a stop of **99.152**; bids at the stop got 80%; average price **99.181** | S45 (Garbade, citing NYT 15 Dec 1929) | High |
| As a rate (our math) | Average price 99.181 on a 90-day bill = discount rate **3.276%** ((100 − 99.181) × 360/90) | our math | High |
| The winners | A two-dealer syndicate, Salomon Brothers & Hutzler and the International Manhattan Company, "won the major portion" and resold $70M at 3⅛% | S45 | High |
| Under Secretary Mills | "entirely satisfied"; the auction gave "considerably cheaper money than we could get through the medium of certificates of indebtedness" | S45 (quoting NYT/WSJ) | High |
| Why auctions at all | Garbade: 1920s fixed-price offerings were "chronically oversubscribed," "a clear indication that the offerings were persistently underpriced" | S45 | High |
| Vivid contrast | 1929: paper tenders in special envelopes, opened after 2 pm, results "probably on the following morning" (S44). 2026: electronic bids, a 1:00 pm close, results the same afternoon. 1929 was **pay-your-bid**; today everyone pays the single stop yield | S44, S06 | High |
| Context | Seven weeks after the October 1929 crash | (dates) | High |

### 9b. 1994: the "bond massacre" and Orange County

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The trigger | **4 Feb 1994**: the FOMC's first-ever same-day announcement: Greenspan "announced today that the Federal Open Market Committee decided to increase slightly the degree of pressure on reserve positions"; target to **3.25%** (+25 bp), its first tightening since early 1989 | S46, S24 | Medium-High (search extract of the Fed release) |
| The hikes | Funds target 3.00% → 5.50% by 15 Nov 1994 (seven moves), then 6.00% on 1 Feb 1995 | S24 (FRED DFEDTAR) | High |
| The bond rout (our math) | 10-year: **5.19% (15 Oct 1993)** → **8.05% (7 Nov 1994)**, almost **+2.9 pts** | S17 | High |
| Fortune's verdict | Al Ehrbar, "The Great Bond Massacre," *Fortune*, **17 Oct 1994**: "1994 became the year of the worst bond market loss in history." The 30-year's rise from 6.2% to 7.75% "knocked more than $600 billion off the value of U.S. bonds"; worldwide losses "on the order of $1.5 trillion" | S47 | Medium-High (extract of Fortune's archive) |
| Quotes in it | Merton Miller: "I'll never understand why they call bonds 'fixed' income." A Fed policymaker: "There's no way that our 25-basis-point increase caused German bond rates to jump 200 basis points." | S47 | Medium (extract) ⚑ read the full article before quoting on screen |
| Orange County: the pool | Treasurer **Robert Citron**'s **$7.4–7.5B** pool was leveraged with short-term borrowing to **more than $20B** of positions betting rates would stay low | S48 (pool $7.4B); S49 / Lockyer memo via search (>$20B) | Medium |
| The loss | **1 Dec 1994**: county announces a $1.5B "paper loss"; final tally **$1.64B** | S48, S49 | Medium-High |
| Citron | Resigned **4 Dec 1994**; pleaded guilty **27 Apr 1995** to six felony counts; sentenced to a year in jail, five years' probation and a $100,000 fine | S48 | Medium-High |
| The bankruptcy | **6 Dec 1994**, Chapter 9: "the largest such filing in history" (at the time) | S48 | Medium-High |

### 9c. The UK gilt crisis, Sept–Oct 2022

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The trigger | The UK fiscal statement of **23 Sep 2022** (Kwarteng's "mini-budget") | S51 | High |
| The move | "By 28 September, the yield on 30-year gilts had risen by 130 basis points in just three days of trading", "a move three times larger than any other historical move over a similar period" | S51 (BoE Quarterly Bulletin 2023) | High |
| The mechanism | LDI (liability-driven investment) pension funds faced "increased margin calls on their derivative and repo positions"; selling gilts to meet them risked "self-reinforcing 'fire sale' dynamics" | S51, S52 | High |
| The rescue | BoE, **28 Sep 2022**: "Were dysfunction in this market to continue or worsen, there would be a material risk to UK financial stability." Purchases "on whatever scale is necessary"; "strictly time limited" | S50 | High |
| The size | Up to £5bn per daily auction, raised to £10bn on 10 Oct; **£19.3bn** bought in total (£12.1bn conventional, £7.2bn index-linked), 28 Sep – 14 Oct | S51, S52 | High |
| The politics | Chancellor Kwarteng dismissed **14 Oct 2022** ⚑ (not sourced here). Truss, **20 Oct 2022**: "I cannot deliver the mandate on which I was elected by the Conservative Party." | S53 | Medium (gov.uk via search; ⚑ open the page) |
| Aftermath | Cunliffe (18 Oct): compared with 22 Sep, 30-year gilt yields were still **60 bp higher**, vs 35 bp for the US and 42 bp for Germany | S52 | High |
| Callback ⏱ | The UK 30-year hit its highest since **1998** on 7 Oct 2026 (NBC) | S56 | Medium |

### 9d. "Bond vigilantes" and Carville

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Who coined it | Ed Yardeni, in his own words (22 Aug 2023): "I did coin the term 'Bond Vigilantes' in 1983." In the early 1990s, "the Clinton administration maintained fiscal discipline largely because they feared the Bond Vigilantes." | S55 | High (tier 3, his own record) |
| The 1983 line | Reported as: "If the fiscal and monetary authorities won't regulate the economy, the bond investors will." (Yardeni, Prudential-Bache, July 1983) | Fortune 2023 via search | Low-Medium ⚑ (wording varies: "investor" vs "investors"; 1983 paper not read) |
| **Carville's quote** | "I used to think if there was reincarnation, I wanted to come back as the president or the pope or a .400 baseball hitter. But now I want to come back as the bond market. You can intimidate everybody." | S54: Rose & Spiegel (FRBSF WP 2015-09) citing *Wall Street Journal*, **25 Feb 1993, p. A1** | Medium-High. ⚑ original WSJ page not read; a common variant says "would like to come back". **Use the FRBSF wording and caption "via WSJ, 25 Feb 1993"** |
| The WSJ piece | Reported as David Wessel & Thomas T. Vogel, "Arcane World of Bonds Is Guide and Beacon to a Populist President" | Conversable Economist via search | Low ⚑ |
| Carville's role | Clinton's 1992 campaign strategist | (common knowledge) | Medium ⚑ cite |
| ⏱ 2026 | Yardeni (NBC, 7 Oct 2026): "France may be on the verge of a full-blown debt crisis" | S56 | Medium |

### 9e. Auction "tail" scares

| Auction | What happened | Source | Confidence |
|---|---|---|---|
| **7-year, 25 Feb 2021** ($62B at 1.195%) | Bid-to-cover **2.04**, the lowest for any 7-year since at least 2009 (our math); dealers took **39.8%** (vs ~20% in the surrounding months); indirect only 38.1% | S05 (our math) | High |
| …its tail | Reported as "exceeding 4 basis points"; Forex.com gives indirects 38.06% and bid-to-cover 2.045 | S59 | Low-Medium ⚑ (no tier-5 wire found; commonly cited as ~4.3 bp) |
| **30-year, 9 Nov 2023** ($24B at 4.769%) | Bid-to-cover 2.24; dealers took **24.7%** (our math, S05; Brookings uses the same 24.7% as its example of weak demand, S14); tail **5.3 bp** (4.769% vs 4.716% WI) | S05, S14, S58 | High (data); Medium (tail, tier 5–6) |
| March 2020 | Dallas Fed lists the **11 Mar 2020** 10-year as one of three "surprising" 10-year sales in the pandemic | S13 | Medium |
| **Contrast: 7 Oct 2026** | The opposite of a scare: record-low dealer take (2.5%), highest bid-to-cover since 2016. The *yield* was alarming; the *demand* wasn't | S01, S05 | High |

---

## 10. Pictures and documents we can show

| # | Item | Use | Rights / note |
|---|---|---|---|
| D1 | TreasuryDirect results PDF, 7 Oct 2026 (S01) | Red loop on "High Yield 5.300%" and "Primary Dealer … $984,000,000" | US government work |
| D2 | Offering announcement, 1 Oct 2026 (S03) | "Competitive Closing Time 1:00 p.m. ET" | US government work |
| D3 | NY Fed Circular 949, 10 Dec 1929 (S44) | "$100,000,000 (or thereabouts)" | FRASER digitisation; ⚑ check FRASER's terms |
| D4 | Freddie Mac PMMS chart (S18) | 7.40% | Rebuild the chart in 3D from FRED data rather than screenshot ⚑ |
| D5 | BoE notice, 28 Sep 2022 (S50) | "whatever scale is necessary" | ⚑ BoE copyright terms |
| D6 | FOMC statement, 16 Sep 2026 (S23) | "raise the target range" | US government work |
| D7 | Treasury tentative auction schedule (S09) | 10 Nov / 12 Nov lines | US government work |

---

## 11. Computed numbers (our math; label "Our math" on screen)

| # | Number | Working | Result | Confidence |
|---|---|---|---|---|
| C1 | Highest 10-yr auction since | Rank 362 nominal 10-year auctions by high yield; last ≥ 5.300% before 7 Oct 2026 | **8 Nov 2000 (5.865%)** | High |
| C2 | Highest 30-yr auction since | Same method, 287 auctions; last > 5.618% | **10 Aug 2000 (5.697%)** | High |
| C3 | Dealer take | $984.0M ÷ $38,665.4M | **2.5%**, lowest in 10-year data since 2008 | High |
| C4 | Bidder shares | Indirect $31,063.2M, direct $6,618.2M ÷ competitive | **80.3% / 17.1%** | High |
| C5 | Bid-to-cover rank | 2.77 vs prior-12 average 2.507 | Highest since Jan 2016 | High |
| C6 | FY2026 auctions | Count and sum of S05 rows dated 1 Oct 2025 – 30 Sep 2026 | **436; $31.28T offered; $32.89T incl. $1.61T SOMA** | High |
| C7 | Spread now | 7.40 − 5.10 | **2.30 pts** (2.21 vs the week's average) | High |
| C8 | Spread average | Mean of weekly PMMS − 7-day avg 10-year, Apr 1971 – Oct 2026 | **1.76 pts** | High |
| C9 | Payments | Formula §7a | **$2,769.52 vs $2,468.07 (+$301.44); +$108,520 over 30 yrs** | High |
| C10 | Debt growth | $40.388T − $37.943T | **+$2.45T in a year** (≈ $6.7B a day) | High |
| C11 | Interest share | $1,051.8B ÷ $5,403.3B | **19.5% of revenue** | High |
| C12 | Bills share | $7.118T ÷ $31.835T | **22.4%** | High |
| C13 | 12-month wall | Sum of MSPD table 3 securities maturing ≤ 30 Sep 2027 | **$10.64T (33.4%)** | High |
| C14 | Fed share | $4.570T ÷ $31.835T | **14.4%** of marketable | High |
| C15 | Foreign share | $9.332T ÷ $32.415T (31 Aug) | **28.8%** of public debt | High |
| C16 | 1929 rate | (100 − 99.181) × 360/90 | **3.276%** | High |
| C17 | 1994 rout | 8.05 − 5.19 | **+2.86 pts** | High |
| C18 | Lock-in | 19.2 + 29.9 (+16.5 + 12.0) | **49.1% < 4%; 65.6% < 5%; 77.6% < 6%** | High |
| C19 | Paradox windows | §4c | See §4c | High |
| C20 | 10-year high | Max 2026 close; last close ≥ 5.31% | **5.31% (5 Oct 2026); last higher 14 May 2002 (5.32%)** | High |

---

## 12. Counter-intuitive facts for the hook and the climax

1. **The Fed cut a full point in four months, and mortgage rates rose almost a full point** (6.09% → 7.04%, Sep 2024 – Jan 2025) (S19, S20, S24).
2. **After 1¾ points of cuts, mortgages finished *higher*** than when the Fed started (6.09% → 6.22%) (§4c).
3. **On 7 Oct 2026, $39 billion of US debt sold at 5.300%, the highest 10-year price America has paid since November 2000** (S01, S05).
4. **The scary yield came with *strong* demand**: $108B of bids, and dealers were left with just 2.5%, the lowest on record since 2008 (S01, C3).
5. **The auction is single-price**: the highest accepted bid sets the rate for everyone (S06).
6. **Your 30-year loan is priced off a 10-year note** because most mortgages are gone within about ten years (S26).
7. **America now spends more on interest than on its military**: $1.05T vs $965B in FY2026 (S32).
8. **A third of the marketable debt, $10.6 trillion, comes due within a year** and must be re-sold at today's rates (C13).
9. **Half of all US mortgages are below 4%**, so half of owners would roughly double their rate by moving (S40).
10. **"Indirect bidders" are mostly US investment funds, not foreign governments** (S15).
11. **The first T-bill auction (Dec 1929) was done with paper bids in special envelopes**, seven weeks after the crash (S44).
12. **In 2022 the gilt market moved three times more in three days than ever before**, and the Bank of England had to step in "on whatever scale is necessary" (S50, S51).

---

## 13. Contested (say both versions or pick the safe one)

| # | Issue | Versions | What to say |
|---|---|---|---|
| C-1 | Interest cost FY2026 | MTS net interest **$1.052T (+$81B)**; CBO (via AAF) **+$115B (+11%)**, level ~$1.14T (secondary); gross interest on public issues $1.069T; all Treasury interest incl. trust funds $1.36T | "**More than a trillion dollars** in interest" (true on every measure); caption the MTS figure |
| C-2 | Interest's rank | CBO: second after Social Security. MTS functions: third (after Social Security and Medicare) | "**More than the entire defense budget**" |
| C-3 | "Fed cut, mortgage rose" | Cut cycle: +0.13; first 4 months: +0.95; since the first cut: +1.31 (with a hike inside) | Use the §4c safe lines, with dates |
| C-4 | Carville's wording | "I want to come back" (FRBSF/WSJ citation) vs "I would like to come back" | FRBSF wording, captioned "WSJ, 25 Feb 1993, via FRBSF" |
| C-5 | 1994 losses | Fortune: >$600B (US), ~$1.5T (world); later retellings: "$1 trillion" | "**More than six hundred billion dollars** wiped off US bonds, by Fortune's count" |
| C-6 | Orange County loss | $1.5B (initial "paper loss"), $1.64B (final), ~$1.7B (rounded) | "**$1.64 billion**" |
| C-7 | 1994 Fed tightening | +2.5 pts in 1994 (3.00 → 5.50), +3.0 through Feb 1995; some secondary sources say 2.25 | "**The Fed doubled its rate in a year**" (3% → 6% by Feb 1995) or "raised it by two and a half points in 1994" |
| C-8 | Japan's "selling" | Holdings −$171B (Feb–Aug 2026) at market value | "Japan's holdings **fell** by $171B" (not "Japan sold") |
| C-9 | Feb 2021 tail | ">4 bp" / "~4.3 bp" (market sources only) | Use bid-to-cover 2.04 and the 39.8% dealer take instead |

---

## 14. DO NOT CLAIM

- **"The Fed sets mortgage rates."** It doesn't set them directly, but **"the Fed has nothing to do with mortgage rates" is also false**: it moves them through expectations and its balance sheet (S26), and in Sep 2026 it hiked while mortgages climbed. Say "**the Fed doesn't set your mortgage rate. It sets an overnight rate. Your mortgage is priced off a ten-year IOU that's sold at auction.**"
- **"The Fed cut 1.75 points, and mortgages rose from 6.09% to 7.40%"** as one sentence or one graphic without dates. The 7.40% came 10 months after the last cut and a month after a **hike**. (Packaging thumbnail B "−1.75 / NOT THE FED" needs a date line or a different number pair.)
- **"The auction failed" / "a weak auction" / "nobody wanted US debt"** for 7 Oct 2026. Demand was **strong** (BTC 2.77; dealers 2.5%). Treasury auctions essentially never fail (S14). The story is the **price**, not the demand.
- **"Foreigners / Tokyo / London bought 80%."** "Indirect" includes US funds bidding through dealers; in Sep 2026 foreign accounts took ~28% (S15). The brief's "buyers shown as flows from Tokyo, London and the Caymans" must not imply national shares for the 7 Oct auction (that data comes out in November ⚑).
- **"China is dumping Treasuries" / "Japan sold $171B."** TIC holdings are at market value and assigned by custodian location; holdings fell, which isn't the same as selling.
- **"Highest 10-year yield since 2000."** The **auction** high yield is the highest since **Nov 2000**; the **market** close (5.31%) is the highest since **May 2002**. Don't swap them.
- **"Highest yields ever"** or **"record rates."** The 10-year was ~15.8% in 1981.
- **"The Fed is still doing QT" / "the Fed is dumping bonds."** QT ended 1 Dec 2025; the Fed is buying bills. Its **MBS** holdings are still shrinking ($1.90T, −$188B y/y).
- **"The Fed buys at Treasury auctions."** It rolls maturing holdings as add-ons outside the offering; it doesn't bid competitively.
- **"Primary dealers must buy whatever is unsold."** They must "bid on a pro-rata basis in all Treasury auctions at reasonably competitive prices" (S08).
- **"Non-competitive bids close at 11:30."** For notes and bonds it's **12:00 noon ET**; competitive **1:00 pm ET** (S03).
- **"Results come out in seconds."** ⚑ unsourced; say "that afternoon" or find a Treasury source for "within minutes".
- **"America pays $1.36 trillion in interest."** $292B of that is paid to its own trust funds. Use net interest **$1.05T**.
- **"$40 trillion must be refinanced"** or **"all of it at 5.3%."** ~$10.6T comes due within a year, mostly bills priced near 4%, not 5.3%.
- **"Four in five homeowners pay under 6%."** It's 77.6%: "more than three in four" (S40).
- **"Households own $2.8T of Treasuries."** Z.1's household sector includes hedge funds.
- **"Yardeni wrote 'If the fiscal and monetary authorities won't regulate the economy, the bond investors will'"** as a verbatim quote. ⚑ wording unverified.
- **"The bond market brought down Liz Truss"** as sole cause. Say "the market revolt helped end her government within weeks"; her own words cite her mandate, not the gilt market.
- **"Orange County was the biggest municipal bankruptcy ever."** It was the largest **at the time**.
- **"1994: bondholders lost $1 trillion."** Use Fortune's ">$600 billion" (US).
- **Anything on oil, Hormuz or AI bond issuance as *the* cause** of the 2026 rise. Tier-5 context only, one line, attributed (NBC).
- **"The next 10-year auction will be $42B."** Unknown until **4 Nov 2026**.

---

## 15. Open items (⚑) before script lock

1. **CBO MBR Sep 2026** (cbo.gov/publication/61985): 403 from this sandbox. Read it and reconcile CBO's "net interest on the public debt" (+$115B) with the MTS $1,051.8B (+$81.4B).
2. **Treasury investor-class allotments for October** (posted early Nov): who bought the 7 Oct 10-year by class (foreign vs funds) ⏱.
3. **7 Oct 10-year tail / stop-through**: find a wire (Reuters/Bloomberg) giving the WI yield at 1:00 pm.
4. **"Results within minutes"**: find a Treasury source, or drop the phrase.
5. **Nov refunding (4 Nov)**: offering sizes and guidance language; re-check the 10 Nov / 12 Nov dates on S09 ⏱.
6. **Carville**: get the WSJ 25 Feb 1993 page A1 (ProQuest/Factiva) and confirm wording and byline.
7. **Yardeni 1983 line**: find the July 1983 Prudential-Bache paper or a primary reproduction.
8. **Fortune 1994**: read the full Ehrbar article before quoting Miller or the Fed policymaker.
9. **Orange County**: get a tier-1 record (court filing, SEC or state report) for $1.64B and the >$20B leverage; open the Lockyer memo.
10. **Feb 2021 7-year tail size**: find a wire report or drop the number.
11. **Single-price 1998**: open the Federal Register notice (FR 64:15, 25 Jan 1999).
12. **Gov.uk Truss statement** and the Kwarteng dismissal date (14 Oct 2022): open primary pages.
13. **TIC**: confirm Form SLT valuation basis in the TIC FAQ; pull net-sales flows for Japan/China.
14. **Z.1**: verify the FRED series against Z.1 L.210 (Q2 2026) and its valuation notes.
15. **NAR**: open NAR's Sep 2026 release (13 Oct?) for the Yun quote, inventory and months' supply.
16. **Warsh**: date he became chair (Fed press release).
17. **Re-pull on VO day and publish day ⏱**: PMMS (Thursdays), Treasury par curve, Debt to the Penny, H.4.1 (Thursdays), primary dealer list.
18. **Wayback-save** every URL in SOURCES.md (playbook §8.3). None were saved in this session.
