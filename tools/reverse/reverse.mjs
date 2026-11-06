#!/usr/bin/env node
// REVERSE: measure any video the way HyperFrames' open-source reverse-any-video method does, with only the free,
// local commands (`hyperframes measure probe|cuts|events|frames|look`), ffmpeg and whisper. No sign-in, no Pro,
// no uploads; telemetry is forced off. Output is a breakdown an agent (or a person) reads before studying or remixing.
//
//   node tools/reverse/reverse.mjs <video file | YouTube URL> [--out=dir] [--cookies=cookies.txt] [--max=720]
//
// Writes <out>/ (default reverse/<name>/, git-ignored):
//   breakdown.json  every number below, machine-readable
//   REVERSE.md      the report: pacing per minute, shot table, holds, sound, palette, narration pace, hook transcript
//   sheets/         overview sheets (one frame every 5 s), event strips (consecutive frames around each change)
//   transcript.json whisper words with times
// Method credit: HyperFrames © HeyGen, Apache-2.0 (skills/reverse-any-video). Guide: .claude/skills/reverse-video.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const src = args.find(a => !a.startsWith('--'));
if (!src) { console.error('usage: node tools/reverse/reverse.mjs <video|url> [--out=dir] [--cookies=file] [--max=720]'); process.exit(1); }
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
const log = (...m) => console.log('[reverse]', ...m);
const sh = (cmd, a, o = {}) => execFileSync(cmd, a, { env, maxBuffer: 1 << 30, encoding: 'utf8', ...o });

// the CLI: a pinned local install under tools/reverse/node_modules (npm i once), else npx
function hf(a) {
  const local = path.join(ROOT, 'tools/reverse/node_modules/.bin/hyperframes');
  const out = fs.existsSync(local) ? sh(local, a) : sh('npx', ['--yes', 'hyperframes@0.9.19', ...a]);
  const i = out.indexOf('{'); return JSON.parse(out.slice(i));
}

