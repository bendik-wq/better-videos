#!/usr/bin/env python3
"""Chatterbox Turbo worker (runs in its own venv: torch 2.6 + chatterbox-tts; see docs/audio/voice.md).

usage: python tts_chatterbox.py jobs.json
jobs.json = {"ref": "voice reference .wav", "items": [{"text", "out", "seed"}]}
Loads the model once, conditions on the reference voice once, writes each item as a 24 kHz mono wav.
"""
import json, sys, warnings
warnings.filterwarnings("ignore")
import torch, torchaudio
from chatterbox.tts_turbo import ChatterboxTurboTTS

jobs = json.load(open(sys.argv[1]))
torch.set_num_threads(int(jobs.get("threads", 4)))
m = ChatterboxTurboTTS.from_pretrained(device="cpu")
m.prepare_conditionals(jobs["ref"])
for it in jobs["items"]:
    torch.manual_seed(int(it.get("seed", 0)))
    wav = m.generate(it["text"], temperature=float(jobs.get("temperature", 0.8)), top_p=float(jobs.get("top_p", 0.95)))
    torchaudio.save(it["out"], wav, m.sr)
    print(f"[chatterbox] {it['out'].rsplit('/', 1)[-1]} {wav.shape[-1] / m.sr:.1f}s", file=sys.stderr, flush=True)
