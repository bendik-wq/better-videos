# The Hackers Who Can Turn Off the Lights: narration v1

**Structure:** cold-case reconstruction. A single object (the cursor) carries the whole video, and the story escalates from one afternoon in 2015 to "they are already inside" in 2026.

**Look:** LIVE WIRE (STYLE.md). Light is power, so when the grid dies in the story, the light dies in the frame.

**Length:** about 13 min at Kokoro, roughly 1,950 words.

**Re-hooks:** `[↺]` marks one; there is one every ≤35 s.

**Loops:**
- **L1:** the malware couldn't turn off the lights, so what did?
- **L2:** how did Ukraine get its power back, and could anyone else?
- **L3:** where are they now?

**Markup:**
- `*word*` is stressed.
- `> ` is a slower line.
- `|` is a beat.

**Fact rules:**
- Every fact is in RESEARCH.md.
- Say "customers", never "people", for 2015.
- Attribution is always "prosecutors allege" or "the US government says".
- ⏱ marks a live fact. Re-check it on publish day.

---

## COLD OPEN (0:00–1:20): the oner, then stakes

*(The orbit → snow → window → shoulder → monitor oner plays almost silent. Room tone, a fluorescent hum and the 50 Hz heartbeat. The VO comes in only at the window.)*

1. > Twenty-third of December, twenty fifteen. | Western Ukraine. | Just after half past three in the afternoon.
2. In a regional power control room, an operator is near the end of his shift.
3. His hand is resting next to his mouse. | It isn't touching it.
4. > And the cursor on his screen *starts to move.* [↺]
5. It glides across the map of the grid. Finds a substation. | Clicks.
6. A breaker opens. | Somewhere outside, a town goes dark.

