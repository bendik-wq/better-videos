// Mortgage document sets: clean recreations of primary documents as paper on a ledger desk, with a red marker loop.
//   doc   params.doc:
//     'result'    TREASURY AUCTION RESULTS, 7 Oct 2026 (every field from the TreasuryDirect PDF, assets/docs/
//                 treasury-10y-result-2026-10-07.pdf). highlight: 'high-yield' | 'allotted' | 'coupon' | 'price' |
//                 'median' | 'low' | 'subtotal' | 'dealer' | 'direct' | 'indirect' | 'bid-to-cover' | 'competitive'
//     'offering'  TREASURY OFFERING ANNOUNCEMENT, 1 Oct 2026 (treasury-10y-offering-2026-10-01.pdf). highlight:
//                 'offering' | 'closing' | 'noncomp-closing' | 'max-award' | 'noncomp' | 'increments' | 'coupon'
//     '1929'      "Public Notice of Offering of Treasury Bills", NY Fed Circular No. 949, 10 Dec 1929: a RECREATION set
//                 only from the verbatim fragments in RESEARCH §9a (labelled RECREATION on screen). highlight:
//                 'amount' | 'deadline' | 'discount' | 'title' | 'minimum'
//   other params: highlight (key or [keys]), at (cue or [cues] for each loop), zoom (px per pt at the end, ~2.6),
//                 label (false hides the recreation label), source
// The documents are drawn in PDF points (612 x 792, US letter) and framed by a slow camera that ends on the highlight.
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU, rng } = G;

