#!/bin/bash
# usage: measure.sh in.mp4 outprefix
f="$1"; o="$2"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
ffmpeg -nostdin -hide_banner -i "$f" -an -vf "scale=320:-1,select='gt(scene,0.2)',metadata=print:file=$o.scenes.txt" -f null - 2>/dev/null
ffmpeg -nostdin -hide_banner -i "$f" -vn -af "silencedetect=noise=-40dB:d=0.6" -f null - 2> $o.sil.txt
ffmpeg -nostdin -hide_banner -i "$f" -vn -af "ebur128" -f null - 2> $o.loud.txt
echo "$dur" > $o.dur
