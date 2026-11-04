#!/bin/bash
# Render + composite the 26 Oct intro variations (1080p previews), add impact hits to B and C.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; V=$S/var26; R=/home/user/better-videos; D=/home/user/deliver/intro-variations-26oct
mkdir -p $D
[ -f $V/boom.wav ] || ffmpeg -nostdin -v error -y -f lavfi -i "sine=frequency=46:duration=2.4" -f lavfi -i "anoisesrc=color=brown:duration=0.7:amplitude=0.8" \
  -filter_complex "[0]volume=1.0,afade=t=in:d=0.01,afade=t=out:st=0.03:d=2.3:curve=exp[a];[1]lowpass=f=160,afade=t=in:d=0.005,afade=t=out:st=0.02:d=0.65:curve=exp[b];[a][b]amix=inputs=2:normalize=0,volume=0.55,pan=stereo|c0=c0|c1=c0" -ar 48000 $V/boom.wav
declare -A HITS=([B-dramatic]="0.0:0.9 7.03:0.6 45.25:1.0" [C-cold-open]="0.0:0.9 7.28:1.0")
for n in A-current B-dramatic C-cold-open D-no-intro; do
  [ -f $D/26Oct-intro-$n.mp4 ] && continue
  o=$V/$n; mkdir -p $o
  [ -f $o/graphics.mp4 ] || (cd $R && node projects/owners-academy-sales/vsl/render.mjs $V/$n.json $o/graphics.tmp.mp4 --bg-speed 0 2>&1 | tail -1 && mv $o/graphics.tmp.mp4 $o/graphics.mp4)
  cp $R/projects/owners-academy-sales/out/b2b/face-mask.png $R/projects/owners-academy-sales/out/b2b/face-frame.png $o/
  (cd $R/projects/josh-oct26 && RESUME=1 FACE_GRAIN=0 AUDIO_NORM=final python3 $R/projects/owners-academy-sales/vsl/composite.py $S/oct26-0013/audio48.wav $V/$n.json $S/oct26-0013/face-long-4k $o prev.mp4 > /dev/null) || { echo "FAIL $n"; continue; }
  if [ -n "${HITS[$n]}" ]; then
    in="-i $o/prev.mp4"; fc=""; k=1; mix="[0:a]"
    for h in ${HITS[$n]}; do t=${h%:*}; g=${h#*:}; in="$in -i $V/boom.wav"; ms=$(python3 -c "print(int($t*1000))"); fc="$fc[$k:a]adelay=$ms|$ms,volume=$g[h$k];"; mix="$mix[h$k]"; k=$((k+1)); done
    ffmpeg -nostdin -v error -y $in -filter_complex "${fc}${mix}amix=inputs=$k:normalize=0:duration=first,alimiter=limit=0.89[a]" -map 0:v -map "[a]" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart $D/26Oct-intro-$n.mp4
  else
    ffmpeg -nostdin -v error -y -i $o/prev.mp4 -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart $D/26Oct-intro-$n.mp4
  fi
  rm -rf $o/parts $o/face.mp4; echo "done $n $(du -h $D/26Oct-intro-$n.mp4 | cut -f1)"
done
echo "VARIANTS DONE"
