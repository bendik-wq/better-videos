# The Hackers Who Can Turn Off the Power: research and fact-check

Episode 4. Compiled 2026-10-12. The script is written from this pack, never from memory. Every spoken number needs a row here.
Source IDs (S01…) point to `SOURCES.md`, which gives full URLs, publishers, dates, tiers and read status.

**Confidence levels**
- **High**: a primary record (indictment, government advisory, utility incident report, official inquiry) or official statistics, or two independent strong sources that agree.
- **Medium**: one strong source (one quality outlet, one vendor report, or one named journalist's reconstruction), or several secondary outlets.
- **Low**: contested, single weak source, or paraphrased. Low rows can't go in the title, the thumbnail, the cold open or a red annotation (playbook §1 and §7).

**Markers**
- ⏱ means time-sensitive. Re-check it on VO-lock day and again on publish day, and put an "as of" date in the caption.
- ⚑ means it must be resolved or cut before the script locks.

**Access note (affects sourcing).** justice.gov press pages, cisa.gov, fbi.gov and dragos.com PDFs block this environment (403 or bot wall). Workarounds used:
- The **indictment PDF** itself downloaded from justice.gov and was read in full (S03).
- The **Volt Typhoon advisory** was read in full from the IC3 copy of the same PDF (S17).
- The **ICS-CERT alert** (S02) was read through WebFetch extracts only. Its wording needs a direct check.
- The **DOJ press release** (S04) and **Demers remarks** (S05) were not read. Quotes from them are marked ⚑.
- The **Dragos CRASHOVERRIDE** whitepaper wasn't reachable. I used Robert M. Lee's Dragos slide deck hosted by SANS (S11) for the 23:53 time.
- The **CERT-UA Industroyer2 notice** (S13) is JavaScript-rendered and couldn't be read. Its wording comes through ESET (S12) and press.
- **Reuters** wasn't read directly.

**Attribution rules for this episode** (playbook §5, script-patterns §4.2):
- The six GRU officers are **charged, not convicted**. They are at large and Russia denies it. Always say "the indictment alleges" or "prosecutors say", never "Pliskin built NotPetya".
- "Sandworm" as the actor behind 2015/2016/2022 is an **assessment** by governments and vendors. The 2020 indictment *alleges* the 2015 and 2016 grid attacks.
- Volt Typhoon is attributed to China by CISA/NSA/FBI. **China denies it.** Say both.

---

## 0. Timeline at a glance

| Date (local) | Event | Source |
|---|---|---|
| 23 Dec 2015, ~15:30–15:35 | Three Ukrainian oblenergos are hit within 30 minutes of each other. ~225,000 customers lose power for 1–6 h | S01, S02, S06 |
| 6 Dec 2016 | KillDisk is deployed against Ukraine's Ministry of Finance and State Treasury. ~150,000 transactions are blocked | S03 ¶24 |
| 17 Dec 2016, 23:53 | Industroyer/CrashOverride trips Ukrenergo's Pivnichna 330 kV transmission substation north of Kyiv. Power is out for about 1 h | S11, S03 ¶22–23, S07 |
| 27 Jun 2017 | NotPetya is launched through a M.E.Doc update. Damage is global | S03 ¶31–34, S08, S16 |
| 9 Feb 2018, ~19:42 KST | Olympic Destroyer hits during the PyeongChang opening ceremony | S03 ¶62 |
| 15 Feb 2018 | The White House attributes NotPetya to the Russian military | S16 |
| 15 Oct 2020 (filed) / 19 Oct 2020 (unsealed) | US v. Andrienko et al., W.D. Pa.: six GRU Unit 74455 officers are indicted | S03, S04 |
| 24 Feb 2022 | Ukraine disconnects from the Russian/Belarusian grid for a planned isolation test, hours before the invasion | S40 |
| 16 Mar 2022 | Ukraine and Moldova are synchronised with continental Europe (ENTSO-E) | S28 |
| 8 Apr 2022 | Industroyer2 is scheduled for 16:10 UTC (19:10 Kyiv) against a Ukrainian energy company. It is thwarted | S12, S13 |
| 10 & 12 Oct 2022 | Sandworm uses MicroSCADA to trip substation breakers, causing an outage that coincided with mass missile strikes. CaddyWiper follows on the 12th | S15 |
| 7 Feb 2024 | CISA/NSA/FBI advisory AA24-038A: Volt Typhoon is "pre-positioning" in US critical infrastructure | S17 |
| Feb–Nov 2023 (disclosed Mar 2025) | Volt Typhoon spends >300 days inside Littleton Electric Light & Water (Massachusetts) | S21 |
| 29 Dec 2025 | Destructive attack on ≥30 Polish wind/solar farms, a CHP plant and a manufacturer. No blackout | S22, S23 |
| 17–19 Feb 2026 | Dragos annual report: Volt Typhoon is still active; Lee says some sites "we will never find" ⏱ | S19, S20 |
| 7 Apr 2026, updated 22 Jul 2026 | Advisory AA26-097A: Iranian-affiliated actors disrupt PLCs in US Energy, Water and Government sectors ⏱ | S24 |

---

## 1. Ukraine, 23 December 2015

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| The three victim companies | **Kyivoblenergo** (Kyiv region), **Prykarpattyaoblenergo** (Ivano-Frankivsk region) and **Chernivtsioblenergo** (Chernivtsi region). E-ISAC names Kyivoblenergo and cites Ukrainian reporting on Prykarpattyaoblenergo; Greenberg names Kyivoblenergo as "one of the three victims" and Prykarpattyaoblenergo as "the power company that had taken the brunt" | S01 p.iii; S07; Chernivtsi via CCDCOE/RISI summaries (S41, tier 6 lead) | High for Kyiv and Prykarpattya. **Medium for Chernivtsi** ⚑ (find a tier 1–5 source naming it; Greenberg's book should) |
| Number affected | "approximately **225,000 customers**" (ICS-CERT). Indictment ¶20: "more than 225,000 Ukrainian customers". E-ISAC: "roughly 225,000 customers" | S02; S03 ¶20; S01 p.11 | **High** (3 sources). Say **customers**, not people (see Contested C1) |
| Original estimate was lower | "originally thought to have affected approximately **80,000** customers, based on the Kyivoblenergo's update to customers" | S01 p.iii | High |
| Synchronised | Attacks "executed **within 30 minutes of each other**" | S01 p.1; S02 | High |
| Time | Kyivoblenergo: "Starting at approximately **3:35 p.m.** local time". Zetter: "It was **3:30 p.m.** last December 23" | S01 p.iii; S06 | High. VO: "just after half past three in the afternoon" |
| Substations opened | "**At least 27 substations (the total number is probably higher)** were taken offline across the three energy companies". The 27 is "assessed with medium confidence" to be "a low number". Kyivoblenergo alone: "**seven 110 kV and 23 35 kV substations** were disconnected for three hours" (= 30) | S01 p.iii, p.11 fn33 | High for "at least 27". Our math: 7 + 23 = 30 at Kyivoblenergo alone, which is why E-ISAC calls 27 low. **VO: "dozens of substations"** (the indictment's wording, ¶20) |
| Prykarpattyaoblenergo alone | Zetter: "eventually taking **about 30 substations** offline", and the two other centres were hit "at the same time, nearly doubling the number of substations taken offline" | S06 | Medium (one reconstruction) |
| Outage length | Zetter: "**just one to six hours** for all the areas hit". Kyivoblenergo: "**three hours**". E-ISAC: "an outage window lasting **several hours**". Ukrainian headline cited by E-ISAC: Prykarpattyaoblenergo "de-energised half the region **for 6 hours**" | S06; S01 p.iii, p.1, fn3 | High. **VO: "between one and six hours"** |
| Operators went to manual | "required the oblenergos to **move to manual operations**". Months later they still operated "in an operationally constrained mode" | S01 p.1 (citing DHS) | High |
| Two months later | "more than two months after the attack, the control centers are still not fully operational… **workers still have to control the breakers manually**" | S06 | Medium-High (consistent with S01) |
| **Phantom mouse** (Zetter's version, 2016) | "the cursor on his computer suddenly **skittered across the screen of its own accord**… The operator grabbed his mouse and tried desperately to seize control of the cursor, but it was unresponsive… the machine suddenly logged him out" | S06 (Kim Zetter, WIRED, 3 Mar 2016) | Medium-High. A reconstruction based on investigators' accounts. Attribute: "as Kim Zetter reconstructed it for WIRED" |
| **Phantom mouse** (Greenberg's version, 2017): it was filmed | Prykarpattyaoblenergo's technical director played "a video he'd recorded himself on his battered **iPhone 5s**". "The **56-second clip** showed a cursor moving around the screen… The video pans from the computer's Samsung monitor to its mouse, which **hasn't budged**." The attackers "exploited the company's **IT helpdesk tool** to take direct control of the mouse movements" | S07 (Andy Greenberg, WIRED, 20 Jun 2017) | Medium-High. Strongest phantom-mouse line. **Two independent reporters agree on the core.** ⚑ We have not seen the clip itself. Don't show "the" video unless it is licensed and verified |
| Kyivoblenergo was different: a clone, not a mouse | Kyivoblenergo engineers found the attackers "had set up their own perfectly configured **copy of the control software** on a PC in a faraway facility". At Prykarpattya, "their circuit breakers had been opened by another method" | S07 | Medium. Good for "two different techniques in one afternoon" |
| Official wording on remote control | "malicious remote operation of the breakers was conducted by **multiple external humans**", using "existing remote administration tools at the operating system level or remote industrial control system (ICS) client software via virtual private network (VPN) connections" | S02 | High (ICS-CERT). ⚑ Read S02 directly to confirm the exact wording |
| Humans, not malware, caused the outage | "**neither BlackEnergy 3 nor KillDisk contained the required components to cause the outage.** The outages were caused by the use of the control systems and their software through direct interaction by the adversary." | S01 p.5 | **High**. Hook-grade |
| BlackEnergy 3 spear-phishing | "Spear phishing to gain access to the business networks"; "**Identification of BlackEnergy 3 at each of the impacted oblenergos**". Macros in Office documents: "**not an exploit of a vulnerability**… There was no observed exploit code in this incident." | S01 p.4, p.8 | High |
| When the intrusion began | Indictment ¶21: preparations "commenced in and around **late spring 2015**". E-ISAC: access gained "**more than six months prior** to December 23, 2015", and the attack is mapped "from **March 2015** – December 23, 2015" | S03; S01 p.8, p.11 | High. VO: "about nine months earlier" is our math from March, so say **"months earlier, in the spring"** to be safe |
| Who was phished | Indictment ¶21a: "targeted the companies' **information technology staff and system administrators** using emails attaching malware-laced files" | S03 | High (alleged) |
| VPN, no 2FA | "The VPNs into the ICS from the business network appear to **lack two-factor authentication**" | S01 p.5 | High |
| **KillDisk wipe** | "a modified **KillDisk** to erase the master boot record". Wiped "workstations, servers, and an **HMI card inside of an RTU**". ICS-CERT: "erases selected files on target systems and corrupts the master boot record" | S01 p.4, p.12; S02 | High |
| KillDisk timing (logic bomb) | "in two cases the attackers used a **logic bomb** that launched KillDisk automatically **about 90 minutes** into the attack". That would be around 5 p.m., when Prykarpattyaoblenergo first posted about the outage | S06 (Robert M. Lee to Zetter) | Medium (one source) |
| **Serial-to-ethernet firmware** ("blowing the bridges") | Malicious firmware uploaded to serial-to-ethernet gateways so "even if the operator workstations were recovered, **remote commands could not be issued** to bring the substations back online (We have characterized the firmware attacks… as '**blowing the bridges**')". Zetter: firmware overwritten "at **16** of the substations" | S01 p.12; S06 | High for the technique. **Medium for "16"** (single source) |
| Firmware was tested in advance | E-ISAC/SANS "assess with **high confidence**" the adversary tested before deployment. They "likely had systems… to evaluate and test their firmware" | S01 p.10 | High (as an assessment) |
| **TDoS on call centres** | "used telephone systems to generate **thousands of calls** to the energy company's call center to deny access to customers reporting outages". E-ISAC later judged it was "more likely… to **frustrate the customers**". Zetter: calls "that **appeared to come from Moscow**" | S01 p.4, p.12; S06 | High for the TDoS. **Medium for "from Moscow"** (single source, and spoofing is possible) |
| **UPS reconfiguration** | "at least one of the oblenergos, the attackers discovered a network connected to a UPS and reconfigured it so that when the attacker caused a power outage, it was followed by an event that would also impact the power in the energy company's buildings or data centers". ICS-CERT: scheduled UPS disconnects "to interfere with expected restoration efforts". Zetter: backup power disabled at "**two of the three**" centres, "leaving operators themselves **stumbling in the dark**" | S01 p.10; S02; S06 | High for the technique. Medium for "two of three" |
| Logs helped investigators | Investigators "were pleasantly surprised" that the companies "had a **vast collection of firewall and system logs**" | S06 | Medium |
| Why it worked | The ICS was segmented with firewalls, "surprisingly more secure than some in the US" (Zetter's paraphrase of experts) | S06 | Medium. Attribute |
| Attribution | ICS-CERT 2021 update: the US Government "attributes this activity to **Russian nation-state cyber actors**". The indictment (2020) **alleges** GRU Unit 74455 did it | S02; S03 ¶3a, ¶20 | High (as government attribution and allegation) |
| "First" | Zetter: "the **first confirmed hack to take down a power grid**" | S06 | Medium-High. **VO: "the first publicly confirmed blackout caused by hackers"** |

---

## 2. Kyiv, 17 December 2016 (Industroyer / CrashOverride)

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Time | "**17 Dec 2016, 23:53 Local Time**: Ukrenergo substation de-energizes; resulted in outage for service area" | S11 (Robert M. Lee, Dragos, slide deck Jul 2017) | High (Dragos) + S03 ¶22 ("on or about December 17, 2016") |
| Target | Ukrenergo's transmission substation just north of Kyiv. Greenberg: "Ukrenergo's **transmission station just north of Kiev**". The name **Pivnichna ("North")**, **330 kV**, comes from press and Wikipedia (Wikipedia mislabels it "330 kilowatt") | S07; S36 (press); Wikipedia lead only | High for "transmission substation near Kyiv". **Medium for the name "Pivnichna"** ⚑ (get it from Ukrenergo's own statement or ISSP) |
| How long | Indictment ¶23: "disrupted the supply of electricity to Kiev, Ukraine, for **approximately one hour**". Greenberg: "down for just **an hour**". Ukrenergo CEO Kovalchuk (via press): power restored in **30 minutes** by manual procedure, fully restored after "just over an hour" | S03; S07; S36 | **High: "about an hour"** |
| Load lost | Greenberg: "That single Kiev transmission station carried **200 megawatts**, more total electric load than all the 50-plus distribution stations knocked out in the 2015 attack combined". Kovalchuk to Reuters (via Bitdefender): **200 MW**, about **a fifth of the capital's night-time consumption** | S07; S35 | Medium-High (two routes, but Reuters not read directly ⚑) |
| "A fifth of Kyiv" | Greenberg: the three transformers were "responsible for **about a fifth of the capital's electrical capacity**" | S07 | Medium. Pair it with S35 |
| What was new | ESET: Industroyer speaks **IEC 60870-5-101, IEC 60870-5-104, IEC 61850 and OPC DA**, plus a DoS tool against **Siemens SIPROTEC** protection relays. "the gang behind Industroyer… went to great lengths to create malware capable of **directly controlling switches and circuit breakers**" | S10 (ESET whitepaper, Jun 2017) | High |
| ESET on who built it | "it seems very unlikely anyone could write and test such malware **without access to the specialized equipment**" | S10 | High |
| Dragos framing | Only "**4** ICS-tailored malware families" known (Stuxnet, Havex, BlackEnergy2, CRASHOVERRIDE). Stuxnet and CRASHOVERRIDE were the two with "intent to disrupt". CRASHOVERRIDE was the **1** "grid operations enabled" | S11 | High (as of Jul 2017; since superseded by Triton, Industroyer2, Pipedream, etc.) |
| Greenberg on its significance | "the **first malware found in the wild since Stuxnet** that's designed to independently sabotage physical infrastructure" | S07 | Medium-High (Greenberg, citing Dragos and ESET) |
| Scheduled, not driven by hand | Launcher samples held "two dates, **17th December 2016 and 20th December 2016**". The wiper ran "one or two hours" after the payload | S10 | High |
| Indictment allegations | Network compromised "since in and around **April 2016**". Malware "specifically designed to attack power grids by gaining control of electrical substation switches and circuit breakers". The wiper deleted files including "file extensions specific to the brand of industrial control system" | S03 ¶22–23 | High (as allegation) |
| Krotofil quote | "In 2015 they were like a group of **brutal street fighters**. In 2016, they were **ninjas**." (Marina Krotofil, then Honeywell, to Greenberg) | S07 | Medium-High. Use with attribution |
| Manual recovery again | Ukrenergo's engineers "began **manually closing circuits**" | S07 | Medium-High |

---

## 3. 2022: Industroyer2 (thwarted) and the October 2022 outage

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Disclosure date | ESET blog and CERT-UA notice published **12 Apr 2022** | S12; S13 | High |
| Scheduled time | "Scheduled execution of Industroyer2 to cut power in an Ukrainian region": **2022-04-08 16:10 UTC** (= 19:10 Kyiv, a **Friday** evening). CaddyWiper on Windows plus Linux/Solaris wipers at 14:58 UTC. CaddyWiper set for 16:20 UTC to erase the traces | S12 | High |
| Planned ahead | Compiled **2022-03-23**, "suggesting that attackers had planned their attack for **more than two weeks**" | S12 | High |
| Initial compromise | CERT-UA: no later than **February 2022** (via press) | S13 via S14 | Medium ⚑ (CERT-UA page unread) |
| Targets | ESET: an attempt "to deploy the Industroyer2 malware against **high-voltage electrical substations**". The sample listed "**eight** different IP addresses of devices". IEC-104 only | S12 | High |
| **Thwarted** | ESET: "We worked closely with CERT-UA in order to **remediate and protect** this critical infrastructure network." CERT-UA (via press): disconnection of substations was scheduled for Friday evening 8 Apr, but "the implementation of the malicious plan has been **prevented**" | S12; S13 via S14 | High that no outage resulted (ESET + Ukrainian government). ⚑ Quote CERT-UA from its page |
| Scale if it had worked | Ukrainian officials (Viktor Zhora, SSSCIP) told reporters it would have hit a grid serving about **2 million people** | S14 (MIT Tech Review, CyberScoop, 12 Apr 2022) | Medium. Official's claim, so attribute: "Ukrainian officials said…" |
| Zhora quote | "We are dealing with an opponent who has been **drilling us for eight years** in cyberspace" | S14 | Medium (press) |
| Attribution | ESET: "We assess with **high confidence** that the APT group Sandworm is responsible" | S12 | High (as assessment) |
| **October 2022: an outage that did happen** | Mandiant: Sandworm used "OT-level living off the land (LotL) techniques to likely **trip the victim's substation circuit breakers**, causing an unplanned power outage that **coincided with mass missile strikes** on critical infrastructure across Ukraine." Events on "**October 10 and 12, 2022**". Intrusion began "on, or prior to, **June 2022**". Access to SCADA "for up to **three months**" | S15 (Mandiant, 9 Nov 2023) | High |
| Mandiant on timing | It couldn't prove the cyberattack was deliberately timed with the missiles (via press) | S15 + press | Medium. Say "**coincided with**", never "timed to" |
| What made it new | Ran a native **MicroSCADA** binary from an ISO image ("a.iso"). No custom ICS malware was needed | S15 | High |

---

## 4. Sandworm (GRU Unit 74455): the indictment, NotPetya, Olympic Destroyer, the reward

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Case | *United States v. Yuriy Sergeyevich Andrienko et al.*, W.D. Pennsylvania. Indictment dated **15 Oct 2020** ("OCT 15 2020" stamp), unsealed and announced **19 Oct 2020** | S03; S04 | High |
| The six defendants | **Yuriy Sergeyevich Andrienko, Sergey Vladimirovich Detistov, Pavel Valeryevich Frolov, Anatoliy Sergeyevich Kovalev, Artem Valeryevich Ochichenko, Petr Nikolayevich Pliskin** | S03 caption, ¶2 | High |
| Unit | "Military Unit **74455**… also known within the GRU as the '**Main Center for Special Technologies**'… and by cybersecurity researchers as **Sandworm Team, Telebots, Voodoo Bear, and Iron Viking**" | S03 ¶1 | High |
| HQ | "primarily located at **22 Kirova Street, Khimki**, Moscow, Russia, a building referred to within the GRU as '**the Tower**'" | S03 ¶1 | High (alleged). Good visual (the address), but **don't film or locate individuals** |
| Charges | Seven counts: conspiracy (18 USC 371), conspiracy to commit wire fraud, wire fraud, damage to protected computers, aggravated identity theft | S03 caption | High. ⚑ Confirm the count number from S04 |
| Status | Charged, **not convicted**. All are believed to be in Russia. Russia denied the allegations (Russian Embassy, per press) | S04 ⚑; S37 | Medium for the denial wording ⚑ |
| Roles (alleged) | Andrienko, Detistov, Frolov and Pliskin "developed components of the NotPetya malware". Pliskin "served in a supervisory role as a **Development Team Lead/IT manager**". Detistov "held the position of **captain**". Kovalev "sent spearphishing emails" | S03 ¶4–9 | High (as allegation). Use "the indictment alleges" every time |
| Grid allegation | ¶20: "On or about **December 23, 2015**, the Conspirators hacked into the computer systems belonging to **three Ukrainian energy distribution companies**, interacted remotely with control systems in **dozens of power distribution substations**… and successfully disrupted the supply of electricity to more than 225,000 Ukrainian customers" | S03 | High (alleged) |
| KillDisk and **Mr. Robot** | 2016 KillDisk filled memory with "**mrR0b07**" and "**fS0cie7y**", which "reference the television show '**Mr. Robot**'". Frolov allegedly designed it to "draw the image" of the "**fsociety**" mask in real time | S03 ¶26 | High (alleged). Great texture |
| Ministry of Finance | On 6 Dec 2016, the attack prevented "approximately **150,000 electronic transactions**" (end-of-year pensions) | S03 ¶24 | High (alleged) |
| **NotPetya** launch | "On or about **June 27, 2017**, on the eve of Ukraine's **Constitution Day**". Spread through Ukrainian accounting software **M.E.Doc** updates; malicious update files on 14 Apr, 15 May and 21 Jun 2017 | S03 ¶31, ¶34, ¶37 | High (alleged) |
| NotPetya was fake ransomware | "the purported ransomware purpose of NotPetya was **a ruse**… even if victims paid the ransom (**$300 worth of bitcoin**), the Conspirators would not be able to decrypt" | S03 ¶33 | High |
| US victims in the indictment | **Heritage Valley Health System** (PA): "two hospitals, 60 physician offices, and 18 community satellite facilities". FedEx subsidiary **TNT Express** and "a large U.S. pharmaceutical manufacturer", which "together had **nearly $1 billion in losses**" | S03 ¶3c, ¶32 | High |
| **White House damage claim (official)** | 15 Feb 2018: "In June 2017, the Russian military launched **the most destructive and costly cyber-attack in history**… causing **billions of dollars** in damage across Europe, Asia, and the Americas." | S16 | **High. Note: the official statement says "billions", not "$10 billion"** |
| **"$10 billion+"** | "more than **$10 billion** in total damages, according to a **White House assessment confirmed to WIRED** by former Homeland Security adviser **Tom Bossert**" | S08 (Greenberg, WIRED, 22 Aug 2018) | Medium-High. **Say: "a White House assessment put it at more than ten billion dollars, according to WIRED"**. Don't present it as a published White House figure (Contested C4) |
| Bossert quote | "it was the equivalent of using a **nuclear bomb** to achieve a small tactical victory" | S08 | Medium-High (on the record) |
| Company losses (company disclosures, via WIRED) | Maersk **$250–300M** (chair Jim Hagemann Snabe, Davos). Merck "**$870 million**" (told shareholders). FedEx/TNT "**$400 million**". Saint-Gobain "around the same" | S08 | Medium. ⚑ Pull Merck's and FedEx's own 10-K wording before on-screen use |
| Maersk rebuild | "just **10 days**" to rebuild "**4,000 servers and 45,000 PCs**" (Snabe) | S08 | Medium-High |
| **Blackout saved Maersk** | The one surviving domain controller was in **Ghana**: "a **blackout** had knocked the Ghanaian machine offline… all thanks to a **power outage**" | S08 | Medium-High (WIRED, anonymous Maersk staff). Perfect tie-in for this episode |
| Speed | NotPetya "took **45 seconds** to bring down the network of a large Ukrainian bank" (ISSP to Greenberg) | S08 | Medium |
| **Olympic Destroyer** | 9 Feb 2018: wiper deployed "at approximately **7:42 p.m.** Korea Standard Time, **during the opening ceremony**". Hit **30** PyeongChang Organizing Committee computers between 7:33 and 10:23 p.m. | S03 ¶62 | High (alleged) |
| False flag | The conspirators "crafted the malware's computer code to **emulate malware used by the Lazarus Group in North Korea**" | S03 ¶63a | High (alleged). Hook-grade |
| Other targets alleged | Ukraine, Georgia, France's 2017 election (Macron's En Marche!), the OPCW/Skripal investigations, the 2018 Olympics | S03 ¶2–3 | High (alleged) |
| Demers quote | "No country has weaponized its cyber capabilities as maliciously **and** irresponsibly as Russia…" (the DOJ transcript reportedly has "and"; reprints have "or") | S05 ⚑ | ⚑ Unverified wording. Read the DOJ transcript before quoting |
| **Reward** | State Department **Rewards for Justice**: up to **$10 million** for information to identify or locate the six officers. Reported **26–27 Apr 2022** | S34 | Medium-High ⚑ (get the RFJ page or the State press note for the exact date). ⏱ Check the offer is still live |

---

## 5. US grid exposure

### 5a. Volt Typhoon

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| **The key sentence (quote exactly)** | "The Cybersecurity and Infrastructure Security Agency (CISA), National Security Agency (NSA), and Federal Bureau of Investigation (FBI) assess that People's Republic of China (PRC) state-sponsored cyber actors are **seeking to pre-position themselves on IT networks for disruptive or destructive cyberattacks against U.S. critical infrastructure in the event of a major crisis or conflict with the United States.**" | S17 (AA24-038A, **7 Feb 2024**, Summary, p.1) | **High** (primary, read in full). Red-line OK |
| Not spying | "Volt Typhoon's choice of targets and pattern of behavior is **not consistent with traditional cyber espionage or intelligence gathering operations**, and the U.S. authoring agencies assess with **high confidence** that Volt Typhoon actors are pre-positioning themselves on IT networks to enable lateral movement to OT assets to disrupt functions." | S17 | High |
| Five years | "indications of Volt Typhoon actors maintaining access and footholds within some victim IT environments for **at least five years**" | S17 | High. ⏱ As of Feb 2024 |
| Sectors | "primarily in **Communications, Energy, Transportation Systems, and Water and Wastewater Systems** Sectors… in the continental and noncontinental United States and its territories, **including Guam**" | S17 | High |
| Near a control system | "In one confirmed compromise, Volt Typhoon actors **moved laterally to a control system and were positioned to move to a second control system**." | S17 | High |
| Default passwords | "observed testing access to domain-joint OT assets using **default OT vendor credentials**" | S17 | High |
| Co-authors | CISA, NSA, FBI, with DOE, EPA, TSA, Australia's ACSC, Canada's CCCS, UK NCSC, NZ NCSC | S17 | High |
| Wray | FBI Director Christopher Wray to the House China committee, **31 Jan 2024**: China's hackers are "positioning on American infrastructure in preparation to **wreak havoc and cause real-world harm** to American citizens and communities, if and when China decides the time has come to strike" | S18 | Medium-High ⚑ (read the FBI transcript) |
| A real US electric utility | **Littleton Electric Light & Water Departments (LELWD)**, Massachusetts. Volt Typhoon was inside from about **Feb 2023** and was found in **Nov 2023** after an FBI alert, so **>300 days**. Dragos case study published **Mar 2025**. Entry through an unpatched firewall run by a managed service provider. No disruption reported | S21 (Dragos via SecurityWeek and others) | Medium-High ⚑ (read the Dragos case study directly) |
| Still there (2026) ⏱ | Dragos annual report (**17 Feb 2026**): the group "continued to attack U.S. utilities through 2025 and remains active". Rob Lee: compromised sites in the US and NATO countries that "**we will never find**" | S19 (The Record, 19 Feb 2026); S20 | Medium-High (Lee on record) |
| A 2025 shift ⏱ | Dragos: in 2025 Volt Typhoon's operations "reflect a shift toward not only collecting and exfiltrating data from IT networks but also **directly interacting with OT network-connected devices and stealing sensor and operational data**" | S19 | Medium-High |
| China's position | China denies involvement | S19 | Medium. Include in the same chapter (playbook §5.2 rule 3). ⚑ Find a PRC MFA statement |

### 5b. Metcalf, 2013 (physical, not cyber)

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Date and site | **16 Apr 2013**, PG&E **Metcalf** substation (500 kV and 230 kV yards), near San Jose, California | S25 (PG&E incident report to the CPUC) | High |
| Sequence | "Approximately **thirty (30) minutes** before the fence was breached, **6 AT&T Fiber Optic lines** near the facility were cut." Intrusion alarm "at **1:37 AM**" | S25 | High |
| Damage | "In the 500kV yard, **ten (10) out of eleven (11)** single phase transformers had gunshot damage." In the 230 kV yard, "three (3) out of four (4) transformers banks" were hit, and "six (6) of the twelve (12) circuit breakers" damaged. "Property Damage: **$15,400,000**" | S25 | High |
| **No blackout** | "**No customer outages** or injuries were reported." | S25 | **High. Counter-intuitive** |
| Rounds fired, duration | "about 100–150 rounds", "19 minutes" | press, Wikipedia | Low ⚑. Don't use without a primary source |
| Unsolved | No arrests have been reported | — | ⚑ ⏱ Verify before saying "never caught" |

### 5c. 2025–2026 developments (⏱ all of them; re-check on publish day)

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| **Poland, 29 Dec 2025**: the attack | "coordinated attacks… targeted **numerous wind and solar farms**, a private company in the manufacturing sector, and a **combined heat and power (CHP) plant supplying heat to nearly half a million customers**". "All of the attacks were **purely destructive** in nature… compared to deliberate acts of **arson**." Weather: "this period coincided with **low temperatures and snowstorms**" | S22 (CERT Polska report, PDF dated 30 Jan 2026) | High |
| Poland: scale and result | "an attack targeted **at least 30 wind and solar farms**… resulted in a **loss of communication** between the facilities and distribution system operators… but it **did not affect ongoing electricity generation**". At the CHP plant "the EDR solution… **detected the malicious activity and blocked the attack**". Polish government: no blackout | S22; S23 | High |
| Poland: AI-written wiper | The "LazyWiper" script "was **likely generated largely by an LLM**". Another function "was likely generated using an LLM model" | S22 | High (CERT Polska's assessment). Hook-grade, but say "investigators believe" |
| Poland: attribution is **split** | CERT Polska: infrastructure overlaps with "**Static Tundra**" / Berserk Bear / Ghost Blizzard / Dragonfly (an FSB-linked cluster per Cisco), and "this is the first publicly described destructive activity attributed to this cluster". DynoWiper's similarity to Sandworm tools is "too low to attribute". **ESET**: Sandworm, **medium confidence**. **Dragos**: ELECTRUM (overlaps with Sandworm). PM Tusk: "groups directly linked to the Russian services" | S22; S23; S20 | High that it's contested. **Say "Russian-linked"**, not "Sandworm" (Contested C6) |
| **US: Iranian-affiliated PLC attacks** | Advisory **AA26-097A**, published **7 Apr 2026**, updated **22 Jul 2026** (FBI, CISA, NSA, EPA, DOE, CNMF, Treasury). Organisations "experienced disruptions through malicious interactions with PLC project files and the manipulation of data displayed on **HMI and SCADA displays**. In a few cases, this activity caused **operational disruption and financial loss**." Sectors include "**Energy**". Linked to CyberAv3ngers (IRGC-CEC) | S24 | High. Note it is PLC tampering across sectors, **not a grid blackout** |
| Dragos 2026 picture | KAMACITE "systematically mapped **control loops** across U.S. infrastructure throughout 2025". New group SYLVANITE "hands off established footholds to VOLTZITE". OT-capable ransomware groups up **49%** | S20 | Medium-High (vendor) |
| **Iberian blackout, 28 Apr 2025: NOT a hack** | Spanish government, **17 Jun 2025**: "there is **no evidence of cyber-incident or cyber-attack** as the cause". The ENTSO-E expert panel final report (**20 Mar 2026**) blames multiple factors centred on **voltage control / overvoltage** | S29; S30 | High for "no evidence of a cyberattack" (government). Medium for the ENTSO-E details ⚑ (read the report) |
| Southern Company data breach (Oct 2026) | ~400,000 Georgia Power / Alabama Power customer portal accounts accessed. **Customer data, not grid control** | press (SecurityWeek, AJC) | Low/Medium ⏱. Only mention it to say "most 'utility hacks' are this kind" |
| No new US cyber-blackout | I found **no confirmed case of a cyberattack causing a blackout in the US or Western Europe as of 12 Oct 2026** | negative search | ⏱ Re-check. Phrase it as "no publicly confirmed case" |

---

## 6. How a grid works (explainer beats)

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| Balance and frequency | "Failure to match generation to demand causes the frequency of an AC power system (nominally **60 cycles per second or 60 Hertz**) to **increase** (when generation exceeds demand) or **decrease** (when generation is less than demand)… large deviations in frequency can cause the rotational speed of generators to fluctuate, leading to vibrations that can damage generator turbine blades" | S26 (US-Canada Task Force, Apr 2004, ch.2) | High |
| 50 Hz | Continental Europe, including Ukraine since 16 Mar 2022, runs at **50 Hz**. North America runs at **60 Hz** | S26; S28 | High (standard). Caption: "Europe 50 Hz · N. America 60 Hz" |
| Supply = demand every moment | Same passage: the grid must continuously match generation to demand. VO: "every second, every power plant on the continent is matching what you're using" | S26 | High (paraphrase OK) |
| SCADA / HMI | SCADA = Supervisory Control and Data Acquisition. HMI = Human-Machine Interface, the operator screen with breaker icons. The 2015 attackers used "the HMIs in the SCADA environment to **open the breakers**" | S01 p.11 | High |
| RTU and serial-to-ethernet | Serial-to-ethernet converters "process commands sent from the SCADA network to the **substation control systems**" | S06; S01 | High |
| Breakers | Open breaker = no current flows. In 2015 opening them was enough. Re-closing them remotely was blocked by the bricked converters, so crews had to **drive out and close them by hand** | S01 p.12; S06 | High |
| Black start | NERC: a blackstart resource is a "generating unit(s)… which has the **ability to be started without support from the System**… with the ability to energize a bus" | S27 (FERC-NERC, May 2018, quoting the NERC Glossary) | High |
| Why restoring takes time | Restoration follows a "**cranking path**": the black-start unit powers a "next-start" unit, then islands are built and synchronised. Planners model "**cold load pickup**" (the inrush when everything switches back on at once). Most plans keep "at least two blackstart generating units per island" | S27 | High (mechanism). VO must not invent timings |
| Cascade speed (2003) | "within **seven minutes** the blackout rippled from the Cleveland-Akron area across much of the northeast United States and Canada. By 16:13 EDT, more than **508 generating units at 265 power plants** had been lost" | S26 | High |
| Physical destruction possible | **Aurora** test, Idaho National Laboratory, **2007**: digital commands wrecked a **2.25 MW** diesel generator | S07 | Medium-High (Greenberg). ⚑ Get the DHS/INL footage and its licence |

---

## 7. Human texture

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| End of shift | Prykarpattyaoblenergo operators "were nearing the end of their shift… one worker was organizing papers at his desk" | S06 | Medium-High (reconstruction). Label as "according to WIRED's reconstruction" |
| Helplessness | "All he could do was **stare helplessly at his screen** while the ghosts in the machine clicked open one breaker after another" | S06 | Medium-High. Quote briefly, with attribution |
| Engineers asking who's in control | In the video, "the engineers in the room **ask one another who's controlling it**" | S07 | Medium-High |
| "Phantom hands" | "before their eyes, **phantom hands** had clicked through dozens of breakers" | S07 | Medium-High |
| 2016: the night shift | Engineer **Oleg Zaychenko**, "four hours into his 12-hour night shift" in a "Soviet-era control room". Indicator lights flipped "**red to green, red to green. Eight, then 10, then 12**." The station cat, **Aza** | S07 | Medium-High. Named private individual: **first name or role only on screen** (playbook §5.2 rule 8) unless we get consent |
| 2016: the researcher's living room | **Oleksii Yasinsky** (ISSP) was watching Oliver Stone's ***Snowden*** when the power went out. His wife joked: "The hackers don't want us to finish the movie" | S07 | Medium-High. He's a public figure in the story (on record in WIRED and the book). Still check his time claim (Contested C3) |
| Temperature, 23 Dec 2015 (**sourced**) | **Unusually mild, not freezing.** NOAA GSOD daily means: **Kyiv-Zhuliany 7.4 °C** (max 10.2 °C). **Lviv 8.3 °C** (max 12.8 °C). **Chernivtsi 9.3 °C** (max 16.4 °C). Ivano-Frankivsk isn't in GSOD for 2015, but Lviv (~110 km) and Chernivtsi (~120 km) bracket it | S32 (our pull of NOAA NCEI data, 2026-10-12) | High (official station data). Our math: °C = (°F−32)×5/9. **Counter-intuitive** |
| Temperature, 17–18 Dec 2016 Kyiv (**sourced**) | GSOD Kyiv-Zhuliany: 17 Dec mean **−2.2 °C** (min −8.5 °C), 18 Dec mean **−2.4 °C**. ERA5 reanalysis for central Kyiv: **−1.9 °C at 23:00** on 17 Dec | S32; S33 | High. **Greenberg's "close to zero degrees Fahrenheit" (−18 °C) isn't supported** (Contested C2) |
| Poland 2025 weather | "low temperatures and snowstorms" | S22 | High |
| Ukraine 2022 grid gamble | On 24 Feb 2022, hours before the invasion, Ukrenergo cut Ukraine off from the Russian/Belarusian grid for a planned isolation test (**72 h** per IEEE Spectrum, **48 h** per S&P Global) and never reconnected. CEO Volodymyr Kudrytskyi called it a bold and risky gamble | S40 | Medium-High (the test length is contested, so say "a planned test of a few days") |

---

## 8. Background and scale

| Claim | Exact figure / quote | Source | Confidence |
|---|---|---|---|
| **2003 Northeast blackout: scale** | **14 Aug 2003**. "an estimated **50 million people** and **61,800 megawatts** (MW) of electric load" across 8 US states and Ontario. Began "a few minutes after **4:00 pm** EDT". Power "not restored for **4 days** in some parts of the United States". US cost "**between $4 billion and $10 billion**" | S26 | High |
| 2003: causes (no hacker) | "**FE's alarm and logging software failed**" at 14:14 EDT, and "Neither FE's control room operators nor FE's IT EMS support personnel were aware of the alarm failure". Lines tripped after "contacting **overgrown trees**" | S26 | High |
| 2003: explicitly not cyber | "further analysis… found **no evidence that malicious actors caused or contributed** to the power outage". Al-Qaeda claims were "not consistent with" the findings | S26 ch.9 | High. **Never imply 2003 was a hack** |
| 2003 vs Ukraine | Our math: 61,800 MW (2003) vs ~200 MW (Kyiv 2016) is **~300×** | S26, S07 | High (our math). Shows how small the hacks so far have been |
| **Stuxnet** | Iran "decommissioned and replaced about **1,000 IR-1 centrifuges**" at Natanz in late 2009 / early 2010. ISIS links this to Stuxnet as a **possibility**. Stuxnet "covertly changes the **frequencies** of certain types of frequency converters" (nominal **1,064 Hz**, pushed to **1,410 Hz**) | S31 (ISIS, 22 Dec 2010) | High for what ISIS says. **Medium for "Stuxnet destroyed 1,000 centrifuges"**, so keep ISIS's question form |
| Stuxnet attribution | Widely reported as a US–Israeli operation. **Never officially acknowledged** | press | Medium. "widely reported to be" |

---

## 9. Counter-intuitive facts for the hook and the 3:00 / 6:00 beats

Ranked by strength. All rest on High or Medium-High rows above.

1. **The malware didn't turn off the lights. People did.** E-ISAC/SANS: "neither BlackEnergy 3 nor KillDisk contained the required components to cause the outage." The attackers used the utilities' own control software against them (S01). *Hook / cold-open line.*
2. **The operators watched their own mouse cursor do it, and one filmed it.** A 56-second iPhone clip shows the cursor clicking breakers while the mouse on the desk "hasn't budged" (S07; Zetter S06). *Cold open.*
3. **They cut the power to the power company.** The attackers reprogrammed the backup power supplies, so the control rooms went dark too (S01, S02, S06).
4. **They jammed the phone lines so you couldn't even complain.** Thousands of fake calls flooded the call centre. E-ISAC thinks the point was to frustrate customers (S01). *3:00 re-hook.*
5. **Ukraine got its power back because its grid was old-fashioned.** Crews drove to substations and closed breakers by hand. Experts told WIRED many US systems lack that manual fallback (S06, S07, S01). *6:00 turn: "the more modern your grid, the worse this gets."*
6. **It wasn't a freezing night.** On 23 Dec 2015 western Ukraine was around +8 to +9 °C, with highs up to 16 °C in Chernivtsi (S32). Popular retellings imply bitter cold. *Use it as a myth-buster, or just avoid "freezing".*
7. **The 2016 attack was one hour long and probably a test run.** A single Kyiv substation lost ~200 MW, more than every 2015 substation combined (S07, S03). The malware spoke the grid's own protocols and needed no hacker at the keyboard (S10).
8. **NotPetya's most famous victim was saved by a blackout.** Maersk's only surviving domain controller was in Ghana, offline because of a power cut (S08). *Ties the episode together.*
9. **The worst blackout in North American history had no hacker in it.** 50 million people, from trees and a failed alarm program, cascading in seven minutes (S26). *Scale beat.*
10. **The most notorious attack on the US grid caused zero outages.** At Metcalf in 2013, rifles hit 10 of 11 big transformers and caused $15.4 M in damage, with "No customer outages" (S25).
11. **China's hackers aren't stealing secrets from the US grid; they're sitting in it.** The US government says Volt Typhoon's behaviour is "not consistent with traditional cyber espionage", with footholds of "at least five years" (S17). Dragos' CEO says some "we will never find" (S19). *6:00 escalation.*
12. **The hackers framed North Korea at the Olympics.** The indictment alleges Olympic Destroyer was written to mimic Lazarus Group code (S03).
13. **The GRU's wiper drew the Mr. Robot mask.** The indictment alleges KillDisk wrote "fS0cie7y" into memory and drew the fsociety mask on screen (S03).
14. **The newest grid-wiper was probably written with AI.** CERT Polska says the LazyWiper script used in the Dec 2025 Polish attack was "likely generated largely by an LLM" (S22). ⏱
15. **Ukraine unplugged from Russia's grid the morning Russia invaded,** for a test it was supposed to undo in days. Three weeks later it was running on Europe's (S40, S28).

---

## 10. Contested (say both versions or pick the safe one)

| # | Issue | Versions | What to say |
|---|---|---|---|
| C1 | **2015 headcount** | "~225,000 **customers**" (ICS-CERT, E-ISAC, DOJ) vs "more than **230,000 residents**" (Zetter) vs "nearly a quarter-million Ukrainians" (Greenberg). Customers are accounts, so people were probably more | "**About 225,000 customers**" on screen. "A quarter of a million" in VO only with "customers" |
| C2 | **Kyiv 2016 temperature** | Greenberg: "close to zero degrees Fahrenheit" (−18 °C) vs NOAA station and ERA5: about −2 °C that night (min −8.5 °C on 17 Dec) | Say "**below freezing**". Don't use the Fahrenheit line |
| C3 | **Kyiv 2016 date/time** | Dragos: 17 Dec, 23:53. Indictment: "on or about December 17". WIRED 2017 says "On **December 16**, 2016" while also calling it a "Saturday night" (17 Dec 2016 was a Saturday; 16 Dec was a Friday). Yasinsky's clock read 00:00 when *his* building went dark | Use **17 December, just before midnight**. Don't use "December 16" |
| C4 | **NotPetya damage** | Official White House statement: "**billions**". WIRED/Bossert: "more than **$10 billion**", a White House assessment confirmed to WIRED. Indictment: nearly **$1B** for three named US victims only | "A White House assessment, reported by WIRED, put the total at **more than ten billion dollars**." Caption: "$10B+ · White House assessment via WIRED, 2018". **Not red-line** (it's a reported figure, not a published document) |
| C5 | **Substations in 2015** | "at least 27" (E-ISAC, probably low) vs "about 30" at one company, nearly doubled overall (Zetter) vs "50-plus distribution stations" (Greenberg) vs "dozens" (DOJ) | "**Dozens of substations**" |
| C6 | **Poland 2025 attribution** | CERT Polska: Static Tundra/Berserk Bear (FSB-linked per Cisco). ESET: Sandworm (medium). Dragos: ELECTRUM ≈ Sandworm. Tusk: Russian services | "**Russian-linked hackers**. Investigators disagree on which unit." |
| C7 | **Industroyer2: thwarted or partial?** | ESET/CERT-UA: prevented, no outage. A leaked-document report claims nine substations were briefly shut (press, unverified) | "Ukraine and ESET say it was **stopped before it cut power**." Don't mention the leak claim, or label it unverified |
| C8 | **The "first" grid hack** | 2015 Ukraine is the first *publicly confirmed* cyber-caused blackout (Zetter: "the first confirmed hack to take down a power grid"). Earlier rumours of hacker blackouts exist, but I didn't source any of them in this pass, and none is confirmed | "the first **publicly confirmed**" |
| C9 | **2015 phone flood "from Moscow"** | Zetter only. Spoofing is possible | Skip, or "calls that appeared to come from Russia, according to WIRED" |
| C10 | **2016 restoration** | "about an hour" (DOJ, Greenberg) vs "30 minutes" by manual procedure, full restoration in just over an hour (Kovalchuk via press) | "**About an hour**" |
| C11 | **Ukraine isolation test, Feb 2022** | 72 h (IEEE Spectrum) vs 48 h (S&P Global) vs three days (pv magazine) | "a planned test of a few days" |

---

## 11. Do not claim

- **Don't say "225,000 people".** It's customers (C1).
- **Don't say "the White House said NotPetya cost $10 billion"** as if it were the official statement. The statement says "billions" (C4).
- **Don't say "Russia did it"** for 2015/2016 as settled fact in your own voice. Say "US prosecutors allege… the GRU unit known as Sandworm"; "the US government attributes…". Russia denies it.
- **Don't say "the six hackers"** as if convicted. Say "six officers charged". No faces with red annotations (playbook §5.2 rule 11). FBI wanted-poster images can be shown neutrally, with the label "charged, not convicted" ⚑ (licence and context check).
- **Don't say 2003 was a cyberattack** or "could have been a hack". The Task Force found "no evidence".
- **Don't say the Iberian blackout (Apr 2025) was a cyberattack.** The Spanish government found "no evidence".
- **Don't say Metcalf caused a blackout.** The PG&E report says "No customer outages".
- **Don't say Volt Typhoon "has turned off" or "can turn off" US power.** CISA says it is "pre-positioning" to "enable" disruption. It moved to the edge of control systems in one case. No outage is attributed to it.
- **Don't say Industroyer2 caused an outage** (C7).
- **Don't say "Stuxnet destroyed 1,000 centrifuges"** as fact. ISIS asked whether it did.
- **Don't say "it was freezing"** for 23 Dec 2015 (S32). Don't use "zero degrees Fahrenheit" for 2016 (C2).
- **Don't say the Oct 2022 outage was "timed with" the missile strikes.** Mandiant says it "coincided".
- **Don't call the Polish attackers "Sandworm"** flatly (C6).
- **Don't say the US grid "has no manual backup".** That's an expert generalisation reported in 2016 (S06), so attribute it and date it.
- **Don't show the 56-second phantom-mouse video** unless we have the original, its provenance and a licence. A labelled reconstruction is fine (playbook §3).
- **Don't name or show Oleg Zaychenko's face** without consent. Use "a young engineer on the night shift".
- **Don't say "first ever cyberattack to cause physical damage" for Ukraine.** That's usually said of Stuxnet. Ukraine 2015 is the first confirmed *blackout*.
- **Don't quote Demers** until the DOJ transcript is read (⚑ S05).

---

## 12. Open items (⚑) before script lock

1. Read ICS-CERT IR-ALERT-H-16-056-01 directly (cisa.gov blocked here) and confirm the "multiple external humans" wording (S02).
2. Read the DOJ press release (S04) and Demers remarks (S05): count number, the "maliciously and irresponsibly" line, the "at large" status.
3. Find a tier 1–5 source naming **Chernivtsioblenergo** (Greenberg's *Sandworm*, ch. on 2015; or a Ukrainian Energy Ministry statement).
4. Find Ukrenergo's or ISSP's own statement naming **Pivnichna** and the MW lost, and read Reuters (Dec 2016) directly for the "fifth of night-time consumption" line.
5. Read CERT-UA article 39518 for the exact "prevented" wording and the February 2022 compromise date.
6. Read the Dragos LELWD case study (Mar 2025) directly.
7. Get the Rewards for Justice page (exact announcement date; whether the offer is still listed) ⏱.
8. Pull Merck's and FedEx's 10-K NotPetya figures if any are shown on screen.
9. Russia's response to the indictment and China's response to Volt Typhoon: find an official statement (embassy or MFA) to quote in the same chapter.
10. Metcalf: confirm "no arrests" status ⏱, and find a primary source for rounds fired, if we want that number.
11. Read the ENTSO-E Iberian final report (20 Mar 2026) if the Spain myth-buster stays in.
12. Wayback-save every URL in SOURCES.md (playbook §8.3). None were saved in this session.
13. Re-run the 2026 sweep (Volt Typhoon, Iran AA26-097A, Poland follow-up, any new grid outage) on VO-lock day ⏱.
