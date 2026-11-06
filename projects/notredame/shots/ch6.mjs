// Chapter 6 shots: 6. THE BELLS COME HOME (lines 113, 114, 117, 117b, 118, 119, 120, 125) + the end card.
// Shot writer's list, after VISUALS.md (rev 9) and OUTLINE.md §5 (CH.6). Light: day throughout (skyFor: L113+ = day).
// Set: `coda` (sets/nd-coda.js, registered additively in nd-sets.js): tower, workshop, remnant, board, oak, facade.
// Fact locks: the bells move only in the 2023–24 works (crane out, back onto their pins), never slipping off a pin; the
// cause is words only (no worker, butt, cabinet, pin, spot or zone on the remnant); no guard token on the sorting board
// (the routing glows, not a person); flame never appears; exactly one red thing per frame (red / redSeq per shot).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch6    chapter card: numeral parked on 06 (numFrom 6, no roll through other numbers), both wheels at rest (+30 / 0:30)
//   s601   L113  JUL 2023: the north tower toy, door open; the crane lifts the eight bells out one by one onto the pallet,
//                the red bell (Denis) last ~ slow lean-in → "frame": the card workshop, close on the bare frame on its bench,
//                its charred corner re-cut by a brass saw ~ "cleaned": pull down to the bells on their trestles, a teal cloth
//                wiping lead dust off one, a mallet tapping another (foreground dial-head figure at right, head cropped by the frame top)
//   s602   L114  macro on one bell rocking on its trestle; candor STRIP "Cause: undetermined" + AS OF pill
//                → "leading": the ink-hatched roof-frame remnant (ROOF FRAME · 2019), CIGARETTE? / ELECTRICAL FAULT? on string
//                ~ "neither": push in, the NEVER PROVED stamp lands between them (red passes to its red inner border; no line
//                points at either tag)
//   s603   L117  the sorting board slides in beside the small remnant; the ledger prints TWO ATTICS / CHECK FIRST /
//                NO SPRINKLERS on the words, each lifts off as a brass gear ~ pull wide to the whole machine
//   s604   L117b the left wheel + gears + the RESPONSE PLAN hourglass at rest (board out of frame): the gears turn it 18:18 → 18:48,
//                "≈ 30" ~ "search": push to the board (gears pushed out; the small roof-frame remnant at left), the fork glows into SACRISTY (red magnifier, SEARCHED FIRST), then jumps to NAVE ~ "response": pan clear
//                of the board to the RESPONSE PLAN hourglass, it turns; "underestimated": the sand overshoots the bold PLAN line
//                (the overshoot is the red)
//   s605   L118  the new pale-oak frame kit stands up truss by truss, Jost's name tag ~ "misting": push to the ridge, fine
//                teal droplet spray cones from the nozzles (no cloud shapes) ~ "believe": pull back, the quote STRIP (« Je crois… » underlined in red)
//   s606   L119  case-open into the tower: the restored frame, pins empty and waiting (red ring on the red bell's seat)
//                ~ "blessed": push to the pallet, the bells with ribbons fill the frame, 12 SEP 2024 · BLESSED ~ "hung": pull
//                back, the crane sets them on their pins, the flap turns to OCT 2024; "reopened": ribbon tag 7 DEC 2024
//   s607   L120  8 NOV 2024: macro on the red bell in the restored frame (new scale after s606's wide) ~ "all": pull out, all
//                eight swing together; "rang": the red passes from the bell to the flap ~ "first": pull back, the door shuts,
//                bold sound lines out of the tower
//   s608   L125  the west front by morning, the spire back (set back at the crossing: smaller, ink-40, base behind the nave
//                ridge); sound lines only from the north tower ~ push in to it, a red notch on its louvre; 1.5 s of peal after
//                the line (HOLDS['125']), then a hard cut to night-shade #0b1426 (nightAt) before the dip into the end card
//   end    end card (dip-ink)
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(6);

