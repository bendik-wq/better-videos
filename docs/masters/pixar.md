# Pixar

**Why it matters to us:** story structure that a machine can check, colour planned across the
whole film before any shot exists, and staging that makes one idea read instantly.

## Principles
- **The story spine.** "Once upon a time... Every day... One day... Because of that... Because of
  that... Until finally... And ever since then..." It is rule #4 of the list storyboard artist
  Emma Coats tweeted in 2011 [cited: Open Culture]. It was created by improv teacher Kenn Adams
  and brought to Pixar by Rebecca Stockley in 1997 [cited: TCK Publishing]. Adams warns that a
  finished spine is only about 10% of a story [cited: TCK Publishing].
- **Coats' list was never official "rules"** [cited: Prolost analysis]. Useful items for us: you
  admire a character for trying more than for succeeding (#1); what is the essence of your
  story, the most economical telling (#14); coincidences that get characters into trouble are
  great, coincidences that get them out are cheating (#19) [cited: Open Culture].
- **Colour scripts.** Pixar makes a colour script for each film: an abstract strip of the whole
  film in colour and shape that maps each scene's emotional tone before animation, like sheet
  music before a performance (Lou Romano) [cited: MoMA audio; Hyperallergic]. Ralph Eggleston's
  *Toy Story* scripts were chalk pastel on black paper [cited: Hyperallergic].
- **Staging and appeal** come from the Disney principles (see disney-12-principles.md):
  silhouette readability, one idea per shot.

## Signature techniques
- Colour arcs across a film: saturated in safety, desaturated or cold in loss, warm return [analysis].
- Shape language: round = friendly, square = stable, triangle = danger [analysis].
- Lighting that follows emotion as much as physics [analysis].

## Tension and scale
- Clear stakes stated early; a ticking clock in act three [analysis].

## Sound and silence
- The *Up* "Married Life" montage: music and picture, no dialogue [analysis].

## How it cuts
- Story reels (storyboards cut to scratch VO) are iterated many times before production [analysis].

## Colour philosophy
- Colour is planned per beat for emotion first, realism second [cited: MoMA; Hyperallergic].

## How we execute this in our engine
| Move | Engine recipe |
|---|---|
| Story spine | `retention-script` skill outline: write the spine in 7 lines before the beat sheet; every chapter must map to one spine line. |
| Colour script | Before building sets, render one still per chapter (`--stills=0.5`) and line them up in a strip; assign each chapter a look from `engine/looks.js` and a dominant palette hue from `LK.palette`. Use `projects/look-lab/sheet.py` as the strip builder. |
| Shape language | Danger = sharp/triangular icons and red annotation; safety = round pins and sea turquoise. |
| Staging | One subject per frame; test silhouette readability on a greyscale still. |

## Sources
- Open Culture, Pixar's 22 rules of storytelling: https://www.openculture.com/2013/03/pixars_22_rules_of_good_storytelling.html
- TCK Publishing, the story spine: https://www.tckpublishing.com/story-spine/
- Prolost, Pixar's 22 rules of story analyzed: https://prolost.com/blog/2013/12/4/pixars-22-rules-of-story-analyzed.html
- MoMA, Pixar: 20 Years of Animation (audio, colour scripts): https://www.moma.org/audio/playlist/192/2575
- Hyperallergic, 25 years of Pixar's colour palettes: https://hyperallergic.com/610771/the-art-of-pixar-chronicle-books/
- Thunderchunky, Pixar colour with Lou Romano: https://www.thunderchunky.co.uk/articles/pixar-colour-and-tent-poles-with-lou-romano/
