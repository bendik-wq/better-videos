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

## People (`assets/people/`, built by `engine/people/build/`)

Bodies, clothes and hair were assembled offline in Blender 4.2.23 with the MPFB2 extension (both
GPL, used as offline tools like ffmpeg; no GPL code ships) from MakeHuman asset packs downloaded
2026-10-12 from https://files2.makehumancommunity.org/asset_packs/ (no login). Per-asset author and
licence are also in `people/wardrobe/manifest.json`, which carries a ready-made attribution line
per wardrobe id. **Any video showing a CC BY item must credit it** (description is enough), e.g.
"3D clothing: Elvaerwyn, punkduck, Mindfront, culturalibre (MakeHuman community), CC BY".
Licence pages checked: https://static.makehumancommunity.org/about/license.html (core assets CC0)
and each pack page under https://static.makehumancommunity.org/assets/assetpacks/ (per-asset
licence column; also the `# license` line inside every .mhclo). Pack sha256 (prefix): dress03_cc-by.zip `d35487edda8347ac`; equipment03_cc-by.zip `9513ab6059363778`; hair01_cc0.zip `49445d69848a313e`; hats02_cc0.zip `838b9b51ba31d27f`; hats03_cc-by.zip `2702d58fa04e5723`; makehuman_system_assets_cc0.zip `b542127a8e25547c`; mpfb2-20261011.zip `7cb1366da87e810a`; pants01_cc0.zip `e4e0ec60db34f279`; pants02_ccby.zip `9dbcd65e03ab1009`; shirts01_cc0.zip `a5a723b0e84a109b`; shirts02_ccby.zip `d711ca9f73212de8`; shoes01_cc0.zip `ded3f70428505eab`; shoes02_ccby.zip `1b544d87dd8b3d3a`; suits01_cc0.zip `2b1d8676f3863b18`; suits02_cc0.zip `437f4d7ab92b698c`; suits03_cc-by.zip `74ace28794d27186`; 

| File | What | Author | Licence | Source |
|---|---|---|---|---|
| `people/wardrobe/<id>.glb`, `<id>_lod1.glb` | MakeHuman base mesh hm08 with macro targets, skins, eyes, eyebrows, eyelashes, hair (short01-04, bob02, ponytail01, long01), system clothes (male_elegantsuit01, female_elegantsuit01, male_casualsuit01/05, shoes02/04), rigged to the MPFB "game_engine" skeleton | MakeHuman team | CC0 | makehuman_system_assets_cc0.zip |
| same | toigo_male_suit_3, toigo_female_suit, toigo_flats, toigo_ankle_boots_female, toigo_fisherman_sweater | Margaret Toigo | CC0 | suits01, shoes01, shirts01 |
| same | culturalibre_male_boots | culturalibre | CC0 | shoes01 |
| same | donitz_monk_robe, donitz_monk_robe_hood (the hooded robe) | Donitz | CC0 | suits02 |
| same | punkduck_winter_coat (overcoat / lab coat), punkduck_running_shoes_01 | punkduck | CC BY 3.0 | dress03, shoes02 |
| same | punkduck_male_classic_jeans | punkduck | CC BY 4.0 | pants02 |
| same | elvs_male_coveralls_1, elvs_hooded_sweat_jacket1, elvs_male_shirt_tie_tucked1, elvs_male_trouser, elvs_jeans_straight_leg, elvs_slouchy_beanie1 | Elvaerwyn | CC BY | suits03, shirts02, pants02, hats03 |
| same | mindfront_tactical_vest_male, mindfront_patrol_cap, mindfront_shoes_oxford_male | Mindfront | CC BY 4.0 | equipment03, hats03, shoes02 |
| same | culturalibre_sneakers | culturalibre | CC BY | shoes02 |
| `people/clips.glb` | 25 motion clips retargeted from the CMU Graphics Lab Motion Capture Database (subjects 07, 08, 09, 13, 16, 17, 18, 19, 35, 36, 40, 56, 77, 79, 80, 82, 91, 111, 113, 137, 138, 139; see `engine/people/build/clips.py`) | Carnegie Mellon University; BVH conversion by Bruce Hahne (cgspeed) | Free for any use. Please cite: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217." | BVH via https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/ (READMEFIRST.txt there carries CMU's and Hahne's terms) |
| `people/env/{Asphalt026A,Concrete034,PaintedPlaster017,Carpet016,Metal032,Wood049,Fabric026,Plaster001}/` | PBR sets (colour, normal GL, roughness), 1K | ambientCG (Lennart Demes) | CC0 | https://ambientcg.com/get?file=<name>_1K-JPG.zip |

