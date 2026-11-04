#!/usr/bin/env python3
"""Kokoro voice benchmark on a documentary paragraph.

usage: python3 projects/audio-lab/voice_bench.py [outdir] [--voices a,b] [--speeds 0.9,0.95,1.0]

For every voice x speed: renders the paragraph raw (one Kokoro call, as voice.py did before
round 3), then measures what we can without ears:
  intelligibility   word error rate of faster-whisper small.en against the script, and whisper's
                    mean word probability (low = mumbled / odd stress)
  expressiveness    F0 range (5-95th pct, semitones) and F0 SD; documentary narrators sit around
                    7-12 st range; < 5 st reads as monotone
  pacing            words per minute (doc narration 140-165 wpm), pause count/total
  timbre            spectral centroid, presence (2-4.5 kHz) and sibilance (4.5-9 kHz) shares,
                    persistent narrow resonances (vocoder artefacts)
  cost              real-time factor on this CPU
plus Kokoro's own published grade for the voice (hexgrad/Kokoro-82M VOICES.md).
Then the best voices are re-rendered with the round-3 pipeline (prosody + doc chain) for
comparison. Results: bench.json, bench.md, and the wavs.
"""
import json, os, re, sys, time
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine"))
from music import speech, qa  # noqa: E402

PARAGRAPH = ("Every day, about twenty million barrels of oil pass through a channel barely thirty-nine kilometres wide. "
             "On one side, Iran. On the other, Oman and the Emirates. "
             "If this strait closed for even a week, petrol prices on the other side of the planet would jump overnight. "
             "So why has nobody ever managed to shut it? The answer is stranger than you think.")
PARAGRAPH_MARKED = ("Every day, about *twenty million* barrels of oil pass through a channel barely thirty-nine kilometres wide.\n"
                    "On one side, Iran. On the other, Oman and the Emirates.\n"
                    "If this strait closed for even a week, petrol prices on the other side of the planet would jump *overnight*.\n"
                    "So why has nobody ever managed to shut it?\n> The answer is stranger than you think.")
GRADES = {"af_heart": "A", "af_bella": "A-", "af_nicole": "B-", "af_aoede": "C+", "af_kore": "C+", "af_sarah": "C+",
          "af_nova": "C", "af_alloy": "C", "af_sky": "C-", "am_fenrir": "C+", "am_michael": "C+", "am_puck": "C+",
          "am_echo": "D", "am_eric": "D", "am_liam": "D", "am_onyx": "D", "am_adam": "F+", "bf_emma": "B-",
          "bf_isabella": "C", "bf_alice": "D", "bf_lily": "D", "bm_fable": "C", "bm_george": "C", "bm_lewis": "D+",
          "bm_daniel": "D"}
VOICES = ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_aoede", "af_kore", "am_michael", "am_adam", "am_fenrir",
          "am_puck", "am_onyx", "am_echo", "am_eric", "am_liam", "bf_emma", "bf_isabella", "bm_george", "bm_fable",
          "bm_lewis", "bm_daniel"]


def norm(w): return re.sub(r"[^a-z0-9]", "", w.lower())


NUM = {"20": "twenty", "39": "thirtynine", "20000000": "twentymillion"}


