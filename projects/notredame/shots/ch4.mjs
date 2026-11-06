// Chapter 4 shots: 4. THE SECOND CLOCK (lines 68–95; file order 93–94 before 88a). Shot writer's list after VISUALS.md (rev 9)
// and OUTLINE.md §5 (CH.4) / §9 (the guess silence). New sets for this chapter live in sets/nd-tower.js (registered additively
// in nd-graphics.js GSETS): briefing, stairStrip, deadlineWheel, riser, tallyField, nightModel. bellFrame (nd-sets) carries L85.
//
// Light (VISUALS): full night plates L68, L76, L82–87, L93, L95; dusk-tint paper L69–71, L73–74, L78?, L81, L86a; daylight
// paper inserts L72, L79–80, L94, L88a (type card).
// Fact locks honoured: the climb is a flat STAIR STRIP toy beside the closed model (never a route inside a tower); the briefing
// table is its own set (never inside the cathedral); faceless dial-head figures, the president seated (no telephone, no empty
// chair); the frame is UNLIT until L85 (tower flame + smoke beneath it), its band appears only with the 21:36 log chip; the
// hoses put out the wall and floor flames only, the frame band shrinks under the culture ministry's water (L86a) and folds on
// "She is saved"; the right wheel carries record tags only, never a minute count; bells dormant except L85 (the bell is RED),
// never off their pins; no names or faces for the team; no blame; fire is never red (red loops round brass flame).
//
// Picture idea per shot (→ = beat cut on a spoken word; ~ = an in-set move on a word):
//   ch4   chapter card, clock two lit (deadline)
//   s401  L68  the burnt roof lid lifts off the side card and is laid aside, ROOF · GONE (red: the tag's notch)
//              → "Now": the briefing table, SEND THEM IN / HOLD BACK part on "decide" (red: the gap) ~ "under": push to the window
//   s402  L69  POLICE HEADQUARTERS plate drops; ~ "Two": push to the plates, WEIL and GALLET light in turn ("told it later");
//              ~ "remembers": Gallet's dial turns to the window, chip "as remembered by Weil" (red: the window frame)
//   s403  L70  close on Weil, his dial turns to the window; STRIP his words (red: "collapse")
//   s404  L71  cards + the seated president: his plate lights on "President"; ~ "nothing": HOLD BACK flips to DO NOTHING · 05:00,
//              its towers fade (red: the north tower outline); STRIP Gallet's French
//   s405  L72  the stair-strip toy laid flat on the day table: the teal route draws S → bridge → N; the mainspring tightens on
//              "within"; STRIP « … dans la demi-heure » (red: "demi-heure")
//   s406  L73  POV at the table: ~ "Send" push left, ~ "Hold" push right, ~ "Make" back to both; 3.0 s silence (red: the edge)
//   s407  L74  the right wheel close: QUOTE STRIP « OK, allez-y mon général… »; ~ "Clock": the mainspring winds, the wheel starts,
//              ≈ 21:30 tag; two-line ⚠ chip (red: the ½ H tag)
//   s408  L76  the tally field at the foot of the S-strip: twenty step forward, turn teal (red: their ring) ~ "clear": Weil STRIP
//   s409  L78  a card TV camera before the bell-frame toy (unlit frame, tower burning beneath); Nuñez strips FR/EN; the corner
//              wheel hangs "21:40 · Nuñez" silently (red: "pas acquis")
//   s410  L79  MECH: the cathedral's own riser leaks, the gauge drops on "pressure"; NYT reconstruction chip (red: the needle)
//   s411  L80  MECH macro: thumb-size embers hole a hose (red: the first hole) ~ "New": pull back, the NYT chip stays
//   s412  L81  the stair strip stands up: twenty teal tallies climb the S-strip with two engine-fed hoses (red: the nozzle)
//              → "Gallet's": the right wheel close, index ticking, record tags swinging (red: the notch). Escapement tick starts.
//   s413  L82–84 one continuous climb: the gate folds on "break" (red: latch) ~ "Part": wall flame, then floor flame (red: the
//              floor loop) ~ "climb": up to BELL HEIGHT, the unlit miniature frame above, smoke rising (red: the mark)
//   s414  L85  (loupe in) the frame POV: eight bells, the biggest "more than 4 t" (red: the bell); "fire": the band + 21:36 log chip
//   s415  L86  hoses on the wall, then the floor: they fold away; the frame band set back, pale (red: the floor flame loop)
//   s416  L86a the night front: a water curtain at the top of both towers over the frame band, which shrinks (red: its loop)
//   s417  L87  GEN. GONTIER up the N-strip, down the S-strip; the band folds as he reaches the bottom (red: the band loop)
//              → "three": the wheel stops dead on "saved", stop tags, « Elle est sauvée » (red: the stopped notch)
//   s418  L88  two ≈ tags on a string across the night front, the dashed ½ h arc, chip "approximate times" (red: the arc notch)
//   s419  L93  the night parvis: the teal tower team and the ink crews of L57; the "0" card, brass clip (red: the 0). No tick.
//   s420  L94  ≈ 500 as ten blocks of fifty ~ "One": 1 FIREFIGHTER + 2 POLICE pills slide out (red: their ring)
//   s421  L88a TYPE card "How close?" (red: the ?) → "answer": the roofless model at night, a survey-lamp beam sweeps the vault,
//              then the bell toy; the loupe lies unused (red: the spot being read)
//   s422  L95  looking down into the open model: one burning piece strikes the shell, dust; "three": three breaks (one red)
//              → "And": the camera lifts, flame bands still crawl round the shell, pieces still dropping
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(4);

