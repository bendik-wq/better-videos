#!/bin/bash
# 27 Oct long form, clean full-screen style, 4K master: 4K graphics (colour + alpha) in 4 resumable sections, 2 at a time,
# then a full-resolution composite from the 4K camera file. Waits for the 1080p preview to finish first.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; R=/home/user/better-videos; o=$S/clean27-4k; mkdir -p $o
until grep -q "CLEAN27 DONE" $S/clean27.log; do sleep 60; done
TL=$R/projects/josh-oct27/timeline-long.json; DUR=$(python3 -c "import json;print(json.load(open('$TL'))['duration'])")
B=(0 80 160 240 $DUR)
sec() { local k=$1; [ -f $o/g$k.mp4 ] && return 0
  (cd $R && node projects/owners-academy-sales/vsl/render.mjs $TL $o/g$k.tmp.mp4 --from ${B[$k]} --to ${B[$((k+1))]} --full --clean --scale 2 > $o/g$k.log 2>&1) \
    && mv $o/g$k.tmp-alpha.mp4 $o/g$k-alpha.mp4 && mv $o/g$k.tmp.mp4 $o/g$k.mp4; }
(sec 0; sec 2) & (sec 1; sec 3) & wait
for k in 0 1 2 3; do [ -f $o/g$k.mp4 ] || { echo "FAIL gfx $k"; exit 1; }; done
for x in "" "-alpha"; do for k in 0 1 2 3; do echo "file '$o/g$k$x.mp4'"; done > $o/l$x.txt; ffmpeg -nostdin -v error -y -f concat -safe 0 -i $o/l$x.txt -c copy $o/gfx$x.mp4; done
python3 $R/projects/josh-industry/tools/comp16.py $S/oct27-0009/rec.mp4 $TL $o/gfx.mp4 $o/gfx-alpha.mp4 $S/oct27-0009/audio48.wav $o/GL-Josh-27Oct-LONG-4K.mp4 2160 && echo "CLEAN27 4K DONE"
