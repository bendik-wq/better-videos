# The AI Bubble: research and fact pack

Episode on the circular money machine behind the AI boom, the 2000 precedent and how it could pop. Compiled **2026-10-20**. The script is written from this pack, never from memory. Every spoken or on-screen number needs a row here. Source IDs (S01…) point to `SOURCES.md`, which gives full URLs, dates, tiers and read status.

**Tiers (as briefed for this episode)**
- **T1**: primary records: SEC filings (10-K, 10-Q, 8-K, S-1, 424B), company releases and call transcripts, central bank, IMF, BLS, FRED and other official data.
- **T2**: newspapers of record and wires (Reuters, AP, Bloomberg, FT, WSJ, NYT, CNBC, CNN).
- **T3**: named-author books and academic papers.
- **T4**: reputable reference (Gartner, Bain, Sequoia, IEA-type research, Wikipedia for old dates, trade press).
- **T5**: other (blogs, aggregators, social posts).

**Markers**
- ⏱ means the number moves. It carries an AS-OF date. Re-check on VO-lock day and on publish day.
- ⚑ means I could only see it in a snippet, extract or secondary outlet, or couldn't verify it. Resolve or cut before lock.
- ⚠ DISPUTED means sources conflict. Both sides are given.

**Access note.** CNBC, FT, Bloomberg, WSJ, Forbes, Gartner and S&P pages return 403 or paywalls to this environment. Reuters and AP were read through syndication (Yahoo, AOL, ABC News). CNN was read via ABC17 (CNN Newsource). SEC EDGAR and FRED were read **directly** and are the backbone of this pack. Where a T2 outlet is cited only from a search snippet, the row carries ⚑.

**Big framing correction for the writers (read first).**
1. **Nvidia did not "terminate" the $100B OpenAI deal in a filing.** The Sep 2025 letter of intent never became a definitive agreement. Nvidia's 10-K (25 Feb 2026) still said "there is no assurance". The FT reported the same week that it was being *replaced* by a **$30B equity stake** in OpenAI's 2026 round. Then in **Aug 2026, Nvidia went further and guaranteed up to $105B of OpenAI's data-centre lease payments** (8-K, 17 Aug 2026). The circle didn't break. It changed shape, from equity into a credit guarantee. That twist is the story.
2. **Anthropic has NOT publicly filed its S-1 yet.** It confidentially submitted a draft on **1 Jun 2026**. As of **20 Oct 2026**, no Anthropic S-1 is on EDGAR (full-text search checked). The "S-1 numbers" circulating come from a **draft leaked to Reuters** (29 Sep 2026). Say "a leaked draft of its IPO filing", never "its S-1 shows".
3. **The October 2026 rout was not a crash.** The Nasdaq fell **4.5% in the week to 16 Oct**, its worst week since June, and is **~5.3% below its 6 Oct record**. The violent moves were in the *indebted* corner of AI: CoreWeave (−25% on the week, bonds near 15%), Oracle (−61% from its Sep 2025 peak, CDS at records) and chip stocks (SOX −11% on the week). The trigger was **rates plus funding**, not a failed model. Frame it as "the cracks appeared in the credit market first".
4. **The macro backdrop is different from 2025.** The Fed **hiked** in Sep 2026 (to 3.75–4.00%). US CPI was **3.7%** in September. The 10-year yield is **~5.1%**. Oil is around **$100** with a Gulf war in its eighth month (IMF). AI's buildout is now financed at much higher rates than when the deals were signed.

---

## 0. Timeline at a glance

| Date | Event | Source |
|---|---|---|
| 10 Mar 2000 | Nasdaq closes at record 5,048.62 | S52 |
| 27 Mar 2000 | Cisco closes at $80.06 (split-adj.) and briefly becomes the world's most valuable company | S52, S53 |
| 30 Sep 2000 | Lucent customer-financing commitments hit $8.1B | S50 |
| 9 Oct 2002 | Nasdaq bottoms at 1,114.11 (−77.9%) | S52 |
| 14 Jan 2009 | Nortel files for creditor protection | S55 |
| 23 Apr 2015 | Nasdaq finally closes above its 2000 peak | S52 |
| 20 Jun 2024 | Sequoia, "AI's $600B Question" | S61 |
| 21 Jan 2025 | Stargate announced ($500B over 4 years) | S91 ⚑ |
| 27 Jan 2025 | DeepSeek shock: Nvidia −17%, ~$593B lost in a day (record) | S75 |
| 10 Sep 2025 | Oracle +36% to $328.33 on OpenAI-driven backlog. Ellison briefly world's richest | S72, S05 |
| 22 Sep 2025 | Nvidia–OpenAI LOI: 10 GW, "up to $100B" | S17 |
| 23 Sep 2025 | CoreWeave–OpenAI $6.5B order | S27 |
| 5–6 Oct 2025 | AMD gives OpenAI warrants for up to 160M shares | S24 |
| 8 Oct 2025 | IMF and Bank of England warn on AI valuations | S66, S68 |
| 13 Oct 2025 | OpenAI–Broadcom 10 GW custom chips | S74 |
| 28 Oct 2025 | Microsoft–OpenAI recapitalisation. OpenAI commits +$250B Azure | S29 |
| 6 Nov 2025 | Altman: ~$1.4T of commitments over 8 years, >$20B run-rate | S46 |
| 18 Nov 2025 | Anthropic: $30B Azure. Nvidia up to $10B, Microsoft up to $5B | S30 |
| 19 Nov 2025 | Huang: "From our vantage point, we see something very different" | S71 |
| 10 Dec 2025 | Cisco finally beats its March 2000 closing high (after 25 years) | S53 |
| Jan 2026 | WSJ: Nvidia–OpenAI deal "on ice". Nvidia buys $2B of CoreWeave stock | S21, S28 |
| 2 Feb 2026 | SpaceX acquires xAI | S84 |
| 13 Feb 2026 | Alphabet sells $20B + £5.5B of bonds, including a **100-year** bond | S35 |
| 20 Feb 2026 | OpenAI resets its compute target to ~$600B by 2030 | S45 ⚑ |
| 24–25 Feb 2026 | FT: Nvidia drops the $100B plan for a $30B stake. Nvidia 10-K: "no assurance" | S21, S18 |
| 27 Feb 2026 | OpenAI round: Amazon $50B, Nvidia $30B, SoftBank $30B. AWS deal +$100B | S23, S22 |
| 6 Mar 2026 | Bloomberg: Oracle and OpenAI drop the Abilene expansion | S48 ⚑ |
| 31 Mar 2026 | OpenAI round closes at $122B, $852B post-money | S22 ⚑ |
| 28 Apr 2026 | WSJ: OpenAI missed internal user and revenue targets. Microsoft–OpenAI deal rewritten | S86, S85 |
| 28 May 2026 | Anthropic Series H: $65B at $965B post | S43 ⚑ |
| 1 Jun 2026 | Anthropic confidentially submits a draft S-1 | S39 |
| 12 Jun 2026 | SpaceX (incl. xAI) IPO prospectus (Nasdaq: SPCX) | S84 |
| 9 Jul 2026 | S&P cuts Oracle to BBB−, one notch above junk | S34 ⚑ |
| 10 Aug 2026 | Nvidia MOUs with Apollo, BlackRock, Blackstone, Brookfield, Goldman and KKR for financing platforms for ">$500B" | S49 |
| 17 Aug 2026 | Nvidia guarantees up to $105B of OpenAI's Ohio data-centre leases | S20 |
| 16 Sep 2026 | Fed raises rates 25 bp to 3.75–4.00% | S08 |
| 29 Sep 2026 | Draft Anthropic S-1 leaks: 2025 revenue $4.6B, net loss ~$42B | S41 ⚑ |
| 6 Oct 2026 | Record closes: Nasdaq 27,599.79. Nvidia $239.24 (~$5.77T) | S05 |
| 8 Oct 2026 | FT: OpenAI run-rate ~$50B, not ~$70B. AI stocks fall | S14, S15 |
| 14 Oct 2026 | CPI 3.7%. Nasdaq −1.88%. Oracle −8.8%, CoreWeave −15%. Gartner "$3.5T" report | S02, S07, S10 |
| 15 Oct 2026 | Kospi −7.6% (circuit breaker). Anthropic Q3 revenue $16.8B (+45% q/q, slowing). CoreWeave CDS >1,100 bp | S04, S44, S13 |
| 16 Oct 2026 | Nasdaq −2.1% to 26,140.03. Week −4.5%, worst since June | S01 |
| 19 Oct 2026 | Oracle 5-yr CDS ~315 bp (record area). Gartner's Lovelock: "more compute capacity than we have demand" | S13, S11 |

---

## 1. The rout (October 2026)

