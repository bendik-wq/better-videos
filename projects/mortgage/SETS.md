# Mortgage (episode 6): 3D clay set API

The runtime is `scene.js`. Every shot in `project.mjs` names a `set` and passes `params`. The 3D clay sets live in
`sets/clay-money.js`, `sets/clay-world.js` and `sets/oner.js`. The 2D, data, map and document sets live in
`sets/graphics*.js` and have their own notes. The look is `bright-model`: put `settings: { look: 'bright-model' }` in
`project.mjs`.

## Shared modules (not sets)

- **`/projects/panama/sets/clay-kit.js`** (reused unchanged) supplies the light (`brightLight`), the maths (`cue`,
  `rng`, `hash`, easing), `mat`, `instanced`, `water` and `skyEnv`.
- **`sets/clay-props.js`** holds this episode's toy pieces:
  - Palette: `C`.
  - Type: `canvasTex`, `textPlane` (a lit plane of canvas type with `.setText`).
  - Geometry: `rbox` (a rounded clay box) and `bake` (merge with vertex colours).
  - Houses: `houseParts` / `house` (gable house, `lite` LOD).
  - Auction pieces: `auctionBlock`, `gavel` (`.pivot` strikes), `soundBlock`, `priceTag` (an upright red luggage
    tag with `.setText`), `string`, `wallClock` (`.set(h, m, s)`), `ballotBox` (a glass hopper on a pedestal with
    `.seal(k)`, `.slot` and `.printer`).
  - Money: `envelopeGeo`, `iouMats`, `coinGeo`.
  - Street: `trees` (lollipop), `bushes`, `carGeo`, `padlock`, `saleSign`, `building('columns'|'tower'|'stepped'|'block')`.
  - Machines: `conveyor`.
  - Motion helpers: `pop`, `swing`, `pile`.
- **`sets/clay-world.js`** also exports `suburbWorld(scene, o)`. This is the clay suburb used by `suburb` and
  `cold-open`:
  - About 7 × 11 blocks: ~700 instanced houses in 4 variants, lawns, roads, street trees, a park with a pond, and
    parked and moving cars.
  - `o.hero` clears the hero lot (`W.heroLot`, which faces +z at about (0, 15.5)).
  - `o.clear` takes `[[x0, x1, z0, z1]]`.
  - It returns `{ lots, heroLot, tick(t), carsOn(n) }`.

## Conventions shared by every set

- **Cue times.** Any time parameter (`at`, `fillAt`, ...) accepts any of these forms:
  - seconds;
  - a spoken word: `'auction'`;
  - the nth hit of a word: `'one@1'`;
  - a word plus an offset: `'lock+0.4'`;
  - `{ word, at }`, where `at` is used when the VO doesn't say the word.

  A `span` is always in seconds. Without VO, every set falls back to the defaults below.
- **Look.**
  - Light: a warm sun at 42°, az 128–150 (from the right and in front, so front faces and type stay lit), a cool
    fill and a hemisphere sky.
  - Post: N8AO (medium) and Khronos PBR Neutral via `engine/post.js`.
  - Materials: white clay `#f4f4f1`, sage lawns, warm wood for the block, gavel and seesaw, and a slate roof on the hero.
  - Dioramas stand on a rounded plinth over a pale-blue-to-paper void with a soft shadow catcher. The suburb has a
    sky gradient and distance fog.
- **Red `#e0241b`.** At most one red element per shot:
  - the rate tag (`house-block`, `cold-open`);
  - the cutoff line (`bid-stack` cutoff and single-price);
  - the spread bracket (`pipe` spread);
  - the yield-pill dot (`seesaw`);
  - the new red-tinted debt (`debt-tower` rollover).
- **Labels.** Labels come from the runtime helpers:
  - `H.caption`: a black slab, top left, wiped on;
  - `H.pill`: a white pill pinned to a 3D point;
  - `H.slab`;
  - `H.sourceLine`: bottom right.

  Every set takes `caption` and `source`. Pass `''` or `null` to hide a default.
