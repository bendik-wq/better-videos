"""Full-screen composite: Josh's footage fills the frame, transparent graphics (.mov with alpha) on top.
   python3 compfull.py <project> <timeline.json> <graphics.mov> <face-long-4k dir> <parts...> -- <audio48.wav> <out.mp4>
Vertical only for now: each clip comes from the 4K long-form crop (1152x1648), centre-cropped to 9:16."""
import json, subprocess, sys, os
proj, tlp, gfx, F = sys.argv[1:5]; i = sys.argv.index("--"); parents = sys.argv[5:i]; A, out = sys.argv[i + 1:i + 3]
P = f"/home/user/better-videos/projects/{proj}"
tl = json.load(open(tlp)); sn = json.load(open(f"{P}/snapped.json")); fps = tl["fps"]
tmp = out + ".parts"; os.makedirs(tmp, exist_ok=True)
ff = lambda *a: subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)
vl, al = [], []
for k, s in enumerate(tl["segments"]):
    nf = round(s["t1"] * fps) - round(s["t0"] * fps); v = f"{tmp}/{k:02d}.mp4"; a = f"{tmp}/{k:02d}.wav"
    if s["kind"] == "clip":
        par = next(x for x in parents if sn[x]["in"] - 0.25 <= s["in"] < sn[x]["out"])
        off = s["in"] - sn[par]["in"]; pad = max(0, -off)
        vf = (f"tpad=start_duration={pad:.3f}:start_mode=clone," if pad else "") + \
             f"fps={fps},crop=927:1648:112:0,scale=1080:1920:flags=lanczos,tpad=stop_mode=clone:stop=50,format=yuv420p"
        ff("-ss", f"{max(0, off):.3f}", "-i", f"{F}/{par}.mp4", "-vf", vf, "-frames:v", str(nf), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "15", v)
        d = s["t1"] - s["t0"]
        ff("-ss", f"{s['in']:.3f}", "-t", f"{d:.3f}", "-i", A, "-af", f"afade=t=in:d=0.04,afade=t=out:st={d - 0.06:.3f}:d=0.06,apad=whole_dur={nf / fps:.4f},atrim=end={nf / fps:.4f}",
           "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", a)
    else:
        ff("-f", "lavfi", "-i", f"color=c=0x0b1220:s=1080x1920:r={fps}", "-frames:v", str(nf), "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", v)
        ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{nf / fps:.4f}", "-c:a", "pcm_s16le", a)
    vl.append(v); al.append(a)
for n, L in (("v", vl), ("a", al)):
    open(f"{tmp}/{n}.txt", "w").writelines(f"file '{x}'\n" for x in L)
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/v.txt", "-c", "copy", f"{tmp}/video.mp4")
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/a.txt", "-c", "copy", f"{tmp}/audio.wav")
# audio: one fixed gain to -16 LUFS overall (no compression or limiting); peaks kept below -1 dBFS
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{tmp}/audio.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(r.rsplit("I:", 1)[1].split("LUFS")[0]); pk = float(r.rsplit("Peak:", 1)[1].split("dBFS")[0])
g = min(-16 - I, -1 - pk); print(f"integrated {I:.1f} LUFS, peak {pk:.1f} dBFS, gain {g:+.1f} dB")
ff("-i", f"{tmp}/video.mp4", "-i", gfx, "-i", f"{tmp}/audio.wav", "-filter_complex",
   "[0:v]eq=contrast=1.03:saturation=0.95,colorbalance=bs=0.02:bm=0.01[b];[b][1:v]overlay=format=auto,format=yuv420p[v]",
   "-map", "[v]", "-map", "2:a", "-af", f"volume={g:.2f}dB", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high",
   "-c:a", "aac", "-b:a", "256k", "-r", str(fps), "-movflags", "+faststart", "-shortest", out)
print("->", out)
