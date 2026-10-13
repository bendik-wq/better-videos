// LEDGER set registry: name -> { plan(shot) -> P (pure: timing, sfx, hits), draw(g, t, shot, P) }.
// plan() runs in node too (cuts.mjs reads P.sfx for the score), so sets touch no DOM at import time.
import hook from './hook.js';
import bignum from './bignum.js';
import checklist from './checklist.js';
import docstack from './docstack.js';
import redact from './redact.js';
import flow from './flow.js';
import tiers from './tiers.js';
import window_ from './window.js';
import industry from './industry.js';
import quote from './quote.js';
import qa from './qa.js';
import team from './team.js';
import cta from './cta.js';

export default { hook, bignum, checklist, docstack, redact, flow, tiers, window: window_, industry, quote, qa, team, cta };
