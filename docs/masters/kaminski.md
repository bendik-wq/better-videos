# Janusz Kamiński

**Why he matters to us:** he shows how far a look can be pushed in-camera to carry meaning
(the *Saving Private Ryan* newsreel violence, the *Schindler's List* black and white) and how
blown highlights and backlight can feel like memory or wonder.

## Principles
- **Shutter as a storytelling tool.** On *Saving Private Ryan* he used a 45° shutter for
  explosions (to see each particle) and 90° for most running shots, alternating at times
  [cited: Kamiński quoted by YMCinema]. The narrow shutter removes motion blur and gives a
  staccato, newsreel feel [cited: YMCinema; No Film School].
- **Degrade the image to make it true.** Bleach-bypass processing raised contrast and lowered
  saturation, and coatings were removed from the lenses for a slightly diffused image [cited:
  YMCinema; Color Culture].
- **Light as emotion.** Hot backlight, haze, windows that blow out (*Minority Report*,
  *Munich*) [analysis].

## Signature techniques
- Overexposed windows, glowing haze, strong backlight with flare [analysis].
- Desaturated, silvery war palettes [analysis].
- Handheld "combat camera" on the beach [analysis].

## Tension and scale
- The staccato shutter makes violence jagged and real [cited: No Film School].

## Sound and silence
- (Spielberg-led.) The muffled-hearing sequence on Omaha Beach drops sound to a hum [analysis].

## How he cuts
- (Spielberg-led; see spielberg.md.)

## Colour philosophy
- Silver, cyan-grey and bleached skin for war; warm blown light for wonder and memory [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Staccato shutter | Our default is no motion blur (`settings.shutter: 0`) at 60 fps, which already reads crisp. For a combat/newsreel beat, use step-printing (`step: 2–3`, small `trails`) per the style bible. Keep `--shutter=180` for smooth flying shots only. |
| Bleach bypass | A grade preset is easy to add in `engine/looks.js` (sat 0.6, contrast 1.3, `satHigh` 0.5); not shipped yet, add it with a story reason. |
| Muffled hearing | Low-pass the bed and VO briefly (score/mix change; see README "Engine gaps"). |
| Blown window light | Bright window plane + `post.js` `rays`; halation up for that shot. |

## Sources
- YMCinema, 25th anniversary of Saving Private Ryan: https://ymcinema.com/2023/12/05/the-25th-anniversary-of-spielbergs-saving-private-ryan-a-milestone-in-filmmaking/
- No Film School, how Saving Private Ryan changed war movies: https://nofilmschool.com/saving-private-ryan-changed-war-movies
- Color Culture, Saving Private Ryan cinematography analysis: https://colorculture.org/cinematography-analysis-of-saving-private-ryan-in-depth/
