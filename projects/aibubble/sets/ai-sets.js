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
