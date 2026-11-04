#!/usr/bin/env node
// Writes projects/shot-lab/project.json: the 24 demo shots (best 6 first, so `--only=first,last`
// renders the clip), each a catalog id rendered with its own recipe. Durations come from the catalog.
//   node projects/shot-lab/gen-project.mjs
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const cat = JSON.parse(fs.readFileSync(path.join(here, '../../docs/shots/catalog.json'), 'utf8'));
const BEST6 = ['ONE-001', 'ONE-009', 'ONE-011', 'EST-006', 'FOL-012', 'ONE-004'];
const REST = ['ONE-002', 'ONE-010', 'ONE-006', 'ONE-017', 'ONE-028', 'EST-007', 'EST-005', 'EST-019', 'REV-001', 'REV-007', 'REV-013',
  'FOL-001', 'FOL-003', 'FOL-004', 'CHR-002', 'OBJ-001', 'DAT-001', 'DAT-003'];
const ids = [...BEST6, ...REST];
const shots = ids.map((id) => { const s = cat.shots.find(x => x.id === id); if (!s) throw new Error(id);
  return { id, set: s.lab, params: { shot: id, t0: s.t0 }, min: s.dur, padIn: 0, padOut: 0 }; });
const project = {
  title: 'Shot lab: engine/camera.js and the shot catalog',
  fps: 30, width: 1920, height: 1080,
  voice: { engine: 'kokoro', name: 'bm_george' },
  finish: { grain: 9, halation: 18, halationAmount: 0.5, bloom: 0.16, vignette: 0.55 },
  settings: { aa: 'fxaa' },
  shots,
  score: { key: 'D', drone: 0.08, cues: [] },
};
fs.writeFileSync(path.join(here, 'project.json'), JSON.stringify(project, null, 2) + '\n');
console.log(`${shots.length} shots, ${shots.reduce((a, s) => a + s.min, 0).toFixed(1)} s; best 6: ${BEST6.join(',')}`);
