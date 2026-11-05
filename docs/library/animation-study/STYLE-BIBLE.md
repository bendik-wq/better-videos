# MAINSPRING animated: the "Paper & Spring" style bible (v1.1, ep10 onward)

The look for our fully animated explainers. It aims at the clarity and charm of Kurzgesagt, TED-Ed
and OverSimplified, but **it looks like none of them, and like none of their nearest neighbours**
(§0). It grows out of the MAINSPRING brand ("the hidden machinery behind the world",
`brand/BRAND.md`): every subject is a machine you can **open, wind and watch run**.

**One sentence:** a paper model of the world on a drafting table. Each part is cut from printed
card, outlined with a thin navy pen, shaded with halftone dots instead of gradients, and hinged so
the camera can open the case and show the **brass mechanism** inside. It moves in small,
satisfying *ticks*, like a clock.

**What changed in v1.1.** We rendered style frames with our own engine (`projects/paper-lab`) and ran a
feed, moiré and compression test (§19). Those results changed:
- the thumbnail ground: coloured, not paper (§15);
- the saturation and luma targets (§1.3);
- the paper-fibre and hairline specs (§3, §4);
- the halftone-under-zoom rule (§4.1);
- the Winder's head, which is now a dial with one gaze hand (§6.1).

We also:
- widened the distinctness test to the nearest neighbours (§0);
- fixed the factual and rule errors in RC-2, RC-3 and RC-4 (§16);
- added a history module (§20), vertical and Shorts rules (§21), retention grammar (§22) and a
  production budget (§23);
- prioritised the build list (§17);
- corrected engine names.

Read this with:
- `brand/BRAND.md`: palette, type, the coil mark, thumbnail rules. This file extends them and never
  overrides them.
- `docs/library/bright-style/STYLE.md`: the 3D clay and map house blend. Paper & Spring is its 2D
  flat-card sibling. **§5.1** says how the two mix.
- `docs/style-bible.md`, Bright mode v0.2: its type and annotation rules still apply.
- `docs/library/animation-study/README.md` and the per-channel files: the evidence this look is
  built on. `docs/library/video-autopsies/kurzgesagt.md` covers structure.
- `engine/motion.js` (easings `E`, `seg`, `life`, `onTwos`, `wt`, `rng`, `hash`), `engine/camera.js`
  (`breathe`), `engine/transitions.js`, `engine/sfx.py` (`PRESETS`), `engine/score.py` (cue types).
- `projects/paper-lab/`: the proof frames and the first working versions of the paper helpers
  (`scene.js`), plus the checks (`check.py`). Outputs go to `renders/paper-lab/`.

**Labels.**
- **[rule]**: binding for every animated episode.
- **[default]**: do this unless a shot has a reason not to.
- **[spec]**: exact numbers for the engine.
- **[measured]**: tested in the paper lab (§19).
- **[hypothesis]**: a choice we believe in but have no outlier data for yet. Each one names the
  test that would settle it (mostly in §15.4 and §23.4).
- **[proto]**: exists as a prototype in `projects/paper-lab/scene.js`, still to be promoted into
  the engine.
- **[new]**: doesn't exist yet. Every [proto] and [new] item is in the prioritised build list in
  **§17**.

**Units.** Frames are at **30 fps**, the engine default (`render.mjs` `fps`), so 1 f = 33.3 ms. The
layout is in 1920×1080 stage units. Character animation runs **on twos (15 fps)**; camera, type and
data run **on ones (30 fps)**.

**Binding status.** The rules marked [measured] are binding now. Everything else is binding for
ep10's animatic and gets re-checked against the ep10 draft render (§19.6) before the master.

---

## 0. What we learned from the study, and what we refuse to copy

### 0.1 The three references
| Reference | What makes it work | What we take (principle) | What we never take (signature) |
|---|---|---|---|
| **Kurzgesagt** | One idea per frame; saturated colour that stays value-controlled; flat depth in 3–5 layers; constant small motion; scale ladders with a human-unit comparison on each rung; opinion labelled as opinion (`kurzgesagt.md` §3, §6) | Value-planned layers, one idea per frame, scale ladders, "everything breathes", labelled opinion | Its bird characters and any round-bodied bird or animal mascot; **no-outline vector on dark navy or purple**; luminous cyan, magenta, purple or gold glows; soft gradient light cones; radial "glow" planets; its title-card layout; its heavy white thumbnail caps on a dark ground |
| **TED-Ed** | A different studio's hand on every lesson; strong single metaphors; often textured, handmade surfaces; riddles framed as a question to the viewer (`ted-ed.md` §3, §4) | One governing metaphor per video; "you are the one solving it" framing | Its logo, its red title bumper, its lesson and quiz framing, any specific animator's or studio's style |
| **OverSimplified** | Comedy timing; history told as characters with wants; maps as a game board; running gags; fast reaction cuts [observed] (`oversimplified.md` §3, §6) | Characters with wants; maps you play on; comic timing in held reaction frames | **Thick black-outlined cartoon people with big round heads**; voiced characters; its parchment game-map look; catchphrases and meme insertions; its intro sting; `[Event] - … (Part N)` naming |

### 0.2 The nearest neighbours (new in v1.1)
Three of our original five "tells" (paper ground, pen line, texture) are shared with other channels.
These are the looks a frame of ours could be mistaken for, so the test must clear them too.

| Neighbour | Its traits (evidence) | Where we overlap | What must separate us |
|---|---|---|---|
| **MinuteEarth / MinutePhysics** | White or paper background with line art; stick figures and animals with **expressive faces**; a diagram drawn on screen; lots of white space (`minuteearth-minutephysics.md` §3, §6 [observed + recall]; process from *How We Make MinuteEarth Videos*, rosetta.to) | Light ground, line art, diagrams drawn on | **Filled, printed card** (never bare line on white); **brass mechanism**; halftone shade; off-register fill; faceless characters (our dial head, §6.1); no hand-drawn marker strokes; no white ground (`#f7f6f1` paper only) |
| **TED-Ed paper cut-out and textured lessons** | Per-lesson styles that include paper cut-out, clay, ink and painted textures; the brand is the format, not the look (`ted-ed.md` §3 [observed: 9 thumbnails]; Animafest 2016 and Cartoon Brew/Buzzco on the many-studios model) | Paper cut-out, deckle edges, texture | The **mechanism and brass parts** (a TED-Ed cut-out lesson has paper, not clockwork); the **one red thing**; navy pen line printed off-register; the **counter wheel and tick motion**; the coil compass on every map |
| **Generic riso and halftone explainers** (editorial illustration, motion-template "risograph" packs, stock explainer studios) | Two- or three-ink riso palettes (often fluoro pink plus blue), grain and misregistration as decoration | Halftone, misregistration, grain | **No fluoro inks** (banned hues, §1.3); misregistration is **one fixed vector per episode**, not random jitter; halftone is used **only for form shade under the one top-left lamp**, never as a flat decorative fill; mechanism and brass are always present |

### 0.3 The distinctness test [rule]
Before a frame ships, hold it next to a frame from each of the **six** looks: Kurzgesagt,
TED-Ed (including a paper cut-out lesson), OverSimplified, MinuteEarth/MinutePhysics, and a
generic riso explainer. If someone who watches them all would guess the wrong channel, redraw it.

**The tells.**

**Mandatory**: every frame has both:
1. **A visible mechanism with brass parts** (`#b98a3e` family): a gear, spring, key, hinge,
   escapement, counter wheel or cutaway, in the frame **or in the one before it**. The Winder's key
   counts.
2. **Exactly one red thing** (`#e0241b`), shape-coded (§1.5).

**At least two of the three print tells:**
3. Paper ground (`#f7f6f1`), or a rationed coloured or night ground (§1.4). It is never white and
   never dark navy with glow.
4. A thin navy pen line, printed off-register from its fill (§3).
5. Halftone dots or hatching for shade under the top-left lamp (§4–5), never soft gradients.

Why the change: in v1.0 a frame with paper, a pen line and texture passed but could still read as
MinuteEarth or a paper-cut TED-Ed lesson. The two mandatory tells are the parts nobody else owns.

**Never, under any circumstances [rule]:**
- trace, rotoscope or recolour a frame from any channel;
- use any creator's character, mascot, name, logo, palette signature (Kurzgesagt's purple, cyan
  and gold on navy; riso fluoro pink), title-card layout, music, voice or footage;
- reference their mascots in a gag;
- name our characters after theirs;
- copy a recurring gag.

---

## 1. Palette (with hex)

### 1.1 Core: the five brand colours (unchanged from `brand/BRAND.md`)

| Token | Hex | Role | Contrast on paper (WCAG) |
|---|---|---|---|
| `paper` | `#f7f6f1` | The ground. Every body frame starts here | — |
| `ink` | `#14233d` | Pen line, all type, institutions, silhouettes | **14.5:1** (all text) |
| `teal` | `#2a8c86` | Hero hue: water, flows, "the system working", the Winder's body | 3.7:1 (large type ≥ 48 px only) |
| `sage` | `#a9c5ae` | Secondary fills: land, nature, calm, background planes | 1.7:1 (fill only, never text) |
| `red` | `#e0241b` | **One red thing per frame**: the hidden part, the failure, the number | 4.4:1 (numerals ≥ 36 px) |

### 1.2 Extended ramps [spec] (three values per hue, so every object has light, mid and shade)

| Hue | Light | Mid | Shade | Use |
|---|---|---|---|---|
| Paper | `#f7f6f1` | `#ebe8de` (card) | `#dcd7c8` (kraft) | Ground, card faces, back planes, table |
| Ink | `#8a93a3` (ink-40: hairlines, grid) | `#3d4a60` (ink-70: secondary type, 8.3:1) | `#14233d` | Lines, type, shadows (as a multiply) |
| Teal | `#8cc5bf` | `#2a8c86` | `#1d6662` | Water, flows, the Winder; deep teal for type on paper (6.2:1) and the **thumbnail ground** (§15) |
| Sage | `#d3e2d5` | `#a9c5ae` | `#6f9a7a` | Land, foliage, crowds at rest |
| Brass | `#e3cc98` | `#b98a3e` | `#7d5a22` | **Mechanism parts** (gears, springs, keys, hinges, coins); flames as paper cut-outs (§20); data series D3 (§1.6) |
| Red | `#f4b3ad` (highlight under text only) | `#e0241b` | `#9e1a14` | The one red thing, plus its own shade |
| Night | `#22355a` | `#14233d` | `#0b1426` | Night plates only (§1.4) |

**Brass vs. other channels' gold:** our brass is a muted, low-chroma ochre (`#b98a3e`, S≈0.66,
V≈0.73). It only appears as metal, as paper flame or as a data series, always on card or paper. It
is never a glow, a star, a light source or a highlight colour.

### 1.3 Ratios per frame
- [rule] 60–75 % paper family, 10–20 % one hue family (teal *or* sage), 5–12 % ink, ≤ 8 % brass,
  **≤ 3 % red**.
- [rule] At most paper + ink + two hue families + brass + red in a frame.
- [measured] **Targets, measured on our own frames.** v1.0 asked for mean luma 0.70–0.85 and mean
  HSV saturation 0.18–0.30. The paper-lab body frames that otherwise follow every rule measure
  **L 0.85–0.91 and S 0.07–0.13** (`renders/paper-lab/report.json`: sf-case 0.90 / 0.09, sf-front
  0.85 / 0.13, sf-acting 0.91 / 0.07). The v1.0 range was wrong for this look. **New body-frame
  QA band: L 0.80–0.92, S 0.06–0.20.** Kurzgesagt's S ≈ 0.67 comes from `kurzgesagt.md`.
- [hypothesis] **"Low saturation in the body is fine, because colour lands harder when it is rare."**
  We have no retention data for or against it. The study's outliers are mixed:
  - Kurzgesagt is saturated;
  - MinuteEarth and CGP Grey are pale and mostly white (`other-animated-outliers.md`);
  - OverSimplified is mid-saturated.

  **Test:** the ep10 retention graph against the Bright-mode documentary episodes at the same
  timestamps, and a 2-chapter A/B of the draft cut (one chapter with teal and sage raised to fill
  25 % of the frame) shown to 10 people with a "where did you get bored" probe. Until then, the
  thumbnail is where we spend saturation (§15).
- **Banned hues [rule]:**
  - violet and magenta (Oklch hue 280–345°), which includes riso fluoro pink;
  - neon cyan (S > 0.85 at V > 0.85);
  - pure `#000000` and pure `#ffffff`;
  - video-game green.

