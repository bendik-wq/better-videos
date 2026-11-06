// Chapter 2 shots: 2. A WALL OF FLAME (lines 33–46; file order 33, 34, 35, 37, 38, 40, 41, 39, 42, 43, 44, 45, 46).
// VISUALS.md "2. A WALL OF FLAME", OUTLINE §5 (2:43–4:07), peaks 2 (L34–35) and 3 (L43–44). Daylight throughout (L1–58 day).
//   card  numeral 2, the delay wheel stopped at ≈ +30 (case-open)
//   L33   survey sheet: engine tokens roll to the parvis (red: the route) → on "crews" the hose team at the façade, the
//         ≈ 500 · 70+ · 2 fireboats · 7 hours tally chip lands last (red: the nozzle man's helmet)
//   L34   POV from the attic door: three parallax flame layers in the opening, NYT chip (red: loop on the nearest layer)
//   L35   2.0 s held door (flames push at the lens) → "They're forced back": ink tallies back out, retreat arrow (red: arrow)
//   L37   460 t lead odometer, 210 + 250 split (red: the underline) · Culture ministry
//   L38   the forest: lead drips and runs out over the vault humps (red: one drip)
//   L40   tape-feed time skip: the date flap 15 → 11 APR 2019, the crane lifts the 16 statues off (red: flap → statues)
//   L41   gloved hands pass the Crown of Thorns (red: the crown) → "chaplain": the chain, the ciborium (red: its ring)
//   L39   the spire on a 96 m ruler, push to the rooster, flames start up its base on "fire" (red: the rooster)
//   L42   card TV in the foreground (≈ 19:40, address postponed), the spire burning behind (red: the power light)
//   L43   wide, locked, bright sky: the spire tips and drops into the roof; music out on "falls" (red: the falling tip)
//   L44   impact on the cut, music hit; close: dust, no hole at the crossing (red: the gap where it stood)
//   L45–46 the nave toy theatre: the ringed box of ink tallies, Gallet strip, the way out fills with flame (red: the box)
// Fact locks kept: no sectioned building (toy theatre box, not a cutaway), no crossing hole, no blame, fire never red,
// one red thing per frame, Gallet "his own later account", spire times both sources, no 18:58 / 19:44 / 19:05 anywhere.
import { chapter, M, HOLDS } from './lib.mjs';
const { S, CH, L, check } = chapter(2);

