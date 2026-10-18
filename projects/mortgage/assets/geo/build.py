#!/usr/bin/env python3
"""Build projects/mortgage/assets/geo/mortgage.json for the `holders` and `map` sets from Natural Earth (public domain).

  python3 -I projects/mortgage/assets/geo/build.py <dir with the Natural Earth geojson files>

Inputs (github.com/nvkelso/natural-earth-vector, geojson/): ne_50m_admin_0_countries, ne_50m_admin_1_states_provinces_lakes.
Output rings are flat [lon, lat, lon, lat, ...] arrays, rounded; outer rings only.
  world   50m countries, Douglas-Peucker 0.08 deg     (holders view)
  europe  50m countries in the UK/Europe box, DP 0.012  (map 'uk')
  usw     50m US states + Mexico in the US west box, DP 0.012 (map 'us'); keys are 'US-CA' etc. and ISO3
"""
import sys, os, json
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mortgage.json')

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
    cs = geom['coordinates']; polys = cs if geom['type'] == 'MultiPolygon' else [cs]
    return [poly[0] for poly in polys]

def flat(r, nd): return [round(v, nd) for p in r for v in p]
def hit(r, box): w, s, e, n = box; return any(w <= p[0] <= e and s <= p[1] <= n for p in r)

def collect(fn, tol, key, box=None, nd=3, minpts=4, keep=None):
    d = json.load(open(os.path.join(SRC, fn))); out = {}
    for f in d['features']:
        k = key(f['properties'])
        if keep and not keep(f['properties']): continue
        for r in rings(f['geometry']):
            if box and not hit(r, box): continue
            q = dp(r, tol)
            if len(q) >= minpts: out.setdefault(k, []).append(flat(q, nd))
    return out

iso = lambda p: p.get('ADM0_A3') or p.get('ISO_A3')
world = collect('ne_50m_admin_0_countries.geojson', 0.08, iso, nd=2, minpts=5)
europe = collect('ne_50m_admin_0_countries.geojson', 0.012, iso, box=(-16, 42, 16, 64), nd=3)
usw = collect('ne_50m_admin_1_states_provinces_lakes.geojson', 0.012, lambda p: p.get('iso_3166_2') or p.get('name'), box=(-128, 28, -108, 46), nd=3,
              keep=lambda p: p.get('adm0_a3') == 'USA')
usw.update(collect('ne_50m_admin_0_countries.geojson', 0.012, iso, box=(-128, 28, -108, 46), nd=3, keep=lambda p: iso(p) == 'MEX'))
json.dump({'source': 'Natural Earth 1:50m (public domain), simplified by build.py', 'world': world, 'europe': europe, 'usw': usw},
          open(OUT, 'w'), separators=(',', ':'))
print(OUT, os.path.getsize(OUT), len(world), sorted(europe)[:40], sorted(usw))
