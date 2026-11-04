"""Redo only the final overlay of composite.py (face + graphics + audio already built) with the fixed face-panel windows.
   PANEL=x,y,w,h python3 reoverlay.py <timeline.json> <out-dir> <out-name>"""
import json, os, subprocess, sys
tl_path, out_dir, out_name = sys.argv[1:4]
tl = json.load(open(tl_path)); FPS = tl.get("fps", 25)
FPS_ARG = "24000/1001" if abs(FPS - 24000 / 1001) < 1e-4 else str(FPS)
X, Y, W, H = map(int, os.environ.get("PANEL", "96,112,576,824").split(","))
clips = [s for s in tl["segments"] if s["kind"] == "clip"]
on = "+".join(f"between(t,{(round(s['t0'] * FPS) - 0.5) / FPS:.4f},{(round(s['t1'] * FPS) - 0.5) / FPS:.4f})" for s in clips)
fc = (f"[2:v]format=gray[m];[1:v][m]alphamerge[f];[0:v][f]overlay={X}:{Y}:enable='{on}'[a];"
      f"[a][3:v]overlay={X}:{Y}:enable='{on}',format=yuv420p[v]")
j = lambda n: os.path.join(out_dir, n)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", j("graphics.mp4"), "-i", j("face.mp4"), "-loop", "1", "-i", j("face-mask.png"),
                "-loop", "1", "-i", j("face-frame.png"), "-i", j("audio.wav"), "-filter_complex", fc,
                "-map", "[v]", "-map", "4:a", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-r", FPS_ARG,
                "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", j(out_name + ".tmp.mp4")], check=True)
os.replace(j(out_name + ".tmp.mp4"), j(out_name))
print("->", j(out_name))
