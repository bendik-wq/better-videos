// NOTRE-DAME (episode 10) chapter 3 "THE WRONG FIX": the `airdrop` hero set (VISUALS H8 water-bomber demonstration, plus the
// parvis/façade frames of L47-L60), in the Paper & Spring look. Registered in nd-sets.js SETS (additive). Uses the nd-sets KIT
// lazily (inside the factory only), so the circular import with nd-sets.js is safe.
//
// view 'facade' (default): the west-front card by day on the parvis, the spire gone (dashed ghost), roof fire behind.
//   k (8.5), ox, ground (905), fire 0..1, smoke, ghost (true: dashed outline where the spire stood), crowd (quay crowd),
//   tripods n (card camera tripods in the foreground, aimed at the gap), aim [x, y] (default: the gap),
//   bellPeek true (a bell glimpsed through the north louvre), louvreDark true,
//   plane {x, y, sc, rot} (+ planeTo {x, y, sc, rot, at, dur}), lift 0..1 (+liftAt/liftDur: rises off the top on its wire),
//   winch true (the wire runs from a brass winch arm at the top of frame), shadow 0..1 (+shadowAt/shadowDur: the plane's
//   shadow sweeps across the façade, left -> right), hose 0..1 (+hoseAt/hoseDur: a teal hose line draws on along the parvis),
//   hoseTo 'portal'|'north' (where it runs), rescue 0..1 (+rescueAt/rescueDur: the ringed box in the central portal opens and
//   ink tallies walk out one at a time to a row on the sage square), rule69 true (+ruleAt: a brass ruler with the 69 m tick),
//   toy 0..1 (+toyAt/toyDur: the bell-frame toy rises from behind the parvis line, right of the model, with a leader line),
//   stamp { text, sub, at } (a shield-and-wave stamp plate, no real logo)
// view 'crowd': the parvis seen wide from above the crowd; hundreds of sage tallies, each with a little plane-shaped speech tab
//   (tabs 0..1 +tabsAt/tabsDur pop in), one tab grows into a card (grow 0..1 +growAt/growDur)
// view 'hills': a paper water-bomber on a wire over sage card hills with a brass wildfire band; fly 0..1 (+flyAt/flyDur),
//   dropAt (the teal slab falls), bankAt (+bankDur: it banks toward the small card cathedral at the right)
// view 'flex': the demonstration, "what they warned of": the south side card between neighbouring card houses; the plane drops
//   a teal slab (dropAt) onto the roof -> flex 0..1 (+flexAt/flexDur): the roof line sags (dashed), the walls bow (arrows),
//   spray reaches the buildings nearby. Never a section: we see only the outside of the card.
// every view: sky 'day'|'dusk', cam {x,y,z}, zoomTo, red ('gap'|'bell'|'nose'|'shadow'|'nozzle'|'ring'|'louvre'|'tab'|'flex'|
//   'toybell'|'none') + redSeq [{red, at}], tags [{at:[x,y], to:[x,y], text, sub, inAt}], chips [{text, sub, at}], strip
//   [line, line2] (+stripAt), kicker, clock ('HH:MM'|null, default null), source, smokeSeed/smokeStyle
import * as M from '/engine/motion.js';
import { KIT } from './nd-sets.js';

const clamp = M.clamp, lerp = (a, b, u) => a + (b - a) * u, range = (t, a, b) => clamp((t - a) / (b - a));
const fract = (x) => x - Math.floor(x), hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
// animated param, tolerant of unresolved cue strings (they fall back to `fb` seconds)
function an(p, key, t, def = 0, fb = 0.5, ease = M.E.inOutSine) {
  const v = p[key] ?? def; if (typeof v !== 'number') return v; const at = p[key + 'At']; if (at == null) return v;
  return v * ease(range(t, num(at, fb), num(at, fb) + num(p[key + 'Dur'], 2)));
}
function redAt(p, t, def) { let r = p.red ?? def; if (p.redSeq) for (const q of p.redSeq) if (t >= num(q.at, 0)) r = q.red; return r; }

// ---------------------------------------------------------------- screen-space paper pieces (copies of the nd-sets look)
function chipStack(K, g, chips, t) {
  const { P, pen, rrect, mono } = K; let y = 70;
  for (const c of chips) { const u = range(t, num(c.at, 0), num(c.at, 0) + 0.35); if (u <= 0) continue; if (c.y != null) y = c.y; // c.x (left edge) / c.y: a chip placed in empty sky
    const subs = c.sub ? String(c.sub).split('\n') : [];
    g.save(); g.font = '600 30px "Archivo Narrow"'; const w1 = g.measureText(c.text).width; g.font = '500 19px "Plex Mono"'; g.letterSpacing = '3px'; const w2 = subs.length ? Math.max(...subs.map(s2 => g.measureText(s2.toUpperCase()).width)) : 0; g.restore();
    const W = Math.max(w1, w2) + 56, H = 62 + subs.length * 30, x = (c.x ?? 1920 - 80 - W) + (1 - M.E.outCubic(u)) * 500;
    pen(g, rrect(x, y, W, H, 6), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, rrect(x + 12, y - 8, 30, 18, 3), { fill: P.brass, lw: 1.5, breaks: false, highlight: false });
    g.save(); g.font = '600 30px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(c.text, x + 28, y + 44); g.restore();
    subs.forEach((s2, i) => mono(g, s2, x + 28, y + 76 + i * 30, 19, P.ink70));
    y += H + 22; }
}
// lower-third strip: line 0 in Archivo, line 1+ in mono; `redWord` (a substring of line 0) is underlined in red
function lowerStrip(K, g, lines, t, at = 0, { redWord = null, big = 1, until = null } = {}) {
  const { P, pen, rect, mono } = K; const ls = [].concat(lines), u = M.E.outCubic(range(t, at, at + 0.45)) * (until == null ? 1 : 1 - M.E.inCubic(range(t, until, until + 0.4))); if (u <= 0) return;
  const isBig = (i) => i < big;
  let w = 0; g.save(); ls.forEach((l, i) => { g.font = !isBig(i) ? '500 21px "Plex Mono"' : '600 32px "Archivo Narrow"'; g.letterSpacing = !isBig(i) ? '3px' : '0px'; w = Math.max(w, g.measureText(!isBig(i) ? String(l).toUpperCase() : l).width); }); g.restore();
  const W = Math.min(1760, w + 80), H = 34 + ls.length * 40, x0 = 960 - W / 2, y0 = 1080 - 110 - H;
  g.save(); g.translate((1 - u) * -1900, 0);
  pen(g, rect(x0, y0, W, H), { fill: P.kraft, lw: 2, shadow: true, breaks: false, highlight: false });
  ls.forEach((l, i) => { if (!isBig(i)) mono(g, l, x0 + 40, y0 + 52 + i * 40, 21, P.ink70); else { const yb = y0 + 52 + i * 40; g.font = '600 32px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(l, x0 + 40, yb);
    if (redWord && l.includes(redWord)) { const a = g.measureText(l.slice(0, l.indexOf(redWord))).width, b = g.measureText(redWord).width, ru = range(t, at + 0.5, at + 0.9);
      g.strokeStyle = P.red; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 40 + a, yb + 10); g.lineTo(x0 + 40 + a + b * ru, yb + 10); g.stroke();
      g.lineWidth = 2; g.setLineDash([7, 6]); g.beginPath(); g.ellipse(x0 + 40 + a + b / 2, yb - 11, b / 2 + 16, 27, 0, 0, Math.PI * 2 * ru); g.stroke(); g.setLineDash([]); } } });
  g.restore();
}

