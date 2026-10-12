# Visual metaphors: abstract concepts → buildable shots

The narration in our genre is abstract (inflation, leverage, surveillance, compute). The picture
can't be. This is the lookup table that turns each abstract noun into **2–3 concrete, buildable
cinematic options**, each tied to a camera move in `docs/shots/catalog.json` and a set or asset
we can make with the engine.

**How to use it (from `shot-design`):**
1. For each beat whose job is *mechanism*, *number* or *tension* and whose VO names an abstract
   concept, search this file for the concept (or its nearest neighbour in the same section).
2. Pick the option that fits the episode's existing sets. Prefer an option that reuses a set
   already built for the episode, with a new angle, lens and light state (`shot-design` §8).
3. Put the shot id into `plan.json` as `"shot"` and run `node docs/shots/pick.mjs plan.picked.json --check`.
   The ids here are starting points: if the variety rules reject one (same id within 10 min,
   scale or energy repeats), take the next option on the row or the nearest catalog neighbour.
4. Write the motivation as usual ("push-in because VO says *leverage*").

**Rules for metaphors** [house, from `docs/research/editing-library.md` §3 and the style bible]:
- **Literal first, lateral second.** Show the real thing (the filing, the building, the chip)
  before or after the metaphor, about 60/40 literal to lateral across a chapter. A metaphor with
  no literal anchor reads as stock-footage filler.
- **One metaphor per idea, then keep it.** If debt is a backpack in Ch.1, it's the same backpack
  in Ch.4 (a callback in pictures). Log the episode's metaphors in the outline.
- **Physical, single-lit, in darkness.** Every option is designed for one motivated key light
  and a dark set: a pedestal object, a diorama, a city or a map. No icon soup, no clip-art
  arrows; the only red is the annotation.
- **Scale needs a reference.** Any "huge" option includes a human silhouette, a container or a
  car (`shot-design` §5).
- **No realistic CG faces.** Options that involve people use silhouettes or the matte UAL
  mannequin (`make-video` toolkit); faces are archive photos only.
- **Label reconstructions and illustrations** when they could be mistaken for real footage
  (`fact-check-playbook.md` §3).

**Set and asset vocabulary** used in the right-hand column:
`voidStage`, `keySpot`, `lightShaft`, `container`, `markerLoop`, `leader` are `engine/kit.js`;
`world` (city, road, tower, traffic, route, map, globe, clouds) is `engine/world/`; `motion.js`
(counter, bigNumber, line, barRace, pie, waffle, scramble, redact) is `engine/motion.js`;
`parallax.js` archive photo is `engine/parallax.js` with public-domain photos (LoC, NARA,
Wikimedia PD); terrain from USGS 3DEP and imagery from NAIP or Sentinel-2 via
`engine/world/bake.py`; PBR materials from Poly Haven or ambientCG (CC0); figures from the
Quaternius UAL mannequin (CC0) with a matte material; "instanced" means `InstancedMesh` crowds
of one prop (cheap on llvmpipe). Cost tier: most options are T1–T2; anything with DOF racks
(REV-008, OBJ-006, CHR-018) or planet-scale oners (ONE-001/004/009/018, EST-017) is T3, so
budget it next to a T1 shot.

## Contents

- Money and monetary systems (22)
- Debt and credit (20)
- Markets and speculation (22)
- Business models and competitive strategy (22)
- Corporate power and governance (22)
- Fraud and financial crime (21)
- Surveillance and privacy (22)
- Data and information (22)
- AI and machine learning (26)
- Compute and digital infrastructure (23)
- Supply chain and trade (23)
- Geopolitics and state power (25)
- State, law and regulation (22)
- Secrecy and hidden information (20)
- Society, inequality and everyday economics (23)
- Risk, systems and failure (22)
- Time, growth and change (17)
- People, psychology and decisions (22)
- Crypto and fintech (16)
- Energy, resources and the environment (16)

**Total: 428 concepts.**

## Money and monetary systems

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 1 | **Inflation** | A loaf on a pedestal under a work light while the price tag beside it re-prints higher every beat; the loaf never changes `OBJ-005` | A stack of banknotes that visibly thins as the camera pulls back to show the same stack buying one grocery bag `OBJ-011` | A shopping cart rolling down a supermarket aisle, shelf labels ticking up as it passes `FOL-015` | voidStage + keySpot; bread and cart props (Poly Haven); motion.js counter on the tag |
| 2 | **Deflation** | The same price tag counting down while the shop windows go dark one by one `EST-020` | A factory floor where machines stop in sequence as a falling line chart rides above `DAT-007` | — | world city at dusk; motion.js line |
| 3 | **Hyperinflation** | A wheelbarrow of banknotes (Weimar 1923 archive photo) in 2.5D, notes blowing off `OBJ-003` | A $100-trillion note on black, the zeros annotated one by one in red `OBJ-016` | Banknotes falling like snow onto a street until they cover the cars `EST-020` | parallax.js archive photo (LoC/PD); kit markerLoop; instanced paper particles |
| 4 | **Interest rates** | A dial on a vault wall turned up one notch; every light in the city model dims slightly `OBJ-003` | A seesaw: rates on one end, house prices and stocks on the other `DAT-008` | — | voidStage dial prop; world city with emissive windows on a uniform |
| 5 | **Money printing / QE** | A printing press in darkness, then the reveal that it's a server rack and the notes are numbers on a screen `REV-017` | A ledger balance increasing with keystrokes, a single typing sound, no paper `OBJ-020` | A reservoir of liquid light filling the city's foundations `EST-005` | server rack set; motion.js counter + type.run sfx |
| 6 | **Central bank** | A single lit window in a monumental stone building at night, the city dark around it `EST-009` | A lone operator at a long table with one lever; the camera pulls out to show the lever is wired to the whole map `CHR-007` | — | world tower + stone textures (ambientCG); kit lightShaft |
| 7 | **Currency / fiat money** | A banknote dissolving into printed paper texture, then into a promise written on it in ink `OBJ-002` | An empty vault behind a banknote, revealed by a rack focus `REV-008` | — | macro banknote (PD design: historic notes); post.js DOF |
| 8 | **Devaluation** | The same banknote shrinking on the pedestal as a foreign note beside it grows `OBJ-022` | An exchange-rate board flipping digits in a dark airport hall `OBJ-020` | — | two-object pedestal; split-flap board (motion.js scramble) |
| 9 | **Reserve currency** | The globe at night with every trade route lit, all routes converging through one city `DAT-004` | Containers on a port stamped with the same currency sign `DAT-009` | — | world globe + route; container instancing |
| 10 | **Gold standard** | Gold bars in a vault lit by a single bulb, the camera pulling back to the queue of banknotes outside `OBJ-011` | A chain linking a banknote to a bar, then the chain cut `OBJ-005` | — | vault set; ambientCG gold metal PBR |
| 11 | **Liquidity** | A city's pipes seen in cross-section; water flowing until one valve closes and the far districts go dry `DAT-018` | Ice cubes (assets) vs a glass of water (cash): only one can pour `OBJ-022` | — | pipe network diorama; water shader |
| 12 | **Cash** | A single banknote on a dark desk, then the desk is empty and a card reader beeps `OBJ-005` | ATM in a dark street with its screen the only light `EST-020` | — | desk set; world street + emissive screen |
| 13 | **Savings eroding** | A glass jar of coins on a windowsill; time-lapse of daylight while the coins slowly fade `TRN-014` | A sandcastle labelled with a balance, the tide counter rising `END-002` | — | window set; time-lapse light rig |
| 14 | **Purchasing power** | One hand-sized coin buys a whole shelf (1970 tag); the same coin buys one item (2026 tag) `OBJ-022` | A ruler whose markings shrink while the object stays the same `OBJ-002` | — | two pedestals; motion.js counter |
| 15 | **Wage stagnation** | Two lines rising from the same point, one flattening; camera tracks along the gap as it widens `DAT-011` | A worker silhouette on a treadmill inside a giant price chart `CHR-013` | — | motion.js line; UAL mannequin (matte) |
| 16 | **Cost of living** | A receipt printing endlessly, unrolling across the floor and out of the door `OBJ-016` | A family's monthly budget as a waffle chart where squares turn red one by one `DAT-021` | — | receipt prop; motion.js waffle |
| 17 | **Taxation** | A stream of coins flowing from every rooftop into one building `DAT-018` | A slice cut from a cake under a work light; the knife is labelled with a rate `OBJ-001` | — | world city + flow lines; cake prop |
| 18 | **Tax haven** | A tiny island under bright tropical light, with a skyscraper of filing cabinets on it `EST-010` | A letterbox wall with ten thousand company names in one small building `OBJ-013` | A map where money lines leave every capital and converge on a dot in the sea `DAT-005` | world map + route; mailbox wall instanced |
| 19 | **Compound interest** | A single grain of rice on a chessboard; each square doubles until the pile fills the frame `DAT-006` | A snowball rolling down a hill growing to a boulder `FOL-004` | — | chessboard set (instanced grains); terrain hill |
| 20 | **Dividends / shareholder returns** | Cash conveyor from the factory roof straight into a vault, bypassing the workers below `ONE-024` | A pie whose slices shift toward one plate each year `DAT-019` | — | factory + conveyor; motion.js pie |
| 21 | **Monetary policy lag** | A pulled lever and a light that comes on 18 seconds later, the camera waiting in silence `END-002` | Dominoes in a long corridor, the first tipped, the last still standing `REV-019` | — | lever set; domino instancing |
| 22 | **Sovereign wealth fund** | A small country on the globe holding a thread to every major company tower `DAT-013` | A desert treasury: a vault door in the sand, a city of skyscrapers behind it `EST-007` | — | world globe + leader lines; desert terrain |

