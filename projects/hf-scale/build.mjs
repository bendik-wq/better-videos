// hf-scale: a generated 20-minute HyperFrames timeline (scale + sync test for docs/library/hyperframes-engine-test.md §9).
// node projects/hf-scale/build.mjs [minutes=20] [shotSeconds=4]
// 1. writes timing.json (shots, words, cues) the way our engine would export it;
// 2. writes one sub-composition per shot, with word-timed tweens inlined from timing.json (no fetch at render time);
// 3. writes mix.wav: a 1 kHz 10 ms blip at every cue, the "VO onset" we measure the mux against.
import fs from 'node:fs';
import path from 'node:path';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const MIN = Number(process.argv[2] || 20), SHOT = Number(process.argv[3] || 4), FPS = 30;
const N = Math.round(MIN * 60 / SHOT), DUR = N * SHOT;

let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const WORDS = 'the mainspring stores energy in a coil of steel and lets it out one tick at a time so the hands keep moving'.split(' ');
const shots = [];
for (let i = 0; i < N; i++) {
  const t0 = i * SHOT, words = [];
  let t = t0 + 0.2;
  while (t < t0 + SHOT - 0.5 && words.length < 9) { const d = 0.18 + rnd() * 0.25; words.push({ text: WORDS[(i * 7 + words.length) % WORDS.length], t0: +t.toFixed(3), t1: +(t + d).toFixed(3) }); t += d + 0.05 + rnd() * 0.12; }
  // the cue sits on a word onset at an arbitrary (non-frame-aligned) time
  const cue = words[Math.min(words.length - 1, 2 + (i % 4))].t0;
  shots.push({ id: `s${String(i).padStart(3, '0')}`, start: t0, end: t0 + SHOT, words, cue });
}
fs.writeFileSync(path.join(DIR, 'timing.json'), JSON.stringify({ fps: FPS, duration: DUR, shots }, null, 0));

fs.mkdirSync(path.join(DIR, 'compositions'), { recursive: true });
for (const f of fs.readdirSync(path.join(DIR, 'compositions'))) fs.unlinkSync(path.join(DIR, 'compositions', f));
const PAL = ['#2a8c86', '#a9c5ae', '#b98a3e', '#8cc5bf', '#1d6662'];
for (const [i, s] of shots.entries()) {
  const col = PAL[i % PAL.length];
  const tallies = Array.from({ length: 60 }, (_, k) => `<rect x="${1180 + (k % 12) * 52}" y="${300 + Math.floor(k / 12) * 90}" width="14" height="60" rx="7" fill="#14233d"/>`).join('');
  const wordsHtml = s.words.map((w, k) => `<span id="${s.id}-w${k}">${w.text}</span>`).join(' ');
  // word times are relative to the sub-composition start
  const tw = s.words.map((w, k) => `tl.fromTo("#${s.id}-w${k}",{opacity:0,y:8},{opacity:1,y:0,duration:0.12,ease:"power3.out"},${(w.t0 - s.start).toFixed(3)});`).join('\n      ');
  fs.writeFileSync(path.join(DIR, 'compositions', `${s.id}.html`), `<template>
  <style>
    #${s.id}-root { position:absolute; inset:0; background:#f7f6f1; }
    #${s.id}-words { position:absolute; left:120px; top:820px; width:1680px; font-family:"IBM Plex Mono"; font-weight:500; font-size:40px; color:#14233d; letter-spacing:0.06em; }
    #${s.id}-words span { display:inline-block; }
    #${s.id}-n { position:absolute; left:120px; top:120px; font-family:"Archivo Narrow"; font-weight:700; font-size:160px; color:#14233d; }
    #${s.id}-sync { position:absolute; right:0; top:0; width:120px; height:120px; background:#000; opacity:0; }
  </style>
  <div id="${s.id}-root" data-composition-id="${s.id}" data-width="1920" data-height="1080">
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
      <g id="${s.id}-gear" transform="translate(560 520)"><circle r="200" fill="${col}" stroke="#14233d" stroke-width="4"/><circle r="56" fill="#f7f6f1" stroke="#14233d" stroke-width="4"/>
        ${Array.from({ length: 12 }, (_, k) => `<rect x="-22" y="-236" width="44" height="44" fill="${col}" stroke="#14233d" stroke-width="4" transform="rotate(${k * 30})"/>`).join('')}</g>
      <g id="${s.id}-tal">${tallies}</g>
    </svg>
    <div id="${s.id}-n">SHOT ${i + 1}</div>
    <div id="${s.id}-words">${wordsHtml}</div>
    <div id="${s.id}-sync"></div>
  </div>
  <script>
    (function () {
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#${s.id}-gear", { rotation: 0, svgOrigin: "560 520" }, { rotation: 90, svgOrigin: "560 520", duration: ${SHOT}, ease: "none" }, 0);
      tl.fromTo("#${s.id}-tal rect", { scaleY: 0, svgOrigin: "0 360" }, { scaleY: 1, svgOrigin: "0 360", duration: 0.2, stagger: 0.02, ease: "back.out(2)" }, 0.1);
      ${tw}
      // sync marker: on for 0.2 s from the cue (the frame that first shows it is the picture onset)
      tl.set("#${s.id}-sync", { opacity: 1 }, ${(s.cue - s.start).toFixed(3)});
      tl.set("#${s.id}-sync", { opacity: 0 }, ${(s.cue - s.start + 0.2).toFixed(3)});
      tl.progress(1).progress(0);
      window.__timelines["${s.id}"] = tl;
    })();
  </script>
</template>
`);
}
const hosts = shots.map((s, i) => `      <div id="h-${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${SHOT}" data-track-index="${1 + (i % 2)}" data-width="1920" data-height="1080"></div>`).join('\n');
fs.writeFileSync(path.join(DIR, 'index.html'), `<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Archivo Narrow"; src: url("assets/fonts/ArchivoNarrow.woff2"); font-weight: 400 700; }
      @font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/IBMPlexMono-500.woff2"); font-weight: 500; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #f7f6f1; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-fps="${FPS}" data-width="1920" data-height="1080">
${hosts}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);

// mix.wav: 48 kHz mono 16-bit, a 10 ms 1 kHz blip at each cue
const SR = 48000, len = Math.ceil(DUR * SR), buf = Buffer.alloc(44 + len * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + len * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(len * 2, 40);
for (const s of shots) { const a = Math.round(s.cue * SR); for (let k = 0; k < SR * 0.01; k++) buf.writeInt16LE(Math.round(20000 * Math.sin(2 * Math.PI * 1000 * k / SR)), 44 + (a + k) * 2); }
fs.writeFileSync((fs.mkdirSync(path.join(DIR, 'out'), { recursive: true }), path.join(DIR, 'out', 'mix.wav')), buf);
console.log(`hf-scale: ${N} shots, ${DUR} s, ${shots.reduce((n, s) => n + s.words.length, 0)} word tweens`);
