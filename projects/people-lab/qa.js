// Motion QA: foot slide during ground contact for walker() on straight and curved paths,
// with and without runtime foot locking. Logs '[scene] qa ...' lines (render.mjs prints them).
import * as THREE from 'three';
import * as PC from '/engine/people/core.js';
export async function qa(ctx) {
  const body = await PC.loadBody('suit');
  const p = new PC.Person(body);
  const scene = new THREE.Scene(); scene.add(p.root);
  for (const clip of ['walk', 'walk_brisk', 'walk_slow']) for (const curved of [false, true]) for (const lock of [false, true]) {
    const pts = curved ? [[0, 0], [2, 3], [0, 6], [-3, 8], [-6, 8]] : [[0, 0], [0, 10]];
    const w = PC.walker(p, pts, { clip, footLock: lock, t0: 0.2 });
    const c = w.clip; let worst = 0, sum = 0, cnt = 0; const prev = { l: null, r: null };
    for (let f = 0; f < Math.min(w.tEnd, 8) * 60; f++) {
      const t = f / 60; w.update(t);
      for (const s of ['l', 'r']) {
        const k = PC.contactAt(c, w.phase(t) * c.duration, s);
        const fp = p.worldPos(`foot_${s}`);
        if (k > 0.99 && t > 1.2 && t < w.tEnd - 1.3) { if (prev[s]) { const d = fp.distanceTo(prev[s]) * 60; worst = Math.max(worst, d); sum += d; cnt++; } prev[s] = fp; } else prev[s] = null;
      }
    }
    console.log(`[scene] qa ${clip} ${curved ? 'curved' : 'straight'} lock=${lock}: planted-foot speed mean ${(sum / Math.max(1, cnt) * 100).toFixed(1)} cm/s, max ${(worst * 100).toFixed(1)} cm/s`);
  }
}
