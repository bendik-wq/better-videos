"""Text spec on the 'typed' benchmark: 'Every minute you spend' is typed one character every 2 frames from frame 10 into
a fixed speech bubble. Pass: scene.json gains shots[].texts = [{string, box:[x,y,w,h], first_frame_per_char:[...]}]
(shot-local frames) with the exact string (case-sensitive, single spaces) and >= 80 % of character first-frames
within ±2 frames of truth. python3 -I tools/revid/tests/test_text.py"""
import sys, os, json, shutil
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench'); OUT = '/tmp/revid-test-typed'
shutil.rmtree(OUT, ignore_errors=True)
S = revid.decompose(f'{B}/typed.mp4', OUT, verbose=False)
gt = json.load(open(f'{B}/typed.json'))['text'][0]
texts = S['shots'][0].get('texts', [])
print('found', [(t.get('string'), (t.get('first_frame_per_char') or [])[:6]) for t in texts])
ok = False
for t in texts:
    if t.get('string') == gt['string']:
        ff, tf = t.get('first_frame_per_char', []), gt['first_frame_per_char']
        # spaces have no ink: compare only non-space characters
        pairs = [(a, b) for a, b, ch in zip(ff, tf, gt['string']) if ch != ' ']
        good = sum(abs(a - b) <= 2 for a, b in pairs) / max(1, len(pairs))
        print(f'string matches; char timing within ±2 frames: {100*good:.0f}%'); ok = good >= 0.8
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
