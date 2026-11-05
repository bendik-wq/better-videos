# Packaging: Episode 10, Notre-Dame fire (15 April 2019)
Chosen by the ep10 topic-packaging workflow (scouts → topic ranking → 3 packaged finalists → adversarial critics → final judge, 2026-11-05). Format: FULLY ANIMATED, "Paper & Spring" (docs/library/animation-study/STYLE-BIBLE.md), 12–16 min.

## Decision
- **Title:** Notre-Dame Was 30 Minutes From Collapse (39 chars)
- **A/B title (Test & Compare, title-only, thumb A fixed):** B = Notre-Dame Came Down to 8 Bells and 30 Minutes · C = Notre-Dame's Alarm Worked. They Went to the Wrong Attic (55 chars, the mechanism door)
- **Lead thumbnail:** "IF THEY FALL": folded-card twin-tower façade with a red bell slipping off a burning beam (spec below)

### Why
The deciding score is EXPECTED VIEWS × FULL-WATCH RETENTION. Notre-Dame comes first on both, and it is the only finalist whose fatal flags can all be fixed by wording.

1) EXPECTED VIEWS. Notre-Dame is the most widely watched household image in the set: billions saw the spire fall live. The door (the wrong attic, the bell-frame clock, the 15–30 minute margin) has proven mass demand. The Spanish architect explainer "¿Por qué no se cayó Notre-Dame?" has 5.33M views, and Le Monde's "Comment l'effondrement total… a été évité" has 614K. The English animated lane is still empty: the best English explainer is Engineering The Impossible at 370K, and the only animation is a countryball video at 890K. A re-check with yt-dlp on 2026-11-05 ("…saved north tower bells") found only news clips under 12K.
- **D-Day** has the bigger name, but no video on the weather door has passed about 250K (History Hit 236K, The Operations Room 177K). Its packaging also had three G1 problems (the hook proof didn't match its claim, the "Timed by" title overstated causation, and the German-side "blind" claim is contradicted by Persson 2020). 5–20M would depend on the D-Day name alone.
- **Copenhagen polio** has the best category (body/health) and an open lane, but low name pull. "Iron lung" search now resolves to the 2026 Markiplier film, and the lead thumbnail number (165,000 h) rests on "one report".

2) RETENTION AND CLIMAX COUNT. After the critic's fix, Notre-Dame has 11 PHYSICAL peaks (list below), with a reset clock in the middle: the roof is lost, then a NEW 20–30 minute clock starts on the north tower. That second clock is what holds viewers past the midpoint, where most explainers sag. D-Day passes 8 only just, and polio front-loads its emotional peak at about 6:15 and spends the second half on ledger beats.

3) PACKAGING. "Notre-Dame Was 30 Minutes From Collapse" puts the famous name first, gives a verdict and a clock, and survives any mobile cut. It passes the "yeah, sure… from what?" test that "Had 30 Minutes Left" failed, and it is paid on screen by 0:30 with the Nuñez quote card. The thumbnail adds the mechanism (the bells) and the stake (IF THEY FALL) without repeating the title.

4) FACT SAFETY. The fire is closed history with a tier-1 reconstruction (NYT, 16 Jul 2019), prosecutor timelines and AFP. Nobody needs to be blamed: the fault is framed as system design. The cause is still undetermined as of Nov 2026 (re-checked; no charges, accidental origin favoured), and we say so on screen.

5) ANIMATION FIT. A folded-card cathedral, a matchstick "forest" roof, a brass bell-frame hero, counter wheels for both half-hours, and a domino chain of bells, tower and tower. Every peak is a paper mechanism we can build. Don't use a sectioned real building (Jared Owen ban): the bell frame is always a separate paper toy.

6) LANE. Heritage disaster / firefight thriller is new after the AI, geopolitics, money and Cold War episodes, and it isn't a WWII repeat.

What we lose: no news peg, so the video has to be evergreen and win on Browse. The 15 Apr 2027 anniversary (8 years) is the natural re-push date. The Pathé film "Notre-Dame brûle" (Annaud, 2022) already dramatises the wrong attic and the tower climb, so we stay on mechanism and numbers and use none of its scenes or framing. Realistic base: 2–4× the channel median at 28 days. The 5M+ ceiling is reachable only if the bell-clock sequence (8:00–11:00) holds retention.

