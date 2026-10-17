// PANAMA LAB: look-dev stills of every 3D set (no VO). Default times stand in for the cue words.
//   node engine/render.mjs projects/panama/lab --stills=0.5 [--only=id]   then   node projects/panama/lab/stills.mjs
// BV_SHOTS=id,id limits the shot list (handy for a single clip render).
const all = [
  { id: 'cold-open', set: 'cold-open', min: 57, params: {} },
  { id: 'lock-fill', set: 'lock', min: 12, params: { mode: 'fill' } },
  { id: 'lock-drain', set: 'lock', min: 10, params: { mode: 'drain' } },
  { id: 'lock-gates', set: 'lock', min: 10, params: { mode: 'gates' } },
  { id: 'lock-culverts', set: 'lock', min: 10, params: { mode: 'culverts' } },
  { id: 'lock-mules', set: 'lock', min: 10, params: { mode: 'mules' } },
  { id: 'lock-swimmer', set: 'lock', min: 10, params: { mode: 'swimmer' } },
  { id: 'section', set: 'section', min: 10, params: { flowOut: true } },
  { id: 'section-hl', set: 'section', min: 10, params: { highlight: 'miraflores', flowOut: true } },
  { id: 'section-drop', set: 'section', min: 10, params: { highlight: 'lake', levelDrop: true, drop: 6 } },
  { id: 'section-rain', set: 'section', min: 10, params: { rain: true, levelDrop: true, dropAt: 0, dropSpan: 0.01, rainAt: 1, rainSpan: 8 } },
  { id: 'section-madden', set: 'section', min: 10, params: { madden: true, highlight: 'lake' } },
  { id: 'french-cut', set: 'french-cut', min: 12, params: {} },
  { id: 'valley-flood', set: 'valley-flood', min: 12, params: {} },
  { id: 'culebra', set: 'culebra', min: 10, params: {} },
  { id: 'culebra-blast', set: 'culebra', min: 10, params: { mode: 'blast', at: 3 } },
  { id: 'rio-indio', set: 'rio-indio', min: 10, params: {} },
];
const only = process.env.BV_SHOTS?.split(',');
export default {
  title: 'Panama lab', fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30, look: 'bright-model', workers: 3 },
  finish: { grain: 3, halation: 6, halationAmount: 0.1, bloom: 0.06, vignette: 0.14 },
  shots: only ? all.filter(s => only.includes(s.id)) : all,
};
