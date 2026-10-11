#!/usr/bin/env python3
"""Procedural sound design: deterministic numpy synthesis of transition and motion-graphics sounds.

    import sfx                                    # engine/sfx.py
    sig, anchor = sfx.render('whoosh.m', seed=3)  # float32 stereo (n, 2) at 48 kHz, anchor in seconds
    sfx.place(L, R, sig, anchor, at=12.40)        # lay it so its anchor (the hit/peak) lands at 12.40 s

Every sound has an *anchor*: the moment that should sit on the cut (the whoosh's peak, the impact's
transient, the riser's top, the end of a tape stop). Cue it by the anchor, not by the file start.
Same (name, seed, params) -> same samples, always. Sounds are rendered with fades (no clicks),
peak-limited, and gain-staged so presets sit at comparable loudness (impacts and booms louder,
UI ticks quieter); scale with the cue gain.

Transition -> sound: TRANSITION_SFX mirrors engine/transitions.js meta[name].sfx;
for_transition(name, start, dur) returns placed cues for a transition that starts at `start`.

CLI
    python3 engine/sfx.py --list
    python3 engine/sfx.py --render-all out_dir        # every preset as WAV + spectrogram/envelope PNG + sheet
    python3 engine/sfx.py whoosh.l out.wav [--seed 2] [--param dur=1.4]
"""
import json, math, os, sys, wave
import numpy as np

SR = 48000
TAU = 2 * math.pi


# ------------------------------------------------------------------ DSP helpers
def _rng(name, seed):
    h = 2166136261
    for c in f"{name}|{seed}":
        h = ((h ^ ord(c)) * 16777619) & 0xFFFFFFFF
    return np.random.default_rng(h)


def _t(n):
    return np.arange(n) / SR


def _n(sec):
    return max(1, int(round(sec * SR)))


def fade(x, a=0.004, b=0.02):
    """Raised-cosine fade in over `a` s and out over `b` s (no clicks at either end)."""
    n = len(x); ia, ib = min(n, _n(a)), min(n, _n(b))
    w = np.ones(n)
    if ia > 1: w[:ia] = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, ia))
    if ib > 1: w[-ib:] *= 0.5 + 0.5 * np.cos(np.linspace(0, math.pi, ib))
    return x * (w[:, None] if x.ndim == 2 else w)


def fft_filter(x, resp):
    """Static zero-phase filter: resp(f) -> gain, applied per channel in the frequency domain (padded)."""
    n = len(x); m = 1 << int(math.ceil(math.log2(n + SR // 4)))
    f = np.fft.rfftfreq(m, 1 / SR); g = resp(f)
    if x.ndim == 1: return np.fft.irfft(np.fft.rfft(x, m) * g, m)[:n]
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * g, m)[:n] for c in range(x.shape[1])], 1)


def lp(f, fc, order=2): return 1 / np.sqrt(1 + (f / fc) ** (2 * order))
def hp(f, fc, order=2): return 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))
def bp(f, lo, hi, order=2): return lp(f, hi, order) * hp(f, lo, order)
def peak(f, fc, q=4, gain=3.0): return 1 + (gain - 1) / (1 + ((f - fc) / (fc / q)) ** 2)


def shaped_noise(dur, shape, rng, stereo=0.85, nfft=2048, hop=256):
    """Time-varying spectrally shaped noise. shape(t, f) -> amplitude (frames x bins), evaluated per STFT
    frame; random phases, Hann overlap-add. `stereo` is the correlation between the two channels
    (1 = mono, 0 = fully decorrelated): wide but still solid in the centre."""
    n = _n(dur); frames = n // hop + nfft // hop + 2
    t = (np.arange(frames) * hop - nfft / 2) / SR; f = np.fft.rfftfreq(nfft, 1 / SR)
    mag = np.maximum(shape(t[:, None], f[None, :]), 0)
    win = np.hanning(nfft); out = np.zeros((frames * hop + nfft, 2))
    p0 = rng.uniform(0, TAU, mag.shape); p1 = rng.uniform(0, TAU, mag.shape)
    for c, ph in enumerate((p0, stereo * p0 + (1 - stereo) * p1)):
        spec = mag * np.exp(1j * ph)
        fr = np.fft.irfft(spec, nfft, axis=1) * win
        for i in range(frames): out[i * hop:i * hop + nfft, c] += fr[i]
    out = out[nfft // 2:nfft // 2 + n]
    return out / (np.sqrt(np.mean(out ** 2)) + 1e-12) * 0.1


def tone(freq_fn, n, phase=0.0):
    """Sine with a time-varying frequency (array or callable of t)."""
    f = freq_fn(_t(n)) if callable(freq_fn) else np.broadcast_to(freq_fn, (n,))
    return np.sin(phase + TAU * np.cumsum(f) / SR)


def reverb(x, size=1.6, damp=4000, mix=0.3, pre=0.012, seed=0, width=1.0):
    """Convolution reverb with a synthetic stereo IR: early reflections + exponentially decaying noise that
    darkens over time (high frequencies die first, like a real room)."""
    rng = np.random.default_rng(seed + 99)
    n = _n(size); t = _t(n)
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / size)[:, None]
    # time-varying darkening: blend a lowpassed copy in as the tail decays
    dark = fft_filter(ir, lambda f: lp(f, damp * 0.35, 1)); k = np.clip(t / (size * 0.5), 0, 1)[:, None]
    ir = ir * (1 - k) + dark * k; ir = fft_filter(ir, lambda f: lp(f, damp, 1) * hp(f, 120, 1))
    for d, g in ((0.011, 0.5), (0.017, -0.4), (0.023, 0.33), (0.031, 0.25)):
        i = _n(d); ir[i, 0] += g; ir[min(n - 1, i + _n(0.0013 * width)), 1] += g
    ir[:_n(pre)] = 0; ir[:, 1] = width * ir[:, 1] + (1 - width) * ir[:, 0]
    ir /= np.sqrt(np.sum(ir ** 2) / 2) + 1e-12
    if x.ndim == 1: x = np.stack([x, x], 1)
    m = 1 << int(math.ceil(math.log2(len(x) + n)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir[:, c], m), m)[:len(x) + n] for c in range(2)], 1)
    dry = np.vstack([x, np.zeros((n, 2))])
    return dry * (1 - mix) + wet * mix * 0.6


