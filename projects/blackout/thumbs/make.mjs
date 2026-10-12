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
  .t{position:absolute;font-family:'Big';font-weight:900;text-transform:uppercase;color:#d8ffe6;line-height:.84;letter-spacing:.005em;
     text-shadow:0 0 18px rgba(93,255,158,.75),0 0 46px rgba(93,255,158,.35),0 4px 24px rgba(0,0,0,.9)}
  .red{color:#ff2b1f;text-shadow:0 0 18px rgba(255,43,31,.7),0 4px 24px rgba(0,0,0,.9)} svg{position:absolute;inset:0;width:1280px;height:720px}
  .vig{position:absolute;inset:0;background:radial-gradient(ellipse at var(--vx,60%) var(--vy,50%),transparent 30%,rgba(0,0,0,.8) 100%)}`;
const loop = (cx, cy, rx, ry, rot = -8, w = 9) => {
  const pts = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2.15; const k = 1 + 0.05 * Math.sin(a * 3 + 1) + (i / 64) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`); }
  return `<svg><polyline points="${pts.join(' ')}" fill="none" stroke="#ff2b1f" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})" style="filter:drop-shadow(0 0 8px rgba(255,43,31,.6))"/></svg>`;
};
const concepts = {
  // A (lead): the pixel cursor macro, circled. Title: "The Hackers Who Can Turn Off the Lights"
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});background-position:50% 50%;filter:brightness(1.35) contrast(1.25) saturate(1.2)"></div>
      <div class="vig" style="--vx:35%;--vy:55%"></div>
      ${loop(770, 400, 120, 150, -10)}
      <div class="t" style="left:50px;top:50px;font-size:150px;white-space:nowrap">IT MOVED<br>BY<br><span class="red">ITSELF</span></div>`,
  // B: Europe at night, Ukraine circled. Pairs with "The Mouse Moved By Itself. Then the Lights Went Out."
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});background-size:135%;background-position:60% 30%;filter:brightness(2.1) contrast(1.2) saturate(1.3)"></div>
      <div class="vig" style="--vx:55%;--vy:40%"></div>
      <div class="t" style="left:56px;top:400px;font-size:210px">LIGHTS <span class="red">OUT</span></div>`,
  // C: over the operator's shoulder in the green room. Pairs with "Someone Else Is Already Inside the Power Grid"
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});background-size:150%;background-position:50% 75%;filter:brightness(1.15) contrast(1.2) saturate(1.2)"></div>
      <div class="vig" style="--vx:50%;--vy:60%"></div>
      ${loop(575, 480, 110, 95, 4)}
      <div class="t" style="left:50px;top:70px;font-size:180px">ALREADY<br><span class="red">INSIDE</span></div>`,
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
