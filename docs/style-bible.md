# Style bible, v0.1

Source of taste: Pinterest board `bendikoliver/taste` (25 of 29 pins analysed).

## What the board says

- **It's photography, not graphic design.** There's almost no type on the board; the one exception
  is an editorial poster with a big numeral and tiny corner caption.
- **Four light languages:**
  1. *Fluorescent night*: Wong Kar-wai and Christopher Doyle green and cyan; lone figures in bars,
     alleys and grocery aisles.
  2. *Direct flash at night*: harsh on-camera flash, a black background, an absurd subject played
     deadpan (the tiger with a katana, Gandalf with cash).
  3. *1967 photojournalism*: faded slide film, Vietnam-era helicopter and river-boat shots.
  4. *Tropical documentary*: saturated turquoise and green, men at work in nature.
- **Theme:** the stoic operator, calm inside chaos. Kitano, Limitless, the trading desk.

## Rules

**Light**
- Every scene has one motivated key light (work lamp, sodium pole, fluorescent tube, headlight,
  flash). Darkness is the default; light is the event.
- Allowed palettes: *sodium* `#ffa860` on blue-black, *fluorescent* `#58ffa0` on green-black,
  *work light* `#fff0dc` on pure black. Red `#e0241b` is reserved for annotation.

**Camera**
- Default: slow eased dolly or orbit with a little handheld (`K.handheld`, 0.02–0.15 amplitude).
- Gear change for emotion: step-printing (`step: 3`, `trails: 0.4`) for memory, a person, or
  intoxication.
- Cuts land on sound: a clunk, a boom or a clang. Use 1–2 flash frames on a hard tonal shift.

**Type**
- *Instrument Serif* for names, numbers and titles: big, quiet, editorial.
- *IBM Plex Mono* in tracked caps for metadata: dates, figure numbers, sources.
- *Archivo Narrow Bold* only for red chapter numerals and counters.
- Show a source line whenever a number appears.
- Never centre a caption in the lower third. Use corners and edges, like a magazine.

**Annotation**
- Red marker loops and leader lines are tracked to 3D objects, drawn on (never faded), with
  rough edges (`#marker` filter).

**Finish**
- Halation 18 at 0.5, bloom 0.16, grain 9, vignette 0.55. Blacks stay black.

**Sound**
- A drone in the episode's key under everything, ducked by the VO. Sound design is motivated:
  lamps clunk, water laps, horns echo, fluorescents hum. Title cards drop the drone and hit.

## Never
- Stock-looking AI imagery or realistic CG humans.
- Gradients on type, neon glow on text, or whooshing 3D titles.
- More than one accent colour.
- Captions that repeat what the VO is already saying word for word.

---

# Bright mode (v0.2, episode 3 onward)

The rules above describe our night language (*fluorescent night*, sodium, darkness as the
default). Bright mode is the day language, born from the board's fourth light, *tropical
documentary* (saturated turquoise and green, men at work in nature), and from daylight cinema:
Nolan and van Hoytema's IMAX daylight (*Interstellar*'s cornfields, *Dunkirk*'s beach and sea),
Villeneuve and Fraser's *Dune* desert day, Apple keynote clarity and Kurzgesagt colour. Sunlit,
open, saturated but tasteful. **It must never look cheap or garish.** Sources and reasoning:
`docs/masters/` (van-hoytema.md, greig-fraser.md, nolan.md, kurzgesagt.md,
apple-buck-manvsmachine.md); the 100 rules in `docs/masters/rules.md`.

The look is executable: `settings.look = 'bright-day'` (LUT + daylight finish),
`LK.tod('bright-day', W.TOD)` (sky, sun, exposure), `LK.imagery('bright-day')` (aerials),
`LK.palette('bright-day')` (graphics). See `engine/looks.js`. Test frames:
`renders/look-lab/bright-day-contact.jpg`, `bright-day-before-after.jpg`, `looks-sheet.jpg`.

**Palette** (`LK.palette('bright-day')`)
| Role | Hex | Use |
|---|---|---|
| Sea turquoise | `#17a3a6` | the hero colour: shallows, the strait, chart fills |
| Deep sea | `#0b6f86` | offshore water, chart lines, depth gradients |
| Map water / shallows | `#78b6bb` / `#bfe3df` | map water and the pale coastal shelf |
| Sand | `#e6cf9f` | desert, highlighter under text, secondary fills |
| Land (paper) | `#ece3d1` | map land, with 3–5% paper grain |
| Sun white (paper) | `#fbf8f2` / bg `#f4efe6` | title and chart grounds; never pure `#ffffff` |
| Sky | `#9cc7ea` | sky bands in graphics |
| Deep navy (type) | `#0f1e33` | all type on light grounds; silhouettes; icons |
| Navy soft | `#46536a` | secondary type, axes, coastlines |
| Signal red | `#e0241b` | annotation only, unchanged from night mode |
Max three palette colours plus red in any graphic frame.

