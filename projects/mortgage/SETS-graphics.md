# Mortgage graphics sets (2D / 2.5D): parameters, cues and script map

Libraries loaded by `scene.js` (`LIBS`): `sets/graphics.js`, `sets/graphics-data.js`, `sets/graphics-maps.js`,
`sets/graphics-docs.js`. Shared helpers live in `sets/graphics-kit.js` (no sets). Every set paints a 2D canvas
(`inst.canvas`) at 1920×1080 units; a frame costs well under 0.3 s (measured 2–18 ms in the lab).
`scene.js` loads `clay-money`, `clay-world` and `oner` after these, so a 3D set with the same name would win.

Look-dev without the episode: `projects/mortgage-gfx-lab` (one shot per set/mode, plus four narrated cue tests):
`node engine/render.mjs projects/mortgage-gfx-lab --stills=0.25,0.6,0.95 && node projects/mortgage-gfx-lab/lab.mjs --all`
→ `renders/mortgage/graphics/` (stills + `contact-*.jpg`).

**Money identity.** Bright cool paper `#f7f6f1` with faint teal ledger rules and a double margin line, ink navy
`#14233d`, sage `#a9c5ae` and teal `#2a8c86` accents, and one red `#e0241b` for the number that matters. Figures are
Plex Mono (the ledger), headlines Inter 800–900, quotes Instrument Serif. Labels sit on navy slabs, white pills
or white cards, never naked on a busy picture. ⏱ live facts carry a navy **AS OF** pill with a red dot; computed
numbers carry a mint **OUR MATH** pill. Recreated documents say so on screen.

**Cues.** Anything called `at`, `word`, `…At` takes a number (seconds into the shot) or a spoken word: `'lock'`,
`'one@1'` (2nd time it is said), `'Four+0.3'`. Unknown words fall back to the default time, so every set also works
without narration. Per the dead-air rule every set has something on screen within 1 s.
**Camera.** Every set drifts and pushes slowly. Override with `params.cam = { push, dx, dy, fx, fy }` (push 0 = locked).
**Sources.** Each set prints its own source line; `params.source` replaces it. `params.kicker` / `params.title`
replace the top lines on most sets.
**No repeats.** `engine/render.mjs` refuses two shots with the same `set` + identical `params` (chapter excepted).
To reuse a set, change a param (e.g. a different `kicker`, `highlight` or `at`).

## Sets

