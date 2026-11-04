# All 20 micro1 videos: render + encode a <30 MB delivery copy for each.
cd /home/user/better-videos

for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20; do
  node engine/render.mjs projects/m1-$i > projects/m1-$i/render.log 2>&1
  src=projects/m1-$i/out/m1-$i.mp4
  if [ -f $src ]; then
    echo "m1-$i OK $(ffprobe -v error -show_entries format=duration -of csv=p=0 $src)" >> projects/micro1/batch.log
    ( cd projects/micro1/out && ffmpeg -nostdin -v error -y -i ../../../$src -c:v libx264 -preset slow -b:v 1300k -pass 1 -passlogfile p$i -pix_fmt yuv420p -an -f mp4 /dev/null && \
      ffmpeg -nostdin -v error -y -i ../../../$src -c:v libx264 -preset slow -b:v 1300k -pass 2 -passlogfile p$i -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart micro1-$i.mp4 && rm -f p$i* )
    echo "micro1-$i ready $(du -m projects/micro1/out/micro1-$i.mp4 | cut -f1)MB" >> projects/micro1/batch.log
  else echo "m1-$i FAIL $(grep -m1 'Error' projects/m1-$i/render.log)" >> projects/micro1/batch.log; fi
  rm -rf projects/m1-$i/out/chunks-* projects/m1-$i/out/picture-fin.mp4
done
echo ALL_DONE >> projects/micro1/batch.log
