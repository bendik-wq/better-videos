# Reverse: Kurzgesagt, "AI Just Crossed the Terrifying Line – Now What?" vs our ep10

Source: https://www.youtube.com/watch?v=ujkD4SxPKOI (21:43, ~23M views), fetched 2026-11-06 via Monid at 480p.
Measured with `tools/reverse/reverse.mjs`; frames read by DeepSeek (`tools/reverse/read.mjs`), spot-checked by
Claude (pixel morph at 78.3 s, typed chat bubble at 69.6 s confirmed; sound section corrected). Study only: we take
techniques and numbers, never their characters, art, voice, music, logo or name.

## Side by side
| | Kurzgesagt | Ours (ep10 final, 13:10) |
|---|---|---|
| Cuts/min | **6.5** | 8.7 |
| Median shot / longest | 6.9 s / **81 s** | 6.5 s / 24 s |
| Shot length 10–90 % | 1.2–17.9 s (wide spread) | 3.2–12.1 s (narrow) |
| Change windows/min inside shots | 32.9 | 31.8 |
| Holds ≥ 3 s | 47 in 21.7 min | 47 in 13.2 min |
| Cuts in a speech pause | **45 %** (chance 19 %) | 34 % (chance 27 %) |
| Sound onset within ±0.25 s of a cut | **8 of 142** | 94 of 114 |
| Strong onsets/min | 26 | 39 |
| Narration | 152 wpm, 10.4 pauses/min | 139 wpm, 14.5 pauses/min |
| Loudness | −16.4 LUFS, LRA 2.3 | −14.1 LUFS, LRA 2.0 |
| Ground | near-black/navy ~44 %, white ~2 % | paper ~45 %, ink ~4 % |

## What they do that we don't
1. **Range of shot lengths.** Fast 1 s inserts and 20–80 s held diagrams in the same film. Our shots all sit in
   3–12 s, so the film has one speed. Long holds work because something inside changes every ~1.8 s.
2. **Cut in the breath.** Almost half their cuts fall in a narration pause (2.4× chance). Ours cut on words.
3. **Sound off the cut.** Their hits and whooshes lead into or out of a cut by 0.3–0.9 s; they almost never stack
   a hit on the cut frame. We put a sound on 82 % of cuts, which reads as mechanical.
4. **Faster, denser narration** (152 vs 139 wpm, fewer pauses), mixed quieter (−16.4 LUFS).
5. **Devices:** one glowing subject on a dark field; isometric cutaway rooms; neon network diagrams that grow node by
   node; typed chat bubbles (letters in ~0.5 s, hold 2–5 s); one pixel-break morph at a meaning shift (~0.5 s);
   push/pull through the frame only as punctuation (0.4–2.5 s); a 9–16 cuts/min burst only in recap and ending.

## Rules for our next episode (shot-design and engine)
- **R1 Spread:** per chapter, at least one held shot ≥ 20 s with an internal change every 1.5–2.5 s, and at least
  three inserts ≤ 1.5 s. Target 10–90 % shot length ≈ 1.5–18 s.
- **R2 Cuts/min:** 5–7 average; explanation sections 3–5; only recap/ending above 9.
- **R3 Cut in pauses:** about half the cuts on a narration gap ≥ 0.4 s (cue syntax: cut at the gap after the word,
  not on the word). Check with `reverse.mjs` on our render: "cuts in a speech pause" ≥ 40 %.
- **R4 Sound off the cut:** default no hit on the cut frame; place the effect 0.3–0.9 s before (lead-in) or after
  (land) the cut. Keep on-cut hits for ≤ 15 % of cuts (chapter turns, reveals). Check: onsets within ±0.25 s of a
  cut ≤ 20 % of cuts.
- **R5 Narration:** 145–155 wpm, ≤ 11 pauses ≥ 0.6 s per minute outside planned silences.
- **R6 Camera:** locked by default; push/pull-through only as punctuation, ≤ 1 per 2 minutes.
