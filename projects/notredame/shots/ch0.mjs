// Chapter 0 shots: COLD OPEN (lines 1–8) + the title card. VISUALS.md "COLD OPEN", OUTLINE §5 beat sheet 0:00–0:35.
// One composition per line (the hook re-hooks on every line), in-set moves inside the longer lines, one red thing per frame:
//   L1 thumbnail frame (red bell, ON its pin) -> card-flip to the folded model at 18:18 (red: the clock flap, spinning back)
//   L2 façade -> push onto the presbytery window, the panel screen lights FEU (red: the FEU lamp)
//   L3 the panel screen readout: FEU + ATTIC NAVE SACRISTY (last two strings withheld as grey bars until L14/15), teal ✓ on
//      "worked" -> on "two" it shrinks up and the zone line forks to NAVE ATTIC / SACRISTY ATTIC (red: the fork point)
//   L4 clock one: FEU 18:18 (left), the ONLY wheel; on "called" the card phone rings and a paper call-log card (18:48 NYT · 18:51 govt) swings in, the spring stretches to it (red: FEU flap)
//   L5 the bell-frame toy alone on the table (no tower walls), flash-forward, beam burning, bell on its pin -> clock two slides in
//      on "Clock": unwound, no minute digits, "½ h" face (red: the bell)
//   L6 the domino alone: four standing folded cards (FRAME → BELLS → NORTH TOWER → CATHEDRAL), FRAME trembles, only CATHEDRAL tips, "officials' fear", NYT strip along the bottom for 2 s,
//      Nuñez card starts its slide up on "collapse" (red: CATHEDRAL's tilting edge)
//   L7 Nuñez card, BBC 16 Apr 2019, the day after (red: the "15–30" underline)
//   L8 the question on a TYPE card on teal shade; the north-tower toy small and dormant in the corner, door shut (red: the ? ring)
import { chapter, M } from './lib.mjs';
const { S, L, check } = chapter(0);

