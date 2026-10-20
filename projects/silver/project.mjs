// THE BROTHERS WHO TRIED TO BUY ALL THE SILVER. Episode 7. Studio look (white clay + real silver + Reconstructed-style
// mannequins: red = the Hunts, blue = officials/brokers/the other side, pale cyan = the public).
// Narration is read straight from SCRIPT.md (numbered lines); every line was voiced once (projects/silver-vo, per-line
// ElevenLabs cache), so any regrouping of lines into shots reuses the audio. Facts: RESEARCH.md. 3D sets: sets/clay-silver.js,
// sets/oner.js, sets/thumbs.js. Graphics: SETS-graphics.md. Cuts and their sounds: cuts.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreTransitions } from './cuts.mjs';
import { voice } from '../silver-vo/project.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LINES = {};
for (const l of fs.readFileSync(path.join(here, 'SCRIPT.md'), 'utf8').split('\n')) { const m = l.match(/^(\d+)\. (.*)$/); if (m) LINES[+m[1]] = m[2].trim(); }
// L(5) or L(5, 7): those script lines, one per line (the voice engine assembles shots from cached lines)
const L = (a, b = a) => { const out = []; for (let i = a; i <= b; i++) { if (!LINES[i]) throw new Error(`SCRIPT line ${i} missing`); out.push(LINES[i]); } return out.join('\n'); };

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title, sub, mood) => ({ id: `ch${num}`, set: 'chapter', params: { num, title, sub }, min: 4.0, chapter: num, mood });
const R = 'RECONSTRUCTION', ILL = 'ILLUSTRATION', SEC = 'SOURCE: SEC STAFF REPORT, "THE SILVER CRISIS OF 1980" (1982)', HSE = 'SOURCE: HOUSE SUBCOMMITTEE HEARINGS, 1980', TIME = 'SOURCE: TIME, 7 APR 1980';
// mannequin shorthands
const BUNKER = (o = {}) => ({ w: 'suit', c: 'red', hat: 'cowboy', clip: 'idle', x: 0, z: 0, ry: 0.35, ...o });
const HERBERT = (o = {}) => ({ w: 'overcoat', c: 'red', hat: 'cowboy', clip: 'idle_b', x: 1.1, z: -0.4, ry: -0.2, ...o });
const OFFICIAL = (o = {}) => ({ w: 'suit_b', c: 'blue', clip: 'idle', ...o });

