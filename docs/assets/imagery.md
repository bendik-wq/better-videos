# Real aerial terrain: the imagery set format

`engine/imagery/` turns any lat/lon into a photoreal, nested, tiled terrain set from real imagery and
real elevation. It is the realism shortcut for every establishing aerial: real places look real
because they are photographs.

| Where | Imagery | Elevation | Licence | Credit line |
|---|---|---|---|---|
| United States (CONUS, AK, HI, PR) | **USDA NAIP** orthoimagery, 0.3–1 m, via the USGS National Map `USGSNAIPImagery` ImageServer | **USGS 3DEP** bare earth, 1 m lidar where flown | Public domain (US Government) | `Imagery: USDA Farm Production and Conservation, NAIP, via USGS The National Map. Elevation: USGS 3D Elevation Program.` |
| Anywhere else | **Copernicus Sentinel-2 L2A** true colour (TCI, 10 m), least-cloudy summer scenes mosaicked per pixel, from the AWS Open Data COGs found through Element 84 Earth Search | **AWS Terrain Tiles** (Mapzen terrarium: SRTM, GMTED2010, ETOPO1, EU-DEM, …) | Copernicus data: free, full and open, attribution required. Terrain Tiles: attribution of sources | `Contains modified Copernicus Sentinel data <year>. Elevation: Mapzen Terrain Tiles (SRTM, GMTED2010, ETOPO1 and others).` |

**Never use EOX "Sentinel-2 cloudless"**: it is CC BY-NC-SA. Our mosaics are built from the raw
L2A scenes instead. Copernicus Data Space and Sentinel Hub need accounts, so they aren't used.

Licence evidence: NAIP/3DEP are US Government works (17 U.S.C. 105; the service metadata reads
"USGS, USDA, The National Map"). Sentinel: *Legal notice on the use of Copernicus Sentinel Data and
Service Information* (EU Regulation 1159/2013): free use including commercial, with the source
credited as "Copernicus Sentinel data [Year]" or "contains modified Copernicus Sentinel data [Year]".
Terrain Tiles: https://github.com/tilezen/joerd/blob/master/docs/attribution.md.

## Baking

```bash
python3 engine/imagery/bake.py <name> <lat> <lon> [--radius 1500] [--levels 4] [--step 4]
                               [--source auto|naip|s2] [--dem auto|3dep|terrarium] [--mpp 0.6] [--year 2025]
python3 engine/imagery/bake.py pentagon 38.8710 -77.0559 --radius 1200      # NAIP + 3DEP
python3 engine/imagery/bake.py hoover 36.0125 -114.7390 --radius 1500       # NAIP + 3DEP, canyon relief
python3 engine/imagery/bake.py matterhorn 45.9763 7.6586 --source s2        # Sentinel-2 + terrarium
python3 engine/imagery/bake.py match <name>                                  # re-run the level colour match
```

* Pure Python + numpy + Pillow. GeoTIFF/COG reading is `engine/imagery/tiff.py` (strips/tiles,
  deflate/LZW, predictors 2 and 3, range requests), so no GDAL is needed.
* `auto` picks NAIP + 3DEP inside the US and Sentinel-2 + terrarium elsewhere.
* Levels nest: level *i* has radius `radius · step^i` and `mpp · step^i` metres per pixel, so every
  level is about the same pixel count (~5000² at the defaults, 25–35 tiles, 6–12 MB of JPEG).
  Defaults for a US place: 0.6 m over ±1.5 km, 2.4 m over ±6 km, 9.6 m over ±24 km, 38 m over ±96 km.
* After baking, every coarser level is colour-matched to the finer one inside their overlap: a
  per-channel gain and offset, plus a low-frequency correction field diffused out from the seam.
  Coarse service overviews often come from other years or processing runs, so without this the
  level edge shows as a tonal step.
* Downloads are cached in `.cache/imagery/` (content-addressed); nothing is fetched at render time.
* Cost: about 3–10 minutes per US place (the NAIP service is slow and sometimes returns 504s, which
  are retried), 35–60 MB on disk. Sentinel-2 reads only the COG tiles it needs.

Known source artefacts: NAIP is a mosaic of state acquisitions from different years, so seams can
cut across water (the Potomac by the Pentagon shows a hard light/dark edge where the DC and Virginia
flights meet). Frame around them; they are in the photograph, not the renderer. 3DEP is bare earth:
buildings are flat photographs, so keep the camera high (≥ 400 m) or steep over cities, and use
relief (canyons, mountains, coasts) for low, oblique flying.

## Set format: `assets/imagery/<name>/`

```
set.json
L0/dem.png  L0/<row>_<col>.jpg ...     finest level
L1/dem.png  L1/<row>_<col>.jpg ...
...
```

`set.json`:

