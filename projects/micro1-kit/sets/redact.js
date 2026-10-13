// redact: a document whose sensitive spans scramble to ███ and get black bars wiped over them, then a
// DE-IDENTIFIED stamp. Visualises anonymisation.
// params: title ('ONBOARDING SOP'), meta ('INTERNAL · v3'), lines: ['Call [[Dana Ruiz]] at [[dana@acme.co]] ...'],
//         at (cue for the first redaction; default 40% into the narration), stagger (0.22 s), label ('DE-IDENTIFIED'), stampAt
// Text in [[double brackets]] is sensitive. Use invented example text and say so on screen (it is an illustration).
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789@#%&*$';
const DEF = ['Step 1. Call [[Dana Ruiz]] when a refund is over [[$500]].', 'Escalate to [[dana.ruiz@acme.co]] within 24 hours.', 'Log it in [[Acme CRM]] under client [[#44-1093]].', 'Close the ticket. Rate the call 1–5.'];

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const lines = Q.list(p.lines, DEF);
    // tokens: words, with sensitive runs merged into one token
    const rows = lines.map((ln) => {
      const out = []; const re = /\[\[(.+?)\]\]|(\S+)/g; let m;
      let end = -1;
      while ((m = re.exec(ln))) { out.push({ ...(m[1] ? { s: m[1], hot: true } : { s: m[2], hot: false }), glue: m.index === end }); end = m.index + m[0].length; }
      return out;
    });
    const v0 = Q.first(shot), v1 = Q.lastEnd(shot);
    const at = Q.at(shot, p.at, v0 + (v1 - v0) * 0.35), stg = p.stagger ?? 0.22;
    let k = 0; for (const r of rows) for (const tk of r) if (tk.hot) tk.at = at + stg * k++;
    const stampAt = Q.at(shot, p.stampAt, at + stg * k + 0.35);
    const sfx = [Q.fx('paper.rustle', 0.05, 0.3), Q.fx('type.run', at - 0.05, 0.22, { chars: Math.max(6, k * 4), cps: 18 })];
    for (const r of rows) for (const tk of r) if (tk.hot) sfx.push(Q.fx('marker.swipe', tk.at + 0.32, 0.38, { dur: 0.22 }));
    sfx.push(Q.fx('impact.hit', stampAt + 0.16, 0.55));
    return { rows, title: p.title ?? 'ONBOARDING SOP', meta: p.meta ?? 'INTERNAL · EXAMPLE', label: p.label ?? 'DE-IDENTIFIED', stampAt, sfx, hits: [{ at: stampAt + 0.16, amp: 1.3 }] };
  },
  draw(g, t, shot, P) {
    const X = L.SAFE.x0, Y = 270, Wd = L.SAFE.w, FS = 50, LH = 82, padX = 54;
    // layout once: wrap tokens into lines in mono
    if (!P.lay) {
      g.font = L.font(500, FS, L.FONT.mono); const sp = g.measureText(' ').width, maxW = Wd - padX * 2;
      P.lay = []; let y = 0;
      P.rows.forEach((r, ri) => {
        let x = 0; const line = [];
        for (const tk of r) {
          const w = g.measureText(tk.s).width;
          if (tk.glue && line.length) x -= sp;
          if (x > 0 && x + w > maxW && !tk.glue) { P.lay.push({ y, toks: line.splice(0), ri }); y += LH; x = 0; }
          line.push({ ...tk, x, w, ri }); x += w + sp;
        }
        P.lay.push({ y, toks: line, ri }); y += LH + 26;
      });
      P.H = y + 230;
    }
    const a0 = L.pop(t, 0.02, 0.45);
    g.save(); g.globalAlpha = a0.a; g.translate(0, (1 - L.outCubic(a0.u)) * 80);
    const Hd = Math.min(1180, P.H);
    L.card(g, X, Y, Wd, Hd, { r: 20, stroke: L.PAL.ink, lw: 3 });
    // header
    g.font = L.font(900, 84); g.fillStyle = L.PAL.ink; g.textAlign = 'left'; g.fillText(P.title, X + padX, Y + 112);
    L.label(g, P.meta, X + padX, Y + 172, { size: 44, color: L.PAL.inkSoft });
    g.fillStyle = L.PAL.ink; g.fillRect(X + padX, Y + 200, Wd - padX * 2, 5);
    // body
    const by = Y + 290;
    g.font = L.font(500, FS, L.FONT.mono); g.textBaseline = 'alphabetic';
    P.lay.forEach((ln, li) => {
      const la = L.range(t, 0.12 + ln.ri * 0.12, 0.42 + ln.ri * 0.12); if (la <= 0) return;
      for (const tk of ln.toks) {
        const x = X + padX + tk.x + (1 - L.outCubic(la)) * 30, y = by + ln.y;
        g.globalAlpha = a0.a * la;
        if (!tk.hot) { g.fillStyle = L.PAL.ink; g.fillText(tk.s, x, y); continue; }
        const sc = L.range(t, tk.at, tk.at + 0.32), bar = L.range(t, tk.at + 0.24, tk.at + 0.46);
        // underline marks a sensitive span before it goes
        if (sc <= 0) { g.fillStyle = L.PAL.ink; g.fillText(tk.s, x, y); g.fillStyle = 'rgba(224,36,27,0.55)'; g.fillRect(x, y + 10, tk.w, 5); continue; }
        // scramble -> blocks
        const step = Math.floor(t * 22); let s = '';
        for (let i = 0; i < tk.s.length; i++) { const flip = (i + 1) / tk.s.length <= sc * 1.4; s += tk.s[i] === ' ' ? ' ' : flip ? GLYPHS[L.hash(tk.s, i, step) % GLYPHS.length] : tk.s[i]; }
        if (bar < 1) { g.save(); g.beginPath(); g.rect(x - 4, y - FS, tk.w + 8, FS * 1.3); g.clip(); g.fillStyle = sc > 0.55 ? L.PAL.ink : L.PAL.red; g.fillText(s, x, y); g.restore(); }
        if (bar > 0) { g.fillStyle = L.PAL.ink; L.rr(g, x - 8, y - FS * 0.86, (tk.w + 16) * L.outCubic(bar), FS * 1.12, 6); g.fill(); }
      }
    });
    g.restore();
    // stamp
    const st = L.range(t, P.stampAt, P.stampAt + 0.22);
    if (st > 0) {
      const s = L.lerp(1.9, 1, L.outCubic(st)), cx = L.SAFE.cx, cy = Math.min(Y + Hd - 40, 1360);
      g.save(); g.translate(cx, cy); g.rotate(-0.09); g.scale(s, s); g.globalAlpha = L.clamp(st * 3) * 0.95;
      g.font = L.font(900, 120); const tw = g.measureText(P.label).width + 90;
      g.fillStyle = 'rgba(243,239,230,0.9)'; L.rr(g, -tw / 2, -90, tw, 170, 22); g.fill();
      g.strokeStyle = L.PAL.green; g.lineWidth = 12; L.rr(g, -tw / 2, -90, tw, 170, 22); g.stroke();
      g.fillStyle = L.PAL.green; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(P.label, 0, 6);
      g.restore();
    }
  },
};
