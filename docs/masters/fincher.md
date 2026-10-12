# David Fincher

**Why he matters to us:** invisible, motivated camera. Fincher's camera behaves like a machine
that only moves when the subject does, so every movement means something. That discipline is
the cure for "AI slop" floating cameras.

## Principles
- **The camera is synchronized to behaviour.** "The character moves; the camera moves. The
  character stops; the camera stops" [cited: Filmdaze analysis]. Eye direction motivates the
  move (a *Zodiac* example) [cited: Filmdaze].
- **Push in when power shifts.** In *The Social Network* depositions, the camera moves in each
  time Zuckerberg gains the upper hand [cited: Pixflow].
- **Imperceptible drift.** Slow moves in *Zodiac* run at a fraction of an inch per second so
  ordinary scenes stay uneasy [cited: Pixflow].
- **Precision through repetition:** the approach depends on many takes until the operator and
  actor are in sync [cited: Filmdaze].

## Signature techniques
- Locked-off or mechanically smooth moves (dolly, crane, motion control); no handheld wobble
  [analysis].
- Low-key, top-lit, green-yellow sodium and cyan-fluorescent palettes; practicals in frame
  [analysis].
- Impossible camera moves done digitally but presented as mechanical (the *Panic Room* house
  traversal, the *Fight Club* opening) [analysis].
- Information on screens and documents, shot clean and legible [analysis].

## Tension and scale
- Tension comes from procedure: watching people do exact things in order (*Zodiac*'s cipher
  work, *The Social Network*'s coding) [analysis].
- A static frame held a beat too long makes the viewer search for the threat [analysis].

## Sound and silence
- Reznor/Ross scores: synthetic pulses and textures that sit under dialogue; room tone matters
  [analysis].

## How he cuts
- Fast, overlapping dialogue cut on rhythm (Kirk Baxter / Angus Wall); cut points chosen to the
  frame [analysis].
- Montage of process (hands, screens, documents) at a steady tempo [analysis].

## Colour philosophy
- Desaturated, contrasty, with yellow-green highlights and teal shadows; blacks dense but not
  crushed [analysis]. This is close to our old `noir-sodium` look.

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Locked follow | `FOL-005` Fincher locked follow; `CAM.follow` with `lag` 0.1–0.2, no `float`; `C.moves.followThrough` with `overshoot: 0`. |
| Move only when the subject moves | Drive the rig's progress from the subject's progress (`O.attach(subject, keys)`), not from time; hold `CAM.hold` when the subject stops. |
| Power-shift push | `CAM.creep` 1–2 %/s keyed to the word that turns the argument (`beats` or `O.oner` cues). |
| Process montage | `OBJ-016` Document scan, `OBJ-020` Screen close push and drift; `M.text.typewriter`, `M.text.redact`, `M.callout.doc`; sfx `type.run`, `ui.tick`. |
| Fincher palette | `settings.look = 'noir-sodium'`; keep it for night investigation chapters. |

## Sources
- Filmdaze, "David Fincher: a visual virtuoso – top 5 scenes": https://filmdaze.net/david-fincher-a-visual-virtuoso-top-5-scenes/
- Pixflow, David Fincher camera movement: https://pixflow.net/blog/david-fincher-camera-movement/
- Time Out, David Fincher on The Social Network: https://www.timeout.com/film/david-fincher-on-the-social-network-interview
