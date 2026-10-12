#!/usr/bin/env python3
"""audio-lab: an ~80 s audio showcase of engine/music + the round-3 voice and mix.

usage: python3 projects/audio-lab/build.py [--no-video]

Runs the same CLIs render.mjs runs (voice.py -> timeline -> score.py -> score.py --vo -> mix),
except the mix uses the new bus mixer (score.py --mix) and the picture is a simple ffmpeg card
per section over a scrolling spectrum. Outputs land in projects/audio-lab/out/ (scratch) and the
deliverables are copied to projects/audio-lab/renders/.

Each section demonstrates one thing:
  open      wonder / discovery (D lydian, pluck arpeggios, bright pads), VO over music
  depth     mystery (C harmonic minor, celesta, sparse plucks, long hall)
  ch1       chapter card: the music drops to silence (only the reverb tail rings), no VO
  clock     tension: ticking-clock build (8ths -> double time), pulse ostinato, Shepard riser
  war       urgency (E minor, ~128 bpm): spiccato 16ths, taiko, braaam on the downbeat hit
  loss      melancholy (A aeolian, piano motif + strings)
  archive   a licensed public-domain recording (Chopin Op. 69/1, Musopen) as a track cue
  moving    triumph (D major, bVI-bVII-I), resolves and rings out
"""
import json, os, shutil, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LAB = os.path.join(ROOT, "projects", "audio-lab")
OUT = os.path.join(LAB, "out"); REN = os.path.join(LAB, "renders")
sys.path.insert(0, os.path.join(ROOT, "engine"))

VOICE = {"engine": "kokoro", "name": "af_heart", "speed": 0.96}

SHOTS = [
    dict(id="open", set="title", padIn=4.0, padOut=1.4, label="WONDER / DISCOVERY", sub="D lydian · pluck arpeggio · bright pads",
         vo="This is the Strait of Hormuz. From orbit, it's a ribbon of *turquoise* between two deserts."),
    dict(id="depth", set="map", padIn=1.0, padOut=2.6, label="MYSTERY", sub="C harmonic minor · celesta · long hall",
         vo="But this narrow water holds a strange kind of power."),
    dict(id="ch1", set="chapter", min=3.2, label="CHAPTER ONE", sub="drop to silence on the chapter card"),
    dict(id="clock", set="tankers", padIn=2.2, padOut=7.0, label="TENSION", sub="D phrygian · ticking clock → double time · Shepard riser",
         vo="About a fifth of the world's oil passes through here. Every tanker, in single file. | And the clock never stops."),
    dict(id="war", set="war", padIn=1.4, padOut=2.6, label="URGENCY", sub="E minor · spiccato 16ths · taiko · braaam",
         vo="In the nineteen-eighties, the Tanker War turned these shipping lanes into a battlefield."),
    dict(id="loss", set="loss", padIn=1.6, padOut=2.4, label="MELANCHOLY", sub="A aeolian · piano motif · strings",
         vo="Hundreds of ships were hit. And sailors paid the price."),
    dict(id="archive", set="archive", padIn=1.6, padOut=2.0, label="LICENSED TRACK", sub="Chopin, Op. 69 No. 1 · Musopen · public domain",
         vo="Sometimes the right music already exists, and it belongs to everyone."),
    dict(id="moving", set="end", padIn=1.2, padOut=6.5, label="TRIUMPH", sub="D major · ♭VI–♭VII–I · resolve",
         vo="And yet, the oil kept moving. | Every single day."),
]

SCORE = {
    "seed": 3,
    "music": [
        {"shot": "open", "mood": "wonder", "key": "D", "intensity": [0.3, 0.6]},
        {"shot": "depth", "mood": "mystery", "key": "C", "intensity": 0.45},
        {"shot": "clock", "mood": "tension", "key": "D", "intensity": [0.3, 1.0], "riser": True, "clock": True},
        {"shot": "war", "mood": "urgency", "key": "E", "intensity": 0.85, "hit": True},
        {"shot": "loss", "mood": "melancholy", "key": "A", "intensity": 0.4},
        {"shot": "archive", "type": "track", "file": "projects/audio-lab/assets/chopin-op69-1-excerpt.ogg", "gainDb": -2,
         "until": "moving", "fadeIn": 0.6, "fadeOut": 1.2},
        {"shot": "moving", "mood": "triumph", "key": "D", "intensity": [0.6, 0.95], "ending": "resolve", "hit": True},
    ],
    "cues": [
        {"type": "sfx", "name": "whoosh.m", "shot": "ch1", "at": 0, "gain": 0.35},
        {"type": "boom", "shot": "war", "at": 0, "gain": 0.3},
    ],
}
COLOURS = {"open": "0x1d8a8a", "depth": "0x2b2747", "ch1": "0x000000", "clock": "0x0f3b40", "war": "0x6a1f12",
           "loss": "0x2c3a4f", "archive": "0x3b3326", "moving": "0xb0802a"}


