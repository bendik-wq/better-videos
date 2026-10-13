// Shared building blocks for the micro1 shorts (projects/m1-01 … m1-10). Facts: projects/micro1/RESEARCH.md.
// Independent channel: never a micro1 logo; every money figure says "reported" and "not guaranteed".
import { shot as S } from '../micro1-kit/episode.mjs';
export { S };

export const SRC_PR = 'SOURCE: MICRO1 PRESS RELEASE · BUSINESS WIRE · 9 OCT 2026';
export const SRC_PAGE = 'SOURCE: MICRO1 COMPANY DATA PARTNERSHIPS PAGE';
export const SRC_TIERS = 'REPORTED TIERS (BERI · FOURWEEKMBA) · NOT GUARANTEED';

export const billion = (vo, extra = {}) => S('bignum', vo, { value: 1000000000, prefix: '$', commas: true, label: 'COMMITTED OVER 12 MONTHS', sub: 'ANNOUNCED 9 OCT 2026', source: SRC_PR, ...extra });
export const tiers = (vo, extra = {}) => S('tiers', vo, { title: 'REPORTED PAYOUT TIERS', tiers: [{ amount: '$100K+', label: 'Qualified partnership', word: 'hundred' }, { amount: '$500K+', label: 'Large or ongoing', word: 'five' }, { amount: '$1M+', label: 'Highly unique data', word: 'million' }], note: 'Depends on volume, quality, uniqueness', highlight: ['volume', 'quality', 'uniqueness'], source: SRC_TIERS, ...extra });
export const team = (vo, extra = {}) => S('team', vo, { min: 30, max: 200, label: '30–200 EMPLOYEES', source: SRC_PAGE, ...extra });
export const window12 = (vo, extra = {}) => S('window', vo, { fill: 0.08, label: '$1B · 12 MONTHS', start: 'OCT', year: 2026, mark: 'NOW', ...extra });
export const cta = (vo, extra = {}) => S('cta', vo, { text: 'micro1 Company Data Partnerships', sub: 'Interest form takes ~2 minutes', ...extra }, { padOut: 1.2 });
export const securityQuote = (vo, text, extra = {}) => S('quote', vo, { text, by: 'micro1, Company Data Partnerships page', source: SRC_PAGE, ...extra });

// redaction documents (illustrative; labelled EXAMPLE on screen by the kit)
export const DOCS = {
  onboarding: { title: 'CLIENT ONBOARDING SOP', lines: ['Step 1. Call [[Dana Ruiz]] when a refund is over [[$500]].', 'Escalate to [[dana.ruiz@acme.co]] within 24 hours.', 'Log it in [[Acme CRM]] under client [[#44-1093]].', 'Close the ticket. Rate the call 1–5.'] },
  recruiting: { title: 'SCREENING PLAYBOOK', lines: ['Source 40 profiles per req from [[LinkedIn Recruiter]].', 'Phone screen [[Jordan Lee]] · 15 min · 6 questions.', 'Send scorecard to hiring manager [[Priya Shah]].', 'Offer stage: 48-hour close window.'] },
  consulting: { title: 'ENGAGEMENT PLAYBOOK', lines: ['Week 1: discovery interviews with [[Northwind Ltd]] execs.', 'Map current process; find the 3 biggest delays.', 'Draft deck for [[CFO Mark Bell]] by Friday.', 'Partner review before every client send.'] },
  finance: { title: 'ACCOUNT OPENING PROCEDURE', lines: ['Verify ID for [[Sarah Kim]], acct [[****4471]].', 'Run sanctions + PEP screen. Log result.', 'Second review if deposit over [[$250,000]].', 'Approve within 2 business days.'] },
  legal: { title: 'MATTER INTAKE CHECKLIST', lines: ['Run conflict check on [[Halden Corp]].', 'Open matter [[2026-0417]] · assign associate [[R. Ortiz]].', 'Engagement letter signed before any work.', 'Partner sign-off on every filing.'] },
  logistics: { title: 'EXCEPTION HANDLING SOP', lines: ['Late load from [[Carrier BlueLine]] over 2 hours: alert.', 'Call consignee [[Ken Ito]] · offer new slot.', 'Damaged freight: photos within 30 minutes.', 'Open claim [[#C-88213]] · close in 5 days.'] },
};
export const redact = (vo, doc, extra = {}) => S('redact', vo, { ...DOCS[doc], meta: 'INTERNAL · EXAMPLE DOCUMENT', label: 'DE-IDENTIFIED', ...extra });

