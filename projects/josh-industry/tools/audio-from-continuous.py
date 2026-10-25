"""16 Oct source audio rebuilt from the continuous long form (one unbroken take: programme time = 3.2 s + source time)."""
import subprocess, sys, wave, numpy as np
S = sys.argv[1]; C = "/home/user/better-videos/projects/josh-industry/out/continuous/josh-which-industry-continuous.mp4"
def dec(p, sr, ch=1):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vn", "-ac", str(ch), "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
ref = dec(f"{S}/../oct16/audio.wav", 16000); c16 = dec(C, 16000)
lags = []
for t in range(20, 640, 40):
    x = c16[round((3.2 + t) * 16000):round((3.2 + t + 4) * 16000)]
    y = ref[round(t * 16000) - 3200:round((t + 4) * 16000) + 3200]
    cc = np.correlate(y, x, "valid"); k = int(np.argmax(cc))
    lags.append((t, (k - 3200) / 16, round(float(cc[k] / (np.linalg.norm(x) * np.linalg.norm(y[k:k + len(x)]) + 1e-9)), 3)))
print(lags)
L = np.median([l for _, l, c in lags if c > .9]) / 1000
print("lag s", L)
a = dec(C, 48000, 2).reshape(-1, 2)
# content at source time s sits at programme time 3.2 + s - L
start = round((3.2 - L) * 48000)
src = a[start:start + round(648.52 * 48000)]
w = wave.open(f"{S}/audio48-16oct.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
w.writeframes((np.clip(src, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
