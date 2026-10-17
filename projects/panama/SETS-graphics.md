# Panama graphics sets (2D / 2.5D): parameters and cues

Libraries, loaded by `scene.js` (`LIBS`): `sets/graphics.js`, `sets/graphics-data.js`, `sets/graphics-maps.js`,
`sets/graphics-archive.js`. Shared helpers live in `sets/graphics-kit.js` (no sets). Every set paints a 2D canvas
(`inst.canvas`); `archive` also renders its parallax photo through `ctx.renderer` before compositing it.
Look-dev without the episode: `projects/panama-gfx-lab` (one shot per set/mode):
`node engine/render.mjs projects/panama-gfx-lab --stills=0.25,0.6,0.95 && node projects/panama-gfx-lab/lab.mjs --all`
→ `renders/panama/graphics/` (stills + contact sheets).

**Cues.** Anything called `at`, `word`, `…At` takes a number (seconds into the shot) or a spoken word:
`'rain'`, `'rain@1'` (2nd time it is said), `'rain+0.3'`. Unknown words fall back to the default time. Per the
dead-air rule, every set puts something on screen within the first second without any cue.
**Camera.** Every set drifts and pushes slowly. Override with `params.cam = { push, dx, dy, fx, fy }` (push 0 = locked).
**Sources.** Each set prints its default source line; `params.source` replaces it.

| Set | Params | Defaults / notes |
|---|---|---|
| `title` | `lines` (['THE CANAL','THAT RUNS','ON RAIN']), `sub` | Rain on the lake, paper clouds, a ship crossing. Last line red. |
| `chapter` | `num`, `title`, `sub` | The water rises over the type (it turns white underwater); tide-gauge ticks at the edge. ≥ 3.5 s. |
| `counter` | `steps` [{ value, label, sub, word, record }], `multiple` (false hides "≈96× · OUR MATH"), `multipleAt`, `title`, `kicker` | Flip-board reels. Default steps: $55,000 (median Oct 2025–Feb 2026, Bloomberg) → $3,975,000 (Nov 2023, Eneos) → $4,600,000 (Aug 2026, SK Shipping, via Bloomberg) → $5,300,000 (Aug 2026, "via Bloomberg; confirmed by the ACP administrator"), RECORD stamp. Cue each step on its word. |
| `bignumber` | `value`, `prefix`, `suffix`, `decimals`, `from`, `label`, `unit`, `kicker`, `note`, `source`, `red`, `at`, `roll` | Generic count-up card over a water band. |
| `slots` | `year` (2023 \| 2026), `steps` [{ n, date, note, word }], `title` | 36 ship icons; ships drop out (red) or pop back (yellow). 2023: 36 → 32 (30 Jul) → 24 (8 Nov) → 22 (Dec, lowest reached). 2026: 36 → 34 (4 Sep) → 32 (15 Sep) → 33 (15 Oct). |
| `timeline` | `events` (years or { year, label, word }), `focus` (year or [from, to]), `title` | Default 12 events 1881…2028. With `focus` all events show at once and the camera centres the focus (red); without, the line draws and pans end to end. |
| `budget` | `mode` ('bars' default \| 'foot'); bars: `inAt`, `octAt`, `outAt`, `deficitAt`; foot: `at`, `note` | Bars: inflow 15 (normal) vs 7 (Oct 2023), outflow 10, "−3 MILLION m³ EVERY DAY" (ACP, 3 Oct 2023). Foot: "one foot of lake ≈ 650 ship crossings", 650 marks fill a 1-ft slab, labelled OUR MATH with the working. |
| `countdown` | `today` ('2026-10-17'), `dryStart` ('2027-01-01'), `at`, `tick`, `pins` [{ date, label, word }] | Oct 2026 → Apr 2027 calendar; the day sweep counts the 76 days to 1 Jan; Jan–Apr sand with suns; default pin "85.5 FT · ACP PROJECTION" on 17 Dec. |
| `quote` | `text`, `by`, `role`, `source`, `highlight` (words), `size` | Words appear on their spoken times when the VO says them. See the quote table below. |
| `money` | `mode` 'revenue' \| 'share' \| 'transits', `at`, `at2` | revenue: $5.7B FY2025 revenue → $2.965B to the treasury, 52% (OUR MATH). share: 62.8% US origin/destination (FY2018). transits: 13,404 (FY2025, +19.3%). |
| `map` | `view` world \| americas \| isthmus \| watershed \| telegraph \| caribbean, `from` (a view to zoom from), `box`, `zoomDur`, `pins` [{ name, lon, lat, word, sub }] or keys, `labels` (keys or { name, lon, lat, kind: 'pill'\|'sea'\|'lake'\|'place'\|'pin' }), `routes` (true \| ['panama','suez','cape']), `routesAt`, `routeSpan`, `highlight` (ISO3 or list), `canal` (bool), `canalAt`, `canalLabel`, `title`, `signalAt`, `signalSpan`, `infoAt`, `tunnel` | Paper-cut land on turquoise. **world**: routes Gulf Coast → Japan, ships with day counters, 20 d Panama / 31 d Suez / 34 d Cape (EIA 2016); Japan appears at both ends of the strip. **americas**: Panama lifts in yellow. **isthmus**: Gatun + Alhajuela (OSM), canal draws on (red), Colón, Panama City, Río Indio site (approx.) with the 9 km tunnel. **watershed**: shaded catchment (APPROX.), rain, clouds, "≈2.6 m a year" card. **telegraph**: Washington → New York → Galveston → submarine cable → Gamboa, a pulse runs the line and the dike blows; "10 OCT 1913 · JUST AFTER 2 P.M." (ROUTE SCHEMATIC). Label keys: colon, panama-city, gatun, alhajuela, rio-indio, gatun-locks, miraflores, gamboa, caribbean, pacific, pacific-w, atlantic, panama. |
| `elnino` | `mode` 'full' \| 'map' \| 'odds', `odds` (83), `odds2` (70), `at` (needle), `title` | Stylised SST-anomaly tongue as paper-cut bands (labelled STYLISED), Niño-3.4 +2.1 °C and Niño-1+2 +3.9 °C chips, odds dial 83% Oct–Dec, Nov–Jan 70%, EL NIÑO ADVISORY badge, RONI footnote, "NOAA CPC · 8 OCT 2026". |
| `gauge` | `mode` 'history' \| '2023' \| 'now' \| 'scenario', `at`, `drawDur`, `title`, `kicker`, `marks` (history), `level` (now/scenario, 85.7), `projAt` (scenario) | Real ACP daily data (`assets/data/gatun.csv`). **history**: 1965–2026 draws on; callouts as the line reaches #2 1998 (78.55), LOWEST 2016 (78.31), #3 2023 (79.24) with tags. **2023**: red 2023 line over the range of all other years; "LOWEST EVER FOR THE DATE · 153 OF 153". **now**: staff gauge, the water rises from 79.69 ft (17 Oct 2023) to 85.7 ft "AS OF 17 OCT 2026", +6.0 FT, record-low line, ACP projection chip. **scenario**: today → ACP projection (dashed, 85.5 ft on 17 Dec) → the actual 1997–98 and 2015–16 drawdowns added to 85.5 (ends 80.5 / 79.9 ft), 2023–24 crisis-low band, draft-line markers (85.7 ft ↔ 49 ft draft; ~79.5 ft ↔ 44 ft, Aug 2023), red "SCENARIO, NOT A FORECAST" and the method footnote. |
| `archive` | `photo` (stem), `caption`, `credit`, `date`, `move` push \| pull \| lateral \| rise, `amount`, `center`, `depth`, `mm`, `tilt`, `treatment` ('warm' \| 'bw') | Paper print with depth parallax (engine/parallax.js), lifted warm sepia. Stems: gamboa-blast-1913, gamboa-pipes-1913, gatun-dam-1910, gatun-spillway-1913, culebra-flooded, cucaracha-slide-1913, gatun-locks-1910, gatun-monolith-1912 (captions and credits built in; CREDITS.md). |
| `satellite` | `mode` 'wipe' \| 'queue'; wipe: `a`, `b` (dates), `at`, `pins`; queue: `at`, `counters` [{ value, label, sub, word, red }] | wipe: Sentinel-2, 5 Jan 2026 (lake 88.8 ft) vs 3 Jun 2023 (80.1 ft), divider sweeps, "−8.7 FT" chip. The shoreline change is small at 20 m; let the labels carry it. queue: NASA EO image of 18 Aug 2023, rings on ships, counters 163 (ACP, 9 Aug 2023) and ~90 normal (NASA). |

