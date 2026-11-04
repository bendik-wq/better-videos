#!/bin/bash
# 26 Oct long form, no-intro version (user picked variant D): 4K graphics in resumable chunks (2 workers), then a resumable composite.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; R=/home/user/better-videos; P=$R/projects/josh-oct26; o=$S/noi26
mkdir -p $o/chunks; rm -f $o/chunks/*.part
TL=$P/timeline-long.json
N=$(python3 -c "import json,math; t=json.load(open('$TL')); print(math.ceil(round(t['duration']*t['fps'])/300))")
if [ ! -f $o/graphics.mp4 ]; then
  for w in 1 2; do (cd $R && node projects/owners-academy-sales/vsl/render.mjs $TL $o/chunks --chunks 300 --bg-speed 0 --scale 2 > $o/gfx-$w.log 2>&1) & sleep 20; done; wait
  [ "$(ls $o/chunks | grep -c '^chunk-...\.mp4$')" -ge "$N" ] || { echo "FAIL gfx chunks"; exit 1; }
  ls $o/chunks/chunk-*.mp4 | sed "s|^|file '|; s|$|'|" > $o/chunks.txt
  ffmpeg -nostdin -v error -y -f concat -safe 0 -i $o/chunks.txt -c copy $o/graphics.tmp.mp4 && mv $o/graphics.tmp.mp4 $o/graphics.mp4 && rm -rf $o/chunks
  echo "gfx done"
fi
cp $P/../owners-academy-sales/out/b2b4k/face-mask.png $P/../owners-academy-sales/out/b2b4k/face-frame.png $o/
(cd $P && RESUME=1 FINAL_CHUNKS=60 CLEAN_PARTS=1 PANEL=192,224,1152,1648 FACE_GRAIN=0 AUDIO_NORM=final VENC="-c:v libx264 -preset medium -crf 18 -profile:v high -level:v 5.1 -pix_fmt yuv420p" \
  python3 $R/projects/owners-academy-sales/vsl/composite.py $S/oct26-0013/audio48.wav $TL $S/oct26-0013/face-long-4k $o master.mp4 > $o/comp.log 2>&1) || { echo "FAIL composite"; exit 1; }
M=$o/master.mp4; echo "$(du -h $M | cut -f1) $(ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height,duration -of csv=p=0 $M) a=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 $M)"
echo "NOI26 DONE"
