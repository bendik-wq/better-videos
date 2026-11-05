"""Edit spec for Josh's 30 Oct talk (DJI 0021, "Buy from a motivated seller").  python3 mkspec.py <words.json> > spec.json
Long form: the whole talk, pauses over 1 s cut, swearing kept. Clips: four 2-2.5 min vertical cuts, no swearing."""
import json, sys
W = [x for s in json.load(open(sys.argv[1])) for x in s["words"]]
def idx(t0, t1, word, near):  # index (within the clip t0..t1) of `word` starting near `near`
    ws = [x for x in W if t0 - 0.01 <= x[1] <= t1 + 0.01]
    return str(next(i for i, x in enumerate(ws) if x[0].startswith(word) and abs(x[1] - near) < 0.3))
two = lambda a, b: {idx(a, b, "200", 468.8): "two 100", idx(a, b, "of", 470.86): ""}  # "I've done two 100% vendor finance deals"
FINE = "G&amp;L M&amp;A Advisory · link in bio. Not financial advice; every deal is different."
clips = {
  "lf": {"t": [2.62, 566.38], "dropt": [[549.8, 551.3]], "rename": two(2.62, 566.38)},
  "c1": {"t": [2.62, 137.85], "drop": ["fucking"], "dropt": [[86.9, 89.9]]},
  "c2": {"t": [109.31, 264.31], "drop": ["bloody"]},
  "c3": {"t": [265.99, 414.64]},
  "c4": {"t": [418.04, 566.38], "dropt": [[463.0, 467.75], [547.0, 554.0]], "rename": two(418.04, 566.38)},
}
def clip(card):
    return {"layout": "vertical", "ns": "~cl", "gap": 0.9, "intro": False, "chapter": "Josh Li",
            "cards": {"end": {"eyebrow": "Josh's takeaway", "title": card, "cta": True, "dur": 4.0, "fine": FINE}}}
cuts = {
  "long": {"title": "Buy from a motivated seller (Josh, 30 Oct)", "layout": "split", "ns": "~lf", "gap": 1.0, "fps": 23.976,
           "intro": False, "cards": {}, "chapters": {"start": "Motivated sellers"},
           "chapterMarks": [[109.31, "Not a fire sale"], [139.45, "The silver tsunami"], [190.51, "Why they sell"], [230.54, "No money down"],
                            [266.2, "Sentimental value"], [363.68, "Private equity"], [413.48, "Staff walk out"], [456.54, "Vendor finance"],
                            [496.79, "The “impossible” deal"], [554.4, "Wrapping up"]],
           "base_sequence": [{"chapter": "Motivated sellers"}, "lf"]},
  "cl-1-motivated-seller": {**clip("Find the owner who <em>needs</em> to sell."), "base_sequence": ["c1"]},
  "cl-2-silver-tsunami": {**clip("Great business. <em>Ready to retire.</em>"), "base_sequence": ["c2"]},
  "cl-3-sentimental-value": {**clip("Owners price in <em>sentiment</em>."), "base_sequence": ["c3"]},
  "cl-4-100-vendor-finance": {**clip("100% vendor finance is <em>possible</em>."), "base_sequence": ["c4"]},
}
json.dump({"clips": clips, "cuts": cuts}, sys.stdout, indent=1)
