// Right-panel graphics for the pre-call FAQ videos (Josh's live Q&A answers from the masterclass).
// Same conventions as beats.mjs: `at` = seconds into the clip, data-d etc. = seconds into the beat.
import { eb, big, small, kpi, count, list } from './beats.mjs';

const pair = (a, b) => `<div class="row">
  <div class="card" data-d="${a.d}"><div class="eyebrow">${a.k}</div><div class="mid">${a.t}</div><div class="small">${a.s}</div></div>
  <div class="card" data-d="${b.d}"><div class="eyebrow">${b.k}</div><div class="mid">${b.t}</div><div class="small">${b.s}</div></div></div>`;
const Q = (q) => eb('Asked live during the masterclass') + big(q);

export const beats = {
  'faq-board-or-deal': [
    { at: 0, html: Q('Board first, or <em>deal first</em>?') },
    { at: 10, html: eb('Two approaches') + big('Josh recommends: <mark data-hd="4.8">build the board first</mark>.', 0.3) },
    { at: 22, html: eb('How to start with nothing behind you') + list([
        ['An executive summary of your vision', 2.0], ['Approach good business people', 6.0], ['Offer shares, on a handshake basis', 28.5]]) },
    { at: 58, html: big('The traditional QLA approach: a board with <em>minority equity</em> from the start.') },
    { at: 75, html: eb('The alternative') + big('Find the deal first, then build the team <em>around that deal</em>.', 0.3, 'mid') +
        small('How Christian Dawes did it: project-based.', 8.0) },
    { at: 97, html: eb('The difference') + pair(
        { k: 'Deal first · micro', t: 'One deal', s: 'The people and resources that deal needs', d: 0.4 },
        { k: 'Board first · macro', t: 'The whole venture', s: 'The people you need to make the model work', d: 10.5 }) },
  ],
  'faq-board-equity-a': [
    { at: 0, html: Q('How much equity do board members <em>get</em>?') },
    { at: 17.5, html: eb('Josh\'s healthcare group · holding company') + `<div class="row">${kpi('', 'held by Josh', 0.6, count(73, { suf: '%', d: 0.8 }))}${kpi('27%', 'shared across the board', 19.0)}</div>` },
    { at: 39, html: eb('How the rest is split') + list([['The chairman holds the most', 0.6], ['The founder of the Australian Institute of Fitness is second', 8.0], ['Everyone else: fairly even splits', 14.2]]) },
    { at: 58, html: big('More shares for the people who <em>contribute more</em>.') },
  ],
  'faq-board-equity-b': [
    { at: 14, html: eb('What an active board member does') + list([['Comes to seller and banker meetings', 0.6], ['Shares templates from previous boards', 6.8], ['Workshops deal structures with you', 15.8]]) },
    { at: 52, html: big('Give what you like, but <mark data-hd="6.6">keep the majority</mark>.') },
    { at: 62.5, html: eb('Why the majority matters') + `<div class="row">${kpi('Control', 'you make the decisions', 0.4)}${kpi('Exit value', 'you keep most of the sale price', 4.5)}</div>` },
  ],
  'faq-board-seat': [
    { at: 0, html: Q('Can Josh sit on <em>my board</em>?') },
    { at: 4.8, html: eb('Yes, if you\'re a good fit') + pair(
        { k: 'In Australia', t: 'Director', s: 'Open to directorships, personal and professional fit first', d: 0.4 },
        { k: 'Outside Australia', t: 'Advisor', s: 'Advisor or equity positions, not a director', d: 22.0 }) },
  ],
  'faq-us-financing': [
    { at: 0, html: Q('How do you help with financing <em>in the US</em>?') },
    { at: 3, html: eb('How it works') + list([['A network of US banks and private lenders', 0.4], ['We help you structure and present the deal', 8.6],
        ['You build the banker relationships', 13.0], ['We can also present on your behalf', 20.0]]) },
    { at: 36.5, html: big('Structure and presentation <mark data-hd="8.5">open the doors to the money</mark>.') },
  ],
  'faq-seller-buyout-a': [
    { at: 0, html: Q('Can I buy out a seller who <em>keeps a stake</em>?') },
    { at: 13, html: eb('For sellers who roll over equity') + big('Can you buy them out <em>later</em>?', 0.3) },
    { at: 28, html: big('Yes. Build in an <em>early exit</em>.', 0.3) },
    { at: 36.5, html: eb('Two options') + pair(
        { k: 'Option A', t: 'Sale option', s: 'After 3 years, buy their share at a fixed price, or a fixed multiple', d: 0.5 },
        { k: 'Option B', t: 'Ride it out', s: 'They stay in, and exit when you exit', d: 20.5 }) },
  ],
  'faq-seller-buyout-b': [
    { at: 0, html: big('They become your <em>business partners</em>. Be fair about it.') },
    { at: 25.5, html: eb('Every seller wants something different') + list([['Some will wait 10 years for a bigger exit', 2.5], ['Some need to be bought out in 6–12 months', 11.5]]) },
    { at: 56.5, html: eb('Buyout triggers') + pair(
        { k: 'Trigger 1', t: 'Time', s: 'After a set number of months or years', d: 0.5 },
        { k: 'Trigger 2', t: 'Size', s: 'Once the business reaches a set size', d: 3.0 }) },
  ],
  'faq-hostile-a': [
    { at: 0, html: Q('How do I stop minority shareholders <em>taking control</em>?') },
    { at: 8.6, html: eb('In the shareholders\' agreement') + list([['Drag-along rights', 0.6], ['No voting control for minorities', 3.4], ['No veto rights', 6.2]]) },
    { at: 24, html: eb('Two elements') + big('1. The <em>relationship</em>: how you treat your partners.', 2.0, 'mid') },
  ],
  'faq-hostile-b': [
    { at: 0, html: eb('Two elements') + big('2. The <em>legal set-up</em>, done properly from the start.', 1.6, 'mid') +
        list([['Shareholders\' agreement', 11.8], ['Company charter', 14.0], ['Company constitution', 15.8]]) },
  ],
  'faq-negotiation': [
    { at: 0, html: eb('Best negotiation tactic') + big('Be willing to <mark data-hd="3.2">walk away</mark>.') },
    { at: 6, html: big('Seller finance is a <em>mechanism</em>, not a negotiation tactic.', 0.4, 'mid') },
    { at: 33, html: eb('Tactic two') + big('Put a <em>time limit</em> on your offer.') + small('"You have 24 hours to accept it, or it\'s gone."', 11.2) },
  ],
  'faq-mistakes-a': [
    { at: 0, html: Q('What mistakes <em>cost the most time</em>?') },
    { at: 9.8, html: eb('Mistake 1') + big('Distractions, and people who <em>don\'t serve your goals</em>.') },
  ],
  'faq-mistakes-b': [
    { at: 0, html: eb('Mistake 2') + big('Making decisions <em>too slowly</em>.') },
    { at: 23, html: big('How fast you move is <mark data-hd="3.5">directly proportional</mark> to how fast you decide.', 0.3, 'mid') },
    { at: 50, html: eb('The buck stops with you') + `<div class="row">${kpi('1 week', 'for you to decide', 1.5)}${kpi('2 weeks', 'for your team to follow', 4.0)}</div>` },
    { at: 84, html: eb('What matters most') + list([['Your social and physical environment', 4.6], ['Your ability to make decisions quickly', 9.5]]) },
    { at: 104, html: big('Decide at <em>60%</em>. Figure it out as you go.', 0.3) },
  ],
  'faq-work-with': [
    { at: 0, html: Q('How do I <em>work with Josh</em>?') },
    { at: 3.4, html: eb('The next step') + big('Book a call <em>with Josh</em>, and see what we can do for you.', 0.3) },
  ],
  'faq-equity-advisory-a': [
    { at: 0, html: Q('Would you take <em>equity</em> for advisory?') },
    { at: 2.2, html: big('Yes. Josh has taken <em>equity for advisory</em> with a couple of clients.', 0.2) },
    { at: 12, html: eb('If an upfront fee is the problem') + list([['A financing arrangement', 6.8], ['A pure equity arrangement', 9.0], ['Flexible, if you\'re serious about executing', 12.0]]) },
  ],
  'faq-equity-advisory-b': [
    { at: 0, html: big('Advisory isn\'t Josh\'s main income. He runs his <em>healthcare group</em>.', 0.2) },
    { at: 15.5, html: big('But there must be a <mark data-hd="5.5">value exchange</mark>, so both sides are committed.', 0.2) },
  ],
  'faq-training': [
    { at: 0, html: Q('Where did Josh <em>learn this</em>?') },
    { at: 4.6, html: big('Primarily <em>QLA-trained</em> (Dan Peña), and self-taught.', 0.2) },
  ],
};
