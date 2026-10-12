# Sound and music: cue grammar and legal sources

How an episode's score and sound design are planned, written as cues our engine already
understands, and where to get music legally when the procedural score isn't enough.

Engine references (read the code, not memory):
- `engine/score.py`: the bed and cue mixer. Config keys: `key` (drone root), `sections`
  (`[{shot, key}]`, key change per section with 3 s crossfades), `drone` (bed gain, default 0.16),
  `silenceDrone` (shot ids where the drone ducks to 15%), `transitions` (`[{shot, name, dur}]`,
  auto sound for each planned transition), and `cues` (`[{type, shot, at, gain, pan, …}]`).
  Cue `type`s: `boom`, `clang`, `clunk`, `whoosh` (with `dur`), `swell` (with `dur`), `horn`, `hum`,
  `water`, `ticks`, `pulse` (with `bpm`), and `sfx` (any `engine/sfx.py` preset by `name`).
  `whoosh` and `swell` cues are placed so they *end* at `at`.
- `engine/sfx.py`: 33 presets, each with an **anchor** (the hit or peak), placed so the anchor lands
  on `at`. Names: `whoosh.xs|s|m|l|xl`, `riser`, `sub.drop`, `impact.soft|hit|boom`, `tape.stop`,
  `swell.reverse`, `ui.tick`, `ui.ticks`, `ui.scan`, `type.click`, `type.run`, `paper.rustle`,
  `paper.page`, `paper.tear`, `shutter`, `glitch.zap`, `heartbeat`, `clock.tick`, `stinger`,
  `room.tone`, `city.amb`, `wind.amb`, `film.flutter`, `film.burn`, `glass.shatter`, `marker.swipe`.
  `TRANSITION_SFX` maps each of the 36 transitions to its sound.
- `engine/render.mjs` ducks the bed under the VO with a sidechain compressor.
- `docs/research/editing-library.md` §4 ("Sound carries the cut") has the principles; this file is
  the grammar and the cue recipes.

Labels: **[observed]** from our transcript and heatmap pull of 70 videos (`video-autopsies/`);
**[practitioner]**, **[official]**, **[law]** as elsewhere; **[house]** our rule with its reason.

---

## 1. Principles

1. **The VO is the melody.** Everything else is accompaniment. The bed sits 18–24 dB under the VO
   (the sidechain handles the moment-to-moment ducking) [house].
2. **Silence is the loudest cue.** The strongest moments in the reference channels are drops to
   near-silence before a reveal: Veritasium drops music at reveals, Moon holds dread with almost
   nothing under the voice (`channel-breakdowns.md` §14–15) [observed]. A drop only works if the
   bed was there before it, so keep the bed continuous elsewhere.
3. **Every picture change of kind has a sound change of kind** (`editing-library.md` §2). Re-hook
   interrupts are half sound.
4. **Sound leads picture.** Ambience for the next scene starts 0.3–1.0 s before the cut (J-cut);
   hits land on the cut frame (`shot-design` §7).
5. **One signature per episode.** A recurring motif (a specific stinger key, a clock tick, a
   heartbeat) tied to the episode's hero object becomes the callback device in sound [house,
   after Kurzgesagt's bespoke per-video scores, `channel-breakdowns.md` §3].
6. **Restraint scales.** Fern, LEMMiNO and Moon use ambient beds and sparse design
   (`channel-breakdowns.md`) [observed]; MrBeast's loud-hit style is the one MrBeast himself
   walked back in 2024. Our default is sparse: about one designed sound event every 6–10 s outside
   the cold open, more in reveals [house].

---

## 2. The cue grammar

Each row is a musical or sound *event* with when to use it and the exact cue to write.
`S` = the shot id; times are seconds into that shot.

### 2.1 Bed states (the drone)

| State | When | How (score.py) |
|---|---|---|
| **Bed on** | Default under narration | `drone: 0.14–0.18` |
| **Drop out** | Title card; chapter cards; the beat before a reveal number; the final button | `silenceDrone: ['title', 'ch2card', …]`. Put the reveal line in its own shot so the drop is exactly that shot |
| **Key change** | Each new chapter (a new "place", `editing-library.md` §3); a twist | `sections: [{shot: 'ch2a', key: 'F'}, …]` |
| **Tension bed** | Build sections; countdowns; the "investigation closes in" stretch | Add `{type: 'pulse', shot: S, at: 0, dur: 20, bpm: 60–72, gain: 0.25}` under the drone |
| **Machine bed** | Data centres, servers, factories, surveillance rooms | `{type: 'hum', shot: S, at: -0.5, dur: N, gain: 0.3}` plus `sfx room.tone` |
| **World bed** | Exteriors: city, wind, water | `sfx city.amb` / `wind.amb` at `at: -0.8` (J-cut); `water` cue for harbours |

