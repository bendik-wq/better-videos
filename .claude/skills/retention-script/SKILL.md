---
name: retention-script
description: Turn a topic and an affiliate/B2B offer into a 15–20 min retention-engineered documentary script outline (hook, timestamped beat sheet, open-loop ledger, ~90 s re-hooks, chapter cards, affiliate and mid-roll placement), or score an existing draft script. Use when asked to outline, script, structure, pace or review a long-form video before it goes to make-video.
---

# Retention script

Evidence and sources are in `docs/research/retention-playbook.md`; read it once per session.
Visual and sound rules are in `docs/style-bible.md`. This skill produces the outline and
narration draft. `make-video` turns them into shots.

## Inputs (ask only for what's missing)

1. **Topic** and the **one central question** the video answers.
2. **Packaging**: the chosen title and thumbnail from the `packaging` skill. If there isn't
   one yet, run `packaging` first. The script exists to deliver on the packaging.
3. **Offer**: product, who it's for, the one concrete outcome or number, the link, and the
   relationship (affiliate commission, paid sponsor, or our own product).
4. **Target length**: 15–20 min, default 18:00. Budget **~150 spoken words per minute**, so
   18 min is about 2,700 words. Re-measure with the actual Piper voice and update this number.
5. **Research pack**: facts, each with a source. Every number in the VO needs a source caption
   (style bible).

## Output

Write `projects/<name>/outline.md` containing the sections below, in order.

### 1. Promise line

Write one sentence: *"By the end, you'll know ___, which explains ___."* Then list every
promise the title and thumbnail make (the object shown, the number named, the claim). Each one
must appear on screen or in the VO **by 0:30**, and its payoff must land later.

### 2. Hook (0:00–0:30). Write 3 versions, pick 1

Formula: **concrete scene → context → "But…" → contrarian turn → the question**.

- **0:00–0:05: Image first.** The thumbnail's hero object or scene, lit by its one motivated
  key light. No logo, no greeting, no "in this video".
- **0:05–0:15: Context lean.** Who, what and how much, in plain words, so the right viewer
  self-selects.
- **0:15–0:22: Interjection.** "But…", "Except…" or "And yet…". A sound hit or flash frame is
  allowed here.
- **0:22–0:30: Snapback and question.** The counter-intuitive fact that makes the central
  question unavoidable. This opens loop **L1**.
- **0:30–1:00: Stakes and payoff tease.** Why it matters (money, power, the viewer's own
  life), plus a glimpse of the best back-half moment ("front-loading"). This opens loops
  **L2–L3**.
- **~1:00: Title card.** The drone drops out and the title hits (style bible). This is the
  first natural ad-free breath; don't put an ad slot here because it's too early.

Read all three hooks aloud, or render them with Piper, and keep the one with the fewest words
before the "But".

### 3. Beat sheet with timestamps

The default for 18:00 is below. Scale every timestamp proportionally for other lengths.

| # | Time | Chapter / beat | Job | Re-hook device | Loops |
|---|---|---|---|---|---|
| 0 | 0:00–1:00 | Cold open | Hook, stakes, tease | (hook) | open L1–L3 |
| T | 1:00–1:08 | Title card | Breath | sound hit | |
| 1 | 1:08–3:30 | **Ch.1** setup | Show, don't describe; fast scene changes | ~1:40, ~2:20, **re-engagement ~3:00** | close L3, open L4 |
| A | 3:30–4:30 | Affiliate (option A) | §5 | the return line reopens L1 | |
| 2 | 4:30–8:00 | **Ch.2** escalation | Best material; stair-step the stakes ×3 | ~5:10, **re-engagement ~6:00**, ~7:20 | open L5 |
| 3 | 8:00–11:30 | **Ch.3** mechanism | "How it actually works": the lull, so make it highly visual | ~9:00, ~10:30 | close L2 |
| 4 | 11:30–15:00 | **Ch.4** twist | The *but*: reframe L1 and raise the stakes once more | ~12:30, ~13:50 | close L4, open L6 |
| 5 | 15:00–17:30 | **Ch.5** payoff | Answer L1. Optional 10–15 s affiliate callback (option B) if it truly fits | ~16:00 | close L1, L5, L6 |
| E | 17:30–18:00 | Button | One-line implication; end abruptly | | all closed |

For each beat, the outline lists:

- the VO draft, with a word count;
- the picture, as a set or object for `scene.js`, in the style-bible language;
- the sound cue;
- the source line, if a number appears.

### 4. Re-hooks: one every ~90 s, no gap over 120 s

Rotate between these devices. Never use the same one twice in a row.

- **New question:** "So where did the other $3B go?"
- **Stakes jump**, stair-stepping: a million, then a billion, then a country.
- **Reveal:** a document, a number, a photo. Show it, don't describe it.
- **Reversal:** "But that's not what happened."
- **Countdown or ladder:** "Three things had to go wrong. This was the first."
- **Gear change**, from the style bible: smooth dolly to step-print, a flash cut on a hard
  tonal shift, the drone dropping out.
- **Callback** to the cold-open image, now understood differently.

