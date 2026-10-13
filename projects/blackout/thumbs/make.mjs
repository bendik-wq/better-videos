// Episode 4 thumbnails (LIVE WIRE): 1280x720 HTML layouts rendered by headless Chromium.
// node projects/blackout/thumbs/make.mjs  ->  thumbs/A.jpg, B.jpg, C.jpg
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.resolve(here, '../assets/fonts');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const font = (name, file) => `@font-face{font-family:'${name}';src:url(data:font/ttf;base64,${fs.readFileSync(path.join(fonts, file)).toString('base64')})}`;
const CSS = font('Big', 'BigShouldersDisplay.ttf') + `
  *{margin:0;padding:0;box-sizing:border-box} body{width:1280px;height:720px;overflow:hidden;background:#000;position:relative}
  .bg{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
  .t{position:absolute;font-family:'Big';font-weight:900;text-transform:uppercase;color:#f4fff8;line-height:.86;letter-spacing:.01em;text-shadow:0 3px 18px rgba(0,0,0,.95)}
  svg{position:absolute;inset:0;width:1280px;height:720px}
  .vig{position:absolute;inset:0;background:radial-gradient(ellipse at var(--vx,60%) var(--vy,50%),transparent 30%,rgba(0,0,0,.85) 100%)}`;
// the one red element (#e0241b): a hand-drawn marker loop, optionally dashed
const loop = (cx, cy, rx, ry, rot = -8, w = 10, dash = '') => {
  const pts = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2.15; const k = 1 + 0.05 * Math.sin(a * 3 + 1) + (i / 64) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`); }
  return `<svg><polyline points="${pts.join(' ')}" fill="none" stroke="#e0241b" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})" style="filter:drop-shadow(0 0 6px rgba(0,0,0,.8))"/></svg>`;
};
// Three grammars (packaging skill): evidence macro (cursor), deadpan flash (mouse), absence drawn (Europe at night).
const concepts = {
  // A (lead): the reconstruction macro, the pointer on OPEN. Plants: who moved it? Title answers "hackers", not how.
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});background-size:cover;background-position:50% 50%;filter:brightness(1.05) contrast(1.35)"></div>
      <div class="vig" style="--vx:32%;--vy:40%"></div>
      ${loop(505, 330, 150, 200, -10)}
      <div class="t" style="right:36px;top:190px;font-size:160px;text-align:right">WHO<br>CLICKED?</div>`,
  // B: deadpan direct flash on the untouched mouse (the cursor moved; the hand never did).
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});background-size:cover;background-position:50% 50%;filter:brightness(1.05) contrast(1.25)"></div>
      <div class="vig" style="--vx:62%;--vy:55%"></div>
      ${loop(645, 440, 135, 160, 6)}
      <div class="t" style="left:44px;top:60px;font-size:140px">NOBODY<br>TOUCHED<br>IT</div>`,
  // C: Europe at night with one region missing, outlined in red dashes (the absence drawn).
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});background-size:170%;background-position:80% 26%;filter:brightness(1.9) contrast(1.2)"></div>
      <div style="position:absolute;left:690px;top:210px;width:380px;height:220px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.97) 55%,rgba(0,0,0,0) 100%)"></div>
      ${loop(880, 320, 205, 120, -6, 9, '26 18')}
      <div class="t" style="left:56px;top:470px;font-size:190px">ONE CLICK</div>`,
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (const [k, body] of Object.entries(concepts)) {
  await page.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${body}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `${k}.jpg`), type: 'jpeg', quality: 95 });
  console.log('wrote', k);
}
await browser.close();
