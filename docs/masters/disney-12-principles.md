# The Disney twelve principles, applied to camera and graphics

Frank Thomas and Ollie Johnston set out twelve principles in *The Illusion of Life: Disney
Animation* (1981), based on Disney animators' practice from the 1930s on [cited: Wikipedia,
"Twelve basic principles of animation"]. They were written for characters; below is what each
means for a virtual camera and for motion graphics in our engine.

| # | Principle | Camera | Graphics / type | Engine |
|---|---|---|---|---|
| 1 | Squash and stretch | Lens breathing on a push (focal length eases 1–3%) | A number slams in with a 4–6% overshoot squash, settles in 6 frames | `M.text.slam`; `CAM.lens(m, fn)` |
| 2 | Anticipation | A 3–5% counter-move before a whip or a push (pull back slightly, then go) | Element dips 2–4 px before it rises | `CAM.seq([...])` with a short reverse segment; `M.spring` |
| 3 | Staging | One subject, framed by negative space; the move reveals one thing at a time | One idea per frame, read order top-left → subject → caption | `shot-design` checks; `CAM.frameSubject` |
| 4 | Straight-ahead vs pose-to-pose | Keyframed rigs (pose to pose) for control; simulated follows (straight ahead) for life | Pose to pose with eased tweens | `C.path` keys vs `CAM.follow` / `O.follow` |
| 5 | Follow-through and overlapping action | Camera lags its subject and settles after it stops | Sub-elements (label, line, dot) arrive 2–4 frames apart | `C.moves.followThrough({ lag, overshoot })`; staggered `at` in `M` |
| 6 | Slow in and slow out | Every move eased; velocity continuous across cuts | Ease-out for arrivals, ease-in for exits | `C.path` accel/decel; `carry` across match cuts; `M.E` easings |
| 7 | Arcs | Orbit/crane arcs rather than straight dolly diagonals; arc-push to land | Elements travel on gentle curves | `CAM.arcPush`, `CAM.jibArc`, `CAM.spline` |
| 8 | Secondary action | Handheld breath, gimbal drift; clouds, water, traffic keep moving | Grain, subtle texture flicker, icon bobbing | `CAM.breathe`, `K.handheld`, world traffic |
| 9 | Timing | Shot length scales with reading load; moves 2–6 s | Type on screen ≥ 0.3 s per word read | `shot-design` cut-rate targets |
| 10 | Exaggeration | Push moves 10–20% further than "real" for the beat; dolly-zoom once per episode | Highlight the key word, dim the rest | `REV-007` dolly zoom; `M.text.highlight` |
| 11 | Solid drawing | Correct perspective and lens (mm), real scale references in frame | Consistent grid, baseline, type scale | `C.lens(camera, mm)`; style-bible type rules |
| 12 | Appeal | Clean silhouettes, pleasing compositions, a light that flatters | Clear, well-kerned type; restrained palette | `engine/looks.js` palettes; greyscale silhouette check |

## Sources
- Wikipedia, "Twelve basic principles of animation": https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation
- ISPR, "The Illusion of Life: Disney's 12 principles of animation": https://ispr.info/2014/05/14/the-illusion-of-life-disneys-12-principles-of-animation-in-new-cartoon/
