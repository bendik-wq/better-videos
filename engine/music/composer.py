"""The composer: turns a list of mood sections into an arranged, mixed, mastered music bed.

A section is a dict:
  start, end   seconds
  mood         tension | wonder (discovery, bright) | urgency | melancholy | triumph | mystery
  key          'D', 'F# minor', 'Eb dorian' ... (mode defaults to the mood's mode)
  intensity    0..1, or [from, to] for a build across the section
  bpm          optional; otherwise the mood's tempo, nudged so the section is a whole number of
               bars and the next section's downbeat lands exactly on its cut ("tempo-locked")
  clock        True/False: ticking-clock motif (default on for tension and urgency)
  riser        True: Shepard-tone riser across the back half into the next section
  hit          True: taiko/boom (and a braaam if intense) on the downbeat
  ending       'resolve' (land on the tonic and ring), 'cut' (hard stop), 'flow' (default)
  layers       optional list to force layers: pad, bass, keys, ostinato, strings, clock, perc, braaam

Each section follows the cue arc: intro (pad alone, layers enter bar by bar), build (intensity
ramps, filters open), and an end that either flows into the next section, rises into a drop,
or resolves. Drops (chapter cards) are silence windows: music stops dead on the cut, only the
reverb tail rings into the card, and the next section comes back on a hit.
"""
import hashlib
import numpy as np
from . import dsp, instruments as I, theory as T
from .dsp import SR

MOODS = {
    #            bpm  bars/chord  register  reverb  default layers by intensity (threshold)
    "tension":    dict(bpm=96, hr=2, pad_oct=0, verb=0.32, keys="piano_low", ost="pulse", clock=True,
                       th=dict(bass=0.15, ostinato=0.3, clock=0.35, strings=0.55, perc=0.7, braaam=0.85)),
    "wonder":     dict(bpm=104, hr=1, pad_oct=0, verb=0.36, keys="pluck_arp", ost="pluck", clock=False, sparkle=True, bright=0.25,
                       th=dict(bass=0.25, keys=0.0, ostinato=0.35, strings=0.5, perc=0.8, braaam=2)),
    "urgency":    dict(bpm=128, hr=1, pad_oct=0, verb=0.22, keys=None, ost="spiccato", clock=True,
                       th=dict(bass=0.0, ostinato=0.0, clock=0.3, strings=0.4, perc=0.5, braaam=0.85)),
    "melancholy": dict(bpm=72, hr=2, pad_oct=0, verb=0.42, keys="piano", ost=None, clock=False,
                       th=dict(bass=0.3, keys=0.0, strings=0.35, ostinato=2, perc=2, braaam=2)),
    "triumph":    dict(bpm=92, hr=1, pad_oct=0, verb=0.34, keys="piano", ost="spiccato", clock=False,
                       th=dict(bass=0.0, keys=0.2, strings=0.2, ostinato=0.45, perc=0.55, braaam=0.9)),
    "mystery":    dict(bpm=80, hr=2, pad_oct=0, verb=0.5, keys="celesta", ost="pluck_sparse", clock=False,
                       th=dict(bass=0.25, keys=0.0, ostinato=0.4, strings=0.6, perc=0.85, braaam=2)),
}
ALIAS = {"discovery": "wonder", "bright": "wonder", "dread": "tension", "sad": "melancholy", "epic": "triumph"}

STEMS = ("pad", "bass", "keys", "ostinato", "strings", "clock", "perc", "fx")
# stem gain (linear) and reverb: (kind, send)
STEM_MIX = {"pad": (0.55, "hall", 0.35), "bass": (0.3, None, 0), "keys": (0.75, "plate", 0.28),
            "ostinato": (0.9, "plate", 0.16), "strings": (0.7, "hall", 0.3), "clock": (2.2, "room", 0.25),
            "perc": (0.55, "hall", 0.22), "fx": (0.5, "hall", 0.35)}
DYN_RANGE_DB = 8.0  # intensity 0 sits this far below intensity 1