export const shots = check([
  S('cathedral', L(1), {
    view: 'thumb', closedNorth: true, belfryToy: { x: 430, y: 1050, w: 440 }, lean: 0, glow: 0, smokeSeed: 3, border: false, seal: false,
    thumbText: ['15 APR', '2019'], textSize: 170, textY: 220, // the exported thumbnail keeps "IF THEY FALL"; in the film the slab is the date
    tags: [{ at: [1436, 360], to: [1290, 18], text: 'Spire', sub: 'fell ≈ 19:45–19:50', size: 36, subScale: 0.75, swing: -1 }],
  }, {
    padIn: 0.3, mood: M('tension', 'D', [0.3, 0.55], { riser: true }),
    beats: [['evening', 'cathedral', {
      view: 'fold', sky: 'day', fire: 0, smoke: 0, red: 'clock', clockFrom: '19:50', clock: '18:18', clockAt: 0.05, clockDur: 1.0, crowd: false,
      kicker: '15 APR 2019 · PARIS', zoomTo: { x: 1050, y: 560, z: 1.04, at: 0, dur: 4 },
      source: 'SOURCES GIVE 18:18 (NYT, 16 JUL 2019) OR 18:20 (PROSECUTOR) · ILLUSTRATION', trans: 'card-flip',
    }]],
  }),
  S('cathedral', L(2), {
    view: 'facade', sky: 'day', fire: 0, smoke: 0, labels: false, rule: false, red: 'post', clock: '18:18', crowd: false, tools: false,
    post: true, postAt: 'Feu', postLabelOffAt: 'screen-0.25', clockOutAt: 'screen-0.3', cam: { x: 1010, y: 560, z: 1.02 }, zoomTo: { x: 1460, y: 790, z: 2.0, at: 'screen', dur: 1.4 },
    source: 'ILLUSTRATION · THE SECURITY POST WAS IN THE PRESBYTERY · NYT, 16 JUL 2019',
  }),
  S('doc', L(3), {
    kind: 'ticket', head: 'FIRE PANEL · SCREEN', meta: ['15 APR 2019', '18:18'], typeAt: 0.2, tape: false,
    lines: [{ t: 'FEU', style: 'big', keyline: true }, 'ATTIC NAVE SACRISTY', { t: 'ZDA-110-3-15-1', style: 'ghost' }, { t: 'ASPIRATING FRAMEWORK', style: 'ghost' }],
    check: { text: 'detector: worked', at: 'worked' },
    fork: { at: 'two', from: 'ATTIC', a: 'NAVE ATTIC', b: 'SACRISTY ATTIC', scale: 0.58, top: 165 },
    label: 'RECREATED TEXT · PANEL STRINGS AS REPORTED', source: 'SOURCE: NYT, 16 JUL 2019 · RECREATED, NOT THE ORIGINAL',
  }),
  S('clock', L(4), {
    from: '18:18', to: '18:48', roll: 1, rollAt: 'called', rollDur: 1.4, flapRed: true, red: 'none', tagText: '≈ +30', tagScale: 0.75, tagAt: 'called+1.4',
    labelL: 'FEU 18:18 (or 18:20)', subL: '', labelR: null, labelSize: 36, flapTagSide: true,
    log: { at: 'called+0.4', dur: 0.8, x: 1180, w: 450, lines: ['Brigade called', '18:48 NYT', '18:51 GOVT RECORD'] }, // ONE wheel on screen: the call is a paper log card off the phone
    rx: 1300, phone: { at: 'called', dur: 1.5, x: 1560, y: 790, ticks: true },
    title: 'Clock one: the lost time', titleAt: 'Clock', cathedral: false, smokeSeed: 5, cam: { x: 960, y: 480, z: 1 }, zoomTo: { x: 960, y: 470, z: 1.03, at: 'Clock', dur: 2.5 },
    source: 'TIMES: NYT, 16 JUL 2019 · FRENCH GOVERNMENT RECORD',
  }),
  S('bellFrame', L(5), {
    sky: 'day', bare: true, bareBox: [160, 190, 980, 860], roofs: false, char: 0.6, flame: 0.6, redBell: 2, weights: false, clock: null, smokeSeed: 11,
    bellsText: 'North tower · bell frame', bellsSub: '8 bells · 782 kg – just over 4 t', subScale: 0.75, legs: false, beamTagOutAt: 'Clock+0.7', labelSize: 36, bellsTagX: 110, bellsTagY: 60, beamTagX: 1300, beamTagY: 860,
    wheel: { label: 'Clock two · deadline', sub: 'the fire chief’s half hour', blank: true, face: '½ h', x: 1180, y: 300, scale: 0.72, size: 36, subScale: 0.75, chip: 'Gallet’s words · « dans la demi-heure »' }, wheelAt: 'Clock',
    zoomTo: { x: 980, y: 545, z: 1.03, at: 0, dur: 7 },
    source: 'PAPER MODEL · FLASH-FORWARD · BELLS: REBÂTIR · GALLET: NYT, 16 JUL 2019',
  }),
  S('bellFrame', L(6), {
    layout: 'pair', towers: false, roofs: false, sky: 'day', open: 0, char: 0, flame: 0, redBell: -1, weights: false, labels: false, clock: null, smokeSeed: 17,
    chainStyle: 'standing', chainLabels: ['Frame', 'Bells', 'North tower', 'Cathedral'], chainRed: 3, chainTag: 'Officials’ fear · not an event',
    chainTrembleAt: 'officials', chainTiltAt: 'collapse', chainTilt: 12, chainSize: 40, chainX0: 230, chainGap: 300, chainW: 250, chainH: 300, chainY: 740,
    strip: 'Notre-Dame Came Far Closer to Collapsing Than People Knew', stripSub: 'NYT, 16 JUL 2019', stripAt: 0, stripDur: 2.0, stripY: 800,
    bridge: { at: 'collapse', blank: true, by: 'NUÑEZ · BBC, 16 APR 2019', x: 1450, y: 320, w: 430 }, // the quote types in only at L7
    source: 'PAPER MODEL · THE FEAR OFFICIALS DESCRIBED, NOT AN EVENT · NYT, 16 JUL 2019',
  }, { mood: M('urgency', 'D', [0.6, 0.75], { hit: true }) }),
  S('quote', L(7), {
    text: 'We now know it all came down to 15–30 minutes.', fr: null, by: 'Laurent Nuñez · BBC, 16 Apr 2019',
    role: 'an estimate, the day after · which minutes: not stated', date: '', highlight: ['15–30'], hlAt: 'fifteen', cy: 590, tape: false,
    source: 'SOURCE: BBC NEWS, 16 APR 2019 · LAURENT NUÑEZ, DEPUTY INTERIOR MINISTER',
  }),
  S('bellFrame', L(8), {
    sky: 'day', plate: 'teal', roofs: false, crowd: false, plume: false, open: 0, char: 0, flame: 0, redBell: -1, weights: false, labels: false, clock: null, smokeSeed: 23,
    belfryToy: { x: 1340, y: 990, w: 440 }, // the bell-frame toy, dormant (no flame, brass bell, not red): what waited up there
    captionY: 400, caption: ['Who climbed into', 'that burning tower\u200a?'], captionAt: 0.15, captionSub: 'And what waited up there?', captionSubAt: 'what', captionQdx: 30, captionQr: 38,
    source: 'PAPER MODEL · THE NORTH TOWER',
  }, { mood: M('mystery', 'D', 0.3) }),
  { id: 'title', set: 'title', params: { glow: 0, cw: 1100, cy: 34, sizes: [80, 138, 80], slam: 0 }, min: 6, mood: M('wonder', 'D', 0.7, { hit: true }) },
]);
export default shots;
