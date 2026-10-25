#!/bin/bash
# 4K face clips from the original camera files (temporary Drive copies), one source at a time, then teaser clips.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
T=/home/user/better-videos/projects/josh-industry
dl() { # <dir> <drive-id> <size>
  local d=$1 id=$2 size=$3 U="https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"
  until [ "$(curl -sSL -m 60 -r 0-1023 -o /dev/null -w '%{content_type}' "$U")" = "video/mp4" ]; do sleep 60; done
  echo "$d shared"
  until curl -sSL -C - -o $d/rec.part "$U"; do sleep 5; done
  [ "$(stat -c %s $d/rec.part)" = "$size" ] || { echo "FAIL size $d"; rm -f $d/rec.part; return 1; }
  mv $d/rec.part $d/rec.mp4; echo "$d downloaded"
}
crop() { # <src-dir> <parts.json> <out-dir> ids...
  local d=$1 parts=$2 out=$3; shift 3
  mkdir -p $out; cd $T
  FACE_HQ=1 FPS=23.976 PANEL_SIZE=1152x1648 CRF=17 python3 face4k.py $d/rec.mp4 $d/track-smooth.json $parts $out "$@" | tail -1
  for id in "$@"; do
    n=$(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 $out/$id.mp4)
    echo "$out/$id frames $n"
  done
}
have() { local d=$1; shift; for i in "$@"; do [ -s $d/$i.mp4 ] || return 1; done; }
# 21 Oct
if ! have $S/oct21-0004/face-long-4k lf-a lf-b; then dl $S/oct21-0004 1FTqIHZ1pKfJgdOacaTtQRSC9gHT2BfnI 4738418613 && crop $S/oct21-0004 $S/parts4k-josh-oct21.json $S/oct21-0004/face-long-4k lf-a lf-b && rm $S/oct21-0004/rec.mp4 && echo "SRC4K DONE oct21"; fi
# 23 Oct
if ! have $S/oct23-0001/face-long-4k whole; then dl $S/oct23-0001 1ftQvsMJUJ6pAReTQQIgSDOnCkY2U47wh 3709325573 && crop $S/oct23-0001 $S/parts4k-josh-oct23.json $S/oct23-0001/face-long-4k whole && rm $S/oct23-0001/rec.mp4 && echo "SRC4K DONE oct23"; fi
# 22 Oct, first file (lf-8 is already done from the second file)
if ! have $S/oct22/face-long-4k lf-1 lf-2 lf-3 lf-4 lf-5 lf-6 lf-7; then dl $S/oct22-0005 1H5wFmme0OZSzPiSL9xVBaC6jDUKrzXAO 4299596262 && crop $S/oct22-0005 $S/parts4k-josh-oct22.json $S/oct22/face-long-4k lf-1 lf-2 lf-3 lf-4 lf-5 lf-6 lf-7 && rm $S/oct22-0005/rec.mp4 && echo "SRC4K DONE oct22"; fi
echo "SRC4K FINISHED"
