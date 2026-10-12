#!/usr/bin/env python3
"""Bake the real geography for the Strait of Hormuz (episode 3) with engine/imagery/bake.py.

  python3 -I engine/sea/bake_hormuz.py imagery     # nested Sentinel-2 + terrarium set 'hormuz' (4 levels)
  python3 -I engine/sea/bake_hormuz.py arabia      # Arabian Peninsula map base (NASA Blue Marble NG via GIBS + terrarium)
  python3 -I engine/sea/bake_hormuz.py vectors     # coastlines (Natural Earth 10m), TSS lanes (OSM seamarks), labels
  python3 -I engine/sea/bake_hormuz.py all

Output: projects/hormuz/assets/imagery/<set>/ (engine/imagery set format, load with
IM.loadSet(name, '/projects/hormuz/assets/imagery/')) and projects/hormuz/assets/geo/*.json.

Differences from a plain `bake.py <name> <lat> <lon>` run (all done here, bake.py is untouched):
  * Sentinel-2 scenes are chosen per 0.5 degree grid cell (so a 250 km level is fully covered) and from
    the dry winter months (Nov-Mar): summer Gulf scenes are full of dust haze.
  * The outermost level (+-512 km) is NASA Blue Marble Next Generation (public domain, via NASA GIBS WMS),
    colour-matched to the Sentinel-2 levels by bake.match().
Sources and licences: assets/CREDITS.md (Hormuz section).
"""
import sys, os, json, math, io, time, urllib.parse
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'imagery'))
import bake as B  # engine/imagery/bake.py

ROOT = B.ROOT
OUT = os.path.join(ROOT, 'projects', 'hormuz', 'assets', 'imagery')
GEO = os.path.join(ROOT, 'projects', 'hormuz', 'assets', 'geo')
B.OUT = OUT
GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
CENTER = (26.56, 56.45)  # between the Quoin Islands (Musandam) and Larak: the TSS


def s2_scenes_grid(bbox, years=None, max_cloud=3, limit=6):
    """Least-cloudy winter scenes for every 0.5 degree cell of the bbox (deduplicated, cell order)."""
    w, s, e, n = bbox; out, seen = [], set()
    xs = np.arange(w, e + 0.25, 0.5); ys = np.arange(n, s - 0.25, -0.5)
    for y in ys:
        for x in xs:
            cell = [float(x) - 0.05, float(y) - 0.05, float(x) + 0.05, float(y) + 0.05]
            for yr in (2025, 2024):
                body = json.dumps({'collections': ['sentinel-2-l2a'], 'bbox': cell, 'datetime': f'{yr - 1}-11-01T00:00:00Z/{yr}-03-31T00:00:00Z',
                                   'query': {'eo:cloud_cover': {'lt': max_cloud}}, 'limit': limit,
                                   'sortby': [{'field': 'properties.eo:cloud_cover', 'direction': 'asc'}]}).encode()
                feats = json.loads(B.get(B.STAC, data=body, headers={'content-type': 'application/json'}))['features']
                if feats: break
            for f in feats[:2]:
                if f['id'] not in seen: seen.add(f['id']); out.append(f)
    B.log(f'  {len(out)} scenes for {len(xs) * len(ys)} cells')
    return out


def gibs(bbox, W, H, layer='BlueMarble_NextGeneration'):
    """NASA GIBS WMS (EPSG:4326) mosaic, 2048 px requests."""
    w, s, e, n = bbox; out = np.zeros((H, W, 3), np.uint8); S = 2048
    for y0 in range(0, H, S):
        for x0 in range(0, W, S):
            x1, y1 = min(W, x0 + S), min(H, y0 + S)
            bb = (n - y1 * (n - s) / H, w + x0 * (e - w) / W, n - y0 * (n - s) / H, w + x1 * (e - w) / W)
            q = f'{GIBS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS={layer}&STYLES=&CRS=EPSG:4326&BBOX={bb[0]:.6f},{bb[1]:.6f},{bb[2]:.6f},{bb[3]:.6f}&WIDTH={x1 - x0}&HEIGHT={y1 - y0}&FORMAT=image/jpeg'
            out[y0:y1, x0:x1] = np.asarray(Image.open(io.BytesIO(B.get(q))).convert('RGB'))
            B.log(f'  gibs {layer} {x0},{y0} {x1 - x0}x{y1 - y0}')
    return out


