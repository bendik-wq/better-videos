// LOOKS: whole-picture grade presets for any scene and for the film finish. One file, node + browser,
// no dependencies (so the LUT generator, render.mjs and a scene can all import it).
//
// A look is four things that travel together:
//   grade    a 3D LUT (.cube) generated procedurally from documented curves: white balance and exposure
//            in linear light, a C1 filmic S-curve on a hue-preserving norm, then hue/saturation shaping
//            in Oklab (global sat + vibrance, per-hue bands, skin-line protection, split toning, a
//            luminance-dependent saturation roll-off and a soft gamut ceiling so nothing hits the
//            garish edge of sRGB), then black floor / white ceiling.
//   finish   film-finish parameters for render.mjs (grain, halation, bloom, vignette, halation tint).
//   tod      sky / sun / exposure for the world kit: LK.tod('bright-day', W.TOD) -> world.setState({ tod })
//   imagery  haze + photo grade for engine/imagery IM.terrain(scene, place, LK.imagery('bright-day'))
//   palette  colours for graphics (type, maps, charts, plates) that belong to the look.
//
//   import * as LK from '/engine/looks.js';
//   LK.names()                         -> ['bright-day', 'golden-hour', 'blue-hour', 'noir-sodium', 'archive-warm']
//   LK.get(name)                       -> the preset object (all of the above)
//   LK.gradePixel(r, g, b, name)       -> display sRGB 0..1 in and out (the exact maths in the .cube)
//   LK.cube(name, N = 33)              -> .cube text
//   LK.finish(name)                    -> { grain, halation, halationAmount, bloom, vignette, halationTint }
//   LK.tod(name, W.TOD)                -> a full tod object for world.setState({ tod }) (W.todMix works on it)
//   LK.imagery(name)                   -> { haze, grade } for IM.terrain opts
//   LK.palette(name)                   -> { bg, paper, ink, inkSoft, accent, sea, sand, sky, land, water, grid, plate, plateInk, shadow }
//   LK.lutFile(name)                   -> 'engine/grade/<name>.cube' (repo-relative)
//
// CLI:  node engine/looks.js write [--size 33]          (re)generate engine/grade/*.cube
//       node engine/looks.js apply <in> <out> <look>    LUT + finish on a still (engine/grade/finish.mjs)
//       node engine/looks.js swatch <look>              print a few reference colours through the grade
//
// Rules for using looks (docs/style-bible.md "Bright mode", docs/masters/rules.md):
//   - one look per sequence; change look only on a story turn (a dip, a chapter card, a time jump);
//   - the scene still has to be lit for the look (the tod preset): a LUT cannot turn night into day;
//   - footage and imagery go in neutral (FT grade 'none', IM grade from LK.imagery) and the look's LUT
//     finishes them, so every source lands in the same colour world.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;

// ------------------------------------------------------------------ colour maths
export const toLin = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
export const toSrgb = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const lumaLin = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
// Oklab (Björn Ottosson, 2020; public domain / MIT reference code), on linear sRGB
export function oklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
export function oklabToLin(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
const inGamut = (L, a, b, e = 1e-4) => oklabToLin(L, a, b).every(x => x >= -e && x <= 1 + e);
// the largest chroma inside sRGB at lightness L and hue h (radians); bisection, cached on a grid
const CMAX = new Map();
function maxChroma(L, h) {
  const kL = Math.round(clamp(L) * 64), kH = Math.round(((h / (2 * Math.PI)) % 1 + 1) % 1 * 96) % 96, key = kL * 97 + kH;
  let v = CMAX.get(key); if (v !== undefined) return v;
  const Lq = kL / 64, hq = kH / 96 * 2 * Math.PI, ca = Math.cos(hq), sa = Math.sin(hq);
  let lo = 0, hi = 0.5; for (let i = 0; i < 22; i++) { const c = (lo + hi) / 2; if (inGamut(Lq, c * ca, c * sa)) lo = c; else hi = c; }
  CMAX.set(key, lo); return lo;
}
const hueDist = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
// hex '#rrggbb' -> linear rgb * k (the same as `new THREE.Color(hex)` in three's linear working space)
export const lin = (hex, k = 1) => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => toLin(v / 255) * k); };

