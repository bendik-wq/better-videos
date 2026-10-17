# Bright style: the "new look" documentary channels, measured, and our house blend

What the biggest **bright, modern** documentary channels actually put on screen, measured from
their frames, plus an implementable house blend for our engine. Companion files:
[RESOURCES.md](RESOURCES.md) (tools, repos, assets), `frames/` (29 contact sheets, ≤30 KB each),
the prototype `projects/bright-lab` → `renders/bright-lab/`.

Read with `docs/style-bible.md` ("Bright mode" v0.2), `engine/looks.js` (`bright-day`),
`docs/library/video-autopsies/` (beat-by-beat breakdowns of many of the same videos) and
`docs/research/visual-craft.md`. This file doesn't repeat them; it adds frame measurements and
the 3D clay/miniature look, which none of them cover.

**Labels.** **[measured]** = computed from frames or captions by the scripts below. **[observed]**
= seen in the contact sheets. **[data]** = view counts from `yt-dlp --flat-playlist` (2026-10-17).
**[inferred]** = our reading. **[not measured]** = we couldn't get it from this box (see Method).

---

## 0. Method, and what it can and can't tell you

- **Channel lists [data].** `yt-dlp --flat-playlist --print "%(view_count)s|%(channel)s|%(duration)s|%(id)s|%(title)s" "https://www.youtube.com/@<handle>/videos"`
  for 21 handles, run on 2026-10-17. Long-form means videos over 4 minutes. Lists come newest first, so "recent" means the
  newest 40 uploads.
- **Frames.** YouTube now answers every player request from this box with "Sign in to confirm
  you're not a bot", for every player client (`android_vr`, `tv`, `ios`, `mweb`, `web_safari`, ...).
  So **no video was downloaded**, which also means no 2 s sampling and no audio. Two sources still work:
  1. **YouTube storyboards**: the scrub-preview sprites. They come from an Invidious instance's API
     (`/api/v1/videos/<id>?fields=storyboards`, which signs `i.ytimg.com/sb/...` URLs) and are 320×180 frames, one every **5 s**
     (videos under about 11 min) or **10 s** (longer ones). We got them for 15 videos before the instance's
     backend began failing. That covers Neo ×3, hoog, Primal Space ×2, Real Engineering ×2, Wendover ×2, B1M ×3, RealLifeLore and
     Johnny Harris. Its stream proxy sits behind an anti-bot proof-of-work page, and we did not try to get past it.
  2. **ytimg auto-frames**: `i.ytimg.com/vi/<id>/maxres1|2|3.jpg`, three 1280×720 frames that
     YouTube picks near 25 / 50 / 75 % of the video, plus `maxresdefault` (the thumbnail). We pulled them for 49 videos
     (13 channels, the top 3 plus the top recent videos). That makes 196 images, 17 MB, all in the scratchpad.
  Total download was about 50 MB, against a 1.5 GB budget.
- **Stats** per frame (sRGB, 64×36 or 160×90 thumbnails): mean luma `L = .2126R+.7152G+.0722B` on
  display values, HSV saturation, share of pixels with L>0.85 ("white") and L<0.06 ("black"),
  R/B ratio (white balance), an 8-colour k-means palette, saturated-accent k-means (S>0.55, V>0.45),
  "sky" = mean of bluish bright pixels in the top 20 % of rows.
- **Cut rate** comes from storyboards. We count the share `p` of consecutive samples that show a different
  picture (4×4×4 colour-histogram distance >0.35, or 16×9 grey difference >0.12), then estimate
  changes/min = `−ln(1−p)/Δt × 60` (Poisson). At Δt = 5 s this is usable. At Δt = 10 s it saturates
  near p≈0.9 and gives a **floor**, not a value. Fast camera moves count as changes too, so read
  it as **picture changes per minute**, an upper bound on cuts at 5 s sampling.
- **Captions**: the json3 caption files from the 2026-10-12 autopsy pull, re-read for the first
  2 minutes. Quotes below are the first ~15 s only, used for analysis.

Scripts (scratchpad, not committed): `fetch.py` (storyboards via the Invidious API), `analyze.py`
(per-video stats and sheets), `chstats.py` (per-channel stats from the auto-frames). The stats tables
below are their output.

---

## 1. The channels, by the numbers [data]

Long-form only (>4 min). "Look" is measured mean L / mean saturation over that channel's
auto-frames (n = 9–15 frames, from 3–5 videos) **[measured]**.

| # | Channel (handle) | Long-form views | Median / video | Median, newest 30 | Look L / S | Bright style? |
|---|---|---|---|---|---|---|
| 1 | Kurzgesagt (`@kurzgesagt`) | **3,225M** (238 videos) | 11.0M | 5.3M | **0.47 / 0.67** | Yes: flat 2D vector, saturated |
| 2 | RealLifeLore (`@RealLifeLore`) | **1,910M** (436) | 3.0M | 1.0M | 0.42 / 0.36 | Yes: bright relief maps + footage |
| 3 | Wendover Productions (`@Wendoverproductions`) | **820M** (277) | 2.3M | 1.05M | 0.40 / 0.30 | Yes: satellite + glow routes + footage |
| 4 | The B1M (`@TheB1M`) | **823M** (573) | 0.93M | 1.25M | 0.46 / 0.28 | Partly: presenter, renders, white infographics |
| 5 | Real Engineering (`@RealEngineering`) | **538M** (195) | 2.0M | 1.9M | **0.60 / 0.21** | Yes: bright 3D aircraft in cloudscapes |
| 6 | Mustard (`@MustardChannel`) | **381M** (54) | **6.35M** | n/a (54 videos) | 0.50 / 0.21 | Yes: painterly 3D + archive prints |
| 7 | Neo (`@NeoExplains`) | **299M** (64) | 2.35M | **5.8M** | 0.45 / 0.41 | Geography episodes yes; spy episodes dark |
| 8 | Primal Space (`@PrimalSpace`) | **242M** (110) | 1.35M | 2.65M | 0.38 / 0.36 | Yes: stylised Blender dioramas |
| 9 | PolyMatter (`@PolyMatter`) | **233M** (174) | 0.92M | 0.29M | **0.60 / 0.34** | Yes: flat 2D on white grounds |
| 10 | hoog (`@hoog-youtube`) | **80M** (57) | 0.76M | 0.70M | 0.30 / 0.26 | Mixed: white-clay voids (Tokyo) vs dark model city (Amsterdam) |
| (excluded) | Veritasium | 3,458M | 6.75M | 9.75M | 0.42 / 0.25 | Presenter-led live action |
| (excluded) | Vox | 2,943M | 1.2M | 0.12M | 0.47 / 0.28 | Presenter, collage, flat graphics |
| (excluded) | Johnny Harris | 779M | 3.2M | 3.6M | **0.30 / 0.29** | Presenter-led and **dark-warm**; kept as the map reference |
| (excluded) | Joe Scott / Sideprojects / Bright Sun Films | 512M / 321M / 324M | 0.43M / 0.22M / 0.80M | n/a | n/a | Talking head, stock-footage list, stock footage |
| n/a | Ridddle, MegaBuilds | n/a | n/a | n/a | n/a | `@Ridddle` resolves to a Ukrainian-language channel (73M); `@MegaBuilds` resolves to a 1-video channel. Not verified, so dropped |

