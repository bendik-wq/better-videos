#!/bin/bash
# 27 Oct (DJI 0009): wait until the file is link-shared, download, verify, audio, transcript, face track.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad; O=$S/oct16; d=$S/new/oct27-0009
URL="https://drive.usercontent.google.com/download?id=1Mj671xn_1OgkU66JwgY4-odiPz0Asr98&export=download&confirm=t"
if [ ! -f $d/rec.mp4 ]; then
  until [ "$(curl -sSL -m 60 -r 0-1023 -o /dev/null -w '%{content_type}' "$URL")" = "video/mp4" ]; do sleep 60; done
  echo "$(date -u +%H:%M) shared, downloading"
  for k in $(seq 1 40); do curl -sSL -C - -o $d/rec.part "$URL" && [ "$(stat -c %s $d/rec.part)" = "1903266048" ] && break; head -c 15 $d/rec.part | grep -q DOCTYPE && rm -f $d/rec.part; sleep 60; done
  [ "$(stat -c %s $d/rec.part)" = "1903266048" ] || { echo "FAIL size"; exit 1; }
  mv $d/rec.part $d/rec.mp4
fi
echo "DOWNLOADED 27"
[ -f $d/audio48.wav ] || { ffmpeg -nostdin -v error -y -i $d/rec.mp4 -vn -ac 1 -ar 16000 $d/audio.wav; ffmpeg -nostdin -v error -y -i $d/rec.mp4 -vn -ac 2 -ar 48000 -c:a pcm_s16le $d/audio48.wav; }
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,start_time -of compact $d/rec.mp4 > $d/probe.txt
echo "AUDIO 27 $(head -2 $d/probe.txt)"
[ -f $d/words.json ] || { python3 $O/tx.py < /dev/null $d/audio.wav $d/words.json $d/transcript.txt > /dev/null && echo "TRANSCRIBED 27"; }
[ -f $d/track.json ] || { python3 $O/track.py $d/rec.mp4 $d/track.json < /dev/null && echo "TRACKED 27"; }
touch $d/prep.done; echo "PREP DONE 27"
