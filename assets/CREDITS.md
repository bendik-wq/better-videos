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
| `oil-rig-drilling` ("Move It: Rig Move Safety for Roughnecks", 2012) | Wikimedia Commons | Public domain (US Government work) | National Institute for Occupational Safety and Health (NIOSH) |


## PBR library (`assets/pbr/`, built by `engine/world/pbr.py`)

All CC0: Poly Haven (https://polyhaven.com/license) and ambientCG (https://docs.ambientcg.com/license/), downloaded
2026-10-12 through their public download APIs (`api.polyhaven.com/files/<id>`, `ambientcg.com/get?file=<id>_1K-JPG.zip`),
no login. `layers.json` lists each layer's source id, tile size and average colour.

| File | What | Licence | Source |
|---|---|---|---|
| `pbr/asphalt.a.jpg`, `pbr/asphalt.n.jpg` | asphalt_02: albedo (AO folded in) + normal (GL) / roughness, 1K, 3.0 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/asphalt_02 |
| `pbr/asphalt_wet.a.jpg`, `pbr/asphalt_wet.n.jpg` | Asphalt025C: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.5 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Asphalt025C |
| `pbr/pavers.a.jpg`, `pbr/pavers.n.jpg` | concrete_pavement: albedo (AO folded in) + normal (GL) / roughness, 1K, 1.8 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/concrete_pavement |
| `pbr/concrete.a.jpg`, `pbr/concrete.n.jpg` | concrete_wall_008: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.71 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/concrete_wall_008 |
| `pbr/brick.a.jpg`, `pbr/brick.n.jpg` | brick_wall_006: albedo (AO folded in) + normal (GL) / roughness, 1K, 3.0 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/brick_wall_006 |
| `pbr/stone.a.jpg`, `pbr/stone.n.jpg` | large_sandstone_blocks: albedo (AO folded in) + normal (GL) / roughness, 1K, 3.0 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/large_sandstone_blocks |
| `pbr/curtain.a.jpg`, `pbr/curtain.n.jpg` | Facade001: albedo (AO folded in) + normal (GL) / roughness, 1K, facade, 16x10 window grid per tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Facade001 |
| `pbr/ribbon.a.jpg`, `pbr/ribbon.n.jpg` | Facade006: albedo (AO folded in) + normal (GL) / roughness, 1K, facade, 14x8 window grid per tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Facade006 |
| `pbr/brickwin.a.jpg`, `pbr/brickwin.n.jpg` | Facade018A: albedo (AO folded in) + normal (GL) / roughness, 1K, facade, 6x6 window grid per tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Facade018A |
| `pbr/piers.a.jpg`, `pbr/piers.n.jpg` | Facade020A: albedo (AO folded in) + normal (GL) / roughness, 1K, facade, 6x6 window grid per tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Facade020A |
| `pbr/gravel.a.jpg`, `pbr/gravel.n.jpg` | Gravel043: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.0 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Gravel043 |
| `pbr/grass.a.jpg`, `pbr/grass.n.jpg` | Grass004: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.0 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Grass004 |
| `pbr/dirt.a.jpg`, `pbr/dirt.n.jpg` | dirt: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.0 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/dirt |
| `pbr/metal.a.jpg`, `pbr/metal.n.jpg` | CorrugatedSteel009: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.0 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=CorrugatedSteel009 |
| `pbr/chrome.a.jpg`, `pbr/chrome.n.jpg` | Metal049A: albedo (AO folded in) + normal (GL) / roughness, 1K, 1.0 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Metal049A |
| `pbr/rubber.a.jpg`, `pbr/rubber.n.jpg` | Rubber004: albedo (AO folded in) + normal (GL) / roughness, 1K, 1.0 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Rubber004 |
| `pbr/markings.a.jpg`, `pbr/markings.n.jpg` | Road007: albedo (AO folded in) + normal (GL) / roughness, 1K, 8.2 m tile | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=Road007 |
| `pbr/sheet.a.jpg`, `pbr/sheet.n.jpg` | box_profile_metal_sheet: albedo (AO folded in) + normal (GL) / roughness, 1K, 2.0 m tile | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/box_profile_metal_sheet |
| `pbr/trees.png` | 4 tree-crown impostors scattered from the LeafSet010 leaf scans (built by `engine/world/pbr.py trees`) | CC0 1.0 (ambientCG) | https://ambientcg.com/view?id=LeafSet010 |
| `pbr/hdri/modern_buildings_1k.hdr` | HDRI `modern_buildings`, 1K Radiance .hdr (ambient SH + reflections at low altitude; sun clamped out at load) | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/modern_buildings |
| `pbr/hdri/modern_buildings_night_1k.hdr` | HDRI `modern_buildings_night`, 1K Radiance .hdr (ambient SH + reflections at low altitude; sun clamped out at load) | CC0 1.0 (Poly Haven) | https://polyhaven.com/a/modern_buildings_night |

Vehicles stay procedural (lofted bodies in `engine/world/vehicles.js`): no CC0 or CC-BY realistic car, truck or bus
model was found that downloads without a login. Poly Haven has none (only `covered_car`); Khronos' CarConcept is
CC-BY 4.0 but a logo-covered concept car; Sketchfab downloads need an account.
