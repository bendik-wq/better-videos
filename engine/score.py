#!/usr/bin/env python3
"""Procedural score + sound design bed.

usage: score.py timeline.json out.wav '{"key": "D", "cues": [...], "music": [...]}'
       score.py --vo timeline.json vo.wav <start s> <length s>   (sample-exact VO track)
       score.py --mix bed.wav vo.wav out.wav <start s> <length s> [--plots]
                 dialogue-priority mix (music/SFX/VO buses, multiband ducking, -14 LUFS, -1 dBTP)
                 + an audio QA report next to the output (out.qa.json)

cfg.music = [{shot, mood, key, intensity, until, at?, bpm?, clock?, riser?, hit?, ending?, layers?}]
  composes a real score with engine/music (moods: tension, wonder/discovery, urgency, melancholy,
  triumph, mystery). Chapter cards (set "chapter") drop to silence automatically (cfg.dropOnChapters,
  default true; extra drops via cfg.drops = [shot ids]). Entries {type:"track", file, licence, source}
  place CC0/public-domain recordings (see engine/music/tracks.py). With cfg.music the old drone is
  off unless cfg.drone is given. Writes <out>.music.wav, <out>.sfx.wav stems and <out>.licences.json.

Every cue is {"type", "shot", "at" (seconds into shot, negative = before it), "gain", ...}.
Types: boom, clang, clunk, whoosh, horn, hum, water, ticks, swell, pulse, and sfx (any engine/sfx.py preset).
cfg.transitions = [{shot, name, dur}] adds the matching transition sound for each planned cut.
"""
import json, sys, wave
import numpy as np


