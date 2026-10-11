// Shared headless-browser harness for the fx-lab benches (same Chromium flags as engine/render.mjs).
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const BROWSERS = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
function findBrowser() {
  const dirs = fs.existsSync(BROWSERS) ? fs.readdirSync(BROWSERS).sort().reverse() : [];
  for (const d of dirs) { const p = path.join(BROWSERS, d, 'chrome-linux', 'headless_shell'); if (d.startsWith('chromium_headless_shell') && fs.existsSync(p)) return p; }
  for (const d of dirs) { const p = path.join(BROWSERS, d, 'chrome-linux', 'chrome'); if (/^chromium-\d/.test(d) && fs.existsSync(p)) return p; }
}
export async function open(page0, { width = 1920, height = 1080 } = {}) {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' }[path.extname(p)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type }); fs.createReadStream(p).pipe(res);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: findBrowser(), args: ['--use-angle=gl-egl', '--ignore-gpu-blocklist'], env: { ...process.env, EGL_PLATFORM: 'surfaceless' } });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.error('[page error]', e));
  await page.goto(`http://127.0.0.1:${server.address().port}${page0}`);
  return { page, close: async () => { await browser.close(); server.close(); } };
}
