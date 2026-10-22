// Look-dev for episode 9 (Palomares): one shot per set and mode. ONLY=id,id filters; W=1280 renders smaller stills.
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shots = [
  // sky: refuelling, collision, the four bombs fall
  { id: 'sky-approach', set: 'sky', min: 8, params: { mode: 'approach' } },
  { id: 'sky-collision', set: 'sky', min: 8, params: { mode: 'collision' } },
  { id: 'sky-fall', set: 'sky', min: 8, params: { mode: 'fall' } },
  // bomb: hero B28
  { id: 'bomb-hero', set: 'bomb', min: 6, params: { mode: 'hero', caption: 'MARK 28 · 12 FT · MORE THAN A TON' } },
  { id: 'bomb-four', set: 'bomb', min: 5, params: { mode: 'four', title: "WHERE'S #4?" } },
  // thumbnails (render at --stills=0.95; composited by projects/palomares/thumbs/make.mjs)
  { id: 'thA', set: 'bomb', min: 4, params: { mode: 'four', title: null, caption: null, source: null, drawAt: 0.2 } },
  { id: 'thB', set: 'sea', min: 10, params: { mode: 'snap', night: false, loop: true, caption: null, source: null, pills: [] } },
  { id: 'thC', set: 'village', min: 6, params: { mode: 'fence', caption: null, source: null, pills: [], camera: [{ pos: [9.4, 0.42, 1], look: [8.17, 0.24, -0.35], mm: 34 }] } },
  { id: 'bomb-chute', set: 'bomb', min: 6, params: { mode: 'chute' } },
  { id: 'bomb-numbers', set: 'bomb', min: 6, params: { mode: 'numbers', status: ['RIVERBED · INTACT', 'CEMETERY · CRACKED OPEN', 'VILLAGE EDGE · CRACKED OPEN', 'THE SEA · MISSING'] } },
  // village: Palomares diorama
  { id: 'v-day', set: 'village', min: 7, params: { mode: 'day' } },
  { id: 'v-impacts', set: 'village', min: 8, params: { mode: 'impacts' } },
  { id: 'v-dust', set: 'village', min: 9, params: { mode: 'dust' } },
  { id: 'v-cleanup', set: 'village', min: 7, params: { mode: 'cleanup' } },
  { id: 'v-fence', set: 'village', min: 7, params: { mode: 'fence' } },
  // sea cutaway
  { id: 'sea-search', set: 'sea', min: 8, params: { mode: 'search' } },
  { id: 'sea-found', set: 'sea', min: 8, params: { mode: 'found' } },
  { id: 'sea-lift', set: 'sea', min: 8, params: { mode: 'lift' } },
  { id: 'sea-snap', set: 'sea', min: 10, params: { mode: 'snap' } },
  { id: 'sea-refind', set: 'sea', min: 8, params: { mode: 'refind' } },
  { id: 'sea-curv', set: 'sea', min: 8, params: { mode: 'curv' } },
  { id: 'sea-raise', set: 'sea', min: 9, params: { mode: 'raise' } },
  // probability grid, Alvin, the trawler
  { id: 'grid', set: 'grid', min: 9, params: {} },
  { id: 'alvin', set: 'alvin', min: 6, params: { pilots: true } },
  { id: 'trawler-sighting', set: 'trawler', min: 8, params: { mode: 'sighting' } },
  { id: 'trawler-pointing', set: 'trawler', min: 7, params: { mode: 'pointing' } },
];
const W = Number(process.env.W ?? 1920);
export default {
  title: 'palomares lab', fps: 60, width: W, height: Math.round(W * 9 / 16),
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', crf: 18 },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
