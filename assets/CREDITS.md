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
