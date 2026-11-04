#!/usr/bin/env bash
# Composite each FAQ cut once its graphics and face clips exist, then make a small web copy
# (well under the 15 MB artifact-asset limit) and a poster frame. Re-run safely: finished cuts are skipped.
#   bash vsl/finish-faqs.sh <recording.mp4> <face-dir>      # from projects/owners-academy-sales
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=$1 FACE=$2
for tl in vsl/timeline-faq-*.json; do
  name=$(basename "$tl" .json); name=${name#timeline-}
  out="out/faq/$name"
  [ -f "$out/$name-web.mp4" ] && continue
  [ -f "$out/graphics.mp4" ] || { echo "skip $name: graphics not rendered"; continue; }
  missing=$(python3 -c "
import json, os, sys
tl = json.load(open('$tl'))
print(' '.join(s['id'] for s in tl['segments'] if s['kind'] == 'clip' and not os.path.exists(os.path.join('$FACE', s['id'] + '.mp4'))))")
  [ -z "$missing" ] || { echo "skip $name: face clips missing: $missing"; continue; }
  cp out/b2b/face-mask.png out/b2b/face-frame.png "$out/"
  rm -rf "$out/parts"
  python3 vsl/composite.py "$SRC" "$tl" "$FACE" "$out" "$name.mp4" | tail -1
  ffmpeg -v error -y -i "$out/$name.mp4" -vf hqdn3d=2:1.5:4:3 -c:v libx264 -preset slow -tune stillimage \
    -b:v 380k -maxrate 900k -bufsize 1800k -c:a aac -b:a 64k -ac 1 -movflags +faststart "$out/$name-web.mp4"
  ffmpeg -v error -y -ss 1.6 -i "$out/$name.mp4" -frames:v 1 -vf scale=1280:-2 -q:v 4 "$out/$name-poster.jpg"
  echo "done $name $(du -h "$out/$name-web.mp4" | cut -f1)"
done