- **Camera.** Every set has a default slow C1 move (push, orbit or crane). It is never static, and the first frame is
  already composed. Pass `camera: [{ pos, look, mm }, ...]` to override it; the keys spread over the shot.
- **Common knobs.** `sunAz`, `sunEl`, `quality` (`'medium'`, or `'low'` for drafts) and `mapSize` (4096).

## Sets

| set | file | params (default) | what it shows |
|---|---|---|---|
| `cold-open` | `sets/oner.js` | `cues` ({ name: { word, at } }), `rate` ('5.300%'), `labels` (true), `bids` ('$108B'), `date` ('WED 7 OCT 2026 · 12:59 PM ET'), `since` ('HIGHEST SINCE 2000'), `gavel` (true), `sold` (false), `source` | **The one-take, ~27 s (`min: 28`, or the VO length).** It is moving on frame 1, tight on a big white wall clock at 12:59:48 with the turquoise second hand sweeping. It pulls back over a glass ballot box while a stream of sealed envelopes pours in through the open side of a rooftop auction room ("BIDS $0→108B" pill). The minute hand reaches 12 exactly at `lock`: the slot cover slides shut ("1:00 PM · BIDS LOCKED"). The pedestal prints the red ticket "5.300%". It lifts and turns to camera (the hit). It flutters out of the building, and the camera follows it down over the suburb ("HIGHEST SINCE 2000"). It grows as it falls and lands as the hanging red tag on the hero house on its wooden auction block. The gavel strikes 0.8 s after landing. **Cue words** (default s): `clock` 'Twelve' 1.6 (date caption), `bids` 'sale' 5.5 (pull-back, bid counter), `lock` "o'clock" 11 (12:59:60 → shut), `number` 'number' 14 (ticket prints), `rate` 'Five' 15.6 (ticket to camera), `suburb` 'highest' 18 (flight starts), `house` 'house' 24.5 (lands; gavel at +0.8). The cues are forced into order with minimum gaps (0.8 / 2.5 / 3 / 1.8 / 1.2 / 1.6 / 4.5 s). The clock is a pure function of the `lock` time, so it always reads true. |
| `house-block` | `sets/clay-money.js` | `mode`: `idle` \| `tag` \| `sold` \| `rate`; `at` (0.9; `sold`: min(2.5, 35 % of the shot)); `span` (rate roll, ≤4 s); `rate` (tag text, '5.3%'); `from` / `to` ('6.27%' / '7.40%', rate mode; decimals follow `to`); `sub` (small 2nd line on the tag); `view`: `hero` \| `wide` \| `close` \| `gavel` (default by mode: rate→close, sold→gavel, else hero); `lot` ('LOT 1'); `stamp` ('SOLD'); `roof` | **The hero (thumbnail A).** A white clay gable house (slate roof, door, windows, chimney) on a warm-wood auction block (plank lines, steps, a LOT 1 plate). The block stands on a sage lawn plinth with bushes and trees. A big gavel hovers front-left over a sound block. The red tag hangs from the front-right eave on a string. **idle**: the tag sways gently. **tag**: the tag pops on at `at` and swings down from ~80° with a damped pendulum. **sold**: the gavel winds up and slams at `at` (puff ring, a small camera kick, the tag jolts), and a navy SOLD stamp pops in top right. **rate**: the tag's number rolls from `from` to `to` over `span`. |
| `bid-stack` | `sets/clay-money.js` | `mode` (the last phase played): `arrive` \| `sort` \| `fill` \| `cutoff` \| `single-price`; `from` (first phase animated; default = mode; earlier phases are already done); `arriveAt`/`sortAt`/`fillAt`/`cutAt`/`priceAt` (sequential from 0.8 s); `arriveSpan` 4.2, `sortSpan` 4.6, `fillSpan` 5.0, `cutSpan` 2.4, `priceSpan` 2.6 | **The single-price auction, RECONSTRUCTION** (illustrative bids; source line says so). 216 envelopes = $108B in 14 yield bins from 4.30% to 5.60% along a printed yield ruler. The amounts are illustrative but exact: cumulative $39.0B lands inside the 5.300% bin at 57.6%. **arrive**: envelopes rain into a heap ("SEALED BIDS · $108B FOR $39B"). **sort**: they hop from the heap into a staircase of stacks, lowest rate first. **fill**: cheapest-first turquoise water fills stack after stack, and an "ON SALE $x / $39B" glass gauge rises to full. **cutoff**: a slim red post and line rise at 5.300% ("HIGH YIELD · 5.300%"); the stop stack shows "57.6% FILLED"; the stacks above slide back and turn grey ("ABOVE 5.300% · NOTHING"). **single-price**: "5.300%" pills pop over every filled stack from the line leftwards ("EVERYONE GETS THE SAME RATE"). Example: `{ mode: 'cutoff', from: 'fill' }` plays fill then cutoff. |
| `seesaw` | `sets/clay-money.js` | `at` (1.2), `span` (2.2), `tilt` (11°), `reverse` (false), `startTilt` (0, × tilt), `priceFrom`/`priceTo` (100 → 94.86), `yieldFrom`/`yieldTo` (4.625 → 5.300; decimals follow `yieldTo`), `pctColor` (lavender), `redYield` (true: red dot on the yield pill) | A wooden seesaw on a lawn plinth. Left: a TREASURY NOTE certificate block (10 YEARS · 4⅝% COUPON · $100) with a PRICE pill. Right: a chunky lavender 3D % sign with a YIELD pill. At `at`, the price end sinks and the yield end rises (a small settle), while the pills count `$100.00 ↓ → $94.86` and `4.625% ↑ → 5.300%`. Caption "PRICE DOWN · YIELD UP". |
| `pipe` | `sets/clay-money.js` | `mode`: `flow` \| `compare` \| `spread` \| `prepay`; `spread` (2.3, step height in pts); `from` (0, spread start); `at` (1.2), `span` (3.0); `mortRate` ('≈7.4%'), `tsyRate` ('≈5.1%') | **The mortgage pipeline.** Back line, raised on a riser: four clay houses feed loan papers onto a conveyor, into a BUNDLER (the press stamps rhythmically), and MBS blocks ride on. Front line, low: an auction ballot box feeds IOU blocks. Both lines end at generic investors (FUNDS tower, INSURERS stepped block, BANKS portico, each with a pill). The height of the riser is the spread. **flow**: "YOUR LOAN", "BUNDLED · MBS". **compare**: lane pills (mortgages ≈7.4%, 10-year ≈5.1%) and a grey spread bracket. **spread**: the riser rises from `from` to `spread` at `at`, with a red bracket and the pill "SPREAD ≈x.x PTS" (source OUR MATH). **prepay**: ~45 % of papers jump off mid-belt and arc back to the houses ("PAID BACK EARLY"). |
| `suburb` | `sets/clay-world.js` | `mode`: `wide` \| `forsale` \| `locked` \| `payment` \| `quiet`; `cam` (0 \| 1 \| 2); `at` (0.8), `span` (55 % of shot); `hero` (false: the auction-block house on its lot); `count` (signs 5 / pills 4); `share` (0.5 locked); `lockSize` (4.2); `payments` (['$2,770/mo', '$2,468 → $2,770', '+$302/mo', ...]); `counter` (true); `seed` | Aerial and low passes over the bright clay suburb. Cams per mode: **wide**: 0 a high 3/4 drift, 1 a drone down the middle of a street, 2 a near-top-down crane. **forsale**: 0 across a street at front yards, 1 down the street, 2 higher. FOR SALE signs pop in front yards, staggered. **locked**: 0–2 mid aerials. Gold padlocks with "<4%" pop over about half the houses, a "LOCKED BELOW 4% xx%" counter pill, and the caption "ABOUT HALF OF MORTGAGES · BELOW 4%" (source FHFA NMDB). **payment**: floating payment pills over 4 houses. **quiet**: 3 cars, slow low drifts. |
| `debt-tower` | `sets/clay-money.js` | `mode`: `grow` \| `rollover` \| `interest`; `at` (0.8), `span` (shot − at − 2.2); `from`/`to` (grow: 0 → 40.39 $T); `sub`; `rolled` (10.64); `interest` (1.05), `defense` (0.965), `defenseCoins` (30) | A tower of 400 white IOU blocks (5×4×20 on a plinth) with a big counter slab top left. **grow**: blocks pop in bottom-up while the counter runs `$from → $toT` ("U.S. DEBT"). **rollover**: the bottom third (7 layers) tints yellow ("≈1/3 DUE IN 12 MONTHS"). Layer by layer it slides out onto a conveyor and hops into an AUCTION hopper while the tower settles. Red-tinted new blocks arc back onto the top ("NEW 10-YEAR · 5.3%" vs "OLD DEBT · ≈3.5%"). The counter shows "ROLLED OVER · NEXT 12 MONTHS". **interest**: gold coins arc out of the tower into a NET INTEREST stack that ends taller than a static DEFENSE stack. The heights are in proportion, and the counter runs to $1.05T. |
| `vault` (alias `fed-room`) | `sets/clay-money.js` | `move`: `reveal` \| `wide`; `label` ('10-YEAR NOTES') | "The Fed sets one night; the auction sets ten years". A small wooden desk with a FED FUNDS dial (the needle nudges) and a little yellow crescent moon stands beside a giant glass auction hopper full of envelopes, with more pouring in. **reveal**: it opens close on the dial ("THE FED · ONE NIGHT") and cranes back to reveal the hopper ("THE AUCTION · TEN YEARS", at 45 % of the shot). |

