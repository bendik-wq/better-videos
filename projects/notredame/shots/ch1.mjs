// Chapter 1 shots: 1. TWO ATTICS, ONE MESSAGE (lines 9–32). Shot writer's list, after VISUALS.md (rev 9) and OUTLINE.md §2.
// Light: L1–58 daylight (skyFor). One red thing per frame. Blame gate (G6): no faces, no names, no tenure; the guard is a
// faceless teal token and never red. The "map" is the side elevation with plan overlays (annex, zone fork, guard route).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch1   chapter card, numeral 1 red, both wheels ghosted (no clock runs yet)
//   s101  L9      the nave toy theatre (H10): sage tallies at Mass ~ push in on "Inside" (red: the sacristy door's notch)
//   s102  L10–13  fold model ~ lean in to the roof "≈ 40 m up" → (oak) the forest from inside, wide → (Guarding) side-angle
//                 tube macro: brass sniffer tubes draw on, chips (6 years / 160+), push to one intake hole on "sniff"
//                 → (six-eighteen) close on the intake hole: the 18:18 badge drops in, a wisp is pulled in
//   s103  L14–15  the presbytery screen: dim, lights up on "screen", FEU → (zone) close on the zone line ~ push closer on
//                 "last" to the technical strings ~ "meant": pull back, the ticket goes left, a side-elevation inset slides
//                 in and a pen line runs from ASPIRATING FRAMEWORK down to the nave roof (the cathedral's own roof)
//   s104  L17     the side elevation: the zone line forks on the roof to TWO dashed attics (the choir roof / the sacristy)
//                 ~ push to the sacristy annex on "other"
//   s105  L18     split-flap board "The alarm plan": NO AUTO-CALL → 1 AT SCREEN → CHECK FIRST; the FIRE BRIGADE card phone
//                 slides in, the CHECK FIRST stamp comes down on "check" (no figure, no tenure)
//   s106  L20     POV: the panel screen in a monitor bezel on the desk, a big idle brass radio handset soft in front; four
//                 ink ticks on the readout on "Four strings" → the NYT's "nearly indecipherable"
//   s107  L21     side elevation close on the sacristy: guard token up to its attic, OK; nave attic ringed blank; D6 strip
//   s108  L22     the forest from a high angle (lid ajar, looking down): a low ink-40 band over two bays ~ "becoming a fire":
//                 the first brass flame (step 1)
//   s109  L24     the nave toy theatre: the tallies file out of its open front onto the square (pull back); corner inset:
//                 the band four bays long (step 2)
//   s110  L27     tight on the nave roof at 18:43: the token re-routes to the nave attic; corner inset: six bays (step 3)
//   s111  L28     clock one: 18:18 → 18:43, "+25 MIN"; ~ push down to the silent FIRE BRIGADE phone on "brigade"
//   s112  L29     a card spiral stair climbs on beside the "≈ 300" odometer (no figure on it); "≈ 5 MIN" chip on "five"
//   s113  L30     PEAK: a wide side elevation of the forest, the bays catch left to right like a fuse; the delay wheel → ≈ +30
//   s114  L31     close on the right wheel rolling to 18:48 ~ pull back, "≈ 30 MIN" → tape-feed: the lost half hour bracket
//   s115  L32     the survey sheet: the lead engine (red) reaches the bridge, the roof icon burns ~ push in, brass arrow up
//                 from the parvis into the burning roof on "climb"
import { chapter, M } from './lib.mjs';
const { S, CH, L, check } = chapter(1);

const DAY = 'day';
const NYT = 'NYT, 16 JUL 2019';

