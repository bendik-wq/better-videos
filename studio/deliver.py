#!/usr/bin/env python3
"""Package a finished video for posting: the "ready to post" folder.

Makes studio/deliveries/<date>-<slug>/ with:
  YOUTUBE.md     title (+ A/B options), description, chapters, tags, sources, the video link and its md5
  SCRIPT.md      the narration
  SCORECARD.md   every critic score from the studio loop (script critic, video QA, visual review)
  thumb-*.jpg    thumbnail options (1280x720)
and uploads the video to a download host (gofile.io, as with earlier episodes) because a multi-GB file can't
go through the Google Drive connector. The /studio skill then mirrors this folder into Google Drive.

Usage: python3 studio/deliver.py --project projects/<name> --video <mp4> --title "..." [--thumbs a.jpg b.jpg] [--no-upload]
"""
import argparse, datetime as dt, hashlib, json, pathlib, re, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parent


def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
    return h.hexdigest()


def upload(video):
    servers = json.loads(subprocess.run(["curl", "-s", "--max-time", "30", "https://api.gofile.io/servers"], capture_output=True, text=True).stdout)["data"]["servers"]
    server = next((s["name"] for s in servers if s.get("zone") == "eu"), servers[0]["name"])
    out = subprocess.run(["curl", "-s", "--max-time", "3600", "-F", f"file=@{video}", f"https://{server}.gofile.io/contents/uploadfile"], capture_output=True, text=True).stdout
    d = json.loads(out)
    if d.get("status") != "ok": raise SystemExit(f"upload failed: {out[:300]}")
    return d["data"]["downloadPage"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True); ap.add_argument("--video", required=True); ap.add_argument("--title", required=True)
    ap.add_argument("--thumbs", nargs="*", default=[]); ap.add_argument("--no-upload", action="store_true")
    a = ap.parse_args()
    proj, video = pathlib.Path(a.project), pathlib.Path(a.video)
    slug = re.sub(r"[^a-z0-9]+", "-", a.title.lower()).strip("-")[:60]
    d = ROOT / "deliveries" / f"{dt.date.today()}-{slug}"; d.mkdir(parents=True, exist_ok=True)
    for name in ("SCRIPT.md", "SCORECARD.md", "SOURCES.md", "YOUTUBE.md"):
        if (proj / name).exists(): shutil.copy(proj / name, d / name)
    for i, t in enumerate(a.thumbs, 1):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t, "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720", "-q:v", "2", (d / f"thumb-{i}.jpg").as_posix()])
    link = "(not uploaded)" if a.no_upload else upload(video)
    size = video.stat().st_size / 1e6
    yt = d / "YOUTUBE.md"
    head = f"# Ready to post: {a.title}\n\n- **Video:** {link}\n- **File:** {video.name}, {size:.0f} MB, md5 `{md5(video)}`\n- **Packaged:** {dt.datetime.now():%Y-%m-%d %H:%M}\n\n"
    yt.write_text(head + (yt.read_text() if yt.exists() else "## Title\n" + a.title + "\n"))
    print(json.dumps({"folder": d.as_posix(), "video_link": link, "md5": md5(video), "files": sorted(p.name for p in d.iterdir())}, indent=1))


if __name__ == "__main__":
    main()
