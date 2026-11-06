// Chapter 1 shots: 1. TWO ATTICS, ONE MESSAGE (lines 9–32). Shot writer's list, after VISUALS.md (rev 9) and OUTLINE.md §2.
// Light: L1–58 daylight (skyFor). One red thing per frame. Blame gate (G6): no faces, no names, no tenure; the guard is a
// faceless teal token and never red. The "map" is the side elevation with plan overlays (annex, zone fork, guard route).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch1   chapter card, numeral 1 red, both wheels ghosted (no clock runs yet)
//   s101  L9      façade by day, the parvis crowd ~ push into the portal: "Evening Mass" (red pin on the portal)
//   s102  L10–13  fold model ~ lean in to the roof "≈ 40 m up" → the forest from inside ~ brass sniffer tubes draw on
//                 ~ chips (6 years / 160+) ~ push to one intake hole; "six-eighteen": the badge drops in, the hole goes red
//   s103  L14–15  the presbytery screen: FEU → zone → code → ASPIRATING FRAMEWORK typed on their words, slow push
//                 → "Framework meant…": the forest again, its tag now reads Framework = the cathedral's own roof
//   s104  L17     the side elevation: the zone line forks to TWO dashed attics ~ push to the sacristy annex on "other"
//   s105  L18     split-flap board: NO AUTO-CALL → 1 AT SCREEN → CHECK FIRST (no figure, no tenure)
//   s106  L20     POV at the screen (four strings type on "Four strings of text") → the NYT's "nearly indecipherable"
//   s107  L21     side elevation: guard token to the sacristy attic, OK; nave attic ringed blank; D6 strip, both versions
//   s108  L22     the forest: halftone smoke gathers far off ~ "becoming a fire": the first small brass flame
//   s109  L24     façade: the congregation files out of the portal onto the parvis (pull back)
//   s110  L27     side elevation 18:43: the token re-routes toward the cathedral roof; inside the nave attic, smoke + flame
//   s111  L28     clock one: 18:18 → 18:43, "+25 MIN"; ~ push to the tag on "fire brigade"
//   s112  L29     "≈ 300 STEPS" odometer, a card spiral stair (no figure on it), climb ≈ 5 min
//   s113  L30     PEAK: the forest catches near to us
//   s114  L31     clock one rolls to 18:48, "≈ 30 MIN" → tape-feed to the ticker: the lost half hour
//   s115  L32     the survey sheet: the engines' route to the island ~ push in on "climb"
import { chapter, M } from './lib.mjs';
const { S, CH, L, check } = chapter(1);

const DAY = 'day';
const NYT = 'NYT, 16 JUL 2019';