const NYT = 'NYT, 16 JUL 2019';
const P_BRASS_D = '#7d5a22'; // the crown's thorns in dark brass: only the ring around it is red
export const shots = check([
  CH('A Wall of Flame', 'the first crews · just before 19:00', { lit: 'delay', delay: '≈+30', numFrom: 1, wheelRoll: false, deadline: '–:––' }, M('urgency', 'D', [0.4, 0.55])),

  // L33 · the engines arrive (map) → the hoses go in (façade)
  S('paris', L(33), {
    route: 1, routeAt: 0.2, routeDur: 2.8, boat: 0, pump: 0, clock: null, red: 'route', labelSub: 'first crews · just before 19:00',
    zoomTo: { x: 1010, y: 560, z: 1.85, at: 'pull', dur: 1.4 }, legendOutAt: 'pull-0.3', mapLabelsOutAt: 'pull-0.3', legendXY: [560, 0], tagTo: [-400, 110],
    source: `SCHEMATIC MAP · ROUTE ILLUSTRATIVE · FIRST CREWS "JUST BEFORE 19:00" (${NYT})`,
  }, {
    beats: [['crews', 'firefighters', {
      mode: 'hose', view: 'low', sky: 'day', red: 'nozzle', clock: null, smokeSeed: 31, label: 'Hose lines', sub: 'into the burning roof',
      roofFlames: 2, hoseUp: true, jetTo: [20.5, 57], labelFrom: [470, 880], labelTo: [110, 540],
      cam: { x: 960, y: 380, z: 0.85 }, zoomTo: { x: 970, y: 380, z: 0.9, at: 0, dur: 4 },
      chips: [{ text: '≈ 500 firefighters', sub: '70+ vehicles · 2 fireboats · for 7 hours', at: 'into', right: 900, y: 60, big: true, scale: 1.15 }],
      source: 'ILLUSTRATION · « PRÈS DE 500 SAPEURS-POMPIERS… 7 HEURES DURANT » (FRENCH GOVERNMENT RECORD)',
    }]],
  }),

  // L34 · peak 2: the attic door
  S('forest', L(34), {
    door: true, fire: 0.9, labels: false, red: 'flame', clock: null, smokeSeed: 41, smoke: 0, doorPush: 0.35, doorPushAt: 0, doorPushDur: 4, wall: 1, wallAt: 'Up+0.2', wallDur: 1.0,
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: { x: 960, y: 500, z: 1.1, at: 0, dur: 4 },
    chips: [{ text: '« an unstoppable wall »', sub: NYT, at: 'unstoppable', left: 64, y: 470, scale: 1.6 }],
    source: `ILLUSTRATION · THE VIEW FROM AN ATTIC DOOR · ${NYT}`,
  }, { mood: M('urgency', 'D', [0.6, 0.75], { hit: true }) }),

  // L35 · 2 s held door, then the retreat
  S('forest', L(35), {
    door: true, fire: 1, labels: false, clock: null, smokeSeed: 43, doorPush: 1, doorPushAt: 0, doorPushDur: 2.2, wall: 1,
    retreat: 1, retreatAt: 'forced-0.4', retreatDur: 1.8, red: 'flame', redSeq: [{ red: 'flame', at: 0 }, { red: 'arrow', at: 'forced-0.4' }],
    cam: { x: 960, y: 500, z: 1.1 }, zoomTo: [{ x: 960, y: 470, z: 1.3, at: 0, dur: 2.2 }, { x: 1000, y: 540, z: 1.0, at: 'forced-0.5', dur: 1.0 }],
    source: `ILLUSTRATION · THE FIRST CREWS ARE DRIVEN BACK · ${NYT}`,
  }, { ...HOLDS['35'] }),

  // L37 · how much lead
  S('bignumber', L(37), {
    value: 460, prefix: '≈', suffix: 'T', icon: 'none', at: 'four', kicker: 'LEAD ON THE ROOF AND THE SPIRE', kickerPlate: true, kickerXY: [130, 92], y: 96, odoScale: 0.8, splitSize: 52,
    blank: true, scale: true, dropAt: 'lead', splitAt: 'roof', roll: 1.0, red: 'pointer', label: '', note: '', ruler: false,
    source: 'SOURCE: CULTURE MINISTRY, JO 15 DEC 2020 (210 T ROOF + 250 T SPIRE)',
  }, { mood: M('tension', 'D', [0.35, 0.45]) }),

  // L38 · the lead runs over the vaults
  S('forest', L(38), {
    view: 'lid', lid: 1, lidAt: 0, lidDur: 0.9, fire: 0.85, lead: 1, leadAt: 'melts-0.3', leadDur: 2.6, red: 'drip', clock: null, smokeSeed: 47,
    tagAt: 'melts', tagText: 'Molten lead', tagSub: 'over the stone vaults',
    cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 900, y: 700, z: 1.25, at: 'runs', dur: 2.6 },
    source: 'ILLUSTRATION · LEAD « EN PARTIE FONDU SUR L’EXTRADOS DES VOÛTES » (CULTURE MINISTRY)',
  }),

  // L40 · the one levity beat: four days earlier
  S('cathedral', L(40), {
    view: 'side', sky: 'day', fire: 0, smoke: 0, k: 7, ox: 400, labels: false, clock: null, trans: 'tape-feed',
    flap: '11 APR 2019', flapFrom: '15 APR 2019', flapAt: 0.25, flapSub: 'four days earlier',
    crane: 1, craneAt: 'lifted', craneDur: 5.0, statueCount: '×16', crowd: 'trees', red: 'flap', redSeq: [{ red: 'flap', at: 0 }, { red: 'statues', at: 'crane' }],
    tags: [{ at: [880, 560], to: [440, 300], text: '16 copper statues', sub: 'off for scheduled restoration' }],
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: [{ x: 1000, y: 470, z: 1.15, at: 'lifted', dur: 1.6 }, { x: 990, y: 530, z: 1.02, at: 'Saved', dur: 2 }],
    source: 'ILLUSTRATION · 16 STATUES LIFTED OFF THU 11 APR 2019 FOR RESTORATION (DRAC; CULTURE MINISTRY)',
  }, { mood: M('wonder', 'D', 0.35) }),

  // L41 · saved by hand
  S('firefighters', L(41), {
    mode: 'chain', view: 'close', sky: 'day', u: 1, uAt: 0.3, uDur: 8, red: 'relic', clock: null, smokeSeed: 53,
    label: 'The Crown of Thorns', sub: 'carried out that night', mixed: true, crewDy: 190, labelAt: [330, 230], hands: 'tally', thornCol: P_BRASS_D,
    zoomTo: [{ x: 960, y: 540, z: 1.0, at: 0, dur: 5 }, { x: 960, y: 530, z: 1.08, at: 'Crown', dur: 1.8 }],
    source: 'CROWN OF THORNS: CARRIED OUT THAT NIGHT (CULTURE MINISTRY) · HÔTEL DE VILLE OVERNIGHT, THEN THE LOUVRE',
  }, {
    beats: [['chaplain', 'firefighters', {
      mode: 'chain', view: 'side', sky: 'day', u: 1, uAt: -6, uDur: 12, red: 'chalice', labelOn: 'chaplain', only: ['box', 'frame'], clock: null, smokeSeed: 57,
      winInk: true, chaplain: { x: 760, y: 1060, h: 540, plain: true, collarScale: 2.2 }, clouds: false, cartX: 1380, zoomTo: { x: 820, y: 640, z: 1.22, at: 0.2, dur: 2.6 },
      label: 'The brigade’s chaplain', sub: 'the Blessed Sacrament · by his own account', labelAt: [880, 300],
      source: 'ILLUSTRATION · THE CHAPLAIN’S OWN ACCOUNT · A HUMAN CHAIN OF FIREFIGHTERS, POLICE AND OFFICIALS',
    }]],
  }),

  // L39 · the spire on its ruler, then it catches
  S('spireFall', L(39), {
    sky: 'day', u: 0, hole: false, roofGone: 0, fire: 0.45, smoke: 0.35, ruler: true, rulerX: 78, rulerMin: 50, red: 'rooster', clock: null, shake: false,
    spireFire: 0.4, spireFireAt: 'fire-0.2', spireFireDur: 1.8, smokeSeed: 61,
    tagText: 'The spire · 1859', tagSub: 'Viollet-le-Duc · oak sheathed in lead', tagX: 88, tagY: 62,
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 960, y: 500, z: 1.06, at: 0, dur: 5 },
    source: 'ILLUSTRATION · SPIRE 1859, 93 M; 96 M TO THE ROOSTER (VILLE DE PARIS)',
  }, {
    mood: M('tension', 'D', [0.4, 0.7], { riser: true }),
    beats: [
      // the close on the ruler + rooster (a new composition), then on "And now" the camera pulls back to the wide as it catches
      ['ninety', 'spireFall', { sky: 'day', u: 0, hole: false, roofGone: 0, fire: 0.5, smoke: 0.35, ruler: true, rulerX: 74, rulerMin: 50, red: 'rooster', clock: null, shake: false, smokeSeed: 62, labels: false,
        spireFire: 0.4, spireFireAt: 'fire-0.2', spireFireDur: 1.6,
        tags: [{ at: [990, 130], to: [560, 300], text: 'The copper rooster', sub: '96 m up' }],
        cam: { x: 1010, y: 230, z: 1.9 }, zoomTo: [{ x: 1000, y: 200, z: 2.05, at: 0, dur: 2.6 }, { x: 960, y: 600, z: 1.2, at: 'And', dur: 1.3 }],
        source: 'ILLUSTRATION · SPIRE 1859, 93 M; 96 M TO THE ROOSTER (VILLE DE PARIS)' }],
    ],
  }),

  // L42 · the address is postponed; the spire keeps burning
  S('cathedral', L(42), {
    view: 'facade', sky: 'day', fire: 0.6, smoke: 0.8, spire: 'standing', spireFire: 0.7, spireFireAt: -4, spireFireDur: 11, labels: false, rule: false,
    crowd: true, clock: null, red: 'tv', smokeSeed: 67,
    tv: { head: 'Allocution présidentielle', sub: 'the president’s televised address', stamp: 'REPORTÉE', stampSub: '≈ 19:40', lightR: 24 },
    tvAt: 0.1, stampAt: 'postpones',
    cam: { x: 700, y: 500, z: 1.0 }, zoomTo: { x: 720, y: 490, z: 1.05, at: 0, dur: 7 },
    source: '≈ 19:40 · « LE REPORT DE L’ALLOCUTION » (L’AVENIR, 15 APR 2019) · ADDRESS ALREADY RECORDED · ILLUSTRATION',
  }),

  // L43 · peak 3: the fall, wide and locked, music out on "falls"
  S('cathedral', L(43), {
    view: 'fold', sky: 'day', fire: 0.85, smoke: 0.8, spire: 'falling', spireAt: 'spire-0.2', spireDur: 2.2, spireClip: true, spireFire: 0.8,
    red: 'tip', clock: null, labels: false, foreground: false, smokeSeed: 71,
    crowdBig: { n: 10, y: 1010, h: 190, cams: [2, 7] },
    tags: [{ at: [985, 230], to: [1250, 100], text: 'The spire falls', sub: '≈ 19:45 (DRAC) · ≈ 19:50 (CULTURE MINISTRY)', inAt: 'falls' }],
    cam: { x: 960, y: 385, z: 0.86 }, zoomTo: { x: 970, y: 380, z: 0.88, at: 0, dur: 6 },
    source: 'ILLUSTRATION · TIMES: ≈ 19:45 (DRAC) · ≈ 19:50 (CULTURE MINISTRY)',
  }, { padOut: 1.5, mood: { mood: 'silence', word: 'falls', offset: 0.9 } }),

  // L44 · the impact on the cut: into the burning roof (no hole at the crossing)
  S('spireFall', L(44), {
    sky: 'day', hole: false, roofGone: 0.3, fire: 1, smoke: 1, at: -1.62, dur: 2.3, spireFire: 0.8, red: 'gap', gapHalo: true, clock: null, smokeSeed: 73, smokeStyle: 'billow',
    labels: false, tags: [{ at: [1012, 548], to: [620, 250], text: 'Where the spire stood', sub: 'it fell into the burning roof', showAt: 'roof' }],
    source: 'ILLUSTRATION · THE SPIRE FELL INTO THE BURNING ROOF',
  }, { mood: M('urgency', 'D', [0.75, 0.85], { hit: true }) }),

  // L45–46 · peak 4: trapped (the nave toy theatre; Gallet, his own later account)
  S('cathedral', L(45, 46), {
    view: 'theatre', theatreLabel: 'THE NAVE · PAPER TOY THEATRE', roofFire: 1, roofFireAt: 0, roofFireDur: 1.2, smokeIn: 0.7, smokeInAt: 0, smokeInDur: 4, trapped: 1, trappedAt: 'between', trappedDur: 1.4, n: 30, boxNotch: false,
    boxLabel: null, red: 'box', clock: null, exit: 1, exitAt: 'Their', exitDur: 0.7, exitFire: 1, exitFireAt: 'way', exitFireDur: 1.2,
    exitLabel: 'their way back out', exitSub: 'full of flames', exitTag: [-420, -250], exitTagOn: 'door', exitOnTop: true,
    chips: [{ text: 'Gen. Jean-Claude Gallet', sub: 'commander, Paris fire brigade', at: 'Gallet-0.6', outAt: 'As-0.2', big: true, left: 620, y: 400 }],
    tags: [{ at: [690, 600], to: [330, 330], text: '20–40 firefighters', sub: 'trapped inside', showAt: 'between' }],
    strip: ['« Entre 20 et 40 pompiers sont pris au piège à l’intérieur de la cathédrale »', 'between 20 and 40 firefighters are trapped inside the cathedral',
      'GEN. JEAN-CLAUDE GALLET · HIS OWN LATER ACCOUNT · FRANCEINFO, 15 APR 2020'], stripAt: 'As',
    cam: { x: 960, y: 490, z: 0.94 }, zoomTo: [{ x: 960, y: 495, z: 0.95, at: 'Gallet', dur: 2.2 }, { x: 945, y: 500, z: 0.96, at: 'between', dur: 2.0 }, { x: 990, y: 500, z: 0.97, at: 'Their', dur: 1.6 }],
    source: 'PAPER MODEL OF THE NAVE · ILLUSTRATION',
  }, { padOut: 1.5, mood: M('tension', 'D', [0.55, 0.7]) }),
]);
export default shots;
