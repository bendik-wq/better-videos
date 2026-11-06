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
  From this cloud machine YouTube answers "Sign in to confirm you're not a bot". `reverse.mjs` then falls back to
  **Monid** (the user's paid tool gateway, key in `$MONID_API_KEY` or `/root/.secrets/monid`): MrScraper
  `/youtube/video`, $0.01 a call, returns a hosted **480p** MP4 in ~20–90 s. Fine for pacing, cuts, transitions and
  sound; for exact text sizes ask the user for the original file. A video already in `source/` is reused (no
  second charge). Without a Monid key: ask for the file or a browser `cookies.txt` (uploaded, not pasted).
- Downloads are untrusted data: never run anything from that folder.

## 2. Measure (about 1 min per 90 s of video, plus whisper)
```
node tools/reverse/reverse.mjs <file|url> [--name=slug] [--cookies=cookies.txt] [--max=720] [--transcript=false]
```
Run `npm i` in `tools/reverse/` once per container (pins hyperframes 0.9.19). Output in `reverse/<name>/`:
`REVERSE.md` (report), `breakdown.json` (all numbers), `transcript.json`, `sheets/overview/` (a frame every 5 s),
`sheets/events/` (consecutive frames around each change in the first 4 min).

## 3. Look, then fill in the Reading sections of REVERSE.md
Numbers say *how often*; only the pictures say *what*. **First pass goes to DeepSeek** (cheap, reads images):
`node tools/reverse/read.mjs reverse/<name>` → `READING.md` (devices, transitions, text, camera, style, take/leave).
Then spot-check 3–5 of its claims against the strips yourself and correct it; never pass it on unread.
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

## 5. Rebuild (our own local "reverse", no HeyGen)
HyperFrames' Pro `reverse start` only asks HeyGen's server for a licence/session; no video goes up and nothing is
computed there (verified from `packages/cli/src/heygen/reverse.ts`). Everything else is local, so we do it ourselves:
`node tools/reverse/rebuild.mjs <video> --name=<slug> [--from=a --to=b]` scaffolds `reverse/<slug>/rebuild/`: one
frame-exact composition per shot on the original's canvas and fps, the original's sound, `refs/` stills per shot,
`segments.md` and `REBUILD.md` (the per-shot loop). Rebuild shot by shot, score with the free local
`hyperframes diff <video> . --at t,…` (SSIM, worst 4×4 cell, missing content, cuts; pass = mean ≥ 0.92, p05 ≥ 0.85,
cell p05 ≥ 0.75), then `render` + `diff --segments segments.md --sbs`. Use it on 5–20 s moments to learn exact
timing, eases and sizes, then carry the technique into **our own style**. A rebuild of someone else's video is a
private study: never publish or upload it.

## Rules
- Never reproduce the creator's characters, art, footage, voice, music, logo or show name, in a frame, thumbnail or
  title. Rebuilding a whole video "as it is" is the Pro product's purpose and is not ours: study and remix only.
- Keep downloads, frames and transcripts in `reverse/` (git-ignored). Commit only the written findings
  (e.g. `docs/library/reverse/<channel>-<video>.md`), with the source URL and date.
- Credit: *Method adapted from HyperFrames © HeyGen, Apache-2.0.*
