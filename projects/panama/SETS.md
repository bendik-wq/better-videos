# Panama (episode 5): set API

The runtime is `scene.js`. Every shot in `project.mjs` names a `set` and passes `params`. The libraries live in
`sets/*.js`, the cut policy in `cuts.mjs`, and the look is `bright-model` (`engine/looks.js`, `engine/grade/bright-model.cube`;
put `settings: { look: 'bright-model' }` in `project.mjs`). This file covers the 3D clay sets. The 2D, data, map and
archive sets live in `sets/graphics*.js` and have their own notes.

## Conventions shared by every set

- **Cue times.** Any time parameter (`at`, `dropAt`, `rainAt`, ...) takes seconds, a spoken word (`'rain'`), the nth
  hit of a word (`'rain@1'`), a word plus an offset (`'rain+0.4'`), or `{ word, at }`, where `at` is used when the VO
  doesn't say the word. A `span` is always in seconds. Without VO, every set falls back to the default times listed below.
- **Look.** House blend (docs/library/bright-style/STYLE.md §13):
  - Light: a warm sun at 38–46° with a cool fill from the opposite side and a hemisphere sky.
  - Post: N8AO contact AO and Khronos PBR Neutral tone mapping through `engine/post.js`. Fog only on the aerials.
  - Materials: white clay `#f4f4f1` and concrete `#efece6`. Water is turquoise, animated, with sun glitter, from `CK.water`.
  - Dioramas are cut-away blocks with layered earth sides (`CK.terrain({ sides: true })`) on a pale void with a soft drop
    shadow.
  - At most one red accent per shot: the hero ship's funnel band, or Halliburton's cap.
- **Labels.**
  - `H.caption`: a black slab with white caps, wiped on (top left).
  - `H.pill`: a white pill with a pointer, pinned to a 3D point each frame.
  - `H.slab`: a black slab.
  - `H.sourceLine`: a small mono source line (bottom right).
  - Every set takes `caption` and `source` overrides. Pass `null` or `''` to hide them where the set has a default.
- **Camera.** Each set has default C1 camera moves (`C.path`, slow push or orbit, never static). Pass
  `camera: [{ pos, look, mm }, ...]` to override them; the keys spread over the shot's duration.

## Sets

