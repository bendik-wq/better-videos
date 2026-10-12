# Michael Mann

**Why he matters to us:** the city as a lit landscape at night, professionals doing their job,
and authenticity of procedure. Mann is the master of our old `noir-sodium` and `blue-hour` looks.

## Principles
- **Digital night as a new palette.** *Collateral* was shot largely on HD at night in moving
  vehicles with multiple cameras; the crew's visual mantra became "make the fill light your key
  light" [cited: BTL News, Dion Beebe portfolio].
- **Harder light for a harder film.** Beebe says *Miami Vice* moved toward harder light and more
  contrast than *Collateral*'s soft, wraparound look [cited: BTL News].
- **Authenticity of procedure:** professionals shown doing exact things (reloading, surveillance,
  radio protocol) [analysis].

## Signature techniques
- Sodium-orange city glow against cyan-blue skies; the city as a field of lights [analysis].
- Long lenses on faces with the city out of focus behind; side-on profiles [analysis].
- Shoulder-mounted handheld close to the action in gunfights [analysis].
- Overhead or extreme-wide city shots between scenes as punctuation [analysis].

## Tension and scale
- The lone figure against the sprawl (Vincent on the train, Neil at the window) [analysis].
- Real locations, real sound of gunfire echoing off buildings (the *Heat* street battle) [analysis].

## Sound and silence
- Ambient electronic and rock scores; location sound and reverberant gunfire [analysis].

## How he cuts
- Contemplative interludes (city wides, ocean) between procedural scenes [analysis].

## Colour philosophy
- Night is not black: it is navy, teal and sodium; fill is the key [cited: BTL News].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Lit city landscape | World kit `tod: 'blue'` or `LK.tod('blue-hour', W.TOD)`, `cityGlow`; `END-008` Globe turn into night; `settings.look = 'blue-hour'`. |
| Fill as key | Raise `tod.ambSky` and `envNightK`, keep practicals (`W.glowPoints`) the only warm accents; `blue-hour` LUT keeps warms saturated (band h 58 sat 1.16). |
| Lone figure | `CHR-004` Profile hold long lens (85–135 mm), `CHR-007` Isolation pull-out. |
| Interlude | `EST-004` Aerial hover pan between chapters, 4–6 s, no VO. |

## Sources
- BTL News, awards portfolio: Dion Beebe / Collateral: https://btlnews.com/awards/awards-portfolio-dion-beebecollateral
- Sabzian, "Partners in Crime": https://sabzian.be/text/partners-in-crime