**Key plan for a 16-min episode** [house]. The drone is minor-flavoured partials; moving the root
gives each chapter its colour without melody.

| Section | Key | Feel |
|---|---|---|
| Cold open | D | Home; neutral dread |
| Ch.1 (setup) | D | Stay home so the first change means something |
| Ch.2 (escalation) | F | Up a minor third: lift, tension |
| Ch.3 (mechanism, the lull) | C | Down: grounded, steady, lower energy |
| Ch.4 (the twist) | Eb or C# | A semitone off home: unease |
| Ch.5 (payoff) | D | Return home: resolution by key |
| Button | D, drone out on last line | Silence |

Rules: change key only at a chapter card (it's under a drop, so the change is masked and the
new chapter "arrives" in a new colour); never more than one change per chapter; return to the
home key for the payoff.

### 2.2 Events

| Event | Use it for | Cue | Notes |
|---|---|---|---|
| **Stinger** | Chapter card; title card; the big reveal at ~3:00 and ~6:00 | `{type:'sfx', name:'stinger', shot:S, at:0, gain:0.6}` | Pair with a drone drop. Keep the same stinger (same `seed`) all episode: it's the signature |
| **Riser → hit** | Into a reveal; into a whip or a big cut | `{type:'sfx', name:'riser', shot:S, at:0}` (anchor = the top) then `impact.hit` at 0 on the next shot | Use ≤1 per chapter; risers are the most overused sound on YouTube [house] |
| **Reverse swell** | Into a dissolve, a quote card, a flashback | `{type:'swell', shot:S, at:0, dur:2.5}` or `sfx swell.reverse` | Soft; no transient |
| **Sub drop** | Dip-to-black; a number that lands heavy | `sfx sub.drop` | Felt more than heard: check on headphones |
| **Impact soft** | Every hard cut on a new fact (auto via `transitions`) | `transitions: [{shot:S, name:'cut'}]` | Low gain (0.3–0.4). Don't stack more than 2 per 10 s |
| **Impact boom** | Once per episode: the twist | `sfx impact.boom` or `{type:'boom'}` | Pair with flash frame or dip-red |
| **Tape stop** | A reversal: "It didn't last." | `sfx tape.stop` with anchor on the last word | ≤1 per episode; reads as comic if overused |
| **Clock ticks** | Countdown structure; deadlines; "eleven minutes" | `sfx clock.tick` (`params: {beats, period}`) or `{type:'ticks'}` | Stop the ticks on the reveal word; the stop is the hit |
| **Heartbeat** | Personal danger; a person alone; the arrest | `sfx heartbeat` (`bpm` 58–70) | Under a static hold; ≤1 per episode |
| **Typing / UI** | Hacking, data, documents being found, counters | `type.run`, `ui.ticks`, `ui.scan`, `ui.tick` per label | Ticks on each label draw-on; keep below VO |
| **Paper** | Documents, filings, photos on a desk | `paper.page`, `paper.rustle`, `paper.tear` | Johnny Harris and Vox use paper and projector sounds on stills (`channel-breakdowns.md` §5–6) |
| **Marker swipe** | The red annotation loop or leader line drawing on | `sfx marker.swipe` anchored on the stroke | Exactly once per red annotation |
| **Shutter** | Archive photo cut-ins; flash frames | `sfx shutter` | The deadpan-flash thumbnail look in sound |
| **Glitch** | Screen-push-into-world; digital failure; hacked systems | `sfx glitch.zap` | ≤2 per episode outside a hacking story |
| **Film flutter / burn** | Archive footage; memory sections; step-print | `film.flutter`, `film.burn` | Pair with the film-burn transition |
| **Glass shatter** | One literal break: a bubble bursting, a window, a collapse | `sfx glass.shatter` | Once, ever, per episode |
| **Whoosh** | Whips, pushes, map flights, oners | auto via `transitions`; manual `whoosh.xs–xl` sized by `sfx.whoosh_for(dur)` | Match the size to the move length |
| **Clang / clunk** | A light switching on in a dark set (our "light is the event" rule) | `{type:'clunk'}` on the frame the key light snaps on | The style bible's light-switch beat; strongest under a drone drop |
| **Horn** | Ships, ports, trains: one per sequence | `{type:'horn'}` | Diegetic; establishes place |

### 2.3 Where the cues go in the beat sheet

