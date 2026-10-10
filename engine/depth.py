#!/usr/bin/env python3
"""Archive photo -> depth maps for engine/parallax.js ("photo to 3D").

    python3 engine/depth.py projects/<name> [--size=756] [--force]
    python3 engine/depth.py path/to/photo.jpg [...]          # single files, writes next to them

For every projects/<name>/assets/archive/*.jpg (also .jpeg/.png) this writes, into
projects/<name>/assets/archive/depth/:

    <stem>.depth.png   RGB8. R = near-ness (1 = nearest, Depth Anything's relative inverse depth,
                       robust-normalised and edge-aligned to the photo with a guided filter).
                       G = background near-ness: R with foreground objects eroded away and
                       smoothed, i.e. "what is behind them". B = disocclusion mask (255 where
                       G was pushed back behind a foreground object).
    <stem>.plate.jpg   The photo with the masked foreground inpainted from the surrounding
                       background: each masked pixel takes the colour of the
                       farthest pixel in its window (depth-ordered fill), then is softened, shown where the camera move disoccludes.
    <stem>.json        Sidecar: source hash, size, model, settings (cache key).

Model: Depth Anything V2 **Small** only (Apache-2.0). Base/Large/Giant are CC-BY-NC-4.0 and
must never be used here. It is downloaded once to .cache/models/ (99 MB, fp32 ONNX) from
MODEL_URL and checked against MODEL_SHA256. Runs on CPU with the onnxruntime already installed
for Kokoro: ~0.8 s at 518 px, ~2 s at 756 px.

Only numpy, onnxruntime and the ffmpeg binary are needed (no PIL / OpenCV on this box).
"""
import hashlib, json, os, struct, subprocess, sys, time, urllib.request, zlib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_URL = 'https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx'
MODEL_SHA256 = 'afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c'
MODEL_PATH = os.path.join(ROOT, '.cache', 'models', 'depth-anything-v2-small.onnx')
VERSION = 2  # bump to invalidate every cached depth map


# ---------------------------------------------------------------- io (ffmpeg + zlib)
def probe(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                                   '-of', 'csv=p=0:s=x', path]).decode().strip()
    w, h = out.split('x')[:2]
    return int(w), int(h)


def read_rgb(path, w=None, h=None):
    """Decode (and optionally resize with lanczos) to float32 RGB in [0,1], sRGB-encoded."""
    W, H = probe(path)
    w, h = w or W, h or H
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h}:flags=lanczos', '-frames:v', '1',
                                   '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32) / 255.0


def write_png(path, rgb8):
    h, w, c = rgb8.shape
    rows = np.concatenate([np.zeros((h, 1), np.uint8), rgb8.reshape(h, w * c)], axis=1)
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + \
        chunk(b'IDAT', zlib.compress(rows.tobytes(), 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def write_jpg(path, rgb, q=3):
    h, w, _ = rgb.shape
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-i', '-',
                          '-q:v', str(q), '-pix_fmt', 'yuvj444p', path], stdin=subprocess.PIPE)
    p.communicate((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())


# ---------------------------------------------------------------- image ops (numpy only)
def resize(a, w, h):
    """Bilinear resize of an HxW or HxWxC float array (pixel-centre aligned)."""
    H, W = a.shape[:2]
    ys = np.clip((np.arange(h) + 0.5) * H / h - 0.5, 0, H - 1)
    xs = np.clip((np.arange(w) + 0.5) * W / w - 0.5, 0, W - 1)
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int)
    y1 = np.minimum(y0 + 1, H - 1); x1 = np.minimum(x0 + 1, W - 1)
    fy = (ys - y0)[:, None]; fx = (xs - x0)[None, :]
    if a.ndim == 3: fy = fy[..., None]; fx = fx[..., None]
    top = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    bot = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return (top * (1 - fy) + bot * fy).astype(np.float32)


def box(a, r):
    """Mean filter with a (2r+1)^2 window, edge-normalised (summed-area table)."""
    if r <= 0: return a
    pad = np.pad(a, ((r + 1, r), (r + 1, r)) + ((0, 0),) * (a.ndim - 2), mode='edge').astype(np.float64)
    s = pad.cumsum(0).cumsum(1)
    k = 2 * r + 1
    out = s[k:, k:] - s[:-k, k:] - s[k:, :-k] + s[:-k, :-k]
    return (out / (k * k)).astype(np.float32)


def guided(I, p, r, eps):
    """He et al. guided filter: snaps the depth edges onto the photo's edges."""
    mI, mp = box(I, r), box(p, r)
    a = (box(I * p, r) - mI * mp) / (box(I * I, r) - mI * mI + eps)
    b = mp - a * mI
    return box(a, r) * I + box(b, r)


def minfilter(a, r):
    """Grey erosion with a square window (separable running minimum)."""
    H, W = a.shape
    p = np.pad(a, ((r, r), (0, 0)), mode='edge')
    out = p[0:H].copy()
    for d in range(1, 2 * r + 1): out = np.minimum(out, p[d:d + H])
    p = np.pad(out, ((0, 0), (r, r)), mode='edge')
    out = p[:, 0:W].copy()
    for d in range(1, 2 * r + 1): out = np.minimum(out, p[:, d:d + W])
    return out