def place_vo(timeline_path, out_path, start, length):
    """Lay every shot's VO wav on one mono track at its exact sample (voAt - start), clipped to
    [start, start + length). Sample-exact, so VO never drifts against the picture however many
    shots or whatever the frame rate."""
    tl = json.load(open(timeline_path))
    rates = set()
    for s in tl:
        if s.get("voFile"):
            with wave.open(s["voFile"]) as w: rates.add(w.getframerate())
    sr = max(rates) if rates else 24000  # 48 kHz when voice.py's fx chain is on, else Kokoro's 24 kHz
    n = int(round(float(length) * sr)); trk = np.zeros(n)
    for s in tl:
        if not s.get("voFile"): continue
        with wave.open(s["voFile"]) as w:
            a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float) / 32768
            if w.getnchannels() > 1: a = a.reshape(-1, w.getnchannels()).mean(1)
            if w.getframerate() != sr:
                try:  # band-limited polyphase resample
                    from scipy.signal import resample_poly
                    g = np.gcd(sr, w.getframerate()); a = resample_poly(a, sr // g, w.getframerate() // g)
                except ImportError:  # linear fallback
                    a = np.interp(np.arange(int(len(a) * sr / w.getframerate())) * w.getframerate() / sr, np.arange(len(a)), a)
        i = int(round((s["voAt"] - float(start)) * sr)); j0 = max(0, -i); i = max(0, i)
        k = min(n - i, len(a) - j0)
        if k > 0: trk[i:i + k] += a[j0:j0 + k]
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(trk, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"[vo] {length}s placed from {start}s")


if len(sys.argv) > 1 and sys.argv[1] == "--vo":  # usage: score.py --vo timeline.json out.wav start length
    place_vo(*sys.argv[2:6]); sys.exit(0)


def mix_main(bed_path, vo_path, out_path, start, length, plots=False, opts=None):
    """Bus mix of a score.py bed (+ its stems if present) and the --vo track."""
    import os, soundfile as sf
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from music import mix as MX, qa as QA
    SRm = 48000
    a, n = int(round(float(start) * SRm)), int(round(float(length) * SRm))

    def load(p):
        x, sr = sf.read(p, always_2d=True)
        x = MX.to_stereo48(x if x.shape[1] > 1 else x[:, 0], sr)
        return x

    stem = bed_path[:-4]
    if os.path.exists(stem + ".music.wav") and os.path.exists(stem + ".sfx.wav"):
        music, sfx = load(stem + ".music.wav")[a:a + n], load(stem + ".sfx.wav")[a:a + n]
    else:  # legacy bed: treat it all as music
        music, sfx = load(bed_path)[a:a + n], None
    vo = load(vo_path)[:n]
    out, buses = MX.mix(music=music, sfx=sfx, vo=vo[:, 0], n=n, opts=opts)
    sf.write(out_path, out, SRm, subtype="PCM_24")
    rep = QA.report(out, vo=buses["vo"], music=buses["music"], name=os.path.basename(out_path))
    json.dump(rep, open(out_path[:-4] + ".qa.json", "w"), indent=1)
    if plots:
        QA.plots(out, out_path[:-4], title=os.path.basename(out_path), vo=buses["vo"])
    print(f"[mix] {rep['integrated_lufs']} LUFS, TP {rep['true_peak_dbtp']} dBTP, LRA {rep['lra_lu']}, "
          f"clipped runs {rep['clipped_runs']}, VO over music {rep.get('vo_over_music_lu', {}).get('median')} LU, "
          f"{'PASS' if rep['pass'] else 'CHECK ' + str([k for k, v in rep['checks'].items() if not v])}")
    return rep


if len(sys.argv) > 1 and sys.argv[1] == "--mix":  # usage: score.py --mix bed.wav vo.wav out.wav start length [--plots]
    mix_main(*sys.argv[2:7], plots="--plots" in sys.argv); sys.exit(0)

SR = 48000
timeline = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
arg = sys.argv[3] if len(sys.argv) > 3 else '{}'
cfg = json.load(open(arg[1:])) if arg.startswith('@') else json.loads(arg)
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


def pulse(c):
    n, d = span(c); s = np.zeros(n); period = 60 / c.get("bpm", 64)
    k = int(0.5 * SR); tk = np.arange(k) / SR
    beat = np.sin(2 * np.pi * 48 * tk) * np.exp(-tk / 0.12)
    for b in range(int(d / period)):
        for off, g in ((0, 1.0), (0.28, 0.6)):
            i = int((b * period + off) * SR); j = min(n, i + k)
            if i < n: s[i:j] += beat[: j - i] * g
    return s * np.minimum(1, np.arange(n) / SR / 1.5) * np.minimum(1, (d - np.arange(n) / SR) / 1.0)


SYN = dict(pulse=pulse, boom=boom, clang=clang, clunk=clunk, whoosh=whoosh, swell=swell, horn=horn, hum=hum, water=water, ticks=ticks)

# --- drone bed: minor-key partials breathing slowly, detuned for width; key can change per section ---
roots = {"C": 65.41, "C#": 69.30, "D": 73.42, "Eb": 77.78, "E": 82.41, "F": 87.31, "F#": 92.50, "G": 98.0, "Ab": 103.83, "A": 55.0, "Bb": 58.27, "B": 61.74}
drone_gain = cfg.get("drone", 0.16 if not cfg.get("music") else 0.0)
sections = [(0.0, cfg.get("key", "D"))] + [(shots[x["shot"]]["start"], x["key"]) for x in cfg.get("sections", [])]
for si, (s0, key) in enumerate(sections):
    s1 = sections[si + 1][0] if si + 1 < len(sections) else total
    i0, i1 = max(0, int((s0 - 1.5) * SR)), min(N, int((s1 + 1.5) * SR))
    tt = t_all[i0:i1]; r = roots.get(key, 73.42)
    w = np.minimum(1, np.minimum(tt - (s0 - 1.5), (s1 + 1.5) - tt) / 3.0).clip(0, 1)  # 3s crossfades
    for mult, amp, lfo in [(0.5, 0.9, 0.05), (1, 0.7, 0.07), (1.5, 0.35, 0.09), (2, 0.3, 0.11), (2.378, 0.18, 0.13), (3, 0.08, 0.17)]:
        a = amp * (0.6 + 0.4 * np.sin(2 * np.pi * lfo * tt + mult)) * w
        L[i0:i1] += drone_gain * a * np.sin(2 * np.pi * r * mult * tt)
        R[i0:i1] += drone_gain * a * np.sin(2 * np.pi * r * mult * 1.003 * tt + 0.7)
if drone_gain > 0:
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

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import sfx  # engine/sfx.py: the sound-design library (48 kHz, anchor-placed)

def place_sfx(name, at, gain=0.5, pan=0.0, seed=0, params=None):
    sig, anchor = sfx.render(name, seed=seed, **(params or {}))
    sfx.place(L, R, sig, anchor, at, gain, pan)

# every planned transition gets its matching sound, sized to the move
for tr in cfg.get("transitions", []):
    for q in sfx.for_transition(tr["name"], shots[tr["shot"]]["start"], tr.get("dur", 0.4)):
        place_sfx(q["name"], q["at"], q.get("gain", 0.4), 0.0, q.get("seed", 0))

MUS = np.zeros((N, 2)); licences = []


def music_sections():
    """cfg.music -> composer sections + drop windows (chapter cards). Every entry (tracks too)
    starts at its shot (+at); a composed entry runs until `until` (a shot id) or the next entry."""
    ents = list(cfg.get("music", []))
    drops = []
    if cfg.get("dropOnChapters", True):
        drops += [(s["start"], s["start"] + s["duration"]) for s in timeline if s.get("set") == "chapter"]
    drops += [(shots[d]["start"], shots[d]["start"] + shots[d]["duration"]) for d in cfg.get("drops", [])]
    end_all = timeline[-1]["start"] + timeline[-1]["duration"]
    starts = [shots[m["shot"]]["start"] + m.get("at", 0) for m in ents]
    secs = []
    for i, m in enumerate(ents):
        if m.get("type") == "track": continue
        a = starts[i]
        b = shots[m["until"]]["start"] + m.get("untilAt", 0) if m.get("until") else (starts[i + 1] if i + 1 < len(ents) else end_all)
        sec = {k: v for k, v in m.items() if k not in ("shot", "until", "at", "untilAt", "type")}
        for d0, d1 in drops:  # a cue that starts on a chapter card comes in after it, on a hit
            if d0 - 0.05 <= a < d1:
                a = d1; sec["after_drop"] = True
        if b - a > 0.5:
            secs.append(dict(sec, start=a, end=b))
    return secs, drops


if cfg.get("music"):
    try:
        import music as M
        secs, drops = music_sections()
        if secs:
            bed = M.compose(secs, total, seed=cfg.get("seed", 0), drops=drops)
            k = min(N, len(bed)); MUS[:k] += bed[:k]
            from music import composer as _C
            if out_path.endswith(".wav"):
                json.dump(dict(sections=_C.LAST["sections"], drops=drops, harmony=_C.LAST["harmony"]),
                          open(out_path[:-4] + ".music.json", "w"), indent=1)
            print(f"[score] music: {len(secs)} sections, {len(drops)} drops")
    except ImportError as e:  # numpy-only box: keep the legacy drone so renders never break
        print(f"[score] engine/music unavailable ({e}); pip install scipy. Falling back to the drone.", file=sys.stderr)


def place_track(c, at):
    from music import tracks
    if c.get("until") and not c.get("dur"):
        c = dict(c, dur=shots[c["until"]]["start"] + c.get("untilAt", 0) - at, fadeOut=c.get("fadeOut", 1.0))
    sig, meta = tracks.render(c, root=cfg.get("root", "."))
    i = int(max(0, at) * SR); j = min(N, i + len(sig))
    if j > i: MUS[i:j] += sig[: j - i]
    licences.append(dict(meta, at=round(at, 3)))


for m in cfg.get("music", []):
    if m.get("type") == "track":
        place_track(m, shots[m["shot"]]["start"] + m.get("at", 0))

for c in cfg.get("cues", []):
    s = shots[c["shot"]]
    if c["type"] == "track":
        place_track(c, s["start"] + c.get("at", 0)); continue
    if c["type"] == "sfx":  # {"type":"sfx","name":"whoosh.m","shot","at","seed"?,"params"?,"gain"?,"pan"?}
        place_sfx(c["name"], s["start"] + c.get("at", 0), c.get("gain", 0.5), c.get("pan", 0.0), c.get("seed", 0), c.get("params"))
        continue
    sig = SYN[c["type"]](c)
    at = s["start"] + c.get("at", 0)
    if c["type"] in ("whoosh", "swell"):
        at -= c.get("dur", 1.2 if c["type"] == "whoosh" else 3.0)
    add(sig, at, c.get("gain", 0.5), c.get("pan", 0))

SFX = np.stack([L, R], 1)
if np.abs(MUS).max() > 0:
    # sit the music bus where the legacy drone sat relative to the SFX (about -20 LUFS before the peak
    # normalise below), so render.mjs's existing ffmpeg mix still balances
    MUS *= 10 ** (cfg.get("musicDb", 0.0) / 20) * 0.3
mix = SFX + MUS
k = max(1e-9, np.abs(mix).max()) / 0.8
mix /= k
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
if out_path.endswith(".wav"):  # stems for the bus mix (score.py --mix), same scale as the bed
    try:
        import soundfile as sf
        sf.write(out_path[:-4] + ".music.wav", (MUS / k).astype(np.float32), SR, subtype="FLOAT")
        sf.write(out_path[:-4] + ".sfx.wav", (SFX / k).astype(np.float32), SR, subtype="FLOAT")
    except ImportError:
        pass
    if licences:
        json.dump(licences, open(out_path[:-4] + ".licences.json", "w"), indent=1)
        for x in licences: print(f"[score] track {x['file']}: {x['licence']} ({x.get('source')})")
print(f"[score] {total:.1f}s, {len(cfg.get('cues', []))} cues")
