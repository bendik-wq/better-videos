// Episode 7 thumbnails (Reconstructed style): 3D renders from projects/silver-lab (thA/thB/thC stills, copied to src/) +
// minimal type + the MAINSPRING coil badge top-left. node projects/silver/thumbs/make.mjs → thumbs/A.jpg, B.jpg, C.jpg
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const inter = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'projects/mortgage/assets/fonts/Inter-latin.woff2')).toString('base64');
const coil = fs.readFileSync(path.join(root, 'brand/out/logo.svg'), 'utf8').replace(/width="800" height="800"/, 'width="66" height="66"').replace('<rect width="800" height="800" fill="#f7f6f1"/>', '').replace(/<circle cx="400" cy="400" r="368"[^>]*\/>/, '');
const CSS = `@font-face{font-family:'Inter';src:url(${inter}) format('woff2');font-weight:100 900}*{margin:0;padding:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;position:relative;font-family:Inter}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.badge{position:absolute;left:22px;top:22px;width:74px;height:74px;border-radius:50%;background:#f7f6f1;box-shadow:0 3px 10px rgba(0,0,0,.25);padding:4px}`;
const T = {
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});background-size:104%;background-position:40% 45%"></div>`,
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});background-size:128%;background-position:50% 62%"></div>
      <div style="position:absolute;left:410px;top:540px;transform:rotate(-4deg);font:900 italic 84px Inter;color:#fff;letter-spacing:.02em;text-shadow:0 4px 0 #9b120a,0 10px 24px rgba(0,0,0,.35)">TEXAS</div>`,
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});background-size:120%;background-position:60% 45%"></div>
      <div style="position:absolute;left:118px;top:28px;background:#e0241b;color:#fff;font:800 50px Inter;padding:6px 20px 8px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.25)"><span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#fff;margin-right:12px;vertical-align:4px"></span>27 MAR 1980</div>`,
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }).catch(() => chromium.launch());
for (const [k, body] of Object.entries(T)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${body}<div class="badge">${coil}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `${k}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); console.log('wrote', k);
}
await browser.close();
