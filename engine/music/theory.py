"""Harmony: keys, modes, mood progressions and voice-led chord voicings."""
import numpy as np

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

MODES = {
    "ionian": [0, 2, 4, 5, 7, 9, 11], "major": [0, 2, 4, 5, 7, 9, 11],
    "lydian": [0, 2, 4, 6, 7, 9, 11], "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10], "aeolian": [0, 2, 3, 5, 7, 8, 10], "minor": [0, 2, 3, 5, 7, 8, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10], "harmonic": [0, 2, 3, 5, 7, 8, 11],
}


def parse_key(key):
    """'D', 'Dm', 'D minor', 'F# lydian', 'Eb dorian' -> (tonic pitch class, mode or None)."""
    k = str(key).strip().replace("♭", "b").replace("♯", "#")
    parts = k.split()
    root = parts[0]
    mode = parts[1].lower() if len(parts) > 1 else None
    if len(root) > 1 and root[-1] == "m" and root[:-1] in NOTE:
        root, mode = root[:-1], mode or "minor"
    return NOTE[root], mode


def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m, float) - 69) / 12)


# Progressions are scale degrees (0-based) in the mood's mode, with optional chord colour.
# Each entry: (degree, colour) where colour adds tones: 'add9', '7', 'sus2', 'sus4', 'maj7#11', '' = triad.
# 'b'-prefixed degrees are borrowed chromatic roots in semitones (e.g. ('b6', '') = bVI major triad).
PROGRESSIONS = {
    # Zimmer: few chords, long harmonic rhythm, pedal tones; phrygian bII for dread
    "tension": [[(0, "sus2"), (0, ""), (5, ""), (1, "")], [(0, ""), (5, ""), (3, ""), (4, "")],
                [(0, "add9"), (5, "add9"), (0, ""), (1, "")]],
    # discovery: lydian #4 shimmer, open add9/maj7 voicings, I-II-vi-IV and friends
    "wonder": [[(0, "add9"), (1, ""), (5, "7"), (4, "sus2")], [(0, "maj7"), (4, "sus2"), (5, "7"), (1, "")],
               [(0, "add9"), (2, "7"), (4, ""), (1, "")]],
    "urgency": [[(0, ""), (5, ""), (6, ""), (4, "")], [(0, ""), (6, ""), (5, ""), (4, "")],
                [(0, ""), (2, ""), (6, ""), (4, "")]],
    "melancholy": [[(0, "add9"), (5, "maj7"), (2, ""), (6, "")], [(0, ""), (3, "7"), (5, "maj7"), (4, "sus4")],
                   [(5, "maj7"), (6, ""), (0, "add9"), (0, "")]],
    # triumph: bVI-bVII-I epic cadence, I-V-vi-IV
    "triumph": [[(0, ""), (4, ""), (5, ""), (3, "")], [("b6", ""), ("b7", ""), (0, "add9"), (0, "")],
                [(3, "add9"), (0, ""), (4, "sus4"), (4, "")]],
    # mystery: harmonic minor, i - bVI - iv - V, sparse
    "mystery": [[(0, "add9"), (5, "maj7"), (3, ""), (4, "")], [(0, ""), (1, ""), (0, ""), (5, "")],
                [(0, "sus2"), (3, "7"), (5, "maj7#11"), (4, "")]],
}

MOOD_MODE = {"tension": "phrygian", "wonder": "lydian", "urgency": "minor", "melancholy": "aeolian",
             "triumph": "major", "mystery": "harmonic", "discovery": "lydian", "bright": "lydian"}


def scale(tonic, mode):
    return [tonic + i for i in MODES[mode]]


def chord_pcs(tonic, mode, deg, colour=""):
    """Pitch classes (root first) of a diatonic chord on degree `deg` (or borrowed 'b6'/'b7'/'b3'/'b2')."""
    sc = MODES[mode]
    if isinstance(deg, str):  # borrowed major triad on a flat degree
        semis = {"b2": 1, "b3": 3, "b6": 8, "b7": 10}[deg]
        root = tonic + semis
        pcs = [root, root + 4, root + 7]
        third, fifth, seventh = 4, 7, 10
    else:
        def st(k):  # k-th scale step above degree, in semitones from tonic
            j = deg + k
            return sc[j % 7] + 12 * (j // 7)
        root = tonic + st(0)
        pcs = [tonic + st(0), tonic + st(2), tonic + st(4)]
        third, fifth, seventh = st(2) - st(0), st(4) - st(0), st(6) - st(0)
    if colour == "sus2": pcs[1] = root + 2
    if colour == "sus4": pcs[1] = root + 5
    if colour == "add9": pcs.append(root + 14)
    if colour == "7": pcs.append(root + seventh)
    if colour == "maj7": pcs.append(root + 11)
    if colour == "maj7#11": pcs += [root + 11, root + 18]
    return [p % 12 for p in pcs], root % 12


def voicings(pcs, lo=50, hi=74, n=4):
    """Candidate n-note voicings (MIDI) of the pitch classes inside [lo, hi]."""
    pool = [m for m in range(lo, hi + 1) if m % 12 in pcs]
    out = []
    import itertools
    for combo in itertools.combinations(pool, n):
        got = {m % 12 for m in combo}
        # must contain root, third/sus and (if room) everything
        if len(got) < min(len(set(pcs)), n): continue
        if pcs[0] not in got: continue
        if combo[-1] - combo[0] > 19: continue  # keep it within ~an octave and a half
        gaps = np.diff(combo)
        if combo[0] < 55 and gaps[0] < 5: continue  # no low muddy seconds/thirds
        out.append(list(combo))
    return out


def voice_lead(prog_pcs, lo=50, hi=74, n=4, start=None):
    """Choose the voicing for each chord that minimises total voice movement (with a small
    penalty for parallel motion and for drifting from the register centre)."""
    centre = (lo + hi) / 2
    prev = start; out = []
    for pcs in prog_pcs:
        cands = voicings(pcs, lo, hi, n) or voicings(pcs, lo - 5, hi + 5, 3)
        best, bc = None, 1e9
        for v in cands:
            c = abs(np.mean(v) - centre) * 0.6
            if prev is not None:
                m = min(len(v), len(prev))
                mv = np.array(v[:m]) - np.array(prev[:m])
                c += np.abs(mv).sum()
                if m > 1 and (np.all(mv > 0) or np.all(mv < 0)): c += 2.0
            c += 3.0 * int(np.sum(np.diff(v) == 1))  # no semitone rubs between adjacent voices  # avoid all voices moving together
            if c < bc: best, bc = v, c
        out.append(best); prev = best
    return out


def progression(mood, tonic, mode=None, variant=0, bars=4):
    """Returns list of chords: dict(pcs, root, voicing, bass) for `bars` chords."""
    mood = {"discovery": "wonder", "bright": "wonder"}.get(mood, mood)
    mode = mode or MOOD_MODE[mood]
    pat = PROGRESSIONS[mood][variant % len(PROGRESSIONS[mood])]
    chords = [chord_pcs(tonic, mode, d, c) for d, c in pat]
    seq = [chords[i % len(chords)] for i in range(bars)]
    vl = voice_lead([pcs for pcs, _ in seq])
    out = []
    for (pcs, root), v in zip(seq, vl):
        bass = 36 + (root - 36) % 12  # C2..B2
        if bass > 43: bass -= 12  # keep the bass between G1 and G2
        out.append(dict(pcs=pcs, root=root, voicing=v, bass=bass))
    return out, mode
