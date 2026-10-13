// micro1 shorts 04: FAQ "How much could my company get?" Script: projects/micro1/SCRIPTS.md §04.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, window12, cta, redact, SRC_PAGE, SRC_TIERS, PREP } from '../micro1/common.mjs';

export default episode({ aspect: '16:9', title: 'How Much Could Your Company’s Data Be Worth?', shots: [
  S('bignum', 'A hundred thousand dollars. That’s where the reported payouts start for licensing your company’s operational data.', { value: 100000, prefix: '$', suffix: '+', commas: true, label: 'WHERE REPORTED PAYOUTS START', source: SRC_TIERS }),
  billion('Here’s the setup. micro1 has committed one billion dollars over the next twelve months to license real business data for AI training.'),
  tiers('Reported tiers: a hundred thousand dollars and up for a qualified partnership. Five hundred thousand and up for large scale datasets or ongoing participation across several teams. And a million dollars and up for highly unique, proprietary operational data.', { tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Large-scale or multi-team', word: 'Five' }, { amount: '$1M+', label: 'Highly unique, proprietary', word: 'million' }] }),
  S('checklist', 'What moves you up the ladder? micro1 says compensation depends on dataset size, workflow complexity, how unique your operational knowledge is, data quality and domain expertise.', { title: 'WHAT SETS THE PRICE', items: [{ text: 'Dataset size', word: 'size' }, { text: 'Workflow complexity', word: 'complexity' }, { text: 'Uniqueness', word: 'unique' }, { text: 'Quality', word: 'quality' }, { text: 'Domain expertise', word: 'expertise' }], source: SRC_PAGE }),
  S('hook', 'So a thirty person team with years of detailed playbooks can be worth more than a bigger company with nothing written down.', { lines: ['30 PEOPLE', '+ GREAT DOCS', 'CAN BEAT', 'A BIG COMPANY.'], highlight: 'GREAT DOCS', strike: 'A BIG COMPANY.' }),
  S('docstack', 'Think SOPs, knowledge bases, project histories, templates, QA processes.', { title: 'THE ASSETS', docs: [{ label: 'SOP', word: 'SOPs' }, { label: 'KNOWLEDGE BASE', word: 'knowledge' }, { label: 'PROJECT HISTORY', word: 'project' }, { label: 'TEMPLATES', word: 'templates' }, { label: 'QA PROCESS', word: 'QA' }] }),
  team('The sweet spot is roughly thirty to two hundred employees, with strong operations and modern tools.', { label: 'THE SWEET SPOT · 30–200' }),
  S('hook', 'And remember why they pay. The more your data looks like real, complex, day to day work, the more useful it is for training AI agents. Depth beats size.', { lines: ['DEPTH', 'BEATS', 'SIZE.'], highlight: 'DEPTH' }),
  redact('And it’s not about your customers. Sensitive and customer information is scrubbed, and you keep ownership.', 'onboarding', { title: 'CUSTOMER SUCCESS PLAYBOOK', at: 'scrubbed' }),
  S('quote', 'These are reported ranges, not guarantees. Every deal is evaluated on what you actually have.', { text: 'Selected partners receive significant compensation based on: Dataset size/Volume · Workflow complexity · Uniqueness of operational knowledge · Data quality · Domain expertise represented', by: 'micro1, Company Data Partnerships page', highlight: ['significant compensation'], source: SRC_PAGE }),
  cta('If you want to find out what yours could be worth, the link is in my bio. The form takes about two minutes.'),
  ...PREP.A(),
  window12('But the budget is set for twelve months, and it isn’t unlimited.', { sub: 'NOT UNLIMITED' }),
] });
