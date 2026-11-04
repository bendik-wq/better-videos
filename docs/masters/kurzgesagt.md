# Kurzgesagt

**Why it matters to us:** bright, saturated colour that never looks cheap, clarity of one idea
per frame, and flat depth (layers, not perspective). A reference for bright-mode graphics.
Production numbers are already in `docs/research/visual-craft.md` §1 and
`docs/research/channel-breakdowns.md` §3; autopsies in `docs/library/video-autopsies/kurzgesagt.md`.

## Principles
- **Script, then sketch, then metaphor.** Research from books and papers; once the script is
  ready they sketch the video, looking for visual metaphors and transitions between ideas
  [cited: kurzgesagt.org "Our video process"; LingQ transcript].
- **Vector illustration + 2D animation, with some 3D** [cited: kurzgesagt.org].
- **At least 1,200 hours per video** [cited: kurzgesagt.org].

## Signature techniques [analysis]
- Dark navy or deep-colour backgrounds with luminous, saturated subjects; colour contrast
  rather than value contrast for separation.
- Flat depth: 3–5 layers, each a step lighter/hazier toward the back; soft long shadows; rim
  highlights on one side.
- Limited palette per video, with one hero colour.
- Constant, small motion: everything breathes (bobbing, twinkle), nothing static.
- Round, friendly shapes; danger as spiky shapes.

## Tension and scale
- Scale by zooming through orders of magnitude with consistent style [analysis].

## Sound and silence
- Original score per video; sound design "you don't consciously notice" [cited: LingQ transcript via visual-craft.md].

## How it cuts
- New picture every ~3 s; transitions are camera moves through one continuous illustrated world
  [cited: visual-craft.md].

## Colour philosophy [analysis]
- Saturated but **value-controlled**: hues are bright, but each layer has a planned lightness.
- Gradients are subtle and used for light, never on type.
- Saturation sits below the gamut edge: no pure #00ffff or #ff00ff.

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Saturated but tasteful | `bright-day` LUT: `vibrance` boosts low-chroma colours, the soft gamut `ceiling` (0.9) stops boosts before the sRGB edge; graphics use `LK.palette('bright-day')` (sea `#17a3a6`, sand `#e6cf9f`, navy `#0f1e33`). |
| Flat depth | In 2D sets draw 3–5 layers with a value step and a soft drop shadow (`shadowBlur` ~20 px, 20% black), as the look-lab map does. |
| One idea per frame | One subject, one label, one number; DOM type from `M.text` with word-time cues. |
| Everything breathes | `CAM.breathe` on the camera, small sinusoidal motion on icons (pure in t). |

## Sources
- Kurzgesagt, "Our video process": https://kurzgesagt.org/youtube/
- LingQ transcript, "How to make a Kurzgesagt video in 1200 hours": https://www.lingq.com/lt/anglu-kalbos-pamokos-internete/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/
