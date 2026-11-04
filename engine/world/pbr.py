#!/usr/bin/env python3
"""PBR library builder for the world kit: downloads CC0 texture sets (Poly Haven, ambientCG) and two
CC0 HDRIs at 1K, then packs them into assets/pbr/ in the layout engine/world/materials.js loads.

  python3 -I engine/world/pbr.py download <dl_dir>     # raw sets -> <dl_dir>/<id>/ (keep out of the repo)
  python3 -I engine/world/pbr.py pack <dl_dir>         # -> assets/pbr/*.jpg, trees.png, hdri/*.hdr, layers.json

Every layer is two 1024x1024 JPGs:  <name>.a.jpg = albedo (sRGB, AO folded in at 50 %)
                                    <name>.n.jpg = R,G normal (OpenGL, +Y up), B roughness
materials.js stacks them into two texture arrays (albedo, normal+roughness), so any world shader can
sample any material by layer index with two samplers. Facade layers carry their window grid
(cols x rows per tile) so a building can align floors and bays to it; glass is roughness < 0.1.
trees.png is a 4-variant crown atlas (RGBA, 2048x512) scattered from the LeafSet010 leaf scans.
Sources, licences and the tile size of each layer: assets/CREDITS.md and assets/pbr/layers.json.
"""
import json, os, sys, subprocess, zipfile, io, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'pbr')

# name: (source, id, tile metres [w, h], extra)
LAYERS = [
    ('asphalt',     'ph',  'asphalt_02',             [3.0, 3.0], {}),
    ('asphalt_wet', 'acg', 'Asphalt025C',            [2.5, 2.5], {}),
    ('pavers',      'ph',  'concrete_pavement',      [1.8, 1.8], {}),
    ('concrete',    'ph',  'concrete_wall_008',      [2.71, 2.71], {}),
    ('brick',       'ph',  'brick_wall_006',         [3.0, 3.0], {}),
    ('stone',       'ph',  'large_sandstone_blocks', [3.0, 3.0], {}),
    ('curtain',     'acg', 'Facade001',              None, {'grid': [16, 10]}),
    ('ribbon',      'acg', 'Facade006',              None, {'grid': [14, 8]}),
    ('brickwin',    'acg', 'Facade018A',             None, {'grid': [6, 6]}),
    ('piers',       'acg', 'Facade020A',             None, {'grid': [6, 6]}),
    ('gravel',      'acg', 'Gravel043',              [2.0, 2.0], {}),
    ('grass',       'acg', 'Grass004',               [2.0, 2.0], {}),
    ('dirt',        'ph',  'dirt',                   [2.0, 2.0], {}),
    ('metal',       'acg', 'CorrugatedSteel009',     [2.0, 2.0], {}),
    ('chrome',      'acg', 'Metal049A',              [1.0, 1.0], {}),
    ('rubber',      'acg', 'Rubber004',              [1.0, 1.0], {}),
    ('markings',    'acg', 'Road007',                [8.2, 8.2], {'line': [0.0732, 0.0105]}),  # solid line: u centre, half width (uv)
    ('sheet',       'ph',  'box_profile_metal_sheet', [2.0, 2.0], {}),
]
EXTRA_ACG = ['LeafSet010']
HDRI = ['modern_buildings', 'modern_buildings_night']

def get(url):
    return subprocess.run(['curl', '-sSL', '--fail', '--retry', '3', url], capture_output=True, check=True).stdout

def download(dl):
    for name, src, aid, *_ in LAYERS + [(None, 'acg', a, None, None) for a in EXTRA_ACG]:
        d = os.path.join(dl, aid); os.makedirs(d, exist_ok=True)
        if os.listdir(d): continue
        if src == 'ph':
            files = json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
            for k in ['Diffuse', 'nor_gl', 'Rough', 'AO']:
                if k in files: open(os.path.join(d, k + '.jpg'), 'wb').write(get(files[k]['1k']['jpg']['url']))
        else:
            z = zipfile.ZipFile(io.BytesIO(get(f'https://ambientcg.com/get?file={aid}_1K-JPG.zip')))
            for n in z.namelist():
                if n.lower().endswith('.jpg') and '/' not in n: open(os.path.join(d, n), 'wb').write(z.read(n))
        print('downloaded', aid)
    d = os.path.join(dl, 'hdri'); os.makedirs(d, exist_ok=True)
    for a in HDRI:
        p = os.path.join(d, a + '_1k.hdr')
        if not os.path.exists(p): open(p, 'wb').write(get(json.loads(get(f'https://api.polyhaven.com/files/{a}'))['hdri']['1k']['hdr']['url']))

