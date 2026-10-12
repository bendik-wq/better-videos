#!/usr/bin/env python3
"""Narration: synthesise every shot's VO and align it to word-level timestamps.

usage: voice.py jobs.json
jobs.json = {"voice": {...}, "cache": dir, "shots": [{"id", "text", "display"?}]}
Writes <cache>/<id>-<hash>.wav and .words.json; prints a JSON map id -> {wav, words, dur}.

Engines:
  kokoro      (default, offline)  voice: {"engine":"kokoro","name":"af_heart","speed":1.0}
  elevenlabs  (needs ELEVENLABS_API_KEY) voice: {"engine":"elevenlabs","voiceId":"...","model":"eleven_multilingual_v2"}
  piper       (fallback)          voice: {"engine":"piper","model":"en_US-ryan-high"}

Kokoro extras (all optional; see engine/music/vo.py and docs/audio/voice.md):
  "prosody": true      sentence/line-level synthesis with punctuation-driven pauses, per-line speed
                       (slower reveals), and *emphasis* markup (vowel lengthening in phoneme input).
                       Markup: *word* emphasis, "> " line prefix = reveal, "|" = beat. Captions and
                       word timings never show the markup.
  "pauses": {".": 0.38, "\\n": 0.55, ...}   override pause lengths (s)
  "revealSlow": 0.9    speed factor on reveal lines
  "fx": "doc"          documentary voice chain at 48 kHz (HPF, de-box, presence, de-esser, 2.5:1
                       compression, subtle room, per-line loudness). false = raw Kokoro at 24 kHz.
  "name": "af_heart:0.7,af_bella:0.3"   blend voices (weighted style vectors)
prosody and fx default to on for kokoro; set them false to reproduce the old output exactly.
"""
import hashlib, json, os, re, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SR = 24000
_kokoro = _whisper = None
V = {}; root = "."


def write_wav(path, audio, sr):
    a = np.clip(audio, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32767).astype("<i2").tobytes())


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(root, ".cache/kokoro/kokoro-v1.0.onnx"), os.path.join(root, ".cache/kokoro/voices-v1.0.bin"))
    return _kokoro


def voice_style(name):
    """'af_heart' or a blend 'af_heart:0.7,af_bella:0.3' -> (style or name, lang)."""
    k = kokoro()
    parts = [p.strip() for p in re.split(r"[,+]", name) if p.strip()]
    lang = "en-gb" if parts[0].startswith("b") else "en-us"
    if len(parts) == 1 and ":" not in parts[0]:
        return parts[0], lang
    ws = [(p.split(":")[0], float(p.split(":")[1]) if ":" in p else 1.0) for p in parts]
    tot = sum(w for _, w in ws)
    return sum(k.get_voice_style(n) * (w / tot) for n, w in ws), lang


def use_prosody():
    return V.get("engine", "kokoro") == "kokoro" and V.get("prosody", True)


def use_fx():
    return V.get("fx", "doc") not in (False, None, "none", "off")


def say_kokoro(text, path):
    k = kokoro()
    name = V.get("name", "af_heart")
    style, lang = voice_style(name)
    base = V.get("speed", 1.0)
    if not use_prosody():
        audio, sr = k.create(text, voice=style, speed=base, lang=lang)
        return finish(audio, sr, path)
    from music import vo
    parts = []
    for u in vo.split_units(text):
        ph = vo.emphasise(k.tokenizer.phonemize, u["text"], lang)
        if not ph.strip(): continue
        a, sr = k.create(ph, voice=style, speed=vo.unit_speed(u, base, V.get("revealSlow", 0.9)), lang=lang, is_phonemes=True)
        f = min(len(a) // 4, int(0.006 * sr))
        if f > 1:  # de-click the joins
            a = a.copy(); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        parts += [a, np.zeros(int(vo.unit_pause(u, V.get("pauses")) * sr), dtype=a.dtype)]
    while len(parts) > 1 and not len(parts[-1]): parts.pop()
    if parts and not np.any(parts[-1]): parts.pop()  # no trailing pause: the shot's padOut owns that
    finish(np.concatenate(parts) if parts else np.zeros(sr // 10), sr, path)


def finish(audio, sr, path):
    if use_fx():
        try:
            from scipy import signal as ss
            from music import vo
            x = ss.resample_poly(np.asarray(audio, float), 48000 // np.gcd(48000, sr), sr // np.gcd(48000, sr))
            x = vo.chain(x, 48000, room=V.get("room", 0.06))
            return write_wav(path, x, 48000)
        except ImportError as e:
            print(f"[vo] fx skipped ({e}); pip install scipy", file=sys.stderr)
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
    import difflib
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


def strip_markup(t):
    if not use_prosody(): return t
    from music import vo
    return vo.strip_markup(t)


ENGINES = {"kokoro": say_kokoro, "elevenlabs": say_elevenlabs, "piper": say_piper}


def main(jobs_path):
    global V, root
    jobs = json.load(open(jobs_path))
    V = jobs["voice"]; cache = jobs["cache"]; root = jobs.get("root", ".")
    os.makedirs(cache, exist_ok=True)
    out = {}
    for s in jobs["shots"]:
        # v2 salt only when the new pipeline is on, so old caches stay valid for prosody/fx = false
        salt = [V, s["text"]] + ([["r3.1", use_prosody(), use_fx()]] if (use_prosody() or use_fx()) and V.get("engine", "kokoro") == "kokoro" else [])
        key = hashlib.sha1(json.dumps(salt).encode()).hexdigest()[:12]
        wav = os.path.join(cache, f"{s['id']}-{key}.wav"); wj = wav[:-4] + ".words.json"
        if not os.path.exists(wav):
            print(f"[vo] {s['id']}", file=sys.stderr)
            ENGINES[V.get("engine", "kokoro")](s["text"], wav)
        if not os.path.exists(wj):
            json.dump(align(wav), open(wj, "w"))
        with wave.open(wav) as w: dur = w.getnframes() / w.getframerate()
        out[s["id"]] = {"wav": wav, "words": script_align(strip_markup(s.get("display", s["text"])), json.load(open(wj))), "dur": dur}
    print(json.dumps(out))


if __name__ == "__main__":
    main(sys.argv[1])