def st(x, pan=0.0, width=0.0, delay=0.0):
    """Mono -> stereo with an equal-power pan and an optional Haas widening delay (s)."""
    if x.ndim == 2: return x
    l, r = x * math.sqrt(0.5 * (1 - pan)), x * math.sqrt(0.5 * (1 + pan))
    if delay > 0: d = _n(delay); r = np.concatenate([np.zeros(d), r])[:len(x)] * (1 - width) + r * width
    return np.stack([l, r], 1)


def pan_sweep(x, p0=-0.6, p1=0.6, curve=None):
    """Pan a stereo or mono signal across the field over its length (equal power)."""
    if x.ndim == 1: x = np.stack([x, x], 1) * math.sqrt(0.5)
    u = np.linspace(0, 1, len(x)) if curve is None else curve
    p = p0 + (p1 - p0) * u
    return np.stack([x[:, 0] * np.sqrt(1 - p), x[:, 1] * np.sqrt(1 + p)], 1)


def sat(x, drive=1.5):
    return np.tanh(x * drive) / math.tanh(drive)


def env_ar(n, attack, release, peak_at=None, curve=2.0):
    """Asymmetric bell: rises over `attack` s to the peak, falls over `release` s."""
    t = _t(n); pk = attack if peak_at is None else peak_at
    up = np.clip(t / max(attack, 1e-4), 0, 1) ** curve
    dn = np.exp(-np.maximum(t - pk, 0) / max(release, 1e-4) * 3)
    return np.where(t < pk, up, dn)


def transient(rng, dur=0.012, lo=800, hi=9000, decay=0.003):
    n = _n(dur); x = rng.standard_normal(n) * np.exp(-_t(n) / decay)
    return fft_filter(x, lambda f: bp(f, lo, hi, 1))


# ------------------------------------------------------------------ presets
# Each returns (signal, anchor_seconds). Signals may be mono or stereo; render() finishes them.
WHOOSH = {'xs': 0.28, 's': 0.45, 'm': 0.7, 'l': 1.1, 'xl': 1.8}


def whoosh(rng, size='m', dur=None, bright=1.0, pan=(-0.55, 0.55), body=1.0):
    """Air moving past the lens: band-limited noise whose centre frequency rises into the pass and falls
    after it (a Doppler arc), with a soft tonal 'air' resonance, asymmetric envelope and a pan sweep.
    Larger sizes are longer, lower and carry more sub; the anchor is the pass (the cut)."""
    d = dur or WHOOSH[size]; k = {'xs': 1.6, 's': 1.3, 'm': 1.0, 'l': 0.78, 'xl': 0.62}[size] * bright
    pk = d * 0.62; n = _n(d)

    def shape(t, f):
        u = np.clip(t / d, 0, 1); a = np.where(t < pk, np.clip(t / pk, 0, 1) ** 2.2, np.exp(-(t - pk) / (d - pk) * 3.2))
        fc = (350 + 2300 * np.exp(-((t - pk) / (d * 0.28)) ** 2)) * k
        bw = 0.75
        g = np.exp(-(np.log(np.maximum(f, 20) / fc) / bw) ** 2)
        g += 0.22 * np.exp(-(np.log(np.maximum(f, 20) / (fc * 3.2)) / 0.6) ** 2)  # air on top
        g += 0.25 * body * np.exp(-(np.log(np.maximum(f, 20) / (120 * k)) / 0.8) ** 2)  # low body
        g *= lp(f, 14000, 2)
        return a * g * (1 - 0.4 * u * 0)
    x = shaped_noise(d, shape, rng, stereo=0.75)
    # airy resonance: a quiet swept sine riding the noise
    fr = lambda t: (220 + 900 * np.exp(-((t - pk) / (d * 0.25)) ** 2)) * k
    res = tone(fr, n) * env_ar(n, pk, (d - pk) * 0.6) * 0.06
    x = x + st(res)
    u = np.linspace(0, 1, n); curve = 0.5 + 0.5 * np.tanh((u - pk / d) * 6)
    x = pan_sweep(x, pan[0], pan[1], curve)
    if size in ('l', 'xl'): x = x + st(tone(lambda t: 55 - 20 * (t / d), n) * env_ar(n, pk, (d - pk) * 0.5) * 0.25 * body)
    return x, pk


def riser(rng, dur=2.5, top=1.0):
    """Tension riser: noise opening up from dark to bright, a rising Shepard-like tone stack and a
    tremolo that speeds up. Anchor at the top (the end): put it on the cut, follow with an impact."""
    n = _n(dur); t = _t(n); u = t / dur

    def shape(tt, f):
        uu = np.clip(tt / dur, 0, 1)
        fc = 300 * (24 ** uu)
        return (uu ** 2.2) * lp(f, fc, 2) * hp(f, 100, 1)
    x = shaped_noise(dur, shape, rng, stereo=0.6)
    tones = np.zeros(n)
    for o in range(4):
        f0 = 110 * 2 ** o
        fr = f0 * 2 ** (u * 1.0)
        w = np.exp(-((np.log2(fr) - math.log2(440)) / 1.4) ** 2)
        tones += np.sin(TAU * np.cumsum(fr) / SR) * w
    trem = 0.75 + 0.25 * np.sin(TAU * np.cumsum(2 + 14 * u ** 2) / SR)
    x = x + st(tones * (u ** 2.5) * 0.35 * trem * top)
    x = fade(x, 0.05, 0.004)
    return x, dur


