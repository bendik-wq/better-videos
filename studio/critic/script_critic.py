#!/usr/bin/env python3
"""Script critic: scores a narration script for retention before anything is rendered.

Input: a markdown script. Narration is every non-empty line that isn't a heading, comment or table.
Optional annotations (recommended, format from docs/research/emotional-engine.md):
  <!-- beat: <name> | emotion: <word> <1-5> | open: L1,L2 | close: L0 -->   placed above a beat's lines
Without annotations the critic falls back to text heuristics.

Checks (each 0-100, weighted into a total):
  hook       first 15 s: concrete number/name, stakes, a question or contradiction, no throat-clearing
  rehooks    a curiosity device (question, "but", "until", reveal words, open loop) at least every 40 s
  loops      every opened loop is closed, none stays open > 6 min (except L1, the spine question that runs the whole video), something is always open until the end
  emotion    a peak (intensity >= 4) at least every 3 min, no flat stretch > 90 s, the biggest peak in the last third
  rhythm     spoken pace 140-165 wpm, sentence length varies, few sentences > 25 words (TTS-safe)
  specifics  numbers, names, places and dates per minute
Usage: python3 studio/critic/script_critic.py script.md [--wpm 150] [--json out.json]
"""
import argparse, json, re, statistics, sys

DEVICES = re.compile(r"↺|\?|\b(but|until|except|yet|instead|turns out|it turns out|here's the thing|the problem|nobody|no one|secret|why|what happened|what nobody|the catch|and then|which means|so what|the real|wasn't|never|suddenly|only one|one detail|one problem|remember)\b", re.I)
THROAT = re.compile(r"^(in this video|today we|hey|hi |welcome|before we (start|begin)|don't forget|let's (talk|dive|get))", re.I)
STAKES = re.compile(r"\b(billion|million|trillion|dead|died|killed|lost|stole|stolen|collapse|ruin|bankrupt|war|prison|fraud|crash|never|everything|nobody|secret|warning|biggest|largest|first|last)\b", re.I)
NUM = re.compile(r"\$?\b\d[\d,.]*\s?(%|percent|million|billion|trillion|k|m|bn)?\b|\b(?:(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundred|thousand|million|billion|trillion|half|third|first|second)\b", re.I)
NAME = re.compile(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b")
LEX = {  # tiny arousal lexicon for unannotated scripts: word -> intensity
    5: "dead died killed stolen vanished collapse exploded catastrophe terrified betrayed shocking impossible",
    4: "billion hacked fraud crash warning secret danger panic chase trapped desperate furious ruin",
    3: "million risk problem strange mystery suspicious race fight lie lied wrong pressure",
}
LEXW = {w: i for i, ws in LEX.items() for w in ws.split()}


def parse(md):
    beats, cur = [], {"name": "start", "emotion": None, "intensity": None, "open": [], "close": [], "lines": []}
    for raw in md.splitlines():
        line = raw.strip()
        m = re.match(r"<!--\s*(.*?)\s*-->", line)
        if m and "beat" in m.group(1):
            if cur["lines"]: beats.append(cur)
            f = dict((k.strip(), v.strip()) for k, v in (p.split(":", 1) for p in m.group(1).split("|") if ":" in p))
            emo = f.get("emotion", "").split()
            cur = {"annotated": True, "name": f.get("beat", ""), "emotion": emo[0] if emo else None, "intensity": int(emo[1]) if len(emo) > 1 and emo[1].isdigit() else None,
                   "open": [x for x in re.split(r"[,\s]+", f.get("open", "")) if x], "close": [x for x in re.split(r"[,\s]+", f.get("close", "")) if x], "lines": []}
            continue
        # house conventions (retention-script skill): "## SECTION" headings start beats, "N." numbered lines,
        # "> " slower lines, "|" beat marks, "[↺]" re-hooks, "**(opens L1)**" / "**(closes L1)**" loop marks,
        # *(stage directions)* and "**Label:** …" header notes are not narration
        if line.startswith("## ") and not any(c.get("annotated") for c in beats + [cur]):
            if cur["lines"]: beats.append(cur)
            cur = {"name": line[3:].strip(), "emotion": None, "intensity": None, "open": [], "close": [], "lines": []}
            continue
        if not line or line.startswith(("#", "|", "<!--", "---", "- ")) or re.match(r"^\[.*\]$", line) or re.match(r"^\*\([^)]*\)\*$", line) or re.match(r"^\*\*[^*]{1,30}:\*\*", line) or re.match(r"^\*\*[A-Z][A-Z ]{2,20}:", line) or re.match(r"^\(?(tie rule|note|todo|sponsor slot)\b", line, re.I):
            continue
        line = re.sub(r"^\d+\.\s*", "", line).lstrip("> ").strip()
        for kind, L in re.findall(r"\((opens|closes)(?: the)? (L\d+)", line):
            (cur["open"] if kind == "opens" else cur["close"]).append(L)
        if "↺" in line: cur.setdefault("rehooks", 0); cur["rehooks"] += 1; line = line.replace("[↺]", " ↺")
        line = re.sub(r"\*\*\((?:opens|closes)[^)]*\)\*\*|\*\(.*?\)\*", "", line)
        line = re.sub(r"\*\*|__|\[(.*?)\]\(.*?\)|\*", r"\1", line).replace("|", " ")
        if line.strip(): cur["lines"].append(line.strip())
    if cur["lines"]: beats.append(cur)
    return beats


def analyse(md, wpm):
    beats = parse(md)
    t, sents, timeline = 0.0, [], []
    for b in beats:
        b["t0"] = t
        for line in b["lines"]:
            for s in re.split(r"(?<=[.!?])\s+", line):
                n = len(s.split())
                if not n: continue
                sents.append({"t": t, "text": s, "n": n})
                t += n / wpm * 60
        b["t1"] = t
        if b["intensity"] is None:  # heuristic intensity from the lexicon
            text = " ".join(b["lines"]).lower()
            hits = [LEXW[w] for w in re.findall(r"[a-z]+", text) if w in LEXW]
            b["intensity"] = max(1, min(5, round(statistics.mean(sorted(hits)[-3:])) if hits else 1))
            b["heuristic"] = True
        timeline.append((b["t0"], b["t1"], b["intensity"]))
    dur = t
    issues, scores = [], {}
    fmt = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"

    # hook
    first = " ".join(s["text"] for s in sents if s["t"] < 15)
    h = 0
    h += 30 if NUM.search(first) else 0
    h += 20 if NAME.search(first) else 0
    h += 25 if STAKES.search(first) else 0
    h += 25 if DEVICES.search(first) else 0
    if sents and THROAT.search(sents[0]["text"]): h -= 40; issues.append("0:00 hook opens with throat-clearing; start inside the story")
    if h < 75: issues.append(f"0:00 hook is weak ({h}/100): needs a concrete number or name, stakes, and a question or contradiction in the first 15 s")
    scores["hook"] = max(0, min(100, h))

    # re-hooks
    marks = [s["t"] for s in sents if DEVICES.search(s["text"])] + [b["t0"] for b in beats if b["open"]]
    marks = sorted(set(marks + [0.0, dur]))
    gaps = [(a, b) for a, b in zip(marks, marks[1:]) if b - a > 40]
    for a, b in gaps: issues.append(f"{fmt(a)}–{fmt(b)} no curiosity device for {int(b - a)} s (target ≤ 40 s)")
    scores["rehooks"] = max(0, 100 - 15 * len(gaps))

    # loops
    opened, closed, lp = {}, {}, 100
    for b in beats:
        for L in b["open"]: opened.setdefault(L, b["t0"])
        for L in b["close"]: closed[L] = b["t0"]
    if opened:
        for L, t0 in opened.items():
            if L not in closed: issues.append(f"loop {L} opened at {fmt(t0)} is never closed"); lp -= 20
            elif closed[L] - t0 > 360 and L != "L1": issues.append(f"loop {L} stays open {int((closed[L] - t0) / 60)} min (> 6)"); lp -= 8
        for L, t0 in opened.items():
            if L in closed and 0 <= closed[L] - t0 < 10: issues.append(f"loop {L} closes {closed[L] - t0:.0f} s after it opens — that's a beat, not a loop"); lp -= 5
        for b in beats:
            live = [L for L, t0 in opened.items() if t0 <= b["t0"] < closed.get(L, 1e9) and closed.get(L, 1e9) - t0 >= 10]
            if not live and b["t1"] < dur * 0.92: issues.append(f"{fmt(b['t0'])} nothing is left open (beat '{b['name']}') — open the next question before closing the last"); lp -= 10
            elif len(live) < 2 and dur * 0.2 <= b["t0"] <= dur * 0.85: issues.append(f"{fmt(b['t0'])} only {len(live)} loop open in the middle (beat '{b['name']}') — keep 2–4 open"); lp -= 4
    else:
        lp = 50; issues.append("no open/close loop annotations: add <!-- beat: … | open: L1 | close: … --> so loops can be checked")
    scores["loops"] = max(0, lp)

    # emotion
    ep, peaks = 100, [t0 for t0, t1, i in timeline if i >= 4]
    last = 0.0
    for p in peaks + [dur]:
        if p - last > 180: issues.append(f"{fmt(last)}–{fmt(p)} no emotional peak for {int((p - last) / 60)} min (target ≤ 3)"); ep -= 15
        last = p
    run_start, run_val = 0.0, None
    for t0, t1, i in timeline:
        if run_val is None or abs(i - run_val) >= 1: run_start, run_val = t0, i
        elif t1 - run_start > 90: issues.append(f"{fmt(run_start)}–{fmt(t1)} flat emotion (intensity {i}) for {int(t1 - run_start)} s"); ep -= 10; run_start = t1
    if timeline:
        top = max(i for _, _, i in timeline)
        if not any(i == top and t0 >= dur * 0.6 for t0, _, i in timeline): issues.append("the biggest emotional peak is not in the last third — build to a climax"); ep -= 15
    if any(b.get("heuristic") for b in beats): issues.append("emotion intensities are guessed from words; annotate beats for a reliable curve")
    scores["emotion"] = max(0, ep)

    # rhythm
    words = sum(s["n"] for s in sents)
    lens = [s["n"] for s in sents]
    long_ = [s for s in sents if s["n"] > 25]
    rp = 100 - 5 * len(long_)
    if len(lens) > 3 and statistics.pstdev(lens) < 4: rp -= 15; issues.append("sentence lengths barely vary — mix short punches with longer lines")
    for s in long_[:5]: issues.append(f"{fmt(s['t'])} sentence of {s['n']} words — split it (TTS and attention)")
    scores["rhythm"] = max(0, rp)

    # specifics
    per_min = (len(NUM.findall(" ".join(s["text"] for s in sents))) + len(NAME.findall(" ".join(s["text"] for s in sents)))) / max(1, dur / 60)
    scores["specifics"] = int(min(100, per_min / 4 * 100))
    if per_min < 3: issues.append(f"only {per_min:.1f} numbers/names per minute — be more concrete (target ≥ 4)")

    W = {"hook": 0.2, "rehooks": 0.2, "loops": 0.15, "emotion": 0.2, "rhythm": 0.1, "specifics": 0.15}
    total = round(sum(scores[k] * w for k, w in W.items()))
    return {"duration_s": round(dur), "words": words, "beats": len(beats), "scores": scores, "total": total, "issues": issues,
            "curve": [{"beat": b["name"], "t": fmt(b["t0"]), "emotion": b["emotion"], "intensity": b["intensity"], "open": b["open"], "close": b["close"]} for b in beats]}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("script"); ap.add_argument("--wpm", type=float, default=150); ap.add_argument("--json")
    a = ap.parse_args()
    r = analyse(open(a.script, encoding="utf-8").read(), a.wpm)
    if a.json: open(a.json, "w").write(json.dumps(r, indent=1))
    print(f"SCRIPT SCORE {r['total']}/100  ({r['duration_s'] // 60}:{r['duration_s'] % 60:02d}, {r['words']} words, {r['beats']} beats)")
    print("  " + "  ".join(f"{k} {v}" for k, v in r["scores"].items()))
    print("  emotion curve: " + " ".join(f"{c['intensity']}" for c in r["curve"]))
    for i in r["issues"]: print("  - " + i)
    sys.exit(0)


if __name__ == "__main__":
    main()
