// micro1 shorts 09: industry, legal & compliance. Script: projects/micro1/SCRIPTS.md §09.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, window12, cta, redact, securityQuote, PREP } from '../micro1/common.mjs';

export default episode({ aspect: '16:9', title: 'Legal & Compliance Teams: Your Habit of Writing Everything Down Pays', shots: [
  S('industry', 'Legal and compliance teams write everything down. That habit may now be worth real money.', { name: 'LEGAL & COMPLIANCE', icon: 'scales', items: ['Intake procedures', 'Review checklists', 'Policy libraries'], kicker: 'INDUSTRY' }),
  billion('micro1 has committed a billion dollars over twelve months to license operational data, and legal and compliance is on its list of example sectors.', { sub: 'LEGAL & COMPLIANCE: ON THE LIST' }),
  S('docstack', 'Intake procedures. Matter workflows. Review checklists. Policy libraries. Templates and precedent processes. Escalation playbooks.', { title: 'THE KNOW-HOW', docs: [{ label: 'INTAKE', word: 'Intake' }, { label: 'MATTER WORKFLOW', word: 'Matter' }, { label: 'REVIEW CHECKLIST', word: 'Review' }, { label: 'POLICY LIBRARY', word: 'Policy' }, { label: 'TEMPLATES', word: 'Templates' }, { label: 'ESCALATIONS', word: 'Escalation' }] }),
  S('hook', 'It’s the structured, repeatable know-how that AI agents struggle to learn from the public internet.', { lines: ['STRUCTURED.', 'REPEATABLE.', 'NOT ON THE', 'INTERNET.'], highlight: 'NOT ON THE' }),
  redact('Privileged or client information? micro1 says sensitive information is scrubbed, all confidential information is removed, and no customer information is exposed.', 'legal', { at: 'scrubbed' }),
  S('hook', 'And of course, a legal team will want to read the agreement line by line. That’s a feature, not a bug.', { lines: ['READ IT', 'LINE BY LINE.', 'A FEATURE,', 'NOT A BUG.'], highlight: 'A FEATURE,' }),
  securityQuote('The data is used only to build environments that train and evaluate AI on realistic business work.', 'The sole purpose of this initiative is to help train and evaluate AI systems on realistic enterprise settings.', { highlight: ['sole purpose'] }),
  S('hook', 'Every matter your team has run through a clear intake, review and sign-off process is a worked example of judgment. That’s what AI agents are missing.', { lines: ['EVERY MATTER', 'IS A WORKED', 'EXAMPLE OF', 'JUDGMENT.'], highlight: 'JUDGMENT.' }),
  tiers('Reported payouts start at a hundred thousand dollars, and run past a million for highly unique, proprietary operational data. Not guaranteed.', { tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Large or ongoing', word: 'past' }, { amount: '$1M+', label: 'Highly unique data', word: 'million' }] }),
  team('The target is teams of roughly thirty to two hundred people with mature processes.'),
  cta('If you want to read the terms yourself, the link is in my bio.'),
  ...PREP.C(),
  window12('The budget runs for twelve months.'),
] });