## Debt and credit

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 23 | **Debt** | A figure carrying a backpack that grows heavier, stooping more with each step `FOL-007` | A chain from an ankle to an anchor buried in the floor, revealed by a tilt-down `REV-005` | A tower of IOU notes holding up a real house; one note is pulled `OBJ-013` | UAL mannequin walk; chain prop; paper stack instanced |
| 24 | **Leverage** | A seesaw: a tiny coin on one end lifts a skyscraper on the other `DAT-008` | A crane lifting a building with a thread; the thread visibly thins `OBJ-012` | A tall stack of chips on a narrow plinth, camera orbiting low as it sways `OBJ-012` | diorama + tower; chip stack instanced |
| 25 | **Margin call** | A phone on a dark desk lighting up at 3 a.m., one notification `OBJ-018` | A balance bar draining into red while a clock ticks `DAT-021` | — | desk set; motion.js bigNumber + clock.tick sfx |
| 26 | **Default** | A door with a red notice nailed to it, lit by a streetlight `REV-019` | A bridge with a missing middle span, traffic stopping at the edge `EST-007` | — | street + door; world road with a gap |
| 27 | **Bankruptcy** | An office floor at night with lights switching off row by row toward the camera `END-005` | Auction tags on every desk and chair in an empty HQ `OBJ-006` | — | office set; emissive panel rows |
| 28 | **Credit score** | A three-digit number above a person's head that decides which doors open in a corridor `CHR-008` | A turnstile that reads a number and stays locked `OBJ-003` | — | corridor set; motion.js counter |
| 29 | **Mortgage** | A house on a pedestal with strings to a bank tower across the city `OBJ-011` | A key handed over, the camera pulls back to show 30 years of calendar pages stacked behind `REV-002` | — | house model; calendar pages instanced |
| 30 | **Subprime lending** | Houses built on sand on a beach; the tide arrives `EST-004` | A row of identical houses where the lights go out one after another down the street `EST-013` | — | coast terrain; suburban street (world) |
| 31 | **Securitisation** | Thousands of mortgage files fed into a machine and coming out as one sealed gold box `DAT-020` | Slicing a cake of many layers into identical boxes stamped AAA `OBJ-004` | — | machine diorama; box props |
| 32 | **CDO / tranches** | A waterfall pouring into a stack of glasses; only the top ones fill `DAT-008` | A building where water floods the basement floors first `DAT-012` | — | champagne tower; cutaway building |
| 33 | **Bond / yield** | A seesaw between a bond's price and its yield, tipping with each rate change `DAT-008` | A certificate under glass with a coupon being clipped by scissors `OBJ-002` | — | diorama; bond certificate (archive PD) |
| 34 | **Refinancing / rollover** | A juggler's hands (silhouette) keeping debts in the air; one more is added each beat `CHR-004` | A treadmill under a building; the building must run to stay in place `DAT-008` | — | silhouette rig; diorama |
| 35 | **Collateral** | A car parked inside a bank vault `REV-019` | A house with a padlock the size of its front door `OBJ-010` | — | vault + car (world vehicle); padlock prop |
| 36 | **Sovereign debt** | A country's outline on the map sinking into dark water as a counter rises `DAT-010` | Parliament building with a ledger as its roof `EST-009` | — | world map; ledger texture |
| 37 | **Debt spiral** | A spiral staircase descending into darkness; each step labelled with a payment `EST-023` | A drain swirl seen top-down as coins circle it `DAT-009` | — | staircase set; water vortex shader |
| 38 | **Student debt** | A graduation cap thrown in the air that never comes down, freeze-frame, a counter running `FOL-018` | Lecture-hall seats each with a price tag `EST-018` | — | cap prop; hall set |
| 39 | **Payday loans** | A neon "CASH NOW" sign in a dark strip mall, the only light for blocks `EST-020` | A small loan note that grows like a paper vine across the wall `OBJ-003` | — | strip-mall set; paper vine growth |
| 40 | **Private credit / shadow lending** | A second, darker bank building standing behind the bank, visible only when the camera crosses `REV-004` | Money flowing through pipes behind a wall, seen via a cutaway `DAT-012` | — | twin buildings; wall cutaway |
| 41 | **Debt ceiling** | A literal glass ceiling with a counter pressing up against it `DAT-017` | A thermometer near its top mark in a government hall `OBJ-003` | — | glass plane + bar; hall set |
| 42 | **National debt clock** | The real 1989 Times Square debt clock (archive) with digits spinning `OBJ-020` | A wall of digits that scrolls past the frame edges `DAT-021` | — | archive photo parallax; motion.js counter |

## Markets and speculation

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 43 | **Bubble** | A glass sphere floating over a city, growing as a price ticker rises, reflecting the skyline `OBJ-001` | Soap bubble macro with a stock chart refracted on its surface `OBJ-014` | A balloon tethered to a tower, the tether fraying `OBJ-012` | glass shader sphere; world city |
| 44 | **Collapse / crash** | A skyscraper of stacked blocks in the dark; one block slides and the camera holds while it falls `END-002` | A falling line chart extruded in 3D as a cliff the camera drops off `DAT-007` | A trading floor's screens turning red in a wave across the room `EST-018` | block stack physics (baked); motion.js line extrude; screens instanced |
| 45 | **Mania / speculative frenzy** | A crowd silhouette rushing through a narrow gate under a flashing price board `CHR-021` | A tulip (1637 tulipmania) on a pedestal priced like a house `OBJ-009` | — | crowd instancing (matte); tulip prop + archive print |
| 46 | **Short selling** | A figure leaning on a building, betting it will fall; the building wobbles `CHR-006` | A downward arrow made of borrowed shares stacked from another vault `DAT-008` | — | tower + silhouette; diorama |
| 47 | **Short squeeze** | A spring compressed under a weight, then released, launching the weight off frame `OBJ-012` | A door crowded with people trying to exit at once `CHR-021` | — | spring prop; crowd |
| 48 | **Volatility** | A seismograph needle scribbling across paper in darkness `OBJ-002` | A boat on a storm sea, camera on the boat's horizon `FOL-010` | — | seismograph prop; ocean shader |
| 49 | **Market cap** | A company as a tower; the camera rises along it past countries' GDP marks on the side `EST-012` | A coin stack beside a mountain, both the same height `OBJ-022` | — | tower with labels; terrain |
| 50 | **IPO** | A bell on a podium in a dark hall, the strike starting a ticker `OBJ-003` | A private building whose walls turn to glass so the crowd can see in `REV-010` | — | NYSE-style bell (generic); glass shader |
| 51 | **SPAC / blank-check company** | An empty glass box on a pedestal with a price tag; something is promised to go inside `OBJ-009` | A shell with nothing inside, cracked open on a table `OBJ-017` | — | glass box; shell prop |
| 52 | **Valuation** | A price tag hanging on a cloud `OBJ-005` | Two appraisers' tags on the same object, wildly different numbers `OBJ-022` | — | cloud volume; tags |
| 53 | **P/E multiple / overvaluation** | A building whose shadow is 50 times taller than it is `EST-012` | A small earnings coin carrying a vast price balloon `OBJ-011` | — | long-shadow golden-hour light; balloon |
| 54 | **Index funds / passive investing** | A river carrying every company boat downstream, nobody steering `FOL-004` | One shopping cart containing the whole stock market `OBJ-011` | — | river terrain + boats; cart |
| 55 | **High-frequency trading** | Two light pulses racing along fibre between cities; one wins by a hair `DAT-018` | A straight microwave tower line cutting across fields between Chicago and New Jersey `FOL-013` | — | world map + route glow; tower line on terrain |
| 56 | **Dark pool** | A pool of black water in a trading hall where trades disappear below the surface `OBJ-017` | Unlit trading floor where only hands are visible on keyboards `CHR-004` | — | water shader; low-key office |
| 57 | **Insider trading** | A phone call between two lit windows in different towers at night `REV-014` | A sealed envelope passed under a table; a chart jumps the next morning `OBJ-006` | — | twin towers; desk set |
| 58 | **Pump and dump** | A balloon pumped by a crowd, then a few hands release their strings at the top `OBJ-012` | A price chart shaped like a mountain with a cable car leaving from the peak `DAT-007` | — | balloon; line extrude |
| 59 | **Meme stock** | A thousand phone screens lighting up in a dark stadium, all showing the same ticker `EST-015` | A David vs Goliath silhouette: a small figure facing a hedge-fund tower `CHR-002` | — | stadium + instanced phones; tower |
| 60 | **Arbitrage** | The same object bought in one lit shop and sold across the street in another for more `OBJ-021` | Two clocks showing different prices; a hand moves a coin between them `OBJ-022` | — | street set; two pedestals |
| 61 | **Liquidity crisis / bank run** | A queue outside a bank at dawn, growing around the block (time-lapse) `TRN-014` | Bank vault door closing slowly as hands reach toward it `OBJ-010` | — | street + queue instancing; vault |
| 62 | **Market maker** | A figure at a crossroads directing two streams of traffic so neither stops `EST-005` | A bridge whose toll booth takes a coin from both directions `FOL-009` | — | world road junction; toll booth |
| 63 | **Options / derivatives** | A shadow of a building that moves independently of the building `REV-014` | Bets placed on a horse race where the horses are company towers `DAT-011` | — | golden-hour shadow; racetrack diorama |
| 64 | **Black Monday / circuit breakers** | A huge breaker switch in a power room thrown, every screen in the city freezing `OBJ-012` | A freeze-frame of a falling glass of water mid-air `FOL-018` | — | power room; liquid freeze |

## Business models and competitive strategy

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 65 | **Monopoly** | A single bridge into a walled city; every road on the map funnels to it `DAT-005` | A board-game board where every property has the same colour `OBJ-004` | One tower casting shadow over a city of small shops `EST-001` | world map + route; board prop; tower shadow |
| 66 | **Oligopoly** | Three towers on a skyline that block the sun from everything else `EST-001` | Three hands around one table dividing a pie `DAT-019` | — | skyline; pie |
| 67 | **Network effects** | Dots on a dark globe connecting one at a time; lines multiply faster than dots `DAT-004` | One phone, then two phones with a line, then a lattice filling the frame `OBJ-011` | A city whose roads appear as each new house is built `DAT-015` | globe + instanced arcs; phone props; city grow |
| 68 | **Moat** | A castle-like HQ with a water moat on the map; competitors' boats sink in it `EST-010` | A ring of fire around a pedestal object `OBJ-001` | — | tower + water ring; fire sprite |
| 69 | **Lock-in / switching costs** | A door that closes behind the viewer and has no handle on the inside `REV-019` | A chain of tiny cables tying a phone to a dozen devices `OBJ-014` | — | door set; cable props |
| 70 | **Platform / gatekeeper** | A toll gate on the only road out of town, every car stopping to pay `FOL-009` | A store where the landlord takes a coin from every sale through a slot in the counter `OBJ-006` | — | world road + gate; shop set |
| 71 | **Two-sided marketplace** | A bridge with traffic flowing both ways and a toll booth in the middle `EST-005` | Two crowds on two sides of a glass wall, a single door between them `CHR-014` | — | road bridge; glass wall |
| 72 | **Subscription model** | A tap dripping coins from a wallet into a bucket, every month a calendar page flips `OBJ-003` | A lock that clicks shut on the 1st of every month `OBJ-005` | — | tap + coins; calendar |
| 73 | **Freemium** | A free door into a building where every inner door has a coin slot `FOL-005` | A free sample tray in a supermarket aisle leading to a checkout `FOL-019` | — | corridor set; supermarket aisle |
| 74 | **Razor and blades** | A cheap razor on a pedestal, the camera pulls back to reveal a mountain of blade cartridges `OBJ-011` | A cheap printer and a vault of ink cartridges `REV-002` | — | pedestal + instanced cartridges |
| 75 | **Vertical integration** | A single conveyor that runs from a mine, through a factory, to a shop, owned by one logo `ONE-013` | A tower whose floors are labelled mine, factory, ship, store `EST-011` | — | world route + factory; tower labels |
| 76 | **Horizontal integration / roll-up** | Shop signs on a street being replaced one by one with the same sign `EST-013` | Pac-Man-style: one block on a map absorbing its neighbours `DAT-015` | — | street set; isometric map |
| 77 | **Economies of scale** | One cup of coffee costing a dollar vs a factory pouring a million cups at a cent `OBJ-022` | A small workshop beside a vast plant, the camera pulling back to show the gap `OBJ-011` | — | props + factory |
| 78 | **Loss leader** | A free item on a pedestal at the store entrance; the camera follows the customer to the till `FOL-022` | A cheap hot dog under a spotlight in a warehouse store's vast aisle `OBJ-001` | — | store set |
| 79 | **Cash burn** | A furnace fed with banknotes in a dark boiler room `OBJ-003` | A candle labelled with months of runway, burning down `END-014` | — | furnace glow; candle |
| 80 | **Runway** | An aircraft accelerating down a runway that ends at a cliff `FOL-002` | A runway lit by lights that turn off from the far end toward the plane `EST-014` | — | world runway; edge lights |
| 81 | **Unit economics** | One delivered parcel on a pedestal with its cost broken into floating labels `DAT-020` | A tiny cart that loses one coin per trip, multiplied by a million trips `DAT-009` | — | exploded parcel; instanced carts |
| 82 | **Flywheel** | A heavy stone wheel in darkness turning faster with each push `OBJ-001` | A loop of conveyor belts feeding one another around a warehouse `DAT-018` | — | stone wheel; conveyor loop |
| 83 | **Disruption** | A small glowing cart slipping between giant stationary trucks on a highway `FOL-014` | A new road bypassing a walled town, traffic draining away from the old gate `DAT-002` | — | world highway; terrain map |
| 84 | **Winner-take-all** | A podium with only one step `OBJ-009` | A race where the finish line moves to wherever the leader is `FOL-002` | — | podium; track |
| 85 | **Moat erosion** | A sandcastle wall slowly eaten by a rising tide, time-lapse `TRN-014` | A castle drawbridge rusting open `REV-019` | — | sand + tide; drawbridge |
| 86 | **Platform decay ("enshittification")** | A clean shop window that fills with ads and stickers until the product is hidden `END-002` | A park that grows toll gates every few metres over time `TRN-014` | — | shopfront set; gates instanced |

