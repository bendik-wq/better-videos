#!/usr/bin/env python3
"""Density gate for the ep10 hero frames (hyperframes-engine-test.md §4.1/§12): edge density = share of pixels with a luma
gradient > 24 at 960x540 (target >= 6 %), colour bins = 3-bit-per-channel bins covering > 0.2 % of the frame (target >= 20),
plus bible §1.3 stats (mean L, mean S, red share and red components) and copies of the stills as moderate jpgs.
   python3 -I projects/notredame-lab/density.py [glob]   -> renders/notredame-lab/density.json"""
import json, os, sys, glob
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
OUT = os.path.join(ROOT, 'renders/notredame-lab'); os.makedirs(OUT, exist_ok=True)
pat = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out/stills/*.jpg')
def stats(f):
    im = Image.open(f).convert('RGB')
    a = np.asarray(im.convert('L').resize((960, 540)), dtype=np.float32)
    gx = np.abs(np.diff(a, axis=1))[:-1, :]; gy = np.abs(np.diff(a, axis=0))[:, :-1]
    edge = float((np.hypot(gx, gy) > 24).mean())
    c = (np.asarray(im.resize((480, 270))).reshape(-1, 3) // 32).astype(np.int32)  # int: a uint8 key overflowed (R*64 wrapped) and merged bins
    _, n = np.unique(c[:, 0] * 64 + c[:, 1] * 8 + c[:, 2], return_counts=True)
    bins = int((n > c.shape[0] * 0.002).sum())
    rgb = np.asarray(im, dtype=np.float64) / 255
    L = float((0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]).mean())
    mx, mn = rgb.max(-1), rgb.min(-1); S = float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean())
    r8 = np.asarray(im, dtype=int); red = (r8[..., 0] > 170) & (r8[..., 1] < 90) & (r8[..., 2] < 90)
    # count red blobs (coarse: 8 px cells)
    h, w = red.shape; cells = red[:h // 8 * 8, :w // 8 * 8].reshape(h // 8, 8, w // 8, 8).mean((1, 3)) > 0.15
    from collections import deque
    seen = np.zeros_like(cells); comps = 0
    for (i, j) in zip(*np.nonzero(cells)):
        if seen[i, j]: continue
        comps += 1; q = deque([(i, j)]); seen[i, j] = True
        while q:
            y, x = q.popleft()
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < cells.shape[0] and 0 <= xx < cells.shape[1] and cells[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
    return dict(edge_pct=round(edge * 100, 2), bins=bins, meanL=round(L, 3), meanS=round(S, 3), red_pct=round(100 * float(red.mean()), 2), red_blobs=comps,
                pass_=bool(edge >= 0.06 and bins >= 20))
R = {}
for f in sorted(glob.glob(pat)):
    k = os.path.basename(f)[:-4]; R[k] = stats(f)
    Image.open(f).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, k + '.jpg'), quality=86)
    print(f"{k:28s} edge {R[k]['edge_pct']:5.2f}%  bins {R[k]['bins']:3d}  L {R[k]['meanL']:.2f} S {R[k]['meanS']:.2f}  red {R[k]['red_pct']:.2f}% blobs {R[k]['red_blobs']}  {'PASS' if R[k]['pass_'] else 'fail'}")
old = {}
p = os.path.join(OUT, 'density.json')
if os.path.exists(p): old = json.load(open(p))
old.update(R); json.dump(old, open(p, 'w'), indent=1)
