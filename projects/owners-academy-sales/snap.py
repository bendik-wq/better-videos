"""Snap each clip in clips.json to word boundaries.

Re-transcribes each clip window with word timestamps (faster-whisper) and finds the
start/end phrases, so cuts land between words instead of mid-sentence.

    python3 snap.py <16k-mono.wav> clips.json snapped.json [clip-id ...]   # ids: re-snap only these
"""
import difflib
import json
import re
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

PAD = 4.0  # seconds of context either side of the rough window


def secs(ts):
    h, m, s = map(int, ts.split(":"))
    return h * 3600 + m * 60 + s


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower().replace("’", "'"))


def find(words, phrase, last):
    """Index range of the best match for `phrase` in `words` (earliest, or latest if last)."""
    target = " ".join(norm(w) for w in phrase.split())
    n = len(phrase.split())
    best = None
    for size in (n - 1, n, n + 1):
        if size < 1:
            continue
        for i in range(len(words) - size + 1):
            cand = " ".join(norm(w.word) for w in words[i:i + size])
            r = difflib.SequenceMatcher(None, cand, target).ratio()
            if r < 0.8:
                continue
            key = (round(r, 2), i if last else -i)
            if best is None or key > best[0]:
                best = (key, i, i + size - 1, r)
    return best


def main(wav_path, spec_path, out_path, *only):
    w = wave.open(wav_path)
    rate = w.getframerate()
    audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    spec = json.load(open(spec_path))
    model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
    try:
        out = json.load(open(out_path)) if only else {}
    except FileNotFoundError:
        out = {}
    for cid, c in spec["clips"].items():
        if only and cid not in only:
            continue
        lo = max(0.0, secs(c["from"]) - PAD)
        hi = secs(c["to"]) + PAD
        segs, _ = model.transcribe(audio[int(lo * rate):int(hi * rate)], beam_size=5,
                                   word_timestamps=True, vad_filter=False)
        words = [wd for s in segs for wd in s.words]
        a = find(words, c["start"], last=False)
        b = find(words, c["end"], last=True)
        if not a or not b or b[2] < a[1]:
            print(f"!! {cid}: no match (start={bool(a)}, end={bool(b)}); using rough window", flush=True)
            out[cid] = {"in": secs(c["from"]), "out": secs(c["to"]), "snapped": False, "text": ""}
            continue
        i, j = a[1], b[2]
        t_in = lo + words[i].start - 0.12
        t_out = lo + words[j].end + 0.30
        text = "".join(wd.word for wd in words[i:j + 1]).strip()
        rel = [[wd.word.strip(), round(lo + wd.start - t_in, 2), round(lo + wd.end - t_in, 2)]
               for wd in words[i:j + 1]]
        out[cid] = {"in": round(t_in, 2), "out": round(t_out, 2), "snapped": True,
                    "match": [round(a[3], 2), round(b[3], 2)], "text": text, "words": rel}
        print(f"ok {cid}: {t_in:.1f}-{t_out:.1f} ({t_out - t_in:.0f}s) match={a[3]:.2f}/{b[3]:.2f}", flush=True)
    json.dump(out, open(out_path, "w"), indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:])
