# Silver graphics sets (2D / 2.5D): parameters and cues

Libraries loaded by `scene.js` (`LIBS`): `sets/graphics.js`, `sets/graphics-data.js`, `sets/graphics-maps.js`,
`sets/graphics-docs.js`. Shared helpers live in `sets/graphics-kit.js` (no sets): palette, fonts, the canvas set, camera
drift, the 1979–80 silver key closes (`KEY7980`) and an image loader. Every set paints a 2D canvas at 1920×1080 units
as a pure function of t (seeded noise only). Adapted from `projects/mortgage/sets/graphics*.js`; all mortgage content
(FRED series, auctions, payments, gilts, calendar, holders) is gone.

Look-dev: `projects/silver-gfx-lab` (one shot per set/mode, no narration):
`node engine/render.mjs projects/silver-gfx-lab --stills=0.3,0.9` (filter with `ONLY=id,id`) → `projects/silver-gfx-lab/out/stills/`.

**House style.** Bright paper `#f7f6f1` with faint teal ledger rules, ink navy `#14233d`, sage `#a9c5ae` / teal `#2a8c86`,
one red `#e0241b` for the thing that matters. Figures Plex Mono, headlines Inter 800–900, quotes Instrument Serif,
recreated notices Archivo Narrow. ⏱ live facts carry a navy **AS OF** pill; computed numbers a mint **OUR MATH** pill.
Recreated documents say so on screen. Charts of key prices say "DOTS = KEY PRICES · NOT A DAILY SERIES" and "LINE JOINS POINTS".

**Cues.** Anything called `at`, `word`, `…At` takes seconds into the shot or a spoken word: `'Thursday'`, `'one@1'`
(2nd time said), `'ten+0.3'`. Unknown words fall back to defaults, so every set runs a full animation without VO.
**Camera.** Every set drifts/pushes slowly; override with `params.cam = { push, dx, dy, fx, fy }` (push 0 = locked).
**Sources.** Every set prints its own source line; `params.source` replaces it; `kicker` / `title` replace the top lines.

## Sets