def sub_drop(rng, dur=2.2, f0=90, f1=28):
    """Sub drop: a sine falling from f0 to f1 with a soft knock on top; felt more than heard. Anchor at the start."""
    n = _n(dur); t = _t(n)
    x = tone(lambda tt: f1 + (f0 - f1) * np.exp(-tt * 3.2), n) * np.exp(-t / (dur * 0.45)) * np.clip(t / 0.004, 0, 1)
    x = sat(x * 1.2, 1.4) * 0.9
    knock = np.zeros(n); k = transient(rng, 0.04, 80, 1200, 0.01); knock[:len(k)] = k * 0.6
    return st(x + knock), 0.0


def impact(rng, weight='soft', dur=None, room=None):
    """Impacts. 'soft': a felted thump for cuts under VO. 'hit': a tight punch. 'boom': a cinematic
    hit with sub, body, crack and a long dark tail. Anchor at the transient."""
    cfg = {'soft': dict(d=0.9, f0=110, f1=55, body=0.5, crack=0.25, sub=0.3, rv=0.6, tail=0.18),
           'hit': dict(d=1.4, f0=150, f1=48, body=0.9, crack=0.6, sub=0.5, rv=1.0, tail=0.25),
           'boom': dict(d=4.0, f0=80, f1=32, body=1.0, crack=0.5, sub=1.0, rv=2.6, tail=0.35)}[weight]
    d = dur or cfg['d']; n = _n(d); t = _t(n)
    body = tone(lambda tt: cfg['f1'] + (cfg['f0'] - cfg['f1']) * np.exp(-tt * 18), n) * np.exp(-t / (0.12 if weight != 'boom' else 0.45)) * cfg['body']
    sub = tone(lambda tt: cfg['f1'] * 0.75 + 10 * np.exp(-tt * 6), n) * np.exp(-t / (0.35 if weight != 'boom' else 1.2)) * cfg['sub'] * np.clip(t / 0.006, 0, 1)
    crack = np.zeros(n); c = transient(rng, 0.03, 900, 7000, 0.004); crack[:len(c)] = c * cfg['crack'] * 3
    thud = np.zeros(n); h = transient(rng, 0.12, 60, 900, 0.03); thud[:len(h)] = h * 1.5
    x = fade(sat(body + sub + thud, 1.3) + crack, 0.0003, d * 0.35)  # dry decays to silence before the tail (no truncation click)
    x = reverb(x, size=cfg['rv'], damp=3000 if weight == 'boom' else 5000, mix=room if room is not None else cfg['tail'], seed=int(rng.integers(1 << 30)))
    return x[:n + _n(cfg['rv'] * 0.8)], 0.0


def tape_stop(rng, dur=0.9, key=110.0):
    """Tape stop: a dark chord (with noise) whose playback speed decelerates to zero; the pitch dives,
    and the sound dies on the anchor (the end)."""
    n = _n(dur); t = _t(n); u = t / dur
    speed = (1 - u) ** 1.6
    ph = TAU * np.cumsum(speed) / SR
    x = sum(np.sin(ph * key * m) * a for m, a in ((1, 0.6), (1.5, 0.35), (2, 0.4), (3, 0.2), (4, 0.12)))
    nz = fft_filter(rng.standard_normal(n), lambda f: bp(f, 200, 3000, 1)) * 0.05
    x = (x * 0.4 + nz) * np.clip(speed * 1.5, 0, 1)
    x = fft_filter(x, lambda f: lp(f, 2500, 1))
    return st(fade(x, 0.01, 0.03), width=0.5, delay=0.008), dur


def swell_reverse(rng, dur=1.2, bright=1.0):
    """Reverse swell: a reversed reverb tail of a struck chord, rising into the anchor (the end)."""
    n = _n(dur)
    seed_hit = np.zeros(_n(0.4)); seed_hit[:_n(0.02)] = rng.standard_normal(_n(0.02)) * np.exp(-_t(_n(0.02)) / 0.004)
    tt = _t(_n(0.4)); seed_hit += sum(np.sin(TAU * f * tt) * np.exp(-tt / 0.2) * a for f, a in ((220, 0.4), (330, 0.25), (440, 0.2), (660, 0.1)))
    w = reverb(seed_hit, size=dur * 1.1, damp=6000 * bright, mix=1.0, seed=int(rng.integers(1 << 30)))
    w = w[:n][::-1]
    w = w * np.linspace(0, 1, n)[:, None] ** 1.5
    return fade(w, 0.02, 0.006), dur


def ui_tick(rng, pitch=1.0):
    """A soft UI tick: a short high transient with a tiny pitched ping (for counters, list items, map pins)."""
    n = _n(0.05); t = _t(n)
    x = np.sin(TAU * 2600 * pitch * t) * np.exp(-t / 0.006) * 0.5
    c = transient(rng, 0.01, 2000, 12000, 0.0012); x[:len(c)] += c * 0.8
    return st(fade(x, 0.0003, 0.01), width=0.3, delay=0.004), 0.0


def ui_ticks(rng, count=8, period=0.07, accel=0.0):
    """A run of ticks (grid reveal, a counter rolling): `count` ticks with slight pitch/level variation."""
    seq = []; t0 = 0.0
    for i in range(count):
        s, _ = ui_tick(rng, pitch=1.0 + 0.03 * rng.standard_normal()); seq.append((t0, s * (0.7 + 0.3 * rng.random())))
        t0 += period * (1 - accel * i / max(1, count))
    n = _n(t0 + 0.1); x = np.zeros((n, 2))
    for at, s in seq: i = _n(at); x[i:i + len(s)] += s[:n - i]
    return x, 0.0


def ui_scan(rng, dur=0.6):
    """A scanner sweep: a thin high sine gliding down with a hiss band following it (CRT, CCTV refresh)."""
    n = _n(dur); t = _t(n); u = t / dur
    x = tone(lambda tt: 5200 - 3600 * (tt / dur), n) * 0.08 * np.sin(math.pi * u) ** 0.5
    x += fft_filter(rng.standard_normal(n), lambda f: bp(f, 3000, 9000, 1)) * 0.03 * np.sin(math.pi * u)
    x += np.sin(TAU * 60 * t) * 0.03 * np.sin(math.pi * u)
    return pan_sweep(st(fade(x, 0.01, 0.05)), -0.3, 0.3), 0.0


