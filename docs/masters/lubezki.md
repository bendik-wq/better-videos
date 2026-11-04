# Emmanuel Lubezki

**Why he matters to us:** natural light only, wide lenses close to the subject, and the camera
as a floating presence (Malick, Cuarón, Iñárritu). His magic-hour work is the reference for our
`golden-hour` look.

## Principles
- **Kill any artifice.** On *The Revenant* he shot exclusively with natural light and
  period-correct firelight: "I wanted to kill any artifice" [cited: ASC Wrap Shot].
- **Accept the constraint.** The daylight window in northern Canada was 9:30 am to 4 pm, which
  prolonged production by months [cited: ASC Wrap Shot]. He chose the Alexa 65 because film
  lacked the sensitivity for dawn and dusk [cited: British Cinematographer].
- **Grade like a darkroom:** in the grade he could darken backgrounds, lighten a face, change a
  sky [cited: British Cinematographer].

## Signature techniques
- Ultra-wide lenses (12–21 mm) inches from faces with deep background [analysis].
- Backlight and contre-jour at magic hour; flare allowed [analysis].
- Steadicam or crane moves that drift around the subject and up to the trees and sky [analysis].
- Extended takes (*Birdman*, *Gravity*, *Children of Men*) [see cuaron.md].

## Tension and scale
- Closeness and wideness at once: the face and the whole landscape in one frame [analysis].

## Sound and silence
- (Director-led.) Breath on the lens in *The Revenant* makes the camera a body [analysis].

## How he cuts
- (Director-led.) Long takes where possible.

## Colour philosophy
- Natural colour; cool shade and warm low sun, nothing added [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Natural light only | World kit sun + sky only (`tod`), no extra lights; `golden-hour` look for magic hour (`LK.tod('golden-hour', W.TOD)`, sun ~10°). |
| Wide and close | 16–24 mm (`C.lens(camera, 18)`), subject large in frame, deep background; `REV-009` Push past the subject. |
| Floating presence | `C.moves.float` (≤ 0.03) or `CAM.breathe`; `CHR-019` Circling crane on the figure, `FOL-006` Operator follow with breath. |
| Contre-jour | Put the sun within 30° of the lens axis; world `tod.flare` 0.5–0.7; halation up via the look's finish. |

## Sources
- ASC, Wrap Shot: The Revenant: https://theasc.com/articles/wrap-shot-the-revenant
- British Cinematographer, "Grizzly Adventure" (Lubezki on The Revenant): https://britishcinematographer.co.uk/emmanuel-lubezki-amc-asc-the-revenant/
- Codex, "Light fantastic: the making of The Revenant": https://codex.online/news/light-fantastic-the-making-of-the-revenant
