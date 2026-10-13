// tiers: payout tier cards that build up on their words (portrait: stacked rows; landscape: a podium), with an optional note.
// params: tiers: [{ amount, label, word|at }] (bottom/smallest first; default $100K+ / $500K+ / $1M+),
//         title ('PUBLISHED PAYOUT TIERS'), note ('Depends on quality, volume, uniqueness'), noteAt, highlight (note words to swipe)
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

const DEF = [{ amount: '$100K+', label: 'Tier 1' }, { amount: '$500K+', label: 'Tier 2' }, { amount: '$1M+', label: 'Tier 3' }];

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const tiers = Q.list(p.tiers, DEF).map((x) => (typeof x === 'string' ? { amount: x } : { ...x }));
    const times = Q.items(shot, tiers, { text: (x) => `${x.amount} ${x.label ?? ''}`.replace(/[$+]/g, ''), from: Math.max(0.2, Q.first(shot)) });
    tiers.forEach((x, i) => (x.at = times[i]));
    const noteAt = p.note ? Q.at(shot, p.noteAt, tiers.at(-1).at + 0.8) : null;
    const sfx = tiers.flatMap((x, i) => [Q.fx('whoosh.xs', x.at - 0.12, 0.22), Q.fx(i === tiers.length - 1 ? 'impact.hit' : 'impact.soft', x.at + 0.1, i === tiers.length - 1 ? 0.45 : 0.4)]);
    if (noteAt != null) sfx.push(Q.fx('marker.swipe', noteAt + 0.35, 0.35));
    return { tiers, title: p.title ?? 'PUBLISHED PAYOUT TIERS', note: p.note, noteAt, hl: Q.list(p.highlight, ['quality', 'volume', 'uniqueness']), sfx, hits: tiers.map((x, i) => ({ at: x.at + 0.1, amp: 0.5 + i * 0.3 })) };
  },
  draw(g, t, shot, P) {
    const n = P.tiers.length;
    if (!P.ts) P.ts = L.fit(g, P.title, L.SAFE.w, L.pick(120, 110), 60, 900);
    const a = L.pop(t, 0.05, 0.4);
    g.save(); g.globalAlpha = a.a; g.font = L.font(900, P.ts); g.fillStyle = L.PAL.ink; g.textAlign = 'center'; g.fillText(P.title, L.SAFE.cx, L.pick(250, 90) + P.ts * 0.8); g.restore();
    if (L.LAND) podium(g, t, P); else
    { const top = 260 + P.ts + 50, bottom = P.note ? 1230 : 1440, gap = 30, ch = Math.min(280, (bottom - top - gap * (n - 1)) / n);
    P.tiers.forEach((x, i) => {
      const slot = n - 1 - i, y = top + slot * (ch + gap) + (bottom - top - n * ch - (n - 1) * gap);
      const u = L.range(t, x.at - 0.08, x.at + 0.4);
      if (u <= 0) { g.save(); g.globalAlpha = 0.45 * L.range(t, 0.05, 0.3); g.setLineDash([16, 14]); g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 4; L.rr(g, L.SAFE.x0, y, L.SAFE.w, ch, 28); g.stroke(); g.restore(); return; }
      const top1 = i === n - 1, dy = (1 - L.outBack(u, 1.6)) * 220;
      g.save(); g.translate(0, dy + L.bob(t, 2, 0.3, i * 0.3)); g.globalAlpha = L.clamp(u * 3);
      L.card(g, L.SAFE.x0, y, L.SAFE.w, ch, { r: 28, fill: top1 ? L.PAL.green : L.PAL.card, stroke: L.PAL.ink, lw: 4 });
      // magnitude bar (log scale) along the bottom of the card
      const mag = (i + 1) / n, bu = L.range(t, x.at + 0.15, x.at + 0.7);
      g.fillStyle = top1 ? 'rgba(255,255,255,0.25)' : L.PAL.greenTint; L.rr(g, L.SAFE.x0 + 30, y + ch - 46, (L.SAFE.w - 60) * mag * L.outExpo(bu), 18, 9); g.fill();
      if (!x.fs) x.fs = L.fit(g, x.amount, 520, ch * 0.62, 80, 900);
      g.font = L.font(900, x.fs); g.fillStyle = top1 ? L.PAL.card : L.PAL.ink; g.textAlign = 'left';
      g.fillText(x.amount, L.SAFE.x0 + 40, y + ch * 0.5 + x.fs * 0.33 - 10);
      if (x.label) {
        if (!x.lb) x.lb = L.fitBlock(g, String(x.label), 330, ch - 90, 56, { weight: 700, maxLines: 2 });
        g.font = L.font(700, x.lb.size, L.FONT.body); g.textAlign = 'right'; g.fillStyle = top1 ? L.PAL.card : L.PAL.inkSoft;
        const ly = y + ch * 0.5 - (x.lb.lines.length * x.lb.lh) / 2 + x.lb.size * 0.8 - 10;
        x.lb.lines.forEach((ln, k) => g.fillText(ln, L.SAFE.x1 - 36, ly + k * x.lb.lh));
      }
      g.restore();
    }); }
    if (P.note) {
      const na = L.range(t, P.noteAt, P.noteAt + 0.35);
      if (na > 0) {
        if (!P.nb) P.nb = L.fitBlock(g, P.note, L.SAFE.w, L.pick(200, 70), L.pick(62, 56), { weight: 700, maxLines: L.pick(2, 1) });
        g.save(); g.globalAlpha = na; g.translate(0, (1 - L.outCubic(na)) * 30);
        g.font = L.font(700, P.nb.size, L.FONT.body); const sp = g.measureText(' ').width;
        P.nb.lines.forEach((ln, k) => {
          const y = L.pick(1300, 800) + k * P.nb.lh, wl = g.measureText(ln).width; let x0 = L.SAFE.cx - wl / 2;
          for (const w of ln.split(' ')) { const ww = g.measureText(w).width;
            if (P.hl.some((h) => Q.norm(w).startsWith(Q.norm(h)))) L.swipe(g, x0 - 6, y - P.nb.size * 0.82, ww + 12, P.nb.size * 0.98, L.range(t, P.noteAt + 0.3, P.noteAt + 0.65), { seed: L.hash(w) });
            g.fillStyle = L.PAL.ink; g.fillText(w, x0, y); x0 += ww + sp; }
        });
        g.restore();
      }
    }
  },
};

