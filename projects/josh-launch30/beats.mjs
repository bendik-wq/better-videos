// Graphics for the 30 Oct "launch-style" cut (render.mjs --full --launch). The cut is 27 short parts in launch order;
// the composite alternates a wide and a tight framing on every part (complaunch.py, same rule as CAM below), so type is
// placed in the free side of whichever framing is on screen. Times are programme seconds, landed on spoken words.
import fs from 'node:fs';
import { typed, tab, mono, obox, brackets, line, strike, stat, lower, panel, bar, shade } from '../owners-academy-sales/vsl/launch-kit.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));
const SEQ = JSON.parse(fs.readFileSync(new URL('./clips.json', import.meta.url))).cuts.launch.sequence;
const PS = {}; { let acc = 0; for (const id of SEQ) { PS[id] = acc; acc += S[id].out - S[id].in; } }
export const CAM = Object.fromEntries(SEQ.map((id, i) => [id, i % 2 ? 't' : 'w']));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9%']/g, '');
// programme time of the n-th word in part `id` that starts with `w`
const T = (id, w, n = 0) => {
  const f = S[id].words.filter((x) => norm(x[0]).startsWith(norm(w)))[n];
  if (!f) throw new Error(`no "${w}" in ${id}`);
  return PS[id] + f[1];
};
// typed words: "shown|spoken" tokens, matched in order inside one part; returns [[shown, programme time], ...]
const said = (id, text) => {
  let k = 0;
  return text.split(' ').map((tok) => {
    const [shown, sp] = tok.split('|'); const spoken = (sp ?? shown).replace(/<\/?k>/g, '');
    const ws = S[id].words;
    while (k < ws.length && !norm(ws[k][0]).startsWith(norm(spoken))) k++;
    if (k >= ws.length) throw new Error(`no "${spoken}" in ${id}`);
    return [shown, PS[id] + ws[k++][1]];
  });
};
export const beats = {};
// one beat from programme time t0; fn gets d(time) -> seconds after t0, and rel(pairs) to shift said() pairs
const B = (id, t0, fn) => {
  const d = (t) => +Math.max(0, t - t0).toFixed(3);
  const rel = (pairs) => pairs.map(([w, t]) => [w, d(t)]);
  (beats[id] ||= []).push({ at: +(t0 - PS[id]).toFixed(3), html: fn(d, rel) });
};
const start = (id) => PS[id] + 0.02;

// 1. hook: what most people teach
B('hook~ln#1', start('hook~ln#1'), (d, rel) => shade('l') + mono('What most people teach', 0.1, { x: 96, y: 330 }) +
  typed(rel(said('hook~ln#1', 'How|how to buy businesses')), { x: 92, y: 380, size: 104, w: 560 }));
B('hook~ln#2', start('hook~ln#2'), (d, rel) => shade('r') +
  typed(rel(said('hook~ln#2', '100%|100 <k>vendor</k> <k>finance.</k>|finance')), { x: 1440, y: 330, size: 112, w: 420 }));
B('hook~ln#3', start('hook~ln#3'), (d) => shade('l') +
  obox(typed([['Impossible.', d(T('hook~ln#3', 'impossible'))]], { size: 116 }), d(T('hook~ln#3', 'impossible')) + 0.3, { x: 80, y: 400 }));
B('hook~ln#4', start('hook~ln#4'), (d) => shade('r') + tab('“It’s a scam.”', d(T('hook~ln#4', 'scam')) - 0.15, { x: 1500, y: 470, size: 44 }));

// 2. who: name, and the line that earns the right to say it
B('done~ln#1', start('done~ln#1'), (d, rel) => shade('l') +
  typed(rel(said('done~ln#1', 'I’ve|literally done the <k>deals.</k>')), { x: 92, y: 330, size: 100, w: 600 }) +
  lower('Josh Li', 'FOUNDER, JC HEALTH GROUP · G&amp;L M&amp;A ADVISORY', 0.5, { x: 96, y: 880 }));

// 3. the question, then a full-screen insert for the answer
B('type~ln#1', start('type~ln#1'), (d, rel) => shade('r') + mono('The question', 0.1, { x: 1508, y: 300 }) +
  typed(rel(said('type~ln#1', 'No|no capital to put in?|into')), { x: 1504, y: 340, size: 76, w: 360 }));
B('type~ln#1', T('type~ln#1', 'going', 1) - 0.1, (d) => panel(
  mono('The answer', 0.15, { x: 200, y: 380, dark: true }) +
  typed([['Buy', 0.3], ['from', 0.45], ['a', 0.6]], { x: 196, y: 430, size: 132, dark: true }) +
  obox(typed([['<k>motivated</k>', d(T('type~ln#1', 'motivated'))], ['seller.', d(T('type~ln#1', 'seller'))]], { size: 132, dark: true }),
    d(T('type~ln#1', 'seller')) + 0.35, { x: 180, y: 570, dark: true }), 0, { grid: true }));

// 4. nine in ten won't
B('nine~ln#1', start('nine~ln#1'), (d) => shade('l') + stat(9, d(T('nine~ln#1', 'nine')), { x: 90, y: 330, suf: '/10' }) +
  tab('owners won’t do a deal', d(T('nine~ln#1', 'deal')) - 0.2, { x: 104, y: 560 }));
// 5. the one who needs to sell
B('one~ln#1', start('one~ln#1'), (d, rel) => shade('r') + mono('The one in ten', d(T('one~ln#1', 'one', 1)), { x: 1508, y: 300 }) +
  typed(rel(said('one~ln#1', '“I <k>need</k> to sell.”|sell')), { x: 1504, y: 340, size: 96, w: 380 }));
