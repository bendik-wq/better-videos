#!/usr/bin/env python3
"""Build projects/palomares/assets/geo/almeria.json + almeria-relief.png for the `map` set's 'coast' mode.

  python3 -I projects/palomares/assets/geo/build_coast.py <natural-earth geojson dir> <emodnet grid.json>

Inputs
  ne_10m_land.geojson (Natural Earth 1:10m, public domain): the coastline (clipped to BOX, light Douglas-Peucker).
  grid.json: EMODnet Bathymetry DTM (CC BY 4.0, attribution "EMODnet Bathymetry Consortium") sampled every 0.002 deg of
    latitude on 241 columns from 2.05 W to 1.45 W, 37.02-37.46 N, through the public depth_profile REST endpoint
    (rest.emodnet-bathymetry.eu). Keys are latitudes, values metres (negative = depth, positive = land elevation).
    The DTM's own coast is ~1 km off at the Almanzora mouth, so it is used only for OFFSHORE depth contours and a faint
    land relief (hillshade) clipped to the Natural Earth land; the coastline itself is Natural Earth.
Outputs (rings/lines are flat [lon, lat, ...] arrays)
  land      Natural Earth 10m land rings clipped to BOX
  depth     { '500': [lines], '1000': ..., '2500': ... }  isobaths in FEET (500-ft steps; 2,500 ft = 762 m), from EMODnet
  relief    { box: [W, S, E, N] } for almeria-relief.png (land hillshade, grey with alpha; sea transparent)
"""
import sys, os, json, math
import numpy as np
import contourpy
from PIL import Image

NE, GRID = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
BOX = (-2.05, 37.02, -1.45, 37.46)  # W S E N (the EMODnet grid extent)

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

def clip(poly, box):
    """Sutherland-Hodgman clip of a closed ring to an axis-aligned box."""
    W, S, E, N = box
    def cut(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a): out.append(inter(a, b))
        return out
    def ix(x0):
        return lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / ((b[0] - a[0]) or 1e-12))
    def iy(y0):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / ((b[1] - a[1]) or 1e-12), y0)
    p = poly
    for inside, inter in ((lambda q: q[0] >= W, ix(W)), (lambda q: q[0] <= E, ix(E)), (lambda q: q[1] >= S, iy(S)), (lambda q: q[1] <= N, iy(N))):
        if not p: break
        p = cut(p, inside, inter)
    return p

flat = lambda r, nd=4: [round(v, nd) for p in r for v in p]

# ---- land (Natural Earth 10m)
PAD = 0.15
CBOX = (BOX[0] - PAD, BOX[1] - PAD, BOX[2] + PAD, BOX[3] + PAD)
land = []
for f in json.load(open(os.path.join(NE, 'ne_10m_land.geojson')))['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        r = poly[0]
        if not any(CBOX[0] <= x <= CBOX[2] and CBOX[1] <= y <= CBOX[3] for x, y in r): continue
        c = clip([tuple(p) for p in r], CBOX)
        if len(c) >= 4: land.append(flat(dp(c, 0.0004)))

# ---- EMODnet grid
d = json.load(open(GRID))
keys = sorted(d, key=float, reverse=True)  # north -> south
A = np.array([[np.nan if v is None else float(v) for v in d[k]] for k in keys])
lats = np.array([float(k) for k in keys]); lons = np.linspace(BOX[0], BOX[2], A.shape[1])

# isobaths in feet, offshore only (the DTM coast is not trusted): drop line pieces shallower than ~120 m from shore
gen = contourpy.contour_generator(lons, lats, A, line_type='Separate')
depth = {}
for ft in (500, 1000, 1500, 2000, 2500):
    m = -ft * 0.3048
    lines = []
    for ln in gen.lines(m):
        pts = [tuple(p) for p in ln]
        q = dp(pts, 0.0006)
        if len(q) >= 3: lines.append(flat(q))
    depth[str(ft)] = lines

# ---- relief: hillshade of land elevation, light from the north-west, grey + alpha (sea transparent)
Z = np.nan_to_num(A, nan=0.0)
Zl = np.where(Z > 0, Z, 0.0)
dyk = 0.002 * 111.2e3; dxk = (lons[1] - lons[0]) * 111.2e3 * math.cos(math.radians(37.25))
gy, gx = np.gradient(Zl, dyk, dxk)  # rows go north -> south, so +gy points south
slope = np.arctan(np.hypot(gx, gy) * 2.2)
aspect = np.arctan2(-gy, gx)
az, alt = math.radians(315), math.radians(42)
hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)  # 0..1, 1 = lit
shade = np.clip(1 - hs, 0, 1)  # 0 lit .. 1 dark
alpha = np.clip(shade * 1.25 - 0.18, 0, 1) * np.clip(Zl / 25.0, 0, 1)
img = np.zeros((A.shape[0], A.shape[1], 2), dtype=np.uint8)
img[..., 0] = 84; img[..., 1] = (alpha * 255).astype(np.uint8)  # grey + alpha
Image.fromarray(img, 'LA').resize((A.shape[1] * 2, A.shape[0] * 2), Image.BICUBIC).save(os.path.join(HERE, 'almeria-relief.png'), optimize=True)

out = {
    'source': 'Coastline: Natural Earth 1:10m land (public domain). Isobaths (feet) and relief: EMODnet Bathymetry DTM (CC BY 4.0, EMODnet Bathymetry Consortium), sampled via its REST API; isobaths offshore only.',
    'box': BOX, 'land': land, 'depth': depth, 'relief': {'box': [float(lons[0]), float(lats[-1]), float(lons[-1]), float(lats[0])], 'file': 'almeria-relief.png'},
}
json.dump(out, open(os.path.join(HERE, 'almeria.json'), 'w'), separators=(',', ':'))
print('almeria.json', os.path.getsize(os.path.join(HERE, 'almeria.json')), 'bytes;', len(land), 'land rings;', {k: len(v) for k, v in depth.items()})
