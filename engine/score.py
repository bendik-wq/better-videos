#!/usr/bin/env python3
"""Procedural score + sound design bed.

usage: score.py timeline.json out.wav '{"key": "D", "cues": [...]}'

Every cue is {"type", "shot", "at" (seconds into shot, negative = before it), "gain", ...}.
Types: boom, clang, clunk, whoosh, horn, hum, water, ticks, swell.
"""
import json, sys, wave
import numpy as np

SR = 48000
timeline = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
cfg = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
total = timeline[-1]["start"] + timeline[-1]["duration"] + 2.0
N = int(total * SR)
L = np.zeros(N); R = np.zeros(N)
t_all = np.arange(N) / SR
rs = np.random.default_rng(5)
shots = {s["id"]: s for s in timeline}


def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / hi) ** 4) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4))
    return np.fft.irfft(X, len(x))


def add(sig, at, gain=1.0, pan=0.0):
    i = int(max(0, at) * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt(0.5 * (1 - pan)); R[i:j] += s * np.sqrt(0.5 * (1 + pan))


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def boom(c):
    n = int(4 * SR); t = np.arange(n) / SR
    f = 52 * np.exp(-t * 1.5) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 1.1)
    s += lowpass(rs.standard_normal(n), 300) * env(n, 0.002, 0.25) * 0.6
    return np.tanh(s * 1.6)


def clang(c):
    n = int(5 * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for f, a, d in [(96, 1, 1.6), (233, 0.7, 1.2), (418, 0.5, 0.9), (611, 0.35, 0.7), (897, 0.25, 0.5), (1361, 0.15, 0.3), (2210, 0.08, 0.2)]:
        s += a * np.sin(2 * np.pi * f * t * (1 + 0.002 * np.sin(2 * np.pi * 3 * t))) * np.exp(-t / d)
    s += bandpass(rs.standard_normal(n), 200, 4000) * env(n, 0.001, 0.05)
    return np.tanh(s * 0.8) * 0.8


def clunk(c):  # heavy industrial light switching on
    n = int(3 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 70 * t) * env(n, 0.002, 0.18)
    s += bandpass(rs.standard_normal(n), 150, 2500) * env(n, 0.001, 0.04) * 1.2
    hum = np.sin(2 * np.pi * 100 * t) * 0.15 + np.sin(2 * np.pi * 200 * t) * 0.06
    s += hum * np.minimum(1, t / 0.05) * np.exp(-t / 1.4)
    return s


def whoosh(c):  # reverse swell into a cut
    d = c.get("dur", 1.2); n = int(d * SR); t = np.arange(n) / SR
    s = bandpass(rs.standard_normal(n), 300, 3000) * (t / d) ** 3
    return s * 0.7


def swell(c):
    d = c.get("dur", 3.0); n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) for f in (73.4, 110.0, 146.8, 220.0)) / 4
    s += bandpass(rs.standard_normal(n), 200, 1200) * 0.5
    return s * (t / d) ** 2.5


def horn(c):
    d = c.get("dur", 3.5); n = int(d * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for f in (69.3, 103.8):
        ph = 2 * np.pi * f * t
        s += sum(np.sin(k * ph) / k for k in range(1, 9))
    s = lowpass(s, 600) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 1.2)
    s = s / (np.abs(s).max() + 1e-9)
    # distance: echo off the water
    e = np.zeros(n); k = int(0.33 * SR); e[k:] = s[:-k] * 0.35
    return s + e


def span(c):
    s = shots[c["shot"]]; d = c.get("dur", s["duration"] - c.get("at", 0)); return int(d * SR), d


def hum(c):
    n, d = span(c); t = np.arange(n) / SR
    flick = 1 + 0.3 * (rs.random(n // 2400 + 1).repeat(2400)[:n] > 0.97)
    s = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.25 * np.sign(np.sin(2 * np.pi * 180 * t)) * 0.3)
    s += bandpass(rs.standard_normal(n), 2000, 6000) * 0.05
    return s * flick * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)


def water(c):
    n, d = span(c); t = np.arange(n) / SR
    s = bandpass(rs.standard_normal(n), 120, 900)
    lap = 0.5 + 0.5 * np.sin(2 * np.pi * 0.31 * t) * np.sin(2 * np.pi * 0.13 * t + 1)
    return s * lap * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)


def ticks(c):
    n, d = span(c); s = np.zeros(n); period = c.get("period", 0.5)
    click = bandpass(rs.standard_normal(int(0.03 * SR)), 1500, 7000) * env(int(0.03 * SR), 0.0005, 0.006)
    for k in range(int(d / period)):
        i = int(k * period * SR); s[i:i + len(click)] += click * (1 if k % 2 == 0 else 0.6)
    return s


SYN = dict(boom=boom, clang=clang, clunk=clunk, whoosh=whoosh, swell=swell, horn=horn, hum=hum, water=water, ticks=ticks)

# --- drone bed: minor-key partials breathing slowly, detuned for width ---
roots = {"D": 73.42, "C": 65.41, "E": 82.41, "A": 55.0}
r = roots.get(cfg.get("key", "D"), 73.42)
drone_gain = cfg.get("drone", 0.16)
for mult, amp, lfo in [(0.5, 0.9, 0.05), (1, 0.7, 0.07), (1.5, 0.35, 0.09), (2, 0.3, 0.11), (2.378, 0.18, 0.13), (3, 0.08, 0.17)]:
    a = amp * (0.6 + 0.4 * np.sin(2 * np.pi * lfo * t_all + mult))
    L += drone_gain * a * np.sin(2 * np.pi * r * mult * t_all)
    R += drone_gain * a * np.sin(2 * np.pi * r * mult * 1.003 * t_all + 0.7)
room = lowpass(rs.standard_normal(N), 400) * 0.05
L += room; R += np.roll(room, 2400)
# drone ducks to near-silence on the title card for impact
fade = np.ones(N)
for s in timeline:
    if s["id"] in cfg.get("silenceDrone", []):
        i, j = int(s["start"] * SR), int((s["start"] + s["duration"]) * SR)
        fade[i:j] = 0.15
fade = np.convolve(fade, np.ones(2400) / 2400, mode="same")
L *= fade; R *= fade

for c in cfg.get("cues", []):
    s = shots[c["shot"]]
    sig = SYN[c["type"]](c)
    at = s["start"] + c.get("at", 0)
    if c["type"] in ("whoosh", "swell"):
        at -= c.get("dur", 1.2 if c["type"] == "whoosh" else 3.0)
    add(sig, at, c.get("gain", 0.5), c.get("pan", 0))

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max()) / 0.8
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"[score] {total:.1f}s, {len(cfg.get('cues', []))} cues")