// ---------------------------------------------------------------- the paper water-bomber (side view, facing right)
// origin = the wing root on top of the fuselage (where the wire attaches); length ~ 300 px at sc 1
function planeShape(K, g, sc, { red = false, shadowOnly = false, col = null } = {}) {
  const { P, pen, poly, circle, rrect, redRing } = K;
  const S = (pts) => pts.map(([x, y]) => [x * sc, y * sc]);
  const hull = S([[-150, 6], [-120, 0], [80, -4], [128, 4], [150, 18], [146, 32], [110, 44], [-60, 42], [-110, 30], [-150, 16]]);
  const fin = S([[-150, 8], [-170, -58], [-146, -60], [-118, 2]]), tailP = S([[-178, -54], [-120, -54], [-128, -46], [-176, -46]]);
  const wing = S([[-40, -6], [60, -6], [56, 2], [-36, 2]]), eng = [S([[0, -2], [44, -2], [52, 6], [44, 14], [0, 14]]), S([[18, 10], [58, 10], [66, 18], [58, 26], [18, 26]])];
  const float_ = S([[-10, 70], [40, 70], [48, 76], [40, 82], [-8, 82]]);
  if (shadowOnly) { g.fillStyle = col; for (const sh of [hull, fin, tailP, wing, ...eng]) { poly(sh)(g); g.fill(); } return; }
  const o = { lw: 2.5, breaks: false, highlight: false };
  pen(g, poly(fin), { ...o, fill: P.card }); pen(g, poly(tailP), { ...o, fill: P.kraft });
  pen(g, poly(hull), { ...o, fill: P.card, shadow: true, shadowOff: [10, 12], shade: 0.25, shadeColor: P.kraftD, box: [-150 * sc, 0, 150 * sc, 44 * sc] });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(-140 * sc, 24 * sc); g.lineTo(140 * sc, 24 * sc); g.stroke(); g.restore(); // the hull chine
  g.save(); g.fillStyle = P.tealL; g.strokeStyle = P.ink; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.roundRect((-90 + i * 26) * sc, 8 * sc, 13 * sc, 9 * sc, 2 * sc); g.fill(); g.stroke(); } g.restore();
  pen(g, poly(S([[96, 4], [124, 6], [132, 14], [100, 14]])), { ...o, fill: P.tealL, lw: 2 }); // cockpit
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(10 * sc, 42 * sc); g.lineTo(10 * sc, 70 * sc); g.moveTo(30 * sc, 42 * sc); g.lineTo(30 * sc, 70 * sc); g.stroke(); g.restore();
  pen(g, poly(float_), { ...o, fill: P.card, lw: 2 });
  pen(g, poly(wing), { ...o, fill: P.kraft });
  for (const e of eng) { pen(g, poly(e), { ...o, fill: P.ink70 }); }
  for (const [ex, ey] of [[56, 6], [70, 18]]) pen(g, rrect((ex - 2) * sc, (ey - 16) * sc, 5 * sc, 32 * sc, 2 * sc), { ...o, fill: P.brass, lw: 1.5 }); // propeller blades
  pen(g, rrect(-60 * sc, 26 * sc, 70 * sc, 12 * sc, 3 * sc), { ...o, fill: P.brassL, lw: 1.5 }); // the water-tank door (brass card)
  if (red) { pen(g, circle(148 * sc, 18 * sc, 7 * sc), { fill: P.red, line: P.ink, lw: 2, breaks: false, highlight: false }); redRing(g, 146 * sc, 18 * sc, 26 * sc, P.red, 3); }
}
// the plane seen from above (a crisp cast-shadow silhouette, or the paper toy in the plan view); nose at +x, origin = wing root
function planeTop(K, g, sc, { shadow = null, red = false } = {}) {
  const { P, pen, poly, circle, redRing } = K, S = (pts) => pts.map(([x, y]) => [x * sc, y * sc]);
  const hull = S([[-150, -9], [100, -15], [140, -10], [154, 0], [140, 10], [100, 15], [-150, 9], [-160, 0]]);
  const wing = S([[-20, -18], [30, -18], [24, -175], [-6, -175]]), wingB = S([[-20, 18], [30, 18], [24, 175], [-6, 175]]);
  const tail = S([[-150, -8], [-128, -8], [-134, -66], [-150, -66]]), tailB = S([[-150, 8], [-128, 8], [-134, 66], [-150, 66]]);
  const engs = [-70, 70].map(o => S([[18, o - 9], [64, o - 9], [72, o], [64, o + 9], [18, o + 9]]));
  if (shadow) { g.save(); g.fillStyle = shadow; g.beginPath(); for (const sh of [hull, wing, wingB, tail, tailB, ...engs]) { sh.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); } g.fill('nonzero'); g.restore(); return; }
  const o = { lw: 2.5, breaks: false, highlight: false };
  for (const w of [wing, wingB]) pen(g, poly(w), { ...o, fill: P.kraft, shadow: true, shadowOff: [10, 12] });
  for (const w of [tail, tailB]) pen(g, poly(w), { ...o, fill: P.kraft });
  for (const e of engs) pen(g, poly(e), { ...o, fill: P.ink70, lw: 2 });
  pen(g, poly(hull), { ...o, fill: P.card, shadow: true, shadowOff: [10, 12] });
  pen(g, poly(S([[96, -8], [128, -6], [128, 6], [96, 8]])), { ...o, fill: P.tealL, lw: 2 });
  pen(g, poly(S([[-60, -6], [10, -6], [10, 6], [-60, 6]])), { ...o, fill: P.brassL, lw: 1.5 });
  if (red) { pen(g, circle(150 * sc, 0, 7 * sc + 2), { fill: P.red, line: P.ink, lw: 2, breaks: false, highlight: false }); redRing(g, 150 * sc, 0, 26 * sc + 8, P.red, 3); }
}
function drawPlane(K, g, x, y, sc, rot, { red = false, wireTop = -60, winch = null, bank = 0 } = {}) {
  const { P, pen, rrect, circle, gearPath } = K;
  // the wire (2 px ink thread) from the wing root to the top of frame (or the winch drum)
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(winch ? winch[0] : x, winch ? winch[1] : wireTop); g.stroke(); g.restore();
  g.save(); g.translate(x, y); g.rotate(rot * Math.PI / 180); g.scale(1, 1 - 0.35 * bank); planeShape(K, g, sc, { red }); g.restore();
  pen(g, circle(x, y, 5), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); // the wire's brass eyelet
}
function winchArm(K, g, wx, wy, t, u = 1) {
  const { P, pen, rect, rrect, circle, gearPath } = K; if (u <= 0) return; const dy = (1 - M.E.outBack(u)) * -260;
  g.save(); g.translate(0, dy);
  pen(g, rect(wx - 6, -40, 12, wy + 40 - 20), { fill: P.brassD, lw: 2, breaks: false, highlight: false });       // the mast from the top of frame
  pen(g, rrect(wx - 220, wy - 26, 240, 22, 6), { fill: P.brass, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.35, shadeColor: P.brassD, box: [wx - 220, wy - 26, wx + 20, wy - 4] }); // the arm
  pen(g, gearPath(wx, wy - 15, 34, 12, t * 0.6), { fill: P.brassL, lw: 2, breaks: false, highlight: false, shade: 0.4, shadeColor: P.brass, box: [wx - 34, wy - 49, wx + 34, wy + 19] });
  pen(g, circle(wx, wy - 15, 11), { fill: P.brassD, lw: 1.5, breaks: false, highlight: false });
  pen(g, circle(wx - 210, wy - 4, 9), { fill: P.brassL, lw: 1.5, breaks: false, highlight: false }); // the pulley the wire drops from
  g.restore(); return [wx - 210, wy + 5 + dy];
}
function slab(K, g, x, y, w, h, seed, a = 1) {
  const { P, pen, poly, deckle } = K; if (a <= 0) return;
  const pts = deckle([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2 * 0.9, y + h / 2], [x - w / 2 * 0.9, y + h / 2]], seed, 3, 14);
  pen(g, poly(pts), { fill: P.teal, lw: 2.5, breaks: false, highlight: false, alpha: a, shade: 0.3, shadeColor: P.tealD, box: [x - w / 2, y - h / 2, x + w / 2, y + h / 2] });
  g.save(); g.globalAlpha *= a; g.strokeStyle = P.tealL; g.lineWidth = 3; g.setLineDash([18, 14]); for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x - w * 0.38, y - h / 2 + i * h / 3); g.lineTo(x + w * 0.38, y - h / 2 + i * h / 3); g.stroke(); } g.restore();
}
function spray(K, g, x0, y0, x1, y1, t, u, seed = 1) { // teal paper droplets flying from (x0, y0) to (x1, y1) on an arc, u 0..1
  const { P, pen, poly } = K; if (u <= 0) return;
  for (let i = 0; i < 18; i++) { const v = clamp(u * 1.4 - hash(seed + i) * 0.4); if (v <= 0 || v >= 1) continue;
    const x = lerp(x0, x1, v) + (hash(seed + i * 3) - 0.5) * 60, y = lerp(y0, y1, v) - Math.sin(v * Math.PI) * (120 + hash(seed + i * 5) * 80), s = 9 + hash(i + seed) * 7;
    g.save(); g.translate(x, y); g.rotate(i + t * 2); pen(g, poly([[0, -s], [s * 0.6, 0], [0, s], [-s * 0.6, 0]]), { fill: i % 3 ? P.tealL : P.teal, lw: 1.5, breaks: false, highlight: false, mis: [1.5, 1] }); g.restore(); }
}
function tripod(K, g, x, y, h, aim, { night = false } = {}) {
  const { P, pen, rect, rrect, circle, poly } = K, hy = y - h, a = Math.atan2(aim[1] - hy, aim[0] - x);
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath();
  for (const dx of [-0.42, 0.06, 0.4]) { g.moveTo(x, hy + 10); g.lineTo(x + dx * h, y); } g.stroke(); g.restore();
  g.save(); g.translate(x, hy); g.rotate(a);
  pen(g, rrect(-46, -30, 92, 56, 6), { fill: P.ink70, lw: 2.5, shadow: true, breaks: false, highlight: false });
  pen(g, rect(46, -16, 30, 28), { fill: P.ink, lw: 2, breaks: false, highlight: false });                                   // the lens barrel
  pen(g, poly([[74, -16], [104, -30], [104, 26], [74, 12]]), { fill: P.ink70, lw: 2, breaks: false, highlight: false });       // the flared lens hood (a camera, not a telescope)
  g.save(); g.strokeStyle = P.tealL; g.lineWidth = 3; g.beginPath(); g.moveTo(101, -24); g.lineTo(101, 20); g.stroke(); g.restore(); // the glass, seen edge-on
  pen(g, rrect(-62, -12, 18, 22, 3), { fill: P.ink, lw: 1.5, breaks: false, highlight: false });                              // the viewfinder eyepiece
  pen(g, rrect(-36, -46, 40, 16, 3), { fill: P.card, lw: 1.5, breaks: false, highlight: false });
  pen(g, circle(-20, 8, 6), { fill: P.brassL, lw: 1.2, breaks: false, highlight: false });            // the reel / record knob
  g.restore();
}
function tally(K, g, x, y, sc, { col, line, lean = 0 } = {}) {
  const { P, pen, pill } = K; g.save(); g.translate(x, y); g.rotate(lean * Math.PI / 180); g.scale(sc, sc);
  pen(g, pill(0, -17, 12, 34), { fill: col ?? P.sage, line: line ?? P.ink, lw: 1.6, breaks: false, highlight: false, mis: [2, 1.5] });
  g.fillStyle = P.card; g.beginPath(); g.arc(0, -28, 3.2, 0, Math.PI * 2); g.fill(); g.restore();
}
function planeGlyph(g, x, y, s, col) { // a tiny plane pictogram for the speech tabs
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath();
  g.moveTo(-10, 0); g.lineTo(8, -1.5); g.quadraticCurveTo(12, 0, 8, 1.5); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-2, -1); g.lineTo(2, -1); g.lineTo(-1, -7); g.lineTo(-4, -7); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-2, 1); g.lineTo(2, 1); g.lineTo(-1, 7); g.lineTo(-4, 7); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-10, 0); g.lineTo(-8, -4); g.lineTo(-6, -4); g.lineTo(-6, 0); g.closePath(); g.fill(); g.restore();
}
function stampPlate(K, g, st, t) {
  const { P, pen, rrect, poly, mono } = K; const at = num(st.at, 0.3), u = range(t, at, at + 0.28); if (u <= 0) return;
  const sc = lerp(1.35, 1, M.E.outBack(u)), x = st.x ?? 120, y = st.y ?? 250, W = 660, H = 330;
  g.save(); g.translate(x + W / 2, y + H / 2); g.rotate((st.rot ?? -4) * Math.PI / 180); g.scale(sc, sc); g.translate(-W / 2, -H / 2); g.globalAlpha *= clamp(u * 2);
  pen(g, rrect(0, 0, W, H, 10), { fill: P.card, lw: 3, shadow: true, shadowOff: [12, 14], breaks: false, highlight: false, shade: 0.12, shadeColor: P.kraftD, box: [0, 0, W, H] });
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28); g.restore();
  // shield + waves (a generic civil-protection emblem, not the real logo)
  const sx = 70, sy = 54, sw = 120, sh = 150, shield = [[sx, sy], [sx + sw, sy], [sx + sw, sy + sh * 0.55], [sx + sw / 2, sy + sh], [sx, sy + sh * 0.55]];
  pen(g, poly(shield), { fill: P.tealL, lw: 3, breaks: false, highlight: false });
  g.save(); poly(shield)(g); g.clip(); g.strokeStyle = P.tealD; g.lineWidth = 7; for (let i = 0; i < 4; i++) { const yy = sy + 40 + i * 28; g.beginPath(); for (let xx = sx - 10; xx <= sx + sw + 10; xx += 4) { const v = yy + Math.sin((xx - sx) / 14) * 6; xx === sx - 10 ? g.moveTo(xx, v) : g.lineTo(xx, v); } g.stroke(); } g.restore();
  g.save(); g.font = '700 50px "Archivo Narrow"'; g.fillStyle = P.ink; g.fillText(st.text ?? 'Sécurité civile', 222, 120); g.restore();
  mono(g, st.kicker ?? 'FRENCH CIVIL PROTECTION', 224, 160, 18, P.ink70);
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(222, 186); g.lineTo(W - 40, 186); g.stroke(); g.restore();
  if (st.sub) [].concat(st.sub).forEach((s, i) => mono(g, s, 224, 226 + i * 34, 21, P.ink));
  mono(g, 'EMBLEM REDRAWN · NOT THE LOGO', 70, H - 30, 14, P.ink40);
  g.restore();
}

