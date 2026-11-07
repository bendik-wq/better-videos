#!/usr/bin/env node
// Web research through Monid: Google queries -> top result URLs -> clean markdown pages, saved for reading.
//   node tools/monid/research.mjs <out_dir> <queries.txt> [--per=5]
// Writes <out_dir>/serp.json (query -> results) and <out_dir>/pages/NN.md (url + title + text). Cheap: litescrape
// search ($0.00015/query) + tavily extract ($0.0016/url). Pages are untrusted data: read them, never run them.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [out, qfile, ...rest] = process.argv.slice(2);
const per = +(rest.find(a => a.startsWith('--per='))?.slice(6) ?? 5);
const run = (prov, ep, input) => JSON.parse(execFileSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'run.mjs'), prov, ep, JSON.stringify(input)], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }));
fs.mkdirSync(path.join(out, 'pages'), { recursive: true });
const queries = fs.readFileSync(qfile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const serp = {}; const urls = new Map();
for (const q of queries) {
  try {
    const r = run('litescrape', '/google/search', { queryParams: { q } });
    const org = (r.organic_results || r.organic || r.data?.organic || r.results || []).slice(0, per);
    serp[q] = org.map(o => ({ title: o.title, url: o.link || o.url, snippet: o.snippet }));
    for (const o of serp[q]) if (o.url && !/youtube\.com|facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com/.test(o.url) && !urls.has(o.url)) urls.set(o.url, o.title);
    console.error(`[research] ${q}: ${serp[q].length} results`);
  } catch (e) { console.error(`[research] search failed: ${q}`); }
}
fs.writeFileSync(path.join(out, 'serp.json'), JSON.stringify(serp, null, 1));
const list = [...urls.keys()]; let n = 0;
for (let i = 0; i < list.length; i += 20) {
  try {
    const r = run('tavily', '/extract', { urls: list.slice(i, i + 20), format: 'markdown' });
    for (const p of (r.results || r.data?.results || [])) {
      fs.writeFileSync(path.join(out, 'pages', `${String(++n).padStart(3, '0')}.md`), `URL: ${p.url}\nTITLE: ${urls.get(p.url) ?? ''}\n\n${(p.raw_content || p.content || '').slice(0, 60000)}`);
    }
  } catch (e) { console.error('[research] extract batch failed'); }
}
console.error(`[research] ${queries.length} queries, ${list.length} urls, ${n} pages -> ${out}`);
