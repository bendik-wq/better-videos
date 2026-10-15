#!/usr/bin/env bash
# Render the graphics layer for every FAQ cut, one cut at a time. Safe to run several copies in
# parallel (each claims a cut with a .part file) and to re-run after a kill (finished cuts are
# skipped; delete stale *.part files first).
#   bash vsl/render-faqs.sh            # from projects/owners-academy-sales
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(cd ../.. && pwd)
for tl in vsl/timeline-faq-*.json; do
  name=$(basename "$tl" .json); name=${name#timeline-}
  out="out/faq/$name"
  mkdir -p "$out"
  [ -f "$out/graphics.mp4" ] && continue
  ( set -o noclobber; : > "$out/graphics.part" ) 2>/dev/null || continue   # another worker has it
  (cd "$ROOT" && node projects/owners-academy-sales/vsl/render.mjs "projects/owners-academy-sales/$tl" \
    "projects/owners-academy-sales/$out/graphics.part.mp4")
  mv "$out/graphics.part.mp4" "$out/graphics.mp4"
  rm -f "$out/graphics.part"
  echo "done $name"
done
