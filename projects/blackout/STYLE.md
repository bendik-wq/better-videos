# Episode 4, "The Hackers Who Can Turn Off the Power": style direction "LIVE WIRE"

This is a completely new visual language. Nothing should look like episodes 1–3: no paper cards, no Instrument Serif title cards, no bright turquoise, no seeing-stone smoke.

The DNA comes from the user's Pinterest taste board:
- Wong Kar-wai fluorescent green
- direct on-camera flash
- 1967 photojournalism
- the stoic operator

## The rule that drives everything
**Light is power.** Every light in frame is electric and motivated: monitors, fluorescent tubes, streetlights, LEDs, a camera flash. When the grid dies in the story, the light dies *in the frame*. Bulbs go out, screens collapse, the city goes black. It is never a dissolve to black; the image loses its electricity. Darkness is the subject, and the light is what's at stake.

## Palette
| Name | Hex | Use |
|---|---|---|
| Phosphor green | `#5dff9e` | CRT and HMI glow, oscilloscope traces, the "living" grid |
| Fluorescent green-white | `#d8ffe6` | office tubes, with a slightly green cast on skin |
| Sodium | `#ffa24a` | streetlights, city grid from orbit |
| Flash white | `#fff8ee` | direct-flash stills, harsh falloff, hard shadow just behind the subject |
| Snow night | `#0b1a2a` → `#9fb7cf` | Ukrainian December exteriors |
| Alarm red | `#ff2b1f` | breaker OPEN state, annotation only |

## Type (new for this episode)
- **Display:** a condensed grotesque or industrial face, e.g. an OFL font such as "Big Shoulders Display", "Oswald" or "Barlow Condensed". Pick one and check its licence.
- **Data:** a monospace with a CRT treatment (slight bloom, scanline, phosphor persistence).
- Text appears as if typed on a 1990s SCADA terminal or stencilled on equipment. There are no paper cards.

## Signature devices
1. **The 50 Hz heartbeat.** An oscilloscope sine wave is the episode's motif. It sits in the corner on data shots and in chapter cards, and it is the main transition. It flatlines when the grid fails and stutters during the attack.
2. **Single-line diagrams.** Grid one-line schematics, drawn in phosphor green, build stroke by stroke and then extrude into real 3D substations, breakers and lines.
3. **Direct-flash freeze frames.** About four times per chapter, a shutter click and a white pop give a deadpan photojournalism still of a single object: a mouse on a desk, a breaker handle, a snowy transformer, a phone off the hook. The hard shadow sits just behind the subject. Hold 1.5–2.5 s.
4. **Power-cut transitions.** These include:
   - the CRT collapse, where the image squeezes to a horizontal line, then a dot, then black;
   - fluorescent flicker-out;
   - the breaker clunk: a hard cut to black on the sound;
   - flash-pop.
   Use the existing `engine/transitions.js` where it fits, and add the new ones in the project.
5. **The phantom cursor.** Macro shots of a mouse pointer moving by itself. This is the image the episode is built around.

## Camera
- Motivated, slow and controlled.
- Screen-to-world push-throughs: go into a monitor and come out in the substation it controls.
- Night orbit shots: cities from space switching off district by district.
- Snow drifting through floodlights.
- Fincher-style locked, precise moves inside control rooms.
- Nolan-style cross-cutting between the operator and the attacker's keyboard in the climax.

## Cold open (this must be the best intro we've ever made): ONE continuous oner, ~40 s
1. Earth at night from orbit (NASA Black Marble). Europe glows.
2. The camera descends over Ukraine through snow clouds.
3. Ivano-Frankivsk at night: sodium grid, snow, a regional control centre with green fluorescent windows.
4. Push through the window. Over the operator's shoulder. Onto the monitor. Macro on the cursor.
5. The cursor moves *by itself*. The operator's hand is still.
6. It clicks. A breaker on the one-line diagram turns from green to red (OPEN).
7. Breaker clunk. Black. Silence.
8. Cut back to orbit: the lights of one region go out, district by district.
