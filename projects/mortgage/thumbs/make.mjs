// Episode 6 thumbnails (BRIGHT): 1280x720 HTML layouts over frames from the episode, rendered by headless Chromium.
// node projects/panama/thumbs/make.mjs  ->  thumbs/A.jpg, B.jpg, C.jpg
// Plates (thumbs/src) are crops of the look-dev stills: A = house-sold, B = vault, C = bids-arrive.
// Gates (packaging skill): ≤ 3 words, one high-contrast hero, exactly one red element.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const inter = 'data:font/woff2;base64,' + fs.readFileSync(path.resolve(here, '../assets/fonts/Inter-latin.woff2')).toString('base64');
const CSS = `@font-face{font-family:'Inter';src:url(${inter}) format('woff2');font-weight:100 900}
  *{margin:0;padding:0;box-sizing:border-box} body{width:1280px;height:720px;overflow:hidden;background:#eef3f6;position:relative}
  .bg{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
  .t{position:absolute;font-family:'Inter';font-weight:900;text-transform:uppercase;color:#10161d;line-height:.88;letter-spacing:-.035em}
  .w{color:#fff;text-shadow:0 4px 22px rgba(0,30,50,.55)}
  svg{position:absolute;inset:0;width:1280px;height:720px}`;
// the one red element (#e0241b): a hand-drawn loop, an arrow, or a dashed line
const loop = (cx, cy, rx, ry, rot = -8, w = 11, dash = '') => {
  const pts = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2.15; const k = 1 + 0.05 * Math.sin(a * 3 + 1) + (i / 64) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`); }
  return `<svg><polyline points="${pts.join(' ')}" fill="none" stroke="#e0241b" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))"/></svg>`;
};
const arrow = (x1, y1, x2, y2, w = 14) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 46, s = 0.5;
  const p1 = [x2 - h * Math.cos(a - s), y2 - h * Math.sin(a - s)], p2 = [x2 - h * Math.cos(a + s), y2 - h * Math.sin(a + s)];
  return `<svg style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))"><path d="M${x1},${y1} Q${(x1 + x2) / 2 + 60},${(y1 + y2) / 2 - 60} ${x2},${y2}" fill="none" stroke="#e0241b" stroke-width="${w}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${p1.join(',')} ${p2.join(',')}" fill="#e0241b"/></svg>`;
};
const concepts = {
  // A (lead): object in daylight. The house on the auction block, SOLD stamp, red 5.3% tag (the one red element).
  A: `<div class="bg" style="background-image:url(${img('A.jpg')});filter:brightness(1.04) saturate(1.1) contrast(1.05)"></div>`,
  // B: the matchup. A tiny Fed desk vs the giant auction hopper; red loop on the hopper.
  B: `<div class="bg" style="background-image:url(${img('B.jpg')});filter:brightness(1.04) saturate(1.08)"></div>
      ${loop(915, 370, 285, 320, -4)}
      <div class="t" style="left:44px;top:60px;font-size:132px">NOT<br>THE FED</div>`,
  // C: absurd quantity. The pile of sealed bids on the yield ruler; red loop on 5.30%.
  C: `<div class="bg" style="background-image:url(${img('C.jpg')});filter:brightness(1.04) saturate(1.1)"></div>
      ${loop(760, 300, 70, 30, -4, 8)}
      <div class="t" style="left:50px;bottom:40px;font-size:140px">SEALED<br>BIDS</div>`,
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
