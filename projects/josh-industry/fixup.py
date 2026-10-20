"""Hand fixes on top of snap.py for clips the windowed re-transcription got wrong.
   python3 fixup.py <words.json> snapped.json"""
import json, sys
W = [x for seg in json.load(open(sys.argv[1])) for x in seg["words"]]
s = json.load(open(sys.argv[2]))


def from_words(t0, t1, pad_in=0.12, pad_out=0.25):
    """Clip from the full-file transcript between t0 and t1 (word start times)."""
    ws = [w for w in W if t0 <= w[1] <= t1]
    a, b = max(0.0, ws[0][1] - pad_in), ws[-1][2] + pad_out
    return {"in": round(a, 2), "out": round(b, 2), "snapped": True, "text": " ".join(w[0] for w in ws),
            "words": [[w[0], round(w[1] - a, 2), round(w[2] - a, 2)] for w in ws]}


s.pop("physio", None)
s["physio-a"] = from_words(209.6, 211.3)          # "And then fast forward a little bit,"
s["physio-p"] = from_words(217.7, 220.9)          # "pivoted to allied health, physiotherapy."
s["pivot-made"] = from_words(222.5, 223.44, pad_out=0.12)  # "As soon as I made that pivot," (stops before the swear)
s["archetype"] = from_words(379.6, 408.7)         # "It is difficult ... position to succeed,"
s["close"] = from_words(632.1, 648.3)             # "If you want to pick an industry ... success."
s["deal-c"] = from_words(311.0, 331.0)
# extra material for the long-form cut (industry-long)
s["greet"] = from_words(0.0, 3.08)                # "Good morning, friends and family ..."
s["hardsay"] = from_words(47.8, 53.01)            # "Whether you stay in your lane ... find out a little bit more."
s["bluecollar"] = from_words(113.1, 146.08)       # "Whereas if I went into more blue collar ... no juice for the other industries"
s["how-hc"] = from_words(146.7, 153.74)           # "How did I choose healthcare? ... I just went for it."
s["site"] = from_words(237.9, 244.1)              # "I went out to do a site visit ... signed that offer." (stops before the car-park swear)
s["partner"] = from_words(251.6, 261.77)          # "And at this time ... my current business partner ... how the world works."
s["why-work"] = from_words(331.7, 338.59)         # "But I guess going back to industry ... What made this all work?"
s["role"] = from_words(357.5, 362.4, pad_out=0.15)   # "But I think my role, it is the energy, it is the passion,"
s["acq"] = from_words(367.4, 376.2, pad_out=0.12)    # "And that's why ... playing the acquisitions game because it's not necessarily hard, right?"
s["pena"] = from_words(475.7, 498.84)             # Dan Pena's phone-book joke (swear dropped below)
s["rejected"] = from_words(500.2, 523.58, pad_out=0.12)  # "I went in ... rejected ... glad I made that pivot"
s["allied"] = from_words(533.7, 561.98, pad_out=0.15)    # "In physiotherapy ... we empower the person"
s["glad"] = from_words(626.8, 629.88)             # "I'm glad I came into physiotherapy ..."
# the whole talk, uncut, in chapter-sized pieces (industry-full); only long silences get trimmed
FULL = [(0.0, 53.1), (54.1, 153.8), (154.5, 232.5), (233.0, 331.0), (331.7, 409.3), (409.8, 475.0), (475.7, 523.7), (523.8, 649.0)]
for n, (t0, t1) in enumerate(FULL, 1):
    s[f"all-{n}"] = from_words(t0, t1)
for n in range(1, len(FULL)):  # neighbouring pieces meet halfway between their words: nothing doubled, nothing lost
    a, b = s[f"all-{n}"], s[f"all-{n + 1}"]
    mid = round((a["in"] + a["words"][-1][2] + b["in"] + b["words"][0][1]) / 2, 2)
    a["out"] = mid
    shift = mid - b["in"]
    b["in"] = mid
    b["words"] = [[w, round(x - shift, 2), round(y - shift, 2)] for w, x, y in b["words"]]            # one "Conversation got started.", not two
