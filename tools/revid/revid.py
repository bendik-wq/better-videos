#!/usr/bin/env python3
"""revid: reverse-engineer a video into layers (plate, sprites + per-frame transforms, baked patches, residual)
and render it back. See PLAN.md.

  python3 -I tools/revid/revid.py decompose <video> <out_dir> [--max-shot-frames N]
  python3 -I tools/revid/revid.py render <out_dir> [--no-residual] [--out file.mp4]
  python3 -I tools/revid/revid.py run <video> <out_dir>          # decompose + render + report

out_dir/scene.json      canvas, shots, layers, transforms, fits, metrics
out_dir/assets/         plate PNGs, sprite PNGs (RGBA), baked patch PNGs (RGBA)
out_dir/residual.mkv    lossless (FFV1) residual so the render is verbatim
out_dir/report.md       fidelity (PSNR/SSIM per shot, before/after residual) and understanding shares
"""
import json, math, os, subprocess, sys
import numpy as np
import cv2

# ------------------------------------------------------------------ io
def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', path],
                         capture_output=True, text=True, check=True).stdout
    d = json.loads(out); s = d['streams'][0]
    num, den = map(int, s['r_frame_rate'].split('/'))
    fps = num / den
    n = int(s.get('nb_frames') or round(float(d['format']['duration']) * fps))
    return int(s['width']), int(s['height']), fps, n


def read_frames(path, w, h):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size: break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


class Writer:
    def __init__(self, path, w, h, fps, lossless=False):
        codec = ['-c:v', 'ffv1'] if lossless else ['-c:v', 'libx264rgb', '-qp', '0', '-preset', 'veryfast'] if str(path).endswith('rebuild.mkv') else ['-c:v', 'libx264', '-crf', '10', '-pix_fmt', 'yuv444p']
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}',
                                   '-r', f'{fps}', '-i', '-', *codec, path], stdin=subprocess.PIPE)
    def write(self, f): self.p.stdin.write(np.ascontiguousarray(f, np.uint8).tobytes())
    def close(self): self.p.stdin.close(); self.p.wait()

# ------------------------------------------------------------------ metrics
def psnr(a, b):
    mse = np.mean((a.astype(np.float32) - b.astype(np.float32)) ** 2)
    return 99.0 if mse < 1e-10 else 10 * math.log10(255 ** 2 / mse)


