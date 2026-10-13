# LEDGER: motion-graphics kit for micro1 explainers, vertical or 16:9

A 30 fps, 2D-canvas kit for 2–3 minute explainers. It renders vertical (1080x1920) by default, or 16:9 (1920x1080) with `episode({ aspect: '16:9' })`. It is used by an independent channel that is **not
affiliated with micro1**. The look is warm paper (`#f3efe6`) with faint ledger rules and grain, ink `#121212`, money green
`#17a35b`, and a marker yellow `#ffe14d` that swipes behind key words. Red `#e0241b` is used only for strike-throughs and redactions.
Fonts are Big Shoulders Display (OFL, `assets/fonts/`, plus its licence), Archivo Narrow and IBM Plex Mono.

Demos: every set appears once, with real VO. The shots are in `demo-shots.mjs`.

| Command | Output |
|---|---|
| `node engine/render.mjs projects/micro1-kit` | `renders/micro1-kit/demo.mp4` and `contact.jpg` (vertical) |
| `node engine/render.mjs projects/micro1-kit/demo-16x9` | `renders/micro1-kit/demo-16x9.mp4` and `contact-16x9.jpg` (16:9) |

## Frames (portrait and landscape)

The runtime picks the frame from the canvas shape. Sets draw in design units through live bindings (`L.W`, `L.H`, `L.SAFE`, `L.LAND`, `L.MIN_TEXT`, `L.pick(portrait, landscape)`).

| | Portrait 9:16 | Landscape 16:9 |
|---|---|---|
| Design units | 1080x1920 | 1920x1080 |
| Content safe area | x 80–1000, y 220–1500 | x 120–1800, y 90–830 |
| Source line | y ≈ 1478 | y ≈ 860 |
| Captions | y 1500–1700, 2–4 words per line | y 880–1000, 2–5 words per line, centred |
| Minimum text | 44 px | 36 px |

How each set changes in landscape:

| Set | Landscape layout |
|---|---|
| hook | Reflows into the 1–3 lines with the biggest type. `reflow` defaults to true in landscape. |
| tiers | A podium: columns left to right, rising on their words. |
| checklist | Centred column, 1320 wide. |
| flow | Runs left to right. |
| docstack | Wider fan. |
| redact | The doc sits on the left. A shield badge on the right reads "ANONYMIZING…", then "N FIELDS REMOVED", then the stamp. |
| team | Counter and label on the left, a 10-column grid on the right. |
| window | A 6x2 strip. |
| industry | Badge on the left, name and items on the right. |
| qa | Wide bubble, answer on one or two lines. |
| cta | Centred. |

## Making a new episode

1. Create a project directory `projects/<episode>/` that holds two files.

   `project.mjs`:
   ```js
   import { episode, shot as S } from '../micro1-kit/episode.mjs';
   const SRC = 'SOURCE: MICRO1 · COMPANY DATA PARTNERSHIPS';
   export default episode({
     title: 'Episode 1: The $1B data deal',
     shots: [
       S('hook', 'micro1 just put a billion dollars on the table.', { lines: ['$1 BILLION', 'ON THE TABLE'], highlight: 'BILLION' }),
       S('bignum', 'One billion dollars, over twelve months.', { value: 1e9, prefix: '$', label: 'Over 12 months', source: SRC }),
       // ...
       S('cta', 'Search micro1 Company Data Partnerships.', {}, { padOut: 1.0 }),
     ],
     // optional: music: [{ shot, mood, key, intensity, bpm }], say: { word: 'spoken form' }, voice: {...}, settings: {...}
   });
   ```

   `scene.js`:
   ```js
   export { default } from '/projects/micro1-kit/scene.js';
   // or, to switch overlays off:
   // import { makeScene } from '/projects/micro1-kit/scene.js'; export default makeScene({ captions: false });
   ```
