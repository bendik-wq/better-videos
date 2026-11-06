# SHOTS-GUIDE: episode 10, for chapter writers

You own **one file**: `projects/notredame/shots/ch<N>.mjs`. Everything else (runtime `scene.js`, cut policy `cuts.mjs`,
`project.mjs`, the sets, SCRIPT.md, the VO project, the engine) is shared: don't edit it; ask the production lead.
The current file is a placeholder stub (one shot per line, rotating sets). Replace its body; keep the exports.

Read before you build: `VISUALS.md` (your lines + the **fact locks**), `OUTLINE.md` (shot structure, sound), `STYLE-BIBLE.md`
(§11 transitions), the set headers in `sets/nd-sets.js` and `sets/nd-graphics.js`, and the lab examples in
`projects/notredame-lab/project.mjs` (a working param set for every set and state).

## The file

```js
import { chapter, M, HOLDS, skyFor } from './lib.mjs';
const { S, CH, L, check } = chapter(3);          // ids come out s301, s302, ... and 'ch3' (stable in both projects)
export const shots = check([                      // check(): throws unless your shots voice exactly your lines, in file order
  CH('The Wrong Fix', 'the spire and the planes', { lit: 'none' }, M('tension', 'D', [0.3, 0.5])),
  S('cathedral', L(47), { view: 'facade', sky: 'day', fire: 0.6, red: 'spire' },
    { beats: [['danger', 'bellFrame', { open: 1, openAt: 0.2, char: 0.3, redBell: -1 }]] }),
  S('paris', L(48, 49), { route: 1, routeAt: 'planes', routeDur: 2.5 }, { mood: M('urgency', 'D', [0.5, 0.65], { hit: true }) }),
  // ...
]);
export default shots;
```

- `S(set, vo, params = {}, extra = {})`: one shot. `extra`: `beats`, `mood`, `padIn`, `padOut` (s of air before/after the VO),
  `min` (minimum seconds).
- `L(a, b = a)`: SCRIPT lines a..b **in file order** (ids like `'86a'`, `'105a'`, `'117b'` as strings). Never retype narration.
  File order differs from number order: Ch.2 plays 38, 40, 41, 39, 42, 43; Ch.4 plays 93, 94 before 88a; Ch.5 plays
  97 → 100, 107, 109, 110, 102 → 105a, 111, 112. `L(40, 41)` works; `L(39, 41)` throws (out of file order).
- `CH(title, sub, params, mood)`: the chapter card (set `chapter`). `params`: `lit` `'delay'|'deadline'|'none'`, `delay`,
  `deadline`, `date`, `red`, `labelL/subL/labelR/subR`. Ch.0 ends with the `title` shot; Ch.6 ends with the `end` card.
- `HOLDS` (in lib): the script's silences, **keep them on the shot that voices the line**: L35 `padIn: 2.0` (flame door),
  L57 `padIn: 1.0`, L73 `padOut: 3.0` (the guess silence), L125 `padOut: 1.5` (the peal). E.g. `{ ...HOLDS['73'] }`.
- `skyFor(id)`: the light rule (L1–58 day, dusk from 62, night 68–95, L107 night, else day).
- `M(mood, key, intensity, more)`: a music section starting at this shot (moods: tension, wonder, urgency, melancholy,
  triumph, mystery; `intensity` number or `[from, to]`; `riser`, `hit`, `ending: 'resolve'|'cut'`, `until`, `at`).
  Put one on your first shot or card and on each real change of feeling (3–6 per chapter). Chapter cards are music drops.

## Beats, cuts, pacing

- A shot's VO can cut to more visuals on spoken words: `beats: [['word', set, params], ...]`. Beat ids are `s304.1`, `s304.2`.
  The engine matches the beat word against the start of a spoken word (case/accents ignored); an unknown word **throws**.
- Targets (VISUALS): a new composition every 4–6 s, **5–8 hard cuts per minute**, one held set per idea with pushes/morphs
  inside (animate params: `fireAt/fireDur`, `zoomTo`, `cam`), exactly **one red thing per frame**.
- **No-repeat rule:** the engine rejects two clips with identical `set + params` (chapter cards exempt). Two shots of the
  same set must differ in at least one param that changes the picture. Don't add dummy params to dodge it.

## Timing: word cues, never VO seconds

