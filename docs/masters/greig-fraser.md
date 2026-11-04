# Greig Fraser

**Why he matters to us:** *Dune*'s desert daylight is the closest film reference for a sunlit
Strait of Hormuz: hard sun, sand, pale sky and open shade. He also shows how to make a strange
look (infrared) mean something.

## Principles
- **Hard light and open shade.** Most of *Dune: Part Two* plays in harsh desert light; the crew
  leaned on hard light and open shade rather than fighting the sun [cited: Cinematography Podcast
  ep. 257].
- **Real daylight where possible; match the rest.** Outdoor capture gave the best daylight, but a
  huge sandstorm was shot on a stage with haze and graded to match the sand [cited: Cinematography
  Podcast ep. 257].
- **A look must be motivated by the world.** Infrared black-and-white for Giedi Prime because the
  Harkonnens' pale skin suggested a world lit only by infrared sunlight [cited: Cinematography
  Podcast ep. 257].
- **Texture through glass.** He used reworked lenses for texture [cited: TVBEurope]; the digital
  capture was printed to film for the final look [cited: Cinematography Podcast].
- **Pre-visualize.** Unreal Engine was used for planning [cited: ASC Clubhouse Conversations].

## Signature techniques
- Sun as a top or back light on sand; silhouettes on dune ridges [analysis].
- Low saturation, warm-ochre palette with pale, almost white skies [analysis].
- Huge negative space; tiny figures [analysis].

## Tension and scale
- Brutal sun as threat; the empty horizon as danger [analysis].

## Sound and silence
- (See villeneuve.md: desert silence.)

## How he cuts
- (Director-led.)

## Colour philosophy
- Sand is the key colour; skin and sky sit around it; black stays rich [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Hard sun, open shade | `LK.tod('bright-day', W.TOD)`: sun 36° elevation, `ambSky` blue fill (open shade), `ambGround` warm sand bounce. The LUT's `shadowTint` keeps shade slightly blue (sky fill), `highTint` warm. |
| Sand stays golden | `bright-day` band h 88 (sat 0.95, shift −5): sand never lemon-yellow. |
| Ridge silhouette | `EST-007` Ridge-line reveal, `REV-006` Ridge rise to the vista, `CAM.droneRidgeReveal`. |
| Motivated alternate look | A second look only with a story reason (archive, a different place); `archive-warm` for history. |
| Previs | `--stills` look-dev; `projects/look-lab` to compare looks on the same frames. |

## Sources
- The Cinematography Podcast ep. 257, Greig Fraser: https://www.camnoir.com/ep257/
- TVBEurope, Greig Fraser on Dune: Part Two: https://www.tvbeurope.com/?p=115613
- ASC, Clubhouse Conversations: Dune: Part Two: https://theasc.com/videos/clubhouse-conversations-dune-part-two
- Deep Fried Movies, Dune: Part 2 cinematographer Greig Fraser: https://deepfriedmovies.com/2024/06/11/dune-part-2-cinematographer-greig-fraser/
