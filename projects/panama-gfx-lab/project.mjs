// PANAMA GRAPHICS LAB: one shot per set/mode of projects/panama/sets/graphics*.js, no narration (word cues fall
// back to their default times). Stills: node engine/render.mjs projects/panama-gfx-lab --stills=0.25,0.6,0.95
const S = (id, set, min, params = {}) => ({ id, set, min, params });
export default {
  title: 'Panama graphics lab', fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30, look: 'bright-day' },
  shots: [
    S('title', 'title', 6),
    S('chapter', 'chapter', 4, { num: 2, title: 'Why a lake?', sub: '1881 – 1914' }),
    S('counter', 'counter', 11),
    S('bignumber', 'bignumber', 5, { value: 50000000, label: 'gallons of fresh water poured into the sea, per crossing', kicker: 'ORIGINAL LOCKS · ONE TRANSIT', source: 'SOURCES: LINDA HALL LIBRARY; UNIV. OF FLORIDA; NPR' }),
    S('slots-2023', 'slots', 10, { year: 2023 }),
    S('slots-2026', 'slots', 10, { year: 2026 }),
    S('timeline', 'timeline', 9),
    S('timeline-focus', 'timeline', 6, { focus: 1913 }),
    S('budget', 'budget', 8),
    S('budget-foot', 'budget', 8, { mode: 'foot' }),
    S('countdown', 'countdown', 9),
    S('quote-rain', 'quote', 5, { text: 'We are rain takers.', by: 'Ricaurte Vásquez Morales', role: 'Then ACP Administrator', source: 'ACP, 2023' }),
    S('quote-forecast', 'quote', 7, { text: 'Current data does not forecast the need for transit restrictions through December 31, 2026.', by: 'Panama Canal Authority', role: 'Advisory to shipping A-19-2026 · 9 Jun 2026', highlight: ['restrictions'], source: 'SOURCE: ACP, 9 JUN 2026' }),
    S('money-revenue', 'money', 7, { mode: 'revenue' }),
    S('money-share', 'money', 6, { mode: 'share' }),
    S('money-transits', 'money', 6, { mode: 'transits' }),
  ],
};