def erode_carry(d, img, r):
    """Grey erosion of d that also carries the colour of the farthest pixel in the window: the
    background on the far side of an edge is what a camera move reveals, so fill from there."""
    H, W = d.shape
    for axis in (0, 1):
        pad = ((r, r), (0, 0)) if axis == 0 else ((0, 0), (r, r))
        pd, pc = np.pad(d, pad, mode='edge'), np.pad(img, pad + ((0, 0),), mode='edge')
        sl = (lambda k: (slice(k, k + H), slice(None))) if axis == 0 else (lambda k: (slice(None), slice(k, k + W)))
        bd, bc = pd[sl(0)].copy(), pc[sl(0)].copy()
        for k in range(1, 2 * r + 1):
            cd = pd[sl(k)]; m = cd < bd
            bd = np.where(m, cd, bd); bc = np.where(m[..., None], pc[sl(k)], bc)
        d, img = bd, bc
    return d, img


def maxfilter(m, r):
    return -minfilter(-m, r)


# ---------------------------------------------------------------- model
def model():
    if not os.path.exists(MODEL_PATH):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        print(f'[depth] downloading Depth Anything V2 Small (Apache-2.0) -> {MODEL_PATH}', file=sys.stderr)
        tmp = MODEL_PATH + '.part'
        urllib.request.urlretrieve(MODEL_URL, tmp)
        h = hashlib.sha256(open(tmp, 'rb').read()).hexdigest()
        if h != MODEL_SHA256:
            os.remove(tmp)
            raise SystemExit(f'[depth] checksum mismatch for {MODEL_URL}: {h}')
        os.rename(tmp, MODEL_PATH)
    import onnxruntime as ort
    so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count() or 4
    return ort.InferenceSession(MODEL_PATH, so, providers=['CPUExecutionProvider'])


def infer(sess, path, size):
    W, H = probe(path)
    s = size / max(W, H)
    w, h = max(14, round(W * s / 14) * 14), max(14, round(H * s / 14) * 14)
    x = read_rgb(path, w, h)
    x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    name = sess.get_inputs()[0].name
    d = sess.run(None, {name: x})[0]
    return np.squeeze(d).astype(np.float32)  # relative inverse depth (larger = nearer), h x w


# ---------------------------------------------------------------- pipeline
def process(sess, src, outdir, size=756, force=False):
    stem = os.path.splitext(os.path.basename(src))[0]
    os.makedirs(outdir, exist_ok=True)
    side = os.path.join(outdir, stem + '.json')
    digest = hashlib.sha1(open(src, 'rb').read()).hexdigest()
    key = {'src': digest, 'size': size, 'model': 'depth-anything-v2-small', 'version': VERSION}
    if not force and os.path.exists(side) and os.path.exists(os.path.join(outdir, stem + '.depth.png')):
        try:
            if {k: v for k, v in json.load(open(side)).items() if k in key} == key:
                return 'cached'
        except Exception:
            pass
    t0 = time.time()
    W, H = probe(src)
    s = min(1.0, 1280 / max(W, H))                         # depth/plate resolution (the photo itself stays full-res)
    ow, oh = max(2, round(W * s / 2) * 2), max(2, round(H * s / 2) * 2)
    raw = infer(sess, src, size)
    lo, hi = np.percentile(raw, 1), np.percentile(raw, 99.5)
    d = np.clip((raw - lo) / max(1e-6, hi - lo), 0, 1)
    d = resize(d, ow, oh)
    img = read_rgb(src, ow, oh)
    gray = img @ np.array([0.299, 0.587, 0.114], np.float32)
    # edge-align: a guided filter pulls the (soft, low-res) depth edges onto the photo's edges
    d = np.clip(guided(gray, d, max(2, ow // 320), 2e-3), 0, 1)
    # background near-ness: erode near things away, then smooth; never in front of the photo
    r = max(4, round(ow * 0.035))
    bg, far = erode_carry(d, img, r)
    bg = np.minimum(d, box(box(bg, r // 2), r // 2))
    occl = (d - bg) > 0.06
    occl = maxfilter(occl.astype(np.float32), max(2, r // 4)) > 0.5
    # fill the band with far-side colour, softened so the separable erosion leaves no streaks
    fill = box(box(far, max(2, r // 3)), max(2, r // 3))
    soft = box(occl.astype(np.float32), 3)[..., None]
    plate = img * (1 - soft) + fill * soft
    q = lambda a: (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)
    write_png(os.path.join(outdir, stem + '.depth.png'), np.stack([q(d), q(bg), q(occl.astype(np.float32))], -1))
    write_jpg(os.path.join(outdir, stem + '.plate.jpg'), plate)
    json.dump({**key, 'width': ow, 'height': oh, 'aspect': W / H, 'seconds': round(time.time() - t0, 2),
               'license': 'Depth Anything V2 Small, Apache-2.0'}, open(side, 'w'), indent=1)
    return f'{time.time() - t0:.1f}s'


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    opts = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in argv if a.startswith('--'))
    size = int(opts.get('size', 756))
    force = 'force' in opts
    jobs = []
    for a in args or ['.']:
        if os.path.isdir(a):
            arch = os.path.join(a, 'assets', 'archive') if os.path.isdir(os.path.join(a, 'assets', 'archive')) else a
            for f in sorted(os.listdir(arch)):
                if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.startswith('.'):
                    jobs.append((os.path.join(arch, f), os.path.join(arch, 'depth')))
        else:
            jobs.append((a, os.path.join(os.path.dirname(os.path.abspath(a)), 'depth')))
    if not jobs:
        print('[depth] no images found', file=sys.stderr); return
    sess = model()
    for src, outdir in jobs:
        print(f'[depth] {os.path.relpath(src, ROOT)}: {process(sess, src, outdir, size, force)}', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1:])