## Corporate power and governance

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 87 | **Conglomerate** | One logo on every building in a city, revealed by a crane-up at dusk `EST-002` | A tree whose branches each end in a different company's product `DAT-008` | — | world city with emissive signs; tree diorama |
| 88 | **Shell company** | A mailbox on a wall with a company name and nothing behind the wall `REV-003` | Russian dolls on a desk, each opened to reveal a smaller one; the last is empty `OBJ-017` | A building facade propped up from behind like a film set `REV-011` | mailbox wall; nesting doll props; facade set |
| 89 | **Holding company / ownership web** | An org chart extruded in 3D, the camera flying through layers to the one name at the top `DAT-012` | Strings from a single hand running down to dozens of puppets (logos) `REV-022` | — | stacked planes; leader lines |
| 90 | **Board of directors** | A long table in darkness with one lit chair at the head `EST-009` | Twelve chairs, eleven empty, one occupied by a silhouette, top-down `REV-020` | — | boardroom set; keySpot |
| 91 | **Activist investor** | A small figure walking into a boardroom and every head turning `FOL-005` | A crowbar levered under a company tower `OBJ-012` | — | boardroom; crowbar prop |
| 92 | **Private equity** | A building bought, emptied of furniture and resold, time-lapse `TRN-014` | A buyout chain: the company carries the loan used to buy it on its own back `DAT-008` | — | office set; diorama |
| 93 | **Leveraged buyout** | A house bought with a mortgage the house itself must pay, the bill taped to its front door `OBJ-003` | A ship loaded with containers until the waterline goes under `OBJ-012` | — | house model; ship + water |
| 94 | **Asset stripping** | Copper pipes and wiring removed from a factory wall by unseen hands, the lights flickering `OBJ-002` | A car on blocks with its wheels gone, under a streetlight `EST-020` | — | factory wall; car on blocks |
| 95 | **Lobbying** | A corridor of doors in a capitol building; one figure has a key to all of them `FOL-008` | Envelopes sliding under doors along a hallway `FOL-013` | — | corridor; envelope props |
| 96 | **Regulatory capture** | A referee in the jersey of one team `CHR-006` | A guard dog asleep on a leash held by the burglar `OBJ-005` | — | silhouette; dog prop (matte) |
| 97 | **Revolving door** | A literal revolving door between a government building and a company tower, the same silhouette passing through repeatedly `FOL-015` | Name badges swapping on the same lanyard `OBJ-014` | — | revolving door set; badge props |
| 98 | **Golden parachute** | A parachute of gold foil opening above a falling figure while the building behind collapses `FOL-018` | A severance cheque on a desk in an emptied office `OBJ-005` | — | cloth sim baked; office |
| 99 | **Dual-class shares / founder control** | A vote counter where one hand's ballot weighs ten times the others `DAT-017` | A throne in an otherwise ordinary boardroom `REV-016` | — | ballot scale; boardroom |
| 100 | **Stock buybacks** | A company eating its own tail: a tower crane lifting floors off the top of its own tower `EST-012` | Shares vacuumed back into the company vault `DAT-018` | — | tower; flow line |
| 101 | **Layoffs** | Desks in an open-plan office going dark one by one from the far wall `END-005` | A parking lot emptying in fast time-lapse `TRN-014` | — | office set; world parking lot |
| 102 | **Outsourcing / offshoring** | A factory floor lifting off its foundations and flying across the globe to land elsewhere `ONE-028` | A cardboard box shipped across the map back to the same street it left `ONE-013` | — | globe hop; route |
| 103 | **Union busting** | A circle of linked hands, one link cut by a corporate letter `CHR-014` | Meeting-room chairs removed one by one `OBJ-006` | — | silhouettes; chairs |
| 104 | **Merger / acquisition** | Two company towers on a skyline merging into one taller tower `TRN-011` | Two logos on a map, one swallowing the other `DAT-015` | — | towers; isometric map |
| 105 | **Founder myth / garage story** | A garage door opening on a single lamp and a workbench, camera pull-back reveals a campus behind it `REV-002` | A business card that becomes a skyscraper `ONE-012` | — | garage set; card-to-tower |
| 106 | **Corporate HQ as fortress** | A glass ring building seen from orbit, then the camera descends to its single security gate `EST-017` | The perimeter fence followed in a long track `FOL-013` | — | world tower + globe; fence |
| 107 | **Too-big-to-manage** | A control room where every screen shows a different unwatched crisis `CHR-006` | A ship's wheel connected by a long rope to a distant rudder `DAT-008` | — | control room; ship diorama |
| 108 | **Corporate culture / cult of the company** | Rows of identical desks with identical silhouettes all lit by the same screens `REV-020` | Branded badges hung on a wall like trophies `OBJ-013` | — | office instancing; badge wall |

## Fraud and financial crime

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 109 | **Fraud** | A beautiful product on a pedestal; the camera orbits behind to show it's a painted cardboard front `REV-001` | A lab machine whose cover is lifted to reveal off-the-shelf parts `REV-016` | A trophy cabinet full of awards beside an empty factory `REV-008` | cardboard facade prop; machine cutaway |
| 110 | **Ponzi scheme** | A pyramid of champagne glasses where only the bottom row is ever added, the top always full `DAT-008` | A queue of new investors whose money is handed straight to the people at the front `FOL-004` | — | glass pyramid; queue instancing |
| 111 | **Embezzlement** | A tiny trickle of coins diverted through a crack in a vault wall into a private pocket `OBJ-002` | A ledger page where one column is in a slightly different ink `OBJ-016` | — | vault wall; ledger macro |
| 112 | **Money laundering** | Dirty banknotes entering one end of a laundromat and clean ones leaving the other `DAT-018` | A suitcase passing through three shell offices on three continents on the map `DAT-005` | Banknotes changing colour as they pass through a casino's chip cage `OBJ-002` | laundromat set; route; chip cage |
| 113 | **Accounting fraud / cooking the books** | Two ledgers on a desk, one under the lamp and one in the drawer `OBJ-006` | A balance sheet with a number that rubs off under a fingertip `OBJ-003` | — | desk; ledger |
| 114 | **Whistleblower** | A single lit window in a dark office tower at 2 a.m. `EST-021` | A USB stick on a table under a work light `OBJ-001` | A silhouette at a payphone at night `CHR-016` | world tower; USB prop |
| 115 | **Cover-up** | A rug with a bulge, the camera pushing in slowly `OBJ-003` | A document shredder fed page after page in the dark `OBJ-018` | Paint rolled over writing on a wall, the writing faintly showing through `OBJ-002` | rug; shredder; wall |
| 116 | **Bribery / kickback** | An envelope passed under a table in a restaurant booth `CHR-014` | A briefcase on a hotel bed, lid opening toward camera `OBJ-017` | — | restaurant booth; hotel room |
| 117 | **Cartel price-fixing** | Three petrol stations on three corners raising their sign prices in sync `EST-005` | Hands clasped above a map in a dim room `OBJ-004` | — | world junction; table map |
| 118 | **Sanctions evasion** | A tanker on the map that switches its transponder off and vanishes from the screen `DAT-014` | Ship-to-ship transfer at night, two hulls touching under a single floodlight `EST-020` | — | world map + AIS dots; ships |
| 119 | **Smuggling** | A container door opened to reveal a false wall `OBJ-010` | A route on the map that zigzags through three ports to avoid one `DAT-005` | — | container interior; route |
| 120 | **Ransomware** | Every screen in a hospital corridor turning to the same red lock screen `FOL-005` | A padlock appearing over a city map's lights, district by district `DAT-010` | — | corridor screens; map |
| 121 | **Identity theft** | A face in a mirror that doesn't move with the person `REV-011` | A passport photo replaced with a blank silhouette `OBJ-007` | — | mirror set; passport prop |
| 122 | **Phishing** | A fishing hook baited with an email notification `OBJ-001` | A forged bank website as a building facade with the wrong door `REV-011` | — | hook prop; facade |
| 123 | **Scam call centre** | Hundreds of headsets on desks in a dark compound, a top-down reveal `REV-020` | A phone ringing in a quiet living room, an elderly silhouette reaching for it `CHR-003` | — | compound set; living room |
| 124 | **Fake reviews** | A wall of five-star stickers on a closed shop `OBJ-013` | A crowd of identical cardboard figures applauding `CHR-021` | — | shopfront; cutout instancing |
| 125 | **Wash trading** | A trader buying from himself across a mirror `CHR-006` | Two hands passing the same coin back and forth while a volume counter climbs `OBJ-022` | — | mirror set; coin |
| 126 | **Rug pull** | A rug pulled from under a crowd on a stage, the crowd frozen mid-fall `FOL-018` | A bridge over a canyon whose planks vanish as the last walker steps on `REV-006` | — | stage; canyon terrain |
| 127 | **Pig butchering scam** | A chat window's warm glow on a face in a dark room, the camera revealing a compound of desks behind the other screen `ONE-006` | A piggy bank on a table being slowly filled while a cleaver waits in shadow `OBJ-003` | — | screen push; table |
| 128 | **Fraud discovery / short-seller report** | A single sheet of paper pinned to a giant company tower, read by a crowd `EST-012` | A magnifying glass passing over a chart, a red loop on a gap `OBJ-016` | — | tower; chart print |
| 129 | **Audit** | A torch beam sweeping shelves of archive boxes in a dark warehouse `FOL-005` | A red pen running down a column of numbers `OBJ-016` | — | archive warehouse; ledger |

