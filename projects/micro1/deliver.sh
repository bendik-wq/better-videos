# encode chat/upload copies for every finished episode that doesn't have one yet (loops until the batch is done)
cd /home/user/better-videos
while true; do
  for i in 01 02 03 04 05 06 07 08 09 10; do
    src=projects/m1-$i/out/m1-$i.mp4; dst=projects/micro1/out/micro1-$i.mp4
    if [ -f "$src" ] && [ ! -f "$dst" ] && grep -q "m1-$i OK" projects/micro1/batch.log; then
      ffmpeg -nostdin -v error -y -i "$src" -c:v libx264 -preset medium -crf 23 -maxrate 2.2M -bufsize 4.4M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$dst.tmp.mp4" && mv "$dst.tmp.mp4" "$dst" && echo "micro1-$i ready" >> projects/micro1/deliver.log
      rm -f projects/m1-$i/out/picture-fin.mp4
    fi
  done
  grep -q ALL_DONE projects/micro1/batch.log && [ "$(ls projects/micro1/out/micro1-*.mp4 | grep -vc tmp)" -ge 10 ] && { echo DELIVER_DONE >> projects/micro1/deliver.log; exit; }
  sleep 30
done