| # | Claim | Number and date | Source (tier) | Flags |
|---|---|---|---|---|
| 1.1 | Nasdaq Composite record close | **27,599.79 on 6 Oct 2026** | S05 Yahoo price history (T4 data) | ⏱ |
| 1.2 | Nasdaq close Fri 16 Oct | **26,140.03**, −572.99 (−2.1%) on the day. Week **−4.5%** (−1,226.14 pts). Still **+12.5% YTD** | S01 AP (T2) | ⏱ |
| 1.3 | Nasdaq drawdown from record to 16 Oct | **−5.3%** (calc: 26,140.03 / 27,599.79 − 1) | S05, S01 | ⏱ |
| 1.4 | S&P 500 16 Oct | **7,659.44**, −1.1%. Week −1.9%. +11.9% YTD | S01 (T2) | ⏱ |
| 1.5 | Worst week since June | AP: S&P 500 and Nasdaq posted their worst weeks since June | S01 summary via search (T2) | ⚑ wording |
| 1.6 | Chip index on the week of 12–16 Oct | SOX **−11.41%**, worst week since Apr 2025 | S97 (T5) | ⚑ verify with Nasdaq/PHLX |
| 1.7 | Chip index losing streak | Philadelphia SE Semiconductor Index fell for a **7th straight day** on 15 Oct. Down ~20% from its June peak | S03 Reuters (T2), S04 CNN (T2) | |
| 1.8 | Wed 14 Oct, the trigger day | Nasdaq **−1.88% to 26,692.87** (biggest drop since 23 Jul). S&P −1.11% to 7,718.94. SOX −4.3% | S02 Reuters (T2) | |
| 1.9 | Trigger 1: inflation | Sep CPI **+0.6% m/m, +3.7% y/y** (vs 3.4% in Aug). Gasoline +9.1% m/m | S07 BLS (T1) | |
| 1.10 | Trigger 1b: rate-hike odds | CME FedWatch odds of a hike that month rose to **37% from 22%** (14 Oct). Odds of a hike by December reached **67%** (15 Oct) | S02, S03 Reuters (T2) | ⏱ |
| 1.11 | Fed already hiking | FOMC **raised** the funds range 25 bp to **3.75–4.00%** on **16 Sep 2026**, vote 12–0. Statement: "Inflation remains elevated." | S08 Fed (T1) | |
| 1.12 | 10-year Treasury yield | **5.09%** on 16 Oct 2026. It was 5.28% on 7 Oct | S09 FRED DGS10 (T1) | ⏱ |
| 1.13 | Oracle on 14 Oct | **−8.8%**, close **$130.55**, volume 50.4M (61% above average) | S02 (T2), S06b Motley Fool (T5) | |
| 1.14 | CoreWeave on 14 Oct | **−15% (to $65.78)** after a sell-off in its bonds | S02 (T2), S05 | |
| 1.15 | Others on 14 Oct | Dell −11.4%, Nebius −10%, HPE −8.2% (Barclays downgrade of Dell and HPE) | S02 (T2) | |
| 1.16 | The irony on 14 Oct | **Apple closed above $5 trillion** market cap for the first time on the same day | S02 (T2) | |
| 1.17 | Thu 15 Oct, Asia | **Kospi −7.6%**, circuit breaker triggered. SK Hynix −11%, Samsung −9.5%, Nikkei −4.9% | S04 CNN (T2) | |
| 1.18 | 15 Oct US | S&P +0.33% (7,744.06) but Nasdaq only +0.08% after falling up to 1.4%. Nvidia −1.8%, Dell −6.9%, HPE −7.1%. Producer prices posted the biggest rise in 4.5 years | S03 Reuters (T2) | |
| 1.19 | Rotation signal | Nasdaq 15 Oct: **61 new highs vs 393 new lows**. Healthcare led the S&P | S03 (T2) | |
| 1.20 | Other named triggers | TSMC's cautious 2027 outlook. China's CXMT memory progress. Gartner's neocloud forecast. "Signs of slowing revenue growth at Anthropic and OpenAI". Midterm uncertainty on data-centre policy | S04 CNN (T2), S03 | |
| 1.21 | Earlier trigger, 8 Oct | FT: OpenAI told investors its annualised revenue was **~$50B at end-Sept**, not the ~$70B reported. CoreWeave −7.8% (to $81.58), Oracle ~−5.5%, Nvidia ~−3% | S14 TechCrunch (T4), S15 Yahoo (T4), S16 (T5) | ⚑ stock % from T5 |
| 1.22 | $ value lost | "20 of the most valuable global AI and semiconductor stocks have shed more than **$1 trillion** in value so far this week" (by 15 Oct) | search summary of CNBC/CNN coverage (T2) | ⚑ unverified, find the original |
| 1.23 | Nvidia from record to 16 Oct | Record close **$239.24 (6 Oct)** → **$214.13 (16 Oct)** = **−10.5%**. At 24.1B shares: **~$5.77T → ~$5.16T, ≈ −$605B** (calc) | S05 prices, S19 share count (T1) | ⏱ |
| 1.24 | Nvidia in the rout week alone | $229.28 (9 Oct) → $214.13 (16 Oct) = −6.6% ≈ **−$365B** (calc, 24.1B sh) | S05, S19 | ⏱ |
| 1.25 | AMD from record | $649.42 (6 Oct) → $528.75 (16 Oct) = **−18.6%** | S05 | ⏱ |
| 1.26 | Oracle from its Sep 2025 peak | **$328.33 (10 Sep 2025) → $128.23 (16 Oct 2026) = −60.9%**. 2026 low: $114.99 (24 Jul) | S05 | ⏱ |
| 1.27 | CoreWeave from its peak | **$183.58 (20 Jun 2025) → $61.39 (16 Oct 2026) = −66.6%**. Weekly drop >25% (week to 16 Oct) | S05, S11 | ⏱ |
| 1.28 | Monday 19 Oct | Partial rebound. Nasdaq 26,430.89. CoreWeave −0.4% | S05, S11 | ⏱ |
| 1.29 | **Current levels (intraday 20 Oct 2026)** | Nasdaq **26,485**. S&P 7,720. **Nvidia $216.84 (≈$5.23T)**. Oracle $133.24 (≈$403B at 3.024B sh). CoreWeave $62.83. AMD $542.33 | S05 (T4 data), S19, S32 share counts | ⏱ AS-OF 20 Oct 2026 intraday |
| 1.30 | Context: the market isn't expensive overall | S&P 500 ~**19× forward earnings, lowest since 2023**. Median S&P stock only +4% YTD, >200 members negative for 2026 | S03, S02 Reuters (T2) | ⏱ |
| 1.31 | Quote, rates | "The cost to finance everything, whether it be a new single-family house or a giant data center, is going up." (Jed Ellerbroek, Argent Capital) | S03 Reuters (T2) | |
| 1.32 | Quote, growth | "A slowdown in the AI infrastructure build out would imply a sharp slowdown in US growth expectations." (Mohit Kumar, Jefferies) | S04 CNN (T2) | |

---

## 2. The circle (who pays whom)

### 2a. Clean table

Read the arrows as **money flows**. "Equity" means the first party buys stock in the second. Status is as of 20 Oct 2026.