def _seed(*xs):
    return int(hashlib.sha1(repr(xs).encode()).hexdigest()[:8], 16)


class Score:
    """Accumulates notes. By default straight into reverb buses (dry + one send per reverb kind,
    float32) so a 15-minute episode fits in memory; keep_stems=True keeps every stem separately
    (analysis, short renders)."""
    def __init__(self, total, keep_stems=False):
        self.N = int(np.ceil(total * SR)) + SR
        self.keep = keep_stems
        if keep_stems:
            self.stems = {k: np.zeros((self.N, 2), np.float32) for k in STEMS}
        else:
            self.bus = {k: np.zeros((self.N, 2), np.float32) for k in ("dry", "hall", "plate", "room")}
        self.level = np.ones(self.N, np.float32)  # intensity -> level automation (applied pre-reverb)
        self.info = []   # per-section arrangement facts (tempo, bars, chords, layers)
        self.notes = []  # symbolic log: (layer, t, dur, midi, chord pcs, scale pcs) for harmony QA

    def log(self, layer, t, dur, midis, ch, sc):
        for m in np.atleast_1d(midis):
            self.notes.append((layer, float(t), float(dur), int(m), tuple(sorted(set(p % 12 for p in ch["pcs"]))),
                               tuple(sorted(set(p % 12 for p in sc)))))

    def put(self, stem, sig, at, gain=1.0, pan=0.0):
        i = int(round(at * SR))
        k = min(len(sig), int(0.008 * SR))  # every note ends at exactly zero: no truncation clicks
        if k > 1:
            sig = sig.copy(); w = np.linspace(1, 0, k); sig[-k:] *= w if sig.ndim == 1 else w[:, None]
        if sig.ndim == 1: sig = dsp.pan(sig, pan)
        elif pan: sig = sig * np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)]) / np.sqrt(1)
        j0 = max(0, -i); i = max(0, i); k = min(self.N - i, len(sig) - j0)
        if k <= 0: return
        if self.keep:
            self.stems[stem][i:i + k] += sig[j0:j0 + k] * gain
            return
        g, kind, send = STEM_MIX[stem]
        x = sig[j0:j0 + k] * (gain * g)
        if kind:
            self.bus["dry"][i:i + k] += x * (1 - send)
            self.bus[kind][i:i + k] += x * send
        else:
            self.bus["dry"][i:i + k] += x


def _intensity(sec, x):
    v = sec.get("intensity", 0.5)
    if isinstance(v, (list, tuple)):
        return float(np.interp(x, np.linspace(0, 1, len(v)), v))
    return float(v)


def lock_tempo(dur, bpm, beats=4):
    bar = beats * 60 / bpm
    nb = max(1, int(round(dur / bar)))
    return nb, beats * 60 * nb / dur


