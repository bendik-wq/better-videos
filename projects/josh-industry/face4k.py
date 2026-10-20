"""Face panel clips from 4K camera footage: a face-tracked tall crop, no upscaling needed.

    python3 face4k.py <recording.mp4> <track.json> <snapped.json> <out-dir> [ids...] [--sheet]

track.json comes from track.py (smoothed face centre and size, 4 samples/s, 3840x2160 coords).
Writes <out-dir>/<id>.mp4 at 576x824, 25 fps, no audio. Existing files are skipped.
--sheet writes <out-dir>/sheet-<id>.jpg (one frame per second) for checking framing instead.
"""
import json, os, subprocess, sys
import numpy as np
import cv2

PW, PH, FPS = 576, 824, 25      # panel size (matches composite.py)
SW, SH = 1920, 1080             # decode size (half of 4K)
HEAD = 0.36                     # face centre sits this far down the crop
FILL = 0.30                     # face height as a share of crop height


def crop_box(tr, t):
    """Crop (x, y, w, h) in SW x SH coords for time t, from the smoothed track."""
    c = tr["c"]
    i = min(max(t * tr["fps"], 0), len(c) - 1)
    a, b = int(i), min(int(i) + 1, len(c) - 1)
    f = i - a
    cx, cy, fh = [(c[a][k] * (1 - f) + c[b][k] * f) / 2 for k in range(3)]  # 4K -> 1080p
    h = min(SH, max(620, fh / FILL))
    w = h * PW / PH
    x = min(max(cx - w / 2, 0), SW - w)
    y = min(max(cy - h * HEAD, 0), SH - h)
    return x, y, w, h


def frames(src, t_in, dur):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{t_in:.3f}", "-t", f"{dur:.3f}", "-i", src, "-map", "0:v:0",
                          "-vf", f"fps={FPS},scale={SW}:{SH}:flags=bicubic", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                         stdout=subprocess.PIPE)
    n = SW * SH * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(SH, SW, 3)
    p.wait()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sheet = "--sheet" in sys.argv
    src, track, snapped, out = args[:4]
    tr = json.load(open(track))
    s = json.load(open(snapped))
    ids = args[4:] or [k for k in s if "#" in k]
    os.makedirs(out, exist_ok=True)
    for cid in ids:
        c = s[cid]
        dst = os.path.join(out, f"sheet-{cid}.jpg" if sheet else f"{cid}.mp4")
        if os.path.exists(dst):
            continue
        tmp = dst[:-4] + ".part" + dst[-4:]
        enc = None if sheet else subprocess.Popen(
            ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{PW}x{PH}", "-r", str(FPS),
             "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", tmp],
            stdin=subprocess.PIPE)
        thumbs = []
        for n, fr in enumerate(frames(src, c["in"], c["out"] - c["in"])):
            x, y, w, h = crop_box(tr, c["in"] + n / FPS)
            # sub-pixel crop + resize in one warp, so slow drifts don't step
            m = np.float32([[PW / w, 0, -x * PW / w], [0, PH / h, -y * PH / h]])
            img = cv2.warpAffine(fr, m, (PW, PH), flags=cv2.INTER_AREA if w > PW else cv2.INTER_CUBIC)
            if sheet:
                if n % FPS == 0:
                    thumbs.append(cv2.resize(img, (PW // 3, PH // 3)))
            else:
                enc.stdin.write(img.tobytes())
        if sheet:
            rows = [thumbs[i:i + 10] for i in range(0, len(thumbs), 10)]
            rows = [np.hstack(r + [np.zeros_like(thumbs[0])] * (10 - len(r))) for r in rows]
            cv2.imwrite(tmp, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])
        else:
            enc.stdin.close()
            enc.wait()
        os.replace(tmp, dst)
        print("done", cid, flush=True)


if __name__ == "__main__":
    main()
