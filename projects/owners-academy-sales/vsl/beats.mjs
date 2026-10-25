// Right-panel graphics for the B2B VSL, keyed to the clip they play over.
// `at` = seconds into that clip (word timings are in snapped.json). Inside a beat, data-d etc.
// are seconds after the beat starts (see stage.js). A beat runs until the next beat in the
// same chapter, so a graphic can carry across a clip boundary.
// Every figure here is something Josh says in the clip or shows on his slides.

const eb = (t, d = 0) => `<div class="eyebrow" data-d="${d}">${t}</div>`;
const big = (h, d = 0.15, cls = 'big') => `<div class="${cls} split" data-d="${d}">${h}</div>`;
const small = (h, d) => `<div class="small" data-d="${d}">${h}</div>`;
const kpi = (v, l, d, extra = '') => `<div class="kpi" data-d="${d}"><div class="v"${extra}>${v}</div><div class="l">${l}</div></div>`;
const count = (to, { pre = '', suf = '', dec = 0, d = 0, from = 0 } = {}) =>
  ` data-count="${to}" data-from="${from}" data-pre="${pre}" data-suf="${suf}" data-dec="${dec}" data-d="${d}"`;
const bar = (lab, val, w, d, hot = false) => `<div class="bar" data-d="${d}"><div class="lab"><span>${lab}</span><b>${val}</b></div>
  <div class="track"><div class="fill${hot ? ' hot' : ''}" data-w="${w}" data-d="${d + 0.2}"></div></div></div>`;
const terms = (rows) => `<div class="terms">${rows.map(([k, v, d]) => `<div class="t" data-d="${d}"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
const list = (items) => `<div class="list">${items.map(([t, d], i) => `<div class="li" data-d="${d}"><i>${i + 1}</i><span>${t}</span></div>`).join('')}</div>`;
const weeks = (lanes) => `<div class="weeks">${lanes.map(([name, sub, a, b, d, color]) => `<div class="wk" data-d="${d}">
    <div class="name"><b>${name}</b>${sub}</div>
    <div class="lane"><div class="span" style="left:${(a / 16) * 100}%;background:${color}" data-w="${((b - a) / 16) * 100}" data-d="${d + 0.15}"></div></div></div>`).join('')}
  <div class="scale" data-d="${lanes[0][4]}"><span></span><div class="ticksx"><span>0</span><span>4</span><span>8</span><span>12</span><span>16 weeks</span></div></div></div>`;
