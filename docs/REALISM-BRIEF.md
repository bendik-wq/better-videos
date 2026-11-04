# Realism + 10x library brief (round 2)

The user saw the first library pass and wants **way more realism**, **smoother motion**, **every weak spot fixed** and a **context library ten times larger**. The goal is to be the best faceless documentary producer in the world.

All the hard rules in `docs/LIBRARY-BRIEF.md` still apply: deterministic frames, the CPU budget, licences, the look, looking at your own output, shared-tree etiquette, the commit trailer, and no `mcp__github__*` tools. Read that brief first, then `.claude/skills/make-video/SKILL.md` (the "Production library" section).

## Known weak spots, from looking at our renders
- Vehicles look clean low-poly and toy-like, with no clear-coat reflections.
- People are mannequins.
- Buildings are boxes with emissive window grids.
- Roads are flat.
- There are no cast shadows at golden hour.
- The red route line is thin in the map phase.
- The map goes dark for about 1 s during the regional pull-out.
- The shot-lab test world is murky brown at mid-altitude.
- Some Palantir sets read as CG: robed figures, boxy HQ towers, dark stone shots.

## Where realism comes from (in order of payoff)
1. **Real imagery and real footage.** Use public-domain photo and video wherever the story allows, graded into the house look:
   - USGS NAIP aerial imagery (public domain);
   - USGS 3DEP elevation;
   - NASA, NOAA and DVIDS (US military, public domain);
   - Library of Congress, the National Archives, and Prelinger / archive.org public-domain films;
   - Copernicus Sentinel-2 (free to use with attribution).
2. **Physically based materials and lighting.** Use CC0 PBR texture sets (Poly Haven, ambientCG), real HDRIs, real shadows, AO, SSR/reflections on wet surfaces, atmospheric scattering, and a filmic tone map (AgX).
3. **Camera realism.** Real lenses: breathing, focus falloff, slight chromatic aberration and vignetting. Real operators: gimbal and drone inertia, and handheld built from measured low-frequency spectra rather than noise. Motion blur on fast moves.
4. **Detail density.** Clutter, wear, signage, light variation, and props with real scale references.

Measure costs. If something is only achievable with a GPU, say so in your report with numbers. Don't fake it.
