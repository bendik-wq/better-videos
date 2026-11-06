// Chapter 5 shots: 5. WHAT HELD (file order 97, 98, 99, 100, 107, 109, 110, 102, 103, 104, 105, 105a, 111, 112).
// Shot writer's list, after VISUALS.md rev 9 and OUTLINE.md §5 (CH.5 9:48–12:13). Most pictures use the chapter's own set
// `held` (sets/nd-held.js: separate tabletop toys and cards, never a section of the building).
// Light: L97–L100 the neutral drafting table (day paper); L107 night plate (paper night); L109 day; L110 morning of 16 Apr;
// L102–L103 day under the 14 OCT 2019 survey flap; L104 day TYPE card; L105–L105a night briefing table / model callbacks;
// L111–L112 morning.
// Fact locks: one red thing per frame; no sectioned building (the vault is a demonstration toy, the plan is a plan); the
// crossing hole appears only as the L99 ring and the untimed L100 note, with both versions; the bell never slips (L112 swings
// once on its pin and stops); no blame; the president is a seated faceless figure; the Nuñez bracket hangs over the whole model
// between the two wheels and touches neither; "from collapse" never in quote marks as anyone's words; the AP plate is a
// reporter's summary in plain type.
//
//   ch5   chapter card (case-open), music drop: mystery
//   s501  L97   the demonstration shell; on "barrier" a flame band sits on its back, the space below stays clean; Heyman strip
//   s502  L98   the tweezer arm drops the full rain; most sticks stop on the shell; one breaks through (red)
//   s503  L99   the plan: a red ring ticks hole to hole (crossing → nave bay → north arm), camera follows
//   s504  L100  DOC: the survey sentence, French + English, red underline "et non par les effets du feu"; the crossing note
//   s505  L107  night plate: the north-arm gable tips toward the street and settles back (red tilt arc); cracks chip. tension
//   s506  L109  one flying buttress pressing on the wall, the empty counter-arrow slot (red). wonder
//               → "So": both rows of flyers, 28 larch arches slide in (counter), push to the 28th on "Each" (> 8 t)
//   s507  L110  the roofless model by morning: the last flames fold flat, badge 09:50 (red underline), fire-out chip
//               → "In": the dented copper rooster on a plinth in the rubble (red: the dent); its hatch opens on "relics"
//   s508  L102  the bell-frame toy alone, flap 14 OCT 2019; the loupe opens right on the charred SE corner (rides with the camera),
//               the red loop drawn round its rim; stair charred, its label above it
//   s509  L103  beams charred (no red yet); on "Two" push to two heat-scarred bells (red: one), whole frame kept in frame
//               → "fire": hard cut wide for the flame and water ghosts; on "held" the frame lit warm, a teal tick at every pin
//   s510  L104  TYPE "Thirty minutes from collapse?" alone, pushed tight on the "?". tension riser
//               → "people": wider, plates GALLET · NUÑEZ · NYT; the AP plate on "said" (padOut 1.0)
//   s511  L105  the night table: GALLET and PRESIDENT MACRON seated opposite; DO NOTHING · 05:00, the towers fade (red: north tower)
//               → "next": the bracket drops over the whole model between the wheels (red); Nuñez chip
//               → "Three" (same clip, no cut): the wheels + tags fade, the NYT headline card drops in over the model (2°, 1400 wide;
//               red → its underline)
//   s512  L105a its own framing: low and tight on the empty bracket (model cropped below); on "measure" the inside is searched
//               (a hatch scans and erases) and a hard push → "waited": the table, SEND THEM IN face up (red edge only)
//   s513  L111  "The building held.": its own angle (lower, longer axonometry), warm morning halftone from the east, pull-out
//               z 1.4 (whole north tower) → 1.05, large red pin on the north louvre, no chip. triumph hit
//   s514  L112  the façade on its parvis by morning, push from 0 to a bell in the north louvre (large red ring) → "eight": the whole
//               frame toy (8 bells, flap 15 APR 2019 →), then on "silent" it pushes to the one red bell as it swings once on its pin
//               and stops (heat scars kept). melancholy, ends on a cut
// Description (not on screen): the organ line (spared, coated in lead dust · bilan à 6 mois); the PA wording "it all came
// down to 15 to 30 minutes"; the L102 continuation « …l'escalier qui mène au second niveau de cloches est brûlé et fragile ».
// Chips: 42 px headline / 22 px sub, one line each (phone legibility).
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(5);

