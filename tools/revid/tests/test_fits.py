"""Motion-fit spec: recovered tweens must match ground truth. slide: x 15-60 power2.out (easeOutCubic);
scale_rot: scale 20-70 power2.inOut (easeInOutCubic); multi: three x moves easeOutBack -> back.out starting 5/12/19,
ending 40/47/54. A truth move counts as recovered if some fitted tween of the right prop has |f0 diff| <= 2, |f1 diff|
<= 4 and the right ease family (back.out may carry a parameter). Pass: >= 4 of the 5 moves recovered.
python3 -I tools/revid/tests/test_fits.py"""
import sys, os, json, shutil
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench')
MAP = {'easeOutCubic': 'power2.out', 'easeInOutCubic': 'power2.inOut', 'easeOutBack': 'back.out', 'linear': 'linear', 'easeInQuad': 'power1.in'}
want = [('slide', 'x'), ('scale_rot', 'scale'), ('multi', 'x')]
got = tot = 0
for v, prop in want:
    out = f'/tmp/revid-test-fit-{v}'; shutil.rmtree(out, ignore_errors=True)
    S = revid.decompose(f'{B}/{v}.mp4', out, verbose=False)
    tw = [s for L in S['shots'][0]['layers'] for s in L['fits'].get(prop, []) if s['kind'] == 'tween']
    for e in json.load(open(f'{B}/{v}.json'))['elements']:
        for k in e['keyframes']:
            if k['prop'] != ('x' if prop == 'x' else 'scale') or k['v0'] == k['v1']: continue
            tot += 1; ease = MAP[k['easing']]
            hit = [s for s in tw if abs(s['f0'] - k['f0']) <= 2 and abs(s['f1'] - k['f1']) <= 4 and s['ease'].split('(')[0] == ease]
            got += bool(hit)
            print(f"{v} {e['id']} {prop} {k['f0']}-{k['f1']} {ease}: {'OK' if hit else 'missed'}; fitted: " + ', '.join(f"{s['f0']}-{s['f1']} {s['ease']}" for s in tw[:6]))
print(f'{got}/{tot} recovered (need 4)'); ok = got >= 4
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