// ---------------------------------------------------------------- the façade view
function viewFacade(K, g, t, p, red, sky) {
  const { P, pen, rect, rrect, circle, poly, mono, tag, flame, plume, facadeCard, spire, trees, foreQuay, backdrop, glowRings, looks, redRing, bell, cardTower, bellFrameInside, hoseLine, nozzle, ND } = K;
  const night = sky !== 'day', Lk = looks(sky), k = p.k ?? 8.5, oy = p.ground ?? 905, ox = p.ox ?? 960 - 20.5 * k, cx = ox + 20.5 * k;
  const X = (m) => ox + m * k, Y = (m) => oy - m * k, fire = an(p, 'fire', t, 0.5), smoke = p.smoke ?? 1;
  backdrop(g, t, { sky, yH: oy, glow: night ? fire * 0.7 : 0 });
  if (night && fire > 0) glowRings(g, cx, oy - 62 * k, 62 * k, clamp(0.4 + fire), t, 2, Lk.sky);
  const ob = p.oblique; // oblique {a, b}: a 3/4 view of the front card (x scale a, shear b; b < 0 = the north end nearer), the table seen at an angle
  if (ob) { // the north flank first: the side card, mirrored, receding up-left from the near north-west corner
    const fx = cx + (ob.a ?? 0.72) * (ox - cx), fy = oy + (ob.b ?? -0.2) * (ox - cx), stS = { sky, fireS: K.fireSections(fire), roofGone: 0, spire: 'gone', spireU: 0, glow: 0, wind: 0.35, smoke: ob.smoke ?? 0.45, glowWin: false };
    g.save(); g.transform(-(ob.sa ?? 0.5), -(ob.sb ?? 0.2), 0, 1, fx, fy); const Xs = (m) => m * k, Ys = (m) => -m * k;
    K.sideFire(g, Xs, Ys, k, stS, t, true); K.sideCard(g, 0, 0, k, stS, t); K.sideFire(g, Xs, Ys, k, stS, t, false); g.restore();
    g.save(); g.translate(cx, oy); g.transform(ob.a ?? 0.72, ob.b ?? -0.2, 0, 1, 0, 0); g.translate(-cx, -oy); }
  if (fire > 0.05) plume(g, cx + 4 * k, oy - 55 * k, t, { H: 75 * k, W: 8 * k, n: 10, drift: p.wind ?? 0.35, seed: 8, depth: 0.3, sky: Lk.sky, base: P.card, shadeCol: P.ink40, lit: P.emberL, amount: fire * smoke, line: P.ink40 });
  // the spire's ghost: a dashed outline where it stood (the spire is gone; we never show a hole)
  const gx = cx, gy0 = oy - 47 * k, gTop = oy - 85 * k;
  if (p.ghost !== false) { g.save(); g.strokeStyle = night ? rgba(P.paper, 0.7) : P.ink70; g.lineWidth = 2.5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(gx - 2.2 * k, gy0); g.lineTo(gx - 0.9 * k, gy0 - 14 * k); g.lineTo(gx, gTop); g.lineTo(gx + 0.9 * k, gy0 - 14 * k); g.lineTo(gx + 2.2 * k, gy0); g.stroke(); g.restore(); }
  if (fire > 0.05) for (let j = 0; j < 4; j++) flame(g, cx + (-4.2 + j * 2.8) * k, oy - 48.6 * k, (5 + 9 * fire) * (0.7 + 0.4 * hash(j)) * k, 3.4 * k, t, 30 + j, { lean: 0.3 });
  // parvis paving (kraft) + the hard façade shadow
  if (!ob) pen(g, rect(-40, oy - 6, 2000, 30), { fill: p.square ? P.sageL : P.kraft, lw: 2, breaks: false, highlight: false });
  if (!ob) g.save(); else g.save(), g.globalAlpha = 0; g.fillStyle = 'rgba(11,20,38,0.12)'; g.beginPath(); g.moveTo(ox + 6, oy); g.lineTo(ox + 41 * k + 6, oy); g.lineTo(ox + 41 * k + 90, oy + 24); g.lineTo(ox + 90, oy + 24); g.fill(); g.restore();
  const st = { sky, fireS: new Array(14).fill(0), roofGone: 0, spire: 'gone', spireU: 0, glow: 0, wind: 0.35, smoke, glowWin: false };
  if (p.parvis) { const col = p.square ? P.sageL : P.kraft; pen(g, rect(-200, oy - 2, 2400, 900), { fill: col, lw: 2, breaks: false, highlight: false });
    g.save(); g.strokeStyle = rgba(p.square ? P.sageD : P.ink40, 0.5); g.lineWidth = 1.4; g.beginPath(); for (let i = -30; i <= 30; i++) { g.moveTo(cx + i * 3.2 * k, oy); g.lineTo(cx + i * 3.2 * k * 6, oy + 900); }
    for (let j = 1; j < 14; j++) { const yy = oy + 900 * (j / 14) ** 1.7; g.moveTo(-200, yy); g.lineTo(2400, yy); } g.stroke(); g.restore();
    if (p.crowd) for (const [x0, x1] of [[-100, ox - 120], [ox + 41 * k + 120, 2100]]) { const r = M.rng(5 + x0); for (let x = x0; x < x1; x += 22 + r() * 18) tally(K, g, x, oy + 150 + r() * 60, 1.6 + r() * 0.3, { lean: Math.sin(t * 1.5 + x) * 3 }); } }
  const F = facadeCard(g, ox, oy, k, st, t);
  // the north belfry louvres (the left tower as we face the front): darkened, a bell glimpsed behind the slats
  const lv = [[4.2, 50.5, 62], [10.8, 50.5, 62]];
  if (p.louvreDark) for (const [lx] of lv) { g.save(); g.fillStyle = 'rgba(20,35,61,0.55)'; g.beginPath(); g.roundRect(X(lx - 1.8), Y(62.5), 3.6 * k, 12 * k, 1.8 * k); g.fill(); g.restore(); }
  if (p.bellPeek) { const bx = X(10.8), by = Y(60.4), d = 3.5 * k; g.save(); g.beginPath(); g.roundRect(X(9), Y(63), 3.6 * k, 12.5 * k, 1.8 * k); g.clip();
    bell(g, bx, by, d, { red: red === 'bell', lw: 2 }); g.strokeStyle = P.ink40; g.lineWidth = Math.max(1.2, k * 0.12); g.beginPath(); for (let yy = 51.2; yy < 64.5; yy += 1.8) { g.moveTo(X(8.8), Y(yy)); g.lineTo(X(12.8), Y(yy + 0.4)); } g.stroke(); g.restore();
    if (red === 'bell') redRing(g, bx, by + d * 0.42, d * (p.bellRingSc ?? 0.9), P.red, p.bellRingSc ? 4.5 : 3); } // bellRingSc: additive (ch5 QA)
  if (red === 'louvre') { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 8]); g.beginPath(); g.roundRect(X(1.6), Y(64.5), 11.8 * k, 15.5 * k, 2 * k); g.stroke(); g.restore(); }
  if (red === 'gap') { g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(gx, (gy0 + gTop) / 2, 6.5 * k, (gy0 - gTop) / 2 + 3 * k, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
  // the trapped box in the central portal: ring opens, ink tallies walk out to a row on the sage square
  if (p.rescue != null) { const u = an(p, 'rescue', t, 1), n = p.rescueN ?? 9, px = cx, py = oy - 1;
    const ringA = red === 'ring' ? 1 - clamp((u - 0.82) / 0.18) : 0, open = clamp(u / 0.15);
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);
    for (let i = 0; i < n; i++) { const o = order.indexOf(i), st0 = 0.06 + o * (0.7 / n), v = M.E.inOutSine(clamp((u - st0) / 0.26)); const hx = px + (i - (n - 1) / 2) * 1.0 * k, hy = py - 0.3 * k - (i % 2) * 0.6 * k, rx = cx + (i - (n - 1) / 2) * 3.4 * k, ry = oy + 6.5 * k;
      const x = lerp(hx, rx, v), y = lerp(hy, ry, v) - Math.sin(v * Math.PI) * 0.6 * k; const bob = v > 0 && v < 1 ? Math.abs(Math.sin(t * 9 + i)) * 0.3 * k : 0;
      tally(K, g, x, y - bob, 0.08 * k * (1 + 0.35 * v), { col: P.ink70, line: P.ink, lean: v > 0 && v < 1 ? Math.sin(t * 9 + i) * 6 : 0 }); }
    if (ringA > 0) { g.save(); g.globalAlpha *= ringA; g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 8]); const w = n * 1.0 * k + 2.4 * k, h = 9 * k;
      g.beginPath(); const gapA = open * 0.9; g.ellipse(px, py - 3.5 * k, w / 2 + k, h / 2 + k, 0, -Math.PI / 2 + gapA, -Math.PI / 2 - gapA + Math.PI * 2); g.stroke(); g.restore(); } }
  if (ob) g.restore(); // close the 3/4 transform
  // trees, the quay + crowd, the drafting rule
  for (const [x0, x1] of [[60, ox - 30], [ox + 41 * k + 30, 1880]]) trees(g, oy + 2, x0, x1, { col: P.sage, shadeCol: P.sageD, seed: 8 + x0, t, size: 46, line: P.ink });
  if (p.hedgeCrowd) { const hc = p.hedgeCrowd === true ? {} : p.hedgeCrowd, r = M.rng(hc.seed ?? 23), sc = hc.sc ?? 1.25, y0 = oy + (hc.dy ?? 16); // hedgeCrowd: the crowd, small, all facing the gap
    for (const [x0, x1] of [[hc.x0 ?? 40, ox - 24], [ox + 41 * k + 24, hc.x1 ?? 1890]]) for (let x = x0 + r() * 12; x < x1; x += (hc.gap ?? 26) + r() * 16) { const towards = Math.sign(cx - x);
      tally(K, g, x, y0 + r() * 8, sc * (0.9 + r() * 0.2), { col: r() < 0.3 ? P.sageD : P.sage, lean: towards * (5 + r() * 4) + Math.sin(t * 1.4 + x) * 1.5 }); } }
  if (p.rule69) { const u = M.E.outCubic(range(t, num(p.ruleAt, 0.2), num(p.ruleAt, 0.2) + num(p.ruleDur, 0.8))), rx = ox - 70 - 22, h = 69 * k * u;
    pen(g, rect(rx, oy - h, 22, h), { fill: P.brassL, lw: 2, shadow: true, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brass, box: [rx, oy - h, rx + 22, oy] });
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let m = 0; m <= 69 * u; m += 2) { const yy = oy - m * k; g.moveTo(rx + 22, yy); g.lineTo(rx + 22 - (m % 10 === 0 ? 14 : 7), yy); } g.stroke(); g.restore();
    if (u >= 1) { g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(rx, Y(69)); g.lineTo(X(41), Y(69)); g.stroke(); g.restore();
      const lab = p.ruleLabel ?? '69 M · BOTH TOWERS'; g.save(); g.font = '500 24px "Plex Mono"'; g.letterSpacing = '3.8px'; const lw = g.measureText(lab).width; g.restore();
      pen(g, rect(rx - lw - 46, Y(69) - 22, lw + 30, 40), { fill: P.card, lw: 2, breaks: false, highlight: false, shadow: true }); mono(g, lab, rx - lw - 31, Y(69) + 8, 24, P.ink); } }
  // the bell-frame toy rising beside the model (a separate paper toy on the table)
  if (p.toy != null) { const u = M.E.outBack(clamp(an(p, 'toy', t, 1))), tw = p.toyW ?? 300, th = tw * 1.45, tx = p.toyX ?? X(41) + 210, ty = oy - th + (1 - u) * (th + 60);
    g.save(); g.beginPath(); g.rect(-200, -400, 2400, oy + 2 + 400); g.clip();
    cardTower(g, tx, ty, tw, th, { open: 1, belfryTop: 0, belfryBot: 0.62, t, glue: p.glue, inside: (gg, x0, y0, x1, y1) => bellFrameInside(gg, x0, y0, x1, y1, { char: 0, flame: 0, redBell: red === 'toybell' ? 2 : -1, weights: false, t, order: p.bellOrder }) });
    g.restore();
    if (u > 0.95) { g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2.5; g.setLineDash([9, 7]); g.beginPath(); g.moveTo(X(12.8), Y(56)); g.quadraticCurveTo((X(13) + tx) / 2, Y(84), tx + 20, ty + 60); g.stroke(); g.restore(); } }
  // the hose line along the parvis (teal paper with brass couplings), drawn on by `hose`
  let nz = null;
  if (p.hose != null) { const u = an(p, 'hose', t, 1), to = p.hoseTo ?? 'portal';
    const pts = p.hosePts ? p.hosePts : p.parvis ? (to === 'north' ? [[-80, 1180], [300, 1110], [X(-8), oy + 70], [X(1), oy + 30], [X(7.6), oy + 8]] : [[-80, 1180], [420, 1100], [X(4), oy + 70], [X(14), oy + 32], [cx - 2 * k, oy + 10]])
      : to === 'north' ? [[-80, 1060], [260, 1010], [X(-4), oy + 18], [X(3), oy + 8], [X(7.6), oy + 2]] : [[-80, 1070], [360, 1030], [X(4), oy + 22], [X(14), oy + 14], [cx - 2 * k, oy + 6]];
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(tot); }
    const d = tot * clamp(u), part = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (L[i - 1] <= d) part.push(pts[i]); else { const s0 = i > 1 ? L[i - 2] : 0, f = (d - s0) / (L[i - 1] - s0); part.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } }
    if (part.length > 1) { if (!p.parvis) foreQuay(g, t, oy + 24, { night, glow: 0, crowd: p.crowd !== false }); p.__quayDone = true;
      hoseLine(g, part, 14, { couplings: part.length > 3 ? [2] : [], flow: 1, t }); const a = part.at(-1), b = part.at(-2), ang = Math.atan2(a[1] - b[1], a[0] - b[0]); nozzle(g, a[0], a[1], ang, 48, 13); nz = [a[0] + Math.cos(ang) * 30, a[1] + Math.sin(ang) * 30]; } }
  if (!p.__quayDone && !p.parvis) foreQuay(g, t, oy + 24, { night, glow: 0, crowd: p.crowd !== false }); delete p.__quayDone;
  if (red === 'nozzle' && nz) { pen(g, circle(nz[0], nz[1], 8), { fill: P.red, lw: 2, breaks: false, highlight: false }); redRing(g, nz[0], nz[1], 30, P.red, 3); }
  // camera tripods on the quay, aimed at the gap
  if (p.tripods && !(p.tripodOutAt != null && t >= num(p.tripodOutAt, 1e9) && t < num(p.tripodInAt, 1e9))) { const aim = p.aim ?? [gx, (gy0 + gTop) / 2]; const xs = p.tripodX ?? [330, 1420, 1690].slice(0, p.tripods);
    const tsc = p.tripodSc ?? 1, ty0 = p.tripodY ?? 1072;
    xs.forEach((x, i) => { const y = ty0 + (i % 2) * 6, fl = aim[0] < x ? -1 : 1; g.save(); g.translate(x, y); g.scale(tsc * fl, tsc); tripod(K, g, 0, 0, 150 + (i % 2) * 22, [(aim[0] - x) * fl / tsc, (aim[1] - y) / tsc]); g.restore(); }); }
  // the plane's shadow sweeping over the façade (clipped to the card)
  if (p.shadow != null) { const sc = (p.shadowSc ?? 0.62) * k / 8.5, L2 = 150 * sc, sx0 = ox - L2 * 1.2, sx1 = p.shadowStopX ?? ox + 41 * k + L2 * 1.2;
    const u = p.shadowEndAt != null ? M.E.inOutSine(range(t, num(p.shadowAt, 0.5), num(p.shadowEndAt, 2))) : an(p, 'shadow', t, 1, 0.5, (x) => x), sx = lerp(sx0, sx1, u), sy = Y(p.shadowY ?? 52) + Math.sin(u * 3) * 6, rr = -4 * Math.PI / 180;
    g.save(); poly(F.sil)(g); g.clip(); g.translate(sx, sy); g.rotate(rr); if (p.shadowStyle === 'side') planeShape(K, g, sc, { shadowOnly: true, col: 'rgba(20,35,61,0.38)' }); else planeTop(K, g, sc * 0.8, { shadow: `rgba(20,35,61,${p.shadowA ?? 0.35})` }); g.restore();
    const nx = sx + (p.shadowStyle === 'side' ? 148 : 123) * sc * Math.cos(rr) - (p.shadowStyle === 'side' ? 18 : 0) * sc * Math.sin(rr), ny = sy + (p.shadowStyle === 'side' ? 148 : 123) * sc * Math.sin(rr) + (p.shadowStyle === 'side' ? 18 : 0) * sc * Math.cos(rr);
    p.__shadowNose = [nx, ny];
    if (red === 'shadow' && nx > ox + 4 && nx < ox + 41 * k - 4) { redRing(g, nx, ny, 3.2 * k, P.red, 3.5); pen(g, circle(nx, ny, 0.6 * k), { fill: P.red, lw: 2, breaks: false, highlight: false }); } }
  // the plane hanging on its wire over the roof
  if (p.plane) { const pl0 = p.plane, pt = p.planeTo, u = pt ? M.E.inOutSine(range(t, num(pt.at, 0), num(pt.at, 0) + num(pt.dur, 2))) : 0;
    const lift = an(p, 'lift', t, 0, 0.5, M.E.inCubic ?? ((x) => x * x * x));
    const x = lerp(pl0.x ?? 1250, pt?.x ?? pl0.x ?? 1250, u), y = lerp(pl0.y ?? 240, pt?.y ?? pl0.y ?? 240, u) - lift * 700, sc = lerp(pl0.sc ?? 1, pt?.sc ?? pl0.sc ?? 1, u), rot = lerp(pl0.rot ?? -4, pt?.rot ?? pl0.rot ?? -4, u) + Math.sin(t * 1.3) * 1.2;
    let wt = null; if (p.winch) wt = winchArm(K, g, Math.min(1840, x + 210), 120, t, p.winchAt == null ? 1 : range(t, num(p.winchAt, 0), num(p.winchAt, 0) + 0.6));
    drawPlane(K, g, x, y, sc, rot, { red: red === 'nose', winch: wt ? [wt[0], wt[1]] : null }); }
  if (p.stamp) stampPlate(K, g, p.stamp, t);
  return { X, Y, k, ox, oy, cx };
}