| Beat (retention-script frame) | Sound plan |
|---|---|
| 0:00–0:05 image | World or machine bed already running from frame 0 (no fade-in from silence); one diegetic detail |
| 0:15–0:22 turn | One event: impact soft, shutter, or a light-on clunk |
| 0:22–0:30 loop | Bed thins (drone gain −30% via a short `silenceDrone` shot or just a held line) |
| ~1:00 title | **Drop out**, stinger on the title frame |
| Every re-hook (30–40 s) | A sound change of kind, rotating: drop, event, bed change, ambience change, diegetic sound (never the same kind twice in a row; `editing-library.md` §2) |
| ~3:00 and ~6:00 re-engagements | The two biggest events after the title: riser → hit, or drop → stinger. Our heatmap pull shows the most-replayed peaks cluster on demonstrations, maps and documents being revealed, i.e. moments with a strong sound event (`video-autopsies/README.md`) [observed] |
| Affiliate read | Bed changes key or switches to a lighter tension-free bed; one sfx in, one out; no stingers inside |
| Chapter cards | Drop out + stinger + key change |
| Ch.3 lull | Machine/world bed + UI ticks on labels; pulse under the drone for momentum |
| Ch.4 twist | Impact boom (once) or tape stop, then a semitone key change |
| Payoff | Return to home key; the episode signature (stinger seed or motif) as a callback |
| Button | Drone out on the last line; 1.0–1.5 s of room tone; black |

---

## 3. A worked cue block

For a 4-shot sequence: a cold-open reveal of a data centre at night, the title, then Ch.1.

```js
score: {
  key: 'D', drone: 0.16,
  sections: [{ shot: 'ch2a', key: 'F' }, { shot: 'ch3a', key: 'C' }, { shot: 'ch4a', key: 'Eb' }, { shot: 'ch5a', key: 'D' }],
  silenceDrone: ['title', 'ch1card', 'ch2card', 'reveal_number', 'button'],
  transitions: [
    { shot: 'dc_wide', name: 'cut' },
    { shot: 'dc_door', name: 'push', dur: 0.5 },
    { shot: 'title', name: 'dip-black', dur: 0.6 },
  ],
  cues: [
    { type: 'hum', shot: 'cold1', at: 0, dur: 14, gain: 0.25 },                       // machine bed from frame 0
    { type: 'sfx', name: 'wind.amb', shot: 'cold1', at: -0.6, gain: 0.35 },          // J-cut exterior
    { type: 'clunk', shot: 'dc_door', at: 1.2, gain: 0.5 },                          // the floodlight snaps on: light is the event
    { type: 'sfx', name: 'marker.swipe', shot: 'dc_door', at: 2.4, gain: 0.4 },      // red loop on the substation
    { type: 'sfx', name: 'riser', shot: 'reveal_number', at: 0, gain: 0.45 },        // top lands on the number shot
    { type: 'sfx', name: 'stinger', shot: 'title', at: 0, gain: 0.6, seed: 7 },      // the episode signature (seed 7 everywhere)
    { type: 'sfx', name: 'city.amb', shot: 'ch1a', at: -0.8, gain: 0.3 },            // J-cut into Ch.1
  ],
},
```

Check after rendering: listen on headphones and on a phone speaker. The sub drop and hum vanish on
phones, so no story beat may depend on them [house].

---

## 4. When to use real music instead of the drone

The procedural bed has no melody, and that is a choice: it never fights the VO, it's free, it's
deterministic, and it carries no copyright risk. Add real music only when:

- an emotional payoff needs harmony the drone can't give (the final 60–90 s);
- a montage (a time-lapse of growth, a stair-step sequence) needs rhythm;
- period colour helps (a 1920s recording under a 1920s archive photo).

Then follow §5 and log the track in `assets/CREDITS.md`.

---

## 5. Free and legal music sources

**Order of preference** [house]: (1) our own procedural score; (2) public-domain recordings we
can prove are public domain; (3) CC0 tracks; (4) the YouTube Audio Library; (5) CC BY with
attribution. Never use NC (non-commercial) or ND licences: our videos are monetised, and the ND
condition bars the edits we make (`docs/LIBRARY-BRIEF.md` licence rule).

### 5.1 Public-domain recordings: what's actually free

A recording has two copyrights: the **composition** and the **sound recording**. Beethoven's
composition is public domain; a 2015 orchestra's recording of it is not.

