// NOTREDAME LAB runtime: shows one 2D canvas set per shot from projects/notredame/sets/nd-sets.js (no GL, no transitions).
import * as THREE from 'three';
import { SETS } from '/projects/notredame/sets/nd-sets.js';

export default async function create(ctx) {
  const { renderer, shots } = ctx;
  await document.fonts.ready;
  for (const f of ['600 34px "Archivo Narrow"', '700 250px "Archivo Narrow"', '500 22px "Plex Mono"', '400 84px "Instrument Serif"', 'italic 40px "Instrument Serif"']) await document.fonts.load(f);
  const live = new Map();
  for (const s of shots) { if (!SETS[s.set]) throw new Error(`unknown set ${s.set}`); live.set(s.id, await SETS[s.set](ctx, s)); }
  const layers = [...live.values()].map(v => v.layer);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#f7f6f1'); const cam = new THREE.PerspectiveCamera();
  return {
    frame({ shot, t, p }) {
      const inst = live.get(shot.id);
      for (const l of layers) l.style.display = l === inst.layer ? '' : 'none';
      renderer.render(scene, cam);
      inst.update(t, p);
    },
  };
}
