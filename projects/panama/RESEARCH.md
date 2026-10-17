# The Canal That Runs on Rain: research and fact-check

Episode brief: `docs/library/next-episode-brief.md`. Compiled 2026-10-17. The script is written from this pack, never from memory. Every spoken number needs a row here.
Source IDs (S01…) point to `SOURCES.md`, which gives full URLs, publishers, dates, tiers and read status.

**Confidence levels**
- **High**: a primary record (ACP advisory, ACP data file, NOAA discussion, archive catalogue record) or official statistics, or two independent strong sources that agree.
- **Medium**: one strong source (one quality outlet, one institutional page), or several secondary outlets that may share one origin.
- **Low**: contested, single weak source, or paraphrased. Low rows can't go in the title, the thumbnail, the cold open or a red annotation (playbook §1 and §7).

**Markers**
- ⏱ means time-sensitive. Re-check it on VO-lock day and again on publish day, and put an "as of" date in the caption.
- ⚑ means it must be resolved or cut before the script locks.
- ↔ means a contested range. Say both ends or use the safe wording given.

**Access note (affects sourcing).**
- **ACP advisories** (pancanal.com PDFs) downloaded and read in full with `pdftotext`: A-18, A-19, A-22, A-25, A-29, A-33 and A-36 of 2026 (S01–S07).
- **Gatun Lake level data**: we downloaded the ACP's daily history CSV (1 Jan 1965 – 16 Oct 2026, 22,569 days, no gaps), the projection CSV and the indicators PDF from evtms-rpts.pancanal.com (S08). Every lake-level statistic below is **our own analysis of that file**.
- **NOAA CPC** discussion was read through a WebFetch extract (S09). Read the page directly before VO lock.
- **Bloomberg** (paywalled) wasn't read directly. Its $5.3M report comes through Maritime Executive, The Star and FreightWaves (S39–S41).
- **NPR** returned 503; the same NPR story was read on GPB (S49). **Seatrade** returned 403.
- **Chronicling America** rate-limited us (429), so no 1913 newspaper was read for the Gamboa blast time (⚑ §7e).
- Several ACP web pages (history, locks, 2023 releases) were read through WebFetch extracts, not in full.

**Rules for this episode**
- No accusation of a named living person or company is central. SK Gas is named only as the *reported* bidder: "according to Bloomberg".
- The El Niño is a **forecast**. Say "forecasters give 83% odds", never "the strongest El Niño ever".
- Never say "the canal will close", "shut down" or "run dry". The ACP's verbs are "adjust", "reduce", "restrict"; ours are "cut", "restrict", "queue".
- Our 3D lake-gauge projection for 2027 is **our scenario**, not an ACP forecast (§11). Label it on screen.

---

## 0. Timeline at a glance

| Date | Event | Source |
|---|---|---|
| 1 Jan 1880 / 1881 | French ceremonial groundbreaking (1 Jan 1880, UF); "work began on January 1, 1881" (RPI) ↔ | S34, S36 |
| 4 Feb 1889 | Compagnie Universelle dissolved by a French court ↔ (one study says Jan 1889) | S36, §7a |
| 4 May 1904 | US construction begins | S16 |
| Jan–Feb 1906 | Board of Consulting Engineers votes 8–5 for sea level; the Isthmian Canal Commission backs the 5-man lock minority (5 Feb 1906) | S59 |
| Jun 1906 | Senate votes for a lock canal 36–31; House follows 27 Jun; authorised 29 Jun 1906 | S16, S59 |
| 4 Oct 1907 | First American-era Cucaracha slide (~500,000 cu yd) | S15 |
| 1 Apr 1907 | Stevens resigns; Goethals takes over | S16 |
| 25 May 1912 | Relocated Panama Railroad completed (40 miles, ~$9M) | S15 |
| 27 Jun 1913 | Last Gatun Dam spillway gate closed; lake rises to full height | S16 (via search extract) |
| 20 May 1913 | Steam shovels meet at the bottom of Culebra Cut | S15 (via search) |
| 10 Oct 1913, ~2:00–2:02 p.m. (Washington) | Wilson's signal fires the Gamboa dike blast | S21, S56, S31 |
| 15 Aug 1914 | SS *Ancon* makes the first official transit | S30, S34 |
| 7 Sep 1977 | Torrijos–Carter Treaties signed in Washington | S73 |
| Noon, 31 Dec 1999 | Canal passes to Panama | S73 |
| 26 Jun 2016 | Expanded canal inaugurated; *Cosco Shipping Panama* first through | S13 |
| 18 May 2016 | **Record-low Gatun Lake level: 78.31 ft** (1965–2026 series) | S08 (our analysis) |
| 1 Mar 2023 | Draft cuts begin (50 ft toward 44 ft) | S27 |
| 30 Jul 2023 | Daily transits cut to 32 | S24, S27 |
| 9 Aug 2023 | Queue peaks at 163 vessels (ACP) | S45 |
| 31 Oct 2023 | ACP: driest October "since the earliest registers, 73 years ago"; new cuts 25 → 24 → 22 → 20 → 18 announced | S10 |
| 8 Nov 2023 | Record $3.975M auction (Eneos, *Sunny Bright*) | S44 |
| Dec 2023 | Lowest slot level actually reached: **22/day** | S11, S19 |
| 16 Jan 2024 | Raised to 24 (the 20 and 18 cuts never happened) | S11, S19 |
| 15 Aug 2024 / 1 Sep 2024 | Neopanamax draft back to 50 ft; 36 daily slots | S64 |
| Late Dec 2025 | Preventive water-saving measures begin | S07 |
| 6 Feb 2026 | Lake at max operating level; ACP opens a preventive spill (88.93 ft) | S60, S08 |
| 9 Jun 2026 | ACP: "Current data does not forecast the need for transit restrictions through December 31, 2026" | S07 |
| 3 Jul – 26 Aug 2026 | Neopanamax draft 50 → 49.5 → 49.0 → … | S05, S06 |
| 20 Aug 2026 | A-29: May–Aug rain 34% below average; slots → 34 (4 Sep), → 32 (15 Sep) | S02 |
| Aug 2026 | Reported auction records: $4.6M (SK Shipping, *G. Arete*), then $5.3M (SK Gas, *G. Spirit*, transit 1 Sep) | S39–S43 |
| 26 Aug 2026 | 2026 lake low so far: **83.80 ft** | S08 |
| 2 Sep 2026 | Neopanamax draft 48.0 ft (14.63 m), the 2026 minimum | S02, S03 |
| 4 Sep 2026 | A-33: the 47.5 ft cut planned for 1 Oct is **postponed** | S03 |
| 7 Sep 2026 | Ilya Espino de Marotta takes office as ACP Administrator | S20 |
| 28 Sep 2026 | A-36: draft → 49.0 ft at once; 33 slots from 15 Oct | S01 |
| 8 Oct 2026 | NOAA: 83% chance Oct–Dec is a "historic" El Niño | S09 |
| 16–17 Oct 2026 ⏱ | Gatun Lake 85.74 ft (16 Oct daily) / 85.7 ft (17 Oct official) | S08 |

---

## 1. How the locks work

### 1a. Chambers

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Original (Panamax) chambers | ACP: "All lock chambers have the same **110 by 1,000 feet** dimensions, and they are built in pairs." ACP (metric): "**33.53 meters wide by 304.8 meters long**". UF gives depth as 42 ft | S14, S17, S34 | High (L × W); Medium (depth) |
| Original layout | Gatun 3 steps (6 chambers); Pedro Miguel 1 step (2 chambers); Miraflores 2 steps (4 chambers) | S34 | Medium-High |
| Neopanamax chambers | **427 m long × 55 m wide × 18.3 m deep**. The ACP's own wording: "the Expanded locks are **70 feet wider and 18 feet deeper** than those in the original Canal". Max ship ~366 m × 49 m beam × 15.2 m draft | S13; Seatrade / Engineering News via search | Medium-High (dimensions are trade press; the ACP phrasing is High) |
| Neopanamax layout | Agua Clara (Atlantic) and Cocolí (Pacific): 3 steps each, 3 chambers, **9 water-saving basins** (3 per chamber); 18 basins in all | S34, S63 | Medium-High |
| Lift per step | Gatun: three steps totalling **85 ft** (≈28 ft each). Pedro Miguel: one step, **31 ft**. Miraflores: two steps, **54 ft**, which varies with the Pacific tide (≈43 ft at extreme high to 64.5 ft at extreme low) | Wikipedia figures, matched to older ACP data (lead only; ⚑ get an ACP table) | Medium |
| The 85 ft | ACP: "Water lifts ships **85 feet above sea level** to the surface of Gatun Lake". ACP metric: "Gatun Lake (**26 meters** above sea level)" | S14, S17 | High (nominal) |
| Tides | Pacific tide ~20 ft vs Atlantic ~2.5 ft | S34 | Medium |
| Filling by gravity | Water is moved by gravity through culverts **18 ft** in diameter; 20 cross culverts per chamber, "a total of 100 holes in each chamber". No pumps | S14 | High |
| Fill time | A chamber can fill "in **eight minutes**" | S33 | Medium |

