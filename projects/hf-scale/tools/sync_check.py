#!/usr/bin/env python3
"""Mux a picture-only HyperFrames chunk with the matching span of mix.wav and check that
every cue's picture onset (the black sync square, top-right) and audio onset (the 1 kHz blip)
land where timing.json says, in the MUXED file.
usage: sync_check.py <chunk.mp4> <chunk_start_s> [timing.json] [mix.wav]"""
import json, subprocess, sys, os, numpy as np
mp4, t0 = sys.argv[1], float(sys.argv[2])
here = os.path.dirname(os.path.abspath(__file__))
timing = json.load(open(sys.argv[3] if len(sys.argv) > 3 else os.path.join(here, '..', 'timing.json')))
mix = sys.argv[4] if len(sys.argv) > 4 else os.path.join(here, '..', 'out', 'mix.wav')
fps = timing['fps']
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]))
muxed = mp4.replace('.mp4', '.muxed.mp4')
# the integration-plan mux: picture stream-copied, our mix cut to the chunk span
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-ss', str(t0), '-t', str(dur), '-i', mix,
                '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', muxed], check=True)
# picture: mean luma of the 120x120 top-right square, every frame
W, H = 64, 36
raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', muxed, '-map', '0:v', '-vf', f'crop=120:120:1800:0,scale={W}:{H},format=gray', '-f', 'rawvideo', '-'])
lum = np.frombuffer(raw, np.uint8).reshape(-1, H, W).mean(axis=(1, 2))
on = np.flatnonzero((lum[1:] < 60) & (lum[:-1] >= 60)) + 1
pic = on / fps
# audio: decode the muxed AAC back, find blip onsets
SR = 48000
a = np.frombuffer(subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', muxed, '-map', '0:a', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-']), np.int16).astype(float)
env = np.abs(a) > 4000
idx = np.flatnonzero(env); aud = []
for i in idx:
    if not aud or i - aud[-1][1] > SR * 0.1: aud.append([i, i])
    else: aud[-1][1] = i
aud = np.array([s for s, _ in aud]) / SR
cues = np.array([s['cue'] for s in timing['shots'] if t0 <= s['cue'] < t0 + dur]) - t0
def match(found, label):
    errs = []
    for c in cues:
        if len(found) == 0: errs.append(np.nan); continue
        errs.append(found[np.argmin(np.abs(found - c))] - c)
    e = np.array(errs)
    return e
pe, ae = match(pic, 'picture'), match(aud, 'audio')
# picture onset is quantised to the next frame boundary: expected error in [0, 1/fps)
frame_err = np.round(pe * fps, 3)
print(json.dumps({
  'chunk': os.path.basename(mp4), 'start': t0, 'duration': round(dur, 3), 'cues': int(len(cues)),
  'picture_onsets_found': int(len(pic)), 'audio_onsets_found': int(len(aud)),
  'picture_minus_cue_frames': {'min': float(np.nanmin(frame_err)), 'max': float(np.nanmax(frame_err))},
  'audio_minus_cue_ms': {'min': round(float(np.nanmin(ae)) * 1000, 2), 'max': round(float(np.nanmax(ae)) * 1000, 2)},
  'audio_minus_picture_ms': {'min': round(float(np.nanmin(ae - pe)) * 1000, 1), 'max': round(float(np.nanmax(ae - pe)) * 1000, 1)},
}, indent=1))
