// LEDGER episode builder: one call turns a shot list into a complete vertical project for engine/render.mjs.
//
//   // projects/<ep>/project.mjs
//   import { episode, shot } from '../micro1-kit/episode.mjs';
//   export default episode({ title: '...', shots: [ shot('hook', 'VO line', { lines: [...] }), ... ] });
//   // projects/<ep>/scene.js
//   export { default } from '/projects/micro1-kit/scene.js';
//
// Defaults: 1080x1920 (or aspect: '16:9' -> 1920x1080) @ 30 fps, Kokoro af_heart at 1.04, light paper finish (no halation/bloom, faint grain),
// an upbeat 'wonder' score (override with `music`), every transition and every set event with its sound.
import { scoreTransitions, transitionCues, setCues } from './cuts.mjs';

let n = 0;
// shot(set, vo, params, extra): ids s001, s002, ... (pass extra.id to name one)
export const shot = (set, vo, params = {}, extra = {}) => ({ id: extra.id ?? `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });

export function defaultMusic(shots, key = 'G') {
  const first = shots[0].id, last = shots.at(-1).id;
  const m = [{ shot: first, mood: 'wonder', key, intensity: [0.4, 0.6], bpm: 112 }];
  if (shots.length > 3) m.push({ shot: shots[Math.floor(shots.length * 0.55)].id, mood: 'triumph', key, intensity: [0.45, 0.6], bpm: 112 });
  if (shots.at(-1).set === 'cta' && shots.length > 1) m.push({ shot: last, mood: 'triumph', key, intensity: [0.5, 0.35], ending: true });
  return m;
}

export function episode({ title, shots, music, aspect = '9:16', key = 'G', voice = {}, say = {}, settings = {}, timing = {}, finish = {}, score = {} }) {
  if (!['9:16', '16:9'].includes(aspect)) throw new Error(`episode(): aspect must be '9:16' or '16:9', got ${aspect}`);
  for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;
  return {
    title,
    // '9:16' (default, 1080x1920) or '16:9' (1920x1080): the kit lays every set out for the frame it gets
    ...(aspect === '16:9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 }),
    fps: 30,
    // hashDirs: the kit lives outside the episode dir; its code must invalidate cached chunks too
    settings: { fps: 30, aa: 'none', workers: 3, chunkSeconds: 6, cutGuard: 0.8, crf: 20, hashDirs: ['projects/micro1-kit'],
      // every frame is 2D canvas: software compositing makes the per-frame page capture ~4x faster on llvmpipe
      browserArgs: ['--disable-accelerated-2d-canvas', '--disable-gpu-compositing'], ...settings },
    voice: { engine: 'kokoro', name: 'af_heart', speed: 1.04, revealSlow: 0.96,
      // short-form pacing: about half the documentary pauses
      pauses: { '.': 0.2, '?': 0.24, '!': 0.2, '…': 0.35, ':': 0.18, '—': 0.14, '|': 0.2, '\n': 0.3, '\n\n': 0.5 }, ...voice, say: { micro1: 'micro one', SOPs: 'ess oh pees', SOP: 'ess oh pee', BPO: 'B P O', CRM: 'C R M', QA: 'Q A', ...say } },
    timing: { padIn: 0.12, padOut: 0.22, ...timing },
    // paper look: no film glow, a whisper of vignette and grain on top of the paper texture
    finish: { halation: 0, halationAmount: 0, bloom: 0, vignette: 0.2, grain: 3, ...finish },
    shots,
    score: { key, drone: 0.0, transitions: scoreTransitions(shots), cues: transitionCues(shots), music: music ?? defaultMusic(shots, key), ...score },
    cues: (timeline) => setCues(timeline),
  };
}
