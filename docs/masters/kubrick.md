# Stanley Kubrick

**Why he matters to us:** one-point perspective and symmetry make a frame feel inevitable and
controlled. In a documentary about institutions and power, a symmetrical corridor or control
room says "system" before the narrator does.

## Principles
- **One-point perspective.** kogonada's 2012 supercut collects Kubrick shots where every plane
  converges on a single vanishing point, with the subject often placed dead centre on it
  [cited: Slate; Filmmaker Magazine; PetaPixel].
- **Depth and motion inside symmetry.** Compared with Wes Anderson's flatter centred frames,
  Kubrick's symmetry conveys depth and motion (corridors, tracking shots) [cited: Free Beacon on
  kogonada's two supercuts].
- **Real light, at any cost.** For *Barry Lyndon*'s candlelit interiors, Kubrick found three Zeiss
  50mm f/0.7 still lenses left over from a NASA batch, and had a camera rebuilt to take them;
  wide shots used a projection adapter for an effective 36.5mm [cited: Neil Oseman; No Film
  School "Six Kinds of Light"; Slashfilm].

## Signature techniques
- Wide-angle lenses with everything in focus, aimed at the centre [cited: Vice].
- Slow forward tracking down corridors (*The Shining*, *Paths of Glory*) [analysis].
- Painterly static tableaux and slow zoom-outs (*Barry Lyndon*) [analysis].
- Practical light sources in frame: ceilings of light (*2001*, *Dr. Strangelove*'s war room) [analysis].

## Tension and scale
- Symmetry + slow forward motion = dread; the frame is a trap [analysis].
- Slow zoom-out from a detail to a tableau reveals the system around a person [analysis].

## Sound and silence
- Pre-existing music (classical) against image; silence in space (*2001*) [analysis].
- Breathing and room sound in close quarters [analysis].

## How he cuts
- Long takes; cuts are rare and graphic (the bone-to-satellite match cut in *2001*) [analysis].

## Colour philosophy
- Each film has a controlled palette tied to its light source: candle amber, fluorescent white,
  red alarm light [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| One-point corridor | `CAM.dollyIn` along the axis, camera exactly on the vanishing line (`look` x = `pos` x), 18–24 mm; world-kit avenue (`city.line`) or a control-room set; catalog `REV-019` Slow push to the door. |
| Symmetric tableau | `EST-020` Silent wide lock-off centred, `OBJ-005` Locked-off evidence hold; overlay type centred only here (it breaks our corner rule on purpose). |
| Slow zoom-out | `CAM.zoomCreep` with negative rate or `DAT-010` Map zoom-out to region; Barry Lyndon pace: 6–10 s per 2x. |
| Graphic match cut | `TR` `match-cut` (anchors converge) between two shapes: a tanker hull to a barrel chart bar. |
| Ceiling of light | Area lights in the set, `K.keySpot`, `noir-sodium` or `blue-hour` look. |

## Sources
- Slate, Kubrick and one-point perspective: https://www.slate.com/blogs/browbeat/2012/08/29/stanley_kubrick_and_one_point_perspective_watch_a_thrilling_supercut_of_stanley_kubrick_s_favorite_symmetrical_composition_.html
- Filmmaker Magazine, "The one-point perspective in Stanley Kubrick's work": https://filmmakermagazine.com/?p=85083
- Vice, Kubrick one-point perspective supercut: https://vice.com/en/article/stanley-kubrick-one-point-perspective-supercut-is-the-latest-in-a-series-exploring-filmmaking-tropes
- Free Beacon, "What I told you was true ... from a certain point of view": https://freebeacon.com/?p=238348
- Neil Oseman, "Barry Lyndon: the full story of the famous f/0.7 lenses": https://neiloseman.com/?p=9341
- No Film School, "Six Kinds of Light" (John Alcott): https://nofilmschool.com/2016/03/six-kinds-light-rare-documentary-illuminates-legendary-dp-john-alcott
- Slashfilm, how Kubrick filmed Barry Lyndon by candlelight: https://slashfilm.com/668580/how-stanley-kubrick-filmed-barry-lyndon-by-candlelight
