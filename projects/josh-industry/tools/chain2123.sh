#!/bin/bash
# 21 + 23 Oct v2 masters: wait for the Drive quota on the TEMP source copies, download (resumable), crop the 4K faces,
# drop the source, cut the teaser faces, then run v2build.sh. Every step skips work already done, so re-run after a restart.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
R=/home/user/better-videos; T=$R/projects/josh-industry
have() { local d=$1; shift; for i in "$@"; do [ -s $d/$i.mp4 ] || return 1; done; }
quota_ok() { [ "$(curl -sSL -m 30 -r 0-99 "$1" -o - 2>/dev/null | head -c 15)" != "<!DOCTYPE html>" ] && [ "$(curl -sSL -m 30 "$1" 2>/dev/null | head -c 15)" != "<!DOCTYPE html>" ]; }
run() { # <project> <dir> <drive-id> <size> <parents...>
  local p=$1 d=$S/$2 id=$3 size=$4; shift 4; local F=$d/face-long-4k U="https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
  [ -f $S/v2/$p/v2.done ] && return 0
  mkdir -p $F
  if ! have $F "$@"; then
    if [ ! -f $d/rec.mp4 ]; then
      # never download while another 4K build runs, and only with room for the source + its face crops
      until ! pgrep -f "^/bin/bash ./(noi26|v2build)" >/dev/null && [ $(df --output=avail -B1 / | tail -1) -ge $((size + 3000000000)) ]; do sleep 300; done
      until quota_ok "$U"; do echo "$(date -u +%H:%M) $p: Drive quota still exceeded"; sleep 1800; done
      echo "$p: downloading"
      for k in $(seq 1 40); do curl -sSL -C - -o $d/rec.part "$U" && [ "$(stat -c %s $d/rec.part)" = "$size" ] && break; head -c 15 $d/rec.part | grep -q DOCTYPE && rm -f $d/rec.part; sleep 60; done
      [ "$(stat -c %s $d/rec.part)" = "$size" ] || { echo "FAIL download $p"; return 1; }
      mv $d/rec.part $d/rec.mp4
    fi
    (cd $T && FACE_HQ=1 FPS=23.976 PANEL_SIZE=1152x1648 CRF=17 python3 face4k.py $d/rec.mp4 $d/track-smooth.json $S/parts4k-$p.json $F "$@" | tail -1) || { echo "FAIL faces $p"; return 1; }
    have $F "$@" && rm -f $d/rec.mp4
  fi
  (cd $R/projects && python3 - "$p" "$F" "$@" <<'PY'
import json, os, subprocess, sys
proj, F, parents = sys.argv[1], sys.argv[2], sys.argv[3:]
sn = json.load(open(f"{proj}/snapped.json"))
for k in sorted(x for x in sn if x.startswith("tz-")):
    if os.path.exists(f"{F}/{k}.mp4"): continue
    a, b = sn[k]["in"], sn[k]["out"]
    par = next(x for x in parents if sn[x]["in"] <= a and b <= sn[x]["out"] + 0.5)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a - sn[par]['in']:.3f}", "-i", f"{F}/{par}.mp4", "-t", f"{b - a + 0.2:.3f}",
                    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", f"{F}/{k}.tmp.mp4"], check=True)
    os.replace(f"{F}/{k}.tmp.mp4", f"{F}/{k}.mp4"); print("teaser", k, "from", par)
PY
  ) || { echo "FAIL teasers $p"; return 1; }
  $S/v2build.sh $p $F $d/audio48.wav && touch $S/v2/$p/v2.done
}
run josh-oct23 oct23-0001 1ftQvsMJUJ6pAReTQQIgSDOnCkY2U47wh 3709325573 whole
# 21 Oct waits until the 23 Oct master has been uploaded and removed (disk)
until [ ! -f $S/v2/josh-oct23/build/master.mp4 ] && [ $(df --output=avail -B1G / | tail -1) -ge 8 ]; do sleep 300; done
run josh-oct21 oct21-0004 1FTqIHZ1pKfJgdOacaTtQRSC9gHT2BfnI 4738418613 lf-a lf-b
echo "CHAIN2123 FINISHED"
