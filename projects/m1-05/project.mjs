// micro1 shorts 05: FAQ "Why would AI pay for my SOPs?" Script: projects/micro1/SCRIPTS.md §05.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, team, cta, redact, SRC_PR, PREP } from '../micro1/common.mjs';

export default episode({ aspect: '16:9', title: 'Why AI Companies Want Your Boring SOPs', shots: [
  S('hook', 'Why would an AI company pay six figures for your boring internal documents?', { lines: ['SIX FIGURES', 'FOR YOUR', 'BORING DOCS?'], highlight: 'BORING', accent: 'SIX FIGURES' }),
  S('flow', 'Because the next wave of AI isn’t chatbots. It’s agents that do the work: processing claims, onboarding clients, running a recruiting pipeline.', { title: 'THE NEXT WAVE', steps: [{ text: 'Processing claims', icon: 'doc', word: 'claims' }, { text: 'Onboarding clients', icon: 'people', word: 'onboarding' }, { text: 'Running recruiting', icon: 'search', word: 'recruiting' }] }),
  S('hook', 'And agents learn the way people do. By practising.', { lines: ['AGENTS LEARN', 'BY PRACTISING.'], highlight: 'PRACTISING.' }),
  S('flow', 'They practise in reinforcement learning environments. Simulated versions of real business workflows, where the AI tries, fails, gets scored and tries again.', { title: 'REINFORCEMENT LEARNING', steps: [{ text: 'Try', icon: 'gear', word: 'tries' }, { text: 'Fail', icon: 'cross', word: 'fails' }, { text: 'Get scored', icon: 'chart', word: 'scored' }, { text: 'Try again', icon: 'chip', word: 'again' }] }),
  S('docstack', 'To build those simulations, you need the real thing. Real SOPs. Real workflows. Real decision patterns from real teams.', { title: 'THE REAL THING', docs: [{ label: 'REAL SOPS', word: 'SOPs' }, { label: 'REAL WORKFLOWS', word: 'workflows' }, { label: 'DECISION PATTERNS', word: 'decision' }] }),
  billion('That’s why micro1 just committed a billion dollars over twelve months to license operational data from businesses, with capital from Citi and Hercules Capital.', { sub: 'CAPITAL: CITI · HERCULES CAPITAL' }),
  S('hook', 'The internet has run out of easy training data. What AI hasn’t seen is the inside of a well run company.', { lines: ['AI HAS READ', 'THE INTERNET.', 'IT HASN’T SEEN', 'YOUR COMPANY.'], highlight: 'YOUR COMPANY.' }),
  S('hook', 'Here’s the twist. The companies that documented everything, the ones people called bureaucratic, are now the ones sitting on the most valuable asset in the room.', { lines: ['“BUREAUCRATIC”', 'JUST BECAME', 'VALUABLE.'], highlight: 'VALUABLE.', strike: '“BUREAUCRATIC”' }),
  team('And that’s what a thirty to two hundred person team with years of documentation has.'),
  tiers('Reported tiers: a hundred thousand dollars and up, five hundred thousand and up, and a million and up for highly unique data. Not guaranteed.'),
  redact('Sensitive and customer information is scrubbed, and you keep ownership.', 'onboarding', { title: 'QA REVIEW PROCESS', at: 'scrubbed' }),
  ...PREP.B(),
  cta('Your boring docs could be your next revenue line. The link is in my bio.'),
] });
