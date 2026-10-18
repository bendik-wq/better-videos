# Sources: The Auction That Sets Your Mortgage Rate

Clean source list for `RESEARCH.md`. IDs match the citations there. All URLs were accessed **2026-10-18** unless noted.

**Tier** follows `docs/library/fact-check-playbook.md` §1: 1 primary record · 2 official statistics · 3 on-the-record words · 4 institutional research · 5 quality journalism · 6 aggregator (lead only) · 7 unverified.

**Read status**
- **direct**: page, PDF or data file read in full in this session (PDFs via `pdftotext`; data files parsed by us with python3).
- **extract**: read through a WebFetch extract or a secondary outlet quoting it. Verify on the page before publishing.
- **search**: known only from a search-engine summary. It must be opened before any line rests on it alone.
- **not read**: known from citations only.

IDs S04 and S60 are unused (retired during drafting); the numbered list below skips them on purpose.

**Wayback snapshots** (playbook §8.3): none were saved in this session. Do this before the script locks.

**Local working files** (not committed): the downloaded data and the analysis scripts live in this session's scratchpad (`…/scratchpad/data`, `…/scratchpad/scripts`). Re-run from the API URLs below rather than relying on them.

---

## A. Treasury auctions (tiers 1–2)

1. **S01**: Treasury (TreasuryDirect), "Treasury Auction Results", 9-Year 10-Month Note, CUSIP 91282CRF0, **7 Oct 2026**: https://www.treasurydirect.gov/instit/annceresult/press/preanre/2026/R_20261007_2.pdf. Tier 1. **direct**. High yield 5.300%; allotted at high 57.60%; tendered/accepted; bidder categories; BTC 2.77; retail $88.8M.
2. **S02**: Treasury, "Treasury Auction Results", 29-Year 10-Month Bond, CUSIP 912810UW6, **8 Oct 2026**: https://www.treasurydirect.gov/instit/annceresult/press/preanre/2026/R_20261008_3.pdf. Tier 1. **direct**. High yield 5.618%; BTC 2.54.
3. **S03**: Treasury, "Treasury Offering Announcement", 9-Year 10-Month 4-5/8% Note (Reopening), **1 Oct 2026**: https://www.treasurydirect.gov/instit/annceresult/press/preanre/2026/A_20261001_3.pdf. Tier 1. **direct**. $39B; max award $13.65B; closing times 12:00 noon / 1:00 pm ET; SOMA/FIMA terms. (30-year announcement A_20261001_4.pdf downloaded; its fields were read via S05.)
4. **S05**: Bureau of the Fiscal Service, Fiscal Data, "Treasury Securities Auctions Data" (API `v1/accounting/od/auctions_query`): https://fiscaldata.treasury.gov/datasets/treasury-securities-auctions-data/ ; API https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query. Tier 1/2. **direct** (all notes and bonds Oct 1979 – Oct 2026, 2,793 rows; all FY2026 auctions, 436 rows; Oct 2026 auctions). Our analysis: auction-yield rankings, bidder shares, BTC ranks, FY2026 totals, Feb 2021 7-year, Nov 2023 30-year.
5. **S06**: TreasuryDirect, "How Auctions Work": https://www.treasurydirect.gov/auctions/how-auctions-work/. Tier 1/3. **extract**. Steps; $10M non-competitive and 35% competitive limits; single-price rule; results after 5 pm for TD accounts; refunding press conference timing.
6. **S07**: TreasuryDirect, "Auction FAQs": https://www.treasurydirect.gov/help-center/faqs/auction-faqs/. Tier 1/3. **extract**. Definitions of primary dealer, direct and indirect bidder; 35% award limit.
7. **S08**: Federal Reserve Bank of New York, "Primary Dealers": https://www.newyorkfed.org/markets/primarydealers. Tier 1/3. **extract**. Pro-rata bidding obligation; list of 25 dealers; NatWest withdrawal effective 16 Oct 2026. ⏱
8. **S09**: Treasury, "Tentative Auction Schedule of U.S. Treasury Securities" (PDF, Aug 2026 – Jan 2027): https://home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf. Tier 1. **direct**. 4 Nov announcement; 9 Nov 3-yr, 10 Nov 10-yr, 12 Nov 30-yr; Veterans Day 11 Nov; Dec and Jan dates. ⏱
9. **S10**: Treasury press release sb0590, "Quarterly Refunding Statement of Deputy Assistant Secretary for Federal Finance Brian Smith", **5 Aug 2026**: https://home.treasury.gov/news/press-releases/sb0590. Tier 1/3. **extract**. $58B/$42B/$25B; "at least the next several quarters"; buybacks; next refunding 4 Nov 2026.
10. **S11**: Treasury, "Most Recent Quarterly Refunding Documents": https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding/most-recent-quarterly-refunding-documents. Tier 1. **extract**. "The next release is scheduled for November 4, 2026."
11. **S12**: Federal Register vol. 64 no. 15, **25 Jan 1999** (single-price auctions effective 2 Nov 1998): https://www.govinfo.gov/content/pkg/FR-1999-01-25/html/99-1441.htm ; also FR 1 Jun 2009: https://www.govinfo.gov/content/pkg/FR-2009-06-01/html/E9-12787.htm ; Treasury remarks rr2782: https://home.treasury.gov/news/press-releases/rr2782. Tier 1. **search**. ⚑ open.
12. **S13**: Federal Reserve Bank of Dallas, Michael L. Tindall & Michael A. Perez, "Treasury auctions during the pandemic: stresses but few surprises", **31 Aug 2021**: https://www.dallasfed.org/research/economics/2021/0831. Tier 4. **extract**. Definitions of tail and when-issued; 11 Mar 2020 10-year.
13. **S14**: Brookings, David Wessel, "How to tell if the US Treasury is having trouble borrowing in the bond market", **23 Jul 2024**: https://www.brookings.edu/articles/how-to-tell-if-the-us-treasury-is-having-trouble-borrowing-in-the-bond-market/. Tier 4. **extract**. "Tailed"; failed auction "almost impossible"; dealers "bidders of last resort"; Nov 2023 30-year 24.7%.
14. **S15**: Treasury Office of Debt Management, "Investor Class Auction Allotments", coupons file (Oct 2009 – issues of 30 Sep 2026), posted **7 Oct 2026**: https://home.treasury.gov/data/investor-class-auction-allotments ; file https://home.treasury.gov/system/files/276/October-7_2026-IC-Coupons.xls. Tier 1/2. **direct** (parsed with xlrd; our shares). ⏱ October data due early Nov.

