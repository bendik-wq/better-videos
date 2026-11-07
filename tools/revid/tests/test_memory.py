"""Memory spec: run() on the full 13.6 s real-footage segment (854x480, 408 frames, reverse/kz-seg/clip.mp4, private
study) must peak under 4 GB RSS, finish in < 600 s, keep the rebuild verbatim (>= 90 dB) and understanding >= 60 %.
Today it is killed for lack of memory. python3 -I tools/revid/tests/test_memory.py"""
import sys, os, time, shutil, re, subprocess, resource
HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, '../../../reverse/kz-seg/clip.mp4'); OUT = '/tmp/revid-test-mem'
shutil.rmtree(OUT, ignore_errors=True)
t = time.time()
p = subprocess.run([sys.executable, '-I', os.path.join(HERE, '..', 'revid.py'), 'run', V, OUT], capture_output=True, text=True, timeout=900)
dt = time.time() - t
peak_gb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / 1024 / 1024
print(p.stdout[-800:]); print(p.stderr[-1500:])
ok = p.returncode == 0
if ok:
    sys.path.insert(0, os.path.join(HERE, '..')); import revid
    r, b = revid.understanding(OUT); share = r / max(1, r + b)
    pr = float(re.search(r'\| rebuild[^|]*\| ([\d.]+) dB', open(os.path.join(OUT, 'report.md')).read()).group(1))
    print(f'peak {peak_gb:.2f} GB (limit 4), time {dt:.0f}s (limit 600), understanding {100*share:.0f}% (need 60), rebuild {pr} dB')
    ok = peak_gb < 4 and dt < 600 and share >= 0.60 and pr >= 90
else:
    print(f'exit {p.returncode} after {dt:.0f}s, peak {peak_gb:.2f} GB')
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