| set | file | params (default) | what it shows |
|---|---|---|---|
| `cold-open` | `sets/oner.js` | `cues` ({ name: { word, at } }), `labels` (true), `counter` (true), `sweep` (3.6 s), `fillSpan` (≤ 8.5 s), `sunAz` (40), `sunEl` (38), `quality` ('low'), `mapSize` (2048) | THE ONER, ~55–60 s, moving on frame 1. 2 m skim over the glittering Pacific toward a Miraflores-like flight, white LPG carrier ahead → into chamber 0 → the chamber fills, camera rises with the water and climbs the stern → over the ship, up the staircase → crests the top gate, tilts to Gatun Lake → lake cruise → hard pull-up to the whole isthmus, white arrows pour into both seas → a section line sweeps in (lake 85 ft above both oceans, labelled) → clay clouds and rain on the watershed. **Cue words** (default s): `staircase` 11.5 (fill starts), `sky` 17, `up` ('Up there') 21.5, `lake` 25 (crest + reveal), `afternoon` 29, `climbs` 33 (pull-up), `pours` 37.5, `gallons` 42 (sweep), `gone` ('Gone') 46.5 (labels), `rain` 51 (clouds + rain). Cues are forced ≥ 2.4 s apart in order. Give the shot `min: 57` and `padIn` so line 1 starts after the skim has begun. |
| `lock` | `sets/clay-locks.js` | `mode`: `fill` \| `drain` \| `gates` \| `culverts` \| `mules` \| `swimmer`; `at`/`span` (1, duration−3: the water move); `gateAt`/`gateSpan` (1, 3.5); `ship` ('lpg'); `mules` (bool, mules in any mode); `view` (`fill`, `wide`, `drain`, `gates`, `culverts`, `mules`, `swimmer`); `sunAz` (112), `sunEl` (40) | Cut-away 2-step Panamax flight in pairs on a strata block: 1000 × 110 ft chambers, 13 m deep, 28 ft steps, miter leaves 64 × 7 ft, up to 82 ft. **fill**: the near lane rises with its ship; the far lane descends. **drain**: the near lane falls, the sea gate opens, arrows spill to the sea. **gates**: the miter gates swing open and the ship moves on. **culverts**: walls and floor go x-ray; 18 ft culverts (cyan) in all three walls, 20 laterals, 100 floor holes, flow arrows. **mules**: 4 locomotives on wall-top rails with tow lines, moving with the ship. **swimmer**: an empty chamber and a tiny swimmer (red cap), pull-back, "TOLL: 36¢", "CHARGED BY WEIGHT · 150 LB". |
| `pools` | `sets/clay-locks.js` | `mode`: `count` \| `field`; `count` (76); `field` (2700); `at` (0.8), `span` (duration−2.5) | **count**: a lock drains while clay Olympic pools (50 × 25 m, turquoise, lane ropes) pop out one after another; a counter runs to 76. **field**: crane-up over a field of 2,700 pools beside clay city blocks for scale; the counter runs to 2,700, "EVERY DAY". The source line reads "OUR MATH". |
| `expansion` | `sets/clay-locks.js` | `mode`: `compare` \| `basins` | The 2016 Neopanamax flight (427 × 55 × 18.3 m, rolling gates, 3 chambers) beside the 1914 pair. A 366 m container ship and a Panamax for scale. 3 water-saving basins per chamber, terraced; the middle chamber cycles and its water moves into the basins, top first, and back (arrows). Captions "70 FT WIDER · 18 FT DEEPER" or "3 WATER-SAVING BASINS PER CHAMBER · 60% REUSED". |
| `hourglass` | `sets/clay-locks.js` | `inflow` (15, or 7 in deficit), `outflow` (10) in million m³/day; `mode`: `deficit` (7 in, 10 out, "−3 MILLION m³ A DAY", "OCTOBER 2023"); `level` (0.72, top fill); `speed` (0.6, the visual rate) | A clay hourglass with glass bulbs. A clay cloud rains into the top (GATUN LAKE). A stream runs through the neck (THE LOCKS), carrying tiny ships down, into the bottom (THE SEA). The top level moves with in − out. The in/out pills show the rates. |
| `section` | `sets/clay-land.js` | `highlight`: `atlantic` \| `gatun` \| `lake` \| `culebra` \| `pedro` \| `miraflores` \| `pacific` (null = wide); `wide` (bool); `flowOut` (false); `levelDrop` (false), `drop` (6 ft), `dropAt`/`dropSpan` (1, 4); `rain` (false), `rainAt`/`rainSpan` (0.8, 3): rain on the watershed, refills the drop; `madden` / `variant: 'madden'` (Lake Alhajuela and Madden Dam upriver, the river feeding Gatun) | The isthmus cut along the canal on a long strata block: Atlantic → Gatun 3 steps → Gatun Lake (islands, Gatun Dam) → Culebra Cut through the divide → Pedro Miguel 1 step → Miraflores Lake → Miraflores 2 steps → Pacific. Real levels with vertical exaggeration; schematic along the canal ("NOT TO SCALE"). Ships ride the water through. `highlight` frames a region with a pill. |
| `french-cut` | `sets/clay-land.js` | `slideAt`/`slideSpan` (1, 45 % of duration); `rainAt`/`rainSpan`; `floodAt`/`floodSpan` (50 %, 45 %); `rain` (true) | The failed sea-level trench, 1881–1889, through a clay mountain. Clay wedges slide back into the cut, rain falls and the trench floods. A dashed navy line marks the planned sea level, "PLANNED: SEA LEVEL". The mood stays bright. |
| `valley-flood` | `sets/clay-land.js` | `at`/`span` (2.2, duration−4): the flood; `damAt`/`damSpan` (0.6, 1.6) | The Chagres valley: river, three clay villages (GORGONA, MATACHÍN, GAMBOA pills), the OLD PANAMA RAILROAD (rails + ties), jungle hills. Gatun Dam rises at the downstream end, then the lake rises and drowns the valley. The village pills fade out and the hilltops become islands. "BARRO COLORADO" appears on one. |
| `culebra` | `sets/clay-land.js` | `mode`: (default) \| `blast`; `slideAt`/`slideSpan`; `at`/`span` (blast time, pour); `dike` (show the dike without the blast) | Terraced canyon, rails on the floor and benches, dirt trains, 4 steam shovels digging with puffing stacks. A slide wedge creeps in ("SLIDE · 14 FT A DAY"). **blast**: looks along the cut at the Gamboa dike (a thin earth wall) with the lake behind it. At `at` the dike blows (debris + dust), the lake pours into the cut and its front runs the length of it. "10 OCTOBER 1913 · GAMBOA DIKE". |
| `rio-indio` | `sets/clay-land.js` | `fill` (true), `at`/`span` (1.2, duration−3); `label` ('PLANNED · CONSTRUCTION FROM 2028') | Green valley west of Gatun: the river, villages, jungle, a white dashed outline of the future shoreline. A ghosted turquoise lake rises to it. The main dam and an x-ray 9 km tunnel with flow arrows lead to GATUN LAKE at the block's edge. |
| `aerial` | `sets/clay-aerial.js` | `mode`: `lake-islands` \| `locks-wide` \| `ships-transit` \| `jungle-shore` \| `dry-shore`; `cam` (0 \| 1 \| 2: variants per mode); `drop` (6 ft, dry-shore); `sunAz`/`sunEl` (130/46) | Bright aerials over the clay world (the same isthmus as the oner): islands and lake ships, the Pacific flight from 3 angles, a chase on a lake ship, low over the jungle shoreline. **dry-shore**: the lake is `drop` ft lower, with a pale exposed bank and tree stumps; caption "GATUN LAKE · −6 FT". |
| `queue` | `sets/clay-aerial.js` | `count` (163), `at` (0.8), `span` (duration−3), `label` ('SHIPS WAITING'), `caption` ('9 AUGUST 2023'), `seed` | High aerial of the Pacific entrance. Anchored white ships (instanced, baked clay hulls) appear one by one while the counter runs to `count`. Every 5th ship anchors off the Atlantic end, out of frame. |

