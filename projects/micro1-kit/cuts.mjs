// LEDGER cutting + sound policy: pure functions of the shot list, shared by picture (scene.js) and sound (episode.mjs).
//
//   picture: planCuts(ctx.shots)              -> [{ id, set, name, dur, opts }]   (engine name or kit 'pop')
//   sound:   score.transitions = scoreTransitions(shots)   engine transitions (engine/sfx.py TRANSITION_SFX)
//            score.cues        = transitionCues(shots)     kit transitions (pop) as plain sfx cues
//            project.cues(timeline) = setCues(timeline)    every set's own pops/ticks/swipes, from set.plan(shot).sfx
//
// Transition names (params.trans always wins):
//   cut | push | whip | whip-up | slide | scroll (vertical slide, like a feed) | pop (scale-pop, kit) | radial-zoom |
//   zoom-through | split-slide | linear-wipe | shape-box | any other engine/transitions.js name
// Default policy (fast, short-form): first shot and beats cut on the word; otherwise by the incoming set (BY_SET),
// never the same transition twice in a row (rotates through ROTATE).
import SETS from './sets/index.js';

export const KIT = {
  pop: { dur: 0.34, sfx: [['whoosh.xs', 0.25, 0.3], ['impact.soft', 0.5, 0.35], ['ui.tick', 0.5, 0.35]] },
};
// short-form durations (snappier than the documentary defaults)
export const DUR = { push: 0.36, whip: 0.34, 'whip-up': 0.34, slide: 0.42, scroll: 0.4, 'radial-zoom': 0.32, 'zoom-through': 0.45, 'split-slide': 0.5, 'linear-wipe': 0.4, 'shape-box': 0.5, pop: 0.34 };
// aliases -> [engine name, opts]
const ALIAS = { scroll: ['slide', { axis: 'y', dir: 1 }], 'whip-up': ['whip', { axis: 'y', dir: 1 }], zoom: ['zoom-through', {}] };
export const BY_SET = { hook: 'radial-zoom', bignum: 'pop', checklist: 'scroll', docstack: 'whip', redact: 'slide', flow: 'scroll', tiers: 'whip-up',
  window: 'push', industry: 'whip', quote: 'slide', qa: 'pop', team: 'push', cta: 'zoom-through' };
const ROTATE = ['push', 'whip', 'scroll', 'pop', 'slide', 'whip-up'];

export function expandBeats(shots) {
  return shots.flatMap((s) => !s.beats?.length ? [s] : [s, ...s.beats.map(([word, set, params], k) => ({ id: `${s.id}.${k + 1}`, set, params: params ?? {}, beat: word }))]);
}

export function planCuts(shots0) {
  const shots = shots0.some((s) => s.beats?.length) ? expandBeats(shots0) : shots0;
  let prevName = null;
  return shots.map((sh, i) => {
    const P = sh.params ?? {}, isBeat = sh.beat != null || /\.\d+$/.test(sh.id);
    let want;
    if (P.trans) want = P.trans;
    else if (i === 0 || isBeat) want = 'cut';
    else {
      want = BY_SET[sh.set] ?? 'push';
      for (let k = 0; want === prevName && k < ROTATE.length; k++) want = ROTATE[(i + k) % ROTATE.length];
    }
    prevName = want;
    const [name, aopts] = ALIAS[want] ?? [want, {}];
    const dur = name === 'cut' ? 0 : (P.transDur ?? DUR[want] ?? DUR[name] ?? 0.4);
    const opts = { dir: i % 2 ? -1 : 1, seed: i, ...aopts, ...(P.transOpts ?? {}) };
    return { id: sh.id, set: sh.set, name, want, dur, opts };
  });
}

export function scoreTransitions(shots) {
  return planCuts(shots).slice(1).filter(({ name }) => !KIT[name]).map(({ id, name, dur }) => ({ shot: id, name, dur }));
}
export function transitionCues(shots) {
  return planCuts(shots).slice(1).filter(({ name }) => KIT[name]).flatMap(({ id, name, dur }, k) =>
    KIT[name].sfx.map(([preset, frac, gain, params], j) => ({ type: 'sfx', name: preset, shot: id, at: +(frac * dur).toFixed(3), gain, seed: k * 7 + j, ...(params ? { params } : {}) })));
}
// every set's own sound events (needs the timeline: word times). Set params.sfx = false to mute a shot's set sounds.
export function setCues(timeline) {
  const out = [];
  timeline.forEach((s, i) => {
    const set = SETS[s.set]; if (!set || s.params?.sfx === false) return;
    const P = set.plan(s);
    (P.sfx ?? []).forEach((c, j) => { if (c && c.at <= s.duration + 0.6) out.push({ type: 'sfx', shot: s.id, name: c.name, at: c.at, gain: (c.gain ?? 0.5) * (s.params?.sfxGain ?? 1), seed: i * 13 + j, ...(c.params ? { params: c.params } : {}) }); });
  });
  return out;
}