def compose_section(S, sec, idx, nxt, seed):
    mood = ALIAS.get(sec.get("mood", "tension"), sec.get("mood", "tension"))
    P = MOODS[mood]
    t0, t1 = float(sec["start"]), float(sec["end"]); dur = t1 - t0
    if dur < 0.5: return
    tonic, mode = T.parse_key(sec.get("key", "D"))
    nb, bpm = lock_tempo(dur, sec.get("bpm", P["bpm"]))
    if dur / nb < 1.2:  # very short section: half-bar grid so it still has motion
        nb = max(1, nb)
    bar = dur / nb; beat = bar / 4; s16 = beat / 4
    r = dsp.rng(_seed(seed, idx, mood))
    hr = P["hr"] if bar * P["hr"] < 9 else 1
    nchords = int(np.ceil(nb / hr))
    variant = int(sec.get("variant", r.integers(0, 3)))
    prog, mode = T.progression(mood, tonic, mode, variant, max(1, nchords))
    ending = sec.get("ending", "flow")
    if ending == "resolve" and nchords > 1:  # land on the tonic chord
        home, _ = T.progression(mood, tonic, mode, 0, 1)
        home[0]["voicing"] = T.voice_lead([home[0]["pcs"]], start=prog[-2]["voicing"])[0]
        prog[-1] = home[0]
    th = dict(P["th"])
    forced = set(sec.get("layers", []))
    clock_on = sec.get("clock", P["clock"])
    into_drop = bool(nxt and nxt.get("drop"))
    key_change = bool(nxt and T.parse_key(nxt.get("key", "D")) != T.parse_key(sec.get("key", "D")))
    ramp = sec.get("intensity")
    # the cue's "drop out": one bar before the last two, everything but the pad falls away,
    # then the final push comes back on a hit (default for builds of 8+ bars)
    bd_bar = nb - 3 if sec.get("breakdown", isinstance(ramp, (list, tuple)) and nb >= 6 and ramp[-1] > ramp[0]) else None
    # the arc: layers enter bar by bar over the intro; the last bar thins out if we resolve
    intro_bars = 0 if (sec.get("hit") or sec.get("after_drop")) else min(2, max(0, nb - 1))  # a cue that enters on a hit enters at full strength

    def I_at(t):  # intensity at absolute time
        x = (t - t0) / max(dur, 1e-6)
        v = _intensity(sec, x)
        if intro_bars and t - t0 < intro_bars * bar:
            v *= 0.55 + 0.45 * (t - t0) / (intro_bars * bar)
        if bd_bar is not None and bd_bar * bar <= t - t0 < (bd_bar + 1) * bar:
            v = min(v, 0.2)
        return v

    def on(layer, t):
        if layer in forced: return True
        if sec.get("layers") is not None and layer not in forced: return False
        return I_at(t) >= th.get(layer, 2)

    seed_n = _seed(seed, idx)
    names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
    S.info.append(dict(start=round(t0, 3), end=round(t1, 3), mood=mood, key=f"{names[tonic % 12]} {mode}", bpm=round(bpm, 2), bars=nb,
                       chords=[names[c["root"] % 12] + ("dim" if (c["pcs"][1] - c["root"]) % 12 == 3 and (c["pcs"][2] - c["root"]) % 12 == 6
                                                        else "m" if (c["pcs"][1] - c["root"]) % 12 == 3 else
                                                        "sus" if (c["pcs"][1] - c["root"]) % 12 in (2, 5) else "") for c in prog],
                       breakdown_bar=bd_bar, ending=ending,
                       layers=sorted([l for l in ("bass", "keys", "ostinato", "strings", "clock", "perc")
                                      if any(on(l, t0 + x * dur + 0.01) for x in (0.1, 0.5, 0.9))] +
                                     (["braaam"] if (sec.get("braaam") or on("braaam", t0 + 0.01)) else []))))
    # level automation: intensity drives loudness (dynamic range across the episode)
    i0, i1 = int(t0 * SR), min(S.N, int(t1 * SR))
    tt = np.linspace(t0, t1, max(2, i1 - i0) // 480 + 2)
    S.level[i0:i1] = np.interp(np.arange(i0, i1) / SR, tt, dsp.undb(-DYN_RANGE_DB * (1 - np.clip([I_at(x) for x in tt], 0, 1))))
    # ---------------------------------------------------------------- harmony: pads, bass, strings
    for ci, ch in enumerate(prog):
        ct0 = t0 + ci * hr * bar
        if ct0 >= t1 - 1e-3: break
        clen = min(hr * bar, t1 - ct0)
        last = ci == len(prog) - 1
        hold = clen + (0.0 if into_drop and last else 0.15)
        if last and ending == "resolve": hold = clen + 2.5
        Ic = I_at(ct0 + clen / 2)
        oct_ = 12 * P["pad_oct"]
        sig = I.pad([m + oct_ for m in ch["voicing"]], hold, vel=0.55 + 0.3 * Ic, attack=min(1.6, clen * 0.4) if ci else min(2.5, clen * 0.6),
                    release=0.25 if (into_drop and last) else (0.9 if (key_change and last) else 2.2),
                    bright=min(1.0, 0.25 + 0.55 * Ic + P.get("bright", 0)), seed=seed_n + ci * 7)
        S.put("pad", sig, ct0, 0.5); S.log("pad", ct0, hold, [m + oct_ for m in ch["voicing"]], ch, T.scale(tonic, mode))
        if on("bass", ct0 + 0.01):
            S.log("bass", ct0, hold, ch["bass"], ch, T.scale(tonic, mode))
            S.put("bass", I.sub(ch["bass"], hold, vel=0.5 + 0.4 * Ic, attack=0.08, release=0.5 if not (into_drop and last) else 0.08), ct0)
        if on("strings", ct0 + 0.01):
            top = [m + 12 for m in ch["voicing"][1:]]
            S.log("strings", ct0, hold, top + [ch["bass"] + 12], ch, T.scale(tonic, mode))
            S.put("strings", I.strings(top, hold, vel=0.45 + 0.45 * Ic, attack=min(0.9, clen * 0.3), release=1.0,
                                       seed=seed_n + 100 + ci * 7, bright=0.3 + 0.5 * Ic), ct0, 0.55)
            S.put("strings", I.strings(ch["bass"] + 12, hold, vel=0.5 + 0.4 * Ic, attack=0.5, release=1.0,
                                       seed=seed_n + 200 + ci, section="celli"), ct0, 0.7)
    # ---------------------------------------------------------------- keys / motif
    kind = P["keys"]
    sc = T.scale(tonic, mode)
    motif = r.choice([[0, 2, 1, 4], [0, 1, 2, 1], [2, 1, 0, 1], [0, 2, 4, 2], [4, 2, 1, 0]])
    motif_rhythm = {"piano": [0, 1.5, 2, 3], "piano_low": [0, 2.5], "celesta": [0, 1.5, 3], "pluck_arp": None}.get(kind)
    for ci, ch in enumerate(prog):
        ct0 = t0 + ci * hr * bar
        if ct0 >= t1 - 1e-3 or not kind: continue
        clen = min(hr * bar, t1 - ct0)
        if not on("keys", ct0 + 0.01) and kind != "piano_low": continue
        if kind == "piano_low" and I_at(ct0) < 0.2: continue
        tones = sorted({(p - tonic) % 12 for p in ch["pcs"]})
        upper = [m for m in range(64, 86) if m % 12 in ch["pcs"]]
        if kind == "pluck_arp":  # Epic-Mountain shimmer: 8ths across chord tones, rising then turning
            pat = [0, 1, 2, 3, 2, 1, 3, 4] if len(upper) > 4 else [0, 1, 2, 1, 2, 3, 2, 1]
            for b in range(int(round(clen / (beat / 2)))):
                m = upper[min(len(upper) - 1, pat[b % len(pat)] + (2 if Ic > 0.6 else 0))]
                tt = ct0 + b * beat / 2
                if tt >= t1 - 0.02: break
                S.log("keys", tt, beat / 2, m, ch, sc)
                S.put("keys", I.pluck(m, beat * 1.6, vel=0.4 + 0.3 * Ic * (1.0 if b % 2 == 0 else 0.8), seed=seed_n + ci * 31 + b,
                                      bright=0.45 + 0.3 * Ic + P.get("bright", 0)), tt, 0.7, pan=0.3 * np.sin(b * 1.7))
                if P.get("sparkle") and b % 4 in (0, 3) and Ic > 0.3:  # glassy celesta two octaves up: the "discovery" shimmer
                    sp = upper[(b // 4 + (1 if b % 4 else 3)) % len(upper)] + 12
                    S.log("keys", tt, beat, sp, ch, sc)
                    S.put("keys", I.celesta(sp, 2.0, vel=0.32 + 0.2 * Ic, seed=seed_n + b), tt, 0.8, pan=0.45 * np.cos(b * 0.9))
            continue
        # melodic motif snapped to chord tones, repeated per chord (motivic unity)
        reps = max(1, int(round(clen / bar)))
        for rp in range(reps):
            for k, pos in enumerate(motif_rhythm):
                tt = ct0 + rp * bar + pos * beat
                if tt >= ct0 + clen - 0.05: break
                deg = motif[k % len(motif)] + (1 if rp % 2 else 0)
                pc = sc[deg % 7] % 12
                target = 64 + (pc - 64) % 12
                if kind == "piano_low": target -= 24
                m = min(upper or [target], key=lambda u: abs(u - target)) if kind != "piano_low" else \
                    min([u - 24 for u in upper] or [target], key=lambda u: abs(u - target))
                if pos % 1 and kind != "piano_low":  # off-beat: a diatonic passing/neighbour tone
                    scale_up = [u for u in range(60, 90) if u % 12 in {p % 12 for p in sc}]
                    m = min(scale_up, key=lambda u: (abs(u - (m + (1 if deg % 2 else -1))), u))
                S.log("keys", tt, beat, m + (12 if kind == "celesta" else 0), ch, sc)
                if kind == "celesta":
                    S.put("keys", I.celesta(m + 12, 2.5, vel=0.5, seed=seed_n + k), tt, 0.8, pan=0.2 * (k - 1))
                else:
                    S.put("keys", I.piano(m, beat * (2 if k == len(motif_rhythm) - 1 else 1.4), vel=0.45 + 0.25 * Ic, seed=seed_n + ci * 13 + k),
                          tt, 0.9, pan=(m - 66) / 40)
    # ---------------------------------------------------------------- ostinato
    ost = P["ost"]
    if ost:
        # patterns are chord-tone indices (0 root, 1 third, 2 fifth, 3 octave, 4 tenth, 5 twelfth,
        # 6 double octave, 9 = diatonic ninth), so every step fits the chord under it
        pats = {"pulse": [0, 0, 3, 0, 2, 0, 3, 0, 0, 0, 3, 0, 2, 0, 1, 0],
                "spiccato": [0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 2, 0, 4, 0, 2, 0],
                "pluck": [0, 2, 3, 9, 3, 2, 4, 3, 0, 2, 3, 9, 5, 9, 3, 2],
                "pluck_sparse": [0, None, None, 2, None, None, 3, None, None, 1, None, None, 4, None, None, None]}[ost]
        nsteps = int(round(dur / s16))
        for k in range(nsteps):
            tt = t0 + k * s16
            if tt >= t1 - 0.01: break
            if not on("ostinato", tt): continue
            Ik = I_at(tt)
            ci = min(len(prog) - 1, int((tt - t0) / (hr * bar)))
            root = prog[ci]["bass"] + 12
            idx_ = pats[k % 16]
            if idx_ is None: continue
            step = chord_step(prog[ci], idx_, sc)
            S.log("ostinato", tt, s16, root + step, prog[ci], sc)
            dens16 = Ik > 0.6 or ost in ("pluck", "spiccato")
            if not dens16 and k % 2: continue
            acc = 1.0 if k % 4 == 0 else 0.7
            if ost == "pulse":
                S.put("ostinato", I.pulse(root + step, s16 * 0.9, vel=acc * (0.5 + 0.4 * Ik), cutoff=500 + 3500 * Ik ** 1.5, seed=k),
                      tt, 1.0, pan=0.25 if k % 2 else -0.25)
            elif ost == "spiccato":
                S.put("ostinato", I.spiccato(root + step + 12, s16 * 1.1, vel=acc * (0.5 + 0.4 * Ik), seed=k, bright=0.3 + 0.6 * Ik),
                      tt, 1.0, pan=-0.3 if (k // 2) % 2 else 0.3)
            else:
                S.put("ostinato", I.pluck(root + step + 12, s16 * 3, vel=acc * (0.35 + 0.3 * Ik), seed=k, bright=0.3 + 0.4 * Ik),
                      tt, 0.8, pan=0.5 * np.sin(k * 0.9))
    # ---------------------------------------------------------------- ticking clock
    if clock_on or "clock" in forced:
        k = 0
        while True:
            tt = t0 + k * beat / 2
            if tt >= t1 - 0.02: break
            Ik = I_at(tt)
            if on("clock", tt):
                S.put("clock", I.tick(0.55 + 0.35 * Ik, seed=k, tock=bool(k % 2)), tt, 1.0, pan=0.15)
                if Ik > 0.75:  # double-time: Dunkirk's insistent 16ths at the top of the build
                    S.put("clock", I.tick(0.35 + 0.2 * Ik, seed=k + 999, tock=True), tt + beat / 4, 1.0, pan=-0.15)
            k += 1
    # ---------------------------------------------------------------- percussion
    if any(on("perc", t0 + b * bar + 0.01) for b in range(nb)) or "perc" in forced:
        for b in range(nb):
            tb = t0 + b * bar
            if not on("perc", tb + 0.01): continue
            Ib = I_at(tb)
            hits = [(0, 1.0, 1.0), (2, 0.75, 1.15)] if Ib < 0.85 else [(0, 1.0, 1.0), (1.5, 0.6, 1.3), (2, 0.85, 1.15), (3, 0.6, 1.3)]
            if b % 4 == 3 and Ib > 0.6: hits += [(3.5, 0.55, 1.4), (3.75, 0.65, 1.4)]
            for pos, v, p in hits:
                S.put("perc", I.taiko(v * (0.6 + 0.4 * Ib), seed=b * 10 + int(pos * 4), pitch=p, big=pos == 0), tb + pos * beat, 1.0,
                      pan=0.2 * (p - 1.15))
    # ---------------------------------------------------------------- hits, braaams, risers
    if bd_bar is not None:  # back in after the breakdown
        tb = t0 + (bd_bar + 1) * bar
        S.put("perc", I.boom(0.7, seed=idx + 40), tb, 0.8)
        S.put("fx", I.reverse_swell(min(1.5, bar * 0.9), vel=0.5, seed=idx + 41), tb - min(1.5, bar * 0.9), 1.0)
    if sec.get("hit") or (idx > 0 and sec.get("after_drop")):
        S.put("perc", I.boom(0.9, seed=idx), t0, 1.0)
        S.put("perc", I.taiko(1.0, seed=idx + 5, pitch=0.9), t0, 0.8)
    if (sec.get("braaam") or on("braaam", t0 + 0.01)):
        bm = 24 + tonic % 12
        S.put("fx", I.braaam(bm + 12 if bm < 28 else bm, min(4.0, dur * 0.8), seed=idx), t0, 0.9)
    want_riser = sec.get("riser") or (into_drop and _intensity(sec, 1.0) > 0.5)
    if want_riser:
        rd = min(dur * 0.6, 12.0)
        S.put("fx", I.shepard(rd, rate=0.12 + 0.1 * _intensity(sec, 1.0), base=tonic_freq(tonic), vel=0.7, seed=idx), t1 - rd, 1.0)
    if nxt and (into_drop or nxt.get("hit") or _intensity(nxt, 0) > _intensity(sec, 1.0) + 0.25):
        S.put("fx", I.reverse_swell(min(2.0, dur * 0.4), vel=0.6, seed=idx), t1 - min(2.0, dur * 0.4), 1.0)
        S.put("fx", I.noise_riser(min(3.0, dur * 0.5), vel=0.35, seed=idx + 1), t1 - min(3.0, dur * 0.5), 1.0)


def chord_step(ch, idx, sc):
    """Semitones above the chord root for chord-tone index idx (see the ostinato patterns)."""
    root = ch["root"]
    iv = sorted({(p - root) % 12 for p in ch["pcs"]} - {0})
    third = next((i for i in iv if i in (3, 4)), iv[0] if iv else 7)
    fifth = next((i for i in iv if i in (6, 7, 8)), 7)
    if idx == 9:  # diatonic second above the root, an octave up
        pcs = sorted(p % 12 for p in sc)
        up = [(p - root) % 12 for p in pcs if 1 <= (p - root) % 12 <= 2]
        return 12 + (up[-1] if up else 2)
    return {0: 0, 1: third, 2: fifth, 3: 12, 4: 12 + third, 5: 12 + fifth, 6: 24}[idx]


def tonic_freq(pc):
    return float(T.mtof(24 + pc))  # C1..B1: the riser starts deep


def compose(sections, total, seed=0, drops=(), master=True, return_stems=False):
    """Render the music bed. sections: list of section dicts (see module docstring).
    drops: [(start, end)] silence windows (chapter cards). Returns stereo (N, 2) float."""
    S = Score(total, keep_stems=return_stems)
    secs = sorted(sections, key=lambda s: s["start"])
    for i, sec in enumerate(secs):
        if sec.get("mood") in (None, "silence", "none"): continue
        nxt = secs[i + 1] if i + 1 < len(secs) else None
        nx = dict(nxt) if nxt else None
        if nx is not None and any(abs(a - sec["end"]) < 0.3 for a, b in drops): nx["drop"] = True
        compose_section(S, sec, i, nx, seed)
    # drops: gate the dry signal so the reverb tail rings into the silence
    gate = np.ones(S.N, np.float32)
    for a, b in drops:
        i, j = int(a * SR), int(b * SR)
        gate[max(0, i - int(0.02 * SR)):j] = 0
    gate = dsp.movavg(gate, int(0.02 * SR), edge=True).astype(np.float32)
    k = int(0.06 * SR)  # level automation must never step (section joins, breakdown bars): 60 ms ramps
    S.level = dsp.movavg(S.level, k, edge=True).astype(np.float32)
    env = (gate * S.level).astype(np.float32)[:, None]
    stems = {}
    if S.keep:
        for k, sig in S.stems.items():
            g, kind, send = STEM_MIX[k]
            if not np.any(sig): continue
            sig = sig * env * g
            if kind:
                sig = sig * (1 - send) + dsp.reverb_wet(sig, kind, seed=3) * send
            stems[k] = sig
        mix = sum(stems.values()) if stems else np.zeros((S.N, 2), np.float32)
    else:
        mix = S.bus.pop("dry"); mix *= env
        for kind in list(S.bus):
            b = S.bus.pop(kind)
            if np.any(b):
                b *= env
                mix += dsp.reverb_wet(b, kind, seed=3).astype(np.float32)
            del b
    notes, info = S.notes, S.info
    del S
    if master:
        mix = master_bus(mix)
    global LAST
    LAST = dict(notes=notes, harmony=harmony_report(notes), sections=info)
    return (mix, stems) if return_stems else mix


LAST = {}


def harmony_report(notes):
    """Share of note-time (per layer) on chord tones / in scale. Ninths and the colour tones in
    the chord count as chord tones; passing tones show up as 'in scale, not chord'."""
    out = {}
    for layer in sorted({n[0] for n in notes}):
        tot = ct = insc = 0.0
        for l, t, d, m, chp, scp in notes:
            if l != layer: continue
            tot += d; pc = m % 12
            if pc in chp: ct += d
            elif pc in scp: insc += d
        if tot: out[layer] = dict(chord_tone=round(ct / tot, 3), scale_only=round(insc / tot, 3), outside=round(1 - (ct + insc) / tot, 3))
    return out


def master_bus(x, lufs=-16.0):
    """Music mastering: clean the sub, tame the low-mids, glue compression, air, true-peak limit.
    float32 in, float32 out on long files (filters run chunked)."""
    x = dsp.hp(x, 32, 0.6)
    # fill the 100-160 Hz gap between the sub and the voice (measured against reference doc mixes),
    # trim the sub hump, keep the low-mids clear for the VO, open the air
    x = dsp.eq(x, [("lowshelf", 60, -2.0, 0.7), ("peak", 130, 2.5, 0.8), ("peak", 320, -2.0, 0.9),
                   ("peak", 2800, -1.0, 1.2), ("highshelf", 9000, 1.5, 0.7)])
    x, _ = dsp.compress(x, thresh_db=-22, ratio=2.0, attack=0.03, release=0.3, knee=8, rms=0.03)
    if np.abs(x).max() > 0:
        x, _ = dsp.normalize_lufs(x, lufs)
    return dsp.limit(x, -1.0, release=0.12)
