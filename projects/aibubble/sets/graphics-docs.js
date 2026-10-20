// AI-bubble document and archive sets (episode 8).
//   doc    typographic RECREATIONS of SEC filings (never facsimiles): every sheet says on screen that it is recreated
//          and from what; quoted phrases are verbatim from RESEARCH.md, everything else is a labelled summary. params.doc:
//     'nvidia8k'     NVIDIA 8-K, 17 Aug 2026: up to $105B guarantee of OpenAI's Ohio leases     keys: shortfall cap term gw tenant rating items form date
//     'nvidia10k'    NVIDIA 10-K, filed 25 Feb 2026: "There is no assurance …"                    keys: assurance agreement form date
//     'nvidia10q'    NVIDIA 10-Q, quarter to 26 Jul 2026: AI clouds "currently lack …"            keys: lack financing power form date
//     'coreweave8k'  CoreWeave 8-K, Sep 2025: NVIDIA "is obligated to purchase the residual …"    keys: residual value date form
//     'oracle10q'    Oracle 10-Q, quarter to 31 Aug 2026: $125.0B debt, fair value $105.7B (≈85¢), FCF −$5.4B, $20B ATM   keys: debt fair cents capex fcf atm form date
//     'lucent10k'    Lucent 10-K405, FY2001 (Dec 2001): "Adverse industry conditions …"           keys: clec creditworthiness program commit provisions form date
//     'amdwarrant'   AMD 8-K, 6 Oct 2025: warrant, 160M shares at $0.01, targets "escalate to $600"  keys: shares price gw expiry 600 form date
//          other params: highlight (key or [keys]), at (cue or [cues] per highlight), zoom, tilt, label (false hides), source
//   photo  a photo in a white border card on paper with an eased Ken Burns push, caption slab and credit line.
//          params: file (in projects/aibubble/assets/photos/, or an absolute /projects/... path), caption, credit, focus [x, y] 0..1, zoom, kicker, cutout
// Every word on a recreated sheet is either a verbatim quote from RESEARCH.md or a plain summary of a RESEARCH fact;
// brackets and ellipses mark our edits.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

