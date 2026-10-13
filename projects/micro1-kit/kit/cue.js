// LEDGER kit: narration timing. Pure (no DOM): shared by the sets (browser) and cuts.mjs (node, for sfx).
//
// shot.words = [{ w, s, e }] in seconds from the shot's start (engine/render.mjs). In a beat child the
// parent's earlier words have negative times; everything here prefers words at s >= 0.
//
// A cue spec (any set param named at / word / ...At) is one of:
//   1.8               seconds into the shot
//   'billion'         first spoken word starting with "billion" (case/punctuation-insensitive)
//   'billion#2'       its 2nd occurrence;   'billion+0.3' / 'billion-0.2'  with an offset in seconds
//   { word, offset, nth }
export const norm = (w) => String(w).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9$%]/g, '');
const STOP = new Set(['the', 'and', 'for', 'you', 'your', 'are', 'with', 'that', 'this', 'from', 'its', 'our', 'their', 'into', 'of', 'a', 'an', 'to', 'in', 'on', 'or', 'is', 'it', 'by', 'at', 'be', 'as']);

export const said = (shot) => (shot.words ?? []).filter((x) => x.s >= -0.02);
// time of the first word this shot actually speaks (beats: the beat's own first word)
export const first = (shot) => said(shot)[0]?.s ?? 0.25;
export const lastEnd = (shot) => { const w = said(shot); return w.length ? w.at(-1).e : Math.max(0.5, (shot.duration ?? 3) - 0.4); };

export function at(shot, spec, fallback = first(shot)) {
  if (spec == null || spec === '') return fallback;
  if (typeof spec === 'number') return spec;
  if (typeof spec === 'object') return at(shot, spec.nth ? `${spec.word}#${spec.nth}` : spec.word, fallback) + (spec.offset ?? 0);
  const m = /^(.*?)(?:#(\d+))?([+-]\d*\.?\d+)?$/.exec(String(spec).trim());
  const word = norm(m[1]), nth = Number(m[2] ?? 1), off = Number(m[3] ?? 0);
  if (!word) return fallback + off;
  let hits = said(shot).filter((x) => norm(x.w).startsWith(word));
  if (!hits.length) hits = (shot.words ?? []).filter((x) => norm(x.w).startsWith(word));
  const h = hits[nth - 1] ?? hits.at(-1);
  return h ? h.s + off : fallback;
}

// n evenly spaced times across the spoken part of the shot (first item on the first word)
export function spread(shot, n, { from = first(shot), span } = {}) {
  if (n <= 0) return [];
  const end = Math.max(from + 0.35 * n, lastEnd(shot) - 0.4);
  const step = n > 1 ? Math.min(span ?? Infinity, (end - from) / (n - 1)) : 0;
  return Array.from({ length: n }, (_, i) => from + i * step);
}

// One time per item: item.word / item.at if given, else the first content word of its text that the VO says
// (in order, after the previous item's time), else interpolated between its neighbours / spread evenly.
export function items(shot, list, { text = (x) => (typeof x === 'string' ? x : x.text ?? x.label ?? ''), from, gap = 0.25 } = {}) {
  const n = list.length, ws = said(shot), base = spread(shot, n, { from });
  const out = new Array(n).fill(null);
  let tPrev = -1, j = 0;
  list.forEach((it, i) => {
    const spec = typeof it === 'object' ? (it.word ?? it.at) : undefined;
    if (spec != null) { out[i] = at(shot, spec, base[i]); tPrev = out[i]; return; }
    const toks = String(text(it)).split(/[\s/&·,+-]+/).map(norm).filter((w) => w.length >= 3 && !STOP.has(w) || /^\d+$/.test(w));
    for (let k = j; k < ws.length && out[i] == null; k++) {
      if (ws[k].s <= tPrev) continue;
      const w = norm(ws[k].w);
      if (toks.some((tk) => w.length >= 2 && (w.startsWith(tk) || tk.startsWith(w) && w.length >= 4))) { out[i] = ws[k].s; j = k + 1; tPrev = out[i]; }
    }
  });
  // fill the gaps between matched neighbours
  for (let i = 0; i < n; i++) if (out[i] == null) {
    let a = i - 1; while (a >= 0 && out[a] == null) a--;
    let b = i + 1; while (b < n && out[b] == null) b++;
    const ta = a >= 0 ? out[a] : null, tb = b < n ? out[b] : null;
    if (ta != null && tb != null) out[i] = ta + (tb - ta) * (i - a) / (b - a);
    else if (ta != null) out[i] = Math.max(ta + gap, base[i]);
    else if (tb != null) out[i] = Math.min(tb - gap * (b - i), base[i]);
    else out[i] = base[i];
  }
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i], out[i - 1] + 0.12);
  return out.map((x) => Math.max(0.05, x));
}

// Start time for every token of display text, matched in order against the narration (lookahead 6 words).
// Unsaid tokens ("$1B") are interpolated between their spoken neighbours.
export function tokens(shot, toks, { from = first(shot), gap = 0.2 } = {}) {
  const ws = said(shot), out = new Array(toks.length).fill(null); let j = 0;
  toks.forEach((tk, i) => {
    const n = norm(tk); if (!n) return;
    for (let k = j; k < Math.min(ws.length, j + 6); k++) {
      const w = norm(ws[k].w);
      if (w === n || (n.length >= 3 && w.startsWith(n)) || (w.length >= 3 && n.startsWith(w))) { out[i] = ws[k].s; j = k + 1; break; }
    }
  });
  for (let i = 0; i < out.length; i++) if (out[i] == null) {
    let b = i + 1; while (b < out.length && out[b] == null) b++;
    const ta = i ? out[i - 1] : from - gap, tb = b < out.length ? out[b] : null;
    out[i] = tb != null ? ta + (tb - ta) / (b - i + 1) : ta + gap;
  }
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + 0.05);
  return out;
}

// sfx cue for engine/sfx.py presets, at seconds into the shot (cuts.mjs turns these into score cues)
export const fx = (name, at, gain = 0.5, params) => ({ name, at: +Math.max(0, at).toFixed(3), gain, ...(params ? { params } : {}) });
// a list param that may be given as 'A / B / C' or an array
export const list = (v, def = []) => (v == null ? def : Array.isArray(v) ? v : String(v).split(/\s*\/\s*/));