| # | Flow | Amount | For what | Date | Status (Oct 2026) | Source (tier) |
|---|---|---|---|---|---|---|
| C1 | **Nvidia → OpenAI** (equity) | "up to **$100B**", released per GW | LOI: ≥10 GW of Nvidia systems. First GW in 2H 2026 on Vera Rubin | 22 Sep 2025 | **Never became definitive.** 10-K (25 Feb 2026): "There is no assurance that we will enter into an investment and partnership agreement with OpenAI". FT (24–25 Feb 2026): dropped in favour of a **$30B** stake in the 2026 round | S17 (T1), S18 (T1), S21 (FT via Silicon UK, T2/T4 ⚑) |
| C2 | **Nvidia → OpenAI** (equity, actual) | **$30B** | Part of OpenAI's $110B round, "expected to be spent on Nvidia hardware" (FT) | 27 Feb 2026 | Done (round closed 31 Mar 2026) | S22 (T2 ⚑), S21 |
| C3 | **Nvidia → guarantor for OpenAI's landlord** | Guarantees **capped at $105B** | Residual-value guarantees on **20-year leases for ~4.25 GW** at SB Energy's PORTS campus, Pike County, Ohio. **OpenAI is the tenant.** If OpenAI goes insolvent or misses payments, Nvidia pays the shortfall. Site exclusively hosts Nvidia hardware. Option for +3.8 GW. Starts ~FY2029. OpenAI must reimburse Nvidia | 17 Aug 2026 | Signed (8-K Items 1.01 and 2.03, off-balance-sheet obligation) | S20 (T1), S19 (T1) |
| C4 | **OpenAI → Oracle** (cloud contract) | "**over $300B** over ~5 years" (reported) | ~4.5 GW of Stargate capacity | Sep 2025 (WSJ). Jul 2025 for 4.5 GW | Abilene **expansion** dropped Mar 2026 (Bloomberg); Oracle calls the reports "false and incorrect" for the broader deal. S&P: OpenAI ≈ **half of Oracle's $638B backlog** (Jul 2026). Oracle RPO now **$664B** | S48 (T2 ⚑), S34 (⚑), S32 (T1) |
| C5 | **Oracle → Nvidia** (chips) | Not broken out. Oracle capex: **$55.7B FY26** (Jun 25–May 26) and **$28.5B in Q1 FY27** alone | Servers and GPUs for OpenAI capacity | ongoing | Oracle's 10-Q: equipment is "primarily servers and networking equipment" | S33, S32 (T1). Specific Nvidia $ amount ⚑ |
| C6 | **OpenAI → AMD** (chips) **/ AMD → OpenAI** (warrant) | OpenAI commits to **6 GW** of AMD GPUs (first **1 GW MI450 binding**). AMD issues a warrant for **up to 160M AMD shares at $0.01** | Warrant vests per GW purchased and as AMD's price hits targets "that escalate to **$600** per share". Expires 5 Oct 2030 | 5–6 Oct 2025 | In force. AMD closed at **$649 on 6 Oct 2026** and **$542 on 20 Oct**, so the warrant is worth **~$87B at today's price** if fully vested (calc: 160M × $542). AMD gave **Meta an identical 160M-share warrant** on 23 Feb 2026 | S24, S25 (T1), S05 ⏱ |
| C7 | **OpenAI → CoreWeave** (cloud) | MSA 8 May 2025. Order for "up to approximately **$6.5B** through May 31, 2031" (Sep 2025). Total reported **~$22.4B** across three contracts | GPU cloud capacity | Mar–Sep 2025 | In force. CoreWeave RPO **$103.7B** (30 Jun 2026) | S27, S28 (T1). $22.4B total ⚑ (CoreWeave PR, not fetched) |
| C8 | **Nvidia → CoreWeave** (capacity backstop) | Initial value **$6.3B** | Nvidia "is obligated to purchase the residual unsold capacity through April 13, 2032" | 9 Sep 2025 | In force | S26 (T1) |
| C9 | **Nvidia → CoreWeave** (equity) | **$2.0B** (~23M shares at $87.20) | Private placement. Nvidia was already a shareholder and is the supplier of **all** CoreWeave's GPUs | Jan 2026 | Done. CoreWeave now $62.83 (−28% vs Nvidia's entry) | S28 (T1), S05 ⏱ |
| C10 | **Microsoft → OpenAI** (equity) | Total funding commitments **$13.0B, of which $11.9B funded** (30 Jun 2026). Stake **~25% as-converted** (10-K). Valued at ~**$135B** at the Oct 2025 recap | Investment | 2019–2023, recap Oct 2025 | In force | S31 10-K (T1), S29 (T1) |
| C11 | **OpenAI → Microsoft** (cloud + revenue share) | OpenAI "contracted to purchase an incremental **$250B** of Azure services" (Oct 2025). Microsoft recorded **$24.1B of revenue from OpenAI in FY2026** (Jul 25–Jun 26). Apr 2026 amendment: OpenAI pays Microsoft a **20% revenue share**, capped, guaranteed through 2030 | Azure compute + revenue share | Oct 2025, Apr 2026 | In force | S29, S31 (T1). Apr 2026 terms: S85 (T4 ⚑) |
| C12 | **Amazon → OpenAI** (equity) | **$50B**: $15B on 31 Mar 2026 plus a **$35B commitment**, payable on milestones or at OpenAI's IPO, by end-2028 | Series C preferred | 27 Feb 2026 | $15B funded; $35B conditional | S23 Amazon 8-K (T1) |
| C13 | **OpenAI → Amazon** (cloud) | Existing **$38B** deal (Nov 2025) "expanded by **$100B over 8 years**", including ~**2 GW of Trainium** | AWS compute | 27 Feb 2026 | In force | S23 Ex.99.1 (T1) |
| C14 | **SoftBank → OpenAI** (equity) | **$22.5B** (late 2025) + **$30B** (2026 round) | Equity. SoftBank **sold its entire Nvidia stake ($5.83B, Oct 2025)** partly to fund it | 2025–26 | Done | S73 (T2/T4), S22 |
| C15 | **Stargate** (SoftBank, OpenAI, Oracle, MGX) | "$500B over four years", "$100B immediately" | US AI data centres | 21 Jan 2025 | Partly built. SB Energy (SoftBank) is the landlord in C3 | S91 ⚑ |
| C16 | **OpenAI ↔ Broadcom** | **10 GW** of OpenAI-designed accelerators, racks from 2H 2026 to end-2029 | Custom chips + networking | 13 Oct 2025 | Term sheet | S74 (T1) |
| C17 | **Anthropic → Microsoft** (cloud) **/ Nvidia + Microsoft → Anthropic** (equity) | Anthropic commits **$30B** to Azure (+ up to 1 GW). **Nvidia up to $10B**, **Microsoft up to $5B** invested in Anthropic | Compute + equity | 18 Nov 2025 | In force | S30 (T1) |
| C18 | **Anthropic → Google / Amazon / Broadcom / Microsoft** (compute) | Leaked draft S-1: ~**$518B** of future compute commitments, ~80% non-cancellable: **Broadcom $161.2B, Google ~$111.1B, Amazon $110B, Microsoft $31.4B** (≈$104B unattributed) | Cloud and chips | as of draft (2026) | Unverified until public S-1 | S42 (T5 ⚑), S41 (T2/T4 ⚑) |
| C19 | **Amazon, Google → Anthropic** (equity) | Amazon's earlier total is widely reported at **$8B** (2023–24). The Series H included "$15B of previously committed investments from hyperscalers, including $5B from Amazon" | Equity | 2023–26 | — | S43 (⚑). Amazon $8B ⚑ |
| C20 | **Alphabet's paper gains** | Alphabet booked **$99.0B of equity-securities gains in Q2 2026** ($135.9B in H1), "primarily related to unrealized gains … from SpaceX and a private company". Its Q2 net income was **$112.2B on $119.8B of revenue** | Mark-ups of stakes in AI-era private companies | Q2 2026 | — | S36 Alphabet 10-Q (T1). "Private company" = Anthropic is ⚑ inference only |
| C21 | **Nvidia's own paper gains** | Other income **$24.1B in H1 FY27** (vs $3.0B a year earlier), incl. **$12.5B** unrealized gains on public stakes and **$7.5B** on private stakes. Equity investments **$99B** + commitments **$25B** (26 Jul 2026) | Mark-ups of its ecosystem bets | Feb–Jul 2026 | — | S19 (T1) |
| C22 | **xAI** | Acquired by **SpaceX effective 2 Feb 2026**. SpaceX listed on Nasdaq (SPCX) in **Jun 2026** (424B4 12 Jun). SpaceX sold **$25B of bonds** on 23 Jun 2026 to repay a bridge loan | — | 2026 | Public | S84 (T1). Nvidia's stake in xAI's 2025 round ⚑ not verified |
| C23 | **Meta ↔ Blue Owl** ("Hyperion", Louisiana) | JV, Meta **20%**. ~**$27B** total development cost. Meta leases from 2029, **$12.31B** initial lease commitment, **residual value guarantees ~$28B**. Funded by **~$27B of bonds** sold by the JV vehicle (Beignet Investor LLC); Pimco bought ~$18B | Off-balance-sheet data centre | Oct 2025 | Second JV (El Paso) agreed Jul 2026: RVG up to **$13B** | S37 Meta 10-Q (T1). Bond details S83 (T2/T4 ⚑) |
| C24 | **Meta → CoreWeave** | Up to **$21.0B** | GPU cloud | Mar 2026 | In force | S28 (T1) |
| C25 | **Nvidia → "AI financing platforms"** | MOUs to "mobilize **over $500 billion**" of third-party capital with Apollo, BlackRock, Blackstone, Brookfield, Goldman Sachs, KKR. **Huang**: "This is really the first time that technology chips have become an investable asset class." | Loans to Nvidia's customers | 10 Aug 2026 | MOUs, non-binding | S49 (T1 PR). Quote via S94 (T5 ⚑). "$125B backstop" claim ⚑ single source |

### 2b. The OpenAI ledger

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 2.1 | Total commitments (peak claim) | Altman on X: "about **$1.4 trillion** over the next 8 years", ~**30 GW** | 6 Nov 2025, S46 TechCrunch (T4) | |
| 2.2 | Reset | OpenAI told investors it now targets "roughly **$600 billion** in total compute spend by 2030", built on **>$280B 2030 revenue** | 20 Feb 2026, S45 CNBC (T2) | ⚑ snippet |
| 2.3 | Another tally | ~**$665B** of compute purchase commitments at end-2025, mostly off-balance-sheet (shareholder document via The Information) | Jun 2026, S47 (T5) | ⚑ |
| 2.4 | 2025 revenue | **$13.1B** | S45 CNBC (T2) ⚑, S47 | ⚑ leaked/investor docs |
| 2.5 | 2025 losses | Operating loss ~**$20.9B**. Net loss **$38.5B** incl. a one-time non-cash charge from the for-profit conversion | S47 (T5) citing FT | ⚑ |
| 2.6 | Q1 2026 | Revenue **$5.7B**. Net loss >**$21.3B**, incl. ~$12.4B non-cash. Gross margin 39%. Cash burn $3.7B | Jun 2026, S47 (The Information) | ⚑ |
| 2.7 | 2026 cash-burn forecast | **$25B** (2026), **$57B** (2027) | S47 | ⚑ |
| 2.8 | Run-rate | ~**$50B** annualised at end-Sep 2026 (FT, 8 Oct). Was flat ~$25B Feb–spring, then ~$40B in August | S14, S15 (T4, citing FT T2) | ⚠ DISPUTED: see §10 |
| 2.9 | Missed targets | WSJ: OpenAI missed an internal goal of **1B weekly ChatGPT users** by year-end and its revenue target for the product | 28 Apr 2026, S86 (T4 citing WSJ) | |
| 2.10 | Users | ~**900M weekly active users** (early 2026) | S98 aggregators (T5) | ⚑ get OpenAI's own figure |
| 2.11 | Valuation | **$852B post-money**; round **$122B** (closed 31 Mar 2026, from $110B announced 27 Feb) | S22 CNBC (T2) | ⚑ snippet |
| 2.12 | IPO timing | Pushed to **early 2027** (CNBC, 19 Aug 2026) | S14 (citing CNBC) | ⚑ |
| 2.13 | Commitments vs revenue (calc) | $1.4T ÷ $13.1B (2025 revenue) ≈ **107×**. $600B ÷ $50B run-rate ≈ **12×** | calc | |

