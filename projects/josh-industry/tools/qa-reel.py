"""QA for a finished Reel: blank face-panel frames during clips, and a contact sheet of the last 7 s.
   python3 qa-reel.py <timeline.json> <reel.mp4> <sheet.jpg>"""
import json, subprocess, sys
tl, f, sheet = sys.argv[1:4]
t = json.load(open(tl)); fps = t.get("fps", 25)
clips = [s for s in t["segments"] if s["kind"] == "clip"]
out = subprocess.run(["ffmpeg", "-nostdin", "-i", f, "-vf", "crop=900:900:90:480,signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=-,"
                      "metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"], capture_output=True, text=True).stdout
# panel brightness per frame; the empty panel shell is a flat dark navy (YAVG ~ 25-30) while Josh's face is far brighter
ys, cur = {}, None
for line in out.splitlines():
    if line.startswith("frame:"): cur = int(line.split()[0].split(":")[1])
    elif "YAVG" in line: ys[cur] = float(line.split("=")[1])
blank = [n for n, y in ys.items() if y < 40 and any(round(s["t0"] * fps) <= n < round(s["t1"] * fps) for s in clips)]
print(f.rsplit("/", 1)[-1], "blank panel frames:", blank[:10] if blank else "none")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-sseof", "-7", "-i", f, "-vf", "fps=2,scale=270:-1,tile=7x2", "-frames:v", "1", sheet], check=True)
