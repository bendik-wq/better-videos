# Asset credits

Every third-party asset in `assets/` and `engine/vendor/`, with its licence and source. Add a line
whenever you add an asset. CC0 and PD items need no on-screen credit; the rest say so.

## Models

| File | What | Author | Licence | Source |
|---|---|---|---|---|
| `models/UAL_Mannequin.glb` | Rigged humanoid "Mannequin" (65-joint UE5-style skeleton) with 43 animation clips: idle, walk, jog, sprint, crouch, sit, talk, push, pick up, fixing, interact, death and others. File `Unreal-Godot/UAL1_Standard.glb` from the pack, unmodified. | Quaternius | CC0 1.0 (`License.txt` in the pack) | Universal Animation Library [Standard], https://quaternius.itch.io/universal-animation-library (free download, no login), downloaded 2026-10-10. sha256 `69591853d817488edaa8fd9bf8fc1d821eaeaf789f8627b3cd23b41c4ed67997` |
| `models/Soldier.glb`, `models/Xbot.glb` | three.js example characters (Mixamo-derived) | three.js examples / Mixamo | ⚠️ Adobe Mixamo terms; see `docs/research/asset-sources.md`. Prefer `UAL_Mannequin`. | three.js repo `examples/models/gltf/` |

## Code (engine/vendor)

| File | Licence | Source |
|---|---|---|
| `engine/vendor/postprocessing-6.39.5.js` | Zlib (`postprocessing-LICENSE.md`) | npm `postprocessing@6.39.5`, `build/index.js`, pmndrs |
| `engine/vendor/n8ao-2.0.1.js` | CC0 1.0 (`n8ao-LICENSE`; package.json says ISC) | npm `n8ao@2.0.1`, `dist/N8AO.js`, N8python |

## Models run offline (not shipped)

| What | Licence | Source |
|---|---|---|
| Depth Anything V2 **Small**, fp32 ONNX (`engine/depth.py`, cached in `.cache/models/`) | Apache-2.0. Base/Large/Giant are CC-BY-NC-4.0 and must not be used. | https://huggingface.co/onnx-community/depth-anything-v2-small |

## Archive photos

Archive photos live in `projects/<p>/assets/archive/` with their own `SOURCES.md`.

## World kit (`assets/world/`, built by `engine/world/bake.py`)

