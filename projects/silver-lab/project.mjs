// Look-dev for episode 7 (silver). Renders the studio look without narration.
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shots = [
  { id: 'stack', set: 'lab-stack', min: 6, params: { keys: [{ pos: [-12, 4.6, 16], look: [0, 2.0, 0], mm: 70 }, { pos: [-7, 3.4, 13], look: [0.4, 2.4, 0], mm: 85 }] } },
  { id: 'stack-wide', set: 'lab-stack', min: 6, params: { keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }, { pos: [-16, 10, 24], look: [0, 1.8, 0], mm: 42 }] } },
  { id: 'dbg', set: 'lab-stack', min: 2, params: { nopost: true, nocontact: true, studio: { envIntensity: 0.05, keyI: 6, cycEnv: 0, contact: false }, keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
  { id: 'dbg2', set: 'lab-stack', min: 2, params: { nocontact: true,  keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
  { id: 'dbg3', set: 'lab-stack', min: 2, params: { nopost: true, keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
];
export default {
  title: 'silver lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', crf: 18 },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
