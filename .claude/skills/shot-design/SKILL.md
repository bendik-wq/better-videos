---
name: shot-design
description: Turn script beats or narration lines into a shot plan (shot type, camera move and its motivation, lens/FOV, light, transition in/out, annotation, sound cue, duration) that obeys the no-repeat rule and per-section cut-rate targets, then emit the params for project.mjs. Use after retention-script and before (or while) building scenes with make-video, or when asked to storyboard, plan shots, pick camera moves or transitions, fix pacing, or review why a sequence feels flat or repetitive.
---

# Shot design: from a script beat to a shot plan

Evidence and the full shot vocabulary are in `docs/research/visual-craft.md` §5. Taste is in
`docs/style-bible.md`, and it overrides everything here. Pacing is in
`docs/research/retention-playbook.md`. Assets and licences are in
`docs/research/asset-sources.md`.

## Inputs
1. The narration: either `retention-script`'s beat sheet or a `project.mjs` shot list.
2. The section map (cold open, setup, chapters, mechanism, twist, payoff) with timestamps.
3. The existing sets in `projects/<name>/scene.js` and any reusable sets from earlier episodes.

## Procedure

### 1. Split narration into visual beats
- Budget about **2.5 spoken words per second** (150 wpm; re-measure with Piper).
- Split any VO line longer than the section's target ASL (table in step 6) into `beats`
  (`[word, set, params]`, cut on a spoken word). The renderer cuts 0.08 s before that word.
- One beat carries **one idea**. If a line has a number and a place, that's two beats.

### 2. Classify each beat's job
Use one of: **place**, **object/evidence**, **person**, **number/data**, **mechanism**,
**tension**, **reveal/payoff**, **memory/interior**, **time jump**, **chapter/reset**.

### 3. Pick the shot (default mapping, then vary it)
| Job | First choice | Alternates |
|---|---|---|
| place | Establishing wide (24 mm, human silhouette for scale) | Map fly-to, crane drop, god's-eye |
| object/evidence | Orbit on a hero object in a void (50–65 mm) | Macro detail, slow push-in, static locked-off with flash |
| person | Silhouette against the source | Archive card 2.5D, follow/tracking, low hero |
| number/data | Typographic set (bars/counter) with a slow drift | Hero object plus a tracked leader-line label, god's-eye of a pattern |
| mechanism | God's-eye or diorama with labels animating on words | Lateral truck through stages, push-through between levels |
| tension | Slow push-in or a static hold, 6–12 s | Handheld observer, Dutch (rarely) |
| reveal/payoff | Hard cut on a hit to a pull-back reveal or a graphic match | Flash frame into static locked-off, dolly zoom (once per episode) |
| memory/interior | Step-printed smear (`step: 3, trails: 0.4`) | Slow lateral truck with dust and haze |
| time jump | Dissolve or hard cut on sound | Crane rise out, then a new establishing wide |
| chapter/reset | Chapter card, hard cut, drone drops | n/a |

### 4. Give every move a motivation (Deakins: "if the camera moves it's got to be for a reason")
Write the motivation as **"<move> because <word or event>"**, e.g. "push-in because VO says
*inbox*". Valid motivations:
- **information:** the VO names a detail → push in, or rack the light onto it.
- **context:** the VO widens to the system → pull back or crane up.
- **character:** a figure or vehicle moves → follow or truck with it.
- **emotion:** dread, awe or calm → a slow push, a hold, or a low angle.
- **none:** a deliberate static. A valid, strong choice after several moves.

Start the move on the motivating word (`wt(shot, word)`). Don't start it at frame 0 unless the
motivation comes before the shot.

### 5. Set the lens, light and handheld
- **Lens kit (mm → `fov`):** 24 → 45.7 · 40 → 28.4 (default) · 65 → 17.7 · 135 → 8.6. Or set
  `camera.filmGauge = 36; camera.setFocalLength(mm)`. Move the camera; don't zoom.
- **Light:** one motivated key per shot (work lamp, sodium, fluorescent, flash, sky). Name it in
  the plan. Silhouettes need a lit background (fog, sky or shaft) behind a dark figure.
- **Handheld `float`:** 0 for deadpan or typographic shots, 0.02–0.04 default, 0.08–0.15 for
  observer or urgent shots. Never above 0.03 on 135 mm.
- **Scale:** if something must read as big, put a human silhouette or a container in frame.
- **Parallax:** needs camera *translation* and a foreground element. An orbit or pan alone won't
  give it.

### 6. Hit the cut-rate target for the section
"Visual change" = a cut, a new annotation, a counter starting, or a camera gear change.

