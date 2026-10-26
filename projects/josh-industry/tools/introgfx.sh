#!/bin/bash
# render the new 4K intro graphics for one long form (0 .. splice + 2 s)
R=/home/user/better-videos; S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
read p fr ts mf to < <(grep "^$1 " $S/splice.txt)
mkdir -p $S/v2/$p; cd $R
if [ ! -f $S/v2/$p/intro-gfx.mp4 ]; then node projects/owners-academy-sales/vsl/render.mjs projects/$p/timeline-long.json $S/v2/$p/intro-gfx.tmp.mp4 --from 0 --to $to --bg-speed 0 --scale 2 && mv $S/v2/$p/intro-gfx.tmp.mp4 $S/v2/$p/intro-gfx.mp4 && echo "INTRO GFX DONE $p"; fi
