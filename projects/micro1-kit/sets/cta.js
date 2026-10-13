// cta: end card, in two modes. The standing disclaimer is always on (legible: >= 44 px portrait, >= 36 px landscape).
//   mode 'link' (default): optional pre word ('APPLY'), a big headline ('LINK IN THE DESCRIPTION', highlight on
//                          'DESCRIPTION'), a sub line with a check, and a big bouncing arrow pointing down at the description.
//   mode 'search':         'SEARCH:' + a search bar that types the query + a sub line with a check.
// params: mode ('link' | 'search'), text (link: 'Link in the description'; search: 'micro1 Company Data Partnerships'),
//         pre (link: none; search: 'SEARCH'), sub (link: 'Interest form takes ~2 minutes'; search: 'Apply takes ~2 minutes'),
//         highlight (link headline word(s), default 'DESCRIPTION'), disclaimer, at (headline / typing start), subAt, cps
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';
import { icon } from '../kit/icons.js';

export const DISCLAIMER = 'Independent channel · not affiliated with micro1 · payouts not guaranteed';
const DEF = {
  link: { text: 'Link in the description', pre: null, sub: 'Interest form takes ~2 minutes' },
  search: { text: 'micro1 Company Data Partnerships', pre: 'SEARCH', sub: 'Apply takes ~2 minutes' },
};

export default {
  plan(shot) {
    const p = shot.params ?? {}, mode = p.mode === 'search' ? 'search' : 'link', D = DEF[mode];
    const text = String(p.text ?? D.text), pre = p.pre === undefined ? D.pre : p.pre, sub = p.sub ?? D.sub;
    const base = { mode, text, pre: pre ? String(pre).toUpperCase() : null, sub, disclaimer: p.disclaimer ?? DISCLAIMER };
    if (mode === 'search') {
      const at = Q.at(shot, p.at, 0.45), cps = p.cps ?? 26, typed = at + text.length / cps;
      const subAt = Q.at(shot, p.subAt, typed + 0.3);
      const sfx = [Q.fx('marker.swipe', 0.3, 0.35), Q.fx('impact.soft', at - 0.15, 0.35), Q.fx('type.run', at, 0.3, { chars: Math.min(60, text.length), cps }), Q.fx('ui.tick', typed + 0.05, 0.5), Q.fx('impact.soft', subAt, 0.35)];
      return { ...base, at, cps, typed, subAt, sfx, hits: [{ at: subAt, amp: 0.6 }] };
    }
    const at = Q.at(shot, p.at, 0.12), hl = Q.list(p.highlight, ['description']);
    const words = text.toUpperCase().split(/\s+/).filter(Boolean).map((w, i) => ({ w, at: at + (pre ? 0.3 : 0) + i * 0.09, hl: hl.some((h) => Q.norm(w).startsWith(Q.norm(h))) }));
    const headEnd = words.at(-1).at, arrowAt = Q.at(shot, p.arrowAt, headEnd + 0.35), subAt = Q.at(shot, p.subAt, arrowAt + 0.45);
    const sfx = [...(pre ? [Q.fx('impact.soft', at, 0.35)] : []), ...words.map((x) => Q.fx(x.hl ? 'impact.hit' : 'impact.soft', x.at, x.hl ? 0.4 : 0.2)),
      ...words.filter((x) => x.hl).map((x) => Q.fx('marker.swipe', x.at + 0.2, 0.4)), Q.fx('whoosh.s', arrowAt + 0.1, 0.35), Q.fx('impact.soft', arrowAt + 0.32, 0.35), Q.fx('ui.tick', subAt + 0.1, 0.5)];
    return { ...base, at, words, arrowAt, subAt, sfx, hits: [{ at: arrowAt + 0.32, amp: 0.8 }, ...words.filter((x) => x.hl).map((x) => ({ at: x.at, amp: 0.8 }))] };
  },
  draw(g, t, shot, P) {
    if (P.mode === 'search') drawSearch(g, t, P); else drawLink(g, t, P);
    drawDisclaimer(g, t, P);
  },
};

function drawDisclaimer(g, t, P) {
  if (!P.db) P.db = L.fitBlock(g, P.disclaimer, L.SAFE.w - 40, L.pick(150, 50), L.pick(54, 42), { weight: 600, maxLines: L.pick(2, 1), lh: 1.2 });
  const ry = L.pick(1300, 752), ty = L.pick(1370, 806);
  g.save(); g.font = L.font(600, P.db.size, L.FONT.body); g.fillStyle = L.PAL.inkSoft; g.textAlign = 'center'; g.globalAlpha = L.range(t, 0.1, 0.4);
  g.strokeStyle = L.PAL.rule; g.lineWidth = 3; g.beginPath(); g.moveTo(L.SAFE.x0 + 60, ry); g.lineTo(L.SAFE.x1 - 60, ry); g.stroke();
  P.db.lines.forEach((ln, i) => g.fillText(ln, L.SAFE.cx, ty + i * P.db.lh)); g.restore();
}

function subLine(g, t, P, sy) {
  const su = L.pop(t, P.subAt, 0.4); if (su.a <= 0) return;
  if (!P.sb) P.sb = L.fit(g, P.sub, L.SAFE.w - 150, L.pick(76, 72), L.MIN_TEXT, 700, L.FONT.body);
  g.save(); g.globalAlpha = su.a; g.font = L.font(700, P.sb, L.FONT.body); const sw = g.measureText(P.sub).width + 110, sx = L.SAFE.cx - sw / 2;
  g.translate(0, (1 - L.outCubic(su.u)) * 30);
  g.fillStyle = L.PAL.green; g.beginPath(); g.arc(sx + 40, sy - P.sb * 0.32, 40, 0, 7); g.fill();
  L.check(g, sx + 40, sy - P.sb * 0.32, 56, L.range(t, P.subAt + 0.1, P.subAt + 0.4), { color: L.PAL.card });
  g.fillStyle = L.PAL.ink; g.textAlign = 'left'; g.fillText(P.sub, sx + 110, sy); g.restore();
}

