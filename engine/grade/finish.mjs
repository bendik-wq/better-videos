// The film finish with a look: the 3D LUT from engine/looks.js, then render.mjs's fast finish chain
// (quarter-res halation + bloom, vignette mask, range squeeze, grain) with the look's parameters.
// Node only. Used by render.mjs (see the hook in docs/masters/README.md "Engine hooks") and by
// `node engine/looks.js apply` / projects/look-lab to grade stills exactly the way the finish will.
//
//   import { lookFinish, lutFilter, gradeStill } from './grade/finish.mjs';
//   lutFilter('bright-day')                    -> "format=gbrp,lut3d=file='/abs/engine/grade/bright-day.cube':interp=tetrahedral,format=yuvj420p"
//   lookFinish({ W, H, look, fin, seed })      -> filter body from [src] (full-range yuvj420p) to the finished picture
//   gradeStill(inJpg, outJpg, look, { seed })  -> runs ffmpeg on one still
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as LK from '../looks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// absolute LUT path; regenerated from looks.js when missing or older than looks.js. The committed
// 33^3 cubes live in engine/grade/; the 65^3 cubes for the fast (nearest) path are cached in .cache/grade/.
export function lutPath(look, N = 33) {
  const f = N === 33 ? path.join(ROOT, LK.lutFile(look)) : path.join(ROOT, '.cache/grade', `${look}-${N}.cube`), src = path.join(ROOT, 'engine/looks.js');
  if (!fs.existsSync(f) || fs.statSync(f).mtimeMs < fs.statSync(src).mtimeMs - 1) { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, LK.cube(look, N)); fs.renameSync(tmp, f); } // atomic: render workers may race
  return f;
}
// ffmpeg filter-graph escaping for a path inside a filter option
const esc = (p) => p.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
// yuvj420p -> RGB -> LUT -> yuvj420p. The LUT is display-referred sRGB in and out; JPEG frames are
// full-range BT.601, so the conversions name that matrix explicitly (no range or matrix drift).
// Cost at 1080p (4 vCPU, measured): quality 'high' = 33^3 tetrahedral, ~63 CPU-ms/frame including
// the two colour conversions (~14 ms); 'fast' = 65^3 nearest, ~30 CPU-ms/frame (4/255 steps, hidden
// by the grain that follows). The finish chain without a LUT is ~20 CPU-ms/frame.
export const lutFilter = (look, quality = 'high') => {
  const fast = quality === 'fast', f = esc(lutPath(look, fast ? 65 : 33));
  return `scale=in_color_matrix=bt601:in_range=full:out_range=full,format=gbrp,lut3d=file='${f}':interp=${fast ? 'nearest' : 'tetrahedral'},scale=out_color_matrix=bt601:in_range=full:out_range=full,format=yuvj420p`;
};

// finish parameters: the look's defaults, overridden by an explicit project.finish
export function finishParams(look, projectFinish = {}) {
  const L = look ? LK.finish(look) : {};
  const f = { ...L, ...projectFinish };
  return { hal: f.halation ?? 18, halA: f.halationAmount ?? 0.55, bloom: f.bloom ?? 0.18, vig: f.vignette ?? 0.55, grain: f.grain ?? 9, tint: f.halationTint ?? [1, 0.45, 0.25] };
}

// Same graph as render.mjs fastChain(), plus the LUT up front and a per-look halation tint.
export function lookFinish({ W, H, look = null, fin, seed, lutQuality = 'high' }) {
  const FIN = fin ?? finishParams(look);
  const ds = 4, w = Math.round(W / ds), h = Math.round(H / ds), k = W / 1920 / ds, A = FIN.halA, B = FIN.bloom, [tr, tg, tb] = FIN.tint;
  const relabel = 'mergeplanes=format=yuv420p:map1s=0:map1p=1:map2s=0:map2p=2';
  const r = (x) => +x.toFixed(4);
  const noiseF = `noise=c0s=${FIN.grain}:c0f=t+u:c1s=${FIN.grain / 3}:c1f=t+u:c2s=${FIN.grain / 3}:c2f=t+u${seed === undefined ? '' : `:all_seed=${seed}`}`;
  return [
    look ? `${lutFilter(look, lutQuality)},split[fa][fb]` : `split[fa][fb]`,
    `[fa]${relabel}[fbase]`,
    `[fb]scale=${w}:${h}:flags=area,format=gbrp,split=3[fl1][fl2][fl3]`,
    `[fl1]curves=all='0/0 0.62/0 1/1',gblur=sigma=${r(FIN.hal * k)},colorchannelmixer=rr=${r(tr * A)}:gg=${r(tg * A)}:bb=${r(tb * A)}[fhal]`,
    `[fl2]curves=all='0/0 0.5/0.05 1/1',gblur=sigma=${r(60 * k)},colorchannelmixer=rr=${r(B)}:gg=${r(B)}:bb=${r(B)}[fblo]`,
    `[fhal][fblo]blend=all_mode=screen[fglow]`,
    `[fl3]negate[finv]`,
    `[fglow][finv]blend=all_mode=multiply,scale=${W}:${H}:flags=bilinear:out_range=full,format=yuvj420p,${relabel}[fup]`,
    `[fbase][fup]blend=c0_mode=addition:c1_mode=grainmerge:c2_mode=grainmerge[fsum]`,
    `color=white:s=${W}x${H}:d=0.04,format=gbrp,vignette=angle=${FIN.vig}:dither=0,extractplanes=g,split[fvy][fvc]`,
    `[fvc]scale=${W / 2}:${H / 2}:flags=area,split[fvu][fvv]`,
    `[fvy][fvu][fvv]mergeplanes=format=yuv420p:map1s=1:map1p=0:map2s=2:map2p=0[fmask]`,
    `[fsum][fmask]lut2=c0='16+x*y*219/65025':c1='128+(x-128)*y*224/65025':c2='128+(x-128)*y*224/65025',${noiseF}`,
  ].join(';');
}

// grade one still the way the finish would (TV-range BT.601 output, converted back to a full-range JPEG)
export function gradeStill(inp, out, look, { seed = 0, finish = {}, raw = false } = {}) {
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', inp]).toString().trim().split(',').map(Number);
  const [W, H] = probe;
  const body = raw ? (look ? lutFilter(look) : 'null') : lookFinish({ W, H, look, fin: finishParams(look, finish), seed });
  const graph = `[0:v]scale=out_range=full,format=yuvj420p[src];[src]${body}[g];[g]scale=in_color_matrix=bt601:in_range=${raw ? 'full' : 'tv'}:out_range=full,format=yuvj420p[v]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', inp, '-filter_complex', graph, '-map', '[v]', '-frames:v', '1', '-q:v', '2', out]);
  return out;
}

// CLI: node engine/grade/finish.mjs <in.jpg> <out.jpg> <look|none> [--seed N] [--raw]   (--raw: LUT only, no finish)
if (process.argv[1] && import.meta.url === new URL('file://' + path.resolve(process.argv[1])).href) {
  const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  gradeStill(a[0], a[1], a[2] === 'none' ? null : a[2], { seed: Number(opt('seed', 0)), raw: a.includes('--raw') });
}
