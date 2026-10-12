# Masters: a craft library our engine can execute

What the great directors, cinematographers and animation studios do, distilled into rules that map
onto `engine/` features. Every master file has the same sections: principles, signature
techniques, tension and scale, sound and silence, how they cut, colour philosophy, **how we
execute this in our engine**, and sources. Claims are tagged **[cited]** (the listed source says
it), **[analysis]** (our reading of the films) or **[house]** (our rule).

**Start with [`rules.md`](rules.md)**: the 100 prioritised rules for a world-class documentary frame
and sequence, each mapped to an engine feature. The `shot-design` and `make-video` skills should
read it before planning shots.

## Index

**Directors**
| File | One line |
|---|---|
| [nolan.md](nolan.md) | Real material first; IMAX scale; time as structure (Shepard tone, ticking clock); colour as point of view. |
| [villeneuve.md](villeneuve.md) | Stillness then a burst; operatic silence; monoliths and tokens on a board; desert daylight. |
| [ridley-scott.md](ridley-scott.md) | Draw it first (Ridleygrams); atmosphere is depth; many cameras. |
| [fincher.md](fincher.md) | The camera moves only when the subject moves; push in when power shifts. |
| [spielberg.md](spielberg.md) | The disguised oner; the Spielberg face; reveal grammar (watcher → thing → wide). |
| [kubrick.md](kubrick.md) | One-point perspective and symmetry; real light (f/0.7); the graphic match cut. |
| [wes-anderson.md](wes-anderson.md) | Planimetric framing; palettes; whip-pan punctuation; aspect ratio as period. |
| [cuaron.md](cuaron.md) | The long take as immersion; environment weighs as much as character. |
| [michael-mann.md](michael-mann.md) | Night is navy and sodium; fill as key; the lone professional against the city. |
| [edgar-wright.md](edgar-wright.md) | Match cuts, whips, a sound on every cut; rhythm as tension. |

**Cinematographers**
| File | One line |
|---|---|
| [deakins.md](deakins.md) | Motivated light; silhouette; the technique must disappear. |
| [van-hoytema.md](van-hoytema.md) | Large-format daylight; documentary reflexes. Main reference for `bright-day`. |
| [lubezki.md](lubezki.md) | Natural light only; wide and close; floating presence. Reference for `golden-hour`. |
| [greig-fraser.md](greig-fraser.md) | Hard light and open shade in the desert; looks motivated by the world. |
| [kaminski.md](kaminski.md) | Shutter and bleach bypass as meaning; blown light as wonder. |

**Animation and motion design**
| File | One line |
|---|---|
| [pixar.md](pixar.md) | Story spine; colour scripts; staging and appeal. |
| [spider-verse.md](spider-verse.md) | Frame rate as expression (twos); halftone and print texture over 3D. |
| [arcane-fortiche.md](arcane-fortiche.md) | Painterly 3D: reject photoreal's last 10%, add the human hand. |
| [ghibli.md](ghibli.md) | *Ma*: the deliberate pause that makes tension grow. |
| [kurzgesagt.md](kurzgesagt.md) | Saturated but value-controlled colour; flat depth; one idea per frame. |
| [apple-buck-manvsmachine.md](apple-buck-manvsmachine.md) | Premium clarity: one object, long eases, type on the beat. |
| [disney-12-principles.md](disney-12-principles.md) | The twelve principles applied to camera and graphics, with engine calls. |

**Big YouTube**: [youtube.md](youtube.md) links to `docs/library/video-autopsies/` and
`docs/research/channel-breakdowns.md` and adds only what was missing: Johnny Harris's paper-map
texture, Vox's motion typography and highlighter, PolyMatter's map language.

## The look system (engine/looks.js + engine/grade/)

Five presets: `bright-day` (episode 3), `golden-hour`, `blue-hour`, `noir-sodium` (the old house
default, Palantir), `archive-warm`. Each preset carries a procedurally generated 3D LUT, finish
parameters, a world-kit sky/sun/exposure preset, an imagery preset and a graphics palette.
Rules for bright mode: `docs/style-bible.md` "Bright mode".

```js
import * as LK from '/engine/looks.js';          // node or browser, no dependencies
LK.names()                    // ['bright-day', 'golden-hour', 'blue-hour', 'noir-sodium', 'archive-warm']
LK.get('bright-day')          // { label, intent, grade, finish, tod, imagery, palette }
LK.palette('bright-day')      // { bg, paper, ink, inkSoft, accent, sea, seaDeep, sand, sky, land, water, shallow, grid, plate, plateInk, shadow, sun, navy }
LK.tod('bright-day', W.TOD)   // full tod object: world.setState({ t, tod }) (W.todMix works on it too)
LK.imagery('bright-day')      // { haze, grade }: IM.terrain(scene, place, { ...LK.imagery(look) })
LK.finish('bright-day')       // { grain, halation, halationAmount, bloom, vignette, halationTint }
LK.gradePixel(r, g, b, look)  // display sRGB in/out; the exact maths in the .cube
LK.cube(look, N)              // .cube text;  LK.lutFile(look) -> 'engine/grade/<look>.cube'
```
CLI: `node engine/looks.js write` (regenerates `engine/grade/*.cube`, 33³), `node engine/looks.js
swatch bright-day` (reference colours through the grade), `node engine/looks.js apply in.jpg out.jpg
bright-day` (LUT + finish on a still, exactly as the finish will do it).