| Set | Params | Defaults / what it shows |
|---|---|---|
| `title` | `lines` (['THE BROTHERS WHO','TRIED TO BUY','ALL THE SILVER']), `sub`, `size` (146), `y` (300), `source` | Type rises line by line, last line red. Behind it the silver key-close line (31 Jul 1979 ~$9 → 31 Dec $34.45 → 17 Jan 1980 $48.70 → 22 Jan $34.00 → 10 Mar $29.75 → 25 Mar $20.20 → 26 Mar $15.80 → **27 Mar $10.80**, red pulse) draws on. Navy tape: ~$9 · $34.45 · $48.70 · **$10.80**. `sub` at the bottom (else the SEC source line). |
| `chapter` | `num`, `title`, `sub` | Ledger paper; CHAPTER + mono number + title (+ sub) left; the same key-close line draws on to the right ($48.70 peak label), ending on a red pulse and **$10.80**. Min 3.5 s. |
| `quote` | `text`, `by`, `role`, `source`, `highlight` (word prefixes), `size` | Serif quote on a white card; words appear as the VO says them (`M.wordTimes`), highlighted words get a sage marker. Size auto-scales to length (works up to ~300 chars). |
| `bignumber` | `value`, `prefix`, `suffix`, `decimals`, `from`, `label`, `unit`, `kicker`, `note`, `asof`, `math` (true or text), `source`, `red`, `at`, `roll`, `size` | Count-up card on ledger rules; `asof` adds the AS OF pill, `math` the OUR MATH pill. |
| `counter` | `preset` ('thursday' default \| 'clock1215' \| 'clock213'), or `steps` [{ text, label, sub, word, red, asof }], `kicker`, `title`, `clock` ([h, m]: analog clock), `asof`, `tile`, `source` | Split-flap board: digits roll on reels, letters flip through seeded letters, `: . , ·` sit in narrow slots, shared spaces are gaps. On a red step only the figure after the last `·` turns red. Dots track the steps. **thursday**: TUE 25 MAR · $20.20 → WED 26 MAR · $15.80 (−$4.40 IN A DAY) → **THU 27 MAR · $10.80** "SILVER THURSDAY · −31.6% IN ONE DAY". **clock1215**: **12:15 PM**, kicker WED 26 MAR 1980 · BACHE CALLS THE FED CHAIRMAN, "“A GREAT ILLIQUIDITY IN THE SILVER MARKET”", analog clock. **clock213**: **2:13 PM**, kicker THU 27 MAR 1980 · NYSE HALTS BACHE STOCK, "SILVER FUTURES CLOSE AT 2:15 P.M.". Cue each step with `word`. |
| `timeline` | `events` ([{ year, date, label, word, red }] or year strings), `focus` (year, 'DATE YEAR' e.g. '27 MAR 1980', label, or [from, to]), `title`, `spacing`, `source` | Default: 1961 Sarir find · 15 AUG 1971 gold window closed · 1973 Libya nationalises / first silver buys · JUL 1979 IMIC (Bermuda) · 17–18 JAN 1980 ~$50 · **27 MAR 1980 Silver Thursday $10.80** (red) · AUG–SEP 1988 $134M civil verdict; Chapter 11 · 25 APR 2011 $49.85 · OCT 2025 breaks $50 · 29 JAN 2026 record ~$121. Alternating above/below the axis, ⫽ marks for skipped years. With `focus` all events show at once and the focus turns red (others dim). |
| `silver-chart` | `mode` ('runup' \| 'crash' \| 'long' \| 'real'), `at` (draw start, 0.6 s), `drawDur`, crash: `dayAt`, `peakAt`; real: `adjustAt`, `recordAt`; `title`, `kicker`, `source` | Key prices only: dots, lollipop stems, straight segments; a sweep draws left to right, dots pop and tags rise as it passes. See modes below. |
| `doc` | `doc`, `highlight` (key or [keys]), `at` (cue or [cues]), `zoom`, `tilt`, `label` (false hides), `source` | Typographic RECREATION on a ledger desk (parallax desk / under-sheet / sheet). The camera glides to each highlight; a pale red band sweeps it, then a red marker loop (single values), red underlines (phrases in running text) or a red outline drawn round (boxes). Label pill top left ("RECREATED TEXT · …" / "RECREATION · …"); each sheet also carries its own small-print note. See docs below. |
| `photo` | `file` (in `assets/photos/`), `caption`, `credit`, `focus` ([x, y] 0..1, [0.5, 0.45]), `zoom` (1.14), `kicker`, `tilt`, `maxScale` (1.7), `cutout` (default true for .png) | White-bordered print on paper with an eased Ken Burns push toward `focus` (cover-cropped; landscape window ≤ 1440×800, portrait ≤ 800 high), faint vignette + grain; navy caption slab wipes on, mono credit line under it. Portraits put the caption to the right. Small images (e.g. H. L. Hunt, 298×376) are capped at 1.7× and get a wide mat. PNG cutouts (the 1,000 oz bar) float with a shadow, no card. |
| `map` | `mode` ('world' \| 'us'), `pins` ([{ name, lon, lat, sub, word, side 'l'\|'r', dy }]; a name matching a default pin inherits its fields), `routes` ([[fromName, toName, word?]]), `hl` (ISO3 or 'US-TX' codes), `hlAt`, `at` (first pin), `title`, `kicker`, `source` | "Reconstructed" look: white relief land (extruded edge, inner coastal shade, seeded terrain mottling) on a pale blue-grey sea with a 10° graticule; `hl` regions rise in red on a spring; red teardrop pins with a white dot drop in (spring + ground shadow + pulse); white label cards (name + mono sub); red dashed arcs draw on with an arrowhead. **world**: Dallas (THE HUNTS), Libya (Sarir ~27.6N 22.4E, SARIR OIL FIELD), Bermuda (IMIC · JUL 1979), Saudi Arabia (Riyadh, SAUDI PARTNERS), Zurich (LENDER: SWISS BANK CORP.), Lima (MINPECO · PERU); routes Dallas→Bermuda, Saudi Arabia→Bermuda; no `hl` by default. **us**: lower-48 states + Canada/Mexico, Great Lakes; Dallas, Chicago (CHICAGO BOARD OF TRADE), New York (COMEX · BACHE), Washington (FED · CFTC · CONGRESS), Boca Raton (BANKERS · 30 MAR 1980); Texas raised (`hl: ['US-TX']`); routes Dallas→New York, Dallas→Chicago. |