// ---------------------------------------------------------------- the documents (pt coordinates)
// rows: [y, left, right, opts]; opts: { b: bold, c: centre, x: left x, r: right x, size, sup, key, cols: [[x, text, align]] }
const RESULT = {
  paper: '#ffffff', ink: '#111111', font: F.sans, size: 9.6,
  rows: [
    [52, 'For Immediate Release', 'CONTACT: Treasury Auctions'], [64, 'October 07, 2026', '202-504-3550'],
    [100, 'TREASURY AUCTION RESULTS', null, { c: true, b: true, size: 11 }],
    [124, 'Term and Type of Security', '9-Year 10-Month Note', { x: 112 }], [136, 'CUSIP Number', '91282CRF0', { x: 112 }], [148, 'Series', 'E-2036', { x: 112 }],
    [170, 'Interest Rate', '4-5/8%', { x: 112, key: 'coupon' }], [182, 'High Yield ¹', '5.300%', { x: 112, key: 'high-yield' }], [194, 'Allotted at High', '57.60%', { x: 112, key: 'allotted' }],
    [206, 'Price', '94.864261', { x: 112, key: 'price' }], [218, 'Accrued Interest per $1,000', '$7.66644', { x: 112 }],
    [240, 'Median Yield ²', '5.255%', { x: 112, key: 'median' }], [252, 'Low Yield ³', '4.300%', { x: 112, key: 'low' }],
    [274, 'Issue Date', 'October 15, 2026', { x: 112 }], [286, 'Maturity Date', 'August 15, 2036', { x: 112 }], [298, 'Original Issue Date', 'August 17, 2026', { x: 112 }], [310, 'Dated Date', 'August 15, 2026', { x: 112 }],
    [338, null, null, { cols: [[380, 'Tendered', 'right'], [540, 'Accepted', 'right']] }],
    [352, 'Competitive', null, { cols: [[380, '$107,734,406,000', 'right'], [540, '$38,665,438,000', 'right']], key: 'competitive' }],
    [364, 'Noncompetitive', null, { cols: [[380, '$334,593,700', 'right'], [540, '$334,593,700', 'right']] }],
    [376, 'FIMA (Noncompetitive)', null, { cols: [[380, '$0', 'right'], [540, '$0', 'right']] }],
    [388, 'Subtotal ⁴', null, { cols: [[380, '$108,068,999,700', 'right'], [540, '$39,000,031,700 ⁵', 'right']], key: 'subtotal' }],
    [410, 'SOMA', null, { cols: [[380, '$926,290,200', 'right'], [540, '$926,290,200', 'right']] }],
    [432, 'Total', null, { cols: [[380, '$108,995,289,900', 'right'], [540, '$39,926,321,900', 'right']] }],
    [462, null, null, { cols: [[380, 'Tendered', 'right'], [540, 'Accepted', 'right']] }],
    [476, 'Primary Dealer ⁶', null, { cols: [[380, '$52,876,000,000', 'right'], [540, '$984,000,000', 'right']], key: 'dealer' }],
    [488, 'Direct Bidder ⁶', null, { cols: [[380, '$14,852,200,000', 'right'], [540, '$6,618,200,000', 'right']], key: 'direct' }],
    [500, 'Indirect Bidder ⁶', null, { cols: [[380, '$40,006,206,000', 'right'], [540, '$31,063,238,000', 'right']], key: 'indirect' }],
    [512, 'Total Competitive', null, { cols: [[380, '$107,734,406,000', 'right'], [540, '$38,665,438,000', 'right']] }],
    [660, '¹ All tenders at lower yields were accepted in full.', null, { size: 7.6 }],
    [672, '² 50% of the amount of accepted competitive tenders was tendered at or below that yield.', null, { size: 7.6 }],
    [684, '³ 5% of the amount of accepted competitive tenders was tendered at or below that yield.', null, { size: 7.6 }],
    [696, '⁴ Bid-to-Cover Ratio: $108,068,999,700/$39,000,031,700 = 2.77', null, { size: 7.6, key: 'bid-to-cover', mark: '2.77' }],
    [708, '⁵ Awards to Treasury Retail = $88,776,700.', null, { size: 7.6 }],
    [720, '⁶ For descriptions of these terms, see the Auction FAQs available at https://www.treasurydirect.gov/help-center/faqs/auction-faqs/.', null, { size: 7.6 }],
  ],
  // highlight boxes (pt): computed from the row with that key unless overridden here
  box: {},
  label: 'RECREATED FROM THE TREASURYDIRECT RESULTS PDF', src: 'SOURCE: TREASURY AUCTION RESULTS, 7 OCT 2026 (TREASURYDIRECT)', date: 'WED 7 OCT 2026',
};
const OFFERING = {
  paper: '#ffffff', ink: '#111111', font: F.sans, size: 9.2,
  rows: [
    [52, 'Embargoed Until 11:00 A.M.', 'CONTACT: Treasury Auctions'], [64, 'October 01, 2026', '202-504-3550'],
    [96, 'TREASURY OFFERING ANNOUNCEMENT ¹', null, { c: true, b: true, size: 11 }],
    [118, 'Term and Type of Security', '9-Year 10-Month 4-5/8% Note', { key: 'coupon' }], [129, '', '(Reopening)'],
    [141, 'Offering Amount', '$39,000,000,000', { key: 'offering' }], [153, 'Currently Outstanding', '$91,623,000,000'], [165, 'CUSIP Number', '91282CRF0'],
    [177, 'Auction Date', 'October 07, 2026'], [189, 'Original Issue Date', 'August 17, 2026'], [201, 'Issue Date', 'October 15, 2026'], [213, 'Maturity Date', 'August 15, 2036'],
    [225, 'Dated Date', 'August 15, 2026'], [237, 'Series', 'E-2036'], [249, 'Yield', 'Determined at Auction'], [261, 'Interest Rate', '4-5/8%'],
    [273, 'Interest Payment Dates', 'February 15 and August 15'], [285, 'Accrued Interest from 08/15/2026 to 10/15/2026', '$ 7.66644 Per $1,000'], [297, 'Premium or Discount', 'Determined at Auction'],
    [319, 'Maximum Award', '$13,650,000,000', { key: 'max-award' }], [331, 'Maximum Recognized Bid at a Single Yield', '$13,650,000,000'], [343, 'NLP Reporting Threshold', '$13,650,000,000'], [355, 'NLP Exclusion Amount', '$28,400,000,000'],
    [367, 'Minimum Bid Amount and Multiples', '$100'], [379, 'Competitive Bid Yield Increments ²', '0.001%', { key: 'increments' }], [391, 'Maximum Noncompetitive Award', '$10,000,000', { key: 'noncomp' }],
    [403, 'Eligible for Holding by Treasury Retail', 'Yes'],
    [425, 'Estimated Amount of Maturing Coupon Securities Held by the Public ⁴', '$86,437,000,000'], [437, 'Maturing Date', 'October 15, 2026'], [449, 'SOMA Holdings Maturing ⁵', '$2,826,000,000'],
    [461, 'SOMA Amounts Included in Offering Amount', 'No'], [473, 'FIMA Amounts Included in Offering Amount ³', 'Yes'],
    [497, 'Noncompetitive Closing Time', '12:00 Noon ET', { key: 'noncomp-closing' }], [509, 'Competitive Closing Time', '1:00 p.m. ET', { key: 'closing' }],
    [650, '¹ Governed by the Terms and Conditions set forth in The Uniform Offering Circular for the Sale and Issue of Marketable Book-Entry Treasury Bills, Notes, and Bonds', null, { size: 7.2 }],
    [661, '(31 CFR Part 356, as amended), and this offering announcement.', null, { size: 7.2 }],
    [673, '² Must be expressed as a yield with three decimals e.g., 7.123%.', null, { size: 7.2 }],
    [685, '³ FIMA up to $2,000 million in noncompetitive bids from Foreign and International Monetary Authority not to exceed $500 million per account.', null, { size: 7.2 }],
  ],
  box: {}, label: 'RECREATED FROM THE TREASURYDIRECT OFFERING PDF', src: 'SOURCE: TREASURY OFFERING ANNOUNCEMENT, 1 OCT 2026 (TREASURYDIRECT)', date: 'THU 1 OCT 2026',
};
// 1929: only verbatim fragments from RESEARCH §9a (S44); ellipses mark everything we did not read word for word
const N1929 = {
  paper: '#f4ecd6', ink: '#2a2418', font: F.serif, size: 13, old: true,
  rows: [
    [70, 'FEDERAL RESERVE BANK OF NEW YORK', null, { c: true, size: 13, track: 0.12 }],
    [92, 'Circular No. 949 · December 10, 1929', null, { c: true, size: 11, i: true }],
    [160, 'Public Notice of Offering of Treasury Bills', null, { c: true, size: 18, i: true, key: 'title' }],
    [214, '$100,000,000 (or thereabouts)', null, { c: true, size: 22, key: 'amount' }],
    [262, '… The bills … will be sold on a discount basis to', null, { x: 92 }], [280, 'the highest bidders. …', null, { x: 92, key: 'discount' }],
    [318, '… Tenders … up to two o’clock P. M., Eastern Standard', null, { x: 92 }], [336, 'time, on Friday, December 13, 1929. …', null, { x: 92, key: 'deadline', mark: 'Friday, December 13, 1929.' }],
    [354, 'Tenders will not be received at the Treasury', null, { x: 92 }], [372, 'Department, Washington. …', null, { x: 92 }],
    [410, 'No tender for an amount less than $10,000 will be', null, { x: 92 }], [428, 'considered. …', null, { x: 92, key: 'minimum' }],
    [446, '… e. g., 99.125. Fractions must not be used. …', null, { x: 92 }],
    [484, '… bearer form only …', null, { x: 92 }],
  ],
  box: {},
  label: 'RECREATION · EXCERPTS FROM NY FED CIRCULAR NO. 949', src: 'SOURCE: FEDERAL RESERVE BANK OF NEW YORK, CIRCULAR NO. 949, 10 DEC 1929 (FRASER) · RECREATION', date: '10 DEC 1929',
};
const DOCS = { result: RESULT, offering: OFFERING, 1929: N1929, '1929': N1929 };

