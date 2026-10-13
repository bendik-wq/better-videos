// micro1 shorts 08: industry, financial services. Script: projects/micro1/SCRIPTS.md §08.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, window12, cta, redact, PREP } from '../micro1/common.mjs';

export default episode({ title: 'Financial Firms: Your Process Now Has a Price', shots: [
  S('industry', 'Financial firms run on process. And right now, process has a price.', { name: 'FINANCIAL SERVICES', icon: 'chart', items: ['Onboarding procedures', 'Approval workflows', 'Compliance checklists'], kicker: 'INDUSTRY' }),
  billion('micro1 is spending a billion dollars over twelve months licensing operational data from businesses. Financial services is one of its example sectors.', { sub: 'FINANCIAL SERVICES: ON THE LIST' }),
  S('docstack', 'Onboarding procedures. Review and approval workflows. Compliance checklists. Reconciliation steps. Internal knowledge bases.', { title: 'YOUR OPERATING MANUAL', docs: [{ label: 'ONBOARDING', word: 'Onboarding' }, { label: 'APPROVAL WORKFLOW', word: 'approval' }, { label: 'COMPLIANCE CHECKLIST', word: 'Compliance' }, { label: 'RECONCILIATION', word: 'Reconciliation' }, { label: 'KNOWLEDGE BASE', word: 'knowledge' }] }),
  S('hook', 'Not your clients’ accounts. Your operating manual.', { lines: ['NOT CLIENT', 'ACCOUNTS.', 'YOUR OPERATING', 'MANUAL.'], strike: 'ACCOUNTS.', highlight: 'MANUAL.' }),
  redact('micro1 says sensitive information is scrubbed before any use, customer information isn’t exposed, and nothing is shared publicly.', 'finance', { at: 'scrubbed' }),
  S('flow', 'The data goes into realistic training environments, so AI agents can learn how real financial operations get done.', { title: 'WHERE IT GOES', steps: [{ text: 'Your procedures, de-identified', icon: 'shield', word: 'data' }, { text: 'Realistic training environment', icon: 'gear', word: 'environments' }, { text: 'AI learns real finance ops', icon: 'chart', word: 'financial' }] }),
  S('checklist', 'What makes a strong candidate? Thirty to two hundred people. Heavy documentation. Modern software. Workflows your team repeats daily.', { title: 'STRONG CANDIDATE', items: [{ text: '30–200 people', word: 'Thirty' }, { text: 'Heavy documentation', word: 'documentation' }, { text: 'Modern software', word: 'software' }, { text: 'Daily workflows', word: 'daily' }] }),
  S('hook', 'Financial teams already document more than almost anyone, because regulators make them. That discipline is exactly what makes the data valuable here.', { lines: ['REGULATORS', 'MADE YOU', 'DOCUMENT IT.', 'NOW IT PAYS.'], highlight: 'NOW IT PAYS.' }),
  tiers('Reported tiers: a hundred thousand dollars and up, five hundred thousand and up for large or ongoing datasets, a million and up for highly unique data. Not guaranteed.'),
  S('hook', 'In a regulated business, bring your compliance team in early. Done right, this is a new revenue line from work you’ve already done.', { lines: ['COMPLIANCE', 'IN EARLY.', 'NEW REVENUE', 'FROM OLD WORK.'], highlight: 'NEW REVENUE' }),
  ...PREP.B(),
  window12('The budget is set for the next twelve months.'),
  cta('Search micro1 Company Data Partnerships. Two minutes to apply.'),
] });
