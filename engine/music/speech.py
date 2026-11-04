"""Speech analysis for the voice benchmark and VO QA: F0 (YIN), expressiveness, rate, sibilance."""
import numpy as np


def yin_f0(x, sr, fmin=60, fmax=400, hop=0.01, win=0.04, thresh=0.15):
    """Frame-wise F0 (Hz, NaN when unvoiced) with the YIN cumulative-mean-normalised difference."""
    x = np.asarray(x, float)
    if x.ndim > 1: x = x.mean(1)
    W = int(win * sr); H = int(hop * sr)
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    n = max(0, (len(x) - W - tmax) // H)
    out = np.full(n, np.nan); rms = np.zeros(n)
    for i in range(n):
        a = x[i * H: i * H + W + tmax]
        f = a[:W]
        rms[i] = np.sqrt((f * f).mean())
        # difference function via FFT autocorrelation
        F = np.fft.rfft(a, 2 * len(a))
        ac = np.fft.irfft(F * np.conj(np.fft.rfft(f, 2 * len(a))))[: tmax + 1]
        e0 = (f * f).sum()
        cs = np.cumsum(a * a)
        et = cs[np.arange(tmax + 1) + W - 1] - np.concatenate([[0], cs[: tmax]])
        d = e0 + et - 2 * ac
        d[0] = 0
        cm = d[1:] / np.maximum(np.cumsum(d[1:]) / np.arange(1, tmax + 1), 1e-12)
        cm = np.concatenate([[1], cm])
        cand = np.where(cm[tmin:] < thresh)[0]
        if len(cand):
            t = cand[0] + tmin
            while t + 1 <= tmax and cm[t + 1] < cm[t]: t += 1
            if 0 < t < tmax:  # parabolic interpolation
                a_, b_, c_ = cm[t - 1], cm[t], cm[t + 1]
                t = t + 0.5 * (a_ - c_) / max(a_ - 2 * b_ + c_, 1e-12)
            out[i] = sr / t
    loud = rms > rms.max() * 0.06
    out[~loud] = np.nan
    return out, rms


def profile(x, sr, words=None):
    """Prosody numbers for a narration take."""
    f0, rms = yin_f0(x, sr)
    v = f0[~np.isnan(f0)]
    st = 12 * np.log2(v / np.median(v)) if len(v) else np.array([0.0])
    dur = len(x) / sr
    # pauses: frames below -40 dB of max for >= 150 ms
    e = 20 * np.log10(rms / (rms.max() + 1e-12) + 1e-9)
    q = e < -40
    runs, k = [], 0
    for b in q:
        if b: k += 1
        else:
            if k: runs.append(k); k = 0
    pauses = [r * 0.01 for r in runs if r >= 15]
    spec = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    tot = spec[(f > 80)].sum() + 1e-12
    out = dict(duration_s=round(dur, 2), f0_median_hz=round(float(np.median(v)), 1) if len(v) else None,
               f0_range_st=round(float(np.percentile(st, 95) - np.percentile(st, 5)), 2),
               f0_sd_st=round(float(np.std(st)), 2), voiced_fraction=round(float(len(v) / max(1, len(f0))), 3),
               pause_count=len(pauses), pause_total_s=round(sum(pauses), 2),
               sibilance_pct=round(float(100 * spec[(f > 4500) & (f < 9000)].sum() / tot), 2),
               presence_pct=round(float(100 * spec[(f > 2000) & (f < 4500)].sum() / tot), 2),
               centroid_hz=round(float((spec * f).sum() / spec.sum()), 0))
    if words:
        n = len(words)
        speech = dur - sum(pauses)
        out["wpm"] = round(60 * n / dur, 1)
        out["articulation_wpm"] = round(60 * n / max(speech, 1e-3), 1)
    return out
