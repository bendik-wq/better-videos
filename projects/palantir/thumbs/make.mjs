// Thumbnail compositor: a 1280x720 HTML layout per concept, rendered by headless Chromium.
// node projects/palantir/thumbs/make.mjs  ->  thumbs/A.jpg, B.jpg, C.jpg (+ mobile-size previews)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.resolve(here, '../../../assets/fonts');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'src', f)).toString('base64');
const font = (name, file) => `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts, file)).toString('base64')})}`;
const CSS = font('Archivo', 'ArchivoNarrow.woff2') + font('Serif', 'InstrumentSerif.woff2') + `
  *{margin:0;padding:0;box-sizing:border-box} body{width:1280px;height:720px;overflow:hidden;background:#000;position:relative}
  .bg{position:absolute;background-size:cover;background-repeat:no-repeat}
  .t{position:absolute;font-family:'Archivo';font-weight:700;text-transform:uppercase;color:#fff;line-height:.86;letter-spacing:-.01em;
     text-shadow:0 4px 30px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.9)}
  .red{color:#ff2a1f} svg{position:absolute;inset:0;width:1280px;height:720px}
  .vig{position:absolute;inset:0;background:radial-gradient(ellipse at var(--vx,60%) var(--vy,50%),transparent 35%,rgba(0,0,0,.75) 100%)}`;
// hand-drawn marker loop: a slightly uneven double ellipse
const loop = (cx, cy, rx, ry, rot = -8, w = 9) => {
  const pts = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2.15; const k = 1 + 0.05 * Math.sin(a * 3 + 1) + (i / 64) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`); }
  return `<svg><polyline points="${pts.join(' ')}" fill="none" stroke="#ff2a1f" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})" style="filter:drop-shadow(0 0 6px rgba(0,0,0,.6))"/></svg>`;
};

const concepts = {
  // A: the stone with its iris, looking at you, in the green office. Title pairing: "The Most Dangerous Company in the World"
  A: `<div class="bg" style="inset:0;background-image:url(${img('A.jpg')});filter:brightness(1.55) contrast(1.18) saturate(1.25)"></div>
      <div class="vig" style="--vx:68%;--vy:48%"></div>
      ${loop(896, 360, 150, 140, -6)}
      <div class="t" style="left:54px;top:118px;font-size:168px">IT<br>SEES<br><span class="red">YOU</span></div>`,
  // B: the eye vortex. Pairs with the title test "Why the CIA Funded a Crystal Ball"
  B: `<div class="bg" style="inset:0;background-image:url(${img('B.jpg')});filter:brightness(1.4) contrast(1.25) saturate(1.3)"></div>
      <div class="vig" style="--vx:68%;--vy:50%"></div><div style="position:absolute;left:1010px;top:20px;width:220px;height:210px;border-radius:50%;background:radial-gradient(#0d0300 45%,transparent 72%)"></div>
      <div class="t" style="left:52px;top:150px;font-size:150px">THE CIA<br>FUNDED<br><span class="red">THIS</span></div>`,
  // C: the person made of data, the head circled. Pairs with "The Company That Sees Everything"
  C: `<div class="bg" style="inset:0;background-image:url(${img('C.jpg')});filter:brightness(1.6) contrast(1.2) saturate(1.3)"></div>
      <div class="vig" style="--vx:70%;--vy:45%"></div>
      ${loop(810, 112, 70, 82, 4)}
      <div class="t" style="left:56px;top:140px;font-size:150px">THIS<br>IS YOUR<br><span class="red">FILE</span></div>`,
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