---

## 3. The spending

### 3a. Hyperscaler capex (cash purchases of property and equipment, from SEC XBRL; calendar years; $B)

| Company | 2024 | 2025 | H1 2026 | 2026 guidance | Source |
|---|---|---|---|---|---|
| Microsoft (excl. finance leases) | 55.6 | 83.1 | 66.7 | ~$175–190B CY26 ⚑ (accounting change disputed) | S38 (T1). Guidance S99 ⚑ |
| Alphabet | 52.5 | 91.4 | 80.6 | **$195–205B** (raised 22 Jul 2026 from $180–190B) | S38 (T1). Guide: S100 (T5 ⚑, call transcript not read) |
| Amazon (gross purchases) | 83.0 | 131.8 | 98.4 | **~$220B** (raised 30 Jul 2026 from ~$200B) | S38 (T1). Guide ⚑ |
| Meta | 37.3 | 69.7 | 49.1 | **$130–145B** ("We anticipate making capital expenditures of approximately $130 billion to $145 billion in 2026") | S38, S37 10-Q (T1) |
| **Big-4 total** | **228.3** | **376.1** | **294.8** | **≈ $720–760B** (sum of guides) | calc. ⚑ until MSFT/AMZN verified |
| Oracle (fiscal yr ends May) | FY25: 21.2 | FY26: **55.7** | Q1 FY27 (Jun–Aug 26): **28.5** | "higher than fiscal 2026" | S33, S32 (T1) |

Calcs: Microsoft CY quarters were rebuilt from fiscal-year XBRL (e.g., CY2025 = 16.75 + 17.08 + 19.39 + 29.88). Microsoft FY2026 (Jul 25–Jun 26) capex was $115.95B. Big-4 2025 vs 2024: **+65%**. 2026 guide vs 2025: **~+95%**.

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 3.1 | **Gartner headline** | "Gartner Says **Over $3.5 Trillion** of AI Infrastructure Spending Could Be **Exposed to Impairment** by the End of 2030" (press release title) | 14 Oct 2026, S10 (T4) | ⚑ release itself 403. Title and figures via multiple secondary outlets |
| 3.2 | Gartner math | AI data-centre owners need **~$8.5T cumulative revenue through 2030** to cover announced capex, financing costs and a **12% ROIC**. Gartner forecasts AI-attributable revenue of **no more than $3.6T**. ">$4T" exposed through 2032. Analyst: **Will Sommer** | S10 via S11/S12 (T4/T5) | ⚑ |
| 3.3 | Gartner on neoclouds | Release: **>80%** of neocloud providers will stop operating **independently** by 2030 | S10 | ⚠ DISPUTED wording: CNN said "cease operations"; Lovelock told CNBC "consolidation, mergers, or acquisitions" |
| 3.4 | Gartner hyperscaler scale | ~**$1T** of hyperscaler AI infrastructure spend in 2026; ~**$6T** more 2027–2030 | Seoul Economic Daily on the report (T5) | ⚑ |
| 3.5 | Gartner total AI spend | "Worldwide AI Spending Will Total **$2.5 Trillion** in 2026" (Jan 2026). Raised to +49.5% growth (Sep 2026) | S10b Gartner release titles (T4) | ⚑ titles only |
| 3.6 | Lovelock quote | "The market is grappling with a severe timing mismatch, with an overabundance of processing power." / "At the moment, we have more compute capacity than we have demand." / "Everyone in the AI race is running for a last-man-standing position." | 19 Oct 2026, CNBC interview via S11 (T5) | ⚑ check against CNBC video |
| 3.7 | Bond binge | Alphabet, Amazon, Meta, Microsoft, Oracle: ~**$220B** of bonds in 2026 through 10 Aug (BNP via Reuters). LSEG via CNBC: ~**$223B** by 20 Aug, **more than double all of 2025** | S82 (T2) | ⚑ via Yahoo/aggregators |
| 3.8 | Alphabet's century bond | Alphabet closed **£1.0bn of 6.125% notes due 2126**, a **100-year** bond, in a $20B + £5.5B deal | 13 Feb 2026, S35 Alphabet 8-K (T1) | |
| 3.9 | Alphabet selling stock | June 2026: Alphabet issued Class A/C stock and mandatory convertible preferred for **$49.6B net** "including capital expenditures to scale AI infrastructure", plus a **$40B** ATM program | S36 10-Q (T1) | Big tell: Alphabet hasn't raised equity like this before ⚑ check |
| 3.10 | Meta debt | Long-term debt **$83.7B** (30 Jun 2026) vs $58.7B at end-2025. **$25B** of notes issued May 2026 (coupons up to 6.45%, due to 2066) | S37 (T1) | |
| 3.11 | Meta off-balance-sheet | See C23: ~$27B Hyperion JV plus RVGs ~$28B; El Paso JV RVG up to $13B | S37 (T1) | |
| 3.12 | **Oracle debt** | Notes payable and borrowings **$125.3B** (current $7.6B + non-current $117.7B) at 31 Aug 2026. Op-lease liabilities $34.6B. **Plus $288B of data-centre leases not yet commenced** (15–19 year terms) | S32 Oracle 10-Q (T1) | |
| 3.13 | **Oracle's bonds trade below par** | Oracle's own 10-Q: **$125.0B** of senior notes and borrowings had an estimated fair value of **$105.7B** at 31 Aug 2026 (≈ **85 cents on the dollar**, calc) | S32 (T1) | Strong on-screen fact |
| 3.14 | Oracle cash burn | Q1 FY27 free cash flow **−$5.4B** (op. cash $23.1B − capex $28.5B). FY26 FCF ≈ **−$23.7B** (Zacks) | S32 (T1). FY26: S90 (T5 ⚑) | |
| 3.15 | Oracle selling stock | Used its whole **$20B at-the-market** programme in Jun–Aug 2026 (~141M shares, $19.9B net). $5B mandatory convertible preferred (Feb 2026) | S32 (T1) | |
| 3.16 | Oracle backlog | RPO **$664B** at 31 Aug 2026 (was $455B a year earlier). Only ~**13%** recognised in the next 12 months | S32 (T1) | |
| 3.17 | Oracle rating | S&P cut Oracle to **BBB− (one notch above junk)** on **9 Jul 2026**, outlook stable, citing OpenAI concentration. Moody's **Baa2, negative outlook**. Fitch BBB | S34 (T5/T2 ⚑) | ⚑ get S&P release |
| 3.18 | Oracle CDS | 5-yr CDS **~315 bp on 19 Oct 2026** (+311% y/y). **288 bp on 15 Oct**, a record (S&P Global MI, LSEG). Was ~203 bp in Jul 2026 ("highest in nearly 18 years") | S13 CNBC (T2 ⚑ snippet), S90 (T5) | ⏱ ⚑ |
| 3.19 | Oracle bond yield | 10-yr Oracle debt ~**6.4%** vs ~5.7% for the BBB curve (Jul 2026) | S89 (Bloomberg via Briefs, T5 ⚑) | ⏱ stale |
| 3.20 | Oracle's promise | Spokesperson: "strongly committed to maintaining an investment-grade credit rating as our top capital allocation priority" | Jul 2026, S89 (⚑) | |
| 3.21 | CoreWeave distress | 5-yr CDS hit a record **~1,194.5 bp** (15 Oct, ICE via Bloomberg), "implies a >60% chance of default within five years". **~1,082 bp on 19 Oct**. **9.625% 2032 bond yields 14.9%** | S13 (T2 ⚑ snippets) | ⏱ ⚑ |
| 3.22 | CoreWeave balance sheet | Debt principal **$35.6B** (30 Jun 2026). Some facilities cost **9–15%**. Interest expense $640M in Q2 vs Q2 revenue $2.58B. Q2 net loss $626M | S28 (T1) | |
| 3.23 | Customer concentration at CoreWeave | Customer A = **36%** of Q2 2026 revenue (71% a year earlier). Customer B 26%, C 10% | S28 (T1) | |
| 3.24 | Broad credit still calm | ICE BofA **BBB OAS 1.08%**, HY OAS **3.29%** (19 Oct 2026). The stress is concentrated in AI names, not the whole market | S09 FRED (T1) | ⏱ |
| 3.25 | Microsoft's hidden pipeline | **$329.1B** of data-centre leases signed but not yet commenced (30 Jun 2026). Commercial RPO **$678B (+84%)** | S31 (T1) | |
| 3.26 | Nvidia's commitments | Supply and capacity commitments jumped **from $119B to $279B in one quarter**. Total commitments **$366B** (26 Jul 2026) | S19 (T1) | |

