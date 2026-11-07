"""Camera estimator spec: exact on the pan benchmark, zero on static scenes, and fast.
python3 -I tools/revid/tests/test_camera.py  (exit 0 = pass)"""
import sys, os, json, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import numpy as np, revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench')
ok = True; total = 0.0
for v in ['pan', 'slide', 'multi', 'scale_rot', 'blob', 'typed']:
    w, h, fps, n = revid.probe(f'{B}/{v}.mp4'); F = list(revid.read_frames(f'{B}/{v}.mp4', w, h))
    t = time.time(); o = revid.camera_shifts(F); dt = time.time() - t; total += dt
    if v == 'pan':
        gt = [c['dx'] for c in json.load(open(f'{B}/pan.json'))['camera']]
        err = np.abs(-np.diff(o[:, 0]) - np.diff(gt)); bad = int((err > 0.6).sum()); dy = float(np.abs(o[:, 1]).max())
        print(f'pan: total {o[-1].round(1).tolist()} (truth [-320, 0]), frames off >0.6px: {bad}/89, max |dy| {dy:.2f}, {dt:.1f}s')
        ok &= bad == 0 and dy < 1.0
    else:
        m = float(np.abs(o).max()); print(f'{v}: max |offset| {m:.2f} (truth 0), {dt:.1f}s'); ok &= m < 0.5
print(f'total time {total:.1f}s (limit 20s)'); ok &= total < 20
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