**Top 3 videos per channel [data]** (views, minutes):

| Channel | #1 | #2 | #3 |
|---|---|---|---|
| Kurzgesagt | Coronavirus Explained (89M, 8m) | Immune System I (54M, 7m) | The Egg (36M, 8m) |
| RealLifeLore | Ocean Is Way Deeper (50M, 6m) | Deepest Hole (48M, 6m) | Universe Bigger (33M, 9m) |
| Wendover | Aircraft Carriers (14M, 11m) | China's Geography Problem (12M, 10m) | Economics of Airline Class (12M, 11m) |
| The B1M | Billionaires' Row Half Empty (20M, 28m) | Norway's $47BN Coastal Highway (19M, 7m) | Europe's Mega-Tunnel (15M, 27m) |
| Real Engineering | A-10 Warthog (19M, 16m) | F-35B (10M, 25m) | SR-71 (10M, 18m) |
| Mustard | What Happened To The Nautilus? (20M, 16m) | Antarctic Snow Cruiser (14M, 12m) | Could This Change Air Travel (13M, 14m) |
| Neo | Dubai's Man-Made Islands (34M, 10m) | How the CIA Found bin Laden (16M, 16m) | How the U.S. Found Saddam (15M, 21m) |
| Primal Space | Self Balancing Monorail (12M, 8m) | Crazy Engineering of Venice (11M, 9m) | Robot Chess Player Scam (8.3M, 9m) |
| PolyMatter | Zimbabwe's $100T bill (7.6M, 11m) | Apple's Money Problem (5.8M, 8m) | China's One-Child Policy (5.2M, 11m) |
| hoog | Amsterdam's Red Light District (6.8M, 13m) | Evil Design of Japan's Death Penalty (5.8M, 9m) | Most Genius Kidnapping (4.6M, 31m) |

**Three things the data says [measured/inferred]:**
1. **"Bright" is a minority of frames even on bright channels.** No channel has a mean L above
   0.60. Bright channels sit at **L 0.40–0.60**, dark channels at 0.18–0.30 (hoog Amsterdam 0.18,
   Johnny Harris 0.27–0.30, Neo bin Laden 0.25). The difference is the **black share**: bright
   channels have **≤3 % pixels below L 0.06**; hoog Amsterdam has 32 %, JH 15 %. **So bright = no crushed blacks
   and a lifted floor, not a high mean.**
2. **Neo and hoog switch looks by topic.** Neo is bright for geography and megaprojects (Dubai L 0.44, S 0.34) and dark for
   intelligence stories (bin Laden L 0.25, AF1 0.30). hoog is white clay for urban plans (Tokyo) and
   dark for crime and vice. Our `looks.js` rule ("one look per sequence, change on a story turn")
   matches what they do.
3. **The fastest-growing bright channels are 3D-model channels.** Neo has a recent-30 median of 5.8M against 2.35M all-time,
   Primal Space 2.65M against 1.35M, and Mustard a 6.35M median on only 54 videos. The 2D-flat incumbents have slowed: PolyMatter
   0.29M recent against 0.92M, Kurzgesagt 5.3M against 11M. **The modern bright look is lit 3D models and
   satellite imagery, not flat vector.**

---

## 2. Palette [measured]

### 2.1 Per channel (k-means of the auto-frames; weight in brackets; accents = saturated clusters)

| Channel | Dominant colours | Saturated accents | Sky (top-band blues) | White balance R/B | White / black px |
|---|---|---|---|---|---|
| Kurzgesagt | `#cfe6e4` (.19) `#0a2d22` `#4ac4d6` `#d5ac48` `#3a145a` `#1b759f` `#b62d4a` `#a420af` | `#a41c7d` `#34b9d1` `#1c578b` `#eba42b` | `#66d1d7` | 0.87 (cool) | 16 % / 3 % |
| RealLifeLore | `#cfdde5` (.18) `#806c5b` `#514034` `#b5a593` `#0d509c` `#5fd1d6` | `#0e4989` `#095ebc` `#3fe4ca` · thumb `#f29718` | `#a7d2ea` | 0.91 | 7 % / 15 % |
| Wendover | `#1f2731` (.20) `#b6b4bd` `#816b64` `#a79585` `#ded9d9` `#6d2424` | `#cea92c` (route yellow) `#8a2a2f` | `#abb7cc` | 1.09 | 4 % / 2 % |
| The B1M | `#5b5855` `#4e7784` `#928f85` `#7bb1c0` `#d1eaf3` `#cecbbb` | `#336883` `#43a7a0` `#4481b1` | `#a2cad5` | 0.85 (cool) | 9 % / 6 % |
| Real Engineering | `#cfcdc2` (.18) `#dae2e5` (.17) `#6f869a` `#9c8b8b` `#3c536b` `#a6b1b2` | `#174a82` `#1b5a96` `#d6ba3a` | `#98b7cf` | 0.91 | 16 % / 1 % |
| Mustard | `#b8b3aa` `#98958e` `#d0cbc7` `#a65e51` `#e6e2e2` | `#b1512c` `#b85061` `#c58448` · thumb `#2b6278` `#45a49b` | `#9aa7b7` | 1.11 (warm) | 7 % / 3 % |
| Neo | `#295054` (.20) `#677485` `#bd9a85` `#7aa2bf` `#dad1c9` `#955d48` | `#9b2e21` `#346890` `#d87f4e` `#5ca8e9` | `#7b99c2` | 0.98 | 5 % / 2 % |
| Primal Space | `#504833` `#89684c` `#ae9b81` `#88a1b9` `#164d3f` `#466b76` `#e1d6c6` | `#955d38` `#bc553c` (terracotta) · thumb `#318a80` `#129fae` | `#809ab6` | 1.16 (warm) | 3 % / 5 % |
| PolyMatter | `#e7e5e6` (.24) `#6ea0dd` `#b5162f` `#cfcbc4` `#63b762` | `#ba0b25` `#c32b4d` | `#73aec5` | 1.10 | **25 %** / 0 % |
| hoog (all) | `#0c0c0d` (.32) `#2c2d30` `#6a7377` `#999995` `#b8c8d3` `#17aaf5` | `#129af2` `#23c7f8` · thumb `#d0201c` | `#709fc1` | 0.80 | 1 % / 18 % |