// 6. not a fire sale
B('fire~ln#1', start('fire~ln#1'), (d, rel) => shade('l') + mono('Not this', 0.05, { x: 96, y: 410 }) +
  typed(rel(said('fire~ln#1', 'A|a fire sale.')), { x: 92, y: 450, size: 110 }) + strike(86, 600, 510, d(T('fire~ln#1', 'sale')) + 0.4));
// 7. the opportunity -> black title moment
B('tsunami~ln#1', start('tsunami~ln#1'), (d) => shade('r') + tab('<small>Right now</small>The opportunity', d(T('tsunami~ln#1', 'opportunity')), { x: 1440, y: 470 }));
B('tsunami~ln#2', start('tsunami~ln#2'), (d) => panel(
  typed([['The', d(T('tsunami~ln#2', 'the'))], ['<k>silver</k>', d(T('tsunami~ln#2', 'silver'))], ['<k>tsunami.</k>', d(T('tsunami~ln#2', 'tsunami'))]],
    { x: 0, y: 470, w: 1920, size: 150, align: 'center' }), 0, { black: true }));
// 8. who they are: an insert with three labels wiring into one box
B('retire~ln#1', T('retire~ln#1', 'owners'), (d) => {
  const L = [['Ready to retire', d(T('retire~ln#1', 'retire')), 330], ['Business is great', d(T('great~ln#1', 'great')), 480], ['They’re fine', d(T('great~ln#1', 'fine')), 630]];
  return panel(mono('The seller you want', 0.1, { x: 200, y: 230, dark: true }) +
    L.map(([t, at, y]) => tab(t, at, { x: 200, y, size: 40 }) + line(`M${560} ${y + 33} C 760 ${y + 33}, 820 520, 1060 520`, at + 0.15, { dark: true })).join('') +
    `<div style="left:1080px;top:440px;width:640px;height:160px">${obox(typed([['A', 0.2], ['<k>motivated</k>', 0.3], ['seller', 0.5]], { size: 84, dark: true }), 0.2, { x: 0, y: 0, dark: true })}</div>`, 0, { grid: true });
});
// 9. only they say yes to no money down
B('only~ln#1', start('only~ln#1'), (d, rel) => brackets(0.1, { x: 600, y: 70, w: 720, h: 700 }) +
  tab('No money down', d(T('only~ln#1', 'money')) - 0.1, { x: 1520, y: 470, size: 40, gold: true }));
B('999~ln#1', start('999~ln#1'), (d) => shade('l') + stat(99.9, d(T('999~ln#1', '99')), { x: 80, y: 340, dec: 1, suf: '%', size: 200 }) +
  tab('of the time, it’s these people', d(T('999~ln#1', 'these')) - 0.2, { x: 100, y: 560 }));
// 10. create your own reality
B('reality~ln#1', start('reality~ln#1'), (d, rel) => shade('r') +
  typed(rel(said('reality~ln#1', 'Create|create your own <k>reality.</k>')), { x: 1504, y: 330, size: 92, w: 380 }));
// 11. proof: the first deal, as a term-sheet insert
B('mentor~ln#1', start('mentor~ln#1'), (d) => shade('l') + tab('<small>Proof</small>My first ever deal', d(T('mentor~ln#1', 'showed')), { x: 96, y: 470 }));
B('first~ln#1', start('first~ln#1'), (d) => {
  const R = [['Deal', 'No. 1', d(T('first~ln#1', 'first')), 380], ['Structure', '100% vendor finance', d(T('first~ln#2', '100')), 500], ['Cash to me', 'Six figures', d(T('first~ln#3', 'six')), 620], ['When', 'Day one', d(T('first~ln#3', 'straight')), 740]];
  return panel(mono('Deal sheet · healthcare', 0.05, { x: 200, y: 270, dark: true }) + line('M200 330 H1720', 0.1, { dark: true, dur: 0.6 }) +
    R.map(([k, v, at, y]) => mono(k, at, { x: 200, y: y + 20, dark: true }) +
      typed(v.split(' ').map((w, i) => [i === 0 && y >= 500 ? `<k>${w}</k>` : w, at + i * 0.12]), { x: 620, y, size: 64, dark: true }) +
      line(`M200 ${y + 90} H1720`, at + 0.1, { dark: true, dur: 0.6 })).join('') +
    brackets(d(T('first~ln#4', 'myself')), { x: 600, y: 600, w: 640, h: 240, gold: true }), 0, { grid: true });
});
B('amazing~ln#1', start('amazing~ln#1'), (d) => shade('r') + mono('My billionaire mentor', 0.05, { x: 1508, y: 330 }) +
  typed([['“Amazing.', d(T('amazing~ln#1', 'amazing'))]], { x: 1504, y: 370, size: 92 }));
B('amazing~ln#2', start('amazing~ln#2'), (d, rel) => shade('l') +
  typed(rel(said('amazing~ln#2', '“Never|never seen something like <k>this.”|this</k>')), { x: 92, y: 330, size: 96, w: 560 }));
B('career~ln#1', start('career~ln#1'), (d) => shade('r') + tab('40 years in corporate finance', d(T('career~ln#1', 'career')) - 0.3, { x: 1420, y: 470 }));
// 12. the button
B('button~ln#1', start('button~ln#1'), (d) => shade('l') +
  typed([['<k>Motivated</k>', d(T('button~ln#1', 'motivated'))], ['seller.', d(T('button~ln#1', 'seller'))]], { x: 92, y: 400, size: 120, w: 600 }));
B('button~ln#2', start('button~ln#2'), (d) => shade('r') + tab('The primary thing', d(T('button~ln#2', 'primary')), { x: 1500, y: 470, size: 40 }));
