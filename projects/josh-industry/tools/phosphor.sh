#!/bin/bash
# "Phosphor" finish: green monochrome CRT texture, darker and more elusive than the reference still.
#   phosphor.sh <in.mp4> <out.mp4> [height=1080]
#   env CON BRI GAM (contrast, brightness, gamma), VIG (vignette angle), SL (scanline floor, 0.62 = darker lines)
# The frame goes monochrome and green (crushed green-black shadows, pale phosphor highlights), with:
#   - ghost trails (each frame keeps a faint echo of the last two),
#   - a soft halation glow on the highlights,
#   - CRT scanlines (a dark line every 4 px at 1080p, scaled with height),
#   - a slow rolling band and a faint brightness flicker,
#   - temporal grain and a deep vignette, so the face comes out of the dark.
# Audio is copied untouched.
set -e
in=$1; out=$2; H=${3:-1080}; W=$((H * 16 / 9)); P=$((H / 360))   # scanline period: 3 px at 1080, 6 px at 4K
[ $P -lt 2 ] && P=2
F="[0:v]scale=${W}:${H}:flags=lanczos,format=yuv444p,
 tmix=frames=3:weights='1 0.45 0.2',
 eq=contrast=${CON:-1.4}:brightness=${BRI:--0.13}:saturation=0:gamma=${GAM:-0.82},
 curves=r='0/0.012 0.45/0.27 0.8/0.7 1/0.9':g='0/0.04 0.45/0.4 0.8/0.86 1/0.97':b='0/0.022 0.45/0.25 0.8/0.64 1/0.84',
 split[a][b];
 [b]gblur=sigma=$((H / 60)),eq=brightness=-0.18:contrast=1.4[glow];
 [a][glow]blend=all_mode=screen:all_opacity=0.32,
 format=yuv444p,
 gblur=sigma=1.2:sigmaV=0.01,
 geq=lum='lum(X,Y)*(${SL:-0.62}+(1-${SL:-0.62})*lt(mod(Y,${P}),${P}*0.6))*(0.93+0.07*sin(2*PI*(Y/${H}-T*0.07)*1.0))':cb='cb(X,Y)':cr='cr(X,Y)',
 eq=brightness='0.012*sin(2*PI*t*0.9)+0.006*sin(2*PI*t*7.3)':eval=frame,
 noise=c0s=9:c0f=t,
 vignette=angle=${VIG:-PI/2.9}:mode=forward,
 format=yuv420p[v]"
ffmpeg -nostdin -v error -y -i "$in" -filter_complex "$(echo $F | tr -d '\n')" -map "[v]" -map 0:a? -c:v libx264 -preset medium -crf 17 -profile:v high -c:a copy -movflags +faststart "$out"
