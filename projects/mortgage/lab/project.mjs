// MORTGAGE LAB: look-dev stills of every 3D clay set (no VO). Default times stand in for the cue words.
//   node engine/render.mjs projects/mortgage/lab --stills=0.2,0.5,0.9 [--only=id,...]   then   node projects/mortgage/lab/stills.mjs 20,50,90
// BV_SHOTS=id,id limits the shot list (handy for a single clip render); BV_MIN=s overrides every shot's length.
const all = [
  { id: 'cold-open', set: 'cold-open', min: 27, params: {} },
  { id: 'house-idle', set: 'house-block', min: 8, params: { mode: 'idle' } },
  { id: 'house-tag', set: 'house-block', min: 8, params: { mode: 'tag', view: 'wide' } },
  { id: 'house-sold', set: 'house-block', min: 8, params: { mode: 'sold', at: 3 } },
  { id: 'house-rate', set: 'house-block', min: 8, params: { mode: 'rate', from: '6.27%', to: '7.40%', view: 'close' } },
  { id: 'bids-arrive', set: 'bid-stack', min: 9, params: { mode: 'arrive' } },
  { id: 'bids-sort', set: 'bid-stack', min: 9, params: { mode: 'sort' } },
  { id: 'bids-fill', set: 'bid-stack', min: 10, params: { mode: 'fill' } },
  { id: 'bids-cutoff', set: 'bid-stack', min: 9, params: { mode: 'cutoff' } },
  { id: 'bids-single', set: 'bid-stack', min: 9, params: { mode: 'single-price' } },
  { id: 'seesaw', set: 'seesaw', min: 9, params: { at: 2.5 } },
  { id: 'pipe-flow', set: 'pipe', min: 10, params: { mode: 'flow' } },
  { id: 'pipe-compare', set: 'pipe', min: 10, params: { mode: 'compare' } },
  { id: 'pipe-spread', set: 'pipe', min: 10, params: { mode: 'spread' } },
  { id: 'pipe-prepay', set: 'pipe', min: 10, params: { mode: 'prepay' } },
  { id: 'suburb-wide', set: 'suburb', min: 8, params: { mode: 'wide' } },
  { id: 'suburb-wide-1', set: 'suburb', min: 8, params: { mode: 'wide', cam: 1 } },
  { id: 'suburb-wide-2', set: 'suburb', min: 8, params: { mode: 'wide', cam: 2, hero: true } },
  { id: 'suburb-forsale', set: 'suburb', min: 8, params: { mode: 'forsale' } },
  { id: 'suburb-locked', set: 'suburb', min: 8, params: { mode: 'locked' } },
  { id: 'suburb-payment', set: 'suburb', min: 8, params: { mode: 'payment' } },
  { id: 'suburb-quiet', set: 'suburb', min: 8, params: { mode: 'quiet' } },
  { id: 'tower-grow', set: 'debt-tower', min: 9, params: { mode: 'grow' } },
  { id: 'tower-rollover', set: 'debt-tower', min: 11, params: { mode: 'rollover' } },
  { id: 'tower-interest', set: 'debt-tower', min: 10, params: { mode: 'interest' } },
  { id: 'vault', set: 'vault', min: 9, params: {} },
];
const only = process.env.BV_SHOTS?.split(',');
export default {
  title: 'Mortgage lab', fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'fxaa', fps: 30, look: 'bright-model', workers: 3 },
  finish: { grain: 3, halation: 6, halationAmount: 0.1, bloom: 0.06, vignette: 0.14 },
  shots: (only ? all.filter(s => only.includes(s.id)) : all).map(s => (process.env.BV_MIN ? { ...s, min: Number(process.env.BV_MIN) } : s)),
};
