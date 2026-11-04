"""DSP toolkit for the score engine: filters, envelopes, dynamics, reverb, loudness.

Everything is numpy + scipy.signal, 48 kHz float64, and deterministic (no wall clock,
no global RNG: every noise source takes an explicit seed).
"""
import numpy as np
from scipy import signal as ss

SR = 48000


def rng(seed):
    return np.random.default_rng(int(seed) & 0xFFFFFFFF)


def db(x):
    return 20 * np.log10(np.maximum(np.abs(x), 1e-12))


def undb(d):
    return 10 ** (np.asarray(d, dtype=float) / 20)


# ---------------------------------------------------------------- filters (RBJ cookbook biquads)
def _biquad(kind, f, q=0.707, gain_db=0.0, sr=SR):
    f = min(max(f, 5.0), sr * 0.49)
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f / sr; c = np.cos(w0); s = np.sin(w0); al = s / (2 * q)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == "bp":
        b = [al, 0, -al]; a = [1 + al, -2 * c, 1 - al]
    elif kind == "peak":
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == "lowshelf":
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    elif kind == "highshelf":
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    else:
        raise ValueError(kind)
    b = np.array(b) / a[0]; a = np.array(a) / a[0]
    return np.concatenate([b, a])[None, :]


def sosfilt_chunked(sos, x, chunk=1 << 20):
    """sosfilt with the state carried across chunks: identical output, bounded temporaries."""
    if len(x) <= 2 * chunk:
        return ss.sosfilt(sos, x, axis=0)
    y = np.empty(x.shape, np.result_type(x.dtype, np.float32))
    zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
    for a in range(0, len(x), chunk):
        y[a:a + chunk], zi = ss.sosfilt(sos, x[a:a + chunk], axis=0, zi=zi)
    return y


def _apply(sos, x):
    return sosfilt_chunked(sos, x)


def lp(x, f, q=0.707): return _apply(_biquad("lp", f, q), x)
def hp(x, f, q=0.707): return _apply(_biquad("hp", f, q), x)
def bp(x, f, q=1.0): return _apply(_biquad("bp", f, q), x)
def peak(x, f, g, q=1.0): return _apply(_biquad("peak", f, q, g), x)
def lowshelf(x, f, g, q=0.707): return _apply(_biquad("lowshelf", f, q, g), x)
def highshelf(x, f, g, q=0.707): return _apply(_biquad("highshelf", f, q, g), x)


