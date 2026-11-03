// Smoke test: serve the game page locally, load it in headless Chromium and fail on any page error.
// Run from the repo root: node cloudflare/cold-block/test/smoke.mjs
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
const D = new URL('../../../games/cold-block/', import.meta.url).pathname;
const srv = createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u !== '/' && existsSync(D + u.slice(1))) { r.writeHead(200); r.end(readFileSync(D + u.slice(1))); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end('<!doctype html><meta charset=utf8>' + readFileSync(D + 'index.html', 'utf8'));
}).listen(8776);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(), errs = [];
p.on('pageerror', (e) => errs.push(e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
await p.goto('http://localhost:8776/#test', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForTimeout(6000);
await b.close(); srv.close();
if (errs.length) { console.log('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log('PASS: page loaded with no errors');
