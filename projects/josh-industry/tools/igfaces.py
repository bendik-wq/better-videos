import json, subprocess, sys, os
S = "/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new"
for proj, rec, n in [("josh-oct22", "oct22", 8), ("josh-oct26", "oct26-0013", 5)]:
    P = f"/home/user/better-videos/projects/{proj}"
    sn = json.load(open(f"{P}/snapped.json")); F = f"{S}/{rec}/face-long-4k"; out = f"{S}/{rec}/face-ig"
    lf = [f"lf-{i}" for i in range(1, n + 1)]
    for k in sorted(x for x in sn if x.startswith("xl-")):
        if os.path.exists(f"{out}/{k}.mp4"): continue
        a, b = sn[k]["in"], sn[k]["out"]
        par = next(x for x in lf if sn[x]["in"] - 0.25 <= a and a < sn[x]["out"])
        if b > sn[par]["out"] + 0.3: print("WARN spans parts", k, par)
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{max(0, a - sn[par]['in']):.3f}", "-i", f"{F}/{par}.mp4",
                        "-t", f"{b - a + 0.2:.3f}", "-vf", (f"tpad=start_duration={sn[par]['in'] - a:.3f}:start_mode=clone," if a < sn[par]["in"] else "") + "fps=25,crop=1152:1152:0:178,scale=900:900:flags=lanczos", "-an",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", f"{out}/{k}.tmp.mp4"], check=True)
        os.replace(f"{out}/{k}.tmp.mp4", f"{out}/{k}.mp4"); print(k, "from", par, flush=True)
print("IGFACES DONE")
