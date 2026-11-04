// quote: a pull-quote card. Words rise in as the narrator reads them (or spread over the line), key words
// get the highlighter, then the attribution.
// params: text (verbatim quote, no quote marks), by ('micro1 · Company Data Partnerships page'), highlight (word(s)), byAt, kicker
// Quote only verbatim wording from the cited source.
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const words = String(p.text ?? '').split(/\s+/).filter(Boolean);
    let times = Q.tokens(shot, words, { from: Math.max(0.15, Q.first(shot)), gap: 0.16 });
    // if the narration doesn't read the quote, spread it over the first 60% of the line
    const end = Q.first(shot) + (Q.lastEnd(shot) - Q.first(shot)) * 0.6;
    if (times.at(-1) > Q.lastEnd(shot) + 0.2) times = words.map((_, i) => Q.first(shot) + (end - Q.first(shot)) * i / Math.max(1, words.length - 1));
    const hl = Q.list(p.highlight);
    const ws = words.map((w, i) => ({ w, at: times[i], hl: hl.some((h) => Q.norm(w).startsWith(Q.norm(h))) }));
    const byAt = Q.at(shot, p.byAt, ws.at(-1).at + 0.4);
    const sfx = [Q.fx('paper.rustle', 0.02, 0.3), ...ws.filter((x) => x.hl).map((x) => Q.fx('marker.swipe', x.at + 0.22, 0.3)), Q.fx('ui.tick', byAt, 0.5)];
    return { ws, by: p.by, byAt, kicker: p.kicker, sfx, hits: [] };
  },
  draw(g, t, shot, P) {
    const X = L.SAFE.x0; let Y = L.pick(330, 100); const Wd = L.SAFE.w, pad = L.pick(70, 90), top = L.pick(240, 200);
    if (!P.lay) {
      const txt = P.ws.map((x) => x.w).join(' ');
      P.fb = L.fitBlock(g, txt, Wd - pad * 2, L.pick(760, 400), L.pick(116, 110), { weight: 700, maxLines: L.pick(9, 4), lh: 1.12, oneLine: L.pick(0.75, 0.97) });
      g.font = L.font(700, P.fb.size, L.FONT.body); const sp = g.measureText(' ').width;
      let k = 0; P.lay = [];
      P.fb.lines.forEach((ln, li) => { let x = 0; for (const w of ln.split(' ')) { const ww = g.measureText(w).width; P.lay.push({ ...P.ws[k++], x, y: li * P.fb.lh, ww }); x += ww + sp; } });
      P.Hc = top + P.fb.lines.length * P.fb.lh + L.pick(220, 170);
    }
    if (P.kicker) L.kicker(g, P.kicker, X, L.pick(220, 92), t, 0.03);
    const Hc = Math.min(L.pick(1140, 720), P.Hc), a = L.pop(t, 0.02, 0.45, 1.6);
    if (L.LAND) Y = Math.max(P.kicker ? 180 : L.SAFE.y0, L.SAFE.cy - Hc / 2);
    g.save(); g.globalAlpha = a.a; g.translate(L.SAFE.cx, Y + Hc / 2); g.scale(L.lerp(0.92, 1, a.s), L.lerp(0.92, 1, a.s)); g.translate(-L.SAFE.cx, -Y - Hc / 2);
    L.card(g, X, Y, Wd, Hc, { r: 30 });
    g.fillStyle = L.PAL.green; g.fillRect(X, Y + 40, 12, Hc - 80);
    // big quote mark
    g.font = L.font(900, L.pick(300, 260)); g.fillStyle = L.PAL.green; g.globalAlpha = a.a * L.range(t, 0.1, 0.4); g.fillText('“', X + pad - 10, Y + L.pick(250, 215) + L.bob(t, 4, 0.3));
    g.globalAlpha = a.a;
    const ty = Y + top - 10 + P.fb.size * 0.8;
    g.font = L.font(700, P.fb.size, L.FONT.body); g.textAlign = 'left';
    for (const w of P.lay) if (w.hl) L.swipe(g, X + pad + w.x - 6, ty + w.y - P.fb.size * 0.82, w.ww + 12, P.fb.size * 0.98, L.range(t, w.at + 0.2, w.at + 0.5), { seed: L.hash(w.w) });
    for (const w of P.lay) {
      const u = L.range(t, w.at - 0.06, w.at + 0.22); if (u <= 0) continue;
      g.globalAlpha = a.a * u; g.fillStyle = L.PAL.ink; g.fillText(w.w, X + pad + w.x, ty + w.y + (1 - L.outCubic(u)) * 18);
    }
    g.globalAlpha = a.a;
    if (P.by) {
      if (!P.bb) P.bb = L.fitBlock(g, '— ' + P.by, Wd - pad * 2, 120, 50, { weight: 600, maxLines: 2, min: 44 });
      g.save(); g.globalAlpha = a.a * L.range(t, P.byAt, P.byAt + 0.35); g.font = L.font(600, P.bb.size, L.FONT.body); g.fillStyle = L.PAL.inkSoft;
      P.bb.lines.forEach((ln, i) => g.fillText(ln, X + pad, Y + Hc - 70 - (P.bb.lines.length - 1 - i) * P.bb.lh)); g.restore();
    }
    g.restore();
  },
};