// ---------------------------------------------------------------- the crowd view (L50): speech tabs over the parvis
function viewCrowd(K, g, t, p, red) {
  const { P, pen, rect, rrect, poly, facadeCard, plume, flame, backdrop, trees, redRing, mono } = K;
  backdrop(g, t, { sky: 'day', yH: 470, roofs: true, seed: 41 });
  const k = 4.6, ox = 960 - 20.5 * k, oy = 470, cx = 960;
  plume(g, cx + 4 * k, oy - 55 * k, t, { H: 70 * k, W: 8 * k, n: 9, drift: 0.4, seed: 12, depth: 0.4, sky: P.paper, base: P.card, shadeCol: P.ink40, lit: P.emberL, amount: 0.8, line: P.ink40 });
  for (let j = 0; j < 3; j++) flame(g, cx + (-3 + j * 3) * k, oy - 48.6 * k, 8 * k * (0.7 + 0.4 * hash(j)), 3.4 * k, t, 40 + j, { lean: 0.3 });
  facadeCard(g, ox, oy, k, { sky: 'day', fireS: new Array(14).fill(0), spire: 'gone', glow: 0, smoke: 1 }, t);
  trees(g, oy + 2, 40, ox - 20, { seed: 3, t, size: 34 }); trees(g, oy + 2, ox + 41 * k + 20, 1900, { seed: 5, t, size: 34 });
  // the parvis in perspective: kraft paving with converging joints
  pen(g, poly([[-60, oy], [1980, oy], [1980, 1140], [-60, 1140]]), { fill: P.kraft, lw: 2, breaks: false, highlight: false });
  g.save(); g.strokeStyle = rgba(P.ink40, 0.55); g.lineWidth = 1.2; g.beginPath(); for (let i = -14; i <= 14; i++) { g.moveTo(960 + i * 40, oy); g.lineTo(960 + i * 190, 1100); } for (let j = 1; j < 9; j++) { const yy = oy + (1100 - oy) * (j / 9) ** 1.5; g.moveTo(-60, yy); g.lineTo(1980, yy); } g.stroke(); g.restore();
  const tabs = an(p, 'tabs', t, 1), grow = an(p, 'grow', t, 0), r = M.rng(p.crowdSeed ?? 17), rows = p.rows ?? 9; let hero = null; const heroRow = p.heroRow ?? 6, heroCol = p.heroCol ?? 0.62;
  const items = [];
  for (let j = 0; j < rows; j++) { const v = j / (rows - 1), y = lerp(oy + 40, 1050, v ** 1.25), sc = lerp(0.55, 1.9, v) * (p.crowdSc ?? 1), gap = 40 * sc * (p.crowdGap ?? 1);
    for (let x = -20 + r() * gap; x < 1940; x += gap * (0.8 + r() * 0.5)) items.push({ x, y: y + (r() - 0.5) * 26 * sc, sc, j, ph: r(), tabOn: r(), lean: (r() - 0.5) * 8 }); }
  for (const it of items) if (it.j === heroRow && (!hero || Math.abs(it.x - heroCol * 1920) < Math.abs(hero.x - heroCol * 1920))) hero = it;
  for (const it of items) {
    tally(K, g, it.x, it.y, it.sc, { lean: it.lean + Math.sin(t * 1.5 + it.x * 0.02) * 2 });
    if (it.tabOn < tabs && it !== hero) { const s = it.sc, tx = it.x + 4 * s, ty = it.y - 44 * s, w = 22 * s, h = 14 * s, pop = M.E.outBack(clamp((tabs - it.tabOn) * 6));
      g.save(); g.translate(tx, ty); g.scale(pop, pop); pen(g, poly([[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w * 0.05, 0], [-w * 0.25, h * 0.45], [-w * 0.2, 0], [-w / 2, 0]]), { fill: P.card, lw: Math.max(1, 1.3 * s), breaks: false, highlight: false, mis: [1, 1] });
      planeGlyph(g, 0, -h / 2, s * 0.62, P.ink70); g.restore(); } }
  // the hero tab grows into a card
  if (hero) { const s = hero.sc * (p.heroSc ?? 1), u = M.E.inOutCubic(grow), w = lerp(22 * s, 470, u), h = lerp(14 * s, 250, u), tx = lerp(hero.x + 4 * s, 1430, u), ty = lerp(hero.y - 44 * s, 560, u);
    pen(g, poly([[tx - w / 2, ty - h], [tx + w / 2, ty - h], [tx + w / 2, ty], [tx - w * 0.02, ty], [lerp(hero.x, tx - w * 0.2, 0.15), hero.y - 40 * s], [tx - w * 0.2, ty], [tx - w / 2, ty]]), { fill: P.card, lw: lerp(1.3, 3, u), shadow: u > 0.1, breaks: false, highlight: false });
    const gt = p.growText ? M.E.outCubic(range(t, num(p.growTextAt, 1e9), num(p.growTextAt, 1e9) + 0.5)) : 0;
    planeGlyph(g, tx, ty - h / 2 - gt * h * 0.16, lerp(s * 0.62, 9, u) * (1 - 0.45 * gt), P.ink);
    if (gt > 0) { g.save(); g.globalAlpha *= gt; g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(tx - w / 2 + 34, ty - h * 0.36); g.lineTo(tx + w / 2 - 34, ty - h * 0.36); g.stroke();
      g.font = '600 40px "Archivo Narrow"'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(p.growText, tx, ty - h * 0.14); g.restore(); mono(g, p.growSub ?? 'RECREATED · TEXT ONLY', tx, ty - 16, 15, P.ink70, 'center'); }
    if (red === 'tab') { const rw = Math.max(w + 28, p.heroRing?.[0] ?? 120), rh = Math.max(h + 28, p.heroRing?.[1] ?? 92), rcx = tx, rcy = ty - h / 2; g.save(); g.strokeStyle = P.red; g.lineWidth = 3.5; g.setLineDash([10, 8]); g.beginPath(); g.roundRect(rcx - rw / 2, rcy - rh / 2, rw, rh, 10); g.stroke(); g.restore(); } }
}

