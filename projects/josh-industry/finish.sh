#!/usr/bin/env bash
# Join the graphics chunks, composite Josh's panel and audio, then make a web copy and poster.
#   bash finish.sh <recording.mp4> <face-dir> [timeline.json] [out-dir] [name]
#   bash finish.sh rec.mp4 face timeline-long.json out/long josh-which-industry-long
set -euo pipefail
cd "$(dirname "$0")"
SRC=$1 FACE=$2 TL=${3:-timeline.json} OUT=${4:-out} NAME=${5:-josh-which-industry}
ls $OUT/chunks/chunk-*.mp4 | grep -v part | sed "s|^|file '$PWD/|; s|$|'|" > $OUT/chunks.txt
ffmpeg -v error -y -f concat -safe 0 -i $OUT/chunks.txt -c copy $OUT/graphics.mp4
cp ../owners-academy-sales/out/b2b/face-mask.png ../owners-academy-sales/out/b2b/face-frame.png $OUT/
rm -rf $OUT/parts
FACE_GRAIN=2 python3 ../owners-academy-sales/vsl/composite.py "$SRC" "$TL" "$FACE" $OUT $NAME.mp4 | tail -1
# web copy sized to stay under ~27 MB (the chat file limit is 30 MB)
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT/$NAME.mp4 | cut -d. -f1)
VB=$(( 27 * 8 * 1000 / DUR - 96 )); [ $VB -gt 720 ] && VB=720
ffmpeg -v error -y -i $OUT/$NAME.mp4 -c:v libx264 -preset slow -b:v ${VB}k -maxrate $((VB * 2))k -bufsize $((VB * 4))k \
  -c:a aac -b:a 96k -movflags +faststart $OUT/$NAME-web.mp4
ffmpeg -v error -y -ss 12 -i $OUT/$NAME.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 3 $OUT/$NAME-poster.jpg
ls -lh $OUT/$NAME*.mp4