2. Check the look on stills: `node engine/render.mjs projects/<episode> --stills=0.3,0.7,0.97`, then montage `out/stills/*.jpg`.
   A draft at 540x960 and 12 fps: add `--draft`.
3. Render the final: `node engine/render.mjs projects/<episode>`. The output is `projects/<episode>/out/<episode>.mp4`. For long runs, use `nohup ... &` and `--status`.
4. Run the QA checks:
   - `ffmpeg -i out.mp4 -vf blackdetect=d=0.3:pix_th=0.06 -an -f null -`
   - a contact sheet: `ffmpeg -i out.mp4 -vf "fps=1,scale=360:-1,tile=10x6" -frames:v 1 contact.jpg`
5. Copy the deliverables to `renders/<episode>/`. The master is about 1.7 MB/s; transcode at `-crf 24` before committing.

`episode()` sets the defaults:
- 1080x1920 at 30 fps.
- Kokoro `af_heart` at speed 1.04, with short-form pause lengths.
- Pronunciations: `micro1` → "micro one", SOP(s), BPO, CRM and QA.
- A light finish: no halation or bloom, faint vignette and grain.
- Music: a `wonder` score at 112 bpm that moves to `triumph` from about 55% in and ends on the CTA.
- `score.transitions`, transition cues and every set's own sounds.
- `settings.hashDirs`, so that edits to the kit invalidate cached chunks.
- `settings.browserArgs` set to software compositing, which makes page capture about 4x faster.

**Rules**
- Write numbers in the VO as words. The voice reads them better, and the cues still match the words.
- The `repeated visual` check in the renderer throws an error if two shots have the same set and identical params.
- Quote only verbatim text in `quote`. The `redact` doc is an illustration, so label it as an example in `meta`.

## Shots, cues and timing

`shot(set, vo, params, extra)` creates a shot. `extra` takes `min`, `padIn`, `padOut`, `id`, and `beats: [[word, set, params], ...]`, which splits a line into several visuals that cut on spoken words.

A **cue** is any param named `at`, `word`, `...At`, or an item's `word`/`at`. It can be written in these forms:

| Form | Meaning |
|---|---|
| `1.8` | seconds into the shot |
| `'billion'` | the first spoken word that starts with "billion" |
| `'billion#2'` | the second occurrence of that word |
| `'billion+0.3'` | the word plus an offset in seconds |
| `{ word, offset, nth }` | the same, as an object |

Items with no cue match their own text against the narration, in order. Items that still don't match are spread evenly between their neighbours.

Every set shows its scaffold (title, ghost slots or drop zone) from the first frame, and keeps moving the whole time. The runtime adds a slow push-in and drift, plus a kick on every `hit`.

**Common params on any shot**

| Param | Effect |
|---|---|
| `source` | A small line above the captions. |
| `captions: false` | Hides the captions on this shot. |
| `trans` | Sets the transition into this shot. |
| `transDur` | Overrides the transition length. |
| `transOpts` | Options passed to the transition. |
| `sfx: false` | Mutes the set's own sounds. |
| `sfxGain` | Scales the set's own sounds. |

## Set API

Layout: content stays inside x 80–1000 and y 220–1500. The source line sits at y ≈ 1478. Captions sit at y 1500–1700. The progress bar is on the top edge. No text is smaller than about 44 px; the source line is 40–46 px.

