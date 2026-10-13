# encode chat/upload copies for every finished episode that doesn't have one yet (loops until the batch is done)
cd /home/user/better-videos
while true; do
  for i in 01 02 03 04 05 06 07 08 09 10; do
    src=projects/m1-$i/out/m1-$i.mp4; dst=projects/micro1/out/micro1-$i.mp4
    if [ -f "$src" ] && [ ! -f "$dst" ] && grep -q "m1-$i OK" projects/micro1/batch.log; then
      # 2-pass at 1.3 Mb/s video: under the 30 MB chat limit for a 2.5-minute short
      ( cd projects/micro1/out && ffmpeg -nostdin -v error -y -i "../../../$src" -c:v libx264 -preset slow -b:v 1300k -pass 1 -passlogfile p$i -pix_fmt yuv420p -an -f mp4 /dev/null && \
        ffmpeg -nostdin -v error -y -i "../../../$src" -c:v libx264 -preset slow -b:v 1300k -pass 2 -passlogfile p$i -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "micro1-$i.tmp.mp4" && rm -f p$i* ) && mv "$dst.tmp.mp4" "$dst" 2>/dev/null; mv "projects/micro1/out/micro1-$i.tmp.mp4" "$dst" 2>/dev/null; echo "micro1-$i ready $(du -m $dst | cut -f1)MB" >> projects/micro1/deliver.log
      rm -f projects/m1-$i/out/picture-fin.mp4
    fi
  done
  grep -q ALL_DONE projects/micro1/batch.log && [ "$(ls projects/micro1/out/micro1-*.mp4 | grep -vc tmp)" -ge 10 ] && { echo DELIVER_DONE >> projects/micro1/deliver.log; exit; }
  sleep 30
done
