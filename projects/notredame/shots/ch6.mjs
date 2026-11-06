// Chapter 6 shots: 6. THE BELLS COME HOME (lines 113, 114, 117, 117b, 118, 119, 120, 125) + the end card.
// Shot writer's list, after VISUALS.md (rev 9) and OUTLINE.md §5 (CH.6). Light: day throughout (skyFor: L113+ = day).
// Set: `coda` (sets/nd-coda.js, registered additively in nd-sets.js): tower, workshop, remnant, board, oak, facade.
// Fact locks: the bells move only in the 2023–24 works (crane out, back onto their pins), never slipping off a pin; the
// cause is words only (no worker, butt, cabinet, pin, spot or zone on the remnant); no guard token on the sorting board
// (the routing glows, not a person); flame never appears; exactly one red thing per frame (red / redSeq per shot).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch6    chapter card: numeral 6, both wheels at rest (+30 / 0:30), JUL 2023 → NOV 2024
//   s601   L113  JUL 2023: the north tower toy, door open; the crane lifts the eight bells out one by one onto the pallet,
//                the red bell (Denis) last ~ slow lean-in → "frame": the card workshop, close on the bare frame on its bench,
//                its charred corner re-cut by a brass saw ~ "cleaned": pull down to the bells on their trestles, a teal cloth
//                wiping lead dust off one, a mallet tapping another (dial-head figure cropped at the top)
//   s602   L114  macro on one bell rocking on its trestle; candor STRIP "Cause: undetermined" + AS OF pill
//                → "leading": the ink-hatched roof-frame remnant (ROOF FRAME · 2019), CIGARETTE? / ELECTRICAL FAULT? on string
//                ~ "neither": push in, the NEVER PROVED stamp lands between them (red passes to its notch)
//   s603   L117  the sorting board slides in beside the small remnant; the ledger prints TWO ATTICS / CHECK FIRST /
//                NO SPRINKLERS on the words, each lifts off as a brass gear ~ pull wide to the whole machine
//   s604   L117b close on the left wheel: the gears turn it 18:18 → 18:48, "≈ 30" ~ "search": push to the board, the fork
//                glows into SACRISTY (red tick), then jumps to NAVE ~ "response": pan to the RESPONSE PLAN hourglass, it
//                turns; "underestimated": the sand outruns the scale printed on its glass
//   s605   L118  the new pale-oak frame kit stands up truss by truss, Jost's name tag ~ "misting": push to the ridge, teal
//                mist blooms from the nozzles ~ "believe": pull back, the quote STRIP (« Je crois… » underlined in red)
//   s606   L119  case-open into the tower: the restored frame, pins empty and waiting (red ring on the red bell's seat)
//                ~ "blessed": pull back, the bells on the pallet with ribbons, 12 SEP 2024 · BLESSED ~ "hung": the crane sets
//                them back on their pins, the flap turns to OCT 2024; "reopened": ribbon tag 7 DEC 2024
//   s607   L120  8 NOV 2024: the bells hang in the restored frame ~ "all": push in, all eight swing together; "rang": the red
//                passes from the bell to the flap ~ "first": pull back, the door shuts, sound lines out of the tower
//   s608   L125  the west front by morning, the spire back; sound lines only from the north tower ~ push in to it, a red
//                notch on its louvre; 1.5 s of peal after the line (HOLDS['125'])
//   end    end card (dip-ink)
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(6);

const DAY = 'day';
const REBATIR23 = 'REBÂTIR NOTRE-DAME, 26 JUL 2023';
const NYT = 'NYT, 16 JUL 2019';
const STRIP114 = { lines: ['Cause: undetermined · no one charged', 'CHECKED 6 NOV 2026 · PARIS PROSECUTOR VIA LES SURLIGNEURS, DEC 2024'], red: 'undetermined' };