def type_click(rng, kind='key'):
    """Typewriter / keyboard: 'key' (a key: thock + clack), 'space' (lower, longer), 'bell' (carriage bell)."""
    if kind == 'bell':
        n = _n(1.2); t = _t(n)
        x = sum(np.sin(TAU * f * t) * a * np.exp(-t / d) for f, a, d in ((2093, 0.5, 0.5), (5274, 0.2, 0.2), (2637, 0.15, 0.3)))
        return st(fade(x * 0.5, 0.0005, 0.1)), 0.0
    n = _n(0.09); x = np.zeros(n)
    lo, hi = (90, 2200) if kind == 'space' else (180, 5000)
    th = transient(rng, 0.03, lo, hi * 0.5, 0.006 if kind == 'space' else 0.004); x[:len(th)] += th * 1.2
    cl = transient(rng, 0.01, 2500, 11000, 0.0012); i = _n(0.008 + 0.004 * rng.random()); x[i:i + len(cl)] += cl * 0.7
    x += np.sin(TAU * (300 if kind == 'space' else 520) * _t(n)) * np.exp(-_t(n) / 0.01) * 0.15
    return st(fade(x, 0.0003, 0.01), pan=(rng.random() - 0.5) * 0.3), 0.0


def typing(rng, chars=24, cps=14.0, bell=False):
    """A run of keystrokes at `cps` with human timing jitter (spaces every ~5 chars). Matches text.typewriter."""
    seq = []; t0 = 0.0
    for i in range(chars):
        kind = 'space' if i % 6 == 5 else 'key'
        s, _ = type_click(rng, kind); seq.append((t0, s * (0.75 + 0.25 * rng.random())))
        t0 += (1 / cps) * (0.75 + 0.5 * rng.random())
    if bell: s, _ = type_click(rng, 'bell'); seq.append((t0 + 0.1, s * 0.6))
    n = _n(t0 + 1.4); x = np.zeros((n, 2))
    for at, s in seq: i = _n(at); x[i:i + len(s)] += s[:n - i]
    return x, 0.0


def _crackle(rng, n, density, lo=1500, hi=9000, size=0.002, env=None):
    x = np.zeros(n); k = int(density * n / SR)
    pos = np.sort(rng.integers(0, n, k)) if env is None else rng.choice(n, k, p=env / env.sum())
    for p in pos:
        L = _n(size * (0.5 + rng.random())); g = rng.standard_normal(L) * np.exp(-_t(L) / (size * 0.3)) * (0.3 + rng.random())
        e = min(n, p + L); x[p:e] += g[:e - p]
    return fft_filter(x, lambda f: bp(f, lo, hi, 1))


def paper_rustle(rng, dur=0.8):
    """Paper handled: crinkle bursts over a soft brushed-noise bed."""
    n = _n(dur); t = _t(n)
    envl = np.clip(np.sin(math.pi * t / dur), 0, 1) ** 0.7
    bed = fft_filter(rng.standard_normal(n), lambda f: bp(f, 800, 7000, 1)) * 0.05 * envl
    cr = _crackle(rng, n, 220, 1200, 8000, 0.003, env=envl + 0.01) * 0.6
    return fade(st(bed + cr, width=0.6, delay=0.006), 0.01, 0.05), dur * 0.5


def paper_page(rng, dur=0.7):
    """A page turn: a swish of paper through air (noise arc) with crinkle at the start and a soft flap at the end."""
    n = _n(dur); t = _t(n); pk = dur * 0.55
    sw = fft_filter(rng.standard_normal(n), lambda f: bp(f, 500, 6000, 1)) * env_ar(n, pk, dur - pk, curve=1.5) * 0.12
    cr = _crackle(rng, n, 150, 1500, 7000, 0.003, env=np.exp(-t / 0.15) + 0.05) * 0.5
    flap = np.zeros(n); f = transient(rng, 0.05, 150, 2000, 0.012); i = _n(dur * 0.85); flap[i:i + len(f)] += f[:n - i] * 0.6
    return pan_sweep(fade(st(sw + cr + flap), 0.003, 0.05), 0.4, -0.4), pk


def paper_tear(rng, dur=0.55):
    """A sheet torn: dense fibrous crackle that accelerates, with a ripping noise band. Anchor at the start of the rip."""
    n = _n(dur); t = _t(n); u = t / dur
    envl = np.clip(u * 8, 0, 1) * (1 - u) ** 0.6
    rip = fft_filter(rng.standard_normal(n), lambda f: bp(f, 600, 5500, 1) * peak(f, 2200, 2, 2.5)) * 0.09 * envl * (0.7 + 0.3 * np.sin(TAU * 38 * t * (1 + u)))
    cr = _crackle(rng, n, 1400, 1500, 10000, 0.0012, env=envl + 0.01) * 0.5
    return fade(st(rip + cr, width=0.5, delay=0.005), 0.002, 0.04), 0.03


def shutter(rng, kind='slr'):
    """Camera shutter: mirror slap and curtain (two mechanical clicks ~60 ms apart) with a metal resonance.
    'slr' (default) or 'leaf' (one quieter, brighter click)."""
    n = _n(0.25); t = _t(n); x = np.zeros(n)
    hits = [(0.0, 1.0, 1800), (0.062, 0.8, 2600)] if kind == 'slr' else [(0.0, 0.7, 3500)]
    for at, g, fc in hits:
        c = transient(rng, 0.03, 600, 9000, 0.0025); i = _n(at); x[i:i + len(c)] += c * g
        tt = t[:n - i]; x[i:] += np.sin(TAU * fc * tt) * np.exp(-tt / 0.012) * 0.25 * g + np.sin(TAU * 140 * tt) * np.exp(-tt / 0.02) * 0.3 * g
    return st(fade(x * 0.8, 0.0003, 0.02), width=0.4, delay=0.003), 0.0


