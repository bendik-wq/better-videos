// Episode 10 (PAPER & SPRING) cutting policy: one pure function of the shot list, shared by picture and sound.
//
//   picture (projects/notredame/scene.js):   planCuts(ctx.shots, TR.meta)  -> [{ id, set, name, dur, opts }]
//   sound   (projects/notredame/project.mjs): score.transitions = scoreTransitions(shots)   (engine-named moves)
//                                             cues: (tl) => transitionCues(tl)               (the Paper & Spring moves)
//
// STYLE-BIBLE §11: ~70 % hard cuts on the word (T8) plus pushes/slides inside one table world; signature moves (case-open,
// loupe, gear-mesh) only for chapter turns and reveals, at most one per 60 s. Never glitch, scanline, pixel-sort,
// light-leak, film-burn or ink-bleed.
//
// The Paper & Spring transitions (drawn in 2D by scene.js, names usable in params.trans):
//   case-open   T1 [signature] A hinges up off its top edge like a watch back; B is the mechanism inside   0.95 s
//   loupe       T2 a brass loupe ring opens on params.transOpts.at ([u, v], default centre) with B at 3.5x     0.85 s
//   gear-mesh   T3 a brass gear at the seam rolls A out and B in (slide with parallax)                       1.2 s
//   tape-feed   T4 time skip: a ticker tape races across, A pushes out under it, B lands on a stop          0.9 s
//   card-flip   T5 the frame is a card that flips on its vertical axis to B printed on the back           0.5 s
//   fold-away   T6 A folds in half like a map and lifts away, revealing B underneath                      0.62 s
//   dip-ink     a breath through the navy ink plate (into the end card; a chapter turn without a signature) 0.8 s
// Plus any engine/transitions.js name (cut, push, slide, whip, dissolve, iris, shape-circle, shape-box, page-turn,
// split-slide, linear-wipe, ...), except the banned ones.
//
// Default policy (params.trans always wins; params.transDur, params.transOpts):
//   cut         first shot; every beat (cut on the word); out of title / chapter; into the title; everything else
//   case-open   into a chapter card (the signature lives on the chapter turns: six of them, minutes apart)
//   dip-ink     into the end card
//   tape-feed   into a timeline from another set (time skips)
export const BANNED = new Set(['glitch', 'scanline', 'pixel-sort', 'light-leak', 'film-burn', 'ink-bleed']);
export const SIGNATURE = new Set(['case-open', 'loupe', 'gear-mesh']);
// Paper & Spring moves: picture duration, the engine name drawn when a runtime lacks the custom move (fallback),
// and the sound: an engine transition whose meta sfx fits (proxy) and/or extra score cues ([type|sfx name, frac of dur]).
export const CUSTOM = {
  'case-open': { dur: 0.95, fallback: 'page-turn', proxy: 'slide', cues: [['clunk', 0.62, 0.35]] },
  'loupe':     { dur: 0.85, fallback: 'iris', proxy: 'iris', cues: [['ui.scan', 0.0, 0.3]] },
  'gear-mesh': { dur: 1.2, fallback: 'slide', proxy: 'slide', cues: [['ui.ticks', 0.1, 0.35]] },
  'tape-feed': { dur: 0.9, fallback: 'push', proxy: null, cues: [['type.run', 0.0, 0.3], ['tape.stop', 1.0, 0.4]] },
  'card-flip': { dur: 0.5, fallback: 'page-turn', proxy: 'page-turn', cues: [] },
  'fold-away': { dur: 0.62, fallback: 'split-slide', proxy: null, cues: [['paper.rustle', 0.1, 0.4]] },
  'dip-ink':   { dur: 0.8, fallback: 'dip-black', proxy: 'dip-black', cues: [] },
};
const ALIAS = { 'case': 'case-open', 'T1': 'case-open', 'T2': 'loupe', 'gear': 'gear-mesh', 'T3': 'gear-mesh', 'tape': 'tape-feed', 'T4': 'tape-feed',
  'flip': 'card-flip', 'T5': 'card-flip', 'fold': 'fold-away', 'T6': 'fold-away', 'T8': 'cut', dip: 'dip-ink', 'dip-to-black': 'dip-black' };
export const normName = (n) => ALIAS[n] ?? n;
const FALLBACK_DUR = { cut: 0, dissolve: 0.45, push: 0.42, slide: 0.6, 'page-turn': 1.0, 'dip-black': 0.8, iris: 0.6 };

// expand beats exactly like engine/render.mjs (only the ids and sets matter here)
export function expandBeats(shots) {
  return shots.flatMap((s) => !s.beats?.length ? [s] : [s, ...s.beats.map(([word, set, params], k) => ({ id: `${s.id}.${k + 1}`, set, params: params ?? {}, beat: word }))]);
}

export function planCuts(shots0, meta = null) {
  const shots = shots0.some(s => s.beats?.length) ? expandBeats(shots0) : shots0;
  const known = (n) => CUSTOM[n] || (meta ?? META ?? {})[n] || FALLBACK_DUR[n] != null;
  const dur = (n) => CUSTOM[n]?.dur ?? meta?.[n]?.dur ?? META?.[n]?.dur ?? FALLBACK_DUR[n] ?? 0.5;
  return shots.map((sh, i) => {
    const pv = shots[i - 1], P = sh.params ?? {};
    const isBeat = sh.beat != null || /\.\d+$/.test(sh.id);
    let name;
    if (P.trans) name = normName(P.trans);
    else if (!pv || isBeat) name = 'cut';
    else if (sh.set === 'chapter') name = 'case-open';
    else if (sh.set === 'title' && P.end) name = 'dip-ink';
    else if (pv.set === 'chapter' || pv.set === 'title' || sh.set === 'title') name = 'cut';
    else if (sh.set === 'timeline' && pv.set !== 'timeline') name = 'tape-feed';
    else name = 'cut';
    if (i === 0) name = 'cut';
    if (BANNED.has(name)) throw new Error(`[notredame cuts] ${sh.id}: "${name}" is banned in Paper & Spring (STYLE-BIBLE §11)`);
    if (!known(name)) throw new Error(`[notredame cuts] ${sh.id}: unknown transition "${P.trans}"`);
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

// score.transitions for engine/score.py: every planned transition (cuts carry their soft impact) under an engine name
// whose sfx fits; Paper & Spring moves use their proxy (or none: their sound is all in transitionCues).
export function scoreTransitions(shots) {
  return planCuts(shots, META).slice(1).flatMap(({ id, name, dur }) => {
    if (!CUSTOM[name]) return [{ shot: id, name, dur }];
    return CUSTOM[name].proxy ? [{ shot: id, name: CUSTOM[name].proxy, dur }] : [];
  });
}

// extra score cues for the Paper & Spring moves (project.cues(timeline)): clunk at the latch, tape stop on the landing, ...
const SYN = new Set(['boom', 'clang', 'clunk', 'whoosh', 'horn', 'hum', 'water', 'ticks', 'swell', 'pulse']);
export function transitionCues(timeline) {
  return planCuts(timeline, META).slice(1).flatMap(({ id, name, dur }, k) => (CUSTOM[name]?.cues ?? []).map(([n, frac, gain], j) =>
    SYN.has(n) ? { type: n, shot: id, at: +(frac * dur).toFixed(3), gain } : { type: 'sfx', name: n, shot: id, at: +(frac * dur).toFixed(3), gain, seed: k * 7 + j }));
}
