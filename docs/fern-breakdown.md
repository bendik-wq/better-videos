# Fern: how it's made, and where we beat it

## What we could and couldn't access

- YouTube blocks video downloads from cloud servers ("Sign in to confirm you're not a bot"), so we
  could not pull Fern's actual footage into this environment. We *can* pull channel metadata
  (titles, durations, view counts) and thumbnails. To study real frames, download a video on your
  own machine and drop it in `refs/` (git-ignored), or export YouTube cookies and pass
  `--cookies` to `yt-dlp`.
- Public facts: Fern is made by the team behind Simplicissimus (German). Narration is sometimes by
  hoog. They build reconstructions in **Blender**, reuse 3D assets across German and English
  versions, and run a production team of roughly 60 people (researchers, 3D artists, editors).
  Videos run 15–50 minutes and come out almost weekly.

## Fern's visual grammar (from 12 recent thumbnails and the channel's format)

1. **One object in a black void.** A styrofoam box, a pill, a door: a single hero object with a
   key light and nothing else. The object *is* the story.
2. **Diorama reconstructions.** Buildings, planes, maps and crime scenes rebuilt as clean, slightly
   simplified 3D models, filmed with slow cameras like a museum model.
3. **Red is the only accent.** Red circles, red labels, red-lit buildings, blood. Everything else is
   black, grey or the subject's own colour.
4. **Evidence treatment.** Archive photos with grain, CCTV/bodycam frames (REC, timestamps),
   hand-drawn red circles around people.
5. **3D maps** with extruded terrain, fire or particles, and a leader line to a portrait.
6. **Narration-first editing.** The VO is the spine; pictures illustrate it beat for beat. Slow
   dollies and orbits, few hard cuts, ambient drone underneath.

## Where it's beatable

| Fern | Us |
|---|---|
| Grade is neutral and "clean CG" | A real film finish: halation, grain, bloom, and a lighting palette from your board (sodium, fluorescent green, flash) |
| Red circles drawn on flat images | Circles and leader lines **tracked to 3D objects** while the camera moves |
| Slick, smooth camera only | Changes gear: smooth dollies, then step-printed Wong Kar-wai smear, deadpan flash cuts |
| Generic sans type | Editorial typography: museum-catalogue captions, serif numerals, poster-style chapter cards |
| 60 people, a week per video | A code pipeline: scenes are scripts, so each new video reuses the last one's sets, props and moves |
| Blender renders take hours | Real-time renderer: a full-HD second renders in seconds; look-dev stills in under a minute |

Honest limits: Fern's hand-built Blender sets have far more modelling detail than procedural
Three.js geometry. To close that gap: (a) import real 3D models (glTF from Sketchfab, Poly Haven,
or built in Blender) into the same pipeline; (b) use photo textures from Poly Haven; (c) for
people, use stylised mannequins or archive photos on 3D cards rather than realistic humans.
