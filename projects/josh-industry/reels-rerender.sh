#!/bin/bash
# Re-render every Reel with its new ending (takeaway card fades in, last line fades out). Two workers can share it:
# a claim dir per reel stops double work; a reel whose new file exists is skipped. Old delivered copies stay untouched.
set -uo pipefail
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
R=/home/user/better-videos; OV=$R/projects/josh-industry/out/ig
SETS="josh-industry|/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/oct16/face-ig|/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/src16/audio48-16oct.wav|out/ig
josh-oct21|$S/oct21-0004/face-ig|$S/oct21-0004/audio48.wav|out
josh-oct22|$S/oct22/face-ig|$S/oct22/audio48.wav|out
josh-oct23|$S/oct23-0001/face-ig|$S/oct23-0001/audio48.wav|out"
cd $R
while IFS="|" read -r -u 3 proj F A sub; do
  P=$R/projects/$proj
  for tl in $P/timeline-ig-*.json; do
    name=$(basename $tl .json); name=${name#timeline-}; out=$P/$sub/$name
    [ -f $out/v2.done ] && continue
    mkdir $out/.v2claim 2>/dev/null || continue
    rm -rf $out/parts; rm -f $out/graphics.part.mp4 $out/$name.mp4 $out/$name-master.mp4 $out/$name.tmp.mp4
    if [ ! -f $out/gfx.v2 ]; then
      rm -f $out/graphics.mp4
      node projects/owners-academy-sales/vsl/render.mjs $tl $out/graphics.part.mp4 --vertical > /dev/null 2>&1 && mv $out/graphics.part.mp4 $out/graphics.mp4 && touch $out/gfx.v2 \
        || { echo "FAIL gfx $proj/$name"; continue; }
    fi
    cp $OV/face-mask.png $OV/face-frame.png $out/
    (cd $P && LAST_FADE=0.3 PANEL=90,480,900,900 FACE_GRAIN=0 AUDIO_NORM=final python3 $R/projects/owners-academy-sales/vsl/composite.py "$A" $tl $F $out $name-master.mp4 > /dev/null) \
      || { echo "FAIL comp $proj/$name"; continue; }
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $out/$name-master.mp4)
    vb=$(python3 -c "print(min(9000, int(28 * 8 * 1000 / $dur - 192)))")
    ffmpeg -nostdin -v error -y -i $out/$name-master.mp4 -c:v libx264 -profile:v high -preset slow -b:v ${vb}k -maxrate $((vb * 3 / 2))k -bufsize $((vb * 2))k \
      -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart $out/$name.tmp.mp4 && mv $out/$name.tmp.mp4 $out/$name.mp4 || { echo "FAIL enc $proj/$name"; continue; }
    ffmpeg -nostdin -v error -y -ss 0.2 -i $out/$name.mp4 -frames:v 1 -q:v 2 $out/$name-cover.jpg
    rm -rf $out/parts; touch $out/v2.done
    echo "done $proj/$name $(du -h $out/$name.mp4 | cut -f1)"
  done
done 3<<< "$SETS"
echo "worker finished"
