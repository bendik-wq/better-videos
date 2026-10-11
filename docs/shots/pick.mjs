#!/usr/bin/env node
// Pick catalog shots for a beat list, or check an existing plan, enforcing the variety rules.
//
//   node docs/shots/pick.mjs plan.json            pick a shot id for every beat
//   node docs/shots/pick.mjs plan.json --check    validate the ids already in the plan
//   node docs/shots/pick.mjs --search "reveal window"   keyword search (name, use, sets, purpose)
//
// plan.json: [{ "t": 12.5, "dur": 4, "job": "place", "energy": "low"?, "scale": "wide"?, "shot": "EST-004"?,
//               "category": "ONE"?, "avoid": ["T3"]? }, ...]   (t = start time in seconds)
// Rules (from .claude/skills/shot-design/SKILL.md):
//   1. No catalog id twice within 600 s (10 minutes).
//   2. Scale alternates: never the same scale twice in a row.
//   3. Energy alternates: never the same energy three times in a row, and never high-high.
//   4. Cost: rolling mean over any 10 consecutive shots <= 450 ms/frame (T1 = 250, T2 = 380, T3 = 600).
//   5. Rations per episode: dolly zoom <= 1, Dutch/roll <= 2, whip <= 1 per minute.
// Choice is deterministic: candidates are ranked by fit (job match, duration fit, energy/scale wanted),
// then by least-recently-used, then by id.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const cat = JSON.parse(fs.readFileSync(path.join(here, 'catalog.json'), 'utf8')).shots;
const byId = Object.fromEntries(cat.map(s => [s.id, s]));
const COST = { T1: 250, T2: 380, T3: 600 };
const args = process.argv.slice(2);

if (args[0] === '--search') {
  const words = args.slice(1).join(' ').toLowerCase().split(/\s+/).filter(Boolean);
  const hits = cat.map(s => { const hay = [s.id, s.name, s.use, ...s.sets, ...s.purpose, s.category].join(' ').toLowerCase(); return [words.filter(w => hay.includes(w)).length, s]; })
    .filter(([n]) => n > 0).sort((a, b) => b[0] - a[0] || a[1].id.localeCompare(b[1].id)).slice(0, 25);
  for (const [, s] of hits) console.log(`${s.id}  ${s.name.padEnd(36)} ${s.scale}/${s.energy} ${s.cost} ${s.lens} ${s.duration.join('-')}s  [${s.purpose.join(',')}]`);
  process.exit(0);
}

const plan = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const check = args.includes('--check');
const kind = (s) => /dolly-zoom|dollyZoom/.test(s.recipe) ? 'dollyzoom' : /dutchDrift/.test(s.recipe) ? 'dutch' : /whipPan/.test(s.recipe) ? 'whip' : null;
const problems = [];
function violations(chosen, i, s) {
  const out = [], t = plan[i].t ?? 0;
  for (let j = 0; j < i; j++) if (chosen[j]?.id === s.id && t - (plan[j].t ?? 0) < 600) out.push(`repeats ${s.id} from beat ${j} (${(t - plan[j].t).toFixed(0)} s ago)`);
  const p1 = chosen[i - 1], p2 = chosen[i - 2];
  if (p1 && p1.scale === s.scale) out.push(`scale ${s.scale} twice in a row`);
  if (p1 && p1.energy === 'high' && s.energy === 'high') out.push('high energy twice in a row');
  if (p1 && p2 && p1.energy === s.energy && p2.energy === s.energy) out.push(`energy ${s.energy} three in a row`);
  const win = [...chosen.slice(Math.max(0, i - 9), i), s].filter(Boolean); const mean = win.reduce((a, x) => a + COST[x.cost], 0) / win.length;
  if (mean > 450) out.push(`rolling cost ${mean.toFixed(0)} ms/frame > 450`);
  const k = kind(s); if (k) { const n = chosen.slice(0, i).filter(x => x && kind(x) === k).length;
    if (k === 'dollyzoom' && n >= 1) out.push('dolly zoom ration (1 per episode)'); if (k === 'dutch' && n >= 2) out.push('Dutch ration (2 per episode)');
    if (k === 'whip') { const recent = chosen.slice(0, i).filter((x, j) => x && kind(x) === 'whip' && t - (plan[j].t ?? 0) < 60).length; if (recent) out.push('whip ration (1 per minute)'); } }
  return out;
}
const chosen = [];
plan.forEach((b, i) => {
  if (check || b.shot) { const s = byId[b.shot]; if (!s) { problems.push(`beat ${i}: unknown id ${b.shot}`); chosen.push(null); return; }
    const v = violations(chosen, i, s); v.forEach(m => problems.push(`beat ${i} ${s.id}: ${m}`)); chosen.push(s); return; }
  const lastUse = (id) => { for (let j = i - 1; j >= 0; j--) if (chosen[j]?.id === id) return j; return -1; };
  const scored = cat.filter(s => (!b.category || s.category === b.category) && !(b.avoid ?? []).includes(s.cost)).map(s => {
    let fit = 0;
    if (s.purpose.includes(b.job)) fit += 10; if (s.purpose[0] === b.job) fit += 3;
    if (b.energy && s.energy === b.energy) fit += 3; if (b.scale && s.scale === b.scale) fit += 3;
    if (b.dur) { const [lo, hi] = s.duration; fit -= b.dur < lo ? (lo - b.dur) : b.dur > hi ? (b.dur - hi) * 0.5 : 0; }
    return { s, fit, bad: violations(chosen, i, s).length };
  }).sort((a, b2) => a.bad - b2.bad || b2.fit - a.fit || lastUse(a.s.id) - lastUse(b2.s.id) || a.s.id.localeCompare(b2.s.id));
  const pick = scored[0]; chosen.push(pick.s);
  if (pick.bad) violations(chosen.slice(0, i), i, pick.s).forEach(m => problems.push(`beat ${i} ${pick.s.id}: ${m} (no clean candidate)`));
});
const rows = plan.map((b, i) => ({ t: b.t, job: b.job, shot: chosen[i]?.id, name: chosen[i]?.name, scale: chosen[i]?.scale, energy: chosen[i]?.energy, cost: chosen[i]?.cost, lens: chosen[i]?.lens }));
console.table(rows);
const mean = chosen.filter(Boolean).reduce((a, s) => a + COST[s.cost], 0) / Math.max(1, chosen.filter(Boolean).length);
console.log(`mean cost ~${mean.toFixed(0)} ms/frame; ${problems.length ? problems.length + ' problem(s):' : 'variety rules OK'}`);
problems.forEach(p => console.log('  - ' + p));
if (!check) fs.writeFileSync(args[0].replace(/\.json$/, '') + '.picked.json', JSON.stringify(plan.map((b, i) => ({ ...b, shot: chosen[i]?.id })), null, 1));
process.exit(problems.length && check ? 1 : 0);
