// Hormuz cutting policy: one pure function of the shot list, shared by the picture and the sound.
//
//   picture (projects/hormuz/scene.js):   planCuts(ctx.shots, TR.meta)    -> [{ id, name, dur, opts }]
//   sound   (projects/hormuz/project.mjs): score.transitions = scoreTransitions(shots)
//
// scoreTransitions() runs in node: it expands `beats` exactly as engine/render.mjs does (ids `<id>.<k>`)
// and reads the default durations from engine/transitions.js, so every planned transition gets its
// matching sound from engine/sfx.py (TRANSITION_SFX), sized to the move, at the same instant the picture
// makes it. No browser imports here.
//
// Default policy (params.trans always wins; any engine/transitions.js name, or 'dip-to-black'):
//   cut             first shot; into and out of chapter and title cards; into a beat (the cut is on the word)
//   dissolve        into and out of graphics (type, data, documents, ledgers, signs)
//   slide           document to document (the next page in a series)
//   whip            only into a map, from a shot that is not a map (the subject changes place)
//   match-dissolve  between two 3D shots of the same set (the shapes match: sea into sea), map into map
//   push / match-dissolve, alternating, between other 3D shots (going deeper / time passing)
export const HARD = new Set(['chapter', 'title']);
export const GRAPHICS = new Set(['quote', 'numbers', 'bars', 'timeline', 'doc', 'insurance', 'pump', 'photo', 'helium']);
export const MAPS = new Set(['flows', 'gulf-map', 'chokepoint-map', 'lanes-law']);
export const DOCS = new Set(['doc']);
const ALIAS = { 'dip-to-black': 'dip-black', 'dip-to-red': 'dip-red', dip: 'dip-black' };
const FALLBACK = { cut: 0, dissolve: 0.45, 'match-dissolve': 0.9, push: 0.42, whip: 0.42, slide: 0.6, 'dip-black': 0.8 };

export const normName = (n) => ALIAS[n] ?? n;

// expand beats exactly like engine/render.mjs (only the ids and sets matter here)
export function expandBeats(shots) {
  return shots.flatMap((s) => !s.beats?.length ? [s] : [s, ...s.beats.map(([word, set, params], k) => ({ id: `${s.id}.${k + 1}`, set, params: params ?? {}, beat: word }))]);
}

export function planCuts(shots0, meta = null) {
  const shots = shots0.some(s => s.beats?.length) ? expandBeats(shots0) : shots0;
  const dur = (n) => meta?.[n]?.dur ?? META?.[n]?.dur ?? FALLBACK[n] ?? 0.5;
  let alt = 0;
  return shots.map((sh, i) => {
    const pv = shots[i - 1], P = sh.params ?? {};
    const isBeat = sh.beat != null || /\.\d+$/.test(sh.id);
    let name;
    if (P.trans) name = normName(P.trans);
    else if (!pv || isBeat || HARD.has(sh.set) || HARD.has(pv.set)) name = 'cut';
    else if (DOCS.has(sh.set) && DOCS.has(pv.set)) name = 'slide';
    else if (GRAPHICS.has(sh.set) || GRAPHICS.has(pv.set)) name = 'dissolve';
    else if (MAPS.has(sh.set) && !MAPS.has(pv.set)) name = 'whip';
    else if (MAPS.has(sh.set) || sh.set === pv.set) name = 'match-dissolve';
    else name = alt++ % 2 ? 'match-dissolve' : 'push';
    if (meta && !meta[name]) throw new Error(`[hormuz cuts] ${sh.id}: unknown transition "${P.trans}"`);
    const d = name === 'cut' ? 0 : (P.transDur ?? dur(name));
    // direction: whips and slides alternate deterministically by position, so two in a row never match
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

// score.transitions for engine/score.py: every planned transition, cuts included (a cut carries its
// soft impact), each with the duration the picture uses.
export function scoreTransitions(shots) {
  return planCuts(shots, META).slice(1).map(({ id, name, dur }) => ({ shot: id, name, dur }));
}
