// FOOTAGE LAB: real public-domain footage, graded into the house look, intercut with our own 3D
// (a photoreal drone flight over USGS NAIP imagery on USGS 3DEP elevation). Demo for engine/footage.js
// and engine/imagery/. Sets:
//   footage   FT.footage(ctx, shot, params): { file, in, out, speed, grade, reframe, caption, source }
//   aerial    IM.terrain over a baked set + a C1 drone rig (cine.path), haze, captions
//   title     type card on black
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as FT from '/engine/footage.js';
import * as IM from '/engine/imagery/index.js';

const sc = () => window.innerHeight / 1080;

function capLayer(overlay) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;display:none'; overlay.appendChild(d); return d; }
function el(parent, css, html = '') { const d = document.createElement('div'); d.style.cssText = css; d.innerHTML = html; parent.appendChild(d); return d; }

// ---------------------------------------------------------------- aerial: drone over real imagery
const FLIGHTS = {
  // Pentagon: a high drone drifting in from the south-west, slowly descending and turning onto the building
  pentagon: (T) => {
    const c = T.toLocal(38.87085, -77.05585, 0);
    return { keys: [
      { pos: [c.x + 1250, 900, c.z - 1350], look: [c.x - 1100, 0, c.z + 1300], mm: 32 },
      { pos: [c.x + 820, 740, c.z - 930], look: [c.x - 120, 0, c.z + 160], mm: 35 },
      { pos: [c.x + 380, 600, c.z - 520], look: [c.x, 0, c.z], mm: 40 },
    ], float: 1.2 };
  },
  // Hoover Dam: low down Black Canyon, the river below, rising over the dam crest towards Lake Mead
  hoover: (T) => {
    // heights are metres above sea level; the river below the dam is at ~200 m, the canyon rims 450-700 m
    const at = (lat, lon, asl) => { const v = T.toLocal(lat, lon, 0); v.y = asl - T.set.center.elev - (v.x * v.x + v.z * v.z) / 12742000; return [v.x, v.y, v.z]; };
    const dam = at(36.01560, -114.73770, 260);
    return { keys: [
      { pos: at(35.9850, -114.7440, 860), look: dam, mm: 30 },
      { pos: at(35.9930, -114.7452, 800), look: dam, mm: 32 },
      { pos: at(35.9995, -114.7440, 760), look: at(36.0160, -114.7375, 240), mm: 36 },
    ], float: 1.5 };
  },
  // Sentinel-2 + terrain tiles (outside the US): the Matterhorn from the north-east, Zermatt valley beyond
  matterhorn: (T) => {
    const at = (lat, lon, asl) => { const v = T.toLocal(lat, lon, 0); v.y = asl - T.set.center.elev; return [v.x, v.y, v.z]; };
    const peak = at(45.9763, 7.6586, 4300);
    return { keys: [
      { pos: at(46.030, 7.735, 4700), look: peak, mm: 35 },
      { pos: at(46.012, 7.712, 4550), look: peak, mm: 40 },
    ], float: 3 };
  },
};

async function aerial(ctx, shot) {
  const P = shot.params;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9aa8b4);
  const camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 5, 400000);
  const T = await IM.terrain(scene, P.place, { lod: P.lod ?? 0, levels: P.levels, haze: P.haze ?? 'day', renderer: ctx.renderer, segments: P.segments ?? 48 });
  const F = FLIGHTS[P.flight ?? P.place](T);
  const rig = C.path(F.keys, { duration: shot.duration, accel: 0.25, decel: 0.35, float: F.float, seed: 3, vIn: P.vIn ?? 0 });
  const layer = capLayer(ctx.overlay), s = sc();
  const scrim = el(layer, `position:absolute;left:0;top:0;width:${1100 * s}px;height:${420 * s}px;background:radial-gradient(ellipse at top left, rgba(0,0,0,.5), rgba(0,0,0,.2) 45%, rgba(0,0,0,0) 72%);opacity:0`);
  const cap = P.caption ? el(layer, `position:absolute;left:${96 * s}px;top:${84 * s}px;font:${56 * s}px/1.05 "Instrument Serif";color:#ece6da;text-shadow:0 0 ${18 * s}px rgba(0,0,0,.4)`, P.caption) : null;
  const sub = P.sub ? el(layer, `position:absolute;left:${98 * s}px;top:${152 * s}px;font:500 ${16 * s}px "Plex Mono";letter-spacing:.2em;color:#ece6da;opacity:.8`, '') : null;
  const src = el(layer, `position:absolute;left:${96 * s}px;bottom:${56 * s}px;font:500 ${14 * s}px "Plex Mono";letter-spacing:.2em;text-transform:uppercase;color:#ece6da;opacity:0`, P.source ?? `IMAGERY: USDA NAIP · ELEVATION: USGS 3DEP · RENDERED, HEIGHT ×1`); if (P.title) src.style.display = 'none';
  // end card over the flight: a quiet serif line and the source list in tracked mono caps
  let endT = null, endS = null, endBg = null;
  if (P.title) {
    endBg = el(layer, `position:absolute;inset:0;background:linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.15) 55%, rgba(0,0,0,0));opacity:0`);
    endT = el(layer, `position:absolute;left:${120 * s}px;top:${410 * s}px;font:${104 * s}px/1 "Instrument Serif";color:#ece6da;letter-spacing:-.01em`, P.title);
    endS = el(layer, `position:absolute;left:${124 * s}px;top:${545 * s}px;width:${900 * s}px;font:500 ${15 * s}px/1.9 "Plex Mono";letter-spacing:.2em;color:#ece6da;opacity:.8;white-space:pre`, '');
  }
  return { scene, camera, layer, update(t, p) {
    rig(camera, p, t); T.update(camera);
    if (endT) {
      const a = P.titleAt ?? 1.2;
      endBg.style.opacity = String(K.range(t, a - 0.6, a + 0.8));
      endT.style.clipPath = `inset(0 ${(1 - K.outCubic(K.range(t, a, a + 1.1))) * 100}% 0 0)`;
      const lines = P.credits ?? ''; endS.textContent = lines.slice(0, Math.round(lines.length * K.range(t, a + 0.9, a + 2.6)));
      const out = K.range(t, shot.duration - 0.8, shot.duration); endT.style.opacity = endS.style.opacity = String(1 - out);
    }
    scrim.style.opacity = String(P.caption ? K.range(t, 0.2, 1.0) : 0);
    if (cap) cap.style.clipPath = `inset(0 ${(1 - K.outCubic(K.range(t, 0.6, 1.5))) * 100}% 0 0)`;
    if (sub) sub.textContent = P.sub.slice(0, Math.round(P.sub.length * K.range(t, 1.1, 2.0)));
    src.style.opacity = String(0.8 * K.range(t, 0.4, 0.9) * (1 - K.range(t, shot.duration - 0.4, shot.duration)));
  } };
}

