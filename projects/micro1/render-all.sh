# Render all ten micro1 shorts in sequence (detached); one log per episode, a summary line per episode in batch.log.
cd /home/user/better-videos
for i in 01 02 03 04 05 06 07 08 09 10; do
  node engine/render.mjs projects/m1-$i > projects/m1-$i/render.log 2>&1
  if [ -f projects/m1-$i/out/m1-$i.mp4 ]; then echo "m1-$i OK $(ffprobe -v error -show_entries format=duration -of csv=p=0 projects/m1-$i/out/m1-$i.mp4)"; else echo "m1-$i FAIL $(grep -m1 'Error' projects/m1-$i/render.log)"; fi >> projects/micro1/batch.log
  rm -rf projects/m1-$i/out/chunks-*
done
echo ALL_DONE >> projects/micro1/batch.log
