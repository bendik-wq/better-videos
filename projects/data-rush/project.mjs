// THE DATA RUSH: Why Google paid $10 million for a dead airline's emails.
// Episode 1. Sources are listed in projects/data-rush/SOURCES.md; every number in the VO is in there.
//
// Each shot: { id, set, vo?, params?, min? }. Shot length follows the narration.
// Visual beats key off words in the VO via params (see scene.js: at(shot, 'word')).

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title) => ({ id: `ch${num}`, set: 'chapter', params: { num, title }, min: 4, chapter: num });

const shots = [
  // ---------------- COLD OPEN ----------------
  S('plane', 'In May of twenty twenty-six, Spirit Airlines stopped flying.', { mode: 'wide', caption: 'SPIRIT AIRLINES · CEASED OPERATIONS · MAY 2026' }, { padIn: 1.2 }),
  S('plane', 'The planes were parked. The gates were handed back. The uniforms went into storage.', { mode: 'lightsOff' }),
  S('plane', 'But in a bankruptcy court, something else went up for sale. Something nobody would have bid a dollar on five years ago.', { mode: 'tail' }),
  S('messages', 'A hundred million emails. Five hundred million Microsoft Teams messages. Thirty million lines of code.', {
    counters: [{ word: 'hundred', value: 100, unit: 'M', label: 'EMAILS' }, { word: 'five', value: 500, unit: 'M', label: 'TEAMS MESSAGES' }, { word: 'thirty', value: 30, unit: 'M', label: 'LINES OF CODE' }] }),
  S('messages', 'Every spreadsheet. Every calendar invite. Every argument about a delayed flight. The entire nervous system of a company that no longer exists.', { mode: 'drift' }),
  S('bars', 'Google bid ten million dollars for it.', { title: 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026', items: [{ label: 'Google', value: 10, word: 'ten' }], max: 13, source: 'SOURCE: TIME, AUG 25 2026' }),
  S('bars', 'Mercor, a startup that supplies data and experts to AI labs, bid seven and a half million.', { title: 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026', items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5, word: 'seven' }], max: 13, source: 'SOURCE: TIME, AUG 25 2026' }),
  S('bars', 'And a company called micro1 came in with twelve and a half.', { title: 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026', items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5 }, { label: 'micro1', value: 12.5, word: 'twelve', red: true }], max: 13, source: 'SOURCE: TIME, AUG 25 2026 · micro1 BID ARRIVED AFTER THE AUCTION CLOSED' }),
  S('hero', 'Twelve and a half million dollars. For the emails of an airline that went out of business.', { prop: 'drive', caption: 'FIG. 1  ONE COMPANY’S OPERATING HISTORY', cam: 'push' }),
  S('hero', 'It sounds insane. It isn’t. It might be the most rational thing happening in business right now.', { prop: 'drive', cam: 'orbit' }),
  S('name', 'Because the most valuable thing many companies own isn’t on their balance sheet. And one man figured that out twenty years before almost anyone else.', { name: '', role: '' }),
  S('name', 'His name is Peter Thiel.', { name: 'Peter Thiel', role: 'CO-FOUNDER, PAYPAL · PALANTIR · FOUNDERS FUND', word: 'peter' }),
  S('orb', 'And if you own a business, what he understood is about to be worth a lot of money to you. But probably not for long.', { mode: 'dim' }),
  { id: 'title', set: 'title', params: { title: 'The Data Rush', sub: 'WHY AI COMPANIES ARE BUYING THE INSIDES OF ORDINARY BUSINESSES' }, min: 5.2 },

  // ---------------- 1. THE ORACLE ----------------
  CH(1, 'The Oracle'),
  S('timeline', 'In the year two thousand, PayPal was bleeding.', { events: [{ year: 2000, label: 'PAYPAL' }], focus: 0 }),
  S('hero', 'Fraudsters, including organised crime rings, were stealing through the platform at a rate of millions of dollars a month. It was enough to kill the company.', { prop: 'cards', cam: 'top', tint: 'red' }),
  S('network', 'PayPal didn’t fight back with more people. It fought back with data. Its engineers built software that let analysts and machines hunt for patterns together. The same card. The same address. The same strange rhythm of transactions.', { mode: 'fraud' }),
  S('timeline', 'It worked. PayPal survived. In two thousand and two, eBay bought it for one and a half billion dollars.', { events: [{ year: 2000, label: 'PAYPAL' }, { year: 2002, label: 'EBAY BUYS PAYPAL · $1.5B', word: 'ebay' }], focus: 1 }),
  S('hero', 'Thiel walked away with tens of millions of dollars. And one idea.', { prop: 'coins', cam: 'push' }),
  S('quote', 'If software could find criminals hiding inside payment data, it could find almost anything, inside almost any data.', { text: 'If software could find criminals inside payment data, it could find anything.', by: 'THE IDEA BEHIND PALANTIR', paraphrase: true }),
  S('orb', 'In two thousand and three, he co-founded Palantir. It’s named after the seeing stones in The Lord of the Rings. Objects that let you watch what others can’t see.', { mode: 'reveal', caption: 'PALANTIR TECHNOLOGIES · FOUNDED 2003', word: 'palantir' }),
  S('orb', 'One of its earliest backers was In-Q-Tel. The venture capital arm of the CIA.', { mode: 'cia', caption: 'EARLY BACKER: IN-Q-TEL (CIA)' }),
  S('corridor', 'For years, Palantir sold to spies, soldiers and police departments, and to very few others. Critics called it a consulting firm pretending to be a software company.', { color: 'blue' }),
  S('corridor', 'Then the AI boom arrived. And suddenly, every large company on earth wanted what Palantir had spent two decades building. A way to point intelligence at their own private data.', { color: 'blue', speed: 1.4 }),
  S('hero', 'Palantir became one of the most valuable software companies in the world.', { prop: 'orbSmall', cam: 'rise', caption: 'PALANTIR · NASDAQ: PLTR' }),
  S('network', 'Its pitch was simple. Every large organisation is drowning in data that lives in separate systems. Palantir connects it into a single model of how the organisation actually works. Who did what. What depends on what. What happens next.', { mode: 'ontology' }),
  S('hero', 'Palantir calls that model the Ontology. A map of an organisation\u2019s operations, built from its own records. Remember that idea too. Because it is exactly what the AI labs now want to buy.', { prop: 'orbSmall', cam: 'orbit', caption: 'PALANTIR · \u201cTHE ONTOLOGY\u201d' }),
  S('quote', 'But Thiel’s real bet was never one company. It was a principle. He wrote it down in his book, Zero to One.', { text: '', by: '', book: true }),
  S('quote', 'Every great business is built around a secret that’s hidden from the outside.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE · 2014' }, { padOut: 1.2 }),
  S('quote', 'Hold on to that sentence. It’s about to matter.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE · 2014', dim: true }),

  // ---------------- 2. THE WALL ----------------
  CH(2, 'The Wall'),
  S('wall', 'Every AI model you have ever used was built in roughly the same way. Feed it text. More text than a human could read in ten thousand lifetimes.', { mode: 'full' }),
  S('wall', 'Books. Wikipedia. Forums. News sites. Code. Essentially the entire public internet, scraped, cleaned, and poured in.', { mode: 'full', words: ['Books', 'Wikipedia', 'Forums', 'News', 'Code'] }),
  S('wall', 'For a few years, that was enough. Then researchers started doing the maths.', { mode: 'full' }),
  S('wall', 'In twenty twenty-four, the research group Epoch AI estimated that AI companies would use up the stock of high-quality public text sometime between twenty twenty-six and twenty thirty-two.', { mode: 'dimming', caption: 'EPOCH AI · 2024 · PUBLIC TEXT EXHAUSTED: 2026–2032' }),
  S('wall', 'The internet is enormous. But it isn’t infinite. And every major lab has already read it.', { mode: 'dark' }),
  S('hero', 'So the labs started buying.', { prop: 'briefcase', cam: 'push' }),
  S('bars', 'Google agreed to pay Reddit a reported sixty million dollars a year for access to its posts.', { title: 'AI DATA LICENSING DEALS (REPORTED)', items: [{ label: 'Reddit → Google', value: 60, word: 'sixty', display: '$60M / yr' }], max: 260, source: 'SOURCE: REUTERS, 2024' }),
  S('bars', 'OpenAI signed a deal with News Corp reportedly worth two hundred and fifty million dollars over five years.', { title: 'AI DATA LICENSING DEALS (REPORTED)', items: [{ label: 'Reddit → Google', value: 60, display: '$60M / yr' }, { label: 'News Corp → OpenAI', value: 250, word: 'two', display: '$250M / 5 yrs' }], max: 260, source: 'SOURCE: WSJ, 2024' }),
  S('hero', 'Not everyone agreed to sell. In December twenty twenty-three, The New York Times sued OpenAI and Microsoft, accusing them of using millions of its articles without permission.', { prop: 'gavel', cam: 'top', caption: 'NYT v. OPENAI & MICROSOFT · DEC 2023' }),
  S('wall', 'Data had become a legal minefield. Labs that once scraped freely now needed data they could prove they had the right to use. Licensed data. Clean data. Data with a paper trail.', { mode: 'dimming' }),
  S('hero', 'Then came the deal that showed how serious this had become.', { prop: 'chip', cam: 'orbit' }),
  S('numbers', 'In June twenty twenty-five, Meta paid about fourteen point three billion dollars for forty-nine percent of Scale AI. A company whose core business was producing and labelling training data.', {
    header: 'META × SCALE AI · JUNE 2025', items: [{ value: 14.3, prefix: '$', suffix: 'B', dec: 1, word: 'fourteen', sub: 'invested' }, { value: 49, suffix: '%', dec: 0, word: 'forty', sub: 'stake' }], source: 'SOURCE: CNBC / FORTUNE, JUNE 2025' }),
  S('timeline', 'And who led Scale AI’s big funding round back in twenty nineteen, when it first crossed a billion-dollar valuation?', { events: [{ year: 2019, label: 'SCALE AI SERIES C · $1B+' }, { year: 2025, label: 'META · $14.3B FOR 49%' }], focus: 0 }),
  S('name', 'Peter Thiel’s Founders Fund.', { name: 'Founders Fund', role: 'LED SCALE AI’S 2019 SERIES C', word: 'founders' }),
  S('network', 'Founders Fund was the first institutional investor in Palantir. It holds stakes in OpenAI and Anthropic. It backed the company that sells data to the labs.', { mode: 'thiel', reveal: [['palantir', 'Palantir'], ['openai', 'OpenAI'], ['anthropic', 'Anthropic'], ['backed', 'Scale AI']] }),
  S('network', 'Follow the money, and it keeps arriving at the same place. Whoever controls the data.', { mode: 'thiel', all: true, pulse: true }),
  S('quote', 'In September twenty twenty-six, Thiel put it bluntly. A.I. is bigger than the internet.', { text: 'AI is bigger than the internet.', by: 'PETER THIEL · SEPTEMBER 2026', word: 'bigger' }),
  S('wall', 'But the data that built the first wave of AI is running out. So where does the next wave come from?', { mode: 'dark', question: true }),
  S('hero', 'One answer is synthetic data. AI generating training material for other AI. It helps. But in twenty twenty-four, a study published in Nature showed that models trained again and again on machine-generated data can degrade. Researchers called it model collapse.', { prop: 'chip', cam: 'push', caption: 'NATURE · 2024 · \u201cMODEL COLLAPSE\u201d' }),
  S('wall', 'Synthetic data still needs real data to anchor it. Real human decisions. Real work. And the richest untouched supply of that isn\u2019t on the internet at all.', { mode: 'dark' }),

  // ---------------- 3. THE SECRET ----------------
  CH(3, 'The Secret'),
  S('hero', 'Here is what changed. AI isn’t just answering questions anymore.', { prop: 'chip', cam: 'push' }),
  S('list', 'The labs are building agents. Systems that are meant to do actual work. Process an insurance claim. Schedule a crew. Close the books at month end. Run a dispatch desk.', { items: [['process', 'Process an insurance claim'], ['schedule', 'Schedule a crew'], ['close', 'Close the books'], ['run', 'Run a dispatch desk']], header: 'WHAT AI AGENTS ARE BEING TRAINED TO DO' }),
  S('wall', 'And you can’t learn how work actually gets done from Wikipedia.', { mode: 'dark' }),
  S('archive', 'The internet is full of what people say. It contains almost nothing about how a real company runs. The hand-offs. The exceptions. The approvals.', { cam: 'aisle' }),
  S('archive', 'The Tuesday afternoon problem that only one person in accounting knows how to fix.', { cam: 'desk' }),
  S('archive', 'That knowledge lives in one place. Inside companies. In their documents, their tickets, their processes and their internal messages.', { cam: 'rise' }),
  S('messages', 'This is why Google wanted an airline’s Teams messages. Not to read gossip. To watch thousands of people coordinate, decide and solve problems inside a real business, at scale.', { mode: 'drift' }),
  S('corridor', 'Researchers use data like this to build training environments for AI agents. A place to practise the job before doing it for real.', { color: 'green' }),
  S('archive', 'Picture a mid-sized freight brokerage. Twenty years of load tickets. Thousands of emails negotiating rates. A dispatch log for every truck that broke down at two in the morning, and exactly what someone did about it.', { cam: 'desk' }),
  S('corridor', 'To an AI lab, that isn\u2019t clutter. It\u2019s a training ground. Thousands of real problems, each with a real solution, written down by the people who solved them.', { color: 'green', speed: 1.2 }),
  S('quote', 'TIME reported that part of what made Spirit\u2019s data so useful was that the links between records were kept intact. Which message led to which decision, and which decision led to which outcome.', { text: 'Which message led to which decision, and which decision led to which outcome.', by: 'ON SPIRIT\u2019S DATA · PARAPHRASING TIME, AUG 2026' }),
  S('quote', 'As Nick Heiner of Surge AI told TIME, buying Spirit’s data signals a belief that your agent is going to generalise into the rest of the economy.', { text: '“Your agent is going to generalize into the rest of the economy.”', by: 'NICK HEINER, SURGE AI · TO TIME, AUGUST 2026' }),
  S('list', 'The rest of the economy. That doesn’t mean tech companies. It means logistics firms. Insurers. Manufacturers. Distributors. Clinics. Contractors. Accounting practices.', { items: [['logistics', 'Logistics'], ['insurers', 'Insurance'], ['manufacturers', 'Manufacturing'], ['distributors', 'Distribution'], ['clinics', 'Healthcare'], ['contractors', 'Construction'], ['accounting', 'Accounting']], header: 'THE REST OF THE ECONOMY', columns: 2 }),
  S('archive', 'Boring companies. Traditional companies. Companies that have spent decades quietly writing down exactly how their work gets done.', { cam: 'aisle' }),
  S('list', 'Their standard operating procedures. Their knowledge bases. Their project histories. Their quality processes. Their internal documentation.', { items: [['standard', 'Standard operating procedures'], ['knowledge', 'Knowledge bases'], ['project', 'Project histories'], ['quality', 'QA processes'], ['internal', 'Internal documentation']], header: 'OPERATIONAL DATA' }),
  S('hero', 'For the first time in history, that paper trail is a sellable asset.', { prop: 'folder', cam: 'push', caption: 'FIG. 2  THE PAPER TRAIL' }),
  S('quote', 'Remember Thiel’s sentence. Every great business is built around a secret that’s hidden from the outside.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE' }),
  S('quote', 'Your secret is how you operate. And right now, some of the best-funded companies in history are trying to learn it.', { text: 'Your secret is how you operate.', by: '', red: true }),

  // ---------------- 4. THE WINDOW ----------------
  CH(4, 'The Window'),
  S('window', 'Here is the part most business owners miss.', { close: [0, 0] }),
  S('curve', 'Data is worth the most when it is scarce. The first dataset that teaches an AI how a freight broker really works is enormously valuable. The fiftieth is a commodity.', { mark: [['first', 0], ['fiftieth', 1]] }),
  S('wall', 'We have already watched this happen once. A few years ago, public web text was the prize. Today, every lab has it, and on its own it’s almost worthless as an advantage.', { mode: 'dimming' }),
  S('bars', 'Operational data is on the same curve. Right now the labs are competing hard for it. Bidding in bankruptcy courts. Building entire teams just to acquire it.', { title: 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026', items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5 }, { label: 'micro1', value: 12.5, red: true }], max: 13, source: 'SOURCE: TIME, AUG 25 2026', settled: true }),
  S('curve', 'But every company that sells makes the next dataset a little less rare. And AI keeps getting better at generating its own synthetic training data.', { mark: [['every', 0.35], ['synthetic', 0.75]] }),
  S('window', 'So how long does the window stay open? Nobody knows. It could be a few years. It could be a lot less.', { close: [0, 0.35] }),
  S('window', 'AI is moving faster than almost anyone predicted. And once the labs have learned what they need from an industry, they stop paying for it.', { close: [0.35, 0.6] }),
  S('hero', 'And there is a second clock ticking. Spirit\u2019s data sale drew objections over privacy, including from a union, and the court hearing was pushed back while they were heard.', { prop: 'gavel', cam: 'orbit', caption: 'SPIRIT DATA SALE · HEARING DELAYED OVER OBJECTIONS' }),
  S('window', 'As this market draws more attention, expect more scrutiny and more rules. Today, a company can still sell clean, anonymised operational data on its own terms. Waiting is a bet that those terms only get better.', { close: [0.6, 0.66] }),
  S('timeline', 'Thiel built his fortune on being early to things that looked strange. Data for hunting fraud. Software for spies. A data-labelling startup, years before AI was a household word.', { events: [{ year: 2000, label: 'FRAUD DATA', word: 'data' }, { year: 2003, label: 'PALANTIR', word: 'software' }, { year: 2019, label: 'SCALE AI', word: 'labelling' }], focus: 2, track: true }),
  S('window', 'Selling your company’s operational history to an AI lab still sounds strange to most owners. Which is exactly why it pays so well right now.', { close: [0.6, 0.72] }),

  // ---------------- 5. THE TRADE ----------------
  CH(5, 'The Trade'),
  S('hero', 'So how does an ordinary company actually do this? You don’t just walk into Google with a hard drive.', { prop: 'drive', cam: 'orbit' }),
  S('disclosure', 'A quick disclosure. The company I’m about to talk about is a partner of this channel, and the link in the description is an affiliate link.', {}),
  S('bars', 'Remember micro1? The company that bid twelve and a half million dollars for Spirit’s data?', { title: 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026', items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5 }, { label: 'micro1', value: 12.5, red: true }], max: 13, source: 'SOURCE: TIME, AUG 25 2026', settled: true, highlight: 2 }),
  S('name', 'They run a program called Data Partnerships. They work with established companies to package their operational data and supply it to AI labs.', { name: 'micro1', role: 'DATA PARTNERSHIPS PROGRAM', brand: true }),
  S('numbers', 'Depending on the data, micro1 says partnerships range from around one hundred thousand dollars to more than two million.', { header: 'micro1 DATA PARTNERSHIPS · STATED RANGE', items: [{ value: 100, prefix: '$', suffix: 'K', dec: 0, word: 'hundred', sub: 'from' }, { value: 2, prefix: '$', suffix: 'M+', dec: 0, word: 'two', sub: 'to' }], source: 'SOURCE: micro1.ai · VARIES BY APPROVED DATA PACKAGE' }),
  S('list', 'This is material you already have. SOPs. Internal documentation. Knowledge bases. CRM metadata. Project histories. QA processes. Operational communications.', { items: [['sops', 'SOPs'], ['internal', 'Internal documentation'], ['knowledge', 'Knowledge bases'], ['crm', 'CRM metadata'], ['project', 'Project histories'], ['qa', 'QA processes'], ['operational', 'Operational comms']], header: 'WHAT micro1 LOOKS FOR', columns: 2 }),
  S('scrub', 'It is not your customer list. And privacy comes first. Identifying information gets stripped out, the same way Spirit’s data was scrubbed by an independent third party before it changed hands.', {}),
  S('list', 'Right now, micro1 is looking for companies with at least thirty employees, mature operations, and data that’s mostly in English. U.S. companies are prioritised.', { items: [['thirty', '30+ employees'], ['mature', 'Mature operations'], ['english', 'Mostly English data'], ['prioritised', 'U.S. prioritized']], header: 'WHO QUALIFIES', check: true }),
  S('list', 'The process is straightforward. You apply through the link. micro1 evaluates whether your company is a fit. If you are approved, you go through onboarding, agree on exactly what goes into the data package, and get paid for it.', { items: [['apply', 'Apply through the link'], ['evaluates', 'micro1 evaluates fit'], ['onboarding', 'Onboarding'], ['agree', 'Agree the data package'], ['paid', 'Get paid']], header: 'HOW IT WORKS', steps: true }),
  S('list', 'If you want to be ready, start mapping what you already have. Where your SOPs live. Which systems hold your project history. Who owns your internal documentation. Most owners are surprised by how much there is.', { items: [['sops', 'Where your SOPs live'], ['systems', 'Where project history lives'], ['owns', 'Who owns your documentation']], header: 'BEFORE YOU APPLY' }),
  S('hero', 'Now think about what a six or seven figure payment, for data you already own, does for a business.', { prop: 'coins', cam: 'rise' }),
  S('list', 'It can pay down debt. It can fund an acquisition. It can pay for the hiring, the equipment or the expansion you have been putting off. And you didn’t have to sell one extra unit to earn it.', { items: [['debt', 'Pay down debt'], ['acquisition', 'Fund an acquisition'], ['hiring', 'Fund growth']], header: 'WHAT IT’S FOR', big: true }),
  S('hero', 'Read the agreement. Bring your lawyer. Make sure it fits your existing contracts. But understand what is on the table.', { prop: 'folder', cam: 'top' }),
  S('quote', 'Money, for an asset that until very recently wasn’t worth anything to anyone outside your building.', { text: 'Money for an asset that wasn’t worth anything to anyone outside your building.', by: '' }),
  S('endcard', 'If you own a company, or you advise one, the link to micro1’s Data Partnerships program is in the description. It goes straight to their team, and it’s how they know we sent you.', { url: 'micro1.ai/data-partnerships', note: 'LINK IN DESCRIPTION · AFFILIATE' }),
  S('window', 'Find out what your data is worth while the labs are still competing for it.', { close: [0.72, 0.82] }),

  // ---------------- OUTRO ----------------
  S('plane', 'Spirit Airlines never got the chance. Its data was only sold after the company was already gone.', { mode: 'lightsOff' }),
  S('orb', 'Twenty years ago, Peter Thiel bet that data was the real asset. The biggest companies on earth are now proving him right.', { mode: 'reveal' }),
  S('quote', 'The only question left is whether you sell yours while it’s still a secret.', { text: 'Sell it while it’s still a secret.', by: '', red: true }, { padOut: 1.5 }),
  { id: 'end', set: 'title', params: { title: 'The Data Rush', sub: 'micro1.ai/data-partnerships · LINK IN DESCRIPTION', end: true }, min: 6 },
];

export default {
  title: 'The Data Rush',
  fps: 24,
  width: 1920,
  height: 1080,
  voice: { engine: 'kokoro', name: 'af_heart', speed: 0.94, say: { micro1: 'micro one', SOPs: 'S.O.P.s', CRM: 'C.R.M.', QA: 'Q.A.', 'In-Q-Tel': 'In Q Tel' } },
  timing: { padIn: 0.25, padOut: 0.6 },
  finish: { grain: 8, halation: 18, halationAmount: 0.45, bloom: 0.15, vignette: 0.55 },
  shots,
  score: {
    key: 'D', drone: 0.14,
    sections: [{ shot: 'ch1', key: 'F' }, { shot: 'ch2', key: 'C' }, { shot: 'ch3', key: 'E' }, { shot: 'ch4', key: 'D' }, { shot: 'ch5', key: 'A' }, { shot: 'end', key: 'D' }],
    silenceDrone: ['title', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'end'],
  },
  // sound design generated from the shot list
  cues(shots) {
    const c = [];
    for (const s of shots) {
      if (s.set === 'chapter' || s.set === 'title') c.push({ type: 'clang', shot: s.id, at: 0.05, gain: 0.6 }, { type: 'boom', shot: s.id, at: 0.05, gain: 0.6 }, { type: 'swell', shot: s.id, at: 0, dur: 2.2, gain: 0.25 });
      if (s.set === 'plane' && s.params.mode === 'lightsOff') c.push({ type: 'clunk', shot: s.id, at: 1.0, gain: 0.55 }, { type: 'clunk', shot: s.id, at: 2.2, gain: 0.45 });
      if (s.set === 'bars') for (const it of s.params.items ?? []) if (it.word) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.35 });
      if (s.set === 'numbers') for (const it of s.params.items ?? []) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.3 });
      if (s.set === 'name' && s.params.word) c.push({ type: 'boom', shot: s.id, word: s.params.word, gain: 0.45 });
      if (s.set === 'corridor' || s.set === 'archive') c.push({ type: 'hum', shot: s.id, at: 0, gain: 0.12 });
      if (s.set === 'window') c.push({ type: 'ticks', shot: s.id, at: 0, gain: 0.16, period: 0.5 });
      if (s.set === 'messages') c.push({ type: 'water', shot: s.id, at: 0, gain: 0.18 });
      if (s.set === 'wall' && s.params.mode === 'dimming') c.push({ type: 'pulse', shot: s.id, at: 0, gain: 0.35, bpm: 58 });
    }
    return c;
  },
};