Storyboard palettes for single videos (first 95 %, 8-means) **[measured]**:
- **Neo, Dubai islands** (L 0.44, S 0.34): `#21454d` deep gulf teal, `#406a75`, `#7899a6`, sand
  `#b6b6ac` / `#87857a`, sun-white sand `#e8e5df`. The whole look is **teal and sand**.
- **Primal Space, Venice** (L 0.46, S 0.32): `#836646` `#a18867` terracotta/ochre roofs, `#b4ad9a`
  stone, lagoon `#445f55` / `#6c8483`, highlight `#d6d7d1`.
- **Real Engineering, A-10** (L 0.49): neutral greys `#9d9c9a` `#75736e` `#b8bcbf`, a strong
  cobalt `#1d5996` and sky `#6587ad`.
- **Wendover, trucking 2025** (L 0.44): greys `#7f807d` `#a8afb5`, legal-pad yellow `#b8a967`.
- **hoog, Amsterdam** (L 0.18): near-black `#050404`–`#272627`, model greys `#5d5d5b` `#898883`,
  **one red `#9f2d2c`** (the hero building, 1.8 % of pixels).

### 2.2 The bright-look numbers to hit (per finished frame, sRGB luma)

| Measure | Bright channels (range) | Target for our bright episodes |
|---|---|---|
| Mean L over an episode | 0.40–0.60 | **0.48–0.58** (3D model sets 0.55–0.65, footage 0.40–0.50) |
| 5th-percentile L in a frame | 0.10–0.30 | **0.12–0.28**: real shadows, never crushed |
| Pixels with L < 0.06 | ≤ 3 % | **≤ 3 %** (title cards on black are the exception) |
| Pixels with L > 0.85 | 4–16 % (PolyMatter 25 %) | **6–15 %** |
| Mean HSV saturation | 0.20–0.41 (Kurzgesagt 0.67) | **0.22–0.34** |
| Sky (top band) | `#7b99c2` (Neo) … `#a7d2ea` (RLL) | zenith `#8dbbe5`, horizon `#e7eff4` |
| White balance R/B | 0.85–1.16; 3D-model channels run warm (1.1–1.16) | **0.98–1.06**: neutral whites, warm sun, cool shade |

Our prototype raw stills came out at L 0.69–0.82 with S 0.04–0.24 (see §12.5). That's on the bright
edge, which is fine for void and diorama sets but too flat for a whole episode. Hit the table above with
the `bright-model` look in §12.

---

## 3. Lighting [observed + measured]

| Channel | Key | Shadows | AO | Fog / haze | Sky |
|---|---|---|---|---|---|
| **hoog (clay voids)** | One sun, high, **45–60° elevation**, from behind-left of the camera (3/4 back light) | Long, **medium-soft** shadows (penumbra visibly widens with distance; the Tokyo void frame shows soft-edged cylinder shadows) | Strong contact AO under every model (dark ring where cylinders meet the platform) | The void floor fades into the background (fog colour = background) | None: seamless grey-blue gradient `#c3d2df`→`#dde5ec` |
| **hoog (night city)** | Practicals only, red emissive hero; moonlit grey city | Hard | Strong | Black falloff | Black |
| **Primal Space** | Sun 30–45°, **warm** (`R/B 1.16`), side light on dioramas; for the white studio void, a softbox key from above | Soft, short | Moderate (Blender EEVEE AO, visible in roof joins) | Light aerial haze on city flyovers | Real pale sky gradient; white seamless studio for products |
| **Real Engineering** | Daylight sun above cloud deck, often **back/side light** with rim on the airframe | Self-shadowing only (aircraft in air) | Low | **Heavy volumetric cloud** layers below the subject (`#dae2e5`, `#cfcdc2` = 35 % of pixels) | Pale blue `#98b7cf` → white haze |
| **Neo (geography)** | Satellite/Google-Earth daylight (sun baked into imagery) | Baked in imagery | n/a | Google Earth atmosphere at tilt: horizon haze `#7899a6` | Thin blue band at the top of tilted shots |
| **Mustard** | Painterly overcast/soft key, dramatic sky gradients in thumbnails | Soft | Moderate | Snow/cloud haze | Stylised teal-to-white |
| **Kurzgesagt / PolyMatter** | No lighting model; flat fills with one-step cast shadows (Kurz) or soft drop shadow (PolyMatter icons) | Flat graphic | None | None | Flat colour |

**What makes it read as "bright modern" [inferred]:** (1) a **single warm sun at 35–50°**, never
from behind the camera; (2) a **cool, high fill**, so shadows are blue-grey (`#9aa9b8` on white clay), never black;
(3) **contact AO** that grounds objects without darkening the frame; (4) **haze matched to the
horizon/background colour**, so depth reads as getting paler, not darker; (5) nothing below L 0.06.

---

## 4. 3D model style

