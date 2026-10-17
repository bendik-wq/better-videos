// PANAMA LAB: look-dev stills of every 3D set (no VO). Default times stand in for the cue words.
//   node engine/render.mjs projects/panama/lab --stills=0.5 [--only=id]   then   node projects/panama/lab/stills.mjs
// BV_SHOTS=id,id limits the shot list (handy for a single clip render).
const all = [
  { id: 'lock-fill', set: 'lock', min: 12, params: { mode: 'fill' } },
];
const only = process.env.BV_SHOTS?.split(',');
export default {
  title: 'Panama lab', fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30, look: 'bright-model', workers: 3 },
  finish: { grain: 3, halation: 6, halationAmount: 0.1, bloom: 0.06, vignette: 0.14 },
  shots: only ? all.filter(s => only.includes(s.id)) : all,
};