def write_level(d, L, bbox, W, H, m, dpp, img, dsrc_mpp, lat, quality=88):
    ld = os.path.join(d, f'L{L}'); os.makedirs(ld, exist_ok=True)
    for ty in range(math.ceil(H / B.TILE)):
        for tx in range(math.ceil(W / B.TILE)):
            Image.fromarray(img[ty * B.TILE:(ty + 1) * B.TILE, tx * B.TILE:(tx + 1) * B.TILE]).save(os.path.join(ld, f'{ty}_{tx}.jpg'), quality=quality, optimize=True)
    dW = min(2048, max(64, round(W * m / dsrc_mpp))); dH = min(2048, max(64, round(H * m / dsrc_mpp)))
    el, dz = B.terrarium(bbox, dW, dH, dsrc_mpp)
    B.save_dem(el, os.path.join(ld, 'dem.png'))
    B.log(f'  L{L} dem {dW}x{dH} {el.min():.0f}..{el.max():.0f} m')
    return {'id': L, 'bbox': bbox, 'size': [W, H], 'mpp': m, 'degPerPx': dpp, 'tiles': [math.ceil(W / B.TILE), math.ceil(H / B.TILE)], 'image': f'L{L}/{{row}}_{{col}}.jpg',
            'dem': {'file': f'L{L}/dem.png', 'size': [dW, dH], 'mpp': (bbox[2] - bbox[0]) * B.M_PER_DEG * math.cos(math.radians(lat)) / dW,
                    'min': round(float(el.min()), 1), 'max': round(float(el.max()), 1), 'terrariumZoom': dz}}, el


def imagery(name='hormuz', lat=CENTER[0], lon=CENTER[1], radius=8000, mpp=10, s2levels=3, step=4):
    B.s2_scenes = s2_scenes_grid
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    meta = {'format': 'bv-imagery/1', 'name': name, 'center': {'lat': lat, 'lon': lon, 'elev': 0.0}, 'crs': 'EPSG:4326 (equal-angle pixels, north up)',
            'tile': B.TILE, 'demEncoding': '(elev_m + 500) * 10 = R*256 + G', 'levels': [], 'sources': {}, 'baked': time.strftime('%Y-%m-%d', time.gmtime())}
    scenes, years = [], set()
    for L in range(s2levels + 1):
        r = radius * step ** L; m = mpp * step ** L
        bbox, W, H, dpp = B.level_grid(lat, lon, r, m)
        B.log(f'level {L}: radius {r / 1000:.0f} km, {m:.0f} m/px, {W}x{H}')
        if L < s2levels:
            img, used = B.s2(bbox, W, H, m); scenes += used; years.update(u['date'][:4] for u in used)
        else:
            img = gibs(bbox, W, H)
        lv, _ = write_level(d, L, bbox, W, H, m, dpp, img, max(m * 3, 30.0), lat)
        if L == s2levels: lv['source'] = 'NASA Blue Marble Next Generation (GIBS)'
        meta['levels'].append(lv)
    meta['sources']['imagery'] = dict(B.CREDIT['s2']); meta['sources']['imagery']['credit'] = 'Contains modified Copernicus Sentinel data ' + ', '.join(sorted(years))
    meta['sources']['imagery']['scenes'] = scenes
    meta['sources']['imageryOuter'] = {'name': 'NASA Blue Marble Next Generation via NASA GIBS', 'licence': 'Public domain (NASA)', 'credit': 'NASA Earth Observatory / GIBS', 'url': GIBS}
    meta['sources']['elevation'] = dict(B.CREDIT['terrarium'])
    meta['attribution'] = f"{meta['sources']['imagery']['credit']}. Blue Marble: NASA. {B.CREDIT['terrarium']['credit']}."
    json.dump(meta, open(os.path.join(d, 'set.json'), 'w'), indent=1)
    B.match(name)
    fill(name)
    B.log('done', name)


