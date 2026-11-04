#!/bin/bash
# 26 Oct: wait for the face track, smooth it, cut 4K face clips for the long form, drop the local source, then build the 4K master.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; d=$S/oct26-0013; P=/home/user/better-videos/projects/josh-oct26
until [ -f $d/prep.done ]; do sleep 30; done
python3 - <<PY
import json, numpy as np
tr = json.load(open("$d/track.json")); c = np.array(tr["c"], float); f = tr["fps"]
def g(x, s):
    r = int(s * 3); k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); k /= k.sum()
    return np.convolve(np.pad(x, r, mode="edge"), k, "valid")
sm = np.stack([g(c[:, 0], 2.5 * f), g(c[:, 1], 2.5 * f), g(c[:, 2], 5 * f)], 1)
json.dump({**tr, "c": sm.round(1).tolist()}, open("$d/track-smooth.json", "w"))
sn = json.load(open("$P/snapped.json"))
json.dump({k: {"in": sn[k]["in"], "out": sn[k]["out"]} for k in ["lf-1", "lf-2", "lf-3", "lf-4", "lf-5"]}, open("$S/parts4k-josh-oct26.json", "w"))
print("track smoothed")
PY
mkdir -p $d/face-long-4k; cd /home/user/better-videos/projects/josh-industry
FACE_HQ=1 FPS=23.976 PANEL_SIZE=1152x1648 CRF=17 python3 face4k.py $d/rec.mp4 $d/track-smooth.json $S/parts4k-josh-oct26.json $d/face-long-4k lf-1 lf-2 lf-3 lf-4 lf-5 | tail -1
ok=1; for id in lf-1 lf-2 lf-3 lf-4 lf-5; do n=$(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 $d/face-long-4k/$id.mp4); echo "$id frames $n"; [ -n "$n" ] && [ "$n" -gt 100 ] || ok=0; done
[ $ok = 1 ] || { echo "FAIL faces26"; exit 1; }
echo "FACES26 DONE"
$S/fin4k.sh josh-oct26 $d/face-long-4k $d/audio48.wav lf-1 lf-2 lf-3 lf-4 lf-5
