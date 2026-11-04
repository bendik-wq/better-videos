// Map layer: DOM labels anchored to world points (house type: Plex Mono tracked caps, Instrument
// Serif titles, red only for annotation), a screen-width route line drawn on in red, and map pins.
// Everything is a pure function of the state passed to update(); nothing animates on its own.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, clamp, smoother } from './core.js';

const RED = '#e0241b', PAPER = '#ece6da';
const MONO = (size = 0.82, color = '#d9d2c3', ls = 0.22) => `font:500 ${size}em 'Plex Mono',monospace;letter-spacing:${ls}em;text-transform:uppercase;color:${color};white-space:nowrap;line-height:1.35`;

// ---------------------------------------------------------------- labels
export function labels(overlay) {
  const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;overflow:hidden'; overlay.appendChild(layer);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 1920 1080'); svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; layer.appendChild(svg);
  const make = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
  const list = [];
  const v = new THREE.Vector3();
  const api = {
    layer,
    // kind: 'place' | 'title' | 'road' | 'hq' | 'coord'. anchor: Vector3 | () => Vector3 (world-local)
    add(text, anchor, { kind = 'place', dx = 60, dy = -46, sub = '', size = 1, color = null } = {}) {
      const el = document.createElement('div'); el.style.cssText = 'position:absolute;left:0;top:0;will-change:transform';
      if (kind === 'title') el.innerHTML = `<div style="font-family:'Instrument Serif',serif;font-size:${3.2 * size}em;color:${color ?? PAPER};line-height:1;white-space:nowrap">${text}</div>` + (sub ? `<div style="${MONO(0.72, '#a59f92')};margin-top:.7em">${sub}</div>` : '');
      else if (kind === 'road') el.innerHTML = `<div style="${MONO(0.66 * size, color ?? '#d9d2c3', 0.16)};border:1px solid rgba(217,210,195,.55);padding:.2em .5em .15em">${text}</div>`;
      else el.innerHTML = `<div style="${MONO(0.8 * size, color ?? (kind === 'hq' ? PAPER : '#d9d2c3'))}">${text}</div>` + (sub ? `<div style="${MONO(0.62 * size, '#8f897d', 0.16)};margin-top:.35em">${sub}</div>` : '');
      layer.appendChild(el);
      const line = make('polyline', { fill: 'none', stroke: kind === 'hq' ? RED : 'rgba(217,210,195,.6)', 'stroke-width': kind === 'hq' ? 2.2 : 1.2 });
      const dot = make('circle', { r: kind === 'hq' ? 4 : 3, fill: kind === 'hq' ? RED : '#d9d2c3' });
      const ring = kind === 'hq' ? make('path', { fill: 'none', stroke: RED, 'stroke-width': 3, 'stroke-linecap': 'round', filter: '' }) : null;
      const L = { el, line, dot, ring, anchor, kind, dx, dy };
      list.push(L); return L;
    },
    // alpha(L) -> 0..1 per label (draw-on progress); camera at world-local position
    update(camera, alpha = () => 1) {
      camera.updateMatrixWorld(); const s = window.innerHeight / 1080;
      for (const L of list) {
        const a = clamp(typeof alpha === 'function' ? alpha(L) : alpha);
        const p = typeof L.anchor === 'function' ? L.anchor() : L.anchor;
        v.copy(p).project(camera);
        const vis = a > 0.001 && v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.3 && Math.abs(v.y) < 1.3;
        const ax = (v.x + 1) / 2 * 1920, ay = (1 - v.y) / 2 * 1080;
        if (L.kind === 'title') { L.el.style.opacity = vis ? smoother(a) : 0; L.el.style.transform = `translate(${(ax + L.dx) * s}px, ${(ay + L.dy) * s}px)`; L.line.setAttribute('opacity', 0); L.dot.setAttribute('opacity', 0); continue; }
        const k = smoother(clamp(a * 1.6)), kl = clamp(a * 2 - 0.6);
        const ex = ax + L.dx * 0.5 * k, ey = ay + L.dy * k, fx = ex + L.dx * 0.5 * kl;
        L.line.setAttribute('points', `${ax},${ay} ${ex},${ey} ${fx},${ey}`); L.line.setAttribute('opacity', vis ? Math.min(1, a * 3) : 0);
        L.dot.setAttribute('cx', ax); L.dot.setAttribute('cy', ay); L.dot.setAttribute('opacity', vis ? Math.min(1, a * 4) : 0);
        if (L.ring) { // hand-drawn red loop around the anchor, drawn on (never faded)
          const R = 26, turns = 1.15 * clamp(a * 1.5), N = 48; let d = '';
          for (let i = 0; i <= N; i++) { const th = -1.9 + i / N * turns * Math.PI * 2, rr = R * (1 + 0.08 * Math.sin(i * 0.7) + 0.06 * i / N); d += `${i ? 'L' : 'M'}${(ax + Math.cos(th) * rr * 1.25).toFixed(1)},${(ay + Math.sin(th) * rr * 0.8).toFixed(1)} `; }
          L.ring.setAttribute('d', d); L.ring.setAttribute('opacity', vis ? 1 : 0);
        }
        const left = L.dx >= 0;
        L.el.style.transform = `translate(${(left ? ex + 6 : fx - 6) * s}px, ${(ey - 8) * s}px) translate(${left ? 0 : -100}%, -100%)`;
        L.el.style.opacity = vis ? kl : 0;
        L.el.style.clipPath = left ? `inset(-20% ${100 - kl * 100}% -20% 0)` : `inset(-20% 0 -20% ${100 - kl * 100}%)`;
      }
    },
    show(on) { layer.style.display = on ? '' : 'none'; },
  };
  return api;
}

