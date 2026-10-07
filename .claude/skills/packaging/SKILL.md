---
name: packaging
description: Packaging-first ideation. Generate and score YouTube titles and thumbnail concepts for a video idea before any script is written, in the channel's photographic style, and plan a Test & Compare A/B test. Use when asked for titles, thumbnails, video ideas, angles, or whether an idea is worth making, and always before retention-script.
---

# Packaging, before scripting

If you can't title and thumbnail an idea clearly, it isn't an idea yet (Paddy Galloway).
Sources and evidence are in `docs/research/retention-playbook.md` §8–9. The visual taste is in
`docs/style-bible.md`, and its rules override generic YouTube thumbnail habits.

## Inputs

- The idea or topic.
- The audience: the core viewer, plus who a casual or new viewer would be.
- The affiliate offer, so the packaging doesn't promise something the offer contradicts.
- Any known facts or numbers. Packaging may only promise what research can deliver.

## Step 1: find the angle

State the idea as **"familiar but unexpected"**: a known frame with one twist. Try at least
four of these frames:

- **Hidden mechanism:** how X *actually* makes money; the real reason Y.
- **Superlative:** the biggest, first, last, only or most dangerous.
- **Matchup:** X vs Y; $1 vs $1B; the 1999 version vs the 2026 version.
- **Stakes ladder:** three tiers of the same thing, escalating.
- **Villain or contrarian:** the thing everyone believes is wrong, or a person who bet against
  everyone.
- **Mystery object:** one physical object that holds the whole story. This is Fern's strongest
  frame and suits our renderer.
- **Countdown:** "the N days / decisions / mistakes that…"

Check **core / casual / new**: would each group click? If only the core would, broaden the
frame. If it no longer fits the channel, aim for about 80% audience overlap and treat the rest
as a labelled experiment.

**Kill rule:** if Step 2 can't produce 25 decent titles and Step 3 can't produce 3 genuinely
different thumbnails, kill or reframe the idea now, before research money is spent.

## Step 2: titles. Generate 25–50, keep 5

- Usually ≤50 characters, never more than 60. Use plain words a non-native speaker gets
  instantly.
- One curiosity gap per title, and it must be **specific**: "The $3B Company With No
  Product", not "You Won't Believe This Company".
- Extreme and specific beats mild: "Peter Thiel's Worst Bet" beats "A Look at Thiel's
  Investments". Prefer a concrete noun or number over an adjective.
- Never repeat the thumbnail text. Title and thumbnail should *complement* each other, so
  together they form the full question.
- Only promise what the video delivers in its first 30 s and resolves by the end (legitbait,
  not click traps). Test & Compare scores on watch time, so misleading packaging loses.
- Avoid: clickbait caps, "SHOCKING", emoji, colons that read like a lecture title, and
  "(Documentary)".

**Score each title out of 10** and keep the top 5:

| Criterion | Pts |
|---|---|
| Specific curiosity gap: a real question the viewer can't answer from the title alone | 3 |
| Concrete noun or number | 2 |
| ≤50 chars (1 pt if 51–60, 0 if longer) | 2 |
| Accurate: the video can deliver it in full | 2 (gate) |
| Clear to casual and new viewers with no jargon | 1 |

## Step 3: thumbnail concepts. Sketch 10, keep 3 "adequately different" ones

Each concept must pass the **glance test**: understood in 1–2 s at 168×94 px (mobile size).
"Different" means a different *idea*, not a different colour.

House style, following the style bible: photographic, not graphic design. Each concept:

- **One hero object or figure** in darkness, with **one motivated key light**: work light,
  sodium, fluorescent or flash. Darkness is the default; light is the event.
- **One palette** per thumbnail: *sodium* `#ffa860` on blue-black, *fluorescent* `#58ffa0` on
  green-black, *work light* `#fff0dc` on black, or *direct flash* with an absurd subject played
  deadpan.
- **Red `#e0241b` only as annotation**: a hand-drawn marker loop or leader line on the one
  detail that carries the question. One red element at most.
- **Text is optional, and ≤3 words** (the house limit, stricter than the usual 2–4). Use
  *Instrument Serif* for a word or a number; an *Archivo Narrow Bold* red numeral is allowed
  for counts. Put it in a corner or edge, never centred, with no gradients, glow or outlines.
- Show a **tension**: an object where it shouldn't be, a number that's too big, a calm figure
  inside chaos (the stoic-operator theme), or danger.
- Never use realistic CG humans, stock-AI-looking imagery, multiple accents or busy collages.

For each concept, write:

1. a one-line idea (what question does it plant?);
2. the hero object or subject and the set;
3. the light and palette;
4. the red annotation target;
5. any text (≤3 words);
6. how it pairs with each of the top 3 titles;
7. how to make it: render it as a still from a `scene.js` set (for example
   `node engine/render.mjs projects/<name> --stills=0.5 --only=thumb`, at 1280×720), or use an
   archive photo on a 3D card.

**Score each concept out of 10:**

| Criterion | Pts |
|---|---|
| Glance test: readable at mobile size in about 1 s | 3 |
| Plants a question the title doesn't already answer | 2 |
| Psychology of the click: tension, danger, novelty or an unusual object | 2 |
| On-taste: one key light, one palette, red only as annotation, ≤3 words | 2 |
| Accurate: the image or object appears in the video, ideally in the first 30 s | 1 (gate) |

## Step 4: pick a package and log the promises

- Choose **title #1 and thumbnail #1**: the pair you'd ship if no test existed.
- Write the **promise list**: every object, number and claim in the pair. Hand it to
  `retention-script` §1. Each item must be confirmed by 0:30 and paid off later.
- Write a **prediction** (expected views at 7 and 28 days, and CTR band) so one result
  doesn't cause panic or false confidence.

## Step 5: Test & Compare plan

- Test up to 3 variants. Test **thumbnails or titles, not both at once**, unless the
  hypothesis is about the pair.
- Variant 1 is the default (it wins if the result is "None"). Variants 2 and 3 test different
  *ideas*: for example, object versus figure, or number versus no text.
- Run until YouTube reports a result, up to 2 weeks. **Don't edit the title or thumbnail
  mid-test**, because that stops it. The winner is chosen on watch-time share, not CTR.
- Log the result in `docs/research/packaging-log.md`, creating it if needed:
  `date | video | variants | result | watch-time share | lesson`.
- Revisit underperformers after 30 days. Repackaging old videos can multiply views per day.

## Output format

Write `projects/<name>/packaging.md` containing:

- the angle;
- the C/C/N check;
- all titles with scores, top 5 starred;
- 3 thumbnail concepts with scores;
- the chosen pair, the promise list and the prediction;
- the A/B plan.