## Surveillance and privacy

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 130 | **Surveillance** | A city at night where every lit window is also a camera lens `EST-001` | A single eye reflected in a phone screen, pull back to a wall of such phones `OBJ-011` | A streetlamp whose light cone follows the walker `FOL-005` | world city; phone wall instanced; moving keySpot |
| 131 | **Mass surveillance** | A god's-eye view of a crowd where every figure is tagged with a floating ID `CHR-021` | A vast server hall seen from one end, the far end lost in haze `EST-022` | — | crowd + labels (motion.js); server hall |
| 132 | **Data broker** | A warehouse aisle of filing boxes each labelled with a person's name `FOL-019` | A person's silhouette printed onto a barcode, scanned at a checkout `OBJ-008` | An auction hall where the lots are glowing personal files `EST-018` | archive aisle; barcode; hall |
| 133 | **Tracking cookies / web tracking** | Footprints of light following a walker through a city, every step logged `FOL-004` | Breadcrumbs dropped behind a cursor that a hand gathers up `OBJ-002` | — | light trail; desk |
| 134 | **Location data** | A phone on a nightstand drawing its owner's week as glowing lines on a city map `ONE-006` | A map heat-trail of one phone's year, revealed by a pull-back `DAT-010` | — | screen push; map lines |
| 135 | **Facial recognition** | A crowd frozen as boxes snap onto every face, one turning red `CHR-021` | A face-shaped point cloud on a pedestal `OBJ-001` | — | crowd + box overlay; point cloud (never a realistic CG face) |
| 136 | **Metadata** | An envelope whose contents are blacked out but the address, date and stamp are lit and annotated `OBJ-016` | A phone bill with only times and numbers, lines drawn between them to form a network `DAT-008` | — | envelope; bill print |
| 137 | **Encryption** | A letter fed into a machine and emerging as noise, then a key turning it back `DAT-020` | A safe inside a safe inside a safe `OBJ-017` | — | Enigma-style generic machine; nested safes |
| 138 | **Backdoor** | A house with a front door full of locks and an unlocked door at the back, the camera circling around `REV-001` | A secret panel in a server rack `OBJ-013` | — | house model; rack |
| 139 | **Wiretap** | A copper line on a pole with a clip attached, under sodium light `OBJ-003` | Headphones on a desk in a van, a cable running into the dark `OBJ-020` | — | pole prop; van interior |
| 140 | **Panopticon** | A circular prison with a central tower, the camera rising to look down from the tower `REV-013` | A ring of lit windows all facing one dark window `EST-006` | — | panopticon set (Bentham plan, PD); tower |
| 141 | **Social credit / scoring** | A city where a number floats over every head and doors open only for some `CHR-021` | A train ticket barrier that stays shut for one figure `OBJ-005` | — | crowd + labels; barrier |
| 142 | **Predictive policing** | A map with red dots appearing before the events happen, a clock running backwards `DAT-001` | A patrol car route drawn by an algorithm on a city grid `FOL-017` | — | map; route |
| 143 | **Biometrics** | A fingerprint pressed on glass, then the print becomes a maze the camera flies into `ONE-022` | An iris macro dissolving into a database grid `ONE-007` | — | glass macro; eye-to-world (stylised) |
| 144 | **Spyware** | A phone on a table whose camera light flickers on by itself `OBJ-018` | A silhouette in a dark room seeing a phone's screen mirrored on a far wall `CHR-016` | — | phone; projection |
| 145 | **OSINT / open-source intelligence** | A satellite image zooming onto a shadow, the shadow's length annotated to give the time `DAT-014` | Photos on a desk linked with red string to a map `OBJ-004` | — | Sentinel/NAIP imagery; evidence desk |
| 146 | **CCTV** | A wall of monitors in a security room, one monitor pushed into `ONE-006` | A grainy top-down camera angle with a timestamp overlay `EST-021` | — | monitor wall; post grain |
| 147 | **Data breach** | A vault door blown open with paper files fluttering out into the street `OBJ-010` | A dam cracking, water made of text `EST-007` | — | vault; dam with text particles |
| 148 | **Anonymity** | A crowd of identical grey silhouettes; one is quietly lit `CHR-021` | A masked figure walking through a lit city, never fully seen `FOL-007` | — | crowd; walker |
| 149 | **Deanonymisation** | Five innocuous facts on cards that slide together to form one face silhouette `DAT-020` | A mask on a table pulled apart into puzzle pieces, each piece labelled `OBJ-004` | — | cards; puzzle prop |
| 150 | **Satellite surveillance** | A satellite in orbit tilting its lens toward a city `ONE-025` | Two satellite images of the same site a week apart, a dissolve showing new trucks `DAT-014` | — | globe + satellite; imagery |
| 151 | **Your phone as tracker** | A phone in a pocket seen as a beacon on a dark map, pulsing each time it connects `DAT-001` | A glowing thread connecting the phone to towers as the walker moves `FOL-011` | — | map + pulse; tower line |

## Data and information

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 152 | **Data** | A grain of sand on a pedestal; the camera pulls out to reveal a desert of identical grains `OBJ-011` | A river of glowing particles flowing between buildings `DAT-018` | A library whose shelves extend past the horizon `EST-022` | sand instancing; particle flow; library set |
| 153 | **Big data** | A warehouse of hard drives under fluorescent light, receding into haze `EST-022` | A single spreadsheet cell expanding until it's the size of a city block `ONE-012` | — | drive rack instancing; cell grow |
| 154 | **Database** | A vast filing cabinet the camera flies down between drawers `DAT-012` | A card index (1950s archive photo) dissolving into server racks `TRN-011` | — | cabinet set; archive photo |
| 155 | **Algorithm** | A sorting machine in a dark factory dropping objects into bins `DAT-008` | A recipe card read by a robot arm `OBJ-002` | — | sorter diorama; card |
| 156 | **Recommendation engine** | A conveyor that delivers the next object before the viewer finishes the last `FOL-004` | A corridor of doors where each door opens to a slightly more extreme room `FOL-008` | — | conveyor; corridor |
| 157 | **Ranking / search** | A podium of results where only the top three are lit and the rest fade into the dark `REV-002` | A ladder where nobody below rung ten is visible `EST-012` | — | podium; ladder |
| 158 | **Index (search)** | A giant card catalogue with a single card pulled out under a lamp `OBJ-003` | A map of the web as a city, one road lit `DAT-015` | — | card catalogue; city map |
| 159 | **Attention economy** | An hourglass whose sand is eyes `OBJ-001` | A slot machine whose reels show app icons `OBJ-012` | Rows of people at screens lit blue in a dark stadium `EST-015` | hourglass; slot machine; stadium |
| 160 | **Engagement optimisation** | A dial labelled "outrage" turned up a notch while a counter climbs `OBJ-003` | A lab rat lever press, then the lever is a phone `TRN-011` | — | dial; Skinner-box generic set |
| 161 | **Filter bubble / echo chamber** | A figure inside a glass dome whose curved walls reflect only themselves `CHR-005` | Two domes side by side, neither can see out `OBJ-022` | — | glass dome; mirror shader |
| 162 | **Virality** | A single domino that tips a field of dominoes spreading outward, top-down `REV-020` | A spark on a map that becomes a wildfire of lit nodes `DAT-004` | — | domino field; globe arcs |
| 163 | **Misinformation** | A photo passed hand to hand, changing slightly each time `OBJ-007` | A newspaper whose headline rewrites itself under the camera `OBJ-016` | — | photo props; motion.js scramble |
| 164 | **Deepfake** | A familiar silhouette on a screen whose shadow on the wall moves out of sync `REV-008` | A face-shaped mask on a stand, a projector lighting it `OBJ-001` | — | screen + shadow; mask projection (stylised, no realistic CG face) |
| 165 | **Propaganda** | A loudspeaker on a pole over an empty square `EST-020` | Posters multiplying on a wall until they overlap `TRN-014` | — | square; poster instancing |
| 166 | **Censorship** | A sentence on a page blacked out line by line `OBJ-016` | A searchlight sweeping and dimming every lit window it passes `EST-021` | — | motion.js redact; city |
| 167 | **Content moderation** | Rows of workers in a dark room each facing one screen of horrors, shot from behind `EST-018` | A filter screen catching debris from a river `DAT-018` | — | office; river |
| 168 | **Information overload** | A room filling with paper from every vent until the figure is buried `CHR-013` | Thousands of notifications falling like snow `EST-020` | — | paper particles; snow |
| 169 | **Signal vs noise** | A single clear tone among static, visualised as one bright line in a field of grey ones `DAT-021` | A radio telescope listening to a noisy sky `EST-012` | — | line field; dish prop |
| 170 | **Data as oil** | A refinery whose pipes carry light instead of oil `EST-010` | A barrel stamped with a user count `OBJ-005` | — | refinery set; barrel |
| 171 | **Data exhaust** | Footprints in fresh snow behind a walker; someone collecting them `FOL-020` | Car exhaust that turns into binary `FOL-014` | — | snow terrain; car |
| 172 | **Personal data value** | A person's silhouette on a scale balanced by a few coins `OBJ-022` | A price tag hung on a family photo `OBJ-005` | — | scale; photo |
| 173 | **Archive / memory of the internet** | The Wayback Machine as an endless corridor of shelves with dated labels `FOL-019` | A burnt book on a desk beside a server `OBJ-022` | — | corridor; desk |

## AI and machine learning

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 174 | **AI training** | A child's handwriting book being read by a machine at enormous speed, pages blurring `OBJ-002` | A sculpture emerging from a block of marble under thousands of tiny taps (each a gradient step) `END-010` | A vast library being poured into a funnel above a single glowing cube `DAT-018` | book macro; marble block; library + funnel |
| 175 | **Neural network** | A city at night seen from above where lights fire in waves along streets `EST-005` | Strings between pins on a board, vibrating as a signal passes `DAT-008` | — | world city emissive pulse; pin board |
| 176 | **Parameters / weights** | A mixing desk with billions of faders receding into haze, one being nudged `EST-022` | A wall of dials in a dark hall, each fractionally turned `OBJ-013` | — | fader instancing; dial wall |
| 177 | **Training data** | Every book, photo and web page as layers of sediment, the camera descending through them `DAT-012` | A trawler net dragging across an ocean of text `FOL-004` | — | layers; net + text sea |
| 178 | **Scraping** | A vacuum hose moving over a city's rooftops pulling up glowing text `FOL-023` | A net scooping fish made of words `OBJ-012` | — | city + hose; net |
| 179 | **Copyright and AI** | A painting on an easel being photographed by a thousand cameras at once `OBJ-001` | A library book with a barcode that leads to a server farm `ONE-022` | — | easel + camera instancing; book |
| 180 | **Compute** | A power station whose output cables run straight into a single box on a pedestal `ONE-012` | A stopwatch beside a stack of GPUs; the stack doubles each lap `DAT-006` | A room of identical server racks lit by indicator LEDs, top-down `REV-020` | substation + box; GPU stack; rack instancing |
| 181 | **GPU** | One chip on a pedestal under a work light, macro slide across its die `OBJ-002` | A shipping pallet of chips under guard in an airport cargo hold `OBJ-010` | — | chip model; cargo set |
| 182 | **Inference cost** | A meter spinning on a wall every time a chat bubble appears `OBJ-020` | A taxi meter running on a laptop `OBJ-005` | — | meter prop; laptop |
| 183 | **Scaling laws** | A staircase where each step is ten times taller than the last, the figure climbing `EST-012` | Log-scale chart extruded into a mountain range `DAT-007` | — | staircase; chart extrude |
| 184 | **Emergent abilities** | A pile of sand grains that suddenly forms a castle `DAT-009` | Lights in a city grid that suddenly spell a word `REV-020` | — | sand; city |
| 185 | **Hallucination** | A confident tour guide (silhouette) pointing at a building that isn't there `CHR-006` | A map with a road that ends in fog `DAT-002` | — | silhouette; map + fog |
| 186 | **Alignment** | A powerful horse with reins held by a small rider `FOL-010` | A ship's rudder vs a vast hull `DAT-008` | — | horse silhouette; ship |
| 187 | **Black box** | A sealed black cube on a pedestal; light goes in and a label comes out `OBJ-001` | A flight recorder (literal black box) in debris `OBJ-012` | — | cube; debris set |
| 188 | **Benchmarks / evals** | A high-jump bar raised notch by notch until it vanishes above the frame `EST-012` | Exam papers on a desk graded by a machine `OBJ-016` | — | bar; desk |
| 189 | **Fine-tuning / RLHF** | A sculptor's hands making tiny changes to a finished statue `OBJ-014` | Thumbs-up and thumbs-down cards sorted by thousands of hands `REV-020` | — | statue; card instancing |
| 190 | **Tokens** | A sentence cut into tiles that slide into slots `DAT-020` | A typewriter whose keys are word fragments `OBJ-002` | — | tiles; typewriter |
| 191 | **Context window** | A desk lamp's circle of light; only what's inside it can be read `OBJ-004` | A train window passing a long text, only one carriage-length visible `FOL-002` | — | lamp pool; train |
| 192 | **AI agents** | A cursor moving by itself across a dark desktop, clicking `OBJ-020` | A robot hand opening doors down a corridor alone `FOL-005` | — | screen; corridor |
| 193 | **Automation / job loss** | A factory floor where workers' silhouettes fade as robot arms appear in their places `TRN-014` | An office chair rolling empty past a glowing screen `END-002` | — | factory; office |
| 194 | **AGI race** | Two rockets on two pads under floodlights, countdown on both `OBJ-022` | Runners on a track that ends at a cliff edge in fog `FOL-002` | — | pads; track |
| 195 | **Open vs closed weights** | A recipe card posted on a public wall vs a recipe locked in a safe `OBJ-022` | A glass house next to a windowless vault `EST-010` | — | props; buildings |
| 196 | **Model collapse** | A photocopy of a photocopy of a photocopy, degrading frame by frame `OBJ-007` | A snake eating its tail `OBJ-001` | — | copy sequence; ouroboros prop |
| 197 | **AI safety / kill switch** | A big red switch on a wall in an empty control room, the camera creeping toward it `OBJ-018` | A dam's spillway gate, half open `EST-012` | — | control room; dam |
| 198 | **Synthetic data** | A hall of mirrors reflecting one object into thousands `REV-004` | A factory producing photographs `DAT-018` | — | mirror hall; conveyor |
| 199 | **Chatbot as interface** | A single blinking cursor in a dark void, the whole internet behind it `OBJ-020` | A receptionist's desk in an empty skyscraper lobby `EST-018` | — | screen; lobby |

