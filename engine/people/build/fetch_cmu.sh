#!/bin/bash
# Fetch the CMU mocap BVHs used by clips.py (Hahne's BVH conversion, mirrored on GitHub; raw URLs).
#   engine/people/build/fetch_cmu.sh <outdir>
set -e; D=${1:-/tmp/cmu-bvh}; mkdir -p $D
R=https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data
for c in $(python3 -c "import sys; sys.path.insert(0, '$(dirname $0)'); from clips import CLIPS; print(' '.join(sorted({s['src'] for s in CLIPS.values()} | {s['upper']['src'] for s in CLIPS.values() if 'upper' in s})))"); do
  s=${c%%_*}; s3=$(printf "%03d" $((10#$s))); [ -f $D/$c.bvh ] || curl -sSf -o $D/$c.bvh $R/$s3/$c.bvh; done
echo "[cmu] $(ls $D/*.bvh | wc -l) files in $D"
