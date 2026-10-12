#!/usr/bin/env python3
"""Imagery baker: real aerial / satellite imagery + elevation for any lat/lon, as a nested, tiled terrain set.

  python3 engine/imagery/bake.py <name> <lat> <lon> [--radius 1500] [--levels 4] [--source auto|naip|s2]
                                 [--mpp 0.6] [--dem auto|3dep|terrarium] [--year 2023] [--quality 88]
  python3 engine/imagery/bake.py match <name>            # (re)run the level colour match only
  python3 engine/imagery/bake.py pentagon 38.8710 -77.0559 --radius 1200
  python3 engine/imagery/bake.py hoover 36.0160 -114.7377 --radius 2500
  python3 engine/imagery/bake.py matterhorn 45.9763 7.6586 --source s2

Output: assets/imagery/<name>/set.json + L<i>/<row>_<col>.jpg tiles + L<i>/dem.png per level.
Format: docs/assets/imagery.md. Runtime: engine/imagery/index.js (IM.loadSet, IM.terrain).

Sources (verified licences, see docs/assets/imagery.md and assets/CREDITS.md):
  US      USGS NAIP orthoimagery (USDA FPAC, public domain) via the USGS National Map NAIP ImageServer
          https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer  (exportImage)
          USGS 3DEP bare-earth DEM (public domain) via
          https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer   (exportImage, F32)
  World   Copernicus Sentinel-2 L2A true-colour (TCI) COGs on AWS (sentinel-cogs, Element 84 Earth Search STAC),
          free and open under the Copernicus data licence; credit "Contains modified Copernicus Sentinel data <year>".
          (EOX s2cloudless is CC BY-NC-SA and is deliberately NOT used.)
          Elevation: AWS Terrain Tiles (Mapzen terrarium; SRTM/GMTED/ETOPO1/EU-DEM etc., attribution required).
Downloads are cached in .cache/imagery/. Nothing is fetched at render time.
"""
import sys, os, json, math, io, time, hashlib, argparse, urllib.request, urllib.parse
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tiff

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '.cache', 'imagery')
OUT = os.path.join(ROOT, 'assets', 'imagery')
NAIP = 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/exportImage'
DEP = 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage'
STAC = 'https://earth-search.aws.element84.com/v1/search'
TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
UA = {'User-Agent': 'better-videos-imagery/1 (documentary renderer; contact via repo)'}
M_PER_DEG = 111320.0
TILE = 1024

