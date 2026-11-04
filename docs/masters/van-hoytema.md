# Hoyte van Hoytema

**Why he matters to us:** large-format daylight. *Interstellar*'s farm and *Dunkirk*'s beach and
sea are the main references for the episode-3 bright look: hard real daylight, clean skies,
grey-blue sea, skin that looks like skin.

## Principles
- **Large format as realism.** *Dunkirk*: roughly 70% 15-perf 65mm IMAX, the rest 5-perf 65mm
  (quieter for dialogue) [cited: ASC Clubhouse Q&A]. *Interstellar*: as much IMAX as possible,
  roughly 60–70 minutes of the finished film, the rest anamorphic 35mm [cited: Hollywood
  Reporter].
- **Documentary reflexes.** The team wanted to capture action "as though they were shooting a
  documentary", reacting instead of using fixed set-ups [cited: ASC Clubhouse Q&A]. Much of
  *Interstellar* was handheld by van Hoytema himself [cited: Hollywood Reporter].
- **Compose for the near-square IMAX frame:** more central framing, close focus and shallow depth
  for intimacy [cited: Jonny Elwyn summary of the HitFix/ASC material].
- **Photochemical finish.** The *Dunkirk* Q&A touched on grading photochemically rather than in a
  digital intermediate [cited: ASC Clubhouse Q&A].

## Signature techniques
- Natural overcast or hard sun; no visible fill [analysis].
- Cameras mounted on real aircraft and boats for POV [analysis].
- Faces in the corner of a vast sharp frame; the horizon as a line through the frame [analysis].

## Tension and scale
- Real water, real wind on lenses; the rawness is the tension [analysis].

## Sound and silence
- (See nolan.md.)

## How he cuts
- (Director-led; see nolan.md.)

## Colour philosophy
- Neutral, honest daylight; colour comes from the location (green-gold corn, grey Channel, sand)
  [analysis]. No teal-and-orange.

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Daylight IMAX realism | `settings.look = 'bright-day'`; real footage (`FT.footage` with `grade: 'none'` so the LUT does the work) and NAIP/Sentinel aerials (`IM.terrain` with `LK.imagery('bright-day')`). |
| Aircraft/boat POV | `FOL-011` Drone follow and rise, `FOL-023` High chase, long lens; `CAM.follow` with small `float` (≤ 0.03) and measured `K.handheld`. |
| Central composition for the hero | On hero shots, centre the subject (thumbnail-friendly too); elsewhere thirds. |
| Grain like 65mm | `finish.grain` 5 (bright-day default); never above 9 in daylight. |

## Sources
- ASC, Dunkirk discussion with Hoyte van Hoytema: https://theasc.com/articles/dunkirk-discussion-with-hoyte-van-hoytema-asc-fsf-nsc
- ASC video, Dunkirk: Hoyte van Hoytema, part 1: https://theasc.com/videos/dunkirk-hoyte-van-hoytema-asc-fsf-nsc-part-1
- Hollywood Reporter, Interstellar cinematographer: https://www.hollywoodreporter.com/movies/movie-news/interstellar-cinematographer-dishes-joining-christopher-751398/
- Jonny Elwyn, behind the scenes on Interstellar: https://jonnyelwyn.co.uk/film-and-video-editing/cool-videos-films-projects-creative-work/behind-the-scenes-on-interstellar/
- The Cinematography Podcast ep. 252 (Hoyte van Hoytema): https://www.camnoir.com/ep252/