def glitch_zap(rng, dur=0.28):
    """Digital glitch: stepped sample-and-hold tones, bit-crushed noise bursts and a downward zap. Tasteful level."""
    n = _n(dur); t = _t(n); x = np.zeros(n)
    steps = 7; edges = np.sort(rng.integers(0, n, steps)); edges = np.concatenate([[0], edges, [n]])
    for a, b in zip(edges[:-1], edges[1:]):
        if b <= a: continue
        kind = rng.integers(3); tt = _t(b - a)
        if kind == 0: x[a:b] += np.sign(np.sin(TAU * rng.uniform(200, 1800) * tt)) * 0.18
        elif kind == 1: x[a:b] += np.round(rng.standard_normal(b - a) * 3) / 3 * 0.15
        else: x[a:b] += np.sin(TAU * np.cumsum(np.linspace(rng.uniform(800, 3000), 120, b - a)) / SR) * 0.25
        x[a:b] *= 0.5 + 0.5 * rng.random()
    crush = np.round(x * 12) / 12
    x = fft_filter(crush, lambda f: lp(f, 9000, 2) * hp(f, 90, 1))
    return st(fade(x, 0.001, 0.02), width=0.0, delay=0.0) * np.array([1.0, 0.85]), dur * 0.4


def heartbeat(rng, bpm=62, beats=4):
    """Heartbeat: lub-dub pairs of low thumps (felt, not clinical)."""
    per = 60 / bpm; n = _n(per * beats + 0.6); x = np.zeros(n)
    for b in range(beats):
        for off, g, f0 in ((0.0, 1.0, 58), (0.24, 0.65, 66)):
            L = _n(0.35); tt = _t(L); s = tone(lambda q: f0 + 30 * np.exp(-q * 30), L) * np.exp(-tt / 0.07) * g
            s += transient(rng, 0.35, 30, 300, 0.02)[:L] * 0.4 * g
            i = _n(b * per + off); x[i:i + L] += s[:n - i]
    return st(fade(sat(x, 1.2), 0.002, 0.2)), 0.0


def clock_tick(rng, beats=8, period=1.0):
    """Clock: alternating tick and tock (woody resonant clicks), one per `period` s."""
    n = _n(beats * period + 0.3); x = np.zeros(n)
    for b in range(beats):
        fc = 3200 if b % 2 == 0 else 2500
        c = transient(rng, 0.04, 1200, 8000, 0.0015); tt = _t(len(c))
        c = c + np.sin(TAU * fc * tt) * np.exp(-tt / 0.008) * 0.3 + np.sin(TAU * 900 * tt) * np.exp(-tt / 0.015) * 0.2
        i = _n(b * period); x[i:i + len(c)] += c[:n - i] * (1.0 if b % 2 == 0 else 0.8)
    return st(fade(reverb(x, 0.5, 6000, 0.12)[:n].mean(1), 0.0005, 0.1), width=0.4, delay=0.004), 0.0


def stinger(rng, key=73.42, mood='dark'):
    """Stinger hit for title cards and reveals: boom + low brass-like stab (detuned saw stack, filtered)
    in the episode key + a reversed-air pre-swell into it. Anchor at the hit. mood: 'dark' (minor) or 'open' (fifth)."""
    pre, _ = swell_reverse(rng, 0.5)
    n = _n(3.5); t = _t(n)
    iv = (1, 1.189, 1.5) if mood == 'dark' else (1, 1.5, 2)
    saw = np.zeros(n)
    for m in iv:
        for dt in (-0.004, 0.0, 0.005):
            f = key * 2 * m * (1 + dt); ph = (f * t) % 1.0; saw += (2 * ph - 1) * 0.2
    saw = fft_filter(saw, lambda f: lp(f, 900, 2)) * np.exp(-t / 0.9) * np.clip(t / 0.01, 0, 1)
    boom, _ = impact(rng, 'boom', dur=3.5, room=0.3)
    body = st(fade(sat(saw, 1.4) * 0.5, 0.0005, 1.0))
    hit = boom * 0.9; hit[:n] += body
    hit = reverb(hit, 2.2, 3500, 0.25, seed=int(rng.integers(1 << 30)))
    pre = pre * 0.5; out = np.vstack([pre, hit]); return out, len(pre) / SR


def room_tone(rng, dur=10.0, hum=50.0, level=1.0):
    """Room tone: a still interior: soft pink-ish air below 1 kHz, faint mains hum, slow breathing."""
    def shape(t, f):
        breath = 1 + 0.08 * np.sin(TAU * 0.07 * t + 1.3)
        return breath * (1 / np.sqrt(np.maximum(f, 20) / 40)) * lp(f, 900, 3) * hp(f, 30, 2)
    x = shaped_noise(dur, shape, rng, stereo=0.3, nfft=4096, hop=1024)
    n = len(x); t = _t(n)
    if hum: x += st((np.sin(TAU * hum * t) + 0.4 * np.sin(TAU * hum * 2 * t) + 0.15 * np.sin(TAU * hum * 3 * t)) * 0.006)
    return fade(x * level, 0.5, 0.5), 0.0


