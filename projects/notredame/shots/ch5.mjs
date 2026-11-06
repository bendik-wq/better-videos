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
//   s508  L102  the bell-frame toy alone, flap 14 OCT 2019; loupe opens on the charred SE corner, stair charred (red loop)
//   s509  L103  pull back: beams charred; push to two heat-scarred bells (red: one); ghosts of the flame band and the
//               water; on "held" the frame lit full and steady
//   s510  L104  TYPE "Thirty minutes from collapse?"; plates GALLET · NUÑEZ · NYT; the AP plate on "record". tension riser
//   s511  L105  the night table: DO NOTHING · 05:00, the towers fade (red: north tower)
//               → "next": the bracket drops over the whole model between the wheels (red); Nuñez chip
//               → "Three": the NYT headline card (red underline)
//   s512  L105a the bracket close, its inside empty → "waited": the table, SEND THEM IN face up (red edge)
//   s513  L111  "The building held.": the roofless model standing in morning light, pull-out, inventory chip. triumph hit
//   s514  L112  the façade by morning, a bell glimpsed in the north louvre (red) → "eight": the frame toy alone, the
//               bell swings once on its pin and stops; flap 15 APR 2019 →. melancholy, ends on a cut
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(5);

const BILAN = 'BILAN À 6 MOIS · STATE PRESS KIT, 14 OCT 2019';
const HEY = 'J. HEYMAN · THE STRUCTURAL ENGINEER (IStructE), JUL 2019';

