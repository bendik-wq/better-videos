# Retention playbook

How to keep people watching a 15–20 min faceless documentary. This file covers packaging,
script structure, pacing, chapters, mid-rolls and the affiliate read. The look lives in
`docs/style-bible.md` and the reference channel in `docs/fern-breakdown.md`; this file doesn't
repeat them.

Researched October 2026. Every claim links to its source. How much to trust each source:

- **[official]**: YouTube Help or FTC. Treat as fact.
- **[memo]**: the leaked MrBeast onboarding document. It's widely reproduced, but
  **its authenticity has never been confirmed** ([creatorhandbook](https://www.creatorhandbook.net/leaked-document-allegedly-reveals-mrbeasts-secrets-to-youtube-success-the-key-takeaways/)).
  It was also written for challenge videos, not documentaries.
- **[practitioner]**: something a named strategist said in an interview (Paddy Galloway, Colin & Samir).
- **[vendor]**: a tool company's blog (vidIQ, Spotter, thumbnailtest). Useful, but the samples
  are small and self-interested.
- **[house]**: our own synthesis or observation, with no external source. Test these before
  relying on them.

---

## 1. The metrics that decide distribution

| Metric | What it is | Rule |
|---|---|---|
| CTR | clicks ÷ impressions | Packaging drives it. Memo example: 100M impressions → 10M clicks = 10% [memo] |
| AVD | average view duration | Judge content by this. Memo: two similar-length videos at 120M and 45M views differed by about **1:38 of AVD** [memo] |
| AVP | average % viewed | Length is a creative choice; don't pad to hit a runtime [memo] |
| Intro | % still watching at **0:30** | YouTube says a high intro means the opening matched the title and thumbnail [official] |
| Typical retention | this video against your **10 latest videos of similar length** | Use it as the per-video benchmark [official] |
| Watch-time share | how Test & Compare picks a winner | YouTube optimises for watch time, not CTR. Clickbait that loses viewers loses the test [official] |

- Retention-graph vocabulary [official]: a **dip** means viewers skipped or left. A **spike**
  means they rewatched or shared, which can also signal a confusing passage. A **top moment**
  is where almost nobody left. Data takes 1–2 days to appear.
  ([YouTube Help: key moments](https://support.google.com/youtube/answer/9314415?hl=en))
- Intro benchmark: aim for **≥60% still watching at 0:30**; the best hooks hold above 65%. This
  is a vendor target, not a YouTube number. Videos above 50% at 0:30 can show in Studio's
  "above typical intros" list.
  ([vidIQ](https://vidiq.com/blog/post/increase-audience-retention-youtube/), [Creator Essentials](https://www.creatoressentials.com/glossary/intro-retention/)) [vendor]
- Diagnosis: a cliff in the first 30 s is a hook or packaging mismatch. A slow slide through
  the middle is a pacing problem.
  ([OutlierKit](https://outlierkit.com/resources/youtube-hooks-and-retention/)) [vendor]

## 2. The MrBeast production memo, distilled [memo]

Sources: the full text is mirrored at [alexanderjarvis.com](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/),
with summaries from [OMR (German)](https://omr.com/de/daily/mrbeast-doc-pdf-leak),
[Zack Chewning](https://zackchewning.substack.com/p/content-lessons-from-the-1-youtubers),
[Neal Ungerleider](https://nealungerleider.substack.com/p/mrbeasts-media-business-secrets) and
[creatorhandbook](https://www.creatorhandbook.net/leaked-document-allegedly-reveals-mrbeasts-secrets-to-youtube-success-the-key-takeaways/).

1. **Make the best *YouTube* video, not the best-produced one.** The memo argues most TV would
   flop on YouTube. For us, the film finish serves retention and never replaces it.
2. **Packaging comes first and binds the content.** Extreme and specific beats mild:
   "Bananas Are The Worst Food On Earth" beats "I Don't Like Bananas", "I Survived" beats
   "I Spent", and "50 Hours In Ketchup" beats "50 Hours In My Front Yard". Every producer must
   know the title and thumbnail. If the video doesn't deliver what the thumbnail shows (a
   yellow castle that turns out red, a "world's largest" that is normal-sized), viewers feel
   cheated and leave.
3. **The first minute is where most viewers are lost.** In the memo's example, a video lost
   **about 21M of 60M viewers in minute one**. The fixes it lists: match the thumbnail, plan
   the opening script, and front-load the most interesting material.
4. **Minutes 1–3 move from hype to execution.** Stop describing and start showing. A
   **re-engagement beat around 3:00** is something remarkable enough that viewers think
   "only they could do this".
5. **Minutes 3–6 are the second most important stretch.** Put the most exciting, simplest
   material here with quick scene changes. The claim: viewers who make it through the first
   half very likely finish. **Another re-engagement around 6:00.**
6. **After minute 6, viewers settle into a "lull".** Slower explanation can go here, but weak
   back halves have still killed videos. Don't signal the ending early. Keep the payoff for
   last and end abruptly once it lands; long outros leak AVD.
7. **Stair-stepping:** stakes climb in steps, like a $1 firework, then $10K, $40K, $100K, then
   the world record. Formats with the answer at the end ("last to leave", chases) hold viewers.
8. **Wow factor** is something no one else can do, placed early. Example: a house craned in
   about 30 s into "100 Days in a Circle". It earns retention and makes the brand distinct.
9. **Integrated brand deals dip far less than scripted reads.** A scripted read shows a
   "crater" in the retention graph. Make the integration entertaining in its own right.
10. **Everyone should know which minute they're working on.** Retention is managed minute by
    minute. The memo's average length was about 13:37 across 100 videos.

**Translating to documentary [house]:** "wow factor" means one visual or fact the viewer can't
get anywhere else: a tracked 3D reconstruction, a primary document, a number nobody has
computed. "Stair-stepping" means escalating stakes: $1M, then $1B, then a government; one
company, then an industry, then a country.

## 3. The opening (0:00–1:00)

- **Confirm the packaging promise inside 30 s.** YouTube reads a strong intro as the
  first 30 s matching the title and thumbnail. [official]
  ([YouTube Help](https://support.google.com/youtube/answer/9314415?hl=en))
- **No preamble.** No logo sting, "welcome back" or channel intro before the hook. Keep any
  intro under 10–15 s.
  ([vidIQ](https://vidiq.com/blog/post/increase-audience-retention-youtube/)) [vendor]
- **Hook formula** (from Kallaway, for short-form; it adapts well):
  1. *Context lean*: state the topic clearly so the right viewer self-selects.
  2. *Interjection*: "But…", which halts the momentum.
  3. *Contrarian snapback*: the surprising turn that opens the main question.
  ([summary](https://opentools.ai/youtube-summary/how-to-create-irresistible-hooks-and-blow-up-your-content)) [practitioner, secondhand]
- **Write 3–4 intro versions, record them, listen back and keep the best**, before
  production. ([Paddy Galloway on Creator Science](https://podcast.creatorscience.com/paddy-galloway/)) [practitioner]
- **Cold open on the most compelling concrete moment**, then the title card. A common
  pattern is a counter-intuitive claim in the first 15–30 s.
  ([OutlierKit](https://outlierkit.com/resources/youtube-hooks-and-retention/)) [vendor]
- Within 60 s, name the **payoff** the viewer will get by staying. Tease a moment from the back
  half that you will actually deliver ("front-loading", [OMR](https://omr.com/de/daily/mrbeast-doc-pdf-leak)). [memo]

## 4. Holding the middle

- **Causality, not lists.** Join beats with "but" or "therefore", never "and then". This is
  Parker & Stone's rule from their NYU talk, reported secondhand.
  ([Matt Rickard](https://mattrickard.com/but-therefore), [Perell](https://perell.com/note/but-therefore-rule/))
- **Open loops:** raising a question the viewer must wait for creates tension. Close every
  loop you open. An unclosed loop reads as a broken promise.
  ([transcript](https://gotranscript.com/public/mastering-youtube-scripts-secrets-to-crafting-viral-content)) [unattributed]
- **Cut hard.** "If you're not taking out 10%, you're not trying very hard."
  ([same transcript](https://gotranscript.com/public/mastering-youtube-scripts-secrets-to-crafting-viral-content)) [unattributed]
- **Vary the emotional register.** Peak up and down rather than flatlining.
  ([summify](https://summify.io/discover/killer-youtube-scripts-explained-xdR1YXg_JXI/)) [unattributed]
- **Re-hook cadence.** The memo has big re-engagements at about 3 and 6 minutes. For 15–20 min
  narration, we add a **small re-hook every ~90 s**: a new question, a reveal, a stakes jump,
  a gear change in picture or sound. The 90 s figure is [house]; the principle is [memo].
- **Pattern interrupts must be motivated** (style bible: cuts land on sound, flash frames only
  on a tonal shift). Random zooms and whooshes break the house style.
- **Read the graph after every upload.** Find the "danger zones" where viewers leave
  repeatedly, and design the next script around them.
  ([Galloway](https://podcast.creatorscience.com/paddy-galloway/)) [practitioner]

## 5. Structure for a 15–20 min documentary [house]

No primary source documents how Fern, Lemmino, MagnatesMedia, Wendover, PolyMatter, Johnny
Harris or Hoog write their scripts; searches found none. Only Kurzgesagt publishes its process:
read books and papers, check with experts, publish a source sheet, and expect about a dozen
script drafts. It estimates roughly 1,200 hours per video.
([kurzgesagt.org](https://kurzgesagt.org/youtube/)) [official-ish]
Johnny Harris's stated ethos is "curiosity over clicks" with a visual-first approach
([Adobe MAX](https://www.adobe.com/max/2025/sessions/scrappy-smart-and-human-the-future-of-storytelling-os558.html)).

What these channels have in common, **from watching them, not from any source**:

- A cold open on a single concrete scene or object before the title card (Fern, Lemmino).
- One central question stated early and answered last.
- 4–7 chapters marked by title cards.
- One narrator voice as the spine; no on-camera host (Fern, Hoog, Lemmino).
- A sponsor read after the opening act, roughly 2–5 min in (Wendover, PolyMatter, Johnny Harris).
- Escalating scale chapter by chapter.

Template we use, at roughly **150 spoken words per minute** (measure against our Piper voice):

| Time | Beat | Job |
|---|---|---|
| 0:00–0:30 | Cold open | Concrete scene plus the hook. Confirm the thumbnail promise |
| 0:30–1:00 | Stakes and question | Why it matters and what the viewer gets by staying. Open loop **L1** (the main question) |
| 1:00–1:10 | Title card | The drone drops out and the title hits |
| 1:10–3:30 | Ch.1: setup | Fast. Show, don't describe. First re-engagement near 3:00 |
| ~3:30–4:45 | Affiliate segment (option A) | Placed after the first payoff (§7) |
| 4:45–8:00 | Ch.2: escalation | The best material. Re-engagement near 6:00. Stair-step the stakes |
| 8:00–11:30 | Ch.3: mechanism | The "how it actually works" explainer. This is the lull, so keep it visual |
| 11:30–15:00 | Ch.4: twist | The but-turn. Reframe L1 |
| 15:00–17:30 | Ch.5: payoff | Close L1 and every other open loop |
| 17:30–18:00 | Button | One-line implication. End abruptly, no recap |

## 6. Chapters and mid-roll ads

- **Chapter rules [official]:** at least **3 timestamps**, the first at **00:00**, each
  chapter **≥10 s**, in ascending order. Manual chapters override automatic ones.
  ([YouTube Help: chapters](https://support.google.com/youtube/answer/9884579))
- Write chapter names as curiosity, not labels: "The $40B mistake", not "Background". [house]
- **Mid-rolls [official]:** only on monetised videos **≥8:00**. You place slots manually,
  automatically, or both, and YouTube decides which slots serve. Slots at **natural breaks**
  (an audio pause or visual transition) serve more often. Slots placed mid-sentence or
  mid-action rarely serve.
  ([YouTube Help: mid-rolls](https://support.google.com/youtube/answer/6175006?hl=en-GB))
- Using manual and automatic slots together averaged **more than 5% more ad revenue** than
  manual alone. In 2025 YouTube began shifting mid-rolls toward natural breaks.
  ([TechCrunch](https://techcrunch.com/2025/02/25/youtube-is-working-to-make-ad-slots-less-interruptive)) [official, via press]
- House rules [house]:
  - Put manual slots on chapter-card silences; the title card's drone drop-out is a perfect slot.
  - No ad slot before about 3:00.
  - Never put an ad slot within 60 s of the affiliate segment.
  - About one slot every 3–4 min. Claims of "every 2 min" spacing or "+30–40% RPM" are
    third-party and unverified.

## 7. The affiliate segment: converts without killing retention

**Retention [memo + vendor]:**

- Integrated reads dip much less than scripted reads, which leave a visible "crater"
  ([memo](https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/)).
- Keep the picture moving during the read, and make the product relevant to the video's
  subject ([Spotter](https://spottercommunity.beehiiv.com/p/how-to-retain-viewers-during-sponsored-videos)).
- Typical length is **45–60 s**. **Unverified:** this came from a search summary, and the
  page it came from wasn't confirmed.
- Placement advice conflicts. A brand-side booking spec, seen only in a search summary and
  probably [superfiliate](https://www.superfiliate.com/field-guide/video/what-to-book-on-youtube-by-kendall-dickieson),
  asks for the first 25–30% of the video, and creators push later. Finance brands prefer
  mid-roll ([Creators Agency](https://creatorsagency.co/blog/youtube-creator-audience-retention-finance-sponsors)).
  Decide from your own retention at the read.
- Watch for a "step change" down in retention at the read. That means fix the placement or
  the fit.

**House format for a B2B offer [house]:**

1. **Bridge:** one line that grows out of the problem the chapter just raised. Not "this video
   is sponsored by".
2. **Disclose** in the same breath (see below).
3. **Show the mechanism:** what the offer does for the kind of company we just discussed,
   with one concrete number. Use our own 3D or diagram language, not the vendor's ad creative.
4. **One call to action:** a single link and a single reason to click now.
5. **Return line:** reopen the story's open loop ("So how did they get the money back?").

Two placements:

- **Option A** (default): right after the first payoff, around 20–25% of runtime.
- **Option B:** a short 10–15 s callback inside the payoff chapter where the offer genuinely
  fits.

Never put the full read in the first 60 s.

**Disclosure. Required, not optional:**

- **FTC [official]:** a commission, free product or payment is a *material connection*. The
  disclosure must be **in the video, not just the description**, and preferably **spoken and
  on screen**. Put it **with the endorsement**, not at the end of the video and not behind
  "show more". "Sponsored", "ad" and plain sentences work; "sp", "spon", "collab" and a bare
  "thanks" do not. Don't claim to have used a product you haven't.
  ([FTC Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers))
- **Affiliate links [official, via law-firm summaries of the 2023 Endorsement Guides]:**
  disclose in the video *and* in the description next to the link. "Affiliate link" alone and
  "commissionable link" are **not** adequate; "paid link" placed next to the link is. Our
  line: "I earn a commission if you sign up through this link."
  ([Manatt](https://manatt.com/insights/newsletters/advertising-law/an-in-depth-look-at-the-ftcs-updates-2), [track360 summary](https://track360.io/blog/ftc-affiliate-disclosure-rules-operator-compliance-guide-2026))
- **YouTube [official]:** tick **"includes paid promotion"** whenever a third party pays or
  compensates you, which covers affiliate commissions. It shows a viewer label, may swap out
  conflicting ads, and removes the video from YouTube Kids. **The box does not replace the
  verbal disclosure.**
  ([YouTube Help](https://support.google.com/youtube/answer/154235))

## 8. Packaging: title and thumbnail

- **Package before you produce.** If you can't title and thumbnail an idea clearly, "it's not
  an idea". Top creators spend about 30% of their time on ideation and packaging; most small
  creators spend about 5%.
  ([Creator Science](https://podcast.creatorscience.com/paddy-galloway/), [Colin & Samir](https://www.colinandsamir.com/resources/the-new-rules-of-youtube-from-paddy-galloway)) [practitioner]
- **Volume, then cut.** One video had 45–46 title variants, narrowed to 4–5. For thumbnails,
  sketch about 10 and keep 3 **"adequately different"** concepts; a colour swap doesn't count.
  ([Creator Science](https://podcast.creatorscience.com/paddy-galloway/)) [practitioner]
  A vendor rule of thumb: if you can't get 3–5 good thumbnail concepts and 25–50 titles, the
  idea isn't ready.
  ([Peerlist](https://peerlist.io/thiswillblossom/articles/why-no-one-is-watching-your-youtube-videos-and-how-to-fix-it)) [vendor]
- **Titles:** short, usually **under about 50 characters and at most 60**, in plain words.
  [practitioner]
- **Thumbnail:** about **80–90% the psychology of the click and 10–20% design**. It must pass
  the **glance test** (read in 1–2 s). Text is optional: **2–4 words, never more than 5–6**.
  Use danger, action or an unusual object. [practitioner]
- **"Familiar but unexpected":** a known format with one twist. Borrow formats from other
  niches: "$1 vs $100", "10 min vs 24 h", matchups, superlatives, three-tier comparisons.
  Johnny Harris's "$25K vs $25M" is an example.
  ([Colin & Samir](https://www.colinandsamir.com/resources/the-new-rules-of-youtube-from-paddy-galloway)) [practitioner]
- **Broaden past the core.** Andrew Millison's permaculture video passed 15M views after its
  packaging was widened beyond the niche. Aim for about 80% audience overlap and about 20%
  experiments. Check appeal to **core, casual and new** viewers. [practitioner]
- **"Legitbait", not "click traps".** Packaging should be enticing and accurate. Misleading
  packaging gets backlash (Veritasium, "Clickbait is Unreasonably Effective", 2021). Test &
  Compare's watch-time metric also penalises it.
  ([summary](https://briefy.ai/summary/v2/curfkxexuv57xsqmhbo9twba/en/clickbait-is-unreasonably-effective)) [practitioner, secondhand]
- **Curiosity gaps wear out.** The question has to be genuinely interesting, not just vague.
  ([Descript](https://www.descript.com/blog/article/the-youtubers-guide-to-the-curiosity-gap-how-to-keep-your-audiences-interest)) [vendor]
- **Old videos can be repackaged.** A thumbnail tweak that lifted CTR by about 30–40% led to
  about 40× more views per day on an old video. [practitioner]
- **Predict performance before upload** so one miss doesn't cause panic. [practitioner]

## 9. A/B testing with Test & Compare [official]

- Test up to **3 thumbnails, 3 titles, or combinations** on one video. Runs on desktop Studio,
  on new or existing videos. Title testing rolled out in 2025, and sources disagree on the
  exact date it reached everyone.
  ([YouTube Help](https://support.google.com/youtube/answer/13861714), [SEJ](https://www.searchenginejournal.com/youtube-title-a-b-testing-rolls-out-globally-to-creators/562571/), [thumbnailtest](https://thumbnailtest.com/news/youtube-releases-title-test-compare/))
- The winner is decided by **watch-time share**, not CTR. Results are "Winner", "Preferred"
  or "None"; on "None" the first variant becomes the default. A test takes from a few hours to
  **2 weeks**.
- **Editing the title or thumbnail mid-test stops the test.** It isn't available for
  made-for-kids, mature-audience or live content.
- House rules: variants must differ in *concept*, not colour. Upload the variant you'd ship
  anyway as #1. Log every result in `docs/research/packaging-log.md` (to be created) so it
  becomes channel data. [house]

## 10. Gaps and unverified claims

- The MrBeast memo's authenticity is unconfirmed, and its numbers are for challenge videos.
- No public process sources were found for Fern, Lemmino, MagnatesMedia, Wendover, PolyMatter,
  Hoog or Johnny Harris; §5 is observation. To close the gap, time cold opens, chapter cards and
  sponsor reads in about 10 of their videos (see `docs/fern-breakdown.md` on getting footage).
- There is no public data on sponsor-segment skip rates. SponsorBlock skips integrations by
  default for its users (about 2M+ on Chrome, per a vendor), which is another reason to keep
  value inside the read.
  ([makeinfluence](https://www.makeinfluence.com/en/academy/sponsorblock-and-sponsor-skip-extensions-do-they-undercut-a-paid-youtube-placement))
- The 90 s re-hook cadence, ad-slot spacing and 150 wpm budget are house heuristics. Verify
  them against our own retention graphs after 3–5 uploads.
- This isn't legal advice. Check the disclosure rules for each market (EU and UK rules differ).
