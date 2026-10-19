// Look-dev for episode 7 (silver). Renders the studio look without narration.
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shots = [
  { id: 'stack', set: 'lab-stack', min: 6, params: { keys: [{ pos: [-12, 4.6, 16], look: [0, 2.0, 0], mm: 70 }, { pos: [-7, 3.4, 13], look: [0.4, 2.4, 0], mm: 85 }] } },
  { id: 'stack-wide', set: 'lab-stack', min: 6, params: { keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }, { pos: [-16, 10, 24], look: [0, 1.8, 0], mm: 42 }] } },
  { id: 'dbg', set: 'lab-stack', min: 2, params: { nopost: true, nocontact: true, studio: { envIntensity: 0.05, keyI: 6, cycEnv: 0, contact: false }, keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
  { id: 'dbg2', set: 'lab-stack', min: 2, params: { nocontact: true,  keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
  { id: 'dbg3', set: 'lab-stack', min: 2, params: { nopost: true, keys: [{ pos: [-20, 12, 28], look: [0, 1.8, 0], mm: 40 }] } },
  { id: 'props', set: 'lab-props', min: 2, params: {} },
  { id: 'props-close', set: 'lab-props', min: 2, params: { keys: [{ pos: [-3, 4, 12], look: [-3, 0.6, 3], mm: 40 }] } },
  { id: 'open', set: 'cold-open', min: 24, params: {} },
  { id: 'tower', set: 'price-tower', min: 8, params: {} },
  { id: 'crash', set: 'price-tower', min: 6, params: { mode: 'crash', points: [{ label: '1 JAN 1980', price: 33 }, { label: '17 JAN', price: 49.45 }, { label: '26 MAR', price: 21.62, red: true }], crashTo: 10.8, crashAt: 2 } },
  { id: 'vault', set: 'vault', min: 6, params: { mode: 'shelves' } },
  { id: 'contract', set: 'vault', min: 6, params: { mode: 'contract' } },
  { id: 'drain', set: 'vault', min: 6, params: { mode: 'drain', share: 0.5 } },
  { id: 'air', set: 'airlift', min: 8, params: {} },
  { id: 'margin', set: 'margin', min: 8, params: {} },
  { id: 'board', set: 'boardroom', min: 6, params: { stampAt: 3 } },
  { id: 'queue', set: 'queue', min: 6, params: {} },
  { id: 'oil', set: 'oilfield', min: 6, params: { mode: 'collateral' } },
  { id: 'hero', set: 'hero-bar', min: 5, params: { date: '17 JAN 1980', red: true } },
  { id: 'bail', set: 'bailout', min: 6, params: {} },
];
export default {
  title: 'silver lab', fps: 60, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', crf: 18 },
  shots: only ? shots.filter(s => only.includes(s.id)) : shots,
};
