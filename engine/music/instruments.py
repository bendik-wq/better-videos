"""Instruments. Each returns a float array at 48 kHz (mono unless stated). Deterministic per seed.

pad        detuned poly-BLEP saw stack through a slowly opening resonant low-pass (warm synth pad)
strings    7-voice supersaw ensemble with delayed vibrato, bow noise and a body EQ (legato strings)
spiccato   short bowed-string notes for 16th ostinatos
piano      additive piano: inharmonic partials, 3-string unison beating, two-stage decay, hammer thump
pluck      Karplus-Strong string (vectorised by delay-line blocks) with a brightness control
celesta    bell/glass additive tone for wonder motifs
pulse      Zimmer-style synth pulse note (saw + sub through an enveloped filter)
sub        sine sub-bass with gentle saturation
braaam     low brass cluster: root/octave/fifth saws, opening filter, growl, sub, distortion
taiko      large drum: pitch-dropping membrane modes + slap noise
boom       cinematic low hit (sub drop + noise thump)
tick/tock  ticking-clock clicks (resonant, metallic)
shepard    Shepard-Risset glissando riser (endless rise; optional crescendo)
noise_riser / reverse_swell  filtered noise risers and reversed-cymbal swells
"""
import numpy as np
from . import dsp
from .dsp import SR
from .theory import mtof


def _t(n): return np.arange(n) / SR


def ramp(t, a):
    """Raised-cosine onset over `a` seconds: no slope kink at the end (a linear ramp clicks)."""
    return 0.5 - 0.5 * np.cos(np.pi * np.clip(t / a, 0, 1))


def blep_saw(freq, n, phase0=0.0):
    """Band-limited sawtooth (poly-BLEP). freq: scalar or per-sample array."""
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    # poly-BLEP correction at the wrap
    m1 = ph < dt
    x = ph[m1] / dt[m1]; y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]; y[m2] -= x * x + x + x + 1
    return y


def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase0)


def vibrato(n, rate=5.2, depth_cents=12, delay=0.35, seed=0):
    t = _t(n); r = dsp.rng(seed)
    onset = np.clip((t - delay) / 0.6, 0, 1)
    wob = np.sin(2 * np.pi * rate * (1 + 0.04 * r.standard_normal()) * t + r.uniform(0, 6.28))
    drift = np.interp(t, np.linspace(0, t[-1] + 1e-9, 8), r.standard_normal(8)) * 2.0  # slow pitch drift (cents)
    return 2 ** ((wob * depth_cents * onset + drift) / 1200)


# ------------------------------------------------------------------ sustained
def pad(midi, dur, vel=0.7, attack=1.6, release=2.5, bright=0.5, seed=0, voices=3):
    """Warm analogue pad. midi: one note or a chord (list); the chord shares one filter.
    Stereo. bright 0..1 maps the filter from ~350 Hz to ~4 kHz."""
    notes = list(np.atleast_1d(midi))
    n = int((dur + release) * SR); r = dsp.rng(seed)
    out = np.zeros((n, 2))
    for ni, m in enumerate(notes):
        f = float(mtof(m))
        for v in range(voices):
            det = 2 ** ((v - (voices - 1) / 2) * 7 / 1200)  # +-7 cents
            lfo = 1 + 0.0012 * np.sin(2 * np.pi * r.uniform(0.1, 0.3) * _t(n) + r.uniform(0, 6))
            s = blep_saw(f * det * lfo, n, r.random()) * 0.6 + blep_saw(f * det * 0.5, n, r.random()) * 0.25
            p = (v / max(1, voices - 1)) * 2 - 1 if voices > 1 else 0
            out += dsp.pan(s, np.clip(p * 0.7 + 0.15 * (ni - (len(notes) - 1) / 2), -1, 1))
    env = dsp.adsr(n, attack, 1.5, 0.85, release, gate=dur)
    f0 = float(mtof(min(notes)))
    cut = (350 + 3600 * bright ** 1.5) * (0.55 + 0.45 * np.clip(_t(n) / (attack * 2.0), 0, 1)) * (0.6 + 0.4 * env)
    out = dsp.tv_lowpass(out, cut + f0 * 1.5, q=0.9, block=1024)
    return out * env[:, None] * vel * 0.35


