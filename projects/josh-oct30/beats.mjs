// Graphics for Josh's 30 Oct talk "Buy from a motivated seller" in the min style (render.mjs --full --min):
// a few crisp words per beat, marker scribbles and handwritten notes. Beats are at SOURCE seconds.
import fs from 'node:fs';
import { h1, h2, tag, note, under, circle, strike, arrow, list, num, squiggle } from '../owners-academy-sales/vsl/min-kit.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));
const PARTS = Object.keys(S).filter((id) => id.startsWith('lf~lf#')).sort((a, b) => S[a].in - S[b].in);
// source seconds -> programme seconds (pauses cut), so a delay that crosses a cut still lands on its word
const outT = (src) => { let t = 0; for (const id of PARTS) { const p = S[id]; if (src < p.out) return t + Math.max(0, src - p.in); t += p.out - p.in; } return t; };
const WORDS = PARTS.flatMap((id) => S[id].words.map(([w, a]) => [w.toLowerCase().replace(/[^a-z0-9$%']/g, ''), S[id].in + a]));
const wt = (w, after) => { const f = WORDS.find(([x, a]) => x.startsWith(w) && a >= after - 0.01); if (!f) throw new Error(`word ${w} after ${after}`); return f[1]; };
// delay inside a beat starting at source time b, landing on word w (searched from `after`, default b)
const R = (b, w, after = b) => +(outT(wt(w, after)) - outT(b)).toFixed(2);

const longBeats = [
  [2.6, tag('No capital to put in?') + h1(`Buy from a ${circle('motivated', R(2.6, 'motivated'))} seller.`, 0.2)],
  [36.0, h2('Be a <k>disciplined</k> deal maker.', 0.2) + note('find your own deals', R(36.0, 'find', 44))],
  [53.2, num(9, 0.1, { suf: ' of 10' }) + note('owners won’t do a deal', R(53.2, 'not'))],
  [61.3, tag('Look for the one who says') + h1(`“I ${under('need', R(61.3, 'need'), true)} to sell.”`, 0.2)],
  [77.5, h2(strike('“I might sell.”', R(77.5, 'might') + 0.4), 0.2) + note('not this one', R(77.5, 'thinking'))],
  [93.2, h2('Undecided sellers want <k>cash</k>.', 0.2)],
  [117.0, h1(strike('Fire sale', R(117.0, 'fire') + 0.5), 0.1) + note('a business heading to zero', R(117.0, 'going', 120))],
  [139.4, tag('The opportunity') + h1('The <k>silver tsunami</k>.', R(139.4, 'silver'))],
  [151.7, h2('Owners ready to <k>retire</k>.', 0.2) + note('great businesses, not failing', R(151.7, 'great', 160))],
  [168.5, h1('$1–2M', 0.1) + note('funding their lifestyle for 20 years', R(168.5, 'supporting'))],
  [181.2, h2('Not motivated by <k>money</k>.', 0.2) + squiggle(R(181.2, 'money', 182))],
  [197.0, tag('Why they sell') + list([['Family', R(197.0, 'daughter')], ['Moving', R(197.0, 'move')], ['Relocating', R(197.0, 'relocate')]])],
  [209.1, h2(`Selling ≠ ${under('failing', R(209.1, 'failing'))}.`, 0.2)],
  [230.5, h2('No money down needs a <k>motivated</k> seller.', 0.2)],
  [255.0, num(99.9, 0.2, { suf: '%', dec: 1 }) + note('happy to take money over time', R(255.0, 'happy'))],
  [287.8, h2('They think it’s worth <k>more</k>.', 0.2) + note('sentimental value', R(287.8, 'sentimental'))],
  [315.6, h2('$250K profit.', 0.2) + h2('<d>$500K offer.</d>', R(315.6, 'here', 322))],
  [342.3, h1(`Profit ≠ ${circle('cash', R(342.3, 'cash'))}.`, 0.2)],
  [366.0, tag('Private equity') + h2('Won’t do <k>vendor finance</k>.', R(366.0, 'vendor'))],
  [389.8, h1('Overpaying <k>hurts</k>.', 0.2)],
  [409.1, h2(`Value = ${under('headcount', R(409.1, 'headcount'))} × use`, 0.2)],
  [422.1, h1('Half the staff <k>leave</k>.', R(422.1, 'half', 439)) + note('a cash flow cost', R(422.1, 'cost'))],
  [456.5, tag('The fix') + h1(under('Vendor finance', R(456.5, 'vendor') + 0.6, true), R(456.5, 'vendor') - 0.3)],
  [467.8, num(100, 0.3, { suf: '%' }) + note('vendor finance, in healthcare', R(467.8, 'healthcare'))],
  [486.6, h2(`“${strike('Impossible', R(486.6, 'impossible') + 0.4)}.”`, 0.2) + note('what most people teach', 0.9)],
  [496.8, h1('Create your own <k>reality</k>.', 0.2)],
  [515.4, tag('First ever deal') + h2('<k>Six figures</k> out on day one.', R(515.4, 'pulled')) + note('100% vendor finance', R(515.4, 'vendor'))],
  [528.3, h2('“Never seen a deal like it.”', 0.2) + note('40 years in corporate finance', R(528.3, 'career'))],
  [555.4, tag('Remember') + h1(`Find the ${under('motivated', R(555.4, 'motivated', 562), true)} seller.`, 0.2) + arrow(R(555.4, 'onwards'))],
];

export const beats = {};
for (const [t, html] of longBeats) {
  const p = PARTS.find((id) => t >= S[id].in - 0.05 && t < S[id].out) ?? PARTS.find((id) => S[id].in > t);
  if (p) (beats[p] ||= []).push({ at: +Math.max(0, t - S[p].in).toFixed(2), html });
}

// Clips: one hook over the whole clip, its key word marked
const hook = (h) => [{ at: 0, html: tag('Josh Li · JC Health Group', 0) + h1(h, 0.2) }];
Object.assign(beats, {
  'c1~cl#1': hook(`Buy from a ${circle('motivated', 1.0)} seller.`),
  'c2~cl#1': hook(`The ${under('silver tsunami', 1.0, true)}.`),
  'c3~cl#1': hook(`Why owners ${circle('overvalue', 1.0)}.`),
  'c4~cl#1': hook(`${under('100%', 0.9, true)} vendor finance.`),
});
