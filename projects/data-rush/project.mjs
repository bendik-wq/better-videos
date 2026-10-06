// THE DATA RUSH: Why Google paid $10 million for a dead airline's emails.
// Episode 1, v2 (tighter script, open loops, objection handling).
// Every number in the VO is sourced in projects/data-rush/SOURCES.md.
//
// Each shot: { id, set, vo?, params?, min? }. Shot length follows the narration.
// Visual beats key off spoken words via params (see scene.js: wt(shot, 'word')).

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title) => ({ id: `ch${num}`, set: 'chapter', params: { num, title }, min: 4.5, chapter: num });
const BIDS = 'BIDS FOR SPIRIT AIRLINES’ INTERNAL DATA · AUG 2026';
const ALLBIDS = [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5 }, { label: 'micro1', value: 12.5, red: true }];

const shots = [
  // ---------------- COLD OPEN ----------------
  S('plane', 'In May twenty twenty-six, Spirit Airlines stopped flying.', { mode: 'wide', caption: 'SPIRIT AIRLINES · CEASED OPERATIONS · MAY 2026' }, { padIn: 1.0 }),
  S('plane', 'The planes were parked. The gates went dark. The company was finished.', { mode: 'lightsOff' }),
  S('plane', 'And then, in a bankruptcy court, something strange happened. Some of the most powerful companies in tech started bidding against each other. Not for the planes.', { mode: 'tail' }),
  S('messages', 'For the emails. A hundred million of them. Five hundred million Microsoft Teams messages. Thirty million lines of code.', {
    counters: [{ word: 'hundred', value: 100, unit: 'M', label: 'EMAILS' }, { word: 'five', value: 500, unit: 'M', label: 'TEAMS MESSAGES' }, { word: 'thirty', value: 30, unit: 'M', label: 'LINES OF CODE' }] }),
  S('bars', 'Google bid ten million dollars.', { title: BIDS, items: [{ label: 'Google', value: 10, word: 'ten' }], max: 13, source: 'SOURCE: TIME, AUG 25 2026' }),
  S('bars', 'Mercor, a startup that supplies data to AI labs, bid seven and a half.', { title: BIDS, items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5, word: 'seven' }], max: 13, source: 'SOURCE: TIME, AUG 25 2026' }),
  S('bars', 'And a company called micro1 came in at twelve and a half million.', { title: BIDS, items: [{ label: 'Google', value: 10 }, { label: 'Mercor', value: 7.5 }, { label: 'micro1', value: 12.5, word: 'twelve', red: true }], max: 13, source: 'SOURCE: TIME, AUG 25 2026 · micro1 BID ARRIVED AFTER THE AUCTION CLOSED' }),
  S('hero', 'Twelve and a half million dollars. For the inbox of an airline that no longer exists.', { prop: 'drive', caption: 'FIG. 1  ONE COMPANY’S OPERATING HISTORY', cam: 'push' }),
  S('hero', 'That sounds insane. It isn’t. It is one of the most rational trades happening in business right now.', { prop: 'drive', cam: 'orbit' }),
  S('name', 'Because the most valuable asset inside a lot of companies doesn’t appear on the balance sheet. One man figured that out twenty years before everyone else.', { name: '', role: '' }),
  S('name', 'Peter Thiel.', { name: 'Peter Thiel', role: 'CO-FOUNDER, PAYPAL · PALANTIR · FOUNDERS FUND', word: 'peter' }),
  S('orb', 'The PayPal co-founder. The first outside investor in Facebook. The man who named his company after a crystal ball.', { mode: 'reveal', word: 'crystal' }),
  S('orb', 'And by the end of this video, you’ll see why the thing he understood could be worth six or seven figures to an ordinary business. Maybe yours. But only for a limited time.', { mode: 'dim' }),
  { id: 'title', set: 'title', params: { title: 'The Data Rush', sub: 'WHY AI COMPANIES ARE BUYING THE INSIDES OF ORDINARY BUSINESSES' }, min: 5.5 },

  // ---------------- 1. THE ORACLE ----------------
  CH(1, 'The Oracle'),
  S('timeline', 'Rewind to the year two thousand. PayPal is bleeding.', { events: [{ year: 2000, label: 'PAYPAL' }], focus: 0 }),
  S('hero', 'Fraudsters, including organised crime rings, are draining millions of dollars a month through the platform. Enough to kill the company.', { prop: 'cards', cam: 'top', tint: 'red' }),
  S('network', 'PayPal doesn’t fight back with more people. It fights back with data. Software that lets analysts and machines hunt patterns together. The same card. The same address. The same strange rhythm of payments.', { mode: 'fraud' }),
  S('timeline', 'It works. PayPal survives. In two thousand and two, eBay buys it for one and a half billion dollars.', { events: [{ year: 2000, label: 'PAYPAL' }, { year: 2002, label: 'EBAY BUYS PAYPAL · $1.5B', word: 'ebay' }], focus: 1 }),
  S('hero', 'Thiel walks away with tens of millions. And something more valuable than the money. An idea.', { prop: 'coins', cam: 'push' }),
  S('quote', 'If software can find criminals hiding inside payment data, it can find almost anything, inside almost any data.', { text: 'If software can find criminals inside payment data, it can find anything.', by: 'THE IDEA BEHIND PALANTIR' }),
  S('orb', 'In two thousand and three, he co-founds Palantir. Named after the seeing stones in The Lord of the Rings. Objects that let you see what others can’t.', { mode: 'reveal', caption: 'PALANTIR TECHNOLOGIES · FOUNDED 2003', word: 'palantir' }),
  S('orb', 'One of its earliest backers? In-Q-Tel. The venture capital arm of the CIA.', { mode: 'cia', caption: 'EARLY BACKER: IN-Q-TEL (CIA)' }),
  S('corridor', 'For years, Palantir sells to spies, soldiers and police, and almost nobody else. Critics call it a consulting firm pretending to be a software company.', { color: 'blue' }),
  S('network', 'But what it’s really building is a map. It takes the data scattered across an organisation’s systems and connects it into one picture of how that organisation actually works. Who did what. What depends on what. What happens next.', { mode: 'ontology' }),
  S('hero', 'Palantir calls that picture the Ontology. A working model of an organisation, built from its own records. Remember it. Because that is exactly what AI labs are now paying for.', { prop: 'orbSmall', cam: 'orbit', caption: 'PALANTIR · “THE ONTOLOGY”' }),
  S('corridor', 'Then the AI boom hits. Suddenly every large company on earth wants what Palantir spent two decades building. A way to point intelligence at its own private data.', { color: 'blue', speed: 1.4 }),
  S('hero', 'Palantir becomes one of the most valuable software companies in the world.', { prop: 'orbSmall', cam: 'rise', caption: 'PALANTIR · NASDAQ: PLTR' }),
  S('quote', 'But Thiel’s real bet was never one company. It was a principle. He wrote it down in his book, Zero to One.', { text: '', by: '', book: true }),
  S('quote', 'Every great business is built around a secret that’s hidden from the outside.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE · 2014' }, { padOut: 1.0 }),
  S('quote', 'Keep that sentence in your head. It’s about to cost some companies a fortune, and make others one.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE · 2014', dim: true }),

  // ---------------- 2. THE WALL ----------------
  CH(2, 'The Wall'),
  S('wall', 'Every AI model you’ve ever used was built the same way. Feed it text. More text than a human could read in ten thousand lifetimes.', { mode: 'full' }),
  S('wall', 'Books. Wikipedia. Forums. News. Code. Basically the entire public internet, scraped, cleaned and poured in.', { mode: 'full', words: ['Books', 'Wikipedia', 'Forums', 'News', 'Code'] }),
  S('wall', 'For a while, that was enough. Then researchers did the maths.', { mode: 'full' }),
  S('wall', 'In twenty twenty-four, the research group Epoch AI estimated that the stock of high-quality public text would be used up sometime between twenty twenty-six and twenty thirty-two.', { mode: 'dimming', caption: 'EPOCH AI · 2024 · PUBLIC TEXT EXHAUSTED: 2026–2032' }),
  S('wall', 'The internet is huge. It is not infinite. And every major lab has already read it.', { mode: 'dark' }),
  S('hero', 'So the labs did what you do when the free supply runs out. They started buying.', { prop: 'briefcase', cam: 'push' }),
  S('bars', 'Google agreed to pay Reddit a reported sixty million dollars a year for its posts.', { title: 'AI DATA LICENSING DEALS (REPORTED)', items: [{ label: 'Reddit → Google', value: 60, word: 'sixty', display: '$60M / yr' }], max: 260, source: 'SOURCE: REUTERS, 2024' }),
  S('bars', 'OpenAI signed with News Corp in a deal reportedly worth two hundred and fifty million over five years.', { title: 'AI DATA LICENSING DEALS (REPORTED)', items: [{ label: 'Reddit → Google', value: 60, display: '$60M / yr' }, { label: 'News Corp → OpenAI', value: 250, word: 'two', display: '$250M / 5 yrs' }], max: 260, source: 'SOURCE: WSJ, 2024' }),
  S('hero', 'And the ones who didn’t sell? They sued. In December twenty twenty-three, The New York Times took OpenAI and Microsoft to court, accusing them of using millions of its articles without permission.', { prop: 'gavel', cam: 'top', caption: 'NYT v. OPENAI & MICROSOFT · DEC 2023' }),
  S('wall', 'Overnight, data became a legal minefield. Labs needed data they could prove they had the right to use. Licensed. Clean. With a paper trail.', { mode: 'dimming' }),
  S('numbers', 'Then, in June twenty twenty-five, came the deal that showed how serious this had become. Meta paid about fourteen point three billion dollars for forty-nine percent of Scale AI. A company whose core business was producing training data.', {
    header: 'META × SCALE AI · JUNE 2025', items: [{ value: 14.3, prefix: '$', suffix: 'B', dec: 1, word: 'fourteen', sub: 'invested' }, { value: 49, suffix: '%', dec: 0, word: 'forty', sub: 'stake' }], source: 'SOURCE: CNBC / FORTUNE, JUNE 2025' }),
  S('timeline', 'Now guess who led Scale AI’s big round back in twenty nineteen, the year it first crossed a billion-dollar valuation.', { events: [{ year: 2019, label: 'SCALE AI SERIES C · $1B+' }, { year: 2025, label: 'META · $14.3B FOR 49%' }], focus: 0 }),
  S('name', 'Peter Thiel’s Founders Fund.', { name: 'Founders Fund', role: 'LED SCALE AI’S 2019 SERIES C', word: 'founders' }),
  S('network', 'Founders Fund was the first institutional investor in Palantir. It holds stakes in OpenAI and Anthropic. And it backed the company that sells data to the labs.', { mode: 'thiel', reveal: [['palantir', 'Palantir'], ['openai', 'OpenAI'], ['anthropic', 'Anthropic'], ['backed', 'Scale AI']] }),
  S('network', 'Follow the money, and it keeps landing in the same place. Whoever controls the data.', { mode: 'thiel', all: true, pulse: true }),
  S('numbers', 'And the data suppliers themselves have exploded. Mercor hit a ten billion dollar valuation in twenty twenty-five. Surge AI reportedly made over a billion dollars in revenue in a single year, without taking venture capital.', {
    header: 'THE DATA SUPPLIERS', items: [{ value: 10, prefix: '$', suffix: 'B', dec: 0, word: 'ten', sub: 'Mercor valuation, 2025' }, { value: 1.2, prefix: '$', suffix: 'B', dec: 1, word: 'over', sub: 'Surge AI revenue, 2024' }], source: 'SOURCE: TECHCRUNCH · REPORTED FIGURES' }),
  S('quote', 'In September twenty twenty-six, Thiel put it bluntly. A.I. is bigger than the internet.', { text: 'AI is bigger than the internet.', by: 'PETER THIEL · SEPTEMBER 2026', word: 'bigger' }),
  S('hero', 'But here’s the problem. One answer to the data shortage is synthetic data, AI generating training material for other AI. And in twenty twenty-four, a study in Nature found that models trained over and over on machine-made data can degrade. Researchers called it model collapse.', { prop: 'chip', cam: 'push', caption: 'NATURE · 2024 · “MODEL COLLAPSE”' }),
  S('wall', 'Synthetic data still needs real data to anchor it. Real decisions. Real work. And the biggest untouched supply of that isn’t on the internet at all.', { mode: 'dark', question: true }),

  // ---------------- 3. THE SECRET ----------------
  CH(3, 'The Secret'),
  S('hero', 'Here’s what changed. AI isn’t just answering questions anymore.', { prop: 'chip', cam: 'push' }),
  S('list', 'The labs are building agents. Systems that do the actual work. Process an insurance claim. Schedule a crew. Close the books. Run a dispatch desk.', { items: [['process', 'Process an insurance claim'], ['schedule', 'Schedule a crew'], ['close', 'Close the books'], ['run', 'Run a dispatch desk']], header: 'WHAT AI AGENTS ARE BEING TRAINED TO DO' }),
  S('wall', 'And you cannot learn how real work gets done from Wikipedia.', { mode: 'dark' }),
  S('archive', 'The internet is full of what people say. It contains almost nothing about how a real company runs. The hand-offs. The exceptions. The approvals.', { cam: 'aisle' }),
  S('archive', 'The Tuesday afternoon problem that only one person in accounting knows how to fix.', { cam: 'desk' }),
  S('archive', 'That knowledge lives in exactly one place. Inside companies. In their documents, their tickets, their processes and their internal messages.', { cam: 'rise' }),
  S('messages', 'That’s why Google wanted an airline’s Teams chats. Not for the gossip. To watch thousands of people coordinate, decide and solve problems inside a real business, at scale.', { mode: 'drift' }),
  S('corridor', 'Labs use data like this to build training environments for AI agents. A place to practise the job before doing it for real.', { color: 'green' }),
  S('archive', 'Picture a mid-sized freight brokerage. Twenty years of load tickets. Thousands of emails negotiating rates. A dispatch log for every truck that broke down at two in the morning, and exactly what someone did about it.', { cam: 'desk' }),
  S('corridor', 'To you, that’s clutter. To an AI lab, it’s a training ground. Thousands of real problems, each with a real solution, written down by the people who solved them.', { color: 'green', speed: 1.2 }),
  S('quote', 'TIME reported that part of what made Spirit’s data so useful was that the links between records were kept intact. Which message led to which decision. Which decision led to which outcome.', { text: 'Which message led to which decision, and which decision led to which outcome.', by: 'ON SPIRIT’S DATA · PARAPHRASING TIME, AUG 2026' }),
  S('quote', 'Nick Heiner of Surge AI told TIME that buying Spirit’s data signals a belief that your agent is going to generalise into the rest of the economy.', { text: '“Your agent is going to generalize into the rest of the economy.”', by: 'NICK HEINER, SURGE AI · TO TIME, AUGUST 2026' }),
  S('list', 'The rest of the economy. Not tech companies. Logistics firms. Insurers. Manufacturers. Distributors. Clinics. Contractors. Accounting practices.', { items: [['logistics', 'Logistics'], ['insurers', 'Insurance'], ['manufacturers', 'Manufacturing'], ['distributors', 'Distribution'], ['clinics', 'Healthcare'], ['contractors', 'Construction'], ['accounting', 'Accounting']], header: 'THE REST OF THE ECONOMY', columns: 2 }),
  S('archive', 'Boring companies. Traditional companies. Companies that have spent decades quietly writing down exactly how their work gets done.', { cam: 'aisle' }),
  S('list', 'Their standard operating procedures. Their knowledge bases. Their project histories. Their quality processes. Their internal documentation.', { items: [['standard', 'Standard operating procedures'], ['knowledge', 'Knowledge bases'], ['project', 'Project histories'], ['quality', 'QA processes'], ['internal', 'Internal documentation']], header: 'OPERATIONAL DATA' }),
  S('hero', 'For the first time in history, that paper trail is a sellable asset.', { prop: 'folder', cam: 'push', caption: 'FIG. 2  THE PAPER TRAIL' }),
  S('quote', 'Remember Thiel’s sentence? Every great business is built around a secret that’s hidden from the outside.', { text: 'Every great business is built around a secret that’s hidden from the outside.', by: 'PETER THIEL · ZERO TO ONE' }),
  S('quote', 'Your secret is how you operate. And right now, some of the best-funded companies in history are willing to pay to learn it.', { text: 'Your secret is how you operate.', by: '', red: true }),

  // ---------------- 4. THE WINDOW ----------------
  CH(4, 'The Window'),
  S('window', 'Now here’s the part almost every business owner misses.', { close: [0, 0] }),
  S('curve', 'Data is worth the most when it’s scarce. The first dataset that teaches an AI how a freight broker really works is enormously valuable. The fiftieth is a commodity.', { mark: [['first', 0], ['fiftieth', 1]] }),
  S('bars', 'Look at who got paid in the last rush. Reddit signed early, and reportedly collects sixty million dollars a year. The longer you wait in a market like this, the more of the money is already spoken for.', { title: 'AI DATA LICENSING DEALS (REPORTED)', items: [{ label: 'Reddit → Google', value: 60, word: 'sixty', display: '$60M / yr' }], max: 260, source: 'SOURCE: REUTERS, 2024' }),
  S('wall', 'We’ve already watched this happen once. A few years ago, public web text was the prize. Today every lab has it, and on its own it’s no advantage at all.', { mode: 'dimming' }),
  S('bars', 'Operational data is on the same curve. Right now the buyers are competing hard. Bidding in bankruptcy courts. Building entire teams just to acquire it.', { title: BIDS, items: ALLBIDS, max: 13, source: 'SOURCE: TIME, AUG 25 2026', settled: true }),
  S('curve', 'But every company that sells makes the next dataset a little less rare. And every year, AI gets better at filling the gaps on its own.', { mark: [['every', 0.35], ['gaps', 0.75]] }),
  S('window', 'So how long does the window stay open? Nobody knows. Maybe a few years. Maybe a lot less.', { close: [0, 0.35] }),
  S('window', 'AI is moving faster than almost anyone predicted. And once the labs have learned what they need from an industry, they stop paying for it.', { close: [0.35, 0.55] }),
  S('hero', 'There’s a second clock too. Spirit’s sale drew privacy objections, including from a union, and the hearing was pushed back while they were heard.', { prop: 'gavel', cam: 'orbit', caption: 'SPIRIT DATA SALE · HEARING DELAYED OVER OBJECTIONS' }),
  S('window', 'As this market gets more attention, expect more scrutiny and more rules. Today, a company can still sell clean, anonymised operational data on its own terms. Waiting is a bet that those terms only get better.', { close: [0.55, 0.65] }),
  S('timeline', 'Thiel built a fortune by being early to things that looked strange. Data for hunting fraud. Software for spies. A data-labelling startup years before AI was a household word.', { events: [{ year: 2000, label: 'FRAUD DATA', word: 'data' }, { year: 2003, label: 'PALANTIR', word: 'software' }, { year: 2019, label: 'SCALE AI', word: 'labelling' }], focus: 2, track: true }),
  S('window', 'Selling your company’s operating history to an AI lab still sounds strange to most owners. That’s exactly why it pays so well right now.', { close: [0.65, 0.72] }),

  // ---------------- 5. THE TRADE ----------------
  CH(5, 'The Trade'),
  S('hero', 'So how does a normal company actually do this? You can’t exactly walk into Google with a hard drive.', { prop: 'drive', cam: 'orbit' }),
  S('disclosure', 'Quick disclosure. The company I’m about to talk about is a partner of this channel, and the link in the description is an affiliate link.', {}),
  S('bars', 'Remember micro1? The company that bid twelve and a half million dollars for Spirit’s data?', { title: BIDS, items: ALLBIDS, max: 13, source: 'SOURCE: TIME, AUG 25 2026', settled: true, highlight: 2 }),
  S('name', 'They run a program called Data Partnerships. They work directly with established companies to package their operational data and supply it to AI labs.', { name: 'micro1', role: 'DATA PARTNERSHIPS PROGRAM', brand: true }),
  S('numbers', 'Depending on the data, micro1 says partnerships range from around one hundred thousand dollars to more than two million.', { header: 'micro1 DATA PARTNERSHIPS · STATED RANGE', items: [{ value: 100, prefix: '$', suffix: 'K', dec: 0, word: 'hundred', sub: 'from' }, { value: 2, prefix: '$', suffix: 'M+', dec: 0, word: 'two', sub: 'to' }], source: 'SOURCE: micro1.ai · VARIES BY APPROVED DATA PACKAGE' }),
  S('list', 'And it’s material you already have. SOPs. Internal documentation. Knowledge bases. CRM metadata. Project histories. QA processes. Operational communications.', { items: [['sops', 'SOPs'], ['internal', 'Internal documentation'], ['knowledge', 'Knowledge bases'], ['crm', 'CRM metadata'], ['project', 'Project histories'], ['qa', 'QA processes'], ['operational', 'Operational comms']], header: 'WHAT micro1 LOOKS FOR', columns: 2 }),
  S('quote', 'Now, if you run a business, you probably have three objections. Let’s take them one at a time.', { text: 'Three objections.', by: '' }),
  S('scrub', 'One. Is this my customers’ data? No. This is about how your company operates, not your customer list. And identifying information is stripped out, the same way Spirit’s data was scrubbed by an independent third party before it changed hands.', {}),
  S('list', 'Two. Is my company big enough? Right now micro1 is looking for companies with at least thirty employees, mature operations, and data that’s mostly in English. U.S. companies are prioritised.', { items: [['thirty', '30+ employees'], ['mature', 'Mature operations'], ['english', 'Mostly English data'], ['prioritised', 'U.S. prioritized']], header: 'WHO QUALIFIES', check: true }),
  S('list', 'Three. Is it complicated? Not really. You apply through the link. micro1 checks whether you’re a fit. If you’re approved, you go through onboarding, agree on exactly what goes into the data package, and get paid.', { items: [['apply', 'Apply through the link'], ['checks', 'micro1 checks fit'], ['onboarding', 'Onboarding'], ['agree', 'Agree the data package'], ['paid', 'Get paid']], header: 'HOW IT WORKS', steps: true }),
  S('hero', 'Now think about what a six or seven figure payment, for data you already own, does for a business.', { prop: 'coins', cam: 'rise' }),
  S('list', 'It can pay down debt. It can fund an acquisition. It can pay for the hires, the equipment or the expansion you keep putting off. And you didn’t have to sell one extra unit to earn it.', { items: [['debt', 'Pay down debt'], ['acquisition', 'Fund an acquisition'], ['hires', 'Fund growth']], header: 'WHAT IT’S FOR', big: true }),
  S('archive', 'Picture a sixty-person logistics company. Ten years of SOPs. A help desk full of resolved tickets. Every quote, every exception, every fix, written down. To that company, it’s admin. To a lab teaching agents how logistics works, it’s a curriculum.', { cam: 'aisle' }),
  S('numbers', 'Even at the bottom of micro1’s stated range, that’s a hundred thousand dollars. For files that are already sitting on a server.', { header: 'ILLUSTRATIVE · LOW END OF STATED RANGE', items: [{ value: 100, prefix: '$', suffix: 'K', dec: 0, word: 'hundred', sub: 'for files you already have' }], source: 'ILLUSTRATIVE EXAMPLE · ACTUAL OFFERS VARY' }),
  S('hero', 'Read the agreement. Bring your lawyer. Make sure it fits your existing contracts. But be clear about what’s on the table.', { prop: 'folder', cam: 'top' }),
  S('quote', 'Real money, for an asset that until very recently wasn’t worth anything to anyone outside your building.', { text: 'Money for an asset that wasn’t worth anything outside your building.', by: '' }),
  S('endcard', 'If you own a company, or you advise one, the link to micro1’s Data Partnerships program is in the description. It goes straight to their team, and it’s how they know we sent you.', { url: 'Link in the description', note: 'micro1 DATA PARTNERSHIPS · AFFILIATE' }),
  S('window', 'Find out what your data is worth while the buyers are still competing for it.', { close: [0.72, 0.82] }),

  // ---------------- OUTRO ----------------
  S('plane', 'Spirit Airlines never got that chance. Its data was sold only after the company was already gone.', { mode: 'lightsOff' }),
  S('orb', 'Twenty years ago, Peter Thiel bet that data was the real asset. The biggest companies on earth are now proving him right.', { mode: 'reveal' }),
  S('quote', 'The only question left is whether you sell yours while it’s still a secret.', { text: 'Sell it while it’s still a secret.', by: '', red: true }, { padOut: 1.4 }),
  { id: 'end', set: 'title', params: { title: 'The Data Rush', sub: 'LINK IN THE DESCRIPTION', end: true }, min: 9 },
];

