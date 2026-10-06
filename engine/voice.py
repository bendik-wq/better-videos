#!/usr/bin/env python3
"""Narration: synthesise every shot's VO and align it to word-level timestamps.

usage: voice.py jobs.json
jobs.json = {"voice": {...}, "cache": dir, "shots": [{"id", "text"}]}
Writes <cache>/<id>-<hash>.wav and .words.json; prints a JSON map id -> {wav, words, dur}.

Engines:
  kokoro      (default, offline)  voice: {"engine":"kokoro","name":"af_heart","speed":1.0}
  elevenlabs  (needs ELEVENLABS_API_KEY) voice: {"engine":"elevenlabs","voiceId":"...","model":"eleven_multilingual_v2"}
  piper       (fallback)          voice: {"engine":"piper","model":"en_US-ryan-high"}
"""
import hashlib, json, os, subprocess, sys, wave
import numpy as np

jobs = json.load(open(sys.argv[1]))
V = jobs["voice"]; cache = jobs["cache"]; root = jobs.get("root", ".")
os.makedirs(cache, exist_ok=True)
SR = 24000
_kokoro = _whisper = None


def write_wav(path, audio, sr):
    a = np.clip(audio, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32767).astype("<i2").tobytes())


def say_kokoro(text, path):
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(root, ".cache/kokoro/kokoro-v1.0.onnx"), os.path.join(root, ".cache/kokoro/voices-v1.0.bin"))
    name = V.get("name", "af_heart")
    audio, sr = _kokoro.create(text, voice=name, speed=V.get("speed", 1.0), lang="en-gb" if name.startswith("b") else "en-us")
    write_wav(path, audio, sr)


def say_elevenlabs(text, path):
    import urllib.request
    key = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{V['voiceId']}?output_format=pcm_24000",
        data=json.dumps({"text": text, "model_id": V.get("model", "eleven_multilingual_v2"),
                         "voice_settings": V.get("settings", {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2})}).encode(),
        headers={"xi-api-key": key, "content-type": "application/json"})
    pcm = np.frombuffer(urllib.request.urlopen(req).read(), dtype="<i2").astype(np.float32) / 32767
    write_wav(path, pcm, 24000)


def say_piper(text, path):
    subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(root, ".cache/voices", V["model"] + ".onnx"), "-f", path,
                    "--length-scale", str(V.get("lengthScale", 1.0))], input=text.encode(), check=True, capture_output=True)


def align(path):
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("base.en", device="cpu", compute_type="int8")
    segs, _ = _whisper.transcribe(path, word_timestamps=True, language="en")
    return [{"w": w.word.strip(), "s": round(float(w.start), 3), "e": round(float(w.end), 3)} for s in segs for w in s.words]


def script_align(text, heard):
    """Map the script's own words onto whisper's timings. Whisper writes numbers as digits and
    mishears names, so matched words take whisper's times and the rest are interpolated
    between neighbouring anchors. Visual cues can then key off the words as written."""
    import difflib, re
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    toks = text.split()
    a = [norm(t) for t in toks]; b = [norm(w["w"]) for w in heard]
    times = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (heard[blk.b + k]["s"], heard[blk.b + k]["e"])
    end = heard[-1]["e"] if heard else 0.0
    # character-weighted interpolation for unmatched runs
    i = 0
    while i < len(toks):
        if times[i] is not None: i += 1; continue
        j = i
        while j < len(toks) and times[j] is None: j += 1
        t0 = times[i - 1][1] if i > 0 else 0.0
        t1 = times[j][0] if j < len(toks) else end
        w = [max(1, len(a[k])) for k in range(i, j)]; tot = sum(w); acc = 0
        for k in range(i, j):
            s0 = t0 + (t1 - t0) * acc / tot; acc += w[k - i]; times[k] = (s0, t0 + (t1 - t0) * acc / tot)
        i = j
    return [{"w": t, "s": round(x[0], 3), "e": round(x[1], 3)} for t, x in zip(toks, times)]


ENGINES = {"kokoro": say_kokoro, "elevenlabs": say_elevenlabs, "piper": say_piper}
out = {}
for s in jobs["shots"]:
    key = hashlib.sha1(json.dumps([V, s["text"]]).encode()).hexdigest()[:12]
    wav = os.path.join(cache, f"{s['id']}-{key}.wav"); wj = wav[:-4] + ".words.json"
    if not os.path.exists(wav):
        print(f"[vo] {s['id']}", file=sys.stderr)
        ENGINES[V.get("engine", "kokoro")](s["text"], wav)
    if not os.path.exists(wj):
        json.dump(align(wav), open(wj, "w"))
    with wave.open(wav) as w: dur = w.getnframes() / w.getframerate()
    out[s["id"]] = {"wav": wav, "words": script_align(s.get("display", s["text"]), json.load(open(wj))), "dur": dur}
print(json.dumps(out))
