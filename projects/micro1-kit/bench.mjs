// Frame-cost bench for the LEDGER kit: node projects/micro1-kit/bench.mjs [projectDir] [frames]
// Env: VP=1920x1080 viewport, XARGS='--disable-gpu-compositing' extra Chromium flags, QS='&x' stage query.
// Times the page's draw (window.__frame) and the CDP JPEG capture separately, on the timeline already in out/.
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const proj = path.resolve(process.argv[2] ?? path.join(ROOT, 'projects/micro1-kit')), N = Number(process.argv[3] ?? 90);
const shots = JSON.parse(fs.readFileSync(path.join(proj, 'out/timeline.json'), 'utf8'));
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': /\.m?js$/.test(p) ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const dirs = fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium_headless_shell'));
const browser = await chromium.launch({ executablePath: path.join('/opt/pw-browsers', dirs.sort().at(-1), 'chrome-linux/headless_shell'), args: ['--use-angle=gl-egl', '--ignore-gpu-blocklist', ...(process.env.XARGS ? process.env.XARGS.split(' ') : [])], env: { ...process.env, EGL_PLATFORM: 'surfaceless' } });
const [VW, VH] = (process.env.VP ?? '1080x1920').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
page.on('pageerror', e => console.error(e));
await page.goto(`http://127.0.0.1:${server.address().port}/engine/stage.html?project=/${path.relative(ROOT, proj)}${process.env.QS ?? ''}`);
await page.evaluate((cfg) => window.__setup(cfg), { shots: shots.map(({ voFile, ...s }) => s), width: VW, height: VH, fps: 30, aa: 'none', renderScale: 1 });
const cdp = await page.context().newCDPSession(page);
const total = shots.at(-1).start + shots.at(-1).duration;
let td = 0, tc = 0, t2 = 0;
for (let i = 0; i < N; i++) { const T = (i / N) * total; let a = Date.now(); await page.evaluate((T) => window.__frame(T), T); td += Date.now() - a;
  a = Date.now(); const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true }); tc += Date.now() - a; }
console.log(`draw ${(td / N).toFixed(1)} ms/frame, capture ${(tc / N).toFixed(1)} ms/frame`);
await browser.close(); server.close();
