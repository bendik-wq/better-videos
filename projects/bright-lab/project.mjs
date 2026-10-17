// BRIGHT LAB: proof frames for the "bright style" house blend (docs/library/bright-style/STYLE.md §12).
// Four sets, no narration; stills only:
//   node engine/render.mjs projects/bright-lab --stills=0.5
//   node projects/bright-lab/lab.mjs            -> renders/bright-lab/*.jpg (+ contact sheet)
export default {
  title: 'Bright lab: white clay, bright sun, soft shadow, haze',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30, look: 'bright-day' },
  finish: { grain: 3, halation: 6, halationAmount: 0.1, bloom: 0.06, vignette: 0.14 },
  shots: [
    { id: 'clay-city', set: 'clayCity', min: 4.0, params: {} },
    { id: 'clay-city-tilt', set: 'clayCity', min: 4.0, params: { tilt: true, low: true } },
    { id: 'diorama', set: 'diorama', min: 4.0, params: {} },
    { id: 'void-model', set: 'voidModel', min: 4.0, params: {} },
    { id: 'map-slab', set: 'mapSlab', min: 4.0, params: {} },
  ],
};
