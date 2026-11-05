#!/usr/bin/env python3
"""Visual-density proxy for benchmarking frames: edge density (luma gradient > 24 at 960x540) and
the number of 3-bit colour bins covering > 0.2 % of the frame. usage: edge_density.py "glob" ["glob" ...]"""
import sys, glob, numpy as np
from PIL import Image
def stats(f):
    a = np.asarray(Image.open(f).convert('L').resize((960,540)), dtype=np.float32)
    gx = np.abs(np.diff(a,axis=1))[:-1,:]; gy = np.abs(np.diff(a,axis=0))[:,:-1]
    g = np.hypot(gx,gy)
    # colour count: distinct quantised colours covering >0.2% of frame
    c = np.asarray(Image.open(f).convert('RGB').resize((480,270))).reshape(-1,3)//32
    _, n = np.unique(c[:,0]*64+c[:,1]*8+c[:,2], return_counts=True)
    return (g>24).mean(), (n > c.shape[0]*0.002).sum()
for pat in sys.argv[1:]:
    fs = sorted(glob.glob(pat)); s = np.array([stats(f) for f in fs])
    print(f"{pat.split('/')[-1]:28s} n={len(fs):2d} edge-density={s[:,0].mean()*100:.1f}% (min {s[:,0].min()*100:.1f}, max {s[:,0].max()*100:.1f})  colours>0.2%={s[:,1].mean():.1f}")
