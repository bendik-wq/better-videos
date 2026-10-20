"""Hand fixes on top of snap.py for clips the windowed re-transcription got wrong.
   python3 fixup.py <words.json> snapped.json"""
import json, sys
W = [x for seg in json.load(open(sys.argv[1])) for x in seg["words"]]
s = json.load(open(sys.argv[2]))


def from_words(t0, t1, pad_in=0.12, pad_out=0.25):
    """Clip from the full-file transcript between t0 and t1 (word start times)."""
    ws = [w for w in W if t0 <= w[1] <= t1]
    a, b = ws[0][1] - pad_in, ws[-1][2] + pad_out
    return {"in": round(a, 2), "out": round(b, 2), "snapped": True, "text": " ".join(w[0] for w in ws),
            "words": [[w[0], round(w[1] - a, 2), round(w[2] - a, 2)] for w in ws]}


s.pop("physio", None)
s["physio-a"] = from_words(209.6, 211.3)          # "And then fast forward a little bit,"
s["physio-p"] = from_words(217.7, 220.9)          # "pivoted to allied health, physiotherapy."
s["pivot-made"] = from_words(222.5, 223.44, pad_out=0.12)  # "As soon as I made that pivot," (stops before the swear)
s["archetype"] = from_words(379.6, 408.7)         # "It is difficult ... position to succeed,"
s["close"] = from_words(632.1, 648.3)             # "If you want to pick an industry ... success."
s["deal-c"] = from_words(311.0, 331.0)            # one "Conversation got started.", not two
json.dump(s, open(sys.argv[2], "w"), indent=1)
for k in ("physio-a", "physio-p", "pivot-made", "archetype", "close", "deal-c"):
    print(k, s[k]["in"], s[k]["out"], "|", s[k]["text"][:90])

# Tighten: split clips at pauses longer than GAP into parts (id#1, id#2 ...), keeping ~0.2 s
# either side of each cut. Writes the expanded sequence into clips.json as cuts.industry.sequence.
GAP = 1.4
# word indexes (inclusive ranges) to cut out of a base clip: stammers and restarts
DROP = {"gp": [(0, 0)], "christian": [(14, 18), (27, 39)]}
RENAME = {("christian", 45): "",  # whisper's "II" in "trade II background"
          ("deal-b", 0): "This", ("gp", 1): "It's", ("gp-b", 0): "And"}  # parts that open a caption line
c = json.load(open("clips.json"))
base = c["cuts"]["industry"].setdefault("base_sequence", c["cuts"]["industry"]["sequence"])
seq = []
for item in base:
    if not isinstance(item, str):
        seq.append(item)
        continue
    clip = s[item]
    drop = {i for a, b in DROP.get(item, []) for i in range(a, b + 1)}
    ws = [[RENAME.get((item, i), w), clip["in"] + a, clip["in"] + b, i] for i, (w, a, b) in enumerate(clip["words"])]
    parts, cur = [], []
    for w in ws:
        if w[3] in drop:
            if cur: parts.append(cur); cur = []
            continue
        if cur and (w[1] - cur[-1][2] > GAP or w[3] != cur[-1][3] + 1):
            parts.append(cur); cur = []
        cur.append(w)
    if cur: parts.append(cur)
    for n, p in enumerate(parts):
        a = clip["in"] if n == 0 and p[0][3] == 0 else p[0][1] - 0.2
        b = clip["out"] if n == len(parts) - 1 and p[-1][3] == len(ws) - 1 else p[-1][2] + 0.2
        pid = f"{item}#{n + 1}"  # parts never overwrite the snapped originals
        s[pid] = {"in": round(a, 2), "out": round(b, 2), "snapped": True, "text": " ".join(w[0] for w in p),
                  "words": [[w[0], round(w[1] - a, 2), round(w[2] - a, 2)] for w in p]}
        seq.append(pid)
c["cuts"]["industry"]["sequence"] = seq
json.dump(c, open("clips.json", "w"), indent=1)
s = {k: v for k, v in s.items() if '#' not in k or k in seq}
json.dump(s, open(sys.argv[2], "w"), indent=1)
print(f"{sum(1 for x in seq if isinstance(x, str))} parts, {sum(s[x]['out'] - s[x]['in'] for x in seq if isinstance(x, str)):.1f}s of speech")