// ------------------------------------------------------------------ the grade
// G fields (all optional; identity when absent):
//   wb: [temp, tint]   temp + = warmer (linear R up / B down), tint + = magenta; small numbers (+-0.3)
//   ev                 exposure in stops (linear gain 2^ev, before the curve)
//   curve: { contrast, pivot, perChannel }  C1 power S-curve: slope `contrast` at `pivot` (display
//                      value), toe and shoulder both reach 0/1 with zero slope (no clipping). Applied to
//                      a hue-preserving norm; `perChannel` (0..1) mixes in the classic per-channel curve
//                      (adds film-like saturation in the mids, shifts hues of saturated colours).
//   sat, vibrance      global saturation; vibrance boosts low-chroma colours more than saturated ones
//   bands: [{ h, w, sat, shift, pull, light }]  per-hue shaping in Oklab hue degrees (h centre, w gaussian
//                      width): sat multiplier, hue shift (degrees), pull (0..1 towards the centre: the
//                      skin line), light (Oklab L offset). Neutrals (chroma < 0.02) are untouched.
//   shadowTint / highTint: [a, b]  Oklab a/b offsets weighted by (1-L)^2 and L^2 (split toning)
//   satShadow, satHigh  chroma kept in the deep shadows / top highlights (film-like roll-off)
//   ceiling            chroma never exceeds this fraction of the sRGB gamut edge (soft knee from 0.75x of it)
//   floor, white       output black floor and white ceiling (display)
export function gradePixel(r, g, b, look) {
  const G = typeof look === 'string' ? LOOKS[look].grade : look.grade ?? look;
  // 1. linear light: white balance and exposure
  let R = toLin(r), Gc = toLin(g), B = toLin(b);
  const [temp, tint] = G.wb ?? [0, 0];
  if (temp || tint) {
    const gr = 1 + temp * 0.18, gb = 1 - temp * 0.22, gg = 1 - tint * 0.12;
    const n = 0.2126 * gr + 0.7152 * gg + 0.0722 * gb; // keep luminance
    R *= gr / n; Gc *= gg / n; B *= gb / n;
  }
  const e = Math.pow(2, G.ev ?? 0); R *= e; Gc *= e; B *= e;
  // 2. tone curve (display domain) on a hue-preserving norm, optionally mixed with per-channel
  const C = G.curve ?? { contrast: 1, pivot: 0.45 };
  const k = C.contrast ?? 1, p = C.pivot ?? 0.45;
  const S = (x) => { x = clamp(x); return x < p ? p * Math.pow(x / p, k) : 1 - (1 - p) * Math.pow((1 - x) / (1 - p), k); };
  const nrm = Math.max(1e-6, 0.55 * Math.max(R, Gc, B) + 0.45 * lumaLin(R, Gc, B));
  const nd = toSrgb(Math.min(nrm, 1)), ratio = toLin(S(nd)) / Math.max(toLin(nd), 1e-6) * (nrm > 1 ? 1 / nrm : 1);
  const pc = C.perChannel ?? 0.25;
  let o = [R, Gc, B].map((x) => lerp(x * ratio, toLin(S(toSrgb(clamp(x)))), pc));
  // 3. Oklab shaping
  let [L, A, Bb] = oklab(...o.map(x => Math.max(0, x)));
  let ch = Math.hypot(A, Bb), h = Math.atan2(Bb, A) / D2R; const ch0 = ch;
  const gate = sstep(0.004, 0.03, ch); // neutrals stay neutral
  let sat = G.sat ?? 1, shift = 0, dL = 0;
  const vib = G.vibrance ?? 0; sat *= 1 + vib * gate * clamp(1 - ch / 0.16);
  for (const bd of G.bands ?? []) {
    const d = hueDist(h, bd.h), wt = Math.exp(-0.5 * (d / bd.w) ** 2) * gate;
    if (!wt) continue;
    sat *= 1 + ((bd.sat ?? 1) - 1) * wt;
    shift += (bd.shift ?? 0) * wt - d * (bd.pull ?? 0) * wt;
    dL += (bd.light ?? 0) * wt;
  }
  // luminance roll-off of saturation (film: deep shadows and near-white highlights carry less colour)
  sat *= lerp(G.satShadow ?? 0.8, 1, sstep(0.0, 0.35, L)) * lerp(1, G.satHigh ?? 0.75, sstep(0.82, 1.0, L));
  ch *= sat; h += shift; L = clamp(L + dL * sstep(0.1, 0.4, L));
  A = ch * Math.cos(h * D2R); Bb = ch * Math.sin(h * D2R);
  // split toning, weighted by lightness
  const [sa, sb] = G.shadowTint ?? [0, 0], [ha, hb] = G.highTint ?? [0, 0];
  const wS = (1 - L) ** 2, wH = L * L * sstep(0.0, 0.5, L);
  A += sa * wS + ha * wH; Bb += sb * wS + hb * wH;
  // soft gamut ceiling: a boost approaches `ceiling` x the sRGB edge asymptotically. Colours that were
  // already that saturated (a signal-red graphic) are never pushed further, but never pulled back either.
  ch = Math.hypot(A, Bb);
  if (ch > 1e-5) {
    const hr = Math.atan2(Bb, A), edge = maxChroma(L, hr), cm = Math.max(edge * (G.ceiling ?? 0.95), Math.min(ch0, edge)), knee = 0.75 * cm;
    if (ch > knee && cm > knee) { const c2 = knee + (cm - knee) * Math.tanh((ch - knee) / (cm - knee)); A *= c2 / ch; Bb *= c2 / ch; }
  }
  o = oklabToLin(L, A, Bb);
  // 4. output floor / ceiling (display)
  const f = G.floor ?? 0, w = G.white ?? 1;
  return o.map(x => f + (w - f) * toSrgb(clamp(x)));
}

