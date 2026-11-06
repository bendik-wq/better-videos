// EP10 THUMBNAILS (packaging.md A/B/C, YOUTUBE.md). Stills only, no narration:
//   node engine/render.mjs projects/nd-thumbs --stills=0.9   -> out/stills/<id>-90.jpg, then 1280x720 copies in thumbs/
// A keeps the bell on its pin (pinned: true): in the film the bells never slip, and the thumbnail says IF.
export default {
  title: 'Notre-Dame ep10 thumbnails',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  settings: { aa: 'none', fps: 30, browserArgs: ['--disable-gpu-compositing'] },
  finish: { grain: 2, halation: 0, bloom: 0, vignette: 0.06 },
  shots: [
    { id: 'thA', set: 'cathedral', min: 2, params: { view: 'thumb', pinned: true } },
    { id: 'thA-teal', set: 'cathedral', min: 2, params: { view: 'thumb', pinned: true, ground: 'teal' } },
    { id: 'thB', set: 'doc', min: 3, params: { kind: 'ticket', highlight: 'SACRISTY', stamp: { text: 'WRONG ATTIC', at: 0, rot: -8 }, label: null, source: null } },
    { id: 'thC', set: 'clock', min: 3, params: { from: '18:18', to: '18:48', roll: 1, spring: 1, flapL: 'FEU', tagText: '+30 MIN', red: 'tag', cathedral: true, source: null } },
  ],
};
