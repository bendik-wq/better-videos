# better-videos

Two things live here: code-rendered documentary videos, and Cold Block, a browser multiplayer FPS.

## Videos
- Engine in `engine/` (render.mjs, voice.py, score.py), one folder per film in `projects/`, delivered cuts in `renders/`.
- Rules: `docs/style-bible.md`. Workflow: the `make-video` skill in `.claude/skills/`.
- `node engine/render.mjs projects/<name> --stills | --draft | (master)`.

## Studio (studio/): signal to ready-to-post, automatically
- One command, the `/studio` skill: "make today's video" or "make a video about X". The loop rules and pass bars are in `studio/program.md`.
- The chain: `signals/radar.py` → `idea-engine` → `packaging` → `retention-script` → `critic/script_critic.py` (looped) → `shot-design` → `make-video` stills, draft and master → `critic/video_qa.py` and the anti-AI review (looped) → `deliver.py` → the Google Drive folder "Studio — Ready to post".
- Never upload to YouTube automatically. Every fact needs a source in the project's SOURCES.md.

## Cold Block (games/cold-block)
- The whole game is one file, `games/cold-block/index.html` (Three.js r128 UMD). Assets sit next to it:
  `guns/`, `world/`, `sfx/`, `soldier.json`. Credits for every asset: `cloudflare/cold-block/README.md` (keep it updated; CC0 only).
- Two hosts, same file: Cloudflare Worker (`cloudflare/cold-block`, live at https://cold-block.bendik-50e.workers.dev)
  and the claude.ai artifact https://claude.ai/artifact/LHG3kAJpQPxKTJXVRizZZa (republish the same file; pass new asset files via `files`).
- Networking is presence-based: each player shares one presence object (`myPresence()`), the longest-connected player hosts bots and the match.
  Clamp every number read from someone else's presence (`num()`).
- `#test` in the URL exposes `window.__cb` hooks for tests.

### Before you push a game change
1. `npm ci` once, then `node cloudflare/cold-block/test/smoke.mjs` — must print PASS.
2. For gameplay or networking changes, also run the two-player regression (about 25 min):
   start `npx wrangler dev --port 8790 --ip 127.0.0.1` in `cloudflare/cold-block`, then `node cloudflare/cold-block/test/multiplayer.mjs`; it must end with `errors []`.
3. Check visual changes with screenshots, not by reading code.

### Deploy
- `cd cloudflare/cold-block && npx wrangler deploy` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set in the environment.
- Never write tokens or account IDs into files, commits or chat replies.

## Habits
- One task per chat. When a chat ends, harvest what was learned into the private `brain` repo (see its CLAUDE.md).
- Commit small and often; never leave work only in a chat's container.
