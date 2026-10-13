// docstack: paper document cards fly in on their words and land in a fanned stack (2D tilt, soft shadows).
// params: docs: ['SOP' | { label, word|at, icon, sub }], title (headline above the stack), kicker
// Default docs: SOP / PLAYBOOK / KNOWLEDGE BASE / CRM WORKFLOW / QA CHECKLIST.
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';
import { icon } from '../kit/icons.js';

const ICON = { SOP: 'doc', PLAYBOOK: 'chart', 'KNOWLEDGE BASE': 'building', 'CRM WORKFLOW': 'gear', 'QA CHECKLIST': 'shield' };
const SUB = { SOP: 'STANDARD OPERATING PROCEDURE', PLAYBOOK: 'HOW THE TEAM WINS', 'KNOWLEDGE BASE': 'ANSWERS, IN ONE PLACE', 'CRM WORKFLOW': 'WHO DOES WHAT, WHEN', 'QA CHECKLIST': 'HOW WORK GETS CHECKED' };

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const docs = Q.list(p.docs, ['SOP', 'PLAYBOOK', 'KNOWLEDGE BASE', 'CRM WORKFLOW', 'QA CHECKLIST']).map((d) => (typeof d === 'string' ? { label: d } : { ...d }));
    const times = Q.items(shot, docs, { text: (d) => d.label, from: Math.max(0.15, Q.first(shot)) });
    const n = docs.length;
    docs.forEach((d, i) => {
      d.label = String(d.label).toUpperCase(); d.at = times[i]; d.icon ??= ICON[d.label] ?? 'doc'; d.sub ??= SUB[d.label] ?? 'INTERNAL DOCUMENT';
      const k = n > 1 ? i / (n - 1) - 0.5 : 0, r = L.rng(L.hash(d.label, i));
      // layout in frame-relative terms; draw() turns them into positions for the current orientation
      d.k = k; d.jx = (r() - 0.5) * 30; d.rot = k * 0.34 + (r() - 0.5) * 0.06;
      d.from = { dx: (i % 2 ? 1 : -1) * (500 + r() * 200), rot: (i % 2 ? 1 : -1) * (0.7 + r() * 0.4) };
    });
    const sfx = docs.flatMap((d, i) => [Q.fx('paper.page', d.at - 0.1, 0.5, { dur: 0.5 }), Q.fx('impact.soft', d.at + 0.32, 0.25)]);
    return { docs, title: p.title, kicker: p.kicker, sfx, hits: docs.map((d) => ({ at: d.at + 0.32, amp: 0.45 })) };
  },
  draw(g, t, shot, P) {
    let yT = L.pick(250, 90);
    if (P.kicker) { L.kicker(g, P.kicker, L.SAFE.cx, yT, t, 0.05, { align: 'center' }); yT += L.pick(110, 90); }
    if (P.title) {
      if (!P.ts) P.ts = L.fit(g, String(P.title).toUpperCase(), L.SAFE.w, L.pick(150, 120), 60, 900);
      const a = L.pop(t, 0.06, 0.45); g.save(); g.globalAlpha = a.a; g.font = L.font(900, P.ts); g.textAlign = 'center'; g.fillStyle = L.PAL.ink;
      g.fillText(String(P.title).toUpperCase(), L.SAFE.cx, yT + P.ts * 0.8 + (1 - L.outCubic(a.u)) * 30); g.restore();
    }
    const CW = 520, CH = 660, cs = L.pick(1, P.title ? 0.74 : 0.82), cx0 = L.SAFE.cx, cy0 = L.pick(900, P.title ? 530 : 470);
    const pos = (d, i) => ({ x: cx0 + d.k * L.pick(210, 440) + d.jx, y: cy0 + Math.abs(d.k) * L.pick(70, 36) - i * L.pick(18, 10) });
    // empty drop zone until the first document lands
    const g0 = 1 - L.range(t, P.docs[0].at, P.docs[0].at + 0.3);
    if (g0 > 0) { g.save(); g.globalAlpha = 0.55 * g0 * L.range(t, 0.05, 0.35); g.setLineDash([18, 16]); g.lineDashOffset = -t * 30; g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 5;
      g.translate(cx0, cy0); g.rotate(-0.04 + 0.02 * Math.sin(t * 1.5)); g.scale(cs, cs); L.rr(g, -CW / 2, -CH / 2, CW, CH, 18); g.stroke(); g.restore();
      L.label(g, 'DROP ZONE', cx0, cy0 + 10, { align: 'center', size: 44, color: L.PAL.inkFaint, alpha: 0.8 * g0 }); }
    P.docs.forEach((d, i) => {
      const u = L.range(t, d.at - 0.12, d.at + 0.42); if (u <= 0) return;
      const e = L.outBack(u, 1.25), last = i === P.docs.length - 1 || t < P.docs[i + 1].at;
      const f = pos(d, i), x = L.lerp(f.x + d.from.dx, f.x, e) + L.bob(t, 3, 0.25, i * 0.17), y = L.lerp(L.H + 420, f.y, e) + L.bob(t, 4, 0.3, i * 0.29);
      const rot = L.lerp(d.from.rot, d.rot, L.outCubic(u)) + 0.012 * Math.sin(t * 1.1 + i);
      // pseudo-3D: the card tips back while flying (y squash + skew) and settles flat
      const tilt = (1 - L.outCubic(u)) * 0.5, sway = (last ? 0.05 : 0.02) * Math.sin(t * 1.3 + i * 0.7);
      g.save(); g.translate(x, y); g.rotate(rot); g.transform(Math.cos(sway), 0, -tilt * 0.4, 1 - tilt * 0.35, 0, 0); g.scale(cs, cs);
      const lift = 1 + 2.5 * (1 - L.outCubic(u));
      L.card(g, -CW / 2, -CH / 2, CW, CH, { r: 18, lift, stroke: L.PAL.ink, lw: 3 });
      // header band
      g.fillStyle = i === P.docs.length - 1 ? L.PAL.green : L.PAL.ink; L.rr(g, -CW / 2, -CH / 2, CW, 150, 18); g.fill(); g.fillRect(-CW / 2, -CH / 2 + 120, CW, 30);
      if (!d.fs) d.fs = L.fit(g, d.label, CW - 70, 96, 50, 900);
      g.font = L.font(900, d.fs); g.fillStyle = L.PAL.card; g.textAlign = 'left'; g.fillText(d.label, -CW / 2 + 34, -CH / 2 + 75 + d.fs * 0.34);
      // sub line + faux text lines + icon
      g.fillStyle = L.PAL.rule;
      for (let k = 0; k < 6; k++) { const w = (CW - 80) * (k % 3 === 2 ? 0.55 : 0.9 - (k % 2) * 0.12); L.rr(g, -CW / 2 + 34, -CH / 2 + 200 + k * 56, w, 20, 10); g.fill(); }
      icon(g, d.icon, CW / 2 - 90, CH / 2 - 90, 110, { t, u: L.range(t, d.at + 0.2, d.at + 0.6) });
      g.restore();
    });
  },
};
