// NOTREDAME LAB: style frames + motion tests for the ep10 hero sets (projects/notredame/sets/nd-sets.js).
// No narration. Stills:   node engine/render.mjs projects/notredame-lab --stills=0.5 [--only=id,id]
// Motion test:            node engine/render.mjs projects/notredame-lab --only=mt-spire     (or mt-domino)
// Density check:          python3 -I projects/notredame-lab/density.py   -> renders/notredame-lab/density.json
export default {
  title: 'Notre-Dame lab: Paper & Spring hero sets',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'none', fps: 30, browserArgs: ['--disable-gpu-compositing'] },
  finish: { grain: 2, halation: 0, bloom: 0, vignette: 0.06 },
  shots: [
    // hero style frames (render at --stills=0.5)
    { id: 'sf-fold-dusk', set: 'cathedral', min: 2, params: { view: 'fold', sky: 'dusk', fire: 0.55, clock: '19:20' } },
    { id: 'sf-side-night', set: 'cathedral', min: 2, params: { view: 'side', sky: 'night', fire: 0.9, roofGone: 0.6, spire: 'leaning', clock: '19:45', tagDx: -420, tagDy: -330 } },
    { id: 'sf-facade-day', set: 'cathedral', min: 2, params: { view: 'facade', sky: 'day', fire: 0, clock: '18:18', red: 'clock' } },
    { id: 'sf-forest', set: 'forest', min: 2, params: { fire: 0.75, collapse: 0.2 } },
    { id: 'sf-forest-late', set: 'forest', min: 2, params: { fire: 0.9, collapse: 0.5, clock: '19:10' } },
    { id: 'sf-spire', set: 'spireFall', min: 2, params: { u: 0.6 } },
    { id: 'sf-spire-hit', set: 'spireFall', min: 2, params: { u: 0.8 } },
    { id: 'sf-bells', set: 'bellFrame', min: 2, params: { open: 1, char: 0.7, flame: 0.7, redBell: 2, slip: 0.35 } },
    { id: 'sf-domino', set: 'bellFrame', min: 2, params: { layout: 'pair', open: 1, domino: 0.75, redBell: 2, slip: 0.6, weights: false } },
    { id: 'sf-clock', set: 'clock', min: 2, params: { from: '18:18', to: '18:48', roll: 1 } },
    { id: 'sf-paris', set: 'paris', min: 2, params: { route: 1, engines: 0.95, boat: 1, pump: 1 } },
    { id: 'sf-hose', set: 'firefighters', min: 2, params: { mode: 'hose' } },
    { id: 'sf-chain', set: 'firefighters', min: 2, params: { mode: 'chain', u: 0.55 } },
    { id: 'sf-stair', set: 'firefighters', min: 2, params: { mode: 'stair', u: 0.55 } },
    // motion tests (render with --only=mt-spire or --only=mt-domino)
    { id: 'mt-spire', set: 'spireFall', min: 7, params: { at: 1.0, dur: 5.0 } },
    { id: 'mt-domino', set: 'bellFrame', min: 7, params: { layout: 'pair', open: 1, openAt: 0, openDur: 1.6, char: 0.8, charAt: 0.5, charDur: 3, domino: 1, dominoAt: 2.6, dominoDur: 4, redBell: 2, slip: 1, slipAt: 1.6, slipDur: 2, weights: false } },
  ],
};
