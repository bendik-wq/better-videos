// Voice pass for episode 9: one shot per script line, so every line is voiced once (per-line cache); the real shot list
// in projects/silver/project.mjs reuses the cached lines whatever their grouping.
import fs from 'node:fs';
const LINES = [];
for (const l of fs.readFileSync(new URL('../palomares/SCRIPT.md', import.meta.url), 'utf8').split('\n')) { const m = l.match(/^(\d+[ab]?)\. (.*)$/); if (m) LINES.push(m[2].trim()); }
export const voice = { engine: 'elevenlabs', voiceId: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
  takes: 1, maxWer: 0.6, parallel: 3, perLine: true, lineGap: 0.32, budget: 16000 };
export default { title: 'palomares vo', fps: 30, width: 640, height: 360, voice, settings: { fps: 30 }, shots: LINES.map((t, i) => ({ id: `l${String(i + 1).padStart(3, '0')}`, set: 'none', vo: t })) };