function drawLink(g, t, P) {
  g.font = L.font(900, 100); const capK = g.measureText('H').actualBoundingBoxAscent / 100;
  let y = L.pick(300, 110);
  if (P.pre) {
    const pa = L.slam(t, P.at, 0.3), ps = L.pick(110, 90);
    if (pa.a > 0) { g.save(); g.translate(L.SAFE.cx, y + ps * capK / 2); g.scale(pa.s, pa.s); g.globalAlpha = pa.a; g.font = L.font(900, ps); g.textAlign = 'center'; g.fillStyle = L.PAL.green; g.fillText(P.pre, 0, ps * capK / 2); g.restore(); }
    y += ps * capK + L.pick(70, 50);
  }
  if (!P.hb) {
    const txt = P.words.map((x) => x.w).join(' ');
    P.hb = L.fitBlock(g, txt, L.SAFE.w, L.pick(560, P.pre ? 250 : 320), L.pick(230, 210), { weight: 900, fam: L.FONT.display, lh: capK * 1.3, maxLines: 3, min: 80, oneLine: 0.85 });
    g.font = L.font(900, P.hb.size); const sp = g.measureText(' ').width; let k = 0;
    P.hb.lines.forEach((ln, li) => { const wl = g.measureText(ln).width; let x = L.SAFE.cx - wl / 2;
      for (const w of ln.split(' ')) { const ww = g.measureText(w).width; Object.assign(P.words[k++], { x, li, ww }); x += ww + sp; } });
  }
  const S = P.hb.size, capH = S * capK;
  for (const w of P.words) w.y = y + capH + w.li * P.hb.lh;
  g.font = L.font(900, S);
  for (const w of P.words) if (w.hl) L.swipe(g, w.x - S * 0.06, w.y - capH * 1.15, w.ww + S * 0.12, capH * 1.32, L.range(t, w.at + 0.2, w.at + 0.5), { seed: L.hash(w.w) });
  for (const w of P.words) {
    const s = L.slam(t, w.at, 0.26); if (s.a <= 0) continue;
    g.save(); g.translate(w.x + w.ww / 2, w.y - capH / 2); g.scale(s.s, s.s); g.globalAlpha = s.a; g.fillStyle = L.PAL.ink; g.textAlign = 'center'; g.fillText(w.w, 0, capH / 2); g.restore();
  }
  const headBottom = y + capH + (P.hb.lines.length - 1) * P.hb.lh;
  const sy = headBottom + L.pick(150, 105);
  subLine(g, t, P, sy);
  // the arrow: grows down from under the sub line toward the description, then keeps bouncing
  const a0 = sy + L.pick(80, 45), a1 = L.pick(1250, 735), u = L.outBack(L.range(t, P.arrowAt, P.arrowAt + 0.45), 1.3);
  if (u > 0 && a1 - a0 > 60) {
    const bounce = 16 * Math.abs(Math.sin((t - P.arrowAt) * 3.2)) * L.range(t, P.arrowAt + 0.4, P.arrowAt + 0.7);
    const len = (a1 - a0) * Math.min(1.05, u), hw = Math.min(L.pick(150, 120), len * 0.45), hh = Math.min(hw * 1.05, len * 0.6), sw = hw * 0.36, top = a0 + bounce, tip = a0 + len + bounce;
    g.save(); g.fillStyle = L.PAL.green; g.strokeStyle = L.PAL.ink; g.lineWidth = 6; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(L.SAFE.cx - sw / 2, top); g.lineTo(L.SAFE.cx + sw / 2, top); g.lineTo(L.SAFE.cx + sw / 2, tip - hh); g.lineTo(L.SAFE.cx + hw, tip - hh);
    g.lineTo(L.SAFE.cx, tip); g.lineTo(L.SAFE.cx - hw, tip - hh); g.lineTo(L.SAFE.cx - sw / 2, tip - hh); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
}

function drawSearch(g, t, P) {
  const ps = L.pick(190, 150), py = L.pick(520, 200);
  const pa = L.slam(t, 0.08, 0.3);
  g.save(); g.font = L.font(900, ps); const pw = g.measureText(P.pre + ':').width; g.restore();
  L.swipe(g, L.SAFE.cx - pw / 2 - 20, py - ps * 0.44, pw + 40, ps * 0.84, L.range(t, 0.3, 0.6), { seed: 21 });
  if (pa.a > 0) { g.save(); g.translate(L.SAFE.cx, py); g.scale(pa.s, pa.s); g.globalAlpha = pa.a; g.font = L.font(900, ps); g.textAlign = 'center'; g.fillStyle = L.PAL.ink; g.fillText(P.pre + ':', 0, ps * 0.35); g.restore(); }
  const Wb = L.pick(L.SAFE.w, 1320), X = L.SAFE.cx - Wb / 2, Y = L.pick(660, 300);
  if (!P.tb) P.tb = L.fitBlock(g, P.text, Wb - 210, L.pick(230, 200), L.pick(92, 88), { weight: 700, maxLines: 2, lh: 1.08 });
  const bh = Math.max(L.pick(200, 170), P.tb.lines.length * P.tb.lh + 80), ba = L.pop(t, P.at - 0.25, 0.4, 1.6);
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
  subLine(g, t, P, Y + bh + L.pick(150, 120));
}
