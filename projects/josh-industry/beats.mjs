// Right-panel graphics for "Which industry should you buy into?" (Josh, 16 Oct 2026).
// Keyed to the tightened clip parts in snapped.json (id#n, from fixup.py). `at` = seconds into that part;
// data-d etc. = seconds after the beat starts. A beat runs until the next beat or card, so one beat can
// span several parts (add the earlier parts' lengths to its delays).
// Everything shown is something Josh says in the recording.
import { eb, big, small, kpi, list } from '../owners-academy-sales/vsl/beats.mjs';

export const beats = {
  // Part 1 · already in business
  'q#1': [{ at: 0, html: eb('The question Josh gets most') + big('Which industry should you <em>get into</em>?', 0.2) }],
  'lane#1': [
    { at: 0, html: eb('If you already own a business that is') + list([['Making cash', 1.6], ['Profitable', 2.8], ['Growing', 4.0]]) },
    { at: 5.1, html: eb('Then the answer is simple') + big('Stay in <mark data-hd="0.6">your lane</mark>.', 0.1) },
  ],
  'stagnant-a#1': [{ at: 0, html: eb('Flat for years?') + big('Stagnant for <em>15, 20 years</em>?', 0.3) }],
  'stagnant-b#1': [{ at: 0, html: eb('Flat for years?') + big('There are <em>deeper issues</em> to find first.', 0.1, 'mid') }],

  // Part 2 · starting from scratch
  'scratch#1': [
    { at: 0, html: eb('Never been in business?') + big('Starting <em>from scratch</em>.', 0.6) },
    { at: 6.8, html: eb('Josh, a few years ago') + big('"I\'m unemployed. I want to buy companies. <em>What do I do?</em>"', 0.8, 'mid') },
    { at: 12.0, html: eb('Josh\'s answer') + big('<em>Healthcare.</em>', 0.2) },
  ],
  'why-hc#2': [
    { at: 0, html: eb('Why healthcare') + list([['His personality gravitates towards it', 0.8], ['A personal affinity for good health', 5.6],
        ['Care for the community around him', 13.4]]) },
  ],

  // Part 3 · pivot fast
  'gp#1': [{ at: 0, html: eb('Target industry #1') + big('GP clinics and <em>medical centres</em>.', 3.4) }],
  'gp#3': [{ at: 0, html: eb('The timing') + big('Melbourne: the world\'s <em>longest lockdowns</em>.', 0.4, 'mid') }],
  'gp#4': [{ at: 0, html: eb('Melbourne lockdowns') + `<div class="row">${kpi('~260', 'days locked down, by Josh\'s count', 2.8)}</div>` }],
  'gp#5': [{ at: 0, html: eb('Meanwhile, the GPs were') + list([['Running government testing sites', 2.0], ['Stressed out', 5.5 + 1.8],
      ['Closing up shop', 5.5 + 4.0], ['Not taking new patients', 5.5 + 5.3]]) }],
  'gp-b#1': [{ at: 0, html: eb('The result') + big('No room to talk about <em>buying their business</em>.', 1.2, 'mid') +
      small('And Josh didn\'t yet know how to navigate the nuance.', 6.8) }],
  'physio-p#1': [{ at: 0, html: eb('Target industry #2 · the pivot') + big('Allied health: <em>physiotherapy</em>.', 1.0) }],
  'pivot-made#1': [{ at: 0, html: eb('After the pivot, owners were') + list([['More responsive', 1.5 + 0.4], ['More receptive', 1.5 + 1.6],
      ['Far easier to start a conversation with', 1.5 + 3.2]]) }],

  // Part 4 · the first deal
  'deal-a#1': [{ at: 0, html: eb('Deal #1') + big('It started with a <em>call back</em>.', 1.0) }],
  'deal-b#1': [
    { at: 0, html: eb('How it happened') + list([['One cold email', 1.9], ['Sent to the front-desk inbox', 6.0], ['Reception flicked it to the owner', 11.4]]) },
    { at: 14.7, html: eb('The owner called Josh back') + big('"Got your email. <em>I\'m interested.</em> What\'s the go?"', 3.3, 'mid') +
        small('A quick one-liner, and the conversation started.', 6.6) },
  ],
  'deal-c#1': [{ at: 0, html: eb('Deal #1') + big('The owner liked his <em>process and approach</em>.', 1.5, 'mid') }],
  'deal-c#2': [
    { at: 0, html: eb('Deal #1 · the outcome') + `<div class="row">${kpi('Months', 'to close the deal', 0.5)}${kpi('100%', 'vendor finance', 5.0)}</div>` },
    { at: 7.6, html: eb('He didn\'t know what he was doing') + big('So he relied on his <mark data-hd="1.6">board of directors</mark>.', 0.4, 'mid') },
  ],
  'board#1': [
    { at: 0, html: eb('What made it work') + big('Not knowing <em>the industry</em>.', 0.1) },
    { at: 2.1, html: eb('What made it work') + big('Recruiting people who <em>knew more than him</em>.', 0.5, 'mid') +
        small('To advise and govern the direction of the company.', 6.0) },
  ],

  // Part 5 · play to who you are
  'archetype#1': [
    { at: 0, html: eb('Acquisitions') + big('Difficult, and suited to a <em>particular archetype</em>.', 0.9, 'mid') },
    { at: 6.8, html: eb('But you don\'t have to be') + list([['Like Josh', 1.2], ['Extroverted', 2.4], ['A loudmouth alpha', 6.8]]) +
        small('Quieter people can make this work too.', 10.2) },
    { at: 23.2, html: eb('It\'s a learning curve') + big('<mark data-hd="2.2">Tailor the industry</mark> to you.', 1.4) +
        small('Put yourself in a position to succeed.', 4.0) },
  ],
  'match#1': [
    { at: 0, html: eb('Josh could have chosen') + list([['Finance', 0.8], ['Accounting', 1.7], ['Legal firms', 2.5]]) },
    { at: 5.7, html: eb('More geared to blue collar?') + big('Then go into the <em>groundwork</em> industries.', 1.4, 'mid') },
  ],
  'christian#1': [{ at: 0, html: eb('Example · Christian, Victoria') + big('Waste and <em>energy</em>.', 4.3) }],
  'christian#3': [{ at: 0, html: eb('Why it fits Christian') + list([['A trade background', 0.6], ['A personality and demeanour that suit the work', 1.8]]) }],
  'close#1': [
    { at: 0, html: eb('Picking your industry') + big('Stop <em>overthinking it</em>.', 1.2) },
    { at: 3.2, html: eb('Be critical about') + list([['Who you are', 1.8], ['How you look', 3.3], ['Who you want to be', 5.4]]) },
  ],
  'close#2': [{ at: 0, html: eb('Josh Li') + big('Here\'s to <em>your success</em>.', 2.3) }],

  // ---- extra parts used only by the long-form cut (industry-long) ----
  'greet#1': [{ at: 0, html: eb('Josh Li · Founder, JC Health Group') + big('Good morning, <em>friends and family</em>.', 0.2) }],
  'hardsay#1': [{ at: 0, html: eb('Stay, or change?') + big('Hard to say <em>without knowing more</em>.', 2.9, 'mid') }],
  'bluecollar#1': [{ at: 0, html: eb('The alternative') + big('Blue-collar <em>industries</em>?', 2.0) }],
  'bluecollar#2': [{ at: 0, html: eb('Josh\'s background') + list([['Not a blue-collar kid', 0.3], ['His parents served them through their small businesses', 4.9],
      ['He relates to them on that level', 9.2 + 0.6]]) }],
  'bluecollar#4': [{ at: 0, html: eb('But for other industries') + big('No ambition. No passion. <em>No juice.</em>', 0.6, 'mid') }],
  'how-hc#1': [{ at: 0, html: eb('How he chose') + big('Something to do with health, and he <em>just went for it</em>.', 3.4, 'mid') }],
  'site#1': [{ at: 0, html: eb('Deal #1 · the backstory') + big('A site visit somewhere else, and an <em>offer signed</em>.', 2.2, 'mid') }],
  'partner#1': [{ at: 0, html: eb('Same day') + big('First time meeting his <em>current business partner</em> in person.', 1.6, 'mid') }],
  'why-work#1': [{ at: 0, html: eb('Back to the question') + big('Why healthcare? <em>What made it work?</em>', 2.6, 'mid') }],
  'role#1': [{ at: 0, html: eb('Josh\'s own role') + list([['The energy', 1.9 + 0.8], ['The passion', 1.9 + 1.7]]) }],
  'acq#1': [{ at: 0, html: eb('Why so few people do this') + big('Not many play the <em>acquisitions game</em>.', 3.4, 'mid') }],
  'acq#2': [{ at: 0, html: eb('Why so few people do this') + big('It\'s not necessarily <em>hard</em>.', 0.4) }],
  'pena#1': [{ at: 0, html: eb('From Josh\'s virtual mentor, Dan Peña') + big('How to pick an industry: the <em>phone book</em> joke.', 9.6, 'mid') }],
  'pena#2': [{ at: 0, html: eb('The joke') + list([['Throw a phone book on the ground', 1.3], ['See which page it lands on', 2.7], ['Pick that industry', 4.0]]) }],
  'pena#3': [{ at: 0, html: eb('Why it isn\'t crazy') + big('You can always <mark data-hd="1.3">pivot</mark>.', 0.4) + small('Like Josh did with GP medical centres.', 1.6) }],
  'rejected#1': [{ at: 0, html: eb('GP clinics') + list([['Too much time spent in that field', 0.9], ['Rejected left, right and centre', 5.3]]) }],
  'rejected#2': [{ at: 0, html: eb('So he felt the calling') + big('To <em>pivot</em>.', 1.4) }],
  'rejected#3': [{ at: 0, html: eb('Still healthcare') + big('Same realm, <em>different arena</em>.', 0.5) }],
  'rejected#4': [{ at: 0, html: eb('Looking back') + big('Glad he <em>made that pivot</em>.', 2.2) }],
  'allied#1': [{ at: 0, html: eb('Allied health') + big('No drugs. <em>Natural solutions.</em>', 1.9) }],
  'allied#2': [
    { at: 2.7, html: eb('In physiotherapy') + list([['Injured or in pain?', 0.9], ['Learn how to use your body', 4.4], ['So it can heal itself', 7.3]]) },
    { at: 15.2, html: eb('Allied health') + big('<mark data-hd="2.4">Empower</mark> the person.', 1.8) },
  ],
  'glad#1': [{ at: 0, html: eb('Josh Li') + big('Glad he came into <em>physiotherapy</em>.', 0.8) }],
};
