// Graphics for Josh's 27 Oct talk "Having no money isn't the obstacle" in the clean full-screen style
// (render.mjs --full --clean): heavy Inter headlines, thin white line drawings that draw on with ease-in-out.
// Long-form beats are at SOURCE seconds and land on whichever clip plays that moment.
import fs from 'node:fs';
import { eb, big, small } from '../owners-academy-sales/vsl/beats.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));
const PARTS = ['lf-1', 'lf-2', 'lf-3', 'lf-4', 'lf-5', 'lf-6', 'lf-7', 'lf-8'].filter((id) => S[id]);
// source seconds -> seconds in the edited programme (pauses cut), so delays that cross a cut still land on the word
const outT = (src) => { let t = 0; for (const id of PARTS) { const p = S[id]; if (src < p.out) return t + Math.max(0, src - p.in); t += p.out - p.in; } return t; };
const WORDS = PARTS.flatMap((id) => S[id].words.map(([w, a]) => [w.toLowerCase().replace(/[^a-z0-9$%']/g, ''), S[id].in + a]));
// source time of the first word matching `w` at or after `after`
const wt = (w, after) => { const f = WORDS.find(([x, a]) => x === w && a >= after - 0.01); if (!f) throw new Error(`word ${w} after ${after}`); return f[1]; };
// delay inside a beat that starts at source time b, for something that should land on word w (searched from `after`, default b)
const R = (b, w, after = b) => +(outT(wt(w, after)) - outT(b)).toFixed(2);

// ---- clean line-art helpers (every stroke draws on: data-draw, start data-d, duration data-dur) ----
const P = (d, at, dur = 0.8, cls = '') => `<path ${cls ? `class="${cls}" ` : ''}data-draw data-d="${at}" data-dur="${dur}" d="${d}"/>`;
const svg = (w, h, inner, style = '') => `<svg class="ln" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="${style}">${inner}</svg>`;
// a soft hand-ruled underline (one gentle curve, not wobbly)
const under = (at, w = 360, gold = false) => svg(w, 16, P(`M2 10 C ${w * 0.3} 4, ${w * 0.65} 14, ${w - 2} 7`, at, 0.7, gold ? 'g' : ''), 'margin-top:-4px');
// ring drawn around a word (ellipse with a small overshoot)
const ring = (word, at) => `<span class="ring">${word}<svg class="ln" viewBox="0 0 100 50" preserveAspectRatio="none">${P('M88 12 C 70 0, 18 2, 6 18 C -4 34, 30 50, 62 47 C 92 44, 104 26, 86 10 C 80 5, 70 3, 60 3', at, 0.9, 'g')}</svg></span>`;
const tick = (at) => svg(40, 40, P('M7 21 L16 30 L33 10', at, 0.45, 'g'));
const cross = (at) => svg(40, 40, P('M10 10 L30 30', at, 0.25) + P('M30 10 L10 30', at + 0.18, 0.25));
const arrowR = (at, w = 120) => svg(w, 30, P(`M2 15 L${w - 6} 15`, at, 0.5) + P(`M${w - 20} 4 L${w - 4} 15 L${w - 20} 26`, at + 0.4, 0.3));
const bank = (at) => svg(130, 120, P('M10 40 L65 10 L120 40 Z', at, 0.7) + [28, 52, 78, 102].map((x, i) => P(`M${x} 48 L${x} 96`, at + 0.5 + i * 0.08, 0.35)).join('') + P('M8 104 L122 104', at + 0.9, 0.4));
const chart = (at) => svg(170, 120, P('M10 10 L10 110 L165 110', at, 0.7) + P('M22 92 L60 70 L92 80 L150 24', at + 0.6, 0.8, 'g') + P('M132 22 L151 23 L148 42', at + 1.3, 0.3, 'g'));
const checks = (rows) => `<div class="chk">${rows.map(([t, at, ok = true]) =>
  `<div class="r${ok ? '' : ' no'}" data-d="${at}">${ok ? tick(at + 0.15) : cross(at + 0.15)}<span>${t}</span></div>`).join('')}</div>`;
const vs = (a, b, at) => `<div class="row2"><div data-d="${at}"><div class="h">${a[0]}</div><div class="s">${a[1]}</div></div>` +
  svg(2, 170, P('M1 0 L1 170', at + 0.4, 0.6)) + `<div data-d="${at + b[2]}"><div class="h">${b[0]}</div><div class="s">${b[1]}</div></div></div>`;
const frac = (top, bot, res, at) => `<div class="frac"><div class="f"><div data-d="${at}">${top}</div>${svg(330, 6, P('M2 3 L328 3', at + 0.4, 0.6))}<div data-d="${at + 0.7}">${bot}</div></div>` +
  `<div data-d="${at + 1.4}">=</div><div class="res" data-d="${at + 1.8}">${res}</div></div>`;

const longBeats = [
  [0.4, eb('Buying a profitable company') + big(`Having no money is <em>not</em> the obstacle.`, 0.2) + under(1.6, 420)],
  [17.7, eb('Here’s why') + big(`A bank lends against the <em>business</em>.`, 0.2) + big('Not you.', R(17.7, 'not', 26), 'mid') + bank(1.4)],
  [30.4, eb('But only if') + big(`You talk to the <em>right</em> bankers.`, 0.2, 'mid')],
  [36.9, eb('Who to talk to') + checks([['Home-loan banker', 0.3, false], ['General business banker', R(36.9, 'general'), false], ['Banker who knows your industry', R(36.9, 'industry', 78)]])],
  [94.0, eb('Tell an industry banker you’re rolling up') + `<div class="quote" data-d="0.3">“Oh, what a great idea.”</div><div class="quote" data-d="${R(94.0, 'good', 106)}" style="color:rgba(255,255,255,.55)">“Good luck. It’s hard.”</div>`],
  [119.7, eb('So what is the obstacle?') + big(`It’s <em>not</em> the money.`, 0.2)],
  [125.3, eb('The banker') + big(`Funds the ${ring('asset', R(125.3, 'asset'))}. Not you.`, 0.2)],
  [135.7, eb('So present your deal') + big(`As an asset that <em>spits out cash</em>.`, 0.2, 'mid') + chart(2.0)],
  [160.1, eb('Not Shark Tank') + vs(['Shark Tank', 'Funds the entrepreneur'], ['Business lenders', 'Fund the company', R(160.1, 'lenders')], 0.2)],
  [192.1, small('They may still want security and personal guarantees. That’s a separate conversation.', 0.2)],
  [209.1, eb('The only question') + big(`Is this asset ${ring('bankable', R(209.1, 'bankable'))}?`, 0.2) + small('Can it spit out enough cash to make the repayments?', R(209.1, 'cash'))],
  [219.5, eb('Why most people don’t get the loan') + vs(['Home loans', 'Simple. Low variability.'], ['Business', 'More risk, more variability.', R(219.5, 'business', 222)], 0.2) + small('They don’t know how to <b>present it</b>.', R(219.5, 'present'))],
  [248.2, eb('What the bank wants to see') + checks([['Revenue', 0.2], ['Profitability', R(248.2, 'profitability')], ['Super paid', R(248.2, 'superannuation')], ['Tax paid', R(248.2, 'tax')], ['A trading history', R(248.2, 'trading')]])],
  [290.7, eb('Tick those boxes and the lender asks') + big(`“How much do you <em>want</em>?”`, 0.2, 'mid') + small('It’s about presenting the case.', R(290.7, 'presenting'))],
  [298.8, eb('The number that matters') + frac('Free cash flow', 'Debt repayments', 'DSCR', R(298.8, 'free', 303)) + under(R(298.8, 'dscr') + 1.4, 300, true)],
  [310.1, small('More on DSCR, and finding how much cash a business really makes, in Josh’s other videos.', 0.2)],
  [322.7, big(`It’s not about how much money <em>you</em> have.`, 0.2, 'mid')],
  [332.1, eb('Behind the clinic') + small('“A filthy smoker in a healthcare environment.”', 0.3)],
  [368.9, eb('Remember') + big(`You don’t need money to buy a company.`, 0.2, 'mid') + big(`You need a company that’s <em>making</em> money.`, R(368.9, 'need', 375), 'mid') + arrowR(R(368.9, 'onwards'))],
];

export const beats = {};
const longParts = ['lf-1', 'lf-2', 'lf-3', 'lf-4', 'lf-5', 'lf-6', 'lf-7', 'lf-8'];
for (const [t, html] of longBeats) {
  const p = longParts.find((id) => S[id] && t >= S[id].in - 0.05 && t < S[id].out) ?? longParts.find((id) => S[id] && S[id].in > t);
  if (p) (beats[p] ||= []).push({ at: +Math.max(0, t - S[p].in).toFixed(2), html });
}

// Reels: one hook headline over the whole clip
const hook = (h) => [{ at: 0, html: eb('Josh Li · Founder, JC Health Group', -1) + big(h, -1, 'mid') }];
Object.assign(beats, {
  'rl1-a~ig#1': hook('No money is <em>not</em> the obstacle.'),
  'rl2-a~ig#1': hook('The bank funds the <em>asset</em>. Not you.'),
  'rl3-a~ig#1': hook('Is your deal <em>bankable</em>?'),
  'rl4~ig#1': hook('What the bank wants to see <em>before it lends</em>.'),
});

// Reel 4: Josh turns away from the camera while listing what the bank checks, so that part plays under a card
const rl4List = Object.keys(S).find((id) => id.startsWith('rl4~ig#') && S[id].in <= 259 && S[id].out > 260);
// delay (s from the part's start) of a word in that part
const at = (w) => S[rl4List].words.find(([x]) => x.toLowerCase().startsWith(w))[1];
export const covers = rl4List ? {
  [rl4List]: { html: eb('What the bank wants to see') + checks([['Revenue', 0.1], ['Profitability', at('profitability')], ['Super paid', at('superannuation')], ['Tax paid', at('tax')]]) },
} : {};
