# Studio Ghibli (Hayao Miyazaki)

**Why it matters to us:** *ma*, the deliberate pause. Retention-optimised edits tend toward
constant stimulus; Miyazaki explains why that numbs the audience, and how a pause makes the next
beat land harder.

## Principles
- **Ma: the emptiness is there on purpose.** In a 2002 interview with Roger Ebert, Miyazaki said
  Japanese has a word for the "gratuitous motion" in his films, *ma*, emptiness; he clapped his
  hands and said "The time in between my clapping is ma" [cited: RogerEbert.com].
- **Without pauses, tension numbs.** "If you just have non-stop action with no breathing space at
  all, it's just busyness. But if you take a moment, then the tension building in the film can
  grow into a wider dimension. If you just have constant tension at 80 degrees all the time you
  just get numb" [cited: RogerEbert.com].

## Signature techniques
- Quiet moments: a character sits, sighs, watches water; wind in grass; clouds [analysis].
- Hand-painted backgrounds with real light and weather [analysis].
- Detailed everyday action (cooking, cleaning) that makes the world believable [analysis].

## Tension and scale
- Pause before the big moment; scale through sky and cloud [analysis].

## Sound and silence
- Ambience-only stretches (wind, insects, water) between Joe Hisaishi cues [analysis].

## How it cuts
- Holds longer than western animation; cuts to environment between story beats [analysis].

## Colour philosophy
- Natural, luminous, painterly; skies and greens rich but never neon [analysis].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Ma beat | Once per chapter: a 3–5 s shot with no VO and no new information (`padOut` 2–3 s or a no-VO shot with `min`), ambience only (`wind.amb`, `room.tone`, water). Place it **before** a reveal, not after. Retention: it is a planned breath, not dead air; keep motion alive (slow `CAM.creep` or clouds moving). |
| Environment cutaway | `EST-004` Aerial hover pan, `EST-014` Horizon low pass, `END-002` Long hold slow creep. |
| Weather as life | World kit clouds moving (pure in t), sea surface on footage; haze in bright mode. |

## Sources
- RogerEbert.com, Hayao Miyazaki interview (2002): https://www.rogerebert.com/interviews/drawing-on-spirited-world
- Final Draft, Miyazaki on ma: https://www.finaldraft.com/blog/hayao-miyazaki-says-ma-is-an-essential-storytelling-tool
- No Film School, "The master of 'ma'": https://nofilmschool.com/2013/09/master-of-ma-director-hayao-miyazaki-set-to-retire