const NYT = 'NYT, 16 JUL 2019';
const NIGHT = 'night', DUSK = 'dusk', DAY = 'day';
const NYT_CHIP = { text: 'NYT reconstruction', sub: 'single source', at: 0.1, small: true };
const WEIL_T = 'Weil', GALLET = 'Gallet';

export const shots = check([
  CH('The Second Clock', 'the tower plan', { lit: 'deadline', red: 'clock' }),

  // L68 — the roof is gone; the decision, under eight bells
  S('nightModel', L(68), { view: 'lid', sky: NIGHT, liftAt: 'roof', red: 'tag', smokeSeed: 41,
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 990, y: 600, z: 1.07, at: 0, dur: 2.2 },
    source: 'ILLUSTRATION · PAPER MODEL · THE ROOF LID LAID ASIDE (THE ONLY TIME)' },
  { mood: M('tension', 'D', [0.3, 0.5], { clock: false, until: 's407', untilAt: -3.1 }),
    beats: [['Now', 'briefing', { view: 'room', sky: DUSK, plate: false, cards: true, part: 1, partFrom: 0, partAt: 'decide', partDur: 0.8, red: 'gap', redAt: 'decide+0.6',
      corner: { label: 'Clock two', sub: 'not yet wound', at: 0.3, r: 70 },
      cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 1250, y: 380, z: 1.3, at: 'under', dur: 1.3 },
      source: 'ILLUSTRATION · A SEPARATE BRIEFING TABLE · THE BELL-FRAME TOY BEYOND THE WINDOW, ITS TOWER BURNING BENEATH IT' }]] }),

  // L69 — the briefing at police headquarters; the two men who told it
  S('briefing', L(69), { view: 'room', sky: DUSK, plateAt: 'briefed', lit: { weilAt: 'Ariel', galletAt: `${GALLET}@1` }, part: 1,
    gaze: { galletAt: [['remembers', 52]], weilAt: [['Weil@1', 250]] }, red: 'window', redAt: 'remembers',
    chips: [{ text: 'As remembered by Weil', sub: NYT, at: 'remembers' }],
    cam: { x: 920, y: 520, z: 0.98 }, zoomTo: [{ x: 600, y: 640, z: 1.32, at: 'Two', dur: 1.4 }, { x: 1080, y: 480, z: 1.12, at: 'remembers', dur: 1.6 }],
    source: 'ILLUSTRATION · POLICE HEADQUARTERS ≈ 20:30 (NYT) · AS TOLD LATER BY WEIL AND GALLET' }),

  // L70 — Weil's words (his own composition: close, the window beyond)
  S('briefing', L(70), { view: 'room', sky: DUSK, plate: false, lit: { weilAt: 0, galletAt: 0 }, told: false, part: 1, cards: false, red: 'none',
    gaze: { weilAt: [[0.2, 200], ['knew', 62]], galletAt: [[0, 52]] },
    strip: { lines: ['"We knew what he meant. He meant Notre-Dame could collapse."', `Ariel Weil, mayor of the 4th arrondissement · ${NYT}`], at: 'knew', red: 'collapse', redAt: 'collapse', pos: 'top' },
    cam: { x: 1010, y: 420, z: 1.32 }, zoomTo: { x: 820, y: 470, z: 1.62, at: 0.3, dur: 4.8 },
    source: 'ILLUSTRATION · AS REMEMBERED BY ARIEL WEIL (NYT, 16 JUL 2019)' }),

  // L71 — the two options, by Gallet's own account; the president at the table
  S('briefing', L(71), { view: 'room', sky: DUSK, plate: false, lit: { weilAt: 0, galletAt: 0, presidentAt: 'President' }, told: false, part: 1,
    flip: 1, flipAt: 'nothing', flipDur: 0.5, fade: 1, fadeAt: 'towers', fadeDur: 1.2, red: 'tower', redAt: 'towers',
    gaze: { presidentAt: [[0, 230], ['President', 200]], galletAt: [[0, 80]] },
    strip: { lines: ['« Soit on ne fait rien, et à 5 heures du matin on ne verra plus les deux tours. »', 'Gen. Gallet, his own account · franceinfo, 15 Apr 2020'], at: 'nothing' },
    cam: { x: 1150, y: 520, z: 1.5 }, zoomTo: { x: 1230, y: 600, z: 1.95, at: 'nothing', dur: 1.2 },
    source: 'ILLUSTRATION · GALLET’S OWN ACCOUNT (FRANCEINFO, 15 APR 2020) · THE PRESIDENT WAS IN THE ROOM' }),

  // L72 — the other option: the route up the flat stair strip, within the half hour
  S('stairStrip', L(72), { layout: 'flat', sky: DAY, route: 1, routeAt: 'Send', routeDur: 1.7, spring: 1, springFrom: 0.15, springAt: 'within', springDur: 1.1, red: 'none',
    note: { text: '« … une manœuvre qu’on n’est pas sûrs de réussir, car il faut la réaliser dans la demi-heure »', sub: ['"… a manoeuvre we’re not sure will work,', 'because it has to be done within the half hour"', 'Gen. Gallet · franceinfo, 15 Apr 2020'], at: 'try', red: 'demi-heure', redAt: 'half', x: 84, y: 170, w: 650, size: 42 },
    cam: { x: 560, y: 420, z: 0.82, rot: -2 }, zoomTo: { x: 610, y: 400, z: 0.88, at: 0, dur: 7 },
    source: 'ILLUSTRATION · THE STAIR STRIPS LAID FLAT BESIDE THE MODEL · ROUTE AFTER THE NYT (16 JUL 2019)' }),

  // L73 — you decide (the guess silence: 3.0 s after "Make your call.")
  S('briefing', L(73), { view: 'pov', sky: DUSK, lit: { presidentAt: 0 }, part: 1, red: 'edge', trans: 'fold-away',
    corner: { label: 'Clock two', sub: 'unwound', at: 0, r: 64 },
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: [{ x: 700, y: 640, z: 1.28, at: 'Send', dur: 1.2 }, { x: 1220, y: 640, z: 1.28, at: 'Hold', dur: 1.2 }, { x: 960, y: 540, z: 1.06, at: 'Make', dur: 1.4 }],
    source: 'ILLUSTRATION · YOUR CALL' }, { ...HOLDS['73'] }),

  // L74 — the answer, as Gallet remembers it; clock two starts
  S('deadlineWheel', L(74), { sky: DUSK, wind: 1, windAt: 'Clock', windDur: 0.9, runAt: 'Clock+0.9', red: 'half', redAt: 'Clock',
    tags: [{ text: '≈ 21:30 · plan accepted', sub: 'culture ministry', at: 'starts' }],
    strip: { lines: ['« OK, allez-y mon général… »', '"OK. Go ahead, General." · the president’s answer, as Gallet remembers it · franceinfo, 15 Apr 2020'], at: 'OK', serif: true, outAt: 'Clock-0.2' },
    warn: { lines: ['NYT, 16 Jul 2019: Macron "remained silent, but appeared to give tacit approval"', 'Gallet gives no time · NYT puts his briefing ≈ 20:30'], at: 'half' },
    cam: { x: 900, y: 500, z: 1.14 }, zoomTo: { x: 1000, y: 520, z: 0.96, at: 'Clock', dur: 1.6 },
    source: 'ILLUSTRATION · ≈ 21:30 PLAN ACCEPTED: CULTURE MINISTRY · THE WHEEL CARRIES NO MINUTE COUNT' },
  { mood: M('urgency', 'D', [0.3, 0.5], { word: 'OK', hit: true, clock: false }) }),

  // L76 — about twenty go in
  S('tallyField', L(76), { view: 'foot', sky: NIGHT, step: 1, stepAt: 'firefighters', stepDur: 1.0, red: 'ring',
    chips: [{ text: '« Une vingtaine de sapeurs-pompiers ont risqué leur vie »', sub: 'French government record, 17 Apr 2019', at: 'go' }],
    strip: { lines: ['"It was clear that some firefighters were going to go into the cathedral without knowing if they would come back out."', `Ariel Weil · ${NYT}`], at: 'clear' },
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 1120, y: 620, z: 1.22, at: 'clear', dur: 2.0 },
    source: 'ILLUSTRATION · GROUPS OF FIVE · NOT A COUNT OF THE NIGHT’S CREWS' }),

  // L78 — Nuñez on camera at 21:40: not contained, not certain
  S('nightModel', L(78), { view: 'tv', sky: NIGHT, smokeSeed: 78,
    corner: { label: 'Clock two', sub: 'running', at: 0, runAt: 0, r: 62, tags: [{ text: '21:40 · Nuñez', at: 'Nine' }] },
    strip: { lines: ['« L’incendie n’est pas circonscrit »', '"The fire is not contained" · Laurent Nuñez, 21:40 · Public Sénat, 15 Apr 2019'], at: 'camera', outAt: 'Saving-0.5' },
    strip2: { lines: ['« … n’est pas acquis »', '"… is not certain" · saving the cathedral · Laurent Nuñez · Public Sénat, 15 Apr 2019'], at: 'Saving', red: 'pas acquis', redAt: 'certain' },
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: [{ x: 760, y: 560, z: 1.16, at: 'deputy', dur: 1.6 }, { x: 1180, y: 380, z: 1.32, at: 'Saving', dur: 1.6 }],
    source: 'ILLUSTRATION · THE FRAME NOT YET BURNING · THE TOWER BELOW IT ON FIRE (NYT ≈ 20:30)' }),

  // L79 — first problem: water
  S('riser', L(79), { view: 'riser', leak: 1, leakAt: 'leaking', needle: 1, needleAt: 'pressure', needleDur: 2.0, red: 'needle',
    chips: [{ text: 'What follows: a reconstruction', sub: 'by the NYT, 16 Jul 2019 · single source', at: 'water' }],
    cam: { x: 920, y: 520, z: 0.96 }, zoomTo: [{ x: 760, y: 520, z: 1.2, at: 'One', dur: 1.4 }, { x: 1080, y: 440, z: 1.45, at: 'pressure', dur: 1.2 }],
    source: 'ILLUSTRATION · THE CATHEDRAL’S OWN PIPE · RECONSTRUCTION: NYT, 16 JUL 2019' }),

  // L80 — embers the size of your thumb
  S('riser', L(80), { view: 'hose', holesAt: ['Embers+0.5', 'burning', 'holes'], thumbAt: 'thumb', red: 'hole', redAt: 'burning',
    chips: [NYT_CHIP, { text: 'The team’s answer', sub: 'traced by the NYT', at: 'traced' }],
    cam: { x: 760, y: 560, z: 1.28 }, zoomTo: { x: 960, y: 540, z: 1.0, at: 'New', dur: 1.6 },
    source: 'ILLUSTRATION · EMBER SIZE AS REPORTED · NYT, 16 JUL 2019' }),

  // L81 — they bring their own water; the half hour is running (the escapement tick starts)
  S('stairStrip', L(81), { sky: DUSK, lead: 0.55, leadAt: 'hoses', leadDur: 5.0, red: 'nozzle', smoke: 1, chips: [NYT_CHIP],
    cam: { x: 900, y: 430, z: 0.86 }, zoomTo: { x: 800, y: 520, z: 1.0, at: 'hoses', dur: 5 } },
  { mood: M('tension', 'D', [0.55, 0.8], { clock: true, riser: true }),
    beats: [[`${GALLET}'s`, 'deadlineWheel', { sky: DUSK, runAt: 0, red: 'notch', half: true,
      tags: [{ text: '≈ 21:30 · plan accepted', sub: 'culture ministry', at: 0 }, { text: '21:40 · Nuñez', sub: 'on camera', at: 0 }],
      cam: { x: 960, y: 430, z: 1.1 }, zoomTo: { x: 960, y: 420, z: 1.18, at: 0, dur: 3 } }]] }),

  // L82–84 — one continuous climb: the gate, the wall and floor flames, up toward the bells
  S('stairStrip', L(82, 84), { sky: NIGHT, leadKeysAt: [[0, 0.56], ['High', 0.66, 2.0], ['break+0.35', 0.8, 2.2], ['climb', 1.0, 2.4]],
    gate: 1, gateAt: 'break', gateDur: 0.35, wallFlame: 1, wallFlameAt: 'wall', floorFlame: 1, floorFlameAt: 'floor', smoke: 1,
    redSeq: [{ red: 'latch', at: 0 }, { red: 'floor', at: 'floor' }, { red: 'mark', at: 'climb' }], chips: [NYT_CHIP],
    cam: { x: 880, y: 380, z: 1.7 }, zoomTo: [{ x: 1200, y: 300, z: 1.7, at: 'Part', dur: 1.1 }, { x: 1150, y: 110, z: 1.45, at: 'climb', dur: 1.6 }],
    source: 'ILLUSTRATION · NYT, 16 JUL 2019 · THE FRAME NOT YET BURNING' }),

  // L85 — above them the eight bells; the frame is on fire (the band arrives with the 21:36 log entry)
  S('bellFrame', L(85), { sky: NIGHT, open: 1, char: 0.5, charAt: 'fire', charDur: 0.9, flame: 0.85, flameAt: 'fire', flameDur: 0.5, redBell: 0, slip: 0,
    weights: false, labels: false, clock: null, crowd: false, trans: 'loupe', transOpts: { at: [0.6, 0.12] },
    chips: [{ text: 'The biggest: more than 4 t', sub: '8 bells · 2013 set', at: 'biggest' }, { text: '21:36 · logged', sub: '« … et le beffroi nord est atteint »', at: 'fire' }],
    cam: { x: 900, y: 470, z: 1.55 }, zoomTo: { x: 960, y: 600, z: 1.12, at: 'And', dur: 1.5 },
    source: 'PAPER MODEL · 21:36: FRENCH GOVERNMENT TIMELINE (17 APR 2019), A LOG ENTRY · BELLS STAY ON THEIR PINS' }),

  // L86 — wall, then floor: those flames go out (the frame band set back, not doused here)
  S('stairStrip', L(86), { sky: NIGHT, lead: 0.9, wallFlame: 1, floorFlame: 1, wallOut: 1, wallOutAt: 'wall+0.7', floorOut: 1, floorOutAt: 'floor+0.8',
    spray: [{ to: 'wall', at: 'turn', untilAt: 'wall+1.3' }, { to: 'floor', at: 'Then', untilAt: 'floor+1.5' }], band: 1, pale: true, red: 'floor',
    chips: [{ text: 'NYT, 16 Jul 2019', sub: 'single source', at: 0.1, small: true }],
    cam: { x: 1210, y: 250, z: 1.75 }, zoomTo: { x: 1180, y: 200, z: 1.5, at: 'One', dur: 1.6 },
    source: 'ILLUSTRATION · THE TEAM’S HOSES PUT OUT THE WALL AND FLOOR FLAMES (NYT, 16 JUL 2019)' }),

  // L86a — more water at the very top of the towers, aimed at the frame
  S('nightModel', L('86a'), { view: 'curtain', sky: NIGHT, band: 1, bandTo: 0.42, bandAt: 'aimed', bandDur: 2.4, waterAt: 'water', red: 'band', smokeSeed: 86,
    strip: { lines: ['« … et éteindre le feu qui a pris dans le beffroi nord »', '"… and put out the fire that had caught in the north belfry" · culture ministry, « Les témoins racontent »'], at: 'aimed' },
    cam: { x: 960, y: 380, z: 1.32 }, zoomTo: { x: 960, y: 470, z: 1.06, at: 0, dur: 5.5 },
    source: 'ILLUSTRATION · CULTURE MINISTRY · NO TEAM SIZE GIVEN' }),

  // L87 — Gontier goes up to look; three words; the tick stops dead
  S('stairStrip', L(87), { sky: NIGHT, lead: 0.9, band: 1, bandOut: 1, bandOutAt: 'words', bandOutDur: 0.5, gonUp: 1, gonUpAt: 'goes', gonUpDur: 1.0, gonDown: 1, gonDownAt: 'comes', gonDownDur: 1.5, red: 'band',
    plates: [{ name: 'GEN. GALLET', role: 'in command', at: 0 }, { name: 'GEN. GONTIER', role: 'brigade general', at: 'Gontier', gaze: 0 }],
    cam: { x: 1150, y: 170, z: 1.35 }, zoomTo: { x: 920, y: 470, z: 0.92, at: 'comes', dur: 1.3 },
    source: 'ILLUSTRATION · GONTIER’S WORDS: CULTURE MINISTRY · NO FACES' },
  { mood: M('triumph', 'D', [0.35, 0.5], { word: 'saved' }),
    beats: [['three', 'deadlineWheel', { sky: NIGHT, runAt: -52, stopAt: 'saved', red: 'notch', half: true,
      tags: [{ text: '≈ 21:30 · plan accepted', sub: 'culture ministry', at: 0 }, { text: '21:40 · Nuñez', sub: 'on camera', at: 0 },
        { text: '≈ 21:45 · flames under control', sub: 'NYT', at: 'saved' }, { text: '≈ 22:00 · « Elle est sauvée »', sub: 'culture ministry', at: 'saved+0.35' }],
      strip: { lines: ['« Elle est sauvée »', '"She is saved." · Gen. Jean-Marie Gontier'], at: 'She', serif: true },
      cam: { x: 940, y: 450, z: 1.02 }, source: 'ILLUSTRATION · STOP TAGS: NYT (CONTROL) · CULTURE MINISTRY (THE QUOTE) · APPROXIMATE' }]] }),

  // L88 — around ten at night: about half an hour since the go-ahead (approximate, one source)
  S('nightModel', L(88), { view: 'tags', sky: NIGHT, at: 0.05, red: 'arc',
    chips: [{ text: 'Approximate times, one source', sub: 'culture ministry, « Les témoins racontent »', at: 0.05 }],
    cam: { x: 960, y: 430, z: 1.1 }, zoomTo: { x: 960, y: 420, z: 1.18, at: 0, dur: 7 },
    source: 'ILLUSTRATION · CULTURE MINISTRY · THE ARC IS DASHED: APPROXIMATE' }),

  // L93 — nobody died (no tick, no foley; slow 4 % lean-out; the 0 holds)
  S('tallyField', L(93), { view: 'parvis', sky: NIGHT, zeroAt: 'died', red: 'zero',
    chips: [{ text: '« Aucune victime »', sub: 'La DH / Belga, 15 Apr 2019', at: 'Not' }],
    cam: { x: 960, y: 560, z: 1.04 }, zoomTo: { x: 960, y: 560, z: 1.0, at: 0, dur: 5.5 },
    source: 'ILLUSTRATION · TEAL: THE TOWER TEAM · INK: THE CREWS OF THE NAVE (A DIFFERENT GROUP)' },
  { mood: M('melancholy', 'D', [0.22, 0.32]) }),

  // L94 — nearly five hundred; one very slightly hurt, two police officers
  S('tallyField', L(94), { view: 'field', sky: DAY, pills: 1, pillsAt: 'One', red: 'pills', redAt: 'One',
    cam: { x: 960, y: 560, z: 1.04 }, zoomTo: { x: 960, y: 560, z: 1.0, at: 0, dur: 8 },
    source: 'ILLUSTRATION · ONE BLOCK = 50 · FRENCH GOVERNMENT RECORD, 17 APR 2019' }),

  // L88a — how close? the answer was in the stone and the oak
  S('nightModel', L('88a'), { view: 'type', sky: DAY, text: 'How close?', at: 0.1, qAt: 'come', source: null },
  { mood: M('mystery', 'D', [0.3, 0.45]),
    beats: [['answer', 'nightModel', { view: 'survey', sky: NIGHT, sweepAt: 'stone', sweep2At: 'oak', red: 'spot',
      cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 1000, y: 540, z: 1.1, at: 0, dur: 5 },
      source: 'ILLUSTRATION · THE SURVEY TOOK MONTHS (CHAPTER 5)' }]] }),

  // L95 — saved isn't safe: the vault, one burning piece, three breaks; the fire burns on until morning
  S('nightModel', L(95), { view: 'vault', sky: NIGHT, dropAt: 'Burning+0.9', breakAt: 'three', red: 'break', smokeSeed: 95,
    cam: { x: 960, y: 540, z: 0.98 }, zoomTo: [{ x: 900, y: 560, z: 1.32, at: 'Under', dur: 2.6 }],
    source: 'ILLUSTRATION · LOOKING DOWN INTO THE OPEN MODEL · SCHEMATIC SHELL, NOT A PLAN' },
  { mood: M('tension', 'D', [0.4, 0.6], { word: 'Under' }),
    beats: [['fire', 'nightModel', { view: 'vault', sky: NIGHT, breaks: true, dropAt: -10, bands: 1, bandsAt: 0.2, bandsDur: 1.6, rain: 1, red: 'break',
      cam: { x: 900, y: 560, z: 1.32 }, zoomTo: { x: 960, y: 540, z: 0.86, at: 0, dur: 3.2 },
      source: 'ILLUSTRATION · THE FIRE BURNED ON UNTIL MORNING (CHAPTER 5 GIVES THE TIME)' }]] }),
]);
export default shots;