def fill(name='hormuz'):
    """Sentinel-2 nodata (black, outside every cloud-free scene) -> the next coarser level, coarsest first."""
    d = os.path.join(OUT, name); meta = json.load(open(os.path.join(d, 'set.json'))); lv = meta['levels']
    for L in range(len(lv) - 2, -1, -1):
        a, b = lv[L], lv[L + 1]; img = B.load_level(d, a); coarse = B.load_level(d, b)
        W, H = a['size']; w, s, e, n = a['bbox']; cw, cs, ce, cn = b['bbox']; CW, CH = b['size']
        x0 = (w - cw) / (ce - cw) * CW; x1 = (e - cw) / (ce - cw) * CW; y0 = (cn - n) / (cn - cs) * CH; y1 = (cn - s) / (cn - cs) * CH
        sub = Image.fromarray(coarse).crop((int(x0), int(y0), int(math.ceil(x1)), int(math.ceil(y1)))).resize((W, H), Image.BILINEAR)
        sub = np.asarray(sub)
        bad = img.astype(np.int32).sum(-1) < 12
        # grow the mask a little (JPEG fringes at the nodata edge)
        from PIL import ImageFilter
        m = np.asarray(Image.fromarray((bad * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        if not m.any(): continue
        out = img.copy(); out[m] = sub[m]
        for ty in range(a['tiles'][1]):
            for tx in range(a['tiles'][0]):
                Image.fromarray(out[ty * B.TILE:(ty + 1) * B.TILE, tx * B.TILE:(tx + 1) * B.TILE]).save(os.path.join(d, a['image'].format(row=ty, col=tx)), quality=88, optimize=True)
        B.log(f'fill L{L}: {m.mean() * 100:.1f}% from L{L + 1}')


def arabia(name='arabia', bbox=(34.0, 14.0, 62.0, 33.0), W=4096):
    """Map base for the region (pipelines, flows): Blue Marble NG + terrarium, one level."""
    w, s, e, n = bbox; H = round(W * (n - s) / (e - w)); dpp = (e - w) / W
    lat = (s + n) / 2; lon = (w + e) / 2
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    img = gibs(list(bbox), W, H)
    m = dpp * B.M_PER_DEG * math.cos(math.radians(lat))
    lv, _ = write_level(d, 0, list(bbox), W, H, m, dpp, img, m * 2, lat)
    relief = gibs(list(bbox), W // 2, H // 2, 'BlueMarble_ShadedRelief_Bathymetry')
    Image.fromarray(relief).save(os.path.join(d, 'relief.jpg'), quality=88)
    meta = {'format': 'bv-imagery/1', 'name': name, 'center': {'lat': lat, 'lon': lon, 'elev': 0.0}, 'crs': 'EPSG:4326 (equal-angle pixels, north up)', 'tile': B.TILE,
            'demEncoding': '(elev_m + 500) * 10 = R*256 + G', 'levels': [lv], 'relief': 'relief.jpg',
            'sources': {'imagery': {'name': 'NASA Blue Marble Next Generation (+ Shaded Relief and Bathymetry) via NASA GIBS', 'licence': 'Public domain (NASA)', 'credit': 'NASA Earth Observatory / GIBS', 'url': GIBS},
                        'elevation': dict(B.CREDIT['terrarium'])},
            'attribution': f"Blue Marble: NASA Earth Observatory. {B.CREDIT['terrarium']['credit']}.", 'baked': time.strftime('%Y-%m-%d', time.gmtime())}
    json.dump(meta, open(os.path.join(d, 'set.json'), 'w'), indent=1)
    B.log('done', name)


# ---------------------------------------------------------------- vectors
# Natural Earth 1:10m (public domain) coastlines + countries, OSM seamarks for the TSS (ODbL), and
# hand-entered points (terminals, cities, pipeline end points) with their sources in SOURCES.md.
CACHE = os.path.join(ROOT, '.cache', 'hormuz')
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/{}.geojson'
OVERPASS = 'https://overpass-api.de/api/interpreter'
PLACES = {  # lat, lon (WGS84), checked against OSM / Wikipedia coordinates
    'Bandar Abbas': (27.183, 56.267), 'Qeshm': (26.958, 56.27), 'Qeshm Island': (26.78, 55.85), 'Larak': (26.857, 56.356), 'Hormuz Island': (27.063, 56.46),
    'Khasab': (26.18, 56.248), 'Kumzar': (26.336, 56.405), 'Musandam': (26.2, 56.25), 'Didamar (Quoin Is.)': (26.43, 56.52),
    'Greater Tunb': (26.265, 55.307), 'Abu Musa': (25.874, 55.034), 'Fujairah': (25.128, 56.336), 'Ras Al Khaimah': (25.79, 55.94),
    'Dubai': (25.204, 55.27), 'Abu Dhabi': (24.466, 54.366), 'Doha': (25.285, 51.531), 'Muscat': (23.588, 58.383), 'Jask': (25.645, 57.774),
    'Ras Tanura': (26.644, 50.159), 'Abqaiq': (25.937, 49.681), 'Yanbu': (24.089, 38.064), 'Habshan': (23.833, 53.65), 'Kharg Island': (29.245, 50.315),
    'Mina al-Ahmadi': (29.063, 48.148), 'Basra Oil Terminal': (29.683, 48.81), 'Ras Laffan': (25.905, 51.6), 'Kuwait City': (29.376, 47.977),
    'Riyadh': (24.713, 46.675), 'Tehran': (35.689, 51.389), 'Goreh': (29.9, 50.4),
}
# pipelines (schematic routes through published end points and pump stations)
PIPELINES = {
    'East-West (Petroline)': {'cap': '5 million b/d (7 after 2019 conversion, per Saudi Aramco)', 'path': [(25.937, 49.681), (25.4, 47.2), (24.9, 44.7), (24.6, 42.0), (24.3, 39.6), (24.089, 38.064)]},
    'Habshan-Fujairah (ADCOP)': {'cap': '1.5 million b/d', 'path': [(23.833, 53.65), (24.3, 54.6), (24.75, 55.6), (25.05, 56.05), (25.128, 56.336)]},
    'Goreh-Jask': {'cap': '1 million b/d (design)', 'path': [(29.9, 50.4), (28.9, 52.2), (27.9, 54.4), (27.0, 56.3), (25.645, 57.774)]},
}

def dp(pts, tol):
    """Douglas-Peucker on (lon, lat) lists."""
    if len(pts) < 3: return pts
    a, b = np.array(pts[0]), np.array(pts[-1]); P = np.array(pts); ab = b - a; L = np.hypot(*ab)
    d = np.abs(np.cross(ab, P - a)) / L if L > 0 else np.hypot(*(P - a).T)
    i = int(np.argmax(d))
    if d[i] > tol: return dp(pts[:i + 1], tol)[:-1] + dp(pts[i:], tol)
    return [pts[0], pts[-1]]

def clip_lines(coords, bbox):
    w, s, e, n = bbox; out, cur = [], []
    for lo, la in coords:
        if w <= lo <= e and s <= la <= n: cur.append([round(lo, 4), round(la, 4)])
        elif cur: out.append(cur); cur = []
    if cur: out.append(cur)
    return [c for c in out if len(c) > 1]

def vectors(bbox=(30.0, 10.0, 64.0, 36.0), fine=(54.5, 25.0, 58.5, 27.8)):
    os.makedirs(GEO, exist_ok=True)
    load = lambda n: json.load(open(os.path.join(CACHE, n + '.geojson'))) if os.path.exists(os.path.join(CACHE, n + '.geojson')) else json.loads(B.get(NE.format(n)))
    out = {'bbox': bbox, 'coast': [], 'coastFine': [], 'countries': [], 'tss': [], 'places': PLACES, 'pipelines': PIPELINES,
           'sources': {'coast': 'Natural Earth 1:10m coastline + admin 0 countries (public domain), naturalearthdata.com',
                       'tss': 'OpenStreetMap seamark:type=separation_* ways (c) OpenStreetMap contributors, ODbL',
                       'places': 'hand-entered coordinates (OSM / Wikipedia)', 'pipelines': 'schematic routes through published end points (EIA World Oil Transit Chokepoints; operators)'}}
    for f in load('ne_10m_coastline')['features']:
        g = f['geometry']; lines = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for l in lines:
            for c in clip_lines(l, bbox): out['coast'].append(dp(c, 0.01))
            for c in clip_lines(l, fine): out['coastFine'].append(dp(c, 0.0015))
    for f in load('ne_10m_admin_0_countries')['features']:
        p = f['properties']; g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        keep = []
        for poly in polys:
            ring = poly[0]; xs = [q[0] for q in ring]; ys = [q[1] for q in ring]
            if max(xs) < bbox[0] or min(xs) > bbox[2] or max(ys) < bbox[1] or min(ys) > bbox[3]: continue
            r2 = dp([[round(a, 3), round(b, 3)] for a, b in ring], 0.02)
            if len(r2) > 3: keep.append(r2)
        if keep: out['countries'].append({'name': p.get('NAME_EN') or p.get('NAME'), 'iso': p.get('ISO_A3'), 'label': [p.get('LABEL_X'), p.get('LABEL_Y')], 'polys': keep})
    tss = os.path.join(CACHE, 'osm-tss.json')
    if not os.path.exists(tss):
        q = '[out:json][timeout:90];way["seamark:type"~"separation"](25.8,55.8,27.2,57.6);out geom;'
        open(tss, 'wb').write(B.get(OVERPASS, data=urllib.parse.urlencode({'data': q}).encode()))
    for e in json.load(open(tss))['elements']:
        out['tss'].append({'osm': e['id'], 'type': e['tags'].get('seamark:type'), 'path': [[round(g['lon'], 5), round(g['lat'], 5)] for g in e['geometry']]})
    json.dump(out, open(os.path.join(GEO, 'vectors.json'), 'w'), separators=(',', ':'))
    B.log('vectors', len(out['coast']), 'coast lines', len(out['countries']), 'countries', len(out['tss']), 'tss ways', os.path.getsize(os.path.join(GEO, 'vectors.json')) // 1024, 'KB')


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what in ('imagery', 'all'): imagery()
    if what == 'fill': fill()
    if what in ('arabia', 'all'): arabia()
    if what in ('vectors', 'all'): vectors()
