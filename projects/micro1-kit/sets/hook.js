// hook: giant kinetic headline. Each word slams in on its spoken word; key words get the yellow highlighter.
// params: lines (array or 'LINE ONE / LINE TWO'), highlight (word or array, matched case-insensitively),
//         accent (word(s) set in money green), strike (word(s) struck in red after they land), kicker, align ('center'|'left')
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

const has = (set, w) => set.some((x) => Q.norm(x) === Q.norm(w));

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const lines = Q.list(p.lines, ['HEADLINE']).map((l) => String(l).toUpperCase().split(/\s+/).filter(Boolean));
    const toks = lines.flat();
    const times = Q.tokens(shot, toks, { from: Math.max(0.1, Q.first(shot)) });
    const hl = Q.list(p.highlight), ac = Q.list(p.accent), st = Q.list(p.strike);
    let k = 0;
    const words = lines.map((ln, li) => ln.map((w) => ({ w, li, at: times[k++], hl: has(hl, w), ac: has(ac, w), st: has(st, w) })));
    const flat = words.flat();
    const sfx = [], hits = [];
    flat.forEach((x, i) => {
      sfx.push(Q.fx(x.hl ? 'impact.hit' : 'impact.soft', x.at, x.hl ? 0.42 : 0.22, undefined));
      if (x.hl) sfx.push(Q.fx('marker.swipe', x.at + 0.14, 0.4));
      if (x.st) sfx.push(Q.fx('marker.swipe', x.at + 0.5, 0.45));
      hits.push({ at: x.at, amp: x.hl ? 1 : 0.35 });
    });
    return { lines: words, sfx, hits, kicker: p.kicker, align: p.align ?? 'center' };
  },
  draw(g, t, shot, P) {
    if (!P.layout) {
      // per-line sizes (stacked editorial headline), then scale the block into the safe area
      const rows = P.lines.map((ln) => { const txt = ln.map((x) => x.w).join(' '); return { size: L.fit(g, txt, L.SAFE.w, 420, 80, 900) }; });
      // space lines by the cap height (Big Shoulders' em box is much taller than its capitals)
      g.font = L.font(900, 100); const capK = g.measureText('H').actualBoundingBoxAscent / 100, lead = 0.3;
      const blockH = (rs) => rs.reduce((a, r, i) => a + r.size * capK + (i ? r.size * capK * lead : 0), 0);
      const maxH = P.kicker ? 900 : 1000, k = Math.min(1, maxH / blockH(rows)); rows.forEach((r) => (r.size = Math.floor(r.size * k)));
      const hTot = blockH(rows);
      let y = L.SAFE.cy - hTot / 2 + (P.kicker ? 50 : 0);
      rows.forEach((r, li) => {
        g.font = L.font(900, r.size); const space = g.measureText(' ').width * 0.9;
        const ws = P.lines[li].map((x) => g.measureText(x.w).width), wTot = ws.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
        let x = P.align === 'left' ? L.SAFE.x0 : L.SAFE.cx - wTot / 2; y += r.size * capK * (li ? 1 + lead : 1);
        P.lines[li].forEach((wd, i) => { wd.x = x; wd.w0 = ws[i]; wd.y = y; wd.size = r.size; x += ws[i] + space; });
      });
      P.top = L.SAFE.cy - hTot / 2 + (P.kicker ? 50 : 0); P.capK = capK;
      P.layout = true;
    }
    if (P.kicker) L.kicker(g, P.kicker, P.align === 'left' ? L.SAFE.x0 : L.SAFE.cx, P.top - 160, t, 0.05, { align: P.align === 'left' ? 'left' : 'center' });
    const all = P.lines.flat();
    // highlighter swipes go under the type
    for (const wd of all) if (wd.hl) {
      const u = L.range(t, wd.at + 0.12, wd.at + 0.42);
      L.swipe(g, wd.x - wd.size * 0.06, wd.y - wd.size * P.capK * 1.14, wd.w0 + wd.size * 0.12, wd.size * P.capK * 1.3, u, { seed: L.hash(wd.w) });
    }
    for (const wd of all) {
      const s = L.slam(t, wd.at); if (s.a <= 0) continue;
      const cx = wd.x + wd.w0 / 2, cy = wd.y - wd.size * P.capK * 0.5 + L.bob(t, 2.5, 0.35, wd.li * 0.31);
      g.save(); g.translate(cx, cy); g.scale(s.s, s.s); g.rotate((1 - L.outCubic(s.u)) * (L.hash(wd.w, wd.li) % 2 ? 0.06 : -0.06));
      g.globalAlpha = s.a; g.font = L.font(900, wd.size); g.fillStyle = wd.ac ? L.PAL.green : wd.st ? L.PAL.inkSoft : L.PAL.ink;
      g.textBaseline = 'alphabetic'; g.fillText(wd.w, -wd.w0 / 2, wd.size * P.capK * 0.5);
      g.restore();
      if (wd.st) L.strike(g, wd.x, wd.y - wd.size * P.capK * 0.5, wd.w0, L.range(t, wd.at + 0.5, wd.at + 0.8), { lw: Math.max(10, wd.size * 0.09) });
    }
  },
};
