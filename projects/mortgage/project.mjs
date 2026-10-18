// THE AUCTION THAT SETS YOUR MORTGAGE RATE. Episode 6. BRIGHT house style (docs/library/bright-style/STYLE.md).
// Narration is read straight from SCRIPT.md (numbered lines), so the script stays the single source of the VO.
// Every fact is in RESEARCH.md. 3D sets: SETS.md. Graphics sets: SETS-graphics.md. Cuts and their sounds: cuts.mjs.
// A shot's `mood` (extra) starts a music section; collected into score.music below.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreTransitions } from './cuts.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LINES = {};
for (const l of fs.readFileSync(path.join(here, 'SCRIPT.md'), 'utf8').split('\n')) {
  const m = l.match(/^(\d+)\. (.*)$/); if (!m) continue;
  LINES[+m[1]] = m[2].replace(/\*\*\([^)]*\)\*\*/g, '').replace(/\[↺\]|\[hit\]|⏱/g, '').replace(/\s+\|\s*$/, '').replace(/\s{2,}/g, ' ').trim();
}
// L(5) or L(5, 7): the narration of those script lines, joined with a beat.
const L = (a, b = a) => { const out = []; for (let i = a; i <= b; i++) { if (!LINES[i]) throw new Error(`SCRIPT line ${i} missing`); out.push(LINES[i]); } return out.join(' | '); };

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title, sub, mood) => ({ id: `ch${num}`, set: 'chapter', params: { num, title, sub }, min: 4.0, chapter: num, mood });
const R = 'RECONSTRUCTION';