**Key light**
- **Hard sun 30–45° above the horizon** (`tod.sunEl` 36), placed as a cross light or a 3/4
  back light to the camera (`sunAz` 250 in the look-lab set-up), never flat behind the camera.
  Long shadows give form; midday top light (> 60°) flattens everything.
- **Sky fill:** shadows are open and slightly blue (`tod.ambSky` `#7fa2cf` ×0.75; LUT
  `shadowTint`). No black shade in daylight.
- **Bounce:** warm ground bounce from sand and concrete (`tod.ambGround` `#8d7a5e` ×0.5).
- Key-to-fill about 4:1 in the scene (sun `#fff0dc` ×4.4 against the sky fill).
- Sun warm-white, not orange; orange belongs to `golden-hour`.

**Contrast and black level** (measured on the look-lab frames after the full finish)
- Black floor 0.012 (≈ 3/255): rich, never milky, never crushed. Darkest 1% of a daylight frame
  sits around 25–65/255 (ship 26, aerial 65); if it falls below ~15, the shot is lit wrong.
- Mid grey holds: 18% grey `#767676` → `#7c7b7a` (+0.08 stop exposure in the LUT).
- White ceiling 0.988 and a soft shoulder: keep cloud and sky detail; never clip a sky.
- Curve: C1 power S-curve, contrast 1.16 at pivot 0.43, on a hue-preserving norm (22% per-channel).

**Saturation limits**
- Global saturation 1.05 with **vibrance** 0.22: low-chroma colours (haze, concrete, pale sky)
  gain colour; already-strong colours barely move.
- **Soft gamut ceiling at 0.9** of the sRGB edge: a boost approaches it asymptotically. Nothing
  reaches the neon edge; colours already that saturated (signal red) are not pulled back.
- Saturation rolls off in deep shadows (×0.86) and top highlights (×0.7), as film does.
- Foliage pushed toward olive (−9° hue, ×0.8) and magenta pulled out (×0.78). Video-game green
  and purple are the two fastest ways to look cheap.

**Skin and sea safety**
- **Skin line:** hues 45–70° (Oklab) are gathered toward 58° (`pull` 0.35) with saturation ×0.94.
  `#c58c6b` → `#d59469`: brighter and sunlit, not orange. Check every frame with people.
- **Sea:** cyan-green water (≈172°) is turned to turquoise (+11°); turquoise (≈198°) gains ×1.12;
  deep ocean blue (≈262°) gains ×1.12 and goes slightly darker, so open sea reads ink-blue, not
  slate. `#2aa6a8` → `#2cadb3`, `#3fb5a0` → `#3abeb3`. Sea is never green and never grey.
- **Sky:** deeper and clean (−0.012 L), nudged away from violet (−3°). `#7fb0e0` → `#6fb6ec`.
- **Sand:** golden, not lemon (−5°, ×0.95). `#d9c08a` → `#efc98e`.

**Typography on bright backgrounds**
- On light grounds (paper, maps, charts): **navy type** (`#0f1e33`), secondary `#46536a`. The
  house fonts are unchanged (Instrument Serif, IBM Plex Mono caps, Archivo Narrow numerals in red).
- On pictures (sea, sky, aerials): light type (`#fbf8f2`) on a **shadow plate**: a soft radial
  gradient of `rgba(8,20,38,0.58)` from the corner the type sits in, plus a 18 px navy text
  shadow at 35%. Never naked white type on a bright sky; never a hard box.
- Highlighter under a spoken phrase: sand at ~70% under navy text.
- Route lines on maps: red 4 px with a 9 px land-coloured halo so they read over water.

**Atmosphere (keep it, even at noon)**
- **Aerial perspective:** distant land goes blue-grey, not brown (`tod.hazeDen` 0.00006, haze
  `#a9c3df`, low Mie 0.0022 so the air reads clear). Real distance is the cheapest premium cue.
- Light haze and soft clouds (coverage ~0.3) give the sky scale.
- Sea glitter and a soft halation in highlights; contre-jour shots allowed (flare 0.35).
- Daylight finish: grain 5, halation 10 at 0.2 with a warm-white tint (`[1, 0.66, 0.46]`),
  bloom 0.09, vignette 0.26. Less vignette, softer halation than night.

**Bright-mode never list**
- Pure white `#ffffff` grounds or pure black type: use paper and navy.
- Teal-and-orange push, neon cyan, lime green, purple skies.
- Clipped skies, crushed black shadows in daylight, flat noon top light.
- Mixing bright-day and noir-sodium inside one sequence (change look only on a story turn).