Not used: Quaternius Universal Base Characters [Standard] (CC0, downloaded and evaluated: only
superhero proportions are free); Sketchfab rigged humans (downloads need a login); Mixamo (Adobe
account and no redistribution).


## Episode 3: Strait of Hormuz (`engine/sea`, `projects/hormuz`, `projects/hormuz-lab`)

Everything in `engine/sea` (FFT ocean, sky, ships, land, post) is original code (MIT-compatible, no
third-party code); the ships, hull atlases, decks and the tank farm are procedural (no models used:
no CC0 tanker/LNG/destroyer model good enough at 50 m was found on Poly Haven / ambientCG / Quaternius;
Sketchfab needs a login). The bridge crew are `engine/people` bodies (see People above for their credits).

| File | What | Licence | Source |
|---|---|---|---|
| `projects/hormuz/assets/imagery/hormuz/L0-L2/*.jpg` | Sentinel-2 L2A true colour (TCI) mosaics, Nov-Mar winter scenes, 10/40/160 m per px, centred 26.56 N 56.45 E (the TSS between Larak and the Quoin Islands); nodata filled from the next coarser level | Copernicus Sentinel data licence (free, full and open; attribution required). **Credit: "Contains modified Copernicus Sentinel data 2024, 2025"** | AWS Open Data sentinel-cogs via Element 84 Earth Search STAC, fetched 2026-10-12. Scenes: S2A_40RCP_20250318_1_L2A (2025-03-18); S2A_40RCQ_20241106_0_L2A (2024-11-06); S2A_40REP_20241113_0_L2A (2024-11-13); S2A_40REQ_20241103_0_L2A (2024-11-03); S2A_40RER_20241223_0_L2A (2024-12-23); S2B_40RCP_20241101_0_L2A (2024-11-01); S2B_40RCP_20250127_0_L2A (2025-01-27); S2B_40RCQ_20250110_0_L2A (2025-01-10); S2B_40RCQ_20250127_0_L2A (2025-01-27); S2B_40RCR_20241111_0_L2A (2024-11-11); S2B_40RCR_20241211_0_L2A (2024-12-11); S2B_40RCR_20250318_0_L2A (2025-03-18); S2B_40RDP_20250318_0_L2A (2025-03-18); S2B_40REP_20241105_0_L2A (2024-11-05); S2B_40REP_20250318_0_L2A (2025-03-18); S2B_40REQ_20241108_0_L2A (2024-11-08); S2C_40RCP_20250221_0_L2A (2025-02-21); S2C_40RDQ_20250221_0_L2A (2025-02-21); S2C_40RDR_20241103_1_L2A (2024-11-03) |
| `projects/hormuz/assets/imagery/hormuz/L3/*.jpg` | NASA Blue Marble Next Generation (500 m), +-512 km around the strait | Public domain (NASA) | NASA GIBS WMS layer BlueMarble_NextGeneration, https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi |
| `projects/hormuz/assets/imagery/hormuz/L*/dem.png`, `arabia/L0/dem.png` | Elevation and bathymetry | Attribution of the underlying sources: SRTM, GMTED2010, ETOPO1 (public domain) and others | AWS Terrain Tiles (Mapzen terrarium), https://github.com/tilezen/joerd/blob/master/docs/attribution.md . Credit: "Elevation: Mapzen Terrain Tiles (SRTM, GMTED2010, ETOPO1 and others)" |
| `projects/hormuz/assets/imagery/arabia/` | Arabian Peninsula map base (34-62 E, 14-33 N), Blue Marble NG + Blue Marble Shaded Relief and Bathymetry | Public domain (NASA) | NASA GIBS WMS (as above) |
| `projects/hormuz/assets/geo/vectors.json` (coast, countries) | Natural Earth 1:10m coastline and admin-0 countries, clipped and simplified | Public domain | https://github.com/nvkelso/natural-earth-vector (naturalearthdata.com) |
| `projects/hormuz/assets/geo/vectors.json` (tss) | Traffic separation scheme in the strait: OSM ways 220138722 (separation zone), 220138785 and 220138843 (boundaries), 220138792 and 220138816 (lanes) | ODbL: **credit "(c) OpenStreetMap contributors"** (produced work) | Overpass API, https://www.openstreetmap.org/way/220138792 |
| `projects/hormuz/assets/geo/vectors.json` (pipelines, places) | Pipeline routes are schematic lines through published end points; capacities from EIA | Facts (no licence needed); EIA text public domain | EIA Today in Energy 16 June 2025, https://www.eia.gov/todayinenergy/detail.php?id=65504 |
| `projects/hormuz/assets/geo/brent-monthly.json` | Europe Brent spot price FOB, monthly, 1987-2026-09 | Public domain (US Government work) | U.S. EIA, https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=M (fetched 2026-10-12) |
| `projects/hormuz/assets/geo/facts.json` | 20 million b/d (2024, ~20 % of world liquids consumption), ~1/5 of LNG trade, 2.6 million b/d bypass capacity; the 21 nmi narrowest crossing measured on the baked DEM | EIA public domain; measurement ours | EIA (as above) |
| `projects/hormuz/assets/archive/iss064e046338.jpg`, `iss067e270600.jpg`, `iss069e056918.jpg`, `iss063e002679.jpg`, `s04-37-716.jpg` | ISS and STS-4 crew photographs of the Strait of Hormuz, Musandam and the Gulf | Public domain (NASA; credit "NASA") | https://images.nasa.gov/details/<id> |
| `assets/footage/clips/commons-iranian-irgc-speedboat-approaching-uss-sirocco-a.mp4` (+ provenance copy in `projects/hormuz/assets/footage/`) | IRGC Navy fast boat approaching USS Sirocco and USNS Choctaw County, Strait of Hormuz, 20 June 2022 (U.S. Naval Forces Central Command, 220620-N-NO146-1001) | Public domain (US Navy work) | https://commons.wikimedia.org/wiki/File:Iranian_IRGC_speedboat_approaching_USS_Sirocco_and_USNS_Choctaw.webm |

