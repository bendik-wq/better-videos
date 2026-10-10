# geo.js data sources

All files here are pre-baked at build time. Nothing is fetched from the network at render time.

## Vectors: `vectors.json`
Natural Earth (public domain, https://www.naturalearthdata.com), via the GitHub mirror
https://github.com/nvkelso/natural-earth-vector (`geojson/`, master, fetched 2026-10-10):
- 1:50m `ne_50m_land`, `ne_50m_coastline`, `ne_50m_admin_0_boundary_lines_land`, `ne_50m_lakes`,
  `ne_50m_rivers_lake_centerlines`, `ne_50m_admin_1_states_provinces_lines`, `ne_50m_admin_0_countries`
  (the `world` layer and the `countries` highlight polygons).
- 1:10m `ne_10m_land`, `ne_10m_coastline`, `ne_10m_admin_0_boundary_lines_land`, `ne_10m_lakes`,
  `ne_10m_rivers_lake_centerlines`, `ne_10m_admin_1_states_provinces_lines`, clipped to the regional
  boxes in `regions` (eu, ua, tlv, us, nola, nyc, uk); `ne_10m_populated_places_simple` (UK places).
Slimmed to flat `[lon, lat, ...]` arrays (rounded to 0.01° world / 0.003° regional).

## Elevation: `dem-*.png`, `dem.json`
AWS Terrain Tiles (Mapzen terrarium encoding), https://registry.opendata.aws/terrain-tiles/
(s3://elevation-tiles-prod/terrarium), fetched 2026-10-10, stitched and cropped to Web Mercator
boxes listed in `dem.json`. Encoding: R = sqrt(clamp(elev, 0, 6000 m) / 6000), G = the same for
depth below sea level. Terrain tiles attribution: SRTM, GMTED2010, ETOPO1 and other public sources
(see https://github.com/tilezen/joerd/blob/master/docs/attribution.md).

## PLTR daily prices: `pltr.json`
Yahoo Finance chart API v8, `https://query1.finance.yahoo.com/v8/finance/chart/PLTR?period1=...&period2=...&interval=1d`,
fetched 2026-10-10, 2020-09-30 to 2026-10-09 (1514 sessions). Rows: `[date, close, low, high]` (unadjusted; PLTR has no splits).
Key values: first close 2020-09-30 $9.50 (opening trade $10.00); 2025-02-03 close $83.74, 2025-02-04 close
$103.83 (+23.99%); 2026-06-25 close $107.27 / intraday low $106.37 (the H1 2026 low); 2026-07-28 close $123.53 /
intraday low $117.89; 2026-10-09 close $209.05 (record; previous record close $207.18 on 2025-11-03).