export const shots = check([
  CH('Two Attics, One Message', '18:18 · the alarm', { lit: 'none', red: 'num', delay: '+00' }, M('tension', 'A', [0.3, 0.45])),

  // L9 — inside the cathedral, Mass (we never section the building: the portal stands for "inside")
  S('cathedral', L(9), { view: 'facade', sky: DAY, clock: null, labels: false, rule: false, red: 'pin',
    redPin: { x: 960, y: 852, label: 'Evening Mass', sub: 'HOLY WEEK · MON 15 APR 2019', dx: -470, dy: -250 },
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 740, z: 1.75, at: 'Inside', dur: 3.2 },
    source: 'ILLUSTRATION · PAPER MODEL · PROSECUTOR: « UNE MESSE AVAIT DÉBUTÉ PEU AVANT »' }),

  // L10–13 — the roof frame, the forest, the sniffer tubes, 18:18
  S('cathedral', L(10, 13), { view: 'fold', sky: DAY, clock: null, red: 'pin', smokeSeed: 11,
    redPin: { x: 838, y: 452, label: 'The roof frame', sub: '≈ 40 M ABOVE THE CONGREGATION', dx: -300, dy: -250 },
    zoomTo: { x: 860, y: 470, z: 1.45, at: 'forty', dur: 2.6 }, source: 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE' },
  { beats: [['oak', 'forest', { fire: 0, smoke: 0, embers: 0, glow: false, clock: '18:18', clockInAt: 'six@1', red: 'tag',
    redSeq: [{ red: 'tag', at: 0 }, { red: 'hole', at: 'detector' }], redHole: 2, holeLabel: 'One detector', holeSub: 'FINDS SMOKE · 18:18', holeDx: -340, holeDy: -120,
    trussLabel: 'The forest', trussSub: 'SO MANY OAK BEAMS', tubes: 1, tubesAt: 'Guarding', tubesDur: 2.6,
    chips: [{ text: 'Six years in the making', sub: `DOZENS OF EXPERTS · ${NYT}`, at: 'six' }, { text: '160+ detectors & manual alarms', sub: NYT, at: 'thin' }],
    zoomTo: [{ x: 990, y: 560, z: 1.12, at: 0, dur: 4 }, { x: 1420, y: 690, z: 1.9, at: 'six@1-0.4', dur: 2.2 }],
    source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME · ASPIRATING TUBES SIMPLIFIED' }]] }),

  // L14–15 — the screen in the presbytery post: four strings, the key words last
  S('doc', L(14, 15), { kind: 'ticket', head: 'SECURITY POST · PRESBYTERY', meta: ['NEXT DOOR', '15 APR 2019', '18:18'], inAt: 0.1, typeAt: 0.4,
    lines: [{ t: 'FEU', style: 'big', at: 'Feu' }, { t: 'ATTIC NAVE SACRISTY', at: 'zone' }, { t: 'ZDA-110-3-15-1', style: 'tech', at: 'code' }, { t: 'ASPIRATING FRAMEWORK', style: 'tech', at: 'aspirating' }],
    highlight: ['ATTIC NAVE SACRISTY', 'ASPIRATING FRAMEWORK'], at: ['sacristy', 'framework'], hlOff: ['aspirating'], cam: { push: 0.09, dx: 30, dy: 20 },
    source: `SOURCES: ${NYT} · LE MONDE VIA JDD (« COMBLES NEF/SACRISTIE ») · RECREATED` },
  { beats: [['meant', 'cathedral', { view: 'fold', sky: DAY, clock: null, red: 'pin', smokeSeed: 12, foreground: false,
    redPin: { x: 905, y: 440, label: 'Framework', sub: 'THE CATHEDRAL’S OWN ROOF', dx: -330, dy: -170 },
    cam: { x: 930, y: 450, z: 2.5 }, zoomTo: { x: 900, y: 430, z: 1.9, at: 0, dur: 3 }, source: 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE' }]] }),

  // L17 — one zone, two attics
  S('cathedral', L(17), { view: 'side', sky: DAY, clock: null, annex: true, smokeSeed: 4, zone: 1, zoneAt: 'zone', zoneDur: 2.6,
    redSeq: [{ red: 'none', at: 0 }, { red: 'fork', at: 'two' }, { red: 'sacristy', at: 'other' }],
    tags: [{ at: [744, 535], to: [130, 420], text: 'Cathedral roof', sub: 'ATTIC ONE', inAt: 'One' }, { at: [1260, 760], to: [1390, 470], text: 'Sacristy', sub: 'ATTIC TWO · A SMALLER BUILDING', inAt: 'other' }],
    zoomTo: { x: 1120, y: 640, z: 1.4, at: 'other', dur: 2.4 }, source: 'ILLUSTRATION · SCHEMATIC · ZONE STRING AS REPORTED (NYT)' }),

  // L18 — by design: check first
  S('counter', L(18), { kicker: 'THE ALARM PLAN · BY DESIGN', title: 'Check first',
    steps: [{ text: 'NO AUTO-CALL', label: 'The system did not call the fire brigade', sub: 'BY DESIGN', word: 'didn', red: 'NO' },
      { text: '1 AT SCREEN', label: 'One person at the screen', sub: 'JOB: RADIO A GUARD', word: 'person', red: '1' },
      { text: 'CHECK FIRST', label: 'A guard is sent to check', sub: 'BEFORE ANY CALL', word: 'check', red: true }],
    source: `SOURCES: ${NYT} · LE MONDE VIA JDD · STAFFING AS REPORTED` }),

  // L20 — POV at the screen; the NYT's verdict
  S('doc', L(20), { kind: 'ticket', head: 'YOUR SCREEN', meta: ['18:18'], inAt: -2, typeAt: -1,
    lines: [{ t: 'FEU', style: 'big', at: 'Four' }, { t: 'ATTIC NAVE SACRISTY', at: 'strings' }, { t: 'ZDA-110-3-15-1', style: 'tech', at: 'text' }, { t: 'ASPIRATING FRAMEWORK', style: 'tech', at: 'key' }],
    highlight: 'ASPIRATING FRAMEWORK', at: 'last', cam: { push: 0.16, dx: 70, dy: 40 }, label: 'POV · RECREATED SCREEN · STRINGS AS REPORTED',
    source: `SOURCE: ${NYT} · RECREATED, NOT THE ORIGINAL` },
  { mood: M('mystery', 'A', 0.4),
    beats: [['New', 'quote', { text: 'nearly indecipherable', fr: null, by: 'The New York Times', role: 'on the alarm message', date: '16 Jul 2019', highlight: ['indecipherable'], cameo: 'none', size: 124, source: `SOURCE: ${NYT}` }]] }),

  // L21 — the guard is sent to the sacristy attic; nothing to report; the nave attic stays blank
  S('cathedral', L(21), { view: 'side', sky: DAY, clock: null, annex: true, smokeSeed: 5, zone: 1, zoneLines: false, red: 'nave',
    guard: 1, guardTo: 'sacristy', guardAt: 'sent', guardDur: 2.6, cam: { x: 1010, y: 610, z: 1.18 },
    strip: ['What reached the guard? It remains unclear · NYT, 16 Jul 2019', 'THE FIRM: LOCATION PASSED ON · THE CATHEDRAL: HEARD "ATTIC NAVE SACRISTY" ONLY'], stripAt: 'Nothing',
    source: 'ILLUSTRATION · SCHEMATIC · NO PERSON SHOWN' }),

  // L22 — the other attic: smoke becoming fire
  S('forest', L(22), { fire: 0.14, fireAt: 'becoming', fireDur: 2.0, smokeBand: 0.85, smokeBandAt: 0, smokeBandDur: 3.6, smoke: 0.35, embers: 0.25, glow: false,
    tubes: 1, clock: null, redHole: 1, redSeq: [{ red: 'hole', at: 0 }, { red: 'front', at: 'becoming' }], frontLabel: 'Smoke becoming fire', frontSub: 'THE CATHEDRAL ROOF · NOBODY THERE YET',
    trussLabel: 'The other attic', trussSub: 'THE CATHEDRAL’S ROOF', trussTag: [140, 260], vpx: 1060, vpy: 520, cam: { x: 960, y: 520, z: 1.15 }, zoomTo: { x: 1040, y: 540, z: 1.35, at: 'smoke', dur: 3 },
    source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME' }, { mood: M('urgency', 'A', [0.45, 0.6], { riser: true }) }),

  // L24 — Mass stopped, the cathedral emptied
  S('cathedral', L(24), { view: 'facade', sky: DAY, clock: null, labels: false, rule: false, red: 'pin', exit: 1, exitAt: 0.2, exitDur: 3.6, smokeSeed: 7,
    redPin: { x: 960, y: 870, label: 'Mass stopped', sub: 'THE CATHEDRAL IS EVACUATED', dx: 140, dy: -260 },
    cam: { x: 960, y: 800, z: 2.1 }, zoomTo: { x: 960, y: 700, z: 1.45, at: 0.3, dur: 4 },
    source: 'ILLUSTRATION · PARIS PROSECUTOR: « L’ÉGLISE AVAIT ÉTÉ ÉVACUÉE »' }),

  // L27 — 18:43: the second alert, the token re-routed; inside the nave attic the band has grown
  S('cathedral', L(27), { view: 'side', sky: DAY, clock: '18:43', annex: true, smokeSeed: 9, zone: 1, zoneLines: false, red: 'nave',
    guard: 0.45, guardTo: 'nave', guardAt: 'phone', guardDur: 2.6, atticSmoke: 0.7, atticFire: 0.5, atticFireAt: 'alert', atticFireDur: 3,
    chips: [{ text: 'Second alert · 18:43', sub: 'PARIS PROSECUTOR · « DEUXIÈME ALERTE »', at: 'second' }],
    source: 'ILLUSTRATION · SCHEMATIC · LE MONDE VIA JDD: A PHONE CALL AT 18:43' }),

  // L28 — clock one already reads 25 minutes
  S('clock', L(28), { from: '18:18', to: '18:43', rollAt: 'already', rollDur: 2.2, tagText: '+25 MIN', red: 'tag', cathedral: false,
    labelL: 'FEU on the screen', subL: '18:18 · SOURCES GIVE 18:18 OR 18:20', labelR: 'Second alert', subR: '18:43 · PARIS PROSECUTOR', title: 'Clock one · the delay', titleAt: 0.2,
    zoomTo: { x: 960, y: 600, z: 1.28, at: 'brigade', dur: 2.6 }, source: 'SOURCES: NYT 16 JUL 2019 · LE MONDE VIA JDD · PARIS PROSECUTOR' }),

  // L29 — the climb (no figure on the steps)
  S('bignumber', L(29), { value: 300, prefix: '≈', kicker: 'THE CLIMB', label: 'narrow steps up into the roof', note: 'CLIMB ≈ 5 MIN · LE MONDE, REPORTED BY JDD',
    icon: 'stairs', at: 'three', cam: { push: 0.06 }, source: `SOURCES: ${NYT} (300 STEPS) · LE MONDE VIA JDD (≈ 5 MIN)` }),

  // L30 — PEAK: at the top, the forest is on fire
  S('forest', L(30), { fire: 0.85, fireAt: -1.4, fireDur: 3.2, tubes: 1, clock: null, red: 'front', frontLabel: 'The forest is on fire', frontSub: 'AT THE TOP OF THE CLIMB',
    trussLabel: 'The nave attic', trussSub: 'THE ROOF FRAME', vpx: 930, vpy: 470, scale: 140, cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 960, y: 520, z: 1.14, at: 0, dur: 3.2 },
    smokeStyle: 'billow', source: 'ILLUSTRATION · SCHEMATIC ROOF FRAME · NOT TO SCALE' }, { mood: M('urgency', 'A', [0.7, 0.85], { hit: true }) }),

  // L31 — the call: about ten to seven; the lost half hour
  S('clock', L(31), { from: '18:18', to: '18:48', rollAt: 'brigade', rollDur: 1.8, tagText: '≈ 30 MIN', red: 'tag', cathedral: false,
    labelL: 'FEU on the screen', subL: '18:18 · SOURCES GIVE 18:18 OR 18:20', labelR: 'Fire brigade called', subR: '18:48 NYT · 18:51 ALERT RECEIVED (GOVT RECORD)',
    cam: { x: 1330, y: 420, z: 1.4 }, zoomTo: { x: 960, y: 560, z: 1.0, at: 'call', dur: 1.8 }, source: 'SOURCES: NYT 16 JUL 2019 · ÉLYSÉE RECORD (18:51)' },
  { mood: M('melancholy', 'A', [0.45, 0.35]),
    beats: [['Half', 'timeline', { trans: 'tape-feed', title: '15 APRIL 2019 · THE LOST HALF HOUR', building: false, pxPerMin: 24,
      events: [{ time: '18:18', label: 'FEU on the screen', sub: 'SOURCES: 18:18 OR 18:20', word: 'screen' }, { time: '18:43', label: 'Second alert', sub: 'PARIS PROSECUTOR', word: 'first' },
        { time: '18:48', label: 'Fire brigade called', sub: 'NYT · 18:51 ALERT RECEIVED (GOVT)', word: 'lost' }],
      source: 'SOURCES: NYT, 16 JUL 2019 · ÉLYSÉE RECORD · PARIS PROSECUTOR' }]] }),

  // L32 — the first crews are minutes away
  S('paris', L(32), { route: 1, routeAt: 0.2, routeDur: 4.2, boat: 0, pump: 0, clock: '18:51', zoomTo: { x: 860, y: 470, z: 1.35, at: 'climb', dur: 2 },
    source: 'SCHEMATIC MAP · OUTLINES SIMPLIFIED · ROUTE ILLUSTRATIVE · FIRST CREWS JUST BEFORE 19:00 (NYT)' }, { mood: M('urgency', 'A', [0.5, 0.65]) }),
]);
export default shots;
