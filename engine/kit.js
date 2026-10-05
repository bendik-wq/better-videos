// Reusable building blocks for scenes: easing, camera life, void stages,
// light shafts, dust, shipping containers, and the DOM typography layer.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- time ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a)); // 0..1 between a and b
export const smooth = (t) => t * t * (3 - 2 * t);
export const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);

// Deterministic pseudo-random
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Operator handheld: layered low-frequency sines, deterministic for a given t.
export function handheld(t, amp = 1, seed = 0) {
  // low frequencies only: a slow, floating operator, never jitter (judders at 24/30fps otherwise)
  const n = (f, p) => Math.sin(t * f + p + seed * 13.7);
  return {
    x: amp * (0.7 * n(0.5, 0.0) + 0.3 * n(1.1, 1.1)),
    y: amp * (0.7 * n(0.4, 3.0) + 0.3 * n(0.9, 4.2)),
    r: amp * 0.003 * (n(0.3, 5.5) + 0.5 * n(0.8, 2.9)),
  };
}

// ---------- staging ----------
export function voidStage(scene, { floor = 0x161616, fog = 0x000000, fogDensity = 0.035, size = 400 } = {}) {
  scene.background = new THREE.Color(fog);
  scene.fog = new THREE.FogExp2(fog, fogDensity);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: floor, roughness: 0.92, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

export function keySpot(scene, { color = 0xffffff, intensity = 900, pos = [0, 14, 2], target = [0, 0, 0], angle = 0.42, penumbra = 0.8, shadow = 2048 } = {}) {
  const l = new THREE.SpotLight(color, intensity, 0, angle, penumbra, 2);
  l.position.set(...pos);
  l.target.position.set(...target);
  l.castShadow = !!shadow;
  if (shadow) {
    l.shadow.mapSize.set(shadow, shadow);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    l.shadow.radius = 4;
  }
  scene.add(l, l.target);
  return l;
}

// Volumetric light shaft: ray-marched cone (apex at `pos`), drawn on its back faces.
export function lightShaft(scene, { pos = [0, 14, 2], target = [0, 0, 0], radius = 5, color = 0xfff1dc, intensity = 0.09 } = {}) {
  const from = new THREE.Vector3(...pos), to = new THREE.Vector3(...target);
  const h = from.distanceTo(to);
  const g = new THREE.ConeGeometry(radius * 1.05, h, 48, 1, true);
  g.translate(0, -h / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: intensity }, uH: { value: h }, uR: { value: radius }, uInv: { value: new THREE.Matrix4() } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI, uH, uR; uniform mat4 uInv; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec3 ro = (uInv*vec4(cameraPosition,1.0)).xyz, pe = (uInv*vec4(vW,1.0)).xyz;
        vec3 d = pe - ro; float L = length(d); d /= L;
        float span = min(L, 2.2*uR + uH); float t0 = L - span;
        const int N = 40; float dt = span/float(N); float acc = 0.0;
        float j = hash(gl_FragCoord.xy);
        for (int i = 0; i < N; i++) {
          vec3 p = ro + d*(t0 + (float(i)+j)*dt);
          float y = -p.y / uH; if (y < 0.0 || y > 1.0) continue;
          float r = length(p.xz) / max(uR*y, 1e-3);
          float edge = 1.0 - smoothstep(0.55, 1.0, r);
          acc += edge * (0.35 + 0.65*(1.0-y)) * smoothstep(0.0, 0.08, y) * smoothstep(1.0, 0.8, y);
        }
        acc *= dt / uR;
        gl_FragColor = vec4(uColor * acc * uI * 3.0, 1.0);
      }`,
  });
  const cone = new THREE.Mesh(g, m);
  cone.position.copy(from);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  cone.updateMatrixWorld();
  m.uniforms.uInv.value.copy(cone.matrixWorld).invert();
  cone.renderOrder = 10;
  scene.add(cone);
  return cone;
}

// Dust motes drifting in a volume; call .update(t).
export function dust(scene, { count = 600, box = [10, 10, 10], center = [0, 4, 0], size = 0.035, color = 0xffffff, opacity = 0.55, seed = 7 } = {}) {
  const r = rng(seed);
  const base = new Float32Array(count * 3), pos = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    base[i * 3] = (r() - 0.5) * box[0]; base[i * 3 + 1] = (r() - 0.5) * box[1]; base[i * 3 + 2] = (r() - 0.5) * box[2];
    ph[i] = r() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.position.set(...center);
  scene.add(pts);
  pts.update = (t) => {
    for (let i = 0; i < count; i++) {
      const p = ph[i];
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.21 + p) * 0.4;
      pos[i * 3 + 1] = ((base[i * 3 + 1] + t * 0.06 * (0.5 + (p % 1)) + box[1] / 2) % box[1]) - box[1] / 2;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.17 + p * 1.3) * 0.4;
    }
    g.attributes.position.needsUpdate = true;
  };
  return pts;
}

// ---------- textures ----------
function noiseCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }

export function grimeTexture(seed = 3, base = 150) {
  const r = rng(seed);
  const c = noiseCanvas(512, 512, (x, w, h) => {
    x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) { const v = base + (r() - 0.5) * 120; x.fillStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.3})`;
      const s = r() * 10 + 1; x.fillRect(r() * w, r() * h, s, s * (0.5 + r() * 3)); }
    for (let i = 0; i < 70; i++) { const v = base + 70; x.strokeStyle = `rgba(${v},${v},${v},0.35)`; x.lineWidth = 1 + r() * 2;
      x.beginPath(); const sx = r() * w; x.moveTo(sx, r() * h * 0.3); x.lineTo(sx + (r() - 0.5) * 6, h * (0.4 + r() * 0.6)); x.stroke(); }
  });
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- shipping container (35ft, 1956 Pan-Atlantic trailer-body proportions) ----------
const containerCache = new Map();
export function containerGeometry({ length = 10.7, height = 2.59, depth = 2.44, detail = true } = {}) {
  const key = JSON.stringify(arguments[0] ?? {});
  if (containerCache.has(key)) return containerCache.get(key);
  const body = [], dark = [];
  const box = (arr, w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); arr.push(g); };
  const L = length, Hh = height, D = depth, post = 0.16;
  // inner shell
  box(body, L - 0.05, Hh - 0.06, D - 0.08, 0, Hh / 2, 0);
  // frame: corner posts and rails
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(body, post, Hh, post, sx * (L / 2 - post / 2), Hh / 2, sz * (D / 2 - post / 2));
  for (const sz of [-1, 1]) { box(body, L, 0.16, 0.14, 0, 0.08, sz * (D / 2 - 0.07)); box(body, L, 0.12, 0.12, 0, Hh - 0.06, sz * (D / 2 - 0.06)); }
  for (const sx of [-1, 1]) { box(body, 0.14, 0.18, D, sx * (L / 2 - 0.07), 0.09, 0); box(body, 0.12, 0.14, D, sx * (L / 2 - 0.06), Hh - 0.07, 0); }
  if (detail) {
    // side corrugation
    const pitch = 0.28, n = Math.floor((L - 0.5) / pitch);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + 0.25 + pitch * (i + 0.5);
      for (const sz of [-1, 1]) box(body, 0.13, Hh - 0.34, 0.05, x, Hh / 2, sz * (D / 2 - 0.02));
    }
    // roof ribs
    for (let i = 0; i < n; i += 2) box(body, 0.1, 0.03, D - 0.3, -L / 2 + 0.25 + pitch * (i + 0.5), Hh - 0.015, 0);
    // front wall corrugation
    for (let i = 0; i < 7; i++) box(body, 0.05, Hh - 0.34, 0.13, -L / 2 + 0.01, Hh / 2, -D / 2 + 0.35 + i * 0.29);
    // doors: seam, hinges, four locking bars with handles
    box(dark, 0.03, Hh - 0.3, 0.02, L / 2 - 0.01, Hh / 2, 0);
    for (const z of [-0.85, -0.35, 0.35, 0.85]) {
      const g = new THREE.CylinderGeometry(0.025, 0.025, Hh - 0.2, 10); g.translate(L / 2 + 0.03, Hh / 2, z); dark.push(g);
      box(dark, 0.05, 0.05, 0.22, L / 2 + 0.05, Hh * 0.45, z + 0.11);
      for (const y of [0.4, Hh - 0.4]) box(dark, 0.06, 0.1, 0.1, L / 2 + 0.03, y, z);
    }
    for (const z of [-D / 2 + 0.12, D / 2 - 0.12]) for (const y of [0.5, Hh / 2, Hh - 0.5]) box(dark, 0.08, 0.16, 0.06, L / 2 + 0.02, y, z);
  }
  const out = { body: mergeGeometries(body), dark: dark.length ? mergeGeometries(dark) : null };
  containerCache.set(key, out);
  return out;
}

