#!/usr/bin/env python3
"""Video QA: measurable checks on a rendered video, plus contact sheets for a visual review.

Checks: loudness (YouTube normalises to about -14 LUFS; we target -14 ±1, true peak <= -1 dBTP),
black frames, frozen stretches, silence, cut/scene-change rate per minute, the longest stretch without
a visual change, resolution and frame rate. It also writes contact sheets (a frame every N seconds,
5 x 4 grid) so a vision-capable reviewer can apply docs/research/anti-ai-look.md and the style bible.

Usage: python3 studio/critic/video_qa.py video.mp4 [--every 6] [--out dir]
"""
import argparse, json, pathlib, re, subprocess, sys


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stderr


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate", "-of", "json", path], capture_output=True, text=True).stdout
    d = json.loads(out); v = next(s for s in d["streams"] if s["codec_type"] == "video")
    num, den = v["r_frame_rate"].split("/")
    return float(d["format"]["duration"]), v["width"], v["height"], round(float(num) / float(den), 2), any(s["codec_type"] == "audio" for s in d["streams"])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--every", type=float, default=6); ap.add_argument("--out")
    a = ap.parse_args()
    v = a.video; out = pathlib.Path(a.out or pathlib.Path(v).with_suffix("").as_posix() + "-qa"); out.mkdir(parents=True, exist_ok=True)
    dur, w, h, fps, has_audio = probe(v)
    issues, r = [], {"duration_s": round(dur, 1), "resolution": f"{w}x{h}", "fps": fps}
    if (w, h) < (1920, 1080): issues.append(f"resolution {w}x{h} is below 1080p")

    if has_audio:
        e = run(["ffmpeg", "-nostats", "-i", v, "-af", "ebur128=peak=true", "-f", "null", "-"])
        I = re.findall(r"I:\s+(-?[\d.]+) LUFS", e); TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e); LRA = re.findall(r"LRA:\s+([\d.]+) LU", e)
        r["lufs"] = float(I[-1]) if I else None; r["true_peak"] = float(TP[-1]) if TP else None; r["lra"] = float(LRA[-1]) if LRA else None
        if r["lufs"] is not None and abs(r["lufs"] + 14) > 1: issues.append(f"loudness {r['lufs']} LUFS (target -14 ±1)")
        if r["true_peak"] is not None and r["true_peak"] > -1: issues.append(f"true peak {r['true_peak']} dBTP (max -1)")
        sil = re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)", run(["ffmpeg", "-nostats", "-i", v, "-af", "silencedetect=n=-45dB:d=1.5", "-f", "null", "-"]))
        r["silences"] = [(round(float(s), 1), round(float(d), 1)) for s, d in sil]
        for s, d in r["silences"]: issues.append(f"{int(s // 60)}:{int(s % 60):02d} {d} s of silence")
    else:
        issues.append("no audio track")

    e = run(["ffmpeg", "-nostats", "-i", v, "-vf", "blackdetect=d=0.4:pix_th=0.08,freezedetect=n=0.002:d=3", "-an", "-f", "null", "-"])
    r["black"] = [(round(float(s), 1), round(float(d), 1)) for s, d in re.findall(r"black_start:([\d.]+) black_end:[\d.]+ black_duration:([\d.]+)", e)]
    r["frozen"] = [round(float(s), 1) for s in re.findall(r"freeze_start: ([\d.]+)", e)]
    for s, d in r["black"]:
        if s > 0.5 and s + d < dur - 0.5: issues.append(f"{int(s // 60)}:{int(s % 60):02d} {d} s black")
    for s in r["frozen"]: issues.append(f"{int(s // 60)}:{int(s % 60):02d} picture frozen ≥ 3 s")

    e = run(["ffmpeg", "-nostats", "-i", v, "-vf", "scale=320:-1,select='gt(scene,0.18)',showinfo", "-an", "-f", "null", "-"])
    cuts = [float(t) for t in re.findall(r"pts_time:([\d.]+)", e)]
    r["cuts"] = len(cuts); r["cuts_per_min"] = round(len(cuts) / max(dur / 60, 1e-6), 1)
    marks = [0.0] + cuts + [dur]; gaps = sorted(((b - a, a) for a, b in zip(marks, marks[1:])), reverse=True)
    r["longest_no_cut_s"] = round(gaps[0][0], 1) if gaps else 0
    for g, a0 in gaps[:5]:
        if g > 25: issues.append(f"{int(a0 // 60)}:{int(a0 % 60):02d} {int(g)} s without a cut or scene change (fine only if the camera or graphics keep moving)")
    if r["cuts_per_min"] < 6 and dur > 90: issues.append(f"{r['cuts_per_min']} cuts/min — documentaries in our set run about 8–20")

    sheet = out / "sheet-%02d.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", v, "-vf", f"fps=1/{a.every},scale=480:-1,drawtext=text='%{{pts\\:hms}}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=5x4", "-q:v", "3", sheet.as_posix()])
    r["contact_sheets"] = sorted(p.name for p in out.glob("sheet-*.jpg"))
    r["issues"] = issues
    score = 100 - 6 * len([i for i in issues if "loudness" in i or "peak" in i or "black" in i or "frozen" in i or "silence" in i or "resolution" in i]) - 3 * len([i for i in issues if "without a cut" in i or "cuts/min" in i])
    r["score"] = max(0, score)
    (out / "qa.json").write_text(json.dumps(r, indent=1))
    print(f"VIDEO QA {r['score']}/100  {r['resolution']} {fps}fps {dur / 60:.1f} min  LUFS {r.get('lufs')}  peak {r.get('true_peak')}  cuts/min {r['cuts_per_min']}")
    for i in issues: print("  - " + i)
    print(f"  contact sheets: {out}/ ({len(r['contact_sheets'])}) — review them with docs/research/anti-ai-look.md")


if __name__ == "__main__":
    main()
