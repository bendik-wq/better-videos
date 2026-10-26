// Graphics for Josh's 26 Oct talk "Why organic growth won't get you past $10M" (one take, long pauses cut).
// Long-form beats are at SOURCE seconds and land on whichever clip plays that moment.
import fs from 'node:fs';
import { eb, big, small, list, kpi, cred, teaser } from '../owners-academy-sales/vsl/beats.mjs';

const S = JSON.parse(fs.readFileSync(new URL('./snapped.json', import.meta.url)));

const longBeats = [
  [0, cred()], // who's talking: numbers + clinic photos while Josh opens (the title card already names the topic)
  [16.4, eb('Today') + big('Why organic growth is a <em>waste of time</em> for most of you.', 0.3, 'mid')],
  [25.4, eb('If you\'re in this position') + list([['Blow up your revenue', 3.9], ['Blow up your valuation', 5.6], ['Put more cash in your pocket', 7.9]])],
  [39.2, eb('How you got here') + big('<em>Organic growth.</em>', 7.6)],
  [66.9, eb('The journey') + list([['Your first $100K, then $500K', 1.6], ['Then $1–2M', 6.2], ['A team of 4 to 12 people', 9.5]])],
  [87.9, eb('Now you\'re') + big('Profitable, with <em>systems and a foundation</em>.', 0.5, 'mid')],
  [96.1, eb('To break through') + big('Same principles. <em>A different path.</em>', 4.0)],
  [110.0, eb('The healthcare example') + list([['Private practice: a clinic on the street', 19.0], ['Community health: physios travel to patients', 34.6]])],
  [156.5, eb('Community health') + big('Funded by <em>governments and third parties</em>.', 0.1, 'mid')],
  [192.4, eb('Why share this?') + list([['Clinics: smaller, harder to scale', 3.6], ['Mobile businesses: can skyrocket', 15.1]])],
  [222.8, eb('Different ceilings') + big('<em>Same principles.</em>', 4.5)],
  [231.3, eb('The organic ceiling in a clinic') + list([['A qualified, licensed practitioner', 9.0], ['Limited hours they can bill', 19.0], ['Only so many qualified people', 36.0]])],
  [280.2, eb('The benchmark') + `<div class="row">${kpi('38–40', 'hours in a full-time week', 0.3)}${kpi('80%', 'should be billable', 9.2)}${kpi('30–32', 'billable hours a week', 16.0)}</div>`],
  [306.8, eb('Then the constraints') + list([['Sickness, timing, physical limits', 2.4], ['A 10–15 km radius of customers', 11.8]])],
  [329.1, eb('One of Josh\'s clinics') + big('Half the radius is water. <em>You can\'t sell to fish.</em>', 13.1, 'mid')],
  [362.4, eb('A clinic\'s ceiling') + list([['Your rooms', 4.7], ['Your practitioners', 5.9]])],
  [378.7, eb('Remote and mobile') + big('Not bound by location. <em>Still bound by travel.</em>', 2.1, 'mid')],
  [404.2, eb('Any service business') + big('Has an <em>organic ceiling</em> you can\'t break quickly.', 3.4, 'mid')],
  [418.9, eb('To break it') + big('Fix the foundation before you <em>add more storeys</em>.', 1.6, 'mid')],
  [448.9, eb('That takes') + list([['Time', 0.3], ['Energy', 2.3], ['Money', 3.0]])],
  [456.0, eb('Another way') + big('Build the foundation <em>outside</em> your company.', 3.0, 'mid') + small('Bring in some new blood.', 9.9)],
  [469.1, eb('At $5M today') + big('Hiring and advertising more <em>won\'t get you to $10M</em>.', 3.4, 'mid')],
  [484.8, eb('The faster path') + big('$5M to $10M: <em>buy another $5M business</em>.', 0.5, 'mid')],
  [495.1, eb('Find a competitor') + list([['Doing the $5M', 0.0], ['Selling to the customers you want', 5.0], ['Buy their business', 11.0]])],
  [508.6, eb('That is') + big('<em>Inorganic growth.</em>', 0.2) + small('Acquisitions. Corporate development.', 2.9)],
  [523.5, eb('Most practice owners') + big('Keep doing the same thing, <em>year after year</em>.', 16.0, 'mid')],
  [545.2, eb('Until') + big('They burn out, and <em>sell or close down</em>.', 0.5, 'mid')],
  [557.5, eb('Why') + big('You won\'t break the ceiling doing <em>what you\'ve done for 20 years</em>.', 0.3, 'mid')],
  [572.3, eb('Part of your acquisition strategy') + big('A very <em>bankable narrative</em>.', 5.5)],
  [582.7, eb('The opportunity') + list([['Private equity: $5–10M+ companies', 0.0], ['Consolidators: $1–5M businesses', 5.5], ['10–25% margins, $100–500K EBITDA', 11.2]])],
  [611.2, eb('The play') + big('Buy them, revamp them, <em>break their ceiling</em>.', 2.7, 'mid')],
  [625.7, eb('Josh\'s April acquisition') + `<div class="row">${kpi('4', 'practitioners', 6.5)}${kpi('4', 'rooms, no space to grow', 16.0)}</div>`],
  [647.7, eb('Now') + big('A much larger premises. <em>Room to grow.</em>', 0.3, 'mid')],
  [656.9, eb('The pitch to lenders') + big('Profitable businesses that <em>hit their ceiling</em>.', 9.9, 'mid')],
  [684.6, eb('Most small business owners') + big('<em>Don\'t see it.</em>', 0.3)],
  [698.2, eb('Someone like Josh') + big('Gets to the next level, <em>a different way</em>.', 2.9, 'mid')],
  [712.3, eb('The new clinic') + big('<em>Night and day.</em>', 5.6)],
  [759.0, eb('Sitting at $1M, $3M, $5M, $8M?') + big('Organic growth <em>won\'t get you past $10M</em>.', 11.2, 'mid')],
  [778.7, eb('To grow past it') + list([['Set up a new location', 0.0], ['Or take over a competitor', 1.9]])],
  [802.7, eb('The organic way') + big('Hiring, leases, signage, <em>the first 100 clients</em>.', 33.5, 'mid')],
  [840.9, eb('Skip it') + big('<em>Buy your competitors.</em>', 4.0)],
  [847.0, eb('Look 25–50 km down the road') + big('Buy out <em>the kingpin</em> there.', 8.2)],
  [863.3, eb('Any business') + big('Google "near me". A list of 100. <em>Call them.</em>', 6.2, 'mid')],
  [878.0, eb('It takes one') + big('One deal can <em>add millions</em> to your company.', 0.3)],
  [886.6, eb('By default') + big('Day one: <em>cash is coming in</em>.', 17.2, 'mid')],
  [913.2, eb('You already know the business') + big('Pick the low-hanging fruit. <em>+1–2% margin.</em>', 6.8, 'mid')],
  [924.8, eb('Then') + big('Zoom out. <em>Optimise.</em>', 0.3)],
  [938.4, eb('How the low-key wealth is made') + big('The <em>buy and build</em> model.', 20.8)],
  [963.4, eb('Wrapping up') + big('Everything Josh knows, <em>given to his clients</em>.', 8.5, 'mid')],
  [989.4, eb('Josh\'s playbook') + list([['Scripts', 1.6], ['Templates', 2.0], ['The full strategy', 3.4]])],
  [1002.5, eb('Stop playing the organic growth game') + big('<em>See if you qualify.</em>', 6.4)],
];