const shots = [
  // ================= COLD OPEN: grandma's fork → crucible → ingot → the mountain of silver, two red figures on top =================
  S('cold-open', L(1, 7), { cues: { fork: 'forks', spoon: 'spoons', coins: 'coins', pour: 'Burglars', bar: 'Because', price: 'fifty', reveal: 'reason', brothers: 'Nelson' }, date: 'WINTER 1979–80' },
    { padIn: 0.3, padOut: 0.4, mood: { mood: 'tension', key: 'E', intensity: [0.3, 0.55], riser: true } }),
  S('margin', L(8), { caption: 'MARCH 1980', loanLabel: 'BORROWED', colLabel: 'SILVER', drop: 0.75, at: 0.2, callAt: 'broker', source: ILL }),
  S('price-tower', L(9), { mode: 'crash', caption: 'SILVER · $ PER OUNCE', points: [{ label: '17 JAN 1980', price: 48.70 }, { label: '25 MAR', price: 20.20 }, { label: '26 MAR', price: 15.80, red: true }], crashTo: 10.80, crashAt: 'third', crashLabel: 'THU 27 MAR', source: SEC + ' · SPOT CLOSES' },
    { beats: [['halted', 'counter', { preset: 'clock213' }], ['Florida', 'map', { mode: 'us', pins: [{ name: 'Boca Raton', lon: -80.08, lat: 26.37 }], hl: ['USA'], title: 'Sunday night, 30 March 1980', kicker: 'BOCA RATON, FLORIDA' }]] }),
  S('silver-chart', L(10), { mode: 'long', at: 0.2, title: 'Silver, 1973 → 2026' }, { mood: { mood: 'urgency', key: 'E', intensity: [0.45, 0.65], riser: true, until: 'title' } }),
  S('margin', L(11), { caption: 'THE HIDDEN LEVER', loanLabel: 'BORROWED MONEY', colLabel: 'SILVER', lineLabel: 'MARGIN', drop: 0.35, at: 0.5, callAt: 99, source: ILL, camera: [{ pos: [9, 5.5, 15], look: [1.5, 2.2, 0], mm: 38 }, { pos: [6, 4.5, 13], look: [2, 2.4, 0], mm: 40 }] }),
  S('cutaway', L(12), {}),
  { id: 'title', set: 'title', params: {}, min: 3.8, mood: { mood: 'wonder', key: 'E', intensity: 0.7, hit: true } },

  // ================= 1. THE MAN WHO BOUGHT METAL =================
  CH(1, 'The Man Who Bought Metal', 'Dallas, 1973', { mood: 'wonder', key: 'A', intensity: [0.25, 0.4] }),
  S('figures', L(13), { figs: [BUNKER({ label: 'NELSON BUNKER HUNT' })], props: ['plinth'], cam: 'orbit' }),
  S('figures', L(14), { figs: [BUNKER({ clip: 'idle', label: '54 · 225 LB · BROWN SUITS', ry: 0.2 })], cam: [{ pos: [1.6, 1.5, 4.8], look: [0, 1.15, 0], mm: 45 }, { pos: [1.2, 1.45, 4.2], look: [0, 1.2, 0], mm: 48 }], source: TIME }),
  S('figures', L(15), { figs: [BUNKER({ clip: 'look_around', x: 0.6, label: 'A 1973 CADILLAC · LISTED NUMBER' })], props: ['car'], carAt: [-2.4, 0, -1.2], cam: 'wide', source: TIME }),
  S('quote', L(16), { text: 'He is the kind of guy who will order chicken-fried steak and Jell-O, spill some on his tie, and then go out and buy all the silver in the world.', by: 'An associate of Bunker Hunt', role: 'Quoted in Time, 1980', highlight: ['buy', 'all', 'silver', 'world'], source: TIME }),
  S('photo', L(17), { file: 'commons_hl_hunt_1965.jpg', caption: 'H. L. HUNT', focus: [0.5, 0.35], zoom: 1.1 }),
  S('figures', L(18), { figs: [BUNKER({ clip: 'talk', x: -1.0, ry: 0.5 })], props: ['balance'], balanceAt: [1.0, 0, 0.3], tilt: 0, cam: 'pair' }),
  S('quote', L(19), { text: 'In business, you should risk a little with the potential to make a lot, not vice versa.', by: 'Bunker Hunt', role: 'Recalling his father, 1980', highlight: ['risk', 'little', 'lot'], source: TIME }),
  S('figures', L(20), { figs: [BUNKER({ x: -1.2, clip: 'idle', ry: 0.6 })], props: ['balance'], balanceAt: [0.8, 0, 0.3], tilt: -0.22, tiltAt: 0.3, cam: [{ pos: [1.6, 1.2, 3.2], look: [0.6, 1.0, 0.3], mm: 45 }, { pos: [1.2, 1.15, 2.8], look: [0.6, 1.0, 0.3], mm: 50 }] }),
  S('map', L(21), { mode: 'world', pins: [{ name: 'Dallas', lon: -96.8, lat: 32.78 }, { name: 'Sarir field', lon: 22.4, lat: 27.6, word: 'Sarir' }], routes: [['Dallas', 'Sarir field']], hl: ['LBY'], title: 'The Sarir oil field, 1961', kicker: 'LIBYA' }),
  S('oilfield', L(22), { mode: 'collateral', tagText: 'NATIONALISED', tagAt: 'nationalised', caption: 'LIBYA, 1973' }),
  S('figures', L(23), { figs: [BUNKER({ clip: 'look_around' })], props: ['cash'], cashAt: [0.5, 0, 0.5], cam: [{ pos: [1.8, 0.7, 3.4], look: [0.2, 0.9, 0.2], mm: 40 }, { pos: [1.3, 0.65, 2.9], look: [0.2, 0.95, 0.2], mm: 42 }] }),
  S('timeline', L(24), { focus: [1961, 1975], title: 'Before the silver' }, { beats: [['illegal', 'photo', { file: 'commons_executive_order_6102.jpg', caption: 'EXECUTIVE ORDER 6102 (1933)', focus: [0.5, 0.3], zoom: 1.15 }]] }),
  S('hero-bar', L(25), { from: 2.55, to: 2.55, label: 'SILVER · 1973 AVERAGE, $ PER OUNCE', date: '1973', at: 0.3, source: HSE + ' (H. HUNT)' }),
  S('quote', L(26), { text: 'Silver looked safer than overseas oil concessions, the way things were going. And precious metals were a good hedge against paper money.', by: 'Bunker Hunt', role: 'Time, 1980', highlight: ['safer', 'paper', 'money'], source: TIME }),
  S('bignumber', L(27), { value: 20, suffix: 'M oz', label: 'Bunker’s first big silver purchase', kicker: 'LATE 1973', note: 'AT $2.80–$3.10 AN OUNCE', source: SEC, at: 0.3 }),
  S('vault', L(28), { mode: 'delivery', at: 'took', caption: 'TAKING DELIVERY', source: ILL }),

  // ================= 2. THE MACHINE =================
  CH(2, 'The Machine', 'How the silver market really worked', { mood: 'tension', key: 'A', intensity: [0.3, 0.45] }),
  S('photo', L(29), { file: 'loc_comex_floor_1978_a.jpg', caption: 'A NEW YORK COMMODITY PIT, c.1978', focus: [0.55, 0.45], zoom: 1.12 }),
  S('vault', L(30), { mode: 'contract', at: 'Futures', caption: 'A FUTURES CONTRACT', cardFoot: 'MOST TRADERS: SETTLE IN CASH', source: 'COMEX CONTRACT SIZE: SEC STAFF REPORT (1982)' }),
  S('photo', L(31), { file: 'loc_comex_floor_1978_b.jpg', caption: 'TRADERS, c.1978', focus: [0.4, 0.5], zoom: 1.1 }),
  S('vault', L(32), { mode: 'delivery', at: 'real', caption: 'THE BACK DOOR: DELIVERY', cardFoot: 'HOLD TO THE END: TAKE THE METAL', source: ILL }),
  S('vault', L(33), { mode: 'shelves', caption: 'AN EXCHANGE VAULT', source: ILL }),
  S('margin', L(34), { caption: 'MARGIN', loanLabel: 'YOUR DEPOSIT', colLabel: 'SILVER CONTROLLED', drop: 0, at: 0.5, callAt: 99, source: ILL, camera: [{ pos: [-4, 4.5, 15], look: [0, 2.2, 0], mm: 40 }, { pos: [1, 3.8, 13], look: [1, 2.2, 0], mm: 42 }] }),
  S('bignumber', L(35), { value: 30000, prefix: '$', label: 'Of margin controlled more than $170,000 of silver', kicker: '30 DECEMBER 1979', note: 'ONE CONTRACT · 5,000 OZ', source: SEC, at: 0.2 }),
  S('figures', L(36), { figs: [OFFICIAL({ x: -1.8, ry: 0.9, label: 'LOSERS PAY', labelAt: 'losers' }), BUNKER({ x: 1.8, ry: -0.9, clip: 'idle_b', label: 'WINNERS', labelAt: 'winners' })], props: ['cashflow'], flow: { from: [-1.4, 0.5], to: [1.4, 0.5], at: 'losers', n: 8 }, cam: [{ pos: [0.5, 2.2, 6.8], look: [0, 1.0, 0], mm: 35 }, { pos: [-0.3, 2.0, 6.0], look: [0, 1.0, 0], mm: 35 }] }),
  S('bignumber', L(37), { value: 96.8, decimals: 1, prefix: '$', suffix: 'M', label: 'For every $1 rise in the price of silver', kicker: 'THE HUNTS’ FUTURES · 1 JAN 1980', note: '≈19,350 CONTRACTS · ≈96.8M OZ', source: SEC, at: 0.4 }),
  S('figures', L(38), { figs: [BUNKER({ x: 0.2, clip: 'idle', label: 'THE HUNTS' })], props: ['cashflow', 'bars'], barsN: 12, barsAt: [1.2, 0, 0.4], flow: { from: [-3, 1.5], to: [0.6, 0.6], at: 0.3, n: 10, period: 0.3 }, cam: 'orbit' }),
  S('price-tower', L(39), { mode: 'rise', points: [{ label: 'JUL 1979', price: 9 }, { label: 'DEC 1979', price: 34.45 }, { label: 'JAN 1980', price: 48.70 }], caption: 'AS LONG AS THE PRICE GOES UP', source: SEC }),
  S('margin', L(40), { caption: 'WHEN THE PRICE FALLS', drop: 0.7, at: 'falls', callAt: 'call', source: ILL }),
  S('boardroom', L(41), { stampAt: 99, caption: 'THE EXCHANGE SETS THE MARGIN', source: ILL, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] }),
  S('margin', L(42), { caption: null, loanLabel: '', colLabel: '', lineLabel: 'THE SWITCH', drop: 0.2, at: 0.3, callAt: 99, source: null, camera: [{ pos: [12, 5, 11], look: [3, 2.6, 0.5], mm: 45 }, { pos: [10, 4.6, 9.5], look: [3.5, 2.8, 0.8], mm: 50 }] }),

  // ================= 3. FIFTY DOLLARS =================
  CH(3, 'Fifty Dollars', 'July 1979 – January 1980', { mood: 'triumph', key: 'C', intensity: [0.35, 0.55] }),
  S('map', L(43, 44), { mode: 'world', pins: [{ name: 'Dallas', lon: -96.8, lat: 32.78 }, { name: 'Bermuda', lon: -64.78, lat: 32.3, word: 'Bermuda' }, { name: 'Saudi Arabia', lon: 46.7, lat: 24.7, word: 'Saudi' }], routes: [['Dallas', 'Bermuda'], ['Saudi Arabia', 'Bermuda']], title: 'International Metals Investment Co.', kicker: 'BERMUDA · JULY 1979', source: SEC }),
  S('silver-chart', L(45), { mode: 'runup', at: 0.3, title: 'The run-up' }),
  S('vault', L(46), { mode: 'drain', share: 0.5, shareLabel: 'TAKEN', at: 'buying', caption: 'BUYING. AND TAKING DELIVERY.', source: ILL }),
  S('hero-bar', L(47), { from: 9, to: 34.45, at: 'thirty', span: 2.2, label: 'SILVER · $ PER OUNCE', date: '31 DEC 1979', source: SEC }),
  S('bignumber', L(48), { value: 195, suffix: 'M oz', label: 'Held by the Hunt group, futures and metal', kicker: '1 JANUARY 1980', note: 'BUNKER, HERBERT AND IMIC', source: SEC, at: 0.2 }),
  S('cube', L(49), { at: 'block' }),
  S('bignumber', L(50), { value: 15, suffix: '%', label: 'Of all the silver in the world', kicker: 'THE HUNT GROUP · SEC ESTIMATE', note: 'THEIR FUTURES ≈ 76% OF EXCHANGE STOCKS', source: SEC, at: 0.2 },
    { beats: [['futures', 'vault', { mode: 'drain', share: 0.76, shareLabel: 'CLAIMED', at: 0.1, caption: 'THEIR FUTURES vs EXCHANGE SILVER', source: SEC }]] }),
  S('hero-bar', L(51), { from: 34.45, to: 50, at: 'fifty', span: 1.6, red: true, label: 'SILVER · $ PER OUNCE', date: '17–18 JAN 1980', source: SEC + ' · INTRADAY HIGH' }),
  S('bignumber', L(52), { value: 9.8, decimals: 1, prefix: '$', suffix: 'B', label: 'Value of the Hunt group’s position', kicker: 'AT THE PEAK · JANUARY 1980', note: 'ON PAPER', source: SEC, at: 0.2, red: true }),
  S('bignumber', L(53), { value: 1.4, decimals: 1, prefix: '$', suffix: 'B', label: 'Profits already pulled out as cash', kicker: 'BY NEW YEAR 1980', source: SEC, at: 0.2 }),
  S('queue', L(54), { caption: 'WINTER 1980', count: 22 }),
  S('heirlooms', L(55), { mode: 'table', at: 'expensive', tags: [[0.4, 0.4, 'PRICE ↑'], [-1.6, -0.6, 'PRICE ↑'], [1.7, -0.3, 'PRICE ↑']], caption: 'FROM BABY SPOONS TO FILM', source: TIME + ' (TIFFANY & CO.)' }),
  S('quote', L(56), { text: 'We began to see, for example, people turning in their home silverware.', by: 'James Stone', role: 'Chairman, Commodity Futures Trading Commission, 1980', highlight: ['home', 'silverware'], source: HSE }),
  S('doc', L(57), { doc: 'tiffany', at: 'unconscionable' }),
  S('queue', L(58), { caption: null, count: 26, blueAt: 99, camera: [{ pos: [-30, 9, 20], look: [-8, 1, 0], mm: 32 }, { pos: [-18, 8, 22], look: [-4, 1, 0], mm: 32 }], source: ILL }),
  S('cutaway', L(59), { keys: [{ pos: [7, 7, 20], look: [0, 6, -5], mm: 35 }, { pos: [3, 6.6, 16], look: [0, 6.4, -5], mm: 38 }] }),
  S('figures', L(60), { figs: [BUNKER({ x: -1.0, ry: 0.6 }), HERBERT({ x: -2.0, z: -0.6 })], props: ['balance'], balanceAt: [1.0, 0, 0.3], tilt: 0.24, tiltAt: 'risking', cam: 'pair' }),
  S('margin', L(61), { caption: 'ON BORROWED MONEY', loanLabel: 'BORROWED', colLabel: 'SILVER PLEDGED', drop: 0.1, at: 0.4, callAt: 99, source: SEC, camera: [{ pos: [-8, 5, 14], look: [-2, 2, 0], mm: 40 }, { pos: [-5, 4.4, 13], look: [-1, 2, 0], mm: 42 }] }),

  // ================= 4. THE RULES CHANGE =================
  CH(4, 'The Rules Change', 'September 1979 – March 1980', { mood: 'tension', key: 'D', intensity: [0.35, 0.6] }),
  S('bignumber', L(62), { value: 20000, from: 2000, roll: true, prefix: '$', label: 'Margin per silver contract', kicker: 'SEPTEMBER 1979 · WITHIN WEEKS', note: 'FROM $2,000', source: HSE + ' (H. HUNT, SWORN)', at: 0.4 }),
  S('photo', L(63), { file: 'loc_volcker_senate_1983.jpg', caption: 'PAUL VOLCKER, FED CHAIRMAN (PHOTO: 1983)', focus: [0.5, 0.4], zoom: 1.12 }),
  S('boardroom', L(64), { stampAt: 'Rule', stampText: 'SILVER RULE 7', docTitle: 'EMERGENCY RULE', source: R, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] }),
  S('doc', L(65), { doc: 'rule7', at: 'applied' }),
  S('figures', L(66), { figs: [BUNKER({ x: -0.9, z: 0.2, ry: 0.9, clip: 'talk_b', label: 'BUNKER HUNT' }), OFFICIAL({ x: 0.9, z: 1.6, ry: -2.4, clip: 'idle', label: 'CFTC', labelAt: 1.0 })], props: ['desk'], deskX: 0.6, deskZ: 0.9, cam: [{ pos: [-1.5, 2.2, 5.6], look: [0.2, 1.0, 0.6], mm: 38 }, { pos: [-0.6, 2.0, 4.8], look: [0.2, 1.05, 0.6], mm: 40 }], caption: '8 JANUARY 1980', source: HSE + ' (CFTC MEMO)' },
    { beats: [['down', 'doc', { doc: 'cftc', highlight: ['raise', 'lower', 'shut'] }]] }),
  S('doc', L(67, 68), { doc: 'liquidation', at: 'liquidation' }),
  S('boardroom', L(69), { stampAt: 'stop', stampText: 'NO NEW BUYING', docTitle: 'LIQUIDATION ONLY', docDate: '21 JANUARY 1980', source: R, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] }),
  S('bignumber', L(70), { value: 10, prefix: '−$', label: 'In a single day', kicker: '22 JANUARY 1980', note: 'SPOT SILVER FELL TO $34.00', source: SEC, red: true, at: 0.2 }),
  S('boardroom', L(71), { stampAt: 99, caption: 'CONFLICT OF INTEREST?', source: SEC, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] },
    { beats: [['review', 'quote', { text: 'The inquiry failed to uncover evidence that would prove conflicts of interest on the part of any board member.', by: 'CFTC Chairman Philip Johnson', role: '8 February 1982', highlight: ['failed', 'evidence'], source: SEC }]] }),
  S('figures', L(72), { figs: [BUNKER({ x: -1.8, ry: 0.9, clip: 'idle_b' }), OFFICIAL({ x: 1.8, ry: -0.9, label: 'THE EXCHANGE', labelAt: 'billing' })], props: ['cashflow'], flow: { from: [-1.4, 0.5], to: [1.4, 0.5], at: 'billing', n: 8 }, cam: [{ pos: [-0.5, 2.2, 6.8], look: [0, 1.0, 0], mm: 35 }, { pos: [0.3, 2.0, 6.0], look: [0, 1.0, 0], mm: 35 }], caption: 'NOW THEY PAY' }),
  S('bignumber', L(73), { value: 60000, prefix: '$', label: 'Margin per contract on a Hunt-sized position', kicker: '4 FEBRUARY 1980', note: '30× LAST SUMMER', source: SEC, at: 0.2, red: true }),
  S('doc', L(74), { doc: 'fed', at: 'speculative' }),
  S('bailout', L(75), { mode: 'banks', noAt: ['Barclays', 'Deutsche', 'Canadian'], caption: 'MARCH 1980', source: SEC }),
  S('counter', L(76), { steps: [{ text: 'MON 31 MAR', label: 'THE DEADLINE' }], kicker: 'ENGELHARD', title: 'There was a deadline', source: SEC }),
  S('bignumber', L(77), { value: 434, prefix: '$', suffix: 'M', label: 'Due to Engelhard on Monday, 31 March 1980', kicker: '28.5M OZ BOUGHT AT ≈$36', source: SEC, at: 'Four' }),
  S('silver-chart', L(78), { mode: 'crash', at: 0.1, title: 'Silver, January → March 1980', dayAt: 99, peakAt: 99 }),

  // ================= 5. SILVER THURSDAY =================
  CH(5, 'Silver Thursday', '25–31 March 1980', { mood: 'tension', key: 'D', intensity: [0.45, 0.8], riser: true }),
  S('counter', L(79), { steps: [{ text: '$20.20', label: 'TUESDAY 25 MARCH 1980 · CLOSE' }], kicker: 'SILVER · SPOT', title: 'Three days in March', source: SEC }),
  S('figures', L(80), { figs: [HERBERT({ x: -0.8, ry: 0.8, clip: 'talk', label: 'HERBERT HUNT' }), OFFICIAL({ x: 0.9, z: 0.4, ry: -0.9, clip: 'idle', label: 'BACHE CHAIRMAN', labelAt: 'chairman' })], cam: 'push', focusOn: 0, caption: 'TUESDAY EVENING', source: SEC, camera: [{ pos: [0.6, 1.6, 4.6], look: [0, 1.3, 0.1], mm: 45 }, { pos: [0.4, 1.55, 3.6], look: [0, 1.35, 0.1], mm: 50 }] }),
  S('bignumber', L(81), { value: 156, prefix: '$', suffix: 'M', label: 'Already advanced by Bache to cover the Hunts', kicker: 'BY THE MORNING OF 26 MARCH', note: '≈$22.3M A DAY', source: SEC, at: 0.4 }),
  S('counter', L(82), { preset: 'clock1215' }, { beats: [['Volcker', 'photo', { file: 'loc_volcker_senate_1983.jpg', caption: 'PAUL VOLCKER (PHOTO: 1983)', focus: [0.45, 0.35], zoom: 1.25 }]] }),
  S('boardroom', L(83), { stampAt: 'cuts', stampText: 'MARGIN $60K → $40K', docTitle: 'EMERGENCY MEETING', docDate: '26 MARCH 1980', source: SEC, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] }),
  S('figures', L(84), { figs: [OFFICIAL({ x: 0, label: 'BACHE', clip: 'idle_c' })], props: ['cashflow', 'plinth'], flow: { from: [-3, 1.2], to: [0.5, 0.5], at: 0.2, n: 8, period: 0.25 }, cam: 'orbit', caption: 'THE RULES CHANGED AGAIN' }),
  S('counter', L(85), { steps: [{ text: '$20.20', label: 'TUE 25 MAR' }, { text: '$15.80', label: 'WED 26 MAR', word: 'fifteen' }], kicker: 'SILVER · SPOT', source: SEC }),
  S('figures', L(86), { figs: [BUNKER({ x: -0.4, clip: 'phone', label: 'THE HUNTS', labelAt: 'Hunts' }), HERBERT({ x: 0.8, z: -0.5, clip: 'phone' })], props: ['desk', 'phone'], deskX: 0.2, deskZ: 0.8, phoneAt: [0.5, 0.76, 0.85], ringAt: 99, ring: false, cam: 'push', focusOn: 0, caption: 'STOPPING PAYMENT', source: SEC }),
  S('counter', L(87), { steps: [{ text: 'THU 27 MAR 1980', label: '' }], kicker: 'SILVER THURSDAY', source: SEC }),
  S('price-tower', L(88), { mode: 'crash', points: [{ label: '25 MAR', price: 20.20 }, { label: '26 MAR', price: 15.80 }], crashTo: 10.80, crashAt: 0.4, crashLabel: 'THU 27 MAR', caption: 'NO BUYER BIG ENOUGH', source: SEC }),
  S('counter', L(89), { steps: [{ text: '2:13 PM', label: 'NYSE HALTS TRADING IN BACHE STOCK' }, { text: '2:15 PM', label: 'SILVER FUTURES CLOSE', word: 'Two' }], kicker: 'THURSDAY 27 MARCH 1980', source: SEC }, { beats: [['close', 'photo', { file: 'loc_comex_floor_1978_b.jpg', caption: 'A COMMODITY PIT (PHOTO: c.1978)', focus: [0.6, 0.45], zoom: 1.2 }]] }),
  S('bignumber', L(90), { value: 122, prefix: '$', suffix: 'M', label: 'Bache’s unsecured loss on the Hunt accounts', kicker: '27 MARCH 1980', note: '84% OF BACHE GROUP’S NET WORTH', source: SEC, at: 0.2, red: true }),
  S('silver-chart', L(91), { mode: 'crash', at: 0.1, dayAt: 'third', peakAt: 'eighty', title: 'Silver Thursday' }),
  S('bignumber', L(92), { value: 1, prefix: '≈$', suffix: 'B', label: 'Lost by the Hunts on paper in one day', kicker: '27 MARCH 1980', source: 'SOURCE: TIME, 31 MAR 1980; OUR MATH', at: 0.2 }),
  S('quote', L(93), { text: 'We are not here to afford protection to large speculators or the shareholders of the firms that seek their business.', by: 'James Stone', role: 'Chairman, CFTC, March 1980', highlight: ['not', 'protection', 'speculators'], source: TIME }),
  S('counter', L(94), { steps: [{ text: '$434M', label: 'DUE MONDAY 31 MARCH', red: true }], kicker: 'TO ENGELHARD', source: SEC }),
  S('map', L(95), { mode: 'us', pins: [{ name: 'Dallas', lon: -96.8, lat: 32.78 }, { name: 'Boca Raton', lon: -80.08, lat: 26.37, word: 'Boca' }], routes: [['Dallas', 'Boca Raton']], hl: ['USA'], title: 'Reserve City Bankers convention', kicker: 'SUNDAY 30 MARCH 1980', source: SEC }),
  S('bailout', L(96), { mode: 'banks', banks: ['', ' ', '  '], noAt: ['say', 'say+0.25', 'say+0.5'], caption: 'AFTER MIDNIGHT', source: SEC }),
  S('vault', L(97), { mode: 'delivery', at: 'Engelhard', caption: 'PAID IN KIND', cardFoot: 'TO ENGELHARD: 8.5M OZ', source: SEC },
    { beats: [['Arctic', 'map', { mode: 'world', pins: [{ name: 'Beaufort Sea', lon: -140, lat: 71.5 }], hl: [], title: 'A fifth of their Beaufort Sea oil rights', kicker: 'THE ARCTIC', source: SEC }]] }),
  S('bailout', L(98), { at: 'billion', amount: '$1.1 BILLION', bankLabel: '13 BANKS', caption: 'THE RESCUE LOAN', source: SEC },
    { beats: [['Placid', 'oilfield', { mode: 'collateral', tagText: 'COLLATERAL', tagAt: 0.2, caption: 'PLACID OIL · SECURED ON OIL AND GAS', source: SEC }]] }),
  S('bignumber', L(99), { value: 4.6, decimals: 1, prefix: '$', suffix: 'B', label: 'The $1.1 billion loan in today’s money', kicker: 'IN SEPTEMBER-2026 DOLLARS', math: 'OUR MATH · BLS CPI', source: 'BLS CPI-U', at: 0.2 }),
  S('quote', L(100), { text: 'This was gambling.', by: 'Paul Volcker', role: 'Fed chairman, to Congress, 1980', highlight: ['gambling'], source: HSE },
    { beats: [['restructuring', 'quote', { text: 'There is no more money involved here. This is a restructuring.', by: 'Paul Volcker', role: 'Fed chairman, 1980', highlight: ['restructuring'], source: HSE }]] }),
  S('hero-bar', L(101), { from: 50, to: 14.05, at: 'fourteen', span: 1.8, red: true, label: 'SILVER · VALUED FOR THE LOAN', date: 'APRIL 1980', source: SEC }),
  S('cutaway', L(102), { keys: [{ pos: [16, 8, 30], look: [0, 4.4, -4], mm: 30 }, { pos: [20, 9, 36], look: [0, 4.4, -4], mm: 30 }] }),

  // ================= 6. UNDER OATH =================
  CH(6, 'Under Oath', 'Washington, 1980 – Dallas, 1988', { mood: 'melancholy', key: 'A', intensity: [0.3, 0.45] }),
  S('figures', L(103), { figs: [BUNKER({ x: -0.6, z: 0, ry: 0, clip: 'idle' }), HERBERT({ x: 0.6, z: 0, ry: 0, clip: 'idle_b' })], props: ['witness'], plate: 'HUNT', cam: 'low', focusOn: 0, caption: '2 MAY 1980 · UNDER OATH', source: HSE, camera: [{ pos: [0, 1.3, 5.6], look: [0, 1.2, 0], mm: 45 }, { pos: [0.2, 1.25, 4.6], look: [0, 1.25, 0], mm: 50 }] }),
  S('doc', L(104), { doc: 'testimony', at: 0.2 }),
  S('quote', L(105), { text: 'You don’t have a loss until you sell something.', by: 'Bunker Hunt', role: 'Sworn testimony, 2 May 1980', highlight: ['loss', 'sell'], source: HSE }),
  S('quote', L(106), { text: 'I think the problem is that we talk too much to each other and not enough to others.', by: 'Bunker Hunt', role: 'Sworn testimony, 2 May 1980', highlight: ['talk', 'each', 'other'], source: HSE }),
  S('airlift', L(107), { caption: 'A FORMER AIDE’S SWORN STORY', label: 'TO SWITZERLAND?', at: 0.4, takeoffAt: 99, source: HSE + ' (BLEDSOE STATEMENT, 23 MAY 1980)' }),
  S('airlift', L(108), { caption: 'THE HUNTS SWORE IT NEVER HAPPENED', label: 'NO RECORD OF ANY SHIPMENT', at: -3, takeoffAt: 0.3, source: HSE }),
  S('map', L(109), { mode: 'world', pins: [{ name: 'New York', lon: -74, lat: 40.7 }, { name: 'Lima', lon: -77.04, lat: -12.05, word: 'Peru' }], routes: [['Lima', 'New York']], hl: ['PER'], title: 'Minpeco v. Hunt', kicker: 'PERU’S STATE MINERALS COMPANY', source: 'SOURCE: LA TIMES / WASHINGTON POST, 1988' }),
  S('doc', L(110, 111), { doc: 'verdict', at: 'jury', highlight: ['CIVIL'] }),
  S('doc', L(112), { doc: 'bankruptcy', at: 0.2 }),
  S('heirlooms', L(113), { mode: 'coins', caption: '13,649 BYZANTINE COINS', source: 'SOURCE: TIME, 1988 (BANKRUPTCY FILING)' }),
  S('quote', L(114), { text: 'Hocking everything: horses, coins, land and lawn mowers.', by: 'The Wall Street Journal', role: 'Obituary of Herbert Hunt, 2024', highlight: ['everything'], source: 'SOURCE: WSJ, 2024' }),
  S('bignumber', L(115), { value: 10, prefix: '$', suffix: 'M', label: 'Penalty, plus a lifetime ban from commodities trading', kicker: 'CFTC SETTLEMENT · DECEMBER 1989', source: 'SOURCE: AP, 2014', at: 0.2 }),
  S('photo', L(116), { file: 'commons_lamar_hunt_1974.jpg', caption: 'LAMAR HUNT, 1974', focus: [0.5, 0.35], zoom: 1.15 }),
  S('figures', L(117), { figs: [BUNKER({ clip: 'idle_c', ry: 0 })], props: ['plinth'], cam: 'high', caption: 'NELSON BUNKER HUNT · 1926–2014', source: 'SOURCE: AP, 2014', camera: [{ pos: [2, 3, 6], look: [0, 1.0, 0], mm: 40 }, { pos: [4, 6, 10], look: [0, 0.8, 0], mm: 40 }] }),
  S('figures', L(118), { figs: [BUNKER({ x: -1.1, ry: 0.6, clip: 'idle_b' })], props: ['balance'], balanceAt: [1.0, 0, 0.3], tilt: -0.24, tiltAt: 'everything', cam: 'pair', caption: null }),

  // ================= 7. THE SWITCH =================
  CH(7, 'The Switch', '2011 – 2026', { mood: 'urgency', key: 'E', intensity: [0.35, 0.6] }),
  S('silver-chart', L(119, 120), { mode: 'long', at: 0.1, title: 'After 1980' }),
  S('figures', L(121), { figs: [{ w: 'casual_a', c: 'cyan', clip: 'phone', x: 0, z: 0, ry: 0.2 }], props: ['crowd'], crowdN: 14, cam: 'wide', caption: '2021 · #SILVERSQUEEZE', source: 'SOURCE: CME / PRESS REPORTS, FEB 2021' }),
  S('hero-bar', L(122), { from: 49.85, to: 50.5, at: 'fifty', span: 1.2, label: 'SILVER · $ PER OUNCE', date: 'OCTOBER 2025', source: 'SOURCE: PRESS REPORTS, OCT 2025' }),
  S('hero-bar', L(123), { from: 50, to: 121.64, at: 'record', span: 2.4, red: true, label: 'SILVER · SPOT RECORD', date: 'THU 29 JAN 2026', source: 'SOURCE: REUTERS', serial: 'Nº 2026-0129', spin: -30 }),
  S('bignumber', L(124), { value: 11, from: 9, roll: true, suffix: '%', label: 'CME silver margin, as a share of the contract', kicker: '28 JANUARY 2026', note: 'FROM 9%', source: 'SOURCE: CME VIA BLOOMBERG', at: 0.2 }),
  S('price-tower', L(125), { mode: 'crash', points: [{ label: 'OCT 2025', price: 50 }, { label: '29 JAN 2026', price: 121.64, red: true }], crashTo: 88.8, crashAt: 'twenty', crashText: 'FRI 30 JAN · <b style="color:#e0241b">−27% SPOT</b>', unit: 9, caption: 'SILVER · $ PER OUNCE', source: 'SOURCE: REUTERS (SPOT)' }),
  S('bignumber', L(126), { value: 15, from: 11, roll: true, suffix: '%', label: 'CME silver margin', kicker: '2 FEBRUARY 2026', note: 'FROM 11%', source: 'SOURCE: REUTERS', at: 0.2 }),
  S('figures', L(127), { figs: [{ w: 'casual_b', c: 'cyan', clip: 'idle', x: 0, z: 0, ry: 0 }], props: ['crowd'], crowdN: 16, cam: 'high', caption: 'NO HUNT THIS TIME', source: 'SOURCE: REUTERS, CNBC' }),
  S('silver-chart', L(128), { mode: 'real', at: 0.1, title: 'Adjusted for inflation' }),
  S('margin', L(129), { caption: 'WHO GETS TO STAY AT THE TABLE', loanLabel: 'BORROWED MONEY', colLabel: 'THE TRADE', lineLabel: 'MARGIN', drop: 0.55, at: 'Buyers', callAt: 'decides', callText: 'THE SWITCH', source: ILL, camera: [{ pos: [-6, 6, 18], look: [0, 2, 0], mm: 38 }, { pos: [2, 5, 16], look: [1, 2, 0], mm: 38 }] }),
  S('boardroom', L(130), { stampAt: 'pushed', stampText: 'MARGIN CUT', docTitle: 'TO SAVE A BROKER', docDate: '26 MARCH 1980', source: SEC, camera: [{ pos: [-12, 10, 16], look: [0, 2.6, 0], mm: 34 }, { pos: [-6.5, 8.5, 11], look: [0, 2.4, 0.3], mm: 40 }] },
    { mood: { mood: 'melancholy', key: 'E', intensity: [0.3, 0.45], ending: true } }),
  S('heirlooms', L(131), { mode: 'fork', caption: null, source: null }, { padOut: 1.6 }),
  { id: 'end', set: 'title', params: { lines: ['THE BROTHERS WHO', 'TRIED TO BUY', 'ALL THE SILVER'], sub: 'SOURCES IN THE DESCRIPTION' }, min: 5 },
];
for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;
const music = [];
for (const s of shots) { if (s.mood) music.push({ shot: s.id, ...s.mood }); delete s.mood; }

export default {
  title: 'The Brothers Who Tried to Buy All the Silver',
  fps: 60, width: 1920, height: 1080,
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', cutGuard: 1.5, crf: 22 },
  finish: { grain: 4 },
  voice,
  timing: { padIn: 0.15, padOut: 0.35 },
  shots,
  score: { key: 'E', transitions: scoreTransitions(shots), music },
};
