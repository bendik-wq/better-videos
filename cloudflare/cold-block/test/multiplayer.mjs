import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://127.0.0.1:8790/#test';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const errs = [];
const open = async (name) => { const ctx = await b.newContext({ viewport: { width: 1100, height: 680 } }); const p = await ctx.newPage(); p.setDefaultTimeout(240000); p.on('pageerror', e => errs.push(name + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(name + ': ' + m.text()); }); await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 400000 }); await p.waitForTimeout(2500); await p.fill('#nameIn', name); await p.fill('#srvIn', 'squad'); return p; };
const gameT = (p, s) => p.evaluate((s) => new Promise((res) => { const t0 = __cb.T; const iv = setInterval(() => { if (__cb.T > t0 + s) { clearInterval(iv); res(); } }, 50); }), s);
const A = await open('Alpha');
await A.$eval('[data-mode="2"]', (e) => e.click()); await A.$eval('[data-bots="8"]', (e) => e.click()); await A.$eval('[data-dif="1"]', (e) => e.click());
await A.click('#go');
await A.waitForFunction(() => __cb.bots.length === 8 && __cb.match.round >= 1, null, { timeout: 400000 });
console.log('A host: round', await A.evaluate(() => [__cb.match.round, __cb.match.mode, __cb.P.team, __cb.bots.map(b => b.team).join('')]));
const B = await open('Bravo');
await B.waitForTimeout(3500);
console.log('B server list:', (await B.textContent('#srvList')).trim());
await B.click('#go');
await B.waitForFunction(() => __cb.match.round >= 1 && __cb.bots.length === 8, null, { timeout: 400000 });
console.log('B: round/mode/team', await B.evaluate(() => [__cb.match.round, __cb.match.mode, __cb.P.team, __cb.botAuth]), 'A sees B team', await A.evaluate(() => [...__cb.remotes.values()].map(r => r.team)));
// friendly fire is off in co-op
await A.evaluate(() => { for (const b of __cb.bots) { b.pos.set(200, 0, 200); b.thinkT = 99; b.target = null; b.nadeT = 1e9; } });
const place = async () => { await A.evaluate(() => { __cb.P.pos.set(0, 0, 40); __cb.P.yaw = 0; __cb.P.pitch = -0.02; __cb.P.hp = 100; }); await B.evaluate(() => { __cb.P.pos.set(0, 0, 30); __cb.P.yaw = Math.PI; __cb.P.hp = 100; }); };
await place(); await gameT(A, 1);
for (let i = 0; i < 10; i++) { await A.evaluate(() => { __cb.P.pos.set(0, 0, 40); __cb.P.yaw = 0; __cb.P.pitch = -0.02; __cb.fire(); }); await A.waitForTimeout(120); }
await gameT(A, 0.5);
console.log('co-op friendly fire: B hp', await B.evaluate(() => Math.round(__cb.P.hp)));
// Alpha kills a bot -> XP, medals
const xp0 = await A.evaluate(() => __cb.profile.xp);
for (let i = 0; i < 40; i++) {
  await A.evaluate(() => { const b = __cb.bots.find(x => !x.dead); b.pos.set(0, 0, 28); b.rpos.copy(b.pos); b.thinkT = 99; b.target = null; __cb.P.pos.set(0, 0, 40); __cb.P.yaw = 0; __cb.P.pitch = -0.02; __cb.fire(); });
  await A.waitForTimeout(120);
  if (await A.evaluate(() => __cb.P.k > 0)) break;
}
await gameT(A, 0.3);
console.log('A after bot kill: kills', await A.evaluate(() => __cb.P.k), 'xp +', (await A.evaluate(() => __cb.profile.xp)) - xp0, 'B sees team score', await B.evaluate(() => __cb.teamScores()));
// switch to TDM: new round, teams split, Alpha can now hurt Bravo
await A.evaluate(() => __cb.setMode(1));
await A.waitForFunction(() => __cb.match.mode === 1, null, { timeout: 400000 });
await B.waitForFunction(() => __cb.match.mode === 1, null, { timeout: 400000 });
console.log('TDM teams: A', await A.evaluate(() => __cb.P.team), 'B', await B.evaluate(() => __cb.P.team), 'rounds', await A.evaluate(() => __cb.match.round), await B.evaluate(() => __cb.match.round));
await A.evaluate(() => { for (const b of __cb.bots) { b.pos.set(200, 0, 200); b.thinkT = 99; b.target = null; b.nadeT = 1e9; } });
await place(); await gameT(A, 1);
for (let i = 0; i < 40; i++) { await A.evaluate(() => { __cb.P.pos.set(0, 0, 40); __cb.P.yaw = 0; __cb.P.pitch = -0.02; __cb.fire(); }); await A.waitForTimeout(120); if (await B.evaluate(() => __cb.P.dead)) break; }
await gameT(A, 0.8);
console.log('TDM: B dead', await B.evaluate(() => [__cb.P.dead, __cb.P.d]), 'A kills', await A.evaluate(() => __cb.P.k));
// car damage sync
await A.evaluate(() => __cb.carHit(__cb.cars[3], 300, __cb.myId(), true));
await gameT(A, 0.8);
console.log('car 3: A', await A.evaluate(() => [__cb.cars[3].dead, __cb.cars[3].hp]), 'B', await B.evaluate(() => [__cb.cars[3].dead, __cb.cars[3].hp]));
console.log('traffic', await A.evaluate(() => __cb.traffic.length), 'pos A/B same?', await A.evaluate(() => __cb.traffic[0].x.toFixed(0)), await B.evaluate(() => __cb.traffic[0].x.toFixed(0)));
// end the round
await A.evaluate(() => __cb.endNow());
await B.waitForFunction(() => __cb.match.phase === 1, null, { timeout: 400000 });
await gameT(A, 0.5);
console.log('end screen A/B', await A.evaluate(() => !document.getElementById('endScreen').hidden), await B.evaluate(() => !document.getElementById('endScreen').hidden), 'A games', await A.evaluate(() => __cb.profile.games));
await A.screenshot({ path: 'v3_end.png' });
await A.evaluate(() => __cb.skipEnd());
await B.waitForFunction(() => __cb.match.phase === 0, null, { timeout: 400000 });
console.log('next round', await A.evaluate(() => __cb.match.round), await B.evaluate(() => __cb.match.round));
await gameT(A, 1.5);
await A.screenshot({ path: 'v3_A.png' }); await B.screenshot({ path: 'v3_B.png' });
const lb = await (await fetch('http://127.0.0.1:8790/api/lb')).json();
console.log('leaderboard names', lb.map(r => r.nm).join(','));
console.log('errors', JSON.stringify(errs.slice(0, 10)));
await b.close();
