# Visual craft: how the best documentary channels and cinematographers build pictures

Research notes for a programmatic pipeline (Three.js r169 in headless SwiftShader, DOM/SVG
overlays, ffmpeg finish). Every rule is paraphrased from a cited source or marked **[house]**
when it is our own inference. Tags: **[primary]** = the creator or an official page;
**[secondary]** = a journalist, tutorial or third-party summary; **[house]** = our rule.

Read with `docs/style-bible.md` (taste), `docs/fern-breakdown.md` (reference) and
`docs/research/retention-playbook.md` (pacing and structure). The step-by-step version of this
document is the `shot-design` skill.

---

## 1. What the reference channels actually do

Public "how we make it" material is thin. Most creators haven't published their pipelines, and
many search results are AI-generated rewrites or freelancer gigs. Below is only what survived
checking.

| Channel | What's documented | Takeaway for us |
|---|---|---|
| **Kurzgesagt** | Script first, then visual planning. After the script, they sketch the video, look for visual metaphors and transitions between ideas, and decide which scenes need the most attention. About 200 illustrated panels per video in Illustrator, 2–3 illustrators for 8–12 weeks, 2–3 animators in After Effects for 8–10 weeks. Nearly all motion is hand-keyed. Original score per video, plus sound design "you don't consciously notice". At least 1,200 hours per video. [primary, talk transcript: [LingQ transcript of "How to make a Kurzgesagt video in 1200 hours"](https://www.lingq.com/tr/online-ingilizce-%C3%B6%C4%9Fren/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/)]. Team of about 70 by its tenth year; flat, minimalist design, sometimes 3D [secondary, [Wikipedia](https://en.wikipedia.org/wiki/Kurzgesagt)]. | **Plan transitions between ideas at the storyboard stage, not in the edit.** Budget the "hero" scenes. Sound design is a whole layer, not an afterthought. ~200 distinct visuals in roughly 10 minutes means a new picture every ~3 s on average. |
| **LEMMiNO** | Works mostly alone. Bare-bones script expanded over weeks or months, sourcing takes days to weeks. Edits in Premiere Pro, composites in After Effects, animates in Cinema 4D. Records his own narration. [secondary summary of his own Q&A: [rosetta.to](https://rosetta.to/u/lemmino/3-000-000-q-a)] | One person can carry a 3D documentary when the style is restrained: low-poly forms, glow and bloom, slow cameras. |
| **Fern** | Made by the Simplicissimus team. Blender reconstructions, ~60 staff (see `docs/fern-breakdown.md`). Third-party write-ups add little beyond that. [secondary, [Plugged In](https://www.pluggedin.com/youtube-reviews/fern/), [turi2](https://www.turi2.de/?p=3983013)] | Visual grammar (one object in a void, dioramas, red as the only accent) is already decoded in `fern-breakdown.md`. |
| **PolyMatter** | Creator's own Skillshare course runs topic, research, story, script, graphic design, colour, shapes, animation. Tools named include Affinity Designer. [primary, [Skillshare](https://www.skillshare.com/en/classes/make-animated-youtube-videos/1143408374)] | Colour and shape design come *before* animation. Design a limited palette and a shape vocabulary per episode. |
| **Johnny Harris** | Maps are built with the GEOlayers After Effects plugin over Mapbox Studio styles, a workflow he says took about 8 years to refine [secondary: [aescripts](https://aescripts.com/learn/how-johnny-harris-makes-maps/), [Glasp summary of his tutorial](https://glasp.co/youtube/GsojLuJpe_0)]. His look mixes textured overlays, photo slide-ins with blur, and text-based match cuts [secondary: [Motion Array](https://blog.motionarray.com/learn/premiere-pro/edit-documentary-in-premiere-pro/)]. | Maps work as **places the camera flies to**, not static images. Use vector data (Natural Earth, OSM) extruded in 3D, with textured paper or film over it. |
| **Vox** | Motion graphics are animated at **12 fps inside a 24 fps edit** for a stepped, hand-made rhythm. "Tracking" transitions place two shots as 3D layers and move one camera back through both, with a blur spike at the cut. Layered paper and grain textures cycle 2–3 times a second over stills. Chromatic aberration and blur at the frame edges fake a lens. [secondary: [PremiumBeat](https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/)]. Motion designers build series templates from style guides [primary job ad: [startup.jobs](https://startup.jobs/motion-graphics-designer-at-voxmedia-2)]. | Our `step` parameter is the same idea as Vox's 12 fps graphics. The tracking transition maps onto our `push` transition. Use **templates per series** (our sets) to keep a consistent look. |
| **MagnatesMedia, Hoog** | Nothing primary found. Imitators describe the style as paper textures, collage cut-outs, newspaper and map visuals, 2.5D parallax on archive photos, and historical b-roll mixed with modern shots [secondary: [Fiverr listing](https://www.fiverr.com/s/2Kb5Dk8), [Workana posting](https://www.workana.com/es/job/editor-de-video-short-form-creativo-para-marca-personal-estilo-documental-magnates)]. Fans group Hoog with Fern and LEMMiNO as "low-poly 3D documentary" channels [secondary: Reddit list]. | **Archive photo on a card plus parallax** is the genre's workhorse shot. We can do it with real depth, because our cards live in a 3D scene. |

**Measure the references yourself [house].** Nobody publishes cut rates. Download a reference
locally (see `fern-breakdown.md`) and run
`ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -c pts_time`, or
PySceneDetect, to count cuts. Divide the duration by the count to get the average shot length
(ASL). Log results in this file.

## 2. Pacing and cut rate

- Hollywood ASL dropped from about 8–10 s in the 1960s to about 3–4 s by 2005 [secondary,
  reporting Cutting et al. 2010: [SBS](https://www.sbs.com.au/whats-on/article/hollywoods-secret-formula/el6oxpqmo)].
  Cutting has also cited about 12 s in 1930 falling to about 2.5 s today, and found that newer
  films contain more motion within each shot [secondary: [Fox News](https://www.foxnews.com/science/the-science-of-hollywood-films-its-all-in-the-chaos-theory),
  study: [PMC3485803](https://pmc.ncbi.nlm.nih.gov/articles/PMC3485803/)]. Part of the reason
  is visual density: busy frames need more time to read.
  **Rule [house]:** shot length scales with how much there is to read. A single object in a void
  can cut fast. A diorama with labels needs time.
- Cutting also found shot-length sequences in post-1980 films trend toward a 1/f pattern: runs
  of short shots and long shots alternate, rather than a metronome
  [secondary: [SBS](https://www.sbs.com.au/whats-on/article/hollywoods-secret-formula/el6oxpqmo)].
  **Rule [house]:** vary shot length deliberately. Never run five shots of the same length in a
  row.
- In *Sicario*'s border sequence, the editor slows the cutting as tension rises, so the audience
  searches each frame for threat, then accelerates at the release. The cutaway to a wide aerial
  says "there is nowhere to hide" [secondary: [StudioBinder](https://studiobinder.com/blog/sicario-border-scene-explained)].
  **Rule:** suspense means **longer** holds. Release (the reveal or the answer) means faster
  cuts.
- Walter Murch's Rule of Six ranks what a cut must serve: **emotion > story > rhythm > eye-trace
  > 2D screen plane > 3D space**. When they conflict, the higher one wins
  [secondary: [StudioBinder](https://www.studiobinder.com/blog/walter-murch-rule-of-six/),
  [No Film School](https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch)].
- Kurzgesagt's ~200 panels and the genre's 3–7 s b-roll rule of thumb
  ([VEED](https://www.veed.io/learn/what-is-b-roll)) imply **a visual change every 3–6 s** for
  narrated explainers. A "visual change" can be a cut, a new annotation or a camera gear change.
  It doesn't have to be a new set.

**Cut-rate targets (visual changes, not just cuts) [house, calibrate against measured refs]:**

| Section | Target ASL | Notes |
|---|---|---|
| Cold open / hook (0:00–0:30) | 2–3.5 s | Densest stretch. One idea per shot. |
| Setup (0:30–3:00) | 3–5 s | Keep showing, not describing (retention playbook). |
| Mechanism / explainer | 5–8 s per shot, with an in-shot change every 2–3 s | Slow camera, but labels, counters and markers animate on the VO's words. |
| Tension build | 6–12 s | Long holds, slow push, the drone rising. |
| Reveal / payoff | 1.5–3 s burst, then one 6–10 s hold | Cut on the hit, then let it land. |
| Chapter card | 4–5.5 s | Hard cut in, drone drops (style bible). |
| Outro / CTA | 4–6 s | Calm. |

## 3. Cinematography for a virtual camera

### Scale, silhouette and negative space (Villeneuve, Deakins, Fraser)
- **Scale needs a human reference.** Greig Fraser (*Dune*) says people can't read scale without
  a reference point, so he puts a person or a known vehicle next to the huge thing
  [secondary interview: [PetaPixel](https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/),
  [Inverse](https://www.inverse.com/entertainment/dune-2-greig-fraser-interview)].
  **Engine:** put a silhouette Mixamo figure (`C.character(..., {material:'silhouette'})`) or a
  container (`K.container`) in frame whenever something must read as big.
- **Wide and small for vulnerability.** Villeneuve plays a whole *Sicario* scene in one wide
  shot. The men leave the frame and the heroine is left small in the landscape. He also learned
  from Deakins to shoot close-ups on **wider lenses close in**, which feels intimate and keeps
  depth [secondary summary of ASC interview: [theasc.com](https://theasc.com/blog/the-film-book/sicario-interview-with-denis-villeneuve)].
- **Silhouettes are designed, not just lit.** In *Blade Runner 2049*, the K introduction keeps
  Gosling in silhouette through architecture as much as lighting. Severe concrete sets get moving
  light patterns, such as caustics from water. Colour was done in camera, and the approach stays
  "simple" despite the scale [secondary summary: [ASC](https://theasc.com/articles/deakins-blade-runner-2049)].
  **Engine:** silhouette = a dark figure against a lit background (fog, HDRI sky or light
  shaft), not a dark figure on black. Put the figure between the camera and the `lightShaft`.
- **One motivated source.** In *Jesse James*, Deakins lit a scene with a single lamp on a train,
  plus smoke, and made the iconic silhouettes. In *Skyfall*'s Shanghai fight the only light is a
  billboard reflecting on glass [secondary: [British Cinematographer](https://britishcinematographer.co.uk/roger-deakins-bsc-asc-skyfall/),
  [200-percent](https://200-percent.com/roger-deakins/)]. This is already style-bible law.
  **Engine:** one `keySpot` or practical, plus `dust` or a light shaft so the light has a
  visible volume.
- **Every camera move needs a reason.** Deakins: "If the camera moves it's got to be for a
  reason". He cites Bresson, and he holds a static shot of soldiers receding to build tension
  without cuts [primary interview: [Hazlitt](https://hazlitt.net/node/10611811)].
- **Lenses: a narrow, consistent set.** Deakins favours primes around 40 mm, 60–70 mm for
  portraits, and avoids extreme wides and teles. Primes force you to move the camera rather than
  zoom, which he finds more cinematic. "Every millimetre" changes the meaning
  [secondary: [Fstoppers](https://fstoppers.com/gear/roger-deakins-tells-us-how-he-chooses-lenses-570181),
  [YMCinema](https://ymcinema.com/2021/08/06/roger-deakins-talks-about-lenses-spherical-primes-preferred)].
  **Engine: never animate FOV as a zoom unless the zoom is the point** (a dolly zoom or a
  documentary "find"). Change the distance instead.

### Lens to FOV conversion (Three.js `fov` is vertical, in degrees)
Use `camera.filmGauge = 36; camera.setFocalLength(mm)` to get full-frame 16:9 behaviour, or set
`fov` from this table (vFOV = 2·atan(10.125 / f)):

| mm | 18 | 24 | 28 | 35 | 40 | 50 | 65 | 85 | 135 |
|---|---|---|---|---|---|---|---|---|---|
| vFOV° | 58.7 | 45.7 | 39.8 | 32.3 | 28.4 | 22.9 | 17.7 | 13.6 | 8.6 |

Our existing sets use `fov` 28–40, roughly 28–40 mm, which is right in Deakins' range.
**House lens kit:** 24 (environments and scale), 40 (default), 65 (portrait and object hero),
135 (compressed long-lens "surveillance" look; only with handheld ≤ 0.03).

### Motivated movement
Moves are motivated by **character** (following someone), **information** (pushing in on the
thing that just became important) or **emotion** [secondary: [How To Film School](https://howtofilmschool.com/dictionary/motivated-camera-movement/)].
Camera moves should follow the action. Don't move the subject to justify a fancy move
[secondary: [PremiumBeat](https://www.premiumbeat.com/blog/cinematography-tip-motivated-camera-movement/)].
In a narrated documentary **the VO is the character**. Moves are motivated by what the sentence
reveals: push in when the narration names the detail, pull back when it zooms out to the system,
pan or track when it moves from cause to effect.

### Parallax and 2.5D
"The Kid Stays in the Picture" effect cuts a photo into foreground, middle and background
layers, rebuilds the hidden background, places the layers in depth and moves a camera through
them [secondary: [waxy.org](https://waxy.org/category/posts/page/6),
[Adobe community](https://community.adobe.com/t5/after-effects/best-parallax-options/td-p/9229819)].
**Parallax only comes from camera translation. A pan or orbit around the camera's own centre
gives none.** For our engine:
- Archive photos go on separate cards at different z (subject cut-out at z≈0, background at −3
  to −8). Dolly or truck sideways 0.3–1.0 units on a 40–65 mm lens.
- Real 3D sets get parallax for free with a lateral truck, as long as **something is in the
  foreground**: a railing, a container edge, dust, a silhouette.

### Match cuts, whips and transitions
- **Graphic match:** shape, colour or composition carries across the cut and invites a
  comparison (the *2001* bone-to-satellite cut). **Action match:** movement carries across.
  **Sound bridge:** audio carries across [secondary: [Wikipedia](https://en.wikipedia.org/wiki/Match_cut)].
  **Engine:** match cuts are cheap for us. Project the outgoing hero object with `K.toScreen`
  and frame the incoming object at the same screen point and size (same FOV, same distance per
  unit of object size).
- **Whip/swish pan:** match direction and approximate speed out of shot A and into shot B, put
  blur on both sides, and cut at the peak of the blur. It reads as "moved sideways in space, not
  forward in time", so it suits parallel actions and simultaneous places
  [secondary: [Morphic glossary](https://morphic.com/ai-glossary/swish-pan)].
  **Rule [house]:** whips connect **simultaneous or parallel** things. For a jump in time, use a
  dissolve, a flash frame or a hard cut on a sound.
- **Push/tracking transition (Vox):** both shots sit in depth, the camera moves through them and
  a blur peaks at the edit point [secondary: [PremiumBeat](https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/)].
  It suits zooming into a detail or a deeper level of the same subject.
- **J-cut and L-cut:** the next shot's sound starts under the current picture (J), or the
  current sound continues over the next picture (L). Documentaries use them to carry VO and
  ambience across b-roll and to change location smoothly [secondary: [Wikipedia J cut](https://en.wikipedia.org/wiki/J_cut),
  [filmdaft](https://filmdaft.com/the-l-cut-and-j-cut-how-film-editors-use-audio-to-control-time/)].
  **Engine:** start each set's ambience cue (`score.py` cues) 0.3–1.0 s **before** its picture
  cut.

## 4. Motion design

- **Disney's principles carry over to motion graphics:** slow in and slow out (easing),
  anticipation, follow-through, overlapping action, staging and timing
  [secondary: [rebusfarm](https://rebusfarm.net/blog/follow-through-and-overlapping-action-the-animation-principle-that-prevents-stiff-motion),
  [howinteractivedesign](https://www.howinteractivedesign.com/web-design-resources-technology/12-basic-principles-animation-motion-design),
  journal study: [JEDU](https://jedu.journals.ekb.eg/article_146187.html?lang=en)]. In practice:
  - **Staging:** don't animate everything at once. Isolate the key element, let it move, then
    bring in the supporting pieces.
  - **Overlap/stagger:** child elements (label after leader line, source line after number)
    settle 2–4 frames at 24 fps after the parent. Keep it subtle.
  - **Easing:** entrances decelerate (`K.outCubic`, `K.outExpo`), exits accelerate, and moves
    between two rest states use `K.inOut`. Never use linear easing, except for constant-velocity
    drift such as dust, clouds and an orbit already in progress.
- **Durations:** UI motion guidance puts typical transitions around 200–375 ms and calls anything
  over 400 ms slow, with exits shorter than entrances and longer distances taking longer
  [primary: [Material Design 1](https://m1.material.io/motion/duration-easing.html)].
  **For video, roughly double that [house]:** type reveals 0.4–0.8 s, leader lines 0.5–0.9 s,
  marker loops 0.6–1.0 s, exits 0.25–0.4 s. Our existing dissolve (0.3), whip (0.42) and push
  (0.38) durations sit in this band.
- **Stepped motion (Vox 12 fps):** animating graphics on twos gives a hand-made texture
  [secondary: [PremiumBeat](https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/)].
  Our `step: 2` on overlays is the equivalent. Keep `step: 3` plus `trails` for the
  memory/intoxication gear change (style bible).
- **3Blue1Brown/manim vocabulary** for explaining data [primary docs: [Manim Community animations](https://docs.manim.community/en/stable/reference_index/animations.html);
  origin story: [3b1b FAQ](https://www.3blue1brown.com/faq/)]:
  - *Create/Write*: lines and type are drawn on, never faded in. This matches our
    `markerLoop.draw` and stroke-dashoffset.
  - *Transform / TransformMatchingShapes*: one thing **becomes** the next, so the viewer keeps
    track of identity. Morph a bar into a counter, or a dot on a map into a node in a network,
    rather than cutting.
  - *Indicate/Circumscribe*: a brief pulse or a drawn loop says "this one". That's our red
    marker loop.
  - *LaggedStart*: stagger a group (bars, list items) by 40–80 ms each.
  - *Updaters*: a value tied to time (a counter ticking with a camera move). Our sets are
    already pure functions of `t`.
- **Kinetic typography in our taste:** type appears **on the spoken word** (`beats` and word
  timing in `render.mjs`), is set in the corners like a magazine, and never whooshes in 3D
  (style bible "Never").
- **Sound sync:** cuts land on a sound (style bible). Sound design is a layer people feel more
  than notice [primary: Kurzgesagt talk, above]. Place hits **on** the cut frame and ambience
  **before** it (J-cut).

## 5. Shot vocabulary

Engine references: `C.rig(keys, {ease, float, seed})` (spline with keys `{pos, look, fov}`;
`float` is the handheld amplitude), `K.handheld(t, amp, seed)`, `CAM.style` angles in
`projects/data-rush/scene.js` (`orbit, low, god, dutch, crane, reveal, macro, whip`),
transitions via `params.trans` (`cut, dissolve, whip, push`), and set-level `step` and
`trails`. Distances are in world units relative to subject height **H** (1 unit ≈ 1 m).

| Shot | What it conveys | Implementation |
|---|---|---|
| **Establishing wide (scale)** | Where are we, how big is it, how alone. | 24–28 mm (`fov` 40–46). Camera 8–15 H away at 0.3–1 H high. Human silhouette in frame for scale. Slow lateral truck of 2–4 % of distance per second. `float` 0.03. 6–10 s. |
| **Slow push-in (revelation)** | "This matters." The narration has just named it. | 40 mm (`fov` 28). Two keys on one axis, distance shrinking 15–30 % over the shot, `ease: K.inOut`, `float` 0.02–0.04. Start the push on the VO word (`wt(shot, word)`). |
| **Pull-back reveal (context)** | Zoom out from the detail to the system: "and it's everywhere". | Reverse of the push. 40→40 mm (don't zoom) with distance ×2–4. Ease out (`K.outCubic`) so it lands. Something new must enter frame as you pull. |
| **Orbit (object study)** | A museum model, "look at this from every side". Fern's default. | `CAM.style='orbit'`, 20–40° of arc per shot, never 360°. 50–65 mm. `float` 0.02. Use for hero objects in a void. |
| **Lateral truck / parallax** | Passing through a world, the passage of time, layered depth. | Keys move sideways 0.5–2 H with the look target moving too (parallel track). Must have a foreground element. 35–50 mm. |
| **Low hero angle** | Power, threat, monument. | `CAM.style='low'`, camera at 0.1–0.2 H, looking up, 24–35 mm. Light from behind for a silhouette rim. |
| **God's-eye / top-down** | System, pattern, map, "the plan". | `CAM.style='god'` or rig keys straight overhead with a slow rotation of ≤ 0.9 rad over the shot. Good for maps, crowds, flows. |
| **Crane drop / rise** | Arriving into a place (drop) or leaving it (rise, a chapter ending). | `CAM.style='crane'`: high to eye level with `K.outCubic`. A rise eases in. |
| **Macro detail** | Evidence. The texture of the thing. | `CAM.style='macro'`: 0.4× distance, 65–85 mm (`fov` 14–18), barely moving (≤ 2 % per second). Shallow-DOF feel via fog and dark background. Hold 3–5 s. |
| **Static locked-off** | Deadpan, the stoic operator, a fact. | One key, `float: 0` or 0.005. Use after a sequence of moves to make the stillness itself the beat (Deakins' held shot). Best with direct-flash lighting. |
| **Handheld observer** | Being there, CCTV or bodycam, urgency. | `float` 0.08–0.15 (style-bible max), 35 mm, a slight follow lag on a moving subject. Pair with REC/timestamp overlay. |
| **Follow / tracking** | Journey, a person moving through the story. | Rig keys derived from the character's root position with a 0.3–0.6 s lag (`look` = character, `pos` = character + offset). 35–40 mm. |
| **Silhouette against source** | Mystery, a lone figure, calm inside chaos. | Figure between the camera and the `lightShaft`/sky. Exposure set by the background. Camera barely moves. 40–65 mm. |
| **Dolly zoom (vertigo)** | Realisation, dread. Use at most once an episode. | Move the camera in and widen FOV (or the reverse) keeping the subject's size constant: `d·tan(fov/2) = const`. 2–3 s. |
| **Dutch tilt** | Wrongness, instability, fraud. | `CAM.style='dutch'` (roll 0.1–0.2 rad). Rarely, and only on "something's off" beats. |
| **Whip in/out** | Parallel action: "meanwhile, at…". | `params.trans='whip'`. Match the direction of the outgoing camera motion. 0.42 s. |
| **Push-through** | Going deeper into the same subject. | `params.trans='push'`. The outgoing shot should already be pushing in. |
| **Graphic match cut** | Equivalence or transformation ("this drive is that airline"). | Hard `cut`, hero object at the same screen position and size in both shots (check with `K.toScreen`). |
| **Archive card 2.5D** | A real photo with real depth. | Photo on plane(s) in 3D, subject on its own card, `float` 0.02, 40–65 mm, lateral truck 0.3–1 unit. Grain matches the finish. |
| **Map fly-to** | Geography, movement of goods, people or money. | Extruded Natural Earth or OSM geometry. God's-eye to oblique (~35° tilt) crane over 3–5 s. Leader line to a label. Red only for the subject. |
| **Chapter card** | Pause, reset, new question. | Hard cut in and out, drone drops, a hit (style bible). Static or ≤ 1 % drift. |
| **Flash frame** | Hard tonal shift, a shock. | 1–2 white or overexposed frames at the cut, on a sound hit (style bible). |
| **Step-printed smear** | Memory, intoxication, a person's interior. | Set `step: 3, trails: 0.4` (style bible). 3–8 s, then gear back to smooth. |

## 6. Rules distilled [house unless cited]

1. One motivated key light per shot, and darkness is the default (style bible; Deakins'
   single-source examples).
2. Every move has a stated motivation: character, information or emotion. "Because it looks
   cool" doesn't count (Deakins via Hazlitt).
3. Move the camera; don't zoom. Animate FOV only for a dolly zoom or a deliberate
   documentary "find" zoom.
4. Lens kit: 24 / 40 / 65 / 135 mm-equivalent. Default 40.
5. Scale needs a reference object (a human silhouette or a container) (Fraser).
6. Parallax needs translation and a foreground layer.
7. Vary shot length. No five shots of equal length in a row (Cutting's 1/f finding).
8. Suspense means longer holds and slower cuts. Payoff means a burst, then one hold (Sicario).
9. Rank cut decisions by emotion > story > rhythm > eye-trace (Murch).
10. Keep eye-trace continuous across cuts. The incoming focal point lands within ~1/3 of a frame
    of the outgoing one, unless the cut is meant to jolt.
11. Whip = sideways in space. Dissolve = time passes. Hard cut on sound = shock or new fact.
    Push = deeper into the same subject.
12. Type and annotation draw on, on the spoken word, staged one element at a time with a 2–4
    frame overlap (Disney principles, manim `Write` and `LaggedStart`).
13. Ambience leads the picture cut by 0.3–1.0 s (J-cut). Hits land on the cut frame.
14. Plan transitions between ideas at the shot-plan stage, as Kurzgesagt does, not in the edit.

## Sources (all accessed 2026-10-07)
- Kurzgesagt talk transcript: https://www.lingq.com/tr/online-ingilizce-%C3%B6%C4%9Fren/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/
- Kurzgesagt, Wikipedia: https://en.wikipedia.org/wiki/Kurzgesagt
- LEMMiNO Q&A summary: https://rosetta.to/u/lemmino/3-000-000-q-a
- PolyMatter course: https://www.skillshare.com/en/classes/make-animated-youtube-videos/1143408374
- Johnny Harris maps: https://aescripts.com/learn/how-johnny-harris-makes-maps/ · https://glasp.co/youtube/GsojLuJpe_0 · https://blog.motionarray.com/learn/premiere-pro/edit-documentary-in-premiere-pro/
- Vox look: https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/ · https://startup.jobs/motion-graphics-designer-at-voxmedia-2
- Fern background: https://www.pluggedin.com/youtube-reviews/fern/ · https://www.turi2.de/?p=3983013
- Cutting shot-length research: https://www.sbs.com.au/whats-on/article/hollywoods-secret-formula/el6oxpqmo · https://pmc.ncbi.nlm.nih.gov/articles/PMC3485803/ · https://www.foxnews.com/science/the-science-of-hollywood-films-its-all-in-the-chaos-theory
- Murch Rule of Six: https://www.studiobinder.com/blog/walter-murch-rule-of-six/ · https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch
- Deakins: https://hazlitt.net/node/10611811 · https://theasc.com/articles/deakins-blade-runner-2049 · https://fstoppers.com/gear/roger-deakins-tells-us-how-he-chooses-lenses-570181 · https://ymcinema.com/2021/08/06/roger-deakins-talks-about-lenses-spherical-primes-preferred · https://britishcinematographer.co.uk/roger-deakins-bsc-asc-skyfall/ · https://200-percent.com/roger-deakins/
- Villeneuve / Sicario: https://theasc.com/blog/the-film-book/sicario-interview-with-denis-villeneuve · https://studiobinder.com/blog/sicario-border-scene-explained
- Greig Fraser / Dune: https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/ · https://www.inverse.com/entertainment/dune-2-greig-fraser-interview
- Motivated movement: https://howtofilmschool.com/dictionary/motivated-camera-movement/ · https://www.premiumbeat.com/blog/cinematography-tip-motivated-camera-movement/
- Parallax / 2.5D: https://waxy.org/category/posts/page/6 · https://community.adobe.com/t5/after-effects/best-parallax-options/td-p/9229819
- Match cut: https://en.wikipedia.org/wiki/Match_cut · Whip pan: https://morphic.com/ai-glossary/swish-pan
- J/L cuts: https://en.wikipedia.org/wiki/J_cut · https://filmdaft.com/the-l-cut-and-j-cut-how-film-editors-use-audio-to-control-time/
- Animation principles: https://rebusfarm.net/blog/follow-through-and-overlapping-action-the-animation-principle-that-prevents-stiff-motion · https://www.howinteractivedesign.com/web-design-resources-technology/12-basic-principles-animation-motion-design · https://jedu.journals.ekb.eg/article_146187.html?lang=en
- Material motion: https://m1.material.io/motion/duration-easing.html
- Manim: https://docs.manim.community/en/stable/reference_index/animations.html · https://www.3blue1brown.com/faq/
- B-roll durations: https://www.veed.io/learn/what-is-b-roll
