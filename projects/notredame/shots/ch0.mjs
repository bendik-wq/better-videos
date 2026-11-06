// Chapter 0 shots: COLD OPEN (lines 1–8) + the title card. VISUALS.md "COLD OPEN", OUTLINE §5 beat sheet 0:00–0:35.
// One composition per line (the hook re-hooks on every line), in-set moves inside the longer lines, one red thing per frame:
//   L1 thumbnail frame (red bell, ON its pin) -> card-flip to the folded model at 18:18 (red: the clock flap, spinning back)
//   L2 façade -> push onto the presbytery window, the panel screen lights FEU (red: the FEU lamp)
//   L3 the panel ticket, four strings (red: loop round ATTIC NAVE SACRISTY)
//   L4 clock one: the brigade wheel rolls 18:18 -> 18:48, small "≈ +30" (red: the FEU start flap)
//   L5 bell-frame toy, flash-forward, beam burning, bell on its pin -> clock two slides in on "Clock" (red: the bell)
//   L6 domino FRAME → BELLS → NORTH TOWER → CATHEDRAL, "officials' fear", NYT strip first 2 s (red: CATHEDRAL's tilting edge)
//   L7 Nuñez card, BBC 16 Apr 2019, the day after (red: the "15–30" underline)
//   L8 the question on a type card, the closed north belfry door cracks open on "what" (red: the question mark ring)
import { chapter, M } from './lib.mjs';
const { S, L, check } = chapter(0);

export const shots = check([
  S('cathedral', L(1), {
    view: 'thumb', pinned: true, glow: 0, smokeSeed: 3,
    tags: [{ at: [1436, 360], to: [560, 120], text: 'Spire', sub: 'fell ≈ 19:45–19:50', size: 30, swing: -2 }],
  }, {
    padIn: 0.3, mood: M('tension', 'D', [0.3, 0.55], { riser: true }),
    beats: [['evening', 'cathedral', {
      view: 'fold', sky: 'day', fire: 0, smoke: 0, red: 'clock', clockFrom: '19:50', clock: '18:18', clockAt: 0.05, clockDur: 1.0,
      kicker: '15 APR 2019 · PARIS', zoomTo: { x: 990, y: 520, z: 1.07, at: 0, dur: 4 },
      source: 'SOURCES GIVE 18:18 (NYT, 16 JUL 2019) OR 18:20 (PROSECUTOR) · ILLUSTRATION', trans: 'card-flip',
    }]],
  }),
  S('cathedral', L(2), {
    view: 'facade', sky: 'day', fire: 0, smoke: 0, labels: false, rule: false, red: 'post', clock: '18:18',
    post: true, postAt: 'Feu', cam: { x: 1010, y: 560, z: 1.02 }, zoomTo: { x: 1548, y: 820, z: 2.7, at: 'screen', dur: 1.4 },
    source: 'ILLUSTRATION · THE SECURITY POST WAS IN THE PRESBYTERY · NYT, 16 JUL 2019',
  }),
  S('doc', L(3), { kind: 'ticket', typeAt: 0.2, at: 'two' }),
  S('clock', L(4), {
    from: '18:18', to: '18:48', roll: 1, rollAt: 'called', rollDur: 2.2, flapRed: true, red: 'none', tagText: '≈ +30', tagScale: 0.6,
    labelL: 'Clock one · delay', subL: 'FEU 18:18 · ALSO GIVEN AS 18:20', labelR: 'Brigade called', subR: '18:48 NYT · 18:51 FRENCH GOVT RECORD',
    title: 'Clock one: the lost time', titleAt: 'Clock', cathedral: false, smokeSeed: 5, cam: { x: 960, y: 480, z: 1 }, zoomTo: { x: 900, y: 450, z: 1.06, at: 'Clock', dur: 2.5 },
    source: 'TIMES: NYT, 16 JUL 2019 · FRENCH GOVERNMENT RECORD',
  }),
  S('bellFrame', L(5), {
    sky: 'day', open: 1, char: 0.6, flame: 0.6, redBell: 2, clock: null, smokeSeed: 11,
    wheel: { label: 'Clock two · deadline', sub: 'the fire chief’s half hour', min: 30, x: 1300, y: 360, scale: 0.76 }, wheelAt: 'Clock',
    zoomTo: { x: 1010, y: 560, z: 1.06, at: 0, dur: 7 },
    source: 'PAPER MODEL · FLASH-FORWARD · « DANS LA DEMI-HEURE »: GALLET’S OWN WORDS (NYT)',
  }),
  S('bellFrame', L(6), {
    layout: 'pair', sky: 'day', open: 1, char: 0.3, flame: 0.35, redBell: -1, weights: false, labels: false, clock: null, smokeSeed: 17,
    domino: 1, dominoAt: 'officials', dominoDur: 2.6,
    chainLabels: ['Frame', 'Bells', 'North tower', 'Cathedral'], chainRed: 3, chainTag: 'Officials’ fear', chainTagSub: 'not an event',
    strip: 'Notre-Dame Came Far Closer to Collapsing Than People Knew', stripSub: 'NYT, 16 JUL 2019', stripAt: 0, stripDur: 2.0,
    source: 'PAPER MODEL · THE FEAR OFFICIALS DESCRIBED, NOT AN EVENT · NYT, 16 JUL 2019',
  }, { mood: M('urgency', 'D', [0.6, 0.75], { hit: true }) }),
  S('quote', L(7), {
    text: 'We now know it all came down to 15–30 minutes.', fr: null, by: 'Laurent Nuñez · BBC, 16 Apr 2019',
    role: 'an estimate, the day after · which minutes: not stated', date: '', highlight: ['15–30'], hlAt: 'fifteen',
    source: 'SOURCE: BBC NEWS, 16 APR 2019 · LAURENT NUÑEZ, DEPUTY INTERIOR MINISTER',
  }),
  S('bellFrame', L(8), {
    sky: 'day', open: 0.35, openAt: 'what', openDur: 1.0, char: 0, flame: 0, redBell: -1, weights: false, labels: false, clock: null, smokeSeed: 23,
    cam: { x: 560, y: 520, z: 1 }, captionY: 400, caption: ['Who climbed into', 'that burning tower?'], captionAt: 0.15, captionSub: 'And what waited up there?', captionSubAt: 'what',
    source: 'PAPER MODEL · THE NORTH TOWER',
  }, { mood: M('mystery', 'D', 0.3) }),
  { id: 'title', set: 'title', params: {}, min: 6, mood: M('wonder', 'D', 0.7, { hit: true }) },
]);
export default shots;