### 1.4 Night and coloured plates
A night plate is for space, night, the deep sea, the inside of a sealed machine, or the climax's
"lights out" beat. [spec]
- Ground `#14233d`, with a `#0b1426` vignette band.
- The pen line becomes `paper` at 85 %.
- Fills come from the *light* ramp values, and red stays red.

A coloured plate has a `teal-shade` `#1d6662` ground, with fills in light values and a paper pen
line. Use it for chapter cards, hook frames and the Shorts ground (§21).

[hypothesis] **The night ration.** Default: no more than **15 %** of runtime on night plates, and
never two night chapters in a row. The number has no outlier data behind it. It exists to keep us
away from Kurzgesagt's glow-on-dark.
- **Topic exception:** if the episode is mostly set at night, in space or under the sea, the ration
  rises to **35 %**. Night chapters then get a paper "daylight insert" (a drafting-table cutaway,
  map or data card) at least every 45 s.
- **Two rules hold at any ration:** no glow, and no back-lit radial gradients.

### 1.5 Colour meaning (consistent across episodes) [rule]
- **Teal = flow** (water, money moving, information, people *moving*, the system doing its job).
- **Sage = land and the settled** (land, nature, farming, crowds at rest, the status quo).
- **Brass = mechanism** (the thing that makes it run).
- **Ink = power** (institutions, states, rulers, armies, documents).
- **Red = the hidden part or the break**: the one thing the episode is about.

**Accessibility.** Red (4.4:1) and teal (3.7:1) are close in luminance on paper, so **red is always
also shape-coded**: a red element gets a notch, a dashed ring or a marker loop as well. Check every
data frame in a deuteranopia simulation.

### 1.6 Categorical data palette (more than 2–3 series) [measured]
Red is never a data series: it stays the one red thing. Series take colours in this order, and
**every series also gets its own pattern or line style**, because two pairs are weak for
colour-blind viewers.

| Series | Fill / line colour | Fill pattern (bars, areas) | Line style (line charts) | ΔE76 to nearest earlier series, normal / deutan |
|---|---|---|---|---|
| D1 | `ink` `#14233d` | solid | solid 4 px | — |
| D2 | `teal` `#2a8c86` | solid | solid 4 px + round markers | 52.6 / 40.0 (vs D1) |
| D3 | `brass` `#b98a3e` | solid | dashed 12/6 | 65.1 / 55.7 (vs D2) |
| D4 | `sage-shade` `#6f9a7a` | 45° hatch in `ink-40` | dotted 2/6 | **20.0 / 19.9 (vs D2): weak** |
| D5 | `ink-40` `#8a93a3` | halftone 30 % in `ink` | dash-dot | **9.4 deutan vs D2: fails on colour** |

Computed with a Machado deuteranopia matrix and CIELAB ΔE76.

Rules:
- [rule] **At most 5 series.** Beyond that, use small multiples or group into "other".
- [rule] D4 and D5 are **never told apart by colour alone**: the pattern and line style are part
  of the series.
- [rule] **Direct labels** (a string tag at the line end) replace legends where possible.
- [rule] Brass as a data series is the one exception to "brass = mechanism", and it's allowed only
  inside a chart instrument (§9.8).

---

## 2. Shape language

The house idea: **people are round, power is square, mechanisms have teeth.**

| Shape family | Means | How it is drawn [spec] |
|---|---|---|
| **Pill / capsule / circle** | People, life, nature, cells, coins | Corner radius = 50 % of the short side. Never a perfect circle for bodies (ratio 1 : 1.35 to 1 : 1.8) |
| **Rectangle with 4–8 px radius** | Institutions, states, companies, documents, buildings | Rigid: they **never squash or stretch** (§10.4). Height ≥ width when it holds power |
| **Teeth (gear, ratchet, saw)** | Force, danger, time pressure, extraction, **a front line** (§20) | Danger is the **ratchet tooth**: a 60°/30° asymmetric saw that only turns one way. (No spikes.) |
| **Spiral / coil** | Stored energy, compounding, the brand mark | The coil from `brand/out/logo.svg`; 3–5 turns; a red arbor at the centre when it is the hero |
| **Hinge line** | A cutaway, "this opens" | A dashed `ink-40` line with two brass knuckles (small rounded rectangles, 10×18 px) |

**Construction rules [rule]:**
- Build from primitives you could cut with scissors: no free-form blobs with more than six control
  points. Every object should be describable as a short list of shapes.
- **Deckle edge** on paper-cut elements (silhouettes, land, clouds, torn damage): a 1.5–5 px
  irregular edge from seeded noise (`M.rng`). It is fixed per object so it doesn't shimmer
  [proto: `deckle()`].
- Stroke corners and caps are round.
- **Scale:** the smallest readable part is 14 px at 1080p. Anything smaller becomes texture.
- **Silhouette first:** every hero object must read as a solid ink shape at 64×36 px (the
  thumbnail squint test, §15).

---

## 3. Line: the off-register pen [signature]

Neither no line nor a cartoon outline: a **thin navy pen line, printed slightly out of register**
with its colour fill, like a two-pass print.

[spec]
- **Stroke and weights.** Stroke `ink` `#14233d`.
  - Width **3 px** for hero objects, 2 px for secondary.
  - [measured] **Hairlines:** 1.25 px `ink-40` is for *decorative* grids and leaders only. In the
    VP9 360p pass the hairline block dropped to **SSIM 0.78** (720p: 0.95). **Any line the viewer
    must read** (a route, a front line, a chart axis that carries a value, a tag string that
    connects meaning) is **≥ 2 px**.
  - The width is constant under camera zoom (`lineWidth / camera.scale`), so the line never fattens
    into a cartoon outline.
- **Off-register offset.** The fill shifts by the episode's misregistration vector: a seeded value
  in 3–5 px at an angle of 25–45° (paper lab: (+4, +3)). It is the same for every object in every
  frame. Where the fill overhangs the line you see colour, and where it falls short you see a sliver
  of paper. That sliver is the look [proto: `pen()`].
- **Pen lifts.** The line is broken in two places on any closed shape longer than 300 px: 6–14 px
  gaps where the light hits (top-left), as a pen lifts.
- **Line jitter ("boil").** Off by default. Characters only, on twos, 0.6 px amplitude, 3 seeded
  variants cycled every 2 frames. Never on type, data or institutions.
- **No line** on back planes (layers 3–4, §5), halftone shading, water fills or type. Depth
  recedes by losing its line.

---

## 4. Texture

Our shade is print, not airbrush.

| Texture | Where | Spec |
|---|---|---|
| **Halftone dots** | Shade on any lit object, cast shadows, the dark side of planets, smoke | A 45° dot screen at **11 px pitch** (allowed band 8–18 px on screen). Dot area = shade 0–1 (`r = pitch·√(d/π)`). Colour = the object's shade value, never black. Clipped to the shape [proto: `halftone()`] |
| **Hatching** | Cutaway section faces, burned or damaged areas (§20) | 45° parallel lines, 1.25 px `ink-40` every 7 px. A hatched face means "cut here" or "this was destroyed" [proto: `hatch()`] |
| **Deckle** | Paper-cut edges | §2 |
| **Card thickness** | Paper-cut elements that stand up (§5.1 toy theatre) | A 3–5 px `kraft` edge on the side away from the light |
| **Paper fibre** | Paper ground | [measured] **Demoted to optional.** At the v1.0 spec (4 % multiply) the fibre measured a σ of **0.19 grey levels** in the master still and **0.00 after every encode** (VP9 1080p 1.2 Mb/s, AV1 0.8 Mb/s, VP9 720p and 360p). It doesn't survive delivery, so it can't carry the look. Keep it at 4 % for the master if it's free; never rely on it. The paper read comes from **deckle, card thickness, halftone and the off-register sliver**, all of which survived (§19.4) |
| **Film finish (post)** | Whole frame | Grain 2, halation off, bloom off, vignette 0.06. The texture lives in the art, not the grade |

**Never:** soft gradients for form; glow on type; lens flares; bokeh on flat art; noise that boils;
decorative halftone fills with no lamp logic (the generic riso look, §0.2).

### 4.1 Halftone under camera moves [rule, measured]
- **Moiré on downscale is not a risk at our pitches.**
  - **Test:** patches at 8, 11 and 14 px, 45°, densities 0.35 and 0.55, downscaled to 720p, 480p
    and 360p.
  - **Metric:** the low-frequency ripple left after a blur of 2 × the on-screen pitch (σ of the
    luma, as a % of the dot/fill step).
  - **Result:** with Lanczos or bilinear scaling the ripple **never rose above the 1080p baseline**
    (every value ≤ 0.50 %, baseline 0.29–0.53 %). Only nearest-neighbour scaling added beats (up to
    +0.32 pp, at 11 px / 480p). We assume YouTube's transcoder and players use filtered scaling
    [assumption]. Files: `renders/paper-lab/moire-v2.json`, `moire-p*.png`.
  - **11 px stays.**
- **Pitch under zoom.** World-fixed dots belong to the object: they scale with the camera, which
  avoids the "shower-door" effect where screen-fixed dots stay still while the art slides under them.
  So **dots are world-fixed by default**. Here is how an 11 px world pitch reads at each camera
  scale:

  | Camera scale | 0.5 | 0.7 | 1.0 | 1.3 | 2.0 | 3.0 |
  |---|---|---|---|---|---|---|
  | On-screen pitch (px) | 5.5 | 7.7 | 11 | 14.3 | 22 | 33 |

  When a shot's camera scale leaves **0.75–1.6×**, the pitch leaves the 8–18 px band. Then
  **re-screen**: generate the halftone at `11 / scale` world px and switch at a cut, or crossfade
  the two screens over 6 f during a hold. Never re-screen during a move.
- **Compression.** Halftone regions kept SSIM 0.976 (11 px) and 0.971 (8 px) at VP9 1080p 1.2 Mb/s,
  0.96 at 720p, and **0.88 at 360p**. At 360p the dots blur into a flat tint of the right value, which
  is acceptable: the shade still reads. Below 8 px nothing survives at 480p, so **8 px is the
  floor**.

---

## 5. Lighting and depth

**One lamp, top-left, forever [rule].** A drafting lamp lights the world from about 10 o'clock,
45° up.

[spec]
- **Form shade:** the side away from the lamp gets a halftone at 35–55 % density in the object's
  shade value. Spheres get a crescent halftone from 4 o'clock to 8 o'clock.
- **Cast shadow:** a **hard-edged copy of the silhouette**, offset (+10, +12) px at hero scale,
  filled `ink` at **12 % multiply**. It never blurs. Objects touching the ground get a contact
  shadow: a flat ellipse at 18 %, 120 % of the base width.
- **Highlight:** one paper-coloured stroke, 3 px, following the top-left edge inside the line, over
  20–35 % of the perimeter. No specular blobs.
- **Gradients are allowed in exactly two places:** (a) a sky or sea band as a **3-step posterised**
  ramp (three flat bands with hard edges); (b) the night-plate vignette.
- **Depth = 4 layers [spec].**

| Layer | Content | Line | Value | Parallax factor | Paper haze |
|---|---|---|---|---|---|
| 0 Foreground | Framing props, the table edge, a hand tool | 3 px | Full | 1.25 | 0 % |
| 1 Subject | The hero object or character | 3 px | Full | 1.00 | 0 % |
| 2 Midground | Supporting objects, crowds | 2 px | Full | 0.70 | 15 % paper overlay |
| 3 Background | Land, city skyline, sky bands | none | Light ramp only | 0.40 | 35 % paper overlay |

Depth recedes by **getting paler and losing its line**, never darker and never blurrier.

### 5.1 Mixing with the 3D house blend (`bright-style/STYLE.md`)
- **The toy theatre.** Paper flats (layers 0–3) can be set up in Three.js as textured planes on a
  tabletop, with real parallax, one directional "lamp" at the §5 angle and hard shadows (PCF with a
  small radius, no soft contact AO). The flats are rendered from the same 2D helpers onto canvas
  textures.
- **3D terrain.** When an episode needs real terrain, use the bright-style map slab
  (`bright-style/STYLE.md` §8), re-skinned: land `#ebe8de`, sea `#8cc5bf`, and the same red thread
  and brass pins as §13.
- **Never mix within one shot** a clay-shaded 3D object with soft AO and a halftone-shaded paper
  object. A shot is either paper (2D, or 3D flats) or clay. Cut between them on a T8 tick.