def city_amb(rng, dur=12.0, density=1.0):
    """City at night from a window: distant traffic wash (slow swells), a low rumble, occasional far horns."""
    def shape(t, f):
        swell = 0.7 + 0.3 * np.sin(TAU * 0.05 * t + 0.4) * np.sin(TAU * 0.013 * t + 2)
        return swell * (1 / np.sqrt(np.maximum(f, 20) / 60)) * lp(f, 1800, 3) * hp(f, 35, 2) * (1 + 0.6 * np.exp(-((f - 90) / 60) ** 2))
    x = shaped_noise(dur, shape, rng, stereo=0.25, nfft=4096, hop=1024)
    n = len(x); t = _t(n)
    # passing cars: band-limited noise swells panning across
    for i in range(int(dur / 3 * density)):
        at = rng.uniform(0, dur - 3); L = _n(rng.uniform(2.5, 4.5)); u = np.linspace(0, 1, L)
        car = fft_filter(rng.standard_normal(L), lambda f: bp(f, 150, 1800, 1)) * np.sin(math.pi * u) ** 2 * 0.05
        car = pan_sweep(car, rng.uniform(-0.8, 0), rng.uniform(0, 0.8)); j = _n(at); x[j:j + L] += car[:n - j]
    for i in range(int(dur / 8 * density)):
        at = rng.uniform(0.5, dur - 2); L = _n(rng.uniform(0.4, 0.9)); tt = _t(L); f0 = rng.choice([311, 349, 415])
        h = sum(np.sin(TAU * f0 * k * tt) / k for k in range(1, 6)) * np.sin(math.pi * tt / tt[-1]) ** 0.5 * 0.012
        h = fft_filter(h, lambda f: lp(f, 1500, 2)); h = reverb(h, 1.8, 2000, 0.6)[:L + _n(1.0)]
        j = _n(at); e = min(n, j + len(h)); x[j:e] += h[:e - j] * np.array([0.8, 1.0])
    return fade(x, 1.0, 1.0), 0.0


def wind_amb(rng, dur=12.0, gust=1.0, whistle=0.4):
    """Wind: low roar with slow gusts, a high hiss and a faint whistle resonance that rises with the gusts."""
    g = lambda t: 0.55 + 0.45 * (0.5 + 0.5 * np.sin(TAU * 0.09 * t + 0.7) * np.sin(TAU * 0.031 * t + 2.1)) ** (1.5 * gust)

    def shape(t, f):
        gg = g(t); fc = 300 + 500 * gg
        return gg * (lp(f, fc, 1) * hp(f, 40, 2) + 0.15 * bp(f, 2500, 8000, 1) * gg ** 2)
    x = shaped_noise(dur, shape, rng, stereo=0.35, nfft=4096, hop=512)
    n = len(x); t = _t(n)
    w = tone(lambda tt: 700 + 250 * g(tt), n) * (g(t) - 0.5).clip(0) ** 2 * 0.06 * whistle
    return fade(x + st(w, width=0.5, delay=0.01), 1.0, 1.0), 0.0


def film_flutter(rng, dur=1.2):
    """Projector flutter: 24 Hz mechanical clatter with a motor whine, for film leaks and archive."""
    n = _n(dur); t = _t(n); x = np.zeros(n)
    for k in range(int(dur * 24)):
        c = transient(rng, 0.01, 1500, 7000, 0.0015); i = _n(k / 24 + rng.uniform(0, 0.002)); x[i:i + len(c)] += c[:n - i] * (0.3 + 0.2 * rng.random())
    x += np.sin(TAU * 96 * t) * 0.03 + fft_filter(rng.standard_normal(n), lambda f: bp(f, 300, 2000, 1)) * 0.01
    return fade(st(x, width=0.5, delay=0.004), 0.05, 0.1), 0.0


def film_burn(rng, dur=1.2):
    """Film burning in the gate: a crackle that thickens and a rising warm hiss; anchor at its peak."""
    n = _n(dur); t = _t(n); u = t / dur
    envl = np.sin(math.pi * np.clip(u * 1.1, 0, 1)) ** 1.2
    cr = _crackle(rng, n, 700, 800, 9000, 0.002, env=envl + 0.02) * 0.5
    hiss = fft_filter(rng.standard_normal(n), lambda f: bp(f, 1000, 8000, 1)) * 0.04 * envl
    return fade(st(cr + hiss, width=0.6, delay=0.006), 0.01, 0.1), dur * 0.45


def glass_shatter(rng, dur=1.4):
    """Glass shatter (for mosaic): a bright crack, then many tinkling shards of random pitch falling off."""
    n = _n(dur); t = _t(n); x = np.zeros(n)
    c = transient(rng, 0.06, 1500, 12000, 0.008); x[:len(c)] += c * 1.4
    for k in range(70):
        at = abs(rng.normal(0.05, 0.25)); i = _n(at)
        if i >= n: continue
        L = _n(0.12); tt = _t(L); f = rng.uniform(2500, 9000)
        s = (np.sin(TAU * f * tt) + 0.5 * np.sin(TAU * f * 2.7 * tt)) * np.exp(-tt / rng.uniform(0.01, 0.04)) * rng.uniform(0.05, 0.25) * math.exp(-at * 2)
        x[i:i + L] += s[:n - i]
    x = reverb(x, 0.9, 7000, 0.2)[:n].mean(1)
    return fade(st(x, width=0.7, delay=0.007), 0.0005, 0.2), 0.0


def marker_swipe(rng, dur=0.32):
    """A felt marker dragged across paper (redaction bars, highlighter, strike-through): a scratchy noise
    band with a squeaky resonance."""
    n = _n(dur); t = _t(n); u = t / dur
    envl = np.clip(u / 0.08, 0, 1) * np.clip((1 - u) / 0.25, 0, 1)
    x = fft_filter(rng.standard_normal(n), lambda f: bp(f, 1500, 9000, 1) * peak(f, 3800, 3, 3)) * 0.08 * envl * (0.8 + 0.2 * np.sin(TAU * 55 * t))
    x += _crackle(rng, n, 300, 2000, 9000, 0.001, env=envl + 0.01) * 0.25
    return pan_sweep(fade(st(x), 0.003, 0.03), -0.3, 0.3), 0.0


