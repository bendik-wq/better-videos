// HOW THE AI BUBBLE POPS. Episode 8. Bright studio look + Reconstructed-style dioramas on a painted blue sky
// (the hero bubble, the circle of company towers, the Ohio campus), white clay data sets and the 2D ledger graphics.
// Narration is read straight from SCRIPT.md (numbered lines); every line was voiced once (projects/aibubble-vo,
// per-line ElevenLabs cache), so regrouping lines into shots reuses the audio. Facts: RESEARCH.md (§14 "Do not claim").
// 3D sets: sets/ai-sets.js (+ clay-silver.js figures). Graphics: SETS-graphics.md. Cuts and their sounds: cuts.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreTransitions } from './cuts.mjs';
import { voice } from '../aibubble-vo/project.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LINES = {};
for (const l of fs.readFileSync(path.join(here, 'SCRIPT.md'), 'utf8').split('\n')) { const m = l.match(/^(\d+)\. (.*)$/); if (m) LINES[+m[1]] = m[2].trim(); }
const L = (a, b = a) => { const out = []; for (let i = a; i <= b; i++) { if (!LINES[i]) throw new Error(`SCRIPT line ${i} missing`); out.push(LINES[i]); } return out.join('\n'); };

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title, sub, mood) => ({ id: `ch${num}`, set: 'chapter', params: { num, title, sub }, min: 4.0, chapter: num, mood });
const ILL = 'ILLUSTRATION', K8 = 'SOURCE: NVIDIA FORM 8-K, 17 AUG 2026', SPY = 'SOURCE: SPY HOLDINGS, 19 OCT 2026';
const NEVER = 99, DONE = -9; // domino cues: never falls in this shot / already down