def ssim(a, b):
    a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32); b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY).astype(np.float32)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    ma, mb = g(a), g(b); va, vb, cab = g(a * a) - ma * ma, g(b * b) - mb * mb, g(a * b) - ma * mb
    m = ((2 * ma * mb + C1) * (2 * cab + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
    return float(m.mean())

# ------------------------------------------------------------------ shots
def find_cuts(small, thr=30.0, ratio=3.0):
    """Hard cuts: frame-to-frame mean abs difference that is both large and far above its neighbours."""
    d = np.array([0.0] + [float(np.mean(np.abs(small[i].astype(np.int16) - small[i - 1].astype(np.int16)))) for i in range(1, len(small))])
    cuts = []
    for i in range(1, len(d)):
        local = np.median(d[max(1, i - 5):i + 6]) + 1.0
        if d[i] > thr and d[i] > ratio * local: cuts.append(i)
    return cuts

# ------------------------------------------------------------------ camera
def _shift(img, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    return cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR, borderValue=np.nan)


def _err(a, b, dx, dy, tex):
    """Median abs difference over textured pixels between a and b moved back by (dx, dy)."""
    d = np.abs(a - _shift(b, -dx, -dy))[tex]
    d = d[~np.isnan(d)]
    return float(np.median(d)) if d.size > 50 else 1e9


def camera_shifts(frames, rx=24, ry=8):
    """Translation-only camera, robust to moving elements. For each consecutive pair: brute-force search of the
    shift that best explains the change on textured pixels (4x downscale, then ±1.5 px refine at full res), accepted
    only if it beats 'no camera move' clearly AND the improvement spans at least half the frame width (a pan moves
    the whole picture; a moving element is local). Returns (n, 2) content offsets relative to frame 0."""
    g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]
    h, w = g[0].shape
    sm = [cv2.resize(x, (w // 4, h // 4), interpolation=cv2.INTER_AREA) for x in g]
    def texture(x):
        gx, gy = cv2.Sobel(x, cv2.CV_32F, 1, 0), cv2.Sobel(x, cv2.CV_32F, 0, 1)
        return np.hypot(gx, gy) > 20
    off = np.zeros((len(g), 2), np.float32)
    for i in range(1, len(g)):
        a, b = sm[i - 1], sm[i]; ta = texture(a)
        e0 = _err(a, b, 0, 0, ta)
        best = (e0, 0, 0)
        for dy in range(-(ry // 4), ry // 4 + 1):
            for dx in range(-(rx // 4) - 1, rx // 4 + 2):
                if dx == 0 and dy == 0: continue
                e = _err(a, b, dx, dy, ta)
                if e < best[0]: best = (e, dx, dy)
        A, Bf, T = g[i - 1], g[i], texture(g[i - 1])
        fine = (1e9, 0.0, 0.0)
        centres = {(0, 0), (best[1] * 4, best[2] * 4)}  # small moves vanish at 1/4 scale: always refine around 0 too
        for cx, cy in centres:
            for dy in np.arange(cy - 3, cy + 3.01, 0.5):
                for dx in np.arange(cx - 4, cx + 4.01, 0.5):
                    e = _err(A, Bf, dx, dy, T)
                    if e < fine[0]: fine = (e, float(dx), float(dy))
        if abs(fine[1]) < 0.25 and abs(fine[2]) < 0.25: off[i] = off[i - 1]; continue
        ez = _err(A, Bf, 0, 0, T)
        # whole-width test: columns (of 8) whose textured pixels are explained better by the shift
        cols = 0
        for cx8 in range(8):
            xs = slice(cx8 * w // 8, (cx8 + 1) * w // 8); t = T[:, xs]
            if t.sum() < 30: continue
            if _err(A[:, xs], Bf[:, xs], 0, 0, t) > 1.3 * max(0.5, _err_col(A, Bf, fine[1], fine[2], T, xs)): cols += 1
        keep = fine[0] < 0.6 * ez and cols >= 4
        off[i] = off[i - 1] + ((fine[1], fine[2]) if keep else (0.0, 0.0))
    return off


def _err_col(A, B, dx, dy, T, xs):
    d = np.abs(A - _shift(B, -dx, -dy))[:, xs][T[:, xs]]
    d = d[~np.isnan(d)]
    return float(np.median(d)) if d.size > 30 else 1e9


def plate_from(frames, off):
    """Median background plate on a canvas that holds every (camera-shifted) frame. Returns plate, origin (x0, y0)."""
    h, w = frames[0].shape[:2]
    xs, ys = -off[:, 0], -off[:, 1]  # where frame i's top-left sits on the canvas
    x0, y0 = int(math.floor(xs.min())), int(math.floor(ys.min()))
    W, H = int(math.ceil(xs.max())) - x0 + w, int(math.ceil(ys.max())) - y0 + h
    step = max(1, len(frames) // 60)  # median of ≤ ~60 samples
    idx = list(range(0, len(frames), step))
    stack = np.full((len(idx), H, W, 3), np.nan, np.float32)
    for k, i in enumerate(idx):
        M = np.float32([[1, 0, xs[i] - x0], [0, 1, ys[i] - y0]])
        warped = cv2.warpAffine(frames[i].astype(np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderValue=np.nan)
        stack[k] = warped
    plate = np.nanmedian(stack, axis=0)
    plate = np.where(np.isnan(plate), 0, plate)
    return np.clip(plate + 0.5, 0, 255).astype(np.uint8), (x0, y0)


def plate_view(plate, origin, o, w, h):
    """The part of the plate that frame with camera offset o shows."""
    x0, y0 = origin
    M = np.float32([[1, 0, x0 + o[0]], [0, 1, y0 + o[1]]])  # canvas -> frame coords
    return cv2.warpAffine(plate, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

# ------------------------------------------------------------------ foreground, tracking
def fg_mask(frame, bg, thr=22):
    d = np.max(np.abs(frame.astype(np.int16) - bg.astype(np.int16)), axis=2)
    m = (d > thr).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    return m, d


def components(m, min_area=40):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    return [dict(box=(int(st[i, 0]), int(st[i, 1]), int(st[i, 2]), int(st[i, 3])), area=int(st[i, 4]), c=cen[i].tolist())
            for i in range(1, n) if st[i, 4] >= min_area]


def iou(a, b):
    ax, ay, aw, ah = a; bx, by, bw, bh = b
    ix, iy = max(0, min(ax + aw, bx + bw) - max(ax, bx)), max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy; return inter / float(aw * ah + bw * bh - inter + 1e-9)


def track(comps_per_frame, max_gap=3):
    tracks = []  # {id, frames: {f: comp}}
    for f, comps in enumerate(comps_per_frame):
        used = set()
        for t in tracks:
            lf = max(t['frames']);
            if f - lf > max_gap: continue
            last = t['frames'][lf]; best, bs = None, 0.0
            for j, c in enumerate(comps):
                if j in used: continue
                s = iou(last['box'], c['box'])
                dist = math.hypot(last['c'][0] - c['c'][0], last['c'][1] - c['c'][1])
                s = max(s, 0.3 if dist < 0.6 * max(last['box'][2], last['box'][3], 20) else 0.0)
                if s > bs: best, bs = j, s
            if best is not None and bs >= 0.2: t['frames'][f] = comps[best]; used.add(best)
        for j, c in enumerate(comps):
            if j not in used: tracks.append(dict(id=len(tracks), frames={f: c}))
    return [t for t in tracks if len(t['frames']) >= 2]

# ------------------------------------------------------------------ element model
def cut_sprite(frame, bg, box, pad=4):
    h, w = frame.shape[:2]; x, y, bw, bh = box
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
    f = frame[y0:y1, x0:x1].astype(np.float32); b = bg[y0:y1, x0:x1].astype(np.float32)
    d = np.max(np.abs(f - b), axis=2)
    a = np.clip((d - 8) / 40.0, 0, 1)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    return np.dstack([f, a * 255]).astype(np.uint8), (x0, y0)


def fit_similarity(sprite, frame, bg, guess):
    """ECC affine fit of the sprite (RGBA) onto frame; returns 2x3 matrix (sprite -> frame) and quality."""
    h, w = frame.shape[:2]
    tmpl = cv2.cvtColor(sprite[..., :3], cv2.COLOR_BGR2GRAY).astype(np.float32)
    mask = (sprite[..., 3] > 128).astype(np.uint8)
    if mask.sum() < 20: return None, 0.0
    M = np.float32([[1, 0, guess[0]], [0, 1, guess[1]]])
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    try:
        # ECC aligns input to template: we want warp mapping template coords -> image coords
        cc, M = cv2.findTransformECC(tmpl, img, M, cv2.MOTION_AFFINE,
                                     (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 80, 1e-4), mask, 3)
    except cv2.error:
        return None, 0.0
    return M, float(cc)


def composite(bg, sprite, M, alpha_scale=1.0):
    h, w = bg.shape[:2]
    rgba = cv2.warpAffine(sprite, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0)).astype(np.float32)
    a = rgba[..., 3:4] / 255.0 * alpha_scale
    return (bg.astype(np.float32) * (1 - a) + rgba[..., :3] * a)

# ------------------------------------------------------------------ easing fit (after reanimate's easing.ts, MIT)
def _bez(x1, y1, x2, y2):
    def f(t):
        lo, hi = 0.0, 1.0
        for _ in range(30):
            m = (lo + hi) / 2; x = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m * m * x2 + m ** 3
            lo, hi = (m, hi) if x < t else (lo, m)
        m = (lo + hi) / 2; return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m * m * y2 + m ** 3
    return f
EASINGS = {'linear': lambda t: t, 'power1.in': _bez(.55, .085, .68, .53), 'power2.in': _bez(.55, .055, .675, .19),
           'power3.in': _bez(.895, .03, .685, .22), 'power1.out': _bez(.25, .46, .45, .94), 'power2.out': _bez(.215, .61, .355, 1),
           'power3.out': _bez(.165, .84, .44, 1), 'power4.out': _bez(.23, 1, .32, 1), 'power1.inOut': _bez(.455, .03, .515, .955),
           'power2.inOut': _bez(.645, .045, .355, 1), 'power3.inOut': _bez(.77, 0, .175, 1), 'expo.out': _bez(.19, 1, .22, 1),
           'expo.inOut': _bez(1, 0, 0, 1), 'sine.inOut': _bez(.445, .05, .55, .95), 'back.out': _bez(.175, .885, .32, 1.275),
           'back.in': _bez(.6, -.28, .735, .045), 'back.inOut': _bez(.68, -.55, .265, 1.55)}


def fit_segments(series, fps, eps_frac=0.01):
    """Split a per-frame value series into hold/move segments and fit each move with the best named easing."""
    v = np.asarray(series, np.float64); n = len(v)
    if n < 3: return []
    rng = v.max() - v.min()
    if rng < 0.5: return [dict(kind='hold', f0=0, f1=n - 1, v=float(v.mean()))]
    eps = max(rng * eps_frac, 0.05); moving = np.abs(np.diff(v)) > eps
    segs, i = [], 0
    while i < n - 1:
        j = i
        while j < n - 1 and moving[j] == moving[i]: j += 1
        segs.append((i, j, bool(moving[i]))); i = j
    out = []
    for f0, f1, mv in segs:
        if not mv: out.append(dict(kind='hold', f0=f0, f1=f1, v=float(v[f0:f1 + 1].mean()))); continue
        a, b = v[f0], v[f1]; span = b - a
        if abs(span) < 1e-6: continue
        t = np.linspace(0, 1, f1 - f0 + 1); y = (v[f0:f1 + 1] - a) / span
        best = min(((float(np.sqrt(np.mean((np.array([fn(x) for x in t]) - y) ** 2))), name) for name, fn in EASINGS.items()))
        out.append(dict(kind='tween', f0=f0, f1=f1, v0=float(a), v1=float(b), ease=best[1], rmse=round(best[0], 4)))
    return out

# ------------------------------------------------------------------ decompose
def decompose(video, out, max_frames=900, verbose=True):
    os.makedirs(os.path.join(out, 'assets'), exist_ok=True)
    w, h, fps, n = probe(video)
    frames = list(read_frames(video, w, h))
    n = len(frames)
    small = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (64, 36), interpolation=cv2.INTER_AREA) for f in frames]
    cuts = find_cuts(small)
    bounds = [0] + cuts + [n]
    scene = dict(source=os.path.abspath(video), width=w, height=h, fps=fps, frames=n, cuts=cuts, shots=[])
    for si in range(len(bounds) - 1):
        a, b = bounds[si], bounds[si + 1]
        F = frames[a:b]
        off = camera_shifts(F)
        plate, origin = plate_from(F, off)
        pid = f'plate_{si:02d}.png'; cv2.imwrite(os.path.join(out, 'assets', pid), plate)
        bgs = [plate_view(plate, origin, off[i], w, h) for i in range(len(F))]
        masks, comps = [], []
        for i, f in enumerate(F):
            m, _ = fg_mask(f, bgs[i]); masks.append(m); comps.append(components(m))
        tracks = track(comps)
        layers = []
        for t in tracks:
            fids = sorted(t['frames'])
            key = max(fids, key=lambda f: t['frames'][f]['area'])
            spr, (sx, sy) = cut_sprite(F[key], bgs[key], t['frames'][key]['box'])
            sid = f's{si:02d}_e{t["id"]:03d}.png'; cv2.imwrite(os.path.join(out, 'assets', sid), spr)
            per, baked = {}, {}
            kc = t['frames'][key]['c']
            for f in fids:
                c = t['frames'][f]['c']
                guess = (sx + c[0] - kc[0], sy + c[1] - kc[1])
                M, cc = fit_similarity(spr, F[f], bgs[f], guess)
                x, y, bw, bh = t['frames'][f]['box']; pad = 4
                x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
                ok = False
                if M is not None:
                    comp = composite(bgs[f], spr, M)
                    q = psnr(comp[y0:y1, x0:x1], F[f][y0:y1, x0:x1])
                    ok = q >= 30.0
                if ok:
                    per[f] = M.tolist()
                else:  # baked patch: the original pixels of this element in this frame, with alpha
                    patch, (px, py) = cut_sprite(F[f], bgs[f], (x, y, bw, bh))
                    bid = f's{si:02d}_e{t["id"]:03d}_f{f:04d}.png'; cv2.imwrite(os.path.join(out, 'assets', bid), patch)
                    baked[f] = dict(img=bid, x=px, y=py)
            # motion fits on the rigid frames
            fits = {}
            if len(per) >= 3:
                fs = sorted(per); P = np.array([per[f] for f in fs])
                tx, ty = P[:, 0, 2], P[:, 1, 2]; sc = np.sqrt(P[:, 0, 0] ** 2 + P[:, 1, 0] ** 2); rot = np.degrees(np.arctan2(P[:, 1, 0], P[:, 0, 0]))
                for name, ser in (('x', tx), ('y', ty), ('scale', sc), ('rotate', rot)):
                    fits[name] = [dict(s, f0=fs[s['f0']], f1=fs[s['f1']]) for s in fit_segments(ser, fps)]
            layers.append(dict(id=f'e{t["id"]:03d}', sprite=sid, first=fids[0], last=fids[-1],
                               rigid={str(k): v for k, v in per.items()}, baked={str(k): v for k, v in baked.items()}, fits=fits))
        scene['shots'].append(dict(index=si, start=a, end=b, plate=pid, origin=list(origin), camera=off.tolist(), layers=layers))
        if verbose:
            nr = sum(len(L['rigid']) for L in layers); nb = sum(len(L['baked']) for L in layers)
            print(f'[revid] shot {si}: frames {a}-{b - 1}, camera pan {off[-1].round(1).tolist()}, {len(layers)} elements, '
                  f'{nr} rigid element-frames, {nb} baked', flush=True)
    json.dump(scene, open(os.path.join(out, 'scene.json'), 'w'), indent=1)
    return scene

# ------------------------------------------------------------------ render
def render(out, residual=True, out_file=None, write_residual=False, verbose=True):
    S = json.load(open(os.path.join(out, 'scene.json')))
    w, h, fps = S['width'], S['height'], S['fps']
    A = lambda name, flag=cv2.IMREAD_UNCHANGED: cv2.imread(os.path.join(out, 'assets', name), flag)
    model_file = out_file or os.path.join(out, 'model.mp4')
    wr = Writer(model_file, w, h, fps)
    res_path = os.path.join(out, 'residual.mkv')
    rw = Writer(res_path, w, h, fps, lossless=True) if write_residual else None
    rr = read_frames(res_path, w, h) if (residual and not write_residual and os.path.exists(res_path)) else None
    orig = read_frames(S['source'], w, h)
    stats = []
    for sh in S['shots']:
        plate = A(sh['plate'], cv2.IMREAD_COLOR); cam = np.array(sh['camera']); origin = sh['origin']
        sprites = {L['id']: A(L['sprite']) for L in sh['layers']}
        P, Q = [], []
        for i in range(sh['end'] - sh['start']):
            f = i  # shot-local frame index
            img = plate_view(plate, origin, cam[i], w, h).astype(np.float32)
            for L in sh['layers']:
                k = str(f)
                if k in L['rigid']: img = composite(img, sprites[L['id']], np.float32(L['rigid'][k]))
                elif k in L['baked']:
                    bk = L['baked'][k]; M = np.float32([[1, 0, bk['x']], [0, 1, bk['y']]])
                    img = composite(img, A(bk['img']), M)
            model = np.clip(img + 0.5, 0, 255).astype(np.uint8)
            o = next(orig)
            if rw is not None:  # residual = original - model, stored offset by 128 (lossless)
                rw.write(np.clip(o.astype(np.int16) - model.astype(np.int16) + 128, 0, 255).astype(np.uint8))
            out_f = model
            if rr is not None:
                r = next(rr).astype(np.int16) - 128
                out_f = np.clip(model.astype(np.int16) + r, 0, 255).astype(np.uint8)
            wr.write(out_f)
            P.append(psnr(model, o)); Q.append(ssim(model, o) if i % 3 == 0 else np.nan)
        st = dict(shot=sh['index'], psnr_model=round(float(np.mean(P)), 2), ssim_model=round(float(np.nanmean(Q)), 4))
        stats.append(st)
        if verbose: print(f'[revid] shot {sh["index"]}: model PSNR {st["psnr_model"]} dB, SSIM {st["ssim_model"]}', flush=True)
    wr.close()
    if rw: rw.close()
    return stats


def understanding(out):
    """Share of foreground element-frames explained by a rigid sprite+transform (vs baked)."""
    S = json.load(open(os.path.join(out, 'scene.json')))
    r = sum(len(L['rigid']) for sh in S['shots'] for L in sh['layers']); b = sum(len(L['baked']) for sh in S['shots'] for L in sh['layers'])
    return r, b


def verify_file(a, b, w, h):
    P, Q = [], []
    for i, (x, y) in enumerate(zip(read_frames(a, w, h), read_frames(b, w, h))):
        P.append(psnr(x, y)); Q.append(ssim(x, y) if i % 3 == 0 else np.nan)
    return round(float(np.mean(P)), 2), round(float(np.nanmean(Q)), 4), round(float(np.min(P)), 2)


def run(video, out):
    S = decompose(video, out)
    w, h = S['width'], S['height']
    stats = render(out, residual=False, out_file=os.path.join(out, 'model.mp4'), write_residual=True)
    render(out, residual=True, out_file=os.path.join(out, 'rebuild.mkv'), verbose=False)
    pm, sm, pmin = verify_file(video, os.path.join(out, 'model.mp4'), w, h)
    pr, sr, rmin = verify_file(video, os.path.join(out, 'rebuild.mkv'), w, h)
    r, b = understanding(out)
    fits = [(L['id'], k, s) for sh in S['shots'] for L in sh['layers'] for k, segs in L['fits'].items() for s in segs if s['kind'] == 'tween']
    rep = [f'# revid report: {os.path.basename(video)}', '',
           f'{w}×{h} @ {S["fps"]:.3f} fps, {S["frames"]} frames, {len(S["shots"])} shots (cuts at {S["cuts"]})', '',
           '| | PSNR mean | PSNR worst frame | SSIM |', '|---|---|---|---|',
           f'| model only (plate + sprites + baked) | {pm} dB | {pmin} dB | {sm} |',
           f'| rebuild (model + residual) | {pr} dB | {rmin} dB | {sr} |', '',
           f'Understanding: {r} element-frames as rigid sprite + transform, {b} baked ({100 * r / max(1, r + b):.0f} % modelled).', '',
           '## Shots'] + [f'- shot {s["shot"]}: model PSNR {s["psnr_model"]} dB, SSIM {s["ssim_model"]}' for s in stats] + \
          ['', '## Fitted moves (GSAP eases)'] + [f'- {e} {k}: frames {s["f0"]}–{s["f1"]}, {s["v0"]:.1f} → {s["v1"]:.1f}, {s["ease"]} (rmse {s["rmse"]})' for e, k, s in fits[:60]]
    open(os.path.join(out, 'report.md'), 'w').write('\n'.join(rep) + '\n')
    print('\n'.join(rep[:9]))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    if a[0] == 'decompose': decompose(a[1], a[2])
    elif a[0] == 'render': render(a[1], residual='--no-residual' not in a)
    elif a[0] == 'run': run(a[1], a[2])
    else: print(__doc__); sys.exit(1)
