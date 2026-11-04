// Graphics for Josh's 23 Oct talk "How to buy a business with no money down" (one continuous take).
// Long-form beats are at SOURCE seconds; the long form is a single clip ('whole'), so at = t - whole.in.
import fs from 'node:fs';
import { eb, big, small, list, cred, teaser } from '../owners-academy-sales/vsl/beats.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));

const longBeats = [
  [2.8, eb('Today') + big('How to buy a business with <em>no money down</em>.', 2.5, 'mid')],
  [12.2, eb('It applies whether') + list([['It\'s your first business or your next', 0.3], ['You have money or you don\'t', 8.2]])],
  [23.5, eb('Josh, his clients, his network') + big('From the <em>$1M</em> business to the <em>$100M</em> business.', 13.5, 'mid')],
  [58.9, eb('First principles') + big('Buy something <em>without the thing</em> required to buy it.', 7.4, 'mid')],
  [71.3, eb('Three things') + list([['You', 0.3], ['The money', 1.6], ['The business you want', 4.0]])],
  [109.9, eb('If you don\'t have the money') + big('Use <em>other people\'s money</em>.', 4.5)],
  [126.9, eb('The simplest form') + big('Borrow it: <em>investors and lenders</em>.', 1.5, 'mid')],
  [129.6, eb('Josh prefers lending, because investors mean') + list([['Giving up equity', 8.5], ['Someone else\'s oversight', 27.6]])],
  [165.5, eb('If you want to run your own company') + big('The investor route\'s <em>probably not the play</em>.', 0.5, 'mid')],
  [194.5, eb('Lending') + big('You <em>don\'t dilute</em> yourself.', 12.3)],
  [213.0, eb('The bank') + list([['Gives you the money', 0.2], ['Charges interest', 4.9], ['Gets paid back monthly', 5.9]])],
  [233.2, eb('Remember') + big('The bank isn\'t a manager. It\'s your <em>debt owner</em>.', 1.3, 'mid')],
  [250.8, eb('Option three · Josh\'s favourite') + big('Borrow from the <em>vendor</em>.', 3.4)],
  [271.0, eb('His clinic deal') + big('A double layer: <em>vendor finance + commercial lending</em>.', 2.0, 'mid') +
    small('The full template is in the Owners Academy community.', 18.0)],
  [299.5, eb('Vendor finance') + big('Basically an <em>IOU to the seller</em>.', 1.3)],
  [309.8, eb('The pitch') + big('"I\'ll pay what you want, plus more, <em>over time</em>."', 0.5, 'mid')],
  [320.7, eb('The reality for sellers') + list([['No one\'s paying the price they want', 2.2], ['5–10 years hunting a unicorn buyer', 5.1], ['Then shut down with nothing', 10.9]])],
  [338.0, eb('Many owners know it') + big('Something over time <em>beats nothing</em>.', 20.0, 'mid')],
  [369.5, eb('A true story') + big('Josh followed up with an owner <em>for years</em>.', 0.5, 'mid')],
  [383.5, eb('One day, driving past') + big('The clinic was dark. <em>"Closed."</em>', 8.5, 'mid')],
  [407.9, eb('The clinic') + big('The pinnacle of a <em>private allied health clinic</em>.', 2.0, 'mid')],
  [449.6, eb('Long story short') + big('No deal. He <em>had to liquidate</em>.', 5.5, 'mid')],
  [462.1, eb('Josh shared that story with') + big('Another owner who <em>wants to sell, doesn\'t want to sell</em>.', 2.5, 'mid')],
  [494.8, eb('Why vendor finance works') + big('Sellers get what they deserve, <em>over time</em>.', 3.0, 'mid')],
  [526.1, eb('Three ways to fund a deal') + list([['Investor', 9.9], ['Lender', 10.3], ['Vendor', 11.6]])],
  [548.1, eb('Then the real question') + big('Can you <em>run it</em>?', 8.2)],
  [561.0, eb('That\'s why Josh says') + big('Look for <em>$1M+ revenue</em>: management and systems in place.', 0.5, 'mid')],
  [591.8, eb('No experience?') + big('Same as the money: use <em>other people</em>.', 8.5, 'mid')],
  [600.8, eb('Borrow their') + list([['Credibility', 0.0], ['Capabilities', 1.5], ['Expertise', 3.2]])],
  [610.6, eb('JC Health Group') + big('Josh had <em>never worked in healthcare</em>.', 2.6, 'mid')],
  [624.3, eb('So he built a board') + list([['National CEOs of healthcare companies', 5.0], ['Legal', 10.7], ['Finance', 11.5]])],
  [642.9, eb('The board') + big('Helped him do and run his <em>first deal</em>.', 0.4, 'mid') + small('Today they\'re his advisors.', 5.6)],
  [673.1, eb('An entrepreneur') + big('Creates something <em>from nothing</em>.', 9.0)],
  [688.4, eb('You can\'t do it the conventional way') + big('<em>Get creative.</em> Test the market.', 2.5)],
  [707.9, eb('Josh\'s mistakes') + big('Every one of them <em>benefited</em> him.', 15.0, 'mid')],
  [744.9, eb('The lesson') + big('Grow some scar tissue. <em>Learn to detach.</em>', 17.0, 'mid')],
  [775.0, eb('How Josh got into healthcare') + big('Bought his first clinic. Built a <em>multi-million dollar</em> company.', 13.0, 'mid')],
  [795.6, eb('No cookie-cutter answer') + big('Follow the <em>principles</em>.', 14.8)],
];

export const beats = { whole: longBeats.map(([t, html]) => ({ at: +Math.max(0, t - S.whole.in).toFixed(2), html })) };

const hook = (h) => [{ at: 0, html: eb('Josh Li · Founder, JC Health Group', -1) + big(h, -1, 'mid') }];
Object.assign(beats, {
  // long-form intro: "Coming up" teaser moments
  'tz-1': teaser('"You\'re gonna use <em>other people\'s money</em>."'),
  'tz-2': teaser('"The bank\'s not a manager. It\'s your <em>debt owner</em>."'),
  'tz-3': teaser('"His clinic was dark." <em>He\'s had to liquidate.</em>'),
  'tz-5': teaser('"I\'ve never been in healthcare. <em>Never made a dollar in it.</em>"'),
  'opm~ig#1': hook('No money to buy a business? Use <em>other people\'s money</em>.'),
  'bank~ig#1': hook('A bank isn\'t your manager. <em>It\'s your lender.</em>'),
  'vendor-a~ig#1': hook('Vendor finance is just an <em>IOU to the seller</em>.'),
  'closed-a~ig#1': hook('He wouldn\'t take my offer. <em>Now his clinic is closed.</em>'),
  'three~ig#1': hook('Three ways to fund a deal. Then: <em>can you run it?</em>'),
  'board~ig#1': hook('Never worked in healthcare. <em>Built a board that had.</em>'),
});