const BLUE = 'linear-gradient(180deg,#2b5ba0,#0b2553)';
const GOLD = 'linear-gradient(180deg,#ffe08a,#d99a12)';
const stack = (title, segs, legend) => `${eb(title)}<div class="stack">
  <div class="col">${segs.map(([cls, h, d, label]) => `<div class="seg ${cls}" data-h="${h}" data-d="${d}">${label}</div>`).join('')}</div>
  <div class="legend">${legend.map(([color, k, v, d, tot]) => `<div class="it${tot ? ' tot' : ''}" data-d="${d}"><i style="background:${color}"></i><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>`;

export const cards = {
  intro: { eyebrow: 'For owners of $1M+ businesses', title: 'Grow by acquisition with <em>no money down</em>.', poster: true, dur: 2.8 },
  'Why owners are selling': { eyebrow: 'Part 2', title: 'Why owners are <em>selling</em>' },
  'Three ways to fund a deal': { eyebrow: 'Part 3', title: 'Three ways to fund a deal <em>without your cash</em>' },
  '1 · Vendor finance': { eyebrow: 'Mechanism 1 of 3', title: 'Vendor <em>finance</em>' },
  '2 · Vendor rollover': { eyebrow: 'Mechanism 2 of 3', title: 'Vendor <em>rollover</em>' },
  '3 · Commercial debt': { eyebrow: 'Mechanism 3 of 3', title: 'Commercial <em>debt</em>' },
  'Stacking all three': { eyebrow: 'Part 4', title: 'Stacking <em>all three</em>' },
  'The roll-up': { eyebrow: 'Part 5', title: 'The <em>roll-up</em>' },
  'Work with us': { eyebrow: 'Next step', title: 'Work with <em>G&amp;L</em>' },
  end: {
    eyebrow: 'For owners of $1M+ businesses', title: 'See if your business <em>qualifies</em>.', cta: true, dur: 6,
    fine: 'Results are not typical and depend on your business, market and the deals available to you. Nothing in this video is financial, legal or tax advice. Acquisitions involve risk, including the loss of money invested; get independent professional advice before entering any transaction. Some examples are Josh\'s friends and network, not clients.',
  },
};

// chapter names for the header, keyed by the card that opens them ('start' = first clip)
export const chapters = {
  start: 'The opportunity', 'Why owners are selling': 'Why owners sell', 'Three ways to fund a deal': 'Three ways to fund',
  '1 · Vendor finance': 'Vendor finance', '2 · Vendor rollover': 'Vendor rollover', '3 · Commercial debt': 'Commercial debt',
  'Stacking all three': 'Stacking all three', 'The roll-up': 'The roll-up', 'Work with us': 'Work with us',
};

export const beats = {
  arbitrage: [
    { at: 0, html: eb('The multiple arbitrage') + big('Buy good businesses at <em>3–5×</em> profit.') },
    { at: 6.6, html: eb('Then') + big('Combine them into <em>one group</em>, and build more value.') },
    { at: 19.4, html: big('Buyers pay more for the <em>group</em>.', 0, 'mid') +
        `<div class="bars">${bar('One business on its own', '3–5× EBITDA', 33, 1.4)}${bar('A consolidated group, to private equity', '8–15× EBITDA', 100, 2.6, true)}</div>` },
    { at: 35.7, html: big('That\'s the <mark data-hd="1.0">doubling and tripling</mark> of your money.') },
  ],
  'owner-a': [
    { at: 0, html: eb('Already have one of these?') + list([['Cash in the bank', 2.6], ['An existing business', 3.9], ['Property or other assets', 8.0]]) },
    { at: 17.2, html: big('Then this model works <em>so much easier</em> for you.') },
  ],
  'owner-b': [
    { at: 0, html: big('You can get the <mark data-hd="1.9">financing</mark>. You can get the <em>deals done</em>.') },
  ],
  'creds-a': [
    { at: 0, html: eb('<b>Josh Li</b> · Founder, JC Health Group') + `<div class="row">${kpi('$30M+', 'in deals by age 21, in banking', 1.8, count(30, { pre: '$', suf: 'M+', d: 2.2 }))}</div>` +
        small('Mentor and consultant to individuals and organisations around the world.', 9.4) },
  ],
  'creds-b': [
    { at: 0, html: eb('<b>Josh Li</b> · Founder, JC Health Group') + `<div class="row">${kpi('$30M+', 'in deals by age 21, in banking', 0)}${kpi('', 'in transactions advised, facilitated and completed', 1.4, count(100, { pre: '$', suf: 'M+', d: 2.6 }))}</div>` },
    { at: 11.3, html: big('The youngest in Australian history to close a <em>no-money-down</em> deal in healthcare.') },
  ],
  'why-sellers': [
    { at: 0, html: eb('Why would a seller say yes?') + `<div class="row">${kpi('', 'profit a year if they keep the business', 3.4, count(500, { pre: '$', suf: 'K', d: 3.6 }))}${kpi('', 'a year to walk away from it', 7.5, count(350, { pre: '$', suf: 'K', d: 7.7 }))}</div>` },
    { at: 10.2, html: big('Because of the <mark data-hd="2.0">burden of ownership</mark>.') },
  ],
  'retiring-owners': [
    { at: 0, html: eb('The timing') + big('A powerful time to buy businesses with <em>creative structures</em>.') },
    { at: 9.3, html: big('Owners in traditional industries are <em>ready to retire</em>.') },
    { at: 27.9, html: big('The seller <em>gets paid</em>. You hold an <mark data-hd="3.0">asset that pays you</mark>.') },
  ],
  mechanisms: [
    { at: 0, html: eb('The debt mechanisms') + `<div class="row">
        <div class="card" data-d="7.4"><div class="eyebrow">1</div><div class="mid">Vendor finance</div><div class="small">The seller lends you the price</div></div>
        <div class="card" data-d="8.6"><div class="eyebrow">2</div><div class="mid">Vendor rollover</div><div class="small">The seller keeps a stake</div></div>
        <div class="card" data-d="12.2"><div class="eyebrow">3</div><div class="mid">Commercial debt</div><div class="small">A bank or private lender funds it</div></div></div>` +
        `<div class="mid split" data-d="16.6" style="font-size:44px">Little to no money down, and <mark data-hd="19.6">no equity to investors</mark>.</div>` },
  ],
  'vendor-finance-a': [
    { at: 1.3, html: big('The seller <mark data-hd="2.0">lends you the money</mark> to buy their business.') },
    { at: 8.5, html: eb('Example') + `<div class="row">${kpi('', 'the seller\'s asking price', 4.6, count(1000000, { pre: '$', d: 4.8 }))}</div>` },
  ],
  'vendor-finance-b': [
    { at: 0, html: eb('Your offer') + `<div class="row">${kpi('$1,000,000', 'the full asking price', 0.3)}${kpi('3 years', 'paid over time', 2.9)}${kpi('+ interest', 'on the balance', 5.4)}</div>` },
    { at: 19.1, html: eb('An IOU to the seller') + `<div class="flow">
        <div class="node" data-d="0.2"><div class="who">Seller</div><div class="sub">Retiring owner</div></div>
        <div class="arrows"><div data-d="4.6">Their business<svg viewBox="0 0 200 26"><path data-draw data-d="4.6" stroke="#c7d3fb" d="M4 13 H190 M178 3 L192 13 L178 23"/></svg></div>
          <div data-d="7.1"><svg viewBox="0 0 200 26"><path data-draw data-d="7.1" stroke="#fdd050" d="M196 13 H10 M22 3 L8 13 L22 23"/></svg>Payments over time</div></div>
        <div class="node" data-d="0.6"><div class="who">You</div><div class="sub">New owner from day one</div></div></div>` },
    { at: 30.4, html: eb('Faster than raising from investors') + big('Close in <mark data-hd="10.3">2–4 weeks</mark>.', 0.3) },
  ],
  'seller-pitch': [
    { at: 0, html: eb('The pitch to the seller') + big('Don\'t say "vendor finance." Say <mark data-hd="13.0">"getting paid over time."</mark>', 0.2) },
    { at: 14.8, html: eb('Example: $1M revenue · $250K EBITDA · paid over 10 years') + big('Way above <em>market value</em>.', 2.2, 'mid') +
        `<div class="bars">${bar('Typical market price · 3–5× EBITDA', '$750K–$1.2M', 72, 15.8)}${bar('Your offer · 6–7× EBITDA', '$1.66M', 100, 25.2, true)}</div>` +
        small('$250K ÷ 1.5 = $166K a year you can comfortably pay the seller, × 10 years.', 27.5) },
    { at: 54.3, html: eb('Time to close') + weeks([['Vendor finance', 'Seller pays you over time', 2, 4, 4.2, GOLD], ['Bank', 'Full credit process', 6, 16, 5.8, BLUE]]) },
  ],
  'first-deal-terms': [
    { at: 0, html: eb('Josh\'s first deal · a physio clinic') + terms([
        ['Structure', '100% vendor finance', 2.2], ['Term', '7 years', 5.3], ['Interest', '4%', 7.0],
        ['Repayments', 'Monthly principal + interest', 9.8], ['Payments in the first 9 months', '$0', 13.7]]) },
    { at: 21.0, html: big('The seller still works in the business, seeing patients. <em>He\'s happy.</em>') },
    { at: 44.4, html: `<div class="row">${kpi('', 'pulled out of the deal in the first 6–12 months', 0.8, count(150, { pre: '$', suf: 'K', d: 0.9 }))}${kpi('$0', 'of Josh\'s own money in', 9.0)}</div>` },
  ],
  rollover: [
    { at: 0, html: big('The seller <mark data-hd="2.6">keeps a stake</mark> in the business.') },
    { at: 22.6, html: eb('Example') + `<div class="bar"><div class="lab" data-d="0.2"><span>Ownership after the sale</span><b></b></div>
        <div class="track" style="display:flex;height:96px"><div class="fill" data-w="70" data-d="0.4" style="display:grid;place-items:center;font:600 28px/1 var(--sans)">You buy 70%</div>
        <div class="fill hot" data-w="30" data-d="3.4" style="display:grid;place-items:center;font:600 28px/1 var(--sans);color:#0d1526;border-radius:0 9px 9px 0">Seller keeps 30%</div></div></div>` +
        big('They believe you\'ll grow it, so they <em>stay in for the upside</em>.', 13, 'mid') },
    { at: 42.8, html: big('They cash out part now, and <em>cash in again</em> later.') },
    { at: 61.2, html: stack('Why it matters for commercial lending', [['bank', 70, 12, 'Bank loan'], ['roll', 30, 28.3, 'Rollover']], [
        ['linear-gradient(180deg,#2b5ba0,#0b2553)', 'Bank lends 50–70%', '70%', 12], ['linear-gradient(180deg,#4a3d7a,#2a2457)', 'Seller\'s rolled equity fills the gap', '30%', 28.5],
        ['linear-gradient(180deg,#ffe08a,#d99a12)', 'Paid upfront by you', '$0', 36.0, true]]) },
  ],
  commercial: [
    { at: 0, html: big('A bank or private lender <em>funds the purchase</em>.') },
    { at: 9.0, html: eb('The trade-off') + big('A comprehensive credit process, and <em>a handful of people</em> must sign off.', 0.3, 'mid') },
    { at: 37.4, html: eb('Time to close') + weeks([['Vendor finance', 'Deal between you and the seller', 2, 4, 0.4, GOLD], ['Bank', 'Credit review and approval', 6, 16, 4.0, BLUE]]) },
    { at: 46.8, html: big('Motivated seller? <mark data-hd="16.5">Vendor finance gets the deal done.</mark>') },
  ],
  dscr: [
    { at: 0, html: eb('The rule behind every structure') + `<div class="formula">
        <div class="fr" data-d="0.4"><span>Free cash flow</span><hr><span>Debt service</span></div>
        <span class="op" data-d="3.6">≥</span><span class="gold" data-d="6.3" style="font-size:110px">1.5</span></div>` +
        small('Example: $250K free cash flow ÷ $166K a year to the seller = 1.5', 6.8) },
  ],
  'sixty-forty': [
    { at: 0, html: stack('The 60/40 · buying a $1M business', [['bank', 60, 4.8, 'Bank · $600K'], ['roll', 40, 16.4, 'Seller · $400K']], [
        ['linear-gradient(180deg,#2b5ba0,#0b2553)', 'Bank loan for 60%', '$600K', 4.9], ['linear-gradient(180deg,#4a3d7a,#2a2457)', 'Seller keeps 40% (rollover)', '$400K', 16.4],
        ['linear-gradient(180deg,#ffe08a,#d99a12)', 'Your own cash', '$0', 29.5, true]]) },
  ],
  'jason-first': [
    { at: 0, html: eb('Jason Nagy · friend of Josh') + big('First deal: a <em>$5.5M</em> radiology business. <mark data-hd="7.6">No money down.</mark>', 2.0) },
    { at: 11.1, html: eb('How it was funded') + `<div class="row">${kpi('60%', 'of the business bought; the seller kept 40%', 1.2)}${kpi('100%', 'of business assets pledged to the bank', 6.2)}</div>` },
    { at: 21.4, html: big('Asset-rich businesses are <em>easier to finance</em>.') },
  ],
  'seller-vision': [
    { at: 0, html: eb('What you sell the seller: the vision') + `<div class="row">${kpi('4×', 'what you paid for their business', 6.6)}${kpi('10×', 'what the group could be worth', 29.0)}</div>` },
    { at: 38.8, html: eb('The seller\'s 40%') + `<div class="row">${kpi('$400K', 'if they sold it today', 0.2)}${kpi('', 'as part of the group at 10×', 6.8, count(4, { pre: '$', suf: 'M', d: 6.9 }))}</div>` },
  ],
  'christian-a': [
    { at: 0, html: eb('Christian Dawes · Victoria, Australia') + big('First deal funded <em>100% by the bank</em>, and <mark data-hd="16.4">over-financed</mark>.', 8.8) },
  ],
  cam: [
    { at: 0, html: `<div class="who-tag" data-d="0">Cam · friend of Josh</div><div class="chat">
        <div class="bubble" data-d="0.3">Just closed two deals.</div>
        <div class="bubble" data-d="1.0">Combined: $508K EBITDA · $1.75M price · $550K over-finance</div></div>` +
        `<div class="row">${kpi('2', 'deals', 0.4)}${kpi('', 'days', 1.0, count(23, { d: 1.1 }))}${kpi('100%', 'vendor finance', 2.3)}</div>` },
    { at: 12.6, html: eb('Cam\'s structure') + terms([['Interest-only', '10 years', 1.4], ['Balloon payments', 'Years 3 and 10', 4.2], ['Your cash in', '$0', 7.0]]) },
    { at: 56.2, html: big('It\'s very possible. And <em>it can be done quickly</em>.') },
  ],
  'rollup-run': [
    { at: 0, html: eb('Roll-up speed run · 60/40 deals, no money down') +
        `<div class="grid10">${Array.from({ length: 10 }, (_, i) => `<div class="tile" data-d="0.2" data-lit="${(14.8 + i * 0.22).toFixed(2)}">Business ${i + 1}<br>$250K EBITDA</div>`).join('')}</div>` +
        `<div class="eq">
          <div class="ln" data-d="17.2"><span>Buy 10 businesses at 4×</span><b>$10M</b></div>
          <div class="ln" data-d="18.4"><span>Grow to $3.5M EBITDA, sell the group at 10×</span><b>$35M</b></div>
          <div class="ln" data-d="19.6"><span>Less bank debt ($6M) and sellers' 40% ($14M)</span><b>−$20M</b></div>
          <div class="ln res" data-d="22.0"><span>Walk out with · walked in with $0</span><b${count(15, { pre: '$', suf: 'M', d: 23.6 })}></b></div></div>` },
    { at: 34.0, html: big('Cameron bought <em>two companies in 23 days</em>. Imagine how fast you could build this.') },
  ],
  'jason-exit': [
    { at: 0, html: eb('Jason Nagy · radiology roll-up') + `<div class="row">${kpi('', 'exit to private equity', 1.0, count(200, { pre: '$', suf: 'M', d: 1.2 }))}${kpi('7 years', 'from first deal to exit', 2.6)}</div>` },
  ],
  serious: [
    { at: 0, html: eb('How we help owners') + list([['Executing an acquisition strategy', 4.4], ['Financing and funding', 8.2], ['Mentors and a board', 11.0], ['Introductions to our network', 15.8]]) },
  ],
  'book-call': [
    { at: 0, html: big('Book a call <em>directly with Josh</em>.') + small('Not with staff or appointment setters. A short form first, so Josh understands your business.', 5.0) +
        `<div data-d="16.6" style="display:flex;align-items:center;gap:30px"><span class="btn">See if you qualify →</span><span class="url">apply.grosfjeld-li.com</span></div>` },
  ],
};

// shared with faq-beats.mjs
// Credibility panel for long-form intros: Josh's numbers (as used in the B2B VSL) and two clinic photos
// with a slow push-in. Photos live in vsl/img/.
const cred = () => eb('<b>Josh Li</b> · Founder, JC Health Group') +
  `<div class="row">${kpi('', 'in deals by age 21, in banking', 0.4, count(30, { pre: '$', suf: 'M+', d: 0.4 }))}` +
  `${kpi('', 'in transactions advised and completed', 1.2, count(100, { pre: '$', suf: 'M+', d: 1.2 }))}` +
  `${kpi('$0', 'of his own money in his first clinic', 2.0)}</div>` +
  `<div class="photos"><div class="ph" data-d="2.8"><div class="im"><img src="img/melton-physio.jpg" data-kb style="object-position:50% 55%"></div>` +
  `<div class="cap">Melton Physiotherapy &amp; Sports Medicine Clinic</div></div>` +
  `<div class="ph" data-d="3.4"><div class="im"><img src="img/paramount-physio.jpg" data-kb style="object-position:50% 40%"></div>` +
  `<div class="cap">Paramount Physio</div></div></div>`;
// "Coming up" teaser headline at the top of a long form
const teaser = (h) => [{ at: 0, html: eb('Coming up') + big(h, 0.1, 'mid') }];
export { eb, big, small, kpi, count, bar, terms, list, cred, teaser };