function drawDoc(g, D) {
  const W = 612, Hh = 792;
  // the sheet
  g.save(); G.shadow(g, 1.6); g.fillStyle = D.paper; g.fillRect(0, 0, W, Hh); G.noShadow(g);
  if (D.old) { // foxing and a fold
    const r = rng(29); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(150,110,50,${0.03 + r() * 0.05})`; g.beginPath(); g.arc(r() * W, r() * Hh, 4 + r() * 22, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(120,90,40,0.10)'; g.fillRect(0, Hh * 0.5 - 1, W, 2);
  }
  G.grain(g, W, Hh, D.old ? 0.55 : 0.18, 0, 0);
  g.restore();
  const sz = D.size;
  for (const [y, a, b, o = {}] of D.rows) {
    const size = o.size ?? sz, weight = o.b ? 700 : D.old ? 400 : 500, style = o.i ? 'italic' : '';
    const T = (s, x, align = 'left') => G.text(g, s, x, y, { size, weight, fam: D.font, style, color: D.ink, align, track: o.track ?? 0 });
    if (a != null) { if (o.c) T(a, W / 2, 'center'); else if (o.r) T(a, o.r, 'right'); else T(a, o.x ?? 72); }
    if (b != null) T(b, o.r ?? 540, 'right');
    if (o.cols) for (const [x, s, al] of o.cols) T(s, x, al);
  }
}
// a highlight: the row band (label to value) and the value box the marker loops around (pt)
function boxOf(g, D, key) {
  const row = D.rows.find(r => r[3]?.key === key), ov = D.box[key];
  if (!row && !ov) return null;
  const [y, a, b, o = {}] = row ?? [0, '', '', {}], size = o.size ?? D.size, weight = o.b ? 700 : D.old ? 400 : 500;
  const w = (s) => G.measure(g, s, size * 10, weight, D.font, o.track ?? 0, o.i ? 'italic' : '') / 10; // measured large: small sizes round their advances
  let val;
  if (o.mark && a && a.includes(o.mark)) { const x = (o.x ?? 72) + w(a.slice(0, a.indexOf(o.mark))); val = [x, y - size * 0.95, x + w(o.mark), y + size * 0.3]; }
  else if (o.cols) { const [x, s] = o.cols.at(-1); val = [x - w(s), y - size * 0.95, x, y + size * 0.3]; }
  else if (b) { const x = o.r ?? 540; val = [x - w(b), y - size * 0.95, x, y + size * 0.3]; }
  else if (o.c) { const ww = w(a); val = [306 - ww / 2, y - size * 0.95, 306 + ww / 2, y + size * 0.3]; }
  else { const x = o.x ?? 72; val = [x, y - size * 0.95, x + w(a), y + size * 0.3]; }
  if (ov) val = ov;
  const end = o.cols || b ? 540 : o.c ? val[2] : (o.x ?? 72) + w(a ?? '');
  const band = [Math.min(o.c ? val[0] : (o.x ?? 72), val[0]) - 4, val[1] - 2, Math.max(val[2], end) + 4, val[3] + 2];
  return { val, band, size };
}

export default function makeDocs(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };

  async function doc(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, Dc = DOCS[Pm.doc ?? 'result'] ?? RESULT;
    const keys = [].concat(Pm.highlight ?? (Dc === RESULT ? 'high-yield' : Dc === OFFERING ? 'closing' : 'amount')).filter(Boolean);
    const mg = G.mk(4, 4).getContext('2d'); await G.loadFonts();
    const HL = keys.map(k => boxOf(mg, Dc, k)).filter(Boolean), boxes = HL.map(h => h.val);
    const ats = [].concat(Pm.at ?? []), T = boxes.map((_, i) => G.cue(shot, ats[i], i === 0 ? Math.min(2.0, D * 0.32) : 0) || (Math.min(2.0, D * 0.32) + i * 1.6));
    const Z1 = Pm.zoom ?? (Dc.old ? 2.8 : 3.05), Z0 = Dc.old ? 1.9 : 2.0;
    const tilt = (Pm.tilt ?? (Dc.old ? 1.2 : -1.0)) * Math.PI / 180;
    // camera path: start on the upper page, glide to each highlight in turn
    const focusOf = (b) => [Dc.old ? 306 : 296, (b[1] + b[3]) / 2];
    const start = [306, Dc.old ? 200 : 170];
    return set(ctx, shot, (g, t, p, k) => {
      // where the page sits: focus point (pt) at screen centre, zoom Z
      let f = start, Z = Z0;
      if (boxes.length) {
        const zOf = (i) => Z1 * clamp(Dc.size / HL[i].size, 1, 1.12);
        const u0 = E.inOutCubic(range(t, 0.15, Math.max(0.9, T[0] - 0.1))); f = [lerp(start[0], focusOf(boxes[0])[0], u0), lerp(start[1], focusOf(boxes[0])[1], u0)]; Z = lerp(Z0, zOf(0), u0);
        for (let i = 1; i < boxes.length; i++) { const u = E.inOutCubic(range(t, T[i] - 1.0, T[i] - 0.1)); f = [lerp(f[0], focusOf(boxes[i])[0], u), lerp(f[1], focusOf(boxes[i])[1], u)]; Z = lerp(Z, zOf(i), u); }
      }
      // the desk: a ledger blotter, its own parallax
      k.view(0.35); g.fillStyle = P.desk; g.fillRect(-200, -200, 2320, 1480);
      G.ledgerLines(g, -200, -200, 2320, 1480, { step: 46, cols: [300, 700, 1100, 1500], color: 'rgba(29,106,102,0.12)', colColor: 'rgba(29,106,102,0.10)' }); G.grain(g, 2320, 1480, 0.4, -200, -200);
      const px = (depth) => { g.save(); k.view(depth); g.translate(960, 560); g.scale(Z, Z); g.rotate(tilt); g.translate(-f[0], -f[1]); };
      // an older sheet underneath (the offering, or a blank), a little lower and rotated
      px(0.8); g.translate(40, 30); g.rotate(-0.035); g.globalAlpha = 0.95; G.shadow(g, 1.2); g.fillStyle = Dc.old ? '#efe5ca' : '#f6f7f4'; g.fillRect(0, 0, 612, 792); G.noShadow(g); g.restore();
      // the document
      px(1); drawDoc(g, Dc);
      // red marker loops
      HL.forEach((h, i) => {
        const kk = range(t, T[i], T[i] + 0.8); if (kk <= 0) return; const b = h.val, bd = h.band;
        g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(224,36,27,0.16)'; g.fillRect(bd[0], bd[1], (bd[2] - bd[0]) * E.emphasized(range(t, T[i] + 0.3, T[i] + 0.9)), bd[3] - bd[1]); g.restore();
        G.markerLoop(g, b[0], b[1], b[2] - b[0], b[3] - b[1], E.outCubic(kk), { width: 2.2, seed: 5 + i * 3, padX: 4.5, padY: 4.5 });
      });
      g.restore();
      // labels float above the paper
      k.flat();
      if (Pm.label !== false) G.pill(g, `${Dc.label} · ${Dc.date}`, 80, 84, { size: 22, k: range(t, 0.3, 0.8), fam: F.mono, weight: 500, fill: P.ink, color: P.white, dot: Dc.old ? P.red : P.teal });
      G.source(g, Pm.source ?? Dc.src, range(t, 0.6, 1.4));
    }, { push: 0.03, dx: 30, dy: 10 });
  }

  return { doc };
}
