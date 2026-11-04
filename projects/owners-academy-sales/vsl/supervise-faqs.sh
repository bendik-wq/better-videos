#!/usr/bin/env bash
# Keep the FAQ pipeline moving until every FAQ has a web copy: restart the face upscale or the
# graphics workers if they were stopped, and finish cuts as their pieces land. Run detached:
#   nohup bash vsl/supervise-faqs.sh <recording.mp4> <face-dir> <models-dir> > supervise.log 2>&1 &
cd "$(dirname "$0")/.."
SRC=$1 FACE=$2 MODELS=$3
IDS=$(python3 -c "
import json, glob
ids = []
for p in sorted(glob.glob('vsl/timeline-faq-*.json')):
    ids += [s['id'] for s in json.load(open(p))['segments'] if s['kind'] == 'clip']
print(' '.join(dict.fromkeys(ids)))")
while :; do
  n=$(ls out/faq/*/*-web.mp4 2>/dev/null | wc -l)
  [ "$n" -ge "$(ls vsl/timeline-faq-*.json | wc -l)" ] && { echo "all done"; exit 0; }
  if ! pgrep -f "vsl/face.py" >/dev/null; then
    missing=0; for i in $IDS; do [ -f "$FACE/$i.mp4" ] || missing=1; done
    if [ $missing = 1 ]; then rm -f "$FACE"/*.part.mp4; echo "$(date +%T) restart face"; nohup python3 vsl/face.py "$SRC" snapped.json "$MODELS" "$FACE" $IDS >> face.log 2>&1 & fi
  fi
  if ! pgrep -f "render-faqs.sh" >/dev/null && ls vsl/timeline-faq-*.json | while read t; do n=$(basename $t .json); [ -f "out/faq/${n#timeline-}/graphics.mp4" ] || echo x; done | grep -q x; then
    rm -f out/faq/*/graphics.part out/faq/*/graphics.part.mp4
    echo "$(date +%T) restart graphics workers"
    for w in 1 2; do nohup bash vsl/render-faqs.sh >> render-faqs.log 2>&1 & sleep 3; done
  fi
  pgrep -f "vsl/composite.py|finish-faqs.sh" >/dev/null || bash vsl/finish-faqs.sh "$SRC" "$FACE" 2>&1 | grep -v "^skip"
  sleep 60
done
