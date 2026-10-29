"""Full-screen 16:9 composite: the camera frame fills the picture, the --full graphics layer (colour + alpha mp4) on top.
   python3 comp16.py <rec.mp4> <timeline.json> <gfx.mp4> <gfx-alpha.mp4> <audio48.wav> <out.mp4> [height=1080]
Audio gets one fixed gain to -16 LUFS (capped so peaks stay under -1 dBFS): no compression or limiting."""
import json, os, subprocess, sys
rec, tlp, gfx, alpha, A, out = sys.argv[1:7]; H = int(sys.argv[7]) if len(sys.argv) > 7 else 1080; W = H * 16 // 9
tl = json.load(open(tlp)); fps = tl["fps"]; FA = "24000/1001" if abs(fps - 24000 / 1001) < 1e-4 else str(fps)
tmp = out + ".parts"; os.makedirs(tmp, exist_ok=True)
ff = lambda *a: subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)
vl, al = [], []
for k, s in enumerate(tl["segments"]):
    nf = round(s["t1"] * fps) - round(s["t0"] * fps); v = f"{tmp}/{k:02d}.mp4"; a = f"{tmp}/{k:02d}.wav"; vl.append(v); al.append(a)
    if os.path.exists(v) and os.path.exists(a): continue
    if s["kind"] == "clip":
        ff("-ss", f"{s['in']:.3f}", "-i", rec, "-vf", f"scale={W}:{H}:flags=lanczos,tpad=stop_mode=clone:stop=50,format=yuv420p", "-frames:v", str(nf),
           "-an", "-r", FA, "-c:v", "libx264", "-preset", "medium", "-crf", "14" if H <= 1080 else "16", v + ".tmp.mp4")
        d = s["t1"] - s["t0"]
        ff("-ss", f"{s['in']:.3f}", "-t", f"{d:.3f}", "-i", A, "-af", f"afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06,apad=whole_dur={nf / fps:.4f},atrim=end={nf / fps:.4f}",
           "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", a + ".tmp.wav")
    else:
        ff("-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FA}", "-frames:v", str(nf), "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", v + ".tmp.mp4")
        ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{nf / fps:.4f}", "-c:a", "pcm_s16le", a + ".tmp.wav")
    os.replace(v + ".tmp.mp4", v); os.replace(a + ".tmp.wav", a); print("segment", k + 1, flush=True)
for n, L in (("v", vl), ("a", al)):
    open(f"{tmp}/{n}.txt", "w").writelines(f"file '{x}'\n" for x in L)
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/v.txt", "-c", "copy", f"{tmp}/video.mp4")
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/a.txt", "-c", "copy", f"{tmp}/audio.wav")
for x in vl: os.remove(x)   # joined; free the disk before the final encode (4K parts are large)
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{tmp}/audio.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(r.rsplit("I:", 1)[1].split("LUFS")[0]); pk = float(r.rsplit("Peak:", 1)[1].split("dBFS")[0]); g = min(-16 - I, -1 - pk)
print(f"audio {I:.1f} LUFS, peak {pk:.1f} dBFS -> gain {g:+.1f} dB", flush=True)
ff("-i", f"{tmp}/video.mp4", "-i", gfx, "-i", alpha, "-i", f"{tmp}/audio.wav", "-filter_complex",
   f"[1:v]scale={W}:{H},format=yuva444p[c];[2:v]scale={W}:{H},format=gray[m];[c][m]alphamerge[g];[0:v][g]overlay=0:0:format=auto,format=yuv420p[v]",
   "-map", "[v]", "-map", "3:a", "-af", f"volume={g:.2f}dB", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", FA,
   "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out + ".tmp.mp4")
os.replace(out + ".tmp.mp4", out); print("->", out)
