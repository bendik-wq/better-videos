#!/usr/bin/env node
// Run one Monid endpoint and wait for its result.
//   node tools/monid/run.mjs <provider> <endpoint> <body.json | '{json}'> [out.json]
// The JSON is the request body, or a full input {body?, queryParams?, pathParams?}.
// Key: $MONID_API_KEY or /root/.secrets/monid (never in the repo). Prints the output JSON (or writes it to out.json).
import fs from 'node:fs';
const [provider, endpoint, bodyArg = '{}', out] = process.argv.slice(2);
const body = fs.existsSync(bodyArg) ? fs.readFileSync(bodyArg, 'utf8') : bodyArg;
const key = process.env.MONID_API_KEY || fs.readFileSync('/root/.secrets/monid', 'utf8').trim();
const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
let r = await (await fetch('https://api.monid.ai/v1/run', { method: 'POST', headers: H, body: JSON.stringify({ provider, endpoint, input: (() => { const j = JSON.parse(body); return (j.body || j.queryParams || j.pathParams) ? j : { body: j }; })() }) })).json();
for (let i = 0; i < 120 && ['RUNNING', 'PENDING', 'QUEUED'].includes(r.status); i++) {
  await new Promise(s => setTimeout(s, 3000));
  r = await (await fetch(`https://api.monid.ai/v1/runs/${r.runId}`, { headers: H })).json();
}
if (r.status !== 'COMPLETED') { console.error('[monid]', r.status, JSON.stringify(r).slice(0, 400)); process.exit(1); }
const o = JSON.stringify(r.output ?? r, null, 1);
if (out) fs.writeFileSync(out, o); else console.log(o);
console.error(`[monid] ${provider}${endpoint} ${r.status}`);
