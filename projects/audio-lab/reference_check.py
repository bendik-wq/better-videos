#!/usr/bin/env python3
"""Blind self-check: compare our mix's spectral and dynamic profile against real references.

usage: python3 projects/audio-lab/reference_check.py <our mix.wav> <our vo.wav> <out dir> [ref.wav ...]

References are measured locally and never committed (see docs/audio/reference-norms.md for the
list and their licences/sources). For each file we compute: integrated loudness, LRA, PLR (true
peak minus integrated), short-term loudness spread, octave-band balance relative to 1 kHz,
octave-band tilt (100 Hz - 10 kHz), stereo correlation and side level. The LTAS curves are
overlaid on one plot, each normalised to its own 1 kHz octave so only the shape is compared.
"""
import json, os, sys
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine"))
from music import qa, dsp  # noqa: E402


def profile(path, label):
    x = qa.load(path)
    L = dsp.loudness(x)
    f, p = qa.ltas(x)
    st = L["short_term"][L["short_term"] > -60]
    tp = float(dsp.db(dsp.true_peak(x)))
    return dict(label=label, file=os.path.basename(path), duration_s=round(len(x) / 48000, 1),
                integrated_lufs=round(L["integrated"], 1), lra_lu=round(L["lra"], 1), plr_db=round(tp - L["integrated"], 1),
                short_term_sd=round(float(np.std(st)), 2), true_peak_dbtp=round(tp, 1),
                bands=qa.octave_bands(f, p), tilt=round(qa.tilt(f, p), 2), tilt_500_8k=round(qa.tilt(f, p, 500, 8000), 2),
                stereo=qa.stereo(x)), (f, p)


def main():
    mix, vo, out = sys.argv[1], sys.argv[2], sys.argv[3]
    refs = sys.argv[4:]
    os.makedirs(out, exist_ok=True)
    rows, curves = [], []
    for path, lab in [(mix, "OUR MIX"), (vo, "OUR VO (Kokoro + chain)")] + [(r, os.path.basename(r)[:-4]) for r in refs]:
        r, c = profile(path, lab); rows.append(r); curves.append((lab, c))
        print(json.dumps(r))
    json.dump(rows, open(os.path.join(out, "reference-check.json"), "w"), indent=1)
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 5), dpi=110)
    for lab, (f, p) in curves:
        ref = p[(f > 700) & (f < 1400)].mean()
        k = max(1, 8)  # light smoothing for readability
        y = np.convolve(p - ref, np.ones(k) / k, mode="same")
        ax.semilogx(f[1:], y[1:], lw=2.2 if lab.startswith("OUR") else 1.0, label=lab, alpha=1 if lab.startswith("OUR") else 0.75)
    ax.set_xlim(30, 20000); ax.set_ylim(-60, 25); ax.grid(alpha=0.3, which="both")
    ax.set_xlabel("Hz"); ax.set_ylabel("dB re 0.7-1.4 kHz"); ax.legend(fontsize=8)
    ax.set_title("Long-term spectrum: our mix and VO vs. references (shape only)")
    fig.tight_layout(); fig.savefig(os.path.join(out, "reference-ltas.png")); plt.close(fig)
    bands = list(rows[0]["bands"].keys())
    md = "| file | LUFS | LRA | PLR | ST sd | tilt 100-10k | tilt 500-8k | corr | " + " | ".join(bands) + " |\n"
    md += "|---" * (8 + len(bands)) + "|\n"
    for r in rows:
        md += f"| {r['label']} | {r['integrated_lufs']} | {r['lra_lu']} | {r['plr_db']} | {r['short_term_sd']} | {r['tilt']} | {r['tilt_500_8k']} | {r['stereo']['correlation']} | " + \
              " | ".join(str(r["bands"][b]) for b in bands) + " |\n"
    open(os.path.join(out, "reference-check.md"), "w").write(md)
    print(md)


if __name__ == "__main__":
    main()
