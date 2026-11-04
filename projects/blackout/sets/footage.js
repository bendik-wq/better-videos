// Graded public-domain footage (engine/footage.js). Every clip is CC0 / US-Government public domain and
// carries a SOURCE line. The LIVE WIRE grades: 'fluoro' (green control rooms), 'night' (sodium city / orbit),
// 'bw'/'archive' for 1950s-70s archive. The house LUT (project look 'live-wire') finishes everything.
//
//   footage   params: file (a library id or path), in/out (source seconds), speed, grade, reframe, caption,
//             source, scanlines (true: add a CRT scanline/vignette pass over the clip, for a 'feed' look)
// Library clips used by this episode (see assets/footage/catalog.json; all PD):
//   command-apollo-mcc-1969, command-artemis-flight-control, command-sage-consoles-1956 (control rooms)
//   server-nasa-ames-modular (a server room), typing-hands-1940s (hands at a keyboard)
//   orbit-night-cities-exp67b, orbit-night-coast-exp65b, orbit-earth-limb-exp65, orbit-clouds-exp65 (orbit)
// NOTE: the catalog has no snowy-power-line / substation / Black Marble animation clip on this box. Those beats
// are carried by the 3D sets (substation, orbit-lights) instead; add such clips with `node engine/footage.js
// fetch` on a machine with network and they drop in here by id with a SOURCE line (RESEARCH gaps C-footage).
import * as FT from '/engine/footage.js';
import * as LW from './lw.js';

export default function makeFootage(H) {
  async function footage(ctx, shot) {
    const P = shot.params ?? {};
    const inst = await FT.footage(ctx, shot, {
      file: P.file, in: P.in, out: P.out, speed: P.speed, ramp: P.ramp,
      grade: P.grade ?? 'fluoro', reframe: P.reframe, stab: P.stab,
      caption: P.caption ? { text: P.caption, kind: 'mono', corner: P.captionCorner ?? 'tl' } : null,
      source: P.source ?? 'PUBLIC DOMAIN',
    });
    return inst;
  }
  // declare the clips to prep (engine/footage.js prep reads project shots; nothing to do here)
  footage.preload = async () => {};
  return { footage };
}
