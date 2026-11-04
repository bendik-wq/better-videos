---
name: studio
description: One command from signal to a ready-to-post video. Finds what people are searching and reading right now (or takes a given topic), picks the strongest idea, packages it, writes a retention-engineered script, plans shots, renders, and loops each stage against its critic until it passes. It then packages the result and puts it in the Google Drive "ready to post" folder. Use for "make today's video", "make a video about <topic>", "run the studio", or any request to produce a full video end to end automatically.
---

# /studio — signal to ready-to-post

The loop rules are in `studio/program.md`: read it first. This skill is the order of operations.
The existing skills do the craft; this one chains them and runs the judges.

## 0. Pick the story
- **Given a topic:** skip to step 1.
- **"Today's video":**
  1. Run `python3 studio/signals/radar.py --top 25` and read `studio/signals/out/<date>.md`.
  2. Take the top 5 **channel picks**.
  3. Run the `idea-engine` skill on them, together with the top of `docs/library/topic-bank.md`.
  4. Pick the highest-scoring idea that passes the idea bar in `studio/program.md`.
  5. Prefer stories with a known villain or disaster, an absurd number, or a belief to reopen (the topic bank's F1–F5).
- Create `projects/<slug>/`. Write `IDEA.md` with the signal row, the idea score and why this one won.

## 1. Package first
- Run the `packaging` skill: titles, thumbnail concepts and an A/B plan in `projects/<slug>/YOUTUBE.md`.
- If the idea can't be titled and thumbnailed clearly, go back to step 0 and take the next idea.

## 2. Research and facts
- Build `projects/<slug>/SOURCES.md` with `docs/library/fact-check-playbook.md`.
- Every number in the title, the thumbnail and the script needs a source.
- Timely facts get ⏱ and are re-checked before delivery.

## 3. Script, looped
- Run the `retention-script` skill to write `projects/<slug>/SCRIPT.md`.
- Annotate each beat for the critic: `<!-- beat: <name> | emotion: <word> <1-5> | open: L1 | close: L0 -->`.
  The emotion words and intensities come from `docs/research/emotional-engine.md`.
- Make it **one story**: each beat ends on the question the next beat answers ("but / therefore", never "and then").
- Plan one emotional peak at least every 3 minutes, with the biggest in the last third.
- Run the loop. The writer never scores itself:
  1. A **separate blind reviewer agent** copies the script to `review/SCRIPT.blind.md`.
     - It re-rates every beat's emotion as a cold viewer and fixes any loop tags the narration doesn't support.
     - It must not see LOOP.md, SCORECARD.md or the writer's ratings.
     - It runs `python3 studio/critic/script_critic.py` on the blind copy and scores the `emotional-engine.md` checklist.
     - It writes `review/BLIND-REVIEW.md` with the click-away moments and the top 5 changes.
  2. The writer applies the top changes.
  3. A fresh blind reviewer scores the new version.
  4. Keep the revision only if the blind score rose.
  5. Stop at the bar in `studio/program.md` or after 5 rounds. Log each round in `LOOP.md`.
- When the `brain` repo is attached, also run its language pass (`wiki/engine/persuasion/nlp/nlp-copy-checklist.md`) on the script. Use only evidence-graded A/B techniques. Never pressure, never fake urgency, and never claim hypnotic effects.
- Fold in the copy rules from the brain where they fit: `copy-principles`, the legends, and Schwartz's awareness levels for the hook.

## 4. Shots and look
- Run the `shot-design` skill to make the shot plan and the params for `project.mjs`.
- Run `make-video` with `--stills` to render look-dev stills.
- Montage the stills into a contact sheet and review it yourself against `docs/research/anti-ai-look.md` and `docs/style-bible.md`.
- Fix every fail and re-render those stills. Then render the draft.

## 5. Render and video QA, looped
1. Render the draft and run `python3 studio/critic/video_qa.py <draft.mp4>`.
2. Review its contact sheets with the anti-AI checklist.
3. Fix, re-render the changed shots, then QA again.
4. When the draft passes, render the master and QA it once more.

## 6. Deliver
1. Write `projects/<slug>/SCORECARD.md`:
   - every judge's final score and number of attempts;
   - open risks;
   - facts to re-check on publish day.
2. Run `python3 studio/deliver.py --project projects/<slug> --video <master.mp4> --title "<chosen title>" --thumbs <thumbnail stills>`. It builds `studio/deliveries/<date>-<slug>/` and uploads the video, giving a download link.
3. Mirror that folder to Google Drive with the Google Drive tools.
   - Use a folder named **"Studio — Ready to post"**; find it, or create it once.
   - Inside it, create a subfolder named `<date> — <title>`.
   - Upload `YOUTUBE.md`, `SCRIPT.md`, `SCORECARD.md` and `SOURCES.md` as Google Docs.
   - Upload the thumbnails as images.
   - Upload a doc called "VIDEO DOWNLOAD" containing the link and md5.
4. Append the row to `studio/results.md`. Tell Bendik the Drive folder and the title.
5. Never upload to YouTube.

## Time and cost
- A 12–16 min master renders at about 2–4 frames per second in the cloud. That's hours.
- Run the master render in the background, and do packaging QA meanwhile.
- If the session can't finish the master, deliver the draft. Mark the master as pending in the scorecard.
