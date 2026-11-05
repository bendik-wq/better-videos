#!/usr/bin/env python3
"""PAPER LAB checks for STYLE-BIBLE.md §19: feed mock (light/dark), halftone moire on downscale,
world- vs screen-fixed pitch under zoom, and a VP9/AV1 compression pass on the engine stills.
   node engine/render.mjs projects/paper-lab --stills=0.5 && python3 -I projects/paper-lab/check.py
Writes renders/paper-lab/*.png|jpg and renders/paper-lab/report.json."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
ST = os.path.join(HERE, 'out/stills'); OUT = os.path.join(ROOT, 'renders/paper-lab'); os.makedirs(OUT, exist_ok=True)
TMP = os.path.join(OUT, 'tmp'); os.makedirs(TMP, exist_ok=True)
R = {}

def luma(a):  # Rec.709 on 0..1 sRGB values (perceptual enough for a ranking)
    a = np.asarray(a, dtype=np.float64) / 255.0
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
def hsv_s(a):
    a = np.asarray(a, dtype=np.float64) / 255.0; mx, mn = a.max(-1), a.min(-1)
    return np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)

# ---------------------------------------------------------------- 1. frame stats (bible §1.3)
stats = {}
for f in sorted(os.listdir(ST)):
    if not f.endswith('.jpg'): continue
    im = np.asarray(Image.open(os.path.join(ST, f)).convert('RGB'))
    r, gch, b = [im[..., i].astype(int) for i in range(3)]
    red = (r > 170) & (gch < 90) & (b < 90)
    stats[f[:-7]] = dict(meanL=round(float(luma(im).mean()), 3), meanS=round(float(hsv_s(im).mean()), 3), redPct=round(100 * float(red.mean()), 2))
R['frame_stats'] = stats

# ---------------------------------------------------------------- 2. feed mock: light (#fff) and dark (#0f0f0f)
TW, TH = 360, 202
def tile(path): return Image.open(path).convert('RGB').resize((TW, TH), Image.LANCZOS)
ours = {k: tile(os.path.join(ST, f'sf-thumb-{k}-50.jpg')) for k in ('paper', 'teal', 'night')}
# neutral stand-ins for neighbouring thumbnails (flat blocks; no real creator art is used)
stand = [(36, 38, 46), (196, 160, 110), (90, 112, 140)]
feed = {}
for mode, bg, fg in (('light', (255, 255, 255), (15, 15, 15)), ('dark', (15, 15, 15), (241, 241, 241))):
    W, H = 3 * TW + 4 * 24, 2 * (TH + 70) + 24
    cv = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(cv)
    order = [('paper', ours['paper']), ('s0', stand[0]), ('teal', ours['teal']), ('s1', stand[1]), ('night', ours['night']), ('s2', stand[2])]
    for i, (k, t) in enumerate(order):
        x, y = 24 + (i % 3) * (TW + 24), 24 + (i // 3) * (TH + 70)
        if isinstance(t, tuple): d.rounded_rectangle([x, y, x + TW, y + TH], 12, fill=t)
        else:
            m = Image.new('L', (TW, TH), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, TW - 1, TH - 1], 12, fill=255); cv.paste(t, (x, y), m)
        d.rectangle([x, y + TH + 12, x + TW * 0.85, y + TH + 24], fill=tuple(int(c * 0.5 + bgc * 0.5) for c, bgc in zip(fg, bg)))
        d.rectangle([x, y + TH + 32, x + TW * 0.5, y + TH + 42], fill=tuple(int(c * 0.3 + bgc * 0.7) for c, bgc in zip(fg, bg)))
    cv.save(os.path.join(OUT, f'feed-{mode}.png'))
    bgL = luma(np.array([[bg]]))[0, 0]
    for k, t in ours.items():
        a = np.asarray(t); edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
        feed.setdefault(k, {})[mode] = dict(edge_dL=round(abs(float(luma(edge[None]).mean()) - bgL), 3))
for k, t in ours.items():
    a = np.asarray(t); feed[k]['meanL'] = round(float(luma(a).mean()), 3); feed[k]['meanS'] = round(float(hsv_s(a).mean()), 3)
    g = np.asarray(t.resize((168, 94), Image.LANCZOS).convert('L'), dtype=float); feed[k]['rms_contrast_168'] = round(float(g.std() / 255), 3)
R['feed'] = feed

# ---------------------------------------------------------------- 3. halftone moire on downscale (lossless synthetic, same dot law as scene.js)
def halftone_patch(pitch, density, w=720, h=480, angle=45, ink=80, fill=180, ss=4):
    """grey patch, same dot law as scene.js halftone(): r = pitch * sqrt(d / pi), supersampled 4x"""
    W, H = w * ss, h * ss; im = Image.new('L', (W, H), fill); d = ImageDraw.Draw(im)
    ca, sa = np.cos(np.radians(angle)), np.sin(np.radians(angle)); rr = pitch * np.sqrt(density / np.pi) * ss
    n = int(np.hypot(w, h) / pitch) + 2
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            x = w / 2 + (i * ca - j * sa) * pitch; y = h / 2 + (i * sa + j * ca) * pitch
            if -pitch < x < w + pitch and -pitch < y < h + pitch:
                d.ellipse([x * ss - rr, y * ss - rr, x * ss + rr, y * ss + rr], fill=ink)
    return im.resize((w, h), Image.LANCZOS)
def moire_index(img, pitch_px):
    """low-frequency ripple left after a blur of 2x the on-screen pitch: sigma of luma as % of the 100-level dot/fill step"""
    g = np.asarray(img.filter(ImageFilter.GaussianBlur(2 * max(1.0, pitch_px))), dtype=float)[12:-12, 12:-12]
    return g.std()
moire = {}
for pitch in (8, 11, 14):
    for dens in (0.35, 0.55):
        src = halftone_patch(pitch, dens); row = {'1080': round(moire_index(src, pitch), 2)}
        for tgt, k in ((720, 2 / 3), (480, 4 / 9), (360, 1 / 3)):
            for name, flt in (('lanczos', Image.LANCZOS), ('bilinear', Image.BILINEAR), ('nearest', Image.NEAREST)):
                row[f'{tgt}_{name}'] = round(moire_index(src.resize((round(720 * k), round(480 * k)), flt), pitch * k), 2)
        moire[f'p{pitch}_d{dens}'] = row
        if dens == 0.55:
            sh = [src.resize((round(720 * k), round(480 * k)), Image.BILINEAR).resize((720, 480), Image.NEAREST) for k in (1, 2 / 3, 4 / 9, 1 / 3)]
            strip = Image.new('L', (4 * 360, 240)); [strip.paste(x.crop((180, 120, 540, 360)), (i * 360, 0)) for i, x in enumerate(sh)]
            strip.save(os.path.join(OUT, f'moire-p{pitch}.png'))
json.dump(moire, open(os.path.join(OUT, 'moire-v2.json'), 'w'), indent=1)
R['moire_index_pct'] = moire
R['zoom_pitch'] = {'world_fixed_11px_at_zoom': {z: round(11 * z, 1) for z in (0.5, 0.7, 1.0, 1.3, 2.0, 3.0)},
                   'note': 'world-fixed dots scale with the camera; outside 0.75-1.6x the pitch leaves the 8-18 px band, so re-screen (see bible)'}

# ---------------------------------------------------------------- 4. compression: a slow lean-in clip from the engine stills, VP9 + AV1
def run(*a): subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
def clip(still, out):
    run('ffmpeg', '-y', '-loop', '1', '-i', still, '-vf', "scale=3840:-1,zoompan=z='1+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1920x1080:fps=30,format=yuv420p",
        '-frames:v', '90', '-c:v', 'libx264', '-crf', '4', '-preset', 'veryfast', out)
def ssim(a, b, region=None):
    # global SSIM via ffmpeg on frame 45; region crop optional "w:h:x:y"
    vf = f'[0:v]trim=start_frame=45:end_frame=46{",crop=" + region if region else ""}[a];[1:v]trim=start_frame=45:end_frame=46{",crop=" + region if region else ""}[b];[a][b]ssim'
    p = subprocess.run(['ffmpeg', '-i', a, '-i', b, '-lavfi', vf, '-f', 'null', '-'], capture_output=True, text=True).stderr
    for ln in p.splitlines():
        if 'SSIM' in ln and 'All:' in ln: return float(ln.split('All:')[1].split()[0])
    return None
comp = {}
REG = {'sf-stress': {'halftone_p8_world': '360:240:150:140', 'halftone_p11_world': '360:240:580:140', 'hairlines': '360:120:1460:150', 'mono22': '1100:60:110:885'},
       'sf-case': {'case_halftone_rim': '300:300:1300:640', 'pen_line_tag': '300:120:1520:180', 'paper_ground': '400:300:100:100'}}
for name in ('sf-stress', 'sf-case'):
    ref = os.path.join(TMP, f'{name}-ref.mp4'); clip(os.path.join(ST, f'{name}-50.jpg'), ref)
    for tag, args, scale in (('vp9_1080_1.2M', ['-c:v', 'libvpx-vp9', '-b:v', '1200k', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'], None),
                             ('vp9_720_0.7M', ['-c:v', 'libvpx-vp9', '-b:v', '700k', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'], '1280:720'),
                             ('av1_1080_0.8M', ['-c:v', 'libsvtav1', '-b:v', '800k', '-preset', '8'], None),
                             ('vp9_360_0.25M', ['-c:v', 'libvpx-vp9', '-b:v', '250k', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'], '640:360')):
        enc = os.path.join(TMP, f'{name}-{tag}.webm' if 'vp9' in tag else f'{name}-{tag}.mkv')
        vf = ['-vf', f'scale={scale}:flags=bicubic'] if scale else []
        run('ffmpeg', '-y', '-i', ref, *vf, *args, '-an', enc)
        back = os.path.join(TMP, f'{name}-{tag}-up.mp4')  # bring back to 1080 for a like-for-like SSIM (what a viewer's player does)
        run('ffmpeg', '-y', '-i', enc, '-vf', 'scale=1920:1080:flags=bicubic,format=yuv420p', '-c:v', 'libx264', '-crf', '4', '-preset', 'veryfast', back)
        res = {'global': ssim(ref, back)}
        for rk, rg in REG[name].items(): res[rk] = ssim(ref, back, rg)
        comp.setdefault(name, {})[tag] = {k: (round(v, 4) if v else v) for k, v in res.items()}
        if name == 'sf-stress':
            run('ffmpeg', '-y', '-i', back, '-vf', 'select=eq(n\\,45),crop=900:300:150:120', '-frames:v', '1', os.path.join(OUT, f'compress-{tag}.png'))
R['compression_ssim'] = comp
json.dump(R, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
print(json.dumps(R, indent=1))
