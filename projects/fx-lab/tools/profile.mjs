// Per-progress timing for one transition: node projects/fx-lab/tools/profile.mjs lens-blur [reps]
import { open } from '../bench-lib.mjs';
const name = process.argv[2], reps = Number(process.argv[3] ?? 3);
const { page, close } = await open('/engine/stage.html');
const r = await page.evaluate(async ({ name, reps }) => {
  const TR = await import('/engine/transitions.js'); const W = 1920, H = 1080;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.x = c.getContext('2d', { willReadFrequently: true }); return c; };
  const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
  const cover = async (src) => { const i = await load(src), c = mk(), s = Math.max(W / i.width, H / i.height); c.x.drawImage(i, (W - i.width * s) / 2, (H - i.height * s) / 2, i.width * s, i.height * s); return c; };
  const A = await cover('/projects/palantir/assets/archive/nsa-night-2013-paglen.jpg'), B = await cover('/projects/palantir/assets/archive/waterhouse-magic-circle-1886.jpg');
  const dst = mk(), fx = TR.create({ width: W, height: H }); const out = [];
  for (let i = 0; i <= 20; i++) { const e = i / 20; const ts = []; for (let k = 0; k < reps; k++) { const t0 = performance.now(); fx.render(dst.x, name, A, B, e, {}); dst.x.getImageData(0, 0, 1, 1); ts.push(performance.now() - t0); } out.push([e, ...ts.map(t => +t.toFixed(1))]); }
  return out;
}, { name, reps });
console.log(r.map(a => a.join('\t')).join('\n')); await close();
