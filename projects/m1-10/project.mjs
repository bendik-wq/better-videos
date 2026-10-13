// micro1 shorts 10: industry, logistics. Script: projects/micro1/SCRIPTS.md §10.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, window12, cta, redact, PREP } from '../micro1/common.mjs';

export default episode({ title: 'Logistics Companies: AI Wants to Learn How You Solve Problems', shots: [
  S('industry', 'Every logistics company has a way of doing things that nobody else has. AI wants to learn it.', { name: 'LOGISTICS', icon: 'truck', items: ['Dispatch procedures', 'Exception handling', 'Claims workflows'], kicker: 'INDUSTRY' }),
  billion('micro1 has committed a billion dollars over twelve months to license operational data from businesses, and logistics is on its list of example sectors.', { sub: 'LOGISTICS: ON THE LIST' }),
  S('docstack', 'Dispatch procedures. Exception handling. Carrier onboarding. Warehouse SOPs. Claims workflows. The tickets and task histories that show how problems actually get solved.', { title: 'HOW YOU SOLVE IT', docs: [{ label: 'DISPATCH', word: 'Dispatch' }, { label: 'EXCEPTIONS', word: 'Exception' }, { label: 'CARRIER ONBOARDING', word: 'Carrier' }, { label: 'WAREHOUSE SOP', word: 'Warehouse' }, { label: 'CLAIMS', word: 'Claims' }, { label: 'TASK HISTORY', word: 'tickets' }] }),
  S('hook', 'That’s thousands of real decisions. Exactly what AI agents need to practise on.', { lines: ['THOUSANDS', 'OF REAL', 'DECISIONS.'], highlight: 'DECISIONS.' }),
  S('flow', 'micro1 turns that into realistic training environments, so AI can learn real operational work.', { title: 'WHERE IT GOES', steps: [{ text: 'Your ops history', icon: 'truck', word: 'that' }, { text: 'Scrub & anonymize', icon: 'shield', word: 'realistic' }, { text: 'Training environment', icon: 'gear', word: 'environments' }, { text: 'AI learns real ops', icon: 'chip', word: 'operational' }] }),
  redact('Customer and shipment details? micro1 says sensitive information is scrubbed and customer information isn’t exposed. You keep ownership.', 'logistics', { at: 'scrubbed' }),
  S('checklist', 'Strong candidates have thirty to two hundred employees, well defined workflows, modern tools and lots of documentation.', { title: 'STRONG CANDIDATE', items: [{ text: '30–200 employees', word: 'thirty' }, { text: 'Defined workflows', word: 'workflows' }, { text: 'Modern tools', word: 'tools' }, { text: 'Lots of documentation', word: 'documentation' }] }),
  S('hook', 'Late trucks, damaged freight, missed handoffs. Every exception your team solved and logged is a lesson an AI agent needs. You’ve been building this dataset for years without knowing it.', { lines: ['EVERY EXCEPTION', 'YOU LOGGED', 'IS A LESSON', 'AI NEEDS.'], highlight: 'A LESSON', accent: 'EVERY EXCEPTION' }),
  tiers('Reported payouts start at a hundred thousand dollars, with five hundred thousand and up for ongoing, multi team participation and a million and up for highly unique data. Not guaranteed.', { tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Ongoing, multi-team', word: 'five' }, { amount: '$1M+', label: 'Highly unique data', word: 'million' }] }),
  S('hook', 'It’s new revenue from knowledge you’ve already built.', { lines: ['NEW REVENUE.', 'OLD KNOWLEDGE.'], highlight: 'NEW REVENUE.' }),
  ...PREP.A(),
  window12('The budget is set for the next twelve months. First in line, first reviewed.', { sub: 'FIRST IN LINE · FIRST REVIEWED' }),
  cta('The link is in the description. About two minutes to apply. First in line, first reviewed.'),
] });
