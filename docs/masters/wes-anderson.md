# Wes Anderson

**Why he matters to us:** planimetric framing and fixed palettes make an explainer graphic feel
authored. His flat, frontal frames are the live-action twin of a well-designed infographic.

## Principles
- **Planimetric staging.** David Bordwell (borrowing Heinrich Wölfflin's term) describes a frontal
  presentation with people framed against a perpendicular background; Anderson crowds people
  in layers rather than along a single line, giving "a sense that we are looking from a distance
  into an enclosed world" [cited: Bordwell, *The Grand Budapest Hotel*].
- **Straight on, always.** His long-time DP Robert Yeoman shoots subjects straight on, which
  gives the films their two-dimensional quality [cited: Far Out].
- **Whip pans as punctuation.** Yeoman has a reliable technique for whip pans, including finding
  a comfortable end position before the move [cited: Backstage, quoting Cooke Optics].
- **Aspect ratio as period.** *Grand Budapest* changes aspect ratio by era (4:3, 1.85, 2.39)
  [cited: Bordwell].

## Signature techniques
- Centred subject, symmetrical set, camera at subject height, 90° pans and tracks [analysis].
- One controlled palette per film (pinks and purples in *Grand Budapest*, desert pastels in
  *Asteroid City*) [analysis].
- Inserts of documents, maps and objects shot top-down, flat, legible [analysis].
- Miniatures and models used openly [analysis].

## Tension and scale
- Comedy and melancholy from rigid geometry; when the frame breaks symmetry, it means
  something [analysis].

## Sound and silence
- Period music and Alexandre Desplat's plucked, rhythmic scores; deadpan silences [analysis].

## How he cuts
- Cuts on whip pans and lateral tracks; chapter cards and title inserts structure the film [analysis].

## Colour philosophy
- Pastel but controlled: every prop belongs to the palette; accents are rare [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Planimetric frame | Camera perpendicular to the set (`CAM.truck` or `CAM.parallaxSlide` with `look` parallel offset), 40–65 mm, subject centred; `DAT-011` Lateral timeline track. |
| Whip punctuation | `TR` `whip` (0.42 s) or `CAM.whipPan` with a clean end pose (Yeoman's rule: rehearse the landing frame); sfx `whoosh.m`. |
| Top-down insert | `OBJ-004` Top-down object rotate, `OBJ-016` Document scan; `M.callout.doc`. |
| Chapter cards | `M.card.chapter`; in bright mode use `LK.palette('bright-day')` (navy on paper, red numeral). |
| Palette discipline | One look per episode (`engine/looks.js`); graphics take colours from `LK.palette(look)`, never ad hoc hex. |

## Sources
- David Bordwell, "The Grand Budapest Hotel: Wes Anderson takes the 4:3 challenge": https://www.davidbordwell.net/blog/2014/03/26/the-grand-budapest-hotel-wes-anderson-takes-the-43-challenge/
- Far Out, how to shoot like Wes Anderson: https://faroutmagazine.co.uk/how-to-shoot-like-wes-anderson/
- Backstage, four lessons from Wes Anderson's style: https://www.backstage.com/magazine/article/wes-anderson-filmmaking-style-80156/