### `silver-chart` modes

| Mode | What it draws | Sources on screen |
|---|---|---|
| `runup` | 31 JUL 1979 ~$9 (group ~123M oz) → 31 DEC 1979 $34.45 (~195M oz) → 17 JAN 1980 $48.70 (record settle); then a red dashed tick to the intraday high, red tag **~$50 · INTRADAY HIGH $50.36 · 17–18 JAN 1980**. Linear date axis Jul 1979 – mid-Feb 1980, $0–60. | SEC staff report pp. 4, 32, 37, 65 · line joins points |
| `crash` | ~$50 (17–18 Jan, intraday $50.36) → 22 JAN $34.00 → 10 MAR $29.75 → 25 MAR $20.20 → 26 MAR $15.80 → **27 MAR $10.80** (red). The x-axis zooms for 25–27 Mar (⫽ break, shaded "LAST 3 DAYS, ZOOMED", ticks TUE 25 / WED 26 / THU 27). `dayAt` (default draw end + 0.5 s): red slab **−31.6% IN ONE DAY** + OUR MATH $15.80 → $10.80. `peakAt` (default dayAt + 1.8): dashed peak line + arrow, navy slab **−78.6% FROM THE PEAK** + OUR MATH ($50.36 − $10.80) ÷ $50.36. | SEC pp. 7, 35, 65, 79, 93 · peak = Comex intraday high · line joins points |
| `long` | 1973 avg $2.55 · ~$50 JAN 1980 → $10.80 27 MAR 1980 · $49.85 25 APR 2011 · ABOVE $50 OCT 2025 → **$121.64 RECORD 29 JAN 2026** (red) → −27% 30 JAN 2026 → $56.89 19 OCT 2026 (⏱ AS OF pill). Segments join only within an episode; stems mark every point. Piecewise axis (⫽): 1972–81 · 1981–2010 compressed · 2010–mid-2025 · mid-2025–2026 expanded. Footnote: 30 Jan 2026 plotted at −27% from the record (OUR MATH, = $88.80). | SEC; hearings; InvestmentNews; CNN; Reuters; Trading Economics · lines join points within each episode |
| `real` | Two bars, $0–240: **1980 PEAK** (18 Jan 1980 London fix) rises to $49.45 (steel, "IN 1980 DOLLARS"), then at `adjustAt` springs up to **$214** (red, "≈ $214.16 IN SEP-2026 DOLLARS"); **2026 RECORD** $121.64 (teal, 29 Jan 2026 spot) with its level dashed across. OUR MATH · BLS CPI-U · $49.45 × 336.940 ÷ 77.8 = $214.16. | London fix; Reuters; BLS CPI-U Jan 1980 = 77.8, Sep 2026 = 336.940 |

### `doc` sheets (all recreations; keys for `highlight`, defaults in bold)

