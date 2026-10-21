// Look-dev for episode 8 (AI bubble).
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shots = [
  { id: 'b-float', set: 'bubble', min: 6, params: { mode: 'float' } },
  { id: 'b-reveal', set: 'bubble', min: 6, params: { mode: 'reveal' } },
  { id: 'b-needle', set: 'bubble', min: 6, params: { mode: 'needle' } },
  { id: 'b-pop', set: 'bubble', min: 6, params: { mode: 'pop', popAt: 2 } },
  { id: 'circle', set: 'circle', min: 8, params: { flows: [{ from: 'NVIDIA', to: 'OPENAI', label: 'INVESTS $30B', kind: 'invest', at: 0.5 }, { from: 'OPENAI', to: 'ORACLE', label: '>$300B CLOUD', kind: 'buy', at: 1.5 }, { from: 'ORACLE', to: 'NVIDIA', label: 'SERVERS & CHIPS', kind: 'buy', at: 2.5 }, { from: 'NVIDIA', to: 'OPENAI', label: 'GUARANTEES $105B', kind: 'guarantee', at: 3.5 }] } },
  { id: 'campus', set: 'campus', min: 6, params: { pills: [{ text: 'TENANT: OPENAI', target: 'tenant', at: 0.5 }, { text: 'INSIDE: NVIDIA CHIPS', target: 'chips', at: 1.5 }, { text: 'GUARANTOR: NVIDIA · UP TO $105B', target: 'guarantor', at: 2.5, red: true }] } },
  { id: 'gpu', set: 'gpu', min: 5, params: {} },
  { id: 'dom', set: 'dominoes', min: 10, params: {} },
  { id: 'fund', set: 'fund', min: 6, params: {} },
  // thumbnails (rendered at --stills=0.95; composited by projects/aibubble/thumbs/make.mjs)
  { id: 'thA', set: 'bubble', min: 3, params: { mode: 'needle', needleAt: 0, seed: 7, needleEnd: 13.25, needleScale: 2.6, speed: 0, camera: [{ pos: [8, 10.5, 47], look: [8, 8.2, 0], mm: 30 }] } },
  { id: 'thB', set: 'gpu', min: 3, params: { sky: true, seed: 4, label: 'NVIDIA', spinY: -0.35, tiltX: 0.12, camera: [{ pos: [3.6, 4.6, 7.2], look: [0.6, -0.1, 0], mm: 38 }] } },
  { id: 'thC', set: 'circle', min: 3, params: { towers: ['LUCENT', 'NVIDIA'], radius: 5, seed: 9, caption: null, tilt: { LUCENT: -0.62, NVIDIA: 0.1 }, heights: { LUCENT: 12, NVIDIA: 14 },
    camera: [{ pos: [-19, 3, 0.8], look: [0, 7.5, 0], mm: 24 }] } },
];
export default {
  title: 'aibubble lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', crf: 18 },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