## B. Rates (tiers 1–2)

15. **S16**: Treasury, "Daily Treasury Par Yield Curve Rates", 2026 CSV: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2026 (CSV: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&page&_format=csv). Tier 2. **direct**. 10-yr 5.31% (5 Oct), 5.28% (7 Oct), 5.10% (15 Oct), 5.09% (16 Oct); 30-yr 5.67% (7 Oct). ⏱
16. **S17**: FRED / Federal Reserve Board H.15, DGS10 and DGS30 (daily, from 1962/1977): https://fred.stlouisfed.org/series/DGS10 , https://fred.stlouisfed.org/series/DGS30. Tier 2. **direct**. 1993–94 rout; 2024 low 3.63%; last ≥5.31% close 14 May 2002. Note: Treasury didn't publish a 30-year CMT from Feb 2002 to Feb 2006; FRED's values for those years are an extrapolation.
17. **S18**: Freddie Mac, Primary Mortgage Market Survey (PMMS) page: https://www.freddiemac.com/pmms. Tier 2. **extract**. 7.40% (15 Oct 2026), year-ago 6.27%; 15-yr 6.71%; commentary sentence. ⏱
18. **S19**: FRED, MORTGAGE30US (Freddie Mac PMMS, weekly from Apr 1971): https://fred.stlouisfed.org/series/MORTGAGE30US. Tier 2. **direct**. Full weekly path; spread calculations; 7.40% highest since 16 Nov 2023.
19. **S20**: Federal Reserve, FOMC statement, **18 Sep 2024**: https://www.federalreserve.gov/newsevents/pressreleases/monetary20240918a.htm. Tier 1. **extract**. −50 bp to 4¾–5%; Bowman dissent.
20. **S21**: Federal Reserve, FOMC statement, **29 Oct 2025**: https://www.federalreserve.gov/newsevents/pressreleases/monetary20251029a.htm ; Implementation Note: https://www.federalreserve.gov/newsevents/pressreleases/monetary20251029a1.htm. Tier 1. **extract**. Cut to 3¾–4%; QT concluded 1 Dec; Treasury rollover; agency principal into bills.
21. **S22**: Federal Reserve, FOMC statement, **10 Dec 2025**: https://www.federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm. Tier 1. **extract**. Cut to 3½–3¾%; dissents (Miran, Goolsbee, Schmid); reserve-management purchases.
22. **S23**: Federal Reserve, FOMC statement, **16 Sep 2026** (2:00 pm EDT): https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm. Tier 1. **extract**. +25 bp to 3¾–4%; 12–0; "Inflation remains elevated."
23. **S24**: FRED, DFEDTARU / DFEDTARL (2008–) and DFEDTAR (to 2008): https://fred.stlouisfed.org/series/DFEDTARU , https://fred.stlouisfed.org/series/DFEDTARL , https://fred.stlouisfed.org/series/DFEDTAR. Tier 2. **direct**. Every target change 1994 and 2022–2026 (effective dates = day after announcement).
24. **S25**: Federal Reserve Board, "Board Members": https://www.federalreserve.gov/aboutthefed/bios/board/default.htm. Tier 1. **extract**. Kevin Warsh, Chairman; Powell listed as governor. ⏱
25. **S26**: Federal Reserve Bank of St. Louis, Amanda Geiger, "What Determines Mortgage Rates?", *Page One Economics*, **1 Oct 2026**: https://www.stlouisfed.org/publications/page-one-economics/2026/oct/what-determines-mortgage-rates. Tier 4. **extract**. Benchmark; ~10-year life; formula; Fed influence via expectations.
26. **S27**: Federal Reserve Bank of Boston, Paul S. Willen, "Why Mortgage Rates Exceed Treasury Yields", Current Policy Perspectives 26-3, **19 May 2026**: https://www.bostonfed.org/publications/current-policy-perspectives/2026/why-mortgage-rates-exceed-treasury-yields (PDF https://www.bostonfed.org/-/media/Documents/Workingpapers/PDF/2026/cpp20260519.pdf). Tier 4. **extract**. Prepayment option; g-fees ~42 bp; spread history.