| Set | Params | Defaults / what it shows |
|---|---|---|
| `title` | `lines` (['THE AUCTION','THAT SETS YOUR','MORTGAGE RATE']), `sub`, `size`, `y` | The real 10-year yield, 2020 → Oct 2026, rises behind the type; last line red. A navy tape reveals the 2026 10-year auction high yields 12 Jan 4.173% · 12 May 4.468% · 12 Aug 4.683% · 9 Sep 4.834% · 7 Oct **5.300%** (red). |
| `chapter` | `num`, `title`, `sub`, `from` ('2020-01-01') | Ledger paper; CHAPTER + mono number + title on the left; the real 10-year yield (FRED DGS10) draws on to the right and ends on a red pulse. ≥ 3.5 s. |
| `quote` | `text`, `by`, `role`, `source`, `highlight` (word prefixes), `size` | Serif quote on a white card with a teal rule; each word appears when the VO says it (`M.wordTimes`), highlighted words get a sage marker. |
| `bignumber` | `value`, `prefix`, `suffix`, `decimals`, `from`, `label`, `unit`, `kicker`, `note`, `asof`, `math` (true or text), `source`, `red`, `at`, `roll`, `size` | Count-up card on ledger rules. `asof` adds the AS OF pill, `math` the OUR MATH pill. |
| `counter` | `preset` ('clock' \| 'nov10' \| 'paradox' \| 'today' \| 'yield'), or `steps` [{ text, label, sub, word, red, asof }], `kicker`, `title`, `asof`, `tile`, `source` | Flip board of any string: digits roll on their reels, `: . %` sit in narrow slots. clock: 12:59 → **1:00** "THE BIDS LOCK" (WED 7 OCT 2026). nov10: same for TUE 10 NOV. paradox: 6.09% (19 SEP 2024) → **7.04%** (16 JAN 2025). today: 6.27% (16 OCT 2025) → **7.40%** (15 OCT 2026, AS OF, highest since Nov 2023). yield: **5.300%** "HIGHEST 10-YEAR AUCTION SINCE NOVEMBER 2000". Cue each step with `word`. |
| `rates` | `mode` 'paradox' \| 'today' \| 'tenyear' \| 'history' \| 'auctions' (see below), `title`, `kicker`, `source`, `drawDur` | All lines from the CSVs in `assets/data` (FRED DFEDTARU, MORTGAGE30US, DGS10). |
| `payment` | `variant` 'base' \| 'median' \| '3pct', `at` (rate rolls), `deltaAt`, `totalAt`, `loan`, `title`, `kicker` | Calculator card (P&I, standard amortisation) + before/after bars with the red delta. base: $400,000, 6.27% → 7.40%: $2,468.07 → $2,769.52, **+$301 a month**, slab **+$108,520 more interest over 30 years**. median: $417,500 home (Sep 2026), 20% down, $334,000: $2,060.84 → $2,312.55, **+$252**. 3pct: 3.00% → 7.40%: $1,686.42 → $2,769.52, **+$1,083**. OUR MATH pill; "RATE AS OF 15 OCT 2026". |
| `bidders` | `mode` 'auction' \| 'demand' \| 'investor-class'; auction: `word` per segment via defaults, `lowAt`, `coverAt`; demand: `at`, `at2`; investor: `at`, `at2`, `capAt` | auction: donut of competitive awards 7 Oct: indirect **80.3%** ($31.06B), direct **17.1%** ($6.62B), primary dealers **2.5%** ($0.98B, red, slab "LOWEST SINCE AT LEAST 2008"); strip $108B bids vs $39B sold, **2.77×**. demand: big bars $108B vs $39B, 2.77× "highest for a regular 10-year since Jan 2016", OUR MATH vs 2.51 average of the previous 12. investor-class: 9 Sep auction, indirect 79.2% vs investor class funds **66.3%** / foreign & international **28.1%** (red) / dealers 5.3% / others 0.3%; slab **INDIRECT ≠ FOREIGN**. |
| `holders` | `at`, `japanAt`, `totalAt`, `others` (true adds Belgium $490.5B, Luxembourg $448.2B), `title`, `kicker` | Paper-cut world (Natural Earth 1:50m), navy 2.5D columns from London, Beijing, Tokyo: UK **$1,010B**, China **$591B**, Japan **$1,068B** with a dashed red ghost of its Feb level, "−$171B SINCE FEB" + "HOLDINGS FELL; PARTLY PRICE"; card **$9.33T** ≈ 29% of US debt held by the public (of $32.41T, 31 Aug 2026, OUR MATH); caveat pill "COUNTRY = WHERE THE CUSTODIAN SITS, NOT NECESSARILY THE OWNER"; AS OF END-AUG 2026. Word defaults: 'Japan', 'Britain', 'China'. |
| `calendar` | `mode` 'month' (default) \| 'travel'; month: `today` ('2026-10-18'), `at`, `tick`, `clockAt`, `pins` [{ date, short, label, word, red }]; travel: `steps` [{ icon, when, title, word }] | month: Mon 12 Oct – Sun 15 Nov grid, TODAY SUN 18 OCT 2026, a teal sweep counts the 23 days to TUE 10 NOV (red); pins WED 4 NOV refunding (word 'Wednesday'), **TUE 10 NOV 10-year auction · 1:00 P.M. ET** ('Tuesday'), THU 12 NOV 30-year ('thirty'); 11 Nov hatched CLOSED (Veterans Day); a clock runs to 1:00 and turns red. travel: six cards on a wire, a red pulse hops on the cues: Bids lock (TUE 10 NOV · 1:00 P.M. ET, 'lock') → Result posted (THAT AFTERNOON, 'result') → Bond prices move ('prices') → Mortgage-bond investors reprice ('reprice') → Lenders update rate sheets ('lenders') → Freddie Mac's weekly survey (BY THURSDAY, 'Freddie'); bracket **WITHIN DAYS** under 3–6. |
| `doc` | `doc` 'result' \| 'offering' \| '1929', `highlight` (key or [keys]), `at` (cue or [cues]), `zoom`, `tilt`, `label` (false hides), `source` | Clean recreation of the document as paper on a teal ledger desk (parallax: desk, an under-sheet, the page); the camera glides to each highlight, a pale red band sweeps the row and a red marker loop circles the value. result keys: high-yield (**5.300%**), allotted, coupon, price, median, low, competitive, subtotal, dealer (**$984,000,000**), direct, indirect, bid-to-cover (**= 2.77**). offering keys: closing (**1:00 p.m. ET**), noncomp-closing (12:00 Noon ET), offering ($39,000,000,000), max-award ($13,650,000,000), noncomp ($10,000,000), increments (0.001%), coupon. 1929 keys: amount (**$100,000,000 (or thereabouts)**), deadline (**Friday, December 13, 1929.**), discount, title, minimum. The 1929 sheet uses only RESEARCH §9a verbatim fragments joined by ellipses and is labelled **RECREATION**; the 2026 sheets are labelled "RECREATED FROM THE TREASURYDIRECT … PDF". |
| `debt` | `mode` 'counter' \| 'interest' \| 'wall' \| 'rates'; `at`, `at2`, `fifthAt` (interest), `roll` (counter) | counter: $37.94T (15 Oct 2025) rolls to **$40,388,317,675,071** (AS OF 15 OCT 2026), **+$2.45T in one year ≈ $6.7 billion a day** (OUR MATH). interest: FY2026 bars net interest **$1,051.8B** (red, "+$81.4B ON FY2025") vs national defense **$965.2B**; "about $1 in every $5 of revenue": five dollar notes, one red; OUR MATH $1,051.8B ÷ $5,403.3B = 19.5%. wall: $31.83T marketable, **$10.64T (33.4%)** due by 30 Sep 2027 in red (bills 7.12, notes 2.92, FRN 0.35, TIPS 0.22, bonds 0.03; OUR MATH, MSPD table 3, includes Fed-held). rates: average rate on all marketable debt **3.518%** (30 Sep 2026, highest since Sep 2008) vs new 10-year money **5.300%**. |
| `timeline` | `events` (years or { year, label, word }), `focus` (year or [from, to]), `title`, `spacing`, `source` | Default: 1929 first T-bill auction · 1983 Yardeni coins "Bond Vigilantes" · 1993 Carville · 1994 bond rout 5.19% → 8.05% · 2022 UK gilt crisis £19.3bn · 2024–26 Fed cuts 1.75 pts; 10-yr auction at 5.300%. Years are strings, so ranges like '2024–26' work. With `focus` all events show at once and the focus turns red. |
| `map` | `mode` (or `view`) 'uk' \| 'us', `pins` [{ name, lon, lat, word }], `at` (the card), `title`, `kicker`, `source` | Paper-cut 2.5D map on pale teal with a graticule, the country lifted in sage. uk: London pin; card 23 SEP 2022 "mini-budget" · **+1.30 PTS** 30-year gilt yield in 3 days · £19.3BN bought by the BoE · 20 OCT the PM says she will resign · "on whatever scale is necessary". us: California, Orange County pin; card 1994 · **$1.64BN** lost · 6 DEC 1994 files for bankruptcy · the largest US municipal bankruptcy, at the time. |