---

## 4. The revenue gap

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 4.1 | Sequoia's "$600B Question" | David Cahn: Nvidia run-rate × 2 (data-centre total cost) × 2 (software margin) → AI needs **~$600B/yr of revenue** to pay back the build. Updates his Sept 2023 "$200B question" | 20 Jun 2024, S61 (T4) | |
| 4.2 | Bain | "**$2 trillion** in annual revenue" needed by 2030 to fund compute. Even with AI savings the world is "**$800 billion** short". Compute demand ~200 GW by 2030 | 23 Sep 2025, S62 (T4) | |
| 4.3 | Gartner | $8.5T needed vs ≤$3.6T forecast to 2030 (see 3.2) | S10 | ⚑ |
| 4.4 | MIT NANDA | *The GenAI Divide: State of AI in Business 2025*: "**95% of organizations are getting zero return**" on GenAI, against **$30–40B** of enterprise spend. Method: >300 public initiatives reviewed, 52 org interviews, 153 survey responses | Jul/Aug 2025, S63 (T3) | ⚠ DISPUTED: small sample; preliminary; Wharton survey of ~800 found ~74% positive ROI. Say "an MIT-affiliated study" and quote exactly |
| 4.5 | OpenAI commitments vs revenue | See 2.13 | | |
| 4.6 | Anthropic commitments vs revenue | ~$518B ÷ $4.6B (2025 revenue) ≈ **113×** | S42 calc (⚑) | |
| 4.7 | **Burry: depreciation** | Says hyperscalers will **understate depreciation by ~$176B in 2026–2028** by stretching server lives. By 2028 **Oracle** will overstate profits by **26.9%** and **Meta** by **20.8%** | Nov 2025 X posts, S64 (T5) | ⚑ his estimate; companies dispute. Quote exact X wording only after viewing it |
| 4.8 | Burry's bets | Scion's 13F (30 Sep 2025): puts on **Nvidia (~$187.6M notional)** and **Palantir (~$912M notional)** | S64 (T5, 13F is T1) | ⚑ **notional, not cash at risk.** Burry later said the premium paid was far smaller. Don't say "$1.1B bet" |
| 4.9 | Useful-life evidence (primary) | Oracle depreciates servers over **six years** (10-Q). Microsoft: servers and network equipment **"two to six years"** (FY26 10-K) | S32, S31 (T1) | |
| 4.10 | Microsoft building lives | Reports say Microsoft lengthened data-centre building lives from 15 to 25 years (Jul 2026). Its FY26 10-K still lists buildings at "five to 15 years" | S99 (T5) vs S31 (T1) | ⚠ DISPUTED / unverified. Don't use |
| 4.11 | Power | IEA: data-centre electricity use set to more than double to **~945 TWh by 2030**, "slightly more than the entire electricity consumption of **Japan** today". AI-optimised demand to more than quadruple | 10 Apr 2025, S65 (T1) | |
| 4.12 | Power gating | Nvidia 10-Q: customers may delay "due to the lack of availability of data center infrastructure". "Land, power, shell, and capital is crucial" | S19 (T1) | |
| 4.13 | Abilene power delay | OpenAI wanted newer chips and power wasn't due for ~a year (CNBC re the Mar 2026 Abilene decision) | S48 (⚑) | |
| 4.14 | Growth is slowing at the leaders | **Anthropic Q3 2026 revenue $16.8B, +45% q/q**, down from roughly **+147%** in Q2 (Q2 ≈ $11.5B). Second straight quarter of **adjusted** profit (FT) | 14–15 Oct 2026, S44 (T2 ⚑, Reuters via CNBC snippet) | ⚑ private briefing |
| 4.15 | Anthropic run-rate | Crossed **$47B** (May 2026). **$65B** (end-July 2026, CNBC 17 Aug) | S43, S14 (⚑) | ⚠ gross vs net accounting, see §10 |

---

## 5. Concentration: your money

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 5.1 | Nvidia weight in the S&P 500 | **7.93%** (largest holding of SPY) | 19 Oct 2026, S06 SSGA SPY holdings (T1) | ⏱ |
| 5.2 | "Magnificent 7" weight | NVDA 7.93 + AAPL 7.55 + MSFT 5.98 + AMZN 3.89 + GOOGL/GOOG 5.49 + META 2.35 + TSLA 1.57 = **34.7%** | 19 Oct 2026, S06 calc | ⏱ |
| 5.3 | Top-10 companies | **40.2%** (NVDA, AAPL, MSFT, AMZN, Alphabet, AVGO 2.40, META, TSLA, MU 1.54, LLY 1.50) | 19 Oct 2026, S06 calc | ⏱ |
| 5.4 | Oracle's shrunken weight | ORCL **0.34%** of the S&P 500. AMD 1.33% | S06 | ⏱ |
| 5.5 | Historical comparison | BoE (Oct 2025): top-5 S&P share "close to 30%, … higher than at any point in the past 50 years" | S68 (T1) | |
| 5.6 | 2000 comparison | Top-10 weight peaked around **~26–27%** in 2000 (Morgan Stanley/J.P. Morgan history, via secondary) | S96b (T5) | ⚑ get the original chart |
| 5.7 | Nvidia market cap | **≈ $5.23T** (20 Oct intraday: $216.84 × 24.1B shares). Peak **≈ $5.77T** (6 Oct close) | S05, S19 | ⏱ |
| 5.8 | vs countries (IMF 2026 nominal GDP) | **Germany $5.47T, Japan $4.34T, UK $4.27T, India $4.06T, France $3.55T**. Nvidia > Japan, UK, India today. At its 6 Oct peak it was worth more than **Germany's** whole annual output | S76 IMF WEO datamapper (T1) | ⏱ Caveat on screen: market cap is a stock, GDP is a yearly flow |
| 5.9 | Your 401(k) / target-date fund | Vanguard Target Retirement 2050: **54.4%** in US stocks (30 Sep 2025 fact sheet) | S78 (T1 ⚑ via snippet) | ⚑ |
| 5.10 | Calc: TDF exposure | If the S&P 500 is ~85% of the US total market (assumption ⚑): Mag-7 ≈ 34.7% × 0.85 ≈ **29.5% of a total-market fund**. In a 2050 TDF: 54.4% × 29.5% ≈ **~16% of the whole fund in seven stocks**, and Nvidia alone ≈ 54.4% × 7.93% × 0.85 ≈ **3.7%**. The international sleeve (~37%) adds TSMC, Samsung and SK Hynix | calc | ⚑ show assumptions on screen; get the fund's own holdings list |

---

## 6. Anthropic and OpenAI as IPO candidates

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 6.1 | Filing status | Confidential draft S-1 submitted **1 Jun 2026**. "The number of shares to be offered and the price range … have not yet been determined" (Rule 135 notice) | S39 Anthropic (T1) | |
| 6.2 | No public S-1 yet | **No Anthropic, PBC S-1 on EDGAR as of 20 Oct 2026** (EDGAR full-text and company search checked). Public flip projected ~25 Oct if a 9 Nov roadshow holds | S40 (T1), S41b (T5) | ⏱ check daily |
| 6.3 | Leaked draft: 2025 | Revenue **~$4.6B (~12× 2024)**. Opex ~$13B. Operating loss **>$8B**. Net loss **~$42B**, of which **~$34B** is a non-cash remeasurement of convertible financing. Cash $20.3B | 29 Sep 2026, S41 (Fortune citing Reuters, T2/T4) | ⚑ draft, not filed |
| 6.4 | Leaked draft: 2026 | Q1 revenue **$4.73B** → Q2 **$11.5B**, with an operating profit in Q2 | S41 | ⚑ |
| 6.5 | Concentration | "About a quarter" of revenue from **two clients** | S41 | ⚑ |
| 6.6 | Risk factors | ~80 of 261 pages on risks, incl. "self-preserving behaviors", "shutdown resistance" | S42 (T5) | ⚑ |
| 6.7 | Governance | Founder LLC gives seven co-founders **50.1%** voting control via Class F stock | S42 (T5) | ⚑ |
| 6.8 | Valuation | Last private round **$965B post-money** (Series H, $65B, 28 May 2026, led by Altimeter, Dragoneer, Greenoaks, Sequoia). IPO talk **~$1.8–2T** (bankers' and investors' expectations, not company guidance) | S43 (⚑), S41 | ⚠ $2T is talk only |
| 6.9 | Exchange and timing | Nasdaq (Bloomberg/BI, 13 Sep 2026). Listing "as soon as mid-November" | S41b (T5 ⚑) | |
| 6.10 | Q3 2026 | Revenue **$16.8B (+45% q/q)**. Adjusted profitable | S44 (⚑) | |
| 6.11 | Skeptic quote | New Constructs called it the year's "most ridiculous IPO" (CNBC, 7 Oct 2026) | S41c (T2 ⚑ headline) | ⚑ |
| 6.12 | Legal overhang | D.C. Circuit upheld the Pentagon's "supply chain risk" designation of Anthropic (25 Sep 2026) | S42 (T5) | ⚑ verify court opinion |
| 6.13 | OpenAI | See 2b: $852B post (Mar 2026), IPO early 2027, ~$50B run-rate | | |
| 6.14 | Also listed in 2026 | **SpaceX (incl. xAI)** IPO'd on Nasdaq (SPCX), Jun 2026. 555.6M Class A firm shares | S84 (T1) | price ⚑ |

