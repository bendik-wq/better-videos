# Camera language: what each move does, and when to use it

Research notes behind `engine/camera.js` and the 200-shot catalog (`docs/shots/catalog.md`). Read it with
`docs/research/visual-craft.md` (pacing, Murch, Sicario) and `docs/style-bible.md` (taste wins).
Tags: **[primary]** the filmmaker or an official page; **[secondary]** a journalist, essay or tutorial;
**[house]** our own rule, inferred from the sources and from building the shot lab.

## 1. Principles from the masters

### Deakins and Villeneuve: motivation, restraint, holding
- "If the camera moves it's got to be for a reason." Deakins says he has "a thing about ostentatious
  camerawork or any extraneous move", points to Bresson ("he doesn't move the camera because he can't
  find a reason to do it, so why should we?"), and on *Sicario* describes "building tension just by
  holding a shot". Everything is storyboarded. [primary, [Hazlitt interview](https://hazlitt.net/node/10611811)]
- On *Blade Runner 2049* Deakins stressed keeping things simple and focusing on character and emotion,
  letting light and framing follow. [primary via ASC, [American Cinematographer](https://theasc.com/articles/uncanny-valley-blade-runner-2049)]
- Villeneuve's *Dune* (Greig Fraser) was composed as a series of wide shots of Arrakis paired with
  extreme close-ups; Villeneuve wanted it to "feel extraordinarily intimate to the characters" while
  scale was taken for granted. Analyses note figures placed low in frame, dwarfed by landscape.
  [secondary, [NAB Amplify](https://amplify.nabshow.com/?p=66979), [Color Culture](https://colorculture.org/cinematography-analysis-of-dune-part-two-in-depth/)]
- **Rules [house].** Every move gets a written motivation (`<move> because <word>`). The default
  emotional register is a slow move or a hold; a hold after a run of moves is a strong choice. Scale is
  shown by a tiny human or object in a huge frame (EST-003, CHR-001), not by speed.

### Fincher: the camera locked to the subject
- Evan Puschak's essay (summarised by Kottke and No Film School): Fincher's camera "mimics your eyes in
  paying attention to the behavior in a scene"; when a character moves even slightly, the frame keeps
  their eyes in the same place. Pans and tilts match the subject's velocity, so the viewer feels locked
  in. [secondary, [Kottke](https://kottke.org/17/10/the-movement-of-david-finchers-camera-is-a-surrogate-for-your-eyes), [No Film School](https://nofilmschool.com/2017/10/watch-david-fincher-camera-movement-characters), [Fstoppers](https://fstoppers.com/education/exploring-camera-direction-david-fincher-201042)]
- On *Panic Room* Fincher described the precision as deliberately "personality-free" because no
  operator is pushing the dolly. [primary via commentary, [Reverse Shot](https://reverseshot.org/symposiums/entry/3412/panic_room)]
- **In camera.js.** `follow(subject, { lag: 0.05-0.1, lookahead: 0.1, float: 0 })` is the Fincher
  follow (FOL-005): no breath, almost no lag. Add `float` and `lag: 0.4` for a human operator (FOL-006).
  The difference is the whole point: precision reads as surveillance, lag reads as presence.

### Cuarón and Lubezki: the oner and the "elastic" shot
- Lubezki's term "elastic shots": shots that go from very wide to a medium close-up and then segue into
  a point-of-view shot without a cut. Cuarón says long takes remove the need to cut in to closer views.
  [secondary, [David Bordwell](https://www.davidbordwell.net/blog/?p=25164), [No Film School](https://nofilmschool.com/2013/10/incredible-cinematic-style-of-alfonso-cuaron)]
- The *Children of Men* car ambush used a Doggicam rig on a roofless car, with seats that tilted actors
  out of the way; accounts differ on how many takes were stitched (Double Negative is credited with
  joining several). *Gravity*'s "takes" were largely synthetic. [secondary, [Wikipedia: Lubezki](https://en.wikipedia.org/wiki/Emmanuel_Lubezki), [Matthew Buchanan](https://matthewbuchanan.name/post/267524903/children-of-men-tracking-shot), Bordwell above]
- Hidden joins: *Rope* pushes into a dark surface; *1917* cuts behind passing objects and on movement;
  *Birdman* joins on whip pans, darkness and pushes. [secondary, [No Film School on 1917](https://nofilmschool.com/1917-camera-edits-oner), [Laughing Squid on Birdman](https://laughingsquid.com/how-the-hidden-edits-used-in-birdman-made-it-appear-as-if-it-were-filmed-in-one-continuous-shot/), [Wikipedia: Film transition](https://en.wikipedia.org/wiki/Film_transition)]
- **In camera.js.** `seq()` is the elastic shot: it hands *velocity* from one move to the next, so a
  descent becomes a follow becomes a pull-out with no pop (ONE-001, ONE-009). Where two worlds can't
  share space (a page and a city), `cut()` joins two moves inside a fully white or black frame with
  matched speed and direction: the *Rope* trick (ONE-008, TRN-003/004).
- **Scholarly caution.** Middents argues the constant motion in these set pieces can be a bait-and-switch
  that masks an interest in making the viewer dwell in time. [secondary, [Teknokultura](https://revistas.ucm.es/index.php/TEKN/article/download/104334/4564456574719/4564456778303)]
  **Rule [house]:** one oner per chapter at most; it must carry story (a subject found, a scale changed).

### Nolan and van Hoytema: large-format scale
- Nolan and van Hoytema shot *Oppenheimer* in IMAX to tell a story of that size, often handheld on the
  shoulder; van Hoytema says the film's scope comes from faces as much as from landscapes. They have
  continued large format since *Interstellar*; *Dunkirk* put an IMAX camera in a Spitfire cockpit.
  [secondary, [YMCinema](https://ymcinema.com/2023/08/01/oppenheimers-contribution-to-imax-cinematography/), [Filmmaker Magazine](https://filmmakermagazine.com/?p=123961), [ASC on Dunkirk](https://theasc.com/news/dunkirk-discussion-at-asc-clubhouse-with-van-hoytema-and-sasaki)]
- **Rules [house].** The "IMAX establishing" register is a wide, slow, nearly static move held long
  (EST-001: a 10 % push over 9 s on 50 mm). Scale comes from contrast with the next shot: follow a wide
  with a face or an object close.

### The 3D documentary channels (Fern, Kurzgesagt, LEMMiNO)
- What is documented is thin (see `docs/research/visual-craft.md` §1). Kurzgesagt plans visual
  metaphors and transitions between ideas at the storyboard stage. Its scale pieces descend from the
  Eames' *Powers of Ten* (a factor of ten every ten seconds), but keep human scale as a reference at
  each step. [primary/secondary, [NASA APOD on Powers of Ten](https://science.nasa.gov/image-article/apod-2022-december-4-video-powers-of-ten/), [FlowingData](https://flowingdata.com/2023/12/21/scale-of-all-the-things-compared-to-you/)]
- The "Fern style" as its imitators describe it: smooth camera paths, depth of field matched to the
  voice-over pace, realistic camera sweeps over map animations, mannequin figures, high-contrast light.
  [secondary, freelancer listings such as [Fiverr](https://fiverr.com/frank_harry800/create-fern-style-3d-documentary-animation); treat as weak evidence]
- **Rules [house].**
  - *Powers of Ten* moves must be exponential in height, not linear, or they crawl at the start and
    rocket at the end. `pullBackToPlanet` and `descendFromSky` interpolate log-height, so the perceived
    speed is constant across six decades (3 m to 400 km).
  - Map moves follow van Wijk and Nuij's optimal zoom-and-pan: zoom out, pan, zoom in, which minimises
    optical flow. `mapFlyTo` and `globeFly` implement their closed form (ρ = 1.42).
    [primary paper: J. J. van Wijk and W. A. A. Nuij, "Smooth and efficient zooming and panning", InfoVis 2003; discussed in [Reach and North, arXiv 1801.09358](https://arxiv.org/pdf/1801.09358); Mapbox `flyTo` uses the same model: [Mapbox docs](https://docs.mapbox.com/android/maps/api/10.0.0/mapbox-maps-android/com.mapbox.maps.plugin.animation/-camera-animations-plugin-impl/fly-to.html)]
  - One hero object in a void, a slow orbit and a single key light (OBJ-001) is the workhorse. Hold it
    long enough to read.

### Edgar Wright and the whip
- The whip pan blurs the frame between two shots and often hides a cut; Wright uses it for momentum,
  comedy and quick travel between places. Overuse makes it a gimmick. A crash (snap) zoom changes focal
  length rather than direction and punches in on a subject. [secondary, [Nikon](https://www.nikon.co.uk/en_GB/learn-and-explore/magazine/tips-and-tricks/cut-to-the-chase-10-tricks-to-add-pace-and-energy-to-your-edits), [StudioBinder whip pan](https://www.studiobinder.com/camera-shots/camera-movements/whip-pan-shot/), [Wikipedia: Whip zoom](https://en.wikipedia.org/wiki/Whip_zoom)]
- **In camera.js.** `whipPan` is eased (`EASE.whip`, a cosine velocity ramp), never a linear snap; the
  outgoing shot leaves in the same direction the incoming one arrives (TRN-001/002). Pair it with
  `--shutter` for blur. `snapZoom` eases in log focal length with a long settle (`EASE.snap`).

## 2. The move vocabulary: emotion and use

StudioBinder's movement guide is the baseline vocabulary. Quotes are from
[StudioBinder: different types of camera movements](https://www.studiobinder.com/blog/different-types-of-camera-movements-in-film/)
and its [movement hub](https://www.studiobinder.com/camera-shots/camera-movements/) unless noted. [secondary]

| Move (camera.js) | What it does to the viewer | Use it when | Avoid |
|---|---|---|---|
| Push in (`dollyIn`, `creep`) | Draws us toward the subject, "enhancing tension or intimacy"; signals a thought or realisation | the VO names a detail; a decision; dread (creep 5-10 % over 8-10 s) | pushing on every line: it stops meaning anything |
| Pull out (`dollyOut`, `pullBackReveal`) | "Creating a sense of isolation by distancing the character"; reveals context | endings; the system behind a detail; loneliness | landing on nothing: end on a composed frame |
| Truck / parallax slide | Movement past a foreground gives depth; follows action laterally | places, comparisons, two-shots | trucking with no foreground: no parallax, looks like a pan |
| Pedestal / crane / jib | Vertical movement "can create a sense of grandeur"; establishing and large reveals | arrival, scale, power (rise), returning to the human level (descend) | rising for no reason at the end of every scene |
| Arc / orbit | "Builds tension, enhances emotion, and brings an immersive quality"; the strongest single image of a subject | objects, heroes, landmarks; reveals the other side (half-orbit) | 360s: they read as a turntable |
| Pan / tilt | Reveals information, follows a character; tilt establishes "scale or dominance" | look-at shifts that link A to B; tilt up a tower | aimless survey pans |
| Whip pan | Energy, a hidden join, simultaneous places | "meanwhile", comedy, time jump | more than ~1 per minute (shot-design ration) |
| Zoom / snap zoom | Tension in horror and thriller; a jolt of attention | the shock number, the detail on its word | slow zooms instead of dolly moves (they flatten space) |
| Dolly zoom (`dollyZoom`) | "A disorienting effect": reality shifts, dread, realisation (Vertigo, Jaws) [also [Filmlifestyle](https://filmlifestyle.com/what-is-a-dolly-zoom-zolly-shot/)] | once per episode, on the twist | twice |
| Roll / Dutch (`dutchDrift`) | "Should only be used when wanting to elicit discomfort" | guilt, instability, a lie; transitions into memory (roll-through) | as decoration |
| Tracking / follow | "Fluid motion and immersion"; with a moving subject, intent and momentum | journeys, chases, a person with a purpose | following nothing in particular |
| Handheld (`handheld`, `float`) | "Raw, immersive", documentary truth | observer beats, raids, protests; low amplitude everywhere else | high-frequency shake (never: `breath()` is < 0.35 Hz) |
| Bird's eye / god's eye (`godRotate`, `followTop`) | "Distances the audience from the subject"; vulnerability, surveillance, pattern | systems, maps, crowds, routes | eye-level information shot from above |
| Static / lock-off (`lockOff`, `hold`) | Deadpan; tension by holding (Deakins) | after a run of moves; the fact that needs no help | hiding a lack of ideas |
| Rack focus (`rackHold`, focus channel) | Moves attention without moving the camera | linking foreground and background subjects | without DOF enabled (it does nothing) |

## 3. Drone grammar

From a drone shot taxonomy ([The Drone U](https://www.thedroneu.com/blog/types-of-shots-in-drone-cinematography/), with [HoverAir](https://hoverair.com/blogs/guide/10-must-have-drone-shots); vendor sources, [secondary]):

| Drone shot | Flight path + gimbal | Stated purpose | camera.js |
|---|---|---|---|
| Helix / spiral | spiral up or down, gimbal tilts to keep subject | scale grows as the frame rises | `helixRise`, `spiralDescent` |
| Fly-over / crane reveal | skim low toward a foreground object, climb over it | near-miss tension released into a reveal; openings, transitions | `flyover` |
| Fly-through reveal | push through a gap, level onto the subject | anticipation, dramatic entries | `flyThrough`, `pushThrough` |
| Tilt-down reveal | fly forward over a ridge or roofline, tilt down at the edge | landscape appears gradually; big reveals | `droneRidgeReveal` |
| Pull-back reveal | fly backward, optionally climbing | context, endings, isolation, scale | `pullBackReveal` |
| Top-down | gimbal at 90°, hover, drift or yaw | patterns, geometry, maps | `godRotate`, `topDownPush` |
| Orbit / POI | circle at fixed radius, counter-yaw | the hero shot | `orbit` |
| Follow / side follow | trail or parallel-track a moving subject | momentum, urgency, profile | `followChase`, `followSide` |
| Pedestal rise | climb straight up, gimbal level | height, grandeur | `pedestal` |
| Push-in | slow approach to a static subject | tension without a cut; introduce a location | `dollyIn` |
| Hover pan | yaw only, ~180° over 15-25 s | calm survey; establishing | `pan` |

**Rule [house].** Real drones obey a gimbal: horizon level (no roll), smooth yaw. Keep `roll` at 0 for
any "drone" shot; roll belongs to FPV.

## 4. FPV grammar

FPV cameras are fixed to the airframe, so the pilot's manoeuvres *are* the framing: dives down
building faces, flips, proximity passes that a stabilised drone can't do. Named moves include skydive,
orbit, no-look orbit, 180 flip, drift, dive, split-S, low pass and chase; cinewhoops fly within inches of
people and through tight gaps. [secondary, [Bright Publishing / Definition](https://online.bright-publishing.com/view/862129/31/), [drohnen.de](https://www.drohnen.de/58590/dji-avata-2-10-fpv-moves-fuer-epische-cinematic-shots-video/), [DroneBlog](https://www.droneblog.com/what-is-a-cinewhoop-drone-getting-started-with-cinewhoops/), [DIYPhotography](https://www.diyphotography.net/?p=310197)]

- **In camera.js.** `fpvWeave` banks into turns with a coordinated-turn roll, φ = atan(v·ω/g), smoothed
  by a Gaussian over the path so the roll itself is C2 and never snaps; `fpvDive` crests an edge, noses
  over, falls down the face and pulls out low. Lens 14-18 mm.
- **Rules [house].** FPV is the highest-energy register we have. Use it for pursuit and recklessness,
  never for information. Weaves need room: at ~20 m/s, keep turns at least ~1 s apart (the default
  `fpvWeave` duration is 10 s for the lab's eight-point path), or the roll reverses faster than ~1 Hz and
  reads as a glitch. The test suite flags this as a roll "spike".

## 5. Engineering rules that make moves read as cinema [house]

These come from building and watching the shot lab (`projects/shot-lab`), not from a source.

1. **Velocity continuity beats position continuity.** A seam is visible when *speed* jumps, even if the
   position doesn't. `seq()` crossfades velocities, not positions, and then glides out any absolute
   error with a C2 correction. The test suite checks C1 and C2 by halving the sample interval: a C2
   signal's acceleration jump halves; a C1 one stays constant; a pop grows.
2. **Ease in velocity, not in position.** Cosine velocity ramps (`profile(accel, decel)`) give zero
   acceleration at both ends of each ramp. `'in'` leaves at speed and `'out'` arrives at speed: use them
   at the ends of a move that hands off inside a `seq`.
3. **Splines must be C2.** Catmull-Rom is only C1: the acceleration kinks at every key, which the eye
   reads as tiny bumps on long moves. Paths are natural cubic splines; aims look at a chord ahead
   (`spline.ahead`), never at the raw tangent, which is only C1.
4. **Log space for scale and lens.** Height, distance in big pull-outs, and focal length are interpolated
   in log space; focus is interpolated in dioptres, like a real follow-focus.
5. **Lag is a filter, not a simulation.** `follow` uses a gamma-kernel FIR (mean delay = `lag`), which
   is pure in t and follows a constant-velocity subject exactly `lag` seconds behind. Followers that
   integrate frame to frame break chunked, out-of-order rendering.
6. **Lead room.** Aim ahead of a moving subject (`lookahead`, `lookAt(..., { lead })`); a frame that
   trails its subject feels late.
7. **Avoid exposure pops when passing through glass.** When the lens crosses a surface (window, screen,
   page), fade the surface's opacity by camera distance; otherwise the frame brightens or darkens in one
   frame (seen and fixed in ONE-011).
8. **Up vectors carry the heading overhead.** A straight-down camera has no "up"; every god's-eye move
   carries the heading in `up`, and tilt-downs blend `up` from the heading to world-up, so nothing flips.
