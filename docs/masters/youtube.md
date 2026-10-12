# Big YouTube: what this library adds

The big channels are already covered in depth; don't duplicate them here:
- `docs/library/video-autopsies/` (70 autopsies with replay heatmaps; one file per channel:
  `johnnyharris.md`, `vox.md`, `polymatter.md`, `kurzgesagt.md`, `wendover.md`, `reallifelore.md`,
  `lemmino.md`, `fern.md`, `bloomberg.md`, ...)
- `docs/research/channel-breakdowns.md` (20 channels, title data, craft summaries)
- `docs/research/visual-craft.md` §1 (documented production facts per channel: Kurzgesagt panels and
  hours, Vox 12 fps graphics and tracking transitions, Johnny Harris GEOlayers maps, PolyMatter
  palette-first design)

This file adds only the **visual languages that are still missing from our engine and docs**, and
how to execute them, with the bright look in mind (episode 3, Strait of Hormuz, is map-heavy).

## 1. Johnny Harris: the paper-map texture
What it is [analysis of his map sequences; workflow cited]: maps built in After Effects with the
GEOlayers plugin over Mapbox Studio styles, a workflow he says took about 8 years to refine
[cited: aescripts; Glasp tutorial summary]. On top of the vector map: a **paper or print texture**
(fibres, slight unevenness, folds), a **grain** pass [cited: aescripts tutorial on a film-grain
effect], hand-drawn-feeling route lines, labels in a serif and a condensed sans, and
photographs slid in with a blur, plus text-based match cuts [cited: Motion Array via
visual-craft.md].

Why it works: the texture says "this is a document someone made", which reads as journalism, not
as a dashboard [analysis].

Execute it:
- A multiply-blended paper texture over map sets at 6–12% (CC0 paper scan from
  ambientCG/Poly Haven, record in `assets/CREDITS.md`), **stepped at 12 fps** so it lives without
  flickering. In bright mode the paper is `LK.palette('bright-day').land` (`#ece3d1`) with
  turquoise water (`water` `#90cccd`).
- Route lines drawn on (never faded) with a slightly rough edge (`#marker` SVG filter from the
  style bible), red `#e0241b` only for the route/annotation.
- Fold lines: two faint diagonal lightness steps (2–3%) across the map.
- Camera: `DAT-001` Map fly-to, `DAT-002` Tilted map fly-to, `CAM.mapFlyTo` (van Wijk zoom path,
  `CAM.zoomPath`) so zooms feel like a camera, not a scale tween.

## 2. Vox: motion typography and the document highlighter
What it is [cited where noted]: graphics animated at 12 fps inside a 24 fps edit; "tracking"
transitions through two shots as 3D layers; layered paper and grain textures cycling 2–3 times a
second [cited: PremiumBeat via visual-craft.md]. The genre's description of the "Vox style":
clean modern type, a minimal palette, data callouts that appear while the key sentence is
spoken, and a highlighter effect on key phrases of documents [cited only by freelancer
listings and template docs, e.g. Mosaic docs, Fiverr; treat as secondary].

Execute it:
- Document beats: `M.callout.doc` + `M.text.highlight` (the highlight sweeps on the spoken word;
  in bright mode the highlighter is sand `#e6cf9f` at 70% under navy text, red only for the one
  phrase that matters).
- Data callouts keyed to the word: `M.text.counter`, `M.data.bigNumber`, `M.data.line`; source line in
  Plex Mono caps.
- Tracking transition: `TR` `push` (Vox tracking) between two flat layers.

## 3. PolyMatter: map language
What it is: PolyMatter's creator teaches a workflow that runs topic, research, story, script,
graphic design, colour, shapes, then animation, using Affinity Designer [cited: Skillshare course
via visual-craft.md; Class Central listing]. The visual language [analysis of the channel]: flat,
borderless country shapes in a small palette; the subject country in one strong colour and the rest
neutral; thick, simple icons (ships, factories, coins) placed on the map; labels set flat in a
geometric sans; camera moves are slow 2D zoom/pans; bold yellow/black thumbnail type
[observed in `polymatter.md`].

Execute it:
- Map sets in the look palette: neighbours `land`, subject country one step darker or in `sand`,
  sea `water`; no outlines except the coast at 50% `inkSoft` (as in `projects/look-lab` map).
- Icon tokens (tankers) as simple flat silhouettes in `navy`, moving along lanes (pure in t).
- Max 3 colours + red annotation per map frame [house].

## Sources
- aescripts, "How Johnny Harris makes maps": https://aescripts.com/learn/how-johnny-harris-makes-maps/
- Glasp summary of his map tutorial: https://glasp.co/youtube/GsojLuJpe_0
- Mosaic docs, motion-graphics tile ("Vox-style" overlays): https://docs.mosaic.so/tiles/motion-graphics.md
- Fiverr listing, "Vox style motion graphics, maps and documentary visuals": https://fiverr.com/vossvisuals/create-vox-style-motion-graphics-maps-and-documentary-visuals
- Class Central, PolyMatter's "Make animated YouTube videos": https://www.classcentral.com/course/skillshare-make-animated-youtube-videos-60855
- Earlier sources (PremiumBeat, Motion Array, Skillshare) are cited in `docs/research/visual-craft.md` §1.
