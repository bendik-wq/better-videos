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

_OCR_ENGINE = None

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


def read_frames(path, w, h, pix='bgr24'):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', pix, '-'],
                         stdout=subprocess.PIPE)
    dt = np.uint16 if pix.endswith('48le') else np.uint8
    size = w * h * 3 * np.dtype(dt).itemsize
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size: break
        yield np.frombuffer(buf, dt).reshape(h, w, 3)
    p.wait()


class Writer:
    def __init__(self, path, w, h, fps, lossless=False, pix='bgr24'):
        self.pix = pix
        codec = ['-c:v', 'ffv1'] if lossless else ['-c:v', 'libx264rgb', '-qp', '0', '-preset', 'veryfast'] if str(path).endswith('rebuild.mkv') else ['-c:v', 'libx264', '-crf', '10', '-pix_fmt', 'yuv444p']
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', pix, '-s', f'{w}x{h}',
                                   '-r', f'{fps}', '-i', '-', *codec, path], stdin=subprocess.PIPE)
    def write(self, f): self.p.stdin.write(np.ascontiguousarray(f, np.uint16 if self.pix.endswith('48le') else np.uint8).tobytes())
    def close(self): self.p.stdin.close(); self.p.wait()

# ------------------------------------------------------------------ metrics
def psnr(a, b):
    mse = np.mean((a.astype(np.float32) - b.astype(np.float32)) ** 2)
    return 99.0 if mse < 1e-10 else 10 * math.log10(255 ** 2 / mse)


def _psnr_weighted(a, b, weight):
    """Weighted PSNR. `weight` is a 2-D float mask/weight map broadcast over RGB."""
    weight = np.asarray(weight, np.float32)
    if weight.ndim == 2:
        weight = weight[..., None]
    wsum = float(weight.sum())
    if wsum < 1e-6:
        return 1.0
    diff = a.astype(np.float32) - b.astype(np.float32)
    mse = float((weight * diff ** 2).sum() / wsum)
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


def _texture(x):
    gx, gy = cv2.Sobel(x, cv2.CV_32F, 1, 0), cv2.Sobel(x, cv2.CV_32F, 0, 1)
    return np.hypot(gx, gy) > 20


