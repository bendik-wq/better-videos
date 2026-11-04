// team: a grid of little people that fills to show a team size range, with a live counter and label.
// params: min (30), max (200), per (people per icon; default 5 when max > 100, else 1), cols, slots (icons in the grid),
//         label ('30–200 EMPLOYEES'), at (cue for filling to min), atMax (cue for filling to max),
//         note (line under the grid; default '1 ICON = 5 PEOPLE' when per > 1)
// Below min: ink. min..max: money green. Above max: faint, struck out.
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const min = p.min ?? 30, max = p.max ?? 200, per = p.per ?? (max > 100 ? 5 : 1), cols = p.cols, slots = p.slots; // grid shape resolved per orientation in draw()
    const v0 = Q.first(shot);
    const at = Q.at(shot, p.at, v0 + 0.1), atMax = Math.max(at + 0.8, Q.at(shot, p.atMax, at + 1.2));
    const sfx = [Q.fx('ui.ticks', at, 0.3, { count: 6, period: 0.06 }), Q.fx('ui.ticks', atMax, 0.3, { count: 16, period: 0.07, accel: -0.3 }), Q.fx('impact.soft', atMax + 1.2, 0.45), Q.fx('marker.swipe', atMax + 1.3, 0.35)];
    return { min, max, per, cols, slots, at, atMax, label: p.label ?? `${min}–${max} EMPLOYEES`, note: p.note ?? (per > 1 ? `1 ICON = ${per} PEOPLE` : null), sfx, hits: [{ at: atMax + 1.2, amp: 0.7 }] };
  },
  draw(g, t, shot, P) {
    // portrait: counter on top, grid below; landscape: counter + label on the left, a wider grid on the right
    const F = L.pick({ gx0: L.SAFE.x0, gx1: L.SAFE.x1, top: 520, bottom: 1350, ccx: L.SAFE.cx, cy: 400, csz: 200, ly: 488, lw: L.SAFE.w, ny: 1440 },
      { gx0: 740, gx1: 1800, top: 110, bottom: 820, ccx: 410, cy: 430, csz: 250, ly: 545, lw: 560, ny: 760 });
    if (!P.grid) { const nI = P.max / P.per, cols = P.cols ?? L.pick(nI > 60 ? 12 : 8, nI > 60 ? 20 : 10); P.grid = { cols, slots: P.slots ?? Math.ceil(nI * 1.15 / cols) * cols }; }
    const { cols, slots } = P.grid;
    const rows = Math.ceil(slots / cols), top = F.top, bottom = F.bottom, cw = (F.gx1 - F.gx0) / cols, ch = (bottom - top) / rows;
    const n1 = P.min * L.outCubic(L.range(t, P.at, P.at + 0.6)), n2 = (P.max - P.min) * L.outCubic(L.range(t, P.atMax, P.atMax + 1.2));
    const cur = Math.round(n1 + n2);
    // counter
    const ca = L.pop(t, 0.04, 0.4);
    g.save(); g.globalAlpha = ca.a; g.font = L.font(900, F.csz); g.textAlign = 'center'; g.fillStyle = cur >= P.min ? L.PAL.green : L.PAL.ink;
    g.translate(F.ccx, F.cy); const pk = 1 + 0.05 * Math.sin(Math.PI * L.range(t, P.atMax + 1.2, P.atMax + 1.45)); g.scale(pk, pk); g.fillText(String(cur), 0, 0); g.restore();
    const lu = L.range(t, P.atMax + 1.2, P.atMax + 1.5);
    if (!P.lsz) P.lsz = L.fit(g, P.label, F.lw, 84, 50, 900);
    g.save(); g.font = L.font(900, P.lsz); const lw = g.measureText(P.label).width; g.restore();
    L.swipe(g, F.ccx - lw / 2 - 14, F.ly - P.lsz * 0.79, lw + 28, P.lsz * 0.9, lu, { seed: 9 });
    g.save(); g.font = L.font(900, P.lsz); g.textAlign = 'center'; g.fillStyle = L.PAL.ink; g.globalAlpha = Math.max(0.35, lu) * ca.a; g.fillText(P.label, F.ccx, F.ly); g.restore();
    // people (one icon = P.per people)
    const per = P.per, fMin = n1 / per, fAll = (n1 + n2) / per, maxI = P.max / per;
    for (let i = 0; i < slots; i++) {
      const r = Math.floor(i / cols), c = i % cols, x = F.gx0 + (c + 0.5) * cw, y = top + (r + 0.5) * ch;
      const appear = L.range(t, 0.05 + (r + c) * 0.02, 0.3 + (r + c) * 0.02); if (appear <= 0) continue;
      const inMin = i < fMin - 0.01, inMax = !inMin && i < fAll - 0.01;
      const fillAt = i * per < P.min ? P.at + 0.6 * (i * per / P.min) : P.atMax + 1.2 * ((i * per - P.min) / Math.max(1, P.max - P.min));
      const pp = (inMin || inMax) ? 1 + 0.3 * Math.max(0, 1 - (t - fillAt) / 0.25) : 1;
      const s = Math.max(0, Math.min(cw, ch) * 0.46 * appear * pp + L.bob(t, 0.6, 0.5, i * 0.07));
      g.fillStyle = i < maxI ? (inMin ? L.PAL.ink : inMax ? L.PAL.green : '#d3ccbc') : '#e4dfd2';
      g.beginPath(); g.arc(x, y - s * 0.5, Math.max(0, s * 0.3), 0, 7); g.fill();
      g.beginPath(); g.ellipse(x, y + s * 0.42, s * 0.48, s * 0.4, 0, Math.PI, 0); g.fill();
    }
    // icons beyond the max: struck out
    const lastRow = Math.floor(maxI / cols), su = L.range(t, P.atMax + 1.3, P.atMax + 1.6), rem = maxI - lastRow * cols;
    if (Math.ceil(maxI) < slots && su > 0) for (let r = lastRow; r < rows; r++) {
      const x0 = r === lastRow ? F.gx0 + rem * cw : F.gx0; if (x0 >= F.gx1 - 1) continue;
      L.strike(g, x0 + 10, top + (r + 0.5) * ch, F.gx1 - x0 - 20, su, { lw: 9 });
    }
    if (P.note) L.label(g, P.note.toUpperCase(), F.ccx, F.ny, { align: 'center', size: L.pick(44, 38), maxW: L.pick(L.SAFE.w, 560), alpha: L.range(t, P.atMax + 1.4, P.atMax + 1.8) });
  },
};
