#!/bin/bash
# usage: sheet.sh out.jpg still1 still2 ... (2x2 or 1x2 grid of stills from out/stills)
o=$1; shift; d=projects/silver-lab/out/stills; args=(); for f in "$@"; do args+=(-i "$d/$f.jpg"); done
n=$#; if [ $n -eq 4 ]; then fc="[0][1]hstack[a];[2][3]hstack[b];[a][b]vstack,scale=1920:-1"; elif [ $n -eq 2 ]; then fc="[0][1]hstack,scale=1920:-1"; else fc="[0]scale=1920:-1"; fi
ffmpeg -loglevel error -y "${args[@]}" -filter_complex "$fc" -q:v 3 "$o"
