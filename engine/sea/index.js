// engine/sea: a bright, photographic sea for episode 3 (and any ocean shot): deterministic FFT waves,
// sun glitter, fresnel sky, foam, turquoise shallows, Kelvin wakes, ships, real coastlines.
// API and set list: docs in the header of each file and .claude/skills/make-video (see the report).
export { Sea } from './sea.js';
export { Spectrum } from './fft.js';
export { Ocean, noiseTexture, MAX_SHIPS } from './ocean.js';
export { LOOKS, sunDir, mixLook, GLSL } from './look.js';
export { land } from './land.js';
export { ship, lane, hullGeometry, KINDS } from './ships.js';
