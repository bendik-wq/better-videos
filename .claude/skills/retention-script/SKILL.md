---
name: retention-script
description: Turn a topic and an affiliate/B2B offer into a 12–20 min retention-engineered documentary script outline (story structure, 3 scored hook variants, timestamped beat sheet, open-loop ledger, re-hooks every 30–40 s, chapter cards, affiliate and mid-roll placement, TTS-ready narration, fact-safety pass), or score an existing draft script. Use when asked to outline, script, structure, pace or review a long-form video before it goes to make-video.
---

# Retention script

Read once per session, in this order:

1. `docs/research/script-patterns.md`: the 7 story structures, beat devices, TTS rhythm and
   fact-safety rules. **This skill follows it step by step.**
2. `docs/research/hooks.md`: 103 cold-open templates by mechanism, the hook score, 50 re-hook
   lines and 30 ending buttons.
3. `docs/research/retention-playbook.md`: the evidence (YouTube rules, the MrBeast memo,
   affiliate disclosure law).
4. `docs/research/channel-breakdowns.md` and `docs/research/editing-library.md`: skim the
   sections relevant to the topic.

Visual and sound rules are in `docs/style-bible.md`. This skill produces the outline and the
narration draft; `shot-design` and `make-video` turn them into shots.

## Inputs (ask only for what's missing)

1. **Topic** and the **one central question** the video answers.
2. **Packaging**: the chosen title and thumbnail from the `packaging` skill. If there isn't
   one yet, run `packaging` first. The script exists to deliver on the packaging.
3. **Offer**: product, who it's for, the one concrete outcome or number, the link, and the
   relationship (affiliate commission, paid sponsor, or our own product).
4. **Target length**: 12–20 min, default 16:00. Budget **~150 spoken words per minute** of
   runtime (Palantir measured ~153 wpm at Kokoro `af_heart` 0.96, including pad gaps), so 16 min
   is about 2,400 words. Re-measure after any voice or speed change and update this number.
5. **Research pack** (`RESEARCH.md`): facts, each with a source and a status (fact, reported,
   alleged, charged, admitted, convicted; see `script-patterns.md` §4.2). Every number in the VO
   needs a source caption (style bible).

## Output

Write `projects/<name>/outline.md` with the sections below, in order, then the narration draft
in `projects/<name>/SCRIPT.md` (one VO line per beat, as in `projects/palantir/SCRIPT.md`).

### 1. Promise line

One sentence: *"By the end, you'll know ___, which explains ___."* Then list every promise the
title and thumbnail make (the object shown, the number named, the claim). Each must appear on
screen or in the VO **by 0:30**, and each must be paid off later.

### 2. Structure: choose one spine

Use the chooser in `script-patterns.md` §1: investigation, rise and fall, hidden system,
countdown, duel, mystery box, or explainer-with-twist. Write:

- the structure and **why** it fits (one line);
- the runner-up and why it lost;
- the structure's beat table, rescaled to the target length, with chapter names written as
  curiosity ("The $40B mistake", not "Background");
- the structure's own rule (e.g. the mystery box's hero object in every chapter; the hidden
  system's traced unit; the countdown's on-screen clock).

### 3. Hook: 3 templates, 3 variants, scored

1. **Pick 3 templates from 3 different mechanism groups** in `hooks.md` (§1–§15). At least one
   must be the mechanism that matches the thumbnail (usually mystery object, shocking number or
   villain). Don't reuse a mechanism used in either of the last 2 episodes' cold opens.
