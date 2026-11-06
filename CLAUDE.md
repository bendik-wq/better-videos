# better-videos: working rules

## Offload cheap work to DeepSeek (saves Claude tokens)
`node tools/deepseek/ask.mjs "<prompt>" --file=<path> … [--out=file] [--model=deepseek-flash|deepseek-v4-pro]`
(key: `$DEEPSEEK_API_KEY` or `/root/.secrets/deepseek`, never in the repo; usage log `.cache/deepseek/usage.jsonl`).
`deepseek-flash` reads images and has a 1M-token context; `deepseek-v4-pro` is text only and stronger.

**Give DeepSeek:** long reading and summarising (vendor repos, docs, transcripts, source lists), first drafts of
boilerplate (descriptions, tags, READMEs, test fixtures), bulk image reading (frame sheets, contact sheets:
`tools/reverse/read.mjs`), format conversions, first-pass translations, brainstorm lists to be filtered.
**Keep for Claude:** decisions, anything a viewer sees or hears in the final cut, fact checks and claims about real
people, code that ships, edits to the engine, final copy, and judging DeepSeek's output (spot-check it, never pass
it on unread). **Never send** keys, `.env` files or credentials, or anything the user hasn't cleared for a third party.

## Reverse-engineering videos
Skill: `.claude/skills/reverse-video/`. Measure: `tools/reverse/reverse.mjs`; read pictures cheaply:
`tools/reverse/read.mjs`; rebuild study: `tools/reverse/rebuild.mjs`. All local, no HeyGen, no sign-in.
YouTube downloads go through Monid when yt-dlp is blocked (key `/root/.secrets/monid`, $0.01 per video, 480p).

## Standing rules
- Commit and push to the session's branch; no model ids in commits.
- Never commit API keys (ElevenLabs, DeepSeek, Monid). Never sign in to or pay for HyperFrames Pro; never run its
  `publish`, `cloud`, `reverse`, `templates` or `media-use generate`.
- Never use another creator's face, voice, footage, characters, logo or show name.
