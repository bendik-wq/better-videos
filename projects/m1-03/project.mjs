// micro1 shorts 03: FAQ "Is my data safe?" Script: projects/micro1/SCRIPTS.md §03.
import { episode } from '../micro1-kit/episode.mjs';
import { S, billion, tiers, window12, cta, redact, securityQuote, SRC_PAGE, PREP } from '../micro1/common.mjs';

export default episode({ aspect: '16:9', title: 'Is It Safe to License Your Company Data to AI?', shots: [
  S('qa', 'Would you hand your company’s internal documents to an AI company? Here’s how this program says it protects you.', { q: 'Would you hand your internal docs to an AI company?', a: 'Here’s the protection.', at: 'protects' }),
  billion('micro1 is spending a billion dollars over twelve months to license operational data from businesses. The first question every owner asks is about safety.', { label: 'FIRST QUESTION: IS IT SAFE?', highlight: 'SAFE?' }),
  redact('Step one is anonymization. micro1 says it handles the anonymization itself, and that sensitive information is scrubbed before any downstream use.', 'finance', { title: 'STEP 1 · ANONYMIZATION', at: 'scrubbed' }),
  securityQuote('In its own words: all confidential information is removed, and no customer information is exposed.', 'All confidential information is removed. No customer information is exposed.', { highlight: ['removed', 'exposed'] }),
  S('checklist', 'Step two is ownership. You keep ownership of your underlying data. You’re licensing it, not handing over the keys.', { title: 'STEP 2 · OWNERSHIP', items: [{ text: 'You keep ownership', word: 'keep' }, { text: 'Licensed, not sold', word: 'licensing' }, { text: '!Handing over the keys', word: 'keys' }] }),
  S('flow', 'Step three is retention. micro1 says original datasets are kept only for processing, and deleted afterwards.', { title: 'STEP 3 · RETENTION', steps: [{ text: 'Original dataset', icon: 'doc', word: 'original' }, { text: 'Processing only', icon: 'gear', word: 'processing' }, { text: 'Deleted afterwards', icon: 'shield', word: 'deleted' }] }),
  securityQuote('And it says nothing is publicly shared, and that it doesn’t aim to replicate your business, your products or your competitive edge.', 'It’s not our goal to replicate businesses, products, customers, or competitive advantages.', { highlight: ['not our goal'] }),
  S('flow', 'The data is used for one thing: training and evaluating AI systems on realistic business settings.', { title: 'USED FOR ONE THING', steps: [{ text: 'De-identified data', icon: 'shield', word: 'data' }, { text: 'Train AI', icon: 'chip', word: 'training' }, { text: 'Evaluate AI', icon: 'search', word: 'evaluating' }] }),
  S('hook', 'Think of it like licensing a recipe without giving away the restaurant. They learn the steps. They never get your customers, your name or your secret sauce.', { lines: ['LICENSE', 'THE RECIPE.', 'KEEP THE', 'RESTAURANT.'], highlight: 'KEEP THE', accent: 'RECIPE.' }),
  S('hook', 'Our advice is to do what any smart operator would. Read the agreement. Check your client contracts. Loop in your counsel.', { lines: ['READ IT.', 'CHECK CLIENT', 'CONTRACTS.', 'ASK COUNSEL.'], highlight: 'CONTRACTS.' }),
  securityQuote('micro1’s page puts it simply: all data is handled under strict contractual protections.', 'All data is handled under strict contractual protections.', { highlight: ['strict contractual'] }),
  ...PREP.C(),
  tiers('Because the upside is real. Reported tiers start at a hundred thousand dollars and run past a million, depending on volume and uniqueness. Not guaranteed.', { title: 'THE UPSIDE · REPORTED TIERS', tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Large or ongoing', word: 'past' }, { amount: '$1M+', label: 'Highly unique data', word: 'million' }] }),
  window12('And the budget runs for twelve months.'),
  cta('The link is in my bio. Read the terms, then decide.'),
] });
