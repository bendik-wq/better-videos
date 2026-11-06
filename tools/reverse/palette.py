# Dominant colours at given times of a video: python3 -I palette.py <video> <t> [<t> ...] -> JSON {shots: [[hex...]], overall: [{hex, share}]}
import sys, json, subprocess
import numpy as np
video, ts = sys.argv[1], sys.argv[2:]
def frame(t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', t, '-i', video, '-frames:v', '1', '-vf', 'scale=160:90', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 3) if len(raw) == 160 * 90 * 3 else None
def top(px, n):
    q = (px // 32).astype(np.int32); key = q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2]
    keys, counts = np.unique(key, return_counts=True); order = np.argsort(-counts)[:n]; out = []
    for k, c in zip(keys[order], counts[order]):
        m = px[key == k].mean(0).astype(int); out.append(('#%02x%02x%02x' % tuple(m), round(100 * c / len(px), 1)))
    return out
shots, allpx = [], []
for t in ts:
    px = frame(t)
    if px is None: shots.append(None); continue
    shots.append([h for h, _ in top(px, 5)]); allpx.append(px[::4])
overall = [{'hex': h, 'share': s} for h, s in top(np.concatenate(allpx), 8)] if allpx else []
print(json.dumps({'shots': shots, 'overall': overall}))
