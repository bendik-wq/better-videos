#!/usr/bin/env python3
"""World kit asset baker. Run once per machine/place; outputs are committed under assets/world/.

  python3 engine/world/bake.py earth                      # globe textures (day, night, clouds, map mask)
  python3 engine/world/bake.py place denver 39.745 -104.99 # regional imagery + DEM + map mask for a place

Sources (all public domain, see assets/CREDITS.md):
  NASA Blue Marble Next Generation (Dec 2004, topo+bathy), NASA Black Marble 2016, NASA cloud composite,
  Natural Earth vectors (via projects/palantir/assets/geo/vectors.json), AWS Terrain Tiles (terrarium).
Downloads are cached in .cache/world/. Nothing is fetched at render time.
"""
import sys, os, json, math, io, urllib.request
import numpy as np
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '.cache', 'world')
OUT = os.path.join(ROOT, 'assets', 'world')
NASA = 'https://eoimages.gsfc.nasa.gov/images/imagerecords'
SRC = {
    'day': f'{NASA}/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
    'night': f'{NASA}/144000/144898/BlackMarble_2016_3km.jpg',
    'clouds': f'{NASA}/57000/57747/cloud_combined_8192.tif',
}
# 500 m BMNG tiles: A..D = 90° of longitude from 180W, 1 = north (90N..0), 2 = south
TILE500 = f'{NASA}/73000/73909/world.topo.bathy.200412.3x21600x21600.{{}}.jpg'
NIGHT500 = f'{NASA}/144000/144898/BlackMarble_2016_{{}}.jpg'  # same A1..D2 tiling, 500 m
TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
VECTORS = os.path.join(ROOT, 'projects', 'palantir', 'assets', 'geo', 'vectors.json')


def fetch(url, name=None):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, name or url.split('/')[-1])
    if not os.path.exists(p):
        print('[bake] fetch', url, flush=True)
        with urllib.request.urlopen(url, timeout=600) as r, open(p + '.part', 'wb') as f:
            f.write(r.read())
        os.rename(p + '.part', p)
    return p


def raster_vectors(layers, bbox, W, H, proj):
    """Rasterise Natural Earth flat [lon,lat,...] arrays: R land(-lakes), G coast/shores/rivers, B borders/states."""
    big = 2  # supersample for smooth lines
    ims = [Image.new('L', (W * big, H * big), 0) for _ in range(3)]
    dr = [ImageDraw.Draw(i) for i in ims]
    def pts(a):
        return [proj(a[i], a[i + 1], W * big, H * big) for i in range(0, len(a) - 1, 2)]
    for poly in layers.get('land', []):
        if len(poly) >= 6: dr[0].polygon(pts(poly), fill=255)
    for poly in layers.get('lakes', []):
        if len(poly) >= 6: dr[0].polygon(pts(poly), fill=0); dr[1].line(pts(poly), fill=200, width=big)
    for ln in layers.get('coast', []): dr[1].line(pts(ln), fill=255, width=big * 2)
    for ln in layers.get('rivers', []): dr[1].line(pts(ln), fill=150, width=big)
    for ln in layers.get('borders', []): dr[2].line(pts(ln), fill=255, width=big * 2)
    for ln in layers.get('states', []): dr[2].line(pts(ln), fill=140, width=big)
    ims = [i.resize((W, H), Image.LANCZOS) for i in ims]
    return Image.merge('RGB', ims)


def earth():
    d = os.path.join(OUT, 'earth'); os.makedirs(d, exist_ok=True)
    W, H = 4096, 2048
    day = Image.open(fetch(SRC['day'])).convert('RGB').resize((W, H), Image.LANCZOS)
    day.save(os.path.join(d, 'day.jpg'), quality=90)
    night = Image.open(fetch(SRC['night'])).convert('L').resize((W, H), Image.LANCZOS)
    night.save(os.path.join(d, 'night.jpg'), quality=90)
    cl = Image.open(fetch(SRC['clouds'])).convert('L').resize((W, H), Image.LANCZOS)
    cl.save(os.path.join(d, 'clouds.jpg'), quality=88)
    v = json.load(open(VECTORS))['world']
    eq = lambda lon, lat, w, h: ((lon + 180) / 360 * w, (90 - lat) / 180 * h)
    raster_vectors(v, None, W, H, eq).save(os.path.join(d, 'map.png'), optimize=True)
    print('[bake] earth ->', d)