## Compute and digital infrastructure

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 200 | **Data centre** | A windowless box in a cornfield at night, its only light a red aviation lamp, then a descent to its loading dock `ONE-001` | A long aisle of racks lit by blinking LEDs, a slow push with haze `FOL-008` | A top-down of the roof's cooling units as an endless grid `REV-020` | world rural + box building (NAIP farmland); rack aisle; roof instancing |
| 201 | **The cloud** | A cloud in the sky, then the camera dives through it to find a warehouse beneath `ONE-001` | A data centre's shadow cast on actual clouds `EST-014` | — | world clouds + building; cloud volume |
| 202 | **Energy demand of AI** | A city's lights dimming as a single building on the edge brightens `EST-021` | Power lines on the map all bending toward one site `DAT-005` | A meter on a substation wall spinning faster and faster `OBJ-003` | world city; map routes; substation prop |
| 203 | **Cooling and water use** | A river on the map with a pipe diverting it into a building; the river thins downstream `DAT-002` | Steam rising from cooling towers in a dawn shot `EST-004` | A glass of water on a server rack `OBJ-005` | terrain + river; cooling towers; rack |
| 204 | **Semiconductors / chips** | A wafer reflecting the work light, macro slide across its dies `OBJ-002` | A chip pulled back to reveal it's sitting on a fingertip-size map of a city `ONE-012` | — | wafer model; chip-to-city |
| 205 | **Lithography (EUV)** | A beam of light bouncing between mirrors in a dark machine, the camera following the beam `DAT-018` | A single machine the size of a bus being loaded into three planes `EST-010` | — | mirror path; cargo aircraft |
| 206 | **Chip fab** | A clean room in amber light, figures in bunny suits as silhouettes `EST-018` | A fab seen from the air beside a tiny town, scale comparison `EST-003` | — | clean room set; world industrial |
| 207 | **Moore's law** | A staircase of chips shrinking with each step until they vanish `DAT-006` | A city whose buildings halve in size every shot while the number of them doubles `DAT-015` | — | chips; isometric city |
| 208 | **Export controls / chip war** | A border checkpoint with a single crate of chips stopped under a floodlight `OBJ-010` | A map with a wall rising between two countries made of chip packages `DAT-002` | — | checkpoint; map wall |
| 209 | **Undersea cables** | A cable on the sea floor lit by a submersible's light, the camera following it into dark water `FOL-013` | A globe with glowing lines under the oceans `DAT-004` | — | seabed terrain + cable; globe lines |
| 210 | **Latency** | Two cities on the map with a light pulse racing between them, a stopwatch below `DAT-013` | A trader's hand hovering over a key while the pulse arrives `OBJ-018` | — | map pulse; desk |
| 211 | **Bandwidth** | A highway that widens and narrows; traffic jams at the narrow point `FOL-004` | A pipe's cross-section with light squeezing through `DAT-018` | — | world road; pipe |
| 212 | **Servers** | A single server pulled out of a rack, lid open, macro on the components `OBJ-013` | A server room's door opening onto a cold blue light `REV-019` | — | rack; door |
| 213 | **Power grid** | A transmission tower line marching across a valley at dusk `FOL-013` | A grid map where districts light up and black out in sequence `DAT-010` | — | terrain + pylons; map |
| 214 | **Nuclear power for AI** | A cooling tower beside a data centre, both under the same sodium light `EST-010` | A cable leaving a reactor and running straight to a server hall `ONE-002` | — | industrial set; route |
| 215 | **Rare earths / minerals** | An open-pit mine terrace seen from above, a single truck crawling up it `EST-005` | A phone dissolved into its elements, each floating to the mine it came from on the map `DAT-020` | — | mine terrain (3DEP); exploded phone |
| 216 | **Transistor** | A light switch the size of a cathedral door, then shrinking to a speck `OBJ-011` | A gate in a field that opens and closes a stream of light `DAT-018` | — | switch prop; gate |
| 217 | **Bottleneck** | A ten-lane highway funnelling into a one-lane bridge `DAT-002` | Sand pouring through the narrow neck of an hourglass labelled with one company's name `OBJ-001` | — | road; hourglass |
| 218 | **Satellite internet / constellations** | A string of lights crossing the night sky like a train `EST-014` | The globe wrapped in thousands of tiny moving dots `ONE-005` | — | night sky; globe + instancing |
| 219 | **Legacy systems** | A 1970s mainframe still blinking in a basement under a modern bank `REV-005` | A modern glass tower built on top of a crumbling brick foundation `EST-011` | — | basement set; tower |
| 220 | **Technical debt** | A building with scaffolding never removed, more floors added on top `EST-012` | A tangle of cables behind a sleek front panel `REV-001` | — | scaffold; panel |
| 221 | **Single point of failure (tech)** | One cable holding up a bridge `OBJ-012` | A dam held by one bolt in macro `OBJ-002` | — | bridge; bolt |
| 222 | **Outage** | A city's lights going out district by district in a top-down shot `END-011` | Every screen in an airport hall turning blue `EST-018` | — | city; hall |

## Supply chain and trade

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 223 | **Supply chain** | One product on a pedestal; leader lines unspool from each part to its country on the map `DAT-020` | A single container followed from factory to ship to truck to shelf `ONE-013` | A chain of hands passing a box across a dark map `DAT-005` | exploded product + globe; container route; map |
| 224 | **Logistics** | A top-down of a port's container stacks rearranged in fast time-lapse `TRN-014` | A warehouse's conveyor network seen from above as a circuit board `DAT-015` | — | port; warehouse |
| 225 | **Shipping container** | A single container on a dark void, doors opening toward camera `OBJ-010` | A ship stacked twenty high, the camera rising along the stack `OBJ-013` | — | kit container; ship |
| 226 | **Chokepoint** | A narrow strait on the map with every ship route forced through it `DAT-002` | A ship wedged across a canal, a digger tiny beside it `EST-003` | — | terrain map; canal + ship |
| 227 | **Bullwhip effect** | A whip cracking along the length of a supply chain map, small motion at one end, a huge swing at the other `DAT-005` | A row of warehouses whose stock levels oscillate more the further they are from the shop `DAT-006` | — | map route; bar chart |
| 228 | **Just-in-time** | A truck arriving at a factory door the exact second the last part is used `FOL-009` | An empty warehouse with one box in the middle `OBJ-011` | — | road + factory; warehouse |
| 229 | **Inventory glut** | Containers stacked across a car park to the horizon `DAT-009` | A warehouse door that can't close because of the boxes `OBJ-010` | — | parking lot instancing; door |
| 230 | **Tariffs** | A toll gate built across a shipping lane, ships queuing `EST-005` | A price tag on a product that gains a second tag at the border `OBJ-005` | — | sea + gate; tag |
| 231 | **Trade war** | Two ports facing each other across the sea, cranes stopping in turn `OBJ-022` | Two piles of goods on a seesaw, each side adding weight `DAT-008` | — | ports; seesaw |
| 232 | **Sanctions** | A ship stopped mid-ocean as its transponder light goes from green to red `EST-014` | A bank's door with a country's flag taped over the lock `OBJ-005` | — | ocean + ship; door |
| 233 | **Embargo** | An empty harbour with cranes frozen at dusk `END-015` | A blockade line of ships drawn on the map `DAT-001` | — | port; map |
| 234 | **Globalisation** | A shoe on a pedestal surrounded by orbiting labels of the 12 countries that touched it `OBJ-001` | Night-side globe with shipping lanes glowing like veins `DAT-004` | — | shoe; globe |
| 235 | **Reshoring / onshoring** | A factory flying back across the globe and landing in a field `ONE-028` | A "Made in" label being re-stitched `OBJ-002` | — | globe; label macro |
| 236 | **Dependency** | A country on the map tethered by a single glowing line to another `DAT-013` | A plant on a windowsill with its roots in another pot across the room `OBJ-022` | — | globe; plant prop |
| 237 | **Port congestion** | Ships at anchor off a coast at night, their lights forming a city on water `EST-004` | Trucks in a queue that stretches beyond the frame `FOL-013` | — | sea + ship lights; road |
| 238 | **Commodities** | Raw piles of copper, wheat and oil barrels as giant monoliths beside a city `DAT-017` | A futures-trading pit (archive photo) `OBJ-003` | — | monoliths; archive photo |
| 239 | **Oil** | A single barrel on a pedestal with a price above it, pulled back to reveal a tanker `OBJ-011` | Pipelines across a desert seen from a drone, followed to the sea `FOL-013` | — | barrel; desert terrain + pipe |
| 240 | **Food supply** | A grain silo seen from the ground, then a map of silos as dots across a continent `ONE-003` | A dinner plate whose food items trace back to the map `DAT-020` | — | silo; plate |
| 241 | **Critical minerals** | A lump of ore on a pedestal; a red leader line to its one refinery on the map `OBJ-001` | A mine pit seen from orbit then from the edge `DAT-014` | — | ore; satellite descent |
| 242 | **Container ship scale** | A container ship stood on end beside a skyscraper `OBJ-022` | A human silhouette at the foot of the hull `EST-003` | — | ship + tower; silhouette |
| 243 | **Supply shock** | A domino line along a supply route on the map that stops at one fallen piece `DAT-005` | Empty supermarket shelves under fluorescent light `FOL-019` | — | map; store |
| 244 | **Smuggling routes** | A dotted red line slipping between official routes on the map `DAT-005` | A fishing boat at night with no lights `EST-020` | — | map; boat |
| 245 | **Last mile** | A van in a maze of streets, the camera rising to show hundreds of identical vans `FOL-011` | A parcel left on a doorstep under a porch light `OBJ-005` | — | city + vans; porch |