export const shots = check([
  CH('The Bells Come Home', '2023 → 2024', { lit: 'none', delay: '+30', red: 'num' }, M('melancholy', 'D', [0.22, 0.34])),

  // L113 — JUL 2023: the bells come down → the workshop (frame re-cut, lead dust wiped off)
  S('coda', L(113), { view: 'tower', sky: DAY, mode: 'out', lift: 1, liftAt: 0.5, liftDur: 4.9, open: 1, char: 0.35, dust: 0.35, red: 'bell',
    flap: 'JUL 2023', flapSub: 'THE BELLS COME DOWN', flapAt: 'July', flapX: 1380, flapY: 190,
    cam: { x: 1000, y: 560, z: 0.96 }, zoomTo: { x: 980, y: 540, z: 1.04, at: 0, dur: 6 },
    source: `PAPER MODEL · ${REBATIR23}` },
  { beats: [['frame', 'coda', { view: 'workshop', sky: DAY, recut: 1, recutAt: 0.3, recutDur: 3.2, clean: 1, cleanAt: 'cleaned', cleanDur: 2.4, wipe: 3, tap: 4, tapAt: 'bells',
      red: 'bell', frameTag: { text: 'Bell frame', sub: 'FIRE-DAMAGED BELFRY · RESTORED' },
      cam: { x: 560, y: 480, z: 1.35 }, zoomTo: { x: 1000, y: 620, z: 1.0, at: 'cleaned-0.5', dur: 1.8 },
      source: `PAPER MODEL · LEAD DUST CLEANED, FRAME RESTORED · ${REBATIR23}` }]] }),

  // L114 — the bells in motion; then the cause, words only
  S('coda', L(114), { view: 'workshop', sky: DAY, rock: 5, rockAmp: 5, wipe: 3, clean: 1, dustAll: 0.5, figure: false, frameTag: false,
    red: 'strip', strip: { ...STRIP114, at: 'investigation', redAt: 'investigation+0.4' }, pill: 'AS OF 6 NOV 2026', pillAt: 'investigation',
    cam: { x: 1450, y: 770, z: 1.75 }, zoomTo: { x: 1440, y: 760, z: 1.9, at: 0, dur: 4.5 },
    source: 'PAPER MODEL · THE BELLS IN THE WORKSHOP, 2023' },
  { mood: M('mystery', 'D', [0.22, 0.32]),
    beats: [['leading', 'coda', { view: 'remnant', sky: DAY,
      tags: [{ text: 'CIGARETTE?', at: 'cigarette', side: 'l' }, { text: 'ELECTRICAL FAULT?', at: 'electrical', side: 'r' }],
      stamp: 'NEVER PROVED', stampAt: 'neither', redSeq: [{ red: 'strip', at: 0 }, { red: 'stamp', at: 'neither' }],
      strip: { ...STRIP114, at: -1, redAt: -1 }, pill: 'AS OF 6 NOV 2026', pillAt: -1,
      cam: { x: 960, y: 470, z: 0.98 }, zoomTo: { x: 960, y: 380, z: 1.15, at: 'neither-0.4', dur: 1.6 },
      source: 'HYPOTHESES ONLY · NO LOCATION MARKED · PARIS PROSECUTOR VIA LES SURLIGNEURS' }]] }),

  // L117 — what the record shows: a system (one listing sentence, three items → three gears)
  S('coda', L(117), { view: 'board', sky: DAY, remnant: true, cornerBell: { x: 250, y: 190 },
    printAt: ['two', 'rule', 'oak'], gearAt: ['message', 'calling', 'sprinklers'], red: 'index',
    cam: { x: 690, y: 540, z: 1.18 }, zoomTo: { x: 1000, y: 540, z: 0.98, at: 'two-0.3', dur: 1.8 },
    chips: [{ text: 'No sprinklers, no fire walls', sub: NYT, at: 'sprinklers' }],
    source: `SOURCE: ${NYT} · PANEL STRINGS AS REPORTED · ILLUSTRATION` },
  { mood: M('tension', 'D', [0.3, 0.42], { clock: false }) }),

  // L117b — two gears turn the left wheel; the search began in the wrong attic; the plan's hourglass runs fast
  S('coda', L('117b'), { view: 'board', sky: DAY, built: true, ledger: false, turnAt: 0, turnSpeed: 0.7, cornerBell: { x: 250, y: 190 },
    wheel: 1, wheelAt: 'lost-0.6', wheelDur: 1.1, wheelFlapAt: 'hour',
    routeAt: 'search', tickAt: 'search+0.5', jumpAt: 'attic',
    glass: true, glassAt: 'response', fastAt: 'underestimated',
    redSeq: [{ red: 'notch', at: 0 }, { red: 'slot', at: 'search+0.5' }, { red: 'glass', at: 'underestimated' }],
    cam: { x: 1250, y: 300, z: 1.45 },
    zoomTo: [{ x: 680, y: 640, z: 1.4, at: 'search-0.5', dur: 1.0 }, { x: 1580, y: 380, z: 1.2, at: 'response-0.3', dur: 1.2 }],
    chips: [{ text: '« underestimated the speed at which a fire would spread »', sub: `THE RESPONSE PLAN · ${NYT}`, at: 'underestimated' }],
    source: `SOURCE: ${NYT} · ILLUSTRATION · NO FIGURE, NO BLAME` }),

  // L118 — the new frames, misting, Jost's hedge
  S('coda', L(118), { view: 'oak', sky: DAY, build: 1, buildAt: 0.15, buildDur: 3.4, mist: 1, mistAt: 'misting', mistDur: 1.4,
    plate: { text: 'Philippe Jost', sub: 'HEAD OF REBÂTIR NOTRE-DAME', at: 'Jost' }, pipeLabel: false,
    redSeq: [{ red: 'nozzle', at: 0 }, { red: 'strip', at: 'believe' }],
    chips: [{ text: 'Well over 1,000 oaks', sub: 'REBÂTIR · FFB · PRESS', at: 'rebuilding', outAt: 'misting' },
      { text: ['« Toutes les charpentes en bois sont équipées', 'd’un dispositif de brumisation »'], sub: 'JOST · PUBLIC SÉNAT, 27 MAR 2024', at: 'misting', outAt: 'believe-0.2' }],
    strip: { lines: ['« Je crois que l’on peut dire que l’incendie de 2019 ne serait plus possible »', '“I BELIEVE WE CAN SAY THAT THE FIRE OF 2019 WOULD NO LONGER BE POSSIBLE.”', 'PHILIPPE JOST · PUBLIC SÉNAT, 27 MAR 2024'],
      at: 'believe-0.4', red: 'Je crois', redAt: 'believe' },
    cam: { x: 880, y: 540, z: 1.0 },
    zoomTo: [{ x: 820, y: 440, z: 1.55, at: 'misting-0.3', dur: 1.2 }, { x: 900, y: 500, z: 1.1, at: 'believe-0.5', dur: 1.4 }],
    source: 'PAPER MODEL · NOT TO SCALE · JOST, PUBLIC SÉNAT, 27 MAR 2024' },
  { mood: M('wonder', 'D', [0.3, 0.45]) }),

  // L119 — back in the north tower: pins waiting → blessed → back on their pins
  S('coda', L(119), { view: 'tower', trans: 'case-open', sky: DAY, mode: 'in', lift: 1, liftAt: 'hung-0.2', liftDur: 3.3, open: 1, char: 0, fresh: true, ribbons: true, glint: true,
    redSeq: [{ red: 'seat', at: 0 }, { red: 'bell', at: 'blessed-0.3' }], seatAt: 'ready',
    flap: 'OCT 2024', flapSub: 'BACK IN THE FRAME', flapFrom: '12 SEP 2024', flapSubFrom: 'BLESSED', flapInAt: 'blessed', flapAt: 'hung',
    ribbon: { text: 'Reopened 7 Dec 2024', sub: 'THE CATHEDRAL', at: 'reopened', x: 1330, y: 600 },
    cam: { x: 600, y: 430, z: 1.6 },
    zoomTo: [{ x: 990, y: 520, z: 0.97, at: 'blessed-0.4', dur: 1.4 }, { x: 930, y: 500, z: 1.04, at: 'hung', dur: 4 }],
    source: 'PAPER MODEL · BLESSED 12 SEP 2024 · BACK IN THE BELFRY EARLY OCT 2024 · DIOCESE OF PARIS' },
  { mood: M('triumph', 'D', [0.35, 0.5], { riser: true }) }),

  // L120 — 8 Nov 2024: all eight together
  S('coda', L(120), { view: 'tower', sky: DAY, mode: 'in', lift: 1, crane: false, pallet: false, open: 1, shut: 1, shutAt: 'first-0.3', shutDur: 1.0, fresh: true,
    swing: 16, swingAt: 'all', ring: 1, ringAt: 'rang',
    redSeq: [{ red: 'bell', at: 0 }, { red: 'flap', at: 'rang' }], flapRedAt: 'rang',
    flap: '8 NOV 2024', flapSub: 'SHORTLY BEFORE 10:30', flapAt: 'November',
    chips: [{ text: '« Toutes les cloches ensemble, c’est la première fois »', sub: ['PHILIPPE JOST · AFP VIA LA DH, 8 NOV 2024', 'SINGLE-BELL TESTS THE DAY BEFORE'], at: 'together' }],
    cam: { x: 640, y: 470, z: 1.3 },
    zoomTo: [{ x: 590, y: 430, z: 1.7, at: 'all-0.2', dur: 1.2 }, { x: 900, y: 560, z: 0.92, at: 'first-0.4', dur: 1.6 }],
    source: 'PAPER MODEL · FIRST PEAL SINCE THE FIRE · AFP VIA LA DH, 8 NOV 2024' },
  { mood: M('triumph', 'D', [0.55, 0.75], { hit: true, word: 'rang' }) }),

  // L125 — the button: the north tower, the peal, then the end card
  S('coda', L(125), { view: 'facade', sky: DAY, ring: 1, red: 'louvre', redAt: 'north',
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 850, y: 440, z: 2.0, at: 'north', dur: 6.5 },
    source: 'ILLUSTRATION · PAPER MODEL · THE SPIRE REBUILT · BELLS RING FROM THE NORTH TOWER' },
  { ...HOLDS['125'] }),

  { id: 'end', set: 'title', params: { end: true }, min: 7, mood: M('melancholy', 'D', [0.3, 0.2], { ending: 'resolve' }) },
]);
export default shots;
