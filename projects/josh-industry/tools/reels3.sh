#!/bin/bash
# 60-90 s Reels (22 + 26 Oct). Claim dir per reel; v3.done marks a finished one. Delivered older copies stay untouched.
set -uo pipefail
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
R=/home/user/better-videos; OV=$R/projects/josh-industry/out/ig
until grep -q "IGFACES DONE" $S/igfaces.log; do sleep 30; done
SETS="josh-oct22|$S/oct22/face-ig|$S/oct22/audio48.wav|22oct
josh-oct26|$S/oct26-0013/face-ig|$S/oct26-0013/audio48.wav|26oct"
cd $R
while IFS="|" read -r -u 3 proj F A tag; do
  P=$R/projects/$proj; D=/home/user/deliver/reels-$tag-long; mkdir -p $D
  for tl in $P/timeline-ig-*.json; do
    name=$(basename $tl .json); name=${name#timeline-}; out=$P/out/long-reels/$name
    [ -f $out/v3.done ] && continue
    mkdir -p $out; mkdir $out/.claim 2>/dev/null || continue
    rm -rf $out/parts; rm -f $out/*.mp4
    node projects/owners-academy-sales/vsl/render.mjs $tl $out/graphics.part.mp4 --vertical > /dev/null 2>&1 && mv $out/graphics.part.mp4 $out/graphics.mp4 \
      || { echo "FAIL gfx $proj/$name"; continue; }
    cp $OV/face-mask.png $OV/face-frame.png $out/
    (cd $P && LAST_FADE=0.3 PANEL=90,480,900,900 FACE_GRAIN=0 AUDIO_NORM=final python3 $R/projects/owners-academy-sales/vsl/composite.py "$A" $tl $F $out master.mp4 > /dev/null) \
      || { echo "FAIL comp $proj/$name"; continue; }
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $out/master.mp4)
    vb=$(python3 -c "print(min(9000, int(28 * 8 * 1000 / $dur - 192)))")
    n=${name#ig-}; num=${n%%-*}; slug=${n#*-}; f=$D/${tag%oct}Oct-Reel-$num-$slug.mp4
    ffmpeg -nostdin -v error -y -i $out/master.mp4 -c:v libx264 -profile:v high -preset slow -b:v ${vb}k -maxrate $((vb * 3 / 2))k -bufsize $((vb * 2))k \
      -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart $out/final.mp4 && cp $out/final.mp4 $f || { echo "FAIL enc $proj/$name"; continue; }
    rm -rf $out/parts $out/face.mp4 $out/master.mp4; touch $out/v3.done
    echo "done $f $(du -h $f | cut -f1) ${dur}s"
  done
done 3<<< "$SETS"
echo "worker finished"