## Cost (llvmpipe, 1080p, FXAA, N8AO medium, 4096² shadow map)

- **Dioramas.** About 0.36 s a frame with one worker (`house-block`, 90 frames in 32 s including setup). The other
  dioramas are in the same range; `bid-stack` and `debt-tower` update a few hundred instances a frame.
- **`cold-open`.** 810 frames (27 s) took 5.6 min with 3 workers. That is about 1.1–1.3 s a frame per worker while
  3 share the CPU, or about 0.42 s a frame of throughput. The suburb world builds in a few seconds per chunk.
- **`suburb`.** The same world and the same cost range as the oner's descent, about 0.4 s a frame.

## Look-dev

```
node engine/render.mjs projects/mortgage/lab --stills=0.2,0.5,0.9 [--only=id,...]
node projects/mortgage/lab/stills.mjs 20,50,90
```

The second command writes the graded stills, the STYLE §2.2 numbers per still and contact sheets to
`renders/mortgage/`. `BV_SHOTS=id,id` limits the shot list.

In the latest pass, near-black pixels (L < 0.06) stay at or below 0.4 % in every still.

## Known limits

- **Stream envelopes in the oner.** The envelopes pouring in read as small grey shards against the bright back wall,
  partly from AO on thin geometry. They read as motion, not as detail.
- **The ticket's exit.** For about 1.5 s after the ticket leaves the room, the frame shows the beige roof of the
  tower before the suburb fills it.
- **bid-stack is illustrative.** The bin amounts are invented. Only the totals ($108B, $39B), the 4.300% low and the
  5.300% stop at 57.6% come from the result. Keep the RECONSTRUCTION source line.
- **The suburb world.** It is grid-planned (no curved streets). Far-view lawns and roads depend on the paper plane
  sitting 0.6 m below the lawn. Don't raise it: the depth fight makes the lawns vanish.
