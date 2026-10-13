# Disk-light delivery: once all 164 chunks exist and the renderer has exited (its own concat cannot fit on disk),
# encode the 1080p60 upload file straight from the chunk list + mix.wav, then the six 720p chat parts from it.
cd /home/user/better-videos/projects/blackout/out
CH=chunks-fcd22d0a47
until [ "$(ls $CH | grep -c '^c-[0-9]*-[0-9]*\.mp4$')" -ge 164 ] && ! kill -0 $(python3 -c "import json;print(json.load(open('progress.json'))['pid'])") 2>/dev/null; do sleep 30; done
rm -f picture-fin.mp4 blackout.mp4   # partial files from the renderer's own concat, if any
ls $CH | grep '^c-[0-9]*-[0-9]*\.mp4$' | sort -t- -k2 -n | sed "s#^#file '$PWD/$CH/#; s#\$#'#" > deliver/list.txt
cd deliver
ffmpeg -v error -y -f concat -safe 0 -i list.txt -i ../mix.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 19 -maxrate 14M -bufsize 28M -tune grain -pix_fmt yuv420p -g 120 -c:a aac -b:a 192k -shortest -movflags +faststart blackout-1080p60.mp4 && echo "1080p done"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 blackout-1080p60.mp4); L=$(python3 -c "print($D/6)")
for i in $(seq 0 5); do S=$(python3 -c "print($i*$L)")
  ffmpeg -v error -y -ss $S -t $L -i blackout-1080p60.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -b:v 1250k -pass 1 -passlogfile p$i -an -f mp4 /dev/null
  ffmpeg -v error -y -ss $S -t $L -i blackout-1080p60.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -b:v 1250k -pass 2 -passlogfile p$i -c:a aac -b:a 96k -movflags +faststart part$((i+1)).mp4
  echo "part $((i+1)) done"
done
rm -f p*.log*
echo ALL_DONE