def maps(dl, src, aid):
    d = os.path.join(dl, aid)
    if src == 'ph': f = {'col': 'Diffuse.jpg', 'nrm': 'nor_gl.jpg', 'rough': 'Rough.jpg', 'ao': 'AO.jpg'}
    else: f = {k: f'{aid}_1K-JPG_{v}.jpg' for k, v in [('col', 'Color'), ('nrm', 'NormalGL'), ('rough', 'Roughness'), ('ao', 'AmbientOcclusion')]}
    load = lambda k, mode: Image.open(os.path.join(d, f[k])).convert(mode).resize((1024, 1024), Image.LANCZOS) if os.path.exists(os.path.join(d, f[k])) else None
    return load('col', 'RGB'), load('nrm', 'RGB'), load('rough', 'L'), load('ao', 'L')

def pack(dl):
    os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(OUT, 'hdri'), exist_ok=True)
    meta = {'size': 1024, 'layers': []}
    for i, (name, src, aid, tile, extra) in enumerate(LAYERS):
        col, nrm, rough, ao = maps(dl, src, aid)
        c = np.asarray(col).astype(np.float32) / 255
        if ao is not None: c = c * (0.5 + 0.5 * np.asarray(ao).astype(np.float32)[..., None] / 255)
        Image.fromarray(np.clip(c * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(OUT, f'{name}.a.jpg'), quality=90)
        n = np.asarray(nrm).copy(); n[..., 2] = np.asarray(rough) if rough is not None else 128
        Image.fromarray(n).save(os.path.join(OUT, f'{name}.n.jpg'), quality=92)
        avg = (c.reshape(-1, 3).mean(0)).round(4).tolist()
        meta['layers'].append({'name': name, 'index': i, 'source': src, 'id': aid, 'tile': tile, 'avg': avg, **extra,
            'url': f'https://polyhaven.com/a/{aid}' if src == 'ph' else f'https://ambientcg.com/view?id={aid}'})
        print('packed', i, name, aid)
    trees(dl)
    for a in HDRI:
        p = os.path.join(dl, 'hdri', a + '_1k.hdr'); q = os.path.join(OUT, 'hdri', a + '_1k.hdr')
        open(q, 'wb').write(open(p, 'rb').read())
    meta['hdri'] = {a: {'file': f'hdri/{a}_1k.hdr', 'url': f'https://polyhaven.com/a/{a}'} for a in HDRI}
    meta['trees'] = {'file': 'trees.png', 'variants': 4, 'source': 'LeafSet010', 'url': 'https://ambientcg.com/view?id=LeafSet010'}
    json.dump(meta, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)

# ---------------------------------------------------------------- tree crown atlas
def trees(dl):
    d = os.path.join(dl, 'LeafSet010')
    col = Image.open(os.path.join(d, 'LeafSet010_1K-JPG_Color.jpg')).convert('RGB')
    op = Image.open(os.path.join(d, 'LeafSet010_1K-JPG_Opacity.jpg')).convert('L')
    leaf = col.copy(); leaf.putalpha(op)
    # the scan holds four leaves in a 2x2 grid
    sprites = [leaf.crop((x, y, x + 512, y + 512)) for y in (0, 512) for x in (0, 512)]
    sprites = [s.crop(s.getbbox()) for s in sprites]
    S = 512; atlas = Image.new('RGBA', (S * 4, S), (0, 0, 0, 0))
    rnd = random.Random(41)
    small = {}
    def sprite(k, size, ang):
        key = (k, size, int(ang) // 15)
        if key not in small:
            s = sprites[k]; w = max(3, int(size * s.width / max(s.width, s.height))); h = max(3, int(size * s.height / max(s.width, s.height)))
            small[key] = s.resize((w, h), Image.LANCZOS).rotate(key[2] * 15, expand=True, resample=Image.BICUBIC)
        return small[key]
    for v in range(4):
        img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); dr = ImageDraw.Draw(img)
        cx = S / 2
        # trunk and main limbs (bark brown, slightly lighter on the lit side)
        top = S * (0.18 if v == 1 else 0.42); base_w = 16 if v != 1 else 11
        for k in range(14):
            t = k / 13; y = S - t * (S - top); w = base_w * (1 - 0.7 * t)
            dr.line([(cx - 1, y), (cx + rnd.uniform(-2, 2), y - (S - top) / 13)], fill=(52, 41, 32, 255), width=max(2, int(w)))
        if v in (0, 3):
            for k in range(7):
                y0 = S * rnd.uniform(0.52, 0.7); a = rnd.uniform(-1, 1)
                pts = [(cx, y0)]
                for j in range(1, 4): pts.append((cx + a * S * 0.1 * j + rnd.uniform(-6, 6), y0 - S * 0.07 * j))
                dr.line(pts, fill=(48, 38, 30, 255), width=5 - k % 3)
        # crown: leaves scattered in an ellipsoid (conifer: a cone), shaded by a sphere normal lit from the upper left
        N = 5200 if v != 2 else 4200
        if v == 0: cyc, rx, ry = S * 0.40, S * 0.40, S * 0.33
        elif v == 1: cyc, rx, ry = S * 0.52, S * 0.30, S * 0.46
        elif v == 2: cyc, rx, ry = S * 0.40, S * 0.17, S * 0.38
        else: cyc, rx, ry = S * 0.50, S * 0.44, S * 0.28
        pts = []
        for _ in range(N):
            if v == 1:
                t = rnd.random() ** 0.8; y = cyc + ry - t * 2 * ry; w = ((1 - t) * 0.9 + 0.08) * rx
                x = cx + rnd.uniform(-1, 1) * w * (1 - t * 0.3); z = rnd.uniform(-1, 1)
                nx, ny, nz = (x - cx) / rx, -0.3 - t * 0.4, z
            else:
                while True:
                    a, b, c = rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)
                    r2 = a * a + b * b + c * c
                    # lumpy crown: clumps make the silhouette ragged
                    lump = 0.82 + 0.18 * math.sin(a * 5.1 + v) * math.sin(b * 4.3 + 1.7 * v)
                    if r2 < lump * lump and r2 > 0.15: break
                x, y = cx + a * rx, cyc + b * ry; nx, ny, nz = a, b, c
            pts.append((nz, x, y, nx, ny))
        pts.sort()  # back to front
        for nz, x, y, nx, ny in pts:
            l = max(0.0, (-nx * 0.55 - ny * 0.7 + nz * 0.45)) * 0.75 + 0.25 + 0.25 * nz
            l *= 0.8 + 0.4 * rnd.random()
            sz = rnd.uniform(11, 19) if v != 1 else rnd.uniform(8, 12)
            sp = sprite(rnd.randrange(4), sz, rnd.uniform(0, 360))
            a = np.asarray(sp).astype(np.float32)
            tint = np.array([0.55 + 0.25 * rnd.random(), 0.75 + 0.15 * rnd.random(), 0.45 + 0.2 * rnd.random()]) if v != 1 else np.array([0.35, 0.55, 0.42])
            if v == 3: tint = tint * np.array([1.1, 0.95, 0.8])
            a[..., :3] = np.clip(a[..., :3] * tint * l * 0.55, 0, 255)
            img.alpha_composite(Image.fromarray(a.astype(np.uint8)), (int(x - sp.width / 2), int(y - sp.height / 2)))
        atlas.paste(img, (v * S, 0))
    # dilate colour under transparent texels so mips don't fringe black
    a = np.asarray(atlas).astype(np.float32); rgb, al = a[..., :3], a[..., 3:] / 255
    blur = np.asarray(Image.fromarray(np.clip(rgb * al, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
    wb = np.asarray(Image.fromarray((al[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[..., None] / 255
    fill = blur / np.maximum(wb, 1e-3)
    rgb = np.where(al > 0.02, rgb, fill)
    Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), a[..., 3:]], -1).astype(np.uint8)).save(os.path.join(OUT, 'trees.png'), optimize=True)
    print('packed trees.png')

if __name__ == '__main__':
    cmd, dl = sys.argv[1], sys.argv[2]
    {'download': download, 'pack': pack, 'trees': trees}[cmd](dl)