2. **Write 3 full cold opens (0:00–~1:00)**, one per template, each following the anatomy in
   `hooks.md` §0:
   - **0:00–0:05, image**: the thumbnail's hero object or scene, lit by its one motivated key
     light. No logo, greeting or "in this video".
   - **0:05–0:15, lean**: who, what, how much, in plain words.
   - **0:15–0:22, turn**: "But…", "Except…", "And yet…". A sound hit or flash frame is allowed here.
   - **0:22–0:30, loop**: the counter-intuitive fact that makes the central question
     unavoidable. This opens **L1**.
   - **0:30–1:00, stakes and payoff tease**: why it matters (money, power, the viewer's life),
     plus a glimpse of the best back-half moment ("front-loading"). Opens **L2–L3**.
   - **~1:00, title card**: the drone drops out and the title hits. No ad slot here.
3. **Score all three** with the hook score (`hooks.md` §0, out of 25, plus the fact-safety gate).
   Show the table.
4. **Keep the winner only if it scores ≥20/25.** If none does, rewrite the best one and rescore.
   On a tie within 2 points, keep the one with fewer words before the turn. Render the top two
   with the project voice if time allows, and listen.
5. Record the losing two in the outline (they're re-hook and trailer material).

### 4. Beat sheet with timestamps

Start from the chosen structure's beat table (`script-patterns.md` §1) at the target length.
The frame every structure shares:

| Beat | Default at 16:00 | Job |
|---|---|---|
| Cold open | 0:00–1:00 | Hook, stakes, tease; open L1–L3 |
| Title card | ~1:00 | Breath; sound hit |
| Ch.1 | ~1:05–3:40 | Show, don't describe; **re-engagement ~3:00** |
| Affiliate (option A) | ~3:40–4:40 | §8; the return line reopens L1 |
| Ch.2 | ~4:40–7:30 | Best material; stair-step; **re-engagement ~6:00** |
| Ch.3 | ~7:30–10:30 | Mechanism: the lull, so make it highly visual |
| Ch.4 | ~10:30–13:30 | The twist; reframe L1; raise the stakes again |
| Ch.5 | ~13:30–15:40 | Payoff; close L1 and every open loop; optional option-B callback |
| Button | last 10–20 s | One line from `hooks.md` §17; end abruptly |

For each beat, list:

- the VO draft, with a word count;
- the structural device used (`script-patterns.md` §2: open loop, stair-step, callback, reveal
  by numbers, personification, analogy ladder, zoom in/out, misconception first, predict-then-reveal);
- the picture, as a set or object for `scene.js`, in the style-bible language, and its mode
  (`editing-library.md` §3: 3D set, map, document, chart, type, archive, metaphor);
- the sound cue;
- the source line, if a number appears.

### 5. Re-hook ledger: one every 30–40 s, no gap over 45 s

The user's cadence for this channel is **a re-hook every 30–40 s** (this replaces the old ~90 s).
Write the ledger as a table:

| Time | Device group (`hooks.md` §16) | Line | Picture/sound interrupt (`editing-library.md` §2) |
|---|---|---|---|
| 0:34 | Reversal | "But that's not what happened." | Drone drop + hard cut to the document |

Rules:

- **Rotate the groups**: new question, stakes jump, reversal, reveal, countdown, callback, zoom,
  gear change, direct address. Never the same group twice in a row. Direct address ≤3 per video.
- **Every re-hook has a matching change of kind in the picture or sound** (scale jump, mode
  switch, light event, sound event, gear change, time card, annotation, counter), never the same
  kind twice in a row.
- **The big re-engagements at ~3:00 and ~6:00 must be wow factor**: something the viewer can't
  get elsewhere, such as a tracked 3D reconstruction, a primary document, or a number we computed
  ourselves. Use a reveal (R23–R28) or a stakes jump (R09–R14).
- In `SCRIPT.md`, mark each re-hook line with `[↺]`, as Palantir does.
- After writing, **list every gap** between consecutive re-hooks. Any gap over 45 s must be fixed
  before scoring.

### 6. Open-loop ledger

| ID | Opened at | Question (viewer's words) | Closed at | Payoff |
|---|---|---|---|---|
| L1 | 0:28 | "How did X actually make money?" | 14:50 | … |

Rules (`script-patterns.md` §2.1):

- Keep **2–4 loops open at all times**, never more than 4. Nest them: L1 for the video, chapter
  loops closed within 2–4 min, micro loops within 30–60 s.
- L1 closes in the last 15% of runtime.
- Never close a loop without opening another, until the payoff chapter.
- Every thumbnail and title promise has a loop.

### 7. Chapter cards

- Use 4–6 chapters, each **≥10 s** apart.
- The description list starts at **00:00**, with at least 3 entries, in ascending order.
- Names are curiosity, not labels. Each chapter **ends on a cliffhanger** (a question or a
  reversal), never a summary, because the card is also a mid-roll slot.
- On screen: Archivo Narrow Bold red numeral plus an Instrument Serif title in a corner. The
  drone drops out and the card hits. Never a centred lower third.
- Write the description chapter list into the outline:

  ```
  00:00 <cold-open name>
  01:05 Ch.1 …
  ```

### 8. Affiliate segment

Default to **option A**: right after the first payoff (Ch.1's close, about 20–25% of runtime).
Never put the full read inside the first 60 s. Run 45–75 s, about 110–180 words.

1. **Bridge:** one sentence that grows out of the problem Ch.1 just raised.
2. **Disclose** in the same breath, spoken and as on-screen text:
   - "This part is sponsored by ___" for a paid sponsor;
   - "I earn a commission if you sign up through my link" for an affiliate.
   Never write "sp", "spon", "collab" or a bare "thanks".
3. **Mechanism:** what the offer does for the kind of company in this story, with **one
   concrete number**. Show it in our own visual language; keep the picture moving.
4. **One call to action:** one link and one reason to act now.
5. **Return line:** reopen L1 with a sharper question than before. It counts as a re-hook.

Optional **option B**: a 10–15 s callback inside the payoff chapter, only where it's genuinely
on-topic. It also needs a short disclosure.

Don't claim to have used the product unless we have. Make no performance claims the vendor
can't substantiate. The re-hook cadence pauses during the read, but the read must not exceed 75 s.

Publish checklist, in the outline:

- [ ] Disclosure is spoken and on screen during the read.
- [ ] The description link line reads "Paid link — I earn a commission: <url>" and sits next
      to the link, above "show more".
- [ ] YouTube Studio → *Includes paid promotion* is ticked whenever a third party compensates us.

### 9. Mid-roll ad slots

- Videos ≥8:00 only.
- Place manual slots at **chapter-card silences**, roughly every 3–4 min, starting **after 3:00**.
- No slot within 60 s of the affiliate read, inside a sentence, or inside the final 90 s.
- Leave automatic slots on as well; manual plus automatic averaged more than 5% more revenue.
- List the timestamps in the outline.

### 10. Narration draft: TTS-ready

Write `SCRIPT.md` following `script-patterns.md` §3:

- **One VO line per beat**, at most ~3 sentences. Sentences average 10–14 words, never over 25;
  land a short sentence after long ones.
- **Spell every number as spoken** ("forty-two billion dollars", "two thousand and three",
  "seventy-eight percent", "a third"). Digits go only in captions. Never `$2M`, `$4.3B`, `1/3`
  (all misread by Kokoro in our test).
- **Dot letter-by-letter acronyms** the voice might read as a word ("A.S.M.L.", "C.I.A.").
  Respell names the voice gets wrong in the VO only.
- **Never write stage directions** in VO text ("[pause]" is read aloud).
- **Pauses come from line breaks and `padOut`**, not punctuation: put the punch line on its own
  line and give the line before it `padOut` 0.7–1.2 s.
- **Fact-safety**: phrase each claim to match its status (`script-patterns.md` §4.2), attribute
  it (§4.3), include the accused party's response, and never write what a real person thought.

## Self-check: score the draft out of 100

Score every draft before handing it to `shot-design` / `make-video`. Show the table, the total
and the three cheapest fixes. The bar is higher than v1: **re-hooks every 30–40 s, a scored hook,
a declared structure and a fact-safety gate.**

| # | Check | Pts |
|---|---|---|
| 1 | Every title and thumbnail promise is visibly confirmed by 0:30 | 8 |
| 2 | First line is an image or claim. No greeting, logo or "in this video" before 0:05 | 4 |
| 3 | Hook chosen from 3 scored variants (3 mechanisms); winner ≥20/25; L1 stated as a question by 0:30 | 8 |
| 4 | Stakes and payoff tease by 1:00 (front-loading) | 4 |
| 5 | Structure declared (`script-patterns.md` §1); its beats and its own rule are present | 5 |
| 6 | Re-engagement beats at about 3:00 and 6:00, and each is wow factor | 7 |
| 7 | Re-hooks every 30–40 s: list the gaps; −2 per gap over 45 s, 0 if any gap over 60 s | 8 |
| 8 | Re-hook device groups and interrupt kinds never repeat back to back | 3 |
| 9 | Beats joined by but/therefore; −1 per "and then" transition | 5 |
| 10 | Stakes stair-step at least 3 times, one step per chapter | 4 |
| 11 | Open-loop ledger complete: every loop opened and closed, 2–4 open, max 4 | 7 |
| 12 | Back half (Ch.3–4) has new information or reversals, not recap | 5 |
| 13 | ≥2 callbacks (one to the cold-open image) and ≥1 misconception-first or predict-then-reveal beat | 4 |
| 14 | The ending lands L1, uses one button (`hooks.md` §17) and stops; no recap | 4 |
| 15 | Affiliate segment: bridge, disclosure, one number, one call to action, return line; 45–75 s; not in the first 60 s | 6 |
| 16 | Disclosure is spoken and on screen; the description line is correct | 3 (gate) |
| 17 | 4–6 chapters with curiosity names, each ending on a cliffhanger; the 00:00 list is valid | 2 |
| 18 | Every number has a source line; no unsourced claims | 4 (gate) |
| 19 | Fact-safety pass (`script-patterns.md` §4.5): status phrasing, responses, no mind-reading, packaging checked | 4 (gate) |
| 20 | TTS-ready: numbers spelled out, no abbreviations or stage directions, sentences ≤25 words (avg 10–14), pauses via lines/`padOut` | 3 |
| 21 | Word count within ±10% of the budget; reads aloud cleanly | 2 |
| 22 | Cut pass done: at least 10% of the first draft removed | — (note it) |

Thresholds:

- **≥90**: ship to `shot-design` / `make-video`.
- **80–89**: fix the listed items, rescore.
- **<80**: re-outline.
- **Gates (16, 18, 19):** if any scores 0, the script can't ship whatever the total.

## Handing off

Turn each beat's VO into `project.json`/`project.mjs` shot lines, with one shot per visual idea
of roughly 4–12 s (`shot-design` plans them; `docs/research/editing-library.md` has the cut-rate,
interrupt and text rules). Carry the source lines into captions, the `[↺]` re-hooks and their
interrupt kinds into the shot plan, and the chapter-card and ad-slot timestamps across as notes.
After upload, compare the real retention graph against the beat sheet and the re-hook ledger.
Log the dips by beat in `projects/<name>/retention-notes.md` and adjust this template.
