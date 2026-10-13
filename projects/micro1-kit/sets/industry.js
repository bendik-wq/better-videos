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
    // portrait: everything stacked and centred; landscape: badge on the left, name + items in a right column
    const F = L.pick({ bx: L.SAFE.cx, by: 500, bs: 300, ring: 182, x: L.SAFE.x0, w: L.SAFE.w, center: true, ky: 236, bottom: 1470, itemMax: 66, nameMax: 170 },
      { bx: 440, by: 450, bs: 380, ring: 228, x: 780, w: 1020, center: false, ky: 100, bottom: 820, itemMax: 60, nameMax: 160 });
    if (P.kicker) L.kicker(g, P.kicker, F.center ? L.SAFE.cx : F.x, F.ky, t, 0.03, { align: F.center ? 'center' : 'left' });
    // rotating dashed ring behind the badge
    g.save(); g.globalAlpha = L.range(t, P.nameAt, P.nameAt + 0.4); g.translate(F.bx, F.by); g.rotate(t * 0.25); g.setLineDash([22, 18]); g.strokeStyle = L.PAL.green; g.lineWidth = 6;
    g.beginPath(); g.arc(0, 0, F.ring, 0, 7); g.stroke(); g.restore();
    badge(g, P.icon, F.bx, F.by, F.bs, { t, u: L.range(t, P.nameAt - 0.05, P.nameAt + 0.45) });
    if (!P.nb) P.nb = L.fitBlock(g, P.name, F.w, 300, F.nameMax, { weight: 900, fam: L.FONT.display, lh: 0.9, maxLines: 2, min: 80 });
    const ny = F.center ? 790 : 200 + P.nb.size * 0.7, na = L.slam(t, P.nameAt + 0.1, 0.3);
    if (na.a > 0) {
      g.save(); g.font = L.font(900, P.nb.size); g.textAlign = 'center';
      P.nb.lines.forEach((ln, k) => {
        const y = ny + k * P.nb.lh, w = g.measureText(ln).width, lx = F.center ? L.SAFE.cx : F.x + w / 2;
        L.swipe(g, lx - w / 2 - 16, y - P.nb.size * 0.76, w + 32, P.nb.size * 0.82, L.range(t, P.nameAt + 0.4 + k * 0.1, P.nameAt + 0.75 + k * 0.1), { seed: k + 3 });
        g.save(); g.translate(lx, y - P.nb.size * 0.35); g.scale(na.s, na.s); g.globalAlpha = na.a; g.fillStyle = L.PAL.ink; g.fillText(ln, 0, P.nb.size * 0.35); g.restore();
      });
      g.restore();
    }
    const iy0 = ny + (P.nb.lines.length - 1) * P.nb.lh + L.pick(70, 60);
    if (P.items.length) {
      L.label(g, P.itemsLabel, F.center ? L.SAFE.cx : F.x, iy0 + 30, { align: F.center ? 'center' : 'left', size: L.pick(44, 38), alpha: L.range(t, P.items[0].at - 0.3, P.items[0].at) });
      const rowH = Math.min(130, (F.bottom - iy0 - 70) / P.items.length);
      P.items.forEach((x, i) => {
        const y = iy0 + 70 + i * rowH, u = L.range(t, x.at - 0.05, x.at + 0.35); if (u <= 0) return;
        if (!x.f) x.f = L.fit(g, x.text, F.w - 150, Math.min(F.itemMax, rowH * 0.6), L.MIN_TEXT, 700, L.FONT.body);
        g.save(); g.globalAlpha = L.clamp(u * 3); g.translate((1 - L.outBack(u, 1.5)) * -120, 0);
        L.card(g, F.x, y, F.w, rowH - 18, { r: 20 });
        icon(g, 'doc', F.x + 58, y + (rowH - 18) / 2, 72, { t, u: L.range(t, x.at, x.at + 0.4) });
        g.font = L.font(700, x.f, L.FONT.body); g.fillStyle = L.PAL.ink; g.textAlign = 'left'; g.fillText(x.text, F.x + 120, y + (rowH - 18) / 2 + x.f * 0.34);
        g.restore();
      });
    }
  },
};
