# Editing, transitions and motion: how the best editors and motion designers do it

Research notes behind `engine/transitions.js`, `engine/motion.js` and `engine/sfx.py`. The API and
the measured costs are in `docs/motion/README.md`. This file covers the craft: what each device
means, when it earns its place, and how we build it.

Tags: **[primary]** means the creator, the vendor or the original author. **[secondary]** means a
journalist, a tutorial or a third-party summary. **[house]** means our own rule, inferred from the
sources and from `docs/style-bible.md`. This file extends `docs/research/visual-craft.md` §3–4
and does not repeat it. Accessed 2026-10-11 unless noted.

**A warning about sources.** Most "how X edits" material online is SEO filler or marketing for a
tool. Below is only what held up when checked. Where a claim is thin, the note says so. The
creators below publish little about their process, so many rules are inferred from the work.

---

## 1. First principles

1. **A transition is a sentence, not a decoration.** Murch ranks what a cut must serve:
   emotion > story > rhythm > eye-trace > 2D screen plane > 3D space. Emotion alone is "over half"
   of a good cut [secondary: [StudioBinder](https://www.studiobinder.com/blog/walter-murch-rule-of-six/)].
   An effect that serves none of these is a template.
2. **The default is the cut.** Every other device costs attention, so it has to *say* something:
   time passed, we went deeper, we moved sideways, this became that [house]. MrBeast went back
   toward this in 2024: he slowed his videos down, added breathers and cut back on screaming and
   flashing, and his views still rose [secondary: [GIGAZINE](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end)].
3. **Cut on sound.** Our style bible already says cuts land on a clunk, boom or clang. Every
   transition in our library names its sound, and every sound has an *anchor* (its peak) that sits
   on the cut. A whoosh should match the length of the move and peak on the cut, and a whoosh that
   ends in a hit makes the move "arrive"
   [secondary: [Morphic sound notes](https://morphic.com/resources/sounds/whoosh-sound-effect)].
4. **Plan transitions at the storyboard stage.** Kurzgesagt sketch the visual metaphors and the
   transitions between ideas *before* animation [primary talk, via `visual-craft.md` §1]. Apple's
   pre-recorded keynotes show the same discipline: transitions such as dropping through a floor
   hatch into a lab, or passing through the camera module into a fly-in on Apple Park, were planned
   as shots [secondary: [9to5Mac on Adam Grasso's breakdown](https://9to5mac.com/2023/06/21/apple-keynote-videos-transitions-and-editing/)].
   **[house]** The `shot-design` skill picks the transition when it picks the shot, never in the edit.

## 2. What the reference channels do

| Channel | What's documented, or visible in the work | What we take |
|---|---|---|
| **MrBeast** | "Retention editing": fast cuts, loud sound effects, flashing effects, no dead air. In 2024 he publicly moved toward story, breathers and longer videos [secondary: [GIGAZINE](https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end), [Preaching Today summary](https://preachingtoday.com/illustrations/2024/june/are-hypnotic-youtube-edits-getting-old.html)]. Cut-rate figures online (for example "12–20 cuts/min") come from vendor blogs and are unverified. | Keep the *principle* (no dead air, a sound on every change) and drop the *texture* (flashing, screaming, constant zooms). For us, pace comes from information density, not effects. |
| **Johnny Harris / Vox** | Vox animates graphics at 12 fps inside a 24 fps edit for a stepped, handmade feel. Textures cycle 2–3 times a second. The "tracking" transition places two shots as 3D layers and moves one camera back through both, with a blur that peaks at the cut and is shorter than the move [secondary: [PremiumBeat](https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/)]. Harris builds maps with GEOlayers over Mapbox styles [secondary: `visual-craft.md` §1]. His look is physical: paper, desks, a camera moving over printed material [secondary: [RNDR newsletter](https://rndr.beehiiv.com/p/5-visuals-next-video-ead0)]. | `push` and `pull-back` are the tracking transition, with the blur peaking at the cut. Use `M.onTwos(t, 12)` to step overlay motion. `paper-tear`, `ink-bleed` and `page-turn` cover the paper language. Map routes use `callout.route`. |
| **Kurzgesagt** | Script, then visual planning: they look for metaphors and transitions between ideas, then budget the hero scenes. Motion is hand-keyed, and the sound design is one "you don't consciously notice" [primary talk via `visual-craft.md`]. Their signature move, an endless zoom from one scale to the next, is widely described, but only by low-quality sources. | `zoom-through` with a `match-dissolve` at the end, so one scale *becomes* the next. Sound sits under the picture: `swell.reverse` and soft whooshes, not hits. |
| **Fern** | One object in a void, dioramas, red as the only accent, slow cameras, few hard cuts (`docs/fern-breakdown.md`). | Restraint: `dissolve`, `focus-pull` and `match-dissolve` do most of the work. Red appears only in annotation (`callout.doc`, `text.highlight`). |
| **LEMMiNO** | Works mostly alone: Premiere, After Effects, Cinema 4D. He cuts drafts hard and treats a video as finished "when the pacing and presentation are right" [secondary: [Q&A summary](https://rosetta.to/u/lemmino/4-000-000-q-a)]. The visible craft is long holds, slow glow-lit 3D and type set like a book. | Fewer, longer shots. Type `maskUp` and `perChar('track')` reveals. Dips to black between movements. |
| **PolyMatter** | His own course runs research → story → script → graphic design → colour → shapes → animation [primary: Skillshare, via `visual-craft.md`]. | Design the palette and shape vocabulary *before* animating. Our motion kit is one vocabulary: serif, mono, red, hairlines. |
| **Neo, MagnatesMedia** | No primary material found. Job ads that name these channels as references ask for animated charts, timelines, maps, UI overlays, kinetic type and "smooth transitions" [secondary: [Upwork posting](https://www.upwork.com/freelance-jobs/apply/YouTube-Documentary-Animator-Motion-Graphics-Editor-Needed-Vox-MagnatesMedia-Style_~022061919757222663022/)]. | This is the genre's data vocabulary: `data.barRace`, `data.line`, `card.timeline`, `callout.route`, `text.counter`. |
| **Bloomberg Quicktake** | No primary design material found. Kinetic-type guidance for news explainers: 3–7 words per frame, one type family with a clear weight hierarchy, move the frame rather than individual letters, save per-letter animation for a few key words, and check readability with the sound off [secondary: [Pexo tutorial](https://pexo.ai/tutorial/how-to-make-a-kinetic-typography-explainer-video)]. | **[house]** Per-character animation is for one word per shot at most. Everything else moves by line or by word. |
| **Apple keynotes** | Seamless "through-object" transitions (through a hatch, through a lens into a building) that are hard to spot without frame-stepping [secondary: [9to5Mac](https://9to5mac.com/2023/06/21/apple-keynote-videos-transitions-and-editing/)]. Keynote's Magic Move animates the same element between two states [secondary: [Hack Design](https://hackdesign.org/toolkit/keynote)]. | `pass-through` (a foreground occluder wipes the lens), `zoom-through` (into a point), `shape-box` (a frame becomes the shot), `match-cut` / `match-dissolve` (Magic Move for whole frames). |

## 3. The craft, device by device

For each device: what it is, when to use it, and the library call. `TR` is `engine/transitions.js`,
`M` is `engine/motion.js`, and `sfx` is `engine/sfx.py`.

### Match cuts
- **Graphic match.** A shape, colour or composition carries across the cut and invites a
  comparison: the *2001* bone-to-satellite cut, or *Citizen Kane*'s opening, which "uses graphic
  matches several times". A graphic match can compress time across a straight cut or a dissolve
  [secondary: [StudioBinder](https://www.studiobinder.com/blog/match-cut/)].
  **Ours:** `TR.matchAnchors(a, b, u)` takes the hero's screen position and size in each frame
  (`{x, y, s}`). `'match-cut'` converges the two anchors and cuts at the midpoint.
  `'match-dissolve'` converges them while dissolving. A common zoom keeps both frames covering
  the screen (see §6 of the README). In 3D sets, use `TR.alignTransform` or frame the incoming
  camera so the hero lands on the same pixel at the same size (`visual-craft.md` §3). Sound:
  `impact.soft` on the cut, or `swell.reverse` into the dissolve.
- **Match on action (motion match).** Movement carries across the cut: the same direction and
  roughly the same speed. Cut mid-movement so the eye follows through. **Ours:** C1 camera
  velocity carry-over in `engine/cine.js` (`carry: outgoingRig`), plus `whip` or `slide` with
  `dir` matched to the move.
- **Sound match / sound bridge.** A sound links two images: the clock tick becomes footsteps, the
  typewriter becomes gunfire [secondary: [StudioBinder types of match cuts](https://www.studiobinder.com/blog/match-cuts-types-of-cuts/)].
  **Ours:** place one `sfx` cue that spans the cut (for example `clock.tick` across a dip), or end
  the outgoing ambience on the incoming hit.

### J-cuts and L-cuts
The incoming shot's sound starts under the outgoing picture (J), or the outgoing sound carries over
the incoming picture (L). Documentaries use them to carry VO and ambience across b-roll and change
location smoothly [secondary: [Vimeo](https://vimeo.com/blog/post/j-cuts-l-cuts),
[SpotlightFX](https://spotlightfx.com/blog/what-are-j-cuts-and-l-cuts-professional-dialogue-editing-explained)].
**Ours [house]:** start each set's ambience (`room.tone`, `city.amb`, `wind.amb`) 0.3–1.0 s before
its picture cut. That is a J-cut by default, and it makes even a hard cut feel motivated.
L-cuts: let the outgoing ambience fade over the first 0.5 s of the new shot. `sfx.place` anchors by
time, so a J-cut is just `at = cut − 0.6`.

### Speed ramps
Speed changes inside one continuous shot: it eases into slow motion or a burst and back out
without a cut, for emphasis. The ramp needs eased keyframes to feel natural
[secondary: [Motion Array](https://blog.motionarray.com/learn/premiere-pro/premiere-pro-speed-ramping-tutorial/),
[Film Lifestyle](https://filmlifestyle.com/how-to-speed-ramp-in-premiere/)].
**Ours:** `TR.speedRamp(t, { at, dur, peak })` remaps shot time to content time. Speed follows a
raised cosine from 1 up to `peak` and back, integrated in closed form, so the remap is C1 and
deterministic. Ramp *into* a `whip` (speed up for the last 0.4 s before the cut) or *out of* a hit
(slow, then release). Feed the remapped time to the camera rig, not to the narration.

### Zoom transitions (push, pull, zoom-through, radial)
The Vox tracking transition: the camera moves through both shots and a blur peaks at the edit.
The blur is shorter than the move [secondary: [PremiumBeat](https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/)].
**Rules [house]:** forward = deeper into the same subject (`push`); backward = context
(`pull-back`); through a point = into what the point stands for (`zoom-through` with `at` on the
window, pupil or map pin). `radial-zoom` is the energetic version: use it rarely. Sounds:
`whoosh.s`, `whoosh.l` or `whoosh.xs`, sized to the move (`sfx.whoosh_for(dur)`).

### Whip pans
Match the direction and approximate speed out of A and into B, blur both sides, and cut at the
peak of the blur. A whip reads as "moved sideways in space, not forward in time", so use it for
simultaneous places and parallel action (`visual-craft.md` §3). **Ours:** `whip` (blur of up to
32% of frame width, two-pass box filter so there is no stepping) and `slide` (light blur, for the
next item in a series). Sound: `whoosh.m`.

### Light leaks and film burns
Real film burns come from the end of a roll exposed to light during a reel change. Snowboard
editors famously kept "a whole bin of nothing but film burns" as transitions. Experienced 16 mm
shooters dislike burns over obviously digital footage [secondary: [MacRumors forum, anecdotal](https://forums.macrumors.com/threads/flare-effect.452447)].
**Rules [house]:** use burns and leaks only on archive or analogue material (`photo` sets, 1960s
segments), never on clean CG. Keep leaks *warm* (sodium orange, not white) and below full
exposure. A leak that blows out to white is a template. **Ours:** `light-leak` (screen-blended
drifting warm gradients with a gate-edge band, peaking at the dissolve) and `film-burn` (a
noise-shaped burn front: white-hot core, orange edge, scorched brown ahead of it, B growing behind
it). Sounds: `film.flutter`, `film.burn`.

### Ink and paper wipes
Harris and Vox treat the screen as paper on a desk. That physicality is the point
[secondary: [RNDR newsletter](https://rndr.beehiiv.com/p/5-visuals-next-video-ead0)].
**Ours:** `ink-bleed` (fractal ink drops spread, with a dense rim and a wet halo; B shows through
the ink), `paper-tear` (A tears along a fibrous edge, both halves pull apart and cast shadows on B),
`page-turn` (A curls off as a page with shading, a paper back and a contact shadow), and
`redact-wipe` (black redaction bars sweep A away and lift off B). Sounds: `paper.rustle`,
`paper.tear`, `paper.page`, `marker.swipe`.

### Masks and shape reveals
**Iris:** a circle opens from a point of interest. `iris-black` is the silent-film version (iris
out, iris in); keep it for period pieces. `aperture` closes seven camera blades: a surveillance
or photography beat. **Shape reveal:** `shape-circle` (a soft circle from an anchor; B settles
inside it) and `shape-box` (a frame or photograph in A expands to become the next shot, like
Material's container transform, which animates an element into a new screen
[secondary: [community M3 notes](https://smithery.ai/skills/copyleftdev/google-material-design)]).
**Luma wipe:** B grows out of the highlights of A, a light-led reveal. **Linear wipe:**
soft-edged, at any angle.

### Morph cuts
Premiere's Morph Cut hides jump cuts in interviews by tracking the face and interpolating frames.
It works best on a single talking head with a static background, with similar head positions
either side of the cut [primary: [Adobe tips](https://blog.adobe.com/en/publish/2015/06/18/morph-cut-tips-tricks-for-best-results);
secondary: [No Film School](https://nofilmschool.com/2015/06/how-use-premiere-pro-morph-cut-jump-cuts-disappear)].
We have no interviews (faceless channel). The analogue for us is `match-dissolve` between two
framings of the same object, which hides a reframe the way a morph cut hides a jump.

### "Camera passes through the object" and seamless edits
Seamless transitions (Sam Kolder style) use a foreground element that wipes the whole screen
("frame blocking"). The cut hides behind it, or a tracked matte punches through a surface
[secondary: [Adobe community answer](https://community.adobe.com/questions-529/sam-kolder-fly-through-effect-35432),
[UAL student notes](https://g13405184.myblog.arts.ac.uk/?p=295)]. The trick is that the shots
share an element: colour, motion direction or a shape.
**Ours:** `pass-through` (a dark pillar crosses the lens with motion-blurred edges and a faint warm
rim; A and B parallax behind it). In 3D, the real version is a camera move through a doorway or
window, cut while the frame is filled by the occluder. Plan it in `shot-design`.

### Glitch, scanline, pixel sort
Digital artefacts mean a digital *subject*: hacked feeds, surveillance, corrupted data. **Rules
[house]:** a glitch lasts 3–6 frames, with a small RGB split (≤ 12 px at 1080p) and at most a few
displaced slices. Never use one as a generic punch. `scanline` is a feed refreshing top to bottom.
`pixel-sort` smears a band of the frame and should stay subtle. Sounds: `glitch.zap`, `ui.scan`.

### Flash frames, dips
The style bible calls for 1–2 flash frames on a hard tonal shift. `flash` peaks at full exposure
for one frame, so the switch is invisible. `dip-black` closes a movement; `dip-red` is for
violence or alarm and should be used once an episode at most (red is reserved for annotation).
Sounds: `shutter` + `impact.soft`; `sub.drop`; `impact.boom`.

## 4. Kinetic typography

| Technique | What it's for | Rules | Ours |
|---|---|---|---|
| **Split / stagger by word** | A line said by the VO, word by word | Words land on their spoken times; rise ≤ 0.4 em; ease out | `M.text.splitWords({ times: M.wordTimes(shot, text) })` |
| **Per-character stagger** | One name or title per shot | Stagger 20–50 ms per character. Use it for a few key words only, everything else moves as a line [secondary: [Pexo](https://pexo.ai/tutorial/how-to-make-a-kinetic-typography-explainer-video)] | `M.text.perChar({ from: 'scale' \| 'track' \| 'below' \| 'fade' })` |
| **Mask reveal** | Editorial titles, chapter titles | Lines slide up from behind a hard mask, 0.7–0.9 s, emphasized ease, ~120 ms line stagger | `M.text.maskUp` |
| **Typewriter** | Logs, terminals, documents | Mono only; ~20 cps; block caret blinks after typing; pair with `type.run` sfx | `M.text.typewriter` |
| **Scramble / decode** | Classified, decrypted, identified | Mono so the width never jitters; characters lock left to right; glyphs cycle at 24 Hz and are seeded [secondary: [Motion scramble-reveal docs](https://motion.dev/ui/components/scramble-reveal)] | `M.text.scramble` |
| **Counter roll** | A number growing to its value | Odometer columns, not a flickering integer; ease out expo so it lands softly; a source line follows | `M.text.counter` |
| **Number slam** | The number *is* the beat | 1.3× → 1 with a fast underdamped spring; impact sfx on the anchor; a source line 0.35 s later | `M.text.slam` (`.impact(t)` drives a flash or shake) |
| **Strike-through** | "Not this, that" | Marker stroke drawn left to right, rough edge, text dims | `M.text.strike` |
| **Highlighter sweep** | The phrase that matters | Red band wipes in behind the text, slightly skewed | `M.text.highlight` |
| **Redaction bars** | Secrets, withheld names | On a paper card; bars slam over words (`mode: 'cover'`) or lift off to reveal (`'reveal'`) | `M.text.redact` |
| **Document callout** | Pointing into a photo or document | Loop drawn on (never faded), then the leader, then the label | `M.callout.doc` |
| **Map route** | Journeys, supply chains | The path draws under a travelling dot, then becomes a marching dash; the end label rises in | `M.callout.route` |
| **Data reveals** | Comparisons over time | Bars race with continuous rank interpolation; lines draw with the value riding the head; a big number gets a comparison object (unit marks) | `M.data.*` |

Placement follows the style bible: corners and edges, never a centred lower third. The caption
block (`M.card.caption`) is the lower-third replacement: a red rule draws, the mono meta line and
the serif line mask up.

## 5. Easing grammar

- **Never linear,** except constant drift (dust, an orbit in progress, a marching dash).
  Entrances decelerate, exits accelerate, moves between rest states ease in and out
  (`visual-craft.md` §4, Disney's slow in / slow out
  [secondary: [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation),
  [LottieFiles](https://lottiefiles.com/blog/tips-and-tutorials/mastering-disney-12-principles-animation)]).
- **The curves in `M.E`:**

  | Ease | Formula / control points | Use |
  |---|---|---|
  | `smoothstep` / `smoother` | 3t²−2t³ / 6t⁵−15t⁴+10t³ (C2: zero velocity *and* acceleration at both ends) | Camera-like moves, crossfades |
  | `outCubic`, `outQuart`, `outExpo` | Penner families (Penner, 2001–2003, the standard set [secondary: [jQuery Easing source](https://www.cs.cornell.edu/~geokara/js/jquery.easing.1.3.js)]); `outExpo` is renormalised to land exactly on 1 | Entrances; counters (`outExpo` lands softly) |
  | `inOutSine`, `inOutCubic`, `inOutQuart` | Penner | Exits, wipes, A→B moves |
  | `back` | Overshoot s = 1.70158 by default (Penner) | Arrowheads, a pin dropping; small doses |
  | `emphasized` | cubic-bezier(0.2, 0, 0, 1) | Quick start, long settle: titles, panels (Material 3 emphasized [secondary: [M3 token notes](https://smithery.ai/skills/copyleftdev/google-material-design)]) |
  | `decel` / `accel` | (0.05, 0.7, 0.1, 1) / (0.3, 0, 0.8, 0.15) | M3 emphasized decelerate / accelerate |
  | `editorial` | (0.7, 0, 0.2, 1) | Hairline rules, strong in-out |
  | `spring`, `springT` | Closed-form damped oscillator (below) | Slams, landings, playheads |

- **Spring in closed form** [primary: [Ryan Juckett, Damped Springs](https://www.ryanjuckett.com/damped-springs/)].
  The displacement from rest x(t), with ω = 2πf, ζ the damping ratio, x₀ and v₀ the initial
  displacement and velocity:
  - under-damped (ζ < 1), α = ω√(1−ζ²): x = e^(−ωζt)(x₀ cos αt + (v₀ + ωζx₀)/α · sin αt)
  - critically damped (ζ = 1): x = ((v₀ + ωx₀)t + x₀)e^(−ωt)
  - over-damped (ζ > 1), z₁,₂ = −ωζ ∓ ω√(ζ²−1): x = ((v₀ − x₀z₂)e^(z₁t) + (x₀z₁ − v₀)e^(z₂t)) / (z₁ − z₂)

  Position is a pure function of t, so springs fit our deterministic renderer. Apple's
  CASpringAnimation appears to use the same closed form [secondary: [wobble README](https://github.com/skevy/wobble)].
  `M.spring({ zeta, bounces })` normalises it to [0, 1] and blends the last 15% onto exactly 1.
- **Durations at 1080p video [house, from Material's UI timings doubled for video; see `visual-craft.md` §4]:**
  type reveals 0.4–0.9 s, leaders and loops 0.5–1.0 s, exits 0.25–0.4 s (shorter than entrances),
  staggers 40–120 ms, transitions 0.25 s (flash) to 1.2 s (ink). Longer distances take longer.
- **Stagger and overlap:** children settle 2–4 frames after the parent (label after leader, source
  after number). `M.life(t, at, out)` gives a fade envelope that is never a pop.
- **On twos:** `M.onTwos(t, 12)` quantises overlay time to 12 fps for the Vox handmade texture
  [secondary: PremiumBeat, above]. Use it for paper and map graphics, never on camera moves.

## 6. Sound grammar for transitions

- **Anchor, not start.** Every `sfx` preset reports the second at which it peaks. Place that on
  the cut. A whoosh's rise fills the move before the cut, its tail the move after it
  [secondary: [Morphic](https://morphic.com/resources/sounds/whoosh-sound-effect)].
- **Layer by register [house]:** sub (`sub.drop`, the body of `impact.*`) for weight; mids
  (whoosh body, paper) for motion; highs (`ui.tick`, crackle, shutter) for detail. One element in
  each register at a time.
- **Level ladder [house]:** UI ticks −14 dBFS peak, whooshes −6, impacts −2, booms and stingers
  −1, ambiences −20 to −30. The VO always wins: the render's sidechain ducks the bed.
- **Kurzgesagt rule:** good sound design is felt, not noticed. Most cuts in a 15-minute documentary
  get an ambience change (a J-cut), not a whoosh. Keep whooshes for the moves that need them.

## 7. Choosing a transition (story intent → device)

| Intent | First choice | Alternatives |
|---|---|---|
| Next beat, same idea | `cut` on a sound | `slide` (next item in a series) |
| Time passes | `dissolve` | `lens-blur` (into memory), `light-leak` (archive), `dip-black` (end of a movement) |
| Deeper into the subject | `push` | `zoom-through` (into a point) |
| The bigger picture | `pull-back` | `shape-box` (the frame becomes the shot) |
| Elsewhere, at the same time | `whip` | `pass-through` |
| This *is* that (comparison, metaphor) | `match-cut` | `match-dissolve` |
| Attention moves | `focus-pull` | `iris`, `shape-circle` |
| Archive / analogue | `film-burn` | `light-leak`, `page-turn`, `paper-tear` |
| Documents, secrets | `redact-wipe` | `ink-bleed`, `paper-tear` |
| Digital, surveillance | `glitch` (3–6 frames) | `scanline`, `pixel-sort`, `grid-reveal`, `aperture` |
| Shock, violence | `flash` | `dip-red` (once an episode) |
| A world comes apart | `mosaic-shatter` | `paper-tear` |

## Sources
- Walter Murch Rule of Six: https://www.studiobinder.com/blog/walter-murch-rule-of-six/
- MrBeast's 2024 shift away from retention editing: https://gigazine.net/gsc_news/en/20240403-retention-editing-beastification-may-be-end · https://preachingtoday.com/illustrations/2024/june/are-hypnotic-youtube-edits-getting-old.html
- Vox motion techniques (12 fps, textures, tracking transition): https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/
- Johnny Harris physical style: https://rndr.beehiiv.com/p/5-visuals-next-video-ead0
- LEMMiNO Q&A summary: https://rosetta.to/u/lemmino/4-000-000-q-a
- Apple keynote transitions: https://9to5mac.com/2023/06/21/apple-keynote-videos-transitions-and-editing/ · Keynote Magic Move: https://hackdesign.org/toolkit/keynote
- Neo / MagnatesMedia style as described by job ads: https://www.upwork.com/freelance-jobs/apply/YouTube-Documentary-Animator-Motion-Graphics-Editor-Needed-Vox-MagnatesMedia-Style_~022061919757222663022/
- Kinetic typography for explainers: https://pexo.ai/tutorial/how-to-make-a-kinetic-typography-explainer-video
- Match cuts: https://www.studiobinder.com/blog/match-cut/ · https://www.studiobinder.com/blog/match-cuts-types-of-cuts/
- J and L cuts: https://vimeo.com/blog/post/j-cuts-l-cuts · https://spotlightfx.com/blog/what-are-j-cuts-and-l-cuts-professional-dialogue-editing-explained
- Speed ramping: https://blog.motionarray.com/learn/premiere-pro/premiere-pro-speed-ramping-tutorial/ · https://filmlifestyle.com/how-to-speed-ramp-in-premiere/
- Morph Cut: https://blog.adobe.com/en/publish/2015/06/18/morph-cut-tips-tricks-for-best-results · https://nofilmschool.com/2015/06/how-use-premiere-pro-morph-cut-jump-cuts-disappear
- Seamless / through-object transitions: https://community.adobe.com/questions-529/sam-kolder-fly-through-effect-35432 · https://g13405184.myblog.arts.ac.uk/?p=295
- Film burns: https://forums.macrumors.com/threads/flare-effect.452447
- Whoosh placement: https://morphic.com/resources/sounds/whoosh-sound-effect
- Scramble reveal parameters: https://motion.dev/ui/components/scramble-reveal
- Animation principles: https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation · https://lottiefiles.com/blog/tips-and-tutorials/mastering-disney-12-principles-animation
- Penner easing (reference implementation): https://www.cs.cornell.edu/~geokara/js/jquery.easing.1.3.js
- Material 3 easing tokens (community notes): https://smithery.ai/skills/copyleftdev/google-material-design
- Damped springs, closed form: https://www.ryanjuckett.com/damped-springs/ · https://github.com/skevy/wobble
- Repo context: `docs/research/visual-craft.md`, `docs/fern-breakdown.md`, `docs/style-bible.md`