// ------------------------------------------------------------------ presets
// Oklab hue landmarks (degrees): signal red ~29, skin ~45-70, orange ~60, sand/yellow ~80-100,
// foliage ~125-145, turquoise sea ~185-200, sky blue ~235-250, ultramarine ~265, magenta ~330.
export const LOOKS = {
  // Sunlit, open, saturated but tasteful: Interstellar's cornfields, Dunkirk's beach and sea (Hoyte van
  // Hoytema, daylight IMAX), Dune's daytime desert (Greig Fraser), Apple-keynote clarity, Kurzgesagt colour.
  // Clean neutral whites, sky-blue shadows (open shade), warm sun, turquoise water pulled out of cyan-green,
  // sand kept golden not lemon, foliage pushed olive (never video-game green), skin on the skin line,
  // rich-but-open blacks, a soft shoulder that keeps the sky, chroma capped below the gamut edge.
  'bright-day': {
    label: 'Bright day', intent: 'Sunlit sea, desert and maps; Nolan daylight IMAX / Dune day / Apple clarity.',
    grade: {
      wb: [0.04, 0.01], ev: 0.08,
      curve: { contrast: 1.16, pivot: 0.43, perChannel: 0.22 },
      sat: 1.05, vibrance: 0.22,
      bands: [
        { h: 29, w: 10, sat: 1.04 },                                  // signal red stays clean
        { h: 58, w: 16, sat: 0.94, pull: 0.35 },                      // skin line: protect and gather
        { h: 88, w: 16, sat: 0.95, shift: -5, light: 0.008 },         // sand: golden, not lemon
        { h: 132, w: 22, sat: 0.8, shift: -9, light: -0.005 },        // foliage: olive, not game green
        { h: 172, w: 14, sat: 1.06, shift: 11 },                      // cyan-green water -> turquoise
        { h: 198, w: 18, sat: 1.12, shift: 2, light: -0.006 },        // turquoise sea: the hero colour
        { h: 245, w: 20, sat: 1.06, shift: -3, light: -0.012 },       // sky: deeper, clean, never purple
        { h: 262, w: 12, sat: 1.12, shift: -4, light: -0.018 },       // deep-ocean blue: ink, not slate
        { h: 315, w: 34, sat: 0.78 },                                 // magenta: out
      ],
      shadowTint: [-0.003, -0.011], highTint: [0.002, 0.007],         // sky fill in shade, sun in the light
      satShadow: 0.86, satHigh: 0.7, ceiling: 0.9, floor: 0.012, white: 0.988,
    },
    finish: { grain: 5, halation: 10, halationAmount: 0.2, bloom: 0.09, vignette: 0.26, halationTint: [1, 0.66, 0.46] },
    tod: { base: 'day', sunEl: 36, sunAz: 250, sun: ['#fff0dc', 4.4], zenith: ['#2c64b8', 1.0], horizon: ['#a9c6e2', 1.05], glow: ['#fff6e8', 0.18], glowW: 0.3,
      haze: ['#a9c3df', 1.0], hazeDen: 0.00006, hazeH: 1600, ambSky: ['#7fa2cf', 0.75], ambGround: ['#8d7a5e', 0.5], exposure: 0.9,
      cloud: ['#ffffff', 1.7], sky: { turbidity: 2.2, rayleigh: 1.3, mie: 0.0022 }, hazeGain: 0.8, expAlt: [1, 0.97], bloom: 0.035, bloomThresh: 2.6, flare: 0.35, sat: 1.05, contrast: 1.04 },
    imagery: { haze: { color: [0.64, 0.73, 0.83], sunColor: [1.0, 0.9, 0.76], density: 1 / 17000, scale: 1400, sunDir: [-0.5, 0.62, -0.6], zenith: [0.17, 0.33, 0.6] },
      grade: { contrast: 1.12, saturation: 1.1, warmth: 0.03, gamma: 1.0, exposure: 1.04, lift: 0.0 } },
    palette: { bg: '#f4efe6', paper: '#fbf8f2', ink: '#0f1e33', inkSoft: '#46536a', accent: '#e0241b', sea: '#17a3a6', seaDeep: '#0b6f86', sand: '#e6cf9f',
      sky: '#9cc7ea', land: '#ece3d1', water: '#78b6bb', shallow: '#bfe3df', grid: 'rgba(15,30,51,0.12)', plate: 'rgba(8,20,38,0.58)', plateInk: '#fbf8f2', shadow: '0 1px 18px rgba(8,20,38,0.35)', sun: '#fff6e6', navy: '#0f1e33' },
  },
  // Low sun, long shadows, amber key and teal shade. Golden but not orange soup: whites stay cream.
  'golden-hour': {
    label: 'Golden hour', intent: 'Low warm sun, long shadows; Malick/Lubezki magic hour, Deakins dusk.',
    grade: {
      wb: [0.16, 0.0], ev: 0.06,
      curve: { contrast: 1.15, pivot: 0.44, perChannel: 0.3 },
      sat: 1.04, vibrance: 0.12,
      bands: [
        { h: 58, w: 16, sat: 0.95, pull: 0.3 },
        { h: 75, w: 20, sat: 1.08, shift: -3 },
        { h: 130, w: 24, sat: 0.72, shift: -14 },
        { h: 200, w: 22, sat: 0.95, shift: -6 },
        { h: 245, w: 24, sat: 0.88, shift: -12 },
        { h: 320, w: 30, sat: 0.75 },
      ],
      shadowTint: [-0.009, -0.012], highTint: [0.008, 0.022],
      satShadow: 0.8, satHigh: 0.72, ceiling: 0.88, floor: 0.01, white: 0.985,
    },
    finish: { grain: 7, halation: 16, halationAmount: 0.42, bloom: 0.17, vignette: 0.42, halationTint: [1, 0.5, 0.28] },
    tod: { base: 'golden', sunEl: 10, exposure: 0.95 },
    imagery: { haze: 'golden', grade: { contrast: 1.08, saturation: 0.95, warmth: 0.08, gamma: 1.0, exposure: 1.0, lift: 0 } },
    palette: { bg: '#1b140e', paper: '#f2e4cc', ink: '#f4e7d0', inkSoft: '#c9b393', accent: '#e0241b', sea: '#2c7d86', seaDeep: '#163f4c', sand: '#e0b27a',
      sky: '#e9b48a', land: '#2a2018', water: '#173a44', grid: 'rgba(244,231,208,0.12)', plate: 'rgba(20,12,6,0.55)', plateInk: '#f4e7d0', shadow: '0 1px 18px rgba(20,10,0,0.45)', sun: '#ffd9a0', navy: '#14233a' },
  },
  // After sunset: deep blue ambience, warm practicals kept saturated (the only warm thing in frame).
  'blue-hour': {
    label: 'Blue hour', intent: 'Cool twilight, warm practicals; Mann/Fincher city dusk, Villeneuve twilight.',
    grade: {
      wb: [-0.14, 0.02], ev: 0.08,
      curve: { contrast: 1.1, pivot: 0.42, perChannel: 0.2 },
      sat: 1.0, vibrance: 0.08,
      bands: [
        { h: 58, w: 18, sat: 1.16, pull: 0.25 },                      // practicals and skin hold their warmth
        { h: 130, w: 24, sat: 0.62, shift: 18 },                      // greens go teal
        { h: 200, w: 22, sat: 1.0, shift: 8 },
        { h: 255, w: 24, sat: 1.08, shift: 5 },
        { h: 320, w: 30, sat: 0.7 },
      ],
      shadowTint: [0.002, -0.024], highTint: [0.003, 0.004],
      satShadow: 0.9, satHigh: 0.78, ceiling: 0.88, floor: 0.022, white: 0.975,
    },
    finish: { grain: 8, halation: 16, halationAmount: 0.42, bloom: 0.16, vignette: 0.48, halationTint: [1, 0.45, 0.25] },
    tod: { base: 'blue' },
    imagery: { haze: 'dusk', grade: { contrast: 1.06, saturation: 0.85, warmth: -0.04, gamma: 1.04, exposure: 0.85, lift: 0 } },
    palette: { bg: '#0b1222', paper: '#dfe6f2', ink: '#e6ecf6', inkSoft: '#9aa8c2', accent: '#e0241b', sea: '#1f5f7a', seaDeep: '#0c2638', sand: '#c9a77d',
      sky: '#3a4f86', land: '#141c2e', water: '#0b1626', grid: 'rgba(230,236,246,0.1)', plate: 'rgba(4,8,18,0.55)', plateInk: '#e6ecf6', shadow: '0 1px 18px rgba(0,0,10,0.5)', sun: '#ffb070', navy: '#0b1222' },
  },
  // The old house default (Palantir): darkness is the default, light is the event. Sodium #ffa860 on
  // blue-black, deep blacks, greens and blues starved, one warm key.
  'noir-sodium': {
    label: 'Noir sodium', intent: 'The old house look: sodium key on blue-black (Palantir, Wong Kar-wai/Doyle, Mann).',
    grade: {
      wb: [0.06, -0.02], ev: -0.06,
      curve: { contrast: 1.2, pivot: 0.46, perChannel: 0.3 },
      sat: 0.86, vibrance: 0,
      bands: [
        { h: 29, w: 10, sat: 1.1 },
        { h: 60, w: 20, sat: 1.12, shift: -4, pull: 0.2 },
        { h: 130, w: 26, sat: 0.6, shift: 22 },
        { h: 200, w: 26, sat: 0.85, shift: 10 },
        { h: 250, w: 26, sat: 0.9 },
        { h: 320, w: 30, sat: 0.6 },
      ],
      shadowTint: [-0.006, -0.02], highTint: [0.01, 0.026],
      satShadow: 0.85, satHigh: 0.72, ceiling: 0.9, floor: 0.0, white: 0.97,
    },
    finish: { grain: 9, halation: 18, halationAmount: 0.55, bloom: 0.18, vignette: 0.55, halationTint: [1, 0.45, 0.25] },
    tod: { base: 'night' },
    imagery: { haze: 'dusk', grade: 'house' },
    palette: { bg: '#000000', paper: '#ece6da', ink: '#ece6da', inkSoft: '#bdb6a8', accent: '#e0241b', sea: '#0f2a33', seaDeep: '#06141a', sand: '#ffa860',
      sky: '#0c1424', land: '#17191c', water: '#070b10', grid: 'rgba(236,230,218,0.1)', plate: 'rgba(0,0,0,0.55)', plateInk: '#ece6da', shadow: '0 0 18px rgba(0,0,0,0.4)', sun: '#ffa860', navy: '#070809' },
  },
  // 1967 photojournalism: faded slide film. Warm lifted blacks, cream highlights, cyan-drifting blues,
  // muted greens, reds still alive. For archive photos, period footage, flashbacks.
  'archive-warm': {
    label: 'Archive warm', intent: 'Faded slide / 1960s photojournalism; memory, period, archive.',
    grade: {
      wb: [0.12, 0.02], ev: 0.02,
      curve: { contrast: 1.06, pivot: 0.46, perChannel: 0.35 },
      sat: 0.74, vibrance: -0.05,
      bands: [
        { h: 29, w: 12, sat: 1.15 },
        { h: 60, w: 18, sat: 1.0, pull: 0.2 },
        { h: 132, w: 26, sat: 0.7, shift: -14 },
        { h: 205, w: 24, sat: 0.85, shift: -10 },
        { h: 250, w: 26, sat: 0.72, shift: -16 },
        { h: 320, w: 30, sat: 0.65 },
      ],
      shadowTint: [0.008, 0.014], highTint: [0.003, 0.02],
      satShadow: 0.7, satHigh: 0.65, ceiling: 0.8, floor: 0.06, white: 0.94,
    },
    finish: { grain: 14, halation: 20, halationAmount: 0.45, bloom: 0.13, vignette: 0.62, halationTint: [1, 0.52, 0.3] },
    tod: { base: 'day', sunEl: 30, sky: { turbidity: 5, rayleigh: 1.0, mie: 0.008 }, haze: ['#c8bca8', 1.0], hazeDen: 0.00007, sat: 0.95, contrast: 1.0 },
    imagery: { haze: 'day', grade: { contrast: 1.0, saturation: 0.8, warmth: 0.08, gamma: 1.03, exposure: 1.0, lift: 0.02 } },
    palette: { bg: '#e9dfcb', paper: '#f1e8d6', ink: '#2a2119', inkSoft: '#6b5b48', accent: '#c4281e', sea: '#5f8f8c', seaDeep: '#36585a', sand: '#d6bd8e',
      sky: '#b9c8c4', land: '#e3d6bb', water: '#a9c1bb', grid: 'rgba(42,33,25,0.12)', plate: 'rgba(30,22,14,0.5)', plateInk: '#f1e8d6', shadow: '0 1px 14px rgba(30,20,10,0.35)', sun: '#fff0d0', navy: '#2a2119' },
  },
};

