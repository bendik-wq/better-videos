# Ridley Scott

**Why he matters to us:** density of atmosphere. Scott's frames are layered in depth (smoke,
backlight, foreground clutter) and planned as drawings first, which is exactly how a procedural
pipeline should work.

## Principles
- **Draw it first.** Scott draws his own storyboards ("Ridleygrams"): fast ink-and-pencil
  sketches using contour rendering for depth and volume, carrying mood as much as composition
  [cited: Lewton Bus; Fountaindale library]. On *Gladiator II* the VFX supervisor worked directly
  from them [cited: fxguide].
- **Atmosphere is depth.** Haze and smoke make light visible and separate planes; sources report
  incense or smoke on his sets and a preference for backlight over coloured gels [cited:
  Fountaindale].
- **Shoot with many cameras.** Multi-camera coverage of the same action builds depth and options
  in the edit [cited: fxguide].

## Signature techniques
- Backlit shafts through windows, fans and blinds (*Alien*, *Blade Runner*) [analysis].
- Foreground layers: a cable, a pillar, a silhouetted shoulder in every frame [analysis].
- Industrial detail density: real-looking dirt and wear on every surface [analysis].

## Tension and scale
- Withhold the full view (the creature, the city) and show it in fragments through haze [analysis].
- Scale through layering: near, middle and far planes, each a different value [analysis].

## Sound and silence
- Mechanical ambience (hums, vents, distant engines) as the bed; music enters late [analysis].

## How he cuts
- Coverage-heavy, cutting between angles of a continuous action; rhythm comes from the
  multi-camera footage [analysis].

## Colour philosophy
- Value before hue: a dark frame with one bright, often warm or white backlight; desaturated
  steel blues and ambers [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Ridleygram first | The `shot-design` skill's shot plan is our Ridleygram: one line per shot with light, lens, move and layer list, before any code. Render `--stills=0.3,0.9` and contact-sheet them before animating. |
| Visible light | `K.lightShaft` (ray-marched) or `post.js` `rays: { light }`; `K.dust` particles in the shaft; world `tod.hazeDen` ×1.5. |
| Foreground layers | `REV-004` Foreground wipe reveal, `EST-022` Parallax past foreground, `TRN-009` Foreground wipe pass; `CAM.parallaxSlide`, `CAM.wipeReveal`. |
| Many cameras | For key moments, render the same action from 2–3 `CAM` rigs (pure in t) and cut between them on beats (`beats` in project.json). |
| Value structure | Check every still in greyscale: the subject must be the brightest or darkest value [house]. |

## Sources
- Lewton Bus, "The Nature of the Beast: Ridley Scott and the Ridleygram": https://lewtonbus.net/editorials/ridley-scott-ridleygram
- Fountaindale Public Library, "Ridley Scott and the art of storyboarding": https://www.fountaindale.org/ridley-scott-and-the-art-of-storyboarding/
- fxguide, Gladiator II VFX and Ridleygrams: https://www.fxguide.com/?p=516440
