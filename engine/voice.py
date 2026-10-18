#!/usr/bin/env python3
"""Narration: synthesise every shot's VO and align it to word-level timestamps.

usage: voice.py jobs.json
jobs.json = {"voice": {...}, "cache": dir, "shots": [{"id", "text", "display"?}]}
Writes <cache>/<id>-<hash>.wav and .words.json; prints a JSON map id -> {wav, words, dur}.

Engines:
  kokoro      (default, offline)  voice: {"engine":"kokoro","name":"af_heart","speed":1.0}
  elevenlabs  (needs ELEVENLABS_API_KEY) voice: {"engine":"elevenlabs","voiceId":"...","model":"eleven_v3" | "eleven_v4",
                                    "settings":{"stability":0.5,...},"speed":1.0,"takes":3,"parallel":3,"context":true}
              Whole shot per request; | beats become ellipses; [audio tags] (e.g. [curious]) pass to the model and
              are hidden from captions; each take is Whisper-checked and retried with a new seed if words are wrong.
  piper       (fallback)          voice: {"engine":"piper","model":"en_US-ryan-high"}
  chatterbox  (offline, expressive) voice: {"engine":"chatterbox","ref":"assets/voices/stuart_bell.wav","tempo":1.05,
                                    "beat":0.3,"python":"/root/cbenv/bin/python"}
              Chatterbox Turbo cloned from a CC0 reference voice. Runs engine/tts_chatterbox.py in its own venv.
              Text is split at "|" beats and line breaks; each chunk is generated, checked with Whisper
              (regenerated with a new seed if the words come out wrong) and joined with short pauses.

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


def el_text(text):
    """Script markup -> ElevenLabs v3/v4 text: | beats become ellipses (pauses with weight), *emphasis* and > are
    dropped (v3/v4 read emphasis from context; caps can shout), [audio tags] pass through."""
    out = []
    for line in [l.strip().lstrip(">").strip() for l in text.split("\n") if l.strip()]:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        t = ""
        for k, p in enumerate(parts):
            p = re.sub(r"\*([^*]+)\*", r"\1", p)
            if k and not re.search(r"[.!?:;,…—]$", t): t += "…"
            t += (" " if t else "") + p
        out.append(t)
    return " ".join(out)


def _el_request(text, voice_id, seed, prev=None, nxt=None):
    import urllib.request, urllib.error
    key = os.environ["ELEVENLABS_API_KEY"]
    body = {"text": text, "model_id": V.get("model", "eleven_v3"), "seed": seed,
            "voice_settings": V.get("settings", {"stability": 0.5, "similarity_boost": 0.8, "style": 0.0, "use_speaker_boost": True})}
    if V.get("speed"): body["voice_settings"]["speed"] = V["speed"]
    if V.get("context", True) and prev: body["previous_text"] = prev
    if V.get("context", True) and nxt: body["next_text"] = nxt
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=pcm_24000"
    for attempt in range(5):
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"xi-api-key": key, "content-type": "application/json"})
        try:
            return np.frombuffer(urllib.request.urlopen(req, timeout=180).read(), dtype="<i2").astype(np.float32) / 32767
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            if e.code == 400 and ("previous_text" in body or "next_text" in body):  # model without request context
                body.pop("previous_text", None); body.pop("next_text", None); continue
            if e.code in (429, 500, 502, 503) and attempt < 4:
                import time; time.sleep(4 * (attempt + 1)); continue
            raise RuntimeError(f"ElevenLabs {e.code}: {msg}")


def elevenlabs_batch(todo):
    """todo = [(text, wav path, prev text, next text)]. Generated in parallel, each take checked with Whisper and
    regenerated with a new seed if its words come out wrong; the best take wins."""
    from concurrent.futures import ThreadPoolExecutor
    voice_id = V["voiceId"]

    def one(job):
        text, wav, prev, nxt = job
        t = el_text(text); best, best_w = None, 9
        for k in range(int(V.get("takes", 3))):
            a = _el_request(t, voice_id, 4242 + 7919 * k, el_text(prev) if prev else None, el_text(nxt) if nxt else None)
            tmp = wav[:-4] + f".take{k}.wav"; write_wav(tmp, a, 24000)
            w = _wer(re.sub(r"\[[^\]]*\]", " ", t), " ".join(x["w"] for x in align(tmp)))
            if w < best_w: best, best_w = a, w
            os.unlink(tmp)
            if w <= float(V.get("maxWer", 0.25)): break
            print(f"[vo] retry {os.path.basename(wav)} (WER {w:.2f})", file=sys.stderr)
        # trim the edges so the shot's padIn/padOut own the silence
        nz = np.where(np.abs(best) > 0.01)[0]
        if len(nz): best = best[max(0, nz[0] - 480): nz[-1] + 1440]
        finish(best, 24000, wav)
        print(f"[vo] {os.path.basename(wav)} ok (WER {best_w:.2f})", file=sys.stderr)

    with ThreadPoolExecutor(int(V.get("parallel", 3))) as ex: list(ex.map(one, todo))


def say_elevenlabs(text, path):
    elevenlabs_batch([(text, path, None, None)])


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
    if V.get("engine") == "elevenlabs": t = re.sub(r"\[[^\]]*\]\s*", "", t)
    if not use_prosody() and V.get("engine") not in ("chatterbox", "elevenlabs"): return t
    from music import vo
    return vo.strip_markup(t)


def cb_chunks(text):
    """Script text -> [(chunk text, pause after s)]: split at | beats and line breaks, keep sentences together."""
    beat = float(V.get("beat", 0.3)); out = []
    for li, line in enumerate([l for l in text.split("\n") if l.strip()]):
        line = line.strip().lstrip(">").strip()
        parts = [p.strip() for p in line.split("|")]
        for k, p in enumerate(parts):
            p = re.sub(r"\*([^*]+)\*", r"\1", p).strip()
            if not p: continue
            out.append([p, beat])
        if out: out[-1][1] = max(out[-1][1], 0.45)
    if out: out[-1][1] = 0.0
    return out


NUMW = set("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion point percent and a dollar dollars cents".split())


def _norm_words(t):
    """Words for the intelligibility check; numbers are dropped (Whisper writes digits, the script spells them)."""
    w = re.sub(r"[^a-z0-9 ]", " ", t.lower().replace("’", "'").replace("'", "").replace("-", " ")).split()
    return [x for x in w if x not in NUMW and not re.fullmatch(r"\d+(st|nd|rd|th|s)?", x)]


def _wer(ref, hyp):
    r, h = _norm_words(ref), _norm_words(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1])); prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def chatterbox_batch(todo, cache):
    """todo = [(text, wav path)] -> writes every wav (finished through the fx chain)."""
    import tempfile
    from scipy.io import wavfile
    py = V.get("python", "/root/cbenv/bin/python"); ref = os.path.join(root, V["ref"])
    chunks = []  # [shot index, chunk index, text, pause, raw path]
    for i, (text, wav) in enumerate(todo):
        for k, (t, pause) in enumerate(cb_chunks(text)):
            chunks.append(dict(i=i, k=k, text=t, pause=pause, raw=f"{wav[:-4]}.c{k}.raw.wav", seed=1000 + k, wer=9))
    pending = chunks
    for attempt in range(4):
        if not pending: break
        job = dict(ref=ref, temperature=V.get("temperature", 0.8), items=[dict(text=c["text"], out=c["raw"], seed=c["seed"]) for c in pending])
        jf = tempfile.NamedTemporaryFile("w", suffix=".json", dir=cache, delete=False); json.dump(job, jf); jf.close()
        env = dict(os.environ, TQDM_DISABLE="1", HF_HUB_DISABLE_PROGRESS_BARS="1")
        subprocess.run([py, os.path.join(HERE, "tts_chatterbox.py"), jf.name], check=True, env=env, stdout=sys.stderr)
        os.unlink(jf.name)
        again = []
        for c in pending:  # intelligibility check: regenerate a chunk whose words come out wrong
            heard = " ".join(w["w"] for w in align(c["raw"]))
            w = _wer(c["text"], heard)
            if w < c["wer"]: c["best"], c["wer"] = c["raw"] + ".best.wav", w; os.replace(c["raw"], c["best"])
            if c["wer"] > float(V.get("maxWer", 0.25)) and attempt < 3:
                c["seed"] += 7919; again.append(c)
                print(f"[vo] retry {os.path.basename(c['raw'])} (WER {w:.2f}): {c['text'][:60]}", file=sys.stderr)
        pending = again
    for c in chunks:
        if os.path.exists(c["raw"]): os.unlink(c["raw"])
    tempo = float(V.get("tempo", 1.0))
    for i, (text, wav) in enumerate(todo):
        parts, sr = [], 24000
        for c in [c for c in chunks if c["i"] == i]:
            sr, a = wavfile.read(c["best"]); a = a.astype(np.float32) / (32768.0 if a.dtype == np.int16 else 1.0)
            if a.ndim > 1: a = a.mean(axis=1)
            # trim leading/trailing silence so the beat pauses are ours
            nz = np.where(np.abs(a) > 0.01)[0]
            if len(nz): a = a[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.06 * sr)]
            f = min(len(a) // 4, int(0.006 * sr))
            if f > 1: a = a.copy(); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
            parts += [a, np.zeros(int(c["pause"] / tempo * sr), np.float32)]
            os.unlink(c["best"])
        audio = np.concatenate(parts) if parts else np.zeros(sr // 10, np.float32)
        if abs(tempo - 1.0) > 1e-3:  # pitch-preserving speed-up with ffmpeg atempo
            tmp = wav[:-4] + ".tempo.wav"; write_wav(tmp + ".in.wav", audio, sr)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp + ".in.wav", "-filter:a", f"atempo={tempo}", tmp], check=True)
            sr, audio = wavfile.read(tmp); audio = audio.astype(np.float32) / 32768.0; os.unlink(tmp); os.unlink(tmp + ".in.wav")
        finish(audio, sr, wav)


def say_chatterbox(text, path):
    chatterbox_batch([(text, path)], os.path.dirname(path) or ".")


ENGINES = {"chatterbox": say_chatterbox, "kokoro": say_kokoro, "elevenlabs": say_elevenlabs, "piper": say_piper}


def main(jobs_path):
    global V, root
    jobs = json.load(open(jobs_path))
    V = jobs["voice"]; cache = jobs["cache"]; root = jobs.get("root", ".")
    os.makedirs(cache, exist_ok=True)
    out = {}
    if V.get("engine") == "elevenlabs":  # parallel requests, with neighbouring lines as context
        todo, sh = [], jobs["shots"]
        for i, s in enumerate(sh):
            key = hashlib.sha1(json.dumps([{k: v for k, v in V.items() if k != "say"}, s["text"], "el1"]).encode()).hexdigest()[:12]
            wav = os.path.join(cache, f"{s['id']}-{key}.wav")
            if not os.path.exists(wav): todo.append((s["text"], wav, sh[i - 1]["text"] if i else None, sh[i + 1]["text"] if i + 1 < len(sh) else None))
        if todo:
            print(f"[vo] elevenlabs: {len(todo)} shots", file=sys.stderr)
            elevenlabs_batch(todo)
    if V.get("engine") == "chatterbox":  # one model load for every missing shot
        todo = []
        for s in jobs["shots"]:
            key = hashlib.sha1(json.dumps([{k: v for k, v in V.items() if k != "say"}, s["text"], "cb1"]).encode()).hexdigest()[:12]
            wav = os.path.join(cache, f"{s['id']}-{key}.wav")
            if not os.path.exists(wav): todo.append((s["text"], wav))
        if todo:
            print(f"[vo] chatterbox: {len(todo)} shots", file=sys.stderr)
            chatterbox_batch(todo, cache)
    for s in jobs["shots"]:
        # v2 salt only when the new pipeline is on, so old caches stay valid for prosody/fx = false
        salt = [V, s["text"]] + ([["r3.1", use_prosody(), use_fx()]] if (use_prosody() or use_fx()) and V.get("engine", "kokoro") == "kokoro" else [])
        if V.get("engine") == "chatterbox": salt = [{k: v for k, v in V.items() if k != "say"}, s["text"], "cb1"]
        if V.get("engine") == "elevenlabs": salt = [{k: v for k, v in V.items() if k != "say"}, s["text"], "el1"]
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