## Titles shortlist (critic-adjusted scores, /10)
| # | Title | Score | Note |
|---|---|---|---|
| 1 | Notre-Dame Was 30 Minutes From Collapse | 9.5 | LEAD. Needs the 0:25 Nuñez range card or it's fatal |
| 2 | Notre-Dame Came Down to 8 Bells and 30 Minutes | 9 | Test B: two proof cues |
| 3 | Notre-Dame's Alarm Worked. They Went to the Wrong Attic | 8.5 | Test C: mechanism door, exactly 55 chars |
| 4 | Notre-Dame's Fire Alarm Had Two Attics in It | 8.5 | Reserve for day-30 repackage |
| 5 | The 8 Bells That Almost Brought Down Notre-Dame | 7.5 | Downgraded: the frame was the danger, not the bells |
| 6 | The Night Notre-Dame Almost Lost Both Towers | 7.5 | |
| 7 | Notre-Dame's North Tower Had 30 Minutes | 7.5 | |
| 8 | Notre-Dame Lost Its Roof. It Nearly Lost Everything | 6.5 | |
| — | Notre-Dame Had 30 Minutes Left | 7 | Replaced by #1 ("left before what?") |
| — | The Spire Fell. The Bells Were Worse. | killed | Suggests the bells did the damage (G1) |
| — | Why Notre-Dame Didn't Fall | killed | Collides with the 5.3M Spanish video and college-football search results |
| — | Notre-Dame Burned 30 Minutes Before Anyone Called / "Nobody Came" variants | killed | False: the guard phoned his superior |

## Thumbnails (Paper & Spring, ≤3 words)
1. **LEAD: "IF THEY FALL"**
- Folded-card Notre-Dame twin-tower façade fills the right 60%. It has to be instantly readable as Notre-Dame at 168 px, because the famous name is half the click.
- Orange paper glow and a gap where the spire stood.
- The north tower is opened like a paper toy (not a sectioned real building) to show the wooden bell frame: lower beam charred and cracked, one RED bell slipping off its pin mid-fall. It is the only red on the card and has a dashed ring for colour-blind viewers. The south tower leans slightly for the domino stake.
- Text in Inter 900 ink in the left 40%. Coil badge top-left.
- Ground: kraft #dcd7c8 inside a 14 px teal-shade #1d6662 border. **Gate:** measure with projects/paper-lab/check.py. If the edge is below ΔL 0.25 in either feed, use a full teal-shade ground (STYLE-BIBLE §15.3).
2. **CHALLENGER: "WRONG ATTIC"**
- A punched-card alarm ticket printed 'ATTIC NAVE SACRISTY', with SACRISTY circled in red.
- Two card attics like slots on a sorting board: the empty sacristy one gets an ink "OK" tick, the other sprouts brass flames, and a pen line runs from the ticket into the wrong slot.
- Never pair with title C (it would repeat the words). Use the zone string only after it is confirmed against the NYT original.
3. **DAY-30 / ALT: "+30 MIN"** (replaces the false "NOBODY CALLED")
- Two counter wheels, the left at 18:18 with a FEU flap.
- A stretched paper mainspring between them carries the "+30" tag.
- A small card cathedral sits below with flame roofline and a bent spire.
- Print no exact brigade-call time (18:48 vs 18:51 is unresolved).

## Hook (locked draft, ≤80 spoken words)
[card: 15 APR 2019 · 18:18 · PARIS] "Monday, 6:18 p.m. Inside Notre-Dame, a screen flashes one word: FEU. Fire. [panel line redrawn; source card NYT 16 Jul 2019] The alarm worked. It even named the zone. So why did the fire brigade get the call about half an hour later? Because that zone had two attics in it. [beat] Then, after the spire fell, a second clock started, on eight bells hanging from a burning oak frame. [quote card: Laurent Nuñez, deputy interior minister: 'it all came down to 15–30 minutes'] Officials said it came down to fifteen to thirty minutes. So who climbed into that tower, and why is Notre-Dame still standing?" (~78 words. Two numbers to remember: half an hour, 15–30 minutes. Use "named the zone" until the exact zone string and code are confirmed.)

End line: "The bells that hung over the collapse are the ones that rang it open."

