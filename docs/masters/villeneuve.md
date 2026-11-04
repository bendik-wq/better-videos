# Denis Villeneuve

**Why he matters to us:** dread built out of stillness, scale that makes the viewer feel small,
and silence used as an instrument. *Sicario* is the template for a geopolitical tension sequence;
*Dune*'s daytime desert is a reference for our bright look.

## Principles
- **Stillness, then a burst.** Villeneuve on *Sicario*: "I was thinking a lot about Akira
  Kurosawa and the way he approached violence... There's a great contrast between silence and
  immobility, and the bursts of violence that come immediately after those quiet moments"
  [cited: MovieMaker].
- **Stretch time.** He hired editor Joe Walker partly because the film has high tension with
  relatively little action, and needed someone who could stretch time [cited: MovieMaker].
- **Silence is designed, not empty.** "To me I like silence, and Alan [Robert Murray] created an
  almost operatic silence as part of his very sophisticated sound design" [cited: MovieMaker].
- **The landscape is a character.** He describes the desert of *Dune* as introspective because
  of the weight of the heat, the open plains and the silence [cited: Tor.com on Dune's sound].

## Signature techniques
- Wide, high, static frames that turn people and vehicles into tokens on a board (the *Sicario*
  border convoy aerials) [analysis; see StudioBinder].
- Monolithic geometry: a single huge shape against sky or haze (the *Arrival* shell, the *Dune*
  ornithopters and Harkonnen architecture) [analysis].
- Low, sub-bass score felt more than heard: Jóhann Jóhannsson's *Sicario* score is rumbling
  synths, spare cello and insistent percussion [cited: MovieMaker].
- Silhouettes against bright haze rather than lit faces (*Sicario* dusk descent) [analysis].

## Tension and scale
- **Static staging creates dread.** The *Sicario* border-crossing scene keeps the convoy stuck in
  traffic; the slow pace turns armoured SUVs into targets, and the sound design is "a study in
  negative space" [cited: No Film School, StudioBinder].
- The cutaway to the god's-eye wide says "there is nowhere to hide" [cited: StudioBinder, via
  docs/research/visual-craft.md].
- Scale ratio: subject occupies < 3% of the frame, horizon placed low, sky dominates [house].

## Sound and silence
- Remove the score as tension rises; leave room tone, wind, a distant engine. Let the low end
  carry fear [analysis].
- A single sub hit (not a cymbal) for the release [analysis].

## How he cuts
- Slower as tension rises (the audience scans each frame for threat), faster at the release
  [cited: StudioBinder via visual-craft.md].
- Long holds on faces watching rather than on the event [analysis].

## Colour philosophy
- Restrained, near-monochrome palettes per world: *Dune*'s Arrakis is sand, ochre and pale sky;
  *Blade Runner 2049* is one dominant hue per sequence [analysis; see deakins.md, greig-fraser.md].
- Daylight is hard and hot; shadows are open, not black [cited for Dune: Greig Fraser on hard
  light and open shade, Cinematography Podcast ep. 257].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Tokens on a board | `EST-005` God's-eye slow rotate, `DAT-009` God's-eye pattern count, `CAM.godRotate` at < 2°/s; `W.traffic` / tanker fleet in the world kit; red marker loop only on the one that matters (`K.markerLoop`). |
| Stillness then burst | `EST-020` Silent wide lock-off (`CAM.lockOff` + `K.handheld` amp ≤ 0.02) held 4–6 s, then a hard `cut` to `OBJ-012` or a `snapZoom` on the word; sfx `sub.drop` 0.1 s **after** the cut. |
| Monolith | `OBJ-001` Hero orbit in the void, `CHR-001` Silhouette against the sky; low camera, 50–85 mm, haze on (`tod.hazeDen` up 1.5x). |
| Operatic silence | Score cue gap of 2–4 s; keep `room.tone` / `wind.amb` at −30 dBFS; no transition sfx on the cut into silence. |
| Daytime desert | `settings.look = 'bright-day'`, world `tod: LK.tod('bright-day', W.TOD)`; sun 30–45° above the horizon, open (blue) shadows. |

## Sources
- MovieMaker, "Kings of the Underworld" (Sicario): https://www.moviemaker.com/kings-of-the-underworld-sicario-denis-villeneuve-benicio-del-toro-emily-blunt/2/?amp=1
- No Film School, the Sicario border-crossing scene: https://nofilmschool.com/sicario-border-crossing-scene
- StudioBinder, Sicario border scene explained: https://www.studiobinder.com/blog/sicario-border-scene-explained/
- Tor.com, Denis Villeneuve on Dune's sound design: https://tor.com/2022/03/17/denis-villeneuve-dune-sound-design
- BFI, "Strange new worlds: the craft of Denis Villeneuve": https://www.bfi.org.uk/features/strange-new-worlds-craft-denis-villeneuve
- The Cinematography Podcast ep. 257 (Greig Fraser): https://www.camnoir.com/ep257/