const BILAN = 'BILAN À 6 MOIS · STATE PRESS KIT, 14 OCT 2019';
const HEY = 'J. HEYMAN · THE STRUCTURAL ENGINEER (IStructE), JUL 2019';
const NORTH_LOUVRE = { x: 410, y: 333 }; // world point of the north tower's louvre in the L111 fold angle (set below)

export const shots = check([
  CH('What Held', 'what the survey found', { lit: 'none', delay: '+30', red: 'num', numFrom: 4, wheelRoll: false, at: 0.05 }, M('mystery', 'D', [0.25, 0.4])),

  // L97 — the vault's second job: a fire barrier (function first), Heyman's byline last
  S('held', L(97), { view: 'vault', band: 1, bandAt: 'barrier', bandDur: 1.8, red: 'label',
    label: { text: 'FIRE BARRIER', sub: 'BETWEEN THE ROOF AND THE CHURCH', red: 'BARRIER', at: 'barrier', x: 130, y: 150 },
    strip: ['"one function of the stone vault is to provide a fire-resistant barrier', 'between the outer roof and the church"', 'Jacques Heyman · The Structural Engineer, Jul 2019'], stripAt: 'Jacques', stripBig: 2,
    cam: { x: 960, y: 520, z: 1.02 }, zoomTo: [{ x: 930, y: 470, z: 1.12, at: 0, dur: 3.2 }, { x: 960, y: 600, z: 1.0, at: 'Jacques', dur: 1.0 }],
    source: 'A DEMONSTRATION TOY, NOT THE BUILDING · ' + HEY }),

  // L98 — the full rain, largely caught; one stick breaks through. Opens on L97's last framing (no visible cut), then pushes in.
  S('held', L(98), { view: 'vault', arm: 1, armAt: 0, armDur: 0.7, rain: 1, rainAt: 'burning', rainDur: 2.4, red: 'stick', shellLabel: 'Vault shell', belowX: 740,
    strip: ['"largely caught by the masonry vaults"', 'Jacques Heyman · IStructE, Jul 2019'], stripAt: 'largely', stripX: 96, stripY: 104,
    cam: { x: 960, y: 600, z: 1.0 }, zoomTo: { x: 980, y: 520, z: 1.16, at: 'came', dur: 1.6 },
    source: 'A DEMONSTRATION TOY, NOT THE BUILDING · ' + HEY }),

  // L99 — the three holes, one per sentence, in the VO's order (pushes capped at 1.15 and kept left so the sheet title stays in frame; compass bottom-right)
  S('held', L(99), { view: 'plan', red: 'ring', count: true, northAt: [1680, 860],
    holes: [{ where: 'crossing', at: 'arms', label: 'Where the arms meet', to: [1150, 650] },
      { where: 'nave', at: 'bay', label: 'Nave', sub: 'ONE BAY', to: [470, 700] },
      { where: 'north', at: 'end', label: 'North arm', sub: 'ITS LAST BAY', to: [1140, 160] }],
    cam: { x: 960, y: 545, z: 1.0 }, zoomTo: [{ x: 955, y: 560, z: 1.15, at: 'arms', dur: 0.9 }, { x: 800, y: 580, z: 1.15, at: 'bay', dur: 0.9 },
      { x: 955, y: 440, z: 1.15, at: 'end', dur: 0.9 }, { x: 960, y: 545, z: 1.02, at: 'north+0.9', dur: 1.2 }],
    source: 'PLAN AFTER THE BILAN À 6 MOIS (14 OCT 2019) AND HEYMAN (2019) · NOT TO SCALE' }),

  // L100 — "Here's the detail": punched by falling timber, not burned through (DOC, +C clip); the crossing note, both versions
  S('doc', L(100), { kind: 'report', head: 'Bilan à 6 mois · Notre-Dame de Paris', meta: ['STATE PRESS KIT', '14 OCT 2019'], inAt: 0.05, typeAt: 0.35,
    lines: [{ t: '« tous les effondrements de voûte ont été causés par un choc consécutif à la chute d\'éléments de charpente, et non par les effets du feu »', style: 'serif' },
      { t: 'every vault collapse was caused by the impact of falling roof timbers, not by the effects of the fire', style: 'tech', gap: 30 },
      { t: '⚠ The crossing vault fell: with the spire (Gallet, 2020) · later that night (DRAC, 2024)', style: 'tech', gap: 64, box: true, at: '40%' }],
    highlight: 'et non par les effets du feu', at: 'not', label: 'RECREATED TEXT · OUR TRANSLATION BELOW',
    cam: { push: 0.06, dx: 20, dy: 8 }, source: 'SOURCE: ' + BILAN + ' · DRAC 2024 · GALLET, FRANCEINFO 2020' }),

  // L107 — night plate: the gable tips toward the street, then settles back; cracks (3.5 px ink). One chip at a time.
  S('held', L(107), { view: 'gable', sky: 'night', tip: 8, tipAt: 'tip', tipDur: 2.4, cracks: 1, cracksAt: 'settle+0.4', cracksDur: 1.4, crackW: 3.6, red: 'arc',
    armTag: { at: [690, 330], to: [70, 280], size: 32 }, streetAt: [250, 800],
    chips: [{ text: 'Witnesses: it tipped, then settled back', sub: 'BILAN À 6 MOIS', at: 'Witnesses', untilAt: 'settle+0.3' },
      { text: '« fissures horizontales et verticales »', sub: 'THE GABLE · BILAN À 6 MOIS', at: 'settle+0.5' }],
    cam: { x: 860, y: 540, z: 1.0 }, zoomTo: [{ x: 820, y: 500, z: 1.1, at: 0, dur: 3.0 }, { x: 780, y: 480, z: 1.18, at: 'settle', dur: 1.6 }],
    source: 'NIGHT OF 15 APR 2019 · ILLUSTRATION, NOT TO SCALE · ' + BILAN }, { padOut: 0.6, mood: M('tension', 'D', [0.35, 0.5]) }),

  // L109 — buttresses pressing, nothing pushing back → 28 larch arches, > 8 t each
  S('held', L(109), { view: 'arches', mode: 'close', arrows: 1, arrowsAt: 'flying', arrowsDur: 0.8, red: 'slot', buttressAt: [712, 296], buttressTo: [200, 200],
    chips: [{ text: 'Roofs gone: their weight on the walls', sub: 'REBÂTIR NOTRE-DAME', at: 'nothing', x: 96, y: 846 }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 1040, y: 480, z: 1.08, at: 'pressing', dur: 3.0 },
    source: 'A DEMONSTRATION TOY: ONE FLYING BUTTRESS · FORCES SIMPLIFIED · REBÂTIR NOTRE-DAME' }, { mood: M('wonder', 'F', [0.35, 0.5]),
    beats: [['So', 'held', { view: 'arches', mode: 'row', arches: 1, archesAt: 'carpenters', archesDur: 3.6, red: 'arch', weightAt: 'Each', weightTo: [1560, 420], weightSize: 42, weightSub: 'LARCH · REBÂTIR',
      cam: { x: 960, y: 640, z: 1.0 }, zoomTo: { x: 1250, y: 640, z: 1.35, at: 'Each', dur: 1.2 },
      source: '28 LARCH CENTRING ARCHES, 2 JUL 2019 – 28 FEB 2020 · REBÂTIR NOTRE-DAME' }]] }),

  // L110 — out the next morning; the rooster; the relics
  S('cathedral', L(110), { view: 'fold', sky: 'day', fire: 0.22, fireOutAt: 'out', fireOutDur: 1.4, smoke: 0.5, roofGone: 1, spire: 'gone', smokeSeed: 51, smokeStyle: 'column',
    clock: '09:50', red: 'clock', kicker: 'TUESDAY 16 APR 2019 · MORNING',
    chips: [{ text: 'Fire out: 16 Apr 2019 ≈ 09:50', sub: 'DRAC · VILLE DE PARIS GIVES ≈ 10:00', at: 'out', big: true }],
    foreground: false, cam: { x: 960, y: 470, z: 1.0 }, zoomTo: { x: 990, y: 455, z: 1.08, at: 0, dur: 4.0 }, source: 'ILLUSTRATION · TIMES: DRAC; VILLE DE PARIS' },
    { beats: [['In', 'held', { view: 'rooster', red: 'dent', dentAt: 'Dented', hatchAt: 'relics',
      cam: { x: 960, y: 640, z: 1.0 }, zoomTo: [{ x: 900, y: 660, z: 1.12, at: 'Dented', dur: 1.0 }, { x: 1040, y: 640, z: 1.08, at: 'diocese', dur: 1.2 }],
      source: 'CULTURE MINISTRY VIA LE PARISIEN, 16–17 APR 2019 · DIOCESE OF PARIS' }]] }),

  // L102 — the survey flap; the loupe lens sits ON the charred south-east corner, inside the red loop (track: it rides with the camera); the flap
  // retires when the quote chip arrives. The chip's continuation (« …l'escalier qui mène au second niveau de cloches est
  // brûlé et fragile ») goes in the description.
  S('held', L(102), { view: 'frame', flap: '14 OCT 2019', flapSub: 'POST-FIRE SURVEY', flapAt: 0.1, flapOutAt: 'attacked-0.3', stripToy: true, coilAt: [330, 790], coilSc: 0.7, char: 0.25,
    corner: 1, cornerAt: 'attacked', cornerDur: 0.8, stair: 1, stairAt: 'stair', stairDur: 0.8, red: 'corner', loopAt: 'corner', stairLabel: true,
    loupe: { track: true, x: 1180, y: 690, r: 8, z: 2.0, fx: 1248, fy: 680 }, loupeTo: { r: 118, at: 'corner', dur: 0.7 },
    chips: [{ text: '« Les flammes ont attaqué l\'angle sud-est du beffroi… »', sub: 'BILAN À 6 MOIS · 14 OCT 2019', at: 'attacked', x: 96 }],
    cam: { x: 960, y: 500, z: 0.94 }, zoomTo: { x: 1040, y: 520, z: 1.04, at: 'corner', dur: 2.4 },
    source: 'PAPER MODEL · ' + BILAN }),

  // L103 — charred but not weakened; two bells scarred; the fire reached it, so did the water; the frame held.
  // One chip at a time, docked bottom-left; the push on "Two" is capped at 1.25 and aimed low.
  S('held', L(103), { view: 'frame', stripToy: false, char: 0.5, corner: 1, stair: 1, scars: [0, 2], scarsAt: 'Two', redBell: 2, red: 'none', redSeq: [{ at: 'Two', red: 'bell' }],
    chips: [{ text: '"Some beams were charred, but not weakened enough to threaten the frame\'s stability"', sub: BILAN, at: 0.3, untilAt: 'Two-0.4', x: 96, y: 850 },
      { text: 'Two of the eight bells: heat damage', sub: 'REBÂTIR NOTRE-DAME', at: 'Two', x: 96, y: 850 }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 900, y: 590, z: 1.3, at: 'Two', dur: 1.0 },
    source: 'PAPER MODEL · ' + BILAN + ' · REBÂTIR' }, { padOut: 0.5,
    // → "fire": hard cut wide (the whole frame and the air above it) for the flame and water ghosts; on "held" it lights warm, a tick at every pin
    beats: [['fire', 'held', { view: 'frame', stripToy: false, char: 0.5, corner: 1, stair: 1, scars: [0, 2], redBell: 2, red: 'bell',
      ghostFlameAt: 'reached', ghostWaterAt: 'water', litAt: 'held', pinTicks: true,
      chips: [{ text: 'Water at the top of the towers', sub: 'CULTURE MINISTRY', at: 'water', untilAt: 'held-0.4', x: 96, y: 850 }],
      cam: { x: 960, y: 470, z: 0.86 }, zoomTo: { x: 960, y: 520, z: 1.04, at: 'held', dur: 2.0 },
      source: 'PAPER MODEL · ' + BILAN + ' · CULTURE MINISTRY' }]] }),

  // L104 — the question alone and tight (push on the "?") → on "people" cut wider: three plates, then the AP plate on "said"
  S('held', L(104), { view: 'type', text: 'Thirty minutes from collapse?', textAt: 0.1, red: 'q',
    cam: { x: 990, y: 330, z: 1.1 }, zoomTo: { x: 1010, y: 330, z: 1.22, at: 0.4, dur: 3.2 },
    source: 'THE QUESTION · ON THE RECORD BELOW' },
    { padOut: 1.0, mood: M('tension', 'D', [0.4, 0.65], { riser: true }),
      beats: [['people', 'held', { view: 'type', text: 'Thirty minutes from collapse?', textAt: 0, red: 'q',
        plates: [{ text: 'GALLET', sub: 'FIRE CHIEF', at: 0.15 }, { text: 'NUÑEZ', sub: 'DEPUTY MINISTER', at: 0.5 }, { text: 'NYT', sub: '16 JUL 2019', at: 0.85 }],
        ap: { text: 'It had been within 30 minutes of collapse.', sub: 'AP · 17 APR 2019 · REPORTER\'S SUMMARY', at: 'said' },
        cam: { x: 960, y: 560, z: 0.96 }, zoomTo: { x: 960, y: 600, z: 1.02, at: 'said', dur: 2.4 },
        source: 'GALLET: FRANCEINFO, 15 APR 2020 · NUÑEZ: BBC, 16 APR 2019 · NYT, 16 JUL 2019 · AP, 17 APR 2019' }]] }),

  // L105 — three on-record verdicts: the DO NOTHING card → "next": the bracket over the model (Nuñez chip; the PA wording
  // goes in the description) → on "Three" the NYT headline card slides in tilted over the same model (no cut); the red
  // passes from the bracket to the headline's underline.
  S('held', L(105), { view: 'table', sky: 'night', card: 'donothing', red: 'tower', fadeAt: 'both', cardAt: 0.1,
    figures: [{ x: 560, plate: 'GEN. GALLET · FIRE BRIGADE', gaze: 0 }, { x: 1360, plate: 'PRESIDENT MACRON', gaze: Math.PI }],
    chips: [{ text: 'Gallet, his own account', sub: 'FRANCEINFO, 15 APR 2020', at: 'warned', x: 96, y: 846 }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 600, z: 1.1, at: 'both', dur: 2.2 },
    source: 'ILLUSTRATION · GALLET\'S OWN ACCOUNT, FRANCEINFO, 15 APR 2020' },
    { beats: [
      ['next', 'held', { view: 'margin', sky: 'night', bracketAt: 'minister', red: 'bracket', redSeq: [{ at: 'Three', red: 'under' }],
        chips: [{ text: 'Nuñez · 16 Apr 2019, the next day', sub: 'WHICH MINUTES: NOT STATED · BBC', at: 'Nuñez', untilAt: 'Three-0.2' }],
        headline: { kicker: 'THE NEW YORK TIMES · 16 JUL 2019 · HEADLINE', text: ['Notre-Dame Came Far Closer', 'to Collapsing Than People Knew'], at: 'Three', underline: 'Far Closer', underAt: 'closer', w: 1400, size: 92, tilt: -2, y: 540 },
        hideAt: 'Three',
        cam: { x: 960, y: 540, z: 1.0 }, zoomTo: [{ x: 960, y: 520, z: 1.05, at: 0, dur: 6 }, { x: 960, y: 540, z: 1.0, at: 'Three', dur: 0.9 }],
        source: 'NUÑEZ: BBC NEWS, 16 APR 2019 · NYT, 16 JUL 2019, HEADLINE ONLY · ILLUSTRATION' }],
    ] }),

  // L105a — nobody can measure it (the same model, the card gone, the bracket's inside empty) → nobody waited
  S('held', L('105a'), { view: 'margin', sky: 'night', empty: true, bracketAt: 0, red: 'bracket', searchAt: 'measure', searchDur: 1.8, wheelTags: false,
    cam: { x: 960, y: 340, z: 1.4 }, zoomTo: { x: 960, y: 330, z: 1.72, at: 'measure', dur: 1.3 }, source: 'ILLUSTRATION · NOBODY CAN MEASURE IT' },
    { beats: [['waited', 'held', { view: 'table', sky: 'night', card: 'send', red: 'card', cardAt: 0,
      cam: { x: 960, y: 640, z: 1.14 }, zoomTo: { x: 960, y: 680, z: 1.22, at: 0, dur: 3 }, source: 'ILLUSTRATION · THE BRIEFING, NIGHT OF 15 APR 2019' }]] }),

  // L111 — the building held: its own composition. A lower, longer axonometric angle (more of the south flank and the
  // Seine, the skyline behind), low warm morning sun from the east, a strong pull-out from the north louvre (red notch).
  // The organ line (spared, coated in lead dust · bilan à 6 mois) goes in the description.
  S('cathedral', L(111), { view: 'fold', sky: 'day', morning: 0.55, fa: [0.46, 0.26], sa: [0.94, -0.09], k: 7.2, ox: 520, fire: 0, smoke: 0, roofGone: 1, spire: 'gone', clock: null, foreground: false,
    red: 'pin', redPin: { ...NORTH_LOUVRE, sc: 1.9 },
    cam: { x: 700, y: 470, z: 1.4 }, zoomTo: { x: 980, y: 520, z: 1.05, at: 0.1, dur: 3.0 }, source: 'ILLUSTRATION · ' + BILAN },
    { min: 3.4, mood: M('triumph', 'D', [0.5, 0.6], { hit: true }) }),

  // L112 — the north tower standing → its eight bells silent: the frame toy low and tight on the one red bell and its pin,
  // the heat scars from L103 kept; the bell swings once on its pin from "bells" and stops; flap 15 APR 2019 →
  S('airdrop', L(112), { view: 'facade', sky: 'day', fire: 0, smoke: 0, ghost: true, bellPeek: true, bellRingSc: 1.5, red: 'bell', parvis: true, crowd: false, clock: null, smokeSeed: 7,
    cam: { x: 940, y: 520, z: 1.05 }, zoomTo: { x: 880, y: 420, z: 1.6, at: 0, dur: 2.4 }, source: 'ILLUSTRATION · PAPER MODEL' },
    { padOut: 1.0, mood: M('melancholy', 'D', [0.35, 0.2], { ending: 'cut' }),
      beats: [['eight', 'held', { view: 'frame', char: 0.3, corner: 0.7, stair: 0.6, scars: [0, 2], swingBell: 0, swingAt: 'silent', swingAmp: 12, redBell: 0, red: 'bell',
        flap: '15 APR 2019 →', flapSub: 'THE BELLS FALL SILENT', flapAt: 0.1,
        cam: { x: 990, y: 520, z: 0.96 }, zoomTo: { x: 700, y: 600, z: 1.8, at: 'silent', dur: 2.0 }, source: 'PAPER MODEL · BILAN À 6 MOIS' }]] }),
]);
export default shots;
