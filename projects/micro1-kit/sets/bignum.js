// bignum: a count-up number on rolling ticker digits, with label, sub line and optional kicker.
// params: value (number), prefix ('$'), suffix ('+' / ' MONTHS'), decimals (0), commas (true), label, sub,
//         highlight (word(s) of the label to swipe), kicker, at (count start cue; default first word), dur (count seconds, 1.4)
import * as L from '../kit/ledger.js';
import * as Q from '../kit/cue.js';

const fmt = (v, dec, commas) => { const s = v.toFixed(dec); if (!commas) return s; const [a, b] = s.split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };

export default {
  plan(shot) {
    const p = shot.params ?? {};
    const value = Number(p.value ?? 0), dec = p.decimals ?? 0, commas = p.commas ?? true;
    const at = Q.at(shot, p.at, Math.max(0.1, Q.first(shot)));
    const dur = p.dur ?? Math.min(1.8, Math.max(0.8, 0.5 + 0.12 * fmt(value, dec, commas).replace(/\D/g, '').length));
    const labelAt = Q.at(shot, p.labelAt, at + dur * 0.55);
    const sfx = [Q.fx('ui.ticks', at, 0.32, { count: Math.max(4, Math.round(dur / 0.065)), period: 0.065, accel: -0.4 }), Q.fx('impact.hit', at + dur, 0.5), Q.fx('marker.swipe', labelAt + 0.35, 0.3)];
    return { value, dec, commas, at, dur, labelAt, prefix: p.prefix ?? '', suffix: p.suffix ?? '', label: p.label, sub: p.sub, kicker: p.kicker,
      hl: Q.list(p.highlight), text: p.prefix ?? '', final: (p.prefix ?? '') + fmt(value, dec, commas) + (p.suffix ?? ''), sfx, hits: [{ at: at + dur, amp: 1.2 }] };
  },
  draw(g, t, shot, P) {
    const cy = 760;
    if (!P.size) {
      P.size = L.fit(g, P.final, L.SAFE.w, 330, 90, 900);
      g.font = L.font(900, P.size); P.dw = g.measureText('0').width;
      P.cells = [...P.final].map((ch) => ({ ch, w: /\d/.test(ch) ? P.dw : g.measureText(ch).width }));
      P.wTot = P.cells.reduce((a, c) => a + c.w, 0);
      // place value of each digit cell (units = 0), counted from the decimal point / end of the number
      const digits = P.cells.map((c, i) => (/\d/.test(c.ch) ? i : -1)).filter((i) => i >= 0);
      digits.forEach((ci, k) => { P.cells[ci].p = digits.length - 1 - k - P.dec; });
    }
    if (P.kicker) L.kicker(g, P.kicker, L.SAFE.cx, 300, t, 0.05, { align: 'center' });
    const u = L.range(t, P.at, P.at + P.dur), cur = P.value * L.outQuart(u);
    const land = L.range(t, P.at + P.dur, P.at + P.dur + 0.35), punch = 1 + 0.07 * Math.sin(Math.PI * land) * (1 - land);
    const S = P.size, base = cy + S * 0.36, inA = L.clamp(L.range(t, P.at - 0.25, P.at) * 1.5);
    g.save(); g.translate(L.SAFE.cx, cy); g.scale(punch, punch); g.translate(-L.SAFE.cx, -cy);
    g.globalAlpha = Math.max(0.12, inA); g.font = L.font(900, S); g.textBaseline = 'alphabetic';
    let x = L.SAFE.cx - P.wTot / 2;
    const top = base - S * 0.86, hgt = S * 1.0;
    for (const c of P.cells) {
      if (c.p == null) { g.fillStyle = L.PAL.ink; g.fillText(c.ch, x, base); x += c.w; continue; }
      // continuous odometer: column value = cur / 10^p, rolls upward
      const v = u >= 1 ? Math.floor(P.value / Math.pow(10, c.p) + 1e-6) : cur / Math.pow(10, c.p), d = Math.floor(v) % 10, fr = u >= 1 ? 0 : v - Math.floor(v);
      const lit = u >= 1 ? true : cur >= Math.pow(10, Math.max(0, c.p)) || c.p <= 0;
      g.save(); g.beginPath(); g.rect(x - 4, top, c.w + 8, hgt); g.clip();
      const k = L.outCubic(fr) * S * 0.98;
      g.fillStyle = lit ? L.PAL.ink : L.PAL.inkFaint;
      const ox = (ch) => (c.w - g.measureText(ch).width) / 2, d1 = String((d + 1) % 10);
      g.fillText(String(d), x + ox(String(d)), base - k); g.fillText(d1, x + ox(d1), base - k + S * 0.98);
      g.restore(); x += c.w;
    }
    g.restore();
    // green rule draws under the number on landing
    const ru = L.range(t, P.at + P.dur - 0.1, P.at + P.dur + 0.4);
    if (ru > 0) { g.fillStyle = L.PAL.green; const w = Math.min(L.SAFE.w, P.wTot) * L.outExpo(ru); g.fillRect(L.SAFE.cx - w / 2, base + S * 0.1, w, 14); }
    // label: big body type, highlighter on chosen words
    if (P.label) {
      const la = L.pop(t, P.labelAt, 0.4);
      if (la.a > 0) {
        if (!P.lb) P.lb = L.fitBlock(g, String(P.label).toUpperCase(), L.SAFE.w, 260, 92, { weight: 700, maxLines: 2 });
        const y0 = base + S * 0.1 + 120;
        g.save(); g.globalAlpha = la.a; g.translate(0, (1 - L.outCubic(la.u)) * 40);
        g.font = L.font(700, P.lb.size, L.FONT.body); g.textAlign = 'left';
        P.lb.lines.forEach((ln, i) => {
          const y = y0 + i * P.lb.lh, wl = g.measureText(ln).width; let x0 = L.SAFE.cx - wl / 2;
          for (const w of ln.split(' ')) {
            const ww = g.measureText(w).width;
            if (P.hl.some((h) => Q.norm(h) === Q.norm(w))) L.swipe(g, x0 - 8, y - P.lb.size * 0.82, ww + 16, P.lb.size * 0.95, L.range(t, P.labelAt + 0.3, P.labelAt + 0.6), { seed: L.hash(w) });
            g.fillStyle = L.PAL.ink; g.fillText(w, x0, y); x0 += ww + g.measureText(' ').width;
          }
        });
        g.restore();
        if (P.sub) L.label(g, String(P.sub).toUpperCase(), L.SAFE.cx, y0 + P.lb.lines.length * P.lb.lh + 40, { align: 'center', alpha: L.range(t, P.labelAt + 0.35, P.labelAt + 0.7), size: 46 });
      }
    }
  },
};
