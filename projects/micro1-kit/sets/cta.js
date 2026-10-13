// cta: end card. "SEARCH:" + a search bar that types the query, a sub line with a check, and the standing
// disclaimer (always on; legible, never below 44 px).
// params: text ('micro1 Company Data Partnerships'), pre ('SEARCH'), sub ('Apply takes ~2 minutes'),
//         disclaimer ('Independent channel · not affiliated with micro1 · payouts not guaranteed'), at (typing start)
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';
import { icon } from '../kit/icons.js';

export const DISCLAIMER = 'Independent channel · not affiliated with micro1 · payouts not guaranteed';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const text = String(p.text ?? 'micro1 Company Data Partnerships');
    const at = Q.at(shot, p.at, 0.45), cps = p.cps ?? 26, typed = at + text.length / cps;
    const subAt = Q.at(shot, p.subAt, typed + 0.3);
    const sfx = [Q.fx('marker.swipe', 0.3, 0.35), Q.fx('impact.soft', at - 0.15, 0.35), Q.fx('type.run', at, 0.3, { chars: Math.min(60, text.length), cps }), Q.fx('ui.tick', typed + 0.05, 0.5), Q.fx('impact.soft', subAt, 0.35)];
    return { text, pre: String(p.pre ?? 'SEARCH').toUpperCase(), sub: p.sub ?? 'Apply takes ~2 minutes', disclaimer: p.disclaimer ?? DISCLAIMER, at, cps, typed, subAt, sfx, hits: [{ at: subAt, amp: 0.6 }] };
  },
  draw(g, t, shot, P) {
    // SEARCH:
    const pa = L.slam(t, 0.08, 0.3);
    g.save(); g.font = L.font(900, 190); const pw = g.measureText(P.pre + ':').width; g.restore();
    L.swipe(g, L.SAFE.cx - pw / 2 - 20, 436, pw + 40, 160, L.range(t, 0.3, 0.6), { seed: 21 });
    if (pa.a > 0) { g.save(); g.translate(L.SAFE.cx, 520); g.scale(pa.s, pa.s); g.globalAlpha = pa.a; g.font = L.font(900, 190); g.textAlign = 'center'; g.fillStyle = L.PAL.ink; g.fillText(P.pre + ':', 0, 66); g.restore(); }
    // search bar
    const X = L.SAFE.x0, Y = 660, Wb = L.SAFE.w;
    if (!P.tb) P.tb = L.fitBlock(g, P.text, Wb - 210, 230, 92, { weight: 700, maxLines: 2, lh: 1.08 });
    const bh = Math.max(200, P.tb.lines.length * P.tb.lh + 80), ba = L.pop(t, P.at - 0.25, 0.4, 1.6);
    if (ba.a > 0) {
      g.save(); g.globalAlpha = ba.a; g.translate(L.SAFE.cx, Y + bh / 2); g.scale(L.lerp(0.85, 1, ba.s), L.lerp(0.85, 1, ba.s)); g.translate(-L.SAFE.cx, -Y - bh / 2);
      L.card(g, X, Y, Wb, bh, { r: 56, fill: '#ffffff', stroke: L.PAL.ink, lw: 6, lift: 1.4 });
      icon(g, 'search', X + 90, Y + bh / 2, 104, { t, u: 1 });
      g.font = L.font(700, P.tb.size, L.FONT.body); g.fillStyle = L.PAL.ink; g.textAlign = 'left';
      let left = Math.floor(Math.max(0, t - P.at) * P.cps); const tx = X + 170, ty = Y + bh / 2 - (P.tb.lines.length * P.tb.lh) / 2 + P.tb.size * 0.8;
      let cx = tx, cy = ty;
      P.tb.lines.forEach((ln, i) => { if (left < 0) return; const s = ln.slice(0, Math.max(0, left)); left -= ln.length + 1; g.fillText(s, tx, ty + i * P.tb.lh); if (s.length) { cx = tx + g.measureText(s).width; cy = ty + i * P.tb.lh; } });
      if (Math.floor(t * 2.2) % 2 === 0 || t < P.typed) { g.fillStyle = L.PAL.green; g.fillRect(cx + 6, cy - P.tb.size * 0.78, 9, P.tb.size * 0.92); }
      g.restore();
    }
    // sub line with a check
    const su = L.pop(t, P.subAt, 0.4);
    if (su.a > 0) {
      if (!P.sb) P.sb = L.fit(g, P.sub, L.SAFE.w - 150, 76, 48, 700, L.FONT.body);
      g.save(); g.globalAlpha = su.a; g.font = L.font(700, P.sb, L.FONT.body); const sw = g.measureText(P.sub).width + 110, sx = L.SAFE.cx - sw / 2, sy = Y + bh + 150;
      g.translate(0, (1 - L.outCubic(su.u)) * 30);
      g.fillStyle = L.PAL.green; g.beginPath(); g.arc(sx + 40, sy - P.sb * 0.32, 40, 0, 7); g.fill();
      L.check(g, sx + 40, sy - P.sb * 0.32, 56, L.range(t, P.subAt + 0.1, P.subAt + 0.4), { color: L.PAL.card });
      g.fillStyle = L.PAL.ink; g.fillText(P.sub, sx + 110, sy); g.restore();
    }
    // disclaimer: small but legible, always present
    if (!P.db) P.db = L.fitBlock(g, P.disclaimer, L.SAFE.w - 40, 150, 54, { weight: 600, maxLines: 2, min: 44, lh: 1.2 });
    g.save(); g.font = L.font(500, P.db.size, L.FONT.body); g.fillStyle = L.PAL.inkSoft; g.textAlign = 'center'; g.globalAlpha = L.range(t, 0.1, 0.4);
    g.strokeStyle = L.PAL.rule; g.lineWidth = 3; g.beginPath(); g.moveTo(L.SAFE.x0 + 60, 1300); g.lineTo(L.SAFE.x1 - 60, 1300); g.stroke();
    P.db.lines.forEach((ln, i) => g.fillText(ln, L.SAFE.cx, 1370 + i * P.db.lh)); g.restore();
  },
};
