// Graphics for the full-talk cut (industry-full). Every beat from the short and long cuts is placed at
// the same moment of the source recording, plus beats for the sections only the full cut contains.
// Writes beats-full.json (part id -> beats), which beats.mjs merges in.
//   node gen-full-beats.mjs
import fs from 'node:fs';
import { beats } from './beats.mjs';
import { eb, big, list } from '../owners-academy-sales/vsl/beats.mjs';

const s = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));
const cut = JSON.parse(fs.readFileSync(new URL('./clips.json', import.meta.url))).cuts['industry-full'];
const parts = cut.sequence.filter((x) => typeof x === 'string');

// beats at absolute source seconds, for footage only the full cut uses
const extra = [
  [91.5, eb('Why healthcare fits Josh') + big('He <em>looks the part</em>.', 0.3)],
  [107.4, eb('Why healthcare fits Josh') + big('In a suit, people <em>aren\'t taken aback</em>.', 0.6, 'mid')],
  [245.3, eb('Deal #1 · the backstory') + big('Back in the car park, <em>reflecting</em>.', 1.2, 'mid')],
  [272.7, eb('Deal #1') + big('Back to the <em>call back</em>.', 0.2)],
  [307.2, eb('"Boom, boom, we\'re in business"') + big('Meaning: the <em>conversation started</em>.', 1.8, 'mid')],
  [362.8, eb('Josh\'s own role') + list([['The energy', 0], ['The passion', 0], ['Doing what no one else wants to do', 0.8]])],
  [409.9, eb('Josh\'s fit') + big('The <em>sophisticated</em> end of the continuum.', 7.6, 'mid')],
  [523.8, eb('Josh on GP clinics') + big('Nine times out of ten, you leave with a <em>prescription</em>.', 5.6, 'mid')],
  [562.4, eb('Josh on the GP model') + big('It can feel <em>condescending</em>.', 2.4, 'mid')],
  [608.0, eb('Josh on the GP model') + big('"Take this pill. <em>It\'ll fix you.</em>"', 1.0, 'mid')],
  [612.4, eb('Josh on the GP model') + big('"Trust in the pill. Trust in the <em>man-made thing</em>."', 0.4, 'mid')],
  [621.5, eb('Josh on the GP model') + big('What kind of <em>care</em> is that?', 0.6)],
];

const abs = [];
for (const [key, list_] of Object.entries(beats)) {
  if (!s[key] || key.startsWith('all-')) continue;
  for (const b of list_) abs.push([+(s[key].in + b.at).toFixed(2), b.html]);
}
abs.push(...extra);
abs.sort((a, b) => a[0] - b[0]);

const out = {};
const seen = new Set();
for (const [t, html] of abs) {
  if (seen.has(`${t}|${html}`)) continue; // same beat used by both the short and long cuts
  seen.add(`${t}|${html}`);
  // the part playing at t; if t falls in a trimmed silence, the next part
  const p = parts.find((id) => t >= s[id].in - 0.05 && t < s[id].out) ?? parts.find((id) => s[id].in > t);
  if (!p) continue;
  (out[p] ||= []).push({ at: +Math.max(0, t - s[p].in).toFixed(2), html });
}
fs.writeFileSync(new URL('./beats-full.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(`${Object.values(out).flat().length} beats over ${Object.keys(out).length} parts`);
