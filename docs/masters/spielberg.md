# Steven Spielberg (and Janusz Kamiński; see kaminski.md)

**Why he matters to us:** the grammar of the reveal and the disguised long take. Spielberg
blocks scenes so one shot covers several angles without the audience noticing, and builds
wonder by showing the face that sees before showing what it sees.

## Principles
- **The invisible oner.** Tony Zhou argues Spielberg is one of the best practitioners of the
  single-shot scene because his oners rarely draw attention to themselves; the blocking moves
  actors into close-up, profile and two-shot inside one take [cited: Every Frame a Painting,
  "The Spielberg Oner"; No Film School summary]. In *Munich* long masters let actors move
  naturally into close-up or profile within the same frame [cited: No Film School].
- **The Spielberg face.** Kevin B. Lee's video essay traces the wide-eyed close-up of a character
  looking at something off screen, from terror to awe; it pulls the viewer into the feeling
  before the object is shown [cited: Kevin B. Lee, "The Spielberg Face"; Slashfilm].
- **Reveal grammar:** face first, then the thing, then the face again (reaction), then the
  wide that puts both in the world [analysis of *Jaws*, *Close Encounters*, *Jurassic Park*].

## Signature techniques
- Push-in on a face as realization lands (often with a dolly-zoom in *Jaws*) [analysis].
- Backlight, God rays and lens flare through haze; light as wonder [analysis].
- Foreground framing of the reveal by people's silhouettes [analysis].
- The "L system": actors move along an L so the camera turns 90° and finds a new composition
  [cited: Wolfcrow].

## Tension and scale
- Withhold the object (the shark is rarely seen); show the effect (barrels, water) [analysis].
- Scale reveal: start tight on detail, pull back to the vast thing (the *Jurassic Park* brachiosaur) [analysis].

## Sound and silence
- John Williams leitmotifs; a two-note motif can carry an entire threat [analysis].
- Music drops out right before the reveal and returns with it [analysis].

## How he cuts
- Fewer cuts than peers in dialogue scenes because the oner does the coverage [cited: EFAP].
- On the reveal, the cut to the face comes **before** the cut to the object [analysis].

## Colour philosophy
- Warm, glowing highlights and blown windows (Kamiński); bleach-bypass desaturation for war
  [cited for *Saving Private Ryan*: kaminski.md].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Disguised oner | `engine/oner.js` (`O.oner` with segments `O.keys`, `O.follow`, `O.geo`), catalog `ONE-*`; each segment frames a new "angle" so the oner covers 3–4 compositions. Keep it unnoticed: no speed spikes (`O.smoothness`). |
| Spielberg face (faceless channel) | We hide faces, so the "face" is a silhouette or a back-lit figure turning (`CHR-012` Arc to the eyes, `CHR-020` Silhouette push into the light, `PE.look.rig('backlit')`), or an object that "sees": a radar screen, a satellite dish, a ship's bridge window. |
| Reveal order | Beat 1: watcher (`REV-022` Rise behind the figure) → beat 2: the thing (`REV-002` Pull-back reveal or `REV-006` Ridge rise to the vista) → beat 3: wide with both (`EST-003`). |
| Push on realization | `CAM.creep` or `REV-007` Dolly-zoom realisation (`CAM.dollyZoom`, use once per episode). |
| Light as wonder | `post.js` `rays`, world `tod.flare`; finish halation up only on that shot (bright-day halation is otherwise soft). |

## Sources
- Every Frame a Painting (Wikipedia entry, episode list): https://en.wikipedia.org/wiki/Every_Frame_a_Painting
- No Film School, study of Spielberg's long takes: https://nofilmschool.com/2014/05/study-steven-spielbergs-cinematography-help-you-master-long-take
- No Film School, Munich: https://nofilmschool.com/munich-film-spielberg
- Kevin B. Lee, "The Spielberg Face": https://alsolikelife.com/spielberg-face
- Slashfilm, VOTD: The Spielberg Face: https://www.slashfilm.com/518956/votd-spielberg-face/
- Wolfcrow, "The Steven Spielberg L system": https://wolfcrow.com/the-steven-spielberg-l-system/