| Style | Who | Spec |
|---|---|---|
| **White clay / architectural model** | hoog (Tokyo plans, the death-penalty room, the kidnapping mannequins) | Albedo `#f2f1ee`–`#f6f4ef` (never pure white); roughness ≈ 0.85, no texture, **no windows**. One saturated hero element (red `#d0201c`/`#e0241b`) or a 2–3-colour pastel code (coral `#ff7a5c`, lavender `#b9a9ef`, yellow `#e8c64a`). Figures are coloured, faceless mannequins (red vs blue). Base: a thin disc or slab platform. Ground: seamless void. |
| **Stylised low-detail realism** | Primal Space | Blender EEVEE. Real colours but simplified: terracotta roofs `#c8643c`, ochre walls `#e9d2b8`, teal lagoon `#4fb4ad`, grass `#c9d3a3`. **Cut-away diorama blocks** showing strata (`#dcc9a0`→`#8c6b4c`). X-ray views (desaturated, cyan `#3fb8ff` lines over dark). Faceless period figures. White "statue" figures for historical people (452 AD, Venice opening). |
| **Photoreal bright** | Real Engineering, Neo (megaprojects), B1M renders | Hero vehicle or building PBR-accurate, set in clouds or satellite context. Telephoto air-to-air. Neo mixes real satellite (Google Earth, Landsat), developer renders and its own 3D (a helicopter over The World, a Saddam spider-hole cross-section in a thumbnail). |
| **Painterly 3D** | Mustard | 3D vehicles with hand-painted texture, period livery (Snow Cruiser red `#c94f4f`), composited with archive photos printed on paper on a desk. |
| **Maps and paper** | Johnny Harris (reference), Wendover legal pad | Paper and map textures. Handwriting on yellow legal pad `#f6e97a`-ish with green highlighter. |
| **Flat vector** | Kurzgesagt, PolyMatter | Not 3D. Kurzgesagt: S 0.67, deep purples `#3a145a` with cyan `#4ac4d6` and gold `#d5ac48`, light-cone gradients. PolyMatter: white `#e7e5e6` ground with bevelled-tile pattern, flat red `#b5162f`, blue `#6ea0dd`, green `#63b762`. |

**Our house model style (§12):** hoog's clay vocabulary, lit the way Primal Space lights its dioramas, with
Neo's real-imagery maps for geography. It's the cheapest of the lot on llvmpipe: no textures, instanced boxes,
one shadow map, N8AO.

---

## 5. Camera grammar [observed from storyboards; speeds inferred]

| Channel | Lenses (full-frame equivalent) | Typical moves | First 5 s |
|---|---|---|---|
| **hoog** | 35–50 mm on models; top-down orthographic-feeling 50–85 mm on maps | Slow orbit around the model (≈ 5–10°/s), push-in to the red element, top-down map → tilt to model | Amsterdam: black → slow push over the dark model city to the red tower (frames 0–15 s). Tokyo: "This is Tokyo" (map) → "its bay" (zoom) → "this is the plan" (model reveal), **one move per sentence** |
| **Neo** | Google Earth: 24–35 mm equivalent, top-down → oblique | **Continuous map zoom/tilt** (Earth view → region → site), slow drift on satellite stills, archival footage with slight push | Dubai: 3D helicopter crosses the frame over the islands (moving subject + aerial) → official render → aerial. Motion from frame 0 |
| **Primal Space** | 24–28 mm ground-level tracking, 50 mm studio product, wide drone-style flyovers | Tracking alongside the vehicle, **match-cut 3D ↔ archive photo at the same angle**, turntable on white void, x-ray cut-away push | Monorail: black → date card ("1910, London, England") over a train driving at camera → archive photo of the same train |
| **Real Engineering** | **85–135 mm air-to-air** | Slow lateral parallax of the aircraft over the cloud deck, gentle roll | Cold open on the aircraft in flight (A-10 cresting a ridge) |
| **Wendover** | Satellite top-down; footage | Route **draw-on** with a glowing line, zoom-in to a labelled site, icon pop-ins | Old: logo + sponsor card (0–6 s). 2025: satellite of a distribution centre with a yellow outline drawing on |
| **RealLifeLore** | Top-down relief map | Slow zooms, flat 2D overlays; then footage | Ocean: side-section diagram with a depth scale |
| **Mustard** | Mixed; archive prints on a desk at 50 mm | Slow push over photos on paper; 3D vehicle reveals | Archive portrait in a frame on a desk |

**Speeds [inferred, for `engine/camera.js` / `cine.js`]:** model orbits at 4–8°/s; map zooms cover
one decade of scale (10×) in 2.5–4 s with ease-in-out; pushes cover 8–15 % of subject distance per
4 s shot. Move constantly. On the storyboards, almost no bright-channel sample repeats the
previous one exactly (p = 0.65–0.97), so held still frames are rare.

---

## 6. Cut rate [measured from storyboards]

| Video | Δt | p (picture changed) | Changes / min | Avg picture length | First 90 s p |
|---|---|---|---|---|---|
| Primal Space, Venice (9 min) | 5 s | 0.77 | **17.6** | 3.4 s | 0.83 |
| Primal Space, Monorail (8 min) | 5 s | 0.72 | **15.1** | 4.0 s | 0.72 |
| Wendover, Aircraft Carriers (11 min, 2017) | 5 s | 0.75 | **16.8** | 3.6 s | 0.72 |
| Neo, Dubai (10 min) | 5 s | 0.65 | **12.6** | 4.8 s | 0.39 (long continuous map zooms) |
| hoog, Amsterdam (13 min) | 5 s | 0.47 | **7.7** | 7.8 s | 0.61 |
| B1M, Coastal Highway (7 min) | 5 s | 0.46 | **7.4** | 8.1 s | 0.44 (presenter pieces) |
| Real Engineering F-117 / A-10 | 10 s | 0.91 / 0.88 | ≥ 12–14 (floor) | ≤ 4–5 s | n/a |
| Wendover Trucking (2025) | 10 s | 0.97 | ≥ 20 (saturated) | ≤ 3 s | n/a |
| Neo bin Laden / AF1, RLL Taliban, B1M (long), JH JFK | 10 s | 0.65–0.84 | ≥ 6–11 (floor) | n/a | n/a |

