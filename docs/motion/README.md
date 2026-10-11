# Motion library: transitions, motion graphics, sound design

Three engine modules that any episode can use. The craft and the sources behind them are in
`docs/motion/editing-transitions.md`.

| Module | What it is | Where it runs |
|---|---|---|
| `engine/transitions.js` | 36 deterministic compositor transitions on the outgoing and incoming frames (Canvas2D, CPU) | The project's 2D comp canvas (`scene.js` runtime) |
| `engine/motion.js` | Eases, kinetic type, callouts, cards and data viz for the DOM/SVG overlay | A set's overlay layer |
| `engine/sfx.py` | 33 procedural sound presets (numpy, deterministic), plus a transition → sound map | Python: the score/mix step |

The demo and test bed is `projects/fx-lab/`: every transition and preset in one reel, a 1080p
bench, and a sound mixer.

---

## 1. Transitions: `engine/transitions.js`

```js
import * as TR from '/engine/transitions.js';
const fx = TR.create({ width, height });                 // scratch canvases + seeded noise caches
fx.render(cx, 'whip', A, B, e, { dir: -1 });             // A outgoing, B incoming, e = linear 0..1
// or, in a runtime, one call per frame (freezes the outgoing comp frame on a shot change):
const e = fx.composite(cx, { id: shot.id, t, incoming: glCanvas, name: plan.trans[i], dur: TR.meta[name].dur, opts });
TR.meta[name]      // { dur, kind, sfx: [[preset, anchorFraction]], use }
TR.layerMix(name, e) // { out, in } opacities for the two shots' DOM type layers
TR.matchAnchors(a, b, u) / TR.alignTransform(a, b)        // graphic match helper: a, b = { x, y, s } in px
TR.speedRamp(t, { at, dur, peak })                       // C1 time remap for speed ramps into or out of a cut
```

- **Comp canvas:** make it with `getContext('2d', { willReadFrequently: true })`. A software canvas
  is 3–10× faster for these draws on llvmpipe than the GPU-emulated default (measured: 200 tile
  draws 4 ms vs 12 ms; full-frame copy 0.75 ms vs 7.7 ms). Copy the GL canvas in with
  `cx.drawImage(gl, 0, 0, width, height)` (~5 ms).
- **Outgoing frame:** best is to render the outgoing shot live (pass `outgoing`). fx-lab does this
  because its plates are cheap. Otherwise `composite` freezes the last comp frame. `render.mjs`
  renders the frame before any chunk that starts on a shot boundary. Keep transition length
  below `settings.cutGuard` (default 1 s; ink-bleed and film-burn need 1.5).
- **Guarantees,** checked by `node projects/fx-lab/bench.mjs` at 1080p: e ≤ 0 draws exactly A and
  e ≥ 1 exactly B (endA/endB below). Alpha coverage is exact: running-average blur taps, and masks
  composited over an opaque base, so two identical flat frames stay flat through every `cover`
  and `geo` transition (flat = 0). The picture is continuous in e (jump = the largest mean change
  between neighbouring frames over 60 steps; the big ones are the cut transitions, by design).
  Pixel constants are authored at 1080p and scale with the frame.
- **Kinds:** `cover` is a pure mix of A and B. `geo` moves or warps them, still with exact
  coverage. `shade` adds shadows, dimming, paper or ink for depth. `light` adds light or colour
  on purpose (flash, dips, leaks, burns).

### Catalogue and measured cost (1080p, ms per frame, best of 3 per sample, mean / max over 24 samples)

Measured on the 4-vCPU box while other agents were rendering (load average 7–12), so these
numbers are pessimistic.