## C. Debt, interest and budget (tiers 1–2)

27. **S28**: Fiscal Data, "Debt to the Penny" (API `v2/accounting/od/debt_to_penny`): https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/. Tier 1. **direct**. $40.388T (15 Oct 2026); $37.943T (15 Oct 2025); first ≥ $40T 18 Aug 2026. ⏱
28. **S29**: Fiscal Data, "Average Interest Rates on U.S. Treasury Securities" (API `v2/accounting/od/avg_interest_rates`): https://fiscaldata.treasury.gov/datasets/average-interest-rates-treasury-securities/. Tier 1. **direct**. 3.518% (Sep 2026); history from 2001.
29. **S30**: Fiscal Data, "Monthly Statement of the Public Debt (MSPD)", tables 1 and 3 (marketable), **30 Sep 2026** (API `v1/debt/mspd/mspd_table_1`, `mspd_table_3_market`): https://fiscaldata.treasury.gov/datasets/monthly-statement-public-debt/. Tier 1. **direct**. Composition; maturity profile (our 12-month sum).
30. **S31**: Fiscal Data, "Interest Expense on the Public Debt Outstanding" (API `v2/accounting/od/interest_expense`), FY2025 and FY2026 (Sep): https://fiscaldata.treasury.gov/datasets/interest-expense-debt-outstanding/. Tier 1. **direct**. Public issues $1,068.5B; GAS $291.9B.
31. **S32**: Fiscal Data, "Monthly Treasury Statement (MTS)", table 9 (receipts and outlays by function), **September 2026 / FY2026** (API `v1/accounting/mts/mts_table_9`): https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/. Tier 1. **direct**. Net interest $1,051.8B; defense $965.2B; receipts $5,403.3B; outlays $7,395.8B.
32. **S33**: Congressional Budget Office, "Monthly Budget Review: September 2026", **8 Oct 2026**: https://www.cbo.gov/publication/61985. Tier 2. **search** (HTTP 403 to WebFetch and curl). ⚑
33. **S34**: American Action Forum, Jordan Haring, "CBO: FY 2026 Budget Deficit Totaled $2 Trillion", **8 Oct 2026**: https://www.americanactionforum.org/insight/cbo-fy-2026-budget-deficit-totaled-2-trillion/. Tier 4/6 (summary of CBO). **extract**. +$115B interest; "second-largest".

