# Anti-AI look: what makes a video read as machine-made or cheap, and how to avoid it

We are an automated channel: code renders the pictures, Kokoro reads the script, an agent writes
the first draft. That is legal and monetisable, but **looking automated** costs us twice. Viewers
leave (and say "AI slop" in the comments), and YouTube's monetisation rules target content that
looks templated or mass-produced. This file lists the tells, how human editors avoid them, what
YouTube's policies say in 2025–2026, and a **pass/fail checklist** a vision-capable reviewer
applies to the contact sheets from `studio/critic/video_qa.py` and to stills.

Read with `docs/style-bible.md` (the taste; its "Never" list is the root of this file),
`docs/masters/rules.md` (100 frame rules), `docs/research/editing-library.md` (cut rate, variety
budget, on-screen text), `docs/audio/voice.md` (the Kokoro pipeline),
`docs/library/narration-style.md` (banned clichés) and `docs/library/sound-and-music.md`.

Researched 2026-11-04. Labels: **[official]** YouTube's own pages; **[press]** reporting on them;
**[science]** a study; **[observed]** our autopsies or renders; **[house]** our rule.

---

## 1. YouTube's rules (2025–2026) and what they mean for us

### 1.1 Monetisation: "inauthentic content" [official]

On **15 July 2025** YouTube renamed its "repetitious content" policy to "inauthentic content",
calling it a "minor update" ([YPP policies](https://support.google.com/youtube/answer/1311392?hl=en)).
On 2026-11-04 that page has four sections that matter to us:

- **Generic or repetitive content.** It covers content that "looks like it's made with a template"
  and, explicitly, "AI-generated content made with generic or unoriginal templates giving the
  impression of mass production", plus "image slideshows, templated storylines, or scrolling text
  with minimal or no narrative, commentary, or educational value". Allowed: the same intro and
  outro if "the bulk of your content is different", and a series where each video has a distinct
  storyline. The standard is that each video is "materially varied".
- **Unsatisfying or off-putting content.** Not allowed: "content that lacks a clear narrative arc
  or logical progression", channels relying on "generic templates or emotionally manipulative
  themes", and "deceptive or misleading imagery or narratives". Allowed, by name: "using AI to
  visualize a unique character and narrative you invented" and creative tools that help deliver
  "a unique, well-researched, or creative narrative".
- **AI personas related to sensitive topics.** Not allowed: AI "doctors", "AI-generated podcast
  hosts offering financial guidance, investment tips, or wealth management advice", and AI personas
  giving legal advice.
- **Reused content**: other people's material without "substantive modifications", or readings of
  material we didn't create.

TechCrunch reports that YouTube clarified these rules on **16 July 2026**, grouping them as
repetitive/template content, distressing or manipulative content, and AI personas on sensitive
topics; YouTube's trust and safety lead described the first as videos that are "very generic and
don't really have a narrative arc" ([TechCrunch](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/))
[press]. The Help page above carries those sections but still shows the July 2025 notice as its
latest dated update.

Enforcement is **channel-level**: YouTube reviews the channel, and channels with too much of this
content lose YPP ([TechCrunch](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/)) [press].

### 1.2 Disclosure of altered or synthetic content [official]

From [YouTube Help: disclosing altered or synthetic content](https://support.google.com/youtube/answer/14328491?hl=en):

- **Disclose** (Studio's "AI use" setting) when **realistic** content was made or altered with AI
  and could be mistaken for real: a real person saying or doing something they didn't, altered
  footage of a real event or place, a realistic scene that didn't happen, or AI music as the main
  focus.
- **No disclosure needed** for clearly unrealistic or animated content, colour and lighting
  filters, vintage effects, upscaling and repair, and AI help with scripts, outlines, titles,
  thumbnails or captions.
- Labels: in the player for photorealistic content and AI music; in the expanded description for
  other AI audio and non-photorealistic content. YouTube may **add labels automatically** for
  content with **C2PA metadata** or that its systems detect as AI. Those labels can't be removed
  when they come from C2PA or manual review.
- Repeated failure to disclose can lead to removal or YPP suspension. Disclosure by itself
  doesn't limit reach or monetisation.

Neal Mohan's 2026 letter names reducing "low quality AI content" ("AI slop") as a priority,
"building on our established systems" against spam and repetitive content
([YouTube blog](https://blog.youtube/inside-youtube/the-future-of-youtube-2026/)) [official].
YouTube has since removed some large AI channels ([Tubefilter](https://tubefilter.com/2026/01/29/youtube-ai-slop-channel-crackdown-bans/))
[press]. A Kapwing test found that 104 of the first 500 Shorts shown to a fresh account (21%)
were AI slop ([BetaNews](https://betanews.com/article/study-finds-ai-slop-videos-spreading-fast-across-youtube-and-theres-a-lot-of-money-being-made)) [press]:
the audience has learned to spot it. Fern's own copycat video (10.9M views in six weeks) is
about AI channels cloning its look (`video-autopsies/fern.md`) [observed].

### 1.3 What this means for an automated channel [house]

1. **Every video is a different story, built from new material.** Our engine and look may repeat;
   the narrative, research, primary records and sets must not. Never ship two episodes with the
   same spine *and* the same set list. Rotate spines (`script-patterns.md` chooser) and keep a
   log in the topic bank.
2. **A narrative arc is now a monetisation requirement, not just a retention tool.** The
   `emotional-engine.md` checklist is also our policy check: a video that fails it is the
   "lacks a clear narrative arc" content YouTube demonetises.
3. **No AI host persona giving money advice.** Our narrator explains and reports; it never
   advises viewers on investments. No named synthetic "host" character with a face. The affiliate
   read describes the product; it doesn't tell viewers what to do with their money.
4. **Don't fake the real.** We don't generate photoreal footage of real events, places or people.
   A 3D **reconstruction** of a real event carries an on-screen `RECONSTRUCTION` tag (Plex Mono
   caps, corner). If we ever use generative imagery or video of something realistic, tick "AI use"
   in Studio. Our 3D renders, data graphics and depth-parallax on real archive photos are, in our
   reading, CG and "minor" edits, not GenAI; that is our inference, not YouTube's wording.
5. **Check assets for C2PA/SynthID provenance** before using any third-party image: it can
   trigger an automatic, non-removable label (`exiftool -a -G1 file | grep -i c2pa`).
6. **Thumbnails** may use AI help without disclosure, but must show something that is actually in
   the video (memo rule; `rules.md` #98).
7. **The TTS voice** is a synthetic voice that impersonates nobody. The disclosure page doesn't
   list that as requiring a label. Never clone a real person's voice.

---

## 2. The tells, layer by layer

Each row: the tell, why it reads as machine-made or cheap, and what we do instead. Most "AI look"
is not one artefact but **sameness**: everything evenly lit, evenly paced, evenly smooth.

### 2.1 Voice and narration

Listeners are poor at spotting modern synthetic speech from the sound alone; casual listeners are
near chance, and they lean on outdated cues like robotic prosody and odd breathing
([arXiv 2605.28064](https://arxiv.org/html/2605.28064)) [science]. Reduced pitch variation lowers
perceived naturalness ([Bakkouche et al., Interspeech 2025](https://www.isca-archive.org/interspeech_2025/bakkouche25_interspeech.html))
[science]. So the danger is less "sounds like a robot" than **sounds like a template**:

| Tell | Fix (most already in `voice.py` / `docs/audio/voice.md`) |
|---|---|
| Every sentence ends on the same falling "announcer" cadence | Vary sentence length and type (questions, fragments, a colon reveal); `script-patterns.md` §3 |
| Even pace, even pauses: no rubato | Per-line dynamic speed (reveals ×0.90), punctuation pauses of different lengths, a 3–5 s ma per chapter with no VO (`rules.md` #32) |
| Emphasis on the wrong word, flat key words | `*word*` vowel lengthening; rewrite so the stressed word ends the sentence |
| Mispronounced names, acronyms, numbers | `narration-style.md` §4 number table; a pronunciation check pass on every proper noun; listen to every line with a number |
| Dry, airless voice sitting on top of the music | The doc voice chain (room 6% wet, presence EQ) plus ducking; ambience under the VO, never digital silence |
| "AI-ese" wording: "delve", "tapestry", "in today's fast-paced world", "it's important to note", "let's dive in", "a testament to" | `narration-style.md` §2 banned list; add these to it if missing. Write concrete nouns and active verbs |
| Hedge-everything or hype-everything tone | Say what's known and how we know it (`script-patterns.md` §4 status ladder) |
| Vocoder hiss or metallic resonance on long vowels | Keep `af_heart`/`am_michael`; avoid `bm_fable` (measured hiss) |

### 2.2 Imagery, faces and hands

Kamali et al. sort the artefacts people use to spot AI images into five groups: **anatomical**,
**stylistic** ("too perfect"), **functional** (objects that couldn't work), **violations of physics**
(shadows, reflections, perspective) and **sociocultural** (wrong norms, wrong context), and warn
that not every AI image shows them ([arXiv 2406.08651](https://arxiv.org/pdf/2406.08651)) [science].
Our CG can show the same tells even without any generative model:

| Tell | What it looks like | Fix |
|---|---|---|
| Uncanny faces and hands | waxy skin, dead eyes, merged or extra fingers, teeth as one strip | style bible: **no realistic CG humans**. Silhouettes, backs, hands in shadow, crowds at < 3% of frame (`rules.md` #6, #45) |
| "Too perfect" surfaces | spotless cars, plastic sheen, uniform roughness, no dirt | PBR textures with wear, roughness variation, decals, grime in crevices (`REALISM-BRIEF.md`) |
| Physics violations | shadows in two directions, a lit object with no visible source, reflections that don't match | **one motivated key light** (`rules.md` #2); real shadow maps; check every reflective surface |
| Functional nonsense | a ladder to nowhere, a door with no handle, cables that end in air, a ship with no wake | a "would this work?" pass on every hero object |
| Perfect symmetry and centring | every frame centred, every object mirrored | symmetry only for institutions, then break it (`rules.md` #76); rule-of-thirds and foreground layers otherwise |
| No imperfection | no grain, no lens character, no haze, every edge razor-sharp | the film finish (grain, halation, vignette) **always on**; atmosphere for depth (`rules.md` #46); slight focus falloff |
| Everything glows | bloom on every highlight, neon rim light, purple-teal sky | bloom 0.16 night / 0.09 day max; bright-mode "never" list; one accent colour |
| The AI-art palette | orange-teal push, saturated purple dusk, HDR halo edges | `LK` looks with gamut ceiling 0.9; skin line; sea never cyan-green |
| Dreamy "AI concept art" composition | a lone figure facing a glowing giant structure, god rays, mist, every time | allowed once per episode at most, and only when the story needs scale; never as the thumbnail cliché |

### 2.3 Stock, generic B-roll and graphics clichés

| Tell | Fix |
|---|---|
| Generic stock: handshake, server corridor with blue light, hooded hacker, globe of network lines, stock-market tickers, the Earth spinning | Show the **specific** thing: the actual building (NAIP aerial), the document, the real ship class. If we can't show the specific thing, use an annotated map or data, not a generic stand-in |
| The same B-roll in several videos | render.mjs repeated-visual guard within a video; across videos, never reuse a hero shot; log hero shots per episode |
| Gradient text, neon glow on type, chrome 3D titles, lens-flare logo stings | style bible "Never"; type is Instrument Serif / Plex Mono / Archivo Narrow, flat |
| Template lower thirds, centred captions, "subscribe" animations | corners and edges like a magazine; no animated subscribe prompts |
| Icon packs and emoji-style vector illustrations | our own shape language (`rules.md` #89); real objects in 3D; documents |
| Slideshow of stills with Ken Burns on every one | the depth-parallax photo card (`animation-libraries.md` #7) for archive photos, mixed with 3D, maps and data; never more than 3 stills in a row |

### 2.4 Motion and editing

| Tell | Why it reads as automated | Fix |
|---|---|---|
| Floaty, constant-speed camera drift in every shot | Nothing is motivated; everything moves at the same speed | every move has a motivation and eases in and out (`rules.md` #4, #25); some shots are **locked off**; speed follows tension (hold for suspense, cut fast for release, #14) |
| Over-smooth, weightless motion | No inertia, no anticipation, no settle | anticipation and follow-through (#63–65); handheld from low-frequency spectra (#84); real operator constraints (gimbal/drone inertia) |
| Identical transitions | the same cross-dissolve or zoom every cut | most cuts are **hard cuts on a sound** (#11); transitions are rare and motivated (#40–42); never the same transition twice in a row; `editing-library.md` §2 variety budget |
| Equal shot lengths | a machine-like 4 s, 4 s, 4 s rhythm | vary shot length (#13, `pick.mjs --check`) |
| Picture illustrates every noun literally | VO "money" → coins, "time" → a clock | show the consequence or the evidence, not the word; picture may counterpoint the VO |
| Everything moves all the time | constant motion means nothing stands out | stillness, then a burst (#30); one moving element per frame when the frame carries information |
| Whoosh on every cut | stock SFX pack feel | motivated sound (lamps clunk, water laps), and silence before the hit (#31) |

### 2.5 Text on screen and signage

| Tell | Fix |
|---|---|
| Garbled or pseudo-text on signs, screens, documents (the classic generative tell) | all diegetic text is real text we typeset (troika or canvas textures); zoom any frame with text to 100% before shipping |
| Wrong-language or wrong-script signage (Latin signs in a Tehran street; Chinese characters that mean nothing; English on a Norwegian shopfront) | signage in the place's language and script, checked by a translation of every visible string; when unsure, keep signage out of focus or out of frame |
| Typos, wrong units, wrong number formats | captions pulled from the same data as the source line (`M.data.*`); a spell/unit pass |
| Captions repeating the VO word for word | style bible "Never"; on-screen text adds what the voice can't (the exact number, the date, the source) |
| Fake UI (a "hacker terminal" of nonsense code, a dashboard of random numbers) | show real interfaces as diagrams, or real public documents; every number on screen is real and sourced |
| Wrong period details (a 2020 phone in a 1990 scene, modern cars in 1967) | a period-check pass on props and vehicles per sequence |

### 2.6 Music and sound

| Tell | Fix |
|---|---|
| Generic AI or library music: a cinematic build with the same piano ostinato and swell, no development | our procedural drone and cue grammar (`sound-and-music.md` §2); real recordings when the story needs music (§4–5 there) |
| AI-generated music as the focus | requires disclosure (§1.2) and risks Content ID; we don't use it |
| Wall-to-wall music | music drops out before reveals (`rules.md` #70); 2–4 s of room tone at the tensest moment (#68) |
| No ambience: digital silence between lines | room tone and location ambience under everything |
| The same riser/hit pack every video | synthesise in `score.py` / `sfx.py`; layer real foley (Kenney, BigSoundBank) |

### 2.7 Packaging

| Tell | Fix |
|---|---|
| AI-render thumbnail: glossy, centred, glowing, a shocked synthetic face | the thumbnail is a frame (or a graded variant) from a real shot in the video (`rules.md` #98); one hero, one red element (autopsy pattern 6) |
| Titles in AI cadence ("The Untold Truth About…", "…Will Shock You") | `packaging` skill title shapes from the 475-title set; specific numbers and names |
| Description boilerplate | a written summary, real chapter names, the source list |

---

## 3. How human editors avoid the look (what to copy)

1. **Specificity over coverage.** Real channels show *the* thing, not *a* thing: Johnny Harris's
   service manual, Fern's court documents, Veritasium measuring his own blood
   (`video-autopsies/README.md` pattern 12). Primary material is the moat.
2. **Imperfection on purpose.** Grain, halation, paper texture, graphics on twos (Vox's 12 fps,
   `rules.md` #59), drawn-on marker loops with rough edges (style bible). A hand-made texture is
   the opposite of "AI smooth".
3. **Restraint.** Few transitions, long holds on what matters, silence before impact. Editors cut
   10% more than feels comfortable (`retention-playbook.md` §4).
4. **Motivation for every change.** A cut lands on a sound or a word; a move follows a subject;
   type arrives on the word (`rules.md` #11, #37, #60).
5. **A point of view.** The narration takes positions supported by evidence, admits what nobody
   knows (LEMMiNO), and has dry humour. Templates have no opinions.
6. **Variety across episodes.** A recognisable look (our sets, fonts, red annotation) with a
   different story, structure and visual centrepiece each time. That is exactly YouTube's line
   between a series and a template (§1.1).

---

## 4. Reviewer checklist (contact sheets and stills)

**Inputs.** `python3 studio/critic/video_qa.py <video.mp4>` writes contact sheets (a 5 × 4 grid,
one frame every 6 s by default) and measured checks (black frames, frozen stretches, cut rate,
loudness). Also pull **full-resolution stills** of every hero shot, every frame with text, and the
thumbnail. `studio/program.md` requires **0 fails** to ship.

**How to judge.** Look at each sheet at a glance first (does it look like one designed film or a
stock reel?), then frame by frame. Each item is **PASS** or **FAIL** by the definition given; when
unsure, mark FAIL and give the timestamp. A FAIL cites the sheet and cell (e.g. `sheet 3 r2c4,
~2:42`).

### 4.1 Contact sheet checks (whole video)

| ID | Check | FAIL if |
|---|---|---|
| CS1 | **Variety of picture modes** | Any row of 5 consecutive cells (≈ 30 s) shows the same mode (all 3D sets, or all maps, or all stills); or one mode is > 50% of all cells |
| CS2 | **No repeated shot** | Two cells anywhere show the same framing of the same subject without a story reason (a deliberate callback is listed in the shot plan) |
| CS3 | **One look per sequence** | Adjacent cells inside one chapter switch look (night ↔ bright-day) with no chapter card or story turn between them (`rules.md` #8) |
| CS4 | **Composition not monotone** | More than 60% of cells have the subject dead centre, or more than 60% are symmetrical |
| CS5 | **Shot scale varies** | Any 5 consecutive cells are all wides or all close-ups |
| CS6 | **Accent discipline** | Any cell shows more than one accent colour, or red used for something other than annotation |
| CS7 | **No glow/gradient clichés** | Any cell shows gradient or glowing type, neon rim light on objects, purple-teal sky, or lens-flare titles |
| CS8 | **No generic stock subjects** | Any cell shows a stock cliché (§2.3: handshake, hooded hacker, blue server corridor, network globe, random ticker) that isn't the specific thing the VO is about |
| CS9 | **Humans handled** | Any cell shows a realistic CG face at > 3% of frame height, or hands with visible anatomy errors |
| CS10 | **Finish present** | Any cell (outside deliberate graphics cards) looks clinically clean: no grain, no atmosphere, pure-black or pure-white flat areas with no texture |
| CS11 | **Primary material on screen** | No cell in the whole video shows a primary record (document, filing, real photo, real data with source line) |
| CS12 | **Text placement** | Any caption is centred in the lower third, or text sits naked on a bright picture with no plate (`rules.md` #17–18) |
| CS13 | **Dead stretches** | `video_qa` reports a frozen stretch or a "longest stretch without visual change" > 8 s that isn't a planned ma or hold |

### 4.2 Still checks (full resolution: hero shots, text frames, thumbnail)

| ID | Check | FAIL if |
|---|---|---|
| ST1 | **Readable, real text** | Any visible text is garbled, misspelled, pseudo-script, or not in the location's language/script; any number lacks a source line |
| ST2 | **Light logic** | Shadows point in more than one direction from a single sun; a bright object has no visible or implied source; reflections contradict the scene |
| ST3 | **Functional objects** | Any hero object couldn't work (doors without hinges, vehicles without wheels touching ground, cables ending in air, ships without wakes when moving) |
| ST4 | **Surface realism** | A hero object has uniform, spotless, plastic-looking material with no wear or roughness variation |
| ST5 | **Scale reference** | An establishing shot claims size ("vast", "the largest") but has no known object for scale |
| ST6 | **Period and place** | Props, vehicles, signage or architecture contradict the stated year or country |
| ST7 | **Edges and artefacts** | Visible aliasing shimmer, z-fighting, texture stretching on depth-parallax edges, banding in skies, or halo edges around cut-outs |
| ST8 | **Value structure** | In greyscale, the subject is not the brightest or darkest area (`rules.md` #7) |
| ST9 | **Thumbnail is honest** | The thumbnail shows something not in the video, a synthetic face, or more than one red element |

### 4.3 Motion checks (watch at 1×, then scrub)

These need the video, not a sheet. Note timestamps.

| ID | Check | FAIL if |
|---|---|---|
| MO1 | **Motivated moves** | More than 3 shots in a row have a slow drift with no subject motion, reveal or story reason |
| MO2 | **Transition variety** | The same non-cut transition is used twice in a row, or non-cut transitions are > 25% of all cuts |
| MO3 | **Cut on sound** | A cut or a graphic change happens with no sound or word under it (outside deliberate silence) |
| MO4 | **No pops** | Frame-diff spikes inside a shot (`framediff.py`), or a velocity pop at a match cut |
| MO5 | **Rhythm** | Five or more consecutive shots of equal length (± 10%) |

### 4.4 Listening checks (one full listen, headphones)

| ID | Check | FAIL if |
|---|---|---|
| AU1 | **Pronunciation** | Any name, place, acronym or number is mispronounced |
| AU2 | **Cadence** | Five or more consecutive sentences end with the same cadence and similar length (the "announcer loop") |
| AU3 | **AI-ese** | Any banned phrase from `narration-style.md` §2 or §2.1 above is in the VO |
| AU4 | **Air** | Digital silence between lines (no room tone or ambience), or music under every second of the video |
| AU5 | **Sound clichés** | The same whoosh or riser more than 3 times, or a stock "cinematic trailer" hit on a non-peak beat |
| AU6 | **Loudness** | `video_qa` loudness outside −14 ±1 LUFS or true peak above −1 dBTP |

### 4.5 Channel-level policy check (before each upload)

| ID | Check | FAIL if |
|---|---|---|
| PO1 | **Narrative arc** | The script fails `emotional-engine.md` §8 gates |
| PO2 | **Materially varied** | This video shares its spine **and** ≥ 50% of its set list or hero shots with any of the last 5 uploads |
| PO3 | **No AI advice persona** | The narrator gives personal investment, legal or medical advice, or a synthetic host character with a face appears |
| PO4 | **Disclosure** | Realistic generated imagery or audio of real people, places or events is used and "AI use" is not set; or a reconstruction lacks the `RECONSTRUCTION` tag |
| PO5 | **Provenance** | Any third-party asset carries C2PA/AI provenance metadata we haven't accounted for |

### 4.6 Report format

```
anti-ai-look: 2 FAIL, 1 note
FAIL CS8 sheet 2 r3c1 ~1:54  stock "hooded hacker" for the Lazarus group; show the FBI wanted poster instead
FAIL ST1 still 07:12        shop sign reads in English on a Dhaka street; replace with Bengali or defocus
note MO1 03:40–04:10        three slow drifts in a row; lock off the middle one
```

---

## 5. Sources (accessed 2026-11-04)

Official: [YouTube channel monetisation policies](https://support.google.com/youtube/answer/1311392?hl=en);
[disclosing altered or synthetic content](https://support.google.com/youtube/answer/14328491?hl=en);
[Neal Mohan, "The future of YouTube" 2026 letter](https://blog.youtube/inside-youtube/the-future-of-youtube-2026/).
Press: [TechCrunch on the July 2026 clarification](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/);
[Tubefilter on channel removals](https://tubefilter.com/2026/01/29/youtube-ai-slop-channel-crackdown-bans/);
[BetaNews on the Kapwing study](https://betanews.com/article/study-finds-ai-slop-videos-spreading-fast-across-youtube-and-theres-a-lot-of-money-being-made);
coverage of the July 2025 rename ([Social Media Today](https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/)).
Science: Kamali et al. 2024, [arXiv 2406.08651](https://arxiv.org/pdf/2406.08651);
[Bakkouche et al., Interspeech 2025](https://www.isca-archive.org/interspeech_2025/bakkouche25_interspeech.html);
[arXiv 2605.28064](https://arxiv.org/html/2605.28064) on listener detection of synthetic speech.
House: `docs/style-bible.md`, `docs/masters/rules.md`, `docs/audio/voice.md`,
`docs/library/video-autopsies/fern.md`.
