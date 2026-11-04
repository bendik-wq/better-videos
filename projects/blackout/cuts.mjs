// Episode 4 (LIVE WIRE) cutting policy: one pure function of the shot list, shared by picture and sound.
//
//   picture (projects/blackout/scene.js):   planCuts(ctx.shots, { ...TR.meta, ...PC.META })  -> [{ id, name, dur, opts }]
//   sound   (projects/blackout/project.mjs): score.transitions = scoreTransitions(shots)   (engine transitions)
//                                            score.cues        = transitionCues(shots)      (project power cuts)
//
// Engine transitions get their sound from engine/sfx.py TRANSITION_SFX via score.transitions. The four project
// transitions (sets/power-cuts.js) are unknown to sfx.py, so their sounds are emitted here as plain sfx cues
// ({ type: 'sfx', name, shot, at, gain, params }) at the instant the picture makes them. No browser imports.
//
// Default policy (params.trans always wins; any engine/transitions.js name, a power cut, or 'dip-to-black'):
//   cut            first shot; out of chapter / title / cold-open / flash; into a beat (cut on the word);
//                  3D to 3D (Fincher: locked, precise, hard cuts; dissolves only when time passes)
//   crt-collapse   into a chapter card (the picture dies into a line, the line becomes the scope trace)
//   flash-pop      into a direct-flash still (the shutter is the cut)
//   scanline       into a screen graphic (scope, numbers, quote, terminal screen, map-ops, oneline) from a picture
//   match-dissolve map-ops into map-ops, orbit into orbit
//   slide          doc to doc
// Power cuts on story beats are chosen by the script: params.trans = 'flicker-out' | 'breaker-clunk' | 'crt-collapse'.
export const HARD_OUT = new Set(['chapter', 'title', 'cold-open', 'flash']);
export const SCREENS = new Set(['scope', 'numbers', 'quote', 'map-ops', 'oneline', 'cursor']);
export const MAPS = new Set(['map-ops', 'orbit-lights']);
export const DOCS = new Set(['doc']);
const ALIAS = { 'dip-to-black': 'dip-black', 'dip-to-red': 'dip-red', dip: 'dip-black', clunk: 'breaker-clunk', collapse: 'crt-collapse', flicker: 'flicker-out' };

// project transitions: default length and their sounds [preset, anchor at fraction of dur, gain, params]
export const PROJECT = {
  'crt-collapse':  { dur: 1.0,  sfx: [['tape.stop', 0.58, 0.45, { dur: 0.55, key: 98 }], ['ui.tick', 0.6, 0.35]] },
  'flicker-out':   { dur: 0.9,  sfx: [['ui.ticks', 0.04, 0.4, { count: 7, period: 0.075, accel: -0.3 }], ['glitch.zap', 0.3, 0.18], ['impact.soft', 0.62, 0.45]] },
  'breaker-clunk': { dur: 0.6,  sfx: [['impact.hit', 0.0, 0.7, { room: 0.12 }], ['sub.drop', 0.0, 0.5, { dur: 1.2 }]] },
  'flash-pop':     { dur: 0.36, sfx: [['shutter', 0.0, 0.7], ['impact.soft', 0.05, 0.25]] },
};
const FALLBACK = { cut: 0, dissolve: 0.45, 'match-dissolve': 0.9, scanline: 0.6, slide: 0.6, 'dip-black': 0.8, push: 0.42, 'zoom-through': 0.55 };
export const normName = (n) => ALIAS[n] ?? n;

// expand beats exactly like engine/render.mjs (only the ids and sets matter here)
export function expandBeats(shots) {
  return shots.flatMap((s) => !s.beats?.length ? [s] : [s, ...s.beats.map(([word, set, params], k) => ({ id: `${s.id}.${k + 1}`, set, params: params ?? {}, beat: word }))]);
}

export function planCuts(shots0, meta = null) {
  const shots = shots0.some(s => s.beats?.length) ? expandBeats(shots0) : shots0;
  const dur = (n) => PROJECT[n]?.dur ?? meta?.[n]?.dur ?? META?.[n]?.dur ?? FALLBACK[n] ?? 0.5;
  return shots.map((sh, i) => {
    const pv = shots[i - 1], P = sh.params ?? {};
    const isBeat = sh.beat != null || /\.\d+$/.test(sh.id);
    let name;
    if (P.trans) name = normName(P.trans);
    else if (!pv || isBeat) name = 'cut';
    else if (sh.set === 'chapter') name = 'crt-collapse';
    else if (sh.set === 'flash') name = 'flash-pop';
    else if (HARD_OUT.has(pv.set) || sh.set === 'title' || sh.set === 'cold-open') name = 'cut';
    else if (DOCS.has(sh.set) && DOCS.has(pv.set)) name = 'slide';
    else if (MAPS.has(sh.set) && sh.set === pv.set) name = 'match-dissolve';
    else if (SCREENS.has(sh.set) && !SCREENS.has(pv.set)) name = 'scanline';
    else name = 'cut';
    if (meta && !meta[name] && !PROJECT[name]) throw new Error(`[blackout cuts] ${sh.id}: unknown transition "${P.trans}"`);
    const d = name === 'cut' ? 0 : (P.transDur ?? dur(name));
    const opts = { dir: i % 2 ? -1 : 1, seed: i, ...(P.transOpts ?? {}) };
    return { id: sh.id, set: sh.set, name, dur: d, opts };
  });
}

// node only: default durations straight from engine/transitions.js (a browser module, read as text)
let META = null;
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    const fs = await import('node:fs');
    const src = fs.readFileSync(new URL('../../engine/transitions.js', import.meta.url), 'utf8');
    META = {}; for (const m of src.matchAll(/^\s*'([a-z-]+)':\s*\{\s*dur:\s*([\d.]+)/gm)) META[m[1]] = { dur: +m[2] };
  } catch { META = null; }
}

// score.transitions for engine/score.py: every planned engine transition, cuts included (a cut carries its
// soft impact), each with the duration the picture uses. Project power cuts are left to transitionCues().
export function scoreTransitions(shots) {
  return planCuts(shots, META).slice(1).filter(({ name }) => !PROJECT[name]).map(({ id, name, dur }) => ({ shot: id, name, dur }));
}
// score cues for the project power cuts: sfx placed at their anchor inside the incoming shot
export function transitionCues(shots) {
  return planCuts(shots, META).slice(1).filter(({ name }) => PROJECT[name]).flatMap(({ id, name, dur }, k) =>
    PROJECT[name].sfx.map(([preset, frac, gain, params], j) => ({ type: 'sfx', name: preset, shot: id, at: +(frac * dur).toFixed(3), gain, seed: k * 7 + j, ...(params ? { params } : {}) })));
}
