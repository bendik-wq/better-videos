# Edgar Wright

**Why he matters to us:** the edit as a rhythm instrument. Match cuts, whip pans, sound-synced
action and fast montages are exactly the tools a faceless explainer uses for transitions between
ideas.

## Principles
- **Use the frame for the joke (or the point).** Tony Zhou's "How to Do Visual Comedy" argues
  that modern comedies are top-heavy on improv and light on sight gags, while Wright uses framing,
  what is in and out of frame, camera moves and cuts to get the laugh [cited: Every Frame a
  Painting transcript; Laughing Squid].
- **Picture and sound together.** The essay lists Wright's techniques, including matching scene
  transitions, perfectly timed sound effects and action synchronized to music [cited: EFAP
  transcript via Amara].
- **Whip-pan match cuts:** a whip at the end of one shot cut into the motion blur at the start of
  another, so the move feels continuous [cited: StudioBinder].

## Signature techniques
- Hyper-fast insert montages with a sound hit per shot (the *Shaun of the Dead* morning routine,
  the *Hot Fuzz* paperwork) [analysis].
- Graphic match cuts between unrelated objects on shape or motion [analysis].
- Choreography to music (*Baby Driver* cut to the track's beats) [analysis].

## Tension and scale
- Rhythm is tension: accelerating inserts build to a hold [analysis].

## Sound and silence
- Every cut has a sound; whooshes, clicks and impacts are designed per cut [analysis].
- Music drives the edit (*Baby Driver*) [analysis].

## How he cuts
- On action and sound; montage at 4–8 frames per insert; return to normal speed for the beat
  [analysis].

## Colour philosophy
- Saturated primaries, often keyed to character [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Match cut | `TR` `match-cut` (anchors converge, hard cut at the midpoint) and `match-dissolve`; `TRN-011` Graphic-match orbit landing; plan match pairs in the shot plan (`shot-design`). |
| Whip-pan match | `TRN-001` Whip pan out + `TRN-002` Whip pan in with `TR` `whip`; build the outgoing rig with `vOut` and the incoming with `carry` (`C.path`) so speed is continuous. |
| Insert montage | `beats` in project.json (each beat starts on a spoken word); 0.25–0.5 s per beat; `score.transitions` adds a matching sfx per transition automatically. |
| Sound per cut | `sfx` cues `impact.soft`, `ui.tick`, `shutter`, `paper.page`; keep each −6 to −14 dBFS. |

## Sources
- Every Frame a Painting, "Edgar Wright – How to Do Visual Comedy" (subtitles/transcript): https://amara.org/subtitles/lJK2dFGSdkTE/en-gb/6/download/Edgar%20Wright%20-%20How%20to%20Do%20Visual%20Comedy.en-gb.srt
- Laughing Squid summary: https://laughingsquid.com/how-to-do-visual-comedy-an-analysis-of-director-edgar-wrights-humorous-cinematic-styles-and-techniques/
- StudioBinder, whip pan shot: https://www.studiobinder.com/camera-shots/camera-movements/whip-pan-shot/
