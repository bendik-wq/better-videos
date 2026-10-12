// BLACKOUT LAB: look-dev for episode 4 (LIVE WIRE).
//   LAB=reel   (default)  a ~60 s reel of the signature sets, with the project transitions and sounds
//   LAB=cold              the cold-open oner (~40 s) alone
//   LAB=screens|grid|rooms|still|outside|orbit|footage   a shot list per set family, for stills
// Usage: LAB=reel node engine/render.mjs projects/blackout-lab [--draft] [--stills=0.5]
import { scoreTransitions, transitionCues } from '../blackout/cuts.mjs';
const LAB = process.env.LAB ?? 'reel';
const S = (id, set, params = {}, extra = {}) => ({ id, set, params, min: 4, ...extra });

// A ~60 s reel: one beat per signature set, cut with the LIVE WIRE transitions (power cuts) and their sounds.
const reel = [
  S('r-scope', 'scope', { mode: 'steady', label: 'GRID FREQUENCY · 50 Hz' }, { min: 3.0 }),
  S('r-chapter', 'chapter', { num: 1, title: 'The Afternoon', sub: 'IVANO-FRANKIVSK · 23 DEC 2015' }, { min: 3.6, params: { num: 1, title: 'The Afternoon', sub: 'IVANO-FRANKIVSK · 23 DEC 2015', trans: 'crt-collapse' } }),
  S('r-cursor', 'cursor', { mode: 'click', move: 0.4, click: 2.8, caption: 'RECONSTRUCTION' }, { min: 5.0 }),
  S('r-oneline', 'oneline', { mode: 'full', drawDur: 2.4, at: 4.2 }, { min: 7.5 }),
  S('r-scope2', 'scope', { mode: 'drop', at: 0.4, span: 2.2, label: 'GRID FREQUENCY · UKRAINE' }, { min: 3.6, params: { mode: 'drop', at: 0.4, span: 2.2, label: 'GRID FREQUENCY · UKRAINE', trans: 'flicker-out' } }),
  S('r-room', 'control-room', { mode: 'dark', at: 0.8, caption: 'BACKUP POWER FAILING' }, { min: 4.8 }),
  S('r-flash1', 'flash', { object: 'mouse', caption: 'A MOUSE. NOBODY TOUCHING IT.' }, { min: 2.2, params: { object: 'mouse', caption: 'A MOUSE. NOBODY TOUCHING IT.', trans: 'flash-pop' } }),
  S('r-flash2', 'flash', { object: 'phone', caption: 'OFF THE HOOK' }, { min: 2.0, params: { object: 'phone', caption: 'OFF THE HOOK', trans: 'flash-pop' } }),
  S('r-flash3', 'flash', { object: 'breaker-handle', caption: 'Q13 · OFF' }, { min: 2.0, params: { object: 'breaker-handle', caption: 'Q13 · OFF', trans: 'flash-pop' } }),
  S('r-flash4', 'flash', { object: 'server', caption: 'ONE SERVER. GHANA.', stamp: '17 06 27' }, { min: 2.2, params: { object: 'server', caption: 'ONE SERVER. GHANA.', stamp: '17 06 27', trans: 'flash-pop' } }),
  S('r-sub0', 'substation', { mode: 'wide', caption: 'SUBSTATION · NIGHT' }, { min: 3.4, params: { mode: 'wide', caption: 'SUBSTATION · NIGHT', trans: 'breaker-clunk' } }),
  S('r-sub', 'substation', { mode: 'breaker', close: 2.2, caption: 'CLOSED BY HAND' }, { min: 4.2 }),
  S('r-city', 'city-dark', { mode: 'blackout', at: 0.6, caption: 'BLOCK BY BLOCK' }, { min: 4.6 }),
  S('r-terminal', 'terminal', { text: 'open_breaker --rtu SS-07 --cb Q13', mode: 'enter', caption: 'RECONSTRUCTION' }, { min: 4.6 }),
  S('r-map', 'map-ops', { view: 'both' }, { min: 4.0 }),
  S('r-orbit', 'orbit-lights', { view: 'europe', region: 'three', at: 0.8, span: 2.6 }, { min: 4.0 }),
  S('r-orbit2', 'orbit-lights', { view: 'region', region: 'ivano-frankivsk', at: 0.4, span: 2.4, caption: 'DISTRICT BY DISTRICT' }, { min: 3.8, params: { view: 'region', region: 'ivano-frankivsk', at: 0.4, span: 2.4, caption: 'DISTRICT BY DISTRICT', trans: 'match-dissolve' } }),
  S('r-quote', 'quote', { text: 'You don’t need to break the grid. You just log in.', big: true }, { min: 3.6 }),
  S('r-title', 'title', { sub: 'EPISODE 4 · LIVE WIRE' }, { min: 5.0, params: { sub: 'EPISODE 4 · LIVE WIRE', trans: 'crt-collapse' } }),
];