def wer(ref, hyp):
    r = [norm(w) for w in ref.split() if norm(w)]
    h = []
    for w in hyp.split():
        n = norm(w)
        if not n: continue
        h += NUM.get(n, n).split() if n in NUM else [n]
    r = [x for x in " ".join(r).replace("thirtynine", "thirty nine").split()]
    h = [x for x in " ".join(h).replace("thirtynine", "thirty nine").replace("39", "thirty nine").split()]
    d = np.zeros((len(r) + 1, len(h) + 1), int); d[:, 0] = range(len(r) + 1); d[0, :] = range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1, -1] / max(1, len(r))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else os.path.join(ROOT, "projects/audio-lab/out/voice-bench")
    os.makedirs(out, exist_ok=True)
    args = dict(zip(sys.argv[1::1], sys.argv[2::1]))
    voices = args.get("--voices", ",".join(VOICES)).split(",")
    speeds = [float(s) for s in args.get("--speeds", "0.9,0.95,1.0").split(",")]
    import soundfile as sf
    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel
    k = Kokoro(os.path.join(ROOT, ".cache/kokoro/kokoro-v1.0.onnx"), os.path.join(ROOT, ".cache/kokoro/voices-v1.0.bin"))
    wm = WhisperModel("small.en", device="cpu", compute_type="int8")
    nwords = len(PARAGRAPH.split())
    rows = []
    path_json = os.path.join(out, "bench.json")
    done = {(r["voice"], r["speed"], r["pipeline"]) for r in json.load(open(path_json))} if os.path.exists(path_json) else set()
    rows = json.load(open(path_json)) if os.path.exists(path_json) else []

    def measure(x, sr, voice, speed, pipeline, rtf, wav):
        segs, _ = wm.transcribe(wav, word_timestamps=True, language="en", beam_size=1)
        ws = [w for s in segs for w in s.words]
        hyp = " ".join(w.word for w in ws)
        x48 = x if sr == 48000 else __import__("scipy.signal", fromlist=["x"]).resample_poly(x, 48000 // np.gcd(48000, sr), sr // np.gcd(48000, sr))
        prof = speech.profile(x48, 48000, words=PARAGRAPH.split())
        f, p = qa.median_spectrum(np.stack([x48, x48], 1))
        res = qa.resonances(f, p, lo=1500, hi=11000)
        row = dict(voice=voice, speed=speed, pipeline=pipeline, grade=GRADES.get(voice, "?"), rtf=round(rtf, 3),
                   wer=round(wer(PARAGRAPH, hyp), 3), word_prob=round(float(np.mean([w.probability for w in ws])), 3) if ws else 0,
                   resonances=len(res), hyp=hyp.strip(), **prof)
        return row

    for v in voices:
        lang = "en-gb" if v.startswith("b") else "en-us"
        for sp in speeds:
            if (v, sp, "raw") in done: continue
            t = time.time(); a, sr = k.create(PARAGRAPH, voice=v, speed=sp, lang=lang); rtf = (time.time() - t) / (len(a) / sr)
            wav = os.path.join(out, f"{v}-{sp:.2f}-raw.wav"); sf.write(wav, a, sr)
            row = measure(a, sr, v, sp, "raw", rtf, wav); rows.append(row)
            print(json.dumps(row)); json.dump(rows, open(path_json, "w"), indent=1)
    # round-3 pipeline on the best candidates
    import importlib.util
    spec = importlib.util.spec_from_file_location("voice", os.path.join(ROOT, "engine", "voice.py")); voice = importlib.util.module_from_spec(spec); spec.loader.exec_module(voice)
    voice.root = ROOT; voice._kokoro = k
    for v, sp in [(x.split("@")[0], float(x.split("@")[1])) for x in args.get("--pipeline", "af_heart@0.96,af_bella@0.95,bf_emma@0.95,am_michael@0.95,bm_george@0.95,am_fenrir@0.95").split(",")]:
        if (v, sp, "round3") in done: continue
        voice.V = {"engine": "kokoro", "name": v, "speed": sp}
        wav = os.path.join(out, f"{v}-{sp:.2f}-round3.wav")
        t = time.time(); voice.say_kokoro(PARAGRAPH_MARKED, wav)
        x, sr = sf.read(wav); rtf = (time.time() - t) / (len(x) / sr)
        row = measure(x, sr, v, sp, "round3", rtf, wav); rows.append(row)
        print(json.dumps(row)); json.dump(rows, open(path_json, "w"), indent=1)
    write_md(rows, os.path.join(out, "bench.md"))


def write_md(rows, path):
    hdr = "| voice | grade | speed | pipeline | WER | word p | F0 med | F0 range st | F0 SD st | wpm | pauses | presence % | sibilance % | resonances | RTF |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
    body = "".join(f"| {r['voice']} | {r['grade']} | {r['speed']} | {r['pipeline']} | {r['wer']:.3f} | {r['word_prob']:.2f} | {r['f0_median_hz']} | {r['f0_range_st']} | {r['f0_sd_st']} | {r['wpm']} | {r['pause_count']} ({r['pause_total_s']} s) | {r['presence_pct']} | {r['sibilance_pct']} | {r['resonances']} | {r['rtf']} |\n" for r in rows)
    open(path, "w").write(hdr + body)


if __name__ == "__main__":
    main()
