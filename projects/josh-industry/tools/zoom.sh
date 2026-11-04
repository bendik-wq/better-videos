#!/bin/bash
# zoom.sh <video> <out.jpg> t1 t2 ...  -> one row per time: 8 frames at 4 fps from t-1 to t+1, labelled with output time
v=$1; o=$2; shift 2; rows=()
for t in "$@"; do s=$(python3 -c "print(max(0,$t-1))"); f=$o.$t.jpg; ffmpeg -nostdin -v error -y -ss $s -i $v -t 2 -vf "fps=4,scale=180:320,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=18:fontcolor=yellow,tile=8x1" -frames:v 1 $f 2>/dev/null || ffmpeg -nostdin -v error -y -ss $s -i $v -t 2 -vf "fps=4,scale=180:320,tile=8x1" -frames:v 1 $f; rows+=($f); done
python3 -c "
import sys
from PIL import Image
ims=[Image.open(f) for f in sys.argv[2:]]; c=Image.new('RGB',(ims[0].width,sum(i.height for i in ims))); y=0
for i in ims: c.paste(i,(0,y)); y+=i.height
c.save(sys.argv[1])" $o "${rows[@]}"