The VO is a local placeholder (Kokoro); ElevenLabs replaces it, so every hard-coded second that depends on speech will drift.
Any param named `at`, `…At` or `…Dur` (also nested: `zoomTo.at`, `steps[i].at`) takes:

| spec | means |
|---|---|
| `1.2` | seconds into the clip (fine for things not tied to speech: an entrance at 0.3 s) |
| `'Feu'` | start of the first spoken word beginning with "feu" in this clip |
| `'minutes@1'` | the 2nd time it is said |
| `'fell+0.3'`, `'fell-0.2'` | offset in seconds |
| `'40%'`, `'40%+0.2'` | a fraction of the clip's duration |

Graphics sets also take word cues in `word` fields (`counter.steps[i].word`, `timeline.events[i].word`). A word that isn't
in the clip: the graphics sets fall back to their own schedule; the hero sets get 25 % of the clip (`params.cueFallback`)
and log a warning. In a beat, words are timed from the beat's start. Cue the first element of a card in the first ~2 s of
the line (dead-air rule).

## Set cheat-sheet (most useful params; full lists in the set headers)

Hero sets (`sets/nd-sets.js`)
- `cathedral`: `view 'fold'|'side'|'facade'|'thumb'`, `sky 'day'|'dusk'|'night'`, `fire 0..1` (+`fireAt/fireDur`), `smoke`,
  `wind`, `spire 'standing'|'leaning'|'falling'|'gone'` (+`spireU`, `spireAt/spireDur`), `roofGone 0..1`, `glow`, `clock 'HH:MM'`,
  `red 'origin'|'clock'|'spire'|'none'`, `cam {x,y,z}`, `zoomTo {x,y,z,at,dur}`, `labels`, `source`.
- `forest`: `fire` (+At/Dur), `char`, `collapse`, `debris`, `vault true`, `red 'front'|'none'`, `cam`.
- `spireFall`: `u` (or `at`/`dur` to animate the fall), `sparks`, `dust`, `shake`. **Fact lock: no hole at the crossing.**
- `bellFrame`: `open`, `char`, `flame`, `redBell index|-1` (dormant/red lock!), `slip`, `domino` (+At/Dur), `chain`, `layout 'pair'`,
  `weights`, `sky`. **Fact lock: the bell never slips off its pin** (keep `slip` small; never animate it to a fall).
- `clock`: `from 'HH:MM'`, `to`, `roll` (+`rollAt/rollDur`), `spring`, `flapL 'FEU'`, `tagText`, `red 'tag'|'right'|'none'`, `cathedral true`.
- `paris`: `route` (+At/Dur), `engines`, `boat`, `pump`, `zoom`, `center [x,y]`, `labels`, `red`.
- `firefighters`: `mode 'hose'|'chain'|'stair'`, `view` (hose `low|side|wide`, chain `side|close|wide`), `n`, `u` (+uAt/uDur),
  `sky`, `red 'relic'|'lead'|'none'`, `label`, `sub`, `countSub`.
- every hero set: `smokeSeed`, `smokeStyle 'puff'|'column'|'lean'|'billow'`.

Graphics sets (`sets/nd-graphics.js`)
- `title` (`lines`, `red`, `sub`, `end`), `chapter` (above), `quote` (`text`, `fr`, `by`, `role`, `date`, `highlight`, `strip`, `source`),
  `doc` (`kind 'ticket'|'report'|'statement'|'post'`, `head`, `meta`, `lines`, `highlight`, `at`, `stamp`, `label`; always
  "RECREATED", verbatim text only), `bignumber` (`value`, `unit`, `label`, `red`, `at`), `counter` (`steps [{text,label,word,red}]`),
  `timeline` (`events [{time,label,sub,word}]`, `focus`), `compare` (`mode 'height'|'weight'`, `a`, `b`), `winder` (not used in rev 6+).
- every graphics set: `cam { push, dx, dy }` (push 0 = locked), `source` (the source slip; required for any claim).

## Transitions (`cuts.mjs`)

Default: **hard cut** (every beat, everything else), `case-open` into each chapter card, `dip-ink` into the end card,
`tape-feed` into a `timeline`. Override per shot with `params.trans` (+ `transDur`, `transOpts`); the transition plays at
the **start** of the shot that names it, and its sound is added automatically.

