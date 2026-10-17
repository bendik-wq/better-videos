# Credits: assets used by the Panama graphics sets

Everything in `projects/panama/assets/` used by `sets/graphics*.js`, with its source and licence. Put the credit
lines marked **(on screen)** in the frame (the sets already do) and every line in the YouTube description.

## Data

| File | What | Source | Licence / terms |
|---|---|---|---|
| `assets/data/gatun.csv` | Gatun Lake daily level, 1 Jan 1965 – 16 Oct 2026 (22,569 days, feet above MSL) | Panama Canal Authority (ACP), `Download_Gatun_Lake_Water_Level_History.csv` from https://evtms-rpts.pancanal.com/eng/h2o/index.html, downloaded 17 Oct 2026 (RESEARCH S08) | Public ACP data release; credit "Panama Canal Authority" **(on screen)** |
| `assets/data/gatun-projection.csv` | ACP lake-level projection, 18 Oct – 17 Dec 2026 (uploaded 13 Oct 2026) | ACP, `Gatun_Water_Level_Projection.csv`, same page | As above. ACP: "estimates … shall be used for reference purposes only" |

## Maps

| File | What | Source | Licence |
|---|---|---|---|
| `assets/geo/panama.json` | Country outlines (world, Americas, isthmus), the Panama Canal centerline | Natural Earth 1:10m and 1:50m (admin-0 countries, rivers + lake centerlines), via github.com/nvkelso/natural-earth-vector; built by `assets/geo/build.py` | Public domain. Credit "Natural Earth" **(on screen)** |
| `assets/geo/panama.json` → `lakes` | Gatun Lake and Lake Alhajuela polygons | OpenStreetMap via Nominatim (`polygon_geojson`), 17 Oct 2026 | ODbL 1.0. Credit "© OpenStreetMap contributors" **(on screen)** |

The canal-watershed outline in the `watershed` view and the Río Indio site pin are hand-placed approximations and
are labelled "APPROX." on screen. The telegraph route is labelled "ROUTE SCHEMATIC".

## Satellite imagery

| File | What | Source | Licence |
|---|---|---|---|
| `assets/satellite/2026-01-05.jpg` | Gatun Lake, true colour, 20 m. Lake 88.82 ft that day (gatun.csv) | Copernicus Sentinel-2 L2A `S2A_17PPL_20260105_0_L2A` (TCI), AWS Open Data / Element 84 Earth Search; cropped by `assets/satellite/fetch.py` | Copernicus data licence (free, full, open). "Contains modified Copernicus Sentinel data 2026" **(on screen)** |
| `assets/satellite/2023-06-03.jpg` | Same crop. Lake 80.09 ft | `S2B_17PPL_20230603_0_L2A` | "Contains modified Copernicus Sentinel data 2023" **(on screen)** |
| `assets/satellite/nasa-queue-2023-08-18.jpg` | Ships waiting off the Pacific entrance, Landsat 8 OLI, 18 Aug 2023 (`panamatraffic_oli_2023230_lrg.jpg`) | NASA Earth Observatory, "Panama Canal Traffic Backup" (RESEARCH P12) | NASA imagery, free to use with credit: "NASA Earth Observatory image by Wanmei Liang, using Landsat data from the USGS" **(on screen)** |
| `assets/satellite/ships.json` | Marker positions on some ships in the NASA image | Our brightness detector, checked by eye | Ours. Decoration only, **not** a ship count |

## Archive photographs (all public domain / no known restrictions; rights lines read 17 Oct 2026)

| File | Catalogue title | Source | Rights line |
|---|---|---|---|
| `archive/gamboa-blast-1913.jpg` | "Blowing up Gamboa Dyke" — "General View from west hill showing blast. Oct. 10, 1913" (Handy & Hallen; Davis_B019_0541) | Bucknell University Special Collections/University Archives, Panama Canal Construction Photographs, https://leaf.bucknell.edu/node/3765/about (P1) | "This image is in the public domain" |
| `archive/gamboa-pipes-1913.jpg` | "Gamboa Dyke" — "Flooding of Culebra Cut thru valve pipes … Oct. 1, 1913" (Handy & Hallen; Davis_B019_0540) | Bucknell, https://leaf.bucknell.edu/node/3764/about (P2) | "This image is in the public domain" |
| `archive/gatun-dam-1910.jpg` | "[Gatun Dam construction, Panama Canal]", 1910 (left half of a stereograph) | Library of Congress P&P, https://www.loc.gov/pictures/item/2021640026/ (P5) | "No known restrictions on publication." |
| `archive/gatun-spillway-1913.jpg` | "At the foot of the spillway at Gatun Dam, Panama Canal", c1913 Jun. 11 (Keystone stereograph, left half) | LoC, https://www.loc.gov/pictures/item/96520535/ (P6) | "No known restrictions on publication." |
| `archive/culebra-flooded.jpg` | "Culebra Cut after flooding, showing slides", c. 1910–1914 (Detroit Publishing Co.) | LoC, https://www.loc.gov/pictures/item/2016814013/ (P7) | "No known restrictions on publication." |
| `archive/cucaracha-slide-1913.jpg` | "Culebra Cut near Culebra showing Cucaracha land slide of 47 acres at the left, Panama Canal", 1913 (stereograph, left half) | LoC, https://www.loc.gov/pictures/item/2021639869/ (P8; rights now read) | "No known restrictions on publication." |
| `archive/gatun-locks-1910.jpg` | "Gatun upper locks--Looking north from east bank--March 15, 1910" (Keystone, left half) | LoC, https://www.loc.gov/pictures/item/94511461/ (P11) | "No known restrictions on publication." |
| `archive/gatun-monolith-1912.jpg` | "Extreme north end of lower lock showing immense steel monolith forms on tracks, used in construction work; Gatun, Panama Canal", c1912 May 27 (Keystone, left half) | LoC, https://www.loc.gov/pictures/item/96520541/ (P11) | "No known restrictions on publication." |

Crops: the lantern-slide mounts and stereo-card borders are cropped away; nothing else is altered. Depth maps and
plates in `archive/depth/` are made by `engine/depth.py` (Depth Anything V2 Small, Apache-2.0).

**Not used (rights not cleared):** LoC 92510051 (SS *Ancon* entering Pedro Miguel, P9: no rights statement, larger
images "only available at the Library of Congress"); LoC 2018661728 and 2018661732 (SS *Ancon*, P10: "Rights status not
evaluated"); LoC 2021640062 (P11, Gatun lock site 1909: "No known restrictions", available but not used).

## Fonts

| File | Font | Licence |
|---|---|---|
| `assets/fonts/Inter-latin.woff2` | Inter (variable, latin subset), Google Fonts | SIL Open Font License 1.1, `assets/fonts/Inter-OFL.txt` |
| repo `assets/fonts/` | Instrument Serif, IBM Plex Mono, Archivo Narrow | OFL 1.1 (already in the repo) |
