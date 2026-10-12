# Roger Deakins

**Why he matters to us:** the simplest light that could be true. Deakins' frames feel inevitable
because every light has a source, and his compositions use silhouette and negative space more
than detail. Already partly decoded in `docs/research/visual-craft.md` §3 ("Scale, silhouette and
negative space"); this file adds what our engine needs.

## Principles
- **Motivated light.** On *Blade Runner 2049*, gaffer Bill O'Leary describes the approach as
  naturalistic, "to use motivated light sources", with Deakins imagining what future sources would
  be [cited: ARRI]. For the windowless Wallace building, Deakins wanted the interiors to feel lit
  by moving sunlight and used water caustics as an architectural light source [cited: ASC, AC
  Dec 2017].
- **The technique must disappear.** On *1917*: "We would fail if the technique became the
  distraction" [cited: IBC interview].
- **Plan the light with models.** For *1917*'s ruined village at night, a scale model with tiny
  LEDs was built to work out the lighting and camera path in advance [cited: Atom Tickets].
- **Silhouette as information.** An early *2049* scene is built so K stays in silhouette, as
  much through architecture as through lighting [cited: ASC].

## Signature techniques
- One dominant source, large and soft, or hard sun; everything else is bounce [analysis].
- Silhouettes against a bright window, fog or sky [analysis].
- Single-hue sequences: orange Las Vegas haze, cyan-white snow, sodium night in *2049* [analysis].
- Low camera, horizon low, clean geometry [analysis].

## Tension and scale
- A small dark figure against a vast bright field (*Sicario*'s dusk descent, *2049*'s Las Vegas)
  [analysis].

## Sound and silence
- (Director-led; Deakins' contribution is visual.)

## How he cuts
- Composes for the cut: each frame complete, so editors can hold [analysis].

## Colour philosophy
- Colour comes from the source; grading is restrained. Skin stays natural; one hue rules a
  scene [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| One motivated source | `K.keySpot` / world `tod` sun as the only key; fill from `tod.ambSky` and env, never a second key [style bible]. In bright mode: hard sun 30–45° above the horizon, sky fill, ground bounce (`tod.ambGround`). |
| Caustic / moving sunlight | Animate a `K.lightShaft` or projected texture slowly (pure in t). |
| Silhouette | `CHR-001` Silhouette against the sky, `CHR-020` Silhouette push into the light; `PE.look.rig(scene, 'backlit')`; expose for the background. |
| Single-hue sequence | One look per sequence (`engine/looks.js`); `golden-hour` for warm haze, `blue-hour` for snow-cyan. |
| Model-first lighting | Look-dev with `--stills=0.3,0.9` and `STAGE_QS='&postq=off'` before any animation. |

## Sources
- ARRI, lighting Blade Runner 2049: https://arri.com/news-en/lighting-blade-runner-2049-
- ASC, Deakins on Blade Runner 2049: https://theasc.com/articles/deakins-blade-runner-2049
- IBC, behind the scenes of 1917: https://ibc.org/interviews/behind-the-scenes-1917/5297.article
- Atom Tickets, how 1917 was filmed as one shot: https://atomtickets.com/movie-news/how-did-they-film-1917-to-appear-as-one-continuous-shot-with-insane-planning/
- ASC, "Lives under siege: The Goldfinch and 1917": https://theasc.com/articles/lives-under-siege-the-goldfinch-and-1917
