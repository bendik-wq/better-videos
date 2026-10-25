"""Turn an edit spec into clips.json + snapped.json for a talking-head recording (same format timeline.mjs reads).

    python3 mkparts.py <words.json> <audio-16k.wav> <spec.json> <project-dir>

words.json is the full-file transcript from tx.py ([{words: [[w, start, end], ...]}, ...]).
spec.json:
  {"clips": {"id": {"t": [first_word_start, last_word_start], "drop": ["fucking", ...], "dropt": [[t0, t1], ...],
                    "rename": {"word index": "New"}, "tight": true}},
   "cuts":  {"name": {..., "base_sequence": ["id", {"chapter": "..."}, {"card": "..."}],
                     "split": false | "gap": 0.9, "ns": "~ig"}}}

drop: words removed wherever they occur in the clip (matched without punctuation, case-insensitive).
dropt: source-time ranges removed. Every cut is placed at the quietest 10 ms in the gap between the
kept and the dropped word (whisper's word edges are loose), so no fragment of a dropped word survives.
split false keeps a clip whole (continuous long forms); otherwise clips split at removed words and at
pauses longer than `gap` (Reels pacing), each part padded 0.2 s but never into a neighbouring word.
"""
import json
import os
import re
import sys
import wave

import numpy as np

words_path, wav_path, spec_path, proj = sys.argv[1:5]
W = [x for seg in json.load(open(words_path)) for x in seg["words"]]
w = wave.open(wav_path)
RATE = w.getframerate()
AUDIO = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
spec = json.load(open(spec_path))
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())


def quietest(a, b):
    """Source time of the quietest 10 ms window between a and b (falls back to the midpoint)."""
    if b - a < 0.02:
        return (a + b) / 2
    x = AUDIO[int(a * RATE):int(b * RATE)]
    n = int(0.01 * RATE)
    if len(x) < n:
        return (a + b) / 2
    e = np.convolve(x * x, np.ones(n) / n, "valid")
    return a + (int(np.argmin(e)) + n / 2) / RATE


snapped, used = {}, set()
for cid, c in spec["clips"].items():
    t0, t1 = c["t"]
    ws = [list(x) for x in W if t0 - 0.01 <= x[1] <= t1 + 0.01]
    if not ws:
        raise SystemExit(f"{cid}: no words in {t0}-{t1}")
    for i, name in c.get("rename", {}).items():
        ws[int(i)][0] = name
    drop = {norm(d) for d in c.get("drop", [])}
    keep = [not (norm(x[0]) in drop or any(a <= x[1] < b for a, b in c.get("dropt", []))) for x in ws]
    snapped[cid] = {"words_abs": ws, "keep": keep}


def part(ws, i0, i1, first, last):
    """One continuous piece of a clip: words i0..i1 (all kept). Edges sit in silence."""
    if first:
        a = max(0.0, ws[i0][1] - 0.15)
    else:
        a = quietest(max(ws[i0 - 1][2] - 0.05, ws[i0][1] - 0.6), ws[i0][1] + 0.02)
    if last:
        b = ws[i1][2] + 0.3
    else:
        b = quietest(ws[i1][2] - 0.02, min(ws[i1 + 1][1] + 0.05, ws[i1][2] + 0.6))
    return {"in": round(a, 3), "out": round(b, 3), "snapped": True, "text": " ".join(x[0] for x in ws[i0:i1 + 1]),
            "words": [[x[0], round(max(0.0, x[1] - a), 3), round(x[2] - a, 3)] for x in ws[i0:i1 + 1]]}


out = {}
clips_json = {"clips": {k: {"t": v["t"]} for k, v in spec["clips"].items()}, "cuts": {}}
for name, cut in spec["cuts"].items():
    cut = dict(cut)
    seq = []
    for item in cut["base_sequence"]:
        if not isinstance(item, str):
            seq.append(item)
            continue
        ws, keep = snapped[item]["words_abs"], snapped[item]["keep"]
        n = len(ws)
        if cut.get("split") is False:
            if not all(keep):
                raise SystemExit(f"{item}: continuous clips can't drop words; split the clip instead")
            if spec["clips"][item].get("tight"):
                # tight: both edges at the quietest point next to the neighbouring words (short excerpts,
                # e.g. long-form teasers), so no sliver of the word before or after survives
                i = next(j for j, x in enumerate(W) if abs(x[1] - ws[0][1]) < 1e-6)
                ext = [list(W[max(0, i - 1)])] + ws + [list(W[min(len(W) - 1, i + n)])]
                out[item] = part(ext, 1, n, False, False)
            else:
                out[item] = part(ws, 0, n - 1, True, True)
            seq.append(item)
            continue
        gap = cut.get("gap", 1.4)
        runs, cur = [], []
        for i in range(n):
            if not keep[i]:
                if cur: runs.append(cur); cur = []
                continue
            if cur and ws[i][1] - ws[cur[-1]][2] > gap:
                runs.append(cur); cur = []
            cur.append(i)
        if cur: runs.append(cur)
        for k, r in enumerate(runs, 1):
            pid = f"{item}{cut.get('ns', '')}#{k}"
            out[pid] = part(ws, r[0], r[-1], r[0] == 0, r[-1] == n - 1)
            seq.append(pid)
    cut["sequence"] = seq
    clips_json["cuts"][name] = cut
    used.update(x for x in seq if isinstance(x, str))

# hand-set cut points where whisper's word timing was off (checked against the waveform):
# spec["edge"] = [[lo, hi, out, in]]: a part ending inside lo..hi ends at `out`; one starting inside it starts at `in`
for lo, hi, e_out, e_in in spec.get("edge", []):
    for pid, p in out.items():
        if lo < p["out"] < hi:
            p["out"] = e_out
        if lo < p["in"] < hi:
            shift = e_in - p["in"]
            p["in"] = e_in
            p["words"] = [[w, round(max(0, a - shift), 3), round(b - shift, 3)] for w, a, b in p["words"]]

os.makedirs(proj, exist_ok=True)
json.dump(clips_json, open(os.path.join(proj, "clips.json"), "w"), indent=1)
json.dump(out, open(os.path.join(proj, "snapped.json"), "w"), indent=1)
for name, cut in clips_json["cuts"].items():
    ps = [x for x in cut["sequence"] if isinstance(x, str)]
    print(f"{name}: {len(ps)} parts, {sum(out[p]['out'] - out[p]['in'] for p in ps):.1f}s")
