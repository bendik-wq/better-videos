// micro1 shorts 07: industry, consulting & professional services. Script: projects/micro1/SCRIPTS.md §07.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, cta, redact, securityQuote, PREP } from '../micro1/common.mjs';

export default episode({ aspect: '16:9', title: 'Consultancies: There’s Now a Buyer for Your Frameworks', shots: [
  S('industry', 'Consultancies sell expertise by the hour. Now there may be a buyer for the frameworks behind it.', { name: 'CONSULTING', icon: 'briefcase', items: ['Engagement playbooks', 'Deliverable templates', 'Review checklists'], kicker: 'INDUSTRY' }),
  billion('micro1 has committed a billion dollars over twelve months to license operational data from businesses, and consulting and professional services are on its list.', { sub: 'CONSULTING: ON THE LIST' }),
  S('docstack', 'Engagement playbooks. Discovery questionnaires. Deliverable templates. Review checklists. Project histories showing how work actually moved from kickoff to close.', { title: 'THE METHOD', docs: [{ label: 'ENGAGEMENT PLAYBOOK', word: 'Engagement' }, { label: 'DISCOVERY QUESTIONS', word: 'Discovery' }, { label: 'DELIVERABLE TEMPLATE', word: 'Deliverable' }, { label: 'REVIEW CHECKLIST', word: 'Review' }, { label: 'PROJECT HISTORY', word: 'histories' }] }),
  S('hook', 'That’s the hard won method behind every project you’ve delivered.', { lines: ['THE HARD-WON', 'METHOD BEHIND', 'EVERY PROJECT.'], highlight: 'METHOD' }),
  S('flow', 'AI agents are being trained to do professional work. To learn, they need realistic environments built from how real firms operate.', { title: 'WHY IT’S WANTED', steps: [{ text: 'How real firms operate', icon: 'building', word: 'firms' }, { text: 'Realistic environment', icon: 'gear', word: 'environments' }, { text: 'AI does professional work', icon: 'chip', word: 'professional' }] }),
  securityQuote('micro1 says it does not aim to replicate businesses, products, customers or competitive advantages. The data is used to train and evaluate AI.', 'It’s not our goal to replicate businesses, products, customers, or competitive advantages.', { highlight: ['competitive advantages'] }),
  redact('Client names and confidential details? Scrubbed, according to micro1. You keep ownership.', 'consulting', { at: 'Scrubbed' }),
  S('hook', 'One rule before you apply: check your client agreements. Make sure the process knowledge is yours to license.', { lines: ['RULE #1:', 'CHECK CLIENT', 'AGREEMENTS.'], highlight: 'AGREEMENTS.' }),
  S('hook', 'Your methodology took years and hundreds of engagements to refine. Licensing the process behind it, de-identified, means it earns again without you giving away a single client.', { lines: ['YOUR METHOD', 'EARNS AGAIN.', 'NO CLIENT', 'GIVEN AWAY.'], highlight: 'EARNS AGAIN.' }),
  tiers('Reported payouts start at a hundred thousand dollars and run past a million for highly unique, proprietary know-how. Not guaranteed.', { tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Large or ongoing', word: 'past' }, { amount: '$1M+', label: 'Proprietary know-how', word: 'million' }] }),
  team('Firms of roughly thirty to two hundred people with mature processes are the target.', { label: '30–200 · MATURE FIRMS' }),
  cta('If you run a firm like this, the link to apply is in my bio.'),
  ...PREP.A(),
  S('hook', 'Your method took years and hundreds of engagements to build. It may be worth more than your hourly rate ever was.', { lines: ['YEARS TO', 'BUILD.', 'WORTH MORE', 'THAN AN HOUR.'], highlight: 'WORTH MORE' }, { padOut: 1.0 }),
] });