// ---------------------------------------------------------------- the sheets (pt coordinates)
// blocks: ['t', y, text, o]   one line: o = { x, align 'l'|'c'|'r', size, fam, weight, style, track, color, key }
//         ['p', y, text, o]   wrapped paragraph: o = { x, w, size, lh, fam, style, weight, color, marks: { key: phrase } }
//         ['row', y, label, value, o]  label at x, value right-aligned at r (or left at vx), dotted leader: o = { key, size, fam, bold }
//         ['rule', y, o]      o = { x0, x1, w, double, color }
//         ['box', x, y, w, h, o]  o = { lw, color, r, text, size, fam, track, key }
const INK = '#17181c', GREY = '#55524b', NOTE = { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 };
// the SEC cover block: UNITED STATES / SEC / Washington / FORM / kind / registrant / date line (y 64 … 272)
const sec = (form, kind, company, date) => [
  ['t', 62, 'UNITED STATES', { align: 'c', size: 11, fam: F.narrow, weight: 700, track: 0.3 }],
  ['t', 82, 'SECURITIES AND EXCHANGE COMMISSION', { align: 'c', size: 15, fam: F.serif, track: 0.08 }],
  ['t', 99, 'Washington, D.C. 20549', { align: 'c', size: 10, fam: F.serif, style: 'italic', color: GREY }],
  ['rule', 114, { double: true }],
  ['t', 164, form, { align: 'c', size: 40, weight: 900, track: 0.02, key: 'form' }],
  ['t', 188, kind, { align: 'c', size: 11.5, fam: F.narrow, weight: 700, track: 0.3, color: GREY }],
  ['t', 228, company, { align: 'c', size: 21, fam: F.serif, track: 0.06 }],
  ['t', 250, date, { align: 'c', size: 11, fam: F.serif, style: 'italic', key: 'date' }],
  ['rule', 270, {}],
];
const DOCS = {
  nvidia8k: {
    w: 612, h: 730, paper: '#fbfaf6', ink: INK, def: ['cap', 'shortfall', 'rating'], tilt: -0.7,
    blocks: [
      ...sec('FORM 8-K', 'CURRENT REPORT', 'NVIDIA CORPORATION', 'Date of report: August 17, 2026'),
      ['t', 300, 'ITEMS 1.01 AND 2.03 · AN OFF-BALANCE-SHEET OBLIGATION', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: GREY, key: 'items' }],
      ['row', 338, 'Guarantee, capped at', 'up to $105 billion', { key: 'cap', bold: true, size: 15 }],
      ['row', 372, 'Leases', '20-year terms', { key: 'term' }],
      ['row', 406, 'Data-centre capacity', '~4.25 GW · Pike County, Ohio', { key: 'gw' }],
      ['row', 440, 'Tenant', 'OpenAI', { key: 'tenant' }],
      ['p', 492, '[If OpenAI becomes insolvent or fails to pay,] “NVIDIA will pay an amount generally equal to any shortfall …”', { size: 18, lh: 26, fam: F.serif, marks: { shortfall: '“NVIDIA will pay an amount generally equal to any shortfall …”' } }],
      ['p', 586, '[The guarantee ends early upon] “… OpenAI achieving a satisfactory credit rating.”', { size: 18, lh: 26, fam: F.serif, marks: { rating: 'OpenAI achieving a satisfactory credit rating.”' } }],
      ['rule', 646, {}],
      ['p', 672, 'Recreated text. Quoted phrases are verbatim from NVIDIA’s Form 8-K of 17 Aug 2026; the table and bracketed words are our summary. OpenAI must reimburse NVIDIA for any payment.', NOTE],
    ],
    label: 'RECREATED TEXT · NVIDIA FORM 8-K, 17 AUG 2026', src: 'SOURCE: NVIDIA CORP., FORM 8-K (17 AUG 2026), ITEMS 1.01 AND 2.03 · SEC EDGAR',
  },
  nvidia10k: {
    w: 612, h: 560, paper: '#fbfaf6', ink: INK, def: ['assurance'], tilt: 0.7,
    blocks: [
      ...sec('FORM 10-K', 'ANNUAL REPORT', 'NVIDIA CORPORATION', 'Fiscal year ended January 25, 2026 · filed February 25, 2026'),
      ['t', 304, '[On the September 2025 letter of intent to invest “up to $100 billion” in OpenAI:]', { x: 72, size: 11.5, fam: F.serif, style: 'italic', color: GREY }],
      ['p', 352, '“There is no assurance that we will enter into an investment and partnership agreement with OpenAI or that a transaction will be completed.”', { size: 23, lh: 32, fam: F.serif, marks: { assurance: 'There is no assurance', agreement: 'or that a transaction will be completed.”' } }],
      ['rule', 478, {}],
      ['p', 504, 'Recreated text. The quotation is verbatim from NVIDIA’s Form 10-K filed 25 Feb 2026; the bracketed line is our summary.', NOTE],
    ],
    label: 'RECREATED TEXT · NVIDIA FORM 10-K, 25 FEB 2026', src: 'SOURCE: NVIDIA CORP., FORM 10-K FOR FISCAL 2026 (FILED 25 FEB 2026) · SEC EDGAR',
  },
  nvidia10q: {
    w: 612, h: 640, paper: '#fbfaf6', ink: INK, def: ['lack', 'financing'], tilt: -0.8,
    blocks: [
      ...sec('FORM 10-Q', 'QUARTERLY REPORT', 'NVIDIA CORPORATION', 'Quarter ended July 26, 2026 · filed August 26, 2026'),
      ['t', 304, '[On the AI cloud providers NVIDIA now backs, which:]', { x: 72, size: 11.5, fam: F.serif, style: 'italic', color: GREY }],
      ['p', 352, '“… currently lack the ability to secure long-term infrastructure contracts and investment-grade financing capacity …”', { size: 23, lh: 32, fam: F.serif, marks: { lack: 'currently lack the ability', financing: 'investment-grade financing capacity' } }],
      ['t', 488, '[On demand, customers may delay purchases:]', { x: 72, size: 11.5, fam: F.serif, style: 'italic', color: GREY }],
      ['p', 520, '“… due to the lack of availability of data center infrastructure …”', { size: 16, lh: 23, fam: F.serif, marks: { power: 'lack of availability of data center infrastructure' } }],
      ['rule', 560, {}],
      ['p', 586, 'Recreated text. Quotations are verbatim from NVIDIA’s Form 10-Q for the quarter ended 26 Jul 2026; bracketed lines are our summary.', NOTE],
    ],
    label: 'RECREATED TEXT · NVIDIA FORM 10-Q, AUG 2026', src: 'SOURCE: NVIDIA CORP., FORM 10-Q, QUARTER ENDED 26 JUL 2026 (FILED 26 AUG 2026) · SEC EDGAR',
  },
  coreweave8k: {
    w: 612, h: 620, paper: '#fbfaf6', ink: INK, def: ['residual', 'value'], tilt: 0.8,
    blocks: [
      ...sec('FORM 8-K', 'CURRENT REPORT', 'COREWEAVE, INC.', 'Date of report: September 9, 2025 · filed September 15, 2025'),
      ['row', 316, 'Order from', 'NVIDIA', {}],
      ['row', 350, 'Initial order value', '$6.3 billion', { key: 'value', bold: true, size: 15 }],
      ['row', 384, 'Runs through', 'April 13, 2032', { key: 'date' }],
      ['p', 440, '[NVIDIA] “is obligated to purchase the residual unsold capacity through April 13, 2032.”', { size: 22, lh: 31, fam: F.serif, marks: { residual: 'is obligated to purchase the residual unsold capacity' } }],
      ['rule', 540, {}],
      ['p', 566, 'Recreated text. The quotation is verbatim from CoreWeave’s Form 8-K (filed 15 Sep 2025); the table and bracketed word are our summary.', NOTE],
    ],
    label: 'RECREATED TEXT · COREWEAVE FORM 8-K, SEP 2025', src: 'SOURCE: COREWEAVE, INC., FORM 8-K (DATED 9 SEP 2025, FILED 15 SEP 2025) · SEC EDGAR',
  },
  oracle10q: {
    w: 612, h: 720, paper: '#fbfaf6', ink: INK, def: ['fair', 'fcf'], tilt: -0.6,
    blocks: [
      ...sec('FORM 10-Q', 'QUARTERLY REPORT', 'ORACLE CORPORATION', 'Quarter ended August 31, 2026 · filed September 11, 2026'),
      ['t', 304, 'SENIOR NOTES AND OTHER BORROWINGS, 31 AUG 2026', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: GREY }],
      ['row', 338, 'Carrying value', '$125.0 billion', { key: 'debt', fam: F.mono, size: 14 }],
      ['row', 370, 'Estimated fair value', '$105.7 billion', { key: 'fair', fam: F.mono, size: 14, bold: true }],
      ['row', 402, 'Fair value per $1 of debt (our math)', '≈ 85¢', { key: 'cents', fam: F.mono, size: 14, bold: true }],
      ['t', 452, 'FIRST QUARTER OF FISCAL 2027 · JUN – AUG 2026', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: GREY }],
      ['row', 486, 'Operating cash flow', '$23.1 billion', { fam: F.mono, size: 14 }],
      ['row', 518, 'Capital expenditures', '−$28.5 billion', { key: 'capex', fam: F.mono, size: 14 }],
      ['rule', 536, { x0: 380, x1: 540 }],
      ['row', 568, 'Free cash flow (our math)', '−$5.4 billion', { key: 'fcf', fam: F.mono, size: 17, bold: true }],
      ['row', 608, 'At-the-market stock sales', '$20B programme, all used', { key: 'atm', fam: F.mono, size: 14 }],
      ['rule', 634, {}],
      ['p', 660, 'Recreated summary of figures in Oracle’s Form 10-Q for the quarter ended 31 Aug 2026, not the filing’s layout. Rows marked “our math” are our calculation from those figures.', NOTE],
    ],
    label: 'RECREATED SUMMARY · ORACLE FORM 10-Q, SEP 2026', src: 'SOURCE: ORACLE CORP., FORM 10-Q, QUARTER ENDED 31 AUG 2026 (FILED 11 SEP 2026) · SEC EDGAR',
  },
  lucent10k: {
    w: 612, h: 620, paper: '#f6f3ea', ink: '#1d1a14', def: ['clec', 'creditworthiness', 'commit'], tilt: 0.9,
    blocks: [
      ...sec('FORM 10-K405', 'ANNUAL REPORT', 'LUCENT TECHNOLOGIES INC.', 'Fiscal year ended September 30, 2001 · filed December 28, 2001'),
      ['p', 320, '“Adverse industry conditions, such as the continued softening in the CLEC market, have negatively affected the creditworthiness of several customers that participate in our customer financing program.”', { size: 21, lh: 30, fam: F.serif, marks: { clec: 'continued softening in the CLEC market,', creditworthiness: 'negatively affected the creditworthiness', program: 'our customer financing program.”' } }],
      ['rule', 448, {}],
      ['row', 484, 'Customer financing committed, 30 Sep 2000', '$8.1 billion', { key: 'commit', size: 14, bold: true }],
      ['row', 518, 'Provisions incl. customer financing, FY2001', '$2.2 billion', { key: 'provisions', size: 14, bold: true }],
      ['rule', 544, {}],
      ['p', 570, 'Recreated text. The quotation is verbatim from Lucent’s Form 10-K405 for fiscal 2001; the figures are summarised from it and the FY2000 10-K/A. CLEC: competitive local exchange carrier.', NOTE],
    ],
    label: 'RECREATED TEXT · LUCENT FORM 10-K405, DEC 2001', src: 'SOURCE: LUCENT TECHNOLOGIES, FORM 10-K405 FOR FISCAL 2001 (FILED 28 DEC 2001); FORM 10-K/A FY2000 · SEC EDGAR',
  },
  amdwarrant: {
    w: 612, h: 660, paper: '#fbfaf6', ink: INK, def: ['shares', 'price', '600'], tilt: -0.8,
    blocks: [
      ...sec('FORM 8-K', 'CURRENT REPORT', 'ADVANCED MICRO DEVICES, INC.', 'Date of report: October 6, 2025'),
      ['t', 304, 'WARRANT ISSUED TO OPENAI', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: GREY }],
      ['row', 340, 'Shares of AMD common stock', 'up to 160,000,000', { key: 'shares', fam: F.mono, size: 15, bold: true }],
      ['row', 374, 'Exercise price', '$0.01 per share', { key: 'price', fam: F.mono, size: 15, bold: true }],
      ['row', 408, 'Vests as OpenAI buys', 'up to 6 GW of AMD GPUs', { key: 'gw', fam: F.mono, size: 14 }],
      ['row', 442, 'Expires', 'October 5, 2030', { key: 'expiry', fam: F.mono, size: 14 }],
      ['p', 494, '[Vesting is also tied to AMD’s share price reaching targets] “that escalate to $600 per share.”', { size: 19, lh: 27, fam: F.serif, marks: { 600: '“that escalate to $600 per share.”' } }],
      ['rule', 572, {}],
      ['p', 598, 'Recreated summary of AMD’s Form 8-K of 6 Oct 2025; the quoted phrase is verbatim, the table and bracketed words are our summary. AMD gave Meta an identical warrant on 23 Feb 2026.', NOTE],
    ],
    label: 'RECREATED SUMMARY · AMD FORM 8-K, 6 OCT 2025', src: 'SOURCE: ADVANCED MICRO DEVICES, FORM 8-K (6 OCT 2025) · SEC EDGAR',
  },
};

