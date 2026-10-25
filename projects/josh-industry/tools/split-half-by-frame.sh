#!/bin/bash
# 23 Oct second half: cut by frame number (time-based -ss/-to dropped the last 1.4 s of picture), 2-pass HEVC.
out=/home/user/better-videos/projects/josh-oct23/out/long; M=$out/long-master-x264.mp4
N0=$(ffprobe -v error -select_streams v -count_packets -show_entries stream=nb_read_packets -of csv=p=0 $out/long-part1.mp4)
T0=$(python3 -c "print($N0 * 1001 / 24000)")
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $M)
vb=$(python3 -c "print(int(28.5 * 8 * 1000 / ($dur - $T0) - 128))")
F="-vf trim=start_frame=$N0,setpts=PTS-STARTPTS -af atrim=start=$T0,asetpts=PTS-STARTPTS"
rm -f $out/x265-p2.log*
for pass in 1 2; do
  if [ $pass = 1 ]; then o="-an -f null /dev/null"; else o="-tag:v hvc1 -c:a aac -b:a 128k -movflags +faststart $out/long-part2.new.mp4"; fi
  ffmpeg -nostdin -v error -y -i $M $F -c:v libx265 -preset slow -b:v ${vb}k -x265-params pass=$pass:stats=$out/x265-p2.log:aq-mode=3:log-level=error $o
done
v=$(ffprobe -v error -select_streams v -show_entries stream=duration -of csv=p=0 $out/long-part2.new.mp4)
a=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 $out/long-part2.new.mp4)
n=$(ffprobe -v error -select_streams v -count_packets -show_entries stream=nb_read_packets -of csv=p=0 $out/long-part2.new.mp4)
echo "N0=$N0 frames=$n v=$v a=$a"
python3 -c "import sys; sys.exit(0 if abs($v-$a) < 0.1 and $N0 + $n == 19920 else 1)" && mv $out/long-part2.new.mp4 $out/long-part2.mp4 && rm -f $out/x265-p2.log* && echo "PART2 FIXED" || echo "PART2 STILL BAD"
