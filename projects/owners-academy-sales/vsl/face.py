"""Upscale Josh's webcam tile into a tall face panel.

The masterclass only has Josh as a 320x180 Zoom thumbnail. For each clip we crop a 126x180
portrait around his face, upscale it 4x with Real-ESRGAN (realesr-general-x4v3), then run
optionally (--restore) GFPGAN v1.4 face restoration blended at `--weight`. GFPGAN costs ~6 s per
frame on a 4-core CPU, so the default is Real-ESRGAN only; the composite blends some of the original
texture back in and adds grain to take the waxy look off.

    python3 face.py <recording.mp4> <snapped.json> <models-dir> <out-dir> [clip-id ...]
    python3 face.py ... --test 60          # first 60 frames of the first clip, prints fps

Writes <out-dir>/<clip-id>.mp4 (504x720, 25 fps, no audio). Existing files are skipped.
"""
import argparse
import json
import os
import subprocess
import time

import cv2
import numpy as np
import torch
from basicsr.archs.srvgg_arch import SRVGGNetCompact
from gfpgan import GFPGANer

CROP = (126, 180, 1662, 0)  # w, h, x, y inside the 1920x1080 recording
SCALE = 4
FPS = 25


def load_sr(path):
    net = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type="prelu")
    state = torch.load(path, map_location="cpu")
    net.load_state_dict(state.get("params", state), strict=True)
    return net.eval()


@torch.inference_mode()
def upscale(net, batch):
    """batch: list of HxWx3 BGR uint8 frames -> list of 4x frames."""
    x = torch.from_numpy(np.stack(batch)[..., ::-1].astype(np.float32) / 255).permute(0, 3, 1, 2)
    y = net(x).clamp_(0, 1).permute(0, 2, 3, 1).numpy()
    return [np.ascontiguousarray((f[..., ::-1] * 255).round().astype(np.uint8)) for f in y]


def batched(it, n=8):
    buf = []
    for f in it:
        buf.append(f)
        if len(buf) == n:
            yield buf
            buf = []
    if buf:
        yield buf


def frames(src, t_in, dur):
    w, h, x, y = CROP
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{t_in:.2f}", "-t", f"{dur:.2f}", "-i", src,
                          "-vf", f"crop={w}:{h}:{x}:{y},fps={FPS}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                         stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


def run(src, t_in, dur, sr, restorer, weight, out, limit=None):
    w, h = CROP[0] * SCALE, CROP[1] * SCALE
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                            "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                            "-crf", "16", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    t0, n = time.time(), 0
    for batch in batched(frames(src, t_in, dur)):
        for big in upscale(sr, batch):
            if restorer is not None:
                _, _, big = restorer.enhance(big, has_aligned=False, only_center_face=True,
                                             paste_back=True, weight=weight)
            enc.stdin.write(big.tobytes())
            n += 1
        if limit and n >= limit:
            break
    enc.stdin.close()
    enc.wait()
    return n, time.time() - t0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("snapped")
    ap.add_argument("models")
    ap.add_argument("out")
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--weight", type=float, default=0.5)
    ap.add_argument("--restore", action="store_true", help="GFPGAN pass (~6 s/frame on 4 CPUs)")
    ap.add_argument("--test", type=int, default=0)
    a = ap.parse_args()
    torch.set_num_threads(os.cpu_count())
    os.makedirs(a.out, exist_ok=True)
    sr = load_sr(os.path.join(a.models, "realesr-general-x4v3.pth"))
    restorer = None if not a.restore else GFPGANer(model_path=os.path.join(a.models, "GFPGANv1.4.pth"), upscale=1,
                                                  arch="clean", channel_multiplier=2, bg_upsampler=None)
    snapped = json.load(open(a.snapped))
    ids = a.ids or list(snapped)
    for cid in ids:
        s = snapped[cid]
        out = os.path.join(a.out, f"{cid}{'-test' if a.test else ''}.mp4")
        if os.path.exists(out) and not a.test:
            continue
        tmp = out[:-4] + ".part.mp4"  # renamed only when complete, so a killed run never leaves a short clip
        n, secs = run(a.src, s["in"], s["out"] - s["in"], sr, restorer, a.weight, tmp, a.test or None)
        os.replace(tmp, out)
        print(f"{cid}: {n} frames in {secs:.0f}s ({n / max(secs, 1e-6):.2f} fps)", flush=True)
        if a.test:
            break


if __name__ == "__main__":
    main()