export const shots = check([
  CH('What Held', 'what the survey found', { lit: 'none', delay: '+30', red: 'num' }, M('mystery', 'D', [0.25, 0.4])),

  // L97 — the vault's second job: a fire barrier (function first), Heyman's byline last
  S('held', L(97), { view: 'vault', band: 1, bandAt: 'barrier', bandDur: 1.8, red: 'label',
    label: { text: 'FIRE BARRIER', sub: 'BETWEEN THE ROOF AND THE CHURCH', red: 'BARRIER', at: 'barrier', x: 130, y: 150 },
    strip: ['"one function of the stone vault is to provide a fire-resistant barrier', 'between the outer roof and the church"', 'Jacques Heyman · The Structural Engineer, Jul 2019'], stripAt: 'Jacques', stripBig: 2,
    cam: { x: 960, y: 520, z: 1.02 }, zoomTo: [{ x: 930, y: 470, z: 1.12, at: 0, dur: 3.2 }, { x: 960, y: 560, z: 1.0, at: 'Jacques', dur: 1.0 }],
    source: 'A DEMONSTRATION TOY, NOT THE BUILDING · ' + HEY }),

  // L98 — the full rain, largely caught; one stick breaks through
  S('held', L(98), { view: 'vault', arm: 1, armAt: 0, armDur: 0.7, rain: 1, rainAt: 'burning', rainDur: 2.4, red: 'stick', shellLabel: 'Vault shell',
    strip: ['"largely caught by the masonry vaults"', 'Jacques Heyman · IStructE, Jul 2019'], stripAt: 'largely', stripTop: true,
    cam: { x: 1000, y: 440, z: 1.26 }, zoomTo: { x: 980, y: 520, z: 1.16, at: 'came', dur: 1.6 },
    source: 'A DEMONSTRATION TOY, NOT THE BUILDING · ' + HEY }),

  // L99 — the three holes, one per sentence, in the VO's order
  S('held', L(99), { view: 'plan', red: 'ring', count: true,
    holes: [{ where: 'crossing', at: 'arms', label: 'Where the arms meet', to: [1150, 650] },
      { where: 'nave', at: 'bay', label: 'Nave', sub: 'ONE BAY', to: [470, 700] },
      { where: 'north', at: 'end', label: 'North arm', sub: 'ITS LAST BAY', to: [1140, 160] }],
    cam: { x: 960, y: 545, z: 1.0 }, zoomTo: [{ x: 1000, y: 560, z: 1.22, at: 'arms', dur: 0.9 }, { x: 780, y: 580, z: 1.22, at: 'bay', dur: 0.9 },
      { x: 1000, y: 430, z: 1.22, at: 'end', dur: 0.9 }, { x: 960, y: 545, z: 1.02, at: 'north+0.9', dur: 1.2 }],
    source: 'PLAN AFTER THE BILAN À 6 MOIS (14 OCT 2019) AND HEYMAN (2019) · NOT TO SCALE' }),

  // L100 — "Here's the detail": punched by falling timber, not burned through (DOC, +C clip); the crossing note, both versions
  S('doc', L(100), { kind: 'report', head: 'Bilan à 6 mois · Notre-Dame de Paris', meta: ['STATE PRESS KIT', '14 OCT 2019'], inAt: 0.05, typeAt: 0.35,
    lines: [{ t: '« tous les effondrements de voûte ont été causés par un choc consécutif à la chute d\'éléments de charpente, et non par les effets du feu »', style: 'serif' },
      { t: 'every vault collapse was caused by the impact of falling roof timbers, not by the effects of the fire', style: 'small' },
      { t: '⚠ The crossing vault fell: with the spire (Gallet, 2020) · later that night (DRAC, 2024)', style: 'small', at: 'burned' }],
    highlight: 'et non par les effets du feu', at: 'not', label: 'RECREATED TEXT · OUR TRANSLATION BELOW',
    cam: { push: 0.06, dx: 20, dy: 8 }, source: 'SOURCE: ' + BILAN + ' · DRAC 2024 · GALLET, FRANCEINFO 2020' }),

  // L107 — night plate: the gable tips toward the street, then settles back; cracks
  S('held', L(107), { view: 'gable', sky: 'night', tip: 8, tipAt: 'tip', tipDur: 2.4, cracks: 1, cracksAt: 'settle+0.4', cracksDur: 1.4, red: 'arc',
    chips: [{ text: 'Witnesses: it tipped, then settled back', sub: 'BILAN À 6 MOIS', at: 'Witnesses' }, { text: '« fissures horizontales et verticales »', sub: 'THE GABLE · BILAN À 6 MOIS', at: 'settle+0.5' }],
    cam: { x: 860, y: 540, z: 1.0 }, zoomTo: [{ x: 820, y: 500, z: 1.1, at: 0, dur: 3.0 }, { x: 760, y: 470, z: 1.2, at: 'settle', dur: 1.6 }],
    source: 'NIGHT OF 15 APR 2019 · ILLUSTRATION, NOT TO SCALE · ' + BILAN }, { padOut: 0.6, mood: M('tension', 'D', [0.35, 0.5]) }),

  // L109 — buttresses pressing, nothing pushing back → 28 larch arches, > 8 t each
  S('held', L(109), { view: 'arches', mode: 'close', arrows: 1, arrowsAt: 'flying', arrowsDur: 0.8, red: 'slot',
    chips: [{ text: 'Without the roofs, their weight came to bear on the walls', sub: 'REBÂTIR NOTRE-DAME', at: 'nothing' }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 1060, y: 470, z: 1.14, at: 'pressing', dur: 3.0 },
    source: 'A DEMONSTRATION TOY: ONE FLYING BUTTRESS · FORCES SIMPLIFIED · REBÂTIR NOTRE-DAME' }, { mood: M('wonder', 'F', [0.35, 0.5]),
    beats: [['So', 'held', { view: 'arches', mode: 'row', arches: 1, archesAt: 'carpenters', archesDur: 3.6, red: 'arch', weightAt: 'Each',
      cam: { x: 960, y: 640, z: 1.0 }, zoomTo: { x: 1500, y: 680, z: 1.55, at: 'Each', dur: 1.2 },
      source: '28 LARCH CENTRING ARCHES, 2 JUL 2019 – 28 FEB 2020 · REBÂTIR NOTRE-DAME' }]] }),

  // L110 — out the next morning; the rooster; the relics
  S('cathedral', L(110), { view: 'fold', sky: 'day', fire: 0.22, fireOutAt: 'out', fireOutDur: 1.4, smoke: 0.5, roofGone: 1, spire: 'gone', smokeSeed: 51, smokeStyle: 'column',
    clock: '09:50', red: 'clock', kicker: 'TUESDAY 16 APR 2019 · MORNING',
    chips: [{ text: 'Fire out: 16 Apr 2019 ≈ 09:50', sub: 'DRAC · VILLE DE PARIS GIVES ≈ 10:00', at: 'out' }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 990, y: 540, z: 1.08, at: 0, dur: 4.0 }, source: 'ILLUSTRATION · TIMES: DRAC; VILLE DE PARIS' },
    { beats: [['In', 'held', { view: 'rooster', red: 'dent', dentAt: 'Dented', hatchAt: 'relics',
      cam: { x: 960, y: 600, z: 1.0 }, zoomTo: [{ x: 900, y: 560, z: 1.18, at: 'Dented', dur: 1.0 }, { x: 1040, y: 520, z: 1.12, at: 'diocese', dur: 1.2 }],
      source: 'CULTURE MINISTRY VIA LE PARISIEN, 16–17 APR 2019 · DIOCESE OF PARIS' }]] }),

  // L102 — the survey flap; the loupe on the charred south-east corner and the burnt stair
  S('held', L(102), { view: 'frame', flap: '14 OCT 2019', flapSub: 'POST-FIRE SURVEY', flapAt: 0.1, stripToy: true, char: 0.25,
    corner: 1, cornerAt: 'attacked', cornerDur: 0.8, stair: 1, stairAt: 'stair', stairDur: 0.8, red: 'corner', loopAt: 'corner', stairLabel: true,
    loupe: { x: 1500, y: 700, r: 8, z: 2.0, fx: 1290, fy: 700 }, loupeTo: { r: 210, at: 'corner', dur: 0.7 },
    chips: [{ text: '« Les flammes ont attaqué l\'angle sud-est du beffroi… »', sub: ['« …l\'escalier qui mène au second niveau', 'de cloches est brûlé et fragile » · BILAN À 6 MOIS'], at: 'attacked', x: 96 }],
    cam: { x: 960, y: 500, z: 0.94 }, zoomTo: { x: 1040, y: 520, z: 1.04, at: 'corner', dur: 2.4 },
    source: 'PAPER MODEL · ' + BILAN }),

  // L103 — charred but not weakened; two bells scarred; the fire reached it, so did the water; the frame held
  S('held', L(103), { view: 'frame', stripToy: false, char: 0.5, corner: 1, stair: 1, scars: [0, 2], scarsAt: 'Two', redBell: 2, red: 'bell',
    ghostFlameAt: 'reached', ghostWaterAt: 'water', litAt: 'held',
    chips: [{ text: '"Some beams were charred, but not weakened enough to threaten the frame\'s stability"', sub: BILAN, at: 0.3, until: 'Two' },
      { text: 'Two of the eight bells: heat damage', sub: 'REBÂTIR NOTRE-DAME', at: 'Two', until: 'reached' },
      { text: 'Water at the top of the towers', sub: 'CULTURE MINISTRY', at: 'water', until: 'held' }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: [{ x: 880, y: 600, z: 1.45, at: 'Two', dur: 0.9 }, { x: 960, y: 520, z: 0.98, at: 'reached', dur: 1.2 }, { x: 960, y: 520, z: 1.05, at: 'held', dur: 2.0 }],
    source: 'PAPER MODEL · ' + BILAN + ' · REBÂTIR' }, { padOut: 0.5 }),

  // L104 — the question, the three plates, the AP summary
  S('held', L(104), { view: 'type', text: 'Thirty minutes from collapse?', textAt: 0.1, red: 'q',
    plates: [{ text: 'GALLET', sub: 'FIRE CHIEF · HIS OWN ACCOUNT', at: 'people' }, { text: 'NUÑEZ', sub: 'DEPUTY INTERIOR MINISTER', at: 'people+0.35' }, { text: 'NYT', sub: '16 JUL 2019', at: 'people+0.7' }],
    ap: { text: 'It had been within 30 minutes of collapse.', sub: 'AP, 17 APR 2019 · REPORTER\'S SUMMARY, NOT A QUOTE', at: 'record' },
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: { x: 960, y: 560, z: 1.06, at: 0, dur: 9 },
    source: 'GALLET: FRANCEINFO, 15 APR 2020 · NUÑEZ: BBC, 16 APR 2019 · NYT, 16 JUL 2019 · AP, 17 APR 2019' },
    { mood: M('tension', 'D', [0.4, 0.65], { riser: true }) }),

  // L105 — three on-record verdicts, one composition each
  S('held', L(105), { view: 'table', sky: 'night', card: 'donothing', red: 'tower', fadeAt: 'both', cardAt: 0.1,
    chips: [{ text: 'Gallet, his own account', sub: 'FRANCEINFO, 15 APR 2020', at: 'warned' }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 620, z: 1.1, at: 'both', dur: 2.2 },
    source: 'ILLUSTRATION · GALLET\'S OWN ACCOUNT, FRANCEINFO, 15 APR 2020' },
    { beats: [
      ['next', 'held', { view: 'margin', sky: 'night', bracketAt: 'minister', red: 'bracket',
        chips: [{ text: 'Nuñez · 16 Apr 2019, the next day', sub: ['WHICH MINUTES: NOT STATED · BBC', 'ALSO PA: "IT ALL CAME DOWN TO 15 TO 30 MINUTES"'], at: 'Nuñez' }],
        cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 520, z: 1.06, at: 0, dur: 6 }, source: 'NUÑEZ: BBC NEWS, 16 APR 2019 · PA · ILLUSTRATION' }],
      ['Three', 'held', { view: 'type', headline: true, kicker: 'THE NEW YORK TIMES · 16 JUL 2019',  text: ['Notre-Dame Came Far Closer', 'to Collapsing Than People Knew'], textAt: 0.1,
        red: 'under', underline: 'Far Closer', underAt: 'closer', by: 'HEADLINE, SET IN PLAIN TYPE', cam: { x: 960, y: 520, z: 1.0 }, zoomTo: { x: 960, y: 510, z: 1.05, at: 0, dur: 6 },
        source: 'NEW YORK TIMES, 16 JUL 2019 · HEADLINE ONLY, NO LAYOUT OR LOGO' }],
    ] }),

  // L105a — nobody can measure it; nobody waited
  S('held', L('105a'), { view: 'margin', sky: 'night', empty: true, bracketAt: 0, red: 'bracket',
    cam: { x: 960, y: 460, z: 1.2 }, zoomTo: { x: 960, y: 450, z: 1.3, at: 0, dur: 3 }, source: 'ILLUSTRATION · NOBODY CAN MEASURE IT' },
    { beats: [['waited', 'held', { view: 'table', sky: 'night', card: 'send', red: 'card', cardAt: 0,
      cam: { x: 960, y: 640, z: 1.14 }, zoomTo: { x: 960, y: 680, z: 1.22, at: 0, dur: 3 }, source: 'ILLUSTRATION · THE BRIEFING, NIGHT OF 15 APR 2019' }]] }),

  // L111 — the building held
  S('cathedral', L(111), { view: 'fold', sky: 'day', fire: 0, smoke: 0, roofGone: 1, spire: 'gone', clock: null, red: 'pin', redPin: { x: 380, y: 300 },
    chips: [{ text: 'All the stained glass survived', sub: 'BOTH 13TH-C. TRANSEPT ROSES · ORGAN SPARED, COATED IN LEAD DUST · BILAN À 6 MOIS', at: 0.2 }],
    cam: { x: 900, y: 520, z: 1.3 }, zoomTo: { x: 960, y: 540, z: 1.0, at: 0, dur: 3.2 }, source: 'ILLUSTRATION · ' + BILAN },
    { min: 3.4, mood: M('triumph', 'D', [0.5, 0.6], { hit: true }) }),

  // L112 — the north tower standing; its eight bells silent for more than five years
  S('airdrop', L(112), { view: 'facade', sky: 'day', fire: 0, smoke: 0, ghost: true, bellPeek: true, red: 'bell', crowd: false, clock: null, smokeSeed: 7,
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 860, y: 430, z: 1.6, at: 0.3, dur: 2.2 }, source: 'ILLUSTRATION · PAPER MODEL' },
    { padOut: 1.0, mood: M('melancholy', 'D', [0.35, 0.2], { ending: 'cut' }),
      beats: [['eight', 'held', { view: 'frame', char: 0.3, corner: 0.7, stair: 0.6, swingBell: 0, swingAt: 'silent', redBell: 0, red: 'bell',
        flap: '15 APR 2019 →', flapSub: 'THE BELLS FALL SILENT', flapAt: 0.1,
        cam: { x: 960, y: 520, z: 1.06 }, zoomTo: { x: 900, y: 560, z: 1.14, at: 0, dur: 4 }, source: 'PAPER MODEL · THE BELLS RANG AGAIN IN NOV 2024 (CH. 6)' }]] }),
]);
export default shots;
