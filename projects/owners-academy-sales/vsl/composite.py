"""Composite the split-layout VSL: graphics layer + Josh's face panel + audio.

    python3 composite.py <recording.mp4> <timeline.json> <face-dir> <out-dir>

Needs <out-dir>/graphics.mp4 (render.mjs) and face-mask.png / face-frame.png (render.mjs --overlay),
and <face-dir>/<clip>.mp4 from face.py. Writes <out-dir>/vsl-b2b.mp4.
"""
import json
import os
import subprocess
import sys

X, Y, W, H = 96, 112, 576, 824  # face panel, matches --L/--top/--face-w/--face-h in stage.html
FPS = 25
# sit the webcam in the navy palette, and add grain so the upscale doesn't look waxy
FACE_VF = (f"scale={W}:{H}:flags=lanczos,eq=contrast=1.05:brightness=-0.015:saturation=0.9,"
           "colorbalance=rs=-0.02:bs=0.035:rm=-0.01:bm=0.02,noise=alls=7:allf=t+u,format=yuv420p")


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main(src, tl_path, face_dir, out_dir):
    tl = json.load(open(tl_path))
    parts = os.path.join(out_dir, "parts")
    os.makedirs(parts, exist_ok=True)
    vlist, alist = [], []
    for i, s in enumerate(tl["segments"]):
        dur = s["t1"] - s["t0"]
        nf = round(s["t1"] * FPS) - round(s["t0"] * FPS)  # frame-exact against the graphics layer
        v = os.path.join(parts, f"{i:02d}-v.mp4")
        a = os.path.join(parts, f"{i:02d}-a.wav")
        if s["kind"] == "clip":
            ff("-i", os.path.join(face_dir, f"{s['id']}.mp4"), "-vf", f"{FACE_VF},tpad=stop_mode=clone:stop=50",
               "-frames:v", str(nf), "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "16", v)
            fade = 0.06
            ff("-ss", f"{s['in']:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vn",
               "-af", f"afade=t=in:d={fade},afade=t=out:st={dur - fade:.3f}:d={fade},loudnorm=I=-16:TP=-1.5:LRA=11,"
                      f"aresample=48000,apad,atrim=0:{nf / FPS:.4f}",
               "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", a)
        else:
            ff("-f", "lavfi", "-i", f"color=c=0x121b2e:s={W}x{H}:r={FPS}", "-frames:v", str(nf),
               "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", v)
            ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{nf / FPS:.4f}", "-c:a", "pcm_s16le", a)
        vlist.append(v)
        alist.append(a)
        print(f"segment {i + 1}/{len(tl['segments'])} {s.get('id', s.get('name'))}", flush=True)

    for lst, items in (("v.txt", vlist), ("a.txt", alist)):
        with open(os.path.join(parts, lst), "w") as f:
            f.writelines(f"file '{os.path.abspath(p)}'\n" for p in items)
    face = os.path.join(out_dir, "face.mp4")
    audio = os.path.join(out_dir, "audio.wav")
    ff("-f", "concat", "-safe", "0", "-i", os.path.join(parts, "v.txt"), "-c", "copy", face)
    ff("-f", "concat", "-safe", "0", "-i", os.path.join(parts, "a.txt"), "-c", "copy", audio)

    clips = [s for s in tl["segments"] if s["kind"] == "clip"]
    on = "+".join(f"between(t,{round(s['t0'] * FPS) / FPS:.3f},{(round(s['t1'] * FPS) - 1) / FPS:.3f})" for s in clips)
    fc = (f"[2:v]format=gray[m];[1:v][m]alphamerge[f];"
          f"[0:v][f]overlay={X}:{Y}:enable='{on}'[a];"
          f"[a][3:v]overlay={X}:{Y}:enable='{on}',format=yuv420p[v]")
    out = os.path.join(out_dir, "vsl-b2b.mp4")
    ff("-i", os.path.join(out_dir, "graphics.mp4"), "-i", face,
       "-loop", "1", "-i", os.path.join(out_dir, "face-mask.png"),
       "-loop", "1", "-i", os.path.join(out_dir, "face-frame.png"),
       "-i", audio, "-filter_complex", fc,
       "-map", "[v]", "-map", "4:a", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out)
    print("->", out)


if __name__ == "__main__":
    main(*sys.argv[1:5])