**Read:** fully animated 3D channels run at **12–18 picture changes per minute** (an average picture of 3.4–4.8 s).
Model-reveal channels with long continuous moves (hoog, Neo's map zooms) run at **7–13**. Our
`editing-library.md` targets already fit: 8–12 in the body, faster in the hook. For a clay/map
look, aim for **10–14 changes/min**, where a continuous camera move across a map counts as one picture per beat.

---

## 7. Text and annotation [observed]

| Channel | What it looks like | Nearest OFL font (Google Fonts) | Size (cap height, % of frame height) | Placement |
|---|---|---|---|---|
| Primal Space | White **upper-case heavy geometric sans on a black slab**, a hand-drawn white arrow to the object ("1,000 YEARS OLD", "CHESS MASTER"); place names in a **calligraphic serif italic** over the map ("Venice") | Montserrat Black / ExtraBold; Playfair Display Italic (or our Instrument Serif Italic) | Slab text 3.5–4.5 % (38–48 px); map name 8–10 % | Upper-right third, next to the object, arrow down to it |
| Real Engineering | Heavy geometric caps for titles; small sentence-case labels top-left ("SR-71 Engine Explained") on blueprint blue `#1d5996` | Montserrat ExtraBold / SemiBold | Labels 1.5–2 %; titles 7–9 % | Top-left label, centred titles |
| RealLifeLore | Bold condensed labels in **black or white boxes** with a coloured strip ("Mount Everest 8.848 km"); depth numbers in rounded boxes; red arrows `#e0241b` | Oswald SemiBold / Roboto Condensed Bold | 2.5–3 % | On the feature, left-aligned |
| Neo | Lower-thirds: **condensed caps on a white box** over a black sub-box ("DICK CHENEY / 64th VICE PRESIDENT"); map labels bold white sans with soft shadow; place card "CIA HEADQUARTERS / LANGLEY, VIRGINIA" bottom-left | Oswald / Bebas Neue (name) + Inter (role) | Name 3 %, role 1.8 % | Lower-left at 8 % margins; map labels on the feature |
| Wendover | **White pill labels** with dark text ("Walmart Distribution Center 6096"), icons in white rounded squares; data in a bold rounded sans ("6000 people"); handwriting on a yellow legal pad | Inter Medium / Manrope SemiBold; Nunito Bold; Caveat / Kalam (handwriting) | Pills 2 %; numbers 4–5 % | Pill above the feature with a pointer; numbers centred low |
| B1M | Heavy caps in **blue boxes** `#3e7dac` ("HALF EMPTY", "$7BN UNDERWATER TUNNEL"); presenter name in a small blue box | Montserrat Black | 6–9 % (thumbnail-style claims) | Right third, stacked |
| hoog | **Thin lower-case geometric sans**, coloured to match the object it names ("abduction / negotiation / collection" in yellow, blue, red); hairline leaders | Jost Light/Regular (Futura-like) | 2.5 % | Above the object, centred |
| Mustard | Heavy caps with a coloured underline bar ("UNDER THE NORTH POLE", "ROTATE") | Montserrat ExtraBold | 7–9 % | Lower-left |
| Kurzgesagt | Heavy caps in thumbnails; in-video labels are rare (small caps on dark pills) | Montserrat Black / Nunito Black | n/a | n/a |
| Johnny Harris | Typewriter text on documents with red marker circles; condensed caps | Special Elite (Apache-2.0) / IBM Plex Mono; Anton / Bebas Neue | n/a | n/a |

**House rule [inferred]:** bright frames carry text on **solid slabs or pills** (black slab, white
pill, coloured box), never as naked white type on a bright sky (our `bright-day` rule already says
this). Size labels at 2–3 % cap height and claims at 4–9 %.

---

## 8. Maps [observed + measured]

| Channel | Base | Land / water | Highlight | Labels |
|---|---|---|---|---|
| Neo | **Google Earth satellite**, oblique tilt; Landsat time-lapse for change over time | Real imagery: gulf teal `#21454d`/`#406a75`, sand `#b6b6ac`/`#e8e5df` | White outlines and labels; developer logo cards | Bold white sans with shadow |
| Wendover | Satellite, slightly darkened and cooled | Real imagery | **Glowing yellow outline / route `#ffcc33`–`#cea92c`** with outer glow, white rounded icon tiles | White pills |
| RealLifeLore | **Shaded-relief physical map** (hypsometric greens/browns, white snow) | Water `#0d509c` deep blue, shallow `#5fd1d6` | **Flat yellow fill `#f2c94c`-ish** for the subject area, red arrows, faction icons | Black/white condensed boxes |
| Primal Space | Flat stylised map: teal sea `#1f6b60`, terracotta land `#b3653d`, sage `#c9d3a3`, pixel-edge coast | Flat | White pin circles with red rings `#e85a4f` | Black slabs; serif italic place names |
| hoog | Dark slab map (black land, grey water) with pastel zones; or satellite with one red overlay (Tokyo thumbnail) | Black `#0c0c0d` / grey; satellite | Coral, yellow, lavender zone fills; red megastructure | Thin lower-case labels |
| Johnny Harris (reference) | Mapbox Studio styles + GEOlayers, paper textures (`visual-craft.md`) | Muted paper | Red marker | Typewriter |

**House map style (§12):** RealLifeLore/Primal-style **paper land `#ece3d1` on turquoise `#7cc4c0`
with a pale shelf `#bfe5df`**, extruded 3 units with a side colour `#cbbd9f`, lit by the same sun, with a
Wendover yellow route `#ffd23f` (unlit + glow), white pills for places and navy slabs for
countries. For real places, use Neo-style satellite imagery (`engine/imagery`, NAIP/Sentinel-2) with
the same labels.

---

## 9. Transitions and sound design

- **Transitions [observed]:** mostly **hard cuts**. The signature continuous moves are (a) **map
  zoom-through** (Neo: Earth → region → site in one move; hoog: map → model), (b) **match cut 3D ↔
  archive photo at the same angle** (Primal Space monorail: render → 1910 photo → render), and (c) **x-ray
  dissolve** from exterior to cut-away (Primal, Real Engineering blueprint). Wendover uses icon pop-ins and line
  draw-ons instead of transitions. We saw no film burns, glitches or ink bleeds on any bright channel. Keep the
  `transitions.js` repertoire to `cut`, `push`, `zoomThrough`, `matchCut` and `dissolve` in bright sequences.
- **Sound design [not measured]:** no audio could be pulled. **[inferred, from general familiarity, verify by ear]** These
  channels use light ambient or electronic beds, whooshes on map zooms, soft UI clicks on
  label pop-ins, and risers into reveals. For our presets: `whoosh.s` on every zoomThrough, `tick`/`pop`
  on pills and labels, and a riser before each model reveal, all through `score.transitions`.

---

## 10. Hook structure: the first 15 s [measured from captions]

Word counts are the caption words in 0–15 s; wpm is that count × 4.

| Video | 0–15 s, verbatim (auto captions, lightly cleaned) | Words | Device | First turn / question |
|---|---|---|---|---|
| **Neo, Dubai (34M)** | "In 2003, the construction of the multi-billion dollar project, The World, was announced. The man-made archipelago, shaped like a map of the earth, was planned to feature luxurious houses and tourist resorts…" | 32 (128 wpm) | **Dated cold open + the object** | "But today…" 0:19 → "What happened here?" 0:26 → title music |
| **hoog, Amsterdam (6.8M)** | "This is the design of Amsterdam's new erotic center, commissioned by the city government in 2020. It's a concept for a 5,000 square meter high-rise with hotel rooms, offices, bars, entertainment…" | 32 (128) | **Deictic "This is" on the model** | "So why did Amsterdam's government commission…" ≈0:35 (three whys) |
| **hoog, Tokyo (3.0M)** | "This is Tokyo, the capital of Japan. This is its bay. And this is Kenzo Tange's plan for Tokyo. A massive floating metropolis with a spine that doubled as a highway…" | 32 (128) | **Three deictic lines, three camera moves** | "But Tange's radical plan was just one of many" 0:20 → questions 0:35–0:42, ending on a self-aware joke |
| **Kurzgesagt, AI (20M)** | "July 2026. Thousands of AIs are placed in solitary confinement with a clear goal. Unable to reach it, they poke the walls and find each other. Within a few hours they break out, create a secret…" | 36 (144) | **Dated present-tense scene** | stakes line 0:35 "What sounds like a sci-fi thriller just happened…" |
| **PolyMatter, Apple (5.8M)** | "Every second, Apple makes $1,444 of profit. That's more than any other company, and almost as much as Alphabet, Microsoft and Facebook combined…" | 35 (140) | **Shocking number, per second** | "But Apple is wary" 0:19 |
| **RealLifeLore, Ocean (50M)** | "The ocean is really, really deep, deeper, in fact, than most of us realize. If you were to shave off all of the land… the entire earth would be covered in an ocean 2 miles deep." | 58 (232) | **Scale thought-experiment** | "Let's start with a sense of scale" 0:30 |
| **Wendover, China (12M)** | sponsor line (0–7 s) → "China is a country both blessed and cursed by geography…" | 46 (184) | Sponsor-first (2016–18 era), then **paradox** | "but" 0:13 |
| **Neo, bin Laden (16M)** | "Just four days before the 2004 US presidential election, a newly published tape appears on the news…" | 42 (168) | **Dated in medias res** + archival audio | none in 2 min (procedural tension) |
| **Johnny Harris, JFK (17M)** | archival newsreel audio → "There's a cover-up that's about to happen here." | 39 | **Archival audio cold open + presenter line** | "But over time…" 0:39 |

**Pattern [inferred].** 0–3 s: an **object or date plus the object** ("This is…", "In 2003…", "July 2026.").
3–15 s: **one scale or number line** (5,000 m², multi-billion, $1,444/s, 2 miles). 15–25 s: **the turn,
"But today…"**. 25–45 s: **the question or question stack** ("What happened here?"). Calm pace:
**128–144 wpm** in the bright channels' hooks, against 160–230 for RLL and Wendover. Bright 3D channels let the
picture carry the opening and talk slowly. This fits `hooks.md` H025 (in medias res), H082 (scale) and
the deictic "This is X / its Y / the plan" (hoog autopsy).

---

## 11. Act and climax structure for 20–30 min videos [chapters from the autopsies, heat from §B there]

The long bright videos (hoog's Kidnapping 31 min/15 chapters, B1M's Billionaires' Row 28 min, Real
Engineering's F-117 27 min, Neo's Saddam 21 min) share one shape **[observed in chapters/heatmaps; inferred
as a template]**:

| Time (of 25 min) | Beat | Visual job (bright look) |
|---|---|---|
| 0:00–0:30 | Cold open: object/date, scale line | One continuous move to the hero model or site; no title card |
| 0:20–0:45 | Turn + question stack (2–3 questions = the chapters) | Map pull-out to context |
| 0:45–1:30 | Title sting + promise; (sponsor here on Neo/Wendover) | Clean title on void |
| 1:30–6:00 | **Act 1, context**: how it came to be | Archive ↔ 3D match cuts, dated map states |
| ~6:00–8:00 | Sponsor read; **the return line is a re-hook** (the top or second most-replayed peak in 9 autopsied videos, `video-autopsies/README.md` pattern 1) | Hard visual change on return: new model reveal |
| 8:00–15:00 | **Act 2, mechanism**: one new model or cut-away per chapter (every 1.5–2.5 min) | x-ray / diorama / cut-away; numbers on slabs |
| ~12:30 (≈50 %) | **Midpoint reversal** (the plan fails, the suspect is found, the design is evil) | Look change allowed (bright → dusk) |
| 15:00–21:00 | **Act 3, escalation to climax** (the money drop, the strike, the opening day) | Fastest cutting (14–18/min), tightest lenses |
| 21:00–23:30 | Climax and consequence | Return to the opening shot, changed (callback) |
| 23:30–25:00 | **Coda: a stranger second example / what's next** (hoog's top replay peak is its coda) | Wide pull-out to the map; end on the model |

