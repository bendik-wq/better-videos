"""Model-quality spec: the layer model (before the residual) must stay faithful while understanding stays high.
Regression seen after the element-separation merge: typed 51 -> 29 dB, multi 49 -> 33 dB.
Pass: model PSNR >= slide 50, typed 45, multi 44, pan 45, scale_rot 44 dB, and understanding >= slide 95, typed 85,
multi 80, pan 80, scale_rot 60 %. python3 -I tools/revid/tests/test_quality.py"""
import sys, os, shutil, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import revid
B = os.path.join(os.path.dirname(__file__), '../../../reverse/bench')
need = {'slide': (50, .95), 'typed': (45, .85), 'multi': (44, .80), 'pan': (45, .80), 'scale_rot': (44, .60)}; ok = True
for v, (db, th) in need.items():
    out = f'/tmp/revid-test-q-{v}'; shutil.rmtree(out, ignore_errors=True)
    revid.run(f'{B}/{v}.mp4', out)
    r, b = revid.understanding(out); share = r / max(1, r + b)
    m = float(re.search(r'\| model only[^|]*\| ([\d.]+) dB', open(os.path.join(out, 'report.md')).read()).group(1))
    good = m >= db and share >= th; ok &= good
    print(f'{v}: model {m} dB (need {db}), understanding {100*share:.0f}% (need {100*th:.0f}%) {"ok" if good else "FAIL"}')
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
