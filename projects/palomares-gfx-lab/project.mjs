// PALOMARES GRAPHICS LAB: one shot per set/mode of projects/palomares/sets/graphics*.js, no narration (word cues fall back
// to their default times). Stills: node engine/render.mjs projects/palomares-gfx-lab --stills=0.3,0.9   (ONLY=id,id filters)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const S = (id, set, min, params = {}) => ({ id, set, min, params });
const shots = [
  S('title', 'title', 7, { sub: 'A MAINSPRING documentary' }),
  S('chapter-lost', 'chapter', 4, { num: 1, title: 'Four bombs fall', state: 'lost' }),
  S('chapter-found', 'chapter', 4, { num: 4, title: 'The fisherman was right', state: 'found' }),
  S('chapter-lost-again', 'chapter', 4.5, { num: 5, title: 'Lost again', sub: 'Nine days in the dark', state: 'lost-again' }),
  S('chapter-lifted', 'chapter', 4, { num: 6, title: 'Robert comes up', state: 'lifted' }),
  S('chapter-today', 'chapter', 4, { num: 8, title: 'The rest of it never left', state: 'today' }),
  S('quote-kuralt', 'quote', 7, { text: 'We live in a world in which it is possible to mislay a hydrogen bomb.', by: 'Charles Kuralt, CBS', role: '“Lost and Found, One H-Bomb”, 22 Mar 1966 · as quoted by Barbara Moran', highlight: ['mislay', 'hydrogen'], source: 'SOURCE: CBS (22 MAR 1966) VIA B. MORAN, THE DAY WE LOST THE H-BOMB (2009)' }),
  S('bignumber-days', 'bignumber', 6, { value: 80, label: 'days from the crash to the bomb on deck', kicker: '17 JAN → 7 APR 1966', note: 'DAYS', source: 'SOURCE: CSN (“80 DÍAS DESPUÉS DE LA COLISIÓN”); DNA REPORT (1975)' }),
  S('counter-day', 'counter', 12, { preset: 'day' }),
  S('counter-alt', 'counter', 6, { preset: 'alt' }),
  S('counter-clock', 'counter', 9, { preset: 'clock' }),
  S('timeline', 'timeline', 16),
  S('timeline-focus', 'timeline', 6, { focus: '24 MAR 1966' }),
  S('depth', 'depth', 13),
  S('map-spain', 'map', 8, { mode: 'spain' }),
  S('map-coast', 'map', 9, { mode: 'coast' }),
  S('map-world', 'map', 8, { mode: 'world' }),
  S('doc-dna1975', 'doc', 9, { doc: 'dna1975' }),
  S('doc-navyreport', 'doc', 7, { doc: 'navyreport' }),
  S('doc-alvinlog', 'doc', 8, { doc: 'alvinlog' }),
  S('doc-telegram', 'doc', 7, { doc: 'telegram' }),
  S('doc-cable2009', 'doc', 6, { doc: 'cable2009' }),
  S('doc-nyt2016', 'doc', 8, { doc: 'nyt2016' }),
  S('doc-statement2015', 'doc', 8, { doc: 'statement2015' }),
  S('doc-court2026', 'doc', 8, { doc: 'court2026' }),
  S('photo-petrel', 'photo', 6, { file: 'petrel-bomb-curv-1966.jpg', caption: 'Bomb 4 on the deck of USS Petrel, April 1966', credit: 'US Navy photo · public domain · Wikimedia Commons', focus: [0.45, 0.5] }),
  S('photo-alvin', 'photo', 6, { file: 'alvin-1964.jpg', caption: 'Alvin in 1964, two years before Palomares', credit: 'Office of Naval Research · public domain · Wikimedia Commons', focus: [0.5, 0.5] }),
  S('photo-b52', 'photo', 6, { file: 'b52g-kc135a-refuel-1992.jpg', caption: 'A B-52G refuelling from a KC-135A (1992)', credit: 'USAF photo, TSgt Scott Stewart · public domain · Wikimedia Commons', focus: [0.5, 0.4] }),
  S('photo-barrels', 'photo', 6, { file: 'palomares-barrels-1966.jpg', caption: 'Contaminated soil in barrels, Palomares, 1966', credit: 'US Air Force photo · public domain · Wikimedia Commons' }),
];
export default {
  title: 'palomares graphics lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model' },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
