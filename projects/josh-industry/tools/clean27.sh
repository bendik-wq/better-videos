#!/bin/bash
# 27 Oct long form, clean full-screen style, 1080p: graphics in two halves (colour + alpha), joined, then composited.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; R=/home/user/better-videos; o=$S/clean27; mkdir -p $o
TL=$R/projects/josh-oct27/timeline-long.json; DUR=$(python3 -c "import json;print(json.load(open('$TL'))['duration'])"); MID=160
cd $R
[ -f $o/g1.mp4 ] || node projects/owners-academy-sales/vsl/render.mjs $TL $o/g1.tmp.mp4 --from 0 --to $MID --full --clean > $o/g1.log 2>&1 && mv $o/g1.tmp.mp4 $o/g1.mp4 && mv $o/g1.tmp-alpha.mp4 $o/g1-alpha.mp4 &
[ -f $o/g2.mp4 ] || node projects/owners-academy-sales/vsl/render.mjs $TL $o/g2.tmp.mp4 --from $MID --to $DUR --full --clean > $o/g2.log 2>&1 && mv $o/g2.tmp.mp4 $o/g2.mp4 && mv $o/g2.tmp-alpha.mp4 $o/g2-alpha.mp4 &
wait
for x in "" "-alpha"; do printf "file '%s'\nfile '%s'\n" $o/g1$x.mp4 $o/g2$x.mp4 > $o/l$x.txt; ffmpeg -nostdin -v error -y -f concat -safe 0 -i $o/l$x.txt -c copy $o/gfx$x.mp4; done
python3 $R/projects/josh-industry/tools/comp16.py $S/oct27-0009/rec.mp4 $TL $o/gfx.mp4 $o/gfx-alpha.mp4 $S/oct27-0009/audio48.wav /home/user/deliver/GL-Josh-27Oct-LONG-clean-1080p.mp4 1080 && echo "CLEAN27 DONE"