### `rates` modes

| Mode | Cues | What it draws |
|---|---|---|
| `paradox` | `at` (draw to the first cut), `fromAt` (the 6.09% tag), `riseAt` (the four months of cuts), `extend` (default true when the shot is long enough), `extendAt` | Fed funds upper target as a **red step line** vs the 30-yr mortgage (navy), Aug 2024 → Feb 2025: FIRST CUT · 18 SEP 2024; tags 6.09% (19 SEP 2024), **7.04%** (16 JAN 2025 · +0.95) and **−1.00** (FED TARGET 5.50 → 4.50). Extension: the x-axis widens to Jan 2026, tags 6.22% (11 DEC 2025 · +0.13 OVERALL) and **−1.75** (SIX CUTS · 5.50 → 3.75), slab MORTGAGES ENDED HIGHER. Dates always on screen (RESEARCH §14). |
| `today` | `at`, `hikeAt` | Same lines to 15 Oct 2026: FIRST CUT, LAST CUT · 10 DEC 2025, red slab **FED HIKES +0.25 · 16 SEP 2026**, end tags **7.40%** HIGHEST SINCE NOV 2023 (red) and 4.00% fed target; AS OF 15 OCT 2026; pill "SINCE THE FIRST CUT: FED −1.50 · MORTGAGES +1.31". |
| `tenyear` | `at`, `from` ('1971-04-01'), `zoom` (a date to zoom the start to), `zoomAt` | 30-yr mortgage (navy) vs 10-yr 7-day average (teal) weekly since Apr 1971, the spread shaded sage; bracket **2.30 PTS** (7.40 − 5.10, NOW, AS OF 15 OCT 2026) and **1.76 PTS** average since 1971; OUR MATH pill with the method. |
| `history` | `at`, `from` ('1962' or a date, e.g. '1979'), `focus` ('1994'), `focusAt` | 10-yr daily close since 1962: **15.84%** · 30 SEP 1981 THE PEAK, the 1994 band 5.19% → 8.05% (Oct 1993 → Nov 1994), **5.31%** · 5 OCT 2026 HIGHEST CLOSE SINCE MAY 2002. focus '1994' zooms to Jun 1993 – Apr 1995: 5.19% (15 OCT 1993), **8.05%** (7 NOV 1994 · +2.86 PTS), FED HIKES · 4 FEB 1994, pill "“THE WORST BOND MARKET LOSS IN HISTORY” · FORTUNE"; the title changes to "1994: the bond market panics". |
| `auctions` | `series` (10 \| 30), `word` per point (defaults spread), `markAt` | Lollipops, evenly spaced, dated: 8 OCT 2025 4.117% (a year earlier, grey) → 12 JAN 4.173% → 12 MAY 4.468% → 12 AUG 4.683% → 9 SEP 4.834% → **7 OCT 5.300%** (red); dashed line "8 NOV 2000 · 5.865% · LAST TIME HIGHER"; card "HIGHEST 10-YEAR AUCTION YIELD SINCE NOV 2000" + OUR MATH. series 30: 4.734% → 4.825 → 5.046 → 5.216 → 5.308 → **5.618%** (8 Oct), since 10 AUG 2000 · 5.697%. |

