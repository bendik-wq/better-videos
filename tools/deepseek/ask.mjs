#!/usr/bin/env node
// Hand a cheap task to DeepSeek (OpenAI-compatible chat API) so Claude's own tokens go to the work that needs them.
//
//   node tools/deepseek/ask.mjs "prompt" [--file=a.md --file=b.jpg ...] [--model=deepseek-flash|deepseek-v4-pro]
//        [--system="..."] [--json] [--out=result.md] [--max=16000] [--effort=low|high|max]
//   echo "prompt" | node tools/deepseek/ask.mjs -
//
// Text files are inlined with their paths; images (.jpg .png .webp) go as image parts (flash only).
// Key: $DEEPSEEK_API_KEY, else /root/.secrets/deepseek (never in the repo). Prints the answer; usage goes to stderr
// and to .cache/deepseek/usage.jsonl so we can see what was offloaded.
// Never send secrets, keys, .env files or unreleased material the user hasn't cleared for a third party.
import fs from 'node:fs'; import path from 'node:path';

const argv = process.argv.slice(2), files = [], opt = {};
let prompt = null;
for (const a of argv) {
  if (a.startsWith('--file=')) files.push(a.slice(7));
  else if (a.startsWith('--')) { const [k, v = 'true'] = a.slice(2).split('='); opt[k] = v; }
  else prompt = a;
}
if (prompt === '-' || prompt === null) prompt = fs.readFileSync(0, 'utf8');
const key = process.env.DEEPSEEK_API_KEY || (fs.existsSync('/root/.secrets/deepseek') ? fs.readFileSync('/root/.secrets/deepseek', 'utf8').trim() : '');
if (!key) { console.error('[deepseek] no key: set DEEPSEEK_API_KEY or write it to /root/.secrets/deepseek'); process.exit(2); }

const IMG = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const parts = [];
let text = '';
for (const f of files) {
  if (/(^|\/)\.env|secret|\.pem$|id_rsa/i.test(f)) { console.error(`[deepseek] refusing to send ${f}`); process.exit(3); }
  const ext = path.extname(f).toLowerCase();
  if (IMG[ext]) parts.push({ type: 'image_url', image_url: { url: `data:${IMG[ext]};base64,${fs.readFileSync(f).toString('base64')}` } });
  else text += `\n\n===== FILE: ${f} =====\n${fs.readFileSync(f, 'utf8')}`;
}
const model = opt.model ?? 'deepseek-flash';
const user = parts.length ? [{ type: 'text', text: prompt + text }, ...parts] : prompt + text;
const body = { model, max_tokens: +(opt.max ?? 16000),
  messages: [...(opt.system ? [{ role: 'system', content: opt.system }] : []), { role: 'user', content: user }],
  ...(opt.json ? { response_format: { type: 'json_object' } } : {}), ...(opt.effort ? { reasoning_effort: opt.effort } : {}) };

let res, data;
for (let tryN = 1; tryN <= 3; tryN++) {
  res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  data = await res.json().catch(() => ({}));
  if (res.ok) break;
  if (res.status < 500 && res.status !== 429) break;
  await new Promise(r => setTimeout(r, 2000 * tryN));
}
if (!res.ok) { console.error('[deepseek] error', res.status, JSON.stringify(data).slice(0, 500)); process.exit(1); }
const answer = data.choices?.[0]?.message?.content ?? '';
if (opt.out) fs.writeFileSync(opt.out, answer); else process.stdout.write(answer + '\n');
const u = data.usage ?? {};
console.error(`[deepseek] ${data.model} in ${u.prompt_tokens} out ${u.completion_tokens}`);
try { fs.mkdirSync('.cache/deepseek', { recursive: true }); fs.appendFileSync('.cache/deepseek/usage.jsonl', JSON.stringify({ at: new Date().toISOString(), model: data.model, in: u.prompt_tokens, out: u.completion_tokens, task: String(opt.task ?? prompt).slice(0, 80) }) + '\n'); } catch {}