## Music (engine/music, audio-lab)
- Chopin, Waltz Op. 69 No. 1, performed by Luke Faulkner (Musopen). Public Domain Mark 1.0. https://archive.org/details/MusopenChopinWaltzOp69no1

## Episode 3, round 3: Hormuz scenic sets (`projects/hormuz/sets/scenic.js`, `index.js`, `engine/sea` ships, navy, smoke)

All ships (VLCC, LNG, container, Arleigh Burke, FFG-7, Ticonderoga, speedboats, mine, platform, buoy), the RQ-4 and A300
silhouettes, the LNG plant, the MRI room, the wafer, the fjord walls, the smoke and the cards are procedural, original
code (no third-party models). Flags are drawn in code. Crew silhouettes are `engine/people` bodies (credits above).

| File | What | Licence | Source |
|---|---|---|---|
| `projects/hormuz/assets/archive/roberts.jpg` (+ `depth/roberts.*` made by `engine/depth.py`) | USS Samuel B. Roberts (FFG-58) in dry dock at Dubai, May 1988: the hull damage from the Iranian mine of 14 April 1988. Photo PH2 Rudy D. Pahoyo, U.S. Navy (DoD photo via NARA) | Public domain (US Navy work) | https://commons.wikimedia.org/wiki/File:Ffg58minedamage.jpg (1920 px Commons rendition, fetched 2026-10-12) |
| `assets/footage/clips/iran-drone-2019.mp4` (provenance `iran-drone-2019.json`) | The smoke trail of the U.S. Navy RQ-4A (BAMS-D) falling after the IRGC missile hit, 20 June 2019, U.S. Navy imagery released by U.S. Central Command (DVIDS DOD_106930698) | Public domain (US Government work) | https://commons.wikimedia.org/wiki/File:U.S._Navy_RQ-4_smoke.webm |
| `assets/footage/clips/irgc-speedboat-sirocco.mp4` | Alias copy (same bytes) of `commons-iranian-irgc-speedboat-approaching-uss-sirocco-a.mp4` under the id the shot list uses | Public domain (US Navy work) | as above |
| `assets/footage/clips/ships-lcs-formation.mp4` | Starter-pack clip (USS Independence LCS 2 and USS Coronado LCS 4, Pacific, 23 April 2014; MCSC Keith DeVinney, U.S. Navy) | Public domain (US Navy work) | https://commons.wikimedia.org/wiki/File:LCS_Formation_Displays_One_of_Navy%27s_Newest_Platforms.ogv |
| `assets/pbr/stone.*` (used by the Khasab fjord walls) | Poly Haven `large_sandstone_blocks` (already in the PBR library) | CC0 | https://polyhaven.com/a/large_sandstone_blocks |
- projects/hormuz/assets/geo/world.json: simplified from Natural Earth 1:10m admin-0 countries. Public domain. https://www.naturalearthdata.com