PRESETS = {
    **{f'whoosh.{k}': (lambda k: (lambda rng, **p: whoosh(rng, size=k, **p)))(k) for k in WHOOSH},
    'riser': riser, 'sub.drop': sub_drop,
    'impact.soft': lambda rng, **p: impact(rng, 'soft', **p), 'impact.hit': lambda rng, **p: impact(rng, 'hit', **p),
    'impact.boom': lambda rng, **p: impact(rng, 'boom', **p),
    'tape.stop': tape_stop, 'swell.reverse': swell_reverse,
    'ui.tick': ui_tick, 'ui.ticks': ui_ticks, 'ui.scan': ui_scan,
    'type.click': type_click, 'type.run': typing,
    'paper.rustle': paper_rustle, 'paper.page': paper_page, 'paper.tear': paper_tear,
    'shutter': shutter, 'glitch.zap': glitch_zap, 'heartbeat': heartbeat, 'clock.tick': clock_tick,
    'stinger': stinger, 'room.tone': room_tone, 'city.amb': city_amb, 'wind.amb': wind_amb,
    'film.flutter': film_flutter, 'film.burn': film_burn, 'glass.shatter': glass_shatter, 'marker.swipe': marker_swipe,
}
# per-preset output level (peak, dBFS) so presets sit together; cue gains scale from here
LEVEL = {'impact.boom': -1, 'stinger': -1, 'sub.drop': -2, 'impact.hit': -2, 'riser': -4, 'tape.stop': -6,
         'room.tone': -30, 'city.amb': -22, 'wind.amb': -20, 'ui.tick': -14, 'ui.ticks': -14, 'type.click': -12, 'type.run': -12,
         'heartbeat': -4, 'clock.tick': -12, 'glitch.zap': -12, 'ui.scan': -16, 'film.flutter': -18}
DEFAULT_LEVEL = -6

# transition -> [(preset, anchor offset as a fraction of the transition length)]; mirrors engine/transitions.js meta
TRANSITION_SFX = {
    'cut': [('impact.soft', 0)], 'dissolve': [], 'match-dissolve': [('swell.reverse', 0.5)], 'match-cut': [('impact.soft', 0.5)],
    'dip-black': [('sub.drop', 0.5)], 'dip-red': [('impact.boom', 0.5)], 'flash': [('shutter', 0.5), ('impact.soft', 0.5)],
    'whip': [('whoosh.m', 0.5)], 'slide': [('whoosh.s', 0.5)], 'push': [('whoosh.s', 0.5)], 'pull-back': [('whoosh.s', 0.5), ('swell.reverse', 0.5)],
    'zoom-through': [('whoosh.l', 0.5)], 'radial-zoom': [('whoosh.xs', 0.5)], 'lens-blur': [('swell.reverse', 0.5)], 'focus-pull': [],
    'iris': [('whoosh.s', 0.6)], 'iris-black': [('shutter', 0.5)], 'aperture': [('shutter', 0.48)], 'shape-circle': [('whoosh.s', 0.5)],
    'shape-box': [('ui.tick', 0.0), ('whoosh.s', 0.4)], 'linear-wipe': [('whoosh.xs', 0.5)], 'luma-wipe': [('swell.reverse', 0.6)],
    'light-leak': [('swell.reverse', 0.5), ('film.flutter', 0.3)], 'film-burn': [('film.burn', 0.0), ('impact.soft', 0.45)],
    'ink-bleed': [('paper.rustle', 0.1), ('swell.reverse', 0.6)], 'paper-tear': [('paper.tear', 0.15)], 'glitch': [('glitch.zap', 0.5)],
    'scanline': [('ui.scan', 0.0)], 'pixel-sort': [('glitch.zap', 0.45), ('swell.reverse', 0.5)], 'split-slide': [('whoosh.xs', 0.3), ('whoosh.xs', 0.55)],
    'grid-reveal': [('ui.ticks', 0.1)], 'mosaic-shatter': [('glass.shatter', 0.15)], 'parallax-slide': [('whoosh.s', 0.45)],
    'page-turn': [('paper.page', 0.2)], 'redact-wipe': [('marker.swipe', 0.15), ('marker.swipe', 0.6)], 'pass-through': [('whoosh.m', 0.5)],
}
# sizes scale with the transition: a whoosh is chosen so its rise roughly fills the transition
_SIZES = sorted(WHOOSH.items(), key=lambda kv: kv[1])


def whoosh_for(dur):
    """The whoosh size whose pre-peak rise (~62% of its length) best fits a move of `dur` seconds."""
    return 'whoosh.' + min(_SIZES, key=lambda kv: abs(kv[1] * 0.62 - dur * 0.6))[0]


# ------------------------------------------------------------------ API
_cache = {}


def render(name, seed=0, **params):
    """Render preset `name` -> (float32 stereo (n, 2), anchor seconds). Deterministic and cached."""
    key = (name, seed, json.dumps(params, sort_keys=True))
    if key in _cache: return _cache[key]
    if name not in PRESETS: raise KeyError(f"unknown sfx '{name}' (have {', '.join(sorted(PRESETS))})")
    sig, anchor = PRESETS[name](_rng(name, seed), **params)
    sig = st(np.asarray(sig, float)) if np.ndim(sig) == 1 else np.asarray(sig, float)
    sig = sig - sig.mean(0)  # no DC
    sig = fade(sig, 0.0005 if anchor == 0 else 0.003, 0.03)
    pk = np.abs(sig).max() + 1e-12
    sig = (sig / pk * 10 ** (LEVEL.get(name, DEFAULT_LEVEL) / 20)).astype(np.float32)
    _cache[key] = (sig, float(anchor))
    return _cache[key]


def place(L, R, sig, anchor, at, gain=1.0, pan=0.0, sr=SR):
    """Mix `sig` into channel arrays L, R so its anchor lands at time `at` (s). Clips at the track edges."""
    i0 = int(round((at - anchor) * sr)); j0 = max(0, -i0); i0 = max(0, i0)
    k = min(len(L) - i0, len(sig) - j0)
    if k <= 0: return
    gl, gr = math.sqrt(0.5 * (1 - pan)) * math.sqrt(2), math.sqrt(0.5 * (1 + pan)) * math.sqrt(2)
    L[i0:i0 + k] += sig[j0:j0 + k, 0] * gain * gl; R[i0:i0 + k] += sig[j0:j0 + k, 1] * gain * gr


