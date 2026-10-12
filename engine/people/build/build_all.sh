#!/bin/bash
# Rebuild the wardrobe + clips. Needs Blender 4.2 with MPFB2 and the MakeHuman asset packs listed
# in assets/CREDITS.md installed in MPFB's user data dir, and the CMU BVHs in $CMU.
#   BLENDER=/opt/tools/blender-4.2.23-linux-x64/blender CMU=/path/to/bvh engine/people/build/build_all.sh [ids]
set -e
H=$(cd "$(dirname "$0")" && pwd); ROOT=$H/../../..; RAW=${RAW:-/tmp/people-raw}; mkdir -p $RAW
$BLENDER -b --factory-startup --python $H/mpfb_build.py -- ${1:-all} $RAW 2>&1 | grep -E "^\[build\]|Error"
for f in $RAW/*.glb; do case $f in *_lod1.glb) cp $f $ROOT/assets/people/wardrobe/;; *) python3 -I $H/pack.py $f $ROOT/assets/people/wardrobe/$(basename $f);; esac; done
[ -n "$CMU" ] && python3 $H/retarget.py $ROOT/assets/people/wardrobe/suit.glb $CMU $ROOT/assets/people/clips.glb