// "before you apply" segments, rotated across episodes (SCRIPTS.md)
export const PREP = {
  A: () => [
    S('hook', 'So what should you do before you apply? Three things.', { lines: ['BEFORE YOU', 'APPLY:', '3 THINGS'], highlight: '3 THINGS' }),
    S('checklist', 'One. Take inventory. Where does your documentation live? Notion, Confluence, Google Drive, your ticketing system, your CRM workflows. Roughly how much is there, and how current is it?', { title: '1 · TAKE INVENTORY', items: ['Notion / Confluence', 'Google Drive', 'Ticketing system', 'CRM workflows'] }),
    S('checklist', 'Two. Check your contracts. Make sure the process knowledge is yours to license, and that no client agreement says otherwise.', { title: '2 · CHECK CONTRACTS', items: [{ text: 'Process knowledge is yours', word: 'yours' }, { text: 'No client clause blocks it', word: 'client' }] }),
    S('checklist', 'Three. Pick one owner. Someone senior who knows your workflows end to end and can answer questions fast.', { title: '3 · PICK ONE OWNER', items: [{ text: 'Senior', word: 'senior' }, { text: 'Knows every workflow', word: 'workflows' }, { text: 'Answers fast', word: 'fast' }] }),
    S('qa', 'What happens after the form? micro1 reviews what you have. The volume, the complexity, the quality and how unique it is. That’s what sets the number.', { q: 'What happens after the form?', a: 'They review what you have.', sub: 'Volume · complexity · quality · uniqueness', at: 'reviews' }),
  ],
  B: () => [
    S('hook', 'Here’s a quick way to see if you’re a fit.', { lines: ['ARE YOU', 'A FIT?'], highlight: 'FIT?' }),
    S('checklist', 'Do you have written procedures your team actually follows? Do the same workflows repeat every week? Does your work run through modern software that keeps a history? Have you been doing this long enough to have years of it?', { title: 'QUICK FIT CHECK', items: [{ text: 'Written procedures', word: 'procedures' }, { text: 'Repeating workflows', word: 'repeat' }, { text: 'Modern software', word: 'software' }, { text: 'Years of history', word: 'years' }] }),
    S('hook', 'If you answered yes to most of those, you’re the profile this program describes.', { lines: ['MOSTLY YES?', 'THAT’S THE', 'PROFILE.'], highlight: 'PROFILE.' }),
    S('qa', 'And what does it take from your team? micro1 says it handles the coordination, the anonymization and the program management, so teams can take part with minimal disruption.', { q: 'How much work is it for my team?', a: 'Minimal disruption.', sub: 'micro1 handles coordination, anonymization, program management', at: 'minimal' }),
    S('hook', 'Your people keep doing their jobs. The knowledge they’ve already written down does the work.', { lines: ['YOUR TEAM', 'KEEPS WORKING.', 'YOUR DOCS', 'DO THE WORK.'], highlight: 'DO THE WORK.' }),
  ],
  C: () => [
    S('qa', 'What’s the catch? Fair question. Here’s the honest version.', { q: 'What’s the catch?', a: 'The honest version:', at: 'honest' }),
    S('checklist', 'You’re licensing knowledge, not selling the company. You keep ownership. Originals are deleted after processing. And the data is used only to train and evaluate AI, not to copy your business.', { title: 'WHAT YOU’RE SIGNING UP FOR', items: [{ text: 'You keep ownership', word: 'ownership' }, { text: 'Originals deleted after', word: 'deleted' }, { text: 'Only to train & test AI', word: 'train' }, { text: '!Copying your business', word: 'copy' }] }),
    S('hook', 'What you do need is good documentation. The more organised it is, the stronger your position.', { lines: ['ORGANISED', 'DOCS =', 'STRONGER', 'POSITION'], highlight: 'STRONGER' }),
    S('checklist', 'So spend an afternoon getting it in order. Group it by function. Remove anything out of date. Note which tools it comes from.', { title: 'ONE AFTERNOON', items: [{ text: 'Group by function', word: 'Group' }, { text: 'Cut what’s out of date', word: 'Remove' }, { text: 'Note the source tools', word: 'tools' }] }),
    S('hook', 'That afternoon could be the most valuable one your operations team spends this year.', { lines: ['THE MOST', 'VALUABLE', 'AFTERNOON', 'OF THE YEAR?'], highlight: 'VALUABLE' }),
  ],
};
