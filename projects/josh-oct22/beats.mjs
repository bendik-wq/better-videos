// Graphics for Josh's 22 Oct session (two DJI files, 0005 then 0006 at +1000 s on one combined timeline):
// "Taking over a company: culture, firing and what to focus on".
// Long-form beats are at combined SOURCE seconds and land on whichever clip plays that moment.
import fs from 'node:fs';
import { eb, big, small, list } from '../owners-academy-sales/vsl/beats.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));

const longBeats = [
  [2.0, eb('Josh Li · JC Health Group') + big('Inside the <em>new clinic</em>.', 0.5)],
  [54.9, eb('The move') + big('Moved in a couple of weeks ago. Focus: <em>stay operational</em>.', 7.0, 'mid')],
  [70.8, eb('Today') + list([['Culture: how to build it', 0.3], ['What to expect when you buy a company', 4.5], ['What to focus on, and why', 9.5]])],
  [156.6, eb('Leasing tip') + big('Built to look pretty, <em>not optimised for use</em>.', 6.0, 'mid')],
  [188.8, eb('Leasing tip') + big('Always double-check the <em>square metres</em>.', 2.5, 'mid')],
  [233.5, eb('Culture') + big('How do you build culture?', 0.5)],
  [249.8, eb('After an acquisition') + big('You don\'t build culture. <em>You inherit it.</em>', 0.5, 'mid')],
  [266.7, big('You won\'t inherit a culture you <em>100% like</em>.', 3.0, 'mid')],
  [282.9, eb('Culture is always evolving') + big('A new boss walks in. That alone <em>freaks people out</em>.', 9.0, 'mid')],
  [306.5, eb('A lesson Josh learned') + big('No one\'s gonna be <em>like you</em>.', 5.0)],
  [319.2, eb('You\'re an entrepreneur') + big('Why expect the average person to be on <em>your wavelength</em>?', 11.3, 'mid')],
  [337.3, eb('Taking over') + big('You\'ll never get <em>100% buy-in</em>.', 6.5)],
  [412.4, eb('Taking over a company') + list([['Expect to fire', 21.7], ['Expect people to resign', 24.5]])],
  [442.1, eb('In fact') + big('If nobody leaves, <em>you\'re not doing enough</em>.', 6.0, 'mid')],
  [463.9, eb('When you take over') + big('People should be <em>scrambling</em>.', 0.5)],
  [472.2, eb('Conventional wisdom') + big('A smooth transition nobody notices.', 3.0, 'mid')],
  [485.4, eb('Josh\'s take') + big('Don\'t delay the inevitable: <em>"I\'m your new boss."</em>', 9.7, 'mid')],
  [504.5, eb('Two levels') + list([['How the team hears about the sale', 4.0], ['What actually changes', 40.6]])],
  [570.6, eb('Then the change') + list([['New systems', 4.6], ['New software', 7.4], ['New ways of working', 9.0]])],
  [587.7, eb('In Josh\'s experience') + big('Always better to do it <em>upfront</em>.', 1.0)],
  [605.9, eb('Early on, with nothing behind you') + big('He wouldn\'t walk in and <em>start firing</em>.', 8.0, 'mid')],
  [616.4, eb('With a foundation behind you') + big('Losing $50k won\'t make you <em>crumble</em>.', 9.8, 'mid')],
  [649.4, eb('On firing') + big('Never feel <em>comfortable</em> firing people.', 11.7, 'mid')],
  [681.7, eb('As an employer') + big('It\'s people\'s <em>livelihoods</em>.', 0.5) + small('You have a social responsibility to look after them.', 4.0)],
  [705.2, eb('Remember, they\'re not you') + list([['They\'re not entrepreneurs', 3.4], ['They don\'t get the upside', 21.5], ['They don\'t take your risk', 25.4]])],
  [1000.0, eb('So where does that leave you?') + big('You inherited it. <em>Deal with it.</em>', 9.0)],
  [1014.3, eb('Expect attrition') + big('Fill the gaps with people who <em>fit the vision</em>.', 13.3, 'mid')],
  [1040.5, eb('This acquisition') + big('"These guys are <em>crazy</em>." Would Josh change anything? No.', 12.4, 'mid')],
  [1068.3, eb('Josh\'s view') + big('The setback brought <em>this opportunity</em>.', 1.0, 'mid')],
  [1103.6, eb('Commercially') + big('The rent here is <em>higher</em>.', 0.4)],
  [1111.7, eb('The obvious priorities') + list([['Fill the books', 2.8], ['Hire more people', 6.2], ['Bring revenue up', 8.1]])],
  [1124.3, eb('Josh\'s first priority') + big('Set the place up so they <em>never closed a day</em>.', 7.0, 'mid')],
  [1150.4, eb('Client feedback') + big('Pages of requests. Do them all, and <em>you close</em>.', 30.5, 'mid')],
  [1189.5, eb('Priority in any business') + big('<em>Make the money.</em>', 0.4)],
  [1201.9, eb('How') + big('Focus on the <em>service</em>, the deliverable.', 1.5, 'mid')],
  [1215.5, eb('If he\'d done it all') + big('"I\'d be broke."', 4.0)],
  [1238.9, eb('As a business person') + big('Focus on what <em>keeps the doors open</em>.', 2.0, 'mid')],
  [1248.0, eb('Hopefully you know by now') + big('You won\'t <em>please everyone</em>.', 0.5)],
  [1258.7, eb('In fact') + big('If nobody\'s annoyed, you\'re <em>probably not doing it right</em>.', 0.4, 'mid')],
  [1286.9, eb('New initiatives?') + big('<em>Focus on the money.</em>', 2.5)],
  [1299.3, eb('Your job as an entrepreneur') + big('Connect what doesn\'t earn to what <em>does</em>.', 6.0, 'mid')],
  [1335.7, eb('Josh\'s rule') + list([['Other people\'s advice: success', 1.0], ['Your own intuition: glory', 5.5]])],
  [1358.1, eb('Want to buy businesses?') + big('Contact Josh. <em>Details below.</em>', 1.0)],
];

export const beats = {};
const longParts = ['lf-1', 'lf-2', 'lf-3', 'lf-4', 'lf-5', 'lf-6', 'lf-7', 'lf-8'];
for (const [t, html] of longBeats) {
  const p = longParts.find((id) => S[id] && t >= S[id].in - 0.05 && t < S[id].out) ?? longParts.find((id) => S[id] && S[id].in > t);
  if (p) (beats[p] ||= []).push({ at: +Math.max(0, t - S[p].in).toFixed(2), html });
}

const hook = (h) => [{ at: 0, html: eb('Josh Li · Founder, JC Health Group', -1) + big(h, -1, 'mid') }];
Object.assign(beats, {
  'culture~ig#1': hook('When you buy a business, you don\'t build culture. <em>You inherit it.</em>'),
  'not-like-you~ig#1': hook('No one on your team will <em>think like you</em>.'),
  'expect-leave~ig#1': hook('Taking over a company? <em>Expect people to leave.</em>'),
  'new-boss~ig#1': hook('Good news or bad news: <em>I\'m your new boss.</em>'),
  'firing~ig#1': hook('Comfortable firing people? <em>Reconsider where you are.</em>'),
  'make-money~ig#1': hook('Priority one in any business: <em>make the money</em>.'),
  'please~ig#1': hook('You won\'t please everyone. <em>Follow your gut.</em>'),
});