## D. Holders (tiers 1–2)

34. **S35**: Treasury International Capital (TIC), "Table 5: Major Foreign Holders of Treasury Securities" (text, through Aug 2026): https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt. Tier 2. **direct**. ⏱
35. **S36**: TIC, Table 5 HTML with notes: https://ticdata.treasury.gov/Publish/slt_table5.html. Tier 2. **extract**. Custodian caveat; Form SLT title.
36. **S37**: Federal Reserve, H.4.1 "Factors Affecting Reserve Balances", **15 Oct 2026** (week to 14 Oct): https://www.federalreserve.gov/releases/h41/current/. Tier 1/2. **extract**. ⏱
37. **S38**: FRED, WALCL, TREAST, WSHOMCB (H.4.1 weekly): https://fred.stlouisfed.org/series/WALCL , /TREAST , /WSHOMCB. Tier 2. **direct**. Cross-check of S37.
38. **S39**: Federal Reserve Z.1 Financial Accounts, Treasury holdings by sector, Q2 2026, via FRED: BOGZ1FL893061105Q (all), BOGZ1LM263061105Q (rest of world), BOGZ1LM713061103Q (monetary authority), BOGZ1FL633061105Q (MMFs), BOGZ1LM153061105Q (households & nonprofits), BOGZ1FL763061100Q (US-chartered depositories), BOGZ1FL653061105Q (mutual funds), BOGZ1FL573061105Q (private pensions), BOGZ1FL543061105Q (life insurers), BOGZ1FL513061105Q (P&C insurers), BOGZ1FL223061143Q (state & local), e.g. https://fred.stlouisfed.org/series/BOGZ1FL633061105Q. Tier 2. **direct** (series pulled; ⚑ series definitions not checked against L.210).

## E. Housing (tiers 1–2, 3)