| Set | Params (defaults) | What it does / sounds |
|---|---|---|
| `hook` | `lines` (array or `'A / B'`), `reflow` (default: landscape on, portrait off), `highlight` (word(s) to swipe yellow), `accent` (word(s) in green), `strike` (word(s) struck red), `kicker` (pill above), `align` (`'center'` or `'left'`) | Giant stacked headline. Each line is sized to the full width. Each word slams in on its spoken word, with a camera kick, then the yellow swipe. Sounds: a soft impact per word, a hit plus a marker on highlighted words. |
| `bignum` | `value`, `prefix` (`''`), `suffix` (`''`), `decimals` (0), `commas` (true), `label`, `highlight` (label words), `sub`, `kicker`, `at` (count start, default the first word), `dur` (about 0.8–1.8 s), `labelAt` | An odometer count-up on rolling digit columns. Leading zeros stay faint until reached. A green rule draws in and the number punches on landing. Sounds: tick run, then a hit. |
| `checklist` | `title`, `kicker`, `items: ['text' \| {text, word\|at, x}]` (`'!text'` = x item) | Card rows slide in on their words, each with a green check. X rows get a red cross and a red strike-through. Ghost slots show until each row lands. Sounds: tick, or a marker for x items. |
| `docstack` | `docs` (default SOP / PLAYBOOK / KNOWLEDGE BASE / CRM WORKFLOW / QA CHECKLIST; or `{label, word, icon}`), `title`, `kicker` | Paper cards fly in from below with a tilt-back, squash and skew, then land in a fan. The top card is green. A "drop zone" shows until the first card lands. Sounds: a page per card plus a soft landing. |
| `redact` | `title` (`'ONBOARDING SOP'`), `meta` (`'INTERNAL · EXAMPLE'`), `removed` (landscape result line), `lines` (text with `[[sensitive]]` spans), `at` (first redaction, default 35% into the VO), `stagger` (0.22), `label` (`'DE-IDENTIFIED'`), `stampAt` | A document types in, with sensitive spans underlined red. On the cue, each span scrambles, then a black bar wipes over it. A green stamp slams in at the end. Sounds: typing, a marker per bar, a stamp hit. |
| `flow` | `steps` (default Your docs → Scrub & anonymize → AI training environment → You get paid; or `{text, icon, word}`), `icons`, `title` | A vertical pipeline. Step cards pop in on their words with icon badges. Dashed arrows draw in and keep flowing, and green packets travel down the pipe. The last card is green. Sounds: whoosh, soft impact, rising ticks. |
| `tiers` | `tiers: [{amount, label, word}]` (bottom/smallest first; default $100K+ / $500K+ / $1M+), `title` (`'PUBLISHED PAYOUT TIERS'`), `note`, `noteAt`, `highlight` (note words; default quality/volume/uniqueness) | Cards build bottom-up with an overshoot. Each has a magnitude bar, and the top tier is green. The note appears with swipes. Sounds: whoosh plus an impact, and a hit on the top tier. |
| `window` | `fill` (0–1, or a month count above 1; default 1/12), `label` (`'$1B · 12 MONTHS'`), `start` (`'OCT'`), `year` (2026), `at`, `mark` (`'NOW'`), `sub` | A 12-month grid that pops in. Months burn green from the first one, with a yellow burning edge. A NOW tag and pulsing outline mark the current month, and a progress bar shows "N OF 12 MONTHS". Sounds: ticks, then a soft impact. |
| `industry` | `name`, `icon`, `items` (2–4; strings or `{text, word}`), `kicker` (`'INDUSTRY 01'`), `itemsLabel` (`'DATA THEY ALREADY HAVE'`), `at` | A pictogram badge with a rotating dashed ring. The name slams in, then gets the yellow swipe. Example data rows slide in. Sounds: soft impact, marker, a tick per item. |
| `quote` | `text` (verbatim, no quote marks), `by`, `highlight`, `byAt`, `kicker` | A pull-quote card with a green quote mark. Words rise in as they are read; if the VO doesn't read the quote, they spread over the first 60% of the line. Key words get swipes, then the attribution appears. Sounds: paper, markers, a tick. |
| `qa` | `q`, `a` (short headline), `sub`, `at` (answer cue, default 55% into the VO), `highlight`, `cps` | A dark question bubble shows typing dots, then types the question with a cursor. The answer slams in word by word, with swipes and an optional sub line. Sounds: typing, a hit, markers. |
| `team` | `min` (30), `max` (200), `per` (people per icon; 5 if max > 100), `cols` (default: portrait 8 or 12, landscape 10 or 20), `slots`, `label` (`'30–200 EMPLOYEES'`), `at` (fill to min), `atMax` (fill to max), `note` (default `'1 ICON = 5 PEOPLE'`) | A live counter and a grid of person icons. Icons below the minimum fill in ink, icons from min to max fill in green, and spare slots are struck out in red. The label gets a swipe. Sounds: ticks, an impact, a marker. |
| `cta` | `mode` (`'link'`, the default, or `'search'`), `text`, `pre`, `sub`, `highlight`, `disclaimer` (`'Independent channel · not affiliated with micro1 · payouts not guaranteed'`), `at`, `arrowAt`, `subAt`, `cps`. Link defaults: text `'Link in the description'`, no pre, sub `'Interest form takes ~2 minutes'`, highlight `'DESCRIPTION'`. Search defaults: text `'micro1 Company Data Partnerships'`, pre `'SEARCH'`, sub `'Apply takes ~2 minutes'`. | **link:** the headline slams in word by word, with a swipe on DESCRIPTION. A check sub line follows, and a big green arrow grows down toward the description and keeps bouncing. **search:** "SEARCH:" appears with a swipe, then a search bar types the query, then the check sub line. In both modes the disclaimer is always on. Sounds: impacts, marker, whoosh, typing, tick. |