def strings(midi, dur, vel=0.7, attack=0.6, release=1.2, seed=0, bright=0.5, section="violins"):
    """Legato string ensemble (supersaw + vibrato + body). midi: note or chord. Stereo."""
    notes = list(np.atleast_1d(midi))
    n = int((dur + release) * SR); r = dsp.rng(seed)
    out = np.zeros((n, 2))
    k = 7
    for ni, m in enumerate(notes):
        f = float(mtof(m))
        # two independent vibrato LFOs per note, shared alternately by the 7 players (an ensemble
        # never vibrates in sync; two LFOs + detune is enough to hear that, at a third of the cost)
        vibs = [vibrato(n, 5.0 + 0.5 * r.random(), 10 + 6 * r.random(), 0.25 + 0.3 * r.random(), seed * 31 + j + 7 * ni) for j in range(2)]
        for v in range(k):
            det = 2 ** ((v - 3) * r.uniform(3, 6) / 1200)
            s = blep_saw(f * det * vibs[v % 2], n, r.random())
            out += dsp.pan(s, (v - 3) / 3 * 0.8)
    out /= k ** 0.5
    f = float(mtof(max(notes)))
    bow = dsp.bp(dsp.rng(seed + 9).standard_normal(n), min(6000, f * 6), 1.5) * 0.04 * len(notes) ** 0.5
    out += bow[:, None]
    env = dsp.adsr(n, attack, 2.5, 0.8, release, gate=dur)
    # swell: strings breathe (crescendo on long notes)
    swell = 0.85 + 0.15 * np.sin(np.pi * np.clip(_t(n) / max(dur, 0.1), 0, 1))
    cut = 1800 + 3500 * bright * (0.5 + 0.5 * env)
    out = dsp.tv_lowpass(out, cut, q=0.6, block=1024)
    body = {"violins": [("peak", 450, 2.5, 1.2), ("peak", 2800, 2.0, 1.5), ("peak", 1200, -2.0, 1.0)],
            "celli": [("peak", 220, 3.0, 1.0), ("peak", 1500, -3.0, 1.0)],
            "basses": [("peak", 90, 3.0, 1.0), ("lp", 1200, 0, 0.7)]}[section]
    out = dsp.eq(out, body)
    return out * (env * swell)[:, None] * vel * 0.3


def spiccato(midi, dur=0.18, vel=0.7, seed=0, bright=0.5):
    n = int((dur + 0.25) * SR); f = mtof(midi); r = dsp.rng(seed)
    s = np.zeros(n)
    for v in range(4):
        s += blep_saw(f * 2 ** ((v - 1.5) * 5 / 1200), n, r.random())
    s += dsp.bp(r.standard_normal(n), min(7000, f * 5), 1.2) * 0.6 * np.exp(-_t(n) / 0.015)  # bow bite
    env = ramp(_t(n), 0.006) * np.exp(-_t(n) / (dur * 0.55))
    s = dsp.lp(s * env, 1500 + 4000 * bright * vel)
    s = dsp.peak(s, 300, 3, 1.0)
    return s * vel * 0.18


# ------------------------------------------------------------------ struck / plucked
def piano(midi, dur=2.0, vel=0.7, seed=0, release=0.5):
    """Additive piano. Mono."""
    f0 = float(mtof(midi)) * 2 ** (-3 / 1200); n = int((dur + release + 0.2) * SR); t = _t(n); r = dsp.rng(seed)
    B = 0.0001 * 2 ** ((midi - 60) / 24)  # inharmonicity grows up the keyboard (kept small: in tune with the pads)
    s = np.zeros(n)
    nh = int(min(20, (SR * 0.45) / f0))
    bright = 0.5 + 0.6 * vel
    for k in range(1, nh + 1):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > SR * 0.45: break
        a = (1 / k ** (1.6 - 0.6 * bright)) * (1 if k == 1 else 0.85)
        # hammer position (~1/7 of the string) notches out the 7th partial family
        a *= abs(np.sin(np.pi * k / 7.3)) ** 0.5
        d1 = (2.8 * 2 ** (-(midi - 48) / 18)) / (1 + 0.18 * k)   # prompt decay
        d2 = d1 * 6                                            # aftersound
        e = 0.72 * np.exp(-t / d1) + 0.28 * np.exp(-t / d2)
        # three-string unison (-0.9, 0, +1.1 cents): the outer pair as one carrier times a slow
        # beat envelope (sin a + sin b = 2 sin((a+b)/2) cos((a-b)/2)), plus the centre string
        ph = r.uniform(0, 6.28)
        c = np.sin(2 * np.pi * fk * 2 ** (0.1 / 1200) * t + ph)
        beat = np.cos(np.pi * fk * (2 ** (1.1 / 1200) - 2 ** (-0.9 / 1200)) * t)
        s += a * e * (2 * c * beat + np.sin(2 * np.pi * fk * t + ph + 1.3)) / 3
    thump = dsp.lp(r.standard_normal(n), 900 + 1600 * vel) * np.exp(-t / 0.012) * 0.25
    s += thump
    att = ramp(t, 0.0025)
    damp = np.where(t < dur, 1.0, np.exp(-(t - dur) / max(release / 4.6, 1e-3)))
    return dsp.saturate(s * att * damp * vel * 0.45, 1.1)


