#!/bin/bash
# 4K graphics layers for the long forms (resumable chunks, several workers can share them).
#   gfx4k.sh <project> [<project> ...]   processed in the given order
R=/home/user/better-videos; cd $R
for proj in "$@"; do
  P=$R/projects/$proj; out=$P/out/long4k; mkdir -p $out
  [ -f $out/graphics.mp4 ] && continue
  node projects/owners-academy-sales/vsl/render.mjs $P/timeline-long.json $out/chunks --chunks 1100 --bg-speed 0 --scale 2
  N=$(python3 -c "import json,math; t=json.load(open('$P/timeline-long.json')); print(math.ceil(round(t['duration']*t['fps'])/1100))")
  if [ "$(ls $out/chunks | grep -vc part)" -ge "$N" ] && [ ! -f $out/graphics.mp4 ] && mkdir $out/.concat 2>/dev/null; then
    ls $out/chunks/chunk-*.mp4 | grep -v part | sed "s|^|file '|; s|$|'|" > $out/chunks.txt
    ffmpeg -nostdin -v error -y -f concat -safe 0 -i $out/chunks.txt -c copy $out/graphics.tmp.mp4 && mv $out/graphics.tmp.mp4 $out/graphics.mp4 && echo "GFX4K DONE $proj"
    rmdir $out/.concat
  fi
done
echo "worker finished"