// ---------------------------------------------------------------------------
// RE-CUT: more clips, no repeats. LOOK swaps a shot's opening visual; BEATS cut to
// new visuals on spoken words. The renderer refuses to output any visual twice.
const LOOK = {
  s001: ['tarmac', { phase: 'wide', caption: 'SPIRIT AIRLINES · CEASED OPERATIONS · MAY 2026' }],
  s002: ['tarmac', { phase: 'door' }],
  s003: ['court2', { word: 'bidding' }],
  s004: ['cabin', {}],
  s020: ['monolith', { caption: 'PALANTIR TECHNOLOGIES · FOUNDED 2003' }],
  s034: ['wallwalk', {}],
  s054: ['archivewalk', {}],
  s067: ['windowfig', {}],
  s078: ['skydive', {}],
  s009: ['balance', { from: 0.2, to: -0.12 }],
  s010: ['vault', { open: [0, 0.5] }],
  s012: ['terminal', {}],
  s013: ['cash', { pallets: 6 }],
  s021: ['globe', {}],
  s025: ['tunnel', { color: 0x9fc4ff, speed: 1.5 }],
  s030: ['rack', { color: 0x9fc4ff }],
  s032: ['hourglass', { fill: [0.05, 0.2], close: true }],
  s038: ['press', { masthead: 'The Daily Record', headline: 'THE COPYRIGHT WARS' }],
  s039: ['lock', { word: 'licensed' }],
  s044: ['conveyor', { color: 0xff4a3d }],
  s047: ['rack', { color: 0xff9f6a }],
  s048: ['boardroom', { cam: 'top' }],
  s049: ['rack', { cam: 'low', color: 0x7dffb0 }],
  s051: ['wall', { mode: 'dark', words: ['Wikipedia'] }],
  s053: ['clock', {}],
  s057: ['truck', { view: 'side' }],
  s062: ['city', { mode: 'dawn', seed: 11 }],
  s069: ['mine', { color: 0xffc040 }],
  s074: ['tunnel', { color: 0xfff0dc, speed: 2.2 }],
  s079: ['hero', { prop: 'drive', cam: 'top' }],
  s089: ['cash', { pallets: 9, flip: true }],
  s091: ['truck', { view: 'aerial', color: 0x1d4f7a }],
  s093: ['contract', { title: 'MASTER SERVICES AGREEMENT' }],
  s097: ['tarmac', { phase: 'night' }],
  s098: ['vault', { open: [0.2, 1] }],
  s040: ['merge', {}],
};
const BEATS = {
  s002: [['company', 'city', { mode: 'lightsoff', seed: 5 }]],
  s004: [['hundred', '@orig']],
  s003: [['planes', 'tarmac', { phase: 'tail' }]],
  s010: [['one', 'chess', { close: true }]],
  s012: [['first', 'city', { mode: 'lightson', seed: 9, caption: 'FACEBOOK · FIRST OUTSIDE INVESTOR · 2004' }], ['man', 'orb', { mode: 'reveal', word: 'crystal' }]],
  s013: [['maybe', 'boardroom', {}], ['limited', 'hourglass', { fill: [0.5, 0.7] }]],
  s015: [['enough', 'terminal', { red: true }]],
  s016: [['same', 'magnifier', {}]],
  s018: [['idea', 'tunnel', { color: 0xffc890, speed: 0.6 }]],
  s022: [['critics', 'rack', { cam: 'low', color: 0x8fc8ff }]],
  s023: [['who', 'crowd', {}]],
  s024: [['remember', 'mine', {}]],
  s025: [['every', 'city', { seed: 3 }]],
  s030: [['feed', 'bubbles', {}]],
  s038: [['december', 'hero', { prop: 'gavel', cam: 'top', caption: 'NYT v. OPENAI & MICROSOFT · DEC 2023' }]],
  s039: [['paper', 'contract', { title: 'DATA LICENSE AGREEMENT' }]],
  s047: [['nature', 'hero', { prop: 'chip', cam: 'push', caption: 'NATURE · 2024 · “MODEL COLLAPSE”' }], ['researchers', 'city', { mode: 'lightsoff', seed: 31 }]],
  s048: [['biggest', 'wall', { mode: 'dark', question: true }]],
  s052: [['hand', 'stamp', { word: 'approvals' }]],
  s057: [['thousands', 'dispatch', {}], ['broke', 'truck', { view: 'front' }]],
  s058: [['thousands', 'conveyor', { color: 0x7dffb0 }]],
  s069: [['longer', 'hourglass', { fill: [0.6, 0.92] }]],
  s071: [['bidding', 'auction', { flip: true, bids: [{ label: 'Google', amount: '$10M' }, { label: 'Mercor', amount: '$7.5M' }, { label: 'micro1', amount: '$12.5M', red: true }] }]],
  s074: [['once', 'window', { close: [0.35, 0.55] }]],
  s076: [['today', 'contract', { title: 'DATA PARTNERSHIP AGREEMENT' }], ['waiting', 'clock', { fast: true }]],
  s082: [['package', 'conveyor', { color: 0xffffff, flip: true }]],
  s086: [['identifying', 'lock', { word: 'stripped', close: true }]],
  s088: [['approved', 'stamp', { word: 'approved', text: 'APPROVED' }]],
  s040: [['meta', '@orig']],
  s059: [['which', 'dominoes', { word: 'outcome' }]],
  s091: [['help', 'archive', { cam: 'desk' }], ['lab', 'corridor', { color: 'green', speed: 0.6 }]],
};
for (const s of shots) {
  const orig = [s.set, s.params];
  if (LOOK[s.id]) [s.set, s.params] = LOOK[s.id];
  if (BEATS[s.id]) BEATS[s.id] = BEATS[s.id].map(b => b[1] === '@orig' ? [b[0], ...orig] : b);
  if (BEATS[s.id]) s.beats = BEATS[s.id];
}

