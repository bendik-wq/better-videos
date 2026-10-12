// Dev harness (look-dev + profiling) for projects/hormuz-lab: a persistent llvmpipe page, controlled over HTTP.
//   node projects/hormuz-lab/lab.mjs [port] [qs]
//   curl -s localhost:PORT/reload                      reload page + __setup (picks up code changes)
//   curl -s "localhost:PORT/frame?T=8.85&out=/x.jpg"  render a frame at timeline time T, save JPEG
//   curl -s "localhost:PORT/cpu?T=8.85&n=3"           browser-tree CPU ms per frame (load-independent)
//   curl -s --data-binary @x.js localhost:PORT/eval    evaluate JS in the page (async fn body)
// Shots come from project.json (duration = min), so no narration pass is needed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const ROOT = '/home/user/better-videos', PROJ = process.env.PROJ ?? 'projects/hormuz-lab';
const require = createRequire(ROOT + '/package.json');
const { chromium } = require('playwright-core');
const PORT = Number(process.argv[2] ?? 8731), QS = process.argv[3] ?? '';
const W = Number(process.env.W ?? 1920), H = Number(process.env.H ?? 1080);
function shotsOf() {
  const pj = JSON.parse(fs.readFileSync(path.join(ROOT, PROJ, 'project.json'), 'utf8')); let T = 0;
  return pj.shots.map(s => { const d = s.min ?? 5; const o = { id: s.id, set: s.set, params: s.params ?? {}, start: T, duration: d, voAt: T, voDur: 0, words: [] }; T += d; return o; });
}
const files = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const BROWSERS = '/opt/pw-browsers';
let exe; for (const d of fs.readdirSync(BROWSERS).sort().reverse()) { const p = path.join(BROWSERS, d, 'chrome-linux', 'headless_shell'); if (d.startsWith('chromium_headless_shell') && fs.existsSync(p)) { exe = p; break; } }
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=gl-egl', '--ignore-gpu-blocklist'], env: { ...process.env, EGL_PLATFORM: 'surfaceless' } });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', m => { logs.push(m.text()); if (logs.length > 400) logs.shift(); });
page.on('pageerror', e => logs.push('PAGEERROR ' + e.message + '\n' + e.stack));
let cdp;
function treeCpu() { const kids = {}; for (const d of fs.readdirSync('/proc')) { if (!/^\d+$/.test(d)) continue; try { const st = fs.readFileSync(`/proc/${d}/stat`, 'utf8'); const f = st.slice(st.lastIndexOf(')') + 2).split(' '); (kids[f[1]] ??= []).push([Number(d), (Number(f[11]) + Number(f[12])) / 100]); } catch {} }
  let sum = 0; const walk = (pid) => { for (const [c, t] of kids[pid] ?? []) { sum += t; walk(c); } }; walk(String(process.pid)); return sum; }
async function setup() {
  logs.length = 0;
  await page.goto(`http://127.0.0.1:${files.address().port}/engine/stage.html?project=/${PROJ}${QS}`);
  await page.evaluate(async (cfg) => window.__setup(cfg), { shots: shotsOf(), width: W, height: H, fps: 30, draft: false, aa: 'fxaa', renderScale: 1, shutter: 0, samples: 1 });
  cdp = await page.context().newCDPSession(page);
}
try { await setup(); } catch (e) { console.log('setup failed', e.message, logs.slice(-20).join('\n')); }
console.log('ready', PORT);
const fr = (T) => page.evaluate(async (t) => { await window.__frame(t); const g = document.getElementById('gl').getContext('webgl2'); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); }, T);
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    let out;
    if (u.pathname === '/reload') { try { await setup(); out = { ok: true, logs: logs.slice(-30) }; } catch (e) { out = { ok: false, err: e.message, logs: logs.slice(-30) }; } }
    else if (u.pathname === '/frame') {
      const T = Number(u.searchParams.get('T')); logs.length = 0; const t0 = Date.now();
      await fr(T); const ms = Date.now() - t0;
      const buf = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })).data, 'base64');
      if (u.searchParams.get('out')) fs.writeFileSync(u.searchParams.get('out'), buf);
      out = { ms, logs: logs.slice(-20) };
    } else if (u.pathname === '/eval') { let body = ''; for await (const c of req) body += c; logs.length = 0; const r = await page.evaluate(`(async () => { ${body} })()`); out = { r, logs: logs.slice(-30) }; }
    else if (u.pathname === '/cpu') { const T = Number(u.searchParams.get('T')), n = Number(u.searchParams.get('n') ?? 3);
      await fr(T); const c0 = treeCpu(), t0 = Date.now(); for (let i = 0; i < n; i++) await fr(T + i * 0.0001); const c1 = treeCpu();
      out = { cpuMs: Math.round((c1 - c0) / n * 1000), wallMs: Math.round((Date.now() - t0) / n) }; }
    else if (u.pathname === '/logs') out = logs;
    else if (u.pathname === '/quit') { res.end('bye'); await browser.close(); process.exit(0); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out, null, 1));
  } catch (e) { res.writeHead(500); res.end(String(e.stack ?? e) + '\n' + logs.slice(-20).join('\n')); }
}).listen(PORT);