### 1b. Gatun Lake level and its operating range ⏱

All level statistics come from **our analysis of the ACP's daily history file (S08)**, 1965–2026, in feet above mean sea level (PLD). Metric = ft × 0.3048.

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| ⏱ **Current level** | **85.7 ft (26.1 m)** official, 17 Oct 2026 (indicators PDF). Daily file: 85.74 ft on 15–16 Oct 2026. Rising from 85.03 ft on 1 Oct | S08 | High. **"AS OF 17 OCT 2026"** on screen |
| ⏱ Current draft limits | Indicators PDF, 17 Oct 2026: **Neopanamax 49.0 ft, Panamax 39.5 ft**; variable freshwater surcharge **0.18%** | S08 | High |
| ⏱ ACP projection | Projection uploaded **13 Oct 2026, 14:56**: the lake rises to **86.2 ft** in mid-Nov, then falls to **85.5 ft by 17 Dec 2026**; estimated Neopanamax draft 50.0 ft throughout. ACP: estimates "shall be used for reference purposes only"; official drafts come by advisory | S08 | High (as an ACP estimate) |
| Normal level | Nominal **85 ft** (UF: "maintained to the 85 foot" level in dry periods; "not greater than 87 feet" in surplus) | S34, S14 | Medium (UF sheet is old) |
| Old official range (2001) | ACP, 24 Aug 2001: "existing maximum level of **26.7 meters (87.5 feet)**" and "existing minimum operating level of **24.8 meters (81.5 feet)**". "The current water storage of Gatun Lake is two meters" | S18 | High for 2001. **Outdated**: the lake now runs above 87.5 and has fallen far below 81.5 |
| Today's max operating level | ~**89 ft (27.1 m)**. K+N: lake rose to "**88.93 feet**, reaching its maximum operational level" before a preventive release on 6 Feb (2026, per our data: 88.90 ft daily that day). File maximum: **88.91 ft** (29 Nov 2025 and 16 Jan 2026) | S60, S08 | Medium-High. ⚑ no current ACP document states the max/min; don't quote a "minimum operating level" |
| **Record low** | **78.31 ft (23.87 m) on 18 May 2016**, the lowest day since 1965. Second: 78.55 ft (22 Apr 1998) | S08 | High (our analysis). NASA EO agrees: in mid-Aug 2023 the lake "stood close to the lowest recorded level, from May 2016" (S27) |
| **2023 lows** | 2023 minimum **79.24 ft (24.15 m), 25 Jul 2023**. 9 Aug 2023: 79.43 ft. 16 Oct 2023: **79.69 ft**. K+N gives "79.6 feet in August 2023" | S08, S60 | High |
| **2023 = record for the time of year** | Every single day from **1 Aug to 31 Dec 2023** was the lowest level for that calendar date in the 1965–2026 record (153 of 153 days). E.g. 15 Oct: 2023 79.72 ft vs next-lowest 81.74 ft (2019); 15 Dec: 81.39 vs 82.93 (2019). The ACP said "unprecedented levels **for this time of year**" | S08, S10 | High. **Say "the lowest ever for the time of year", not "the lowest ever"** |
| 2024 low | **80.17 ft, 23 Apr 2024** | S08 | High |
| 2026 so far | High **88.91 ft** (16 Jan 2026); low **83.80 ft** (26 Aug 2026) | S08 | High |
| Now vs 2023 | 16 Oct 2026: 85.74 ft vs 16 Oct 2023: 79.69 ft → **6.05 ft higher** | S08 (our math) | High |
| The 1965–2026 mean for 16 Oct | 85.93 ft. Today's level is **about average** for mid-October | S08 (our math) | High |

### 1c. Water per transit

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Panamax locks, per transit | "approximately **52 million gallons** of fresh water" per ship transit (Linda Hall); "52 million gallons lost to sea per transit" (UF); "More than 50 million gallons" (NPR) | S33, S34, S49 | Medium-High ↔ (50–52M gal; no current ACP page found) ⚑ find an ACP figure |
| Per lock fill | "**26,700,000 gallons** of water" to fill one lock | S33 | Medium |
| Metric | 52M US gal = **196,841 m³** (≈197 million litres); 50M gal = 189,271 m³ | our math | High |
| Neopanamax basins | ACP: the new locks "use less water due to water-savings basins" which "**recycle 60 percent of the water used per transit**" | S13 | High (ACP) |
| Neopanamax vs Panamax total | McKinsey: the expanded locks use "**7 percent less water** in total than the original locks". Our check: Neopanamax chamber floor ≈ 2.3× Panamax (427×55 vs 304.8×33.53 m); 2.3 × 0.4 (after 60% reuse) ≈ 0.92 → ~8% less. **Consistent** | S63; our math | Medium-High |
| Neopanamax gallons ↔ | BNamericas (citing ex-administrator Quijano): up to **55M gal** used per Neopanamax transit, of which ~22M reach the sea | S-lead (BNamericas, not read) | Low ⚑ |
| 2026 measures | Since late Dec 2025: simultaneous lockages, interior gates, suspended Gatun hydropower, and Neopanamax basins on direction changes, "saving **one cubic hectometer** of water daily" | S07 | High |
| Cross-filling (2023) | Reusing water from one Panamax chamber in the other, "saving the equivalent of the average consumption of **five daily transits**" | S12 | High |
| Daily water budget, 3 Oct 2023 | Inflow ~**7 million m³/day** vs **15 million m³** in a typical year; outflows ~10 million m³ → "daily deficit of **three million m³**" | S11 | High |

### 1d. Transits per day

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Normal capacity (ACP footnote) | "The normal transit capacity of the Panamax locks is 34-36 vessels per day, and in the Neopanamax locks is 9-11 vessels per day… The maximum sustainable capacity of the Panama Canal (Panamax and Neopanamax locks) is approximately **36-38 vessels per day**." | S07 | High for the 36–38 total. ⚑ the "34-36" Panamax figure looks like a typo (the same table shows Panamax capacity 26); don't quote it |
| Normal slots | **36** booking slots (10 Neopanamax + 26 Panamax) from 1 Sep 2024 | S64 | Medium |
| May 2026 actual | Oceangoing transits averaged **37.06/day** (high 41, low 32); 1,149 in May. ACP: "maintaining **38 daily transits**" | S07 | High |
| FY2026 Oct–Jun | Average **35** daily transits; 10,726 transits, +5.2% | S68 | Medium |
| Drought minimum (2023) | **22/day** (6 Neopanamax + 16 Panamax), Dec 2023 – 15 Jan 2024 | S19, S11 | Medium-High |
| ⏱ Now | **33 slots** from 15 Oct 2026 (10 Neopanamax + 18 Supers + 5 Regulars) | S01 | High |
| Transit time | May 2026 average **in-transit time 11.06 h** (low 8.75, high 12.76). Average "Canal Waters Time" (arrival to exit, incl. waiting) 31.20 h. UF's popular figure is "8-10 hours" | S07, S34 | High. Say "about ten hours" or "eight to twelve hours" |
| Annual | "Between 13,000 and 14,000 ships use the Canal each year" (ACP); FY2025: **13,404** transits | S17, S53 | High |