def _median_hist(d):
    """Fast exact median for integer absolute differences in 0..255."""
    n = int(d.size)
    if n <= 50:
        return float(np.median(d)) if n else 1e9
    counts = np.bincount(d, minlength=256)
    csum = np.cumsum(counts)
    if n & 1:
        return float(np.searchsorted(csum, n // 2, side='right'))
    v1 = np.searchsorted(csum, n // 2 - 1, side='right')
    v2 = np.searchsorted(csum, n // 2, side='right')
    return (float(v1) + float(v2)) / 2.0


def _err_med(a, b, tex, dx, dy):
    """Median abs difference for float grey pyramids.

    This mirrors cv2.warpAffine(b, [[1, 0, -dx], [0, 1, -dy]]): the output at
    (y, x) reads from b(y + dy, x + dx), so the overlap is a[ys:ye, xs:xe]
    vs b[ys + dy:ye + dy, xs + dx:xe + dx].
    """
    h, w = a.shape
    ys = max(0, -dy)
    ye = min(h, h - dy)
    xs = max(0, -dx)
    xe = min(w, w - dx)
    if ys >= ye or xs >= xe:
        return 1e9
    d = np.abs(a[ys:ye, xs:xe] - b[ys + dy:ye + dy, xs + dx:xe + dx])[tex[ys:ye, xs:xe]]
    return float(np.median(d)) if d.size > 50 else 1e9


def _err_int(a, b, tex, dx, dy):
    """Fast integer-slice error for full-resolution uint8 grey frames."""
    h, w = a.shape
    ys = max(0, -dy)
    ye = min(h, h - dy)
    xs = max(0, -dx)
    xe = min(w, w - dx)
    if ys >= ye or xs >= xe:
        return 1e9
    av = a[ys:ye, xs:xe].astype(np.int16)
    bv = b[ys + dy:ye + dy, xs + dx:xe + dx].astype(np.int16)
    d = np.abs(av - bv)[tex[ys:ye, xs:xe]]
    if d.size <= 50:
        return 1e9
    return _median_hist(d)


def _err_frac(a, b, tex, dx, dy):
    """Median abs difference for fractional (usually half-pixel) shifts."""
    M = np.float32([[1, 0, -dx], [0, 1, -dy]])
    shifted = cv2.warpAffine(b, M, (a.shape[1], a.shape[0]), flags=cv2.INTER_LINEAR, borderValue=np.nan)
    d = np.abs(a - shifted)[tex]
    d = d[~np.isnan(d)]
    return float(np.median(d)) if d.size > 50 else 1e9


def camera_shifts(frames, rx=24, ry=8):
    """Translation-only camera, robust to moving elements. For each consecutive pair: coarse-to-fine integer search,
    then a half-pixel refinement around the best integer shift. Accepted only if it beats 'no camera move' clearly
    AND the improvement spans at least half the frame width (a pan moves the whole picture; a moving element is
    local). Returns (n, 2) content offsets relative to frame 0."""
    g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]
    h, w = g[0].shape
    half = [cv2.resize(x, (w // 2, h // 2), interpolation=cv2.INTER_AREA) for x in g]
    sm = [cv2.resize(x, (w // 4, h // 4), interpolation=cv2.INTER_AREA) for x in g]

    off = np.zeros((len(g), 2), np.float32)

    for i in range(1, len(g)):
        A, Bf = g[i - 1], g[i]
        A8 = A.astype(np.uint8)
        B8 = Bf.astype(np.uint8)
        T = _texture(A)

        # The whole-width acceptance rule can only pass if at least 4 of 8
        # column strips contain enough textured pixels. If not, no pan can be
        # accepted, so skip the expensive search.
        strips = 0
        for cx8 in range(8):
            xs = slice(cx8 * w // 8, (cx8 + 1) * w // 8)
            if T[:, xs].sum() > 50:
                strips += 1
        if strips < 4:
            off[i] = off[i - 1]
            continue

        e0 = _err_int(A8, B8, T, 0, 0)
        if e0 < 0.5:  # essentially unchanged texture
            off[i] = off[i - 1]
            continue

        # Quarter-resolution coarse search (float pyramid, as originally).
        a_s, b_s = sm[i - 1], sm[i]
        tq = _texture(a_s)
        e0_s = _err_med(a_s, b_s, tq, 0, 0)
        best_s = (e0_s, 0, 0)
        for dy_s in range(-(ry // 4), ry // 4 + 1):
            for dx_s in range(-(rx // 4) - 1, rx // 4 + 2):
                if dx_s == 0 and dy_s == 0:
                    continue
                e = _err_med(a_s, b_s, tq, dx_s, dy_s)
                if e < best_s[0]:
                    best_s = (e, dx_s, dy_s)

        # Half-resolution stage around the coarse winner. The range is broad
        # enough to cover coarse rounding but much smaller than an exhaustive
        # half-res search.
        a_h, b_h = half[i - 1], half[i]
        th = _texture(a_h)
        cx_h = best_s[1] * 2
        cy_h = best_s[2] * 2
        best_h = (1e9, 0, 0)
        for dy_h in range(cy_h - 2, cy_h + 3):
            for dx_h in range(cx_h - 4, cx_h + 5):
                e = _err_med(a_h, b_h, th, dx_h, dy_h)
                if e < best_h[0]:
                    best_h = (e, dx_h, dy_h)

        # Full-resolution integer search around the half-resolution winner.
        cx_f = best_h[1] * 2
        cy_f = best_h[2] * 2
        best_f = (1e9, 0.0, 0.0)
        for dy_f in range(cy_f - 2, cy_f + 3):
            for dx_f in range(cx_f - 2, cx_f + 3):
                e = _err_int(A8, B8, T, dx_f, dy_f)
                if e < best_f[0]:
                    best_f = (e, float(dx_f), float(dy_f))

        # 0.5 px refinement around the best integer shift.
        fine = best_f
        bx = int(round(fine[1]))
        by = int(round(fine[2]))
        for dy_off in (-0.5, 0.0, 0.5):
            for dx_off in (-0.5, 0.0, 0.5):
                if dx_off == 0.0 and dy_off == 0.0:
                    continue
                e = _err_frac(A, Bf, T, bx + dx_off, by + dy_off)
                if e < fine[0]:
                    fine = (e, float(bx + dx_off), float(by + dy_off))

        if abs(fine[1]) < 0.25 and abs(fine[2]) < 0.25:
            off[i] = off[i - 1]
            continue

        ez = e0

        # Vectorised whole-width test: one warp for the fine shift, then per-column medians.
        M_fine = np.float32([[1, 0, -fine[1]], [0, 1, -fine[2]]])
        shifted_fine = cv2.warpAffine(Bf, M_fine, (w, h), flags=cv2.INTER_LINEAR, borderValue=np.nan)
        D0 = np.abs(A - Bf)
        Ds = np.abs(A - shifted_fine)

        cols = 0
        for cx8 in range(8):
            xs = slice(cx8 * w // 8, (cx8 + 1) * w // 8)
            t = T[:, xs]
            if t.sum() <= 50:
                continue

            d0_col = D0[:, xs][t]
            e_zero = float(np.median(d0_col)) if d0_col.size > 50 else 1e9

            df_col = Ds[:, xs][t]
            df_col = df_col[~np.isnan(df_col)]
            e_fine_col = float(np.median(df_col)) if df_col.size > 30 else 1e9

            if e_zero > 1.3 * max(0.5, e_fine_col):
                cols += 1

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
        warped = cv2.warpAffine(frames[i].astype(np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        valid = cv2.warpAffine(np.ones((h, w), np.uint8), M, (W, H), flags=cv2.INTER_NEAREST, borderValue=0) > 0
        warped[~valid] = np.nan  # coverage from a nearest-neighbour mask, so edge pixels never read the NaN border
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


CORE_THR = 32
SPLIT_COLOR_DIST = 80.0
CLUSTER_MAX_RES = 32.0
MERGE_COLOR_DIST = 45.0


def _components_raw(m, min_area=40, offset=(0, 0)):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    ox, oy = offset
    comps = []
    for i in range(1, n):
        if st[i, 4] < min_area: continue
        comps.append(dict(
            box=(int(st[i, 0] + ox), int(st[i, 1] + oy), int(st[i, 2]), int(st[i, 3])),
            area=int(st[i, 4]),
            c=[float(cen[i, 0] + ox), float(cen[i, 1] + oy)]
        ))
    return comps


def _sig_from_box(frame, d, box):
    x, y, bw, bh = box
    if bw < 1 or bh < 1: return None
    sub = d[y:y + bh, x:x + bw]
    core = sub > CORE_THR
    if core.sum() >= 16:
        return frame[y:y + bh, x:x + bw][core].astype(np.float32).mean(axis=0).tolist()
    soft = sub > 18
    if soft.sum() > 4:
        return frame[y:y + bh, x:x + bw][soft].astype(np.float32).mean(axis=0).tolist()
    return None


def _choose_color_clusters(samples, min_area):
    if len(samples) < 30:
        return None
    if len(samples) > 3000:
        idx = np.linspace(0, len(samples) - 1, 3000).astype(np.int32)
        samples = samples[idx]
    data = samples.reshape(-1, 1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
    flags = cv2.KMEANS_PP_CENTERS
    min_pixels = max(12, min_area // 2)
    # Prefer the smallest number of clusters that gives compact clusters.  A single
    # object (even with a slight gradient) should not be split into several pieces.
    # Touching anti-aliased objects, however, often have a few blended edge pixels,
    # so allow a slightly looser two-cluster split when the two dominant colours
    # are far apart and both clusters are substantial.
    relaxed = None
    for K in (2, 3):
        if len(samples) < K * min_pixels:
            continue
        try:
            _, labels, centers = cv2.kmeans(data, K, None, crit, 5, flags)
        except cv2.error:
            continue
        labels = labels.ravel()
        counts = np.bincount(labels, minlength=K)
        if counts.min() < min_pixels:
            continue
        centers = np.asarray(centers, np.float32)
        ok = True
        for i in range(K):
            for j in range(i + 1, K):
                if float(np.linalg.norm(centers[i] - centers[j])) < SPLIT_COLOR_DIST:
                    ok = False
                    break
            if not ok:
                break
        if not ok:
            continue
        residual = float(np.linalg.norm(samples.astype(np.float32) - centers[labels], axis=1).mean())
        if residual <= CLUSTER_MAX_RES:
            return centers, K
        if K == 2 and residual <= CLUSTER_MAX_RES * 2.5:
            relaxed = (centers, K)
    return relaxed


def _split_color_component(frame, d, m, comp, min_area):
    x, y, bw, bh = comp['box']
    if bw < 4 or bh < 4 or comp['area'] < 80:
        return []
    sub_m = (m[y:y + bh, x:x + bw] > 0)
    d_sub = d[y:y + bh, x:x + bw]
    frame_sub = frame[y:y + bh, x:x + bw]
    core = sub_m & (d_sub > CORE_THR)
    if core.sum() < max(24, min_area):
        return []
    samples = frame_sub[core].astype(np.float32)
    chosen = _choose_color_clusters(samples, min_area)
    if chosen is None:
        return []
    centers, K = chosen

    flat = frame_sub[sub_m].astype(np.float32)
    dists = ((flat[:, None, :] - centers[None, :, :]) ** 2).sum(2)
    assign_map = np.zeros((bh, bw), np.int16)
    assign_map[sub_m] = dists.argmin(1).astype(np.int16)

    out = []
    for k in range(K):
        allow = ((assign_map == k) & sub_m).astype(np.uint8)
        if allow.sum() < min_area:
            continue
        core_k = (assign_map == k).astype(np.uint8)
        core_k[~core] = 0
        n, lab, stats, _ = cv2.connectedComponentsWithStats(core_k, 8)
        if n <= 1:
            continue
        areas = stats[1:, 4]
        ci = 1 + int(np.argmax(areas))
        area = int(stats[ci, 4])
        if area < max(12, min_area // 2):
            continue
        cc = (lab == ci).astype(np.uint8)
        full = cv2.dilate(cc, np.ones((5, 5), np.uint8)) & allow
        comps = _components_raw(full, min_area, offset=(x, y))
        if not comps:
            continue
        sig = frame_sub[cc.astype(bool)].astype(np.float32).mean(axis=0).tolist()
        for c in comps:
            c['sig'] = sig
        out.extend(comps)
    return out[:12]


def components(m, min_area=40, frame=None, bg=None, diff=None):
    raw = _components_raw(m, min_area)
    if frame is None or bg is None:
        return raw
    if diff is None:
        diff = np.max(np.abs(frame.astype(np.int16) - bg.astype(np.int16)), axis=2)
    out = []
    for comp in raw:
        splits = _split_color_component(frame, diff, m, comp, min_area)
        if splits:
            out.extend(splits)
        else:
            comp['sig'] = _sig_from_box(frame, diff, comp['box'])
            out.append(comp)
    return out


def iou(a, b):
    ax, ay, aw, ah = a; bx, by, bw, bh = b
    ix, iy = max(0, min(ax + aw, bx + bw) - max(ax, bx)), max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy; return inter / float(aw * ah + bw * bh - inter + 1e-9)


def _pos_score(a, b):
    dist = math.hypot(a['c'][0] - b['c'][0], a['c'][1] - b['c'][1])
    maxdim = max(a['box'][2], a['box'][3], b['box'][2], b['box'][3], 20)
    return float(np.clip(1.0 - dist / maxdim, 0, 1))


def _color_score(a, b):
    sa, sb = a.get('sig'), b.get('sig')
    if not sa or not sb:
        return 0.5
    d = math.sqrt(sum((sa[i] - sb[i]) ** 2 for i in range(3)))
    return float(np.clip(1.0 - d / 70.0, 0, 1))


def _avg_sig(t):
    sigs = [c.get('sig') for c in t['frames'].values() if c.get('sig')]
    if not sigs:
        return None
    n = len(sigs)
    return [sum(s[i] for s in sigs) / n for i in range(3)]


def _merge_tracks(tracks, max_gap=6):
    """Merge fragments that have the same colour and spatio-temporal continuity.

    The split-colour stage can occasionally cut a single object into multiple
    pieces (star arms, a clipped shape entering frame).  Here we merge those
    pieces back into a single track when they are the same colour and either
    overlap spatially or are close around a small temporal gap.  A final same-
    colour/same-place pass recovers tracks that were split across time after a
    temporary connected-component merge with a neighbour.
    """
    tracks = list(tracks)
    changed = True
    while changed:
        changed = False
        for i in range(len(tracks)):
            if i >= len(tracks):
                break
            ti = tracks[i]
            if not ti.get('frames'):
                continue
            fi = set(ti['frames'])
            si = _avg_sig(ti)
            for j in range(i + 1, len(tracks)):
                tj = tracks[j]
                if not tj.get('frames'):
                    continue
                fj = set(tj['frames'])
                if min(fj) > max(fi):
                    gap = min(fj) - max(fi)
                elif min(fi) > max(fj):
                    gap = min(fi) - max(fj)
                else:
                    gap = 0
                if gap > max_gap:
                    continue
                sj = _avg_sig(tj)
                if si and sj:
                    dist = math.sqrt(sum((si[k] - sj[k]) ** 2 for k in range(3)))
                    if dist > MERGE_COLOR_DIST:
                        continue
                if gap == 0:
                    close = False
                    for f in fi & fj:
                        a = ti['frames'][f]['box']
                        b = tj['frames'][f]['box']
                        if iou(a, b) > 0.0 or _pos_score(ti['frames'][f], tj['frames'][f]) > 0.25:
                            close = True
                            break
                    if not close:
                        continue
                else:
                    if min(fj) > max(fi):
                        ca = ti['frames'][max(fi)]
                        cb = tj['frames'][min(fj)]
                    else:
                        ca = tj['frames'][max(fj)]
                        cb = ti['frames'][min(fi)]
                    maxdim = max(ca['box'][2], ca['box'][3], cb['box'][2], cb['box'][3], 20)
                    if math.hypot(ca['c'][0] - cb['c'][0], ca['c'][1] - cb['c'][1]) > 3.5 * maxdim:
                        continue
                new_frames = dict(ti['frames'])
                for f, c in tj['frames'].items():
                    if f in new_frames:
                        if c['area'] > new_frames[f]['area']:
                            new_frames[f] = c
                    else:
                        new_frames[f] = c
                ti['frames'] = {f: new_frames[f] for f in sorted(new_frames)}
                del tracks[j]
                changed = True
                break
            if changed:
                break

    # Last-resort merge: same colour and essentially the same centre over the
    # track lifetime.  This specifically repairs shapes whose track was split
    # into time-contiguous fragments by a transient connected-component change.
    changed = True
    while changed:
        changed = False
        for i in range(len(tracks)):
            if i >= len(tracks):
                break
            ti = tracks[i]
            if not ti.get('frames'):
                continue
            fi = set(ti['frames'])
            si = _avg_sig(ti)
            cis = [list(c['c']) for c in ti['frames'].values()]
            ci = np.median(cis, axis=0)
            for j in range(i + 1, len(tracks)):
                tj = tracks[j]
                if not tj.get('frames'):
                    continue
                fj = set(tj['frames'])
                sj = _avg_sig(tj)
                cjs = [list(c['c']) for c in tj['frames'].values()]
                cj = np.median(cjs, axis=0)
                center_dist = math.hypot(ci[0] - cj[0], ci[1] - cj[1])
                if si and sj:
                    dc = math.sqrt(sum((si[k] - sj[k]) ** 2 for k in range(3)))
                    # Opacity changes (fades) can move the average colour quite
                    # far.  If the trajectories are extremely close, that is a
                    # stronger signal than the colour average.
                    if dc > 220.0 and center_dist > 30.0:
                        continue
                if center_dist > 120.0:
                    continue
                if fi & fj:
                    ds = []
                    for f in fi & fj:
                        a = ti['frames'][f]['c']
                        b = tj['frames'][f]['c']
                        ds.append(math.hypot(a[0] - b[0], a[1] - b[1]))
                    if float(np.median(ds)) > 100.0:
                        continue
                new_frames = dict(ti['frames'])
                for f, c in tj['frames'].items():
                    if f in new_frames:
                        if c['area'] > new_frames[f]['area']:
                            new_frames[f] = c
                    else:
                        new_frames[f] = c
                ti['frames'] = {f: new_frames[f] for f in sorted(new_frames)}
                del tracks[j]
                changed = True
                break
            if changed:
                break
    return tracks


def track(comps_per_frame, max_gap=5):
    tracks = []  # {id, frames: {f: comp}}
    for f, comps in enumerate(comps_per_frame):
        used = set()
        for t in tracks:
            lf = max(t['frames'])
            if f - lf > max_gap: continue
            last = t['frames'][lf]
            best, bs = None, 0.0
            for j, c in enumerate(comps):
                if j in used: continue
                score = 0.30 * iou(last['box'], c['box']) + 0.20 * _pos_score(last, c) + 0.50 * _color_score(last, c)
                if score > bs: best, bs = j, score
            if best is not None:
                sa, sb = last.get('sig'), comps[best].get('sig')
                thr = 0.20
                if sa and sb:
                    col = _color_score(last, comps[best])
                    thr = 0.75 if col < 0.20 else 0.45
                if bs >= thr:
                    t['frames'][f] = comps[best]
                    used.add(best)
        for j, c in enumerate(comps):
            if j not in used:
                tracks.append(dict(id=len(tracks), frames={f: c}))
    tracks = _merge_tracks(tracks, max_gap=max(max_gap, 6))
    return [t for t in tracks if len(t['frames']) >= 2]

def refine_plate(F, plate, origin, off, masks, k=3):
    """Median plates learn any element that rests for most of the shot. Fix: U = every pixel ever flagged foreground
    (dilated); G = the plate inpainted over U from its surroundings (what the background should look like there);
    for each pixel in U, the plate value is the median of the k frame samples closest to G. A pixel that is ever
    uncovered gets its true background; one covered all shot long keeps its (static) content."""
    x0, y0 = origin; H, W = plate.shape[:2]; h, w = F[0].shape[:2]
    U = np.zeros((H, W), np.uint8)
    for f, m in enumerate(masks):
        M = np.float32([[1, 0, -off[f][0] - x0], [0, 1, -off[f][1] - y0]])
        U |= cv2.warpAffine(m, M, (W, H), flags=cv2.INTER_NEAREST, borderValue=0)
    U = cv2.dilate(U, np.ones((5, 5), np.uint8))
    if U.sum() == 0: return plate, 0
    G = cv2.inpaint(plate, U, 5, cv2.INPAINT_TELEA).astype(np.float32)
    ys, xs = np.nonzero(U)
    step = max(1, len(F) // 90)
    samples = []
    for f in range(0, len(F), step):  # each frame's value at the canvas pixels in U (NaN where the frame doesn't reach)
        fx = xs + x0 + off[f][0]; fy = ys + y0 + off[f][1]
        ix, iy = np.round(fx).astype(int), np.round(fy).astype(int)
        ok = (ix >= 0) & (ix < w) & (iy >= 0) & (iy < h)
        v = np.full((len(xs), 3), np.nan, np.float32); v[ok] = F[f][iy[ok], ix[ok]]
        samples.append(v)
    S = np.stack(samples)  # (T, N, 3)
    d = np.linalg.norm(S - G[ys, xs][None], axis=2); d = np.where(np.isnan(d), np.inf, d)
    order = np.argsort(d, axis=0)[:k]  # k closest frames per pixel
    pick = np.take_along_axis(S, order[..., None].repeat(3, axis=2), axis=0)
    val = np.nanmedian(pick, axis=0)
    out = plate.copy(); good = ~np.isnan(val).any(axis=1)
    out[ys[good], xs[good]] = np.clip(val[good] + 0.5, 0, 255).astype(np.uint8)
    return out, int(good.sum())


# ------------------------------------------------------------------ element model
def _sprite_gray(sprite):
    """Straight (unpremultiplied) grey image for ECC from an RGBA sprite.

    Sprite files are stored premultiplied so linear resampling is correct for
    compositing.  ECC templates, however, must match the actual opaque-object
    luminance, not its alpha-weighted value.
    """
    rgb = sprite[..., :3].astype(np.float32)
    a = sprite[..., 3].astype(np.float32) / 255.0
    denom = np.maximum(a, 0.02)[..., None]
    straight = np.clip(rgb / denom, 0, 255).astype(np.uint8)
    return cv2.cvtColor(straight, cv2.COLOR_BGR2GRAY)


def cut_sprite(frame, bg, box, pad=4):
    h, w = frame.shape[:2]; x, y, bw, bh = box
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
    f = frame[y0:y1, x0:x1].astype(np.float32)
    b = bg[y0:y1, x0:x1].astype(np.float32)
    diff = f - b
    d = np.max(np.abs(diff), axis=2)

    # Start with a per-pixel colour projection where possible.  Cluster the
    # sure (eroded) foreground colours and estimate alpha for each pixel by
    # projecting (frame - plate) onto the best (sprite_colour - plate).  This
    # avoids the old fixed ramp, which made high-contrast anti-aliased edges
    # fully opaque and baked the old background into the sprite.
    alpha = None
    initial_mask = d > 12
    core = cv2.erode(initial_mask.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    if core.sum() < 16:
        vals = d[initial_mask]
        if vals.size >= 16:
            core = initial_mask & (d >= max(32.0, float(np.percentile(vals, 60))))
    if core.sum() >= 16:
        samples = f[core].astype(np.float32)
        chosen = _choose_color_clusters(samples, max(24, int(core.sum() * 0.05)))
        if chosen is not None:
            centers, _K = chosen
            centers = np.asarray(centers, np.float32)
            best_alpha = np.zeros_like(d, np.float32)
            best_err = np.full_like(d, np.inf, np.float32)
            for center in centers:
                u = center[None, None, :] - b
                denom = (u * u).sum(axis=2) + 1e-6
                a_c = np.clip((diff * u).sum(axis=2) / denom, 0.0, 1.0)
                recon = b + a_c[..., None] * u
                err = ((f - recon) ** 2).sum(axis=2)
                better = err < best_err
                best_alpha[better] = a_c[better]
                best_err[better] = err[better]
            best_alpha[~initial_mask] = 0.0
            best_alpha[best_alpha < 0.02] = 0.0
            alpha = best_alpha

    if alpha is None:
        alpha = np.clip((d - 6) / 18.0, 0.0, 1.0)

    # Straight unpremultiplied colour.  Unmix the plate for all non-negligible
    # alpha.  The old threshold left faint anti-aliased edge pixels premultiplied
    # from the original background, which caused a dark/bright halo that lowered
    # the fitted PSNR just enough to reject otherwise good sprite poses.
    s = f.copy()
    safe = alpha > 0.02
    denom = np.maximum(alpha, 0.02)[..., None]
    unmixed = np.clip(b + diff / denom, 0, 255)
    s[safe] = unmixed[safe]

    premul = np.clip(s * alpha[..., None], 0, 255)
    out = np.dstack([premul, alpha * 255])
    return out.astype(np.uint8), (x0, y0)


def fit_similarity(sprite, frame, bg, guess, scale0=1.0, motion=cv2.MOTION_AFFINE):
    """ECC affine fit of the sprite (RGBA, top-left at sprite coords) onto the frame. ECC needs equal-size images, so
    the sprite is padded onto a larger transparent canvas and a window of the same size is cut from the frame around
    the guess. Returns the 2x3 matrix mapping sprite coords -> frame coords, and the ECC correlation."""
    sh, sw = sprite.shape[:2]; pad = int(0.6 * max(sh, sw) * max(1.0, scale0)) + 8
    H2, W2 = sh + 2 * pad, sw + 2 * pad
    tmpl = np.zeros((H2, W2), np.float32); mask = np.zeros((H2, W2), np.uint8)
    tmpl[pad:pad + sh, pad:pad + sw] = _sprite_gray(sprite)
    mask[pad:pad + sh, pad:pad + sw] = (sprite[..., 3] > 128)
    if mask.sum() < 20: return None, 0.0
    cxs, cys = sw / 2, sh / 2  # scale about the sprite centre
    ox, oy = guess[0] - pad, guess[1] - pad
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    Mw = np.float32([[1, 0, -ox], [0, 1, -oy]])
    win = cv2.warpAffine(img, Mw, (W2, H2), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    s0 = float(scale0); c = (pad + cxs, pad + cys)
    M = np.float32([[s0, 0, c[0] - s0 * c[0]], [0, s0, c[1] - s0 * c[1]]])  # template -> window
    vis_mask = _visible_mask(mask, M, ox, oy, frame.shape)
    if vis_mask.sum() < 20: return None, 0.0
    try:
        cc, M = cv2.findTransformECC(tmpl, win, M, motion,
                                     (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 100, 1e-5), vis_mask, 3)
    except cv2.error:
        return None, 0.0
    # sprite coords = template coords - pad; frame coords = window coords + (ox, oy)
    M = M.astype(np.float64)
    M[:, 2] = M[:, 2] + M[:, :2] @ np.array([pad, pad]) + np.array([ox, oy])
    return M.astype(np.float32), float(cc)


def fit_similarity_from(sprite, frame, M0, motion=cv2.MOTION_AFFINE):
    """Same ECC fit, warm-started from a known sprite->frame matrix (the previous frame's)."""
    sh, sw = sprite.shape[:2]; pad = int(0.6 * max(sh, sw) * max(1.0, abs(float(M0[0][0])) + abs(float(M0[1][0])))) + 8
    ox, oy = float(M0[0][2]) - pad, float(M0[1][2]) - pad
    H2, W2 = sh + 2 * pad, sw + 2 * pad
    tmpl = np.zeros((H2, W2), np.float32); mask = np.zeros((H2, W2), np.uint8)
    tmpl[pad:pad + sh, pad:pad + sw] = _sprite_gray(sprite)
    mask[pad:pad + sh, pad:pad + sw] = sprite[..., 3] > 128
    if mask.sum() < 20: return None, 0.0
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    win = cv2.warpAffine(img, np.float32([[1, 0, -ox], [0, 1, -oy]]), (W2, H2), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    A = np.float64(M0)[:, :2]; T = np.float64(M0)[:, 2] - np.array([ox, oy]) - A @ np.array([pad, pad])
    M = np.float32(np.hstack([A, T[:, None]]))
    vis_mask = _visible_mask(mask, M, ox, oy, frame.shape)
    if vis_mask.sum() < 20: return None, 0.0
    try:
        cc, M = cv2.findTransformECC(tmpl, win, M, motion, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 100, 1e-5), vis_mask, 3)
    except cv2.error:
        return None, 0.0
    M = M.astype(np.float64); M[:, 2] = M[:, 2] + M[:, :2] @ np.array([pad, pad]) + np.array([ox, oy])
    return M.astype(np.float32), float(cc)


def _visible_mask(template_mask, M, ox, oy, frame_shape):
    ys, xs = np.nonzero(template_mask)
    if len(xs) == 0:
        return template_mask.copy()
    h, w = frame_shape[:2]
    M64 = M.astype(np.float64)
    pts = np.vstack([xs.astype(np.float64), ys.astype(np.float64), np.ones(len(xs), np.float64)])
    mapped = M64 @ pts  # 2xN
    fx = mapped[0] + ox
    fy = mapped[1] + oy
    valid = (fx >= 0) & (fx < w) & (fy >= 0) & (fy < h)
    out = np.zeros_like(template_mask)
    out[ys[valid], xs[valid]] = template_mask[ys[valid], xs[valid]]
    return out


def composite(bg, sprite, M, alpha_scale=1.0):
    h, w = bg.shape[:2]
    rgba = cv2.warpAffine(sprite, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0)).astype(np.float32)
    a = rgba[..., 3:4] / 255.0 * alpha_scale
    # Sprite colours are stored premultiplied by their alpha.  After resampling
    # that is already (colour * alpha); opacity scaling only multiplies both
    # colour and alpha by the same scalar.
    rgb = rgba[..., :3] * alpha_scale
    return (bg.astype(np.float32) * (1 - a) + rgb)


def _fit_quality(bg, sprite, M, frame, crop):
    """Least-squares alpha multiplier and PSNR for a pose over the crop rectangle.

    Quality is measured only over the alpha-weighted sprite region. Whole-crop
    background pixels are excluded so plate reconstruction / interpolation error
    outside the element cannot veto a good sprite fit.

    The sprite is premultiplied, so the predicted foreground contribution over
    the plate is sprite_rgba_colour - plate * alpha.
    """
    x0, y0, x1, y1 = crop
    cw, ch = x1 - x0, y1 - y0
    M_sub = M.copy()
    M_sub[0, 2] -= x0
    M_sub[1, 2] -= y0
    bgc = bg[y0:y1, x0:x1].astype(np.float32)
    fgc = frame[y0:y1, x0:x1].astype(np.float32)
    rgba = cv2.warpAffine(sprite, M_sub, (cw, ch), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0)).astype(np.float32)
    alpha2 = rgba[..., 3] / 255.0
    alpha = alpha2[..., None]
    D = rgba[..., :3] - bgc * alpha
    target = fgc - bgc

    mask = alpha2 > 0.05
    weight = (alpha2 * mask).astype(np.float32)
    if weight.sum() < 20.0:
        if mask.sum() > 0:
            weight = mask.astype(np.float32)
        else:
            return 1.0, 1.0, 1.0

    w3 = weight[..., None]
    num = float((D * target * w3).sum())
    den = float((D * D * w3).sum())
    a = float(np.clip(num / max(den, 1e-9), 0.0, 1.5))
    rendered = np.clip(bgc + D * a, 0, 255)
    q = _psnr_weighted(rendered, fgc, weight)
    plate_q = _psnr_weighted(bgc, fgc, weight)
    return a, q, plate_q


def _translation_search(pz, frame, bg, crop, guesses, radius0=6):
    """Integer translation search around top-left guesses.

    This is especially useful when an object is partly outside the frame and
    ECC has very few visible pixels to lock onto.  The least-squares alpha
    quality is evaluated locally for each candidate, so fades are handled too.
    """
    best = None
    current_guesses = [(float(g[0]), float(g[1])) for g in guesses if g is not None]
    if not current_guesses:
        return None
    for step, radius in ((2, radius0), (1, 2)):
        if best is not None:
            current_guesses = [(float(best['M'][0, 2]), float(best['M'][1, 2]))]
        for gx, gy in current_guesses:
            for dy in np.arange(-radius, radius + 1, step):
                for dx in np.arange(-radius, radius + 1, step):
                    M = np.float32([[1.0, 0.0, gx + dx], [0.0, 1.0, gy + dy]])
                    alpha, q, plate_q = _fit_quality(bg, pz['img'], M, frame, crop)
                    if best is None or q > best['q']:
                        best = dict(q=q, M=M, alpha=alpha, cc=1.0, plate_q=plate_q)
    # Half-pixel refinement around the best integer alignment.  The plate and
    # bird are warped by a sub-pixel camera; an integer-only search can be off
    # by enough on anti-aliased edges to look like a bad pose.
    if best is not None:
        bx, by = float(best['M'][0, 2]), float(best['M'][1, 2])
        for ddx in (-0.5, 0.0, 0.5):
            for ddy in (-0.5, 0.0, 0.5):
                if ddx == 0.0 and ddy == 0.0:
                    continue
                M2 = best['M'].copy()
                M2[0, 2] = bx + ddx
                M2[1, 2] = by + ddy
                alpha2, q2, plate_q2 = _fit_quality(bg, pz['img'], M2, frame, crop)
                if q2 > best['q']:
                    best = dict(q=q2, M=M2, alpha=alpha2, cc=1.0, plate_q=plate_q2)
    return best


def _edge_guess(pz, box, frame_w, frame_h):
    """Return a translation-only guess for a clipped object by aligning the unclipped edge."""
    inbox = pz.get('bbox_local')
    if not inbox:
        return None
    minx, miny, maxx, maxy = inbox
    x, y, bw, bh = box
    if x <= 0 and x + bw < frame_w - 1:
        tx = x + bw - 1 - maxx
    elif x + bw >= frame_w - 1 and x > 0:
        tx = x - minx
    else:
        tx = x - minx
    if y <= 0 and y + bh < frame_h - 1:
        ty = y + bh - 1 - maxy
    elif y + bh >= frame_h - 1 and y > 0:
        ty = y - miny
    else:
        ty = y - miny
    return (tx, ty)


def _try_fit_candidate(pz, frame, bg, crop, guess, scale0):
    cands = []
    # Prefer the simplest motion model first: the bird-like benchmark sprite
    # mostly translates, and ECC affine can wander with small masked templates.
    for motion in (cv2.MOTION_TRANSLATION, cv2.MOTION_AFFINE):
        M, cc = fit_similarity(pz['img'], frame, bg, guess, scale0, motion=motion)
        if M is None:
            continue
        alpha, q, plate_q = _fit_quality(bg, pz['img'], M, frame, crop)
        cands.append(dict(q=q, M=M, alpha=alpha, cc=cc, plate_q=plate_q))
    if not cands:
        return None
    best = max(cands, key=lambda d: d['q'])

    # ECC optimises correlation, but we actually care about the alpha-weighted
    # reconstruction PSNR.  A half-pixel translation refinement frequently
    # recovers anti-aliased edge quality and makes the difference between a
    # reusable pose and a rejected/baked frame.
    for ddx in (-0.5, 0.0, 0.5):
        for ddy in (-0.5, 0.0, 0.5):
            if ddx == 0.0 and ddy == 0.0:
                continue
            M2 = best['M'].copy()
            M2[0, 2] = float(M2[0, 2]) + ddx
            M2[1, 2] = float(M2[1, 2]) + ddy
            alpha2, q2, plate_q2 = _fit_quality(bg, pz['img'], M2, frame, crop)
            if q2 > best['q']:
                best = dict(q=q2, M=M2, alpha=alpha2, cc=best.get('cc', 0.0), plate_q=plate_q2)
    return best


# ------------------------------------------------------------------ easing fit (after reanimate's easing.ts, MIT)
# GSAP's eases, exact: power1 = quad, power2 = cubic, power3 = quart, power4 = quint
def _pin(p): return lambda t: t ** p
def _pout(p): return lambda t: 1 - (1 - t) ** p
def _pio(p): return lambda t: (2 ** (p - 1)) * t ** p if t < 0.5 else 1 - ((-2 * t + 2) ** p) / 2
def _back_out(s=1.70158): return lambda t: 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2
def _back_in(s=1.70158): return lambda t: (s + 1) * t ** 3 - s * t ** 2
EASINGS = {'linear': lambda t: t, 'sine.in': lambda t: 1 - math.cos(t * math.pi / 2), 'sine.out': lambda t: math.sin(t * math.pi / 2),
           'sine.inOut': lambda t: -(math.cos(math.pi * t) - 1) / 2,
           'expo.out': lambda t: 1 if t >= 1 else 1 - 2 ** (-10 * t), 'expo.in': lambda t: 0 if t <= 0 else 2 ** (10 * t - 10),
           'circ.out': lambda t: math.sqrt(max(0.0, 1 - (t - 1) ** 2)), 'back.out': _back_out(), 'back.in': _back_in()}
for _p, _n in ((2, 'power1'), (3, 'power2'), (4, 'power3'), (5, 'power4')):
    EASINGS[f'{_n}.in'], EASINGS[f'{_n}.out'], EASINGS[f'{_n}.inOut'] = _pin(_p), _pout(_p), _pio(_p)


def _median_filter1d(v, k):
    if k <= 1 or len(v) < k:
        return v
    out = np.empty_like(v)
    r = k // 2
    for i in range(len(v)):
        lo = max(0, i - r)
        hi = min(len(v), i + r + 1)
        out[i] = np.median(v[lo:hi])
    return out


def _wls_fit_ease(v, xs, w, s, e, fn):
    if e - s <= 1e-9:
        return 1e9, 0.0, 0.0, 0
    mask = (xs >= s - 0.5) & (xs <= e + 0.5)
    n_used = int(mask.sum())
    if n_used < 3:
        return 1e9, 0.0, 0.0, n_used
    tt = np.clip((xs[mask] - s) / (e - s), 0.0, 1.0)
    u = np.array([fn(float(t)) for t in tt])
    y = v[mask]
    if w is not None:
        ww = w[mask]
    else:
        ww = np.ones(n_used, dtype=np.float64)
    sw = float(ww.sum())
    if sw <= 0:
        return 1e9, 0.0, 0.0, n_used
    su = float((ww * u).sum())
    sy = float((ww * y).sum())
    suu = float((ww * u * u).sum())
    suy = float((ww * u * y).sum())
    det = sw * suu - su * su
    if abs(det) < 1e-12:
        return 1e9, 0.0, 0.0, n_used
    b0 = (suu * sy - su * suy) / det
    b1 = (sw * suy - su * sy) / det
    resid = y - b0 - b1 * u
    rmse = math.sqrt(max(0.0, float((ww * resid * resid).sum() / sw)))
    return rmse, b0, b1, n_used


def fit_segments(series, fps, eps_frac=0.002, min_hold=4, min_range=0.75, min_eps=0.05, weights=None, x=None, smooth=None, first_visible=None):
    """Split a per-frame value series into holds and moves, then fit each move with the best named easing.

    When `x` (actual frame numbers) is supplied, the returned f0/f1 are those frame
    numbers, not local indices.  `weights` are used for weighted least-squares fits.
    `smooth` may be a small integer to median-filter the series before segmentation.
    `first_visible`, when supplied, is the first frame the element was tracked, and
    broadens the free start so off-screen entries can be recovered from the
    visible portion of a move.
    """
    v = np.asarray(series, np.float64)
    if x is None:
        xs0 = np.arange(len(v), dtype=np.float64)
    else:
        xs0 = np.asarray(x, np.float64)
    if weights is None:
        w0 = np.ones_like(v)
    else:
        w0 = np.asarray(weights, np.float64)

    finite = np.isfinite(v) & np.isfinite(xs0)
    v = v[finite]
    xs = xs0[finite]
    w = w0[finite]
    n = len(v)
    if n < 3:
        return []

    if smooth is not None and int(smooth) > 1:
        v_seg = _median_filter1d(v, int(smooth))
    else:
        v_seg = v

    rng = float(v_seg.max() - v_seg.min())
    if rng < min_range:
        f0 = int(round(xs[0])) if x is not None else 0
        f1 = int(round(xs[-1])) if x is not None else n - 1
        return [dict(kind='hold', f0=f0, f1=f1, v=float(v.mean()))]

    eps = max(rng * eps_frac, min_eps)
    moving = np.abs(np.diff(v_seg)) > eps

    segs = []
    i = 0
    while i < n - 1:
        j = i
        while j < n - 1 and moving[j] == moving[i]:
            j += 1
        segs.append([i, j, bool(moving[i])])
        i = j

    merged = []
    for k, sg in enumerate(segs):
        if not sg[2] and 0 < k < len(segs) - 1 and sg[1] - sg[0] < min_hold and merged and merged[-1][2]:
            merged[-1][1] = sg[1]
            continue
        if merged and merged[-1][2] and sg[2]:
            merged[-1][1] = sg[1]
            continue
        merged.append(sg)

    # back.out (and similar) overshoot then settle: a small velocity sign
    # change near the peak should not split the move into two segments.
    merged2 = []
    i = 0
    while i < len(merged):
        if i + 2 < len(merged) and merged[i][2] and not merged[i + 1][2] and merged[i + 2][2]:
            m1, h, m2 = merged[i], merged[i + 1], merged[i + 2]
            hold_len = h[1] - h[0]
            start_i, end_i = m1[0], m2[1]
            amp_move = float(v_seg[start_i:end_i + 1].max() - v_seg[start_i:end_i + 1].min())
            amp_hold = float(abs(v_seg[h[1]] - v_seg[h[0]])) if hold_len > 0 else 0.0
            dir1 = float(v_seg[m1[1]] - v_seg[m1[0]])
            dir2 = float(v_seg[m2[1]] - v_seg[m2[0]])
            overshoot_and_settle = (amp_move > 0 and amp_hold < 0.25 * amp_move and dir1 * dir2 < 0.0)
            if hold_len < min_hold or overshoot_and_settle:
                merged2.append([start_i, end_i, True])
                i += 3
                continue
        merged2.append(merged[i])
        i += 1
    merged = merged2

    out = []
    for seg in merged:
        a, b, mv = seg
        if not mv:
            f0 = int(round(xs[a])) if x is not None else a
            f1 = int(round(xs[b])) if x is not None else b
            out.append(dict(kind='hold', f0=f0, f1=f1, v=float(v[a:b + 1].mean())))
            continue

        amp = float(v_seg[a:b + 1].max() - v_seg[a:b + 1].min())
        if amp < min_range * 0.66:
            f0 = int(round(xs[a])) if x is not None else a
            f1 = int(round(xs[b])) if x is not None else b
            out.append(dict(kind='hold', f0=f0, f1=f1, v=float(v[a:b + 1].mean())))
            continue

        core_s = float(xs[a])
        core_e = float(xs[b])
        dur_core = max(1.0, core_e - core_s)
        early_span = max(12.0, dur_core * 2.0)
        late_span = max(12.0, dur_core * 0.75)

        # Candidate start: allow it to have started before the first reliable
        # moving sample (partly off-screen elements lose the first samples).
        s_lo = max(0.0, core_s - early_span)
        if first_visible is not None:
            # Extend the free start all the way back to
            # first_visible - move_duration, so an off-screen entry can be
            # recovered from the visible part alone.
            s_lo = max(0.0, min(s_lo, float(first_visible) - dur_core))
        s_hi = min(float(xs[-1]), core_s + 2.0)
        e_lo = max(core_e - 2.0, core_s + 2.0)
        e_hi = min(float(xs[-1]) + 12.0, core_e + late_span)

        if s_lo > s_hi or e_lo > e_hi:
            continue

        s_lo_i = int(math.floor(s_lo))
        s_hi_i = int(math.ceil(s_hi))
        e_lo_i = int(math.floor(e_lo))
        e_hi_i = int(math.ceil(e_hi))
        if s_hi_i < s_lo_i or e_hi_i < e_lo_i:
            continue

        grid = 12
        s_step = max(1, int((s_hi_i - s_lo_i) // grid))
        e_step = max(1, int((e_hi_i - e_lo_i) // grid))
        best_global = None

        for name, fn in EASINGS.items():
            best_ease = None
            for s_i in range(s_lo_i, s_hi_i + 1, s_step):
                for e_i in range(e_lo_i, e_hi_i + 1, e_step):
                    if e_i <= s_i:
                        continue
                    rmse, b0, b1, n_used = _wls_fit_ease(v_seg, xs, w, s_i, e_i, fn)
                    if not np.isfinite(rmse):
                        continue
                    if best_ease is None or rmse < best_ease[0]:
                        best_ease = (rmse, b0, b1, s_i, e_i, n_used)
            if best_ease is None:
                continue

            # Refine around the coarse winner for this ease.
            rs, re = best_ease[3], best_ease[4]
            ref_s_lo = max(s_lo_i, rs - s_step)
            ref_s_hi = min(s_hi_i, rs + s_step)
            ref_e_lo = max(e_lo_i, re - e_step)
            ref_e_hi = min(e_hi_i, re + e_step)
            for s_i in range(ref_s_lo, ref_s_hi + 1):
                for e_i in range(ref_e_lo, ref_e_hi + 1):
                    if e_i <= s_i:
                        continue
                    rmse, b0, b1, n_used = _wls_fit_ease(v_seg, xs, w, s_i, e_i, fn)
                    if not np.isfinite(rmse):
                        continue
                    if rmse < best_ease[0]:
                        best_ease = (rmse, b0, b1, s_i, e_i, n_used)

            if best_global is None or best_ease[0] < best_global[0]:
                best_global = (best_ease[0], name, best_ease[1], best_ease[2], best_ease[3], best_ease[4], best_ease[5])

        if best_global is None:
            continue

        rmse, name, b0, b1, s_i, e_i, n_used = best_global
        rec = dict(kind='tween', f0=int(round(s_i)), f1=int(round(e_i)),
                   v0=round(float(b0), 4), v1=round(float(b0 + b1), 4),
                   ease=name, rmse=round(float(rmse), 4))
        if rmse > 0.08:
            rec['note'] = 'no clean ease: keep per-frame values'
        out.append(rec)

    return out


# ------------------------------------------------------------------ text detection
def _rapid_ocr(img):
    global _OCR_ENGINE
    try:
        if _OCR_ENGINE is None:
            from rapidocr_onnxruntime import RapidOCR
            _OCR_ENGINE = RapidOCR()
        result, _ = _OCR_ENGINE(img)
        return result if result else []
    except Exception:
        return []


def _norm_text(s):
    if s is None:
        return ''
    return ' '.join(str(s).split())


def _ocr_box_to_xywh(points, w, h):
    pts = np.asarray(points, dtype=np.float32).reshape(-1, 2)
    if len(pts) == 0:
        return None
    x0 = int(math.floor(pts[:, 0].min()))
    x1 = int(math.ceil(pts[:, 0].max()))
    y0 = int(math.floor(pts[:, 1].min()))
    y1 = int(math.ceil(pts[:, 1].max()))
    x0 = max(0, x0); y0 = max(0, y0)
    x1 = min(w, x1); y1 = min(h, y1)
    if x1 <= x0 or y1 <= y0:
        return None
    return x0, y0, x1 - x0, y1 - y0


def _merge_items_by_frame(raw_items):
    by_frame = {}
    for r in raw_items:
        by_frame.setdefault(r['f'], []).append(r)
    candidates = []
    for f, items in by_frame.items():
        items = sorted(items, key=lambda d: (d['y_center'], d['x']))
        groups = []
        for it in items:
            placed = False
            for g in groups:
                if abs(it['y_center'] - g['cy']) <= max(8.0, 0.5 * max(it['h'], g['h'])):
                    g['items'].append(it)
                    placed = True
                    break
            if not placed:
                groups.append(dict(cy=it['y_center'], h=it['h'], items=[it]))
        for g in groups:
            xs = sorted(g['items'], key=lambda d: d['x'])
            text = ' '.join(d['text'] for d in xs)
            x0 = min(d['x'] for d in xs)
            y0 = min(d['y'] for d in xs)
            x1 = max(d['x'] + d['w'] for d in xs)
            y1 = max(d['y'] + d['h'] for d in xs)
            score = float(np.mean([d['score'] for d in xs])) if xs else 0.0
            candidates.append(dict(
                f=f, x=x0, y=y0, w=x1 - x0, h=y1 - y0,
                y_center=(y0 + y1) / 2.0, x_center=(x0 + x1) / 2.0,
                text=text, score=score))
    return candidates


def _cluster_candidates(candidates):
    clusters = []
    for cand in candidates:
        placed = False
        for cl in clusters:
            rep = cl['items'][0]
            if abs(cand['y_center'] - rep['y_center']) <= max(12.0, 0.6 * max(cand['h'], rep['h'])):
                cl['items'].append(cand)
                placed = True
                break
        if not placed:
            clusters.append(dict(items=[cand]))
    out = []
    for cl in clusters:
        best = max(cl['items'], key=lambda d: (len(d['text']), d['score']))
        out.append(dict(string=best['text'], box=[best['x'], best['y'], best['w'], best['h']], conf=best['score']))
    return out


def _ink_mask(frame, bg, box):
    x, y, bw, bh = box
    sub_f = frame[y:y + bh, x:x + bw].astype(np.int16)
    sub_b = bg[y:y + bh, x:x + bw].astype(np.int16)
    d = np.max(np.abs(sub_f - sub_b), axis=2)
    return d > 22


def _split_cells(box, string, frame, bg):
    x, y, bw, bh = box
    mask = _ink_mask(frame, bg, box)
    profile = mask.sum(axis=0)
    nonspace = [i for i, ch in enumerate(string) if ch != ' ']
    if not nonspace:
        return [None] * len(string)

    segments = []
    inside = False
    start = -1
    for c in range(bw):
        if profile[c] > 0:
            if not inside:
                start = c
                inside = True
        else:
            if inside:
                segments.append((start, c - 1))
                inside = False
    if inside:
        segments.append((start, bw - 1))

    cells = [None] * len(string)
    if len(segments) == len(nonspace):
        for pos, (s, e) in zip(nonspace, segments):
            cells[pos] = (int(s), int(e))
    else:
        edges = np.linspace(0, bw, len(string) + 1).astype(int)
        for pos in nonspace:
            s = int(edges[pos])
            e = int(edges[pos + 1])
            s = max(0, min(bw - 1, s))
            e = max(s + 1, min(bw, e))
            cells[pos] = (s, e)
    return cells


def _first_frames_per_char(F, bgs, box, string):
    """Return a list of shot-local first-visible frames, -1 for spaces."""
    L = len(string)
    ff = [-1] * L
    nonspace = [i for i, ch in enumerate(string) if ch != ' ']
    if not nonspace:
        return ff

    cells = _split_cells(box, string, F[-1], bgs[-1])

    # Count ink in each character cell, for each frame.  This is deliberately
    # small and sequential; OCR runs dominate the cost by far.
    final_mask = _ink_mask(F[-1], bgs[-1], box)
    final_counts = []
    for pos in nonspace:
        s, e = cells[pos]
        final_counts.append(int(final_mask[:, s:e].sum()))

    counts_by_frame = []
    for i in range(len(F)):
        mask = _ink_mask(F[i], bgs[i], box)
        row = []
        for pos in nonspace:
            s, e = cells[pos]
            row.append(int(mask[:, s:e].sum()))
        counts_by_frame.append(row)

    counts = np.asarray(counts_by_frame, dtype=np.int32)
    for j, pos in enumerate(nonspace):
        fc = final_counts[j]
        if fc <= 0:
            # Per specification, ink is measured against the plate.  If the
            # final frame carries no plate difference there, leave -1 (space-
            # like) rather than inventing a value.
            continue
        hits = np.nonzero(counts[:, j] >= 0.5 * fc)[0]
        if len(hits):
            ff[pos] = int(hits[0])
        else:
            # Numerically, the final frame should always satisfy >= 50 %.  This
            # is a defensive fallback for tiny pixel/compression differences.
            ff[pos] = int(np.argmax(counts[:, j]))
    return ff


def _detect_shot_texts(F, bgs, fps, w, h):
    if not F:
        return []
    last = len(F) - 1
    interval = max(1, int(round(fps * 0.5)))
    indices = sorted(set([last] + list(range(0, len(F), interval))))

    raw_items = []
    for idx in indices:
        if idx >= len(F):
            continue
        for item in _rapid_ocr(F[idx]):
            try:
                box_pts, text, score = item[0], item[1], item[2]
            except Exception:
                continue
            text = _norm_text(text)
            if not text:
                continue
            bbox = _ocr_box_to_xywh(box_pts, w, h)
            if not bbox:
                continue
            x, y, bw, bh = bbox
            if bw < 3 or bh < 3:
                continue
            raw_items.append(dict(
                f=int(idx), x=x, y=y, w=bw, h=bh,
                y_center=y + bh / 2.0, x_center=x + bw / 2.0,
                score=float(score) if score is not None else 0.0, text=text))

    if not raw_items:
        return []

    candidates = _merge_items_by_frame(raw_items)
    clusters = _cluster_candidates(candidates)
    texts = []
    for cl in clusters:
        string = cl['string']
        box = cl['box']
        try:
            ff = _first_frames_per_char(F, bgs, box, string)
        except Exception:
            ff = [-1] * len(string)
        texts.append(dict(
            string=string,
            box=[int(v) for v in box],
            first_frame_per_char=ff,
            conf=float(cl['conf'])))
    return texts


# ------------------------------------------------------------------ decompose
REUSE_PSNR = 26.0


def _fit_accept(q, plate_q, plate_bg_q):
    """Accept a recycled pose only when it clearly beats both plate-only
    prediction and the plate's own error measured on known background pixels
    in the same crop. If the plate started blurry from sub-pixel interpolation,
    don't demand an impossible absolute PSNR: require just a few decibels above
    that local plate error."""
    if q < 15.0 or q < plate_q + 3.0:
        return False
    return q >= min(REUSE_PSNR, plate_bg_q + 2.0)


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
            m, d = fg_mask(f, bgs[i]); masks.append(m); comps.append(components(m, frame=f, bg=bgs[i], diff=d))
        tracks = track(comps)
        plate, nfix = refine_plate(F, plate, origin, off, masks)
        if nfix:  # second pass on the repaired plate
            cv2.imwrite(os.path.join(out, 'assets', pid), plate)
            bgs = [plate_view(plate, origin, off[i], w, h) for i in range(len(F))]
            masks, comps = [], []
            for i, f in enumerate(F):
                m, d = fg_mask(f, bgs[i]); masks.append(m); comps.append(components(m, frame=f, bg=bgs[i], diff=d))
            tracks = track(comps)
        layers = []
        for t in tracks:
            fids = sorted(t['frames'])
            # a bank of poses: start from the largest view; a frame no pose explains adds a new pose cut from it
            bank = []  # [dict(img, name, x, y, c, area)]
            def add_pose(f):
                spr, (px, py) = cut_sprite(F[f], bgs[f], t['frames'][f]['box'])
                name = f's{si:02d}_e{t["id"]:03d}_p{len(bank):02d}.png'; cv2.imwrite(os.path.join(out, 'assets', name), spr)
                ys_, xs_ = np.nonzero(spr[..., 3] > 128)
                if len(xs_):
                    bbox_local = (int(xs_.min()), int(ys_.min()), int(xs_.max()), int(ys_.max()))
                    bb = ((float(xs_.min() + xs_.max()) / 2.0), (float(ys_.min() + ys_.max()) / 2.0))
                else:
                    bbox_local = (0, 0, spr.shape[1] - 1, spr.shape[0] - 1)
                    bb = (spr.shape[1] / 2.0, spr.shape[0] / 2.0)
                bank.append(dict(img=spr, name=name, x=px, y=py, c=t['frames'][f]['c'], area=t['frames'][f]['area'],
                                 bb=bb, bbox_local=bbox_local, last_M=np.float32([[1, 0, px], [0, 1, py]])))
                return len(bank) - 1
            key = max(fids, key=lambda f: t['frames'][f]['area']); add_pose(key)
            per, baked, last = {}, {}, 0
            K0 = bank[0]; Kprev = None  # motion channel: always against the key pose, warm-started from the last frame
            for f in fids:
                comp = t['frames'][f]
                c = comp['c']; x, y, bw, bh = comp['box']; pad = 4
                x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
                crop = (x0, y0, x1, y1)

                # Plate's own remaining error in this crop, measured on pixels the
                # current foreground mask considers background. This is the correct
                # local baseline for accepting a pose: if plate reconstruction is
                # already soft from sub-pixel camera interpolation, a fitted sprite
                # cannot be held to an absolute PSNR that the crop itself can't reach.
                bg_known = (masks[f][y0:y1, x0:x1] == 0).astype(np.float32)
                if bg_known.sum() >= 20:
                    plate_bg_q = _psnr_weighted(bgs[f][y0:y1, x0:x1], F[f][y0:y1, x0:x1], bg_known)
                else:
                    plate_bg_q = 99.0

                area_scale_key = float(np.clip(math.sqrt(max(1, comp['area']) / max(1, K0['area'])), 0.2, 3.0))
                # Key-pose motion channel, kept independent of which bank pose is used for rendering.
                Km, kcc = fit_similarity(K0['img'], F[f], bgs[f],
                                         (K0['x'] + c[0] - K0['c'][0], K0['y'] + c[1] - K0['c'][1]),
                                         area_scale_key)
                if Kprev is not None:
                    Kp, pcc = fit_similarity_from(K0['img'], F[f], Kprev)
                    if Kp is not None and (Km is None or pcc > kcc):
                        Km, kcc = Kp, pcc
                if Km is not None and kcc > 0.6:
                    Kprev = Km
                # Choose a bank pose.  Directly reusing the previous transform is
                # cheap and handles fades/still frames.  Otherwise fall back to
                # ECC (translation first, then affine), warm-started ECC, edge
                # aligned guesses, and a sparse integer translation refinement.
                order = [last] + [k for k in range(len(bank) - 1, -1, -1) if k != last]
                done = False
                best_obj = None
                for k in order:
                    pz = bank[k]
                    cands = []
                    have_excellent_direct = False
                    if pz.get('last_M') is not None:
                        alpha_direct, q_direct, plate_direct = _fit_quality(bgs[f], pz['img'], pz['last_M'], F[f], crop)
                        cands.append(dict(q=q_direct, M=pz['last_M'], alpha=alpha_direct, cc=-1.0,
                                          plate_q=plate_direct))
                        if q_direct >= 36.0 and _fit_accept(q_direct, plate_direct, plate_bg_q):
                            have_excellent_direct = True
                    if not have_excellent_direct:
                        area_scale = float(np.clip(math.sqrt(max(1, comp['area']) / max(1, pz['area'])), 0.2, 3.0))
                        s_guesses = [1.0]
                        if abs(area_scale - 1.0) > 0.05:
                            s_guesses.append(area_scale)
                        for s0 in s_guesses:
                            cand = _try_fit_candidate(pz, F[f], bgs[f], crop,
                                                      (pz['x'] + c[0] - pz['c'][0], pz['y'] + c[1] - pz['c'][1]),
                                                      s0)
                            if cand is not None:
                                cands.append(cand)
                        if pz.get('last_M') is not None:
                            for motion in (cv2.MOTION_TRANSLATION, cv2.MOTION_AFFINE):
                                Mw, cw = fit_similarity_from(pz['img'], F[f], pz['last_M'], motion=motion)
                                if Mw is not None:
                                    alpha_w, q_w, plate_w = _fit_quality(bgs[f], pz['img'], Mw, F[f], crop)
                                    cands.append(dict(q=q_w, M=Mw, alpha=alpha_w, cc=cw,
                                                      plate_q=plate_w))
                        edge_guess = None
                        if x <= 0 or x + bw >= w - 1 or y <= 0 or y + bh >= h - 1:
                            edge_guess = _edge_guess(pz, (x, y, bw, bh), w, h)
                            if edge_guess is not None:
                                cand = _try_fit_candidate(pz, F[f], bgs[f], crop, edge_guess, 1.0)
                                if cand is not None:
                                    cands.append(cand)
                        # Translation-only integer search copes with clipped
                        # solid-colour shapes better than ECC does when only a
                        # sliver of the sprite is visible.
                        trans_guesses = [(pz['x'] + c[0] - pz['c'][0], pz['y'] + c[1] - pz['c'][1])]
                        if edge_guess is not None:
                            trans_guesses.append(edge_guess)
                        cand = _translation_search(pz, F[f], bgs[f], crop, trans_guesses, 8)
                        if cand is not None:
                            cands.append(cand)
                    if cands:
                        best = max(cands, key=lambda d: d['q'])
                        if _fit_accept(best['q'], best.get('plate_q', 1.0), plate_bg_q):
                            best_obj = best
                            done = True
                            break
                motion = Km.tolist() if (Km is not None and kcc > 0.6) else None
                if not done:  # new pose: identity placement of a sprite cut from this very frame (exact)
                    k = add_pose(f); last = k
                    baked[f] = k
                    per[f] = dict(pose=k, M=[[1.0, 0.0, bank[k]['x']], [0.0, 1.0, bank[k]['y']]])
                else:
                    last = k
                    per[f] = dict(pose=k, M=best_obj['M'].tolist(), opacity=round(float(best_obj['alpha']), 4))
                    bank[k]['last_M'] = best_obj['M']
                if motion is not None:
                    per[f]['K'] = motion
                    per[f]['Kcc'] = float(kcc)
                    per[f]['area'] = int(comp['area'])
            layers_poses = [p_['name'] for p_ in bank]
            # motion fits on the rigid frames
            LIM = {'x': (0.75, 0.05), 'y': (0.75, 0.05), 'scale': (0.02, 0.004), 'rotate': (1.0, 0.1)}
            fits = {}
            if sum('K' in v for v in per.values()) >= 3:
                fs = sorted([int(f) for f in per if 'K' in per[f]])
                P = np.array([per[f]['K'] for f in fs], dtype=np.float64)
                # motion of the key pose: position = where its centre lands; scale/rotation relative to the key view
                bx = np.full(len(fs), K0['bb'][0]); by = np.full(len(fs), K0['bb'][1])
                tx = P[:, 0, 0] * bx + P[:, 0, 1] * by + P[:, 0, 2]
                ty = P[:, 1, 0] * bx + P[:, 1, 1] * by + P[:, 1, 2]
                sc = np.sqrt(P[:, 0, 0] ** 2 + P[:, 1, 0] ** 2)
                rot = np.degrees(np.arctan2(P[:, 1, 0], P[:, 0, 0]))
                areas = np.array([per[f].get('area', 1000) for f in fs], dtype=np.float64)
                confs = np.array([per[f].get('Kcc', 1.0) for f in fs], dtype=np.float64)
                weights = np.sqrt(np.maximum(areas, 1.0)) * np.clip(confs, 0.0, 1.0)
                if weights.sum() > 0:
                    weights = weights / weights.mean()
                for name, ser in (('x', tx), ('y', ty), ('scale', sc), ('rotate', rot)):
                    smooth = 7 if name == 'scale' else None
                    eps_frac_fit = 0.01 if name == 'scale' else 0.002
                    fits[name] = fit_segments(ser, fps, min_range=LIM[name][0], min_eps=LIM[name][1],
                                              eps_frac=eps_frac_fit,
                                              weights=weights, x=np.array(fs, dtype=np.float64), smooth=smooth,
                                              first_visible=fids[0])

            # Component-derived fallback/additional fits for x/y/scale. These are
            # independent of ECC and recover moves for low-texture sprites or
            # shapes entering from off-screen where a key-pose ECC fit may be
            # missing or unreliable for many frames.
            if len(fids) >= 3:
                fids_arr = np.array(fids, dtype=np.float64)
                areas_c = np.array([t['frames'][f].get('area', 1) for f in fids], dtype=np.float64)
                w_c = np.sqrt(np.maximum(areas_c, 1.0))
                if w_c.sum() > 0:
                    w_c = w_c / w_c.mean()
                cx_c = np.array([t['frames'][f]['c'][0] for f in fids], dtype=np.float64)
                cy_c = np.array([t['frames'][f]['c'][1] for f in fids], dtype=np.float64)
                scale_c = np.sqrt(np.maximum(areas_c, 1.0))
                comp_smooth = {'x': 3, 'y': 3, 'scale': 7}
                for name in ('x', 'y', 'scale'):
                    ser = {'x': cx_c, 'y': cy_c, 'scale': scale_c}[name]
                    eps_frac_fit = 0.01 if name == 'scale' else 0.002
                    segs = fit_segments(ser, fps, min_range=LIM[name][0], min_eps=LIM[name][1],
                                        eps_frac=eps_frac_fit,
                                        weights=w_c, x=fids_arr, smooth=comp_smooth[name],
                                        first_visible=fids[0])
                    if name not in fits:
                        fits[name] = segs
                    else:
                        for s in segs:
                            if s['kind'] == 'tween':
                                fits[name].append(s)

            layers.append(dict(id=f'e{t["id"]:03d}', poses=layers_poses, first=fids[0], last=fids[-1],
                               frames={str(k): v for k, v in per.items()}, new_pose_at={str(k): v for k, v in baked.items()}, fits=fits))
        texts = _detect_shot_texts(F, bgs, fps, w, h)
        scene['shots'].append(dict(index=si, start=a, end=b, plate=pid, origin=list(origin), camera=off.tolist(), texts=texts, layers=layers))
        if verbose:
            nt = sum(len(L['frames']) for L in layers); nb = sum(len(L['new_pose_at']) for L in layers)
            print(f'[revid] shot {si}: frames {a}-{b - 1}, camera pan {off[-1].round(1).tolist()}, {len(layers)} elements, '
                  f'{nt - nb} element-frames by reusing a pose, {nb} new poses', flush=True)
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
    rw = Writer(res_path, w, h, fps, lossless=True, pix='bgr48le') if write_residual else None
    rr = read_frames(res_path, w, h, 'bgr48le') if (residual and not write_residual and os.path.exists(res_path)) else None
    orig = read_frames(S['source'], w, h)
    stats = []
    for sh in S['shots']:
        plate = A(sh['plate'], cv2.IMREAD_COLOR); cam = np.array(sh['camera']); origin = sh['origin']
        sprites = {(L['id'], k): A(nm) for L in sh['layers'] for k, nm in enumerate(L['poses'])}
        P, Q = [], []
        for i in range(sh['end'] - sh['start']):
            f = i  # shot-local frame index
            img = plate_view(plate, origin, cam[i], w, h).astype(np.float32)
            for L in sh['layers']:
                e = L['frames'].get(str(f))
                if e:
                    sprite = sprites[(L['id'], e['pose'])]
                    img = composite(img, sprite, np.float32(e['M']), alpha_scale=e.get('opacity', 1.0))
            model = np.clip(img + 0.5, 0, 255).astype(np.uint8)
            o = next(orig)
            if rw is not None:  # residual = original - model, 16-bit, offset 32768 (lossless, never clips)
                rw.write((o.astype(np.int32) - model.astype(np.int32) + 32768).astype(np.uint16))
            out_f = model
            if rr is not None:
                r = next(rr).astype(np.int32) - 32768
                out_f = np.clip(model.astype(np.int32) + r, 0, 255).astype(np.uint8)
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
    t = sum(len(L['frames']) for sh in S['shots'] for L in sh['layers']); b = sum(len(L['new_pose_at']) for sh in S['shots'] for L in sh['layers'])
    return t - b, b


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
           f'Understanding: {r} element-frames explained by reusing a pose + transform, {b} needed a new pose ({100 * r / max(1, r + b):.0f} % modelled).', '',
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
