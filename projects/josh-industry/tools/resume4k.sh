#!/bin/bash
# Restart any 4K job that is not running (after a container restart). Safe to run any time.
S=/tmp/claude-0/-home-user/8a93c893-78da-55f6-95ba-70a8b48271ee/scratchpad/new; R=/home/user/better-videos/projects
run() { pgrep -f "^/bin/bash $S/$1" > /dev/null; }
if ! run "gfx4k.sh"; then
  rm -f $R/josh-oct2*/out/long4k/chunks/*.part
  ( setsid nohup $S/gfx4k.sh josh-oct23 josh-oct21 josh-oct22 >> $S/gfx4k-1.log 2>&1 < /dev/null & )
  sleep 5
  ( setsid nohup $S/gfx4k.sh josh-oct21 josh-oct23 josh-oct22 >> $S/gfx4k-2.log 2>&1 < /dev/null & )
  echo "restarted gfx4k"
fi
grep -q "SRC4K FINISHED" $S/src4k.log 2>/dev/null || run "src4k.sh" || { ( setsid nohup $S/src4k.sh >> $S/src4k.log 2>&1 < /dev/null & ); echo "restarted src4k"; }
for x in "josh-oct23|$S/oct23-0001/face-long-4k|$S/oct23-0001/audio48.wav|whole" "josh-oct21|$S/oct21-0004/face-long-4k|$S/oct21-0004/audio48.wav|lf-a lf-b" "josh-oct22|$S/oct22/face-long-4k|$S/oct22/audio48.wav|lf-1 lf-2 lf-3 lf-4 lf-5 lf-6 lf-7 lf-8"; do
  IFS='|' read -r p F A par <<< "$x"
  grep -q "FIN4K DONE" $S/fin4k-$p.log 2>/dev/null && continue
  run "fin4k.sh $p" || { ( setsid nohup $S/fin4k.sh $p $F $A $par >> $S/fin4k-$p.log 2>&1 < /dev/null & ); echo "restarted fin4k $p"; }
done
