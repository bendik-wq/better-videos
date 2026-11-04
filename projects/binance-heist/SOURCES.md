# Sources: The Job Interview That Cost $6.3 Billion

Built with `docs/library/fact-check-playbook.md` (§1 tiers, §2 nine checks, §7 table).
**Breaking story (theft 29 Oct 2026, Binance report 3 Nov 2026). Every fact below is ⏱: re-check all of them on publish day.** Accessed times are 2026-11-04 (UTC) unless noted; "pub" is the outlet's own timestamp.

**Status ladder for this story:** nobody has been charged. North Korea's role is an **FBI attribution** (official statement) plus **private-firm assessments** (TRM "high confidence", Chainalysis "likely"). North Korea **rejects** it (Reuters). Binance's account of how the attackers got in is **the company's own claim** (tier 3), not independently verified. So: "Binance says…", "the FBI says…", "investigators say…", never "North Korea stole".

**Read status:** *extract* = read through WebFetch/search extract of the outlet's page; the primary documents themselves (Binance's report on binance.com, the FBI alert on fbi.gov/ic3.gov, TRM/Chainalysis/Elliptic/Fireblocks posts) were **not opened directly** in this run. ⚑ A human must open each primary document before VO lock. No Wayback snapshots saved yet ⚑.

---

## A. Source list

| ID | Source | Tier | pub | URL | Read |
|---|---|---|---|---|---|
| P1 | **Binance incident report** ("initial report", 3 Nov 2026), as quoted by the outlets below | 3 (company claim) | 3 Nov 2026 | binance.com — exact URL not found in this run ⚑ | not read; via R1–R4 |
| P2 | **FBI cyber alert** naming TraderTraitor, with address list (Sat 31 Oct 2026), with Secret Service + IRS-CI | 1 (official statement; attribution) | 31 Oct 2026 | fbi.gov / ic3.gov URL not found ⚑ | not read; via R5, R6 |
| P3 | FBI PSA I-022625-PSA, Bybit theft attributed to North Korea/TraderTraitor | 1 | 26 Feb 2025 | https://www.ic3.gov/PSA/2025/PSA250226 | extract |
| R1 | Reuters via NBC News, "Binance says hackers used fake job interview to compromise computer before $6.3 billion attack" | 5 | 3 Nov 2026 10:56 EST | https://www.nbcnews.com/business/markets/binance-hack-fake-job-interview-heist-rcna607238 | extract |
| R2 | Fortune (Jeff John Roberts), "North Korea used LinkedIn, fake job interviews to trick Binance engineer in $6.3 billion hack" | 5 | 3 Nov 2026 10:16 ET | https://fortune.com/2026/11/03/binance-hack-details-linkedin/ | extract |
| R3 | BleepingComputer (Lawrence Abrams), "Binance says fake job interview led to $6.3 billion crypto heist" | 5 (trade) | 3 Nov 2026 15:05 | https://www.bleepingcomputer.com/news/security/binance-says-fake-job-interview-led-to-63-billion-crypto-heist/ | extract |
| R4 | FOX Business (Bradford Betz, with Reuters) | 5 | 3 Nov 2026 13:18 EST | https://www.foxbusiness.com/fox-news-tech/binance-details-how-fake-job-interview-led-6-3b-crypto-heist | extract |
| R5 | Yonhap via Korea Times, "FBI says N. Korea responsible for over $6 bil. crypto theft from Binance" | 5 | 1 Nov 2026 07:55 KST (upd. 17:01) | https://www.koreatimes.co.kr/foreignaffairs/northkorea/20261101/fbi-says-n-korea-responsible-for-over-6-bil-crypto-theft-from-binance | extract |
| R6 | Nextgov/FCW (David DiMolfetta), "FBI links $6.3 billion Binance hack to North Korea" | 5 | 30 Oct 2026 (updated after 2 Nov) | https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/ | extract |
| R7 | AP via WCAX, "North Korea linked to $6.3 billion hack on Binance, blockchain intelligence firms say" | 5 | 30 Oct 2026 05:15 EDT | https://www.wcax.com/2026/10/30/north-korea-linked-63-billion-hack-binance-blockchain-intelligence-firms-say/ | extract |
| R8 | noze.it, "Binance attack: 50 EIP-7702 signatures and a laptop" (cites TRM, Chainalysis, Fireblocks, Blockaid) | 6 (aggregator, lead only → follow to Fireblocks/TRM) | 30 Oct 2026 | https://www.noze.it/en/insights/binance-attack-what-is-known/ | extract |
| R9 | The Block, "How a fake job offer took down the world's most popular crypto game" (Axie/Ronin, 2022; anonymous sources) | 5 (single-source reporting) | Jul 2022 | https://www.theblock.co/post/156038/how-north-korea-hacked-axie-infinitys-ronin | search extract |
| X1 | TRM Labs blog on the $6.36B theft | 4 | 29–30 Oct 2026 | not located ⚑ | via R6, R7, R8 |
| X2 | Chainalysis (Jonathan Levin on X; blog) | 4 | 29–30 Oct 2026 | not located ⚑ | via R7, R8 |
| X3 | Elliptic (Tom Robinson, quoted) | 4 / 3 | 2 Nov 2026 | via R6 | via R6 |
| X4 | Fireblocks / Blockaid analysis of the EIP-7702 authorisations | 4 | 30 Oct 2026 | not located ⚑ | via R8 + search extract |