| name | what | dur | use |
|---|---|---|---|
| `cut` | T8 hard cut on the word | 0 | ~70 % of all cuts |
| `case-open` | T1 lid hinges up off A, B is the mechanism inside (`transOpts.hinge: 'left'`) | 0.95 | chapter turns, the payoff reveal (signature) |
| `loupe` | T2 brass loupe ring opens on `transOpts.at: [u, v]` with B at 3.5x, grows to fill | 0.85 | magnify a detail (signature) |
| `gear-mesh` | T3 a brass gear rolls A out, B in (`transOpts.dir: 1|-1`, `y`) | 1.2 | mechanism → mechanism (signature) |
| `tape-feed` | T4 ticker tape races across, push to B (`transOpts.y`) | 0.9 | time skips |
| `card-flip` | T5 the frame flips on its vertical axis | 0.5 | the same thing, other side / before–after |
| `fold-away` | T6 A folds in half like a map and lifts away | 0.62 | leaving a map / document |
| `dip-ink` | through the navy plate | 0.8 | end of a movement |
| engine names | `push`, `slide`, `whip`, `dissolve`, `iris`, `shape-circle`, `shape-box`, `page-turn`, `split-slide`, `linear-wipe`, `pull-back`, `zoom-through`, ... | | sparingly |

Signature moves (case-open, loupe, gear-mesh): **at most one per 60 s** across the film; chapter cards already use
case-open, so in a chapter body prefer cuts and in-set moves. Banned: `glitch`, `scanline`, `pixel-sort`, `light-leak`,
`film-burn`, `ink-bleed` (cuts.mjs throws).

## Render your chapter

```bash
cd /home/user/better-videos
node engine/render.mjs projects/nd-ch<N> --vo-only                         # timeline only (fast; validates beats, repeats)
node engine/render.mjs projects/nd-ch<N> --stills=0.3,0.7                  # all your shots, 2 stills each
node engine/render.mjs projects/nd-ch<N> --stills=0.1,0.5,0.9 --only=s304,s304.1
```

Stills land in `projects/nd-ch<N>/out/stills/<id>-<pct>.jpg` (e.g. `s304.1-30.jpg`); the timeline is
`projects/nd-ch<N>/out/timeline.json` (start, duration, words per clip: use it to check cue times). A still at a fraction
inside a transition shows the mix (transitions sit in the first `dur` seconds of a shot). Contact sheet:

```bash
cd projects/nd-ch<N>/out/stills
ffmpeg -y -loglevel error -pattern_type glob -i '*.jpg' -vf "scale=480:-1,tile=4x6:padding=6:color=white" -frames:v 1 ../contact-%02d.jpg
# more than 24 stills -> contact-01.jpg, contact-02.jpg ... (drop -frames:v 1 to get all pages)
```

Motion check of a short range: `node engine/render.mjs projects/nd-ch<N> --draft --only=s304,s306` (contiguous range,
960x540 12 fps) → `projects/nd-ch<N>/out/`. The whole film: `node engine/render.mjs projects/notredame --vo-only` must
still pass (it also checks that all 105 lines are voiced exactly once, in file order).

Before you hand in: `--vo-only` passes, stills reviewed against VISUALS fact locks (one red per frame, no blame, no sectioned
building, bell on its pin, no crossing hole at the spire impact), no dead air > 1 s, cut rate 5–8/min.
Delete your `out/stills` when done (disk).

## Gotchas seen in the first stills

- **Set defaults carry content.** With no params, `clock` prints `+30 MIN` (red), FEU and "Brigade called" tags; `forest` and
  `cathedral` show a clock badge (18:18 / 18:43) and labels; graphics sets print default sources. Set `clock`, `labels`,
  `red`, `source`, `tagText` explicitly on every shot so each frame says only what its line supports (one red thing).
- Hero sets are mostly static unless you animate a param (`fireAt`, `rollAt`, `openAt`, `zoomTo`, `cam`): stills at 0.3 and
  0.7 of a stub shot look the same. Every held shot needs motion inside it.
- The transition lab `projects/nd-trlab` shows every Paper & Spring move: `node engine/render.mjs projects/nd-trlab --stills=0.12,0.25`.
- The `[gl] llvmpipe NOT ACTIVE` warning doesn't matter here: this runtime draws no GL.
