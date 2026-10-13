// industry: an industry title card: pictogram badge, big name with highlighter, 2-4 example data items.
// params: name ('RECRUITING & BPO'), icon (people | person | briefcase | scales | truck | chart | code | building | headset |
//         doc | shield | chip | cash | cart | cross | gear | clock | calendar | search), items: ['...' | { text, word|at }],
//         kicker ('INDUSTRY 03'), itemsLabel ('DATA THEY ALREADY HAVE')
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';
import { badge, icon } from '../kit/icons.js';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const items = Q.list(p.items).slice(0, 4).map((x) => (typeof x === 'string' ? { text: x } : { ...x }));
    const nameAt = Q.at(shot, p.at, 0.1);
    const times = Q.items(shot, items, { from: Math.max(nameAt + 0.7, Q.first(shot) + 0.5) });
    items.forEach((x, i) => (x.at = Math.max(times[i], nameAt + 0.6 + i * 0.15)));
    const sfx = [Q.fx('impact.soft', nameAt + 0.05, 0.45), Q.fx('marker.swipe', nameAt + 0.45, 0.35), ...items.map((x, i) => Q.fx('ui.tick', x.at + 0.08, 0.55, { pitch: 1 + i * 0.1 }))];
    return { name: String(p.name ?? 'INDUSTRY').toUpperCase(), icon: p.icon ?? 'briefcase', kicker: p.kicker, itemsLabel: p.itemsLabel ?? 'DATA THEY ALREADY HAVE', nameAt, items, sfx, hits: [{ at: nameAt + 0.05, amp: 0.9 }] };
  },
  draw(g, t, shot, P) {
    if (P.kicker) L.kicker(g, P.kicker, L.SAFE.cx, 236, t, 0.03, { align: 'center' });
    const by = 500;
    // rotating dashed ring behind the badge
    g.save(); g.globalAlpha = L.range(t, P.nameAt, P.nameAt + 0.4); g.translate(L.SAFE.cx, by); g.rotate(t * 0.25); g.setLineDash([22, 18]); g.strokeStyle = L.PAL.green; g.lineWidth = 6;
    g.beginPath(); g.arc(0, 0, 182, 0, 7); g.stroke(); g.restore();
    badge(g, P.icon, L.SAFE.cx, by, 300, { t, u: L.range(t, P.nameAt - 0.05, P.nameAt + 0.45) });
    if (!P.nb) P.nb = L.fitBlock(g, P.name, L.SAFE.w, 300, 170, { weight: 900, fam: L.FONT.display, lh: 0.9, maxLines: 2, min: 80 });
    const ny = 790, na = L.slam(t, P.nameAt + 0.1, 0.3);
    if (na.a > 0) {
      g.save(); g.font = L.font(900, P.nb.size); g.textAlign = 'center';
      P.nb.lines.forEach((ln, k) => {
        const y = ny + k * P.nb.lh, w = g.measureText(ln).width;
        L.swipe(g, L.SAFE.cx - w / 2 - 16, y - P.nb.size * 0.76, w + 32, P.nb.size * 0.82, L.range(t, P.nameAt + 0.4 + k * 0.1, P.nameAt + 0.75 + k * 0.1), { seed: k + 3 });
        g.save(); g.translate(L.SAFE.cx, y - P.nb.size * 0.35); g.scale(na.s, na.s); g.globalAlpha = na.a; g.fillStyle = L.PAL.ink; g.fillText(ln, 0, P.nb.size * 0.35); g.restore();
      });
      g.restore();
    }
    const iy0 = ny + (P.nb.lines.length - 1) * P.nb.lh + 70;
    if (P.items.length) {
      L.label(g, P.itemsLabel, L.SAFE.cx, iy0 + 30, { align: 'center', size: 44, alpha: L.range(t, P.items[0].at - 0.3, P.items[0].at) });
      const rowH = Math.min(130, (1470 - iy0 - 70) / P.items.length);
      P.items.forEach((x, i) => {
        const y = iy0 + 70 + i * rowH, u = L.range(t, x.at - 0.05, x.at + 0.35); if (u <= 0) return;
        if (!x.f) x.f = L.fit(g, x.text, L.SAFE.w - 150, Math.min(66, rowH * 0.6), 44, 700, L.FONT.body);
        g.save(); g.globalAlpha = L.clamp(u * 3); g.translate((1 - L.outBack(u, 1.5)) * -120, 0);
        L.card(g, L.SAFE.x0, y, L.SAFE.w, rowH - 18, { r: 20 });
        icon(g, 'doc', L.SAFE.x0 + 58, y + (rowH - 18) / 2, 72, { t, u: L.range(t, x.at, x.at + 0.4) });
        g.font = L.font(700, x.f, L.FONT.body); g.fillStyle = L.PAL.ink; g.textAlign = 'left'; g.fillText(x.text, L.SAFE.x0 + 120, y + (rowH - 18) / 2 + x.f * 0.34);
        g.restore();
      });
    }
  },
};