## Geopolitics and state power

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 246 | **Power** | One light switch in a dark room controlling the lights of a whole city seen through the window `REV-010` | A chess piece casting a long shadow across a map `OBJ-004` | A throne in an empty hall `EST-009` | window + city; map table; hall |
| 247 | **Superpower** | A globe where one country's light reaches every other via lines `DAT-004` | An aircraft carrier seen from above, a city at sea `EST-005` | — | globe; carrier |
| 248 | **Empire** | A map where one colour spreads and recedes over centuries, time-lapse `DAT-010` | Ruins of a grand building overgrown, lit at dusk `END-015` | — | map; ruins |
| 249 | **Sphere of influence** | Ripples spreading from one capital on a water-like map `DAT-010` | A magnet with iron filings arranged around it, seen top-down `OBJ-004` | — | water map; filings |
| 250 | **Alliance** | Linked pins on a map with lines snapping taut `DAT-001` | Hands stacked on a table `OBJ-004` | — | map; table |
| 251 | **Deterrence** | Two figures facing each other across a table, each with a hand on a red button `CHR-014` | A missile silo hatch closed under snow `OBJ-012` | — | table; silo |
| 252 | **Nuclear deterrence** | A silo door seen from directly above in a wheat field `REV-023` | Two clocks synchronised to the same minute `OBJ-022` | — | NAIP farmland + silo; clocks |
| 253 | **Arms race** | Two towers of missiles growing side by side `DAT-006` | Two runners on a treadmill accelerating together `CHR-014` | — | bar chart of missiles; treadmill |
| 254 | **Proxy war** | Chess pieces moved by unseen hands on a map of a third country `OBJ-004` | Two shadows on a wall fighting while the figures stand still `CHR-016` | — | map table; shadow play |
| 255 | **Cold war** | A frozen map with a line of ice down the middle `DAT-002` | Two embassies on opposite sides of a street with blinds drawn `EST-013` | — | map shader; street |
| 256 | **Soft power** | A film projector beaming a country's culture across the globe `DAT-004` | A brand logo glowing on billboards in a dozen cities `ONE-028` | — | globe + projection; globe hop |
| 257 | **Hegemony** | A single lighthouse lighting a dark sea full of ships `EST-006` | A dollar sign carved into the map's foundations `DAT-002` | — | lighthouse; terrain |
| 258 | **Sovereignty** | A border post's barrier arm down at night `EST-020` | A flag on a pole in a strong wind with no one around `EST-012` | — | border set; flag cloth |
| 259 | **Border** | A wall across a desert seen from a drone track `FOL-013` | A road that ends abruptly where a line on the map begins `ONE-015` | — | desert + wall; map-to-street |
| 260 | **Buffer state** | A small country on the map squeezed between two giant shadows `DAT-001` | A narrow room between two closing walls `CHR-013` | — | map; room |
| 261 | **Coup** | Tanks at dawn in front of a palace, single sodium light `EST-009` | A radio station's microphone in an empty room `OBJ-003` | — | palace + tank; studio |
| 262 | **Regime change** | A statue being toppled (archive photo) `OBJ-012` | Portraits on a wall replaced one by one `OBJ-007` | — | archive photo; portrait props |
| 263 | **Election interference** | Ballot boxes on a table with a thin cable running out of one `OBJ-006` | A map with fake accounts as swarming dots converging on one state `DAT-001` | — | ballots; map |
| 264 | **Espionage** | A briefcase exchanged on a bridge in fog `CHR-014` | A dead-drop: a hollow brick in a park wall `OBJ-017` | — | Glienicke-style bridge in fog; brick |
| 265 | **Cyberwar** | A power plant's control screen flickering as the lights in the town below go out `ONE-006` | A virus file as a key slipping into a lock on a turbine `OBJ-018` | — | control room; turbine |
| 266 | **Military logistics** | A convoy on a muddy road seen from a drone, stuck `FOL-011` | Fuel trucks lined up on the map as small dots stretching back to the border `DAT-005` | — | terrain + convoy; map |
| 267 | **Defence budget** | A stack of money beside a fighter jet; the stack is taller `OBJ-022` | A bar chart of countries' budgets as aircraft carriers in a row `DAT-006` | — | jet; carriers |
| 268 | **Intelligence agency** | A plain office building in a forest clearing seen from above, the car park full at night `EST-021` | A corridor of identical doors with no names `FOL-005` | — | world campus; corridor |
| 269 | **Geopolitical chokepoint (strait)** | A narrow strait with tanker silhouettes in single file at dusk `EST-014` | A hand closing around the strait on the map `DAT-002` | — | sea; map |
| 270 | **Arctic race** | An icebreaker cutting a new route on a melting map `FOL-004` | Flags planted on the sea floor (2007 archive) `OBJ-001` | — | ice shader; flag |

## State, law and regulation

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 271 | **Regulation** | A fence around a playground being built post by post `FOL-013` | A referee's whistle on a pedestal `OBJ-001` | Traffic lights installed on a road where cars had been crashing `EST-013` | fence; whistle; road |
| 272 | **Deregulation** | Guardrails removed from a mountain road one by one `FOL-013` | A speed-limit sign taken down, cars accelerating past `FOL-002` | — | mountain road; sign |
| 273 | **Antitrust** | A giant building being sawn into smaller buildings `EST-010` | A gavel striking a logo `OBJ-008` | — | tower cut; gavel |
| 274 | **Loophole** | A gap in a long wall, with a highway running through it `REV-003` | A rule book with a page cut into a doorway `OBJ-007` | — | wall + road; book |
| 275 | **Compliance** | Rows of binders on shelves in a basement, a single lamp `FOL-019` | A checklist with every box ticked and one missing `OBJ-016` | — | archive; checklist |
| 276 | **Red tape / bureaucracy** | A corridor of counters each stamping the same form `FOL-005` | A desk buried under forms with a tiny lamp `OBJ-011` | — | corridor; desk |
| 277 | **Legislation** | A bill on a desk travelling through doors of a capitol as stamps accumulate `ONE-016` | Votes as lights on a chamber's board `DAT-021` | — | capitol corridor; vote board |
| 278 | **Court ruling** | A courtroom empty except one lit lectern `EST-009` | A judgment document, a red loop on the operative paragraph `OBJ-016` | — | courtroom; document |
| 279 | **Enforcement** | A badge on a desk in front of a towering corporate HQ `OBJ-022` | A raid: torchlight beams in a dark office `CHR-015` | — | badge + tower; office |
| 280 | **Fine / penalty** | A fine cheque beside a company's quarterly profit pile; the cheque is a sliver `OBJ-022` | A speeding ticket on a limousine windshield `OBJ-005` | — | props; car |
| 281 | **Settlement** | Two pens on a table and a signed document, no one in the chairs `OBJ-004` | A handshake silhouette behind frosted glass `CHR-014` | — | table; glass |
| 282 | **Bailout** | A drowning figure thrown a lifebuoy made of banknotes `CHR-013` | A crane lifting a sinking ship out of the water `OBJ-012` | — | water; ship |
| 283 | **Subsidy** | A factory on stilts made of public money `EST-010` | A hand under a bicycle seat keeping it upright `FOL-010` | — | factory; bicycle |
| 284 | **Nationalisation** | A company sign taken down and a government seal bolted up `OBJ-002` | A flag raised on a factory roof `EST-012` | — | sign; flag |
| 285 | **Privatisation** | A public park with a turnstile installed at the gate `REV-019` | A water tap with a coin slot `OBJ-003` | — | park gate; tap |
| 286 | **Central planning** | A city built from a single drawing, rows perfectly identical, top-down `EST-005` | A single hand placing every building on a map `OBJ-004` | — | isometric city; map table |
| 287 | **Public-private partnership** | Two hands holding the same key `OBJ-014` | A building half stone government, half glass corporate `EST-011` | — | key; facade |
| 288 | **Regulatory sandbox** | A fenced sandbox in a playground where a robot is allowed to play `OBJ-011` | A test track separate from the public road `FOL-004` | — | sandbox; track |
| 289 | **Tax law complexity** | A tax code as a stack of books taller than a person `OBJ-013` | A maze garden seen from above with a coin at the centre `REV-013` | — | books; maze |
| 290 | **Rule of law** | Scales on a pedestal under a single beam `OBJ-001` | A courthouse's columns from a low angle `EST-009` | — | scales; courthouse |
| 291 | **Jurisdiction shopping** | A company's HQ sign moving across the map to the country with the friendliest flag `ONE-028` | One building with five nameplates in five languages `OBJ-013` | — | globe; nameplates |
| 292 | **FOIA / public records** | A request letter going into a slot, the camera following it into a mountain of boxes `ONE-008` | A file box opened to reveal mostly blacked-out pages `OBJ-017` | — | slot + archive; redacted box |

## Secrecy and hidden information

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 293 | **Secrecy** | A locked door at the end of a corridor with light spilling under it `REV-019` | A sealed envelope under a work light with a wax seal `OBJ-001` | A building whose windows are all mirrors `EST-012` | corridor; envelope; mirror facade |
| 294 | **Classified documents** | A document stamped TOP SECRET in a box among hundreds of boxes `OBJ-017` | A red line through a page, then the page shredded `OBJ-016` | — | box; document |
| 295 | **Leak** | A single drop of water falling from a pipe in a dark server room `OBJ-003` | A sheet of paper slipping under a door into light `OBJ-007` | — | pipe; door |
| 296 | **Redaction** | Black bars sliding across a page one by one; one bar lifts `OBJ-016` | A photo with a face replaced by a black rectangle `OBJ-007` | — | motion.js redact; photo |
| 297 | **NDA / silence** | A signed page beneath a closed mouth-shaped padlock `OBJ-005` | Figures at a table each with a sealed envelope `CHR-014` | — | padlock; table |
| 298 | **Offshore secrecy** | An island at night with a single lit office among palm trees `EST-020` | A vault door that opens onto another vault door `REV-019` | — | island; vault |
| 299 | **Front company** | A shopfront with closed blinds and a sign for a business that never opens `EST-013` | A theatre flat facade of a business, with scaffolding behind `REV-001` | — | street; facade |
| 300 | **Plausible deniability** | A chain of three hands passing a package so the first never touches the last `CHR-014` | A phone call relayed across three phones on the map `DAT-005` | — | hands; map |
| 301 | **Compartmentalisation** | A building whose rooms have no connecting doors, seen in cutaway `DAT-012` | A puzzle where each worker holds only one piece `OBJ-004` | — | cutaway; puzzle |
| 302 | **Black budget** | A pie chart with one slice that is blank and unlabelled `DAT-019` | A government building with a floor missing on the plan `DAT-008` | — | pie; floor plan |
| 303 | **Cover story** | A painted backdrop of a normal street, the camera pans past its edge `REV-004` | A shop sign over a facility gate `EST-021` | — | backdrop; gate |
| 304 | **Disinformation operation** | A factory floor where the conveyors carry newspapers with slightly different headlines `DAT-018` | Hundreds of identical phones posting at once in a dark room `REV-020` | — | conveyor; phone farm |
| 305 | **Archives** | Rows of grey boxes in a dark warehouse, a torch beam finding one label `FOL-005` | A file pulled from a drawer and opened under a lamp `ONE-008` | — | archive; document zoom |
| 306 | **Secret meeting** | Two cars parked facing opposite directions in an empty lot at night `EST-020` | A hotel room door with a do-not-disturb sign, light under it `OBJ-003` | — | parking lot; hotel |
| 307 | **Backchannel** | A second telephone in a drawer `OBJ-017` | A side door of an embassy opening at night `REV-019` | — | drawer; embassy |
| 308 | **Code name** | A name typed onto a card, then the card turned to show a different name `OBJ-007` | A file folder with a single word stencilled on it `OBJ-001` | — | card; folder |
| 309 | **Burner phone** | A cheap phone on a motel nightstand next to cash `OBJ-005` | A SIM card snapped in half `OBJ-014` | — | motel; SIM |
| 310 | **Hidden in plain sight** | A camera pulls back from a detail to reveal it's on a famous building everyone walks past `REV-002` | A crowd walking past an unmarked door `CHR-022` | — | building; crowd |
| 311 | **The paper trail** | A single sheet that leads to another, the camera tracking along a trail of pages across a floor `DAT-011` | Red string connecting documents on a wall `OBJ-004` | — | page trail; evidence wall |
| 312 | **Ghost ownership** | A house with lights on but no people inside, time-lapse of a whole year `TRN-014` | A luxury flat's empty interior under a single bulb `EST-018` | — | house; flat |