## Quotes (verbatim from RESEARCH.md)

| Line | `text` | `by` / `role` | Source |
|---|---|---|---|
| 122 | "Correcto, sí." | Ilya Espino de Marotta · ACP Administrator, 28 Aug 2026 | EFE (S42) |
| 116 | "Current data does not forecast the need for transit restrictions through December 31, 2026." | Panama Canal Authority · A-19-2026, 9 Jun 2026 | S07 |
| 150 | "Right now, we are late by six years." | Jorge Luis Quijano · former ACP Administrator, 2025 | NPR (S49) |
| 113 | "We are rain takers." | ⚑ **not in RESEARCH.md**: find the speaker, date and source before using it | — |

## Script beats → sets (suggested)

| Beat | Set |
|---|---|
| Title card | `title` |
| Ch. 1–5 cards | `chapter` { num, title, sub } |
| L4 "fifty million gallons" | `bignumber` { value: 50000000, label: 'gallons of fresh water poured into the sea, per crossing' } |
| L36 rain and seasons | `map` { view: 'watershed' } |
| L45–62 history | `timeline`, `archive` (culebra-flooded, cucaracha-slide-1913, gatun-dam-1910, gatun-spillway-1913, gatun-locks-1910) |
| L64–68 Wilson's signal | `map` { view: 'telegraph' } → `archive` { photo: 'gamboa-blast-1913' } |
| L75–76 money | `money` { mode: 'revenue' }, `money` { mode: 'transits' } |
| L81 routes | `map` { view: 'world' } |
| L83 US share | `money` { mode: 'share' } |
| L89 one foot | `budget` { mode: 'foot' } |
| L97–109 slot cuts | `slots` { year: 2023 } |
| L100–101 queue | `satellite` { mode: 'queue' } |
| L104 record for the date | `gauge` { mode: '2023' } |
| L105–106 water budget | `budget` |
| L110–112, 121–123 auctions | `counter` |
| L119, 124 2026 slots | `slots` { year: 2026 } |
| L127–129 NOAA | `elnino` |
| L131–133 the record lows | `gauge` { mode: 'history' } |
| L134 dry season | `countdown` |
| L135–136 today | `gauge` { mode: 'now' } |
| L137–141 the what-if | `gauge` { mode: 'scenario' } |
| L144–146 Río Indio | `map` { view: 'isthmus', labels: ['gatun', 'rio-indio', 'colon', 'panama-city'] } |
| Lake from space | `satellite` { mode: 'wipe' } |
