// Episode 5 (BRIGHT MODEL) cutting policy: one pure function of the shot list, shared by picture and sound.
//
//   picture (projects/mortgage/scene.js):   planCuts(ctx.shots, TR.meta)  -> [{ id, set, name, dur, opts }]
//   sound   (projects/mortgage/project.mjs): score.transitions = scoreTransitions(shots)
//
// Bright channels cut hard; the signature continuous moves are a zoom-through, a match cut 3D <-> archive, and an
// x-ray dissolve (docs/library/bright-style/STYLE.md §9). So the repertoire is cut, push, zoom-through, match-cut,
// dissolve, match-dissolve (and dip-black only on a chapter turn). No film burns, glitches or ink bleeds.
//
// Default policy (params.trans always wins: any engine/transitions.js name; params.transDur, params.transOpts):
//   cut            first shot; out of the cold open / title / chapter; into a beat (cut on the word); most 3D -> 3D
//   zoom-through   aerial -> a diorama of the same place (section, lock, valley-flood, culebra, expansion, rio-indio)
//   match-dissolve diorama -> the same diorama (same set twice in a row: time passes on the model)
//   dissolve       into or out of an archive photo / document graphic
//   push           into a data graphic from a 3D set (going deeper into the same idea)
//   dip-black      into a chapter card
export const HARD_OUT = new Set(['cold-open', 'title', 'chapter']);
export const DIORAMAS = new Set(['house-block', 'bid-stack', 'seesaw', 'pipe', 'debt-tower', 'vault']);
export const AERIALS = new Set(['suburb', 'aerial']);
export const ARCHIVE = new Set(['archive', 'photo', 'doc', 'quote', 'document', 'newspaper']);
export const DATA = new Set(['numbers', 'chart', 'line', 'bars', 'counter', 'map', 'lake-level', 'budget', 'auction', 'timeline', 'rates', 'payment', 'bidders', 'holders', 'calendar', 'bignumber', 'gauge']);
const ALIAS = { 'dip-to-black': 'dip-black', dip: 'dip-black', zoom: 'zoom-through', match: 'match-cut', xray: 'match-dissolve' };
const FALLBACK = { cut: 0, dissolve: 0.45, 'match-dissolve': 0.9, 'match-cut': 0.5, 'dip-black': 0.8, push: 0.42, 'zoom-through': 0.55 };
export const normName = (n) => ALIAS[n] ?? n;

// expand beats exactly like engine/render.mjs (only the ids and sets matter here)
export function expandBeats(shots) {
  return shots.flatMap((s) => !s.beats?.length ? [s] : [s, ...s.beats.map(([word, set, params], k) => ({ id: `${s.id}.${k + 1}`, set, params: params ?? {}, beat: word }))]);
}

export function planCuts(shots0, meta = null) {
  const shots = shots0.some(s => s.beats?.length) ? expandBeats(shots0) : shots0;
  const dur = (n) => meta?.[n]?.dur ?? META?.[n]?.dur ?? FALLBACK[n] ?? 0.5;
  return shots.map((sh, i) => {
    const pv = shots[i - 1], P = sh.params ?? {};
    const isBeat = sh.beat != null || /\.\d+$/.test(sh.id);
    let name;
    if (P.trans) name = normName(P.trans);
    else if (!pv || isBeat) name = 'cut';
    else if (sh.set === 'chapter') name = 'dip-black';
    else if (HARD_OUT.has(pv.set) || sh.set === 'title' || sh.set === 'cold-open') name = 'cut';
    else if (ARCHIVE.has(sh.set) !== ARCHIVE.has(pv.set)) name = 'dissolve';
    else if (AERIALS.has(pv.set) && DIORAMAS.has(sh.set)) name = 'zoom-through';
    else if (DIORAMAS.has(sh.set) && sh.set === pv.set) name = 'match-dissolve';
    else if (DATA.has(sh.set) && (DIORAMAS.has(pv.set) || AERIALS.has(pv.set))) name = 'push';
    else name = 'cut';
    if (meta && !meta[name]) throw new Error(`[panama cuts] ${sh.id}: unknown transition "${P.trans}"`);
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

// score.transitions for engine/score.py: every planned transition, cuts included (a cut carries its soft impact),
// each with the duration the picture uses.
export function scoreTransitions(shots) {
  return planCuts(shots, META).slice(1).map(({ id, name, dur }) => ({ shot: id, name, dur }));
}
