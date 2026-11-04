// checklist: rows tick in on their spoken words (green checks); 'x' rows get a red cross and a red strike.
// params: title, items: ['text' | { text, word|at, x: true }]  ('!text' is shorthand for an x item), kicker
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const items = Q.list(p.items).map((it) => {
      const o = typeof it === 'string' ? { text: it } : { ...it };
      if (o.text.startsWith('!')) { o.text = o.text.slice(1).trim(); o.x = true; }
      return o;
    });
    const times = Q.items(shot, items, { from: Math.max(0.2, Q.first(shot)) });
    items.forEach((it, i) => (it.at = times[i]));
    const sfx = items.flatMap((it, i) => [Q.fx('whoosh.xs', it.at - 0.05, 0.18, undefined), it.x ? Q.fx('marker.swipe', it.at + 0.18, 0.5) : Q.fx('ui.tick', it.at + 0.14, 0.6, { pitch: 1 + i * 0.08 })]);
    return { title: p.title, kicker: p.kicker, items, sfx, hits: items.map((it) => ({ at: it.at + 0.15, amp: 0.4 })) };
  },
  draw(g, t, shot, P) {
    const n = P.items.length, Wc = L.pick(L.SAFE.w, 1320), X = L.SAFE.cx - Wc / 2;
    let y0 = L.pick(260, 100);
    if (P.kicker) { L.kicker(g, P.kicker, X, y0, t, 0.05); y0 += L.pick(110, 95); }
    if (P.title) {
      if (!P.ts) P.ts = L.fitBlock(g, String(P.title).toUpperCase(), Wc, L.pick(260, 200), L.pick(140, 120), { weight: 900, fam: L.FONT.display, lh: 0.92, maxLines: 2, min: 70 });
      const a = L.pop(t, 0.08, 0.45);
      g.save(); g.globalAlpha = a.a; g.translate(X, (1 - L.outCubic(a.u)) * 30); g.font = L.font(900, P.ts.size); g.fillStyle = L.PAL.ink;
      P.ts.lines.forEach((ln, i) => g.fillText(ln, 0, y0 + P.ts.size * 0.8 + i * P.ts.lh)); g.restore();
      y0 += P.ts.lines.length * P.ts.lh + 50;
    }
    const avail = L.pick(1460, 830) - y0, rowH = Math.min(L.pick(260, 215), avail / n), cardH = rowH - L.pick(30, 24);
    if (!P.fs) P.fs = P.items.map((it) => L.fitBlock(g, it.text, Wc - cardH - 70, cardH - 24, Math.min(92, cardH * 0.42), { weight: 700, maxLines: 2 }));
    P.items.forEach((it, i) => {
      const y = y0 + i * rowH, u = L.range(t, it.at - 0.05, it.at + 0.35);
      // ghost slot until the row arrives
      if (u < 1) { g.save(); g.globalAlpha = 0.5 * (1 - u) * L.range(t, 0.05, 0.35); g.setLineDash([16, 14]); g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 4; L.rr(g, X, y, Wc, cardH, 24); g.stroke(); g.restore(); }
      if (u <= 0) return;
      const dx = (1 - L.outBack(u, 1.4)) * 160 + L.bob(t, 1.5, 0.4, i * 0.2);
      g.save(); g.translate(dx, 0); g.globalAlpha = L.clamp(u * 3);
      L.card(g, X, y, Wc, cardH, { r: 24, fill: it.x ? '#f6ece8' : L.PAL.card });
      // tick box
      const bx = X + 26 + cardH * 0.36, by = y + cardH / 2, br = cardH * 0.3, cu = L.range(t, it.at + 0.12, it.at + 0.42);
      g.fillStyle = cu > 0 ? (it.x ? L.PAL.red : L.PAL.green) : L.PAL.card; g.strokeStyle = cu > 0 ? (it.x ? L.PAL.red : L.PAL.green) : L.PAL.ink; g.lineWidth = 5;
      g.beginPath(); g.arc(bx, by, br * (1 + 0.18 * Math.sin(Math.PI * cu) * (1 - cu)), 0, 7); g.fill(); g.stroke();
      if (it.x) L.cross(g, bx, by, br * 1.6, cu, { color: L.PAL.card }); else L.check(g, bx, by, br * 1.5, cu, { color: L.PAL.card });
      // text
      const f = P.fs[i], tx = bx + br + 34;
      g.font = L.font(700, f.size, L.FONT.body); g.fillStyle = it.x ? L.PAL.inkSoft : L.PAL.ink; g.textBaseline = 'alphabetic';
      const ty0 = by - (f.lines.length * f.lh) / 2 + f.size * 0.82;
      f.lines.forEach((ln, k) => { g.fillText(ln, tx, ty0 + k * f.lh); if (it.x) L.strike(g, tx, ty0 + k * f.lh - f.size * 0.32, g.measureText(ln).width, L.range(t, it.at + 0.2 + k * 0.1, it.at + 0.5 + k * 0.1)); });
      g.restore();
    });
  },
};