The big **re-engagements at about 3:00 and 6:00** must be "wow factor": something the viewer
can't get elsewhere, such as a tracked 3D reconstruction, a primary source, or a number we
computed ourselves.

### 5. Open-loop ledger

Maintain this table. Each loop must be opened explicitly and closed explicitly.

| ID | Opened at | Question (viewer's words) | Closed at | Payoff |
|---|---|---|---|---|
| L1 | 0:28 | "How did X actually make money?" | 16:40 | … |

Rules:

- Keep **2–4 loops open at all times**, but never more than 4.
- L1 closes in the last 15% of runtime.
- Never close a loop without opening another, until the payoff chapter.
- Every thumbnail and title promise has a loop.

### 6. Chapter cards

- Use 4–6 chapters, each **≥10 s** apart.
- The description list starts at **00:00**, with at least 3 entries, in ascending order.
- Names are curiosity, not labels: "The $40B mistake", not "Background".
- On screen: Archivo Narrow Bold red numeral plus an Instrument Serif title in a corner. The
  drone drops out and the card hits. Never a centred lower third.
- Write the description chapter list into the outline:

  ```
  00:00 <cold-open name>
  01:08 Ch.1 …
  ```

### 7. Affiliate segment

Default to **option A**: right after the first payoff (Ch.1's close, about 20–25% of
runtime). Never put the full read inside the first 60 s. Run 45–75 s, about 110–180 words.

1. **Bridge:** one sentence that grows out of the problem Ch.1 just raised.
2. **Disclose** in the same breath, spoken and as on-screen text:
   - "This part is sponsored by ___" for a paid sponsor;
   - "I earn a commission if you sign up through my link" for an affiliate.
   Never write "sp", "spon", "collab" or a bare "thanks".
3. **Mechanism:** what the offer does for the kind of company in this story, with **one
   concrete number**. Show it in our own visual language; keep the picture moving.
4. **One call to action:** one link and one reason to act now.
5. **Return line:** reopen L1 with a sharper question than before.

Optional **option B**: a 10–15 s callback inside the payoff chapter, only where it's genuinely
on-topic. It also needs a short disclosure.

Don't claim to have used the product unless we have. Make no performance claims the vendor
can't substantiate.

Publish checklist, in the outline:

- [ ] Disclosure is spoken and on screen during the read.
- [ ] The description link line reads "Paid link — I earn a commission: <url>" and sits next
      to the link, above "show more".
- [ ] YouTube Studio → *Includes paid promotion* is ticked whenever a third party compensates us.

### 8. Mid-roll ad slots

- Videos ≥8:00 only.
- Place manual slots at **chapter-card silences**, roughly every 3–4 min, starting **after
  3:00**.
- No slot within 60 s of the affiliate read, inside a sentence, or inside the final 90 s.
- Leave automatic slots on as well; manual plus automatic averaged more than 5% more revenue.
- List the timestamps in the outline.

## Self-check: score the draft out of 100

Score every draft before handing it to `make-video`. Show the table, the total and the three
cheapest fixes.

| # | Check | Pts |
|---|---|---|
| 1 | Every title and thumbnail promise is visibly confirmed by 0:30 | 10 |
| 2 | First line is an image or claim. No greeting, logo or "in this video" before 0:05 | 6 |
| 3 | Hook follows context → "But" → contrarian turn, and L1 is stated as a question by 0:30 | 8 |
| 4 | Stakes and payoff tease by 1:00 (front-loading) | 5 |
| 5 | Re-engagement beats at about 3:00 and 6:00, and each is wow-factor | 8 |
| 6 | No gap between re-hooks over 120 s (list the gaps) | 8 |
| 7 | Beats joined by but/therefore; flag each "and then" transition, −1 each | 6 |
| 8 | Stakes stair-step at least 3 times | 5 |
| 9 | Open-loop ledger is complete: every loop opened and closed, max 4 open at once | 8 |
| 10 | Back half (Ch.3–4) has new information or reversals, not recap | 6 |
| 11 | The ending lands L1 and then stops; no "so in conclusion" recap | 5 |
| 12 | Affiliate segment: bridge, disclosure, one number, one call to action, return line; 45–75 s; not in the first 60 s | 8 |
| 13 | Disclosure is spoken and on screen; the description line is correct | 4 (gate) |
| 14 | 4–6 chapters with curiosity names; the 00:00 list is valid | 3 |
| 15 | Every number has a source line; no unsourced claims | 5 (gate) |
| 16 | Word count within ±10% of the budget; one idea per sentence; reads aloud cleanly | 5 |
| 17 | Cut pass done: at least 10% of the first draft removed | — (note it) |

Thresholds:

- **≥85**: ship to `make-video`.
- **70–84**: fix the listed items.
- **<70**: re-outline.
- **Gates (13, 15):** if either scores 0, the script can't ship whatever the total.

## Handing off to make-video

Turn each beat's VO into `project.json` shot lines, with one shot per visual idea of roughly
4–12 s. Carry the source lines into captions, and carry the chapter-card and ad-slot
timestamps across as notes. After upload, compare the real retention graph against the beat
sheet. Log the dips by beat in `projects/<name>/retention-notes.md` and adjust this template.
