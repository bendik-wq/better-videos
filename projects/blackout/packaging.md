# Episode 4: packaging

## Promise (one sentence)
A mouse cursor moved by itself and switched off a country's power. Here is who did it, how, and the evidence they're already inside other grids.

## Titles (A/B/C, test in YouTube "Test & Compare")
- **A (lead): The Hackers Who Can Turn Off the Lights**
- B: The Mouse Moved By Itself. Then the Lights Went Out.
- C: Someone Else Is Already Inside the Power Grid

Rules:
- Each title is under 55 characters.
- No "SHOCKING".
- Each one promises a mechanism plus a threat, and the video pays it off by 1:20 (L1) and 12:50 (L3).

## Thumbnails v2 (trained on the niche's top videos; replaces v1, archived in `thumbs/src/v1/`)

**What the top 12 videos in the niche do** (yt-dlp search, 13 Oct 2026). The leaders are:
- Fern, "The Kids Who Hacked The CIA" (20.1M)
- Fern, "Russia's Most Wanted Hackers" (5.4M)
- Cybernews, "NotPetya" (4.7M)
- Fern, "How America Destroyed Iran's Nuclear Program" (4.2M)

They share:
1. One huge hero that reads as **evidence**: a case-board photo, CCTV, or a document with a **mouse cursor**.
2. 1–3 words in heavy sans, often a **declarative or accusing phrase** ("IT'S THEM.", "WANTED").
3. One red annotation: an arrow or loop.
4. The niche palette is **red and black**, and almost every thumbnail uses it. Our phosphor-green and sodium palette is the pattern break in that feed.

**Why v1 was cut:**
- "IT MOVED BY ITSELF" is 4 words (it fails gate 1).
- The text glowed.
- B had no red element.
- C relied on a CG human.

All three v2 concepts pass the three Palantir gates: ≤3 words, a high-contrast hero, exactly one red element. Check `thumbs/mobile.png`.

| | Grammar | Hero | Text | Red | Score |
|---|---|---|---|---|---|
| **A (lead)** | Evidence macro (Cybernews cursor + Fern question) | Giant pixel cursor on the OPEN button | WHO CLICKED? | Loop on the cursor | 9 |
| B | Deadpan flash | The untouched mouse, direct flash, date stamp | NOBODY TOUCHED IT | Loop on the mouse | 8 |
| C | Absence drawn | Europe at night with one region gone dark | ONE CLICK | Dashed outline of the dark region | 7 |

**Title pairing (the thumbnail sharpens the title, never repeats it):**
- A + "The Hackers Who Can Turn Off the Lights": the title names the who in general, and the thumbnail asks who clicked.
- B + "The Mouse Moved By Itself…" is redundant, so pair B with title A only.

**Every image is in the video in the first 45 s:**
- A: the OPEN click at 0:43.
- B: the flash still at 3:23. The cursor in the cold open moves by itself while the hand rests beside the mouse.
- C: the orbit at 0:00–0:05.

**CTR reality:**
- YouTube says half of all channels and videos sit at 2–10% impressions CTR.
- Broad browse traffic pulls CTR down as reach grows.
- A 35% floor is not achievable as a guarantee. Use Test & Compare (decided on watch-time share) to pick the winner.
- Prediction: 6–11% in week 1, higher from notifications and returning viewers.

## Hook contract
| Time | Beat |
|---|---|
| 0:00–0:05 | No text. Black Marble orbit. Heartbeat tone. The first frame must read as "satellite, night, Europe" at phone size |
| 0:15 | First VO: the date and the place |
| 0:30 | The cursor moves by itself (the thumbnail image paid off within 30 s) |
| 0:40 | Breaker clunk, black, then the orbit lights die |
| 0:55 | "The malicious software… couldn't have done it." (L1 opens) |
| 1:10 | L3: "not the only ones who have learned how" |

## Chapters
00:00 The cursor · 01:20 The afternoon · 04:10 The second strike · 06:30 The Tower · 08:50 The grid · 10:50 Already inside · 12:50 The cursor

## Retention beats (3:00 / 6:00 / 9:00 rule)
- **~3:00:** "the malware couldn't have done it — people did" (the L1 payoff).
- **~5:00:** they cut the power to the power company.
- **~6:00:** "it was a test", then the Tower.
- **~7:45:** Maersk is saved by a blackout.
- **~9:40:** the manual-fallback twist (L2).
- **~11:00:** "they're not stealing secrets. They're waiting."
- **~12:30:** AI wrote part of the weapon.

## Compliance
- Faces: no red annotations on any person. The indicted officers appear only as text names with the tag "charged, not convicted", or not at all.
- The phantom-mouse footage is ALWAYS a labelled reconstruction.
- Russia's and China's denials are in the same chapter as each accusation.
- The video stays advertiser-friendly: no graphic content, and no how-to detail beyond what's in public government reports.
