// Look-dev for episode 8 (AI bubble).
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shots = [
  { id: 'b-float', set: 'bubble', min: 6, params: { mode: 'float' } },
  { id: 'b-reveal', set: 'bubble', min: 6, params: { mode: 'reveal' } },
  { id: 'b-needle', set: 'bubble', min: 6, params: { mode: 'needle' } },
  { id: 'b-pop', set: 'bubble', min: 6, params: { mode: 'pop', popAt: 2 } },
];
export default {
  title: 'aibubble lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', crf: 18 },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