**Icons** (`kit/icons.js`): people, person, briefcase, scales, truck, chart, code, building, headset, doc, shield, chip,
cash, search, calendar, clock, cart, cross, gear. Each one has a small idle motion.

## Transitions and sound (`cuts.mjs`)

The default transition depends on the incoming set:

| Incoming set | Transition |
|---|---|
| hook | `radial-zoom` |
| bignum, qa | `pop` (kit scale-pop) |
| checklist, flow | `scroll` (vertical slide, like a feed) |
| docstack, industry | `whip` |
| tiers | `whip-up` |
| redact, quote | `slide` |
| window, team | `push` |
| cta | `zoom-through` |

The first shot and every beat cut on the word. The same transition never runs twice in a row; a repeat rotates to the next option.

Lengths are 0.32–0.5 s. Any `engine/transitions.js` name also works through `params.trans`.

Every transition has a sound. Engine transitions get theirs through `score.transitions`, using `engine/sfx.py` TRANSITION_SFX. The kit's `pop` gets its sound as plain cues.

Each set's `plan(shot).sfx` lists its own sounds, which `setCues(timeline)` places on the timeline.

## Files

| Path | Contents |
|---|---|
| `scene.js` | Runtime: paper → set under the micro camera → transition → overlays. Exports `makeScene({ captions, progress, source })`. |
| `kit/ledger.js` | Tokens, easing, and drawing helpers: cards, swipe, strike, check, arrow, fit and wrap text, paper, fonts. |
| `kit/cue.js` | Word-cue resolution and the sfx helper. Pure, so it runs in node too. |
| `kit/overlays.js` | Captions (2–4 words per line, current word on the swipe), progress bar, source line. |
| `kit/trans.js` | The kit's `pop` transition. |
| `kit/icons.js` | Pictograms. |
| `sets/*.js` | One module per set: `{ plan(shot) -> {sfx, hits, ...}, draw(g, t, shot, P) }`. `sets/index.js` is the registry. |
| `cuts.mjs` | Cut plan, transition sounds, set sounds. |
| `episode.mjs` | `episode()` and `shot()`. |
| `bench.mjs` | Measures draw and capture time per frame. |

## Speed

Measured on 4 vCPU with 3 workers: about 14 fps. That is about 2.1 minutes of frame rendering per minute of video. The whole demo (57 s, including audio) took about 3 minutes once the VO was cached.

Per frame, the page draws in about 10–17 ms and the capture takes about 90 ms. The capture was 280–430 ms before `--disable-gpu-compositing`, which the kit turns on through `settings.browserArgs`.
