# Comparison sheets for the look lab (PIL). argv: graded_dir stills_dir out_dir json{looks, sets, labels}
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
GR, ST, OUT, cfg = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4])
looks, sets, labels = cfg['looks'], cfg['sets'], cfg['labels']
F = '/usr/share/fonts/truetype/dejavu/'
mono = lambda s: ImageFont.truetype(F + 'DejaVuSansMono.ttf', s)
def grid(rows, cols, cell, path, title, col_labels, row_labels, gap=8, pad=60):
    w, h = cell
    W = pad + cols * (w + gap) + 20; H = 90 + rows * (h + gap) + 20
    im = Image.new('RGB', (W, H), (18, 18, 20)); d = ImageDraw.Draw(im)
    d.text((pad, 24), title, fill=(230, 226, 218), font=mono(22))
    for c, lab in enumerate(col_labels): d.text((pad + c * (w + gap), 62), lab.upper(), fill=(190, 186, 178), font=mono(15))
    for r, lab in enumerate(row_labels): d.text((12, 90 + r * (h + gap) + h // 2 - 8), lab[:6], fill=(150, 146, 140), font=mono(12))
    return im, d, (lambda r, c: (pad + c * (w + gap), 90 + r * (h + gap)))
def put(im, xy, f, cell):
    if os.path.exists(f): im.paste(Image.open(f).convert('RGB').resize(cell, Image.LANCZOS), xy)
# 1. every look x every frame
cell = (480, 270)
im, d, at = grid(len(sets), len(looks), cell, None, 'LOOK LAB  ·  6 test frames x %d looks  ·  engine/looks.js + engine/grade/finish.mjs' % len(looks), [labels[l] for l in looks], sets)
for r, s in enumerate(sets):
    for c, l in enumerate(looks): put(im, at(r, c), os.path.join(GR, f'{s}-{l}.jpg'), cell)
im.save(os.path.join(OUT, 'looks-sheet.jpg'), quality=90); print('[sheet]', os.path.join(OUT, 'looks-sheet.jpg'))
# 2. bright-day: before (old default finish, no LUT) / after
if 'bright-day' in looks:
    cell = (720, 405)
    im, d, at = grid(len(sets), 2, cell, None, 'BRIGHT DAY  ·  left: old finish, no LUT  ·  right: bright-day LUT + daylight finish', ['before', 'bright-day'], sets)
    for r, s in enumerate(sets):
        put(im, at(r, 0), os.path.join(GR, f'{s}-bright-day-nolut.jpg'), cell); put(im, at(r, 1), os.path.join(GR, f'{s}-bright-day.jpg'), cell)
    im.save(os.path.join(OUT, 'bright-day-before-after.jpg'), quality=90); print('[sheet]', os.path.join(OUT, 'bright-day-before-after.jpg'))
    # 3. bright-day hero contact sheet, 3 x 2 at 960 wide
    cell = (960, 540)
    im, d, at = grid(2, 3, cell, None, 'BRIGHT DAY  ·  the episode-3 look', ['', '', ''], ['', ''])
    for i, s in enumerate(sets): put(im, at(i // 3, i % 3), os.path.join(GR, f'{s}-bright-day.jpg'), cell)
    im.save(os.path.join(OUT, 'bright-day-contact.jpg'), quality=90); print('[sheet]', os.path.join(OUT, 'bright-day-contact.jpg'))