// ---------------------------------------------------------------- the hills view (L52): wildfire, the water drop, the bank
function viewHills(K, g, t, p, red) {
  const { P, pen, poly, deckle, flame, plume, facadeCard, backdrop, halftone } = K;
  backdrop(g, t, { sky: 'day', yH: 700, roofs: false });
  const hill = (y0, amp, seed, col, shade) => { const pts = [[-100, 1200]]; for (let x = -100; x <= 2020; x += 40) pts.push([x, y0 - amp * (0.5 + 0.5 * Math.sin(x / 260 + seed) * Math.cos(x / 410 + seed * 2))]); pts.push([2020, 1200]);
    pen(g, poly(deckle(pts, seed * 9, 2, 16)), { fill: col, lw: 2.5, breaks: false, highlight: false, shade, shadeColor: P.sageD, box: [-100, y0 - amp, 2020, 1200] }); return pts; };
  hill(560, 130, 1.3, P.sageL, 0.15);
  // the small card cathedral on the far right horizon (where the plane banks to)
  const ck = p.cathK ?? 2.4, cox = (p.cathX ?? 1640) - 20.5 * ck, cTop = 592 - 69 * ck;
  plume(g, cox + 24.5 * ck, cTop + 20 * ck, t, { H: 70 * ck, W: 9 * ck, n: 7, drift: 0.55, seed: 21, depth: 0.65, sky: P.paper, base: P.card, shadeCol: P.ink40, amount: 0.7, line: P.ink40 }); // behind the card, never over it
  facadeCard(g, cox, 592, ck, { sky: 'day', fireS: new Array(14).fill(0), spire: 'gone', glow: 0, smoke: 1 }, t);
  const mid = hill(720, 110, 4.1, P.sage, 0.25);
  // the wildfire band along the mid ridge (brass paper flames + halftone smoke), knocked down under the drop
  const fly = an(p, 'fly', t, 1, 0.5, (x) => x), dropAt = num(p.dropAt, 1.0), hitT = dropAt + num(p.dropDur, 0.75), dous = range(t, hitT, hitT + 1.2);
  const yR = (x) => { let best = mid[1]; for (const q of mid) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q; return best[1]; };
  for (let i = 0; i < 12; i++) { const x = 330 + i * 62 + hash(i) * 20, y = yR(x) + 8, dR = p.douseR ?? 200, near = Math.abs(x - 720) < dR ? 1 - (p.douse ?? 0.75) * dous * (1 - 0.35 * (Math.abs(x - 720) / dR) ** 2) : 1;
    if (i % 3 === 0) plume(g, x, y - 30, t, { H: 260, W: 26, n: 6, drift: 0.5, seed: 30 + i, depth: 0.65, sky: P.paper, base: P.card, shadeCol: P.ink40, amount: 0.6 * near, line: P.ink40 });
    if (near > 0.06) flame(g, x, y, (60 + 40 * hash(i * 3)) * near, 46, t, 80 + i, { lean: 0.25 }); }
  if (p.steam && dous > 0) for (let i = 0; i < 6; i++) { const a = fract(t * 0.22 + i / 6), x = 720 + (i - 2.5) * 62 + Math.sin(a * 5 + i) * 18, y = yR(x) - 10 - a * 220, r = 30 + 50 * a; // steam off the doused ground: pale halftone wisps
    g.save(); g.globalAlpha = 0.75 * dous * clamp((1 - a) * 2.2) * clamp(a * 6); K.puff(g, x, y, r, 600 + i, { fill: '#f4f1e8', shadeCol: P.ink20 ?? P.ink40, line: P.ink40, lw: 1.5, shade: 0.25 }); g.restore(); }
  hill(900, 90, 7.7, mix2(P.sage, P.sageD), 0.35);
  // the plane: flies in from the left on its wire, drops, then banks toward the cathedral
  const bankAt = num(p.bankAt, 2.4), bank = M.E.inOutSine(range(t, bankAt, bankAt + num(p.bankDur, 1.6)));
  const x0 = lerp(-260, 760, M.E.outCubic ? M.E.outCubic(fly) : fly), x = lerp(x0, 1420, bank), y = lerp(330, p.bankY ?? 400, bank) + Math.sin(t * 1.2) * 6, sc = lerp(1.2, 0.55, bank) * (p.planeSc ?? 1), rot = lerp(-3, p.bankRot ?? -14, bank), ss = p.slabSc ?? 1;
  // the slab: leaves the tank door at dropAt, falls onto the band
  const fu = range(t, dropAt, hitT); if (t >= dropAt && fu < 1) slab(K, g, 720, lerp(y + 60 * ss, yR(720) - 30, fu * fu), 190 * ss, lerp(40, 70, fu) * ss, 7, 1);
  if (fu >= 1) { spray(K, g, 720, yR(720) - 20, 900, yR(900), t, range(t, hitT, hitT + 0.9), 4); if (ss > 1) spray(K, g, 720, yR(720) - 20, 540, yR(540), t, range(t, hitT, hitT + 0.9), 8); }
  drawPlane(K, g, x, y, sc, rot, { red: red === 'nose', bank: bank * (p.bankRoll ?? 0.6) });
}
function mix2(a, b) { const h = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const x = h(a), y = h(b); return '#' + x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, '0')).join(''); }

