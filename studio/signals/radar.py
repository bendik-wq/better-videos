#!/usr/bin/env python3
"""News signal radar: what are people searching, reading and sharing right now, and which of it fits the channel?

Pulls Google Trends (US searches), Google News (top + business/tech/world), Wikipedia's most-read pages,
Hacker News and BBC World, clusters items that are about the same story, and scores each cluster:

  signal = breadth (how many independent sources carry it) + search heat (Trends traffic)
         + reading heat (Wikipedia views) + recency, and fit = overlap with the channel's pillars.

Usage:  python3 studio/signals/radar.py [--geo US] [--top 25]
Writes: studio/signals/out/<date>.json and <date>.md (ranked table the idea-engine reads).
"""
import argparse, datetime as dt, email.utils, html, json, math, pathlib, re, urllib.request, xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent
UA = {"User-Agent": "Mozilla/5.0 (studio-radar)"}
STOP = set("""a an the and or but of to in on for with at by from as is are was were be been it its this that these those after before over under
into about than then new says said say will would could should can may might just more most how why what who when where which amid vs via
news live update updates report reports video watch latest today year years day days week first last up down out off his her their our
your you we they he she him them i me my not no yes all any some one two three us u.s""".split())
# channel pillars (docs/library/topic-bank.md): AI, tech, money, power, geopolitics, business mysteries
PILLARS = {
    "ai": "ai openai anthropic google nvidia chip chips model models gpt gemini claude robot robots automation data center datacenter",
    "tech": "tech apple microsoft meta amazon tesla spacex satellite cyber hack hacked hackers outage software startup",
    "money": "market markets stock stocks fed rates inflation bank banks crypto bitcoin dollar debt billion trillion tariff tariffs economy recession housing mortgage",
    "power": "election president trump congress senate court supreme ruling law sanctions billionaire musk scandal investigation",
    "geopolitics": "china russia ukraine iran israel taiwan war military nato oil gas strait missile nuclear border",
    "mystery": "collapse fraud bankrupt bankruptcy lawsuit mystery missing crash leaked secret disappeared heist",
}
PILLAR_WORDS = {w: p for p, ws in PILLARS.items() for w in ws.split()}


def get(url, timeout=20):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


def words(text):
    return [w for w in re.findall(r"[a-z0-9][a-z0-9'\-]+", html.unescape(text).lower()) if w not in STOP and len(w) > 2]


def rss_items(url, source, weight=1.0):
    out = []
    try:
        root = ET.fromstring(get(url))
    except Exception as e:  # a dead source must not stop the run
        return [{"error": f"{source}: {e}"}]
    ns = {"ht": "https://trends.google.com/trending/rss"}
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        title = re.sub(r"\s+-\s+[^-]{2,40}$", "", title)  # Google News appends " - Publisher"
        pub = it.findtext("pubDate")
        try: ts = email.utils.parsedate_to_datetime(pub).timestamp() if pub else None
        except Exception: ts = None
        traffic = it.findtext("ht:approx_traffic", namespaces=ns)
        heat = int(re.sub(r"\D", "", traffic)) if traffic and re.sub(r"\D", "", traffic) else 0
        extra = " ".join((n.findtext("ht:news_item_title", namespaces=ns) or "") for n in it.findall("ht:news_item", ns))
        out.append({"source": source, "title": title, "text": f"{title} {extra}", "url": it.findtext("link"), "ts": ts, "search": heat, "w": weight})
    return out


def wikipedia(day):
    try:
        d = json.loads(get(f"https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/{day:%Y/%m/%d}"))
    except Exception as e:
        return [{"error": f"wikipedia: {e}"}]
    out = []
    for a in d["items"][0]["articles"][:80]:
        t = a["article"]
        if t.startswith(("Special:", "Main_Page", "Wikipedia:", "Portal:", "File:")) or t in ("-", "Cleopatra"):
            continue
        out.append({"source": "wikipedia", "title": t.replace("_", " "), "text": t.replace("_", " "), "url": f"https://en.wikipedia.org/wiki/{t}", "ts": None, "views": a["views"], "w": 1.0})
    return out


def hackernews():
    try:
        ids = json.loads(get("https://hacker-news.firebaseio.com/v0/topstories.json"))[:30]
    except Exception as e:
        return [{"error": f"hackernews: {e}"}]
    out = []
    for i in ids:
        try:
            s = json.loads(get(f"https://hacker-news.firebaseio.com/v0/item/{i}.json", 10))
            out.append({"source": "hackernews", "title": s.get("title", ""), "text": s.get("title", ""), "url": s.get("url") or f"https://news.ycombinator.com/item?id={i}", "ts": s.get("time"), "score": s.get("score", 0), "w": 0.7})
        except Exception:
            pass
    return out


def cluster(items):
    """Greedy clustering: an item joins the cluster whose keywords it overlaps most (>= 2 shared, or 1 rare proper noun)."""
    clusters = []
    for it in sorted(items, key=lambda x: -(x.get("search", 0) + x.get("views", 0) / 50 + x.get("score", 0))):
        kw = set(words(it["text"]))
        if not kw:
            continue
        best, bo = None, 0
        for c in clusters:
            o = len(kw & c["core"])
            if o > bo:
                best, bo = c, o
        # compare against the cluster's core (its first item's words) so clusters can't snowball through generic words
        if best and (bo >= 2 and bo / min(len(kw), len(best["core"])) >= 0.3 or (bo == 1 and len(kw) <= 2 and len(best["core"]) <= 2)):
            best["items"].append(it); best["kw"] |= kw
        else:
            clusters.append({"items": [it], "kw": set(kw), "core": set(kw)})
    return clusters


