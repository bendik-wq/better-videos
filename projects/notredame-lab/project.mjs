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
    // round 2: new firefighter views (hose 'low' is the default above), smoke variants, thumbnail composition
    { id: 'sf-hose-side', set: 'firefighters', min: 2, params: { mode: 'hose', view: 'side', smokeStyle: 'lean' } },
    { id: 'sf-chain-close', set: 'firefighters', min: 2, params: { mode: 'chain', view: 'close', u: 0.5 } },
    { id: 'sf-hose-wide', set: 'firefighters', min: 2, params: { mode: 'hose', view: 'wide', smokeStyle: 'column' } },
    { id: 'sf-thumb', set: 'cathedral', min: 2, params: { view: 'thumb' } },
    // graphics sets (projects/notredame/sets/nd-graphics.js): one shot per set / state
    { id: 'g-title', set: 'title', min: 6, params: {} },
    { id: 'g-end', set: 'title', min: 6, params: { end: true, sub: 'NEXT: THE MACHINE BEHIND THE NEXT STORY' } },
    { id: 'g-chapter1', set: 'chapter', min: 7, params: { num: 1, title: 'Two Attics, One Message', sub: '18:18 · the alarm', lit: 'delay', delay: '+30' } },
    { id: 'g-chapter4', set: 'chapter', min: 7, params: { num: 4, title: 'The Second Clock', sub: 'the tower plan', lit: 'deadline', date: '15 APR 2019 · 21:30', red: 'clock' } },
    { id: 'g-quote', set: 'quote', min: 7, params: {} },
    { id: 'g-quote-nunez', set: 'quote', min: 7, params: { text: 'It was a matter of 15–30 critical minutes', fr: null, by: 'Laurent Nuñez', role: 'deputy interior minister', date: '16 Apr 2019', highlight: ['15–30'],
      strip: 'AP, 17 Apr 2019 (reporter’s summary): It had been within 30 minutes of collapse.', source: 'AS REPORTED BY THE BBC (VIA CTIF), 16 APR 2019' } },
    { id: 'g-doc-ticket', set: 'doc', min: 7, params: {} },
    { id: 'g-doc-post', set: 'doc', min: 7, params: { kind: 'post' } },
    { id: 'g-doc-statement', set: 'doc', min: 7, params: { kind: 'statement' } },
    { id: 'g-doc-report', set: 'doc', min: 7, params: { kind: 'report' } },
    { id: 'g-bignumber', set: 'bignumber', min: 6, params: {} },
    { id: 'g-counter', set: 'counter', min: 8, params: {} },
    { id: 'g-timeline', set: 'timeline', min: 12, params: {} },
    { id: 'g-compare-h', set: 'compare', min: 6, params: { mode: 'height' } },
    { id: 'g-compare-w', set: 'compare', min: 6, params: { mode: 'weight' } },
    { id: 'g-winder', set: 'winder', min: 5, params: { pose: 'point', prop: 'cards', label: 'You', sub: 'the commander’s call' } },
    { id: 'g-winder-panic', set: 'winder', min: 5, params: { pose: 'panic', prop: 'bell', side: 'right', label: 'You', sub: 'the bells are above you' } },
    { id: 'g-winder-rundown', set: 'winder', min: 5, params: { pose: 'rundown', prop: 'tower', red: 'prop', label: 'You', sub: 'and you wait' } },
    { id: 'g-winder-think', set: 'winder', min: 5, params: { pose: 'idle', pose2: 'think', poseAt: 1.0, prop: 'clock', red: 'prop', label: 'You', sub: 'make your call' } },
    // motion tests (render with --only=mt-spire or --only=mt-domino)
    { id: 'mt-audio', set: 'title', min: 3.5, params: { sub: 'AUDIO MIX TEST' } }, // short full render: checks the audio mix stage
    { id: 'mt-spire', set: 'spireFall', min: 7, params: { at: 1.0, dur: 5.0 } },
    { id: 'mt-domino', set: 'bellFrame', min: 7, params: { layout: 'pair', open: 1, openAt: 0, openDur: 1.6, char: 0.8, charAt: 0.5, charDur: 3, domino: 1, dominoAt: 2.6, dominoDur: 4, redBell: 2, slip: 1, slipAt: 1.6, slipDur: 2, weights: false } },
  ],
};
