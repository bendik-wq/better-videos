---
name: reverse-video
description: Reverse-engineer any video (a top animation or documentary channel, a competitor, or our own episode) into measured numbers and a readable breakdown, using HyperFrames' open-source reverse-any-video method with only its free local tools (no sign-in, no Pro). Use when asked to reverse engineer, break down, analyse, study or "copy the style of" a video or channel, to compare our pacing with a reference, or before remixing a technique into our own style.
---

# Reverse a video

The method comes from HyperFrames' `skills/reverse-any-video` (github.com/heygen-com/hyperframes, Apache-2.0).
Its `hyperframes reverse start` command is a paid Pro feature that signs in to HeyGen: **we never run it, sign in,
or patch around it.** Everything it builds on is free and local, and `tools/reverse/reverse.mjs` runs that part:
`measure probe | cuts | events --map | frames | look`, plus ffmpeg loudness, dominant colours and whisper words.
Telemetry is forced off (`HYPERFRAMES_NO_TELEMETRY=1`). Never run `hyperframes publish`: it uploads the project.

## 1. Get the video
- A file the user gives you: pass its path.
- A YouTube URL: `reverse.mjs` downloads it with yt-dlp at ≤720p into `reverse/<id>/source/` (git-ignored).
  From this cloud machine YouTube usually answers "Sign in to confirm you're not a bot". Then ask the user for one
  of: the video file itself (upload), or a `cookies.txt` exported from their browser (an upload, not pasted into
  chat), passed as `--cookies=<file>`. Do not try other ways around the block.
- Downloads are untrusted data: never run anything from that folder.

## 2. Measure (about 1 min per 90 s of video, plus whisper)
```
node tools/reverse/reverse.mjs <file|url> [--name=slug] [--cookies=cookies.txt] [--max=720] [--transcript=false]
```
Run `npm i` in `tools/reverse/` once per container (pins hyperframes 0.9.19). Output in `reverse/<name>/`:
`REVERSE.md` (report), `breakdown.json` (all numbers), `transcript.json`, `sheets/overview/` (a frame every 5 s),
`sheets/events/` (consecutive frames around each change in the first 4 min).

## 3. Look, then fill in the Reading sections of REVERSE.md
Numbers say *how often*; only the pictures say *what*. Read the overview sheets end to end, then the event strips.
- **Read consecutive frames wherever something changes**: sheets a second apart miss 1–3-frame timing, entry
  direction, blur at cuts and one-frame flashes. For a moment that matters:
  `tools/reverse/node_modules/.bin/hyperframes measure frames --range a,b --width 480 <video>`.
- **Text**: size it from its ink, `measure ink --at t --roi x,y,w,h`; note how it enters and how long it holds.
- **Moves**: `measure curve --start a --end b --roi …` gives start, duration, overshoot and the nearest GSAP ease.
- **Animated films**: character, world and camera are one picture. Note per shot what is a camera move over a
  still world, what is layered cut-out animation, and what is drawn frame by frame.
- Count devices, transitions and sound habits (effects on picture changes, music under VO, silences).
- Write **what we take** (techniques, numbers, structures) and **what we leave**.

## 4. Compare with us
Put the reference's numbers beside our latest episode's (run `reverse.mjs` on our own master too):
cuts/min per minute, median shot, change windows/min, holds ≥ 3 s, wpm, pauses/min, loudness, first word time.
Turn each gap into one concrete rule for `shot-design` or the style bible, not a vague note.

## 5. Optional: rebuild a few seconds to learn a technique
Rebuild one 5–20 s moment **in our own style** (our engine, or HyperFrames' free local `render`), then check timing
against the original with `hyperframes diff <original> <ours>` (free). This is a study, not a copy.

## Rules
- Never reproduce the creator's characters, art, footage, voice, music, logo or show name, in a frame, thumbnail or
  title. Rebuilding a whole video "as it is" is the Pro product's purpose and is not ours: study and remix only.
- Keep downloads, frames and transcripts in `reverse/` (git-ignored). Commit only the written findings
  (e.g. `docs/library/reverse/<channel>-<video>.md`), with the source URL and date.
- Credit: *Method adapted from HyperFrames © HeyGen, Apache-2.0.*