Chapters every 1.5–3 min (median 9 per video in the autopsies); a new **model reveal** per chapter
offsets the heat decay after the first quarter (hoog Tokyo: heat 0.16 → 0.04).

---

## 12. Recipes per channel (copy these)

**hoog, white clay.** Seamless void `#dde5ec` (fog = background). Models in `#f4f2ee` clay, roughness 0.85, no
windows. One red `#e0241b` hero or a pastel code (coral `#ff7a5c`, lavender `#b9a9ef`, yellow `#e8c64a`). Sun 50°
with a 3/4 back light, medium-soft shadows, strong AO. 35–50 mm, slow orbit and push. Thin lower-case labels with hairline
leaders. Hook: "This is X. This is its Y. And this is the plan." **Night variant:** the same models in a black void, with the red hero emissive.

**Neo (geography).** Real satellite imagery (Google Earth style), oblique tilt-zooms from orbit to site, Landsat
time-lapse, developer renders, then a single own-3D hero (helicopter, cross-section). Teal and sand palette.
Condensed lower-thirds. Dated cold open, "But today…", "What happened here?". 12–13 changes/min.

**Primal Space.** Stylised Blender world: terracotta, ochre, teal, sage. Cut-away diorama blocks over a pale gradient void.
White-void product turntables. X-ray cut-aways. Match cuts between 3D and archive photo. Black-slab caps labels with
hand arrows. Date cards over moving 3D. 15–18 changes/min, 8–9 min videos.

