# Arcane / Fortiche

**Why it matters to us:** proof that 3D can look painted and premium by rejecting
photorealism's last 10% and adding hand-made texture. Relevant to every 3D set that can't be
replaced with real footage.

## Principles
- **Why chase photorealism?** Fortiche co-founder Pascal Charrue argues that animation is
  expensive, so why pursue photorealism if you could just film the same thing; a stylized look
  was hard to sell to clients who feared people wouldn't understand it [cited: 3DVF, in French].
- **Human imperfection.** Fortiche's FAQ describes the "Fortiche touch" as human imperfection:
  digital precision swapped for hand-crafted textures; tools include Maya, Houdini, Nuke, Mari
  and in-house tools [cited: Fortiche FAQ].
- **Hybrid pipeline.** A rough, tactile stylized 3D base with oil-painting environments,
  hand-drawn effects (smoke, sparks, light) and cel shading layered on top [cited: RedShark News].

## Signature techniques
- Hand-painted textures on 3D models; painted matte backgrounds [cited: student/secondary sources;
  analysis].
- 2D effects animation over 3D (sparks, smoke, magic) [cited: RedShark News].
- Strong colour keys per scene; rim light in saturated complementary colours [analysis].

## Tension and scale
- Painterly backgrounds keep scale legible without detail overload [analysis].

## Sound and silence
- Music-video sequences cut to licensed songs [analysis].

## How it cuts
- Montage set to music; graphic transitions [analysis].

## Colour philosophy
- Saturated, painterly, complementary (teal/orange, magenta/green) but always value-structured
  [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Painted not photoreal | When a set can't be real footage, stylize deliberately: matte materials (roughness ~0.85), simplified forms, painted HDRI sky, grain via the finish. Never half-photoreal. |
| Hand-made texture | Paper/canvas texture overlay at 3–6% in graphics sets (map, chart) for bright mode, stepped at 12 fps (Vox does the same). |
| 2D effects over 3D | DOM/SVG overlays drawn on (`K.markerLoop`, `M.callout.arrow`) tracked to 3D via `K.toScreen`. |
| Value structure | Grey-scale check on every still (rules.md). |

## Sources
- 3DVF, "Arcane: les coulisses de la série" (Pascal Charrue): https://3dvf.com/redaction/arcane-les-coulisses-de-la-serie-evenement-issue-de-league-of-legends/
- Fortiche FAQ: https://forticheprod.com/faq/
- RedShark News, why Arcane looks so good: https://redsharknews.com/why-netflixs-arcane-looks-so-good-how-fortiche-ramped-up-the-animation-pipeline