export const names = () => Object.keys(LOOKS);
export const get = (name) => { const L = LOOKS[name]; if (!L) throw new Error(`unknown look '${name}' (have ${names().join(', ')})`); return L; };
export const finish = (name) => ({ ...get(name).finish });
export const palette = (name) => ({ ...get(name).palette });
export const lutFile = (name) => (get(name), `engine/grade/${name}.cube`);

// tod for the world kit. `TOD` is W.TOD (passed in so this file needs no three.js). Colour fields in the
// preset are [hex, k] and become linear rgb * k exactly like core.js's C(hex, k).
export function tod(name, TOD) {
  const T = get(name).tod, base = TOD?.[T.base];
  if (!base) throw new Error(`LK.tod('${name}', W.TOD): pass the world kit's TOD table`);
  const o = { ...base };
  for (const [k, v] of Object.entries(T)) {
    if (k === 'base') continue;
    o[k] = Array.isArray(v) && typeof v[0] === 'string' ? lin(v[0], v[1] ?? 1) : (v && typeof v === 'object' && !Array.isArray(v) ? { ...(base[k] ?? {}), ...v } : v);
  }
  o.look = name;
  return o;
}
export function imagery(name) { const I = get(name).imagery; return { haze: I.haze, grade: I.grade }; }

// ------------------------------------------------------------------ LUT writer
export function cube(name, N = 33) {
  const lines = [`TITLE "better-videos look: ${name}"`, `# generated by engine/looks.js from documented curves; do not edit by hand`, `LUT_3D_SIZE ${N}`, 'DOMAIN_MIN 0 0 0', 'DOMAIN_MAX 1 1 1'];
  for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++)
    lines.push(gradePixel(r / (N - 1), g / (N - 1), b / (N - 1), name).map(x => x.toFixed(4)).join(' '));
  return lines.join('\n') + '\n';
}

