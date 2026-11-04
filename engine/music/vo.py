"""Narration prosody planning and the documentary voice chain (used by engine/voice.py).

Markup in VO text (stripped from captions/word timings automatically):
  *word* or *a few words*   emphasis: Kokoro honours vowel length in its phoneme input, so the
                            stressed vowel (whole diphthong) of each emphasised word is lengthened
                            (measured: +8-25% word duration, slightly higher F0 peak; subtle). CAPS and asterisks do NOT work
                            (asterisks are read aloud as "asterisk"), which is why this exists.
  > at the start of a line  a reveal: that line is spoken slower (speed x revealSlow)
  |                         an explicit beat (pause) mid-sentence
  line break / blank line   pause (line / paragraph)

Pauses (seconds, tuned to documentary narration pacing; override with voice.pauses):
  sentence .  0.38   question ?  0.45   exclamation !  0.38   ellipsis … / ...  0.65
  colon :     0.32   em-dash —   0.24   beat |  0.35   line break  0.55   paragraph  0.9
Dynamic speed: reveals (short line after a colon/dash/question, explicit >, or a short final
line) x0.90; lines that carry numbers x0.95; questions x0.97.
"""
import re
import numpy as np

PAUSES = {".": 0.38, "?": 0.45, "!": 0.38, "…": 0.65, ":": 0.32, "—": 0.24, "|": 0.35, "\n": 0.55, "\n\n": 0.9, "": 0.0}
MARK = re.compile(r"[*|>]")


def strip_markup(text):
    t = re.sub(r"(^|\n)\s*>\s*", r"\1", text)
    t = t.replace("*", "").replace(" | ", " ").replace("|", " ")
    return re.sub(r"[ \t]+", " ", t).strip()


def split_units(text):
    """-> [(unit text, pause after, flags)] where flags has reveal/question/numeric/emph."""
    text = text.replace("...", "…").replace(" -- ", " — ").replace("--", "—")
    # protect abbreviation dots (U.S., Mr., St.) from the sentence splitter
    text = re.sub(r"\b(?:[A-Za-z]\.){2,}", lambda m: m.group(0).replace(".", "\u2024"), text)
    text = re.sub(r"\b(Mr|Mrs|Ms|Dr|St|vs|etc|Inc|Ltd|Co|No|Jr|Sr|Gen|Adm|Lt|Col|Capt)\.", "\\1\u2024", text)
    paras = re.split(r"\n\s*\n", text.strip())
    units = []
    for pi, para in enumerate(paras):
        lines = [l for l in para.split("\n") if l.strip()]
        for li, line in enumerate(lines):
            explicit_reveal = line.lstrip().startswith(">")
            line = line.lstrip().lstrip(">").strip()
            # sentence / colon / dash / beat boundaries; punctuation stays with the unit
            parts = re.split(r"(?<=[.!?…:])[\"”’)]?\s+(?=\S)|\s*—\s*|\s*\|\s*", line)
            seps = re.findall(r"(?<=[.!?…:])[\"”’)]?\s+(?=\S)|\s*—\s*|\s*\|\s*", line)
            for k, p in enumerate(parts):
                p = p.strip()
                if not p: continue
                if k < len(seps):
                    sp = seps[k].strip()
                    if sp == "—": end = "—"
                    elif sp == "|": end = "|"
                    else: end = p[-1] if p[-1] in ".!?…:" else "."
                else:
                    end = ("\n\n" if pi < len(paras) - 1 else "") if li == len(lines) - 1 else "\n"
                    if end == "" and p[-1] in ".!?…": end = ""
                units.append(dict(text=p.replace("\u2024", "."), end=end, reveal=explicit_reveal, last_char=p[-1]))
    # flags
    for i, u in enumerate(units):
        words = len(u["text"].split())
        prev = units[i - 1] if i else None
        u["question"] = u["text"].rstrip().endswith("?")
        u["numeric"] = bool(re.search(r"\d|\$|%|\b(percent|hundred|thousand|million|billion|trillion|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|half|third|quarter|fifth)\b", u["text"], re.I))
        if prev is not None and words <= 7 and prev["end"] in (":", "—", "?"):
            u["reveal"] = True
        if i == len(units) - 1 and i > 0 and words <= 6:
            u["reveal"] = True
    return units


