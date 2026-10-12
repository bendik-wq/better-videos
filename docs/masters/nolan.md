# Christopher Nolan

**Why he matters to us:** scale that feels physically real, time used as the structure of the
film, and sound that tightens the screw without the audience noticing. Our documentaries are
about systems, deadlines and consequences; that is Nolan's subject too.

Tags: **[cited]** the claim comes from the source listed; **[analysis]** our reading of the films;
**[house]** our rule.

## Principles
- **Capture it for real, then enlarge it.** For *Interstellar* the production planted about 500
  acres of real corn in Alberta rather than build Cooper's farm in CG, and later wrecked it for
  the dust-storm scenes [cited: Far Out, soapcentral]. *Dunkirk* was shot entirely on large
  format: roughly 70% on 15-perf 65mm IMAX, the rest on 5-perf 65mm, because the IMAX cameras
  were too loud for dialogue [cited: ASC Clubhouse Q&A]. The lesson for a faceless channel:
  **real material first** (real footage, real aerials, real data), our own 3D only where no
  camera could go.
- **The audience should feel the frame is documentary, not designed.** Van Hoytema says he and
  Nolan preferred to capture the action "as though they were shooting a documentary", reacting
  rather than pre-planning [cited: ASC Clubhouse Q&A]. Much of *Interstellar* was handheld by van
  Hoytema himself [cited: Hollywood Reporter].
- **Structure is the special effect.** Nolan describes the Shepard tone ("an illusion where
  there's a continuing ascension of tone") and says he wrote the *Dunkirk* screenplay as its
  structural equivalent [cited: The Playlist / Business Insider round-up]. Three timelines (the
  mole: one week; the sea: one day; the air: one hour) are cross-cut so that every strand is
  always climbing [analysis].
- **Colour as point of view.** In *Oppenheimer*, Nolan says the colour scenes are subjective
  (Oppenheimer's experience) and the black-and-white scenes objective [cited: Total Film via
  The Digital Fix]. A look is a narrative device, not decoration.

## Signature techniques
- **IMAX for scale, 35/65mm for intimacy:** switch format (aspect, resolution, grain) when the
  story opens up [cited: van Hoytema on *Interstellar*, Hollywood Reporter; ASC].
- **The ticking clock made literal:** Nolan sent Zimmer a recording of his own pocket watch, and
  its tick runs through the *Dunkirk* score; the first teaser was built on it [cited: The
  Playlist; Gulf News]. A countdown is felt as a pulse, not shown as a number.
- **Cross-cutting by intensity, not chronology:** strands are intercut so their climaxes stack
  [analysis].
- **Practical light and real weather:** overcast Channel light in *Dunkirk*, natural daylight
  in the *Interstellar* farm [analysis of the films; see van-hoytema.md].
- **Wide-and-close only:** few mid shots; either the human scale against the world or the face
  [analysis].

## Tension and scale
- Scale = a known object (a man, a ship, a Spitfire) small in a vast, sharp frame. The sharpness
  matters: large-format detail makes the frame feel real enough to be dangerous [analysis].
- Tension = time pressure + an audible pulse + intercutting + withheld release. *Dunkirk* has
  almost no dialogue exposition [analysis].

## Sound and silence
- Score and sound design are one layer. Sound editor Richard King describes Nolan's plan to let
  practical sounds (the ticking clock) provide texture while the music drives [cited: Gulf News].
- Nolan admits the ticking was a months-long question of "how much is too much" [cited: The
  Playlist]. Pulse under narration must sit low and never compete with the voice [house].
- The cut to silence on impact (the bomb test in *Oppenheimer*) is more violent than any boom
  [analysis].

## How he cuts
- Long cross-cut sequences with accelerating alternation toward the climax; the release is a
  single hold [analysis].
- Cuts on action and on sound; rarely on dialogue [analysis].

## Colour philosophy
- Photochemical, naturalistic, often desaturated cool daylight (*Dunkirk*), warm dust and
  green-gold corn (*Interstellar*) [analysis]. Skies are kept, never clipped [analysis].
- Our bright look (`bright-day`) borrows the *Interstellar* farm and the *Dunkirk* beach: clean
  whites, real blue sky, a gentle shoulder, sand that stays golden.

## How we execute this in our engine
| Nolan move | Engine recipe |
|---|---|
| IMAX-scale establishing frame | `EST-001` Skyline IMAX push, `EST-003` Tiny figure huge world; camera `CAM.creep` or `CAM.dollyIn` at 0.5–1.5 %/s, 24–32 mm; real footage via `FT.footage` (e.g. `ships-lcs-formation`) or NAIP via `IM.terrain`. |
| Real material first | `engine/footage.js` PD clips and `engine/imagery` aerials before any 3D; 3D world only for oners (`engine/oner.js`). |
| Ticking clock | `score.py` cue `ticks` (or `sfx` `clock.tick`) at a tempo that **accelerates across a chapter**; duck under VO. Missing: a true Shepard-tone riser (see README "Engine gaps"). |
| Shepard-tone structure | Cross-cut 2–3 strands (e.g. tanker, navy, market) with `whip` (sideways in space) or hard `cut`; shorten each strand's shots by ~15% per alternation (`shot-design` cut-rate targets). |
| Format change for scale | Switch look (`settings.look` / per-sequence `LK`), add letterbox-to-full-frame open on the hero reveal (`shape-box` transition), raise grain for the "35mm" strand. |
| Subjective vs objective colour | Two looks for two points of view: `bright-day` for the present, `archive-warm` for history; never mix within a sequence. |
| Silence on impact | Drop the drone (`score` cue gap) for 0.5–1.5 s at the hit, then `impact.boom` or `sub.drop` after the silence, not on it. |

## Sources
- Far Out, "How Christopher Nolan became a corn farmer while making Interstellar": https://faroutmagazine.co.uk/christopher-nolan-corn-field-interstellar/
- Soapcentral, Interstellar filming locations: https://www.soapcentral.com/entertainment/where-interstellar-filmed-filming-locations-christopher-nolan-s-academy-award-nominated-sci-fi-drama-explored
- ASC, Dunkirk discussion with Hoyte van Hoytema: https://theasc.com/articles/dunkirk-discussion-with-hoyte-van-hoytema-asc-fsf-nsc
- Hollywood Reporter, Interstellar cinematographer: https://www.hollywoodreporter.com/movies/movie-news/interstellar-cinematographer-dishes-joining-christopher-751398/
- The Playlist, Nolan and Zimmer on the Dunkirk score: https://theplaylist.net/nolan-hans-zimmer-dunkirk-score-20171130/
- Gulf News, "Dunkirk soundtrack: how it all came together": https://gulfnews.com/entertainment/dunkirk-soundtrack-how-it-all-came-together-1.2066116
- The Digital Fix, Oppenheimer colour vs black and white: https://www.thedigitalfix.com/oppenheimer/good-reason-why-some-scenes-black-and-white