const LISTS = {
  reel,
  cold: [{ id: 'cold', set: 'cold-open', params: { caption: 'RECONSTRUCTION' }, min: 40 }],
  screens: [
    S('scope-steady', 'scope', { mode: 'steady' }), S('scope-drop', 'scope', { mode: 'drop', at: 0.6, span: 2.5 }, { min: 5 }),
    S('scope-corner', 'scope', { mode: 'corner', at: 0.5, text: '230,000 PEOPLE. SIX HOURS IN THE DARK.' }),
    S('chapter', 'chapter', { num: 1, title: 'The Phantom Cursor', sub: 'IVANO-FRANKIVSK · 23 DEC 2015' }, { min: 5 }),
    S('title', 'title', { sub: 'EPISODE 4' }, { min: 6 }), S('end', 'scope', { mode: 'end', at: 1.2 }, { min: 5 }),
    S('numbers', 'numbers', { items: [{ value: 230000, sub: 'customers lost power' }], scope: 'stutter' }),
    S('quote', 'quote', { text: '“The cursor started moving on its own, toward the breakers.”', by: 'Operator account' }),
    S('map-kyiv', 'map-ops', { view: 'kyiv' }), S('map-ne', 'map-ops', { view: 'northeast', cascadeAt: 0.5 }, { min: 6 }),
    S('map-littleton', 'map-ops', { view: 'littleton' }), S('map-poland', 'map-ops', { view: 'poland' }), S('map-both', 'map-ops', { view: 'both' }),
  ],
  grid: [S('cursor-click', 'cursor', { mode: 'click', move: 0.5, click: 3.6 }, { min: 6 }), S('cursor-drift', 'cursor', { mode: 'drift', zoom: 14 }), S('oneline-full', 'oneline', { mode: 'full', drawDur: 3, at: 5.5 }, { min: 9 })],
  rooms: [S('cr-wide', 'control-room', { mode: 'wide' }), S('cr-shoulder', 'control-room', { mode: 'shoulder', caption: 'RECONSTRUCTION' }, { min: 6 }), S('cr-hand', 'control-room', { mode: 'hand' }), S('cr-dark', 'control-room', { mode: 'dark', at: 0.8 }, { min: 6 }), S('cr-profile', 'control-room', { mode: 'profile' })],
  still: [
    S('flash-mouse', 'flash', { object: 'mouse', caption: 'A MOUSE. NOBODY TOUCHING IT.' }, { min: 2.4 }), S('flash-breaker', 'flash', { object: 'breaker-handle', caption: 'BREAKER HANDLE' }, { min: 2.2 }),
    S('flash-phone', 'flash', { object: 'phone', caption: 'OFF THE HOOK' }, { min: 2.2 }), S('flash-usb', 'flash', { object: 'usb' }, { min: 2 }),
    S('flash-transformer', 'flash', { object: 'transformer', caption: 'SNOW ON THE TRANSFORMER' }, { min: 2.2 }), S('flash-server', 'flash', { object: 'server', caption: 'ONE SERVER. GHANA.' }, { min: 2.4 }),
    S('flash-led', 'flash', { object: 'led' }, { min: 2 }), S('flash-printout', 'flash', { object: 'printout', caption: 'THE EVENT LOG' }, { min: 2.2 }), S('flash-usb2', 'flash', { object: 'usb', stamp: '15 06 05' }, { min: 2 }),
    S('doc-ind', 'doc', { mode: 'indictment', highlight: true }, { min: 6 }), S('doc-adv', 'doc', { mode: 'advisory', highlight: true }, { min: 6 }),
    S('terminal', 'terminal', { text: 'open_breaker --rtu SS-07 --cb Q13', mode: 'enter', caption: 'RECONSTRUCTION' }, { min: 6 }),
    S('printout', 'quote', { mode: 'printout', text: 'The outage was caused by people. Using the power company’s own software.', by: 'SANS / E-ISAC, 2016' }, { min: 6 }),
  ],
  outside: [S('sub-wide', 'substation', { mode: 'wide', caption: 'SUBSTATION · NIGHT' }, { min: 5 }), S('sub-breaker', 'substation', { mode: 'breaker', close: 2.5, caption: 'CLOSED BY HAND' }, { min: 5 }), S('sub-ice', 'substation', { mode: 'ice' }, { min: 4 }), S('city-blackout', 'city-dark', { mode: 'blackout', at: 0.8, caption: 'BLOCK BY BLOCK' }, { min: 6 })],
  orbit: [S('ol-europe', 'orbit-lights', { view: 'europe', region: 'three', at: 1 }, { min: 5 }), S('ol-region', 'orbit-lights', { view: 'region', region: 'ivano-frankivsk', at: 0.8, span: 3 }, { min: 5 })],
  footage: [S('ft-mcc', 'footage', { file: 'command-apollo-mcc-1969', grade: 'fluoro', caption: 'CONTROL ROOM', source: 'NASA · PUBLIC DOMAIN' }, { min: 4 }), S('ft-server', 'footage', { file: 'server-nasa-ames-modular', grade: 'fluoro', caption: 'SERVER ROOM', source: 'NASA · PUBLIC DOMAIN' }, { min: 4 }), S('ft-orbit', 'footage', { file: 'orbit-night-cities-exp67b', grade: 'night', caption: 'CITIES AT NIGHT', source: 'NASA · ISS · PUBLIC DOMAIN' }, { min: 4 })],
};
const shots = LISTS[LAB] ?? reel;
export default {
  title: `Blackout lab (${LAB})`, fps: 60, width: 1920, height: 1080,
  settings: { fps: 60, aa: 'fxaa', look: 'live-wire', cutGuard: 1.5, crf: 18, workers: 2 },
  voice: { engine: 'kokoro', name: 'af_heart', speed: 0.98 },
  timing: { padIn: 0.15, padOut: 0.4 },
  shots,
  score: { key: 'D', drone: 0.12, transitions: scoreTransitions(shots), cues: transitionCues(shots),
    music: [{ shot: shots[0].id, mood: 'tension', key: 'D', intensity: [0.3, 0.6] }], silenceDrone: shots.filter(s => ['chapter', 'title'].includes(s.set)).map(s => s.id) },
};
