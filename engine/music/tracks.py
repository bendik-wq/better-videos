"""Licensed audio tracks (CC0 / public domain only) placed on the music bus.

Cue: {"type": "track", "file": "path.ogg|wav|mp3|flac", "shot": id, "at": s, "gain": 0.5 | "gainDb": -6,
      "from": s (offset into the file), "dur": s, "fadeIn": s, "fadeOut": s, "loop": false,
      "licence": "CC0-1.0" | "PD" | "PD-US" | "PDM-1.0", "source": url, "title": str, "author": str}

The licence must be one of ALLOWED, either on the cue or in a sidecar `<file>.licence.json`
({licence, source, title, author}). Anything else is refused. Every placed track is appended to the
licence log that score.py writes next to its output (score.licences.json), so a render always
says which recordings it used and under what terms.
"""
import json, os, subprocess
import numpy as np
from . import dsp
from .dsp import SR

ALLOWED = {"CC0", "CC0-1.0", "PD", "PD-US", "PDM", "PDM-1.0", "PUBLIC DOMAIN", "PUBLIC-DOMAIN", "US-GOV-PD"}


def licence_of(cue, root="."):
    meta = {}
    side = os.path.join(root, cue["file"]) + ".licence.json"
    if os.path.exists(side):
        meta = json.load(open(side))
    for k in ("licence", "source", "title", "author"):
        if cue.get(k): meta[k] = cue[k]
    lic = str(meta.get("licence", "")).upper().strip()
    if lic not in ALLOWED:
        raise ValueError(f"track {cue['file']}: licence {meta.get('licence')!r} is not CC0/public domain; refusing to use it")
    if not meta.get("source"):
        raise ValueError(f"track {cue['file']}: no source URL recorded")
    return meta


def decode(path):
    """Any ffmpeg-readable file -> (N,2) float at 48 kHz."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<f4").astype(float).reshape(-1, 2)


def render(cue, root="."):
    """Returns (signal (n,2), licence meta)."""
    meta = licence_of(cue, root)
    x = decode(os.path.join(root, cue["file"]))
    a = int(cue.get("from", 0) * SR)
    x = x[a:]
    if cue.get("dur"):
        n = int(cue["dur"] * SR)
        if cue.get("loop") and len(x) < n:
            x = np.concatenate([x] * (n // max(1, len(x)) + 1))
        x = x[:n]
    x = dsp.fade(x, cue.get("fadeIn", 0.05), cue.get("fadeOut", 0.5))
    # mono-compatibility: many PD recordings are wide spaced pairs (near-zero L/R correlation);
    # narrow them (M/S width, default 0.6) and correct a lopsided L/R balance
    x = dsp.widen(x, cue.get("width", 0.6))
    rl, rr = np.sqrt((x[:, 0] ** 2).mean() + 1e-12), np.sqrt((x[:, 1] ** 2).mean() + 1e-12)
    if cue.get("balance", True) and abs(dsp.db(rl / rr)) > 0.5:
        x = x * np.array([np.sqrt(rr / rl), np.sqrt(rl / rr)])
    g = dsp.undb(cue["gainDb"]) if "gainDb" in cue else cue.get("gain", 0.5)
    meta = dict(meta, file=cue["file"], used_from=cue.get("from", 0), used_dur=round(len(x) / SR, 2))
    return x * g, meta