*(The breaker clunks, then black and silence for 0.8 s. Cut to orbit: the region's lights go out district by district.)*

7. Then it finds the next one. | And the next. [↺]
8. That afternoon, across three power companies, someone switched off the electricity to about two hundred and twenty-five thousand customers.
9. And here's the part that took investigators months to accept.
10. > The malicious software they found on those machines *couldn't* have done it. **(opens L1)** [↺]
11. It was the first publicly confirmed blackout caused by hackers. | It was not the last.
12. And the people the US government says were behind it are, according to American intelligence, not the only ones who have learned how. **(opens L3)**

**TITLE: THE HACKERS WHO CAN TURN OFF THE LIGHTS**
*(CRT collapse into the title. The 50 Hz trace draws the letters.)*

## 1. THE AFTERNOON (1:20–4:10)
13. To understand what happened in that room, you need to know one thing about electricity.
14. It can't be stored on the grid. | Not in any useful amount. [↺]
15. Every second, every power plant on the continent is producing almost exactly what everyone is using, right now. Too little and the grid's heartbeat slows. Too much and it speeds up.
16. In Europe, that heartbeat is fifty cycles a second. *(The scope trace locks to 50 Hz.)*
17. Keeping it steady is the job of rooms like this one. Screens with a one-line map of the grid. Every substation a box. Every breaker a switch you can open with a click. [↺]
18. Which means if you control the screen, | you control the switch.
19. The attack didn't start in December. It started in the spring.
20. Prosecutors allege the attackers sent emails to the power companies' IT staff and system administrators. The attachments were ordinary Office documents with a macro hidden inside. [↺]
21. There was no clever exploit. Investigators found no exploit code at all. Someone just had to click "enable."
22. Inside, the attackers spent months learning the network. They found the remote connections that led from the office computers into the control systems.
23. Those connections didn't require a second password. [↺]
24. So by the twenty-third of December, they didn't need to break anything. | They could simply log in.
25. And that's the answer to our first question. **(closes L1)**
26. A joint report by the North American grid's security centre and SANS put it plainly. The malware "did not contain the required components to cause the outage."
27. > The outage was caused by *people.* Sitting at a keyboard. Using the power company's own software. [↺]
28. At one company, they took over operators' computers through an IT help-desk tool. That's how the cursor moved by itself.
29. Later, the company's technical director showed a reporter from WIRED a fifty-six-second video he had filmed on his phone. The cursor clicks through the grid. The mouse on the desk, he said, hasn't budged.
30. In the room, the engineers asked each other who was controlling it. [↺]
31. At another company, the attackers didn't bother with the mouse. They ran their own copy of the control software from a computer somewhere else.
32. Two techniques. | Three companies. | All within thirty minutes.
33. And opening the breakers was only the beginning. [↺]

## 2. THE SECOND STRIKE (4:10–6:30)
34. When the lights go out, a power company does three things. It answers the phones. It keeps its own control room running on backup power. And it sends the command to switch everything back on.
35. The attackers had planned for all three. [↺]
36. First, the phones. Thousands of fake calls flooded the call centres, so customers trying to report the outage couldn't get through.
37. Second, the backup power. They had reconfigured the emergency power supplies. So when the city went dark, | some of the control rooms went dark too. [↺]
38. > They cut the power to the *power company.*
39. Third, the switches. Out in the substations, the converters that carry commands from the control room had their software overwritten. They were bricked. Investigators called it "blowing the bridges."
40. Even if the operators got their screens back, they could no longer reach the breakers. [↺]
41. Then, about ninety minutes in, according to one investigator, a wiper program started erasing the computers themselves.
42. So how did Ukraine get its power back? **(opens L2)**
43. > The old way. | People got in trucks. [↺]
44. Crews drove out to the substations and closed the breakers by hand. Within one to six hours, depending on where you lived, the lights came back.
45. Months later, some of those companies were still running parts of their grid by hand.
46. Remember that. It's the most important detail in this story. [↺]
47. One year later, it happened again. Seventeenth of December, twenty sixteen. Just before midnight. This time in the capital, Kyiv. Below freezing.
48. A single transmission substation north of the city switched off. About two hundred megawatts. Roughly a fifth of the city's night-time demand.
49. More electrical load than every substation hit the year before, combined. [↺]
50. And this time, nobody needed to be at the keyboard.
51. The malware, later named Industroyer, spoke the grid's own languages. The same protocols the real equipment uses to talk. It was built to open breakers by itself, on a schedule.
52. One researcher told WIRED: "In twenty fifteen they were like a group of brutal street fighters. In twenty sixteen, they were ninjas." [↺]
53. The lights were back in about an hour.
54. Which raised an uncomfortable question. | If it was that easy, why was it so short?
55. Many researchers believe it was a test. [↺]

## 3. THE TOWER (6:30–8:50)
56. In October twenty twenty, the US Justice Department unsealed an indictment.
57. It charges six officers of Russian military intelligence, the GRU. Unit seven four four five five. Prosecutors say it works out of a building in a Moscow suburb that the GRU itself calls "the Tower." [↺]
58. Security researchers have another name for them. Sandworm.
59. The indictment alleges they were behind both Ukrainian blackouts. Russia denies it, and none of the six has ever stood trial.
60. But according to prosecutors, the grid was only their warm-up. [↺]
61. In June twenty seventeen, the eve of a Ukrainian national holiday, a routine update for a popular Ukrainian accounting program carried something else.
62. It looked like ransomware. It asked for three hundred dollars in Bitcoin. But the indictment says even if you paid, | your files were never coming back. [↺]
63. It was called NotPetya. It escaped Ukraine within hours.
64. It hit hospitals in Pennsylvania. The pharmaceutical giant Merck. FedEx's European arm. The world's largest shipping company, Maersk.
65. A White House assessment, reported by WIRED, put the damage at more than ten billion dollars. [↺]
66. Maersk lost almost its entire network. Every copy of the master record of its users had been wiped. | Except one.
67. > In an office in Ghana, one server had been knocked offline before the worm arrived. | By a *power cut.* [↺]
68. A blackout saved the company.
69. The indictment goes on. It alleges the same unit attacked the opening ceremony of the twenty eighteen Winter Olympics in South Korea, and disguised its code to look like it came from North Korea.
70. And when Russia invaded Ukraine in twenty twenty-two, investigators found Industroyer again. [↺]
71. A new version, set to cut power to high-voltage substations at ten past seven on a Friday evening in April.
72. Ukraine and the security firm ESET say it was stopped before it cut power.
73. That October, it wasn't. Investigators at Mandiant say Sandworm tripped substation breakers on the same days Russian missiles were striking power infrastructure across Ukraine. [↺]
74. They didn't even need custom malware this time. | They used the grid's own control software. Again.

## 4. THE GRID (8:50–10:50)
75. So could it happen somewhere else?
76. Consider what a big blackout actually looks like.
77. On the fourteenth of August, two thousand and three, about fifty million people across the north-eastern United States and Canada lost power. [↺]
78. There was no hacker. Investigators found an alarm program in one Ohio control room that had silently failed. And power lines that sagged into trees.
79. From the first lines tripping near Cleveland, the cascade swept across the Northeast and Canada in about seven minutes. In some places, it took four days to come back. [↺]
80. Turning a grid back on is far harder than turning it off.
81. Power plants need power to start. So restoration begins with a few special plants that can start on their own, and builds outward, island by island. Switch everything on at once and the surge can trip it all again.
82. Now go back to Ukraine. [↺]
83. And here's the answer to our second question. **(closes L2)**
84. Ukraine got its lights back because its grid was old enough to run by hand. Crews who knew the equipment. Breakers you can close with your own arm.
85. In twenty sixteen, experts told WIRED that many American systems would not have that fallback. [↺]
86. > The more automated the grid, | the harder it is to take back by hand.
87. And the scale is not yet the scary part. Kyiv in twenty sixteen was about two hundred megawatts. The twenty-oh-three blackout was about three hundred times that.
88. So far, every confirmed cyber blackout has been small, short, and in Ukraine. [↺]
89. The question is whether anyone is preparing for something bigger.

## 5. ALREADY INSIDE (10:50–12:50)
90. In February twenty twenty-four, the NSA, the FBI and America's cyber-defence agency published a warning with a sentence that's worth reading slowly. **(opens the L3 payoff)**
91. Chinese state-sponsored hackers, it says, are "seeking to pre-position themselves" in US critical infrastructure, "for disruptive or destructive cyberattacks" in a major crisis or conflict. [↺]
92. They called the group Volt Typhoon. And they said its behaviour was "not consistent with traditional cyber espionage."
93. In other words, | they're not stealing secrets. | They're *waiting.*
94. The agencies said some of those footholds had been there for at least five years. In one case, the hackers had moved to a control system and were positioned to reach a second one. [↺]
95. China denies any involvement.
96. One victim has been named. A small town utility in Littleton, Massachusetts. Investigators say the hackers were inside for more than three hundred days before the FBI warned them.
97. They didn't turn anything off. | That wasn't the point. [↺]
98. This year, the head of the industrial security firm Dragos said Volt Typhoon is still active, and that there are compromised sites "we will never find." ⏱
99. And the attacks are changing. On the twenty-ninth of December, twenty twenty-five, during snowstorms, Russian-linked hackers attacked dozens of wind and solar farms in Poland, and a plant heating homes for nearly half a million customers. [↺]
100. It failed. No blackout. Investigators disagree on exactly which Russian unit did it.
101. But Poland's cyber-response team noticed something about one of the wiping programs. It was "likely generated largely by an LLM."
102. > An AI wrote part of the weapon. ⏱ [↺]

## 6. THE CURSOR (12:50–13:20)
103. As of today, there is no publicly confirmed case of hackers turning off the power in the United States or Western Europe. ⏱
104. The operators in Ukraine had one advantage nobody likes to talk about. | They saw it happen.
105. A cursor moved, and a man watched it move. [↺]
106. Volt Typhoon was built so that nobody sees anything at all. | Until the moment it's used.
107. > And by then, | the lights are already going out.

*(The scope trace flatlines. CRT collapse to a dot. Hold the dot for 1 s, then it goes out. END CARD.)*

---
⚑ **Before VO lock:**
- Line 26: quote S01 exactly: "neither BlackEnergy 3 nor KillDisk contained the required components to cause the outage". The VO paraphrase "the malware…" should be shown with the full quote on screen.
- Line 29: we haven't seen the clip, so the on-screen version is a labelled reconstruction ("RECONSTRUCTION · based on WIRED 2016/2017").
- Line 41: "about ninety minutes" comes from one source (Lee via Zetter). Keep "according to one investigator".
- Line 55: "many researchers believe it was a test". This is Greenberg's and the researchers' framing, so confirm the attribution wording in S07.
- Line 59: find the Russian denial wording (S37).
- Line 85: attribute it and date it (S06, 2016).
- Line 98: Dragos Feb 2026 ⏱.
- Lines 99–102: Poland ⏱; Volt Typhoon is still active ⏱.
- Line 103: re-run the negative search on publish day.
