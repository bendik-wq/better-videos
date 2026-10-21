// Episode 8 thumbnails (Reconstructed style): 3D renders from projects/aibubble-lab (thA/thB/thC at --stills=0.95,
// copied to src/) + minimal type + the MAINSPRING coil badge top-left. node projects/aibubble/thumbs/make.mjs → A/B/C.jpg
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const inter = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'projects/mortgage/assets/fonts/Inter-latin.woff2')).toString('base64');
const coil = fs.readFileSync(path.join(root, 'brand/out/logo.svg'), 'utf8').replace(/width="800" height="800"/, 'width="66" height="66"').replace('<rect width="800" height="800" fill="#f7f6f1"/>', '').replace(/<circle cx="400" cy="400" r="368"[^>]*\/>/, '');
const CSS = `@font-face{font-family:'Inter';src:url(${inter}) format('woff2');font-weight:100 900}*{margin:0;padding:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;position:relative;font-family:Inter;background:#1172d9}
.bg{position:absolute;inset:0;background-repeat:no-repeat;filter:saturate(1.35) contrast(1.12) brightness(1.03)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,20,60,.38) 100%)}
.badge{position:absolute;left:22px;top:22px;width:74px;height:74px;border-radius:50%;background:#f7f6f1;box-shadow:0 3px 10px rgba(0,0,0,.25);padding:4px}
.big{position:absolute;font:900 italic 150px/1 Inter;color:#fff;letter-spacing:-.01em;text-shadow:-3px 0px 0 #14233d,3px 0px 0 #14233d,0px -3px 0 #14233d,0px 3px 0 #14233d,-2px -2px 0 #14233d,2px 2px 0 #14233d,-2px 2px 0 #14233d,2px -2px 0 #14233d,0 9px 0 #e0241b,0 16px 34px rgba(0,0,0,.45)}
.pill{position:absolute;background:#e0241b;color:#fff;font:900 128px/1 Inter;padding:14px 34px 20px;border-radius:22px;box-shadow:0 12px 30px rgba(0,0,0,.35);letter-spacing:-.02em}
.sub{position:absolute;background:#fff;color:#14233d;font:900 50px/1 Inter;padding:10px 22px 12px;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,.25);letter-spacing:.02em}
.tag{position:absolute;background:#14233d;color:#fff;font:900 58px/1 Inter;padding:8px 20px 12px;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.ring{position:absolute;border:9px solid #e0241b;border-radius:50%;box-shadow:0 0 0 4px #fff,0 0 30px rgba(224,36,27,.7)}`;
const T = {
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});background-size:1900px auto;background-position:-210px -175px"></div><div class="vig"></div>
      <div class="ring" style="left:720px;top:205px;width:150px;height:150px"></div>
      <div class="big" style="left:760px;top:470px;transform:rotate(-6deg)">POP?</div>`,
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});background-size:1500px auto;background-position:-40px -60px"></div><div class="vig"></div>
      <div class="pill" style="left:56px;top:430px;transform:rotate(-4deg)">$105B</div>
      <div class="sub" style="left:86px;top:600px;transform:rotate(-4deg)">RENT GUARANTEE</div>`,
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});background-size:1400px auto;background-position:-70px -40px"></div><div class="vig"></div>
      <div class="tag" style="left:40px;top:110px">2000</div><div class="tag" style="left:1010px;top:110px">2026</div>
      <div class="big" style="left:430px;top:530px;transform:rotate(-5deg)">AGAIN?</div>`,
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }).catch(() => chromium.launch());
for (const [k, body] of Object.entries(T)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${body}<div class="badge">${coil}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `${k}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); console.log('wrote', k);
}
await browser.close();