## Society, inequality and everyday economics

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 313 | **Inequality** | Two houses on the same street, one a mansion lit gold, one dark, the camera trucking between them `EST-013` | A bar chart where one bar is a skyscraper and the rest are pebbles `DAT-006` | A dinner table where one plate holds most of the food `OBJ-004` | street; bars; table |
| 314 | **Wealth concentration** | Sand poured onto a table that slides into one corner `DAT-009` | A crowd of a thousand silhouettes on one side of a scale, one figure on the other, balanced `OBJ-022` | — | sand; scale |
| 315 | **The top one percent** | One lit window in a tower of a hundred dark ones `EST-021` | A stadium crowd where one seat is gold `CHR-021` | — | tower; stadium |
| 316 | **Middle-class squeeze** | A figure between two closing walls labelled with costs `CHR-013` | A family car on a road that keeps narrowing `FOL-013` | — | room; road |
| 317 | **Housing crisis** | A house on a pedestal with a price that keeps growing while the house stays small `OBJ-005` | A queue of renters outside one flat's door down a stairwell `FOL-022` | Construction cranes idle over empty lots `EST-020` | house; stairwell; crane |
| 318 | **Gentrification** | A street time-lapse where shop signs change and the same corner shop disappears `TRN-014` | A tower crane's shadow sweeping over low houses `EST-002` | — | street; crane |
| 319 | **Poverty trap** | A ladder whose lower rungs are missing `EST-012` | A hamster wheel inside a cage under a bank's lights `OBJ-001` | — | ladder; wheel |
| 320 | **Social mobility** | An elevator where only certain floors' buttons light `OBJ-003` | A staircase with doors on each landing, most locked `EST-023` | — | elevator; stair |
| 321 | **Generational wealth** | A key passed between three hands of different ages `OBJ-014` | A tree whose roots run under three houses `DAT-008` | — | key; tree |
| 322 | **Gig economy** | A delivery cyclist at night lit by a phone screen in the rain `FOL-007` | A map of a city with thousands of moving dots, each a courier `DAT-015` | — | street rain; map |
| 323 | **Precarity** | A figure on a tightrope over a city at night `CHR-001` | A house of cards on a kitchen table `OBJ-012` | — | rope; cards |
| 324 | **Loneliness epidemic** | A tower block at night where every lit window has one silhouette `EST-021` | A dinner table set for one in a large room `CHR-007` | — | tower; dining room |
| 325 | **App addiction** | A slot-machine lever made from a phone `OBJ-012` | A face lit only by a phone in a dark bedroom, seen from the doorway `CHR-003` | — | phone; bedroom (silhouette only) |
| 326 | **Status / consumerism** | A pedestal with a logo bag under a spotlight in a glass case `OBJ-009` | A car park where every car is the same model `REV-020` | — | case; parking |
| 327 | **Planned obsolescence** | A phone on a timer that goes dark the day a new model is unveiled `OBJ-018` | A landfill of identical devices seen from a drone `EST-004` | — | phone; landfill |
| 328 | **Brand loyalty** | A queue outside a store at dawn in the rain `FOL-022` | A tattoo of a logo `OBJ-002` | — | storefront; skin macro (stylised) |
| 329 | **Trust** | A rope bridge with a single figure stepping onto it `CHR-001` | A handshake across a gap that's widening `CHR-014` | — | rope bridge; silhouettes |
| 330 | **Polarisation** | A crowd parting into two halves leaving an empty strip down the middle, top-down `CHR-021` | Two magnets repelling on a table `OBJ-022` | — | crowd; magnets |
| 331 | **Populism** | One figure on a balcony over a sea of lights `CHR-019` | A megaphone on a podium `OBJ-001` | — | balcony; megaphone |
| 332 | **Brain drain / emigration** | Lights leaving a country on the map like birds `DAT-004` | An airport departure board where every flight is outbound `OBJ-020` | — | globe; board |
| 333 | **Ageing population** | A park bench line where seats outnumber children `EST-013` | A population pyramid that inverts into a vase `DAT-007` | — | park; pyramid chart |
| 334 | **Urban sprawl** | A city's lights spreading over farmland in time-lapse from orbit `DAT-010` | Identical cul-de-sacs from above `REV-020` | — | NAIP time series; suburb |
| 335 | **Ghost cities / empty megaprojects** | A brand-new city at night with only streetlights on `EST-020` | A highway interchange with no cars at all, from above `EST-005` | — | city; interchange |

## Risk, systems and failure

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 336 | **Systemic risk** | Dominoes arranged in the shape of a city skyline `EST-001` | A spider web where one strand is cut and the whole web sags `OBJ-012` | A Jenga tower with labelled blocks `OBJ-012` | domino skyline; web; block tower |
| 337 | **Contagion** | A drop of ink in water spreading across a map `DAT-010` | Lights on a network going red node by node `DAT-004` | — | ink shader; globe |
| 338 | **Domino effect** | A single domino tipped in a dark hall, the camera tracking the wave `FOL-002` | Falling dominoes turning into falling bank towers `TRN-011` | — | domino line; tower match |
| 339 | **Too big to fail** | A building so big it holds up its neighbours, which lean on it `EST-012` | A ship too large to turn in a narrow canal `EST-003` | — | towers; canal |
| 340 | **Tail risk** | A bell curve extruded into a landscape; the camera flies to the far flat edge where a cliff waits `DAT-002` | A calm sea with one giant wave on the horizon `END-002` | — | curve terrain; ocean |
| 341 | **Black swan** | A single black feather on a white pedestal `OBJ-001` | A flock of white birds with one black one entering `CHR-021` | — | feather; flock |
| 342 | **Feedback loop** | A microphone pointed at its own speaker, a sound wave growing `OBJ-003` | A circular conveyor speeding up with each lap `DAT-018` | — | mic + speaker; loop |
| 343 | **Tipping point** | A glass tilted on a table edge, the camera holding as it reaches the angle `OBJ-012` | A seesaw with one more coin added `DAT-008` | — | glass; seesaw |
| 344 | **Cascading failure** | A power grid map with one node failing and neighbours following `DAT-010` | Cables snapping in sequence on a suspension bridge `FOL-013` | — | map; bridge |
| 345 | **Fragility** | A glass sculpture on a vibrating table `OBJ-001` | A long bridge of matchsticks `FOL-013` | — | glass; matchsticks |
| 346 | **Resilience / redundancy** | Two ropes holding a climber, one cut and the other holds `CHR-001` | A road map with a detour lighting up when the main road closes `DAT-005` | — | climber; map |
| 347 | **Moral hazard** | A driver with an airbag the size of a car driving faster `FOL-001` | A safety net under a trapeze getting bigger as the jumps get riskier `CHR-002` | — | car; trapeze |
| 348 | **Externality** | A factory chimney whose smoke drifts over a neighbour's laundry `EST-004` | A party in one flat with water leaking into the one below `DAT-012` | — | chimney; cutaway |
| 349 | **Tragedy of the commons** | A pasture grazed bare in time-lapse while each farmer adds one more sheep `TRN-014` | A shared fish tank emptied net by net `OBJ-017` | — | pasture; tank |
| 350 | **Unintended consequences** | A cobra bounty: a basket of cobras multiplying `OBJ-017` | A sprinkler fixed in one room flooding the next `DAT-012` | — | basket; cutaway |
| 351 | **Complexity** | A watch movement with thousands of parts, macro slide `OBJ-002` | A city's subway map growing lines `DAT-015` | — | watch; map |
| 352 | **Tight coupling** | Train carriages linked so closely that one braking stops all `FOL-002` | Gears meshed in a row where one jam stops the line `OBJ-013` | — | train; gears |
| 353 | **Normalisation of deviance** | A gauge needle creeping into the red, with a sticky note saying "normal" `OBJ-003` | A crack in a dam wall photographed every year, growing `TRN-014` | — | gauge; dam |
| 354 | **Time bomb** | A device on a table with a counter, the camera creeping in `OBJ-018` | A calendar with a red circle and pages flipping `OBJ-007` | — | device; calendar |
| 355 | **Stress test** | A bridge loaded with trucks until it bows `EST-007` | A bank vault being pumped with water to test the seals `OBJ-010` | — | bridge; vault |
| 356 | **Contagion via interconnection** | Banks as islands joined by rope bridges; one sinks and drags its bridges `DAT-015` | Cars roped together on an icy slope `FOL-004` | — | island map; slope |
| 357 | **Hidden leverage in the system** | The tip of an iceberg labelled with a number, the camera dropping beneath the waterline to show the rest `REV-005` | A tiny balcony holding a heavy safe `EST-011` | — | iceberg; facade |

## Time, growth and change

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 358 | **Exponential growth** | Rice on a chessboard filling the room by square 40 `DAT-006` | Lily pads doubling on a pond, top-down, until the last day `REV-020` | A curve extruded into a ramp the camera rides until it's vertical `DAT-007` | chessboard; pond; chart ramp |
| 359 | **Linear vs exponential** | Two staircases side by side; one gentle, one that becomes a wall `OBJ-022` | Two cars, one steady, one accelerating off the horizon `FOL-002` | — | stairs; road |
| 360 | **Decline** | A department store's lights fading floor by floor at dusk `END-005` | A town's population counter on a welcome sign ticking down `OBJ-005` | — | store; sign |
| 361 | **Obsolescence** | A pay phone in a modern street, lit by a single lamp `EST-020` | A wall of old devices like a museum `OBJ-013` | — | street; shelf |
| 362 | **Innovation** | A spark in darkness that lights a single filament `OBJ-001` | A workbench where a prototype rotates under a lamp `OBJ-009` | — | filament; bench |
| 363 | **First-mover advantage / disadvantage** | The first runner off the blocks tripping over the first hurdle `FOL-018` | A pioneer's wagon tracks followed by a highway `FOL-013` | — | track; road |
| 364 | **Hype cycle** | A rollercoaster track shaped like the Gartner curve, the camera riding it `DAT-007` | A balloon rising, deflating and drifting back up slowly `OBJ-012` | — | track; balloon |
| 365 | **Adoption curve / S-curve** | A field of lights turning on slowly, then all at once, then the last few `REV-020` | A crowd entering a stadium: trickle, rush, stragglers `CHR-021` | — | field; stadium |
| 366 | **Boom and bust** | A town in a desert built in a time-lapse then abandoned `TRN-014` | A heartbeat line that spikes and flatlines `DAT-021` | — | desert town; motion.js line |
| 367 | **Generational shift** | A family photo with each generation holding a different device `OBJ-007` | Three cars from three decades on the same road `OBJ-022` | — | photo; cars |
| 368 | **Deadline / countdown** | A clock on a wall in an empty office, the second hand loud `OBJ-005` | A countdown on a big screen over a city square `EST-015` | — | clock; square |
| 369 | **The long game** | A tree planted, the camera locking off while seasons pass `TRN-014` | A chess clock with one player taking decades `OBJ-005` | — | tree; clock |
| 370 | **Short-termism** | A quarterly calendar torn page by page as a building ages behind it `TRN-014` | A figure eating the seed corn from a sack `CHR-004` | — | calendar; sack |
| 371 | **Path dependency** | A QWERTY keyboard's keys rising as monoliths `OBJ-002` | Ruts in a road that every wagon follows `FOL-013` | — | keyboard; road |
| 372 | **Inevitability** | A train on a track seen from far ahead, approaching `FOL-003` | A tide line approaching a sandcastle `END-002` | — | train; tide |
| 373 | **Decades compressed** | A city skyline rising floor by floor in time-lapse from 1950 to today `EST-001` | A calendar wall whose pages fly off in wind `TRN-001` | — | city; calendar |
| 374 | **Before and after** | Two identical camera moves on the same street in two years, dissolved `TRN-011` | Satellite imagery wiped from one year to another `DAT-014` | — | street; Sentinel-2 pair |

