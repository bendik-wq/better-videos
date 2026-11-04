# Studio

Signal to ready-to-post video, with critics that loop every stage until it passes.
Run it with the `/studio` skill ("make today's video" or "make a video about X"). The rules are in `program.md`.

| Part | What it does |
|---|---|
| `signals/radar.py` | What people search and read right now (Google Trends, Google News, Wikipedia most-read, Hacker News, BBC), clustered and scored for the channel |
| `critic/script_critic.py` | Scores a script: hook, re-hooks every ≤40 s, open loops, emotional curve, rhythm, specifics |
| `critic/video_qa.py` | Measures a render (loudness, black or frozen frames, silence, cut rate) and makes contact sheets for the visual review |
| `program.md` | The loop: judges, pass bars, keep-if-better, and the outer loop that tunes the judges against real retention |
| `deliver.py` | Builds the ready-to-post folder and uploads the video for a download link; the skill mirrors it to Google Drive |
| `results.md`, `judge-changes.md` | The log every loop writes to |

The craft lives in the existing skills (`idea-engine`, `packaging`, `retention-script`, `shot-design`, `make-video`) and in `docs/`.