// ---------------------------------------------------------------- layout: blocks -> draw ops + highlight rects (pt)
function layout(D) {
  const mg = G.mk(4, 4).getContext('2d');
  const W = (s, size, fam, weight, track = 0, style = '') => G.measure(mg, s, size * 10, weight, fam, track, style) / 10; // measured large: small sizes round their advances
  const ops = [], keys = {}, add = (k, r) => { if (k) (keys[k] ??= []).push(r); };
  const fam0 = D.typed ? F.mono : D.news ? F.serif : F.sans;
  for (const b of D.blocks) {
    const kind = b[0];
    if (kind === 't') {
      const [, y, s, o = {}] = b, size = o.size ?? 13, fam = o.fam ?? fam0, weight = o.weight ?? (fam === F.serif ? 400 : 500), style = o.style ?? '', track = o.track ?? 0;
      const w = W(s, size, fam, weight, track, style), align = o.align ?? 'l', x = o.x ?? (align === 'c' ? D.w / 2 : align === 'r' ? D.w - 72 : 72);
      const x0 = align === 'c' ? x - w / 2 : align === 'r' ? x - w : x;
      ops.push({ s, x: x0, y, size, fam, weight, style, track, color: o.color ?? D.ink });
      add(o.key, [x0, y - size * 0.92, x0 + w, y + size * 0.28]);
    } else if (kind === 'p') {
      const [, y, s, o = {}] = b, size = o.size ?? 13, fam = o.fam ?? fam0, weight = o.weight ?? (fam === F.serif ? 400 : 500), style = o.style ?? '', lh = o.lh ?? size * 1.4;
      const x = o.x ?? 72, maxW = o.w ?? D.w - 144, sp = W(' ', size, fam, weight, 0, style);
      const words = s.split(' '); let cx = x, cy = y; const toks = [];
      words.forEach((wd, i) => { const ww = W(wd, size, fam, weight, 0, style); if (cx > x && cx + ww > x + maxW) { cx = x; cy += lh; } toks.push({ wd, x: cx, y: cy, w: ww, i }); cx += ww + sp; });
      toks.forEach(tk => ops.push({ s: tk.wd, x: tk.x, y: tk.y, size, fam, weight, style, track: 0, color: o.color ?? D.ink }));
      // marks: phrase -> token range -> one rect per line
      for (const [key, ph] of Object.entries(o.marks ?? {})) {
        const joined = words.join(' '), at = joined.indexOf(ph); if (at < 0) continue;
        let c = 0; const hit = []; words.forEach((wd, i) => { const a = c, e = c + wd.length; if (e > at && a < at + ph.length) hit.push(i); c = e + 1; });
        const lines = {}; hit.forEach(i => { const tk = toks[i]; (lines[tk.y] ??= []).push(tk); });
        Object.values(lines).forEach(ln => add(key, Object.assign([ln[0].x, ln[0].y - size * 0.9, ln.at(-1).x + ln.at(-1).w, ln[0].y + size * 0.28], { para: true })));
      }
    } else if (kind === 'row') {
      const [, y, a, v, o = {}] = b, size = o.size ?? 14, fam = o.fam ?? fam0, wB = o.bold ? 700 : (fam === F.serif ? 400 : 500), r = o.r ?? D.w - 72;
      const vf = fam === F.mono ? F.mono : fam, wa = W(a, size, fam, 500), wv = W(v, size, vf, wB);
      ops.push({ s: a, x: 72, y, size, fam, weight: fam === F.mono ? 400 : 500, color: D.ink });
      const vx = o.vx != null ? o.vx : r - wv;
      ops.push({ s: v, x: vx, y, size, fam: vf, weight: wB, color: D.ink });
      if (o.lead !== false && o.vx == null) ops.push({ lead: [72 + wa + 8, vx - 8, y - 2] });
      add(o.key, [vx, y - size * 0.92, vx + wv, y + size * 0.28]);
    } else if (kind === 'rule') {
      const [, y, o = {}] = b; ops.push({ rule: [o.x0 ?? 72, o.x1 ?? D.w - 72, y, o.w ?? 1.2, !!o.double, o.color ?? D.ink] });
    } else if (kind === 'box') {
      const [, x, y, w, h, o = {}] = b, size = o.size ?? 20, fam = o.fam ?? F.sans, weight = fam === F.mono ? 500 : 900, track = o.track ?? 0.02;
      ops.push({ box: [x, y, w, h, o.lw ?? 2, o.r ?? 4, D.ink] });
      const tw = W(o.text ?? '', size, fam, weight, track);
      ops.push({ s: o.text ?? '', x: x + w / 2 - tw / 2, y: y + h / 2 + size * 0.36, size, fam, weight, track, color: D.ink });
      add(o.key, Object.assign([x, y, x + w, y + h], { box: true }));
    }
  }
  return { ops, keys };
}
function drawSheet(g, D, L) {
  g.save(); G.shadow(g, 1.6); g.fillStyle = D.paper; G.rr(g, 0, 0, D.w, D.h, D.card ? 8 : 1.5); g.fill(); G.noShadow(g);
  g.save(); G.rr(g, 0, 0, D.w, D.h, D.card ? 8 : 1.5); g.clip();
  if (D.card) { g.fillStyle = 'rgba(42,140,134,0.10)'; for (let y = 96; y < D.h - 20; y += 26) g.fillRect(0, y, D.w, 1); }
  if (D.news) { const r = rng(41); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(120,100,60,${0.02 + r() * 0.04})`; g.beginPath(); g.arc(r() * D.w, r() * D.h, 6 + r() * 26, 0, TAU); g.fill(); } }
  if (D.typed) { g.fillStyle = 'rgba(120,90,40,0.06)'; g.fillRect(0, D.h * 0.48, D.w, 2); }
  G.grain(g, D.w, D.h, D.news ? 0.5 : 0.25, 0, 0); g.restore();
  g.restore();
  for (const o of L.ops) {
    if (o.rule) { const [x0, x1, y, w, dbl, col] = o.rule; g.fillStyle = col; g.fillRect(x0, y - w / 2, x1 - x0, w); if (dbl) g.fillRect(x0, y + 3.2 - w / 2, x1 - x0, w * 0.6); continue; }
    if (o.box) { const [x, y, w, h, lw, r, col] = o.box; g.save(); g.strokeStyle = col; g.lineWidth = lw; G.rr(g, x, y, w, h, r); g.stroke(); g.restore(); continue; }
    if (o.lead) { const [a, b, y] = o.lead; g.save(); g.fillStyle = 'rgba(23,24,28,0.35)'; for (let x = a; x < b; x += 5) g.fillRect(x, y, 1.4, 1.4); g.restore(); continue; }
    g.save(); g.translate(o.x, o.y); g.scale(0.1, 0.1); G.text(g, o.s, 0, 0, { size: o.size * 10, weight: o.weight, fam: o.fam, style: o.style, track: o.track ?? 0, color: o.color }); g.restore();
  }
}

export default function makeDocs(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  // ================================================================ doc
  async function doc(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, Dc = DOCS[Pm.doc ?? 'nvidia8k'] ?? DOCS.nvidia8k;
    await G.loadFonts();
    const L = layout(Dc);
    const keys = [].concat(Pm.highlight ?? Dc.def).filter(k => L.keys[k]);
    const HL = keys.map(k => { const rs = L.keys[k], u = [Math.min(...rs.map(r => r[0])), Math.min(...rs.map(r => r[1])), Math.max(...rs.map(r => r[2])), Math.max(...rs.map(r => r[3]))]; return { rs, u }; });
    const ats = [].concat(Pm.at ?? []), n = HL.length, T0 = Math.min(1.9, D * 0.28), step = n > 1 ? clamp((D - T0 - 1.6) / (n - 1), 0.9, 1.8) : 0;
    const T = HL.map((_, i) => G.cue(shot, ats[i], T0 + i * step));
    const fit = Math.min(1640 / Dc.w, 900 / Dc.h), Z0 = fit * 0.96;
    const zOf = (h) => Math.min(Pm.zoom ?? fit * 1.4, 1700 / Dc.w);
    const tilt = (Pm.tilt ?? Dc.tilt ?? 0) * Math.PI / 180;
    const start = [Dc.w / 2, Dc.h / 2];
    return set(ctx, shot, (g, t, p, k) => {
      // the camera on the page: focus point (pt) at screen centre, zoom Z; glides to each highlight in turn
      let f = start, Z = Z0;
      if (HL.length) {
        const fo = (h) => [Dc.w / 2, clamp((h.u[1] + h.u[3]) / 2, Dc.h * 0.32, Dc.h * 0.68)];
        const u0 = E.inOutCubic(range(t, 0.25, Math.max(1.0, T[0] - 0.1))); f = [lerp(start[0], fo(HL[0])[0], u0), lerp(start[1], fo(HL[0])[1], u0)]; Z = lerp(Z0, zOf(HL[0]), u0);
        for (let i = 1; i < HL.length; i++) { const u = E.inOutCubic(range(t, T[i] - 0.9, T[i] - 0.05)); f = [lerp(f[0], fo(HL[i])[0], u), lerp(f[1], fo(HL[i])[1], u)]; Z = lerp(Z, zOf(HL[i]), u); }
      }
      // the desk: a ledger blotter, its own parallax
      k.view(0.35); g.fillStyle = P.desk; g.fillRect(-200, -200, 2320, 1480);
      G.ledgerLines(g, -200, -200, 2320, 1480, { step: 46, cols: [300, 700, 1100, 1500], color: 'rgba(29,106,102,0.12)', colColor: 'rgba(29,106,102,0.10)' }); G.grain(g, 2320, 1480, 0.4, -200, -200);
      const px = (depth) => { g.save(); k.view(depth); g.translate(960, 560); g.scale(Z, Z); g.rotate(tilt); g.translate(-f[0], -f[1]); };
      // an under-sheet, a little lower and rotated
      px(0.8); g.translate(30, 26); g.rotate(-0.03); G.shadow(g, 1.2); g.fillStyle = '#f1f0ea'; g.fillRect(0, 0, Dc.w, Dc.h); G.noShadow(g); g.restore();
      // the sheet, entering with a small settle
      px(1); const ke = E.outCubic(range(t, 0, 0.6)); g.translate(0, (1 - ke) * 30); g.globalAlpha = clamp(ke * 1.5);
      drawSheet(g, Dc, L);
      // highlights: a pale red band sweeps each line; one rect gets a red marker loop, several get red underlines
      HL.forEach((h, i) => {
        const kk = range(t, T[i], T[i] + 0.8); if (kk <= 0) return;
        h.rs.forEach((r, j) => {
          const kb = E.emphasized(range(t, T[i] + 0.15 + j * 0.25, T[i] + 0.7 + j * 0.25)); if (kb <= 0) return;
          g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(224,36,27,0.17)'; g.fillRect(r[0] - 3, r[1] - 2, (r[2] - r[0] + 6) * kb, r[3] - r[1] + 4); g.restore();
          if (h.rs.length > 1 || r.para) { g.save(); g.strokeStyle = P.red; g.lineWidth = Math.max(1.6, (r[3] - r[1]) * 0.09); g.lineCap = 'round'; g.beginPath(); g.moveTo(r[0], r[3] + 3); g.lineTo(lerp(r[0], r[2], kb), r[3] + 3); g.stroke(); g.restore(); }
        });
        if (h.rs[0].box) { const b = h.u, kb = E.inOutCubic(kk), per = 2 * (b[2] - b[0] + b[3] - b[1]); g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.lineJoin = 'round'; g.setLineDash([per * kb, per]); G.rr(g, b[0] - 6, b[1] - 6, b[2] - b[0] + 12, b[3] - b[1] + 12, 8); g.stroke(); g.restore(); }
        else if (h.rs.length === 1 && !h.rs[0].para) { const b = h.u, hh = b[3] - b[1], pd = Math.min(hh * 0.42, 9); G.markerLoop(g, b[0], b[1], b[2] - b[0], hh, E.outCubic(kk), { width: clamp(hh * 0.12, 1.8, 3.2), seed: 5 + i * 3, padX: pd + 3, padY: pd }); }
      });
      g.restore();
      // labels float above the paper
      k.flat();
      // a soft desk-coloured header band so the label reads over the page
      const hb = g.createLinearGradient(0, 0, 0, 150); hb.addColorStop(0, 'rgba(223,230,225,0.95)'); hb.addColorStop(0.6, 'rgba(223,230,225,0.7)'); hb.addColorStop(1, 'rgba(223,230,225,0)'); g.fillStyle = hb; g.fillRect(0, 0, 1920, 150);
      if (Pm.label !== false) G.pill(g, Dc.label, 80, 84, { size: 21, k: range(t, 0.3, 0.8), fam: F.mono, weight: 500, fill: P.ink, color: P.white, dot: P.teal });
      G.source(g, Pm.source ?? Dc.src, range(t, 0.6, 1.4), { size: 16 });
    }, { push: 0.025, dx: 26, dy: 8 });
  }

  // ================================================================ photo: an archival photo, Ken Burns, caption, credit
  async function photo(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, file = String(Pm.file ?? '');
    if (!file) throw new Error('photo: params.file is required (projects/aibubble/assets/photos/<file> or an absolute /projects/... path)');
    const im = await G.image(file.startsWith('/') ? file : `/projects/aibubble/assets/photos/${file}`);
    const iw = im.naturalWidth, ih = im.naturalHeight, ar = iw / ih;
    const cutout = Pm.cutout ?? /\.png$/i.test(file), portrait = ar < 1.05;
    const zoom = Pm.zoom ?? 1.14, focus = Pm.focus ?? [0.5, 0.45], maxScale = Pm.maxScale ?? 1.7;
    // the window (what shows of the photo) and its card
    let ww, wh;
    if (cutout) { ww = Math.min(1300, iw * 1.4); wh = ww / ar; if (wh > 640) { wh = 640; ww = wh * ar; } }
    else if (portrait) { wh = Math.min(800, ih * maxScale); ww = Math.min(wh * clamp(ar, 0.68, 1), iw * maxScale); }
    else { ww = Math.min(1440, iw * maxScale); wh = Math.min(800, ww / clamp(ar, 1.3, 1.8)); }
    const small = !cutout && (iw * maxScale <= ww + 1 || ih * maxScale <= wh + 1) && Math.max(iw, ih) < 1200;
    const mat = cutout ? 0 : small ? 46 : 16;
    const cx = cutout ? 960 : portrait ? 660 : 960, cy = cutout ? 470 : portrait ? 520 : 84 + mat + wh / 2;
    const tilt = (Pm.tilt ?? (portrait ? -1.2 : -0.6)) * Math.PI / 180;
    const caption = Pm.caption ?? '', credit = Pm.credit ?? '';
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g, { ledger: false });
      k.view(0.75);
      const ke = E.outCubic(range(t, 0, 0.8));
      g.save(); g.translate(cx, cy + (1 - ke) * 40); g.rotate(tilt * (0.6 + 0.4 * ke)); g.globalAlpha = clamp(ke * 1.6);
      if (!cutout) {
        // the card: white border, soft shadow; small photos get a wide mat with a hairline
        G.card(g, -ww / 2 - mat, -wh / 2 - mat, ww + mat * 2, wh + mat * 2, { r: 3, fill: '#fefefb', lift: 1.5, grainA: 0.25 });
        if (small) { g.strokeStyle = 'rgba(20,35,61,0.18)'; g.lineWidth = 1.5; g.strokeRect(-ww / 2 - 10, -wh / 2 - 10, ww + 20, wh + 20); }
        g.save(); g.beginPath(); g.rect(-ww / 2, -wh / 2, ww, wh); g.clip();
        // Ken Burns: cover-fit, push toward the focus point, eased over the whole shot
        const u = E.inOutSine(clamp(t / D)), cover = Math.max(ww / iw, wh / ih), s = cover * lerp(1.02, zoom, u);
        const fx = (focus[0] - 0.5) * iw * s, fy = (focus[1] - 0.5) * ih * s;
        let ox = -fx * lerp(0.15, 0.9, u), oy = -fy * lerp(0.15, 0.9, u); // image centre offset: the focus slides toward the window centre
        const mx = (iw * s - ww) / 2, my = (ih * s - wh) / 2; ox = clamp(ox, -mx, mx); oy = clamp(oy, -my, my);
        g.drawImage(im, ox - iw * s / 2, oy - ih * s / 2, iw * s, ih * s);
        // a faint vignette and grain so prints sit in the paper world
        const vg = g.createRadialGradient(0, 0, Math.min(ww, wh) * 0.35, 0, 0, Math.hypot(ww, wh) * 0.6); vg.addColorStop(0, 'rgba(20,25,35,0)'); vg.addColorStop(1, 'rgba(20,25,35,0.22)'); g.fillStyle = vg; g.fillRect(-ww / 2, -wh / 2, ww, wh);
        G.grain(g, ww, wh, 0.18, -ww / 2, -wh / 2);
        g.restore();
      } else {
        const u = E.inOutSine(clamp(t / D)), s = lerp(1, zoom, u);
        g.scale(s, s); g.rotate(lerp(-0.01, 0.01, u));
        g.save(); g.shadowColor = 'rgba(20,35,61,0.28)'; g.shadowBlur = 40 * k.S; g.shadowOffsetY = 26 * k.S; g.drawImage(im, -ww / 2, -wh / 2, ww, wh); g.restore();
      }
      g.restore();
      // caption slab + credit
      k.view(1);
      const kc = range(t, 0.55, 1.2);
      if (caption && kc > 0) {
        const size = 34, maxW = portrait && !cutout ? 640 : 1000, lines = G.wrap(g, caption, maxW, size, 700);
        const bw = Math.max(...lines.map(l => G.measure(g, l, size, 700))) + 56, bh = lines.length * size * 1.25 + 34;
        const bx = portrait && !cutout ? cx + ww / 2 + mat + 70 : cx - ww / 2 - mat + 40, by = portrait && !cutout ? cy - bh / 2 + 40 : Math.min(cy + wh / 2 + mat - bh * 0.45, 1080 - bh - 120);
        const wk = E.emphasized(kc);
        g.save(); g.beginPath(); g.rect(bx - 30, by - 30, (bw + 60) * wk, bh + 60); g.clip();
        G.shadow(g, 1.1); G.rr(g, bx, by, bw, bh, 8); g.fillStyle = P.ink; g.fill(); G.noShadow(g);
        g.fillStyle = P.teal; g.fillRect(bx, by + 14, 6, bh - 28);
        lines.forEach((l, i) => G.text(g, l, bx + 30, by + 17 + size * 0.92 + i * size * 1.25, { size, weight: 700, color: P.white }));
        g.restore();
        if (Pm.kicker) G.kicker(g, Pm.kicker, bx, by - 34, range(t, 0.4, 1.0));
        if (credit) {
          const cl = G.wrap(g, credit.toUpperCase(), portrait && !cutout ? 700 : 1400, 17, 500, F.mono);
          cl.forEach((l, i) => G.text(g, l, bx + 4, by + bh + 38 + i * 25, { size: 17, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.06, alpha: E.outCubic(range(t, 1.0, 1.6)) }));
        }
      } else if (credit) G.source(g, credit, range(t, 1.0, 1.6), { size: 15 });
    }, { push: 0.03, dx: 18, dy: 6 });
  }

  return { doc, photo };
}
