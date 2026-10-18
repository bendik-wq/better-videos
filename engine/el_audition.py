#!/usr/bin/env python3
"""Audition ElevenLabs voices x models on one passage (needs ELEVENLABS_API_KEY).

usage: python3 engine/el_audition.py out_dir [voice_id,...] [model,...] [text file]
Defaults: three narrator voices from the ElevenLabs default library (Brian, George, Daniel) x eleven_v3 and eleven_v4,
on the Panama hook. Writes <out_dir>/<voice>-<model>.wav plus pitch-range/WER stats, and lists the account's voices
to voices.json so other narrators can be tried.
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as VO

out = sys.argv[1]; os.makedirs(out, exist_ok=True)
voices = (sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else
          "nPczCjzI2devNBz1zQrb,JBFqnCBsd6RMkjVDRZzb,onwK4e9ZLuTAKqWW03F9").split(",")
models = (sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "eleven_v3,eleven_v4").split(",")
text = open(sys.argv[4]).read() if len(sys.argv) > 4 else (
    "This ship is about to climb a mountain. | Made of water. | Eighty-five feet up, | on top of Panama, | sits a lake. | "
    "Every ship that crosses pours about fifty million gallons of it | into the sea. | Gone. | "
    "And the only thing that fills it back up? | Rain.")
key = os.environ["ELEVENLABS_API_KEY"]
req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key})
vs = json.load(urllib.request.urlopen(req))["voices"]
json.dump([{"id": v["voice_id"], "name": v["name"], "labels": v.get("labels"), "category": v.get("category")} for v in vs],
          open(os.path.join(out, "voices.json"), "w"), indent=1)
names = {v["voice_id"]: v["name"] for v in vs}
for m in models:
    for vid in voices:
        VO.V = {"engine": "elevenlabs", "voiceId": vid, "model": m, "fx": "doc", "takes": 1, "context": False}
        path = os.path.join(out, f"{names.get(vid, vid)}-{m}.wav")
        try:
            VO.elevenlabs_batch([(text, path, None, None)])
            print("wrote", path)
        except Exception as e:
            print("FAILED", names.get(vid, vid), m, e)