## Shared modules (not sets)

- `sets/clay-kit.js` (`H.CK` / `H.CLAY`, its maths also as `H.LW` for blackout compatibility):
  - Look and light: `HOUSE`, `PAL`, `brightLight`, `catcher`.
  - Water and terrain: `water`, `terrain`, `blockSides`, `slab`.
  - Scatter and props: `trees`, `scatter`, `houses`, `rain`, `arrows`.
  - Ships and locks: `ship(kind)` (lpg, tanker, container, neo, bulk, ancon, tug; on the `engine/sea` lofted hull), `bake`,
    `lockFlight`, `mule`.
  - Maths: `cue`, `rng`, `fbm`.
- `sets/clay-world.js`: the clay isthmus at metre scale (Atlantic north, Pacific south, Gatun Lake at 26 m, both flights)
  with near/far, fog and shadow LOD from the camera altitude. Used by `cold-open`, `aerial` and `queue`.

## Cutting (`cuts.mjs`)
- **Default policy.**
  - `cut` everywhere by default.
  - `zoom-through` from an aerial into a diorama.
  - `match-dissolve` between two shots of the same diorama.
  - `dissolve` into or out of archive.
  - `push` from 3D into a data graphic.
  - `dip-black` into a chapter card.
- **Overrides.** `params.trans`, `transDur` and `transOpts` win over the default.
- **Sound.** `scoreTransitions(shots)` feeds `score.transitions`.

## Cost (llvmpipe, 1080p, 1 worker)
- Dioramas: ~0.75 s a frame (N8AO medium, 4096² shadow map).
- `cold-open`: ~0.5 s a frame (N8AO low, 2048² shadow map) plus ~15 s to build the world per chunk.
- The aerials and `queue` build the same world, so expect the same build time.
