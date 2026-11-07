"""Element separation spec on the 'multi' benchmark: three shapes enter from off-screen with staggered starts and come
to rest side by side (square and star touch). Pass: the decomposition has three long tracks whose centre paths follow
the three ground-truth x moves (start/end within 12 px of truth once fully on screen), and >= 75 % of element-frames
are explained by reusing a pose. python3 -I tools/revid/tests/test_elements.py"""
import sys, os, json, shutil
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import numpy as np, revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench'); OUT = '/tmp/revid-test-multi'
shutil.rmtree(OUT, ignore_errors=True)
S = revid.decompose(f'{B}/multi.mp4', OUT, verbose=False)
gt = json.load(open(f'{B}/multi.json'))['elements']
L = S['shots'][0]['layers']
def centres(l):
    out = {}
    for f, e in l['frames'].items():
        M = np.array(e.get('K') or e['M']); out[int(f)] = M  # transform only; centre computed below
    return out
long = [l for l in L if len(l['frames']) >= 30]
print(f'{len(L)} layers, {len(long)} with >= 30 frames')
r, b = revid.understanding(OUT); share = r / max(1, r + b); print(f'understanding {100*share:.0f}% (need 75%)')
# final rest x of each long layer vs truth rest positions (centre of shape = v1 + size/2)
rests = sorted(e['keyframes'][0]['v1'] for e in gt)
found = []
for l in long:
    last = l['frames'][str(max(map(int, l['frames'])))]
    import cv2
    img = cv2.imread(os.path.join(OUT, 'assets', l['poses'][last['pose']]), cv2.IMREAD_UNCHANGED)
    ys, xs = np.nonzero(img[..., 3] > 128); cx = (xs.min() + xs.max()) / 2; cy = (ys.min() + ys.max()) / 2
    M = np.array(last['M']); found.append(float(M[0, 0] * cx + M[0, 1] * cy + M[0, 2]))
found.sort(); print('rest centres found', [round(x) for x in found], 'truth rest centres', rests)
ok = len(long) == 3 and share >= 0.75 and all(abs(a - b) <= 30 for a, b in zip(found, rests))
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
