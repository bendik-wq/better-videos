# Spider-Man: Into the Spider-Verse (Sony Pictures Animation / Imageworks)

**Why it matters to us:** frame rate as expression, and print-graphic texture laid over 3D.
These are cheap on CPU and they make 3D read as authored, not as a game engine.

## Principles
- **Frame rate is acting.** The film is mostly animated on twos (each pose held two frames: 12
  unique images per second at 24 fps); animators switched between ones and twos to express
  character, so Miles looks clumsy while Peter B. Parker moves smoothly [cited: Creative Bloq;
  CG Spectrum]. Some animators worked on ones then baked out the stepped version, because posing
  every second frame directly looked stiff; hair and cloth simulation ran on ones [cited: Creative
  Bloq, quoting Josh Beveridge/Panko].
- **Every frame should read like a comic panel** [cited: Sony Imageworks via Creative Bloq].
- **Print texture as lighting.** Halftone dots and cross-hatched inking add texture, and halftone
  was used to indicate light [cited: CG Spectrum; Creative Bloq]. Colour offsets suggest depth of
  field [cited: CG Spectrum]. (We found no primary source naming "Ben-Day dots" specifically.)

## Signature techniques
- Stepped motion for characters while the camera moves on ones [analysis].
- Line work drawn over 3D renders; graphic speed lines and onomatopoeia [analysis].
- Mis-registered colour (CMYK offset) instead of optical blur for defocus [analysis].

## Tension and scale
- Contrast of frame rates inside one shot signals who is in control [analysis].

## Sound and silence
- Hip-hop score cut to action beats [analysis].

## How it cuts
- Comic-panel split screens and inset panels [analysis].

## Colour philosophy
- Saturated, graphic, complementary palettes; colour changes per universe [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Animate graphics on twos | `M.onTwos` in `engine/motion.js` (and Vox does 12 fps graphics in a 24 fps edit, see visual-craft.md); keep the 3D camera on ones. At 60 fps render, step graphics at 12–15 fps. |
| Step-printed memory | Style bible step-printing (`step: 3`, `trails: 0.4`) for a person or memory beat. |
| Halftone for print/archive | Overlay a halftone screen on archive photos in `archive-warm` sequences (a 2D comp pass, < 5 ms); not on the bright-day hero shots. |
| Colour-offset defocus | `post.js` `lens: 'vintage'` adds CA; use only in archive or "glitch" beats. |
| Panels | `TR` `split-slide`, `grid-reveal`; comparison layouts in `M.card`. |

## Sources
- Creative Bloq, how Into the Spider-Verse got its look: https://www.creativebloq.com/features/how-into-the-spider-verse-got-its-mind-blowing-look
- CG Spectrum, Spider-Verse look breakdown: https://www.cgspectrum.com/blog/spider-man-into-the-spider-verse-how-they-got-that-mind-blowing-look
- fxguide, Into the Spider-Verse: https://www.fxguide.com/?p=244678