// ---------------------------------------------------------------- title card
function title(ctx, shot) {
  const P = shot.params, s = sc();
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000); const camera = new THREE.PerspectiveCamera();
  const layer = capLayer(ctx.overlay);
  const t1 = el(layer, `position:absolute;left:${120 * s}px;top:${430 * s}px;font:${112 * s}px/1 "Instrument Serif";color:#ece6da;letter-spacing:-.01em`, P.title);
  const t2 = el(layer, `position:absolute;left:${124 * s}px;top:${570 * s}px;font:500 ${17 * s}px "Plex Mono";letter-spacing:.24em;color:#ece6da;opacity:.75`, '');
  const n = P.num ? el(layer, `position:absolute;left:${122 * s}px;top:${340 * s}px;font:700 ${54 * s}px "Archivo Narrow";color:#e0241b`, P.num) : null;
  return { scene, camera, layer, update(t) {
    t1.style.clipPath = `inset(0 ${(1 - K.outCubic(K.range(t, 0.3, 1.3))) * 100}% 0 0)`;
    t2.textContent = (P.sub ?? '').slice(0, Math.round((P.sub ?? '').length * K.range(t, 1.0, 2.0)));
    t1.style.opacity = t2.style.opacity = String(1 - K.range(t, shot.duration - 0.5, shot.duration));
    if (n) n.style.opacity = String(K.range(t, 0.1, 0.12) * (1 - K.range(t, shot.duration - 0.5, shot.duration)));
  } };
}

// ---------------------------------------------------------------- runtime + compositor (cuts, dissolves, dips)
export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  await FT.ready();
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`;
  gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d', { willReadFrequently: true });
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d');
  const live = new Map();
  for (const s of shots) {
    const P = s.params ?? {};
    const inst = s.set === 'footage' ? await FT.footage(ctx, s, P) : s.set === 'aerial' ? await aerial(ctx, s) : title(ctx, s);
    live.set(s.id, inst);
  }
  const layers = [...live.values()].map(v => v.layer).filter(Boolean);
  // transitions: shot.params.trans = 'cut' | 'dissolve' | 'dip' (duration params.transDur)
  return {
    frame({ shot, t, p, index }) {
      const inst = live.get(shot.id);
      for (const l of layers) l.style.display = l === inst.layer ? '' : 'none';
      inst.update(t, p);
      renderer.render(inst.scene, inst.camera);
      const tr = shot.params?.trans ?? 'cut', D = shot.params?.transDur ?? 0.5;
      if (index > 0 && tr !== 'cut' && t < D) {
        // the outgoing image is the previous shot's last frame, re-rendered (pure function of time)
        const pv = shots[index - 1], pi = live.get(pv.id);
        pi.update(pv.duration - 1e-3, 1); renderer.render(pi.scene, pi.camera); px.drawImage(gl, 0, 0, width, height);
        inst.update(t, p); renderer.render(inst.scene, inst.camera);
        const k = K.smooth(t / D);
        if (tr === 'dissolve') { cx.globalAlpha = 1; cx.drawImage(prev, 0, 0); cx.globalAlpha = k; cx.drawImage(gl, 0, 0, width, height); cx.globalAlpha = 1; }
        else { cx.fillStyle = '#000'; cx.fillRect(0, 0, width, height); cx.globalAlpha = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2; cx.drawImage(k < 0.5 ? prev : gl, 0, 0, width, height); cx.globalAlpha = 1; }
      } else cx.drawImage(gl, 0, 0, width, height);
    },
  };
}
