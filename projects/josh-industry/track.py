"""Track Josh's face at 4 fps on a 960x540 proxy; write smoothed face centre (in 3840x2160 coords) per 0.25 s."""
import sys, json, subprocess, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
W, H, FPS = 960, 540, 4
import os
det = cv2.FaceDetectorYN.create(os.path.join(os.path.dirname(os.path.abspath(__file__)), "yunet.onnx"), "", (W, H), 0.6)
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-map", "0:v:0", "-vf", f"fps={FPS},scale={W}:{H}",
                      "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
pts = []
prev = None
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    g = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    f = det.detect(g)[1]
    cands = [] if f is None else [(x + w / 2, y + h / 2, h) for x, y, w, h in f[:, :4] if h > 60]
    if cands:
        if prev is None: c = max(cands, key=lambda c: c[2])
        else: c = min(cands, key=lambda c: (c[0] - prev[0]) ** 2 + (c[1] - prev[1]) ** 2 - 4 * c[2] ** 2)
        prev = c
        pts.append([c[0] * 4, c[1] * 4, c[2] * 4])
    else:
        pts.append(None)
# fill gaps, then smooth (~1.5 s window)
idx = [i for i, v in enumerate(pts) if v]
arr = np.array([pts[i] for i in idx], float)
full = np.stack([np.interp(range(len(pts)), idx, arr[:, k]) for k in range(3)], 1)
k = 7
ker = np.ones(k) / k
sm = np.stack([np.convolve(np.pad(full[:, j], k // 2, mode="edge"), ker, "valid") for j in range(3)], 1)
json.dump({"fps": FPS, "found": len(idx), "n": len(pts), "c": sm.round(1).tolist()}, open(out, "w"))
print(f"faces in {len(idx)}/{len(pts)} samples")
