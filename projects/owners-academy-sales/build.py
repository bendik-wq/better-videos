"""Render the VSL and pre-call cuts from the masterclass recording.

    python3 build.py <recording.mp4> snapped.json out/            # every cut
    python3 build.py <recording.mp4> snapped.json out/ vsl        # one cut

Each clip is re-encoded with short audio fades (no pops on the cut) and loudness-normalised,
chapter cards are rendered in Inter Display, then everything is joined with the concat demuxer.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
W, H, FPS = 1920, 1080, 25
VENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p", "-r", str(FPS)]
AENC = ["-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2"]
CARD_SECS = 2.4


def run(cmd):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *cmd], check=True)


def render_clip(src, cid, t_in, t_out, path):
    if os.path.exists(path):
        return
    d = t_out - t_in
    fade = 0.08
    af = (f"afade=t=in:d={fade},afade=t=out:st={d - fade:.2f}:d={fade},"
          "loudnorm=I=-16:TP=-1.5:LRA=11")
    vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1"
    run(["-ss", f"{t_in:.2f}", "-t", f"{d:.2f}", "-i", src, "-vf", vf, "-af", af, *VENC, *AENC, path])


def render_card(text, path):
    if os.path.exists(path):
        return
    safe = text.replace(":", r"\:").replace("'", r"\'")
    vf = (f"drawtext=fontfile={FONT}:text='{safe}':fontcolor=white:fontsize=84:"
          f"x=(w-text_w)/2:y=(h-text_h)/2,fade=t=in:d=0.3,fade=t=out:st={CARD_SECS - 0.3}:d=0.3")
    run(["-f", "lavfi", "-i", f"color=c=0x0b0b0c:s={W}x{H}:r={FPS}:d={CARD_SECS}",
         "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", str(CARD_SECS),
         "-vf", vf, *VENC, *AENC, path])


def build(src, snapped, out_dir, name, cut):
    parts = os.path.join(out_dir, "parts")
    os.makedirs(parts, exist_ok=True)
    files = []
    for item in cut["sequence"]:
        if isinstance(item, dict):
            slug = "".join(ch if ch.isalnum() else "-" for ch in item["card"].lower())
            p = os.path.join(parts, f"card-{slug}.mp4")
            render_card(item["card"], p)
        else:
            s = snapped[item]
            p = os.path.join(parts, f"{item}.mp4")
            render_clip(src, item, s["in"], s["out"], p)
        files.append(p)
    lst = os.path.join(parts, f"{name}.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{os.path.abspath(p)}'\n" for p in files)
    out = os.path.join(out_dir, f"{name}.mp4")
    run(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                         "-of", "csv=p=0", out]))
    print(f"{name}: {dur // 60:.0f}m{dur % 60:02.0f}s -> {out}", flush=True)


def main(src, snapped_path, out_dir, only=None):
    spec = json.load(open(os.path.join(HERE, "clips.json")))
    snapped = json.load(open(snapped_path))
    for name, cut in spec["cuts"].items():
        if only and name != only:
            continue
        build(src, snapped, out_dir, name, cut)


if __name__ == "__main__":
    main(*sys.argv[1:5])
