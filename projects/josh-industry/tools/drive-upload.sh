#!/bin/bash
# Session URL comes from a Drive resumable-upload POST (made via the Zapier Google Drive API request action). The URL is a bearer credential: keep it out of the repo.
# Upload a file into a Google Drive resumable session URL (from Zapier), resuming on failure.
#   gup.sh <session-url-file> <file>
U=$(cat "$1"); F=$2; N=$(stat -c %s "$F")
for try in $(seq 1 30); do
  # ask the session how much it already has
  r=$(curl -sS -m 60 -X PUT -H "Content-Length: 0" -H "Content-Range: bytes */$N" -D - -o /tmp/gup.body "$U" | tr -d '\r')
  code=$(echo "$r" | grep '^HTTP/' | tail -1 | awk '{print $2}')
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then echo "UPLOAD DONE $F"; cat /tmp/gup.body; exit 0; fi
  off=0; rng=$(echo "$r" | grep -i '^range:' | sed 's/.*-//'); [ -n "$rng" ] && off=$((rng + 1))
  echo "try $try: resuming at $off of $N"
  tail -c +$((off + 1)) "$F" | curl -sS -X PUT -H "Content-Length: $((N - off))" -H "Content-Range: bytes $off-$((N - 1))/$N" --data-binary @- -o /tmp/gup.body -w "%{http_code}\n" "$U" && grep -q '"id"' /tmp/gup.body && { echo "UPLOAD DONE $F"; cat /tmp/gup.body; exit 0; }
  sleep 10
done
echo "UPLOAD FAIL $F"