Node side, `engine/grade/finish.mjs`: `lutFilter(look, quality)`, `finishParams(look, project.finish)`,
`lookFinish({ W, H, look, fin, seed, lutQuality })` (render.mjs's fast chain with the LUT in front and a
per-look halation tint), `gradeStill(in, out, look)`.

How the grade is built (documented curves, `engine/looks.js`): white balance and exposure in linear
light → C1 power S-curve (contrast at a pivot, toe and shoulder reaching 0/1 with zero slope) on a
hue-preserving norm mixed with a little per-channel curve → Oklab shaping: global saturation +
vibrance, per-hue bands (sat, hue shift, pull to a centre for the skin line, lightness), split
toning by lightness, saturation roll-off in shadows and highlights, a soft gamut ceiling that stops
boosts before the sRGB edge → black floor and white ceiling.

Usage rules: one look per sequence; light the scene for the look (`LK.tod`), because a LUT cannot
turn night into day; feed footage neutral (`FT.footage(..., { grade: 'none' })`) and imagery with
`LK.imagery(look)` so every source lands in the same colour world; graphics take colours only from
`LK.palette(look)`.

## Engine hooks (files this library does not own)

**1. render.mjs finish hook (`settings.look = 'bright-day'`).** A ready patch is at
`engine/grade/render-look.patch` (`git apply engine/grade/render-look.patch`; verified end to end on
`projects/look-lab` through a patched copy). The change:
```js
import * as LK from './looks.js';
import { lookFinish, finishParams } from './grade/finish.mjs';
// settings.look is the finish chain ('fast' | 'reference') or a look preset
const LOOK0 = String(flag('look') ?? settings.look ?? 'fast');
const GRADE = LK.names().includes(LOOK0) ? LOOK0 : (settings.grade ?? null);
const LOOK = LK.names().includes(LOOK0) ? 'fast' : LOOK0;
// look defaults, overridden by an explicit project.finish
const FIN = GRADE ? finishParams(GRADE, finish) : { /* unchanged defaults */ };
const finishBody = (seed) => LOOK === 'reference' ? referenceChain(seed)
  : GRADE ? lookFinish({ W, H, look: GRADE, fin: FIN, seed, lutQuality: settings.lutQuality ?? 'high' }) : fastChain(seed);
// chunk cache: add ...walk(path.join(ROOT, 'engine', 'grade')) to engineFiles and grade: GRADE to the key JSON;
// pass --look=${LOOK0} to workers.
```
The filter in front of the existing chain is
`scale=in_color_matrix=bt601:in_range=full:out_range=full,format=gbrp,lut3d=file='engine/grade/bright-day.cube':interp=tetrahedral,scale=out_color_matrix=bt601:in_range=full:out_range=full,format=yuvj420p`.
Cost (1080p, 4 vCPU, measured on 240 frames): the finish without a LUT is ~22 CPU-ms/frame; with
the 33³ tetrahedral LUT ~84 (LUT ~49 + two colour conversions ~14); `settings.lutQuality: 'fast'`
(65³ nearest, cached in `.cache/grade/`) is ~50. That is roughly +8% on a 60 fps episode's total
render time. Projects that set `finish` explicitly keep those numbers; delete `finish` to inherit
the look's daylight finish.

**2. World kit: `W.create({ tod })` with a look.** `World` reads `TOD[opts.tod]` (a name only), so
pass the look per frame: `world.setState({ t, tod: LK.tod('bright-day', W.TOD) })` (works today, used
in `projects/look-lab`). One-line hook for `engine/world/world.js` constructor:
`this.tod = typeof opts.tod === 'object' ? opts.tod : TOD[opts.tod ?? 'blue'];`.

**3. Engine gaps found while distilling (not built here):**
- A Shepard-tone riser preset in `engine/sfx.py` (rules 28/29; Nolan): stacked octave-spaced sines under a
  bell-shaped spectral envelope, each gliding up one octave over the cycle.
- A "muffled hearing" mix move (low-pass bed + VO for 1–3 s; rules 69, kaminski.md).
- A CC0 paper texture in `assets/` for map sets (youtube.md, rule 58); look-lab uses procedural grain.
- World-kit ground albedo: Denver's plains render as flat brown at distance; bright-mode aerial
  perspective helps (rule 50), but a real Sentinel-2 ground (engine/imagery) is the real fix for a
  Hormuz coastline.

## Look lab
`projects/look-lab`: the same 6 test frames (NAIP aerial, PD Navy ship footage, world-kit city,
Hormuz map from Natural Earth, a title card, a chart) under every look.
```
node engine/footage.js prep projects/look-lab
node engine/render.mjs projects/look-lab --stills=0.5      # LOOKS=bright-day to render one look
node projects/look-lab/lab.mjs                              # grades through engine/grade/finish.mjs
```
Sheets: `renders/look-lab/looks-sheet.jpg` (6 frames × 5 looks), `bright-day-before-after.jpg`
(old finish without LUT vs bright-day), `bright-day-contact.jpg` (the episode-3 look, 3 × 2).
