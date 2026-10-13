// window: a 12-month calendar grid; months burn/fill from the first one like a progress bar.
// params: fill (0..1 of the 12 months, or a month count > 1; default 1/12), label ('$1B · 12 MONTHS'), start ('OCT'),
//         year (2026), at (fill cue), mark ('NOW': tag on the last filled month), sub (line under the grid)
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const fill = p.fill == null ? 1 / 12 : p.fill > 1 ? p.fill / 12 : p.fill;
    const at = Q.at(shot, p.at, Math.max(0.3, Q.first(shot) + 0.2)), dur = 0.5 + 1.4 * fill;
    const m0 = Math.max(0, MON.indexOf(String(p.start ?? 'OCT').slice(0, 3).toUpperCase())), y0 = p.year ?? 2026;
    const months = Array.from({ length: 12 }, (_, i) => ({ m: MON[(m0 + i) % 12], y: y0 + Math.floor((m0 + i) / 12) }));
    const sfx = [Q.fx('ui.ticks', at, 0.3, { count: Math.max(2, Math.round(fill * 12)), period: dur / Math.max(2, fill * 12) }), Q.fx('impact.soft', at + dur, 0.4)];
    return { fill, at, dur, months, label: p.label ?? '$1B · 12 MONTHS', mark: p.mark ?? 'NOW', sub: p.sub, sfx, hits: [{ at: at + dur, amp: 0.6 }] };
  },
  draw(g, t, shot, P) {
    if (!P.ls) P.ls = L.fit(g, P.label, L.SAFE.w, 150, 70, 900);
    const la = L.pop(t, 0.05, 0.45);
    g.save(); g.globalAlpha = la.a; g.font = L.font(900, P.ls); g.textAlign = 'center'; g.fillStyle = L.PAL.ink;
    g.translate(L.SAFE.cx, 250 + P.ls * 0.8); g.scale(la.s, la.s); g.fillText(P.label, 0, 0); g.restore();
    const cols = 3, gx = 34, gy = 30, cw = (L.SAFE.w - gx * (cols - 1)) / cols, chh = 190, top = 300 + P.ls;
    const f = 12 * P.fill * L.outCubic(L.range(t, P.at, P.at + P.dur)), last = Math.max(0, Math.ceil(12 * P.fill) - 1);
    P.months.forEach((mo, i) => {
      const r = Math.floor(i / cols), c = i % cols, x = L.SAFE.x0 + c * (cw + gx), y = top + r * (chh + gy);
      const ap = L.pop(t, 0.08 + i * 0.035, 0.35); if (ap.a <= 0) return;
      g.save(); g.translate(x + cw / 2, y + chh / 2); g.scale(ap.s, ap.s); g.translate(-x - cw / 2, -y - chh / 2); g.globalAlpha = ap.a;
      L.card(g, x, y, cw, chh, { r: 22, stroke: L.PAL.ink, lw: 3 });
      const k = L.clamp(f - i);
      if (k > 0) {
        g.save(); L.rr(g, x, y, cw, chh, 22); g.clip();
        g.fillStyle = L.PAL.green; g.fillRect(x, y, cw * k, chh);
        if (k < 1) { // burning edge
          const ex = x + cw * k; g.fillStyle = L.PAL.yellow; g.fillRect(ex - 10, y, 14, chh);
          g.fillStyle = 'rgba(255,225,77,0.45)'; for (let j = 0; j < 5; j++) { const yy = y + (j + 0.5) * chh / 5; g.beginPath(); g.arc(ex + 4, yy, 10 + 6 * Math.sin(t * 20 + j * 2), 0, 7); g.fill(); }
        }
        g.restore();
      }
      const on = k > 0.55;
      g.font = L.font(900, 92); g.textAlign = 'center'; g.fillStyle = on ? L.PAL.card : L.PAL.ink; g.fillText(mo.m, x + cw / 2, y + 112);
      L.label(g, String(mo.y), x + cw / 2, y + 166, { size: 44, align: 'center', color: on ? L.PAL.card : L.PAL.inkSoft });
      g.restore();
      if (i === last && P.mark && f >= last + 0.6) {
        const pu = 0.5 + 0.5 * Math.sin(t * 5.5);
        g.save(); g.strokeStyle = L.PAL.yellow; g.lineWidth = 8 + 4 * pu; L.rr(g, x - 8, y - 8, cw + 16, chh + 16, 28); g.stroke(); g.restore();
        const tp = L.pop(t, P.at + P.dur * 0.9, 0.35);
        g.save(); g.globalAlpha = tp.a; g.translate(x + cw - 10, y - 6); g.scale(tp.s, tp.s); g.font = L.font(900, 56); const tw = g.measureText(P.mark).width + 36;
        g.fillStyle = L.PAL.ink; L.rr(g, -tw, -40, tw, 72, 14); g.fill(); g.fillStyle = L.PAL.yellow; g.textAlign = 'center'; g.fillText(P.mark, -tw / 2, 18); g.restore();
      }
    });
    // progress bar under the grid
    const by = top + 4 * (chh + gy) + 20;
    g.fillStyle = L.PAL.rule; L.rr(g, L.SAFE.x0, by, L.SAFE.w, 22, 11); g.fill();
    g.fillStyle = L.PAL.green; L.rr(g, L.SAFE.x0, by, Math.max(22, L.SAFE.w * f / 12), 22, 11); g.fill();
    const txt = P.sub ?? `${Math.min(12, Math.max(0, Math.ceil(f - 0.01)))} OF 12 MONTHS`;
    L.label(g, txt.toUpperCase(), L.SAFE.cx, by + 96, { align: 'center', size: 46, color: L.PAL.ink, alpha: L.range(t, 0.2, 0.5) });
  },
};
