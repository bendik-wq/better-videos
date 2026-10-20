// Silver document and archive sets (episode 7).
//   doc    typographic RECREATIONS of documents (never facsimiles): every sheet says on screen that it is recreated
//          and from what. params.doc:
//     'rule7'        Comex emergency Silver Rule 7, effective Mon 7 Jan 1980 (summary)   keys: title date limit ounces retro spot
//     'liquidation'  Comex "liquidation only", Mon 21 Jan 1980 (summary)                 keys: date stamp new close cbt
//     'tiffany'      the Tiffany & Co. newspaper ad, text as quoted by Time (7 Apr 1980) keys: unconscionable billion spoons
//     'cftc'         CFTC memo of the 8 Jan 1980 meeting with Bunker Hunt (excerpts)     keys: objective shut date
//     'fed'          Special Credit Restraint Program, 14 Mar 1980 (Dallas Fed 80-49)     keys: speculative title date
//     'verdict'      Minpeco v. Hunt, 20 Aug 1988: $66.2M ×3 = $198.6M − $64.6M = $133.95M  keys: damages treble settle net liable case date civil
//     'bankruptcy'   Sep 1988 Chapter 11: the inventory as reported by Time               keys: chapter hawaii vail cadillacs mercedes coins bond
//     'testimony'    sworn testimony card, W. Herbert Hunt, 2 May 1980                     keys: corner rest
//          other params: highlight (key or [keys]), at (cue or [cues] per highlight), zoom, tilt, label (false hides), source
//   photo  an archival photo in a white border card on paper with an eased Ken Burns push, caption slab and credit line.
//          params: file (in projects/silver/assets/photos/), caption, credit, focus [x, y] 0..1, zoom, kicker, cutout
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
const INK = '#17181c', OLD = '#1d1a14';
const DOCS = {
  rule7: {
    w: 612, h: 640, paper: '#fbfaf5', ink: INK, def: ['limit', 'retro'], tilt: -0.8,
    blocks: [
      ['t', 72, 'COMMODITY EXCHANGE, INC. · NEW YORK', { align: 'c', size: 13, fam: F.narrow, weight: 700, track: 0.14 }],
      ['rule', 86, { double: true }],
      ['t', 128, 'EMERGENCY ACTION OF THE BOARD', { align: 'c', size: 12, fam: F.narrow, weight: 700, track: 0.3, color: '#55524b' }],
      ['t', 180, 'SILVER RULE 7', { align: 'c', size: 44, weight: 900, track: 0.01, key: 'title' }],
      ['t', 208, 'POSITION LIMITS IN SILVER FUTURES', { align: 'c', size: 13, fam: F.narrow, weight: 700, track: 0.16 }],
      ['rule', 234, {}],
      ['row', 276, 'Effective', 'Monday, January 7, 1980', { key: 'date' }],
      ['row', 318, 'Position limit, per trader', '2,000 contracts', { key: 'limit', bold: true }],
      ['row', 360, 'Equivalent to', '10,000,000 troy oz', { key: 'ounces' }],
      ['row', 402, 'One contract', '5,000 troy oz', {}],
      ['row', 444, 'Applies to', 'positions already held', { key: 'retro', bold: true }],
      ['row', 486, 'Spot silver that day', '$35.80 an ounce', { key: 'spot' }],
      ['rule', 516, {}],
      ['p', 548, 'Recreated summary of the rule as described in the SEC staff report, The Silver Crisis of 1980 (1982), p. 65, and the CFTC (Federal Register, 2013). Not the original text.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATION · SEC STAFF REPORT (1982) P. 65', src: 'SOURCES: SEC STAFF REPORT, THE SILVER CRISIS OF 1980 (1982) P. 65; CFTC, FEDERAL REGISTER (12 DEC 2013)',
  },
  liquidation: {
    w: 612, h: 600, paper: '#fbfaf5', ink: INK, def: ['stamp', 'new'], tilt: 0.9,
    blocks: [
      ['t', 72, 'COMMODITY EXCHANGE, INC. · NEW YORK', { align: 'c', size: 13, fam: F.narrow, weight: 700, track: 0.14 }],
      ['rule', 86, { double: true }],
      ['t', 128, 'NOTICE · SILVER FUTURES', { align: 'c', size: 12, fam: F.narrow, weight: 700, track: 0.3, color: '#55524b' }],
      ['t', 160, 'Monday, January 21, 1980', { align: 'c', size: 15, fam: F.serif, style: 'italic', key: 'date' }],
      ['box', 106, 192, 400, 92, { lw: 4, r: 6, text: 'LIQUIDATION ONLY', size: 40, key: 'stamp' }],
      ['row', 340, 'New positions', 'not accepted', { key: 'new', bold: true }],
      ['row', 382, 'Existing positions', 'may only be closed out', { key: 'close' }],
      ['row', 424, 'Tuesday, January 22', 'Chicago Board of Trade follows', { key: 'cbt' }],
      ['rule', 456, {}],
      ['p', 488, 'Recreated summary of the exchange actions as described in the SEC staff report, The Silver Crisis of 1980 (1982), p. 35. Not the original text.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATION · SEC STAFF REPORT (1982) P. 35', src: 'SOURCE: SEC STAFF REPORT, THE SILVER CRISIS OF 1980 (1982) P. 35',
  },
  tiffany: {
    w: 612, h: 860, paper: '#f2eee3', ink: '#141414', def: ['unconscionable', 'billion'], tilt: 0.6, news: true,
    blocks: [
      ['rule', 54, { w: 2.4 }],
      ['t', 150, '“', { x: 70, size: 84, fam: F.serif, color: '#141414' }],
      ['p', 196, 'We think it is unconscionable for anyone to hoard several billion, yes billion, dollars worth of silver and thus drive the price up so high that others must pay artificially high prices for articles made of silver from baby spoons to tea sets, as well as photographic film and other products.”', { x: 76, w: 460, size: 31, lh: 39, fam: F.serif, marks: { unconscionable: 'unconscionable', billion: 'several billion, yes billion,', spoons: 'from baby spoons to tea sets,' } }],
      ['rule', 724, { x0: 236, x1: 376, w: 1.2 }],
      ['t', 782, 'TIFFANY & CO.', { align: 'c', size: 34, fam: F.serif, track: 0.22, key: 'name' }],
      ['rule', 810, { w: 2.4 }],
    ],
    label: 'TEXT AS QUOTED BY TIME, 7 APR 1980 · RECREATION, NOT THE ORIGINAL AD', src: 'SOURCE: TIME, “HE HAS A PASSION FOR SILVER”, 7 APR 1980 (TIFFANY & CO. AD, NYT, MARCH 1980)',
  },
  cftc: {
    w: 612, h: 600, paper: '#f6f3ea', ink: OLD, def: ['objective', 'shut'], tilt: -1.1, typed: true,
    blocks: [
      ['t', 66, 'COMMODITY FUTURES TRADING COMMISSION', { align: 'c', size: 11.5, fam: F.mono, track: 0.12 }],
      ['t', 104, 'M E M O R A N D U M', { align: 'c', size: 17, fam: F.mono, weight: 500, track: 0.1 }],
      ['row', 150, 'DATE:', 'January 8, 1980', { vx: 170, fam: F.mono, key: 'date', lead: false }],
      ['row', 172, 'SUBJECT:', 'Meeting with Nelson Bunker Hunt', { vx: 170, fam: F.mono, lead: false }],
      ['row', 194, 'TIME:', '3:00 p.m.', { vx: 170, fam: F.mono, lead: false }],
      ['row', 216, 'PLACE:', 'Office of Commissioner Dunn', { vx: 170, fam: F.mono, lead: false }],
      ['rule', 238, { color: 'rgba(29,26,20,0.5)' }],
      ['p', 280, '… [Mr. Hunt] asked whether CFTC’s objective was to raise, lower, or stabilize silver prices …', { x: 72, w: 468, size: 13, lh: 24, fam: F.mono, marks: { objective: 'raise, lower, or stabilize silver prices' } }],
      ['p', 376, '… [and] whether CFTC was considering action to shut down the silver market. …', { x: 72, w: 468, size: 13, lh: 24, fam: F.mono, marks: { shut: 'shut down the silver market.' } }],
      ['p', 520, 'Recreated text: excerpts as quoted from the CFTC memorandum in the House hearing record (1980). Brackets and ellipses are ours.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATED TEXT · CFTC MEMO, 8 JAN 1980', src: 'SOURCE: CFTC MEMORANDUM, 8 JAN 1980, IN HOUSE HEARINGS “SILVER PRICES AND THE ADEQUACY OF FEDERAL ACTIONS…” (1980)',
  },
  fed: {
    w: 612, h: 560, paper: '#fbfaf6', ink: INK, def: ['speculative'], tilt: 0.8,
    blocks: [
      ['t', 70, 'FEDERAL RESERVE BANK OF DALLAS', { align: 'c', size: 15, fam: F.serif, track: 0.12 }],
      ['t', 90, 'Circular No. 80-49 · March 15, 1980', { align: 'c', size: 11, fam: F.serif, style: 'italic' }],
      ['rule', 106, { double: true }],
      ['t', 156, 'SPECIAL CREDIT RESTRAINT PROGRAM', { align: 'c', size: 18, weight: 800, track: 0.05, key: 'title' }],
      ['t', 180, 'Announced Friday, March 14, 1980', { align: 'c', size: 12, fam: F.serif, style: 'italic', key: 'date' }],
      ['p', 240, '[Lenders should avoid] “… financing for purely speculative holdings of commodities or precious metals or extraordinary inventory accumulation …”', { x: 82, w: 448, size: 19, lh: 30, fam: F.serif, marks: { speculative: 'purely speculative holdings of commodities or precious metals' } }],
      ['rule', 420, {}],
      ['p', 450, 'Recreated text. The quoted phrase is from Federal Reserve Bank of Dallas Circular No. 80-49; brackets and ellipses are ours.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATED TEXT · FED. RESERVE BANK OF DALLAS CIRCULAR 80-49', src: 'SOURCE: FEDERAL RESERVE BANK OF DALLAS, CIRCULAR NO. 80-49 (15 MAR 1980), SPECIAL CREDIT RESTRAINT PROGRAM',
  },
  verdict: {
    w: 612, h: 640, paper: '#fbfaf6', ink: INK, def: ['damages', 'treble', 'settle', 'net'], tilt: -0.7,
    blocks: [
      ['t', 66, 'UNITED STATES DISTRICT COURT', { align: 'c', size: 15, fam: F.serif, track: 0.12 }],
      ['t', 86, 'SOUTHERN DISTRICT OF NEW YORK', { align: 'c', size: 10.5, fam: F.serif, track: 0.14 }],
      ['rule', 102, { double: true }],
      ['t', 150, 'Minpeco, S.A. v. Hunt et al.', { align: 'c', size: 26, fam: F.serif, style: 'italic', key: 'case' }],
      ['t', 176, 'JURY VERDICT · SATURDAY, AUGUST 20, 1988', { align: 'c', size: 10.5, fam: F.narrow, weight: 700, track: 0.16, key: 'date' }],
      ['box', 238, 196, 136, 26, { lw: 1.6, r: 13, text: 'CIVIL CASE', size: 11, fam: F.mono, track: 0.18, key: 'civil' }],
      ['row', 270, 'Damages found by the jury', '$66.2M', { key: 'damages', fam: F.mono, size: 15 }],
      ['row', 310, '× 3, trebled (antitrust, RICO, fraud)', '$198.6M', { key: 'treble', fam: F.mono, size: 15 }],
      ['row', 350, '− earlier settlements', '−$64.6M', { key: 'settle', fam: F.mono, size: 15 }],
      ['rule', 370, { x0: 380, x1: 540 }],
      ['row', 404, 'Net judgment', '$133.95M', { key: 'net', fam: F.mono, size: 20, bold: true }],
      ['p', 456, 'Found liable: N. Bunker Hunt, W. Herbert Hunt, Lamar Hunt, Mahmoud Fustok and International Metals Investment Co.', { x: 72, w: 468, size: 13, lh: 19, fam: F.serif, marks: { liable: 'Found liable:' } }],
      ['rule', 516, {}],
      ['p', 546, 'Recreated summary. Figures as reported by the Los Angeles Times / Washington Post, 24 Aug 1988. A civil case: nobody was convicted of a crime.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATED SUMMARY · LA TIMES / WASHINGTON POST, 24 AUG 1988', src: 'SOURCE: LOS ANGELES TIMES (FROM THE WASHINGTON POST), 24 AUG 1988 · MINPECO, S.A. V. HUNT (S.D.N.Y. 1988)',
  },
  bankruptcy: {
    w: 612, h: 640, paper: '#fbfaf6', ink: INK, def: ['cadillacs', 'mercedes', 'coins'], tilt: 0.7,
    blocks: [
      ['t', 66, 'UNITED STATES BANKRUPTCY COURT', { align: 'c', size: 15, fam: F.serif, track: 0.12 }],
      ['t', 86, 'DALLAS, TEXAS · SEPTEMBER 1988', { align: 'c', size: 10.5, fam: F.serif, track: 0.14 }],
      ['rule', 102, { double: true }],
      ['t', 150, 'CHAPTER 11', { align: 'c', size: 34, weight: 900, track: 0.04, key: 'chapter' }],
      ['t', 176, 'N. Bunker Hunt · W. Herbert Hunt', { align: 'c', size: 16, fam: F.serif, style: 'italic' }],
      ['t', 230, 'Among the assets listed:', { x: 72, size: 13, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['row', 270, '1.', 'Hawaiian real estate', { vx: 100, key: 'hawaii', lead: false, size: 15 }],
      ['row', 306, '2.', 'Half interest in a Vail, Colo., ski lodge', { vx: 100, key: 'vail', lead: false, size: 15 }],
      ['row', 342, '3.', 'Two Cadillacs', { vx: 100, key: 'cadillacs', lead: false, size: 15 }],
      ['row', 378, '4.', 'A Mercedes-Benz', { vx: 100, key: 'mercedes', lead: false, size: 15 }],
      ['row', 414, '5.', 'A 13,649-piece Byzantine coin collection', { vx: 100, key: 'coins', lead: false, size: 15, bold: true }],
      ['p', 470, 'Filed partly to avoid posting a $225 million appeal bond.', { x: 72, w: 468, size: 13, lh: 19, fam: F.serif, marks: { bond: '$225 million appeal bond.' } }],
      ['rule', 506, {}],
      ['p', 536, 'Recreated summary. The list as reported by Time, “Billionaire Bankrupts”, 3 Oct 1988. Not the court filing.', { size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATED SUMMARY · TIME, 3 OCT 1988', src: 'SOURCES: TIME, “BILLIONAIRE BANKRUPTS”, 3 OCT 1988; LOS ANGELES TIMES, 23 SEP 1988',
  },
  testimony: {
    w: 780, h: 470, paper: '#fdfcf7', ink: INK, def: ['corner'], tilt: -0.9, card: true,
    blocks: [
      ['t', 52, 'SWORN TESTIMONY', { x: 48, size: 13, fam: F.mono, weight: 500, track: 0.3 }],
      ['t', 52, 'FRIDAY, MAY 2, 1980', { align: 'r', x: 732, size: 11, fam: F.mono, track: 0.14, key: 'date' }],
      ['rule', 70, { x0: 48, x1: 732, w: 2, color: '#2a8c86' }],
      ['t', 112, 'W. HERBERT HUNT', { x: 48, size: 22, weight: 800, track: 0.02 }],
      ['t', 134, 'before the House Commerce, Consumer and Monetary Affairs Subcommittee', { x: 48, size: 12, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['p', 196, '“At no time did I attempt to corner, squeeze, or manipulate the silver market.”', { x: 48, w: 680, size: 33, lh: 42, fam: F.serif, marks: { corner: 'corner, squeeze, or manipulate' } }],
      ['p', 308, '“At no time did I participate in an agreement to corner, squeeze, or manipulate the silver market. At no time did I attempt or agree with others to manipulate the silver market.”', { x: 48, w: 680, size: 15, lh: 22, fam: F.serif, color: '#4a4a52', marks: { rest: 'At no time did I attempt or agree with others' } }],
      ['p', 410, 'Recreated text from the hearing record, Silver Prices and the Adequacy of Federal Actions in the Marketplace, 1979–80, p. 281.', { x: 48, w: 680, size: 8.5, style: 'italic', fam: F.serif, color: '#6d6a62', lh: 12 }],
    ],
    label: 'RECREATED TEXT · HOUSE HEARING RECORD, 2 MAY 1980', src: 'SOURCE: HOUSE SUBCOMMITTEE HEARINGS, SILVER PRICES AND THE ADEQUACY OF FEDERAL ACTIONS IN THE MARKETPLACE, 1979–80, P. 281',
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
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, Dc = DOCS[Pm.doc ?? 'rule7'] ?? DOCS.rule7;
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
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, file = Pm.file ?? 'loc_comex_floor_1978_a.jpg';
    const im = await G.image(`/projects/silver/assets/photos/${file}`);
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
