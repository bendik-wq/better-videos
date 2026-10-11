#!/usr/bin/env python3
"""Contact sheet from bench strips: sheet.py out/bench out/bench-sheet.jpg [names...]"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
src, dst = sys.argv[1], sys.argv[2]
names = sys.argv[3:] or [f[:-4] for f in sorted(os.listdir(src)) if f.endswith('.jpg')]
order = json.load(open(os.path.join(src, 'bench.json'))) if os.path.exists(os.path.join(src, 'bench.json')) else []
idx = {r['name']: i for i, r in enumerate(order)}
names.sort(key=lambda n: idx.get(n, 999))
info = {r['name']: r for r in order}
strips = [(n, Image.open(os.path.join(src, n + '.jpg'))) for n in names if os.path.exists(os.path.join(src, n + '.jpg'))]
w = strips[0][1].width; lab = 220; h = strips[0][1].height
sheet = Image.new('RGB', (w + lab, h * len(strips)), (12, 12, 12))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 18); small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 13)
except Exception: font = small = ImageFont.load_default()
for i, (n, im) in enumerate(strips):
    sheet.paste(im, (lab, i * h)); d.text((14, i * h + 14), n, fill=(236, 230, 218), font=font)
    r = info.get(n)
    if r: d.text((14, i * h + 44), f"{r['mean']} / {r['max']} ms", fill=(150, 145, 135), font=small)
sheet.save(dst, quality=85); print(dst, sheet.size)