### 1e. Lake level and allowed draft

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The rule | The ACP sets the max draft "based on present and projected Gatun Lake levels". Lower lake = less water over the lock sills and channel floor = ships must load lighter | S01, S06 | High |
| Normal Neopanamax max | **50 ft (15.24 m)** TFW | S27, S64 | High |
| Old Panamax rule of thumb | "The draft of vessels using the canal is limited to **40 feet when the lake is at 85 feet**" (UF). Today: Panamax **39.5 ft** | S34, S08 | Medium / High |
| Pairs from the record | Lake ~79.5 ft (Aug 2023) ↔ Neopanamax draft **44 ft** (13.41 m). Lake 84.0 ft (early Sep 2026) ↔ **48.0 ft**. Lake 85.7 ft (Oct 2026) ↔ **49.0 ft**. ACP projection 86.1–86.2 ft ↔ est. **50.0 ft** | S08, S27, S03, S01 | High (each half sourced; the pairing is ours) |
| Why it costs money | 1 ft of draft on a big ship is thousands of tonnes of cargo ⚑ (find a published tonnes-per-foot figure before using) | — | ⚑ |
| Freshwater surcharge | A variable % on tolls tied to lake level: **0.18%** today, projected 0.13–0.20% (Oct–Dec 2026) | S08 | High ⏱ |