// 1. the video: a local file, or a URL fetched with yt-dlp into its own folder (downloads are untrusted data)
const isUrl = /^https?:\/\//.test(src);
const name = (opt.name ?? (isUrl ? (src.match(/[?&]v=([\w-]{11})/)?.[1] ?? src.replace(/\W+/g, '-').slice(-40)) : path.basename(src, path.extname(src)))).replace(/[^\w.-]/g, '_');
const out = path.resolve(opt.out ?? path.join(ROOT, 'reverse', name)); fs.mkdirSync(path.join(out, 'sheets'), { recursive: true });
let video = src;
if (isUrl) {
  const dl = path.join(out, 'source'); fs.mkdirSync(dl, { recursive: true });
  const max = +(opt.max ?? 720);
  const ya = ['-q', '--no-playlist', '--js-runtimes', 'node', '-f', `bv*[height<=${max}][ext=mp4]+ba[ext=m4a]/b[height<=${max}]`, '--merge-output-format', 'mp4',
    '--write-info-json', '-o', path.join(dl, 'video.%(ext)s'), src];
  if (opt.cookies) ya.unshift('--cookies', path.resolve(opt.cookies));
  const have = fs.existsSync(path.join(dl, 'video.mp4'));
  if (have) log('reusing', path.join(dl, 'video.mp4')); else log('downloading', src);
  const r = have ? { status: 0 } : spawnSync('yt-dlp', ya, { env, encoding: 'utf8' });
  if (r.status !== 0) {
    // YouTube blocks this datacenter IP: fall back to Monid (paid tool gateway, MrScraper /youtube/video, $0.01 a
    // call), which returns a hosted 480p MP4. Key: $MONID_API_KEY or /root/.secrets/monid (never in the repo).
    const mk = process.env.MONID_API_KEY || (fs.existsSync('/root/.secrets/monid') ? fs.readFileSync('/root/.secrets/monid', 'utf8').trim() : '');
    if (!mk) {
      const why = /confirm you.re not a bot|Sign in/i.test(r.stderr) ? 'YouTube wants a signed-in browser from this machine. Add a Monid key (/root/.secrets/monid), pass --cookies=<cookies.txt>, or pass the video file.' : r.stderr.trim().split('\n').pop();
      console.error('[reverse] download failed:', why); process.exit(2);
    }
    log('yt-dlp blocked; fetching through Monid (MrScraper, $0.01)…');
    const res = await fetch('https://api.monid.ai/v1/run', { method: 'POST', headers: { Authorization: `Bearer ${mk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'mrscraper', endpoint: '/youtube/video', input: { body: { url: src } } }), signal: AbortSignal.timeout(420000) });
    const j = await res.json().catch(() => ({}));
    const url = j.output?.download_url;
    if (!url) { console.error('[reverse] Monid failed:', res.status, JSON.stringify(j).slice(0, 300)); process.exit(2); }
    fs.writeFileSync(path.join(dl, 'monid.json'), JSON.stringify({ runId: j.runId, title: j.output.title, author: j.output.author, duration: j.output.duration, download_url: url }, null, 1));
    const v = await fetch(url); if (!v.ok) { console.error('[reverse] download of Monid file failed', v.status); process.exit(2); }
    fs.writeFileSync(path.join(dl, 'video.mp4'), Buffer.from(await v.arrayBuffer()));
    log(`got "${j.output.title}" (${j.output.author}) via Monid, ${url.match(/_(\d+p)\./)?.[1] ?? '?'}`);
  }
  video = path.join(dl, 'video.mp4');
}
video = path.resolve(video);

// 2. probe, cuts, events (in ≤60 s sections, as the method asks), look
const probe = hf(['measure', 'probe', video]); const D = probe.duration, fps = probe.fps;
log(`${probe.width}x${probe.height} @ ${probe.fps_text} fps, ${D.toFixed(1)} s, audio ${probe.audio}`);
const cuts = hf(['measure', 'cuts', video]);
log(`${cuts.cuts.length} cuts, ${cuts.not_cuts?.length ?? 0} not-cuts (flashes, whips, fast moves)`);
const ev = { counts: {}, holds: [], windows: [], onsets: [] };
for (let a = 0; a < D; a += 60) {
  const e = hf(['measure', 'events', '--map', '--start', String(a), '--end', String(Math.min(D, a + 60)), '--out', path.join(out, '.events'), video]);
  for (const [k, v] of Object.entries(e.counts ?? {})) ev.counts[k] = (ev.counts[k] ?? 0) + v;
  ev.holds.push(...(e.holds ?? [])); ev.windows.push(...(e.windows ?? [])); ev.onsets.push(...(e.sound?.strong_onsets ?? []));
  ev.bpm ??= e.sound?.bpm;
}
log('events', JSON.stringify(ev.counts));
// hyperframes' onset finder returns nothing on some files (seen on 44.1 kHz YouTube audio): use our own spectral flux
if (probe.audio && ev.onsets.length === 0) {
  const r = spawnSync('python3', ['-I', path.join(ROOT, 'tools/reverse/onsets.py'), video], { env, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status === 0) { ev.onsets = JSON.parse(r.stdout); ev.onsetSource = 'tools/reverse/onsets.py'; log(`onsets from our own detector: ${ev.onsets.length}`); }
}
// sound on picture change: share of cuts with a strong onset within ±3 frames (a hit, whoosh or music accent on the cut)
const near = (t) => ev.onsets.some(o => Math.abs(o - t) <= 3 / fps);
const cutsWithSound = cuts.cuts.length ? +(100 * cuts.cuts.filter(c => near(c.t)).length / cuts.cuts.length).toFixed(0) : null;
const chance = +(100 * Math.min(1, ev.onsets.length * (6 / fps) / D)).toFixed(0);
const look = hf(['measure', 'look', '--fps', '0.5', video]);

// 3. pictures: overview sheets (every 5 s) and strips of consecutive frames around the first 40 event windows
hf(['measure', 'frames', '--every', '5', '--width', '320', '--out', path.join(out, 'sheets', 'overview'), video]);
hf(['measure', 'frames', '--events', '--end', String(Math.min(D, 240)), '--max', '8', '--width', '240', '--out', path.join(out, 'sheets', 'events'), video]);

// 4. palette: dominant colours at each shot's midpoint (ffmpeg stills, numpy quantising)
const shots = cuts.shots;
const mids = shots.map(s => ((s.start + s.end) / 2).toFixed(3));
const pal = JSON.parse(spawnSync('python3', ['-I', path.join(ROOT, 'tools/reverse/palette.py'), video, ...mids], { env, encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '{}');

// 5. loudness and narration (whisper words → words per minute, pauses, the first 30 s verbatim)
let loud = null;
if (probe.audio) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const sum = r.stderr.slice(r.stderr.lastIndexOf('Summary:')); const m = sum.match(/I:\s+(-?[\d.]+) LUFS[\s\S]*?LRA:\s+([\d.]+) LU/); if (m) loud = { lufs: +m[1], lra: +m[2] };
}
let words = [];
if (probe.audio && opt.transcript !== 'false') {
  log('transcribing (whisper base.en, cpu)…');
  const r = spawnSync('python3', ['-I', path.join(ROOT, 'tools/reverse/transcribe.py'), video, path.join(out, 'transcript.json')], { env, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status === 0) words = JSON.parse(fs.readFileSync(path.join(out, 'transcript.json'), 'utf8')); else log('transcript skipped:', r.stderr.trim().split('\n').pop());
}

// 6. numbers
const lens = shots.map(s => s.end - s.start).sort((a, b) => a - b), q = (p) => lens[Math.min(lens.length - 1, Math.floor(p * lens.length))];
const perMin = Array.from({ length: Math.ceil(D / 60) }, (_, i) => ({
  minute: i, cuts: cuts.cuts.filter(c => c.t >= i * 60 && c.t < (i + 1) * 60).length,
  changes: ev.windows.filter(w => w.start >= i * 60 && w.start < (i + 1) * 60).length,
  words: words.filter(w => w.start >= i * 60 && w.start < (i + 1) * 60).length,
  onsets: ev.onsets.filter(t => t >= i * 60 && t < (i + 1) * 60).length }));
const gaps = words.slice(1).map((w, i) => ({ t: words[i].end, s: w.start - words[i].end })).filter(g => g.s >= 0.6);
// cut placement against speech: share of cuts that fall in a pause between words (vs random moments), and the
// spread of the nearest sound onset around each cut (a gap around 0 = cuts placed in quiet, a spike at 0 = hits on cuts)
const inWord = (t) => words.some(w => t >= w.start - 0.05 && t <= w.end + 0.05);
const cutTimes = cuts.cuts.map(c => c.t);
const rnd = Array.from({ length: 2000 }, (_, i) => 1 + (D - 2) * ((i * 0.61803398875) % 1));
const cutsInPause = words.length && cutTimes.length ? { pct: +(100 * cutTimes.filter(t => !inWord(t)).length / cutTimes.length).toFixed(0), chance_pct: +(100 * rnd.filter(t => !inWord(t)).length / rnd.length).toFixed(0) } : null;
const onsetNearCut = cutTimes.map(c => ev.onsets.reduce((b, o) => Math.abs(o - c) < Math.abs(b) ? o - c : b, Infinity)).filter(x => Math.abs(x) <= 1);
const onsetSpread = { within_0_25s: onsetNearCut.filter(x => Math.abs(x) <= 0.25).length, within_1s: onsetNearCut.length, cuts: cutTimes.length };
const B = {
  source: isUrl ? src : path.basename(video), probe: { width: probe.width, height: probe.height, fps, duration: D },
  pacing: { shots: shots.length, cuts_per_min: +(cuts.cuts.length / (D / 60)).toFixed(2), asl: +(D / shots.length).toFixed(2), median: +q(0.5).toFixed(2), p10: +q(0.1).toFixed(2), p90: +q(0.9).toFixed(2), longest: +lens.at(-1).toFixed(2),
    changes_per_min: +(ev.windows.length / (D / 60)).toFixed(1), holds_over_3s: ev.holds.filter(h => h.seconds >= 3).length },
  not_cuts: cuts.not_cuts ?? [], events: ev.counts, per_minute: perMin,
  sound: { loudness: loud, bpm: ev.bpm ?? null, strong_onsets_per_min: +(ev.onsets.length / (D / 60)).toFixed(1), onset_source: ev.onsetSource ?? 'hyperframes', cuts_with_sound_pct: cutsWithSound, chance_pct: chance, nearest_onset_to_cut: onsetSpread },
  cuts_in_speech_pause: cutsInPause,
  narration: words.length ? { words: words.length, wpm: +(words.length / ((words.at(-1).end - words[0].start) / 60)).toFixed(0), pauses_over_0_6s_per_min: +(gaps.length / (D / 60)).toFixed(1), longest_pause: +Math.max(0, ...gaps.map(g => g.s)).toFixed(2), first_word_at: +words[0].start.toFixed(2) } : null,
  look: look.summary ?? look.stats ?? look, palette: pal.overall ?? null,
  shots: shots.map((s, i) => ({ n: i + 1, start: +s.start.toFixed(3), end: +s.end.toFixed(3), seconds: +(s.end - s.start).toFixed(2), colours: pal.shots?.[i] ?? null,
    said: words.filter(w => w.start >= s.start && w.start < s.end).map(w => w.word).join('').trim() })),
};
fs.writeFileSync(path.join(out, 'breakdown.json'), JSON.stringify(B, null, 1));

// 7. the report
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const hook = words.filter(w => w.start < 30).map(w => w.word).join('').trim();
const md = `# Reverse breakdown: ${B.source}

Measured ${new Date().toISOString().slice(0, 10)} with \`tools/reverse/reverse.mjs\` (free HyperFrames measure v${probe._meta?.version ?? '?'}, ffmpeg, whisper). Numbers are measurements; the **Reading** sections are for the agent or person to fill in after looking at \`sheets/\`.

## At a glance
| | |
|---|---|
| Format | ${probe.width}×${probe.height}, ${probe.fps_text} fps, ${fmt(D)} |
| Shots | ${B.pacing.shots} · **${B.pacing.cuts_per_min} cuts/min** · average ${B.pacing.asl} s · median ${B.pacing.median} s (10–90 %: ${B.pacing.p10}–${B.pacing.p90} s) · longest ${B.pacing.longest} s |
| Change inside shots | ${B.pacing.changes_per_min} change windows/min (appears, disappears, moves) · ${B.pacing.holds_over_3s} holds ≥ 3 s |
| Not cuts | ${B.not_cuts.length} flashes, whips or fast moves |
| Sound | ${loud ? `${loud.lufs} LUFS integrated, LRA ${loud.lra} LU` : 'no audio'} · ${B.sound.strong_onsets_per_min} strong onsets/min${B.sound.bpm ? ` · ~${B.sound.bpm} bpm` : ''} · **${cutsWithSound ?? '—'}% of cuts land on a sound** (chance ${chance}%) |
| Cut placement | ${cutsInPause ? `**${cutsInPause.pct}% of cuts fall in a speech pause** (random moments: ${cutsInPause.chance_pct}%)` : '—'} · onsets within ±0.25 s of a cut: ${onsetSpread.within_0_25s} of ${onsetSpread.cuts} (within ±1 s: ${onsetSpread.within_1s}) |
| Narration | ${B.narration ? `${B.narration.wpm} wpm · first word at ${B.narration.first_word_at} s · ${B.narration.pauses_over_0_6s_per_min} pauses ≥ 0.6 s/min · longest ${B.narration.longest_pause} s` : '—'} |
| Palette (overall) | ${(B.palette ?? []).map(c => `\`${c.hex}\` ${c.share}%`).join(' · ') || '—'} |

## Pacing per minute
| min | cuts | change windows | strong sound onsets | words |
|---|---|---|---|---|
${perMin.map(m => `| ${m.minute} | ${m.cuts} | ${m.changes} | ${m.onsets} | ${m.words} |`).join('\n')}

## The hook (first 30 s, as heard)
> ${hook || '—'}

**Reading:** what is the first image, the first claim, and the first open question? When is the title promise paid?

## Shot table
| # | in | len | top colours | said during the shot |
|---|---|---|---|---|
${B.shots.map(s => `| ${s.n} | ${fmt(s.start)} | ${s.seconds}s | ${(s.colours ?? []).slice(0, 3).map(c => '`' + c + '`').join(' ')} | ${s.said.slice(0, 140).replace(/\|/g, '/')} |`).join('\n')}

## Reading (fill in after looking at sheets/overview and sheets/events)
- **Devices:** the recurring visual moves (count each).
- **Transitions:** cut, match cut, whip, zoom-through, morph… with frame-exact examples from the event strips.
- **Text on screen:** how often, how big (\`hyperframes measure ink --at t --roi …\`), how long it holds, how it enters.
- **Camera:** pans, push-ins, parallax, held frames; where the camera moves vs the picture changing.
- **Sound:** music under narration? sound effects on picture changes (peak one frame after)? silences?
- **What we take, what we leave:** techniques only. Never the creator's characters, art, voice, footage, logo or show name.
`;
fs.writeFileSync(path.join(out, 'REVERSE.md'), md);
log('done →', out);
