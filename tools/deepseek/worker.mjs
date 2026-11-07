#!/usr/bin/env node
// A DeepSeek coding worker in its own git worktree, orchestrated by Claude.
//
//   node tools/deepseek/worker.mjs --name=<slug> --file=<repo path to edit> [--file=...] [--context=<read-only path> ...]
//        --test="<shell command run in the worktree; exit 0 = pass; its output is the feedback>"
//        [--rounds=5] [--model=deepseek-v4-pro] [--timeout=900] < task.md
//
// Each round DeepSeek returns every edited file in full; the worker writes them into .worktrees/<slug>/, runs the test,
// and sends the output back. Stops on pass or after --rounds. Writes .worktrees/<slug>.diff (vs HEAD) and
// .worktrees/<slug>.log.json. Nothing touches the main tree: Claude reviews the diff and applies it.
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2), opt = {}, files = [], ctx = [];
for (const a of argv) {
  const i = a.indexOf('='); const k = a.slice(2, i < 0 ? undefined : i), v = i < 0 ? 'true' : a.slice(i + 1);
  if (k === 'file') files.push(v); else if (k === 'context') ctx.push(v); else opt[k] = v;
}
const task = fs.readFileSync(0, 'utf8');
if (!opt.name || !files.length || !opt.test) { console.error('need --name, --file, --test and a task on stdin'); process.exit(1); }
const WT = path.join(ROOT, '.worktrees', opt.name), LOG = path.join(ROOT, '.worktrees', `${opt.name}.log.json`);
fs.mkdirSync(path.dirname(WT), { recursive: true });
if (!fs.existsSync(WT)) execSync(`git worktree add --detach "${WT}" HEAD`, { cwd: ROOT, stdio: 'ignore' });
// untracked inputs the test needs (benchmarks, node_modules) are linked in, not copied
for (const l of ['reverse', 'tools/reverse/node_modules']) {
  const src = path.join(ROOT, l), dst = path.join(WT, l);
  if (fs.existsSync(src) && !fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.symlinkSync(src, dst); }
}
const ROUNDS = +(opt.rounds ?? 5), log = [];
const SYSTEM = `You are a senior engineer working in a repository. You edit only the files you are given. Reply with every file you change in FULL, each as:
=== FILE: <repo-relative path> ===
<entire file content>
=== END ===
No other text outside these blocks except an optional first line 'NOTE: <one sentence>'. Keep existing public interfaces unless the task says otherwise. Never print secrets. Keep the code deterministic.`;
let feedback = '';
for (let r = 1; r <= ROUNDS; r++) {
  const cur = files.map(f => `=== FILE: ${f} ===\n${fs.existsSync(path.join(WT, f)) ? fs.readFileSync(path.join(WT, f), 'utf8') : '(new file)'}\n=== END ===`).join('\n');
  const cx = ctx.map(f => `--- READ-ONLY: ${f} ---\n${fs.readFileSync(path.join(WT, f), 'utf8')}`).join('\n');
  const prompt = `TASK (round ${r}/${ROUNDS}):\n${task}\n\nTest command (must exit 0): ${opt.test}\n\n${feedback ? 'Result of your previous attempt:\n' + feedback + '\n\n' : ''}Files you may edit (current content):\n${cur}\n\n${cx ? 'Context:\n' + cx : ''}`;
  const out = path.join(ROOT, '.worktrees', `${opt.name}.r${r}.txt`);
  const q = spawnSync('node', [path.join(ROOT, 'tools/deepseek/ask.mjs'), '-', `--system=${SYSTEM}`, `--model=${opt.model ?? 'deepseek-v4-pro'}`, `--out=${out}`, '--max=120000', `--task=worker:${opt.name}`],
    { input: prompt, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (q.status) { log.push({ round: r, error: q.stderr.slice(-400) }); break; }
  const ans = fs.readFileSync(out, 'utf8');
  const blocks = [...ans.matchAll(/=== FILE: (.+?) ===\n([\s\S]*?)\n=== END ===/g)];
  if (!blocks.length) { feedback = 'Your reply had no === FILE === blocks. Reply with full files only.'; log.push({ round: r, error: 'no blocks' }); continue; }
  for (const [, f, body] of blocks) {
    const rel = f.trim(); if (!files.includes(rel)) continue;  // only allowed files
    fs.mkdirSync(path.dirname(path.join(WT, rel)), { recursive: true });
    fs.writeFileSync(path.join(WT, rel), body.replace(/^```[a-z]*\n|```\s*$/g, '') + '\n');
  }
  const t = spawnSync('bash', ['-lc', opt.test], { cwd: WT, encoding: 'utf8', timeout: +(opt.timeout ?? 900) * 1000, maxBuffer: 1 << 26 });
  const res = ((t.stdout ?? '') + (t.stderr ?? '')).slice(-6000);
  log.push({ round: r, note: ans.match(/^NOTE: (.*)$/m)?.[1], exit: t.status, tail: res.slice(-1200) });
  console.log(`[worker ${opt.name}] round ${r}: exit ${t.status}${t.signal ? ' (' + t.signal + ')' : ''}`);
  if (t.status === 0) break;
  feedback = `exit ${t.status}${t.signal ? ' killed by ' + t.signal + ' (too slow?)' : ''}\n${res}`;
}
const diff = spawnSync('git', ['diff', 'HEAD', '--', ...files], { cwd: WT, encoding: 'utf8' }).stdout
  + files.filter(f => !spawnSync('git', ['ls-files', '--error-unmatch', f], { cwd: WT }).status === false).map(() => '').join('');
const untracked = files.filter(f => spawnSync('git', ['ls-files', '--error-unmatch', f], { cwd: WT }).status !== 0 && fs.existsSync(path.join(WT, f)));
const extra = untracked.map(f => spawnSync('git', ['diff', '--no-index', '/dev/null', f], { cwd: WT, encoding: 'utf8' }).stdout).join('');
fs.writeFileSync(path.join(ROOT, '.worktrees', `${opt.name}.diff`), diff + extra);
fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
const last = log.at(-1) ?? {};
console.log(`[worker ${opt.name}] ${last.exit === 0 ? 'PASS' : 'NOT PASSING'} after ${log.length} round(s) → .worktrees/${opt.name}.diff`);
