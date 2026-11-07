"""Pan spec: on the 'pan' benchmark (camera pans 320 px; a white bird flies independently on top) the bird must be one
track explained mostly by reusing a pose: understanding >= 70 %, model PSNR >= 45 dB, and other benchmarks must not
regress below: slide 95 %, typed 85 %, multi 75 %. python3 -I tools/revid/tests/test_pan.py"""
import sys, os, shutil, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench')
need = {'pan': 0.70, 'slide': 0.95, 'typed': 0.85, 'multi': 0.75}; ok = True
for v, th in need.items():
    out = f'/tmp/revid-test-{v}'; shutil.rmtree(out, ignore_errors=True)
    revid.run(f'{B}/{v}.mp4', out)
    r, b = revid.understanding(out); share = r / max(1, r + b)
    rep = open(os.path.join(out, 'report.md')).read(); m = float(re.search(r'\| model only[^|]*\| ([\d.]+) dB', rep).group(1))
    good = share >= th and (v != 'pan' or m >= 45); ok &= good
    print(f'{v}: understanding {100*share:.0f}% (need {100*th:.0f}%), model {m} dB {"ok" if good else "FAIL"}')
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