def pluck(midi, dur=1.5, vel=0.7, seed=0, bright=0.6, decay=0.996):
    """Karplus-Strong plucked string. The delay line is processed in blocks of one period, so
    numpy does the work: y[n] = g * avg-of-(y[n-M], y[n-M-1], y[n-M-2]) weighted for fractional
    tuning (loop delay M + 0.5 + w = SR / f)."""
    f = float(mtof(midi)); P = SR / f
    M = int(np.floor(P - 0.5)); w = P - 0.5 - M  # loop delay = M + 0.5 + w = P
    n = int((dur + 0.3) * SR); r = dsp.rng(seed)
    y = np.zeros(n + M + 3)
    exc = r.uniform(-1, 1, M + 2)
    exc = dsp.lp4(exc - exc.mean(), 800 + 9000 * bright * vel)  # softer pick = darker excitation (24 dB/oct, no grit)
    from scipy.signal.windows import tukey
    exc *= tukey(len(exc), 0.3)  # taper both ends: the loop's first wrap would otherwise be a step (a click)
    y[: M + 2] = exc
    # per-period loss tuned so ~T60 is independent of pitch
    g = decay ** (110 / f)
    c0, c1, c2 = (1 - w) * 0.5, 0.5, w * 0.5
    i = M + 2
    while i < len(y):
        j = min(len(y), i + M)
        y[i:j] = g * (c0 * y[i - M:j - M] + c1 * y[i - M - 1:j - M - 1] + c2 * y[i - M - 2:j - M - 2])
        i = j
    y = y[: n]
    t = _t(n)
    y *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.06)) * ramp(t, 0.003)  # soft pick, no click
    y = dsp.hp(y, 40)
    return y * vel * 0.5


def celesta(midi, dur=2.5, vel=0.6, seed=0):
    f0 = float(mtof(midi)); n = int((dur + 0.5) * SR); t = _t(n)
    s = np.zeros(n)
    for ratio, a, d in [(1, 1, 1.2), (2.0, 0.35, 0.6), (3.01, 0.12, 0.35), (4.2, 0.18, 0.25), (6.8, 0.06, 0.12)]:
        if f0 * ratio < SR * 0.45:
            s += a * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / (d * (1.4 - 0.4 * min(1, f0 / 1000))))
    s *= ramp(t, 0.002)
    return s * vel * 0.25


# ------------------------------------------------------------------ synth / bass
def pulse(midi, dur=0.2, vel=0.7, cutoff=1200, seed=0):
    n = int((dur + 0.15) * SR); f = float(mtof(midi)); t = _t(n); r = dsp.rng(seed)
    s = blep_saw(f, n, r.random()) * 0.6 + blep_saw(f * 1.004, n, r.random()) * 0.4 + np.sin(2 * np.pi * f / 2 * t) * 0.5
    fenv = np.exp(-t / 0.06)
    s = dsp.tv_lowpass(s, cutoff * (0.3 + 0.7 * fenv) + f, q=1.4, block=128)
    env = ramp(t, 0.003) * np.where(t < dur, np.exp(-t / (dur * 1.2)), np.exp(-dur / (dur * 1.2)) * np.exp(-(t - dur) / 0.03))
    return s * env * vel * 0.3


def sub(midi, dur, vel=0.7, attack=0.2, release=0.8):
    n = int((dur + release) * SR); f = float(mtof(midi))
    s = sine(f, n) + 0.15 * sine(2 * f, n)
    return dsp.saturate(s * dsp.adsr(n, attack, 1.0, 0.9, release, gate=dur), 1.3) * vel * 0.5


def braaam(midi=31, dur=3.5, vel=1.0, seed=0):
    """The Inception-style low brass blast: stacked saws (root, octave, fifth above), a filter that
    snaps open and closes, a 30 Hz 'growl' AM, distortion and a sine sub. Stereo."""
    n = int((dur + 1.0) * SR); t = _t(n); r = dsp.rng(seed)
    f = float(mtof(midi))
    out = np.zeros((n, 2))
    for mul, a in [(1, 1.0), (2, 0.7), (3, 0.45), (4, 0.25)]:
        for v in range(3):
            det = 2 ** ((v - 1) * 9 / 1200)
            s = blep_saw(f * mul * det * (1 - 0.01 * np.exp(-t / 0.15)), n, r.random())  # slight scoop up
            out += dsp.pan(s * a, (v - 1) * 0.6)
    growl = 1 + 0.35 * np.sin(2 * np.pi * 29 * t) * np.exp(-t / 1.2)
    fcut = 180 + 2600 * (np.minimum(1, t / 0.08) * np.exp(-t / 0.9)) + 200 * np.exp(-t / 3)
    out = dsp.tv_lowpass(out * growl[:, None], fcut, q=1.2)
    env = dsp.adsr(n, 0.04, 1.4, 0.5, 1.0, gate=dur)
    out = dsp.saturate(out * env[:, None] * 0.6, 2.2)
    subw = sine(f / 2 if f > 50 else f, n) * env * 0.8
    out += subw[:, None]
    return out * vel * 0.5