## Episode 4, "LIVE WIRE" (projects/blackout): fonts, night-lights, geo

| File | What | Licence | Source |
|---|---|---|---|
| `projects/blackout/assets/fonts/BigShouldersDisplay.ttf` (+ `OFL-BigShouldersDisplay.txt`) | Big Shoulders Display (variable, wght 100–900): the episode's condensed industrial display face (titles, chapter cards, big numbers) | SIL Open Font License 1.1 | github.com/google/fonts `ofl/bigshouldersdisplay/BigShouldersDisplay[wght].ttf` (The Big Shoulders Project Authors), fetched 2026-10-12 |
| `projects/blackout/assets/fonts/VT323-Regular.ttf` (+ `OFL-VT323.txt`) | VT323 (a DEC VT320 terminal face): the SCADA/CRT data and caption type, with a bloom/scanline treatment in the CRT pass | SIL Open Font License 1.1 | github.com/google/fonts `ofl/vt323/VT323-Regular.ttf` (The VT323 Project Authors, Peter Hull), fetched 2026-10-12 |
| `projects/blackout/assets/night/east-europe.jpg` (+ `.json`) | Night-lights texture over eastern Europe (14–42°E, 43–56°N), for the orbit-lights set's regional patch whose districts switch off on cue | Public domain (NASA) | NASA Black Marble 2016 (500 m, tile C1), https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_C1.jpg, cropped 2026-10-12. Credit: "NASA Earth Observatory / Black Marble 2016" |
| `projects/blackout/assets/geo/vectors.json` | Coast, borders, states and country outlines for Ukraine, the US, Poland, Russia, Belarus (map-ops set) | Public domain | Natural Earth 1:10m (naturalearthdata.com), extracted and simplified from `projects/palantir/assets/geo/vectors.json` (Natural Earth via github.com/nvkelso/natural-earth-vector) |

The LIVE WIRE globe/orbit shots reuse the NASA Blue Marble / Black Marble / cloud globe textures in `assets/world/earth/` (credited above). All episode-4 3D sets (the oscilloscope, one-line diagram, SCADA HMI, control room, substation, winter town, direct-flash still life, documents, attacker terminal) are original procedural code. Public-domain footage used via engine/footage.js (control rooms: NASA Apollo MCC / Artemis / SAGE; server room: NASA Ames; cities at night: NASA ISS) is credited in `assets/footage/clips/*.json`.