---

## 7. The precedent: 2000

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 7.1 | Nasdaq peak | **5,048.62** close, **10 Mar 2000** | S52 (T4 data) | |
| 7.2 | Nasdaq trough | **1,114.11** close, **9 Oct 2002** = **−77.9%** | S52 | |
| 7.3 | Recovery | First close above 5,048.62 on **23 Apr 2015**, 15 years later | S52 | |
| 7.4 | Cisco peak | **$80.06** close (split-adj.), **27 Mar 2000**, briefly the **world's most valuable company** (~$555B), overtaking Microsoft | S52, S53 (T4/T5) | $555B ⚑ |
| 7.5 | Cisco trough | **$8.60** (8 Oct 2002) = **−89.3%** | S52 | |
| 7.6 | Cisco recovery | First close above the 2000 high: **$80.25 on 10 Dec 2025**, "25 years, eight months and 13 days" later. Revenue is up ~5× since 1999 | S53 (T4) | |
| 7.7 | Cisco valuation at peak | Trailing P/E ~**160–265×** depending on method and date | S53b (T5) | ⚠ DISPUTED. Say "well over 100 times earnings" |
| 7.8 | **Lucent vendor financing (primary)** | At 30 Sep 2000, **$8.1B total customer-financing commitments** ($6.7B loans + $1.4B guarantees), of which **$2.0B drawn**. FY2000 revenue **$33.8B**, so commitments ≈ **24% of revenue** (calc) | S50 Lucent 10-K FY2001 and 10-K/A FY2000 (T1) | |
| 7.9 | Lucent's losses on it | FY2001 provisions for uncollectibles and customer financings of **$2.2B**, ~$1.3B on three projects incl. **Winstar** (Chapter 11, 18 Apr 2001) and **One.Tel** | S50 (T1) | |
| 7.10 | Lucent stock | Rose to ~**$84** (Dec 1999), market cap peak ~**$258B**. **58 cents** by Oct 2002 (≈ −99%) | S54 Institutional Investor, Wikipedia (T4) | ⚑ get exchange data |
| 7.11 | **Nortel vendor financing (primary)** | Customer financing at 31 Dec 2000: **$5.17B** ($1.08B drawn + $4.09B undrawn). 2000 revenue **$30.3B** (≈17%). Fell to $2.08B by end-2001 as customers "failed to meet the borrowing conditions" or filed for bankruptcy | S51 Nortel 10-K 2001 and 10-K405 2000 (T1) | |
| 7.12 | Nortel stock | Peak market value ~**C$366–398B**, about **a third of the TSX** (2000). Filing day 2009: stock **12 cents**, market value ~**C$60M** | S55 (T4) | ⚠ peak varies by source |
| 7.13 | Nortel bankruptcy | Filed for creditor protection (CCAA / Chapter 11) on **14 Jan 2009** | S55 (T4) | ⚑ some outlets misdate it; Nortel's PR is the anchor |
| 7.14 | Industry-wide vendor loans | ~**$25.6B** extended by nine suppliers (incl. Lucent, Nortel, Cisco) by end-2000 (McKinsey est.). **24 of the 30 largest** public carriers went bankrupt. Suppliers lost **one-third to 80%** of loan books | S56 (T5 citing McKinsey) | ⚑ get McKinsey original |
| 7.15 | Cisco loans | ~$2.4B committed to carriers by late 2000, ~$600M drawn | S56 (T5) | ⚑ |
| 7.16 | Telecom capex | US carrier capex **~$92B in 2000** → ~$66B in 2001 (RHK) | S57 EE Times (T4) | ⚑ |
| 7.17 | Macro read | NY Fed (McCarthy, 2003): the end of the 2000 investment boom and the 2001 bust "reflect the developments in the telecom sector" | S60 (T1/T3) | |
| 7.18 | Dark fiber | ~**90%** of US fibre was dark around 2002 (common estimate). Other claims: only **2.7%** lit (attributed to WSJ), "85–95%" dark | S58 (T5) | ⚠ DISPUTED and weakly sourced. Use "the vast majority sat dark" or find Odlyzko/FCC data ⚑ |
| 7.19 | Global Crossing | Chapter 11 in **Jan 2002** (then the **4th-largest** US bankruptcy). Sold for **$250M**, ~1% of its $22B petition valuation. SEC probed its **capacity swaps** with Qwest | S59 CNN Money (T2) | |
| 7.20 | Round-tripping | Qwest disclosed it improperly accounted for up to **$1.16B** of optical capacity sales incl. swaps (2002). The swaps let carriers book revenue up front while expensing the purchase over time | S59b (T4) | |
| 7.21 | WorldCom | Bankruptcy **21 Jul 2002**, ~$107B assets, then the largest in US history. ~$11B accounting fraud | common knowledge | ⚑ add a T2 cite |
| 7.22 | Inflation-adjusted (calc, CPI Sep 2026 = 336.94 vs 2000 avg 172.2, ×1.957) | Lucent $8.1B → **$15.9B**. Nortel $5.17B → **$10.1B**. Nine suppliers $25.6B → **$50.1B**. 2000 telecom capex $92B → **$180B** | S77 FRED (T1) calc | |

