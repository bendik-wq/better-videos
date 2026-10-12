"""Audio QA: loudness, true peak, clipping, spectral balance, harsh resonances, stereo image.

usage: python3 -m music.qa file.wav [report.json] [plot-prefix]     (run from engine/)

The report is what we use instead of ears. Reference norms (docs/audio/reference-norms.md):
  integrated -14 LUFS +-1 (YouTube playback reference), true peak <= -1 dBTP,
  LRA 4-10 LU for narrated documentary, VO-to-music gap 10-20 LU under speech,
  spectral tilt -3.5 .. -6 dB/oct (100 Hz - 10 kHz) for broadcast/doc mixes,
  stereo correlation > 0.2 average (mono-compatible), no clipped runs.
"""
import json, sys
import numpy as np
from . import dsp
from .dsp import SR

OCT = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]


def ltas(x, nfft=8192):
    """Long-term average spectrum (power, dB) of the mono sum, Welch-averaged."""
    from scipy import signal as ss
    m = x.mean(1) if x.ndim > 1 else x
    f, p = ss.welch(m, SR, nperseg=nfft, noverlap=nfft // 2, window="hann")
    return f, 10 * np.log10(p + 1e-20)


def octave_bands(f, pdb):
    p = 10 ** (pdb / 10); out = {}
    for fc in OCT:
        lo, hi = fc / np.sqrt(2), fc * np.sqrt(2)
        sel = (f >= lo) & (f < hi)
        out[str(fc)] = float(10 * np.log10(p[sel].sum() + 1e-20)) if sel.any() else None
    ref = out["1000"]
    return {k: (round(v - ref, 1) if v is not None else None) for k, v in out.items()}


def tilt(f, pdb, lo=100, hi=10000):
    """Slope (dB/octave) of the LTAS in octave-band power terms between lo and hi.
    Octave-band power of pink noise is flat (0 dB/oct); typical mixes fall -3..-6 dB/oct on this scale
    when expressed as per-Hz density slope minus 3. We report the per-octave-band slope."""
    bands = octave_bands(f, pdb)
    xs = [np.log2(float(k)) for k, v in bands.items() if v is not None and lo <= float(k) <= hi]
    ys = [v for k, v in bands.items() if v is not None and lo <= float(k) <= hi]
    return float(np.polyfit(xs, ys, 1)[0])


def median_spectrum(x, nfft=4096):
    """Per-bin median (over loud frames) of the power spectrum: persistent resonances survive the
    median, notes and random fluctuation do not."""
    from scipy import signal as ss
    m = x.mean(1) if x.ndim > 1 else x
    f, t, Z = ss.spectrogram(m, SR, nperseg=nfft, noverlap=nfft // 2, window="hann")
    e = Z.sum(0); keep = e > np.percentile(e, 30)
    return f, 10 * np.log10(np.median(Z[:, keep], axis=1) + 1e-20)


def resonances(f, pdb, lo=1500, hi=9000, thresh=6.0):
    """Narrow peaks: spectrum minus a 1/3-octave smoothed version, above `thresh` dB, in the
    harshness region (1.5-9 kHz). Feed it median_spectrum() for robustness."""
    sel = (f > 100)
    lf = np.log2(f[sel]); y = pdb[sel]
    sm = np.array([y[np.abs(lf - v) < 1 / 6].mean() for v in lf])
    d = y - sm
    hits = []
    for i in np.where((d > thresh) & (f[sel] > lo) & (f[sel] < hi))[0]:
        if 0 < i < len(d) - 1 and d[i] >= d[i - 1] and d[i] >= d[i + 1]:
            hits.append(dict(hz=round(float(f[sel][i])), db=round(float(d[i]), 1)))
    return hits


def third_octaves(f, pdb):
    fc = 1000 * 2 ** (np.arange(-17, 14) / 3)  # 20 Hz .. 20 kHz
    p = 10 ** (pdb / 10); out = []
    for c in fc:
        sel = (f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6))
        out.append(10 * np.log10(p[sel].sum() + 1e-20) if sel.any() else np.nan)
    return fc, np.array(out)


def harshness(f, pdb, lo=1600, hi=8000, thresh=3.0):
    """Broad build-ups an engineer would call harsh: a 1/3-octave band in 1.6-8 kHz that stands
    more than `thresh` dB above the straight line through its +-2 neighbours."""
    fc, b = third_octaves(f, pdb); hits = []
    for i in range(2, len(fc) - 2):
        if not (lo <= fc[i] <= hi): continue
        nb = np.r_[b[i - 2:i], b[i + 1:i + 3]]
        exp = np.polyval(np.polyfit(np.r_[-2, -1, 1, 2], nb, 1), 0)
        if b[i] - exp > thresh: hits.append(dict(hz=round(float(fc[i])), db=round(float(b[i] - exp), 1)))
    return hits


def clipping(x, thr=0.999, run=3):
    a = np.abs(x).max(1) if x.ndim > 1 else np.abs(x)
    c = a >= thr
    if not c.any(): return 0
    # count runs of >= run consecutive clipped samples
    edges = np.diff(np.concatenate([[0], c.astype(int), [0]]))
    starts = np.where(edges == 1)[0]; ends = np.where(edges == -1)[0]
    return int(((ends - starts) >= run).sum())


def clicks(x, k=8.0, iso=4.0):
    """Discontinuities: second-difference spikes that are (a) more than `k` x the local 10 ms RMS
    of the second difference and (b) isolated: `iso` x above the largest second difference in the
    1 ms on either side (skipping 2 samples). A click is a lone impulse; a pluck or drum onset keeps
    the second difference high for milliseconds after it."""
    m = x.mean(1) if x.ndim > 1 else x
    d = np.diff(m, 2); d2 = np.abs(d)
    loc = dsp.rms_env(d, 0.01)
    cand = np.where((d2 > k * loc + 1e-4) & (d2 > 10 ** (-60 / 20)))[0]
    w = int(0.001 * SR)
    hits = [i for i in cand if w + 3 <= i < len(d2) - w - 3 and
            d2[i] > iso * max(d2[i - w:i - 2].max(), d2[i + 3:i + w].max())]
    idx = np.array(hits, int)
    if len(idx):  # merge hits within 5 ms
        idx = idx[np.concatenate([[True], np.diff(idx) > int(0.005 * SR)])]
    return dict(count=int(len(idx)), at_s=[round(float(i / SR), 3) for i in idx[:8]])


def stereo(x):
    if x.ndim == 1 or x.shape[1] == 1: return dict(correlation=1.0, balance_db=0.0, width=0.0)
    L, R = x[:, 0], x[:, 1]
    k = int(0.4 * SR); n = len(L) // k
    cs = []
    for i in range(n):
        l, r = L[i * k:(i + 1) * k], R[i * k:(i + 1) * k]
        d = np.sqrt((l * l).sum() * (r * r).sum())
        if d > 1e-6: cs.append((l * r).sum() / d)
    M, Sd = (L + R) / 2, (L - R) / 2
    return dict(correlation=round(float(np.mean(cs)) if cs else 1.0, 3),
                min_correlation=round(float(np.min(cs)) if cs else 1.0, 3),
                balance_db=round(float(dsp.db(np.sqrt((L ** 2).mean())) - dsp.db(np.sqrt((R ** 2).mean()))), 2),
                side_to_mid_db=round(float(dsp.db(np.sqrt((Sd ** 2).mean())) - dsp.db(np.sqrt((M ** 2).mean()) + 1e-12)), 1))


def report(x, vo=None, music=None, name=""):
    """x: final mix (N,2). vo/music: optional stems for the speech-vs-bed gap."""
    L = dsp.loudness(x)
    f, p = ltas(x)
    st = L["short_term"]
    r = dict(file=name, duration_s=round(len(x) / SR, 2),
             integrated_lufs=round(L["integrated"], 2), lra_lu=round(L["lra"], 2),
             max_short_term_lufs=round(float(st.max()), 2) if len(st) else None,
             max_momentary_lufs=round(float(L["momentary"].max()), 2),
             true_peak_dbtp=round(float(dsp.db(dsp.true_peak(x))), 2),
             sample_peak_dbfs=round(float(dsp.db(np.abs(x).max())), 2),
             clipped_runs=clipping(x), clicks=clicks(x), dc_offset=[round(float(v), 5) for v in np.atleast_1d(x.mean(0))],
             octave_bands_rel_1k=octave_bands(f, p), tilt_db_per_oct=round(tilt(f, p), 2),
             harsh_bands=harshness(f, p), narrow_resonances=resonances(*median_spectrum(x)), stereo=stereo(x))
    if x.ndim > 1:  # where is the image least mono-compatible?
        k = int(0.4 * SR); L_, R_ = x[:, 0], x[:, 1]
        cs = [((L_[i:i + k] * R_[i:i + k]).sum() / (np.sqrt((L_[i:i + k] ** 2).sum() * (R_[i:i + k] ** 2).sum()) + 1e-9), i / SR)
              for i in range(0, len(L_) - k, k) if np.abs(L_[i:i + k]).max() > 0.01]
        if cs: r["stereo"]["min_correlation_at_s"] = round(min(cs)[1], 1)
    if vo is not None and music is not None:
        # loudness gap between VO and music during speech (momentary, 400 ms)
        v = dsp.loudness(vo)["momentary"]; m = dsp.loudness(music)["momentary"]
        k = min(len(v), len(m)); sp = v[:k] > -40
        if sp.any():
            gap = v[:k][sp] - m[:k][sp]
            r["vo_over_music_lu"] = dict(median=round(float(np.median(gap)), 1), p10=round(float(np.percentile(gap, 10)), 1))
        r["speech_fraction"] = round(float(sp.mean()), 3)
    checks = {
        "loudness_-14_+-1": abs(r["integrated_lufs"] + 14) <= 1.0,
        "true_peak_<=-1": r["true_peak_dbtp"] <= -0.95,
        "no_clipping": r["clipped_runs"] == 0,
        "mono_compatible": r["stereo"]["correlation"] > 0.2,
        "balanced_lr": abs(r["stereo"]["balance_db"]) < 1.5,
        "no_harsh_buildup": len(r["harsh_bands"]) == 0,
    }
    r["checks"] = checks
    r["pass"] = all(checks.values())
    return r


def plots(x, prefix, title="", markers=(), vo=None):
    """spectrogram + loudness curve PNGs."""
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy import signal as ss
    m = x.mean(1) if x.ndim > 1 else x
    f, t, Z = ss.spectrogram(m, SR, nperseg=4096, noverlap=3072, window="hann")
    fig, ax = plt.subplots(figsize=(14, 5), dpi=110)
    ax.pcolormesh(t, f, 10 * np.log10(Z + 1e-14), shading="auto", cmap="magma", vmin=-130, vmax=-40)
    ax.set_yscale("symlog", linthresh=100); ax.set_ylim(20, 20000)
    ax.set_ylabel("Hz"); ax.set_xlabel("s"); ax.set_title(f"{title} spectrogram")
    for tm, lab in markers:
        ax.axvline(tm, color="w", lw=0.6, alpha=0.6); ax.text(tm + 0.2, 13000, lab, color="w", fontsize=8, rotation=90, va="top")
    fig.tight_layout(); fig.savefig(prefix + "-spectrogram.png"); plt.close(fig)

    L = dsp.loudness(x)
    fig, ax = plt.subplots(figsize=(14, 4), dpi=110)
    tm = np.arange(len(L["momentary"])) * 0.1 + 0.4
    ts = np.arange(len(L["short_term"])) * 0.1 + 3.0
    ax.plot(tm, L["momentary"], lw=0.6, color="#999", label="momentary (400 ms)")
    ax.plot(ts, L["short_term"], lw=1.6, color="#c33", label="short-term (3 s)")
    if vo is not None:
        Lv = dsp.loudness(vo)
        ax.plot(np.arange(len(Lv["momentary"])) * 0.1 + 0.4, Lv["momentary"], lw=0.6, color="#38c", alpha=0.7, label="VO momentary")
    ax.axhline(L["integrated"], color="k", ls="--", lw=1, label=f"integrated {L['integrated']:.1f} LUFS")
    ax.axhline(-14, color="g", ls=":", lw=1, label="target -14")
    for t0, lab in markers: ax.axvline(t0, color="#555", lw=0.5, alpha=0.5)
    ax.set_ylim(-50, -4); ax.set_xlabel("s"); ax.set_ylabel("LUFS"); ax.legend(loc="lower right", fontsize=8)
    ax.set_title(f"{title} loudness"); fig.tight_layout(); fig.savefig(prefix + "-loudness.png"); plt.close(fig)

    f, p = ltas(x)
    fig, ax = plt.subplots(figsize=(8, 4), dpi=110)
    ax.semilogx(f[1:], p[1:] - p[(f > 900) & (f < 1100)].mean(), lw=1, label="LTAS (rel 1 kHz)")
    ref = -10 * np.log10(f[1:] / 1000) - 1.5 * np.log2(f[1:] / 1000)  # -4.5 dB/oct density ~ typical doc mix
    ax.semilogx(f[1:], ref, "g:", label="reference tilt (-4.5 dB/oct density)")
    ax.set_xlim(20, 20000); ax.set_ylim(-60, 30); ax.set_xlabel("Hz"); ax.set_ylabel("dB"); ax.legend(fontsize=8)
    ax.set_title(f"{title} long-term spectrum"); fig.tight_layout(); fig.savefig(prefix + "-ltas.png"); plt.close(fig)


def load(path):
    import soundfile as sf
    x, sr = sf.read(path, always_2d=True)
    if sr != SR:
        from scipy import signal as ss
        x = ss.resample_poly(x, SR, sr, axis=0)
    return x


if __name__ == "__main__":
    x = load(sys.argv[1])
    r = report(x, name=sys.argv[1])
    s = json.dumps(r, indent=1)
    if len(sys.argv) > 2: open(sys.argv[2], "w").write(s)
    if len(sys.argv) > 3: plots(x, sys.argv[3], title=sys.argv[1].split("/")[-1])
    print(s)
