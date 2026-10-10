// THE MOST DANGEROUS COMPANY IN THE WORLD. Episode 2: Palantir.
// Every fact in the VO is sourced in projects/palantir/RESEARCH.md. Allegations are attributed.
//
// Each shot: { id, set, vo?, params?, min?, beats? }. Shot length follows the narration.
// beats: [[spokenWord, set, params], ...] cut to a new visual on that word.
// New sets live in stone.js (the seeing stones), ops.js (intelligence and war), geo.js (maps, markets, streets).

let n = 0;
const S = (set, vo, params = {}, extra = {}) => ({ id: `s${String(++n).padStart(3, '0')}`, set, vo, params, ...extra });
const CH = (num, title) => ({ id: `ch${num}`, set: 'chapter', params: { num, title }, min: 4.2, chapter: num });
const TOLKIEN_TT = 'J.R.R. TOLKIEN · THE TWO TOWERS · 1954';
const TOLKIEN_RK = 'J.R.R. TOLKIEN · THE RETURN OF THE KING · 1955';

const shots = [
  // ================= COLD OPEN =================
  S('stone', 'In The Lord of the Rings, there are seven stones that let you see across the world.', { mode: 'chamber' }, { padIn: 1.2 }),
  S('stone', 'Look into one, and you can watch armies move a thousand miles away. You can speak to whoever holds another stone.', { mode: 'macro' },
    { beats: [['speak', 'stone', { mode: 'seven' }]] }),
  S('stone', 'There’s just one problem. The enemy has one too.', { mode: 'seven', red: true }),
  S('stone', 'And whoever looks into a stone can be seen. Studied. And shown only what the enemy wants them to see.', { mode: 'seen' },
    { beats: [['shown', 'stone', { mode: 'eye' }]] }),
  S('stone', 'In two thousand and three, a group of men from Silicon Valley named a company after those stones.', { mode: 'office' }),
  S('name', 'Palantir.', { name: 'Palantir', role: 'PALANTIR TECHNOLOGIES · FOUNDED 2003', word: 'palantir' }, { padOut: 0.7 }),
  S('photo', 'One of its first investors was the C.I.A.', { file: 'cia-hq-aerial-1.jpg', treatment: 'bw', move: 'push', caption: 'CIA HEADQUARTERS · LANGLEY, VIRGINIA', source: 'PHOTO: CIA / PUBLIC DOMAIN' }),
  S('feed', 'Today, its software helps the U.S. military find targets.', { mode: 'thermal', angle: 'god' },
    { beats: [['builds', 'addresses', { mode: 'night' }], ['runs', 'silos', { mode: 'nhs' }]],
      voCont: ' It builds the tools immigration agents use to find people. It runs the data platform behind England’s National Health Service.' }),
  S('police', 'In one American city, according to The Verge, it ran a predictive policing program for six years that key members of the city council didn’t know about.', { mode: 'street', caption: 'NEW ORLEANS · 2012–2018', source: 'SOURCE: THE VERGE, FEB 27 2018' },
    { beats: [['key', 'police', { mode: 'council' }]] }),
  S('chart', 'And this week, its stock closed at a record. About half a trillion dollars.', { mode: 'spike', source: 'CLOSE OCT 9 2026: $209.05 · MARKET VALUE ≈ $500B (2.40B SHARES)' }),
  S('warroom', 'But the strangest part is this. The company doesn’t hide what it is. Its own CEO said it on an earnings call.', { mode: 'call' }),
  S('quote', 'Palantir is here to disrupt. And when it’s necessary, to scare enemies and, on occasion, kill them.', { text: '“Palantir is here to disrupt… and when it’s necessary to scare enemies and, on occasion, kill them.”', by: 'ALEX KARP, CEO · Q4 2024 EARNINGS CALL · FEB 3 2025', red: true }, { padOut: 0.9 }),
  S('stone', 'So which stone is Palantir? The one that protects the West? Or the one that looks back?', { mode: 'office', look: 'back' }),
  S('stone', 'By the end of this video, you’ll know who’s really on the other side of the glass. And it’s not who most people think.', { mode: 'glass' }, { padOut: 0.6 }),
  { id: 'title', set: 'title', params: { title: 'The Most Dangerous Company in the World', sub: 'PALANTIR · WHO IS LOOKING THROUGH THE STONE?' }, min: 5.5 },

  // ================= 1. THE SEEING STONE =================
  CH(1, 'The Seeing Stone'),
  S('hero', 'To understand Palantir, you have to start with a fraud problem.', { prop: 'cards', cam: 'top', tint: 'red' }),
  S('photo', 'Around two thousand, PayPal was being bled by fraud. Stolen cards. Fake accounts. Organised crime.', { file: 'census-tabulator-1939.jpg', treatment: 'bw', move: 'lateral' },
    { beats: [['stolen', 'terminal', { lines: ['CARD 4485 **** **** 2291 · DECLINED', 'ACCT #88213 CREATED 03:12 · FLAGGED', 'ACCT #88214 CREATED 03:12 · FLAGGED', 'TRANSFER $9,850 → RU · REVERSED'] }]] }),
  S('graph', 'Its engineers built a system that didn’t replace human investigators. It made them faster. The software found the patterns. Humans made the call.', { mode: 'fraud' },
    { beats: [['humans', 'windowfig', {}]] }),
  S('magnifier', 'Inside PayPal, it was named after a Russian fraudster the team had been chasing. Igor.', { word: 'igor', text: 'IGOR' }),
  S('timeline', 'It saved the company. And it gave Peter Thiel, PayPal’s co-founder, an idea.', { events: [{ year: 2002, label: 'EBAY BUYS PAYPAL', word: 'saved' }, { year: 2003, label: 'AN IDEA', word: 'idea' }], focus: 1, track: true }),
  S('city', 'Then came September the eleventh.', { mode: 'lightsoff', seed: 11 }, { padOut: 0.9 }),
  S('silos', 'The clues had been there. Scattered across agencies that didn’t share what they knew.', { mode: 'walls' }),
  S('graph', 'Thiel’s question was simple. If software could catch fraudsters hiding in payment data, could it catch terrorists hiding in government data?', { mode: 'scatter' },
    { beats: [['terrorists', 'graph', { mode: 'hunt' }]] }),
  S('contract', 'In May two thousand and three, Palantir was incorporated. Its own filings say it began by building software for American intelligence. For counterterrorism.', { title: 'CERTIFICATE OF INCORPORATION · DELAWARE · MAY 6 2003' },
    { beats: [['filings', 'press', { headline: '“…building software for the intelligence community…”', sub: 'PALANTIR FORM 10-K' }]] }),
  S('name', 'To run it, Thiel chose a friend from Stanford Law School. Alex Karp.', { name: 'Alex Karp', role: 'CO-FOUNDER & CEO · PALANTIR', word: 'alex' }),
  S('archivewalk', 'Karp was not a normal tech CEO. He wasn’t an engineer. He had a doctorate in social theory, from a university in Frankfurt.', { caption: 'PH.D., GOETHE UNIVERSITY FRANKFURT' }),
  S('boardroom', 'And when they pitched Silicon Valley’s biggest investors, almost nobody wanted in.', {}),
  S('boardroom', 'Karp says one of the most famous venture capitalists in the world spent their meeting doodling. Another lectured them on why they would fail.', { mode: 'empty', caption: 'AS RECOUNTED BY ALEX KARP' }),
  S('list', 'Software for spies sounded like a terrible business. Slow contracts. Secret customers. Wins you can never talk about.', { header: 'WHY INVESTORS SAID NO', items: [['slow', 'Slow contracts'], ['secret', 'Secret customers'], ['wins', 'Silent wins']] }),
  S('cash', 'So the money came from elsewhere. Thiel put in tens of millions of his own. And one of the only other outside investors was In-Q-Tel.', {},
    { beats: [['in-q-tel', 'photo', { file: 'cia-hq-aerial-2.jpg', treatment: 'selenium', move: 'rise' }]] }),
  S('numbers', 'In-Q-Tel is the venture capital arm of the Central Intelligence Agency. It put in about two million dollars.', { header: 'IN-Q-TEL · THE CIA’S VENTURE ARM', items: [{ word: 'two', value: 2, prefix: '≈ $', suffix: 'M', sub: 'reported early investment' }], source: 'SOURCE: FORBES, 2013 (REPORTED, APPROXIMATE)' }),
  S('corridor', 'For years, almost nobody outside Washington knew what the company did.', { color: 'blue' },
    { voCont: '', beats: [] }),
  S('stamp', 'A rumour spread that it helped find Osama bin Laden. Palantir has never confirmed it.', { word: 'never', text: 'UNCONFIRMED' }),
  S('stone', 'So what does the software actually do? Because it isn’t what most people imagine.', { mode: 'macro', variant: 'question' }),
  S('graph', 'Palantir doesn’t make its money selling data. Its customers already have mountains of it. Phone records. Bank transfers. Licence plates. Flight lists. Case files.', { mode: 'piles', words: ['Phone', 'Bank', 'Licence', 'Flight', 'Case'] }),
  S('silos', 'The problem is, it all lives in different places, in different formats, owned by different departments that don’t talk to each other.', { mode: 'formats' }),
  S('graph', 'Palantir connects it. A name in one database. A phone number in another. A bank account in a third. A car at a border crossing.', { mode: 'link', words: ['name', 'phone', 'bank', 'car'] }),
  S('graph', 'On their own, they’re noise. Linked together, they’re a person. Where they go. Who they know. What they might do next.', { mode: 'person' }),
  S('stone', 'That’s the seeing stone. Not a camera. A map of connections. A picture no single agency could ever see alone.', { mode: 'web' },
    { beats: [['picture', 'graph', { mode: 'map' }]] }),
  S('stone', 'Which raises the question that has followed this company for twenty years. If you can see everyone’s connections, who decides where you’re allowed to look?', { mode: 'chamber', variant: 'dark' }, { padOut: 0.8 }),

  // ================= 2. THE WAR MACHINE =================
  CH(2, 'The War Machine'),
  S('photo', 'By two thousand sixteen, Palantir had a problem. The biggest customer on earth, the U.S. Army, didn’t want it.', { file: 'pentagon-aerial-2003.jpg', treatment: 'bw', move: 'push', caption: 'THE PENTAGON', source: 'PHOTO: U.S. DOD / PUBLIC DOMAIN' }),
  S('rack', 'The Army was building its own intelligence system. One that, by many accounts, had cost billions, and frustrated the soldiers who used it.', {}),
  S('court2', 'So Palantir did something almost no defence contractor does. It sued the Army.', { caption: 'PALANTIR USG, INC. v. UNITED STATES · 2016' }),
  S('court', 'And it won. In October two thousand sixteen, a federal judge ruled the Army had broken the law by failing to consider commercial software like Palantir’s.', { word: 'won', caption: 'U.S. COURT OF FEDERAL CLAIMS · OCT 31 2016' }),
  S('dominoes', 'Suing your own customer should have been suicide. Instead, it opened the door to the Pentagon.', { word: 'opened' }),
  S('photo', 'Two years later, Google pushed that door wide open.', { file: 'pentagon-aerial-1973.jpg', treatment: 'selenium', move: 'pull' }),
  S('crowd', 'In two thousand eighteen, more than three thousand Google employees signed a letter against a Pentagon project called Maven, which used AI to analyse drone footage. Google walked away.', { caption: 'PROJECT MAVEN · 2018' },
    { beats: [['drone', 'feed', { mode: 'drone' }]] }),
  S('stamp', 'Palantir picked it up. Internally, according to Business Insider, the project got a new code name. Tron.', { word: 'tron', text: 'TRON' }),
  S('warroom', 'Maven grew into something much bigger. A system that pulls in satellite images, drone video and sensor data, and helps commanders find and prioritise targets.', { mode: 'ops' },
    { beats: [['satellite', 'feed', { mode: 'sat' }], ['prioritise', 'feed', { mode: 'priority' }]] }),
  S('bars', 'In twenty twenty-four, the contract was worth four hundred and eighty million dollars. A year later, the Pentagon raised the ceiling to about one point three billion.', { title: 'MAVEN SMART SYSTEM · CONTRACT CEILING', items: [{ label: '2024', value: 480, word: 'four', display: '$480M' }, { label: '2025', value: 1300, word: 'raised', display: '≈ $1.3B', red: true }], max: 1400, source: 'SOURCE: DEFENSESCOOP, MAY 2025 · DOD CONTRACT NOTICE' }),
  S('numbers', 'Then the Army signed one enterprise agreement with Palantir. Ceiling: up to ten billion dollars.', { header: 'U.S. ARMY ENTERPRISE AGREEMENT · JULY 2025 · 10 YEARS', items: [{ word: 'ten', value: 10, prefix: 'up to $', suffix: 'B', sub: 'ceiling, not committed spend' }], source: 'SOURCE: U.S. ARMY VIA DEFENSESCOOP, JUL 31 2025' }),
  S('warroom', 'And in March twenty twenty-six, the Pentagon made Maven a program of record. In plain English, it’s no longer an experiment. It’s part of how America fights.', { mode: 'screens', caption: 'MAVEN · PROGRAM OF RECORD · MARCH 2026', source: 'SOURCE: REUTERS, MAR 20 2026' }),
  S('map', 'To see what that means in a real war, go to Ukraine.', { mode: 'europe' }),
  S('map', 'In June two thousand twenty-two, Alex Karp crossed into Ukraine and met President Zelensky. TIME reported he was the first head of a major Western company to do so.', { mode: 'ukraine', caption: 'KYIV · JUNE 2 2022', source: 'SOURCE: TIME, “THE WAR LAB”, FEB 2024' }),
  S('quote', 'Months later, Karp made a claim that stunned even defence insiders. Palantir, he said, was responsible for most of the targeting in Ukraine.', { text: '“responsible for most of the targeting in Ukraine”', by: 'ALEX KARP · FEB 2023 · VIA REUTERS' }),
  S('feed', 'We can’t verify that. But think about what it means if it’s even partly true. A software company from California helping choose what gets hit in a European war.', { mode: 'artillery' }),
  S('map', 'In January twenty twenty-four, Palantir’s board flew to Tel Aviv and agreed a strategic partnership with Israel’s Ministry of Defense. To support, as one executive put it, war-related missions.', { mode: 'telaviv', caption: 'TEL AVIV · JANUARY 2024', source: 'SOURCE: BLOOMBERG, JAN 12 2024' }),
  S('chess', 'Most tech companies run from this kind of work. Palantir runs toward it. That’s the brand.', {}),
  S('quote', 'In the letter Karp wrote when Palantir went public, he put down four words most CEOs never would. We have chosen sides.', { text: 'We have chosen sides.', by: 'ALEX KARP · PALANTIR S-1 · AUG 2020', book: false },
    { beats: [['letter', 'contract', { title: 'FORM S-1 · PALANTIR TECHNOLOGIES INC. · 2020' }], ['we', '@self']] }),
  S('chart', 'Which brings us back to that earnings call. Scare enemies. On occasion, kill them. Investors didn’t flinch. The stock jumped the next day.', { mode: 'jump', source: 'PLTR · FEB 3–4 2025' }),
  S('police', 'But a stone that can find enemies abroad can be pointed somewhere else. And Palantir’s first test of that wasn’t on a battlefield. It was in New Orleans.', { mode: 'turn' }, { padOut: 0.8 }),

  // ================= 3. POINTED INWARD =================
  CH(3, 'Pointed Inward'),
  S('map', 'In twenty twelve, Palantir began working with the New Orleans police. Not through a normal government contract. It was set up as philanthropy, through the mayor’s office.', { mode: 'nola', caption: 'NEW ORLEANS · 2012' },
    { beats: [['philanthropy', 'contract', { title: 'MEMORANDUM · PRO BONO / PHILANTHROPIC PARTNERSHIP' }]] }),
  S('graph', 'The software mapped relationships between people. Who was connected to whom. Who might pull a trigger. And who might be on the other end of one.', { mode: 'shooters' }),
  S('police', 'According to The Verge, it ran for six years without ever going through public procurement. When the story broke in twenty eighteen, the city let the contract lapse.', { mode: 'door', source: 'SOURCE: THE VERGE, FEB 27 2018' },
    { beats: [['broke', 'press', { headline: 'Palantir has secretly been using New Orleans to test its predictive policing technology', sub: 'THE VERGE · FEB 27 2018' }]] }),
  S('photo', 'And that same year, Palantir’s name surfaced in the biggest data scandal of the decade.', { file: 'ibm704-langley-1957.jpg', treatment: 'bw', move: 'lateral' }),
  S('network', 'Cambridge Analytica. The New York Times reported that a Palantir employee had worked with the firm’s data scientists.', { mode: 'fraud', caption: 'CAMBRIDGE ANALYTICA · 2018 · VIA THE NEW YORK TIMES' }),
  S('quote', 'Palantir first said it had never had a relationship with Cambridge Analytica. Then it said the employee had acted in an entirely personal capacity.', { text: '“…in an entirely personal capacity.”', by: 'PALANTIR STATEMENT · MARCH 2018' }),
  S('photo', 'But the biggest domestic customer was still to come. Immigration.', { file: 'census-keypunch-operators-1940.jpg', treatment: 'bw', move: 'push' }),
  S('archive', 'Since twenty fourteen, Palantir has built ICE’s case management system, under a contract worth more than forty-one million dollars.', { cam: 'desk', caption: 'ICE · INVESTIGATIVE CASE MANAGEMENT · SINCE 2014 · $41M+', source: 'SOURCE: EPIC FOIA (EPIC v. ICE)' }),
  S('terminal', 'In April twenty twenty-five, ICE paid about thirty million more, for something called ImmigrationOS. Its stated goals included near real-time visibility into people leaving the country.', { lines: ['CONTRACT MOD · ICE · APR 2025 · $29.8M', 'IMMIGRATION LIFECYCLE OPERATING SYSTEM', 'DELIVERY: SEPT 25 2025', '“NEAR REAL-TIME VISIBILITY”'], source: 'SOURCE: FEDERAL CONTRACT RECORDS · BUSINESS INSIDER' }),
  S('addresses', 'And according to the outlet 404 Media, another Palantir-built tool maps potential deportation targets, and gives each address a confidence score.', { mode: 'scores', caption: 'ELITE · VIA 404 MEDIA, JAN 2026' }),
  S('addresses', 'A confidence score. The stone isn’t just showing you where someone might be. It’s telling you how sure it is.', { mode: 'one' }),
  S('quote', 'Palantir says the tool shows likely addresses of people with final removal orders or serious criminal charges.', { text: 'Palantir says the tool shows likely addresses of people with final removal orders or serious charges.', by: 'PALANTIR’S POSITION · VIA FORTUNE, JAN 2026', dim: false }),
  S('window', 'Then came the report that made even some supporters nervous.', { close: [0.5, 0.8] }),
  S('silos', 'In May twenty twenty-five, The New York Times reported that Palantir’s work was expanding across federal agencies, including the I.R.S., after an executive order told agencies to tear down the walls between their data.', { mode: 'agencies', caption: 'EXECUTIVE ORDER 14243 · “ELIMINATING INFORMATION SILOS” · MAR 2025', source: 'SOURCE: THE NEW YORK TIMES, MAY 30 2025' },
    { beats: [['tear', 'silos', { mode: 'down' }]] }),
  S('contract', 'Senator Ron Wyden and Representative Alexandria Ocasio-Cortez wrote to Karp, warning of a surveillance nightmare.', { title: 'U.S. SENATE · LETTER TO ALEX KARP · JUNE 17 2025', red: '“surveillance nightmare”' }),
  S('quote', 'Palantir called the story blatantly untrue. It says it is not building any master database of Americans.', { text: '“blatantly untrue”', by: 'PALANTIR · JUNE 2025' }),
  S('graph', 'But here’s the thing. Palantir doesn’t need to own the data to matter. Remember what the software does. It connects.', { mode: 'connects' }),
  S('silos', 'And when every wall between the data comes down, whatever does the connecting becomes the most important part of the whole system.', { mode: 'center' }),
  S('photo', 'It’s not just America. In November twenty twenty-three, England’s National Health Service gave a Palantir-led group a contract worth about three hundred and thirty million pounds, to run its new data platform.', { file: 'ibm-edpm-1957.jpg', treatment: 'sepia', move: 'push', caption: 'NHS ENGLAND · FEDERATED DATA PLATFORM · NOV 2023 · ≈ £330M', source: 'SOURCE: NHS ENGLAND' },
    { beats: [['three', 'numbers', { header: 'NHS FEDERATED DATA PLATFORM · 7 YEARS', items: [{ word: 'three', value: 330, prefix: '£', suffix: 'M', sub: 'Palantir-led consortium' }], source: 'SOURCE: NHS ENGLAND, NOV 2023' }]] }),
  S('quote', 'Britain’s doctors’ union called Palantir an unacceptable partner. A parliamentary committee urged ministers to use the contract’s break clause.', { text: '“an unacceptable partner”', by: 'BRITISH MEDICAL ASSOCIATION · JUNE 2025' }),
  S('protest', 'And on the first of October, protesters marched in more than thirty British cities.', { mode: 'march', caption: 'UK · OCT 1 2026' },
    { beats: [['thirty', 'map', { mode: 'uk' }]] }),
  S('map', 'In New York, the city’s public hospital system decided not to renew its Palantir contract. And Palantir moved its headquarters from Denver to Miami, after months of protests outside its offices.', { mode: 'us', caption: 'NYC HEALTH + HOSPITALS · DENVER → MIAMI, FEB 2026' },
    { beats: [['moved', 'hq', { mode: 'move' }]] }),
  S('wallwalk', 'So the company is under attack on every front. Doctors. Senators. Journalists. Protesters. You’d expect the business to be falling apart.', {}),
  S('monolith', 'Instead…', {}, { padOut: 0.3 }),

  // ================= 4. HALF A TRILLION =================
  CH(4, 'Half a Trillion'),
  S('chart', '…it’s having the best years in its history.', { mode: 'climb' }),
  S('exchange', 'When Palantir went public in September twenty twenty, it skipped the traditional IPO. Shares opened at ten dollars. Critics called it a consulting firm pretending to be a software company.', { mode: 'listing', caption: 'NYSE · SEPT 30 2020 · DIRECT LISTING', source: 'OPENING TRADE $10.00' }),
  S('numbers', 'That year, Karp’s pay package was valued at about one point one billion dollars. Mostly stock options.', { header: 'ALEX KARP · 2020 COMPENSATION (GRANT-DATE VALUE)', items: [{ word: 'one', value: 1.1, dec: 1, prefix: '$', suffix: 'B', sub: 'mostly stock options' }], source: 'SOURCE: PALANTIR 2021 PROXY VIA CNBC' }),
  S('stone', 'Then AI arrived.', { mode: 'awake' }, { padOut: 0.7 }),
  S('city', 'Suddenly every big company on earth wanted to point AI at its own private data. And Palantir had spent twenty years doing exactly that, for spies.', { mode: 'drone', seed: 26 }),
  S('conveyor', 'It launched a product called A.I.P., and started running what it calls bootcamps. Real workflows, on a customer’s real data, in days.', { color: 0x7dffb0 }),
  S('bars', 'The numbers went vertical. In the second quarter of twenty twenty-six, revenue was up ninety-three percent. American commercial revenue, up a hundred and forty-nine. And, for the first time, more than a billion dollars of profit in a single quarter.', { title: 'PALANTIR · Q2 2026 · YEAR-ON-YEAR GROWTH', items: [{ label: 'Total revenue', value: 93, word: 'ninety', display: '+93%' }, { label: 'U.S. commercial', value: 149, word: 'hundred', display: '+149%', red: true }], max: 160, source: 'SOURCE: PALANTIR Q2 2026 RESULTS, AUG 3 2026' },
    { beats: [['billion', 'numbers', { header: 'Q2 2026 · GAAP NET INCOME', items: [{ word: 'billion', value: 1.06, dec: 2, prefix: '$', suffix: 'B', sub: 'first billion-dollar quarter' }], source: 'SOURCE: PALANTIR 8-K, AUG 3 2026' }]] }),
  S('chart', 'But here’s the strange part. In the first half of twenty twenty-six, the stock fell by about a third. By late July it had dropped to around a hundred and eighteen dollars.', { mode: 'crash', source: 'LOW ≈ $117.89 INTRADAY · JUL 28 2026' }),
  S('chart', 'Ten weeks later, on October the ninth, it closed at a record. Two hundred and nine dollars. About half a trillion dollars in market value. More than twenty times its first price.', { mode: 'record', source: 'CLOSE OCT 9 2026: $209.05 · ≈ 21× THE $10 OPENING TRADE' },
    { beats: [['half', 'numbers', { header: 'PALANTIR · MARKET VALUE · OCT 9 2026', items: [{ word: 'half', value: 500, prefix: '≈ $', suffix: 'B' }], source: '$209.05 × ≈ 2.40B SHARES (10-Q)' }]] }),
  S('balance', 'That’s roughly eighty times what the company brings in each year. Investors aren’t paying for what Palantir is. They’re paying for what they think it’s becoming.', { left: 'REVENUE ×1', right: 'PRICE ×80', word: 'eighty' }),
  S('quote', 'And what is it becoming? Karp has told us. In August, he took aim at the big AI labs. He called their business model Marxist. Models that absorb a customer’s most valuable knowledge, and sell it back to everyone.', { text: '“Marxist”', by: 'ALEX KARP ON AI LABS · Q2 2026 SHAREHOLDER LETTER' },
    { beats: [['models', 'tunnel', {}]] }),
  S('quote', 'His promise was the opposite. A customer’s competitive advantage, he wrote, should never become the training data for future models.', { text: '“Their competitive advantage should never become the training data for future models.”', by: 'ALEX KARP · AUG 3 2026' }),
  S('lock', 'The stone that only you can look through. That’s what Wall Street is paying eighty times revenue for. Not software. Dependence.', { word: 'dependence', close: true }),
  S('stone', 'Which is exactly what the stones in Tolkien’s story promised too.', { mode: 'gift' }, { padOut: 0.7 }),

  // ================= 5. WHO'S LOOKING BACK =================
  CH(5, 'Who’s Looking Back'),
  S('stone', 'In the book, the stones were made by elves, as gifts for kings. They weren’t evil. They didn’t lie.', { mode: 'gift', variant: 'kings' }),
  S('stone', 'The danger came from who else was holding one. The enemy had captured a stone. And everyone who looked into the others was, sooner or later, seen.', { mode: 'seven', red: true, variant: 'spread' }),
  S('stone', 'The wizard Saruman looked, and was slowly turned. Gandalf calls him a spider in a steel web.', { mode: 'tower' },
    { beats: [['gandalf', 'stone', { mode: 'saruman', quote: '“the spider in a steel web”', by: TOLKIEN_TT }]] }),
  S('stone', 'Denethor, the steward of Gondor, looked too. And the enemy never showed him a single lie.', { mode: 'pyre', variant: 'look' }),
  S('stone', 'Only true things. Real armies. Real fleets. Chosen carefully. Until, as Gandalf puts it, despair overthrew his mind.', { mode: 'visions', quote: '“…until it overthrew his mind”', by: TOLKIEN_RK }),
  S('quote', 'That’s the real lesson of the stones. The danger isn’t false information. It’s someone else choosing which truths you get to see.', { text: 'The danger isn’t false information. It’s someone else choosing which truths you get to see.' }, { padOut: 0.8 }),
  S('graph', 'Now look at Palantir again. It doesn’t invent facts. It decides how facts connect. Which faces get linked. Which address gets a confidence score. Which target goes to the top of the list.', { mode: 'choose' },
    { beats: [['address', 'addresses', { mode: 'ring' }], ['target', 'feed', { mode: 'top' }]] }),
  S('warroom', 'Whoever controls those connections controls what the most powerful people on earth see when they look.', { mode: 'glow' }),
  S('boardroom', 'Palantir says the answer is simple. The customer is in control. The army. The hospital. The government.', { mode: 'night' }),
  S('clock', 'And maybe that’s true. But a government isn’t one person. It changes. Every few years, someone new gets the keys.', { fast: true },
    { beats: [['keys', 'stone', { mode: 'keys' }]] }),
  S('list', 'The Pentagon has made Maven permanent. Agencies are tearing down the walls between their data. England is deciding whether to keep the stone. Every one of those decisions makes it harder to remove.', { header: 'THE STONE, SETTLING IN', items: [['maven', 'Maven: program of record'], ['walls', 'Data silos: coming down'], ['england', 'NHS: break clause, 2027']], check: true }),
  S('stone', 'So who’s on the other side of the glass? Not a dark lord. Not even Palantir.', { mode: 'glass', variant: 'empty' }),
  S('stone', 'It’s whoever holds the stone next.', { mode: 'next' }, { padOut: 1.2 }),
  S('stone', 'In the book, Aragorn, the one man with the right to use a stone, says this about it. Dangerous indeed. But not to all.', { mode: 'aragorn', quote: '“Dangerous indeed, but not to all.”', by: TOLKIEN_TT }),
  S('stone', 'The only question that matters is who gets to be the exception.', { mode: 'office', look: 'dark' }, { padOut: 2.5 }),
  { id: 'end', set: 'title', params: { title: 'The Most Dangerous Company in the World', sub: '', end: true }, min: 7 },
];

