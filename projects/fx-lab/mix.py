#!/usr/bin/env python3
"""Lay engine/sfx.py cues onto an fx-lab render (score.py has no sfx hook yet; see docs/motion/README.md).

    python3 projects/fx-lab/mix.py projects/fx-lab [video.mp4]

Reads out/timeline.json, places the matching sound for every transition (sfx.for_transition, anchored
on the transition's own timing) and for every motion preset (table below, anchored on the preset's
event times), mixes it under the render's existing audio (VO + drone bed) and writes out/fx-lab-sfx.mp4
plus out/sfx-track.wav.
"""
import json, os, subprocess, sys
import numpy as np

sys.dont_write_bytecode = True  # keep engine/ free of __pycache__
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'engine'))
import sfx  # noqa: E402

proj = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(__file__))
out = os.path.join(proj, 'out')
video = sys.argv[2] if len(sys.argv) > 2 else os.path.join(out, 'draft.mp4')
timeline = json.load(open(os.path.join(out, 'timeline.json')))
total = timeline[-1]['start'] + timeline[-1]['duration'] + 1.0

# motion preset -> [(sfx preset, time in shot (s), gain, params)]; times match the `at` values in scene.js
MOTION_SFX = {
    'splitWords': [('swell.reverse', 0.55, 0.35, {})],
    'perChar': [('ui.ticks', 0.5, 0.6, {'count': 8, 'period': 0.05}), ('impact.soft', 0.55, 0.5, {})],
    'maskUp': [('whoosh.s', 0.75, 0.45, {})],
    'typeScramble': [('glitch.zap', 0.6, 0.35, {}), ('ui.ticks', 0.5, 0.4, {'count': 20, 'period': 0.06}), ('type.run', 1.6, 0.8, {'chars': 21, 'cps': 20.0}), ('type.run', 2.7, 0.7, {'chars': 34, 'cps': 26.0})],
    'counter': [('ui.ticks', 0.5, 0.45, {'count': 24, 'period': 0.075, 'accel': 0.0}), ('impact.hit', 2.6, 0.9, {})],
    'docMarks': [('marker.swipe', 0.5, 0.5, {}), ('marker.swipe', 0.95, 0.45, {}), ('marker.swipe', 2.0, 0.6, {}), ('marker.swipe', 3.1, 0.6, {})],
    'callouts': [('marker.swipe', 0.6, 0.5, {}), ('ui.tick', 1.3, 0.6, {}), ('whoosh.xs', 2.1, 0.35, {}), ('ui.tick', 2.6, 0.5, {})],
    'route': [('ui.scan', 0.6, 0.3, {}), ('whoosh.xl', 2.6, 0.25, {}), ('ui.tick', 3.2, 0.6, {})],
    'quote': [('room.tone', 0.0, 0.6, {'dur': 6.0})],
    'chapterNumeral': [('stinger', 0.15, 0.7, {})], 'chapterRule': [('impact.soft', 0.15, 0.8, {}), ('swell.reverse', 0.15, 0.4, {})],
    'chapterIndex': [('paper.page', 0.4, 0.7, {})], 'chapterSplit': [('impact.hit', 0.2, 0.7, {})],
    'timeline': [('clock.tick', 0.5, 0.5, {'beats': 4, 'period': 1.0}), ('ui.tick', 1.5, 0.6, {}), ('ui.tick', 2.6, 0.6, {}), ('ui.tick', 3.6, 0.6, {})],
    'barRace': [('city.amb', 0.0, 0.7, {'dur': 6.0}), ('ui.ticks', 0.5, 0.25, {'count': 6, 'period': 0.8})],
    'lineDraw': [('riser', 3.5, 0.35, {'dur': 3.0}), ('impact.soft', 3.5, 0.5, {})],
    'pieWaffle': [('ui.ticks', 1.3, 0.35, {'count': 23, 'period': 0.04})],
    'bigNumber': [('heartbeat', 0.4, 0.5, {'bpm': 58, 'beats': 4}), ('ui.ticks', 2.0, 0.3, {'count': 20, 'period': 0.035})],
}

cues = []
for i, s in enumerate(timeline):
    P = s.get('params') or {}
    if i > 0 and P.get('trans') and P['trans'] != 'cut':
        cues += sfx.for_transition(P['trans'], s['start'], P.get('tdur', 0.5), seed=i, gain=0.7)
    elif i > 0 and P.get('trans') == 'cut':
        cues.append({'name': 'impact.soft', 'at': s['start'], 'gain': 0.6, 'seed': i})
    for name, at, gain, params in MOTION_SFX.get(P.get('motion'), []):
        # every sound is placed by its anchor: beds start at `at`, a riser tops out at `at`, a hit lands on it
        cues.append({'name': name, 'at': s['start'] + at, 'gain': gain, 'seed': i, 'params': params})
track = sfx.mix_cues(cues, total)
track *= 10 ** (-4 / 20)  # headroom under the VO
wav = os.path.join(out, 'sfx-track.wav'); sfx.write_wav(wav, track)
dst = os.path.join(out, 'fx-lab-sfx.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', wav, '-filter_complex',
                '[0:a][1:a]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '224k', dst], check=True)
print(f'[mix] {len(cues)} sfx cues -> {dst}')