| Section | Avg shot | In-shot change every | Notes |
|---|---|---|---|
| Cold open (0:00–0:30) | 2–3.5 s | n/a | Densest. One idea per shot |
| Setup / Ch.1 | 3–5 s | 3 s | Show, don't describe |
| Escalation / Ch.2 | 3–6 s | 3 s | Stair-step the scale |
| Mechanism / Ch.3 | 5–8 s | 2–3 s | Slow camera, busy labels. This is the lull, so keep it visual |
| Tension build | 6–12 s | 4–6 s | Fewer cuts, slow push, drone rising |
| Reveal | 1.5–3 s burst, then a 6–10 s hold | n/a | Cut on the hit, then let it land |
| Chapter card | 4–5.5 s | n/a | Hard cut, the drone drops |
| Outro / CTA | 4–6 s | n/a | Calm |

Vary the lengths. **Never run five shots of near-equal length (±15 %) in a row.**

### 7. Choose the transition in and out of each shot
| Relationship between shots | Transition | Engine |
|---|---|---|
| New fact, shock, or into or out of a title or chapter | Hard cut on a sound hit (+ 1–2 flash frames on a tonal shift) | `trans: 'cut'` |
| Same subject, one level deeper | Push-through. The outgoing shot should already be pushing in. | `trans: 'push'` |
| Parallel or simultaneous place or actor ("meanwhile…") | Whip. Match the outgoing motion's direction. | `trans: 'whip'` |
| Time passes; into or out of type | Dissolve | `trans: 'dissolve'` |
| Equivalence or transformation | Graphic match: hero at the same screen point and size (check with `K.toScreen`) | `trans: 'cut'` |

Always pick `trans` (and `angle`, where the set supports `CAM.style`) **explicitly** in params.
In `data-rush/scene.js` the fallback chooses them by hash, which is random rather than motivated.
For audio, start the incoming ambience 0.3–1.0 s before the picture cut (J-cut) and put hits on
the cut frame.

### 8. Run the no-repeat rules
- **Engine (hard):** the same `set + params` never appears twice. `render.mjs` throws.
- **Plan (soft, enforce by review):**
  - Not the same shot type twice in a row, and not the same camera move three times in a row.
  - Framing scale alternates: no three wides, mediums or closes in a row.
  - Not the same `angle`/`CAM.style` in consecutive shots.
  - A reused set needs a new angle, a new lens and a new light state. A trivial param tweak
    doesn't count as new.
  - Rationed per episode: dolly zoom ≤ 1, Dutch ≤ 2, whip ≤ 1 per minute, flash frames ≤ 1 per
    chapter, step-print sequences ≤ 1 per chapter.
  - Red annotation ≤ 1 per shot, and red stays the only accent.

### 9. Write the plan, then emit params
Plan table, one row per beat:

`id | VO (first words) | job | shot | set | lens/fov | move + motivation (word) | float | key light | annotation | trans in | sound cue | est. dur`

Then translate it into `project.mjs`. For example (illustrative: the `gates` mode doesn't exist yet):
```js
S('hero', 'Twelve and a half million dollars. For the inbox of an airline…',
  { prop: 'drive', cam: 'push', angle: 'macro', trans: 'cut', caption: 'FIG. 1 …' }),
S('plane', 'The planes were parked. The gates went dark.', { mode: 'lightsOff', angle: 'low', trans: 'dissolve' },
  { beats: [['gates', 'plane', { mode: 'gates', angle: 'god' }]] }),
```
If the project's `scene.js` doesn't read `angle` or `trans` yet, add support, following the
pattern in `projects/data-rush/scene.js` (`camOrbit` and `transFor`).

### 10. Look-dev before rendering
`node engine/render.mjs projects/<name> --stills=0.1,0.5,0.9 --only=<ids>`, then montage the
stills in shot order and check them against the checklist.

## Checklist (every shot)
- [ ] Does it show something the VO doesn't say word for word? (style bible)
- [ ] Is there one motivated key light, with darkness as the default?
- [ ] Is the move motivated and started on its word? Or is it deliberately static?
- [ ] Is the lens from the kit, with no unmotivated zoom?
- [ ] Is there a scale reference if size matters? A foreground layer if parallax matters?
- [ ] Is there a focal point? Does the eye-trace carry from the previous shot (within ~1/3 frame), unless the cut is meant to jolt?
- [ ] Does the transition match the relationship (cut, push, whip, dissolve, match)?
- [ ] Does the shot's length fit the section target and differ from its neighbours?
- [ ] Do type and annotation draw on, on the word, in the corners, staged with a 2–4 frame overlap?
- [ ] Is there a source line on every number? Is red used only for annotation?
- [ ] Is there a sound cue: ambience leading by 0.3–1 s, a hit on the cut?
- [ ] Is the shot clean of the never-list: realistic CG humans, gradient or neon type, whooshing 3D titles, a second accent colour?
- [ ] Is every new asset logged with its licence (`asset-sources.md` bookkeeping)?

## Sequence-level review (every chapter)
- [ ] Section ASL is within target, and no run of five equal-length shots.
- [ ] Shot types, angles and scales pass the no-repeat rules. Rationed effects stay within budget.
- [ ] At least one held, static or near-static shot per chapter, so the moves mean something.
- [ ] Tension sections slow down and reveals burst, then hold.
- [ ] The chapter ends on an image that sets up the next question.
