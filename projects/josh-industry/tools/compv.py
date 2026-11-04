"""Full-screen vertical Reel from 4K landscape footage: a full-height 9:16 crop that follows Josh's face (smoothed),
the --vertical --full graphics (colour + alpha mp4) on top, one fixed audio gain (no compression).
   python3 compv.py <rec.mp4> <track.json> <timeline.json> <gfx.mp4> <gfx-alpha.mp4> <audio48.wav> <out.mp4> [--sheet sheet.jpg]"""
import json, os, subprocess, sys
import numpy as np
rec, trp, tlp, gfx, alpha, A, out = sys.argv[1:8]
tl = json.load(open(tlp)); fps = tl["fps"]; FA = str(fps)
tr = json.load(open(trp)); c = np.array(tr["c"], float); tf = tr["fps"]
def g(x, s):
    r = int(s * 3); k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); k /= k.sum()
    return np.convolve(np.pad(x, r, mode="edge"), k, "valid")
cx = g(c[:, 0], 1.6 * tf)                     # steady horizontal follow (handheld camera)
CW = 1215                                      # 2160 * 9 / 16
# FACEPOS: where Josh's face sits across the crop (0.5 = centre). 27 Oct uses 0.36: keeps the cigarette hand
# (frame left, Josh's right hand) out of the vertical crop
FP = float(os.environ.get("FACEPOS", 0.5))
def xat(t):
    i = min(max(t * tf, 0), len(cx) - 1); a = int(i); b = min(a + 1, len(cx) - 1); f = i - a
    return int(round(min(max(cx[a] * (1 - f) + cx[b] * f - CW * FP, 0), 3840 - CW)))
tmp = out + ".parts"; os.makedirs(tmp, exist_ok=True)
ff = lambda *a: subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)
vl, al = [], []
for k, s in enumerate(tl["segments"]):
    nf = round(s["t1"] * fps) - round(s["t0"] * fps); v = f"{tmp}/{k:02d}.mp4"; a = f"{tmp}/{k:02d}.wav"; vl.append(v); al.append(a)
    if os.path.exists(v) and os.path.exists(a): continue
    if s["kind"] == "clip":
        cmd = f"{tmp}/{k:02d}.cmd"
        with open(cmd, "w") as f:
            for i in range(nf + 30):
                f.write(f"{i / fps:.4f} crop x {xat(s['in'] + i / fps)};\n")
        ff("-ss", f"{s['in']:.3f}", "-i", rec, "-vf", f"fps={fps},sendcmd=f={cmd},crop={CW}:2160:{xat(s['in'])}:0,scale=1080:1920:flags=lanczos,tpad=stop_mode=clone:stop=50,format=yuv420p",
           "-frames:v", str(nf), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "15", v + ".tmp.mp4")
        d = s["t1"] - s["t0"]; last = s is [x for x in tl["segments"] if x["kind"] == "clip"][-1]; fo = 0.3 if last else 0.06
        ff("-ss", f"{s['in']:.3f}", "-t", f"{d:.3f}", "-i", A, "-af", f"afade=t=in:d=0.04,afade=t=out:st={max(0, d - fo):.3f}:d={fo},apad=whole_dur={nf / fps:.4f},atrim=end={nf / fps:.4f}",
           "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", a + ".tmp.wav")
    else:
        ff("-f", "lavfi", "-i", f"color=c=black:s=1080x1920:r={FA}", "-frames:v", str(nf), "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", v + ".tmp.mp4")
        ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{nf / fps:.4f}", "-c:a", "pcm_s16le", a + ".tmp.wav")
    # FREEZE=[[src_t0, src_t1], ...]: hold the frame at t0 through t1 (audio carries on), e.g. to keep a cigarette out of shot
    if s["kind"] == "clip":
        for f0, f1 in json.loads(os.environ.get("FREEZE", "[]")):
            a0, a1 = max(f0, s["in"]), min(f1, s["in"] + nf / fps)
            if a1 <= a0: continue
            i0, i1 = round((a0 - s["in"]) * fps), min(nf - 1, round((a1 - s["in"]) * fps))
            rep = i0 - 1 if i0 > 0 else i1 + 1
            ff("-i", v + ".tmp.mp4", "-i", v + ".tmp.mp4", "-filter_complex", f"[0:v][1:v]freezeframes=first={i0}:last={i1}:replace={rep}",
               "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", v + ".frz.mp4")
            os.replace(v + ".frz.mp4", v + ".tmp.mp4"); print(f"froze {s['id']} frames {i0}-{i1}", flush=True)
    os.replace(v + ".tmp.mp4", v); os.replace(a + ".tmp.wav", a)
for n, L in (("v", vl), ("a", al)):
    open(f"{tmp}/{n}.txt", "w").writelines(f"file '{x}'\n" for x in L)
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/v.txt", "-c", "copy", f"{tmp}/video.mp4")
if "--sheet" in sys.argv:   # framing / smoking check: 1 frame per second of the cropped picture
    ff("-i", f"{tmp}/video.mp4", "-vf", "fps=1,scale=180:320,tile=12x7", "-frames:v", "1", sys.argv[sys.argv.index("--sheet") + 1]); sys.exit(0)
ff("-f", "concat", "-safe", "0", "-i", f"{tmp}/a.txt", "-c", "copy", f"{tmp}/audio.wav")
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{tmp}/audio.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(r.rsplit("I:", 1)[1].split("LUFS")[0]); pk = float(r.rsplit("Peak:", 1)[1].split("dBFS")[0]); g_ = min(-16 - I, -1 - pk)
dur = tl["duration"]; vb = min(9000, int(28 * 8 * 1000 / dur - 192))
ff("-i", f"{tmp}/video.mp4", "-i", gfx, "-i", alpha, "-i", f"{tmp}/audio.wav", "-filter_complex",
   "[1:v]format=yuva444p[c];[2:v]format=gray[m];[c][m]alphamerge[g];[0:v][g]overlay=0:0:format=auto,format=yuv420p[v]",
   "-map", "[v]", "-map", "3:a", "-af", f"volume={g_:.2f}dB", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", f"{vb}k", "-maxrate", f"{vb * 3 // 2}k",
   "-bufsize", f"{vb * 2}k", "-r", FA, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", out + ".tmp.mp4")
os.replace(out + ".tmp.mp4", out); print("->", out, f"gain {g_:+.1f} dB")