def sh(*a, **k):
    return subprocess.run(a, check=True, **k)


def timeline():
    jobs = os.path.join(OUT, "vo-jobs.json")
    json.dump({"voice": VOICE, "root": ROOT, "cache": os.path.join(ROOT, ".cache", "vo"),
               "shots": [{"id": s["id"], "text": s["vo"], "display": s["vo"]} for s in SHOTS if s.get("vo")]}, open(jobs, "w"))
    vo = json.loads(subprocess.run([sys.executable, os.path.join(ROOT, "engine", "voice.py"), jobs], check=True, capture_output=True, text=True).stdout)
    T = 0.0; tl = []
    for s in SHOTS:
        v = vo.get(s["id"]); pi, po = s.get("padIn", 0.25), s.get("padOut", 0.35)
        d = max(s.get("min", 0), pi + (v["dur"] if v else 0) + po)
        tl.append(dict(id=s["id"], set=s["set"], start=round(T, 4), duration=round(d, 4), voAt=round(T + pi, 4),
                       voDur=v["dur"] if v else 0, voFile=v["wav"] if v else None, words=v["words"] if v else [],
                       vo=s.get("vo"), label=s["label"], sub=s["sub"]))
        T += d
    json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w"), indent=1)
    return tl


def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,").replace("%", "\\%")


