// MAINSPRING brand kit: logo, avatar, watermark, banner, branded thumbnails, brand sheet.
// node brand/make.mjs  ->  brand/out/*.png (+ logo.svg)
// Palette = the bright house style (projects/mortgage/sets/graphics-kit.js): paper, ink navy, teal, one red.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..'), out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
const P = { paper: '#f7f6f1', paper2: '#efece3', ink: '#14233d', teal: '#2a8c86', sage: '#a9c5ae', red: '#e0241b' };
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(root, f)).toString('base64');
const img = (f) => b64(f, 'image/jpeg');
const inter = b64('projects/mortgage/assets/fonts/Inter-latin.woff2', 'font/woff2');
const CSS = `@font-face{font-family:'Inter';src:url(${inter}) format('woff2');font-weight:100 900}
  *{margin:0;padding:0;box-sizing:border-box} body{background:transparent;font-family:'Inter';color:${P.ink}}
  .wm{font-weight:900;letter-spacing:-.02em;line-height:.9}
  .tag{font-weight:600;letter-spacing:.01em;color:#4b5a70}
  .card{position:absolute;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(20,35,61,.18);background-size:cover;background-position:center;border:8px solid #fff}`;

// The mark: a mainspring (Archimedean coil) in ink, its outer end hooked, its inner end a red arbor dot.
function coil({ size = 800, stroke = 0.062, turns = 2.35, bg = P.paper, ring = true, color = P.ink } = {}) {
  const c = size / 2, r1 = size * 0.07, r2 = size * 0.37, sw = size * stroke, pts = [];
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = -Math.PI / 2 + t * turns * Math.PI * 2, r = r1 + (r2 - r1) * t;
    pts.push(`${(c + Math.cos(a) * r).toFixed(2)},${(c + Math.sin(a) * r).toFixed(2)}`);
  }
  const end = pts.at(-1).split(',').map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    ${ring ? `<circle cx="${c}" cy="${c}" r="${size * 0.46}" fill="none" stroke="${P.teal}" stroke-width="${size * 0.018}" opacity=".9"/>` : ''}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${end[0]}" cy="${end[1]}" r="${sw * 0.62}" fill="${color}"/>
    <circle cx="${c}" cy="${c}" r="${sw * 0.95}" fill="${P.red}"/>
  </svg>`;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }).catch(() => chromium.launch());
async function shot(name, w, h, body, { transparent = false, type = 'png' } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<!doctype html><html><head><style>${CSS} body{width:${w}px;height:${h}px;overflow:hidden;position:relative;${transparent ? '' : `background:${P.paper}`}}</style></head><body>${body}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, name), type, omitBackground: transparent, ...(type === 'jpeg' ? { quality: 95 } : {}) });
  await page.close(); console.log('wrote', name);
}

// 1. Logo / avatar (YouTube: 800x800, shown as a circle)
fs.writeFileSync(path.join(out, 'logo.svg'), coil({ size: 800 }));
await shot('avatar-800.png', 800, 800, coil({ size: 800 }));
await shot('avatar-red-800.png', 800, 800, `<div style="position:absolute;inset:0;background:${P.red}"></div>${coil({ size: 800, bg: null, ring: false, color: '#fff' }).replace(`fill="${P.red}"`, `fill="${P.ink}"`)}`);
// 2. Watermark (150x150, transparent; YouTube adds it bottom-right of every video)
await shot('watermark-150.png', 150, 150, `<div style="position:absolute;inset:6px;border-radius:50%;background:${P.paper};box-shadow:0 2px 8px rgba(0,0,0,.25)"></div><div style="position:absolute;inset:6px">${coil({ size: 138, bg: null, ring: false })}</div>`, { transparent: true });
// 3. Wordmark lockup (transparent, for end screens, intros, socials)
const lockup = (s = 1, color = P.ink) => `<div style="display:flex;align-items:center;gap:${36 * s}px">
    <div style="width:${200 * s}px;height:${200 * s}px">${coil({ size: 200 * s, bg: null, ring: false, color })}</div>
    <div><div class="wm" style="font-size:${150 * s}px;color:${color}">MAINSPRING</div>
    <div class="tag" style="font-size:${38 * s}px;margin-top:${14 * s}px">The hidden machinery behind the world</div></div></div>`;
await shot('lockup.png', 1400, 320, `<div style="position:absolute;left:40px;top:40px">${lockup(1)}</div>`, { transparent: true });

// 4. Banner (YouTube: 2560x1440; text inside the 1546x423 safe area in the middle; desktop shows the 2560x423 band)
const cards = [
  ['projects/mortgage/thumbs/src/A.jpg', 30, 545, 330, 235, -3],
  ['renders/panama/aerial-locks.jpg', 200, 660, 310, 210, 4],
  ['renders/mortgage/cold-open-97.jpg', 2050, 660, 310, 210, -4],
  ['renders/panama/aerial-lake.jpg', 2200, 545, 330, 235, 3],
];
const banner = `
  <div style="position:absolute;inset:0;background:${P.paper};
    background-image:repeating-linear-gradient(0deg, rgba(42,140,134,.07) 0 2px, transparent 2px 48px)"></div>
  ${cards.map(([f, x, y, w, h, rot]) => `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg);background-image:url(${img(f)})"></div>`).join('')}
  <div style="position:absolute;left:507px;top:508px;width:1546px;height:423px;display:flex;align-items:center;justify-content:center">${lockup(1.0)}</div>
  <div style="position:absolute;left:1280px;top:900px;transform:translateX(-50%);font-size:26px;font-weight:700;letter-spacing:.32em;color:${P.teal}">MONEY · POWER · THE SYSTEMS THAT RUN THE WORLD</div>`;
await shot('banner-2560x1440.png', 2560, 1440, banner);

// 5. Branded thumbnails: the lead thumbnail of each episode with a small corner coil badge (top-left, away from
//    YouTube's duration stamp bottom-right). Kept tiny: the story is the hero, the badge builds recognition.
const badge = `<div style="position:absolute;left:22px;top:22px;width:74px;height:74px;border-radius:50%;background:${P.paper};box-shadow:0 3px 10px rgba(0,0,0,.25);padding:4px">${coil({ size: 66, bg: null, ring: false })}</div>`;
for (const [name, f] of [['thumb-mortgage-A.jpg', 'projects/mortgage/thumbs/A.jpg'], ['thumb-mortgage-B.jpg', 'projects/mortgage/thumbs/B.jpg'], ['thumb-panama-A.jpg', 'projects/panama/thumbs/A.jpg']])
  await shot(name, 1280, 720, `<div style="position:absolute;inset:0;background:url(${img(f)}) center/cover"></div>${badge}`, { type: 'jpeg' });

// 6. Brand sheet (one image to review everything)
const sheet = `<div style="position:absolute;inset:0;background:${P.paper}"></div>
  <div style="position:absolute;left:80px;top:60px">${lockup(0.8)}</div>
  <div style="position:absolute;left:80px;top:330px;display:flex;gap:40px;align-items:center">
    <div style="width:260px;height:260px;border-radius:50%;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.15)">${coil({ size: 260 })}</div>
    <div style="width:260px;height:260px;border-radius:50%;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.15);background:${P.red}">${coil({ size: 260, bg: null, ring: false, color: '#fff' }).replace(`fill="${P.red}"`, `fill="${P.ink}"`)}</div>
    <div>${[P.paper, P.ink, P.teal, P.sage, P.red].map(c => `<div style="display:flex;align-items:center;gap:16px;margin:8px 0"><div style="width:56px;height:56px;border-radius:12px;background:${c};border:2px solid #ddd"></div><span style="font-size:24px;font-weight:600">${c}</span></div>`).join('')}</div>
  </div>
  <div style="position:absolute;left:80px;top:650px;width:1760px;height:330px;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.15);background:url(${'BANNER'}) center/cover"></div>`;
const bannerData = 'data:image/png;base64,' + fs.readFileSync(path.join(out, 'banner-2560x1440.png')).toString('base64');
await shot('brand-sheet.png', 1920, 1040, sheet.replace('BANNER', bannerData));
await browser.close();