export default {
  title: 'The Data Rush',
  fps: 30,
  width: 1920,
  height: 1080,
  voice: { engine: 'kokoro', name: 'af_heart', speed: 0.96, say: { micro1: 'micro one', SOPs: 'ess oh pees', CRM: 'C.R.M.', QA: 'Q.A.', 'In-Q-Tel': 'In Q Tel' } },
  // tight, conversational pacing: short breaths between lines, longer only where marked
  timing: { padIn: 0.15, padOut: 0.42 },
  // smooth cuts: short dissolve between shots in the same chapter
  dissolve: 0.3,
  finish: { grain: 6, halation: 16, halationAmount: 0.4, bloom: 0.14, vignette: 0.5 },
  shots,
  score: {
    key: 'D', drone: 0.14,
    sections: [{ shot: 'ch1', key: 'F' }, { shot: 'ch2', key: 'C' }, { shot: 'ch3', key: 'E' }, { shot: 'ch4', key: 'D' }, { shot: 'ch5', key: 'A' }, { shot: 'end', key: 'D' }],
    silenceDrone: ['title', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'end'],
  },
  cues(shots) {
    const c = [];
    for (const s of shots) {
      if (s.set === 'chapter' || s.set === 'title') c.push({ type: 'clang', shot: s.id, at: 0.05, gain: 0.55 }, { type: 'boom', shot: s.id, at: 0.05, gain: 0.55 }, { type: 'swell', shot: s.id, at: 0, dur: 2.0, gain: 0.22 });
      if (s.set === 'plane' && s.params.mode === 'lightsOff') c.push({ type: 'clunk', shot: s.id, at: 1.0, gain: 0.5 }, { type: 'clunk', shot: s.id, at: 2.2, gain: 0.4 });
      if (s.set === 'bars') for (const it of s.params.items ?? []) if (it.word) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.32 });
      if (s.set === 'numbers') for (const it of s.params.items ?? []) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.28 });
      if (s.set === 'name' && s.params.word) c.push({ type: 'boom', shot: s.id, word: s.params.word, gain: 0.42 });
      if (s.set === 'corridor' || s.set === 'archive') c.push({ type: 'hum', shot: s.id, at: 0, gain: 0.1 });
      if (s.set === 'window') c.push({ type: 'ticks', shot: s.id, at: 0, gain: 0.13, period: 0.5 });
      if (s.set === 'messages') c.push({ type: 'water', shot: s.id, at: 0, gain: 0.16 });
      if (s.set === 'wall' && s.params.mode === 'dimming') c.push({ type: 'pulse', shot: s.id, at: 0, gain: 0.32, bpm: 58 });
    }
    return c;
  },
};
