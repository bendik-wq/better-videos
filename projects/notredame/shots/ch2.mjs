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
export const shots = check([
  CH('A Wall of Flame', 'the first crews · just before 19:00', { lit: 'delay', delay: '≈+30' }, M('urgency', 'D', [0.4, 0.55])),

  // L33 · the engines arrive (map) → the hoses go in (façade)
  S('paris', L(33), {
    route: 1, routeAt: 0.2, routeDur: 2.8, boat: 0, pump: 0, clock: null, red: 'route', labelSub: 'first crews · just before 19:00',
    zoomTo: { x: 1010, y: 560, z: 1.85, at: 'pull', dur: 1.4 },
    source: `SCHEMATIC MAP · ROUTE ILLUSTRATIVE · FIRST CREWS "JUST BEFORE 19:00" (${NYT})`,
  }, {
    beats: [['crews', 'firefighters', {
      mode: 'hose', view: 'low', sky: 'day', red: 'lead', clock: null, smokeSeed: 31, label: 'Hose lines', sub: 'into the burning roof',
      cam: { x: 960, y: 560, z: 1.0 }, zoomTo: { x: 980, y: 520, z: 1.06, at: 0, dur: 4 },
      chips: [{ text: '≈ 500 firefighters', sub: '70+ vehicles · 2 fireboats · for 7 hours', at: 'into' }],
      source: 'ILLUSTRATION · « PRÈS DE 500 SAPEURS-POMPIERS… 7 HEURES DURANT » (FRENCH GOVERNMENT RECORD)',
    }]],
  }),

  // L34 · peak 2: the attic door
  S('forest', L(34), {
    door: true, fire: 0.9, labels: false, red: 'flame', clock: null, smokeSeed: 41, doorPush: 0.35, doorPushAt: 0, doorPushDur: 4,
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: { x: 960, y: 500, z: 1.1, at: 0, dur: 4 },
    chips: [{ text: '« an unstoppable wall »', sub: NYT, at: 'unstoppable' }],
    source: `ILLUSTRATION · THE VIEW FROM AN ATTIC DOOR · ${NYT}`,
  }, { mood: M('urgency', 'D', [0.6, 0.75], { hit: true }) }),

  // L35 · 2 s held door, then the retreat
  S('forest', L(35), {
    door: true, fire: 1, labels: false, clock: null, smokeSeed: 43, doorPush: 1, doorPushAt: 0, doorPushDur: 2.2,
    retreat: 1, retreatAt: 'forced-0.4', retreatDur: 1.8, red: 'flame', redSeq: [{ red: 'flame', at: 0 }, { red: 'arrow', at: 'forced-0.4' }],
    cam: { x: 960, y: 500, z: 1.1 }, zoomTo: { x: 960, y: 470, z: 1.3, at: 0, dur: 2.2 },
    source: `ILLUSTRATION · THE FIRST CREWS ARE DRIVEN BACK · ${NYT}`,
  }, { ...HOLDS['35'] }),

  // L37 · how much lead
  S('bignumber', L(37), {
    value: 460, prefix: '≈', suffix: 'T', icon: 'lead', at: 'four', kicker: 'LEAD ON THE ROOF AND THE SPIRE',
    label: 'tonnes of lead, roof and spire together', note: '210 T ROOF + 250 T SPIRE',
    source: 'SOURCE: CULTURE MINISTRY, JO 15 DEC 2020 (210 T ROOF + 250 T SPIRE)',
  }, { mood: M('tension', 'D', [0.35, 0.45]) }),

  // L38 · the lead runs over the vaults
  S('forest', L(38), {
    fire: 0.75, collapse: 0.08, lead: 1, leadAt: 'lead-0.6', leadDur: 3.2, labels: false, red: 'drip', clock: null, smokeSeed: 47, vpy: 430,
    cam: { x: 960, y: 600, z: 1.05 }, zoomTo: { x: 960, y: 690, z: 1.2, at: 'runs', dur: 2.6 },
    tags: [{ at: [1180, 860], to: [1330, 680], text: 'Molten lead', sub: 'over the stone vaults' }],
    source: 'ILLUSTRATION · LEAD « EN PARTIE FONDU SUR L’EXTRADOS DES VOÛTES » (CULTURE MINISTRY)',
  }),

  // L40 · the one levity beat: four days earlier
  S('cathedral', L(40), {
    view: 'side', sky: 'day', fire: 0, smoke: 0, k: 7, ox: 400, labels: false, clock: null, trans: 'tape-feed',
    flap: '11 APR 2019', flapFrom: '15 APR 2019', flapAt: 0.25, flapSub: 'four days earlier',
    crane: 1, craneAt: 'lifted', craneDur: 5.0, red: 'flap', redSeq: [{ red: 'flap', at: 0 }, { red: 'statues', at: 'crane' }],
    tags: [{ at: [880, 560], to: [440, 300], text: '16 copper statues', sub: 'off for scheduled restoration' }],
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: { x: 1000, y: 520, z: 1.06, at: 'Saved', dur: 2 },
    source: 'ILLUSTRATION · 16 STATUES LIFTED OFF THU 11 APR 2019 FOR RESTORATION (DRAC; CULTURE MINISTRY)',
  }, { mood: M('wonder', 'D', 0.35) }),

  // L41 · saved by hand
  S('firefighters', L(41), {
    mode: 'chain', view: 'close', sky: 'day', u: 1, uAt: 0.3, uDur: 8, red: 'relic', clock: null, smokeSeed: 53,
    label: 'The Crown of Thorns', sub: 'carried out that night',
    zoomTo: [{ x: 960, y: 560, z: 1.06, at: 0, dur: 5 }, { x: 960, y: 580, z: 1.3, at: 'Crown', dur: 1.8 }],
    source: 'CROWN OF THORNS: CARRIED OUT THAT NIGHT (CULTURE MINISTRY) · HÔTEL DE VILLE OVERNIGHT, THEN THE LOUVRE',
  }, {
    beats: [['chaplain', 'firefighters', {
      mode: 'chain', view: 'side', sky: 'day', u: 1, uAt: -6, uDur: 12, red: 'chalice', labelOn: 'chalice', only: ['chalice'], chaliceLag: 0, chaliceScale: 1.5, clock: null, smokeSeed: 57,
      label: 'The brigade’s chaplain', sub: 'the Blessed Sacrament · by his own account', labelAt: [1180, 230],
      source: 'ILLUSTRATION · THE CHAPLAIN’S OWN ACCOUNT · A HUMAN CHAIN OF FIREFIGHTERS, POLICE AND OFFICIALS',
    }]],
  }),

  // L39 · the spire on its ruler, then it catches
  S('spireFall', L(39), {
    sky: 'day', u: 0, hole: false, roofGone: 0, fire: 0.45, smoke: 0.35, ruler: true, rulerX: 78, red: 'rooster', clock: null, shake: false,
    spireFire: 0.4, spireFireAt: 'fire-0.2', spireFireDur: 1.8, smokeSeed: 61,
    tagText: 'The spire · 1859', tagSub: 'Viollet-le-Duc · oak sheathed in lead', tagX: 92, tagY: 62,
    cam: { x: 960, y: 540, z: 1.0 }, zoomTo: [{ x: 960, y: 220, z: 1.7, at: 'ninety', dur: 2.0 }, { x: 960, y: 560, z: 1.08, at: 'now', dur: 1.2 }],
    source: 'ILLUSTRATION · SPIRE 1859, 93 M; 96 M TO THE ROOSTER (VILLE DE PARIS)',
  }, { mood: M('tension', 'D', [0.4, 0.7], { riser: true }) }),

  // L42 · the address is postponed; the spire keeps burning
  S('cathedral', L(42), {
    view: 'facade', sky: 'day', fire: 0.6, smoke: 0.8, spire: 'standing', spireFire: 0.7, spireFireAt: -4, spireFireDur: 11, labels: false, rule: false,
    crowd: true, clock: null, red: 'tv', smokeSeed: 67,
    tv: { head: 'Allocution présidentielle', sub: 'the president’s televised address', stamp: 'REPORTÉE', time: '≈ 19:40', timeSub: 'L’AVENIR, 15 APR 2019' },
    tvAt: 0.1, stampAt: 'postpones',
    cam: { x: 700, y: 500, z: 1.0 }, zoomTo: { x: 720, y: 490, z: 1.05, at: 0, dur: 7 },
    source: '≈ 19:40 · « LE REPORT DE L’ALLOCUTION » (L’AVENIR, 15 APR 2019) · ADDRESS ALREADY RECORDED · ILLUSTRATION',
  }),

  // L43 · peak 3: the fall, wide and locked, music out on "falls"
  S('spireFall', L(43), {
    sky: 'day', k: 7.0, ox: 498, oy: 900, horizon: 0, roofs: true, ground: true, crowdScale: 1.0, crowdY: 50, crowdDens: 0.55, cameras: [[-12, 1], [18, 1], [146, -1]], hole: false, roofGone: 0.15, fire: 0.85, smoke: 0.7, crowd: true,
    at: 'falls', dur: 2.7, spireFire: 0.8, red: 'tip', shake: false, clock: null, smokeSeed: 71,
    tagText: 'The spire falls', tagSub: '≈ 19:45 (DRAC) · ≈ 19:50 (CULTURE MINISTRY)', tagAfter: 'The spire falls', tagSubAfter: '≈ 19:45 (DRAC) · ≈ 19:50 (CULTURE MINISTRY)', tagX: 96, tagY: 92,
    source: 'ILLUSTRATION · TIMES: ≈ 19:45 (DRAC) · ≈ 19:50 (CULTURE MINISTRY)',
  }, { padOut: 1.2, mood: { mood: 'silence', word: 'falls', offset: 0.9 } }),

  // L44 · the impact on the cut: into the burning roof (no hole at the crossing)
  S('spireFall', L(44), {
    sky: 'day', hole: false, roofGone: 0.3, fire: 1, smoke: 1, at: -1.62, dur: 2.3, spireFire: 0.8, red: 'gap', clock: null, smokeSeed: 73, smokeStyle: 'billow',
    tagText: null, tagAfter: 'Where the spire stood', tagSubAfter: 'it fell into the burning roof', tagX: 84, tagY: 84,
    source: 'ILLUSTRATION · THE SPIRE FELL INTO THE BURNING ROOF',
  }, { mood: M('urgency', 'D', [0.75, 0.85], { hit: true }) }),

  // L45–46 · peak 4: trapped (the nave toy theatre; Gallet, his own later account)
  S('cathedral', L(45, 46), {
    view: 'theatre', theatreLabel: 'THE NAVE · PAPER TOY THEATRE', roofFire: 1, roofFireAt: 0, roofFireDur: 1.2, smokeIn: 0.7, smokeInAt: 0, smokeInDur: 4, trapped: 1, trappedAt: 0.5, trappedDur: 1.4, n: 30,
    boxLabel: null, red: 'box', clock: null, exit: 1, exitAt: 'Their', exitDur: 0.9, exitFire: 1, exitFireAt: 'full', exitFireDur: 1.4,
    exitLabel: 'their way back out', exitSub: 'full of flames', exitTag: [-430, -330],
    tags: [{ at: [690, 600], to: [330, 330], text: '20–40 firefighters', sub: 'trapped inside', showAt: 'between' }],
    strip: ['« Entre 20 et 40 pompiers sont pris au piège à l’intérieur de la cathédrale »', 'between 20 and 40 firefighters are trapped inside the cathedral',
      'GEN. JEAN-CLAUDE GALLET · HIS OWN LATER ACCOUNT · FRANCEINFO, 15 APR 2020'], stripAt: 'As',
    cam: { x: 960, y: 520, z: 1.0 }, zoomTo: [{ x: 960, y: 420, z: 1.12, at: 'Gallet', dur: 2.2 }, { x: 930, y: 600, z: 1.18, at: 'between', dur: 2.0 }, { x: 1040, y: 600, z: 1.24, at: 'Their', dur: 1.6 }],
    source: 'PAPER MODEL OF THE NAVE · GALLET’S OWN LATER ACCOUNT: FRANCEINFO, 15 APR 2020',
  }, { mood: M('tension', 'D', [0.55, 0.7]) }),
]);
export default shots;
