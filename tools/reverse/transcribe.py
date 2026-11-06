# Words with times: python3 -I transcribe.py <video> <out.json> (faster-whisper base.en, int8 on CPU).
# Audio is decoded with ffmpeg to 16 kHz mono floats (the installed PyAV breaks faster-whisper's own decoder).
import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
m = WhisperModel("base.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, word_timestamps=True, language="en", vad_filter=True)
words = [{"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3)} for s in segs for w in (s.words or [])]
json.dump(words, open(sys.argv[2], "w"))