- **US sound recordings** [law]: the Music Modernization Act (CLASSICS Act, 17 U.S.C. §1401)
  put all recordings published **before 1923** into the US public domain on **1 January 2022**.
  Recordings from **1923–1946** get 100 years from publication (so 1925 recordings became free
  on 1 January 2026, and 1926 recordings on 1 January 2027); 1947–1956 get 110 years; later ones
  stay protected until 2067 ([Public Domain Review](https://publicdomainreview.org/blog/2021/12/all-sound-recordings-prior-to-1923-will-enter-the-us-public-domain-in-2022),
  [Wikipedia: CLASSICS Act](https://en.wikipedia.org/wiki/CLASSICS_Act)).
  **Rule for us**: a US recording first published in 1925 or earlier is safe in the US as of
  today (2026-10-12). Other countries differ (the EU term for recordings is 70 years from
  publication), so check the recording's country.
- **Sources of old recordings**: Internet Archive's 78rpm collections
  ([archive.org/details/78rpm](https://archive.org/details/78rpm)), Library of Congress
  [National Jukebox](https://www.loc.gov/collections/national-jukebox/) (streaming; check each
  item's rights statement), Wikimedia Commons audio (each file has a licence tag). Verify the
  original *publication* date of the recording, not the upload date.
- **Musopen**: a non-profit that commissioned recordings of classical repertoire and released
  them to the public domain or CC0 ([OKFN](https://blog.okfn.org/2008/12/08/musopen-free-public-domain-music/)).
  The site's current terms couldn't be fetched from this box (HTTP 403), so check each recording's
  licence on its page before use and record it.

### 5.2 CC0 and permissive sources

| Source | Licence | Attribution | Notes |
|---|---|---|---|
| [Freesound](https://freesound.org/) | Per sound: filter by **CC0** | None for CC0 | Ambiences and foley; reject CC BY-NC |
| [Free Music Archive](https://freemusicarchive.org/) | Per track (each artist chooses) | Depends | Filter for CC0 or CC BY; many tracks are NC, reject those |
| [Musopen](https://musopen.org/) | PD / CC0 recordings (verify per track) | None for PD/CC0 | Classical; good for period and payoff beats |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Audio_files) | Per file | Per tag | Historic recordings, speeches |
| [Pixabay Music](https://pixabay.com/music/) | Pixabay Content License (not CC0) | Not required | Free to use and modify; can't be redistributed standalone; trademarks excluded ([licence summary](https://pixabay.com/service/license-summary/)). Some tracks are registered in Content ID by their artists, so expect claims and keep the licence page as proof [house] |
| [Incompetech](https://incompetech.com/) (Kevin MacLeod) | CC BY 4.0 (or a paid licence) | Required: "Title" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License, plus the licence URL | The page says the free option "Requires that you credit the music" ([licence page](https://incompetech.com/music/royalty-free/licenses/)). The most recognised library music on YouTube, so it reads as generic: use sparingly |

### 5.3 The YouTube Audio Library [official]

From [YouTube Help](https://support.google.com/youtube/answer/3376882):
- It lives in YouTube Studio. Tracks under the standard Audio Library licence need no attribution;
  Creative Commons tracks need the artist credited in the description (Studio generates the text).
- Videos in the Partner Program **can be monetised** with Audio Library music.
- Library tracks **aren't claimed through Content ID**; YouTube says only library tracks are known to
  it to be copyright-safe, and it takes no responsibility for "royalty-free" music from elsewhere.
- The help page doesn't address use **outside YouTube** (Shorts on other platforms, Nebula,
  client work). Treat library music as YouTube-only unless the track's own licence says otherwise.

### 5.4 Content ID reality check

Public-domain classical music is regularly mis-claimed, because Content ID matches a label's
recording of the same composition (reported cases with Sony Music and Hyperion recordings;
[Reclaim The Net](https://reclaimthenet.org/youtube-takes-down-public-domain-copyright-grounds),
[Hypebot](https://www.hypebot.com/glimpse-of-the-future-the-challenge-of-posting-classical-music-online-without-a-copyright-violation/))
[press]. So:

1. Keep a `assets/CREDITS.md` row for every track: source URL, licence, recording date, and a saved
   copy (PDF or Wayback snapshot) of the licence page.
2. Upload as **unlisted** first and wait for Content ID checks to finish in Studio before going
   public.
3. Dispute false claims with the licence proof; a valid dispute names the specific recording.
4. If a track is risky and replaceable, replace it. The procedural score is always the fallback.

### 5.5 Never

- Commercial tracks, "no copyright intended" uploads, or anything ripped from YouTube.
- "Royalty-free" sites that need a subscription we don't hold.
- AI-generated music from services whose terms forbid commercial use or claim ownership; read the
  terms before using any generator.
- NC or ND licences.
