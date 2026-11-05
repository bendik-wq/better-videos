// PAPER LAB: proof frames for the ep10 "Paper & Spring" look (docs/library/animation-study/STYLE-BIBLE.md §19).
// No narration. Stills, then the compression / moire / feed checks:
//   node engine/render.mjs projects/paper-lab --stills=0.5
//   python3 projects/paper-lab/check.py        -> renders/paper-lab/*.png + report.json
export default {
  title: 'Paper lab: Paper & Spring style frames',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'none', fps: 30 },
  finish: { grain: 2, halation: 0, bloom: 0, vignette: 0.06 },
  shots: [
    { id: 'sf-case', set: 'caseOpen', min: 2.0, params: {} },
    { id: 'sf-acting', set: 'acting', min: 2.0, params: {} },
    { id: 'sf-front', set: 'front', min: 2.0, params: {} },
    { id: 'sf-thumb-paper', set: 'thumb', min: 1.0, params: { ground: 'paper' } },
    { id: 'sf-thumb-teal', set: 'thumb', min: 1.0, params: { ground: 'teal' } },
    { id: 'sf-thumb-night', set: 'thumb', min: 1.0, params: { ground: 'night' } },
    { id: 'sf-stress', set: 'stress', min: 1.0, params: { zoom: 1.0 } },
    { id: 'sf-stress-z13', set: 'stress', min: 1.0, params: { zoom: 1.3 } },
    { id: 'sf-vertical', set: 'vertical', min: 1.0, params: {} },
  ],
};