CREDIT = {
    'naip': {'name': 'USDA NAIP orthoimagery via USGS The National Map', 'licence': 'Public domain (US Government work)',
             'credit': 'Imagery: USDA Farm Production and Conservation, NAIP, via USGS The National Map',
             'url': 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer'},
    '3dep': {'name': 'USGS 3D Elevation Program (3DEP) bare-earth DEM', 'licence': 'Public domain (US Government work)',
             'credit': 'Elevation: USGS 3D Elevation Program', 'url': 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer'},
    's2': {'name': 'Copernicus Sentinel-2 L2A true colour (TCI), AWS Open Data / Element 84 Earth Search', 'licence': 'Copernicus Sentinel data licence: free, full and open; attribution required',
           'credit': 'Contains modified Copernicus Sentinel data {year}', 'url': 'https://registry.opendata.aws/sentinel-2-l2a-cogs/'},
    'terrarium': {'name': 'AWS Terrain Tiles (Mapzen terrarium)', 'licence': 'Free to use with attribution of the underlying sources (SRTM and GMTED2010 public domain, ETOPO1 public domain, EU-DEM, etc.)',
                  'credit': 'Elevation: Mapzen Terrain Tiles (SRTM, GMTED2010, ETOPO1 and others)', 'url': 'https://github.com/tilezen/joerd/blob/master/docs/attribution.md'},
}


def log(*a): print('[imagery]', *a, flush=True)


def get(url, data=None, headers=None, cache=True, tries=5):
    """HTTP GET/POST with a content-addressed cache and retries."""
    key = hashlib.sha1((url + (data.decode() if data else '')).encode()).hexdigest()[:20]
    p = os.path.join(CACHE, 'http', key)
    if cache and os.path.exists(p): return open(p, 'rb').read()
    os.makedirs(os.path.dirname(p), exist_ok=True)
    for k in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=300) as r: b = r.read()
            if cache: open(p + '.part', 'wb').write(b); os.replace(p + '.part', p)
            return b
        except Exception as e:
            if k == tries - 1: raise
            log('retry', k + 1, e); time.sleep(2 + 3 * k)


# ---------------------------------------------------------------- geometry
def level_grid(lat, lon, radius, mpp):
    """Equal-angle (EPSG:4326) grid: square pixels in degrees. Returns bbox [w,s,e,n], W, H, deg/px."""
    dpp = mpp / M_PER_DEG
    dlat = radius / M_PER_DEG; dlon = radius / (M_PER_DEG * math.cos(math.radians(lat)))
    H = int(math.ceil(2 * dlat / dpp)); W = int(math.ceil(2 * dlon / dpp))
    bbox = [lon - W * dpp / 2, lat - H * dpp / 2, lon + W * dpp / 2, lat + H * dpp / 2]
    return bbox, W, H, dpp


def utm_forward(lat, lon, zone, south=False):
    """WGS84 -> UTM easting/northing (numpy, Krueger series to n^3; mm accuracy)."""
    a, f = 6378137.0, 1 / 298.257223563; k0 = 0.9996
    n = f / (2 - f); A = a / (1 + n) * (1 + n * n / 4 + n ** 4 / 64)
    al = [n / 2 - 2 * n * n / 3 + 5 * n ** 3 / 16, 13 * n * n / 48 - 3 * n ** 3 / 5, 61 * n ** 3 / 240]
    phi = np.radians(lat); lam = np.radians(lon) - math.radians(zone * 6 - 183)
    e2 = 2 * math.sqrt(n) / (1 + n)
    t = np.sinh(np.arctanh(np.sin(phi)) - e2 * np.arctanh(e2 * np.sin(phi)))
    xi = np.arctan2(t, np.cos(lam)); eta = np.arctanh(np.sin(lam) / np.sqrt(1 + t * t))
    E = eta.copy(); N = xi.copy()
    for j in range(3):
        E += al[j] * np.cos(2 * (j + 1) * xi) * np.sinh(2 * (j + 1) * eta)
        N += al[j] * np.sin(2 * (j + 1) * xi) * np.cosh(2 * (j + 1) * eta)
    return 500000 + k0 * A * E, (10000000 if south else 0) + k0 * A * N


def is_us(lat, lon):
    boxes = [(-125, 24.3, -66.9, 49.5), (-170, 51, -129, 71.5), (-161, 18.8, -154.7, 22.4), (-67.3, 17.8, -65.2, 18.6)]
    return any(w <= lon <= e and s <= lat <= n for w, s, e, n in boxes)


# ---------------------------------------------------------------- USGS ImageServer (NAIP, 3DEP)
def arcgis_export(base, bbox, W, H, fmt, extra):
    """exportImage in EPSG:4326, split into <=4000 px requests; returns the mosaic as a numpy array."""
    MAXP = 4000
    nx, ny = math.ceil(W / MAXP), math.ceil(H / MAXP)
    w, s, e, n = bbox; dx = (e - w) / W; dy = (n - s) / H
    out = None
    for j in range(ny):
        for i in range(nx):
            x0, x1 = i * W // nx, (i + 1) * W // nx; y0, y1 = j * H // ny, (j + 1) * H // ny
            bb = [w + x0 * dx, n - y1 * dy, w + x1 * dx, n - y0 * dy]
            q = {'bbox': ','.join(f'{v:.9f}' for v in bb), 'bboxSR': 4326, 'imageSR': 4326, 'size': f'{x1 - x0},{y1 - y0}', 'format': fmt, 'f': 'json', **extra}
            meta = json.loads(get(base + '?' + urllib.parse.urlencode(q)))
            if 'href' not in meta: raise RuntimeError(f'exportImage failed: {meta}')
            ext = meta['extent']
            if abs(ext['xmin'] - bb[0]) > dx * 0.6 or abs(ext['ymax'] - bb[3]) > dy * 0.6 or meta['width'] != x1 - x0 or meta['height'] != y1 - y0:
                log('warning: server adjusted the extent', ext, meta['width'], meta['height'])
            b = get(meta['href'], cache=False)
            if fmt == 'tiff':
                p = os.path.join(CACHE, 'tmp.tif'); open(p, 'wb').write(b); a = tiff.Tiff(p).read()[..., 0].astype(np.float32)
            else:
                a = np.asarray(Image.open(io.BytesIO(b)).convert('RGB'))
            if out is None: out = np.zeros((H, W) + a.shape[2:], a.dtype)
            out[y0:y1, x0:x1] = a[:y1 - y0, :x1 - x0]
            log(f'  {base.split("/")[-3]} {i + 1 + j * nx}/{nx * ny} {x1 - x0}x{y1 - y0}')
    return out


def naip(bbox, W, H, quality=92):
    return arcgis_export(NAIP, bbox, W, H, 'jpg', {'bandIds': '0,1,2', 'compressionQuality': quality, 'interpolation': 'RSP_BilinearInterpolation'})


def dep(bbox, W, H):
    a = arcgis_export(DEP, bbox, W, H, 'tiff', {'pixelType': 'F32', 'compression': 'None', 'interpolation': 'RSP_BilinearInterpolation', 'noDataInterpretation': 'esriNoDataMatchAny'})
    bad = ~np.isfinite(a) | (a < -1000) | (a > 9000)
    if bad.any(): a[bad] = np.median(a[~bad]) if (~bad).any() else 0
    return a


# ---------------------------------------------------------------- Sentinel-2 L2A (Earth Search STAC + COG windows)
def s2_scenes(bbox, years=None, max_cloud=8, limit=12):
    feats = []
    y1 = years or time.gmtime().tm_year - 1
    for yr in [y1, y1 - 1, y1 - 2]:
        body = json.dumps({'collections': ['sentinel-2-l2a'], 'bbox': bbox, 'datetime': f'{yr}-04-15T00:00:00Z/{yr}-10-15T00:00:00Z',
                           'query': {'eo:cloud_cover': {'lt': max_cloud}}, 'limit': limit,
                           'sortby': [{'field': 'properties.eo:cloud_cover', 'direction': 'asc'}]}).encode()
        feats += json.loads(get(STAC, data=body, headers={'content-type': 'application/json'}))['features']
        if len(feats) >= 4: break
    return feats


def s2(bbox, W, H, mpp, year=None):
    """Mosaic the least-cloudy summer scenes over the grid; each pixel from the first scene that covers it."""
    w, s, e, n = bbox
    lons = w + (np.arange(W) + 0.5) * (e - w) / W; lats = n - (np.arange(H) + 0.5) * (n - s) / H
    LON, LAT = np.meshgrid(lons, lats)
    out = np.zeros((H, W, 3), np.float32); have = np.zeros((H, W), bool); used = []
    for f in s2_scenes(bbox, year):
        if have.all(): break
        epsg = f['properties'].get('proj:epsg') or int(str(f['properties'].get('proj:code', '0')).split(':')[-1])
        zone, south = epsg % 100, epsg // 100 == 327
        T = tiff.Tiff(f['assets']['visual']['href']); G = T.geo()
        lev = max([l for l in range(len(T.ifds)) if 10 * 2 ** l <= max(mpp, 10) * 1.01] or [0])
        I = T.info(lev); sc = G['sx'] * T.info(0)['w'] / I['w']
        E, N = utm_forward(LAT, LON, zone, south)
        px = (E - G['x0']) / sc - 0.5; py = (G['y0'] - N) / sc - 0.5
        need = ~have & (px > 0) & (py > 0) & (px < I['w'] - 1) & (py < I['h'] - 1)
        if not need.any(): continue
        x0, x1 = int(px[need].min()), int(px[need].max()) + 2; y0, y1 = int(py[need].min()), int(py[need].max()) + 2
        log(f'  s2 {f["id"]} cloud {f["properties"]["eo:cloud_cover"]:.2f}% level {lev} window {x1 - x0}x{y1 - y0}')
        win = T.window(x0, y0, x1, y1, lev).astype(np.float32)
        u = px[need] - x0; v = py[need] - y0; ix = np.clip(u.astype(int), 0, win.shape[1] - 2); iy = np.clip(v.astype(int), 0, win.shape[0] - 2)
        fx = (u - ix)[:, None]; fy = (v - iy)[:, None]
        val = (win[iy, ix] * (1 - fx) + win[iy, ix + 1] * fx) * (1 - fy) + (win[iy + 1, ix] * (1 - fx) + win[iy + 1, ix + 1] * fx) * fy
        ok = val.min(1) > 0  # TCI nodata = 0
        idx = np.flatnonzero(need.ravel())[ok]
        out.reshape(-1, 3)[idx] = val[ok]; have.ravel()[idx] = True
        used.append({'id': f['id'], 'date': f['properties']['datetime'][:10], 'cloud': f['properties']['eo:cloud_cover']})
    if not have.all(): log(f'warning: {(~have).mean() * 100:.1f}% of pixels not covered by cloud-free scenes')
    # TCI is mapped 0..255 over reflectance 0..~0.28 and looks dark and flat; a gentle normalising curve
    o = np.clip(out / 255.0, 0, 1)
    o = np.power(o, 0.85)
    return (o * 255).astype(np.uint8), used


# ---------------------------------------------------------------- terrarium DEM (world)
def lonlat_to_tile(lon, lat, z):
    k = 2 ** z
    return (lon + 180) / 360 * k, (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * k


def terrarium(bbox, W, H, mpp):
    w, s, e, n = bbox; lat = (s + n) / 2
    z = int(max(0, min(14, round(math.log2(156543.0 * math.cos(math.radians(lat)) / max(mpp, 5))))))
    x0, y0 = lonlat_to_tile(w, n, z); x1, y1 = lonlat_to_tile(e, s, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    mos = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            a = np.asarray(Image.open(io.BytesIO(get(TERRARIUM.format(z=z, x=tx, y=ty)))).convert('RGB')).astype(np.float32)
            mos[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    lons = w + (np.arange(W) + 0.5) * (e - w) / W; lats = n - (np.arange(H) + 0.5) * (n - s) / H
    gx = np.array([lonlat_to_tile(lo, 0, z)[0] for lo in lons]); gy = np.array([lonlat_to_tile(0, la, z)[1] for la in lats])
    PX, PY = np.meshgrid((gx - tx0) * 256 - 0.5, (gy - ty0) * 256 - 0.5)
    ix = np.clip(PX.astype(int), 0, mos.shape[1] - 2); iy = np.clip(PY.astype(int), 0, mos.shape[0] - 2)
    fx = np.clip(PX - ix, 0, 1); fy = np.clip(PY - iy, 0, 1)
    return (mos[iy, ix] * (1 - fx) + mos[iy, ix + 1] * fx) * (1 - fy) + (mos[iy + 1, ix] * (1 - fx) + mos[iy + 1, ix + 1] * fx) * fy, z


def save_dem(el, path):
    """RGB PNG, same encoding as engine/world: (elev_m + 500) * 10 = R*256 + G (decimetres, 0..6053 m)."""
    v = np.clip(np.round((el + 500) * 10), 0, 65535).astype(np.uint32)
    Image.fromarray(np.stack([(v >> 8) & 255, v & 255, np.zeros_like(v)], -1).astype(np.uint8), 'RGB').save(path, optimize=True)


# ---------------------------------------------------------------- bake
def bake(name, lat, lon, radius=1500, levels=4, source='auto', mpp=None, demsrc='auto', year=None, quality=88, step=4):
    us = is_us(lat, lon)
    src = source if source != 'auto' else ('naip' if us else 's2')
    dsrc = demsrc if demsrc != 'auto' else ('3dep' if us else 'terrarium')
    mpp0 = mpp or (0.6 if src == 'naip' else 10.0)
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    meta = {'format': 'bv-imagery/1', 'name': name, 'center': {'lat': lat, 'lon': lon}, 'crs': 'EPSG:4326 (equal-angle pixels, north up)',
            'tile': TILE, 'demEncoding': '(elev_m + 500) * 10 = R*256 + G', 'levels': [], 'sources': {}, 'baked': time.strftime('%Y-%m-%d', time.gmtime())}
    elev0 = None; years = set(); scenes = []
    for L in range(levels):
        r = radius * step ** L; m = mpp0 * step ** L
        bbox, W, H, dpp = level_grid(lat, lon, r, m)
        if W * H > 6000 * 6000: raise SystemExit(f'level {L}: {W}x{H} px is too big; lower --radius or raise --mpp')
        log(f'level {L}: radius {r:.0f} m, {m:.2f} m/px, {W}x{H} px')
        ld = os.path.join(d, f'L{L}'); os.makedirs(ld, exist_ok=True)
        if src == 'naip': img = naip(bbox, W, H)
        else:
            img, used = s2(bbox, W, H, m, year); scenes += used; years.update(u['date'][:4] for u in used)
        tiles = []
        for ty in range(math.ceil(H / TILE)):
            for tx in range(math.ceil(W / TILE)):
                Image.fromarray(img[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE]).save(os.path.join(ld, f'{ty}_{tx}.jpg'), quality=quality, optimize=True, progressive=False)
        # DEM: ~3x coarser than the imagery, at most 2048 px on a side, never finer than the source
        dm = max(m * 3, 1.0 if dsrc == '3dep' else 10.0); dW = min(2048, max(64, round(W * m / dm))); dH = min(2048, max(64, round(H * m / dm)))
        if dsrc == '3dep': el = dep(bbox, dW, dH); dz = None
        else: el, dz = terrarium(bbox, dW, dH, dm)
        save_dem(el, os.path.join(ld, 'dem.png'))
        if elev0 is None: elev0 = float(el[dH // 2, dW // 2])
        lv = {'id': L, 'bbox': bbox, 'size': [W, H], 'mpp': m, 'degPerPx': dpp, 'tiles': [math.ceil(W / TILE), math.ceil(H / TILE)], 'image': f'L{L}/{{row}}_{{col}}.jpg',
              'dem': {'file': f'L{L}/dem.png', 'size': [dW, dH], 'mpp': (bbox[2] - bbox[0]) * M_PER_DEG * math.cos(math.radians(lat)) / dW,
                      'min': round(float(el.min()), 1), 'max': round(float(el.max()), 1)}}
        if dz is not None: lv['dem']['terrariumZoom'] = dz
        meta['levels'].append(lv)
        log(f'  dem {dW}x{dH}, {el.min():.0f}..{el.max():.0f} m')
    meta['center']['elev'] = round(elev0, 1)
    meta['sources']['imagery'] = dict(CREDIT['naip' if src == 'naip' else 's2'])
    if src == 's2':
        y = ', '.join(sorted(years)) or str(time.gmtime().tm_year - 1)
        meta['sources']['imagery']['credit'] = meta['sources']['imagery']['credit'].format(year=y); meta['sources']['imagery']['scenes'] = scenes
    meta['sources']['elevation'] = dict(CREDIT[dsrc])
    meta['attribution'] = f"{meta['sources']['imagery']['credit']}. {meta['sources']['elevation']['credit']}."
    json.dump(meta, open(os.path.join(d, 'set.json'), 'w'), indent=1)
    if levels > 1: match(name, quality)
    sz = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(d) for f in fs)
    log(f'done -> {os.path.relpath(d, ROOT)} ({sz / 1e6:.1f} MB)')
    return meta


def load_level(d, lv):
    W, H = lv['size']; img = np.zeros((H, W, 3), np.uint8)
    for ty in range(lv['tiles'][1]):
        for tx in range(lv['tiles'][0]):
            a = np.asarray(Image.open(os.path.join(d, lv['image'].format(row=ty, col=tx))).convert('RGB'))
            img[ty * TILE:ty * TILE + a.shape[0], tx * TILE:tx * TILE + a.shape[1]] = a
    return img


def match(name, quality=88):
    """Colour-match each coarser level to the finer one inside their overlap (per-channel gain + offset).
    Coarse service overviews often come from other years or processing; this removes the visible step."""
    d = os.path.join(OUT, name); meta = json.load(open(os.path.join(d, 'set.json')))
    lv = meta['levels']; fine = load_level(d, lv[0]); out = []
    for L in range(1, len(lv)):
        a, b = lv[L - 1], lv[L]; coarse = load_level(d, b).astype(np.float32)
        W, H = b['size']; w, s, e, n = b['bbox']
        # where the finer level sits inside this one, in this level's pixels
        x0 = (a['bbox'][0] - w) / (e - w) * W; x1 = (a['bbox'][2] - w) / (e - w) * W
        y0 = (n - a['bbox'][3]) / (n - s) * H; y1 = (n - a['bbox'][1]) / (n - s) * H
        X0, X1, Y0, Y1 = int(math.ceil(x0)), int(x1), int(math.ceil(y0)), int(y1)
        small = np.asarray(Image.fromarray(fine).resize((max(1, round(x1 - x0)), max(1, round(y1 - y0))), Image.BILINEAR)).astype(np.float32)
        sub = coarse[Y0:Y0 + small.shape[0], X0:X0 + small.shape[1]]; small = small[:sub.shape[0], :sub.shape[1]]
        ok = (sub.sum(-1) > 6) & (small.sum(-1) > 6)
        gain, off = [], []
        for c in range(3):
            fs, cs = small[..., c][ok], sub[..., c][ok]
            g = float(np.clip(fs.std() / max(cs.std(), 1e-3), 0.6, 1.6)); o = float(fs.mean() - g * cs.mean())
            gain.append(round(g, 4)); off.append(round(o, 2))
        coarse = np.clip(coarse * np.array(gain) + np.array(off), 0, 255)
        # local harmonisation: the low-frequency difference (fine - coarse) inside the overlap, diffused
        # outwards and decaying with distance, so tones meet at the seam (water and fields shot in other years)
        B = 32; gh, gw = H // B + 1, W // B + 1
        diff = np.zeros((gh, gw, 3), np.float32); known = np.zeros((gh, gw), bool)
        full = np.zeros((H, W, 3), np.float32); have = np.zeros((H, W), bool)
        full[Y0:Y0 + small.shape[0], X0:X0 + small.shape[1]] = small; have[Y0:Y0 + small.shape[0], X0:X0 + small.shape[1]] = ok
        for gy in range(gh):
            for gx in range(gw):
                hb = have[gy * B:(gy + 1) * B, gx * B:(gx + 1) * B]
                if hb.size and hb.mean() > 0.9:
                    known[gy, gx] = True
                    diff[gy, gx] = (full[gy * B:(gy + 1) * B, gx * B:(gx + 1) * B][hb] - coarse[gy * B:(gy + 1) * B, gx * B:(gx + 1) * B][hb]).mean(0)
        if known.any():
            # smooth inside, then diffuse outward (Jacobi iterations with the known blocks held)
            f = diff.copy(); dist = np.where(known, 0, 1e9).astype(np.float32)
            for it in range(max(gh, gw)):
                p2 = np.pad(f, ((1, 1), (1, 1), (0, 0)), mode='edge'); avg = (p2[:-2, 1:-1] + p2[2:, 1:-1] + p2[1:-1, :-2] + p2[1:-1, 2:]) / 4
                f = np.where(known[..., None], diff * 0.5 + avg * 0.5, avg)
                pd = np.pad(dist, 1, mode='edge'); dist = np.minimum(dist, np.minimum.reduce([pd[:-2, 1:-1], pd[2:, 1:-1], pd[1:-1, :-2], pd[1:-1, 2:]]) + 1)
            decay = np.exp(-dist / max(4.0, 0.08 * max(gh, gw)))[..., None]
            corr = np.asarray(Image.fromarray(np.clip(f * decay * 2 + 128, 0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32)
            corr = (corr - 128) / 2
            coarse = coarse + corr
        coarse = np.clip(coarse, 0, 255).astype(np.uint8)
        for ty in range(b['tiles'][1]):
            for tx in range(b['tiles'][0]):
                Image.fromarray(coarse[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE]).save(os.path.join(d, b['image'].format(row=ty, col=tx)), quality=quality, optimize=True)
        b['colorMatch'] = {'gain': gain, 'offset': off}; out.append((L, gain, off)); fine = coarse
        log(f'match L{L}: gain {gain} offset {off}')
    json.dump(meta, open(os.path.join(d, 'set.json'), 'w'), indent=1)


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'match': match(sys.argv[2]); sys.exit(0)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name'); ap.add_argument('lat', type=float); ap.add_argument('lon', type=float)
    ap.add_argument('--radius', type=float, default=1500, help='half-size of the finest level in metres')
    ap.add_argument('--levels', type=int, default=4); ap.add_argument('--step', type=int, default=4, help='radius and m/px ratio between levels')
    ap.add_argument('--source', default='auto', choices=['auto', 'naip', 's2']); ap.add_argument('--dem', default='auto', choices=['auto', '3dep', 'terrarium'])
    ap.add_argument('--mpp', type=float, default=None, help='metres per pixel of the finest level (NAIP 0.6, S2 10)')
    ap.add_argument('--year', type=int, default=None, help='Sentinel-2: latest summer to search (default last year)')
    ap.add_argument('--quality', type=int, default=88)
    a = ap.parse_args()
    bake(a.name, a.lat, a.lon, a.radius, a.levels, a.source, a.mpp, a.dem, a.year, a.quality, a.step)
