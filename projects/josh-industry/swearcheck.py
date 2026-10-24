"""Re-transcribe finished Reels and flag any profanity that survived the edit.
    python3 swearcheck.py <video.mp4> [...]
Prints one line per file: OK, or the offending words with their times."""
import re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

BAD = re.compile(r"\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|retard\w*|bastard\w*|dick\w*|ass(hole)?)\b", re.I)
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=2)
for f in sys.argv[1:]:
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(a, beam_size=5, word_timestamps=True)
    hits = [f"{w.word.strip()}@{w.start:.1f}" for s in segs for w in s.words if BAD.search(w.word)]
    print(f.rsplit("/", 1)[-1], "OK" if not hits else "PROFANITY: " + ", ".join(hits), flush=True)