// landscape: a podium, smallest tier on the left; columns rise from below on their words
function podium(g, t, P) {
  const n = P.tiers.length, gap = 60, cw = Math.min(470, (L.SAFE.w - gap * (n - 1)) / n), x0 = L.SAFE.cx - (cw * n + gap * (n - 1)) / 2;
  const top = 90 + P.ts + 50, bottom = P.note ? 735 : 810, H0 = bottom - top;
  P.tiers.forEach((x, i) => {
    const h = H0 * (n > 1 ? 0.55 + 0.45 * i / (n - 1) : 1), X = x0 + i * (cw + gap), y = bottom - h;
    const u = L.range(t, x.at - 0.08, x.at + 0.4);
    if (u <= 0) { g.save(); g.globalAlpha = 0.45 * L.range(t, 0.05, 0.3); g.setLineDash([16, 14]); g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 4; L.rr(g, X, y, cw, h, 28); g.stroke(); g.restore(); return; }
    const top1 = i === n - 1, dy = (1 - L.outBack(u, 1.6)) * 320;
    g.save(); g.beginPath(); g.rect(X - 40, 0, cw + 80, bottom + 30); g.clip();
    g.translate(0, dy + L.bob(t, 2, 0.3, i * 0.3)); g.globalAlpha = L.clamp(u * 3);
    L.card(g, X, y, cw, h, { r: 28, fill: top1 ? L.PAL.green : L.PAL.card, stroke: L.PAL.ink, lw: 4 });
    if (!x.fsL) x.fsL = L.fit(g, x.amount, cw - 60, 150, 70, 900);
    g.font = L.font(900, x.fsL); g.fillStyle = top1 ? L.PAL.card : L.PAL.ink; g.textAlign = 'center';
    g.fillText(x.amount, X + cw / 2, y + 40 + x.fsL * 0.72);
    if (x.label) {
      if (!x.lbL) x.lbL = L.fitBlock(g, String(x.label), cw - 60, 120, 52, { weight: 700, maxLines: 2 });
      g.font = L.font(700, x.lbL.size, L.FONT.body); g.fillStyle = top1 ? L.PAL.card : L.PAL.inkSoft;
      x.lbL.lines.forEach((ln, k) => g.fillText(ln, X + cw / 2, y + 60 + x.fsL * 0.72 + x.lbL.size + k * x.lbL.lh));
    }
    // magnitude bar along the foot
    const bu = L.range(t, x.at + 0.15, x.at + 0.7);
    g.fillStyle = top1 ? 'rgba(255,255,255,0.25)' : L.PAL.greenTint; L.rr(g, X + 30, y + h - 44, (cw - 60) * L.outExpo(bu), 16, 8); g.fill();
    g.restore();
  });
}