| Transition | Kind | Default | ms mean / max | Options | Sound (sfx anchor at fraction) |
|---|---|---|---|---|---|
| `cut` | cover | 0 | 0.7 / 0.8 | | `impact.soft` @0 |
| `dissolve` | cover | 0.45 s | 2.0 / 5.2 | | |
| `match-dissolve` | cover | 0.9 s | 10.1 / 19.2 | `a`, `b` anchors `{x,y,s}`, `maxZoom` | `swell.reverse` @.5 |
| `match-cut` | geo | 0.5 s | 7.0 / 14.5 | `a`, `b`, `flash` | `impact.soft` @.5 |
| `dip-black` | light | 0.8 s | 1.1 / 1.4 | `hold`, `color` | `sub.drop` @.5 |
| `dip-red` | light | 0.6 s | 4.3 / 5.1 | `hold`, `color` | `impact.boom` @.5 |
| `flash` | light | 0.22 s | 2.6 / 3.7 | `color` | `shutter` + `impact.soft` @.5 |
| `whip` | geo | 0.42 s | 13.5 / 24.6 | `dir`, `axis: 'y'`, `amount` | `whoosh.m` @.5 |
| `slide` | geo | 0.6 s | 9.5 / 24.0 | `dir`, `axis` | `whoosh.s` @.5 |
| `push` | geo | 0.42 s | 13.7 / 30.1 | `at`, `amount` | `whoosh.s` @.5 |
| `pull-back` | geo | 0.5 s | 15.2 / 37.0 | `at`, `amount` | `whoosh.s` + `swell.reverse` @.5 |
| `zoom-through` | geo | 0.55 s | 17.5 / 31.8 | `at`, `atB`, `amount` | `whoosh.l` @.5 |
| `radial-zoom` | geo | 0.36 s | 16.0 / 28.6 | `at`, `amount` | `whoosh.xs` @.5 |
| `lens-blur` | cover | 0.7 s | 17.8 / 30.4 | `radius` (frac of W), `amount` | `swell.reverse` @.5 |
| `focus-pull` | cover | 0.9 s | 17.5 / 38.9 | `radius`, `amount` | |
| `iris` | cover | 0.6 s | 16.9 / 32.3 | `at`, `feather` px | `whoosh.s` @.6 |
| `iris-black` | light | 1.0 s | 1.3 / 3.2 | `at`, `atB`, `hold` | `shutter` @.5 |
| `aperture` | light | 0.7 s | 2.4 / 9.4 | `at`, `blades`, `hold` | `shutter` @.48 |
| `shape-circle` | shade | 0.7 s | 21.4 / 38.5 | `at`, `feather` | `whoosh.s` @.5 |
| `shape-box` | shade | 0.7 s | 6.0 / 8.3 | `rect` [x,y,w,h] frac, `radius`, `inFrame` | `ui.tick` @0, `whoosh.s` @.4 |
| `linear-wipe` | cover | 0.6 s | 14.4 / 22.4 | `angle` deg, `feather` (frac of W) | `whoosh.xs` @.5 |
| `luma-wipe` | cover | 0.9 s | 17.7 / 22.6 | `source: 'A'\|'B'`, `soft`, `invert` | `swell.reverse` @.6 |
| `light-leak` | light | 0.9 s | 12.2 / 16.5 | `seed`, `amount`, `colors` | `swell.reverse` @.5, `film.flutter` @.3 |
| `film-burn` | light | 1.1 s | 23.1 / 25.6 | `seed`, `at`, `amount` | `film.burn` @0, `impact.soft` @.45 |
| `ink-bleed` | shade | 1.2 s | 27.5 / 39.7 | `seed`, `drops` [[u,v,size]] | `paper.rustle` @.1, `swell.reverse` @.6 |
| `paper-tear` | shade | 0.75 s | 15.0 / 23.9 | `seed`, `y` | `paper.tear` @.15 |
| `glitch` | geo | 0.3 s | 7.3 / 9.2 | `seed`, `rate`, `amount` | `glitch.zap` @.5 |
| `scanline` | light | 0.6 s | 8.5 / 12.5 | `seed` | `ui.scan` @0 |
| `pixel-sort` | geo | 0.7 s | 10.4 / 30.4 | `band`, `amount` | `glitch.zap` @.45, `swell.reverse` @.5 |
| `split-slide` | geo | 0.75 s | 5.6 / 8.6 | `panels`, `axis: 'x'`, `stagger`, `dir` | `whoosh.xs` ×2 |
| `grid-reveal` | cover | 0.9 s | 3.5 / 6.8 | `grid` [cols,rows], `at`, `span`, `seed` | `ui.ticks` @.1 |
| `mosaic-shatter` | shade | 0.9 s | 14.7 / 25.8 | `grid`, `at`, `seed` | `glass.shatter` @.15 |
| `parallax-slide` | shade | 0.7 s | 1.9 / 2.3 | `dir` | `whoosh.s` @.45 |
| `page-turn` | shade | 1.0 s | 6.1 / 14.4 | `radius`, `paper` | `paper.page` @.2 |
| `redact-wipe` | light | 0.9 s | 1.0 / 1.4 | `rows`, `seed`, `color` | `marker.swipe` @.15 and @.6 |
| `pass-through` | shade | 0.6 s | 11.5 / 18.3 | `dir`, `width` | `whoosh.m` @.5 |

