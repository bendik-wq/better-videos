#!/bin/bash
# 4K long-form master: wait for the 4K graphics + face clips, cut the teaser faces, composite straight to HEVC, verify.
#   fin4k.sh <project> <face-4k-dir> <audio48.wav> <parent clips for teasers...>
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
R=/home/user/better-videos; proj=$1; F=$2; A=$3; shift 3; PARENTS="$*"
P=$R/projects/$proj; out=$P/out/long4k; name=long4k
ready() { [ -f $out/graphics.mp4 ] || return 1; for p in $PARENTS; do [ -f $F/$p.mp4 ] || return 1; done; }
until ready; do sleep 60; done
echo "inputs ready $proj"
# one 4K assembly at a time (disk): wait for the shared lock
until mkdir $S/.fin4k.lock 2>/dev/null; do sleep 60; done
trap 'rmdir $S/.fin4k.lock' EXIT
cd $R/projects
python3 - "$proj" "$F" $PARENTS <<'PY'
import json, subprocess, sys
proj, F, parents = sys.argv[1], sys.argv[2], sys.argv[3:]
sn = json.load(open(f"{proj}/snapped.json"))
for k in sorted(x for x in sn if x.startswith("tz-")):
    a, b = sn[k]["in"], sn[k]["out"]
    par = next(x for x in parents if sn[x]["in"] <= a and b <= sn[x]["out"] + 0.5)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a - sn[par]['in']:.3f}", "-i", f"{F}/{par}.mp4", "-t", f"{b - a + 0.2:.3f}",
                    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", f"{F}/{k}.mp4"], check=True)
    print("teaser", k, "from", par)
PY
cp $R/projects/owners-academy-sales/out/b2b4k/face-mask.png $R/projects/owners-academy-sales/out/b2b4k/face-frame.png $out/
rm -rf $out/parts
(cd $P && CLEAN_PARTS=1 PANEL=192,224,1152,1648 FACE_GRAIN=0 AUDIO_NORM=final VENC="-c:v libx265 -preset fast -crf 19 -tag:v hvc1" \
  python3 $R/projects/owners-academy-sales/vsl/composite.py $A $P/timeline-long.json $F $out $name-master.mp4 > /dev/null) || { echo "FAIL composite $proj"; exit 1; }
M=$out/$name-master.mp4
echo "$proj $(du -h $M | cut -f1) $(ffprobe -v error -select_streams v -show_entries stream=width,height,duration -of csv=p=0 $M) a=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 $M) n=$(ffprobe -v error -select_streams v -count_packets -show_entries stream=nb_read_packets -of csv=p=0 $M)"
rm -rf $out/parts
echo "FIN4K DONE $proj"