json.dump(s, open(sys.argv[2], "w"), indent=1)
for k in ("physio-a", "physio-p", "pivot-made", "archetype", "close", "deal-c"):
    print(k, s[k]["in"], s[k]["out"], "|", s[k]["text"][:90])

# Tighten: split clips at pauses longer than GAP into parts (id#1, id#2 ...), keeping ~0.2 s
# either side of each cut. Writes the expanded sequence into clips.json as cuts.industry.sequence.
GAP = 1.4
# word indexes (inclusive ranges) to cut out of a base clip: stammers and restarts
DROP = {"gp": [(0, 0)], "christian": [(14, 18), (27, 39)],
        "bluecollar": [(9, 13)], "pena": [(30, 30)]}  # a repeated phrase; a swear
RENAME = {("christian", 45): "",  # whisper's "II" in "trade II background"
          ("deal-b", 0): "This", ("gp", 1): "It's", ("gp-b", 0): "And"}  # parts that open a caption line
c = json.load(open("clips.json"))
used = set()
for cut in c["cuts"].values():
  base = cut.setdefault("base_sequence", cut["sequence"])
  gap = cut.get("gap", GAP)
  seq = []
  for item in base:
      if not isinstance(item, str):
          seq.append(item)
          continue
      clip = s[item]
      drop = {i for a, b in DROP.get(item, []) for i in range(a, b + 1)}
      ws = [[RENAME.get((item, i), "" if w == "II" else w), clip["in"] + a, clip["in"] + b, i] for i, (w, a, b) in enumerate(clip["words"])]
      parts, cur = [], []
      for w in ws:
          if w[3] in drop:
              if cur: parts.append(cur); cur = []
              continue
          if cur and (w[1] - cur[-1][2] > gap or w[3] != cur[-1][3] + 1):
              parts.append(cur); cur = []
          cur.append(w)
      if cur: parts.append(cur)
      for n, p in enumerate(parts):
          i0, i1 = p[0][3], p[-1][3]
          # pad 0.2 s into a cut, but never into the neighbouring (possibly dropped) word
          a = max(clip["in"], p[0][1] - 0.6) if i0 == 0 else max(p[0][1] - 0.2, ws[i0 - 1][2] + 0.03)
          b = min(clip["out"], p[-1][2] + 0.6) if i1 == len(ws) - 1 else min(p[-1][2] + 0.2, ws[i1 + 1][1] - 0.03)
          pid = f"{item}{cut.get('ns', '')}#{n + 1}"  # parts never overwrite the snapped originals; ns keeps differently-split cuts apart
          s[pid] = {"in": round(a, 2), "out": round(b, 2), "snapped": True, "text": " ".join(w[0] for w in p),
                    "words": [[w[0], round(w[1] - a, 2), round(w[2] - a, 2)] for w in p]}
          seq.append(pid)
  cut["sequence"] = seq
  used.update(x for x in seq if isinstance(x, str))
# hand-set cut points (source seconds) where word timings were too loose, checked against the waveform
# (lo, hi, out, in): a part ending inside lo..hi ends at `out`; one starting inside it starts at `in`
EDGE = [(486.4, 487.4, 486.58, 487.22)]  # Dan Pena line: the swear sits at 486.62-487.18
for pid in used:
    if "#" not in pid or "all-" in pid:
        continue
    for lo, hi, e_out, e_in in EDGE:
        if lo < s[pid]["out"] < hi:
            s[pid]["out"] = e_out
        if lo < s[pid]["in"] < hi:
            shift = e_in - s[pid]["in"]
            s[pid]["in"] = e_in
            s[pid]["words"] = [[w, round(max(0, a - shift), 2), round(b - shift, 2)] for w, a, b in s[pid]["words"]]
json.dump(c, open("clips.json", "w"), indent=1)
s = {k: v for k, v in s.items() if '#' not in k or k in used}
json.dump(s, open(sys.argv[2], "w"), indent=1)
for name, cut in c["cuts"].items():
    parts = [x for x in cut["sequence"] if isinstance(x, str)]
    print(f"{name}: {len(parts)} parts, {sum(s[x]['out'] - s[x]['in'] for x in parts):.1f}s of speech")