All public domain. NASA imagery: "NASA material is not protected by copyright unless noted"
(https://www.nasa.gov/nasa-brand-center/images-and-media/); credit is appreciated, not required.

| File | What | Licence | Source |
|---|---|---|---|
| `world/earth/day.jpg` | Blue Marble Next Generation, Dec 2004, topography + bathymetry, 5400x2700 resampled to 4096x2048 | Public domain (NASA Earth Observatory, Reto Stöckli) | https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg |
| `world/earth/night.jpg` | Black Marble 2016 (Earth at Night), 3 km, greyscale 4096x2048 | Public domain (NASA Earth Observatory, Joshua Stevens / Miguel Román, NASA GSFC) | https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg |
| `world/earth/clouds.jpg` | Cloud composite, 8192x4096 resampled to 4096x2048 greyscale | Public domain (NASA Goddard / Reto Stöckli) | https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_8192.tif |
| `world/earth/map.png` | Map mask (R land minus lakes, G coast/rivers, B borders/states) rasterised from Natural Earth 1:50m | Public domain (Natural Earth) | via `projects/palantir/assets/geo/vectors.json` (see its SOURCES.md) |
| `world/places/denver/image.jpg` | Blue Marble NG 500 m tile A1 (Dec 2004), cropped ±2° lat around 39.745 N, 104.99 W | Public domain (NASA) | https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x21600.A1.jpg |
| `world/places/denver/night.jpg` | Black Marble 2016 500 m tile A1, same crop | Public domain (NASA) | https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_A1.jpg |
| `world/places/denver/dem-region.png`, `dem-local.png` | Elevation, AWS Terrain Tiles (terrarium) z9 / z12, stitched, equirectangular; (m+500)*10 in R,G | Public data (SRTM, GMTED2010, ETOPO1 and others; attribution list at https://github.com/tilezen/joerd/blob/master/docs/attribution.md) | https://registry.opendata.aws/terrain-tiles/ |
| `world/places/denver/map.png` | Map mask from Natural Earth 1:10m (US region) | Public domain (Natural Earth) | as above |

Vehicles, buildings, trees, clouds and roads in `engine/world/` are procedural (no third-party
models). Kenney Car Kit (CC0, https://kenney.nl/assets/car-kit) was downloaded and evaluated but
not used: toy proportions read as a game; the procedural cars are built to real dimensions.
Poly Pizza returned 403 from this box.

## Real imagery (`assets/imagery/`, built by `engine/imagery/bake.py`)

On-screen credit: each set's `set.json` → `attribution` (shown as the SOURCE line by `projects/footage-lab`).

| Set | Imagery | Elevation | Licence | Source |
|---|---|---|---|---|
| `imagery/pentagon/` (38.8710 N, 77.0559 W; 4 levels, 0.6–38 m/px) | USDA NAIP orthoimagery via USGS The National Map | USGS 3DEP bare earth (1 m lidar) | Public domain (US Government works) | https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer , https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer (exportImage, fetched 2026-10-12) |
| `imagery/hoover/` (36.0125 N, 114.7390 W; 4 levels) | same | same | Public domain | same |
| Sentinel-2 sets (any baked with `--source s2`) | Copernicus Sentinel-2 L2A TCI, AWS Open Data `sentinel-cogs` via Element 84 Earth Search | AWS Terrain Tiles (terrarium) | Copernicus Sentinel data licence (free, attribution "Contains modified Copernicus Sentinel data <year>"); Terrain Tiles: attribution of SRTM/GMTED/ETOPO1 etc. | https://registry.opendata.aws/sentinel-2-l2a-cogs/ , https://github.com/tilezen/joerd/blob/master/docs/attribution.md . EOX s2cloudless (CC BY-NC-SA) is not used. |

## Code (engine/imagery)

| File | Licence | Source |
|---|---|---|
| `engine/imagery/jpeg.js` | Apache-2.0 (decoder core, © 2011 notmasteryet, from pdf.js) + BSD-3-Clause (jpeg-js package, © 2014 Eugene Ware) | npm `jpeg-js@0.4.4`, `lib/decoder.js`, converted to an ES module (synchronous fallback decoder for `engine/footage.js`) |

## Footage (`assets/footage/`, fetched by `node engine/footage.js pack`)

Video files are git-ignored and rebuilt from `assets/footage/pack.json`. Each clip's provenance
(source URL, page, download URL, licence, licence evidence, credit, sha1) is committed as
`assets/footage/clips/<id>.json`. Source catalogue with licence notes: `docs/assets/footage-library.md`.

| Clips | Source | Licence | Credit |
|---|---|---|---|
| `server-nasa-ames-modular`, `orbit-*` (Earth in 4K, Expeditions 65 and 67/68), `weather-helene-iss`, `aircraft-x59-takeoff`, `crowd-apollo-launch-1969`, `command-apollo-mcc-1969`, `command-artemis-flight-control` | NASA Image and Video Library, https://images.nasa.gov | Public domain (NASA media guidelines) | NASA / JSC, Ames, Armstrong |
| `computing-sage-1956`, `command-sage-consoles-1956`, `computing-sage-panels-1956` ("On Guard! The Story of SAGE", 1956), `typing-hands-1940s` ("Basic Typing"), `highway-green-light-1954` ("Give Yourself the Green Light") | Prelinger Archives, https://archive.org/details/prelinger | CC Public Domain Dedication on each item | Prelinger Archives (courtesy Internet Archive) |
| `office-treasury-1969`, `money-treasury-press-1969` ("The Treasury Story", 1969) | US National Archives upload on archive.org, `gov.archives.arc.11865` | US Government work / CC0 mark | National Archives and Records Administration |
| `ships-lcs-formation`, `ships-comfort-underway`, `command-space-ops-center-dod` | US Navy / US Space Force via DVIDS, mirrored on Wikimedia Commons | Public domain (PD-USGov-Military); DoW endorsement disclaimer applies | US Navy / US Space Force (DVIDS) |
| `weather-erin-goes`, `weather-milton-hurricane-hunter` | NOAA NESDIS / NOAA AOC via Wikimedia Commons | Public domain (US Government) | NOAA |
| `crowd-causeway-bay-timelapse`, `highway-tullamarine` | Wikimedia Commons | CC0 1.0 | per file page |
| `oil-rig-drilling` ("Move It: Rig Move Safety for Roughnecks", 2012) | Wikimedia Commons | Public domain (US Government work, per file page) | per file page |