## Peaks (11 physical; paperwork beats demoted to connective tissue)
- 0:00–0:32 HOOK. Connective (not counted): 1:00 the panel flashes FEU, staffed by an employee three days into the job on a double shift; 2:00 the guard checks the sacristy attic and finds nothing, and the system never calls the brigade itself; 4:30 the brigade call.
1. ~3:15 **The forest is burning.** The 18:43 second alarm sends the guard up ~300 steps into the 13th-century oak frame, which is already ablaze. Counter at ~25 min.
2. ~5:00 **Driven back.** First crews (~19:00/19:05, after Paris traffic) reach the roof and are pushed out by heat and molten lead from hundreds of tonnes of roofing.
3. ~6:00 **Water.** Hydrant pressure isn't enough and lines are pumped from the Seine (verify).
4. ~7:00 **The spire falls** (~19:50, 96 m) through the vault on live TV. Macron's speech was shelved at 19:44. Sponsor return line: "The spire was not what nearly brought it down."
5. ~7:45 **Other side: why not drop water from the air?** The public demand (Trump tweet, 15 Apr). The Sécurité civile said water dropped from aircraft could collapse the structure and the towers. The refusal is itself a climax.
6. ~8:30 **New clock.** Fire reaches the north tower's wooden bell frame. Eight bells (780 kg to 4 t) form a domino chain: frame → bells → north tower → south tower (13 t Emmanuel). Gallet gives up the roof (~20:30) to save the towers: "In 20 minutes I'll know" (NYT) / "half an hour" (AFP), via Ariel Weil. A new spring winds down.
7. ~9:30 **About 20 firefighters go back in**, up the south tower and across into the burning north tower at bell height. Held silence on the counter.
8. ~10:15 **The robot.** The Colossus robot goes into the nave where people can't stand, and cools the structure from inside (verify the role).
9. ~10:45 **"She is saved."** North-tower flames under control by ~21:45. Show the 15–30 min margin as an officials' estimate, not a measurement.
10. ~11:45 **The vault holds.** Holed at the crossing and in parts of the nave and transept, the stone vault still catches most of the burning roof (soften if no engineering source).
11. ~12:30 **The days after.** The north transept gable and the weakened vault are still at risk and are shored up with wooden braces (verify). The dented copper rooster is found in the rubble; the Crown of Thorns had already been carried out by the human chain with the chaplain. No deaths.
- 13:30 CODA (connective): cause undetermined. The bells come down (2023), are restored, blessed and rehung (Sept 2024), and ring for the reopening on 7 Dec 2024.

## Proof beats
- 0:05 Panel line redrawn with FEU flap. Source card: NYT, "Notre-Dame Came Far Closer to Collapsing Than People Knew", 16 Jul 2019. Label the zone code "zone code" unless confirmed.
- 0:25 Nuñez quote card with the range, named and dated (16 Apr 2019). **Mandatory: without it, the title is fatal.**
- 1:00 / 3:15 Prosecutor Rémy Heitz alarm times card, with candor: "sources give 18:18 or 18:20; second alarm 18:43."
- 4:30 Spring-tag ledger: 18:48 (NYT) / 18:51 (AFP), shown as "about 30 minutes" with both sources named.
- 7:00 96 m spire beside tally blocks, plus the 19:44 shelved-speech card (AFP).
- 7:45 Sécurité civile response card (tweet, 15 Apr 2019).
- 8:30 Bell-weight tally (780 kg … 4 t; Emmanuel 13 t) and the four-step domino diagram. Gallet quote shown as both NYT and AFP versions.
- 9:30 Count card: ~20 firefighters inside out of ~600 mobilised (AFP).
- 12:30 Rooster redrawn from the 16 Apr 2019 photo reference, plus the relic tag.
- 13:30 Candor card: "Cause: undetermined. Accident favoured. Electrical fault or cigarette: never proved." Date flaps Sept 2024 / 7 Dec 2024.