export const beats = {};
const longParts = ['lf-1', 'lf-2', 'lf-3', 'lf-4', 'lf-5'];
for (const [t, html] of longBeats) {
  const p = longParts.find((id) => S[id] && t >= S[id].in - 0.05 && t < S[id].out) ?? longParts.find((id) => S[id] && S[id].in > t);
  if (p) (beats[p] ||= []).push({ at: +Math.max(0, t - S[p].in).toFixed(2), html });
}

Object.assign(beats, {
  // long-form intro: "Coming up" teaser moments
  'tz-1': teaser('From $5M to $10M? <em>Buy another $5M business.</em>'),
  'tz-2': teaser('Most owners burn out and <em>sell or close down</em>.'),
  'tz-3': teaser('Four rooms, four practitioners. <em>No room to grow.</em>'),
  'tz-4': teaser('Google "near me". <em>One call can add millions.</em>'),
  'tz-5': teaser('The quiet wealth is built on <em>buy and build</em>.'),
});

const hook = (h) => [{ at: 0, html: eb('Josh Li · Founder, JC Health Group', -1) + big(h, -1, 'mid') }];
Object.assign(beats, {
  'five-ten~ig#1': hook('Stuck at $5M? Buying another $5M business <em>beats organic growth</em>.'),
  'burn-out~ig#1': hook('80% of small businesses <em>never break their ceiling</em>.'),
  'four-rooms~ig#1': hook('Four rooms. Four practitioners. <em>No room to grow.</em>'),
  'fish~ig#1': hook('Half our clinic\'s radius is water. <em>We can\'t sell to fish.</em>'),
  'kingpin~ig#1': hook('Google "near me". Call 100. <em>It takes one.</em>'),
  'day-one~ig#1': hook('Buy a profitable business: <em>cash on day one</em>.'),
  'buy-build~ig#1': hook('How the quiet wealth is built: <em>buy and build</em>.'),
  'ceiling~ig#1': hook('Every service business has an <em>organic ceiling</em>.'),
  'past-10m~ig#1': hook('Stuck under $10M? <em>Organic won\'t get you there.</em>'),
});