def video(tl, total, mix):
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    boxes, texts = [], []
    for s in tl:
        a, b = s["start"], s["start"] + s["duration"]; en = f"enable='between(t,{a:.3f},{b:.3f})'"
        boxes.append(f"drawbox=x=0:y=0:w=iw:h=ih:color={COLOURS[s['id']]}@1:t=fill:{en}")
        texts.append(f"drawtext=fontfile={bold}:text='{esc(s['label'])}':fontcolor=white:fontsize=54:x=64:y=70:{en}")
        texts.append(f"drawtext=fontfile={font}:text='{esc(s['sub'])}':fontcolor=white@0.8:fontsize=26:x=66:y=140:{en}")
        for w0 in range(0, len(s["words"]), 9):  # captions, 9 words at a time, timed to the VO words
            ws = s["words"][w0:w0 + 9]
            c0, c1 = s["voAt"] + ws[0]["s"] - 0.05, s["voAt"] + ws[-1]["e"] + 0.25
            texts.append(f"drawtext=fontfile={font}:text='{esc(' '.join(w['w'] for w in ws))}':fontcolor=white:fontsize=34:"
                         f"x=(w-tw)/2:y=330:box=1:boxcolor=black@0.35:boxborderw=12:enable='between(t,{c0:.3f},{c1:.3f})'")
    texts.append(f"drawtext=fontfile={font}:text='audio-lab · engine/music · %{{pts\\:hms}}':fontcolor=white@0.5:fontsize=18:x=w-tw-30:y=30")
    g = (f"color=c=black:s=1280x720:r=30:d={total:.3f}[bg];[bg]{','.join(boxes)}[bg2];"
         f"[1:a]showspectrum=s=1280x260:slide=scroll:mode=combined:color=intensity:scale=log:fscale=log:legend=0:saturation=0.6[spec];"
         f"[spec]format=rgba,colorchannelmixer=aa=0.8[spec2];[bg2][spec2]overlay=0:460,{','.join(texts)}[v]")
    out = os.path.join(OUT, "audio-lab.mp4")
    sh("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-i", mix, "-filter_complex", g,
       "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "256k", "-t", f"{total:.3f}", "-movflags", "+faststart", out)
    return out


def analyse(tl):
    """Per-section numbers for the listening notes: loudness of the mix, music and VO buses,
    music spectral centroid and side level, plus the composer's arrangement facts."""
    import numpy as np
    from music import qa, dsp
    mix = qa.load(os.path.join(OUT, "mix.wav")); mus = qa.load(os.path.join(OUT, "score.music.wav"))
    vo = qa.load(os.path.join(OUT, "vo.wav"))
    arr = json.load(open(os.path.join(OUT, "score.music.json")))
    rows = []
    for s in tl:
        a, b = int(s["start"] * 48000), int((s["start"] + s["duration"]) * 48000)
        seg = lambda x: x[a:min(b, len(x))]
        m = seg(mus); spec = np.abs(np.fft.rfft(m.mean(1))) ** 2; f = np.fft.rfftfreq(len(m), 1 / 48000)
        sec = next((x for x in arr["sections"] if x["start"] <= s["start"] + 0.5 < x["end"] or abs(x["start"] - s["start"] - s["duration"]) < 0.01 and False), None)
        sec = next((x for x in arr["sections"] if x["start"] < s["start"] + s["duration"] - 0.1 and x["end"] > s["start"] + 0.1), None)
        Lm = dsp.loudness(seg(mix))
        rows.append(dict(id=s["id"], start=round(s["start"], 2), dur=round(s["duration"], 2),
                         mix_lufs=round(Lm["integrated"], 1), mix_lra=round(Lm["lra"], 1),
                         music_lufs=round(dsp.loudness(m)["integrated"], 1),
                         vo_lufs=round(dsp.loudness(seg(vo))["integrated"], 1) if s.get("voFile") else None,
                         music_centroid_hz=round(float((spec * f).sum() / max(spec.sum(), 1e-12))) if spec.sum() > 0 else None,
                         music_side_db=qa.stereo(m)["side_to_mid_db"] if np.abs(m).max() > 1e-4 else None,
                         arrangement={k: sec[k] for k in ("mood", "key", "bpm", "bars", "chords", "layers", "breakdown_bar", "ending")} if sec else None))
    json.dump(dict(sections=rows, harmony=arr["harmony"], drops=arr["drops"]), open(os.path.join(OUT, "sections.json"), "w"), indent=1)
    return rows


def main():
    os.makedirs(OUT, exist_ok=True); os.makedirs(REN, exist_ok=True)
    tl = timeline()
    total = tl[-1]["start"] + tl[-1]["duration"]
    print(f"[lab] timeline {total:.1f}s, {len(tl)} shots")
    cfg = dict(SCORE, root=ROOT)
    json.dump(cfg, open(os.path.join(OUT, "score-cfg.json"), "w"), indent=1)
    tlp = os.path.join(OUT, "timeline.json"); bed = os.path.join(OUT, "score.wav")
    sh(sys.executable, os.path.join(ROOT, "engine", "score.py"), tlp, bed, "@" + os.path.join(OUT, "score-cfg.json"))
    vo = os.path.join(OUT, "vo.wav")
    sh(sys.executable, os.path.join(ROOT, "engine", "score.py"), "--vo", tlp, vo, "0", f"{total:.3f}")
    mix = os.path.join(OUT, "mix.wav")
    sh(sys.executable, os.path.join(ROOT, "engine", "score.py"), "--mix", bed, vo, mix, "0", f"{total:.3f}", "--plots")
    for r in analyse(tl): print("[lab]", json.dumps(r))
    if "--no-video" not in sys.argv:
        mp4 = video(tl, total, mix)
        shutil.copy(mp4, os.path.join(REN, "audio-lab.mp4"))
    sh("ffmpeg", "-y", "-v", "error", "-i", mix, "-c:a", "flac", "-sample_fmt", "s16", os.path.join(REN, "audio-lab-mix.flac"))
    for f in ("mix-spectrogram.png", "mix-loudness.png", "mix-ltas.png", "mix.qa.json", "timeline.json", "score.licences.json",
              "sections.json", "score.music.json"):
        if os.path.exists(os.path.join(OUT, f)): shutil.copy(os.path.join(OUT, f), os.path.join(REN, f))
    print("[lab] done:", REN)


if __name__ == "__main__":
    main()