export const shots = check([

  // L9 — inside the cathedral, Mass: the nave toy theatre (H10), never a section; red = the sacristy door's notch (plants L17)
  S('cathedral', L(9), { view: 'theatre', mass: 1, red: 'sacristy', clock: null, theatreLabel: 'THE NAVE · A PAPER TOY THEATRE', tagSize: 44,
    tags: [{ at: [960, 700], to: [1080, 230], text: 'Evening Mass', sub: 'HOLY WEEK · MON 15 APR 2019', showAt: 'Inside' }],
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 900, y: 620, z: 1.22, at: 'Inside', dur: 3.4 },
    source: 'ILLUSTRATION · PAPER TOY THEATRE, NOT A SECTION · PROSECUTOR: « UNE MESSE AVAIT DÉBUTÉ PEU AVANT »' }, { mood: M('tension', 'A', [0.3, 0.45]) }),

  // L10–13 — the roof frame (fold model) → the forest, wide → the sniffer tubes (side angle) → close on one intake hole, 18:18
  S('cathedral', L(10, 13), { view: 'fold', sky: DAY, clock: null, red: 'pin', smokeSeed: 11,
    redPin: { x: 838, y: 452, label: 'The roof frame', sub: '≈ 40 M ABOVE THE CONGREGATION', dx: -420, dy: -320, size: 40, sc: 1.45 },
    zoomTo: { x: 860, y: 470, z: 1.45, at: 'forty', dur: 2.6 }, source: 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE' },
  { beats: [
    ['oak', 'forest', { fire: 0, smoke: 0, embers: 0, glow: false, clock: null, red: 'tag', tagSize: 40, trussLabel: 'The forest', trussSub: 'SO MANY OAK BEAMS', trussSize: 44,
      cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 990, y: 560, z: 1.14, at: 0, dur: 3.2 }, source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME' }],
    ['Guarding', 'forest', { fire: 0, smoke: 0, embers: 0, glow: false, clock: null, labels: false, red: 'hole', redHole: 2, vpx: 600, vpy: 330,
      tubes: 1, tubesFrom: -1.2, tubesAt: 0.1, tubesDur: 2.8,
      chips: [{ text: 'Six years in the making', sub: `DOZENS OF EXPERTS · ${NYT}`, at: 'six', big: true }, { text: '160+ detectors & manual alarms', sub: NYT, at: 'thin', big: true }],
      cam: { x: 900, y: 600, z: 1.2 }, zoomTo: { x: 930, y: 560, z: 1.55, at: 'sniff', dur: 1.6 }, source: 'ILLUSTRATION · ASPIRATING TUBES SIMPLIFIED' }],
    ['six-eighteen', 'forest', { fire: 0, smoke: 0, embers: 0, glow: false, clock: '18:18', clockInAt: 0.15, labels: false, red: 'hole', redHole: 2, tagSize: 40,
      holeLabel: 'One detector', holeSub: 'FINDS SMOKE · 18:18', holeDx: -360, holeDy: -150, holeWisp: 50, holeWispAt: 'one-0.3', tubes: 1, tubesFrom: 0,
      cam: { x: 1330, y: 660, z: 2.1 }, zoomTo: { x: 1330, y: 680, z: 2.3, at: 0, dur: 3 }, source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME · ASPIRATING TUBES SIMPLIFIED' }]] }),

  // L14–15 — the screen in the presbytery post: it lights up, FEU → close on the zone line ~ closer on the technical strings
  // ~ "meant": pull back, the ticket slides left, a side-elevation inset, a pen line from ASPIRATING FRAMEWORK to the nave roof
  S('doc', L(14, 15), { kind: 'ticket', head: 'SECURITY POST · PRESBYTERY', meta: ['NEXT DOOR', '15 APR 2019', '18:18'], inAt: 0, typeAt: 0.3, flashAt: 'screen',
    lines: [{ t: 'FEU', style: 'big', at: 'Feu' }, { t: 'ATTIC NAVE SACRISTY', at: 99 }, { t: 'ZDA-110-3-15-1', style: 'tech', at: 99 }, { t: 'ASPIRATING FRAMEWORK', style: 'tech', at: 99 }],
    cam: { push: 0.05, dx: 20, dy: 10 }, source: `SOURCES: ${NYT} · LE MONDE VIA JDD (« COMBLES NEF/SACRISTIE ») · RECREATED` },
  { beats: [
    ['zone', 'doc', { kind: 'ticket', head: 'SECURITY POST · PRESBYTERY', meta: ['NEXT DOOR', '15 APR 2019', '18:18'], inAt: -2, typeAt: -1,
      lines: [{ t: 'FEU', style: 'big', at: 0 }, { t: 'ATTIC NAVE SACRISTY', at: 'attic' }, { t: 'ZDA-110-3-15-1', style: 'tech', at: 'code' }, { t: 'ASPIRATING FRAMEWORK', style: 'tech', at: 'aspirating' }],
      highlight: ['ATTIC NAVE SACRISTY', 'ASPIRATING FRAMEWORK'], at: ['sacristy', 'framework'], hlOff: ['aspirating'], hlStyle: 'underline',
      cam: { z0: 1.5, cx: 760, cy: 520, push: 0.03, dx: 10, dy: 10, to: [{ z0: 1.62, cx: 800, cy: 560, at: 'last', dur: 1.4 }, { z0: 0.74, cx: 1490, cy: 560, at: 'meant', dur: 1.1 }] },
      inset: { at: 'meant+0.5', lineAt: 'meant+0.9', x: 1080, y: 210, w: 770, h: 640, toM: [44, 43], tag: [-250, 170] },
      source: `SOURCES: ${NYT} · LE MONDE VIA JDD (« COMBLES NEF/SACRISTIE ») · RECREATED` }]] }),

  // L17 — one zone, two attics: the zone line comes down onto the roof and forks: the cathedral roof / the sacristy
  S('cathedral', L(17), { view: 'side', sky: DAY, clock: null, annex: true, crowd: false, smokeSeed: 4, zone: 1, zoneAt: 'zone', zoneDur: 2.4, forkInk: true,
    zoneL0: [1450, 310], zoneF0: [1440, 505], zoneA: [80, 43.5], zoneC: [1600, 640],
    redSeq: [{ red: 'none', at: 0 }, { red: 'fork', at: 'two' }, { red: 'sacristy', at: 'other' }],
    tags: [{ at: [1088, 531], to: [990, 372], text: 'Cathedral roof', sub: 'ATTIC ONE', inAt: 'One', size: 44 },
      { at: [1250, 735], to: [1370, 790], text: 'Sacristy', sub: 'ATTIC TWO\nA SMALLER BUILDING', inAt: 'other', size: 44 }],
    zoomTo: { x: 1120, y: 640, z: 1.3, at: 'other', dur: 2.4 }, source: 'ILLUSTRATION · SCHEMATIC · ZONE STRING AS REPORTED (NYT)' }),

  // L18 — by design: check first (the title says the plan until the VO says "check")
  S('counter', L(18), { kicker: 'BY DESIGN', title: 'The alarm plan', title2: 'Check first', title2At: 'check', subSize: 28, redUnderY: 16,
    steps: [{ text: 'NO AUTO-CALL', label: 'The system did not call the fire brigade', sub: 'BY DESIGN', word: 'design', red: 'NO' },
      { text: '1 AT SCREEN', label: 'One person at the screen', sub: 'JOB: RADIO A GUARD', word: 'person', red: '1' },
      { text: 'CHECK FIRST', label: 'A guard is sent to check', sub: 'BEFORE ANY CALL', word: 'check', red: true }],
    phone: { x: 1520, y: 800, s: 1.3, inAt: 'brigade', label: 'FIRE BRIGADE', stamp: 'CHECK FIRST', stampAt: 'check', stampX: 0, stampY: 6 },
    source: `SOURCES: ${NYT} · LE MONDE VIA JDD · STAFFING AS REPORTED` }),

  // L20 — POV at the screen: the panel screen in a monitor on the desk, the idle radio handset big and soft in front
  S('doc', L(20), { kind: 'ticket', head: 'YOUR SCREEN', meta: ['18:18'], inAt: -2, typeAt: -1, bezel: true,
    lines: [{ t: 'FEU', style: 'big', at: -3 }, { t: 'ATTIC NAVE SACRISTY', at: -3 }, { t: 'ZDA-110-3-15-1', style: 'tech', at: -3 }, { t: 'ASPIRATING FRAMEWORK', style: 'tech', at: -3 }],
    ticks: { at: 'Four', n: 4 }, highlight: 'ASPIRATING FRAMEWORK', at: 'last', hlStyle: 'underline', handset: { x: 1700, y: 1060, s: 2.0, rot: -8, fog: 0.45 },
    cam: { z0: 0.8, cx: 900, cy: 560, push: 0.07, dx: -20, dy: 10 }, label: 'POV · RECREATED SCREEN · STRINGS AS REPORTED',
    source: `SOURCE: ${NYT} · RECREATED, NOT THE ORIGINAL` },
  { mood: M('mystery', 'A', 0.4),
    beats: [['New', 'quote', { text: 'nearly indecipherable', fr: null, by: 'The New York Times', role: 'on the alarm message', date: '16 Jul 2019', highlight: ['indecipherable'], cameo: 'none',
      size: 215, bySize: 60, roleSize: 30, mat: false, source: `SOURCE: ${NYT}` }]] }),

  // L21 — the guard is sent to the sacristy attic; nothing to report; the nave attic stays blank
  S('cathedral', L(21), { view: 'side', sky: DAY, clock: null, annex: true, crowd: false, smokeSeed: 5, zone: 1, zoneLines: false, red: 'nave', naveRing: [40, 26],
    guard: 1, guardTo: 'sacristy', guardAt: 'sent', guardDur: 2.2, guardScale: 2.9, okScale: 1.6, cam: { x: 1060, y: 640, z: 1.45 },
    strip: ['What reached the guard? It remains unclear · NYT, 16 Jul 2019', 'THE FIRM: THE LOCATION WAS PASSED ON', 'THE CATHEDRAL: HEARD "ATTIC NAVE SACRISTY" ONLY'], stripAt: 'sacristy',
    source: 'ILLUSTRATION · SCHEMATIC · GUARD SHOWN AS A TOKEN · NO PERSON' }, { padOut: 0.8 }),

  // L22 — the other attic, from above (the lid ajar, looking down): a low smoke band over two bays; "becoming a fire": the first brass flame (step 1 of 3)
  S('forest', L(22), { fire: 0, smoke: 0, embers: 0.1, glow: false, smokeBand: 1, smokeBandAt: 0, smokeBandDur: 3.4, bandBays: [6, 8], bandFlame: 1, bandFlameAt: 'becoming', bandFlameDur: 0.8,
    tubes: 1, clock: null, redHole: 1, redSeq: [{ red: 'hole', at: 0 }, { red: 'band', at: 'becoming' }], loopArrow: false, bandLabel: 'Smoke becoming fire', bandSub: 'NOBODY THERE YET', bandTag: [170, -170], tagSize: 40,
    trussLabel: 'The other attic', trussSub: 'THE CATHEDRAL’S ROOF', trussTag: [300, 180], trussSize: 42, vpx: 1000, vpy: 250, cam: { x: 960, y: 480, z: 1.3 }, zoomTo: { x: 960, y: 420, z: 1.45, at: 'smoke', dur: 2.6 },
    source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME · SEEN FROM ABOVE' }, { mood: M('urgency', 'A', [0.45, 0.6], { riser: true }) }),

  // L24 — Mass stopped, the cathedral emptied: the toy theatre again, its congregation files out onto the square (pull back);
  // a corner inset: meanwhile the band is four bays long (step 2)
  S('cathedral', L(24), { view: 'theatre', mass: 1, leave: 1, leaveAt: 0.3, leaveDur: 3.8, red: 'gap', clock: null, theatreLabel: 'THE NAVE · A PAPER TOY THEATRE', tagSize: 44,
    tags: [{ at: [700, 760], to: [230, 230], text: 'Mass stopped', sub: 'THE CATHEDRAL IS EVACUATED', showAt: 'stopped' }],
    inset: { at: 'stopped', x: 1310, y: 36, w: 570, h: 290, lit: 4, from: 2.5, dur: 2.4, sub: 'STEP 2 · ILLUSTRATIVE' },
    cam: { x: 960, y: 640, z: 1.2 }, zoomTo: { x: 960, y: 580, z: 1.0, at: 0.2, dur: 3.6 },
    source: 'ILLUSTRATION · PAPER TOY THEATRE · PARIS PROSECUTOR: « L’ÉGLISE AVAIT ÉTÉ ÉVACUÉE »' }),

  // L27 — 18:43: tight on the nave roof, the token re-routed from the sacristy side up to the ringed nave attic by "attic";
  // a corner inset: the band six bays long (step 3)
  S('cathedral', L(27), { view: 'side', sky: DAY, clock: '18:43', annex: true, crowd: false, smokeSeed: 9, zone: 1, zoneLines: false, red: 'nave', naveRing: [38, 24],
    guard: 1, guardTo: 'nave', guardRoute: [[90, 26], [79, 33.5], [66, 38.5], [53, 40.5], [43, 40]], guardAt: 'phone', guardDur: 2.1, guardScale: 1.5, cam: { x: 780, y: 560, z: 2.2 },
    chips: [{ text: 'Second alert · 18:43', sub: 'PARIS PROSECUTOR · « DEUXIÈME ALERTE »', at: 'second', y: 700, right: 1880 }, { text: 'A phone call sends the guard', sub: 'LE MONDE VIA JDD', at: 'phone' }],
    inset: { at: 'Six+0.6', x: 50, y: 190, w: 570, h: 290, lit: 6, from: 4.5, dur: 3, sub: 'STEP 3 · ILLUSTRATIVE' },
    source: 'ILLUSTRATION · SCHEMATIC · LE MONDE VIA JDD: A PHONE CALL AT 18:43' }, { padOut: 0.6 }),

  // L28 — clock one already reads 25 minutes; the brigade phone, still stamped CHECK FIRST, silent
  S('clock', L(28), { from: '18:18', to: '18:43', rollAt: 'already', rollDur: 2.2, tagText: '+25 MIN', tagAt: 'twenty', red: 'tag', cathedral: false, labelSize: 40,
    labelL: 'FEU on the screen', subL: '18:18 · SOURCES: 18:18 OR 18:20', labelR: 'Second alert', subR: '18:43 · PARIS PROSECUTOR', title: 'Clock one · the delay', titleAt: 0.2,
    phone: { x: 1380, y: 790, s: 1.3, at: 0, dur: 0, label: 'FIRE BRIGADE', stamp: 'CHECK FIRST', stampX: 0, stampY: 6, note: 'NOT YET CALLED', noteAt: 'still' },
    zoomTo: { x: 960, y: 580, z: 1.08, at: 'brigade', dur: 2.4 }, source: 'SOURCES: NYT 16 JUL 2019 · LE MONDE VIA JDD · PARIS PROSECUTOR' }),

  // L29 — the climb: a card spiral stair (nobody on it) beside the odometer; a step tally up the margin; "about five minutes" chip
  S('bignumber', L(29), { value: 300, prefix: '≈', kicker: 'THE CLIMB', label: 'narrow steps up into the roof',
    noteChip: { text: 'Climb ≈ 5 min', sub: 'LE MONDE, REPORTED BY JDD', at: 'five' },
    cx: 640, icon: 'spiral', iconXY: [1380, 960], climbAt: 'steps', climbDur: 3.2, red: 'top', tallyX: 1720, at: 'three', cam: { push: 0.05 },
    source: `SOURCES: ${NYT} (300 STEPS) · LE MONDE VIA JDD (≈ 5 MIN)` }),

  // L30 — PEAK: a wide side elevation of the forest, the bays catching left to right like a lit fuse; the delay wheel → ≈ +30
  S('forest', L(30), { view: 'elev', fuse: 0.92, fuseFrom: 0.42, fuseAt: 0, fuseDur: 4.2, bays: 12, k: 26, x: 110, y: 800, red: 'front',
    frontLabel: 'The forest is on fire', frontSub: 'AT THE TOP OF THE CLIMB', frontTag: [-260, -420], tagSize: 44,
    wheel: { from: 25, to: 30, at: 0.4, dur: 2.6, label: 'CLOCK ONE · THE DELAY ≈ +30 MIN' },
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 1040, y: 560, z: 1.08, at: 0, dur: 4.4 }, source: 'ILLUSTRATION · THE ROOF FRAME AS A MODEL · NOT A SECTION · NOT TO SCALE' },
  { padOut: 1.2, mood: M('urgency', 'A', [0.7, 0.85], { hit: true }) }),

  // L31 — the call: close on the right wheel rolling to about ten to seven, pull back; → the lost half hour
  S('clock', L(31), { from: '18:18', to: '18:48', rollAt: 'brigade', rollDur: 1.8, tagText: '≈ 30 MIN', tagW: 250, tagAt: 'call+1.9', red: 'tag', cathedral: false, labelSize: 44,
    labelL: 'FEU on the screen', subL: '18:18 · SOURCES: 18:18 OR 18:20', labelR: 'Fire brigade called', subR: '18:48 NYT\n18:51 ALERT RECEIVED (GOVT RECORD)', labelRAt: 'seven', labelRTo: [1130, 560],
    cam: { x: 1500, y: 370, z: 1.9 }, zoomTo: { x: 960, y: 560, z: 1.0, at: 'call', dur: 1.8 }, source: 'SOURCES: NYT 16 JUL 2019 · ÉLYSÉE RECORD (18:51)' },
  { mood: M('melancholy', 'A', [0.45, 0.35]),
    beats: [['Half', 'timeline', { trans: 'tape-feed', title: '15 APRIL 2019 · THE LOST HALF HOUR', building: false, pxPerMin: 40, posMax: 560, carriageOutAt: 'fire@1', mat: false, pointer: false, rulerGap: 4, tagSize: 36,
      bracket: { from: '18:18', to: '18:48', label: 'THE LOST HALF HOUR', at: 'fire@1+0.3' },
      events: [{ time: '18:18', label: 'FEU on the screen', sub: 'SOURCES: 18:18 OR 18:20', word: 'screen' }, { time: '18:43', label: 'Second alert', sub: 'PARIS PROSECUTOR', word: 'first', ty: -140, dx: -330 },
        { time: '18:48', label: 'Fire brigade called', sub: 'NYT · 18:51 RECEIVED (GOVT)', word: 'said', dx: -260 }],
      source: 'SOURCES: NYT, 16 JUL 2019 · ÉLYSÉE RECORD · PARIS PROSECUTOR' }]] }),

  // L32 — the first crews are minutes away: the lead engine (the one red) reaches the bridge as the clock rolls toward 19:00;
  // push in, a brass arrow from the parvis up into the burning roof on "climb"
  S('paris', L(32), { route: 0.87, routeAt: 0.2, routeDur: 4.0, boat: 0, pump: 0, red: 'lead', clock: '18:56', clockFrom: '18:51', clockAt: 0.2, clockDur: 4.2, clockXY: [96, 66],
    roofFire: 1, roofFireAt: 0, roofFireDur: 1.2, roofScale: 1.5, parvisArrow: 1, parvisArrowAt: 'climb', parvisArrowDur: 0.8, parvisBrass: true, parvisFrom: [-185, 12], parvisTo: [-30, -8],
    legendXY: [0, 110], legendOutAt: 'climb', edgeOutAt: 'climb-0.3', tagTo: [-40, 210],
    zoomTo: { x: 1000, y: 560, z: 1.35, at: 'climb', dur: 2 },
    source: 'SCHEMATIC MAP · OUTLINES SIMPLIFIED · ROUTE ILLUSTRATIVE · FIRST CREWS JUST BEFORE 19:00 (NYT)' }, { mood: M('urgency', 'A', [0.5, 0.65]) }),
]);
export default shots;