const shots = [
  // ================= COLD OPEN: the oner (clock 12:59 → bids pour in → lock at 1:00 → 5.300% ticket → falls onto the house) =================
  S('cold-open', L(1, 6), {}, { padIn: 0.25, padOut: 0.5, min: 26, mood: { mood: 'tension', key: 'D', intensity: [0.35, 0.6], riser: true } }),
  S('rates', L(7), { mode: 'paradox', at: 'started', fromAt: 'six', riseAt: 'six+2', extend: false }, { padIn: 0.05 }),
  S('counter', L(8), { preset: 'paradox' }, { padIn: 0.05 }),
  S('vault', L(9), { move: 'reveal' }, { padIn: 0.05 }),
  S('counter', L(10), { preset: 'nov10' }, { padIn: 0.05, padOut: 0.6, mood: { mood: 'urgency', key: 'D', intensity: [0.5, 0.7], riser: true, until: 'title' } }),
  { id: 'title', set: 'title', params: {}, min: 3.6, mood: { mood: 'wonder', key: 'D', intensity: 0.7, hit: true } },

  // ================= 1. THE IOU =================
  CH(1, 'The IOU', 'How the auction works', { mood: 'wonder', key: 'G', intensity: [0.25, 0.45] }),
  S('debt-tower', L(11), { mode: 'grow', from: 30, to: 40.39, sub: 'U.S. DEBT · AS OF 15 OCT 2026' }),
  S('bignumber', L(12), { value: 1.99, prefix: '$', suffix: 'T', decimals: 2, label: 'Spent more than it collected, fiscal year 2026', kicker: 'US FEDERAL BUDGET · FY2026', note: '$7,395.8B OUT · $5,403.3B IN', source: 'SOURCE: MONTHLY TREASURY STATEMENT, SEP 2026', at: 'trillion' }),
  S('seesaw', L(13, 14), { at: 'ten', span: 2.4, tilt: 0, startTilt: 0, priceFrom: 1000, priceTo: 1000, yieldFrom: 4.625, yieldTo: 4.625, caption: 'AN IOU · $1,000 TODAY, BACK IN TEN YEARS' }),
  S('bignumber', L(15, 16), { value: 436, label: 'Treasury auctions in fiscal year 2026', kicker: 'US TREASURY · FY2026', note: 'MORE THAN ONE EVERY BUSINESS DAY', math: 'FISCAL DATA AUCTIONS FILE', at: 'four' }),
  S('doc', L(17, 18), { doc: 'offering', highlight: ['offering', 'closing'], at: ['thirty-nine', 'one'] }),
  S('bid-stack', L(19), { mode: 'arrive', caption: 'SEALED BIDS' }),
  S('counter', L(20), { steps: [{ text: '4.300%', label: 'A BID', word: 'interest' }, { text: '5.255%', label: 'A BID', word: 'thousandth' }], kicker: 'EVERY BID IS A YIELD', title: 'Down to 0.001%' }),
  S('doc', L(21), { doc: 'offering', highlight: 'max-award' }),
  S('doc', L(22, 23), { doc: 'offering', highlight: 'noncomp', at: 'ten' }),
  S('bid-stack', L(24, 25), { mode: 'sort', caption: 'SORTED · LOWEST RATE FIRST', sortAt: 'sorts' }),
  S('bid-stack', L(26, 27), { mode: 'cutoff', from: 'fill', fillAt: 'filling', cutAt: 'last', caption: 'THE LAST BID ACCEPTED SETS THE RATE' }),
  S('bid-stack', L(28), { mode: 'single-price', from: 'single-price', priceAt: 'Everyone', caption: 'EVERYONE GETS THE SAME RATE' }),
  S('doc', L(29), { doc: 'result', highlight: ['high-yield', 'allotted'], at: ['five', 'half'] }),
  S('doc', L(30), { doc: 'result', highlight: 'coupon', at: 'four' }),
  S('seesaw', L(31, 33), { at: 'less', span: 2.6 }),
  S('seesaw', L(34, 35), { at: 'prices', span: 1.6, tilt: 14, startTilt: 0.6, caption: 'PRICES FALL · YIELDS RISE' }),
  S('house-block', L(36, 37), { mode: 'idle', view: 'wide', rate: '?', lot: 'WHO BIDS?' }, { mood: { mood: 'mystery', key: 'G', intensity: [0.3, 0.45] } }),
  S('pipe', L(38), { mode: 'flow', caption: 'FUNDS · PENSIONS · CENTRAL BANKS' }),
  S('bidders', L(39), { lowAt: 'smallest', coverAt: 'smallest+2' }),
  S('bidders', L(40, 42), { mode: 'demand', at: 'hundred', at2: 'thirty-nine' }, { mood: { mood: 'tension', key: 'G', intensity: [0.4, 0.6] } }),
  S('suburb', L(43), { mode: 'payment', cam: 0, payments: ['+$301/mo', '7.40%', '+$301/mo', '7.40%'] }, { padOut: 0.6 }),

  // ================= 2. THE PIPE =================
  CH(2, 'The Pipe', 'From the auction to your front door', { mood: 'wonder', key: 'C', intensity: [0.3, 0.5] }),
  S('suburb', L(44), { mode: 'wide', cam: 1 }),
  S('pipe', L(45, 46), { mode: 'flow', at: 'bundled', caption: 'YOUR LOAN · BUNDLED' }),
  S('pipe', L(47, 48), { mode: 'compare', at: 'choice' }),
  S('house-block', L(49), { mode: 'tag', view: 'hero', at: 'Homeowners', rate: 'RISK', lot: 'LOT 2' }),
  S('pipe', L(50), { mode: 'spread', from: 0, spread: 2.3, at: 'more' , caption: 'INVESTORS WANT MORE' }),
  S('pipe', L(51, 52), { mode: 'prepay', at: 'refinance' }),
  S('quote', L(53), { text: '“…largely reflects the price of the prepayment option.”', by: 'FEDERAL RESERVE BANK OF BOSTON', role: 'CURRENT POLICY PERSPECTIVES 26-3 · 19 MAY 2026', source: 'SOURCE: BOSTON FED (S27)', highlight: ['price', 'prepayment'] }),
  S('rates', L(54), { mode: 'tenyear', at: 'spread' }, { mood: { mood: 'wonder', key: 'C', intensity: [0.35, 0.5] } }),
  S('suburb', L(55, 56), { mode: 'forsale', cam: 0, at: 'move' }),
  S('quote', L(57), { text: '“…tends to be much closer to 10 years.”', by: 'FEDERAL RESERVE BANK OF ST. LOUIS', role: 'PAGE ONE ECONOMICS · 1 OCT 2026', source: 'SOURCE: ST. LOUIS FED (S26)', highlight: ['closer', '10'] }),
  S('pipe', L(58, 59), { mode: 'spread', from: 2.3, spread: 2.3, at: 'benchmark', mortRate: '≈7.4%', tsyRate: '≈5.3%', caption: '10-YEAR + SPREAD' }),
  S('vault', L(60, 61), { move: 'wide' }, { mood: { mood: 'tension', key: 'C', intensity: [0.35, 0.55] } }),
  S('quote', L(62, 63), { text: '“You don’t usually see immediate movement in mortgage interest rates.”', by: 'FEDERAL RESERVE BANK OF ST. LOUIS', role: 'PAGE ONE ECONOMICS · 1 OCT 2026', source: 'SOURCE: ST. LOUIS FED (S26)', highlight: ['immediate'] }),
  S('bid-stack', L(64), { mode: 'cutoff', from: 'cutoff', cutAt: 0.2, caption: 'THE AUCTION SETS THE PRICE' }),
  S('rates', L(65, 67), { mode: 'paradox', at: 'started', riseAt: 'rose', extendAt: 'all' }),
  S('rates', L(68), { mode: 'today', hikeAt: 'raised' }),
  S('house-block', L(69), { mode: 'idle', view: 'close', rate: '7.40%' }),
  S('payment', L(70, 72), { at: 'seven', deltaAt: 'Three', totalAt: 'Three+3' }, { mood: { mood: 'urgency', key: 'C', intensity: [0.45, 0.65] } }),
  S('payment', L(73), { variant: 'base', at: 0.2, deltaAt: 0.4, totalAt: 'thirty', title: 'Over thirty years' }),
  S('payment', L(74), { variant: '3pct', at: 'three' }),
  S('house-block', L(75), { mode: 'rate', from: '3.00%', to: '7.40%', at: 'number', span: 2 }, { padOut: 0.6 }),

  // ================= 3. WHEN THE BOND MARKET SAYS NO =================
  CH(3, 'When the Bond Market Says No', '1929 · 1994 · 2022', { mood: 'mystery', key: 'A', intensity: [0.3, 0.5] }),
  S('timeline', L(76), {}),
  S('timeline', L(77), { focus: '1929', title: 'December 1929' }),
  S('doc', L(78, 79), { doc: '1929', highlight: ['deadline', 'amount'], at: ['two', 'hundred'] }),
  S('quote', L(80), { text: '“Entirely satisfied.”', by: 'UNDER SECRETARY MILLS', role: 'US TREASURY · DEC 1929', source: 'SOURCE: GARBADE (FRBNY, 2008), CITING NYT/WSJ (S45)', highlight: ['satisfied'] }),
  S('timeline', L(81, 82), { focus: ['1983', '1993'], title: 'The bond market vs Washington' }),
  S('quote', L(83), { text: '“I used to think if there was reincarnation, I wanted to come back as the president or the pope or a .400 baseball hitter. But now I want to come back as the bond market. You can intimidate everybody.”', by: 'JAMES CARVILLE', role: 'WALL STREET JOURNAL · 25 FEB 1993, VIA FRBSF', source: 'SOURCE: ROSE & SPIEGEL, FRBSF WP 2015-09 (S54)', highlight: ['bond', 'intimidate'], size: 0.8 }, { mood: { mood: 'tension', key: 'A', intensity: [0.4, 0.6] } }),
  S('quote', L(84, 85), { text: '“I did coin the term ‘Bond Vigilantes’ in 1983.”', by: 'ED YARDENI', role: 'YARDENI RESEARCH · 22 AUG 2023', source: 'SOURCE: YARDENI RESEARCH (S55)', highlight: ['Vigilantes'] }),
  S('rates', L(86, 87), { mode: 'history', from: '1979', focus: '1994', focusAt: 'February' }),
  S('quote', L(88), { text: '“1994 became the year of the worst bond market loss in history.”', by: 'AL EHRBAR', role: 'FORTUNE · 17 OCT 1994', source: 'SOURCE: FORTUNE (S47)', highlight: ['worst'] }),
  S('map', L(89, 90), { mode: 'us', at: 'lost' }),
  S('map', L(91, 93), { mode: 'uk', at: 'three' }, { mood: { mood: 'urgency', key: 'A', intensity: [0.5, 0.7] } }),
  S('quote', L(94, 95), { text: '“…a move three times larger than any other historical move over a similar period.”', by: 'BANK OF ENGLAND', role: 'QUARTERLY BULLETIN 2023', source: 'SOURCE: BANK OF ENGLAND (S51)', highlight: ['three', 'times'] }),
  S('bignumber', L(96), { value: 19.3, prefix: '£', suffix: 'bn', decimals: 1, label: 'Government bonds bought by the Bank of England', kicker: '28 SEP – 14 OCT 2022', source: 'SOURCE: BANK OF ENGLAND (S51, S52)', at: 'nineteen' }),
  S('quote', L(97, 98), { text: '“…on whatever scale is necessary.”', by: 'BANK OF ENGLAND', role: '28 SEP 2022', source: 'SOURCE: BANK OF ENGLAND (S50)', highlight: ['whatever'] }),
  S('house-block', L(99), { mode: 'sold', view: 'gavel', at: 'price', rate: '?', stamp: 'PRICED', lot: 'LOT 3' }),
  S('rates', L(100), { mode: 'history', from: '1962', at: 0.3 }),
  S('rates', L(101, 103), { mode: 'auctions', series: 30, markAt: 'November' }),
  S('bidders', L(104, 105), { lowAt: 'almost', coverAt: 'queued', kicker: '7 OCT 2026 · THE OPPOSITE' }),
  S('suburb', L(106), { mode: 'quiet', cam: 2 }, { padOut: 0.7 }),

  // ================= 4. THE PRICE OF FORTY TRILLION =================
  CH(4, 'The Price of Forty Trillion', 'Why bidders want more', { mood: 'tension', key: 'F', intensity: [0.3, 0.5] }),
  S('debt', L(107, 108), { mode: 'counter', at: 'owes' }),
  S('debt-tower', L(109), { mode: 'grow', from: 37.94, to: 40.39, at: 0.2, sub: '+$2.45T IN ONE YEAR · OUR MATH' }),
  S('debt', L(110, 111), { mode: 'interest', at: 'interest', fifthAt: 'dollar' }),
  S('debt-tower', L(112, 113), { mode: 'rollover', at: 'third', rolled: 10.64 }, { mood: { mood: 'urgency', key: 'F', intensity: [0.45, 0.65], clock: true } }),
  S('debt', L(114, 115), { mode: 'wall', at: 'IOUs' }),
  S('debt', L(116, 118), { mode: 'rates', at: 'three', at2: 'Five' }),
  S('bignumber', L(119), { value: 31.28, prefix: '$', suffix: 'T', decimals: 2, label: 'Sold at Treasury auctions in fiscal year 2026', kicker: 'US TREASURY · FY2026', note: 'MOSTLY SHORT-TERM BILLS, ROLLED OVER', math: 'FISCAL DATA AUCTIONS FILE · EXCL. FED ADD-ONS', at: 'thirty-one' }),
  S('debt-tower', L(120, 122), { mode: 'interest', at: 'bill' }),
  S('vault', L(123, 124), { move: 'reveal', label: 'NO NEW 10-YEAR NOTES' }),
  S('holders', L(125, 127), { japanAt: 'hundred', totalAt: 'Britain' }),
  S('bignumber', L(128), { value: 3.28, prefix: '$', suffix: 'T', decimals: 2, label: 'Treasuries held by US money market funds', kicker: 'FED Z.1 · Q2 2026', note: 'THE BIGGEST DOMESTIC BUYER OF BILLS', source: 'SOURCE: FEDERAL RESERVE Z.1 VIA FRED (S39)', at: 'three' }),
  S('bid-stack', L(129, 130), { mode: 'cutoff', from: 'arrive', arriveSpan: 2.4, sortSpan: 2.4, fillSpan: 2.4, cutAt: 'high', caption: 'HUGE DEMAND · AT A HIGH PRICE' }),
  S('counter', L(131, 132), { preset: 'today' }, { padOut: 0.6 }),

  // ================= 5. THE COUNTDOWN (climax) =================
  CH(5, 'The Countdown', 'Tuesday, 10 November · 1:00 p.m.', { mood: 'tension', key: 'D', intensity: [0.35, 0.55], clock: true }),
  S('suburb', L(133, 135), { mode: 'locked', cam: 0, at: 'half' }),
  S('suburb', L(136, 137), { mode: 'forsale', cam: 1, count: 2, at: 'Fewer' }),
  S('bignumber', L(138), { value: 3.99, suffix: 'M', decimals: 2, label: 'Existing-home sales, annual rate', kicker: 'NAR · SEP 2026', asof: 'SEP 2026', source: 'SOURCE: NATIONAL ASSOCIATION OF REALTORS VIA FRED (S41)', at: 'four' }),
  S('payment', L(139, 141), { variant: 'median', at: 'twenty', deltaAt: 'hundred@1' }, { mood: { mood: 'urgency', key: 'D', intensity: [0.5, 0.7] } }),
  S('calendar', L(142, 145), { at: 'Wednesday' }),
  S('calendar', L(146, 147), { at: 0.2, clockAt: 'Tuesday', tick: true }),
  S('calendar', L(148, 150), { mode: 'travel' }),
  S('house-block', L(151, 153), { mode: 'rate', from: '7.40%', to: '?', at: 'falls', span: 3, view: 'close' }, { mood: { mood: 'urgency', key: 'D', intensity: [0.65, 0.85], riser: true } }),
  S('bid-stack', L(154, 155), { mode: 'arrive', arriveAt: 0.3, caption: 'TUE 10 NOV · SEALED BIDS' }),
  S('counter', L(156, 158), { preset: 'clock', steps: [{ text: '12:59', label: 'TUE 10 NOV', word: 'Twelve' }, { text: '1:00', label: 'THE BIDS LOCK', word: 'One', red: true }] }, { padOut: 0.9, mood: { mood: 'silence' } }),

  // ================= RESOLUTION =================
  S('suburb', L(159, 160), { mode: 'wide', cam: 0 }, { mood: { mood: 'melancholy', key: 'D', intensity: [0.3, 0.45] } }),
  S('pipe', L(161, 162), { mode: 'compare', at: 'strangers', caption: 'BIDDING FOR THE RIGHT TO BE PAID' }),
  S('vault', L(163, 165), { move: 'wide', label: 'THE AUCTION · TEN YEARS' }, { mood: { mood: 'triumph', key: 'D', intensity: [0.35, 0.55], ending: true } }),
  S('house-block', L(166), { mode: 'sold', view: 'hero', at: 'sold', rate: '5.3%' }, { padOut: 1.4 }),
  { id: 'end', set: 'title', params: { lines: ['THE AUCTION', 'THAT SETS YOUR', 'MORTGAGE RATE'], sub: 'SOURCES IN THE DESCRIPTION' }, min: 5 },
];
for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;
const music = [];
for (const s of shots) { if (s.mood) music.push({ shot: s.id, ...s.mood }); delete s.mood; }

// Voice: ElevenLabs when a key with text-to-speech permission is present, else the offline Pocket TTS narrator.
const EL = process.env.ELEVENLABS_API_KEY && process.env.BV_VOICE !== 'pocket';
const voice = EL
  ? { engine: 'elevenlabs', voiceId: process.env.BV_VOICE_ID || 'nPczCjzI2devNBz1zQrb', model: process.env.BV_EL_MODEL || 'eleven_v3',
      settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true }, takes: 3, parallel: 3, say: { NOAA: 'Noah' } }
  : { engine: 'pocket', voice: 'stuart_bell', tempo: 1.04, beat: 0.24 };

export default {
  title: 'The Auction That Sets Your Mortgage Rate',
  fps: 60, width: 1920, height: 1080,
  settings: { fps: 60, aa: 'fxaa', look: 'bright-model', cutGuard: 1.5, crf: 20 },
  voice,
  timing: { padIn: 0.15, padOut: 0.4 },
  shots,
  score: { key: 'D', transitions: scoreTransitions(shots), music },
};