def taiko(vel=1.0, seed=0, pitch=1.0, big=True):
    n = int(2.2 * SR); t = _t(n); r = dsp.rng(seed)
    f0 = 58 * pitch
    fsweep = f0 * (1 + 0.6 * np.exp(-t / 0.03))
    s = np.sin(2 * np.pi * np.cumsum(fsweep) / SR) * np.exp(-t / (0.55 if big else 0.3))
    for ratio, a, d in [(1.59, 0.45, 0.18), (2.14, 0.3, 0.12), (2.30, 0.22, 0.10), (2.65, 0.12, 0.08)]:
        s += a * np.sin(2 * np.pi * f0 * ratio * t + r.uniform(0, 6)) * np.exp(-t / d)
    slap = dsp.bp(r.standard_normal(n), 900, 0.8) * np.exp(-t / 0.018) * 0.9
    s = s + slap
    s *= ramp(t, 0.0015)
    s = dsp.hp(s, 42)
    return dsp.saturate(s * vel * 0.8, 1.4)


def boom(vel=1.0, seed=0):
    n = int(4 * SR); t = _t(n); r = dsp.rng(seed)
    f = 30 + 55 * np.exp(-t * 2.2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.3) * ramp(t, 0.004)
    s += dsp.lp(r.standard_normal(n), 220) * np.exp(-t / 0.2) * 0.8
    return dsp.saturate(s * vel, 1.6) * 0.8


def tick(vel=0.7, seed=0, tock=False):
    """Pocket-watch tick: a sharp transient exciting two metallic resonances."""
    n = int(0.09 * SR); t = _t(n); r = dsp.rng(seed)
    click = r.standard_normal(n) * np.exp(-t / 0.0012)
    fr = (2350, 4100) if not tock else (1650, 3300)
    s = dsp.bp(click, fr[0], 9) * 1.4 + dsp.bp(click, fr[1], 12) * 0.8 + dsp.hp(click, 6000) * 0.25
    s += np.sin(2 * np.pi * (fr[0] * 0.5) * t) * np.exp(-t / 0.004) * 0.15
    return s * vel * 0.9


def shepard(dur, rate=0.18, base=55.0, octaves=7, vel=0.6, crescendo=True, seed=0):
    """Shepard-Risset glissando: `octaves` sine components an octave apart, each rising at `rate`
    octaves/s and wrapping; a raised-cosine window over log-frequency hides the wrap, so the pitch
    rises forever. Stereo (components alternate sides slightly)."""
    n = int(dur * SR); t = _t(n); r = dsp.rng(seed)
    out = np.zeros((n, 2))
    for k in range(octaves):
        pos = (k + rate * t) % octaves               # octave position 0..K
        f = base * 2 ** pos
        a = 0.5 - 0.5 * np.cos(2 * np.pi * pos / octaves)  # 0 at both ends of the range
        ph = 2 * np.pi * np.cumsum(f) / SR + r.uniform(0, 6)
        s = a * (np.sin(ph) + 0.25 * np.sin(2 * ph))
        out += dsp.pan(s, 0.35 if k % 2 else -0.35)
    env = np.minimum(1, t / 1.5)
    if crescendo: env = env * (0.25 + 0.75 * (t / max(dur, 1e-3)) ** 1.6)
    env *= np.minimum(1, (dur - t) / 0.05).clip(0, 1)
    return out * env[:, None] * vel * 0.25


def noise_riser(dur, vel=0.5, seed=0):
    n = int(dur * SR); t = _t(n); x = t / dur
    s = dsp.rng(seed).standard_normal((n, 2))
    s = dsp.tv_lowpass(s, 300 + 9000 * x ** 2, q=2.0)
    return s * (x ** 2.2)[:, None] * vel * 0.35


def reverse_swell(dur=1.6, vel=0.5, seed=0):
    """A reversed cymbal: bright noise with a crescendo that cuts dead at the end."""
    n = int(dur * SR); t = _t(n); x = t / dur
    s = dsp.hp(dsp.rng(seed).standard_normal((n, 2)), 2500)
    s = dsp.peak(s, 7000, 4, 0.8)
    return s * (x ** 3.5)[:, None] * vel * 0.25