// Lines with voCont are a single narration line split for readability; merge them back.
for (const s of shots) if (s.voCont !== undefined) { if (s.voCont) s.vo += s.voCont; delete s.voCont; }
// '@self' beat = return to the shot's own set/params on that word.
for (const s of shots) if (s.beats) s.beats = s.beats.map(b => b[1] === '@self' ? [b[0], s.set, { ...s.params, _again: 1 }] : b);
for (const s of shots) if (s.beats && !s.beats.length) delete s.beats;

export default {
  title: 'The Most Dangerous Company in the World',
  fps: 30,
  width: 1920,
  height: 1080,
  voice: { engine: 'kokoro', name: 'af_heart', speed: 0.96,
    say: { 'In-Q-Tel': 'In Q Tel', ICE: 'Ice', 'ICE’s': 'Ice’s', ImmigrationOS: 'Immigration O.S.', '404': 'four oh four', 'A.I.P.': 'A.I.P.', Denethor: 'Denn-eth-or', 'S-1': 'S one' } },
  timing: { padIn: 0.15, padOut: 0.4 },
  dissolve: 0.3,
  aa: 'fxaa',
  finish: { grain: 6, halation: 16, halationAmount: 0.42, bloom: 0.16, vignette: 0.55 },
  shots,
  score: {
    key: 'C', drone: 0.15,
    sections: [{ shot: 'ch1', key: 'E' }, { shot: 'ch2', key: 'D' }, { shot: 'ch3', key: 'F' }, { shot: 'ch4', key: 'A' }, { shot: 'ch5', key: 'C' }, { shot: 'end', key: 'C' }],
    silenceDrone: ['title', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'end'],
  },
  cues(shots) {
    const c = [];
    for (const s of shots) {
      const P = s.params || {};
      if (s.set === 'chapter' || s.set === 'title') c.push({ type: 'clang', shot: s.id, at: 0.05, gain: 0.55 }, { type: 'boom', shot: s.id, at: 0.05, gain: 0.55 }, { type: 'swell', shot: s.id, at: 0, dur: 2.0, gain: 0.22 });
      if (s.set === 'stone') c.push({ type: 'hum', shot: s.id, at: 0, gain: P.mode === 'eye' || P.mode === 'awake' ? 0.2 : 0.11 });
      if (s.set === 'stone' && (P.mode === 'eye' || P.mode === 'awake' || P.red)) c.push({ type: 'swell', shot: s.id, at: 0.2, dur: 2.2, gain: 0.25 });
      if (s.set === 'name' && P.word) c.push({ type: 'boom', shot: s.id, word: P.word, gain: 0.45 });
      if (s.set === 'bars') for (const it of P.items ?? []) if (it.word) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.32 });
      if (s.set === 'numbers') for (const it of P.items ?? []) c.push({ type: 'boom', shot: s.id, word: it.word, gain: 0.3 });
      if (s.set === 'quote' && P.red) c.push({ type: 'boom', shot: s.id, at: 0.1, gain: 0.4 }, { type: 'pulse', shot: s.id, at: 0, gain: 0.26, bpm: 54 });
      if (s.set === 'stamp' || s.set === 'court') c.push({ type: 'clunk', shot: s.id, word: P.word, gain: 0.5 });
      if (s.set === 'warroom' || s.set === 'feed') c.push({ type: 'ticks', shot: s.id, at: 0, gain: 0.1, period: 0.5 });
      if (s.set === 'chart' && (P.mode === 'crash' || P.mode === 'record' || P.mode === 'spike')) c.push({ type: 'whoosh', shot: s.id, at: 0.4, gain: 0.3 });
      if (s.set === 'protest') c.push({ type: 'water', shot: s.id, at: 0, gain: 0.12 });
      if (s.vo?.startsWith('Then came September')) c.push({ type: 'boom', shot: s.id, at: 0.3, gain: 0.6 }); // September the eleventh
    }
    return c;
  },
};
