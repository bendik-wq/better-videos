#!/usr/bin/env python3
"""Sentinel-2 L2A true-colour crops of Gatun Lake for the `satellite` set (RESEARCH.md §10 P14).

  python3 projects/panama/assets/satellite/fetch.py [--level 1] [ids...]

Reads only the COG tiles it needs (HTTP range requests through engine/imagery/tiff.py), crops the lake box
in UTM 17N, writes <date>.jpg (true colour, gently normalised) plus meta.json.
(We tried NDWI shorelines from B03/B08: popcorn cumulus and shadows make them unreliable, so they are not used.) Nothing raw is kept.
Licence: Copernicus Sentinel data, free and open; credit "Contains modified Copernicus Sentinel data <year>".
"""
import sys, os, json, math, argparse
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'engine', 'imagery'))
import tiff
from bake import utm_forward

BASE = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/17/P/PL/{y}/{m}/{id}/{band}.tif'
BOX = (-80.06, 8.99, -79.60, 9.33)          # lon/lat: Gatun Lake from the Gatun locks to Gamboa
IDS = ['S2A_17PPL_20260105_0_L2A', 'S2B_17PPL_20230603_0_L2A']   # lake 88.82 ft vs 80.09 ft (gatun.csv)

def window(url, level):
    T = tiff.Tiff(url); G = T.geo(); I = T.info(level); sc = G['sx'] * T.info(0)['w'] / I['w']
    w, s, e, n = BOX
    E0, N1 = utm_forward(np.array([n]), np.array([w]), 17); E1, N0 = utm_forward(np.array([s]), np.array([e]), 17)
    E0, E1 = min(E0[0], utm_forward(np.array([s]), np.array([w]), 17)[0][0]), max(E1[0], utm_forward(np.array([n]), np.array([e]), 17)[0][0])
    N0, N1 = min(N0[0], utm_forward(np.array([s]), np.array([w]), 17)[1][0]), max(N1[0], utm_forward(np.array([n]), np.array([e]), 17)[1][0])
    x0 = int((E0 - G['x0']) / sc); x1 = int((E1 - G['x0']) / sc); y0 = int((G['y0'] - N1) / sc); y1 = int((G['y0'] - N0) / sc)
    return T.window(x0, y0, x1, y1, level), dict(E0=G['x0'] + x0 * sc, N1=G['y0'] - y0 * sc, px=sc)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('ids', nargs='*'); ap.add_argument('--level', type=int, default=1); a = ap.parse_args()
    meta = json.load(open(os.path.join(HERE, 'meta.json'))) if os.path.exists(os.path.join(HERE, 'meta.json')) else {}
    for sid in a.ids or IDS:
        d = sid.split('_')[2]; y, m = int(d[:4]), int(d[4:6]); date = f'{d[:4]}-{d[4:6]}-{d[6:]}'
        u = lambda b: BASE.format(y=y, m=m, id=sid, band=b)
        tci, geo = window(u('TCI'), a.level)
        o = np.clip(tci[..., :3].astype(np.float32) / 255.0, 0, 1) ** 0.85
        Image.fromarray((o * 255).astype(np.uint8)).save(os.path.join(HERE, f'{date}.jpg'), quality=86, optimize=True)
        meta[date] = {'id': sid, 'box_lonlat': BOX, 'utm_zone': 17, **geo, 'w': int(tci.shape[1]), 'h': int(tci.shape[0]),
                      'credit': f'Contains modified Copernicus Sentinel data {y}'}
        print(date, tci.shape, flush=True)
    json.dump(meta, open(os.path.join(HERE, 'meta.json'), 'w'), indent=1)

if __name__ == '__main__': main()
