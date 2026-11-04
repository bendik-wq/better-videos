# Apple / Buck / ManvsMachine motion design

**Why it matters to us:** premium clarity. Apple keynote and product films (often made with
studios like Buck and ManvsMachine) are the reference for "bright, clean, expensive": white or
near-black space, one object, perfect easing, type that arrives on the beat.

## Principles
- **Apple commissions motion studios as artists.** For the iMac Pro launch Apple commissioned six
  visual artists, including Buck and ManvsMachine, and published making-of videos [cited:
  Mynavi]. Buck's executive director Gareth O'Brien said the brief was open-ended; Buck made a
  film about its own collaborative process [cited: Designers Institute of New Zealand].
- **Idea and technique inform each other.** ManvsMachine's name reflects that approach; its
  process starts with a group discussion, then individual exploration, then a narrowing to one
  or two ideas [cited: One Point Four interview with Mike Alderson].

## Signature techniques [analysis]
- One hero object, lots of negative space, soft studio light (large top softbox + rim).
- Easing: long, confident decelerations (ease-out ~70% of the move), no bounce on product.
- Type: one short line, big, perfectly kerned, appears with a short mask-up or fade+rise on the
  beat; numbers count up.
- Colour: neutral grounds (white, light grey, deep graphite) plus one accent drawn from the product.
- Material close-ups with slow macro slides and rack focus.

## Tension and scale
- Reveal by light: the object emerges from darkness or from white as light sweeps across it.

## Sound and silence
- Clean sound design (soft clicks, whooshes with a long tail) tightly synced to motion.

## How it cuts
- On motion completion, never mid-ease; match cuts on shape and colour.

## Colour philosophy
- Clarity over mood: whites are true white, blacks true black, accents controlled.

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Apple ease | `CAM.EASE` / `C.path` with `decel` 0.6–0.7, `accel` 0.25; never linear; `smoother` for graphics. |
| Hero object | `OBJ-001` Hero orbit in the void, `OBJ-009` Product arc on the pedestal, `OBJ-002` Macro slide; DOF via `post.js` `dof`. |
| Light-sweep reveal | Animate the key's azimuth over 1.5–2.5 s (pure in t), or `TR` `luma-wipe`. |
| Type on the beat | `M.text.maskUp`, `M.text.counter` keyed to word times; one line, `Instrument Serif` large; bright mode: navy ink on paper. |
| Keynote clarity | `settings.look = 'bright-day'` with title cards on `LK.palette('bright-day').paper` (`#fbf8f2`). |

## Sources
- Mynavi News, Apple iMac Pro artist films: https://news.mynavi.jp/article/20180417-617729/
- Designers Institute of New Zealand, Buck "Power to the Pro": https://designersinstitute.nz/case-study/power-to-the-pro/
- One Point Four, ManvsMachine interview: https://www.onepointfour.co/2013/02/22/manvsmachine/
- Adobe blog, artist spotlight: ManvsMachine: https://blog.adobe.com/en/publish/2017/09/18/artist-spotlight-ellie-bailey-on-the-success-of-manvsmachine
