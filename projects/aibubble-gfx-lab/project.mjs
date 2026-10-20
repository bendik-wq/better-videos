// AI-BUBBLE GRAPHICS LAB: one shot per set/mode of projects/aibubble/sets/graphics*.js, no narration (word cues fall back
// to their default times). Stills: node engine/render.mjs projects/aibubble-gfx-lab --stills=0.3,0.9   (ONLY=id,id filters)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const S = (id, set, min, params = {}) => ({ id, set, min, params });
const shots = [
  S('title', 'title', 6, { sub: 'A MAINSPRING documentary' }),
  S('chapter-2', 'chapter', 4, { num: 2, title: 'The circle', sub: 'Who pays whom' }),
  S('chapter-4', 'chapter', 4, { num: 4, title: 'The last time' }),
  S('quote-lovelock', 'quote', 7, { text: 'At the moment, we have more compute capacity than we have demand.', by: 'Lovelock, Gartner', role: 'CNBC interview, 19 Oct 2026', highlight: ['compute', 'demand.'], source: 'SOURCE: CNBC INTERVIEW VIA STOCKTWITS/YAHOO (19 OCT 2026)' }),
  S('bignumber-guarantee', 'bignumber', 6, { value: 105, prefix: '$', suffix: 'B', label: 'Nvidia’s guarantee of OpenAI’s Ohio data-centre leases', kicker: 'NVIDIA 8-K · 17 AUG 2026', note: 'UP TO', source: 'SOURCE: NVIDIA FORM 8-K (17 AUG 2026)' }),
  S('counter-oct14', 'counter', 9, { preset: 'oct14' }),
  S('counter-oct15', 'counter', 6, { preset: 'oct15' }),
  S('counter-steps', 'counter', 6, { kicker: 'TEN-YEAR US TREASURY YIELD', title: 'The price of money', steps: [{ text: '5.28%', label: '7 OCT 2026' }, { text: '5.09%', label: '16 OCT 2026', asof: 'AS OF 16 OCT 2026' }], source: 'SOURCE: FRED DGS10' }),
  S('timeline', 'timeline', 11),
  S('timeline-focus', 'timeline', 6, { focus: '17 AUG 2026' }),
  S('chart-capex', 'ai-chart', 9, { mode: 'capex' }),
  S('chart-gap', 'ai-chart', 10, { mode: 'gap' }),
  S('chart-gartner', 'ai-chart', 9, { mode: 'gartner' }),
  S('chart-nasdaq2000', 'ai-chart', 9, { mode: 'nasdaq2000' }),
  S('chart-lucent', 'ai-chart', 9, { mode: 'lucent' }),
  S('chart-october', 'ai-chart', 10, { mode: 'october' }),
  S('chart-oracle', 'ai-chart', 9, { mode: 'oracle' }),
  S('chart-concentration', 'ai-chart', 10, { mode: 'concentration' }),
  S('doc-nvidia8k', 'doc', 9, { doc: 'nvidia8k' }),
  S('doc-nvidia10k', 'doc', 6, { doc: 'nvidia10k' }),
  S('doc-nvidia10q', 'doc', 6, { doc: 'nvidia10q' }),
  S('doc-coreweave8k', 'doc', 6, { doc: 'coreweave8k' }),
  S('doc-oracle10q', 'doc', 9, { doc: 'oracle10q' }),
  S('doc-lucent10k', 'doc', 7, { doc: 'lucent10k' }),
  S('doc-amdwarrant', 'doc', 8, { doc: 'amdwarrant' }),
  S('map-us', 'map', 8, { mode: 'us' }),
  S('map-world', 'map', 8, { mode: 'world' }),
  S('dealmap', 'dealmap', 22),
  S('dealmap-short', 'dealmap', 8, { steps: ['C3', 'C8'], title: 'The supplier as the safety net' }),
];
export default {
  title: 'aibubble graphics lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model' },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