All 36 transitions are under 40 ms per frame. At the default lengths, a transition adds 1–40 ms to
the ~250 ms frame for a few frames per cut, which is negligible against the 450 ms shot budget.
Quality knob: `TR.create({ quality: 0.5 })` halves the blur canvases.

How they're built (for anyone extending them):
- **Blur:** directional and radial blurs are two-pass running-average cascades (a comb of ~√L
  taps, then a box of the comb spacing) at half resolution, or quarter resolution above 24 px.
  That gives an exact box average with no stepping in ~2√L draws. Defocus is a Gaussian at r/3 plus a
  10-tap ring, which looks like a disc kernel.
- **Masks:** drawn at quarter or half resolution and composited with `destination-in` onto a copy
  of B over an opaque A. Noise and distance fields are generated once per seed and cached.
- **Matches:** anchors converge in log-scale. A common zoom `R^(sin(πu)/2)` plus a coverage zoom
  about the shared anchor (weighted by each image's visibility) keeps both frames covering the
  screen, with no picture-in-picture edge.

## 2. Motion graphics: `engine/motion.js`

```js
import * as M from '/engine/motion.js';
const st = M.stage(layer);                 // 1920x1080-unit stage in the set's overlay layer (scales to render size)
M.text.maskUp(st, { text: 'The Seeing Stone', at: M.wt(shot, 'seeing'), x: 150, y: 330, size: 132 });
// update(t, p) { st.update(t); }          // every preset is a pure function of shot time t
```

Every preset takes `at` (start) and optional `out` (exit start) and `outDur`. Coordinates are 1080p
px with an `anchor` of `'tl'|'tr'|'bl'|'br'|'c'`. Styles come from the house tokens `M.F` (SERIF,
ITALIC, MONO, MONO_DIM, NUM) and `M.C` (PAPER, RED, …). Word timing: `M.wt(shot, word, nth)` and
`M.wordTimes(shot, text)`, which aligns every displayed word to the narration in order.

| Group | Presets |
|---|---|
| **Eases** `M.E` | `linear smooth smoother`, `in/out/inOut` × `Quad Cubic Quart Quint Sine Expo Circ Back`, `back(s)`, `spring` / `springSoft` / `springTight`, `emphasized decel accel editorial css` (cubic-bezier), `bezier(x1,y1,x2,y2)`, `springT({zeta,freq,v0})` (closed form, seconds), `spring({zeta,bounces})` (normalised), `steps(n)`. Helpers: `seg`, `life`, `bell`, `onTwos(t, 12)`, `range`, `smoothstep`, `rng`, `hash`. |
| **Text** `M.text` | `splitWords({text, times})`, `perChar({from: 'below'\|'fade'\|'scale'\|'track'})`, `maskUp({lines})`, `typewriter({cps, caret})`, `scramble({dur, glyphs, seed})`, `counter({from, to, prefix, suffix, decimals})` (odometer columns), `slam({text, source})` (+ `.impact(t)`), `strike({el\|text})`, `highlight({text})`, `redact({lines, mode: 'reveal'\|'cover', words, paper})` |
| **Callouts** `M.callout` | `doc({x, y, rx, ry, label, sub, lx, ly})` (marker loop → leader → label), `route({points, dur, label, endLabel, march})`, `arrow({from, to, bend})`, `bracket({x, y0, y1, label, sub, side})` |
| **Cards** `M.card` | `caption({meta, line, corner})` (the lower-third replacement), `quote({text, times, by, variant, red})`, `chapter({num, title, variant: 'numeral'\|'rule'\|'index'\|'split', chapters})`, `timeline({from, to, events: [{year, label, at}]})` |
| **Data** `M.data` | `barRace({series, keys, highlight, top})`, `line({data, box, label, format, xLabels})`, `pie({values, labels, highlight, inner})`, `waffle({total, value, cols})`, `bigNumber({value, suffix, ratio, unitLabel, label, source})` |

Cost: DOM and SVG updates are ~0.1–1 ms per preset per frame. The stage adds no GL work.

## 3. Sound design: `engine/sfx.py`

```python
import sfx                                        # sys.path.insert(0, 'engine')
sig, anchor = sfx.render('whoosh.m', seed=3)      # float32 (n, 2) @ 48 kHz; anchor = the hit/peak in seconds
sfx.place(L, R, sig, anchor, at=12.4, gain=0.8)   # the anchor lands at 12.4 s
sfx.for_transition('whip', start=12.2, dur=0.42)  # [{name, at, gain, seed}] sized to the move
sfx.mix_cues(cues, total_seconds)                 # render a cue list to a stereo array
```
CLI: `python3 engine/sfx.py --list`, `--render-all out_dir` (WAV + spectrogram/envelope PNG per
preset, `sfx-sheet.png`, `report.json`), `python3 engine/sfx.py whoosh.l out.wav --seed 2 --param dur=1.4`.

Presets: `whoosh.xs/s/m/l/xl` (0.28–1.8 s Doppler arcs with pan sweep), `riser`, `sub.drop`,
`impact.soft/hit/boom`, `tape.stop`, `swell.reverse`, `ui.tick`, `ui.ticks`, `ui.scan`,
`type.click` (`kind: key|space|bell`), `type.run` (matches `text.typewriter`), `paper.rustle`,
`paper.page`, `paper.tear`, `shutter`, `glitch.zap`, `heartbeat`, `clock.tick`, `stinger` (key,
mood), `room.tone`, `city.amb`, `wind.amb`, `film.flutter`, `film.burn`, `glass.shatter`,
`marker.swipe`. All 33 render in ~5 s total. Every preset has raised-cosine fades, no DC, and peak
gain-staging per preset (`LEVEL`). The analysis (`click` = largest sample jump relative to local
RMS) flags discontinuities; crackle-based presets score high by design. Impact tails decay to
silence before they are cut, which fixed the truncation clicks visible in the first spectrograms.

### Hook needed in `engine/score.py` (owned by the renderer; not edited here)
Add one cue type that defers to this library, placed by anchor:
```python
sys.path.insert(0, os.path.dirname(__file__)); import sfx
def sfx_cue(c):  # {"type": "sfx", "name": "whoosh.m", "shot", "at" | "word", "seed"?, "params"?, "gain"?, "pan"?}
    sig, anchor = sfx.render(c["name"], seed=c.get("seed", 0), **c.get("params", {}))
    return sig, anchor
# in the cue loop, for c["type"] == "sfx": at = shots[c["shot"]]["start"] + c.get("at", 0)
#   sfx.place(L, R, sig, anchor, at, c.get("gain", 0.5), c.get("pan", 0.0))   # SR is 48 kHz in both
# and, to sound every planned transition automatically, accept cfg["transitions"] = [{"shot", "name", "dur"}]:
#   for tr in cfg.get("transitions", []): for q in sfx.for_transition(tr["name"], shots[tr["shot"]]["start"], tr["dur"]): place q
```
Until then, `projects/fx-lab/mix.py` shows the same thing as a post-mix onto a render.

## 4. fx-lab

- `node engine/render.mjs projects/fx-lab --draft` renders the 2:17 reel (35 transitions, then 18
  motion shots, with VO on two shots for word timing). Then `python3 projects/fx-lab/mix.py
  projects/fx-lab` lays 91 sfx cues → `out/fx-lab-sfx.mp4`.
- `node projects/fx-lab/bench.mjs [names] [--strips]` runs the 1080p bench (the table above) and
  5-frame strips. `python3 projects/fx-lab/tools/sheet.py out/bench out/sheet.jpg` builds the contact sheet.
- `node projects/fx-lab/tools/profile.mjs <name>` gives the per-progress cost of one transition.
- Plates are public-domain archive photos already credited in `projects/palantir/assets/archive`
  and `projects/fx-test/assets/archive/SOURCES.md`. The figures on the data cards are labelled
  illustrative.

**Deliverables:** reel `renders/fx-lab/fx-lab-reel-draft.mp4` (960×540, 12 fps, 2:17, with VO,
drone and sfx), contact sheet `renders/fx-lab/contact-sheet.jpg` (every shot, mid-transition or late
in each motion shot), 1080p transition strips `projects/fx-lab/deliver/transitions-{a,b,c}.jpg`,
sound spectrograms `projects/fx-lab/deliver/sfx-spectrograms.jpg`.
