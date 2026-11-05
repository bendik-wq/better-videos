"""Edit spec for the 30 Oct "launch-style" cut: ~1:40, sentences pulled into the launch arc (hook, who, problem,
insight, the opportunity, proof, button). python3 mkspec.py <words.json> > spec.json"""
import json, re, sys
W = [x for s in json.load(open(sys.argv[1])) for x in s["words"]]
n = lambda w: re.sub(r"[^a-z0-9%']", "", w.lower())
def span(start, end, near):  # [first word start, last word start] of the first "start ... end" near `near`
    s, e = start.split(), end.split()
    for i in range(len(W)):
        if abs(W[i][1] - near) < 25 and all(n(W[i + k][0]) == n(s[k]) for k in range(len(s))):
            for j in range(i, len(W)):
                if all(n(W[j + k][0]) == n(e[k]) for k in range(len(e))):
                    return [W[i][1], W[j + len(e) - 1][1]]
    raise SystemExit(f"not found: {start} … {end}")
def rng(phrase, near):  # source range covering a phrase, for dropt
    a, b = span(phrase, phrase.split()[-1], near) if len(phrase.split()) > 1 else span(phrase, phrase, near)
    e = next(x[2] for x in W if abs(x[1] - b) < 1e-6)
    return [a - 0.01, e]
C = {
  "hook":    {"t": span("most people who teach", "a scam", 482), "dropt": [rng("who are in acquisitions,", 484)]},
  "done":    {"t": span("i'm saying this as", "the deals", 505)},
  "type":    {"t": span("the type of person", "motivated seller", 5)},
  "nine":    {"t": span("nine out of ten", "deal with", 55)},
  "one":     {"t": span("that one out of ten", "need to sell", 63)},
  "fire":    {"t": span("i'm not looking for", "fire sale", 118)},
  "tsunami": {"t": span("i'm talking about right now", "silver tsunami", 140)},
  "retire":  {"t": span("there's a lot of owners", "ready to retire", 156)},
  "great":   {"t": span("but their businesses are great", "they're fine", 162)},
  "only":    {"t": span("and only these types", "money down deals", 250)},
  "999":     {"t": span("it's not only", "these people", 255)},
  "reality": {"t": span("and yeah you create", "own reality", 497)},
  "mentor":  {"t": span("when i showed it", "billionaire mentor", 516)},
  "first":   {"t": span("my first ever deal", "for myself", 520), "dropt": [rng("from", 525.9)]},
  "amazing": {"t": span("amazing", "before", 528)},
  "career":  {"t": span("this is a guy", "corporate finance", 535)},
  "button":  {"t": span("motivated seller", "upwards", 563)},
}
FINE = "G&amp;L M&amp;A Advisory. Not financial advice; every deal is different."
cuts = {"launch": {"title": "Buy from a motivated seller (launch cut)", "layout": "split", "ns": "~ln", "gap": 0.45, "fps": 23.976,
                   "intro": False, "chapter": "Josh Li",
                   "cards": {"end": {"eyebrow": "G&amp;L M&amp;A Advisory", "title": "Comment <em>DEAL</em> for the breakdown.", "dur": 4.0, "fine": FINE}},
                   "base_sequence": list(C)}}
json.dump({"clips": C, "cuts": cuts}, sys.stdout, indent=1)
