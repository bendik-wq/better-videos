// micro1 shorts 06: industry, recruiting & BPO. Script: projects/micro1/SCRIPTS.md §06.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, window12, cta, redact, SRC_PAGE, PREP } from '../micro1/common.mjs';

export default episode({ title: 'Recruiting & BPO: Your Playbooks Could Be Worth Six Figures', shots: [
  S('industry', 'If you run a recruiting agency or an outsourcing team, your playbooks might be worth a lot more than you think.', { name: 'RECRUITING & BPO', icon: 'people', items: ['Sourcing playbooks', 'Screening scripts', 'QA rubrics'], kicker: 'INDUSTRY' }),
  billion('micro1 has committed a billion dollars over twelve months to license operational data from businesses. Recruiting and BPOs are on its list of example sectors.', { sub: 'RECRUITING & BPO: ON THE LIST' }),
  S('docstack', 'Think about what you already have. Sourcing playbooks. Screening scripts. Candidate pipeline stages. Client onboarding checklists. Quality assurance rubrics. Escalation procedures.', { title: 'WHAT YOU ALREADY HAVE', docs: [{ label: 'SOURCING PLAYBOOK', word: 'Sourcing' }, { label: 'SCREENING SCRIPT', word: 'Screening' }, { label: 'PIPELINE STAGES', word: 'pipeline' }, { label: 'ONBOARDING CHECKLIST', word: 'onboarding' }, { label: 'QA RUBRIC', word: 'assurance' }, { label: 'ESCALATIONS', word: 'Escalation' }] }),
  S('hook', 'That’s exactly what AI agents need to learn real recruiting and operations work.', { lines: ['EXACTLY WHAT', 'AI AGENTS', 'NEED TO LEARN.'], highlight: 'NEED TO LEARN.' }),
  S('flow', 'micro1 uses this kind of data to build realistic training environments, where AI practises real workflows.', { title: 'WHERE IT GOES', steps: [{ text: 'Your recruiting playbooks', icon: 'people', word: 'data' }, { text: 'Scrub & anonymize', icon: 'shield', word: 'build' }, { text: 'Realistic training environment', icon: 'gear', word: 'environments' }, { text: 'AI practises real work', icon: 'chip', word: 'practises' }] }),
  redact('And no, you’re not selling your candidates or your clients. micro1 says sensitive and personal information is scrubbed and nothing is exposed.', 'recruiting', { at: 'scrubbed' }),
  team('The program targets teams of roughly thirty to two hundred people. In recruiting and BPO, that’s a mature, process heavy shop.', { label: '30–200 · PROCESS-HEAVY' }),
  S('hook', 'Picture it. Every req you’ve filled taught your team something about sourcing, screening and closing. That knowledge lives in your playbooks and your pipeline history. That’s the asset.', { lines: ['EVERY REQ', 'YOU FILLED', 'IS IN YOUR', 'PLAYBOOK.'], highlight: 'PLAYBOOK.' }),
  tiers('Reported payouts start at a hundred thousand dollars, five hundred thousand and up for ongoing, multi team participation, and past a million for highly unique data. Not guaranteed.', { tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Ongoing, multi-team', word: 'five' }, { amount: '$1M+', label: 'Highly unique data', word: 'million' }] }),
  S('checklist', 'Volume helps. Repeatable workflows help. Clean documentation helps a lot.', { title: 'WHAT HELPS', items: [{ text: 'Volume', word: 'Volume' }, { text: 'Repeatable workflows', word: 'Repeatable' }, { text: 'Clean documentation', word: 'Clean' }] }),
  ...PREP.C(),
  window12('The budget runs for twelve months. The earlier you apply, the earlier you’re reviewed.', { sub: 'APPLY EARLY · REVIEWED EARLY' }),
  cta('Recruiting and BPO teams: the link is in the description. About two minutes to apply.'),
] });
