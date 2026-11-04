# program.md — the studio loop

Written by Bendik; the agent follows it and doesn't edit it. Pattern: Karpathy's autoresearch. A fixed judge scores each attempt, only improvements are kept, and every attempt is logged.

## Goal
Videos that a person can't stop watching. Each one is a single connected story with emotional peaks, a constant "what happens next", and packaging people click. Premium, clean motion. Nothing that looks AI-made.

## The judges (fixed; the agent never edits them)
| Stage | Judge | Pass bar |
|---|---|---|
| Idea | `studio/signals/radar.py` + the `idea-engine` score (out of 25) | ≥ 18/25 and a signal in the channel picks, or an evergreen topic-bank idea |
| Packaging | `packaging` skill score + a blind second reviewer | title and thumbnail ≥ the skill's bar; the reviewer picks it from 3 |
| Script | **Blind** reviewer agent: re-annotates every beat's emotion as a cold viewer, without the writer's ratings, LOOP.md or SCORECARD.md. Then `studio/critic/script_critic.py` runs on the blind copy, plus the emotional-engine checklist. | blind critic ≥ 85, hook ≥ 80, checklist ≥ 80 with all gates, no unclosed loop, no flat stretch > 90 s |
| Shots | `shot-design` rules (no repeat, cut-rate targets) | no rule violations |
| Look | contact sheets of stills reviewed with `docs/research/anti-ai-look.md` + `docs/style-bible.md` | 0 fails on the anti-AI checklist |
| Video | `studio/critic/video_qa.py` + a visual review of its contact sheets | QA ≥ 90; 0 anti-AI fails; loudness -14 ±1 LUFS |

## Inner loop: one video, until the judges are happy
1. Run each stage, then its judge.
2. If the stage fails, change the one thing the judge's top issue names. Re-run that stage, and only the stages after it.
3. Keep the change only if the judge's score rose. Otherwise revert it and try the next issue.
4. Stop a stage after it passes or after 5 attempts. At 5 failed attempts, write down why in `studio/results.md` and carry on with the best version.
5. Render order: stills first, then a draft (540p), then the master. Never start the master before the stills and the draft pass.

## Outer loop: across videos
- `studio/results.md` gets one row per video:
  - date, topic, the signal score;
  - every judge's final score and the number of attempts;
  - render minutes.
- When a video is published, Bendik adds its real 48-hour numbers from YouTube Studio: CTR, average view duration, and retention at 30 s and 50 %. There is no YouTube API, by design.
- Every 5 videos, compare the judges' scores with the real retention.
  - Where a judge disagreed with reality (it scored high but retention was low), adjust that judge's weights.
  - Record the change and its reason in `studio/judge-changes.md`.
  - This is how the critics learn what actually holds attention.

## The writer never judges itself
A score only counts when it comes from a separate agent that didn't write the work and hasn't seen the writer's self-scores. The pilot proved why: the writer's own emotion tags gave 100/100, while the blind reviewer gave 86/100 and 13/94 on the checklist.

## Never
- Upload to YouTube automatically. Delivery stops at the Drive folder.
- Publish a fact without a source in SOURCES.md. Timely facts are re-checked on publish day.
- Use footage, music or images without a clear licence. Every asset goes in its project's credits.
- Fake a person: no AI faces of real people, no cloned voices without consent.
