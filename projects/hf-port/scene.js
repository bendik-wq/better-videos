// The counter beat from hf-test/count.html, drawn on a 2D canvas: housing morph (teal dot -> brass slot),
// 14 drums pop in and roll to 37,200,000,000,000 (low digits spin more, lead digit lands last),
// label words blur in, source line, red pencil underline. Pure function of t.
import * as THREE from 'three';
const P = { paper: '#f7f6f1', ink: '#14233d', ink70: '#3d4a60', teal: '#2a8c86', brass: '#b98a3e', red: '#e0241b' };
const cl = (x) => Math.max(0, Math.min(1, x));
const at = (t, t0, d) => cl((t - t0) / d);
const E = {
  p3o: (p) => 1 - (1 - p) ** 3, p4o: (p) => 1 - (1 - p) ** 4, expo: (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
  back: (s) => (p) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2,
};
const mix = (a, b, p) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - p) + parseInt(b.substr(1 + i, 2), 16) * p).toString(16).padStart(2, '0')).join('');
const VALUE = '37,200,000,000,000', DW = 92, DH = 220, GAP = 10, CW = 24, H = 214;

function count(ctx) {
  const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(layer);
  const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  layer.appendChild(cv); const g = cv.getContext('2d'), s = ctx.width / 1920;
  // layout: flex row centred in the housing (100..1820)
  const items = [...VALUE].map((ch) => ({ ch, w: ch === ',' ? CW : DW }));
  const total = items.reduce((a, it) => a + it.w, 0) + GAP * (items.length - 1);
  let x = 960 - total / 2; for (const it of items) { it.x = x; x += it.w + GAP; }
  const drums = items.filter((it) => it.ch !== ','), commas = items.filter((it) => it.ch === ',');
  const words = ['CELLS', 'IN', 'ONE', 'HUMAN', 'BODY'];
  return { layer, update(t) {
    g.setTransform(s, 0, 0, s, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
    g.fillStyle = P.paper; g.fillRect(0, 0, 1920, 1080);
    // housing: inset clip from a 44x44 teal dot to the full brass slot
    const m = E.p3o(at(t, 0, 0.5)), ix = 838 * (1 - m), iy = 128 * (1 - m), r = 22 - 4 * m;
    g.save(); g.beginPath(); g.roundRect(100 + ix, 370 + iy, 1720 - 2 * ix, 300 - 2 * iy, r); g.clip();
    g.fillStyle = mix(P.teal, P.brass, m); g.fillRect(100, 370, 1720, 300);
    g.strokeStyle = P.ink; g.lineWidth = 8; g.beginPath(); g.roundRect(100, 370, 1720, 300, 18); g.stroke();
    // drums
    const n = drums.length;
    drums.forEach((d, j) => {
      const pop = at(t, 0.3 + j * 0.033, 0.13); if (pop <= 0) return;
      const sc = 0.9 + 0.1 * E.back(1.6)(pop), fromRight = n - 1 - j;
      const target = 10 * (1 + Math.min(2, Math.floor(fromRight / 5))) + Number(d.ch);
      const y = -target * H * E.back(1.15)(at(t, 0.4 + fromRight * 0.025, 1.0));
      g.save(); g.globalAlpha = pop; g.translate(d.x + DW / 2, 520); g.scale(sc, sc);
      g.beginPath(); g.roundRect(-DW / 2, -DH / 2, DW, DH, 6); g.fillStyle = P.paper; g.fill(); g.save(); g.clip();
      g.fillStyle = P.ink; g.font = '700 190px "Archivo Narrow"'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const k0 = Math.floor(-y / H);
      for (let k = k0 - 1; k <= k0 + 2; k++) if (k >= 0 && k < 40) g.fillText(String(k % 10), 0, -DH / 2 + 3 + k * H + y + H / 2 + 8);
      g.restore(); g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); g.restore();
    });
    commas.forEach((c, i) => { g.globalAlpha = E.p3o(at(t, 0.4 + i * 0.13, 0.1)); g.fillStyle = P.ink; g.font = '700 150px "Archivo Narrow"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(',', c.x + CW / 2, 590); });
    g.restore(); g.globalAlpha = 1;
    // label words: blur-in
    g.font = '500 36px "Plex Mono"'; g.letterSpacing = '5.76px'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const ws = words.map((w) => g.measureText(w).width), sp = 22, tw = ws.reduce((a, b) => a + b, 0) + sp * 4;
    let wx = 960 - tw / 2;
    words.forEach((w, i) => { const p = E.p4o(at(t, 0.45 + i * 0.07, 0.13)); if (p > 0) { g.globalAlpha = p; g.filter = `blur(${6 * (1 - p)}px)`; g.fillStyle = P.ink; g.fillText(w, wx, 300); } wx += ws[i] + sp; });
    g.filter = 'none'; g.globalAlpha = 1;
    const sp2 = E.expo(at(t, 0.6, 0.18));
    if (sp2 > 0) { g.font = '500 28px "Plex Mono"'; g.letterSpacing = '3.4px'; g.textAlign = 'center'; g.globalAlpha = sp2; g.filter = `blur(${8 * (1 - sp2)}px)`; g.fillStyle = P.ink70; g.fillText('SOURCE · BIANCONI 2013 (EST.)', 960, 795); g.filter = 'none'; g.globalAlpha = 1; }
    g.letterSpacing = '0px';
    // red pencil underline draws on
    const u = E.p3o(at(t, 1.75, 0.35));
    if (u > 0) { g.strokeStyle = P.red; g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([u * 1440, 4000]); g.beginPath(); g.moveTo(250, 712); g.bezierCurveTo(700, 700, 1220, 724, 1670, 708); g.stroke(); g.setLineDash([]); }
  } };
}

const SETS = { count };
export default async function create(ctx) {
  const { renderer, shots } = ctx;
  await document.fonts.ready;
  for (const f of ['700 190px "Archivo Narrow"', '500 36px "Plex Mono"']) await document.fonts.load(f);
  const live = new Map();
  for (const sh of shots) live.set(sh.id, await SETS[sh.set](ctx, sh));
  const layers = [...live.values()].map((v) => v.layer);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.paper); const cam = new THREE.PerspectiveCamera();
  return { frame({ shot, t }) { const inst = live.get(shot.id); for (const l of layers) l.style.display = l === inst.layer ? '' : 'none'; renderer.render(scene, cam); inst.update(t); } };
}
