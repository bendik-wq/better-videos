#!/bin/bash
# v2 4K master (H.264): new intro graphics + old graphics shifted 120 frames, recomposited with the local 4K faces.
#   v2build.sh <project> <face-dir> <audio48.wav>
R=/home/user/better-videos; S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new
p=$1; F=$2; A=$3; read _ fr ts mf to < <(grep "^$p " $S/splice.txt)
P=$R/projects/$p; o=$S/v2/$p/build; mkdir -p $o
until [ -f $S/v2/$p/intro-gfx.mp4 ]; do sleep 60; done
until mkdir $S/.v2.lock 2>/dev/null; do sleep 60; done; trap 'rmdir $S/.v2.lock' EXIT
if [ ! -f $o/graphics.mp4 ]; then
  ffmpeg -nostdin -v error -y -i $S/v2/$p/intro-gfx.mp4 -i $P/out/long4k/graphics.mp4 -filter_complex \
   "[0:v]trim=end_frame=$fr,setpts=PTS-STARTPTS,fps=24000/1001[a];[1:v]trim=start_frame=$((fr-120)),setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[v]" \
   -map "[v]" -c:v libx264 -preset fast -crf 14 -pix_fmt yuv420p -r 24000/1001 $o/graphics.tmp.mp4 && mv $o/graphics.tmp.mp4 $o/graphics.mp4 || { echo "FAIL gfx $p"; exit 1; }
  echo "gfx joined $p"
fi
cp $P/out/long4k/face-mask.png $P/out/long4k/face-frame.png $o/
(cd $P && RESUME=1 FINAL_CHUNKS=60 CLEAN_PARTS=1 PANEL=192,224,1152,1648 FACE_GRAIN=0 AUDIO_NORM=final VENC="-c:v libx264 -preset medium -crf 18 -profile:v high -level:v 5.1 -pix_fmt yuv420p" \
  python3 $R/projects/owners-academy-sales/vsl/composite.py $A $P/timeline-long.json $F $o master.mp4 > /dev/null) || { echo "FAIL composite $p"; exit 1; }
rm -rf $o/parts $o/face.mp4 $o/final-chunks $o/audio.wav $o/face.done
M=$o/master.mp4
echo "$p $(du -h $M | cut -f1) $(ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height,duration -of csv=p=0 $M) a=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 $M)"
echo "V2 DONE $p"
