#!/usr/bin/env python3
"""montage.py out.jpg cols img1 img2 ... : grid of stills with filename labels."""
import sys, os
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0)); d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * h; sheet.paste(im.resize((w, h)), (x, y)); d.text((x + 6, y + 4), os.path.basename(f), fill=(255, 80, 60))
sheet.save(out, quality=85); print(out, sheet.size)