## Quotes (verbatim from RESEARCH.md)

| Script line | `text` | `by` / `role` | `source` |
|---|---|---|---|
| 53 | "…largely reflects the price of the prepayment option" | Federal Reserve Bank of Boston · Current Policy Perspectives 26-3, 19 May 2026 | BOSTON FED (S27) |
| 57 | "tends to be much closer to 10 years" | Federal Reserve Bank of St. Louis · Page One Economics, 1 Oct 2026 | ST. LOUIS FED (S26) |
| 63 | "you don't usually see immediate movement in mortgage interest rates" | Federal Reserve Bank of St. Louis · Page One Economics, 1 Oct 2026 | ST. LOUIS FED (S26) |
| 80 | "entirely satisfied" | Under Secretary Ogden Mills ⚑ first name not in RESEARCH: use "Under Secretary Mills" · Dec 1929 | GARBADE (FRBNY, 2008), CITING NYT/WSJ (S45) |
| 83 | "I used to think if there was reincarnation, I wanted to come back as the president or the pope or a .400 baseball hitter. But now I want to come back as the bond market. You can intimidate everybody." | James Carville · WSJ, 25 Feb 1993, via FRBSF | ROSE & SPIEGEL, FRBSF WP 2015-09 (S54) ⚑ WSJ page not read; keep "via" |
| 84 | "I did coin the term 'Bond Vigilantes' in 1983." | Ed Yardeni · Yardeni Research, 22 Aug 2023 | YARDENI RESEARCH (S55) |
| 88 | "1994 became the year of the worst bond market loss in history." | Al Ehrbar · Fortune, 17 Oct 1994 | FORTUNE (S47) |
| 94 | "a move three times larger than any other historical move over a similar period" | Bank of England · Quarterly Bulletin 2023 | BANK OF ENGLAND (S51) |
| 97 | "on whatever scale is necessary" | Bank of England · 28 Sep 2022 | BANK OF ENGLAND (S50) |
| 98 (optional) | "I cannot deliver the mandate on which I was elected by the Conservative Party." | Liz Truss · 20 Oct 2022 | GOV.UK (S53) ⚑ open the primary page first |

Do not quote Yardeni's 1983 line, Merton Miller or the anonymous Fed policymaker on screen (RESEARCH ⚑, §14).

## Script lines → sets (suggested)

