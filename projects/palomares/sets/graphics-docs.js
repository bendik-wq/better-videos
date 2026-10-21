// Palomares document and archive sets (episode 9).
//   doc    typographic RECREATIONS (never facsimiles): every sheet says on screen that it is recreated and from what;
//          quoted phrases are verbatim from RESEARCH.md, everything else is a labelled summary. params.doc:
//     'dna1975'        DNA Palomares Summary Report, 15 Jan 1975, p.94: found 2,550 ft / 70° / contact #261; one line severed;
//                      re-found 120 yd on 210°T at 2,800 ft; "much anxiety… 8 days"   keys: find slope contact severed refind yards anxiety
//     'navyreport'     US Navy, Aircraft Salvage Operation Mediterranean, Final Report (1967), quoted via Moran (report not
//                      seen): "…was improvised."; the Navy's own cost maths          keys: readiness improvised cost day
//     'alvinlog'       Alvin, Dive 128, 15 Mar 1966: a recreated dive SUMMARY card (not the log): crew, contact #261,
//                      2,550 ft, 70°, 10 h 23 min, 8:12 pm, "ALVIN reports INSTRUMENT PANEL."   keys: dive depth contact slope time code
//     'telegram'       Embassy Madrid to State, 22 Jan 1966 (FRUS XII doc 191): "…admitting officially one bomb still
//                      missing… utmost urgency…"                                   keys: missing urgency date
//     'cable2009'      State cable 129362, 14 Dec 2009 (Clinton–Moratinos, leaked): "…made no commitment."   keys: opinion commitment date
//     'nyt2016'        NYT, Dave Philipps, 19 Jun 2016 (a recreated clipping): 40 veterans / 21 cancer / 9 died; Thompson;
//                      Odland's "sleeping dog"                                      keys: headline cancer safe sleeping
//     'statement2015'  US–Spain statement of intent, 19 Oct 2015: the Spanish text as reported + Kerry's "once and for all"
//                                                                                   keys: title asap funds binding anytime once
//     'court2026'      the Spanish lawsuit, status AS OF 21 OCT 2026 (press reports): witnesses refused; the State's brief
//                      «Palomares nunca ha sido un accidente nuclear»; «pendiente de fallo»   keys: witnesses never competent pending
//          other params: highlight (key or [keys]), at (cue or [cues] per highlight), zoom, tilt, label (false hides), source
//   photo  a photo in a white border card on paper with an eased Ken Burns push, caption slab and credit line.
//          params: file (in projects/palomares/assets/photos/, or an absolute /projects/... path), caption, credit, focus [x, y] 0..1, zoom, kicker, cutout
//          Bundled (public domain, see assets/photos/CREDITS.md): petrel-bomb-curv-1966.jpg · petrel-bomb-officials-1966.jpg ·
//          petrel-bomb-chute-1966.jpg · alvin-1964.jpg · palomares-barrels-1966.jpg (+ uss-skill-feb1966.jpg, b52g-kc135a-refuel-1992.jpg when present)
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
// a document head: centred lines (y 62 …), then a rule. lines: [text, o]
const head = (lines, ruleY) => [...lines.map(([y, s, o]) => ['t', y, s, { align: 'c', ...o }]), ['rule', ruleY, { double: true }]];
const NARROW = { size: 11, fam: F.narrow, weight: 700, track: 0.3 };
const DOCS = {
  // S01 p.94 (✓). The OSTI copy is partial; these passages are the ones the fact-check read.
  dna1975: {
    w: 612, h: 650, paper: '#f8f5ec', ink: '#1d1b16', typed: true, def: ['find', 'severed', 'refind'], tilt: -0.6,
    blocks: [
      ...head([[64, 'DEFENSE NUCLEAR AGENCY', NARROW], [100, 'PALOMARES SUMMARY REPORT', { size: 20, weight: 600, track: 0.04, key: 'title' }], [124, '15 January 1975', { size: 11.5, color: '#55524b' }]], 142),
      ['t', 176, '[The search at sea, p. 94:]', { size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['p', 210, '“…on 15 March ALVIN successfully backed down the furrow to discover a parachute enshrouded object… at a depth of 2550 feet lying on a 70 degree slope. The object was designated contact #261.”', { size: 14, lh: 23, marks: { find: 'at a depth of 2550 feet', slope: 'lying on a 70 degree slope.', contact: 'designated contact #261.”' } }],
      ['p', 318, '“…an abortive attempt to raise contact #261 on one line that was severed in the attempt, dropping the object…”', { size: 14, lh: 23, marks: { severed: 'one line that was severed in the attempt, dropping the object…”' } }],
      ['p', 392, '“…on 2 April the object, still chute enshrouded, was located on a bearing of 210° T., a distance of 120 yards from its position on 15 March and now at a depth of 2800 feet.”', { size: 14, lh: 23, marks: { yards: 'a distance of 120 yards', refind: 'now at a depth of 2800 feet.”' } }],
      ['p', 504, '“…much anxiety for a period of 8 days…”', { size: 14, lh: 23, marks: { anxiety: '“…much anxiety for a period of 8 days…”' } }],
      ['rule', 546, {}],
      ['p', 572, 'Recreated text, not a facsimile. Passages are verbatim from the Defense Nuclear Agency’s Palomares Summary Report (15 Jan 1975), p. 94; ellipses mark our cuts. The State Department’s 1985 history counts the gap as 9 days.', NOTE],
    ],
    label: 'RECREATED TEXT · DNA PALOMARES SUMMARY REPORT, 1975', src: 'SOURCE: DEFENSE NUCLEAR AGENCY, PALOMARES SUMMARY REPORT (15 JAN 1975), P. 94 · OSTI OPENNET',
  },
  // S24 is not online: the quote is S40 (Moran) quoting the Navy's Final Report (⚑); the cost is the Navy's maths via S40 ch.17 (⚑)
  navyreport: {
    w: 612, h: 580, paper: '#f6f3ea', ink: '#1d1a14', typed: true, def: ['improvised', 'cost'], tilt: 0.8,
    blocks: [
      ...head([[64, 'DEPARTMENT OF THE NAVY', NARROW], [100, 'AIRCRAFT SALVAGE OPERATION', { size: 18, weight: 600, track: 0.04 }], [124, 'MEDITERRANEAN', { size: 18, weight: 600, track: 0.04 }], [148, 'Final Report · 1967', { size: 11.5, color: '#55524b' }]], 166),
      ['t', 200, '[Its own verdict, as quoted by Barbara Moran:]', { size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['p', 236, '“The Navy had achieved no interim readiness for search and recovery… The entire operation, from its initial inception to its termination, was improvised.”', { size: 15, lh: 24, marks: { readiness: 'no interim readiness for search and recovery…', improvised: 'was improvised.”' } }],
      ['t', 350, '[What it cost, by the Navy’s own maths:]', { size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['row', 384, 'Total', '$10,230,744', { key: 'cost', bold: true, size: 14 }],
      ['row', 414, 'Per day', '$126,305', { key: 'day', size: 14 }],
      ['row', 444, 'Billed to the Air Force', '$6.5 million', { size: 14 }],
      ['rule', 476, {}],
      ['p', 502, 'Recreated text. The Navy’s 1967 Final Report is not online and we have not seen it: the quotation and the cost figures are as given by Barbara Moran, The Day We Lost the H-Bomb (2009), citing it and the DNA report.', NOTE],
    ],
    label: 'RECREATED TEXT · US NAVY FINAL REPORT (1967), VIA B. MORAN', src: 'SOURCE: US NAVY, AIRCRAFT SALVOPS MED FINAL REPORT (1967), AS QUOTED IN B. MORAN (2009) · REPORT NOT SEEN',
  },
  // a dive SUMMARY card, explicitly not the log: depth/slope/contact S01 (✓); crew, times and the note S40 (⚑)
  alvinlog: {
    w: 560, h: 560, paper: '#fbfaf3', ink: '#1b2236', card: true, typed: true, def: ['depth', 'code'], tilt: -1.1,
    blocks: [
      ['t', 52, 'ALVIN · DIVE 128', { x: 40, size: 22, weight: 600, track: 0.04, key: 'dive' }],
      ['t', 52, '15 MAR 1966', { align: 'r', size: 14, key: 'date' }],
      ['rule', 72, { x0: 40, x1: 520 }],
      ['row', 112, 'Pilots', 'McCamis, Wilson', { size: 13.5 }],
      ['row', 138, 'Observer', 'Bartlett', { size: 13.5 }],
      ['row', 164, 'Target', 'contact #261', { key: 'contact', size: 13.5 }],
      ['row', 190, 'Depth', '2,550 ft', { key: 'depth', size: 15, bold: true }],
      ['row', 216, 'Slope', '70°', { key: 'slope', size: 13.5 }],
      ['row', 242, 'Time down', '10 h 23 min', { key: 'time', size: 13.5 }],
      ['row', 268, 'Back aboard', '8:12 pm · USS Fort Snelling', { size: 13.5 }],
      ['t', 318, '[The note handed to Adm. Guest:]', { x: 40, size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['box', 40, 336, 480, 54, { text: '“ALVIN reports INSTRUMENT PANEL.”', size: 17, fam: F.mono, track: 0.02, key: 'code' }],
      ['p', 432, 'Recreated summary card, NOT the dive log (we have not seen it). Depth, slope and contact number: DNA report (1975). Crew, times and the note (the find’s code word): Barbara Moran (2009).', { ...NOTE, x: 40, w: 480 }],
    ],
    label: 'RECREATED SUMMARY · ALVIN DIVE 128, 15 MAR 1966 · NOT THE LOG', src: 'SOURCES: DNA PALOMARES SUMMARY REPORT (1975), P. 94; B. MORAN, THE DAY WE LOST THE H-BOMB (2009)',
  },
  // S03 doc 191 (✓, FRUS): Duke's telegram of 22 Jan 1966
  telegram: {
    w: 612, h: 450, paper: '#f4f1e6', ink: '#202020', typed: true, def: ['missing', 'urgency'], tilt: 0.9,
    blocks: [
      ...head([[64, 'TELEGRAM', { size: 22, weight: 600, track: 0.3 }], [92, 'FROM THE EMBASSY IN SPAIN TO THE DEPARTMENT OF STATE', { size: 10.5, track: 0.08 }], [114, 'Madrid, January 22, 1966', { size: 11.5, color: '#55524b', key: 'date' }]], 132),
      ['t', 166, '[Ambassador Angier Biddle Duke, five days after the crash:]', { size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['p', 204, '“If much more time elapses without success in search, we may be faced with practical necessity admitting officially one bomb still missing… It therefore clearly of utmost urgency that no effort be spared locate fourth bomb.”', { size: 16, lh: 26, marks: { missing: 'admitting officially one bomb still missing…', urgency: 'utmost urgency that no effort be spared locate fourth bomb.”' } }],
      ['rule', 350, {}],
      ['p', 376, 'Recreated text, not a facsimile. The quotation is verbatim from Foreign Relations of the United States, 1964–68, vol. XII, document 191.', NOTE],
    ],
    label: 'RECREATED TEXT · EMBASSY MADRID TELEGRAM, 22 JAN 1966', src: 'SOURCE: FOREIGN RELATIONS OF THE UNITED STATES 1964–68, VOL. XII, DOC. 191 · HISTORY.STATE.GOV',
  },
  // S23 (✓ T1 leaked): STATE 129362, 14 Dec 2009
  cable2009: {
    w: 612, h: 480, paper: '#fbfaf6', ink: INK, typed: true, def: ['opinion', 'commitment'], tilt: -0.7,
    blocks: [
      ...head([[64, 'DEPARTMENT OF STATE CABLE', { size: 16, weight: 600, track: 0.2 }], [90, 'STATE 129362', { size: 12, track: 0.1 }], [112, 'December 14, 2009', { size: 11.5, color: '#55524b', key: 'date' }]], 130),
      ['t', 164, '[Spain’s foreign minister meets Secretary of State Clinton:]', { size: 11, color: '#55524b', fam: F.serif, style: 'italic' }],
      ['p', 200, '“Moratinos asked the Secretary for a real response — whatever you can do — to be helpful in terms of Spanish public opinion, which he feared could turn against the U.S. if news of the results of a recent study of the site’s nuclear contamination were to spread. The Secretary noted that she remembered the accident when it happened but made no commitment.”', { size: 14, lh: 23, marks: { opinion: 'to be helpful in terms of Spanish public opinion,', commitment: 'but made no commitment.”' } }],
      ['rule', 396, {}],
      ['p', 422, 'Recreated text, not a facsimile. The quotation is verbatim from the cable as published by WikiLeaks (2010).', NOTE],
    ],
    label: 'RECREATED TEXT · STATE DEPT CABLE, 14 DEC 2009 (LEAKED)', src: 'SOURCE: US STATE DEPT CABLE STATE 129362 (14 DEC 2009), VIA WIKILEAKS',
  },
  // S61 (T5, ⚑): "NYT reported" / "veterans say"; no causation
  nyt2016: {
    w: 612, h: 600, paper: '#f3efe3', ink: '#1a1a1a', news: true, def: ['cancer', 'sleeping'], tilt: 0.7,
    blocks: [
      ['t', 54, 'THE NEW YORK TIMES · 19 JUNE 2016', { align: 'c', size: 11, fam: F.narrow, weight: 700, track: 0.3, color: '#55524b' }],
      ['rule', 70, { double: true }],
      ['p', 110, 'Decades Later, Sickness Among Airmen After a Hydrogen Bomb Accident', { size: 30, lh: 34, fam: F.serif, marks: { headline: 'Decades Later, Sickness Among Airmen' } }],
      ['t', 196, 'By DAVE PHILIPPS', { size: 10.5, fam: F.narrow, weight: 700, track: 0.2, color: '#55524b' }],
      ['rule', 214, { w: 0.8 }],
      ['p', 248, '“Of 40 veterans… The New York Times identified, 21 had cancer. Nine had died from it… no formal mortality study has ever been done.”', { size: 16, lh: 24, fam: F.serif, marks: { cancer: '21 had cancer. Nine had died from it…' } }],
      ['p', 334, 'Frank B. Thompson, an Air Force band trombonist: “They told us it was safe, and we were dumb enough, I guess, to believe them.”', { size: 16, lh: 24, fam: F.serif, marks: { safe: '“They told us it was safe,' } }],
      ['p', 420, 'Dr. Lawrence T. Odland, the Air Force’s chief of radiation testing: “The sleeping dog policy? It was to leave it alone. Let it lie.”', { size: 16, lh: 24, fam: F.serif, marks: { sleeping: '“The sleeping dog policy? It was to leave it alone. Let it lie.”' } }],
      ['rule', 498, {}],
      ['p', 522, 'Recreated layout, not a facsimile. Headline and quoted lines are verbatim from the New York Times article; the attributions are ours. These are veterans’ accounts as the Times reported them: no medical cause is claimed.', NOTE],
    ],
    label: 'RECREATED TEXT · NEW YORK TIMES, 19 JUN 2016', src: 'SOURCE: DAVE PHILIPPS, THE NEW YORK TIMES (19 JUN 2016) · VETERANS’ ACCOUNTS AS REPORTED',
  },
  // S17 (✓) Kerry; the text as reported in S68/S76 (⚑): never "finalized" or binding (§13)
  statement2015: {
    w: 612, h: 660, paper: '#fbfaf6', ink: INK, def: ['binding', 'once'], tilt: -0.6,
    blocks: [
      ...head([[66, 'UNITED STATES · SPAIN', NARROW], [104, 'STATEMENT OF INTENT', { size: 26, weight: 800, track: 0.04, key: 'title' }], [128, 'Declaración de intenciones · Madrid, 19 October 2015', { size: 11.5, fam: F.serif, style: 'italic', color: '#55524b' }]], 146),
      ['t', 180, 'WHAT THE TEXT SAYS (AS REPORTED)', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: '#55524b' }],
      ['row', 214, 'Negotiate a binding deal', '«tan pronto como sea posible»', { key: 'asap', size: 13, fam: F.serif }],
      ['row', 246, 'The soil goes to', 'a site in the United States', { size: 13, fam: F.serif }],
      ['row', 278, 'Subject to', '«disponibilidad de fondos»', { key: 'funds', size: 13, fam: F.serif }],
      ['row', 310, 'Legal force', '«no supone… obligación jurídicamente vinculante»', { key: 'binding', size: 13, fam: F.serif, bold: true }],
      ['row', 342, 'Either side may stop', '«en cualquier momento»', { key: 'anytime', size: 13, fam: F.serif }],
      ['t', 392, '[Secretary of State John Kerry, that day:]', { x: 72, size: 11, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['p', 426, '“…we were able to sign a memorandum that will form a new path to achieve additional remediation at that site. And we have to build on today’s signing to take further action to resolve, once and for all, this very important issue.”', { size: 16, lh: 25, fam: F.serif, marks: { once: 'once and for all,' } }],
      ['rule', 540, {}],
      ['p', 564, 'Recreated summary. The Spanish phrases are the declaration’s text as reported (Público; Milicia y Democracia, 2016); we have not seen the signed original. In English: “as soon as possible”, “availability of funds”, “creates no legally binding obligation”, “at any time”. Kerry: remarks, 19 Oct 2015.', NOTE],
    ],
    label: 'RECREATED SUMMARY · US–SPAIN STATEMENT OF INTENT, 19 OCT 2015', src: 'SOURCES: KERRY REMARKS (STATE.GOV, 19 OCT 2015); TEXT AS REPORTED BY PÚBLICO (2016), MILICIA Y DEMOCRACIA (2016)',
  },
  // ⏱ G4 (T5 press, re-checked 21 Oct 2026); §10d. The brief's quote is the outlet's report of a brief we have not seen.
  court2026: {
    w: 612, h: 700, paper: '#fbfaf6', ink: INK, def: ['never', 'pending'], tilt: 0.6, asof: 'AS OF 21 OCT 2026',
    blocks: [
      ...head([[66, 'AUDIENCIA NACIONAL · MADRID', NARROW], [102, 'The Palomares cleanup case', { size: 24, fam: F.serif }], [126, 'Ecologistas en Acción v. the Ministry for the Ecological Transition (MITECO)', { size: 11, fam: F.serif, style: 'italic', color: '#55524b' }]], 144),
      ['t', 178, 'CASE STATUS, FROM PRESS REPORTS', { x: 72, size: 10.5, fam: F.narrow, weight: 700, track: 0.12, color: '#55524b' }],
      ['row', 212, 'Filed 2024 · admitted', 'Jan 2025', { size: 13.5, fam: F.serif }],
      ['row', 244, '23 Jan 2026', 'witnesses refused: a «cuestión jurídica»', { key: 'witnesses', size: 13.5, fam: F.serif }],
      ['row', 276, 'Oct 2026', 'is the court competent? Both sides: yes', { key: 'competent', size: 13.5, fam: F.serif }],
      ['t', 326, '[The State’s closing brief, 13 Apr 2026, as reported:]', { x: 72, size: 11, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['p', 362, '«Palomares nunca ha sido un accidente nuclear»', { size: 23, lh: 30, fam: F.serif, marks: { never: '«Palomares nunca ha sido un accidente nuclear»' } }],
      ['t', 400, '(“Palomares was never a nuclear accident”)', { x: 72, size: 12, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['box', 72, 432, 468, 64, { text: 'STATUS: «PENDIENTE DE FALLO»', size: 20, fam: F.sans, track: 0.04, key: 'pending' }],
      ['t', 520, '(awaiting judgment)', { align: 'c', size: 12, fam: F.serif, style: 'italic', color: '#55524b' }],
      ['rule', 560, {}],
      ['p', 584, 'Recreated summary from press reports (Actualidad Almanzora, 13 Apr and 19 Oct 2026; elDiario.es); we have not seen the court documents. The case is live: re-check before publishing.', NOTE],
    ],
    label: 'RECREATED SUMMARY · AUDIENCIA NACIONAL CASE, FROM PRESS REPORTS', src: 'SOURCES: ACTUALIDAD ALMANZORA (13 APR, 19 OCT 2026); ELDIARIO.ES (2026) · STATUS AS OF 21 OCT 2026',
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
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, Dc = DOCS[Pm.doc ?? 'dna1975'] ?? DOCS.dna1975;
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
      if (Dc.asof) G.asOf(g, Dc.asof, 1840, 84, range(t, 0.5, 1.0), { align: 'right', size: 19 });
      G.source(g, Pm.source ?? Dc.src, range(t, 0.6, 1.4), { size: 16 });
    }, { push: 0.025, dx: 26, dy: 8 });
  }

  // ================================================================ photo: an archival photo, Ken Burns, caption, credit
  async function photo(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 7, file = String(Pm.file ?? '');
    if (!file) throw new Error('photo: params.file is required (projects/palomares/assets/photos/<file> or an absolute /projects/... path)');
    const im = await G.image(file.startsWith('/') ? file : `/projects/palomares/assets/photos/${file}`);
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