def lonlat_to_tile(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def dem(bbox, z, W, H):
    """Terrarium tiles stitched and resampled to an equirectangular grid over bbox (w,s,e,n). Returns metres."""
    w, s, e, n = bbox
    x0, y0 = lonlat_to_tile(w, n, z); x1, y1 = lonlat_to_tile(e, s, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    mosaic = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            p = fetch(TERRARIUM.format(z=z, x=tx, y=ty), f'terrarium-{z}-{tx}-{ty}.png')
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
            el = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
            mosaic[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = el
    lons = np.linspace(w, e, W); lats = np.linspace(n, s, H)
    gx, _ = np.array([lonlat_to_tile(lo, 0, z) for lo in lons]).T
    gy = np.array([lonlat_to_tile(0, la, z)[1] for la in lats])
    px = (gx - tx0) * 256 - 0.5; py = (gy - ty0) * 256 - 0.5
    PX, PY = np.meshgrid(px, py)
    ix = np.clip(np.floor(PX).astype(int), 0, mosaic.shape[1] - 2); iy = np.clip(np.floor(PY).astype(int), 0, mosaic.shape[0] - 2)
    fx = np.clip(PX - ix, 0, 1); fy = np.clip(PY - iy, 0, 1)
    m = mosaic
    out = (m[iy, ix] * (1 - fx) + m[iy, ix + 1] * fx) * (1 - fy) + (m[iy + 1, ix] * (1 - fx) + m[iy + 1, ix + 1] * fx) * fy
    return out


def save_dem(el, path):
    """RGB PNG: (elev + 500 m) * 10 as 16 bit, R = high byte, G = low byte (decimetres)."""
    v = np.clip(np.round((el + 500) * 10), 0, 65535).astype(np.uint32)
    rgb = np.stack([(v >> 8) & 255, v & 255, np.zeros_like(v)], -1).astype(np.uint8)
    Image.fromarray(rgb, 'RGB').save(path, optimize=True)


def place(name, lat, lon):
    d = os.path.join(OUT, 'places', name); os.makedirs(d, exist_ok=True)
    cl = math.cos(math.radians(lat))
    # region: ±2.0° lat (~222 km), lon scaled to the same ground distance
    rlat, rlon = 2.0, 2.0 / cl
    rb = [lon - rlon, lat - rlat, lon + rlon, lat + rlat]
    # BMNG 500 m crop (single tile; places within 2.6° of a tile edge would need two)
    col = 'ABCD'[int((lon + 180) // 90)]; row = '1' if lat >= 0 else '2'
    tlon0 = -180 + 90 * 'ABCD'.index(col); tlat0 = 90 if row == '1' else 0
    t = Image.open(fetch(TILE500.format(col + row)))
    ppd = 21600 / 90
    box = (round((rb[0] - tlon0) * ppd), round((tlat0 - rb[3]) * ppd), round((rb[2] - tlon0) * ppd), round((tlat0 - rb[1]) * ppd))
    t.crop(box).convert('RGB').save(os.path.join(d, 'image.jpg'), quality=90)
    iw, ih = box[2] - box[0], box[3] - box[1]
    Image.open(fetch(NIGHT500.format(col + row))).convert('L').crop(box).save(os.path.join(d, 'night.jpg'), quality=90)
    save_dem(dem(rb, 9, 1024, 1024), os.path.join(d, 'dem-region.png'))
    # local: ±0.2° lat (~44 km box)
    llat, llon = 0.2, 0.2 / cl
    lb = [lon - llon, lat - llat, lon + llon, lat + llat]
    save_dem(dem(lb, 12, 1024, 1024), os.path.join(d, 'dem-local.png'))
    # regional map mask from Natural Earth 10 m (if a palantir region covers it) else 50 m world
    vv = json.load(open(VECTORS))
    layers = vv['world']
    for k, r in vv['regions'].items():
        b = r['bbox']
        if b[0] <= rb[0] and b[1] <= rb[1] and b[2] >= rb[2] and b[3] >= rb[3]: layers = r; break
    eqr = lambda lo, la, w, h: ((lo - rb[0]) / (rb[2] - rb[0]) * w, (rb[3] - la) / (rb[3] - rb[1]) * h)
    raster_vectors(layers, rb, 1024, 1024, eqr).save(os.path.join(d, 'map.png'), optimize=True)
    el0 = float(dem([lon - 0.001, lat - 0.001, lon + 0.001, lat + 0.001], 12, 3, 3)[1, 1])
    meta = {'name': name, 'lat': lat, 'lon': lon, 'elev': round(el0, 1),
            'region': {'bbox': rb, 'image': [iw, ih], 'dem': 'dem-region.png', 'z': 9},
            'local': {'bbox': lb, 'dem': 'dem-local.png', 'z': 12},
            'demEncoding': '(elev_m + 500) * 10 = R*256 + G'}
    json.dump(meta, open(os.path.join(d, 'place.json'), 'w'), indent=1)
    print('[bake] place', name, meta)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'earth': earth()
    elif a and a[0] == 'place': place(a[1], float(a[2]), float(a[3]))
    else: print(__doc__)
