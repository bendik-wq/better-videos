#!/usr/bin/env node
// Transition bench at 1080p in the render's headless Chromium (llvmpipe flags):
//   node projects/fx-lab/bench.mjs [name,name] [--strips]
// For every transition in engine/transitions.js it measures
//   ms        mean / max cost per frame over 24 progress samples (best of 3 per sample, software comp canvas, synced)
//   endA/endB mean abs difference (0..255) to A at e=0.004 and to B at e=0.996 (should be ~0)
//   jump      largest mean abs difference between neighbouring frames over 60 steps (no pops)
//   flat      largest deviation from grey 128 when A and B are the same flat grey frame
//             (must be ~0 for kind 'cover' and 'geo': exact alpha coverage)
// and with --strips writes a 5-frame strip per transition to out/bench/ for the contact sheet.
import fs from 'node:fs';
import path from 'node:path';
import { open, ROOT } from './bench-lib.mjs';

const args = process.argv.slice(2);
const only = args.find(a => !a.startsWith('--'))?.split(',');
const strips = args.includes('--strips');
const outDir = path.join(ROOT, 'projects/fx-lab/out/bench'); fs.mkdirSync(outDir, { recursive: true });
const { page, close } = await open('/engine/stage.html');
const res = await page.evaluate(async ({ only, strips }) => {
  const TR = await import('/engine/transitions.js');
  const W = 1920, H = 1080;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.x = c.getContext('2d', { willReadFrequently: true }); return c; };
  const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const cover = async (src) => { const i = await load(src), c = mk(), s = Math.max(W / i.width, H / i.height); c.x.drawImage(i, (W - i.width * s) / 2, (H - i.height * s) / 2, i.width * s, i.height * s); return c; };
  const A = await cover('/projects/palantir/assets/archive/nsa-night-2013-paglen.jpg');
  const B = await cover('/projects/palantir/assets/archive/waterhouse-magic-circle-1886.jpg');
  const G = mk(); G.x.fillStyle = 'rgb(128,128,128)'; G.x.fillRect(0, 0, W, H);
  const dst = mk(), fx = TR.create({ width: W, height: H });
  const small = document.createElement('canvas'); small.width = 240; small.height = 135; const sx = small.getContext('2d', { willReadFrequently: true });
  const thumb = (c) => { sx.drawImage(c, 0, 0, 240, 135); return sx.getImageData(0, 0, 240, 135).data; };
  const mad = (a, b) => { let s = 0, n = 0; for (let i = 0; i < a.length; i += 4) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; } return s / n; };
  const tA = thumb(A).slice(), tB = thumb(B).slice();
  const out = [];
  const opts = { 'match-dissolve': { a: { x: 700, y: 520, s: 260 }, b: { x: 1100, y: 480, s: 520 } }, 'match-cut': { a: { x: 700, y: 520, s: 260 }, b: { x: 1100, y: 480, s: 520 } } };
  for (const name of TR.names) {
    if (only && !only.includes(name)) continue;
    const o = opts[name] ?? {};
    fx.render(dst.x, name, A, B, 0.5, o); dst.x.getImageData(0, 0, 1, 1); // warm caches (noise)
    const times = [];
    for (let i = 0; i < 24; i++) { const e = 0.02 + 0.96 * i / 23; let best = 1e9; for (let k = 0; k < 3; k++) { const t0 = performance.now(); fx.render(dst.x, name, A, B, e, o); dst.x.getImageData(0, 0, 1, 1); best = Math.min(best, performance.now() - t0); } times.push(best); }
    fx.render(dst.x, name, A, B, 0.004, o); const endA = mad(thumb(dst), tA);
    fx.render(dst.x, name, A, B, 0.996, o); const endB = mad(thumb(dst), tB);
    let jump = 0, prev = thumb(A).slice(), jumpAt = 0;
    for (let i = 1; i <= 60; i++) { const e = i / 60; fx.render(dst.x, name, A, B, e, o); const cur = thumb(dst).slice(); const d = mad(cur, prev); if (d > jump) { jump = d; jumpAt = e; } prev = cur; }
    let flat = 0;
    for (let i = 1; i < 20; i++) { fx.render(dst.x, name, G, G, i / 20, o); const d = dst.x.getImageData(0, 0, W, H).data; let m = 0; for (let k = 0; k < d.length; k += 4 * 7) m = Math.max(m, Math.abs(d[k] - 128), Math.abs(d[k + 1] - 128), Math.abs(d[k + 2] - 128)); flat = Math.max(flat, m); }
    let strip = null;
    if (strips) { const sc = document.createElement('canvas'); sc.width = 5 * 384; sc.height = 216; const scx = sc.getContext('2d');
      [0.15, 0.35, 0.5, 0.65, 0.85].forEach((e, i) => { fx.render(dst.x, name, A, B, e, o); scx.drawImage(dst, i * 384, 0, 384, 216); });
      strip = sc.toDataURL('image/jpeg', 0.85); }
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    out.push({ name, kind: TR.meta[name].kind, mean: +mean.toFixed(1), max: +Math.max(...times).toFixed(1), endA: +endA.toFixed(2), endB: +endB.toFixed(2), jump: +jump.toFixed(1), jumpAt: +jumpAt.toFixed(2), flat, strip });
  }
  return out;
}, { only, strips });
for (const r of res) if (r.strip) fs.writeFileSync(path.join(outDir, `${r.name}.jpg`), Buffer.from(r.strip.split(',')[1], 'base64'));
console.table(res.map(({ strip, ...r }) => r));
fs.writeFileSync(path.join(outDir, 'bench.json'), JSON.stringify(res.map(({ strip, ...r }) => r), null, 1));
await close();