| Script | Set and params |
|---|---|
| 1 "Twelve fifty-nine…" | `counter` { preset: 'clock', steps: [{ text: '12:59', …, word: 'Twelve' }, { text: '1:00', …, word: 'one@1' }] } (or let the 3D cold open carry it) |
| 4 "Five point three percent." | `counter` { preset: 'yield' } or `doc` { doc: 'result', highlight: 'high-yield', at: 'Five' } |
| 5 "since the year two thousand" | `rates` { mode: 'auctions' } |
| 7–8 6.09 → 7.04 | `rates` { mode: 'paradox', at: 'started', fromAt: 'six', riseAt: 'Four', extend: false } or `counter` { preset: 'paradox' } |
| Title | `title` |
| Ch. 1–5 | `chapter` { num, title, sub } |
| 12 "about two trillion dollars more" | `bignumber` { value: 1.99, prefix: '$', suffix: 'T', decimals: 2, label: 'FY2026 deficit: $7,395.8B out, $5,403.3B in', kicker: 'US FEDERAL BUDGET · FY2026', source: 'SOURCE: MONTHLY TREASURY STATEMENT, SEP 2026' } |
| 16 four hundred and thirty-six auctions | `bignumber` { value: 436, label: 'Treasury auctions in fiscal year 2026, more than one every business day', math: 'FISCAL DATA AUCTIONS FILE' } |
| 18 "announces… Bids close at one p.m." | `doc` { doc: 'offering', highlight: ['offering', 'closing'], at: ['thirty-nine', 'one'] } |
| 21 35% max | `doc` { doc: 'offering', highlight: 'max-award' } |
| 22 non-competitive, $10 million | `doc` { doc: 'offering', highlight: 'noncomp' } |
| 29 "five point three zero zero" / 57.60% | `doc` { doc: 'result', highlight: ['high-yield', 'allotted'] } |
| 30–32 coupon 4⅝, price 94.86 | `doc` { doc: 'result', highlight: ['coupon', 'price'] } |
| 37–42 who won; 2.5%; $108B for $39B | `bidders` { lowAt: 'smallest', coverAt: 'hundred' } then `bidders` { mode: 'demand' } or `doc` { doc: 'result', highlight: ['dealer', 'bid-to-cover'] } |
| 53 Boston Fed | `quote` (table above) |
| 54 spread 1.75 / 2.3 | `rates` { mode: 'tenyear' } |
| 57, 63 St. Louis Fed | `quote` |
| 65–67 the Fed cut, 10-yr rose, −1.75 | `rates` { mode: 'paradox' } (with the extension) |
| 68 "this September, the Fed reversed course" | `rates` { mode: 'today', hikeAt: 'raised' } |
| 70–73 $400k payment | `payment` { at: 'seven', deltaAt: 'Three', totalAt: 'Over' } |
| 74 vs 3% | `payment` { variant: '3pct' } |
| 77–80 1929 | `doc` { doc: '1929', highlight: ['amount', 'deadline'] }, `timeline` { focus: '1929' }, `quote` "entirely satisfied" |
| 81–85 Carville, Yardeni | `quote` ×2, `timeline` { focus: ['1983', '1993'] } |
| 86–88 1994 | `rates` { mode: 'history', focus: '1994' }, `quote` Fortune |
| 89–90 Orange County | `map` { mode: 'us' } |
| 91–98 Britain | `map` { mode: 'uk' }, `quote` BoE ×2 |
| 100 "highest in more than a quarter of a century" | `rates` { mode: 'history' } |
| 105 "safety net took almost nothing" | `bidders` { kicker: … } (vary a param if used twice) |
| 108–109 $40.3T, +$2.45T | `debt` { mode: 'counter' } |
| 110–111 interest > military, $1 in $5 | `debt` { mode: 'interest', fifthAt: 'dollar' } |
| 113 a third due within 12 months | `debt` { mode: 'wall' } |
| 116–117 3.5% vs 5.3 | `debt` { mode: 'rates', at2: 'Five' } |
| 125–127 Japan, Britain, China | `holders` { japanAt: 'hundred' } |
| 132 7.40%, highest since Nov 2023 ⏱ | `counter` { preset: 'today' } |
| 139–140 median home, +$250 | `payment` { variant: 'median' } |
| 143–147 4 Nov, 10 Nov, 12 Nov | `calendar` |
| 148–150 how fast it travels | `calendar` { mode: 'travel' } |
| 155–158 "Twelve fifty-nine. One p.m." | `counter` { preset: 'nov10' } |
| History overview (Ch. 3 open) | `timeline` |

## Data and documents

- `assets/data/*.csv`: FRED MORTGAGE30US (Freddie Mac PMMS, weekly), DGS10, DGS30 (daily), DFEDTARU (from 16 Dec 2008),
  DFEDTAR (to 2008). Loaded by `G.series(name)` in the kit; the spread uses PMMS minus the 7-day average 10-year (RESEARCH C8).
- `assets/geo/mortgage.json`: Natural Earth 1:50m (public domain) world, Europe and US-west layers, built by
  `assets/geo/build.py` from the Natural Earth GeoJSON (`python3 -I projects/mortgage/assets/geo/build.py <dir>`).
- `assets/fonts/Inter-latin.woff2` (OFL, copied from Panama). Plex Mono and Instrument Serif come from the stage.
- `assets/docs/*.pdf`: the source of every field in the `doc` recreations (read with `pdftotext -layout`).
- ⏱ re-pull before VO lock and publish: 7.40% (PMMS 15 Oct), $40,388,317,675,071 (15 Oct), 3.518% (30 Sep), TIC (end-Aug),
  18 Oct "today" in `calendar`, and the 4/10/12 Nov schedule.
