// Chapter 3 shots: 3. THE WRONG FIX (lines 47–67). Shot writer's list, after VISUALS.md (rev 9) and OUTLINE.md §5 (CH.3 4:09–6:10).
// Light: L47–L61 daylight (VISUALS: "the dusk tint begins" at L62; note lib skyFor() says dusk from 59, VISUALS wins), dusk L62–L67.
// Fact locks honoured here: one red thing per frame; the bell frame is UNLIT from L62 (the flame is a card on the tower's own wall
// below it, ink-40 smoke rises from the frame); bells dormant unless RED names the bell (L48 peek, L60 toy); the bell never slips;
// the domino is captioned "officials' fear"; the civil-protection post named no one; no blame, no faces; no section of the building
// (the H8 demonstration is the outside of the card flexing). Weights as a range only (no per-bell kg).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch3   chapter card, clock one done (+30), clock two not yet lit
//   s301  L47–49  airdrop façade by day: camera tripods + the crowd all aimed at the spire's dashed ghost (red: the gap)
//                 ~ "But": the camera slides down onto the north belfry, a bell glimpsed through the louvre (red: the bell)
//                 ~ "And": pull back; a water-bomber's shadow sweeps the façade, tag "officials warned" (red: the shadow's nose)
//   s302  L50     the parvis from above: hundreds of tallies, each pops a little plane-shaped speech tab ~ "So": one tab grows
//   s303  L51     DOC: the post, text only, recreated (red: the "flying water tankers" loop) — the 1st full card of Ch.3
//   s304  L52     a paper water-bomber on its wire drops a teal slab on a brass wildfire band ~ banks toward the card cathedral
//   s305  L53     3/4 view from the north (front card + north flank); the plane hangs on its wire over the burning roof; the
//                 shield-and-wave stamp plate thumps down (no logo)
//                 → "All" (L54): tighter, the wire now runs from a brass winch arm; the exact English post as a STRIP (red: "collapse")
//   s306  L55     H8 demonstration: the slab drops on the side card, the roof line sags, walls bow, spray hits the houses nearby
//   s307  L56     a new angle, top-down plan: the plane climbs out of the top of frame; one hose line runs diagonally across the
//                 sage square to the central portal ~ track along it to the nozzle (red)
//   s308  L57     close on the central portal (same sage square, the hose lying on it): hard push to the red ring round the trapped
//                 tallies; 1 s hold; ring opens, they walk out (chip)
//   s309  L58     a deliberate change of angle: the fold view; the camera swings to the north tower, pin (red) — the hose
//                 continuity of VISUALS is dropped on purpose (s307 already carries the hose)
//   s310  L59–60  pull out to the twin towers, brass ruler 69 m ~ "north": the bell-frame toy rises beside the model (red: its bell)
//   s311  L61     loupe into the toy: close along the bells, smallest to largest ~ the brass range card, red tick at "just over 4 t"
//   s312  L62–63  ★ dusk: a flame card on the tower's own wall BELOW the frame, smoke from the unlit frame, chip ≈20:30 NYT (red loop
//                 round the wall flame) → "bells": closer; the pencil loops the bell, then slides the loop onto the unlit oak beam
//   s313  L64     the domino FRAME · BELLS · NORTH TOWER · CATHEDRAL tips on the words, "officials' fear", Gallet strip (red: FRAME's edge)
//                 → "And": the side card at dusk, roof burning, a pin on the towers: "the rest could follow"
//   s314  L66     QUOTE (the chapter's one full card): Vaz de Matos, AP translation, slow push (red: "chain-reaction")
//   s315  L67     the frame behind a smoke card, only beams and one bell outline (red); Gallet strip ~ "only": a teal tally at the foot
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(3);

const NYT = 'NYT, 16 JUL 2019';
const SC = 'SÉCURITÉ CIVILE, 15 APR 2019';
const DAY = 'day', DUSK = 'dusk';
const BF = { open: 1, char: 0, flame: 0, slip: 0, redBell: -1, weights: false, labels: false, clock: null, crowd: false, glue: false, bellOrder: 'asc' }; // glue false: only the small N on the door; asc: smallest bell left // the unlit bell-frame toy