// ------------------------------------------------------------------ CLI
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const [cmd, ...a] = process.argv.slice(2);
  const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  if (cmd === 'write') {
    const N = Number(opt('size', 33)); fs.mkdirSync(path.join(ROOT, 'engine/grade'), { recursive: true });
    for (const n of (a[0] && !a[0].startsWith('--') ? [a[0]] : names())) { const t = Date.now(); fs.writeFileSync(path.join(ROOT, lutFile(n)), cube(n, N)); console.log(`[looks] ${lutFile(n)} (${N}^3, ${Date.now() - t} ms)`); }
  } else if (cmd === 'apply') {
    // finish.mjs imports this module, so run it as its own process (no circular top-level await)
    const { execFileSync } = await import('node:child_process');
    execFileSync(process.execPath, ['--no-warnings', path.join(ROOT, 'engine/grade/finish.mjs'), ...a], { stdio: 'inherit' });
  } else if (cmd === 'swatch') {
    const n = a[0] ?? 'bright-day';
    const sw = { 'skin #c58c6b': '#c58c6b', 'sea #2aa6a8': '#2aa6a8', 'cyan sea #3fb5a0': '#3fb5a0', 'sky #7fb0e0': '#7fb0e0', 'sand #d9c08a': '#d9c08a', 'grass #5a9a3a': '#5a9a3a', 'red #e0241b': '#e0241b', 'grey18 #767676': '#767676', 'white #f4f4f4': '#f4f4f4', 'black #0a0a0a': '#0a0a0a' };
    const hx = (v) => '#' + v.map(x => Math.round(clamp(x) * 255).toString(16).padStart(2, '0')).join('');
    for (const [k, h] of Object.entries(sw)) { const n0 = parseInt(h.slice(1), 16); console.log(k.padEnd(20), '->', hx(gradePixel(((n0 >> 16) & 255) / 255, ((n0 >> 8) & 255) / 255, (n0 & 255) / 255, n))); }
  } else console.log('usage: node engine/looks.js write [name] [--size 33] | apply <in> <out> <look> | swatch <look>');
}