Not used (failed checks): tech-insider.org pages (unverifiable details; tier 7) · Bloomberg 3 Nov (403, unread) · a YouTube title "Kim Yo-jong denies allegations" (Arirang) — no text source found ⚑ check.

---

## B. Claim table (playbook §7). All rows ⏱.

| ID | Claim as spoken (script beat) | Status | Source (tier) | pub/time | Second source | Our math | Caption on screen | Check |
|---|---|---|---|---|---|---|---|---|
| S01 | About $6.3 billion taken from Binance (cold open, everywhere) | company claim + analysts' estimate | P1 via R1/R2/R4 (3) "$6.3B"; R3 "$6.34B" | 3 Nov | TRM $6.36B (X1 via R6/R7); Chainalysis ~$6.4B (R8) — independent | spoken "about six point three billion" | `$6.3B · BINANCE, 3 NOV 2026` | ✅ ⏱ |
| S02 | "The largest crypto theft on record" | analysts' and Binance's description | TRM via R7; Binance via R6 | 30 Oct | R2 "largest in crypto history" | — | `LARGEST ON RECORD · TRM LABS` | ✅ ⏱ |
| S03 | More than four times Bybit's $1.5B (Feb 2025) | fact (FBI on Bybit) + computed | P3 (1) Bybit $1.5B; R6 "more than four times" | 26 Feb 2025 | R7 | 6.3 / 1.5 = 4.2 | `BYBIT $1.5B · FBI, FEB 2025` | ✅ |
| S04 | Theft on 29 Oct 2026 (Thursday) | fact | P1 via R1; FBI "on or about Oct. 29" via R5 | 3 Nov / 1 Nov | R3 | — | `29 OCT 2026` | ✅ ⏱ |
| S05 | Funds began leaving hot wallets ~20:05 UTC | analysts' timeline | R8 citing TRM (6) | 30 Oct | search extract of second analysis ("starting around 20:05 UTC") — same origin | — | `20:05 UTC · TRM LABS (VIA NOZE.IT)` | ⚠ single origin — not in cold open/red |
| S06 | Ten blockchains; "most of it in about twenty minutes" | analysts' estimate | TRM via R7 (AP) | 30 Oct | TRM via R6 (Nextgov) — same origin | — | `~20 MIN · TRM LABS` | ⚠ single origin (TRM). OK in VO with attribution; not title/red |
| S07 | More than $2.5 million a second | **our math** | from S01/S06 | — | — | "most" of $6.36B ≥ $3.18B ÷ 1,200 s = $2.65M/s (lower bound) | `OUR MATH: >$3.18B ÷ 1,200 s` | ✅ (math shown) |
| S08 | Preparation began at least 36 hours before | analysts' estimate | TRM via R8 and search extracts | 30 Oct | — | — | `TRM LABS` | ⚠ |
| S09 | June: an ad for a tampered tool; engineer downloaded tampered Homebrew / "AI tool" | company claim | P1 via R1 ("tampered AI tool"), R2 ("tampered version of Homebrew") | 3 Nov | R3 | — | `JUNE · BINANCE REPORT` | ✅ ⏱ (⚑ "AI tool" vs "Homebrew": say "a tampered copy of a popular developer tool") |
| S10 | Binance caught it, replaced the device, changed credentials — but roles were exposed | company claim | R1, R2 | 3 Nov | — | — | `BINANCE REPORT` | ✅ |
| S11 | September: Engineer B contacted on a legitimate job-hunting platform by a "Project Director" | company claim | R2 quotes report verbatim; R3 | 3 Nov | R1 | — | quote card, recreated excerpt | ✅ |
| S12 | Engineer B's profile referenced past Binance employment | company claim | R3 | 3 Nov | — | — | — | ⚠ single (R3) — VO "according to the report as quoted by BleepingComputer" or drop |
| S13 | HR interview with live video call; second interview with a "CEO" of a fictitious company | company claim | R2, R3 | 3 Nov | R1 ("virtual meeting with the CEO of a fictitious company") | — | — | ✅ |
| S14 | Told to download a coding assignment from an online code repository | company claim | R3, R1 ("malicious code repository") | 3 Nov | R2 | — | — | ✅ |
| S15 | "The 0-day malware was not detected by the endpoint security protection tools at the time." | company quote | R3 (verbatim) | 3 Nov | — | — | quote card | ⚠ quote single-sourced; verify in P1 |
| S16 | Malware swapped in a fake `pyenv` in the Homebrew folder, spawned a shell | company claim | R3 | 3 Nov | — | — | on-screen terminal reconstruction, labelled | ⚠ technical detail single-sourced |
| S17 | By 20 Oct, used the laptop and an **internal AI tool** to compromise two wallet-team engineers (A and C) | company claim | R1, R2, R3 | 3 Nov | — | — | `20 OCT · BINANCE REPORT` | ✅ |
| S18 | Engineer A's computer held a container-deployment token | company claim | R2, R3 | 3 Nov | — | — | — | ✅ |
| S19 | AI was secondary; mainly conventional phishing | company claim | R2 | 3 Nov | — | — | — | ⚠ |
| S20 | 29 Oct: deployed a malicious script, reached the wallet signing service | company claim | R3; R1 ("triggered a malicious script") | 3 Nov | — | — | — | ✅ |
| S21 | 50 EIP-7702 authorisations signed by the hot-wallet key; delegation allowed sweeps without new signatures | analysts' reconstruction | R8 citing Fireblocks/Blockaid; R3 says Binance confirms EIP-7702 abuse kept stealing after withdrawals were suspended | 30 Oct / 3 Nov | Blockaid via search extract | — | `50 SIGNATURES · FIREBLOCKS / BLOCKAID` | ✅ (EIP-7702 confirmed by Binance per R3; "50" ⚠ analysts) |
| S22 | "No evidence of any wallet private key leak" | company claim | R7 (AP) quoting Binance on X | 30 Oct | R4 | — | quote card | ✅ |
| S23 | Withdrawals shut ~48 h, re-enabled Saturday (31 Oct) | company claim / reported | R2 | 3 Nov | R7 ("in the next day or two") | — | `48 H · FORTUNE` | ✅ |
| S24 | 98% of affected token assets replenished (as of 31 Oct) | company claim | R3; R2 | 3 Nov | (R4 said ~90% earlier — older figure) | — | `98% · BINANCE, AS OF 31 OCT` | ✅ ⏱ |
| S25 | About $2.85B frozen or intercepted (as of 3 Nov) | company claim | R3 | 3 Nov | R2 ~$2.5B (Tether, Circle); R7 ~$3B (30 Oct) | range $2.5–3B | `~$2.85B · BINANCE, 3 NOV` | ✅ ⏱ (say "close to three billion") |
| S26 | "Users will not bear the financial impact"; SAFU + company funds | company claim | R4 | 3 Nov | R7 ("will cover all losses") | — | quote card | ✅ |
| S27 | "This should not have happened…" apology | company quote | R1, R2 | 3 Nov | — | — | quote card | ✅ |
| S28 | FBI: North Korea responsible; "TraderTraitor"; funds converted mainly to Ether; address list; Secret Service + IRS-CI | official attribution | P2 via R5 | 1 Nov KST | R6 | — | `FBI CYBER ALERT · 31 OCT 2026` | ✅ ⏱ (⚑ open the alert itself) |
| S29 | TRM: TraderTraitor, "with high confidence"; Chainalysis: "likely done by DPRK group TraderTraitor" | analysts' assessments | R7 | 30 Oct | R6 | — | — | ✅ |
| S30 | North Korea has rejected the claim | denial | R1 (Reuters) | 3 Nov | ⚠ no North Korean primary text found | — | `NORTH KOREA DENIES · REUTERS` | ⚠ find the KCNA text ⚑ |
| S31 | Trump: "We don't know if it's North Korea, but if it is, we'll talk to North Korea about it." | quote | R5 | 1 Nov | — | — | quote card | ✅ |
| S32 | Elliptic: ~$3.24B still in linked addresses; "very likely still held by North Korea"; possibly Chinese laundering networks | analyst quote | R6 | 2 Nov | — | — | `ELLIPTIC · 2 NOV` | ⚠ single ⏱ |
| S33 | US intelligence: Pyongyang nets at least $1B a year from crypto heists and other financial crime | official assessment, reported | R6 | 2026 | ⚑ find the ODNI document | — | `US INTELLIGENCE, 2026 · VIA NEXTGOV` | ⚠ |
| S34 | Experts: crypto theft funds the economy and nuclear programme despite UN sanctions | expert view, reported | R7 (AP) | 30 Oct | UN Panel of Experts reports (older) ⚑ | — | — | ✅ with "experts say" |
| S35 | Binance blocked 57 North Korea–related attempts in 2026 | company claim | R2 | 3 Nov | — | — | `57 · BINANCE, VIA FORTUNE` | ⚠ |
| S36 | Non-public-facing employees aren't allowed LinkedIn profiles; Binance declined to say if Engineer B broke it | company statement | R2 | 3 Nov | — | — | — | ⚠ (use carefully: implies blame on a private person; prefer to omit) |
| S37 | CZ: "User funds are safe!"; "does look like a hack" | quote | R7 | 30 Oct | — | — | — | ✅ |
| S38 | CZ pleaded guilty in 2023 (failing to maintain an effective AML programme), stepped down; pardoned 2025 | fact (court record / pardon) | R7 (AP) | — | DOJ 2023 press release ⚑ | — | — | ✅ (background only; not used in VO) |
| S39 | Axie/Ronin 2022: fake job offer + PDF, per The Block's anonymous sources; Sky Mavis only said "advanced spear-phishing" | reported (anonymous) | R9 | Jul 2022 | Sky Mavis post-mortem ("spear-phishing") | — | `THE BLOCK, 2022 (UNCONFIRMED BY SKY MAVIS)` | ⚠ phrase as reported |
| S40 | Binance co-CEO Richard Teng: the attacker "did not simply use one engineer's permissions" | quote | search extract | ~31 Oct | ⚑ | — | — | ⚠ verify or cut |
| S41 | Bitcoin, Ether and BNB fell after disclosure | reported | R4 (Reuters/CoinGecko) | 3 Nov | — | — | — | ✅ (not used) |
| S42 | Researchers have documented fake-recruiter / poisoned-coding-test campaigns against developers (Contagious Interview, 35 malicious npm packages per Socket, Jun 2025; Operation Dream Job) | reported research | R3 background (5) citing Socket (4) | 3 Nov 2026 | Socket report ⚑ open | — | `SOCKET 2025 · VIA BLEEPINGCOMPUTER` | ✅ (VO says "the same lure", not "the same group") |
| S43 | US officials tied the 2022 Ronin/Axie theft to North Korea (FBI statement, Apr 2022, Lazarus Group/APT38) | official attribution | ⚑ FBI statement Apr 2022 not opened in this run; R9 extract says "the US government and investigators associated the theft with Lazarus Group and APT38" | 2022 | — | — | `FBI, APR 2022` | ⚠ open the FBI statement |
| S44 | Axie/Ronin amount "more than half a billion dollars" | reported | R9 extract: figures range $540M–$625M | 2022 | Sky Mavis post-mortem ⚑ | lower bound of range → "more than half a billion" | `$540–625M · REPORTS VARY` | ✅ (range-safe wording) |