def unit_speed(u, base, reveal_slow=0.9):
    s = base
    if u["reveal"]: s *= reveal_slow
    elif u["numeric"]: s *= 0.95
    if u["question"]: s *= 0.97
    return float(np.clip(s, 0.5, 2.0))


def unit_pause(u, pauses=None):
    P = dict(PAUSES, **(pauses or {}))
    e = u["end"]
    if e in ("", None): return 0.0
    if e in ".!?…:" and len(e) == 1: return P.get(e, P["."])
    return P.get(e, 0.3)


def emphasise(phonemes_of, text, lang):
    """Phonemize `text`, lengthening the primary-stressed vowel of every *word*."""
    marked = re.findall(r"\*([^*]+)\*", text)
    plain = text.replace("*", "")
    P = phonemes_of(plain, lang)
    for span in marked:
        for w in span.split():
            wp = phonemes_of(w, lang).strip().rstrip(".,!?;:")
            if not wp or wp not in P: continue
            # the stressed vowel, with its diphthong glide if it has one (aɪ, eɪ, oʊ, aʊ, ɔɪ):
            # lengthening the first half of a diphthong breaks the word ("overnight" -> "over now")
            m = re.search(r"ˈ([^\sˈˌ]*?)([aeiouæɑɒɔəɛɜɪʊʌɐᵻ])([ɪʊə]?)(ː?)", wp)
            if not m or m.group(4): continue
            new = wp[: m.end(3)] + "ː" + wp[m.end(3):]
            P = P.replace(wp, new, 1)
    return P


# ------------------------------------------------------------------ voice chain
def chain(x, sr=48000, room=0.06, target_lufs=-19.0, deess=True):
    """Documentary VO chain at 48 kHz: HPF, de-box, presence, air, split-band de-esser,
    2.5:1 compression, a subtle small room, per-line loudness normalisation, peak safety."""
    from . import dsp
    assert sr == dsp.SR
    x = np.asarray(x, float)
    x = dsp.hp(dsp.hp(x, 75, 0.7), 75, 0.7)                    # 24 dB/oct rumble cut
    x = dsp.eq(x, [("peak", 260, -1.5, 1.0),                   # boxiness
                   ("peak", 3200, 2.0, 0.9),                   # presence / intelligibility
                   ("highshelf", 9500, 1.0, 0.7)])             # air (Kokoro has little above 11 kHz)
    if deess:
        x = deesser(x)
    x, _ = dsp.compress(x, thresh_db=-24, ratio=2.5, attack=0.008, release=0.12, knee=6, rms=0.01)
    if room > 0:  # let the room ring out (150 ms) instead of truncating its tail
        x = dsp.reverb(np.concatenate([x, np.zeros(int(0.15 * sr))]), "room", room, seed=11).mean(1)
    x = dsp.hp(x, 60)
    I = dsp.loudness(x)["integrated"]
    if I > -70: x = x * dsp.undb(target_lufs - I)
    x = dsp.limit(x, -3.0, lookahead=0.003, release=0.05)  # catch plosive/onset peaks
    return dsp.fade(x, 0.005, 0.03)  # files start and end at exactly zero


def deesser(x, f=5000.0, thresh_rel_db=-8.0, ratio=4.0, max_db=8.0):
    """Split-band de-esser: the band above `f` is turned down when it gets within `thresh_rel_db`
    of the full-band level (sibilants), by up to `max_db`."""
    from . import dsp
    from scipy import signal as ss
    sos_l = ss.butter(2, f, "low", fs=dsp.SR, output="sos"); sos_h = ss.butter(2, f, "high", fs=dsp.SR, output="sos")
    lo = ss.sosfilt(np.concatenate([sos_l, sos_l]), x); hi = ss.sosfilt(np.concatenate([sos_h, sos_h]), x)
    # LR4 sum is an all-pass; re-sum after gain
    eh = dsp.db(dsp.rms_env(hi, 0.005)); ea = dsp.db(dsp.rms_env(x, 0.02))
    over = eh - (ea + thresh_rel_db)
    gr = np.clip(over * (1 - 1 / ratio), 0, max_db)
    gr = dsp.smooth(gr, 0.002, 0.06)
    return lo + hi * dsp.undb(-gr)
