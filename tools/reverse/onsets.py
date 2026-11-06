# Strong sound onsets of a video: python3 -I onsets.py <video> -> JSON [seconds, ...]
# Spectral flux on a mono 22.05 kHz decode (ffmpeg), 1024/256 STFT, peaks above median + 6 MAD (calibrated to hyperframes' strong onsets), ≥ 0.25 s apart.
import sys, json, subprocess
import numpy as np
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-vn', '-ac', '1', '-ar', '22050', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32)
if len(x) < 4096: print('[]'); sys.exit()
N, Hp = 1024, 256
n = 1 + (len(x) - N) // Hp
win = np.hanning(N).astype(np.float32)
flux = np.empty(n, np.float32); prev = None
for i0 in range(0, n, 4096):  # in blocks to keep memory small
    idx = np.arange(i0, min(n, i0 + 4096))[:, None] * Hp + np.arange(N)[None, :]
    mag = np.log1p(np.abs(np.fft.rfft(x[idx] * win, axis=1)))
    d = np.diff(np.vstack([mag[:1] if prev is None else prev[None], mag]), axis=0)
    flux[i0:i0 + len(mag)] = np.maximum(d, 0).sum(1); prev = mag[-1]
med = np.median(flux); mad = np.median(np.abs(flux - med)) + 1e-9
K = float(sys.argv[2]) if len(sys.argv) > 2 else 6.0
thr = med + K * 1.4826 * mad
t = np.arange(n) * Hp / 22050
peaks = [i for i in range(1, n - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
sel = []
for i in peaks:
    if sel and t[i] - t[sel[-1]] < 0.25:
        if flux[i] > flux[sel[-1]]: sel[-1] = i
    else: sel.append(i)
print(json.dumps([round(float(t[i]), 3) for i in sel]))
