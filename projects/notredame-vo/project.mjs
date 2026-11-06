// Voice pass for episode 10: one shot per script line, so every line is voiced once (per-line cache); the real shot list
// in projects/notredame/project.mjs reuses the cached lines whatever their grouping.
import fs from 'node:fs';
const LINES = [];
for (const l of fs.readFileSync(new URL('../notredame/SCRIPT.md', import.meta.url), 'utf8').split('\n')) { const m = l.match(/^(\d+[ab]?)\. (.*)$/); if (m) LINES.push(m[2].trim()); }
const SAY = { 'Nuñez': 'Noon-yez', 'Gallet': 'Gal-lay', 'Weil': 'Vay', 'Gontier': 'Gon-tyay', 'Jost': 'Zhost', 'Jean-Claude': 'Zhon-Clode', 'Jean-Marie': 'Zhon-Marie' };
// ElevenLabs when the key is present (final narration); otherwise a local placeholder voice for timing and stills QA only.
export const voice = !process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_PROXY ? { engine: 'kokoro', name: 'bm_george', speed: 1.0, perLine: true, lineGap: 0.32, say: SAY } : { engine: 'elevenlabs', voiceId: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
  say: SAY,
  takes: 1, maxWer: 0.6, parallel: 3, perLine: true, lineGap: 0.32, budget: 16000 };
export default { title: 'notredame vo', fps: 30, width: 640, height: 360, voice, settings: { fps: 30 }, shots: LINES.map((t, i) => ({ id: `l${String(i + 1).padStart(3, '0')}`, set: 'none', params: { n: i }, vo: t })) };