### 1f. Lake Alhajuela (Madden)

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Built | Madden Dam on the upper Chagres, **1935** ("In 1935, the Alhajuela reservoir was added") | S22 | High |
| Role | A second, higher reservoir that stores water and releases it down the Chagres into Gatun at Gamboa in dry spells. Hydrologist Ayax Murillo: "our main function is to fill Alhajuela's reservoir up to its maximum operational level" | S22, S34 | High |
| Share | "the Alhajuela reservoir accounts for **30 percent** of the contribution, while Gatun does for approximately the **70 percent**" | S22 | Medium-High (ACP's own newspaper, 2021) |
| Drinking water | Panama's main treatment plant (Federico Guardia Conte, Chilibre) "has its water intake in the Alhajuela reservoir" | S22 | High |

---

## 2. The drinking-water link

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Share of Panama | ACP (May 2026): "the water supply for **more than 50%** of the country's population depend[s] on this resource". 31 Oct 2023: reserve "must guarantee supply for more than 50% of the population". 11 Oct 2023: water-saving measures "to supply **55%** of the population" | S07, S10, S12 | High. Say "more than half" |
| People | "these two lakes represent the main water sources for about **two million people**" (El Faro, 2021); "more than two million people depend on the system of the Gatún and Alhajuela lakes" (ACP via La Estrella, Jul 2026) | S22, S47 | High |
| Panama City | ⚑ No source gives a % of Panama City. Chilibre plant (intake at Alhajuela) supplies the Panama and San Miguelito districts, ~**210 million gallons/day** (La Estrella; single source) | S22, S-lead | Medium (intake), Low (210M) |
| Priority | A-29 (2026): measures "safeguard water resources for **human consumption**" | S02 | High |

---

## 3. Rain

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Annual rainfall, watershed | ACP data: "an average of about **2.6 meters (2634 millimeters)** per year" (1950–2023); The Conversation chart from ACP annual reports: historical average **2,660 mm** | S37, S38 | Medium-High ↔ (2,634–2,660 mm ≈ 104 in) |
| Two coasts | Atlantic side ~**130 in**, Pacific side ~**70 in** a year | S34 | Medium |
| Seasons | Dry season ~Jan–Apr; ACP's 2027 dry season is "January to April" | S02 | High |
| **2023** | ACP: "2023 ranks as the **second driest year** for the same period" (Oct 2023 wording, year-to-date); ACP-reported accumulated 2023 rainfall **25.6% less** than the 73-year average; WWA: ~**30%** below average | S10 (via S75), Splash247, S58 | Medium ↔ (the ranking was year-to-date; give "about a quarter to a third less rain") |
| **October 2023, exact ACP wording** | Title: "**The driest month of October since 1950**". Body: "In October 2023, there has been **41% less rainfall** than usual, lowering Gatun Lake to unprecedented levels for this time of year." And: "This month of October is the driest since the earliest registers, **73 years ago**." (31 Oct 2023) | S10 | High. The brief's "driest in 73 years" is ✅ correct |
| 2024 | 20% below average; the **8th-driest** year since 1951 | S38 | Medium |
| 2026 dry season | ACP: "the relatively dry season in 2026, which was among the **wettest** on record since 1950" (sic: the ACP calls it the wettest *dry season*) | S07 | High (quote exactly) |
| **2026 rainy season** | A-29 (20 Aug 2026): "During the current hydrological year (May through August), cumulative rainfall across the Canal watershed has been **34% below** the historical average, while watershed inflows have been **44% below** their historical average" | S02 | High |
| Sept 2026 turn | A-36 cites "the most recent precipitation levels recorded in September" and "improving water conditions and favorable hydrological projections"; press release: "close to average precipitation" | S01, S67 | High |
| **ENSO link** | ACP (May 2026): "History indicates that the most pronounced impacts of moderate or strong El Niño events tend to be reflected more clearly in the **subsequent year**, as was the pattern in **1982–1983, 1997–1998, 2015–2016, and 2023–2024**. Accordingly, operational projections for 2027 are already being developed." Also: El Niño "may reoccur within a period ranging from two to seven years" | S07 | High |
| ENSO in the data | The 3 lowest lake lows since 1965 are all in El Niño follow-on years: **2016** (78.31), **1998** (78.55), **2023** (79.24) | S08 (our analysis) | High (the ENSO tagging is ours) |
| Attribution | WWA: the 2023 drought would have been "unlikely" without El Niño; climate change not found to be a main driver | S58 | Medium (single study via Carbon Brief) |

---

## 4. 2023–24 restrictions and auction prices

### 4a. Timeline

| Date | What happened | Source | Confidence |
|---|---|---|---|
| 1 Mar 2023 | Max Neopanamax draft begins to be cut from **50 ft**, "eventually to **44 feet (13 meters)**" | S27 | High |
| 13 Jun 2023 | 44.0 ft (13.41 m) takes effect (postponed from 30 May by A-22-2023; 44.5 ft until 12 Jun) | S65 | Medium |
| 30 Jul 2023 | Daily transits cut to **32** (typical limit 36) | S24, S27 | High |
| Aug 2023 | Neopanamax ships waited "at least **17 days**" (EIA) | S24 | High |
| 9 Aug 2023 | Queue peak: **163 vessels** (ACP to press). NASA: "as high as **160** total vessels", vs a normal ~**90**; ~**130** on 18 Aug | S45, S27 | High ("more than 160") |
| ~1 Nov 2023 | Average **31**/day (9 Neopanamax + 22 Panamax) | S12 | High |
| 31 Oct 2023 | Announced: **25** (3–7 Nov), **24** (8–30 Nov), **22** (Dec), **20** (Jan 2024), **18** (from 1 Feb 2024) | S10 | High |
| 15 Dec 2023 | "Turning point": 24/day to be kept from mid-January instead of cutting further | S11 | High |
| Dec 2023 | **22/day** in practice (6 Neopanamax + 16 Panamax). **The lowest level actually reached** | S19 | Medium-High |
| 16 Jan 2024 | **24**/day | S11 | High |
| 16 May 2024 | **31**/day; draft 45 ft | S64 | Medium |
| 11 / 22 Jul 2024 | 33, then 34/day; draft to 48 ft | S64 | Medium |
| 5 Aug 2024 | 35/day | S64 | Medium |
| 15 Aug 2024 | Neopanamax draft back to **50 ft** | S64 | Medium |
| 1 Sep 2024 | **36** slots (10 + 26) | S64 | Medium |
| Oct–Dec 2023 | 2,534 vessels and 108 million tons still moved (ACP) | S11 | High |
| Total effect | During the 2023–24 crisis the canal "dejó de atender unos **2,700 tránsitos**" (Prensa; unattributed) | S46 | Low ⚑ |

⚑ The brief's ladder "36 → 32 → 24 → 22 → 18" is **wrong at the end**: 20 and 18 were announced, then cancelled. Say "cut from 36 to as few as 22 a day".

### 4b. Auction prices

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Normal price | Median auction price "about **$55,000** between October 2025 and February 2026" (Bloomberg). The tolls are separate | S40, S41 | Medium (single origin, Bloomberg, attributed to ACP data in AFP) |
| Aug 2023 records | $2.85M, then … (Fortune: Eneos' bid "smashed a record $2.85m set the week before") | S44 | Medium |
| **"$4M" (2023)** | Japan's **Eneos** paid **$3.975M** (Bloomberg rounded to $3.98M) on 8 Nov 2023 for LPG carrier *Sunny Bright*, northbound 15 Nov | S44 | Medium-High (Bloomberg, Fortune, Splash) |
| "$4M" (2026) | AFP via Tico Times: "In April, a vessel paid as much as $4 million to transport hydrocarbons" | S43 | Low-Medium |
| **$4.6M (Aug 2026)** | SK Shipping (former SK Gas sister company, now owned by Hahn & Co.) paid "a record $4.6 million" for *G. Arete*, earlier in Aug 2026 | S39 | Medium (Bloomberg via MarEx) |
| **$5.3M (Aug 2026)** | First reported by **Bloomberg, 25 Aug 2026**, "based on people familiar with the confidential auction": **SK Gas** paid $5.3M for LPG carrier ***G. Spirit*** to transit **1 Sep 2026**. Without it the ship "would have to wait for up to 11 days" | S39, S40 | Medium-High (Bloomberg + later official confirmation below) |
| **Is the ACP silent?** ↔ | **No longer.** Bloomberg (The Star, 27 Aug): the ACP "declined to provide comment on the record auction price". But on 28 Aug, asked by reporters whether a ship had paid $5.3M, incoming administrator **Ilya Espino de Marotta** answered "**Correcto, sí**" and called it "la mayor cantidad" (EFE). She added: "We have had three auctions like this, with somewhat high bids, recently" and that the price is "set by the market" (AFP via Tico Times). She did not name the ship or customer | S41, S42, S43 | Medium-High. The brief's "the ACP confirmed a record but not the price" is **out of date**. VO: "a record five point three million, which the canal's new chief confirmed" |
| Multiple | $5.3M ≈ **96×** the $55K median; **1.33×** the 2023 record | our math | High |
| Waits | Ships without reservations: "up to 11 days" (Bloomberg) / "up to 17 days" (Argus) ↔; ~**120** ships waiting (104 booked, 16 not; EFE) | S39, S41, S42 | Medium |
| Booking share | "Nine of every 10 crossings are booked in advance" (AFP) | S43 | Medium |

---

## 5. 2026 situation ⏱

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Before the cuts | 9 Jun 2026: "the Panama Canal updates lake-level projections every week… while also maintaining 38 daily transits. **Current data does not forecast the need for transit restrictions through December 31, 2026.**" | S07 | High. A strong irony beat: 72 days later, it cut slots |
| Draft cuts | 50 ft → **49.5 ft** (15.09 m) from 3 Jul (A-18, 4 Jun) → **49.0 ft** (14.94 m) from 24 Jul and 48.5 ft (14.78 m) planned 15 Aug (A-22, 1 Jul) → 48.0 ft (14.63 m) planned 26 Aug and 47.5 ft (14.48 m) 3 Sep (A-25, 5 Aug) → 48.0 moved to **2 Sep**, 47.5 to 1 Oct (A-29, 20 Aug) → **47.5 ft postponed indefinitely; 48.0 ft stays** (A-33, 4 Sep) → **49.0 ft "effective immediately"** (A-36, 28 Sep) | S01–S06 | High |
| ⚑ Brief error | "draft cut to 14.48 m on 1 Oct" **never happened** (A-33) | S03 | High |
| Slot cuts | A-29: for booking dates from **4 Sep 2026**, Neopanamax 10 → **9**, Panamax 26 → **25** (total **34**); from **15 Sep 2026**, Panamax → **23** (total **32**) | S02 | High |
| A-25's promise | 5 Aug: "no reduction in available transit slots is being implemented at this time" (15 days before the cut) | S04 | High |
| Why | A-29: "the anticipated severity of the 2026-2027 El Niño event could further reduce precipitation and runoff… raises concerns regarding water availability during the upcoming **2027 dry season (January to April)**" | S02 | High |
| **Restoration** | A-36 (28 Sep): "an additional booking slot at the Neopanamax Locks for booking dates beginning **October 15, 2026**, increasing daily capacity from nine to ten slots… increasing total daily capacity to **33 transit slots**"; draft "**14.94 m (49.0 feet)**" effective immediately | S01 | High |
| ⏱ Still in deficit | "While the water deficit continues in the Canal watershed… Vessels without a reservation may therefore face **indefinite delays**." | S67 | High |
| **NOAA, 8 Oct 2026** ⏱ | Status: "**El Niño Advisory**". Synopsis: "El Niño continues to strengthen, with a strong-to-very strong El Niño likely through January-March 2027 (remaining **greater than an 83% chance**)." Odds of a historic event: **54%** Sep–Nov, **83% Oct–Dec**, **70%** Nov–Jan. "Historic" = a 3-month **RONI of +2.5 °C or more**, "a historic event that would exceed the strength of previous El Niño events dating back to **1950**". Weekly Niño-3.4 **+2.1 °C** (Niño-3 +3.0, Niño-1+2 +3.9). Next update **12 Nov 2026** | S09 | High (read via extract; ⚑ read the page directly) |
| NOAA trend | Sep discussion: **75%** odds of exceeding past events for Oct–Dec (Sep) → 83% (Oct) | S-lead (search summary) | Medium |
| ACP probability | ACP (Jul 2026): probability of a severe event rose "from 25% in April to 81% as of July" | S68 | Medium |
| ACP on 2027 | "operational projections for 2027 are already being developed" (May); 2027 dry season concerns (A-29, Aug). AP (Aug): ACP officials expected the dry season to start "at least a month earlier" than December ⚑ (AP text not read) | S07, S02, S-lead | High / Low |
| ⏱ ACP projection to Dec 2026 | Lake **86.2 ft** mid-Nov, **85.5 ft** 17 Dec 2026, est. Neopanamax draft 50 ft | S08 | High (estimate) |
| New administrator | **Ilya Espino de Marotta** took office 7 Sep 2026 (term 2026–2033), succeeding Ricaurte Vásquez Morales; the first woman in the job | S20 | High |
| Hormuz context (one line only) | Bloomberg/MarEx: "the conflict in the Strait of Hormuz… has cut down the volume of energy shipments to Asia from the Arabian Gulf, leading to soaring LPG prices" | S39 | Medium |

---

## 6. The Río Indio reservoir

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Approval | ACP board approved funding, **Feb 2025** | S49, S51 | High |
| ⏱ Status, Oct 2026 | **No construction contract awarded.** Aug 2026: a tender for project-management/engineering consultants (not the works). Construction tender expected end-2026, award end-2026/early-2027 (TVN) ↔ | S46, S-leads | Medium-High |
| ⏱ Construction start | Now **2028**: "Durante 2027 se harían los procesos previos" (Prensa, 2 Sep 2026); "las obras principales del embalse están previstas para iniciar en 2028" (Espino de Marotta, 5 Aug 2026). Earlier (2025) target was 2027 | S46, S48, S49 | High. **The brief's "starts around 2027" is out of date** |
| Duration / finish | ~4 years of works (TVN: through ~2031–32) ↔ the 2025 reports said 4–6 years | S49, S-lead | Medium ↔ |
| Environmental study | Category III EIA to be filed "entre finales de 2026 e inicios de 2027" (minister Icaza, 2 Jul 2026) | S47 | High |
| FY2027 budget | "**82 millones de dólares**" for Río Indio in FY2027 (Espino de Marotta) | S46 | High |
| **Cost** ↔ | ACP: **$1,500 million** (Prensa, Sep 2026). Other ACP-attributed figures: **$1.6B** (= $1.2B reservoir + $400M for communities, 2025) | S46, S49, S51 | Medium ↔. Say "about one and a half billion dollars" |
| Size | Lake of **4,600 ha** (8% of the 58,000 ha basin); main dam + 3 auxiliary dams + a **9 km**, 5 m-diameter gravity tunnel to Gatun | S47 | High (ACP via La Estrella) |
| Storage ↔ | ~**1,500 million m³** (Prensa); ACP: capacity "similar" to Gatun's; 2003 feasibility: 1,294 Mm³ useful volume | S46, S47, S74 | Medium ↔ |
| **Transits added** | Then-administrator Vásquez: capacity for "an additional **11 to 13 daily transits**", helping keep the canal at 36/day | S-lead (search summary of Lloyd's List / press) | Medium ⚑ find the ACP wording |
| **People relocated** ↔ | ACP preliminary census (2025): **538 households / 1,714 people** in the reservoir area (Seatrade). ACP VP **John Langman**: "**more than 2,000 people** will be displaced" (NPR). A 2025 note: ~630 families / 2,000 people. Critics: a church statement (Apr 2026) speaks of a potential impact on **"more than 13,000 people"** living in the Río Indio basin | S50, S49, S52 | Medium. **Both 1,714 and 2,000+ are ACP figures.** The 13,000 figure (whole basin, critics) is not like-for-like |
| Resettlement | Collective resettlement agreement signed Apr 2026; individual negotiations from H2 2026; first relocations "a finales de 2027"; compensation process ~4 years | S47, S48 | High |
| Criticism | Opponents ask to suspend it until the EIA exists and cite no consultation under the Escazú Agreement | S52 | Low-Medium (via search) |
| "Too late" | Ex-administrator Jorge Luis Quijano (2025): "Right now, we are late by six years." | S49 | High (on record) |
| Purpose | Langman: the dam will "meet the needs for the next 50-year horizon" | S49 | High |

---

## 7. History

### 7a. The French effort

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Sea-level plan | The 1879 Paris International Congress approved "a **sea-level canal** in Panama" (Wyse and Réclus), with "an open cut through the mountain" | S33 (ch. 06) | High |
| De Lesseps | "convinced everyone (at least those who were not engineers) that a sea-level canal was possible"; work began 1 Jan 1881 | S36 | Medium-High |
| **Deaths** ↔ | US State Dept: "after 9 years and a loss of **approximately 20,000 lives**, the French attempt went bankrupt". UF: 20,000. McCullough's widely cited estimate: **~22,000** (1881–1889). French records counted mostly hospital deaths and are "regarded as incomplete"; PBS: the company often fired sick men | S35, S34, S-leads | Medium ↔. **There is no verified "documented ~5,600" French figure**: 5,609 is the **US-era** toll (7c) |
| Money | "**$262,000,000** had been expended" (RPI); UF $260M; 800,000+ French investors lost ~1.8 billion gold francs (auction-house note) | S36, S34 | Medium / Low |
| Excavation | French removed ~75–78M cu yd, of which ~30M was useful to the US | S33, S34 | Medium |
| Bankruptcy | Dissolved by a French court **4 February 1889** ↔ (an OpenEdition study: liquidation "en janvier 1889"). RPI: "All work on the canal ceased in 1889" | S36, S-leads | Medium. Say "bankrupt by early 1889" |
| Scandal | De Lesseps "was indicted for fraud and sentenced to 5 years in prison although the sentence was never carried out" | S36 | Medium |
| US purchase | $40M for the French assets | S16, S34 | High |

### 7b. The 1906 lock decision

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Board of Consulting Engineers | Voted **8–5** for a sea-level canal; the majority included 5 foreign experts; the **5-member minority, all American**, favoured a lock canal at 85 ft | S59 | Medium-High (contemporary accounts) |
| The Commission | The Isthmian Canal Commission reported **5 Feb 1906**, "one member only dissenting", for the lock plan (Taft: 5–1) | S59 | Medium-High |
| Stevens | Chief engineer 1 Jul 1905 – 1 Apr 1907; estimated a lock canal would take 8 years, "by January 1914" | S16 | High |
| **Congress** | ACP: "Two days after the Knox speech, the Senate voted for a lock canal **36 to 31**; on **June 27**, the House followed suit." Authorised **29 Jun 1906** | S16, S59 | High |
| Goethals | Took over after Stevens resigned (1907) | S16, S33 | High |

### 7c. Building it

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| **Gatun Dam** | ACP: "at the time of its construction, **the largest earthen dam in the world** and Gatun Lake **the largest manmade body of water in the world**". Built 1907–1913. USACE: **2.4 km long, 0.8 km wide at its base** (popular sources: ~1.5 mi long, "half a mile" wide at the base, 115 ft high) | S71 (search extract), S72 | Medium-High |
| Gatun Lake area | **164 sq mi (425 km²)**; USACE 418 km² | S33, S34 | High ↔ (418–425 km²) |
| Today | The same ACP page notes Gatun Lake "doesn't even make the top thirty list" now | S71 (search extract) | Medium |
| Lake filled | Last spillway gate closed **27 Jun 1913**, "allowing the lake to now rise to full height" | S71 (search extract) | Medium-High |
| **Drowned valley** | ACP: "Many inhabitants were required to relocate with the filling of Gatun Lake." Towns lost under or beside the lake include **Gorgona, Matachín, Mamey, San Pablo, Gamboa, Obispo, Cruces**; residents moved to Nueva Gorgona and Nuevo Chagres | S16, TVN (lead) | Medium. ⚑ TVN reports some "lost towns" weren't actually submerged; say "drowned or abandoned" |
| **Old railroad** | The Panama Railroad was rebuilt on higher ground: **40 miles** of new track, done **25 May 1912**, at "nearly **$9,000,000**". The original 1855 line (47.11 mi) ran through the valley | S15, S34 | High (ACP) |
| Islands | The valley's hilltops became islands; best known **Barro Colorado** (now STRI's research station) | S-lead | Medium |
| **Culebra Cut slides** | Cucaracha, **4 Oct 1907**: "some **500,000** cubic yards"; for ten days it moved "an average of **14 feet every 24 hours**". West bank slide at Culebra: **10,000,000** cu yd from a 75-acre area. Gold Hill: ~**7,000,000** cu yd. Excavation estimates rose from ~78M (1908) to ~100M cu yd (1913). Record year 1908: >37M cu yd | S15 | High (ACP) |
| 1913 Cucaracha | Gaillard (May 1913): ~3,000,000 cu yd since 1 Jan 1913, nearly 50 acres | S-lead (1913 newspaper) | Medium |
| Cut | Length 8.75 mi (ACP history) / 13.7 km (ACP); lowest point of the divide **333.5 ft** | S15, S17 | High |
| Workforce | Peak **44,733** men on 26 Mar 1913 | S16 | High |
| **US-era deaths** | **5,609** (ICC hospital records, 1904–1914; McCullough: "no fewer than 4,500" of them Black employees) | S34, S-lead | Medium-High (recorded; almost certainly an undercount) |
| Yellow fever | Last case in Panama City **11 Nov 1905** | S16 | High |

### 7d. The 10 Oct 1913 Gamboa dike blast

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Event | The Gamboa dike held Gatun Lake out of Culebra Cut; it was blown on **10 Oct 1913**. Water had already been let in through pipes from 1 Oct ("Flooding of Culebra Cut thru valve pipes… Oct. 1, '13") | S31 | High |
| **Time** ↔ | "At **2:02** in the afternoon President Woodrow Wilson at the White House touched off an explosion" (labor-history broadcast; the brief cites a Hagley caption). A travelogue: "one minute past two" | S56 | Medium ⚑ (no 1913 newspaper read). Say "just after two in the afternoon" until confirmed |
| **Signal route** | ACP official X account: Wilson "pressed a button in Washington, D.C. The signal traveled by telegraph through **New York and Galveston** before reaching Panama". Hagley caption (via search): overland telegraph to **Galveston**, then **submarine cable** and land lines of the **Central & South American Cable Company** | S21, S56 | Medium (ACP social post + one archive caption). ⚑ Note "New York" in the ACP version |
| Button vs key vs lever ↔ | ACP: "button"; travelogue: "telegraph key"; Hagley: "lever" | S21, S56 | Say "pressed a key" or "sent the signal" |
| Charge ↔ | 1,600 lb (Chicago Tribune via broadcast) vs ~18,000 lb vs "40 tons" (Roger-Viollet caption) | S56 | Low. **Don't quote a charge size** |
| Photos | Bucknell: "Blowing up Gamboa Dyke: General View from west hill showing blast. Oct. 10, 1913" (Handy & Hallen), "This image is in the public domain" | S31 | High |

### 7e. Opening day

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| First official transit | SS ***Ancon***, **15 Aug 1914** (LoC photo series "Opening of the Panama Canal. S.S. Ancon…, August 15, 1914") | S30, S34 | High |
| Duration | Cristóbal to Balboa in "about nine hours" | Tico Times (lead) | Medium. ⚑ 7 a.m. / 4:30 p.m. times unverified |
| Earlier crossings | The French crane boat *Alexandre La Valley* crossed in stages earlier (Jan 1914); the *Cristóbal* made an unofficial transit on 3 Aug 1914; UF: first ship 26 Sep 1913 (a tug in the Gatun locks) | S-leads, S34 | Low-Medium. Say "the first official transit" |

### 7f. Treaties, handover, expansion

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| 1977 treaties | Signed **7 Sep 1977** in Washington (Carter, Torrijos), at OAS headquarters; two treaties: the Panama Canal Treaty (transfer by **31 Dec 1999**) and the Neutrality Treaty | S73 | High |
| Senate | Approved by a one-vote margin (1978); in force Oct 1979 | S73 | Medium-High |
| Handover | **Noon, Panama time, 31 Dec 1999** (treaty-set hour). Symbolic ceremony 14 Dec 1999 at Miraflores (Carter, Moscoso) | S73 | High |
| ACP law | Organic Law of the ACP, 11 Jun 1997 | S17 | High |
| 2016 expansion | Inaugurated **26 Jun 2016**; first ship ***Cosco Shipping Panama*** (renamed from *Andronikos*), through Agua Clara then Cocolí. Ship 299.98 m × 48.25 m. Excavation "more than 150 million cubic meters" | S13 | High |
| Cost ↔ | Budget **$5.25B**; final "at least $5.5B" per ACP (press); critics/press up to ~$7.5B | S34, S-leads | Medium ↔. Say "more than five billion dollars" |

---

## 8. Trade stakes

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Share of world trade ↔ | "about **5%** of global maritime trade" (AFP, citing ACP); "entre el **3 % y el 5 %** del comercio mundial" (EFE, Aug 2026); 2.5% in other versions | S69, S42 | Medium ↔. Say "a few percent of all sea trade" or "up to one in twenty" |
| US share of cargo | ACP, FY2018: **62.8%** of cargo had US origin or destination; FY2012: 65% (ACP officials); FY2020: 69% (El Faro). Top users FY2018: US, China, Mexico, Chile, Japan | S70 | High for FY2018. ⚑ get FY2025 ACP table |
| US container traffic | ~**40%** of US container traffic (AFP, 2023) | S69 | Medium |
| Energy | EIA: petroleum products, gas liquids and chemicals "make up **one-third** of trade transiting the canal"; "LPG and ethane together account for **63%** of the U.S. petroleum product exports that cross the Panama Canal" | S24, S25 | High |
| LNG collapse | FY2025 LNG through the canal "declined to less than **0.3 Bcf/d** from around **2.5 Bcf/d** in FY 2021" (EIA, via search) | S26 | Medium ⚑ read the EIA page |
| FY2025 traffic | **13,404** transits (+19.3%); 489.1M PC/UMS tons (+15.6%); growth from containers and LPG; LNG below expectations | S53 | High (ACP, preliminary) |
| **FY2025 revenue** | ~**$5.7B** (+14.4%, preliminary, unaudited); net profit ~$4.1B | S53 | High |
| To the state | FY2025: **$2.965B** to the National Treasury ($2.372B surplus + $591M tonnage fees + $2M services). FY2026 budget: $3.19B; FY2027 proposal: **$3.61B** | S53 | High |
| FY2026 (9 months) ⏱ | Oct 2025–Jun 2026: revenue **$4,802M** (+17%), net income $3,614M | S68 | Medium. ⚑ full-year FY2026 results not yet published (Oct 2026) |
| Share of GDP ↔ | ACP: canal activity plus supported industries = **2.9%** of GDP. IDB Invest (2022 data, incl. indirect/induced): **7.7%** of GDP, **23.6%** of government annual income | S53, S54 | Medium ↔. Name the measure |
| **Reroutes** | EIA (2016): Gulf Coast → Japan LNG voyage **20 days** via Panama, **31** via Suez, **34** via Cape of Good Hope (19.5 kn). EIA (2023): Houston–Chiba LPG via Panama "takes nearly half the time" vs Suez | S23, S24 | High (EIA), dated |
| Reroute, 2026 | Wood Mackenzie (Sep 2026): rerouting via the Cape adds "approximately **10 to 15 days**" | S55 | Medium |
| 2023 LNG detour | Bloomberg: up to two weeks longer, almost **6,000 nm** further | S-lead | Medium |
| LPG freight | VLGC Houston–Chiba **$250/ton** (week to 29 Sep 2023), highest since 2016 | S24 | High |
| Cape Horn / US rail landbridge | ⚑ No sourced day or cost figures found. Cut from the script or research separately | — | ⚑ |

---

## 9. Fun, vivid facts

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| **Halliburton's 36 cents** | Travel writer **Richard Halliburton** swam the canal in **1928** and paid **36 cents**, the lowest toll ever (Guinness). Toll set by his weight (150 lb) at the ton rate; done in stages over ~10 days with a rifleman in the escort boat ↔ | S57 | Medium-High. Our math: ≈ **$6.80** in 2025 dollars (CPI 1928 ≈ 17.1 → 2025 ≈ 322; ⚑ re-run on BLS) |
| Mules, 1914 | ACP: the locomotives "were built in **Schenectady, New York**, at a unit cost of **$13,000**", running at "about 2 miles per hour" up "the 45-degree incline between the lock chambers". Linda Hall: GE delivered **40**; each 32 ft long, 42 tons, 25,000 lb pull | S14, S33 | High / Medium |
| Mules, now | **100 locomotives** in service (May 2026); modern units by Mitsubishi. They steady and brake; ships move under their own power. **The Neopanamax locks use tugs, not mules** | S07, S-lead | High (count) / Medium |
| Original gates | ACP: "All gate leaves are **64 feet wide by 7 feet thick**… they vary in height from **47 to 82 feet**". Linda Hall: 46 miter gates, >6 million rivets. Weight **390–730 tons** per leaf (1913 planning figure). Hollow and buoyant | S14, S33, 1913 newspaper | High (size) / Medium (weight) |
| Neopanamax gates | 16 rolling gates (8 per lock complex); ~**57.6 m** long; tallest **33.04 m**; weight up to ~**4,200 t** (avg ~3,200 t); buoyancy tanks make them weigh ~15% in water | S62 | Medium |
| A day in the canal | Average in-transit time **11 hours** (May 2026); a ship spends ~31 h in canal waters including waiting | S07 | High |
| Excavated earth | UF: enough "to bury Manhattan to a depth of 12 feet" | S34 | Low (folklore-style; attribute) |
| Fresh water on top of the sea | The canal is a freshwater lake ~85 ft above sea level, a hydropower plant at Gatun (up to 24 MW) and the source of drinking water for over half the country | S14, S07, USACE | High |
| The irony of Feb 2026 | In February 2026 the lake was so full the ACP opened a preventive spill (88.93 ft). Six months later it was cutting slots | S60, S08, S02 | Medium-High |

---

## 10. Pictures we can use

Record every item in `assets/CREDITS.md`. Reverse-search each before use (playbook §3).

| # | What | URL | Licence / rights | Check |
|---|---|---|---|---|
| P1 | **Gamboa blast**, "General View from west hill showing blast. Oct. 10, 1913" (Handy & Hallen, Nelson F. Davis coll.) | https://leaf.bucknell.edu/node/3765/about (file: https://leaf.bucknell.edu/media/10559) | Bucknell: "This image is in the public domain" | ✅ read |
| P2 | Gamboa dyke, pipes flooding Culebra Cut, 1 Oct 1913 | https://leaf.bucknell.edu/node/3764/about (media 10556) | Public domain (Bucknell) | ✅ read |
| P3 | "Blowing up of Gamboa dike, Panama Canal, October 10, 1913" | https://leaf.bucknell.edu/group/nelson-f-davis-photography-collection/blowing-gamboa-dike-panama-canal-october-10-1913 | Listed as PD in search; the page itself shows no rights line ⚑ | ⚠ |
| P4 | Byron Company print "Blowing up of the Gamboa Dike, Oct. 10th, 1913" | https://collections.mcny.org/asset-management/2F3XC5ZHXB0 | MCNY; licensing required ⚑ | ⚠ |
| P5 | Gatun Dam construction, 1910 | https://www.loc.gov/pictures/item/2021640026/ | LoC: "No known restrictions on publication." | ✅ |
| P6 | Foot of the Gatun Dam spillway, 11 Jun 1913 | https://www.loc.gov/pictures/item/96520535/ | LoC: "No known restrictions on publication." | ✅ |
| P7 | Culebra Cut after flooding, showing slides (1910–14) | https://www.loc.gov/pictures/item/2016814013/ | LoC: "No known restrictions on publication." | ✅ |
| P8 | Culebra Cut, Cucaracha slide of 47 acres, 1913 | https://www.loc.gov/pictures/item/2021639869/ | ⚑ rights not read (429) | ⚠ |
| P9 | SS *Ancon* entering Pedro Miguel locks, 15 Aug 1914 | https://www.loc.gov/pictures/item/92510051/ | ⚑ rights not read | ⚠ |
| P10 | SS *Ancon* passing Cucaracha slide / in Miraflores, 15 Aug 1914 | https://www.loc.gov/pictures/item/2018661728/ ; https://www.loc.gov/pictures/item/2018661732/ | ⚑ rights not read | ⚠ |
| P11 | Gatun lock site 1909; Gatun upper locks 15 Mar 1910; steel monolith forms 1912 | https://www.loc.gov/pictures/item/2021640062/ ; https://www.loc.gov/pictures/item/94511461/ ; https://www.loc.gov/pictures/item/96520541/ | ⚑ rights not read | ⚠ |
| P12 | **NASA EO**, "Panama Canal Traffic Backup", Landsat 8 OLI, **18 Aug 2023**: ships queued on the Pacific side | https://science.nasa.gov/earth/earth-observatory/panama-canal-traffic-backup-151778 ; full image https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/151000/151778/panamatraffic_oli_2023230.jpg | NASA imagery is generally free to use with credit: "NASA Earth Observatory image by Wanmei Liang, using Landsat data from the USGS" | ✅ |
| P13 | Copernicus Image of the Day, 18 Dec 2023: Sentinel-2, **10 Dec 2023**, ships at anchor in the Gulf of Panama | https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-day/abundant-rain-predictions-allow-panama-canal-increase-daily-transit-january | Copernicus Sentinel data, free and open; credit "Contains modified Copernicus Sentinel data 2023" | ⚠ not opened |
| P14 | **Sentinel-2 L2A, tile 17PPL, Gatun Lake: our picks** (cloud % from the scene metadata; lake level from S08): **High water**: `S2A_17PPL_20260105` (5 Jan 2026, 11.7% cloud, lake **88.82 ft**); `S2B_17PPL_20230104` (4 Jan 2023, 17.2%, 87.55 ft). **Low water**: `S2B_17PPL_20230603` (3 Jun 2023, 17.6%, **80.09 ft**); `S2A_17PPL_20231105` (5 Nov 2023, 19.7%, 80.35 ft); `S2A_17PPL_20240304` (4 Mar 2024, 23.5%, 80.67 ft). **Now**: `S2B_17PPL_20261015` (15 Oct 2026, 24.9%, 85.74 ft) ⏱ | STAC items: `https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/<id>_0_L2A`; view in Copernicus Browser: https://browser.dataspace.copernicus.eu/ (search the date, tile 17PPL) | Copernicus Sentinel data, free and open; credit "Contains modified Copernicus Sentinel data [year]" | ⚠ Cloud % is tile-wide: check the lake itself is clear. **The best same-year pair: 4 Jan 2023 vs 3 Jun 2023 (−7.5 ft)**. A 7.5 ft drop shows as exposed mudflats and shrunken arms at 10 m, not a dramatic shrink. Label the dates; never imply a live view |
| P15 | Film: "[Panama Canal]" 1912, Prelinger Archives (locks, steam shovels, transits) | https://archive.org/details/PanamaCa1912 | Internet Archive licence field: Public Domain (creativecommons.org/licenses/publicdomain) | ✅ metadata |
| P16 | Film: "Pres. Taft inspects Panama Canal construction", 1910 (National Archives 111-M-331, FedFlix) | https://archive.org/details/111-m-331 | US government work (FedFlix); confirm on NARA catalog ⚑ | ⚠ |
| P17 | Film: "Panama Canal" (1919 US government reel) | https://archive.org/details/fc-fc-728a-c | FedFlix / usgovfilms; confirm ⚑ | ⚠ |
| P18 | Film: "Panama and the Canal from an Aeroplane" (1914; aerials shot 27 Apr 1913) | Prelinger/AV Geeks reel (archive.org search "Panama by Air") | ⚑ rights not checked | ⚠ |

Modern ACP photos and video (pancanal.com, ACP YouTube) are **not** free-licensed by default. Ask the ACP press office.

---

## 11. Computed numbers (our math; label "Our math" on screen)

Constants: 1 US gallon = 3.785411784 L. **Olympic pool = 2,500 m³** (50 m × 25 m × 2 m, the minimum depth). Gatun Lake area ≈ 425 km² (S33/S34; it shrinks as the lake falls, so the lake-volume rows are ±10%).

| # | Comparison | Working | Result | Confidence |
|---|---|---|---|---|
| C1 | **"76 Olympic pools per transit"** | 50,000,000 gal × 3.7854 L = 189,271 m³ ÷ 2,500 = **75.7** | ✅ **76 pools** at 50M gal. At 52M gal: 196,841 m³ ÷ 2,500 = **78.7 ≈ 79**. Use "**about 75–80 pools**" or "nearly 80" | High (math); the input is Medium |
| C2 | Pools per day | 36 × 75.7 = **2,725** (brief: ~2,700 ✅). Upper bound: Neopanamax transits reuse 60%, so the real daily total is lower | "up to about 2,700 pools a day" | Medium |
| C3 | Litres | 189–197 million litres per Panamax transit (AFP: "some 200 million liters") | "about 200 million litres" | High |
| C4 | One foot of lake | 0.3048 m × 425,000,000 m² = **129.5 million m³** ÷ 196,841 = **658 transits** ≈ **18 days** at 36/day (ignoring rain, drinking water, evaporation) | "Each foot of Gatun Lake is worth about 650 ship crossings" | Medium (approx.) |
| C5 | The 2023 daily deficit | 3,000,000 m³/day ÷ 425 km² = **7 mm/day** ≈ **0.7 ft a month** | "The lake was losing about a quarter-inch a day" | Medium |
| C6 | The 2023 dry-season drain | 4 Jan 2023 87.55 ft → 3 Jun 2023 80.09 ft = **7.46 ft** × 129.5M m³/ft ≈ **0.97 km³** | "Nearly a cubic kilometre gone in five months" | Medium |
| C7 | 2026 vs 2023 | 85.74 − 79.69 = **6.05 ft** ≈ 780 million m³ ≈ ~4,000 Panamax transits more than on the same date in 2023 | "The lake starts this dry season six feet higher than in 2023" | High (level); Medium (volume) |
| C8 | 2026's basin trick | 1 hm³/day saved (S07) = 1,000,000 ÷ 196,841 ≈ **5 transits' worth a day** | — | Medium |
| C9 | Neopanamax check | Floor area ratio 23,485 ÷ 10,220 m² = 2.30; × 0.4 = 0.92 → **~8% less water** than a Panamax lockage, matching McKinsey's "7% less" | Bigger locks, slightly less water | Medium |
| C10 | Drinking water vs ships | Chilibre plant ~210M gal/day (single source) ÷ 52M ≈ **4 transits** | "A day of Panama City's tap water is about four ships" | Low (input is single-source) |
| C11 | Auction | $5.3M ÷ $55K median = **96×**; ÷ $3.975M (2023) = **1.33×** | "almost a hundred times the usual price" | Medium |
| C12 | Río Indio | ~1,500 hm³ storage ÷ 196,841 m³ ≈ **7,600 Panamax transits** of stored water. Storage ≠ yearly yield; don't present it as "transits per year" | "Enough stored water for about seven thousand crossings" | Low-Medium (storage figure ↔) |
| C13 | Treasury | $2.965B ÷ $5.7B = **52%** of FY2025 revenue went straight to the state | "More than half of every toll dollar goes to Panama's treasury" | High (math), Medium (revenue is preliminary) |
| C14 | **2027 scenario (not a forecast)** | Start = ACP projection **85.5 ft** (17 Dec 2026). Past dry-season drops from mid-Dec to the annual low: **1998 −5.02 ft**, **2016 −5.61 ft**, 2019 −8.56 ft, 2024 −1.24 ft (heavy restrictions). 85.5 − 5.0 to 5.6 = **79.9–80.5 ft**, which is around the 2023–24 lows (79.24 / 80.17 ft) | "If 2027 drains like 1998 or 2016, the lake ends the dry season near its 2023 low." **Label: "Our scenario, not an ACP forecast."** | Medium (method); it's a what-if |

---

## 12. Counter-intuitive facts for the hook and the climax

Ranked by strength. All rest on High or Medium-High rows.

1. **The oceans never touch.** Ships climb 85 ft into a freshwater lake and then pour that water into the sea (S14, S17).
2. **Each Panamax crossing dumps about 50 million gallons, about 76–79 Olympic pools** (S33, S34; C1).
3. **The lake's lowest point ever was 2016, not 2023**, but every day from Aug to Dec 2023 set a record for its date (S08).
4. **The ACP said in June 2026 there'd be no restrictions this year. 72 days later it cut slots** (S07, S02).
5. **In Feb 2026 the lake was so full they opened the spillway** (S60, S08).
6. **A record $5.3M to skip the queue, ~96× the usual price, confirmed by the canal's new chief with "Correcto, sí"** (S39, S42; C11).
7. **The canal also supplies tap water to more than half of Panama** (S07).
8. **October 2023 was the driest October since records began, 73 years earlier: 41% less rain** (S10).
9. **NOAA: 83% odds that Oct–Dec 2026 will be stronger than any El Niño since 1950** (S09).
10. **The ACP's own pattern: the worst comes the year *after* El Niño (1983, 1998, 2016, 2024)**. The three lowest lake levels on record fall in exactly those years (S07, S08).
11. **The fix, Río Indio, won't start building until 2028** (S46, S48).
12. **The cheapest toll ever: 36 cents, paid by a swimmer** (S57).
13. **Wilson set off the blast that flooded the Cut from the White House, by telegraph via Galveston** (S21, S56) (Medium; check the time).
14. **When it was built, Gatun was the world's largest dam and largest artificial lake** (ACP).

---

## 13. Contested (say both versions or pick the safe one)

| # | Issue | Versions | What to say |
|---|---|---|---|
| C-1 | French death toll | ~20,000 (State Dept, UF); ~22,000 (McCullough). No verified "documented ~5,600" French count (5,609 is the US era) | "**Around twenty thousand**, by most estimates" |
| C-2 | Water per transit | 50M (NPR, MarEx), 52M (UF, Linda Hall) gal; Neopanamax up to 55M used / ~22M lost (one ex-administrator quote) | "**About fifty million gallons**" for the old locks; "the new locks recycle 60%" |
| C-3 | 2023 ranking | "second driest year for the same period" (ACP, Oct, year-to-date); "25.6% less" (ACP-reported); "30% lower" (WWA) | "**One of the driest years on record**"; quote October exactly |
| C-4 | $5.3M confirmation | Bloomberg: ACP declined comment / EFE: Espino de Marotta "Correcto, sí" | "Bloomberg reported it; the canal's incoming chief confirmed it" |
| C-5 | Río Indio displacement | 1,714 people / 538 households (ACP census 2025); "more than 2,000" (ACP VP Langman); >13,000 in the basin (church statement, critics) | "**About two thousand people**, the canal says; critics say the wider basin holds more than thirteen thousand" |
| C-6 | Río Indio cost | $1.5B (ACP, Sep 2026) vs $1.6B ($1.2B + $400M, 2025) | "About one and a half billion dollars" |
| C-7 | Río Indio start | 2027 (2025 plans) vs **2028** (ACP, Aug–Sep 2026) | "Construction is due to start in 2028" ⏱ |
| C-8 | World-trade share | 2.5% / 3% / 5% / 6% | "a few percent of world sea trade" |
| C-9 | Expansion cost | $5.25B budget; ≥$5.5B (ACP, press); higher press estimates | "more than five billion dollars" |
| C-10 | Blast time and button | 2:02 vs 2:01 p.m.; button/key/lever | "just after two in the afternoon"; "sent the signal" |
| C-11 | Lake max/min | 87.5/81.5 ft (ACP 2001) vs ~89 ft max today; no current published minimum | Show the gauge with real data, not a "minimum" line |
| C-12 | Waiting times Aug 2026 | up to 11 days (Bloomberg) vs 17 days (Argus) | "more than a week" |

---

## 14. DO NOT CLAIM

- **"Gatun Lake hit its lowest level ever in 2023."** The record is **78.31 ft on 18 May 2016**. Say "**the lowest ever for the time of year**".
- **"The French death toll was documented at about 5,600."** That's the 5,609 **US-era** count. Use "around 20,000, by most estimates".
- **"Slots were cut to 18 (or 20)."** Announced, never implemented. The minimum was **22**.
- **"The draft was cut to 14.48 m (47.5 ft) on 1 Oct 2026."** It was postponed (A-33). The 2026 minimum was **48.0 ft / 14.63 m**.
- **"The ACP refused to confirm the $5.3M."** Its incoming administrator confirmed it to reporters. Don't say "the ACP published" it either; it was a verbal confirmation.
- **"The canal will close / shut down / run dry."** Use cut, restrict, queue.
- **"The strongest El Niño ever"** or "a historic El Niño is coming". It's "83% odds that Oct–Dec will exceed every event since 1950". The 83% applies to **Oct–Dec**; Nov–Jan is **70%**.
- **"The ACP forecasts restrictions in 2027"** or "the lake will fall below the 2023 low". The ACP says projections "are being developed"; its official projection (to 17 Dec 2026) shows **85.5 ft and a 50 ft draft**. Our gauge sequence is a labelled scenario (C14).
- **"Río Indio starts in 2027."** The current ACP plan is **2028**. And don't call 1,714 "the ACP figure" versus 2,000 "the critics' figure": **both are ACP numbers**.
- **"2023 brought the first restrictions in the canal's history."** Draft restrictions happened before (e.g. 2016, 2019; A-41-2016 set 44 ft). At most: "the deepest slot cuts in its history" ⚑ (unverified as a superlative).
- **"The lock gates weigh X"** as one number. The original leaves vary (390–730 tons, planned); the new rolling gates go up to ~4,200 t.
- **"Each Neopanamax transit uses 7% less water."** McKinsey's 7% is a total comparison with the old locks.
- **A Gamboa charge size** (1,600 lb vs 18,000 lb vs 40 t): unresolved.
- **"Gatun Lake supplies all of Panama City's water."** Dated (1987, Wikipedia). Say "more than half of Panama".
- **The UF "Manhattan buried 12 feet" line** as fact. Attribute it or drop it.
- **Cape Horn or US rail-landbridge day counts**: none sourced.
- **The Panamax "34-36 vessels per day" capacity** in A-19's footnote (likely a typo).

---

## 15. Open items (⚑) before script lock

1. Read NOAA CPC's 8 Oct discussion directly; on publish day check the **12 Nov 2026** update ⏱.
2. Re-pull the Gatun CSV and indicators PDF on VO day and publish day ⏱ (https://evtms-rpts.pancanal.com/eng/h2o/index.html).
3. Check pancanal.com for any advisory after A-37-2026 (5 Oct) ⏱, and the FY2026 results release.
4. Find a 1913 newspaper (Chronicling America; it rate-limited us) or the *Canal Record* for the Gamboa blast time and signal route; open the Hagley record the brief cites.
5. Find an ACP page giving water per transit (gallons or m³) for both lock types.
6. Find ACP wording for Río Indio's "11 to 13 additional transits" and its storage volume; read the Seatrade census article (403 here).
7. Read the ACP release "Panama Canal to increase daily transits to 24 starting in January" (Dec 2023) and A-48-2023 for exact slot dates.
8. Get the ACP FY2025 top-users table (country shares) and an EIA/USDA figure on grain via Panama.
9. Check the rights lines of LoC items P8–P11 (rate-limited) and the NARA catalog records for P16–P17.
10. Inspect the Sentinel-2 picks (P14) for clouds over the lake; export true-colour crops.
11. Re-run the Halliburton CPI conversion on the BLS calculator.
12. Wayback-save every URL in SOURCES.md (playbook §8.3). None were saved in this session.
