// Shared helpers for the episode-10 shot files (shots/ch0.mjs ... ch6.mjs). Read SHOTS-GUIDE.md first.
//
//   const { S, CH, L, lines } = chapter(3);   // one per chapter file; ids are chapter-scoped and stable (s301, s302, ...)
//   S(set, vo, params = {}, extra = {})       // a shot: extra = { beats, mood, padIn, padOut, min, ... }
//   CH(title, sub, params = {}, mood)         // the chapter card (id 'ch3'); params go to the 'chapter' set
//   L(a, b = a)                               // SCRIPT.md lines a..b in FILE order, joined with '\n' ('86a' ids ok)
//   lines                                     // this chapter's line ids in file order
//   check(shots)                              // throws unless the shots voice exactly this chapter's lines, in order
//
// The script is LOCKED: never retype narration, always take it from L().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPT = path.join(here, '..', 'SCRIPT.md');
export const LINES = {}, ORDER = [], CHAPTER_OF = {}, CHAPTERS = {};
{
  let ch = null;
  for (const l of fs.readFileSync(SCRIPT, 'utf8').split('\n')) {
    const h = l.match(/^## (?:(\d+)\. (.*)|COLD OPEN)\s*$/);
    if (h) { ch = h[1] ? +h[1] : 0; CHAPTERS[ch] = { num: ch, heading: h[2] ?? 'COLD OPEN', lines: [] }; continue; }
    const m = l.match(/^(\d+[ab]?)\. (.*)$/);
    if (m) { LINES[m[1]] = m[2].trim(); ORDER.push(m[1]); CHAPTER_OF[m[1]] = ch; CHAPTERS[ch]?.lines.push(m[1]); }
  }
}

// L(a, b): script lines a..b in script FILE order (numbers or '86a'-style ids), joined with '\n'
export const L = (a, b = a) => { const i = ORDER.indexOf(String(a)), j = ORDER.indexOf(String(b));
  if (i < 0 || j < 0 || j < i) throw new Error(`SCRIPT line ${i < 0 ? a : j < 0 ? b : `${a}..${b} (out of file order)`} missing`); return ORDER.slice(i, j + 1).map(k => LINES[k]).join('\n'); };

// word-cue helpers (strings the sets resolve against the spoken words of the shot)
export const w = (word, off = 0, nth = 0) => `${word}${nth ? '@' + nth : ''}${off ? (off > 0 ? '+' : '') + off : ''}`;

// mood shorthand: M('tension', 'D', [0.3, 0.5], { riser: true })
export const M = (mood, key, intensity, more = {}) => ({ mood, key, intensity, ...more });

export function chapter(num) {
  const info = CHAPTERS[num]; if (!info) throw new Error(`no chapter ${num} in SCRIPT.md`);
  let n = 0;
  const S = (set, vo, params = {}, extra = {}) => ({ id: `s${num}${String(++n).padStart(2, '0')}`, set, vo, params, ...extra });
  const CH = (title, sub, params = {}, mood = null) => ({ id: `ch${num}`, set: 'chapter', params: { num, title, sub, ...params }, min: 4.0, chapter: num, ...(mood ? { mood } : {}) });
  const check = (shots) => {
    const said = shots.filter(s => s.vo).flatMap(s => s.vo.split('\n'));
    const want = info.lines.map(k => LINES[k]);
    const bad = want.findIndex((x, i) => said[i] !== x);
    if (bad >= 0 || said.length !== want.length) {
      const i = bad >= 0 ? bad : Math.min(said.length, want.length);
      throw new Error(`[ch${num}] narration does not match SCRIPT.md at line ${info.lines[i] ?? '(extra)'}: got "${(said[i] ?? '(nothing)').slice(0, 60)}"`);
    }
    return shots;
  };
  return { S, CH, L, lines: info.lines, heading: info.heading, check, w, M };
}

// Timing holds the script asks for (SCRIPT.md "Silence and sound"): keep these on the shot that voices the line.
//   35: 2.0 s flame-door hold BEFORE the line · 57: 1.0 s held silence before · 73: 3.0 s guess silence after · 125: 1.5 s peal after
export const HOLDS = { '35': { padIn: 2.0 }, '57': { padIn: 1.0 }, '73': { padOut: 3.0 }, '125': { padOut: 1.5 } };

// light by line (VISUALS "Light"): L1–58 day, dusk from L62, night L68–95, L107 night plate, the rest day
export const skyFor = (id) => { const n = parseInt(id, 10); return n === 107 ? 'night' : n <= 58 ? 'day' : n < 68 ? 'dusk' : n <= 95 ? 'night' : 'day'; };

// PLACEHOLDER shots: one per line, rotating through `looks` ([set, params] pairs). Every shot gets `stub: <line id>`
// so no two clips are identical (the engine rejects repeated visuals). Chapter writers replace these with real shots.
export function stub(c, looks, { mood = null } = {}) {
  return c.lines.map((id, i) => { const [set, p] = looks[i % looks.length];
    const params = { ...p, stub: id }; if (['cathedral', 'clock', 'bellFrame', 'firefighters'].includes(set) && params.sky === undefined) params.sky = skyFor(id);
    return c.S(set, c.L(id), params, { ...(HOLDS[id] ?? {}), ...(i === 0 && mood ? { mood } : {}) }); });
}