// ---------------------------------------------------------------- the flex view (L55): the demonstration
function viewFlex(K, g, t, p, red) {
  const { P, pen, rect, poly, mono, tag, sideCard, sideFire, fireSections, backdrop, redRing, rooftops } = K;
  backdrop(g, t, { sky: 'day', yH: 860, roofs: true, seed: 52 });
  const k = p.k ?? 6.9, ox = p.ox ?? 520, yG = 860, X = (m) => ox + m * k, Y = (m) => yG - m * k;
  const dropAt = num(p.dropAt, 0.6), hitT = dropAt + 0.7, flex = an(p, 'flex', t, 1, hitT), hx = X(p.hitX ?? 52);
  // neighbouring card houses (left of the west front, right of the apse)
  const houses = [[90, 330, 150], [300, 190, 120], [X(130) + 20, 200, 130], [X(130) + 250, 300, 160]];
  houses.forEach(([x0, w, h], i) => { const wet = clamp((flex - 0.3) / 0.5);
    pen(g, rect(x0, yG - h, w, h), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, shade: 0.25, shadeColor: P.kraftD, box: [x0, yG - h, x0 + w, yG] });
    pen(g, poly([[x0 - 8, yG - h], [x0 + w / 2, yG - h - 50], [x0 + w + 8, yG - h]]), { fill: '#9aa3b3', lw: 2.5, breaks: false, highlight: false });
    for (let r = 0; r < Math.floor(h / 50); r++) for (let c = 0; c < Math.floor(w / 45); c++) pen(g, rect(x0 + 14 + c * 45, yG - h + 18 + r * 50, 18, 26), { fill: P.ink70, lw: 1.5, breaks: false, highlight: false });
    if (wet > 0) { g.save(); g.globalAlpha = wet; g.fillStyle = rgba(P.teal, 0.35); g.fillRect(x0, yG - h - 10, w, 40); g.restore(); } });
  const st = { sky: 'day', fireS: fireSections(p.fire ?? 0.45), roofGone: 0, spire: 'gone', spireU: 0, glow: 0, wind: 0.35, smoke: 0.8, glowWin: false };
  sideFire(g, X, Y, k, st, t, true);
  g.save(); // the card bows under the load: a slight vertical squash centred on the hit (paper flexing, not a cutaway)
  sideCard(g, ox, yG, k, st, t); g.restore();
  sideFire(g, X, Y, k, st, t, false);
  // the flex line: the roof ridge sagging under the slab (dashed), walls bowing (arrows), cracks
  if (flex > 0) { const sag = flex * 6 * k, col = red === 'flex' ? P.red : P.ink;
    // the water's weight lies on the roof: a teal sheet spread along the ridge, sagging with it
    g.save(); g.globalAlpha = clamp(flex * 2); g.beginPath(); g.moveTo(hx - 26 * k, Y(43) - 0.5 * k); g.quadraticCurveTo(hx, Y(43) + sag * 2 - 2.2 * k, hx + 26 * k, Y(43) - 0.5 * k); g.quadraticCurveTo(hx, Y(43) + sag * 2 + 1.2 * k, hx - 26 * k, Y(43) - 0.5 * k); g.fillStyle = P.teal; g.fill(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.stroke(); g.restore();
    g.save(); g.strokeStyle = col; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(X(14), Y(43)); g.quadraticCurveTo(hx, Y(43) + sag * 2, X(116), Y(43)); g.stroke(); g.restore();
    // load arrows pressing down, walls pushed outward
    g.save(); g.strokeStyle = P.ink; g.fillStyle = P.ink; g.lineWidth = 4; g.lineCap = 'round';
    for (const dx of [-14, 0, 14]) { const ax = hx + dx * k, ay0 = Y(62), ay1 = Y(49) + sag * (1 - Math.abs(dx) / 30); g.globalAlpha = clamp(flex * 3); g.beginPath(); g.moveTo(ax, ay0); g.lineTo(ax, ay1); g.stroke(); g.beginPath(); g.moveTo(ax - 9, ay1 - 12); g.lineTo(ax, ay1); g.lineTo(ax + 9, ay1 - 12); g.fill(); }
    for (const sx of [-1, 1]) { const ax = sx < 0 ? X(14) - 1.5 * k : X(116) + 1.5 * k, ay = Y(24), L = (p.arrowLen ?? 7) * k * flex; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + sx * L, ay); g.stroke(); g.beginPath(); g.moveTo(ax + sx * L - sx * 13, ay - 10); g.lineTo(ax + sx * L, ay); g.lineTo(ax + sx * L - sx * 13, ay + 10); g.fill(); } g.restore();
    if (flex > 0.5) { g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); let xx = hx - 2 * k, yy = Y(34); g.moveTo(xx, yy); for (let j = 0; j < 5; j++) { xx += (hash(j) - 0.5) * 22; yy += 14; g.lineTo(xx, yy); } g.stroke(); g.restore(); }
    if (red === 'flex') redRing(g, hx, Y(43) + sag, 26, P.red, 3); }
  // the plane on its wire above the roof, and the slab
  const px = hx - 40, py = 170 + Math.sin(t * 1.2) * 5;
  const fu = range(t, dropAt, hitT); if (t >= dropAt && fu < 1) slab(K, g, hx, lerp(py + 70, Y(43) - 20, fu * fu), 240, lerp(40, 80, fu), 11, 1);
  if (p.sprayAt != null) { // sprayAt: on the word, teal arcs leave the roof and land on all four neighbouring houses; wet splats stay
    const sa = num(p.sprayAt, hitT), su = range(t, sa, sa + 1.3);
    houses.forEach(([x0, w, h], i) => { const tx = x0 + w / 2, ty = yG - h - 10; for (let j = 0; j < 2; j++) spray(K, g, hx + (j - 0.5) * 40, Y(44), tx + (j - 0.5) * w * 0.4, ty + j * 30, t, su, 21 + i * 7 + j * 3);
      const wv = clamp((t - sa - 0.7) / 0.5); if (wv > 0) { g.save(); g.globalAlpha = wv; for (let q = 0; q < 7; q++) { const sx = x0 + w * (0.1 + 0.8 * hash(i * 13 + q)), sy = yG - h - 30 + 50 * hash(i * 7 + q * 3), r = 7 + 8 * hash(q + i);
        K.pen(g, K.circle(sx, sy, r), { fill: q % 2 ? P.teal : P.tealL, lw: 1.5, breaks: false, highlight: false }); } g.restore(); } }); }
  if (fu >= 1) { const su = range(t, hitT, hitT + 1.4); if (p.sprayAt == null) { spray(K, g, hx, Y(43), houses[1][0] + 60, yG - houses[1][2] - 20, t, su, 3); spray(K, g, hx, Y(43), houses[2][0] + 60, yG - houses[2][2] - 20, t, su, 9); }
    g.save(); g.globalAlpha = 1 - clamp((t - hitT) / 1.2); slab(K, g, hx, Y(43) - 10, 300, 30, 13, 1); g.restore(); }
  drawPlane(K, g, px, py, 0.95, -3, { red: red === 'nose' });
}


// ---------------------------------------------------------------- the plan view (L56): top-down on the parvis, the plane climbs out of the top of frame
// The roof seen from above (never a section): slate nave + transept intact at the crossing (fact lock: no hole there), the
// two tower tops at the bottom (west), the sage square below them; the hose runs diagonally from bottom-left to the central
// portal (hose 0..1 +hoseAt/hoseDur); plane {x, y, sc} climbs off the top (lift 0..1 +liftAt/liftDur), its shadow on the roof.
function viewPlan(K, g, t, p, red) {
  const { P, pen, rect, poly, circle, halftone, flame, puff, hoseLine, nozzle, redRing } = K;
  const CX = p.cx ?? 1060, WF = p.wf ?? 700, fire = an(p, 'fire', t, 0.8);
  g.fillStyle = P.kraft; g.fillRect(-300, -300, 2520, 1680);                                                       // the island streets
  pen(g, rect(-300, -300, 520, 1680), { fill: P.tealL, lw: 2.5, breaks: false, highlight: false });                // the Seine (left arm)
  g.save(); g.strokeStyle = P.teal; g.lineWidth = 2; const rr = M.rng(7); for (let i = 0; i < 26; i++) { const x = -260 + rr() * 440, y = -280 + rr() * 1600, w = 30 + rr() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + w); g.stroke(); } g.restore();
  // the square (the same sage paving as the next shot)
  pen(g, rect(220, WF + 12, 2100, 900), { fill: P.sageL, lw: 2.5, breaks: false, highlight: false });
  g.save(); g.strokeStyle = rgba(P.sageD, 0.5); g.lineWidth = 1.4; g.beginPath(); for (let x = 220; x < 2320; x += 48) { g.moveTo(x, WF + 12); g.lineTo(x, WF + 912); } for (let y = WF + 12; y < WF + 912; y += 48) { g.moveTo(220, y); g.lineTo(2320, y); } g.stroke(); g.restore();
  // the cloister gardens + trees beside the nave (top-view sage discs)
  for (const [x0, x1] of [[CX - 520, CX - 260], [CX + 260, CX + 560]]) pen(g, rect(x0, -300, x1 - x0, WF - 40 + 300), { fill: mix2(P.sageL, P.sage), lw: 2, breaks: false, highlight: false });
  const tr = M.rng(9); for (let i = 0; i < 22; i++) { const side = i % 2 ? 1 : -1, x = CX + side * (300 + tr() * 200), y = -260 + (i >> 1) * 88 + tr() * 30, r = 34 + tr() * 14;
    pen(g, circle(x + 8, y + 10, r), { fill: 'rgba(20,35,61,0.14)', line: null, breaks: false, highlight: false }); pen(g, circle(x, y, r), { fill: P.sage, lw: 2, breaks: false, highlight: false, shade: 0.35, shadeColor: P.sageD, box: [x - r, y - r, x + r, y + r] }); }
  // the roof plan: aisles, nave, transept (intact at the crossing), the two tower tops and the gallery between them
  const roof = '#9aa3b3', shadeR = (x0, y0, x1, y1) => ({ shade: 0.3, shadeColor: P.ink40, box: [x0, y0, x1, y1] });
  g.save(); g.fillStyle = 'rgba(11,20,38,0.16)'; g.fillRect(CX - 200 + 22, -300, 400, WF + 300 + 24); g.fillRect(CX - 360 + 22, 120 + 24, 720, 120); g.restore(); // the hard cast shadow
  for (const sx of [-1, 1]) { const x0 = sx < 0 ? CX - 200 : CX + 120; pen(g, rect(x0, -300, 80, WF - 170 + 300), { fill: mix2(roof, P.card), lw: 2, breaks: false, highlight: false, ...shadeR(x0, -300, x0 + 80, WF - 170) }); }
  pen(g, rect(CX - 360, 120, 720, 120), { fill: roof, lw: 2.5, breaks: false, highlight: false, ...shadeR(CX - 360, 120, CX + 360, 240) });
  pen(g, rect(CX - 120, -300, 240, WF - 140 + 300), { fill: roof, lw: 2.5, breaks: false, highlight: false, ...shadeR(CX - 120, -300, CX + 120, WF - 140) });
  g.save(); g.strokeStyle = P.ink70; g.lineWidth = 2; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(CX, -300); g.lineTo(CX, WF - 140); g.moveTo(CX - 360, 180); g.lineTo(CX + 360, 180); g.stroke(); g.restore(); // ridges
  for (const sx of [-1, 1]) { const x0 = sx < 0 ? CX - 230 : CX + 50; pen(g, rect(x0, WF - 180, 180, 180), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false, ...shadeR(x0, WF - 180, x0 + 180, WF) });
    pen(g, rect(x0 + 26, WF - 154, 128, 128), { fill: P.kraft, lw: 2, breaks: false, highlight: false }); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) pen(g, circle(x0 + 12 + a * 156, WF - 168 + b * 156, 7), { fill: P.card, lw: 1.5, breaks: false, highlight: false }); }
  pen(g, rect(CX - 50, WF - 150, 100, 150), { fill: P.card, lw: 2.5, breaks: false, highlight: false, ...shadeR(CX - 50, WF - 150, CX + 50, WF) });
  for (const dx of [-140, 0, 140]) pen(g, rect(CX + dx - 22, WF - 4, 44, 10), { fill: P.ink70, lw: 1.5, breaks: false, highlight: false }); // the three portals
  // the fire on the roof (brass paper flames standing on the nave + transept), smoke drifting east (up the frame)
  if (fire > 0.05) { for (let i = 0; i < 9; i++) { const y = 500 - i * 70 + hash(i) * 20, x = CX + (hash(i * 3) - 0.5) * 120; flame(g, x, y, (50 + 50 * hash(i * 5)) * fire, 40, t, 120 + i, { lean: 0.2 }); }
    for (let i = 0; i < 5; i++) { const a = fract(t * 0.08 + i / 5), x = CX + 60 + Math.sin(i * 2 + a * 3) * 80 + a * 160, y = 420 - a * 700, r = 70 + a * 60;
      g.save(); g.globalAlpha *= 0.85 * fire * clamp((1 - a) * 2.5) * clamp(a * 6); puff(g, x, y, r, 700 + i, { fill: P.card, shadeCol: P.ink40, line: P.ink40, lw: 2, shade: 0.4 }); g.restore(); } }
  // the hose: one teal line from the bottom-left corner across the square to the central portal
  let nz = null;
  if (p.hose != null) { const u = an(p, 'hose', t, 1), pts = p.hosePts ?? [[-60, 1180], [380, 1040], [760, 900], [CX - 60, 780], [CX, WF + 22]];
    const Ls = []; let tot = 0; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); Ls.push(tot); }
    const d = tot * clamp(u), part = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (Ls[i - 1] <= d) part.push(pts[i]); else { const s0 = i > 1 ? Ls[i - 2] : 0, f = (d - s0) / (Ls[i - 1] - s0); part.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } }
    if (part.length > 1) { hoseLine(g, part, 16, { couplings: part.length > 3 ? [2] : [], flow: 1, t }); const a = part.at(-1), b = part.at(-2), ang = Math.atan2(a[1] - b[1], a[0] - b[0]); nozzle(g, a[0], a[1], ang, 52, 14); nz = [a[0] + Math.cos(ang) * 32, a[1] + Math.sin(ang) * 32]; } }
  if (red === 'nozzle' && nz) { pen(g, circle(nz[0], nz[1], 8), { fill: P.red, lw: 2, breaks: false, highlight: false }); redRing(g, nz[0], nz[1], 30, P.red, 3); }
  // the plane, seen from above, climbing out of the top of frame (its shadow stays on the roof and slides off with it)
  if (p.plane) { const pl = p.plane, lift = an(p, 'lift', t, 0, 0.5, M.E.inCubic ?? ((x) => x * x * x)), x = pl.x ?? CX, y = (pl.y ?? 380) - lift * (pl.liftPx ?? 1100), sc = (pl.sc ?? 1) * (1 + 0.45 * lift), rot = (pl.rot ?? -90) * Math.PI / 180;
    g.save(); g.translate(x + 70 + lift * 160, y + 110 + lift * 520); g.rotate(rot); planeTop(K, g, sc * 0.9, { shadow: 'rgba(20,35,61,0.3)' }); g.restore();
    g.save(); g.translate(x, y); g.rotate(rot); planeTop(K, g, sc, { red: red === 'nose' }); g.restore(); pen(g, circle(x, y, 6), { fill: P.brass, lw: 1.5, breaks: false, highlight: false }); }
}