```jsonc
{
  "format": "bv-imagery/1",
  "name": "pentagon",
  "center": { "lat": 38.871, "lon": -77.0559, "elev": 11.0 },   // elev = DEM at the centre (m ASL)
  "crs": "EPSG:4326 (equal-angle pixels, north up)",
  "tile": 1024,
  "demEncoding": "(elev_m + 500) * 10 = R*256 + G",              // the same as engine/world place DEMs
  "levels": [
    {
      "id": 0,
      "bbox": [w, s, e, n],          // degrees; pixel edges (pixel (i, j) centre at w + (i+.5)·degPerPx)
      "size": [W, H],                // full level image in pixels
      "mpp": 0.6,                    // metres per pixel north-south (east-west is mpp·cos(lat))
      "degPerPx": 5.39e-6,
      "tiles": [cols, rows],         // tile (row, col) covers pixels [col·1024, min(W, col·1024+1024)) × same for rows
      "image": "L0/{row}_{col}.jpg", // sRGB JPEG, row 0 = north; edge tiles are smaller than 1024
      "dem": { "file": "L0/dem.png", "size": [w, h], "mpp": 1.4, "min": -0.5, "max": 52.6 },
      "colorMatch": { "gain": [...], "offset": [...] }   // levels > 0
    }
  ],
  "sources": { "imagery": { name, licence, credit, url, scenes? }, "elevation": { ... } },
  "attribution": "Imagery: ... Elevation: ...",          // put this on screen when the set is shown
  "baked": "2026-10-12"
}
```

DEM pixels cover the same bbox as the imagery (pixel centres at `(i + 0.5) / w`). Heights are metres
above sea level (NAVD88 for 3DEP, EGM96/EGM2008 for terrarium sources), never exaggerated.

### Using a set from engine/world

The format deliberately mirrors `assets/world/places/<name>/place.json` (same DEM encoding,
equirectangular bboxes) so `W.create({ place })` can take a set without conversion:

* `levels[0]` is a drop-in `local` block (`bbox`, `dem`); the coarsest level is a drop-in `region`.
* Imagery is tiled instead of one `image.jpg`. A loader samples a level by mapping lat/lon into
  `bbox` → pixel → `(row, col)` tile and `uv` inside it, or calls `IM.loadSet()` / `IM.loadDem()`
  from `engine/imagery/index.js`. `IM.terrain()` (below) is the reference implementation.
* Suggested hook for the world owner: `W.create({ place, imagery: '<set name>' })` → use the set's
  levels for the terrain albedo near the anchor and keep the Blue Marble textures beyond the
  coarsest level.

## Runtime: `engine/imagery/index.js`

```js
import * as IM from '/engine/imagery/index.js';
const T = await IM.terrain(scene, 'pentagon', { lod: 0, haze: 'day', grade: 'house', renderer });
// every frame, after moving the camera:
T.update(camera);
T.toLocal(38.87085, -77.05585, 300);   // Vector3 300 m above the ground there
T.height(x, z);                         // ground height in the scene frame
T.geo(x, z);                            // [lat, lon]
T.attribution                           // the credit line for the source caption
```

Options: `lod` (0 = every level; 1 = skip the finest; …), `levels` (cap), `segments` (grid per
tile, default 64), `haze` (`day` | `golden` | `dusk` | `clear` | object), `grade` (`house` |
`neutral` | object), `exaggeration` (default **1**), `curvature` (default on), `sky` (default on).

Scene frame: metres, origin at the set centre on the ground, x east, y up, z south (the
engine/world convention), earth curvature applied (`y -= d²/2R`), so the horizon is in the right
place at altitude.

Look: the photograph is drawn unlit (its sun and shadows are real), graded towards the house style
(contrast 1.12, saturation 0.86, warmth +0.05) and seen through physically shaped aerial
perspective. That is exponential height fog with a 1.2 km scale height, integrated exactly along
each view ray, with in-scatter warming towards the sun. A sky dome uses the same colour at the true
(dipped) horizon, so the land dissolves into the sky the way it does from a real drone. Finer levels
fade over their outer 6 % onto the coarser level underneath, with polygon offset so they always win
the depth test.

Cost (llvmpipe, 1080p): a 4-level NAIP set is 96–120 tiles of 1024² (~0.5 GB of RGBA + mips in
system memory per worker); loading takes a few seconds per worker. In the footage-lab final render,
on a 4-vCPU box shared with other renders (load 10–14), aerial chunks ran at 0.7–1.1 fps per worker
including capture, finish and encode; expect roughly 0.5–0.8 s per frame under that load and
less on an idle box. Knobs: `lod: 1` (skip the 0.6 m level, about ¼ of the texture memory),
`levels: 3`, `segments: 32`. A GPU would make this trivially real-time; nothing here needs one.

Sentinel-2 sets are 10 m/px, and the TCI product clips snow and bright cloud (it saturates near
30 % reflectance). They hold up from about 2 km AGL and above. Lower and they read soft. A future
improvement is to bake from the 16-bit B04/B03/B02 bands with our own tone curve.

Demo: `projects/footage-lab` (the `aerial` set: Pentagon drift-in and the Hoover Dam canyon run).