const grime = new Map();
export function container({ color = 0x8a2a1e, roughness = 0.62, metalness = 0.3, ...geo } = {}) {
  const { body, dark } = containerGeometry(geo);
  if (!grime.has('c')) grime.set('c', grimeTexture(11, 140));
  const g = new THREE.Group();
  const m = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color, roughness, metalness, roughnessMap: grime.get('c'), bumpMap: grime.get('c'), bumpScale: 0.6 }));
  m.castShadow = m.receiveShadow = true; g.add(m);
  if (dark) { const d = new THREE.Mesh(dark, new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5, metalness: 0.7 })); d.castShadow = true; g.add(d); }
  return g;
}

// ---------- typography / overlay ----------
export const RED = '#e0241b';

export function div(overlay, css = '', html = '') {
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;opacity:0;${css}`;
  d.innerHTML = html;
  overlay.appendChild(d);
  return d;
}

// Full-frame SVG in 1920x1080 units with a marker-roughness filter.
export function svgLayer(overlay) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 1920 1080');
  s.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible';
  s.innerHTML = `<defs>
    <filter id="marker" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25" result="holes"/>
      <feComposite in="d" in2="holes" operator="in"/>
    </filter></defs>`;
  overlay.appendChild(s);
  s.make = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); s.appendChild(e); return e; };
  return s;
}

// Hand-drawn grease-pencil loop around (cx,cy). Call .draw(progress 0..1).
export function markerLoop(svg, { cx = 960, cy = 540, rx = 300, ry = 180, turns = 1.18, tilt = -0.12, seed = 2, color = RED, width = 7 } = {}) {
  const r = rng(seed); const pts = [];
  const a0 = -Math.PI * 0.62, N = 140;
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = a0 + u * Math.PI * 2 * turns;
    const grow = 1 + 0.07 * u + (r() - 0.5) * 0.012;
    let x = Math.cos(a) * rx * grow, y = Math.sin(a) * ry * grow;
    const xr = x * Math.cos(tilt) - y * Math.sin(tilt), yr = x * Math.sin(tilt) + y * Math.cos(tilt);
    pts.push([cx + xr, cy + yr]);
  }
  const d = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L');
  const path = svg.make('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#marker)' });
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.draw = (p) => { path.style.strokeDashoffset = `${len * (1 - clamp(p))}`; path.style.opacity = p > 0 ? 1 : 0; };
  path.draw(0);
  return path;
}

// Thin leader line from a 3D anchor to a typographic label.
export function leader(overlay, svg, { html = '', color = '#ece6da' } = {}) {
  const line = svg.make('polyline', { fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: 0 });
  const dot = svg.make('circle', { r: 4, fill: color, opacity: 0 });
  const label = div(overlay, `font:500 0.95em 'Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:${color};white-space:nowrap;line-height:1.5`, html);
  return {
    update(ax, ay, lx, ly, p) {
      const k = outCubic(clamp(p * 1.6)), kl = clamp(p * 2 - 0.6);
      const ex = lerp(ax, lx, k), ey = lerp(ay, ly, k);
      line.setAttribute('points', `${ax},${ay} ${ex},${ey} ${lerp(ex, ex + 140, kl)},${ey}`);
      line.setAttribute('opacity', p > 0 ? 0.9 : 0); dot.setAttribute('cx', ax); dot.setAttribute('cy', ay); dot.setAttribute('opacity', p > 0 ? 1 : 0);
      const s = window.innerHeight / 1080;
      label.style.left = `${(ex + 8) * s}px`; label.style.top = `${(ey - 46) * s}px`;
      label.style.opacity = kl; label.style.clipPath = `inset(0 ${100 - kl * 100}% 0 0)`;
    },
  };
}

// Project a world point to 1920x1080 overlay units.
export function toScreen(v, camera) {
  camera.updateMatrixWorld();
  const p = v.clone().project(camera);
  return [(p.x + 1) / 2 * 1920, (1 - p.y) / 2 * 1080];
}

// Typewriter reveal by character count.
export function typeOn(el, text, p) {
  const n = Math.floor(text.length * clamp(p));
  el.textContent = text.slice(0, n);
}
