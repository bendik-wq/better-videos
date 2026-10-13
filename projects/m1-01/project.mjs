// micro1 shorts 01: the overview. Script: projects/micro1/SCRIPTS.md §01. Facts: projects/micro1/RESEARCH.md.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, window12, cta, redact, securityQuote, SRC_PAGE, PREP } from '../micro1/common.mjs';

export default episode({ title: 'A $1 Billion Budget to Buy How Your Company Works', shots: [
  S('hook', 'An AI company just set aside one billion dollars. Not for chips. Not for servers. For the way your company works.', { lines: ['$1 BILLION', 'NOT FOR CHIPS.', 'FOR HOW YOUR', 'COMPANY WORKS.'], strike: 'CHIPS.', highlight: 'COMPANY' }),
  billion('On October ninth, a company called micro1 committed to spend one billion dollars over the next twelve months, licensing operational data from real businesses.'),
  S('docstack', 'Operational data means your playbooks. Your SOPs. Your knowledge base. The step by step of how your team actually gets work done.', { title: 'OPERATIONAL DATA =', docs: [{ label: 'PLAYBOOK', word: 'playbooks' }, { label: 'SOP', word: 'SOPs' }, { label: 'KNOWLEDGE BASE', word: 'knowledge' }, { label: 'HOW WORK GETS DONE', word: 'step' }] }),
  S('flow', 'Why would anyone pay for that? Because AI agents learn by practising in realistic environments. And the most realistic environment is a real business.', { title: 'WHY PAY FOR IT?', steps: [{ text: 'Real business workflows', icon: 'building', word: 'Why' }, { text: 'Realistic practice environment', icon: 'gear', word: 'environments' }, { text: 'AI agents learn by doing', icon: 'chip', word: 'real' }] }),
  S('qa', 'So who qualifies?', { q: 'So who qualifies?', a: 'Mid-size teams.', at: 0.9 }),
  team('micro1 says it’s looking for companies with roughly thirty to two hundred employees.'),
  S('checklist', 'Strong operations. Lots of internal documentation. Modern software tools. Workflows your team repeats every day.', { title: 'THE PROFILE', items: [{ text: 'Strong operations', word: 'operations' }, { text: 'Lots of documentation', word: 'documentation' }, { text: 'Modern software', word: 'software' }, { text: 'Repeated workflows', word: 'repeats' }] }),
  S('hook', 'Think about what that means. Years of meetings, mistakes, fixes and process improvements, all written down by your team. AI labs can’t scrape that from the internet. You’re one of the few who has it.', { lines: ['YEARS OF', 'FIXES &', 'PROCESS.', 'NOT ON THE', 'INTERNET.'], highlight: 'NOT ON THE', accent: 'PROCESS.' }),
  tiers('And the money? Reported payout tiers start at a hundred thousand dollars, go to five hundred thousand and up for large or ongoing datasets, and past a million for truly unique data.'),
  S('bignum', 'micro1’s own page says it already has more than a hundred partner companies, and has generated over two hundred million dollars for partners.', { value: 200, prefix: '$', suffix: 'M+', label: 'GENERATED FOR PARTNERS', sub: '100+ PARTNER COMPANIES · PER MICRO1', source: SRC_PAGE }),
  redact('And no, they don’t want your customers. micro1 says sensitive and customer information is scrubbed, nothing is shared publicly, and you keep ownership of your data.', 'onboarding', { at: 'scrubbed' }),
  ...PREP.A(),
  window12('Here’s the part that matters. The budget is for the next twelve months. Once it’s spent, it’s spent.', { fill: 0.05 }),
  S('hook', 'The companies that move first get looked at first.', { lines: ['MOVE FIRST.', 'GET LOOKED', 'AT FIRST.'], highlight: 'FIRST.' }),
  cta('Search micro1 Company Data Partnerships. The interest form takes about two minutes. Links and sources are in the description.'),
] });