## C. Timeline (built from dated records; check every "then" in SCRIPT.md against it)

| When | What | Source |
|---|---|---|
| June 2026 | Ad leads a wallet-team engineer to a tampered developer tool; Binance detects it, replaces device, rotates credentials; roles exposed | S09, S10 |
| September 2026 | Engineer B contacted via job platform; HR video interview; "CEO" interview; downloads coding assignment | S11–S14 |
| by 20 Oct 2026 | Attackers use B's laptop + internal AI tool to compromise Engineers A and C; get credentials + container token | S17, S18 |
| 29 Oct 2026 (Thu), ~20:05 UTC | Malicious script deployed; signing service reached; funds leave across ten chains, most in ~20 min | S05, S06, S20, S21 |
| 29–30 Oct | TRM and Chainalysis attribute to TraderTraitor; CZ "User funds are safe!" | S29, S37 |
| 30 Oct (Fri) | Binance on X: compromised laptop, then "additional points of breach"; ~$3B frozen; withdrawals suspended | S22, S25 |
| 31 Oct (Sat) | FBI alert names TraderTraitor; Trump comment; withdrawals re-enabled; 98% replenished | S23, S24, S28, S31 |
| 2 Nov (Mon) | Elliptic: $3.24B still in linked addresses | S32 |
| 3 Nov (Tue) | Binance publishes report: fake interview chain; apology | S11–S27 |

## D. Pre-publish gate
- [ ] Open P1 (Binance report) and P2 (FBI alert) directly; confirm S11–S21, S28 wording.
- [ ] Re-check S01, S24, S25, S32 (numbers move daily).
- [ ] Find a North Korean statement (S30) or keep "Reuters reports North Korea has rejected the claim".
- [ ] No ⚠ row in the title, thumbnail, cold open or red: title uses only S01 (✅). Thumbnail B quotes S15 (⚠) → must be verified in P1 before B is used.
- [ ] Private people: Engineers A/B/C only by Binance's labels; no LinkedIn-policy blame (S36 not in VO).
- [ ] Save Wayback snapshots of R1–R9.