// ---------------------------------------------------------------- the set
export async function airdrop(ctx, shot) {
  const K = KIT, p = shot.params ?? {}, L0 = K.canvasLayer(ctx), view = p.view ?? 'facade', sky = p.sky ?? 'day';
  return { scene: null, camera: null, layer: L0.layer, canvas: L0.cv, update(t) {
    const { g, s } = L0; K.smokeFor(p, shot); g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 1920, 1080);
    g.fillStyle = K.P.paper; g.fillRect(0, 0, 1920, 1080);
    const red = redAt(p, t, view === 'crowd' ? 'tab' : view === 'facade' ? 'gap' : 'nose');
    K.applyCam(g, s, K.camAt(p, t), t);
    if (view === 'crowd') viewCrowd(K, g, t, p, red); else if (view === 'hills') viewHills(K, g, t, p, red); else if (view === 'flex') viewFlex(K, g, t, p, red); else if (view === 'plan') viewPlan(K, g, t, p, red); else viewFacade(K, g, t, p, red, sky);
    if (p.tags) for (const tg of p.tags) if ((tg.inAt == null || t >= num(tg.inAt, 0)) && (tg.outAt == null || t < num(tg.outAt, 1e9))) K.tag(g, ...(tg.anchor === 'shadow' ? (p.__shadowNose ?? [960, 540]) : tg.at), ...tg.to, tg.text, { size: tg.size ?? 28, swing: tg.swing ?? 0, sub: tg.sub, night: sky !== 'day' });
    g.setTransform(s, 0, 0, s, 0, 0);
    if (p.clock) K.counterBadge(g, 96, 72, p.clock, { t, night: sky !== 'day' });
    if (p.kicker) K.mono(g, p.kicker, p.clock ? 380 : 96, 92, 24, K.P.ink70);
    if (p.strip) lowerStrip(K, g, p.strip, t, num(p.stripAt, 0), { redWord: red === 'strip' ? p.stripRed : null, big: p.stripBig ?? 1, until: p.stripOutAt == null ? null : num(p.stripOutAt, 1e9) });
    if (p.chips) chipStack(K, g, p.chips, t);
    K.fibre(g, 0.09);
    K.sourceSlip(g, p.source ?? 'ILLUSTRATION · PAPER MODEL · NOT TO SCALE');
  } };
}
export default airdrop;

