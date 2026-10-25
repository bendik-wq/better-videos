"""Composite the split-layout VSL: graphics layer + Josh's face panel + audio.

    python3 composite.py <recording.mp4> <timeline.json> <face-dir> <out-dir> [out-name.mp4]

Needs <out-dir>/graphics.mp4 (render.mjs) and face-mask.png / face-frame.png (render.mjs --overlay),
and <face-dir>/<clip>.mp4 from face.py. Writes <out-dir>/<out-name> (default vsl-b2b.mp4).
"""
import json
import os
import subprocess
import sys

# face panel, matches --L/--top/--face-w/--face-h in stage.html (PANEL=x,y,w,h for other layouts,
# e.g. PANEL=90,520,900,1060 for stage-v.css)
X, Y, W, H = map(int, os.environ.get("PANEL", "96,112,576,824").split(","))
FPS = 25  # replaced by the timeline's own fps in main() (e.g. 24000/1001 to match camera footage)
FPS_ARG = "25"
# sit the webcam in the navy palette, and add grain so the upscale doesn't look waxy
# (FACE_GRAIN=2 or so for clean camera footage that wasn't upscaled)
GRAIN = int(os.environ.get("FACE_GRAIN", 7))
FACE_VF = (f"scale={W}:{H}:flags=lanczos,eq=contrast=1.05:brightness=-0.015:saturation=0.9,"
           f"colorbalance=rs=-0.02:bs=0.035:rm=-0.01:bm=0.02,noise=alls={GRAIN}:allf=t+u,format=yuv420p")


# AUDIO_NORM=final: normalise loudness once over the finished programme (no level steps at cuts)
FINAL_NORM = os.environ.get("AUDIO_NORM") == "final"
SEG_NORM = "" if FINAL_NORM else "loudnorm=I=-16:TP=-1.5:LRA=11,"


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main(src, tl_path, face_dir, out_dir, out_name="vsl-b2b.mp4"):
    tl = json.load(open(tl_path))
    global FPS, FPS_ARG
    FPS = tl.get("fps", 25)
    FPS_ARG = "24000/1001" if abs(FPS - 24000 / 1001) < 1e-4 else str(FPS)
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
               "-frames:v", str(nf), "-r", FPS_ARG, "-c:v", "libx264", "-preset", "medium", "-crf", "16", v)
            fade = 0.06
            # LAST_FADE: a longer fade on the programme's last clip so it doesn't stop dead (Reels)
            last = s is [x for x in tl["segments"] if x["kind"] == "clip"][-1]
            fo = float(os.environ.get("LAST_FADE", fade)) if last else fade
            ff("-ss", f"{s['in']:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vn",
               "-af", f"afade=t=in:d={fade},afade=t=out:st={dur - fo:.3f}:d={fo},{SEG_NORM}"
                      f"aresample=48000,apad=whole_dur={nf / FPS:.4f},atrim=end={nf / FPS:.4f}",
               "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", a)
        else:
            ff("-f", "lavfi", "-i", f"color=c=0x121b2e:s={W}x{H}:r={FPS_ARG}", "-frames:v", str(nf),
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
    if FINAL_NORM:  # two-pass loudnorm over the whole programme
        r = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
        m = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
        normed = audio[:-4] + "-norm.wav"
        ff("-i", audio, "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
           f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000",
           "-ac", "2", "-c:a", "pcm_s16le", normed)
        os.replace(normed, audio)

    clips = [s for s in tl["segments"] if s["kind"] == "clip"]
    on = "+".join(f"between(t,{round(s['t0'] * FPS) / FPS:.3f},{(round(s['t1'] * FPS) - 1) / FPS:.3f})" for s in clips)
    fc = (f"[2:v]format=gray[m];[1:v][m]alphamerge[f];"
          f"[0:v][f]overlay={X}:{Y}:enable='{on}'[a];"
          f"[a][3:v]overlay={X}:{Y}:enable='{on}',format=yuv420p[v]")
    out = os.path.join(out_dir, out_name)
    ff("-i", os.path.join(out_dir, "graphics.mp4"), "-i", face,
       "-loop", "1", "-i", os.path.join(out_dir, "face-mask.png"),
       "-loop", "1", "-i", os.path.join(out_dir, "face-frame.png"),
       "-i", audio, "-filter_complex", fc,
       "-map", "[v]", "-map", "4:a", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-r", FPS_ARG,
       "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out)
    print("->", out)


if __name__ == "__main__":
    main(*sys.argv[1:6])