const DAY = 'day';
const REBATIR23 = 'REBÂTIR NOTRE-DAME, 26 JUL 2023';
const NYT = 'NYT, 16 JUL 2019';
const STRIP114 = { lines: ['Cause: undetermined · no one charged', 'CHECKED 6 NOV 2026 · PARIS PROSECUTOR VIA LES SURLIGNEURS, DEC 2024'], red: 'undetermined' };

export const shots = check([
  CH('The Bells Come Home', '2023 → 2024', { lit: 'none', delay: '+30', red: 'num', numFrom: 6, wheelRoll: false, gearNudge: [null, null, [-130, 140]] }, M('melancholy', 'D', [0.22, 0.34])),

  // L113 — JUL 2023: the bells come down → the workshop (frame re-cut, lead dust wiped off)
  S('coda', L(113), { view: 'tower', sky: DAY, mode: 'out', lift: 1, liftAt: 0.5, liftDur: 4.9, open: 1, char: 0.35, dust: 0.35, red: 'bell',
    flap: 'JUL 2023', flapSub: 'THE BELLS COME DOWN', flapAt: 'July', flapX: 1380, flapY: 190,
    cam: { x: 960, y: 470, z: 0.96 }, zoomTo: { x: 960, y: 480, z: 1.0, at: 0, dur: 6 },
    source: `PAPER MODEL · ${REBATIR23}` },
  { beats: [['frame', 'coda', { view: 'workshop', sky: DAY, recut: 1, recutAt: 0.3, recutDur: 3.2, clean: 1, cleanAt: 'cleaned', cleanDur: 2.4, wipe: 6, tap: 5, tapAt: 'bells',
      red: 'bell', frameTag: { text: 'Bell frame', sub: 'FIRE-DAMAGED BELFRY · RESTORED', to: [180, 104] }, rowY: 740, rowX: 930,
      figure: 'front', figureX: 1790, figureY: 710, figureScale: 2.5,
      cam: { x: 560, y: 470, z: 1.35 }, zoomTo: { x: 1060, y: 560, z: 1.0, at: 'cleaned-0.5', dur: 1.8 },
      source: `PAPER MODEL · LEAD DUST CLEANED, FRAME RESTORED · ${REBATIR23}` }]] }),

  // L114 — the bells in motion; then the cause, words only
  S('coda', L(114), { view: 'workshop', sky: DAY, rock: 2, rockAmp: 5, wipe: 3, clean: 1, dustAll: 0.5, figure: false, frameTag: false,
    redSeq: [{ red: 'bell', at: 0 }, { red: 'strip', at: 'investigation+0.4' }], strip: { ...STRIP114, at: 'investigation', redAt: 'investigation+0.4' }, pill: 'AS OF 6 NOV 2026', pillAt: 'investigation',
    cam: { x: 796, y: 850, z: 2.45 }, zoomTo: { x: 796, y: 850, z: 2.6, at: 0, dur: 4.5 },
    source: 'PAPER MODEL · THE BELLS IN THE WORKSHOP, 2023' },
  { mood: M('mystery', 'D', [0.22, 0.32]),
    beats: [['leading', 'coda', { view: 'remnant', sky: DAY,
      tags: [{ text: 'CIGARETTE?', at: 'cigarette', side: 'l' }, { text: 'ELECTRICAL FAULT?', at: 'electrical', side: 'r' }],
      stamp: 'NEVER PROVED', stampAt: 'neither', redSeq: [{ red: 'strip', at: 0 }, { red: 'stamp', at: 'neither' }],
      strip: { ...STRIP114, at: -1, redAt: -1 },
      cam: { x: 960, y: 530, z: 0.98 }, zoomTo: { x: 960, y: 470, z: 1.05, at: 'neither-0.4', dur: 1.6 },
      source: 'HYPOTHESES ONLY · PARIS PROSECUTOR VIA LES SURLIGNEURS' }]] }),

  // L117 — what the record shows: a system (one listing sentence, three items → three gears)
  S('coda', L(117), { view: 'board', sky: DAY, remnant: { x: 140, y: 830, sc: 0.4, labelPx: 22 }, cornerBell: { x: 210, y: 300, label: false }, indexFrom0: true,
    printAt: ['two', 'rule', 'oak'], gearAt: ['message', 'calling', 'sprinklers'], red: 'index',
    cam: { x: 640, y: 560, z: 1.12 }, zoomTo: { x: 890, y: 540, z: 0.92, at: 'two-0.3', dur: 1.8 },
    chips: [{ text: 'No sprinklers, no fire walls', sub: NYT, at: 'sprinklers' }],
    source: `SOURCE: ${NYT} · PANEL STRINGS AS REPORTED · ILLUSTRATION` },
  { mood: M('tension', 'D', [0.3, 0.42], { clock: false }) }),

  // L117b — two gears turn the left wheel; the search began in the wrong attic; the plan's hourglass runs fast
  S('coda', L('117b'), { view: 'board', sky: DAY, built: true, ledger: false, turnAt: 0, turnSpeed: 0.7, cornerBell: false, remnant: { x: 172, y: 720, sc: 0.3, labelPx: 22 },
    wheel: 1, wheelAt: 'lost-0.6', wheelDur: 1.1, wheelFlapAt: 'hour',
    routeAt: 'search', tickAt: 'search+0.5', jumpAt: 'attic',
    glass: true, glassAt: 'response', fastAt: 'underestimated',
    redSeq: [{ red: 'notch', at: 0 }, { red: 'slot', at: 'search+0.5' }, { red: 'glass', at: 'underestimated' }],
    glassX: 2050, wheelCapPx: 26,
    cam: { x: 1760, y: 400, z: 1.3 },
    zoomTo: [{ x: 420, y: 570, z: 1.62, at: 'search-0.5', dur: 1.0 }, { x: 1904, y: 440, z: 1.3, at: 'response-0.3', dur: 1.2 }],
    chips: [{ text: '« underestimated the speed at which a fire would spread »', sub: `THE RESPONSE PLAN · ${NYT}`, at: 'underestimated' }],
    source: `SOURCE: ${NYT} · ILLUSTRATION` }),

  // L118 — the new frames, misting, Jost's hedge
  S('coda', L(118), { view: 'oak', sky: DAY, build: 1, buildAt: 0.15, buildDur: 3.4, mist: 1, mistAt: 'misting', mistDur: 1.4,
    plate: { text: 'Philippe Jost', sub: 'HEAD OF REBÂTIR NOTRE-DAME', at: 'Jost', to: [270, 420] }, pipeLabel: false, baseLabelOutAt: 'believe-0.6',
    redSeq: [{ red: 'nozzle', at: 0 }, { red: 'strip', at: 'believe' }],
    chips: [{ text: 'Well over 1,000 oaks', sub: 'REBÂTIR · FFB · PRESS', at: 'rebuilding', outAt: 'misting' },
      { text: ['« Toutes les charpentes en bois sont équipées', 'd’un dispositif de brumisation »'], sub: ['“EVERY WOODEN FRAME HAS A MISTING SYSTEM”', 'JOST · PUBLIC SÉNAT, 27 MAR 2024'], at: 'misting', outAt: 'believe-0.2' }],
    strip: { lines: ['« Je crois que l’on peut dire que l’incendie de 2019 ne serait plus possible »', '“I BELIEVE WE CAN SAY THAT THE FIRE OF 2019 WOULD NO LONGER BE POSSIBLE.”', 'PHILIPPE JOST · PUBLIC SÉNAT, 27 MAR 2024'],
      at: 'believe-0.4', red: 'Je crois', redAt: 'believe', lift: 44 },
    cam: { x: 880, y: 540, z: 1.0 },
    zoomTo: [{ x: 820, y: 440, z: 1.55, at: 'misting-0.3', dur: 1.2 }, { x: 900, y: 500, z: 1.1, at: 'believe-0.5', dur: 1.4 }],
    source: 'PAPER MODEL · NOT TO SCALE · JOST, PUBLIC SÉNAT, 27 MAR 2024' },
  { mood: M('wonder', 'D', [0.3, 0.45]) }),

  // L119 — back in the north tower: pins waiting → blessed → back on their pins
  S('coda', L(119), { view: 'tower', trans: 'case-open', sky: DAY, mode: 'in', lift: 1, liftAt: 'hung-0.2', liftDur: 3.3, open: 1, char: 0, fresh: true, ribbons: true, glint: true,
    redSeq: [{ red: 'seat', at: 0 }, { red: 'bell', at: 'blessed-0.3' }], seatAt: -1, craneLabel: false, glue: false, palletDx: 220,
    flap: 'OCT 2024', flapSub: 'BACK IN THE FRAME', flapFrom: '12 SEP 2024', flapSubFrom: 'BLESSED', flapInAt: 'blessed', flapAt: 'hung',
    ribbon: { text: 'Reopened 7 Dec 2024', sub: 'THE CATHEDRAL', at: 'reopened', x: 1330, y: 600 },
    cam: { x: 600, y: 430, z: 1.6 },
    zoomTo: [{ x: 1660, y: 720, z: 1.85, at: 'blessed-0.3', dur: 1.2 }, { x: 760, y: 480, z: 1.12, at: 'hung-0.3', dur: 1.8 }],
    source: 'PAPER MODEL · BLESSED 12 SEP 2024 · BACK IN THE BELFRY EARLY OCT 2024 · DIOCESE OF PARIS' },
  { mood: M('triumph', 'D', [0.35, 0.5], { riser: true }) }),

  // L120 — 8 Nov 2024: all eight together
  S('coda', L(120), { view: 'tower', sky: DAY, mode: 'in', lift: 1, crane: false, pallet: false, open: 1, shut: 1, shutAt: 'first-0.3', shutDur: 1.0, fresh: true,
    swing: 16, swingAt: 'all', ring: 1, ringAt: 'rang',
    redSeq: [{ red: 'bell', at: 0 }, { red: 'flap', at: 'rang' }], flapRedAt: 'rang', glue: false,
    flap: '8 NOV 2024', flapSub: 'SHORTLY BEFORE 10:30', flapAt: 'November', flapX: 1400, flapY: 720,
    chips: [{ text: '« Toutes les cloches ensemble, c’est la première fois »', sub: ['“ALL THE BELLS TOGETHER: IT’S THE FIRST TIME”', 'PHILIPPE JOST · AFP VIA LA DH, 8 NOV 2024', 'SINGLE-BELL TESTS THE DAY BEFORE'], at: 'together' }],
    cam: { x: 639, y: 500, z: 2.5 },
    zoomTo: [{ x: 600, y: 440, z: 1.8, at: 'all-0.2', dur: 1.2 }, { x: 650, y: 430, z: 0.92, at: 'first-0.4', dur: 1.6 }],
    source: 'PAPER MODEL · FIRST PEAL SINCE THE FIRE · AFP VIA LA DH, 8 NOV 2024' },
  { mood: M('triumph', 'D', [0.55, 0.75], { hit: true, word: 'rang' }) }),

  // L125 — the button: the north tower, the peal, then the end card
  S('coda', L(125), { view: 'facade', sky: DAY, ring: 1, red: 'louvre', redAt: 'north', nightAt: '100%-0.4',
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 850, y: 470, z: 1.8, at: 'north', dur: 6.5 },
    source: 'ILLUSTRATION · PAPER MODEL · SPIRE REBUILT' }, // short slip: clears the portals at z 1.8
  { ...HOLDS['125'], padOut: HOLDS['125'].padOut + 0.4 }), // 1.5 s of peal on picture, then a hard cut to night-shade #0b1426 (0.4 s) and the dip into the end card

  { id: 'end', set: 'title', params: { end: true, slam: 0, lines: ['THE BELLS CAME HOME.', 'NOTRE-DAME WAS 30 MINUTES', 'FROM COLLAPSE'], sizes: [44, 78, 78], cw: 1180, cy: 60,
      modelK: 3.3, trees: false, bellX: [880, 960, 1040], bellLen: [40, 56, 40] }, min: 7, mood: M('melancholy', 'D', [0.3, 0.2], { ending: 'resolve' }) },
]);
export default shots;
