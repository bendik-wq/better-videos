// Transition lab for episode 10 (projects/notredame/cuts.mjs + scene.js): one shot per Paper & Spring move.
//   node engine/render.mjs projects/nd-trlab --stills=0.12,0.25   (moves sit in each shot's first second)
const T = ['case-open', 'loupe', 'gear-mesh', 'tape-feed', 'card-flip', 'fold-away', 'dip-ink'];
const looks = [['cathedral', { view: 'facade', sky: 'day' }], ['forest', { fire: 0.6 }], ['clock', { from: '18:18', to: '18:48', roll: 1 }], ['bellFrame', { open: 1 }], ['paris', { route: 1 }], ['cathedral', { view: 'side', sky: 'dusk', fire: 0.5 }], ['firefighters', { mode: 'hose' }], ['forest', { fire: 0.2 }]];
export default {
  title: 'nd transition lab', fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' }, settings: { aa: 'none', fps: 30 }, finish: { grain: 2, halation: 0, bloom: 0, vignette: 0.06 },
  shots: looks.map(([set, p], i) => ({ id: `t${i}`, set, min: 2, params: { ...p, ...(i ? { trans: T[i - 1], transOpts: T[i - 1] === 'loupe' ? { at: [0.3, 0.4] } : {} } : {}) } })),
};