def for_transition(name, start, dur, seed=0, gain=1.0):
    """Cues for transition `name` running [start, start + dur]: [{name, at (anchor time, s), gain, seed}].
    Whooshes are resized to the transition length."""
    out = []
    for i, (preset, frac) in enumerate(TRANSITION_SFX.get(name, [])):
        p = whoosh_for(dur) if preset.startswith('whoosh.') and dur > 0 else preset
        out.append({'name': p, 'at': start + frac * dur, 'gain': gain * (0.8 if i else 1.0), 'seed': seed * 31 + i})
    return out


def mix_cues(cues, total, sr=SR):
    """Render a list of cues ({name, at, gain?, seed?, pan?, params?}) into a stereo float array of `total` s."""
    n = int(total * sr); L = np.zeros(n); R = np.zeros(n)
    for c in cues:
        sig, a = render(c['name'], seed=c.get('seed', 0), **c.get('params', {}))
        place(L, R, sig, a, c['at'], c.get('gain', 1.0), c.get('pan', 0.0))
    return np.stack([L, R], 1)


def write_wav(path, x, sr=SR):
    x = np.clip(np.asarray(x), -1, 1)
    if x.ndim == 1: x = np.stack([x, x], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype('<i2').tobytes())


# ------------------------------------------------------------------ analysis (spectrogram + envelope)
def analyse(sig, anchor=0.0):
    """Quality numbers: peak dBFS, RMS dBFS, edge samples, max click score (sample jump vs local RMS), DC."""
    m = sig.mean(1); d = np.abs(np.diff(m))
    loc = np.sqrt(np.convolve(m ** 2, np.ones(480) / 480, 'same')) + 1e-4
    click = float((d / loc[1:]).max())
    return {'peak_db': round(20 * math.log10(np.abs(sig).max() + 1e-12), 1), 'rms_db': round(20 * math.log10(np.sqrt((sig ** 2).mean()) + 1e-12), 1),
            'edge': float(max(np.abs(sig[0]).max(), np.abs(sig[-1]).max())), 'click': round(click, 2), 'dc': float(abs(m.mean())), 'dur': round(len(sig) / SR, 3), 'anchor': anchor}


def picture(sig, anchor, title, path, w=900, h=300):
    """Spectrogram (log frequency, dB) over an envelope strip, with the anchor marked."""
    from PIL import Image, ImageDraw
    m = sig.mean(1); nfft, hop = 2048, 256
    frames = max(1, (len(m) - nfft) // hop + 1)
    if len(m) < nfft: m = np.pad(m, (0, nfft - len(m))); frames = 1
    win = np.hanning(nfft)
    S = np.array([np.abs(np.fft.rfft(m[i * hop:i * hop + nfft] * win)) for i in range(frames)]).T
    S = 20 * np.log10(S + 1e-7); S = np.clip((S - S.max() + 80) / 80, 0, 1)
    f = np.fft.rfftfreq(nfft, 1 / SR); rows = h - 70
    fy = np.geomspace(30, 20000, rows)[::-1]; idx = np.clip(np.searchsorted(f, fy), 0, len(f) - 1)
    img = S[idx][:, np.clip((np.arange(w) * frames / w).astype(int), 0, frames - 1)]
    # palette: black -> deep red -> amber -> paper
    stops = np.array([[0, 0, 0], [70, 8, 6], [200, 40, 20], [255, 168, 96], [239, 231, 214]], float)
    pos = img * (len(stops) - 1); i0 = np.clip(pos.astype(int), 0, len(stops) - 2); fr = (pos - i0)[..., None]
    rgb = stops[i0] * (1 - fr) + stops[i0 + 1] * fr
    canvas = Image.new('RGB', (w, h), (12, 12, 12)); canvas.paste(Image.fromarray(rgb.astype(np.uint8)), (0, 20))
    d = ImageDraw.Draw(canvas)
    env = np.abs(m); bins = np.array_split(env, w); pk = max(1e-9, env.max())
    for x, b in enumerate(bins):
        v = (b.max() if len(b) else 0) / pk; d.line([(x, h - 4), (x, h - 4 - v * 40)], fill=(217, 210, 195))
    ax = int(anchor / (len(sig) / SR) * w); d.line([(ax, 20), (ax, h)], fill=(224, 36, 27), width=2)
    d.text((6, 4), title, fill=(236, 230, 218))
    canvas.save(path)
    return canvas


def render_all(out_dir):
    os.makedirs(out_dir, exist_ok=True); report = {}; pics = []
    for name in PRESETS:
        sig, a = render(name)
        write_wav(os.path.join(out_dir, f'{name}.wav'), sig)
        q = analyse(sig, a); report[name] = q
        pics.append(picture(sig, a, f"{name}  {q['dur']}s  peak {q['peak_db']} dB  rms {q['rms_db']} dB  click {q['click']}", os.path.join(out_dir, f'{name}.png')))
        print(f"{name:16s} {json.dumps(q)}")
    from PIL import Image
    cols = 3; rows = (len(pics) + cols - 1) // cols; W, H = pics[0].size
    sheet = Image.new('RGB', (cols * W, rows * H), (0, 0, 0))
    for i, p in enumerate(pics): sheet.paste(p, ((i % cols) * W, (i // cols) * H))
    sheet.save(os.path.join(out_dir, 'sfx-sheet.png'))
    json.dump(report, open(os.path.join(out_dir, 'report.json'), 'w'), indent=1)


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help'): print(__doc__); sys.exit(0)
    if a[0] == '--list': print('\n'.join(sorted(PRESETS))); sys.exit(0)
    if a[0] == '--render-all': render_all(a[1] if len(a) > 1 else 'sfx-out'); sys.exit(0)
    name, out = a[0], a[1]; seed = 0; params = {}
    for i, x in enumerate(a):
        if x == '--seed': seed = int(a[i + 1])
        if x == '--param': k, v = a[i + 1].split('='); params[k] = float(v) if v.replace('.', '', 1).isdigit() else v
    sig, anchor = render(name, seed, **params); write_wav(out, sig); print(json.dumps({'anchor': anchor, **analyse(sig, anchor)}))