39. **S40**: Federal Housing Finance Agency, National Mortgage Database, "Outstanding Residential Mortgage Statistics" (national, quarterly, 2013Q1–2026Q2), released **30 Sep 2026**: https://www.fhfa.gov/data/national-mortgage-database-aggregate-statistics ; file https://www.fhfa.gov/document/d/nmdb/nmdb-outstanding-mortgage-statistics-national-census-areas-quarterly.zip. Tier 2. **direct**. Rate buckets; 51.4M loans; average 4.4%.
40. **S41**: National Association of Realtors via FRED: HOSMEDUSM052N (median existing-home price) and EXHOSLUSM495S (existing-home sales, SAAR; FRED shows the last 13 months only): https://fred.stlouisfed.org/series/HOSMEDUSM052N , https://fred.stlouisfed.org/series/EXHOSLUSM495S. Tier 2/3. **direct**. Sep 2026 $417,500; 3.99M. ⏱
41. **S42**: NAR newsroom, existing-home sales release for **September 2026** (reached at https://www.nar.realtor/newsroom/existing-home-sales-dipped-2-5-in-august, which served the latest release): Tier 3. **extract** (curl returned a generic page). Yun quote; inventory 1.60M. ⚑
42. **S43**: US Census Bureau / HUD via FRED: MSPUS (median sales price, quarterly) and MSPNHSUS (new homes, monthly): https://fred.stlouisfed.org/series/MSPUS , https://fred.stlouisfed.org/series/MSPNHSUS. Tier 2. **direct**.

## F. History and story material

43. **S44**: Federal Reserve Bank of New York, Circular No. 949, "Public Notice of Offering of Treasury Bills", **10 Dec 1929** (FRASER): https://fraser.stlouisfed.org/docs/historical/ny%20circulars/1929_00949.pdf. Tier 1. **direct**.
44. **S45**: Kenneth D. Garbade, "Why the U.S. Treasury Began Auctioning Treasury Bills in 1929", FRBNY *Economic Policy Review*, **July 2008** (press release 9 Jun 2008): https://www.newyorkfed.org/medialibrary/media/research/epr/08v14n1/0807garb.pdf ; release https://www.newyorkfed.org/newsevents/news/research/2008/rp080609. Tier 4. **direct**. First-auction results (citing NYT 14–16 Dec 1929, WSJ 16–17 Dec 1929).
45. **S46**: Federal Reserve, FOMC press release, **4 Feb 1994**: https://www.federalreserve.gov/fomc/19940204default.htm ; FEDS Note on 1994/2004 communications: https://www.federalreserve.gov/econresdata/notes/feds-notes/2015/effects-of-fomc-communications-before-policy-tightening-in-1994-and-2004-20150924.html. Tier 1/4. **search**. ⚑ open.
46. **S47**: Al Ehrbar, "The Great Bond Massacre", *Fortune*, **17 Oct 1994** (archive): https://fortune.com/article/the-great-bond-massacre-fortune-1994. Tier 5. **extract**.
47. **S48**: The Bond Buyer, "Timeline of significant events in the Orange County bankruptcy", **16 Jun 1999**: https://bondbuyer.com/news/timeline-of-significant-events-in-the-orange-county-bankruptcy. Tier 5. **extract**.
48. **S49**: The Bond Buyer, "Final bond payment closes a door on Orange County's historic bankruptcy": https://bondbuyer.com/news/final-bond-payment-closes-a-door-on-orange-countys-historic-bankruptcy ; Senator Lockyer's office memo, 13 Dec 1994 (SEC Historical Society): https://test.sechistorical.org/collection/papers/1990/1994_1213_LockyerOrange.pdf. Tier 5 / 3. **search**. $1.64B; >$20B leverage. ⚑
49. **S50**: Bank of England, "Bank of England announces gilt market operation", **28 Sep 2022**: https://www.bankofengland.co.uk/news/2022/september/bank-of-england-announces-gilt-market-operation. Tier 1. **extract**.
50. **S51**: Bank of England, "Financial stability buy/sell tools: a gilt market case study", *Quarterly Bulletin* 2023: https://www.bankofengland.co.uk/quarterly-bulletin/2023/2023/financial-stability-buy-sell-tools-a-gilt-market-case-study. Tier 1/4. **extract** (first 100K characters). 130 bp in three days; "three times larger"; £19.3bn.
51. **S52**: Bank of England, letter from Sir Jon Cunliffe to the Treasury Committee on LDI, **18 Oct 2022**: https://www.bankofengland.co.uk/-/media/boe/files/letter/2022/october/letter-from-jon-cunliffe-ldi-18-october-2022.pdf. Tier 1/3. **direct**.
52. **S53**: Prime Minister's Office (gov.uk), "Prime Minister Liz Truss's statement in Downing Street: 20 October 2022": https://www.gov.uk/government/speeches/prime-minister-liz-trusss-statement-in-downing-street-20-october-2022. Tier 3. **search** (a mistyped URL 404'd; correct URL from search). ⚑ open.
53. **S54**: Andrew K. Rose & Mark M. Spiegel, "Bond Vigilantes and Inflation", FRBSF Working Paper 2015-09, **Aug 2015**: https://www.frbsf.org/wp-content/uploads/wp2015-09.pdf. Tier 4. **direct**. Carville epigraph citing WSJ 25 Feb 1993 p. A1.
54. **S55**: Yardeni Research, Morning Briefing, **22 Aug 2023** ("Bloomberg on the Bond Vigilantes & Me"): https://archive.yardeni.com/premiumdata/mb_230822.pdf. Tier 3. **direct**. "I did coin the term 'Bond Vigilantes' in 1983."

## G. 2026 reporting and market color (tier 5–6)

55. **S56**: NBC News, Steve Kopack, "Treasury yields hit 24-year highs as global sell-off accelerates", **7 Oct 2026**: https://www.nbcnews.com/business/markets/treasury-yields-hit-24-year-highs-global-sell-accelerates-rcna602045. Tier 5. **extract**. "since November 2000"; Boockvar, Georgieva, Yardeni quotes; UK 30-year highest since 1998.
56. **S57**: MercoPress, "Yields on key US Treasury bonds reached new highs, but for the 10-year demand was especially strong", **12 Oct 2026**: https://en.mercopress.com/2026/10/12/yields-on-key-us-treasury-bonds-reached-new-highs-but-for-the-10-year-demand-was-especially-strong/comments. Tier 5/6. **extract**. Intraday 5.36% / 5.73%.
57. **S58**: Investing Live (ex-ForexLive), "So much for the bond rally", **9 Nov 2023**: https://investinglive.com/news/so-much-for-the-bond-rally-20231109/amp ; Peter Boockvar, The Boock Report, "This was bad": https://peterboockvar.substack.com/p/this-was-bad. Tier 5–6. **search**. 30-year tail 5.3 bp vs 4.716% WI.
58. **S59**: Forex.com, "7-year auction preview: will it be as bad as February's auction?": https://www.forex.com/en/news-and-analysis/7-year-auction-preview-will-it-be-as-bad-as-februarys-auction/ ; Convex glossary: https://convextrade.com/glossary/sovereign-debt-auction-tail-risk. Tier 6. **search**. Feb 2021 7-year tail ">4 bp". ⚑ replace with a wire.

## H. Internal

59. **S61**: `docs/library/cpm-research-2026-10.md` (research lead's findings, 2026-10-18). House. **direct**. Every number it gives was re-pulled above; corrections: debt a year ago $37.94T (not $37.97T); non-competitive close 12:00 noon (not 11:30); "~$33T" auction total includes $1.61T SOMA add-ons; "four in five under 6%" is 77.6%; "indirect ≈ 78%" ≠ foreign share.

---

## Caption strings (for the most-used numbers)

| Number | Caption |
|---|---|
| 5.300% | High yield, 10-yr note auction · US Treasury · 7 Oct 2026 |
| $39B, 2.77× | US Treasury auction results · 7 Oct 2026 |
| "Highest since Nov 2000" | Our math · Treasury auction data 1979–2026 |
| 7.40% | 30-yr fixed, Freddie Mac PMMS · 15 Oct 2026 |
| 6.09% | Freddie Mac PMMS · 19 Sep 2024 |
| Fed range | FOMC statements · 18 Sep 2024 – 16 Sep 2026 |
| $40.39T | Debt to the Penny · US Treasury · 15 Oct 2026 |
| $1.05T interest | Net interest, FY2026 · Monthly Treasury Statement |
| $10.6T due in 12 months | Our math · MSPD, 30 Sep 2026 |
| $301/month | Our math · $400K, 30-yr, 7.40% vs 6.27% |
| 49% below 4% | FHFA National Mortgage Database · Q2 2026 |
| 10 Nov / 12 Nov | Treasury tentative auction schedule |