def score(c, now):
    srcs = {i["source"] for i in c["items"]}
    search = max([i.get("search", 0) for i in c["items"]] + [0])
    views = max([i.get("views", 0) for i in c["items"]] + [0])
    hn = max([i.get("score", 0) for i in c["items"]] + [0])
    ts = [i["ts"] for i in c["items"] if i.get("ts")]
    age_h = (now - max(ts)) / 3600 if ts else 24
    breadth = len(srcs) * 2 + min(len(c["items"]), 10) * 0.5
    heat = math.log10(1 + search) * 1.5 + math.log10(1 + views) * 1.2 + math.log10(1 + hn) * 0.8
    recency = max(0.0, 3 - age_h / 8)
    fit = {}
    for w in c["kw"]:
        if w in PILLAR_WORDS:
            fit[PILLAR_WORDS[w]] = fit.get(PILLAR_WORDS[w], 0) + 1
    fit_score = min(6, sum(fit.values()) * 1.5)
    return round(breadth + heat + recency, 2), round(fit_score, 2), sorted(fit, key=lambda k: -fit[k]), round(age_h, 1)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--geo", default="US"); ap.add_argument("--top", type=int, default=25)
    a = ap.parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    g = a.geo
    feeds = [
        (f"https://trends.google.com/trending/rss?geo={g}", "google-trends", 1.2),
        (f"https://news.google.com/rss?hl=en-{g}&gl={g}&ceid={g}:en", "google-news", 1.0),
        (f"https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-{g}&gl={g}&ceid={g}:en", "google-news-business", 1.0),
        (f"https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-{g}&gl={g}&ceid={g}:en", "google-news-tech", 1.0),
        (f"https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-{g}&gl={g}&ceid={g}:en", "google-news-world", 1.0),
        ("https://feeds.bbci.co.uk/news/world/rss.xml", "bbc-world", 0.9),
        ("https://feeds.bbci.co.uk/news/business/rss.xml", "bbc-business", 0.9),
    ]
    items = []
    for url, src, w in feeds: items += rss_items(url, src, w)
    items += wikipedia((now - dt.timedelta(days=1)).date())
    items += hackernews()
    errors = [i["error"] for i in items if "error" in i]
    items = [i for i in items if "error" not in i]
    ranked = []
    for c in cluster(items):
        sig, fit, pillars, age = score(c, now.timestamp())
        lead = max(c["items"], key=lambda i: (i["source"].startswith("google-news"), len(i["title"])))
        ranked.append({"headline": lead["title"], "signal": sig, "fit": fit, "total": round(sig + fit, 2), "pillars": pillars, "age_h": age,
                       "sources": sorted({i["source"] for i in c["items"]}), "n": len(c["items"]),
                       "search_traffic": max([i.get("search", 0) for i in c["items"]] + [0]), "wiki_views": max([i.get("views", 0) for i in c["items"]] + [0]),
                       "keywords": sorted(c["kw"], key=lambda w: (w not in PILLAR_WORDS, w))[:12],
                       "links": [i["url"] for i in c["items"][:6] if i.get("url")]})
    ranked.sort(key=lambda r: -r["total"])
    out = ROOT / "out"; out.mkdir(exist_ok=True)
    stamp = f"{now:%Y-%m-%d}"
    (out / f"{stamp}.json").write_text(json.dumps({"generated": now.isoformat(), "geo": g, "errors": errors, "items_seen": len(items), "topics": ranked[:100]}, indent=1))
    lines = [f"# Signal radar {stamp} ({g})", "", f"{len(items)} items from {len({i['source'] for i in items})} sources. Total = signal (breadth + search + reading + recency) + channel fit.",
             "Every topic is a lead: verify facts with `docs/library/fact-check-playbook.md` before scripting.", ""]
    head = ["| # | Headline | Total | Signal | Fit | Pillars | Sources | Search | Wiki views | Age h |", "|---|---|---|---|---|---|---|---|---|---|"]
    row = lambda k, r: f"| {k} | {r['headline'][:90]} | {r['total']} | {r['signal']} | {r['fit']} | {', '.join(r['pillars'][:2]) or '—'} | {len(r['sources'])} | {r['search_traffic'] or ''} | {r['wiki_views'] or ''} | {r['age_h']} |"
    picks = [r for r in ranked if r["fit"] > 0 and len(r["sources"]) >= 2]
    lines += ["## Channel picks (fit the pillars, carried by 2+ sources)", ""] + head + [row(k, r) for k, r in enumerate(picks[:a.top], 1)]
    lines += ["", "## Everything hot (any topic)", ""] + head + [row(k, r) for k, r in enumerate(ranked[:a.top], 1)]
    if errors: lines += ["", "Sources that failed: " + "; ".join(errors)]
    (out / f"{stamp}.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines[:a.top + 8]))


if __name__ == "__main__":
    main()
