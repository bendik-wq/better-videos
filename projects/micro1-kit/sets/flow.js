// flow: a pipeline: top -> bottom in portrait, left -> right in landscape. Step cards pop in on their words, arrows draw between them,
// then data packets keep flowing down the pipe.
// params: steps: ['Your docs' | { text, icon, word|at }] (default: Your docs / Scrub & anonymize / AI training environment / You get paid),
//         icons (array of icon names, optional), title
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';
import { badge } from '../kit/icons.js';

const DEF = [{ text: 'Your docs', icon: 'doc' }, { text: 'Scrub & anonymize', icon: 'shield' }, { text: 'AI training environment', icon: 'chip' }, { text: 'You get paid', icon: 'cash' }];
const GUESS = [[/doc|sop|playbook/i, 'doc'], [/scrub|anonym|de-?ident|clean/i, 'shield'], [/ai|model|train/i, 'chip'], [/paid|pay|\$|money/i, 'cash'], [/review|check/i, 'search']];

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const steps = Q.list(p.steps, DEF).map((s, i) => {
      const o = typeof s === 'string' ? { text: s } : { ...s };
      o.icon ??= p.icons?.[i] ?? GUESS.find(([re]) => re.test(o.text))?.[1] ?? 'doc';
      return o;
    });
    const times = Q.items(shot, steps, { from: Math.max(0.15, Q.first(shot)) });
    steps.forEach((s, i) => (s.at = times[i]));
    const sfx = steps.flatMap((s, i) => [i ? Q.fx('whoosh.xs', s.at - 0.1, 0.25) : null, Q.fx('impact.soft', s.at + 0.05, 0.35), Q.fx('ui.tick', s.at + 0.12, 0.5, { pitch: 0.9 + i * 0.12 })].filter(Boolean));
    return { steps, title: p.title, sfx, hits: steps.map((s) => ({ at: s.at + 0.05, amp: 0.5 })) };
  },
  draw(g, t, shot, P) {
    const n = P.steps.length;
    let y0 = L.pick(250, 100);
    if (P.title) {
      if (!P.ts) P.ts = L.fit(g, String(P.title).toUpperCase(), L.SAFE.w, L.pick(130, 110), 60, 900);
      const a = L.pop(t, 0.06, 0.4); g.save(); g.globalAlpha = a.a; g.font = L.font(900, P.ts); g.fillStyle = L.PAL.ink; g.textAlign = 'center';
      g.fillText(String(P.title).toUpperCase(), L.SAFE.cx, y0 + P.ts * 0.8); g.restore(); y0 += P.ts + 50;
    }
    if (L.LAND) return drawRow(g, t, P, y0);
    const y1 = 1450, cardH = Math.min(200, (y1 - y0) / n - 70), gap = (y1 - y0 - cardH * n) / Math.max(1, n - 1);
    const X = 110, Wc = 860, cxPipe = X + 120;
    const yc = (i) => y0 + i * (cardH + gap);
    if (!P.fs) P.fs = P.steps.map((s) => L.fitBlock(g, s.text, Wc - 340, cardH - 30, 82, { weight: 700, maxLines: 2 }));
    // pipe + arrows first (under the cards)
    for (let i = 1; i < n; i++) {
      const s = P.steps[i], u = L.range(t, s.at - 0.3, s.at); if (u <= 0) continue;
      const ya = yc(i - 1) + cardH + 8, yb = yc(i) - 10;
      L.arrow(g, cxPipe, ya, cxPipe, yb, u, { lw: 9, head: 30, color: L.PAL.ink, dash: u >= 1 ? [18, 16] : null, dashOff: -t * 90 });
    }
    // packets travel the whole pipe once every step is in
    const tl = P.steps[n - 1].at + 0.4;
    if (t > tl) for (let k = 0; k < 3; k++) {
      const ph = ((t - tl) * 0.45 + k / 3) % 1, yy = L.lerp(yc(0) + cardH, yc(n - 1), ph);
      g.fillStyle = L.PAL.green; g.globalAlpha = L.range(t, tl, tl + 0.3) * Math.sin(Math.PI * ph); g.beginPath(); g.arc(cxPipe + 34, yy, 12, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    P.steps.forEach((s, i) => {
      const a = L.pop(t, s.at - 0.04, 0.45, 1.8);
      const y = yc(i);
      if (a.a <= 0) { g.save(); g.globalAlpha = 0.45 * L.range(t, 0.05, 0.3); g.setLineDash([16, 14]); g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 4; L.rr(g, X, y, Wc, cardH, 30); g.stroke(); g.restore(); return; }
      const last = i === n - 1;
      g.save(); g.translate(X + Wc / 2, y + cardH / 2 + L.bob(t, 2.5, 0.35, i * 0.25)); g.scale(a.s, a.s); g.globalAlpha = a.a; g.translate(-(X + Wc / 2), -(y + cardH / 2));
      L.card(g, X, y, Wc, cardH, { r: 30, fill: last ? L.PAL.green : L.PAL.card, stroke: L.PAL.ink, lw: 4 });
      badge(g, s.icon, cxPipe, y + cardH / 2, cardH * 0.74, { t, u: L.range(t, s.at, s.at + 0.45), bg: last ? L.PAL.card : L.PAL.greenTint });
      L.label(g, String(i + 1).padStart(2, '0'), X + Wc - 30, y + 62, { size: 44, align: 'right', color: last ? L.PAL.card : L.PAL.inkFaint });
      const f = P.fs[i]; g.font = L.font(700, f.size, L.FONT.body); g.fillStyle = last ? L.PAL.card : L.PAL.ink; g.textAlign = 'left';
      const ty = y + cardH / 2 - (f.lines.length * f.lh) / 2 + f.size * 0.8;
      f.lines.forEach((ln, k) => g.fillText(ln, cxPipe + cardH * 0.37 + 40, ty + k * f.lh));
      g.restore();
    });
  },
};

// landscape: the same pipeline left -> right, cards side by side
function drawRow(g, t, P, y0) {
  const n = P.steps.length, gap = 96, cw = (L.SAFE.w - gap * (n - 1)) / n, y1 = 800;
  const ch = Math.min(440, y1 - y0), top = y0 + (y1 - y0 - ch) / 2, midY = top + ch * 0.36;
  const xc = (i) => L.SAFE.x0 + i * (cw + gap), bs = Math.min(cw * 0.5, ch * 0.4, 180);
  if (!P.fsR) P.fsR = P.steps.map((s) => L.fitBlock(g, s.text, cw - 50, ch - bs - 110, 64, { weight: 700, maxLines: 3, lh: 1.08 }));
  for (let i = 1; i < n; i++) {
    const s = P.steps[i], u = L.range(t, s.at - 0.3, s.at); if (u <= 0) continue;
    L.arrow(g, xc(i - 1) + cw + 10, midY, xc(i) - 12, midY, u, { lw: 9, head: 30, dash: u >= 1 ? [16, 14] : null, dashOff: -t * 90 });
  }
  const tl = P.steps[n - 1].at + 0.4;
  if (t > tl) for (let k = 0; k < 3; k++) {
    const ph = ((t - tl) * 0.4 + k / 3) % 1, xx = L.lerp(xc(0) + cw, xc(n - 1), ph);
    g.fillStyle = L.PAL.green; g.globalAlpha = L.range(t, tl, tl + 0.3) * Math.sin(Math.PI * ph); g.beginPath(); g.arc(xx, midY + 30, 11, 0, 7); g.fill(); g.globalAlpha = 1;
  }
  P.steps.forEach((s, i) => {
    const a = L.pop(t, s.at - 0.04, 0.45, 1.8), x = xc(i);
    if (a.a <= 0) { g.save(); g.globalAlpha = 0.45 * L.range(t, 0.05, 0.3); g.setLineDash([16, 14]); g.strokeStyle = L.PAL.inkFaint; g.lineWidth = 4; L.rr(g, x, top, cw, ch, 30); g.stroke(); g.restore(); return; }
    const last = i === n - 1;
    g.save(); g.translate(x + cw / 2, top + ch / 2 + L.bob(t, 2.5, 0.35, i * 0.25)); g.scale(a.s, a.s); g.globalAlpha = a.a; g.translate(-(x + cw / 2), -(top + ch / 2));
    L.card(g, x, top, cw, ch, { r: 30, fill: last ? L.PAL.green : L.PAL.card, stroke: L.PAL.ink, lw: 4 });
    badge(g, s.icon, x + cw / 2, top + 40 + bs / 2, bs, { t, u: L.range(t, s.at, s.at + 0.45), bg: last ? L.PAL.card : L.PAL.greenTint });
    L.label(g, String(i + 1).padStart(2, '0'), x + 26, top + 56, { size: 38, color: last ? L.PAL.card : L.PAL.inkFaint });
    const f = P.fsR[i]; g.font = L.font(700, f.size, L.FONT.body); g.fillStyle = last ? L.PAL.card : L.PAL.ink; g.textAlign = 'center';
    const ty = top + 40 + bs + 40 + f.size * 0.8;
    f.lines.forEach((ln, k) => g.fillText(ln, x + cw / 2, ty + k * f.lh));
    g.restore();
  });
}