---

## 6. Characters: our recurring cast (original, no mascot imitation)

We act with **posture, the key, the dial hand, props and timing**. No character has a mouth or eyes.
That keeps us far from bird and cartoon mascots (Kurzgesagt), big-head caricatures
(OverSimplified) and the expressive stick figures of MinuteEarth. It also avoids caricaturing real
people.

### 6.1 THE WINDER: our host stand-in (appears in every episode)
- **What:**
  - A small paper figure: a teal capsule body (1 : 1.7), two short pill arms and two pill legs.
  - **A dial head:** a paper-card disc with four `ink-40` tick marks at 12, 3, 6 and 9, a brass
    centre pin and **one ink hand**.
  - Its signature is a **brass wind-up key in its back** (three lobes, about 0.45 × the body
    height).
- **The dial hand is the gaze** [measured, §19.2]. In the first proof the faceless head made
  "looking back" and "looking down" unreadable. A single hand pointing where the Winder looks fixed
  that without adding a face. Hand positions:

  | Hand points | Means |
  |---|---|
  | Forward (3 o'clock when facing right) | Neutral |
  | Down (6) | Sad or ashamed |
  | Up (12) | Alarm or awe |
  | Back | Looking behind |
  | No hand, pin only | Looking at the viewer: the deadpan "take" |
  | Spinning | Panic or confusion |
  | Drooping slowly from 3 to 6 over 40 f | Run-down |

  The hand ticks between positions in 2–3 steps (§10.1); it never glides.
- **The key turns when it thinks:** 360° every 24 f, ticking in 8 steps of 45° with a 3 f
  micro-overshoot each, plus `sfx clock.tick`. It **spins fast when it panics**. When the Winder
  "runs down", the key slows to a stop over 40 f, the dial hand droops to 6, and the figure slumps
  14°.
- **Job:**
  - the viewer's proxy;
  - the scale unit ("this is the Winder; it is 1.7 m tall");
  - the reaction shot;
  - the button: it winds the next episode's mechanism.
- **Size on screen:** 6–12 % of the frame height in scale shots, 35–55 % in a reaction close-up.
- **Never:** eyes, a mouth, speech, a beak, wings, animal features or a voice.

### 6.2 TALLIES: the crowd
- **What:** people as **pill-shaped tally marks** standing upright (12 × 34 px at crowd scale),
  each with a tiny paper head dot. Every tally stands for a stated number of people, always shown in
  a Plex Mono key ("1 TALLY = 10,000 PEOPLE").
- **Counting:** in groups of five, the fifth leans across the other four, **literally a tally mark**.
  **A key states whether a grid cell is one tally or one group of five** [rule]. The default cell is
  **one group of five**, and the key reads "1 GROUP (5 TALLIES) = …".
- **Behaviour:** they lean together like grass in wind (sine sway ±4°, phase offset by x).
- **Colour by state** (§1.5):
  - sage = settled, at rest, working the land;
  - teal = moving or migrating;
  - ink = institutionalised, conscripted, in uniform;
  - **hollow** (paper fill, ink line) = the other side, or "not yet";
  - one **red** = the person the story follows.

### 6.3 STAMPS: institutions and states
- **What:** tall ink rectangles (radius 6 px) with a **paper rubber-stamp emblem**: a simple icon
  for the country or organisation (a wave, a tower, a coin, a wheel). They are never real flags or
  logos. A flag may appear as a separate *prop* on a map.
- **Behaviour:** they don't squash or bounce. They slide in straight lines and **stamp**: a 6 f drop
  with ease-in, a 2 f hold, and a paper "ink" ring left on the ground (`sfx impact.soft`).
  Arguments between states are stamp-offs.

### 6.4 CAMEOS and FIGURES: real historical people
Two forms of each real person.

**(a) The Cameo** (portrait, for introductions and quotes):
- **Look:** a cut-paper **profile silhouette** (ink, deckle edge) in an oval brass-rimmed frame on a
  card stand. It has one identifying prop in colour and a Plex Mono name plate ("A. NOBEL ·
  1833–1896").
- **Behaviour:** it turns by flipping like a card (scaleX 1 → −1 over 6 f), nods by tilting on the
  stand pivot, and "speaks" through a **quote card** in Instrument Serif Italic.

**(b) The Figure** (full body, for scenes, battles and decisions):
- **Look:** a jointed paper puppet with **realistic proportions** (head about 1/7.5 of the height:
  the opposite of a big-head caricature), filled `ink-70`, no outline, and the same dial head as the
  Winder (in `card`).
- **Identity:** it comes from the **silhouette of period dress** plus **two identifying props** in
  colour.
- **Rig:** 7 pivots (neck, two shoulders, two hips, waist, prop hand), animated on twos.

**Recognisability rule for household-name figures [rule]:** a famous figure must be identifiable
without a face, by **three cues**:
1. **The silhouette.** Trace the outline of the hat, hair and coat from a **public-domain
   portrait** (Wikimedia Commons PD, Library of Congress, national archives), simplified to at most
   40 control points, with the source credited in the description.
2. **Two signature props or dress details**, used consistently, from the record (a bicorne and a
   hand in the waistcoat; a cigar and a bow tie; a stovepipe hat and a beard line).
3. **A name tag on the first appearance in every chapter.**

**Test:** a fresh viewer names the figure from the 168 px squint render in 3 of 3 tries. If not, the
props aren't signature enough. Change the props, never the features.

**Never:**
- exaggerated noses, jaws or features;
- caricature;
- a synthetic voice imitating the person;
- quotes that aren't on the record;
- humour that mocks victims.

Living people appear only when they are public figures acting in a public role, and only with
on-record quotes (`fact-check-playbook.md`).

### 6.5 THE INSPECTOR'S HAND: the editorial pointer
A paper-cut hand holding a brass loupe or a red pencil, entering from the frame edge. It annotates
(red pencil loops, §9) and magnifies (loupe transition, §11). It replaces floating cursor arrows.

### 6.6 Cast rules [rule]
- At most **3 named characters per scene**, and at most **one Winder**.
- Characters animate **on twos**; everything mechanical animates **on ones**.
- No character speaks with a voice. The narrator carries every line, which keeps us out of
  OverSimplified's voiced comedy.

### 6.7 Acting without a face: the pose and expression library
OverSimplified-scale reach depends on characters you feel for and laugh at. We get there with a
bigger acting vocabulary, not with faces.

**Proof so far [measured, §19.2]:**
- Six poses were rendered on the prototype rig. **Idle, Run-down (sad), Panic, Look-back (gag)**
  read at a glance once the dial hand was added.
- **Proud** and **Shrug** read weakly. In proud, the raised front arm crossed the head silhouette.
  In shrug, both forearms stayed inside the body silhouette. That gives one rule:
- **[rule] The silhouette rule for poses.** The pose's key limb must break the body's outline:
  arms outside the torso, a raised arm clear of the head, legs apart in action. If the pose reads as
  a solid ink shape at 64 px, it acts. If not, re-pose.

**Pose library** (to build into the rig as named presets [proto: `POSES` in `scene.js`]):

| Group | Poses (24) |
|---|---|
| Neutral and work | idle, point, carry, push, pull, wind (winding something), sit, write |
| Emotion | run-down (sad), slump-sit (defeated), flinch, cower, panic, proud, celebrate (two arms), relief (exhale squash) |
| Thinking and comedy | look-up (awe), look-back, shrug, double-take, deadpan (the take), facepalm (hand to dial), tiptoe, hide behind a prop |

**Key states** (on top of any pose):

| Key | Dial hand |
|---|---|
| still | neutral |
| think (ticking) | down |
| panic (spinning) | up |
| run-down (slowing) | spinning |
| reverse (spinning backwards) | pin only |
| wound-up (vibrating 1 px on ones) | |

**Posture-acting guide [default]:**
- **Sad** = forward lean of 10–16°, the head sunk into the shoulders (head drops 8–10 % of the
  height), arms hanging in front, the key stopped, the hand at 6, a hold of 30–45 f, no sound but the
  drone.
- **Afraid** = a backward lean of 6–10°, arms up outside the silhouette, feet off the ground, the key
  spinning with motion arcs (not blur), the hand at 12, `clock.tick` doubling in tempo.
- **Proud** = chest up (−7°), one arm up **clear of the head**, 4 % stretch, a 2 f overshoot.
- **Embarrassed** = a quick turn away (a scaleX flip, 4 f), the hand to 6, a small 3 % squash.

**Comedy toolkit [default].** Comedy comes from timing, props and the cut. We use no voices and no
cartoon sounds.
1. **The take:** something absurd happens, then cut to the Winder facing the viewer (pin only, no
   hand). Hold 20–30 f in silence. Cut on the next tick.
2. **The key as punchline:** the key reverses, falls out, or is wound by someone else.
3. **The prop card:** the Winder holds up a paper card with a 1–3 word deadpan caption ("ah.").
   At most 2 per episode.
4. **Rule of three:** two expected beats and a third that breaks the pattern. The break lands on a
   hard cut (T8).
5. **Cut-to-aftermath:** skip the disaster and cut to the tidy hatched ruin with the Winder sweeping.
6. **Scale gag:** a Stamp drops on a tiny problem, or a tiny Winder pushes a huge gear.
7. **Running gag:** one per episode, introduced in the cold open, paid off in the end screen (§22).

Never mock victims, the dead or real suffering (§20.5).

**Character sheet [new, P0 in §17].** Build `engine/people/paper.js` with:
- the Winder: turnaround (front, 3/4, side, back with key), the 24 poses, the key states and the dial
  hand;
- Tally sway, lean-five, hollow and red variants;
- Stamp slide and stamp;
- Cameo flip and nod;
- the Figure rig.

---

## 7. Typography

The brand fonts from `BRAND.md`, with animation rules.

| Role | Font | Size at 1080p | Colour | Animation |
|---|---|---|---|---|
| Thumbnail and title words | **Inter 900**, tracking −2 % (until it's installed, use **Archivo Narrow 700**, as the paper-lab thumbs did) | 140–260 px | `paper` on a coloured ground; `ink` on paper | Title cards only: words drop in as stamped type (§10.5) |
| Chapter number | **Archivo Narrow 700** | 180–240 px | `red` | Ticks up like a counter wheel |
| Chapter title | **Instrument Serif** | 96–130 px | `ink`, or `paper` on a plate | Writes on letter by letter, 1 letter per frame |
| Labels on objects | **Inter 600** (fallback Archivo Narrow 600), sentence case | 30–40 px | `ink` on a paper tag | Hangs from a **string tag** (§9.4) |
| Data, units, dates, sources, keys | **IBM Plex Mono 500**, caps, tracking +16 % | 22–30 px (source lines 20 px) | `ink-70` | Types on at 2 characters per frame, with `type.click` every 3rd |
| Quotes (cameos) | **Instrument Serif Italic** | 48–64 px | `ink` | The card slides out with the text already printed |
| Big numbers | **Archivo Narrow 700**, tabular | 160–420 px | `ink`, or `red` if it's *the* number | Counter-wheel roll (§9.1) |

**Rules [rule]:**
- Type always sits on paper (the ground, a tag, a card) or on a plate. It never sits on a busy fill.
- No gradients, glows or 3D on type.
- At most two type sizes per frame plus a source line.
- [measured] 22 px Plex Mono held SSIM 0.996 at VP9 1080p, 0.988 at 720p and 0.94 at 360p.
  **20 px is the floor** for source lines.
- **Inter must be added to `assets/fonts`** (OFL; 600 and 900 woff2) [new, P1]. Archivo Narrow, Plex
  Mono and Instrument Serif are already there.

---

## 8. Camera grammar

The camera is **a person leaning over a drafting table**. It moves like hands and eyes, not like a
drone.

| Move | When | Spec |
|---|---|---|
| **Slide** (truck across the table) | Moving along a sequence, timeline or route | 1 screen width in 45–75 f, `E.editorial`, with parallax by layer (§5). The default move between beats |
| **Lean-in** (push) | Emphasis, "look at this" | +8 to +15 % scale over 60–120 f, `E.inOutSine`. Never more than 20 % in one beat |
| **Lift** (pull-out) | Context, "and this is only one of…" | −30 to −70 % scale over 60–90 f, `E.emphasized`; the first 6 f lag (the camera is "heavy"). Re-screen the halftone at the next cut if the scale leaves 0.75–1.6× (§4.1) |
| **Tilt-down onto the table** | Opening shot of a chapter: from the table-edge view to top-down | A 2.5D skew of layers 0–1 over 45 f. Only with paper props |
| **Hold** | Reaction, number landing, joke | 20–45 f of no camera move while the subject keeps ticking (§10.6) |
| **Shake** | Impact, explosion, crash | 6–10 f, decaying, max 14 px, on ones; then a 1 f drop of the whole table by 2 px |

**Camera rules:**
- [rule] **One camera move per sentence of VO.** A new sentence gets a new move or a cut.
- [rule] Never orbit flat art. Rotation is at most ±3° (a "hand" tilt) in emotional beats.
- [rule] **The camera breathes** whenever it isn't moving.
  - In **3D or toy-theatre shots**, wrap the move with `breathe(move, { amp, seed })` from
    `engine/camera.js`. `amp` is a world-space drift (default 0.02). It is *not* a scale
    percentage, so tune it per set.
  - In **2D canvas sets** there is no camera rig. Apply a ±0.4 % scale sine over 6 s to the set
    transform yourself [new: `sets/paper` `camBreath(t)`].
- [hypothesis] **Picture changes per minute: 14–20 in the body, 22–30 in the cold open.** We have no
  measured cut rate for any animated outlier: captions and video are blocked here, so
  `README.md` "Method" calls it [inferred]. The one inferred number is Kurzgesagt's ≈ 200 panels in
  ≈ 12 min, about 17 per minute. **Test:** count picture changes in the ep10 draft per chapter and
  correlate them with the retention graph after release. A continuous slide counts as one picture
  per beat.
- [rule] **Framing.** The subject sits on the **left or right third**, with the label in the
  opposite third. Centre framing is reserved for scale shots and title cards.
- [rule] **Safe areas.** These are three separate zones:
  1. **Type safe:** all type stays 96 px from the left and right edges and 64 px from the top and
     bottom.
  2. **Player-UI keep-out:** nothing that carries meaning (type, a counter, the red thing) goes in
     the **bottom-right 260 × 80 px** (the duration stamp and preview UI) or the **bottom 64 px
     band** (the progress bar on hover).
  3. **End-screen zone:** the last 20 s keeps the left and right thirds free (§16, RC-6).

  Counters and keys go **top-left or top-right** (top-right only on shots without the coil
  compass).

---

## 9. Data and number visuals

**Numbers are machines too.** Every data visual is a physical device made of our parts.

### 9.1 Counter wheel (the hero number) [signature]
An odometer of **paper drums in a brass housing**. Each digit rolls up, and the lower digits show
motion stripes, not blur. The leading digit **ticks** into place with a 2 f overshoot of 8 % of its
height.
- The landing digit gets `sfx ui.tick`.
- The final value gets a red underline drawn on with `marker.swipe`.

Use it for the one number per chapter that matters.

### 9.2 Tally blocks (counts of people or things)
- Counts become tallies in groups of five (§6.2), arranged in a grid and **filled one group per
  frame** with a soft `ui.ticks` run.
- The key states what one group is worth. **Grid maths must close:** columns × rows × the value per
  group equals the total shown [rule].
- For very large counts, the grid **lifts** (a camera pull-out) to reveal it is one cell of a bigger
  grid (§12).

### 9.3 Gauges, scales and ruler bars
- **Gauge dial:** a half-circle brass dial with a red needle that **overshoots and settles**
  (`E.springTight`, 18 f). Use it for rates, risks and percentages.
- **Balance scale:** two pans on a beam for comparisons. The beam tips on `E.spring` over 24 f, and
  it is the only object allowed to wobble twice.
- **Ruler bars:**
  - Bar charts are **strips of card pulled out of a slot** (bar length = value), with a Plex Mono
    value tag at the end.
  - The axis is a printed ruler with ticks every 5 units and labels every 10.
  - Bars pull out on `E.decel` in 18–30 f, staggered 4 f.
  - For more than 3 series, use the §1.6 colours and patterns.

### 9.4 String tags (labels)
A paper luggage tag (a rounded rectangle with a punched hole), hung from the object by a string
(2 px when the string connects meaning, 1.25 px when decorative, §3). It swings in on a pendulum: 2
damped swings over 20 f, ±10° → 0°. One tag per object, and at most **three tags in a frame**
[proto: `tag()`].

### 9.5 Timelines
A **paper tape** running through a brass roller (a ticker tape).
- Dates are printed in Plex Mono, and the tape feeds through as time passes.
- Events are **punched holes** with a tag hanging from them.
- The current moment is under the roller, marked with a red pointer.

### 9.6 Sources [rule]
Every number on screen has a Plex Mono **source line**: 20 px, `ink-70`, bottom-left, on screen for
at least 60 f ("SOURCE: US CENSUS BUREAU, 2020"), following the brand promise and
`fact-check-playbook.md`.

### 9.7 Never
- Pie charts. A pie appears only as a **gear with coloured teeth**, for at most 4 shares.
- 3D bars, dual axes, more than one chart idea per frame, or numbers without units.
- More than 5 series (§1.6).

### 9.8 Line and area charts over time: the chart recorder [spec]
A change over time is drawn by **a brass pen arm on a paper drum**, like a seismograph or
barograph. Time scrolls left as the drum turns, and the pen writes the line.
- **Paper:** `card` with an `ink-40` 1.25 px grid (decorative) and a Plex Mono date ruler under it
  (≥ 2 px ticks).
- **Line:** 4 px for the hero series (D1, ink); other series per §1.6. A **direct label tag** sits
  at each line end.
- **Draw speed:** the drum turns at a constant speed (`E.linear`). One pen arm per series, offset
  vertically and stacked like a multi-pen recorder. The arm **ticks** on each data point (a 2 f, 1 px
  jerk) with a soft `ui.tick` at −24 dB.
- **The moment that matters:** the pen draws on into the red event, and the line turns **red from
  that point** (it becomes the one red thing). The pen lifts, and the camera leans in 10 %.
- **Area and stacked area: "strata of card".** Each series is a layer of card cut along its line,
  stacked bottom to top, each with card thickness on its upper edge. Fills follow §1.6, with
  patterns on D4 and D5. The layers slide up into place on `E.decel`, 6 f apart.
- **Log scales:** label every decade on the ruler and write "LOG SCALE" in the source line.
- **Never:** smoothed splines that invent data between points (draw straight segments), or
  gradient area fills.

---

## 10. Motion principles (easing, overshoot, squash and stretch, timing in frames)

The motion signature is **the tick**: things advance in small decisive steps with a tiny
overshoot, like a second hand.

### 10.1 Easing table [spec] (`engine/motion.js` `E`)

| Motion class | Easing | Duration (f @ 30) | Notes |
|---|---|---|---|
| Object enters (pop) | `E.back(1.6)` (motion.js: `back: (s) => back(s)[1]`, i.e. outBack with s = 1.6) | 8 f | Scale 0 → ~1.06 → 1.0 |
| Object exits | `E.inCubic` | 6 f | Scale 1 → 0.85 + opacity, or slide off. Exits are faster than entrances |
| Tick step (hands, keys, counters, rulers) | `tick(u, n)` below | 4–8 f per step | Each step overshoots 6–10 % |
| Camera slide | `E.editorial` | 45–75 f | |
| Camera lean-in | `E.inOutSine` | 60–120 f | |
| Camera lift | `E.emphasized` | 60–90 f | 6 f lag at the start |
| Card slide or pull (bars, quote cards) | `E.decel` | 18–30 f | Stagger 4 f |
| Stamp drop (institutions) | `E.inQuad`, then a hard stop | 6 f + 2 f hold | No bounce. Power doesn't bounce |
| Pendulum (tags, signs) | damped cosine, ζ ≈ 0.25 | 20 f | 2 visible swings |
| Needle or balance | `E.springTight` / `E.spring` | 18–24 f | |
| Character pose to pose | `E.inOutCubic`, sampled `onTwos(t, 15)` (seconds in, seconds out) | 6–12 f | Hold the key pose 4–8 f |
| Hinge open (cutaway) | `E.inOutBack` (motion.js builds it at s = 1.70158; the softer s = 1.2 needs a new `inOutBack(s)` export [new, P2]) | 24–30 f | |
| Breathing idle | sine | 90–180 f period | ±1.5 % scale or ±2 px |

**The tick helper.** `E.steps(n)` in motion.js is a plain floor staircase
(`Math.floor(t·n)/n`). It has no overshoot, and `E.springTight` is a separate 0 → 1 ease, so
"wrapping" one in the other isn't an existing call. The tick is a composition [spec, new P0 in
`sets/paper`]:

```js
// u: 0..1 progress over the whole move; n: number of steps; settle: fraction of each step spent settling
const tick = (u, n, settle = 0.5) => {
  const x = M.clamp(u) * n, k = Math.min(n - 1, Math.floor(x)), f = x - k;
  const s = f < 1 - settle ? 0 : M.E.springTight((f - (1 - settle)) / settle); // springTight overshoots then lands on 1
  return (k + s) / n;                                                         // u = 1 lands exactly on 1
};
```

### 10.2 Overshoot budget
Things that "arrive" overshoot by **6 % (small parts) or 3 % (large panels)**, never more than 10 %.
The cartoon 20–30 % bounce reads as kids' TV. Institutions and type blocks never overshoot.

### 10.3 Anticipation and follow-through
- Every character move larger than 40 px gets **anticipation: 3–4 f backwards by 8–12 % of the
  move**.
- Keys, tags and strings **lag 2 f and settle 6 f** after the body stops
  (`docs/masters/disney-12-principles.md`).

### 10.4 Squash and stretch
- **Round things (the Winder, Tallies, coins, drops of water):** up to **8 %**, volume-preserving
  (scaleX = 1/scaleY). On landing: 2 f squash, 3 f recover.
- **Square things (Stamps, documents, buildings, type): 0 %.** Their rigidity is the character.
- **Mechanisms:** 0 %. Gears never squash.

### 10.5 Stagger and rhythm
- Lists build at a **4 f stagger** (fast) or **8 f** (deliberate). Grids build one group per frame.
- Animation **lands on the word**: the key frame of an entrance hits **2 f before** the stressed
  word's VO onset (`M.wt(shot, word)`), so the eye arrives with the ear.
- Stamped title type: each word drops in over 6 f with a 2 f hold, 4 f apart, with `impact.soft` on
  each.

### 10.6 Nothing is ever fully still [rule]
In any hold, at least one thing moves:
- a gear turns at 4–10 rpm;
- the Winder's key ticks;
- tallies sway;
- water lines drift by 1 px every 8 f.

**Everything ticks.**

### 10.7 Timing benchmarks
- Read time for any on-screen text: `max(45 f, 6 f × words + 30 f)`.
- The minimum time a new picture stays up is 36 f (1.2 s). The body average is 2.5–4 s
  [hypothesis, §8].
- Joke or reaction hold: 20–30 f of silence after the line, with the reaction pose on the 2nd frame
  of the hold.

---

## 11. Transition kit

Our transitions are built from the theme. Each maps onto an existing `engine/transitions.js` name
where possible.

| # | Transition | What happens | Frames | Sound | Engine |
|---|---|---|---|---|---|
| T1 | **Case-open** [signature] | The surface of an object hinges open like a watch back, revealing the mechanism inside, which becomes the next shot | 24–30 | `score.py` cue type `clunk` at the latch (a score cue, not an sfx preset) + `sfx whoosh.s` | **[new, P0]** `case-open`; fallback `page-turn` |
| T2 | **Loupe** | The Inspector's Hand brings in a brass loupe showing the next shot at 3–4×, and the lens grows to fill the frame | 20–30 | `ui.scan` + `whoosh.s` | `iris` / `shape-circle` + a brass ring overlay [new, P1] |
| T3 | **Gear-mesh** | A gear in shot A meshes with a gear of shot B, and the camera rides the teeth across | 30–45 | `ui.ticks` timed to the teeth | `slide` + parallax, a staged move |
| T4 | **Tape-feed** | Time skip: the ticker tape races through the roller to the new date | 20–40 | `type.run` + `tape.stop` | `push` with a staged tape |
| T5 | **Card flip** | The frame is a card that flips to the next scene printed on the back | 12–16 | `paper.page` | `page-turn` (vertical-axis variant) |
| T6 | **Fold-away** | The frame folds in half like a map, revealing the next frame underneath | 16–20 | `paper.rustle` | **[new, P1]** `fold`; fallback `split-slide` |
| T7 | **Stamp-cut** | A Stamp drops; where it lifts, the stamped area is the next scene, which expands | 10–14 | `impact.hit` | `shape-box` + a stamp sprite |
| T8 | **Hard cut on a tick** | A plain cut exactly on a clock tick in the score | 0 | `clock.tick` | `cut` |
| T9 | **Pencil wipe** | The red pencil scribbles across the frame, and the scribble becomes the next shot's red element | 14–18 | `marker.swipe` | `linear-wipe` with a red brush mask |

**Rules [rule]:**
- About 70 % of all transitions are T8 (cuts) and camera slides inside one table world.
- Signature transitions (T1, T2, T3) are kept for **chapter turns and reveals**: at most one every
  60 s.
- Never use `glitch`, `scanline`, `pixel-sort`, `light-leak`, `film-burn` or `ink-bleed` in this
  look.

---

## 12. Scale-shot devices

Each device is a mechanism, and **every rung carries one human-unit comparison that is factually
right at that rung** [rule]: check each comparison's number against a source before it's drawn.

1. **The Gear Train ladder** [signature]: each rung is a gear meshed to the next, larger gear, with
   the ratio printed on its hub ("×10"). The drawn gear sizes may compress the real ratio (a 2.5×
   drawn gear for ×10), but the hub label is the truth. The camera rides gear to gear (T3) and lifts
   at each mesh.
2. **The Nested Case:** an object opens (T1) to a smaller mechanism, which opens again: 3–5 levels
   down. Each hinge carries a Plex Mono scale tag ("1 : 1,000").
3. **The Tally Field:** tallies fill a grid, and the camera lifts to show the grid is one cell of a
   bigger grid. The key updates each time.
4. **The Ruler Run:** a printed ruler along the bottom of the frame. Scale breaks are a torn paper
   gap with "≈ 4,000 km" in the gap.
5. **The Winder Unit:** a thing measured in Winders (1.7 m), counted by a Plex Mono counter.
6. **The Balance:** something tiny on one pan lifts something huge on the other, for leverage
   stories.

---

## 13. Map style: "the survey sheet"

Maps are **printed survey sheets on the drafting table** [measured: `sf-front` frame, §19].

[spec]
- **Land:** `card` `#ebe8de` with a 3 px card edge (`kraft` on the lamp-away side) and a deckle
  coast. Relief is shown as **hachures** (short `ink-40` strokes down the slope), never as hill-shade
  gradients.
- **Water:** `teal-light` `#8cc5bf`, with **water-lining**: 3–4 coast-parallel `teal` lines spaced
  about 6, 13, 22 and 34 px out from the shore, like an engraved chart. Implementation [proto]: stroke
  the land path with width `2k + 1.25` in teal, then `2k − 1.25` in sea colour, for each k, then fill
  the land.
- **Borders:** `ink-40` dashed (8 px dash, 5 px gap). The country in focus gets a `sage` fill and a
  3 px `ink` line; other countries stay card.
- **Routes:** a **red thread** of 4 px with a 2 px paper halo, drawing on at constant speed (one
  map-width in 60–90 f), with **brass pins** at the stops. The moving thing is a small paper cut-out
  riding the tip. When the route stops being the subject, the thread **drops to `ink` over 4 f**, so
  the next red thing can take over [rule].
- **Cities:** a brass pin head (14 px) and a label on a string tag.
- **Compass:** our **coil mark** at top-right, 72 px, ticking to north on the map's first frame (8 f).
- **Projection and data:** Natural Earth (public domain) through our GeoJSON pipeline. Name the
  projection in the source line when area matters.
- **Frame:** a 1.25 px `ink-40` neat-line border with Plex Mono grid ticks every 10°.
- **Mixing with 3D:** §5.1.
- **Fronts over time, armies and damage:** §20.

**Never:** satellite imagery in this look; parchment and sepia; game tokens or chess pieces as
armies; glowing routes; flag-coloured territory fills (OverSimplified's board).

---

## 14. Sound palette

The score is **a music box in a workshop**: precise, warm, mechanical, with a low string bed. It
uses `engine/score.py` (cue types: boom, clang, clunk, whoosh, horn, hum, water, ticks, swell,
pulse, sfx) and `engine/sfx.py` (`PRESETS`).

| Layer | What | Engine |
|---|---|---|
| **Bed** | A low drone in the episode key, plus a **plucked celesta or music-box ostinato** in the chapter's key (4–8 notes, 70–96 bpm) | `drone: 0.12–0.15`; the ostinato is [new, P1] a `score.py` cue type `box` (sine + 2nd and 3rd partials, fast decay) or a licensed stem (`sound-and-music.md` §4) |
| **The tick (signature)** | A soft clock tick on every beat of the ostinato, ducked 18 dB under VO. It *stops* for reveals | `sfx clock.tick`; `score` `silenceDrone` for reveal shots |
| **Mechanism foley** | Ratchet clicks, gear whirr, spring wind-up, latch clunk, hinge creak | existing: `sfx ui.tick`, `sfx ui.ticks`, `score` cue `clunk`, `score` cue `ticks`; [new, P1] `sfx` presets `ratchet`, `windup`, `latch`, `hinge` |
| **Paper foley** | Slide, flip, fold, tear, stamp | `paper.rustle`, `paper.page`, `paper.tear`, `impact.soft` |
| **Writing** | Pencil scribble for red annotations; typing for Plex Mono | `marker.swipe`, `type.click`, `type.run` |
| **Reveal** | A single **brass bell** strike on the episode's key reveal, at most 3 per episode | [new, P1] `sfx` preset `bell` |
| **Run-down** | The ostinato and ticks slow and detune over 2 s | `sfx tape.stop` + [new, P2] a `score` tempo ramp |
| **Conflict (§20)** | Distant, low and muffled: a felt-mallet thud for artillery, a paper tear for a breach | `impact.boom` low-passed and at −12 dB, `sub.drop`, `paper.tear`. **No realistic gunfire, screams or battle ambience**, and no music stingers on deaths |

**Rules [rule]:**
- About one designed sound every 4–6 s in the body.
- Every pop-in has a sound at **−24 dB** under VO.
- No cartoon boings, slide-whistles or laugh sounds.
- The bed sits 18–24 dB under the VO (`sound-and-music.md` §1).

---

## 15. Thumbnail grammar

Brand rules first (`brand/BRAND.md`): **≤ 3 words**, the **coil badge small at top-left**, **one red
thing**.

### 15.1 What the outliers' thumbnails do (study evidence)
| Channel (median) | Ground | Faces | Saturation | Source |
|---|---|---|---|---|
| OverSimplified (40M) | Coloured political map | **Yes**: 2–3 caricature leaders | Mid-high (flag colours) | `oversimplified.md` §3 |
| Kurzgesagt (11M) | **Dark** navy or purple | Characters look out at you | High (neon) | `kurzgesagt.md` §3 |
| Zack D. long-form (5.3M) | Photoreal daylight scene | Sometimes a hand; mostly an object | Natural, with one red violation | `zack-d-films.md` §3 |
| CGP Grey (6.7M) | Plain map or diagram | Stick figure | Low, with one accent | `other-animated-outliers.md` |
| TED-Ed (0.86M) | Varies with the lesson | One character acting | Varies | `ted-ed.md` §3 |
| MinuteEarth (0.85M) | **White or paper** | Expressive faces | Low | `minuteearth-minutephysics.md` §3 |

**Reading:**
- The two highest medians use a **coloured or dark ground** and **expressive characters**.
- The white or paper-ground grammar belongs to the lower-median channels.
- The faceless, no-text, one-object grammar *does* work (Zack D.), but with photoreal daylight and a
  *familiar* object.

v1.0's claim that a paper ground is "our edge in a feed of dark thumbnails" had no data behind it,
and the feed test (§15.2) contradicts it.

### 15.2 Feed mock test [measured]
- **Setup.** The same hero (an opened case with a red gear, the Winder looking up, "IT STOPPED") was
  rendered on three grounds and dropped into a mock YouTube grid in light mode (`#ffffff`) and dark
  mode (`#0f0f0f`): `renders/paper-lab/feed-light.png`, `feed-dark.png`.
- **Metric.** The luma step between the thumbnail's outer 6 px and the feed background (`edge ΔL`,
  0–1).

| Ground | Light mode edge ΔL | Dark mode edge ΔL | Mean S | RMS contrast at 168 px |
|---|---|---|---|---|
| Paper `#f7f6f1` | **0.04** (melts into the white UI) | 0.90 | 0.12 | 0.19 |
| Night `#14233d` | 0.87 | **0.07** (melts into dark mode) | 0.55 | 0.30 |
| **Teal-shade `#1d6662`** | **0.67** | **0.28** | 0.57 | 0.22 |

The teal-shade ground is the only one with a clear edge in both feeds.

### 15.3 Thumbnail rules [rule unless marked]
- **Ground:** a **coloured ground**, by default teal-shade `#1d6662`. Alternatives:
  - night `#14233d` (dark-mode risk; use it only as the B variant);
  - kraft `#dcd7c8` with a 12 px ink frame around the edge (a mid-light ground that still separates from
    white: ΔL ≈ 0.16, [hypothesis, test next]).
  - **Never a paper or white ground** for a lead thumbnail. Paper is a body ground.
- **Saturation budget:** the thumbnail **may and should** run at mean S 0.45–0.65. It's where we spend
  the colour the body saves (§1.3).
- **Hero:** one object in **cutaway**, case hinged open and mechanism visible, filling 50–60 % of
  the frame and kept to the **right 58 %**. The red element is the hidden part inside, and it is
  the brightest-chroma cluster in the image.
- **A character with an expression** [default, new in v1.1]. The Winder in an *acting pose*
  (panic, awe or run-down, §6.7) at **12–20 % of the frame height**. That's three times v1.0's 4–7 %:
  at 4–7 % it is an unreadable speck at 246 px (paper-lab thumbs). For history topics, the household
  figure's silhouette Figure or Cameo (§6.4) can replace the Winder.
- **Words:** Inter 900 (Archivo Narrow 700 until then), `paper` on a coloured ground, 1–3 words, cap
  height 14–20 % of the frame height, in the **left 40 %**. The words keep a **clear gap of ≥ 4 % of
  the frame width** from the hero: the first proof had STOPPED touching the lid, which kills
  legibility at 168 px. One word may be red **only if** the hero has no red.
- **Line weight:** render the pen line at 6 px and the off-register shift at 8 px for the 1280×720
  export. The paper-lab thumbs kept 3 px helper defaults, and the line vanished at 360 px, which
  confirms the rule.
- **Squint test:** at 168×94 px in greyscale, the hero silhouette and the words must read, and the
  hero-vs-ground luma contrast is ≥ 40 %.
- **Feed test [rule]:** before upload, drop the thumbnail into both feed mocks
  (`python3 -I projects/paper-lab/check.py` makes the mock; swap in the candidate files). Its edge
  ΔL must be ≥ 0.25 in **both** modes.
- **Never:** arrows pointing at nothing, fake UI, shocked emoji, caricature faces, any creator's
  iconography.

### 15.4 CTR hypotheses to A/B (YouTube Test & Compare, 3 variants, run to completion)
| # | Hypothesis | A | B | C | Decide on |
|---|---|---|---|---|---|
| H1 | A coloured ground beats paper in the real feed | Teal-shade ground | Night ground | Paper ground (the control we expect to lose) | Watch-time share (Test & Compare's metric) |
| H2 | An acting character lifts CTR over object-only | Hero + Winder in panic at 15 % height | Hero alone | Hero + the household-name Figure silhouette | Watch-time share |
| H3 | Words beat no words for this look | 2 words | No words + a red counter-wheel number | 3 words | Watch-time share |

Run H1 on ep10. Run H2 and H3 on ep11–12 (one variable per episode). Log the results in
`docs/library/animation-study/thumb-tests.md` [new]. If H1 shows paper is not worse, the paper
ground returns as an allowed B variant.

---

## 16. Six reference compositions, frame by frame

Each runs at 30 fps, 1920×1080. "f" = frame from the start of the shot. Example content is
illustrative. **Fact-check any real claim before use.**

### RC-1: "The Case Opens" (cold-open reveal, 6.0 s, 180 f) [measured: `sf-case` renders this at f 150]
*VO: "Every city has one machine nobody sees. This is it."*
- **f 0–20:**
  - Paper ground.
  - A closed **brass-rimmed case** (a pocket-watch-like disc, 520 px, card face, 3 px pen line,
    off-register fill) sits right of centre at layer 1, with a hard 12 % shadow down-right.
  - The music-box ostinato starts with a tick on f 0, and the camera breathes.
- **f 20–50:** the camera leans in 8 % (`E.inOutSine`). The Inspector's Hand slides in from the lower
  left to the latch (18 f, `E.decel`).
- **f 50–56:** the thumb presses the latch. The lid sinks 3 px over 3 f (`score` cue `clunk` on f 53).
- **f 56–84:** **T1 case-open.** The lid hinges up-left (`E.inOutBack`, 28 f), showing its hatched
  inner face.
  - Inside is a miniature city mechanism: teal pipes, brass gears at 6 rpm, sage tallies.
  - **One red gear** at the centre, ringed with a dashed shape-code.
- **f 84–110:** mechanism parts pop in on a 4 f stagger (8 f `E.back(1.6)` each, a −24 dB `ui.tick`
  each).
- **f 110–150:** the camera leans another 10 % to the red gear. On "This is it" (f ≈ 132) a string
  tag swings in: "The pump". The Winder (bottom-left, 150 px) turns its dial hand up to 12 (awe).
- **f 150–180:** **Hold.** The ticks stop on f 150. Only the red gear turns. Cut on f 180 on a single
  `clock.tick`.

### RC-2: "The Gear Train" (scale ladder, 14 s, 420 f)
*VO: "One Winder: 1.7 metres. Ten times that is a six-storey building. Ten times that…"*

Rung check: each rung is ×10, with a human unit verified for that size.

| Gear | Size | Human unit | Reference |
|---|---|---|---|
| 1 | 1.7 m | the Winder (an adult) | — |
| 2 | 17 m | a six-storey building | at about 3 m per storey |
| 3 | 170 m | the Washington Monument | 169 m, NPS |
| 4 | 1.7 km | a 20-minute walk | at 5 km/h |
| 5 | 17 km | two Mount Everests stacked | 2 × 8,849 m = 17.7 km; Nepal–China 2020 survey |

v1.0 called rung 2 "a giraffe", but giraffes are about 5–6 m tall. It also called rung 4 or 5
"Mount Everest ÷ 50" (≈ 177 m), which belongs on rung 3. Both errors are fixed.

- **f 0–30:** a small brass gear (180 px) at centre-left. The Winder (110 px) stands on its top, key
  ticking. A Plex Mono tag reads "1.7 M".
- **f 30–75:** **T3 gear-mesh.** The gear meshes with a gear drawn 2.5× its size; the hub says the
  truth, "×10". The camera slides right and lifts −50 % (`E.emphasized`, 45 f). A `ui.ticks` run is
  timed to the teeth. The hub label stamps in on f 70.
- **f 75–150:** gear 2 carries a paper flat of a six-storey building (ink, a Stamp emblem, six window
  rows), with the Winder tiny at its door. Tag: "17 M · A SIX-STOREY BUILDING". On "Ten times that…"
  (f 140), the Winder's dial hand ticks up to 12.
- **f 150–195:** the next mesh. Gear 3 carries a paper obelisk flat: "170 M · THE WASHINGTON
  MONUMENT (169 M)". The camera re-screens the halftone at this cut (the scale is now 0.5×, §4.1).
- **f 195–330:** two more meshes at an accelerating rhythm (40 f, then 34 f):
  - "1.7 KM · A 20-MINUTE WALK": a dotted path with a tiny walking Winder;
  - "17 KM · TWO EVERESTS STACKED": two paper mountain flats, one on the other.
- **f 330–380:** the final gear is enormous; only its teeth fit in frame. **One red tooth** comes
  round. The ticks stop on f 360.
- **f 380–420:** the camera lifts −70 % to reveal the train as a **single line of gears** on the
  drafting table. Hold 30 f. `bell` on f 390 (the first of the episode's three).

### RC-3: "Tally Field" (people data, 10 s, 300 f)
*VO: "In 1900, about 4 in 10 American workers were farmers. By 2000: fewer than 2 in 100."*
(Example figures: USDA ERS, *The 20th Century Transformation of U.S. Agriculture and Farm Policy*,
2005: 41 % of the workforce in agriculture in 1900, 1.9 % in 2000. Re-verify before use.)

**Grid maths:** 10 × 10 cells; **1 cell = 1 group of 5 tallies = 1 % of workers**, so 1 tally =
0.2 %.

| Year | Share | Groups | Tallies |
|---|---|---|---|
| 1900 | 41 % | 41 | 205 |
| 2000 | 1.9 % | 1.9 | 9.5, drawn as one full group + 4 tallies + a half-height tally |

The key says exactly this.

- **f 0–24:** paper ground with a printed ruler along the bottom. The key types on, top-left:
  "1 GROUP (5 TALLIES) = 1 % OF WORKERS". The source line appears bottom-left.
- **f 24–124:** hollow tallies (paper fill, ink line: "a worker") fill the 10 × 10 grid **one group
  per frame** (100 f), with `ui.ticks`. The fifth of each group leans across. A tape-feed date
  top-right reads "1900".
- **f 124–150:** the first 41 groups fill **sage** (land = farming, §1.5) in a left-to-right wipe,
  2 columns per frame. A counter wheel (200 px) rolls to "41 %" in ink.
- **f 150–180:** **T4 tape-feed:** the date races and lands on "2000" (`tape.stop` on f 178).
- **f 180–240:**
  - The sage groups lose their fill back to hollow from right to left, on twos, and each emptied
    group fills **ink** (offices and institutions).
  - 9.5 sage tallies stay.
  - **One sage tally turns red**: the one farmer the story follows.
- **f 240–270:** the counter rolls down to "1.9 %", and the last digit ticks with an 8 % overshoot.
  The red pencil circles the red tally (`marker.swipe`, 14 f).
- **f 270–300:** Hold. The tallies sway. Cut.

### RC-4: "The Red Thread" (map and route, 12 s, 360 f)
*VO: "From Liverpool to the far side of the world in 52 days. Through a ditch nobody had dug yet."*
(Illustrative.)
- **f 0–45:** **Tilt-down onto the table**: the survey sheet settles into a top-down view by f 45.
  It has card land with hachures, a teal-light sea with water-lining, and a neat-line border with
  10° ticks. The coil compass top-right ticks to north (8 f).
- **f 30–60:** a brass pin drops at Liverpool (6 f `E.inQuad`, `impact.soft`), and its string tag
  swings in.
- **f 60–240:**
  - The **red thread** draws on at constant speed (one map-width per 90 f), and a paper steamship
    rides the tip with a 2 f bob on twos.
  - The camera slides with it, leading the ship by 15 % of the frame.
  - A **day counter** in Plex Mono sits **top-left, inside the 96 px / 64 px type-safe margin**
    (§8). It is clear of the compass (top-right) and of the bottom-right player-UI keep-out. It
    ticks "DAY 1 … DAY 52", one step every 3 f.
- **f 240–280:** the thread reaches the isthmus. The ship stops with a 4 f anticipation pullback.
  - **f 244–248:** the thread drops from red to `ink` (§13). The thread is no longer the subject,
    and the next red thing is coming.
  - **f 250–268:** the map **folds** at the isthmus (T6, 18 f, `paper.rustle`).
- **f 280–330:** underneath is a hatched cutaway of the unbuilt canal: an empty trench outlined in
  dashed `ink-40` (2 px, because it carries meaning). A **red "?" tag** swings in: **the only red
  thing** in the frame.
- **f 330–360:** Hold, with the ostinato dropping to the drone. Cut on a tick.

### RC-5: "The Cameo and the Stamp" (historical moment, 9 s, 270 f)
*VO: "The minister signed. Three words, and a country changed its clocks."* (Illustrative; use only
on-record quotes.)
- **f 0–20:** toy-theatre staging: the table edge in the foreground (layer 0), a paper flat of a
  government building (ink, a Stamp emblem) at layer 2 with 15 % haze, and a sage sky band in three
  posterised steps at layer 3.
- **f 20–40:** a **Cameo** slides in from the left on its card stand (`E.decel`, 20 f): an ink
  silhouette in a brass oval, with a medal ribbon in teal. Its name plate types on: "MINISTER ·
  1916".
- **f 40–60:** the Cameo nods (a 6° tilt, 8 f, back in 8 f) and flips to face right (scaleX 1 → −1
  over 6 f, `paper.page`).
- **f 60–110:** a quote card slides out in Instrument Serif Italic 56 px. The source line appears.
- **f 110–150:** a **Stamp** (340 px tall) slides in from the top, holds 4 f, and **stamps** onto a
  document (6 f `E.inQuad`, 2 f hold, `impact.hit`). The camera shakes 8 f at 10 px. When the Stamp
  lifts, the document carries a **red ink ring**: the one red thing.
- **f 150–210:** the camera leans in 12 % on the ring. Inside it, a brass clock face ticks its minute
  hand back one hour in 4 ticks of 4 f each.
- **f 210–240:** the Winder enters bottom-*left* (on twos), clear of the player-UI keep-out. It looks
  back at its own key (dial hand back), which spins **backwards**: the gag. Hold 24 f.
- **f 240–270:** **T7 stamp-cut** into the next scene.

### RC-6: "Chapter Card and the Run-Down" (chapter turn, 7 s, 210 f, plus the end-screen variant)
*VO: none. The music carries the card.*
- **f 0–12:** a teal-shade plate `#1d6662` (v1.1 default for chapter cards; it doesn't use the night
  ration). The drone stays, and the ostinato drops out.
- **f 12–40:** a brass **counter wheel** rolls the chapter numeral in Archivo Narrow 700, 220 px:
  "03". The numeral is **paper-coloured**, and the **open-loop red element** (§22.3) sits beside it
  as the one red thing. The last digit ticks with an 8 % overshoot (`ui.tick`).
- **f 40–100:** the chapter title writes on, one letter per frame, in Instrument Serif 110 px, paper
  colour: "The Rain Stops". A Plex Mono kicker types under it: "PANAMA · 2023".
- **f 100–150:** Hold. The coil mark (60 px, paper at 85 %) turns slowly at bottom-left, 4 ticks
  over the hold.
- **f 150–180:** **T1 case-open** in reverse: the plate is the inside of a lid, which hinges down to
  reveal the paper world of the next chapter.
- **f 180–210:** the new chapter's establishing shot, with the ostinato returning in the new key
  (`score` `sections`).

**End-screen variant (20 s):** the Winder winds a large brass key in a paper box marked with the next
episode's title. Its own key slows and **runs down** (a 40 f slump, the dial hand drooping to 6,
the ostinato detuning). The box springs open with the coil mark inside. The two YouTube end-screen
elements sit in the left and right thirds; the Winder stays in the centre.

---

## 17. How it runs in our engine, and the build list in priority order

**What exists now [proto]** in `projects/paper-lab/scene.js`, rendering through `engine/render.mjs`
on the 2D canvas overlay path:
- drawing: `pen()` (the off-register shape), `halftone()` (world- or screen-fixed), `hatch()`,
  `deckle()`, `lampShade()`, `paperGround()`;
- parts: `gearPath()`, `openCase()`, `coil()`;
- characters and labels: `winder()` with `POSES` and the dial hand, `tally()` / `tallyGroup()`
  (filled, hollow), `stampBlock()`, `tag()`, `mono()`.

All of these are pure functions of `t` and seeds (`M.rng`).

**Priority list for ep10** (P0 = ep10 cannot ship without it; P1 = ep10 is weaker without it;
P2 = later):

| P | Item | Notes |
|---|---|---|
| P0 | Promote the paper-lab helpers into `sets/paper` (2D canvas set family) + `camBreath(t)` + `tick(u, n)` | Cache halftone per object as a pattern canvas, keyed by (shape, pitch, density) |
| P0 | `engine/people/paper.js`: Winder rig (24 poses, key states, dial hand), Tallies (instanced), Stamps, Cameo, **Figure** rig | The acting is the reach; §6.7 |
| P0 | Counter wheel, string tags, ticker tape, survey-sheet map + red thread + water-lining | Most-used devices |
| P0 | **History kit (§20)**: front lines with ratchet teeth, army blocks, damage cards, smoke and fire cut-outs, ships at scale, period-dress Figure library for ep10's event | Only what ep10's script calls for |
| P0 | T1 `case-open` transition | Signature; fallback `page-turn` is acceptable for the animatic |
| P1 | Inter 600/900 woff2 in `assets/fonts` | Archivo Narrow 700 is the stand-in |
| P1 | `sfx` presets `bell`, `ratchet`, `windup`, `latch`, `hinge`; `score.py` cue type `box` | `clock.tick`, `ui.ticks` and the `clunk` cue exist now |
| P1 | Chart recorder (§9.8), gauge, loupe ring (T2), `fold` (T6) | Only if the script has the data beat |
| P1 | Vertical reframe helper (§21) | For the 3 Shorts |
| P2 | Gear-train meshing maths (`ω₂ = −ω₁·n₁/n₂`), balance, `inOutBack(s)` in motion.js, score tempo ramp, 3D toy-theatre flats (§5.1) | |

**Look and QA:**
- **Grade:** a `paper-day` preset with almost no grade (contrast 1.04, sat 1.0, floor 0.02, white
  0.975, grain 2, vignette 0.06), so the paper never goes grey or yellow.
- **Automated per-frame QA** (extend `projects/paper-lab/check.py` into the draft pass):
  - mean L 0.80–0.92 and S 0.06–0.20 on body frames;
  - red share ≤ 3 % and exactly one significant red component;
  - no pixels in the banned hues;
  - text ≥ 20 px;
  - halftone on-screen pitch within 8–18 px;
  - the distinctness test (§0.3) by eye on 10 random frames.

---

## 18. One-page checklist (pin this to every animated shot)

- [ ] A brass mechanism is visible in the frame or the one before it. **(Mandatory.)**
- [ ] Exactly one red thing, also shape-coded. **(Mandatory.)**
- [ ] At least two of: paper ground (or a rationed plate); the off-register navy pen line; halftone
      or hatching shade.
- [ ] One lamp, top-left. Shadows are hard, offset down-right, 12 % ink.
- [ ] Hairlines that carry meaning are ≥ 2 px; halftone pitch on screen is 8–18 px.
- [ ] People are round, power is square, danger and fronts have ratchet teeth.
- [ ] Characters are on twos; mechanisms, camera and type are on ones. Poses break the silhouette.
- [ ] Overshoot ≤ 10 %. Squash only on round things, ≤ 8 %.
- [ ] One camera move per VO sentence.
- [ ] Every number has a unit, a source line and grid maths that closes.
- [ ] Something ticks during every hold.
- [ ] Type is clear of the bottom-right player-UI keep-out.
- [ ] It passes the six-look distinctness test (§0.3).

---

## 19. Proof: the paper lab [measured]

**Run it:**
`node engine/render.mjs projects/paper-lab --stills=0.5 && python3 -I projects/paper-lab/check.py`.
The stills land in `projects/paper-lab/out/stills/`. The checks write `renders/paper-lab/`
(`report.json`, `moire-v2.json`, `feed-light.png`, `feed-dark.png`, `moire-p*.png`,
`compress-*.png`).

### 19.1 Style frames rendered with the engine (9)
| Frame | Proves |
|---|---|
| `sf-case` | RC-1 at f 150 |
| `sf-acting` | The pose sheet |
| `sf-front` | The history module map |
| `sf-thumb-paper`, `sf-thumb-teal`, `sf-thumb-night` | The thumbnail grounds |
| `sf-stress`, `sf-stress-z13` | Halftone, hairlines and type, at camera scales 1.0 and 1.3 |
| `sf-vertical` | The 9:16 hook frame with the Shorts UI zones |

**Verdict:** the off-register line, halftone, hatch, deckle, water-lining and hard shadows all
render deterministically on the existing 2D overlay path. **No engine change was needed.**

### 19.2 Characters
- **v0, faceless round head:** idle, run-down, panic and proud read. Look-back did not: with no
  face, the direction of gaze can't be read.
- **v1, dial head + one gaze hand:** idle, run-down, panic and look-back read at a glance. Proud and
  shrug are weak, because their key limb stays inside the silhouette. That gave the silhouette rule
  in §6.7.
- **Still unproven:** whether a sad or funny *beat* lands in motion (timing, holds, sound). **Test
  before the animatic locks:** a 20 s animated beat (run-down + the take) rendered in the ep10
  animatic and shown to 5 people with the sound on. Do they say "aw" or laugh unprompted? If fewer
  than 3 of 5 react, add the prop card and re-test.

### 19.3 Feed test
§15.2. The paper ground fails in the light-mode feed; teal-shade passes in both modes.

### 19.4 Compression (SSIM vs. the master, frame 45 of a 3 s slow lean-in, scaled back to 1080p)
| Encode (bitrates approximate typical YouTube deliveries [assumption]) | Global | Halftone 11 px | Halftone 8 px | Hairlines | Plex Mono 22 px |
|---|---|---|---|---|---|
| VP9 1080p, 1.2 Mb/s | 0.988 | 0.976 | 0.971 | 0.985 | 0.996 |
| AV1 (SVT) 1080p, 0.8 Mb/s | 0.989 | 0.978 | 0.976 | 0.985 | 0.994 |
| VP9 720p, 0.7 Mb/s | 0.971 | 0.962 | 0.952 | 0.949 | 0.988 |
| VP9 360p, 0.25 Mb/s | 0.886 | 0.880 | 0.878 | **0.783** | 0.939 |

On the RC-1 frame (`sf-case`), VP9 1080p measured 0.995 globally and 0.989 on the pen line. The
paper-fibre σ went from 0.19 grey levels to 0 in every encode (§4).

**Caveats:**
- The stills come from the engine as JPEG q85, so the test starts from a mildly compressed master.
- The bitrates are our assumption, not published YouTube figures.
- The moiré test (§4.1) used lossless synthetic patches with the same dot law.

### 19.5 Render cost
Stills on this 4-vCPU container: **≈ 0.66 s per 1080p frame** for one browser (9 shots × 4 frames in
26.2 s, minus a 5.2 s single-shot baseline). That includes halftone drawn every frame without
caching. §23 has the projection.

### 19.6 Before the master
Re-run `check.py` on 10 frames of the ep10 draft. Re-run the feed test with the real thumbnail
candidates. Watch the 360p YouTube preview of an unlisted draft upload on a phone.

---

## 20. History module (ep10's likely topic: a big, famous historic event)

The study's strongest topic recipe is "a household name, one narrow surprising door into it"
(`README.md` §2.1, §3.1). This module is the kit for showing it in Paper & Spring.

### 20.1 Conflict staging [spec]
- **Armies:** **blocks of tallies under a Stamp**. Side A = filled `ink` tallies; side B = **hollow**
  tallies (paper fill, ink line). It's shape-coded, so it works in greyscale and for colour-blind
  viewers.
  - A third party uses `brass` tallies; neutrals use sage.
  - The key gives what one group is worth ("1 GROUP = 5,000 MEN"). The block size is
    proportional [rule].
  - Movement: blocks slide on straight lines (`E.editorial`), and tallies march on twos with a 1 px
    bob.
  - Never game tokens, chess pieces, little soldiers with faces or flag-coloured blobs.
- **The front line:** a 3.5 px `ink` line with **ratchet teeth** on the attacker's side, pointing the
  way it advances. It is our "danger = ratchet tooth" grammar.
  - **Earlier fronts** stay on the sheet as dashed `ink-40` ghosts with Plex Mono month tags. The
    viewer sees the whole history of the line at once [measured: `sf-front`].
  - Fronts move by **ticking**: one ghost is laid down per time step, and the current line ticks to
    its new position in 6 f with a 3 % overshoot.
- **Fronts over time (the map spine):**
  - The survey sheet stays fixed while a **ticker tape** (§9.5) across the top shows the date.
  - Each tape step lays down a new front.
  - Territory changing hands is shown by a **hatched band** between two fronts, never by
    recolouring whole countries.
- **Battle in close-up (toy theatre):** layer 3 is a posterised sky; layer 2 is ink tallies in rank;
  layer 1 is the Figure of the commander. Fire and smoke cut-outs (below) sit between the layers.
  The camera **holds**, and the action is cut, not orbited.
- **Ships at scale:** paper silhouettes traced from public-domain plans, drawn **to scale with each
  other** (a stated scale bar in Plex Mono). Fleets are rows of identical cut-outs, using the Winder
  Unit or a ruler for size.
  - Waves are 3-step posterised bands with deckle crests that tick (move 2 px every 8 f).
  - Sinking: the ship tilts in 3 ticks, then slides down behind a sea band.
- **Weather:** rain = 2 px `ink-40` dashes falling on ones in 3 seeded layers. Snow = paper dots
  with halftone shade. Wind = tallies and flags leaning together. Fog = paper overlay at 35 % on
  layers 2–3.
- **Crowds in motion:** tally blocks of up to about 400 instanced tallies per frame. A flowing crowd
  is a teal tally river with sway phase running down the stream. A panic is tallies scattering
  radially on a single seeded rule (the Primer-style simulation technique, `README.md` §3 #25).

### 20.2 Damage and destruction in paper [spec]
| Event | How it looks |
|---|---|
| **Explosion** | A 2 f paper "flash" card (`brass-light`, a star cut with 8 points, deckle edge), then a ring of paper fragments flying out (8–14 polygons, `E.decel`, rotating), then **smoke puffs** (card circles with halftone shade, stacked, rising 1 px/f, at most 4) [measured: `sf-front`]. Camera shake §8. Sound: `impact.boom` low-passed |
| **Fire** | Paper flame cut-outs (3–5 pointed shapes, `brass-light` + `paper`, ink line) that **flip between 2 shapes on twos**. Never red, because red is reserved. Never glowing |
| **A destroyed building or town** | The card is **torn** (a deckle notch cut out of the shape) and the remaining face is **hatched** (§4: hatched = destroyed). Rubble = 5–8 small kraft polygons at the base. Before and after are shown as a T5 card flip |
| **A sinking or wreck** | The silhouette rotates to 25° in 3 ticks and sinks behind the posterised sea band. A Plex Mono tag gives the date and the losses |
| **A breach or collapse** | `paper.tear` sound; the card splits along a seeded tear line and the halves slide apart 12 px |

### 20.3 Period dress and household-name figures
- Figures follow §6.4(b): realistic proportions, an ink-70 silhouette, the dial head and two
  signature props.
- **The dress library** is built per episode from **public-domain portraits and uniform plates**:
  the coat silhouette, the headwear and one colour accent.
  - The accent may be **teal, sage or brass, never red** (unless the figure *is* the one red thing,
    e.g. a single red sash that the story is about).
  - Each figure gets a reference card in the project folder with its PD sources.
- **Recognisability:** §6.4. When three or more famous figures share a scene, **each keeps a
  consistent accent colour for the whole episode**.

### 20.4 Maps of fronts over time
§13 + §20.1, with these additions:
- a date ticker at the top;
- ghost fronts with month tags;
- the hatched band of changed territory;
- army blocks with their key in the top-left box;
- **one red pin**: the place the story's narrow door opens on (the bridge, the room, the ship).

### 20.5 Casualties, shown with respect [rule]
- **Numbers, never bodies.** No depicted corpses, blood or wounds, and no figure falling as a gag.
- **The losses ledger:** losses appear as **hollow tallies that do not sway** (stillness is the
  respect), set in a quiet grid on paper. The key gives what one tally is worth, and the source line
  is mandatory. The tallies fill **one group per 2 frames**, slower than any other grid in the
  episode.
- **Sound and picture:**
  - The music drops to the drone (`silenceDrone` or a `swell` down). There is no tick and no foley
    during a casualty count.
  - Hold for at least 60 f after the number lands. No camera move except a slow 4 % lean-out.
- **No comedy** within 30 s of a casualty beat, and never comedy about the victims. Comedy aims at
  the powerful, the absurd plan or the bureaucracy (Stamps), never the dead.
- **Names over numbers where possible:** one named person (a Cameo, or a red tally with a name tag)
  carries the human cost (`README.md` §3.18).
- **Disputed figures:** show the range ("12,000–15,000") on two counter wheels, with both sources.

### 20.6 H-1: "The Front Ticks Forward" (history reference composition, 8 s, 240 f)
*VO: "By October, the line had moved forty kilometres. And the only bridge was still standing."*
(Illustrative; based on the `sf-front` frame.)
- **f 0–20:** the survey sheet as `sf-front`: water-lined coast, the AUG and SEP ghost fronts,
  side A ink blocks under the tower Stamp (east), and side B hollow blocks under the wave Stamp
  (west). A key box sits top-left. The date ticker at the top reads "SEP".
- **f 20–50:** the ticker steps to "OCT" (`type.run`). The SEP front turns into a dashed ghost
  (4 f), and the current front **ticks** 140 px west in 6 f with a 3 % overshoot. Its ratchet teeth
  pop in along the new line on a 1 f stagger. Then `impact.soft`.
- **f 50–90:** the hatched band appears between SEP and OCT (a 20 f left wipe). The side A block
  slides west on `E.editorial`.
- **f 90–130:** the town on the new front is hit:
  - a 2 f flash card;
  - fragments;
  - the town card tears (`paper.tear`) and goes hatched;
  - 3 smoke puffs rise;
  - flames flip on twos.

  Camera shake 8 f at 10 px. `impact.boom` at −12 dB, low-passed.
- **f 130–170:** a ruler tag swings in between the ghost and the current front: "≈ 40 KM", with the
  source line.
- **f 170–210:** the **red pin** at the bridge pulses once (a 6 % scale tick) with its dashed ring.
  The camera leans in 12 % on it.
- **f 210–240:** Hold. Ink tallies sway at ±2°; hollow tallies don't move. Cut on a tick.

---

## 21. Vertical and Shorts (9:16) [spec, measured: `sf-vertical`]

The ep10 plan includes three 30–45 s vertical cutdowns (`README.md` §3.22).

- **Canvas:** 1080 × 1920. Build vertical shots **natively in the set** (a separate camera framing),
  not by cropping the 16:9 master: our left/right-third grammar doesn't survive a centre crop.
- **Safe areas** [hypothesis: our working zones; verify against YouTube's current Shorts overlay
  before upload]:
  - the **top 120 px** stay clear (search and back buttons);
  - the **right 120 px** from y = 640 to 1540 stay clear (the like, comment, share and remix rail);
  - the **bottom 380 px** stay clear (title, channel, sound line and progress bar).

  That leaves a live area of about 960 × 1420 px.
- **Reframing the third-grammar:** the left/right thirds become **top/bottom thirds**. The subject
  goes in the middle third, the label or word block in the top third (y 140–520). The bottom third
  only holds secondary items that can be covered.
- **Ground:** the teal-shade coloured plate (§1.4), the same as the thumbnail. Paper insets are
  allowed inside the frame as cards.
- **The 1–3 s hook frame [rule]:**
  - **Frame 1 is the payoff image** (the opened case with the red part, or the front at its worst),
    not a title card or logo.
  - 1–3 burned-in words in Inter 900 / Archivo Narrow 700, 110–130 px, paper colour, top third.
  - Something ticks by frame 6.
  - The Winder or Figure is in an acting pose by 1.0 s.
- **Captions:** word-by-word burned-in captions in **Archivo Narrow 700, 64–72 px, paper on an ink
  tag**, in the lower half of the live area (y ≈ 1240–1500). They're our type, not the Shorts
  default white-on-shadow.
- **Line weights:** use the thumbnail weights (6 px pen line, 8 px misregistration). Halftone pitch
  is 14 px, because phones show the vertical frame at near-native size but viewers glance at it.
- **Loop:** the last frame matches the first (same composition, same red thing), so the loop reads
  as one continuous tick.
- **Pace:** a picture change every 1.0–1.8 s [hypothesis, from Zack D.'s 14M-median Shorts
  grammar in `zack-d-films.md` §3, where picture changes weren't measured].

---

## 22. Cold open and retention: visual grammar per beat

The structure comes from `retention-script` and the autopsies (`README.md` §2.2–2.3,
`video-autopsies/README.md`). This section is how each retention beat **looks**.

### 22.1 The hook frame (0–3 s) [rule]
- **Frame 1** is already inside the story: the **red thing on screen**, an acting character, and a
  date or place set *in the world* (on the ticker tape or a tag; `README.md` §3.4). There is no logo,
  no title card and no black frame.
- **By 1.0 s** something has moved decisively (a tick, a stamp, a case starting to open).
- **By 3.0 s** the first spoken line has landed, and the image shows its noun. The second shot is a
  cut on a tick (T8).
- The cold open runs the faster rate (22–30 picture changes per minute [hypothesis]) and uses the
  **escalate-then-undercut** visual pattern (`README.md` §3.3): 3–4 escalating images, each bigger
  on the gear-train scale, then a hard stop, a held frame and silence.

### 22.2 The contract beat (by 0:30–0:40)
The promise is shown as a **mechanism with one part missing**: a case with an empty red socket, a
counter wheel showing "?", or a map with the red pin unlabelled. The viewer can see the gap the
video will fill.

### 22.3 The open-loop red thing (carried across chapters) [rule]
- The episode's open loop is **one red object**, introduced in the cold open: the red gear, the red
  pin, the red "?" tag.
- It **reappears on every chapter card** (RC-6) beside the chapter number, in a state that shows
  progress: a gauge needle further along, more of the socket filled, the case lid a little more
  open.
- It is **only fully opened at the payoff** (the T1 case-open on the red object itself), with the
  episode's last `bell`.

### 22.4 Re-hook visual devices (every 30–40 s in the body) [default]
Rotate them; the same device never comes twice in a row.
1. **A tick-stop:** the ticks and ostinato stop, a 20 f hold, then the reveal.
2. **The counter wheel** rolling to a new, surprising number.
3. **The red pencil** circling something already on screen that the viewer missed.
4. **The Winder's take** (pin only, facing the viewer) after an absurd fact.
5. **A camera lift** that reveals the current scene is one cell of something bigger (§12).
6. **"Good news! Wait, no":** a paper plate turns sage (calm) for 2 s, then T7 stamp-cut to the
   consequence (`README.md` §3.12).
7. **A participatory pause:** a brass countdown dial (3, 2, 1) for a viewer guess (`README.md` §3.8).

Signature transitions (T1–T3) count as re-hooks but stay within their 1-per-60 s budget.

### 22.5 Sponsor or CTA, the payoff and the end
- **The CTA happens on an object in the set** (a tag, a card in the Winder's hands). It enters with
  T5 and exits with T5, so it has clean visual boundaries.
- **The payoff:** the red object is opened (T1), followed by the longest hold in the episode
  (60–90 f), with the bell.
- **The end** calls back the first frame's composition (`README.md` §3.17), then the RC-6 end-screen
  variant.

---

## 23. Production budget (12–20 min, fully animated)

For scale: Kurzgesagt reports about 1,200 hours per video (`kurzgesagt.md`; rosetta.to, *How to
Make a Kurzgesagt Video in 1200 Hours*), with a team of illustrators and animators. Our budget
depends on code reuse. **These numbers are [estimate] until ep10 is logged against them.**

### 23.1 Targets for a 15-minute episode
| Item | Target | How it was derived |
|---|---|---|
| VO words | 2,200–2,600 | 150–170 wpm (`README.md` §2.3) |
| Picture changes | 220–270 | §8 [hypothesis] rate × 15 min |
| **Unique sets** (distinct compositions or worlds) | **28–36** | Each set serves 6–9 shots through slides, lean-ins and state changes |
| Signature transitions | 12–15 | At most one per 60 s |
| Rigs | Winder (1, 24 poses), Tally (instanced), Stamp (6–10 emblems), Cameos (4–8), Figures (3–6) | §6 |
| Props (paper cut-outs) | 60–90 | About 3 per set |
| Maps | 6–10 sheets (one Natural Earth base re-used) | §13, §20 |
| Data devices | 8–12 (counter wheels, tally fields, 1–2 chart recorders) | One hero number per chapter |
| Scale ladders | 1–2 | §12 |
| Shorts | 3 vertical cutdowns, 30–45 s | §21 |

### 23.2 Time (agent and render)
| Phase | Estimate |
|---|---|
| P0 kit build (§17) | 3–4 working sessions |
| Sets | 1–2 h each → 30–60 h of agent time, the biggest cost. Reuse lowers it: a map sheet or tally field set reskins in about 20 min |
| Animatic (draft, half-res, no halftone) | 1 session |
| Render | 15 min = 27,000 frames. At the measured 0.66 s/frame per browser (§19.5) with 3 workers: **≈ 1.7 h**, plus encode and finish. Caching halftone per object should halve it. A half-res draft is ≈ 0.5 h |
| Sound (score, sfx cues) | 1 session |
| QA (check.py, the distinctness test, fact-check pass) | 1 session |

### 23.3 What to cut first if over budget
Cut in this order:
1. Signature transitions down to 8 (use T8 and slides).
2. Chart recorders down to one (use ruler bars).
3. The 3D toy theatre (stay 2D).
4. Figures beyond 3 (use Cameos).

**Never cut:** the hook frame, the open-loop red object, the acting beats, or the sources.

### 23.4 Hypotheses register (settle with ep10 data)
| # | Hypothesis | Where | Test |
|---|---|---|---|
| 1 | A low-saturation body doesn't hurt retention | §1.3 | Retention vs. earlier episodes; a 2-chapter A/B in the draft |
| 2 | 15 % night ration (35 % topic exception) | §1.4 | Viewer probe on the draft; check that night chapters keep retention |
| 3 | 14–20 / 22–30 picture changes per minute | §8 | Per-chapter cut count vs. the retention graph |
| 4 | A coloured ground beats paper in the feed | §15 | H1 Test & Compare |
| 5 | An acting character beats object-only | §15 | H2 |
| 6 | The faceless dial-head Winder carries a sad and a funny beat | §19.2 | 5-person animatic probe |
| 7 | Shorts safe zones and pace | §21 | Overlay check before upload; Shorts retention |

---

## Sources

**In-repo study (evidence for the traits used in §0 and §15):**
- `docs/library/animation-study/README.md` (method, data table, techniques, guardrails)
- `kurzgesagt.md` §3, §6; `ted-ed.md` §3 (9 thumbnails observed); `oversimplified.md` §3, §6
  ([observed] only); `minuteearth-minutephysics.md` §3, §6 (9 + 9 thumbnails observed);
  `zack-d-films.md` §3; `other-animated-outliers.md`
- `docs/masters/kurzgesagt.md`, `docs/masters/disney-12-principles.md`,
  `docs/library/video-autopsies/kurzgesagt.md`, `docs/library/bright-style/STYLE.md`,
  `brand/BRAND.md`

**Process sources:**
- Kurzgesagt, "Our video process": https://kurzgesagt.org/youtube/ (sketching visual metaphors
  first, 2D vector illustration, about 1,200 hours per video); rosetta.to, *How to Make a
  Kurzgesagt Video in 1200 Hours*.
- University of Michigan Arts, "Simple, Bright, Beautiful: The Work of Kurzgesagt":
  https://artsatmichigan.umich.edu/ink/2019/09/27/simple-bright-beautiful-the-work-of-kurzgesagt
- **TED-Ed:**
  - Animafest Zagreb 2016, "Where education meets animation":
    https://www.animafest.hr/en/2016/side_event_pro/read/ted_ed_where_education_meets_animation_gerta_xhelo
    (300+ independent animators and studios, so the style varies per lesson, including paper
    cut-out);
  - Cartoon Brew, "Buzzco creates animation for TED's TED-Ed initiative":
    https://www.cartoonbrew.com/biz/buzzco-creates-animation-for-ted%e2%80%99s-ted-ed-initiative-61854.html;
  - Ofcom PSB review, TED-Ed case study:
    https://www.ofcom.org.uk/siteassets/resources/documents/tv-radio-and-on-demand/broadcast-guidance/psb/psb3/10._ted-ed.pdf
- **MinuteEarth:** rosetta.to, *How We Make MinuteEarth Videos (behind the scenes)*:
  https://rosetta.to/u/minuteearth/how-we-make-minuteearth-videos-behind-the-scenes (writer-led
  process, illustrator storyboards, then final drawings). Its visual traits (white or paper ground,
  line art, faces on objects) are [observed] from 18 thumbnails plus [recall].
- **OverSimplified:** no reliable published write-up of its production process. The traits in §0
  come from viewing, are labelled [observed], and are listed only so we can avoid them.
- **Example facts in §16:**
  - USDA ERS, Dimitri, Effland & Conklin, *The 20th Century Transformation of U.S. Agriculture and
    Farm Policy* (EIB-3, 2005): farm share of the workforce 41 % (1900), 1.9 % (2000);
  - US National Park Service, Washington Monument height 555 ft 5⅛ in (169.3 m);
  - Mount Everest 8,848.86 m (the joint Nepal–China survey, 2020).

  Re-verify all three before they're used on screen.
- **Paper lab:** `projects/paper-lab/` (scene, project, checks) and `renders/paper-lab/` (outputs).