// ================================================================= bellFrame extras (additive, ch3 L60-L67), called by nd-sets bellFrame
// (single-tower layout only for the world-space pieces). Nothing draws unless its param is set:
//   towerFlame 0..1 (+At/Dur)   brass flame cards on the tower's own wall card BELOW the bell frame (the frame stays unlit)
//   frameSmoke 0..1 (+At/Dur)   ink-40 halftone smoke rising out of the (unlit) oak frame
//   loop 'flame'|'bell'|'beam'|'none' (+ loopSeq [{to, at}]): the red marker loop, sliding 0.6 s between targets, a pencil
//                               at its leading edge (loopBell: which bell, default 2)
//   smokeCard 0..1 (+At/Dur)    an ink-40 halftone smoke card slides in between camera and frame (beams read as silhouettes)
//   bellOutline true            a red dashed outline of bell `loopBell` drawn over the smoke card (the one red thing)
//   tally { at, x }             a single teal tally at the toy's foot, looking up
//   rangeBar { at, lo, hi }     a brass scale card (screen space): ≈ 0.78 t ... just over 4 t, the red tick at the top end
//   chips [{text, sub, at}]     paper chips top-right (screen) · lowStrip [line, line2] (+lowStripAt): a lower-third strip
function bellGeom(box, i, order) {
  const { bx0: x0, by0: y0, bx1: x1, by1: y1 } = box, W = x1 - x0, H = y1 - y0, px = W / 13.5;
  const posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(v => x0 + W * v), kg = [4162, 3477, 2502, 1925, 1494, 1309, 1011, 782][i];
  const hy = i < 4 ? y0 + H * 0.52 : y0 + H * 0.06, j = order === 'asc' ? 3 - (i % 4) : i % 4, cx = (posts[j] + posts[j + 1]) / 2, d = 1.85 * Math.cbrt(kg / 4162) * px * 1.3, ty = hy + 0.55 * px;
  return { cx, ty, d, cy: ty + d * 0.42, sill: y1 - H * 0.07, x0, x1, y0, y1, W, H, px };
}
export function bellExtrasWorld(g, t, p, box, { night = false } = {}) {
  const K = KIT, { P, pen, poly, rect, circle, flame, plume, puff, halftone, bell, deckle } = K; if (!box) return;
  const bi = p.loopBell ?? 2, B = bellGeom(box, bi, p.bellOrder);
  const tf = an(p, 'towerFlame', t, 0), fs = an(p, 'frameSmoke', t, 0);
  if (fs > 0) { // smoke out of the unlit frame: puffs rising from the beams, then a column out of the belfry top
    g.save(); g.beginPath(); g.rect(B.x0, B.y0, B.W, B.H); g.clip();
    // a thin halftone haze under the top beam, and wisps curling off the timbers (behind nothing: drawn over the frame, kept to the top third)
    halftone(g, [B.x0, B.y0, B.x1, B.y0 + B.H * 0.45], (xx, yy) => clamp(0.55 * fs * (1 - (yy - B.y0) / (B.H * 0.45))), P.ink40, { pitch: 10 });
    g.restore();
    if (p.wisps !== false) for (let i = 0; i < 7; i++) { const a = fract(t * 0.16 + i / 7), x = B.x0 + B.W * (0.08 + 0.84 * (i + 0.5) / 7) + Math.sin(a * 4 + i) * 26, y = B.y0 + B.H * 0.12 - a * 340, r = (22 + 60 * a) * (0.5 + 0.5 * fs);
      g.save(); g.globalAlpha = 0.42 * fs * clamp((1 - a) * 2.5) * clamp(a * 5); halftone(g, [x - r * 1.6, y - r, x + r * 1.6, y + r], (xx, yy) => clamp(1 - Math.hypot((xx - x) / 1.6, yy - y) / r), P.ink40, { pitch: 9 }); g.restore(); }
    plume(g, (B.x0 + B.x1) / 2 + 60, B.y0 - 30, t, { H: 360, W: 60, n: 8, drift: 0.45, seed: 61, depth: 0.25, sky: night ? '#45547a' : P.paper, base: mix3(P.ink40, P.card, 0.4), shadeCol: P.ink70, amount: fs, line: P.ink70 }); }
  if (tf > 0) { // the tower's own wall card below the frame: a louvre section with flame cards standing on its sill
    const wy0 = B.y1 + 24, wy1 = B.y1 + (p.wallH ?? 196), wx0 = B.x0 + 30, wx1 = B.x1 - 30;
    pen(g, rect(wx0, wy0, wx1 - wx0, wy1 - wy0), { fill: night ? '#a99e8b' : P.kraft, lw: 2.5, breaks: false, highlight: false, shade: 0.3, shadeColor: night ? '#7f7869' : P.kraftD, box: [wx0, wy0, wx1, wy1] });
    g.save(); g.strokeStyle = P.ink40; g.lineWidth = 2; g.beginPath(); for (let yy = wy0 + 16; yy < wy1; yy += 16) { g.moveTo(wx0 + 10, yy); g.lineTo(wx1 - 10, yy + 5); } g.stroke(); g.restore();
    for (let i = 0; i < 5; i++) { const x = lerp(wx0 + 70, wx1 - 70, i / 4) + (hash(i + 3) - 0.5) * 30; flame(g, x, wy1 - 4, (110 + 70 * hash(i * 7)) * tf, 76, t, 150 + i, { lean: 0.2 }); }
    p.__flameAt = [(wx0 + wx1) / 2, wy1 - 80 * tf, (wx1 - wx0) / 2 + 30, 110 * tf + 30]; }
  const sc = an(p, 'smokeCard', t, 0);
  if (sc > 0) { const off = (1 - M.E.outCubic(sc)) * 1700, r = M.rng(91);
    // the smoke card: one cut-paper bank of overlapping puffs sliding in from the right, printed ink-40 with a halftone
    // drawn as ONE merged silhouette on a scratch canvas (outline only around the outside, an even halftone inside), then laid
    // over the frame at smokeCardA: no per-puff outlines (they read as bubble wrap)
    const circ = []; for (let i = 0; i < 16; i++) { const x = box.bx0 - 120 + (i % 4) * 300 + r() * 80 + off, y = box.by0 - 40 + Math.floor(i / 4) * 230 + r() * 60, rr = 150 + r() * 70;
      circ.push([x, y, rr]); const r2 = M.rng(900 + i); for (let j = 0; j < 4; j++) { const a = r2() * Math.PI * 2, d = rr * (0.5 + r2() * 0.35); circ.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, rr * (0.4 + r2() * 0.3)]); } }
    const cv = g.canvas, W0 = cv.width, H0 = cv.height; SCR ??= document.createElement('canvas'); if (SCR.width !== W0 || SCR.height !== H0) { SCR.width = W0; SCR.height = H0; }
    const q = SCR.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W0, H0); q.setTransform(g.getTransform());
    // one opaque fill per circle (a single many-subpath fill rasterised with holes on the GPU path): the union grown 3 px in ink-70
    // (the outline), then the union in smoke grey on top, then the halftone laid on only where the card is (source-atop)
    const core = [box.bx0 - 100 + off, box.by0 - 20, 980, 720]; // the bank's solid core (no see-through gaps between puffs)
    const fillAll = (d, col) => { q.fillStyle = col; q.beginPath(); q.rect(core[0] - d, core[1] - d, core[2] + 2 * d, core[3] + 2 * d); q.fill(); for (const [x, y, rr] of circ) { q.beginPath(); q.arc(x, y, rr + d, 0, Math.PI * 2); q.fill(); } };
    fillAll(3, P.ink70); fillAll(0, mix3(P.ink40, P.card, 0.25));
    q.save(); q.globalCompositeOperation = 'source-atop'; const bb = [box.bx0 - 500 + off, box.by0 - 400, box.bx1 + 700 + off, box.by1 + 500]; halftone(q, bb, 0.22, P.ink70, { pitch: 12 }); q.restore();
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = p.smokeCardA ?? 0.93; g.drawImage(SCR, 0, 0); g.restore();
    // the frame's beams as silhouettes through it
    const a = p.smokeSil === false ? 0 : 0.75 * clamp(sc * 2 - 0.8);
    if (a > 0) { g.save(); g.globalAlpha = a; g.strokeStyle = P.ink70; g.lineCap = 'round'; g.lineWidth = 0.32 * B.px; g.beginPath();
      for (const yy of [B.sill, B.y0 + B.H * 0.52, B.y0 + B.H * 0.06]) { g.moveTo(B.x0, yy); g.lineTo(B.x1, yy); }
      const posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(v => B.x0 + B.W * v); for (const x of posts) { g.moveTo(x, B.y0 + 4); g.lineTo(x, B.sill); }
      g.lineWidth = 0.16 * B.px; for (let i = 0; i < 4; i++) { const a0 = posts[i], b0 = posts[i + 1]; g.moveTo(a0, B.y0 + B.H * 0.47); g.lineTo(b0, B.y0 + B.H * 0.1); g.moveTo(b0, B.y0 + B.H * 0.47); g.lineTo(a0, B.y0 + B.H * 0.1); }
      g.stroke(); g.restore(); } }
  if (p.tally) { const tl = p.tally, u = M.E.outCubic(range(t, num(tl.at, 0.5), num(tl.at, 0.5) + 0.6)), x = tl.x ?? 380, y0 = tl.ledge ? B.y1 + 22 : (tl.y ?? 1062), y = y0 + (1 - u) * 160;
    if (tl.ledge) pen(g, rect(B.x0 - 10, B.y1 + 4, B.W + 20, 20), { fill: night ? '#a99e8b' : P.card, lw: 2.5, breaks: false, highlight: false }); // the ledge under the frame
    else if (tl.table !== false) pen(g, rect(-300, y0, (tl.tableTo ?? box.bx0) + 300, 400), { fill: night ? '#6d6156' : P.kraft, lw: 2.5, breaks: false, highlight: false }); // the table the toy stands on
    if (tl.ledge) { g.save(); g.beginPath(); g.rect(B.x0 - 400, B.y0 - 400, B.W + 800, B.y1 + 24 - B.y0 + 400); g.clip(); }
    g.save(); g.translate(x, y); g.rotate((tl.tilt ?? 0) * Math.PI / 180); g.scale(tl.sc ?? 2.6, tl.sc ?? 2.6); pen(g, K.pill(0, -17, 12, 34), { fill: P.card, line: P.teal, lw: 3, breaks: false, highlight: false, mis: [2, 1.5] }); g.fillStyle = P.teal; g.beginPath(); g.arc(2.4, -30, 3.4, 0, Math.PI * 2); g.fill(); g.restore(); if (tl.ledge) g.restore(); }
  if (p.bellOutline) { const bo = typeof p.bellOutline === 'object' ? p.bellOutline : {}, s2 = bo.sc ?? 1; g.save(); g.strokeStyle = P.red; g.lineWidth = (bo.lw ?? 3.5) / s2; if (!bo.solid) g.setLineDash([10 / s2, 7 / s2]);
    g.translate(B.cx, B.cy); g.scale(s2, s2); g.translate(-B.cx, -B.cy); K.bellPath(B.cx, B.ty, B.d)(g); g.stroke(); g.restore(); }
  // the red marker loop, sliding between targets
  let to = p.loop ?? null, from = to, t0 = num(p.loopAt, 0); if (p.loopSeq) for (const q of p.loopSeq) if (t >= num(q.at, 0)) { from = to; to = q.to; t0 = num(q.at, 0); }
  if (to && to !== 'none') { const at = (k) => k === 'bell' ? [B.cx, B.cy, B.d * 0.72, B.d * 0.62] : k === 'beam' ? [(B.x0 + B.x1) / 2, B.sill, B.W * (p.loopBeamRx ?? 0.55), 0.9 * B.px] : (p.__flameAt ?? [960, 1000, 400, 120]);
    const u = M.E.inOutCubic(range(t, t0, t0 + (p.loopSlide ?? 0.6))), A = at(from && from !== 'none' ? from : to), Bq = at(to), q = A.map((v, i) => lerp(v, Bq[i], u)), draw = from == null || from === 'none' || from === to ? clamp((t - t0) / 0.5) : 1;
    if (draw > 0) { g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); const a0 = -2.2, a1 = a0 + Math.PI * 2.15 * draw; for (let a = a0; a <= a1; a += 0.05) { const wob = 1 + 0.04 * Math.sin(a * 3 + 1), x = q[0] + Math.cos(a) * q[2] * wob, y = q[1] + Math.sin(a) * q[3] * wob; a === a0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.restore();
      if (p.pencil !== false && (draw < 1 || u < 1 || p.pencilHold)) { const a = a0 + Math.PI * 2.15 * draw, x = q[0] + Math.cos(a) * q[2], y = q[1] + Math.sin(a) * q[3];
        g.save(); g.translate(x, y); g.rotate(-0.75); pen(g, poly([[0, 0], [16, -8], [150, -8], [150, 8], [16, 8]]), { fill: P.brassL, lw: 2, shadow: true, breaks: false, highlight: false }); g.fillStyle = P.ink; g.beginPath(); g.moveTo(0, 0); g.lineTo(8, -4); g.lineTo(8, 4); g.fill(); g.restore(); } } }
  delete p.__flameAt;
}
let SCR = null; // scratch canvas for the merged smoke card
function mix3(a, b, u) { const h = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const x = h(a), y = h(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, '0')).join(''); }
export function bellExtrasScreen(g, t, p) {
  const K = KIT, { P, pen, rect, rrect, mono, bell, redRing } = K;
  if (p.rangeBar) { const rb = p.rangeBar, u = M.E.outCubic(range(t, num(rb.at, 0.5), num(rb.at, 0.5) + 0.5)); if (u > 0) {
    const W = 1040, H = rb.H ?? 190, x = 960 - W / 2, y = (rb.y ?? 790) + (1 - u) * 300, rs = rb.sc ?? 1; g.save(); g.translate(960, y + H); g.scale(rs, rs); g.translate(-960, -(y + H));
    pen(g, rrect(x, y, W, H, 8), { fill: P.card, lw: 2.5, shadow: true, breaks: false, highlight: false });
    pen(g, rect(x + 60, y + 108, W - 120, 16), { fill: P.brassL, lw: 2, breaks: false, highlight: false, shade: 0.3, shadeColor: P.brass, box: [x + 60, y + 108, x + W - 60, y + 124] });
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 40; i++) { const xx = x + 60 + (W - 120) * i / 40; g.moveTo(xx, y + 108); g.lineTo(xx, y + 108 - (i % 5 ? 6 : 12)); } g.stroke(); g.restore();
    const lo = x + 60 + (W - 120) * (0.78 / 4.3), hi = x + 60 + (W - 120) * (4.1 / 4.3);
    bell(g, lo, y + 58, 38, { lw: 2 }); bell(g, hi, y + 40, 60, { lw: 2 });
    const ly = rb.labelY ?? 160, ls = rb.labelSize ?? 21; mono(g, rb.lo ?? '≈ 0.78 T', lo, y + ly, ls, P.ink, 'center', 600); mono(g, rb.hi ?? 'JUST OVER 4 T', hi - (rb.hiDx ?? 70), y + ly, ls, P.ink, 'center', 600);
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(lo, y + 100); g.lineTo(lo, y + 130); g.stroke(); g.restore();
    const ru = range(t, num(rb.at, 0.5) + 0.6, num(rb.at, 0.5) + 1.0); if (ru > 0 && rb.red !== false) { g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.beginPath(); g.moveTo(hi, y + (rb.tick?.[0] ?? 96)); g.lineTo(hi, y + (rb.tick?.[1] ?? 134)); g.stroke(); g.restore(); redRing(g, hi, y + (rb.ringY ?? 116), (rb.ringR ?? 26) * ru + 4, P.red, 3); }
    mono(g, rb.kicker ?? '8 BELLS · THE NORTH TOWER', x + 30, y + 30, rb.kickerSize ?? 17, P.ink70); if (rb.note) mono(g, rb.note, x + W - 30, y + 30, 15, P.ink70, 'right'); g.restore(); } }
  if (p.lowStrip) lowerStrip(K, g, p.lowStrip, t, num(p.lowStripAt, 0), { big: p.lowStripBig ?? 1, until: p.lowStripOutAt == null ? null : num(p.lowStripOutAt, 1e9) });
  if (p.chips) chipStack(K, g, p.chips, t);
}
