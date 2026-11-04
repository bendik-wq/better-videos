"""Dialogue-priority mix: music / SFX / VO buses, multiband sidechain ducking, -14 LUFS master.

Bus structure
  VO     mono, already processed by engine/voice.py (HPF, presence, de-ess, comp, room); centred
  MUSIC  stereo bed from the composer (+ licensed tracks). Ducked by the VO key in three bands:
         the vocal band (250 Hz - 5 kHz) dips hardest, lows and highs barely move, so the score
         keeps its weight and air while the words stay clear. A slow broadband "gap lift" lets the
         music swell back up in pauses between lines (the documentary convention).
  SFX    stereo design cues; ducked lightly in the vocal band only.
  MASTER high-pass, gentle glue, loudness to -14 LUFS integrated, true-peak limit at -1 dBTP,
         re-measured and corrected so both specs hold together.
"""
import numpy as np
from scipy import signal as ss
from . import dsp
from .dsp import SR

DEFAULTS = dict(
    target_lufs=-14.0, ceiling_dbtp=-1.0,
    vo_lufs=-16.0,          # VO stem level before the master (speech-gated integrated)
    music_db=-6.0,          # music bed relative to its own -16 LUFS master, before ducking
    sfx_db=-3.0,
    duck_mid_db=8.0,        # music cut in the vocal band while speech is present
    duck_low_db=2.5, duck_high_db=4.0,
    gap_lift_db=5.0,        # music comes up this much in pauses > ~1 s (doc convention: score fills the gaps)
    sfx_duck_db=3.0,
    lookahead=0.08, attack=0.04, release=0.45, hold=0.25,
)


def to_stereo48(x, sr):
    x = np.asarray(x, float)
    if sr != SR:
        g = np.gcd(int(sr), SR)
        x = ss.resample_poly(x, SR // g, int(sr) // g, axis=0)
    if x.ndim == 1: x = np.stack([x, x], 1)
    return x


def speech_key(vo, lookahead=0.08, hold=0.25):
    """0..1 speech presence from the VO stem, opened slightly before each word (look-ahead,
    since we have the whole file) and held across short gaps between words."""
    m = vo.mean(1) if vo.ndim > 1 else vo
    e = dsp.db(dsp.rms_env(m, 0.03))
    pres = np.clip((e - (-50)) / 18, 0, 1)
    k = int(lookahead * SR)
    pres = np.concatenate([pres[k:], np.zeros(k)])
    pres = dsp.maxfilt(pres, int(hold * SR))
    return pres


def multiband_duck(x, key, mid_db, low_db, high_db, attack, release, f1=250.0, f2=5000.0, chunk=1 << 20):
    """Three-band (LR4 at f1/f2) ducking keyed by speech presence. Processed in chunks with the
    filter states carried across, so it is exact and memory-light on a full episode."""
    def lr4(kind, f):
        s_ = ss.butter(2, f, kind, fs=SR, output="sos"); return np.concatenate([s_, s_])
    F = {k: lr4(*k) for k in (("low", f1), ("high", f1), ("low", f2), ("high", f2))}
    chains = {"low1": F[("low", f1)], "rest": F[("high", f1)], "lowap_hi": F[("high", f2)], "lowap_lo": F[("low", f2)],
              "mid": F[("low", f2)], "high": F[("high", f2)]}
    zi = {k: np.zeros((v.shape[0], 2, x.shape[1])) for k, v in chains.items()}
    g = {b: dsp.undb(-dsp.smooth(key * amt, attack, release)) for b, amt in (("low", low_db), ("mid", mid_db), ("high", high_db))}
    out = np.empty_like(x)

    def f(name, sig):
        y, zi[name] = ss.sosfilt(chains[name], sig, axis=0, zi=zi[name]); return y
    for a in range(0, len(x), chunk):
        c = x[a:a + chunk]
        low = f("low1", c); rest = f("rest", c)
        low = f("lowap_hi", low) + f("lowap_lo", low)  # all-pass match for the f2 split
        mid = f("mid", rest); high = f("high", rest)
        sl = slice(a, a + len(c))
        out[sl] = low * g["low"][sl, None] + mid * g["mid"][sl, None] + high * g["high"][sl, None]
    return out


def mix(music=None, sfx=None, vo=None, n=None, opts=None):
    """music/sfx: (N,2) at 48 kHz; vo: (N,) or (N,2) at 48 kHz. Returns (master, buses dict)."""
    o = dict(DEFAULTS, **(opts or {}))
    n = n or max(len(a) for a in (music, sfx, vo) if a is not None)

    def fit(a, stereo=True):
        if a is None: return np.zeros((n, 2))
        if a.ndim == 1: a = np.stack([a, a], 1)
        return np.pad(a, ((0, max(0, n - len(a))), (0, 0)))[:n]
    music, sfx, vo = fit(music), fit(sfx), fit(vo)
    has_vo = np.abs(vo).max() > 1e-6
    if has_vo:
        vo, Iv = dsp.normalize_lufs(vo, o["vo_lufs"])
        key = speech_key(vo, o["lookahead"], o["hold"])
    else:
        key = np.zeros(n)
    if np.abs(music).max() > 1e-6:
        Im = dsp.loudness(music)["integrated"]
        music = music * dsp.undb(-16.0 - Im + o["music_db"])
        music = multiband_duck(music, key, o["duck_mid_db"], o["duck_low_db"], o["duck_high_db"], o["attack"], o["release"])
        # gap lift: slower, broadband, only when speech has been absent for a while
        lift = dsp.smooth(1 - dsp.maxfilt(key, int(0.8 * SR)), 0.9, 0.25)
        music = music * dsp.undb(o["gap_lift_db"] * lift - o["gap_lift_db"])[:, None] * dsp.undb(o["gap_lift_db"] * 0.5)
    if np.abs(sfx).max() > 1e-6:
        sfx = sfx * dsp.undb(o["sfx_db"])
        sfx = multiband_duck(sfx, key, o["sfx_duck_db"], 0.0, 1.0, 0.02, 0.3)
    bus = music + sfx + vo
    bus = dsp.hp(bus, 22, 0.6)
    bus, _ = dsp.compress(bus, thresh_db=-16, ratio=1.6, attack=0.02, release=0.25, knee=8, rms=0.02)
    out = finalize(bus, o["target_lufs"], o["ceiling_dbtp"])
    return out, dict(music=music, sfx=sfx, vo=vo, key=key)


def finalize(x, target=-14.0, ceiling=-1.0, iters=3):
    """Hit integrated loudness and true-peak ceiling together (limit, re-measure, correct)."""
    y = x
    g = 0.0
    I = dsp.loudness(x)["integrated"]
    for _ in range(iters):
        g += target - I
        y = dsp.limit(x * dsp.undb(g), ceiling, release=0.1)
        I = dsp.loudness(y)["integrated"]
        if abs(I - target) < 0.15: break
    return y
