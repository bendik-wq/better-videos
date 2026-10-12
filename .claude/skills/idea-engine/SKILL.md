---
name: idea-engine
description: Generate, score and rank documentary video ideas for the channel (AI, tech, money, power, geopolitics, business mysteries) from the topic bank plus fresh news searches, then hand the winning idea to packaging. Use when asked what video to make next, for new video ideas or angles, to refresh or rescore the topic bank, to check whether a news story is worth a video, or to plan the next few episodes.
---

# Idea engine: from "what next?" to one idea ready for packaging

Sources, read in this order:
1. `docs/library/topic-bank.md`: 256 scored ideas, the scoring rubric and the top 30.
2. `docs/library/video-autopsies/README.md`: what the biggest videos in our genre actually do,
   with the cross-video patterns (title shapes, thumbnail grammars, hook timing, heatmap peaks).
3. `docs/research/channel-breakdowns.md` §0: the outlier data behind the five factors.
4. `docs/library/fact-check-playbook.md` §1: the source tiers that decide the research score.

The output is **one chosen idea plus two runners-up**, written so `packaging` can start at once.

## Inputs (ask only for what's missing)
- How many ideas the user wants back (default: a ranked shortlist of 10 and one winner).
- Any constraint: a theme, a deadline, an affiliate offer that must fit, or "timely only".
- The last 3 episodes' topics and cold-open mechanisms (from `projects/*/outline.md`), so the
  engine doesn't repeat a lane or a hook mechanism.

## Step 1: pull candidates from the bank
- Take the top 30 (★) from `topic-bank.md`, plus any idea scoring ≥21 in the lane the user asked
  for.
- Drop anything we've already made (check `projects/`) and anything whose `Sat` note names a
  video that the new angle can't clearly beat.

## Step 2: fresh ideas from the news (10–20 candidates)
Load `WebSearch` and `WebFetch` with ToolSearch. Run at least six searches, dated to this week
and month:
1. `"<month> <year>" AI lawsuit OR investigation OR leak`
2. `"<month> <year>" SEC charges OR DOJ indictment fraud company`
3. `"<month> <year>" data center power OR water OR chips export`
4. `"<month> <year>" sanctions OR tariffs OR shipping chokepoint`
5. `"<month> <year>" bankruptcy OR collapse OR short seller report`
6. `"<month> <year>" surveillance OR data broker OR spyware`
Prefer tier 1–2 sources (court filings, regulators, official statistics) and tier 5 outlets with
corrections policies (`fact-check-playbook.md` §1). Ignore pages with impossible dates or no author.

For each news item, ask: **is there an evergreen question underneath it?** A filing is news; "how
does this kind of fraud work" is a video. Write the idea as *timely peg + evergreen core* (Life = H).
Pure news (T) is worth making only if we can publish within about 7–10 days and be the clearest
video on it (Fern's six-minute "Mapping the Trump Shooting" is the model, `channel-breakdowns.md` §2).

## Step 3: write each new idea in bank format
`Title | Thumbnail concept | Hook | F1F2F3F4F5 | E/H/T | Res | Vis | Key sources`
- **Title:** ≤50 characters, a concrete noun or number, one specific curiosity gap
  (`packaging` Step 2 rules).
- **Thumbnail concept:** one hero object, one key light, one red annotation, ≤3 words
  (`packaging` Step 3 gates).
- **Hook:** one or two spoken sentences: image, then turn (`hooks.md` §0).
- **Sources:** at least two named tier 1–4 sources, or Res can't exceed 3.

## Step 4: score (rubric in `topic-bank.md`)
- Outlier F1–F5, 0–2 each. Be strict: a 2 needs a concrete reason you could write in one line.
- Life: E 5, H 4, T 2. Res 1–5. Vis 1–5. Sat 0 to −2 (search YouTube titles for the angle:
  `yt-dlp --flat-playlist --print "%(view_count)s|%(title)s" "ytsearch20:<angle>"`; a top-channel
  video over 2M views on the same angle is −2).
- **Total = Out + Life + Res + Vis + Sat (max 25).**
- Show a table of all candidates (bank + fresh), sorted by total.

## Step 5: stress-test the top 5
For each of the top 5, answer in one line each:
1. **The 3:00 and 6:00 wow factors**: what can only we show (a reconstruction, a primary
   document, a number we computed)? If neither exists, −2.
2. **The hero object** for the thumbnail and cold open. If there is none, −2 (it fails the
   "distinctly visual" test that Vox's founding producer set, `channel-breakdowns.md` §6).
3. **The fact risk**: does it accuse a named living person or company? If yes, note the status
   ladder level and that it needs a legal read (`fact-check-playbook.md` §5).
4. **Fit**: does it fit the channel's lane and an affiliate offer without contradiction?
5. **Packaging smoke test**: write 5 titles and 2 thumbnail ideas in 2 minutes. If they're weak,
   −2. (The full 25-title test happens in `packaging`.)

Re-rank after the adjustments.

## Step 6: pick and hand off
Write `docs/library/idea-log.md` (create it if needed; append, never rewrite):

```
## <date> idea-engine run
Winner: <title> (<total>/25) · lane · E/H/T
Why: <two lines: which outlier factors, which wow factor>
Runners-up: <title> (<total>), <title> (<total>)
Fresh ideas added to the bank: <n>
Sources consulted: <urls>
```

Then add the fresh ideas that scored ≥19 to `topic-bank.md` in the right section (same row
format; keep the numbering in the section tables), and mark the winner's row
`IN PRODUCTION <date>`.

Finally, **invoke the `packaging` skill** with:
- the angle as "familiar but unexpected" (one line);
- the winning title and thumbnail concept as the starting point, not the final pair;
- the hero object, the two wow factors, and the promise the video must keep;
- the key sources, so packaging promises only what research can deliver.

## Rules
- **Never pick an idea that can't pass the packaging kill rule** (25 titles, 3 different
  thumbnails).
- **Don't chase a trend you can't out-explain.** If three big channels covered it this week, skip
  it unless we have primary material they don't.
- **Rotate lanes.** No more than two consecutive episodes in the same section of the bank.
- **Fact-safety from the start.** An idea whose central claim is an allegation gets the status in
  its title ("charged", "accused", "the case against") or a different angle.
- **Re-score the bank quarterly**: update Sat (new competitor videos), drop dead timely ideas,
  and log what our own published videos did against their predicted score.
