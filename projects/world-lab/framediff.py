#!/usr/bin/env python3
"""Pop / jump detector for continuous shots.

  python3 projects/world-lab/framediff.py <video.mp4> [--from S] [--to S] [--sheet out.jpg] [--plot out.png]

Decodes at 320x180 grey, computes the per-frame mean absolute difference (MAD, 0-255) between
consecutive frames, and flags spikes: frames whose MAD exceeds both 2.5x the median of the
surrounding +-1 s and an absolute floor of 2.0. A seamless oner has no spikes; a pop or a jump cut
shows as an isolated spike. Prints a summary and optionally saves a plot and a contact sheet.
"""
import sys, subprocess, json
import numpy as np

def frames(path, w=320, h=180):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h: break
        yield np.frombuffer(b, np.uint8).reshape(h, w).astype(np.float32)

def fps_of(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    a, b = r.split('/'); return float(a) / float(b)

def main():
    a = sys.argv[1:]; path = a[0]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    fps = fps_of(path); t0 = float(opt('--from', 0)); t1 = float(opt('--to', 1e9))
    prev = None; mad = []; keep = []
    for i, f in enumerate(frames(path)):
        t = i / fps
        if t < t0 or t > t1: prev = f; continue
        if prev is not None: mad.append(float(np.abs(f - prev).mean()))
        if i % max(1, int(fps)) == 0: keep.append((t, f))
        prev = f
    mad = np.array(mad); n = len(mad); win = max(2, int(fps))
    spikes = []
    for i in range(n):
        lo, hi = max(0, i - win), min(n, i + win + 1)
        ctx = np.concatenate([mad[lo:i], mad[i + 1:hi]])
        med = float(np.median(ctx)) if len(ctx) else 0
        if mad[i] > max(2.0, 2.5 * med): spikes.append({'frame': i + 1 + int(t0 * fps), 't': round((i + 1) / fps + t0, 3), 'mad': round(mad[i], 2), 'localMedian': round(med, 2)})
    # smoothness of the motion itself: frame-to-frame change of MAD (a velocity pop is a step in MAD)
    jerk = np.abs(np.diff(mad)) if n > 1 else np.zeros(1)
    out = {'video': path, 'fps': fps, 'frames': n + 1, 'mad': {'mean': round(float(mad.mean()), 2), 'p50': round(float(np.median(mad)), 2), 'p99': round(float(np.percentile(mad, 99)), 2), 'max': round(float(mad.max()), 2), 'argmaxT': round((int(mad.argmax()) + 1) / fps + t0, 2)},
           'madStepMax': round(float(jerk.max()), 2), 'spikes': spikes}
    print(json.dumps(out, indent=1))
    if opt('--plot'):
        from PIL import Image, ImageDraw
        W, H = 1200, 300; im = Image.new('RGB', (W, H), (14, 16, 19)); d = ImageDraw.Draw(im); top = max(8, float(mad.max()) * 1.1)
        pts = [(i / max(1, n - 1) * (W - 20) + 10, H - 10 - v / top * (H - 30)) for i, v in enumerate(mad)]
        d.line(pts, fill=(217, 210, 195), width=2)
        for s in spikes: x = (s['frame'] - 1 - int(t0 * fps)) / max(1, n - 1) * (W - 20) + 10; d.line([(x, 10), (x, H - 10)], fill=(224, 36, 27), width=1)
        d.text((10, 6), f'per-frame MAD (max {mad.max():.1f}), spikes in red: {len(spikes)}', fill=(217, 210, 195)); im.save(opt('--plot'))
    if opt('--sheet'):
        from PIL import Image
        k = keep[:: max(1, len(keep) // 12)][:12]; tw, th = 320, 180
        sheet = Image.new('L', (tw * 4, th * ((len(k) + 3) // 4)))
        for j, (t, f) in enumerate(k): sheet.paste(Image.fromarray(f.astype(np.uint8)), ((j % 4) * tw, (j // 4) * th))
        sheet.save(opt('--sheet'))

if __name__ == '__main__': main()