export const shots = check([
  CH('The Wrong Fix', 'the planes and the bells', { lit: 'delay', delay: '+30', red: 'num', numFrom: 2, at: 0.05, wheelRoll: false }, M('tension', 'D', [0.3, 0.5])),

  // L47–49 — everyone looked at the spire; the danger was elsewhere; the fix people wanted could have brought it down
  S('airdrop', L(47, 49), { view: 'facade', sky: DAY, fire: 0.6, smokeSeed: 31, tripods: 3, tripodSc: 1.5, tripodY: 1000, hedgeCrowd: { sc: 1.15, gap: 28 }, tripodX: [300, 1400, 1640], tripodOutAt: 'But+0.6', tripodInAt: 'And+0.6', bellPeek: true, shadow: 1, shadowAt: 'fix', shadowEndAt: 'down', shadowStopX: 920, shadowY: 36, shadowSc: 0.8, shadowA: 0.35,
    redSeq: [{ red: 'gap', at: 0 }, { red: 'bell', at: 'danger' }, { red: 'shadow', at: 'fix+0.6' }],
    cam: { x: 960, y: 590, z: 1.03 }, zoomTo: [{ x: 930, y: 520, z: 1.1, at: 0, dur: 2.6 }, { x: 975, y: 450, z: 2.3, at: 'But', dur: 2.4 }, { x: 960, y: 500, z: 1.38, at: 'And', dur: 1.8 }],
    tags: [{ at: [877, 380], to: [585, 252], text: 'North tower', sub: 'WHAT THEY FEARED MOST', size: 18, inAt: 'danger', outAt: 'And' },
      { anchor: 'shadow', to: [1110, 250], text: 'Officials warned', sub: 'THE FIX COULD BRING IT DOWN', size: 30, swing: -2, inAt: 'officials' }],
    source: 'ILLUSTRATION · PAPER MODEL · THE SPIRE FELL ≈ 19:45–19:50 (DRAC; CULTURE MINISTRY)' }),

  // L50 — online, plenty of answers; so did the president
  S('airdrop', L(50), { view: 'crowd', tabs: 1, tabsAt: 'Online', tabsDur: 2.4, grow: 1, growAt: 'So', growDur: 1.5, growText: '@realDonaldTrump', growTextAt: 'president', rows: 6, crowdGap: 1.25, heroRow: 3, heroCol: 0.52, heroSc: 1.7, heroRing: [170, 130], red: 'tab', kicker: 'ONLINE · 15 APR 2019',
    cam: { x: 960, y: 600, z: 1.04 }, zoomTo: { x: 1060, y: 600, z: 1.14, at: 0, dur: 6 }, source: 'ILLUSTRATION · NOT A COUNT OF POSTS' }),

  // L51 — the post, text only (full card #1 of Ch.3)
  S('doc', L(51), { kind: 'post', head: '@realDonaldTrump', meta: ['15 APR 2019'], inAt: 0.1, typeAt: 'Perhaps',
    lines: ['… Perhaps flying water tankers could be used to put it out. Must act quickly!'], highlight: 'flying water tankers', at: 'tankers',
    cam: { push: 0.07, dx: 24, dy: 10 }, source: 'SOURCE: POST OF 15 APR 2019, AS QUOTED BY THE ART NEWSPAPER (16 APR 2019) · RECREATED, TEXT ONLY' }),

  // L52 — the planes you have seen: a wildfire drop, then it banks toward the cathedral
  S('airdrop', L(52), { view: 'hills', fly: 1, flyAt: 0, flyDur: 1.5, dropAt: 'drop', dropDur: 1.1, planeSc: 1.15, slabSc: 1.7, bankAt: 'wildfires', bankDur: 1.4, bankRot: -16, bankRoll: 0.9, bankY: 430, douse: 0.97, douseR: 260, steam: true, cathK: 3.2, cathX: 1600, red: 'nose', smokeSeed: 9,
    cam: { x: 700, y: 440, z: 1.65 }, zoomTo: [{ x: 730, y: 450, z: 1.72, at: 0, dur: 2.5 }, { x: 1100, y: 520, z: 1.12, at: 'wildfires-0.2', dur: 1.5 }], kicker: 'A WATER-BOMBER · THE PLANES YOU HAVE SEEN',
    source: 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE' }),

  // L53 — civil protection answered that night, naming no one → L54 the exact English post as a strip (red: "collapse")
  S('airdrop', L(53, 54), { view: 'facade', sky: DAY, fire: 0.8, smokeSeed: 44, crowd: false, red: 'nose', oblique: { a: 0.72, b: 0, sb: 0 }, ox: 940, plane: { x: 760, y: 230, sc: 0.85, rot: -3 },
    stamp: { text: 'Sécurité civile', sub: ['15 APR 2019 · THAT NIGHT', 'NAMED NO ONE'], at: 'civil', x: 110, y: 330 },
    cam: { x: 960, y: 520, z: 1.06 }, zoomTo: { x: 900, y: 500, z: 1.14, at: 0, dur: 6 }, source: `SOURCE: ${SC} · THE POSTS DID NOT NAME TRUMP (THE ART NEWSPAPER)` },
  { mood: M('tension', 'D', [0.45, 0.6]),
    beats: [['All', 'airdrop', { view: 'facade', sky: DAY, fire: 0.85, smokeSeed: 45, crowd: false, winch: true, plane: { x: 1150, y: 250, sc: 1.0, rot: -3 },
      redSeq: [{ red: 'nose', at: 0 }, { red: 'strip', at: 'collapse' }], stripRed: 'collapse', stripBig: 2, stripAt: 0.2,
      strip: ['“All means are being used, except for water-bombing aircrafts [sic] which, if used, could lead to the', 'collapse of the entire structure of the cathedral.”', `${SC} · ITS ENGLISH POST, VERBATIM`],
      cam: { x: 1040, y: 430, z: 1.32 }, zoomTo: [{ x: 1060, y: 420, z: 1.42, at: 0, dur: 4 }, { x: 1240, y: 250, z: 1.75, at: 'Those', dur: 1.6 }], source: `SOURCE: ${SC} (ENGLISH POST, VIA THE ART NEWSPAPER)` }]] }),

  // L55 — what they warned of: the weight of the water, low, could weaken the structure and hit the buildings nearby
  S('airdrop', L(55), { view: 'flex', dropAt: 'weight', flex: 1, flexAt: 'weaken', flexDur: 1.6, hitX: 50, sprayAt: 'buildings', arrowLen: 14, fire: 0.3, smokeSeed: 52,
    redSeq: [{ red: 'nose', at: 0 }, { red: 'flex', at: 'weaken' }],
    tags: [{ at: [690, 200], to: [96, 150], text: 'What they warned of', sub: 'A DEMONSTRATION · NOT AN EVENT', size: 34, swing: -2 }],
    strip: ['« …le poids de l’eau et l’intensité du largage à basse altitude pourraient en effet fragiliser la structure… »', '« …ET ENTRAÎNER DES DOMMAGES COLLATÉRAUX AUX BÂTIMENTS À PROXIMITÉ »'], stripAt: 'low',
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: { x: 980, y: 560, z: 1.08, at: 'weaken', dur: 2.5 }, source: `ILLUSTRATION OF THE WARNING · ${SC}` }),

  // L56 — the plane lifts away; the fight stays on the ground, one hose at a time
  S('airdrop', L(56), { view: 'plan', fire: 0.85, smokeSeed: 56, plane: { x: 1060, y: 330, sc: 1.05, rot: -90 }, lift: 1, liftAt: 0.1, liftDur: 1.7,
    hose: 1, hoseAt: 'ground-0.5', hoseDur: 1.8, redSeq: [{ red: 'nose', at: 0 }, { red: 'nozzle', at: 'one' }],
    cam: { x: 1000, y: 470, z: 1.08 }, zoomTo: [{ x: 640, y: 860, z: 1.45, at: 'ground-0.3', dur: 1.3 }, { x: 960, y: 720, z: 1.8, at: 'one', dur: 1.5 }],
    source: 'ILLUSTRATION · NO AIR DROPS WERE USED (SÉCURITÉ CIVILE)' }),

  // L57 — the trapped firefighters: 1 s hold, then they all come out alive
  S('airdrop', L(57), { view: 'facade', sky: DAY, fire: 0.7, smokeSeed: 57, crowd: false, parvis: true, square: true, ghost: false, hose: 1, hosePts: [[-80, 1170], [380, 1080], [640, 1030], [860, 994]], rescue: 1, rescueAt: 'They-0.2', rescueDur: 3.0, rescueN: 9,
    redSeq: [{ red: 'ring', at: 0 }],
    chips: [{ text: 'No deaths', sub: '« AUCUNE VICTIME » · BELGA, 15 APR 2019', at: 'alive' }],
    cam: { x: 960, y: 760, z: 1.9 }, zoomTo: [{ x: 960, y: 872, z: 3.0, at: 'trapped', dur: 0.9 }, { x: 960, y: 900, z: 2.1, at: 'They', dur: 2.6 }], source: 'ILLUSTRATION · NO ROUTE OUT IS RECORDED · INK TALLIES: THE TRAPPED CREWS' },
  { ...HOLDS['57'], mood: M('wonder', 'D', 0.4) }),

  // L58 — but the fire is heading for the part they feared most
  S('cathedral', L(58), { view: 'fold', sky: DAY, fire: 0.75, spire: 'gone', clock: null, smokeSeed: 58, smokeStyle: 'lean', wind: 0.6, sideTowerShade: 0.3,
    redSeq: [{ red: 'none', at: 0 }, { red: 'pin', at: 'part' }], redPin: { x: 396, y: 302 },
    tags: [{ at: [396, 302], to: [470, 120], text: 'The north tower', sub: 'THE PART THEY FEARED MOST', inAt: 'part' }],
    cam: { x: 1000, y: 560, z: 1.05 }, zoomTo: { x: 560, y: 420, z: 1.55, at: 'heading', dur: 2.6 }, source: 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE' },
  { mood: M('tension', 'D', [0.45, 0.65], { riser: true }) }),

  // L59–60 — two towers, 69 m; in the north tower, eight bells in a wooden frame
  S('airdrop', L(59, 60), { view: 'facade', sky: DAY, fire: 0.9, smokeSeed: 59, ox: 560, crowd: false, glue: false, bellOrder: 'asc', rule69: true, ruleAt: 0.2, ruleDur: 2.3, louvreDark: true, toy: 1, toyAt: 'north', toyDur: 1.3, toyX: 1200, toyW: 330,
    redSeq: [{ red: 'louvre', at: 0 }, { red: 'toybell', at: 'eight' }],
    tags: [{ at: [1365, 560], to: [1590, 300], text: 'The bell frame', sub: '8 BELLS · OAK FRAME', size: 28, swing: 2, inAt: 'wooden' }],
    cam: { x: 560, y: 860, z: 1.9 }, zoomTo: [{ x: 600, y: 420, z: 1.75, at: 0.2, dur: 2.4 }, { x: 960, y: 540, z: 1.0, at: 'Two-0.2', dur: 2.4 }, { x: 990, y: 560, z: 1.1, at: 'eight', dur: 2.2 }], source: 'ILLUSTRATION · TOWERS 69 M (VILLE DE PARIS) · BELL FRAME AS A SEPARATE TOY' }),

  // L61 — the range, smallest to largest (no per-bell weights on screen)
  S('bellFrame', L(61), { ...BF, sky: DAY, smokeSeed: 61,
    rangeBar: { at: 'range', lo: '≈ 0.78 T', hi: 'JUST OVER 4 T', kicker: '8 BELLS · 2013 · REBÂTIR; THE LOCAL/AFP, 12 SEP 2024', y: 690, sc: 1.0, H: 230, labelY: 200, labelSize: 26, hiDx: 60, tick: [102, 146], ringY: 124, ringR: 20, kickerSize: 19 },
    cam: { x: 1160, y: 250, z: 2.1 }, zoomTo: { x: 760, y: 520, z: 1.5, at: 'three', dur: 2.6 }, source: 'PAPER MODEL · THE 8 NORTH-TOWER BELLS, 2013 · RANGE ONLY' }),

  // L62 ★ dusk: the north tower already on fire (its own wall, below the frame) → L63 the loop moves from the bell to the oak beam
  S('bellFrame', L(62, 63), { ...BF, sky: DUSK, smokeSeed: 62, towerFlame: 1, towerFlameAt: 'north', towerFlameDur: 1.4, frameSmoke: 1, frameSmokeAt: 'half', frameSmokeDur: 3,
    loop: 'flame', loopAt: 'fire', chips: [{ text: 'North tower already on fire', sub: 'SMOKE FROM ITS WOODEN FRAME\n≈ 20:30 · NYT', at: 'Times', x: 1340, y: 300 }],
    cam: { x: 960, y: 640, z: 1.04 }, zoomTo: { x: 1000, y: 760, z: 1.16, at: 'north', dur: 3 }, source: `PAPER MODEL · ${NYT} · THE FRAME ITSELF NOT YET BURNING` },
  { mood: M('urgency', 'D', [0.6, 0.75], { hit: true }),
    beats: [['bells', 'bellFrame', { ...BF, sky: DUSK, smokeSeed: 63, towerFlame: 0.8, frameSmoke: 0.8, loopSeq: [{ to: 'bell', at: 0.15 }, { to: 'beam', at: 'oak' }], loopBeamRx: 0.42, loopSlide: 0.9, pencilHold: true,
      cam: { x: 900, y: 640, z: 2.25 }, zoomTo: { x: 900, y: 640, z: 2.1, at: 'oak', dur: 1.6 }, source: 'PAPER MODEL · OAK FRAME, BRASS PINS · THE BELLS STAY ON THEIR PINS' }]] }),

  // L64 — the chain officials feared → "And": the rest of the cathedral
  S('bellFrame', L(64), { ...BF, layout: 'pair', sky: DUSK, smokeSeed: 64, domino: 1, dominoAt: 'goes', dominoDur: 2.2, chainAt: ['frame', 'fall', 'goes', null], chainTagX: 175,
    chainLabels: ['Frame', 'Bells', 'North tower', 'Cathedral'], chainRed: 0, chainTag: 'Officials’ fear', chainTagSub: 'not an engineering finding',
    strip: '“If the bells fall, this tower falls.” · Gen. Gallet, 15 Apr 2019', stripSub: '« SI LES BOURDONS S’EFFONDRENT C’EST L’EFFONDREMENT DE CETTE TOUR » · PUBLIC SÉNAT',
    stripAt: 'bells', stripDur: '45%', stripY: 44, cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 572, z: 1.05, at: 'frame', dur: 5 },
    source: 'PAPER MODEL · OFFICIALS’ FEAR, NOT AN EVENT · “BOURDONS”: HIS WORD; THE NORTH TOWER HOLDS THE 8 SMALLER BELLS' },
  { beats: [['And', 'cathedral', { view: 'side', sky: DUSK, fire: 0.9, roofGone: 0.55, spire: 'gone', clock: null, smokeSeed: 65, crowd: false, red: 'pin', redPin: { x: 460, y: 330, sc: 2, pulse: true },
    tags: [{ at: [462, 310], to: [600, 140], text: 'If the towers go', sub: 'OFFICIALS FEARED THE REST COULD FOLLOW' }],
    cam: { x: 1000, y: 560, z: 1.22 }, zoomTo: { x: 960, y: 560, z: 1.02, at: 0.2, dur: 4.5 }, source: 'ILLUSTRATION · OFFICIALS’ FEAR, NOT AN ENGINEERING FINDING' }]] }),

  // L66 — the chapter's one full card: "a chain-reaction collapse"
  S('quote', L(66), { text: 'From the moment we lose the war of the bell towers, we lose the cathedral, because it’s a chain-reaction collapse.', fr: null,
    by: 'José Vaz de Matos', role: 'Culture ministry fire expert', date: 'AP, 17 Apr 2019 · AP translation', highlight: ['chain-reaction'], hlAt: 'lose@1', cy: 560,
    cam: { push: 0.1, dx: -30, dy: 12 }, source: 'SOURCE: ASSOCIATED PRESS, 17 APR 2019 · AP TRANSLATION (NO FRENCH ORIGINAL ON RECORD)' },
  { mood: M('tension', 'D', [0.5, 0.6]) }),

  // L67 — Gallet wasn't sure they could stop it reaching the frame; the only way to find out was to climb into it
  S('bellFrame', L(67), { ...BF, sky: DUSK, smokeSeed: 71, towerFlame: 0.85, frameSmoke: 0.9, smokeCard: 1, smokeCardAt: 'reporters', smokeCardDur: 1.6, smokeCardA: 0.34, smokeSil: false, bellOutline: { sc: 1.5, lw: 4, solid: true },
    lowStrip: ['“We’re not sure we can stop it spreading to the north belfry.” · Gen. Gallet, 15 Apr 2019', '« ON N’EST PAS SÛR DE POUVOIR ENRAYER LA PROPAGATION AU BEFFROI NORD » · PUBLIC SÉNAT'],
    lowStripAt: 'sure', lowStripOutAt: 'only-0.3', tally: { at: 'only', x: 430, y: 1250, sc: 1.8, tilt: -8, tableTo: 2400 },
    cam: { x: 960, y: 560, z: 1.04 }, zoomTo: [{ x: 940, y: 600, z: 1.1, at: 0, dur: 5 }, { x: 960, y: 950, z: 1.0, at: 'only', dur: 1.4 }, { x: 940, y: 900, z: 1.06, at: 'climb', dur: 1.6 }],
    source: 'PAPER MODEL · THE FRAME NOT YET BURNING · GALLET, 15 APR 2019 (PUBLIC SÉNAT)' },
  { mood: M('urgency', 'D', [0.6, 0.8], { riser: true }) }),
]);
export default shots;