**Real Engineering.** Photoreal hero vehicle at 85–135 mm above a white cloud deck, sun rim. Blueprint-blue `#1d5996`
diagrams. Montserrat caps. Bright overall (L 0.60), low saturation (0.21).

**Wendover (2025).** Satellite plus a glowing yellow outline or route, white pills with icons, legal-pad handwriting,
much licensed footage, flat orange data circles on dark. 16–20+ changes/min.

**RealLifeLore.** Shaded-relief map with yellow subject fill, red arrows, black/white condensed label boxes;
footage between maps. Scale ladders (side-section depth diagrams).

**Mustard.** Archive photos printed on paper on a desk, painterly 3D vehicles, heavy caps with an underline,
warm (R/B 1.11). "What happened to X?" mystery framing.

**Kurzgesagt / PolyMatter.** Out of scope for 3D, but their palettes are the saturation ceiling (Kurz S 0.67) and the
"white-ground infographic" (PolyMatter 25 % white pixels).

---

## 13. Our house blend [inferred; prototyped in `projects/bright-lab`]

**One sentence:** hoog's white-clay models and Primal Space's dioramas, lit by a 40° warm sun
with a cool sky fill and contact AO, in Neo's real-imagery geography, labelled with Primal/Neo slabs and
Wendover pills, graded so blacks never crush.

### 13.1 Scene parameters (what `projects/bright-lab/scene.js` `HOUSE` uses: these rendered the proof frames)

```js
const HOUSE = {
  sunEl: 40, sunAz: 235, sun: '#fff6ea', sunI: 3.9,               // DirectionalLight, cross / 3/4 back to camera
  hemiSky: '#bcd6f0', hemiGround: '#e9dcc6', hemiI: 0.78,          // HemisphereLight: cool fill, warm bounce
  bgTop: '#8dbbe5', bgHorizon: '#e7eff4',                          // screen gradient (split at 62 %)
  fog: '#dfe9f1', fogNear: 900, fogFar: 6000,                      // THREE.Fog (linear), metres, city scale
  clay: '#f4f4f1', ground: '#d6d8d8', plate: '#e8e9e7',           // roughness 0.84–0.95, metalness 0
  water: '#7cc6c1', shelf: '#bfe5df', park: '#cbd9b1', tree: '#b2cb95',
  red: '#e0241b', coral: '#ff7a5c', lavender: '#b9a9ef', yellow: '#ffd23f', navy: '#0f1e33',
  land: '#ece3d1', landSide: '#cbbd9f', sea: '#7cc4c0', void: '#dde5ec',
  ao: { radius: 10, intensity: 3.0, falloff: 1.0 },                 // N8AO (post.js), metres; 6–8 for 300 m dioramas
  tone: 'neutral',                                                 // post.js ToneMappingEffect: Khronos PBR Neutral
};
// shadows: PCFSoftShadowMap, 4096² over ±1100 m (city) / 2048² over ±260–320 m (diorama, void);
// bias −0.0004, normalBias 0.6 × span/900. Tilt-shift: post.js dof { focus: d(hero), range: 90, bokeh: 5 } on 85 mm.
```

**Why Neutral, not ACES:** ACES greys and yellows the whites of a clay model. Khronos PBR Neutral keeps `#f4f4f1` reading
as white and keeps the pastel hues. AgX is the alternative if highlights clip.

### 13.2 `engine/looks.js`: proposed new preset `bright-model` (not yet added; drop-in object)

```js
'bright-model': {
  label: 'Bright model', intent: 'White-clay models and paper maps in sun; hoog / Primal Space / Neo geography.',
  grade: {
    wb: [0.0, 0.0], ev: 0.0,
    curve: { contrast: 1.12, pivot: 0.44, perChannel: 0.18 },      // a little more bite than the raw clay render
    sat: 1.08, vibrance: 0.28,                                     // lift the pastels (target S 0.22–0.34)
    bands: [
      { h: 29, w: 10, sat: 1.06 },                                 // hero red
      { h: 45, w: 14, sat: 1.04, shift: -2 },                      // terracotta / coral
      { h: 58, w: 16, sat: 0.94, pull: 0.35 },                     // skin line
      { h: 88, w: 16, sat: 0.9, shift: -4, light: 0.006 },         // sand / paper land: cream, not lemon
      { h: 132, w: 22, sat: 0.78, shift: -8, light: 0.01 },        // foliage: sage pastel
      { h: 190, w: 18, sat: 1.12, shift: 3 },                      // turquoise water: hero colour
      { h: 245, w: 20, sat: 1.0, shift: -3, light: 0.008 },        // sky: clean, light
      { h: 290, w: 18, sat: 1.0 },                                 // lavender accents stay
      { h: 330, w: 24, sat: 0.8 },
    ],
    shadowTint: [-0.004, -0.013], highTint: [0.001, 0.004],        // cool shade, faintly warm light
    satShadow: 0.9, satHigh: 0.66, ceiling: 0.88,
    floor: 0.03, white: 0.985,                                     // lifted floor: ≤3 % px under L 0.06
  },
  finish: { grain: 3, halation: 6, halationAmount: 0.1, bloom: 0.06, vignette: 0.14, halationTint: [1, 0.8, 0.62] },
  tod: { base: 'day', sunEl: 40, sunAz: 235, sun: ['#fff6ea', 4.0], zenith: ['#3b78c8', 1.0], horizon: ['#cfe0ee', 1.1],
    glow: ['#fffaf0', 0.12], glowW: 0.3, haze: ['#dfe9f1', 1.0], hazeDen: 0.00004, hazeH: 1800,
    ambSky: ['#a9c6e8', 1.0], ambGround: ['#d8cdb8', 0.7], exposure: 1.0, cloud: ['#ffffff', 1.8],
    sky: { turbidity: 2.0, rayleigh: 1.1, mie: 0.002 }, hazeGain: 0.85, bloom: 0.02, bloomThresh: 2.8, flare: 0.15, sat: 1.02, contrast: 1.0 },
  imagery: { haze: { color: [0.86, 0.9, 0.94], sunColor: [1.0, 0.95, 0.88], density: 1 / 20000, scale: 1600, sunDir: [-0.55, 0.64, 0.53], zenith: [0.23, 0.47, 0.78] },
    grade: { contrast: 1.06, saturation: 1.08, warmth: 0.0, gamma: 0.97, exposure: 1.06, lift: 0.02 } },
  palette: { bg: '#eef2f5', paper: '#fbfaf7', clay: '#f4f4f1', void: '#dde5ec', ink: '#0f1e33', inkSoft: '#46536a', accent: '#e0241b',
    coral: '#ff7a5c', lavender: '#b9a9ef', yellow: '#ffd23f', sea: '#7cc4c0', seaDeep: '#4fa9ab', shallow: '#bfe5df', sand: '#e6cf9f',
    land: '#ece3d1', landSide: '#cbbd9f', water: '#7cc4c0', sky: '#9cc7ea', park: '#cbd9b1', grid: 'rgba(15,30,51,0.10)',
    plate: '#0b0b0b', plateInk: '#ffffff', pill: '#fbf8f2', pillInk: '#0f1e33', shadow: '0 2px 14px rgba(15,30,51,0.28)', sun: '#fff6ea', navy: '#0f1e33' },
},
```
The prototype frames were graded with the existing `bright-day` LUT plus the light finish above
(`project.mjs` `finish`). `bright-model` is the tuned version. Add it, run `node engine/looks.js write bright-model`,
then A/B it in `projects/look-lab`.

