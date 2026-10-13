// qa: FAQ card. A question bubble types in (after a short "typing..." beat), then the answer headline pops,
// with highlighter on key words and an optional sub line.
// params: q (question), a (answer headline, short), sub, at (answer cue; default the first word after the question is read,
//         else 55% of the line), highlight (answer word(s)), cps (typing speed, default fits before the answer)
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const q = String(p.q ?? 'Question?'), a = String(p.a ?? 'Answer.').toUpperCase();
    const v0 = Q.first(shot), v1 = Q.lastEnd(shot);
    const ansAt = Q.at(shot, p.at, v0 + (v1 - v0) * 0.55);
    const t0 = 0.35, cps = p.cps ?? Math.min(60, Math.max(22, q.length / Math.max(0.6, ansAt - 0.3 - t0)));
    const typed = t0 + q.length / cps;
    const words = a.split(/\s+/).filter(Boolean), hl = Q.list(p.highlight);
    const ws = words.map((w, i) => ({ w, at: ansAt + i * 0.07, hl: hl.some((h) => Q.norm(w).startsWith(Q.norm(h))) }));
    const sfx = [Q.fx('ui.tick', 0.08, 0.4), Q.fx('type.run', t0, 0.28, { chars: Math.min(60, q.length), cps }), Q.fx('impact.hit', ansAt, 0.5), ...ws.filter((x) => x.hl).map((x) => Q.fx('marker.swipe', x.at + 0.3, 0.35))];
    return { q, ws, sub: p.sub, t0, cps, typed, ansAt, sfx, hits: [{ at: ansAt, amp: 1 }] };
  },
  draw(g, t, shot, P) {
    // question bubble
    const X = L.SAFE.x0, Y = 260, Wb = L.SAFE.w - 60;
    if (!P.qb) P.qb = L.fitBlock(g, P.q, Wb - 200, 420, 84, { weight: 700, maxLines: 5, lh: 1.12 });
    const bh = Math.max(180, P.qb.lines.length * P.qb.lh + 90), ap = L.pop(t, 0.04, 0.4, 1.8);
    g.save(); g.globalAlpha = ap.a; g.translate(X, Y + bh); g.scale(ap.s, ap.s); g.translate(-X, -Y - bh);
    g.fillStyle = L.PAL.ink; L.rr(g, X, Y, Wb, bh, 44); g.fill();
    g.beginPath(); g.moveTo(X + 70, Y + bh - 2); g.lineTo(X + 40, Y + bh + 56); g.lineTo(X + 140, Y + bh - 2); g.closePath(); g.fill();
    // Q tag
    g.fillStyle = L.PAL.yellow; g.beginPath(); g.arc(X + 86, Y + 86, 50, 0, 7); g.fill();
    g.fillStyle = L.PAL.ink; g.font = L.font(900, 76); g.textAlign = 'center'; g.fillText('Q', X + 86, Y + 112);
    g.textAlign = 'left'; g.font = L.font(700, P.qb.size, L.FONT.body); g.fillStyle = L.PAL.card;
    const n = Math.floor(Math.max(0, t - P.t0) * P.cps); let left = n;
    const tx = X + 170, ty = Y + 45 + P.qb.size * 0.85;
    if (t < P.t0) { for (let k = 0; k < 3; k++) { g.globalAlpha = ap.a * (0.35 + 0.65 * Math.max(0, Math.sin(t * 12 - k * 1.2))); g.beginPath(); g.arc(tx + 20 + k * 40, Y + bh / 2, 12, 0, 7); g.fill(); } g.globalAlpha = ap.a; }
    else P.qb.lines.forEach((ln, i) => {
      if (left <= 0) return; const s = ln.slice(0, left); left -= ln.length + 1;
      g.fillText(s, tx, ty + i * P.qb.lh);
      if (left <= 0 && Math.floor(t * 2.4) % 2 === 0) { const cw = g.measureText(s).width; g.fillStyle = L.PAL.yellow; g.fillRect(tx + cw + 6, ty + i * P.qb.lh - P.qb.size * 0.75, 8, P.qb.size * 0.9); g.fillStyle = L.PAL.card; }
    });
    g.restore();
    // answer
    const ay0 = Y + bh + 150;
    if (!P.ab) {
      P.ab = L.fitBlock(g, P.ws.map((x) => x.w).join(' '), L.SAFE.w, 1440 - ay0 - (P.sub ? 200 : 40), 190, { weight: 900, fam: L.FONT.display, lh: 0.95, maxLines: 4, min: 80 });
      g.font = L.font(900, P.ab.size); const sp = g.measureText(' ').width; let k = 0;
      P.ab.lines.forEach((ln, li) => { const wl = g.measureText(ln).width; let x = L.SAFE.x0; for (const w of ln.split(' ')) { const ww = g.measureText(w).width; Object.assign(P.ws[k++], { x, y: ay0 + P.ab.size * 0.8 + li * P.ab.lh, ww }); x += ww + sp; } });
    }
    const pa = L.range(t, P.ansAt - 0.2, P.ansAt);
    if (pa > 0) L.label(g, 'A.', L.SAFE.x0, ay0 - 40, { size: 48, color: L.PAL.green, alpha: pa, weight: 500 });
    g.font = L.font(900, P.ab.size);
    for (const w of P.ws) if (w.hl) L.swipe(g, w.x - 10, w.y - P.ab.size * 0.76, w.ww + 20, P.ab.size * 0.84, L.range(t, w.at + 0.25, w.at + 0.55), { seed: L.hash(w.w) });
    for (const w of P.ws) {
      const s = L.slam(t, w.at, 0.26); if (s.a <= 0) continue;
      g.save(); g.translate(w.x + w.ww / 2, w.y - P.ab.size * 0.35); g.scale(s.s, s.s); g.globalAlpha = s.a; g.fillStyle = L.PAL.ink; g.textAlign = 'center'; g.fillText(w.w, 0, P.ab.size * 0.35); g.restore();
    }
    if (P.sub) {
      const last = P.ws.at(-1);
      if (!P.sb) P.sb = L.fitBlock(g, P.sub, L.SAFE.w, 170, 64, { weight: 700, maxLines: 2 });
      const su = L.range(t, last.at + 0.35, last.at + 0.7);
      g.save(); g.globalAlpha = su; g.font = L.font(700, P.sb.size, L.FONT.body); g.fillStyle = L.PAL.inkSoft;
      P.sb.lines.forEach((ln, i) => g.fillText(ln, L.SAFE.x0, last.y + 110 + i * P.sb.lh + (1 - L.outCubic(su)) * 20)); g.restore();
    }
  },
};
