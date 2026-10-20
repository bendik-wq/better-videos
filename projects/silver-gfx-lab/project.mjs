// SILVER GRAPHICS LAB: one shot per set/mode of projects/silver/sets/graphics*.js, no narration (word cues fall back to
// their default times). Stills: node engine/render.mjs projects/silver-gfx-lab --stills=0.3,0.9   (ONLY=id,id filters)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const S = (id, set, min, params = {}) => ({ id, set, min, params });
const shots = [
  S('title', 'title', 6, { sub: 'A MAINSPRING documentary' }),
  S('chapter-1', 'chapter', 4, { num: 1, title: 'The man who bought metal', sub: 'Dallas, 1973' }),
  S('chapter-5', 'chapter', 4, { num: 5, title: 'Silver Thursday' }),
  S('quote-tiffany', 'quote', 9, { text: 'We think it is unconscionable for anyone to hoard several billion, yes billion, dollars worth of silver.', by: 'Tiffany & Co.', role: 'Newspaper advertisement · March 1980, as quoted by Time', highlight: ['unconscionable', 'billion,'], source: 'SOURCE: TIME, 7 APR 1980' }),
  S('quote-volcker', 'quote', 5, { text: 'This was gambling.', by: 'Paul Volcker', role: 'Federal Reserve chairman · House hearing, 30 Apr 1980', highlight: ['gambling'], source: 'SOURCE: HOUSE HEARINGS (1980)' }),
  S('bignumber', 'bignumber', 6, { value: 9.8, prefix: '$', suffix: 'B', decimals: 1, label: 'Apparent value of the Hunt position at the January 1980 peak', kicker: 'THE HUNT GROUP · 17 JAN 1980', note: 'MORE THAN', source: 'SOURCE: SEC STAFF REPORT (1982) P. 33' }),
  S('counter-thursday', 'counter', 8, { preset: 'thursday' }),
  S('counter-1215', 'counter', 5, { preset: 'clock1215' }),
  S('counter-213', 'counter', 5, { preset: 'clock213' }),
  S('counter-steps', 'counter', 6, { kicker: 'COMEX ORIGINAL MARGIN PER CONTRACT', title: 'The switch', steps: [{ text: '$2,000', label: 'BEFORE 4 SEP 1979' }, { text: '$60,000', label: '4 FEB 1980 · HUNT-SIZED POSITIONS', red: true }], source: 'SOURCES: HOUSE HEARINGS (1980); SEC STAFF REPORT (1982) P. 35' }),
  S('timeline', 'timeline', 10),
  S('timeline-focus', 'timeline', 6, { focus: '27 MAR 1980' }),
  S('chart-runup', 'silver-chart', 9, { mode: 'runup' }),
  S('chart-crash', 'silver-chart', 11, { mode: 'crash' }),
  S('chart-long', 'silver-chart', 10, { mode: 'long' }),
  S('chart-real', 'silver-chart', 8, { mode: 'real' }),
  S('doc-rule7', 'doc', 7, { doc: 'rule7' }),
  S('doc-liquidation', 'doc', 6, { doc: 'liquidation' }),
  S('doc-tiffany', 'doc', 7, { doc: 'tiffany' }),
  S('doc-cftc', 'doc', 7, { doc: 'cftc' }),
  S('doc-fed', 'doc', 6, { doc: 'fed' }),
  S('doc-verdict', 'doc', 9, { doc: 'verdict' }),
  S('doc-bankruptcy', 'doc', 8, { doc: 'bankruptcy' }),
  S('doc-testimony', 'doc', 6, { doc: 'testimony' }),
  S('photo-comex', 'photo', 7, { file: 'loc_comex_floor_1978_a.jpg', caption: 'A New York commodity exchange floor, c. 1978', credit: 'Photo: Bernard Gotfryd, Library of Congress Prints & Photographs Division, LC-DIG-gtfy-08664', focus: [0.55, 0.4] }),
  S('photo-volcker', 'photo', 7, { file: 'loc_volcker_senate_1983.jpg', caption: 'Paul Volcker, Federal Reserve chairman (Senate testimony, 1983)', credit: 'Photo: Chick Harrity, U.S. News & World Report Magazine Collection, Library of Congress, LC-DIG-ppmsca-87454', focus: [0.5, 0.3] }),
  S('photo-hl', 'photo', 6, { file: 'commons_hl_hunt_1965.jpg', caption: 'H. L. Hunt, 1965', credit: 'H. L. Hunt, 1965. Public domain, via Wikimedia Commons', focus: [0.5, 0.35] }),
  S('photo-bar', 'photo', 6, { file: 'commons_silver_bar_1000oz.png', caption: 'A 1,000-ounce silver bar', credit: '“1000oz silver bullion bar” by Unit 5, CC BY-SA 3.0, via Wikimedia Commons' }),
  S('map-world', 'map', 8, { mode: 'world' }),
  S('map-world-lby', 'map', 7, { mode: 'world', hl: ['LBY'], pins: [{ name: 'Dallas' }, { name: 'Libya' }], routes: [['Dallas', 'Libya']], title: 'Oil in the desert' }),
  S('map-us', 'map', 8, { mode: 'us' }),
];
export default {
  title: 'silver graphics lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model' },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
