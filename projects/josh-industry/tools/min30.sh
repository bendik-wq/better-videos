#!/bin/bash
# 30 Oct (DJI 0021), min style: long form 1080p + four vertical 2-3 min clips first, then the 4K long-form master.
# Resumable: every finished piece is kept, so re-running picks up where it stopped.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; R=/home/user/better-videos; P=$R/projects/josh-oct30
d=$S/oct30-0021; o=$S/min30; D=/home/user/deliver; mkdir -p $o $D/clips-30oct
CLIPS="cl-1-motivated-seller cl-2-silver-tsunami cl-3-sentimental-value cl-4-100-vendor-finance"
DUR=$(python3 -c "import json;print(json.load(open('$P/timeline-long.json'))['duration'])")

# gfx <key> <timeline> <flags...>: render graphics (colour + alpha) to $o/<key>.mp4 unless already done
gfx() { local k=$1 tl=$2; shift 2; [ -f $o/$k.mp4 ] && return 0
  (cd $R && node projects/owners-academy-sales/vsl/render.mjs $tl $o/$k.tmp.mp4 "$@" > $o/$k.log 2>&1) \
    && mv $o/$k.tmp-alpha.mp4 $o/$k-alpha.mp4 && mv $o/$k.tmp.mp4 $o/$k.mp4 && echo "gfx $k done"; }
export -f gfx; export o R
cat_parts() { local out=$1; shift; for x in "" "-alpha"; do for k in "$@"; do echo "file '$o/$k$x.mp4'"; done > $o/l$x.txt
  ffmpeg -nostdin -v error -y -f concat -safe 0 -i $o/l$x.txt -c copy $o/$out$x.mp4; done; }

# composite watchers (run while the graphics render)
( until [ -f $o/L1.mp4 ] && [ -f $o/L2.mp4 ]; do sleep 30; done
  f=$D/GL-Josh-30Oct-LONG-min-1080p.mp4
  [ -f $f ] || { cat_parts gfxL L1 L2 && python3 $R/projects/josh-industry/tools/comp16.py $d/rec.mp4 $P/timeline-long.json $o/gfxL.mp4 $o/gfxL-alpha.mp4 $d/audio48.wav $o/long1080.mp4 1080 > $o/compL.log 2>&1 && cp $o/long1080.mp4 $f.tmp.mp4 && mv $f.tmp.mp4 $f; }
  [ -f $f ] && echo "LONG30 1080 DONE" ) &
( for c in $CLIPS; do k=C${c:3:1}; f=$D/clips-30oct/30Oct-Clip-${c#cl-}.mp4; [ -f $f ] && continue
    until [ -f $o/$k.mp4 ] && [ -f $d/track.json ]; do sleep 30; done
    python3 $R/projects/josh-industry/tools/compv.py $d/rec.mp4 $d/track.json $P/timeline-$c.json $o/$k.mp4 $o/$k-alpha.mp4 $d/audio48.wav $o/$k-out.mp4 > $o/comp$k.log 2>&1 \
      && cp $o/$k-out.mp4 $f.tmp.mp4 && mv $f.tmp.mp4 $f && echo "CLIP $c DONE" || echo "FAIL clip $c"; done ) &

# 1080 graphics: long form in two halves + the four clips, three renders at a time
{ echo "L1 $P/timeline-long.json --from 0 --to 260 --full --min"; echo "L2 $P/timeline-long.json --from 260 --to $DUR --full --min"
  for c in $CLIPS; do echo "C${c:3:1} $P/timeline-$c.json --vertical --full --min"; done; } | xargs -P 3 -L 1 bash -c 'gfx "$@"' _
wait
# 4K graphics in four sections, then the full-resolution composite
B=(0 130 260 390 $DUR)
for k in 0 1 2 3; do echo "K$k $P/timeline-long.json --from ${B[$k]} --to ${B[$((k+1))]} --full --min --scale 2"; done | xargs -P 3 -L 1 bash -c 'gfx "$@"' _
for k in 0 1 2 3; do [ -f $o/K$k.mp4 ] || { echo "FAIL 4K gfx $k"; exit 1; }; done
f=$o/GL-Josh-30Oct-LONG-4K.mp4
[ -f $f ] || { cat_parts gfxK K0 K1 K2 K3 && python3 $R/projects/josh-industry/tools/comp16.py $d/rec.mp4 $P/timeline-long.json $o/gfxK.mp4 $o/gfxK-alpha.mp4 $d/audio48.wav $o/long4k.mp4 2160 > $o/compK.log 2>&1 && mv $o/long4k.mp4 $f; }
[ -f $f ] && echo "LONG30 4K DONE"