## People, psychology and decisions

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 375 | **Greed** | A hand reaching into a jar too narrow to pull out while holding the coins `OBJ-003` | A figure at a buffet table that stretches to the horizon `CHR-007` | — | jar; table |
| 376 | **Fear / panic** | A crowd running toward a single exit, top-down `CHR-021` | A heartbeat monitor in a dark room `OBJ-020` | — | crowd; monitor |
| 377 | **Hubris** | A statue whose head reaches the clouds while its base cracks `EST-012` | Icarus wings (wax) on a pedestal under a heat lamp `OBJ-001` | — | statue; wings |
| 378 | **Ambition** | A figure climbing a tower's exterior at night `CHR-002` | A ladder leaning against the sky `EST-012` | — | tower; ladder |
| 379 | **Betrayal** | A handshake photographed from behind, one hand holding a knife `CHR-006` | A chess piece switching colour `OBJ-014` | — | silhouettes; chess |
| 380 | **Loyalty** | A guard standing in the rain in front of an empty building `CHR-001` | A dog waiting at a station (Hachikō statue) `OBJ-001` | — | building; statue |
| 381 | **Charisma** | A single figure on a stage, all the crowd's phone lights pointed at them `CHR-019` | A magnet pulling filings `OBJ-004` | — | stage; filings |
| 382 | **Cult of personality** | A giant portrait on a building, a tiny crowd beneath `EST-003` | Hundreds of identical posters of one silhouette `OBJ-013` | — | portrait facade; posters |
| 383 | **Groupthink** | A room of silhouettes all nodding, one still `CHR-021` | A flock of birds turning in unison `EST-014` | — | room; flock |
| 384 | **Incentives** | A carrot on a stick before a running figure `FOL-003` | A maze where the cheese is moved to change the rat's path `REV-013` | — | figure; maze |
| 385 | **Manipulation** | Puppet strings from the ceiling to a figure at a desk `CHR-006` | A hand nudging pieces on a board while players look away `OBJ-004` | — | strings; board |
| 386 | **Persuasion** | A path of arrows painted on a floor leading to a checkout `FOL-019` | A whisper into an ear in silhouette `CHR-004` | — | store floor; silhouette |
| 387 | **FOMO** | A train leaving a platform while a crowd runs after it `FOL-020` | A party in a lit window seen from a dark street `EST-020` | — | station; street |
| 388 | **Sunk cost** | A half-built bridge over a canyon with workers still adding planks `EST-007` | A figure shovelling coins into a hole `CHR-013` | — | canyon; hole |
| 389 | **Confirmation bias** | A flashlight that only lights the evidence it was already pointed at `FOL-005` | Glasses with tinted lenses on a pedestal `OBJ-001` | — | torch beam; glasses |
| 390 | **Overconfidence** | A tightrope walker without a net looking back at the crowd `CHR-001` | A chess player who has stopped looking at the board `CHR-004` | — | rope; chess |
| 391 | **Herd behaviour** | A crowd all looking up at an empty sky `CHR-021` | Sheep through a gate in single file `FOL-004` | — | crowd; sheep |
| 392 | **Denial** | A figure reading a newspaper while water rises around the chair `CHR-003` | A smoke alarm with its battery removed on a counter `OBJ-005` | — | room water; alarm |
| 393 | **Regret / hindsight** | A footprint trail that turns back on itself in snow `FOL-020` | A crumpled letter flattened on a desk `OBJ-007` | — | snow; letter |
| 394 | **The insider / the defector** | A single figure walking against a crowd's flow `CHR-022` | A door opening from inside a fortress `REV-019` | — | crowd; door |
| 395 | **The lone operator** | A silhouette in a pool of fluorescent light in a vast dark hall (style-bible theme) `CHR-011` | One lit desk in a dark open-plan floor, top-down `REV-023` | — | hall; office |
| 396 | **Underdog vs giant** | A small figure at the foot of a giant tower's shadow `EST-003` | A slingshot on a table beside a city model `OBJ-022` | — | tower; props |

## Crypto and fintech

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 397 | **Blockchain** | A chain of glass blocks each containing a ledger page, the camera tracking along it `DAT-011` | A ledger copied onto a thousand desks simultaneously `REV-020` | — | glass blocks; desks |
| 398 | **Bitcoin mining** | A warehouse of humming machines in a cold landscape, steam in the floodlights `EST-010` | A pickaxe made of a GPU `OBJ-001` | — | warehouse; prop |
| 399 | **Stablecoin** | A coin balanced on a spinning top `OBJ-014` | A peg holding a tent in wind `OBJ-003` | — | top; tent |
| 400 | **Crypto exchange collapse** | A glass bank lobby in Bahamas-style light, empty, a single chair turned over `EST-018` | A balance on a phone screen turning to zero `OBJ-020` | — | lobby; phone |
| 401 | **Private keys / custody** | A key under a doormat of a vault `OBJ-017` | A seed phrase on paper burning in an ashtray `OBJ-003` | — | doormat; paper |
| 402 | **Wallet** | A wallet with no money but a long string of characters engraved on it `OBJ-002` | A transparent wallet anyone in a crowd can see into `CHR-021` | — | wallet; crowd |
| 403 | **Smart contract** | A vending machine that dispenses only when the exact coin drops `OBJ-005` | A dominoes contract: tip one and the outcome is fixed `FOL-002` | — | vending machine; dominoes |
| 404 | **NFT** | A picture frame with nothing in it except a receipt `OBJ-005` | A museum label for an empty wall `OBJ-003` | — | frame; museum |
| 405 | **Tokenomics** | A fountain that pays its earliest visitors from the newest visitors' coins `DAT-008` | A cake sliced mostly for the founders before the guests arrive `DAT-019` | — | fountain; pie |
| 406 | **CBDC / digital currency** | A coin whose face is a camera lens `OBJ-001` | Banknotes dissolving into a central server `TRN-011` | — | coin; server |
| 407 | **Payment rails** | Trains of coins on tracks crossing a map, a toll at each junction `DAT-005` | A card tap at a till, then the camera follows the signal across the globe and back in two seconds `ONE-028` | — | map; globe |
| 408 | **Buy now, pay later** | A shopping bag with a chain to a future calendar date `OBJ-005` | A receipt split into four slices that follow the shopper `FOL-007` | — | bag; receipt |
| 409 | **Neobank** | A bank with no building: a glowing door standing alone in a field `EST-003` | A phone that unfolds into a vault `DAT-020` | — | field + door; phone |
| 410 | **Cashless society** | A coin rolling into a drain `OBJ-003` | A street market where the stalls show only card readers `EST-013` | — | drain; market |
| 411 | **Crypto winter** | A mining warehouse with frost on the racks and the lights off `END-005` | Snow falling on a deserted conference stage `END-002` | — | warehouse; stage |
| 412 | **Hack / bridge exploit** | A bridge between two islands whose middle planks vanish at night `EST-007` | A vault drained through a pinhole by a thin stream of coins `OBJ-002` | — | bridge; vault |

## Energy, resources and the environment

| # | Concept | Option A | Option B | Option C | Set / asset |
|---|---|---|---|---|---|
| 413 | **Energy transition** | A row of smokestacks with wind turbines rising between them `EST-004` | A petrol pump replaced with a charging post under the same canopy light `TRN-011` | — | industrial; forecourt |
| 414 | **Carbon emissions** | A city exhaling a visible cloud over the course of a day `TRN-014` | A balloon filled with a city's daily CO2, compared to a skyscraper `OBJ-022` | — | city time-lapse; balloon |
| 415 | **Carbon offsets** | A forest bought on paper; the camera pulls back from the certificate to a burned clearing `ONE-008` | A plane with a sapling strapped to its tail `OBJ-001` | — | certificate; clearing |
| 416 | **Oil dependency** | A country on the map connected by a pipeline umbilical to another `DAT-013` | A drip feed bag full of oil beside a factory `OBJ-003` | — | map; IV prop |
| 417 | **Renewable intermittency** | Solar panels at dusk while the city lights come on `EST-004` | A wind farm on a still day, blades frozen `EST-020` | — | solar field; turbines |
| 418 | **Batteries / storage** | A battery the size of a warehouse beside a tiny town `EST-003` | Water pumped uphill at night and released by day `DAT-008` | — | battery block; reservoir diorama |
| 419 | **Grid stress** | Transmission lines glowing hotter and hotter on a heat-map `DAT-010` | A breaker panel with one switch tripping `OBJ-003` | — | map; panel |
| 420 | **Climate risk to assets** | A beachfront tower with a tide line climbing its base in time-lapse `TRN-014` | An insurance map where districts turn red `DAT-010` | — | tower + tide; map |
| 421 | **Water scarcity** | A reservoir bathtub ring exposed in a drone shot `EST-007` | A single tap dripping into a cracked basin `OBJ-003` | — | 3DEP terrain + low water; tap |
| 422 | **Resource extraction** | A mountain hollowed out from the inside, seen in cutaway `DAT-012` | A conveyor carrying a mountain to a port, kilometre after kilometre `FOL-013` | — | cutaway; conveyor |
| 423 | **Mining** | An open pit's terraces seen from the rim at dawn `EST-007` | A giant haul truck beside a human silhouette `EST-003` | — | pit (3DEP/NAIP); truck |
| 424 | **Pollution** | A river turning colour downstream of a factory outfall, drone follow `FOL-013` | Smog swallowing a skyline in time-lapse `TRN-014` | — | river; city |
| 425 | **Greenwashing** | A factory painted green with leaves stencilled on the smokestack `EST-010` | A green label peeled to reveal another label `OBJ-002` | — | factory; label |
| 426 | **Heat / urban heat island** | A thermal-camera city where the poor districts glow brightest `DAT-010` | A thermometer on a street pole, needle climbing `OBJ-003` | — | map shader; pole |
| 427 | **Electricity price spike** | A home's meter spinning while a family silhouette sits by candlelight `OBJ-020` | Price graph extruded into a mountain the camera can't see over `DAT-007` | — | meter; chart |
| 428 | **Peak resource** | A gauge on a giant tank falling past the halfway mark `OBJ-005` | An oil well's pumpjack slowing to a stop at dusk `END-002` | — | tank; pumpjack |

---

## Shot coverage

These rows use 135 distinct catalog ids. The most used are `OBJ-003` (33), `OBJ-001` (32), `OBJ-005` (27), `OBJ-022` (26), `OBJ-002` (23), `OBJ-012` (21), `DAT-008` (20), `TRN-014` (19), `EST-020` (17), `OBJ-004` (17). Because the object shots (OBJ-00x) dominate, a chapter built only from this file will drift toward pedestal close-ups: alternate with the place and map options and let `pick.mjs --check` enforce the scale alternation.
