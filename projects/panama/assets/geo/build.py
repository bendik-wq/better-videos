#!/usr/bin/env python3
"""Build projects/panama/assets/geo/panama.json for the `map` set from Natural Earth (public domain).

  python3 -I projects/panama/assets/geo/build.py <dir with the Natural Earth geojson files>

Inputs (github.com/nvkelso/natural-earth-vector, geojson/): ne_50m_admin_0_countries, ne_10m_admin_0_countries,
ne_10m_lakes, ne_10m_rivers_lake_centerlines. Output rings are flat [lon, lat, lon, lat, ...] arrays, rounded.
  world     50m countries, Douglas-Peucker 0.1 deg            (world / routes views)
  americas  10m countries in the Americas box, DP 0.035 deg      (americas / telegraph views)
  isthmus   10m countries near Panama, DP 0.002 deg             (isthmus / watershed views)
  lakes     Gatun Lake and Lake Alhajuela from OpenStreetMap (Nominatim polygon_geojson, simplified server-side; ODbL,
            "© OpenStreetMap contributors"): osm_gatun.json, osm_alajuela.json saved from
            nominatim.openstreetmap.org/search?q=Lago+Gatun,+Panama&format=json&polygon_geojson=1&polygon_threshold=0.0006
            (Alajuela: threshold 0.0004). Fallback for Gatun: Natural Earth 10m lakes 'Lago Gatun'.
  canal     the two 'Panama Canal' centerlines (10m rivers + lake centerlines)
"""
import sys, os, json
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'panama.json')

def dp(pts, tol):
    if len(pts) < 4 or tol <= 0: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; L = (dx * dx + dy * dy) or 1e-18
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]; t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L)); qx, qy = ax + t * dx - px, ay + t * dy - py
            d = qx * qx + qy * qy
            if d > best: best, bi = d, i
        if bi > 0 and best > tol * tol: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]

def rings(geom):
    cs = geom['coordinates']
    polys = cs if geom['type'] == 'MultiPolygon' else [cs]
    return [r for poly in polys for r in poly[:1]]  # outer rings only (no holes needed at these scales)

def flat(r, nd): return [round(v, nd) for p in r for v in p]

def bbox_hit(r, box):
    w, s, e, n = box
    return any(w <= p[0] <= e and s <= p[1] <= n for p in r)

def countries(fn, tol, box=None, nd=3, minpts=4):
    d = json.load(open(os.path.join(SRC, fn))); out = {}
    for f in d['features']:
        iso = f['properties'].get('ADM0_A3') or f['properties'].get('ISO_A3')
        for r in rings(f['geometry']):
            if box and not bbox_hit(r, box): continue
            q = dp(r, tol)
            if len(q) >= minpts: out.setdefault(iso, []).append(flat(q, nd))
    return out

world = countries('ne_50m_admin_0_countries.geojson', 0.1, nd=2, minpts=6)
americas = countries('ne_10m_admin_0_countries.geojson', 0.035, box=(-130, -58, -30, 55), nd=3, minpts=6)
isthmus = countries('ne_10m_admin_0_countries.geojson', 0.002, box=(-84, 6, -76, 11.5), nd=4)
lk = json.load(open(os.path.join(SRC, 'ne_10m_lakes.geojson')))
lakes = {}
for f in lk['features']:
    if f['properties'].get('name') == 'Lago Gatun':
        lakes['gatun'] = [flat(dp(r, 0.001), 4) for r in rings(f['geometry'])]
for key, fn in (('gatun', 'osm_gatun.json'), ('alhajuela', 'osm_alajuela.json')):
    fp = os.path.join(SRC, fn)
    if os.path.exists(fp):
        g = json.load(open(fp))[0]['geojson']
        lakes[key] = [flat(dp(r, 0.0004), 4) for r in rings(g) if len(r) > 8]
rv = json.load(open(os.path.join(SRC, 'ne_10m_rivers_lake_centerlines.geojson')))
canal = []
for f in rv['features']:
    if f['properties'].get('name') == 'Panama Canal':
        g = f['geometry']; ls = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        canal += [flat(l, 4) for l in ls]
json.dump({'source': 'Natural Earth 1:10m and 1:50m (public domain), naturalearthdata.com; lakes: OpenStreetMap (ODbL, © OpenStreetMap contributors); simplified (Douglas-Peucker)',
           'world': world, 'americas': americas, 'isthmus': isthmus, 'lakes': lakes, 'canal': canal}, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB', {k: sum(len(r) // 2 for v in x.values() for r in v) for k, x in [('world', world), ('americas', americas), ('isthmus', isthmus)]})