### 13.3 `engine/world`: a clay mode (spec for the world-kit owner; not implemented here)
1. `core.js` uniforms: add `uClay: { value: 0 }`, `uClayCol: v3(...C(0xf4f4f1))`, `uClayGround: v3(...C(0xd6d8d8))`.
2. `city.js` `buildingMaterial` fragment, right after the single material fetch: `alb = mix(alb, uClayCol * (0.96 + 0.04 * fSeed.x), uClay);
   rough = mix(rough, 0.85, uClay); lit/window emission *= 1. - uClay; glass F0 → mix(F0, vec3(.04), uClay)`. The interior-mapped rooms
   go too: `room(...)` weight × `(1. - uClay)`.
3. `plateMaterial`, `roads.js`, `terrain.js`: albedo → `uClayGround` (roads a shade darker, `#cfd1d1`); trees → `#b2cb95`;
   water → `#7cc6c1` with roughness 0.3.
4. `World.setState({ clay: k })` sets `U.uClay`, so **k can animate**: a photoreal city melts into a white model. That's hoog's "model
   reveal" as a oner beat. Pair it with `tod` → `LK.tod('bright-model')`.
5. `W.create({ clay: true })` skips loading PBR facade textures (faster) when an episode only needs clay.

### 13.4 Post and finish
- `post.js`: `{ ao: HOUSE.ao, tone: 'neutral', quality: 'medium' }`. N8AO is what sells the clay. Its cost
  is already measured (+240 ms/frame at medium). For miniature (tilt-shift) shots add `dof: { focus, range: 0.1–0.15 × focus, bokeh: 4–5 }`
  on an 85 mm lens from 1–1.5 km.
- Finish: `grain 3, halation 6 (0.1), bloom 0.06, vignette 0.14`. Bright channels show almost no vignette or grain; ours stays just
  perceptible so it isn't sterile.
- QA: run the §2.2 measurements on the draft (mean L, p5, black %, white %, S) next to `blackdetect`.

### 13.5 Prototype results (`renders/bright-lab/`, raw → graded) [measured]
| Still | L | p5 | p95 | S | Verdict |
|---|---|---|---|---|---|
| clay-city | 0.69 | 0.32 | 0.91 | 0.14 | Reads as a hoog/Primal model city; S below target, so add the pastel park/roof variety or `bright-model` vibrance |
| clay-city-tilt (85 mm, DOF) | 0.73 | 0.37 | 0.90 | 0.08 | Convincing miniature; a little flat, so bring the camera lower, closer to the light direction |
| diorama | 0.76 | 0.26 | 0.94 | 0.20 | On target; the Primal look |
| void-model | 0.82 | 0.39 | 0.89 | 0.04 | The hoog void; intentionally pale, so the colour comes from accents only |
| map-slab | 0.82 | 0.65 | 0.89 | 0.24 | Bright paper map; too low in contrast, so darken the sea to `#5fb3b0` and add relief |
Render cost was not timed per frame. All five 1080p stills (N8AO medium, 4096² shadow map) rendered in one short `--stills` pass on llvmpipe. Time a draft before you budget a full episode.

### 13.6 New sets and assets needed
1. **`sets/clay`** (from `bright-lab`): `clayCity`, `voidModel`, `diorama`, `mapSlab` as reusable set builders with params
   (city seed and footprint, hero building, platform, strata list, GeoJSON source).
2. **OSM footprints → clay**: extrude real building footprints (Overpass or Overture) into the clay city for real places
   (RESOURCES §3).
3. **Mannequins**: hoog's coloured faceless figures. Use `PE.person` / UAL with a flat clay material in red `#e0241b`, blue `#3b5cdb` and
   grey `#bdbdbd` (no new asset needed).
4. **Diorama strata and cut-away** helper: a box stack with labelled layers and an x-ray mode (cyan `#3fb8ff` edges on dark).
5. **Label kit** (`motion.js` additions): `slab` (black caps + hand arrow), `pill` (white rounded + pointer), `leader`
   (hairline lower-case, hoog), `lowerThird` (Neo two-box), `routeGlow` (yellow line draw-on with glow).
6. **Fonts (OFL, ~30–60 KB woff2 each):** Montserrat 800/900, Inter 500/600, Jost 300/400, Oswald 600. Archivo Narrow, Instrument Serif
   and Plex Mono are already in `assets/fonts`.
7. **Relief map base**: Natural Earth shaded relief (public domain) or a hillshade from 3DEP/SRTM, tinted to `land`, for RLL-style maps.
8. **Satellite**: Sentinel-2 cloudless mosaics through `engine/imagery`, for Neo-style geography (already supported).
9. **Look**: add `bright-model` to `engine/looks.js` (13.2) and the clay mode to `engine/world` (13.3).