## Verified facts (with sources)
- First alarm signal 18:18, 15 Apr 2019. The panel showed fire and the zone "Attic Nave Sacristy". New employee on a double shift. *NYT reconstruction (syndicated, NZ Herald); AFP via artdaily.com/news/117501*
- A guard was sent to the attic of the adjoining sacristy and found nothing. *NYT; Britannica "Notre-Dame fire"; Wikipedia*
- The prosecutor gives alarms at 18:20 and 18:43; the second located the fire. *Rémy Heitz, via Telegraph/Yahoo; Armenpress*
- The system did not alert the brigade automatically. Call at 18:48 (NYT, "about 30 minutes after the first signal") or 18:51 (AFP/Wikipedia). First crews arrived just before 19:00 (NYT) or at 19:05 (AFP).
- Spire (~96 m) collapsed ~19:50. Macron's 20:00 address was shelved at 19:44. *AFP; Wikipedia; NYT*
- Gallet abandoned the roof to save the towers. "In 20 minutes, I'll know if we've lost it" (NYT) / "half an hour" (AFP), both via mayor Ariel Weil.
- About 20 firefighters went into the north tower; ~600 were mobilised overnight. *AFP; OSV/Catholic Review*
- The north tower held 8 bells (780 kg–4 t) in a wooden frame; the south tower holds Emmanuel (~13 t). The chain-collapse risk was reported. *AFP; NYT; Wikipedia*
- North-tower fire under control ~21:45; the whole fire under control shortly before 03:30. *NYT; Wikipedia; AFP*
- Margin: Nuñez, "it all came down to 15–30 minutes"; the fire chief said within 30 minutes. *Guardian; Church Times 18 Apr 2019*
- No deaths; 3 injured. *Wikipedia; Britannica*
- The Crown of Thorns was saved, with chaplain Fr Jean-Marc Fournier, and a human chain carried objects out. *OSV/Catholic Review; Wikipedia*
- The copper rooster was found damaged on 16 Apr 2019. *CNA/Catholic World Report 17 Apr 2019*
- Cause undetermined; no criminal act found (June 2019); electrical fault or cigarette are the hypotheses; no one charged. Re-checked 2026-11-05: no newer development found. *Paris prosecutor via Courthouse News/SBS; Taipei Times/AFP Nov 2024*
- Bells removed July 2023, blessed and rehung Sept 2024; cathedral reopened 7 Dec 2024. *The Local/AFP 12 Sep 2024; Connexion; Wikipedia*

## Research must still verify (before script lock)
1. The NYT original (or the operator/brigade report) for the exact panel wording "ATTIC NAVE SACRISTY" and code ZDA-110-3-15-1. Until then say "named the zone".
2. The exact Nuñez quote and its wording ("15 to 30 minutes" from collapse / complete destruction). This is the title's legal footing.
3. Time conflicts: 18:18 vs 18:20, 18:48 vs 18:51, before 19:00 vs 19:05. Never say "33 minutes"; say "about half an hour".
4. The route of the ~20 firefighters (south-tower stairs into the north tower) and whether to name an officer. Use BSPP or NYT original only.
5. Water supply: hydrant pressure and pumping from the Seine (BSPP video, CTIF report).
6. Sécurité civile's air-drop response wording and date.
7. Colossus robot: when it went in and what it did (Shark Robotics / BSPP).
8. Post-fire shoring of the north transept gable and the vault, and the dates (Établissement public / chief architect Philippe Villeneuve).
9. Vault "caught most of the roof": find an engineering source or soften the line.
10. Lead tonnage (210 t AFP vs 400–460 t): say "hundreds of tonnes". Treat "~1,300 oaks" as "about", or find a DRAC source.
11. Rooster relics "recovered": find a diocese or Culture Ministry source.
12. Thumbnail edge ΔL ≥ 0.25 in both feeds (check.py).

## Risks
- **Proof vs claim on the title:** "30 minutes" is an estimate from three officials with different numbers. Keep it as a named range on screen, never a measurement.
- **Wording:** the danger was the burning oak frame holding the bells, not the bells. Never say "the bells nearly brought it down". Say "after the spire fell", not "hours later".
- **Blame/privacy (G6):** don't name the console operator or the guard. Frame the failure as system design.
- **Saturation/collision:** the Pathé film, the NYT multimedia piece and Le Monde's video cover the same door. Lead with the clock and the bells, not the architecture. "Notre Dame" also returns football results, so put "fire / spire / bells" in description line 1.
- **Look bans:** no sectioned real-building cutaway (README §6.4), no photo stills, no other creators' characters or formulas.
- **Tone:** sacred site with no deaths. Humour is limited to props; no levity around injured responders.

## Runners-up
1. **D-Day, 6 June 1944: the forecast between two storms** (critic 71). Best repackage: "D-Day's Backup Date Had the Worst Weather in 20 Years" + drowned-flap "ONE GAP" thumbnail. To ship it later:
- Swap the hook proof for RMetS "first alerted the Allies".
- Drop the blank-Atlantic claim (Persson 2020).
- Add the University of Reading 2026 AI re-forecast peg.
- Leave out "sent its generals home".
2. **Copenhagen 1952: the polio summer that invented intensive care** (critic 72). Best repackage: "How a Rubber Bag Beat the Iron Lung" + matchup thumbnail with "70 AT ONCE". To ship it later:
- Fix hook slot 3 (the hospital WAS short of machines).
- Keep 165,000 h off the thumbnail until Wunsch or Lassen 1956 confirms it.
- Add physical crises after 8:15.
- Make the thumbnail read as history, not the horror film.
3. Reserve: **Pearl Harbor radar / late warnings** (topic 82) if both WWII and heritage lanes are needed later. **Gunpowder Plot** held for 5 Nov 2027.
