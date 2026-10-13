// LEDGER kit demo (~45 s vertical): every set once, with real VO. Independent channel, not affiliated with micro1.
// Facts used: micro1 "Company Data Partnerships": $1B over 12 months, announced 9 Oct 2026; companies with 30–200
// employees; de-identified operational data (SOPs, playbooks, knowledge bases, process docs, workflow metadata);
// published payout tiers $100K+ / $500K+ / $1M+. The quote card is a labelled placeholder (no verbatim source text yet).
import { shot as S } from './episode.mjs';

const SRC = 'SOURCE: MICRO1 · COMPANY DATA PARTNERSHIPS';

export const demoShots = (aspect = '9:16') => [
    S('hook', 'micro1 just put a billion dollars on the table. For your boring docs.',
      { lines: ['$1 BILLION', 'FOR YOUR', 'BORING DOCS'], highlight: 'BORING', accent: 'BILLION', kicker: 'NEWS · 9 OCT 2026' }),
    S('bignum', 'One billion dollars, committed over twelve months.',
      { value: 1000000000, prefix: '$', label: 'Committed over 12 months', highlight: '12', sub: 'Announced 9 Oct 2026', source: SRC }),
    S('window', 'The clock started on October ninth.',
      { label: '$1B · 12 MONTHS', fill: 1 / 12, at: 'clock', start: 'OCT', year: 2026, mark: 'NOW' }),
    S('team', 'They want companies with thirty to two hundred employees.',
      { min: 30, max: 200, at: 'thirty', atMax: 'two', note: 'Small and mid-size teams' }),
    S('docstack', 'They license SOPs, playbooks, knowledge bases, CRM workflows and QA checklists.',
      { title: 'What they license' }),
    S('redact', 'It is all de-identified. Names and emails get scrubbed.',
      { title: 'ONBOARDING SOP', meta: 'EXAMPLE DOCUMENT', at: 'Names' }),
    S('flow', 'Your docs get scrubbed, used to train AI, and you get paid.', {}),
    S('tiers', 'Published tiers: one hundred thousand, five hundred thousand, one million plus.',
      { tiers: [{ amount: '$100K+', label: 'Tier one', word: 'hundred' }, { amount: '$500K+', label: 'Tier two', word: 'five' }, { amount: '$1M+', label: 'Top tier', word: 'million' }],
        note: 'Depends on quality, volume, uniqueness', source: SRC }),
    S('checklist', 'Fit check: thirty to two hundred people, written processes, no customer personal data.',
      { title: 'Quick fit check', items: [{ text: '30–200 employees', word: 'Thirty' }, { text: 'Written processes', word: 'written' }, { text: '!Customer personal data', word: 'customer' }] }),
    S('industry', 'Recruiting and BPO firms fit well: screening scripts, call rubrics.',
      { name: 'Recruiting & BPO', icon: 'people', kicker: 'INDUSTRY 01', items: [{ text: 'Screening scripts', word: 'Screening' }, { text: 'Call QA rubrics', word: 'Call' }] }),
    S('quote', 'Here is the pitch, in one line.',
      { text: 'Your operational know-how is training data.', by: 'Placeholder quote · swap in verbatim source text', highlight: ['operational', 'training'] }),
    S('qa', 'Sold with my name on it? No. It is de-identified first.',
      { q: 'Is my data sold with my name on it?', a: 'No. De-identified first.', at: 'No', highlight: 'De-identified' }),
    aspect === '16:9'
      ? S('cta', 'The interest form is linked in the description. It takes about two minutes.', { mode: 'link' }, { padOut: 1.0 })
      : S('cta', 'Search micro1 Company Data Partnerships. It takes about two minutes to apply.',
        { mode: 'search', text: 'micro1 Company Data Partnerships', sub: 'Apply takes ~2 minutes', at: 'micro1' }, { padOut: 1.0 }),
];