const shots = [
  // ================= COLD OPEN: the bubble → the filing → the campus → the chip → the circle → Lucent → last week → you → pop =================
  S('bubble', L(1), { mode: 'reveal', caption: '17 AUGUST 2026' },
    { padIn: 0.3, mood: { mood: 'tension', key: 'D', intensity: [0.3, 0.5], riser: true }, beats: [['filing', 'doc', { doc: 'nvidia8k', at: 0.3 }]] }),
  S('campus', L(2), { pills: [{ text: 'TENANT: OPENAI', target: 'tenant', at: 'OpenAI' }, { text: 'GUARANTOR: NVIDIA', target: 'guarantor', at: 'cover', red: true }] },
    { beats: [['Up', 'bignumber', { value: 105, prefix: '$', suffix: 'B', label: 'Maximum Nvidia guarantees on the Ohio leases', kicker: 'NVIDIA 8-K · 17 AUG 2026', source: K8, at: 0.1, red: true }]] }),
  S('gpu', L(3), { label: 'NVIDIA', caption: 'INSIDE THE DATA CENTER' }),
  S('circle', L(4), { towers: ['NVIDIA', 'OPENAI'], radius: 8, keepPills: true, caption: 'NVIDIA ↔ OPENAI',
    flows: [{ from: 'OPENAI', to: 'NVIDIA', label: 'BUYS THE CHIPS', kind: 'buy', at: 'sells' }, { from: 'NVIDIA', to: 'OPENAI', label: 'OWNS A STAKE', kind: 'invest', at: 'owns' }, { from: 'NVIDIA', to: 'OPENAI', label: 'GUARANTEES THE RENT', kind: 'guarantee', at: 'guaranteeing' }],
    camera: [{ pos: [30, 13, 6], look: [0, 6, 0], mm: 32 }, { pos: [27, 12, -4], look: [0, 6.5, 0], mm: 34 }], source: K8 }),
  S('counter', L(5), { steps: [{ text: 'CUSTOMER', label: '', word: 'customer' }, { text: 'INVESTMENT', label: '', word: 'investment' }, { text: 'RISK', label: '', word: 'risk', red: true }], kicker: 'OPENAI IS NVIDIA’S', source: K8 }),
  S('circle', L(6), { towers: ['LUCENT', 'CARRIER', 'CARRIER ', 'CARRIER  '], radius: 10, seed: 3, keepPills: true, caption: '1999–2000',
    flows: [{ from: 'LUCENT', to: 'CARRIER', label: 'LOANS', kind: 'invest', at: 'lent' }, { from: 'CARRIER', to: 'LUCENT', label: 'BUYS LUCENT GEAR', kind: 'buy', at: 'buy' }],
    camera: [{ pos: [-8, 24, 34], look: [0, 3, 0], mm: 32 }, { pos: [6, 22, 32], look: [0, 3, 0], mm: 32 }], source: 'SOURCE: LUCENT 10-K FILINGS' }),
  S('ai-chart', L(7), { mode: 'lucent', at: 0.2 }),
  S('bubble', L(8), { mode: 'float', caption: 'LAST WEEK', seed: 5 }, { mood: { mood: 'urgency', key: 'D', intensity: [0.45, 0.6] },
    beats: [['Oracle', 'counter', { steps: [{ text: '−8.8%', label: 'ORACLE · 14 OCT', word: 'Oracle' }, { text: '−15%', label: 'COREWEAVE · 14 OCT', word: 'CoreWeave', red: true }], kicker: 'ONE DAY' }],
      ['South', 'map', { mode: 'world', pins: [{ name: 'Seoul', lon: 126.98, lat: 37.57 }], title: 'Kospi −7.6% · circuit breaker', kicker: '15 OCT 2026' }]] }),
  S('fund', L(9), { at: 'seven' }),
  S('bubble', L(10), { mode: 'pop', popAt: 'pop', seed: 7 }, { mood: { mood: 'urgency', key: 'D', intensity: [0.55, 0.7], riser: true, until: 'title' } }),
  { id: 'title', set: 'title', params: {}, min: 3.8, mood: { mood: 'wonder', key: 'D', intensity: 0.7, hit: true } },

  // ================= 1. THE BIGGEST BUILD IN HISTORY =================
  CH(1, 'The Biggest Build in History', 'The money going out', { mood: 'wonder', key: 'A', intensity: [0.3, 0.45] }),
  S('campus', L(11), { caption: 'THE BUILD', pills: [], camera: [{ pos: [-70, 60, 90], look: [4, 0, 2], mm: 30 }, { pos: [-40, 34, 60], look: [4, 0, 2], mm: 32 }] }),
  S('ai-chart', L(12, 13), { mode: 'capex', at: 0.3, title: 'Big Tech’s spending' }),
  S('ai-chart', L(14, 15), { mode: 'capex', at: 0, apolloAt: 'Apollo', title: 'Every six months, an Apollo program' }),
  S('campus', L(16), { caption: 'ONE GIGAWATT', pills: [{ text: '1 GW ≈ 800,000 US HOMES', target: 'power', at: 'eight' }], camera: [{ pos: [60, 30, 60], look: [20, 2, 6], mm: 34 }, { pos: [50, 26, 52], look: [18, 2, 6], mm: 36 }] },
    { beats: [['OpenAI', 'bignumber', { value: 30, suffix: ' GW', label: 'What OpenAI has talked about building', kicker: '≈ 24 MILLION HOMES’ WORTH', math: true, at: 0.1 }]] }),
  S('counter', L(17), { steps: [{ text: '2126', label: 'WHEN ALPHABET’S BOND IS PAID BACK', word: 'twenty-one' }], kicker: 'EVEN THE RICHEST ARE BORROWING' }),
  S('map', L(18), { mode: 'us', pins: [{ name: 'Richland Parish, LA', lon: -91.7, lat: 32.4 }], title: 'Meta’s $27B Louisiana data center', kicker: 'FUNDED THROUGH A SEPARATE COMPANY' },
    { beats: [['so', 'bignumber', { value: 27, prefix: '$', suffix: 'B', label: 'Bonds raised by a separate company, not on Meta’s balance sheet', kicker: 'HYPERION, LOUISIANA', at: 0.1 }]] }),
  S('figures', L(19), { figs: [{ w: 'casual_b', c: 'cyan', clip: 'look_around', x: 0, z: 0, ry: 0.2, label: 'SOMEONE', labelAt: 'someone' }], props: ['plinth'], cam: 'orbit', caption: 'ONE ASSUMPTION', sky: true }),

  // ================= 2. THE CIRCLE =================
  CH(2, 'The Circle', 'Follow the money', { mood: 'tension', key: 'D', intensity: [0.3, 0.5] }),
  S('circle', L(20), { caption: 'FOLLOW THE MONEY', camera: [{ pos: [-30, 20, 30], look: [0, 3, 0], mm: 30 }, { pos: [-12, 30, 42], look: [0, 2, 0], mm: 30 }] }),
  S('circle', L(21), { flows: [{ from: 'NVIDIA', to: 'OPENAI', label: 'UP TO $100B', kind: 'invest', at: 'invest' }, { from: 'OPENAI', to: 'NVIDIA', label: 'SPENT ON NVIDIA SYSTEMS', kind: 'buy', at: 'spent' }], hot: ['NVIDIA', 'OPENAI'], caption: 'SEPTEMBER 2025' }),
  S('doc', L(22), { doc: 'nvidia10k', at: 'no' }, { beats: [['replaced', 'bignumber', { value: 30, prefix: '$', suffix: 'B', label: 'The stake that replaced it', kicker: 'NVIDIA → OPENAI', at: 0.1 }]] }),
  S('campus', L(23), { caption: 'THE GUARANTEE', pills: [{ text: 'GUARANTOR: NVIDIA · UP TO $105B', target: 'guarantor', at: 'guarantee', red: true }], camera: [{ pos: [-34, 58, 78], look: [4, 0, 0], mm: 32 }, { pos: [-26, 52, 72], look: [4, 0, 0], mm: 32 }] }),
  S('circle', L(24), { flows: [{ from: 'OPENAI', to: 'ORACLE', label: '>$300B CLOUD (REPORTED)', kind: 'buy', at: 'signed' }, { from: 'ORACLE', to: 'NVIDIA', label: 'SERVERS & CHIPS', kind: 'buy', at: 'spends' }], hot: ['OPENAI', 'ORACLE', 'NVIDIA'], caption: 'OPENAI → ORACLE' }),
  S('doc', L(25), { doc: 'amdwarrant', at: 'right' }, { beats: [['for', 'bignumber', { value: 0.01, decimals: 2, prefix: '$', label: 'Price per AMD share, for up to 160 million shares', kicker: 'AMD → OPENAI WARRANT', at: 0.1, red: true }]] }),
  S('circle', L(26), { flows: [{ from: 'AMAZON', to: 'OPENAI', label: 'INVESTS $50B', kind: 'invest', at: 'investing' }, { from: 'OPENAI', to: 'AMAZON', label: '+$100B ON AMAZON’S CLOUD', kind: 'buy', at: 'expanded' }], hot: ['AMAZON', 'OPENAI'], caption: 'AMAZON ↔ OPENAI' }),
  S('circle', L(27), { flows: [{ from: 'MICROSOFT', to: 'OPENAI', label: '≈$12B INVESTED', kind: 'invest', at: 'put' }, { from: 'OPENAI', to: 'MICROSOFT', label: '$24B OF REVENUE', kind: 'buy', at: 'booked' }], hot: ['MICROSOFT', 'OPENAI'], caption: 'MICROSOFT ↔ OPENAI' }),
  S('doc', L(28), { doc: 'coreweave8k', at: 'promised' }, { beats: [['The', 'circle', { flows: [{ from: 'NVIDIA', to: 'COREWEAVE', label: 'BUYER OF LAST RESORT', kind: 'guarantee', at: 0.2 }], hot: ['NVIDIA', 'COREWEAVE'], caption: 'NVIDIA ↔ COREWEAVE' }]] }),
  S('dealmap', L(29), {}),
  S('figures', L(30), { figs: [{ w: 'suit_b', c: 'blue', clip: 'talk', x: 0, z: 0, ry: 0.3, label: 'THE SAME DOLLARS' }], props: ['cashflow', 'plinth'], flow: { from: [-3, 1.2], to: [0.5, 0.5], at: 0.4, n: 10, period: 0.3 }, cam: 'push', caption: 'COUNTED MORE THAN ONCE' }),
  S('counter', L(31), { steps: [{ text: '$112B', label: 'ALPHABET PROFIT · LAST QUARTER', word: 'Alphabet' }, { text: '$99B', label: 'FROM PAPER GAINS ON PRIVATE STAKES', word: 'Ninety', red: true }], kicker: 'ON $120B OF REVENUE' }),
  S('circle', L(32), { keepPills: false, flows: [
    { from: 'NVIDIA', to: 'OPENAI', label: 'INVESTS', kind: 'invest', at: 0.2 }, { from: 'OPENAI', to: 'ORACLE', label: 'BUYS CLOUD', kind: 'buy', at: 0.6 }, { from: 'ORACLE', to: 'NVIDIA', label: 'BUYS CHIPS', kind: 'buy', at: 1.0 },
    { from: 'AMAZON', to: 'OPENAI', label: 'INVESTS', kind: 'invest', at: 1.4 }, { from: 'OPENAI', to: 'MICROSOFT', label: 'BUYS CLOUD', kind: 'buy', at: 1.8 }, { from: 'AMD', to: 'OPENAI', label: 'SHARES FOR 1¢', kind: 'invest', at: 2.2 },
    { from: 'NVIDIA', to: 'COREWEAVE', label: 'BUYS UNSOLD CAPACITY', kind: 'guarantee', at: 2.6 }, { from: 'NVIDIA', to: 'OPENAI', label: 'GUARANTEES $105B', kind: 'guarantee', at: 'circle' }],
    camera: [{ pos: [0, 36, 34], look: [0, 1, 0], mm: 30 }, { pos: [0, 50, 20], look: [0, 0, 0], mm: 28 }], caption: 'FROM ABOVE' }, { mood: { mood: 'tension', key: 'D', intensity: [0.5, 0.65], hit: true } }),

  // ================= 3. THE GAP =================
  CH(3, 'The Gap', 'What comes in from outside', { mood: 'tension', key: 'F', intensity: [0.3, 0.45] }),
  S('bubble', L(33), { mode: 'float', seed: 9, pills: [{ text: 'MONEY FROM OUTSIDE?', word: 'outside', at: [0, 13, 0] }] }),
  S('figures', L(34, 35), { figs: [{ w: 'suit', c: 'red', clip: 'talk', x: 0, z: 0, ry: 0.3, label: 'SAM ALTMAN', labelAt: 'Sam' }], props: ['plinth'], cam: 'push', caption: 'THE CENTER OF THE CIRCLE', source: 'MANNEQUIN · ILLUSTRATION', sky: true }),
  S('ai-chart', L(36, 37), { mode: 'gap', at: 0.2, stepAt: NEVER }),
  S('ai-chart', L(38, 39), { mode: 'gap', at: 0, stepAt: 'scaled' }),
  S('ai-chart', L(40), { mode: 'gartner', at: 'eight' }),
  S('quote', L(41), { text: 'At the moment, we have more compute capacity than we have demand.', by: 'John-David Lovelock', role: 'Analyst, Gartner · 19 Oct 2026', highlight: ['more', 'compute', 'demand'], source: 'SOURCE: CNBC INTERVIEW (VIA REPORTS)' }),
  S('circle', L(42), { hot: ['ORACLE', 'COREWEAVE'], caption: 'THE BORROWERS', camera: [{ pos: [-44, 20, 14], look: [-12, 3, -4], mm: 34 }, { pos: [-40, 18, 4], look: [-12, 3, -4], mm: 36 }] }),
  S('doc', L(43), { doc: 'oracle10q', at: 'values' }),
  S('figures', L(44), { figs: [{ w: 'suit', c: 'red', clip: 'idle', x: 0, z: 0, ry: 0.2, label: 'LARRY ELLISON', labelAt: 'Larry' }], props: ['plinth'], cam: 'orbit', caption: '10 SEPTEMBER 2025', source: 'MANNEQUIN · ILLUSTRATION', sky: true },
    { beats: [['since', 'ai-chart', { mode: 'oracle', at: 0.1 }]] }),

  // ================= 4. THE LAST TIME =================
  CH(4, 'The Last Time', '1996–2002', { mood: 'melancholy', key: 'A', intensity: [0.25, 0.4] }),
  S('timeline', L(45), { focus: 2000 }),
  S('map', L(46), { mode: 'us', title: 'Fiber across America', kicker: 'THE LATE 1990s',
    pins: [{ name: 'New York', lon: -74.0, lat: 40.7 }, { name: 'Chicago', lon: -87.6, lat: 41.9 }, { name: 'Denver', lon: -105.0, lat: 39.7 }, { name: 'Los Angeles', lon: -118.2, lat: 34.05 }, { name: 'Dallas', lon: -96.8, lat: 32.8 }, { name: 'Atlanta', lon: -84.4, lat: 33.75 }],
    routes: [['New York', 'Chicago'], ['Chicago', 'Denver'], ['Denver', 'Los Angeles'], ['Los Angeles', 'Dallas'], ['Dallas', 'Atlanta'], ['Atlanta', 'New York']], source: ILL }),
  S('figures', L(47), { figs: [{ w: 'suit_b', c: 'blue', clip: 'talk', x: -1.0, z: 0, ry: 0.7, label: 'LUCENT', labelAt: 'Lucent' }, { w: 'office', c: 'cyan', clip: 'idle_b', x: 1.1, z: 0.2, ry: -0.7, label: 'ITS CUSTOMERS', labelAt: 'customers' }],
    props: ['cashflow'], flow: { from: [-0.8, 0.3], to: [0.9, 0.4], at: 'lent', n: 8, period: 0.3 }, cam: 'push', camera: [{ pos: [0.3, 1.7, 7.2], look: [0, 1.0, 0], mm: 40 }, { pos: [0.2, 1.6, 6.2], look: [0, 1.05, 0], mm: 42 }], caption: 'VENDOR FINANCING', source: ILL }),
  S('counter', L(48), { steps: [{ text: '$8.1B', label: 'LUCENT · COMMITTED TO CUSTOMERS', word: 'Lucent' }, { text: '>$5B', label: 'NORTEL', word: 'Nortel' }, { text: '≈$25B', label: 'ACROSS THE INDUSTRY', word: 'Across', red: true }], kicker: 'SEPTEMBER 2000', source: 'SOURCE: LUCENT 10-K; INDUSTRY ESTIMATE (McKINSEY, VIA REPORTS)' }),
  S('circle', L(49), { towers: ['LUCENT', 'CARRIER', 'CARRIER ', 'CARRIER  ', 'NORTEL', 'CARRIER   '], radius: 12, seed: 2, keepPills: false, caption: 'THE SUPPLIERS’ OWN MONEY',
    flows: [{ from: 'LUCENT', to: 'CARRIER ', label: 'LOAN', kind: 'invest', at: 0.3 }, { from: 'CARRIER ', to: 'LUCENT', label: 'SALES', kind: 'buy', at: 'Some' }, { from: 'NORTEL', to: 'CARRIER   ', label: 'LOAN', kind: 'invest', at: 'suppliers' }, { from: 'CARRIER   ', to: 'NORTEL', label: 'SALES', kind: 'buy', at: 'coming' }] }),
  S('doc', L(50), { doc: 'lucent10k', at: 'admitted' }),
  S('ai-chart', L(51), { mode: 'lucent', at: 0, title: 'From $84 to 58 cents' }, { mood: { mood: 'melancholy', key: 'A', intensity: [0.4, 0.5], hit: true } }),
  S('counter', L(52), { steps: [{ text: '≈ 1/3', label: 'NORTEL’S SHARE OF CANADA’S STOCK MARKET', word: 'Nortel' }, { text: 'BANKRUPT', label: '14 JAN 2009', word: 'bankrupt', red: true }], kicker: 'NORTEL', source: 'SOURCE: COURT FILINGS; TSX DATA (VIA REPORTS)' }),
  S('bignumber', L(53), { value: 89, prefix: '−', suffix: '%', label: 'Cisco’s fall from its 2000 peak', kicker: 'ONCE THE MOST VALUABLE COMPANY', note: '25+ YEARS TO GET BACK', at: 0.2, red: true }),
  S('ai-chart', L(54), { mode: 'nasdaq2000', at: 0.1 }),
  S('figures', L(55), { figs: [{ w: 'casual_a', c: 'cyan', clip: 'phone', x: 0, z: 0, ry: 0.2 }], props: ['crowd'], crowdN: 14, cam: 'high', caption: 'THE CABLES STAYED', sky: true, skyDisc: 9 }),
  S('counter', L(56), { steps: [{ text: 'SURVIVED', label: 'THE TECHNOLOGY', word: 'technology' }, { text: 'DIDN’T', label: 'THE INVESTORS', word: 'investors', red: true }], kicker: '2000–2002' }),

  // ================= 5. THE CRACKS =================
  CH(5, 'The Cracks', 'October 2026', { mood: 'urgency', key: 'D', intensity: [0.35, 0.5] }),
  S('bignumber', L(57, 58), { value: 5.8, decimals: 1, prefix: '$', suffix: 'T', label: 'Nvidia’s market value at the record close', kicker: '6 OCTOBER 2026', note: 'MORE THAN GERMANY’S GDP · A STOCK PRICE VS A YEAR OF OUTPUT', asof: '6 OCT 2026', at: 'Nvidia' }),
  S('counter', L(59), { steps: [{ text: '3.7%', label: 'US INFLATION · CPI', word: 'inflation' }, { text: '>5%', label: '10-YEAR TREASURY YIELD', word: 'interest', red: true }], kicker: 'TUESDAY 14 OCTOBER 2026' }),
  S('counter', L(60), { preset: 'oct14' }),
  S('counter', L(61), { preset: 'oct15' }, { beats: [['tripped', 'map', { mode: 'world', pins: [{ name: 'Seoul', lon: 126.98, lat: 37.57 }], title: 'Kospi −7.6%', kicker: 'WEDNESDAY 15 OCTOBER 2026', at: 0 }]] }),
  S('bignumber', L(62), { value: 15, prefix: '≈', suffix: '%', label: 'Yield on CoreWeave’s bonds', kicker: 'DEFAULT INSURANCE AT RECORDS', asof: '19 OCT 2026', at: 'bonds' }),
  S('ai-chart', L(63), { mode: 'october', at: 0.1 }),
  S('bubble', L(64, 65), { mode: 'needle', needleAt: 'crack', seed: 11 }, { mood: { mood: 'tension', key: 'D', intensity: [0.5, 0.6], riser: true } }),

  // ================= 6. HOW IT POPS =================
  CH(6, 'How It Pops', 'A chain, not a prediction', { mood: 'urgency', key: 'D', intensity: [0.45, 0.6] }),
  S('dominoes', L(66), { at: [NEVER, NEVER, NEVER, NEVER, NEVER, NEVER], camera: [{ pos: [-24, 9, 18], look: [-2, 3.4, 0], mm: 30 }, { pos: [-20, 8, 16], look: [-4, 3.4, 0], mm: 32 }] }),
  S('dominoes', L(67), { at: ['price', NEVER, NEVER, NEVER, NEVER, NEVER] }),
  S('dominoes', L(68), { at: [DONE, 'weakest', NEVER, NEVER, NEVER, NEVER] }, { beats: [['Nvidia', 'doc', { doc: 'nvidia10q', at: 0.2 }]] }),
  S('figures', L(69), { figs: [{ w: 'suit_b', c: 'blue', clip: 'phone', x: 0, z: 0, ry: 0.3, label: 'AN AI CLOUD' }], props: ['desk', 'phone'], deskX: 0.2, deskZ: 0.8, cam: 'push', caption: 'NO LOAN, NO CHIPS', source: ILL }),
  S('dominoes', L(70), { at: [DONE, DONE, 'builders', NEVER, NEVER, NEVER] }),
  S('dominoes', L(71), { at: [DONE, DONE, DONE, 'center', NEVER, NEVER] }),
  S('dominoes', L(72), { at: [DONE, DONE, DONE, DONE, 'guarantees', NEVER] }, { beats: [['Nvidia', 'doc', { doc: 'nvidia8k', at: 'satisfactory', focus: 'credit' }]] }),
  S('dominoes', L(73), { at: [DONE, DONE, DONE, DONE, DONE, 'you'] }, { beats: [['Nvidia', 'ai-chart', { mode: 'concentration', at: 0.1 }]], mood: { mood: 'tension', key: 'D', intensity: [0.6, 0.7], hit: true } }),
  S('gpu', L(74), { caption: 'THE OTHER SIDE', camera: [{ pos: [-6, 5, 8], look: [0, 0.2, 0], mm: 50 }, { pos: [-4.8, 4, 7], look: [0, 0.2, 0], mm: 55 }] }, { mood: { mood: 'wonder', key: 'G', intensity: [0.3, 0.45] } }),
  S('counter', L(75), { steps: [{ text: '≈$60B', label: 'NVIDIA PROFIT IN ONE QUARTER', word: 'Nvidia' }, { text: '27×', label: 'NVIDIA · PRICE ÷ EARNINGS', word: 'shares' }, { text: '>100×', label: 'CISCO · 2000', word: 'Cisco' }], kicker: 'NOT 2000' }),
  S('bignumber', L(76), { value: 17, prefix: '≈$', suffix: 'B', label: 'Anthropic revenue in a single quarter (reported)', kicker: 'FROM ≈$4.5B IN ALL OF 2025', at: 'nearly' }),
  S('quote', L(77), { text: 'There’s been a lot of talk about an AI bubble. From our vantage point, we see something very different.', by: 'Jensen Huang', role: 'CEO, Nvidia · 19 Nov 2025', highlight: ['very', 'different'], source: 'SOURCE: NVIDIA EARNINGS CALL' }),
  S('quote', L(78), { text: 'My opinion is yes.', by: 'Sam Altman', role: 'CEO, OpenAI · Aug 2025, asked if investors are overexcited about AI', highlight: ['yes'], source: 'SOURCE: THE VERGE' }),
  S('bubble', L(79), { mode: 'float', seed: 13, camera: null }),

  // ================= 7. THE TEST =================
  CH(7, 'The Test', 'Three things to watch', { mood: 'wonder', key: 'D', intensity: [0.3, 0.45] }),
  S('counter', L(80, 81), { steps: [{ text: '1 · SPENDING', label: 'BIG-TECH EARNINGS · NEXT FEW WEEKS', word: 'First' }], kicker: 'WATCH' }),
  S('circle', L(82), { hot: ['ORACLE', 'COREWEAVE'], caption: 'WATCH 2 · THE COST OF BORROWING', seed: 6, camera: [{ pos: [-44, 24, -16], look: [-12, 3, -4], mm: 34 }, { pos: [-42, 22, -6], look: [-12, 3, -4], mm: 36 }] }),
  S('circle', L(83), { towers: ['NVIDIA', 'AMD', 'MICROSOFT', 'OPENAI', 'AMAZON', 'ALPHABET', 'ORACLE', 'ANTHROPIC'], hot: ['OPENAI', 'ANTHROPIC'], caption: 'WATCH 3 · THE BOOKS OPEN', seed: 8 }),
  S('ai-chart', L(84), { mode: 'nasdaq2000', at: 0, title: 'The money machine around it' }, { mood: { mood: 'melancholy', key: 'D', intensity: [0.35, 0.5], ending: true } }),
  S('bubble', L(85), { mode: 'pop', popAt: 'money', seed: 7, needleAt: 0.2 }, { padOut: 1.6 }),
  { id: 'end', set: 'title', params: { lines: ['HOW THE', 'AI BUBBLE', 'POPS'], sub: 'SOURCES IN THE DESCRIPTION' }, min: 5 },
];
for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;
for (const s of shots) if (s.params?.camera === null) delete s.params.camera;
const music = [];
for (const s of shots) { if (s.mood) music.push({ shot: s.id, ...s.mood }); delete s.mood; }

export default {
  title: 'How the AI Bubble Pops',
  fps: 60, width: 1920, height: 1080,
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', cutGuard: 1.5, crf: 22 },
  finish: { grain: 4 },
  voice,
  timing: { padIn: 0.15, padOut: 0.35 },
  shots,
  score: { key: 'D', transitions: scoreTransitions(shots), music },
};