**The 2026 mirror (calc, all T1 from Nvidia's 10-Q and 8-K):** Nvidia's AI-ecosystem exposures as of Jul–Aug 2026 are $99B of equity investments, $25B of further investment commitments, a $105B guarantee for OpenAI's leases, a $6.3B CoreWeave capacity backstop and $3.3B in "infrastructure financiers". That totals **≈ $238B**, about **79% of Nvidia's trailing-12-month revenue of ~$303B** (FY26 $215.9B − H1 FY26 $90.8B + H1 FY27 $177.8B). Lucent's commitments were 24% of its revenue. ⚠ Not like-for-like. Lucent's were loans to customers. Most of Nvidia's are equity stakes (some in non-customers) and a contingent guarantee that OpenAI must reimburse.

---

## 8. Bull case (present fairly)

| # | Claim | Number and date | Source | Flags |
|---|---|---|---|---|
| 8.1 | Nvidia is hugely profitable | Q2 FY27 (to 26 Jul 2026): revenue **$96.2B (+106% y/y)**, net income **$59.7B**. FY26 revenue **$215.9B**, net income **$120.1B** | S19, S18 (T1) | |
| 8.2 | Valuation vs Cisco 2000 | Nvidia trailing P/E ≈ **27×** ($216.84 ÷ TTM diluted EPS $7.91 = 4.90 − 1.84 + 4.85). Cisco 2000: well over 100× | calc S18/S19. Cisco ⚠ | ⏱ Note that some of Nvidia's EPS is investment gains (C21) |
| 8.3 | Real demand: Microsoft | FY26 Microsoft Cloud revenue **$214.4B (+27%)**. Azure +41%. Commercial RPO **$678B (+84%)**. Net income $133.7B | S31 (T1) | |
| 8.4 | Real demand: Google Cloud | Q2 2026 Google Cloud revenue up **$11.1B, or 82%** y/y | S36 (T1) | |
| 8.5 | Real demand: Anthropic | ~$4.6B revenue in all of 2025 → **$16.8B in Q3 2026 alone**. Adjusted-profitable two quarters running | S41, S44 (⚑) | |
| 8.6 | Hyperscalers are cash-rich | Meta held **$90.3B** of cash and securities (30 Jun 2026). Microsoft FY26 net income $133.7B | S37, S31 (T1) | |
| 8.7 | Market not euphoric overall | S&P 500 ~19× forward earnings, lowest since 2023. Median stock +4% YTD | S03 (T2) | ⏱ |
| 8.8 | Credit not cracking broadly | BBB spreads ~1.08%, HY ~3.29% (19 Oct 2026) | S09 (T1) | ⏱ |
| 8.9 | **Huang rebuttal** | "There's been a lot of talk about an AI bubble. From our vantage point, we see something very different." (Q3 FY26 call, 19 Nov 2025) | S71 (T4, transcript not read) | ⚑ check the transcript |
| 8.10 | Huang on chips as an asset class | "This is really the first time that technology chips have become an investable asset class." (CNBC, Aug 2026) | S94 (T5) | ⚑ |
| 8.11 | Zuckerberg's logic | He has argued that misspending "a couple of hundred billion dollars" would be unfortunate, but the bigger risk is under-building | Sep 2025 podcast | ⚑ not verified this session. Find the transcript |
| 8.12 | Altman's two "yes"es | Asked if investors are overexcited about AI: "My opinion is yes." Asked if AI is the most important thing to happen in a long time: also yes (The Verge, Aug 2025) | S70 (T2/T4) | ⚑ exact wording |
| 8.13 | The fibre was eventually used | The overbuilt telecom network later carried the broadband and cloud era. Cisco's revenue is ~5× its 1999 level (FT via S53) | S53 (T4) | Bull/bear double edge: the *infrastructure* survived, the *investors* didn't |
| 8.14 | Dimon's split verdict | AI "is real" and will pay off overall, but most people involved won't do well and some money will be lost | Oct 2025, S69 (T2/T4) | paraphrase only |

---

## 9. How bubbles pop: AI-specific triggers (with 2026 evidence)

| # | Mechanism | 2026 evidence | Source |
|---|---|---|---|
| 9.1 | **Rates and inflation** raise the cost of a debt-funded build | Fed hiked to 3.75–4.00% (16 Sep). CPI 3.7%. 10-yr 5.09%. IMF: long yields at highest since 2007 (US) and still climbing | S08, S07, S09, S67 |
| 9.2 | **Credit spreads blow out at the weakest link** | CoreWeave CDS ~1,100–1,195 bp, bonds ~15%. Oracle CDS record ~288–315 bp. Oracle bonds at ~85¢ (10-Q) | S13, S32 |
| 9.3 | **A failed or shrunken financing** | Nvidia's $100B LOI → $30B. OpenAI's $1.4T → ~$600B target. Abilene expansion dropped. Nvidia now has to *guarantee* OpenAI's leases | S18, S21, S45, S48, S20 |
| 9.4 | **Revenue disappoints** | OpenAI run-rate ~$50B vs ~$70B assumed (8 Oct). WSJ: missed user and revenue targets (Apr). Anthropic growth +147% → +45% q/q | S14, S86, S44 |
| 9.5 | **A hyperscaler cuts capex** | Not yet: all four raised 2026 guidance in July. **Late-October Q3 earnings are the next test** | S37, S100 ⚑ |
| 9.6 | **Efficiency shock** | DeepSeek, **27 Jan 2025**: Nvidia −~17%, **≈$593B** wiped (Reuters/LSEG; others say $589B). Nasdaq −3.1%, SOX −9.2% that day. 2026 variant: China's CXMT memory progress cited in the Oct rout | S75, S04 |
| 9.7 | **Power and physical limits** | IEA ~945 TWh by 2030. Nvidia 10-Q flags land, power and shell constraints | S65, S19 |
| 9.8 | **Concentration / systemic** | IMF (Oct 2026): rising concentration in AI "could amplify systemic risk". Hyperscaler leverage could turn sector shocks into wider crises (paraphrase). AI hardware is >1/10 of world goods trade | S67 (T1) |
| 9.9 | **Impairments / write-downs** | Gartner: >$3.5T exposed to impairment by 2030 | S10 |
| 9.10 | **The IPO test** | Anthropic (Nov?) and OpenAI (2027) must price in public. A weak IPO resets private marks, which feed Alphabet, Nvidia and Microsoft earnings (C20, C21, Microsoft's $6.5B OpenAI gain in FY26) | S39, S36, S19, S31 |
| 9.11 | **Contagion path in the contracts** | If OpenAI defaults on a lease, Nvidia pays (C3). If CoreWeave's capacity goes unsold, Nvidia buys it (C8). AMD's warrant only vests if OpenAI keeps buying (C6). Oracle's backlog is ~half OpenAI (C4) | S20, S26, S24, S34 |

---

## 10. Disputed (say both sides or pick the safe wording)

1. ⚠ **OpenAI revenue: ~$50B or ~$70B run-rate?** FT (8 Oct): "approaching $50B" at end-Sep. Axios (29 Sep): nearing $70B. The gap is accounting. Anthropic books partner-channel (cloud resale) sales **gross**; OpenAI books **net**. Investors built the $70B by taking ~$40B in August and adding growth. **Safe: "about $50 billion, by OpenAI's own counting."**
2. ⚠ **Anthropic vs OpenAI size.** Anthropic's $65B run-rate (July) uses gross accounting. Don't say "Anthropic overtook OpenAI" without the caveat.
3. ⚠ **"Nvidia terminated the $100B deal."** No termination notice. It was an LOI that never became definitive, and was reported (FT) as replaced by a $30B stake. **Safe: "the $100 billion deal quietly shrank to $30 billion. Then Nvidia guaranteed up to $105 billion of OpenAI's rent instead."**
4. ⚠ **OpenAI's commitments: $1.4T vs ~$600B vs $665B.** $1.4T (Altman, Nov 2025, over 8 years, includes infrastructure partners build). ~$600B (compute spend target by 2030, Feb 2026). $665B (contracted commitments at end-2025, The Information). Different definitions.
5. ⚠ **Gartner's 80% neoclouds.** The release says they stop operating *independently*. Some outlets wrote "cease operations". Lovelock: consolidation.
6. ⚠ **DeepSeek loss.** $593B (Reuters/LSEG) vs $589B (others). Use **"nearly $600 billion"**.
7. ⚠ **Dark fibre %**: 2.7% lit vs ~10% lit vs 85–97.5% dark. Weak sourcing. Avoid precise numbers.
8. ⚠ **Cisco 2000 P/E**: 160× to 265×.
9. ⚠ **Nortel peak value**: C$366B vs C$398B. The US-dollar figures differ again.
10. ⚠ **Oracle–OpenAI $300B status**: Abilene expansion dropped (Bloomberg). Oracle says the reports are false and that the 4.5 GW agreement is on track.
11. ⚠ **Is it "circular"?** Critics: vendor money comes back as revenue (C1–C3, C6, C8–C9, C12–C13). Defenders (Huang): end demand is real (8.1–8.5). Many deals are equity stakes or commitments, not classic vendor loans.
12. ⚠ **MIT 95%**: small preliminary sample. Wharton's ~800-respondent survey found ~74% positive ROI.
13. ⚠ **Depreciation (Burry)**: his estimates vs company useful-life disclosures (2–6 years for servers).
14. ⚠ **Microsoft 2026 capex guide** (~$175B vs ~$190B) is mostly lease accounting. Avoid a single number for Microsoft.

---

## 11. Story-worthy details and verbatim quotes (15+)

| # | Detail / quote | Date | Source | Flags |
|---|---|---|---|---|
| Q1 | Nvidia's 10-K, a month before the deal collapsed: "**There is no assurance that we will enter into an investment and partnership agreement with OpenAI or that a transaction will be completed.**" | 25 Feb 2026 | S18 (T1) | verbatim |
| Q2 | Nvidia 8-K: if OpenAI becomes insolvent or fails to pay, "**NVIDIA will pay an amount generally equal to any shortfall**" between the guaranteed lease value and what a replacement tenant pays. Capped at **$105B**. **20-year** leases. **4.25 GW** in Ohio | 17 Aug 2026 | S20 (T1) | verbatim. Note OpenAI must reimburse Nvidia |
| Q3 | The guarantee ends early if "**OpenAI achieving a satisfactory credit rating**." OpenAI has no investment-grade rating | 17 Aug 2026 | S20 (T1) | verbatim |
| Q4 | Nvidia's 10-Q, on the AI clouds it now backs: they "**currently lack the ability to secure long-term infrastructure contracts and investment-grade financing capacity**" | Aug 2026 | S19 (T1) | verbatim |
| Q5 | CoreWeave 8-K: Nvidia "**is obligated to purchase the residual unsold capacity**" ($6.3B), the supplier promising to be the customer of last resort | Sep 2025 | S26 (T1) | verbatim |
| Q6 | AMD's warrant: **160 million shares for one cent each**, vesting as AMD's stock climbs to **$600**. On 6 Oct 2026 AMD closed at **$649** | Oct 2025 / Oct 2026 | S24 (T1), S05 | |
| Q7 | Alphabet sold a bond that matures in **2126** | Feb 2026 | S35 (T1) | |
| Q8 | Oracle's own filing values its **$125B** of debt at **$105.7B**. The market is already marking Oracle down | 31 Aug 2026 | S32 (T1) | |
| Q9 | Oracle used **all $20B** of its at-the-market stock programme in one quarter | Jun–Aug 2026 | S32 (T1) | |
| Q10 | Microsoft made **$24.1B** of revenue from OpenAI in a year, on an investment of **$11.9B** funded | FY26 | S31 (T1) | |
| Q11 | Alphabet's Q2 2026 net income (**$112.2B**) almost equalled its revenue (**$119.8B**) because of **$99B** of paper gains on stakes | Q2 2026 | S36 (T1) | |
| Q12 | Larry Ellison briefly passed Musk as the **world's richest person** on 10 Sep 2025, when Oracle jumped **36%** (biggest since 1992). Oracle has since lost **~61%** | Sep 2025 / Oct 2026 | S72 (T2), S05 | |
| Q13 | SoftBank **sold every Nvidia share it owned ($5.83B)** to help fund OpenAI | Nov 2025 | S73 | |
| Q14 | **Altman** (The Verge, Aug 2025): "Are we in a phase where investors as a whole are overexcited about AI? My opinion is yes." | Aug 2025 | S70 | ⚑ verify exact wording |
| Q15 | **Huang**: "There's been a lot of talk about an AI bubble. From our vantage point, we see something very different." | 19 Nov 2025 | S71 | ⚑ transcript |
| Q16 | **IMF's Georgieva**: "Today's valuations are heading toward levels we saw during the bullishness about the internet 25 years ago." | 8 Oct 2025 | S66 (T1) | verbatim |
| Q17 | **Bank of England FPC**: "The risk of a sharp market correction has increased." "On a number of measures, equity market valuations appear stretched, particularly for technology companies focused on Artificial Intelligence (AI)." | 8 Oct 2025 | S68 (T1) | verbatim |
| Q18 | **IMF (Oct 2026)**: "AI hardware and related tech products now account for more than one-tenth of world goods trade." Concentration in AI "could amplify systemic risk" | 7 Oct 2026 | S67 (T1) | verbatim |
| Q19 | **Dimon** (BBC): "I am far more worried about that than others." He puts correction odds well above the market's (e.g., 30% vs 10%) over six months to two years | Oct 2025 | S69 | ⚑ BBC original |
| Q20 | **Lovelock (Gartner)**: "At the moment, we have more compute capacity than we have demand." | 19 Oct 2026 | S11 | ⚑ |
| Q21 | **Burry** called stretching useful lives "one of the more common frauds of the modern era" | Nov 2025 | widely quoted (T5) | ⚑ view the X post before use |
| Q22 | Lucent, 2001: "**Adverse industry conditions, such as the continued softening in the CLEC market, have negatively affected the creditworthiness of several customers that participate in our customer financing program.**" | Dec 2001 | S50 (T1) | verbatim, for the 2000 mirror |
| Q23 | Nortel, 2001: customers "**failed to meet the borrowing conditions … or reduced their commitments to purchase our products**" | Mar 2002 | S51 (T1) | verbatim |
| Q24 | Kospi fell **7.6%** in a day and hit a **circuit breaker** (15 Oct 2026) | Oct 2026 | S04 (T2) | |
| Q25 | On the day the AI trade cracked (14 Oct), **Apple crossed $5 trillion** for the first time | Oct 2026 | S02 (T2) | |
| Q26 | Sam Altman's CFO Sarah Friar floated a government "backstop" for chip financing in Nov 2025, then walked it back | Nov 2025 | S46 (T4) | ⚑ detail |
| Q27 | OpenAI's own investors built the "$70B" figure to compare with Anthropic, and the real figure (~$50B) knocked AI stocks | Oct 2026 | S14 | |

---

## 12. Scale analogies (math shown)

CPI-U (NSA): 1945 avg 17.99. 2000 avg 172.2. 2020 avg 258.81. **Sep 2026 336.94** (S77, T1).

| # | Analogy | Math | Result | Flags |
|---|---|---|---|---|
| A1 | **Apollo** | $25.8B nominal (1960–73) = $257B in 2020 $ (Planetary Society) × 336.94/258.81 (1.302) | **≈ $335B** in 2026 $ | S80 ⚑ (Planetary Society figure not fetched) |
| A2 | Big-4 2026 capex vs Apollo | ~$720B (guide sum) ÷ $335B | **≈ 2.1 Apollo programmes in one year**. Using actual 2025 ($376B): **~1.1 Apollos** | guide ⚑ |
| A3 | **Manhattan Project** | ~$1.9–2.0B (1940s) × 18.7 (336.94/17.99) | **≈ $36–37B** in 2026 $ | S81 ⚑ (approx; spending ran 1942–46) |
| A4 | Meta alone vs Manhattan | $137.5B (guide midpoint) ÷ ~$37B | **≈ 3.7 Manhattan Projects** in 2026 | ⚑ |
| A5 | 2000 telecom vs 2026 AI | 2000 US carrier capex $92B × 1.957 = $180B (2026 $). Big-4 2025 actual $376B | **~2.1×** (2025) and **~4×** (2026 guide) the inflation-adjusted telecom peak | S57 ⚑ |
| A6 | Vendor financing then vs now | Telecom: nine suppliers $25.6B → $50.1B (2026 $). Nvidia exposures ≈ $238B (see §7 box) | **~4.7×**, not like-for-like | ⚠ |
| A7 | OpenAI commitments per ChatGPT user | $1.4T ÷ 900M WAU = **~$1,556 per weekly user**. Using the $600B target: **~$667** | | WAU ⚑ |
| A8 | OpenAI commitments per $ of revenue | $1.4T ÷ $13.1B | **~107×** 2025 revenue | ⚑ revenue |
| A9 | Power: what is a gigawatt? | 1 GW × 8,760 h = 8.76 TWh/yr. ÷ 10,791 kWh per US home (EIA, 2022) | **1 GW ≈ 810,000 US homes** | S79 (T1) |
| A10 | OpenAI's 30 GW | 30 × 810k | **≈ 24 million US homes** (if run flat-out) | |
| A11 | Nvidia's Ohio guarantee | 4.25 GW × 810k | **≈ 3.4 million homes' worth of power**, guaranteed for 20 years | |
| A12 | Data centres vs a country | IEA: ~945 TWh by 2030 ≈ **Japan's** total electricity use today | | S65 (T1) |
| A13 | Nvidia vs GDP | $5.23T (20 Oct) vs Japan $4.34T, UK $4.27T, India $4.06T. Peak $5.77T vs Germany $5.47T | **Nvidia > Japan, UK, India. At its peak, > Germany** | S76 ⏱ stock vs flow caveat |
| A14 | AMD warrant in dollars | 160M × $542.33 (20 Oct) | **≈ $87B** (if fully vested). ≈ **$104B** at the 6 Oct close | S24, S05 ⏱ |
| A15 | Oracle debt per $ of quarterly free cash flow | $125.3B debt vs −$5.4B FCF in Q1 FY27 | Debt is rising while FCF is negative | S32 |

---

## 13. Breaking in the last two weeks (6–20 Oct 2026)

- **6 Oct**: Nasdaq (27,599.79) and Nvidia ($239.24, ~$5.77T) set record closes. Bloomberg: Nvidia "on the verge" of $6T. It didn't get there.
- **7 Oct**: IMF curtain-raiser warns on AI concentration, hyperscaler leverage, oil ~$100 and Gulf war (S67).
- **8 Oct**: FT says OpenAI's run-rate is ~$50B, not ~$70B. CoreWeave −7.8%, Oracle ~−5.5%.
- **14 Oct**: Hot CPI (3.7%). Nasdaq −1.88%. Oracle −8.8%, CoreWeave −15% after its bonds sold off. Gartner's "$3.5T exposed to impairment" report.
- **15 Oct**: Kospi −7.6% with a circuit breaker. SK Hynix −11%. SOX's 7th straight down day. Anthropic Q3 revenue $16.8B (+45% q/q, a slowdown). CoreWeave CDS record. Oracle CDS record 288 bp. Huang tells Bloomberg he's optimistic about CoreWeave (⚑).
- **16 Oct**: Nasdaq −2.1%. Week −4.5%, worst since June. SOX week −11%.
- **19 Oct**: Gartner's Lovelock on CNBC. Oracle CDS ~315 bp. Partial rebound.
- **Coming up** (⏱ re-check): Anthropic public S-1 (projected ~25 Oct, unconfirmed). **FOMC 28 Oct.** Hyperscaler Q3 earnings in late October (the capex-cut test). US midterms 3 Nov. Possible Anthropic IPO mid-Nov. Nvidia Q3 FY27 results (~late Nov). Oracle FQ2 results 14 Dec.

---

## 14. Do not claim

- That Anthropic "filed its S-1" publicly, or that the leaked numbers are final.
- That Nvidia "terminated" or "cancelled" the OpenAI deal in a filing. Say "dropped" or "replaced" (FT), and cite the 10-K's "no assurance" language.
- That the October rout was a "crash". The Nasdaq is ~5% off its high.
- That Burry "bet $1.1 billion against AI". Those are notional values.
- That OpenAI "lost $38.5B" without saying it includes a one-time non-cash charge. The same applies to Anthropic's $42B.
- That 95% of companies "fail" with AI. The MIT finding is "zero return" in a preliminary sample.
- Any precise "dark fibre" percentage.
- That Oracle is "junk". It is **BBB−, one notch above**.
- That Nvidia "is bigger than Germany's economy" without the stock-vs-flow caveat and the AS-OF date (true only near the 6 Oct peak).

## 15. Open items (⚑) before script lock

1. Read primary Gartner release (14 Oct 2026) and CNBC Lovelock interview video.
2. Get S&P's Oracle downgrade release (9 Jul 2026) and Moody's outlook.
3. Get CDS levels from a T2 page directly (Bloomberg/CNBC) on publish day.
4. Read Alphabet, Amazon and Microsoft Q2 2026 call transcripts for exact 2026 capex guides.
5. Verify OpenAI's 900M WAU from an OpenAI source and its 2025 revenue ($13.1B).
6. Get the CoreWeave press release for the $22.4B OpenAI total.
7. Get Planetary Society (Apollo) and DOE/Brookings (Manhattan) cost pages.
8. Get the McKinsey $25.6B vendor-finance figure from the original, and Lucent and Nortel price history.
9. Huang and Altman quotes from transcript or original article.
10. Check EDGAR daily for Anthropic's public S-1.
11. Vanguard TRF 2050 current allocation.
12. Get a T2 cite for WorldCom.
