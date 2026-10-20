// Episode 8 thumbnails (Reconstructed style): 3D renders from projects/aibubble-lab (thA/thB/thC at --stills=0.95,
// copied to src/) + minimal type + the MAINSPRING coil badge top-left. node projects/aibubble/thumbs/make.mjs → A/B/C.jpg
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const inter = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'projects/mortgage/assets/fonts/Inter-latin.woff2')).toString('base64');
const coil = fs.readFileSync(path.join(root, 'brand/out/logo.svg'), 'utf8').replace(/width="800" height="800"/, 'width="66" height="66"').replace('<rect width="800" height="800" fill="#f7f6f1"/>', '').replace(/<circle cx="400" cy="400" r="368"[^>]*\/>/, '');
const CSS = `@font-face{font-family:'Inter';src:url(${inter}) format('woff2');font-weight:100 900}*{margin:0;padding:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;position:relative;font-family:Inter}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.badge{position:absolute;left:22px;top:22px;width:74px;height:74px;border-radius:50%;background:#f7f6f1;box-shadow:0 3px 10px rgba(0,0,0,.25);padding:4px}
.big{position:absolute;font:900 italic 104px Inter;color:#fff;letter-spacing:.01em;text-shadow:0 5px 0 #9b120a,0 12px 28px rgba(0,0,0,.35)}
.pill{position:absolute;background:#e0241b;color:#fff;font:800 64px Inter;padding:6px 26px 10px;border-radius:16px;box-shadow:0 8px 22px rgba(0,0,0,.28)}
.tag{position:absolute;background:#fff;color:#14233d;font:800 40px Inter;padding:4px 16px 6px;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.2)}`;
const T = {
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});background-size:116%;background-position:22% 42%"></div>
      <div class="big" style="left:760px;top:430px;transform:rotate(-5deg)">POP?</div>`,
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});background-size:122%;background-position:50% 40%"></div>
      <div class="pill" style="left:840px;top:560px;transform:rotate(-3deg)"><span style="display:inline-block;width:30px;height:30px;border-radius:50%;background:#fff;margin-right:16px;vertical-align:6px"></span>$105B</div>`,
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});background-size:118%;background-position:72% 40%"></div>
      <div class="tag" style="left:290px;top:186px">2000</div><div class="tag" style="left:1000px;top:78px">2026</div>
      <div class="big" style="left:470px;top:520px;transform:rotate(-4deg)">AGAIN?</div>`,
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }).catch(() => chromium.launch());
for (const [k, body] of Object.entries(T)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${body}<div class="badge">${coil}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `${k}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); console.log('wrote', k);
}
await browser.close();
