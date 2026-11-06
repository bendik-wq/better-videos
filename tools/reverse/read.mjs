#!/usr/bin/env node
// READ: hand the picture-reading of a reverse run to DeepSeek (cheap, image-capable) instead of spending Claude tokens.
//   node tools/reverse/read.mjs reverse/<name> [--strips=24] [--model=deepseek-flash]
// Sends REVERSE.md, the overview sheets and up to N event strips; writes reverse/<name>/READING.md (devices,
// transitions, text, camera, sound, what to take). Claude then spot-checks a few strips instead of reading them all.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const dir = path.resolve(args.find(a => !a.startsWith('--')) ?? '');
if (!fs.existsSync(path.join(dir, 'REVERSE.md'))) { console.error('usage: node tools/reverse/read.mjs reverse/<name>  (run reverse.mjs first)'); process.exit(1); }
const ls = (d) => fs.existsSync(d) ? fs.readdirSync(d).filter(f => /\.(jpe?g|png)$/i.test(f)).sort().map(f => path.join(d, f)) : [];
const overview = ls(path.join(dir, 'sheets/overview'));
let strips = ls(path.join(dir, 'sheets/events')); const n = +(opt.strips ?? 24);
if (strips.length > n) strips = strips.filter((_, i) => i % Math.ceil(strips.length / n) === 0).slice(0, n);
const prompt = `You are a film editor reverse-engineering a video's craft for a documentary studio. Attached: the measured report (REVERSE.md), overview sheets (one frame every 5 s, in time order, left to right, top to bottom) and event strips (consecutive frames around each on-screen change; the file name holds the time in seconds).
Write READING.md in markdown, concise and concrete, only from what you can see or what the numbers say:
## Devices — the recurring visual moves, each with a count and 1–2 example times.
## Transitions — every kind seen (hard cut, match cut, whip, push/zoom-through, morph, wipe, dissolve, flash), with example times and how many frames they last if visible.
## Text on screen — how often, rough size relative to frame height, typeface style, how it enters and leaves, how long it holds.
## Camera — pans, push-ins, parallax, held frames; how often the camera moves vs the picture changing.
## Art style — palette (use the report's hex codes), line, texture, lighting, characters (describe, never name the channel's characters).
## Pacing and sound — read the per-minute table: where it speeds up or slows down, and what happens on screen then.
## Take / leave — 6–10 techniques a different studio could adopt in its OWN art style, each as one actionable rule with numbers. Never suggest copying characters, art, logos or names.
Say "unclear" rather than guessing.`;
const files = [path.join(dir, 'REVERSE.md'), ...overview, ...strips].map(f => `--file=${f}`);
const r = spawnSync('node', [path.join(ROOT, 'tools/deepseek/ask.mjs'), prompt, ...files, `--model=${opt.model ?? 'deepseek-flash'}`, `--out=${path.join(dir, 'READING.md')}`, '--task=reverse-read', '--max=40000'], { stdio: 'inherit' });
if (r.status === 0) console.log('[read] →', path.join(dir, 'READING.md'), `(${overview.length} sheets, ${strips.length} strips)`);
process.exit(r.status ?? 1);
