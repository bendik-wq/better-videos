"""Intro variations for the 26 Oct long form, as short preview timelines.  python3 build.py <out-dir>"""
import json, sys, html
P = "/home/user/better-videos/projects/josh-oct26"; out = sys.argv[1]
T = json.load(open(f"{P}/timeline-long.json")); SN = json.load(open(f"{P}/snapped.json"))
FPS = T["fps"]; seg = {s.get("id", s.get("name")): s for s in T["segments"]}
q = lambda x: round(x * FPS) / FPS   # keep every boundary on a frame
DARK = "radial-gradient(1500px 900px at 50% 45%, #0e1834 0%, #060a14 62%, #03050a 100%)"

def cold_html():
    # the quote lands word by word as Josh says it; the money words in gold italic
    ws = SN["tz-1"]["words"]; gold = {7, 8, 15, 16}
    spans = []
    for i, (w, a, b) in enumerate(ws):
        t = html.escape(w.rstrip(","))
        if i == len(ws) - 1: t += "."
        st = "display:inline-block" + (";color:var(--gold);font-style:italic" if i in gold else "")
        spans.append(f'<span data-fx="slam" data-d="{max(0, a - 0.02):.2f}" style="{st}">{t}</span>')
    return ('<div class="ttl" style="font-size:112px;line-height:1.08;max-width:1560px">' + " ".join(spans) + '</div>')

def title_html():
    words = ["Why", "organic", "growth", "<em>won't</em>", "<em>get</em>", "<em>you</em>", "<em>past</em>", "<em>$10M.</em>"]
    sp = " ".join(f'<span data-fx="slam" data-d="{0.25 + i * 0.16:.2f}" style="display:inline-block">{w}</span>' for i, w in enumerate(words))
    return ('<div class="num" data-d="0.05" style="letter-spacing:.2em;text-transform:uppercase;color:var(--gold)">Josh Li · buying businesses</div>'
            f'<div class="ttl" style="font-size:150px;line-height:1.0">{sp}</div><div class="rule"></div>'
            '<div class="poster" data-d="1.9"><div class="av">JL</div><div><b>Josh Li</b>Founder, JC Health Group</div></div>')

def build(name, items, main_len):
    segs, beats, caps, chaps, t = [], [], [], [], 0.0
    for it in items:
        if it[0] == "card":
            _, nm, dur, h, bg = it
            segs.append({"kind": "card", "name": nm, "t0": t, "t1": q(t + dur), "html": h, "fine": "", **({"bg": bg} if bg else {})}); t = q(t + dur); continue
        _, sid, extra = it; o = seg[sid]; d = o["t1"] - o["t0"]
        if sid == "lf-1": d = main_len
        n = dict(o, t0=t, t1=q(t + d), **extra)
        if sid == "lf-1": n["out"] = n["in"] + (n["t1"] - t); chaps.append({"name": "The organic trap", "t0": t})
        sh = t - o["t0"]
        if not extra.get("noface"):
            beats += [dict(b, t0=b["t0"] + sh, t1=min(b["t1"] + sh, n["t1"])) for b in T["beats"] if b.get("clip") == sid and b["t0"] + sh < n["t1"]]
            caps += [dict(c, t0=c["t0"] + sh, t1=min(c["t1"] + sh, n["t1"]), words=[[w[0], w[1] + sh, w[2] + sh, *w[3:]] for w in c["words"]])
                     for c in T["captions"] if o["t0"] <= c["t0"] < o["t1"] and c["t0"] + sh < n["t1"]]
        segs.append(n); t = n["t1"]
    if segs[0].get("id") != "lf-1": chaps.insert(0, {"name": "Coming up", "t0": 0})
    tl = dict(T, segments=segs, beats=beats, captions=caps, chapters=chaps, duration=t)
    json.dump(tl, open(f"{out}/{name}.json", "w")); print(name, round(t, 1), [(s.get("id", s.get("name")), round(s["t0"], 1)) for s in segs])

intro, cred = seg["intro"], seg["cred"]
card = lambda s: ("card", s["name"], s["t1"] - s["t0"], s["html"], None)
cold = ("clip", "tz-1", {"html": cold_html(), "noface": True, "bg": "#04060c"})
dtitle = ("card", "intro", 4.0, title_html(), DARK)
build("A-current", [("clip", f"tz-{i}", {}) for i in range(1, 6)] + [card(intro), card(cred), ("clip", "lf-1", {})], 25)
build("B-dramatic", [cold] + [("clip", f"tz-{i}", {}) for i in range(2, 6)] + [dtitle, card(cred), ("clip", "lf-1", {})], 25)
build("C-cold-open", [cold, dtitle, card(cred), ("clip", "lf-1", {})], 25)
build("D-no-intro", [("clip", "lf-1", {})], 35)
