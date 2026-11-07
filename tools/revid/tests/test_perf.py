"""Performance spec on 3 s of real flat-animation footage (854x480, 90 frames, reverse/kz-seg/clip3.mp4, private study):
run() must finish in < 120 s, understanding >= 70 %, and the rebuild must stay verbatim (rebuild PSNR >= 90 dB).
Today: ~705 s, 79 %. python3 -I tools/revid/tests/test_perf.py"""
import sys, os, time, shutil, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import revid
V = os.path.join(os.path.dirname(__file__), '../../../reverse/kz-seg/clip3.mp4'); OUT = '/tmp/revid-test-perf'
shutil.rmtree(OUT, ignore_errors=True)
t = time.time(); revid.run(V, OUT); dt = time.time() - t
r, b = revid.understanding(OUT); share = r / max(1, r + b)
rep = open(os.path.join(OUT, 'report.md')).read(); pr = float(re.search(r'\| rebuild[^|]*\| ([\d.]+) dB', rep).group(1))
print(f'time {dt:.0f}s (limit 120), understanding {100*share:.0f}% (need 70), rebuild {pr} dB (need 90)')
ok = dt < 120 and share >= 0.70 and pr >= 90
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
