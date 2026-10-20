// Episode 8 (AI bubble) 3D sets. Studio look (studio-kit) + Reconstructed-style mannequins (silver-props).
//   bubble   the hero: an iridescent soap bubble holding a miniature AI economy (company towers, data centers) with money
//            circling between them; optional red needle approach and pop.
//   circle   the circular-deal machine up close: towers with labelled money streams (amount pills) flowing around a loop.
import * as THREE from 'three';
import * as S from './studio-kit.js';
import * as PR from './silver-props.js';

const v3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- shared pieces
// a company tower: rounded glossy block with a lit window grid and a name plate on the roof edge
const winCache = new Map();
function windowTex(cols = 6, rows = 14, seed = 1) {
  const k = `${cols}|${rows}|${seed}`; if (winCache.has(k)) return winCache.get(k);
  const r = S.rng(seed);
  const t = S.canvasTex(256, 512, (g, W, H) => {
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, W, H);
    const cw = W / cols, rh = H / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { g.fillStyle = r() < 0.18 ? '#ffe7a8' : '#9fb4c8'; g.fillRect(i * cw + cw * 0.14, j * rh + rh * 0.18, cw * 0.72, rh * 0.62); }
  });
  winCache.set(k, t); return t;
}
const glassCache = new Map();
function glassTex(tint = '#1d2b3a', cols = 8, rows = 24) {
  const k = tint + cols + rows; if (glassCache.has(k)) return glassCache.get(k);
  const t = S.canvasTex(256, 768, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, tint); gr.addColorStop(1, new THREE.Color(tint).multiplyScalar(0.55).getStyle()); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * W / cols, 0); g.lineTo(i * W / cols, H); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * H / rows); g.lineTo(W, j * H / rows); g.stroke(); }
  });
  glassCache.set(k, t); return t;
}
// a company tower: reflective glass curtain wall with mullions, a coloured crown and a name plate
export function tower({ w = 3, d = 3, h = 9, glass = '#22344a', accent = '#14233d', label = null, labelSize = 1.0, shape = 'box' } = {}) {
  const G = new THREE.Group();
  const gm = new THREE.MeshPhysicalMaterial({ map: glassTex(glass, Math.max(4, Math.round(w * 2.4)), Math.max(10, Math.round(h * 2.2))), metalness: 0.55, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
  const geo = shape === 'cyl' ? new THREE.CylinderGeometry(w / 2, w / 2 * 1.05, h, 48).translate(0, h / 2, 0) : S.roundBox(w, h, d, 0.12, 3);
  const body = new THREE.Mesh(geo, gm); body.castShadow = body.receiveShadow = true; G.add(body);
  const base = new THREE.Mesh(S.roundBox(w + 0.7, 0.5, d + 0.7, 0.1), S.clay('#f1f0ec', { rough: 0.5 })); base.castShadow = base.receiveShadow = true; G.add(base);
  const crown = new THREE.Mesh(S.roundBox(w + 0.15, 0.55, d + 0.15, 0.1), S.glossy(accent, { rough: 0.25, coat: 1 })); crown.position.y = h - 0.1; crown.castShadow = true; G.add(crown);
  if (label) { const lp = PR.labelPlane(label, { w: Math.max(2.6, label.length * 0.46) * labelSize, h: 0.8 * labelSize, bg: '#ffffff', color: '#14233d' }); lp.position.set(0, h + 1.25 * labelSize, 0); G.add(lp); G.userData.label = lp; }
  G.userData.h = h; return G;
}
// a data-center hall: low long block with cooling units on the roof
export function datacenter({ w = 8, d = 4, h = 1.6, color = '#e9ebee' } = {}) {
  const G = new THREE.Group(); const m = S.clay(color, { rough: 0.55 });
  const b = new THREE.Mesh(S.roundBox(w, h, d, 0.08), m); b.castShadow = b.receiveShadow = true; G.add(b);
  const fanM = S.clay('#9aa3ad', { rough: 0.5 }), dark = S.clay('#2b2f38');
  for (let i = 0; i < Math.floor(w / 1.2); i++) for (const z of [-d * 0.22, d * 0.22]) { const u = new THREE.Mesh(S.roundBox(0.9, 0.35, 0.9, 0.05), fanM); u.position.set(-w / 2 + 0.7 + i * 1.2, h, z); u.castShadow = true; G.add(u);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), dark); f.position.set(u.position.x, h + 0.37, z); G.add(f); }
  return G;
}
// money that flows along a closed path: instanced cash bundles; .set(t, speed) moves them
export function moneyLoop(points, { n = 40, scale = 0.35, closed = true, color = null } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(v3), closed, 'centripetal');
  const bill = PR.cashStack({ w: 1.56, d: 0.66, h: 0.12, band: true }); // geometry source
  const meshes = []; bill.traverse(o => { if (o.isMesh) meshes.push(o); });
  const inst = meshes.map(m => { const im = new THREE.InstancedMesh(m.geometry, m.material, n); im.castShadow = true; return im; });
  const G = new THREE.Group(); inst.forEach(i => G.add(i));
  const o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  G.userData = { curve, set(t, speed = 0.05, visibleFrac = 1) {
    for (let k = 0; k < n; k++) { const u = ((k / n + t * speed) % 1 + 1) % 1; const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      o.position.copy(p); o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); o.scale.setScalar(k / n < visibleFrac ? scale : 0.0001); o.updateMatrix();
      for (const im of inst) im.setMatrixAt(k, o.matrix); }
    for (const im of inst) im.instanceMatrix.needsUpdate = true; } };
  return G;
}
// the bubble film: transparent iridescent shell (thin film colours, fresnel rim)
// custom shader: clear centre, thin-film rainbow at the fresnel rim (swirling), two softbox highlights
export function bubbleMat({ strength = 1 } = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, strength: { value: strength } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float time; uniform float strength; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec3 N = normalize(vN); vec3 V = normalize(vV); if (!gl_FrontFacing) N = -N;
        float c = clamp(abs(dot(N,V)),0.0,1.0); float f = pow(1.0-c, 2.6);
        float th = f*1.6 + 0.55*sin(vW.y*0.32 + time*0.35) + 0.35*sin(vW.x*0.21 - vW.z*0.17 - time*0.22) + 0.2*sin((vW.x+vW.y)*0.9 + time*0.5);
        vec3 film = 0.55 + 0.45*cos(6.2831*(vec3(0.0,0.33,0.67) + th));
        vec3 R = reflect(-V, N);
        float s1 = pow(max(dot(R, normalize(vec3(-0.45,0.62,0.64))),0.0), 90.0);
        float s2 = pow(max(dot(R, normalize(vec3(0.7,0.35,0.6))),0.0), 220.0);
        float spec = (s1*2.2 + s2*1.6);
        vec3 col = film*(0.35+1.1*f) + vec3(spec);
        float a = clamp((0.035 + 0.62*f)*strength + spec*0.9, 0.0, 1.0);
        gl_FragColor = vec4(col, a); }`,
  });
  return m;
}

// the miniature AI economy (company towers on a disc + data centers), centred at origin, ~ radius 9
function economy({ labels = ['NVIDIA', 'OPENAI', 'ORACLE'], extra = true } = {}) {
  const G = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(10, 10.4, 0.6, 96), S.clay('#f4f2ee', { rough: 0.6, coat: 0.3 })); disc.position.y = -0.3; disc.receiveShadow = true; G.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(10.2, 0.08, 12, 128).rotateX(Math.PI / 2), S.clay('#14233d')); ring.position.y = 0.02; G.add(ring);
  const spots = [[0, -4.2], [4.6, 2.4], [-4.6, 2.4]];
  const towers = labels.map((l, i) => { const t = tower({ w: [2.8, 2.6, 2.6][i % 3], d: [2.8, 2.6, 2.6][i % 3], h: [9.5, 7.6, 8.2][i % 3], label: l, glass: ['#1f3326', '#22262c', '#3a2424'][i % 3], accent: ['#76b900', '#14233d', '#e0241b'][i % 3], shape: i === 1 ? 'cyl' : 'box' }); t.position.set(spots[i][0], 0, spots[i][1]); G.add(t); return t; });
  if (extra) { const dc1 = datacenter({ w: 5.5, d: 2.6 }); dc1.position.set(-0.4, 0, 4.6); G.add(dc1); const dc2 = datacenter({ w: 3.6, d: 2.2 }); dc2.position.set(6.2, 0, -3.6); dc2.rotation.y = 0.6; G.add(dc2); const dc3 = datacenter({ w: 3.6, d: 2.2 }); dc3.position.set(-6.2, 0, -3.4); dc3.rotation.y = -0.6; G.add(dc3); }
  const loopPts = spots.map(([x, z], i) => [x * 0.6, 3.2 + i * 0.2, z * 0.6]);
  const loop = moneyLoop([[0, 8.6, -3.4], [3.2, 9.8, -0.4], [4.4, 7.6, 2.0], [0.6, 8.6, 2.6], [-4.4, 8.4, 2.0], [-3.2, 9.8, -0.6]], { n: 14, scale: 0.9 }); G.add(loop);
  G.userData = { towers, loop, disc };
  return G;
}

export default function aiSets(H) {
  return {

    // ================================================================ circle: the circular-deal machine (3D). Towers on a ring; money arcs between them.
    // params: towers [names] (default 8), flows [{ from, to, label, at, kind: 'invest'|'buy'|'guarantee' }], hot [names to light], camera, sky (bool)
    async circle(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 3000);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 22, az: 130, el: 52, fog: [160, 420], contact: { w: 56, d: 56, blur: 3, darkness: 1.0, opacity: 0.55 } });
      const names = P0.towers ?? ['NVIDIA', 'AMD', 'MICROSOFT', 'OPENAI', 'AMAZON', 'ALPHABET', 'ORACLE', 'COREWEAVE'];
      const colors = { NVIDIA: ['#4f7a52', '#76b900'], OPENAI: ['#4a5260', '#14233d'], ORACLE: ['#8a4a46', '#e0241b'], AMD: ['#5a5f68', '#3b4250'], MICROSOFT: ['#4d6f8c', '#2a8c86'], AMAZON: ['#7d6e52', '#c9a45a'], COREWEAVE: ['#55607e', '#5b6b80'], ALPHABET: ['#56788a', '#a9c5ae'], META: ['#4f6488', '#5b6b80'], ANTHROPIC: ['#7d6650', '#c9a45a'], LUCENT: ['#6a5a86', '#e0241b'], NORTEL: ['#4d6f8c', '#14233d'] };
      for (const n of names) if (!colors[n] && /CARRIER/.test(n)) colors[n] = ['#7d8a98', '#a9c5ae'];
      const R = P0.radius ?? 14;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R + 4.5, R + 4.8, 1.4, 128), S.clay('#f4f2ee', { rough: 0.6, coat: 0.3 })); disc.position.y = -0.7; disc.receiveShadow = true; scene.add(disc);
      const pos = {}; const towers = {};
      names.forEach((n, i) => { const a = (i / names.length) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * R, z = Math.sin(a) * R; pos[n] = [x, z];
        const [g, acc] = colors[n] ?? ['#22262c', '#14233d']; const t = tower({ w: 2.6, d: 2.6, h: P0.heights?.[n] ?? ((n === 'NVIDIA' || n === 'LUCENT') ? 10 : n === 'OPENAI' ? 8.5 : 6 + (i % 3)), glass: g, accent: acc, label: n, labelSize: 1.7, shape: n === 'OPENAI' ? 'cyl' : 'box' }); t.position.set(x, 0, z); if (P0.tilt?.[n]) { t.rotation.x = P0.tilt[n]; t.position.y = -0.2; } scene.add(t); towers[n] = t; });
      // flows: arc tubes (drawn on) + bills hopping along each arc
      const flows = (P0.flows ?? []).map((f, i) => {
        const a = pos[f.from], b = pos[f.to]; if (!a || !b) return null;
        const ha = towers[f.from].userData.h, hb = towers[f.to].userData.h;
        const mid = [(a[0] + b[0]) / 2 * (f.kind === 'guarantee' ? 0.85 : 0.45), Math.max(ha, hb) + 3 + Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.18 + (f.kind === 'guarantee' ? 4.5 : f.kind === 'invest' ? 2.2 : 0), (a[1] + b[1]) / 2 * (f.kind === 'guarantee' ? 0.85 : 0.45)];
        { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, sp = P0.spread ?? 2.6; mid[0] += -dz / L * sp; mid[2] += dx / L * sp; }
        const curve = new THREE.QuadraticBezierCurve3(v3([a[0], ha * 0.7, a[1]]), v3(mid), v3([b[0], hb * 0.7, b[1]]));
        const col = f.kind === 'guarantee' ? '#e0241b' : f.kind === 'buy' ? '#2a8c86' : '#14233d';
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.16, 10, false), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.4 })); scene.add(tube);
        const bills = []; for (let k = 0; k < 4; k++) { const c = PR.cashStack({ w: 1.56, d: 0.66, h: 0.12 }); c.scale.setScalar(0.7); scene.add(c); bills.push(c); }
        return { f, curve, tube, bills, mid, at: S.cue(shot, f.at, 0.8 + i * 1.2) };
      }).filter(Boolean);
      const layer = H.layerOf(ctx);
      for (const fl of flows) fl.pillEl = H.pill(layer, fl.f.label ?? '', { size: 24, dot: fl.f.kind === 'guarantee' ? '#e0241b' : null });
      const cap = P0.caption ? H.caption(layer, P0.caption, 'left:5.5%;top:7.5%', { at: 0.35 }) : null; const src = H.sourceLine(layer, P0.source ?? null);
      st.applyEnv();
      if (P0.sky !== false) { const { paintedSky } = await import('./thumbs.js'); scene.background = paintedSky(P0.seed ?? 4); scene.fog = null; st.cyc.visible = false; }
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 1.6, falloff: 0.8 }, dof: { focus: 40, range: 30, bokeh: 1.2 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const dur = shot.duration ?? 8;
      const keys = P0.camera ?? [{ pos: [-6, 36, 46], look: [0, 1, 1], mm: 30 }, { pos: [10, 33, 44], look: [0, 1, 1], mm: 30 }];
      return {
        scene, camera, layer,
        update(t) {
          const c = S.rig(camera, keys, t, { t0: 0, t1: dur, float: 0.03 }); fx.focus(c.dist);
          for (const fl of flows) {
            const k = S.inOut(S.range(t, fl.at, fl.at + 0.9)); fl.tube.geometry.setDrawRange(0, Math.floor(fl.tube.geometry.index.count * k / 3) * 3); fl.tube.visible = k > 0;
            fl.bills.forEach((b, j) => { const u = ((t - fl.at - 0.6) * 0.35 + j / fl.bills.length) % 1; const show = t > fl.at + 0.6 + j * 0.2; b.visible = show; if (show) { const p = fl.curve.getPointAt(Math.max(0, u)); b.position.copy(p); b.rotation.y = t * 2 + j; } });
            const nx = flows[flows.indexOf(fl) + 1], off = P0.keepPills || !nx ? 1 : 1 - S.range(t, nx.at, nx.at + 0.3);
            const q = fl.curve.getPoint(0.5).project(camera); fl.pillEl.at((q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080 - 14, q.z < 1 && !P0.noPills ? S.range(t, fl.at + 0.5, fl.at + 0.9) * off : 0);
          }
          for (const tw of Object.values(towers)) { const lb = tw.userData.label; if (lb) { const w = lb.getWorldPosition(new THREE.Vector3()); lb.lookAt(camera.position.x, w.y, camera.position.z); } }
          for (const [n, tw] of Object.entries(towers)) { const hot = !P0.hot || P0.hot.includes(n); tw.userData.label && (tw.userData.label.material.opacity = hot ? 1 : 0.35, tw.userData.label.material.transparent = true); }
          cap?.type(t); st.contact.update([st.cyc]);
        },
      };
    },

    // ================================================================ campus: a gigawatt data-center campus (Ohio): halls, substation, power lines; pills pop on cues
    // params: pills [{ text, at, red, target: 'tenant'|'guarantor'|'chips'|'power' }], homes (bool: carpet of homes for the GW comparison), caption, source
    async campus(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 4000);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 40, az: 135, el: 50, color: '#e9ece4', fog: [200, 600], contact: false });
      const ground = new THREE.Mesh(new THREE.CylinderGeometry(62, 62, 3, 128), [S.clay('#b9a68a', { rough: 0.9 }), S.clay('#cfdcc6', { rough: 0.9 }), S.clay('#b9a68a', { rough: 0.9 })]); ground.position.y = -1.5; ground.receiveShadow = true; scene.add(ground);
      for (let i = 0; i < 8; i++) { const h = datacenter({ w: 16, d: 7, h: 3.2 }); h.position.set(-18 + (i % 4) * 12, 0, -10 + Math.floor(i / 4) * 12); h.rotation.y = Math.PI / 2; scene.add(h); }
      // substation + transmission towers
      const sub = new THREE.Mesh(S.roundBox(10, 0.4, 8, 0.1), S.clay('#9aa3ad')); sub.position.set(28, 0, 10); scene.add(sub);
      for (let i = 0; i < 6; i++) { const tr = new THREE.Mesh(S.roundBox(0.8, 2.6, 0.8, 0.1), S.clay('#5b6b80')); tr.position.set(25 + (i % 3) * 3, 0.4, 8 + Math.floor(i / 3) * 4); tr.castShadow = true; scene.add(tr); }
      const pylons = []; for (let i = 0; i < 5; i++) { const d = PR.derrick({ h: 9, color: '#8a939e' }); d.scale.set(0.6, 1, 0.6); d.position.set(36 + i * 10, 0, 22 + i * 7); scene.add(d); pylons.push(d); }
      const wireM = new THREE.MeshStandardMaterial({ color: '#3b4250' });
      for (let i = 0; i < pylons.length - 1; i++) { const a = pylons[i].position, b = pylons[i + 1].position; const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a.x, 9, a.z), new THREE.Vector3((a.x + b.x) / 2, 7.2, (a.z + b.z) / 2), new THREE.Vector3(b.x, 9, b.z)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 20, 0.05, 6), wireM)); }
      const targets = { tenant: [-16, 6, -12], guarantor: [14, 8, -2], chips: [-10, 4, 14], power: [28, 4, 10] };
      const layer = H.layerOf(ctx);
      const pills = (P0.pills ?? []).map((p, i) => ({ ...p, el: H.pill(layer, p.text, { size: 28, dot: p.red ? '#e0241b' : null }), at: S.cue(shot, p.at, 0.8 + i * 1.3) }));
      const cap = P0.caption === null ? null : H.caption(layer, P0.caption ?? 'PIKE COUNTY, OHIO · 4.25 GW', 'left:5.5%;top:7.5%', { at: 0.35 }); const src = H.sourceLine(layer, P0.source ?? 'SOURCE: NVIDIA 8-K, 17 AUG 2026 · ILLUSTRATION');
      st.applyEnv();
      if (P0.sky !== false) { const { paintedSky } = await import('./thumbs.js'); scene.background = paintedSky(P0.seed ?? 6); scene.fog = null; st.cyc.visible = false; }
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 1.2, intensity: 1.6, falloff: 0.8 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const dur = shot.duration ?? 8;
      const keys = P0.camera ?? [{ pos: [-46, 44, 60], look: [4, 0, 2], mm: 32 }, { pos: [-34, 36, 56], look: [6, 0, 2], mm: 32 }];
      return { scene, camera, layer, update(t) {
        S.rig(camera, keys, t, { t0: 0, t1: dur, float: 0.04 });
        for (const p of pills) { const q = v3(targets[p.target] ?? [0, 6, 0]).project(camera); p.el.at((q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080, S.range(t, p.at, p.at + 0.35)); }
        cap?.type(t);
      } };
    },

    // ================================================================ gpu: hero product shot of an AI chip (package + HBM stacks on a board), slow turn, optional price/label
    async gpu(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.05, 500);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 4, az: 120, el: 50, contact: { w: 10, d: 10, blur: 2.4, darkness: 1.2, opacity: 0.7 } });
      const G = new THREE.Group(); scene.add(G);
      const pcb = new THREE.Mesh(S.roundBox(6, 0.12, 4.2, 0.05), S.glossy('#14181d', { rough: 0.3, coat: 1 })); pcb.castShadow = pcb.receiveShadow = true; G.add(pcb);
      const edge = new THREE.Mesh(S.roundBox(6.02, 0.02, 0.25, 0.01), S.goldMat()); edge.position.set(0, 0.1, 2.0); G.add(edge);
      const sub = new THREE.Mesh(S.roundBox(3.6, 0.12, 3.0, 0.05), S.glossy('#2a5c2a', { rough: 0.4 })); sub.position.y = 0.12; G.add(sub);
      const die = new THREE.Mesh(S.roundBox(1.9, 0.22, 1.6, 0.04), S.polishedSilver({ rough: 0.18 })); die.position.y = 0.24; die.castShadow = true; G.add(die);
      const lab = PR.labelPlane(P0.label ?? 'AI CHIP', { w: 1.2, h: 0.28, bg: null, color: '#3b4250', family: 'Plex Mono', font: '600' }); lab.rotation.x = -Math.PI / 2; lab.position.set(0, 0.465, 0); G.add(lab);
      for (let i = 0; i < 6; i++) { const hbm = new THREE.Mesh(S.roundBox(0.55, 0.3, 0.7, 0.03), S.glossy('#1b1d22', { rough: 0.35, coat: 1 })); hbm.position.set(i < 3 ? -1.35 : 1.35, 0.24, (i % 3 - 1) * 0.85); hbm.castShadow = true; G.add(hbm); }
      for (let i = 0; i < 40; i++) { const cap = new THREE.Mesh(S.roundBox(0.12, 0.06, 0.07, 0.01), S.clay('#c9a45a')); cap.position.set(-2.6 + (i % 20) * 0.27, 0.1, i < 20 ? -1.85 : 1.6); G.add(cap); }
      const layer = H.layerOf(ctx); const cap = P0.caption ? H.caption(layer, P0.caption, 'left:5.5%;top:7.5%', { at: 0.35 }) : null; H.sourceLine(layer, P0.source ?? null);
      st.applyEnv();
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.15, intensity: 1.6, falloff: 0.8 }, dof: { focus: 9, range: 1.6, bokeh: 4 }, bloom: { intensity: 0.4, threshold: 1.4 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const dur = shot.duration ?? 6;
      return { scene, camera, layer, update(t) { G.rotation.y = -0.5 + t / dur * 0.6; const c = S.rig(camera, P0.camera ?? [{ pos: [6.2, 4.8, 9.4], look: [0, 0.2, 0], mm: 55 }, { pos: [4.8, 3.8, 8.0], look: [0, 0.2, 0], mm: 60 }], t, { t0: 0, t1: dur, float: 0.01 }); fx.focus(c.dist); cap?.type(t); st.contact.update([st.cyc]); } };
    },

    // ================================================================ dominoes: the chain. Labelled slabs topple one after another (cue per slab)
    // params: labels [..], at [cues] (one per slab), red (index of the red slab, default last), caption, source
    async dominoes(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const labels = P0.labels ?? ['INTEREST RATES', 'AI CLOUDS', 'THE BUILDERS', 'OPENAI', 'THE GUARANTEES', 'YOUR FUND'];
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 2000);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 18, az: 140, el: 46, contact: { w: 50, d: 20, blur: 2.4, darkness: 1.1, opacity: 0.6 } });
      const H0 = 7, W0 = 3.4, T0 = 0.9, gap = 4.2; const slabs = [];
      labels.forEach((l, i) => {
        const piv = new THREE.Group(); piv.position.set(i * gap - (labels.length - 1) * gap / 2, 0, 0); scene.add(piv);
        const red = i === (P0.red ?? labels.length - 1);
        const m = new THREE.Mesh(S.roundBox(T0, H0, W0, 0.12), S.glossy(red ? '#e0241b' : '#f4f2ee', { rough: 0.3, coat: 0.8 })); m.position.x = T0 / 2; m.castShadow = m.receiveShadow = true; piv.add(m);
        const lp = PR.labelPlane(l, { w: H0 * 0.86, h: 0.75, bg: null, color: red ? '#ffffff' : '#14233d' }); lp.rotation.set(0, -Math.PI / 2, Math.PI / 2); lp.position.set(-0.005, H0 / 2, 0); piv.add(lp);
        const num = PR.labelPlane(String(i + 1), { w: 0.9, h: 0.9, bg: null, color: red ? '#ffffff' : '#9aa1ab' }); num.rotation.set(0, -Math.PI / 2, 0); num.position.set(-0.005, H0 - 0.9, 0); piv.add(num);
        slabs.push({ piv, at: S.cue(shot, (P0.at ?? [])[i], 0.8 + i * 1.1) });
      });
      const layer = H.layerOf(ctx); const cap = P0.caption === null ? null : H.caption(layer, P0.caption ?? 'HOW IT COULD POP · A CHAIN, NOT A PREDICTION', 'left:5.5%;top:7.5%', { at: 0.35 }); H.sourceLine(layer, P0.source ?? 'ILLUSTRATION');
      st.applyEnv();
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 1.8, falloff: 0.8 }, dof: { focus: 30, range: 10, bokeh: 2 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const dur = shot.duration ?? 10, lean = Math.atan2(gap - T0, H0) ; // resting angle on the next slab
      const n = slabs.length, x0 = -(n - 1) * gap / 2;
      return { scene, camera, layer, update(t) {
        // camera follows the falling front
        let front = 0; slabs.forEach((s, i) => { if (t > s.at) front = i; });
        for (let i = 0; i < n; i++) { const s = slabs[i]; const d = t - s.at; const target = i === n - 1 ? Math.PI / 2 - 0.02 : Math.asin(Math.min(1, (gap - T0) / H0));
          const k = d <= 0 ? 0 : Math.min(1, (d / 0.55) ** 2); const settle = d > 0.55 ? Math.sin((d - 0.55) * 16) * Math.exp(-(d - 0.55) * 7) * 0.03 : 0;
          s.piv.rotation.z = -(target * k + settle); }
        const fxp = x0 + front * gap;
        const c = S.rig(camera, P0.camera ?? [{ pos: [x0 - 14, 7, 14], look: [x0 + 5, 3.4, 0], mm: 32 }, { pos: [fxp - 13, 8, 14], look: [fxp + 4, 2.8, 0], mm: 32 }, { pos: [-x0 * 0.2 - 10, 13, 16], look: [-x0 * 0.45, 1.2, 0], mm: 32 }], t, { t0: 0, t1: dur, float: 0.03 }); fx.focus(c.dist);
        cap?.type(t); st.contact.update([st.cyc]);
      } };
    },

    // ================================================================ fund: your S&P 500 index fund as 500 blocks, volume ∝ weight. The Magnificent 7 rise as red towers.
    // params: at (cue: the 7 rise), nvAt (cue: Nvidia alone highlights), caption, source
    async fund(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 2000);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 18, az: 140, el: 48, contact: { w: 50, d: 40, blur: 2.4, darkness: 1.0, opacity: 0.55 } });
      // 493 small blocks share 65.3%; 7 big ones share 34.7% (heights ∝ weight on equal footprints)
      const tray = new THREE.Mesh(S.roundBox(36, 0.4, 22, 0.15), S.clay('#f4f2ee', { rough: 0.6, coat: 0.3 })); tray.position.y = -0.4; tray.receiveShadow = true; scene.add(tray);
      const small = new THREE.InstancedMesh(S.roundBox(1, 1, 1, 0.08, 2), S.clay('#dfe4ea', { rough: 0.5 }), 493); small.castShadow = small.receiveShadow = true; scene.add(small);
      const hSmall = 65.3 / 493 * 8; // height units per block
      for (let i = 0; i < 493; i++) { const x = -16.5 + (i % 29) * 1.15, z = -9.2 + Math.floor(i / 29) * 1.15; S.place(small, i, [x, 0, z], [0, 0, 0], [1, Math.max(0.12, hSmall * (0.4 + S.hash(i) * 1.2)), 1]); }
      small.instanceMatrix.needsUpdate = true;
      const w7 = [7.93, 6.9, 6.2, 4.3, 3.6, 3.2, 2.57]; // illustrative split summing to 34.7 (SPY, 19 Oct 2026: Nvidia 7.93; Mag 7 total 34.7)
      const bigs = w7.map((w, i) => { const m = new THREE.Mesh(S.roundBox(1, 1, 1, 0.08, 2), S.glossy(i === 0 && P0.nvRed ? '#e0241b' : '#e0241b', { rough: 0.3, coat: 0.9 })); m.castShadow = true; m.position.set(-16.5 + (29 + 1.5) * 1.15 + 0.6 + (i % 2) * 1.6, 0, -9.2 + i * 2.6 - 1); m.userData.h = w * 8 * 0.32; scene.add(m); return m; });
      const layer = H.layerOf(ctx);
      const pill7 = H.pill(layer, P0.pill7 ?? '7 COMPANIES · 34.7%', { size: 30, dot: '#e0241b' }), pillR = H.pill(layer, P0.pillRest ?? '493 COMPANIES · 65.3%', { size: 26 });
      const cap = P0.caption === null ? null : H.caption(layer, P0.caption ?? 'AN S&P 500 INDEX FUND', 'left:5.5%;top:7.5%', { at: 0.35 }); H.sourceLine(layer, P0.source ?? 'SOURCE: SPY HOLDINGS, 19 OCT 2026 · WEIGHTS ILLUSTRATIVE WITHIN THE 7');
      st.applyEnv();
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 1.6, falloff: 0.8 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const dur = shot.duration ?? 8, at = S.cue(shot, P0.at, 1.2);
      return { scene, camera, layer, update(t) {
        bigs.forEach((m, i) => { const s = S.spring(t - at - i * 0.12, { zeta: 0.5, freq: 1.6 }); const h = Math.max(0.05, m.userData.h * s); m.scale.set(1.4, h, 2.2); });
        S.rig(camera, P0.camera ?? [{ pos: [-36, 30, 48], look: [3, 5, 0], mm: 30 }, { pos: [-26, 26, 48], look: [6, 6, 0], mm: 30 }], t, { t0: 0, t1: dur, float: 0.03 });
        const q = v3([bigs[3].position.x + 0.8, 11.5, bigs[3].position.z]).project(camera); pill7.at((q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080, S.range(t, at + 0.8, at + 1.2));
        const r = v3([-2, 3, 0]).project(camera); pillR.at((r.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-r.y * 0.5 + 0.5) * 1080, S.range(t, at + 1.2, at + 1.6));
        cap?.type(t); st.contact.update([st.cyc]);
      } };
    },

    // ================================================================ bubble (hero): params
    //   mode 'reveal' (camera pushes from the money to the bubble) | 'float' (slow orbit) | 'needle' (a red needle approaches)
    //   | 'pop' (needle touches at popAt: film bursts into droplets, the economy drops and the money scatters)
    //   labels (tower names), popAt (cue), caption, source, sky (true: blue sky backdrop instead of studio)
    async bubble(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'float';
      await PR.loadFont();
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 3000);
      const st = S.studio(scene, ctx.renderer, { target: [0, 0, 0], span: 16, az: 130, el: 48, fog: [120, 320], contact: { w: 40, d: 40, blur: 3, darkness: 1.0, opacity: 0.6 } });
      const R = 13, lift = P0.lift ?? 3.5;
      const world = new THREE.Group(); world.position.y = lift; scene.add(world);
      const eco = economy({ labels: P0.labels ?? ['NVIDIA', 'OPENAI', 'ORACLE'] }); world.add(eco);
      const film = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), bubbleMat({ strength: P0.film ?? 1 })); film.position.y = 4; film.renderOrder = 2; world.add(film);
      // needle
      const needle = new THREE.Group(); const nm = S.polishedSilver({ rough: 0.08 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 14, 24).translate(0, 7, 0), nm); shaft.castShadow = true; needle.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1.2, 24).translate(0, -0.6, 0).rotateZ(Math.PI), nm); needle.add(tip);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 20), S.glossy('#e0241b', { rough: 0.25, coat: 1 })); head.position.y = 14.4; needle.add(head);
      needle.rotation.z = -Math.PI / 2 - 0.35; needle.visible = mode === 'needle' || mode === 'pop'; world.add(needle);
      // droplets for the pop
      const ND = 420, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 0, iridescence: 1, transparent: true, opacity: 0.7, envMapIntensity: 2 }), ND);
      const dirs = []; const r = S.rng(11); for (let i = 0; i < ND; i++) { const u = r() * 2 - 1, a = r() * 6.283; const s = Math.sqrt(1 - u * u); dirs.push([s * Math.cos(a), u, s * Math.sin(a), 0.6 + r() * 0.8]); }
      drops.visible = false; world.add(drops);
      st.applyEnv();
      if (P0.sky !== false) { const { paintedSky } = await import('./thumbs.js'); scene.background = paintedSky(P0.seed ?? 7); scene.fog = null; st.cyc.visible = false; st.contact.plane.visible = false; }
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 1.6, falloff: 0.8 }, dof: { focus: 40, range: 14, bokeh: 2.0 }, bloom: { intensity: 0.5, threshold: 1.4, radius: 0.6 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
      const layer = H.layerOf(ctx);
      const cap = P0.caption ? H.caption(layer, P0.caption, 'left:5.5%;top:7.5%', { at: 0.35 }) : null;
      const src = H.sourceLine(layer, P0.source ?? null);
      const pills = (P0.pills ?? []).map(p => ({ ...p, el: H.pill(layer, p.text, { size: 26, dot: p.red ? '#e0241b' : null }) }));
      const dur = shot.duration ?? 8, popAt = S.cue(shot, P0.popAt, dur * 0.6), needleAt = S.cue(shot, P0.needleAt, 0.3);
      const keys = P0.camera ?? {
        reveal: [{ pos: [3, lift + 5.2, 9], look: [0, lift + 4, -1], mm: 32 }, { pos: [10, lift + 10, 36], look: [0, lift + 4, 0], mm: 35 }, { pos: [16, lift + 13, 52], look: [0, lift + 4, 0], mm: 35 }],
        float: [{ pos: [30, lift + 12, 44], look: [0, lift + 4, 0], mm: 35 }, { pos: [6, lift + 14, 54], look: [0, lift + 4, 0], mm: 35 }],
        needle: [{ pos: [-18, lift + 9, 50], look: [2, lift + 4, 0], mm: 35 }, { pos: [-10, lift + 8, 46], look: [4, lift + 4.5, 0], mm: 38 }],
        pop: [{ pos: [-14, lift + 9, 48], look: [3, lift + 4, 0], mm: 35 }, { pos: [-12, lift + 10, 52], look: [2, lift + 3, 0], mm: 34 }],
      }[mode];
      return {
        scene, camera, layer,
        update(t) {
          const c = S.rig(camera, keys, t, { t0: 0, t1: dur, float: 0.04 }); fx.focus(c.dist);
          eco.userData.loop.userData.set(t, P0.speed ?? 0.06); film.material.uniforms.time.value = t;
          // the film breathes (tiny wobble) and swirls (rotate)
          const pop = mode === 'pop' ? t - popAt : -1;
          film.rotation.y = t * 0.05; film.scale.set(1 + Math.sin(t * 1.3) * 0.006, 1 + Math.sin(t * 1.1 + 1) * 0.008, 1 + Math.sin(t * 1.7 + 2) * 0.006);
          // needle: slides in from the right toward the film
          if (needle.visible) { const k = S.inOut(S.range(t, needleAt, mode === 'pop' ? popAt : dur)); const d = mode === 'pop' ? S.lerp(R + 9, R - 0.1, k) : S.lerp(R + 14, R + 1.2, k);
            needle.position.set(Math.cos(0.35) * d, 4 + Math.sin(0.35) * d, 0.0); }
          film.visible = pop < 0; drops.visible = pop >= 0 && pop < 2.5;
          if (pop >= 0) { for (let i = 0; i < ND; i++) { const [x, y, z, s] = dirs[i]; const rr = R + pop * 9 * s; const g = 4 + y * rr - 9.8 * pop * pop * 0.6; S.place(drops, i, [x * rr, g, z * rr], [0, 0, 0], Math.max(0.0001, 1 - pop / 2.5)); } drops.instanceMatrix.needsUpdate = true;
            // the economy drops a little and the money loop scatters downward
            world.position.y = lift - Math.min(lift - 0.3, 0.5 * 9.8 * Math.max(0, pop - 0.15) ** 2); world.rotation.z = Math.min(0.06, Math.max(0, pop - 0.3) * 0.08); }
          else world.position.y = lift + Math.sin(t * 0.8) * 0.15;
          cap?.type(t);
          for (const p of pills) { const [x, y, vis] = (() => { const q = v3(p.at).add(world.position).project(camera); return [(q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080, q.z < 1]; })(); p.el.at(x, y, vis ? S.range(t, S.cue(shot, p.word, 0.8), S.cue(shot, p.word, 0.8) + 0.3) : 0); }
          if (st.contact.plane.visible) st.contact.update([st.cyc]);
        },
      };
    },
  };
}
