# Alfonso Cuarón (with Emmanuel Lubezki; see lubezki.md)

**Why he matters to us:** the long take as immersion, and environment given the same weight as
character. That second idea is the core of a geopolitics documentary: the strait, the weather and
the ships are the protagonists.

## Principles
- **The viewer as a participant.** Cuarón wanted audiences to feel part of the journey in
  *Gravity*, treating the viewer as "a kind of third astronaut" [cited: Film Comment].
- **Character and environment have equal weight.** A theory he developed over earlier films
  [cited: Film Comment]. The camera drifts off the hero to the background (the burning farm,
  the refugees) in *Children of Men* [analysis].
- **Realism of the near future.** *Children of Men* aimed to make a grim future as realistic as
  possible [cited: No Film School].

## Signature techniques
- Extended takes: the *Children of Men* car ambush plays as one continuous moment [cited: John
  August]; *Gravity* used extended takes up to 13 minutes [cited: Wellesnet / secondary].
- Handheld-feeling but designed moves on rigs; the camera passes through windows and helmets
  [analysis].
- Wide lenses close to the subject so background stays readable [analysis].

## Tension and scale
- No cut means no escape: the audience is trapped with the character [analysis].
- Scale through environment: the Earth behind the astronaut, the city behind the car [analysis].

## Sound and silence
- *Gravity*: no sound in vacuum; sound travels through contact (vibration through the suit)
  [analysis].

## How he cuts
- Rarely; the cut is reserved for a change of state [analysis].

## Colour philosophy
- Naturalistic, desaturated, overcast for *Children of Men*; true blacks and sunlight for
  *Gravity* [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Immersive oner | `engine/oner.js`, catalog `ONE-001` Sky-to-car, `ONE-012` Hero-to-skyline, `ONE-020` Flyover to the next set; keep velocity continuous (`O.smoothness` report, `projects/world-lab/framediff.py`). |
| Environment weight | `CAM.lookAtShift` / `REV-014` Look-at shift to the second subject: drift from the hero object to the context (the coast, the navy ship) mid-shot. |
| Through-the-glass | `REV-017` Through-the-screen reveal, `ONE-006` Screen-push-into-world; `TR` `zoom-through`. |
| Contact sound | When a scene has no air (orbit, underwater), use only low `sub.drop` and `room.tone`; no whooshes. |

## Sources
- Film Comment, interview with Alfonso Cuarón: https://www.filmcomment.com/interview-alfonso-cuaron/
- John August, Children of Men Q&A notes: https://johnaugust.com/?p=12257
- No Film School, Cuarón's cinematic style: https://nofilmschool.com/2013/10/incredible-cinematic-style-of-alfonso-cuaron
- Wellesnet, Children of Men and the long take: https://www.wellesnet.com/?p=128
