// LEDGER pictograms: simple line icons drawn in canvas. icon(g, name, cx, cy, size, { t, color, accent, u }).
// Unit space is [-0.5, 0.5] scaled by `size`; `u` (0..1) pops the icon in; `t` drives a small idle motion.
// Names: people, person, briefcase, scales, truck, chart, code, building, headset, doc, shield, chip, cash, search, calendar, clock, cart, cross (health), gear
import { PAL, rr, outBack, clamp } from './ledger.js';

const ICONS = {
  person(g, t, A) { g.beginPath(); g.arc(0, -0.2, 0.13, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-0.27, 0.36); g.quadraticCurveTo(-0.27, 0.02, 0, 0.02); g.quadraticCurveTo(0.27, 0.02, 0.27, 0.36); g.closePath(); g.fillStyle = A; g.fill(); g.stroke(); },
  people(g, t, A) {
    for (const [x, y, s, f] of [[-0.22, 0.04, 0.72, false], [0.22, 0.04, 0.72, false], [0, 0.1, 0.95, true]]) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = f ? A : PAL.card;
      g.beginPath(); g.arc(0, -0.2, 0.13, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-0.27, 0.36); g.quadraticCurveTo(-0.27, 0.02, 0, 0.02); g.quadraticCurveTo(0.27, 0.02, 0.27, 0.36); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
  },
  briefcase(g, t, A) { g.fillStyle = A; rr(g, -0.4, -0.18, 0.8, 0.52, 0.06); g.fill(); g.stroke(); rr(g, -0.14, -0.32, 0.28, 0.14, 0.04); g.stroke(); g.beginPath(); g.moveTo(-0.4, 0.02); g.lineTo(0.4, 0.02); g.stroke(); g.fillStyle = PAL.card; g.fillRect(-0.05, -0.02, 0.1, 0.08); g.strokeRect(-0.05, -0.02, 0.1, 0.08); },
  scales(g, t, A) {
    const a = 0.12 * Math.sin(t * 1.6);
    g.beginPath(); g.moveTo(0, -0.38); g.lineTo(0, 0.34); g.moveTo(-0.2, 0.36); g.lineTo(0.2, 0.36); g.stroke();
    g.save(); g.translate(0, -0.28); g.rotate(a);
    g.beginPath(); g.moveTo(-0.36, 0); g.lineTo(0.36, 0); g.stroke();
    for (const sx of [-0.36, 0.36]) { const yy = 0.22 - sx * Math.sin(a) * 0; g.save(); g.translate(sx, 0); g.rotate(-a);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-0.12, yy); g.moveTo(0, 0); g.lineTo(0.12, yy); g.stroke();
      g.beginPath(); g.moveTo(-0.15, yy); g.quadraticCurveTo(0, yy + 0.16, 0.15, yy); g.closePath(); g.fillStyle = A; g.fill(); g.stroke(); g.restore(); }
    g.restore();
  },
  truck(g, t, A) {
    const b = 0.012 * Math.sin(t * 9);
    g.save(); g.translate(0, b); g.fillStyle = A; rr(g, -0.44, -0.24, 0.52, 0.4, 0.03); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0.08, -0.1); g.lineTo(0.3, -0.1); g.lineTo(0.44, 0.04); g.lineTo(0.44, 0.16); g.lineTo(0.08, 0.16); g.closePath(); g.fillStyle = PAL.card; g.fill(); g.stroke(); g.restore();
    for (const x of [-0.26, 0.28]) { g.beginPath(); g.arc(x, 0.22, 0.08, 0, 7); g.fillStyle = PAL.card; g.fill(); g.stroke(); }
    g.beginPath(); for (let i = 0; i < 3; i++) { const y = -0.15 + i * 0.12, o = ((t * 0.9 + i * 0.3) % 1); g.moveTo(-0.62 - o * 0.1, y); g.lineTo(-0.5 - o * 0.1, y); } g.stroke();
  },
  chart(g, t, A) {
    g.beginPath(); g.moveTo(-0.4, -0.36); g.lineTo(-0.4, 0.34); g.lineTo(0.42, 0.34); g.stroke();
    const hs = [0.22, 0.36, 0.3, 0.52];
    hs.forEach((h, i) => { const hh = h * (0.9 + 0.1 * Math.sin(t * 2 + i)); g.fillStyle = i === 3 ? A : PAL.card; g.fillRect(-0.3 + i * 0.18, 0.34 - hh, 0.12, hh); g.strokeRect(-0.3 + i * 0.18, 0.34 - hh, 0.12, hh); });
  },
  code(g, t, A) {
    g.fillStyle = PAL.card; rr(g, -0.44, -0.34, 0.88, 0.68, 0.06); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-0.44, -0.18); g.lineTo(0.44, -0.18); g.stroke();
    g.save(); g.strokeStyle = A; g.beginPath(); g.moveTo(-0.14, -0.04); g.lineTo(-0.26, 0.08); g.lineTo(-0.14, 0.2); g.moveTo(0.14, -0.04); g.lineTo(0.26, 0.08); g.lineTo(0.14, 0.2); g.stroke(); g.restore();
    if (Math.floor(t * 2) % 2 === 0) { g.beginPath(); g.moveTo(0.02, -0.02); g.lineTo(-0.02, 0.18); g.stroke(); }
  },
  building(g, t, A) {
    g.fillStyle = PAL.card; g.fillRect(-0.3, -0.38, 0.4, 0.74); g.strokeRect(-0.3, -0.38, 0.4, 0.74);
    g.fillStyle = A; g.fillRect(0.1, -0.12, 0.24, 0.48); g.strokeRect(0.1, -0.12, 0.24, 0.48);
    g.fillStyle = PAL.ink; for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) if ((r * 2 + c + Math.floor(t * 1.5)) % 5) g.fillRect(-0.22 + c * 0.16, -0.3 + r * 0.13, 0.08, 0.06);
  },
  headset(g, t, A) {
    g.beginPath(); g.arc(0, 0.02, 0.32, Math.PI, 0); g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = A; rr(g, s * 0.32 - 0.08, -0.04, 0.16, 0.28, 0.06); g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(0.32, 0.24); g.quadraticCurveTo(0.3, 0.4, 0.06, 0.4); g.stroke(); g.beginPath(); g.arc(0.02, 0.4, 0.04, 0, 7); g.fillStyle = PAL.ink; g.fill();
    g.save(); g.globalAlpha *= 0.5 + 0.5 * Math.sin(t * 5); g.beginPath(); g.arc(0, -0.08, 0.08, 0, 7); g.stroke(); g.restore();
  },
  doc(g, t, A) {
    g.fillStyle = PAL.card; g.beginPath(); g.moveTo(-0.3, -0.4); g.lineTo(0.14, -0.4); g.lineTo(0.3, -0.24); g.lineTo(0.3, 0.4); g.lineTo(-0.3, 0.4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0.14, -0.4); g.lineTo(0.14, -0.24); g.lineTo(0.3, -0.24); g.stroke();
    g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(-0.18, -0.12 + i * 0.12); g.lineTo(i === 3 ? 0.02 : 0.18, -0.12 + i * 0.12); } g.stroke();
    g.fillStyle = A; g.fillRect(-0.18, -0.3, 0.16, 0.08);
  },
  shield(g, t, A) {
    g.beginPath(); g.moveTo(0, -0.4); g.lineTo(0.34, -0.26); g.quadraticCurveTo(0.34, 0.22, 0, 0.4); g.quadraticCurveTo(-0.34, 0.22, -0.34, -0.26); g.closePath(); g.fillStyle = A; g.fill(); g.stroke();
    g.save(); g.strokeStyle = PAL.card; g.lineWidth *= 1.1; g.beginPath(); g.moveTo(-0.13, 0.0); g.lineTo(-0.03, 0.11); g.lineTo(0.15, -0.1); g.stroke(); g.restore();
  },
  chip(g, t, A) {
    g.beginPath(); for (let i = 0; i < 4; i++) { const p = -0.2 + i * 0.133; g.moveTo(p, -0.42); g.lineTo(p, -0.28); g.moveTo(p, 0.28); g.lineTo(p, 0.42); g.moveTo(-0.42, p); g.lineTo(-0.28, p); g.moveTo(0.28, p); g.lineTo(0.42, p); } g.stroke();
    g.fillStyle = PAL.card; rr(g, -0.28, -0.28, 0.56, 0.56, 0.06); g.fill(); g.stroke();
    g.fillStyle = A; const k = 0.13 + 0.02 * Math.sin(t * 4); rr(g, -k, -k, 2 * k, 2 * k, 0.03); g.fill(); g.stroke();
  },
  cash(g, t, A) {
    for (let i = 2; i >= 0; i--) { g.save(); g.translate(i * 0.05, -i * 0.06); g.fillStyle = i ? PAL.greenTint : A; rr(g, -0.42, -0.2, 0.8, 0.42, 0.04); g.fill(); g.stroke(); g.restore(); }
    g.save(); g.fillStyle = PAL.card; g.beginPath(); g.arc(-0.02, 0.01, 0.12, 0, 7); g.fill(); g.stroke();
    g.scale(0.01, 0.01); g.fillStyle = PAL.ink; g.font = '700 20px "Archivo Narrow"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', -2, 1.5); g.restore();
  },
  search(g, t, A) { g.beginPath(); g.arc(-0.08, -0.08, 0.24, 0, 7); g.fillStyle = PAL.card; g.fill(); g.stroke(); g.save(); g.lineWidth *= 1.6; g.beginPath(); g.moveTo(0.1, 0.1); g.lineTo(0.34, 0.34); g.stroke(); g.restore(); },
  calendar(g, t, A) { g.fillStyle = PAL.card; rr(g, -0.38, -0.3, 0.76, 0.68, 0.06); g.fill(); g.stroke(); g.fillStyle = A; g.fillRect(-0.38, -0.3, 0.76, 0.16); g.strokeRect(-0.38, -0.3, 0.76, 0.16); g.beginPath(); g.moveTo(-0.2, -0.4); g.lineTo(-0.2, -0.22); g.moveTo(0.2, -0.4); g.lineTo(0.2, -0.22); g.stroke(); g.fillStyle = PAL.ink; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillRect(-0.27 + c * 0.15, -0.06 + r * 0.13, 0.07, 0.06); },
  clock(g, t, A) { g.beginPath(); g.arc(0, 0, 0.38, 0, 7); g.fillStyle = PAL.card; g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -0.24); g.stroke(); g.save(); g.strokeStyle = A; g.rotate(t * 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(0.2, 0); g.stroke(); g.restore(); },
  cart(g, t, A) { g.beginPath(); g.moveTo(-0.44, -0.3); g.lineTo(-0.3, -0.3); g.lineTo(-0.2, 0.14); g.lineTo(0.3, 0.14); g.lineTo(0.4, -0.18); g.lineTo(-0.26, -0.18); g.stroke(); g.fillStyle = A; g.fillRect(-0.18, -0.12, 0.48, 0.18); for (const x of [-0.14, 0.24]) { g.beginPath(); g.arc(x, 0.28, 0.07, 0, 7); g.fillStyle = PAL.card; g.fill(); g.stroke(); } },
  cross(g, t, A) { g.fillStyle = A; g.beginPath(); const a = 0.13, b = 0.38; g.moveTo(-a, -b); g.lineTo(a, -b); g.lineTo(a, -a); g.lineTo(b, -a); g.lineTo(b, a); g.lineTo(a, a); g.lineTo(a, b); g.lineTo(-a, b); g.lineTo(-a, a); g.lineTo(-b, a); g.lineTo(-b, -a); g.lineTo(-a, -a); g.closePath(); g.fill(); g.stroke(); },
  gear(g, t, A) { g.save(); g.rotate(t * 0.8); g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 0.3 : 0.4, a0 = i / 16 * Math.PI * 2; g.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); g.lineTo(Math.cos(a0 + 0.39) * r, Math.sin(a0 + 0.39) * r); } g.closePath(); g.fillStyle = A; g.fill(); g.stroke(); g.beginPath(); g.arc(0, 0, 0.12, 0, 7); g.fillStyle = PAL.card; g.fill(); g.stroke(); g.restore(); },
};
export const names = Object.keys(ICONS);

export function icon(g, name, cx, cy, size, { t = 0, u = 1, color = PAL.ink, accent = PAL.green, lw = 0.055 } = {}) {
  const f = ICONS[name] ?? ICONS.doc; if (u <= 0) return;
  const s = size * outBack(clamp(u), 2.4);
  g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha *= clamp(u * 4);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  f(g, t, accent); g.restore();
}
// icon inside a filled round badge
export function badge(g, name, cx, cy, size, { t = 0, u = 1, bg = PAL.greenTint, ring = PAL.ink, accent = PAL.green } = {}) {
  if (u <= 0) return;
  const s = outBack(clamp(u), 2.2);
  g.save(); g.globalAlpha *= clamp(u * 4); g.fillStyle = bg; g.strokeStyle = ring; g.lineWidth = Math.max(4, size * 0.03);
  g.beginPath(); g.arc(cx, cy, size / 2 * s, 0, 7); g.fill(); g.stroke(); g.restore();
  icon(g, name, cx, cy + Math.sin(t * 1.8) * size * 0.015, size * 0.62, { t, u: clamp(u * 1.3 - 0.15), accent });
}
