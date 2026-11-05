// HF-PORT: head-to-head test. The counter-drum beat of projects/hf-test/compositions/count.html (0-2.5 s),
// ported to our own engine's 2D canvas (no narration). docs/library/hyperframes-engine-test.md §8.
//   node engine/render.mjs projects/hf-port --workers=4
export default {
  title: 'HF port: counter drums on our canvas',
  fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'none', fps: 60 },
  finish: { grain: 0, halation: 0, bloom: 0, vignette: 0 },
  shots: [{ id: 'count', set: 'count', min: 2.5, params: {} }],
};
