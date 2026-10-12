# Public-domain footage library

Real footage is the biggest realism win we have. This page lists where it comes from, what each
source lets us do, and how to get it into a frame. The machine-readable version is
`assets/footage/catalog.json`; the starter pack manifest is `assets/footage/pack.json`; every
downloaded clip has a provenance JSON in `assets/footage/clips/`.

**Rule:** ship only public domain, CC0 or US Government works. Pexels and Pixabay are usable inside
an edited film under their own licences, but their raw files must never be redistributed. Never use
CC BY-NC or ND. Check every item, because:
- agency pages can carry third-party copyrighted material (NASA marks it; DVIDS warns of it);
- archive.org "public domain" marks set by arbitrary uploaders are not evidence. The downloader only
  trusts the Prelinger collection, FedFlix and `gov.*` (NARA and agency) identifiers;
- public-domain films can contain copyrighted inserts (music, newsreel footage).

## Sources

| Source | Search API (auth) | Licence | Restrictions / credit | `--source` |
|---|---|---|---|---|
| **NASA Image and Video Library** | `images-api.nasa.gov/search?q=&media_type=video`, `/asset/{id}` (none) | Public domain in the US | Insignia/logotype not PD; no implied endorsement; identifiable people need consent for commercial use; third-party items are marked. Credit "NASA/<centre>". [evidence](https://www.nasa.gov/nasa-brand-center/images-and-media/) | `nasa` |
| **NASA Goddard SVS** | `svs.gsfc.nasa.gov/api/search/?search=`, `/api/{id}` (none) | Public domain | Check page credits for third-party data layers. Credit "NASA's Scientific Visualization Studio". | `svs` |
| **NOAA** (NESDIS, Hurricane Hunters, Photo Library) | No unified video API; NESDIS / AOC videos are mirrored on Commons ("… NO TEXT" versions), GOES via SVS (none) | Public domain (US Gov) | Credit "NOAA <office>". | `noaa` (Commons + "NOAA") |
| **DVIDS** (US military) | `api.dvidshub.net/search?api_key=&q=&type[]=video` (**free key**, registration) | Public domain (US DoW works); some items owned by others | Show "The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement."; no endorsement; insignia need permission for commercial use; privacy rights remain. [evidence](https://www.dvidshub.net/about/copyright) | `dvids` (key) — or `commons` (DVIDS mirrors, PD-USGov-Military) |
| **National Archives (NARA)** | `catalog.archives.gov/api/v2/records/search` (**x-api-key**, by email) | Mostly PD; check `useRestriction` | API terms: display "This product uses the National Archives Catalog API", don't cache responses. [evidence](https://www.archives.gov/research/catalog/help/api) | `nara` (key) — or `archive` (`gov.archives.*` uploads) |
| **Library of Congress** | `loc.gov/search/?q=&fa=online-format:video&fo=json` (none, rate limited) | Per item | Use only "No known restrictions on publication" / PD items. Credit "Library of Congress, <collection>". | `loc` |
| **Prelinger Archives** (archive.org) | `archive.org/advancedsearch.php?q=… AND collection:prelinger` (none) | Per film: many carry the CC Public Domain Dedication; "while some Prelinger films are in the public domain, many are not" | Use only PD-dedicated items; SD (NTSC) transfers before 2023; credit welcome but not required. [evidence](https://www.panix.com/~footage/prelarch.html) | `prelinger` |
| **FedFlix / agency films** (archive.org) | same API, `collection:FedFlix` or `gov.*` ids (none) | US Government works | Credit the agency. | `fedflix`, `archive` |
| **Wikimedia Commons** | MediaWiki API, `generator=search … filetype:video`, `prop=imageinfo&iiprop=extmetadata` (none; descriptive User-Agent required) | Per file | Keep PD / PD-USGov / CC0; CC BY(-SA) only with `--allow-by` and an on-screen credit. Upload servers 429 range reads: the downloader fetches VP9 transcodes whole. | `commons` |
| **US agency b-roll, direct** (BEP, DOE, USGS, NPS, FEMA, the services) | none common; most post to DVIDS / Flickr / Commons | Federal-employee works are PD (17 U.S.C. 105) | Contractor-run labs (LLNL, LANL, …) can hold copyright: check. | manual + provenance JSON |
| **Pexels** | `api.pexels.com/videos/search` (free key) | Pexels licence: free, modification OK, attribution optional | **No sale of unaltered copies, no redistribution on other platforms**, no implied endorsement. Keep raw files out of git. [evidence](https://www.pexels.com/license/) | `pexels` |
| **Pixabay** | `pixabay.com/api/videos/` (free key) | Pixabay Content License | **No standalone sale/distribution** (substantially unaltered), trademark and recognisable-people limits. [evidence](https://pixabay.com/service/license-summary/) | `pixabay` |

Keys are read from `DVIDS_API_KEY`, `NARA_API_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`. None of them is
needed for the starter pack.

## Downloader

```bash
node engine/footage.js search "hurricane from space station" --source nasa --max 10   # OK / SKIP + licence per hit
node engine/footage.js fetch  "server room" --source nasa --max 5 [--min-height 720] [--tag server-room]
node engine/footage.js files  nasa <nasa_id>                       # every downloadable rendition + size
node engine/footage.js get    archive OnGuard1956 --trim 96,178 --id computing-sage-1956 --tag computing
node engine/footage.js pack   [--only command-centre,weather] [--dry]
node engine/footage.js list   [tag]
```

* `fetch` keeps only items whose licence passes the policy above (`--force` overrides after you
  have checked an item yourself).
* `--trim a,b` reads only that part from the server: ffmpeg seeks in the remote file with HTTP range
  requests, so 40 s of a 2 GB 4K master costs about 40 s of bytes. The clip is re-encoded to H.264
  CRF 18, ≤1080p, with its audio kept.
* Every clip gets `assets/footage/clips/<id>.json`: `title, source, sourceId, page, download, date,
  licence, licenceEvidence, credit, tags, trim, file, bytes, sha1, duration, width, height, fps,
  codec, field, audio, fetched`.
* Video files are git-ignored (`assets/footage/.gitignore`); `pack` rebuilds them on any machine
  from `pack.json`.

## Starter pack (`assets/footage/pack.json`)

28 clips, ~25–90 s each, around 1 GB on disk. Every item was looked at on a contact sheet before it
was chosen.

| Need | Clips | Source · licence |
|---|---|---|
| Server rooms | `server-nasa-ames-modular` (Aitken racks, cabling, engineers) | NASA Ames · PD |
| Cities at night from the ISS | `orbit-night-coast-exp65`, `orbit-night-cities-exp67`, `orbit-night-start-exp67` | NASA JSC "Earth in 4K" · PD |
| Earth from orbit | `orbit-earth-limb-exp65`, `orbit-clouds-exp65`, `orbit-aurora-exp65`, `orbit-desert-exp67` | NASA JSC · PD |
| Aircraft | `aircraft-x59-takeoff`, `weather-milton-hurricane-hunter` | NASA Armstrong · PD; NOAA AOC · PD |
| Ships | `ships-lcs-formation` (aerial), `ships-comfort-underway` | US Navy via Commons · PD-USGov-Military |
| Crowds | `crowd-apollo-launch-1969`, `crowd-causeway-bay-timelapse` | NASA · PD; Commons · CC0 |
| Typing hands | `typing-hands-1940s` | Prelinger "Basic Typing" · PD dedication |
| 1950s–60s office and computing | `computing-sage-1956`, `computing-sage-panels-1956`, `office-treasury-1969` | Prelinger "On Guard! The Story of SAGE" (IBM/USAF) · PD dedication; NARA "The Treasury Story" · CC0/US Gov |
| Military command centres | `command-sage-consoles-1956`, `command-space-ops-center-dod`, `command-apollo-mcc-1969`, `command-artemis-flight-control` | Prelinger · PD; US Space Force via Commons (DVIDS) · PD; NASA · PD |
| Money printing | `money-treasury-press-1969` | NARA "The Treasury Story" (US Treasury film) · US Gov |
| Oil rigs | `oil-rig-drilling` (land rig, derrick work) | OSHA/industry safety film on Commons · PD |
| Highways | `highway-tullamarine`, `highway-green-light-1954` | Commons · CC0; Prelinger · PD |
| Weather | `weather-helene-iss`, `weather-erin-goes`, `weather-milton-hurricane-hunter` | NASA · PD; NOAA NESDIS via Commons · PD |

Gaps worth filling with a free DVIDS key: offshore oil platforms (BSEE / Coast Guard), modern
operations centres, carrier flight decks. With a Pexels/Pixabay key: modern typing hands, modern
server aisles, drone highway interchanges. Those stay inside the edit and are never redistributed.

## Runtime: graded, deterministic footage in our renderer (`engine/footage.js`)

```bash
node engine/footage.js prep projects/<name>    # before rendering: extract graded frame sequences
```

```js
import * as FT from '/engine/footage.js';
await FT.ready();                                   // in create(): loads the fallback decoder
const set = await FT.footage(ctx, shot, {
  file: 'command-sage-consoles-1956',               // library id or a repo path to any video
  in: 284, out: 296,                                // source seconds
  speed: 1,                                         // or ramp keys [[0, 1], [1.2, 0.35], [3, 0.35]] (shot seconds)
  grade: 'archive',                                 // house | archive | bw | orbit | night | fluoro | none | { lut, exposure, contrast, saturation, temp }
  reframe: { from: [0.5, 0.5, 1.0], to: [0.55, 0.45, 1.18], ease: 'inOut',   // eased punch-in (centre u, v, zoom)
             punch: [{ at: 2.0, dur: 0.6, zoom: 1.25, center: [0.6, 0.4] }], drift: 0.004 },
  caption: { text: 'SAGE, 1956', sub: 'IBM AN/FSQ-7 · NEW YORK AIR DEFENSE SECTOR', corner: 'tl' },
  source: 'PRELINGER ARCHIVES · PUBLIC DOMAIN',
  stab: true,                                       // ffmpeg vidstab, two pass, offline
  fadeIn: 0, fadeOut: 0, fit: 'cover',              // or 'contain' to keep 4:3 with pillarbox bars
});
// per frame: set.update(t, p); renderer.render(set.scene, set.camera);
```

* **Determinism.** `prep` writes every source frame of `[in, out]` at the project fps (or
  `footageFps`) as graded JPEGs in `.cache/footage/seq/<key>/` (key = hash of file, range, grade,
  stabilisation, fit). Frame `k = floor((t + offset) · fps)` of the speed-mapped source time is
  shown. Speed ramps are integrated exactly, so they never jump. Slow motion blends neighbouring
  frames (`blend`, default on below 1x). The browser has no synchronous image decode, so the first
  footage set wraps `window.__frame`: before the scene draws time `T` it awaits the frames every
  footage shot near `T` needs (a pure function of `T`). A synchronous pure-JS decoder
  (`engine/imagery/jpeg.js`, Apache-2.0) is the fallback.
* **Grade.** The house transfer (`FT.gradePixel`, also written as `.cube` LUTs by `node
  engine/footage.js lut`): filmic S with a deepened toe and soft shoulder, lifted blacks (0.035),
  luma-preserving desaturation (more in the deep shadows and top highlights), cool shadows / warm
  highlights split tone, gain 0.97. Grain, halation and vignette come from the film finish, as for
  every shot. `archive` and `bw` are for film transfers, `orbit` for NASA Earth views (deeper
  blacks), `night` for sodium-lit scenes and `fluoro` for green-cyan interiors.
* **Reframe.** Zoom is interpolated in log space (constant apparent speed) with a C2 quintic ease.
  Punch-ins ease in and out, and the window is clamped so the frame never leaves the picture.
* **Stabilisation.** `stab: true | { shakiness, smoothing, zoom }` runs `vidstabdetect` +
  `vidstabtransform` once, offline, on the trimmed range.
* **Parallax.** `FT.parallaxStill(ctx, shot, { file, grade, parallax: { at, move, depth, center } })`
  turns one graded frame into an `engine/parallax.js` photo move. `prep` extracts the still and runs
  `engine/depth.py` on it.
* **Cost.** A footage frame is a JPEG fetch + browser decode + one texture upload + one quad, about
  25–45 ms at 1080p on llvmpipe (a plain 3D frame is ~250 ms). Disk: ~0.25–0.45 MB per prepared
  1080p frame (≈ 0.5 GB per minute at 30 fps).
* **Captions.** House type only: Instrument Serif title wiped on from the left, Plex Mono tracked
  caps for the sub line and for the bottom-left SOURCE line. Captions sit in the corners, never
  centred in the lower third, and never repeat the VO.

Demo: `projects/footage-lab` (`renders/footage-lab/`).
