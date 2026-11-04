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
- Run the loop:
  1. `python3 studio/critic/script_critic.py projects/<slug>/SCRIPT.md`
  2. Fix the top issue, then run it again.
  3. Keep a change only if the score rises.
  4. Stop at the bar in `studio/program.md` or after 5 attempts.
- Then a reviewer agent reads the script cold against `emotional-engine.md` and the copy rules in the brain. Use `copy-principles` and the legends; Schwartz's awareness levels decide the hook. Fold in its top 3 notes.

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
