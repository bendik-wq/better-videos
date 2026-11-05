// Building blocks for the "launch" style (render.mjs --full --launch), after 2026 startup launch videos (TypeSafe,
// Pine, Fish Audio, Koji). Measured with HyperFrames' `measure frames`: TypeSafe types a headline letter by letter on
// the spoken words, each new letter in the accent colour for ~2 frames before it turns white; Pine wipes white label
// tabs in and draws thin connector lines. Every helper takes beat-relative seconds and frame-pixel positions.
const pos = ({ x, y, w, r, b } = {}) => [x != null && `left:${x}px`, y != null && `top:${y}px`, w != null && `width:${w}px`,
  r != null && `right:${r}px`, b != null && `bottom:${b}px`].filter(Boolean).join(';');
const P = (d, at, dur = 0.5, cls = '') => `<path ${cls ? `class="${cls}" ` : ''}data-draw data-d="${at}" data-dur="${dur}" d="${d}"/>`;

// typed text. words: [[text, at], ...] (at = when that word is spoken). <k>…</k> inside a word makes it gold.
// Letters of a word are spread over `step` s each, the way TypeSafe's type keeps pace with speech.
export const typed = (words, o = {}, step = 0.035) => {
  const html = words.map(([w, at]) => {
    let i = 0;
    const chars = w.replace(/<k>(.*?)<\/k>/g, '\u0001$1\u0002');
    let gold = false, out = '';
    for (const ch of chars) {
      if (ch === '\u0001') { gold = true; continue; }
      if (ch === '\u0002') { gold = false; continue; }
      out += `<i data-fx="type" data-d="${(at + i++ * step).toFixed(3)}"${gold ? ' class="k"' : ''}>${ch}</i>`;
    }
    return `<span class="wd">${out}</span>`;
  }).join(' ');
  return `<div class="ty${o.dark ? ' dark' : ''}" style="${pos(o)};${o.size ? `font-size:${o.size}px;` : ''}${o.align ? `text-align:${o.align};` : ''}${o.css || ''}">${html}</div>`;
};
// white label tab that wipes in (gold: true for the accent version, ghost: true for a dark glass one)
export const tab = (text, at, o = {}) =>
  `<div class="tab${o.gold ? ' g' : ''}${o.ghost ? ' ghost' : ''}" data-fx="wipe" data-d="${at}" style="${pos(o)};${o.size ? `font-size:${o.size}px;` : ''}">${text}</div>`;
export const mono = (text, at, o = {}) => `<div class="mono${o.dark ? ' dark' : ''}" data-fx="wipe" data-dur="0.5" data-d="${at}" style="${pos(o)}">${text}</div>`;
// thin outline box drawn around typed words
export const obox = (inner, at, o = {}) =>
  `<div class="obox${o.dark ? ' dark' : ''}" style="${pos(o)}">${inner}<div class="ob${o.gold ? ' g' : ''}" data-fx="wipe" data-dur="0.4" data-d="${at}"></div></div>`;
// four corner brackets around a box (the "viewfinder" frame)
export const brackets = (at, { x, y, w, h, s = 46, gold = false, dark = false }) => {
  const c = gold ? 'g' : '';
  const d = [`M0 ${s} V0 H${s}`, `M${w - s} 0 H${w} V${s}`, `M${w} ${h - s} V${h} H${w - s}`, `M${s} ${h} H0 V${h - s}`];
  return `<svg class="ln brk${dark ? ' dark' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" viewBox="0 0 ${w} ${h}">${d.map((p, i) => P(p, at + i * 0.04, 0.3, c)).join('')}</svg>`;
};
// a connector line in frame pixels (any SVG path), drawn on
export const line = (d, at, { dur = 0.5, gold = false, dark = false } = {}) =>
  `<svg class="ln${dark ? ' dark' : ''}" style="left:0;top:0;width:1920px;height:1080px" viewBox="0 0 1920 1080">${P(d, at, dur, gold ? 'g' : '')}</svg>`;
// strike through: a straight line drawn across [x1,x2] at y
export const strike = (x1, x2, y, at, o = {}) => line(`M${x1} ${y} L${x2} ${y}`, at, { dur: 0.28, ...o });
// big number that counts up, with an optional gold suffix
export const stat = (to, at, o = {}) =>
  `<div class="stat" style="${pos(o)};${o.size ? `font-size:${o.size}px;` : ''}"><span data-d="${at}" data-count="${to}" data-from="${o.from || 0}" data-dec="${o.dec || 0}" data-pre="${o.pre || ''}" data-suf="">${o.pre || ''}${o.from || 0}</span>${o.suf ? `<span class="k" data-fx="cut" data-d="${at + 0.6}">${o.suf}</span>` : ''}</div>`;
// name lower third
export const lower = (name, title, at, o = { x: 96, y: 860 }) =>
  `<div class="lower" style="${pos(o)}"><div class="nm" data-fx="wipe" data-d="${at}">${name}</div><div class="tt" data-fx="wipe" data-dur="0.5" data-d="${at + 0.15}">${title}</div></div>`;
// full-screen insert (cuts in): light paper by default, 'black' for title moments, grid: true for a faint grid
export const panel = (inner, at = 0, o = {}) =>
  `<div class="panel${o.black ? ' black' : ''}${o.grid ? ' grid' : ''}" data-fx="cut" data-d="${at}">${inner}</div>`;
// horizontal bar that grows to w px (gold for "us")
export const bar = (w, at, o = {}) =>
  `<div style="${pos(o)};width:${w}px"><div class="bar${o.us ? ' us' : ''}" data-d="${at}" data-w="100" style="width:0"></div></div>`;
// soft dark shade on one side of the frame, behind white type ('l' or 'r'); fades in over 0.25 s
export const shade = (side, at = 0) => `<div class="shade ${side}" data-fx="wipe" data-dur="0.01" data-d="${at}"></div>`;