| `doc` | Sheet | Keys |
|---|---|---|
| `rule7` | COMEX · EMERGENCY ACTION · SILVER RULE 7: effective Monday 7 Jan 1980; limit 2,000 contracts per trader = 10,000,000 troy oz (5,000 oz a contract); applies to positions already held; spot $35.80. Summary per SEC p. 65 / CFTC 2013. | title, date, **limit**, ounces, **retro**, spot |
| `liquidation` | COMEX notice, Monday 21 Jan 1980, boxed LIQUIDATION ONLY; new positions not accepted; existing positions may only be closed out; Tue 22 Jan CBOT follows. Summary per SEC p. 35. | date, **stamp** (red outline draws round the box), **new**, close, cbt |
| `tiffany` | Full-page-ad layout on newsprint, Instrument Serif, the verbatim RESEARCH M3 quote, "TIFFANY & CO." set in plain serif caps. Label: TEXT AS QUOTED BY TIME, 7 APR 1980 · RECREATION, NOT THE ORIGINAL AD. | **unconscionable**, **billion** ("several billion, yes billion,"), spoons |
| `cftc` | Typed MEMORANDUM, 8 Jan 1980, Meeting with Nelson Bunker Hunt, 3:00 p.m., Office of Commissioner Dunn; excerpts "… [Mr. Hunt] asked whether CFTC’s objective was to raise, lower, or stabilize silver prices …" / "… [and] whether CFTC was considering action to shut down the silver market. …" | **objective**, **shut**, date |
| `fed` | Federal Reserve Bank of Dallas Circular No. 80-49 (15 Mar 1980), SPECIAL CREDIT RESTRAINT PROGRAM, announced 14 Mar 1980: "[Lenders should avoid] “… financing for purely speculative holdings of commodities or precious metals or extraordinary inventory accumulation …”" | **speculative**, title, date |
| `verdict` | S.D.N.Y., Minpeco, S.A. v. Hunt et al., jury verdict Sat 20 Aug 1988, CIVIL CASE box; ledger $66.2M → × 3 $198.6M → − $64.6M → **$133.95M**; found liable: Bunker, Herbert, Lamar Hunt, Mahmoud Fustok, IMIC. Note: civil, nobody convicted. | **damages**, **treble**, **settle**, **net**, liable, case, date, civil |
| `bankruptcy` | U.S. Bankruptcy Court, Dallas, Sep 1988, CHAPTER 11, Bunker · Herbert; numbered list: Hawaiian real estate · half interest in a Vail, Colo., ski lodge · two Cadillacs · a Mercedes-Benz · a 13,649-piece Byzantine coin collection; "Filed partly to avoid posting a $225 million appeal bond." Per Time, 3 Oct 1988. | chapter, hawaii, vail, **cadillacs**, **mercedes**, **coins**, bond |
| `testimony` | Index card: SWORN TESTIMONY · FRIDAY, MAY 2, 1980 · W. HERBERT HUNT; big serif "“At no time did I attempt to corner, squeeze, or manipulate the silver market.”" plus the two following sentences small. | **corner**, rest, date |

## Photos (credit lines from `assets/photos/CREDITS.md`)

| `file` | Suggested `caption` | `credit` |
|---|---|---|
| `loc_comex_floor_1978_a.jpg` / `_b.jpg` | A New York commodity exchange floor, c. 1978 | Photo: Bernard Gotfryd, Library of Congress Prints & Photographs Division, LC-DIG-gtfy-08664 (b: LC-DIG-gtfy-07767) |
| `loc_volcker_senate_1983.jpg` | Paul Volcker, Federal Reserve chairman (Senate testimony, 1983) — never caption it as 1980 | Photo: Chick Harrity, U.S. News & World Report Magazine Collection, Library of Congress, LC-DIG-ppmsca-87454 |
| `commons_hl_hunt_1965.jpg` | H. L. Hunt, 1965 | H. L. Hunt, 1965. Public domain, via Wikimedia Commons |
| `commons_lamar_hunt_1974.jpg` | Lamar Hunt, 1974 | 1974 press photo, Lamar Hunt. Public domain (US), via Wikimedia Commons |
| `commons_executive_order_6102.jpg` | 1933: Americans ordered to hand in their gold | Executive Order 6102 notice, 1933. US Government, public domain |
| `commons_silver_bar_1000oz.png` | A 1,000-ounce silver bar | “1000oz silver bullion bar” by Unit 5, CC BY-SA 3.0, via Wikimedia Commons |

## Data

- Key prices: `KEY7980` in `sets/graphics-kit.js` and `MODES` in `sets/graphics-data.js`, each with its RESEARCH row.
- `assets/geo/silver.json`: Natural Earth 1:50m (public domain): `world` (countries, ISO3), `us` (lower-48 states
  'US-XX' + CAN/MEX/CUB/BHS/GTM), `lakes`. Rebuild: `python3 -I projects/silver/assets/geo/build.py <natural-earth geojson dir>`.
- ⏱ re-check before VO lock / publish: $56.89 (19 Oct 2026, `long`), CPI Sep 2026 336.940 → $214.16 (`real`).