// ---------------------------------------------------------------- route line
// A thick glowing ribbon (screen-constant width: a red core, a soft halo), traced back from the destination,
// with dashes that crawl forward and a travelling dot with a pulse. The dash period is chosen in
// screen pixels with a two-octave blend (log2 of metres-per-pixel), so the pattern reads the same
// from a street corner to a whole state and never pops between scales.
export function routeLine(world, pts, { width = 9, color = [0.88, 0.02, 0.012], lift = 1.5, halo = 3.2 } = {}) {
  const F = world.frame, n = pts.length, P = [], T = [], S = [], side = [];
  const v = new THREE.Vector3();
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    F.surface(pts[i][0], pts[i][1], pts[i][2] + lift, v);
    if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    for (const sd of [-1, 1]) { P.push(v.x, v.y, v.z); T.push(tx / tl, 0, tz / tl); S.push(acc); side.push(sd); }
  }
  const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  const mat = worldMaterial(world.U, {
    uniforms: { uDraw: { value: 0 }, uLen: { value: acc }, uWidth: { value: width }, uHalo: { value: halo }, uRes: { value: new THREE.Vector2(1920, 1080) }, uColor: { value: new THREE.Vector3(...color) }, uAlpha: { value: 1 }, uT: { value: 0 }, uDot: { value: -1 } },
    vertex: /* glsl */`
      attribute vec3 aT; attribute float aS, aSide; uniform float uWidth, uHalo; uniform vec2 uRes; varying float vS, vSide, vMpp;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin; local.y = mix(local.y, flatY(local) + 2., uFlat); wp.y = local.y - uOrigin.y;
        vec4 c0 = projectionMatrix * viewMatrix * wp, c1 = projectionMatrix * viewMatrix * vec4(wp.xyz + aT * 5., 1.);
        vec2 s0 = c0.xy / c0.w * uRes * .5, s1 = c1.xy / c1.w * uRes * .5; vec2 dir = normalize(s1 - s0 + 1e-6); vec2 nrm = vec2(-dir.y, dir.x);
        vMpp = 5. / max(length(s1 - s0), 1e-3);                       // metres per pixel along the line here
        c0.xy += nrm * aSide * uWidth * uHalo / (uRes * .5) * c0.w; vS = aS; vSide = aSide; gl_Position = c0; }`,
    fragment: /* glsl */`
      uniform float uDraw, uLen, uAlpha, uT, uDot, uWidth, uHalo; uniform vec3 uColor; varying float vS, vSide, vMpp;
      float dashes(float s, float period) { float x = fract((s - uT * period * .9) / period); return smoothstep(.0, .06, x) * (1. - smoothstep(.55, .61, x)); }
      void main() {
        // drawn back from the destination (the end of the route) towards its start
        float d = (1. - uDraw) * uLen; if (vS < d) discard;
        float r = abs(vSide) * uHalo;                                  // distance from the centre in core half-widths
        float core = 1. - smoothstep(.75, 1., r);
        float glow = exp(-r * r * .55) * .55;
        // dash period ~ 46 px at any scale: blend the two nearest power-of-two periods in metres
        float k = log2(max(vMpp * 46., 1e-3)), fk = fract(k);
        float p0 = exp2(floor(k)), p1 = p0 * 2.;
        float dash = mix(dashes(vS, p0), dashes(vS, p1), smoothstep(.2, .8, fk));
        float inner = 1. - smoothstep(.2, .45, r);
        vec3 c = uColor * (core * (.45 + .2 * dash) + glow * .6) + vec3(1., .5, .4) * inner * dash * .3;
        // the head of the line and the travelling dot (radius ~ 1.6 core widths, a soft pulse ring)
        float head = exp(-pow((vS - d) / (vMpp * 18.), 2.)) * step(.002, uDraw) * step(uDraw, .999);
        float ds = uDot >= 0. ? (vS - uDot * uLen) / vMpp / uWidth : 99.;
        float rr = length(vec2(ds, r));
        float dot = 1. - smoothstep(1.5, 1.8, rr);
        float ring = exp(-pow(rr - 2.4 - 1.2 * fract(uT * .8), 2.) * 3.) * (1. - fract(uT * .8));
        c += vec3(1., .95, .9) * dot * 1.6 + uColor * ring * .9 + vec3(1., .6, .5) * head * core;
        float a = max(max(core, glow), max(dot, ring * .8)) * uAlpha;
        gl_FragColor = vec4(c * a, a); ${GLSL_TONE} }`,
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 100;
  return { mesh, mat, length: acc,
    // draw 0..1 drawn on; alpha; res (canvas px); t (s) animates the dashes and pulse; dot 0..1 along the route or < 0 for none
    set(draw, alpha = 1, res = null, t = 0, dot = -1) { const u = mat.uniforms; u.uDraw.value = draw; u.uAlpha.value = alpha; if (res) u.uRes.value.copy(res); u.uT.value = t; u.uDot.value = dot; mesh.visible = alpha > 0.001 && draw > 0; } };
}

// ---------------------------------------------------------------- map pin (DOM): drops onto an anchor
export function pin(overlay, { label = '', sub = '' } = {}) {
  const el = document.createElement('div'); el.style.cssText = 'position:absolute;left:0;top:0;will-change:transform;pointer-events:none';
  el.innerHTML = `<svg width="44" height="62" viewBox="0 0 44 62" style="display:block;overflow:visible"><ellipse cx="22" cy="60" rx="9" ry="2.6" fill="rgba(0,0,0,.45)"/><path d="M22 60 C22 60 4 36 4 22 A18 18 0 1 1 40 22 C40 36 22 60 22 60 Z" fill="${RED}"/><circle cx="22" cy="22" r="6.5" fill="#0e1013"/></svg>`
    + (label ? `<div style="${MONO(0.8, PAPER)};position:absolute;left:58px;top:6px">${label}${sub ? `<div style="${MONO(0.62, '#8f897d', 0.16)};margin-top:.35em">${sub}</div>` : ''}</div>` : '');
  overlay.appendChild(el);
  const v = new THREE.Vector3();
  return {
    el,
    update(camera, anchor, a) {
      v.copy(anchor).project(camera); const s = window.innerHeight / 1080;
      const x = (v.x + 1) / 2 * 1920, y = (1 - v.y) / 2 * 1080, k = smoother(clamp(a));
      const drop = (1 - k) * -140, sq = 1 + 0.12 * Math.sin(clamp((a - 0.75) / 0.25) * Math.PI) * (a > 0.75 ? 1 : 0);
      el.style.opacity = a > 0.001 && v.z < 1 ? Math.min(1, a * 3) : 0;
      el.style.transform = `translate(${(x - 22) * s}px, ${(y - 60 + drop) * s}px) scale(${1 / sq}, ${sq})`;
      el.style.transformOrigin = '22px 60px';
    },
  };
}
