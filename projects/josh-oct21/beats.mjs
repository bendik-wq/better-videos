// Graphics for Josh's 21 Oct talk "Should you buy a business under $1M revenue?".
// Long form: beats are written at SOURCE seconds (see transcript) and mapped onto whichever clip plays
// that moment, so cutting the long form never moves a graphic off its words.
// Reels: one hook headline per clip, on screen from the first frame.
import fs from 'node:fs';
import { eb, big, small, list } from '../owners-academy-sales/vsl/beats.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));

const longBeats = [
  [0.9, eb('The rule of thumb') + big('Under <em>$1M</em> in revenue? Probably don\'t buy a business.', 0.2, 'mid')],
  [9.2, eb('The rule of thumb') + big('Over $1M? It might be <em>the best thing you ever do</em>.', 0.2, 'mid')],
  [35.2, eb('Think like the bank') + big('What kind of business does a bank <em>want to finance</em>?', 0.3, 'mid')],
  [46.0, eb('What banks want') + list([['Not a bad business', 0.2], ['A profitable business', 1.0], ['A lot of profit, not $50k or $100k', 8.5]])],
  [63.9, eb('Remember this') + big('It\'s easier to borrow <em>$100M</em> than $1M.', 1.0)],
  [75.7, eb('Why') + list([['Bankers have quotas', 0.3], ['Targets every quarter', 3.2], ['A bonus for hitting them', 10.0]])],
  [104.4, eb('The banker mentality') + big('Multi-million deals <em>hit the target</em>.', 2.5, 'mid')],
  [116.7, eb('Remember this') + big('Larger amounts are <em>easier</em> to borrow than small ones.', 0.4, 'mid')],
  [130.9, eb('Under $1M') + big('You\'re probably still <em>working in</em> the business.', 3.0, 'mid')],
  [144.3, eb('Over $1M') + list([['A system and a foundation', 0.2], ['Staff, not just you', 9.0], ['Hiring, training, day-to-day protocols', 15.4]])],
  [170.5, eb('What the banker sees') + big('Less risk. <em>Easier to lend against.</em>', 2.0, 'mid')],
  [196.9, eb('Raising money for a deal') + big('How are you <em>removing the risk</em>?', 0.3)],
  [206.6, eb('How Josh teaches it') + big('Answer the bank\'s questions <em>before they ask</em>.', 13.5, 'mid')],
  [225.1, eb('Present everything upfront') + big('So the only question left is <em>how much</em>?', 2.5, 'mid')],
  [241.0, eb('How most people do it') + big('"Please, how much can you give me?"', 4.0, 'mid') + small('That\'s not how money works in the corporate world.', 8.5)],
  [254.4, eb('Ask like that, and they want') + list([['Your personal guarantee', 4.6], ['Your personal assets and home', 6.0], ['Your business as collateral', 10.0]])],
  [272.4, eb('Josh\'s view') + big('Corporate lending is <em>highly unregulated</em>.', 0.8, 'mid')],
  [289.4, eb('With deals') + list([['Not the retail route', 1.5], ['The corporate route', 6.2], ['Better still: your industry\'s team', 9.0]])],
  [303.5, eb('In Australia') + big('The big banks have <em>industry divisions</em>.', 2.0, 'mid') + small('Josh only talks to healthcare bankers.', 9.0)],
  [388.8, eb('In short') + list([['Little business: a lot of risk', 0.2], ['Big business: less risk', 2.6], ['Big money is easier to get', 8.3]]) +
    small('It\'s a matter of presenting it properly.', 10.6)],
  [407.2, eb('Under a million?') + big('Build a business that <em>runs without you</em>.', 12.7, 'mid')],
  [426.3, eb('The test') + big('If you dropped dead today, would it <em>still make money</em>?', 0.5, 'mid')],
  [440.7, eb('Begin with the end in mind') + big('Build it to <em>sell</em> one day.', 3.0)],
  [460.5, eb('Josh\'s strategy') + list([['Buy', 1.5], ['Optimise', 2.6], ['Flip', 3.9]])],
  [476.6, eb('Act as if') + big('Act as if. <em>Make it happen.</em>', 0.2)],
  [496.2, eb('Even his first business') + big('Structured like a <em>sellable asset</em>.', 9.0, 'mid')],
  [559.5, eb('The trade-off') + big('Hiring people <em>bit into his margins</em>.', 2.9, 'mid')],
  [584.0, eb('Why pick an industry you don\'t know') + list([['Less likely to overthink', 5.7], ['More likely to take action', 8.5]])],
  [605.0, eb('Certainty is a trap') + big('The people who make leaps <em>just jump</em>.', 10.3, 'mid')],
  [631.3, eb('Under a million right now?') + list([['Under $500k: don\'t buy a business', 10.7], ['$500k–$1M: only if it runs without you', 16.2]])],
  [673.9, eb('Ask yourself') + big('When something goes wrong, <em>who handles it</em>?', 2.4, 'mid')],
  [714.1, eb('Real life') + big('Often <em>stranger than fiction</em>.', 0.5)],
  [726.8, eb('On planning') + big('Plan, but expect the plan to <em>change on day one</em>.', 16.0, 'mid')],
  [795.8, eb('Today\'s question') + big('Under $1M, over $1M: <em>to buy or not to buy</em>.', 4.5, 'mid')],
  [808.6, eb('Next video') + big('Ready to buy? <em>That\'s the next one.</em>', 1.5)],
];

export const beats = {};
const longParts = ['lf-a', 'lf-b'];
for (const [t, html] of longBeats) {
  const p = longParts.find((id) => S[id] && t >= S[id].in - 0.05 && t < S[id].out) ?? longParts.find((id) => S[id] && S[id].in > t);
  if (p) (beats[p] ||= []).push({ at: +Math.max(0, t - S[p].in).toFixed(2), html });
}

const hook = (h) => [{ at: 0, html: eb('Josh Li · Founder, JC Health Group', -1) + big(h, -1, 'mid') }];
Object.assign(beats, {
  'bank~ig#1': hook('A bank would rather lend you <em>$100M</em> than $1M.'),
  'upfront~ig#1': hook('How to make the bank ask: <em>how much more?</em>'),
  'industry~ig#1': hook('Don\'t pitch any banker. Find the <em>industry banker</em>.'),
  'without-you~ig#1': hook('If you dropped dead tomorrow, would your business <em>still make money</em>?'),
  'under-500k~ig#1': hook('Under $500k in revenue? <em>Don\'t buy a business.</em>'),
  'jump~ig#1': hook('The people who make leaps <em>just jump</em>.'),
  'open~ig#1': hook('Under $1M or over $1M? It changes <em>everything</em>.'),
});