def lp4(x, f):  # 24 dB/oct Butterworth
    return sosfilt_chunked(ss.butter(4, min(f, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp4(x, f):
    return sosfilt_chunked(ss.butter(4, f, "high", fs=SR, output="sos"), x)


def eq(x, bands):
    """bands: [(kind, f, gain_db, q)]; kind in peak/lowshelf/highshelf/hp/lp."""
    for k, f, g, q in bands:
        x = _apply(_biquad(k, f, q, g), x)
    return x


def tv_lowpass(x, cutoff, q=0.8, block=256):
    """Time-varying resonant low-pass (2-pole). cutoff: scalar or per-sample array (Hz).
    Coefficients update every `block` samples; filter state carries across blocks (TDF-II)."""
    x = np.asarray(x, float); n = len(x)
    cut = np.broadcast_to(np.asarray(cutoff, float), (n,))
    y = np.empty_like(x); zi = np.zeros((1, 2) + x.shape[1:])
    for i in range(0, n, block):
        sos = _biquad("lp", float(cut[min(i + block // 2, n - 1)]), q)
        if x.ndim > 1:
            seg, z = ss.sosfilt(sos, x[i:i + block], axis=0, zi=zi)
        else:
            seg, z = ss.sosfilt(sos, x[i:i + block], zi=zi)
        y[i:i + block] = seg; zi = z
    return y


def crossover3(x, f1=250.0, f2=5000.0):
    """Linkwitz-Riley 4th-order 3-band split. low + mid + high sums to an all-pass of x."""
    def lr4(kind, f):
        s = ss.butter(2, f, kind, fs=SR, output="sos"); return np.concatenate([s, s])
    low = ss.sosfilt(lr4("low", f1), x, axis=0)
    rest = ss.sosfilt(lr4("high", f1), x, axis=0)
    # all-pass compensate the low band for the f2 split so the sum stays flat
    low = ss.sosfilt(lr4("high", f2), low, axis=0) + ss.sosfilt(lr4("low", f2), low, axis=0)
    mid = ss.sosfilt(lr4("low", f2), rest, axis=0)
    high = ss.sosfilt(lr4("high", f2), rest, axis=0)
    return low, mid, high


# ---------------------------------------------------------------- envelopes
def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, gate=None):
    """Linear-attack, exponential decay/release ADSR of n samples. gate (s) = note-off time."""
    t = np.arange(n) / SR
    gate = n / SR - r if gate is None else gate
    e = np.where(t < a, t / max(a, 1e-5), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-5)))
    lvl = (gate / max(a, 1e-5)) if gate < a else s + (1 - s) * np.exp(-(gate - a) / max(d, 1e-5))
    e = np.where(t >= gate, lvl * np.exp(-(t - gate) / max(r / 4.6, 1e-5)), e)
    return e


def fade(x, fin=0.0, fout=0.0):
    n = len(x); y = x.copy()
    if fin > 0:
        k = min(n, int(fin * SR)); w = np.sin(np.linspace(0, np.pi / 2, k)) ** 2
        y[:k] *= w if y.ndim == 1 else w[:, None]
    if fout > 0:
        k = min(n, int(fout * SR)); w = np.cos(np.linspace(0, np.pi / 2, k)) ** 2
        y[n - k:] *= w if y.ndim == 1 else w[:, None]
    return y


def smooth(x, attack, release, block=16):
    """Attack/release ballistics on a non-negative control signal (e.g. gain reduction in dB).
    Runs a one-pole follower on block maxima (block = 16 samples = 0.33 ms), then interpolates."""
    x = np.asarray(x, float); n = len(x)
    nb = -(-n // block)
    xb = np.pad(x, (0, nb * block - n), mode="edge").reshape(nb, block).max(1)
    ka = 1 - np.exp(-block / max(1.0, attack * SR)) if attack > 0 else 1.0
    kr = 1 - np.exp(-block / max(1.0, release * SR))
    yb = np.empty(nb); y = 0.0
    for i, v in enumerate(xb.tolist()):
        y += (v - y) * (ka if v > y else kr); yb[i] = y
    return np.interp(np.arange(n), np.arange(nb) * block + block / 2, yb)


def maxfilt(x, w):
    from scipy.ndimage import maximum_filter1d
    return maximum_filter1d(x, size=int(w), origin=-(int(w) // 2) if w > 1 else 0, mode="nearest")


def minfilt(x, w):
    from scipy.ndimage import minimum_filter1d
    return minimum_filter1d(x, size=int(w), mode="nearest")


def movavg(x, k, edge=False):
    """Centred moving average of a 1-D signal (cumsum, O(N): direct convolution is far too slow
    on a full episode). edge=True pads with the edge values instead of zeros."""
    k = max(1, int(k)); x = np.asarray(x, np.float64)
    a, b = k // 2, k - 1 - k // 2
    xp = np.pad(x, (a + 1, b), mode="edge" if edge else "constant")
    c = np.cumsum(xp)
    return (c[k:] - c[:-k]) / k


def rms_env(x, win=0.03):
    m = x if x.ndim == 1 else x.mean(1)
    k = max(1, int(win * SR))
    return np.sqrt(np.maximum(movavg(m * m, k), 0) + 1e-12)


# ---------------------------------------------------------------- dynamics
def compress(x, thresh_db=-18, ratio=2.0, attack=0.03, release=0.25, knee=6.0, makeup_db=0.0, key=None, rms=0.01):
    """Feed-forward soft-knee compressor (stereo-linked). key: optional sidechain signal."""
    k = x if key is None else key
    lvl = db(rms_env(k, rms) * np.sqrt(2))
    over = lvl - thresh_db
    gr = np.where(over <= -knee / 2, 0.0,
                  np.where(over >= knee / 2, over * (1 - 1 / ratio), (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    g = undb(-smooth(gr, attack, release) + makeup_db)
    return x * (g[:, None] if x.ndim > 1 else g), g


def true_peak(x, os=4):
    """ITU-R BS.1770-4 style true peak (4x polyphase oversampling), chunked."""
    n, B, P, m = len(x), 1 << 20, 64, 0.0
    for a in range(0, n, B):
        lo, hi = max(0, a - P), min(n, a + B + P)
        m = max(m, float(np.abs(ss.resample_poly(x[lo:hi], os, 1, axis=0)).max()))
    return m


def limit(x, ceiling_db=-1.0, lookahead=0.005, release=0.08, os=4):
    """Look-ahead brick-wall limiter with a true-peak (4x oversampled) detector. Ceiling in dBTP.
    Gain is the forward-looking minimum of the required gain, averaged over the look-ahead window
    (a ramp that always reaches the required gain by the peak), then released smoothly."""
    c = undb(ceiling_db); n = len(x)
    det = np.empty(n, np.float32)
    B, P = 1 << 20, 64  # chunked 4x oversampling with 64-sample guards: bounded memory on long files
    for a in range(0, n, B):
        lo, hi = max(0, a - P), min(n, a + B + P)
        up = np.abs(ss.resample_poly(x[lo:hi], os, 1, axis=0))
        if up.ndim > 1: up = up.max(1)
        up = up[: (hi - lo) * os].reshape(hi - lo, os).max(1)
        det[a:min(n, a + B)] = up[a - lo:a - lo + min(B, n - a)]
    need = np.minimum(1.0, c / np.maximum(det, 1e-12)).astype(np.float32); del det
    la = max(2, int(lookahead * SR))
    from scipy.ndimage import minimum_filter1d
    fwd = minimum_filter1d(need, size=la, origin=-(la // 2), mode="nearest")  # min over [n, n+la)
    cs = np.cumsum(np.pad(fwd.astype(np.float64), (la, 0), mode="edge"))
    ramp = ((cs[la:] - cs[:-la]) / la).astype(np.float32)  # mean of the last `la` samples
    gr = smooth(-db(ramp), 0.0, release)  # dB of reduction, release ballistics
    g = np.minimum(ramp, undb(-gr))
    y = x * (g[:, None] if x.ndim > 1 else g)
    tp = true_peak(y)
    if tp > c:  # residual inter-sample overs from the filter: trim (normally < 0.1 dB)
        y *= c / tp
    return y


def saturate(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- reverb
def make_ir(kind="hall", seed=1, length=None):
    """Synthetic stereo impulse response.
    hall: 3.2 s RT60, 24 ms pre-delay, darker tail, sparse early reflections.
    plate: 1.9 s, 6 ms pre-delay, dense and bright.
    room: 0.45 s, small and subtle (voice)."""
    P = {"hall": dict(rt=3.2, pre=0.024, hf=0.45, er=12, erspan=0.08, lp=7000),
         "plate": dict(rt=1.9, pre=0.006, hf=0.75, er=0, erspan=0.0, lp=11000),
         "room": dict(rt=0.45, pre=0.004, hf=0.5, er=8, erspan=0.025, lp=8000),
         "cathedral": dict(rt=6.0, pre=0.035, hf=0.4, er=10, erspan=0.12, lp=5000)}[kind]
    L = length or P["rt"] * 1.2
    n = int(L * SR); t = np.arange(n) / SR; r = rng(seed)
    out = np.zeros((n, 2))
    bands = [(0, 250, 1.15), (250, 1000, 1.0), (1000, 4000, 0.8), (4000, 20000, P["hf"])]
    for ch in range(2):
        noise = r.standard_normal(n)
        tail = np.zeros(n)
        X = np.fft.rfft(noise); f = np.fft.rfftfreq(n, 1 / SR)
        for lo, hi, m in bands:
            Xb = X * ((f >= lo) & (f < hi))
            rt = P["rt"] * m
            tail += np.fft.irfft(Xb, n) * np.exp(-6.91 * t / rt)
        # density build-up: soft onset of the diffuse tail
        tail *= 1 - np.exp(-t / 0.012)
        er = np.zeros(n)
        for k in range(P["er"]):
            d = P["pre"] + r.uniform(0.002, P["erspan"])
            i = int(d * SR)
            if i < n: er[i] += r.uniform(0.25, 0.6) * (1 if r.random() < 0.5 else -1) * np.exp(-d / 0.08)
        pre = int(P["pre"] * SR)
        sig = np.zeros(n); sig[pre:] = tail[: n - pre] * 0.5
        out[:, ch] = sig + er
    out = lp(out, P["lp"])
    out /= np.sqrt((out ** 2).sum(0).mean())
    return out


_IR = {}


def reverb(x, kind="hall", mix=0.25, seed=1, width=1.0):
    """Convolution reverb, returns dry*(1-mix) + wet*mix. x mono or stereo."""
    key = (kind, seed)
    if key not in _IR: _IR[key] = make_ir(kind, seed)
    ir = _IR[key]
    if x.ndim == 1: x = np.stack([x, x], 1)
    n = len(x)
    wet = np.stack([ss.oaconvolve(x[:, c], ir[:, c])[:n] for c in range(2)], 1)
    # cross-feed a little so mono sources bloom into both sides
    wet = widen(wet, width)
    return x * (1 - mix) + wet * mix


def reverb_wet(x, kind="hall", seed=1):
    """Wet signal only (100 % wet), overlap-add convolution so long files stay light on memory."""
    key = (kind, seed)
    if key not in _IR: _IR[key] = make_ir(kind, seed)
    ir = _IR[key].astype(np.float32 if x.dtype == np.float32 else np.float64)
    if x.ndim == 1: x = np.stack([x, x], 1)
    n = len(x)
    return np.stack([ss.oaconvolve(x[:, c], ir[:, c])[:n] for c in range(2)], 1)


def widen(x, width=1.2):
    """M/S width: 0 = mono, 1 = unchanged, >1 = wider."""
    m = (x[:, 0] + x[:, 1]) / 2; s = (x[:, 0] - x[:, 1]) / 2 * width
    return np.stack([m + s, m - s], 1)


def haas(x, ms=12.0, amount=0.5):
    """Mono -> stereo via a short decorrelating delay on one side, mixed in partially."""
    d = int(ms * SR / 1000); y = np.zeros(len(x)); y[d:] = x[:-d]
    return np.stack([x, x * (1 - amount) + y * amount], 1)


def pan(x, p):
    """Equal-power pan of a mono signal, p in [-1, 1]."""
    return np.stack([x * np.sqrt(0.5 * (1 - p)), x * np.sqrt(0.5 * (1 + p))], 1)


# ---------------------------------------------------------------- loudness (ITU-R BS.1770-4 / EBU R128)
def _kweight(x, sr=SR):
    # stage 1 high shelf (+4 dB @ ~1.68 kHz), stage 2 RLB high-pass; coefficients from BS.1770 recomputed for sr
    f0 = 1681.974450955533; G = 3.999843853973347; Q = 0.7071752369554196
    K = np.tan(np.pi * f0 / sr); Vh = 10 ** (G / 20); Vb = Vh ** 0.4996667741545416
    a0 = 1 + K / Q + K * K
    b1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0]
    a1 = [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]
    f0 = 38.13547087602444; Q = 0.5003270373238773; K = np.tan(np.pi * f0 / sr)
    a2 = [1, 2 * (K * K - 1) / (1 + K / Q + K * K), (1 - K / Q + K * K) / (1 + K / Q + K * K)]
    b2 = [1, -2, 1]
    sos = np.concatenate([ss.tf2sos(b1, a1), ss.tf2sos(b2, a2)])
    return sosfilt_chunked(sos, x)


def loudness(x, sr=SR):
    """Integrated loudness (LUFS), momentary (400 ms) and short-term (3 s) series at 10 Hz, LRA."""
    if x.ndim == 1: x = x[:, None]
    y = _kweight(x, sr)
    p = np.einsum("ij,ij->i", y, y)  # channel weights 1.0 for L/R
    del y
    hop = int(0.1 * sr)
    cs = np.concatenate([[0], np.cumsum(p)])

    def blocks(win):
        w = int(win * sr); idx = np.arange(0, max(1, len(p) - w + 1), hop)
        return (cs[np.minimum(idx + w, len(p))] - cs[idx]) / w

    def lk(e): return -0.691 + 10 * np.log10(np.maximum(e, 1e-20))
    zm = blocks(0.4); M = lk(zm)
    g = zm[M > -70]
    if len(g) == 0:
        I = -70.0
    else:
        rel = lk(g.mean()) - 10
        g2 = g[lk(g) > rel]; I = float(lk(g2.mean())) if len(g2) else -70.0
    zs = blocks(3.0); S = lk(zs)
    s_abs = S[S > -70]
    if len(s_abs):
        rel = lk(zs[S > -70].mean()) - 20; s2 = np.sort(s_abs[s_abs > rel])
        LRA = float(np.percentile(s2, 95) - np.percentile(s2, 10)) if len(s2) > 2 else 0.0
    else:
        LRA = 0.0
    return dict(integrated=I, momentary=M, short_term=S, lra=LRA, hop=0.1)


def normalize_lufs(x, target=-14.0):
    I = loudness(x)["integrated"]
    return x * undb(target - I), I
