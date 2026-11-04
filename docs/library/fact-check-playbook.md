# Fact-check playbook

How we make every number, name and accusation in an episode true, sourced and safe to publish.
This file is the working procedure. The rules it builds on are in
`docs/research/script-patterns.md` §4 (status ladder, attribution, safe constructions). Read
that first. Nothing here is repeated from it except where a step needs it.

**This is not legal advice.** Any episode that accuses a named living person or a private
company of wrongdoing gets a read by someone who knows media law in the US and the UK before
it is published (our audience is in both, and UK law is harder on publishers).

Labels: **[law]** a statute or court decision; **[standard]** a newsroom's published editorial
code; **[official]** a platform's own documentation; **[house]** our own rule, with the reason given.

---

## 1. The source hierarchy

Use the highest tier that exists. A claim that rests only on tier 5 or 6 can't carry a number
on screen, a title or a thumbnail.

| Tier | Source type | Examples | Use it for | Caveat |
|---|---|---|---|---|
| **1. Primary record** | The document itself | SEC filings on [EDGAR](https://www.sec.gov/edgar/search/) (10-K, 10-Q, 8-K, S-1, DEF 14A, Form 4); court dockets on [PACER](https://pacer.uscourts.gov/) or [CourtListener/RECAP](https://www.courtlistener.com/); indictments and plea agreements on [justice.gov](https://www.justice.gov/news); company annual reports; UK [Companies House](https://find-and-update.company-information.service.gov.uk/); patents ([Google Patents](https://patents.google.com/)); government contracts ([USAspending](https://www.usaspending.gov/), [SAM.gov](https://sam.gov/)); lobbying ([OpenSecrets](https://www.opensecrets.org/), [Senate LDA](https://lda.senate.gov/)); laws and regulations | Numbers, dates, who did what, exact wording | Know which kind of document it is: a complaint is an allegation, a judgment is a finding (`script-patterns.md` §4.1) |
| **2. Official statistics** | National statistics agencies and international bodies | [FRED](https://fred.stlouisfed.org/), [BLS](https://www.bls.gov/), [BEA](https://www.bea.gov/), [Eurostat](https://ec.europa.eu/eurostat), [ONS](https://www.ons.gov.uk/), [IMF WEO](https://www.imf.org/en/Publications/WEO), [World Bank](https://data.worldbank.org/), [OECD](https://data.oecd.org/), [IEA](https://www.iea.org/), [UN Comtrade](https://comtradeplus.un.org/), [BIS](https://www.bis.org/statistics/) | Macro numbers (inflation, debt, trade, energy) | Note vintage: figures are revised. Write the release date in the source line |
| **3. On-the-record words** | The person or company speaking for itself | Earnings-call transcripts, testimony ([congress.gov](https://www.congress.gov/), [govinfo](https://www.govinfo.gov/)), press releases, the founder's book, verified posts | Quotes; what a company *says* it does | It's a claim, not a fact. Attribute it: "the company says" |
| **4. Peer-reviewed or institutional research** | Papers, think-tank reports with methods | [Google Scholar](https://scholar.google.com/), [SSRN](https://www.ssrn.com/), [NBER](https://www.nber.org/), central-bank working papers, [Epoch AI](https://epochai.org/) for compute | Estimates, mechanisms | Read the method section. Prefer the paper over the press release about the paper |
| **5. Quality journalism** | Named outlets with corrections policies | Reuters, AP, Bloomberg, FT, WSJ, NYT, The Information, ProPublica, the Guardian, The Economist | Events, scoops, context | Two independent outlets beat one; one outlet citing another is still one source |
| **6. Secondary aggregators** | Wikipedia, Statista, Our World in Data, Visual Capitalist, other YouTubers | Finding tier 1–5 | **Never the cited source.** Follow the footnote. Our World in Data is fine when we cite the dataset it names |
| **7. Unverified** | Social posts, forums, leaks without authentication, AI chatbots | Leads only | Can appear only as "a post claimed…, which has never been verified", and never as a hook payoff |

[house] **The red-line rule:** anything in red on screen (an annotation loop on a number, a
circled line in a document) must be tier 1 or 2. Red is our "this is the evidence" colour (style
bible), so it can't point at a rumour.

Newsroom basis for this order: the [SPJ Code of Ethics](https://www.spj.org/ethicscode.asp)
("Verify information before releasing it. Use original sources whenever possible") and the
[BBC Editorial Guidelines on accuracy](https://www.bbc.com/editorialguidelines/guidelines/accuracy)
(gather material using first-hand sources wherever possible; corroborate claims) [standard].

---

## 2. Verifying a number: the nine checks

Run every number that will be spoken or shown through all nine. Log the result in the source
table (§7). One failed check = the number doesn't ship as written.

1. **Trace to the origin.** Follow every citation back until you reach a tier 1–4 document. The
   classic failure: a YouTube video cites a blog that cites a 2014 Statista chart that cites a
   press release. Cite the press release, labelled as a company claim.
2. **Read the sentence around it.** Is it revenue or profit? Gross or net? Nominal or
   inflation-adjusted? Global or US? Annual or cumulative? Market cap or enterprise value?
   Valuation at a funding round (a negotiated price) or a market price?
3. **Date it.** Write the "as of" date. Market caps, user counts, prices and headcounts change
   weekly. A valuation from the peak of a funding round isn't "worth" today.
4. **Check the unit and the scale.** Millions vs billions; short vs long scale; per year vs per
   quarter; MW vs MWh; GPUs vs GPU-hours; tonnes vs tons. Recompute any derived number yourself
   and keep the arithmetic in the source table.
5. **Find a second, independent source** for any number in the title, the thumbnail, the cold
   open or a red annotation. Independent means it didn't copy the first one.
6. **Sanity-check the magnitude.** Compare to something known (GDP of a country, a company's total
   revenue, world population). If a "cost" exceeds the company's revenue, something is wrong.
7. **Adjust money across time.** Old dollars get converted with the
   [BLS CPI calculator](https://www.bls.gov/data/inflation_calculator.htm) or FRED CPIAUCSL, and
   the VO says so ("about four billion in today's money"). State the base year in the caption.
8. **Check rounding for speech.** The VO rounds ("about forty-two billion"); the caption is exact
   ("$41.97B · 10-K FY2025"). Never round across a threshold that changes the meaning (49.6% is
   not "half").
9. **Look for the correction.** Search "[number] correction", "[outlet] corrected", the
   company's later filings, and the Wayback Machine ([web.archive.org](https://web.archive.org/))
   for the page as first published. Restated financials replace the original.

### Common traps by topic

| Topic | Trap | Fix |
|---|---|---|
| AI and compute | "Cost to train" figures are mostly estimates, often of compute rental at list price | Say "estimated", name the estimator (e.g. Epoch AI), give the method in the source line |
| AI and compute | "Number of GPUs" in a cluster is usually a company claim | "The company says…" |
| Startups | Valuations are post-money prices for preferred shares, not a market value | "valued at … in its last funding round" |
| Fraud stories | Amounts "lost" vs amounts "stolen" vs amounts "at risk" | Use the figure in the indictment, judgment or bankruptcy filing, and name which |
| Crypto | Token "market cap" uses illiquid supply at the last price | Avoid; use amounts actually withdrawn or frozen |
| Geopolitics | Military and casualty numbers are contested and politically sourced | Give the range and both sources; "Ukraine says… Russia says… neither can be independently verified" |
| Macro | Debt figures mix gross and net; GDP mixes nominal and PPP | Name the measure in the caption |
| Population and users | "Users" = monthly actives? registered accounts? | Use the company's own defined metric and name it |
| Surveys | A percentage of a non-representative sample | Name the pollster, sample and date, or drop it |
| History | Popular anecdotes that are folklore | Find a contemporary source; otherwise "the story goes…" |

---

## 3. Verifying people, quotes, images and events

- **Quotes.** Find the original recording, transcript or document. Quote it exactly; trim only at
  sentence boundaries and never across a "but". Use [Quote Investigator](https://quoteinvestigator.com/)
  for famous lines (many are misattributed). On screen, give speaker, venue and date.
- **Images and footage.** Reverse-search every archive image (Google Lens, TinEye, Yandex) to
  confirm it shows what we say, when and where. Record its licence (`assets/CREDITS.md`). A
  "representative" image must be labelled as such ("Illustration" or "A similar facility").
- **Our own 3D reconstructions** are illustrations, not evidence. Label reconstructed scenes
  "Reconstruction" in the corner caption when they show a real event, and build them only from
  documented facts (positions, times and quantities from a record). That is Fern's practice in its
  mapped reconstructions [observed], and it's what keeps a reconstruction from being fabrication.
- **Satellite and map imagery.** Name the provider and date (Sentinel-2, NAIP, Landsat). Never
  imply a live view.
- **Events and timelines.** Build the timeline from dated primary records, then check every
  "then" in the script against it. TTS scripts love "then"; most errors hide there.
- **Names.** Confirm spelling, title at the time of the event (not today's title) and pronunciation
  (respell in VO only; `script-patterns.md` §3.2 rule 9).

---

## 4. Attribution phrase bank

Pick by the type of evidence. Rotate them; the same phrase five times sounds like hedging.
These extend `script-patterns.md` §4.3.

**Documents (strongest)**
- "It's in the filing."
- "Page forty-one of the annual report says it plainly."
- "The indictment lays it out."
- "Court records show…"
- "The contract, published by [agency], lists…"
- "In a letter to shareholders, the company wrote…"
- "Its own S-1 warns investors that…"
- "The patent, filed in twenty nineteen, describes…"
- "According to the settlement, which admits no wrongdoing,…"
- "The transcript of the call reads…"

**People on record**
- "[Name] said it on an earnings call."
- "In his own words:"
- "She told Congress, under oath, that…"
- "He later wrote, in his memoir, that…"
- "Asked about it in twenty twenty-two, [name] said…"
- "The company's position is simple:"

**Press**
- "[Outlet] reported that…"
- "According to reporting by [outlet],…"
- "[Outlet] obtained the memo."
- "Two people familiar with the deal told [outlet]…"
- "[Outlet] was first to report it."

**Estimates**
- "One widely cited estimate puts it at…"
- "[Institution] estimates…"
- "By [source]'s count,…"
- "Nobody publishes the exact figure. The best estimate is…"
- "Estimates range from [low] to [high]."

**Disputed and unknown**
- "[A] says X. [B] says that's wrong."
- "The company disputes that figure."
- "That has never been independently confirmed."
- "There is no public record of…"
- "Nobody outside the company knows."
- "We asked. They didn't answer." (only if we asked; keep the email)

**Our own analysis (label it)**
- "Here's our math."
- "We added up every contract we could find."
- "By our count, using [source],…"
- "That's our reading. Here's why."

---

## 5. Defamation-safe patterns

### 5.1 The legal landscape in one table [law]

| Jurisdiction | Test | What it means for us |
|---|---|---|
| US, public figures | *New York Times Co. v. Sullivan*, 376 U.S. 254 (1964): the plaintiff must show "actual malice" (knowing falsity or reckless disregard) | Strong protection, but "reckless disregard" includes ignoring obvious red flags in a source. Keep the source table as proof of diligence |
| US, private figures | *Gertz v. Robert Welch*, 418 U.S. 323 (1974): states may set a lower standard (usually negligence) | Much more care with private individuals; avoid naming them unless essential and documented |
| US, opinion | *Milkovich v. Lorain Journal*, 497 U.S. 1 (1990): no blanket opinion privilege; an opinion that implies false facts is actionable | "In my opinion, he's a fraud" is not safe. Opinion must rest on disclosed, true facts |
| UK | [Defamation Act 2013](https://www.legislation.gov.uk/ukpga/2013/26/contents): s.1 serious harm; s.2 truth; s.3 honest opinion (must indicate the basis); s.4 publication on a matter of public interest (reasonable belief) | The burden of proving truth is on the publisher. Our source table is the defence file |
| EU and elsewhere | Varies; criminal defamation exists in some member states | Treat UK-level care as the default |

Plus the republication rule: repeating someone else's defamatory claim can make us liable too
(`script-patterns.md` §4.1).

### 5.2 Twelve patterns that keep a hard story safe [house, built on the law above]

1. **Describe the act, cite the record, skip the label.** "Prosecutors say he moved customer
   deposits into his trading firm." Not "he stole".
2. **Status first, every time.** Charged ≠ convicted ≠ liable ≠ admitted (`script-patterns.md` §4.2).
3. **Response in the same chapter.** If X is accused, X's denial or response appears in the same
   chapter as the accusation, not 10 minutes later.
4. **Opinion with its basis.** "Given those three filings, we think the business depends on one
   customer." The facts come first and are true; the opinion is labelled.
5. **Questions aren't loopholes.** "Was it fraud?" in a title implies an answer. Use questions
   only when the video honestly answers "we don't know" or "no".
6. **No composite villains.** Don't merge two people's actions into one character for drama.
7. **Reconstruction labels.** Dramatised scenes are labelled and built from documented facts only.
8. **Private people stay small.** Employees, victims and minors: first names or none, no faces,
   no addresses. Fern blurs and uses handles for its hacker subjects [observed].
9. **Time-stamp living stories.** "As of October 2026, the case continues." Ongoing trials get
   "is accused of", never "did".
10. **Thumbnails and titles carry liability.** "The Company That Sees Everything" (opinion,
    supported) is fine. "[Name]'s Fraud" needs a conviction or admission.
11. **Imagery can defame.** A red marker loop on a person's face, a skull on a logo, or a
    prison-bar overlay implies guilt. Annotate documents and objects, not faces.
12. **Satire is not a defence we use.** Our format is factual; a joke that states a false fact
    is still a false fact.

### 5.3 Before / after: risky line → safe line

| Risky | Safe |
|---|---|
| "He lied to investors." | "The S.E.C. alleged that he misled investors. He settled without admitting or denying it." |
| "The company knew the product was dangerous." | "Internal emails, released in the lawsuit, show engineers raised the risk in twenty eighteen." |
| "A scam that stole billions." | "A collapse that left customers short about eight billion dollars, according to the bankruptcy filing." |
| "He bribed officials." | "He was charged with bribery. He has pleaded not guilty." |
| "The most corrupt company in America." | "No company in our data paid more in fines. Here's the list." |
| "They're spying on you." | "Its contracts include surveillance work for [agency]. Here's what those contracts say." |
| "She wanted to get rich at any cost." | "In her own words, in a twenty fourteen interview: '…'" |
| "Everyone knew." | "At least three executives were told, according to the report." |

---

## 6. The correction workflow

Corrections protect trust and, under UK s.4 and US "reckless disregard" tests, show good faith.
Newsroom model: the [Reuters Handbook](https://www.reuters.com/info-pages/handbook-of-journalism/)
and [BBC guidelines](https://www.bbc.com/editorialguidelines/guidelines/accuracy) both require
prompt, clear acknowledgement of significant errors [standard].

### Before publishing
1. **Fact-check pass**: each line of `SCRIPT.md` is matched to a row in `SOURCES.md` (§7).
2. **Red-team pass**: a second reader (a person or a separate agent session with no context)
   tries to break the five biggest claims: the title, thumbnail, cold open, first re-engagement
   (~3:00) and the payoff.
3. **Right-of-reply pass**: for any accusation against a named party, send a written request
   for comment with a deadline (48–72 h, longer if practical) and log it. Fold the response into
   the script or say they didn't respond.
4. **Legal read** for any episode with named wrongdoing.

### After publishing: triage within 24 h of a credible report

| Severity | Example | Action |
|---|---|---|
| **S1: defamatory or seriously misleading** | Wrong person named; an allegation stated as fact; a wrong conviction | Make the video private at once. Fix with the YouTube Studio editor (trim, blur, or audio replace) if possible; otherwise re-render and re-upload. Pinned correction comment and description note. Log it |
| **S2: material factual error** | A headline number wrong by more than 10% or a wrong date that changes the story | Pinned comment plus a description correction on the same day ("Correction: at 4:12 we said X. It's Y. Source: …"). Studio-editor trim if the line can be cut cleanly |
| **S3: minor error** | A misspelled name in a caption, a rounding slip | Description correction note |
| **Not an error** | Disagreement with our opinion | Reply with the source; no correction |

YouTube Studio's editor can trim, blur and replace audio on a published video without
changing its URL, and the video keeps its views, though edits on videos over 100,000 views can
be limited ([YouTube Help: Edit videos](https://support.google.com/youtube/answer/9057455)) [official].
A re-uploaded video starts from zero views, so it is only for S1.

### Logging
Every correction gets a line in `docs/library/corrections-log.md` (create it on first use):
`date | video | timestamp | error | correct fact | source | action | root cause`. Review the
root causes each quarter and add the failure mode to §2's traps table.

---

## 7. The source table: template

Each project has `projects/<name>/SOURCES.md`. One row per claim, written while researching,
not after the script. The caption string goes straight into the on-screen source line.

```markdown
| ID | Script line (timestamp) | Claim as spoken | Status (ladder) | Source (tier) | URL / doc + page | Accessed | Second source | Our math | Caption on screen | Response sought? | Check |
|----|----|----|----|----|----|----|----|----|----|----|----|
| S01 | 0:14 | "about forty-two billion dollars" | fact | Company 10-K FY2025 (1) | https://www.sec.gov/... p.41 | 2026-10-12 | Reuters 2026-02-01 (5) | — | $41.97B · 10-K FY2025 | n/a | ✅ |
| S02 | 3:05 | "charged with wire fraud" | charged | DOJ press release (1) | https://www.justice.gov/... | 2026-10-12 | Indictment, PACER 1:23-cr-... | — | DOJ · 2023 | Lawyer contacted 2026-10-10, no reply | ✅ |
| S03 | 6:40 | "roughly one in five" | estimate | Pew survey (4) | https://... | 2026-10-12 | — | 19.6% → "one in five" | 19.6% · Pew 2025 | n/a | ⚠ single source |
```

Columns:
- **Status** uses the ladder in `script-patterns.md` §4.2.
- **Tier** uses §1 above. A tier 6–7 source can't fill this column alone.
- **Our math** shows any calculation (inflation, per-person, ratio) so anyone can redo it.
- **Check**: ✅ verified by two sources or a primary record; ⚠ single source, which can't appear
  in the title, thumbnail, cold open or red; ❌ failed, so cut it.

### The pre-publish gate (copy into the outline)

- [ ] Every spoken number has a row and a caption.
- [ ] No ⚠ row is used in the title, thumbnail, cold open or a red annotation.
- [ ] Every accusation has a status, matching phrasing and a response line.
- [ ] Every reconstruction is labelled.
- [ ] Every archive image has a provenance check and a licence row in `assets/CREDITS.md`.
- [ ] The description carries the source list (Kurzgesagt publishes a source document for every
      video [primary, `channel-breakdowns.md` §3]; Fern links a Google Doc of sources in its
      descriptions [observed in the description of "The Kids Who Hacked The CIA"]).
- [ ] The red-team pass found nothing above S3.

---

## 8. Research workflow that makes the fact-check cheap

1. **Research pack first** (`RESEARCH.md`): open questions, then the answers, each with a source
   row. The script is written from the pack, never from memory.
2. **Primary documents on screen.** A filing or court record shown on screen is both proof and
   our cheapest wow factor (Bloomberg's "access" in document form, `channel-breakdowns.md` §17).
3. **Archive everything.** Save a Wayback snapshot (`https://web.archive.org/save/<url>`) of every
   web source on the day we cite it, and put the snapshot URL in the table. Pages vanish.
4. **AI tools are tier 7.** Use them to find leads and summarise long filings, then verify every
   extracted number on the page it came from.
5. **Budget it.** Plan about 20% of research time for verification. It's the work that
   separates us from the cloned-look channels Fern warned about (`channel-breakdowns.md` §2).
